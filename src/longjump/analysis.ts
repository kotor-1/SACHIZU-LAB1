/** Long jump, the end of the run-up, filmed side-on (the user, 2026-10-06:
 * 「助走の最後のところをメインに解析するので跳躍動作や着地は不要です」). The main
 * measure is the one research ties to the record most strongly: the run-up's
 * speed (the centre of mass's forward speed over the last steps; 太田ら 2010,
 * r = 0.81-0.86 with the distance; docs/LongJump_MainMeasures_Research_20261006.md).
 * The rhythm of the last two steps and the posture at the takeoff touchdown are
 * reference records (their tie to the distance is weak or mixed). The toe-off's
 * horizontal and vertical speeds and the takeoff angle were added on the user's
 * asking (「踏切角度や鉛直速度？みたいなの出せるって言ってなかった？」): the vertical
 * speed is tied to women's distances (Nemtsev et al. 2016, r = 0.61), the angle
 * weakly (a reference, not a target; Linthorne et al. 2005).
 *
 * Contacts are the sprint's toes at rest (both sides pooled); a contact held
 * above the ground is a foot still in the air after the takeoff (one 0.45-0.55
 * leg lengths up in all four test videos). The takeoff is the contact before
 * the long flight.
 *
 * The scale for metres, the first to be had: the 2 m ruler on the ground set by
 * the user (`ruler.ts`); the trunk near the takeoff (shoulders to hips, 0.288 of
 * the height entered); gravity, from the parabola of the centre of mass in the
 * flight. Against the ruler in the 4 test videos (the user: 「踏切板から砂場まで
 * ちょうど２m」): gravity's scale was 11% large in both videos it could be had
 * (the centre of mass from the pose strays a few cm from a parabola), and the
 * trunk's over the whole video 12-23% large (it read long in the flight); the
 * trunk from 2 steps before the takeoff to the toe-off −8 to +2%. With the
 * ruler, the athlete's trunk came to 0.40-0.44 m in the 4 videos (150 cm tall). */
import { centreOfMass } from '../hurdling/analysis';
import { anglePose, type CrouchFrame, type CrouchPoint } from '../sprint10/crouch';
import { contactOf, contactPlants, legLength, median, plantedToes, plantsOf, TOE, visible, type Contact, type Toe } from '../sprint10/contacts';
import { kneeAngle, trunkAngle } from '../sprint10/angles';
import type { Mark, Phase } from '../sprint10/crouch-figure';
import { rulerScale, type RulerPoints, type RulerScale } from './ruler';

export const LONG_JUMP_VERSION = 'longjump-v2-experimental';
const G = 9.81;
/** A contact this many leg lengths above the lowest is a foot held still in the air (0.45-0.55 in the test videos; on the ground 0-0.14). */
const ABOVE_GROUND = .3;
/** Toes count from this score (the sprint's 0.5): landing, the toe's score was 0.38-0.47 for 6 frames in one
 * video in WebKit (0.52-0.64 in Chrome), and the touchdown came 33 ms after the picture's (frames 508-511, Chrome 511).
 * With 0.4 the rhythm agreed between the browsers in 3 videos of 4 (the fourth 0.75 / 0.67); 0.5 and 0.3 agreed in 2. */
const TOE_SCORE = .4;
/** The flight after the takeoff is at least this long (s); the run-up's flights were 0.08-0.17 s. */
const TAKEOFF_FLIGHT = .25;
/** The steps reported before the takeoff. A third was in the picture in 2 videos of 4, at its edge, and its speed
 * differed 8% between the browsers (5.28 / 4.86 m/s); the last two within 4%. */
export const STEPS = 2;
/** Gravity's scale: the centre of mass fitted from FIT_MARGIN s after the toe-off to as much before the landing or
 * the end of the video, over at least GRAVITY_SPAN s. With 0.57-0.60 s it was within 4-7% of the trunk's scale
 * (2 videos, Chrome and WebKit); with 0.34-0.36 s, 8-16% off (recorded). */
