import type { COMSample } from '../cmj/center-of-mass';
import type { Apex } from './waveform-fit';

/** Engineering signal-completeness checks, not observed contact events or a
 * validated jump classifier. Applied to EVERY pelvis apex, not just the last
 * or a requested number. No age, reference RSI, or fitted RSI enters here. */
export const APEX_SELECTION_SETTINGS = {
  halfWindowPeriods: .5, centerHalfWindowPeriods: .15,
  minimumSamplesPerSection: 3, minimumCoverage: .95,
  minimumTimeCoverage: .75, maximumGapSeconds: .025,
} as const;
export interface ApexMotionSample extends COMSample { leftToeY: number | null; rightToeY: number | null }
export type ApexStatus = 'SUPPORTED' | 'UNRESOLVED' | 'NOT_BILATERAL' | 'INCOMPLETE_WINDOW';
export interface ApexCheck {
  candidateIndex: number; apex: Apex; status: ApexStatus; included: boolean;
  reason: string | null; excursionsOverLeg: [number | null, number | null];
  recordingSectionCoverage: number[] | null;
}
const quantile = (xs: readonly number[], q: number) => [...xs].sort((a, b) => a - b)[Math.floor((xs.length - 1) * q)];
const finite = (x: number | null): x is number => x !== null && Number.isFinite(x);

export function selectBilateralApexes(samples: readonly ApexMotionSample[], candidates: readonly Apex[],
  minimumSpanOverLeg = .04) {
  const intervals = candidates.slice(1).map((p, i) => p.pts - candidates[i].pts).filter(t => t >= .25 && t <= 1.2);
  const period = intervals.length ? quantile(intervals, .5) : null;
  const timelineValid = samples.every((s, i) => Number.isFinite(s.pts) && s.pts >= 0 &&
    (!i || s.pts > samples[i - 1].pts)) && candidates.every((a, i) => Number.isFinite(a.pts) &&
      (!i || a.pts > candidates[i - 1].pts));
  const checks: ApexCheck[] = candidates.map((apex, candidateIndex) => {
    const base = { candidateIndex, apex, excursionsOverLeg: [null, null] as [number | null, number | null],
      recordingSectionCoverage: null as number[] | null };
    const unresolved = (reason: string): ApexCheck => ({ ...base, status: 'UNRESOLVED', included: true, reason });
    if (!timelineValid || !(minimumSpanOverLeg > 0 && Number.isFinite(minimumSpanOverLeg)))
      return unresolved('APEX_INVALID_OBSERVATIONS');
    if (period === null || !samples.length) return unresolved('APEX_PERIOD_UNAVAILABLE');
    const half = period * APEX_SELECTION_SETTINGS.halfWindowPeriods;
    const center = period * APEX_SELECTION_SETTINGS.centerHalfWindowPeriods;
    const start = apex.pts - half, end = apex.pts + half;
    const nominalBounds = [[start, apex.pts - center], [apex.pts - center, apex.pts + center],
      [apex.pts + center, end]] as const;
    // Slight edge clipping is allowed only with the same minimum temporal
    // support as an interior section. Never extrapolate beyond the recording,
    // or shrink the coverage denominator to make a short fragment look complete.
    const sectionBounds = nominalBounds.map(([lo, hi]) =>
      [Math.max(lo, samples[0].pts), Math.min(hi, samples.at(-1)!.pts)] as const);
    base.recordingSectionCoverage = sectionBounds.map(([lo, hi], i) =>
      Math.max(0, hi - lo) / (nominalBounds[i][1] - nominalBounds[i][0]));
    if (base.recordingSectionCoverage.some(c => c < APEX_SELECTION_SETTINGS.minimumTimeCoverage - 1e-9))
      return { ...base, status: 'INCOMPLETE_WINDOW', included: false, reason: 'APEX_RECORDING_EDGE' };
    const sections = sectionBounds.map(([lo, hi]) => samples.filter(s => s.pts >= lo - 1e-9 && s.pts <= hi + 1e-9));
    const legValues = sections.flat().map(s => s.bodyScale).filter((v): v is number => finite(v) && v > 0);
    if (!legValues.length) return unresolved('APEX_SCALE_UNAVAILABLE');
    const leg = quantile(legValues, .5);
    for (const [side, key] of (['leftToeY', 'rightToeY'] as const).entries()) {
      const values: number[][] = [];
      for (let i = 0; i < sections.length; i++) {
        const all = sections[i], rows = all.filter(s => finite(s[key]));
        const [lo, hi] = sectionBounds[i], times = [lo, ...rows.map(s => s.pts), hi];
        if (rows.length < APEX_SELECTION_SETTINGS.minimumSamplesPerSection ||
          rows.length / Math.max(1, all.length) < APEX_SELECTION_SETTINGS.minimumCoverage ||
          (rows.at(-1)!.pts - rows[0].pts) / (nominalBounds[i][1] - nominalBounds[i][0]) < APEX_SELECTION_SETTINGS.minimumTimeCoverage - 1e-9 ||
          times.some((t, j) => j > 0 && t - times[j - 1] > APEX_SELECTION_SETTINGS.maximumGapSeconds + 1e-6))
          return unresolved(side === 0 ? 'APEX_LEFT_TOE_GAP' : 'APEX_RIGHT_TOE_GAP');
        values.push(rows.map(s => s[key]!));
      }
      // Image y increases downwards. A complete foot lobe has both a rise
      // and a fall relative to its central high position. Large movement of
      // the PREVIOUS jump alone cannot qualify a final step as another apex.
      base.excursionsOverLeg[side] = (Math.min(quantile(values[0], .9), quantile(values[2], .9)) -
        quantile(values[1], .1)) / leg;
    }
    const supported = base.excursionsOverLeg.every(v => v !== null && v >= minimumSpanOverLeg);
    return { ...base, status: supported ? 'SUPPORTED' : 'NOT_BILATERAL', included: supported,
      reason: supported ? null : 'APEX_NO_BILATERAL_RISE_FALL' };
  });
  const included = checks.filter(c => c.included);
  return { period, checks, peaks: included.map(c => c.apex), candidateIndices: included.map(c => c.candidateIndex) };
}
