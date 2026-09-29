import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { measureSprint } from '../src/sprint10/recording';

const fake = vi.hoisted(() => ({
  available: true, demux: vi.fn(), decode: vi.fn(), initialize: vi.fn(), estimate: vi.fn(),
  decoderDispose: vi.fn(), modelDispose: vi.fn(), decoderConstruct: vi.fn(), modelConstruct: vi.fn(),
  contexts: [] as { setTransform: ReturnType<typeof vi.fn>; clearRect: ReturnType<typeof vi.fn>;
    translate: ReturnType<typeof vi.fn>; rotate: ReturnType<typeof vi.fn>; drawImage: ReturnType<typeof vi.fn> }[],
}));
vi.mock('../src/frame-engine/mp4-demuxer', () => ({ demuxMP4: fake.demux }));
vi.mock('../src/cmj/sequential-decoder', () => ({ SequentialRecordingDecoder: class {
  static isAvailable() { return fake.available; }
  constructor() { fake.decoderConstruct(); }
  decodeExactFrame = fake.decode;
  dispose = fake.decoderDispose;
} }));
vi.mock('../src/cmj/mobile-pose', () => ({ MobileCMJPose: class {
  constructor() { fake.modelConstruct(); }
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
  fake.demux.mockResolvedValue(demuxed()); fake.initialize.mockResolvedValue(undefined);
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
  });
  it('uses upright geometry when a portrait rotation is present', async () => {
    fake.demux.mockResolvedValue({ ...demuxed(), videoTrack: { matrix: [0, 65536, 0, -65536, 0, 0, 0, 0, 1073741824] } });
    const result = await measureSprint(file, .2, new AbortController().signal, vi.fn());
    expect(fake.contexts[0].rotate).toHaveBeenCalledWith(Math.PI / 2);
    expect(result[2].ankleGap).toBeCloseTo(.2 * .36 * 1080 / 1920);
    expect(result[2].hipX).toBeCloseTo(.2);
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
