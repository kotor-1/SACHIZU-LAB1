import { afterEach, expect, it, vi } from 'vitest';
import { LiveWorkerClient } from '../src/cmj/live-worker-client';
import { measureLive } from '../src/cmj/live-session';
import type { SessionUpdate } from '../src/cmj/video-session';

afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });
function worker() {
  return { onmessage: null as ((event: { data: unknown }) => void) | null,
    onerror: null as ((event: { preventDefault: () => void }) => void) | null,
    postMessage: vi.fn(), terminate: vi.fn() };
}
it('allows one worker request at a time and ignores stale replies', async () => {
  const w = worker(), status = vi.fn(), client = new LiveWorkerClient(w as unknown as Worker, status);
  const pending = client.request({ type: 'init' });
  await expect(client.request({ type: 'frame' })).rejects.toThrow('BUSY');
  w.onmessage?.({ data: { status: 'loading' } }); expect(status).toHaveBeenCalledWith('loading');
  w.onmessage?.({ data: { id: 99, result: 'stale' } });
  w.onmessage?.({ data: { id: 1, result: 'ready' } });
  await expect(pending).resolves.toBe('ready'); client.dispose();
});
it('aborts pending requests, terminates the worker, and consumes late callbacks', async () => {
  const w = worker(), client = new LiveWorkerClient(w as unknown as Worker, vi.fn());
  const pending = client.request({ type: 'frame' }), rejected = expect(pending).rejects.toMatchObject({ name: 'AbortError' });
  client.dispose(); client.dispose(); await rejected;
  expect(w.terminate).toHaveBeenCalledOnce(); expect(w.onmessage).toBeNull();
});
it('times out a stalled worker instead of leaving the camera busy forever', async () => {
  vi.useFakeTimers(); const w = worker(), client = new LiveWorkerClient(w as unknown as Worker, vi.fn());
  const pending = client.request({ type: 'frame' }, [], 100), rejected = expect(pending).rejects.toThrow('TIMEOUT');
  await vi.advanceTimersByTimeAsync(100); await rejected; expect(w.terminate).toHaveBeenCalledOnce();
});
it('handles transfer errors without retaining a pending bitmap request', async () => {
  const w = worker(); w.postMessage.mockImplementation(() => { throw new Error('transfer'); });
  const client = new LiveWorkerClient(w as unknown as Worker, vi.fn());
  await expect(client.request({ type: 'frame' })).rejects.toThrow('transfer');
  expect(w.terminate).toHaveBeenCalledOnce();
});

function environment() {
  const win = Object.assign(new EventTarget(), { screen: {} }); vi.stubGlobal('window', win);
  vi.stubGlobal('document', { createElement: () => ({ width: 0, height: 0, getContext: () => ({ drawImage: vi.fn() }) }) });
  const close = vi.fn(); vi.stubGlobal('createImageBitmap', vi.fn(async () => ({ close })));
  let next!: VideoFrameRequestCallback;
  const video = Object.assign(new EventTarget(), { videoWidth: 480, videoHeight: 640, pause: vi.fn(),
    requestVideoFrameCallback: (callback: VideoFrameRequestCallback) => { next = callback; return 1; }, cancelVideoFrameCallback: vi.fn() });
  const emit = (ms: number) => next(ms, { mediaTime: ms / 1000 } as VideoFrameCallbackMetadata);
  return { video, emit, close, win };
}
const frameResult = { phase: 'READY', backend: 'CPU', found: null, landmarks: [], inferenceMs: 10,
  poseModel: 'full', warmingUp: false, profileReason: 'FULL_WITHIN_BUDGET',
  comSample: { frame: 0, pts: 0, comX: null, comY: null, bodyScale: null, reason: 'POSE_NOT_UNIQUE' } };
