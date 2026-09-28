import { describe, expect, it } from 'vitest';
import { bilateralFlightFraction, type AerialLobe } from '../src/rebound/bilateral-flight';
import { fractionRSI, hybridDisplacement } from '../src/rebound/hybrid-physics';
import {
  fitToeCycle, toeCycleDepth, toeCycleResult, TOE_CYCLE_SETTINGS,
  type ToeSample,
} from '../src/rebound/toe-cycle-research';

// These trajectories are generated with the SAME mathematical toe template as
// the fitter. They test the numerical implementation and bilateral geometry,
// not real-video RSI accuracy or the biological validity of a toe-flight lobe.
function samples(left: AerialLobe, right: AerialLobe, period = .6, pelvisFraction?: number): ToeSample[] {
  const fraction = pelvisFraction ?? bilateralFlightFraction(left, right)!;
  return Array.from({ length: 145 }, (_, frame) => {
    const t = frame / 144;
    return { frame, pts: t * period, comX: 300,
      comY: 400 + 1200 * hybridDisplacement(t, fraction, 'HALF_SINE'), bodyScale: 200,
      leftToeY: 600 + 70 * toeCycleDepth(t, left.fraction, left.phase),
      rightToeY: 620 + 90 * toeCycleDepth(t, right.fraction, right.phase) };
  });
}
const fit = (rows: ToeSample[], period = .6) => fitToeCycle(rows,
  { frame: 0, pts: 0, y: 400 }, { frame: 144, pts: period, y: 400 });
const lobe = (fraction: number, phase = 0): AerialLobe => ({ fraction, phase });

