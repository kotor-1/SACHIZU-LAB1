import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { recordCamera } from '../src/cmj/camera-recording';

class Recorder {
  static instance: Recorder;
  static isTypeSupported = (type: string) => type.startsWith('video/mp4');
  state = 'inactive'; mimeType = 'video/mp4';
  ondataavailable: ((event: { data: Blob }) => void) | null = null;
  onstop: (() => void) | null = null; onerror: (() => void) | null = null;
  constructor() { Recorder.instance = this; }
  start() { this.state = 'recording'; }
  stop() { this.state = 'inactive'; }
  data(value = 'frame') { this.ondataavailable?.({ data: new Blob([value], { type: this.mimeType }) }); }
  finish() { this.data('final'); this.onstop?.(); }
}
beforeEach(() => { vi.useFakeTimers(); vi.stubGlobal('MediaRecorder', Recorder); });
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });
const stream = {} as MediaStream;
it('waits for the final encoded chunk, makes a correctly named file, and stops idempotently', async () => {
  const recording = recordCamera(stream, vi.fn()); Recorder.instance.data();
  const pending = recording.stop(); expect(recording.stop()).toBe(pending);
  let settled = false; void pending.then(() => { settled = true; });
  await Promise.resolve(); expect(settled).toBe(false);
  Recorder.instance.finish(); const file = await pending;
  expect(file?.name).toBe('cmj-camera.mp4'); expect(await file?.text()).toBe('framefinal');
  expect(vi.getTimerCount()).toBe(0);
});
it('ends a 20-second session and retains the final chunk', async () => {
  const limit = vi.fn(), recording = recordCamera(stream, limit);
  await vi.advanceTimersByTimeAsync(20_000); expect(limit).toHaveBeenCalledOnce();
  expect(Recorder.instance.state).toBe('inactive'); Recorder.instance.finish();
  expect((await recording.stop())?.size).toBeGreaterThan(0);
});
it('discards oversized clips rather than returning an incomplete container', async () => {
  const limit = vi.fn(), recording = recordCamera(stream, limit, { bytes: 2, milliseconds: 20_000 });
  Recorder.instance.data(); Recorder.instance.finish();
  expect(limit).toHaveBeenCalledOnce(); expect(await recording.stop()).toBeNull();
});
it('cleans up when unmounted and ignores late data', async () => {
  const recording = recordCamera(stream, vi.fn()); recording.discard(); Recorder.instance.finish();
  expect(await recording.stop()).toBeNull(); expect(vi.getTimerCount()).toBe(0);
});
it('bounds finalization waiting and never returns errored clips', async () => {
  const recording = recordCamera(stream, vi.fn()); Recorder.instance.data(); Recorder.instance.onerror?.();
  await vi.advanceTimersByTimeAsync(3000);
  expect(await recording.stop()).toBeNull(); expect(vi.getTimerCount()).toBe(0);
});
it('names WebM honestly when MP4 is unavailable', async () => {
  vi.spyOn(Recorder, 'isTypeSupported').mockImplementation(type => type === 'video/webm');
  const recording = recordCamera(stream, vi.fn()); Recorder.instance.mimeType = 'video/webm';
  const pending = recording.stop(); Recorder.instance.finish();
  expect((await pending)?.name).toBe('cmj-camera.webm'); vi.restoreAllMocks();
});
it('reports unsupported recording without breaking live camera capability', () => {
  vi.stubGlobal('MediaRecorder', undefined);
  expect(() => recordCamera(stream, vi.fn())).toThrow('CAMERA_RECORDING_UNSUPPORTED');
});
