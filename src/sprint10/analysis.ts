export type FirstFoot = 'left' | 'right';
export interface Point { x: number; y: number; visibility?: number }
export interface SprintSample { frame: number; pts: number; hipX: number | null; ankleGap: number | null; kneeGap: number | null; legLength: number | null }
export interface Step {
  frame: number; pts: number; foot: FirstFoot; registeredContactPts?: number;
  /** The overlap within this SAME step, not an additional landing. */
  overlap?: { frame: number; pts: number };
}
export interface StrideInterval {
  fromStep: number; toStep: number; fromPts: number; toPts: number;
  fromHipX: number | null; toHipX: number | null; distanceM: number | null; reason: string | null;
}
export interface Crossing { pts: number; before: number; after: number; frame: number }
export interface SprintResult {
  start: Crossing | null; finish: Crossing | null; duration: number | null;
  steps: Step[]; count: number | null; speed: number | null; cadence: number | null; stride: number | null;
  firstContactPts: number | null; strideIntervals: StrideInterval[];
  warnings: string[]; reason: string | null;
}
const median = (values: number[]) => { const a = [...values].sort((x, y) => x - y); return a.length ? a[Math.floor(a.length / 2)] : 0; };
const valid = (p: Point | undefined) => !!p && Number.isFinite(p.x) && Number.isFinite(p.y)
  && p.x > 0 && p.x < 1 && p.y > 0 && p.y < 1 && (p.visibility ?? 0) >= .3;

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
    if (x > 0 || y <= 0 || b.pts - a.pts > .05) continue;
    // Require movement on both sides, not repeated jitter on the line.
    const before = good.some(s => s.pts <= a.pts && a.pts - s.pts <= .15 && (s.hipX! - gate) * direction < -.003);
    const after = good.some(s => s.pts >= b.pts && s.pts - b.pts <= .15 && (s.hipX! - gate) * direction > .003);
    if (!before || !after) continue;
    const pts = a.pts + (-x / (y - x)) * (b.pts - a.pts);
    if (!found.length || pts - found.at(-1)!.pts > .15) found.push({ pts, before: a.pts, after: b.pts, frame: b.frame });
  }
  return found;
}

/** Experimental label-invariant open/close/open cycles; NOT contact events.
 * Thresholds are engineering settings, not an externally validated gait model. */
export function stepCandidates(samples: SprintSample[]): { events: Omit<Step, 'foot'>[]; gaps: [number, number][] } {
  const scale = median(samples.flatMap(s => s.legLength !== null && s.legLength > .01 ? [s.legLength] : []));
  if (!scale) return { events: [], gaps: [] };
  const good = samples.filter(s => s.ankleGap !== null && s.kneeGap !== null);
  const smooth = good.map(s => ({ ...s, value: median(good.filter(q => Math.abs(q.pts - s.pts) <= .015).map(q => q.ankleGap! / scale)) }));
  const sorted = smooth.map(s => s.value).sort((a, b) => a - b);
  const amplitude = sorted[Math.floor(sorted.length * .9)] ?? 0;
  if (amplitude < .2) return { events: [], gaps: [] };
  const open = amplitude * .55, close = amplitude * .3;
  const events: Omit<Step, 'foot'>[] = [], gaps: [number, number][] = [];
  let armed = false, low: typeof smooth[number] | null = null, previous: typeof smooth[number] | null = null;
  for (const s of smooth) {
    if (previous && s.pts - previous.pts > .05) { gaps.push([previous.pts, s.pts]); armed = false; low = null; }
    previous = s;
    if (!armed) { if (s.value >= open) armed = true; continue; }
    if (s.value <= close && (!low || s.value < low.value)) low = s;
    if (low && s.value >= open) {
      const nearbyKnees = good.filter(q => Math.abs(q.pts - low!.pts) <= .06);
      // Knee overlap must support the ankle event; no inferred frames in dropouts.
      const kneeSupport = nearbyKnees.some(q => q.kneeGap! / scale < .4);
      if (kneeSupport && (!events.length || low.pts - events.at(-1)!.pts >= .12)) events.push({ pts: low.pts, frame: low.frame });
      low = null;
    }
  }
  return { events, gaps };
}

