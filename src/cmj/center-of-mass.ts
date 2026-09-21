import type { NormalizedLandmark } from '@mediapipe/tasks-vision';

export interface COMSample {
  frame: number; pts: number;
  comX: number | null; comY: number | null; bodyScale: number | null;
  reason?: string;
}
export const COM_MODEL = 'segment-mass-mean-wrist-hand-proxy-v2';
// Mean female/male segment mass fractions and joint-based longitudinal COM
// fractions from de Leva (1996), as tabulated by Visual3D. MediaPipe endpoints
// are proxies: ears for head COM, shoulders/hips for trunk, wrists for hands.
// Hand mass is retained at the wrist on EVERY frame (not a confidence-dependent
// fallback). Finger locations are unstable for hands-on-hips CMJs; their motion
// must not introduce discontinuities into COM differentiation. The omitted hand
// COM offset is an explicit anatomical approximation requiring validation.
// This is NOT an anatomical reconstruction or Metric's model.
// https://www.has-motion.com/wiki/doku.php?id=visual3d:documentation:definitions:adjusted_zatsiorsky-seluyanov_s_segment_inertia_parameters
const REQUIRED = [7, 8, 11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32];
type Point = { x: number; y: number };
const between = (a: Point, b: Point, f: number): Point => ({ x: a.x + f * (b.x - a.x), y: a.y + f * (b.y - a.y) });

export function centerOfMassSample(poses: readonly NormalizedLandmark[][], frame: number, pts: number): COMSample {
  const fail = (reason: string): COMSample => ({ frame, pts, comX: null, comY: null, bodyScale: null, reason });
  if (poses.length !== 1) return fail('POSE_NOT_UNIQUE');
  const p = poses[0];
  for (const i of REQUIRED) {
    if (!p[i] || !Number.isFinite(p[i].x) || !Number.isFinite(p[i].y) ||
      p[i].x <= 0 || p[i].x >= 1 || p[i].y <= 0 || p[i].y >= 1) return fail('BODY_POINT_OUTSIDE_IMAGE');
    if (!Number.isFinite(p[i].visibility) || p[i].visibility < .5) return fail('BODY_POINT_OCCLUDED');
  }
  const shoulders = between(p[11], p[12], .5), hips = between(p[23], p[24], .5);
  const head = between(p[7], p[8], .5);
  const parts: { mass: number; point: Point }[] = [
    { mass: .0681, point: head },
    { mass: .43015, point: between(shoulders, hips, .5051) },
  ];
  for (const side of [0, 1]) {
    parts.push(
      { mass: .0263, point: between(p[11 + side], p[13 + side], .5763) },
      { mass: .015, point: between(p[13 + side], p[15 + side], .45665) },
      { mass: .00585, point: p[15 + side] },
      { mass: .1447, point: between(p[23 + side], p[25 + side], .38535) },
      { mass: .0457, point: between(p[25 + side], p[27 + side], .43735) },
      { mass: .0133, point: between(p[29 + side], p[31 + side], .42145) },
    );
  }
  const mass = parts.reduce((s, part) => s + part.mass, 0);
  // Vertical body extent is used only for dimensionless quality checks, never
  // as a known physical height. No user height or hidden scale is assumed.
  const bodyScale = Math.max(p[29].y, p[30].y, p[31].y, p[32].y) - head.y;
  if (bodyScale < .15) return fail('BODY_TOO_SMALL_OR_NOT_UPRIGHT');
  return { frame, pts, comX: parts.reduce((s, part) => s + part.mass * part.point.x, 0) / mass * 960,
    comY: parts.reduce((s, part) => s + part.mass * part.point.y, 0) / mass * 960, bodyScale: bodyScale * 960 };
}
