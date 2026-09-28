import type { NormalizedLandmark } from '@mediapipe/tasks-vision';
import type { COMSample } from '../cmj/center-of-mass';
import type { PoseFrame } from './prediction-observations';
import { createLowerSubjectSelector, lowerBodySamples } from './lower-body';
import { detectLowerPeaks, type Apex } from './waveform-fit';
import { extractHybridCycle, fractionRSI, HYBRID_SETTINGS } from './hybrid-physics';
import { bilateralFlightLobe, bilateralFlightFraction, bilateralFlightRange } from './bilateral-flight';

export const TOE_CYCLE_VERSION = 'rj-toe-constrained-cycle-v3-research';
/** Frozen engineering hypotheses, NOT experimentally validated tolerances.
 * Toe kinematics are not whole-body COM kinematics. No frame is classified as
 * contact/takeoff and no event timestamps are emitted. The internal fraction
 * still represents an assumed aerial/support duration ratio. */
export const TOE_CYCLE_SETTINGS = {
  fractionMin: .2, fractionMax: .85, fractionStep: .005,
  phaseMin: -.15, phaseMax: .15, phaseStep: .0125,
  minimumCoverage: .95, maximumGapSeconds: .025, minimumSamples: 20,
  minimumSpanOverLeg: .04, maximumNormalizedError: .15,
  huberResidual: .05, profileNoise: .03, maximumFootFractionDifference: .15,
} as const;
export interface ToeSample extends COMSample { leftToeY: number | null; rightToeY: number | null }
interface Data { t: number[]; y: number[]; w: number[]; span: number }
export interface ToePoint { fraction: number; rsi: number; error: number; toeError: number;
  pelvisError: number; phase: number; leftError: number; rightError: number }
export interface ToeFootPoint { fraction: number; phase: number; error: number }
export interface ToeCycleFit {
  // points retains the previous synchronized-foot fit for auditing only.
  points: ToePoint[]; reason: string | null; coverage: [number, number];
  spansOverLeg: [number, number]; leftBestFraction: number | null; rightBestFraction: number | null;
  period: number | null; footPoints: [ToeFootPoint[], ToeFootPoint[]];
  commonProfileRange: [number, number] | null;
}
const average = (x: readonly number[]) => x.length ? x.reduce((a, b) => a + b, 0) / x.length : null;
const quantile = (x: readonly number[], q: number) => [...x].sort((a, b) => a - b)[Math.floor((x.length - 1) * q)];
const valid = (p?: NormalizedLandmark) => !!p && Number.isFinite(p.x) && Number.isFinite(p.y) &&
  p.x > 0 && p.x < 1 && p.y > 0 && p.y < 1 && Number.isFinite(p.visibility) && p.visibility >= .5;

/** Downward toe-depth template: parabolic lobes around adjacent apexes and a
 * continuous, flat middle section. The derivative can change at the model's
 * latent support boundary, but individual frames are never event-labelled. */
export function toeCycleDepth(phase: number, fraction: number, offset = 0): number {
  if (!Number.isFinite(phase) || !Number.isFinite(offset) || !Number.isFinite(fraction) || !(fraction > 0 && fraction < 1)) {
    throw Error('INVALID_TOE_TEMPLATE_INPUT');
  }
  const p = ((phase - offset) % 1 + 1) % 1;
  const distance = Math.min(p, 1 - p);
  return Math.min(1, (2 * distance / fraction) ** 2);
}

export function toeCycleSamples(poses: readonly PoseFrame[]): ToeSample[] {
  const select = createLowerSubjectSelector({ left: 0, right: 1, top: 0, bottom: 1 }, 'BOTH');
  return poses.map(f => {
    const selected = select(f.poses, f.pts), p = selected[0];
    const pelvis = lowerBodySamples(selected, f.frame, f.pts, 'BOTH').PELVIS;
    return { ...pelvis, leftToeY: selected.length === 1 && valid(p[31]) ? p[31].y * 960 : null,
      rightToeY: selected.length === 1 && valid(p[32]) ? p[32].y * 960 : null };
  });
}

