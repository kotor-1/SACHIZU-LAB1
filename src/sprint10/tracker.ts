import type { Point } from './analysis';
interface Candidate { p: Point[]; x: number; y: number }
interface Position { t: number; x: number }
interface Acquisition { x: number; y: number; pts: number; points: Position[] }
interface Resumption { startX: number; startPts: number; x: number; y: number; pts: number; count: number }
interface Challenger { x: number; y: number; pts: number; count: number }
const TIME_EPSILON = 1e-9;
/** Velocity is the least-squares slope of the positions accepted in the last
 * 0.2 s, once they span 0.1 s. An exponential average lagged a start's
 * acceleration, so the prediction drifted back onto a person standing just
 * ahead of the start line while the runner passed. */
const VELOCITY_WINDOW_SECONDS = .2;
const VELOCITY_MIN_SPAN_SECONDS = .1;
/** Above this speed (image widths/s) the subject is running. */
const RUNNING_SPEED = .2;
/** Gaps up to this are bridged directly; longer ones need a verified resumption. */
const SHORT_GAP_SECONDS = .1;
/** A track is predicted forward for at most this long, then abandoned. */
const MAX_PREDICTION_SECONDS = 1.5;
/** Frame-to-frame search radius around the prediction (the pelvis moves less
 * than 0.005 image widths per frame at 120 fps even at full speed), and the
 * wider radius for continuity of provisional observations. */
const FRAME_RADIUS = .03;
const TRACK_RADIUS = .06;
/** Initial search radius around the start gate. */
const SEED_RADIUS = .15;
/** A track moving toward the finish faster than this is heading for it: it is
 * not replaced before the run, and resumes only on a pose that moves the same way. */
const HEADING_SPEED = .05;
function fitLine(points: Position[]) {
  const mt = points.reduce((s, h) => s + h.t, 0) / points.length, mx = points.reduce((s, h) => s + h.x, 0) / points.length;
  const den = points.reduce((s, h) => s + (h.t - mt) ** 2, 0);
  return { mt, mx, slope: den > 0 ? points.reduce((s, h) => s + (h.t - mt) * (h.x - mx), 0) / den : 0 };
}
function candidatesNear(poses: Candidate[], centre: number, radius: number, y: number | null) {
  return poses.filter(p => Math.abs(p.x - centre) < radius && (y === null || Math.abs(p.y - y) < .08))
    .sort((a, b) => Math.abs(a.x - centre) - Math.abs(b.x - centre));
}
const ambiguous = (poses: Candidate[], centre: number) => poses.length > 1
  && Math.abs(poses[1].x - centre) - Math.abs(poses[0].x - centre) < .03;

/** Tracks the pelvis, which is invariant to swapping left/right landmark labels.
 * Startup needs three consecutive observations before it can move the crop.
 * While running, candidates are judged against the subject's own trajectory
 * from at least 0.1 s earlier, so a bystander who is briefly nearest cannot
 * drag the track along frame by frame. After a gap the track resumes only on
 * consecutive poses that keep the runner's direction and pace. Before the run,
 * when the run direction is known, the subject is the person nearest the start
 * gate: someone who was acquired first and is not heading for the finish (a
 * bystander, or a person walking back) gives way to a person nearer the gate. */
