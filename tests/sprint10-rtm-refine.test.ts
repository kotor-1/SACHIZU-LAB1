import { describe, expect, it, vi } from 'vitest';
vi.mock('onnxruntime-web', () => ({ env: { wasm: {} }, InferenceSession: { create: vi.fn() }, Tensor: class {} }));
import { cropOf, decodePose } from '../src/sprint10/rtm-refine';
import { anglePose, type CrouchFrame, type CrouchPoint } from '../src/sprint10/crouch';

describe('RTMPose refinement (crouch start angles)', () => {
  it('cuts a 3:4 window 1.25 times the pose box around its centre', () => {
    const pose: CrouchPoint[] = [{ x: .4, y: .3 }, { x: .6, y: .3 }, { x: .4, y: .7 }, { x: .6, y: .7 }, { x: .5, y: .5 }];
    const c = cropOf(pose, 1920, 1080)!;
    expect(c.cx).toBeCloseTo(960, 6); expect(c.cy).toBeCloseTo(540, 6);
    // Box 384 x 432 px -> 480 x 540 -> widened to 3:4: 540 tall needs 405 wide, so 480 wide makes it 640 tall.
    expect(c.scale * 192).toBeCloseTo(480, 6); expect(c.scale * 256).toBeCloseTo(640, 6);
    expect(cropOf(pose.slice(0, 3), 1920, 1080)).toBeNull();
  });
  it('turns the SimCC peaks into the picture position of each keypoint, in MediaPipe indices', () => {
    const K = 26, NX = 384, NY = 512, x = new Float32Array(K * NX), y = new Float32Array(K * NY);
    // Halpe 13 (left knee) at input (100, 50) with score 0.8; Halpe 20 (left big toe) at (10, 240).
    x[13 * NX + 200] = .8; y[13 * NY + 100] = .9; x[20 * NX + 20] = .7; y[20 * NY + 480] = .6;
    const crop = { cx: 1000, cy: 500, scale: 2 }, pose = decodePose(x, y, crop, 2000, 1000);
    expect(pose).toHaveLength(33);
    expect(pose[25].x * 2000).toBeCloseTo(1000 + (100 - 96) * 2, 6); expect(pose[25].y * 1000).toBeCloseTo(500 + (50 - 128) * 2, 6);
    expect(pose[25].visibility).toBeCloseTo(.8, 6);
    expect(pose[31].x * 2000).toBeCloseTo(1000 + (10 - 96) * 2, 6); expect(pose[31].y * 1000).toBeCloseTo(500 + (240 - 128) * 2, 6);
    expect(pose[1].visibility).toBe(0);   // no Halpe point: not used
  });
  it('uses the refined pose for the angles when there is one', () => {
    const frames: CrouchFrame[] = [{ frame: 0, pts: 0, pose: [{ x: .1, y: .1 }], refined: [{ x: .2, y: .2 }] }, { frame: 1, pts: 0, pose: [{ x: .1, y: .1 }] }];
    expect(anglePose(frames[0])![0].x).toBe(.2); expect(anglePose(frames[1])![0].x).toBe(.1);
  });
});

describe('a model that stops answering', () => {
  it('gives up an operation that does not settle in time, and lets one that does through', async () => {
    vi.useFakeTimers();
    const { withinTime } = await import('../src/cmj/session-lifecycle');
    const hung = withinTime(new Promise(() => {}), 20_000, '骨格モデル'), rejected = expect(hung).rejects.toThrow('骨格モデルが20秒たっても応答しません');
    await vi.advanceTimersByTimeAsync(20_001); await rejected;
    await expect(withinTime(Promise.resolve(7), 20_000, 'x')).resolves.toBe(7);
    vi.useRealTimers();
  });
  it('reads a frame on WebAssembly when a WebGPU run does not answer, and keeps going from there', async () => {
    vi.useFakeTimers();
    const ort = await import('onnxruntime-web');
    const out = { simcc_x: { data: new Float32Array(26 * 576) }, simcc_y: { data: new Float32Array(26 * 768) } };
    const gpu = { run: vi.fn(() => new Promise(() => {})), release: vi.fn(async () => {}) }, cpu = { run: vi.fn(async () => out), release: vi.fn(async () => {}) };
    (ort.InferenceSession.create as unknown as ReturnType<typeof vi.fn>).mockImplementation(async (_b: unknown, o: { executionProviders: string[] }) => o.executionProviders[0] === 'webgpu' ? gpu : cpu);
    vi.stubGlobal('navigator', { gpu: {} });
    vi.stubGlobal('caches', undefined);
    vi.stubGlobal('fetch', vi.fn(async () => new Response(new Uint8Array([1]))));
    vi.stubGlobal('document', { createElement: () => ({ width: 0, height: 0, getContext: () => ({ clearRect() {}, drawImage() {}, getImageData: () => ({ data: new Uint8ClampedArray(192 * 256 * 4) }) }) }) });
    // The model's bytes taken as the real model's (its SHA-256 answered as the expected one).
    const { RTM_MODEL_SHA256 } = await import('../src/sprint10/rtm-refine');
    vi.spyOn(globalThis.crypto.subtle, 'digest').mockImplementation(async () => new Uint8Array(RTM_MODEL_SHA256.match(/../g)!.map(x => parseInt(x, 16))).buffer);
    const { loadRefiner } = await import('../src/sprint10/rtm-refine');
    const refiner = await loadRefiner(new AbortController().signal, () => {});
    expect(refiner.backend).toBe('webgpu');
    const pose = Array.from({ length: 33 }, (_, i) => ({ x: .4 + (i % 5) * .03, y: .2 + Math.floor(i / 5) * .08, visibility: .9 }));
    const source = { width: 1920, height: 1080 } as HTMLCanvasElement;
    const read = refiner.refine(source, pose);
    await vi.advanceTimersByTimeAsync(20_001);
    expect(await read).not.toBeNull();
    expect(refiner.backend).toBe('wasm');
    expect(cpu.run).toHaveBeenCalledTimes(1); expect(gpu.release).toHaveBeenCalled();
    vi.useRealTimers(); vi.unstubAllGlobals(); vi.restoreAllMocks();
  });
});
