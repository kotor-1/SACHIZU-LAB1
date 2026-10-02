import type { NormalizedLandmark } from '@mediapipe/tasks-vision';
import { gapLimit } from './frame-interval';
import { brightFootEdge, darkFootEdge, type FootBox, type GrayImage } from './pixel-foot';
import { footBoxesForPair } from './foot-boxes';
import { fractionRSI } from './hybrid-physics';
import type { ToeCycleReport } from './toe-cycle-research';

/** Shoe-bottom timing for the toe-cycle RJ model.
 *
 * The toe template places each takeoff where the toe LANDMARK starts rising.
 * On 40 reviewed takeoffs (4 recordings) that was 0.5-2 frames before the
 * shoe visibly left the turf: the foot rolls onto the shoe tip first. The
 * bottom edge of the shoe silhouette rolls up slowly (about 2 px/frame at
 * 120 fps) and then leaves fast (4-6 px/frame). A takeoff is therefore the
 * first FAST upward step that carries on into the air; a landing is the same
 * rule with time reversed. Thresholds are in leg lengths per second and were
 * chosen from those blind visual reviews, NOT from reference RSI values.
 *
 * v2: under an overhead light on a bright floor (concrete, at night) each shoe
 * casts a dark shadow directly below it. Near the floor the shadow merges with
 * the shoe silhouette, so its "bottom" reaches the floor 4-7 frames before the
 * visible landing and stays there 4-6 frames after the takeoff (16 reviewed
 * events, 2 recordings; the toe template matched the video within ~1 frame).
 * On the turf review set the sole and template events differed by a median of
 * about 1 frame (95th percentile ~3 frames). When the recording's median
 * difference exceeds 25 ms at landing or takeoff, the silhouette is treated as
 * floor-attached and the headline falls back to the toe template's events.
 * With fewer than three shoe-measured cycles the headline also uses the
 * template, labelled (on turf it read +0.16 above PUSH on average). */
export const SOLE_CONTACT_SETTINGS = Object.freeze({
  version: 'rj-sole-contact-v2-experimental' as const,
  imageHeight: 960,
  minimumToeVisibility: .5, minimumHeelVisibility: .35,
  liftSpeedLegsPerSecond: 1.3, minimumTravelLegs: .05,
  continuationSamples: 6, monotoneSteps: 3, reboundTolerancePixels: 1,
  searchBeyondModelSeconds: .1, maximumShiftFromModelSeconds: .06,
  maximumGapSeconds: .02, minimumContactSeconds: .06, maximumContactSeconds: .6,
  minimumCycles: 3, maximumFloorAttachedSeconds: .025,
});

export interface SoleFoot { dark: number | null; bright: number | null }
/** One source frame. Values are shoe-bottom rows in a 960-pixel-high image,
 * for the dark-shoe and light-shoe silhouette paths; null when not resolved. */
export interface SoleFrame { frame: number; pts: number; feet: [SoleFoot | null, SoleFoot | null] }
export type SolePolarity = 'dark' | 'bright';

const median = (values: readonly number[]) => {
  const s = [...values].sort((a, b) => a - b), n = s.length;
  return n ? (s[(n - 1) >> 1] + s[n >> 1]) / 2 : NaN;
};
const usable = (p?: NormalizedLandmark, minimum = .5) => !!p && Number.isFinite(p.x) && Number.isFinite(p.y) &&
  p.x > 0 && p.x < 1 && p.y > 0 && p.y < 1 && Number.isFinite(p.visibility) && p.visibility >= minimum;

/** Shoe search boxes for the selected subject, in pixels of a width x 960 image. */
export function soleBoxes(pose: readonly NormalizedLandmark[] | null, width: number, height = SOLE_CONTACT_SETTINGS.imageHeight): [FootBox | null, FootBox | null] {
  if (!pose) return [null, null];
  const ok = (side: 0 | 1) => usable(pose[31 + side], SOLE_CONTACT_SETTINGS.minimumToeVisibility) &&
    usable(pose[29 + side], SOLE_CONTACT_SETTINGS.minimumHeelVisibility);
  const centers = ([0, 1] as const).map(s => ok(s) ? (pose[29 + s].x + pose[31 + s].x) / 2 * width : NaN) as [number, number];
  const bottoms = ([0, 1] as const).map(s => ok(s) ? Math.max(pose[29 + s].y, pose[31 + s].y) * height : NaN) as [number, number];
  return footBoxesForPair(centers, bottoms);
}

