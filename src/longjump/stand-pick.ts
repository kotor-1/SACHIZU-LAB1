/** The long jump filmed from the stands at a competition (the user, 2026-10-18: 「試合でスタンドから走り幅跳びの動画を
 * 撮影して最低限の角度や接地時間を短時間で解析してアドバイスしたい…項目を絞りつつ精度も完璧ではなくてもなんとなく取れれば
 * 目安になる」, then 「一度試してみよう。作ってくれる？」). The athlete is small among others and the camera may follow
 * them, so nothing is followed through the video: the user taps the athlete near the board, then sets the takeoff's
 * touchdown and toe-off and the two steps before, as the crouch start's light mode (sprint10/crouch-pick.ts), each frame
 * after the first guessed. The pose models look only at those frames, round where the athlete should be
 * (crouch-pick-poses.ts lookNear). The values are the analysis' (analysis.ts) that need neither a scale nor a camera held
 * still: the contact and flight times, the last two steps' rhythm, the leg's angle, the trunk and the knee at the takeoff
 * touchdown. */
import { kneeAngle, stanceSide, trunkAngle } from '../sprint10/angles';
import { median, TOE, visible } from '../sprint10/contacts';
import { anglePose, frameEdge, type CrouchFrame, type CrouchPoint } from '../sprint10/crouch';
import { frameAtEdge, pickLeg, type PickEffect } from '../sprint10/crouch-pick';
import type { NearHint } from '../sprint10/crouch-pick-poses';
import { LONG_JUMP_VERSION, momentsOf, type LongJumpResult } from './analysis';

export const STAND_VERSION = `${LONG_JUMP_VERSION}+stands-picked-v0`;
export type StandKind = 'touchdown' | 'toeOff';
/** A moment: `before` 0 the takeoff, 1 the step before it, 2 the one before. */
export interface StandStep { key: string; kind: StandKind; before: number; label: string; short: string }
/** The moments in the order they are set: the takeoff first (the board tells where and when), then back step by step. */
export const STAND_STEPS: readonly StandStep[] = [
  { key: 'td0', kind: 'touchdown', before: 0, label: '踏切の接地', short: '踏切接地' },
  { key: 'to0', kind: 'toeOff', before: 0, label: '踏切の離地', short: '踏切離地' },
  { key: 'to1', kind: 'toeOff', before: 1, label: '1歩前の離地', short: '1歩前離地' },
  { key: 'td1', kind: 'touchdown', before: 1, label: '1歩前の接地', short: '1歩前接地' },
  { key: 'to2', kind: 'toeOff', before: 2, label: '2歩前の離地', short: '2歩前離地' },
  { key: 'td2', kind: 'touchdown', before: 2, label: '2歩前の接地', short: '2歩前接地' },
];
export type Picks = Readonly<Record<string, number>>;
export const standStepOf = (key: string) => STAND_STEPS.find(s => s.key === key) ?? null;
/** The moment to set next: the first in order not set; null once all are. */
export const nextStand = (picks: Picks): StandStep | null => STAND_STEPS.find(s => picks[s.key] === undefined) ?? null;
/** The moments set, in order (up to the first not set). */
export function standSteps(picks: Picks): StandStep[] {
  const out: StandStep[] = [];
  for (const s of STAND_STEPS) { if (picks[s.key] === undefined) break; out.push(s); }
  return out;
}
/** Enough for a result: the takeoff's touchdown and toe-off (its contact time; the leg at the touchdown). */
export const standEnough = (picks: Picks) => picks.td0 !== undefined && picks.to0 !== undefined;

/** The times the next moment is guessed from (s): the takeoff's contact, the last step's flight and contact, the flight and
 * contact of the step before. The four test videos (すずね, 240 fps, the analysis' moments): the takeoff 0.146-0.154 s on
 * the ground, the last step 0.104-0.121 s on the ground and 0.084-0.100 s in the air, the step before 0.137-0.142 s and
 * 0.113-0.138 s (docs/LongJump_MainMeasures_Research_20261006.md); the 2018 world indoor final (women): the last three
 * contacts 0.105-0.122 s, flights 0.075-0.136 s; women of 5.50 m on average 0.133 s at the takeoff (Nemtsev et al. 2016). */
