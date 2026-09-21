import { G, quadratic } from '../cmj/analysis';
import { COM_MODEL, type COMSample } from '../cmj/center-of-mass';

export const RJ_VERSION = 'rebound-waveform-v1-experimental';
export type ModelId = 'BOSCO_LINEAR' | 'SINUSOIDAL_VELOCITY';
export type MetricId = 'mean' | 'max' | 'median' | 'pooled' | 'trimmed';
export const MODELS: { id: ModelId; name: string; assumption: string }[] = [
  { id: 'BOSCO_LINEAR', name: 'A：線形速度モデル', assumption: 'Boscoの簡略化モデルを逆算。接地中の速度変化を直線で近似。動画RSIとしては未検証。' },
  { id: 'SINUSOIDAL_VELOCITY', name: 'B：正弦波速度モデル', assumption: '接地中の速度を半周期の余弦波で近似する独自の比較モデル。未検証。' },
];
export const METRICS: { id: MetricId; name: string; formula: string }[] = [
  { id: 'mean', name: '平均RSI', formula: '各周期の推定RSIの算術平均' },
  { id: 'max', name: '最大RSI', formula: '各周期の推定RSIの最大値。1周期の誤差の影響を受けやすい指標' },
  { id: 'median', name: '中央値RSI', formula: '各周期の推定RSIの中央値' },
  { id: 'pooled', name: '合計比RSI', formula: '推定高さの合計 ÷ 推定接地時間の合計。各周期RSIの平均とは異なる' },
  { id: 'trimmed', name: '両端除外平均RSI', formula: '最大・最小を各1周期除いた推定RSIの平均（5周期以上）' },
];
export interface Estimate {
  heightM: number; contactSeconds: number; flightSeconds: number; rsi: number;
}
export interface ModelCycle extends Estimate { model: ModelId; waveformError: number; reason?: string }
export interface Cycle {
  id: number; fromJump: number; toJump: number; startPts: number; endPts: number;
  periodSeconds: number; amplitudeM: number | null; reason?: string; models: ModelCycle[];
}
export interface Summary {
  count: number; metrics: Record<MetricId, number>; meanHeightM: number; maxHeightM: number;
  meanContactSeconds: number; meanFlightSeconds: number; frequencyHz: number; rsiCVPercent: number;
  flightContactRatio: number;
}
export interface Peak { frame: number; pts: number; y: number; metersPerUnit: number | null; reason?: string }
export interface ReboundAnalysis {
  version: string; comModel: string; status: 'EXPERIMENTAL_ESTIMATE' | 'UNAVAILABLE'; reason?: string;
  protocol: 'TEN_JUMPS_IGNORE_EXTRA_FINAL'; excludedPeakFrames: number[];
  expectedJumps: number; expectedCycles: number; detectedJumps: number; peaks: Peak[]; cycles: Cycle[];
  summaries: Record<ModelId, Summary | null>; sampleCount: number; measuredFps: number | null;
  metersPerUnit: number | null; warnings: string[];
}
const mean = (v: number[]) => v.reduce((s, x) => s + x, 0) / v.length;
const median = (v: number[]) => { const a = [...v].sort((x, y) => x - y); return a.length % 2 ? a[(a.length - 1) / 2] : (a[a.length / 2 - 1] + a[a.length / 2]) / 2; };
const finiteSample = (s: COMSample) => s.comY !== null && s.comX !== null && s.bodyScale !== null && s.bodyScale > 0;

/** Both models assume symmetric, stationary repeated jumps. A is bottom-to-
 * apex COM excursion, NOT flight height. The second model is our explicit
 * sensitivity alternative, not a published/validated RSI estimator. */
export function estimateCycle(amplitudeM: number, periodSeconds: number, model: ModelId): Estimate | null {
  const A = amplitudeM, P = periodSeconds;
  if (!Number.isFinite(A) || !Number.isFinite(P) || A <= 0 || P <= 0 || A >= G * P * P / 8) return null;
  let F: number;
  if (model === 'BOSCO_LINEAR') F = 8 * A / (G * P);
  else {
    // A = g F²/8 + (g F/2) C/π, C = P-F. Monotonic on 0 < F < P.
    let lo = 0, hi = P;
    for (let i = 0; i < 60; i++) {
      const f = (lo + hi) / 2;
      if (G * f * f / 8 + G * f * (P - f) / (2 * Math.PI) < A) lo = f;
      else hi = f;
    }
    F = (lo + hi) / 2;
  }
  const C = P - F, heightM = G * F * F / 8;
  if (C < .06 || C > .6 || F < .12 || F > .9 || heightM > 1) return null;
  return { heightM, contactSeconds: C, flightSeconds: F, rsi: heightM / C };
}

