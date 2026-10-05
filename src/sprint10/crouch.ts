/** Crouch start, side view: the blocks, the front foot leaving them, and up to
 * five ground contacts after it, from the athlete's pose in every frame.
 *
 * A foot on the ground does not move: its toe stays at one place on the
 * ground. Contacts are found as such places (with the toes of both sides
 * pooled), so the left/right labels of the pose model, which swap when the
 * legs cross in a side view, are never needed. */
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
export interface CrouchOptions {
  /** Picture size, so distances are measured in pixels alike in both axes. */
  width: number; height: number;
}
export interface Contact {
  index: number; x: number; groundY: number;
  /** Touchdown and toe-off (s); null when not in the picture. */
  touchdown: number | null; toeOff: number | null;
  /** The frame of the touchdown (for the angles and the picture). */
  touchdownFrame: number | null;
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

const TOE = [31, 32] as const;
const visible = (p: CrouchPoint | undefined, min = .5) => !!p && Number.isFinite(p.x) && Number.isFinite(p.y) && (p.visibility ?? 1) >= min;
const median = (values: number[]) => { const a = [...values].sort((x, y) => x - y); return a.length ? a[a.length >> 1] : NaN; };
const quantile = (values: number[], q: number) => { const a = [...values].sort((x, y) => x - y); return a.length ? a[Math.min(a.length - 1, Math.floor(q * a.length))] : NaN; };

/** Planted toes: a toe is planted when, within ±PLANT_WINDOW s, some toe stays
 * within PLANT_RADIUS leg lengths of it. Plants are runs of planted toes at one
 * place (gaps up to PLANT_GAP s). */
const PLANT_WINDOW = .02, PLANT_RADIUS = .05, PLANT_JOIN = .1, PLANT_GAP = .03, PLANT_MIN = .03;
/** A ground contact after the blocks lasts at least this long (s): the swing
 * foot passing low, or a pose error as the legs cross, held one place for
 * 20-40 ms and was taken for a contact. Contacts of the first steps last
 * 0.12 s and more. Each contact is at least CONTACT_ADVANCE leg lengths ahead
 * of the previous one. */
const CONTACT_MIN = .06, CONTACT_ADVANCE = .4;
/** A contact's toe is searched within this many leg lengths of the place; it is
 * still below STILL_SPEED leg lengths/s. */
/** Touchdown: the toe within GROUND_BAND leg lengths of the plant's ground
 * level; toe-off: no longer within LIFT_BAND. On 9 contacts of 3 athletes (240
 * fps) against the picture, LIFT_BAND 0.03 put toe-off 2.3 frames early on
 * average (up to 5.8); 0.05 gave 0.0 (up to 3.3) and 0.06 2.1 late. */
const GROUND_BAND = .03, LIFT_BAND = .05;
/** The hip has moved off when it is this many leg lengths ahead of its set position. */
const ONSET_LEGS = .06;
/** The block zone reaches this far (leg lengths) beyond the set toes; a pushing
 * toe may be unseen for up to BLOCK_GAP s. */
const BLOCK_MARGIN = .15, BLOCK_GAP = .05, FRONT_BEHIND = .12, SET_SPAN = .2, TRUNK_MIN = .45, SEGMENT_MIN = .38, SET_MIN = .1;
/** The front foot has left the block when its toe is this many leg lengths
 * ahead. Against the picture (3 athletes, 240 fps): 0.08 gave -5.8/+1.2/+2.0
 * frames, 0.10 -3.8/+2.2/+2.0, 0.12 -1.8/+4.2/+5.0. */
const FRONT_LEAVE = .10;

interface Toe { t: number; frame: number; x: number; y: number }
interface Plant { x: number; y: number; from: number; to: number; toes: Toe[] }

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
  const legs = seen.flatMap(f => [[23, 27], [24, 28]].flatMap(([a, b]) => visible(f.pose![a]) && visible(f.pose![b])
    ? [Math.hypot((f.pose![a].x - f.pose![b].x) * W, (f.pose![a].y - f.pose![b].y) * H)] : []));
  const leg = quantile(legs, .9);
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
  const toes: Toe[] = seen.flatMap(f => TOE.filter(k => visible(f.pose![k])).map(k => ({ t: f.pts, frame: f.frame, ...px(f.pose![k]) })));
  const planted = toes.filter(o => toes.some(q => q !== o && Math.abs(q.t - o.t) <= PLANT_WINDOW && Math.abs(q.t - o.t) > 0
    && Math.hypot(q.x - o.x, q.y - o.y) < PLANT_RADIUS * leg));
  const plants: Plant[] = [];
  for (const o of planted) {
    const p = plants.find(c => Math.abs(c.x - o.x) < PLANT_JOIN * leg && o.t - c.to <= PLANT_GAP);
    if (p) { p.toes.push(o); p.to = Math.max(p.to, o.t); p.x = median(p.toes.map(q => q.x)); }
    else plants.push({ x: o.x, y: o.y, from: o.t, to: o.t, toes: [o] });
  }
  for (const p of plants) p.y = quantile(p.toes.map(q => q.y), .8);   // ground level: the lowest positions
  const real = plants.filter(p => p.to - p.from >= PLANT_MIN);

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
  const after: Plant[] = [];
  for (const p of mergeByPlace(real.filter(p => p.from > clearance - PLANT_GAP && along(p.x) > zone[1] + .2 * leg), leg)
    .filter(p => p.to - p.from >= CONTACT_MIN).sort((a, b) => a.from - b.from)) {
    const previous = after.at(-1);
    if (!previous || (p.x - previous.x) * direction > CONTACT_ADVANCE * leg) after.push(p);
    if (after.length === MAX_STEPS) break;
  }
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
  base.steps = base.contacts.map((c, i) => {
    const next = base.contacts[i + 1] ?? null;
    const contactSeconds = c.touchdown !== null && c.toeOff !== null ? c.toeOff - c.touchdown : null;
    const flightSeconds = next?.touchdown != null && c.toeOff !== null ? next.touchdown - c.toeOff : null;
    const stepSeconds = next?.touchdown != null && c.touchdown !== null ? next.touchdown - c.touchdown : null;
    const td = c.touchdownFrame !== null ? frames.find(f => f.frame === c.touchdownFrame) : null, at = td ? anglePose(td) : null;
    const side = at ? sideNearest(at, c.x / W, W) : null;
    return { step: c.index, contactSeconds, flightSeconds, stepSeconds, pitch: stepSeconds ? 1 / stepSeconds : null,
      shankAngle: at && side !== null ? shankAngle(at, side, W, H, direction) : null,
      trunkAngle: at ? trunkAngle(at, W, H, direction, leg) : null, side };
  });
  if (!base.contacts.length) base.notes.push('ブロックを離れた後の接地が映っていません。');
  const partial = base.contacts.filter(c => c.toeOff === null).map(c => c.index);
  if (partial.length) base.notes.push(`${partial.join('・')}歩目は離地が映っていないため、接地時間を出していません。`);
  return base;
}

