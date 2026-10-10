import { afterEach, expect, it, vi } from 'vitest';

/** MediaPipe's video graph: each call's time must be later than the last (a warm-up is time 0). */
class FakePose {
  static made: FakePose[] = [];
  backend: 'GPU' | 'CPU'; last = -Infinity;
  constructor(_variant: string, _select: unknown, delegate: 'GPU' | 'CPU') { this.backend = delegate; FakePose.made.push(this); }
  async initialize(_signal: AbortSignal, status: (text: string) => void) { status('映像処理を準備しています。'); }
  warm() { this.take(0); }
  estimate(_image: unknown, _frame: number, pts: number) { this.take(pts * 1000 + 1); return { landmarks: pts >= 1 ? [[{ x: .5, y: .5, visibility: 1 }]] : [], inferenceMs: 1 }; }
  take(time: number) { if (time <= this.last) throw new Error('Packet timestamp mismatch'); this.last = time; }
  dispose() {}
}
vi.mock('../src/cmj/mobile-pose', () => ({ MobileCMJPose: FakePose }));
afterEach(() => { vi.unstubAllGlobals(); FakePose.made = []; });

it('keeps the squat camera going after the GPU found nobody and the CPU took over (the athlete walking into place)', async () => {
  const sent: { id?: number; result?: { landmarks: unknown[]; backend: string }; error?: string }[] = [];
  const scope: { postMessage: (v: never) => void; onmessage: ((e: { data: unknown }) => Promise<void>) | null } = { postMessage: v => sent.push(v), onmessage: null };
  vi.stubGlobal('self', scope);
  await import('../src/strength/live-worker');
  await scope.onmessage!({ data: { type: 'init', id: 0 } });
  // 1 s with nobody at 30 frames a second, then the athlete.
  for (let n = 0; n < 45; n++) await scope.onmessage!({ data: { type: 'frame', id: n + 1, image: { close: () => undefined }, frame: n, pts: n / 30 } });
  const frames = sent.filter(m => m.id && m.id > 0);
  expect(frames.filter(m => m.error)).toEqual([]);
  expect(frames).toHaveLength(45);
  expect(frames.at(-1)!.result!.backend).toBe('CPU');
  expect(frames.at(-1)!.result!.landmarks).toHaveLength(1);
  expect(FakePose.made.map(p => p.backend)).toEqual(['GPU', 'CPU']);
  // Nothing said on the page after the start (the CPU made quietly).
  expect(sent.filter(m => 'status' in m && sent.indexOf(m) > sent.findIndex(x => x.id === 0))).toEqual([]);
});
