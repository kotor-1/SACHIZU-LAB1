import { analyzeCOM, type COMAnalysis } from './com-analysis';
import type { COMSample } from './center-of-mass';

export type COMPhase = 'PREPARING' | 'READY' | 'MOVING' | 'RECOVERING';
export interface COMResult { id: number; analysis: COMAnalysis; detectedAtPts: number }
export interface COMStreamDiagnostics {
  prepared: boolean;
  preparationSampleCount: number;
  preparationSpanSeconds: number;
  observationReason: string | null;
}
// Segmentation only. Height still requires the estimator's shorter gap limit
// inside the propulsion/airborne window.
const STREAM_BREAK_SECONDS = .25;
const median = (xs: number[]) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];

/** Movement segmentation uses COM displacement, not toe-ground thresholds.
 * Recovery is a display gate, not a measured landing/contact time. */
export class COMStream {
  constructor(private readonly preparationSeconds = .3) {}
  phase: COMPhase = 'PREPARING';
  private samples: COMSample[] = [];
  private baseline = 0;
  private scale = 0;
  private started = 0;
  private apexY = Infinity;
  private apexPts = 0;
  private recovered: number | null = null;
  private recoveryMisses = 0;
  private lastPts: number | null = null;
  private id = 0;
  private standingNoise = 0;
  private lastValidPts: number | null = null;
  private preparationStartedPts: number | null = null;
  private preparationSampleCount = 0;
  private preparationSpanSeconds = 0;
  private prepared = false;
  private latestObservationReason: string | null = 'PREPARATION_NOT_CONFIRMED';

  get observationReason(): string | null { return this.latestObservationReason; }
  get diagnostics(): COMStreamDiagnostics {
    return { prepared: this.prepared, preparationSampleCount: this.preparationSampleCount,
      preparationSpanSeconds: this.preparationSpanSeconds, observationReason: this.observationReason };
  }

