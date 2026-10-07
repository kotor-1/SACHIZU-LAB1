export const SPRINT10_ANALYSIS_VERSION = 'sprint10-experimental-v10';
/** Standing explanations appended to every result's warnings, after any run-specific ones. */
export const SPRINT10_NOTES: readonly string[] = ['歩数は、2本のラインの間に経過した脚の入れ替わり（遊脚が支持脚を追い越す動き）の周期の数です。ライン上の半端な1歩は周期の割合で数えます。接地回数を1つずつ数えた値ではありません。',
  '各歩の距離は骨盤の画面内移動をライン間隔（既知の距離）で比例換算した推定です。真の全身重心・接地位置間の距離ではなく、遠近やカメラの揺れも補正していません。'];
export interface Point { x: number; y: number; visibility?: number }
export interface SprintSample { frame: number; pts: number; hipX: number | null; ankleGap: number | null; kneeGap: number | null; legLength: number | null }
/** One leg-overlap (the swing leg passing the support leg), once per step. */
export interface Step { frame: number; pts: number }
export interface StrideInterval {
  fromStep: number; toStep: number; fromPts: number; toPts: number;
  fromHipX: number | null; toHipX: number | null; distanceM: number | null; reason: string | null;
}
/** extendedSeconds: the crossing itself was not observed and was estimated by
 * extending the pelvis motion this long (flying section only). */
export interface Crossing { pts: number; before: number; after: number; frame: number; extendedSeconds?: number }
export interface SprintResult {
  start: Crossing | null; finish: Crossing | null; duration: number | null;
  /** Step cycles elapsed between the two gate crossings, including the
   * partial cycles at each gate (e.g. 7.3), NOT a count of foot contacts. */
  steps: Step[]; count: number | null; speed: number | null; cadence: number | null; stride: number | null;
  /** Fraction of the cycle straddling the start and finish gates. */
  edgeFractions: [number, number] | null; strideIntervals: StrideInterval[];
  warnings: string[]; reason: string | null;
}
const median = (values: number[]) => { const a = [...values].sort((x, y) => x - y); return a.length ? a[Math.floor(a.length / 2)] : 0; };
/** The usual single cycle: the median (mean of the middle two for an even
 * count) of the cycles not longer than 1.5 times the overall median. A missed
 * overlap (a cycle about twice as long) must not raise the reference it is
 * judged against: with four cycles of 0.275, 0.284, 0.350 and 0.508 s, the
 * upper-middle 0.350 made the missed overlap look like one long cycle. */
function typicalCycleOf(cycles: number[]) {
  const middle = (values: number[]) => {
    const a = [...values].sort((x, y) => x - y), k = Math.floor(a.length / 2);
    return !a.length ? 0 : a.length % 2 ? a[k] : (a[k - 1] + a[k]) / 2;
  };
  const overall = middle(cycles);
  return middle(cycles.filter(c => c <= SINGLE_CYCLE_RATIO[1] * overall + TIME_EPSILON));
}
const valid = (p: Point | undefined) => !!p && Number.isFinite(p.x) && Number.isFinite(p.y)
  && p.x > 0 && p.x < 1 && p.y > 0 && p.y < 1 && (p.visibility ?? 0) >= .3;
// One nanosecond absorbs subtraction rounding, not an extra missing frame.
const TIME_EPSILON = 1e-9;
const exceedsTime = (seconds: number, limit: number) => seconds - limit > TIME_EPSILON;
/** Longest gap between observations still treated as continuous: 50 ms, or
 * 2.5 frame intervals (one missed frame) when the subject was observed less
 * often than every 20 ms. A live camera is processed at 15-30 frames/s with
 * uneven spacing: with 50 ms, a 57 ms interval before the exit stopped its
 * crossing from being measured (recorded). Unchanged from 50 frames/s up. */
