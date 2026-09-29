export type LiveProfileReason = 'CHECKING_FULL' | 'FULL_WITHIN_BUDGET' | 'FULL_SLOW_SWITCH_PENDING' | 'LITE_FOR_SPEED';
export interface LiveProfileObservation {
  /** Previous accepted frame: snapshot start through the worker reply. This
   * includes copying/transfer, not camera cadence or time waiting for a frame. */
  previousProcessingMs?: number | null;
  /** Only before preparation or after a completed movement. */
  canSwitch?: boolean;
}
/** A one-way Full -> Lite profile. A slow frame alone cannot change models;
 * repeated full-path processing costs are checked without splicing a jump.
 * 25 ms remains a processing budget, not a promise of a camera frame rate. */
export class LiveProfile {
  private times: number[] = [];
  private lite = false;
  private pendingLite = false;
  ready = false;
  reason: LiveProfileReason = 'CHECKING_FULL';
  resetTiming() { this.times = []; }
  observe(inferenceMs: number, people: number, observation: LiveProfileObservation = {}): 'wait' | 'ready' | 'lite' {
    if (this.lite) return 'ready';
    if (people !== 1 || !Number.isFinite(inferenceMs) || inferenceMs < 0) return this.ready ? 'ready' : 'wait';
    const canSwitch = observation.canSwitch ?? !this.ready;
    const previous = observation.previousProcessingMs;
    const cost = previous != null && Number.isFinite(previous) && previous >= 0 ? Math.max(inferenceMs, previous) : inferenceMs;
    this.times.push(cost);
    if (this.times.length > 12) this.times.shift();
    if (this.times.length === 12) {
      const sorted = [...this.times].sort((a, b) => a - b);
      this.pendingLite ||= (sorted[5] + sorted[6]) / 2 > 25;
      this.ready = true;
      this.reason = this.pendingLite ? 'FULL_SLOW_SWITCH_PENDING' : 'FULL_WITHIN_BUDGET';
    }
    if (this.pendingLite && canSwitch) {
      this.lite = true; this.pendingLite = false; this.reason = 'LITE_FOR_SPEED';
      return 'lite';
    }
    return this.ready ? 'ready' : 'wait';
  }
}
