/** The squat / RDL with the camera: each camera frame's pose (MediaPipe in a worker, one frame in flight, the frames
 * the phone cannot keep up with passed over) with the frame's own capture time (src/cmj/camera-clock.ts: on the
 * iPhone the callback's times can belong to another frame). The reps are found from these frames by the same
 * analysis as a recorded video. */
import { CameraClock, drawCameraFrame } from '../cmj/camera-clock';
import { LiveWorkerClient } from '../cmj/live-worker-client';
import type { CrouchFrame } from '../sprint10/crouch';
import { pickAthlete, type Box } from './athlete';

/** The frames sent to the model are at most this many pixels on the long side: at 640 an athlete a third of a
 * landscape picture high (a single-leg RDL filmed wide) was lost and doubled reps; the landmarks are cut from this. */
const LONG_SIDE = 960;
export interface LiveFrame { frame: CrouchFrame; width: number; height: number; backend: 'CPU' | 'GPU'; inferenceMs: number;
  /** Frames handled per second over the last second. */
  fps: number | null }

export async function prepareStrengthWorker(signal: AbortSignal, status: (message: string) => void) {
  if (typeof Worker === 'undefined' || typeof OffscreenCanvas === 'undefined' || typeof createImageBitmap === 'undefined')
    throw new Error('このブラウザではカメラでの解析ができません。録画した動画を読み込んでください。');
  if (signal.aborted) throw new DOMException('中止', 'AbortError');
  const client = new LiveWorkerClient(new Worker(new URL('./live-worker.ts', import.meta.url)), status);
  const abort = () => client.dispose();
  signal.addEventListener('abort', abort, { once: true });
  try {
    await client.request({ type: 'init' }, [], 90_000);
    if (signal.aborted) throw new DOMException('中止', 'AbortError');
    return client;
  }
  catch (e) { client.dispose(); throw e; }
  finally { signal.removeEventListener('abort', abort); }
}

/** Runs until `signal` aborts (or the camera fails): each analysed frame to `onFrame`. */
export async function runLive(video: HTMLVideoElement, client: LiveWorkerClient, signal: AbortSignal, onFrame: (f: LiveFrame) => void): Promise<void> {
  const canvas = document.createElement('canvas'), context = canvas.getContext('2d');
  if (!context) throw new Error('映像処理を開始できません。');
  const clock = new CameraClock(), recent: number[] = [];
  let callback = 0, inflight = false, done = false, n = 0, box: Box | null = null, lastPts = -Infinity, offset = 0;
  const track = (video.srcObject as MediaStream | null)?.getVideoTracks?.()[0] ?? null;
  try {
    await new Promise<void>((resolve, reject) => {
      const clean = () => { done = true; video.cancelVideoFrameCallback(callback); signal.removeEventListener('abort', abort); video.removeEventListener('error', error); track?.removeEventListener('ended', ended); };
      const abort = () => { clean(); resolve(); };
      const error = () => { clean(); reject(new Error('カメラ映像を取得できませんでした。')); };
      const ended = () => { clean(); reject(new Error('カメラの映像が途切れました（電話・ほかのアプリなど）。もう一度「カメラを起動する」を押してください。')); };
      const next: VideoFrameRequestCallback = (now, metadata) => {
        if (done) return;
        callback = video.requestVideoFrameCallback(next);
        const w = video.videoWidth, h = video.videoHeight;
        if (inflight || !w || !h) return;
        inflight = true;
        const k = Math.min(1, LONG_SIDE / Math.max(w, h)), cw = Math.round(w * k), ch = Math.round(h * k);
        if (canvas.width !== cw || canvas.height !== ch) { canvas.width = cw; canvas.height = ch; box = null; }
        let frameTime: number | null;
        try { frameTime = drawCameraFrame(video, context, cw, ch); } catch (e) { clean(); reject(e); return; }
        const timing = clock.read(now, { ...metadata, frameTime });
        // A clock that starts again from a smaller time (camera-clock.ts `reset`) carries on after the last frame.
        if (timing.measurementPts === null) { inflight = false; return; }
        if (timing.reset && timing.measurementPts + offset <= lastPts) offset = lastPts + 1 / 30 - timing.measurementPts;
        const pts = timing.measurementPts + offset;
        if (pts <= lastPts) { inflight = false; return; }
        lastPts = pts;
        void (async () => {
          let image: ImageBitmap | null = null;
          try {
            image = await createImageBitmap(canvas);
            if (done) return;
            const r = await client.request<{ landmarks: { x: number; y: number; visibility: number }[][]; inferenceMs: number; backend: 'CPU' | 'GPU' }>(
              { type: 'frame', image, frame: n, pts: timing.inferencePts }, [image]);
            image = null;
            if (done) return;
            const found = pickAthlete(r.landmarks, box);
            box = found?.b ?? box;
            recent.push(pts); while (recent.length > 2 && recent.at(-1)! - recent[0] > 1) recent.shift();
            const span = recent.length > 1 ? recent.at(-1)! - recent[0] : 0;
            onFrame({ frame: { frame: n++, pts, pose: found ? found.p.map(q => ({ x: q.x, y: q.y, visibility: q.visibility ?? 0 })) : null },
              width: cw, height: ch, backend: r.backend, inferenceMs: r.inferenceMs, fps: span >= .5 ? (recent.length - 1) / span : null });
          } catch (e) { if (!done) { clean(); reject(e); } }
          finally { image?.close(); inflight = false; }
        })();
      };
      signal.addEventListener('abort', abort, { once: true }); video.addEventListener('error', error, { once: true }); track?.addEventListener('ended', ended, { once: true });
      if (signal.aborted) { abort(); return; }
      callback = video.requestVideoFrameCallback(next);
    });
  } finally { client.dispose(); canvas.width = 0; }
}