export function continuityLimit(samples: SprintSample[]) {
  const intervals: number[] = [];
  for (let i = 1; i < samples.length; i++)
    if (samples[i].hipX !== null && samples[i - 1].hipX !== null) intervals.push(samples[i].pts - samples[i - 1].pts);
  return Math.max(.05, 2.5 * (intervals.length ? median(intervals) : 0));
}
type Continuity = (a: SprintSample, b: SprintSample) => boolean;
/** Whether observations a (earlier) and b of `samples` are continuous: within `gap`. */
function continuityOf(samples: SprintSample[], gap = continuityLimit(samples)): Continuity {
  return (a, b) => !exceedsTime(b.pts - a.pts, gap);
}
const belowTime = (seconds: number, limit: number) => limit - seconds > TIME_EPSILON;
const MAX_CYCLE_SECONDS = .65;
// Pose estimation occasionally puts both ankles on one leg for 1-2 frames in
// side view. A +-25 ms median removes those without erasing a real overlap,
// whose closed phase lasts about 80 ms in the recorded sprints.
const ANKLE_SMOOTHING_SECONDS = .025;
/** Cycle length relative to the usual cycle that still counts as one cycle
 * (the lower bound is the usual-cycle filter's; longer ones contain missed overlaps). */
const SINGLE_CYCLE_RATIO = [.7, 1.5] as const;

/** No left/right identity is used for geometry. Image aspect ratio preserves distances. */
export function sprintSample(points: Point[], frame: number, pts: number, aspect: number): SprintSample {
  const hips = [23, 24].every(i => valid(points[i]));
  const legs = [23, 24, 25, 26, 27, 28].every(i => valid(points[i]));
  const length = (a: number, b: number) => Math.hypot((points[a].x - points[b].x) * aspect, points[a].y - points[b].y);
  return { frame, pts, hipX: hips ? (points[23].x + points[24].x) / 2 : null,
    ankleGap: [27, 28].every(i => valid(points[i])) ? Math.abs(points[27].x - points[28].x) * aspect : null,
    kneeGap: [25, 26].every(i => valid(points[i])) ? Math.abs(points[25].x - points[26].x) * aspect : null,
    legLength: legs ? (length(23, 25) + length(25, 27) + length(24, 26) + length(26, 28)) / 2 : null };
}

function crossings(samples: SprintSample[], gate: number, direction: number, continuous = continuityOf(samples)): Crossing[] {
  const found: Crossing[] = [];
  const good = samples.filter(s => s.hipX !== null);
  for (let i = 1; i < good.length; i++) {
    const a = good[i - 1], b = good[i];
    const x = (a.hipX! - gate) * direction, y = (b.hipX! - gate) * direction;
    if (x > 0 || y <= 0 || !continuous(a, b)) continue;
    // Require movement on both sides, not repeated jitter on the line.
    const before = good.some(s => s.pts <= a.pts && !exceedsTime(a.pts - s.pts, .15) && (s.hipX! - gate) * direction < -.003);
    const after = good.some(s => s.pts >= b.pts && !exceedsTime(s.pts - b.pts, .15) && (s.hipX! - gate) * direction > .003);
    if (!before || !after) continue;
    const pts = a.pts + (-x / (y - x)) * (b.pts - a.pts);
    if (!found.length || exceedsTime(pts - found.at(-1)!.pts, .15)) found.push({ pts, before: a.pts, after: b.pts, frame: b.frame });
  }
  return found;
}

/** Experimental label-invariant open/close/open cycles; NOT contact events.
 * Thresholds are engineering settings, not an externally validated gait model. */
