import { describe, expect, it } from 'vitest';
import { afterEach, vi } from 'vitest';
import { CameraClock, drawCameraFrame } from '../src/cmj/camera-clock';
describe('camera clock separation', () => {
  it('keeps inference alive without inventing capture timestamps', () => {
    const c = new CameraClock();
    const values = [1000, 1033, 1066].map(now => c.read(now, { mediaTime: 0 }));
    expect(values.map(v => v.inferencePts)).toEqual([0, .033, .066]);
    expect(values.every(v => v.measurementPts === null)).toBe(true);
  });
  it('uses advancing capture timestamps when mediaTime is frozen', () => {
    const c = new CameraClock(); c.read(2000, { mediaTime: 0, captureTime: 1000 });
    expect(c.read(2300, { mediaTime: 0, captureTime: 1033 })).toMatchObject({ source: 'capture', measurementPts: 1.033 });
  });
  it('uses media time when valid and resets when a clock stops or changes', () => {
    const c = new CameraClock(); c.read(0, { mediaTime: 1 });
    expect(c.read(20, { mediaTime: 1.02 })).toMatchObject({ source: 'media', reset: true });
    expect(c.read(40, { mediaTime: 1.04 })).toMatchObject({ source: 'media', reset: false });
    expect(c.read(60, { mediaTime: 1.04 })).toMatchObject({ source: 'media', measurementPts: null, reset: false });
    c.read(80, { mediaTime: 1.08, captureTime: 70 });
    expect(c.read(100, { mediaTime: 1.1, captureTime: 90 })).toMatchObject({ source: 'media', reset: false });
    expect(c.read(120, { mediaTime: 1.1, captureTime: 110 })).toMatchObject({ source: 'media', measurementPts: null, reset: false });
    expect(c.read(140, { mediaTime: 1.1, captureTime: 130 })).toMatchObject({ source: 'capture', measurementPts: .13, reset: true });
  });
  it('prefers the drawn frame\'s own capture time over callback metadata', () => {
    // WebKit can report an older frame's captureTime with the newer image.
    const c = new CameraClock();
    expect(c.read(0, { mediaTime: 0, captureTime: 1000, frameTime: 5 })).toMatchObject({ source: 'frame', measurementPts: 5, reset: true });
    expect(c.read(40, { mediaTime: 0, captureTime: 1000, frameTime: 5.0333 })).toMatchObject({ source: 'frame', measurementPts: 5.0333, reset: false });
    // The same frame presented again is not a new observation.
    expect(c.read(50, { mediaTime: 0, captureTime: 1033, frameTime: 5.0333 })).toMatchObject({ source: 'frame', measurementPts: null, reset: false });
    expect(c.read(80, { mediaTime: 0, captureTime: 1066, frameTime: 5.0667 })).toMatchObject({ source: 'frame', measurementPts: 5.0667 });
    expect(c.read(120, { mediaTime: 0, captureTime: 1100, frameTime: 4 })).toMatchObject({ source: 'frame', measurementPts: 4, reset: true });
  });
  it('falls back to camera metadata when frame times stop while the camera clock advances', () => {
    const c = new CameraClock();
    c.read(0, { mediaTime: 0, captureTime: 1000, frameTime: 0 });
    expect(c.read(33, { mediaTime: 0, captureTime: 1033, frameTime: 0 }).measurementPts).toBeNull();
    const fallback = c.read(66, { mediaTime: 0, captureTime: 1066, frameTime: 0 });
    expect(fallback.source).not.toBe('frame');
    expect(c.read(100, { mediaTime: 0, captureTime: 1100, frameTime: 0 })).toMatchObject({ source: 'capture', measurementPts: 1.1 });
  });
  describe('drawCameraFrame', () => {
    afterEach(() => { vi.unstubAllGlobals(); });
    const video = {} as HTMLVideoElement;
    it('draws the VideoFrame and returns its own timestamp in seconds', () => {
      const close = vi.fn();
      vi.stubGlobal('VideoFrame', class { timestamp = 1_500_000; close = close; constructor(readonly source: unknown) {} });
      const drawImage = vi.fn();
      expect(drawCameraFrame(video, { drawImage } as unknown as CanvasRenderingContext2D, 10, 20)).toBe(1.5);
      expect(drawImage.mock.calls[0][0]).not.toBe(video);
      expect(close).toHaveBeenCalledTimes(1);
    });
    it('draws the element and returns null when VideoFrame is unavailable or fails', () => {
      const drawImage = vi.fn();
      vi.stubGlobal('VideoFrame', undefined);
      expect(drawCameraFrame(video, { drawImage } as unknown as CanvasRenderingContext2D, 10, 20)).toBeNull();
      vi.stubGlobal('VideoFrame', class { constructor() { throw new Error('no frame'); } });
      expect(drawCameraFrame(video, { drawImage } as unknown as CanvasRenderingContext2D, 10, 20)).toBeNull();
      expect(drawImage.mock.calls.every(call => call[0] === video)).toBe(true);
    });
  });
});
