/** Hurdle clearance, side view, one hurdle: the contacts around it (the step
 * before the takeoff, the takeoff, the landing and the step after), the flight
 * over it, the athlete's angles at each moment and where the centre of mass
 * peaks against the hurdle, from the athlete's pose in every frame.
 *
 * The method is the crouch start's (docs/Hurdle_Feasibility_20261005.md):
 * contacts from the toes (both sides pooled), angles from RTMPose (`refined`).
 * Unlike the crouch start, the contacts are timed on RTMPose's toes too: on 10
 * takeoffs and landings of 5 athletes (240 fps) against the picture, contact
 * times came within 8 ms in Chrome and in WebKit, MediaPipe's within 17 ms in
 * Chrome but 31 ms in WebKit (its toes moved with the browser's decoding;
 * docs/Hurdle_v1_20261005.md). MediaPipe's toes stand in where RTMPose is missing. */
import { anglePose, type CrouchFrame, type CrouchPoint } from '../sprint10/crouch';
import { contactOf, contactPlants, legLength, plantedToes, plantsOf, toesOf, visible, type Contact } from '../sprint10/contacts';
import { kneeAngle, shankAngle, thighAngle, trunkAngle } from '../sprint10/angles';
import type { Mark, Phase } from '../sprint10/crouch-figure';
import { editContacts, type Edits } from '../sprint10/moment-edits';

export const HURDLE_VERSION = 'hurdle-v1-experimental';
/** A contact whose ground level is more than GROUND_SPREAD leg lengths above
 * the lowest one is a foot held still in the air, not on the ground (one over
 * the hurdle, 1.1 leg lengths up, was taken for a contact: recorded). */
const GROUND_SPREAD = .4;
const G = 9.81;
/** The centre of mass is fitted from this long after the toe-off to this long
 * before the touchdown (the foot still pushing, or already braking). */
const FLIGHT_MARGIN = .008;
const MIN_FLIGHT_FRAMES = 15;
/** Both knees and both ankles within this many leg lengths: the pose model put
 * the trail leg on the lead leg (seen after the hurdle as the trail leg came
 * through); such frames are left out of the centre of mass. */
const COLLAPSED = .15;
/** The gravity scale is kept when the leg (hip to ankle) comes out this long (m). */
const LEG_M = [.5, 1.2] as const;
/** The hurdle is the ruler when its top and foot are set and its height chosen.
 * Against it, the gravity scale of 5 videos was off by -0.4 to +8.3% (the
 * user gave the heights: 76.2 cm, みゆ 83.8 cm; the bar read off the first
 * frame), so gravity is the ruler only without the hurdle, and a check: a gap
 * beyond RULER_GAP is reported. */
const RULER_GAP = .12;
/** The ground line further than this many leg lengths from the contacts' ground: reported. */
const GROUND_GAP = .08;
/** Hurdle heights offered (m): youth to men's 110 m (the user, 2026-10-05). */
export const HURDLE_HEIGHTS = [.6, .7, .762, .838, .914, .991, 1.067] as const;

export interface HurdleOptions {
  /** Picture size, so distances are measured in pixels alike in both axes. */
  width: number; height: number;
  /** The hurdle's position across the picture (0-1), set on the video. */
  hurdleX: number;
  /** The bar's top and the ground at its foot (0-1 down the picture), and the hurdle's height (m): the ruler. */
  barY?: number; groundY?: number; hurdleHeight?: number;
  /** The frames the user set for the judged moments (`td{n}`, `to{n}` of contact n; sprint10/moment-edits.ts). */
  edits?: Edits;
}
/** The centre of mass in the flight: a parabola fitted to its height, its top
 * against the hurdle, in time and (with the scale from gravity) in metres. */
