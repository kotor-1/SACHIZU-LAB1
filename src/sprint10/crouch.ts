/** Crouch start, side view: the blocks, the front foot leaving them, and up to
 * five ground contacts after it, from the athlete's pose in every frame.
 *
 * A foot on the ground does not move: its toe stays at one place on the
 * ground. Contacts are found as such places (with the toes of both sides
 * pooled), so the left/right labels of the pose model, which swap when the
 * legs cross in a side view, are never needed. */
import { contactOf, contactPlants, legLength, median, PLANT_GAP, plantedToes, plantsOf, quantile, TOE, toesOf, visible, type Contact, type Toe } from './contacts';
import { kneeAngle, shankAngle, sideNearest, thighAngle, trunkAngle } from './angles';
/** v2 (2026-10-04): angles from RTMPose when given (`refined`). */
export const CROUCH_VERSION = 'crouch-start-v2.1-experimental';
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
  /** The thighs' separation (degrees) at touchdown and at toe-off: the swing thigh's angle less the stance thigh's (each
   * from hanging straight down, forward +), so + is the swing knee ahead of the stance knee: the 「挟み込み」 coaches look
   * at (the user, 2026-10-10: 「一歩目の着地時に挟み込めてない」). World-class men: −70 ± 15° at the first touchdown, +102 ± 7°
   * at its toe-off, the latter tied to the first step's push (Walker et al. 2021, crouch-research.ts). */
  thighGapTouchdown: number | null; thighGapToeOff: number | null;
  /** The trunk's lean at toe-off (from vertical, as trunkAngle); with the separation, the toe-off values tied to the
   * first step's push in the same study. The toe-off values are the first step's only: the studies give no others, and
   * RTMPose looks only at the frames whose angles are used (refineTargets). */
  trunkToeOff: number | null;
  /** The pose model's side of the stance leg at that toe-off (for the picture of the thighs). */
  sideToeOff: 0 | 1 | null;
}
/** Angles at one moment (medians over a few frames); `frame` is the frame shown
 * for it and `frontSide` the pose model's side of the front leg in that frame. */
export interface Posture { frame: number; pts: number; trunkAngle: number | null; frontKnee: number | null; rearKnee: number | null; frontSide: 0 | 1 | null }
export interface CrouchResult {
  version: string; reason: string | null; direction: number;
  set: Posture | null; blockClearance: Posture | null;
  /** The hips' first movement out of the set (s): the push's start, for the block's force (ground-force.ts). */
  moveStart?: number | null;
  blocks: { front: number; rear: number | null } | null;
  contacts: Contact[]; steps: StepResult[];
  /** Front block clearance to the first touchdown (s). */
  firstFlight: number | null;
  notes: string[];
}

/** The hip has moved off when it is this many leg lengths ahead of its set position. */
const ONSET_LEGS = .06;
/** The hips' first movement: the set's spread from the hips before MOVE_QUIET s ahead of the onset, at least MOVE_FLOOR
 * leg lengths (about 1 cm). */
const MOVE_QUIET = .15, MOVE_FLOOR = .012;
/** The block zone reaches this far (leg lengths) beyond the set toes; a pushing
 * toe may be unseen for up to BLOCK_GAP s. */
const BLOCK_MARGIN = .15, BLOCK_GAP = .05, FRONT_BEHIND = .12, SET_MIN = .1;
export const SET_SPAN = .2;
/** A video may begin long before the set (the athlete walking in and setting the blocks, or someone seen for a
 * moment and lost: the user's 13 s video stopped with 「選手を十分に捉えられませんでした」, 2026-10-06). The set is looked
 * for after the last disturbance before the run: a gap of over GAP_BEFORE s in the followed hips, or the hip moving
 * over MOVE_LEGS leg lengths within MOVE_SECONDS (walking). The run: the hip RUN_LEGS ahead within RUN_SECONDS (a
 * walk does not reach it). The disturbances are looked for only before the last still STILL_SECONDS (the hip within
 * STILL_LEGS) before the run. Without a run in the picture, or none of these, the whole video as before. */
