/** The pose models for the crouch start's light mode (crouch-pick.ts): only the frames the user set are looked at. Each
 * is drawn from a hidden copy of the video (as the phase pictures are, CrouchViews.tsx); MediaPipe looks in image mode
 * in a window a third of the picture wide and its full height where the athlete should be (as the analysis' crop,
 * SprintFrameProcessor), the athlete is the person whose hips are nearest there, and RTMPose reads the athlete again in
 * that box for the angles and the pictures (rtm-refine.ts). One frame at a time, in the order asked. */
import { MobileCMJPose } from '../cmj/mobile-pose';
import type { CrouchPoint } from './crouch';
import { SPRINT_POSES } from './frame-processor';
import { insideFrame, once, seekTo } from './frame-seek';
import { loadRefiner, type Refiner } from './rtm-refine';

/** What the models found in a frame: MediaPipe's athlete (null when nobody was found) and RTMPose's. */
export interface FoundPose { pose: CrouchPoint[] | null; refined: CrouchPoint[] | null }
/** The window looked in (picture widths), as the analysis' crop; the whole picture when nobody is found in it. */
export const CROP_W = .36;

/** The person whose hips are nearest `x` (normalized), among those with both hips seen; else the first. */
export function nearestAthlete(poses: readonly CrouchPoint[][], x: number | null): CrouchPoint[] | null {
  const hip = (p: CrouchPoint[]) => [p[23], p[24]].every(q => q && (q.visibility ?? 1) >= .3) ? (p[23].x + p[24].x) / 2 : null;
  const withHips = poses.filter(p => hip(p) !== null);
  if (!withHips.length) return poses[0] ?? null;
  return x === null ? withHips[0] : withHips.reduce((a, b) => Math.abs(hip(b)! - x) < Math.abs(hip(a)! - x) ? b : a);
}

export class PickPoses {
  private readonly video = document.createElement('video');
  private readonly source = document.createElement('canvas');
  private readonly crop = document.createElement('canvas');
  private model: MobileCMJPose | null = null;
  private refiner: Refiner | null = null;
  private queue: Promise<unknown> = Promise.resolve();
  private readonly loaded: Promise<void>;
  private readonly ready: Promise<void>;
  private closed = false;
  /** The time each frame took to be found (ms), for the checks on slow phones. */
  readonly took: number[] = [];
  constructor(url: string, private readonly interval: number, signal: AbortSignal, status: (text: string) => void) {
    const v = this.video;
    v.muted = true; v.playsInline = true; v.preload = 'auto';
    v.style.cssText = 'position:fixed;left:-10000px;top:0;width:320px;height:180px;pointer-events:none';
    document.body.appendChild(v);
    const loaded = (async () => {
      const data = once(v, 'loadeddata', 20000);
      v.src = url; v.load();
      // Some browsers load nothing until the video plays once.
      const nudge = setTimeout(() => { if (v.readyState < 2) v.play().then(() => v.pause()).catch(() => undefined); }, 1500);
      try { await data; } finally { clearTimeout(nudge); }
    })();
    this.loaded = loaded;
    this.ready = (async () => {
      await loaded;
      const model = new MobileCMJPose('full', undefined, 'CPU', SPRINT_POSES, 'IMAGE');
      await model.initialize(signal, status);
      if (this.closed) { model.dispose(); return; }
      this.model = model;
      // Without RTMPose the angles come from MediaPipe's pose, as in the analysis.
      try { this.refiner = await loadRefiner(signal, status); } catch (e) { if (signal.aborted) throw e; this.refiner = null; }
    })();
    this.loaded.catch(() => undefined); this.ready.catch(() => undefined);
  }
  /** The picture's size (pixels, upright as shown), once the video is loaded. */
  async size() { await this.loaded; return { width: this.video.videoWidth, height: this.video.videoHeight }; }
  get backend(): Refiner['backend'] | null { return this.refiner?.backend ?? null; }
  /** Waits for the models (and says why they could not be made). */
  whenReady() { return this.ready; }
  /** The athlete at the frame starting at `pts`; `hipX` tells where the hips should be (normalized), asked when the frame's
   * turn comes (the frames before it may have told more). */
  look(pts: number, hipX: () => number | null): Promise<FoundPose> {
    const run = this.queue.then(async () => {
      await this.ready;
      if (this.closed || !this.model) return { pose: null, refined: null };
      const started = performance.now(), v = this.video;
      await seekTo(v, insideFrame(pts, this.interval));
      const W = v.videoWidth, H = v.videoHeight, ctx = this.source.getContext('2d');
      if (!W || !H || !ctx) return { pose: null, refined: null };
      if (this.source.width !== W || this.source.height !== H) { this.source.width = W; this.source.height = H; }
      ctx.drawImage(v, 0, 0, W, H);
      const x = hipX(), from = x === null ? (1 - CROP_W) / 2 : Math.max(0, Math.min(1 - CROP_W, x - CROP_W / 2));
      let found = this.detect({ x: from, y: 0, w: CROP_W, h: 1 }, W, H);
      if (!found.length) found = this.detect({ x: 0, y: 0, w: 1, h: 1 }, W, H);
      const pose = nearestAthlete(found, x);
      let refined: CrouchPoint[] | null = null;
      if (pose && this.refiner) { try { refined = await this.refiner.refine(this.source, pose); } catch { refined = null; } }
      this.took.push(performance.now() - started);
      return { pose, refined };
    });
    this.queue = run.catch(() => undefined);
    return run;
  }
  /** MediaPipe in a part of the picture (normalized), at the source's pixels before resizing (a small athlete keeps its
   * detail), the poses back in the whole picture's coordinates. */
  private detect(region: { x: number; y: number; w: number; h: number }, W: number, H: number): CrouchPoint[][] {
    const c = this.crop, cc = c.getContext('2d');
    if (!cc || !this.model) return [];
    c.width = 512; c.height = Math.max(1, Math.round(512 * region.h * H / (region.w * W)));
    cc.drawImage(this.source, region.x * W, region.y * H, region.w * W, region.h * H, 0, 0, c.width, c.height);
    return this.model.estimate(c, 0, 0).landmarks.map(p => p.map(q => ({ x: region.x + q.x * region.w, y: region.y + q.y * region.h, visibility: q.visibility })));
  }
  dispose() {
    this.closed = true;
    this.model?.dispose(); this.model = null;
    const v = this.video; v.pause(); v.removeAttribute('src'); v.load(); v.remove();
    this.source.width = 0; this.crop.width = 0;
  }
}
