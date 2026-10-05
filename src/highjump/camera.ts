/** The camera from the high jump's uprights: where it stands, how high and how
 * it is tilted, from the feet of both uprights and the points where the bar
 * meets them, with the bar's height as the ruler (the user, 2026-10-06: the
 * takeoff is filmed side-on, so the uprights and the bar are seen at a slant;
 * 「支柱を写していても斜めのため正しい距離が取れません」). With the camera
 * known, a point on the ground (the takeoff foot) has its place in metres, and
 * the athlete's height above the ground can be read at the athlete's own
 * distance from the camera, not at the uprights'.
 *
 * World: origin at the left upright's foot, x along the bar to the right
 * upright, z up, y = z × x; the camera stands at y < 0 (in front of the bar,
 * looking across it). The phone is held level: no roll. On はるき's video a free
 * roll fitted a spurious pose (the camera on the ground, rolled 5°: the ground
 * seen edge-on); held level, four points gave the speeds of a full calibration
 * (bar, uprights, the mat's edge) within 1-2% (docs/HighJump_Research_20261006.md §9). */

export type Vec = [number, number, number];
export interface ImagePoint { x: number; y: number }
/** Image points (pixels) of both uprights: the foot and where the bar meets it. */
export interface UprightPoints { left: { foot: ImagePoint; bar: ImagePoint }; right: { foot: ImagePoint; bar: ImagePoint } }

/** The iPhone's 1x camera records video at 27 mm (35 mm equivalent; all four test videos). ±4% moved no speed (§9). */
export const FOCAL_35MM = 27;
/** Pixels of focal length for a picture `width` × `height` at a 35 mm equivalent focal length (by the diagonal). */
export const focalPixels = (width: number, height: number, mm35 = FOCAL_35MM) => mm35 * Math.hypot(width, height) / 43.27;
/** The bar's centre is this far below its top (the height set is the top of a 3 cm bar). */
export const BAR_RADIUS = .015;

const dot = (a: Vec, b: Vec) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const sub = (a: Vec, b: Vec): Vec => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const add = (a: Vec, b: Vec): Vec => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mul = (a: Vec, k: number): Vec => [a[0] * k, a[1] * k, a[2] * k];
export const vec = { dot, sub, add, mul, norm: (a: Vec) => Math.hypot(a[0], a[1], a[2]) };

export interface Camera {
  /** Focal length and the picture's centre (pixels). */
  f: number; cx: number; cy: number;
  /** World to camera rotation (rows: right, down, forward) and the camera's place (m). */
  R: [Vec, Vec, Vec]; C: Vec;
  /** Pixel position and depth (m) of a world point. */
  project(P: Vec): [number, number, number];
  /** World direction of the ray through a pixel. */
  ray(u: number, v: number): Vec;
  /** Where the ray through a pixel meets the plane n·X = d (null when it does not, ahead of the camera). */
  onPlane(u: number, v: number, n: Vec, d: number): Vec | null;
}

/** Rotation for a level camera (no roll) looking at yaw ψ (from the x axis), pitched up by θ. */
function rotation(psi: number, theta: number): [Vec, Vec, Vec] {
  const right: Vec = [Math.sin(psi), -Math.cos(psi), 0], down0: Vec = [0, 0, -1], forward0: Vec = [Math.cos(psi), Math.sin(psi), 0];
  const ct = Math.cos(theta), st = Math.sin(theta);
  return [right, add(mul(down0, ct), mul(forward0, st)), add(mul(down0, -st), mul(forward0, ct))];
}
export function makeCamera(psi: number, theta: number, C: Vec, f: number, cx: number, cy: number): Camera {
  const R = rotation(psi, theta);
  return {
    f, cx, cy, R, C,
    project(P) { const d = sub(P, C), z = dot(R[2], d); return [cx + f * dot(R[0], d) / z, cy + f * dot(R[1], d) / z, z]; },
    ray(u, v) { const a = (u - cx) / f, b = (v - cy) / f; return [R[0][0] * a + R[1][0] * b + R[2][0], R[0][1] * a + R[1][1] * b + R[2][1], R[0][2] * a + R[1][2] * b + R[2][2]]; },
    onPlane(u, v, n, d) { const r = this.ray(u, v), k = dot(n, r); if (Math.abs(k) < 1e-9) return null; const t = (d - dot(n, C)) / k; return t > 0 ? add(C, mul(r, t)) : null; },
  };
}

