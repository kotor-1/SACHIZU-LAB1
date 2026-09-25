import { describe, expect, it } from 'vitest';
import { CameraClock } from '../src/cmj/camera-clock';
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
});
