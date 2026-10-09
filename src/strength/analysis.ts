/** The bodyweight squat and Romanian deadlift (RDL, on two legs or one) filmed from the side: the reps, and in each the
 * posture at the bottom and the times down and up (the user, 2026-10-08: 「真横から、横向きの動作を見て角度などを解析し、
 * スクワットとルーマニアンデッドリフトのフォームを自分で改善できるように」「バーベルじゃなくて自体重のエクササイズ想定」,
 * the RDL 「両方」).
 *
 * Angles and ratios only, no distances (no ruler; [[motion-analysis-only]]). On two legs both sides' points are
 * averaged: from the side the legs overlap, and a model swapping left and right in one frame (common side-on) then
 * changes nothing. On one leg the standing leg is, in each frame, the one whose ankle is lower (the other is lifted
 * behind), whatever the model called it.
 * The same function serves the recorded video (MediaPipe for the timing, RTMPose for the angles) and the camera
 * (MediaPipe only), so a rep is found the same way in both. */
import type { CrouchFrame, CrouchPoint } from '../sprint10/crouch';

export type Exercise = 'squat' | 'rdl' | 'slrdl';
export const EXERCISES: Record<Exercise, string> = { squat: 'スクワット', rdl: 'RDL（両脚）', slrdl: 'RDL（片脚）' };
/** Hinges (the reps by the trunk's lean) and the one-legged one. */
export const hinge = (e: Exercise) => e !== 'squat';
export const STRENGTH_VERSION = 'strength-v1';
export interface StrengthOptions { width: number; height: number; exercise: Exercise }

/** Points used below 0.3 visibility are left out (as the crouch start). */
const SEEN = .3;
const deg = (r: number) => r * 180 / Math.PI;
const median = (v: number[]) => { const a = [...v].sort((x, y) => x - y); return a.length ? a.length % 2 ? a[a.length >> 1] : (a[a.length / 2 - 1] + a[a.length / 2]) / 2 : NaN; };
const seen = (p?: CrouchPoint) => !!p && Number.isFinite(p.x) && Number.isFinite(p.y) && (p.visibility ?? 1) >= SEEN;

type P = { x: number; y: number };
/** The middle of the left and right points (pixels), or the one seen. */
function both(pose: readonly CrouchPoint[], left: number, W: number, H: number): P | null {
  const a = pose[left], b = pose[left + 1], sa = seen(a), sb = seen(b);
  if (sa && sb) return { x: (a.x + b.x) / 2 * W, y: (a.y + b.y) / 2 * H };
  return sa ? { x: a.x * W, y: a.y * H } : sb ? { x: b.x * W, y: b.y * H } : null;
}
const one = (pose: readonly CrouchPoint[], i: number, W: number, H: number): P | null => seen(pose[i]) ? { x: pose[i].x * W, y: pose[i].y * H } : null;
/** MediaPipe's left/right pairs (eyes, ears, mouth, then shoulders to toes). */
export const PAIRS = [[1, 4], [2, 5], [3, 6], [7, 8], [9, 10], ...Array.from({ length: 11 }, (_, k) => [11 + 2 * k, 12 + 2 * k])];
/** On both legs, the body of the nearer side. From the side the knees and feet of a stance a shoulder width apart do not
 * overlap, and their middles floated between the near and the far shoe (the user's squat screenshots, 2026-10-09:
 * 「スケルトンズレてるじゃん」). The nearer leg lies lower in the picture (below the camera at the waist, the nearer of two
 * points lies lower), told from the knees and the feet together, so a joint the model names the other way in one frame
 * does not decide it. Every point is taken from that side: the shoulder, hip, knee and ankle of one side lie in one
 * plane and keep their angles in the picture, while the middle hip with the near knee steepened the thigh by up to 20°
 * (the test videos). Legs about level (overlapping) are averaged, as before; the near side's share grows with the
 * height between the legs up to NEAR_GAP of the picture's height, so the points never jump from one side to the other.
 * Both landmark sides get the point. */
