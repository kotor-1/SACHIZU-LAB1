import type { COMSample } from '../cmj/center-of-mass';
import { detectLowerPeaks } from './waveform-fit';
import { extractHybridCycle, HYBRID_SETTINGS, type HybridProfile } from './hybrid-physics';

export const WHOLE_CYCLE_VERSION = 'rj-whole-cycle-v2-uncorrected-research';
const average = (values: number[]) => values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;

/** Descriptive profile width only, NOT a confidence interval or error bound. */
export function uncorrectedCycle(profile: HybridProfile) {
  if (profile.reason || !profile.points.length) return null;
  const best = profile.points.reduce((a, b) => a.error <= b.error ? a : b);
  const near = profile.points.filter(p => p.error ** 2 <= best.error ** 2 + HYBRID_SETTINGS.shapeNoise ** 2);
  return { value: best.rsi, fraction: best.fraction, waveformError: best.error,
    profileRange: [Math.min(...near.map(p => p.rsi)), Math.max(...near.map(p => p.rsi))] as [number, number],
    boundary: best.fraction <= HYBRID_SETTINGS.fractionMin + 1e-8 || best.fraction >= HYBRID_SETTINGS.fractionMax - 1e-8 };
}

export function wholeCycleReport(samples: readonly COMSample[], sourceVideoSHA256: string, filename: string) {
  const found = detectLowerPeaks(samples, 'PELVIS', 'ALL');
  // Never reconnect across an excluded interval or discard an eleventh peak.
  const cycles = found.reason ? [] : found.peaks.slice(1).map((b, i) => {
    const a = found.peaks[i];
    const profile = extractHybridCycle(samples, a, b);
    const alternative = extractHybridCycle(samples, a, b, 'CONSTANT');
    return { id: i + 1, fromPeak: i + 1, toPeak: i + 2, startPts: a.pts, endPts: b.pts,
      period: b.pts - a.pts, reason: profile.reason, alternativeReason: alternative.reason,
      result: uncorrectedCycle(profile), alternative: uncorrectedCycle(alternative), profile, alternativeProfile: alternative };
  });
  const accepted = cycles.filter(c => c.result !== null);
  const paired = accepted.filter(c => c.alternative !== null);
  return { version: WHOLE_CYCLE_VERSION, filename, sourceVideoSHA256,
    validated: false, manualInputsUsed: false, observedContactEventsUsed: false, populationCorrectionUsed: false,
    signal: 'PELVIS_PROXY' as const, aggregation: 'MEAN_OF_CALCULABLE_ADJACENT_APEX_CYCLES' as const,
    settings: { fractionMin: HYBRID_SETTINGS.fractionMin, fractionMax: HYBRID_SETTINGS.fractionMax,
      fractionStep: HYBRID_SETTINGS.fractionStep, shapeNoise: HYBRID_SETTINGS.shapeNoise, maximumError: HYBRID_SETTINGS.maximumError },
    detected: found.detected, peaks: found.peaks, reason: found.reason ?? (found.detected < 2 ? 'INSUFFICIENT_PEAKS' : null),
    totalCycles: cycles.length, acceptedCycles: accepted.length, acceptedCycleIds: accepted.map(c => c.id),
    mean: average(accepted.map(c => c.result!.value)), partial: accepted.length < cycles.length,
    boundaryCycles: accepted.filter(c => c.result!.boundary).map(c => c.id),
    meanProfileRange: accepted.length ? [average(accepted.map(c => c.result!.profileRange[0]))!, average(accepted.map(c => c.result!.profileRange[1]))!] as [number, number] : null,
    shapeComparison: { cycleIds: paired.map(c => c.id), halfSineMean: average(paired.map(c => c.result!.value)),
      constantMean: average(paired.map(c => c.alternative!.value)) },
    cycles, samples,
  };
}
export type WholeCycleReport = ReturnType<typeof wholeCycleReport>;
