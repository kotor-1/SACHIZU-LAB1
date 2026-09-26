import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import type { NormalizedLandmark } from '@mediapipe/tasks-vision';
import type { PoseFrame } from '../src/rebound/prediction-observations';
import type { Apex } from '../src/rebound/waveform-fit';
import { fractionRSI, hybridDisplacement } from '../src/rebound/hybrid-physics';
import {
  fitToeCycle, toeCycleDepth, toeCycleReport, toeCycleResult, toeCycleSamples,
  TOE_CYCLE_SETTINGS, TOE_CYCLE_VERSION, type ToeSample,
} from '../src/rebound/toe-cycle-research';

// Same-form synthetic trajectories check numerical implementation only. They
// are not independent evidence that toes or pelvis obey this physical model.
function cycle(fraction = .6, rightFraction = fraction, period = .6, toePhase = 0): ToeSample[] {
  return Array.from({ length: 145 }, (_, frame) => ({
    frame, pts: frame / 144 * period, comX: 300,
    comY: 400 + 1200 * hybridDisplacement(frame / 144, fraction, 'HALF_SINE'), bodyScale: 200,
    leftToeY: 600 + 70 * toeCycleDepth(frame / 144, fraction, toePhase),
    rightToeY: 620 + 90 * toeCycleDepth(frame / 144, rightFraction, toePhase),
  }));
}
const apex = (pts: number, frame: number): Apex => ({ pts, frame, y: 400 });
const fit = (rows: ToeSample[]) => fitToeCycle(rows, apex(0, 0), apex(.6, 144));
function poses(count = 3, fraction = .6): PoseFrame[] {
  return Array.from({ length: count * 144 + 1 }, (_, frame) => {
    const phase = (frame / 144 + .5) % 1;
    const hip = .4 + 1200 / 960 * hybridDisplacement(phase, fraction, 'HALF_SINE');
    const landmarks: NormalizedLandmark[] = Array.from({ length: 33 }, () => ({ x: .5, y: -1, z: 0, visibility: 0 }));
    for (const [index, y] of [[23, hip], [24, hip], [25, hip + .15], [26, hip + .15],
      [27, hip + .30], [28, hip + .30], [31, .76 + .075 * toeCycleDepth(phase, fraction)],
      [32, .76 + .075 * toeCycleDepth(phase, fraction)]]) {
      landmarks[index] = { x: index % 2 ? .46 : .54, y, z: 0, visibility: .99 };
    }
    // Heels 29 and 30 deliberately remain unavailable in every frame.
    return { frame, pts: frame / 240, poses: [landmarks] };
  });
}

