/** The long jump filmed from the stands at a competition (the user, 2026-10-18: 「試合でスタンドから走り幅跳びの動画を
 * 撮影して最低限の角度や接地時間を短時間で解析してアドバイスしたい…項目を絞りつつ精度も完璧ではなくてもなんとなく取れれば
 * 目安になる」, then 「一度試してみよう。作ってくれる？」, and after the first trial 「試合解析は踏切の接地と離地だけ手動で
 * 選んでAI解析ですよ」). The athlete is small among others and the camera may follow them, so nothing is followed through
 * the video: the user taps the athlete near the board, then sets the takeoff's touchdown and toe-off, as the crouch start's
 * light mode (sprint10/crouch-pick.ts), the toe-off guessed. The pose models look only at those frames, round where the
 * athlete should be (crouch-pick-poses.ts lookNear). The values are the analysis' (analysis.ts) that need neither a scale nor
 * a camera held still, nor the steps before: the takeoff's contact time, and the leg's angle, the trunk and the knee at its
 * touchdown. */
import { kneeAngle, stanceSide, trunkAngle } from '../sprint10/angles';
import { median, quantile, TOE, visible } from '../sprint10/contacts';
import { anglePose, frameEdge, type CrouchFrame, type CrouchPoint } from '../sprint10/crouch';
import { frameAtEdge, LEG_QUANTILE, pickLeg, type PickEffect } from '../sprint10/crouch-pick';
import type { NearHint } from '../sprint10/crouch-pick-poses';
import { LONG_JUMP_VERSION, momentsOf, type LongJumpResult } from './analysis';

export const STAND_VERSION = `${LONG_JUMP_VERSION}+stands-picked-v1`;
export type StandKind = 'touchdown' | 'toeOff';
export interface StandStep { key: string; kind: StandKind; label: string; short: string }
/** The moments in the order they are set: the takeoff's touchdown (the board tells where and when), then its toe-off. */
export const STAND_STEPS: readonly StandStep[] = [
  { key: 'td0', kind: 'touchdown', label: '踏切の接地', short: '踏切接地' },
  { key: 'to0', kind: 'toeOff', label: '踏切の離地', short: '踏切離地' },
];
export type Picks = Readonly<Record<string, number>>;
export const standStepOf = (key: string) => STAND_STEPS.find(s => s.key === key) ?? null;
/** The moment to set next: the first in order not set; null once both are. */
export const nextStand = (picks: Picks): StandStep | null => STAND_STEPS.find(s => picks[s.key] === undefined) ?? null;
/** The moments set, in order (up to the first not set). */
export function standSteps(picks: Picks): StandStep[] {
  const out: StandStep[] = [];
  for (const s of STAND_STEPS) { if (picks[s.key] === undefined) break; out.push(s); }
  return out;
}
/** Enough for the result: the takeoff's touchdown and toe-off. */
export const standEnough = (picks: Picks) => picks.td0 !== undefined && picks.to0 !== undefined;

/** The takeoff's contact the toe-off is guessed from (s): the four test videos (すずね, 240 fps, the analysis' moments)
 * 0.146-0.154 s (docs/LongJump_MainMeasures_Research_20261006.md); women of 5.50 m on average 0.133 s (Nemtsev et al. 2016). */
export const STAND_TAKEOFF = .145;
/** A takeoff contact out of this range (s) is said at its moments' buttons (as the check's, crouch-edit.ts): the same sources. */
export const STAND_USUAL = [.09, .2] as const;
const sideOf = (kind: StandKind): -1 | 1 => kind === 'touchdown' ? -1 : 1;
/** A moment's time at its frame's edge (crouch.ts frameEdge): the touchdown before its first frame with the foot down, the
 * toe-off after the last. */
export function standTime(key: string, picks: Picks, frames: readonly CrouchFrame[]): number | null {
  const s = standStepOf(key), frame = picks[key];
  return s && frame !== undefined ? frameEdge(frames, frame, sideOf(s.kind)) : null;
}
/** The frame the toe-off is guessed at from the touchdown; null for the touchdown (found by the user) and for a toe-off past
 * the video's end. */
