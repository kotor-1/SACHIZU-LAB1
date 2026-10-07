import type { Point } from './analysis';
interface Candidate { p: Point[]; x: number; y: number }
interface Position { t: number; x: number }
/** A provisional flying-start observation keeps its pose for backfilling. */
interface Sighting extends Position { p?: Point[] }
interface Acquisition { x: number; y: number; pts: number; points: Sighting[] }
interface Resumption { startX: number; startPts: number; x: number; y: number; pts: number; count: number }
interface Challenger { x: number; y: number; pts: number; count: number }
/** How the subject arrives at the start gate: standing at it, or already running
 * through it (a maximal-velocity section such as 50-60 m). */
export type SprintStart = 'standing' | 'flying';
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
/** Frames further apart than at 120 frames/s widen the frame-to-frame radius by
 * this speed (image widths/s), up to TRACK_RADIUS: at a live camera's 30
 * frames/s the pelvis moved 0.036 between two frames at the first step of a
 * standing start, the subject was missed across the start line, and its
 * crossing could not be measured (recorded). */
const FRAME_REACH = 1;
const TRACK_RADIUS = .06;
/** Initial search radius around the start gate. */
const SEED_RADIUS = .15;
/** A track moving toward the finish faster than this is heading for it: it is
 * not replaced before the run, and resumes only on a pose that moves the same way. */
const HEADING_SPEED = .05;
/** Flying start: the crop is seeded this far on the run-in side of the gate so
 * the runner is seen earlier, and provisional tracks need this many consecutive
 * observations spanning this long before one is confirmed. */
const FLYING_SEED_OFFSET = .08;
const FLYING_MIN_OBSERVATIONS = 3;
/** Over 40 ms, frame-to-frame pose jitter alone can look like running speed
 * (a person walking back was confirmed); 60 ms of motion is required. */
const FLYING_MIN_SPAN_SECONDS = .06;
const FLYING_MAX_TRACKS = 6;
/** Flying start: the subject must also cover the whole followed span (at least
 * 0.25 s) at the section's sprint speed (FLYING_MIN_SPEED_MPS, converted to
 * image widths/s by the caller). Over 0.1 s, pose jitter moves a fitted speed by
 * about 1 m/s; over 0.25 s by about 0.3 m/s. Recorded: people jogging behind the
 * track at 3.2-3.6 m/s were taken for the runner before the runner arrived; the
 * slowest runner through a 50-60 m section was 5.9 m/s. 4.5 m/s also rejected
 * runners still accelerating at 3.7-4.5 m/s (10 m clips cropped as flying), and
 * first and second graders run sections at 4 m/s or less: 2.5 m/s only rules
 * out walking; people jogging are handled by the watch (REPLACE_*). */
const FLYING_SPEED_SPAN_SECONDS = .25;
export const FLYING_MIN_SPEED_MPS = 2.5;
/** Flying start: while the subject has not passed the exit, the run-in side is
 * watched. A runner decided there replaces the subject when nearer the camera
 * (pelvis lower in the picture by this much) and this much faster: the camera
 * films the measured lane from its side, and people jogging behind it (3-3.6
 * m/s, recorded) are as fast as young runners, so speed alone cannot tell. */
const REPLACE_NEARER = .03;
const REPLACE_FASTER = 1.2;
/** A runner entering at the frame edge is only partly visible, and its pelvis
 * jumps by up to 0.05 image widths between frames. The running decision and the
 * history handed to the confirmed track use only the last 0.1 s, so those edge
 * points neither delay confirmation nor skew the trajectory reference. */
const FLYING_DECISION_SECONDS = .1;
/** The time limits were set for 120 frames/s. A live camera is processed at
 * 15-30 frames/s, and the watch crop every other one of those: with the fixed
 * 50 ms continuity limit the watch dropped the runner arriving behind a person
 * jogging at every sighting and never decided it (recorded). The limits widen
 * to these multiples of the observed frame interval (the watch's own interval
 * for its tracks) when that is longer; at 120 frames/s they are unchanged.
 * GAP_FRAMES: one missed frame is bridged. */
const GAP_FRAMES = 2.5;
/** A track already moving at a known speed is predicted across this many
 * frame intervals without a sighting (50 ms at 120 frames/s): passing in front
 * of a person jogging, the runner was not detected for 0.27 s at a live
 * camera's 15 frames/s, and its watch track was dropped (recorded). */
