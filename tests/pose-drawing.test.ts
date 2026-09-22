import { describe, expect, it } from 'vitest';
import { nearestPoseFrame, visiblePoint } from '../src/cmj/pose-drawing';
describe('display-only pose frame alignment', () => {
  const frames = [0, .01, .02, .5].map((pts, frame) => ({ frame, pts }));
  it('matches media time and rejects missing periods or invalid times', () => {
    expect(nearestPoseFrame(frames, .011)?.frame).toBe(1);
    expect(nearestPoseFrame(frames, .5)?.frame).toBe(3);
    expect(nearestPoseFrame(frames, .25)).toBeNull();
    expect(nearestPoseFrame(frames, NaN)).toBeNull();
    expect(nearestPoseFrame([], 0)).toBeNull();
  });
  it('does not draw unavailable or offscreen points', () => {
    expect(visiblePoint({ x: .5, y: .5, z: 0, visibility: .8 })).toBe(true);
    expect(visiblePoint({ x: .5, y: .5, z: 0, visibility: .1 })).toBe(false);
    expect(visiblePoint({ x: NaN, y: .5, z: 0, visibility: .8 })).toBe(false);
    expect(visiblePoint()).toBe(false);
  });
});