const NEAR_GAP = .02;
export function nearPose(pose: readonly CrouchPoint[]): CrouchPoint[] {
  let gap = 0, n = 0;
  for (const i of [25, 27, 29, 31]) if (seen(pose[i]) && seen(pose[i + 1])) { gap += pose[i].y - pose[i + 1].y; n++; }
  const near = n && gap < 0 ? 1 : 0, w = n ? .5 + .5 * Math.min(1, Math.abs(gap / n) / NEAR_GAP) : .5, out = pose.map(p => ({ ...p }));
  for (const [l, r] of PAIRS) {
    const a = pose[near ? r : l], b = pose[near ? l : r];
    if (!a || !b) continue;
    const q = seen(a) && seen(b) ? { x: a.x * w + b.x * (1 - w), y: a.y * w + b.y * (1 - w), visibility: Math.min(a.visibility ?? 1, b.visibility ?? 1) }
      : seen(a) ? { ...a } : seen(b) ? { ...b } : null;
    if (q) { out[l] = q; out[r] = { ...q }; }
  }
  return out;
}
/** The standing leg (0 left, 1 right in the model's names): the lower ankle, or the one seen. */
export function stanceSide(pose: readonly CrouchPoint[]): 0 | 1 | null {
  const a = seen(pose[27]), b = seen(pose[28]);
  return a && b ? pose[27].y >= pose[28].y ? 0 : 1 : a ? 0 : b ? 1 : null;
}
/** The body's points in one frame (pixels): on both legs the nearer side's (`nearPose`), on one leg (`single`) the
 * shoulders and hips at the middle of both sides and the standing leg's knee and foot, with the lifted leg's knee and
 * ankle as `free`. */
export function bodyOf(pose: readonly CrouchPoint[] | null | undefined, W: number, H: number, fallback?: readonly CrouchPoint[] | null, single = false) {
  if (!pose) return null;
  if (!single) {
    const q = nearPose(pose), f = fallback ? nearPose(fallback) : null, at = (i: number) => both(q, i, W, H) ?? (f ? both(f, i, W, H) : null);
    return { ear: at(7), shoulder: at(11), wrist: at(15), hip: at(23), knee: at(25), ankle: at(27), heel: at(29), toe: at(31), free: null };
  }
  const at = (i: number) => both(pose, i, W, H) ?? (fallback ? both(fallback, i, W, H) : null);
  const upper = { ear: at(7), shoulder: at(11), wrist: at(15), hip: at(23) };
  const s = stanceSide(pose);
  if (s === null) return { ...upper, knee: null, ankle: null, heel: null, toe: null, free: null };
  const leg = (k: 0 | 1) => ({ knee: one(pose, 25 + k, W, H), ankle: one(pose, 27 + k, W, H) });
  return { ...upper, ...leg(s), heel: one(pose, 29 + s, W, H), toe: one(pose, 31 + s, W, H), free: leg((1 - s) as 0 | 1) };
}
type Body = NonNullable<ReturnType<typeof bodyOf>>;

/** One frame's posture, degrees, forward (the way the athlete faces) positive:
 * - knee, hip: the joint's angle, 180 = straight (as the app's other angles; hip: trunk against thigh);
 * - trunk: hip-to-shoulder line forward of the vertical; shank: ankle-to-knee forward of the vertical;
 * - thigh: hip-to-knee line against the horizontal, the hip below the knee positive (0 = thigh level);
 * - foot: heel-to-toe line against the horizontal, the heel up positive;
 * - neck: shoulder-to-ear line against the trunk line (the head forward/down positive);
 * - bar: the shoulders forward of the midfoot, in foot lengths: the bar on the back (squat), or hanging below them on
 *   straight arms (RDL; the hands are hidden behind the near plate from the side, and their points wander: a test video);
 *   legGap (RDL): the hands forward of the line ankle-knee-hip they slide down, in leg lengths (kept in the saved result);
 * - height: the hip above the ankle in leg lengths; barY: the shoulders' height in pixels (up positive), the bar's;
 * - line (one leg): shoulder-hip-lifted ankle, 180 = the trunk and the lifted leg in one straight line; legBelow: the
 *   lifted ankle below the trunk's line carried on past the hip (the leg lagging), else above it (lifted too high).
 *   On one leg the knee, hip, shank, thigh and foot are the standing leg's. */
