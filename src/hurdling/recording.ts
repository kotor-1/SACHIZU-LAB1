/** The hurdler's pose in every frame of a recording: MediaPipe for following
 * the athlete and for the contacts, RTMPose for the angles and the centre of
 * mass (as the crouch start, see sprint10/recording.ts).
 *
 * Three passes over the video:
 * 1. A survey of a few frames finds the running direction (the user only sets
 *    the hurdle's line).
 * 2. The athlete is followed as a runner coming into the picture (the sprint's
 *    flying section). That takes 0.25 s of running to decide, which was 0.2-0.5
 *    s after the athlete came in: the step before the takeoff, and in one video
 *    the takeoff itself, were lost (recorded, docs/Hurdle_Feasibility_20261005.md).
 * 3. So the frames before are read again, the athlete looked for where the
 *    path followed in pass 2 leads back to. */
import { demuxMP4 } from '../frame-engine/mp4-demuxer';
import { SequentialRecordingDecoder } from '../cmj/sequential-decoder';
import { MobileCMJPose } from '../cmj/mobile-pose';
import { trackRotation } from '../cmj/video-orientation';
import { untilAborted } from '../cmj/session-lifecycle';
import type { CrouchFrame, CrouchPoint } from '../sprint10/crouch';
import { loadRefiner, type Refiner } from '../sprint10/rtm-refine';
import { CROUCH_FPS, measureSprint, SPRINT_POSES } from '../sprint10/recording';

type Pt = { x: number; y: number; visibility?: number };
type Region = { x: number; y: number; w: number; h: number };
/** Frames looked at to find the running direction, and the widths of the picture searched in each. */
const SURVEY_FRAMES = 24;
const SURVEY_REGIONS: Region[] = [0, .32, .64].map(x => ({ x, y: 0, w: .36, h: 1 }));
/** A runner's pelvis moves 0.6-1.2 image widths/s in these videos; a person
 * standing or walking much less. Moves within this range vote for a direction. */
const RUN_SPEED = [.2, 2.5] as const;
/** Pass 3: the athlete is the pose whose pelvis is within PATH_TOLERANCE image
 * widths of the path led back at the speed of the first PATH_FIT_SECONDS followed. */
const PATH_FIT_SECONDS = .1, PATH_TOLERANCE = .08;
/** Points that must lie inside the searched picture: a body cut by its edge
 * gives a pelvis and toes that jump (as in the sprint tracker). */
const BODY_POINTS = [11, 12, 23, 24, 25, 26, 27, 28];
const EDGE_MARGIN = .01;
const pelvis = (p: Pt[]) => ({ x: (p[23].x + p[24].x) / 2, y: (p[23].y + p[24].y) / 2 });

/** Reads the frames in order, decoding and drawing upright only those wanted (also the throws' implement). */
export async function readFrames(file: File, signal: AbortSignal, wanted: (index: number) => boolean,
  visit: (frame: { frameIndex: number; pts: number }, source: HTMLCanvasElement, w: number, h: number) => Promise<void>) {
  const check = () => { if (signal.aborted) throw new DOMException('中止', 'AbortError'); };
  const d = await untilAborted(demuxMP4(file), signal); check();
  const rotation = trackRotation((d.videoTrack as typeof d.videoTrack & { matrix?: ArrayLike<number> }).matrix);
  const decoder = new SequentialRecordingDecoder(file, d.videoTrack, d.frames, d.rawSamples, d.descriptionBuffer);
  const source = document.createElement('canvas'), ctx = source.getContext('2d');
  if (!ctx) throw new Error('映像処理を開始できません。');
  const abort = () => decoder.dispose();
  signal.addEventListener('abort', abort, { once: true });
  const last = d.frames.reduce((m, f) => wanted(f.frameIndex) ? f.frameIndex : m, -1);
  try {
    for (const frame of d.frames) {
      if (frame.frameIndex > last) break;
      if (!wanted(frame.frameIndex)) { await untilAborted(decoder.skipExactFrame(frame.frameIndex), signal); check(); continue; }
      const decoded = await untilAborted(decoder.decodeExactFrame(frame.frameIndex), signal); check();
      if (decoded.status !== 'SUCCESS' || decoded.actualDecodedFrameIndex !== frame.frameIndex) throw new Error('動画フレームを正しく読み出せません。');
      const bitmap = decoded.bitmap, w = rotation % 180 ? bitmap.height : bitmap.width, h = rotation % 180 ? bitmap.width : bitmap.height;
      if (source.width !== w || source.height !== h) { source.width = w; source.height = h; }
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, w, h);
      ctx.translate(w / 2, h / 2); ctx.rotate(rotation * Math.PI / 180);
      ctx.drawImage(bitmap, -bitmap.width / 2, -bitmap.height / 2); ctx.setTransform(1, 0, 0, 1, 0, 0);
      await visit(frame, source, w, h); check();
    }
  } finally { signal.removeEventListener('abort', abort); decoder.dispose(); source.width = 0; }
  return d.frames.length;
}

