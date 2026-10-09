import { MobileCMJPose } from '../cmj/mobile-pose';

/** The camera's frames for the squat / RDL: MediaPipe (full, two people a frame) off the page's thread, as the CMJ's
 * camera (src/cmj/live-worker.ts: the GPU where it works, else the CPU). Only the points go back; nothing leaves the
 * browser. */
const scope = self as unknown as { postMessage: (value: unknown) => void; onmessage: ((event: MessageEvent) => void) | null };
let pose: MobileCMJPose | null = null, warmed = false, seenPerson = false, emptyGpu = 0;
const status = (message: string) => scope.postMessage({ status: message });
async function initialize(delegate: 'CPU' | 'GPU') {
  pose?.dispose(); pose = new MobileCMJPose('full', undefined, delegate, 2);
  await pose.initialize(new AbortController().signal, status); warmed = false;
}
scope.onmessage = async ({ data }) => {
  const { id } = data;
  try {
    if (data.type === 'init') {
      seenPerson = false; emptyGpu = 0;
      try { await initialize('GPU'); } catch { await initialize('CPU'); }
      scope.postMessage({ id, result: { ready: true, backend: pose!.backend } }); return;
    }
    if (data.type !== 'frame' || !pose) return;
    const image = data.image as ImageBitmap;
    try {
      let r;
      try { if (!warmed) pose.warm(image); r = pose.estimate(image, data.frame, data.pts); }
      catch (error) {
        // A GPU task may start but fail offscreen: fall back to the CPU before anyone is found.
        if (warmed || pose.backend !== 'GPU') throw error;
        await initialize('CPU'); pose.warm(image); r = pose.estimate(image, data.frame, data.pts);
      }
      warmed = true;
      if (r.landmarks.length) { seenPerson = true; emptyGpu = 0; }
      else if (pose.backend === 'GPU' && !seenPerson && ++emptyGpu >= 15) {
        emptyGpu = 0; await initialize('CPU'); pose.warm(image); r = pose.estimate(image, data.frame, data.pts);
      }
      scope.postMessage({ id, result: { landmarks: r.landmarks.map(p => p.map(q => ({ x: q.x, y: q.y, visibility: q.visibility ?? 0 }))),
        inferenceMs: r.inferenceMs, backend: pose.backend } });
    } finally { image.close(); }
  } catch (error) { scope.postMessage({ id, error: error instanceof Error ? error.message : String(error) }); }
};