export interface Apex {
  pts: number; frame: number;
  /** The peak's position (normalized). */
  x: number; y: number;
  /** From the peak to the centre of mass over the hurdle (s); positive: the peak comes first. */
  beforeSeconds: number | null;
  /** The peak's horizontal distance before the hurdle (m); positive: before it. */
  beforeM: number | null;
  /** Pixels per metre from gravity (the parabola's curvature); null when implausible. */
  gravityScale: number | null;
  /** Fit: root mean square residual (px) and the frames used. */
  rms: number; frames: number;
  /** The centre of mass in the flight (normalized) and the fitted parabola (y = a t² + b t + c, t in s from t0, y normalized). */
  path: { pts: number; x: number; y: number }[];
  curve: { t0: number; a: number; b: number; c: number; vx: number; x0: number };
}
export interface HurdleTimes {
  /** The step before the takeoff: its contact time and the flight to the takeoff touchdown (s). */
  approachContact: number | null; approachFlight: number | null;
  takeoffContact: number | null;
  /** Takeoff toe-off to landing touchdown: the time over the hurdle (s). */
  clearance: number | null;
  landingContact: number | null;
  /** Landing toe-off to the next touchdown, and that contact. */
  afterFlight: number | null; afterContact: number | null;
}
export interface HurdleResult {
  version: string; reason: string | null; direction: number; hurdleX: number;
  /** The hurdle as set: its line, top and foot (0-1) and height (m); null where not set. */
  hurdle: { barY: number | null; groundY: number | null; height: number | null };
  contacts: Contact[];
  /** Indices into `contacts`; null when not in the picture. */
  approach: number | null; takeoff: number | null; landing: number | null; after: number | null;
  times: HurdleTimes;
  /** The frame where the pelvis is over the hurdle. */
  crossing: { frame: number; pts: number } | null;
  apex: Apex | null;
  /** Pixels per metre: from the hurdle (its top, foot and height) or else from gravity; and how far gravity's was from the hurdle's. */
  ruler: { scale: number | null; source: 'hurdle' | 'gravity' | null; gravityScale: number | null; gap: number | null };
  /** Takeoff toe to the hurdle and the hurdle to the landing toe (m): reference only. Against the OptoJump
   * (4 athletes), the takeoff came 7-11 cm long: the camera pitched down showed the hurdle 2-4% short, and
   * the scale also depends on where across the lane the athlete runs (user, 2026-10-05: distances are
   * reference records, not main measures). */
  distances: { takeoff: number | null; landing: number | null };
  /** The takeoff's share of takeoff + landing distance (0-1), from pixels: no scale needed. Matched the OptoJump's
   * in 3 of 4 athletes (66, 70, 62 %; the fourth's report may be of another run). */
  ratio: number | null;
  /** The centre of mass above the bar (m): at its peak, and as it passes the hurdle's line. Needs the hurdle's top. */
  overBar: { atPeak: number | null; atHurdle: number | null };
  /** The moments with their angles, in time order (pictures, replay, advice). */
  moments: Phase[];
  notes: string[];
}

type Point = { x: number; y: number };
const between = (a: Point, b: Point, f: number): Point => ({ x: a.x + f * (b.x - a.x), y: a.y + f * (b.y - a.y) });
const SEGMENT_POINTS = [11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32];
/** Centre of mass (normalized) from de Leva's (1996) mean segment masses, as the
 * CMJ (src/cmj/center-of-mass.ts); the head at the ears, or the nose when the
 * pose has no ears (RTMPose here). Null when a point is missing (below
 * `minVisibility`; the high jump takes RTMPose's points whatever their score). */
export function centreOfMass(p: CrouchPoint[], minVisibility = .3): Point | null {
  if (!SEGMENT_POINTS.every(i => visible(p[i], minVisibility))) return null;
  const head = visible(p[7], minVisibility) && visible(p[8], minVisibility) ? between(p[7], p[8], .5) : visible(p[0], minVisibility) ? p[0] : null;
  if (!head) return null;
  const shoulders = between(p[11], p[12], .5), hips = between(p[23], p[24], .5);
  const parts: [number, Point][] = [[.0681, head], [.43015, between(shoulders, hips, .5051)]];
  for (const s of [0, 1]) parts.push([.0263, between(p[11 + s], p[13 + s], .5763)], [.015, between(p[13 + s], p[15 + s], .45665)], [.00585, p[15 + s]],
    [.1447, between(p[23 + s], p[25 + s], .38535)], [.0457, between(p[25 + s], p[27 + s], .43735)], [.0133, between(p[29 + s], p[31 + s], .42145)]);
  const m = parts.reduce((a, [w]) => a + w, 0);
  return { x: parts.reduce((a, [w, q]) => a + w * q.x, 0) / m, y: parts.reduce((a, [w, q]) => a + w * q.y, 0) / m };
}

