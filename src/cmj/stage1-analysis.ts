import { G, quadratic } from './analysis';
import { analyzeCOM, type COMAnalysis } from './com-analysis';
import type { COMSample } from './center-of-mass';

/** Frozen engineering policy, NOT a calibrated confidence model. */
export const STAGE1_POLICY = Object.freeze({
  version: 'cmj-recorded-foot-apex-v2', protocolVersion: 'cmj-stage1-20260929-v2',
  baselineSeconds: .2, minimumBaselineSamples: 5, minimumBaselineCoverage: .8,
  // v2: the sample-count-dependent max-min spread gate was removed; the robust
  // (MAD) noise limit below is the only floor-noise gate.
  groundPaddingPixels: 1, clearGapPixels: 2, maximumGroundNoisePixels: 3,
  maximumEdgeBandPixels: 8, airPersistenceSeconds: .025,
  maximumSourceGapSeconds: .05, minimumFlightSeconds: .12,
  apexWindowsSeconds: [.06, .10, .14] as readonly number[],
  minimumApexRefitSamples: 5, minimumApexRefits: 2,
  pointWidthCm: 4, rangeWidthCm: 8,
});
export interface SolePoint { x: number; y: number; visibility: number }
export interface SoleObservation {
  /** Lower/upper raster sole-edge y, in 960-high-image units, not pose y. */
  edge: [number, number] | null;
  reason?: string; toe?: SolePoint; heel?: SolePoint;
}
export interface Stage1Observation extends COMSample { feet: [SoleObservation, SoleObservation] }
export interface TimeBracket { lower: number; upper: number; frames: [number, number]; source: string }
export interface HeightEstimate {
  method: 'A' | 'B'; status: 'POINT' | 'RANGE' | 'HOLD';
  heightCm: number | null; rangeCm: [number, number] | null; reason: string | null;
}
export interface Stage1Analysis {
  version: string; protocolVersion: string; stage: 'RECORDING_ONLY';
  legacy: COMAnalysis; takeoff: TimeBracket | null; landing: TimeBracket | null; apex: TimeBracket | null;
  B: HeightEstimate; A: HeightEstimate; reason: string | null; diagnostics: Record<string, unknown>;
}
const median = (xs: readonly number[]) => {
  const s = [...xs].sort((a, b) => a - b), n = s.length;
  return n ? (s[Math.floor((n - 1) / 2)] + s[Math.floor(n / 2)]) / 2 : NaN;
};
const hold = (method: 'A' | 'B', reason: string): HeightEstimate =>
  ({ method, status: 'HOLD', heightCm: null, rangeCm: null, reason });
const validBand = (r: readonly number[] | null | undefined): r is [number, number] =>
  !!r && r.length === 2 && r.every(Number.isFinite) && r[0] <= r[1];

/** Interval arithmetic, not a distribution, confidence interval or accuracy guarantee.
 * A RANGE/HOLD never exposes its midpoint as the main height. */
export function heightFromBrackets(method: 'A' | 'B', start: TimeBracket | null, end: TimeBracket | null): HeightEstimate {
  if (!start || !end) return hold(method, 'TIME_BRACKET_UNAVAILABLE');
  if (![start.lower, start.upper, end.lower, end.upper].every(Number.isFinite) ||
      start.lower > start.upper || end.lower > end.upper || start.upper >= end.lower)
    return hold(method, 'INVALID_EVENT_ORDER');
  const factor = method === 'B' ? 50 * G : 12.5 * G;
  const rangeCm: [number, number] = [factor * (end.lower - start.upper) ** 2, factor * (end.upper - start.lower) ** 2];
  const width = rangeCm[1] - rangeCm[0];
  const status = width <= STAGE1_POLICY.pointWidthCm ? 'POINT' : width <= STAGE1_POLICY.rangeWidthCm ? 'RANGE' : 'HOLD';
  return { method, status, rangeCm, heightCm: status === 'POINT' ? (rangeCm[0] + rangeCm[1]) / 2 : null,
    reason: status === 'HOLD' ? 'HEIGHT_BAND_TOO_WIDE' : null };
}

