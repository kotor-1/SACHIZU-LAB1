import { describe, expect, it } from 'vitest';
import type { Point } from '../src/sprint10/analysis';
import { SprintTracker } from '../src/sprint10/tracker';

const pose = (x: number, y = .65): Point[] => Array.from({ length: 33 }, () => ({ x, y, visibility: .95 }));
const reflect = (points: Point[]) => points.map(p => ({ ...p, x: 1 - p.x }));

describe('10m subject acquisition', () => {
  it.each([false, true])('requires three observations and keeps the crop seed fixed until then (reflected=%s)', reversed => {
    const x = (value: number) => reversed ? 1 - value : value;
    const tracker = new SprintTracker(x(.2));
    const first = pose(x(.16)), second = pose(x(.17)), third = pose(x(.18));
    expect(tracker.choose([first], 0)).toEqual([]); expect(tracker.expected(.01)).toBe(x(.2));
    expect(tracker.choose([second], .01)).toEqual([]); expect(tracker.expected(.02)).toBe(x(.2));
    expect(tracker.choose([third], .02)).toBe(third); expect(tracker.expected(.02)).toBe(x(.18));
    const fourth = pose(x(.19));
    expect(tracker.choose([fourth], .03)).toBe(fourth);
  });

  it.each([false, true])('discards an isolated false initialization before the actual runner appears (reflected=%s)', reversed => {
    const points = (x: number, y: number) => reversed ? reflect(pose(x, y)) : pose(x, y);
    const tracker = new SprintTracker(reversed ? .88 : .12);
    // One erroneous pose, then missing detections, then a continuous runner.
    expect(tracker.choose([points(.1133, .6328)], .05)).toEqual([]);
    expect(tracker.choose([], .058333)).toEqual([]);
    expect(tracker.choose([points(.0419, .6722)], 44 / 120)).toEqual([]);
    expect(tracker.choose([points(.0433, .6757)], 45 / 120)).toEqual([]);
    const confirmed = points(.044, .6765);
    expect(tracker.choose([confirmed], 46 / 120)).toBe(confirmed);
    expect(tracker.expected(46 / 120)).toBeCloseTo(reversed ? .956 : .044);
  });

  it('resets provisional observations after an empty frame', () => {
    const tracker = new SprintTracker(.2), target = pose(.2);
    expect(tracker.choose([target], 0)).toEqual([]);
    expect(tracker.choose([target], .01)).toEqual([]);
    expect(tracker.choose([], .02)).toEqual([]);
    expect(tracker.choose([target], .03)).toEqual([]);
    expect(tracker.choose([target], .04)).toEqual([]);
    expect(tracker.choose([target], .05)).toBe(target);
  });

  it('resets provisional observations when candidate identity is ambiguous', () => {
    const tracker = new SprintTracker(.2), target = pose(.2);
    expect(tracker.choose([target], 0)).toEqual([]);
    expect(tracker.choose([target], .01)).toEqual([]);
    expect(tracker.choose([pose(.19), pose(.21)], .02)).toEqual([]);
    expect(tracker.choose([target], .03)).toEqual([]);
    expect(tracker.choose([target], .04)).toEqual([]);
    expect(tracker.choose([target], .05)).toBe(target);
  });

  it('accepts exactly 50 ms acquisition spacing but restarts after 50.001 ms', () => {
    const target = pose(.2), exact = new SprintTracker(.2), longer = new SprintTracker(.2);
    expect(exact.choose([target], .5)).toEqual([]);
    expect(exact.choose([target], .55)).toEqual([]);
    expect(exact.choose([target], .6)).toBe(target);
    expect(longer.choose([target], .5)).toEqual([]);
    expect(longer.choose([target], .550001)).toEqual([]);
    expect(longer.choose([target], .600001)).toEqual([]);
    expect(longer.choose([target], .650001)).toBe(target);
  });

  it.each(['horizontal', 'vertical'])('restarts a discontinuous %s candidate from the original seed', axis => {
    const tracker = new SprintTracker(.2), first = pose(.2, .5);
    const changed = axis === 'horizontal' ? pose(.28, .5) : pose(.2, .6);
    expect(tracker.choose([first], 0)).toEqual([]);
    expect(tracker.choose([changed], .01)).toEqual([]);
    expect(tracker.choose([changed], .02)).toEqual([]);
    expect(tracker.expected(.03)).toBe(.2);
    expect(tracker.choose([changed], .03)).toBe(changed);
  });

  it('does not restart a discontinuous candidate outside the original seed radius', () => {
    const tracker = new SprintTracker(.2), near = pose(.34), far = pose(.37);
    expect(tracker.choose([pose(.2)], 0)).toEqual([]);
    expect(tracker.choose([far], .01)).toEqual([]);
    expect(tracker.choose([far], .02)).toEqual([]);
    expect(tracker.choose([far], .03)).toEqual([]);
    expect(tracker.expected(.04)).toBe(.2);
    expect(tracker.choose([near], .04)).toEqual([]);
    expect(tracker.choose([near], .05)).toEqual([]);
    expect(tracker.choose([near], .06)).toBe(near);
  });

  it.each([.01, .005, NaN])('does not count repeated, reversed or invalid timestamps as a third observation (%s)', invalidTime => {
    const tracker = new SprintTracker(.2), target = pose(.2);
    expect(tracker.choose([target], 0)).toEqual([]);
    expect(tracker.choose([target], .01)).toEqual([]);
    expect(tracker.choose([target], invalidTime)).toEqual([]);
    expect(tracker.expected(.02)).toBe(.2);
    expect(tracker.choose([target], .02)).toEqual([]);
  });

  it('discards observations whose hips are invalid or not visible', () => {
    const tracker = new SprintTracker(.2), target = pose(.2), invalid = pose(.2);
    invalid[23].visibility = .2;
    expect(tracker.choose([target], 0)).toEqual([]);
    expect(tracker.choose([invalid], .01)).toEqual([]);
    expect(tracker.choose([target], .02)).toEqual([]);
    expect(tracker.choose([target], .03)).toEqual([]);
    expect(tracker.choose([target], .04)).toBe(target);
  });

  it('does not reacquire after a confirmed track has been lost for more than 350 ms', () => {
    const tracker = new SprintTracker(.2), target = pose(.2);
    tracker.choose([target], 0); tracker.choose([target], .01);
    expect(tracker.choose([target], .02)).toBe(target);
    expect(tracker.choose([], .1)).toEqual([]);
    expect(tracker.choose([target], .370001)).toEqual([]);
    expect(tracker.choose([target], .38)).toEqual([]);
    expect(tracker.choose([target], .39)).toEqual([]);
    expect(tracker.choose([target], .4)).toEqual([]);
  });

  it('preserves confirmed tracking through a short gap or ambiguous observation', () => {
    const tracker = new SprintTracker(.2), target = pose(.2);
    tracker.choose([target], 0); tracker.choose([target], .01);
    expect(tracker.choose([target], .02)).toBe(target);
    expect(tracker.choose([pose(.19), pose(.21)], .03)).toEqual([]);
    expect(tracker.choose([], .04)).toEqual([]);
    expect(tracker.choose([target], .05)).toBe(target);
    expect(tracker.choose([target], .4)).toBe(target);
  });
});