export function stepCandidates(samples: SprintSample[], interval?: { startPts: number; finishPts: number },
  gap = continuityLimit(samples)): { events: Step[]; gaps: [number, number][] } {
  const calibration = interval ? samples.filter(s => !belowTime(s.pts, interval.startPts) && !exceedsTime(s.pts, interval.finishPts)) : samples;
  const scale = median(calibration.flatMap(s => s.legLength !== null && s.legLength > .01 ? [s.legLength] : []));
  if (!scale) return { events: [], gaps: [] };
  // Keep one maximum cycle on each side to observe opening around boundary
  // overlaps. Unrelated footage outside the gates must not set the thresholds.
  const context = interval ? samples.filter(s => !belowTime(s.pts, interval.startPts - MAX_CYCLE_SECONDS)
    && !exceedsTime(s.pts, interval.finishPts + MAX_CYCLE_SECONDS)) : samples;
  const good = context.filter(s => s.ankleGap !== null && s.kneeGap !== null);
  const smoothGaps = (values: SprintSample[]) => values.map(s => ({ ...s,
    value: median(values.filter(q => !exceedsTime(Math.abs(q.pts - s.pts), ANKLE_SMOOTHING_SECONDS)).map(q => q.ankleGap! / scale)) }));
  const smooth = smoothGaps(good);
  const calibrated = interval ? smoothGaps(calibration.filter(s => s.ankleGap !== null && s.kneeGap !== null)) : smooth;
  const sorted = calibrated.map(s => s.value).sort((a, b) => a - b);
  const amplitude = sorted[Math.floor(sorted.length * .9)] ?? 0;
  if (amplitude < .2) return { events: [], gaps: [] };
  const open = amplitude * .55, close = amplitude * .3;
  const events: Step[] = [], gaps: [number, number][] = [];
  let armed = false, low: typeof smooth[number] | null = null, previous: typeof smooth[number] | null = null;
  // The median flattens the bottom of the overlap; use the centre of equal minima, not the first.
  let ties: typeof smooth = [];
  for (const s of smooth) {
    const prior = previous;
    if (previous && exceedsTime(s.pts - previous.pts, gap)) { gaps.push([previous.pts, s.pts]); armed = false; low = null; ties = []; }
    previous = s;
    // A standing start holds the feet only partly apart, so the first crossing
    // is armed from halfway between the closed and open levels.
    if (!armed) { if (s.value >= (open + close) / 2) armed = true; continue; }
    if (s.value <= close && (!low || s.value < low.value)) { low = s; ties = [s]; }
    else if (low && s.value === low.value && ties.at(-1) === prior) ties.push(s);
    if (low && s.value >= open) {
      const nearbyKnees = good.filter(q => !exceedsTime(Math.abs(q.pts - low!.pts), .06));
      // Knee overlap must support the ankle event; no inferred frames in dropouts.
      const kneeSupport = nearbyKnees.some(q => q.kneeGap! / scale < .4);
      const centre = ties[(ties.length - 1) >> 1] ?? low;
      if (kneeSupport && (!events.length || !belowTime(centre.pts - events.at(-1)!.pts, .12))) events.push({ pts: centre.pts, frame: centre.frame });
      low = null; ties = [];
    }
  }
  return { events, gaps };
}

/** Per-cycle pelvis displacement, NOT 10m divided equally among the steps.
 * Both endpoints use the SAME leg-overlap phase. */
export function strideIntervals(samples: SprintSample[], steps: Step[], startX: number, finishX: number,
  startPts: number, finishPts: number, distanceM = 10, gap = continuityLimit(samples)): StrideInterval[] {
  const output: StrideInterval[] = [];
  for (let i = 1; i < steps.length; i++) {
    const a = steps[i - 1], b = steps[i];
    const first = samples.find(s => s.frame === a.frame && s.pts === a.pts);
    const last = samples.find(s => s.frame === b.frame && s.pts === b.pts);
    const segment = samples.filter(s => s.pts >= a.pts && s.pts <= b.pts);
    const validTimes = segment.filter(s => s.hipX !== null && Number.isFinite(s.hipX) && s.ankleGap !== null && s.kneeGap !== null).map(s => s.pts);
    const dt = b.pts - a.pts;
    let reason: string | null = null;
    if (belowTime(a.pts, startPts) || exceedsTime(b.pts, finishPts)) reason = '区間外を含むため未算出';
    else if (belowTime(dt, .12) || exceedsTime(dt, MAX_CYCLE_SECONDS)) reason = '入れ替わり周期を確認できません';
    else if (first?.hipX == null || last?.hipX == null || !Number.isFinite(first.hipX) || !Number.isFinite(last.hipX)) reason = '端点の骨盤位置がありません';
    else if (!validTimes.length || exceedsTime(validTimes[0] - a.pts, gap) || exceedsTime(b.pts - validTimes.at(-1)!, gap)
      || validTimes.some((t, j) => j > 0 && exceedsTime(t - validTimes[j - 1], gap))) reason = 'この区間の追跡が途切れています';
    const distance = first?.hipX != null && last?.hipX != null ? distanceM * (last.hipX - first.hipX) / (finishX - startX) : NaN;
    if (!reason && (!Number.isFinite(distance) || distance <= 0 || distance > 10)) reason = '進行方向の移動距離を確認できません';
    output.push({ fromStep: i, toStep: i + 1, fromPts: a.pts, toPts: b.pts,
      fromHipX: first?.hipX ?? null, toHipX: last?.hipX ?? null, distanceM: reason ? null : distance, reason });
  }
  return output;
}