/** Plants at one place (within PLANT_JOIN leg lengths) are one. */
function mergeByPlace(plants: Plant[], leg: number): Plant[] {
  const out: Plant[] = [];
  for (const p of [...plants].sort((a, b) => a.from - b.from)) {
    const same = out.find(o => Math.abs(o.x - p.x) < PLANT_JOIN * leg);
    if (same) { same.toes.push(...p.toes); same.from = Math.min(same.from, p.from); same.to = Math.max(same.to, p.to);
      same.x = median(same.toes.map(q => q.x)); same.y = quantile(same.toes.map(q => q.y), .8); }
    else out.push({ ...p, toes: [...p.toes] });
  }
  return out;
}

/** Touchdown: the first toe at the place within GROUND_BAND leg lengths of its
 * ground level; toe-off: the last within LIFT_BAND. The toe point rises from the
 * ground level before the shoe leaves it, as the foot rotates over its tip: the
 * last toe within GROUND_BAND was 1-6 frames (240 fps) before the picture showed
 * the shoe leave (recorded). A contact cut by the end of the video has no toe-off. */
function contactOf(p: Plant, index: number, toes: Toe[], leg: number, lastSeen: number): Contact {
  const near = toes.filter(q => Math.abs(q.x - p.x) < PLANT_RADIUS * 2 * leg && q.t >= p.from - .1 && q.t <= p.to + .1)
    .sort((a, b) => a.t - b.t);
  const first = near.find(q => p.y - q.y < GROUND_BAND * leg) ?? null;
  const last = [...near].reverse().find(q => p.y - q.y < LIFT_BAND * leg) ?? null;
  const cut = last === null || lastSeen - last.t < .02;
  return { index, x: p.x, groundY: p.y, touchdown: first?.t ?? null, touchdownFrame: first?.frame ?? null, toeOff: cut ? null : last.t };
}

