import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { measureSprint } from '../src/sprint10/recording';
import { analyzeSprint } from '../src/sprint10/analysis';

const fake = vi.hoisted(() => ({
  available: true, demux: vi.fn(), decode: vi.fn(), skip: vi.fn(), initialize: vi.fn(), estimate: vi.fn(),
  decoderDispose: vi.fn(), modelDispose: vi.fn(), decoderConstruct: vi.fn(), modelConstruct: vi.fn(),
  contexts: [] as { setTransform: ReturnType<typeof vi.fn>; clearRect: ReturnType<typeof vi.fn>;
    translate: ReturnType<typeof vi.fn>; rotate: ReturnType<typeof vi.fn>; drawImage: ReturnType<typeof vi.fn> }[],
}));
vi.mock('../src/frame-engine/mp4-demuxer', () => ({ demuxMP4: fake.demux }));
vi.mock('../src/cmj/sequential-decoder', () => ({ SequentialRecordingDecoder: class {
  static isAvailable() { return fake.available; }
  constructor() { fake.decoderConstruct(); }
  decodeExactFrame = fake.decode;
  skipExactFrame = fake.skip;
  dispose = fake.decoderDispose;
} }));
vi.mock('../src/cmj/mobile-pose', () => ({ MobileCMJPose: class {
  constructor(...args: unknown[]) { fake.modelConstruct(...args); }
  initialize = fake.initialize; estimate = fake.estimate; dispose = fake.modelDispose;
} }));

const file = { name: 'sprint.mov', size: 100 } as File;
const frames = [0.123, 0.14, 0.175].map((pts, frameIndex) => ({ pts, frameIndex }));
const demuxed = () => ({ frames, videoTrack: {}, rawSamples: [], descriptionBuffer: undefined });
const pose = () => Array.from({ length: 33 }, (_, i) => ({
  x: i === 27 ? .4 : i === 28 ? .6 : .5,
  y: i >= 27 ? .85 : i >= 25 ? .7 : i >= 23 ? .6 : .3, visibility: 1,
}));
beforeEach(() => {
  vi.clearAllMocks(); fake.contexts.length = 0; fake.available = true;
  fake.demux.mockResolvedValue(demuxed()); fake.initialize.mockResolvedValue(undefined); fake.skip.mockResolvedValue(undefined);
  fake.decode.mockImplementation(async (frameIndex: number) => ({ status: 'SUCCESS', actualDecodedFrameIndex: frameIndex,
    bitmap: { width: 1920, height: 1080 } }));
  fake.estimate.mockImplementation(() => ({ landmarks: [pose()] }));
  vi.stubGlobal('document', { createElement: () => {
    const context = { setTransform: vi.fn(), clearRect: vi.fn(), translate: vi.fn(), rotate: vi.fn(), drawImage: vi.fn() };
    fake.contexts.push(context);
    return { width: 0, height: 0, getContext: () => context };
  } });
});
afterEach(() => vi.unstubAllGlobals());

