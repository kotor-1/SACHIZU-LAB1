/** Ground contacts from the athlete's pose in every frame, side view, shared by
 * the crouch start and the hurdle (both checked against the picture at 240 fps).
 *
 * A foot on the ground does not move: its toe stays at one place on the
 * ground. Contacts are found as such places (with the toes of both sides
 * pooled), so the left/right labels of the pose model, which swap when the
 * legs cross in a side view, are never needed. */
import type { CrouchFrame, CrouchPoint } from './crouch';

export const TOE = [31, 32] as const;
export const visible = (p: CrouchPoint | undefined, min = .5) => !!p && Number.isFinite(p.x) && Number.isFinite(p.y) && (p.visibility ?? 1) >= min;
export const median = (values: number[]) => { const a = [...values].sort((x, y) => x - y); return a.length ? a[a.length >> 1] : NaN; };
export const quantile = (values: number[], q: number) => { const a = [...values].sort((x, y) => x - y); return a.length ? a[Math.min(a.length - 1, Math.floor(q * a.length))] : NaN; };

/** Planted toes: a toe is planted when, within ±PLANT_WINDOW s, some toe stays
 * within PLANT_RADIUS leg lengths of it. Plants are runs of planted toes at one
 * place (gaps up to PLANT_GAP s). */
export const PLANT_WINDOW = .02, PLANT_RADIUS = .05, PLANT_JOIN = .1, PLANT_GAP = .03, PLANT_MIN = .03;
/** A ground contact after the blocks lasts at least this long (s): the swing
 * foot passing low, or a pose error as the legs cross, held one place for
 * 20-40 ms and was taken for a contact. Contacts of the first steps last
 * 0.12 s and more. Each contact is at least CONTACT_ADVANCE leg lengths ahead
 * of the previous one. */
export const CONTACT_MIN = .06, CONTACT_ADVANCE = .4;
/** Touchdown: the toe within GROUND_BAND leg lengths of the plant's ground
 * level; toe-off: no longer within LIFT_BAND. On 9 contacts of 3 athletes (240
 * fps) against the picture, LIFT_BAND 0.03 put toe-off 2.3 frames early on
 * average (up to 5.8); 0.05 gave 0.0 (up to 3.3) and 0.06 2.1 late. */
export const GROUND_BAND = .03, LIFT_BAND = .05;

export interface Contact {
  index: number; x: number; groundY: number;
  /** Touchdown and toe-off (s); null when not in the picture. */
  touchdown: number | null; toeOff: number | null;
  /** The frame of the touchdown (for the angles and the picture). */
  touchdownFrame: number | null;
  /** The frame of the toe-off; null when not in the picture. */
  toeOffFrame?: number | null;
}
export interface Toe { t: number; frame: number; x: number; y: number }
export interface Plant { x: number; y: number; from: number; to: number; toes: Toe[] }

/** Leg length (hip to ankle, pixels; the 90th percentile over the frames): the scale of every threshold. */
export function legLength(seen: readonly CrouchFrame[], W: number, H: number) {
  return quantile(seen.flatMap(f => [[23, 27], [24, 28]].flatMap(([a, b]) => visible(f.pose![a]) && visible(f.pose![b])
    ? [Math.hypot((f.pose![a].x - f.pose![b].x) * W, (f.pose![a].y - f.pose![b].y) * H)] : [])), .9);
}
/** Toes of both sides, pooled, in pixels. */
export const toesOf = (seen: readonly CrouchFrame[], W: number, H: number): Toe[] =>
  seen.flatMap(f => TOE.filter(k => visible(f.pose![k])).map(k => ({ t: f.pts, frame: f.frame, x: f.pose![k].x * W, y: f.pose![k].y * H })));
export const plantedToes = (toes: Toe[], leg: number) => toes.filter(o => toes.some(q => q !== o && Math.abs(q.t - o.t) <= PLANT_WINDOW && Math.abs(q.t - o.t) > 0
  && Math.hypot(q.x - o.x, q.y - o.y) < PLANT_RADIUS * leg));
/** Plants lasting at least PLANT_MIN s, each with its ground level (the lowest toe positions). */
export function plantsOf(planted: Toe[], leg: number): Plant[] {
  const plants: Plant[] = [];
  for (const o of planted) {
    const p = plants.find(c => Math.abs(c.x - o.x) < PLANT_JOIN * leg && o.t - c.to <= PLANT_GAP);
    if (p) { p.toes.push(o); p.to = Math.max(p.to, o.t); p.x = median(p.toes.map(q => q.x)); }
    else plants.push({ x: o.x, y: o.y, from: o.t, to: o.t, toes: [o] });
  }
  for (const p of plants) p.y = quantile(p.toes.map(q => q.y), .8);   // ground level: the lowest positions
  return plants.filter(p => p.to - p.from >= PLANT_MIN);
}
/** Plants at one place (within PLANT_JOIN leg lengths) are one. */
export function mergeByPlace(plants: Plant[], leg: number): Plant[] {
  const out: Plant[] = [];
  for (const p of [...plants].sort((a, b) => a.from - b.from)) {
    const same = out.find(o => Math.abs(o.x - p.x) < PLANT_JOIN * leg);
    if (same) { same.toes.push(...p.toes); same.from = Math.min(same.from, p.from); same.to = Math.max(same.to, p.to);
      same.x = median(same.toes.map(q => q.x)); same.y = quantile(same.toes.map(q => q.y), .8); }
    else out.push({ ...p, toes: [...p.toes] });
  }
  return out;
}
/** Contacts: merged plants lasting CONTACT_MIN s, in time order, each
 * CONTACT_ADVANCE leg lengths ahead of the one before. */
export function contactPlants(plants: Plant[], leg: number, direction: number, max = Infinity): Plant[] {
  const out: Plant[] = [];
  for (const p of mergeByPlace(plants, leg).filter(p => p.to - p.from >= CONTACT_MIN).sort((a, b) => a.from - b.from)) {
    const previous = out.at(-1);
    if (!previous || (p.x - previous.x) * direction > CONTACT_ADVANCE * leg) out.push(p);
    if (out.length === max) break;
  }
  return out;
}

/** Touchdown: the first toe at the place within GROUND_BAND leg lengths of its
 * ground level; toe-off: the last within LIFT_BAND. The toe point rises from the
 * ground level before the shoe leaves it, as the foot rotates over its tip: the
 * last toe within GROUND_BAND was 1-6 frames (240 fps) before the picture showed
 * the shoe leave (recorded). A contact cut by the end of the video has no toe-off;
 * with `firstSeen`, one already on the ground when the athlete was first seen has
 * no touchdown. */
export function contactOf(p: Plant, index: number, toes: Toe[], leg: number, lastSeen: number, firstSeen = -Infinity): Contact {
  const near = toes.filter(q => Math.abs(q.x - p.x) < PLANT_RADIUS * 2 * leg && q.t >= p.from - .1 && q.t <= p.to + .1)
    .sort((a, b) => a.t - b.t);
  const first = near.find(q => p.y - q.y < GROUND_BAND * leg) ?? null;
  const last = [...near].reverse().find(q => p.y - q.y < LIFT_BAND * leg) ?? null;
  const cut = last === null || lastSeen - last.t < .02, early = first === null || first.t - firstSeen < .02;
  return { index, x: p.x, groundY: p.y, touchdown: early ? null : first.t, touchdownFrame: early ? null : first.frame,
    toeOff: cut ? null : last.t, toeOffFrame: cut ? null : last.frame };
}