const FIT_MARGIN = .02, GRAVITY_SPAN = .45;
/** The toe-off's velocity needs this much flight (s); 0.30-0.32 s were seen in two test videos. */
const LEAVE_SPAN = .2;
/** The trunk's share of the standing height (Drillis & Contini 1966; as the throws). */
const TRUNK_SHARE = .288;
/** The sole's contact with the ground below the toe at rest, in leg lengths (0.044-0.057 in the 4 test videos, both
 * browsers: 7-9 px under the toe point, read from the picture). The ruler's scale is taken at the sole's depth. */
const SOLE = .05;
/** The rough range of a speed, by the scale's source: the ruler (the athlete's trunk through it varied ±5% between
 * the test videos), the trunk near the takeoff (−8 to +2% against the ruler), gravity (11% off, twice). */
export const SPREADS = { ruler: .05, trunk: .10, gravity: .15 } as const;
/** A speed at a moment: a straight line through the centre of mass over ±SPEED_SECONDS. */
const SPEED_SECONDS = .0125, NEAREST = .04;

export interface LongJumpOptions {
  /** Picture size, so distances are measured in pixels alike in both axes. */
  width: number; height: number;
  /** The athlete's height (m), for the trunk's scale. */
  athleteHeight?: number | null;
  /** The ruler on the ground: its four points and its length (m). */
  ruler?: { points: RulerPoints; distance: number } | null;
}
/** One step before the takeoff: its contact, the flight after it, and the centre of mass's mean forward speed
 * from its touchdown to the next (px/s; m/s with the scale). */
export interface RunStep {
  /** 1 = the step before the takeoff (its touchdown is the penultimate), 2 = the one before, ... */
  before: number;
  contact: number | null; flight: number | null; stepTime: number | null;
  speedPx: number | null;
}
export interface LongJumpScale {
  pxPerM: number; source: keyof typeof SPREADS; flightSeen: number;
  gravity: number | null; trunk: number | null; ruler: RulerScale | null;
}
export interface LongJumpResult {
  version: string; reason: string | null; direction: number;
  contacts: Contact[];
  /** Index of the takeoff in `contacts`. */
  takeoff: number | null;
  /** The steps before the takeoff, nearest first (up to STEPS). */
  steps: RunStep[];
  /** The takeoff's contact time (s), reference. */
  takeoffContact: number | null;
  /** The centre of mass's forward speed (px/s): mean over the last two steps (two before → the takeoff's touchdown),
   * and at the takeoff's touchdown. */
  speed: { lastTwoPx: number | null; touchdownPx: number | null };
  /** The last step's time over the step before it's (below 1: quicker). Step lengths are not given (the user,
   * 2026-10-03: motion analysis, not distances; the run-up's speed was asked for). */
  rhythm: number | null;
  /** At the takeoff's toe-off, from the centre of mass in the flight: the horizontal and vertical (upward) speeds (px/s)
   * and the takeoff angle (°). Null without a scale. */
  leave: { horizontalPx: number; verticalPx: number; angle: number } | null;
  /** At the takeoff touchdown: the stance leg's hip-to-ankle line below the horizontal ahead (Bridgett & Linthorne 2006),
   * the trunk (forward positive) and the knee; the trunk at the penultimate touchdown. */
  posture: { legAngle: number | null; trunk: number | null; knee: number | null; trunkPenult: number | null };
  scale: LongJumpScale | null;
  moments: Phase[];
  notes: string[];
}

type T = { t: number; x: number; y: number };
/** Least squares slope of y on t. */
function line(ts: number[], ys: number[]) {
  const mt = ts.reduce((a, b) => a + b, 0) / ts.length, my = ys.reduce((a, b) => a + b, 0) / ys.length;
  return ts.reduce((a, t, i) => a + (t - mt) * (ys[i] - my), 0) / ts.reduce((a, t) => a + (t - mt) ** 2, 0);
}
/** Least squares y = a t² + b t + c (t from the mean). */
function parabola(ts: number[], ys: number[]) {
  const t0 = ts.reduce((a, b) => a + b, 0) / ts.length, T = ts.map(t => t - t0), n = T.length;
  const S = (k: number) => T.reduce((a, t) => a + t ** k, 0), Sy = (k: number) => T.reduce((a, t, i) => a + t ** k * ys[i], 0);
  const M = [[S(4), S(3), S(2)], [S(3), S(2), S(1)], [S(2), S(1), n]], v = [Sy(2), Sy(1), Sy(0)];
  const det = (m: number[][]) => m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) - m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) + m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]);
  const D = det(M);
  return { a: det(M.map((r, i) => r.map((x, j) => j === 0 ? v[i] : x))) / D };
}

