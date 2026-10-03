import { demuxMP4 } from '../frame-engine/mp4-demuxer';
import { SequentialRecordingDecoder } from '../cmj/sequential-decoder';
import { MobileCMJPose } from '../cmj/mobile-pose';
import { trackRotation } from '../cmj/video-orientation';
import { untilAborted } from '../cmj/session-lifecycle';
import type { Point, SprintSample } from './analysis';
import type { CrouchFrame } from './crouch';
import type { SprintStart } from './tracker';
import { SPRINT_POSES, SprintFrameProcessor } from './frame-processor';

export { SPRINT_POSES };
/** Frames looked at per second of video: 240 fps footage is analysed at 120
 * (the 10 m checks were made at 120 fps); while nobody is in the flying
 * section's run-in side, at 30; the watch crop at half the analysis rate.
 * Recorded: a 5.9 s, 240 fps video took 48 s with every frame and a watch on
 * each (28 ms of pose estimation per frame). */
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
  const decoder = new SequentialRecordingDecoder(file, d.videoTrack, d.frames, d.rawSamples, d.descriptionBuffer);
  // Up to four people per frame: with two, two people jogging behind the track
  // took both places and the runner passing them was never detected (recorded).
  const model = new MobileCMJPose('full', undefined, 'CPU', SPRINT_POSES);
  // Flying start: a second model watches the run-in side while the subject is elsewhere
  // (its own timeline, so neither model's tracking is disturbed). Image mode: a newcomer is
  // detected at once; in video mode the watcher kept following the people it had already
  // found and saw the runner only 0.26 s later, past the entry (recorded).
  let watcher: MobileCMJPose | null = null;
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
  let nextAnalysed = 0;
  try {
    await untilAborted(model.initialize(signal, message => progress(0, message)), signal); check();
    for (const frame of d.frames) {
      if (frame.frameIndex < nextAnalysed) {
        await untilAborted(decoder.skipExactFrame(frame.frameIndex), signal); check();
        continue;
      }
      nextAnalysed = frame.frameIndex + stride;
      const decoded = await untilAborted(decoder.decodeExactFrame(frame.frameIndex).then(result => {
        if (signal.aborted) decoder.dispose(); return result;
      }), signal); check();
      if (decoded.status !== 'SUCCESS' || decoded.actualDecodedFrameIndex !== frame.frameIndex) throw new Error('動画フレームを正しく読み出せません。');
      const bitmap = decoded.bitmap;
      const w = rotation % 180 ? bitmap.height : bitmap.width, h = rotation % 180 ? bitmap.width : bitmap.height;
      if (source.width !== w || source.height !== h) { source.width = w; source.height = h; }
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, w, h);
      ctx.translate(w / 2, h / 2); ctx.rotate(rotation * Math.PI / 180);
      ctx.drawImage(bitmap, -bitmap.width / 2, -bitmap.height / 2); ctx.setTransform(1, 0, 0, 1, 0, 0);
      const selected = await processor.process(w, h, frame);
      options.onSelected?.(frame, selected, w, h);
      if (processor.idle) nextAnalysed = frame.frameIndex + idleStride;
      const now = performance.now();
      if (now - lastUpdate > 100) { progress((frame.frameIndex + 1) / d.frames.length, '選手と脚の動きを解析しています。'); lastUpdate = now; }
      if (now - lastYield > 32) { await new Promise<void>(r => setTimeout(r, 0)); lastYield = performance.now(); check(); }
    }
    progress(1, '解析が終わりました。'); return processor.samples;
  } finally { signal.removeEventListener('abort', abort); decoder.dispose(); model.dispose(); (watcher as MobileCMJPose | null)?.dispose(); source.width = 0; }
}

/** A crouch start: the athlete's pose in every frame (up to CROUCH_FPS), followed
 * from the start line as in the standing 10 m. */
export async function measureCrouch(file: File, startX: number, signal: AbortSignal,
  progress: (fraction: number, message: string) => void): Promise<{ frames: CrouchFrame[]; width: number; height: number }> {
  const frames: CrouchFrame[] = [];
  let width = 0, height = 0;
  await measureSprint(file, startX, signal, progress, undefined, 'standing', 10, { maxFps: CROUCH_FPS, fromBlocks: true, onSelected: (frame, selected, w, h) => {
    width = w; height = h;
    frames.push({ frame: frame.frameIndex, pts: frame.pts, pose: selected.length === 33 ? selected.map(p => ({ x: p.x, y: p.y, visibility: p.visibility })) : null });
  } });
  return { frames, width, height };
}
