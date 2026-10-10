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
import { MobileCMJPose } from '../cmj/mobile-pose';
import { untilAborted } from '../cmj/session-lifecycle';
import type { CrouchFrame, CrouchPoint } from '../sprint10/crouch';
import { loadRefiner, type Refiner } from '../sprint10/rtm-refine';
import { CROUCH_FPS, DecodeFailure, measureSprint, readFrames, SPRINT_POSES } from '../sprint10/recording';
/** The frame reader lives with the sprint pass (moved for the crouch start's second reading); here for the old imports. */
export { readFrames } from '../sprint10/recording';

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
/** Pass 2 waits for the runner at the run-in edge of the picture. A runner already well inside it when the video
 * starts (a clip cut short before the hurdle) never comes in there and nobody was followed (recorded, the user's
 * IMG_0368, first seen 0.15 image widths in, 2026-10-08). Then the runner is followed again from a line this far
 * ahead of where the survey first saw it. */
const ENTRY_AHEAD = .03;

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

/** Where the runner was first seen in the survey (pelvis x; the one furthest back when several moved), or null. */
export function surveyEntry(samples: { pts: number; people: { x: number; y: number }[] }[], direction: number) {
  for (let i = 1; i < samples.length; i++) {
    const dt = samples[i].pts - samples[i - 1].pts; if (!(dt > 0)) continue;
    const runners = samples[i - 1].people.filter(a => samples[i].people.some(b => Math.abs(b.y - a.y) < .05
      && (b.x - a.x) / dt * direction >= RUN_SPEED[0] && (b.x - a.x) / dt * direction <= RUN_SPEED[1]));
    if (runners.length) return runners.reduce((a, b) => (b.x - a.x) * direction < 0 ? b : a).x;
  }
  return null;
}

/** Three readings of the video, as before the iPhone's trouble, but the models in memory changed: the hurdle's pass
 * held two MediaPipe models (a watcher and a tracker, ~120 MB each and growing) beside RTMPose (~500 MB), and an
 * iPhone closed the page in the long jump while the high jump and the throws (one model) were fine (WebKit: 1.22-1.28
 * GB against 1.12-1.18; the user, 2026-10-06). So: (1) the direction, with the watcher; (2) the runner followed, the
 * watcher lent to the sprint pass as its own, no RTMPose yet; the tracker then let go; (3) RTMPose loaded, and one more
 * reading both finds the athlete before the tracking began (the watcher) and refines every followed frame (the same
 * pixels as before): one MediaPipe model beside RTMPose, as the crouch start. A two-stage version with a fourth
 * reading was lighter still but an iPhone 18 Pro Max then stopped with "Decoder failure" (the long jump's 887 frames
 * read four times); a failing decoder is now made again (DECODE_RETRIES) and the stage named if it still fails. */