/** `image` may be a crop of the full frame starting at (offsetX, offsetY). */
export function measureSoleBoxes(image: GrayImage, boxes: readonly [FootBox | null, FootBox | null], offsetX = 0, offsetY = 0): [SoleFoot | null, SoleFoot | null] {
  return boxes.map(box => {
    if (!box) return null;
    const local = { ...box, x: box.x - offsetX, y: box.y - offsetY };
    const row = (edge: { ys: [number, number, number] | null }) => edge.ys ? median(edge.ys) + offsetY : null;
    return { dark: row(darkFootEdge(image, local)), bright: row(brightFootEdge(image, local)) };
  }) as [SoleFoot | null, SoleFoot | null];
}

/** Region covering both boxes, for reading only the pixels that are needed. */
export function soleRegion(boxes: readonly [FootBox | null, FootBox | null], width: number, height: number) {
  const present = boxes.filter((b): b is FootBox => !!b);
  if (!present.length) return null;
  const x0 = Math.max(0, Math.floor(Math.min(...present.map(b => b.x))) - 2);
  const y0 = Math.max(0, Math.floor(Math.min(...present.map(b => b.y))) - 2);
  const x1 = Math.min(width, Math.ceil(Math.max(...present.map(b => b.x + b.width))) + 3);
  const y1 = Math.min(height, Math.ceil(Math.max(...present.map(b => b.y + b.height))) + 3);
  return x1 > x0 && y1 > y0 ? { x: x0, y: y0, width: x1 - x0, height: y1 - y0 } : null;
}

/** Contact interval implied by the toe template: both-feet flight is the
 * intersection of the two parabolic lobes around the cycle's pelvis apexes. */
export function modelContact(cycle: ToeCycleReport['cycles'][number]): { landing: number; takeoff: number } | null {
  const r = cycle.result;
  if (!r) return null;
  const period = cycle.endPts - cycle.startPts;
  const landing = Math.min(...([0, 1] as const).map(s => cycle.startPts + period * (r.footPhases[s] + r.footFractions[s] / 2)));
  const takeoff = Math.max(...([0, 1] as const).map(s => cycle.startPts + period * (r.footPhases[s] + 1 - r.footFractions[s] / 2)));
  return takeoff > landing ? { landing, takeoff } : null;
}

type Point = { t: number; y: number };
/** Median of three adjacent observations removes one-frame silhouette glitches. */
function smooth(series: readonly Point[]): Point[] {
  return series.map((p, i) => i > 0 && i < series.length - 1 ? { t: p.t, y: median([series[i - 1].y, p.y, series[i + 1].y]) } : p);
}
/** First fast upward step (image y decreasing) that continues into the air.
 * Returns the midpoint between the last support sample and the first air sample. */
function firstLift(series: readonly Point[], speed: number, travel: number): { t: number } | { reason: string } {
  const s = smooth(series), S = SOLE_CONTACT_SETTINGS, gap = gapLimit(S.maximumGapSeconds, s.map(p => p.t));
  for (let i = 1; i < s.length; i++) {
    const dt = s[i].t - s[i - 1].t;
    if (!(dt > 0) || dt > gap + 1e-9) return { reason: 'SOLE_EDGE_GAP' };
    if ((s[i - 1].y - s[i].y) / dt < speed) continue;
    const later = s.slice(i, i + S.continuationSamples);
    if (later.length < S.monotoneSteps + 1 || s[i - 1].y - Math.min(...later.map(p => p.y)) < travel) continue;
    if (later.slice(1, S.monotoneSteps + 1).some((p, k) => p.y > later[k].y + S.reboundTolerancePixels)) continue;
    return { t: (s[i - 1].t + s[i].t) / 2 };
  }
  return { reason: 'SOLE_EVENT_UNRESOLVED' };
}

