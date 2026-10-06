/** Crouch start, side view: the blocks, the front foot leaving them, and up to
 * five ground contacts after it, from the athlete's pose in every frame.
 *
 * A foot on the ground does not move: its toe stays at one place on the
 * ground. Contacts are found as such places (with the toes of both sides
 * pooled), so the left/right labels of the pose model, which swap when the
 * legs cross in a side view, are never needed. */
import { contactOf, contactPlants, legLength, median, PLANT_GAP, plantedToes, plantsOf, quantile, toesOf, visible, type Contact, type Toe } from './contacts';
import { kneeAngle, shankAngle, sideNearest, trunkAngle } from './angles';
/** v2 (2026-10-04): angles from RTMPose when given (`refined`). */
export const CROUCH_VERSION = 'crouch-start-v2-experimental';
export const MAX_STEPS = 5;

export interface CrouchPoint { x: number; y: number; visibility?: number }
/** One frame: the athlete's 33 landmarks (normalized), or null when not found;
 * `refined`: the same athlete from RTMPose in MediaPipe's indices, used for the
 * angles (contacts stay on `pose`'s toes). */
export interface CrouchFrame { frame: number; pts: number; pose: CrouchPoint[] | null; refined?: CrouchPoint[] | null }
/** The pose the angles and pictures use. */
export const anglePose = (f: CrouchFrame) => f.refined ?? f.pose;
export type { Contact } from './contacts';
export interface CrouchOptions {
  /** Picture size, so distances are measured in pixels alike in both axes. */
  width: number; height: number;
}
/** Step i: contact i and the flight after it. Step time is touchdown to the
 * next touchdown (pitch its inverse); the last contact in the picture has its
 * contact time only. Motion only: nothing that needs a distance (the user,
 * 2026-10-03: 「距離が必要なものは無しにして動作解析に徹底する」). */
export interface StepResult {
  step: number;
  contactSeconds: number | null; flightSeconds: number | null; stepSeconds: number | null; pitch: number | null;
  /** At touchdown: shank (knee ahead of the ankle, +) and trunk (forward lean) angles from vertical, degrees. */
  shankAngle: number | null; trunkAngle: number | null;
  /** The pose model's side (0 left, 1 right landmarks) of the stance leg at touchdown, for the picture. */
  side: 0 | 1 | null;
}
/** Angles at one moment (medians over a few frames); `frame` is the frame shown
 * for it and `frontSide` the pose model's side of the front leg in that frame. */
export interface Posture { frame: number; pts: number; trunkAngle: number | null; frontKnee: number | null; rearKnee: number | null; frontSide: 0 | 1 | null }
export interface CrouchResult {
  version: string; reason: string | null; direction: number;
  set: Posture | null; blockClearance: Posture | null;
  blocks: { front: number; rear: number | null } | null;
  contacts: Contact[]; steps: StepResult[];
  /** Front block clearance to the first touchdown (s). */
  firstFlight: number | null;
  notes: string[];
}

/** The hip has moved off when it is this many leg lengths ahead of its set position. */
const ONSET_LEGS = .06;
/** The block zone reaches this far (leg lengths) beyond the set toes; a pushing
 * toe may be unseen for up to BLOCK_GAP s. */
const BLOCK_MARGIN = .15, BLOCK_GAP = .05, FRONT_BEHIND = .12, SET_SPAN = .2, SET_MIN = .1;
/** The front foot has left the block when its toe is this many leg lengths
 * ahead. Against the picture (3 athletes, 240 fps): 0.08 gave -5.8/+1.2/+2.0
 * frames, 0.10 -3.8/+2.2/+2.0, 0.12 -1.8/+4.2/+5.0. */
const FRONT_LEAVE = .10;