export interface Posture {
  frame: number; pts: number;
  knee: number | null; hip: number | null; trunk: number | null; shank: number | null; thigh: number | null;
  foot: number | null; neck: number | null; bar: number | null; legGap: number | null; height: number | null; barY: number | null;
  line: number | null; legBelow: boolean | null;
}
const angleAt = (a: P, v: P, b: P) => {
  const c = ((a.x - v.x) * (b.x - v.x) + (a.y - v.y) * (b.y - v.y)) / (Math.hypot(a.x - v.x, a.y - v.y) * Math.hypot(b.x - v.x, b.y - v.y));
  return deg(Math.acos(Math.max(-1, Math.min(1, c))));
};
/** Distance of p from the polyline through the points (pixels), positive forward (`d`). */
function aheadOf(p: P, line: P[], d: number) {
  let best: number | null = null;
  for (let i = 0; i + 1 < line.length; i++) {
    const a = line[i], b = line[i + 1], lo = Math.min(a.y, b.y), hi = Math.max(a.y, b.y);
    if (p.y < lo - 1 || p.y > hi + 1 || hi - lo < 1) continue;
    const x = a.x + (b.x - a.x) * (p.y - a.y) / (b.y - a.y), v = (p.x - x) * d;
    if (best === null || Math.abs(v) < Math.abs(best)) best = v;
  }
  return best;
}
export function postureOf(f: CrouchFrame, body: Body | null, o: StrengthOptions, d: number, leg: number, foot: number, timing: Body | null): Posture {
  // The timing's height and bar from MediaPipe's points even where the angles have none.
  const t = timing ?? body, top = t?.shoulder;
  const timed = { height: t?.hip && t.ankle && leg > 0 ? (t.ankle.y - t.hip.y) / leg : null, barY: top ? -top.y : null };
  const b = body;
  if (!b) return { frame: f.frame, pts: f.pts, knee: null, hip: null, trunk: null, shank: null, thigh: null, foot: null, neck: null, bar: null, legGap: null, line: null, legBelow: null, ...timed };
  const { shoulder: s, hip: h, knee: k, ankle: a, heel, toe, ear, wrist } = b;
  const up = (from: P, to: P) => deg(Math.atan2((to.x - from.x) * d, from.y - to.y));
  const bar = s;
  const mid = heel && toe ? { x: (heel.x + toe.x) / 2, y: (heel.y + toe.y) / 2 } : null;
  return { frame: f.frame, pts: f.pts,
    knee: h && k && a ? angleAt(h, k, a) : null,
    hip: s && h && k ? angleAt(s, h, k) : null,
    trunk: s && h ? up(h, s) : null,
    shank: k && a ? up(a, k) : null,
    thigh: h && k ? deg(Math.atan2(h.y - k.y, Math.abs(k.x - h.x))) : null,
    foot: heel && toe ? deg(Math.atan2(toe.y - heel.y, Math.abs(toe.x - heel.x))) : null,
    neck: ear && s && h ? up(s, ear) - up(h, s) : null,
    bar: bar && mid && foot > 0 ? (bar.x - mid.x) * d / foot : null,
    legGap: o.exercise === 'rdl' && wrist && h && k && a ? (v => v === null ? null : v / leg)(aheadOf(wrist, [h, k, a], d)) : null,
    line: b.free?.ankle && s && h ? angleAt(s, h, b.free.ankle) : null,
    legBelow: b.free?.ankle && s && h && Math.abs(h.x - s.x) > 1 ? b.free.ankle.y > h.y + (h.y - s.y) / (h.x - s.x) * (b.free.ankle.x - h.x) : null,
    ...timed };
}

/** A rep: from the start down to the end up (s; times between where the depth passes REST of the rep's range from its
 * standing level), the bottom where it is deepest. */
