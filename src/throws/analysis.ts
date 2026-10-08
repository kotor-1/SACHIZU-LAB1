/** Throws, side view: javelin-type throws (ジャベリックスロー, javelin) and the
 * shot put (glide or standing throw; the user, 2026-10-05: 「グライドもしくは
 * 助走なし投げのみ」), from the athlete's pose in every frame. Motion only:
 * times between the moments and angles at them, nothing that needs a distance.
 *
 * The moments (dev-validation/throw, 7 videos against the picture):
 * - contacts: the crouch start's and the hurdle's toes at rest (both sides
 *   pooled), so the pose model's left/right labels are not needed for them;
 * - release: the throwing hand's highest point. The hand's speed peak missed in
 *   3 of 7 videos (the wrists' labels swap and jump near the release); with the
 *   throwing hand given by the user and its jumps removed, its highest point
 *   was 2 frames early to 3 late against the picture (7 videos, Chrome and
 *   WebKit, 120 fps frames). The user can move it to the frame they see (the replay).
 * - against the picture the front foot's touchdown came 0-3 frames late, the
 *   glide's rear foot 0-1 early leaving and 0-3 early landing (docs/Throws_v1_20261005.md).
 * - front foot (the block leg; the left for a right-hander): the foremost
 *   contact on the ground at the release; the rear foot: the last plant behind it.
 * Angles from RTMPose (`refined`) where present, as the hurdle. */
import { anglePose, type CrouchFrame, type CrouchPoint } from '../sprint10/crouch';
import { legLength, median, plantedToes, plantsOf, quantile, toesOf, visible, CONTACT_MIN, GROUND_BAND, LIFT_BAND, PLANT_JOIN, PLANT_RADIUS, type Contact, type Plant, type Toe } from '../sprint10/contacts';
import { editContacts, type Edits } from '../sprint10/moment-edits';
import { trunkAngle } from '../sprint10/angles';
import type { Mark, Phase } from '../sprint10/crouch-figure';
import { centreOfMass } from '../hurdling/analysis';
import type { FlightPath } from './implement';

/** v2 (2026-10-06): the release from the implement's flight, the stance, the glide, the deceleration, the user's height. */
export const THROW_VERSION = 'throws-v2-experimental';
export type ThrowEvent = 'jav' | 'shot';
export type ShotStyle = 'glide' | 'standing';
export type Hand = 'right' | 'left';

/** A hand point further than this many leg lengths from the median of its
 * neighbours (±SPIKE_SECONDS) is a jump of the pose model: it takes that median. */
const SPIKE_LEGS = .25, SPIKE_SECONDS = .025;
/** Angles are medians over ±ANGLE_SECONDS (3 frames at 120 fps, 5 at 240). */
const ANGLE_SECONDS = .0085;
/** The front foot is on the ground at the release: its contact lasts until at
 * least this long before it (a front foot leaving just before the release, as
 * in a reverse, still counts). */
const FRONT_UNTIL = .15;
/** The rear contact is at least this many leg lengths behind the front one. */
const REAR_BEHIND = .2;
/** The athlete must move this many leg lengths toward the throw (first to last frame). */
const MIN_TRAVEL = .15;
/** A plant whose toe drifts across faster than this (leg lengths/s, its first
 * third to its last) is a foot moving slowly, not one on the ground: the shot's
 * kick leg reaching back through the air and feet sliding after the release
 * drifted 0.67-4.9, feet on the ground 0.03-0.10 (2 videos, recorded). */
const STILL_DRIFT = .5;
/** Plants at one place are one contact only when this close in time (s): in the
 * glide the rear foot lands where the free foot was at the start, and merging
 * by place alone (as the sprint does) made them one contact (recorded). */
const JOIN_GAP = .05;
/** A contact's ground level for its touchdown is the toe's lowest in its first
 * this long (s), for its toe-off in its last: over a whole contact the toe sank
 * further as the foot rolled and pivoted (0.01-0.04 leg lengths), and the lowest
 * over all of it put a block foot's touchdown 2 s late (recorded). */