export function analyzeCrouchStart(frames: readonly CrouchFrame[], options: CrouchOptions): CrouchResult {
  const base: CrouchResult = { version: CROUCH_VERSION, reason: null, direction: 0, set: null, blockClearance: null, blocks: null,
    contacts: [], steps: [], firstFlight: null, notes: [] };
  const fail = (reason: string) => ({ ...base, reason });
  const { width: W, height: H } = options;
  const seen = frames.filter(f => f.pose);
  if (seen.length < 20) return fail('選手を十分に捉えられませんでした。真横から、全身が映るように撮影してください。');
  const px = (p: CrouchPoint) => ({ x: p.x * W, y: p.y * H });
  const hipOf = (pose: CrouchPoint[]) => visible(pose[23], .3) && visible(pose[24], .3) ? px({ x: (pose[23].x + pose[24].x) / 2, y: (pose[23].y + pose[24].y) / 2 }) : null;
  // Leg length (hip to ankle, pixels): the scale of every threshold.
  const leg = legLength(seen, W, H);
  if (!(leg > 0)) return fail('脚を十分に捉えられませんでした。');
  const hips = seen.flatMap(f => { const h = hipOf(f.pose!); return h ? [{ t: f.pts, frame: f.frame, ...h }] : []; });
  const direction = Math.sign(hips.at(-1)!.x - hips[0].x);
  if (!direction) return fail('走る向きを確認できませんでした。');
  base.direction = direction;

  // Movement onset: the first time the hip is ONSET_LEGS ahead of where it was at the start and stays ahead.
  const startHip = median(hips.slice(0, Math.max(3, Math.round(hips.length * .05))).map(h => h.x));
  const onsetIndex = hips.findIndex((h, i) => (h.x - startHip) * direction > ONSET_LEGS * leg
    && hips.slice(i, i + 10).every(q => (q.x - startHip) * direction > ONSET_LEGS * leg));
  if (onsetIndex < 0) return fail('走り出しを確認できませんでした。');
  const onset = hips[onsetIndex].t;
  // The set must be seen still before the movement (a video starting as the athlete
  // rose, with the front foot still on its block, was otherwise taken for a set).
  if (onset - hips[0].t < SET_MIN) return fail('スタートの構えを確認できませんでした。構えから映っている動画を使ってください。');

  // Toes of both sides, pooled.
  const toes = toesOf(seen, W, H), planted = plantedToes(toes, leg), real = plantsOf(planted, leg);

  // Blocks: where the toes were held in the set (the block zone). After the
  // movement starts the rear foot leaves it first; the front foot pushes on and
  // leaves last: the front block clearance. Told apart by time, not place: a
  // small athlete's two blocks were 0.3 leg lengths apart and the set toes
  // wandered as far (recorded).
  const held = planted.filter(o => o.t < onset);
  if (held.length < 4) return fail('スタートの構え（ブロック上の足）を確認できませんでした。構えから映っている動画を使ってください。');
  const along = (x: number) => x * direction;
  const zone = [quantile(held.map(o => along(o.x)), .05) - BLOCK_MARGIN * leg, quantile(held.map(o => along(o.x)), .95) + BLOCK_MARGIN * leg];
  const inZone = (o: Toe) => along(o.x) >= zone[0] && along(o.x) <= zone[1];
  // The front block: the forward-most held toes just after the movement starts.
  // The front foot leaves it when its toe is more than FRONT_LEAVE leg lengths
  // ahead (it starts the swing slowly, and was counted on the block until the
  // first contact while it moved less than a planted toe's radius per frame:
  // recorded). Toes behind it (the rear foot) do not count.
  const pushing = planted.filter(o => o.t >= onset && inZone(o)).sort((a, b) => a.t - b.t);
  const early = pushing.filter(o => o.t <= onset + .15);
  const frontAlong = early.length ? quantile(early.map(o => along(o.x)), .75) : zone[1];
  let clearance = onset;
  for (const o of toes.filter(q => q.t >= onset).sort((a, b) => a.t - b.t)) {
    const d = along(o.x) - frontAlong;
    if (d < -FRONT_BEHIND * leg || d > FRONT_LEAVE * leg) continue;
    if (o.t - clearance > BLOCK_GAP) break;
    clearance = o.t;
  }
  const frontToes = pushing.filter(o => o.t >= clearance - .05);
  const frontX = frontToes.length ? median(frontToes.map(o => o.x)) : direction > 0 ? zone[1] / direction : zone[0] / direction;
  const rearToes = held.filter(o => (frontX - o.x) * direction > .15 * leg);
  base.blocks = { front: frontX / W, rear: rearToes.length ? median(rearToes.map(o => o.x)) / W : null };
  const front = { x: frontX };

  // Contacts: places after the front foot left the blocks, ahead of it, in time order.
  const after = contactPlants(real.filter(p => p.from > clearance - PLANT_GAP && along(p.x) > zone[1] + .2 * leg), leg, direction, MAX_STEPS);
  const lastSeen = seen.at(-1)!.pts;
  base.contacts = after.map((p, i) => contactOf(p, i + 1, toes, leg, lastSeen));

  // Postures: medians over the set's last SET_SPAN s and the frames around the
  // clearance; one frame's pose error read a set trunk lean of 30° (others 103-106°).
  const setFrames = seen.filter(f => f.pts < onset && f.pts >= onset - SET_SPAN);
  const clearIndex = seen.findIndex(f => f.pts >= clearance);
  const clearFrames = clearIndex < 0 ? [] : seen.slice(Math.max(0, clearIndex - 2), clearIndex + 3);
  base.set = setFrames.length ? posture(setFrames, front.x / W, W, H, direction, leg) : null;
  base.blockClearance = clearFrames.length ? posture(clearFrames, front.x / W, W, H, direction, leg, seen[clearIndex]) : null;

  // Steps.
  const first = base.contacts[0];
  base.firstFlight = first?.touchdown != null ? first.touchdown - clearance : null;
  base.steps = stepsOf(base.contacts, frames, W, H, direction, leg);
  if (!base.contacts.length) base.notes.push('ブロックを離れた後の接地が映っていません。');
  const partial = base.contacts.filter(c => c.toeOff === null).map(c => c.index);
  if (partial.length) base.notes.push(`${partial.join('・')}歩目は離地が映っていないため、接地時間を出していません。`);
  return base;
}

