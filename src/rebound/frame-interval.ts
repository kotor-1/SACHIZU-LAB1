/** Frame-rate limits of the RJ analysis. Its gap limits and per-cycle sample
 * counts were set on 120-240 frames/s recordings; a phone camera records at 60
 * or 30. The limits follow the observed frame interval when that is longer and
 * are unchanged at 120 frames/s and above. On the 18 PUSH-referenced
 * recordings thinned to 60 frames/s the shoe-sole method stayed within 0.125
 * of PUSH on average (0.100 at 120); at 30 the soles were not measurable and
 * the toe template gave values (+0.15 above PUSH, as at 120); at 20 the
 * template became unstable and at 15 no apex was found. */
export const RJ_MIN_FPS = 25;

/** Median interval between consecutive times (0 when fewer than two). */
export function typicalInterval(times: readonly number[]): number {
  const steps = times.slice(1).map((t, i) => t - times[i]).filter(dt => dt > 0).sort((a, b) => a - b);
  return steps.length ? steps[Math.floor((steps.length - 1) / 2)] : 0;
}
/** A gap limit set at 120-240 frames/s, widened to 1.5 frame intervals (no
 * missed frame) for frames further apart. */
export function gapLimit(limit: number, times: readonly number[]): number {
  return Math.max(limit, 1.5 * typicalInterval(times));
}
/** A minimum number of samples per cycle set at 120 frames/s, for a cycle
 * sampled at the interval of `times`: the same duration's worth, never below 10. */
export function sampleMinimum(count: number, times: readonly number[]): number {
  const interval = typicalInterval(times);
  return interval * 120 <= 1 + 1e-9 ? count : Math.min(count, Math.max(10, Math.round(count / (120 * interval))));
}