/** Per-cycle pelvis displacement, NOT 10m divided equally among the steps.
 * Both endpoints use the SAME leg-overlap phase. A manual landing must never
 * be mixed with an overlap endpoint to manufacture a first full stride. */
export function strideIntervals(samples: SprintSample[], steps: Step[], startX: number, finishX: number,
  startPts: number, finishPts: number): StrideInterval[] {
  const output: StrideInterval[] = [];
  for (let i = 1; i < steps.length; i++) {
    const a = steps[i - 1].overlap ?? steps[i - 1], b = steps[i].overlap ?? steps[i];
    if ((steps[i - 1].registeredContactPts !== undefined && !steps[i - 1].overlap)
      || (steps[i].registeredContactPts !== undefined && !steps[i].overlap)) continue;
    const first = samples.find(s => s.frame === a.frame && s.pts === a.pts);
    const last = samples.find(s => s.frame === b.frame && s.pts === b.pts);
    const segment = samples.filter(s => s.pts >= a.pts && s.pts <= b.pts);
    const validTimes = segment.filter(s => s.hipX !== null && Number.isFinite(s.hipX) && s.ankleGap !== null && s.kneeGap !== null).map(s => s.pts);
    const dt = b.pts - a.pts;
    let reason: string | null = null;
    if (a.pts < startPts || b.pts > finishPts) reason = '区間外を含むため未算出';
    else if (dt < .12 || dt > .65) reason = '入れ替わり周期を確認できません';
    else if (first?.hipX == null || last?.hipX == null || !Number.isFinite(first.hipX) || !Number.isFinite(last.hipX)) reason = '端点の骨盤位置がありません';
    else if (!validTimes.length || validTimes[0] - a.pts > .05 || b.pts - validTimes.at(-1)! > .05
      || validTimes.some((t, j) => j > 0 && t - validTimes[j - 1] > .05)) reason = 'この区間の追跡が途切れています';
    const distance = first?.hipX != null && last?.hipX != null ? 10 * (last.hipX - first.hipX) / (finishX - startX) : NaN;
    if (!reason && (!Number.isFinite(distance) || distance <= 0 || distance > 10)) reason = '進行方向の移動距離を確認できません';
    output.push({ fromStep: i, toStep: i + 1, fromPts: a.pts, toPts: b.pts,
      fromHipX: first?.hipX ?? null, toHipX: last?.hipX ?? null, distanceM: reason ? null : distance, reason });
  }
  return output;
}

