import { G, quadratic } from '../cmj/analysis';
import type { COMSample } from '../cmj/center-of-mass';
import { MODELS, modelDisplacement, type Estimate, type ModelId } from './analysis';
import { SIGNALS, type SignalId } from './lower-body';

export const WAVEFORM_VERSION = 'lower-waveform-v1-unvalidated';
export type CandidateMetric = 'mean' | 'max' | 'median' | 'pooled' | 'trimmed' | 'last3';
export const CANDIDATE_METRICS: { id: CandidateMetric; name: string }[] = [
  { id: 'mean', name: '全9周期平均' }, { id: 'max', name: '最大RSI' }, { id: 'median', name: '中央値' },
  { id: 'pooled', name: '合計比' }, { id: 'trimmed', name: '両端除外平均' }, { id: 'last3', name: '末尾3周期平均' },
];
export interface Apex { frame: number; pts: number; y: number }
export interface WaveCycle {
  id: number; fromJump: number; toJump: number; startPts: number; endPts: number;
  coverage: number; maxGap: number; reason?: string; estimate: Estimate | null;
  waveformError: number | null; legLengthM: number | null; sensitivity: [number, number] | null;
}
export interface SignalResult { signal: SignalId; detected: number; peaks: Apex[]; excluded: number[]; reason?: string; validFrames: number; totalFrames: number }
export interface Candidate {
  id: string; signal: SignalId; model: ModelId; cycles: WaveCycle[]; validCycles: number;
  metrics: Record<CandidateMetric, number | null>; partialMean: number | null; warnings: string[];
}
export interface WaveformAnalysis { version: string; signals: SignalResult[]; candidates: Candidate[]; warnings: string[] }
const average = (a: number[]) => a.reduce((s, v) => s + v, 0) / a.length;
const median = (a: number[]) => { const s = [...a].sort((x, y) => x - y); return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2; };
const valid = (s: COMSample) => s.comY !== null && s.comX !== null && s.bodyScale !== null && s.bodyScale > 0 &&
  [s.comY, s.comX, s.bodyScale].every(Number.isFinite);
const emptyMetrics = (): Candidate['metrics'] => ({ mean: null, max: null, median: null, pooled: null, trimmed: null, last3: null });

export function detectLowerPeaks(samples: readonly COMSample[], signal: SignalId): SignalResult {
  const result: SignalResult = { signal, detected: 0, peaks: [], excluded: [], validFrames: samples.filter(valid).length, totalFrames: samples.length };
  const fail = (reason: string) => ({ ...result, reason });
  if (samples.length < 30) return fail('INSUFFICIENT_SAMPLES');
  if (samples.some((s, i) => !Number.isFinite(s.pts) || !Number.isInteger(s.frame) ||
    [s.comX, s.comY, s.bodyScale].some(v => v !== null && !Number.isFinite(v)) ||
    (i > 0 && (s.pts <= samples[i - 1].pts || s.frame <= samples[i - 1].frame)))) return fail('INVALID_TIMELINE');
  if (1 / median(samples.slice(1).map((s, i) => s.pts - samples[i].pts)) < 90) return fail('FRAME_RATE_TOO_LOW');
  const good = samples.filter(valid); if (good.length < 30) return fail('LOWER_POINTS_UNAVAILABLE');
  const threshold = median(good.map(s => s.bodyScale!)) * .07;
  const smooth = samples.map((s, i) => {
    const neighbors = samples.slice(Math.max(0, i - 2), i + 3);
    return valid(s) && neighbors.every(valid) ? median(neighbors.map(n => n.comY!)) : valid(s) ? s.comY : null;
  });
  let bottom = -Infinity, apex = -1, last = -Infinity;
  for (let i = 0; i < samples.length; i++) {
    if (samples[i].pts - last > .05 + 1e-6) { bottom = -Infinity; apex = -1; }
    const y = smooth[i]; if (y === null) continue;
    last = samples[i].pts;
    if (apex < 0) { bottom = Math.max(bottom, y); if (bottom - y >= threshold) apex = i; }
    else {
      if (y < smooth[apex]!) apex = i;
      if (y - smooth[apex]! >= threshold) {
        const s = samples[apex]; let pts = s.pts, py = s.comY!;
        const rows = samples.filter(r => valid(r) && Math.abs(r.pts - pts) <= .05);
        const fit = rows.length >= 7 ? quadratic(rows.map(r => ({ t: r.pts - pts, y: r.comY! }))) : null;
        if (fit && fit.a > 0 && Math.abs(fit.b / (2 * fit.a)) <= .025) { pts -= fit.b / (2 * fit.a); py = fit.c - fit.b ** 2 / (4 * fit.a); }
        // Close peaks remain visible as a count/period failure; do not remove
        // events merely to obtain the requested number of jumps.
        result.peaks.push({ frame: s.frame, pts, y: py }); apex = -1; bottom = y;
      }
    }
  }
  result.detected = result.peaks.length;
  if (result.detected === 11) result.excluded = [result.peaks[10].frame];
  if (result.detected !== 10 && result.detected !== 11) return fail('JUMP_COUNT_MISMATCH');
  return result;
}

