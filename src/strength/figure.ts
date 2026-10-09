/** The squat / RDL on pictures: the measured lines drawn with the shared figure (src/sprint10/crouch-figure.ts). */
import type { CrouchFrame, CrouchPoint } from '../sprint10/crouch';
import type { Mark, Phase } from '../sprint10/crouch-figure';
import { framePosture, nearPose, PAIRS, stanceSide, type Exercise, type Posture, type Rep, type StrengthResult } from './analysis';

const seen = (p?: CrouchPoint) => !!p && Number.isFinite(p.x) && Number.isFinite(p.y) && (p.visibility ?? 1) >= .3;
/** A pose with each left and right point put at their middle (on one leg, the shoulders and hips as the analysis takes them). */
export function merged(pose: readonly CrouchPoint[] | null | undefined): CrouchPoint[] | null {
  if (!pose) return null;
  const out = pose.map(p => ({ ...p }));
  for (const [i, j] of PAIRS) {
    const a = pose[i], b = pose[j];
    if (!a || !b) continue;
    const m = seen(a) && seen(b) ? { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, visibility: Math.min(a.visibility ?? 1, b.visibility ?? 1) } : seen(a) ? { ...a } : seen(b) ? { ...b } : null;
    if (m) { out[i] = m; out[j] = { ...m }; }
  }
  return out;
}
/** On one leg: the standing leg put on side 0 and the lifted one on side 1 (as the analysis tells them apart, the lower
 * ankle standing), the shoulders and hips at their middles. */
export function legsApart(pose: readonly CrouchPoint[] | null | undefined): CrouchPoint[] | null {
  if (!pose) return null;
  const s = stanceSide(pose), out = merged(pose)!;
  if (s === null) return out;
  for (let i = 25; i <= 31; i += 2) { out[i] = { ...pose[i + s] }; out[i + 1] = { ...pose[i + 1 - s] }; }
  return out;
}
/** The frames with the poses as the analysis measures them (both legs: the nearer side's, `nearPose`), for the pictures
 * and the replay: the drawn lines are then the measured ones. */
export const sideOn = (frames: readonly CrouchFrame[], exercise: Exercise = 'squat'): CrouchFrame[] => {
  const shape = exercise === 'slrdl' ? legsApart : (p: readonly CrouchPoint[] | null | undefined) => p ? nearPose(p) : null;
  return frames.map(f => ({ ...f, pose: shape(f.pose), refined: f.refined === undefined ? undefined : shape(f.refined) }));
};

/** The lines shown for a posture: squat, the thigh against the level, the trunk and the shank (depth, and the trunk
 * against the shank); RDL, the hip and the knee (180 = straight) and the shank; on one leg, the trunk against the
 * lifted leg, the standing knee and shank. */
export function marksOf(p: Posture, exercise: Exercise): Mark[] {
  const out: Mark[] = [];
  if (exercise === 'squat') {
    if (p.thigh !== null) out.push({ kind: 'level', side: 0, label: '太もも', value: p.thigh });
    if (p.trunk !== null) out.push({ kind: 'trunk', label: '体幹', value: p.trunk });
  } else if (exercise === 'slrdl') {
    // Standing, both feet down: no line to judge.
    if (p.line !== null && (p.trunk ?? 0) >= 45) out.push({ kind: 'line', side: 1, label: '一直線', value: p.line });
    if (p.knee !== null) out.push({ kind: 'knee', side: 0, label: '膝', value: p.knee });
  } else {
    if (p.hip !== null) out.push({ kind: 'hip', side: 0, label: '股関節', value: p.hip });
    if (p.knee !== null) out.push({ kind: 'knee', side: 0, label: '膝', value: p.knee });
  }
  if (p.shank !== null) out.push({ kind: 'shank', side: 0, label: '脛', value: p.shank });
  return out;
}
/** One camera frame's lines (its own facing). */
export const liveMarks = (f: CrouchFrame, exercise: Exercise, width: number, height: number): Mark[] => marksOf(framePosture(f, { width, height, exercise }), exercise);
/** The pictures: the standing posture before the first rep, then each rep's bottom. */
export function repPhases(result: StrengthResult): Phase[] {
  const first = result.reps[0];
  // Standing: the frame at the rep's start with angles measured (RTMPose runs on every other frame).
  const ps = result.postures, at = first ? ps.findIndex(p => p.frame === first.startFrame) : -1;
  const stand = at < 0 ? null : [0, -1, 1, -2, 2, -3, 3].map(k => ps[at + k]).find(p => p && p.frame <= first.bottomFrame && p.trunk !== null) ?? null;
  const out: Phase[] = first && stand ? [{ key: 'top', label: '1回目の前（立った姿勢）', short: '開始', frame: stand.frame, pts: stand.pts, marks: marksOf(stand, result.exercise) }] : [];
  for (const r of result.reps) out.push({ key: `rep${r.index}`, label: `${r.index}回目の${result.exercise === 'squat' ? '最も深い所' : '最も倒した所'}`, short: `${r.index}回目`,
    frame: r.bottomFrame, pts: r.bottom, marks: marksOf(r.low, result.exercise) });
  return out;
}
export type { Rep };