function regress(t: number[], y: number[], d: number[], w: number[]) {
  const sw = w.reduce((a, b) => a + b, 0);
  const mt = t.reduce((s, v, i) => s + w[i] * v, 0) / sw;
  const my = y.reduce((s, v, i) => s + w[i] * v, 0) / sw;
  const md = d.reduce((s, v, i) => s + w[i] * v, 0) / sw;
  let tt = 0, dd = 0, td = 0, ty = 0, dy = 0;
  for (let i = 0; i < t.length; i++) {
    const a = t[i] - mt, b = d[i] - md, c = y[i] - my;
    tt += w[i] * a * a; dd += w[i] * b * b; td += w[i] * a * b;
    ty += w[i] * a * c; dy += w[i] * b * c;
  }
  const det = tt * dd - td * td;
  if (!(det > 1e-14)) return null;
  const amplitude = (dy * tt - ty * td) / det;
  if (!(amplitude > 0 && Number.isFinite(amplitude))) return null;
  const slope = (ty * dd - dy * td) / det;
  return y.map((v, i) => v - my - slope * (t[i] - mt) - amplitude * (d[i] - md));
}

function waveformError(data: Data, fraction: number, phase: number): number {
  const d = data.t.map(t => toeCycleDepth(t, fraction, phase));
  let weights = data.w, residual = regress(data.t, data.y, d, weights);
  if (!residual) return Infinity;
  // Fixed two robust reweightings, independent of RSI/reference values.
  const huber = TOE_CYCLE_SETTINGS.huberResidual * data.span;
  for (let iteration = 0; iteration < 2; iteration++) {
    weights = data.w.map((w, i) => w * Math.min(1, huber / Math.max(1e-12, Math.abs(residual![i]))));
    residual = regress(data.t, data.y, d, weights);
    if (!residual) return Infinity;
  }
  const loss = residual.reduce((s, r, i) => {
    const a = Math.abs(r), robust = a <= huber ? a * a : 2 * huber * a - huber * huber;
    return s + data.w[i] * robust;
  }, 0) / data.w.reduce((a, b) => a + b, 0);
  return Math.sqrt(loss) / data.span;
}

