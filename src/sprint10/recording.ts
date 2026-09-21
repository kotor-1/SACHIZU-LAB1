import { demuxMP4 } from '../frame-engine/mp4-demuxer';
import { SequentialRecordingDecoder } from '../cmj/sequential-decoder';
import { MobileCMJPose } from '../cmj/mobile-pose';
import { trackRotation } from '../cmj/video-orientation';
import { untilAborted } from '../cmj/session-lifecycle';
import { sprintSample, type SprintSample } from './analysis';
import { SprintTracker } from './tracker';

export async function measureSprint(file: File, startX: number, signal: AbortSignal,
  progress: (fraction: number, message: string) => void): Promise<SprintSample[]> {
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
  const model = new MobileCMJPose('full');
  const tracker = new SprintTracker(startX);
  const source = document.createElement('canvas'), crop = document.createElement('canvas');
  const ctx = source.getContext('2d'), cc = crop.getContext('2d');
  const abort = () => decoder.dispose();
  const samples: SprintSample[] = [];
  signal.addEventListener('abort', abort, { once: true });
  let lastYield = performance.now(), lastUpdate = -Infinity;
  let top = 0, bottom = 1;
  try {
    if (!ctx || !cc) throw new Error('映像処理を開始できません。');
    await untilAborted(model.initialize(signal, message => progress(0, message)), signal); check();
    for (const frame of d.frames) {
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
      // Crop source-resolution pixels BEFORE resizing, so distant runners retain detail.
      const roi = { x: Math.max(0, Math.min(.64, tracker.expected(frame.pts) - .18)), y: top, w: .36, h: bottom - top };
      crop.width = 512; crop.height = Math.round(512 * roi.h * h / (roi.w * w));
      cc.drawImage(source, roi.x * w, roi.y * h, roi.w * w, roi.h * h, 0, 0, crop.width, crop.height);
      const poses = model.estimate(crop, frame.frameIndex, frame.pts).landmarks
        .map(p => p.map(q => ({ ...q, x: roi.x + q.x * roi.w, y: roi.y + q.y * roi.h })));
      const selected = tracker.choose(poses, frame.pts);
      if (selected.length) {
        const ys = selected.filter(p => (p.visibility ?? 0) >= .3).map(p => p.y);
        const nextTop = Math.max(0, Math.min(...ys) - .12), nextBottom = Math.min(1, Math.max(...ys) + .12);
        if (nextBottom - nextTop > .2) { top = .8 * top + .2 * nextTop; bottom = .8 * bottom + .2 * nextBottom; }
      }
      samples.push(sprintSample(selected, frame.frameIndex, frame.pts, w / h));
      const now = performance.now();
      if (now - lastUpdate > 100) { progress((frame.frameIndex + 1) / d.frames.length, '選手と脚の動きを解析しています。'); lastUpdate = now; }
      if (now - lastYield > 32) { await new Promise<void>(r => setTimeout(r, 0)); lastYield = performance.now(); check(); }
    }
    progress(1, '解析が終わりました。'); return samples;
  } finally { signal.removeEventListener('abort', abort); decoder.dispose(); model.dispose(); source.width = crop.width = 0; }
}