export function analyzeSprint(samples: SprintSample[], startX: number, finishX: number, firstFoot: FirstFoot, firstContactPts?: number): SprintResult {
  const base: SprintResult = { start: null, finish: null, duration: null, steps: [], count: null, speed: null, cadence: null, stride: null,
    firstContactPts: firstContactPts ?? null, strideIntervals: [], warnings: [], reason: null };
  if (![startX, finishX].every(x => Number.isFinite(x) && x > 0 && x < 1) || Math.abs(finishX - startX) < .1)
    return { ...base, reason: 'スタートとゴールを離して設定してください。' };
  if (!samples.length || samples.some((s, i) => !Number.isFinite(s.pts) || (i > 0 && s.pts <= samples[i - 1].pts)))
    return { ...base, reason: '動画の時刻を確認できません。' };
  const direction = Math.sign(finishX - startX);
  const starts = crossings(samples, startX, direction), finishes = crossings(samples, finishX, direction);
  if (starts.length !== 1) return { ...base, reason: starts.length ? 'スタート通過が複数あります。1走分の動画にしてください。' : 'スタート通過を確認できません。骨盤がラインを越える前から映った動画・ライン位置を確認してください。' };
  const start = starts[0], validFinishes = finishes.filter(f => f.pts > start.pts);
  if (validFinishes.length !== 1) return { ...base, start, reason: 'ゴール通過を一意に確認できません。ライン位置と追跡状態を確認してください。' };
  const finish = validFinishes[0], duration = finish.pts - start.pts;
  const detected = stepCandidates(samples);
  let selected = detected.events.filter(s => s.pts >= start.pts && s.pts < finish.pts);
  let manual: SprintSample | undefined;
  let firstOverlap: { frame: number; pts: number } | undefined;
  if (firstContactPts !== undefined) {
    if (!Number.isFinite(firstContactPts) || firstContactPts < start.pts || firstContactPts >= finish.pts)
      return { ...base, start, finish, duration, speed: 10 / duration, reason: '1歩目の接地をスタート通過後・ゴール通過前で登録してください。' };
    manual = samples.find(s => Math.abs(s.pts - firstContactPts) < 1e-7);
    if (!manual) return { ...base, start, finish, duration, speed: 10 / duration, reason: '登録した接地コマと解析フレームが一致しません。登録し直してください。' };
    // Landing precedes the ankle overlap during that same stance. The first
    // following overlap belongs to step 1: previously prepending the contact
    // counted this same step twice. Preserve both observations and their roles.
    const following = detected.events.filter(s => s.pts >= firstContactPts - 1e-7);
    firstOverlap = following[0];
    if (!firstOverlap || firstOverlap.pts >= finish.pts || firstOverlap.pts - firstContactPts > .35
      || detected.gaps.some(([a, b]) => a < firstOverlap!.pts && b > firstContactPts))
      return { ...base, start, finish, duration, speed: 10 / duration,
        reason: '登録した1歩目と、その後の脚の交差を対応づけられません。接地コマと脚の追跡を確認してください。' };
    selected = following.slice(1).filter(s => s.pts < finish.pts);
  }
  const steps: Step[] = selected.map((s, i) => ({ ...s, foot: ((i + (manual ? 1 : 0)) % 2 ? (firstFoot === 'left' ? 'right' : 'left') : firstFoot) as FirstFoot }));
  if (manual) steps.unshift({ frame: manual.frame, pts: manual.pts, foot: firstFoot, registeredContactPts: firstContactPts, overlap: firstOverlap });
  const interior = samples.filter(s => s.pts >= start.pts && s.pts <= finish.pts);
  const coverage = interior.filter(s => s.ankleGap !== null && s.kneeGap !== null).length / Math.max(1, interior.length);
  const coveredTimes = [start.pts, ...interior.filter(s => s.ankleGap !== null && s.kneeGap !== null).map(s => s.pts), finish.pts];
  const gaps = detected.gaps.some(([a, b]) => a < finish.pts && b > start.pts)
    || coveredTimes.some((t, i) => i > 0 && t - coveredTimes[i - 1] > .05);
  const irregular = steps.some((s, i) => i > 0 && s.pts - steps[i - 1].pts > .65);
  const reliable = steps.length >= 2 && coverage >= .9 && !gaps && !irregular;
  const count = reliable ? steps.length : null;
  const warnings = ['歩数は脚の交差周期による推定です。接地回数の実測ではなく、区間端の半端な1歩は補正していません。',
    '左右表示は選択した最初の足から交互に付けたラベルです。各歩の左右を検証した結果ではありません。',
    '各歩の距離は骨盤の画面内移動を10mのライン間隔で比例換算した推定です。真の全身重心・接地位置間の距離ではなく、遠近やカメラの揺れも補正していません。'];
  if (firstContactPts !== undefined) warnings.push('1歩目は登録した接地です。その直後の脚の交差は同じ1歩の動きとして対応づけ、二重に数えません。距離は対応づけた交差同士で計算します。2歩目以降の接地そのものは未検証で、ゴール付近の歩数は動画で確認してください。');
  if (!reliable) warnings.unshift('脚の追跡欠落・周期の不確かさがあるため、歩数・ピッチ・ストライドを確定していません。候補位置を確認してください。');
  return { ...base, start, finish, duration, speed: 10 / duration, steps, count,
    strideIntervals: strideIntervals(samples, steps, startX, finishX, start.pts, finish.pts),
    cadence: count === null ? null : count / duration, stride: count === null ? null : 10 / count, warnings };
}
