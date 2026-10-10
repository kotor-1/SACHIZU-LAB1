/** High jump takeoff, filmed side-on to the takeoff (scissors; the user,
 * 2026-10-06: 「はるきとつばきの動画をもとに作りましょう」). Main measures, ones
 * research ties to the record (the user: 「記録向上につながる数値がメイン指標
 * じゃないといけません」):
 * - the upward speed of the centre of mass at the toe-off and the rise it gives
 *   in the air (H2 = v²/2g), in metres with the bar and the uprights as the ruler
 *   (camera.ts); the user: 「上向きの速さ・上がった高さはメインに欲しい」;
 * - the rhythm of the last two steps;
 * - the backward lean at the takeoff touchdown (stance ankle to the centre of mass).
 * Contact times, knee angles, the takeoff angle and the share of the run-up's
 * speed turned upward are reference records. Method and checks:
 * docs/HighJump_Feasibility_20261006.md and docs/HighJump_Research_20261006.md. */
import { centreOfMass } from '../hurdling/analysis';
import { anglePose, type CrouchFrame, type CrouchPoint } from '../sprint10/crouch';
import { contactOf, contactPlants, legLength, median, plantedToes, plantsOf, toesOf, type Contact } from '../sprint10/contacts';
import { editContacts, type Edits } from '../sprint10/moment-edits';
import { kneeAngle, thighAngle, trunkAngle } from '../sprint10/angles';
import type { Mark, Phase } from '../sprint10/crouch-figure';
import { calibrate, vec, type Calibration, type UprightPoints, type Vec } from './camera';

export const HIGH_JUMP_VERSION = 'highjump-v1-experimental';
const G = 9.81;
/** A contact more than this many leg lengths above the lowest is not on the ground (a foot held still in the air, the landing on the mat). */
const GROUND_SPREAD = .4;
/** The upward speed is fitted on the centre of mass from just after the toe-off to FIT_END s after it, with gravity fixed:
 * the skeleton held through the rise there in all four test videos (to about 0.13 s in the flop's back arch).
 * FIT_CHECK: a second fit, longer, whose difference is reported when above UNSTABLE m/s. */
const FIT_START = .003, FIT_END = .1, FIT_CHECK = .11, UNSTABLE = .15;
/** Standard uprights stand 4.00-4.04 m apart (a 4.00 m bar); the test videos gave 4.13-4.20 m between the points set on their feet
 * at the bar heights the user remembered (1.20 m; 1.25 m gave 4.32-4.38). Outside this the bar height or the points are suspect. */
export const SPACING = [3.9, 4.3] as const;
/** Four points fitting one camera to within this (pixels, rms); further, a point is off. */
const RMS_MAX = 4;
/** The last step seen at less than this from side-on (degrees): heights are still read at the athlete's distance, but a turned plane moves them (±15° moved the speed 2%). */
const VIEW_MIN = 65;
/** The pose model's score is not required (RTMPose's points kept their place in the early flight while their scores fell: with a 0.3 floor, 4 of 18 frames remained in つばき's fit). */
const ANY_SCORE = 0;