/** The stance leg's side at a contact (0 left, 1 right landmarks): the toe nearest the contact's place. */
function sideAt(pose: CrouchPoint[], c: Contact, W: number, H: number): 0 | 1 | null {
  const d = [31, 32].map(k => visible(pose[k], .3) ? Math.hypot(pose[k].x * W - c.x, pose[k].y * H - c.groundY) : Infinity);
  return d[0] === Infinity && d[1] === Infinity ? null : d[0] <= d[1] ? 0 : 1;
}

export function analyzeLongJump(frames: readonly CrouchFrame[], options: LongJumpOptions): LongJumpResult {
  const { width: W, height: H } = options;
  const base: LongJumpResult = { version: LONG_JUMP_VERSION, reason: null, direction: 0, contacts: [], takeoff: null, steps: [], takeoffContact: null,
    speed: { lastTwoPx: null, touchdownPx: null }, rhythm: null, leave: null, posture: { legAngle: null, trunk: null, knee: null, trunkPenult: null },
    scale: null, moments: [], notes: [] };
  const fail = (reason: string) => ({ ...base, reason });
  const seen = frames.filter(f => f.pose).map(f => f.refined ? { ...f, pose: f.refined } : f);
  if (seen.length < 20) return fail('選手を十分に捉えられませんでした。真横から、全身が映るように撮影してください。');
  const leg = legLength(seen, W, H);
  if (!(leg > 0)) return fail('脚を十分に捉えられませんでした。');
  const hips = seen.flatMap(f => visible(f.pose![23], .3) && visible(f.pose![24], .3) ? [(f.pose![23].x + f.pose![24].x) / 2 * W] : []);
  const direction = hips.length > 1 ? Math.sign(hips.at(-1)! - hips[0]) : 0;
  if (!direction) return fail('走る向きを確認できませんでした。');
  base.direction = direction;

  // Contacts on the ground, in time order.
  // Feet held still in the air are left out before the contacts are put in order: a foot in the air taken for a
  // contact took the place of the real one after it (the contacts must each be ahead of the one before, synthetic test).
  const toes: Toe[] = seen.flatMap(f => TOE.filter(k => visible(f.pose![k], TOE_SCORE)).map(k => ({ t: f.pts, frame: f.frame, x: f.pose![k].x * W, y: f.pose![k].y * H })));
  const raw = plantsOf(plantedToes(toes, leg), leg);
  if (!raw.length) return fail('足の接地を見つけられませんでした。足元まで映るように撮影してください。');
  const ground = Math.max(...raw.map(p => p.y));
  const plants = contactPlants(raw.filter(p => ground - p.y < ABOVE_GROUND * leg), leg, direction);
  const firstSeen = seen[0].pts, lastSeen = seen.at(-1)!.pts;
  base.contacts = plants.map((p, i) => contactOf(p, i + 1, toes, leg, lastSeen, firstSeen));
  const C = base.contacts;
  // The takeoff: the contact followed by the long flight.
  const take = C.findIndex((c, i) => c.toeOff !== null && ((C[i + 1]?.touchdown ?? lastSeen) - c.toeOff) >= TAKEOFF_FLIGHT);
  if (take < 0) return fail('踏切（長い空中の前の接地）を見つけられませんでした。踏切の後の空中が映るように撮影してください。');
  base.takeoff = take;
  const T0 = C[take];
  base.takeoffContact = T0.touchdown !== null && T0.toeOff !== null ? T0.toeOff - T0.touchdown : null;

  // The centre of mass, its forward position over time.
  const com: T[] = seen.flatMap(f => { const c = centreOfMass(f.pose!); return c ? [{ t: f.pts, x: c.x * W, y: c.y * H }] : []; });
  // The centre of mass's place at a time: the median of the frames within ±SPEED_SECONDS, else of the three
  // nearest within NEAREST s (in one video it was missing just at a touchdown, a point below the score).
  const place = (t: number) => {
    let near = com.filter(q => Math.abs(q.t - t) <= SPEED_SECONDS);
    if (!near.length) near = com.filter(q => Math.abs(q.t - t) <= NEAREST).sort((a, b) => Math.abs(a.t - t) - Math.abs(b.t - t)).slice(0, 3);
    return near.length ? { t: median(near.map(q => q.t)), x: median(near.map(q => q.x)) } : null;
  };
  const forward = (from: number, to: number) => {
    const a = place(from), b = place(to);
    return a && b && b.t > a.t ? (b.x - a.x) * direction / (b.t - a.t) : null;
  };
  const speedAt = (t: number) => {
    const near = com.filter(q => Math.abs(q.t - t) <= SPEED_SECONDS);
    if (near.length < 3) return null;
    const mt = near.reduce((a, q) => a + q.t, 0) / near.length;
    return direction * near.reduce((a, q) => a + (q.t - mt) * q.x, 0) / near.reduce((a, q) => a + (q.t - mt) ** 2, 0);
  };

  // The steps before the takeoff, nearest first.
  for (let k = 1; k <= STEPS && take - k >= 0; k++) {
    const c = C[take - k], next = C[take - k + 1];
    const span = (a: number | null | undefined, b: number | null | undefined) => a != null && b != null ? b - a : null;
    base.steps.push({ before: k, contact: span(c.touchdown, c.toeOff), flight: span(c.toeOff, next.touchdown), stepTime: span(c.touchdown, next.touchdown),
      speedPx: c.touchdown !== null && next.touchdown !== null ? forward(c.touchdown, next.touchdown) : null });
  }
  const [s1, s2] = base.steps;
  if (!s1 || s1.contact === null) base.notes.push('踏切の1歩前の接地が映っていません。踏切の2〜3歩前から映るように撮影してください。');
  base.speed = {
    lastTwoPx: s2 && C[take - 2].touchdown !== null && T0.touchdown !== null ? forward(C[take - 2].touchdown!, T0.touchdown) : null,
    touchdownPx: T0.touchdown !== null ? speedAt(T0.touchdown) : null,
  };
  base.rhythm = s1?.stepTime != null && s2?.stepTime != null ? s1.stepTime / s2.stepTime : null;

  // Posture at the takeoff touchdown, the stance leg by place.
  const at = (frame: number | null) => frame === null ? null : seen.find(f => f.frame === frame)?.pose ?? null;
  const td = at(T0.touchdownFrame);
  if (td) {
    const s = sideAt(td, T0, W, H);
    if (s !== null && visible(td[23 + s], .3) && visible(td[27 + s], .3))
      base.posture.legAngle = Math.atan2((td[27 + s].y - td[23 + s].y) * H, (td[27 + s].x - td[23 + s].x) * W * direction) * 180 / Math.PI;
    base.posture.trunk = trunkAngle(td, W, H, direction, leg);
    base.posture.knee = s === null ? null : kneeAngle(td, s, W, H, leg);
  }
  const pen = s1 ? at(C[take - 1].touchdownFrame) : null;
  if (pen) base.posture.trunkPenult = trunkAngle(pen, W, H, direction, leg);

  // The scale: the ruler, else the trunk near the takeoff and the height entered, else gravity from the flight.
  const end = Math.min(C[take + 1]?.touchdown ?? lastSeen, lastSeen) - FIT_MARGIN;
  const flight = com.filter(q => q.t > T0.toeOff! + FIT_MARGIN && q.t < end);
  const flightSeen = flight.length > 1 ? flight.at(-1)!.t - flight[0].t : 0;
  const curved = flightSeen >= GRAVITY_SPAN && flight.length >= 20 ? 2 * parabola(flight.map(q => q.t), flight.map(q => q.y)).a / G : null;
  const gravity = curved && curved > 0 ? curved : null;
  const from = C[take - 2]?.touchdown ?? (T0.touchdown ?? T0.toeOff!) - .5;
  const trunks = seen.filter(f => f.pts >= from && f.pts <= T0.toeOff!).flatMap(f => [11, 12, 23, 24].every(k => visible(f.pose![k], .3))
    ? [Math.hypot(((f.pose![11].x + f.pose![12].x) - (f.pose![23].x + f.pose![24].x)) / 2 * W, ((f.pose![11].y + f.pose![12].y) - (f.pose![23].y + f.pose![24].y)) / 2 * H)] : []);
  const trunk = options.athleteHeight && trunks.length >= 10 ? median(trunks) / TRUNK_SHARE / options.athleteHeight : null;
  const ruler = options.ruler ? rulerScale(options.ruler.points, options.ruler.distance, { x: T0.x, y: T0.groundY + SOLE * leg }, W, H) : null;
  if (options.ruler && !ruler) base.notes.push('物差しの4点から縮尺を求められませんでした。踏切線と砂の始まりの点が、それぞれ奥と手前の縁に合っているか確かめてください。');
  if (ruler) base.scale = { pxPerM: ruler.pxPerM, source: 'ruler', flightSeen, gravity, trunk, ruler };
  else if (trunk) base.scale = { pxPerM: trunk, source: 'trunk', flightSeen, gravity, trunk, ruler: null };
  else if (gravity) base.scale = { pxPerM: gravity, source: 'gravity', flightSeen, gravity, trunk: null, ruler: null };
  else base.notes.push(`踏切の後の空中が${flightSeen.toFixed(2)}秒しか映っていないため、縮尺を求められませんでした。身長を入れるか、踏切板と砂場の物差しを合わせると速さを出します。`);
  if (ruler && trunk && Math.abs(trunk / ruler.pxPerM - 1) > .12)
    base.notes.push(`物差しからの縮尺と、身長・胴の長さからの縮尺が${Math.round(Math.abs(trunk / ruler.pxPerM - 1) * 100)}%違います。物差しの点と身長の入力を確かめてください。`);
  if (ruler && (ruler.across < -.25 || ruler.across > 1.25))
    base.notes.push('踏切足が物差しの奥と手前の縁の外にありました。物差しの点が助走路の縁に合っているか確かめてください。');

  // The toe-off's velocity: the flight's centre of mass, its height a parabola with the curvature of gravity at the
  // scale (with gravity's scale, the fitted one), its forward place a straight line. The curvature fitted freely to
  // 0.30 s of flight put the angle 2.4° below the fixed one (18.9 / 21.3°) in one video; fixed, the browsers were
  // within 0.2°.
  if (base.scale && flightSeen >= LEAVE_SPAN && flight.length >= 10) {
    const a = G * base.scale.pxPerM / 2, tau = flight.map(q => q.t - T0.toeOff!);
    const vertical = -line(tau, flight.map((q, i) => q.y - a * tau[i] ** 2)), horizontal = line(tau, flight.map(q => q.x)) * direction;
    base.leave = { horizontalPx: horizontal, verticalPx: vertical, angle: Math.atan2(vertical, horizontal) * 180 / Math.PI };
  }

  base.moments = momentsOf(base, frames, W, H, direction, leg);
  return base;
}