const COAST_FRAMES = 4.5;
const DECISION_FRAMES = 4.5;
const SPAN_FRAMES = 2.5;
/** Body points that must lie inside the frame for a flying-start observation:
 * shoulders, hips, knees and ankles. A runner cut by the frame edge has a
 * pelvis estimate that jumps between frames and skews the trajectory. */
const BODY_POINTS = [11, 12, 23, 24, 25, 26, 27, 28];
/** Two detections whose pelves are this close are one person detected twice
 * (overlapping detections, more frequent with four people per frame); the
 * second one starts no provisional track of its own. */
const DUPLICATE_X = .012;
const DUPLICATE_Y = .02;
/** Tracing a confirmed flying start back: earlier sightings must lie on the
 * straight line of its last 0.05 s within pose jitter plus the deviation of a
 * runner still accelerating at up to 0.5 image widths/s² (0.5·a·d²; a 10 m
 * start 3 m in accelerates at about 0.34). With 1.5, the 0.25 s decision let
 * the trace reach back to poses cut by the frame edge, whose pelvis lay 0.03-
 * 0.06 ahead of the runner (recorded), and moved the entry by up to 69 ms. */
const TRACE_ANCHOR_SECONDS = .05;
const TRACE_JITTER = .015;
const TRACE_ACCELERATION = .5;
/** view: horizontal extent of the image the pose was estimated in (the crop),
 * whose edges cut a body just like the frame's. A body cut by an edge is
 * squeezed inside it, so points within 1% of the image width of an edge count
 * as outside: recorded, a runner entering at the frame edge (pelvis at 0.007)
 * gave legs that made a leg crossing at mid-cycle, and the steps came out 0.5
 * too few. */
const EDGE_MARGIN = .01;
const insideFrame = (p: Point[], view: readonly [number, number]) => BODY_POINTS.every(i => !p[i]
  || (p[i].x > view[0] + EDGE_MARGIN * (view[1] - view[0]) / .36 && p[i].x < view[1] - EDGE_MARGIN * (view[1] - view[0]) / .36));
/** Recent frame intervals kept for the median. */
const INTERVALS_KEPT = 15;
function keepLast(list: number[], value: number) { list.push(value); if (list.length > INTERVALS_KEPT) list.shift(); }
function median(values: number[]): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[sorted.length >> 1];
}
function fitLine(points: Position[]) {
  const mt = points.reduce((s, h) => s + h.t, 0) / points.length, mx = points.reduce((s, h) => s + h.x, 0) / points.length;
  const den = points.reduce((s, h) => s + (h.t - mt) ** 2, 0);
  return { mt, mx, slope: den > 0 ? points.reduce((s, h) => s + (h.t - mt) * (h.x - mx), 0) / den : 0 };
}
function candidatesNear(poses: Candidate[], centre: number, radius: number, y: number | null, height = .08) {
  return poses.filter(p => Math.abs(p.x - centre) < radius && (y === null || Math.abs(p.y - y) < height))
    .sort((a, b) => Math.abs(a.x - centre) - Math.abs(b.x - centre));
}
const duplicate = (a: Candidate, b: Candidate) => Math.abs(a.x - b.x) < DUPLICATE_X && Math.abs(a.y - b.y) < DUPLICATE_Y;
const ambiguous = (poses: Candidate[], centre: number) => poses.length > 1
  && Math.abs(poses[1].x - centre) - Math.abs(poses[0].x - centre) < .03;
/** Flying start: the pelvis height in the picture tells people at different
 * depths apart. Recorded: the runner (pelvis at 0.67 of the height) passed in
 * front of people jogging on the field behind (0.61) at the same horizontal
 * position for 0.1-0.2 s; judged by horizontal position alone, every such frame
 * was ambiguous and the runner's track restarted. Only someone within 0.03 of
 * the track's height is a rival, and the nearest candidate is chosen by both
 * coordinates. */
const RIVAL_HEIGHT = .03;
/** Frames further apart than this are sparse (a live camera, or a video under
 * 50 frames/s). The search radii then widen and the horizontal position alone
 * no longer tells people apart, so the pelvis height must:
 *  - provisional tracks and a flying subject continue only on a pelvis within
 *    SPARSE_TRACK_HEIGHT of their own (0.08 otherwise). Recorded, live: the
 *    runner's pelvis moved 0.01 between sightings 0.13 s apart; with 0.08 a
 *    track of a person jogging (0.616) took the runner (0.658) passing in front
 *    of them, and a hidden runner was resumed on that person.
 *  - a decided subject starts from its track's speed (see adopt).
 * At 120 frames/s neither applies: there 0.035 dropped a runner whose pelvis
 * jumped 0.04 beside two people 0.02-0.04 higher or lower, and the track's
 * speed moved the crop and changed later poses (recorded, 3 of 152 videos). */
