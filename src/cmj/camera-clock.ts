/** Pose tracking must keep running even if a camera reports mediaTime=0.
 * Callback time is for display/inference only, never for jump measurement. */
export class CameraClock {
  private start: number | null = null;
  private inference = -1;
  private media: number | null = null;
  private capture: number | null = null;
  private source: 'capture' | 'media' | null = null;
  private stalls = 0;
  read(now: number, meta: { mediaTime: number; captureTime?: number }) {
    this.start ??= now;
    this.inference = Math.max(this.inference + .001, now - this.start);
    const capture = Number.isFinite(meta.captureTime) ? meta.captureTime! / 1000 : null;
    const media = Number.isFinite(meta.mediaTime) ? meta.mediaTime : null;
    const captureAdvances = capture !== null && this.capture !== null && capture > this.capture;
    const mediaAdvances = media !== null && this.media !== null && media > this.media;
    const backward = this.source === 'media' && media !== null && this.media !== null && media < this.media
      || this.source === 'capture' && capture !== null && this.capture !== null && capture < this.capture;
    // A repeated presentation is the same captured frame, not a new clock.
    // Phones often deliver one camera frame twice at screen refresh; resetting
    // here discarded the jump before it could be measured.
    let source = this.source;
    let reset = false;
    if (backward) { source = null; reset = true; this.stalls = 0; }
    else if (source === null) {
      source = mediaAdvances ? 'media' : captureAdvances ? 'capture' : null;
      reset = source !== null;
    } else if (source === 'media' ? mediaAdvances : captureAdvances) this.stalls = 0;
    else if ((source === 'media' ? captureAdvances : mediaAdvances) && ++this.stalls >= 2) {
      source = source === 'media' ? 'capture' : 'media';
      reset = true; this.stalls = 0;
    }
    this.capture = capture; this.media = media; this.source = source;
    const advancing = source === 'capture' ? captureAdvances : source === 'media' ? mediaAdvances : false;
    return { inferencePts: this.inference / 1000, elapsed: (now - this.start) / 1000,
      measurementPts: advancing ? source === 'capture' ? capture : media : null, source, reset };
  }
}