export async function measureHurdle(file: File, signal: AbortSignal, progress: (fraction: number, message: string) => void):
  Promise<{ frames: CrouchFrame[]; width: number; height: number; refiner: Refiner['backend'] | null; direction: number }> {
  const frames: CrouchFrame[] = [];
  let width = 0, height = 0, direction = 0, refiner: Refiner | null = null;
  const stage = async <T>(name: string, run: () => Promise<T>) => {
    try { return await run(); }
    catch (e) { if (e instanceof DecodeFailure) throw new Error(`${name}の途中で、${e.message}`); throw e; }
  };
  const watcher = new MobileCMJPose('full', undefined, 'CPU', SPRINT_POSES, 'IMAGE');
  try {
    await untilAborted(watcher.initialize(signal, message => progress(0, message)), signal);
    // 1. The running direction.
    progress(0, '走る向きを確認しています。');
    // Only the count is kept: a demuxed video holds the file and a copy of each sample (twice the file in memory).
    const count = (await untilAborted(demuxMP4(file), signal)).frames.length;
    const step = Math.max(1, Math.floor(count / SURVEY_FRAMES)), samples: { pts: number; people: { x: number; y: number }[] }[] = [];
    await stage('走る向きの確認', () => readFrames(file, signal, i => i % step === 0, async (frame, source, w, h) => {
      samples.push({ pts: frame.pts, people: SURVEY_REGIONS.flatMap(r => detect(watcher, source, r, frame, w, h)).map(pelvis) });
      progress(.1 * frame.frameIndex / count, '走る向きを確認しています。');
    }));
    direction = surveyDirection(samples);
    if (!direction) throw new Error('走っている選手を見つけられませんでした。選手が画面を横切る動画を使ってください。');

    // 2. Follow the runner coming in (the tracker is let go at the end of the pass); a runner already inside the
    // picture is followed again from where the survey first saw it.
    // The pass's own 「解析が終わりました。」 is not the analysis's end (RTMPose comes next). A second follow says it looks
    // again, and keeps the first one's sprint speed: its gates are nearer (`metres` scaled), and the speed taken as
    // running is the gates' spacing over their metres.
    const edge = direction > 0 ? .03 : .97, far = direction > 0 ? .97 : .03, entry = surveyEntry(samples, direction);
    const follow = (startX: number, again = false) => {
      let closed = false;
      return stage('選手の追跡', () => measureSprint(file, startX, signal,
        (f, m) => progress(.1 + .6 * f, m === '解析が終わりました。' ? '選手の追跡が終わりました。' : again ? `選手を探し直しています。${m}` : m),
        far, 'flying', 10 * Math.abs(far - startX) / Math.abs(far - edge), {
        maxFps: CROUCH_FPS, watcher,
        onRevised: (from, filled) => {
          // A nearer, faster runner replaced the one followed first: that one's poses go (they pooled two people's toes).
          // The new runner's earlier frames are found by the path led back in pass 3, as before.
          if (from !== null) { for (const f of frames) if (f.pts >= from) f.pose = null; return; }
          // Someone taken up after the athlete was lost (over 1.5 s): a runner coming in behind where the athlete was (a
          // practice with several in turn) is someone else, whose poses are not added; one taken up further on is the
          // athlete followed again.
          const last = [...frames].reverse().find(f => f.pose), first = filled[0];
          if (last && first && ((first.pose[23].x + first.pose[24].x) / 2 - (last.pose![23].x + last.pose![24].x) / 2) * direction < -.05) closed = true;
        },
        onSelected: (frame, selected, w, h) => { width = w; height = h;
          frames.push({ frame: frame.frameIndex, pts: frame.pts, pose: !closed && selected.length === 33 ? selected.map(p => ({ x: p.x, y: p.y, visibility: p.visibility })) : null }); },
      }));
    };
    await follow(edge);
    // Not from a line at the far edge: with little picture left before the finish line the tracker took the wrong way.
    if (!frames.some(f => f.pose) && entry !== null && (entry - edge) * direction > ENTRY_AHEAD && (far - (entry + direction * ENTRY_AHEAD)) * direction > .1) {
      frames.length = 0;
      await follow(entry + direction * ENTRY_AHEAD, true);
    }

    // 3. RTMPose; then one reading: before the athlete was decided, along the path led back (the watcher), and every
    // followed frame refined.
    try { refiner = await untilAborted(loadRefiner(signal, text => progress(.7, text)), signal); }
    catch (e) { if (signal.aborted) throw e; refiner = null; }
    const followed = frames.filter(f => f.pose);
    if (!followed.length) return { frames, width, height, refiner: refiner?.backend ?? null, direction };
    const first = followed[0], start = followed.filter(f => f.pts - first.pts <= PATH_FIT_SECONDS).map(f => ({ t: f.pts, ...pelvis(f.pose!) }));
    const mt = start.reduce((s, p) => s + p.t, 0) / start.length, mx = start.reduce((s, p) => s + p.x, 0) / start.length;
    const den = start.reduce((s, p) => s + (p.t - mt) ** 2, 0);
    const speed = den > 0 ? start.reduce((s, p) => s + (p.t - mt) * (p.x - mx), 0) / den : 0;
    const ys = followed.slice(0, 30).flatMap(f => f.pose!.filter(p => (p.visibility ?? 0) >= .3).map(p => p.y));
    const top = Math.max(0, Math.min(...ys) - .1), bottom = Math.min(1, Math.max(...ys) + .1);
    const expected = (t: number) => mx + speed * (t - mt);
    const earlier = new Map<number, CrouchFrame>(), byFrame = new Map(followed.map(f => [f.frame, f])), last = followed.at(-1)!.frame;
    progress(.75, '踏切の前の動きを確認しています。');
    await stage('骨格の仕上げ', () => readFrames(file, signal, i => i < first.frame || (!!refiner && byFrame.has(i)), async (frame, source, w, h) => {
      if (frame.frameIndex < first.frame) {
        const x = expected(frame.pts);
        if (x < -.02 || x > 1.02) return;
        const region = { x: Math.max(0, Math.min(.64, x - .18)), y: top, w: .36, h: bottom - top };
        const pose = detect(watcher, source, region, frame, w, h).map(p => ({ p, d: Math.abs(pelvis(p).x - x) }))
          .filter(c => c.d < PATH_TOLERANCE).sort((a, b) => a.d - b.d)[0]?.p;
        if (!pose) return;
        const found: CrouchFrame = { frame: frame.frameIndex, pts: frame.pts, pose: pose.map(p => ({ x: p.x, y: p.y, visibility: p.visibility ?? 0 })) as CrouchPoint[] };
        if (refiner) found.refined = await refiner.refine(source, found.pose!);
        earlier.set(frame.frameIndex, found);
        progress(.75 + .05 * frame.frameIndex / first.frame, '踏切の前の動きを確認しています。');
      } else {
        const f = byFrame.get(frame.frameIndex)!;
        f.refined = await refiner!.refine(source, f.pose!);
        progress(.8 + .2 * frame.frameIndex / last, '骨格を細かく調べています。');
      }
    }));
    const merged = new Map(frames.map(f => [f.frame, f]));
    for (const [i, f] of earlier) merged.set(i, f);
    frames.splice(0, frames.length, ...[...merged.values()].sort((a, b) => a.frame - b.frame));
  } finally { watcher.dispose(); }
  progress(1, '解析が終わりました。');
  return { frames, width, height, refiner: refiner?.backend ?? null, direction };
}
