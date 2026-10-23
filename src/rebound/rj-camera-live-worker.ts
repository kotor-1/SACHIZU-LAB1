// The RJ camera's frame reader (2026-10-22). It takes EVERY frame of the camera from a MediaStreamTrackProcessor
// (Safari 18 and later in a worker, Chrome), with the frame's own capture time, upright and 960 px high, and passes
// it on at once. The page's requestVideoFrameCallback sees only frames shown on the screen, and Safari draws a page
// near 60 times a second even on a 120 Hz iPhone: with a 60 fps camera, frames arriving in the same screen update were
// lost (2 of 1,068 in Chrome's test camera, each costing its whole RJ cycle). Nothing here is sent outside the browser.
import { SOLE_CONTACT_SETTINGS } from './sole-contact';

interface FrameReader { read(): Promise<{ value?: VideoFrame; done: boolean }>; cancel(): Promise<void> }
type Processor = new (init: { track: MediaStreamTrack; maxBufferSize?: number }) => { readable: ReadableStream<VideoFrame> };
const scope = self as unknown as { postMessage: (value: unknown, transfer?: Transferable[]) => void;
  onmessage: ((event: MessageEvent) => void) | null; MediaStreamTrackProcessor?: Processor };

let reader: FrameReader | null = null, track: MediaStreamTrack | null = null;
/** Degrees the camera's frames turn to stand as the page shows them; null until compared with the page's picture. */
let rotation: number | null = null;
let upright: { pixels: Uint8ClampedArray; width: number; height: number } | null = null;
let tries = 0;
const canvas = new OffscreenCanvas(1, 1), context = canvas.getContext('2d', { willReadFrequently: true })!;

const gray = (d: Uint8ClampedArray, i: number) => 77 * d[i * 4] + 150 * d[i * 4 + 1] + 29 * d[i * 4 + 2];
/** The frame drawn turned by `degrees`, fitted into width x height. */
function draw(frame: VideoFrame, degrees: number, width: number, height: number) {
  if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
  const turned = degrees % 180 !== 0, fw = turned ? height : width, fh = turned ? width : height;
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.translate(width / 2, height / 2); context.rotate(degrees * Math.PI / 180);
  context.drawImage(frame, -fw / 2, -fh / 2, fw, fh);
  context.setTransform(1, 0, 0, 1, 0, 0);
}
/** Which turn makes the camera's frame look like the page's picture of it (the scene is still while the camera is set up). */
function compare(frame: VideoFrame) {
  if (!upright) return;
  const { width, height, pixels } = upright, portrait = height > width, framePortrait = frame.displayHeight > frame.displayWidth;
  const scores = (portrait === framePortrait ? [0, 180] : [90, 270]).map(degrees => {
    draw(frame, degrees, width, height);
    const d = context.getImageData(0, 0, width, height).data;
    let sum = 0;
    for (let i = 0; i < width * height; i++) sum += Math.abs(gray(d, i) - gray(pixels, i));
    return { degrees, score: sum / (width * height) };
  }).sort((a, b) => a.score - b.score);
  // A clear winner, or the better one after a few frames (a dark or plain scene).
  if (scores[0].score < .8 * scores[1].score || ++tries >= 10) {
    rotation = scores[0].degrees; upright = null;
    scope.postMessage({ type: 'rotation', degrees: rotation, scores });
  }
}
function send(frame: VideoFrame) {
  const turned = rotation! % 180 !== 0;
  const w = turned ? frame.displayHeight : frame.displayWidth, h = turned ? frame.displayWidth : frame.displayHeight;
  const height = SOLE_CONTACT_SETTINGS.imageHeight, width = Math.round(w * height / h);
  draw(frame, rotation!, width, height);
  const image = canvas.transferToImageBitmap();
  scope.postMessage({ type: 'frame', image, pts: frame.timestamp / 1e6, width: w, height: h }, [image]);
}
async function read() {
  for (;;) {
    let result;
    try { result = await reader!.read(); }
    catch (error) { scope.postMessage({ type: 'error', message: error instanceof Error ? error.message : String(error) }); return; }
    const frame = result.value;
    if (result.done || !frame) { scope.postMessage({ type: 'ended' }); return; }
    try {
      if (rotation === null) compare(frame);
      else send(frame);
    } catch (error) { scope.postMessage({ type: 'error', message: error instanceof Error ? error.message : String(error) }); }
    finally { frame.close(); }
  }
}
scope.onmessage = ({ data }) => {
  if (data.type === 'start') {
    try {
      const readable: ReadableStream<VideoFrame> | undefined = data.readable ??
        (data.track && scope.MediaStreamTrackProcessor ? new scope.MediaStreamTrackProcessor({ track: data.track, maxBufferSize: 30 }).readable : undefined);
      if (!readable) { scope.postMessage({ type: 'unsupported' }); return; }
      track = data.track ?? null;
      reader = readable.getReader() as unknown as FrameReader;
      scope.postMessage({ type: 'started' });
      void read();
    } catch { scope.postMessage({ type: 'unsupported' }); }
  } else if (data.type === 'upright') {
    // The page's picture of the camera (small): the frames are turned to match it.
    const image = data.image as ImageBitmap;
    if (canvas.width !== image.width || canvas.height !== image.height) { canvas.width = image.width; canvas.height = image.height; }
    context.setTransform(1, 0, 0, 1, 0, 0); context.drawImage(image, 0, 0);
    upright = { pixels: context.getImageData(0, 0, image.width, image.height).data, width: image.width, height: image.height };
    image.close(); rotation = null; tries = 0;
  } else if (data.type === 'stop') { void reader?.cancel().catch(() => undefined); reader = null; track?.stop(); track = null; }
};
