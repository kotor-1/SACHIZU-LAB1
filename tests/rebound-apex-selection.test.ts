import { describe, expect, it } from 'vitest';
import { selectBilateralApexes } from '../src/rebound/apex-selection';
import type { ToeSample } from '../src/rebound/toe-cycle-research';
import type { Apex } from '../src/rebound/waveform-fit';

// Synthetic trajectory morphology only. These tests neither label real
// contact events nor establish that a toe excursion is a measured jump.
const period = .6;
function fixture(): { samples: ToeSample[]; candidates: Apex[] } {
  const samples = Array.from({ length: 433 }, (_, frame) => {
    const pts = frame / 120, wave = Math.cos(2 * Math.PI * pts / period);
    return { frame, pts, comX: 400, comY: 400 - 40 * wave, bodyScale: 200,
      leftToeY: 650 - 60 * wave, rightToeY: 680 - 75 * wave };
  });
  const candidates = Array.from({ length: 5 }, (_, i) => ({ frame: (i + 1) * 72, pts: (i + 1) * period, y: 360 }));
  return { samples, candidates };
}

describe('bilateral apex selection from continuous toe morphology', () => {
  it('keeps complete bilateral rises and falls without a fixed jump count', () => {
    const { samples, candidates } = fixture();
    const result = selectBilateralApexes(samples, candidates);
    expect(result.period).toBeCloseTo(period, 12);
    expect(result.checks).toHaveLength(5);
    expect(result.checks.every(c => c.status === 'SUPPORTED' && c.included && c.reason === null)).toBe(true);
    expect(result.peaks).toEqual(candidates);
    expect(result.candidateIndices).toEqual([0, 1, 2, 3, 4]);
    for (const check of result.checks) {
      expect(check.excursionsOverLeg.every(v => v !== null && v >= .04)).toBe(true);
    }
  });

  it.each(['leftToeY', 'rightToeY', 'both'] as const)('rejects flat %s despite pelvic peaks', side => {
    const { samples, candidates } = fixture();
    const flat = samples.map(s => ({ ...s,
      leftToeY: side === 'rightToeY' ? s.leftToeY : 600,
      rightToeY: side === 'leftToeY' ? s.rightToeY : 620 }));
    const result = selectBilateralApexes(flat, candidates);
    expect(result.peaks).toEqual([]);
    expect(result.checks.every(c => c.status === 'NOT_BILATERAL' && !c.included)).toBe(true);
  });

  it('rejects monotonic foot motion rather than treating travel as a complete lobe', () => {
    const { samples, candidates } = fixture();
    const step = samples.map(s => ({ ...s, leftToeY: 500 + 90 * s.pts, rightToeY: 700 - 80 * s.pts }));
    const result = selectBilateralApexes(step, candidates);
    expect(result.peaks).toHaveLength(0);
    expect(result.checks.every(c => c.status === 'NOT_BILATERAL')).toBe(true);
  });

  it('allows modest independent toe phase and amplitude without requiring identical feet', () => {
    const { samples, candidates } = fixture();
    const independent = samples.map(s => ({ ...s,
      rightToeY: 720 - 45 * Math.cos(2 * Math.PI * (s.pts - .035) / period) }));
    const result = selectBilateralApexes(independent, candidates);
    expect(result.candidateIndices).toEqual([0, 1, 2, 3, 4]);
    expect(result.checks.every(c => c.status === 'SUPPORTED')).toBe(true);
  });

  it('does not convert a single landmark outlier into bilateral jump evidence', () => {
    const { samples, candidates } = fixture();
    const outlier = samples.map(s => ({ ...s,
      leftToeY: s.frame === candidates[2].frame ? 100 : 650 }));
    const result = selectBilateralApexes(outlier, candidates);
    expect(result.checks[2]).toMatchObject({ status: 'NOT_BILATERAL', included: false });
  });

  it('retains original candidate indices when a middle non-bilateral peak is excluded', () => {
    const { samples, candidates } = fixture();
    const altered = samples.map(s => Math.abs(s.pts - 1.8) <= .3 + 1e-9
      ? { ...s, leftToeY: 650, rightToeY: 680 } : s);
    const result = selectBilateralApexes(altered, candidates);
    expect(result.checks[2]).toMatchObject({ candidateIndex: 2, status: 'NOT_BILATERAL', included: false });
    expect(result.candidateIndices).toEqual([0, 1, 3, 4]);
    // Callers can see the gap and must not join candidates 1 and 3 as adjacent.
    expect(result.peaks).toEqual([candidates[0], candidates[1], candidates[3], candidates[4]]);
  });

  it.each(['start', 'end'] as const)('does not declare a complete peak at a clipped recording %s', edge => {
    const { samples, candidates } = fixture();
    const clipped = samples.filter(s => edge === 'start' ? s.pts >= .45 : s.pts <= 3.15);
    const result = selectBilateralApexes(clipped, candidates);
    const i = edge === 'start' ? 0 : 4;
    expect(result.checks[i]).toMatchObject({ status: 'INCOMPLETE_WINDOW', included: false });
    expect(result.candidateIndices).not.toContain(i);
    expect(result.checks.filter(c => c.status === 'SUPPORTED')).toHaveLength(4);
  });

  it.each(['leftToeY', 'rightToeY'] as const)('preserves an unresolved candidate when %s is missing', key => {
    const { samples, candidates } = fixture();
    const missing = samples.map(s => Math.abs(s.pts - 1.8) < .055 ? { ...s, [key]: null } : s);
    const result = selectBilateralApexes(missing, candidates);
    expect(result.checks[2]).toMatchObject({ status: 'UNRESOLVED', included: true });
    expect(result.candidateIndices).toEqual([0, 1, 2, 3, 4]);
    expect(result.peaks).toEqual(candidates);
  });

  it.each(['start', 'end'] as const)('allows a mildly clipped %s with sufficient observed bilateral rise and fall', edge => {
    const { samples, candidates } = fixture();
    const clipped = samples.filter(s => edge === 'start' ? s.pts >= .35 - 1e-9 : s.pts <= 3.25 + 1e-9);
    const result = selectBilateralApexes(clipped, candidates);
    const i = edge === 'start' ? 0 : 4;
    expect(result.checks[i]).toMatchObject({ status: 'SUPPORTED', included: true });
    expect(Math.min(...result.checks[i].recordingSectionCoverage!)).toBeCloseTo(.16 / .21, 10);
    const flat = clipped.map(s => ({ ...s, leftToeY: 650 }));
    expect(selectBilateralApexes(flat, candidates).checks[i]).toMatchObject({ status: 'NOT_BILATERAL', included: false });
  });

  it('does not confuse complete-record tracking loss with a clipped file boundary', () => {
    const { samples, candidates } = fixture();
    const missing = samples.map(s => s.pts > 3.04 ? { ...s, leftToeY: null, rightToeY: null } : s);
    const result = selectBilateralApexes(missing, candidates);
    expect(result.checks[4]).toMatchObject({ status: 'UNRESOLVED', included: true });
    expect(result.checks[4].status).not.toBe('INCOMPLETE_WINDOW');
  });

  it('does not manufacture evidence by interpolating large temporal gaps', () => {
    const { samples, candidates } = fixture();
    const sparse = samples.filter(s => Math.abs(s.pts - 1.8) > .055);
    const result = selectBilateralApexes(sparse, candidates);
    expect(result.checks[2]).toMatchObject({ status: 'UNRESOLVED', included: true });
  });

  it('requires temporal support instead of accepting three clustered observations', () => {
    const { samples, candidates } = fixture();
    const clustered = samples.filter(s => Math.abs(s.pts - 1.8) > .3 ||
      [1.55, 1.8, 2.05].some(t => Math.abs(s.pts - t) < .013));
    const result = selectBilateralApexes(clustered, candidates);
    expect(result.checks[2]).toMatchObject({ status: 'UNRESOLVED', included: true });
  });

  it('is invariant to common image scale and independent coordinate offsets', () => {
    const { samples, candidates } = fixture();
    const before = selectBilateralApexes(samples, candidates);
    const scale = 1.7;
    const transformed = samples.map(s => ({ ...s, bodyScale: s.bodyScale! * scale,
      comX: s.comX! * scale + 35, comY: s.comY! * scale - 100,
      leftToeY: s.leftToeY! * scale + 110, rightToeY: s.rightToeY! * scale - 45 }));
    const after = selectBilateralApexes(transformed, candidates.map(p => ({ ...p, y: p.y * scale - 100 })));
    expect(after.candidateIndices).toEqual(before.candidateIndices);
    expect(after.checks.map(c => c.status)).toEqual(before.checks.map(c => c.status));
    after.checks.forEach((c, i) => c.excursionsOverLeg.forEach((v, side) =>
      expect(v).toBeCloseTo(before.checks[i].excursionsOverLeg[side]!, 12)));
  });

  it('is invariant to source-time translation and swapping left and right', () => {
    const { samples, candidates } = fixture();
    const before = selectBilateralApexes(samples, candidates);
    const after = selectBilateralApexes(samples.map(s => ({ ...s, pts: s.pts + 8,
      leftToeY: s.rightToeY, rightToeY: s.leftToeY })), candidates.map(p => ({ ...p, pts: p.pts + 8 })));
    expect(after.period).toBeCloseTo(before.period!, 12);
    expect(after.candidateIndices).toEqual(before.candidateIndices);
    after.checks.forEach((c, i) => c.excursionsOverLeg.forEach((v, side) =>
      expect(v).toBeCloseTo(before.checks[i].excursionsOverLeg[1 - side]!, 12)));
  });

  it('does not read a reference score or person metadata, or mutate the inputs', () => {
    const { samples, candidates } = fixture();
    const original = JSON.stringify({ samples, candidates });
    const baseline = selectBilateralApexes(samples, candidates);
    const tagged = samples.map(s => ({ ...s, referenceRSI: 999, age: 7, filename: 'arbitrary.mov' }));
    expect(selectBilateralApexes(tagged, candidates)).toEqual(baseline);
    expect(JSON.stringify({ samples, candidates })).toBe(original);
  });

  it('handles no candidates without inventing an interval', () => {
    const { samples } = fixture();
    expect(selectBilateralApexes(samples, [])).toMatchObject({ period: null, checks: [], peaks: [], candidateIndices: [] });
  });

  it('does not invent a period for a single candidate', () => {
    const { samples, candidates } = fixture();
    const result = selectBilateralApexes(samples, candidates.slice(0, 1));
    expect(result.period).toBeNull();
    expect(result.checks[0]).toMatchObject({ status: 'UNRESOLVED', included: true });
  });

  it('marks a non-increasing timeline unresolved instead of classifying toes', () => {
    const { samples, candidates } = fixture();
    const invalid = samples.map((s, i) => i === 10 ? { ...s, pts: samples[9].pts } : s);
    const result = selectBilateralApexes(invalid, candidates);
    expect(result.checks.every(c => c.status === 'UNRESOLVED' && c.included)).toBe(true);
  });

  it('requires a finite positive geometric scale', () => {
    const { samples, candidates } = fixture();
    const invalid = samples.map(s => ({ ...s, bodyScale: null }));
    const result = selectBilateralApexes(invalid, candidates);
    expect(result.checks.every(c => c.status === 'UNRESOLVED' && c.included)).toBe(true);
  });

  it('treats a non-finite toe as missing, not as a qualifying excursion', () => {
    const { samples, candidates } = fixture();
    const invalid = samples.map(s => ({ ...s, rightToeY: Number.NaN }));
    const result = selectBilateralApexes(invalid, candidates);
    expect(result.checks.every(c => c.status === 'UNRESOLVED' && c.included)).toBe(true);
  });
});
