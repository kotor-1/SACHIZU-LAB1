import { demuxMP4 } from '../frame-engine/mp4-demuxer';
import { SequentialRecordingDecoder } from '../cmj/sequential-decoder';
import { MobileCMJPose } from '../cmj/mobile-pose';
import { trackRotation } from '../cmj/video-orientation';
import { untilAborted } from '../cmj/session-lifecycle';
import type { Point, SprintSample } from './analysis';
import { analyzeCrouchStart, runStart, type CrouchFrame } from './crouch';
import { loadRefiner, type Refiner } from './rtm-refine';
import type { SprintStart } from './tracker';
import { SPRINT_POSES, SprintFrameProcessor } from './frame-processor';

export { SPRINT_POSES };
/** Frames looked at per second of video: 240 fps footage is analysed at 120
 * (the 10 m checks were made at 120 fps); while nobody is in the flying
 * section's run-in side, at 30; the watch crop at half the analysis rate.
 * Recorded: a 5.9 s, 240 fps video took 48 s with every frame and a watch on
 * each (28 ms of pose estimation per frame). */
/** A reading of the video starts again with a new decoder up to this many times when the decoder fails partway (an
 * iPhone gave "Decoder failure" in the long jump, which reads the most frames, 2026-10-06): the frames already handled
 * are decoded again, not handled again. */
export const DECODE_RETRIES = 2;
/** The video decoder failed at a frame (index from 0); its own message kept as `reason`. */
export class DecodeFailure extends Error {
  constructor(readonly frame: number, readonly reason: string) {
    super(`動画の読み出しに失敗しました（${frame + 1}コマ目：${reason}）。もう一度お試しください。`);
  }
}
/** A decoder step awaited, its failure (not an abort) turned into a DecodeFailure at `frame`. */
export async function decodeStep<T>(step: Promise<T>, signal: AbortSignal, frame: number): Promise<T> {
  try { return await untilAborted(step, signal); }
  catch (e) {
    if (signal.aborted || (e instanceof DOMException && e.name === 'AbortError')) throw e;
    throw new DecodeFailure(frame, e instanceof Error ? e.message : String(e));
  }
}
export const ANALYSIS_FPS = 120;
export const IDLE_FPS = 30;
/** The crouch start is timed to the frame: every frame up to this rate is
 * looked at (its events were checked against the picture at 240 fps). */
