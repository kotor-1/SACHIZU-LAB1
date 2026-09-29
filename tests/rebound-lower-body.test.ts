import { describe, expect, it } from 'vitest';
import type { NormalizedLandmark } from '@mediapipe/tasks-vision';
import { createLowerSubjectSelector, lowerBodySamples } from '../src/rebound/lower-body';
import { DEFAULT_REGION } from '../src/rebound/subject';
function pose(x = .5): NormalizedLandmark[] {
  const p = Array.from({ length: 33 }, () => ({ x, y: -1, z: 0, visibility: 0 }));
  for (const [i, y] of [[23,.4],[24,.4],[25,.6],[26,.6],[27,.8],[28,.8]]) p[i] = { x, y, z: 0, visibility: .99 };
  return p;
}
describe('fixed lower-body proxies', () => {
  it('works when head, arms, wrists and heel/toe landmarks are unavailable', () => {
    const p = pose(), r = lowerBodySamples([p], 0, 0);
    expect(r.PELVIS.comY).toBeCloseTo(.4 * 960); expect(r.HIP_KNEE.comY).toBeCloseTo(.5 * 960);
    expect(createLowerSubjectSelector(DEFAULT_REGION)([p], 0)).toEqual([p]);
  });
  it('does not switch proxies or reuse previous points when lower-body points disappear', () => {
    const p = pose(); p[25].visibility = .1;
    const r = lowerBodySamples([p], 1, .01);
    expect(r.PELVIS.comY).toBeNull(); expect(r.HIP_KNEE.comY).toBeNull();
    expect(lowerBodySamples([pose(), pose()], 0, 0).PELVIS.reason).toBe('LOWER_SUBJECT_UNRESOLVED');
  });
  it('requires unique identity and bounded continuity for reacquisition', () => {
    const select = createLowerSubjectSelector(DEFAULT_REGION), p = pose();
    expect(select([p], 0)).toHaveLength(1); expect(select([], .1)).toEqual([]);
    expect(select([p], .4)).toHaveLength(1);
    expect(select([pose(.2)], .41)).toEqual([]);
    expect(select([p,pose()], .42)).toEqual([]);
    expect(select([p], 1.3)).toEqual([]);
  });
  it('rejects nonfinite and outside-image essential points', () => {
    const p = pose(); p[27].x = NaN;
    expect(lowerBodySamples([p], 0, 0).PELVIS.comY).toBeNull();
    expect(createLowerSubjectSelector(DEFAULT_REGION)([p], 0)).toEqual([]);
    expect(() => createLowerSubjectSelector({ ...DEFAULT_REGION, left: .9 })).toThrow();
  });
  it('can acquire a unique small valid person before the first jump only when explicitly enabled', () => {
    const region = { left: 0, right: 1, top: 0, bottom: 1 };
    const small = pose().map(p => ({ ...p, y: p.y < 0 ? p.y : .5 + (p.y - .4) * .4 }));
    expect(lowerBodySamples([small], 0, 0).PELVIS.bodyScale).toBeCloseTo(.16 * 960);
    expect(createLowerSubjectSelector(region)([small], 0)).toEqual([]);
    const select = createLowerSubjectSelector(region, 'BOTH', { allowSmallInitialSubject: true });
    expect(select([small], 0)).toEqual([small]);
    expect(select([small], .01)).toEqual([small]);
    // Acquiring earlier does not bypass identity ambiguity or long-loss limits.
    expect(select([small, small], .02)).toEqual([]);
    expect(select([small], 1)).toEqual([]);
  });
  it('does not relax geometry, visibility or multi-person foreground selection with small-subject opt-in', () => {
    const region = { left: 0, right: 1, top: 0, bottom: 1 };
    const select = () => createLowerSubjectSelector(region, 'BOTH', { allowSmallInitialSubject: true });
    const small = pose().map(p => ({ ...p, y: p.y < 0 ? p.y : .5 + (p.y - .4) * .4 }));
    const tiny = small.map(p => ({ ...p, y: p.y < 0 ? p.y : .5 + (p.y - .5) * .5 }));
    const hidden = small.map((p, i) => i === 25 ? { ...p, visibility: .1 } : p);
    expect(select()([tiny], 0)).toEqual([]);
    expect(select()([hidden], 0)).toEqual([]);
    expect(select()([small, small], 0)).toEqual([]);
    const big = pose();
    expect(select()([small, big], 0)).toEqual([big]);
  });
  it('does not lose a newly acquired small crouched person while they gradually straighten', () => {
    const region = { left: 0, right: 1, top: 0, bottom: 1 };
    const resized = (length: number) => pose().map(p => ({ ...p, y: p.y < 0 ? p.y : .4 + (p.y - .4) * length / .4 }));
    const select = createLowerSubjectSelector(region, 'BOTH', { allowSmallInitialSubject: true });
    [.13, .16, .19, .22, .25, .28].forEach((length, i) =>
      expect(select([resized(length)], i * .1)).toHaveLength(1));
    // Still bounded by the legacy initial foreground envelope, even if each
    // frame-to-frame size change would individually be permitted.
    expect(select([resized(.35)], .6)).toEqual([]);
    const abrupt = createLowerSubjectSelector(region, 'BOTH', { allowSmallInitialSubject: true });
    expect(abrupt([resized(.13)], 0)).toHaveLength(1);
    expect(abrupt([resized(.25)], .1)).toEqual([]);
    const legacy = createLowerSubjectSelector(region);
    [.13, .16].forEach((length, i) => expect(legacy([resized(length)], i * .1)).toEqual([]));
    [.19, .22, .25, .28].forEach((length, i) => expect(legacy([resized(length)], (i + 2) * .1)).toHaveLength(1));
  });
});