/** Least squares y = a t² + b t + c, t from the mean time t0. */
function parabola(ts: number[], ys: number[]) {
  const t0 = ts.reduce((a, b) => a + b, 0) / ts.length, T = ts.map(t => t - t0), n = T.length;
  const S = (k: number) => T.reduce((a, t) => a + t ** k, 0), Sy = (k: number) => T.reduce((a, t, i) => a + t ** k * ys[i], 0);
  const M = [[S(4), S(3), S(2)], [S(3), S(2), S(1)], [S(2), S(1), n]], v = [Sy(2), Sy(1), Sy(0)];
  const det = (m: number[][]) => m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) - m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) + m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]);
  const D = det(M), [a, b, c] = [0, 1, 2].map(k => det(M.map((r, i) => r.map((x, j) => j === k ? v[i] : x))) / D);
  const rms = Math.sqrt(T.reduce((s, t, i) => s + (a * t * t + b * t + c - ys[i]) ** 2, 0) / n);
  return { t0, a, b, c, rms };
}
function line(ts: number[], xs: number[]) {
  const n = ts.length, mt = ts.reduce((a, b) => a + b, 0) / n, mx = xs.reduce((a, b) => a + b, 0) / n;
  const k = ts.reduce((a, t, i) => a + (t - mt) * (xs[i] - mx), 0) / ts.reduce((a, t) => a + (t - mt) ** 2, 0);
  return { at: (t: number) => mx + k * (t - mt), slope: k };
}

