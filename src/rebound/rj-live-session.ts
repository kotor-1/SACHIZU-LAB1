import type { NormalizedLandmark } from '@mediapipe/tasks-vision';
import { CameraClock, drawCameraFrame } from '../cmj/camera-clock';
import { createLowerSubjectSelector } from './lower-body';
import { SOLE_CONTACT_SETTINGS, type SoleFrame } from './sole-contact';
import type { PoseFrame } from './prediction-observations';
import type { RJFrameResult } from './rj-live-protocol';
import type { RJLiveClient } from './rj-live-client';
import type { SourceFrame } from './rj-frame-source';
import { jumpWatch } from './jump-watch';
import { measuredFps, RJ_CAMERA } from './rj-camera';

/** Frames sent and not yet read wait as pictures (about 2 MB each at 540x960); past this a set ends where it is. */
export const RJ_BACKLOG_BYTES = 240 * 1024 * 1024;
const POOL = 6;
/** The phone's reading speed: the median time per frame while the preview reads every frame it can (its first
 * FULL_RATE frames, after the model's first, slow, ones), as a set does. */
const READ_WARMUP = 5, FULL_RATE = 120;
/** After that, between sets, about 10 frames a second are read (the skeleton on the screen), not 60, so the phone does
 * not heat up while the next athlete gets ready. Read that sparsely, a frame takes about twice as long (the phone
 * idles in between), so those times are not the speed of a set. */
const PREVIEW_MS = 100;
/** A set ends where it is when no camera frame came for this long: the camera stopped, or the page was hidden.
 * Every other end needs frames (one of 18 test sets waited with none, 2026-10-23). */
export const RJ_STALL_MS = 2000;

export type RJSetEnd = 'AUTO' | 'BUTTON' | 'LIMIT' | 'BEHIND' | 'STALLED';
export interface RJPumpState {
  mode: 'preview' | 'set' | 'finishing';
  /** Camera frames a second, from the frames' own times. */
  cameraFps: number | null;
  /** Frames a second the phone reads (model and shoes), from the preview's time per frame. */
  readFps: number | null;
  /** The longest set read without falling past RJ_BACKLOG_BYTES; null while the phone keeps up with the camera. */
  longestSeconds: number | null;
  /** The latest frame read: everyone found, and the frame's picture size. */
  landmarks: NormalizedLandmark[][];
  frameSize: { width: number; height: number } | null;
  backend: 'CPU' | 'GPU' | null;
  /** 'processor': every camera frame (rj-frame-source.ts); 'screen': the frames the page shows. */
  frames: 'processor' | 'screen';
  setSeconds: number; setFrames: number; readFrames: number;
  jumps: number;
}
export interface RJSet {
  poses: PoseFrame[]; soles: SoleFrame[];
  cameraFps: number | null; seconds: number;
  /** Camera frames the page never had (gaps in the frames' times): a contact moment may be in one. */
  missedFrames: number;
  timing: string | null; timingReset: boolean;
  end: RJSetEnd;
  /** The most frames waiting to be read at once. */
  peakWaiting: number;
  frameSize: { width: number; height: number };
  readFps: number | null;
  frames: RJPumpState['frames'];
  /** performance.now() when the set ended (its frames still to be read then). */
  endedAt: number;
}

/** Camera frames missed in a run of frame times: each gap of more than 1.5 intervals, in whole intervals. */
export function missedFrames(times: readonly number[]): number {
  const steps = times.slice(1).map((t, i) => t - times[i]).filter(dt => dt > 0);
  if (steps.length < 2) return 0;
  const sorted = [...steps].sort((a, b) => a - b), interval = sorted[Math.floor((sorted.length - 1) / 2)];
  return steps.reduce((n, dt) => n + (dt > 1.5 * interval ? Math.round(dt / interval) - 1 : 0), 0);
}
/** The longest set read before RJ_BACKLOG_BYTES of frames wait: null when the phone reads as fast as the camera. */
export function longestSet(cameraFps: number | null, readFps: number | null, frameBytes: number): number | null {
  if (!cameraFps || !readFps || readFps >= cameraFps * .98) return null;
  return Math.min(RJ_CAMERA.maximumSeconds, RJ_BACKLOG_BYTES / frameBytes / (cameraFps - readFps));
}
/** The camera frame's own time (s) without drawing it, or null. */
function frameTime(video: HTMLVideoElement): number | null {
  if (typeof VideoFrame === 'undefined') return null;
  let frame: VideoFrame | null = null;
  try { frame = new VideoFrame(video); return frame.timestamp / 1e6; } catch { return null; } finally { frame?.close(); }
}
type Sizes = { sw: number; sh: number; pw: number; ph: number };
/** The shoes' picture is 960 px high; the model's is at most 720 px on its long side, as a chosen video's. */
function sizes(width: number, height: number): Sizes {
  const sh = SOLE_CONTACT_SETTINGS.imageHeight, sw = Math.round(width * sh / height), ps = Math.min(1, 720 / Math.max(width, height));
  return { sw, sh, pw: Math.round(width * ps), ph: Math.round(height * ps) };
}