export const STAND_GUESS = { takeoff: .145, lastFlight: .09, lastContact: .115, flight2: .12, contact2: .135 };
/** Times out of these ranges (s) are said at the moments' buttons (as the check's, crouch-edit.ts): the same sources. */
export const STAND_USUAL = { takeoff: [.09, .2], contact: [.07, .2], flight: [.04, .2] } as const;
const sideOf = (kind: StandKind): -1 | 1 => kind === 'touchdown' ? -1 : 1;
/** A moment's time at its frame's edge (crouch.ts frameEdge): a touchdown before its first frame with the foot down, a
 * toe-off after the last. */
export function standTime(key: string, picks: Picks, frames: readonly CrouchFrame[]): number | null {
  const s = standStepOf(key), frame = picks[key];
  return s && frame !== undefined ? frameEdge(frames, frame, sideOf(s.kind)) : null;
}
/** The frame a moment is guessed at from the moments set before it; null for the takeoff's touchdown (found by the user)
 * and for a moment before the video's start. */
export function standGuess(key: string, picks: Picks, frames: readonly CrouchFrame[]): number | null {
  const s = standStepOf(key), at = (k: string) => standTime(k, picks, frames), G = STAND_GUESS;
  const from = (k: string, by: number) => { const t = at(k); return t === null ? null : t + by; };
  const t = key === 'to0' ? from('td0', G.takeoff) : key === 'to1' ? from('td0', -G.lastFlight) : key === 'td1' ? from('to1', -G.lastContact)
    : key === 'to2' ? from('td1', -G.flight2) : key === 'td2' ? from('to2', -G.contact2) : null;
  return t === null || !s ? null : frameAtEdge(frames, t, sideOf(s.kind));
}
/** The frames the pose models look at: each moment's own. */
export const standFrames = (picks: Picks) => [...new Set(STAND_STEPS.flatMap(s => picks[s.key] === undefined ? [] : [picks[s.key]]))];

type Px = { x: number; y: number };
/** What the poses found so far tell (pixels): the leg length, the running direction, the athlete's height in the picture
 * (picture heights), the hips at each frame found (the tap's too), and the foot set down at each moment set. */
export interface StandLayout { leg: number; direction: number; size: number | null; hips: { t: number; x: number; y: number }[]; places: Map<string, Px> }
const BODY = [0, 11, 12, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32];
const toesOf = (p: readonly CrouchPoint[], W: number, H: number): Px[] => TOE.map(k => p[k]).filter(q => visible(q, .3)).map(q => ({ x: q.x * W, y: q.y * H }));
/** The direction: each foot seen points the way it runs (heel to toe), and the hips go that way unless the camera
 * follows them. The feet first: a camera that follows the athlete leaves the hips nearly still in the picture. */
