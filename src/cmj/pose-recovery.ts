import type { NormalizedLandmark } from '@mediapipe/tasks-vision';
import { centerOfMassSample } from './center-of-mass';

export interface PoseCrop { x: number; y: number; w: number; h: number }
/** Retry only a uniquely identified person's occluded landmarks. No coordinates
 * are synthesized: recovery must infer the same source image independently. */
export function recoveryCrop(poses: NormalizedLandmark[][]): PoseCrop | null {
  if (poses.length !== 1 || poses[0].length !== 33) return null;
  const p = poses[0];
  if (p.some(v => !Number.isFinite(v.x) || !Number.isFinite(v.y))) return null;
  const x = Math.max(0, Math.min(...p.map(v => v.x)) - .08), y = Math.max(0, Math.min(...p.map(v => v.y)) - .08);
  const right = Math.min(1, Math.max(...p.map(v => v.x)) + .08), bottom = Math.min(1, Math.max(...p.map(v => v.y)) + .08);
  return right - x >= .1 && bottom - y >= .2 ? { x, y, w: right - x, h: bottom - y } : null;
}
export function acceptRecoveredPose(original: NormalizedLandmark[][], local: NormalizedLandmark[][],
  crop: PoseCrop, frame: number, pts: number): NormalizedLandmark[][] | null {
  if (original.length !== 1 || local.length !== 1 || original[0].length !== 33 || local[0].length !== 33) return null;
  const mapped = local[0].map(p => ({ ...p, x: crop.x + p.x * crop.w, y: crop.y + p.y * crop.h }));
  // Preserve subject identity and agreement with already-reliable joints.
  for (const i of [11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28]) {
    const a = original[0][i], b = mapped[i];
    if (a.visibility >= .5 && Math.hypot(a.x - b.x, a.y - b.y) > .04) return null;
  }
  return centerOfMassSample([mapped], frame, pts).comY === null ? null : [mapped];
}
