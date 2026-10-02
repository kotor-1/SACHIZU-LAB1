import { demuxMP4 } from '../frame-engine/mp4-demuxer';
import { SequentialRecordingDecoder } from '../cmj/sequential-decoder';
import { MobileCMJPose } from '../cmj/mobile-pose';
import { trackRotation } from '../cmj/video-orientation';
import { untilAborted } from '../cmj/session-lifecycle';
import { sprintSample, type SprintSample } from './analysis';
import { FLYING_MIN_SPEED_MPS, SprintTracker, type SprintStart } from './tracker';

/** People detected per frame in a sprint video. */
export const SPRINT_POSES = 4;
/** Frames looked at per second of video: 240 fps footage is analysed at 120
 * (the 10 m checks were made at 120 fps); while nobody is in the flying
 * section's run-in side, at 30; the watch crop at half the analysis rate.
 * Recorded: a 5.9 s, 240 fps video took 48 s with every frame and a watch on
 * each (28 ms of pose estimation per frame). */
export const ANALYSIS_FPS = 120;
export const IDLE_FPS = 30;
export async function measureSprint(file: File, startX: number, signal: AbortSignal,
  progress: (fraction: number, message: string) => void, finishX?: number, start: SprintStart = 'standing', distanceM = 10): Promise<SprintSample[]> {
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
  // Flying start: a second model watches the run-in side while the subject is
  // elsewhere (its own video timeline, so neither model's tracking is disturbed).
  let watcher: MobileCMJPose | null = null;
  // Flying section: the runner must move at sprint speed, which the gate spacing turns into image widths/s.
  const sprintSpeed = finishX === undefined || !(distanceM > 0) ? 0 : FLYING_MIN_SPEED_MPS * Math.abs(finishX - startX) / distanceM;
  const tracker = new SprintTracker(startX, finishX === undefined ? 0 : finishX - startX, start, sprintSpeed);
  const source = document.createElement('canvas'), crop = document.createElement('canvas');
  const ctx = source.getContext('2d'), cc = crop.getContext('2d');
  // Crops source-resolution pixels BEFORE resizing, so distant runners retain detail.
  const detect = (pose: MobileCMJPose, region: { x: number; y: number; w: number; h: number }, frame: { frameIndex: number; pts: number }, w: number, h: number) => {
    crop.width = 512; crop.height = Math.round(512 * region.h * h / (region.w * w));
    cc!.drawImage(source, region.x * w, region.y * h, region.w * w, region.h * h, 0, 0, crop.width, crop.height);
    return pose.estimate(crop, frame.frameIndex, frame.pts).landmarks
      .map(p => p.map(q => ({ ...q, x: region.x + q.x * region.w, y: region.y + q.y * region.h })));
  };
  const abort = () => decoder.dispose();
  const samples: SprintSample[] = [];
  const sampleAt = new Map<number, number>();
  signal.addEventListener('abort', abort, { once: true });
  let lastYield = performance.now(), lastUpdate = -Infinity;
  let top = 0, bottom = 1;
  const span = d.frames.at(-1)!.pts - d.frames[0].pts, fps = span > 0 ? (d.frames.length - 1) / span : ANALYSIS_FPS;
  const stride = Math.max(1, Math.round(fps / ANALYSIS_FPS)), idleStride = Math.max(stride, Math.round(fps / IDLE_FPS));
  let nextAnalysed = 0, analysed = 0;
  try {
    if (!ctx || !cc) throw new Error('映像処理を開始できません。');
    await untilAborted(model.initialize(signal, message => progress(0, message)), signal); check();
    for (const frame of d.frames) {
      if (frame.frameIndex < nextAnalysed) {
        await untilAborted(decoder.skipExactFrame(frame.frameIndex), signal); check();
        continue;
      }
      nextAnalysed = frame.frameIndex + stride; analysed++;
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
      const roi = { x: Math.max(0, Math.min(.64, tracker.expected(frame.pts) - .18)), y: top, w: .36, h: bottom - top };
      const poses = detect(model, roi, frame, w, h);
      // While the subject is elsewhere, the run-in side is watched with its full height.
      const watch = tracker.watchCentre(frame.pts);
      const region = watch === null ? null : { x: Math.max(0, Math.min(.64, watch - .18)), y: 0, w: .36, h: 1 };
      let watched: { poses: typeof poses; view: readonly [number, number] } | undefined;
      // Any offset matters: a runner entering at the frame edge is outside a crop shifted only partly
      // toward the subject (recorded: the subject's crop covered 0.12-0.48, the runner came in at 0-0.1).
      if (region && Math.abs(region.x - roi.x) > .01 && analysed % 2 === 0) {
        // Image mode: a newcomer is detected at once; in video mode the watcher kept following the people
        // it had already found and saw the runner only 0.26 s later, past the entry (recorded).
        if (!watcher) { watcher = new MobileCMJPose('full', undefined, 'CPU', SPRINT_POSES, 'IMAGE'); await untilAborted(watcher.initialize(signal), signal); check(); }
        watched = { poses: detect(watcher, region, frame, w, h), view: [region.x, region.x + region.w] };
      }
      const selected = tracker.choose(poses, frame.pts, [roi.x, roi.x + roi.w], watched);
      // A nearer, faster runner replaced the subject: its earlier samples belonged to someone else.
      const retracted = tracker.takeRetraction();
      if (retracted !== null) for (let i = samples.length - 1; i >= 0 && samples[i].pts >= retracted; i--) samples[i] = sprintSample([], samples[i].frame, samples[i].pts, w / h);
      // A flying start is confirmed after the runner has been seen for a while:
      // publish those earlier sightings so the entry gate crossing is measured.
      const backfill = tracker.takeBackfill();
      for (const { pts, pose } of backfill) {
        const i = sampleAt.get(pts);
        if (i !== undefined) samples[i] = sprintSample(pose, samples[i].frame, pts, w / h);
      }
      // A newly decided subject may be outside the height band of the previous one.
      if (backfill.length) { top = 0; bottom = 1; }
      if (selected.length) {
        const ys = selected.filter(p => (p.visibility ?? 0) >= .3).map(p => p.y);
        const nextTop = Math.max(0, Math.min(...ys) - .12), nextBottom = Math.min(1, Math.max(...ys) + .12);
        if (nextBottom - nextTop > .2) { top = .8 * top + .2 * nextTop; bottom = .8 * bottom + .2 * nextBottom; }
      }
      sampleAt.set(frame.pts, samples.length);
      samples.push(sprintSample(selected, frame.frameIndex, frame.pts, w / h));
      if (tracker.idle) nextAnalysed = frame.frameIndex + idleStride;
      const now = performance.now();
      if (now - lastUpdate > 100) { progress((frame.frameIndex + 1) / d.frames.length, '選手と脚の動きを解析しています。'); lastUpdate = now; }
      if (now - lastYield > 32) { await new Promise<void>(r => setTimeout(r, 0)); lastYield = performance.now(); check(); }
    }
    progress(1, '解析が終わりました。'); return samples;
  } finally { signal.removeEventListener('abort', abort); decoder.dispose(); model.dispose(); watcher?.dispose(); source.width = crop.width = 0; }
}