export function analyzeHurdle(frames: readonly CrouchFrame[], options: HurdleOptions): HurdleResult {
  const { width: W, height: H, hurdleX } = options;
  const base: HurdleResult = { version: HURDLE_VERSION, reason: null, direction: 0, hurdleX,
    hurdle: { barY: options.barY ?? null, groundY: options.groundY ?? null, height: options.hurdleHeight ?? null }, contacts: [], approach: null, takeoff: null, landing: null, after: null,
    times: { approachContact: null, approachFlight: null, takeoffContact: null, clearance: null, landingContact: null, afterFlight: null, afterContact: null },
    crossing: null, apex: null, ruler: { scale: null, source: null, gravityScale: null, gap: null }, distances: { takeoff: null, landing: null }, ratio: null,
    overBar: { atPeak: null, atHurdle: null }, moments: [], notes: [] };
  const fail = (reason: string) => ({ ...base, reason });
  // Contacts and the leg length on RTMPose's points where there are any (see above).
  const seen = frames.filter(f => f.pose).map(f => f.refined ? { ...f, pose: f.refined } : f);
  if (seen.length < 20) return fail('選手を十分に捉えられませんでした。真横から、全身が映るように撮影してください。');
  const leg = legLength(seen, W, H);
  if (!(leg > 0)) return fail('脚を十分に捉えられませんでした。');
  const hipX = (p: CrouchPoint[]) => visible(p[23], .3) && visible(p[24], .3) ? (p[23].x + p[24].x) / 2 : null;
  const hips = seen.flatMap(f => { const x = hipX(f.pose!); return x === null ? [] : [{ t: f.pts, x }]; });
  const direction = hips.length > 1 ? Math.sign(hips.at(-1)!.x - hips[0].x) : 0;
  if (!direction) return fail('走る向きを確認できませんでした。');
  base.direction = direction;
  if ((hips[0].x - hurdleX) * direction > 0 || (hips.at(-1)!.x - hurdleX) * direction < 0)
    return fail('選手がハードルの線を越える様子が映っていません。線をハードルに合わせ、ハードルの前後が映る動画を使ってください。');

  // Contacts on the ground, in time order.
  const toes = toesOf(seen, W, H), plants = contactPlants(plantsOf(plantedToes(toes, leg), leg), leg, direction);
  const ground = Math.max(...plants.map(p => p.y));
  const onGround = plants.filter(p => ground - p.y < GROUND_SPREAD * leg);
  const firstSeen = seen[0].pts, lastSeen = seen.at(-1)!.pts;
  base.contacts = onGround.map((p, i) => contactOf(p, i + 1, toes, leg, lastSeen, firstSeen));
  if (options.edits) base.contacts = editContacts(base.contacts, options.edits, frames);
  const ahead = (c: Contact) => (c.x / W - hurdleX) * direction;
  const before = base.contacts.filter(c => ahead(c) < 0).length, landing = base.contacts.findIndex(c => ahead(c) > 0), takeoff = before - 1;
  base.takeoff = takeoff < 0 ? null : takeoff; base.landing = landing < 0 ? null : landing;
  base.approach = base.takeoff !== null && base.takeoff > 0 ? base.takeoff - 1 : null;
  base.after = base.landing !== null && base.landing + 1 < base.contacts.length ? base.landing + 1 : null;
  const c = (i: number | null) => i === null ? null : base.contacts[i];
  const span = (a: number | null | undefined, b: number | null | undefined) => a != null && b != null ? b - a : null;
  const [A, T, L, F] = [c(base.approach), c(base.takeoff), c(base.landing), c(base.after)];
  base.times = { approachContact: span(A?.touchdown, A?.toeOff), approachFlight: span(A?.toeOff, T?.touchdown), takeoffContact: span(T?.touchdown, T?.toeOff),
    clearance: span(T?.toeOff, L?.touchdown), landingContact: span(L?.touchdown, L?.toeOff), afterFlight: span(L?.toeOff, F?.touchdown), afterContact: span(F?.touchdown, F?.toeOff) };
  if (!T) base.notes.push('踏切の接地が映っていません。ハードルの手前の1〜2歩から映るように撮影してください。');
  if (!L) base.notes.push('着地の接地が映っていません。着地の後の1〜2歩まで映るように撮影してください。');
  if (T && T.touchdown === null) base.notes.push('踏切は、接地の瞬間が映っていないため、接地時間を出していません。');
  if (L && L.toeOff === null) base.notes.push('着地は、離地が映っていないため、接地時間を出していません。');

  // The pelvis over the hurdle.
  const crossingFrame = seen.find(f => { const x = hipX(anglePose(f)!); return x !== null && (x - hurdleX) * direction >= 0; });
  base.crossing = crossingFrame ? { frame: crossingFrame.frame, pts: crossingFrame.pts } : null;
  base.apex = T?.toeOff != null && L?.touchdown != null ? apexOf(seen, T.toeOff, L.touchdown, W, H, hurdleX, direction, leg) : null;
  if (T?.toeOff != null && L?.touchdown != null && !base.apex) base.notes.push('空中の重心の動きをとらえられず、重心最高点を出していません。');

  // The ruler: the hurdle when its top, foot and height are given, else gravity.
  const { barY, groundY, hurdleHeight } = options;
  const hurdlePx = barY != null && groundY != null && hurdleHeight ? (groundY - barY) * H : null;
  const hurdleScale = hurdlePx !== null && hurdlePx > 0 ? hurdlePx / hurdleHeight! : null, gravity = base.apex?.gravityScale ?? null;
  const scale = hurdleScale ?? gravity;
  base.ruler = { scale, source: hurdleScale ? 'hurdle' : gravity ? 'gravity' : null, gravityScale: gravity, gap: hurdleScale && gravity ? gravity / hurdleScale - 1 : null };
  if (hurdlePx !== null && hurdlePx <= 0) base.notes.push('ハードルの上端の線が足元の線より下にあります。線を確かめてください。');
  if (base.ruler.gap !== null && Math.abs(base.ruler.gap) > RULER_GAP)
    base.notes.push(`ハードルから求めた縮尺と、重心の放物線（重力）から求めた縮尺が${Math.round(Math.abs(base.ruler.gap) * 100)}%違います。ハードルの高さの選択と、上端・足元の線の位置を確かめてください。`);
  if (groundY != null && T && L && Math.abs((T.groundY + L.groundY) / 2 - groundY * H) > GROUND_GAP * leg)
    base.notes.push('足元の線が、接地したつま先の高さと離れています。ハードルの足元（地面）に合わせてください。');
  if (T && L) { const before = (hurdleX * W - T.x) * direction, after = (L.x - hurdleX * W) * direction; if (before > 0 && after > 0) base.ratio = before / (before + after); }
  if (scale) {
    const metres = (px: number) => px / scale;
    if (base.apex) base.apex.beforeM = metres((hurdleX - base.apex.x) * direction * W);
    base.distances = { takeoff: T ? metres((hurdleX * W - T.x) * direction) : null, landing: L ? metres((L.x - hurdleX * W) * direction) : null };
  } else if (base.apex) base.notes.push('縮尺を決められなかったため、重心最高点の位置は時間だけで表しています。ハードルの高さを選び、上端と足元に線を合わせてください。');
  if (hurdleScale && base.apex) {
    const a = base.apex, bar = barY! * H, at = (t: number) => { const dt = t - a.curve.t0; return (a.curve.c + a.curve.b * dt + a.curve.a * dt * dt) * H; };
    base.overBar = { atPeak: (bar - a.y * H) / hurdleScale, atHurdle: a.beforeSeconds === null ? null : (bar - at(a.pts + a.beforeSeconds)) / hurdleScale };
  }

  base.moments = momentsOf(base, frames, W, H, direction, leg);
  return base;
}

