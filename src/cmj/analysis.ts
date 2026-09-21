/** CMJ research only. Not a reproduction/validation of a published pipeline.
 * Image y points down. Actual presentation timestamps, never nominal FPS.
 * Local polynomial differentiation avoids twice differencing noisy coordinates.
 */
export const CMJ_VERSION = 'cmj-experimental-v0.1-not-validated';
export const G = 9.80665;
export interface Sample {
  frame: number; pts: number; hipY: number | null; footY: number | null;
  reason?: string;
}
export interface Fit { a: number; b: number; c: number; rmse: number; n: number }
export function quadratic(points: readonly { t: number; y: number }[]): Fit | null {
  if (points.length < 5 || points.some(p => !Number.isFinite(p.t) || !Number.isFinite(p.y))) return null;
  const m = Array.from({ length: 3 }, (_, i) => [
    ...Array.from({ length: 3 }, (_, j) => points.reduce((s, p) => s + p.t ** (i + j), 0)),
    points.reduce((s, p) => s + p.y * p.t ** i, 0),
  ]);
  for (let i = 0; i < 3; i++) {
    let pivot = i;
    for (let j = i + 1; j < 3; j++) if (Math.abs(m[j][i]) > Math.abs(m[pivot][i])) pivot = j;
    [m[i], m[pivot]] = [m[pivot], m[i]];
    const divisor = m[i][i];
    if (Math.abs(divisor) < 1e-12) return null;
    m[i] = m[i].map(v => v / divisor);
    for (let j = 0; j < 3; j++) if (j !== i) {
      const factor = m[j][i];
      m[j] = m[j].map((v, k) => v - factor * m[i][k]);
    }
  }
  const [c, b, a] = m.map(r => r[3]);
  const rmse = Math.sqrt(points.reduce((s, p) => s + (p.y - (a * p.t ** 2 + b * p.t + c)) ** 2, 0) / points.length);
  return { a, b, c, rmse, n: points.length };
}
export interface Candidate {
  halfWindowSeconds: number; takeoffFrame: number; landingFrame: number;
  takeoffPts: number; landingPts: number; flightSeconds: number; heightCm: number;
}
export interface Analysis {
  version: string; status: 'EXPERIMENTAL_ESTIMATE' | 'UNAVAILABLE'; reason?: string;
  candidates: Candidate[]; heightCm: number | null; sensitivityCm: [number, number] | null;
  apexFrame: number | null; gravityFits: (Fit & { halfWindowSeconds: number; metersPerPixel: number })[];
  missingFrameIndices: number[]; samples: readonly Sample[];
}
// These are exploratory signal-processing windows, NOT calibrated validity thresholds.
export const ACCELERATION_WINDOWS = [0.05, 0.075, 0.1] as const;
export function analyzeCMJ(samples: readonly Sample[], windows: readonly number[] = ACCELERATION_WINDOWS): Analysis {
  const result: Analysis = { version: CMJ_VERSION, status: 'UNAVAILABLE', candidates: [], heightCm: null,
    sensitivityCm: null, apexFrame: null, gravityFits: [], samples,
    missingFrameIndices: samples.filter(s => s.hipY === null || s.footY === null).map(s => s.frame) };
  const fail = (reason: string): Analysis => ({ ...result, reason });
  if (samples.length < 10) return fail('INSUFFICIENT_SAMPLES');
  if (samples.some((s, i) => !Number.isFinite(s.pts) || !Number.isInteger(s.frame) ||
    (i > 0 && (s.pts <= samples[i - 1].pts || s.frame <= samples[i - 1].frame)) ||
    [s.hipY, s.footY].some(y => y !== null && !Number.isFinite(y)))) return fail('INVALID_TIMELINE_OR_COORDINATES');
  const usable = samples.filter((s): s is Sample & { hipY: number; footY: number } => s.hipY !== null && s.footY !== null);
  if (usable.length < 10) return fail('INSUFFICIENT_POSE');
  const apex = usable.reduce((a, s) => s.hipY < a.hipY ? s : a);
  result.apexFrame = apex.frame;
  if (apex === usable[0] || apex === usable[usable.length - 1]) return fail('APEX_NOT_BRACKETED');
  const local = (center: number, window: number, key: 'hipY' | 'footY') => {
    const rows = samples.filter(s => Math.abs(s.pts - center) <= window + 1e-9);
    // Never bridge missing Pose observations with interpolation.
    if (rows.some(s => s[key] === null)) return null;
    return quadratic(rows.map(s => ({ t: s.pts - center, y: s[key]! })));
  };
  for (const window of [0.1, 0.15, 0.2]) {
    const fit = local(apex.pts, window, 'hipY');
    if (fit && fit.a > 0 && Math.abs(fit.b / (2 * fit.a)) < window)
      result.gravityFits.push({ ...fit, halfWindowSeconds: window, metersPerPixel: G / (2 * fit.a) });
  }
  for (const window of windows) {
    const acceleration = samples.flatMap(s => {
      if (s.pts - window < samples[0].pts || s.pts + window > samples[samples.length - 1].pts) return [];
      const fit = local(s.pts, window, 'footY');
      return fit ? [{ sample: s, acceleration: 2 * fit.a }] : [];
    });
    // Negative image acceleration peaks flank the airborne positive-curvature arc.
    const before = acceleration.filter(p => p.sample.pts < apex.pts - window);
    const after = acceleration.filter(p => p.sample.pts > apex.pts + window);
    if (!before.length || !after.length) continue;
    const first = before.reduce((a, b) => a.acceleration < b.acceleration ? a : b);
    const last = after.reduce((a, b) => a.acceleration < b.acceleration ? a : b);
    const arc = local(apex.pts, window, 'footY');
    if (first.acceleration >= 0 || last.acceleration >= 0 || !arc || arc.a <= 0) continue;
    // Missingness inside the proposed airborne interval makes this estimate unavailable.
    if (samples.some(s => s.pts >= first.sample.pts && s.pts <= last.sample.pts && (s.footY === null || s.hipY === null))) continue;
    const flightSeconds = last.sample.pts - first.sample.pts;
    result.candidates.push({ halfWindowSeconds: window, takeoffFrame: first.sample.frame,
      landingFrame: last.sample.frame, takeoffPts: first.sample.pts, landingPts: last.sample.pts,
      flightSeconds, heightCm: G * flightSeconds ** 2 / 8 * 100 });
  }
  if (!windows.length || result.candidates.length !== windows.length) return fail('AIRBORNE_INTERVAL_UNRESOLVED');
  const heights = result.candidates.map(c => c.heightCm).sort((a, b) => a - b);
  return { ...result, status: 'EXPERIMENTAL_ESTIMATE', heightCm: heights[Math.floor(heights.length / 2)], sensitivityCm: [heights[0], heights.at(-1)!] };
}
