import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { NormalizedLandmark } from '@mediapipe/tasks-vision';
import { measureRecording } from '../src/cmj/recording-session';
import { extractStage1Feet, runStage1Recording, selectStage1Polarities, type Stage1PixelObservation } from '../src/cmj/stage1-recording';
import type { GrayImage } from '../src/rebound/pixel-foot';

const fake = vi.hoisted(() => ({ decode: vi.fn(), dispose: vi.fn(), estimate: vi.fn(), close: vi.fn(), init: vi.fn(), models: vi.fn() }));
const times = [0, .012, .033, .048];
vi.mock('../src/frame-engine/mp4-demuxer', () => ({ demuxMP4: vi.fn(async () => ({
  frames: [0, .012, .033, .048].map((pts, frameIndex) => ({ pts, frameIndex, cts: pts * 1000, rawCts: pts * 1000, dts: pts * 1000 })),
  metadata: { actualFrameCount: 4, nominalFps: 240, width: 240, height: 960, codec: 'avc1', timeScale: 1000 },
  videoTrack: {}, rawSamples: [],
})) }));
vi.mock('../src/cmj/sequential-decoder', () => ({ SequentialRecordingDecoder: class {
  static isAvailable() { return true; }
  decodeExactFrame = fake.decode; dispose = fake.dispose; diagnostics = { submittedSamples: 4, emittedFrames: 4, maxRetainedFrames: 1, configureCount: 1 };
} }));
vi.mock('../src/cmj/mobile-pose', () => ({ POSE_MODEL_HASHES: { full: 'verified-full-model-sha256' }, MobileCMJPose: class {
  constructor(readonly variant = 'full') { fake.models(variant); }
  initialize = fake.init; estimate = fake.estimate; dispose = fake.close;
} }));

const pose = (): NormalizedLandmark[] => {
  const p = Array.from({ length: 33 }, () => ({ x: .5, y: .5, z: 0, visibility: 1 }));
  for (const side of [0, 1]) {
    p[29 + side] = { x: (65 + side * 100) / 240, y: 780 / 960, z: 0, visibility: 1 };
    p[31 + side] = { x: (65 + side * 100) / 240, y: 790 / 960, z: 0, visibility: 1 };
  }
  return p;
};
function shoes(bright = false): GrayImage & { rgba: Uint8ClampedArray } {
  const width = 240, height = 960, pixels = new Uint8Array(width * height).fill(bright ? 30 : 230);
  for (const x0 of [49, 149]) for (let y = 750; y <= 790; y++) for (let x = x0; x <= x0 + 32; x++) pixels[y * width + x] = bright ? 230 : 30;
  const rgba = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < pixels.length; i++) rgba.set([pixels[i], pixels[i], pixels[i], 255], i * 4);
  return { width, height, pixels, rgba };
}
function canvas() {
  const image = shoes();
  return { width: 0, height: 0, getContext: () => ({ translate: vi.fn(), rotate: vi.fn(), scale: vi.fn(), clearRect: vi.fn(),
    drawImage: vi.fn(), setTransform: vi.fn(), getImageData: () => ({ data: image.rgba }) }) } as unknown as HTMLCanvasElement;
}
const input = () => new File(['cmj'], 'jump.mp4', { type: 'video/mp4', lastModified: 123 });
beforeEach(() => {
  vi.clearAllMocks(); fake.init.mockResolvedValue(undefined);
  fake.decode.mockImplementation(async index => ({ status: 'SUCCESS', actualDecodedFrameIndex: index,
    bitmap: { width: 240, height: 960, close: vi.fn() } }));
  fake.estimate.mockImplementation((_canvas, frame, pts) => ({ comSample: { frame, pts, comX: 400, comY: 500, bodyScale: 500 },
    landmarks: [pose()], inferenceMs: 10 }));
});
afterEach(() => vi.unstubAllGlobals());

describe('recording pixel callback ownership', () => {
  it('awaits each callback before decoding again and carries exact source PTS and metadata', async () => {
    let release!: () => void;
    const gate = new Promise<void>(resolve => { release = resolve; });
    const events: string[] = [], observed: number[] = [];
    const task = measureRecording(input(), canvas(), new AbortController().signal, vi.fn(), undefined, {
      analysis: 'OBSERVATIONS', onDecodedFrame: async frame => {
        events.push(`begin:${frame.sample.frame}`); observed.push(frame.sample.pts);
        expect(frame.sourceFrame.pts).toBe(frame.sample.pts);
        expect(frame.metadata.nominalFps).toBe(240);
        expect(frame.bitmap.width).toBe(240);
        if (frame.sample.frame === 0) await gate;
        events.push(`end:${frame.sample.frame}`);
      },
    });
    await vi.waitFor(() => expect(events).toEqual(['begin:0']));
    expect(fake.decode).toHaveBeenCalledTimes(1); expect(fake.dispose).not.toHaveBeenCalled();
    release(); await task;
    expect(observed).toEqual(times);
    expect(events).toEqual(['begin:0', 'end:0', 'begin:1', 'end:1', 'begin:2', 'end:2', 'begin:3', 'end:3']);
    expect(fake.dispose).toHaveBeenCalled(); expect(fake.close).toHaveBeenCalled();
  });
  it('aborts a pending callback, disposes resources and cannot process another frame', async () => {
    const controller = new AbortController(), hook = vi.fn(() => new Promise<void>(() => {}));
    const task = measureRecording(input(), canvas(), controller.signal, vi.fn(), undefined, { analysis: 'OBSERVATIONS', onDecodedFrame: hook });
    const assertion = expect(task).rejects.toMatchObject({ name: 'AbortError' });
    await vi.waitFor(() => expect(hook).toHaveBeenCalledTimes(1));
    controller.abort(); await assertion;
    expect(fake.decode).toHaveBeenCalledTimes(1); expect(fake.dispose).toHaveBeenCalled(); expect(fake.close).toHaveBeenCalled();
  });
  it('cleans up and rejects a failing pixel callback', async () => {
    await expect(measureRecording(input(), canvas(), new AbortController().signal, vi.fn(), undefined,
      { analysis: 'OBSERVATIONS', onDecodedFrame: () => { throw new Error('pixel failure'); } })).rejects.toThrow('pixel failure');
    expect(fake.dispose).toHaveBeenCalled(); expect(fake.close).toHaveBeenCalled();
  });
});

