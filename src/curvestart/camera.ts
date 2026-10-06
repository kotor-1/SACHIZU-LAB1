/** The camera behind the blocks from the lane lines (docs/CurveStart_Feasibility_20261006.md §2.3, §5).
 *
 * On the bend the lane lines are circles round one centre: the athlete's lane's inner
 * line (radius R), its outer line (R + 1.22 m) and the next lines out; the start line
 * lies along a radius. With the phone's focal length (35 mm equivalent, from the
 * video's metadata) the camera's yaw, pitch, roll, place and R are fitted by least
 * squares. Each traced point is put on the ground; its distance from its circle (or the
 * start line) is turned into pixels by how far a 1 cm step across the line moves in the
 * picture there (0.05-0.25 s; the same camera within 3 cm and 0.3° as fitting the
 * projected circles to the picture, which took minutes).
 *
 * World: the curve's centre at the origin, z up, the start line along +x (angle 0),
 * the athletes running counter-clockwise (toward +y at the start). */
import { levenbergMarquardt } from '../highjump/camera';

export type P2 = [number, number];
type P3 = [number, number, number];
/** Lane width (m, the line on the right included): World Athletics TR14.4, 1.22 ± 0.01 m. */
export const LANE = 1.22;
/** iPhone's 1x camera when the video carries no focal length (the curve start videos: 25 mm in 4K). */
export const FOCAL_35MM_DEFAULT = 26;
export const focalPixels = (width: number, height: number, mm35: number) => mm35 * Math.hypot(width, height) / 43.27;

export interface CurveCamera {
  /** The camera's place (m). */
  C: P3;
  /** Picture point of a world point; null behind the camera. */
  project(P: P3): P2 | null;
  /** The point at height z (m) seen at picture point (u, v); null above the horizon or behind. */
  ground(u: number, v: number, z?: number): P2 | null;
}
/** Camera parameters: yaw ψ from the x axis, pitch θ (up +), roll φ, place (x, y), height h. */
export type CameraParams = [number, number, number, number, number, number];
export function makeCamera([psi, theta, phi, cx, cy, h]: CameraParams, f: number, width: number, height: number): CurveCamera {
  const fw: P3 = [Math.cos(theta) * Math.cos(psi), Math.cos(theta) * Math.sin(psi), Math.sin(theta)];
  const r0: P3 = [Math.sin(psi), -Math.cos(psi), 0];
  const u0: P3 = [r0[1] * fw[2] - r0[2] * fw[1], r0[2] * fw[0] - r0[0] * fw[2], r0[0] * fw[1] - r0[1] * fw[0]];
  const right = r0.map((v, i) => Math.cos(phi) * v + Math.sin(phi) * u0[i]) as P3, up = r0.map((v, i) => -Math.sin(phi) * v + Math.cos(phi) * u0[i]) as P3;
  const C: P3 = [cx, cy, h], dot = (a: P3, b: P3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  return {
    C,
    project(P) {
      const d: P3 = [P[0] - C[0], P[1] - C[1], P[2] - C[2]], z = dot(d, fw);
      return z > .1 ? [width / 2 + f * dot(d, right) / z, height / 2 - f * dot(d, up) / z] : null;
    },
    ground(u, v, z = 0) {
      const a = (u - width / 2) / f, b = -(v - height / 2) / f, d = fw.map((x, i) => x + a * right[i] + b * up[i]) as P3;
      if (d[2] >= -1e-9) return null;
      const t = (z - C[2]) / d[2];
      return t > 0 ? [C[0] + t * d[0], C[1] + t * d[1]] : null;
    },
  };
}

/** A traced line: k lanes out from the athlete's inner line (0 the inner line, 1 the outer line). */
export interface LaneLine { k: number; pts: P2[] }
export interface CameraFit { params: CameraParams; R: number; rms: number; camera: CurveCamera; f: number }
/** Residuals above about this many pixels grow slowly (a stray traced point keeps a gradient but little weight). */
const ROBUST = 20;
const robust = (d: number) => Number.isFinite(d) ? ROBUST * Math.asinh(d / ROBUST) : 200;
function residuals(p: number[], lines: LaneLine[], start: P2[], f: number, width: number, height: number) {
  const R = p[6], cam = makeCamera(p.slice(0, 6) as CameraParams, f, width, height), out: number[] = [];
  const pxPerM = (g: P2, dir: P2) => { const a = cam.project([g[0], g[1], 0]), b = cam.project([g[0] + dir[0] * .01, g[1] + dir[1] * .01, 0]); return a && b ? Math.hypot(b[0] - a[0], b[1] - a[1]) / .01 : NaN; };
  for (const { k, pts } of lines) for (const q of pts) {
    const g = cam.ground(q[0], q[1]); if (!g) { out.push(200); continue; }
    const r = Math.hypot(g[0], g[1]); out.push(robust((r - (R + k * LANE)) * pxPerM(g, [g[0] / r, g[1] / r])));
  }
  for (const q of start) { const g = cam.ground(q[0], q[1]); out.push(g ? robust(g[1] * pxPerM(g, [0, 1])) : 200); }
  return out;
}
/** The camera from the traced lines and the start line (picture points). Starts from a few guesses (the camera a few
 * metres behind, near the lane, pitched down); keeps fits with the camera above the ground and behind the start line. */
export function fitCamera(lines: LaneLine[], start: P2[], width: number, height: number, mm35: number): CameraFit | null {
  const f = focalPixels(width, height, mm35);
  // Every third point is enough (a few hundred), and keeps the fit to well under a second on a phone.
  const sub = lines.map(l => ({ k: l.k, pts: l.pts.filter((_, i) => i % 3 === 0) }));
  let best: { p: number[]; cost: number } | null = null;
  for (const psi of [Math.PI / 2, Math.PI / 2 + .2]) for (const cy of [-4, -6]) for (const R0 of [37, 43]) {
    const r = levenbergMarquardt(p => residuals(p, sub, start, f, width, height), [psi, -.2, 0, R0 + 1.5, cy, 1.4, R0], 40);
    if (r.p[5] > .2 && r.p[5] < 5 && r.p[4] < 0 && r.p[6] > 20 && (!best || r.cost < best.cost)) best = r;
  }
  if (!best) return null;
  const n = sub.reduce((s, l) => s + l.pts.length, 0) + start.length;
  return { params: best.p.slice(0, 6) as CameraParams, R: best.p[6], rms: Math.sqrt(best.cost / n), camera: makeCamera(best.p.slice(0, 6) as CameraParams, f, width, height), f };
}
