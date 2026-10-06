/** The curve start seen from behind the blocks: did the athlete leave the blocks
 * straight, not drawn in by the curved lines, and then lean into the curve and run
 * along it? (the user, 2026-10-06: 「ラインに惑わされずに直線的に出発できたか？が重要
 * な解析です。その後、カーブに沿って自然に内傾して走っていけたか」). Method and checks
 * in docs/CurveStart_Feasibility_20261006.md §5.
 *
 * 1. The camera from the lane lines (camera.ts).
 * 2. The run starts when the hands leave the ground (rising from "on your marks" to
 *    "set" keeps them down), confirmed by the athlete moving away.
 * 3. Footprints: a foot standing still in the picture. Seen from behind, a foot coming
 *    down to land moves nearly along the line of sight and looks still a little higher
 *    first (its ground point further on): of a foot's still pieces close in time, the
 *    lowest in the picture is the footprint.
 * 4. Each footprint's place across the lane with the lane's 1.22 m as the ruler: the
 *    shortest cut across the lane through it (on the ground) between the traced lines.
 * 5. The straight line the blocks aim along: from the start (on the start line, across
 *    from the hands) tangent to the measurement line (20 cm into the lane), found in the
 *    picture (a tangent stays a tangent). The body's path (between left and right
 *    footprints) is measured from it in the picture, in cm by the lane's width there: a
 *    straight ground line stays straight in the picture, so this needs no radius or
 *    focal length (±1 cm when either changes).
 * 6. Lean: at each footprint's middle frame, the line from the foot to the pelvis in the
 *    vertical plane through the foot across the way of running, from the vertical (the
 *    body lean of Churchill et al. 2015 and Judson et al. 2020). */
import type { CrouchFrame, CrouchPoint } from '../sprint10/crouch';
import { fitCamera, LANE, type CameraFit, type LaneLine, type P2 } from './camera';

export const CURVE_START_VERSION = 'curvestart-v1-experimental';
/** The measurement line: 20 cm from the inner line (TR14.2/14.4; lane 1 is 30 cm from the kerb). */
export const MEASURE = .2;
/** The body path counts as having left its own straight line, or as drawn inside the ideal path, beyond this (cm). */
export const LEAVE_CM = 12;
/** Coming inside the ideal path is looked for up to this far past the tangent point (m). */
const INWARD_AFTER = 2;
/** Footprints between these distances from the start line (m): closer is the blocks, further the picture is too small. */
const NEAR = .3, FAR = 18;
/** A foot is still while it moves less than this share of the athlete's size a frame (and at least STILL_PX px at 4K). */
const STILL = .022, STILL_PX = 4;
/** Still pieces of a foot within this many frames, not further on by HOVER_AHEAD m, are one footprint (the hover before it). */
const HOVER_FRAMES = 16, HOVER_AHEAD = .5;
/** The run starts when the wrists rise this many shoulder widths above where they rested, for 3 frames. */
const LIFT = .5;
/** …with the wrists seen at least this well in one of the 3 frames (a stray low-confidence point is not a start). */
const LIFT_SEEN = .4;
/** The follower took someone else when the pelvis jumps this share of the athlete's size from its last good place and
 * stays away SWITCH frames (0.25 s at 60 fps); shorter jumps are stray points. */
const JUMP = .35, SWITCH = 15;

/** The lane's lines as traced: `inner`/`outer` as far as they can measure footprints, `near` the parts used for the camera
 * (the lines close enough not to crowd), `start` the start line. Without `near` the whole lines fit the camera. */