const GAP_BEFORE = .5, MOVE_LEGS = .3, MOVE_SECONDS = .3, RUN_LEGS = 2, RUN_SECONDS = .8, STILL_SECONDS = .2, STILL_LEGS = .1;
/** The front foot has left the block when its toe is this many leg lengths
 * ahead. Against the picture (3 athletes, 240 fps): 0.08 gave -5.8/+1.2/+2.0
 * frames, 0.10 -3.8/+2.2/+2.0, 0.12 -1.8/+4.2/+5.0. */
const FRONT_LEAVE = .10;
/** The clearance search (exported for the study scripts, as crouch-pixels' PIXEL_SETTINGS): the toe score counted,
 * the time a front toe may go unseen (s), and whether frames without the athlete's pose count as unseen. */
export const CLEARANCE_SETTINGS = { score: .5, gap: BLOCK_GAP, poseGaps: 0, refined: 0, leave: FRONT_LEAVE };

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

  // Movement onset: the first time the hip is ONSET_LEGS ahead of where it was at the start and stays ahead; the
  // start is the set's (see GAP_BEFORE), the video's first hips when it begins in the set.
  const from = setFrom(hips, leg, direction), rest = hips.slice(from);
  const startHip = median(rest.slice(0, Math.max(3, Math.round((from ? rest.length : hips.length) * .05))).map(h => h.x));
  const onsetIndex = rest.findIndex((h, i) => (h.x - startHip) * direction > ONSET_LEGS * leg
    && rest.slice(i, i + 10).every(q => (q.x - startHip) * direction > ONSET_LEGS * leg));
  if (onsetIndex < 0) return fail('走り出しを確認できませんでした。');
  const onset = rest[onsetIndex].t, setFirst = from ? rest[0].t : -Infinity;
  // The set must be seen still before the movement (a video starting as the athlete
  // rose, with the front foot still on its block, was otherwise taken for a set).
  if (onset - rest[0].t < SET_MIN) return fail('スタートの構えを確認できませんでした。構えから映っている動画を使ってください。');
  // The hips' first movement: the onset above waits for them to be ONSET_LEGS ahead (about 0.1 s into the push, the
  // block's force then wrongly over a shorter push). The last moment before it within the set's own spread of the start:
  // three times the median deviation of the set's hips (up to MOVE_QUIET s before the onset), at least MOVE_FLOOR legs.
  const quiet = rest.slice(0, onsetIndex).filter(h => h.t <= onset - MOVE_QUIET).map(h => Math.abs(h.x - startHip)).sort((a, b) => a - b);
  const band = Math.max(MOVE_FLOOR * leg, 3 * (quiet[quiet.length >> 1] ?? 0));
  let moved = onsetIndex;
  while (moved > 0 && (rest[moved - 1].x - startHip) * direction > band) moved--;
  base.moveStart = rest[Math.max(0, moved - 1)].t;

  // Toes of both sides, pooled.
  const toes = toesOf(seen, W, H), planted = plantedToes(toes, leg), real = plantsOf(planted, leg);

  // Blocks: where the toes were held in the set (the block zone). After the
  // movement starts the rear foot leaves it first; the front foot pushes on and
  // leaves last: the front block clearance. Told apart by time, not place: a
  // small athlete's two blocks were 0.3 leg lengths apart and the set toes
  // wandered as far (recorded).
  const held = planted.filter(o => o.t >= setFirst && o.t < onset);
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
  const C = CLEARANCE_SETTINGS, seenPts = seen.map(f => f.pts);
  const pointsOf = (f: CrouchFrame) => C.refined && f.refined ? f.refined : f.pose!;
  const searched = C.score === .5 && !C.refined ? toes : seen.flatMap(f => TOE.filter(k => visible(pointsOf(f)[k], C.score)).map(k => ({ t: f.pts, frame: f.frame, x: pointsOf(f)[k].x * W, y: pointsOf(f)[k].y * H })));
  // the time unseen: with C.poseGaps, frames without the athlete's pose do not count
  const unseen = (from: number, to: number) => !C.poseGaps ? to - from : seenPts.filter(t => t > from && t < to).length * interval;
  const interval = median(seen.slice(1).map((f, i) => f.pts - seen[i].pts).filter(v => v > 0)) || 1 / 240;
  for (const o of searched.filter(q => q.t >= onset).sort((a, b) => a.t - b.t)) {
    const d = along(o.x) - frontAlong;
    if (d < -FRONT_BEHIND * leg || d > C.leave * leg) continue;
    if (unseen(clearance, o.t) > C.gap) break;
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

/** Index of the first hip from which the hip gets RUN_LEGS ahead within RUN_SECONDS (the run); -1 without. */
function runIndex(hips: { t: number; x: number }[], leg: number, direction: number): number {
  for (let i = 0; i < hips.length; i++)
    for (let k = i + 1; k < hips.length && hips[k].t - hips[i].t <= RUN_SECONDS; k++)
      if ((hips[k].x - hips[i].x) * direction >= RUN_LEGS * leg) return i;
  return -1;
}
/** When the run out of the blocks begins (s), from poses at any rate (the quick look at 30 frames a second, see
 * `measureCrouchStart`); null when no run is in the picture. */
export function runStart(frames: readonly CrouchFrame[], W: number, H: number): number | null {
  const seen = frames.filter(f => f.pose), leg = legLength(seen, W, H);
  const hips = seen.flatMap(f => { const p = f.pose!; return visible(p[23], .3) && visible(p[24], .3) ? [{ t: f.pts, x: (p[23].x + p[24].x) / 2 * W }] : []; });
  if (hips.length < 2 || !(leg > 0)) return null;
  const direction = Math.sign(hips.at(-1)!.x - hips[0].x), i = direction ? runIndex(hips, leg, direction) : -1;
  return i < 0 ? null : hips[i].t;
}

/** Index in `hips` where the set is looked for (see GAP_BEFORE); 0 for a video beginning in the set. */
function setFrom(hips: { t: number; x: number }[], leg: number, direction: number): number {
  const run = runIndex(hips, leg, direction);
  if (run < 0) return 0;
  // the last still stretch before it
  let still = -1;
  for (let e = run; e >= 0 && still < 0; e--) {
    const win = hips.filter(h => h.t <= hips[e].t && h.t >= hips[e].t - STILL_SECONDS);
    const xs = win.map(h => h.x);
    if (win.length >= 3 && win.at(-1)!.t - win[0].t >= STILL_SECONDS / 2 && Math.max(...xs) - Math.min(...xs) < STILL_LEGS * leg)
      still = hips.indexOf(win[0]);
  }
  if (still < 0) return 0;
  // the last disturbance before it: a gap, or a walk
  let from = 0;
  for (let j = 1, k = 0; j <= still; j++) {
    if (hips[j].t - hips[j - 1].t > GAP_BEFORE) from = j;
    while (hips[j].t - hips[k].t > MOVE_SECONDS) k++;
    for (let m = k; m < j; m++) if (Math.abs(hips[j].x - hips[m].x) > MOVE_LEGS * leg) { from = j + 1; break; }
  }
  return Math.min(from, still);
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
    const toe = i === 0 && c.toeOffFrame != null ? frames.find(f => f.frame === c.toeOffFrame) : null, off = toe ? anglePose(toe) : null;
    // The stance leg in a frame is the side whose toe is at the contact's place (the model's labels swap side-on).
    const stanceOf = (pose: CrouchPoint[] | null) => pose ? sideNearest(pose, c.x / W, W) : null;
    const gapOf = (pose: CrouchPoint[] | null) => {
      const stance = stanceOf(pose);
      if (!pose || stance === null) return null;
      const stand = thighAngle(pose, stance, W, H, direction, leg), swing = thighAngle(pose, (1 - stance) as 0 | 1, W, H, direction, leg);
      return stand === null || swing === null ? null : swing - stand;
    };
    return { step: c.index, contactSeconds, flightSeconds, stepSeconds, pitch: stepSeconds ? 1 / stepSeconds : null,
      shankAngle: at && side !== null ? shankAngle(at, side, W, H, direction) : null,
      trunkAngle: at ? trunkAngle(at, W, H, direction, leg) : null, side,
      thighGapTouchdown: gapOf(at), thighGapToeOff: gapOf(off), trunkToeOff: off ? trunkAngle(off, W, H, direction, leg) : null, sideToeOff: stanceOf(off) };
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
