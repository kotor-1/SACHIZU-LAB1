import { G, quadratic } from './analysis';
import { analyzeCOM, exceedsSampleGap, type COMAnalysis } from './com-analysis';
import { COM_MODEL, type COMSample } from './center-of-mass';

/** Takeoff/landing from the toe trajectories, apex from the airborne COM arc.
 * Height = g/2 * (apex - takeoff)^2. No reference heights, user height or
 * fitted coefficients enter the calculation.
 *
 * The toe (the last point in contact) stays on the floor through heel raise,
 * so a heel lift is not mistaken for takeoff. Each departure/arrival is timed
 * by fitting "flat floor, then linear rise" across neighbouring frames, which
 * resolves time between frames. On 240fps Full-model recordings a free
 * linear+quadratic onset placed takeoff within 1-4 ms of the linear model and
 * a zero-velocity (quadratic-only) onset fitted 2-10x worse; decimating the
 * same videos to 30-120fps moved heights by under ~1.5 cm. This is
 * consistency evidence, not a measured accuracy. */
export const TOE_FLIGHT = Object.freeze({
  version: 'cmj-toe-flight-v2-experimental' as const,
  // Windows widen with the observed frame interval so every cadence keeps
  // about three samples on the airborne side of the corner. The floor side
  // (before takeoff / after landing) is longer: the toe is flat there, and a
  // noisy toe point makes the first "clearly lifted" frame late. With only the
  // short window, 30 fps and 4-8 units of toe noise left one or two floor
  // frames and pulled takeoff late / landing early, down to -18 cm.
  hingeHalfWindowSeconds: .08, searchHalfWidthSeconds: .05, gridSeconds: .0005,
  hingeHalfWindowIntervals: 3, searchHalfWidthIntervals: 2,
  floorWindowSeconds: .2, floorWindowIntervals: 6, floorSearchSeconds: .12, floorSearchIntervals: 4,
  minimumSideSamples: 2, minimumToeRisePixels: 5, toeRiseNoiseMultiplier: 4,
  // A hole near takeoff/landing hides the event itself. Phones were observed
  // at up to ~41 ms and desktop Full-model live at up to ~65 ms between frames.
  maximumEventGapSeconds: .1, maximumMedianIntervalSeconds: .06,
  airMarginSeconds: .03, minimumArcSamples: 5,
  flightSeconds: [.12, 1] as const, apexFlightFraction: [.35, .65] as const,
  maximumArcRmseScale: .006, bodyScaleMeters: [.5, 2.5] as const,
});

export interface ToeFlightDiagnostics {
  floorY: [number, number] | null; toeNoise: [number, number] | null;
  sideTakeoffs: [number | null, number | null]; sideLandings: [number | null, number | null];
  takeoffPts: number | null; apexPts: number | null; landingPts: number | null;
  flightTimeHeightCm: number | null; arcRmseUnits: number | null; metersPerUnit: number | null;
  legacyHeightCm: number | null; legacyReason: string | null;
}

const median = (xs: readonly number[]) => {
  const s = [...xs].sort((a, b) => a - b), n = s.length;
  return n ? (s[Math.floor((n - 1) / 2)] + s[Math.floor(n / 2)]) / 2 : NaN;
};
const toe = (p: COMSample, side: 0 | 1) => p.comY !== null && p.toeY ? p.toeY[side] : null;

/** "Flat at the floor, then a straight rise" with the corner at t0. dir=+1 is
 * takeoff (rise after t0), dir=-1 landing (rise before t0). Least squares on
 * a 0.5 ms grid; returns null when the corner is not bracketed by data. */
