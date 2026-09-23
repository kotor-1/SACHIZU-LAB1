import { describe, expect, it } from 'vitest';
import { G } from '../src/cmj/analysis';
import { reviewSummary, reviewedExport } from '../src/rebound/auto-review';
import type { JumpMode } from '../src/rebound/lower-body';
import { fitPixelBoundary, type PixelRow } from '../src/rebound/pixel-foot';
import type { RegisteredAnalysis } from '../src/rebound/registered-template';
import { missingPixelSeed, refineReview } from '../src/rebound/review-refinement';

const frames = Array.from({ length: 601 }, (_, frame) => ({ frame, pts: frame / 240 }));
const takeoffFrame = (jump: number) => 72 + 156 * jump;
const landingFrame = (jump: number) => 168 + 156 * jump;
function fixture(): RegisteredAnalysis {
  return { version: 'test', validated: false, registration: null, reason: null, detected: 3,
    selectedPeakFrames: [120, 276, 432], excludedPeakFrames: [], fits: [], warnings: [],
    validRSICount: 2, meanRSI: G * .375 ** 2 / 8 / .275, maxRSI: G * .375 ** 2 / 8 / .275,
    jumps: Array.from({ length: 3 }, (_, i) => ({ jump: i + 1,
      takeoff: { pts: takeoffFrame(i) / 240 + .0125, source: 'AUTO_FOOT' },
      landing: { pts: landingFrame(i) / 240 - .0125, source: 'AUTO_FOOT' },
      contactSeconds: i ? .275 : null, flightSeconds: .375, heightM: G * .375 ** 2 / 8,
      rsi: i ? G * .375 ** 2 / 8 / .275 : null, contactSource: i ? 'PREDICTED' : null,
      flightSource: 'PREDICTED', reason: null })),
  };
}
/** Three known flights separated by real support intervals. Right foot can
 * leave/land later; it is never replaced with the other foot's coordinates. */
function flightRows(rightOffsetFrames = 0): PixelRow[] {
  return frames.map(({ frame, pts }) => ({ frame, pts, feet: [0, 1].map(side => {
    let y = 800;
    for (let jump = 0; jump < 3; jump++) {
      const start = (takeoffFrame(jump) + (side ? rightOffsetFrames : 0)) / 240;
      const end = (landingFrame(jump) + (side ? rightOffsetFrames : 0)) / 240;
      if (pts > start && pts < end) {
        const t = pts - start;
        y = 800 - 500 * t + 500 / (end - start) * t * t;
      }
    }
    return { ys: [y, y + .2, y + .4], contrast: 100, reason: null };
  }) as PixelRow['feet'] }));
}
function hideSide(rows: PixelRow[], side: 0 | 1) {
  rows.forEach(row => { row.feet[side] = { ys: null, contrast: 0, reason: 'FOOT_OUTSIDE_IMAGE' }; });
  return rows;
}
function oneTakeoffRows(): PixelRow[] {
  return Array.from({ length: 121 }, (_, frame) => {
    const pts = .75 + frame / 240, t = Math.max(0, pts - 1), y = 800 - 500 * t + 600 * t * t;
    return { frame: 180 + frame, pts,
      feet: [0, 1].map(() => ({ ys: [y, y + .2, y + .4], contrast: 100, reason: null })) as PixelRow['feet'] };
  });
}