const LEVEL_SECONDS = .25;
/** A thigh or shank shorter than this many leg lengths gives no knee angle. The
 * sprint's 0.38 (for collapsed crouched poses) took the angle away at a junior's
 * block contact, where the shank, pointing a little toward the camera, measured
 * 0.36 (recorded). */
const SEGMENT_MIN = .25;
/** At its touchdown a toe stays within REST_LEGS leg lengths for the next REST_SECONDS. */
const REST_SECONDS = .018, REST_LEGS = .03;
/** Standing throw: the hips furthest back in this long before the release start the delivery. */
const POWER_SEARCH = 1.2;
/** The centre of mass's forward speed: a straight line through it over ±COM_SECONDS. At ±0.025 s one junior's
 * loss from the block contact to the release was 31% in Chrome and 49% in WebKit (their release frames 4 apart);
 * at ±0.06 s, 50% and 38%, the three others within 4 points (recorded). */
const COM_SECONDS = .06;
/** The athlete's height in the picture is the trunk (shoulders' midpoint to hips' midpoint, its longest 10% over
 * the frames) over its share of the standing height, 0.288 (Drillis & Contini 1966, in Winter's Biomechanics:
 * shoulder 0.818, hip 0.530). Against the release speeds the records give (javelic throw: 前田・丹松 2008's
 * distance = 3.612 v - 37.98 for the Turbojav; shot: 7.50 m as a projectile), 4 athletes, 6 throws, Chrome and
 * WebKit, the trunk put the implement's speed within 11% (mean 7%); the hip to ankle (0.491) 26% (mean 16%,
 * always fast: the pose model's hip and ankle points make the leg short), thigh plus shank 22%, the median of
 * four estimates 19% (recorded, dev-validation/throw/scale-variants.mjs). */
const TRUNK_SHARE = .288;

export interface ThrowOptions {
  /** Picture size, so distances are measured in pixels alike in both axes. */
  width: number; height: number;
  event: ThrowEvent; hand: Hand;
  /** Shot put only. */
  style?: ShotStyle;
  /** The release frame set by the user; else found. */
  releaseFrame?: number | null;
  /** The frames the user set for the contacts (`td{n}`, `to{n}` of contact n; sprint10/moment-edits.ts). */
  edits?: Edits;
}
export interface Moment { frame: number; pts: number }
export interface ThrowTimes {
  /** Shot glide: the rear foot leaving the back of the circle to its touchdown (s). */
  glide: number | null;
  /** Rear foot touchdown to front foot touchdown: the javelin's last stride, the glide's transition (s). */
  rearToFront: number | null;
  /** Front foot touchdown (standing shot: the hips furthest back) to the release (s). */
  delivery: number | null;
}
export interface ThrowResult {
  version: string; reason: string | null;
  event: ThrowEvent; style: ShotStyle | null; hand: Hand; direction: number;
  contacts: Contact[];
  /** Indices into `contacts`; null when not found. `start`: the shot glide's starting contact. */
  rear: number | null; front: number | null; start: number | null;
  release: Moment | null;
  /** The release found from the hand (the user's may differ). */
  releaseFound: Moment | null;
  releaseSetByUser: boolean;
  /** Standing shot put: the hips furthest back, where the delivery starts. */
  power: Moment | null;
  /** Where the delivery starts: the front foot's touchdown, or (standing, or no touchdown seen) the hips furthest back. */
  deliveryStart: Moment | null;
  times: ThrowTimes;
  /** The front (block) knee: at the delivery start, its least angle up to the release (with when) and at the release. */
  frontKnee: { atStart: number | null; least: number | null; leastAt: Moment | null; atRelease: number | null };
  /** The rear knee at the rear foot's touchdown, at the delivery start and at the release. */
  rearKnee: { atRear: number | null; atStart: number | null; atRelease: number | null };
  /** Trunk from vertical, forward (toward the throw) positive, at the rear touchdown, the delivery start and the release. */
  trunk: { atRear: number | null; atStart: number | null; atRelease: number | null };
  /** The athlete's standing height in the picture (source pixels; see TRUNK_SHARE), and the leg (hip to ankle). */
  bodyPx: number | null; legPx: number;
  /** Ground level (source y) under the front foot, and the throwing wrist at the release (source pixels). */
  groundY: number | null; releaseHand: { x: number; y: number } | null;
  /** Front foot to rear foot along the throw at the delivery start (the power position), and the glide's way
   * from where the rear foot started to its touchdown (source pixels). */
  stancePx: number | null; glidePx: number | null;
  /** The centre of mass's forward speed (source px/s) at the delivery start and at the release. */
  com: { atStart: number | null; atRelease: number | null };
  moments: Phase[];
  notes: string[];
}
/** What is known of the release with the implement's flight: speed (m/s, needs the height), angle, height (m and
 * share of the standing height), and a javelin's attitude and angle of attack (attitude minus release angle). */
