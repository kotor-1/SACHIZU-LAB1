import { CameraClock, drawCameraFrame } from '../cmj/camera-clock';
import { MobileCMJPose } from '../cmj/mobile-pose';
import { analyzeSprint, type SprintSample } from './analysis';
import { SPRINT_POSES, SprintFrameProcessor } from './frame-processor';
import type { SprintStart } from './tracker';

/** One run measured from the live camera: the time between the gates and the
 * average speed only (at camera frame rates, leg crossings last 2-3 frames and
 * step counts are not reliable). A run through the gates that could not be
 * measured has no time and says why (`failure`). */
export interface LiveSprintRun {
  id: number; duration: number | null; speed: number | null; startPts: number | null; finishPts: number; notes: string[]; failure: string | null;
}
export interface LiveSprintStatus { fps: number | null; following: boolean; message: string }
export interface LiveSprintOptions { startX: number; finishX: number; start: SprintStart; distanceM: number }

/** After the exit crossing, a run is final once the line fit around the
 * crossing (±0.08 s) has its frames, with a margin. */
export const SETTLE_SECONDS = .25;
/** Without a finished run, the samples are dropped after this long so a
 * waiting athlete or an empty track does not grow the buffer. */
export const STALE_SECONDS = 20;
/** Processed frames between checks for a finished run. */
const CHECK_EVERY = 4;
/** A live run is one person followed from gate to gate: the pelvis is never
 * unseen for longer than this between the crossings, and the average speed is
 * at least MIN_RUN_SPEED (m/s). Recorded: an entry and an exit of different
 * passes, joined across a lost track, gave 9.2 s and 14.3 s for 10 m; a runner
 * passing in front of people jogging was unseen for 0.32 s within one run. */
export const MAX_RUN_GAP_SECONDS = 1;
export const MIN_RUN_SPEED = 2;
/** A wrong person's time is worse than none: see SprintTracker.contested. */
export const CONTESTED_RUN = '別の人と重なって選手を見分けられなかったため、この1本は計測できませんでした。';
export const LOST_RUN = '走っている途中で選手を見失ったため、この1本は計測できませんでした。';
const NO_EXIT = '出口の線の通過を確認できませんでした。出口の付近で選手が他の人と重なっていないか確認してください。';

/** The run in `samples` once `now` is SETTLE_SECONDS past its exit: every
 * subject that passed the exit gives one, with its time or why there is none,
 * so the runs keep their order (a run left out made the next athlete's time
 * look like theirs). 'invalid' when the crossings belong to nobody running (the
 * caller starts over silently); null while nothing has passed the exit yet.
 * contested: a nearer runner was seen during the run (see CONTESTED_RUN). */
export function settledRun(samples: SprintSample[], options: LiveSprintOptions, now: number,
  contested = false): Omit<LiveSprintRun, 'id'> | 'invalid' | null {
  const tracked = samples.filter(s => s.hipX !== null);
  if (!tracked.length) return null;
  const r = analyzeSprint(samples, options.startX, options.finishX, options.distanceM, options.start);
  const direction = Math.sign(options.finishX - options.startX);
  const passed = r.finish?.pts ?? tracked.find(s => (s.hipX! - options.finishX) * direction > 0)?.pts;
  if (passed === undefined || now - passed < SETTLE_SECONDS) return null;
  const failed = (failure: string) => ({ duration: null, speed: null, startPts: r.start?.pts ?? null, finishPts: passed, notes: [], failure });
  if (r.duration === null || !r.start || !r.finish || r.speed === null)
    return failed(!r.reason ? LOST_RUN : r.reason.includes('動画') ? NO_EXIT : r.reason);
  if (r.speed < MIN_RUN_SPEED) return 'invalid';
  const seen = [r.start.pts, ...tracked.filter(s => s.pts > r.start!.pts && s.pts < r.finish!.pts).map(s => s.pts), r.finish.pts];
  if (seen.some((t, i) => i > 0 && t - seen[i - 1] > MAX_RUN_GAP_SECONDS)) return failed(LOST_RUN);
  if (contested) return failed(CONTESTED_RUN);
  return { duration: r.duration, speed: r.speed, startPts: r.start.pts, finishPts: r.finish.pts,
    notes: r.warnings.filter(w => w.includes('推定しました') && w.includes('線')), failure: null };
}