type FootState = 'FLOOR_COMPATIBLE' | 'CLEAR_AIR' | 'UNKNOWN';
function baseline(rows: readonly Stage1Observation[], side: 0 | 1): [number, number] | null {
  const early = rows.filter(r => r.pts - rows[0].pts <= STAGE1_POLICY.baselineSeconds + 1e-9);
  const edges = early.map(r => r.feet[side].edge).filter(validBand);
  if (early.length < STAGE1_POLICY.minimumBaselineSamples || edges.length / early.length < STAGE1_POLICY.minimumBaselineCoverage ||
      early.at(-1)!.pts - early[0].pts < STAGE1_POLICY.baselineSeconds * .75) return null;
  const centers = edges.map(e => (e[0] + e[1]) / 2), center = median(centers);
  const noise = 1.4826 * median(centers.map(y => Math.abs(y - center)));
  // A max-min range grows with the number of frames, so v1 rejected 240fps
  // floors that it accepted at 30fps. MAD is sample-count invariant.
  if (noise > STAGE1_POLICY.maximumGroundNoisePixels) return null;
  const pad = STAGE1_POLICY.groundPaddingPixels + noise;
  return [median(edges.map(e => e[0])) - pad, median(edges.map(e => e[1])) + pad];
}
function state(edge: SoleObservation, floor: [number, number]): FootState {
  const e = edge.edge;
  if (!validBand(e) || e[1] - e[0] > STAGE1_POLICY.maximumEdgeBandPixels) return 'UNKNOWN';
  if (e[1] < floor[0] - STAGE1_POLICY.clearGapPixels) return 'CLEAR_AIR';
  if (e[0] <= floor[1] && e[1] >= floor[0]) return 'FLOOR_COMPATIBLE';
  return 'UNKNOWN';
}
function continuous(rows: readonly Stage1Observation[], a: number, b: number): boolean {
  for (let k = a + 1; k <= b; k++) if (rows[k].frame !== rows[k - 1].frame + 1 ||
    rows[k].pts - rows[k - 1].pts > STAGE1_POLICY.maximumSourceGapSeconds + 1e-9) return false;
  return true;
}
function airRun(rows: readonly Stage1Observation[], states: FootState[], index: number, direction: 1 | -1): boolean {
  let k = index;
  while (k >= 0 && k < rows.length && states[k] === 'CLEAR_AIR') {
    if (Math.abs(rows[k].pts - rows[index].pts) >= STAGE1_POLICY.airPersistenceSeconds) return true;
    const next = k + direction;
    if (next < 0 || next >= rows.length || !continuous(rows, Math.min(k, next), Math.max(k, next))) break;
    k = next;
  }
  return false;
}
function footBoundary(rows: readonly Stage1Observation[], states: FootState[], apexIndex: number, kind: 'TAKEOFF' | 'LANDING'): TimeBracket | null {
  if (kind === 'TAKEOFF') {
    for (let i = apexIndex - 1; i >= 1; i--) {
      if (states[i] !== 'FLOOR_COMPATIBLE' || states[i - 1] !== 'FLOOR_COMPATIBLE') continue;
      const j = rows.findIndex((_, index) => index > i && index < apexIndex && airRun(rows, states, index, 1));
      if (j < 0 || !continuous(rows, i - 1, j)) return null;
      // Include the earlier of two compatible support images. A floor band
      // does not prove contact: a sole already 1-3px airborne is still inside
      // the padded band, so starting at the later image leaves true takeoff
      // outside the bracket at 240fps (tried in v2 drafting, rejected).
      return { lower: rows[i - 1].pts, upper: rows[j].pts, frames: [rows[i - 1].frame, rows[j].frame], source: 'SOLE_SUPPORT_TO_CLEAR_AIR' };
    }
  } else {
    for (let i = apexIndex + 1; i < rows.length - 1; i++) {
      if (states[i] !== 'FLOOR_COMPATIBLE' || states[i + 1] !== 'FLOOR_COMPATIBLE') continue;
      let j = i - 1;
      while (j > apexIndex && !airRun(rows, states, j, -1)) j--;
      if (j <= apexIndex || !continuous(rows, j, i + 1)) return null;
      return { lower: rows[j].pts, upper: rows[i + 1].pts, frames: [rows[j].frame, rows[i + 1].frame], source: 'CLEAR_AIR_TO_SOLE_SUPPORT' };
    }
  }
  return null;
}
function combine(a: TimeBracket, b: TimeBracket, kind: 'TAKEOFF' | 'LANDING'): TimeBracket {
  const choose = kind === 'TAKEOFF' ? Math.max : Math.min;
  const lower = choose(a.lower, b.lower), upper = choose(a.upper, b.upper);
  return { lower, upper, frames: [a.lower === lower ? a.frames[0] : b.frames[0], a.upper === upper ? a.frames[1] : b.frames[1]],
    source: kind === 'TAKEOFF' ? 'LAST_OF_TWO_SOLES' : 'FIRST_OF_TWO_SOLES' };
}

/** The apex uses only confirmed-air observations, no propulsion spline or
 * landing symmetry. Multiple windows and block deletion expose fit sensitivity;
 * one full source sample interval is retained even on a perfect parabola. */