export const CROUCH_FPS = 240;
interface FrameOptions {
  maxFps?: number;
  /** A crouch start (see SprintFrameProcessor). */
  fromBlocks?: boolean;
  /** Each analysed frame's selected athlete (normalized landmarks; empty when not found) and picture size. */
  onSelected?: (frame: { frameIndex: number; pts: number }, selected: Point[], width: number, height: number) => void;
  /** Awaited after onSelected, with the frame still on `source`. */
  afterSelected?: (source: HTMLCanvasElement) => Promise<void>;
  /** A flying start's watcher already made and initialized (full, SPRINT_POSES, image mode), lent by the caller and
   * not disposed here: each pose model holds its own WebAssembly memory, and with the hurdle's own watcher alive a
   * second one took the page to 1.4-1.6 GB in WebKit (an iPhone closed the page, the long jump, 2026-10-06). */
  watcher?: MobileCMJPose;
  /** Only the frames from `from` to `to` (s) are analysed; the ones before are decoded and passed over (a decode is
   * under 1 ms a frame, a pose 35 ms and more). */
  from?: number; to?: number;
}
export async function measureSprint(file: File, startX: number, signal: AbortSignal,
  progress: (fraction: number, message: string) => void, finishX?: number, start: SprintStart = 'standing', distanceM = 10,
  options: FrameOptions = {}): Promise<SprintSample[]> {
  const check = () => { if (signal.aborted) throw new DOMException('中止', 'AbortError'); };
  check();
  if (!SequentialRecordingDecoder.isAvailable()) throw new Error('このブラウザではフレーム解析ができません。対応する最新のブラウザでお試しください。');
  if (file.size > 150 * 1024 * 1024) throw new Error('150MB以内のMP4 / MOVを選んでください。');
  progress(0, '元動画のフレーム時刻を確認しています。');
  const d = await untilAborted(demuxMP4(file), signal); check();
  if (!d.frames.length || d.frames.length > 3600 || d.frames.at(-1)!.pts - d.frames[0].pts > 30)
    throw new Error('1走分・30秒以内・3600フレーム以内の動画を選んでください。');
  const rotation = trackRotation((d.videoTrack as typeof d.videoTrack & { matrix?: ArrayLike<number> }).matrix);
  let decoder = new SequentialRecordingDecoder(file, d.videoTrack, d.frames, d.rawSamples, d.descriptionBuffer);
  // Up to four people per frame: with two, two people jogging behind the track
  // took both places and the runner passing them was never detected (recorded).
  const model = new MobileCMJPose('full', undefined, 'CPU', SPRINT_POSES);
  // Flying start: a second model watches the run-in side while the subject is elsewhere
  // (its own timeline, so neither model's tracking is disturbed). Image mode: a newcomer is
  // detected at once; in video mode the watcher kept following the people it had already
  // found and saw the runner only 0.26 s later, past the entry (recorded).
  let watcher: MobileCMJPose | null = options.watcher ?? null;
  const watching = async () => {
    if (!watcher) { watcher = new MobileCMJPose('full', undefined, 'CPU', SPRINT_POSES, 'IMAGE'); await untilAborted(watcher.initialize(signal), signal); check(); }
    return watcher;
  };
  const source = document.createElement('canvas'), ctx = source.getContext('2d');
  if (!ctx) throw new Error('映像処理を開始できません。');
  const processor = new SprintFrameProcessor(source, model, watching, startX, finishX, start, distanceM, false, options.fromBlocks);
  const abort = () => decoder.dispose();
  signal.addEventListener('abort', abort, { once: true });
  let lastYield = performance.now(), lastUpdate = -Infinity;
  const span = d.frames.at(-1)!.pts - d.frames[0].pts, fps = span > 0 ? (d.frames.length - 1) / span : ANALYSIS_FPS;
  const stride = Math.max(1, Math.round(fps / (options.maxFps ?? ANALYSIS_FPS))), idleStride = Math.max(stride, Math.round(fps / IDLE_FPS));
  let nextAnalysed = 0, done = -1;
  try {
    await untilAborted(model.initialize(signal, message => progress(0, message)), signal); check();
    for (let attempt = 0; ; attempt++) try {
    for (const frame of d.frames) {
      if (options.to !== undefined && frame.pts > options.to) break;
      if (frame.frameIndex <= done || frame.frameIndex < nextAnalysed || (options.from !== undefined && frame.pts < options.from)) {
        await decodeStep(decoder.skipExactFrame(frame.frameIndex), signal, frame.frameIndex); check();
        continue;
      }
      const decoded = await decodeStep(decoder.decodeExactFrame(frame.frameIndex).then(result => {
        if (signal.aborted) decoder.dispose(); return result;
      }), signal, frame.frameIndex); check();
      nextAnalysed = frame.frameIndex + stride;
      if (decoded.status !== 'SUCCESS' || decoded.actualDecodedFrameIndex !== frame.frameIndex) throw new Error('動画フレームを正しく読み出せません。');
      const bitmap = decoded.bitmap;
      const w = rotation % 180 ? bitmap.height : bitmap.width, h = rotation % 180 ? bitmap.width : bitmap.height;
      if (source.width !== w || source.height !== h) { source.width = w; source.height = h; }
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, w, h);
      ctx.translate(w / 2, h / 2); ctx.rotate(rotation * Math.PI / 180);
      ctx.drawImage(bitmap, -bitmap.width / 2, -bitmap.height / 2); ctx.setTransform(1, 0, 0, 1, 0, 0);
      const selected = await processor.process(w, h, frame);
      options.onSelected?.(frame, selected, w, h);
      if (options.afterSelected) { await untilAborted(options.afterSelected(source), signal); check(); }
      done = frame.frameIndex;
      if (processor.idle) nextAnalysed = frame.frameIndex + idleStride;
      const now = performance.now();
      if (now - lastUpdate > 100) {
        const share = options.from === undefined && options.to === undefined ? (frame.frameIndex + 1) / d.frames.length
          : (frame.pts - (options.from ?? 0)) / Math.max(1e-6, Math.min(options.to ?? Infinity, d.frames.at(-1)!.pts) - (options.from ?? 0));
        progress(Math.max(0, Math.min(1, share)), '選手と脚の動きを解析しています。'); lastUpdate = now;
      }
      if (now - lastYield > 32) { await new Promise<void>(r => setTimeout(r, 0)); lastYield = performance.now(); check(); }
    }
    break;
    } catch (e) {
      if (!(e instanceof DecodeFailure) || signal.aborted || attempt >= DECODE_RETRIES) throw e;
      progress((done + 1) / d.frames.length, '動画の読み出しをやり直しています。');
      decoder.dispose(); decoder = new SequentialRecordingDecoder(file, d.videoTrack, d.frames, d.rawSamples, d.descriptionBuffer);
    }
    progress(1, '解析が終わりました。'); return processor.samples;
  } finally { signal.removeEventListener('abort', abort); decoder.dispose(); model.dispose(); if (watcher !== options.watcher) (watcher as MobileCMJPose | null)?.dispose(); source.width = 0; }
}

