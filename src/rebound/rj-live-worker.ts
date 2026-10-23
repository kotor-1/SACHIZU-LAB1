import { MobileCMJPose } from '../cmj/mobile-pose';
import { soleMeter } from './sole-meter';
import type { RJFrameRequest, RJFrameResult, RJLiveRequest } from './rj-live-protocol';

// Built as one classic-worker bundle, like the CMJ camera's (cmj/live-worker.ts), so the MediaPipe WASM loader can
// use importScripts. No camera frame leaves this browser.
//
// Unlike the CMJ camera, which reads the newest frame whenever it is free, the RJ camera sends every frame of a set
// and this worker answers them one by one in order: a contact lasts 0.15-0.25 s, so a frame left out is a contact
// moment lost (the user, 2026-10-22: RJ from the camera again, after CMJ's camera measured about 40 athletes well).
const scope = self as unknown as { postMessage: (value: unknown) => void; onmessage: ((event: MessageEvent<RJLiveRequest>) => void) | null };
let pose: MobileCMJPose | null = null, warmed = false, emptyGpu = 0, seenPerson = false;
let meter: ReturnType<typeof soleMeter> | null = null;
let picture: OffscreenCanvas | null = null, context: OffscreenCanvasRenderingContext2D | null = null;
const status = (message: string) => scope.postMessage({ status: message });
async function initialize(delegate: 'CPU' | 'GPU') {
  // Full, as a chosen video's RJ analysis (a lighter model would move the toes).
  pose?.dispose();
  pose = new MobileCMJPose('full', undefined, delegate);
  await pose.initialize(new AbortController().signal, status);
}
/** The model's picture, drawn from the frame as a chosen video's is drawn from its decoded frame. */
function poseInput(image: ImageBitmap, width: number, height: number) {
  if (!picture) { picture = new OffscreenCanvas(width, height); context = picture.getContext('2d'); }
  if (!context) throw new Error('映像処理を開始できませんでした。ブラウザを再起動してください。');
  if (picture.width !== width || picture.height !== height) { picture.width = width; picture.height = height; }
  context.drawImage(image, 0, 0, width, height);
  return picture;
}
async function frame(data: RJFrameRequest): Promise<RJFrameResult> {
  const started = performance.now(), image = data.image;
  try {
    if (!pose) throw new Error('MODEL_NOT_READY');
    const input = poseInput(image, data.poseWidth, data.poseHeight);
    let r;
    try {
      if (!warmed) pose.warm(input);
      r = pose.estimate(input, data.frame, data.inferencePts);
    } catch (error) {
      // Some browsers start a GPU task but cannot run it off the page: CPU, before anyone was found only.
      if (warmed || pose.backend !== 'GPU') throw error;
      await initialize('CPU'); pose.warm(input);
      r = pose.estimate(input, data.frame, data.inferencePts);
    }
    warmed = true;
    // A GPU task can start but never find anyone; try CPU only before GPU has found someone (leaving the picture is not a GPU failure).
    if (r.landmarks.length > 0) seenPerson = true;
    if (pose.backend === 'GPU' && !seenPerson && r.landmarks.length === 0 && ++emptyGpu >= 15) {
      emptyGpu = 0; await initialize('CPU'); pose.warm(input);
      r = pose.estimate(input, data.frame, data.inferencePts);
    } else if (r.landmarks.length > 0) emptyGpu = 0;
    const sole = data.sole && meter ? meter(image, 0, r.landmarks, data.frame, data.pts) : null;
    return { landmarks: r.landmarks, sole, inferenceMs: r.inferenceMs, workMs: performance.now() - started, backend: pose.backend };
  } finally { image.close(); }
}
async function handle(data: RJLiveRequest) {
  const { id } = data;
  try {
    if (data.type === 'init') {
      warmed = false; emptyGpu = 0; seenPerson = false;
      try { await initialize('GPU'); }
      catch { await initialize('CPU'); }
      scope.postMessage({ id, result: { backend: pose!.backend } }); return;
    }
    if (data.type === 'set') { meter = soleMeter(() => new OffscreenCanvas(1, 1)); scope.postMessage({ id, result: {} }); return; }
    scope.postMessage({ id, result: await frame(data) });
  } catch (error) { scope.postMessage({ id, error: error instanceof Error ? error.message : String(error) }); }
}
// One message at a time, in the order sent: a CPU switch waits for its model, and the next frame waits for it.
let queue = Promise.resolve();
scope.onmessage = ({ data }) => { queue = queue.then(() => handle(data)); };