export interface ReleaseMeasures { speed: number | null; angle: number | null; height: number | null; heightShare: number | null; attitude: number | null; attack: number | null }

type Point = { x: number; y: number };
const seconds = (a: Moment | null | undefined, b: Moment | null | undefined) => a && b ? b.pts - a.pts : null;

/** The pose model's side (0 left, 1 right landmarks) whose toe is nearest a contact's place. */
function sideAt(pose: CrouchPoint[], c: Contact, W: number, H: number): 0 | 1 | null {
  const d = [31, 32].map(k => visible(pose[k], .3) ? Math.hypot(pose[k].x * W - c.x, pose[k].y * H - c.groundY) : Infinity);
  return d[0] === Infinity && d[1] === Infinity ? null : d[0] <= d[1] ? 0 : 1;
}

/** Plants of feet on the ground: still ones (see STILL_DRIFT), joined when at one
 * place and close in time, lasting a contact's least time. */
function groundPlants(raw: Plant[], leg: number): Plant[] {
  const still = raw.filter(p => {
    const xs = p.toes.map(o => o.x), third = Math.max(1, Math.floor(xs.length / 3));
    return Math.abs(median(xs.slice(-third)) - median(xs.slice(0, third))) / leg / Math.max(1e-3, p.to - p.from) < STILL_DRIFT;
  });
  const out: Plant[] = [];
  for (const p of [...still].sort((a, b) => a.from - b.from)) {
    const same = out.find(o => Math.abs(o.x - p.x) < PLANT_JOIN * leg && p.from - o.to <= JOIN_GAP);
    if (same) { same.toes.push(...p.toes); same.to = Math.max(same.to, p.to); same.x = median(same.toes.map(q => q.x)); same.y = quantile(same.toes.map(q => q.y), .8); }
    else out.push({ ...p, toes: [...p.toes] });
  }
  return out.filter(p => p.to - p.from >= CONTACT_MIN);
}

/** Touchdown and toe-off of a plant (the sprint's contactOf, with the ground
 * level of each taken near it, see LEVEL_SECONDS). The touchdown is also not
 * before the toe comes to rest: a shot putter's foot coming down at a shallow
 * angle reached the ground level 2-5 frames before the shoe met the ground, by
 * 1-3 frames differently in Chrome and WebKit; at rest it was 2-3 frames before
 * in both (recorded). None when the contact is cut by the start or the end of the video. */
