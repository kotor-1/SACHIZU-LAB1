/** The RJ camera: 60 frames a second, or no set. A contact lasts 0.15-0.25 s; at 30 frames a second the shoes are
 * not measurable and the toe template reads about 0.15 above PUSH (frame-interval.ts, 2026-10-02). A browser
 * camera gives at most 60 (WebKit keeps one capture format per picture size, so the phone's 120/240 slow-motion
 * formats are not offered), so the camera is asked for 60 at 1080p, then 720p, then at whatever size it likes. */
export const RJ_CAMERA = Object.freeze({
  /** Below this the set is refused (the soles need 60; 59.94 cameras pass). */
  minimumFps: 50,
  /** A size good enough: the shoes are read at 960 px high, so 720 px across the short side or more. */
  goodFps: 55, goodShortSide: 720,
  /** Longest set; the analysis itself reads up to 30 s / 3600 frames. */
  maximumSeconds: 20,
});
export interface CameraTry { label: string; width: number; height: number; frameRate: number | null }
type VideoConstraints = MediaTrackConstraints & { resizeMode?: string };
export const CAMERA_TRIES: { label: string; video: VideoConstraints }[] = [
  { label: '1080p', video: { width: { ideal: 1920 }, height: { ideal: 1080 }, frameRate: { ideal: 60 } } },
  { label: '720p', video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 60 } } },
  // As the CMJ camera asks (camera-geometry.ts): no size, so a format with 60 at any size.
  { label: 'auto', video: { frameRate: { ideal: 60 } } },
];

export const goodCamera = (t: CameraTry) => (t.frameRate ?? 0) >= RJ_CAMERA.goodFps && Math.min(t.width, t.height) >= RJ_CAMERA.goodShortSide;
/** The best of the settings tried: the most frames a second (60 before 30), then the larger picture. */
export function bestCamera(tried: readonly CameraTry[]): CameraTry | null {
  return [...tried].sort((a, b) => Math.min(60, b.frameRate ?? 0) - Math.min(60, a.frameRate ?? 0) ||
    b.width * b.height - a.width * a.height)[0] ?? null;
}
/** Frames a second from the frames' own times (median interval), or null with too few. */
export function measuredFps(times: readonly number[]): number | null {
  const steps = times.slice(1).map((t, i) => t - times[i]).filter(dt => dt > 0).sort((a, b) => a - b);
  return steps.length >= 10 ? 1 / steps[Math.floor((steps.length - 1) / 2)] : null;
}

const settingsOf = (label: string, track: MediaStreamTrack): CameraTry => {
  const s = track.getSettings();
  return { label, width: s.width ?? 0, height: s.height ?? 0, frameRate: s.frameRate ?? null };
};

/** Opens the back camera and settles on 60 frames a second at the largest size offered (see CAMERA_TRIES). */
export async function openRJCamera(signal: AbortSignal): Promise<{ stream: MediaStream; chosen: CameraTry; tried: CameraTry[] }> {
  if (!navigator.mediaDevices?.getUserMedia) throw new Error('カメラを利用できません。HTTPS接続を確認するか、標準カメラで撮った動画を読み込んでください。');
  const resize = (navigator.mediaDevices.getSupportedConstraints() as MediaTrackSupportedConstraints & { resizeMode?: boolean }).resizeMode
    ? { resizeMode: 'none' } : {};
  const ask = (i: number): VideoConstraints => ({ ...CAMERA_TRIES[i].video, ...resize });
  const stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: { ideal: 'environment' }, ...ask(0) } });
  const stop = () => stream.getTracks().forEach(t => t.stop());
  try {
    if (signal.aborted) throw new DOMException('中止', 'AbortError');
    const track = stream.getVideoTracks()[0];
    if (!track) throw new Error('カメラ映像を取得できませんでした。');
    const tried = [settingsOf(CAMERA_TRIES[0].label, track)];
    for (let i = 1; i < CAMERA_TRIES.length && !goodCamera(tried.at(-1)!); i++) {
      try { await track.applyConstraints(ask(i)); tried.push(settingsOf(CAMERA_TRIES[i].label, track)); }
      catch { /* not offered: keep trying */ }
      if (signal.aborted) throw new DOMException('中止', 'AbortError');
    }
    const chosen = tried.find(goodCamera) ?? bestCamera(tried)!;
    if (chosen !== tried.at(-1)) {
      try { await track.applyConstraints(ask(CAMERA_TRIES.findIndex(c => c.label === chosen.label))); }
      catch { /* the last one applied stays */ }
    }
    return { stream, chosen: settingsOf(chosen.label, track), tried };
  } catch (error) { stop(); throw error; }
}