export interface CurveStartSetting { width: number; height: number; lines: { inner: P2[]; outer: P2[]; start: P2[]; near?: { inner: P2[]; outer: P2[] } }; mm35: number }
export interface Footprint {
  i: number; side: 'L' | 'R'; from: number; to: number; pts: number;
  img: P2; ground: P2; along: number;
  /** cm from the inner line (+ into the lane); null where the lane's lines were not traced. */
  cm: number | null;
  /** Body lean at the footprint's middle frame (°; + outward, − inward), and where the pelvis was over the ground then. */
  lean: number | null; leanFrame: number | null; com: P2 | null;
}
export interface PathPoint { img: P2; ground: P2; along: number; cm: number | null; offset: number | null; lean: number | null }
export interface CurveStartResult {
  version: string; reason: string | null;
  /** The camera fitted to the lane lines: height, metres behind the start line and out from the inner line, angles (°), the
   * fit (px), the focal length used and the inner line's radius (m; weakly fixed by a short arc, used only for drawing). */
  camera: { height: number; behind: number; lateral: number; yaw: number; pitch: number; roll: number; rms: number; mm35: number; R: number } | null;
  /** The start: picture and ground points, cm from the inner line. */
  start: { img: P2; ground: P2; cm: number | null } | null;
  /** The tangent point of the straight line on the measurement line, and the line's length (m). */
  tangent: { img: P2; ground: P2; length: number } | null;
  runStart: number | null; lastFrame: number | null;
  steps: Footprint[]; path: PathPoint[];
  /** The most the body's path came inside the ideal line before the tangent point (cm; 'early' above LEAVE_CM: drawn in by
   * the curve), where it later left its own straight line (m), and how that line lay against the ideal one at the tangent
   * point (cm, + outside) and in direction (°, + outward). */
  straight: { inward: number | null; verdict: 'early' | 'straight' | null; until: number | null; atTangent: number | null; aim: number | null };
  after: { cm: number[]; median: number | null; max: number | null };
  lean: { straight: number | null; curve: number | null; pairs: { along: number; deg: number }[] };
  lines: { inner: P2[]; outer: P2[]; measure: P2[]; start: P2[] };
  notes: string[];
}
const med = (v: number[]) => { const s = v.filter(Number.isFinite).sort((a, b) => a - b); return s.length ? s[s.length >> 1] : NaN; };
const mean = (v: number[]) => v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;

