export const SPRINT10_ANALYSIS_VERSION = 'sprint10-experimental-v7';
export interface Point { x: number; y: number; visibility?: number }
export interface SprintSample { frame: number; pts: number; hipX: number | null; ankleGap: number | null; kneeGap: number | null; legLength: number | null }
/** One leg-overlap (the swing leg passing the support leg), once per step. */
export interface Step { frame: number; pts: number }
export interface StrideInterval {
  fromStep: number; toStep: number; fromPts: number; toPts: number;
  fromHipX: number | null; toHipX: number | null; distanceM: number | null; reason: string | null;
}
export interface Crossing { pts: number; before: number; after: number; frame: number }
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
const valid = (p: Point | undefined) => !!p && Number.isFinite(p.x) && Number.isFinite(p.y)
  && p.x > 0 && p.x < 1 && p.y > 0 && p.y < 1 && (p.visibility ?? 0) >= .3;
// One nanosecond absorbs subtraction rounding, not an extra missing frame.
const TIME_EPSILON = 1e-9;
const exceedsTime = (seconds: number, limit: number) => seconds - limit > TIME_EPSILON;
const belowTime = (seconds: number, limit: number) => limit - seconds > TIME_EPSILON;
const MAX_CYCLE_SECONDS = .65;
// Pose estimation occasionally puts both ankles on one leg for 1-2 frames in
// side view. A +-25 ms median removes those without erasing a real overlap,
// whose closed phase lasts about 80 ms in the recorded sprints.
const ANKLE_SMOOTHING_SECONDS = .025;
/** Cycle length relative to the median cycle: one cycle, or one missed overlap. */
const SINGLE_CYCLE_RATIO = [.7, 1.5] as const;
const DOUBLE_CYCLE_RATIO = [1.6, 2.4] as const;

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