/** Expected downward displacement from an apex during a symmetric cycle. */
export function modelDisplacement(t: number, e: Estimate, model: ModelId): number {
  const F = e.flightSeconds, C = e.contactSeconds, P = F + C;
  if (t <= F / 2) return G * t * t / 2;
  if (t >= F / 2 + C) return G * (P - t) ** 2 / 2;
  const u = t - F / 2, v = G * F / 2;
  return e.heightM + (model === 'BOSCO_LINEAR' ? v * u - v * u * u / C : v * C / Math.PI * Math.sin(Math.PI * u / C));
}

export function summarizeCycles(rows: readonly { estimate: Estimate; periodSeconds: number }[]): Summary | null {
  if (rows.length < 5 || rows.some(r => !Number.isFinite(r.periodSeconds) || r.periodSeconds <= 0 ||
    [r.estimate.heightM, r.estimate.contactSeconds, r.estimate.flightSeconds, r.estimate.rsi].some(v => !Number.isFinite(v) || v <= 0))) return null;
  const rsi = rows.map(r => r.estimate.rsi), avg = mean(rsi), sorted = [...rsi].sort((a, b) => a - b);
  const heights = rows.map(r => r.estimate.heightM), contacts = rows.map(r => r.estimate.contactSeconds);
  const flights = rows.map(r => r.estimate.flightSeconds);
  return { count: rows.length, metrics: { mean: avg, max: Math.max(...rsi), median: median(rsi),
    pooled: mean(heights) / mean(contacts), trimmed: mean(sorted.slice(1, -1)) },
    meanHeightM: mean(heights), maxHeightM: Math.max(...heights), meanContactSeconds: mean(contacts),
    meanFlightSeconds: mean(flights), frequencyHz: 1 / mean(rows.map(r => r.periodSeconds)),
    rsiCVPercent: Math.sqrt(mean(rsi.map(v => (v - avg) ** 2))) / avg * 100,
    flightContactRatio: mean(flights) / mean(contacts) };
}

