/** A recorded set of squats or RDLs: the athlete's pose in each analysed frame, MediaPipe to find and follow the
 * athlete (and time the reps), then RTMPose for the angles, in a second reading of the same frames once MediaPipe's
 * model is closed (the two are not held at once: the crouch start, docs/Crouch_Start_Lighter_20261007.md).
 *
 * A squat or an RDL is slow: the bottom turns over in ~0.2 s, so a frame every 1/30 s finds it (an angle near the
 * turn changes less than 1° in 1/30 s); 60-240 fps footage is read at STRENGTH_FPS, a long set at fewer. */
import { demuxMP4 } from '../frame-engine/mp4-demuxer';
import { SequentialRecordingDecoder } from '../cmj/sequential-decoder';
import { MobileCMJPose } from '../cmj/mobile-pose';
import { untilAborted } from '../cmj/session-lifecycle';
import type { CrouchFrame, CrouchPoint } from '../sprint10/crouch';
import { readFrames } from '../sprint10/recording';
import { loadRefiner, type Refiner } from '../sprint10/rtm-refine';
import { forgetFineModel, loadFineModel, readFine, type FineModel } from './fine';
import { pickAthlete, type Box } from './athlete';
import { analyzeStrength, type StrengthFrame } from './analysis';

/** Frames analysed per second, and at most this many in a video (a long set is read at fewer, not below MIN_FPS). */
export const STRENGTH_FPS = 30, MAX_FRAMES = 1200, MIN_FPS = 15;
/** The longest video (s) and file (bytes) taken. */
export const MAX_SECONDS = 90, MAX_BYTES = 200 * 1024 * 1024;

/** RTMPose (62 ms a frame in WebKit, MediaPipe 35) on every other frame analysed, and on every frame within
 * BOTTOM_REACH of a rep's bottom (its angles are those frames' medians): a rep is found on MediaPipe's points first,
 * as a squat and as an RDL (the exercise can be switched after the analysis). */
export const BOTTOM_REACH = 3;
export function refineTargets(frames: readonly CrouchFrame[], width: number, height: number): Set<number> {
  const seen = frames.filter(f => f.pose), out = new Set(seen.filter((_, i) => i % 2 === 0).map(f => f.frame));
  const index = new Map(frames.map((f, i) => [f.frame, i]));
  for (const exercise of ['squat', 'rdl', 'slrdl'] as const) for (const rep of analyzeStrength(frames, { width, height, exercise }).reps) {
    const b = index.get(rep.bottomFrame)!;
    for (let i = Math.max(0, b - BOTTOM_REACH); i <= Math.min(frames.length - 1, b + BOTTOM_REACH); i++) if (frames[i].pose) out.add(frames[i].frame);
  }
  return out;
}

/** The frames the angles come from, read also mirrored (fine.ts): each rep's bottom and BOTTOM_FRAMES (the
 * analysis's) on either side, and STAND_FRAMES up to its start (the standing posture); the reps found on MediaPipe's
 * points as each exercise. */
export const FINE_BOTTOM = 2, STAND_FRAMES = 4;
export function fineTargets(frames: readonly CrouchFrame[], width: number, height: number): Set<number> {
  const out = new Set<number>(), index = new Map(frames.map((f, i) => [f.frame, i]));
  const add = (from: number, to: number) => { for (let i = Math.max(0, from); i <= Math.min(frames.length - 1, to); i++) if (frames[i].pose) out.add(frames[i].frame); };
  for (const exercise of ['squat', 'rdl', 'slrdl'] as const) for (const rep of analyzeStrength(frames, { width, height, exercise }).reps) {
    const b = index.get(rep.bottomFrame)!, s = index.get(rep.startFrame)!;
    add(b - FINE_BOTTOM, b + FINE_BOTTOM); add(s - STAND_FRAMES, s);
  }
  return out;
}

/** The frames analysed: one each 1/fps s of the video's own times. */
export function framesToRead(times: readonly { frameIndex: number; pts: number }[], fps: number) {
  const out = new Set<number>();
  let next = -Infinity;
  for (const f of times) if (f.pts >= next - .25 / fps) { out.add(f.frameIndex); next = Math.max(next, f.pts) + 1 / fps; }
  return out;
}