describe('10m full-frame recording lifecycle', () => {
  it('processes every source frame with its PTS and releases resources on success', async () => {
    const progress = vi.fn();
    const result = await measureSprint(file, .2, new AbortController().signal, progress);
    expect(fake.decode.mock.calls.map(call => call[0])).toEqual([0, 1, 2]);
    expect(fake.estimate.mock.calls.map(call => call.slice(1))).toEqual(frames.map(f => [f.frameIndex, f.pts]));
    expect(result.map(s => s.pts)).toEqual(frames.map(f => f.pts));
    expect(result.slice(0, 2).map(s => s.hipX)).toEqual([null, null]);
    expect(result[2].hipX).toBeCloseTo(.2);
    expect(result[2].ankleGap).toBeCloseTo(.2 * .36 * 1920 / 1080);
    expect(progress).toHaveBeenLastCalledWith(1, '解析が終わりました。');
    expect(fake.decoderDispose).toHaveBeenCalledOnce(); expect(fake.modelDispose).toHaveBeenCalledOnce();
    // Up to four people per frame, so people jogging nearby cannot crowd the runner out.
    expect(fake.modelConstruct).toHaveBeenCalledWith('full', undefined, 'CPU', 4);
  });
  it('uses upright geometry when a portrait rotation is present', async () => {
    fake.demux.mockResolvedValue({ ...demuxed(), videoTrack: { matrix: [0, 65536, 0, -65536, 0, 0, 0, 0, 1073741824] } });
    const result = await measureSprint(file, .2, new AbortController().signal, vi.fn());
    expect(fake.contexts[0].rotate).toHaveBeenCalledWith(Math.PI / 2);
    expect(result[2].ankleGap).toBeCloseTo(.2 * .36 * 1080 / 1920);
    expect(result[2].hipX).toBeCloseTo(.2);
  });
  it('flying start: publishes the runner from its first full sighting, so an entry gate crossed before the running decision is measured', async () => {
    // A fast runner (1.2 widths/s) enters at the left edge and crosses an entry gate at 0.1
    // after 50 ms, before the 60 ms running decision.
    const fps = 120, runner = (t: number) => .04 + 1.2 * t;
    fake.demux.mockResolvedValue({ ...demuxed(), frames: Array.from({ length: 80 }, (_, frameIndex) => ({ frameIndex, pts: frameIndex / fps })) });
    fake.estimate.mockImplementation((_crop: unknown, frameIndex: number) => {
      // The crop's horizontal extent is the last region drawn into the crop canvas.
      const draw = fake.contexts[1].drawImage.mock.calls.at(-1)!, left = draw[1] / 1920, width = draw[3] / 1920;
      const hip = runner(frameIndex / fps);
      return { landmarks: [pose().map((q, i) => ({ ...q, x: (hip + (i === 27 ? -.036 : i === 28 ? .036 : 0) - left) / width }))] };
    });
    const result = await measureSprint(file, .1, new AbortController().signal, vi.fn(), .8, 'flying');
    // Published from the first sighting with the trailing ankle clear of the frame edge (1% margin).
    for (const s of result.filter(s => runner(s.pts) - .036 > .011 && runner(s.pts) < .78)) expect(s.hipX).toBeCloseTo(runner(s.pts), 6);
    const analysis = analyzeSprint(result, .1, .8, 7);
    expect(analysis.reason).toBeNull();
    expect(analysis.start!.pts).toBeCloseTo(.05, 6);
    expect(analysis.duration).toBeCloseTo(.7 / 1.2, 6);
  });
  it('flying start: watches the run-in side and replaces a person jogging behind with the nearer runner, clearing their samples', async () => {
    // A person jogs behind the lane (pelvis at 0.58 of the height, 0.27 widths/s) from the start; the runner
    // (0.7, 0.42 widths/s: 5 m/s for a 10 m section spanning 0.84) comes later on the near lane.
    const fps = 120, jogger = (t: number) => .03 + .27 * t, runner = (t: number) => -.05 + .42 * (t - 1.2);
    const people = (t: number) => [[jogger(t), .58], [runner(t), .7]].filter(([x]) => x > .015 && x < .985);
    fake.demux.mockResolvedValue({ ...demuxed(), frames: Array.from({ length: Math.round(3.6 * fps) }, (_, frameIndex) => ({ frameIndex, pts: frameIndex / fps })) });
    fake.estimate.mockImplementation((_crop: unknown, frameIndex: number) => {
      const draw = fake.contexts[1].drawImage.mock.calls.at(-1)!;
      const left = draw[1] / 1920, top = draw[2] / 1080, width = draw[3] / 1920, height = draw[4] / 1080;
      const inside = people(frameIndex / fps).filter(([x]) => x - .03 > left && x + .03 < left + width);
      return { landmarks: inside.map(([x, y]) => Array.from({ length: 33 }, (_, i) => ({
        x: (x + (i === 27 ? -.02 : i === 28 ? .02 : 0) - left) / width, y: (y + (i >= 25 ? .1 : 0) - top) / height, visibility: 1 }))) };
    });
    const result = await measureSprint(file, .1, new AbortController().signal, vi.fn(), .94, 'flying', 10);
    // A second model was set up for the watch, detecting everyone afresh in every frame.
    expect(fake.modelConstruct).toHaveBeenCalledTimes(2);
    expect(fake.modelConstruct).toHaveBeenLastCalledWith('full', undefined, 'CPU', 4, 'IMAGE');
    const tracked = result.filter(s => s.hipX !== null);
    expect(tracked.length).toBeGreaterThan(100);
    for (const s of tracked) expect(Math.abs(s.hipX! - runner(s.pts))).toBeLessThan(1e-6);
    const analysis = analyzeSprint(result, .1, .94, 10, 'flying');
    expect(analysis.reason).toBeNull();
    expect(analysis.duration).toBeCloseTo(.84 / .42, 2);
  });
  it('analyses 240 fps footage at 120 frames per second, and an empty flying run-in side at 30', async () => {
    const fps = 240, frames = Array.from({ length: 480 }, (_, frameIndex) => ({ frameIndex, pts: frameIndex / fps }));
    fake.demux.mockResolvedValue({ ...demuxed(), frames });
    fake.estimate.mockImplementation(() => ({ landmarks: [] }));   // nobody in the picture
    const standing = await measureSprint(file, .2, new AbortController().signal, vi.fn(), .8);
    expect(standing.map(s => s.frame)).toEqual(frames.filter(f => f.frameIndex % 2 === 0).map(f => f.frameIndex));
    vi.clearAllMocks(); fake.demux.mockResolvedValue({ ...demuxed(), frames }); fake.initialize.mockResolvedValue(undefined);
    fake.estimate.mockImplementation(() => ({ landmarks: [] }));
    const flying = await measureSprint(file, .2, new AbortController().signal, vi.fn(), .8, 'flying');
    expect(flying.map(s => s.frame)).toEqual(frames.filter(f => f.frameIndex % 8 === 0).map(f => f.frameIndex));
    // Every frame is still decoded in order: the others are skipped without conversion.
    expect(fake.decode.mock.calls.length + fake.skip.mock.calls.length).toBe(480);
  });
  it('rejects the wrong decoded frame rather than publishing partial observations', async () => {
    fake.decode.mockImplementationOnce(async () => ({ status: 'SUCCESS', actualDecodedFrameIndex: 5,
      bitmap: { width: 1920, height: 1080 } }));
    await expect(measureSprint(file, .2, new AbortController().signal, vi.fn())).rejects.toThrow('正しく読み出せません');
    expect(fake.estimate).not.toHaveBeenCalled();
    expect(fake.decoderDispose).toHaveBeenCalledOnce(); expect(fake.modelDispose).toHaveBeenCalledOnce();
  });
  it('settles on abort during decode and never reports completion', async () => {
    const controller = new AbortController(), progress = vi.fn();
    fake.decode.mockImplementationOnce(async () => {
      controller.abort(); return { status: 'SUCCESS', actualDecodedFrameIndex: 0, bitmap: { width: 1920, height: 1080 } };
    });
    await expect(measureSprint(file, .2, controller.signal, progress)).rejects.toMatchObject({ name: 'AbortError' });
    expect(fake.estimate).not.toHaveBeenCalled(); expect(fake.decoderDispose).toHaveBeenCalled();
    expect(fake.modelDispose).toHaveBeenCalledOnce();
    expect(progress.mock.calls.some(call => call[0] === 1)).toBe(false);
  });
  it('releases decoder/model when model setup fails', async () => {
    fake.initialize.mockRejectedValueOnce(new Error('MODEL_FAILED'));
    await expect(measureSprint(file, .2, new AbortController().signal, vi.fn())).rejects.toThrow('MODEL_FAILED');
    expect(fake.decoderDispose).toHaveBeenCalledOnce(); expect(fake.modelDispose).toHaveBeenCalledOnce();
  });
  it('rejects oversized files and unsupported decoding before allocating models', async () => {
    await expect(measureSprint({ ...file, size: 151 * 1024 * 1024 }, .2, new AbortController().signal, vi.fn())).rejects.toThrow('150MB');
    fake.available = false;
    await expect(measureSprint(file, .2, new AbortController().signal, vi.fn())).rejects.toThrow('フレーム解析');
    expect(fake.demux).not.toHaveBeenCalled(); expect(fake.modelConstruct).not.toHaveBeenCalled();
  });
  it('rejects excessive frame counts before constructing the decoder', async () => {
    fake.demux.mockResolvedValue({ ...demuxed(), frames: Array.from({ length: 3601 }, (_, frameIndex) => ({ frameIndex, pts: frameIndex / 240 })) });
    await expect(measureSprint(file, .2, new AbortController().signal, vi.fn())).rejects.toThrow('3600フレーム');
    expect(fake.decoderConstruct).not.toHaveBeenCalled();
  });
});
