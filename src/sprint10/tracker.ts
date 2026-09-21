import type { Point } from './analysis';
/** Tracks the pelvis, which is invariant to swapping left/right landmark labels.
 * Ambiguous candidates and long gaps are rejected, not silently switched. */
export class SprintTracker {
  private x: number;
  private y: number | null = null;
  private pts: number | null = null;
  private velocity = 0;
  constructor(startX: number) { this.x = startX; }
  expected(pts: number) { return this.x + this.velocity * Math.min(.1, this.pts === null ? 0 : pts - this.pts); }
  choose(poses: Point[][], pts: number): Point[] {
    if (this.pts !== null && pts - this.pts > .35) return [];
    const expected = this.expected(pts);
    const candidates = poses.filter(p => [23, 24].every(i => p[i] && Number.isFinite(p[i].x) && Number.isFinite(p[i].y)
      && p[i].x > 0 && p[i].x < 1 && p[i].y > 0 && p[i].y < 1 && (p[i].visibility ?? 0) >= .3))
      .map(p => ({ p, x: (p[23].x + p[24].x) / 2, y: (p[23].y + p[24].y) / 2 }))
      .filter(p => Math.abs(p.x - expected) < (this.pts === null ? .15 : .06)
        && (this.y === null || Math.abs(p.y - this.y) < .08))
      .sort((a, b) => Math.abs(a.x - expected) - Math.abs(b.x - expected));
    if (!candidates.length || (candidates.length > 1 && Math.abs(candidates[1].x - expected) - Math.abs(candidates[0].x - expected) < .03)) return [];
    const best = candidates[0];
    if (this.pts !== null && pts > this.pts) this.velocity = .7 * this.velocity + .3 * Math.max(-1, Math.min(1, (best.x - this.x) / (pts - this.pts)));
    this.x = best.x; this.y = best.y; this.pts = pts;
    return best.p;
  }
}
