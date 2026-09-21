import { G, quadratic } from '../cmj/analysis';
import type { COMSample } from '../cmj/center-of-mass';
import { estimateCycle, modelDisplacement, type ModelId } from './analysis';
import type { JumpMode } from './lower-body';
import { detectLowerPeaks, fitWaveCycle, type Apex, type CandidateMetric, type WaveCycle } from './waveform-fit';

export const PREDICTION_VERSION = 'rj-all-formulas-v1-experimental';
export type PredictionSignal = 'PELVIS' | 'HIP_KNEE' | 'COM';
export type PredictionSignals = Record<PredictionSignal, COMSample[]>;
export const emptySignals = (): PredictionSignals => ({ PELVIS: [], HIP_KNEE: [], COM: [] });
export const FORMULAS = [
  { id: 'A', name: '骨盤 × 線形波形', signal: 'PELVIS', model: 'BOSCO_LINEAR', method: 'WAVE' },
  { id: 'B', name: '骨盤 × 正弦波形', signal: 'PELVIS', model: 'SINUSOIDAL_VELOCITY', method: 'WAVE' },
  { id: 'C', name: '腰・支持膝 × 線形波形', signal: 'HIP_KNEE', model: 'BOSCO_LINEAR', method: 'WAVE' },
  { id: 'D', name: '腰・支持膝 × 正弦波形', signal: 'HIP_KNEE', model: 'SINUSOIDAL_VELOCITY', method: 'WAVE' },
  { id: 'E', name: '全身重心 × 線形波形', signal: 'COM', model: 'BOSCO_LINEAR', method: 'WAVE' },
  { id: 'F', name: '全身重心 × 正弦波形', signal: 'COM', model: 'SINUSOIDAL_VELOCITY', method: 'WAVE' },
  { id: 'G', name: '重心振幅・周期 × 線形逆算', signal: 'COM', model: 'BOSCO_LINEAR', method: 'AMPLITUDE' },
  { id: 'H', name: '重心振幅・周期 × 正弦逆算', signal: 'COM', model: 'SINUSOIDAL_VELOCITY', method: 'AMPLITUDE' },
] as const;
export type FormulaId = typeof FORMULAS[number]['id'];
export interface PredictionCandidate {
  id: FormulaId; cycles: WaveCycle[]; validCycles: number; metrics: Record<CandidateMetric, number | null>; reasons: string[];
}
export interface PredictionAnalysis {
  version: string; validated: false; mode: JumpMode; detected: number; peaks: Apex[];
  selectedPeakFrames: number[]; excludedPeakFrames: number[];
  selectionSource: 'AUTO_TEN' | 'AUTO_EXCLUDE_ELEVENTH' | 'MANUAL_TEN' | 'UNRESOLVED';
  firstPeakIndex: number | null; reason?: string; candidates: PredictionCandidate[];
  diagnostics: { cycle: number; periodSeconds: number; lowPositionSeconds: number | null }[];
}
const mean = (a: number[]) => a.reduce((s, x) => s + x, 0) / a.length;
const median = (a: number[]) => { const b = [...a].sort((x, y) => x - y); return (b[Math.floor((b.length - 1) / 2)] + b[Math.floor(b.length / 2)]) / 2; };
const valid = (s: COMSample) => [s.comY, s.comX, s.bodyScale].every(v => v !== null && Number.isFinite(v)) && s.bodyScale! > 0;
const blankMetrics = (): PredictionCandidate['metrics'] => ({ mean: null, max: null, median: null, pooled: null, trimmed: null, last3: null });

/** Local curvature sets the metre scale; it does NOT search for flight/contact
 * boundaries. Every window and acceptance threshold is fixed before comparison. */
function apexScale(samples: readonly COMSample[], peak: Apex): number | null {
  const scales: number[] = [];
  for (const window of [.04, .055, .07]) {
    const rows = samples.filter(s => Math.abs(s.pts - peak.pts) <= window);
    if (rows.length < 7 || rows.some(s => !valid(s)) || rows.filter(s => s.pts < peak.pts).length < 3 ||
      rows.filter(s => s.pts > peak.pts).length < 3 || rows.some((s, i) => i > 0 && s.pts - rows[i - 1].pts > 1 / 60 + 1e-6)) return null;
    const fit = quadratic(rows.map(s => ({ t: s.pts - peak.pts, y: s.comY! })));
    const leg = median(rows.map(s => s.bodyScale!));
    if (!fit || fit.a <= 0 || fit.rmse > leg * .006 || fit.a * window ** 2 < Math.max(leg * .0006, 3 * fit.rmse) ||
      Math.abs(fit.b / (2 * fit.a)) > .025) return null;
    const scale = G / (2 * fit.a);
    if (scale * leg < .2 || scale * leg > 1.5) return null;
    scales.push(scale);
  }
  return Math.max(...scales) / Math.min(...scales) <= 1.35 ? median(scales) : null;
}