/** The steps from the contacts: times between the touchdowns and toe-offs, and the angles at each touchdown (also used
 * when the user moves a judged moment, crouch-edit.ts). */
export function stepsOf(contacts: readonly Contact[], frames: readonly CrouchFrame[], W: number, H: number, direction: number, leg: number): StepResult[] {
  return contacts.map((c, i) => {
    const next = contacts[i + 1] ?? null;
    const contactSeconds = c.touchdown !== null && c.toeOff !== null ? c.toeOff - c.touchdown : null;
    const flightSeconds = next?.touchdown != null && c.toeOff !== null ? next.touchdown - c.toeOff : null;
    const stepSeconds = next?.touchdown != null && c.touchdown !== null ? next.touchdown - c.touchdown : null;
    const td = c.touchdownFrame !== null ? frames.find(f => f.frame === c.touchdownFrame) : null, at = td ? anglePose(td) : null;
    const side = at ? sideNearest(at, c.x / W, W) : null;
    return { step: c.index, contactSeconds, flightSeconds, stepSeconds, pitch: stepSeconds ? 1 / stepSeconds : null,
      shankAngle: at && side !== null ? shankAngle(at, side, W, H, direction) : null,
      trunkAngle: at ? trunkAngle(at, W, H, direction, leg) : null, side };
  });
}

/** Median angles over `frames`, each given only when at least half of the
 * frames yield it (a collapsed set pose left a few frames, all misread);
 * the front leg is the side whose toe is nearest the front block. The frame
 * shown is `at`, or else the frame whose angles are nearest the medians. */
export function posture(frames: CrouchFrame[], frontX: number, W: number, H: number, direction: number, leg: number, at?: CrouchFrame): Posture {
  const angles = (f: CrouchFrame) => {
    const pose = anglePose(f)!, side = sideNearest(pose, frontX, W);
    return { side, trunk: trunkAngle(pose, W, H, direction, leg), front: side === null ? null : kneeAngle(pose, side, W, H, leg),
      rear: side === null ? null : kneeAngle(pose, (1 - side) as 0 | 1, W, H, leg) };
  };
  const each = frames.map(angles);
  const values = (key: 'trunk' | 'front' | 'rear') => {
    const v = each.flatMap(a => a[key] === null ? [] : [a[key]!]);
    return v.length * 2 >= frames.length ? median(v) : null;
  };
  const trunk = values('trunk'), front = values('front'), rear = values('rear');
  const off = (a: ReturnType<typeof angles>) => ([[a.trunk, trunk], [a.front, front], [a.rear, rear]] as const)
    .reduce((sum, [v, m]) => m === null ? sum : v === null ? Infinity : sum + Math.abs(v - m), 0);
  const shown = at ?? frames[each.reduce((best, a, i) => off(a) < off(each[best]) ? i : best, each.length - 1)];
  return { frame: shown.frame, pts: shown.pts, trunkAngle: trunk, frontKnee: front, rearKnee: rear, frontSide: angles(shown).side };
}