function contactOf(p: Plant, toes: Toe[], leg: number, lastSeen: number, firstSeen: number): Contact {
  const near = toes.filter(q => Math.abs(q.x - p.x) < PLANT_RADIUS * 2 * leg && q.t >= p.from - .1 && q.t <= p.to + .1).sort((a, b) => a.t - b.t);
  const level = (from: number, to: number) => quantile(p.toes.filter(q => q.t >= from && q.t <= to).map(q => q.y), .8);
  const early = level(p.from, p.from + LEVEL_SECONDS), late = level(p.to - LEVEL_SECONDS, p.to);
  const rests = (q: Toe) => near.every(o => o.t <= q.t || o.t > q.t + REST_SECONDS || Math.hypot(o.x - q.x, o.y - q.y) < REST_LEGS * leg);
  const first = near.find(q => q.t >= p.from && early - q.y < GROUND_BAND * leg && rests(q)) ?? null;
  const last = [...near].reverse().find(q => late - q.y < LIFT_BAND * leg) ?? null;
  const cut = last === null || lastSeen - last.t < .02, before = first === null || first.t - firstSeen < .02;
  return { index: 0, x: p.x, groundY: p.y, touchdown: before ? null : first.t, touchdownFrame: before ? null : first.frame,
    toeOff: cut ? null : last.t, toeOffFrame: cut ? null : last.frame };
}

/** Knee angle (hip-knee-ankle), 180 = straight. */
function kneeAngle(pose: CrouchPoint[], side: 0 | 1, W: number, H: number, leg: number): number | null {
  const [h, k, a] = [pose[23 + side], pose[25 + side], pose[27 + side]];
  if (![h, k, a].every(p => visible(p, .3))) return null;
  const u = { x: (h.x - k.x) * W, y: (h.y - k.y) * H }, v = { x: (a.x - k.x) * W, y: (a.y - k.y) * H };
  if (Math.hypot(u.x, u.y) < SEGMENT_MIN * leg || Math.hypot(v.x, v.y) < SEGMENT_MIN * leg) return null;
  return Math.acos(Math.max(-1, Math.min(1, (u.x * v.x + u.y * v.y) / Math.hypot(u.x, u.y) / Math.hypot(v.x, v.y)))) * 180 / Math.PI;
}

/** A landmark's track in pixels with the pose model's jumps replaced by the median of the neighbours. */
function steadyTrack(seen: readonly CrouchFrame[], k: number, W: number, H: number, leg: number): (Point | null)[] {
  const raw = seen.map(f => { const p = anglePose(f)![k]; return visible(p, .1) ? { x: p.x * W, y: p.y * H } : null; });
  return raw.map((p, i) => {
    if (!p) return null;
    const near = raw.filter((q, j) => q && Math.abs(seen[j].pts - seen[i].pts) <= SPIKE_SECONDS) as Point[];
    const m = { x: median(near.map(q => q.x)), y: median(near.map(q => q.y)) };
    return Math.hypot(p.x - m.x, p.y - m.y) > SPIKE_LEGS * leg ? m : p;
  });
}