export function fitAmplitudeCycle(samples: readonly COMSample[], a: Apex, b: Apex, id: number, model: ModelId): WaveCycle {
  const P = b.pts - a.pts;
  const out: WaveCycle = { id, fromJump: id, toJump: id + 1, startPts: a.pts, endPts: b.pts,
    coverage: 0, maxGap: Infinity, estimate: null, waveformError: null, legLengthM: null, sensitivity: null };
  const fail = (reason: string) => ({ ...out, reason });
  if (!Number.isFinite(P) || P < .25 || P > 1.2) return fail('CYCLE_PERIOD_OUT_OF_RANGE');
  const all = samples.filter(s => s.pts >= a.pts && s.pts <= b.pts), rows = all.filter(valid);
  out.coverage = all.length ? rows.length / all.length : 0;
  const times = [a.pts, ...rows.map(s => s.pts), b.pts];
  out.maxGap = Math.max(...times.slice(1).map((t, i) => t - times[i]));
  if (rows.length < 20 || out.coverage < .9 || out.maxGap > .05 + 1e-6) return fail('LOWER_TRACKING_GAP');
  const leg = median(rows.map(s => s.bodyScale!));
  if (Math.max(...rows.map(s => s.comX!)) - Math.min(...rows.map(s => s.comX!)) > leg * .25) return fail('SUBJECT_DRIFT');
  const scales = [apexScale(samples, a), apexScale(samples, b)];
  if (scales.some(s => s === null)) return fail('GRAVITY_ARC_UNRESOLVED');
  if (Math.max(...scales as number[]) / Math.min(...scales as number[]) > 1.35) return fail('SCALE_INCONSISTENT');
  const scale = mean(scales as number[]);
  const edgeY = (p: Apex) => {
    const edge = samples.filter(s => valid(s) && Math.abs(s.pts - p.pts) <= .015);
    return edge.length ? median(edge.map(s => s.comY!)) : null;
  };
  const ya = edgeY(a), yb = edgeY(b);
  if (ya === null || yb === null) return fail('LOWER_TRACKING_GAP');
  const displacement = rows.map(s => s.comY! - (ya + (yb - ya) * (s.pts - a.pts) / P));
  // Three-observation median suppresses isolated pose outliers; no missing data fill.
  const smooth = displacement.map((_, i) => median(displacement.slice(Math.max(0, i - 1), i + 2)));
  const amplitude = Math.max(...smooth);
  if (amplitude < leg * .07) return fail('INSUFFICIENT_EXCURSION');
  const estimate = estimateCycle(amplitude * scale, P, model);
  if (!estimate) return fail('MODEL_OUT_OF_RANGE');
  out.waveformError = Math.sqrt(mean(displacement.map((y, i) => (y * scale - modelDisplacement(rows[i].pts - a.pts, estimate, model)) ** 2))) / (amplitude * scale);
  if (out.waveformError > .15) return fail('WAVEFORM_MODEL_MISMATCH');
  out.estimate = estimate; out.legLengthM = leg * scale;
  return out;
}

function aggregate(cycles: WaveCycle[]): PredictionCandidate['metrics'] {
  const metrics = blankMetrics(), good = cycles.filter(c => !c.reason && c.estimate !== null);
  if (cycles.length === 9 && good.length === 9) {
    const rsi = good.map(c => c.estimate!.rsi);
    Object.assign(metrics, { mean: mean(rsi), max: Math.max(...rsi), median: median(rsi),
      pooled: mean(good.map(c => c.estimate!.heightM)) / mean(good.map(c => c.estimate!.contactSeconds)),
      trimmed: mean([...rsi].sort((a, b) => a - b).slice(1, -1)) });
  }
  const tail = cycles.slice(-3);
  if (cycles.length === 9 && tail.every(c => !c.reason && c.estimate !== null)) metrics.last3 = mean(tail.map(c => c.estimate!.rsi));
  return metrics;
}

/** All formulas share the same ten pelvis peaks. Selection changes never touch
 * video inference, references, calibration, or these computed values. */
