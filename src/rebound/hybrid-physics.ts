import type { COMSample } from '../cmj/center-of-mass';
import { detectLowerPeaks, type Apex } from './waveform-fit';

export const HYBRID_VERSION = 'rj-hybrid-physics-v1-research';
// Frozen engineering settings, not experimentally established error bounds.
export const HYBRID_SETTINGS = { fractionMin: .2, fractionMax: .85, fractionStep: .005,
  shapeNoise: .03, priorLogFloor: .15, priorWeight: 1, maximumError: .15 } as const;
export type PulseShape = 'HALF_SINE' | 'CONSTANT';
export interface HybridPoint { fraction: number; rsi: number; error: number }
export interface HybridProfile {
  version: string; detected: number; selectedPeakFrames: number[]; reason: string | null;
  periods: number[]; coverage: number[]; points: HybridPoint[]; shape: PulseShape;
}
export interface HybridReference { subject: string; sourceHash: string; reference: number }
export interface HybridPrior { count: number; logMean: number; logSD: number; mean: number; subjects: string[] }
const mean = (a: readonly number[]) => a.reduce((s, x) => s + x, 0) / a.length;
const median = (a: number[]) => [...a].sort((a, b) => a - b)[Math.floor(a.length / 2)];

/** Stationary, equal takeoff/landing COM height approximation. Fraction is a
 * latent aerial duty factor, NOT an observed contact or flight timestamp. */
export function fractionRSI(period: number, fraction: number): number {
  if (!(Number.isFinite(period) && period > 0 && Number.isFinite(fraction) && fraction > 0 && fraction < 1)) throw Error('INVALID_FRACTION');
  return 9.80665 * period * fraction ** 2 / (8 * (1 - fraction));
}

/** Apex-to-apex displacement / (g*T²). Support impulse balances gravity over
 * one cycle. Positive, symmetric support pulse; no differentiation of poses. */
export function hybridDisplacement(phase: number, fraction: number, shape: PulseShape): number {
  const contact = 1 - fraction, x = Math.max(0, phase - fraction / 2);
  const integrated = shape === 'CONSTANT'
    ? (x <= contact ? x * x / (2 * contact) : x - contact / 2)
    : (x <= contact ? (x - Math.sin(Math.PI * x / contact) * contact / Math.PI) / 2 : x - contact / 2);
  return phase * phase / 2 - integrated;
}

function residualize(t: number[], y: number[], w: number[]) {
  const sw = w.reduce((a, b) => a + b, 0);
  const mt = t.reduce((s, v, i) => s + v * w[i], 0) / sw;
  const my = y.reduce((s, v, i) => s + v * w[i], 0) / sw;
  const vt = t.reduce((s, v, i) => s + w[i] * (v - mt) ** 2, 0);
  const slope = t.reduce((s, v, i) => s + w[i] * (v - mt) * (y[i] - my), 0) / vt;
  return y.map((v, i) => v - my - slope * (t[i] - mt));
}

/** Only the last 3 apex cycles of the existing 10-jump reference protocol.
 * They are descriptors for a trial label, not the last 3 measured jumps.
 * No event times, heel/toe scores, height input, or reference labels enter here. */
export function extractHybridProfile(samples: readonly COMSample[], shape: PulseShape = 'HALF_SINE'): HybridProfile {
  const found = detectLowerPeaks(samples, 'PELVIS');
  const out: HybridProfile = { version: HYBRID_VERSION, detected: found.detected, selectedPeakFrames: [],
    reason: found.reason ?? null, periods: [], coverage: [], points: [], shape };
  if (out.reason) return out;
  const peaks = found.peaks.slice(0, 10);
  out.selectedPeakFrames = peaks.map(p => p.frame);
  return profileFromPeaks(samples, peaks, out);
}

/** Independent adjacent-apex cycle. No population correction or fixed count. */
export function extractHybridCycle(samples: readonly COMSample[], a: Apex, b: Apex, shape: PulseShape = 'HALF_SINE'): HybridProfile {
  return profileFromPeaks(samples, [a, b], { version: HYBRID_VERSION, detected: 2,
    selectedPeakFrames: [a.frame, b.frame], reason: null, periods: [], coverage: [], points: [], shape }, 1, 1);
}