/** Time between pelvis gate crossings; steps are the leg-overlap cycles
 * elapsed between those crossings. No manual contact frame or foot label. */
/** Reasons the gates were not crossed, worded for each kind of run: in a
 * flying section the runner is not in the picture at first, and the gates are
 * the section's entry and exit. */
const GATE_REASONS = {
  standing: {
    noFinish: 'ゴール通過を確認できません。ゴールラインの位置と、ゴールを越えた後まで選手が映っているかを確認してください。',
    startGap: 'スタートラインを越える瞬間の追跡が途切れています。スタート付近が隠れない位置から撮影してください。',
    noStart: 'スタートラインより後ろにいる選手を確認できません。ラインを選手の立ち位置より少し後ろに置くか、走り出す前から映った動画を使ってください。',
  },
  flying: {
    noFinish: '出口の線の通過を確認できません。選手が出口の線を越えるまで動画が続いているか、出口の付近で選手が他の人と重なっていないか確認してください。',
    startGap: '入口の線を越える瞬間の追跡が途切れています。入口の付近で選手が他の人や物に隠れていないか確認してください。',
    noStart: '入口の線を越える選手を捉えられませんでした。入口の付近で選手が他の人と重なっている場合や、線を越えた後0.1秒以上、体が画面の外にかかっている場合は測れません。',
  },
} as const;
/** Flying section: a gate at the very edge of the picture is crossed while the
 * body is cut by the frame edge, when no pose is usable. The crossing is then
 * estimated by extending the straight-line pelvis motion of the nearest 0.25 s
 * observed (one step cycle, which averages out the speed change within a
 * stride), by at most 0.1 s, and only inside the video. On a constant-speed
 * sprint (240 fps, gates across the picture) extensions of 0.05 s were 2-3 ms
 * off at the median (max 10 ms) and of 0.1 s 3-5 ms (max 21 ms). */
const EXTEND_FIT_SECONDS = .25;
const EXTEND_MAX_SECONDS = .1;
/** The pelvis must be moving toward the finish at least this fast (image widths/s). */
const EXTEND_MIN_SPEED = .2;
/** Flying section, observed crossing: the gate time of the straight line through
 * the pelvis within ±0.08 s of it, not the two frames around it. One frame's
 * pose can jump 0.03-0.04 image widths (recorded: back behind the entry 50 ms
 * after crossing it, forward past the exit 25 ms early, wavering at the frame
 * edge); interpolating between two frames turned that into 20-47 ms. Against
 * an independent estimate of the same 37 runs (full frame vs crop) the
 * section times agreed within 4.7 ms instead of 6.9 ms (entry 20%), and
 * 20.5 ms instead of 47.2 ms (exit at the frame edge). A runner at speed hardly
 * changes pace within 0.16 s, so the line is not biased by acceleration. */
const CROSSING_FIT_SECONDS = .08;
/** Observations further than this from the fitted line (or 3 robust standard
 * deviations of the residuals, if larger) are one-frame pose errors. */
const CROSSING_OUTLIER = .006;
type Line = { mt: number; mx: number; speed: number; used: SprintSample[] };
/** Least-squares pelvis line, refitted once without observations off it. */
function robustLine(observed: SprintSample[]): Line | null {
  let used = observed;
  for (let round = 0; round < 3; round++) {
    if (used.length < 3) return null;
    const mt = used.reduce((a, s) => a + s.pts, 0) / used.length, mx = used.reduce((a, s) => a + s.hipX!, 0) / used.length;
    const den = used.reduce((a, s) => a + (s.pts - mt) ** 2, 0);
    if (!(den > 0)) return null;
    const speed = used.reduce((a, s) => a + (s.pts - mt) * (s.hipX! - mx), 0) / den;
    const residual = used.map(s => Math.abs(s.hipX! - (mx + speed * (s.pts - mt))));
    const spread = 1.4826 * median(residual), keep = used.filter((_, i) => residual[i] <= Math.max(CROSSING_OUTLIER, 3 * spread));
    if (keep.length === used.length || keep.length < 3 || round === 2) return { mt, mx, speed, used };
    used = keep;
  }
  return null;
}
/** Refines an observed crossing with the straight line through the pelvis
 * within ±0.08 s of it, re-centred until it settles. */
