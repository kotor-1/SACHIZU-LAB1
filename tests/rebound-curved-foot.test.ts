import { describe, expect, it } from 'vitest';
import { fitCurvedPixelBoundary, fitPixelBoundary, type PixelRow } from '../src/rebound/pixel-foot';
import { refineAutomaticReview } from '../src/rebound/automatic-foot-refinement';
import { refineReview } from '../src/rebound/review-refinement';
import type { RegisteredAnalysis } from '../src/rebound/registered-template';

function rows(curvature = 1800, change = true): PixelRow[] {
  return Array.from({ length: 121 }, (_, frame) => {
    const pts = .75 + frame / 240, t = pts - 1, air = Math.max(0, t);
    return { frame, pts, feet: [0, 1].map(side => {
      const y = 800 + (side === 0 ? curvature : 0) * t * t + (change ? -600 * air + 300 * air ** 2 : 0);
      return { ys: [y, y + .2, y + .4], contrast: 100, reason: null };
    }) as PixelRow['feet'] };
  });
}
function base(): RegisteredAnalysis {
  return { version: 'test', validated: false, registration: null, reason: null, detected: 1, selectedPeakFrames: [108], excludedPeakFrames: [],
    jumps: [{ jump: 1, takeoff: { pts: 1, source: 'AUTO_FOOT' }, landing: null, heightM: null, rsi: null,
      flightSeconds: null, contactSeconds: null, flightSource: null, contactSource: null, reason: null }],
    fits: [], validRSICount: 0, meanRSI: null, maxRSI: null, warnings: [] };
}
describe('failed takeoff curved-support reinspection', () => {
  it('recovers a known velocity transition after curved pre-lift motion without a time shift', () => {
    const data = rows();
    expect(fitPixelBoundary(data, 0, 1, 'takeoff').pts).toBeNull();
    for (const seed of [.98, 1, 1.02]) expect(fitCurvedPixelBoundary(data, 0, seed, 'takeoff').pts).toBeCloseTo(1, 5);
  });
  it('requires a change rather than accepting a continuous parabola or flat data', () => {
    for (const c of [0, 600, 1800, -1800]) expect(fitCurvedPixelBoundary(rows(c, false), 0, 1, 'takeoff').pts).toBeNull();
  });
  it('retains gap, finite-data and timeline requirements', () => {
    const gap = rows().filter(r => r.pts < .98 || r.pts > 1.02);
    expect(fitCurvedPixelBoundary(gap, 0, 1, 'takeoff').reason).toBe('PIXEL_TRACKING_GAP');
    const bad = rows(); bad[60].feet[0].ys![0] = NaN;
    expect(fitCurvedPixelBoundary(bad, 0, 1, 'takeoff').pts).toBeNull();
    expect(fitCurvedPixelBoundary(rows().reverse(), 0, 1, 'takeoff').reason).toBe('INVALID_TIMELINE');
  });
  it('recovers the failed side without replacing the successfully fitted other foot', () => {
    const data = rows(), old = refineReview(base(), data, data, 'BOTH');
    expect(old.footRefinement!.events[0].applied).toBe(false);
    const next = refineAutomaticReview(base(), data, data, 'BOTH');
    expect(next.footRefinement!.events[0].applied).toBe(true);
    expect(next.jumps[0].takeoff?.pts).toBeCloseTo(1, 5);
    expect(next.footRefinement!.events[0].feet[0].model).toBe('CURVED_SUPPORT');
    expect(next.footRefinement!.events[0].feet[1]).toEqual(old.footRefinement!.events[0].feet[1]);
  });
  it('does not weaken the two-foot requirement or repair data with the wrong source timeline', () => {
    const data = rows(); data.forEach(r => { r.feet[1].ys = null; });
    expect(refineAutomaticReview(base(), data, data, 'BOTH').footRefinement!.events[0].applied).toBe(false);
    const valid = rows(), wrongFrames = valid.map(r => ({ ...r, pts: r.pts + .001 }));
    expect(refineAutomaticReview(base(), valid, wrongFrames, 'BOTH').footRefinement!.applied).toBe(0);
  });
  it('preserves accepted legacy fits and manual boundaries exactly', () => {
    const data = rows(0), old = refineReview(base(), data, data, 'BOTH'), next = refineAutomaticReview(base(), data, data, 'BOTH');
    expect(old.footRefinement!.events[0].applied).toBe(true);
    expect(next.jumps).toEqual(old.jumps); expect(next.footRefinement!.events).toEqual(old.footRefinement!.events);
    const manual = base(); manual.jumps[0].takeoff!.source = 'MANUAL';
    expect(refineAutomaticReview(manual, rows(), rows(), 'BOTH').jumps[0].takeoff).toEqual(manual.jumps[0].takeoff);
  });
});