export function standLayout(picks: Picks, frames: readonly CrouchFrame[], W: number, H: number): StandLayout {
  const seen = frames.filter(f => anglePose(f));
  const leg = pickLeg(seen.map(f => ({ ...f, pose: anglePose(f) })), W, H);
  let feet = 0;
  for (const f of seen) {
    const p = anglePose(f)!;
    for (const s of [0, 1] as const) if (visible(p[31 + s], .3) && visible(p[29 + s], .3) && Math.abs(p[31 + s].x - p[29 + s].x) * W > .05 * (leg || 0)) feet += Math.sign(p[31 + s].x - p[29 + s].x);
  }
  const hips = seen.flatMap(f => { const p = anglePose(f)!; return visible(p[23], .3) && visible(p[24], .3) ? [{ t: f.pts, x: (p[23].x + p[24].x) / 2 * W, y: (p[23].y + p[24].y) / 2 * H }] : []; })
    .sort((a, b) => a.t - b.t);
  const moved = hips.length > 1 ? hips.at(-1)!.x - hips[0].x : 0;
  const direction = Math.abs(feet) >= 2 ? Math.sign(feet) : leg > 0 && Math.abs(moved) > .5 * leg ? Math.sign(moved) : Math.sign(feet);
  const tall = seen.flatMap(f => { const ys = BODY.map(k => anglePose(f)![k]).filter(q => visible(q, .3)).map(q => q.y); return ys.length >= 6 ? [Math.max(...ys) - Math.min(...ys)] : []; });
  const places = new Map<string, Px>();
  const byFrame = new Map(frames.map(f => [f.frame, f]));
  if (direction) for (const s of STAND_STEPS) {
    const f = picks[s.key] === undefined ? undefined : byFrame.get(picks[s.key]), p = f ? anglePose(f) : null;
    const toes = p ? toesOf(p, W, H) : [];
    if (!toes.length) continue;
    // At a touchdown the landing foot is ahead of the other; at a toe-off the pushing foot is behind.
    const pick = s.kind === 'touchdown' ? toes.reduce((a, b) => (b.x - a.x) * direction > 0 ? b : a) : toes.reduce((a, b) => (b.x - a.x) * direction < 0 ? b : a);
    places.set(s.key, pick);
  }
  return { leg, direction, size: tall.length ? median(tall) : null, hips, places };
}

/** The athlete's speed across the picture while not known from two frames: about 8 m/s for a 1.75 m athlete over the last
 * steps, in athlete heights per second (a camera following the athlete makes it less; the window is widened by it). */
export const RUN_HEIGHTS = 4.5;
/** Where the athlete should be at time `t`, for the window the pose models look in (crouch-pick-poses.ts lookNear): the
 * hips of the nearest frames found, moved on at their speed (two frames 0.03 s or more apart), else at the usual speed
 * with the window widened; the tap before anything is found. The longer from a frame found, the wider. */
export function standHint(t: number, layout: StandLayout, tap: Px | null, W: number, H: number): NearHint | null {
  const { hips, size, direction } = layout;
  if (!hips.length) return tap ? { x: tap.x, y: tap.y, size: null } : null;
  const near = [...hips].sort((a, b) => Math.abs(a.t - t) - Math.abs(b.t - t)), a = near[0], b = near.find(q => Math.abs(q.t - a.t) >= .03);
  const gap = Math.abs(t - a.t), tall = size ?? .2;
  let x = a.x, y = a.y, spread = tall * Math.min(1, 2 * gap);
  if (b) { x = a.x + (b.x - a.x) / (b.t - a.t) * (t - a.t); y = a.y + (b.y - a.y) / (b.t - a.t) * (t - a.t); }
  else if (direction) { const run = RUN_HEIGHTS * tall * H * (t - a.t) * direction; x = a.x + run / 2; spread += Math.abs(run) / 2 / H; }
  return { x: Math.max(0, Math.min(1, x / W)), y: Math.max(0, Math.min(1, y / H)), size, spread };
}
/** Where the view is enlarged for a moment (normalized) and the ground's level there: the foot found at the moment; for the
 * takeoff, its foot on the board (or the tapped athlete's lowest foot); for the steps before, the foot where the hips
 * should be (ahead of them at a touchdown, behind at a toe-off; the test videos: 0.2-0.5 and 0.5-0.8 leg lengths). */
export function standFocus(key: string, t: number, layout: StandLayout, tapFoot: Px | null, W: number, H: number): { focus: Px | null; ground: number | null } {
  const s = standStepOf(key), { leg, direction, places } = layout;
  if (!s) return { focus: null, ground: null };
  const known = places.get(key);
  if (known) return { focus: { x: known.x / W, y: known.y / H }, ground: known.y / H };
  const board = places.get('td0') ?? places.get('to0') ?? tapFoot;
  if (s.before === 0) return board ? { focus: { x: board.x / W, y: board.y / H }, ground: board.y / H } : { focus: null, ground: null };
  const hips = standHint(t, layout, null, W, H);
  if (!hips || !(leg > 0) || !direction) return { focus: null, ground: null };
  const x = hips.x * W + direction * (s.kind === 'touchdown' ? .35 : -.65) * leg, y = board?.y ?? hips.y * H + leg;
  return { focus: { x: x / W, y: y / H }, ground: null };
}

