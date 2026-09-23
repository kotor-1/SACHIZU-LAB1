import { CameraClock } from './camera-clock';
import { LiveWorkerClient } from './live-worker-client';
import type { MobileCMJPose } from './mobile-pose';
import type { COMPhase, COMResult } from './com-stream';
import type { SessionSummary, SessionUpdate } from './video-session';

type FrameResult = ReturnType<MobileCMJPose['estimate']> & { found: COMResult | null; phase: COMPhase; backend: string };
export async function prepareLiveWorker(signal: AbortSignal, status: (message: string) => void) {
  if (typeof Worker === 'undefined' || typeof OffscreenCanvas === 'undefined' || typeof createImageBitmap === 'undefined') return null;
  let client: LiveWorkerClient | null = null;
  const abort = () => client?.dispose();
  try {
    if (signal.aborted) throw new DOMException('中止', 'AbortError');
    client = new LiveWorkerClient(new Worker(new URL('./live-worker.ts', import.meta.url)), status);
    signal.addEventListener('abort', abort, { once: true });
    await client.request({ type: 'init' }, [], 90_000);
    if (signal.aborted) throw new DOMException('中止', 'AbortError');
    return client;
  } catch (error) {
    client?.dispose();
    if (signal.aborted) throw error;
    status('このブラウザでは互換方式でライブ解析を続けます。'); return null;
  } finally { signal.removeEventListener('abort', abort); }
}

export async function measureLive(video: HTMLVideoElement, client: LiveWorkerClient, signal: AbortSignal,
  update: (value: SessionUpdate) => void): Promise<SessionSummary> {
  const canvas = document.createElement('canvas'), context = canvas.getContext('2d')!;
  const clock = new CameraClock(), results: COMResult[] = [], failures = new Map<string, number>();
  let callback = 0, inflight = false, frame = 0, processed = 0, callbacks = 0;
  let width = 0, height = 0, generation = 0, needsReset = true, done = false, poseFrames = 0, validFrames = 0;
  let averageMs = 0, lastUpdate = -Infinity, phase: COMPhase = 'PREPARING';
  const observed: number[] = [];
  const turn = () => { generation++; needsReset = true; observed.length = 0; };
  try {
    return await new Promise<SessionSummary>((resolve, reject) => {
      const clean = () => {
        done = true; video.cancelVideoFrameCallback(callback);
        signal.removeEventListener('abort', abort); video.removeEventListener('error', error); video.removeEventListener('ended', ended);
        window.removeEventListener('orientationchange', turn); window.screen.orientation?.removeEventListener('change', turn);
      };
      const abort = () => { clean(); reject(new DOMException('中止', 'AbortError')); };
      const error = () => { clean(); reject(new Error('カメラ映像を取得できませんでした。')); };
      const ended = () => { clean(); resolve({ resultCount: results.length,
        estimateCount: results.filter(r => r.analysis.heightCm !== null).length, reason: results.at(-1)?.analysis.reason ?? 'NO_JUMP_DETECTED' }); };
      const next: VideoFrameRequestCallback = (now, metadata) => {
        if (done || signal.aborted) return;
        // Keep observing camera callbacks while inference runs. Only one bitmap
        // is in flight; skipped frames remain visible in the timing diagnostics.
        callback = video.requestVideoFrameCallback(next); callbacks++;
        if (width !== video.videoWidth || height !== video.videoHeight) { width = video.videoWidth; height = video.videoHeight; turn(); }
        if (inflight || !width || !height) return;
        inflight = true;
        const timing = clock.read(now, metadata), epoch = generation;
        if (timing.reset) { needsReset = true; observed.length = 0; }
        const reset = needsReset; needsReset = false;
        const scale = Math.min(1, 720 / Math.max(width, height));
        if (canvas.width !== Math.round(width * scale) || canvas.height !== Math.round(height * scale)) {
          canvas.width = Math.round(width * scale); canvas.height = Math.round(height * scale);
        }
        // Freeze these pixels at the callback timestamp before the async copy.
        try { context.drawImage(video, 0, 0, canvas.width, canvas.height); }
        catch (e) { clean(); reject(e); return; }
        void (async () => {
          let image: ImageBitmap | null = null;
          try {
            image = await createImageBitmap(canvas);
            if (done || signal.aborted || epoch !== generation) { needsReset = true; return; }
            const r = await client.request<FrameResult>({ type: 'frame', image, frame: frame++, inferencePts: timing.inferencePts,
              measurementPts: timing.measurementPts, reset }, [image]);
            if (done || signal.aborted || epoch !== generation) { needsReset = true; return; }
            processed++; if (r.landmarks.length === 1) poseFrames++;
            if (r.comSample.comY !== null) validFrames++;
            else if (r.comSample.reason) failures.set(r.comSample.reason, (failures.get(r.comSample.reason) ?? 0) + 1);
            averageMs = averageMs ? .8 * averageMs + .2 * r.inferenceMs : r.inferenceMs;
            if (timing.measurementPts !== null) observed.push(timing.measurementPts);
            while (observed.length > 2 && observed.at(-1)! - observed[0] > 1) observed.shift();
            const span = observed.length > 1 ? observed.at(-1)! - observed[0] : 0;
            const effectiveFps = span >= .25 ? (observed.length - 1) / span : null;
            const maxGapMs = observed.length > 1 ? Math.max(...observed.slice(1).map((t, i) => (t - observed[i]) * 1000)) : null;
            if (r.found) { results.push({ ...r.found, id: (results.at(-1)?.id ?? 0) + 1 }); if (results.length > 100) results.shift(); }
            const changed = phase !== r.phase; phase = r.phase;
            if (now - lastUpdate < 50 && !r.found && !changed) return;
            lastUpdate = now;
            update({ phase, results: [...results], backend: r.backend, processedFrames: processed,
              sourcePts: timing.elapsed, inferenceMs: averageMs, playbackRate: 1,
              slowDevice: effectiveFps !== null && effectiveFps < 40,
              landmarks: r.landmarks.length === 1 ? r.landmarks[0] : [],
              com: r.comSample.comX === null || r.comSample.comY === null ? null : { x: r.comSample.comX / 960, y: r.comSample.comY / 960 },
              observationReason: timing.measurementPts === null ? 'CAMERA_TIME_UNAVAILABLE' : r.comSample.reason ?? null,
              detectedPeople: r.landmarks.length, cameraTiming: timing.source ?? 'unavailable', acquisition: 'LIVE', poseModel: 'lite',
              processingThread: 'worker', effectiveFps, maxGapMs, skippedCameraFrames: callbacks - processed,
              quality: { poseFrames, validFrames, reasons: Object.fromEntries(failures) } });
          } catch (e) { if (!done) { clean(); reject(e); } }
          finally { image?.close(); inflight = false; }
        })();
      };
      signal.addEventListener('abort', abort, { once: true }); video.addEventListener('error', error, { once: true }); video.addEventListener('ended', ended, { once: true });
      window.addEventListener('orientationchange', turn); window.screen.orientation?.addEventListener('change', turn);
      if (signal.aborted) { abort(); return; }
      callback = video.requestVideoFrameCallback(next);
    });
  } finally { client.dispose(); video.cancelVideoFrameCallback(callback); video.pause(); canvas.width = 0; }
}