export interface Rep {
  index: number;
  start: number; bottom: number; end: number; startFrame: number; bottomFrame: number; endFrame: number;
  /** Down (start to bottom) and up (bottom to end), s. */
  down: number; up: number;
  /** The posture standing before the rep (each angle's median over the frames at rest) and at the bottom. */
  top: Posture; low: Posture;
  /** The most the heel rose during the rep against the start (foot angle, degrees). */
  heelRise: number | null;
  /** The bar's farthest from the midfoot during the rep (foot lengths, signed). */
  barDrift: number | null;
  /** RDL: the hands' farthest forward of the legs on the way down (leg lengths). */
  maxGap: number | null;
  /** The bar's mean speed up (pixels/s; only to compare the reps of one video) and its fall against the fastest rep (%). */
  speed: number | null; loss: number | null;
  /** Back at rest or the next rep begun (live: told once settled). */
  settled: boolean;
}
/** A frame of a recorded set; `fine`: its pose read again with RTMPose-l (fine.ts), the angles' frames. */
export type StrengthFrame = CrouchFrame & { fine?: boolean };
export interface StrengthResult {
  exercise: Exercise; version: string;
  /** +1: the athlete faces right in the picture. */
  direction: number;
  /** Shoulders' width seen against the trunk (0 from the exact side, ~0.8-1 from the front). */
  view: number | null;
  reps: Rep[]; postures: Posture[];
  /** The angles are RTMPose's (a recorded video); else MediaPipe's alone (the camera), whose heel and toe wander too
   * much to tell a heel rising (test videos: 41-64° of "rise" with the heel down). */
  refined: boolean;
  /** The athlete's leg (hip to ankle) in the picture's pixels: small, the points wander. */
  size: number | null;
  /** Why there is no result. */
  reason?: string;
  notes: string[];
}

/** Shoulders spread more than this against the trunk (about 50° or more off the side): no result. */
export const FRONT_VIEW = .6;
/** Depth signal: how far into the rep (squat: the hip's drop in leg lengths; RDL: the trunk's lean in degrees), and the
 * least range a rep needs (a quarter squat drops the hip ~0.2 leg; an RDL leans the trunk 45° and more). */
const MIN_RANGE: Record<Exercise, number> = { squat: .12, rdl: 20, slrdl: 20 };
/** A rep starts and ends where the depth is within REST of its range from the standing level; it counts only when it
 * comes back up at least RETURN of the way (at 0.7 the user's last squat, the video ending as the hips came up to 0.91
 * of their standing height, was missed). */
export const REST = .1, RETURN = .6;
/** Down and up each take at least this long (s): a quicker one is the points jumping (a cut in a video, another person
 * taken for a frame), not a rep (a stock video's cut gave one of 0.11 s down and 0.09 s up). */
export const MIN_PHASE = .2;
/** A rep starting deeper than this share of the reps' usual range below the set's standing level is not counted. */
export const LOW_START = .4;
/** Frames apart before the depth is smoothed: a median of 5 then a mean of 3. */
function smooth(v: (number | null)[]): (number | null)[] {
  const m = v.map((_, i) => { const w = v.slice(Math.max(0, i - 2), i + 3).filter((x): x is number => x !== null); return v[i] === null || w.length < 3 ? v[i] : median(w); });
  return m.map((x, i) => { if (x === null) return null; const w = m.slice(Math.max(0, i - 1), i + 2).filter((y): y is number => y !== null); return w.reduce((s, y) => s + y, 0) / w.length; });
}
/** A depth this far from the median of the frames round it (±SPIKE_FRAMES) is the points jumping, not the body
 * (squat: leg lengths; hinges: degrees). A smooth movement keeps to its neighbours' median; the camera's MediaPipe on
 * a small athlete bent level read the trunk -153° for a while (a camera test). The trunk's lean outside LEAN_RANGE is
 * no hinge. */
const SPIKE: Record<Exercise, number> = { squat: .2, rdl: 35, slrdl: 35 }, SPIKE_FRAMES = 4, LEAN_RANGE = [-40, 150] as const;
function despike(v: (number | null)[], limit: number): (number | null)[] {
  return v.map((x, i) => {
    if (x === null) return null;
    const w = v.slice(Math.max(0, i - SPIKE_FRAMES), i + SPIKE_FRAMES + 1).filter((y): y is number => y !== null);
    return w.length >= 3 && Math.abs(x - median(w)) > limit ? null : x;
  });
}
/** Where the depth passes `level` between frames i and j (time, linear between the frames). */
function crossing(t: number[], g: number[], i: number, j: number, level: number) {
  const dg = g[j] - g[i];
  return dg === 0 ? t[i] : t[i] + (t[j] - t[i]) * Math.max(0, Math.min(1, (level - g[i]) / dg));
}

