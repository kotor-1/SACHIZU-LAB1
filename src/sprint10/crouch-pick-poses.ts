/** The pose models for the crouch start's light mode (crouch-pick.ts): only the frames the user set are looked at. Each
 * is drawn from a hidden copy of the video (as the phase pictures are, CrouchViews.tsx); MediaPipe looks in image mode
 * in a window a third of the picture wide and its full height where the athlete should be (as the analysis' crop,
 * SprintFrameProcessor), the athlete is the person whose hips are nearest there, and RTMPose reads the athlete again in
 * that box for the angles and the pictures (rtm-refine.ts). One frame at a time, in the order asked. The long jump filmed
 * from the stands (longjump/stand-pick.ts) looks round a point instead (lookNear): the athlete small, among others. */
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

/** Where a small athlete far away should be (normalized): a point on the body (the hips, or where the user tapped), the
 * athlete's height in picture heights once known, and how much less sure the point is (picture heights, added to the
 * window). For the long jump filmed from the stands (longjump/stand-pick.ts). */
export interface NearHint { x: number; y: number; size: number | null; spread?: number }
export interface Region { x: number; y: number; w: number; h: number }
/** The square window round the athlete: NEAR_SIZE times its height (it fills the window enough for the person detector,
 * which looks at the window at a fixed small size). The athlete's height not known yet (the tap): NEAR_SIDES picture
 * heights, the largest first (a near athlete whole), then smaller (a far one large enough to be found). */
export const NEAR_SIZE = 2.6, NEAR_SIDES = [.8, .5, .28] as const;
/** The windows looked in, in turn: the squares round the hint, the strip a third of the picture wide (as the crouch
 * start's), the whole picture. */
export function windowsAround(h: NearHint | null, W: number, H: number): Region[] {
  const out: Region[] = [], clamp = (v: number, hi: number) => Math.max(0, Math.min(hi, v));
  if (h) {
    for (const side of h.size ? [NEAR_SIZE * h.size + (h.spread ?? 0)] : NEAR_SIDES) {
      const hh = Math.min(1, side), w = Math.min(1, side * H / W);
      out.push({ x: clamp(h.x - w / 2, 1 - w), y: clamp(h.y - hh / 2, 1 - hh), w, h: hh });
    }
    out.push({ x: clamp(h.x - CROP_W / 2, 1 - CROP_W), y: 0, w: CROP_W, h: 1 });
  }
  out.push({ x: 0, y: 0, w: 1, h: 1 });
  return out;
}
/** The person at the hint (a tap or where the hips should be): of the bodies holding the point (the box of their points
 * seen), the smallest (a small athlete far away in front of someone nearer and larger: the smaller body is the one tapped
 * inside both); else of the bodies near it (their box grown by NEAR_REACH of their height, and by the hint's spread), the
 * one whose hips are nearest. With the athlete's height known, bodies outside SIZE_RANGE times it are someone else (an
 * official by the board, a spectator in front). Null when nobody is at the point. */
export const NEAR_REACH = .3, SIZE_RANGE = [.6, 1.6] as const;
export function personAt(poses: readonly CrouchPoint[][], h: NearHint, W: number, H: number): CrouchPoint[] | null {
  const px = h.x * W, py = h.y * H;
  const bodies = poses.flatMap(p => {
    const seen = p.filter(q => q && (q.visibility ?? 1) >= .3);
    if (seen.length < 6) return [];
    const xs = seen.map(q => q.x * W), ys = seen.map(q => q.y * H), box = { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) };
    const tall = box.y1 - box.y0;
    if (h.size && (tall < SIZE_RANGE[0] * h.size * H || tall > SIZE_RANGE[1] * h.size * H)) return [];
    const hips = [p[23], p[24]].every(q => q && (q.visibility ?? 1) >= .3) ? { x: (p[23].x + p[24].x) / 2 * W, y: (p[23].y + p[24].y) / 2 * H }
      : { x: (box.x0 + box.x1) / 2, y: (box.y0 + box.y1) / 2 };
    return [{ p, box, tall, hips }];
  });
  const holds = (b: (typeof bodies)[number], m: number) => px >= b.box.x0 - m && px <= b.box.x1 + m && py >= b.box.y0 - m && py <= b.box.y1 + m;
  const inside = bodies.filter(b => holds(b, 0)).sort((a, b) => a.tall - b.tall);
  if (inside.length) return inside[0].p;
  const near = bodies.filter(b => holds(b, NEAR_REACH * b.tall + (h.spread ?? 0) * H));
  return near.length ? near.reduce((a, b) => Math.hypot(b.hips.x - px, b.hips.y - py) < Math.hypot(a.hips.x - px, a.hips.y - py) ? b : a).p : null;
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
    return this.queued(pts, (W, H) => {
      const x = hipX(), from = x === null ? (1 - CROP_W) / 2 : Math.max(0, Math.min(1 - CROP_W, x - CROP_W / 2));
      let found = this.detect({ x: from, y: 0, w: CROP_W, h: 1 }, W, H);
      if (!found.length) found = this.detect({ x: 0, y: 0, w: 1, h: 1 }, W, H);
      return nearestAthlete(found, x);
    });
  }
  /** The athlete near a point at the frame starting at `pts` (windowsAround, personAt): a small athlete far away among
   * others; `hint` asked when the frame's turn comes. Null pose when nobody is at the point. */
  lookNear(pts: number, hint: () => NearHint | null): Promise<FoundPose> {
    return this.queued(pts, (W, H) => {
      const h = hint(), windows = windowsAround(h, W, H);
      if (!h) return this.detect(windows[0], W, H)[0] ?? null;
      // The tap (the athlete's height not known): every square round it, the person chosen among all found there (a
      // larger window may find only someone larger holding the point; a smaller one, the athlete).
      if (h.size === null) {
        const squares = windows.slice(0, NEAR_SIDES.length), rest = windows.slice(NEAR_SIDES.length);
        return personAt(squares.flatMap(r => this.detect(r, W, H)), h, W, H) ?? personAt(rest.flatMap(r => this.detect(r, W, H)), h, W, H);
      }
      for (const region of windows) { const pose = personAt(this.detect(region, W, H), h, W, H); if (pose) return pose; }
      return null;
    });
  }
  /** One frame drawn from the video (in the queue, after the frames asked before), the athlete chosen in it by `choose`,
   * and RTMPose's reading of that athlete. */
  private queued(pts: number, choose: (W: number, H: number) => CrouchPoint[] | null): Promise<FoundPose> {
    const run = this.queue.then(async () => {
      await this.ready;
      if (this.closed || !this.model) return { pose: null, refined: null };
      const started = performance.now(), v = this.video;
      await seekTo(v, insideFrame(pts, this.interval));
      const W = v.videoWidth, H = v.videoHeight, ctx = this.source.getContext('2d');
      if (!W || !H || !ctx) return { pose: null, refined: null };
      if (this.source.width !== W || this.source.height !== H) { this.source.width = W; this.source.height = H; }
      ctx.drawImage(v, 0, 0, W, H);
      const pose = choose(W, H);
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
  private detect(region: Region, W: number, H: number): CrouchPoint[][] {
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