export function fitToeCycle(samples: readonly ToeSample[], a: Apex, b: Apex): ToeCycleFit {
  const out: ToeCycleFit = { points: [], reason: null, coverage: [0, 0], spansOverLeg: [0, 0],
    leftBestFraction: null, rightBestFraction: null, period: null, footPoints: [[], []], commonProfileRange: null };
  const fail = (reason: string) => ({ ...out, reason });
  if (samples.some((s, i) => !Number.isFinite(s.pts) || s.pts < 0 || !Number.isInteger(s.frame) || s.frame < 0 ||
    (i > 0 && (s.pts <= samples[i - 1].pts || s.frame <= samples[i - 1].frame)))) return fail('INVALID_TIMELINE');
  if (samples.some(s => [s.comX, s.comY, s.bodyScale].some(v => v !== null && !Number.isFinite(v)) ||
    (s.bodyScale !== null && !(s.bodyScale > 0)))) return fail('INVALID_OBSERVATIONS');
  const period = b.pts - a.pts;
  if (!(period >= .25 && period <= 1.2)) return fail('PERIOD_OUT_OF_RANGE');
  out.period = period;
  const pelvis = extractHybridCycle(samples, a, b);
  if (pelvis.reason) return fail('PELVIS_' + pelvis.reason);
  const all = samples.filter(s => s.pts >= a.pts && s.pts <= b.pts);
  const legValues = all.flatMap(s => s.bodyScale !== null && s.bodyScale > 0 ? [s.bodyScale] : []);
  if (!legValues.length) return fail('LOWER_SCALE_UNAVAILABLE');
  const leg = quantile(legValues, .5), data: Data[] = [];
  for (const [side, key] of (['leftToeY', 'rightToeY'] as const).entries()) {
    const rows = all.filter(s => s[key] !== null && Number.isFinite(s[key]));
    out.coverage[side] = rows.length / Math.max(1, all.length);
    const times = [a.pts, ...rows.map(s => s.pts), b.pts];
    if (rows.length < TOE_CYCLE_SETTINGS.minimumSamples || out.coverage[side] < TOE_CYCLE_SETTINGS.minimumCoverage ||
      times.some((v, j) => j > 0 && v - times[j - 1] > TOE_CYCLE_SETTINGS.maximumGapSeconds + 1e-6)) return fail(side === 0 ? 'LEFT_TOE_TRACKING_GAP' : 'RIGHT_TOE_TRACKING_GAP');
    const t = rows.map(s => (s.pts - a.pts) / period), y = rows.map(s => s[key]!);
    // Quantile span resists a single erroneous toe landmark without filtering
    // high-RSI cycles. Absolute leg-normalized motion is needed on both toes.
    const span = quantile(y, .95) - quantile(y, .05);
    out.spansOverLeg[side] = span / leg;
    if (!(span >= TOE_CYCLE_SETTINGS.minimumSpanOverLeg * leg)) return fail(side === 0 ? 'LEFT_TOE_INSUFFICIENT_MOTION' : 'RIGHT_TOE_INSUFFICIENT_MOTION');
    const w = t.map((_, j) => ((t[j + 1] ?? t[j]) - (t[j - 1] ?? t[j])) / 2);
    // A large linear drift is not jumping. The fit removes that drift, so
    // require the existing minimum excursion after removing it as well.
    const sw = w.reduce((a, b) => a + b, 0);
    const mt = t.reduce((s, v, i) => s + w[i] * v, 0) / sw;
    const my = y.reduce((s, v, i) => s + w[i] * v, 0) / sw;
    const tt = t.reduce((s, v, i) => s + w[i] * (v - mt) ** 2, 0);
    const slope = t.reduce((s, v, i) => s + w[i] * (v - mt) * (y[i] - my), 0) / tt;
    const detrended = y.map((v, i) => v - my - slope * (t[i] - mt));
    if (quantile(detrended, .95) - quantile(detrended, .05) < TOE_CYCLE_SETTINGS.minimumSpanOverLeg * leg)
      return fail(side === 0 ? 'LEFT_TOE_INSUFFICIENT_MOTION' : 'RIGHT_TOE_INSUFFICIENT_MOTION');
    data.push({ t, y, w, span });
  }
  const surfaces: [ToeFootPoint[], ToeFootPoint[]] = [[], []];
  const phaseSteps = Math.round((TOE_CYCLE_SETTINGS.phaseMax - TOE_CYCLE_SETTINGS.phaseMin) / TOE_CYCLE_SETTINGS.phaseStep);
  for (const base of pelvis.points) {
    let best: ToePoint | null = null;
    const footBest: [ToeFootPoint | null, ToeFootPoint | null] = [null, null];
    for (let k = 0; k <= phaseSteps; k++) {
      const phase = TOE_CYCLE_SETTINGS.phaseMin + k * TOE_CYCLE_SETTINGS.phaseStep;
      const e0 = waveformError(data[0], base.fraction, phase), e1 = waveformError(data[1], base.fraction, phase);
      [e0, e1].forEach((error, side) => {
        if (!Number.isFinite(error)) return;
        const point = { fraction: base.fraction, phase, error };
        surfaces[side].push(point);
        if (!footBest[side] || error < footBest[side]!.error) footBest[side] = point;
      });
      const toeError = Math.sqrt((e0 * e0 + e1 * e1) / 2);
      // Preserve the v2 synchronized fit as a diagnostic. V3 does not use
      // its shared fraction/phase to calculate the headline RSI.
      const error = Math.sqrt((toeError * toeError + base.error * base.error) / 2);
      if (Number.isFinite(error) && (!best || error < best.error)) best = {
        fraction: base.fraction, rsi: fractionRSI(period, base.fraction), error, toeError,
        pelvisError: base.error, phase, leftError: e0, rightError: e1,
      };
    }
    if (best) out.points.push(best);
    footBest.forEach((p, side) => { if (p) out.footPoints[side].push(p); });
  }
  if (!out.points.length) return fail('TOE_WAVEFORM_UNIDENTIFIABLE');
  if (out.footPoints.some(points => !points.length)) return fail('TOE_WAVEFORM_UNIDENTIFIABLE');
  const feet = out.footPoints.map(points => points.reduce((a, b) => a.error <= b.error ? a : b));
  out.leftBestFraction = feet[0].fraction;
  out.rightBestFraction = feet[1].fraction;
  const best = out.points.reduce((a, b) => a.error <= b.error ? a : b);
  if (best.leftError > TOE_CYCLE_SETTINGS.maximumNormalizedError || best.rightError > TOE_CYCLE_SETTINGS.maximumNormalizedError) return fail('TOE_WAVEFORM_MISMATCH');
  if (Math.abs(out.leftBestFraction - out.rightBestFraction) > TOE_CYCLE_SETTINGS.maximumFootFractionDifference + 1e-8) return fail('TOES_DISAGREE');
  const common = bilateralFlightFraction(feet[0], feet[1]);
  if (common === null) return fail('BILATERAL_FLIGHT_UNRESOLVED');
  // Include phase as well as duration alternatives in the sensitivity range.
  // Full surfaces are transient: only per-fraction optima are exported, so
  // long recordings do not balloon beyond the bounded JSON import size.
  const near = surfaces.map((points, side) => points.filter(p =>
    p.error ** 2 <= feet[side].error ** 2 + TOE_CYCLE_SETTINGS.profileNoise ** 2));
  const range = bilateralFlightRange(near[0], near[1], TOE_CYCLE_SETTINGS.maximumFootFractionDifference);
  if (!range) return fail('BILATERAL_FLIGHT_UNRESOLVED');
  const lower = Math.min(common, range[0]), upper = Math.max(common, range[1]);
  out.commonProfileRange = [fractionRSI(period, lower), fractionRSI(period, upper)];
  return out;
}