export function analyzeThrow(frames: readonly CrouchFrame[], options: ThrowOptions): ThrowResult {
  const { width: W, height: H, event, hand } = options;
  const style = event === 'shot' ? options.style ?? 'glide' : null;
  const base: ThrowResult = { version: THROW_VERSION, reason: null, event, style, hand, direction: 0, contacts: [], rear: null, front: null, start: null,
    release: null, releaseFound: null, releaseSetByUser: false, power: null, deliveryStart: null, times: { glide: null, rearToFront: null, delivery: null },
    frontKnee: { atStart: null, least: null, leastAt: null, atRelease: null }, rearKnee: { atRear: null, atStart: null, atRelease: null },
    trunk: { atRear: null, atStart: null, atRelease: null }, bodyPx: null, legPx: 0, groundY: null, releaseHand: null, stancePx: null, glidePx: null,
    com: { atStart: null, atRelease: null }, moments: [], notes: [] };
  const fail = (reason: string) => ({ ...base, reason });
  // Contacts and angles on RTMPose's points where there are any (as the hurdle).
  const seen = frames.filter(f => f.pose).map(f => f.refined ? { ...f, pose: f.refined } : f);
  if (seen.length < 20) return fail('選手を十分に捉えられませんでした。真横から、全身が映るように撮影してください。');
  const leg = legLength(seen, W, H);
  if (!(leg > 0)) return fail('脚を十分に捉えられませんでした。');
  base.legPx = leg;
  const at = (m: Moment | null) => m ? seen.findIndex(f => f.frame === m.frame) : -1;
  const moment = (i: number): Moment => ({ frame: seen[i].frame, pts: seen[i].pts });

  // The throw's direction: where the hips go from the first frame to the last.
  const hips = seen.map(f => { const p = f.pose!; return visible(p[23], .3) && visible(p[24], .3) ? (p[23].x + p[24].x) / 2 * W : null; });
  const known = hips.flatMap((x, i) => x === null ? [] : [{ i, x }]);
  if (known.length < 2 || Math.abs(known.at(-1)!.x - known[0].x) < MIN_TRAVEL * leg)
    return fail('投げる向きを確認できませんでした。投げる方向に対して真横から、投げ終わりまで映る動画を使ってください。');
  const direction = Math.sign(known.at(-1)!.x - known[0].x);
  base.direction = direction;

  // The release: the throwing hand's highest point, or the user's frame.
  const hand16 = hand === 'right' ? 16 : 15;
  const wrist = steadyTrack(seen, hand16, W, H, leg);
  let top = -1;
  wrist.forEach((p, i) => { if (p && (top < 0 || p.y < wrist[top]!.y)) top = i; });
  if (top < 0) return fail(`${hand === 'right' ? '右' : '左'}手を捉えられず、リリースの瞬間を決められませんでした。`);
  base.releaseFound = moment(top);
  const chosen = options.releaseFrame == null ? -1 : seen.findIndex(f => f.frame === options.releaseFrame);
  const r = chosen >= 0 ? chosen : top;
  base.release = moment(r); base.releaseSetByUser = chosen >= 0 && chosen !== top;
  const release = base.release;
  base.releaseHand = wrist[r];

  // Contacts: places where a toe stays, merged by place, in time order.
  const toes = toesOf(seen, W, H);
  const plants = groundPlants(plantsOf(plantedToes(toes, leg), leg), leg);
  const firstSeen = seen[0].pts, lastSeen = seen.at(-1)!.pts;
  const found = plants.map(p => ({ p, c: contactOf(p, toes, leg, lastSeen, firstSeen) })).sort((a, b) => (a.c.touchdown ?? a.p.from) - (b.c.touchdown ?? b.p.from));
  plants.splice(0, plants.length, ...found.map(f => f.p));
  base.contacts = found.map((f, i) => ({ ...f.c, index: i + 1 }));
  if (options.edits) base.contacts = editContacts(base.contacts, options.edits, frames);
  const ahead = (i: number) => base.contacts[i].x * direction;
  const begins = (i: number) => base.contacts[i].touchdown ?? plants[i].from;
  // Front: the foremost contact begun before the release and on the ground until about then.
  const onAtRelease = plants.map((_, i) => i).filter(i => begins(i) <= release.pts && plants[i].to >= release.pts - FRONT_UNTIL);
  const front = onAtRelease.length ? onAtRelease.reduce((a, b) => ahead(b) > ahead(a) ? b : a) : null;
  base.front = front;
  // Rear (shot put): the last plant begun before the front one, behind it. Not
  // for the javelin: its rear foot slides on after landing, and the toe came to
  // rest 0.1 s after the shoe met the ground in both adults' videos (recorded).
  const behind = (i: number, of: number) => (base.contacts[of].x - base.contacts[i].x) * direction > REAR_BEHIND * leg;
  const rear = front === null || event === 'jav' ? null : plants.map((_, i) => i).filter(i => i !== front && begins(i) < begins(front) && behind(i, front))
    .reduce<number | null>((a, b) => a === null || begins(b) > begins(a) ? b : a, null);
  base.rear = rear;
  // Glide: where the rear foot started, behind its touchdown; the one left last (the free foot may touch down at the back too).
  if (style === 'glide' && rear !== null) base.start = plants.map((_, i) => i).filter(i => i !== rear && begins(i) < begins(rear) && behind(i, rear))
    .reduce<number | null>((a, b) => a === null || plants[b].to > plants[a].to ? b : a, null);
  const C = (i: number | null) => i === null ? null : base.contacts[i];
  const touchdown = (c: Contact | null): Moment | null => c && c.touchdown !== null && c.touchdownFrame !== null ? { frame: c.touchdownFrame, pts: c.touchdown } : null;
  const toeOff = (c: Contact | null): Moment | null => c && c.toeOff != null && c.toeOffFrame != null ? { frame: c.toeOffFrame, pts: c.toeOff } : null;
  const rearDown = touchdown(C(rear)), frontDown = touchdown(C(front)), glideOff = toeOff(C(base.start));
  if (frontDown && frontDown.pts > release.pts) return fail('リリースの前に前足の接地を見つけられませんでした。');

  // The hips furthest back before the release (standing throws, or no front touchdown in the picture).
  let power = -1;
  for (let i = r; i >= 0 && seen[r].pts - seen[i].pts <= POWER_SEARCH; i--) if (hips[i] !== null && (power < 0 || hips[i]! * direction < hips[power]! * direction)) power = i;
  if (style === 'standing' && power >= 0) base.power = moment(power);
  base.deliveryStart = style === 'standing' ? base.power : frontDown ?? (power >= 0 ? moment(power) : null);
  const start = base.deliveryStart;
  if (event === 'jav' && front === null) base.notes.push('ブロック脚（前足）の接地を見つけられませんでした。足元まで映るように撮影してください。');
  else if (event === 'jav' && !frontDown) base.notes.push('ブロック脚の接地の瞬間が映っていないため、腰が最も後ろにきた瞬間から測っています。');
  if (style === 'glide' && !frontDown) base.notes.push('前足の接地が映っていないため、腰が最も後ろにきた瞬間から測っています。');
  if (style === 'glide' && !glideOff) base.notes.push('グライドの始まり（後ろ足が離れる瞬間）が映っていないため、グライドの時間を出していません。');
  if (style === 'glide' && rearDown && glideOff && rearDown.pts <= glideOff.pts) base.notes.push('グライドの足の動きを判定できませんでした。');

  base.times = {
    glide: style === 'glide' && glideOff && rearDown && rearDown.pts > glideOff.pts ? rearDown.pts - glideOff.pts : null,
    rearToFront: style === 'standing' ? null : seconds(rearDown, frontDown),
    delivery: seconds(start, release),
  };

  // Angles, each the median over a few frames around its moment. Legs by place where the contact is known, else by the hand.
  const frontC = C(front);
  const frontSide = (pose: CrouchPoint[]): 0 | 1 | null => frontC ? sideAt(pose, frontC, W, H) : hand === 'right' ? 0 : 1;
  const rearSide = (pose: CrouchPoint[]): 0 | 1 | null => { const s = frontC ? sideAt(pose, frontC, W, H) : null; return s !== null ? (1 - s) as 0 | 1 : hand === 'right' ? 1 : 0; };
  const knee = (side: (p: CrouchPoint[]) => 0 | 1 | null) => (p: CrouchPoint[]) => { const s = side(p); return s === null ? null : kneeAngle(p, s, W, H, leg); };
  const frontKnee = knee(frontSide), rearKnee = knee(rearSide), trunk = (p: CrouchPoint[]) => trunkAngle(p, W, H, direction, leg);
  const around = (m: Moment | null, f: (p: CrouchPoint[]) => number | null) => {
    if (!m) return null;
    const v = seen.filter(q => Math.abs(q.pts - m.pts) <= ANGLE_SECONDS).map(q => f(q.pose!)).filter((x): x is number => x !== null);
    return v.length ? median(v) : null;
  };
  base.frontKnee.atStart = around(start, frontKnee);
  base.frontKnee.atRelease = around(release, frontKnee);
  const s0 = at(start);
  if (s0 >= 0 && s0 <= r) {
    let least: number | null = null, leastAt = -1;
    for (let i = s0; i <= r; i++) { const v = around(moment(i), frontKnee); if (v !== null && (least === null || v < least)) { least = v; leastAt = i; } }
    base.frontKnee.least = least; base.frontKnee.leastAt = leastAt >= 0 ? moment(leastAt) : null;
  }
  base.rearKnee = { atRear: around(rearDown, rearKnee), atStart: around(start, rearKnee), atRelease: around(release, rearKnee) };
  base.trunk = { atRear: around(rearDown, trunk), atStart: around(start, trunk), atRelease: around(release, trunk) };

  // The ground under the front foot, and the athlete's height in the picture (see SHARE).
  base.groundY = frontC ? frontC.groundY : quantile(toes.map(q => q.y), .95);
  const trunks = seen.flatMap(f => [11, 12, 23, 24].every(k => visible(f.pose![k], .3))
    ? [Math.hypot(((f.pose![11].x + f.pose![12].x) - (f.pose![23].x + f.pose![24].x)) / 2 * W, ((f.pose![11].y + f.pose![12].y) - (f.pose![23].y + f.pose![24].y)) / 2 * H)] : []);
  const trunkPx = trunks.length ? quantile(trunks, .9) : NaN;
  base.bodyPx = trunkPx > 0 ? trunkPx / TRUNK_SHARE : null;

  // The stance at the delivery start: the feet on the ground then, foremost to rearmost.
  if (start) {
    const down = plants.map((_, i) => i).filter(i => begins(i) <= start.pts + .01 && plants[i].to >= start.pts - .01);
    if (down.length >= 2) { const xs = down.map(i => base.contacts[i].x * direction); base.stancePx = Math.max(...xs) - Math.min(...xs); }
  }
  if (style === 'glide' && rear !== null && base.start !== null) base.glidePx = (base.contacts[rear].x - base.contacts[base.start].x) * direction;

  // The centre of mass's forward speed (de Leva, as the hurdle).
  const com = seen.flatMap(f => { const c = centreOfMass(f.pose!); return c ? [{ t: f.pts, x: c.x * W }] : []; });
  const comSpeed = (m: Moment | null) => {
    if (!m) return null;
    const near = com.filter(q => Math.abs(q.t - m.pts) <= COM_SECONDS);
    if (near.length < 5) return null;
    const mt = near.reduce((a, q) => a + q.t, 0) / near.length;
    return direction * near.reduce((a, q) => a + (q.t - mt) * q.x, 0) / near.reduce((a, q) => a + (q.t - mt) ** 2, 0);
  };
  base.com = { atStart: comSpeed(start), atRelease: comSpeed(release) };
  base.moments = momentsOf(base, frames, W, H, rearDown, frontDown);
  return base;
}

