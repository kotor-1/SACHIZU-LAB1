/** Every frame of the camera, upright, 960 px high, with its own capture time, from the RJ camera's frame reader
 * (rj-camera-live-worker.ts). Null where the browser has no MediaStreamTrackProcessor (Safari before 18): the page
 * then reads the frames it shows (rj-live-session.ts), and may miss some. */
export interface SourceFrame {
  image: ImageBitmap;
  /** Capture time, seconds. */
  pts: number;
  /** The upright camera picture's size before scaling. */
  width: number; height: number;
}
type Processor = new (init: { track: MediaStreamTrack; maxBufferSize?: number }) => { readable: ReadableStream<VideoFrame> };

export async function cameraFrames(stream: MediaStream, video: HTMLVideoElement,
  onFrame: (frame: SourceFrame) => void, onError: (error: Error) => void) {
  const track = stream.getVideoTracks()[0];
  if (!track || typeof Worker === 'undefined' || typeof OffscreenCanvas === 'undefined') return null;
  let worker: Worker;
  try { worker = new Worker(new URL('./rj-camera-live-worker.ts', import.meta.url)); } catch { return null; }
  // A copy of the camera's track: the page keeps showing the original.
  const copy = track.clone();
  let rotation: number | null = null, closed = false;
  const close = () => {
    if (closed) return;
    closed = true; worker.postMessage({ type: 'stop' }); copy.stop();
    setTimeout(() => worker.terminate(), 200);
  };
  const started = new Promise<boolean>(resolve => {
    const timer = setTimeout(() => resolve(false), 5000);
    worker.onmessage = ({ data }) => {
      if (data.type === 'started') { clearTimeout(timer); resolve(true); }
      else if (data.type === 'unsupported') { clearTimeout(timer); resolve(false); }
      else if (data.type === 'frame') { if (closed) data.image.close(); else onFrame(data); }
      else if (data.type === 'rotation') rotation = data.degrees;
      else if ((data.type === 'error' || data.type === 'ended') && !closed) { close(); onError(new Error('カメラ映像を取得できませんでした。もう一度「カメラを起動」を押してください。')); }
    };
    worker.onerror = event => { event.preventDefault(); clearTimeout(timer); resolve(false); };
  });
  try {
    const Page = (window as unknown as { MediaStreamTrackProcessor?: Processor }).MediaStreamTrackProcessor;
    // Chrome reads a track on the page and passes the stream of frames; Safari reads it only in a worker.
    if (Page) { const { readable } = new Page({ track: copy, maxBufferSize: 30 }); worker.postMessage({ type: 'start', readable }, [readable as unknown as Transferable]); }
    else worker.postMessage({ type: 'start', track: copy }, [copy as unknown as Transferable]);
  } catch { close(); return null; }
  if (!await started) { close(); return null; }
  /** The page's picture of the camera, small: the frames are turned to look like it (the phone held either way). */
  const level = async () => {
    const w = video.videoWidth, h = video.videoHeight;
    if (!w || !h || closed) return;
    const canvas = document.createElement('canvas'), width = 48, height = Math.max(1, Math.round(48 * h / w));
    canvas.width = width; canvas.height = height;
    canvas.getContext('2d')?.drawImage(video, 0, 0, width, height);
    const image = await createImageBitmap(canvas);
    if (closed) { image.close(); return; }
    worker.postMessage({ type: 'upright', image }, [image]);
  };
  await level();
  return { close, level, get rotation() { return rotation; } };
}