function hingeTime(samples: readonly COMSample[], side: 0 | 1, coarse: number, dir: 1 | -1, interval: number): number | null {
  const air = Math.max(TOE_FLIGHT.hingeHalfWindowSeconds, TOE_FLIGHT.hingeHalfWindowIntervals * interval);
  const floor = Math.max(TOE_FLIGHT.floorWindowSeconds, TOE_FLIGHT.floorWindowIntervals * interval);
  const airSearch = Math.max(TOE_FLIGHT.searchHalfWidthSeconds, TOE_FLIGHT.searchHalfWidthIntervals * interval);
  const floorSearch = Math.max(TOE_FLIGHT.floorSearchSeconds, TOE_FLIGHT.floorSearchIntervals * interval);
  // dir=+1 (takeoff): floor before the corner; dir=-1 (landing): floor after it.
  const [from, to] = dir === 1 ? [coarse - floor, coarse + air] : [coarse - air, coarse + floor];
  const [low, high] = dir === 1 ? [coarse - floorSearch, coarse + airSearch] : [coarse - airSearch, coarse + floorSearch];
  const rows = samples.filter(p => p.pts >= from && p.pts <= to && toe(p, side) !== null);
  if (exceedsSampleGap(rows.map(p => p.pts))) return null;
  let best: { t0: number; sse: number } | null = null;
  for (let t0 = low; t0 <= high; t0 += TOE_FLIGHT.gridSeconds) {
    const s = rows.map(p => Math.max(0, dir * (p.pts - t0)));
    const moving = s.filter(v => v > 0).length;
    if (moving < TOE_FLIGHT.minimumSideSamples || s.length - moving < TOE_FLIGHT.minimumSideSamples) continue;
    // Two-parameter least squares: y = floor + slope * s.
    const n = s.length, sy = rows.reduce((a, p) => a + toe(p, side)!, 0), ss = s.reduce((a, v) => a + v, 0);
    const sss = s.reduce((a, v) => a + v * v, 0), ssy = rows.reduce((a, p, i) => a + s[i] * toe(p, side)!, 0);
    const det = n * sss - ss * ss;
    if (Math.abs(det) < 1e-12) continue;
    const slope = (n * ssy - ss * sy) / det, floor = (sy - slope * ss) / n;
    if (slope >= 0) continue; // image y points down: the toe must rise away from the floor
    const sse = rows.reduce((a, p, i) => a + (floor + slope * s[i] - toe(p, side)!) ** 2, 0);
    if (!best || sse < best.sse) best = { t0, sse };
  }
  // A corner on the edge of the search range is not bracketed by the data.
  return best && best.t0 > low + TOE_FLIGHT.gridSeconds / 2 && best.t0 < high - TOE_FLIGHT.gridSeconds / 2 ? best.t0 : null;
}

