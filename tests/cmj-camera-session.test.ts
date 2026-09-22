import { afterEach, describe, expect, it, vi } from 'vitest';
import { measureVideo, type SessionUpdate } from '../src/cmj/video-session';

const fake = vi.hoisted(() => ({ streams: vi.fn(), push: vi.fn(), dispose: vi.fn(), draw: vi.fn() }));
vi.mock('../src/cmj/mobile-pose', () => ({ MobileCMJPose: class {
  variant = 'lite'; backend = 'CPU';
  async initialize() {} warm() {} dispose = fake.dispose;
  estimate(_image: unknown, frame: number, pts: number) {
    return { landmarks: [], inferenceMs: 1, comSample: { frame, pts, comX: null, comY: null, reason: 'POSE_NOT_UNIQUE' } };
  }
} }));
vi.mock('../src/cmj/com-stream', () => ({ COMStream: class {
  phase = 'READY'; constructor() { fake.streams(); }
  push = fake.push; end() { return null; }
} }));

afterEach(() => { vi.unstubAllGlobals(); vi.clearAllMocks(); });
describe('live camera rotation', () => {
  it('resets in-progress motion on rotation and delivered-size changes, retains completed results and cleans listeners', async () => {
    const screenOrientation = new EventTarget(), win = Object.assign(new EventTarget(), { screen: { orientation: screenOrientation } });
    vi.stubGlobal('window', win);
    vi.stubGlobal('document', { createElement: () => ({ width: 0, height: 0, getContext: () => ({ drawImage: fake.draw }) }) });
    let next!: VideoFrameRequestCallback;
    const video = Object.assign(new EventTarget(), {
      videoWidth: 480, videoHeight: 640, playbackRate: 1,
      requestVideoFrameCallback: (fn: VideoFrameRequestCallback) => { next = fn; return 1; },
      cancelVideoFrameCallback: vi.fn(), play: vi.fn(async () => {}), pause: vi.fn(),
    });
    const completed = { id: 1, analysis: { heightCm: 30 } };
    fake.push.mockReturnValue(null).mockReturnValueOnce(completed);
    const updates: SessionUpdate[] = [];
    const pending = measureVideo(video as unknown as HTMLVideoElement, 'camera', new AbortController().signal, s => updates.push(s));
    await vi.waitFor(() => expect(next).toBeTypeOf('function'));
    const frame = (pts: number) => next(0, { mediaTime: pts } as VideoFrameCallbackMetadata);
    frame(1); frame(2);
    const beforeTurn = fake.streams.mock.calls.length;
    video.videoWidth = 640; video.videoHeight = 480; frame(3);
    expect(fake.streams).toHaveBeenCalledTimes(beforeTurn + 1);
    expect(fake.draw.mock.calls.at(-1)?.slice(-2)).toEqual([640, 480]);
    screenOrientation.dispatchEvent(new Event('change')); frame(4);
    expect(fake.streams).toHaveBeenCalledTimes(beforeTurn + 2);
    win.dispatchEvent(new Event('orientationchange')); frame(5);
    expect(fake.streams).toHaveBeenCalledTimes(beforeTurn + 3);
    expect(updates.at(-1)?.results).toEqual([completed]);
    const remove = vi.spyOn(win, 'removeEventListener'), removeScreen = vi.spyOn(screenOrientation, 'removeEventListener');
    video.dispatchEvent(new Event('ended')); await pending;
    expect(remove).toHaveBeenCalledWith('orientationchange', expect.any(Function));
    expect(removeScreen).toHaveBeenCalledWith('change', expect.any(Function));
    expect(fake.dispose).toHaveBeenCalledOnce();
  });
  it('continues pose inference with frozen camera timestamps but never measures height from callback time', async () => {
    vi.stubGlobal('window', Object.assign(new EventTarget(), { screen: {} }));
    vi.stubGlobal('document', { createElement: () => ({ width: 0, height: 0, getContext: () => ({ drawImage: fake.draw }) }) });
    let next!: VideoFrameRequestCallback;
    const video = Object.assign(new EventTarget(), { videoWidth: 480, videoHeight: 640, playbackRate: 1,
      requestVideoFrameCallback: (fn: VideoFrameRequestCallback) => { next = fn; return 1; },
      cancelVideoFrameCallback: vi.fn(), play: vi.fn(async () => {}), pause: vi.fn() });
    const updates: SessionUpdate[] = [];
    const pending = measureVideo(video as unknown as HTMLVideoElement, 'camera', new AbortController().signal, s => updates.push(s));
    await vi.waitFor(() => expect(next).toBeTypeOf('function'));
    for (const now of [1000, 1033, 1066]) next(now, { mediaTime: 0 } as VideoFrameCallbackMetadata);
    expect(updates.at(-1)).toMatchObject({ processedFrames: 3, sourcePts: .066, cameraTiming: 'unavailable' });
    expect(fake.push).not.toHaveBeenCalled();
    video.dispatchEvent(new Event('ended')); await pending;
  });
});
