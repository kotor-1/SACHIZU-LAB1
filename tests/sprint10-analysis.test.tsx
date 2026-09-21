import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import Sprint10Lab from '../src/sprint10/Sprint10Lab';
import StrideResults from '../src/sprint10/StrideResults';
import { analyzeSprint, sprintSample, stepCandidates, type SprintSample, type Point } from '../src/sprint10/analysis';
import { SprintTracker } from '../src/sprint10/tracker';

const synthetic = (): SprintSample[] => Array.from({ length: 721 }, (_, i) => {
  const pts = i / 240, gap = .03 + .25 * Math.abs(Math.cos(4 * Math.PI * pts));
  return { frame: i, pts, hipX: .05 + .3 * pts, ankleGap: gap, kneeGap: gap * .5, legLength: .3 };
});
const pose = (x: number): Point[] => Array.from({ length: 33 }, (_, i) => ({ x: x + (i % 2 ? -.02 : .02), y: .4 + i * .01, visibility: .95 }));
describe('10m sprint experiment', () => {
  it('calculates time, label-invariant cycles and per-step metrics', () => {
    const r = analyzeSprint(synthetic(), .2, .8, 'left');
    expect(r.reason).toBeNull(); expect(r.duration).toBeCloseTo(2); expect(r.speed).toBeCloseTo(5);
    expect(r.count).toBe(8); expect(r.cadence).toBeCloseTo(4); expect(r.stride).toBeCloseTo(1.25);
    expect(r.steps.slice(0, 3).map(s => s.foot)).toEqual(['left', 'right', 'left']);
  });
  it('first foot affects labels only, never measurements', () => {
    const a = analyzeSprint(synthetic(), .2, .8, 'left'), b = analyzeSprint(synthetic(), .2, .8, 'right');
    expect(a.count).toBe(b.count); expect(a.duration).toBe(b.duration); expect(b.steps[0].foot).toBe('right');
  });
  it('uses measured displacements between equal gait phases, with N-1 complete intervals', () => {
    const r = analyzeSprint(synthetic(), .2, .8, 'left');
    expect(r.strideIntervals).toHaveLength(r.steps.length - 1);
    for (const interval of r.strideIntervals) expect(interval.distanceM).toBeCloseTo(1.25);
    expect(r.strideIntervals[0].fromPts).toBe(r.steps[0].pts);
    const changing = synthetic().map(s => ({ ...s, hipX: .05 + .1 * s.pts + .066 * s.pts ** 2 }));
    const varied = analyzeSprint(changing, .2, .8, 'left').strideIntervals;
    expect(varied.length).toBeGreaterThan(2);
    expect(varied.at(-1)!.distanceM!).toBeGreaterThan(varied[0].distanceM! + .1);
    for (const interval of varied) expect(interval.distanceM).toBeCloseTo(10 * (interval.toHipX! - interval.fromHipX!) / .6);
  });
  it('preserves the registered contact itself as step 1 and excludes ALL earlier overlaps', () => {
    const r = analyzeSprint(synthetic(), .2, .8, 'right', .95);
    expect(r.reason).toBeNull(); expect(r.steps[0].pts).toBe(.95);
    expect(r.steps[0].registeredContactPts).toBe(.95); expect(r.steps[0].foot).toBe('right');
    expect(r.steps.every(s => s.pts >= r.steps[0].pts)).toBe(true);
    expect(r.steps.some(s => s.pts < .95)).toBe(false);
    // The contact and its following overlap are one step. Distances use only
    // equal-phase endpoints; .875 before the manual contact is never reused.
    expect(r.steps[0].overlap?.pts).toBeCloseTo(1.125, 2);
    expect(r.steps[1].pts).toBeCloseTo(1.375, 2);
    expect(r.strideIntervals[0].fromPts).toBe(r.steps[0].overlap!.pts); expect(r.strideIntervals[0].fromStep).toBe(1);
    expect(r.strideIntervals[0].distanceM).toBeCloseTo(1.25);
    expect(analyzeSprint(synthetic(), .2, .8, 'left', .1).reason).toContain('接地');
    expect(analyzeSprint(synthetic(), .2, .8, 'left', NaN).count).toBeNull();
  });
  it('does not count a contact and its following overlap twice or force a nine-step count', () => {
    const a = analyzeSprint(synthetic(), .2, .8, 'left', .7);
    const b = analyzeSprint(synthetic(), .2, .875, 'left', .7);
    expect(a.steps[0].pts).toBe(.7); expect(a.steps[0].overlap?.pts).toBeCloseTo(.875, 2);
    expect(a.steps[1].pts).toBeCloseTo(1.125, 2); expect(a.count).toBe(7); expect(b.count).toBe(8);
    const reverse = analyzeSprint(synthetic().map(s => ({ ...s, hipX: 1 - s.hipX! })), .8, .2, 'right', .7);
    expect(reverse.count).toBe(a.count); expect(reverse.steps[0].pts).toBe(.7);
    reverse.strideIntervals.forEach((s, i) => expect(s.distanceM).toBeCloseTo(a.strideIntervals[i].distanceM!));
  });
  it('regression: a .433333s registration never displays or measures a .225s step 1', () => {
    const contact = 104 / 240, r = analyzeSprint(synthetic(), .1, .8, 'left', contact);
    expect(r.steps[0].frame).toBe(104); expect(r.steps[0].pts).toBe(contact);
    expect(r.steps.every(s => s.pts >= contact)).toBe(true);
    expect(r.strideIntervals.every(s => s.fromPts > contact && s.toPts > contact)).toBe(true);
    expect(analyzeSprint(synthetic(), .1, .8, 'left', .4331234).reason).toContain('一致');
  });
  it('withholds individual distances with missing endpoint positions', () => {
    const s = synthetic().map(s => Math.abs(s.pts - .875) < .01 ? { ...s, hipX: null } : s);
    const r = analyzeSprint(s, .2, .8, 'left');
    expect(r.strideIntervals[0].distanceM).toBeNull(); expect(r.strideIntervals[1].distanceM).toBeNull();
    expect(r.strideIntervals[2].distanceM).toBeCloseTo(1.25);
  });
  it('preserves positive per-cycle distances when running right-to-left', () => {
    const a = analyzeSprint(synthetic(), .2, .8, 'left');
    const b = analyzeSprint(synthetic().map(s => ({ ...s, hipX: 1 - s.hipX! })), .8, .2, 'left');
    b.strideIntervals.forEach((s, i) => expect(s.distanceM).toBeCloseTo(a.strideIntervals[i].distanceM!));
  });
  it('renders individual distances and explicit partial interval caveats', () => {
    const r = analyzeSprint(synthetic(), .2, .8, 'left');
    const html = renderToStaticMarkup(<StrideResults intervals={r.strideIntervals} seek={() => {}} />);
    expect(html).toContain('1.25 m'); expect(html).toContain('始点を見る'); expect(html).toContain('部分区間');
  });
  it('supports right-to-left running', () => {
    const r = analyzeSprint(synthetic().map(s => ({ ...s, hipX: 1 - s.hipX! })), .8, .2, 'right');
    expect(r.duration).toBeCloseTo(2); expect(r.count).toBe(8);
  });
  it('is invariant to swapping hip, knee and ankle labels', () => {
    const original = pose(.5), swapped = [...original];
    for (const [a, b] of [[23, 24], [25, 26], [27, 28]]) [swapped[a], swapped[b]] = [swapped[b], swapped[a]];
    expect(sprintSample(original, 0, 0, 16 / 9)).toEqual(sprintSample(swapped, 0, 0, 16 / 9));
  });
  it('does not fabricate unseen crossings or bridge a long timing gap', () => {
    expect(analyzeSprint(synthetic().filter(s => s.pts > .6), .2, .8, 'left').duration).toBeNull();
    expect(analyzeSprint(synthetic().filter(s => s.pts < .45 || s.pts > .55), .2, .8, 'left').duration).toBeNull();
    expect(analyzeSprint(synthetic().filter(s => s.pts < 2.4), .2, .8, 'left').duration).toBeNull();
  });
  it('withholds gait metrics after a tracking dropout, while keeping time', () => {
    const r = analyzeSprint(synthetic().map(s => s.pts > 1 && s.pts < 1.2 ? { ...s, ankleGap: null, kneeGap: null } : s), .2, .8, 'left');
    expect(r.duration).toBeCloseTo(2); expect(r.count).toBeNull(); expect(r.stride).toBeNull();
  });
  it('rejects stationary noise, missing legs and non-monotonic timestamps', () => {
    expect(stepCandidates(synthetic().map(s => ({ ...s, ankleGap: .005 }))).events).toEqual([]);
    expect(stepCandidates(synthetic().map(s => ({ ...s, legLength: null }))).events).toEqual([]);
    expect(analyzeSprint([...synthetic(), synthetic()[0]], .2, .8, 'left').duration).toBeNull();
  });
  it('does not change subject through ambiguity or a long loss', () => {
    const t = new SprintTracker(.2);
    expect(t.choose([pose(.19), pose(.21)], 0)).toEqual([]);
    expect(t.choose([pose(.2)], .01)).toHaveLength(33);
    expect(t.choose([pose(.21)], .02)).toHaveLength(33);
    expect(t.choose([pose(.23)], .5)).toEqual([]);
  });
  it('renders the requested upload, playback, gates, radio and analyze sequence', () => {
    const html = renderToStaticMarkup(<Sprint10Lab />);
    expect(html).toContain('type="radio"'); expect(html).toContain('左足から'); expect(html).toContain('右足から');
    expect(html).toContain('この2本のラインで決定'); expect(html).toContain('解析する'); expect(html).toContain('<video');
  });
});