it('does not queue frames during a slow inference, measures actual sampling, and stops on abort', async () => {
  const env = environment(), control = new AbortController(), updates: SessionUpdate[] = [];
  let resolve!: (value: unknown) => void;
  const client = { request: vi.fn((_message: unknown) => new Promise(done => { resolve = done; })), dispose: vi.fn() };
  const pending = measureLive(env.video as unknown as HTMLVideoElement, client as unknown as LiveWorkerClient, control.signal, s => updates.push(s));
  const aborted = expect(pending).rejects.toMatchObject({ name: 'AbortError' });
  env.emit(1000); await Promise.resolve(); env.emit(1016); env.emit(1033);
  expect(client.request).toHaveBeenCalledOnce(); resolve(frameResult); await Promise.resolve();
  for (const t of [1400, 1800]) { env.emit(t); await Promise.resolve(); resolve(frameResult); await Promise.resolve(); }
  expect(updates.at(-1)).toMatchObject({ processingThread: 'worker', slowDevice: true, skippedCameraFrames: 2 });
  expect(updates.at(-1)?.effectiveFps).toBeCloseTo(2.5);
  control.abort(); await aborted; expect(client.dispose).toHaveBeenCalledOnce(); expect(env.video.pause).toHaveBeenCalledOnce();
});
it('discards a result from the old orientation and resets before processing the new geometry', async () => {
  const env = environment(), control = new AbortController(), update = vi.fn();
  let resolve!: (value: unknown) => void;
  const client = { request: vi.fn((_message: unknown) => new Promise(done => { resolve = done; })), dispose: vi.fn() };
  const pending = measureLive(env.video as unknown as HTMLVideoElement, client as unknown as LiveWorkerClient, control.signal, update);
  const aborted = expect(pending).rejects.toMatchObject({ name: 'AbortError' });
  env.emit(1000); await Promise.resolve(); env.win.dispatchEvent(new Event('orientationchange'));
  resolve(frameResult); await Promise.resolve(); expect(update).not.toHaveBeenCalled();
  env.emit(1100); await Promise.resolve(); expect(client.request.mock.calls.at(-1)?.[0]).toMatchObject({ reset: true });
  resolve(frameResult); await Promise.resolve(); control.abort(); await aborted;
});

it('shows a concrete pose failure during profiling and retains it when ending without a result', async () => {
  const env = environment(), updates: SessionUpdate[] = [];
  const client = { request: vi.fn(async () => ({ ...frameResult, phase: 'PREPARING', warmingUp: true })), dispose: vi.fn() };
  const pending = measureLive(env.video as unknown as HTMLVideoElement, client as unknown as LiveWorkerClient,
    new AbortController().signal, s => updates.push(s));
  env.emit(1000); await Promise.resolve(); await Promise.resolve();
  env.emit(1100); await Promise.resolve(); await Promise.resolve();
  expect(updates.at(-1)).toMatchObject({ observationReason: 'POSE_NOT_UNIQUE', modelWarmingUp: true });
  env.video.dispatchEvent(new Event('ended'));
  await expect(pending).resolves.toMatchObject({ resultCount: 0, reason: 'POSE_NOT_UNIQUE' });
});

it('supplies snapshot-to-response cost and clears it across model changes and rotations', async () => {
  const env = environment(), control = new AbortController(), updates: SessionUpdate[] = [];
  let time = 0; vi.spyOn(performance, 'now').mockImplementation(() => time);
  let response = { ...frameResult, profileChanged: false };
  const client = { request: vi.fn(async (_message: unknown) => { time += 55; return response; }), dispose: vi.fn() };
  const pending = measureLive(env.video as unknown as HTMLVideoElement, client as unknown as LiveWorkerClient,
    control.signal, s => updates.push(s));
  const aborted = expect(pending).rejects.toMatchObject({ name: 'AbortError' });
  const emit = async (ms: number) => { env.emit(ms); await Promise.resolve(); await Promise.resolve(); };
  await emit(1000); await emit(1100); await emit(1200); await emit(1300);
  expect(client.request.mock.calls[0][0]).toMatchObject({ previousProcessingMs: null });
  expect(client.request.mock.calls[1][0]).toMatchObject({ previousProcessingMs: null });
  expect(client.request.mock.calls[2][0]).toMatchObject({ previousProcessingMs: null });
  expect(client.request.mock.calls[3][0]).toMatchObject({ previousProcessingMs: 55 });
  expect(updates.at(-1)?.frameProcessingMs).toBe(55);
  response = { ...frameResult, profileChanged: true }; await emit(1400);
  response = { ...frameResult, profileChanged: false }; await emit(1500);
  expect(client.request.mock.calls.at(-1)?.[0]).toMatchObject({ previousProcessingMs: null });
  await emit(1600); env.win.dispatchEvent(new Event('orientationchange')); await emit(1700);
  expect(client.request.mock.calls.at(-1)?.[0]).toMatchObject({ reset: true, previousProcessingMs: null });
  control.abort(); await aborted;
});

it('retains the interruption reason when a new movement ends after an earlier successful result', async () => {
  const env = environment();
  let response: unknown = { ...frameResult, found: { id: 1, analysis: { heightCm: 24, reason: null } } };
  const client = { request: vi.fn(async () => response), dispose: vi.fn() };
  const pending = measureLive(env.video as unknown as HTMLVideoElement, client as unknown as LiveWorkerClient,
    new AbortController().signal, () => {});
  env.emit(1000); await Promise.resolve(); await Promise.resolve();
  response = { ...frameResult, phase: 'MOVING' };
  env.emit(1100); await Promise.resolve(); await Promise.resolve();
  env.video.dispatchEvent(new Event('ended'));
  await expect(pending).resolves.toMatchObject({ estimateCount: 1, resultCount: 1, reason: 'RECORDING_ENDED_BEFORE_RECOVERY' });
});