/** Measures runs from the live camera in `video` until `signal` aborts. The
 * camera stays where it is; every run through the two gates is reported. */
export async function measureSprintLive(video: HTMLVideoElement, options: LiveSprintOptions, signal: AbortSignal,
  onRun: (run: LiveSprintRun) => void, onStatus: (status: LiveSprintStatus) => void): Promise<void> {
  const check = () => { if (signal.aborted) throw new DOMException('中止', 'AbortError'); };
  const model = new MobileCMJPose('full', undefined, 'CPU', SPRINT_POSES);
  let watcher: MobileCMJPose | null = null;
  const source = document.createElement('canvas'), ctx = source.getContext('2d');
  if (!ctx) throw new Error('映像処理を開始できません。');
  try {
    await model.initialize(signal, message => onStatus({ fps: null, following: false, message })); check();
    // Loaded before measuring: loading it at the first runner stopped processing
    // for 0.26 s while the runner came in, and the runner was not followed (recorded).
    if (options.start === 'flying') { watcher = new MobileCMJPose('full', undefined, 'CPU', SPRINT_POSES, 'IMAGE'); await watcher.initialize(signal); check(); }
    const watching = async () => {
      if (!watcher) { watcher = new MobileCMJPose('full', undefined, 'CPU', SPRINT_POSES, 'IMAGE'); await watcher.initialize(signal); check(); }
      return watcher;
    };
    const fresh = () => new SprintFrameProcessor(source, model, watching, options.startX, options.finishX, options.start, options.distanceM, true);
    const clock = new CameraClock();
    let processor = fresh(), frame = 0, runs = 0, busy = false, callback = 0, done = false;
    // Starts over, first reporting a run that already crossed the exit: the camera
    // clock can restart (recorded with a looping test stream) before a run settled.
    const restart = () => {
      const last = processor.samples.at(-1);
      const run = last ? settledRun(processor.samples, options, last.pts + SETTLE_SECONDS, processor.tracker.contested) : null;
      if (run && run !== 'invalid') onRun({ ...run, id: ++runs });
      processor = fresh();
    };
    const times: number[] = [];
    await new Promise<void>((resolve, reject) => {
      const stop = (error?: unknown) => {
        if (done) return;
        done = true; video.cancelVideoFrameCallback(callback); signal.removeEventListener('abort', aborted);
        if (error) reject(error); else resolve();
      };
      const aborted = () => stop(new DOMException('中止', 'AbortError'));
      const next: VideoFrameRequestCallback = (now, metadata) => {
        if (done) return;
        callback = video.requestVideoFrameCallback(next);
        // One frame at a time: frames arriving meanwhile are skipped, each processed one keeps its own capture time.
        if (busy || !video.videoWidth || !video.videoHeight) return;
        busy = true;
        const w = video.videoWidth, h = video.videoHeight;
        if (source.width !== w || source.height !== h) { source.width = w; source.height = h; restart(); }
        let frameTime: number | null;
        try { frameTime = drawCameraFrame(video, ctx, w, h); } catch (error) { busy = false; stop(error); return; }
        const timing = clock.read(now, { ...metadata, frameTime });
        if (timing.reset) restart();
        const pts = timing.measurementPts;
        if (pts === null) { busy = false; return; }
        void (async () => {
          try {
            await processor.process(w, h, { frameIndex: frame++, pts });
            times.push(pts); while (times.length > 2 && times.at(-1)! - times[0] > 1) times.shift();
            if (frame % CHECK_EVERY === 0) {
              const run = settledRun(processor.samples, options, pts, processor.tracker.contested);
              if (run === 'invalid') processor = fresh();
              else if (run) { onRun({ ...run, id: ++runs }); processor = fresh(); }
              else if (pts - processor.samples[0].pts > STALE_SECONDS) restart();
            }
            const span = times.length > 1 ? times.at(-1)! - times[0] : 0;
            onStatus({ fps: span >= .5 ? (times.length - 1) / span : null, following: processor.tracker.following,
              message: processor.tracker.following ? '選手を追跡しています。' : '選手を待っています。' });
          } catch (error) { stop(error); }
          finally { busy = false; }
        })();
      };
      signal.addEventListener('abort', aborted, { once: true });
      if (signal.aborted) { aborted(); return; }
      callback = video.requestVideoFrameCallback(next);
    });
  } finally { model.dispose(); (watcher as MobileCMJPose | null)?.dispose(); source.width = 0; }
}
