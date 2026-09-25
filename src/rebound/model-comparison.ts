import type { AutomaticRunReport } from './automatic-run';

export function comparePoseModels(full: AutomaticRunReport, heavy: AutomaticRunReport) {
  if (full.poseModel !== 'full' || heavy.poseModel !== 'heavy' || full.mode !== heavy.mode ||
    full.file.name !== heavy.file.name || full.file.size !== heavy.file.size ||
    !full.frameTimes.length || full.frameTimes.length !== heavy.frameTimes.length ||
    full.frameTimes.some((t, i) => !Number.isFinite(t) || t !== heavy.frameTimes[i]))
    throw new Error('比較する元動画・種目・フレーム時刻が一致しません。');
  // Match only uniquely adjacent detected peaks, not ordinal jump numbers:
  // a model can miss an early jump and shift every following ordinal.
  const peakTimes = (r: AutomaticRunReport) => r.jumps.map((_, i) => r.frameTimes[r.seeds.selectedPeakFrames[i]]);
  const a = peakTimes(full), b = peakTimes(heavy);
  const near = (t: number, times: number[]) => times.flatMap((v, i) => Number.isFinite(t) && Number.isFinite(v) && Math.abs(t - v) <= .12 ? [i] : []);
  const pairs = a.flatMap((t, i) => {
    const candidates = near(t, b);
    if (candidates.length !== 1 || near(b[candidates[0]], a).length !== 1) return [];
    const j = candidates[0], f = full.jumps[i], h = heavy.jumps[j];
    return [{ fullJump: f.jump, heavyJump: h.jump, peakDifferenceMs: (b[j] - t) * 1000,
      fullRSI: f.rsi, heavyRSI: h.rsi,
      takeoffDifferenceMs: f.takeoff === null || h.takeoff === null ? null : (h.takeoff - f.takeoff) * 1000,
      landingDifferenceMs: f.landing === null || h.landing === null ? null : (h.landing - f.landing) * 1000 }];
  });
  const common = pairs.filter(p => p.fullRSI !== null && p.heavyRSI !== null);
  return { version: 'rj-pose-comparison-v1', validated: false, order: ['full', 'heavy'],
    matching: 'Mutually unique peak within 120 ms; not a verified correspondence.', pairs,
    unmatchedFull: full.jumps.filter(j => !pairs.some(p => p.fullJump === j.jump)).map(j => j.jump),
    unmatchedHeavy: heavy.jumps.filter(j => !pairs.some(p => p.heavyJump === j.jump)).map(j => j.jump),
    commonCount: common.length,
    commonFullMean: common.length ? common.reduce((s, p) => s + p.fullRSI!, 0) / common.length : null,
    commonHeavyMean: common.length ? common.reduce((s, p) => s + p.heavyRSI!, 0) / common.length : null,
    full, heavy };
}
export type PoseComparison = ReturnType<typeof comparePoseModels>;