export async function measureStrength(file: File, signal: AbortSignal, progress: (fraction: number, message: string) => void):
  Promise<{ frames: CrouchFrame[]; width: number; height: number; refiner: Refiner['backend'] | null; fps: number; fine: boolean }> {
  const check = () => { if (signal.aborted) throw new DOMException('中止', 'AbortError'); };
  if (!SequentialRecordingDecoder.isAvailable()) throw new Error('このブラウザではフレーム解析ができません。対応する最新のブラウザでお試しください。');
  if (file.size > MAX_BYTES) throw new Error('200MB以内のMP4 / MOVを選んでください（1080p・1セット分の長さを目安に）。');
  progress(0, '動画のコマの時刻を確認しています。');
  let times: { frameIndex: number; pts: number }[];
  { const d = await untilAborted(demuxMP4(file), signal); times = d.frames.map(f => ({ frameIndex: f.frameIndex, pts: f.pts })); }
  check();
  const span = times.length > 1 ? times.at(-1)!.pts - times[0].pts : 0;
  // A second over the limit allowed: the camera's recording stops on a timer at 90 s or a little after (a busy page).
  if (!times.length || span > MAX_SECONDS + 1) throw new Error(`${MAX_SECONDS}秒以内の動画を選んでください（1セット分）。`);
  const fps = Math.max(MIN_FPS, Math.min(STRENGTH_FPS, MAX_FRAMES / Math.max(span, 1e-6)));
  const wanted = framesToRead(times, fps), last = Math.max(...wanted);
  const frames: CrouchFrame[] = [];
  let width = 0, height = 0;
  // 1. MediaPipe: find and follow the athlete (two people a frame: a partner or a mirror may be in the picture).
  const model = new MobileCMJPose('full', undefined, 'CPU', 2);
  try {
    await untilAborted(model.initialize(signal, text => progress(0, text)), signal); check();
    let box: Box | null = null, lastYield = performance.now();
    await readFrames(file, signal, i => wanted.has(i), async (frame, source, w, h) => {
      width = w; height = h;
      const found = pickAthlete(model.estimate(source, frame.frameIndex, frame.pts).landmarks, box);
      if (found) box = found.b;
      frames.push({ frame: frame.frameIndex, pts: frame.pts, pose: found ? found.p.map(q => ({ x: q.x, y: q.y, visibility: q.visibility ?? 0 })) : null });
      progress(.5 * frame.frameIndex / last, '選手の動きを追っています。');
      if (performance.now() - lastYield > 32) { await new Promise<void>(r => setTimeout(r, 0)); lastYield = performance.now(); }
    });
  } finally { model.dispose(); }
  check();
  // 2. RTMPose-m 384×288 (fine.ts) in the box MediaPipe found: the angles' frames read also mirrored, the others once.
  // One model only: RTMPose-l held beside RTMPose-m 256×192 took WebKit's page from 0.87 to 1.42 GB (a 4K video). Where
  // it cannot be made, RTMPose-m 256×192 as before.
  let fineModel: FineModel | null = null, refiner: Refiner | null = null;
  try { fineModel = await untilAborted(loadFineModel(signal, text => progress(.5, text)), signal); }
  catch (e) { if (signal.aborted) throw e; fineModel = null; }
  if (!fineModel) {
    try { refiner = await untilAborted(loadRefiner(signal, text => progress(.5, text)), signal); }
    catch (e) { if (signal.aborted) throw e; refiner = null; }
  }
  const fm = fineModel as FineModel | null, r = refiner as Refiner | null;
  if (fm || r) {
    const fine = fm ? fineTargets(frames, width, height) : new Set<number>();
    const targets = new Set([...refineTargets(frames, width, height), ...fine]), byFrame = new Map(frames.map(f => [f.frame, f]));
    const last = Math.max(0, ...targets);
    // A model that stops working part way (the GPU lost, out of memory) is let go: the angles then come from MediaPipe's
    // points for every frame (not some from each), as where it could not be made.
    let failed = false;
    await readFrames(file, signal, i => targets.has(i), async (frame, source) => {
      const f = byFrame.get(frame.frameIndex) as StrengthFrame | undefined;
      if (f?.pose && !failed) try {
        if (fm) {
          const read = await readFine(fm, source, f.pose, fine.has(frame.frameIndex));
          if (read) { f.refined = read; if (fine.has(frame.frameIndex)) f.fine = true; }
        } else f.refined = await r!.refine(source, f.pose as CrouchPoint[]);
      } catch (e) { if (signal.aborted) throw e; failed = true; }
      progress(.5 + .5 * frame.frameIndex / Math.max(1, last), failed ? '骨格モデルが途中で止まったため、MediaPipeの点で測っています。' : '角度を細かく測っています。');
    });
    if (failed) {
      for (const f of frames as StrengthFrame[]) { delete f.refined; delete f.fine; }
      if (fm) forgetFineModel();
      progress(1, '解析が終わりました（骨格モデルが途中で止まったため、角度はMediaPipeの点で測りました）。');
      return { frames, width, height, refiner: null, fps, fine: false };
    }
  }
  progress(1, '解析が終わりました。');
  // `fine` only where the 384×288 model read the frames (not when it opened but read none).
  return { frames, width, height, refiner: fm?.backend ?? r?.backend ?? null, fps, fine: !!fm && frames.some(f => (f as StrengthFrame).refined) };
}