describe('continuous bilateral toe-constrained cycle: implementation, not accuracy validation', () => {
  it('exports a bounded periodic depth template for valid fractions and phase offsets', () => {
    expect(TOE_CYCLE_VERSION).toContain('research');
    for (const fraction of [.2, .45, .85]) for (const phase of [-1, -.2, 0, .2, .5, 1, 1.2]) {
      const depth = toeCycleDepth(phase, fraction, .025);
      expect(Number.isFinite(depth)).toBe(true); expect(depth).toBeGreaterThanOrEqual(0); expect(depth).toBeLessThanOrEqual(1);
      expect(toeCycleDepth(phase + 1, fraction, .025)).toBeCloseTo(depth, 12);
    }
    expect(toeCycleDepth(0, .6)).toBe(0); expect(toeCycleDepth(.5, .6)).toBe(1);
    expect(TOE_CYCLE_SETTINGS.fractionMin).toBeGreaterThan(0);
    expect(TOE_CYCLE_SETTINGS.fractionMax).toBeLessThan(1);
  });

  it('rejects malformed template inputs instead of emitting nonfinite depth', () => {
    for (const fraction of [-.5, 0, 1, 2, NaN, Infinity]) {
      expect(() => toeCycleDepth(0, fraction)).toThrow('INVALID_TOE_TEMPLATE_INPUT');
    }
    for (const value of [NaN, Infinity, -Infinity]) {
      expect(() => toeCycleDepth(value, .6)).toThrow('INVALID_TOE_TEMPLATE_INPUT');
      expect(() => toeCycleDepth(.3, .6, value)).toThrow('INVALID_TOE_TEMPLATE_INPUT');
    }
  });

  it.each([.4, .6, .8])('recovers same-form synthetic fraction %s without any reference label', fraction => {
    const profile = fit(cycle(fraction)), result = toeCycleResult(profile);
    expect(profile.reason).toBeNull(); expect(profile.points).toHaveLength(131);
    expect(result?.fraction).toBeCloseTo(fraction, 10);
    expect(result?.value).toBeCloseTo(fractionRSI(.6, fraction), 10);
    expect(result?.waveformError).toBeLessThan(1e-10);
    expect(profile.leftBestFraction).toBeCloseTo(fraction, 10);
    expect(profile.rightBestFraction).toBeCloseTo(fraction, 10);
    expect(result!.profileRange[0]).toBeLessThanOrEqual(result!.value);
    expect(result!.profileRange[1]).toBeGreaterThanOrEqual(result!.value);
  });

  it.each([-.15, -.075, -.0125, 0, .0125, .075, .15])(
    'keeps the known aerial fraction when common toe phase is %s cycles', phase => {
      const profile = fit(cycle(.6, .6, .6, phase)), result = toeCycleResult(profile);
      expect(profile.reason).toBeNull();
      expect(result?.phase).toBeCloseTo(phase, 10);
      expect(result?.fraction).toBeCloseTo(.6, 10);
      expect(result?.value).toBeCloseTo(fractionRSI(.6, .6), 10);
      expect(result?.waveformError).toBeLessThan(1e-10);
      // The old ±.05 range clipped phase .075 and changed fraction to .63.
      // Recovery tests a search-range restriction, not real-video accuracy.
    },
  );

  it.each([
    { phase: -.15, period: .25, scale: .5 },
    { phase: .15, period: .25, scale: 1.5 },
    { phase: -.15, period: 1.2, scale: 1.5 },
    { phase: .15, period: 1.2, scale: .5 },
  ])('uses dimensionless phase at duration and phase bounds: %j', ({ phase, period, scale }) => {
    const rows = cycle(.6, .6, period, phase).map(s => ({ ...s,
      comX: s.comX! * scale + 10, comY: s.comY! * scale + 40, bodyScale: s.bodyScale! * scale,
      leftToeY: s.leftToeY! * scale + 60, rightToeY: s.rightToeY! * scale - 20 }));
    const profile = fitToeCycle(rows, apex(0, 0), apex(period, 144)), result = toeCycleResult(profile);
    expect(profile.reason).toBeNull(); expect(result?.fraction).toBeCloseTo(.6, 10);
    expect(result?.phase).toBeCloseTo(phase, 10);
    expect(result!.phase * period).toBeCloseTo(phase * period, 10);
    expect(result?.value).toBeCloseTo(fractionRSI(period, .6), 10);
  });

  it('preserves independent positive image scale, offsets and linear drift', () => {
    const rows = cycle(), baseline = toeCycleResult(fit(rows))!;
    const shifted = rows.map(s => ({ ...s, comX: s.comX! * 1.5 + 10,
      comY: s.comY! * 1.5 + 60 + 4 * s.pts, bodyScale: s.bodyScale! * 1.5,
      leftToeY: s.leftToeY! * 1.5 + 80 + 20 * s.pts,
      rightToeY: s.rightToeY! * 1.5 - 50 - 15 * s.pts }));
    expect(toeCycleResult(fit(shifted))?.value).toBeCloseTo(baseline.value, 10);
  });

  it('uses elapsed source time, not frame count, in the RSI formula', () => {
    const short = toeCycleResult(fit(cycle()))!;
    const long = toeCycleResult(fitToeCycle(cycle(.6, .6, 1.2), apex(0, 0), apex(1.2, 144)))!;
    expect(long.fraction).toBeCloseTo(short.fraction, 10);
    expect(long.value).toBeCloseTo(short.value * 2, 10);
  });

  it('does not use heels and does not replace missing toe observations with the other foot', () => {
    const input = poses(), samples = toeCycleSamples(input);
    expect(samples.every(s => s.leftToeY !== null && s.rightToeY !== null)).toBe(true);
    const report = toeCycleReport(input, 'synthetic', 'no-heels.mov');
    expect(report.acceptedCycles).toBe(2); expect(report.mean).not.toBeNull();
    const missing = input.map(p => ({ ...p, poses: p.poses.map(points => points.map((point, index) =>
      index === 31 ? { ...point, visibility: 0 } : point)) }));
    const invalid = toeCycleReport(missing, 'synthetic', 'one-toe-missing.mov');
    expect(invalid.detected).toBe(report.detected); expect(invalid.acceptedCycles).toBe(0); expect(invalid.mean).toBeNull();
    expect(invalid.cycles.every(c => c.reason === 'LEFT_TOE_TRACKING_GAP')).toBe(true);
  });

  it('keeps sparse isolated missing toe observations missing without fabricating values', () => {
    const input = cycle(); input[30].leftToeY = null;
    const before = JSON.stringify(input), profile = fit(input);
    expect(profile.reason).toBeNull(); expect(profile.coverage[0]).toBeLessThan(1);
    expect(toeCycleResult(profile)?.fraction).toBeCloseTo(.6, 10);
    expect(input[30].leftToeY).toBeNull(); expect(JSON.stringify(input)).toBe(before);
  });

  it('rejects prolonged gaps, static toes, negligible motion, and inverted toe trajectories', () => {
    for (const [key, expected] of [['leftToeY', 'LEFT'], ['rightToeY', 'RIGHT']] as const) {
      const gap = cycle().map((s, i) => i >= 50 && i <= 65 ? { ...s, [key]: null } : s);
      expect(fit(gap).reason).toBe(`${expected}_TOE_TRACKING_GAP`);
      const flat = cycle().map(s => ({ ...s, [key]: 600 }));
      expect(fit(flat).reason).toBe(`${expected}_TOE_INSUFFICIENT_MOTION`);
      const small = cycle().map(s => ({ ...s, [key]: 600 + toeCycleDepth(s.pts / .6, .6) }));
      expect(fit(small).reason).toBe(`${expected}_TOE_INSUFFICIENT_MOTION`);
    }
    const inverse = cycle().map(s => ({ ...s, leftToeY: 1200 - s.leftToeY!, rightToeY: 1240 - s.rightToeY! }));
    expect(toeCycleResult(fit(inverse))).toBeNull();
    expect(toeCycleResult(fit(cycle().map(s => ({ ...s, comY: 400 }))))).toBeNull();
  });

  it('does not accept contradictory foot waveforms as a valid bilateral estimate', () => {
    const profile = fit(cycle(.35, .8));
    expect(['TOES_DISAGREE', 'TOE_WAVEFORM_MISMATCH']).toContain(profile.reason);
    expect(toeCycleResult(profile)).toBeNull();
  });

  it('rejects nonfinite observations, invalid period, and missing or negative body scale', () => {
    for (const value of [NaN, Infinity, -Infinity]) {
      expect(toeCycleResult(fit(cycle().map(s => ({ ...s, leftToeY: value }))))).toBeNull();
      expect(toeCycleResult(fit(cycle().map(s => ({ ...s, comY: value }))))).toBeNull();
      expect(toeCycleResult(fitToeCycle(cycle(), apex(0, 0), apex(value, 144)))).toBeNull();
    }
    for (const bodyScale of [null, -200, 0]) expect(toeCycleResult(fit(cycle().map(s => ({ ...s, bodyScale }))))).toBeNull();
    for (const end of [-.6, 0, .2, 1.3]) expect(fitToeCycle(cycle(), apex(0, 0), apex(end, 144)).reason).toBe('PERIOD_OUT_OF_RANGE');
  });

  it('does not use malformed report timelines or low-rate recordings', () => {
    const base = poses();
    for (const bad of [[...base].reverse(), base.map(s => ({ ...s, pts: 0 })),
      base.map(s => ({ ...s, pts: NaN })), base.filter((_, i) => i % 4 === 0)]) {
      const r = toeCycleReport(bad, 'synthetic', 'invalid.mov');
      expect(r.mean).toBeNull(); expect(r.acceptedCycles).toBe(0); expect(r.reason).not.toBeNull();
    }
  });

  it('guards the standalone fitter against invalid chronology and nonfinite pelvic samples', () => {
    for (const malformed of [[...cycle()].reverse(), cycle().map(s => ({ ...s, pts: 0 })),
      cycle().map(s => ({ ...s, frame: .5 })), cycle().map(s => ({ ...s, frame: 0 })),
      cycle().map(s => ({ ...s, pts: NaN }))]) {
      const profile = fit(malformed);
      expect(profile.reason).toBe('INVALID_TIMELINE'); expect(toeCycleResult(profile)).toBeNull();
    }
    for (const value of [NaN, Infinity, -Infinity]) {
      expect(fit(cycle().map(s => ({ ...s, comY: value }))).reason).toBe('INVALID_OBSERVATIONS');
    }
  });

  it.each([3, 12])('retains %s detected peaks without fixed-ten or last-three selection', count => {
    const r = toeCycleReport(poses(count), 'synthetic', 'synthetic.mov');
    expect(r.detected).toBe(count); expect(r.totalCycles).toBe(count - 1); expect(r.acceptedCycles).toBe(count - 1);
    expect(r.acceptedCycleIds).toEqual(Array.from({ length: count - 1 }, (_, i) => i + 1));
    expect(r.cycles.at(-1)?.toPeak).toBe(count); expect(r.mean).toBeCloseTo(fractionRSI(.6, .6), 3);
  });

  it('keeps all adjacent cycle identities when one cycle fails; no stitching or zero-fill', () => {
    const input = poses(4).map(s => ({ ...s, poses: s.poses.map(points => points.map((point, index) =>
      index === 31 && s.pts > .51 && s.pts < .55 ? { ...point, visibility: 0 } : point)) }));
    const r = toeCycleReport(input, 'synthetic', 'gap.mov');
    expect(r.detected).toBe(4); expect(r.totalCycles).toBe(3); expect(r.acceptedCycles).toBe(2);
    expect(r.acceptedCycleIds).toEqual([2, 3]); expect(r.partial).toBe(true);
    expect(r.cycles[0].result).toBeNull(); expect(r.cycles[0].reason).toBe('LEFT_TOE_TRACKING_GAP');
    expect(r.cycles.map(c => [c.fromPeak, c.toPeak])).toEqual([[1, 2], [2, 3], [3, 4]]);
    expect(r.mean).toBe(r.cycles.filter(c => c.result).reduce((s, c) => s + c.result!.value, 0) / r.acceptedCycles);
  });

  it('is deterministic, reference-independent, input-preserving, and explicit about uncertainty', () => {
    const input = poses(), before = JSON.stringify(input), a = toeCycleReport(input, 'hash-a', 'reference-1.40.mov');
    expect(toeCycleReport(input, 'hash-a', 'reference-1.40.mov')).toEqual(a);
    const b = toeCycleReport(input, 'hash-b', 'reference-0.58.mov');
    expect(b.mean).toBe(a.mean); expect(b.cycles).toEqual(a.cycles); expect(JSON.stringify(input)).toBe(before);
    expect(a.validated).toBe(false); expect(a.manualInputsUsed).toBe(false); expect(a.observedContactEventsUsed).toBe(false);
    expect(a.populationCorrectionUsed).toBe(false); expect(a.internallyEstimatedSupportFraction).toBe(true);
    expect(a.meanProfileRange![0]).toBeLessThan(a.mean!); expect(a.meanProfileRange![1]).toBeGreaterThan(a.mean!);
    expect(readFileSync('src/rebound/toe-cycle-research.ts', 'utf8')).not.toMatch(/hybrid-model-data|fitHybridPrior|predictHybrid|1\.40|\.slice\(-3\)/);
  });
});