export function analyzeToeFlight(samples: readonly COMSample[], baselineScale: number): COMAnalysis & { toeFlight: ToeFlightDiagnostics } {
  const legacy = analyzeCOM(samples, baselineScale);
  const diagnostics: ToeFlightDiagnostics = { floorY: null, toeNoise: null, sideTakeoffs: [null, null], sideLandings: [null, null],
    takeoffPts: null, apexPts: null, landingPts: null, flightTimeHeightCm: null, arcRmseUnits: null, metersPerUnit: null,
    legacyHeightCm: legacy.heightCm, legacyReason: legacy.reason ?? null };
  const result = { version: TOE_FLIGHT.version, method: 'TOE_TAKEOFF_COM_APEX' as const, comModel: COM_MODEL,
    status: 'UNAVAILABLE' as const, heightCm: null, velocityMps: null, sensitivityCm: null, candidates: [], samples, toeFlight: diagnostics };
  const fail = (reason: string) => ({ ...result, reason });
  if (!Number.isFinite(baselineScale) || baselineScale <= 0) return fail('INVALID_BASELINE');
  if (samples.some((p, i) => !Number.isFinite(p.pts) || (i > 0 && p.pts <= samples[i - 1].pts))) return fail('INVALID_TIMELINE');
  // Toe timing needs neighbouring frames on both sides of each event.
  const intervals = samples.slice(1).map((p, i) => p.pts - samples[i].pts);
  const interval = median(intervals);
  if (intervals.length && interval > TOE_FLIGHT.maximumMedianIntervalSeconds) return fail('FRAME_RATE_TOO_LOW');
  const usable = samples.filter(p => p.comY !== null && p.toeY);
  if (usable.length < 15) return fail('INSUFFICIENT_SAMPLES');
  const apexRow = usable.reduce((a, p) => p.comY! < a.comY! ? p : a);
  // Standing and countermovement keep the toes on the floor: before the COM
  // starts its final rise, every toe observation is a floor observation.
  const bottom = usable.filter(p => p.pts < apexRow.pts).reduce((a, p) => p.comY! > a.comY! ? p : a, apexRow);
  const floorRows = usable.filter(p => p.pts <= bottom.pts);
  if (floorRows.length < 5) return fail('TOE_FLOOR_UNRESOLVED');
  const floor = ([0, 1] as const).map(side => median(floorRows.map(p => p.toeY![side]))) as [number, number];
  const noise = ([0, 1] as const).map(side => 1.4826 * median(floorRows.map(p => Math.abs(p.toeY![side] - floor[side])))) as [number, number];
  diagnostics.floorY = floor; diagnostics.toeNoise = noise;
  for (const side of [0, 1] as const) {
    const lifted = (p: COMSample) => floor[side] - p.toeY![side] > Math.max(TOE_FLIGHT.minimumToeRisePixels, TOE_FLIGHT.toeRiseNoiseMultiplier * noise[side]);
    if (!lifted(apexRow)) return fail('TOE_NOT_AIRBORNE_AT_APEX');
    const index = usable.indexOf(apexRow);
    let i = index; while (i > 0 && lifted(usable[i])) i--;
    let j = index; while (j < usable.length - 1 && lifted(usable[j])) j++;
    if (lifted(usable[i]) || lifted(usable[j])) return fail('TOE_CONTACT_NOT_OBSERVED');
    const span = samples.filter(p => p.pts >= usable[i].pts - TOE_FLIGHT.hingeHalfWindowSeconds && p.pts <= usable[j].pts + TOE_FLIGHT.hingeHalfWindowSeconds);
    if (span.some((p, k) => k > 0 && p.pts - span[k - 1].pts > TOE_FLIGHT.maximumEventGapSeconds)) return fail('COM_SAMPLE_GAP');
    diagnostics.sideTakeoffs[side] = hingeTime(samples, side, usable[i].pts, 1, interval);
    diagnostics.sideLandings[side] = hingeTime(samples, side, usable[j].pts, -1, interval);
  }
  const [lt, rt] = diagnostics.sideTakeoffs, [ll, rl] = diagnostics.sideLandings;
  if (lt === null || rt === null) return fail('TOE_TAKEOFF_UNRESOLVED');
  if (ll === null || rl === null) return fail('TOE_LANDING_UNRESOLVED');
  // Whole-body takeoff is the later foot; landing is the earlier foot.
  const takeoff = Math.max(lt, rt), landing = Math.min(ll, rl);
  diagnostics.takeoffPts = takeoff; diagnostics.landingPts = landing;
  if (landing - takeoff < TOE_FLIGHT.flightSeconds[0] || landing - takeoff > TOE_FLIGHT.flightSeconds[1]) return fail('FLIGHT_TIME_IMPLAUSIBLE');
  const air = samples.filter(p => p.pts > takeoff + TOE_FLIGHT.airMarginSeconds && p.pts < landing - TOE_FLIGHT.airMarginSeconds);
  if (air.some(p => p.comY === null) || exceedsSampleGap(air.map(p => p.pts))) return fail('COM_TRACKING_LOST');
  if (air.length < TOE_FLIGHT.minimumArcSamples) return fail('INSUFFICIENT_ARC_SAMPLES');
  const arc = quadratic(air.map(p => ({ t: p.pts - apexRow.pts, y: p.comY! })));
  if (!arc || arc.a <= 0 || arc.rmse > baselineScale * TOE_FLIGHT.maximumArcRmseScale) return fail('GRAVITY_ARC_UNRESOLVED');
  const apex = apexRow.pts - arc.b / (2 * arc.a), metersPerUnit = G / (2 * arc.a);
  diagnostics.apexPts = apex; diagnostics.arcRmseUnits = arc.rmse; diagnostics.metersPerUnit = metersPerUnit;
  if (air.filter(p => p.pts < apex).length < 2 || air.filter(p => p.pts > apex).length < 2) return fail('APEX_NOT_BRACKETED');
  // Takeoff and landing COM heights are similar, so the apex sits near the
  // middle of the flight. A mistimed toe event breaks this.
  const fraction = (apex - takeoff) / (landing - takeoff);
  if (fraction < TOE_FLIGHT.apexFlightFraction[0] || fraction > TOE_FLIGHT.apexFlightFraction[1]) return fail('TOE_EVENTS_INCONSISTENT_WITH_ARC');
  const bodyMeters = baselineScale * metersPerUnit;
  if (bodyMeters < TOE_FLIGHT.bodyScaleMeters[0] || bodyMeters > TOE_FLIGHT.bodyScaleMeters[1]) return fail('GRAVITY_SCALE_IMPLAUSIBLE');
  const velocityMps = G * (apex - takeoff), heightCm = velocityMps ** 2 / (2 * G) * 100;
  diagnostics.flightTimeHeightCm = 12.5 * G * (landing - takeoff) ** 2;
  return { ...result, status: 'EXPERIMENTAL_ESTIMATE' as const, heightCm, velocityMps, reason: undefined };
}
