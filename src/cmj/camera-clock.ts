/** Pose tracking must keep running even if a camera reports mediaTime=0.
 * Callback time is for display/inference only, never for jump measurement. */
export class CameraClock {
  private start: number | null = null;
  private inference = -1;
  private media: number | null = null;
  private capture: number | null = null;
  private source: 'capture' | 'media' | null = null;
  read(now: number, meta: { mediaTime: number; captureTime?: number }) {
    this.start ??= now;
    this.inference = Math.max(this.inference + .001, now - this.start);
    const capture = Number.isFinite(meta.captureTime) ? meta.captureTime! / 1000 : null;
    const media = Number.isFinite(meta.mediaTime) ? meta.mediaTime : null;
    const captureAdvances = capture !== null && this.capture !== null && capture > this.capture;
    const mediaAdvances = media !== null && this.media !== null && media > this.media;
    // Keep a working timebase; do not alternate clocks when optional capture
    // metadata is intermittent. Media time preserves the normal camera path.
    const source: 'capture' | 'media' | null = this.source === 'capture' && captureAdvances ? 'capture'
      : mediaAdvances ? 'media' : captureAdvances ? 'capture' : null;
    const reset = source === null || source !== this.source;
    this.capture = capture; this.media = media; this.source = source;
    return { inferencePts: this.inference / 1000, elapsed: (now - this.start) / 1000,
      measurementPts: source === 'capture' ? capture : source === 'media' ? media : null, source, reset };
  }
}