/** The camera's frames into the RJ worker. In the preview, the newest frame whenever the worker is free (the skeleton
 * on the screen, and how fast this phone reads). In a set, EVERY frame, in order, with its shoes: the set's frames
 * and times are then those of a chosen video at the camera's rate (the analysis is the same). Frames come from the
 * frame reader (feed) where the browser has one, else from the frames the page shows (requestVideoFrameCallback). */
export class RJCameraPump {
  private callback = 0;
  private stopped = false;
  private clock = new CameraClock();
  private pool: HTMLCanvasElement[] = [];
  private slot = 0;
  private mode: RJPumpState['mode'] = 'preview';
  private previewBusy = false;
  private times: number[] = [];
  private reads: number[] = [];
  private previewFrames = 0;
  private previewAt = -Infinity;
  private order: Promise<unknown> = Promise.resolve();
  private latest: Pick<RJPumpState, 'landmarks' | 'frameSize' | 'backend'> = { landmarks: [], frameSize: null, backend: null };
  private lastUpdate = -Infinity;
  private set: {
    startPts: number | null; frames: number; handled: number; times: number[]; poses: PoseFrame[]; soles: SoleFrame[];
    answers: Map<number, RJFrameResult>; select: ReturnType<typeof createLowerSubjectSelector>; watch: ReturnType<typeof jumpWatch>;
    jumps: number; end: RJSetEnd | null; endedAt: number; peakWaiting: number; timingReset: boolean; timing: string | null;
    frameSize: { width: number; height: number } | null; frameBytes: number;
    resolve: (set: RJSet) => void; reject: (error: Error) => void;
  } | null = null;

  constructor(private video: HTMLVideoElement, private client: RJLiveClient,
    private onState: (state: RJPumpState) => void, private onError: (error: Error) => void,
    private source: 'processor' | 'screen' = 'screen') {}

  /** Frames shown on the page (requestVideoFrameCallback). */
  start() { if (!this.stopped) { this.source = 'screen'; this.callback = this.video.requestVideoFrameCallback(this.next); } }
  /** Frames from the frame reader instead, through feed. */
  readFrames() { this.source = 'processor'; this.emit(true); }
  stop() {
    this.stopped = true; this.video.cancelVideoFrameCallback(this.callback); this.unwatch();
    this.set?.reject(new DOMException('中止', 'AbortError')); this.set = null;
    for (const c of this.pool) c.width = 0;
  }
  /** performance.now() of the last new camera frame (read or not), and the set's check that frames still come. */
  private frameAt = -Infinity;
  private watchdog: ReturnType<typeof setInterval> | null = null;
  private unwatch() { if (this.watchdog !== null) { clearInterval(this.watchdog); this.watchdog = null; } }
  /** Frames the camera gave so far with a time later than the one before (read or not). */
  get received() { return this.frameCount; }
  private frameCount = 0;
  private lastFed: number | null = null;
  /** The model's clock (s, performance time): always forward, whatever the camera's times do; and the reader's times on it. */
  private lastInference = -Infinity;
  private readerBase: number | null = null;
  private inference(t: number) { this.lastInference = Math.max(this.lastInference + .001, t); return this.lastInference; }
  /** A frame from the frame reader (rj-frame-source.ts). One not later than the last is not a new frame (dropped). */
  feed(frame: SourceFrame) {
    if (this.stopped || (this.lastFed !== null && frame.pts <= this.lastFed)) { frame.image.close(); return; }
    this.lastFed = frame.pts; this.frameCount++;
    this.note(frame.pts);
    this.readerBase ??= performance.now() / 1000 - frame.pts;
    this.take(Promise.resolve(frame.image), frame.pts, this.inference(this.readerBase + frame.pts), sizes(frame.width, frame.height), 'frame', false);
  }
  /** Starts a set; settles once it has ended (by itself, endSet, the time limit or a phone too slow) and every frame was read. */
  beginSet(): Promise<RJSet> {
    if (this.stopped || this.set) return Promise.reject(new Error('CAMERA_SET_BUSY'));
    return new Promise<RJSet>((resolve, reject) => {
      this.set = { startPts: null, frames: 0, handled: 0, times: [], poses: [], soles: [], answers: new Map(),
        select: createLowerSubjectSelector({ left: 0, right: 1, top: 0, bottom: 1 }, 'BOTH', { allowSmallInitialSubject: true }),
        watch: jumpWatch(), jumps: 0, end: null, endedAt: 0, peakWaiting: 0, timingReset: false, timing: null,
        frameSize: null, frameBytes: 0, resolve, reject };
      // A new shoe meter in the worker, queued ahead of the set's first frame.
      this.send({ type: 'set' }).catch(e => this.fail(e));
      this.mode = 'set'; this.emit(true);
      this.frameAt = performance.now(); this.unwatch();
      this.watchdog = setInterval(() => {
        if (this.set && !this.set.end && performance.now() - this.frameAt > RJ_STALL_MS) this.endSet('STALLED');
      }, 250);
    });
  }
  endSet(end: RJSetEnd = 'BUTTON') {
    const set = this.set;
    if (!set || set.end) return;
    set.end = end; set.endedAt = performance.now(); this.mode = 'finishing'; this.emit(true); this.settle();
  }