const SPARSE_INTERVAL = 1 / 50;
const SPARSE_TRACK_HEIGHT = .035;
const TRACK_HEIGHT = .08;
/** Fastest runner considered (m/s): a track seen once has no speed yet, so the
 * next sighting is searched as far as this speed reaches after the first 50 ms. */
const TRACK_MAX_SPEED_MPS = 12;
/** Two sightings of a nearer person this far apart (within RIVAL_PAIR_SECONDS)
 * show its speed for SprintTracker.contested. */
const RIVAL_MIN_SECONDS = .1;
const RIVAL_PAIR_SECONDS = .5;
function nearestOnTrack(poses: Candidate[], centre: number, radius: number, y: number | null, height = .08) {
  return poses.filter(p => Math.abs(p.x - centre) < radius && (y === null || Math.abs(p.y - y) < height))
    .sort((a, b) => Math.hypot(a.x - centre, y === null ? 0 : a.y - y) - Math.hypot(b.x - centre, y === null ? 0 : b.y - y));
}
const ambiguousOnTrack = (poses: Candidate[], centre: number, y: number | null) => {
  const rival = poses.slice(1).find(p => y === null || Math.abs(p.y - y) < RIVAL_HEIGHT);
  return !!rival && Math.abs(rival.x - centre) - Math.abs(poses[0].x - centre) < .03;
};

/** Tracks the pelvis, which is invariant to swapping left/right landmark labels.
 * Startup needs three consecutive observations before it can move the crop.
 * While running, candidates are judged against the subject's own trajectory
 * from at least 0.1 s earlier, so a bystander who is briefly nearest cannot
 * drag the track along frame by frame. After a gap the track resumes only on
 * consecutive poses that keep the runner's direction and pace.
 *
 * Standing start: before the run, when the run direction is known, the subject
 * is the person nearest the start gate; someone who was acquired first and is
 * not heading for the finish (a bystander, or a person walking back) gives way
 * to a person nearer the gate.
 *
 * Flying start: the subject is whoever first shows 0.06 s of consecutive
 * observations running toward the finish on the run-in side of the gate, with
 * the whole body inside the frame.
 * Several people are followed provisionally at once, so a bystander standing
 * at the line cannot block the runner, and nobody is ever replaced afterwards.
 * The runner's sightings before that decision are handed back (takeBackfill),
 * so the entry gate can be crossed while the decision is still pending. */
