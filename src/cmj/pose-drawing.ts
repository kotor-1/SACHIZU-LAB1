import type { NormalizedLandmark } from '@mediapipe/tasks-vision';
import { centerOfMassSample } from './center-of-mass';

export const POSE_EDGES = [[11, 12], [11, 13], [13, 15], [12, 14], [14, 16], [11, 23], [12, 24],
  [23, 24], [23, 25], [25, 27], [24, 26], [26, 28], [27, 29], [29, 31], [27, 31], [28, 30], [30, 32], [28, 32]];
export function visiblePoint(p?: NormalizedLandmark) {
  return !!p && Number.isFinite(p.x) && Number.isFinite(p.y) && p.x > 0 && p.x < 1 && p.y > 0 && p.y < 1 && p.visibility >= .5;
}
/** Display only. Never supplies landmarks or COM to any measurement. */
export function drawPose(context: CanvasRenderingContext2D, poses: NormalizedLandmark[][], frame: number, pts: number) {
  if (poses.length !== 1) return;
  const p = poses[0], { width: w, height: h } = context.canvas;
  context.save(); context.setTransform(1, 0, 0, 1, 0, 0);
  context.strokeStyle = '#aafa9a'; context.fillStyle = '#aafa9a'; context.lineWidth = Math.max(2, w / 180);
  for (const [a, b] of POSE_EDGES) {
    if (!visiblePoint(p[a]) || !visiblePoint(p[b])) continue;
    context.beginPath(); context.moveTo(p[a].x * w, p[a].y * h); context.lineTo(p[b].x * w, p[b].y * h); context.stroke();
  }
  for (const i of new Set(POSE_EDGES.flat())) {
    if (!visiblePoint(p[i])) continue;
    context.beginPath(); context.arc(p[i].x * w, p[i].y * h, Math.max(2, w / 140), 0, Math.PI * 2); context.fill();
  }
  const com = centerOfMassSample(poses, frame, pts);
  if (com.comX !== null && com.comY !== null) {
    context.fillStyle = '#ffda63'; context.strokeStyle = '#173b31'; context.lineWidth = 2;
    context.beginPath(); context.arc(com.comX / 960 * w, com.comY / 960 * h, Math.max(5, w / 55), 0, Math.PI * 2); context.fill(); context.stroke();
  }
  context.restore();
}
export function nearestPoseFrame<T extends { pts: number }>(frames: readonly T[], pts: number): T | null {
  if (!frames.length || !Number.isFinite(pts)) return null;
  let lo = 0, hi = frames.length;
  while (lo < hi) { const mid = (lo + hi) >>> 1; if (frames[mid].pts < pts) lo = mid + 1; else hi = mid; }
  const a = frames[Math.max(0, lo - 1)], b = frames[Math.min(lo, frames.length - 1)];
  const best = Math.abs(a.pts - pts) <= Math.abs(b.pts - pts) ? a : b;
  return Math.abs(best.pts - pts) <= .05 ? best : null;
}