  push(p: COMSample): COMResult | null {
    if (!Number.isFinite(p.pts) || (this.lastPts !== null && p.pts <= this.lastPts)) throw new Error('NON_MONOTONIC_STREAM');
    const gap = this.lastPts === null ? 0 : p.pts - this.lastPts;
    this.lastPts = p.pts;
    const active = this.phase === 'MOVING' || this.phase === 'RECOVERING';
    if (p.comY === null || p.comX === null || p.bodyScale === null ||
      !Number.isFinite(p.comY) || !Number.isFinite(p.comX) || !Number.isFinite(p.bodyScale) || gap > STREAM_BREAK_SECONDS) {
      this.latestObservationReason = p.reason ?? (gap > STREAM_BREAK_SECONDS ? 'COM_SAMPLE_GAP' : 'COM_TRACKING_LOST');
      this.samples.push(p);
      if (active) {
        // Retain the missing observation for the estimator's measurement-window
        // check. Do not interpolate or prematurely reset during countermovement.
        this.recovered = null; this.phase = 'MOVING';
        if (p.pts - this.started <= 3) return null;
        const failed = this.finish(p.pts, 'COM_TRACKING_OR_SAMPLE_GAP'); this.reset(); return failed;
      }
      // One lost pose must not erase readiness, but repeated missing rows must
      // not retain an old person's/position's baseline indefinitely. The gap
      // between callbacks alone cannot detect sustained pose loss.
      if (this.phase === 'READY' && gap <= STREAM_BREAK_SECONDS && this.lastValidPts !== null &&
        p.pts - this.lastValidPts <= STREAM_BREAK_SECONDS) return null;
      this.reset(this.latestObservationReason); return null;
    }
    this.lastValidPts = p.pts;
    this.latestObservationReason = null;
    this.samples.push(p);
    if (this.phase === 'PREPARING') {
      this.preparationStartedPts ??= p.pts;
      this.samples = this.samples.filter(s => p.pts - s.pts <= .5);
      this.preparationSampleCount = this.samples.length;
      this.preparationSpanSeconds = p.pts - this.samples[0].pts;
      if (this.samples.length < 8 || this.preparationSpanSeconds < this.preparationSeconds) {
        // Keep the readiness evidence requirement. Expose an impossible live
        // cadence instead of appearing to wait for the user to stand still.
        this.latestObservationReason = this.samples.length < 8 && p.pts - this.preparationStartedPts >= .5
          ? 'PREPARATION_SAMPLE_CADENCE' : 'PREPARATION_NOT_CONFIRMED';
        return null;
      }
      const ys = this.samples.map(s => s.comY!);
      const scales = this.samples.map(s => s.bodyScale!);
      this.scale = median(scales);
      // Real standing pose output sways about 1-1.6% of body extent in COM and
      // about 4% in head-to-foot extent within 0.5 s. Readiness is only
      // segmentation; height acceptance is decided by the physical estimator.
      if (Math.max(...ys) - Math.min(...ys) > .03 * this.scale ||
        Math.max(...scales) - Math.min(...scales) > .08 * this.scale) {
        this.latestObservationReason = 'PREPARATION_NOT_STILL'; return null;
      }
      this.baseline = median(ys);
      this.standingNoise = 1.4826 * median(ys.map(y => Math.abs(y - this.baseline)));
      this.phase = 'READY'; this.prepared = true;
    } else if (this.phase === 'READY') {
      if (Math.abs(p.comY - this.baseline) > Math.max(.006 * this.scale, this.standingNoise * 4)) {
        this.started = p.pts; this.apexY = p.comY; this.apexPts = p.pts; this.phase = 'MOVING';
      } else this.samples = this.samples.filter(s => p.pts - s.pts <= .6);
    } else {
      if (p.comY < this.apexY) { this.apexY = p.comY; this.apexPts = p.pts; }
      // Candidate detection, NOT a height acceptance threshold. Small rises
      // above standing jitter still have to pass the physical estimator.
      const rose = this.baseline - this.apexY > Math.max(.015 * this.scale, this.standingNoise * 6);
      const rise = this.baseline - this.apexY;
      // Landing posture is rarely the exact standing line: arms and knees leave
      // the COM several percent away. Most of the rise coming back is the landing.
      const descended = rise > 0 && p.comY - this.apexY >= rise * .75;
      const returned = rose && p.pts - this.apexPts >= .16 && descended;
      if (returned) {
        this.recovered ??= p.pts; this.recoveryMisses = 0; this.phase = 'RECOVERING';
        if (p.pts - this.recovered >= .12) { const r = this.finish(p.pts); this.rearm(); return r; }
      } else if (this.recovered !== null && this.recoveryMisses < 2 && p.comY >= this.baseline - .05 * this.scale) {
        // One noisy frame after landing must not erase an otherwise complete jump.
        this.recoveryMisses++; this.phase = 'RECOVERING';
      } else { this.recovered = null; this.recoveryMisses = 0; this.phase = 'MOVING'; }
      if (p.pts - this.started > 3) { const r = this.finish(p.pts, 'MOVEMENT_NOT_RESOLVED'); this.reset(); return r; }
    }
    return null;
  }
  end(): COMResult | null {
    const active = this.phase === 'MOVING' || this.phase === 'RECOVERING';
    const result = active ? this.finish(this.lastPts!, 'RECORDING_ENDED_BEFORE_RECOVERY') : null;
    this.reset(); return result;
  }
  private finish(pts: number, reason?: string): COMResult {
    let analysis = analyzeCOM(this.samples, this.scale);
    if (reason) analysis = { ...analysis, status: 'UNAVAILABLE', reason, heightCm: null, velocityMps: null, sensitivityCm: null };
    return { id: ++this.id, analysis, detectedAtPts: pts };
  }
  private rearm() {
    // Recovery confirms a complete movement, not a new standing baseline.
    // Reusing the old baseline can label a held deep landing as another jump.
    // Re-establish the same standing evidence before starting the next one.
    this.reset();
  }
  private reset(reason: string | null = 'PREPARATION_NOT_CONFIRMED') {
    this.phase = 'PREPARING'; this.samples = []; this.recovered = null; this.recoveryMisses = 0;
    this.lastValidPts = null; this.preparationStartedPts = null;
    this.preparationSampleCount = 0; this.preparationSpanSeconds = 0;
    this.prepared = false; this.latestObservationReason = reason;
  }
}