export interface HighJumpOptions {
  /** Picture size (pixels). */
  width: number; height: number;
  /** Both uprights as set on the first frame (normalized 0-1): each foot and where the bar meets it. */
  uprights: UprightPoints;
  /** The bar's height (m, to its top). */
  barHeight: number;
  /** Focal length (pixels); by default the iPhone's 1x video (camera.ts). */
  focal?: number;
  /** The frames the user set for the judged moments (`td{n}`, `to{n}` of contact n; sprint10/moment-edits.ts). */
  edits?: Edits;
}
export interface Lift {
  /** Upward speed of the centre of mass at the toe-off (m/s), its height then (m), the rise it gives (m) and the peak (m), and the peak above the bar (m). */
  speed: number; h1: number; h2: number; peak: number; overBar: number;
  /** The same speed from a longer fit (m/s): a check. */
  speedCheck: number;
  /** Reference: the angle of the centre of mass's flight from horizontal at the toe-off (degrees), and the upward speed over the horizontal speed at the touchdown. */
  angle: number | null; conversion: number | null;
  /** The centre of mass's height (m) by time from the toe-off (s), the frames fitted marked. */
  path: { t: number; z: number; fitted: boolean }[];
}
export interface HighJumpTimes {
  /** The contact two steps before the takeoff, its flight; the step before the takeoff and its flight; the takeoff (s). */
  beforeContact: number | null; beforeFlight: number | null; penultContact: number | null; lastFlight: number | null; takeoffContact: number | null;
  /** Touchdown to touchdown: the step before the last (two steps before → one step before) and the last step (one step before → takeoff). */
  stepBefore: number | null; lastStep: number | null;
}
export interface HighJumpPosture {
  /** Backward lean at the takeoff touchdown: stance ankle to the centre of mass from vertical, positive with the ankle ahead (degrees). */
  lean: number | null;
  /** Takeoff knee at the touchdown, most bent and at the toe-off; trunk at the touchdown and toe-off (forward positive); the swing leg's thigh at the toe-off (90 = level). */
  kneeTouchdown: number | null; kneeLeast: number | null; kneeToeOff: number | null; leastFrame: number | null;
  trunkTouchdown: number | null; trunkToeOff: number | null; swingThigh: number | null;
}
export interface HighJumpResult {
  version: string; reason: string | null; direction: number;
  contacts: Contact[];
  /** Indices into `contacts`: the takeoff, the step before it and the one before that (null when not in the picture). */
  takeoff: number | null; penult: number | null; before: number | null;
  times: HighJumpTimes;
  /** The last step's time over the step before it's (below 1: the last step quicker). */
  rhythm: number | null;
  posture: HighJumpPosture;
  /** The camera from the uprights; null when the four points fit none. */
  camera: (Pick<Calibration, 'spacing' | 'height' | 'pitch' | 'rms'> & { distance: number | null; view: number | null }) | null;
  lift: Lift | null;
  /** The lean as drawn on the touchdown's picture: the stance ankle and the centre of mass (normalized) at that frame. */
  leanLine: { frame: number; ankle: { x: number; y: number }; com: { x: number; y: number } } | null;
  /** The centre of mass's place (normalized) at each frame used. */
  comAt: Record<number, { x: number; y: number }>;
  moments: Phase[];
  notes: string[];
}

const toPixel = (p: { x: number; y: number }, W: number, H: number) => ({ x: p.x * W, y: p.y * H });
function line(ts: number[], ys: number[]) {
  const n = ts.length, mt = ts.reduce((a, b) => a + b, 0) / n, my = ys.reduce((a, b) => a + b, 0) / n;
  const k = ts.reduce((a, t, i) => a + (t - mt) * (ys[i] - my), 0) / ts.reduce((a, t) => a + (t - mt) ** 2, 0);
  return { slope: k, at0: my - k * mt };
}

