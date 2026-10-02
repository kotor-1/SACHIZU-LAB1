import type { COMAnalysis } from './com-analysis';
import { analyzeToeFlight } from './toe-flight';
import type { COMSample } from './center-of-mass';
import { stanceToes, type JumpLegs } from './single-leg';

export type COMPhase = 'PREPARING' | 'READY' | 'MOVING' | 'RECOVERING';
export interface COMResult { id: number; analysis: COMAnalysis; detectedAtPts: number }
export interface COMStreamDiagnostics {
  prepared: boolean;
  preparationSampleCount: number;
  preparationSpanSeconds: number;
  observationReason: string | null;
}
/** History kept while waiting for a jump. */
const BUFFER_SECONDS = 4;
/** Countermovement and standing-floor evidence handed to the estimator. */
const PRE_TAKEOFF_SECONDS = 1.5;
/** The landing corner needs floor frames after it (toe-flight floor window 0.2 s). */
const POST_LANDING_SECONDS = .35;
/** Detector bounds only; the estimator applies its own flight-time limits. */
const AIRBORNE_SECONDS = [.08, 1.2] as const;
/** Both toes must be this far above their floor level (fraction of body extent, min 10 units). */
const LIFT_FRACTION = .03;
/** The COM must also have risen this far (fraction of body extent) during the flight. */
const RISE_FRACTION = .03;
const STREAM_BREAK_SECONDS = .25;
const MIN_TRACKING_SAMPLES = 8;
const quantile = (xs: number[], q: number) => { const s = [...xs].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(q * s.length))]; };
const valid = (p: COMSample) => p.comY !== null && p.comX !== null && p.bodyScale !== null && !!p.toeY
  && Number.isFinite(p.comY) && Number.isFinite(p.comX) && Number.isFinite(p.bodyScale) && p.toeY.every(Number.isFinite);

/** Movement segmentation by the flight itself: a jump is detected when both
 * toes are clearly above their recent floor level at the same time and the COM
 * has risen. No standing still, baseline or countdown is needed before a jump,
 * and the next jump can follow right after a landing. Heel raises, squats and
 * walking never lift both toes together; anything detected still has to pass
 * the physical estimator (toe events, gravity arc, body-size scale).
 * Single-leg jumps use the lower toe for both (see stanceToes): the held foot
 * is off the floor throughout and is neither a takeoff nor a landing. */
export class COMStream {
  constructor(private readonly preparationSeconds = .3, private readonly legs: JumpLegs = 'BOTH') {}
  phase: COMPhase = 'PREPARING';
  private samples: COMSample[] = [];
  private id = 0;
  private lastPts: number | null = null;
  private lastValidPts: number | null = null;
  /** Earliest time the next analysis may use (after the previous landing). */
  private windowStart = -Infinity;
  private airborneSince: number | null = null;
  private landedAt: number | null = null;
  private highestCom = Infinity;
  private prepared = false;
  private latestObservationReason: string | null = 'PREPARATION_NOT_CONFIRMED';

  get observationReason(): string | null { return this.latestObservationReason; }
  get diagnostics(): COMStreamDiagnostics {
    const tracked = this.tracked();
    return { prepared: this.prepared, preparationSampleCount: tracked.length,
      preparationSpanSeconds: tracked.length ? tracked.at(-1)!.pts - tracked[0].pts : 0, observationReason: this.observationReason };
  }

