/** Geometric overlap of two *modelled* aerial lobes in one periodic cycle.
 * A bilateral jump is airborne only while BOTH feet are airborne. Averaging
 * left/right durations is not the same operation. These are latent intervals,
 * not observed takeoff/landing frame labels or a validation of toe kinematics.
 */
export interface AerialLobe { fraction: number; phase: number }
const normalize = (phase: number) => ((phase % 1 + 1.5) % 1) - .5;
const valid = (v: AerialLobe) => Number.isFinite(v.fraction) && v.fraction > 0 && v.fraction < 1 && Number.isFinite(v.phase);
export function bilateralFlightLobe(left: AerialLobe, right: AerialLobe): AerialLobe | null {
  if (!valid(left) || !valid(right)) return null;
  // Represent the other apex on the closest neighbouring period. Absolute
  // phase and which foot is passed first must not affect the result.
  const leftPhase = normalize(left.phase), delta = normalize(normalize(right.phase) - leftPhase);
  const overlap = (shift: number) => Math.max(0,
    Math.min(left.fraction / 2, delta + shift + right.fraction / 2) -
    Math.max(-left.fraction / 2, delta + shift - right.fraction / 2));
  const common = overlap(0);
  // Two separate common lobes in one cycle do not identify one bilateral
  // flight. Do not add them up and invent a longer single jump.
  if (common <= 1e-12 || overlap(-1) > 1e-12 || overlap(1) > 1e-12) return null;
  const middle = (Math.min(left.fraction / 2, delta + right.fraction / 2) +
    Math.max(-left.fraction / 2, delta - right.fraction / 2)) / 2 + leftPhase;
  return { fraction: Math.min(left.fraction, right.fraction, common), phase: normalize(middle) };
}

export function bilateralFlightFraction(left: AerialLobe, right: AerialLobe): number | null {
  return bilateralFlightLobe(left, right)?.fraction ?? null;
}

/** Exact extrema over a grid of lobe alternatives without its Cartesian
 * product. For fixed phase difference and left width, common width increases
 * monotonically with right width. Only the first/last admissible right widths
 * are needed. Cost O(L * distinctRightPhases * log R), not O(L * R).
 * This is model sensitivity, NOT a confidence interval. */
export function bilateralFlightRange(left: readonly AerialLobe[], right: readonly AerialLobe[], maximumDifference: number): [number, number] | null {
  if (!Number.isFinite(maximumDifference) || maximumDifference < 0 || maximumDifference > 1 ||
    !left.length || !right.length || !left.every(valid) || !right.every(valid)) return null;
  const groups = new Map<number, number[]>();
  for (const point of right) {
    const phase = normalize(point.phase), widths = groups.get(phase) ?? [];
    widths.push(point.fraction); groups.set(phase, widths);
  }
  for (const widths of groups.values()) widths.sort((a, b) => a - b);
  const bound = (a: number[], v: number, upper: boolean) => {
    let lo = 0, hi = a.length;
    while (lo < hi) { const mid = (lo + hi) >>> 1; if (a[mid] < v || (upper && a[mid] === v)) lo = mid + 1; else hi = mid; }
    return lo;
  };
  let minimum = Infinity, maximum = -Infinity;
  for (const a of left) for (const [phase, widths] of groups) {
    const distance = Math.abs(normalize(phase - normalize(a.phase)));
    // Slightly loose numeric bounds; the geometry helper validates endpoints.
    const lo = Math.max(a.fraction - maximumDifference - 1e-8, 2 * distance - a.fraction);
    const hi = Math.min(a.fraction + maximumDifference + 1e-8, 2 * (1 - distance + 1e-12) - a.fraction);
    let first = bound(widths, lo, false), last = bound(widths, hi, true) - 1;
    if (first > last) continue;
    let low: number | null = null, high: number | null = null;
    const checked = (fraction: number) => Math.abs(a.fraction - fraction) > maximumDifference + 1e-8
      ? null : bilateralFlightFraction(a, { fraction, phase });
    while (first <= last && (low = checked(widths[first])) === null) first++;
    while (last >= first && (high = checked(widths[last])) === null) last--;
    if (low !== null && high !== null) { minimum = Math.min(minimum, low); maximum = Math.max(maximum, high); }
  }
  return Number.isFinite(minimum) && Number.isFinite(maximum) ? [minimum, maximum] : null;
}
