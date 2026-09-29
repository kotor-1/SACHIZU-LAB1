export type LiveProfileReason = 'CHECKING_FULL' | 'FULL_WITHIN_BUDGET' | 'FULL_SLOW';
export interface LiveProfileObservation {
  /** Previous accepted frame: snapshot start through the worker reply. This
   * includes copying/transfer, not camera cadence or time waiting for a frame. */
  previousProcessingMs?: number | null;
}
/** Warm-up gate for the Full model. Live always stays on Full: a lighter model
 * would change toe/COM precision mid-session. A slow device is reported, and
 * the height estimator withholds numbers below its minimum frame rate. */
export class LiveProfile {
  static readonly slowMedianMs = 50; // ~20 frames/s, near the toe-timing minimum
  private times: number[] = [];
  ready = false;
  reason: LiveProfileReason = 'CHECKING_FULL';
  resetTiming() { this.times = []; }
  observe(inferenceMs: number, people: number, observation: LiveProfileObservation = {}): 'wait' | 'ready' {
    if (people !== 1 || !Number.isFinite(inferenceMs) || inferenceMs < 0) return this.ready ? 'ready' : 'wait';
    const previous = observation.previousProcessingMs;
    const cost = previous != null && Number.isFinite(previous) && previous >= 0 ? Math.max(inferenceMs, previous) : inferenceMs;
    this.times.push(cost);
    if (this.times.length > 12) this.times.shift();
    if (this.times.length === 12) {
      const sorted = [...this.times].sort((a, b) => a - b);
      this.ready = true;
      this.reason = (sorted[5] + sorted[6]) / 2 > LiveProfile.slowMedianMs ? 'FULL_SLOW' : 'FULL_WITHIN_BUDGET';
    }
    return this.ready ? 'ready' : 'wait';
  }
}