describe('independent toes and bilateral model-lobe intersection: numerical tests only', () => {
  it.each([.4, .6, .8])('preserves synchronous same-form fraction %s', fraction => {
    const profile = fit(samples(lobe(fraction), lobe(fraction))), result = toeCycleResult(profile)!;
    expect(profile.reason).toBeNull(); expect(result).not.toBeNull();
    expect(profile.period).toBeCloseTo(.6, 12);
    expect(result.fraction).toBeCloseTo(fraction, 10);
    expect(result.value).toBeCloseTo(fractionRSI(.6, fraction), 10);
    expect(result.footFractions[0]).toBeCloseTo(fraction, 10);
    expect(result.footFractions[1]).toBeCloseTo(fraction, 10);
    expect(result.footPhases[0]).toBeCloseTo(0, 10);
    expect(result.footPhases[1]).toBeCloseTo(0, 10);
    for (const points of profile.footPoints) {
      expect(points.length).toBeGreaterThan(1);
      expect(points.every(p => Number.isFinite(p.fraction) && Number.isFinite(p.phase) && Number.isFinite(p.error))).toBe(true);
    }
    expect(result.profileRange[0]).toBeLessThanOrEqual(result.value);
    expect(result.profileRange[1]).toBeGreaterThanOrEqual(result.value);
  });

  it.each([
    { left: lobe(.6, -.05), right: lobe(.6, .05), fraction: .5 },
    { left: lobe(.5, -.025), right: lobe(.65, .025), fraction: .5 },
    { left: lobe(.65, -.025), right: lobe(.5, .025), fraction: .5 },
    { left: lobe(.6, 0), right: lobe(.6, .1), fraction: .5 },
  ])('uses overlapping aerial duration, not average foot duration: %j', ({ left, right, fraction }) => {
    const profile = fit(samples(left, right)), result = toeCycleResult(profile)!;
    expect(profile.reason).toBeNull(); expect(result).not.toBeNull();
    expect(result.footFractions[0]).toBeCloseTo(left.fraction, 10);
    expect(result.footFractions[1]).toBeCloseTo(right.fraction, 10);
    expect(result.footPhases[0]).toBeCloseTo(left.phase, 10);
    expect(result.footPhases[1]).toBeCloseTo(right.phase, 10);
    expect(result.fraction).toBeCloseTo(fraction, 10);
    expect(result.value).toBeCloseTo(fractionRSI(.6, fraction), 10);
    expect(result.fraction).toBeLessThanOrEqual(Math.min(left.fraction, right.fraction) + 1e-10);
  });

  it('does not use the pelvic support-force shape to select toe aerial fractions', () => {
    const left = lobe(.6, -.05), right = lobe(.6, .05);
    const a = toeCycleResult(fit(samples(left, right, .6, .4)))!;
    const b = toeCycleResult(fit(samples(left, right, .6, .8)))!;
    expect(a.fraction).toBeCloseTo(.5, 10); expect(b.fraction).toBeCloseTo(.5, 10);
    expect(a.value).toBeCloseTo(b.value, 10);
  });

  it.each([TOE_CYCLE_SETTINGS.fractionMin, TOE_CYCLE_SETTINGS.fractionMax])(
    'marks a foot-fraction search boundary at %s without hiding it', fraction => {
      const result = toeCycleResult(fit(samples(lobe(fraction), lobe(fraction))))!;
      expect(result).not.toBeNull(); expect(result.boundary).toBe(true);
      expect(result.fraction).toBeCloseTo(fraction, 10);
    },
  );

  it.each([TOE_CYCLE_SETTINGS.phaseMin, TOE_CYCLE_SETTINGS.phaseMax])(
    'marks a one-foot phase search boundary at %s', phase => {
      const otherPhase = phase < 0 ? phase + .05 : phase - .05;
      const result = toeCycleResult(fit(samples(lobe(.6, phase), lobe(.6, otherPhase))))!;
      expect(result).not.toBeNull(); expect(result.phaseBoundary).toBe(true);
      expect(result.footPhases[0]).toBeCloseTo(phase, 10);
      expect(result.fraction).toBeCloseTo(.55, 10);
    },
  );

  it('preserves the bilateral value when left and right observations are swapped', () => {
    const rows = samples(lobe(.55, -.025), lobe(.65, .05));
    const a = toeCycleResult(fit(rows))!;
    const b = toeCycleResult(fit(rows.map(s => ({ ...s, leftToeY: s.rightToeY, rightToeY: s.leftToeY }))))!;
    expect(b.value).toBeCloseTo(a.value, 10);
    expect(b.footFractions).toEqual([...a.footFractions].reverse());
    expect(b.footPhases).toEqual([...a.footPhases].reverse());
  });

  it('preserves duration under independent positive scale, offsets and linear drifts', () => {
    const rows = samples(lobe(.6, -.05), lobe(.6, .05));
    const before = JSON.stringify(rows), a = toeCycleResult(fit(rows))!;
    const b = toeCycleResult(fit(rows.map(s => ({ ...s,
      leftToeY: 1.3 * s.leftToeY! + 120 + 10 * s.pts,
      rightToeY: .7 * s.rightToeY! - 50 - 8 * s.pts }))))!;
    expect(b.value).toBeCloseTo(a.value, 10);
    expect(b.footFractions).toEqual(a.footFractions); expect(b.footPhases).toEqual(a.footPhases);
    expect(JSON.stringify(rows)).toBe(before);
  });

  it('uses source duration, not the number of frames, for the bilateral RSI formula', () => {
    const left = lobe(.6, -.05), right = lobe(.6, .05);
    const a = toeCycleResult(fit(samples(left, right)))!;
    const b = toeCycleResult(fit(samples(left, right, 1.2), 1.2))!;
    expect(b.fraction).toBeCloseTo(a.fraction, 10); expect(b.value).toBeCloseTo(a.value * 2, 10);
  });

  it('does not infer one missing foot from the other or relax contradictory-foot gates', () => {
    const rows = samples(lobe(.6), lobe(.6));
    for (const key of ['leftToeY', 'rightToeY'] as const) {
      expect(toeCycleResult(fit(rows.map(s => ({ ...s, [key]: null }))))).toBeNull();
      expect(toeCycleResult(fit(rows.map(s => ({ ...s, [key]: 600 }))))).toBeNull();
    }
    const contradictory = fit(samples(lobe(.3), lobe(.8), .6, .6));
    expect(['TOES_DISAGREE', 'TOE_WAVEFORM_MISMATCH']).toContain(contradictory.reason);
    expect(toeCycleResult(contradictory)).toBeNull();
  });

  it('does not fabricate a bilateral result from missing profile period or foot profiles', () => {
    const good = fit(samples(lobe(.6), lobe(.6)));
    expect(toeCycleResult({ ...good, period: null })).toBeNull();
    expect(toeCycleResult({ ...good, footPoints: [[], good.footPoints[1]] })).toBeNull();
    expect(toeCycleResult({ ...good, footPoints: [good.footPoints[0], []] })).toBeNull();
  });
});