export function toeCycleResult(profile: ToeCycleFit) {
  if (profile.reason || !profile.points.length || profile.period === null || !profile.commonProfileRange || profile.footPoints.some(p => !p.length)) return null;
  const feet = profile.footPoints.map(points => points.reduce((a, b) => a.error <= b.error ? a : b));
  const common = bilateralFlightLobe(feet[0], feet[1]);
  if (!common) return null;
  const previous = profile.points.reduce((a, b) => a.error <= b.error ? a : b);
  const toeError = Math.hypot(feet[0].error, feet[1].error) / Math.SQRT2;
  return { value: fractionRSI(profile.period, common.fraction), fraction: common.fraction, waveformError: toeError,
    profileRange: profile.commonProfileRange,
    boundary: feet.some(p => p.fraction <= HYBRID_SETTINGS.fractionMin + 1e-8 || p.fraction >= HYBRID_SETTINGS.fractionMax - 1e-8),
    phaseBoundary: feet.some(p => p.phase <= TOE_CYCLE_SETTINGS.phaseMin + 1e-8 || p.phase >= TOE_CYCLE_SETTINGS.phaseMax - 1e-8),
    toeError, phase: common.phase,
    footFractions: [feet[0].fraction, feet[1].fraction] as [number, number],
    footPhases: [feet[0].phase, feet[1].phase] as [number, number],
    previousSynchronizedValue: previous.rsi };
}

export function toeCycleReport(poses: readonly PoseFrame[], sourceVideoSHA256: string, filename: string) {
  const samples = toeCycleSamples(poses), found = detectLowerPeaks(samples, 'PELVIS', 'ALL');
  const cycles = found.reason ? [] : found.peaks.slice(1).map((b, i) => {
    const a = found.peaks[i], profile = fitToeCycle(samples, a, b);
    return { id: i + 1, fromPeak: i + 1, toPeak: i + 2, startPts: a.pts, endPts: b.pts,
      period: b.pts - a.pts, result: toeCycleResult(profile), reason: profile.reason, profile };
  });
  const accepted = cycles.filter(c => c.result !== null);
  return { version: TOE_CYCLE_VERSION, filename, sourceVideoSHA256,
    validated: false, manualInputsUsed: false, observedContactEventsUsed: false, populationCorrectionUsed: false,
    internallyEstimatedSupportFraction: true, signal: 'PELVIS_WITH_CONTINUOUS_BILATERAL_TOE_TRAJECTORIES' as const,
    footCombination: 'INTERSECTION_OF_INDEPENDENT_TOE_LOBES' as const,
    profileRangeMethod: 'INDEPENDENT_FOOT_DURATION_AND_PHASE_GRID_SENSITIVITY' as const,
    aggregation: 'MEAN_OF_CALCULABLE_ADJACENT_APEX_CYCLES' as const,
    settings: TOE_CYCLE_SETTINGS, detected: found.detected, peaks: found.peaks,
    reason: found.reason ?? (found.detected < 2 ? 'INSUFFICIENT_PEAKS' : null), totalCycles: cycles.length,
    acceptedCycles: accepted.length, acceptedCycleIds: accepted.map(c => c.id),
    mean: average(accepted.map(c => c.result!.value)), partial: accepted.length < cycles.length,
    boundaryCycles: accepted.filter(c => c.result!.boundary).map(c => c.id),
    phaseBoundaryCycles: accepted.filter(c => c.result!.phaseBoundary).map(c => c.id),
    meanProfileRange: accepted.length ? [average(accepted.map(c => c.result!.profileRange[0]))!, average(accepted.map(c => c.result!.profileRange[1]))!] as [number, number] : null,
    cycles, samples };
}
export type ToeCycleReport = ReturnType<typeof toeCycleReport>;