/** The reps in a depth signal `g` (deeper larger) at times `t`: each a rise of at least `range` from a standing level
 * and a return of RETURN of it. Indices into t/g. `settled`: back at rest, or the next rep begun (live, a rep is told
 * once settled; at the end of a video one come back RETURN of the way counts). */
export function findReps(t: number[], g: (number | null)[], range: number) {
  const idx = g.flatMap((v, i) => v === null ? [] : [i]), at = (n: number) => g[idx[n]]!;
  const out: { s: number; b: number; e: number; start: number; end: number; level: number; depth: number; complete: boolean; settled: boolean }[] = [];
  let k = 0;
  while (k < idx.length) {
    // The standing level: the least depth before the bottom; the bottom: the deepest before it comes back RETURN.
    let lo = k, hi = -1;
    for (let n = k; n < idx.length; n++) {
      const v = at(n);
      if (hi < 0) { if (v < at(lo)) lo = n; else if (v - at(lo) >= range) hi = n; continue; }
      if (v > at(hi)) hi = n;
      else if (at(hi) - v >= RETURN * (at(hi) - at(lo))) break;
    }
    if (hi < 0) break;
    const level = at(lo), depth = at(hi), amp = depth - level, rest = level + REST * amp;
    // The start: the last frame at rest before the bottom. The end: the first at rest after it; else the shallowest
    // before the next rise of `range`, or before the video ends.
    let s = hi; while (s > lo && at(s - 1) > rest) s--; s = Math.max(lo, s - 1);
    let e = hi, back = false, next = false;
    for (let n = hi + 1; n < idx.length; n++) {
      const v = at(n);
      if (v <= rest) { e = n; back = true; break; }
      if (e === hi || v < at(e)) e = n;
      else if (v - at(e) >= range) { next = true; break; }
    }
    const start = crossing(t, g as number[], idx[s], idx[Math.min(s + 1, hi)], rest);
    const end = back ? crossing(t, g as number[], idx[e - 1], idx[e], rest) : t[idx[e]];
    out.push({ s: idx[s], b: idx[hi], e: idx[e], start, end, level, depth, complete: e > hi && depth - at(e) >= RETURN * amp, settled: back || next });
    k = Math.max(e, hi + 1);
  }
  return out;
}

/** The athlete's facing (+1 right): the toes ahead of the heels, else the nose ahead of the ears. */
function facing(bodies: (Body | null)[], poses: (readonly CrouchPoint[] | null | undefined)[], W: number) {
  const feet = bodies.flatMap(b => b?.heel && b.toe ? [b.toe.x - b.heel.x] : []);
  const f = median(feet);
  if (feet.length >= 5 && Math.abs(f) > 1) return Math.sign(f);
  const heads = poses.flatMap(p => p && seen(p[0]) && (seen(p[7]) || seen(p[8])) ? [(p[0].x - (seen(p[7]) && seen(p[8]) ? (p[7].x + p[8].x) / 2 : seen(p[7]) ? p[7].x : p[8].x)) * W] : []);
  return Math.sign(median(heads)) || 1;
}

/** One frame's posture on its own (the camera's lines): its facing, leg and foot from the frame. */
export function framePosture(f: CrouchFrame, o: StrengthOptions): Posture {
  const single = o.exercise === 'slrdl';
  const timing = bodyOf(f.pose, o.width, o.height, null, single), body = bodyOf(f.refined ?? f.pose, o.width, o.height, f.pose, single);
  const leg = timing?.hip && timing.ankle ? Math.hypot(timing.hip.x - timing.ankle.x, timing.hip.y - timing.ankle.y) : 0;
  const foot = body?.heel && body.toe ? Math.hypot(body.toe.x - body.heel.x, body.toe.y - body.heel.y) : 0;
  return postureOf(f, body, o, facing([body], [f.refined ?? f.pose], o.width), leg, foot, timing);
}
/** Frames on either side of the bottom whose angles are taken (at 30 fps, ±0.07 s). */
const BOTTOM_FRAMES = 2;
/** The values (nulls left out) after a running median of three. */
function median3(v: (number | null)[]): number[] {
  const k = v.filter((x): x is number => x !== null);
  return k.map((_, i) => median(k.slice(Math.max(0, i - 1), i + 2)));
}
/** Standing knees are near straight: a standing knee under STANDING_KNEE is the points lost (a plate in front of
 * the legs, a test video) and is left out. */