describe('foot-pixel refinement of unconfirmed RJ review candidates', () => {
  it('uses the last foot leaving and first foot landing for BOTH, with per-event diagnostics', () => {
    const r = refineReview(fixture(), flightRows(2), frames, 'BOTH');
    expect(r.footRefinement?.mode).toBe('BOTH');
    expect(r.footRefinement?.attempted).toBe(6); expect(r.footRefinement?.applied).toBe(6);
    expect(r.footRefinement?.events).toHaveLength(6);
    r.jumps.forEach((jump, i) => {
      expect(jump.takeoff?.pts).toBeCloseTo((takeoffFrame(i) + 2) / 240, 6);
      expect(jump.landing?.pts).toBeCloseTo(landingFrame(i) / 240, 6);
      expect(jump.takeoff?.source).toBe('PIXEL_REFINED'); expect(jump.landing?.source).toBe('PIXEL_REFINED');
    });
    r.footRefinement?.events.forEach(event => {
      expect(event.applied).toBe(true); expect(event.reason).toBeNull(); expect(event.feet).toHaveLength(2);
      expect(event.originalPts).not.toBeNull(); expect(event.pts).not.toBeNull();
    });
  });

  it.each([['LEFT', 1], ['RIGHT', 0]] as const)('uses only the %s support foot when the other leg is hidden', (mode: JumpMode, hidden: 0 | 1) => {
    const r = refineReview(fixture(), hideSide(flightRows(2), hidden), frames, mode);
    expect(r.footRefinement?.applied).toBe(6);
    r.jumps.forEach((jump, i) => {
      const offset = mode === 'RIGHT' ? 2 : 0;
      expect(jump.takeoff?.pts).toBeCloseTo((takeoffFrame(i) + offset) / 240, 6);
      expect(jump.landing?.pts).toBeCloseTo((landingFrame(i) + offset) / 240, 6);
    });
    r.footRefinement?.events.forEach(event => expect(event.feet).toHaveLength(1));
  });

  it('does not adopt one visible foot as a bilateral result', () => {
    const base = fixture(), r = refineReview(base, hideSide(flightRows(), 1), frames, 'BOTH');
    expect(r.footRefinement?.applied).toBe(0);
    r.jumps.forEach((jump, i) => {
      expect(jump.takeoff).toEqual(base.jumps[i].takeoff); expect(jump.landing).toEqual(base.jumps[i].landing);
    });
    expect(r.footRefinement?.events.every(event => !event.applied && event.reason !== null)).toBe(true);
  });

  it('accepts 25 ms bilateral agreement, but not a disagreement one source frame larger', () => {
    expect(refineReview(fixture(), flightRows(6), frames, 'BOTH').footRefinement?.applied).toBe(6);
    const base = fixture(), r = refineReview(base, flightRows(7), frames, 'BOTH');
    expect(r.footRefinement?.applied).toBe(0);
    r.jumps.forEach((jump, i) => {
      expect(jump.takeoff).toEqual(base.jumps[i].takeoff); expect(jump.landing).toEqual(base.jumps[i].landing);
    });
    expect(r.footRefinement?.events.every(event => !event.applied && !!event.reason)).toBe(true);
  });

  it('preserves manual boundaries and their confirmation without fitting or moving them', () => {
    const base = fixture();
    base.jumps[0].takeoff = { pts: 72 / 240, source: 'MANUAL' };
    base.jumps[0].landing = { pts: 168 / 240, source: 'MANUAL' };
    base.jumps[1].takeoff = { pts: 228 / 240, source: 'MANUAL' };
    base.jumps[1].landing = { pts: 324 / 240, source: 'MANUAL' };
    const r = refineReview(base, flightRows(2), frames, 'BOTH');
    expect(r.jumps.slice(0, 2).map(jump => [jump.takeoff, jump.landing]))
      .toEqual(base.jumps.slice(0, 2).map(jump => [jump.takeoff, jump.landing]));
    expect(r.footRefinement?.attempted).toBe(2); expect(r.footRefinement?.applied).toBe(2);
    expect(r.jumps[1].contactSource).toBe('MANUAL'); expect(r.jumps[1].flightSource).toBe('MANUAL');
    expect(reviewSummary(r).jumpNumbers).toEqual([2]);
  });

  it('keeps original candidates on empty pixel data and records why nothing was adopted', () => {
    const base = fixture(), r = refineReview(base, [], frames, 'RIGHT');
    expect(r.footRefinement?.attempted).toBe(6); expect(r.footRefinement?.applied).toBe(0);
    r.jumps.forEach((jump, i) => {
      expect(jump.takeoff).toEqual(base.jumps[i].takeoff); expect(jump.landing).toEqual(base.jumps[i].landing);
    });
    expect(r.footRefinement?.events.every(event => !event.applied && !!event.reason)).toBe(true);
  });

  it.each(['takeoff', 'landing'] as const)('recovers a missing %s only from agreeing image fits, never as a manual confirmation', kind => {
    const base = fixture(); base.jumps[1][kind] = null;
    const saved = JSON.stringify(base), rows = flightRows(), seed = missingPixelSeed(base, frames, 1, kind)!;
    const alternatives = [-.04, 0, .04].map(offset => fitPixelBoundary(rows, 0, seed + offset, kind));
    expect(alternatives.filter(fit => fit.pts !== null).length).toBeGreaterThanOrEqual(2);
    const r = refineReview(base, rows, frames, 'BOTH');
    const expected = (kind === 'takeoff' ? takeoffFrame(1) : landingFrame(1)) / 240;
    expect(r.jumps[1][kind]?.pts).toBeCloseTo(expected, 6);
    expect(r.jumps[1][kind]?.source).toBe('PIXEL_REFINED');
    const event = r.footRefinement?.events.find(event => event.jump === 2 && event.kind === kind);
    expect(event?.originalPts).toBeNull(); expect(event?.applied).toBe(true); expect(event?.reason).toBeNull();
    expect(event?.feet).toHaveLength(2); expect(r.jumps[1].rsi).not.toBeNull();
    expect(r.jumps[1].contactSource).toBe('PREDICTED'); expect(r.jumps[1].flightSource).toBe('PREDICTED');
    expect(reviewSummary(r).count).toBe(0); expect(JSON.stringify(base)).toBe(saved);
  });

  it.each(['takeoff', 'landing'] as const)('rescues an existing %s whose original search seed is too far from the image motion', kind => {
    const base = fixture(), rows = flightRows();
    const expected = (kind === 'takeoff' ? takeoffFrame(1) : landingFrame(1)) / 240;
    const originalPts = expected + (kind === 'takeoff' ? -.12 : .12);
    base.jumps[1][kind] = { pts: originalPts, source: 'AUTO_FOOT' };
    const saved = JSON.stringify(base);
    expect(fitPixelBoundary(rows, 0, originalPts, kind).pts).toBeNull();
    const seed = missingPixelSeed(base, frames, 1, kind)!;
    const alternatives = [-.04, 0, .04].map(offset => fitPixelBoundary(rows, 0, seed + offset, kind));
    expect(alternatives.filter(fit => fit.pts !== null).length).toBeGreaterThanOrEqual(2);
    const r = refineReview(base, rows, frames, 'BOTH');
    expect(r.jumps[1][kind]?.pts).toBeCloseTo(expected, 6);
    expect(r.jumps[1][kind]?.source).toBe('PIXEL_REFINED');
    const event = r.footRefinement?.events.find(event => event.jump === 2 && event.kind === kind);
    expect(event?.originalPts).toBe(originalPts); expect(event?.applied).toBe(true); expect(event?.reason).toBeNull();
    expect(event?.feet.every(foot => foot.seed !== originalPts)).toBe(true);
    expect(r.jumps[1].rsi).not.toBeNull(); expect(reviewSummary(r).count).toBe(0);
    expect(JSON.stringify(base)).toBe(saved);
  });

  it('preserves every successful nominal fit instead of replacing it with an apex-retry fit', () => {
    const base = fixture(), rows = flightRows(2), r = refineReview(base, rows, frames, 'BOTH');
    expect(r.footRefinement?.applied).toBe(6);
    for (const event of r.footRefinement!.events) {
      const original = base.jumps[event.jump - 1][event.kind]!.pts;
      const nominal = ([0, 1] as const).map(side => fitPixelBoundary(rows, side, original, event.kind));
      expect(nominal.every(foot => foot.pts !== null)).toBe(true);
      expect(event.feet).toEqual(nominal);
      expect(event.feet.every(foot => foot.seed === original)).toBe(true);
      const expected = (event.kind === 'takeoff' ? Math.max : Math.min)(...nominal.map(foot => foot.pts!));
      expect(event.pts).toBe(expected);
    }
  });

  it('retains an existing failed candidate when the apex retry has only one usable fit', () => {
    const base = fixture(); base.jumps[1].takeoff = { pts: .83, source: 'AUTO_FOOT' };
    const rows = flightRows(), seed = missingPixelSeed(base, frames, 1, 'takeoff')!;
    for (const frame of [Math.round((seed - .133) * 240), Math.round((seed + .133) * 240)]) {
      rows[frame].feet = [0, 1].map(() => ({ ys: null, contrast: 0, reason: 'FOOT_POSE_MISSING' })) as PixelRow['feet'];
    }
    expect(fitPixelBoundary(rows, 1, .83, 'takeoff').pts).toBeNull();
    const alternatives = [-.04, 0, .04].map(offset => fitPixelBoundary(rows, 1, seed + offset, 'takeoff'));
    expect(alternatives.map(fit => fit.pts !== null)).toEqual([false, true, false]);
    const r = refineReview(base, rows, frames, 'RIGHT');
    expect(r.jumps[1].takeoff).toEqual(base.jumps[1].takeoff);
    const event = r.footRefinement?.events.find(event => event.jump === 2 && event.kind === 'takeoff');
    expect(event?.originalPts).toBe(.83); expect(event?.applied).toBe(false); expect(event?.reason).toBeTruthy();
    expect(reviewSummary(r).count).toBe(0);
  });

  it('does not rescue a missing boundary when only one of the three search seeds fits', () => {
    const base = fixture(); base.jumps[1].takeoff = null;
    const rows = flightRows(), seed = missingPixelSeed(base, frames, 1, 'takeoff')!;
    // The central ±.12 s window remains intact. Each shifted seed's wider
    // window encounters a missing observed point, so it cannot corroborate.
    for (const frame of [Math.round((seed - .133) * 240), Math.round((seed + .133) * 240)]) {
      rows[frame].feet = [0, 1].map(() => ({ ys: null, contrast: 0, reason: 'FOOT_POSE_MISSING' })) as PixelRow['feet'];
    }
    const alternatives = [-.04, 0, .04].map(offset => fitPixelBoundary(rows, 0, seed + offset, 'takeoff'));
    expect(alternatives.map(fit => fit.pts !== null)).toEqual([false, true, false]);
    const r = refineReview(base, rows, frames, 'RIGHT');
    expect(r.jumps[1].takeoff).toBeNull(); expect(r.jumps[1].rsi).toBeNull();
    const event = r.footRefinement?.events.find(event => event.jump === 2 && event.kind === 'takeoff');
    expect(event?.originalPts).toBeNull(); expect(event?.applied).toBe(false); expect(event?.reason).toBeTruthy();
  });

  it('leaves wholly missing or unsupported image evidence blank instead of supplying seed-based durations', () => {
    const base = fixture(); base.jumps.forEach(jump => { jump.takeoff = null; jump.landing = null; });
    const absent = hideSide(hideSide(flightRows(), 0), 1);
    const flat = flightRows().map(row => ({ ...row,
      feet: [0, 1].map(() => ({ ys: [800, 800, 800], contrast: 100, reason: null })) as PixelRow['feet'],
    }));
    for (const rows of [[], absent, flat]) {
      const r = refineReview(base, rows, frames, 'BOTH');
      expect(r.footRefinement?.applied).toBe(0);
      expect(r.jumps.every(jump => !jump.takeoff && !jump.landing && jump.rsi === null)).toBe(true);
      expect(r.meanRSI).toBeNull(); expect(r.maxRSI).toBeNull(); expect(reviewSummary(r).count).toBe(0);
      expect(r.footRefinement?.events.every(event => !event.applied && !!event.reason)).toBe(true);
    }
  });

  it('requires an observed apex and supported neighbour period for a missing-boundary search', () => {
    const base = fixture();
    expect(missingPixelSeed(base, frames, 0, 'takeoff')).toBeCloseTo(.5 - .32 * .65);
    expect(missingPixelSeed(base, frames, 2, 'landing')).toBeCloseTo(1.8 + .32 * .65);
    for (const selected of [[120], [120, 144], [120, 432], [9999, 276]]) {
      const unsupported = fixture(); unsupported.jumps[0].takeoff = null; unsupported.selectedPeakFrames = selected;
      expect(missingPixelSeed(unsupported, frames, 0, 'takeoff')).toBeNull();
      const r = refineReview(unsupported, flightRows(), frames, 'BOTH');
      expect(r.jumps[0].takeoff).toBeNull();
      const event = r.footRefinement?.events.find(event => event.jump === 1 && event.kind === 'takeoff');
      expect(event?.applied).toBe(false); expect(event?.reason).toBeTruthy();
    }
  });

  it('rejects pixel samples from a different timeline or unsorted source frames', () => {
    const base = fixture(), rows = flightRows(); rows[240].pts += .0001;
    for (const [pixels, source] of [[rows, frames], [flightRows(), [...frames].reverse()]] as const) {
      const r = refineReview(base, pixels, source, 'RIGHT');
      expect(r.footRefinement?.applied).toBe(0);
      r.jumps.forEach((jump, i) => {
        expect(jump.takeoff).toEqual(base.jumps[i].takeoff); expect(jump.landing).toEqual(base.jumps[i].landing);
      });
      expect(r.footRefinement?.events.every(event => !event.applied && !!event.reason)).toBe(true);
    }
  });

  it('does not replace a candidate with a refined takeoff on the wrong side of its apex', () => {
    const base = fixture(); base.selectedPeakFrames[0] = 70;
    base.jumps[0].takeoff = { pts: .27, source: 'AUTO_FOOT' };
    const r = refineReview(base, flightRows(), frames, 'BOTH');
    expect(r.jumps[0].takeoff).toEqual(base.jumps[0].takeoff);
    const event = r.footRefinement?.events.find(event => event.jump === 1 && event.kind === 'takeoff');
    expect(event?.applied).toBe(false); expect(event?.reason).toBeTruthy();
  });

  it('rejects a refinement that makes contact with the previous manually reviewed landing too short', () => {
    const base = fixture(); base.jumps = base.jumps.slice(0, 2); base.selectedPeakFrames = [180, 288];
    base.jumps[0].takeoff = { pts: .55, source: 'MANUAL' };
    base.jumps[0].landing = { pts: .95, source: 'MANUAL' };
    base.jumps[1].takeoff = { pts: 1.025, source: 'AUTO_FOOT' };
    base.jumps[1].landing = { pts: 1.4, source: 'AUTO_FOOT' };
    const r = refineReview(base, oneTakeoffRows(), frames, 'RIGHT');
    expect(r.jumps[1].takeoff).toEqual(base.jumps[1].takeoff);
    expect(r.jumps[0].landing).toEqual(base.jumps[0].landing);
    const event = r.footRefinement?.events.find(event => event.jump === 2 && event.kind === 'takeoff');
    expect(event?.applied).toBe(false); expect(event?.reason).toBeTruthy();
  });

  it('does not rescue a missing takeoff when the image agrees but the previous manual landing conflicts', () => {
    const base = fixture(); base.jumps = base.jumps.slice(0, 2); base.selectedPeakFrames = [180, 288];
    base.jumps[0].takeoff = { pts: .55, source: 'MANUAL' };
    base.jumps[0].landing = { pts: .95, source: 'MANUAL' };
    base.jumps[1].takeoff = null; base.jumps[1].landing = { pts: 1.4, source: 'AUTO_FOOT' };
    const rows = oneTakeoffRows(), seed = missingPixelSeed(base, frames, 1, 'takeoff')!;
    const alternatives = [-.04, 0, .04].map(offset => fitPixelBoundary(rows, 1, seed + offset, 'takeoff'));
    expect(alternatives.filter(fit => fit.pts !== null).length).toBeGreaterThanOrEqual(2);
    const r = refineReview(base, rows, frames, 'RIGHT');
    expect(r.jumps[0].landing).toEqual(base.jumps[0].landing);
    expect(r.jumps[1].takeoff).toBeNull(); expect(r.jumps[1].rsi).toBeNull();
    const event = r.footRefinement?.events.find(event => event.jump === 2 && event.kind === 'takeoff');
    expect(event?.originalPts).toBeNull(); expect(event?.applied).toBe(false); expect(event?.reason).toBeTruthy();
  });

  it('never treats refined arithmetic as a confirmed RSI, including exports', () => {
    const base = fixture(), r = refineReview(base, flightRows(), frames, 'BOTH');
    expect(r.validated).toBe(false); expect(r.validRSICount).toBe(2);
    expect(r.jumps[0].rsi).toBeNull(); expect(r.meanRSI).toBeCloseTo(G * .4 ** 2 / 8 / .25);
    expect(r.jumps.slice(1).every(jump => jump.contactSource === 'PREDICTED' && jump.flightSource === 'PREDICTED')).toBe(true);
    expect(reviewSummary(r)).toEqual({ jumpNumbers: [], count: 0, mean: null, max: null });
    const report = reviewedExport(r, base, {}, { name: 'synthetic.mov', size: 1 });
    expect(report.analysis.meanRSI).toBeNull(); expect(report.analysis.maxRSI).toBeNull(); expect(report.analysis.validRSICount).toBe(0);
    expect(report.tentativeSummary.validRSICount).toBe(2); expect(report.analysis.footRefinement).toEqual(r.footRefinement);
  });

  it('does not mutate the prior review, pixel rows, source frames or selected peak list', () => {
    const base = fixture(), rows = flightRows(), sourceFrames = frames.map(frame => ({ ...frame }));
    const saved = JSON.stringify({ base, rows, sourceFrames });
    const r = refineReview(base, rows, sourceFrames, 'BOTH');
    expect(JSON.stringify({ base, rows, sourceFrames })).toBe(saved);
    expect(r).not.toBe(base); expect(r.jumps).not.toBe(base.jumps);
    expect(r.selectedPeakFrames).toEqual(base.selectedPeakFrames); expect(r.excludedPeakFrames).toEqual(base.excludedPeakFrames);
  });
});