export function analyzeHighJump(frames: readonly CrouchFrame[], options: HighJumpOptions): HighJumpResult {
  const { width: W, height: H } = options;
  const base: HighJumpResult = { version: HIGH_JUMP_VERSION, reason: null, direction: 0, contacts: [], takeoff: null, penult: null, before: null,
    times: { beforeContact: null, beforeFlight: null, penultContact: null, lastFlight: null, takeoffContact: null, stepBefore: null, lastStep: null },
    rhythm: null, posture: { lean: null, kneeTouchdown: null, kneeLeast: null, kneeToeOff: null, leastFrame: null, trunkTouchdown: null, trunkToeOff: null, swingThigh: null },
    camera: null, lift: null, leanLine: null, comAt: {}, moments: [], notes: [] };
  const fail = (reason: string) => ({ ...base, reason });
  const seen = frames.filter(f => f.pose).map(f => f.refined ? { ...f, pose: f.refined } : f);
  if (seen.length < 20) return fail('選手を十分に捉えられませんでした。踏切の動きを真横から、全身が映るように撮影してください。');
  const leg = legLength(seen, W, H);
  if (!(leg > 0)) return fail('脚を十分に捉えられませんでした。');
  const hipX = (p: CrouchPoint[]) => (p[23].x + p[24].x) / 2;
  const direction = Math.sign(hipX(seen.at(-1)!.pose!) - hipX(seen[0].pose!));
  if (!direction) return fail('走る向きを確認できませんでした。');
  base.direction = direction;

  // Ground contacts, as the hurdle (RTMPose's toes, both sides pooled); the takeoff is the last on the ground.
  // Places above the ground are left out before the contacts are chosen: a foot carried low and slowly in the air
  // otherwise came first, and the step after it, too close behind, was dropped (a test's swing foot).
  const toes = toesOf(seen, W, H), places = plantsOf(plantedToes(toes, leg), leg);
  if (!places.length) return fail('踏切の接地を見つけられませんでした。踏切の3歩前から上昇まで、足元が映るように撮影してください。');
  const ground = Math.max(...places.map(p => p.y));
  base.contacts = contactPlants(places.filter(p => ground - p.y < GROUND_SPREAD * leg), leg, direction)
    .map((p, i) => contactOf(p, i + 1, toes, leg, seen.at(-1)!.pts, seen[0].pts));
  if (options.edits) base.contacts = editContacts(base.contacts, options.edits, frames);
  if (!base.contacts.length) return fail('踏切の接地を見つけられませんでした。踏切の3歩前から上昇まで、足元が映るように撮影してください。');
  const n = base.contacts.length;
  base.takeoff = n - 1; base.penult = n > 1 ? n - 2 : null; base.before = n > 2 ? n - 3 : null;
  const c = (i: number | null) => i === null ? null : base.contacts[i];
  const [B, P, T] = [c(base.before), c(base.penult), c(base.takeoff)!];
  const span = (a: number | null | undefined, b: number | null | undefined) => a != null && b != null ? b - a : null;
  base.times = { beforeContact: span(B?.touchdown, B?.toeOff), beforeFlight: span(B?.toeOff, P?.touchdown), penultContact: span(P?.touchdown, P?.toeOff),
    lastFlight: span(P?.toeOff, T.touchdown), takeoffContact: span(T.touchdown, T.toeOff), stepBefore: span(B?.touchdown, P?.touchdown), lastStep: span(P?.touchdown, T.touchdown) };
  if (base.times.stepBefore && base.times.lastStep) base.rhythm = base.times.lastStep / base.times.stepBefore;
  if (T.toeOff === null) base.notes.push('踏切の離地が映っていません。踏切の後の上昇まで映るように撮影してください。');
  if (T.touchdown === null) base.notes.push('踏切の接地の瞬間が映っていません。踏切の3歩前から映るように撮影してください。');
  if (!P) base.notes.push('踏切の1歩前の接地が映っていないため、リズムを出していません。');

  // Posture: each value the median of the frame and its neighbours (single frames whose leg came off the body: recorded).
  const index = new Map(seen.map((f, i) => [f.frame, i]));
  const stance = (p: CrouchPoint[], contact: Contact) => Math.abs(p[31].x * W - contact.x) <= Math.abs(p[32].x * W - contact.x) ? 0 : 1;
  const around = (frame: number, value: (p: CrouchPoint[]) => number | null) => {
    const i = index.get(frame); if (i === undefined) return null;
    const vs = [i - 1, i, i + 1].filter(j => j >= 0 && j < seen.length).map(j => value(seen[j].pose!)).filter((v): v is number => v !== null);
    return vs.length ? median(vs) : null;
  };
  const comOf = (p: CrouchPoint[]) => centreOfMass(p, ANY_SCORE);
  const lean = (p: CrouchPoint[]) => { const s = stance(p, T), a = p[27 + s], m = comOf(p); if (!m) return null;
    return Math.atan2((a.x - m.x) * W * direction, (a.y - m.y) * H) * 180 / Math.PI; };
  const knee = (p: CrouchPoint[]) => kneeAngle(p, stance(p, T), W, H, leg);
  if (T.touchdownFrame !== null) {
    base.posture.lean = around(T.touchdownFrame, lean);
    // A touchdown set by hand on a frame without the athlete's pose (確認 lets any frame be chosen) has no line drawn:
    // read as there, it threw and the page was replaced by its error screen.
    const k = index.get(T.touchdownFrame), f = k === undefined ? undefined : seen[k];
    const m = f?.pose ? comOf(f.pose) : null, a = f?.pose ? f.pose[27 + stance(f.pose, T)] : null;
    if (f && m && a) base.leanLine = { frame: f.frame, ankle: { x: a.x, y: a.y }, com: m };
    base.posture.kneeTouchdown = around(T.touchdownFrame, knee);
    base.posture.trunkTouchdown = around(T.touchdownFrame, p => trunkAngle(p, W, H, direction, leg));
  }
  if (T.toeOffFrame != null) {
    base.posture.kneeToeOff = around(T.toeOffFrame, knee);
    base.posture.trunkToeOff = around(T.toeOffFrame, p => trunkAngle(p, W, H, direction, leg));
    base.posture.swingThigh = around(T.toeOffFrame, p => thighAngle(p, (1 - stance(p, T)) as 0 | 1, W, H, direction, leg));
  }
  if (T.touchdownFrame !== null && T.toeOffFrame != null) {
    const least = seen.filter(f => f.frame >= T.touchdownFrame! && f.frame <= T.toeOffFrame!).map(f => ({ frame: f.frame, v: around(f.frame, knee) }))
      .filter((q): q is { frame: number; v: number } => q.v !== null).reduce<{ frame: number; v: number } | null>((a, q) => !a || q.v < a.v ? q : a, null);
    if (least) { base.posture.kneeLeast = least.v; base.posture.leastFrame = least.frame; }
  }

  // The camera from the uprights, and the centre of mass in metres on the plane of the last step.
  const pts = (q: { x: number; y: number }) => toPixel(q, W, H), u = options.uprights;
  const cal = calibrate({ left: { foot: pts(u.left.foot), bar: pts(u.left.bar) }, right: { foot: pts(u.right.foot), bar: pts(u.right.bar) } },
    options.barHeight, W, H, options.focal);
  if (!cal) base.notes.push('支柱の点からカメラの位置を決められませんでした。左右の支柱の根元とバーの位置に点を合わせ直してください。上向きの速さと上がった高さは出していません。');
  else {
    base.camera = { spacing: cal.spacing, height: cal.height, pitch: cal.pitch, rms: cal.rms, distance: null, view: null };
    if (cal.spacing < SPACING[0] || cal.spacing > SPACING[1])
      base.notes.push(`支柱の間隔が ${cal.spacing.toFixed(2)} m になりました（規格の支柱は約4 m）。バーの高さの入力と、支柱の根元・バーの位置の点を確かめてください。`);
    if (cal.rms > RMS_MAX) base.notes.push('支柱の4つの点が1つのカメラの位置に合いません。根元とバーの位置の点を確かめてください。');
  }
  if (cal && T.toeOff !== null && T.toeOffFrame != null && P) {
    const cam = cal.camera, onGround = (x: number, y: number) => cam.onPlane(x, y, [0, 0, 1], 0);
    const F = onGround(T.x, T.groundY), Q = onGround(P.x, P.groundY);
    if (F && Q) {
      let along: Vec = [F[0] - Q[0], F[1] - Q[1], 0]; along = vec.mul(along, 1 / vec.norm(along));
      const normal: Vec = [along[1], -along[0], 0], d = vec.dot(normal, F), sight = vec.sub(F, cam.C);
      base.camera!.distance = vec.norm(sight);
      base.camera!.view = Math.acos(Math.min(1, Math.abs(vec.dot(along, sight)) / vec.norm(sight))) * 180 / Math.PI;
      if (base.camera!.view < VIEW_MIN) base.notes.push(`最後の1歩を斜め（${Math.round(base.camera!.view)}°）から見ています。踏切の動きの真横から撮ると、上向きの速さがより正確になります。`);
      const to = T.toeOff, td = T.touchdown;
      const path = seen.filter(f => f.pts >= (td ?? to) - .06 && f.pts <= to + .35).flatMap(f => {
        const m = comOf(f.pose!); if (!m) return [];
        const X = cam.onPlane(m.x * W, m.y * H, normal, d); if (!X) return [];
        base.comAt[f.frame] = m;
        return [{ t: f.pts - to, z: X[2], s: vec.dot(vec.sub(X, F), along) }];
      });
      const fit = (end: number) => { const use = path.filter(p => p.t > FIT_START && p.t <= end); if (use.length < 8) return null;
        const l = line(use.map(p => p.t), use.map(p => p.z + G / 2 * p.t * p.t)); return { speed: l.slope, h1: l.at0 }; };
      const main = fit(FIT_END), check = fit(FIT_CHECK);
      if (!main || !check) base.notes.push('離地の後の重心を十分に捉えられず、上向きの速さを出していません。踏切の後の上昇まで映るように撮影してください。');
      else {
        const horizontal = (a: number, b: number) => { const s = path.filter(p => p.t >= a && p.t <= b); return s.length >= 4 ? line(s.map(p => p.t), s.map(p => p.s)).slope : null; };
        const before = td === null ? null : horizontal(td - to - .04, td - to), after = horizontal(FIT_START, .06);
        const h2 = main.speed > 0 ? main.speed ** 2 / (2 * G) : 0;
        base.lift = { speed: main.speed, h1: main.h1, h2, peak: main.h1 + h2, overBar: main.h1 + h2 - options.barHeight, speedCheck: check.speed,
          angle: after !== null && after > 0 ? Math.atan2(main.speed, after) * 180 / Math.PI : null, conversion: before !== null && before > 0 ? main.speed / before : null,
          path: path.map(p => ({ t: p.t, z: p.z, fitted: p.t > FIT_START && p.t <= FIT_END })) };
        if (Math.abs(main.speed - check.speed) > UNSTABLE) base.notes.push('離地直後の重心の動きが安定せず、上向きの速さは目安です（計算に使う時間を変えると0.15 m/s以上変わりました）。');
      }
    }
  }

  // The pictures: the step before, the takeoff's touchdown (the lean drawn on it), the knee most bent and the toe-off.
  const at = (frame: number | null | undefined) => frame == null ? null : frames.find(f => f.frame === frame && f.pose) ?? null;
  const SHORT: Record<string, string> = { penult: '1歩前', touchdown: '踏切接地', least: '最も曲がる', toeOff: '離地' };
  const add = (key: string, label: string, f: CrouchFrame | null, marks: (p: CrouchPoint[]) => (Mark | null)[]) => {
    if (!f) return;
    base.moments.push({ key, label, short: SHORT[key], frame: f.frame, pts: f.pts, marks: marks(anglePose(f)!).filter((m): m is Mark => m !== null) });
  };
  // The trunk named by the way it leans (at the takeoff it leans back: 「体幹 −11°」 read badly).
  const trunk = (p: CrouchPoint[]): Mark | null => { const v = trunkAngle(p, W, H, direction, leg);
    return v === null ? null : { kind: 'trunk', label: v < 0 ? '体幹の後傾' : '体幹の前傾', value: Math.abs(v) }; };
  const kneeMark = (p: CrouchPoint[], contact: Contact, label: string): Mark | null => { const s = stance(p, contact), v = kneeAngle(p, s, W, H, leg);
    return v === null ? null : { kind: 'knee', side: s, label, value: v }; };
  if (P) add('penult', '踏切の1歩前の接地', at(P.touchdownFrame), p => [trunk(p), kneeMark(p, P, '支持脚の膝')]);
  add('touchdown', '踏切の接地', at(T.touchdownFrame), p => [kneeMark(p, T, '踏切膝'), trunk(p)]);
  add('least', '踏切脚の膝が最も曲がった時', at(base.posture.leastFrame), p => [kneeMark(p, T, '踏切膝')]);
  add('toeOff', '踏切の離地', at(T.toeOffFrame), p => { const s = stance(p, T), o = (1 - s) as 0 | 1, thigh = thighAngle(p, o, W, H, direction, leg);
    return [kneeMark(p, T, '踏切膝'), thigh === null ? null : { kind: 'thigh', side: o, label: '振り上げ脚の大腿', value: thigh }, trunk(p)]; });
  return base;
}