  private next: VideoFrameRequestCallback = (now, metadata) => {
    if (this.stopped) return;
    this.callback = this.video.requestVideoFrameCallback(this.next);
    const w = this.video.videoWidth, h = this.video.videoHeight;
    if (!w || !h) return;
    if (this.mode === 'finishing' || (this.mode === 'preview' && (this.previewBusy || this.sparse()))) {
      // Not read, but timed: the camera's rate is measured on every frame shown.
      const t = frameTime(this.video); if (t !== null) this.note(t);
      return;
    }
    const s = sizes(w, h), canvas = this.canvas(s.sw, s.sh), context = canvas.getContext('2d');
    if (!context) { this.fail(new Error('映像処理を開始できませんでした。ブラウザを再起動してください。')); return; }
    // The pixels and their own camera time, frozen together before the copy.
    let time: number | null;
    try { time = drawCameraFrame(this.video, context, s.sw, s.sh); }
    catch (e) { this.fail(e instanceof Error ? e : new Error(String(e))); return; }
    const timing = this.clock.read(now, { ...metadata, frameTime: time });
    if (timing.measurementPts === null) return; // the same camera frame shown again
    this.note(timing.measurementPts);
    this.take(createImageBitmap(canvas), timing.measurementPts, this.inference(now / 1000), s, timing.source ?? null, timing.reset);
  };

