import type { NormalizedLandmark } from '@mediapipe/tasks-vision';
import type { PoseSelector } from '../cmj/mobile-pose';
export interface SubjectRegion { left: number; right: number; top: number; bottom: number }
export const DEFAULT_REGION: SubjectRegion = { left: .15, right: .8, top: .05, bottom: .9 };
export function validRegion(r: SubjectRegion) {
  return Object.values(r).every(Number.isFinite) && r.left >= 0 && r.top >= 0 && r.right <= 1 && r.bottom <= 1 &&
    r.right - r.left >= .15 && r.bottom - r.top >= .3;
}
/** User-confirmed whole-body region, NOT 'largest person wins'. Require a
 * unique person filling at least half the region's height, then continuity.
 * Missingness is never filled using last coordinates or another person. */
export function createSubjectSelector(region: SubjectRegion): PoseSelector {
  if (!validRegion(region)) throw new Error('対象者の枠を確認してください。');
  let last: { x: number; y: number; size: number; pts: number } | null = null;
  return (poses: NormalizedLandmark[][], pts: number) => {
    const candidates = poses.flatMap(p => {
      const required = [7, 8, 23, 24, 29, 30, 31, 32];
      if (required.some(i => !p[i] || !Number.isFinite(p[i].x) || !Number.isFinite(p[i].y) || !Number.isFinite(p[i].visibility) || p[i].visibility < .5)) return [];
      const x = (p[23].x + p[24].x) / 2, y = (p[23].y + p[24].y) / 2;
      const head = Math.min(p[7].y, p[8].y), foot = Math.max(p[29].y, p[30].y, p[31].y, p[32].y), size = foot - head;
      if (x < region.left || x > region.right || head < region.top || foot > region.bottom || size <= 0) return [];
      // Acquire from standing size; thereafter allow a squat while requiring
      // frame-to-frame identity continuity. Never reacquire a smaller person.
      if (!last && size < (region.bottom - region.top) * .5) return [];
      if ([29, 30, 31, 32].some(i => p[i].x < region.left || p[i].x > region.right)) return [];
      if (last && (pts <= last.pts || pts - last.pts > .25 ||
        Math.hypot(x - last.x, y - last.y) > .035 + .8 * (pts - last.pts) ||
        size / last.size < .7 || size / last.size > 1.3)) return [];
      return [{ p, x, y, size, pts }];
    });
    if (candidates.length !== 1) return [];
    const candidate = candidates[0];
    last = candidate;
    return [candidate.p];
  };
}