export interface SoleContactCycle {
  id: number; period: number;
  modelLandingPts: number | null; modelTakeoffPts: number | null;
  landingPts: number | null; takeoffPts: number | null;
  contactSeconds: number | null; flightSeconds: number | null; value: number | null;
  footLandings: [number | null, number | null]; footTakeoffs: [number | null, number | null];
  reason: string | null;
}
export interface SoleContactReport {
  version: typeof SOLE_CONTACT_SETTINGS.version; settings: typeof SOLE_CONTACT_SETTINGS;
  available: boolean; polarity: SolePolarity | null;
  cycles: SoleContactCycle[]; measuredCycles: number; measuredCycleIds: number[];
  mean: number | null; meanContactSeconds: number | null; modelMean: number | null;
  /** Median over cycles of (template landing - sole landing) and (sole takeoff - template takeoff). */
  landingLeadSeconds: number | null; takeoffLagSeconds: number | null;
  /** What the headline RSI is based on: the shoe bottom, or (when the silhouette
   * merged with a floor shadow) the toe template's contact events. */
  basis: 'SOLE' | 'TOE_MODEL' | null; headlineMean: number | null; headlineContactSeconds: number | null;
  reason: string | null;
}

function choosePolarity(report: ToeCycleReport, soles: readonly SoleFrame[]): SolePolarity {
  const count = { dark: 0, bright: 0 };
  const windows = report.cycles.flatMap(c => { const m = modelContact(c); return m ? [m] : []; });
  for (const f of soles) {
    if (!windows.some(w => f.pts >= w.landing - SOLE_CONTACT_SETTINGS.searchBeyondModelSeconds && f.pts <= w.takeoff + SOLE_CONTACT_SETTINGS.searchBeyondModelSeconds)) continue;
    for (const foot of f.feet) if (foot) { if (foot.dark !== null) count.dark++; if (foot.bright !== null) count.bright++; }
  }
  return count.bright > count.dark ? 'bright' : 'dark';
}

/** Re-times each accepted toe cycle's contact from shoe-bottom motion. Cycles
 * that cannot be measured are excluded, never filled from the template. */