function apexOf(seen: CrouchFrame[], from: number, to: number, W: number, H: number, hurdleX: number, direction: number, leg: number): Apex | null {
  const path = seen.filter(f => f.pts > from + FLIGHT_MARGIN && f.pts < to - FLIGHT_MARGIN).flatMap(f => {
    const p = anglePose(f)!;
    const collapsed = [[25, 26], [27, 28]].every(([a, b]) => Math.hypot((p[a].x - p[b].x) * W, (p[a].y - p[b].y) * H) < COLLAPSED * leg);
    const m = collapsed ? null : centreOfMass(p);
    return m ? [{ pts: f.pts, frame: f.frame, x: m.x, y: m.y }] : [];
  });
  if (path.length < MIN_FLIGHT_FRAMES) return null;
  const q = parabola(path.map(p => p.pts), path.map(p => p.y * H));
  if (!(q.a > 0)) return null;
  const t = q.t0 - q.b / (2 * q.a);
  if (t <= from || t >= to) return null;
  const x = line(path.map(p => p.pts), path.map(p => p.x)), vx = x.slope * direction;
  const scale = 2 * q.a / G, legM = leg / scale;
  const beforeSeconds = vx > 0 ? (hurdleX - x.at(t)) * direction / vx : null;
  const near = path.reduce((a, p) => Math.abs(p.pts - t) < Math.abs(a.pts - t) ? p : a);
  return { pts: t, frame: near.frame, x: x.at(t), y: (q.c + q.b * (t - q.t0) + q.a * (t - q.t0) ** 2) / H,
    beforeSeconds, beforeM: null, gravityScale: legM >= LEG_M[0] && legM <= LEG_M[1] ? scale : null, rms: q.rms, frames: path.length,
    path: path.map(({ pts, x, y }) => ({ pts, x, y })), curve: { t0: q.t0, a: q.a / H, b: q.b / H, c: q.c / H, vx: x.slope, x0: x.at(q.t0) } };
}

/** The stance leg's side (0 left, 1 right landmarks): the toe nearest the
 * contact's place on the ground. Across only, the trail leg's toe was taken at
 * the landing, passing high above the landing foot (recorded). */
