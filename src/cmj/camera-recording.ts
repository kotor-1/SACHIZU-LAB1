/** A short, local-only encoded backup. It cannot recover frames the camera did
 * not capture, and must never substitute wall-clock time for video timestamps. */
export function recordCamera(stream: MediaStream, onLimit: () => void,
  limits = { milliseconds: 20_000, bytes: 90 * 1024 * 1024 }) {
  if (typeof MediaRecorder === 'undefined') throw new Error('CAMERA_RECORDING_UNSUPPORTED');
  const mimeType = ['video/mp4;codecs=avc1.42E01E', 'video/mp4', 'video/webm;codecs=vp8', 'video/webm']
    .find(type => MediaRecorder.isTypeSupported(type));
  if (!mimeType) throw new Error('CAMERA_RECORDING_UNSUPPORTED');
  const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 8_000_000 });
  let chunks: Blob[] = [], bytes = 0, invalid = false, settled = false, stopping = false;
  let deadline: ReturnType<typeof setTimeout> | undefined, watchdog: ReturnType<typeof setTimeout> | undefined;
  let resolve!: (file: File | null) => void;
  const result = new Promise<File | null>(done => { resolve = done; });
  const finish = () => {
    if (settled) return;
    settled = true; clearTimeout(deadline); clearTimeout(watchdog);
    const type = chunks.find(chunk => chunk.type)?.type || recorder.mimeType || mimeType;
    const file = invalid || !bytes ? null : new File(chunks,
      `cmj-camera.${type.includes('mp4') ? 'mp4' : 'webm'}`, { type });
    chunks = [];
    recorder.ondataavailable = null; recorder.onstop = null; recorder.onerror = null;
    resolve(file);
  };
  const stop = () => {
    if (settled || stopping) return result;
    stopping = true; clearTimeout(deadline);
    // stop() queues the final dataavailable before stop. Do not close the camera
    // or build the File until that final chunk has arrived.
    watchdog = setTimeout(() => { invalid = true; finish(); }, 3000);
    try { if (recorder.state !== 'inactive') recorder.stop(); }
    catch { invalid = true; finish(); }
    return result;
  };
  recorder.ondataavailable = event => {
    if (settled || invalid || !event.data.size) return;
    bytes += event.data.size;
    if (bytes > limits.bytes) { invalid = true; chunks = []; onLimit(); void stop(); return; }
    chunks.push(event.data);
  };
  recorder.onstop = finish;
  recorder.onerror = () => { invalid = true; void stop(); };
  try { recorder.start(1000); }
  catch (error) { invalid = true; finish(); throw error; }
  deadline = setTimeout(() => { onLimit(); void stop(); }, limits.milliseconds);
  return {
    stop,
    discard() { invalid = true; void stop(); finish(); },
  };
}