export class SprintTracker {
  private x: number;
  private y: number | null = null;
  private pts: number | null = null;
  private velocity = 0;
  private history: Position[] = [];
  private acquisition: Acquisition | null = null;
  private provisional: Acquisition[] = [];
  private resumption: Resumption | null = null;
  private challenger: Challenger | null = null;
  private running = false;
  private behindStart = false;
  private backfill: { pts: number; pose: Point[] }[] = [];
  private watchTracks: Acquisition[] = [];
  private intervals: number[] = [];
  private watchIntervals: number[] = [];
  private lastPts: number | null = null;
  private lastWatchPts: number | null = null;
  private lastInterval = 1 / 120;
  private publishedFrom: number | null = null;
  private retraction: number | null = null;
  private rivalSeen = false;
  private nearer: { t: number; x: number; y: number }[] = [];
  private readonly finishX: number;
  private readonly seed: number;
  private readonly direction: number;
  private readonly start: SprintStart;
  private readonly sprintSpeed: number;
  /** direction: sign of finish - start; 0 when unknown (no pre-run replacement,
   * and a flying start cannot tell the run-in side, so it behaves as standing).
   * sprintSpeed: the flying subject's minimum speed in image widths/s (from the
   * section length); without it only RUNNING_SPEED applies. */
  /** fromBlocks: a crouch start. The subject is followed at its predicted
   * position without the reference to its own path 0.1-0.4 s earlier: that path
   * was still the set, and the athlete exploding out of the blocks was lost for
   * the whole clearance (recorded, 0.14-0.24 s). A crouch start is filmed with
   * the athlete alone at the blocks, the case the reference protects against. */
  private readonly fromBlocks: boolean;
  constructor(startX: number, direction = 0, start: SprintStart = 'standing', sprintSpeed = 0, fromBlocks = false) {
    this.fromBlocks = fromBlocks;
    this.seed = startX; this.direction = Math.sign(direction); this.finishX = startX + direction;
    this.start = this.direction && start === 'flying' ? 'flying' : 'standing';
    this.sprintSpeed = Math.max(RUNNING_SPEED, sprintSpeed);
    this.x = this.flyingSeed();
  }
  /** Median interval between the frames given while something moved: frames
   * thinned while idle (IDLE_FPS) are not the rate a runner is followed at. */
  private frameInterval() { return median(this.intervals) ?? this.lastInterval; }
  /** Median interval between the frames that came with the watch crop. */
  private watchInterval() { return median(this.watchIntervals) ?? 2 * this.frameInterval(); }
  private gapLimit(interval = this.frameInterval()) { return Math.max(.05, GAP_FRAMES * interval); }
  private get sparse() { return this.frameInterval() > SPARSE_INTERVAL; }
  /** Pelvis height within which a provisional track or a flying subject continues (see SPARSE_INTERVAL). */
  private trackHeight() { return this.sparse ? SPARSE_TRACK_HEIGHT : TRACK_HEIGHT; }
  private frameRadius() { return Math.min(TRACK_RADIUS, FRAME_RADIUS + FRAME_REACH * Math.max(0, this.frameInterval() - 1 / 120)); }
  private shortGap() { return Math.max(SHORT_GAP_SECONDS, GAP_FRAMES * this.frameInterval()); }
  private decisionWindow(interval = this.frameInterval()) { return Math.max(FLYING_DECISION_SECONDS, DECISION_FRAMES * interval); }
  private minSpan(interval = this.frameInterval()) { return Math.max(FLYING_MIN_SPAN_SECONDS, SPAN_FRAMES * interval); }
  private flyingSeed() {
    return this.start === 'flying' ? Math.max(.02, Math.min(.98, this.seed - this.direction * FLYING_SEED_OFFSET)) : this.seed;
  }
  /** Flying start: a subject lost before the entry gate, or lost for longer than
   * a prediction lasts, was not (or is no longer) the runner; look again.
   * Recorded: a person behind the track was taken at 0.05 s and lost; the
   * runner, arriving at 2.6 s, was never searched for. */
  private searchAgain() {
    this.x = this.flyingSeed(); this.y = null; this.pts = null; this.velocity = 0; this.history = [];
    this.provisional = []; this.watchTracks = []; this.resumption = null; this.running = false; this.behindStart = false;
    this.rivalSeen = false; this.nearer = [];
  }
  /** Crop centre: the track is extrapolated while it is briefly unobserved.
   * Flying start, before the decision: the most advanced provisional track
   * already moving at sprint speed is followed, so a fast runner stays in the
   * crop for the 0.25 s the decision needs; slower people never move it. */
  expected(pts: number) {
    if (this.pts === null && this.start === 'flying') {
      const lead = this.leadCentre(this.provisional, pts);
      if (lead !== null) return lead;
    }
    return this.x + this.velocity * Math.max(0, Math.min(MAX_PREDICTION_SECONDS, this.pts === null ? 0 : pts - this.pts));
  }
  /** Predicted position of the most advanced provisional track already moving at sprint speed. */
  private leadCentre(tracks: Acquisition[], pts: number): number | null {
    const sprinting = tracks.filter(track => {
      const recent = track.points.filter(h => track.pts - h.t <= this.decisionWindow() + TIME_EPSILON);
      return recent.length >= FLYING_MIN_OBSERVATIONS && recent.at(-1)!.t - recent[0].t >= this.minSpan() - TIME_EPSILON
        && fitLine(recent).slope * this.direction >= this.sprintSpeed;
    });
    const lead = sprinting.sort((a, b) => (b.x - a.x) * this.direction)[0];
    if (!lead || pts - lead.pts > this.shortGap() + TIME_EPSILON) return null;
    const recent = lead.points.filter(h => lead.pts - h.t <= this.decisionWindow() + TIME_EPSILON);
    return Math.max(0, Math.min(1, lead.x + fitLine(recent).slope * (pts - lead.pts)));
  }
  /** Flying start with a subject not yet past the exit: the crop centre for
   * watching the run-in side. It stays there: following a watch track moved it
   * with a second person jogging (2.5 m/s and more), and the runner coming in
   * at the frame edge was cut by the crop until past the entry (recorded). */
  watchCentre(_pts: number): number | null {
    if (this.start !== 'flying' || this.pts === null || (this.x - this.finishX) * this.direction >= 0) return null;
    return this.flyingSeed();
  }
  /** Flying start with nobody to follow yet and nobody moving on the run-in
   * side over the last 0.1 s: the caller may look at fewer frames until someone
   * moves. Judged on recent motion only: over a track's whole 0.4 s, a person
   * just starting to run still looked still (recorded: frames were thinned
   * while the runner set off, and the runner was never decided). */
  /** A subject is being followed (its samples are published). */
  get following() { return this.pts !== null; }
  /** While the subject was followed, a nearer runner at sprint speed was seen
   * and never replaced the subject: the result may be the wrong person. Judged
   * from the watch tracks and, as they can miss a runner hidden while passing a
   * person jogging (recorded, live at 9 frames/s), from any two sightings of
   * someone nearer moving forward faster than the subject. */
  get contested() { return this.rivalSeen; }
  get idle() {
    return this.start === 'flying' && this.pts === null && this.provisional.every(track => {
      const recent = track.points.filter(h => track.pts - h.t <= this.decisionWindow() + TIME_EPSILON);
      return recent.length >= 4 && recent.at(-1)!.t - recent[0].t >= .06 - TIME_EPSILON && Math.abs(fitLine(recent).slope) < RUNNING_SPEED / 2;
    });
  }
  /** Earlier observations of the subject, published once when a flying start is
   * confirmed (oldest first). The caller replaces its empty samples with them. */
  takeBackfill() { const earlier = this.backfill; this.backfill = []; return earlier; }
  /** When a nearer, faster runner replaced the subject: published samples from
   * this time on belonged to the replaced person and must be cleared (before
   * the backfill of the new subject is applied). */
  takeRetraction() { const from = this.retraction; this.retraction = null; return from; }
  /** view: horizontal extent of the crop the poses came from. watched: poses
   * from the flying start's watch crop (and its extent); they are only used to
   * find a new runner, never for the subject's own pelvis and legs, because the
   * full-height watch crop shows the runner smaller (recorded: steps changed). */
  choose(poses: Point[][], pts: number, view: readonly [number, number] = [0, 1],
    watched?: { poses: Point[][]; view: readonly [number, number] }): Point[] {
    if (!Number.isFinite(pts)) { this.acquisition = null; this.provisional = []; this.resumption = null; return []; }
    if (this.pts !== null && pts <= this.pts) return [];
    if (this.lastPts !== null && pts > this.lastPts) {
      this.lastInterval = pts - this.lastPts;
      if (!this.idle) keepLast(this.intervals, this.lastInterval);
    }
    this.lastPts = pts;
    if (watched && this.pts !== null) {
      if (this.lastWatchPts !== null && pts > this.lastWatchPts) keepLast(this.watchIntervals, pts - this.lastWatchPts);
      this.lastWatchPts = pts;
    }
    const candidates = (list: Point[][], extent: readonly [number, number]) => list.filter(p => [23, 24].every(k => p[k] && Number.isFinite(p[k].x) && Number.isFinite(p[k].y)
      && p[k].x > 0 && p[k].x < 1 && p[k].y > 0 && p[k].y < 1 && (p[k].visibility ?? 0) >= .3)
      && (this.start !== 'flying' || insideFrame(p, extent)))
      .map(p => ({ p, x: (p[23].x + p[24].x) / 2, y: (p[23].y + p[24].y) / 2 }));
    const valid = candidates(poses, view);
    const hadSubject = this.start === 'flying' && this.pts !== null;
    const pose = this.follow(valid, pts);
    if (!hadSubject || this.pts === null) return pose;
    const used = valid.find(c => c.p === pose);
    // Everyone except the subject: both crops, a second detection of someone counted once.
    const others: Candidate[] = [];
    for (const c of [...valid, ...(watched ? candidates(watched.poses, watched.view) : [])])
      if (c !== used && !(used && duplicate(c, used)) && !others.some(o => duplicate(o, c))) others.push(c);
    return this.watch(others, pts) ?? pose;
  }
  /** Flying start: follows a nearer, faster runner arriving on the run-in side
   * while the subject has not passed the exit (see REPLACE_*). Recorded: a
   * person jogging behind the track was taken 0.9 s before the runner came. */
  private watch(others: Candidate[], pts: number): Point[] | null {
    if ((this.x - this.finishX) * this.direction >= 0) { this.watchTracks = []; return null; }
    const { next, confirmed } = this.advance(this.watchTracks, others, pts, this.watchInterval());
    this.watchTracks = next;
    const subjectY = this.y;
    if (subjectY !== null && next.some(track => track.points.length >= FLYING_MIN_OBSERVATIONS && track.y - subjectY >= REPLACE_NEARER
      && fitLine(track.points).slope * this.direction >= this.sprintSpeed)) this.rivalSeen = true;
    if (subjectY !== null) {
      const pace = Math.max(this.sprintSpeed, REPLACE_FASTER * Math.abs(this.velocity)), fastest = TRACK_MAX_SPEED_MPS * this.sprintSpeed / FLYING_MIN_SPEED_MPS;
      const seen = others.filter(c => c.y - subjectY >= REPLACE_NEARER).map(c => ({ t: pts, x: c.x, y: c.y }));
      this.nearer = this.nearer.filter(h => pts - h.t <= RIVAL_PAIR_SECONDS);
      if (seen.some(b => this.nearer.some(a => b.t - a.t >= RIVAL_MIN_SECONDS - TIME_EPSILON && Math.abs(b.y - a.y) < SPARSE_TRACK_HEIGHT
        && (b.x - a.x) * this.direction >= pace * (b.t - a.t) && (b.x - a.x) * this.direction <= fastest * (b.t - a.t)))) this.rivalSeen = true;
      this.nearer.push(...seen);
    }
    if (!confirmed || this.y === null) return null;
    const speed = fitLine(confirmed.points).slope * this.direction;
    if (!(confirmed.y - this.y >= REPLACE_NEARER && speed >= REPLACE_FASTER * Math.abs(this.velocity))) return null;
    this.retraction = this.publishedFrom;
    return this.adopt(confirmed, pts);
  }
  private follow(valid: Candidate[], pts: number): Point[] {
    if (this.start === 'flying' && this.pts !== null) {
      const since = pts - this.pts, beforeEntry = (this.x - this.seed) * this.direction < 0;
      if (since - MAX_PREDICTION_SECONDS > TIME_EPSILON || (beforeEntry && since - this.shortGap() > TIME_EPSILON)) this.searchAgain();
    }
    if (this.pts === null) return this.start === 'flying' ? this.acquireFlying(valid, pts) : this.acquire(valid, pts);
    const replaced = this.challenge(valid, pts);
    if (replaced) return replaced;
    const since = pts - this.pts;
    if (since - MAX_PREDICTION_SECONDS > TIME_EPSILON) {
      // A standing or crouch start, before the run: a subject lost for longer than a prediction lasts is looked for
      // again at the start line. Otherwise it was never followed again: someone seen for a moment early in a long
      // video (the athlete walking in, kneeling) left the athlete in the set unfollowed, 「選手を十分に捉えられません
      // でした」 (the user's 13 s video, 2026-10-06; built again from a test video: 10 frames, then 2 s of empty
      // blocks, then the athlete in the set for 1.9 s - never followed). After the run, a lost runner stays lost.
      if (this.start === 'flying' || this.running) return [];
      this.searchAgain();
      return this.acquire(valid, pts);
    }
    if (since - this.shortGap() > TIME_EPSILON || this.resumption) return this.resume(valid, pts);
    const centre = this.reference(pts) ?? this.expected(pts);
    if (this.start === 'flying') {
      const near = nearestOnTrack(valid, centre, this.frameRadius(), this.y, this.trackHeight());
      return !near.length || ambiguousOnTrack(near, centre, this.y) ? [] : this.accept(near[0], pts);
    }
    const candidates = candidatesNear(valid, centre, this.frameRadius(), this.y);
    if (!candidates.length || ambiguous(candidates, centre)) return [];
    return this.accept(candidates[0], pts);
  }
  /** While running: the subject's own path from 0.1-0.4 s earlier, extrapolated. */
  private reference(pts: number): number | null {
    if (this.fromBlocks || Math.abs(this.velocity) < RUNNING_SPEED) return null;
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
  /** Standing start, before the run: three consecutive observations (50 ms
   * apart at most) of a person at least 0.03 nearer the start gate replace a
   * track that is not heading for the finish. */
  private challenge(valid: Candidate[], pts: number): Point[] | null {
    if (!this.direction || this.start === 'flying' || this.running || this.velocity * this.direction >= HEADING_SPEED) { this.challenger = null; return null; }
    const own = Math.abs(this.expected(pts) - this.seed);
    const best = candidatesNear(valid, this.seed, Math.min(SEED_RADIUS, own - .03), null)[0];
    const previous = this.challenger;
    if (!best) { this.challenger = null; return null; }
    const continues = previous && pts - previous.pts - this.gapLimit() <= TIME_EPSILON
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
    const candidates = candidatesNear(valid, expected, radius, this.y, this.start === 'flying' ? this.trackHeight() : TRACK_HEIGHT).filter(c => !moving
      || (c.x - this.x) * Math.sign(this.velocity) >= .4 * Math.abs(this.velocity) * Math.min(MAX_PREDICTION_SECONDS, gap));
    if (!candidates.length || ambiguous(candidates, expected)) { this.resumption = null; return []; }
    const best = candidates[0], previous = this.resumption;
    const continues = previous && pts - previous.pts - this.gapLimit() <= TIME_EPSILON
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
    if (previous && pts > previous.pts && pts - previous.pts - this.gapLimit() <= TIME_EPSILON) {
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
  /** Flying start: every person on the run-in side of the gate (up to
   * SEED_RADIUS past it) is followed provisionally. A track becomes the subject
   * when, over its last 0.1 s (at least three observations 50 ms apart at most,
   * spanning 60 ms), its fitted speed toward the finish is at least
   * RUNNING_SPEED and it advanced that far, AND over its whole followed span
   * (up to 0.4 s) it also moved toward the finish. Standing, walking or
   * backward-moving people never confirm; a track is dropped after a 50 ms miss. */
  private acquireFlying(valid: Candidate[], pts: number): Point[] {
    const { next, confirmed } = this.advance(this.provisional, valid, pts);
    this.provisional = next;
    return confirmed ? this.adopt(confirmed, pts) : [];
  }
  /** One frame of provisional tracking (acquisition or watch): extends the
   * tracks, starts new ones on the run-in side, and returns the one decided. */
  private advance(tracks: Acquisition[], valid: Candidate[], pts: number, interval = this.frameInterval()): { next: Acquisition[]; confirmed: Acquisition | null } {
    const live = tracks.filter(track => pts > track.pts && pts - track.pts - (track.points.length >= FLYING_MIN_OBSERVATIONS
      ? Math.max(.05, COAST_FRAMES * interval) : this.gapLimit(interval)) <= TIME_EPSILON);
    const next: Acquisition[] = [], taken = new Set<Candidate>(), reserved = new Set<Candidate>();
    for (const track of live) {
      const velocity = track.points.length > 1 ? fitLine(track.points).slope : 0;
      const expected = track.x + velocity * (pts - track.pts);
      // Seen once, the runner may be anywhere a sprint takes it: at 120 frames/s
      // within the usual radius, at a live camera's watch crop (0.13 s) beyond it.
      const reach = track.points.length < 2
        ? TRACK_MAX_SPEED_MPS * this.sprintSpeed / FLYING_MIN_SPEED_MPS * Math.max(0, pts - track.pts - .05) : 0;
      const candidates = nearestOnTrack(valid.filter(c => !taken.has(c)), expected, TRACK_RADIUS + reach, track.y, this.trackHeight());
      // A frame without a clear match keeps the track for up to 50 ms: a small or
      // distant runner is often missed for a frame or two, and dropping the track
      // then restarted the 0.25 s needed at sprint speed (recorded: never decided).
      if (!candidates.length || ambiguousOnTrack(candidates, expected, track.y)) {
        // Undecided between two people: neither starts a new track of its own,
        // which filled every place with one-sighting tracks (recorded).
        for (const c of candidates) reserved.add(c);
        next.push(track); continue;
      }
      const best = candidates[0]; taken.add(best);
      next.push({ x: best.x, y: best.y, pts, points: [...track.points.filter(h => pts - h.t <= .4), { t: pts, x: best.x, p: best.p }] });
    }
    const seeded: Candidate[] = [];
    for (const c of valid) {
      if (taken.has(c) || reserved.has(c) || (c.x - this.seed) * this.direction > SEED_RADIUS) continue;
      // A second detection of someone already followed or seeded starts no track.
      if ([...taken, ...seeded].some(d => duplicate(c, d))) continue;
      seeded.push(c);
      next.push({ x: c.x, y: c.y, pts, points: [{ t: pts, x: c.x, p: c.p }] });
    }
    // With many people in the picture, keep the longest-followed tracks (then the
    // most advanced): a runner coming from behind must not be displaced by
    // one-sighting tracks of people ahead.
    next.sort((a, b) => b.points.length - a.points.length || (b.x - a.x) * this.direction);
    const kept = next.slice(0, FLYING_MAX_TRACKS);
    const recent = (track: Acquisition) => track.points.filter(h => pts - h.t <= this.decisionWindow(interval) + TIME_EPSILON);
    const confirmed = kept.filter(track => {
      if (track.pts !== pts) return false;   // decided only on a frame it was seen in
      const points = recent(track), span = points.length ? points.at(-1)!.t - points[0].t : 0;
      if (points.length < FLYING_MIN_OBSERVATIONS || span - this.minSpan(interval) < -TIME_EPSILON) return false;
      const slope = fitLine(points).slope * this.direction;
      const advance = (points.at(-1)!.x - points[0].x) * this.direction;
      const whole = track.points, wholeSpan = whole.at(-1)!.t - whole[0].t;
      const wholeAdvance = (whole.at(-1)!.x - whole[0].x) * this.direction;
      if (!(slope >= RUNNING_SPEED && advance >= .7 * RUNNING_SPEED * span && wholeAdvance >= .5 * RUNNING_SPEED * wholeSpan)) return false;
      // The entry must be measurable from this track: first seen before the entry
      // gate, or past it by no more than 0.1 s of running (the analysis extends a
      // crossing at most that far). Recorded: a person first seen 0.12 image
      // widths past the entry, moving with the panning camera, was taken.
      const reach = .1 * Math.max(0, fitLine(whole).slope * this.direction);
      if ((whole[0].x - this.seed) * this.direction > reach + TIME_EPSILON) return false;
      // Sprint speed over at least 0.25 s, when the section length is known.
      return this.sprintSpeed <= RUNNING_SPEED
        || (wholeSpan - FLYING_SPEED_SPAN_SECONDS > -TIME_EPSILON && fitLine(whole).slope * this.direction >= this.sprintSpeed);
    });
    // Two runners confirming together: take the one nearer the gate, unless they are too close to tell apart.
    const best = confirmed[0] ?? null;
    if (best && confirmed.length > 1 && Math.abs(confirmed[1].x - best.x) < FRAME_RADIUS) return { next: kept, confirmed: null };
    return { next: kept, confirmed: best };
  }
  /** Makes a decided provisional track the subject, handing back its path. */
  private adopt(best: Acquisition, pts: number): Point[] {
    const path = traceBack(best.points);
    this.x = best.x; this.y = best.y; this.pts = pts; this.provisional = []; this.watchTracks = []; this.rivalSeen = false; this.nearer = [];
    // Sparse frames: the track's own speed until the subject's history gives one.
    // With a live camera the 0.2 s history held too few sightings, the speed
    // stayed 0, and the runner left the predicted position at once (recorded).
    const recent = best.points.filter(h => pts - h.t <= Math.max(VELOCITY_WINDOW_SECONDS, this.decisionWindow()) + TIME_EPSILON);
    this.velocity = this.sparse && recent.length >= 2 ? Math.max(-1, Math.min(1, fitLine(recent).slope)) : 0; this.resumption = null;
    this.behindStart = true; this.history = path.map(({ t, x }) => ({ t, x })); this.updateVelocity(pts);
    this.running = true;
    this.backfill = path.slice(0, -1).map(h => ({ pts: h.t, pose: h.p! }));
    this.publishedFrom = path[0].t;
    return best.points.at(-1)!.p!;
  }
}

/** The confirmed track's own path: its last 0.05 s (at least three
 * sightings), extended backward one sighting at a time while each earlier
 * sighting stays on that segment's straight line (see TRACE_*). The first
 * sighting off it ends the path: a provisional track can pass from a person
 * standing in front of the runner onto the runner. The line is fixed, so the
 * other person's sightings cannot bend it toward themselves. */
function traceBack(points: Sighting[]): Sighting[] {
  const end = points.at(-1)!.t;
  let first = points.findIndex(h => end - h.t <= TRACE_ANCHOR_SECONDS + TIME_EPSILON);
  first = Math.min(first, Math.max(0, points.length - 3));
  const line = fitLine(points.slice(first));
  while (first > 0) {
    const h = points[first - 1], back = Math.max(0, end - TRACE_ANCHOR_SECONDS - h.t);
    if (Math.abs(line.mx + line.slope * (h.t - line.mt) - h.x) > TRACE_JITTER + .5 * TRACE_ACCELERATION * back ** 2) break;
    first--;
  }
  return points.slice(first);
}
