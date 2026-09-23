/** Choose once, before readiness. Never splice different models into a jump.
 * 25 ms is an inference budget, not a guaranteed camera sampling rate. */
export class LiveProfile {
  private times: number[] = [];
  ready = false;
  reason: 'CHECKING_FULL' | 'FULL_WITHIN_BUDGET' | 'LITE_FOR_SPEED' = 'CHECKING_FULL';
  observe(inferenceMs: number, people: number): 'wait' | 'ready' | 'lite' {
    if (this.ready) return 'ready';
    if (people !== 1 || !Number.isFinite(inferenceMs) || inferenceMs < 0) return 'wait';
    this.times.push(inferenceMs);
    if (this.times.length < 12) return 'wait';
    this.ready = true;
    const sorted = [...this.times].sort((a, b) => a - b);
    const median = (sorted[5] + sorted[6]) / 2;
    this.reason = median <= 25 ? 'FULL_WITHIN_BUDGET' : 'LITE_FOR_SPEED';
    return median <= 25 ? 'ready' : 'lite';
  }
}
