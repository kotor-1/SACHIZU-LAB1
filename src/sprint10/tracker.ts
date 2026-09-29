import type { Point } from './analysis';
interface Candidate { p: Point[]; x: number; y: number }
interface Acquisition { x: number; y: number; pts: number; velocity: number; count: number }
const TIME_EPSILON = 1e-9;
const updateVelocity = (previous: number, dx: number, dt: number) => .7 * previous + .3 * Math.max(-1, Math.min(1, dx / dt));
function candidatesNear(poses: Candidate[], expected: number, radius: number, y: number | null) {
  return poses.filter(p => Math.abs(p.x - expected) < radius && (y === null || Math.abs(p.y - y) < .08))
    .sort((a, b) => Math.abs(a.x - expected) - Math.abs(b.x - expected));
}
const ambiguous = (poses: Candidate[], expected: number) => poses.length > 1
  && Math.abs(poses[1].x - expected) - Math.abs(poses[0].x - expected) < .03;
/** Tracks the pelvis, which is invariant to swapping left/right landmark labels.
 * Startup needs three consecutive observations before it can move the crop.
 * Confirmed tracks reject ambiguity and long gaps, never silently switching. */
export class SprintTracker {
  private x: number;
  private y: number | null = null;
  private pts: number | null = null;
  private velocity = 0;
  private acquisition: Acquisition | null = null;
  constructor(startX: number) { this.x = startX; }
  expected(pts: number) { return this.x + this.velocity * Math.min(.1, this.pts === null ? 0 : pts - this.pts); }
  choose(poses: Point[][], pts: number): Point[] {
    if (!Number.isFinite(pts)) { this.acquisition = null; return []; }
    if (this.pts !== null && (pts <= this.pts || pts - this.pts - .35 > TIME_EPSILON)) return [];
    const valid = poses.filter(p => [23, 24].every(i => p[i] && Number.isFinite(p[i].x) && Number.isFinite(p[i].y)
      && p[i].x > 0 && p[i].x < 1 && p[i].y > 0 && p[i].y < 1 && (p[i].visibility ?? 0) >= .3))
      .map(p => ({ p, x: (p[23].x + p[24].x) / 2, y: (p[23].y + p[24].y) / 2 }));
    if (this.pts === null) {
      const previous = this.acquisition;
      if (previous && pts > previous.pts && pts - previous.pts - .05 <= TIME_EPSILON) {
        const expected = previous.x + previous.velocity * (pts - previous.pts);
        const candidates = candidatesNear(valid, expected, .06, previous.y);
        if (ambiguous(candidates, expected)) { this.acquisition = null; return []; }
        if (candidates.length) {
          const best = candidates[0];
          const velocity = updateVelocity(previous.velocity, best.x - previous.x, pts - previous.pts);
          const count = previous.count + 1;
          if (count < 3) { this.acquisition = { x: best.x, y: best.y, pts, velocity, count }; return []; }
          this.x = best.x; this.y = best.y; this.pts = pts; this.velocity = velocity; this.acquisition = null;
          return best.p;
        }
      }
      // A discontinuity restarts acquisition at the original gate seed. Never
      // publish provisional samples or feed them back into the image crop.
      this.acquisition = null;
      const candidates = candidatesNear(valid, this.x, .15, null);
      if (!candidates.length || ambiguous(candidates, this.x)) return [];
      const best = candidates[0];
      this.acquisition = { x: best.x, y: best.y, pts, velocity: 0, count: 1 };
      return [];
    }
    const expected = this.expected(pts);
    const candidates = candidatesNear(valid, expected, .06, this.y);
    if (!candidates.length || ambiguous(candidates, expected)) return [];
    const best = candidates[0];
    this.velocity = updateVelocity(this.velocity, best.x - this.x, pts - this.pts);
    this.x = best.x; this.y = best.y; this.pts = pts;
    return best.p;
  }
}