function fittedCrossing(tracked: SprintSample[], gate: number, direction: number, crossing: Crossing): Crossing {
  let pts = crossing.pts;
  for (let round = 0; round < 3; round++) {
    const line = robustLine(tracked.filter(s => !exceedsTime(Math.abs(s.pts - pts), CROSSING_FIT_SECONDS)));
    if (!line || !(line.speed * direction >= EXTEND_MIN_SPEED) || line.used.length < 5) return crossing;
    const next = line.mt + (gate - line.mx) / line.speed;
    // Stay inside the observations the line was fitted to.
    if (next < line.used[0].pts || next > line.used.at(-1)!.pts) return crossing;
    const settled = Math.abs(next - pts) < .001; pts = next;
    if (settled) break;
  }
  return { ...crossing, pts };
}
function extendedCrossing(segment: SprintSample[], gate: number, direction: number, side: 'entry' | 'exit', video: [number, number],
  continuous: Continuity): Crossing | null {
  // The contiguous observations (no gap over the continuity limit) nearest the gate, up to 0.25 s.
  const ordered = side === 'entry' ? segment : [...segment].reverse(), near = [ordered[0]];
  for (const s of ordered.slice(1)) {
    const [a, b] = side === 'entry' ? [near.at(-1)!, s] : [s, near.at(-1)!];
    if (!continuous(a, b) || exceedsTime(Math.abs(s.pts - near[0].pts), EXTEND_FIT_SECONDS)) break;
    near.push(s);
  }
  if (near.length < 3 || belowTime(Math.abs(near.at(-1)!.pts - near[0].pts), .05)) return null;
  const line = robustLine(near);
  if (!line || !(line.speed * direction >= EXTEND_MIN_SPEED)) return null;
  // Extend from the nearest observation that lies on the line.
  const nearest = side === 'entry' ? line.used.reduce((a, s) => s.pts < a.pts ? s : a) : line.used.reduce((a, s) => s.pts > a.pts ? s : a);
  const pts = line.mt + (gate - line.mx) / line.speed, extended = Math.abs(nearest.pts - pts);
  // Entry: the gate lies behind the first observation; exit: ahead of the last one.
  const beyond = (nearest.hipX! - gate) * direction * (side === 'entry' ? 1 : -1);
  if (!(beyond > 0) || exceedsTime(extended, EXTEND_MAX_SECONDS) || pts < video[0] || pts > video[1]) return null;
  return side === 'entry'
    ? { pts, before: pts, after: nearest.pts, frame: nearest.frame, extendedSeconds: extended }
    : { pts, before: nearest.pts, after: pts, frame: nearest.frame, extendedSeconds: extended };
}
/** A detected overlap closer than this fraction of the usual cycle to the
 * previous one is a false detection (a cycle cannot be that short). */
const SPURIOUS_CYCLE_RATIO = .6;
/** Step cycles elapsed between the gate crossings, always given when the usual
 * cycle is known, with every estimated part reported (the caller words it).
 *  - The usual cycle comes from the overlaps between the gates, or from those
 *    within 1 s outside them when fewer than two cycles lie between.
 *  - Between observed overlaps, each interval counts as the nearest whole
 *    number of cycles: up to 1.5 is one (recorded: 1.47 when easing off),
 *    otherwise missed overlaps are counted in (1.73 is two, 2.9 is three).
 *  - At each gate, the part of the cycle that straddles it is measured with its
 *    own neighbouring overlap when that was observed; otherwise it is the time
 *    to the nearest observed overlap divided by the usual cycle, which also
 *    counts overlaps missed near the gate (the body cut by the frame edge).
 *  - Overlaps closer than 0.6 cycles to the previous one are false detections. */