export function standGuess(key: string, picks: Picks, frames: readonly CrouchFrame[]): number | null {
  const td = key === 'to0' ? standTime('td0', picks, frames) : null;
  return td === null ? null : frameAtEdge(frames, td + STAND_TAKEOFF, 1);
}
/** The frames the pose models look at: each moment's own. */
export const standFrames = (picks: Picks) => [...new Set(STAND_STEPS.flatMap(s => picks[s.key] === undefined ? [] : [picks[s.key]]))];

type Px = { x: number; y: number };
/** The leg length (pixels) from the few frames looked at, as the light mode's (crouch-pick.ts pickLeg), else from the hips
 * and ankles seen less surely (0.3, as the angles take them): from the stands the athlete is small, and the takeoff's two
 * frames are all there is (すずね４ far away: no hip and ankle of a leg at 0.5 at either). */
export function standLeg(frames: readonly CrouchFrame[], W: number, H: number): number {
  const sure = pickLeg(frames, W, H);
  return sure > 0 ? sure : quantile(frames.flatMap(f => f.pose ? [[23, 27], [24, 28]].flatMap(([a, b]) => visible(f.pose![a], .3) && visible(f.pose![b], .3)
    ? [Math.hypot((f.pose![a].x - f.pose![b].x) * W, (f.pose![a].y - f.pose![b].y) * H)] : []) : []), LEG_QUANTILE);
}
/** What the poses found so far tell (pixels): the leg length, the running direction, the athlete's height in the picture
 * (picture heights), the hips at each frame found (the tap's too), and the foot on the board at each moment set. */
export interface StandLayout { leg: number; direction: number; size: number | null; hips: { t: number; x: number; y: number }[]; places: Map<string, Px> }
const BODY = [0, 11, 12, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32];
const toesOf = (p: readonly CrouchPoint[], W: number, H: number): Px[] => TOE.map(k => p[k]).filter(q => visible(q, .3)).map(q => ({ x: q.x * W, y: q.y * H }));
/** The direction: each foot seen points the way it runs (heel to toe), and the hips go that way unless the camera
 * follows them. The feet first: a camera that follows the athlete leaves the hips nearly still in the picture. */