export function analyzeRebounds(samples: readonly COMSample[]): ReboundAnalysis {
  const expectedJumps = 10, expectedCycles = 9;
  const result: ReboundAnalysis = { version: RJ_VERSION, comModel: COM_MODEL, status: 'UNAVAILABLE',
    protocol: 'TEN_JUMPS_IGNORE_EXTRA_FINAL', excludedPeakFrames: [], expectedJumps, expectedCycles,
    detectedJumps: 0, peaks: [], cycles: [], summaries: { BOSCO_LINEAR: null, SINUSOIDAL_VELOCITY: null },
    sampleCount: samples.length, measuredFps: null, metersPerUnit: null,
    warnings: ['この解析は足が地面を離れたことを直接確認しません。周期的な屈伸も条件を満たす可能性があるため、実際に跳躍した動画でのみ比較してください。'] };
  const fail = (reason: string): ReboundAnalysis => ({ ...result, reason });
  if (samples.length < 30) return fail('INSUFFICIENT_SAMPLES');
  if (samples.some((s, i) => !Number.isFinite(s.pts) || !Number.isInteger(s.frame) ||
    [s.comX, s.comY, s.bodyScale].some(v => v !== null && !Number.isFinite(v)) ||
    (i > 0 && (s.pts <= samples[i - 1].pts || s.frame <= samples[i - 1].frame)))) return fail('INVALID_TIMELINE');
  result.measuredFps = 1 / median(samples.slice(1).map((s, i) => s.pts - samples[i].pts));
  if (result.measuredFps < 90) return fail('FRAME_RATE_TOO_LOW');
  const valid = samples.filter(finiteSample);
  if (valid.length < 30) return fail('COM_TRACKING_LOST');
  const body = median(valid.map(s => s.bodyScale!)), threshold = body * .035;
  // Hysteresis rejects standing jitter and requires an actual rise before an
  // apex is counted. Never interpolate across missing observations.
  let phase: 'RISE' | 'APEX' = 'RISE', bottom = -Infinity, apexIndex = -1, lastObserved = -Infinity;
  const indices: number[] = [];
  const smoothed = samples.map((s, i) => {
    const rows = samples.slice(Math.max(0, i - 1), i + 2);
    return rows.every(finiteSample) ? median(rows.map(r => r.comY!)) : s.comY;
  });
  for (let i = 0; i < samples.length; i++) {
    const y = smoothed[i];
    if (samples[i].pts - lastObserved > .025 + 1e-6) { phase = 'RISE'; bottom = -Infinity; apexIndex = -1; }
    // Keep count state through an isolated missing observation, without
    // inventing a coordinate. Cycle measurement below still rejects ANY gap.
    if (!finiteSample(samples[i]) || y === null) continue;
    lastObserved = samples[i].pts;
    if (phase === 'RISE') {
      bottom = Math.max(bottom, y);
      if (bottom - y >= threshold) { phase = 'APEX'; apexIndex = i; }
    } else {
      if (y < smoothed[apexIndex]!) apexIndex = i;
      if (y - smoothed[apexIndex]! >= threshold) { indices.push(apexIndex); phase = 'RISE'; bottom = y; }
    }
  }
  result.detectedJumps = indices.length;
  for (const index of indices) {
    const s = samples[index];
    const peak: Peak = { frame: s.frame, pts: s.pts, y: s.comY!, metersPerUnit: null };
    const fits: { scale: number; pts: number; y: number }[] = [];
    for (const window of [.04, .055, .07]) {
      const rows = samples.filter(r => Math.abs(r.pts - s.pts) <= window + 1e-7);
      if (rows.length < 7 || rows.some(r => !finiteSample(r)) ||
        rows.some((r, i) => i > 0 && r.pts - rows[i - 1].pts > 1 / 60 + 1e-6) ||
        rows.filter(r => r.pts < s.pts).length < 3 || rows.filter(r => r.pts > s.pts).length < 3) continue;
      const fit = quadratic(rows.map(r => ({ t: r.pts - s.pts, y: r.comY! })));
      if (!fit || fit.a <= 0 || fit.rmse > body * .003 ||
        fit.a * window ** 2 < Math.max(body * .0003, 3 * fit.rmse) || Math.abs(fit.b / (2 * fit.a)) > .02) continue;
      fits.push({ scale: G / (2 * fit.a), pts: s.pts - fit.b / (2 * fit.a), y: fit.c - fit.b * fit.b / (4 * fit.a) });
    }
    if (fits.length !== 3 || Math.max(...fits.map(f => f.scale)) / Math.min(...fits.map(f => f.scale)) > 1.35)
      peak.reason = 'GRAVITY_ARC_UNRESOLVED';
    else {
      peak.metersPerUnit = median(fits.map(f => f.scale)); peak.pts = median(fits.map(f => f.pts)); peak.y = median(fits.map(f => f.y));
      if (peak.metersPerUnit * body < .5 || peak.metersPerUnit * body > 2.5) { peak.reason = 'SCALE_OUT_OF_RANGE'; peak.metersPerUnit = null; }
    }
    result.peaks.push(peak);
  }
  const analyzedPeaks = result.detectedJumps === 11 ? result.peaks.slice(0, 10) : result.peaks;
  if (result.detectedJumps === 11) {
    result.excludedPeakFrames = [result.peaks[10].frame];
    result.warnings.push('11回検出したため、仕様に従って最後の1回を除外しました。最初の10頂点間・9周期のみを集計します。除外した頂点も記録に残します。');
  }
  const scales = analyzedPeaks.flatMap(p => p.metersPerUnit === null ? [] : [p.metersPerUnit]);
  if (scales.length) result.metersPerUnit = median(scales);
  if (scales.length > 1 && Math.max(...scales) / Math.min(...scales) > 1.4) return fail('GRAVITY_SCALES_DISAGREE');
  for (let i = 0; i < analyzedPeaks.length - 1; i++) {
    const a = analyzedPeaks[i], b = analyzedPeaks[i + 1], P = b.pts - a.pts;
    const cycle: Cycle = { id: i + 1, fromJump: i + 1, toJump: i + 2, startPts: a.pts, endPts: b.pts,
      periodSeconds: P, amplitudeM: null, models: [] };
    result.cycles.push(cycle);
    if (P < .25 || P > 1.2) { cycle.reason = 'CYCLE_PERIOD_OUT_OF_RANGE'; continue; }
    if (a.reason || b.reason || result.metersPerUnit === null) { cycle.reason = a.reason ?? b.reason ?? 'GRAVITY_ARC_UNRESOLVED'; continue; }
    const rows = samples.filter(s => s.pts >= a.pts - .005 && s.pts <= b.pts + .005);
    if (rows.some(s => !finiteSample(s))) { cycle.reason = 'COM_TRACKING_LOST'; continue; }
    if (rows.some((s, j) => j > 0 && s.pts - rows[j - 1].pts > 1 / 60 + 1e-6)) { cycle.reason = 'SOURCE_FRAME_GAP'; continue; }
    if (Math.max(...rows.map(s => s.comX!)) - Math.min(...rows.map(s => s.comX!)) > body * .15) { cycle.reason = 'SUBJECT_DRIFT'; continue; }
    const low = rows.reduce((x, s) => s.comY! > x.comY! ? s : x);
    const span = low.comY! - (a.y + b.y) / 2;
    if (span < threshold || Math.abs(a.y - b.y) > span * .2) { cycle.reason = 'UNEQUAL_APEX_HEIGHTS'; continue; }
    if ((low.pts - a.pts) / P < .35 || (low.pts - a.pts) / P > .65) { cycle.reason = 'ASYMMETRIC_CYCLE'; continue; }
    cycle.amplitudeM = span * result.metersPerUnit;
    for (const model of MODELS) {
      const e = estimateCycle(cycle.amplitudeM, P, model.id);
      if (!e) continue;
      const residual = rows.map(s => {
        const t = Math.max(0, Math.min(P, s.pts - a.pts));
        const baseline = a.y + (b.y - a.y) * t / P;
        return ((s.comY! - baseline) * result.metersPerUnit! - modelDisplacement(t, e, model.id)) / cycle.amplitudeM!;
      });
      const waveformError = Math.sqrt(mean(residual.map(x => x * x)));
      cycle.models.push({ ...e, model: model.id, waveformError, ...(waveformError > .12 ? { reason: 'WAVEFORM_MODEL_MISMATCH' } : {}) });
    }
    if (!cycle.models.length) cycle.reason = 'MODEL_OUT_OF_RANGE';
  }
  if (result.detectedJumps !== 10 && result.detectedJumps !== 11) return fail('JUMP_COUNT_MISMATCH');
  // Ten apices contain NINE complete apex-to-apex cycles. Never invent a
  // tenth cycle, use initiation as rebound contact, or silently drop failures.
  for (const model of MODELS) {
    const rows = result.cycles.flatMap(c => {
      const e = c.models.find(m => m.model === model.id);
      return c.reason || !e || e.reason ? [] : [{ estimate: e, periodSeconds: c.periodSeconds }];
    });
    if (rows.length === expectedCycles) result.summaries[model.id] = summarizeCycles(rows);
  }
  if (!Object.values(result.summaries).some(Boolean)) return fail('INCOMPLETE_VALID_CYCLES');
  result.warnings.push(`${analyzedPeaks.length}跳躍の頂点間にある${expectedCycles}周期の集計です。実測の接地時間・各跳躍の実測RSIではありません。`);
  const a = result.summaries.BOSCO_LINEAR, b = result.summaries.SINUSOIDAL_VELOCITY;
  if (a && b && Math.abs(a.metrics.mean - b.metrics.mean) / Math.min(a.metrics.mean, b.metrics.mean) > .1)
    result.warnings.push('モデル間で平均RSIが10%以上異なります。波形への当てはまりだけでは正しい接地時間を選べないため、別試技の基準計測で比較してください。');
  if (Object.values(result.summaries).some(s => s && s.rsiCVPercent > 20)) result.warnings.push('周期ごとの推定RSIのばらつきが大きいため、最大値の解釈には注意してください。');
  return { ...result, status: 'EXPERIMENTAL_ESTIMATE' };
}