/** The result from the moments set and the poses found at them (`frames`: every frame of the video in time order, the poses
 * where the models looked, the feet mended as the analysis' are). As analysis.ts measures it, without the speeds. */
export function standResult(picks: Picks, frames: readonly CrouchFrame[], W: number, H: number,
  /** Frames the models have not looked at yet: their angles wait, nothing is said to be missing there. */
  pending: ReadonlySet<number> = new Set()): LongJumpResult {
  const base: LongJumpResult = { version: STAND_VERSION, reason: null, direction: 0, contacts: [], takeoff: null, steps: [], takeoffContact: null,
    speed: { lastTwoPx: null, touchdownPx: null }, rhythm: null, leave: null, posture: { legAngle: null, trunk: null, knee: null, trunkPenult: null },
    scale: null, moments: [], notes: [] };
  const fail = (reason: string): LongJumpResult => ({ ...base, reason });
  if (!standEnough(picks)) return fail('踏切の接地と離地のコマを選んでください。');
  const byFrame = new Map(frames.map(f => [f.frame, f])), td = byFrame.get(picks.td0), pose = td ? anglePose(td) : null;
  if (!pose) return fail(pending.has(picks.td0) ? '踏切の接地のコマの骨格を調べています。' : '踏切の接地のコマで選手を見つけられませんでした。「確認」で選手をタップし直すか、コマを選び直してください。');
  const layout = standLayout(picks, frames, W, H), { leg, direction } = layout;
  if (!(leg > 0)) return fail('脚を十分に捉えられませんでした。');
  if (!direction) return fail('走る向きを確認できませんでした。');
  base.direction = direction;
  // The contacts in time order (two steps before, the step before, the takeoff), those with a moment set.
  const board = layout.places.get('td0') ?? layout.places.get('to0') ?? lowestFoot(pose, W, H);
  if (!board) return fail('踏切の接地のコマで足を捉えられませんでした。足が映っているコマを選び直してください。');
  for (const n of [2, 1, 0]) {
    const tdF = picks[`td${n}`], toF = picks[`to${n}`];
    if (tdF === undefined && toF === undefined) continue;
    const place = layout.places.get(`td${n}`) ?? layout.places.get(`to${n}`) ?? board;
    base.contacts.push({ index: base.contacts.length + 1, x: place.x, groundY: place.y,
      touchdown: tdF === undefined ? null : frameEdge(frames, tdF, -1), touchdownFrame: tdF ?? null,
      toeOff: toF === undefined ? null : frameEdge(frames, toF, 1), toeOffFrame: toF ?? null });
  }
  const C = base.contacts, take = C.length - 1, T0 = C[take];
  base.takeoff = take;
  base.takeoffContact = T0.touchdown !== null && T0.toeOff !== null ? T0.toeOff - T0.touchdown : null;
  const span = (a: number | null | undefined, b: number | null | undefined) => a != null && b != null ? b - a : null;
  for (let k = 1; k <= 2 && take - k >= 0; k++) {
    const c = C[take - k], next = C[take - k + 1];
    base.steps.push({ before: k, contact: span(c.touchdown, c.toeOff), flight: span(c.toeOff, next.touchdown), stepTime: span(c.touchdown, next.touchdown), speedPx: null });
  }
  const [s1, s2] = base.steps;
  base.rhythm = s1?.stepTime != null && s2?.stepTime != null ? s1.stepTime / s2.stepTime : null;
  // The posture at the takeoff touchdown, the stance leg by the foot's place (as analysis.ts).
  const s = stanceSide(pose, T0.x / W, T0.groundY / H, W, H);
  if (s !== null && visible(pose[23 + s], .3) && visible(pose[27 + s], .3))
    base.posture.legAngle = Math.atan2((pose[27 + s].y - pose[23 + s].y) * H, (pose[27 + s].x - pose[23 + s].x) * W * direction) * 180 / Math.PI;
  base.posture.trunk = trunkAngle(pose, W, H, direction, leg);
  base.posture.knee = s === null ? null : kneeAngle(pose, s, W, H, leg);
  const pen = picks.td1 === undefined ? undefined : byFrame.get(picks.td1), penPose = pen ? anglePose(pen) : null;
  if (penPose) base.posture.trunkPenult = trunkAngle(penPose, W, H, direction, leg);
  base.moments = momentsOf(base, frames, W, H, direction, leg);
  const found = (k: string) => { const f = byFrame.get(picks[k]); return !!f && !!anglePose(f); };
  const lost = STAND_STEPS.filter(st => st.kind === 'touchdown' && picks[st.key] !== undefined && !found(st.key) && !pending.has(picks[st.key])).map(st => st.label);
  if (lost.length) base.notes.push(`${lost.join('・')}のコマでは選手を見つけられなかったため、そこの角度は出していません。`);
  if (!s1) base.notes.push('1歩前を選んでいないため、最後の2歩のリズムは出していません。続けて選ぶと出ます。');
  return base;
}

