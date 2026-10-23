import type { NormalizedLandmark } from '@mediapipe/tasks-vision';

/** Follows the athlete's feet through a camera set, to count the jumps on the screen and to end the set by itself
 * once they stop. For the display and the set's end only: the RSI is computed afterwards from every frame, as for a
 * chosen video (toe-cycle-research.ts, sole-contact.ts). */
export const JUMP_WATCH = Object.freeze({
  /** A jump: the hips rise this much (in leg lengths) to a top and come down this much from it. Walking moves them less. */
  apexLegs: .08,
  /** A set ends once the feet have moved less than `stillLegs` (10th to 90th percentile of the foot nearer the floor)
   * for `quietSeconds`, after `minimumJumps` jumps; or when the athlete has not been seen for `quietSeconds`. */
  quietSeconds: 1.2, stillLegs: .06, minimumJumps: 2,
  minimumVisibility: .5,
});
export interface JumpWatchState { jumps: number; ended: boolean }

const seen = (p?: NormalizedLandmark) => !!p && Number.isFinite(p.x) && Number.isFinite(p.y) && p.visibility >= JUMP_WATCH.minimumVisibility;

/** The foot nearer the floor (its lowest point, image y, down) and the leg length, or null when either foot or leg
 * is not seen. The nearer foot: both feet must leave the floor for a jump (walking keeps one down). */
export function feetAndLeg(pose: readonly NormalizedLandmark[] | null): { foot: number; leg: number } | null {
  if (!pose) return null;
  const sides = ([0, 1] as const).map(s => {
    const foot = [27 + s, 29 + s, 31 + s].map(i => pose[i]).filter(seen).map(p => p.y);
    const hip = pose[23 + s], ankle = pose[27 + s];
    return foot.length && seen(hip) && seen(ankle) ? { foot: Math.max(...foot), leg: Math.abs(ankle.y - hip.y) } : null;
  });
  if (!sides[0] || !sides[1]) return null;
  const leg = (sides[0].leg + sides[1].leg) / 2;
  return leg >= .05 ? { foot: Math.max(sides[0].foot, sides[1].foot), leg } : null;
}

const percentile = (values: readonly number[], p: number) => {
  const s = [...values].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.max(0, Math.round(p * (s.length - 1))))];
};
/** Feed it each frame of a set in order: the selected athlete's pose (null when not found) and the frame time.
 * Jumps are counted from the hips (smooth in the model's points; the feet's points lag in a short contact):
 * each top preceded by a rise and followed by a fall of `apexLegs`, so the dip before the first jump is not one. */
export function jumpWatch() {
  const recent: { pts: number; foot: number; leg: number }[] = [];
  let jumps = 0, lastSeen: number | null = null, leg: number | null = null;
  let rising = true, trough: number | null = null, extreme: number | null = null;
  return (pose: readonly NormalizedLandmark[] | null, pts: number): JumpWatchState => {
    const W = JUMP_WATCH, feet = feetAndLeg(pose);
    if (feet) {
      lastSeen = pts; leg = feet.leg;
      recent.push({ pts, ...feet });
      while (recent.length && recent[0].pts < pts - W.quietSeconds) recent.shift();
    }
    const hips = pose && seen(pose[23]) && seen(pose[24]) ? (pose[23].y + pose[24].y) / 2 : null;
    if (hips !== null && leg) {
      const h = W.apexLegs * leg;
      if (extreme === null || trough === null) { extreme = trough = hips; }
      else if (rising) {
        // Image y grows downwards: a top is the smallest y.
        if (hips < extreme) extreme = hips;
        else if (hips - extreme > h) { if (trough - extreme > h) jumps++; rising = false; extreme = hips; }
      } else if (hips > extreme) extreme = hips;
      else if (extreme - hips > h) { rising = true; trough = extreme; extreme = hips; }
    }
    const still = recent.length >= 10 && pts - recent[0].pts >= W.quietSeconds - .1 &&
      (percentile(recent.map(r => r.foot), .9) - percentile(recent.map(r => r.foot), .1)) / percentile(recent.map(r => r.leg), .5) < W.stillLegs;
    const gone = lastSeen !== null && pts - lastSeen >= W.quietSeconds;
    return { jumps, ended: jumps >= W.minimumJumps && (still || gone) };
  };
}