export function reboundReason(reason?: string): string {
  const labels: Record<string, string> = {
    INSUFFICIENT_SAMPLES: '解析できる映像が不足しています。', INVALID_TIMELINE: '映像の時刻・座標が不正です。',
    FRAME_RATE_TOO_LOW: '120fps以上の元動画が必要です。240fpsを推奨します。', COM_TRACKING_LOST: '全身の追跡が途切れています。',
    GRAVITY_ARC_UNRESOLVED: '頂点付近の軌道から長さの尺度を確定できません。', SCALE_OUT_OF_RANGE: '重心の尺度が想定範囲外です。',
    GRAVITY_SCALES_DISAGREE: 'ジャンプ間で推定した長さの尺度が一致しません。', CYCLE_PERIOD_OUT_OF_RANGE: '周期が想定範囲外です。',
    SOURCE_FRAME_GAP: '元フレームに大きな時間の欠落があります。', SUBJECT_DRIFT: '撮影位置または身体が横方向に動いています。',
    UNEQUAL_APEX_HEIGHTS: '隣り合う頂点の高さがモデル条件に合いません。', ASYMMETRIC_CYCLE: '沈み込みと上昇の時間が非対称です。',
    WAVEFORM_MODEL_MISMATCH: '重心波形がこのモデルに合いません。', MODEL_OUT_OF_RANGE: '推定した時間がモデルの範囲外です。',
    JUMP_COUNT_MISMATCH: '検出した頂点が10回または11回ではありません。重心軌道と撮影範囲を確認してください。',
    INCOMPLETE_VALID_CYCLES: 'すべての周期の条件がそろわないため、平均・最大を確定しません。',
  };
  return labels[reason ?? ''] ?? reason ?? '判定できませんでした。';
}