function countSteps(detected: { events: Step[]; gaps: [number, number][] }, inside: Step[], startPts: number, finishPts: number) {
  const nearby = detected.events.filter(s => !belowTime(s.pts, startPts - 1) && !exceedsTime(s.pts, finishPts + 1));
  const spans = (list: Step[]) => list.slice(1).map((s, i) => s.pts - list[i].pts);
  const cycle = typicalCycleOf(inside.length >= 3 ? spans(inside) : spans(nearby));
  if (!(cycle > 0)) return null;
  // Drop false detections: the overlap that makes a cycle under 0.6 of the usual one.
  const steps = [...inside];
  let removed = 0;
  for (;;) {
    const cycles = steps.slice(1).map((s, i) => s.pts - steps[i].pts);
    const shortest = cycles.reduce((best, c, i) => c < cycles[best] ? i : best, 0);
    if (!cycles.length || cycles[shortest] >= SPURIOUS_CYCLE_RATIO * cycle) break;
    // Remove the end of the short cycle that leaves its neighbour closer to one cycle.
    const before = shortest > 0 ? cycles[shortest - 1] : Infinity, after = shortest + 1 < cycles.length ? cycles[shortest + 1] : Infinity;
    steps.splice(Math.abs(before + cycles[shortest] - cycle) < Math.abs(after + cycles[shortest] - cycle) ? shortest : shortest + 1, 1);
    removed++;
  }
  const ratios = steps.slice(1).map((s, i) => (s.pts - steps[i].pts) / cycle);
  const multiples = ratios.map(r => r <= SINGLE_CYCLE_RATIO[1] + 1e-9 ? 1 : Math.max(2, Math.round(r)));
  // Hard to call: a long interval far from a whole number of cycles (1.57 between one and two).
  const ambiguous = ratios.some((r, i) => multiples[i] >= 2 && Math.abs(r - multiples[i]) > .35);
  if (!steps.length) return { count: (finishPts - startPts) / cycle, steps, multiples, edges: null, estimatedEdges: [false, false] as [boolean, boolean], ambiguous, removed, cycle };
  const before = detected.events.filter(s => s.pts <= startPts).at(-1), after = detected.events.find(s => s.pts >= finishPts);
  const cycleAt = (neighbour: Step | undefined, edge: Step) => {
    const own = neighbour ? Math.abs(edge.pts - neighbour.pts) : NaN;
    const observed = neighbour && !exceedsTime(own, MAX_CYCLE_SECONDS) && own / cycle <= SINGLE_CYCLE_RATIO[1]
      && !detected.gaps.some(([a, b]) => a < Math.max(edge.pts, neighbour.pts) && b > Math.min(edge.pts, neighbour.pts));
    return observed ? own : cycle;
  };
  const head = (steps[0].pts - startPts) / cycleAt(before, steps[0]);
  const tail = (finishPts - steps.at(-1)!.pts) / cycleAt(after, steps.at(-1)!);
  return { count: multiples.reduce((sum, k) => sum + k, 0) + head + tail, steps, multiples, edges: [head, tail] as [number, number],
    estimatedEdges: [head > 1 + 1e-9, tail > 1 + 1e-9] as [boolean, boolean], ambiguous, removed, cycle };
}
/** Flying section: a pelvis observation more than 0.02 image widths off the
 * straight line through the observations within 0.1 s on either side (at least
 * four, itself excluded) is another person's pose for a frame, not the runner,
 * who cannot move that far against their own path. Recorded: one frame 0.06
 * ahead of the runner, right at the entry line, moved the entry by 98 ms. Such
 * observations are left out of the gate crossings only. */