/** People in one region of the picture, cropped at source resolution (as SprintFrameProcessor). */
function detect(model: MobileCMJPose, source: HTMLCanvasElement, region: Region, frame: { frameIndex: number; pts: number }, w: number, h: number) {
  const crop = document.createElement('canvas'), cc = crop.getContext('2d')!;
  crop.width = 512; crop.height = Math.round(512 * region.h * h / (region.w * w));
  cc.drawImage(source, region.x * w, region.y * h, region.w * w, region.h * h, 0, 0, crop.width, crop.height);
  const poses = model.estimate(crop, frame.frameIndex, frame.pts).landmarks
    .map(p => p.map(q => ({ x: region.x + q.x * region.w, y: region.y + q.y * region.h, visibility: q.visibility })));
  crop.width = 0;
  return poses.filter(p => BODY_POINTS.every(i => p[i] && p[i].x > region.x + EDGE_MARGIN && p[i].x < region.x + region.w - EDGE_MARGIN));
}

/** The running direction (+1 to the right) from pelvis moves between surveyed frames; 0 when none ran. */
export function surveyDirection(samples: { pts: number; people: { x: number; y: number }[] }[]) {
  let votes = 0;
  for (let i = 1; i < samples.length; i++) {
    const dt = samples[i].pts - samples[i - 1].pts; if (!(dt > 0)) continue;
    for (const a of samples[i - 1].people) {
      const moves = samples[i].people.filter(b => Math.abs(b.y - a.y) < .05).map(b => (b.x - a.x) / dt)
        .filter(v => Math.abs(v) >= RUN_SPEED[0] && Math.abs(v) <= RUN_SPEED[1]).sort((u, v) => Math.abs(u) - Math.abs(v));
      if (moves.length) votes += moves[0];
    }
  }
  return Math.abs(votes) < RUN_SPEED[0] ? 0 : Math.sign(votes);
}

