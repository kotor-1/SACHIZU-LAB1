import { analyzeCOM, MAX_COM_GAP_SECONDS, type COMAnalysis } from './com-analysis';
import type { COMSample } from './center-of-mass';

export type COMPhase = 'PREPARING' | 'READY' | 'MOVING' | 'RECOVERING';
export interface COMResult { id: number; analysis: COMAnalysis; detectedAtPts: number }
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
  private lastPts: number | null = null;
  private id = 0;

  push(p: COMSample): COMResult | null {
    if (!Number.isFinite(p.pts) || (this.lastPts !== null && p.pts <= this.lastPts)) throw new Error('NON_MONOTONIC_STREAM');
    const gap = this.lastPts === null ? 0 : p.pts - this.lastPts;
    this.lastPts = p.pts;
    const active = this.phase === 'MOVING' || this.phase === 'RECOVERING';
    if (p.comY === null || p.comX === null || p.bodyScale === null ||
      !Number.isFinite(p.comY) || !Number.isFinite(p.comX) || !Number.isFinite(p.bodyScale) || gap > MAX_COM_GAP_SECONDS) {
      this.samples.push(p);
      if (active) {
        // Retain the missing observation for the estimator's measurement-window
        // check. Do not interpolate or prematurely reset during countermovement.
        this.recovered = null; this.phase = 'MOVING';
        if (p.pts - this.started <= 3) return null;
        const failed = this.finish(p.pts, 'COM_TRACKING_OR_SAMPLE_GAP'); this.reset(); return failed;
      }
      this.reset(); return null;
    }
    this.samples.push(p);
    if (this.phase === 'PREPARING') {
      this.samples = this.samples.filter(s => p.pts - s.pts <= .5);
      if (this.samples.length < 8 || p.pts - this.samples[0].pts < this.preparationSeconds) return null;
      const ys = this.samples.map(s => s.comY!);
      const scales = this.samples.map(s => s.bodyScale!);
      this.scale = median(scales);
      if (Math.max(...ys) - Math.min(...ys) > .012 * this.scale ||
        Math.max(...scales) - Math.min(...scales) > .04 * this.scale) return null;
      this.baseline = median(ys); this.phase = 'READY';
    } else if (this.phase === 'READY') {
      if (Math.abs(p.comY - this.baseline) > .025 * this.scale) {
        this.started = p.pts; this.apexY = p.comY; this.apexPts = p.pts; this.phase = 'MOVING';
      } else this.samples = this.samples.filter(s => p.pts - s.pts <= .6);
    } else {
      if (p.comY < this.apexY) { this.apexY = p.comY; this.apexPts = p.pts; }
      const rose = this.baseline - this.apexY > .05 * this.scale;
      const returned = rose && p.pts - this.apexPts >= .16 && p.comY >= this.baseline - .02 * this.scale;
      if (returned) {
        this.recovered ??= p.pts; this.phase = 'RECOVERING';
        if (p.pts - this.recovered >= .12) { const r = this.finish(p.pts); this.reset(); return r; }
      } else { this.recovered = null; this.phase = 'MOVING'; }
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
  private reset() { this.phase = 'PREPARING'; this.samples = []; this.recovered = null; }
}