/** Least squares by Levenberg–Marquardt (numerical Jacobian). */
function solve(A: number[][], b: number[]) {
  const n = b.length, M = A.map((row, i) => [...row, b[i]]);
  for (let i = 0; i < n; i++) {
    let m = i; for (let k = i + 1; k < n; k++) if (Math.abs(M[k][i]) > Math.abs(M[m][i])) m = k;
    [M[i], M[m]] = [M[m], M[i]];
    for (let k = i + 1; k < n; k++) { const c = M[k][i] / M[i][i]; for (let j = i; j <= n; j++) M[k][j] -= c * M[i][j]; }
  }
  const x = Array<number>(n).fill(0);
  for (let i = n - 1; i >= 0; i--) { let s = M[i][n]; for (let j = i + 1; j < n; j++) s -= M[i][j] * x[j]; x[i] = s / M[i][i]; }
  return x;
}
export function levenbergMarquardt(fn: (p: number[]) => number[], p0: number[], iterations = 100) {
  let p = [...p0], r = fn(p), cost = r.reduce((s, x) => s + x * x, 0), lambda = 1e-2;
  for (let it = 0; it < iterations; it++) {
    const J = p.map((_, j) => { const h = 1e-6 * Math.max(1, Math.abs(p[j])), q = [...p]; q[j] += h; const rq = fn(q); return rq.map((x, i) => (x - r[i]) / h); });
    const JTJ = J.map(a => J.map(b => a.reduce((s, x, m) => s + x * b[m], 0))), JTr = J.map(col => col.reduce((s, x, m) => s + x * r[m], 0));
    let improved = false;
    for (let tries = 0; tries < 10 && !improved; tries++) {
      const step = solve(JTJ.map((row, i) => row.map((x, k) => i === k ? x * (1 + lambda) + 1e-12 : x)), JTr.map(x => -x));
      const q = p.map((x, i) => x + step[i]), rq = fn(q), cq = rq.reduce((s, x) => s + x * x, 0);
      if (cq < cost && Number.isFinite(cq)) { const tiny = cost - cq < 1e-12 * cost; p = q; r = rq; cost = cq; lambda = Math.max(lambda / 3, 1e-9); improved = true; if (tiny) return { p, r, cost }; }
      else lambda *= 4;
    }
    if (!improved) break;
  }
  return { p, r, cost };
}

export interface Calibration {
  camera: Camera;
  /** Distance between the uprights' feet (m): about 4.0 m on standard uprights (4.00-4.04 m apart, a 4.00 m bar). */
  spacing: number;
  /** Camera height (m) and pitch (degrees, up positive). */
  height: number; pitch: number;
  /** How well the four points fit one camera (pixels, root mean square). */
  rms: number;
}
/** The camera from the four points and the bar's height (m, its top). Null when no level camera in front of the bar fits. */
export function calibrate(points: UprightPoints, barHeight: number, width: number, height: number, f = focalPixels(width, height)): Calibration | null {
  const zBar = barHeight - BAR_RADIUS, cx = width / 2, cy = height / 2;
  const obs: [ImagePoint, (L: number) => Vec][] = [[points.left.foot, () => [0, 0, 0]], [points.left.bar, () => [0, 0, zBar]],
    [points.right.foot, L => [L, 0, 0]], [points.right.bar, L => [L, 0, zBar]]];
  const residuals = (p: number[]) => {
    const [psi, theta, x, y, z, L] = p, cam = makeCamera(psi, theta, [x, y, z], f, cx, cy), out: number[] = [];
    for (const [o, at] of obs) { const q = cam.project(at(L)); if (!(q[2] > .5)) return obs.flatMap(() => [1e4, 1e4]); out.push(q[0] - o.x, q[1] - o.y); }
    return out;
  };
  const plausible = (p: number[]) => p[4] > .2 && p[4] < 3 && p[3] < 0 && p[5] > 2 && p.every(Number.isFinite);
  let best: { p: number[]; cost: number } | null = null;
  for (let yaw = -Math.PI; yaw < Math.PI; yaw += Math.PI / 12) for (const y of [-3, -5, -7, -9]) for (const x of [-6, -3, 0, 3, 6]) {
    const s = levenbergMarquardt(residuals, [yaw, 0, x, y, 1, 4], 60);
    if (plausible(s.p) && (!best || s.cost < best.cost)) best = s;
  }
  if (!best) return null;
  const s = levenbergMarquardt(residuals, best.p, 300);
  if (!plausible(s.p)) return null;
  const [psi, theta, x, y, z, L] = s.p;
  return { camera: makeCamera(psi, theta, [x, y, z], f, cx, cy), spacing: L, height: z, pitch: theta * 180 / Math.PI, rms: Math.sqrt(s.cost / 8) };
}
