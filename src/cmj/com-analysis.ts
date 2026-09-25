import { G, quadratic } from './analysis';
import { COM_MODEL, type COMSample } from './center-of-mass';

export interface COMCandidate {
  postApexSeconds: number; transitionPts: number; apexPts: number;
  velocityMps: number; heightCm: number; metersPerUnit: number;
  rmseUnits: number; arcRmseUnits: number; transitionSensitivityCm: [number, number];
  resampledHeightsCm: number[];
}
export interface COMAnalysis {
  version: 'cmj-com-velocity-v2-experimental' | 'cmj-com-short-arc-v3-experimental'; method: 'COM_VELOCITY_GRAVITY'; comModel: string;
  status: 'EXPERIMENTAL_ESTIMATE' | 'UNAVAILABLE'; reason?: string;
  heightCm: number | null; velocityMps: number | null;
  sensitivityCm: [number, number] | null; candidates: COMCandidate[];
  samples: readonly COMSample[];
}
export const MAX_COM_GAP_SECONDS = .12;
/** A steady live interval is the camera rate. A hole is much longer than that rate. */
export function exceedsSampleGap(times: readonly number[]): boolean {
  const gaps: number[] = [];
  for (let i = 1; i < times.length; i++) {
    const gap = times[i] - times[i - 1];
    if (gap > MAX_COM_GAP_SECONDS) return true;
    gaps.push(gap);
  }
  if (gaps.length < 4) return false;
  const medianGap = [...gaps].sort((a, b) => a - b)[Math.floor(gaps.length / 2)];
  return gaps.some(gap => gap > Math.max(.05, medianGap * 2.5));
}
const median = (values: number[]) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];

// Independent experimental estimator, informed by the publicly described
// COM -> velocity -> gravity principle. No foot coordinates/contact timestamps
// or flight-time formula enter this calculation. A motion transition IS still
// estimated: continuity-constrained quadratics model propulsion and free fall.
// A fitted parabola alone cannot identify takeoff velocity.
export function analyzeCOM(samples: readonly COMSample[], baselineScale: number): COMAnalysis {
  const original = fitCOM(samples, baselineScale, false);
  // Preserve established long-jump results. Short windows are an alternative
  // physical model, not a way to accept an unstable fit from the original one.
  if (original.heightCm !== null) return original;
  const short = fitCOM(samples, baselineScale, true);
  return short.heightCm !== null ? short : original;
}