/** Times out of the usual range, said at both their ends. */
export function standFlags(picks: Picks, frames: readonly CrouchFrame[]): Map<string, string> {
  const out = new Map<string, string>(), sec = (v: number) => `${v.toFixed(3)}秒`;
  const span = (a: string, b: string) => { const x = standTime(a, picks, frames), y = standTime(b, picks, frames); return x === null || y === null ? null : y - x; };
  const check = (a: string, b: string, [lo, hi]: readonly [number, number], what: string) => {
    const v = span(a, b);
    if (v !== null && (v < lo || v > hi)) for (const k of [a, b]) if (!out.has(k)) out.set(k, `${what} ${sec(v)}：ふつうは${lo}〜${hi}秒です。`);
  };
  check('td0', 'to0', STAND_USUAL.takeoff, '踏切の接地時間');
  check('to1', 'td0', STAND_USUAL.flight, '1歩前の後の空中');
  check('td1', 'to1', STAND_USUAL.contact, '1歩前の接地時間');
  check('to2', 'td1', STAND_USUAL.flight, '2歩前の後の空中');
  check('td2', 'to2', STAND_USUAL.contact, '2歩前の接地時間');
  return out;
}
/** The times a moment's frame sets, as `frame` would set them (the check's list of what a frame changes). */
export function standEffects(picks: Picks, key: string, frame: number, frames: readonly CrouchFrame[]): PickEffect[] {
  const then = { ...picks, [key]: frame }, out: PickEffect[] = [];
  const span = (a: string, b: string) => (p: Picks) => { const x = standTime(a, p, frames), y = standTime(b, p, frames); return x === null || y === null ? null : y - x; };
  const time = (label: string, f: (p: Picks) => number | null) => { const to = f(then); if (to !== null) out.push({ label, from: picks[key] === undefined ? null : f(picks), to, unit: '秒', digits: 3 }); };
  const uses: Record<string, [string, string, string][]> = {
    td0: [['踏切の接地時間', 'td0', 'to0'], ['1歩前の後の空中', 'to1', 'td0']], to0: [['踏切の接地時間', 'td0', 'to0']],
    to1: [['1歩前の接地時間', 'td1', 'to1'], ['1歩前の後の空中', 'to1', 'td0']], td1: [['1歩前の接地時間', 'td1', 'to1'], ['2歩前の後の空中', 'to2', 'td1']],
    to2: [['2歩前の接地時間', 'td2', 'to2'], ['2歩前の後の空中', 'to2', 'td1']], td2: [['2歩前の接地時間', 'td2', 'to2']] };
  for (const [label, a, b] of uses[key] ?? []) time(label, span(a, b));
  return out;
}
/** The tapped athlete's lowest foot (pixels), where the takeoff's view is enlarged before its touchdown is set. */
export function lowestFoot(pose: readonly CrouchPoint[] | null, W: number, H: number): Px | null {
  const toes = pose ? toesOf(pose, W, H) : [];
  return toes.length ? toes.reduce((a, b) => b.y > a.y ? b : a) : null;
}