export class SprintTracker {
  private x: number;
  private y: number | null = null;
  private pts: number | null = null;
  private velocity = 0;
  private history: Position[] = [];
  private acquisition: Acquisition | null = null;
  private resumption: Resumption | null = null;
  private challenger: Challenger | null = null;
  private running = false;
  private behindStart = false;
  private readonly seed: number;
  private readonly direction: number;
  /** direction: sign of finish - start; 0 when unknown (no pre-run replacement). */
  constructor(startX: number, direction = 0) { this.x = this.seed = startX; this.direction = Math.sign(direction); }
  /** Crop centre: the track is extrapolated while it is briefly unobserved. */
  expected(pts: number) {
    return this.x + this.velocity * Math.max(0, Math.min(MAX_PREDICTION_SECONDS, this.pts === null ? 0 : pts - this.pts));
  }
  choose(poses: Point[][], pts: number): Point[] {
    if (!Number.isFinite(pts)) { this.acquisition = null; this.resumption = null; return []; }
    if (this.pts !== null && pts <= this.pts) return [];
    const valid = poses.filter(p => [23, 24].every(i => p[i] && Number.isFinite(p[i].x) && Number.isFinite(p[i].y)
      && p[i].x > 0 && p[i].x < 1 && p[i].y > 0 && p[i].y < 1 && (p[i].visibility ?? 0) >= .3))
      .map(p => ({ p, x: (p[23].x + p[24].x) / 2, y: (p[23].y + p[24].y) / 2 }));
    if (this.pts === null) return this.acquire(valid, pts);
    const replaced = this.challenge(valid, pts);
    if (replaced) return replaced;
    const since = pts - this.pts;
    if (since - MAX_PREDICTION_SECONDS > TIME_EPSILON) return [];
    if (since - SHORT_GAP_SECONDS > TIME_EPSILON || this.resumption) return this.resume(valid, pts);
    const centre = this.reference(pts) ?? this.expected(pts);
    const candidates = candidatesNear(valid, centre, FRAME_RADIUS, this.y);
    if (!candidates.length || ambiguous(candidates, centre)) return [];
    return this.accept(candidates[0], pts);
  }
  /** While running: the subject's own path from 0.1-0.4 s earlier, extrapolated. */
  private reference(pts: number): number | null {
    if (Math.abs(this.velocity) < RUNNING_SPEED) return null;
    const older = this.history.filter(h => pts - h.t >= SHORT_GAP_SECONDS - TIME_EPSILON && pts - h.t <= .4 + TIME_EPSILON);
    if (older.length < 4 || older.at(-1)!.t - older[0].t < .08) return null;
    const line = fitLine(older);
    return line.mx + line.slope * (pts - line.mt);
  }
  private accept(best: Candidate, pts: number): Point[] {
    this.x = best.x; this.y = best.y; this.pts = pts; this.resumption = null;
    if ((best.x - this.seed) * this.direction <= 0) this.behindStart = true;
    this.history.push({ t: pts, x: best.x });
    while (this.history.length && pts - this.history[0].t > .6) this.history.shift();
    this.updateVelocity(pts);
    return best.p;
  }
  private updateVelocity(pts: number) {
    const recent = this.history.filter(h => pts - h.t <= VELOCITY_WINDOW_SECONDS + TIME_EPSILON);
    if (recent.length < 3 || recent.at(-1)!.t - recent[0].t < VELOCITY_MIN_SPAN_SECONDS - TIME_EPSILON) return;
    this.velocity = Math.max(-1, Math.min(1, fitLine(recent).slope));
    // Only a subject first seen at or behind the start gate can start the run;
    // a bystander ahead of it, or a jump between two people, cannot.
    if (this.behindStart && this.velocity * this.direction >= RUNNING_SPEED) this.running = true;
  }
  /** Before the run: three consecutive observations (50 ms apart at most) of a
   * person at least 0.03 nearer the start gate replace a track that is not
   * heading for the finish. */
  private challenge(valid: Candidate[], pts: number): Point[] | null {
    if (!this.direction || this.running || this.velocity * this.direction >= HEADING_SPEED) { this.challenger = null; return null; }
    const own = Math.abs(this.expected(pts) - this.seed);
    const best = candidatesNear(valid, this.seed, Math.min(SEED_RADIUS, own - .03), null)[0];
    const previous = this.challenger;
    if (!best) { this.challenger = null; return null; }
    const continues = previous && pts - previous.pts - .05 <= TIME_EPSILON
      && Math.abs(best.x - previous.x) < TRACK_RADIUS && Math.abs(best.y - previous.y) < .08;
    const count = continues ? previous!.count + 1 : 1;
    if (count < 3) { this.challenger = { x: best.x, y: best.y, pts, count }; return null; }
    this.x = best.x; this.y = best.y; this.pts = pts; this.velocity = 0;
    this.history = [{ t: pts, x: best.x }]; this.resumption = null; this.challenger = null;
    this.behindStart = (best.x - this.seed) * this.direction <= 0;
    return best.p;
  }
  /** After a gap, search around the predicted position (the crop follows it)
   * and require at least three consecutive observations spanning 40 ms. A
   * track that was running, or heading for the finish, resumes only on a pose
   * moving the same way at a comparable pace. */
  private resume(valid: Candidate[], pts: number): Point[] {
    const expected = this.expected(pts), gap = pts - this.pts!;
    const radius = TRACK_RADIUS + .5 * Math.abs(this.velocity) * Math.min(1, gap);
    const moving = Math.abs(this.velocity) >= RUNNING_SPEED || this.velocity * this.direction >= HEADING_SPEED;
    // A runner does not stay behind: a person still at the last position (someone
    // the runner passed) is not a candidate even if the prediction lagged.
    const candidates = candidatesNear(valid, expected, radius, this.y).filter(c => !moving
      || (c.x - this.x) * Math.sign(this.velocity) >= .4 * Math.abs(this.velocity) * Math.min(MAX_PREDICTION_SECONDS, gap));
    if (!candidates.length || ambiguous(candidates, expected)) { this.resumption = null; return []; }
    const best = candidates[0], previous = this.resumption;
    const continues = previous && pts - previous.pts - .05 <= TIME_EPSILON
      && Math.abs(best.x - (previous.x + this.velocity * (pts - previous.pts))) < TRACK_RADIUS && Math.abs(best.y - previous.y) < .08;
    const current: Resumption = continues
      ? { ...previous!, x: best.x, y: best.y, pts, count: previous!.count + 1 }
      : { startX: best.x, startPts: pts, x: best.x, y: best.y, pts, count: 1 };
    this.resumption = current;
    const span = current.pts - current.startPts;
    if (current.count < 3 || span - .04 < -TIME_EPSILON) return [];
    const pace = (current.x - current.startX) / span;
    if (moving && (Math.sign(pace) !== Math.sign(this.velocity) || Math.abs(pace) < .4 * Math.abs(this.velocity))) {
      this.resumption = null; return [];
    }
    this.history = [];
    return this.accept(best, pts);
  }
  private acquire(valid: Candidate[], pts: number): Point[] {
    const previous = this.acquisition;
    if (previous && pts > previous.pts && pts - previous.pts - .05 <= TIME_EPSILON) {
      const velocity = previous.points.length > 1 ? fitLine(previous.points).slope : 0;
      const expected = previous.x + velocity * (pts - previous.pts);
      const candidates = candidatesNear(valid, expected, TRACK_RADIUS, previous.y);
      if (ambiguous(candidates, expected)) { this.acquisition = null; return []; }
      if (candidates.length) {
        const best = candidates[0], points = [...previous.points, { t: pts, x: best.x }];
        if (points.length < 3) { this.acquisition = { x: best.x, y: best.y, pts, points }; return []; }
        this.x = best.x; this.y = best.y; this.pts = pts; this.acquisition = null;
        this.behindStart = points.some(h => (h.x - this.seed) * this.direction <= 0);
        this.history = points; this.updateVelocity(pts);
        return best.p;
      }
    }
    // A discontinuity restarts acquisition at the original gate seed. Never
    // publish provisional samples or feed them back into the image crop.
    this.acquisition = null;
    const candidates = candidatesNear(valid, this.x, SEED_RADIUS, null);
    if (!candidates.length || ambiguous(candidates, this.x)) return [];
    const best = candidates[0];
    this.acquisition = { x: best.x, y: best.y, pts, points: [{ t: pts, x: best.x }] };
    return [];
  }
}
