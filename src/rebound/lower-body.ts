import type { NormalizedLandmark } from '@mediapipe/tasks-vision';
import type { COMSample } from '../cmj/center-of-mass';
import type { PoseSelector } from '../cmj/mobile-pose';
import { validRegion, type SubjectRegion } from './subject';

export type SignalId = 'PELVIS' | 'HIP_KNEE';
export type JumpMode = 'BOTH' | 'RIGHT' | 'LEFT';
export const SIGNALS: { id: SignalId; name: string }[] = [
  { id: 'PELVIS', name: '骨盤中心' }, { id: 'HIP_KNEE', name: '腰・膝の中点' },
];
const validPoint = (p?: NormalizedLandmark) => !!p && Number.isFinite(p.x) && Number.isFinite(p.y) &&
  p.x > 0 && p.x < 1 && p.y > 0 && p.y < 1 && Number.isFinite(p.visibility) && p.visibility >= .5;
function geometry(p: readonly NormalizedLandmark[], mode: JumpMode) {
  const sides = mode === 'BOTH' ? [0, 1] : mode === 'RIGHT' ? [1] : [0];
  if ([23, 24, ...sides.flatMap(s => [25 + s, 27 + s])].some(i => !validPoint(p[i]))) return null;
  const hip = { x: (p[23].x + p[24].x) / 2, y: (p[23].y + p[24].y) / 2 };
  const knee = { x: sides.reduce((v, s) => v + p[25 + s].x, 0) / sides.length, y: sides.reduce((v, s) => v + p[25 + s].y, 0) / sides.length };
  const length = (sides.reduce((n, side) => n +
    Math.abs(p[23 + side].y - p[25 + side].y) +
    Math.abs(p[25 + side].y - p[27 + side].y), 0)) / sides.length;
  return length >= .12 ? { hip, knee, length } : null;
}
/** Fixed geometric proxies, NOT an anatomical centre of mass. No per-frame
 * switching of landmarks/weights and no reconstruction of missing anatomy. */
export function lowerBodySamples(poses: readonly NormalizedLandmark[][], frame: number, pts: number, mode: JumpMode = 'BOTH'): Record<SignalId, COMSample> {
  const fail = (reason: string): Record<SignalId, COMSample> => {
    const sample = { frame, pts, comX: null, comY: null, bodyScale: null, reason };
    return { PELVIS: { ...sample }, HIP_KNEE: { ...sample } };
  };
  if (poses.length !== 1) return fail('LOWER_SUBJECT_UNRESOLVED');
  const g = geometry(poses[0], mode); if (!g) return fail('LOWER_POINTS_UNAVAILABLE');
  const sample = (x: number, y: number): COMSample => ({ frame, pts, comX: x * 960, comY: y * 960, bodyScale: g.length * 960 });
  return { PELVIS: sample(g.hip.x, g.hip.y), HIP_KNEE: sample((g.hip.x + g.knee.x) / 2, (g.hip.y + g.knee.y) / 2) };
}

/** Unique lower-body candidate in a user-confirmed region. Short reacquisition
 * is allowed only with position AND segment-size continuity. Long loss stops
 * reacquisition; previous coordinates never supply observations. */
export function createLowerSubjectSelector(region: SubjectRegion, mode: JumpMode = 'BOTH'): PoseSelector {
  if (!validRegion(region)) throw new Error('対象者の枠を確認してください。');
  let last: { x: number; y: number; length: number; pts: number } | null = null;
  let initialLength = 0;
  return (poses, pts) => {
    if (!Number.isFinite(pts)) return [];
    const candidates = poses.flatMap(p => {
      const g = geometry(p, mode); if (!g) return [];
      const anchors = mode === 'BOTH' ? [23, 24, 27, 28] : [23, 24, mode === 'RIGHT' ? 28 : 27];
      if (anchors.some(i => p[i].x < region.left || p[i].x > region.right || p[i].y < region.top || p[i].y > region.bottom)) return [];
      if (!last && g.length < (region.bottom - region.top) * .18) return [];
      if (last) {
        const dt = pts - last.pts;
        if (dt <= 0 || dt > .75 || Math.hypot(g.hip.x - last.x, g.hip.y - last.y) > Math.min(.25, .035 + dt * .8) ||
          g.length / last.length < .75 || g.length / last.length > 1.33 ||
          g.length / initialLength < .6 || g.length / initialLength > 1.8) return [];
      }
      return [{ p, ...g }];
    });
    if (candidates.length !== 1) return [];
    const c = candidates[0]; initialLength ||= c.length;
    last = { ...c.hip, length: c.length, pts }; return [c.p];
  };
}