export function analyzeCurveStart(frames: readonly CrouchFrame[], setting: CurveStartSetting): CurveStartResult {
  const { width: W, height: H, mm35 } = setting, { inner, outer, start: startPts } = setting.lines;
  const empty = (reason: string, camera: CurveStartResult['camera'] = null): CurveStartResult => ({ version: CURVE_START_VERSION, reason, camera, start: null, tangent: null, runStart: null, lastFrame: null,
    steps: [], path: [], straight: { inward: null, verdict: null, until: null, atTangent: null, aim: null }, after: { cm: [], median: null, max: null }, lean: { straight: null, curve: null, pairs: [] },
    lines: { inner, outer, measure: [], start: startPts }, notes: [] });
  // The athlete and the run's start come first: a video with no start says so whatever the lines.
  const P = (fr: CrouchFrame, k: number) => { const q = (fr.refined ?? fr.pose)?.[k]; return q ? { x: q.x * W, y: q.y * H, v: q.visibility ?? 1 } : null; };
  const pelvisOf = (fr: CrouchFrame): P2 | null => { const a = P(fr, 23), b = P(fr, 24); return a && b ? [(a.x + b.x) / 2, (a.y + b.y) / 2] : null; };
  const sizeOf = (fr: CrouchFrame) => { const ys = [0, 11, 12, 23, 24, 27, 28].map(k => P(fr, k)?.y).filter((y): y is number => Number.isFinite(y)); return ys.length > 3 ? Math.max(...ys) - Math.min(...ys) : NaN; };
  const shoulders = (fr: CrouchFrame) => { const a = P(fr, 11), b = P(fr, 12); return a && b && a.v >= .3 && b.v >= .3 ? Math.hypot(a.x - b.x, a.y - b.y) : NaN; };
  const wristsY = (fr: CrouchFrame, minV: number) => { const a = P(fr, 15), b = P(fr, 16); return a && b && a.v >= minV && b.v >= minV ? (a.y + b.y) / 2 : NaN; };
  const seen = frames.filter(f => f.refined ?? f.pose);
  if (seen.length < 30) return empty('選手を追えませんでした。ブロックの真後ろから、選手の全身と左右の白線が映るように撮影してください。');

  // 2. The run's start: the wrists leave the ground (rise LIFT shoulder widths) for 3 frames, and the athlete then moves
  // away (shoulders 15% narrower 0.7-1 s later).
  let runStart: number | null = null, hands: number[] = [], lifted = false;
  for (let i = 0; i < seen.length && runStart === null; i++) {
    const rest = med(hands.slice(-30)), sw = med(seen.slice(Math.max(0, i - 15), i + 1).map(shoulders));
    const lift = seen.slice(i, i + 3);
    if (hands.length >= 3 && Number.isFinite(rest) && Number.isFinite(sw) && lift.length === 3 && lift.every(f => wristsY(f, .1) < rest - LIFT * sw)
      && lift.some(f => Number.isFinite(wristsY(f, LIFT_SEEN)))) {
      const later = med(seen.slice(i + 40, i + 61).map(shoulders));
      if (!Number.isFinite(later) || later < .85 * sw) { runStart = seen[i].frame; break; }
      lifted = true;   // the hands left the ground but the athlete did not move away
    }
    const y = wristsY(seen[i], .3); if (Number.isFinite(y)) hands.push(y);
  }
  if (runStart === null) return empty(lifted
    ? '手は地面から離れましたが、選手が遠ざかっていません（走り出していないか、走り出してすぐに動画が終わっています）。スタートから選手が15 m先まで走るまでを撮影してください。'
    : 'スタート（手が地面から離れて走り出す瞬間）が映っていません。構えのままや、構えを解いて終わっている動画では解析できません。スタートから選手が15 m先まで走るまでを撮影してください。');
  if (inner.length < 20 || outer.length < 20) return empty('レーンの白線をたどれませんでした。選手のレーンの内側と外側の白線に、スタートラインと交わる所で点を合わせてください。');
  if (startPts.length < 5) return empty('スタートラインが見つかりませんでした。2つの点を、スタートラインと白線が交わる所に合わせてください。');
  const near = setting.lines.near ?? { inner, outer };
  const fit: CameraFit | null = fitCamera([{ k: 0, pts: near.inner }, { k: 1, pts: near.outer }] as LaneLine[], startPts, W, H, mm35);
  if (!fit) return empty('白線からカメラの位置を計算できませんでした。点が選手のレーンの内側・外側の白線に合っているか確かめてください。');
  const cam = fit.camera, R = fit.R, [psi, theta, phi, cx, cy, h] = fit.params, deg = 180 / Math.PI;
  const camera = { height: h, behind: -cy, lateral: cx - R, yaw: psi * deg - 90, pitch: theta * deg, roll: phi * deg, rms: fit.rms, mm35, R };
  const notes: string[] = [];
  if (fit.rms > 15) notes.push(`白線とカメラの計算の合いが悪い（${fit.rms.toFixed(0)}画素）ため、位置の誤差が大きい可能性があります。点の位置を確かめてください。`);
  if (h < .6) notes.push('カメラが低い（地面から60 cm未満）ため、遠くの足の位置の誤差が大きくなります。1.3 m以上の高さを勧めます。');

  // The start point: on the start line, across from the hands where they rested.
  const rested = seen.filter(f => f.frame < runStart! && P(f, 15)!.v >= .4 && P(f, 16)!.v >= .4).slice(-30);
  const handX = rested.length ? med(rested.map(f => (P(f, 15)!.x + P(f, 16)!.x) / 2)) : NaN;
  if (!Number.isFinite(handX)) return empty('構えの両手が見えず、スタート位置を決められませんでした。', camera);
  const closest = [...startPts].sort((a, b) => Math.abs(a[0] - handX) - Math.abs(b[0] - handX)).slice(0, 4);
  const Simg: P2 = [handX, med(closest.map(q => q[1]))], Sg = cam.ground(Simg[0], Simg[1]);
  if (!Sg) return empty('スタート位置をカメラの計算で地面に置けませんでした。', camera);
  // The follower's last frame on the athlete: the pelvis jumping away from its last good place and staying away for
  // SWITCH frames is someone else; a shorter jump (a few frames of stray points) is skipped.
  // The athlete's size is the median of the last 10 good frames; a pose less than half that size is a stray one too.
  let lastFrame = seen.at(-1)!.frame, good: { at: P2; frame: number } | null = null, away = 0;
  const sizes: number[] = [];
  for (const f of seen) {
    const q = pelvisOf(f), sz = sizeOf(f), size = sizes.length ? med(sizes.slice(-10)) : sz;
    const stray = !q || !Number.isFinite(sz) || sz < .5 * size || (good !== null && f.frame > runStart && Math.hypot(q[0] - good.at[0], q[1] - good.at[1]) > JUMP * size);
    if (stray) { if (good && f.frame > runStart && ++away >= SWITCH) { lastFrame = good.frame; break; } continue; }
    away = 0; good = { at: q!, frame: f.frame }; sizes.push(sz);
  }

  // 4. The lane's 1.22 m as a ruler.
  const cuts = (c: P2, v: P2, poly: P2[]) => { const ts: number[] = []; for (let i = 0; i + 1 < poly.length; i++) { const a = poly[i], b = poly[i + 1], ex = b[0] - a[0], ey = b[1] - a[1], den = v[0] * ey - v[1] * ex; if (Math.abs(den) < 1e-9) continue; const t = ((a[0] - c[0]) * ey - (a[1] - c[1]) * ex) / den, u = ((a[0] - c[0]) * v[1] - (a[1] - c[1]) * v[0]) / den; if (u >= 0 && u <= 1) ts.push(t); } return ts; };
  const reachPx = 700 * Math.max(W, H) / 3840;
  /** The shortest cut across the lane through a picture point: cm from the inner line (+ into the lane) and its length in pixels. */
  function across(pt: P2): { cm: number; px: number } | null {
    const g = cam.ground(pt[0], pt[1]); if (!g) return null;
    let best: { width: number; along: number; px: number } | null = null;
    const tryCut = (from: P2, onto: P2[], fromInner: boolean) => {
      const len = Math.hypot(pt[0] - from[0], pt[1] - from[1]); if (len < 2 || len > reachPx * 1.3) return;
      const v: P2 = [(pt[0] - from[0]) / len, (pt[1] - from[1]) / len], t = cuts(from, v, onto).filter(x => x > 5).sort((a, b) => a - b)[0]; if (t === undefined) return;
      const end: P2 = [from[0] + v[0] * t, from[1] + v[1] * t], ga = cam.ground(from[0], from[1]), gb = cam.ground(end[0], end[1]); if (!ga || !gb) return;
      const gi = fromInner ? ga : gb, go = fromInner ? gb : ga, width = Math.hypot(go[0] - gi[0], go[1] - gi[1]); if (width < .9 || width > 1.8) return;
      const along = ((g[0] - gi[0]) * (go[0] - gi[0]) + (g[1] - gi[1]) * (go[1] - gi[1])) / width; if (along / width < -.6 || along / width > 1.6) return;
      if (!best || width < best.width) best = { width, along, px: t };
    };
    for (const a of inner) if (Math.hypot(a[0] - pt[0], a[1] - pt[1]) <= reachPx) tryCut(a, outer, true);
    const b0 = best as { along: number } | null;
    if (!b0 || b0.along < 0) for (const b of outer) if (Math.hypot(b[0] - pt[0], b[1] - pt[1]) <= reachPx * 1.3) tryCut(b, inner, false);
    const b1 = best as { width: number; along: number; px: number } | null;
    return b1 ? { cm: b1.along / b1.width * LANE * 100, px: b1.px } : null;
  }
  // 5. The measurement line in the picture, the tangent from the start to it, placed on the ground.
  const measure: P2[] = [];
  for (const q of inner) {
    const g = cam.ground(q[0], q[1]); if (!g) continue;
    const r = Math.hypot(g[0], g[1]), p0 = cam.project([g[0], g[1], 0]), p1 = cam.project([g[0] * (1 + 1 / r), g[1] * (1 + 1 / r), 0]); if (!p0 || !p1) continue;
    const len = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]), v: P2 = [(p1[0] - p0[0]) / len, (p1[1] - p0[1]) / len];
    const t = cuts(q, v, outer).filter(x => x > 5).sort((a, b) => a - b)[0]; if (t === undefined) continue;
    measure.push([q[0] + v[0] * t * MEASURE / LANE, q[1] + v[1] * t * MEASURE / LANE]);
  }
  let Timg: P2 | null = null, bearing = -Infinity;
  for (const q of measure) { if (q[1] >= Simg[1] - 30) continue; const b = Math.atan2(q[0] - Simg[0], Simg[1] - q[1]); if (b > bearing) { bearing = b; Timg = q; } }
  const Tg = Timg ? cam.ground(Timg[0], Timg[1]) : null;
  if (!Timg || !Tg) return { ...empty('内側のラインに接するまっすぐの線を決められませんでした（内側の白線が十分に映っていません）。', camera), lines: { inner, outer, measure, start: startPts } };
  const Lt = Math.hypot(Tg[0] - Sg[0], Tg[1] - Sg[1]), ud: P2 = [(Tg[0] - Sg[0]) / Lt, (Tg[1] - Sg[1]) / Lt];
  const alongOf = (g: P2) => (g[0] - Sg[0]) * ud[0] + (g[1] - Sg[1]) * ud[1];

  // 3. Footprints.
  const tol = (fr: CrouchFrame) => Math.max(STILL_PX * Math.max(W, H) / 3840, STILL * sizeOf(fr));
  const pieces: { side: 'L' | 'R'; from: number; to: number; x: number; y: number }[] = [];
  for (const side of [0, 1]) {
    const raw = frames.map(fr => { const pts = [P(fr, 31 + side), P(fr, 29 + side)].filter((q): q is { x: number; y: number; v: number } => !!q && q.v >= .2); return pts.length ? [pts.reduce((a, q) => a + q.x, 0) / pts.length, pts.reduce((a, q) => a + q.y, 0) / pts.length] as P2 : null; });
    const f = raw.map((_, i) => { const w = raw.slice(Math.max(0, i - 2), i + 3).filter((q): q is P2 => !!q); return w.length >= 3 ? [med(w.map(q => q[0])), med(w.map(q => q[1]))] as P2 : null; });
    const still = frames.map((fr, i) => i > 0 && i + 1 < frames.length && !!f[i - 1] && !!f[i] && !!f[i + 1] && fr.frame >= runStart! + 6 && fr.frame <= lastFrame
      && Math.hypot(f[i]![0] - f[i - 1]![0], f[i]![1] - f[i - 1]![1]) < tol(fr) && Math.hypot(f[i + 1]![0] - f[i]![0], f[i + 1]![1] - f[i]![1]) < tol(fr));
    for (let i = 0; i < frames.length; i++) {
      if (!still[i]) continue; let j = i; while (j + 1 < frames.length && still[j + 1]) j++;
      if (j - i + 1 >= 3) { const xs: number[] = [], ys: number[] = []; for (let k = i; k <= j; k++) { xs.push(f[k]![0]); ys.push(f[k]![1]); } pieces.push({ side: side ? 'R' : 'L', from: frames[i].frame, to: frames[j].frame, x: med(xs), y: med(ys) }); }
      i = j;
    }
  }
  pieces.sort((a, b) => a.from - b.from);
  const merged: { side: 'L' | 'R'; from: number; to: number; first: number; x: number; y: number }[] = [];
  for (const c of pieces) {
    const g = cam.ground(c.x, c.y); if (!g) continue;
    const same = [...merged].reverse().find(m => m.side === c.side);
    if (same && c.from - same.first <= HOVER_FRAMES) {
      const g0 = cam.ground(same.x, same.y);
      if (g0 && alongOf(g) - alongOf(g0) < HOVER_AHEAD) { if (c.y > same.y) Object.assign(same, { x: c.x, y: c.y, from: c.from, to: c.to }); continue; }
    }
    merged.push({ ...c, first: c.from });
  }
  const ptsOf = (frame: number) => frames.find(f => f.frame === frame)?.pts ?? 0;
  let steps: Footprint[] = merged.map(c => { const g = cam.ground(c.x, c.y)!, lane = across([c.x, c.y]);
    return { i: 0, side: c.side, from: c.from, to: c.to, pts: ptsOf(c.from), img: [c.x, c.y] as P2, ground: g, along: alongOf(g), cm: lane?.cm ?? null, lean: null, leanFrame: null, com: null }; })
    .filter(q => q.along > NEAR && q.along < FAR);
  steps = steps.filter((q, i, a) => !(a[i + 1] && a[i + 2] && q.along > a[i + 1].along + .3 && q.along > a[i + 2].along + .3)).sort((a, b) => a.along - b.along);
  steps.forEach((q, i) => { q.i = i + 1; });
  if (steps.length < 4) return { ...empty('足の着いた位置を4歩以上見つけられませんでした。選手の足元がよく映るように、ブロックの真後ろから撮影してください。', camera), lines: { inner, outer, measure, start: startPts } };

  // 6. Lean at each footprint's middle frame.
  const dot3 = (a: number[], b: number[]) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  steps.forEach((q, i) => {
    const a = steps[Math.max(0, i - 1)], b = steps[Math.min(steps.length - 1, i + 1)], hd: P2 = [b.ground[0] - a.ground[0], b.ground[1] - a.ground[1]], hl = Math.hypot(hd[0], hd[1]);
    const head: P2 = hl > .3 ? [hd[0] / hl, hd[1] / hl] : ud, mid = Math.round((q.from + q.to) / 2), fr = frames.find(f => f.frame === mid), pel = fr && pelvisOf(fr); if (!pel) return;
    const z1 = .1, z2 = Math.min(.9, cam.C[2] - .15), A = cam.ground(pel[0], pel[1], z1), B = cam.ground(pel[0], pel[1], z2); if (!A || !B || z2 <= z1) return;
    const A3 = [A[0], A[1], z1], ab = [B[0] - A[0], B[1] - A[1], z2 - z1], n = [head[0], head[1], 0], den = dot3(ab, n); if (Math.abs(den) < 1e-6) return;
    const t = dot3([q.ground[0] - A3[0], q.ground[1] - A3[1], -A3[2]], n) / den, X = [A3[0] + t * ab[0], A3[1] + t * ab[1], A3[2] + t * ab[2]];
    if (X[2] < .3 || X[2] > 1.4) return;
    const side: P2 = [head[1], -head[0]], lateral = (X[0] - q.ground[0]) * side[0] + (X[1] - q.ground[1]) * side[1];
    q.lean = Math.atan2(lateral, X[2]) * deg; q.leanFrame = mid; q.com = [X[0], X[1]];
  });

  // The body's path: the pelvis over the ground in the middle of each footprint (the foot moved across by the measured
  // lean: leaning into a curve the feet land outside the body, about 10 cm at 7°, which would hide a body curving early),
  // else the middle of two footprints in a row. Its offset from the straight line is measured on the ground (cm, + to the
  // inside); the line runs from the start to the tangent point, both near the camera; no radius is used.
  const inside: P2 = [-ud[1], ud[0]];
  const path: PathPoint[] = [];
  steps.forEach((q, i) => {
    const b = steps[i + 1];
    let ground: P2 | null = q.com;
    if (!ground) { if (!b || b.side === q.side) return; ground = [(q.ground[0] + b.ground[0]) / 2, (q.ground[1] + b.ground[1]) / 2]; }
    const img = cam.project([ground[0], ground[1], 0]); if (!img) return;
    path.push({ img, ground, along: alongOf(ground), cm: across(img)?.cm ?? null, offset: ((ground[0] - Sg[0]) * inside[0] + (ground[1] - Sg[1]) * inside[1]) * 100, lean: null });
  });
  path.sort((a, b) => a.along - b.along);
  // The lean two steps at a time (left and right), at the middle of the two.
  const pairs: { along: number; deg: number }[] = [];
  for (let i = 0; i + 1 < steps.length; i++) { const a = steps[i], b = steps[i + 1]; if (a.side !== b.side && a.lean !== null && b.lean !== null) pairs.push({ along: (a.along + b.along) / 2, deg: (a.lean + b.lean) / 2 }); }
  // Did the athlete stay off the curve until the tangent point? The ideal path runs along the straight line to the tangent
  // point and then along the measurement line (inside the straight line by u²/2R at u m past it). Drawn in by the curved
  // lines, the body comes inside the ideal path before the tangent point and just after it: the most it came inside up to
  // INWARD_AFTER m past the tangent point decides it (all within 10 m of the camera). The path's own straight line up to the
  // tangent point gives the aim; where the path later left that line by LEAVE_CM is marked on the drawings (following the
  // lane from the tangent point takes about 3 m to do so).
  const run = path.filter(q => q.along >= .8 && q.offset !== null) as (PathPoint & { offset: number })[], early = run.filter(q => q.along <= Lt);
  const ideal = (along: number) => along > Lt ? (along - Lt) ** 2 / (2 * (R + MEASURE)) * 100 : 0;
  const lineFit = (pts: (PathPoint & { offset: number })[]) => { const n = pts.length, mx = pts.reduce((a, q) => a + q.along, 0) / n, my = pts.reduce((a, q) => a + q.offset, 0) / n, sxx = pts.reduce((a, q) => a + (q.along - mx) ** 2, 0); const b = sxx ? pts.reduce((a, q) => a + (q.along - mx) * (q.offset - my), 0) / sxx : 0; return { a: my - b * mx, b }; };
  const judged = run.filter(q => q.along <= Lt + INWARD_AFTER);
  const inward = judged.length >= 2 ? Math.max(...judged.map(q => q.offset - ideal(q.along))) : null;
  const own = early.length >= 3 ? lineFit(early) : null;
  let until: number | null = null;
  for (let k = 3; k < run.length; k++) {
    const f = lineFit(run.slice(0, k)), r1 = run[k].offset - (f.a + f.b * run[k].along), r2 = run[k + 1] ? run[k + 1].offset - (f.a + f.b * run[k + 1].along) : r1;
    if (r1 > LEAVE_CM && r2 > LEAVE_CM) { until = (run[k - 1].along + run[k].along) / 2; break; }
  }
  const lastAlong = path.at(-1)?.along ?? 0;
  const verdict = inward === null ? null : inward > LEAVE_CM ? 'early' : 'straight';
  // At the tangent point, how far outside the ideal line the athlete's own straight line runs (cm, − inside), and its
  // angle from the ideal line (°, + outward).
  const atTangent = own ? -(own.a + own.b * Lt) : null;
  const aim = atTangent === null ? null : Math.atan(atTangent / 100 / Lt) * deg;
  const afterCm = path.filter(q => q.along > Lt && q.cm !== null).map(q => q.cm!);
  const straightLean = mean(pairs.filter(q => q.along <= Lt).map(q => q.deg)), curveLean = mean(pairs.filter(q => q.along > Math.max(Lt + 2, until ?? 0)).slice(-3).map(q => q.deg));
  if (lastAlong < Lt + 2) notes.push('接点の先まで映っていないため、カーブに沿えたかは判断できません。スタートから15 m先まで映るように撮影してください。');
  if (steps.length && steps.filter(q => q.cm === null).length > steps.length / 2) notes.push('遠くの白線をたどれず、多くの足の位置で内側のラインからの距離を出せませんでした。カメラを高く（1.3 m以上）すると改善します。');
  return {
    version: CURVE_START_VERSION, reason: null, camera,
    start: { img: Simg, ground: Sg, cm: across(Simg)?.cm ?? null },
    tangent: { img: Timg, ground: Tg, length: Lt }, runStart, lastFrame,
    steps, path, straight: { inward, verdict, until, atTangent, aim },
    after: { cm: afterCm, median: afterCm.length ? med(afterCm) : null, max: afterCm.length ? Math.max(...afterCm) : null },
    lean: { straight: straightLean, curve: curveLean, pairs },
    lines: { inner, outer, measure, start: startPts }, notes,
  };
}
export type { CrouchPoint };