describe('actual sole image observations', () => {
  it.each([false, true])('extracts pixels for %s-bright shoes and retains both polarities', bright => {
    const result = extractStage1Feet(shoes(bright), [pose()]);
    const selected = bright ? result.brightFeet : result.darkFeet;
    expect(selected.map(foot => foot.ys)).toEqual([[790, 790, 790], [790, 790, 790]]);
    expect(result.points[0].toe?.y).toBeCloseTo(790);
  });
  it('does not treat a raised or hidden heel as leaving the floor', () => {
    const p = pose(); p[29].y = 760 / 960;
    expect(extractStage1Feet(shoes(), [p]).darkFeet[0].ys).toEqual([790, 790, 790]);
    p[29].visibility = .1;
    const result = extractStage1Feet(shoes(), [p]);
    expect(result.darkFeet[0].ys).toEqual([790, 790, 790]);
    expect(result.points[0].heel?.visibility).toBe(.1);
  });
  it('retains missingness for occluded toes, overlapping feet and low contrast', () => {
    const p = pose(); p[31].visibility = .1;
    expect(extractStage1Feet(shoes(), [p]).darkFeet[0]).toMatchObject({ ys: null, reason: 'FOOT_POSE_MISSING' });
    const overlap = pose(); overlap[30].x = overlap[29].x; overlap[32].x = overlap[31].x;
    expect(extractStage1Feet(shoes(), [overlap]).darkFeet.every(f => f.reason === 'FEET_OVERLAP')).toBe(true);
    const image = shoes(); image.pixels.fill(100); image.rgba.fill(100);
    const flat = extractStage1Feet(image, [pose()]);
    expect([...flat.darkFeet, ...flat.brightFeet].every(f => f.ys === null)).toBe(true);
    expect(extractStage1Feet(shoes(), []).darkFeet.every(f => f.reason === 'POSE_NOT_UNIQUE')).toBe(true);
  });
  it('selects one polarity per foot for all frames by completeness then contrast', () => {
    const row = (frame: number): Stage1PixelObservation => ({ frame, pts: frame / 120,
      ...extractStage1Feet(shoes(), [pose()]) });
    const rows = [row(0), row(1), row(2)];
    rows[0].darkFeet[0] = { ys: null, contrast: 0, reason: 'missing' };
    rows[0].brightFeet[0] = { ys: [900, 900, 900], contrast: 255, reason: null };
    rows[1].brightFeet[1] = { ys: [5, 5, 5], contrast: 255, reason: null };
    expect(selectStage1Polarities(rows)).toEqual(['DARK', 'DARK']);
  });
});

describe('stage1 recording report', () => {
  it('uses Full on every original timestamp and exports observations, hash and acquisition', async () => {
    const scratch = canvas(); vi.stubGlobal('document', { createElement: () => scratch });
    const result = await runStage1Recording(input(), canvas(), new AbortController().signal, vi.fn());
    expect(fake.models).toHaveBeenCalledExactlyOnceWith('full');
    expect(result.frameTimes).toEqual(times);
    expect(result.sourceFrames.map(f => f.pts)).toEqual(times);
    expect(result.frameIntervals).toEqual(times.slice(1).map((t, i) => t - times[i]));
    expect(result.file.sha256).toMatch(/^[a-f0-9]{64}$/);
    expect(result).toMatchObject({ acquisition: 'EXACT_FRAMES', frameCount: 4, stride: 1, poseModel: 'full',
      polarities: ['DARK', 'DARK'], stage: 'RECORDING_ONLY' });
    expect(result.observations.map(r => r.feet[0].edge)).toEqual(Array.from({ length: 4 }, () => [789.5, 790.5]));
    expect(result.pixelObservations.every(row => row.darkFeet && row.brightFeet)).toBe(true);
    expect(result.analysis.legacy.samples.map(s => s.pts)).toEqual(times);
    expect(scratch.width).toBe(0); expect(scratch.height).toBe(0);
  });
  it('still records pixel soles when COM is unavailable', async () => {
    const scratch = canvas(); vi.stubGlobal('document', { createElement: () => scratch });
    fake.estimate.mockImplementation((_canvas, frame, pts) => ({ comSample: { frame, pts, comX: null, comY: null,
      bodyScale: null, reason: 'BODY_POINT_OCCLUDED' }, landmarks: [pose()], inferenceMs: 10 }));
    const result = await runStage1Recording(input(), canvas(), new AbortController().signal, vi.fn());
    expect(result.observations.every(row => row.comY === null && row.feet.every(foot => foot.edge !== null))).toBe(true);
  });
});
