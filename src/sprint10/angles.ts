/** Segment and joint angles in a side view, degrees, shared by the crouch start
 * and the hurdle. `direction` is the running direction in the picture (+1 to
 * the right); forward is positive. Points below 0.3 visibility are not used. */
import type { CrouchPoint } from './crouch';
import { TOE, visible } from './contacts';

/** A trunk shorter than TRUNK_MIN leg lengths or a thigh/shank shorter than
 * SEGMENT_MIN gives no angle: a small athlete's crouched set pose collapsed the
 * hips onto the shoulders (0.01-0.37 leg lengths; 0.6-0.77 in two athletes'
 * frames) and read a trunk lean of 28° in a near-horizontal set; thigh and shank
 * were 0.49-0.54 in two athletes' set poses and 0.26-0.29 in a collapsed one. */
export const TRUNK_MIN = .45, SEGMENT_MIN = .38;
const degrees = (r: number) => r * 180 / Math.PI;

/** The landmark side (0 left, 1 right) whose toe is nearest normalized x. */
export function sideNearest(pose: CrouchPoint[], x: number, W: number): 0 | 1 | null {
  const d = TOE.map(k => visible(pose[k], .3) ? Math.abs(pose[k].x - x) * W : Infinity);
  return d[0] === Infinity && d[1] === Infinity ? null : d[0] <= d[1] ? 0 : 1;
}
/** Forward lean of the trunk (hip to shoulder) from vertical. */
export function trunkAngle(pose: CrouchPoint[], W: number, H: number, direction: number, leg: number): number | null {
  if (![11, 12, 23, 24].every(k => visible(pose[k], .3))) return null;
  const sx = (pose[11].x + pose[12].x) / 2 * W, sy = (pose[11].y + pose[12].y) / 2 * H;
  const hx = (pose[23].x + pose[24].x) / 2 * W, hy = (pose[23].y + pose[24].y) / 2 * H;
  if (Math.hypot(sx - hx, sy - hy) < TRUNK_MIN * leg) return null;
  return degrees(Math.atan2((sx - hx) * direction, hy - sy));
}
/** Shank (ankle to knee) from vertical, knee ahead of the ankle positive. */
export function shankAngle(pose: CrouchPoint[], side: 0 | 1, W: number, H: number, direction: number): number | null {
  const knee = pose[25 + side], ankle = pose[27 + side];
  if (!visible(knee, .3) || !visible(ankle, .3)) return null;
  return degrees(Math.atan2((knee.x - ankle.x) * W * direction, (ankle.y - knee.y) * H));
}
/** Thigh (hip to knee) from hanging straight down, knee ahead of the hip
 * positive: 90 is a thigh raised level and forward. */
export function thighAngle(pose: CrouchPoint[], side: 0 | 1, W: number, H: number, direction: number, leg: number): number | null {
  const hip = pose[23 + side], knee = pose[25 + side];
  if (!visible(hip, .3) || !visible(knee, .3)) return null;
  const dx = (knee.x - hip.x) * W * direction, dy = (knee.y - hip.y) * H;
  if (Math.hypot(dx, dy) < SEGMENT_MIN * leg) return null;
  return degrees(Math.atan2(dx, dy));
}
/** Knee angle (hip-knee-ankle), 180 = straight. */
export function kneeAngle(pose: CrouchPoint[], side: 0 | 1, W: number, H: number, leg: number): number | null {
  const [h, k, a] = [pose[23 + side], pose[25 + side], pose[27 + side]];
  if (![h, k, a].every(p => visible(p, .3))) return null;
  const v1 = { x: (h.x - k.x) * W, y: (h.y - k.y) * H }, v2 = { x: (a.x - k.x) * W, y: (a.y - k.y) * H };
  if (Math.hypot(v1.x, v1.y) < SEGMENT_MIN * leg || Math.hypot(v2.x, v2.y) < SEGMENT_MIN * leg) return null;
  const c = (v1.x * v2.x + v1.y * v2.y) / (Math.hypot(v1.x, v1.y) * Math.hypot(v2.x, v2.y));
  return degrees(Math.acos(Math.max(-1, Math.min(1, c))));
}
