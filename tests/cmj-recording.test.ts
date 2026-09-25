import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { measureRecording } from '../src/cmj/recording-session';
import type { SessionUpdate } from '../src/cmj/video-session';
import { untilAborted } from '../src/cmj/session-lifecycle';

const fake = vi.hoisted(() => ({ decode: vi.fn(), dispose: vi.fn(), estimate: vi.fn(), close: vi.fn(), cache: vi.fn(), init: vi.fn(), model: vi.fn() }));
vi.mock('../src/frame-engine/mp4-demuxer', () => ({ demuxMP4: vi.fn(async () => ({
  frames: [0, .012, .033, .048].map((pts, frameIndex) => ({ pts, frameIndex })),
  videoTrack: {}, rawSamples: [],
})) }));
vi.mock('../src/cmj/sequential-decoder', () => ({ SequentialRecordingDecoder: class {
  decodeExactFrame = fake.decode; dispose = fake.dispose; diagnostics = {};
} }));
vi.mock('../src/cmj/mobile-pose', () => ({ MobileCMJPose: class {
  constructor(readonly variant = 'full') { fake.model(variant); }
  initialize = fake.init; estimate = fake.estimate; dispose = fake.close;
} }));

const input = { size: 1000, name: 'jump.mp4' } as File;
const canvas = () => ({ width: 0, height: 0, getContext: () => ({ translate: vi.fn(), rotate: vi.fn(), scale: vi.fn(), drawImage: vi.fn(), setTransform: vi.fn() }) }) as unknown as HTMLCanvasElement;
beforeEach(() => {
  vi.clearAllMocks(); fake.init.mockResolvedValue(undefined);
  fake.decode.mockImplementation(async index => ({ status: 'SUCCESS', actualDecodedFrameIndex: index, bitmap: { width: 720, height: 1280 } }));
  fake.estimate.mockImplementation((_canvas, frame, pts) => ({ comSample: { frame, pts, comX: 400, comY: 500, bodyScale: 500 }, landmarks: [], inferenceMs: 200 }));
});
afterEach(() => vi.useRealTimers());

describe('recorded source-frame analysis', () => {
  it('uses Heavy only for an explicit observation comparison, retaining Full for CMJ', async () => {
    for (const analysis of ['OBSERVATIONS', 'CMJ'] as const) {
      const updates: SessionUpdate[] = [];
      await measureRecording(input, canvas(), new AbortController().signal, s => updates.push(s), undefined,
        { analysis, observationModel: 'heavy' });
      const expected = analysis === 'OBSERVATIONS' ? 'heavy' : 'full';
      expect(fake.model).toHaveBeenLastCalledWith(expected);
      expect(updates.at(-1)?.poseModel).toBe(expected);
    }
  });
  it('exposes exact observations without running CMJ analysis in RJ mode', async () => {
    const samples = vi.fn(), poses = vi.fn(), updates: SessionUpdate[] = [];
    await measureRecording(input, canvas(), new AbortController().signal, s => updates.push(s), undefined,
      { analysis: 'OBSERVATIONS', onSample: samples, onPose: poses });
    expect(samples.mock.calls.map(c => [c[0].frame, c[0].pts])).toEqual([[0, 0], [1, .012], [2, .033], [3, .048]]);
    expect(updates.at(-1)?.results).toEqual([]);
    expect(poses.mock.calls.map(c => [c[1], c[2]])).toEqual([[0, 0], [1, .012], [2, .033], [3, .048]]);
  });
  it('processes every source frame and exact PTS even with a slow inference backend', async () => {
    const updates: SessionUpdate[] = [];
    const summary = await measureRecording(input, canvas(), new AbortController().signal, s => updates.push(s));
    expect(fake.decode.mock.calls.map(c => c[0])).toEqual([0, 1, 2, 3]);
    expect(fake.estimate.mock.calls.map(c => [c[1], c[2]])).toEqual([[0, 0], [1, .012], [2, .033], [3, .048]]);
    expect(updates.at(-1)).toMatchObject({ processedFrames: 4, totalFrames: 4, acquisition: 'EXACT_FRAMES' });
    expect(summary.estimateCount).toBe(0);
    expect(fake.dispose).toHaveBeenCalled(); expect(fake.close).toHaveBeenCalled();
  });
  it('stops between frames on cancellation and never reports a completed result', async () => {
    const control = new AbortController(); const updates: SessionUpdate[] = [];
    await expect(measureRecording(input, canvas(), control.signal, s => { updates.push(s); control.abort(); })).rejects.toMatchObject({ name: 'AbortError' });
    expect(fake.estimate).toHaveBeenCalledTimes(1);
    expect(updates).toHaveLength(1); expect(fake.close).toHaveBeenCalled();
  });
  it('rejects a mismatched decoded frame instead of relabelling it with the requested time', async () => {
    fake.decode.mockResolvedValueOnce({ status: 'SUCCESS', actualDecodedFrameIndex: 3, bitmap: { width: 720, height: 1280 } });
    await expect(measureRecording(input, canvas(), new AbortController().signal, vi.fn())).rejects.toThrow('フレームを読み出せません');
    expect(fake.estimate).not.toHaveBeenCalled(); expect(fake.dispose).toHaveBeenCalled();
  });
  it('cancels a pending decode without waiting for a frame to arrive', async () => {
    fake.decode.mockImplementation(() => new Promise(() => {}));
    const control = new AbortController();
    const promise = measureRecording(input, canvas(), control.signal, vi.fn());
    const assertion = expect(promise).rejects.toMatchObject({ name: 'AbortError' });
    await vi.waitFor(() => expect(fake.decode).toHaveBeenCalled());
    control.abort(); await assertion; expect(fake.close).toHaveBeenCalled();
  });
});
describe('pending browser operation cancellation', () => {
  it('settles on abort and consumes a later rejection', async () => {
    const control = new AbortController(); let fail!: (error: Error) => void;
    const pending = new Promise<void>((_resolve, reject) => { fail = reject; });
    const result = untilAborted(pending, control.signal);
    const assertion = expect(result).rejects.toMatchObject({ name: 'AbortError' });
    control.abort(); await assertion; fail(new Error('late browser error')); await Promise.resolve();
  });
});