/** The pictures: the touchdowns of two steps before, of the step before and of the takeoff. */
function momentsOf(r: LongJumpResult, frames: readonly CrouchFrame[], W: number, H: number, direction: number, leg: number): Phase[] {
  const out: Phase[] = [], take = r.takeoff!;
  const add = (key: string, label: string, short: string, c: Contact | undefined, withLeg: boolean) => {
    const f = c?.touchdownFrame != null ? frames.find(q => q.frame === c.touchdownFrame && q.pose) : null, pose = f ? anglePose(f) : null;
    if (!c || !f || !pose) return;
    const s = sideAt(pose, c, W, H), marks: Mark[] = [];
    const tr = trunkAngle(pose, W, H, direction, leg);
    if (tr !== null) marks.push({ kind: 'trunk', label: tr < 0 ? '後傾' : '前傾', value: Math.abs(tr) });
    if (withLeg && s !== null) { const k = kneeAngle(pose, s, W, H, leg); if (k !== null) marks.push({ kind: 'knee', side: s, label: '踏切膝', value: k }); }
    out.push({ key, label, short, frame: f.frame, pts: f.pts, marks });
  };
  add('before2', '2歩前の接地', '2歩前', r.contacts[take - 2], false);
  add('penult', '1歩前の接地', '1歩前', r.contacts[take - 1], false);
  add('takeoff', '踏切の接地', '踏切接地', r.contacts[take], true);
  return out;
}

/** Metres per second from pixels per second with the scale; null without one. */
export const mps = (r: LongJumpResult, px: number | null) => px === null || !r.scale ? null : px / r.scale.pxPerM;