/** Whole-cycle inverse model. Fit offset + linear drift + positive image scale
 * at every candidate flight fraction, using ONLY observed samples. This is
 * not contact-frame detection or proof of physical flight. */
export function fitWaveCycle(samples: readonly COMSample[], a: Apex, b: Apex, id: number, model: ModelId): WaveCycle {
  const P = b.pts - a.pts;
  const out: WaveCycle = { id, fromJump: id, toJump: id + 1, startPts: a.pts, endPts: b.pts,
    coverage: 0, maxGap: Infinity, estimate: null, waveformError: null, legLengthM: null, sensitivity: null };
  const fail = (reason: string) => ({ ...out, reason });
  if (!Number.isFinite(P) || P < .25 || P > 1.2) return fail('CYCLE_PERIOD_OUT_OF_RANGE');
  const all = samples.filter(s => s.pts >= a.pts && s.pts <= b.pts), rows = all.filter(valid);
  out.coverage = all.length ? rows.length / all.length : 0;
  const times = [a.pts, ...rows.map(r => r.pts), b.pts];
  out.maxGap = Math.max(...times.slice(1).map((t, i) => t - times[i]));
  if (rows.length < 20 || out.coverage < .9 || out.maxGap > .05 + 1e-6) return fail('LOWER_TRACKING_GAP');
  const leg = median(rows.map(s => s.bodyScale!));
  if (Math.max(...rows.map(s => s.comX!)) - Math.min(...rows.map(s => s.comX!)) > leg * .25) return fail('SUBJECT_DRIFT');
  const yy = rows.map(r => r.comY!), span = Math.max(...yy) - Math.min(...yy);
  if (span < leg * .07) return fail('INSUFFICIENT_EXCURSION');
  const tt = rows.map(r => (r.pts - a.pts) / P), mt = average(tt), my = average(yy);
  const vt = average(tt.map(t => (t - mt) ** 2));
  const yt = average(tt.map((t, i) => (t - mt) * (yy[i] - my))) / vt;
  const yResidual = yy.map((y, i) => y - my - yt * (tt[i] - mt));
  type Fit = { error: number; e: Estimate; legM: number; fraction: number };
  const fit = (fraction: number): Fit | null => {
    const F = P * fraction, C = P - F, h = G * F * F / 8;
    if (C < .06 || C > .6 || F < .12 || F > .9) return null;
    const e: Estimate = { heightM: h, flightSeconds: F, contactSeconds: C, rsi: h / C };
    const dd = tt.map(t => modelDisplacement(t * P, e, model)), md = average(dd);
    const dt = average(tt.map((t, i) => (t - mt) * (dd[i] - md))) / vt;
    const dr = dd.map((d, i) => d - md - dt * (tt[i] - mt));
    const denom = dr.reduce((s, d) => s + d * d, 0);
    const scale = dr.reduce((s, d, i) => s + d * yResidual[i], 0) / denom;
    if (!Number.isFinite(scale) || scale <= 0) return null;
    const legM = leg / scale;
    if (legM < .2 || legM > 1.5) return null;
    const error = Math.sqrt(average(dr.map((d, i) => (yResidual[i] - scale * d) ** 2))) / span;
    return { error, e, legM, fraction };
  };
  const profile: Fit[] = [];
  for (let k = 30; k <= 190; k++) { const f = fit(k / 200); if (f) profile.push(f); }
  if (profile.length < 5) return fail('MODEL_OUT_OF_RANGE');
  let best = profile.reduce((x, f) => f.error < x.error ? f : x);
  const coarse = best.fraction;
  for (let k = -10; k <= 10; k++) { const f = fit(coarse + k * .0005); if (f && f.error < best.error) best = f; }
  out.waveformError = best.error;
  if (best.error > .1) return fail('WAVEFORM_MODEL_MISMATCH');
  if (best.fraction <= profile[0].fraction + .001 || best.fraction >= profile.at(-1)!.fraction - .001) return fail('FIT_AT_BOUNDARY');
  out.estimate = best.e; out.legLengthM = best.legM;
  const plausible = [...profile, best].filter(f => f.error <= best.error + .01).map(f => f.e.rsi);
  out.sensitivity = [Math.min(...plausible), Math.max(...plausible)];
  return out;
}

