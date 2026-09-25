import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { automaticFootResult } from '../src/rebound/automatic-foot';
import { autoReview } from '../src/rebound/auto-review';
import type { RegisteredAnalysis } from '../src/rebound/registered-template';
import type { SignalResult } from '../src/rebound/waveform-fit';
import AutomaticReboundLab, { AutomaticReboundResults } from '../src/rebound/AutomaticReboundLab';

function fixture(count = 4): RegisteredAnalysis {
  const jumps = Array.from({ length: count }, (_, i) => ({ jump: i + 1,
    takeoff: { pts: .3 + i * .6, source: 'PIXEL_REFINED' as const },
    landing: { pts: .7 + i * .6, source: 'PIXEL_REFINED' as const },
    contactSeconds: null, flightSeconds: null, heightM: null, rsi: null,
    contactSource: null, flightSource: null, reason: null }));
  return { version: 'fixture', validated: false, registration: null, reason: null, detected: count,
    selectedPeakFrames: [], excludedPeakFrames: [], jumps, fits: [], validRSICount: 0, meanRSI: null, maxRSI: null, warnings: [],
    footRefinement: { version: 'test', mode: 'BOTH', applied: count * 2, attempted: count * 2,
      events: jumps.flatMap(j => (['takeoff', 'landing'] as const).map(kind => ({ jump: j.jump, kind, pts: j[kind].pts,
        originalPts: null, applied: true, reason: null, feet: [] }))) } };
}
describe('input-free automatic foot RSI', () => {
  it('calculates each height / preceding contact, excludes first RSI, averages accepted values', () => {
    const r = automaticFootResult(fixture());
    expect(r.acceptedRSICount).toBe(3); expect(r.expectedRSICount).toBe(3);
    expect(r.meanRSI).toBeCloseTo(9.80665 * .4 ** 2 / 8 / .2, 6);
    expect(r.heightCount).toBe(4); expect(r.jumps[0].rsi).toBeNull(); expect(r.partial).toBe(false);
    expect(r.manualEventInputsUsed).toBe(false); expect(r.manualLengthInputsUsed).toBe(false);
    expect(r.referenceRSIUsed).toBe(false); expect(r.validated).toBe(false);
  });
  it('never substitutes an unrefined pose threshold or manual mark for an image event', () => {
    for (const source of ['AUTO_FOOT', 'MANUAL', 'TEMPLATE'] as const) {
      const a = fixture(); a.jumps[1].takeoff!.source = source;
      const r = automaticFootResult(a);
      expect(r.jumps[1].rsi).toBeNull(); expect(r.acceptedJumpNumbers).toEqual([3, 4]); expect(r.partial).toBe(true);
    }
  });
  it('requires the previous landing, without skipping across a failed jump', () => {
    const a = fixture(); a.footRefinement!.events.find(e => e.jump === 2 && e.kind === 'landing')!.applied = false;
    const r = automaticFootResult(a);
    expect(r.jumps[1].rsi).toBeNull(); expect(r.jumps[2].rsi).toBeNull(); expect(r.acceptedJumpNumbers).toEqual([4]);
  });
  it('does not call an all-failed recording zero RSI', () => {
    const a = fixture(); a.footRefinement = undefined;
    const r = automaticFootResult(a); expect(r.meanRSI).toBeNull(); expect(r.maxRSI).toBeNull(); expect(r.acceptedRSICount).toBe(0);
  });
  it('rejects nonfinite and contradictory event times and stale refinement metadata', () => {
    for (const pts of [NaN, Infinity, .1, 6]) {
      const a = fixture(); a.jumps[1].takeoff!.pts = pts;
      expect(automaticFootResult(a).jumps[1].rsi).toBeNull();
    }
    const a = fixture(); a.jumps[1].landing!.pts = a.jumps[1].takeoff!.pts - .1;
    a.footRefinement!.events.find(e => e.jump === 2 && e.kind === 'landing')!.pts = a.jumps[1].landing!.pts;
    expect(automaticFootResult(a).jumps[1].rsi).toBeNull();
  });
  it('recognizes all counts without a hardcoded ten-jump cutoff', () => {
    for (const count of [3, 11, 14]) {
      const peaks: SignalResult = { signal: 'PELVIS', detected: count, validFrames: 0, totalFrames: 0, excluded: [],
        peaks: Array.from({ length: count }, (_, i) => ({ frame: i * 144, pts: .5 + i * .6, y: .5 })) };
      expect(autoReview([], peaks, 'BOTH', 0, true).jumps).toHaveLength(count);
      expect(automaticFootResult(fixture(count)).acceptedRSICount).toBe(count - 1);
    }
  });
  it('shows automatic RSI prominently without requiring manual confirmation', () => {
    const r = automaticFootResult(fixture());
    const html = renderToStaticMarkup(<AutomaticReboundResults result={r} />);
    expect(html).toContain('data-testid="automatic-rsi"'); expect(html).toContain(r.meanRSI!.toFixed(2));
    expect(html).toContain('自動推定'); expect(html).not.toContain('確認済み');
    expect(html).not.toContain('修正');
  });
  it('labels a partial mean and renders a failure explanation', () => {
    const a = fixture(); a.jumps[1].takeoff = null;
    const html = renderToStaticMarkup(<AutomaticReboundResults result={automaticFootResult(a)} />);
    expect(html).toContain('全跳躍の平均ではありません');
    a.footRefinement = undefined;
    expect(renderToStaticMarkup(<AutomaticReboundResults result={automaticFootResult(a)} />)).toContain('算出できませんでした');
  });
  it('has no mandatory height, ROI, manual frame or confirmation inputs', () => {
    const html = renderToStaticMarkup(<AutomaticReboundLab />);
    expect(html).not.toMatch(/type="(?:number|range|checkbox)"/);
    expect(html).not.toContain('exact-picker'); expect(html).toContain('入力なしで自動解析');
  });
});