/** The landmark side (0 left, 1 right) whose toe is nearest normalized x. */
function sideNearest(pose: CrouchPoint[], x: number, W: number): 0 | 1 | null {
  const d = TOE.map(k => visible(pose[k], .3) ? Math.abs(pose[k].x - x) * W : Infinity);
  return d[0] === Infinity && d[1] === Infinity ? null : d[0] <= d[1] ? 0 : 1;
}
const degrees = (r: number) => r * 180 / Math.PI;
/** Forward lean of the trunk (hip to shoulder) from vertical, degrees; null
 * when the trunk is shorter than TRUNK_MIN leg lengths (0.6-0.77 in two
 * athletes' frames; a small athlete's crouched set pose collapsed hips onto
 * shoulders, 0.01-0.37, and read a lean of 28° in a near-horizontal set). */
function trunkAngle(pose: CrouchPoint[], W: number, H: number, direction: number, leg: number): number | null {
  if (![11, 12, 23, 24].every(k => visible(pose[k], .3))) return null;
  const sx = (pose[11].x + pose[12].x) / 2 * W, sy = (pose[11].y + pose[12].y) / 2 * H;
  const hx = (pose[23].x + pose[24].x) / 2 * W, hy = (pose[23].y + pose[24].y) / 2 * H;
  if (Math.hypot(sx - hx, sy - hy) < TRUNK_MIN * leg) return null;
  return degrees(Math.atan2((sx - hx) * direction, hy - sy));
}
/** Shank (ankle to knee) from vertical, knee ahead of the ankle positive, degrees. */
function shankAngle(pose: CrouchPoint[], side: 0 | 1, W: number, H: number, direction: number): number | null {
  const knee = pose[25 + side], ankle = pose[27 + side];
  if (!visible(knee, .3) || !visible(ankle, .3)) return null;
  return degrees(Math.atan2((knee.x - ankle.x) * W * direction, (ankle.y - knee.y) * H));
}
/** Knee angle (hip-knee-ankle), 180 = straight; null when the thigh or the
 * shank is shorter than SEGMENT_MIN leg lengths (0.49-0.54 in two athletes'
 * set poses; 0.26-0.29 in a collapsed one). */
function kneeAngle(pose: CrouchPoint[], side: 0 | 1, W: number, H: number, leg: number): number | null {
  const [h, k, a] = [pose[23 + side], pose[25 + side], pose[27 + side]];
  if (![h, k, a].every(p => visible(p, .3))) return null;
  const v1 = { x: (h.x - k.x) * W, y: (h.y - k.y) * H }, v2 = { x: (a.x - k.x) * W, y: (a.y - k.y) * H };
  if (Math.hypot(v1.x, v1.y) < SEGMENT_MIN * leg || Math.hypot(v2.x, v2.y) < SEGMENT_MIN * leg) return null;
  const c = (v1.x * v2.x + v1.y * v2.y) / (Math.hypot(v1.x, v1.y) * Math.hypot(v2.x, v2.y));
  return degrees(Math.acos(Math.max(-1, Math.min(1, c))));
}
/** Median angles over `frames`, each given only when at least half of the
 * frames yield it (a collapsed set pose left a few frames, all misread);
 * the front leg is the side whose toe is nearest the front block. The frame
 * shown is `at`, or else the frame whose angles are nearest the medians. */
function posture(frames: CrouchFrame[], frontX: number, W: number, H: number, direction: number, leg: number, at?: CrouchFrame): Posture {
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
