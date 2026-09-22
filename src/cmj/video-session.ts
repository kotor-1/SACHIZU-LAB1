import { MobileCMJPose } from './mobile-pose';
import { COMStream, type COMPhase, type COMResult } from './com-stream';
import { untilAborted } from './session-lifecycle';

export interface SessionUpdate {
  phase: COMPhase; results: COMResult[]; backend: string;
  processedFrames: number; sourcePts: number; inferenceMs: number;
  playbackRate: number; slowDevice: boolean;
  landmarks: { x: number; y: number }[];
  com: { x: number; y: number } | null;
  observationReason: string | null;
  totalFrames?: number;
  acquisition?: 'EXACT_FRAMES' | 'PLAYBACK' | 'LIVE';
  poseModel?: 'lite' | 'full';
  processingMs?: number;
  quality?: { poseFrames: number; validFrames: number; reasons: Record<string, number>; retriedFrames?: number; recoveredFrames?: number };
  decodeDiagnostics?: { submittedSamples: number; emittedFrames: number; maxRetainedFrames: number; configureCount: number };
}
export interface SessionSummary { resultCount: number; estimateCount: number; reason: string | null }
/** Recorded playback can slow down without changing source timestamps.
 * A camera cannot slow physical time: gaps are rejected, never interpolated. */
export async function measureVideo(video: HTMLVideoElement, mode: 'camera' | 'file', signal: AbortSignal,
  update: (state: SessionUpdate) => void, status: (message: string) => void = () => {}): Promise<SessionSummary> {
  if (!video.requestVideoFrameCallback) throw new Error('このブラウザは映像の時刻取得に未対応です。OSとブラウザを更新してください。');
  const check = () => { if (signal.aborted) throw new DOMException('中止', 'AbortError'); };
  const pose = new MobileCMJPose(mode === 'camera' ? 'lite' : 'full');
  let callback = 0;
  const stream = new COMStream();
  const results: COMResult[] = [];
  let lastPts = -1, frame = 0, averageMs = 0, slowSince: number | null = null;
  let validFrames = 0, poseFrames = 0;
  let prepared = false;
  const observationFailures = new Map<string, number>();
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  const snapshot = () => {
    const scale = Math.min(1, 720 / Math.max(video.videoWidth, video.videoHeight));
    const w = Math.round(video.videoWidth * scale), h = Math.round(video.videoHeight * scale);
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    ctx.drawImage(video, 0, 0, w, h);
  };
  try {
    check(); await untilAborted(pose.initialize(signal, status), signal); check();
    // Keep the first (usually slowest) inference on the same bounded-size input
    // as every measured frame. Passing a 4K/1080p video element here can stall a
    // low-end phone before playback even starts.
    snapshot(); status('最初の映像を確認しています。'); pose.warm(canvas); check();
    return await new Promise<SessionSummary>((resolve, reject) => {
      const clean = () => {
        video.cancelVideoFrameCallback(callback);
        signal.removeEventListener('abort', abort);
        video.removeEventListener('ended', ended);
        video.removeEventListener('error', error);
        video.removeEventListener('seeking', seek);
      };
      const abort = () => { clean(); reject(new DOMException('中止', 'AbortError')); };
      const error = () => { clean(); reject(new Error('動画を再生できません。この端末が対応する録画形式を選んでください。')); };
      const seek = () => { clean(); reject(new Error('再生位置が変わったため計測を終了しました。最初から再計測してください。')); };
      const ended = () => {
        const final = stream.end(); if (final) results.push(final);
        update({ phase: 'PREPARING', results: [...results], backend: pose.backend, processedFrames: frame,
          sourcePts: lastPts, inferenceMs: averageMs, playbackRate: video.playbackRate, slowDevice: false, landmarks: [], com: null, observationReason: null,
          acquisition: mode === 'camera' ? 'LIVE' : 'PLAYBACK', poseModel: pose.variant,
          quality: { poseFrames, validFrames, reasons: Object.fromEntries(observationFailures) } });
        clean(); resolve({ resultCount: results.length,
          estimateCount: results.filter(result => result.analysis.heightCm !== null).length,
          reason: results.length ? results.at(-1)!.analysis.reason ?? null : (validFrames < frame / 2
            ? [...observationFailures].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'COM_TRACKING_LOST'
            : prepared ? 'NO_JUMP_DETECTED' : 'PREPARATION_NOT_CONFIRMED') });
      };
      const next = (_now: number, meta: VideoFrameCallbackMetadata) => {
        try {
          check();
          if (meta.mediaTime < lastPts) { seek(); return; }
          if (meta.mediaTime > lastPts) {
            const pts = meta.mediaTime; lastPts = pts;
            snapshot();
            const r = pose.estimate(canvas, frame++, pts);
            if (r.landmarks.length === 1) poseFrames++;
            if (r.comSample.comY !== null) validFrames++;
            else if (r.comSample.reason) observationFailures.set(r.comSample.reason, (observationFailures.get(r.comSample.reason) ?? 0) + 1);
            averageMs = averageMs ? .8 * averageMs + .2 * r.inferenceMs : r.inferenceMs;
            const found = stream.push(r.comSample); if (found) results.push(found);
            if (stream.phase === 'READY') prepared = true;
            if (mode === 'file') video.playbackRate = Math.max(.1, Math.min(1, 20 / Math.max(1, averageMs)));
            if (mode === 'camera' && averageMs > 40) slowSince ??= pts;
            else slowSince = null;
            update({ phase: stream.phase, results: results.slice(-100), backend: pose.backend,
              processedFrames: frame, sourcePts: pts, inferenceMs: averageMs,
              playbackRate: video.playbackRate, slowDevice: slowSince !== null && pts - slowSince > 1,
              landmarks: r.landmarks.length === 1 ? r.landmarks[0] : [],
              observationReason: r.comSample.reason ?? null,
              acquisition: mode === 'camera' ? 'LIVE' : 'PLAYBACK',
              poseModel: pose.variant,
              quality: { poseFrames, validFrames, reasons: Object.fromEntries(observationFailures) },
              com: r.comSample.comX === null || r.comSample.comY === null ? null
                : { x: r.comSample.comX / 960, y: r.comSample.comY / 960 } });
            if (results.length > 100) results.shift();
          }
          callback = video.requestVideoFrameCallback(next);
        } catch (e) { clean(); reject(e); }
      };
      signal.addEventListener('abort', abort, { once: true });
      video.addEventListener('ended', ended, { once: true });
      video.addEventListener('error', error, { once: true });
      video.addEventListener('seeking', seek, { once: true });
      callback = video.requestVideoFrameCallback(next);
      video.play().catch(e => { clean(); reject(e); });
    });
  } finally { video.cancelVideoFrameCallback(callback); video.pause(); video.playbackRate = 1; pose.dispose(); }
}