export const STANDING_KNEE = 130;
const standing = (p: Posture): Posture => p.knee !== null && p.knee < STANDING_KNEE ? { ...p, knee: null } : p;
/** Each angle's median over the frames (null where none has it), at `at`'s frame. */
function restingPosture(list: Posture[], at: Posture): Posture {
  const m = (k: keyof Posture) => { const v = list.flatMap(p => p[k] === null ? [] : [p[k] as number]); return v.length ? median(v) : null; };
  return { frame: at.frame, pts: at.pts, knee: m('knee'), hip: m('hip'), trunk: m('trunk'), shank: m('shank'), thigh: m('thigh'), foot: m('foot'),
    neck: m('neck'), bar: m('bar'), legGap: m('legGap'), height: m('height'), barY: m('barY'), line: m('line'),
    legBelow: (v => v.length ? v.filter(Boolean).length * 2 >= v.length : null)(list.flatMap(p => p.legBelow === null ? [] : [p.legBelow])) };
}

export function analyzeStrength(frames: readonly CrouchFrame[], o: StrengthOptions): StrengthResult {
  const W = o.width, H = o.height, notes: string[] = [];
  const base = { exercise: o.exercise, version: STRENGTH_VERSION, direction: 1, view: null, reps: [], postures: [], notes, refined: frames.some(f => f.refined), size: null };
  // Angles from RTMPose where it ran (frames without it give none: one model's points against the other's would read as
  // movement), else from MediaPipe; the reps' timing always from MediaPipe, as the camera.
  const refined = frames.some(f => f.refined);
  const single = o.exercise === 'slrdl';
  const timingBodies = frames.map(f => bodyOf(f.pose, W, H, null, single)), angleBodies = frames.map(f => bodyOf(refined ? f.refined : f.pose, W, H, f.pose, single));
  if (timingBodies.filter(b => b?.hip && b.ankle && b.shoulder).length < 10) return { ...base, reason: '選手の全身を十分に捉えられませんでした。頭から足先まで映るように撮影してください。' };
  const d = facing(angleBodies, frames.map(f => refined ? f.refined : f.pose), W);
  // Leg (hip to ankle) and foot (heel to toe) lengths: high in the set (standing straight, the foot level).
  const q = (v: number[], p: number) => { const a = [...v].sort((x, y) => x - y); return a.length ? a[Math.min(a.length - 1, Math.floor(p * a.length))] : NaN; };
  const leg = q(timingBodies.flatMap(b => b?.hip && b.ankle ? [Math.hypot(b.hip.x - b.ankle.x, b.hip.y - b.ankle.y)] : []), .9);
  const foot = q(angleBodies.flatMap(b => b?.heel && b.toe ? [Math.hypot(b.toe.x - b.heel.x, b.toe.y - b.heel.y)] : []), .75);
  const postures = frames.map((f, i) => postureOf(f, angleBodies[i], o, d, leg, foot, timingBodies[i]));
  const size = Number.isFinite(leg) ? leg : null;
  // Seen from the side the shoulders overlap: their spread against the trunk tells how square the camera was.
  const spreads = frames.flatMap((f, i) => { const p = refined ? f.refined : f.pose, b = angleBodies[i];
    return p && seen(p[11]) && seen(p[12]) && b?.shoulder && b.hip ? [Math.abs(p[11].x - p[12].x) * W / Math.max(1, Math.hypot(b.shoulder.x - b.hip.x, b.shoulder.y - b.hip.y))] : []; });
  const view = spreads.length ? median(spreads) : null;
  // From near the front the angles mean nothing (the test videos: side-on 0.12-0.28, ~30° 0.42, the front 0.80).
  if (view !== null && view > FRONT_VIEW) return { ...base, view, size, reason: '正面や斜めから撮られているようです（肩が左右に大きく開いて映っています）。角度を測れないため、体の真横から撮り直してください。' };
  const t = postures.map(p => p.pts);
  const raw = postures.map((p, i) => o.exercise === 'squat' ? (p.height === null ? null : -p.height)
    : (b => b?.shoulder && b.hip ? deg(Math.atan2((b.shoulder.x - b.hip.x) * d, b.hip.y - b.shoulder.y)) : null)(timingBodies[i]));
  const g = smooth(despike(raw.map(v => v !== null && hinge(o.exercise) && (v < LEAN_RANGE[0] || v > LEAN_RANGE[1]) ? null : v), SPIKE[o.exercise]));
  const timed = findReps(t, g, MIN_RANGE[o.exercise]).filter(r => r.complete && t[r.b] - r.start >= MIN_PHASE && r.end - t[r.b] >= MIN_PHASE);
  // Each rep starts from standing: a "rep" starting well below the set's usual standing level is a video begun mid-rep.
  // The usual level is the reps' median (the least one let a single point-flip "rep" from far above drop every rep: a
  // camera test).
  const stand = median(timed.map(r => r.level)), span = median(timed.map(r => r.depth - r.level));
  const range = (a: number, b: number) => Array.from({ length: Math.max(0, b - a) }, (_, k) => a + k);
  const finest = (at: number[]) => at.filter(i => (frames[i] as StrengthFrame).fine).map(i => postures[i]);
  const found = timed.filter(r => r.level - stand <= LOW_START * span);
  const reps: Rep[] = found.map((r, n) => {
    // Standing: the frames at rest since the rep before.
    const rest = r.level + REST * (r.depth - r.level), from = n ? found[n - 1].e : 0;
    const stillAt = range(from, r.s + 1).filter(i => g[i] !== null && g[i]! <= rest), still = stillAt.map(i => postures[i]);
    // The angles from the frames read with RTMPose-l (fine.ts) where there are any; the heel against all the standing
    // frames (its rise is followed through the rep on RTMPose-m's frames).
    const all = still.length ? restingPosture(still, postures[r.s]) : postures[r.s], fine = finest(stillAt);
    const top = standing({ ...(fine.length ? restingPosture(fine, postures[r.s]) : all), foot: all.foot });
    // The bottom: each angle's median over BOTTOM_FRAMES on either side (a frame's points jitter a degree or two).
    const bottomAt = range(Math.max(r.s, r.b - BOTTOM_FRAMES), Math.min(r.e, r.b + BOTTOM_FRAMES) + 1), fineLow = finest(bottomAt);
    const low = restingPosture(fineLow.length ? fineLow : bottomAt.map(i => postures[i]), postures[r.b]);
    // Peaks in the rep over a running median of three frames (one frame's jitter is no rise).
    const inRep = postures.slice(r.s, r.e + 1);
    const rises = median3(inRep.map(p => p.foot === null || top.foot === null ? null : p.foot - top.foot));
    const drifts = median3(inRep.map(p => p.bar));
    const gaps = median3(postures.slice(r.s, r.b + 1).map(p => p.legGap));
    // The bar's rise from the bottom to the end over the time it took: one video's reps against each other only.
    const yb = low.barY, ye = postures[r.e].barY, up = r.end - t[r.b];
    return { index: n + 1, start: r.start, bottom: t[r.b], end: r.end, startFrame: frames[r.s].frame, bottomFrame: frames[r.b].frame, endFrame: frames[r.e].frame,
      down: t[r.b] - r.start, up, top, low,
      heelRise: rises.length ? Math.max(...rises) : null,
      barDrift: drifts.length ? drifts.reduce((m, v) => Math.abs(v) > Math.abs(m) ? v : m, 0) : null,
      maxGap: gaps.length ? Math.max(...gaps) : null,
      speed: yb !== null && ye !== null && up > 0 ? (ye - yb) / up : null, loss: null, settled: r.settled };
  });
  const best = Math.max(...reps.flatMap(r => r.speed === null || r.speed <= 0 ? [] : [r.speed]));
  for (const r of reps) if (r.speed !== null && r.speed > 0 && Number.isFinite(best)) r.loss = (1 - r.speed / best) * 100;
  if (!reps.length) return { ...base, direction: d, view, size, postures, reason: !hinge(o.exercise)
    ? 'しゃがんで立ち上がる動きを見つけられませんでした。真横から、頭から足先まで映るように撮影してください。'
    : '上体を前に倒して起こす動きを見つけられませんでした。真横から、頭から足先まで映るように撮影してください。' };
  return { ...base, direction: d, view, size, reps, postures };
}