export async function measureHurdle(file: File, signal: AbortSignal, progress: (fraction: number, message: string) => void):
  Promise<{ frames: CrouchFrame[]; width: number; height: number; refiner: Refiner['backend'] | null; direction: number }> {
  let refiner: Refiner | null = null;
  try { refiner = await untilAborted(loadRefiner(signal, text => progress(0, text)), signal); }
  catch (e) { if (signal.aborted) throw e; refiner = null; }
  const watcher = new MobileCMJPose('full', undefined, 'CPU', SPRINT_POSES, 'IMAGE');
  try {
    await untilAborted(watcher.initialize(signal, message => progress(0, message)), signal);
    // 1. The running direction.
    progress(0, '走る向きを確認しています。');
    const d = await untilAborted(demuxMP4(file), signal), count = d.frames.length;
    const step = Math.max(1, Math.floor(count / SURVEY_FRAMES)), samples: { pts: number; people: { x: number; y: number }[] }[] = [];
    await readFrames(file, signal, i => i % step === 0, async (frame, source, w, h) => {
      samples.push({ pts: frame.pts, people: SURVEY_REGIONS.flatMap(r => detect(watcher, source, r, frame, w, h)).map(pelvis) });
      progress(.1 * frame.frameIndex / count, '走る向きを確認しています。');
    });
    const direction = surveyDirection(samples);
    if (!direction) throw new Error('走っている選手を見つけられませんでした。選手が画面を横切る動画を使ってください。');

    // 2. Follow the runner coming in.
    let width = 0, height = 0;
    const frames: CrouchFrame[] = [];
    await measureSprint(file, direction > 0 ? .03 : .97, signal, (f, m) => progress(.1 + .75 * f, m), direction > 0 ? .97 : .03, 'flying', 10, {
      maxFps: CROUCH_FPS,
      onSelected: (frame, selected, w, h) => { width = w; height = h;
        frames.push({ frame: frame.frameIndex, pts: frame.pts, pose: selected.length === 33 ? selected.map(p => ({ x: p.x, y: p.y, visibility: p.visibility })) : null }); },
      afterSelected: refiner ? async source => { const f = frames.at(-1); if (f?.pose) f.refined = await refiner!.refine(source, f.pose); } : undefined,
    });

    // 3. Before the athlete was decided: along the path led back.
    const followed = frames.filter(f => f.pose);
    if (followed.length) {
      const first = followed[0], start = followed.filter(f => f.pts - first.pts <= PATH_FIT_SECONDS).map(f => ({ t: f.pts, ...pelvis(f.pose!) }));
      const mt = start.reduce((s, p) => s + p.t, 0) / start.length, mx = start.reduce((s, p) => s + p.x, 0) / start.length;
      const den = start.reduce((s, p) => s + (p.t - mt) ** 2, 0);
      const speed = den > 0 ? start.reduce((s, p) => s + (p.t - mt) * (p.x - mx), 0) / den : 0;
      const ys = followed.slice(0, 30).flatMap(f => f.pose!.filter(p => (p.visibility ?? 0) >= .3).map(p => p.y));
      const top = Math.max(0, Math.min(...ys) - .1), bottom = Math.min(1, Math.max(...ys) + .1);
      const expected = (t: number) => mx + speed * (t - mt);
      const earlier = new Map<number, CrouchFrame>();
      progress(.85, '踏切の前の動きを確認しています。');
      await readFrames(file, signal, i => i < first.frame, async (frame, source, w, h) => {
        const x = expected(frame.pts);
        if (x < -.02 || x > 1.02) return;
        const region = { x: Math.max(0, Math.min(.64, x - .18)), y: top, w: .36, h: bottom - top };
        const pose = detect(watcher, source, region, frame, w, h).map(p => ({ p, d: Math.abs(pelvis(p).x - x) }))
          .filter(c => c.d < PATH_TOLERANCE).sort((a, b) => a.d - b.d)[0]?.p;
        if (!pose) return;
        const found: CrouchFrame = { frame: frame.frameIndex, pts: frame.pts, pose: pose.map(p => ({ x: p.x, y: p.y, visibility: p.visibility ?? 0 })) as CrouchPoint[] };
        if (refiner) found.refined = await refiner.refine(source, found.pose!);
        earlier.set(frame.frameIndex, found);
        progress(.85 + .15 * frame.frameIndex / first.frame, '踏切の前の動きを確認しています。');
      });
      const merged = new Map(frames.map(f => [f.frame, f]));
      for (const [i, f] of earlier) merged.set(i, f);
      frames.splice(0, frames.length, ...[...merged.values()].sort((a, b) => a.frame - b.frame));
    }
    progress(1, '解析が終わりました。');
    return { frames, width, height, refiner: refiner?.backend ?? null, direction };
  } finally { watcher.dispose(); }
}
