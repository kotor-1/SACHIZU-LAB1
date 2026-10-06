/** A recording analysed with the two points set on its first frame. The picture drifts while it is recorded (drift.ts),
 * so everything is placed in the first frame's picture, where the points were set: the lane lines are traced in the last
 * frame (the track clear) from the points moved by the drift since the first frame and moved back, and every frame's
 * pose is moved back by its own drift. The drawings on the last frame move the result forward again (`offset`). */
import type { CrouchFrame, CrouchPoint } from '../sprint10/crouch';
import { analyzeCurveStart, type CurveStartResult } from './analysis';
import type { P2 } from './camera';
import { driftAt } from './drift';
import { traceLanes } from './lanes';
import type { CurveRecording } from './recording';

export interface CurvePoints { inner: { x: number; y: number }; outer: { x: number; y: number } }
export function analyzeRecording(rec: CurveRecording, points: CurvePoints): { result: CurveStartResult; offset: P2 } {
  const { width: w, height: h } = rec, [lx, ly] = driftAt(rec.drift, rec.clear.frame);
  const lines = traceLanes(rec.clear.luma, [points.inner.x * w + lx, points.inner.y * h + ly], [points.outer.x * w + lx, points.outer.y * h + ly]);
  const back = (pts: P2[]) => pts.map(([x, y]) => [x - lx, y - ly] as P2);
  const moved = { inner: back(lines.inner), outer: back(lines.outer), start: back(lines.start), near: { inner: back(lines.near.inner), outer: back(lines.near.outer) } };
  const move = (q: CrouchPoint[], dx: number, dy: number) => q.map(p => ({ ...p, x: p.x - dx / w, y: p.y - dy / h }));
  const frames: CrouchFrame[] = rec.frames.map(f => {
    const [dx, dy] = driftAt(rec.drift, f.frame);
    return { ...f, pose: f.pose ? move(f.pose, dx, dy) : null, ...(f.refined !== undefined ? { refined: f.refined ? move(f.refined, dx, dy) : null } : {}) };
  });
  return { result: analyzeCurveStart(frames, { width: w, height: h, lines: moved, mm35: rec.mm35 }), offset: [lx, ly] };
}
