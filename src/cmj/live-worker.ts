import { MobileCMJPose } from './mobile-pose';
import { COMStream } from './com-stream';
import { LiveProfile } from './live-profile';
import type { LiveFrameResult, LiveWorkerRequest } from './live-protocol';

// Built as one classic-worker bundle so the MediaPipe WASM loader can use
// importScripts. No camera/network frames are sent outside this browser.
const scope = self as unknown as { postMessage: (value: unknown) => void; onmessage: ((event: MessageEvent<LiveWorkerRequest>) => void) | null };
let pose: MobileCMJPose, stream = new COMStream(), warmed = false, emptyGpu = 0, seenPerson = false, completedMovement = false;
let profile = new LiveProfile();
const status = (message: string) => scope.postMessage({ status: message });
async function initialize(delegate: 'CPU' | 'GPU', variant: 'full' | 'lite' = 'full') {
  pose = new MobileCMJPose(variant, undefined, delegate);
  await pose.initialize(new AbortController().signal, status);
}
scope.onmessage = async ({ data }) => {
  const { id } = data;
  try {
    if (data.type === 'init') {
      pose?.dispose(); stream = new COMStream(); profile = new LiveProfile(); warmed = false; emptyGpu = 0;
      seenPerson = false; completedMovement = false;
      try { await initialize('GPU'); }
      catch { pose?.dispose(); await initialize('CPU'); }
      scope.postMessage({ id, result: { ready: true } }); return;
    }
    if (data.type !== 'frame') return;
    const image = data.image as ImageBitmap;
    try {
      if (data.reset) { stream = new COMStream(); profile.resetTiming(); completedMovement = false; }
      let profileChanged = false;
      let r;
      try {
        if (!warmed) pose.warm(image);
        r = pose.estimate(image, data.frame, data.inferencePts);
      } catch (error) {
        // Some browsers initialize a GPU task but cannot infer in an offscreen
        // context. Only fall back before any observation has been accepted.
        if (warmed || pose.backend !== 'GPU') throw error;
        pose.dispose(); await initialize('CPU'); pose.warm(image);
        r = pose.estimate(image, data.frame, data.inferencePts);
      }
      warmed = true;
      // A GPU delegate can initialize but never find a person. Probe CPU only
      // before GPU has found anyone: leaving the picture is not GPU failure.
      if (r.landmarks.length > 0) seenPerson = true;
      if (pose.backend === 'GPU' && !seenPerson && r.landmarks.length === 0 && ++emptyGpu >= 15) {
        emptyGpu = 0; pose.dispose(); await initialize('CPU'); pose.warm(image);
        r = pose.estimate(image, data.frame, data.inferencePts);
        stream = new COMStream(); profile = new LiveProfile(); completedMovement = false; profileChanged = true;
      } else if (r.landmarks.length > 0) emptyGpu = 0;
      const choice = profile.observe(r.inferenceMs, r.landmarks.length, {
        previousProcessingMs: data.reset || profileChanged ? null : data.previousProcessingMs,
        canSwitch: stream.phase === 'PREPARING' || completedMovement,
      });
      completedMovement = false;
      if (choice === 'lite') {
        const backend = pose.backend;
        status('処理速度に合わせて軽量モデルへ切り替えています。静止してお待ちください。');
        pose.dispose();
        try {
          await initialize(backend, 'lite'); pose.warm(image);
          r = pose.estimate(image, data.frame, data.inferencePts);
        } catch (error) {
          // Changing the model starts a fresh stream; an actual GPU error can
          // safely fall back here, without mixing delegates in a measurement.
          if (backend !== 'GPU') throw error;
          pose.dispose(); await initialize('CPU', 'lite'); pose.warm(image);
          r = pose.estimate(image, data.frame, data.inferencePts);
        }
        stream = new COMStream(); profileChanged = true;
      }
      const warmingUp = choice !== 'ready';
      const found = warmingUp || data.measurementPts === null ? null
        : stream.push({ ...r.comSample, pts: data.measurementPts }, data.allowMovement ?? true);
      completedMovement = found !== null;
      const result: LiveFrameResult = { ...r, found, phase: stream.phase, backend: pose.backend,
        poseModel: pose.variant === 'lite' ? 'lite' : 'full', warmingUp, profileReason: profile.reason,
        profileChanged, streamDiagnostics: stream.diagnostics };
      scope.postMessage({ id, result });
    } finally { image.close(); }
  } catch (error) { scope.postMessage({ id, error: error instanceof Error ? error.message : String(error) }); }
};