  private note(time: number) {
    if (this.times.length && time <= this.times.at(-1)!) return;
    if (this.source === 'screen') this.frameCount++;
    this.times.push(time); if (this.times.length > 90) this.times.shift();
  }
  /** One frame for the worker: in the preview when it is free, in a set always. */
  private take(bitmap: Promise<ImageBitmap>, pts: number, inferencePts: number, s: Sizes, timing: string | null, reset: boolean) {
    const drop = () => { void bitmap.then(b => b.close(), () => undefined); };
    this.frameAt = performance.now();
    if (this.stopped || this.mode === 'finishing' || (this.mode === 'preview' && this.previewBusy)) { drop(); return; }
    const set = this.mode === 'set' ? this.set : null;
    if (!set) {
      if (this.sparse()) { drop(); return; }
      this.previewBusy = true;
      const asked = performance.now(), n = ++this.previewFrames;
      this.previewAt = asked;
      this.send({ type: 'frame', poseWidth: s.pw, poseHeight: s.ph, frame: 0, inferencePts, pts, sole: false }, bitmap)
        .then(r => {
          this.previewBusy = false;
          if (n > READ_WARMUP && n <= FULL_RATE) this.reads.push(performance.now() - asked);
          this.latest = { landmarks: r.landmarks, frameSize: { width: s.sw, height: s.sh }, backend: r.backend };
          this.emit();
        }, e => { this.previewBusy = false; this.fail(e); });
      return;
    }
    if (set.end) { drop(); return; }
    if (set.frameSize && (set.frameSize.width !== s.sw || set.frameSize.height !== s.sh)) {
      drop(); this.fail(new Error('計測中に画面の向きが変わりました。スマホを固定して、もう一度測ってください。')); return;
    }
    if (set.startPts !== null && pts <= set.times.at(-1)!) { drop(); set.timingReset = true; return; }
    if (reset && set.frames) set.timingReset = true;
    set.startPts ??= pts;
    set.frameSize ??= { width: s.sw, height: s.sh }; set.frameBytes = s.sw * s.sh * 4;
    set.timing = timing;
    const index = set.frames++, rel = pts - set.startPts;
    set.times.push(pts);
    const waiting = set.frames - set.handled;
    set.peakWaiting = Math.max(set.peakWaiting, waiting);
    this.send({ type: 'frame', poseWidth: s.pw, poseHeight: s.ph, frame: index, inferencePts, pts: rel, sole: true }, bitmap)
      .then(r => { if (this.set === set) { set.answers.set(index, r); this.drain(set); } }, e => this.fail(e));
    if (waiting * set.frameBytes > RJ_BACKLOG_BYTES) this.endSet('BEHIND');
    else if (rel >= RJ_CAMERA.maximumSeconds) this.endSet('LIMIT');
    else this.emit();
  }
  /** Answers handled in frame order (the worker answers in order; this keeps it so whatever the promise timing). */
  private drain(set: NonNullable<RJCameraPump['set']>) {
    for (let r = set.answers.get(set.handled); r; r = set.answers.get(set.handled)) {
      const frame = set.handled++, pts = set.times[frame] - set.startPts!;
      set.answers.delete(frame);
      set.poses.push({ frame, pts, poses: r.landmarks });
      set.soles.push(r.sole ?? { frame, pts, feet: [null, null] });
      const chosen = set.select(r.landmarks, pts), watched = set.watch(chosen.length === 1 ? chosen[0] : null, pts);
      set.jumps = watched.jumps;
      this.latest = { landmarks: r.landmarks, frameSize: set.frameSize, backend: r.backend };
      if (watched.ended) this.endSet('AUTO');
    }
    this.emit(); this.settle();
  }
  /** Resolves the set once it has ended and every frame sent was read. */
  private settle() {
    const set = this.set;
    if (!set || !set.end || set.handled < set.frames) return;
    this.set = null; this.mode = 'preview'; this.unwatch();
    set.resolve({ poses: set.poses, soles: set.soles, cameraFps: measuredFps(set.times), seconds: set.poses.at(-1)?.pts ?? 0,
      missedFrames: missedFrames(set.times), timing: set.timing, timingReset: set.timingReset, end: set.end,
      peakWaiting: set.peakWaiting, frameSize: set.frameSize ?? { width: 0, height: 0 }, readFps: this.readFps(),
      frames: this.source, endedAt: set.endedAt });
    this.emit(true);
  }
  /** Posts in the order asked, though each picture may be copied asynchronously. */
  private send(message: object, bitmap?: Promise<ImageBitmap>): Promise<RJFrameResult> {
    const posted = this.order.then(async () => {
      const image = bitmap ? await bitmap : null;
      if (this.stopped) { image?.close(); throw new DOMException('中止', 'AbortError'); }
      return { answer: this.client.request<RJFrameResult>(image ? { ...message, image } : message, image ? [image] : []) };
    });
    this.order = posted.catch(() => undefined);
    return posted.then(p => p.answer);
  }
  private fail(error: unknown) {
    if (this.stopped) return;
    const e = error instanceof Error ? error : new Error(String(error));
    const set = this.set; this.set = null; this.mode = 'preview'; this.unwatch();
    if (set) set.reject(e); else this.onError(e);
  }
  private canvas(width: number, height: number) {
    if (this.pool.length < POOL) this.pool.push(document.createElement('canvas'));
    const c = this.pool[this.slot++ % this.pool.length];
    if (c.width !== width || c.height !== height) { c.width = width; c.height = height; }
    return c;
  }
  /** Between sets, after the speed was measured: one frame in PREVIEW_MS. */
  private sparse() { return this.previewFrames >= FULL_RATE && performance.now() - this.previewAt < PREVIEW_MS; }
  private readFps() {
    if (this.reads.length < 5) return null;
    const s = [...this.reads].sort((a, b) => a - b);
    return 1000 / s[Math.floor((s.length - 1) / 2)];
  }
  private emit(force = false) {
    const now = performance.now();
    if (!force && now - this.lastUpdate < 100) return;
    this.lastUpdate = now;
    const set = this.set, cameraFps = measuredFps(this.times), readFps = this.readFps();
    const size = this.latest.frameSize;
    this.onState({ mode: this.mode, cameraFps, readFps,
      longestSeconds: size ? longestSet(cameraFps, readFps, size.width * size.height * 4) : null,
      ...this.latest, frames: this.source, setSeconds: set?.startPts != null ? (set.times.at(-1) ?? set.startPts) - set.startPts : 0,
      setFrames: set?.frames ?? 0, readFrames: set?.handled ?? 0, jumps: set?.jumps ?? 0 });
  }
}