/** The pictures' moments with their angles, named for the event and the hand.
 * Each picture's knees are that frame's legs, chosen by the front contact's place. */
function momentsOf(r: ThrowResult, frames: readonly CrouchFrame[], W: number, H: number, rearDown: Moment | null, frontDown: Moment | null): Phase[] {
  const out: Phase[] = [], names = throwNames(r), frontC = r.front === null ? null : r.contacts[r.front];
  const frontLabel = r.event === 'jav' ? 'ブロック膝' : '前膝';
  const add = (key: string, label: string, short: string, m: Moment | null, marks: (sides: { front: 0 | 1 | null; rear: 0 | 1 | null }) => (Mark | null)[]) => {
    const f = m ? frames.find(q => q.frame === m.frame && q.pose) : null, pose = f ? anglePose(f) : null;
    if (!m || !pose) return;
    const s = frontC ? sideAt(pose, frontC, W, H) : r.hand === 'right' ? 0 : 1;
    const sides = { front: s, rear: s === null ? null : (1 - s) as 0 | 1 };
    out.push({ key, label, short, frame: m.frame, pts: m.pts, marks: marks(sides).filter((k): k is Mark => k !== null) });
  };
  // The trunk's lean named by its way (a throw leans back as often as forward).
  const trunk = (value: number | null): Mark | null => value === null ? null : { kind: 'trunk', label: value < 0 ? '後傾' : '前傾', value: Math.abs(value) };
  const knee = (label: string, value: number | null, side: 0 | 1 | null): Mark | null => value === null || side === null ? null : { kind: 'knee', side, label, value };
  if (rearDown) add('rear', names.rearDown, names.rearShort, rearDown, s => [trunk(r.trunk.atRear), knee('後膝', r.rearKnee.atRear, s.rear)]);
  const power = r.style === 'standing' || !frontDown;
  add(power ? 'power' : 'front', power ? names.power : names.frontDown, power ? '突き出し開始' : names.frontShort, r.deliveryStart,
    s => [trunk(r.trunk.atStart), knee(frontLabel, r.frontKnee.atStart, s.front), r.event === 'shot' ? knee('後膝', r.rearKnee.atStart, s.rear) : null]);
  const least = r.frontKnee.leastAt;
  if (r.event === 'jav' && least && least.frame !== r.deliveryStart?.frame && least.frame !== r.release?.frame)
    add('least', 'ブロック膝が最も曲がった時', '最も曲がる', least, s => [knee(frontLabel, r.frontKnee.least, s.front)]);
  add('release', 'リリース', 'リリース', r.release, s => [trunk(r.trunk.atRelease), knee(frontLabel, r.frontKnee.atRelease, s.front)]);
  return out.sort((a, b) => a.pts - b.pts);
}