function fitApex(rows: readonly Stage1Observation[], states: [FootState[], FootState[]], apexIndex: number,
  takeoff: TimeBracket, scale: number): { bracket: TimeBracket | null; reason: string | null; fits: unknown[] } {
  const seed = rows[apexIndex].pts, fits: { halfWindow: number; pts: number; a: number; rmse: number; count: number }[] = [];
  const times: number[] = [], gaps: number[] = [], used = new Set<string>();
  for (const half of STAGE1_POLICY.apexWindowsSeconds) {
    const indices = rows.flatMap((r, i) => Math.abs(r.pts - seed) <= half + 1e-9 ? [i] : []);
    if (!indices.length) continue;
    const local = indices.map(i => rows[i]), key = local.map(r => r.frame).join(',');
    if (used.has(key) || local.length < 7 || local.filter(r => r.pts < seed).length < 3 || local.filter(r => r.pts > seed).length < 3) continue;
    if (local[0].pts <= takeoff.upper || indices.some(i => states[0][i] !== 'CLEAR_AIR' || states[1][i] !== 'CLEAR_AIR' || rows[i].comY === null)) continue;
    if (!continuous(rows, indices[0], indices.at(-1)!)) return { bracket: null, reason: 'APEX_SOURCE_GAP', fits };
    used.add(key);
    const evaluate = (samples: typeof local) => {
      const q = quadratic(samples.map(r => ({ t: r.pts - seed, y: r.comY! })));
      if (!q || q.a <= 0 || q.rmse > scale * .004 || q.a * half ** 2 < Math.max(1, 3 * q.rmse)) return null;
      const pts = seed - q.b / (2 * q.a);
      if (pts <= samples[0].pts || pts >= samples.at(-1)!.pts || Math.abs(pts - seed) > .04) return null;
      return { pts, a: q.a, rmse: q.rmse };
    };
    const q = evaluate(local);
    if (!q) return { bracket: null, reason: 'NON_BALLISTIC_OR_UNSTABLE_APEX', fits };
    fits.push({ halfWindow: half, ...q, count: local.length }); times.push(q.pts);
    let refits = 0;
    for (let group = 0; group < 3; group++) {
      const reduced = local.filter((_, i) => i % 3 !== group);
      // Too few points to refit is not evidence of instability (v1 held every
      // 30/60fps jump here). A refit that has enough points and fails still holds.
      if (reduced.length < STAGE1_POLICY.minimumApexRefitSamples) continue;
      const alternative = evaluate(reduced);
      if (!alternative) return { bracket: null, reason: 'APEX_RESAMPLING_UNRESOLVED', fits };
      times.push(alternative.pts); refits++;
    }
    if (refits < STAGE1_POLICY.minimumApexRefits) return { bracket: null, reason: 'APEX_RESAMPLING_UNRESOLVED', fits };
    for (let i = 1; i < local.length; i++) gaps.push(local[i].pts - local[i - 1].pts);
  }
  if (fits.length < 2) return { bracket: null, reason: 'INSUFFICIENT_AIRBORNE_APEX_WINDOWS', fits };
  const margin = Math.max(...gaps) / 2, lower = Math.min(...times) - margin, upper = Math.max(...times) + margin;
  const left = [...rows].reverse().find(r => r.pts <= lower), right = rows.find(r => r.pts >= upper);
  if (!left || !right || lower <= takeoff.upper) return { bracket: null, reason: 'APEX_NOT_BRACKETED', fits };
  return { bracket: { lower, upper, frames: [left.frame, right.frame], source: 'FLIGHT_ARC_WINDOWS_PLUS_SAMPLE_INTERVAL' }, reason: null, fits };
}

/** One CMJ per recording; neither truth labels nor expected height are inputs.
 * Optional legacy is only a transparent evaluation cache for unchanged COM rows. */