  push(sample: COMSample, allowMovement = true): COMResult | null {
    const p = this.legs === 'BOTH' ? sample : stanceToes(sample);
    if (!Number.isFinite(p.pts) || (this.lastPts !== null && p.pts <= this.lastPts)) throw new Error('NON_MONOTONIC_STREAM');
    const gap = this.lastPts === null ? 0 : p.pts - this.lastPts;
    this.lastPts = p.pts;
    const active = this.phase === 'MOVING' || this.phase === 'RECOVERING';
    if (gap > STREAM_BREAK_SECONDS || (!valid(p) && this.lastValidPts !== null && p.pts - this.lastValidPts > STREAM_BREAK_SECONDS)) {
      // Never bridge a real loss: the floor level and any flight in progress are unknown.
      const reason = !valid(p) ? p.reason ?? 'COM_TRACKING_LOST' : 'COM_SAMPLE_GAP';
      const failed = active ? this.finish(p.pts, 'COM_TRACKING_OR_SAMPLE_GAP') : null;
      this.reset(reason);
      if (valid(p)) this.track(p);
      return failed;
    }
    this.samples.push(p);
    if (!valid(p)) {
      // Retained (not filled) so the estimator sees the missing observation.
      this.latestObservationReason = p.reason ?? 'COM_TRACKING_LOST';
      return null;
    }
    return this.track(p, allowMovement);
  }
  end(): COMResult | null {
    const result = this.phase === 'RECOVERING' ? this.finish(this.lastPts!)
      : this.phase === 'MOVING' ? this.finish(this.lastPts!, 'RECORDING_ENDED_BEFORE_RECOVERY') : null;
    this.reset(); return result;
  }
  private track(p: COMSample, allowMovement = true): COMResult | null {
    if (this.samples.at(-1) !== p) this.samples.push(p);
    this.lastValidPts = p.pts;
    if (this.phase === 'PREPARING' || this.phase === 'READY') {
      while (this.samples.length && p.pts - this.samples[0].pts > BUFFER_SECONDS) this.samples.shift();
    }
    const tracked = this.tracked();
    if (tracked.length < MIN_TRACKING_SAMPLES || tracked.at(-1)!.pts - tracked[0].pts < this.preparationSeconds) {
      this.phase = 'PREPARING'; this.latestObservationReason = 'PREPARATION_NOT_CONFIRMED';
      return null;
    }
    this.latestObservationReason = null; this.prepared = true;
    const before = tracked.filter(s => this.airborneSince === null || s.pts < this.airborneSince);
    const scale = quantile(before.map(s => s.bodyScale!), .5);
    const lift = Math.max(10, LIFT_FRACTION * scale);
    const floor = ([0, 1] as const).map(side => quantile(before.map(s => s.toeY![side]), .8));
    const airborne = p.toeY!.every((y, side) => floor[side] - y > lift);
    if (this.phase === 'PREPARING') this.phase = 'READY';
    if (this.phase === 'READY') {
      if (airborne && allowMovement) {
        this.airborneSince = p.pts; this.highestCom = p.comY!; this.phase = 'MOVING';
      }
      return null;
    }
    if (this.phase === 'MOVING') {
      this.highestCom = Math.min(this.highestCom, p.comY!);
      if (airborne) {
        if (p.pts - this.airborneSince! > AIRBORNE_SECONDS[1]) this.abandon();
        return null;
      }
      const risen = tracked.filter(s => s.pts < this.airborneSince! && this.airborneSince! - s.pts <= 1).map(s => s.comY!);
      const rise = risen.length ? quantile(risen, .5) - this.highestCom : 0;
      if (p.pts - this.airborneSince! < AIRBORNE_SECONDS[0] || rise < RISE_FRACTION * scale) { this.abandon(); return null; }
      this.landedAt = p.pts; this.phase = 'RECOVERING';
    } else if (airborne && p.pts - this.landedAt! < .15) {
      // A noisy toe point mid-flight is not a landing: the flight continues.
      this.phase = 'MOVING'; this.landedAt = null; this.highestCom = Math.min(this.highestCom, p.comY!);
      return null;
    }
    if (p.pts - this.landedAt! >= POST_LANDING_SECONDS) return this.finish(p.pts);
    return null;
  }
  /** Valid samples usable for the current or next analysis. */
  private tracked() { return this.samples.filter(s => s.pts > this.windowStart && valid(s)); }
  private abandon() { this.phase = 'READY'; this.airborneSince = null; this.landedAt = null; this.highestCom = Infinity; }
  private finish(pts: number, reason?: string): COMResult {
    const takeoff = this.airborneSince ?? pts;
    const rows = this.samples.filter(s => s.pts > this.windowStart && s.pts >= takeoff - PRE_TAKEOFF_SECONDS);
    // Standing body extent before takeoff (the countermovement shortens it).
    const extent = rows.filter(s => s.pts < takeoff && s.bodyScale !== null).map(s => s.bodyScale!);
    let analysis: COMAnalysis = analyzeToeFlight(rows, extent.length ? quantile(extent, .9) : NaN);
    if (reason) analysis = { ...analysis, status: 'UNAVAILABLE', reason, heightCm: null, velocityMps: null, sensitivityCm: null };
    // The landing belongs to this jump: the next analysis starts after it.
    this.windowStart = pts; this.abandon();
    this.samples = this.samples.filter(s => s.pts > pts - BUFFER_SECONDS);
    return { id: ++this.id, analysis, detectedAtPts: pts };
  }
  private reset(reason: string | null = 'PREPARATION_NOT_CONFIRMED') {
    this.phase = 'PREPARING'; this.samples = []; this.abandon(); this.phase = 'PREPARING';
    this.lastValidPts = null; this.windowStart = -Infinity;
    this.prepared = false; this.latestObservationReason = reason;
  }
}