export function standLayout(picks: Picks, frames: readonly CrouchFrame[], W: number, H: number): StandLayout {
  const seen = frames.filter(f => anglePose(f));
  const leg = standLeg(seen.map(f => ({ ...f, pose: anglePose(f) })), W, H);
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
    // At the touchdown the landing foot is ahead of the other; at the toe-off the pushing foot is behind.
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
/** Where the view is enlarged for a moment (normalized) and the ground's level there: the foot found at the moment, else the
 * takeoff foot found at the other moment, else the tapped athlete's lowest foot. */
export function standFocus(key: string, layout: StandLayout, tapFoot: Px | null, W: number, H: number): { focus: Px | null; ground: number | null } {
  const { places } = layout, foot = places.get(key) ?? places.get('td0') ?? places.get('to0') ?? tapFoot;
  return foot ? { focus: { x: foot.x / W, y: foot.y / H }, ground: foot.y / H } : { focus: null, ground: null };
}

/** The result from the moments set and the poses found at them (`frames`: every frame of the video in time order, the poses
 * where the models looked, the feet mended as the analysis' are). As analysis.ts measures the takeoff, without the speeds. */
export function standResult(picks: Picks, frames: readonly CrouchFrame[], W: number, H: number,
  /** Frames the models have not looked at yet: their angles wait, nothing is said to be missing there. */
  pending: ReadonlySet<number> = new Set()): LongJumpResult {
  const base: LongJumpResult = { version: STAND_VERSION, reason: null, direction: 0, contacts: [], takeoff: null, steps: [], takeoffContact: null,
    speed: { lastTwoPx: null, touchdownPx: null }, rhythm: null, leave: null, posture: { legAngle: null, trunk: null, knee: null, trunkPenult: null },
    scale: null, moments: [], notes: [] };
  const fail = (reason: string): LongJumpResult => ({ ...base, reason });
  if (!standEnough(picks)) return fail('踏切の接地と離地のコマを選んでください。');
  const td = frames.find(f => f.frame === picks.td0), pose = td ? anglePose(td) : null;
  if (!pose) return fail(pending.has(picks.td0) ? '踏切の接地のコマの骨格を調べています。' : '踏切の接地のコマで選手を見つけられませんでした。「確認」で選手をタップし直すか、コマを選び直してください。');
  const layout = standLayout(picks, frames, W, H), { leg, direction } = layout;
  if (!(leg > 0)) return fail('脚を十分に捉えられませんでした。');
  if (!direction) return fail('走る向きを確認できませんでした。');
  base.direction = direction;
  const board = layout.places.get('td0') ?? layout.places.get('to0') ?? lowestFoot(pose, W, H);
  if (!board) return fail('踏切の接地のコマで足を捉えられませんでした。足が映っているコマを選び直してください。');
  base.contacts.push({ index: 1, x: board.x, groundY: board.y, touchdown: frameEdge(frames, picks.td0, -1), touchdownFrame: picks.td0,
    toeOff: frameEdge(frames, picks.to0, 1), toeOffFrame: picks.to0 });
  const T0 = base.contacts[0];
  base.takeoff = 0;
  base.takeoffContact = T0.touchdown !== null && T0.toeOff !== null ? T0.toeOff - T0.touchdown : null;
  // The posture at the touchdown, the stance leg by the foot's place (as analysis.ts).
  const s = stanceSide(pose, T0.x / W, T0.groundY / H, W, H);
  if (s !== null && visible(pose[23 + s], .3) && visible(pose[27 + s], .3))
    base.posture.legAngle = Math.atan2((pose[27 + s].y - pose[23 + s].y) * H, (pose[27 + s].x - pose[23 + s].x) * W * direction) * 180 / Math.PI;
  base.posture.trunk = trunkAngle(pose, W, H, direction, leg);
  base.posture.knee = s === null ? null : kneeAngle(pose, s, W, H, leg);
  base.moments = momentsOf(base, frames, W, H, direction, leg);
  return base;
}

/** The takeoff's contact out of the usual range, said at both its moments. */
export function standFlags(picks: Picks, frames: readonly CrouchFrame[]): Map<string, string> {
  const out = new Map<string, string>(), a = standTime('td0', picks, frames), b = standTime('to0', picks, frames), [lo, hi] = STAND_USUAL;
  if (a !== null && b !== null && (b - a < lo || b - a > hi)) {
    const text = `踏切の接地時間 ${(b - a).toFixed(3)}秒：ふつうは${lo}〜${hi}秒です。`;
    out.set('td0', text); out.set('to0', text);
  }
  return out;
}
/** The takeoff's contact time as `frame` would set it for a moment (the check's list of what a frame changes). */
export function standEffects(picks: Picks, key: string, frame: number, frames: readonly CrouchFrame[]): PickEffect[] {
  const contact = (p: Picks) => { const a = standTime('td0', p, frames), b = standTime('to0', p, frames); return a === null || b === null ? null : b - a; };
  const to = contact({ ...picks, [key]: frame });
  return to === null ? [] : [{ label: '踏切の接地時間', from: picks[key] === undefined ? null : contact(picks), to, unit: '秒', digits: 3 }];
}
/** The tapped athlete's lowest foot (pixels), where the takeoff's view is enlarged before its touchdown is set. */
export function lowestFoot(pose: readonly CrouchPoint[] | null, W: number, H: number): Px | null {
  const toes = pose ? toesOf(pose, W, H) : [];
  return toes.length ? toes.reduce((a, b) => b.y > a.y ? b : a) : null;
}