export function analyzeWaveforms(signals: Record<SignalId, readonly COMSample[]>): WaveformAnalysis {
  const result: WaveformAnalysis = { version: WAVEFORM_VERSION, signals: [], candidates: [], warnings: [
    '研究候補です。骨盤・腰膝の代理点は全身重心ではなく、接地時間・跳躍高は対称動作モデルからの推定です。',
    '末尾3周期は単一跳躍の最後3回と厳密には異なります。PUSHとの比較は探索的です。',
    '周期的な屈伸でも数値が出る可能性があります。実際に跳躍した動画のみ使用してください。',
  ] };
  for (const signal of SIGNALS) {
    const samples = signals[signal.id], detection = detectLowerPeaks(samples, signal.id); result.signals.push(detection);
    const peaks = detection.peaks.filter(p => !detection.excluded.includes(p.frame));
    for (const model of MODELS) {
      const c: Candidate = { id: `${signal.id}_${model.id}`, signal: signal.id, model: model.id, cycles: [], validCycles: 0,
        metrics: emptyMetrics(), partialMean: null, warnings: [] };
      result.candidates.push(c);
      if (detection.reason) { c.warnings.push(detection.reason); continue; }
      c.cycles = peaks.slice(1).map((b, i) => fitWaveCycle(samples, peaks[i], b, i + 1, model.id));
      const good = c.cycles.filter(r => r.estimate !== null && !r.reason), rsi = good.map(r => r.estimate!.rsi);
      c.validCycles = good.length;
      if (good.length) c.partialMean = average(rsi);
      if (good.length === 9) {
        c.metrics = { ...c.metrics, mean: average(rsi), max: Math.max(...rsi), median: median(rsi),
          pooled: average(good.map(r => r.estimate!.heightM)) / average(good.map(r => r.estimate!.contactSeconds)),
          trimmed: average([...rsi].sort((x, y) => x - y).slice(1, -1)) };
      }
      const tail = c.cycles.slice(-3);
      if (tail.length === 3 && tail.every(r => r.estimate !== null && !r.reason)) c.metrics.last3 = average(tail.map(r => r.estimate!.rsi));
      if (good.length !== 9) c.warnings.push('全9周期がそろわないため全体集計は非表示です。末尾3周期は別に判定します。');
      if (good.some(r => r.sensitivity && (r.sensitivity[1] - r.sensitivity[0]) / r.estimate!.rsi > .5))
        c.warnings.push('似た波形適合度でもRSIが大きく変わる周期があります。感度幅は統計的な信頼区間ではありません。');
    }
  }
  if (new Set(result.signals.map(s => s.detected)).size > 1)
    result.warnings.push('代理点によって検出した回数が異なります。数値の近さで方式を選ぶ前に、元動画の跳躍回数を確認してください。');
  return result;
}