function fitCOM(samples: readonly COMSample[], baselineScale: number, short: boolean): COMAnalysis {
  const result: COMAnalysis = { version: short ? 'cmj-com-short-arc-v3-experimental' : 'cmj-com-velocity-v2-experimental', method: 'COM_VELOCITY_GRAVITY',
    comModel: COM_MODEL, status: 'UNAVAILABLE', heightCm: null, velocityMps: null,
    sensitivityCm: null, candidates: [], samples };
  const fail = (reason: string): COMAnalysis => ({ ...result, reason });
  if (!Number.isFinite(baselineScale) || baselineScale <= 0) return fail('INVALID_BASELINE');
  if (samples.length < 15) return fail('INSUFFICIENT_SAMPLES');
  if (samples.some((p, i) => !Number.isFinite(p.pts) || !Number.isInteger(p.frame) ||
    (i > 0 && (p.pts <= samples[i - 1].pts || p.frame <= samples[i - 1].frame)))) return fail('INVALID_TIMELINE');
  if (samples.some(p => [p.comX, p.comY, p.bodyScale].some(v => v !== null && !Number.isFinite(v)))) return fail('INVALID_COORDINATES');
  const usable = samples.filter(p => p.comY !== null && p.comX !== null && p.bodyScale !== null);
  if (usable.length < 15) return fail('COM_TRACKING_LOST');
  const xs = usable.map(p => p.comX!);
  if (Math.max(...xs) - Math.min(...xs) > baselineScale * .18) return fail('SUBJECT_DRIFT');
  const apexIndex = usable.reduce((best, p, i) => p.comY! < usable[best].comY! ? i : best, 0);
  const apex = usable[apexIndex];
  const before = usable.slice(0, apexIndex).filter(p => apex.pts - p.pts <= .8);
  if (before.length < 7 || samples.at(-1)!.pts - apex.pts < .16) return fail('APEX_NOT_BRACKETED');
  const bottom = before.reduce((a, b) => a.comY! > b.comY! ? a : b);
  if (bottom.comY! - apex.comY! < .06 * baselineScale) return fail('INSUFFICIENT_RISE');
  // Preserve every missing row, but test completeness on the observations that
  // determine velocity/scale (with a pre-bottom margin). An occluded wrist
  // during an earlier squat must not erase a later fully observed propulsion
  // and airborne arc. Never bridge missingness inside the measurement window.
  const measurement = samples.filter(p => p.pts >= bottom.pts - .05 && p.pts <= apex.pts + .16 + 1e-6);
  if (measurement.some(p => p.comY === null || p.comX === null || p.bodyScale === null)) return fail('COM_TRACKING_LOST');
  if (exceedsSampleGap(measurement.map(p => p.pts))) return fail('COM_SAMPLE_GAP');

  const usedRows = new Set<string>();
  for (const post of short ? [.06, .08, .10, .13, .16] : [.10, .13, .16]) {
    const arcRows = samples.filter(p => Math.abs(p.pts - apex.pts) <= post + 1e-6);
    const minimumSide = short ? 2 : 3;
    if (arcRows.length < (short ? 5 : 7) || arcRows.filter(p => p.pts < apex.pts).length < minimumSide ||
      arcRows.filter(p => p.pts > apex.pts).length < minimumSide) {
      // A short post-apex window can be unobservable at live frame rates
      // without the longer windows being under-sampled. Skip it.
      continue;
    }
    const local = samples.filter(p => p.pts >= bottom.pts - .05 && p.pts <= apex.pts + post + 1e-6);
    if (local.some(p => p.comY === null || p.comX === null || p.bodyScale === null) ||
      exceedsSampleGap(local.map(p => p.pts))) {
      if (short) continue;
      return fail('COM_TRACKING_LOST');
    }
    const arc = quadratic(arcRows.map(p => ({ t: p.pts - apex.pts, y: p.comY! })));
    if (!arc || arc.a <= 0 || Math.abs(arc.b / (2 * arc.a)) > .04 ||
      arc.rmse > baselineScale * .006 || arc.a * post * post < Math.max(.5, arc.rmse * 3)) {
      if (short) continue;
      return fail('GRAVITY_ARC_UNRESOLVED');
    }
    const rows = samples.filter(p => p.pts >= bottom.pts && p.pts <= apex.pts + post + 1e-6);
    const rowKey = rows.map(p => p.frame).join(',');
    if (short && usedRows.has(rowKey)) continue;
    usedRows.add(rowKey);
    const search = (observations: typeof rows): COMCandidate[] => {
    const fits: COMCandidate[] = [];
    // Same observations for every candidate transition: short candidate windows
    // must not win simply by omitting inconvenient propulsion observations.
    for (let boundary = Math.max(bottom.pts + .06, apex.pts - .6); boundary <= apex.pts - .08; boundary += .001) {
      const left = observations.filter(p => p.pts < boundary);
      if (left.length < (short ? 3 : 4) || observations.filter(p => p.pts >= boundary && p.pts < apex.pts).length < (short ? 3 : 4)) continue;
      if (short && (observations.length < 7 || observations.filter(p => p.pts >= boundary).length < 4 ||
        boundary > arcRows[0].pts)) continue;
      const design = observations.map(p => {
        const t = p.pts - apex.pts;
        return [1, t, t * t, Math.min(0, p.pts - boundary) ** 2];
      });
      const fit = solve(design, observations.map(p => p.comY!));
      if (!fit) continue;
      const [, b, a, d] = fit;
      // Down-positive y: free-fall curvature positive; propulsion acceleration
      // must differ observably from gravity. No peak-velocity substitution.
      if (a <= 0 || d >= -.3 * a || Math.abs(a / arc.a - 1) > .25) continue;
      const scale = G / (2 * a);
      const v = -(b + 2 * a * (boundary - apex.pts)) * scale;
      const fittedApex = apex.pts - b / (2 * a);
      if (v <= 0 || Math.abs(fittedApex - apex.pts) > .04 || baselineScale * scale < .5 || baselineScale * scale > 2.5) continue;
      const rmse = Math.sqrt(design.reduce((sum, row, i) => sum + (row.reduce((s, x, j) => s + x * fit[j], 0) - observations[i].comY!) ** 2, 0) / observations.length);
      if (rmse > baselineScale * .008) continue;
      const heightCm = v * v / (2 * G) * 100;
      fits.push({ postApexSeconds: post, transitionPts: boundary, apexPts: fittedApex,
        velocityMps: v, heightCm, metersPerUnit: scale, rmseUnits: rmse, arcRmseUnits: arc.rmse,
        transitionSensitivityCm: [heightCm, heightCm], resampledHeightsCm: [] });
    }
    fits.sort((a, b) => a.rmseUnits - b.rmseUnits);
    return fits;
    };
    const fits = search(rows);
    if (!fits.length) { if (short) continue; return fail('PROPULSION_TRANSITION_UNRESOLVED'); }
    const best = fits[0];
    // Temporal block-deletion stress test. The old fixed +0.15 px RMSE band
    // changed its meaning with image scale/sample density. Refit after removing
    // each of five interleaved 40 ms block groups instead. No confidence interval
    // or physical accuracy is implied; this tests dependence on observations.
    // For short, sparsely sampled arcs remove each observation individually.
    // Require every refit to succeed and retain the same numerical stability
    // bounds. Larger arcs keep the existing temporal-block test.
    let stable = true;
    for (let group = 0; group < (short ? rows.length : 5); group++) {
      const kept = short ? rows.filter((_, i) => i !== group)
        : rows.filter(p => Math.floor((p.pts - bottom.pts + 1e-8) / .04) % 5 !== group);
      const alternate = search(kept)[0];
      // Dropping one of a handful of live frames can leave the refit
      // underdetermined. That is not evidence the full fit is ambiguous.
      if (!alternate) { if (!short) { stable = false; break; } continue; }
      best.resampledHeightsCm.push(alternate.heightCm);
    }
    if (!stable || (short && best.resampledHeightsCm.length < 2)) { if (short) continue; return fail('PROPULSION_TRANSITION_AMBIGUOUS'); }
    const heights = [best.heightCm, ...best.resampledHeightsCm];
    best.transitionSensitivityCm = [Math.min(...heights), Math.max(...heights)];
    if (best.transitionSensitivityCm[1] - best.transitionSensitivityCm[0] > Math.max(3, best.heightCm * .15)) {
      result.candidates.push(best); return fail('PROPULSION_TRANSITION_AMBIGUOUS');
    }
    result.candidates.push(best);
  }
  if (!result.candidates.length) return fail(short ? 'INSUFFICIENT_SHORT_ARC_EVIDENCE' : 'INSUFFICIENT_ARC_SAMPLES');
  if (short && result.candidates.length < 1) return fail('INSUFFICIENT_SHORT_ARC_EVIDENCE');
  const heights = result.candidates.map(p => p.heightCm);
  const height = median(heights);
  const range: [number, number] = [Math.min(...result.candidates.map(p => p.transitionSensitivityCm[0])),
    Math.max(...result.candidates.map(p => p.transitionSensitivityCm[1]))];
  if (range[1] - range[0] > Math.max(4, height * .2)) return fail('FIT_WINDOWS_DISAGREE');
  return { ...result, status: 'EXPERIMENTAL_ESTIMATE', heightCm: height,
    velocityMps: Math.sqrt(2 * G * height / 100), sensitivityCm: range };
}

function solve(design: number[][], y: number[]): number[] | null {
  const n = design[0].length;
  const m = Array.from({ length: n }, (_, i) => [...Array.from({ length: n }, (_, j) =>
    design.reduce((sum, row) => sum + row[i] * row[j], 0)), design.reduce((sum, row, k) => sum + row[i] * y[k], 0)]);
  for (let i = 0; i < n; i++) {
    let pivot = i;
    for (let j = i + 1; j < n; j++) if (Math.abs(m[j][i]) > Math.abs(m[pivot][i])) pivot = j;
    [m[i], m[pivot]] = [m[pivot], m[i]];
    const divisor = m[i][i];
    if (Math.abs(divisor) < 1e-12) return null;
    m[i] = m[i].map(v => v / divisor);
    for (let j = 0; j < n; j++) if (j !== i) {
      const factor = m[j][i];
      m[j] = m[j].map((v, k) => v - factor * m[i][k]);
    }
  }
  const solution = m.map(row => row[n]);
  return solution.every(Number.isFinite) ? solution : null;
}
