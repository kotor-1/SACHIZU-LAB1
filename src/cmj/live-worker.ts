import { MobileCMJPose } from './mobile-pose';
import { COMStream } from './com-stream';
import { LiveProfile } from './live-profile';

// Built as one classic-worker bundle so the MediaPipe WASM loader can use
// importScripts. No camera/network frames are sent outside this browser.
const scope = self as unknown as { postMessage: (value: unknown) => void; onmessage: ((event: MessageEvent) => void) | null };
let pose: MobileCMJPose, stream = new COMStream(), warmed = false;
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
      pose?.dispose(); stream = new COMStream(); profile = new LiveProfile(); warmed = false;
      try { await initialize('GPU'); }
      catch { pose?.dispose(); await initialize('CPU'); }
      scope.postMessage({ id, result: { ready: true } }); return;
    }
    if (data.type !== 'frame') return;
    const image = data.image as ImageBitmap;
    try {
      if (data.reset) stream = new COMStream();
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
      const choice = profile.observe(r.inferenceMs, r.landmarks.length);
      if (choice === 'lite') {
        const backend = pose.backend;
        status('処理速度に合わせて軽量モデルへ切り替えています。静止してお待ちください。');
        pose.dispose(); await initialize(backend, 'lite'); pose.warm(image);
        r = pose.estimate(image, data.frame, data.inferencePts);
        stream = new COMStream();
      }
      const warmingUp = choice !== 'ready';
      const found = warmingUp || data.measurementPts === null ? null
        : stream.push({ ...r.comSample, pts: data.measurementPts });
      scope.postMessage({ id, result: { ...r, found, phase: stream.phase, backend: pose.backend,
        poseModel: pose.variant, warmingUp, profileReason: profile.reason } });
    } finally { image.close(); }
  } catch (error) { scope.postMessage({ id, error: error instanceof Error ? error.message : String(error) }); }
};