const SPIKE_WIDTHS = .02;
function withoutSpikes(samples: SprintSample[]): SprintSample[] {
  const tracked = samples.filter(s => s.hipX !== null);
  const spikes = new Set<SprintSample>();
  for (const s of tracked) {
    const near = tracked.filter(q => q !== s && !exceedsTime(Math.abs(q.pts - s.pts), .1));
    if (near.length < 4) continue;
    const mt = near.reduce((a, q) => a + q.pts, 0) / near.length, mx = near.reduce((a, q) => a + q.hipX!, 0) / near.length;
    const den = near.reduce((a, q) => a + (q.pts - mt) ** 2, 0);
    const slope = den > 0 ? near.reduce((a, q) => a + (q.pts - mt) * (q.hipX! - mx), 0) / den : 0;
    if (Math.abs(s.hipX! - (mx + slope * (s.pts - mt))) > SPIKE_WIDTHS) spikes.add(s);
  }
  return spikes.size ? samples.map(s => spikes.has(s) ? { ...s, hipX: null } : s) : samples;
}
/** distanceM: the real distance between the two gates (10 m for the standing 10 m; any known section otherwise). */
export function analyzeSprint(samples: SprintSample[], startX: number, finishX: number, distanceM = 10,
  run: 'standing' | 'flying' = 'standing'): SprintResult {
  const reasons = GATE_REASONS[run];
  const base: SprintResult = { start: null, finish: null, duration: null, steps: [], count: null, speed: null, cadence: null, stride: null,
    edgeFractions: null, strideIntervals: [], warnings: [], reason: null };
  if (![startX, finishX].every(x => Number.isFinite(x) && x > 0 && x < 1) || Math.abs(finishX - startX) < .1)
    return { ...base, reason: 'スタートとゴールを離して設定してください。' };
  if (!samples.length || samples.some((s, i) => !Number.isFinite(s.pts) || (i > 0 && s.pts <= samples[i - 1].pts)))
    return { ...base, reason: '動画の時刻を確認できません。' };
  const direction = Math.sign(finishX - startX);
  // Gate crossings of a flying section ignore one-frame pose errors (the legs are still counted from every sample).
  const gateSamples = run === 'flying' ? withoutSpikes(samples) : samples;
  const tracked = gateSamples.filter(s => s.hipX !== null);
  const video: [number, number] = [samples[0].pts, samples.at(-1)!.pts];
  const gap = continuityLimit(gateSamples), continuous = continuityOf(gateSamples, gap);
  const finishes = crossings(gateSamples, finishX, direction, continuous);
  if (!finishes.length && run === 'flying') {
    // The exit was not seen being crossed: extend the last observations before it.
    let lastBehind = tracked.length - 1;
    while (lastBehind >= 0 && (tracked[lastBehind].hipX! - finishX) * direction > 0) lastBehind--;
    const exit = lastBehind < 0 ? null : extendedCrossing(tracked.slice(0, lastBehind + 1), finishX, direction, 'exit', video, continuous);
    if (exit) finishes.push(exit);
  }
  if (!finishes.length) return { ...base, reason: reasons.noFinish };
  // The run starts where the pelvis was LAST at or behind the start line
  // before it went on to the finish. Standing sway on the line, walking back
  // to the start and false starts are therefore not separate crossings.
  let start: Crossing | null = null, finish: Crossing | null = null, startGap = false;
  for (const candidate of finishes) {
    const before = tracked.filter(s => s.pts < candidate.pts);
    let i = before.length - 1;
    while (i >= 0 && (before[i].hipX! - startX) * direction > 0) i--;
    if (i === before.length - 1) continue;
    const a = before[i], b = before[i + 1];
    if (i < 0 || !continuous(a, b)) {
      // Flying section: the entry crossing itself was not seen (the body was cut
      // by the frame edge, or hidden): extend the first observations after it.
      const entry = run === 'flying' ? extendedCrossing(before.slice(i + 1), startX, direction, 'entry', video, continuous) : null;
      if (entry) { start = entry; finish = candidate; break; }
      if (i >= 0) startGap = true;
      continue;
    }
    const x = (a.hipX! - startX) * direction, y = (b.hipX! - startX) * direction;
    start = { pts: a.pts + (-x / (y - x)) * (b.pts - a.pts), before: a.pts, after: b.pts, frame: b.frame };
    finish = candidate; break;
  }
  if (run === 'flying' && start && finish) {
    if (!start.extendedSeconds) start = fittedCrossing(tracked, startX, direction, start);
    if (!finish.extendedSeconds) finish = fittedCrossing(tracked, finishX, direction, finish);
  }
  if (!start || !finish) return { ...base, reason: startGap ? reasons.startGap : reasons.noStart };
  const duration = finish.pts - start.pts;
  const laterRuns = finishes.filter(f => f.pts > finish!.pts + 1);
  const detected = stepCandidates(samples, { startPts: start.pts, finishPts: finish.pts }, gap);
  const observedFrom = start.extendedSeconds ? start.after : start.pts, observedTo = finish.extendedSeconds ? finish.before : finish.pts;
  const interior = samples.filter(s => s.pts >= observedFrom && s.pts <= observedTo);
  const coverage = interior.filter(s => s.ankleGap !== null && s.kneeGap !== null).length / Math.max(1, interior.length);
  const coveredTimes = [observedFrom, ...interior.filter(s => s.ankleGap !== null && s.kneeGap !== null).map(s => s.pts), observedTo];
  const legsMissing = coverage < .9 || detected.gaps.some(([a, b]) => a < observedTo && b > observedFrom)
    || coveredTimes.some((t, i) => i > 0 && exceedsTime(t - coveredTimes[i - 1], gap));
  const steps = detected.events.filter(s => s.pts > start.pts && s.pts < finish.pts);
  const step = countSteps(detected, steps, start.pts, finish.pts);
  const count = step?.count ?? null;
  const warnings = [...SPRINT10_NOTES];
  if (!step) warnings.unshift('脚の入れ替わりを2回以上捉えられなかったため、歩数・ピッチ・歩幅を出せません。');
  else {
    // Every part of the count that was not observed directly is named.
    const notes: string[] = [];
    if (step.removed) notes.push(`入れ替わりの誤検出と思われるもの（${step.removed}回）を除いて数えました。`);
    if (!step.steps.length) notes.push(`区間内の入れ替わりを捉えられなかったため、歩数は周期（${step.cycle.toFixed(3)}秒）から推定しました。`);
    const missed = step.multiples.reduce((sum, k) => sum + k - 1, 0);
    if (missed === 1) notes.push('脚の入れ替わりを1回見逃した区間があり、周期の長さから2歩分として数えました。');
    else if (missed > 1) notes.push(`脚の入れ替わりを${missed}回見逃した区間があり、周期の長さから数えました。`);
    if (step.estimatedEdges[0]) notes.push(`入口の直後の入れ替わりが映っていないため、その部分は周期（${step.cycle.toFixed(3)}秒）から推定しました。`);
    if (step.estimatedEdges[1]) notes.push(`出口の直前の入れ替わりが映っていないため、その部分は周期（${step.cycle.toFixed(3)}秒）から推定しました。`);
    if (step.ambiguous) notes.push('1歩分とも2歩分とも決めにくい周期があり、歩数が1歩ずれている可能性があります。');
    if (legsMissing && !missed && !step.estimatedEdges.some(Boolean)) notes.push('脚が映っていない時間がありますが、その前後の入れ替わりの間隔は通常の周期でした。');
    warnings.unshift(...notes);
  }
  if (laterRuns.length) warnings.unshift('ゴールを2回以上越えています。最初の走りを解析しました。');
  // Say so whenever a gate time is an estimate rather than an observed crossing.
  const extendedNote = (gate: string, crossing: Crossing, side: string) => `${gate}の線を越える瞬間の骨盤は映っていない（体が画面の端にかかる・隠れる）ため、${side}の動きを${Math.round(crossing.extendedSeconds! * 1000)}ミリ秒延ばして通過時刻を推定しました。`;
  if (finish.extendedSeconds) warnings.unshift(extendedNote('出口', finish, '直前'));
  if (start.extendedSeconds) warnings.unshift(extendedNote('入口', start, '直後'));
  const counted = step?.steps ?? steps, multiples = step?.multiples ?? [];
  return { ...base, start, finish, duration, speed: distanceM / duration, steps: counted, count, edgeFractions: step?.edges ?? null,
    strideIntervals: strideIntervals(samples, counted, startX, finishX, start.pts, finish.pts, distanceM, gap).map((interval, i) => (multiples[i] ?? 1) > 1
      ? { ...interval, distanceM: null, reason: `入れ替わりの見逃しで${multiples[i]}歩分の区間です` } : interval),
    cadence: count === null ? null : count / duration, stride: count === null ? null : distanceM / count, warnings };
}
