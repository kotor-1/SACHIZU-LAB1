/** Which of the people found is the athlete (the recorded video and the camera alike). */
type Pt = { x: number; y: number; visibility?: number };
export type Box = { cx: number; cy: number; h: number; w: number };
/** A pose's box (normalized) from its points seen. */
export function boxOf(p: readonly Pt[]): Box | null {
  const s = p.filter(q => (q.visibility ?? 0) >= .3 && Number.isFinite(q.x) && Number.isFinite(q.y));
  if (s.length < 8) return null;
  const xs = s.map(q => q.x), ys = s.map(q => q.y);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  return { cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, h: y1 - y0, w: x1 - x0 };
}
/** The athlete among the poses: the one nearest the last one found (within its height), else the tallest (a gym's
 * mirror or a partner behind is smaller or farther). */
export function pickAthlete(poses: readonly (readonly Pt[])[], last: Box | null) {
  const boxes = poses.map(p => ({ p, b: boxOf(p) })).filter((x): x is { p: readonly Pt[]; b: Box } => !!x.b);
  if (!boxes.length) return null;
  if (last) {
    const near = boxes.map(x => ({ ...x, d: Math.hypot(x.b.cx - last.cx, x.b.cy - last.cy) })).sort((a, b) => a.d - b.d)[0];
    if (near.d < .5 * Math.max(last.h, .1) && near.b.h > .5 * last.h) return near;
  }
  return boxes.sort((a, b) => b.b.h - a.b.h)[0];
}