export function soleContactReport(report: ToeCycleReport, soles: readonly SoleFrame[] | null): SoleContactReport {
  const S = SOLE_CONTACT_SETTINGS;
  const accepted = report.cycles.filter(c => c.result);
  const modelMean = accepted.length ? accepted.reduce((s, c) => s + c.result!.value, 0) / accepted.length : null;
  const base: SoleContactReport = { version: S.version, settings: S, available: false, polarity: null, cycles: [],
    measuredCycles: 0, measuredCycleIds: [], mean: null, meanContactSeconds: null, modelMean,
    landingLeadSeconds: null, takeoffLagSeconds: null, basis: null, headlineMean: null, headlineContactSeconds: null, reason: null };
  if (!soles || !soles.length) return { ...base, reason: 'SOLE_OBSERVATIONS_UNAVAILABLE' };
  if (soles.some((f, i) => !Number.isFinite(f.pts) || (i > 0 && f.pts <= soles[i - 1].pts)))
    return { ...base, reason: 'SOLE_OBSERVATIONS_INVALID' };
  const polarity = choosePolarity(report, soles);
  const cycles: SoleContactCycle[] = accepted.map(c => {
    const period = c.endPts - c.startPts, model = modelContact(c);
    const out: SoleContactCycle = { id: c.id, period, modelLandingPts: model?.landing ?? null, modelTakeoffPts: model?.takeoff ?? null,
      landingPts: null, takeoffPts: null, contactSeconds: null, flightSeconds: null, value: null,
      footLandings: [null, null], footTakeoffs: [null, null], reason: null };
    if (!model) return { ...out, reason: 'MODEL_CONTACT_UNAVAILABLE' };
    const legs = report.samples.filter(s => s.pts >= c.startPts && s.pts <= c.endPts && s.bodyScale !== null && s.bodyScale > 0).map(s => s.bodyScale!);
    if (!legs.length) return { ...out, reason: 'LOWER_SCALE_UNAVAILABLE' };
    const leg = median(legs), speed = S.liftSpeedLegsPerSecond * leg, travel = S.minimumTravelLegs * leg;
    const mid = (model.landing + model.takeoff) / 2;
    for (const side of [0, 1] as const) {
      const series = soles.flatMap(f => { const v = f.feet[side]?.[polarity]; return v === null || v === undefined ? [] : [{ t: f.pts, y: v }]; });
      const up = firstLift(series.filter(p => p.t >= mid && p.t <= model.takeoff + S.searchBeyondModelSeconds), speed, travel);
      const down = firstLift(series.filter(p => p.t <= mid && p.t >= model.landing - S.searchBeyondModelSeconds)
        .map(p => ({ t: -p.t, y: p.y })).reverse(), speed, travel);
      if ('reason' in up) return { ...out, reason: up.reason === 'SOLE_EDGE_GAP' ? 'SOLE_EDGE_GAP' : 'SOLE_TAKEOFF_UNRESOLVED' };
      if ('reason' in down) return { ...out, reason: down.reason === 'SOLE_EDGE_GAP' ? 'SOLE_EDGE_GAP' : 'SOLE_LANDING_UNRESOLVED' };
      out.footTakeoffs[side] = up.t; out.footLandings[side] = -down.t;
    }
    // Contact runs from the first foot down to the last foot off.
    const takeoff = Math.max(out.footTakeoffs[0]!, out.footTakeoffs[1]!), landing = Math.min(out.footLandings[0]!, out.footLandings[1]!);
    if (Math.abs(takeoff - model.takeoff) > S.maximumShiftFromModelSeconds || Math.abs(landing - model.landing) > S.maximumShiftFromModelSeconds)
      return { ...out, reason: 'SOLE_EVENT_FAR_FROM_MODEL' };
    const contact = takeoff - landing;
    if (!(contact >= S.minimumContactSeconds && contact <= S.maximumContactSeconds && contact < period))
      return { ...out, reason: 'SOLE_CONTACT_OUT_OF_RANGE' };
    // Same stationary-cycle relation as the template: one period holds one
    // contact and, on average, one flight.
    return { ...out, landingPts: landing, takeoffPts: takeoff, contactSeconds: contact, flightSeconds: period - contact,
      value: fractionRSI(period, 1 - contact / period) };
  });
  const measured = cycles.filter(c => c.value !== null);
  const average = (xs: number[]) => xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null;
  const enough = measured.length >= S.minimumCycles;
  const mean = enough ? average(measured.map(c => c.value!)) : null;
  const meanContactSeconds = enough ? average(measured.map(c => c.contactSeconds!)) : null;
  // Floor-attached silhouette (shadow): sole landings early AND/OR takeoffs late
  // against the template across the recording, not in single cycles.
  const timed = cycles.flatMap(c => c.modelLandingPts !== null && c.modelTakeoffPts !== null
    && c.footLandings.every(v => v !== null) && c.footTakeoffs.every(v => v !== null)
    ? [{ lead: c.modelLandingPts - Math.min(...c.footLandings as number[]), lag: Math.max(...c.footTakeoffs as number[]) - c.modelTakeoffPts }] : []);
  const landingLeadSeconds = timed.length ? median(timed.map(t => t.lead)) : null;
  const takeoffLagSeconds = timed.length ? median(timed.map(t => t.lag)) : null;
  const floorAttached = timed.length >= S.minimumCycles && modelMean !== null
    && (landingLeadSeconds! > S.maximumFloorAttachedSeconds || takeoffLagSeconds! > S.maximumFloorAttachedSeconds);
  const modelContacts = accepted.flatMap(c => { const m = modelContact(c); return m ? [m.takeoff - m.landing] : []; });
  const common = { ...base, available: true, polarity, cycles, measuredCycles: measured.length, measuredCycleIds: measured.map(c => c.id),
    mean, meanContactSeconds, landingLeadSeconds, takeoffLagSeconds };
  if (floorAttached) return { ...common, basis: 'TOE_MODEL', headlineMean: modelMean, headlineContactSeconds: average(modelContacts),
    reason: 'SOLE_FLOOR_SHADOW_SUSPECTED' };
  // Too few shoe-measured cycles (e.g. a floor shadow that never leaves the
  // floor): report the toe template's events, labelled, rather than nothing.
  if (!enough && modelMean !== null) return { ...common, basis: 'TOE_MODEL', headlineMean: modelMean,
    headlineContactSeconds: average(modelContacts), reason: 'SOLE_CONTACT_INSUFFICIENT_CYCLES' };
  return { ...common, basis: mean === null ? null : 'SOLE', headlineMean: mean, headlineContactSeconds: meanContactSeconds,
    reason: enough ? null : accepted.length ? 'SOLE_CONTACT_INSUFFICIENT_CYCLES' : report.reason ?? 'NO_ACCEPTED_TOE_CYCLES' };
}