function crossings(samples: SprintSample[], gate: number, direction: number): Crossing[] {
  const found: Crossing[] = [];
  const good = samples.filter(s => s.hipX !== null);
  for (let i = 1; i < good.length; i++) {
    const a = good[i - 1], b = good[i];
    const x = (a.hipX! - gate) * direction, y = (b.hipX! - gate) * direction;
    if (x > 0 || y <= 0 || exceedsTime(b.pts - a.pts, .05)) continue;
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
export function stepCandidates(samples: SprintSample[], interval?: { startPts: number; finishPts: number }): { events: Step[]; gaps: [number, number][] } {
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
    if (previous && exceedsTime(s.pts - previous.pts, .05)) { gaps.push([previous.pts, s.pts]); armed = false; low = null; ties = []; }
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
  startPts: number, finishPts: number): StrideInterval[] {
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
    else if (!validTimes.length || exceedsTime(validTimes[0] - a.pts, .05) || exceedsTime(b.pts - validTimes.at(-1)!, .05)
      || validTimes.some((t, j) => j > 0 && exceedsTime(t - validTimes[j - 1], .05))) reason = 'この区間の追跡が途切れています';
    const distance = first?.hipX != null && last?.hipX != null ? 10 * (last.hipX - first.hipX) / (finishX - startX) : NaN;
    if (!reason && (!Number.isFinite(distance) || distance <= 0 || distance > 10)) reason = '進行方向の移動距離を確認できません';
    output.push({ fromStep: i, toStep: i + 1, fromPts: a.pts, toPts: b.pts,
      fromHipX: first?.hipX ?? null, toHipX: last?.hipX ?? null, distanceM: reason ? null : distance, reason });
  }
  return output;
}

/** Time between pelvis gate crossings; steps are the leg-overlap cycles
 * elapsed between those crossings. No manual contact frame or foot label. */
export function analyzeSprint(samples: SprintSample[], startX: number, finishX: number): SprintResult {
  const base: SprintResult = { start: null, finish: null, duration: null, steps: [], count: null, speed: null, cadence: null, stride: null,
    edgeFractions: null, strideIntervals: [], warnings: [], reason: null };
  if (![startX, finishX].every(x => Number.isFinite(x) && x > 0 && x < 1) || Math.abs(finishX - startX) < .1)
    return { ...base, reason: 'スタートとゴールを離して設定してください。' };
  if (!samples.length || samples.some((s, i) => !Number.isFinite(s.pts) || (i > 0 && s.pts <= samples[i - 1].pts)))
    return { ...base, reason: '動画の時刻を確認できません。' };
  const direction = Math.sign(finishX - startX);
  const finishes = crossings(samples, finishX, direction);
  if (!finishes.length) return { ...base, reason: 'ゴール通過を確認できません。ゴールラインの位置と、ゴールを越えた後まで選手が映っているかを確認してください。' };
  // The run starts where the pelvis was LAST at or behind the start line
  // before it went on to the finish. Standing sway on the line, walking back
  // to the start and false starts are therefore not separate crossings.
  const tracked = samples.filter(s => s.hipX !== null);
  let start: Crossing | null = null, finish: Crossing | null = null, startGap = false;
  for (const candidate of finishes) {
    const before = tracked.filter(s => s.pts < candidate.pts);
    let i = before.length - 1;
    while (i >= 0 && (before[i].hipX! - startX) * direction > 0) i--;
    if (i < 0 || i === before.length - 1) continue;
    const a = before[i], b = before[i + 1];
    if (exceedsTime(b.pts - a.pts, .05)) { startGap = true; continue; }
    const x = (a.hipX! - startX) * direction, y = (b.hipX! - startX) * direction;
    start = { pts: a.pts + (-x / (y - x)) * (b.pts - a.pts), before: a.pts, after: b.pts, frame: b.frame };
    finish = candidate; break;
  }
  if (!start || !finish) return { ...base, reason: startGap
    ? 'スタートラインを越える瞬間の追跡が途切れています。スタート付近が隠れない位置から撮影してください。'
    : 'スタートラインより後ろにいる選手を確認できません。ラインを選手の立ち位置より少し後ろに置くか、走り出す前から映った動画を使ってください。' };
  const duration = finish.pts - start.pts;
  const laterRuns = finishes.filter(f => f.pts > finish!.pts + 1);
  const detected = stepCandidates(samples, { startPts: start.pts, finishPts: finish.pts });
  const steps = detected.events.filter(s => s.pts > start.pts && s.pts < finish.pts);
  const interior = samples.filter(s => s.pts >= start.pts && s.pts <= finish.pts);
  const coverage = interior.filter(s => s.ankleGap !== null && s.kneeGap !== null).length / Math.max(1, interior.length);
  const coveredTimes = [start.pts, ...interior.filter(s => s.ankleGap !== null && s.kneeGap !== null).map(s => s.pts), finish.pts];
  const gaps = detected.gaps.some(([a, b]) => a < finish.pts && b > start.pts)
    || coveredTimes.some((t, i) => i > 0 && exceedsTime(t - coveredTimes[i - 1], .05));
  const cycles = steps.slice(1).map((s, i) => s.pts - steps[i].pts);
  // A cycle about twice the typical one is one missed overlap (pose
  // estimation lost the crossing legs); it counts as two elapsed cycles.
  // Single cycles up to 1.5x occur when the runner eases off near the finish
  // (recorded: 1.47x with one continuous leg opening); missed overlaps were
  // 1.7-2x. Ratios in between, or other irregular cycles, withhold the count.
  const typicalCycle = median(cycles);
  const multiples = cycles.map(c => {
    const ratio = c / typicalCycle;
    return ratio >= SINGLE_CYCLE_RATIO[0] && ratio <= SINGLE_CYCLE_RATIO[1] ? 1
      : ratio >= DOUBLE_CYCLE_RATIO[0] && ratio <= DOUBLE_CYCLE_RATIO[1] ? 2 : null;
  });
  const irregular = cycles.some(c => exceedsTime(c / Math.max(1, Math.round(c / typicalCycle)), MAX_CYCLE_SECONDS))
    || multiples.some(k => k === null) || multiples.filter(k => k === 2).length > 1;
  // Partial cycle at each gate: the elapsed part of the cycle that straddles
  // it, measured with its own neighbouring overlap when that was observed.
  let edgeFractions: [number, number] | null = null;
  if (steps.length >= 2 && !irregular) {
    const typical = median(cycles);
    const before = detected.events.filter(s => s.pts <= start.pts).at(-1), after = detected.events.find(s => s.pts >= finish.pts);
    const cycleAt = (neighbour: Step | undefined, inside: Step) => {
      const own = neighbour ? Math.abs(inside.pts - neighbour.pts) : NaN;
      const observed = neighbour && !exceedsTime(own, MAX_CYCLE_SECONDS) && own / typical <= SINGLE_CYCLE_RATIO[1]
        && !detected.gaps.some(([a, b]) => a < Math.max(inside.pts, neighbour.pts) && b > Math.min(inside.pts, neighbour.pts));
      return observed ? own : typical;
    };
    const head = (steps[0].pts - start.pts) / cycleAt(before, steps[0]);
    const tail = (finish.pts - steps.at(-1)!.pts) / cycleAt(after, steps.at(-1)!);
    // An edge longer than a whole cycle means an overlap near the gate was missed.
    if (head <= 1 + 1e-9 && tail <= 1 + 1e-9) edgeFractions = [head, tail];
  }
  const reliable = steps.length >= 2 && coverage >= .9 && !gaps && !irregular && edgeFractions !== null;
  const count = reliable ? multiples.reduce((sum: number, k) => sum + k!, 0) + edgeFractions![0] + edgeFractions![1] : null;
  const warnings = ['歩数は、2本のラインの間に経過した脚の入れ替わり（遊脚が支持脚を追い越す動き）の周期の数です。ライン上の半端な1歩は周期の割合で数えます。接地回数を1つずつ数えた値ではありません。',
    '各歩の距離は骨盤の画面内移動を10mのライン間隔で比例換算した推定です。真の全身重心・接地位置間の距離ではなく、遠近やカメラの揺れも補正していません。'];
  if (!reliable) warnings.unshift('脚の追跡欠落・周期の不確かさがあるため、歩数・ピッチ・歩幅を確定していません。候補位置を確認してください。');
  else if (multiples.includes(2)) warnings.unshift('脚の入れ替わりを1回見逃した区間があり、周期の長さから2歩分として数えました。');
  if (laterRuns.length) warnings.unshift('ゴールを2回以上越えています。最初の走りを解析しました。');
  return { ...base, start, finish, duration, speed: 10 / duration, steps, count, edgeFractions: reliable ? edgeFractions : null,
    strideIntervals: strideIntervals(samples, steps, startX, finishX, start.pts, finish.pts).map((interval, i) => multiples[i] === 2
      ? { ...interval, distanceM: null, reason: '入れ替わりの見逃しで2歩分の区間です' } : interval),
    cadence: count === null ? null : count / duration, stride: count === null ? null : 10 / count, warnings };
}