export function analyzePredictions(signals: PredictionSignals, mode: JumpMode, firstPeakIndex: number | null = null): PredictionAnalysis {
  const detected = detectLowerPeaks(signals.PELVIS, 'PELVIS');
  const manual = firstPeakIndex !== null;
  const first = manual ? firstPeakIndex : [10, 11].includes(detected.detected) ? 0 : null;
  const reason = detected.reason && detected.reason !== 'JUMP_COUNT_MISMATCH' ? detected.reason :
    first === null ? 'JUMP_COUNT_MISMATCH' : !Number.isInteger(first) || first < 0 || first + 10 > detected.peaks.length ? 'INVALID_PEAK_RANGE' : undefined;
  const peaks = reason ? [] : detected.peaks.slice(first!, first! + 10);
  const result: PredictionAnalysis = { version: PREDICTION_VERSION, validated: false, mode, detected: detected.detected, peaks: detected.peaks,
    selectedPeakFrames: peaks.map(p => p.frame), excludedPeakFrames: detected.peaks.filter(p => peaks.length && !peaks.includes(p)).map(p => p.frame),
    firstPeakIndex: reason ? null : first,
    selectionSource: reason ? 'UNRESOLVED' : manual ? 'MANUAL_TEN' : detected.detected === 11 ? 'AUTO_EXCLUDE_ELEVENTH' : 'AUTO_TEN',
    reason, candidates: [], diagnostics: [] };
  for (const formula of FORMULAS) {
    const c: PredictionCandidate = { id: formula.id, cycles: [], validCycles: 0, metrics: blankMetrics(), reasons: [] };
    result.candidates.push(c);
    if (reason) { c.reasons.push(reason); continue; }
    const samples = signals[formula.signal];
    // All signals must come from the exact same source frames, not an independently resampled track.
    if (samples.length !== signals.PELVIS.length || samples.some((s, i) => s.frame !== signals.PELVIS[i].frame || s.pts !== signals.PELVIS[i].pts)) {
      c.reasons.push('SIGNAL_TIMELINE_MISMATCH'); continue;
    }
    c.cycles = peaks.slice(1).map((b, i) => (formula.method === 'WAVE' ? fitWaveCycle : fitAmplitudeCycle)(samples, peaks[i], b, i + 1, formula.model));
    c.validCycles = c.cycles.filter(c => !c.reason && c.estimate !== null).length;
    c.metrics = aggregate(c.cycles);
    c.reasons = [...new Set(c.cycles.flatMap(c => c.reason ? [c.reason] : []))];
    if (c.validCycles !== 9) c.reasons.push('INCOMPLETE_VALID_CYCLES');
  }
  // Descriptive low-position occupancy only: explicitly NOT a contact estimate.
  for (let i = 1; i < peaks.length; i++) {
    const rows = signals.PELVIS.filter(s => s.pts >= peaks[i - 1].pts && s.pts <= peaks[i].pts);
    let low: number | null = null;
    if (rows.length >= 20 && rows.every(valid) && rows.every((s, j) => !j || s.pts - rows[j - 1].pts <= .05 + 1e-6)) {
      const ys = rows.map(s => s.comY!), min = Math.min(...ys), max = Math.max(...ys), threshold = min + .8 * (max - min);
      low = rows.slice(1).reduce((sum, s, j) => sum + (s.comY! >= threshold && rows[j].comY! >= threshold ? s.pts - rows[j].pts : 0), 0);
    }
    result.diagnostics.push({ cycle: i, periodSeconds: peaks[i].pts - peaks[i - 1].pts, lowPositionSeconds: low });
  }
  return result;
}

export function predictionReason(reason: string): string {
  return ({ JUMP_COUNT_MISMATCH: '10または11頂点ではありません。動画で確認し、連続する10頂点を指定してください。',
    INVALID_PEAK_RANGE: '連続する10頂点を選んでください。', INSUFFICIENT_SAMPLES: '観測データが不足しています。',
    INVALID_TIMELINE: '元動画の時刻・フレーム順が不正です。', FRAME_RATE_TOO_LOW: '元フレームの時刻間隔が90fps未満です。',
    LOWER_POINTS_UNAVAILABLE: '必要な身体点を追跡できません。', LOWER_TRACKING_GAP: '必要な身体点の観測率・欠測間隔が条件外です。',
    GRAVITY_ARC_UNRESOLVED: '頂点の曲率から安定した長さ尺度を推定できません。', SCALE_INCONSISTENT: '前後の頂点で長さ尺度が一致しません。',
    INCOMPLETE_VALID_CYCLES: '全9周期が成立しないため平均・最大などの全体集計は空欄です。',
    SIGNAL_TIMELINE_MISMATCH: '波形の元フレーム・時刻が一致しません。', CYCLE_PERIOD_OUT_OF_RANGE: '周期がモデルの範囲外です。',
    SUBJECT_DRIFT: '横移動が大きすぎます。', INSUFFICIENT_EXCURSION: '上下動が小さすぎます。', MODEL_OUT_OF_RANGE: 'モデルに合う解がありません。',
    WAVEFORM_MODEL_MISMATCH: '観測波形とモデルの誤差が大きすぎます。', FIT_AT_BOUNDARY: '探索範囲の端に解が偏っています。',
  } as Record<string, string>)[reason] ?? reason;
}

export function predictionCSV(analysis: PredictionAnalysis): string {
  const header = ['version', 'mode', 'formula', 'metric', 'value_m_per_s', 'valid_cycles', 'scope', 'peak_selection', 'selected_frames', 'excluded_frames', 'reasons'];
  const rows = analysis.candidates.flatMap(c => Object.entries(c.metrics).map(([metric, value]) => [analysis.version, analysis.mode, c.id, metric,
    value ?? '', c.validCycles, metric === 'last3' ? 'LAST_3_APEX_CYCLES_NOT_JUMPS_8_9_10' : 'NINE_APEX_CYCLES', analysis.selectionSource,
    analysis.selectedPeakFrames.join('|'), analysis.excludedPeakFrames.join('|'), c.reasons.join('|')]));
  return [header, ...rows].map(row => row.map(v => `"${String(v).replaceAll('"', '""')}"`).join(',')).join('\n');
}