/** The release with the implement's flight (implement.ts) and the athlete's height (m; without it, no speed or metres).
 * The height of the release is the shot's centre, or the javelin's grip (the throwing wrist). */
export function releaseMeasures(r: ThrowResult, flight: FlightPath | null, attitude: number | null, heightM: number | null): ReleaseMeasures {
  const scale = heightM && r.bodyPx ? r.bodyPx / heightM : null;
  const y = r.event === 'shot' ? flight?.y0 ?? r.releaseHand?.y ?? null : r.releaseHand?.y ?? null;
  const share = y !== null && r.groundY !== null && r.bodyPx ? (r.groundY - y) / r.bodyPx : null;
  return {
    speed: flight && scale ? flight.speedPx / scale : null,
    angle: flight?.angle ?? null,
    height: share !== null && heightM ? share * heightM : null, heightShare: share,
    attitude: r.event === 'jav' ? attitude : null,
    attack: r.event === 'jav' && attitude !== null && flight ? attitude - flight.angle : null,
  };
}

/** The moments' names: the rear and front feet by the throwing hand (a right-hander's rear foot is the right). */
export function throwNames(r: Pick<ThrowResult, 'event' | 'hand'>) {
  const rearFoot = r.hand === 'right' ? '右足' : '左足', frontFoot = r.hand === 'right' ? '左足' : '右足';
  return r.event === 'jav'
    ? { rearDown: `${rearFoot}の接地（最後の1歩）`, rearShort: `${rearFoot}接地`, frontDown: `ブロック脚（${frontFoot}）の接地`, frontShort: 'ブロック接地', power: '投げ始め（腰が最も後ろ）', rearFoot, frontFoot }
    : { rearDown: `${rearFoot}の接地（グライドの後）`, rearShort: `${rearFoot}接地`, frontDown: `${frontFoot}の接地（パワーポジション）`, frontShort: `${frontFoot}接地`, power: '突き出しの開始（腰が最も後ろ）', rearFoot, frontFoot };
}