export function analyzeStage1(rows: readonly Stage1Observation[], options: { legacy?: COMAnalysis } = {}): Stage1Analysis {
  const scale = median(rows.flatMap(r => r.bodyScale !== null && Number.isFinite(r.bodyScale) && r.bodyScale > 0 ? [r.bodyScale] : []));
  const legacy = options.legacy ?? analyzeCOM(rows, scale);
  const result: Stage1Analysis = { version: STAGE1_POLICY.version, protocolVersion: STAGE1_POLICY.protocolVersion,
    stage: 'RECORDING_ONLY', legacy, takeoff: null, landing: null, apex: null,
    B: hold('B', 'NOT_EVALUATED'), A: hold('A', 'NOT_EVALUATED'), reason: null, diagnostics: { policy: STAGE1_POLICY } };
  const fail = (reason: string): Stage1Analysis => ({ ...result, reason, B: hold('B', reason), A: hold('A', reason) });
  if (rows.length < 15) return fail('INSUFFICIENT_RECORDING');
  if (rows.some((r, i) => !Number.isFinite(r.pts) || !Number.isInteger(r.frame) || !r.feet || r.feet.length !== 2 ||
    (i > 0 && (r.pts <= rows[i - 1].pts || r.frame <= rows[i - 1].frame)))) return fail('INVALID_TIMELINE');
  if (!Number.isFinite(scale) || rows.some(r => [r.comX, r.comY, r.bodyScale].some(v => v !== null && !Number.isFinite(v)))) return fail('INVALID_COM_COORDINATES');
  const grounds: [[number, number] | null, [number, number] | null] = [baseline(rows, 0), baseline(rows, 1)];
  result.diagnostics.groundBands = grounds;
  if (!grounds[0] || !grounds[1]) return fail('SOLE_BASELINE_UNRESOLVED');
  const initial = rows.filter(r => r.pts - rows[0].pts <= STAGE1_POLICY.baselineSeconds).flatMap(r => r.comY === null ? [] : [r.comY]);
  if (initial.length < STAGE1_POLICY.minimumBaselineSamples || Math.max(...initial) - Math.min(...initial) > scale * .03) return fail('STANDING_BASELINE_UNSTABLE');
  const states: [FootState[], FootState[]] = [rows.map(r => state(r.feet[0], grounds[0]!)), rows.map(r => state(r.feet[1], grounds[1]!))];
  result.diagnostics.footStateCounts = states.map(ss => Object.fromEntries(['FLOOR_COMPATIBLE', 'CLEAR_AIR', 'UNKNOWN'].map(s => [s, ss.filter(t => t === s).length])));
  const air = rows.flatMap((r, i) => r.comY !== null && states[0][i] === 'CLEAR_AIR' && states[1][i] === 'CLEAR_AIR' ? [i] : []);
  if (!air.length) return fail('NO_BILATERAL_AIR_EVIDENCE');
  const apexIndex = air.reduce((a, b) => rows[a].comY! < rows[b].comY! ? a : b);
  if (median(initial) - rows[apexIndex].comY! < .02 * scale) return fail('NO_COM_RISE');
  const takeoffs = ([0, 1] as const).map(side => footBoundary(rows, states[side], apexIndex, 'TAKEOFF'));
  const landings = ([0, 1] as const).map(side => footBoundary(rows, states[side], apexIndex, 'LANDING'));
  result.diagnostics.sideTakeoffs = takeoffs; result.diagnostics.sideLandings = landings;
  if (!takeoffs[0] || !takeoffs[1]) return fail('TAKEOFF_BRACKET_UNRESOLVED');
  result.takeoff = combine(takeoffs[0], takeoffs[1], 'TAKEOFF');
  if (landings[0] && landings[1]) result.landing = combine(landings[0], landings[1], 'LANDING');
  // A hidden second foot may have touched first; do not invent landing from one foot.
  const end = result.landing?.upper ?? rows[apexIndex].pts + .14;
  const movement = rows.filter(r => r.pts >= result.takeoff!.lower && r.pts <= end);
  if (movement.some(r => r.comX === null) || Math.max(...movement.map(r => r.comX!)) - Math.min(...movement.map(r => r.comX!)) > .12 * scale)
    return fail('COM_TRACKING_OR_HORIZONTAL_DRIFT');
  const extraAir = air.some(i => (rows[i].pts < result.takeoff!.lower - .1 || (result.landing && rows[i].pts > result.landing.upper + .1)) &&
    airRun(rows, states[0], i, 1) && airRun(rows, states[1], i, 1));
  if (extraAir) return fail('MULTIPLE_JUMPS_OR_FALSE_AIR');
  if (result.landing && result.landing.lower - result.takeoff.upper < STAGE1_POLICY.minimumFlightSeconds) return fail('AIR_INTERVAL_TOO_SHORT');
  const apex = fitApex(rows, states, apexIndex, result.takeoff, scale);
  result.apex = apex.bracket; result.diagnostics.apexFits = apex.fits;
  result.B = apex.bracket ? heightFromBrackets('B', result.takeoff, apex.bracket) : hold('B', apex.reason!);
  result.A = result.landing ? heightFromBrackets('A', result.takeoff, result.landing) : hold('A', 'LANDING_BRACKET_UNRESOLVED');
  result.reason = result.B.reason;
  return result;
}
