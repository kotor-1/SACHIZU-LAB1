import { describe, expect, it } from 'vitest';
import { G } from '../src/cmj/analysis';
import { analyzeStage1, heightFromBrackets, type Stage1Observation, type TimeBracket } from '../src/cmj/stage1-analysis';

const bracket = (lower: number, upper: number): TimeBracket => ({ lower, upper, frames: [1, 2], source: 'TEST' });
function flight(fps = 240): Stage1Observation[] {
  const v = Math.sqrt(.6 * G), t0 = 1.2;
  return Array.from({ length: Math.floor(2.5 * fps) + 1 }, (_, frame) => {
    const pts = frame / fps, t = pts - t0, h = Math.max(0, v * t - G * t * t / 2);
    const y = 500 - h / .003;
    return { frame, pts, comX: 480, comY: y, bodyScale: 400,
      feet: [0, 1].map(side => ({ edge: [850 - h / .003 - .5, 850 - h / .003 + .5],
        toe: { x: 430 + side * 80, y: 850 - h / .003, visibility: 1 },
        heel: { x: 430 + side * 80, y: 850 - h / .003 - (pts > 1 && pts <= t0 ? 18 : 0), visibility: 1 },
      })) as Stage1Observation['feet'] };
  });
}
describe('CMJ recorded-stage1 interval policy', () => {
  it('propagates BOTH takeoff and apex interval uncertainty, without a subframe-precision claim', () => {
    const tau = Math.sqrt(.6 / G), r = heightFromBrackets('B', bracket(1, 1.01), bracket(1 + tau, 1 + tau + .004));
    expect(r.rangeCm![0]).toBeCloseTo(50 * G * (tau - .01) ** 2, 8);
    expect(r.rangeCm![1]).toBeCloseTo(50 * G * (tau + .004) ** 2, 8);
    expect(r.status).toBe('POINT');
    expect(r.heightCm).toBe((r.rangeCm![0] + r.rangeCm![1]) / 2);
  });
  it('shows a range, not a midpoint, for a 45fps takeoff-width-only example near30cm', () => {
    const tau = Math.sqrt(.6 / G);
    const r = heightFromBrackets('B', bracket(1 - 1 / 90, 1 + 1 / 90), bracket(1 + tau, 1 + tau));
    expect(r.status).toBe('RANGE'); expect(r.heightCm).toBeNull();
    expect(r.rangeCm![1] - r.rangeCm![0]).toBeCloseTo(5.39, 1);
  });
  it('retains the diagnostic band but withholds main height above8cm', () => {
    const r = heightFromBrackets('B', bracket(1, 1.05), bracket(1.247, 1.257));
    expect(r).toMatchObject({ status: 'HOLD', heightCm: null, reason: 'HEIGHT_BAND_TOO_WIDE' });
    expect(r.rangeCm).not.toBeNull();
  });
  it('rejects invalid or overlapping time bands rather than clamping them into a jump', () => {
    for (const start of [bracket(2, 1), bracket(NaN, 1), bracket(1, 1.3)])
      expect(heightFromBrackets('B', start, bracket(1.2, 1.3)).status).toBe('HOLD');
  });
  it('brackets source observations, does not detect heel rise as takeoff, and fits the airborne apex', () => {
    const r = analyzeStage1(flight());
    expect(r.takeoff?.lower).toBeLessThanOrEqual(1.2);
    expect(r.takeoff?.upper).toBeGreaterThanOrEqual(1.2);
    expect(r.takeoff?.lower).toBeGreaterThan(1.17);
    expect(r.apex?.lower).toBeLessThanOrEqual(1.2 + Math.sqrt(.6 / G));
    expect(r.apex?.upper).toBeGreaterThanOrEqual(1.2 + Math.sqrt(.6 / G));
    expect(r.B.rangeCm![0]).toBeLessThan(30); expect(r.B.rangeCm![1]).toBeGreaterThan(30);
    expect(r.A.rangeCm).not.toBeNull();
    expect(r.stage).toBe('RECORDING_ONLY');
  });
  it('does not output A orB using toe/heel motion without image edge evidence', () => {
    const r = analyzeStage1(flight().map(s => ({ ...s, feet: s.feet.map(f => ({ ...f, edge: null })) as Stage1Observation['feet'] })));
    expect(r.B.heightCm).toBeNull(); expect(r.A.heightCm).toBeNull();
    expect(r.reason).toBe('SOLE_BASELINE_UNRESOLVED');
  });
  it('does not invent a jump from heel rise alone', () => {
    const r = analyzeStage1(flight().map(s => ({ ...s, feet: s.feet.map(f => ({ ...f, edge: [849.5, 850.5] })) as Stage1Observation['feet'] })));
    expect(r.reason).toBe('NO_BILATERAL_AIR_EVIDENCE');
  });
  it('uses later departing foot and earlier arriving foot', () => {
    const rows = flight();
    for (const s of rows) if (s.pts > 1.2 && s.pts < 1.22) s.feet[1].edge = [849.5, 850.5];
    const r = analyzeStage1(rows);
    const sides = r.diagnostics.sideTakeoffs as TimeBracket[];
    expect(r.takeoff?.lower).toBe(Math.max(...sides.map(s => s.lower)));
    expect(r.takeoff?.upper).toBe(Math.max(...sides.map(s => s.upper)));
    const landings = r.diagnostics.sideLandings as TimeBracket[];
    expect(r.landing?.lower).toBe(Math.min(...landings.map(s => s.lower)));
  });
  it('preserves height bands under time-origin changes', () => {
    const r = analyzeStage1(flight()), shifted = analyzeStage1(flight().map(s => ({ ...s, pts: s.pts + 100 })));
    expect(shifted.B.status).toBe(r.B.status);
    expect(shifted.B.rangeCm![0]).toBeCloseTo(r.B.rangeCm![0], 5);
    expect(shifted.B.rangeCm![1]).toBeCloseTo(r.B.rangeCm![1], 5);
  });
  it('does not bridge an omitted source frame at takeoff or duplicate timestamps', () => {
    expect(analyzeStage1(flight().filter(s => s.frame !== 288)).B.heightCm).toBeNull();
    const rows = flight(); rows[300].pts = rows[299].pts;
    expect(analyzeStage1(rows).reason).toBe('INVALID_TIMELINE');
  });
  it('v2: judges floor noise by MAD, so two outlying sole frames do not hold a 240fps recording', () => {
    const rows = flight();
    for (const [frame, offset] of [[10, 5], [20, -5]] as const)
      rows[frame].feet = rows[frame].feet.map(f => ({ ...f, edge: [f.edge![0] + offset, f.edge![1] + offset] })) as Stage1Observation['feet'];
    const r = analyzeStage1(rows);
    expect(r.reason).not.toBe('SOLE_BASELINE_UNRESOLVED');
    expect(r.takeoff).not.toBeNull();
  });
  it('v2: rejects a genuinely noisy floor regardless of frame rate', () => {
    const rows = flight();
    rows.forEach((s, i) => { if (s.pts <= .2) s.feet = s.feet.map(f => ({ ...f, edge: [f.edge![0] + 6 * (i % 3 - 1), f.edge![1] + 6 * (i % 3 - 1)] })) as Stage1Observation['feet']; });
    expect(analyzeStage1(rows).reason).toBe('SOLE_BASELINE_UNRESOLVED');
  });
  it('v2: a 30fps apex refit with too few points is skipped, not treated as instability', () => {
    const r = analyzeStage1(flight(30));
    expect(r.apex).not.toBeNull();
    expect(r.B.reason).not.toBe('APEX_RESAMPLING_UNRESOLVED');
    expect(r.B.rangeCm![0]).toBeLessThan(30); expect(r.B.rangeCm![1]).toBeGreaterThan(30);
  });
  it('keeps B independent of landing symmetry and A is comparison, not fallback', () => {
    const rows = flight();
    for (const s of rows) if (s.pts > 1.62) s.feet = s.feet.map(f => ({ ...f, edge: [730, 731] })) as Stage1Observation['feet'];
    const r = analyzeStage1(rows), original = analyzeStage1(flight());
    expect(r.A.status).toBe('HOLD');
    expect(r.B.rangeCm).toEqual(original.B.rangeCm);
  });
});