function profileFromPeaks(samples: readonly COMSample[], peaks: Apex[], out: HybridProfile, first = 7, last = 9): HybridProfile {
  const fail = (reason: string) => ({ ...out, reason, points: [] });
  const cycles: { t: number[]; y: number[]; w: number[]; span: number }[] = [];
  for (let i = first; i <= last; i++) {
    const a = peaks[i - 1].pts, b = peaks[i].pts, period = b - a;
    if (period < .25 || period > 1.2) return fail('PERIOD_OUT_OF_RANGE');
    const all = samples.filter(s => s.pts >= a && s.pts <= b);
    const rows = all.filter(s => s.comY !== null && s.comX !== null && s.bodyScale !== null && s.bodyScale > 0);
    const coverage = rows.length / Math.max(1, all.length), times = [a, ...rows.map(s => s.pts), b];
    if (rows.length < 20 || coverage < .95 || times.some((v, j) => j > 0 && v - times[j - 1] > .025 + 1e-6)) return fail('TRACKING_GAP');
    const leg = median(rows.map(s => s.bodyScale!));
    if (Math.max(...rows.map(s => s.comX!)) - Math.min(...rows.map(s => s.comX!)) > .25 * leg) return fail('SUBJECT_DRIFT');
    const t = rows.map(s => (s.pts - a) / period), y = rows.map(s => s.comY!);
    const span = Math.max(...y) - Math.min(...y);
    if (span < .07 * leg) return fail('INSUFFICIENT_MOTION');
    const w = t.map((_, j) => ((t[j + 1] ?? t[j]) - (t[j - 1] ?? t[j])) / 2);
    cycles.push({ t, y: residualize(t, y, w), w, span });
    out.periods.push(period); out.coverage.push(coverage);
  }
  for (let k = 0; k <= 130; k++) {
    const fraction = HYBRID_SETTINGS.fractionMin + k * HYBRID_SETTINGS.fractionStep;
    const errors = cycles.map(c => {
      const d = residualize(c.t, c.t.map(t => hybridDisplacement(t, fraction, out.shape)), c.w);
      const scale = d.reduce((s, v, i) => s + c.w[i] * v * c.y[i], 0) / d.reduce((s, v, i) => s + c.w[i] * v * v, 0);
      if (!(scale > 0 && Number.isFinite(scale))) return Infinity;
      return c.y.reduce((s, v, i) => s + c.w[i] * (v - scale * d[i]) ** 2, 0) / c.w.reduce((a, b) => a + b) / c.span ** 2;
    });
    const error = Math.sqrt(mean(errors));
    if (Number.isFinite(error)) out.points.push({ fraction, error, rsi: fractionRSI(mean(out.periods), fraction) });
  }
  if (!out.points.length || Math.min(...out.points.map(p => p.error)) > HYBRID_SETTINGS.maximumError) return fail('WAVEFORM_MISMATCH');
  return out;
}

export function fitHybridPrior(rows: readonly HybridReference[]): HybridPrior {
  if (rows.length < 8 || new Set(rows.map(r => r.subject)).size !== rows.length || new Set(rows.map(r => r.sourceHash)).size !== rows.length ||
      rows.some(r => !Number.isFinite(r.reference) || r.reference <= 0)) throw Error('INVALID_TRAINING_ROWS');
  const logs = rows.map(r => Math.log(r.reference)), logMean = mean(logs);
  return { count: rows.length, logMean, logSD: Math.max(HYBRID_SETTINGS.priorLogFloor, Math.sqrt(mean(logs.map(v => (v - logMean) ** 2)))),
    mean: mean(rows.map(r => r.reference)), subjects: rows.map(r => r.subject) };
}

export function predictHybrid(profile: HybridProfile, prior: HybridPrior, weight: number = HYBRID_SETTINGS.priorWeight) {
  if (!(Number.isFinite(weight) && weight >= 0) || !Number.isFinite(prior.logMean) || !(prior.logSD > 0)) throw Error('INVALID_PRIOR');
  if (profile.reason || !profile.points.length) return null;
  const scores = profile.points.map(p => ({ ...p, score: p.error ** 2 / HYBRID_SETTINGS.shapeNoise ** 2
    + weight * ((Math.log(p.rsi) - prior.logMean) / prior.logSD) ** 2 }));
  const best = scores.reduce((a, b) => a.score <= b.score ? a : b);
  const nearby = scores.filter(p => p.score <= best.score + 1);
  const raw = profile.points.reduce((a, b) => a.error <= b.error ? a : b);
  return { value: best.rsi, fraction: best.fraction, waveformError: best.error, rawValue: raw.rsi,
    priorOnly: Math.exp(prior.logMean), priorWeight: weight,
    profileRange: [Math.min(...nearby.map(p => p.rsi)), Math.max(...nearby.map(p => p.rsi))] as [number, number],
    boundary: best.fraction <= HYBRID_SETTINGS.fractionMin + 1e-8 || best.fraction >= HYBRID_SETTINGS.fractionMax - 1e-8,
    priorDominated: Math.abs(Math.log(best.rsi / raw.rsi)) > .2,
    // This is NOT a statistical confidence interval or a measured individual RSI.
    validated: false as const, target: 'PUSH_LAST_THREE_JUMPS_MEAN' as const };
}
