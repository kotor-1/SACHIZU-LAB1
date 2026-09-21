import { demuxMP4 } from '../frame-engine/mp4-demuxer';
import { SequentialRecordingDecoder } from './sequential-decoder';
import { trackRotation } from './video-orientation';
import { MobileCMJPose, type PoseSelector } from './mobile-pose';
import { COMStream, type COMResult } from './com-stream';
import type { SessionSummary, SessionUpdate } from './video-session';
import { untilAborted } from './session-lifecycle';
import type { COMSample } from './center-of-mass';
import type { NormalizedLandmark } from '@mediapipe/tasks-vision';

export interface RecordingOptions {
  analysis?: 'CMJ' | 'OBSERVATIONS';
  onSample?: (sample: COMSample) => void;
  selectPose?: PoseSelector;
  onPose?: (poses: NormalizedLandmark[][], frame: number, pts: number) => void;
}

export function supportsExactRecording(file: File): boolean {
  return /\.(mp4|mov|m4v)$/i.test(file.name) && SequentialRecordingDecoder.isAvailable();
}

/** Deterministic source frames, serialized inference and bounded decode-ahead.
 * Device speed changes completion time, never which source frames are used. */
export async function measureRecording(file: File, canvas: HTMLCanvasElement, signal: AbortSignal,
  update: (state: SessionUpdate) => void, status: (message: string) => void = () => {}, options: RecordingOptions = {}): Promise<SessionSummary> {
  const check = () => { if (signal.aborted) throw new DOMException('中止', 'AbortError'); };
  check();
  if (file.size > 150 * 1024 * 1024) throw new Error('150MB以内の動画を選んでください。ジャンプの前後を残して短くすると解析できます。');
  status('動画のフレームと撮影時刻を読み込んでいます。');
  const d = await untilAborted(demuxMP4(file), signal); check();
  if (!d.frames.length || d.frames.length > 3600 || d.frames.at(-1)!.pts - d.frames[0].pts > 30)
    throw new Error('30秒以内・3600フレーム以内の動画を選んでください。');
  const rotation = trackRotation((d.videoTrack as typeof d.videoTrack & { matrix?: ArrayLike<number> }).matrix);
  const decoder = new SequentialRecordingDecoder(file, d.videoTrack, d.frames, d.rawSamples, d.descriptionBuffer);
  const pose = new MobileCMJPose('full', options.selectPose);
  const abortDecode = () => decoder.dispose();
  signal.addEventListener('abort', abortDecode, { once: true });
  // Full source sampling can resolve a shorter recorded standing segment;
  // keep live preparation longer for actionable real-time guidance.
  const stream = new COMStream(.2);
  const results: COMResult[] = [];
  const failures = new Map<string, number>();
  let valid = 0, prepared = false, averageMs = 0, lastUpdate = -Infinity, lastYield = performance.now();
  const started = performance.now();
  const context = canvas.getContext('2d');
  if (!context) { signal.removeEventListener('abort', abortDecode); decoder.dispose(); throw new Error('映像処理を開始できませんでした。ブラウザを再起動してください。'); }
  let latest: SessionUpdate = { phase: 'PREPARING', results, backend: 'CPU', processedFrames: 0,
    sourcePts: 0, inferenceMs: 0, playbackRate: 0, slowDevice: false, landmarks: [], com: null,
    observationReason: null, totalFrames: d.frames.length, acquisition: 'EXACT_FRAMES', poseModel: pose.variant };
  try {
    await untilAborted(pose.initialize(signal, status), signal); check();
    for (const f of d.frames) {
      check();
      const decoded = await untilAborted(decoder.decodeExactFrame(f.frameIndex).then(result => {
        if (signal.aborted) decoder.dispose(); // release any bitmap created after cancellation
        return result;
      }), signal); check();
      if (decoded.status !== 'SUCCESS' || !decoded.bitmap || decoded.actualDecodedFrameIndex !== f.frameIndex)
        throw new Error('この動画のフレームを読み出せませんでした。標準カメラの互換性優先（H.264）で撮影したMP4をお試しください。');
      const bitmap = decoded.bitmap;
      const portrait = rotation % 180 !== 0;
      const w = portrait ? bitmap.height : bitmap.width, h = portrait ? bitmap.width : bitmap.height;
      const scale = Math.min(1, 720 / Math.max(w, h));
      if (canvas.width !== Math.round(w * scale) || canvas.height !== Math.round(h * scale)) {
        canvas.width = Math.round(w * scale); canvas.height = Math.round(h * scale);
      }
      context.translate(canvas.width / 2, canvas.height / 2);
      context.rotate(rotation * Math.PI / 180); context.scale(scale, scale);
      context.drawImage(bitmap, -bitmap.width / 2, -bitmap.height / 2);
      context.setTransform(1, 0, 0, 1, 0, 0);
      const r = pose.estimate(canvas, f.frameIndex, f.pts); check();
      options.onSample?.(r.comSample);
      options.onPose?.(r.landmarks, f.frameIndex, f.pts);
      averageMs = averageMs ? .8 * averageMs + .2 * r.inferenceMs : r.inferenceMs;
      if (r.comSample.comY !== null) valid++;
      else if (r.comSample.reason) failures.set(r.comSample.reason, (failures.get(r.comSample.reason) ?? 0) + 1);
      const result = options.analysis === 'OBSERVATIONS' ? null : stream.push(r.comSample); if (result) results.push(result);
      if (stream.phase === 'READY') prepared = true;
      latest = { ...latest, phase: stream.phase, results: [...results], processedFrames: latest.processedFrames + 1,
        sourcePts: f.pts, inferenceMs: averageMs, landmarks: r.landmarks.length === 1 ? r.landmarks[0] : [],
        com: r.comSample.comX === null || r.comSample.comY === null ? null : { x: r.comSample.comX / 960, y: r.comSample.comY / 960 },
        observationReason: r.comSample.reason ?? null, processingMs: performance.now() - started };
      // Inference still runs for EVERY frame. Only React/status updates are
      // throttled; per-frame timer clamping must not impose playback pacing.
      const now = performance.now();
      if (now - lastUpdate >= 100 || result) { update(latest); lastUpdate = now; }
      if (now - lastYield >= 32) {
        await new Promise<void>(resolve => setTimeout(resolve, 0)); lastYield = performance.now();
      }
    }
    check(); const final = options.analysis === 'OBSERVATIONS' ? null : stream.end(); if (final) results.push(final);
    update({ ...latest, phase: 'PREPARING', results: [...results], landmarks: [], com: null,
      processingMs: performance.now() - started, decodeDiagnostics: { ...decoder.diagnostics } });
    const reason = results.length ? results.at(-1)!.analysis.reason ?? null : valid < d.frames.length / 2
      ? [...failures].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'COM_TRACKING_LOST'
      : prepared ? 'NO_JUMP_DETECTED' : 'PREPARATION_NOT_CONFIRMED';
    return { resultCount: results.length, estimateCount: results.filter(r => r.analysis.heightCm !== null).length, reason };
  } finally { signal.removeEventListener('abort', abortDecode); decoder.dispose(); pose.dispose(); }
}
