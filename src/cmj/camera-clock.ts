/** Pose tracking must keep running even if a camera reports mediaTime=0.
 * Callback time is for display/inference only, never for jump measurement.
 *
 * Preferred measurement time is the drawn frame's own capture timestamp
 * (VideoFrame.timestamp, see drawCameraFrame). requestVideoFrameCallback
 * metadata can describe a different frame than the one drawn: WebKit (iPhone
 * Safari) leaves mediaTime unset for camera streams, stamps captureTime when a
 * frame reaches WebKit, and when two frames arrive before the page runs it
 * shows the newer image with the older frame's time. At 30 fps that put some
 * images one frame (33 ms) late on the measurement timeline and made CMJ
 * heights 10-16 cm too low without failing any check. */
export class CameraClock {
  private start: number | null = null;
  private inference = -1;
  private media: number | null = null;
  private capture: number | null = null;
  private frame: number | null = null;
  private frameUsable = true;
  private frameStalls = 0;
  private source: 'frame' | 'capture' | 'media' | null = null;
  private stalls = 0;
  read(now: number, meta: { mediaTime: number; captureTime?: number; frameTime?: number | null }) {
    this.start ??= now;
    this.inference = Math.max(this.inference + .001, now - this.start);
    const capture = Number.isFinite(meta.captureTime) ? meta.captureTime! / 1000 : null;
    const media = Number.isFinite(meta.mediaTime) ? meta.mediaTime : null;
    const frameTime = meta.frameTime != null && Number.isFinite(meta.frameTime) ? meta.frameTime : null;
    const captureAdvances = capture !== null && this.capture !== null && capture > this.capture;
    const mediaAdvances = media !== null && this.media !== null && media > this.media;
    const clockTimes = { inferencePts: this.inference / 1000, elapsed: (now - this.start) / 1000 };
    if (frameTime !== null && this.frameUsable) {
      const reset = this.source !== 'frame' || (this.frame !== null && frameTime < this.frame);
      const advancing = reset || frameTime > this.frame!;
      // A browser that reports a constant VideoFrame time while the camera
      // metadata advances does not timestamp frames: use the metadata instead.
      if (!advancing && (captureAdvances || mediaAdvances) && ++this.frameStalls >= 2) this.frameUsable = false;
      else {
        if (advancing) this.frameStalls = 0;
        this.frame = frameTime; this.capture = capture; this.media = media; this.source = 'frame'; this.stalls = 0;
        return { ...clockTimes, measurementPts: advancing ? frameTime : null, source: this.source, reset };
      }
    }
    if (this.source === 'frame') { this.source = null; this.frame = null; }
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
    return { ...clockTimes, measurementPts: advancing ? source === 'capture' ? capture : media : null, source, reset };
  }
}

/** Draws the video's current frame and returns that frame's own capture time
 * in seconds, so pixels and time always belong to the same camera frame.
 * Returns null (after drawing from the element) when VideoFrame is unavailable. */
export function drawCameraFrame(video: HTMLVideoElement, context: CanvasRenderingContext2D, width: number, height: number): number | null {
  if (typeof VideoFrame !== 'undefined') {
    let frame: VideoFrame | null = null;
    try {
      frame = new VideoFrame(video);
      context.drawImage(frame, 0, 0, width, height);
      return frame.timestamp / 1e6;
    } catch { /* Fall back to the element and its callback metadata. */ }
    finally { frame?.close(); }
  }
  context.drawImage(video, 0, 0, width, height);
  return null;
}
