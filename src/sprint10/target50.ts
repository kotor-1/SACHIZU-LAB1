/** The 50 m time a measured section points to (the user, 2026-10-09: 「最高速度解析をしたら平均速度が出るはず。その平均
 * 速度の目標５０mタイムを算出して表示して」). A sprint from rest follows v(t) = v0 (1 − e^(−t/τ)), so the distance run is
 * x(t) = v0 (t − τ (1 − e^(−t/τ))) (Furusawa, Hill & Parkinson 1927; Samozino et al. 2016; Morin et al. 2019). The time
 * constant τ is about one second whatever the athlete's speed: 1.15-1.25 s for athletes of 7.0-11.9 m/s, 0.94-1.29 s
 * (mean 1.11) over the range of gaits modelled (Clark & Ryan 2022, Front Sports Act Living 4:945688). The section's
 * place (its entry, m from the start) and time give v0 (a section still in the acceleration, as 20-30 m, is run slower
 * than v0); the 50 m time is then the model's at that v0 and τ: from the first movement, without the reaction to a signal. */
export const TAU = 1.1, TAU_RANGE = [.95, 1.25] as const;

/** Metres run from rest in t s. */
export const distanceAt = (t: number, v0: number, tau = TAU) => v0 * (t - tau * (1 - Math.exp(-t / tau)));
/** Seconds from rest to x m (bisection: the distance grows with time). */
export function timeAt(x: number, v0: number, tau = TAU) {
  let lo = 0, hi = 1;
  while (distanceAt(hi, v0, tau) < x && hi < 1e4) hi *= 2;
  for (let k = 0; k < 60; k++) { const mid = (lo + hi) / 2; if (distanceAt(mid, v0, tau) < x) lo = mid; else hi = mid; }
  return (lo + hi) / 2;
}
/** The fastest top speed taken (m/s): above the fastest ever run (about 12.4 m/s), a section measured wrong (the lines
 * set at other distances than entered: 10 m in 0.55 s pointed to a 3.74 s 50 m). */
export const TOP_SPEED_MAX = 13;
/** The top speed (m/s) that runs the section from `entry` m to `entry + length` m in `seconds`, or null. */
export function topSpeed(entry: number, length: number, seconds: number, tau = TAU): number | null {
  if (!(entry >= 0) || !(length > 0) || !(seconds > 0)) return null;
  const took = (v0: number) => timeAt(entry + length, v0, tau) - timeAt(entry, v0, tau);
  let lo = .5, hi = TOP_SPEED_MAX;
  if (took(hi) > seconds || took(lo) < seconds) return null;
  for (let k = 0; k < 60; k++) { const mid = (lo + hi) / 2; if (took(mid) > seconds) lo = mid; else hi = mid; }
  return (lo + hi) / 2;
}
/** The 50 m time (s) the section points to, with its spread over TAU_RANGE; null when it cannot be told. */
export function target50(entry: number, length: number, seconds: number): { time: number; range: [number, number]; topSpeed: number } | null {
  const at = (tau: number) => { const v0 = topSpeed(entry, length, seconds, tau); return v0 === null ? null : { v0, t: timeAt(50, v0, tau) }; };
  const mid = at(TAU), a = at(TAU_RANGE[0]), b = at(TAU_RANGE[1]);
  if (!mid || !a || !b) return null;
  return { time: mid.t, range: [Math.min(a.t, b.t), Math.max(a.t, b.t)], topSpeed: mid.v0 };
}