function stanceSide(pose: CrouchPoint[], contact: Contact, W: number, H: number): 0 | 1 | null {
  const d = [31, 32].map(k => visible(pose[k], .3) ? Math.hypot(pose[k].x * W - contact.x, pose[k].y * H - contact.groundY) : Infinity);
  return d[0] === Infinity && d[1] === Infinity ? null : d[0] <= d[1] ? 0 : 1;
}

/** The pictures' moments: takeoff touchdown and toe-off, the centre of mass at
 * its peak, the pelvis over the hurdle and the landing. The legs are chosen by
 * place, not by the pose model's left/right labels: the stance leg's toe is at
 * the contact; over the hurdle the lead leg is the one whose ankle is ahead. */
function momentsOf(r: HurdleResult, frames: readonly CrouchFrame[], W: number, H: number, direction: number, leg: number): Phase[] {
  const out: Phase[] = [];
  const at = (frame: number | null | undefined) => frame == null ? null : frames.find(f => f.frame === frame && f.pose) ?? null;
  const SHORT: Record<string, string> = { 'takeoff-td': '踏切接地', 'takeoff-to': '踏切離地', apex: '最高点', crossing: 'ハードル上', landing: '着地' };
  const add = (key: string, label: string, f: CrouchFrame | null, marks: (pose: CrouchPoint[]) => (Mark | null)[]) => {
    if (!f) return;
    const pose = anglePose(f)!;
    out.push({ key, label, short: SHORT[key], frame: f.frame, pts: f.pts, marks: marks(pose).filter((m): m is Mark => m !== null) });
  };
  const trunk = (pose: CrouchPoint[]): Mark | null => { const v = trunkAngle(pose, W, H, direction, leg); return v === null ? null : { kind: 'trunk', label: '体幹', value: v }; };
  const of = (kind: 'shank' | 'knee' | 'thigh', side: 0 | 1 | null, label: string, value: number | null): Mark | null => side === null || value === null ? null : { kind, side, label, value };
  const T = r.takeoff === null ? null : r.contacts[r.takeoff], L = r.landing === null ? null : r.contacts[r.landing];
  if (T) {
    add('takeoff-td', '踏切の接地', at(T.touchdownFrame), pose => { const s = stanceSide(pose, T, W, H);
      return [trunk(pose), of('shank', s, '脛', s === null ? null : shankAngle(pose, s, W, H, direction))]; });
    add('takeoff-to', '踏切の離地', at(T.toeOffFrame), pose => { const s = stanceSide(pose, T, W, H), o = s === null ? null : (1 - s) as 0 | 1;
      return [trunk(pose), of('knee', s, '踏切膝', s === null ? null : kneeAngle(pose, s, W, H, leg)), of('thigh', o, 'リード大腿', o === null ? null : thighAngle(pose, o, W, H, direction, leg))]; });
  }
  const lead = (pose: CrouchPoint[]): 0 | 1 | null => !visible(pose[27], .3) || !visible(pose[28], .3) ? null : (pose[27].x - pose[28].x) * direction > 0 ? 0 : 1;
  if (r.apex) add('apex', '重心最高点', at(r.apex.frame), pose => [trunk(pose)]);
  if (r.crossing) add('crossing', 'ハードル上', at(r.crossing.frame), pose => { const s = lead(pose);
    return [trunk(pose), of('knee', s, 'リード膝', s === null ? null : kneeAngle(pose, s, W, H, leg))]; });
  if (L) add('landing', '着地', at(L.touchdownFrame), pose => { const s = stanceSide(pose, L, W, H);
    return [trunk(pose), of('knee', s, 'リード膝', s === null ? null : kneeAngle(pose, s, W, H, leg)), of('shank', s, '脛', s === null ? null : shankAngle(pose, s, W, H, direction))]; });
  return out.sort((a, b) => a.pts - b.pts);
}

/** A moment's angle by its label, for the advice. */
export const markValue = (r: HurdleResult, key: string, label: string) => r.moments.find(m => m.key === key)?.marks.find(m => m.label === label)?.value ?? null;