/** A crouch start in two stages (the user, 2026-10-06: an iPhone 15 closed the page on a 240 fps video, 120 fps
 * took long and the phone grew hot, an iPhone SE 3 managed only 60 fps; 「精度は落とさずにできる？」). Every frame of
 * a long video had MediaPipe (35 ms a frame) and RTMPose (15-62 ms) - 3,120 frames for 13 s at 240 fps - while the
 * set to the third step is ~2 s. So: (1) a quick look at SCAN_FPS with MediaPipe alone finds when the run begins
 * (`runStart`); (2) the frames from SCAN_LEAD s before it to SCAN_TAIL s after are measured as before (every frame,
 * MediaPipe and RTMPose). Two videos cut to begin 0.6-0.9 s before the start (as stage 2 does) against the frames'
 * truth: mean error 1.53 frames, the whole videos 1.43 (max 3.8 / 4.8). Without a run seen, or with no result from
 * the window, the whole video as before. */
export const SCAN_FPS = 30, SCAN_LEAD = 1, SCAN_TAIL = 3;
/** A video this short (s) is measured whole at once: the window would be most of it, and the quick look only added
 * time (1.1-2.6 s videos: 13.2 → 14.5 s, 29.4 → 31.3 s). A 12 s one: 133.6 → 42.3 s (Chrome on a Mac). */
export const SCAN_FROM = 5;
export async function measureCrouchStart(file: File, startX: number, signal: AbortSignal,
  progress: (fraction: number, message: string) => void): Promise<{ frames: CrouchFrame[]; width: number; height: number; refiner: Refiner['backend'] | null; window: [number, number] | null }> {
  const d = await untilAborted(demuxMP4(file), signal), span = d.frames.length ? d.frames.at(-1)!.pts - d.frames[0].pts : 0;
  if (span <= SCAN_FROM) return { ...await measureCrouch(file, startX, signal, progress), window: null };
  const scan: CrouchFrame[] = [];
  let width = 0, height = 0;
  await measureSprint(file, startX, signal, (f, m) => progress(.3 * f, m === '選手と脚の動きを解析しています。' ? 'スタートの瞬間を探しています。' : m), undefined, 'standing', 10, {
    maxFps: SCAN_FPS, fromBlocks: true,
    onSelected: (frame, selected, w, h) => { width = w; height = h;
      scan.push({ frame: frame.frameIndex, pts: frame.pts, pose: selected.length === 33 ? selected.map(p => ({ x: p.x, y: p.y, visibility: p.visibility })) : null }); },
  });
  const run = width ? runStart(scan, width, height) : null;
  if (run !== null) {
    const window: [number, number] = [Math.max(0, run - SCAN_LEAD), run + SCAN_TAIL];
    const found = await measureCrouch(file, startX, signal, (f, m) => progress(.3 + .7 * f, m), window);
    if (!analyzeCrouchStart(found.frames, { width: found.width, height: found.height }).reason) return { ...found, window };
  }
  const whole = await measureCrouch(file, startX, signal, (f, m) => progress(.3 + .7 * f, m));
  return { ...whole, window: null };
}

/** A crouch start: the athlete's pose in every frame (up to CROUCH_FPS), followed
 * from the start line as in the standing 10 m, and the same pose from RTMPose
 * for the angles and the pictures (see rtm-refine.ts); without RTMPose (the
 * model not loaded) the angles come from MediaPipe and `refiner` is null. */
export async function measureCrouch(file: File, startX: number, signal: AbortSignal,
  progress: (fraction: number, message: string) => void, window?: [number, number]): Promise<{ frames: CrouchFrame[]; width: number; height: number; refiner: Refiner['backend'] | null }> {
  const frames: CrouchFrame[] = [];
  let width = 0, height = 0, refiner: Refiner | null = null;
  try { refiner = await untilAborted(loadRefiner(signal, text => progress(0, text)), signal); }
  catch (e) { if (signal.aborted) throw e; refiner = null; }
  await measureSprint(file, startX, signal, progress, undefined, 'standing', 10, { maxFps: CROUCH_FPS, fromBlocks: true, from: window?.[0], to: window?.[1], onSelected: (frame, selected, w, h) => {
    width = w; height = h;
    frames.push({ frame: frame.frameIndex, pts: frame.pts, pose: selected.length === 33 ? selected.map(p => ({ x: p.x, y: p.y, visibility: p.visibility })) : null });
  }, afterSelected: refiner ? async source => {
    const f = frames.at(-1); if (f?.pose) f.refined = await refiner!.refine(source, f.pose);
  } : undefined });
  return { frames, width, height, refiner: refiner?.backend ?? null };
}
