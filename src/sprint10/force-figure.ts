import { POSE_EDGES } from '../cmj/pose-drawing';
import { anglePose, type CrouchFrame, type CrouchPoint } from './crouch';
import { TOE, visible } from './contacts';

export const CONTACT_COLOR = '#63e6a5', RELEASE_COLOR = '#ff85cf';
type Point = { x: number; y: number };

/** Display only: keep the background at the middle even when that frame has no pose.
 * Keep each endpoint's frame and pose together so it can be shown on its own photo. */
export function forcePicture(frames: readonly CrouchFrame[], start: number, end: number, width: number, height: number,
  anchor: Point | null, events: { start?: number | null; end?: number | null } = {}) {
  const nearest = (t: number) => frames.reduce<CrouchFrame | null>((best, f) =>
    !best || Math.abs(f.pts - t) < Math.abs(best.pts - t) ? f : best, null);
  const middle = nearest((start + end) / 2);
  if (!middle) return null;
  const at = (frame: number | null | undefined, t: number) => {
    const f = (frame == null ? null : frames.find(f => f.frame === frame)) ?? nearest(t);
    return f;
  };
  const startFrame = at(events.start, start), endFrame = at(events.end, end);
  const pose = anglePose(middle), startPose = startFrame ? anglePose(startFrame) : null, endPose = endFrame ? anglePose(endFrame) : null;
  // A side-view model can exchange left and right labels. Pick the middle frame's
  // visible toe closest to the planted position, rather than trusting its side label.
  const toes = pose ? TOE.flatMap(k => visible(pose[k]) ? [{ x: pose[k].x * width, y: pose[k].y * height }] : []) : [];
  const origin = anchor ? toes.reduce<Point | null>((best, toe) => !best ||
    Math.hypot(toe.x - anchor.x, toe.y - anchor.y) < Math.hypot(best.x - anchor.x, best.y - anchor.y) ? toe : best, null) ?? anchor
    : toes.reduce<Point | null>((best, toe) => !best || toe.y > best.y ? toe : best, null);
  return { frame: middle.frame, pts: middle.pts, origin, startPose, endPose,
    start: startFrame ? { frame: startFrame.frame, pts: startFrame.pts } : null,
    end: endFrame ? { frame: endFrame.frame, pts: endFrame.pts } : null,
    bounds: [...(pose ?? []), ...(startPose ?? []), ...(endPose ?? [])] };
}

/** Thin, translucent endpoint outline on its own frame, without joint dots. */
export function drawForcePose(ctx: CanvasRenderingContext2D, pose: CrouchPoint[] | null,
  to: (p: Point) => Point, unit: number, color: string) {
  if (!pose) return;
  ctx.save(); ctx.strokeStyle = color; ctx.globalAlpha = .55;
  ctx.lineWidth = unit * .18; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for (const [a, b] of POSE_EDGES) {
    if (!visible(pose[a], .3) || !visible(pose[b], .3)) continue;
    const p = to(pose[a]), q = to(pose[b]);
    ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
  }
  ctx.restore();
}
