/** The high jumper's pose in every frame: MediaPipe to find and follow the
 * athlete, RTMPose for the points used (contacts, angles, the centre of mass).
 *
 * The hurdle's runner tracker lost the jumper at the takeoff (はるき, before the
 * toe-off) or in the rise (みなみ): it expects someone running across the
 * picture. Here (docs/HighJump_Feasibility_20261006.md §1):
 * 1. A survey of a few frames finds the running direction and the runner.
 * 2. From the first frame the runner is seen whole, every frame: MediaPipe in
 *    a full-height region around the athlete's last place, the pose nearest that
 *    place; RTMPose in its box, or in the last RTMPose pose's box when MediaPipe
 *    finds no one there (the jumper rising, the body turned). This followed all
 *    four test videos through the rise.
 * 3. The frames before: the athlete looked for where the followed path leads back to (as the hurdle). */
import { demuxMP4 } from '../frame-engine/mp4-demuxer';
import { MobileCMJPose } from '../cmj/mobile-pose';
import { untilAborted } from '../cmj/session-lifecycle';
import type { CrouchFrame, CrouchPoint } from '../sprint10/crouch';
import { loadRefiner, type Refiner } from '../sprint10/rtm-refine';
import { readFrames, surveyDirection } from '../hurdling/recording';

type Pt = { x: number; y: number; visibility?: number };
type Region = { x: number; y: number; w: number; h: number };
/** Frames surveyed for the direction and the runner, and the widths of the picture searched in each (as the hurdle). */
const SURVEY_FRAMES = 24;
const SURVEY_REGIONS: Region[] = [0, .32, .64].map(x => ({ x, y: 0, w: .36, h: 1 }));
/** A runner's pelvis moves 0.2-2.5 picture widths a second (as the hurdle). */
const RUN_SPEED = [.2, 2.5] as const;
/** Points that must lie inside the searched picture for the survey to take a pose (a body cut by the edge jumps). */
const BODY_POINTS = [11, 12, 23, 24, 25, 26, 27, 28];
const EDGE_MARGIN = .01;
/** Following: the region searched is FOLLOW_SIZES times the athlete's size wide (at least FOLLOW_WIDTH of the picture) and full height;
 * a pose whose box centre is more than FOLLOW_REACH sizes from the last is someone else. The size is forgotten slowly
 * (×0.98 a frame): the crouched and arched body is smaller. */
const FOLLOW_WIDTH = .4, FOLLOW_SIZES = 2.4, FOLLOW_REACH = .6, SIZE_KEEP = .98;
/** With no pose there, RTMPose looks in the last pose's box kept at least this share of the athlete's size (height, width). */
const KEEP_HEIGHT = .8, KEEP_WIDTH = .5;
/** Before the first frame followed: the athlete is the pose whose pelvis is within PATH_TOLERANCE picture widths of the path led back at
 * the speed of the first PATH_FIT_SECONDS followed (the hurdle's pass 3). */
const PATH_FIT_SECONDS = .1, PATH_TOLERANCE = .08;
const pelvis = (p: Pt[]) => ({ x: (p[23].x + p[24].x) / 2, y: (p[23].y + p[24].y) / 2 });

/** People in one region of the picture (normalized to the whole picture); with `whole`, only bodies inside it. */
function detect(model: MobileCMJPose, source: HTMLCanvasElement, region: Region, frame: { frameIndex: number; pts: number }, w: number, h: number, whole: boolean) {
  const crop = document.createElement('canvas'), cc = crop.getContext('2d')!;
  crop.width = 512; crop.height = Math.round(512 * region.h * h / (region.w * w));
  cc.drawImage(source, region.x * w, region.y * h, region.w * w, region.h * h, 0, 0, crop.width, crop.height);
  const poses = model.estimate(crop, frame.frameIndex, frame.pts).landmarks
    .map(p => p.map(q => ({ x: region.x + q.x * region.w, y: region.y + q.y * region.h, visibility: q.visibility ?? 0 })));
  crop.width = 0;
  return whole ? poses.filter(p => BODY_POINTS.every(i => p[i] && p[i].x > region.x + EDGE_MARGIN && p[i].x < region.x + region.w - EDGE_MARGIN)) : poses;
}
/** The box of a pose's points seen (pixels); null with fewer than five. */
function boxOf(pose: readonly Pt[], w: number, h: number) {
  const s = pose.filter(q => (q.visibility ?? 0) >= .3);
  if (s.length < 5) return null;
  const xs = s.map(q => q.x * w), ys = s.map(q => q.y * h);
  return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) };
}
/** The first surveyed pose of someone running in `direction`: moving at running speed to the next survey frame. */
export function firstRunner(samples: { frame: number; pts: number; poses: Pt[][] }[], direction: number) {
  for (let i = 0; i + 1 < samples.length; i++) {
    const dt = samples[i + 1].pts - samples[i].pts; if (!(dt > 0)) continue;
    for (const p of samples[i].poses) {
      const a = pelvis(p);
      const runs = samples[i + 1].poses.some(q => { const b = pelvis(q), v = (b.x - a.x) / dt * direction;
        return Math.abs(b.y - a.y) < .05 && v >= RUN_SPEED[0] && v <= RUN_SPEED[1]; });
      if (runs) return { frame: samples[i].frame, pose: p };
    }
  }
  return null;
}

export async function measureHighJump(file: File, signal: AbortSignal, progress: (fraction: number, message: string) => void):
  Promise<{ frames: CrouchFrame[]; width: number; height: number; refiner: Refiner['backend'] | null; direction: number }> {
  let refiner: Refiner | null = null;
  try { refiner = await untilAborted(loadRefiner(signal, text => progress(0, text)), signal); }
  catch (e) { if (signal.aborted) throw e; refiner = null; }
  const model = new MobileCMJPose('full', undefined, 'CPU', 4, 'IMAGE');
  try {
    await untilAborted(model.initialize(signal, message => progress(0, message)), signal);
    // 1. The direction and the runner.
    const d = await untilAborted(demuxMP4(file), signal), count = d.frames.length;
    const step = Math.max(1, Math.floor(count / SURVEY_FRAMES)), samples: { frame: number; pts: number; poses: Pt[][] }[] = [];
    await readFrames(file, signal, i => i % step === 0, async (frame, source, w, h) => {
      samples.push({ frame: frame.frameIndex, pts: frame.pts, poses: SURVEY_REGIONS.flatMap(r => detect(model, source, r, frame, w, h, true)) });
      progress(.1 * frame.frameIndex / count, '走る向きと選手を探しています。');
    });
    const direction = surveyDirection(samples.map(s => ({ pts: s.pts, people: s.poses.map(pelvis) })));
    const seed = direction ? firstRunner(samples, direction) : null;
    if (!seed) throw new Error('走っている選手を見つけられませんでした。踏切の3歩前から、選手が画面を横切るように撮影してください。');

    // 2. Follow the athlete from there to the end.
    let width = 0, height = 0, last: Pt[] = seed.pose, size = 0;
    const frames: CrouchFrame[] = [];
    await readFrames(file, signal, i => i >= seed.frame, async (frame, source, w, h) => {
      width = w; height = h;
      const lb = boxOf(last, w, h) ?? { x0: 0, x1: w, y0: 0, y1: h }, cx = (lb.x0 + lb.x1) / 2, cy = (lb.y0 + lb.y1) / 2;
      size = Math.max(size * SIZE_KEEP, Math.max(lb.x1 - lb.x0, lb.y1 - lb.y0));
      const rw = Math.min(1, Math.max(FOLLOW_WIDTH, FOLLOW_SIZES * size / w)), rx = Math.max(0, Math.min(1 - rw, cx / w - rw / 2));
      let best: Pt[] | null = null, nearest = Infinity;
      for (const q of detect(model, source, { x: rx, y: 0, w: rw, h: 1 }, frame, w, h, false)) {
        const b = boxOf(q, w, h); if (!b) continue;
        const dist = Math.hypot((b.x0 + b.x1) / 2 - cx, (b.y0 + b.y1) / 2 - cy); if (dist < nearest) { nearest = dist; best = q; }
      }
      const found = best && nearest < FOLLOW_REACH * size ? best : null;
      let refined: CrouchPoint[] | null = null;
      if (refiner) {
        const hh = Math.max(KEEP_HEIGHT * size, lb.y1 - lb.y0) / 2, hw = Math.max(KEEP_WIDTH * size, lb.x1 - lb.x0) / 2;
        const box = found ?? [[cx - hw, cy - hh], [cx + hw, cy - hh], [cx - hw, cy + hh], [cx + hw, cy + hh], [cx, cy]].map(([x, y]) => ({ x: x / w, y: y / h, visibility: 1 }));
        refined = await refiner.refine(source, box as CrouchPoint[]);
      }
      if (refined && boxOf(refined, w, h)) last = refined; else if (found) last = found;
      const pose = (found as CrouchPoint[] | null) ?? refined;
      frames.push({ frame: frame.frameIndex, pts: frame.pts, pose, ...(refiner ? { refined } : {}) });
      progress(.1 + .75 * frame.frameIndex / count, '選手を追っています。');
    });

    // 3. Before the first frame followed: along the path led back.
    const followed = frames.filter(f => f.pose);
    if (followed.length && seed.frame > 0) {
      const first = followed[0], start = followed.filter(f => f.pts - first.pts <= PATH_FIT_SECONDS).map(f => ({ t: f.pts, ...pelvis(f.pose!) }));
      const mt = start.reduce((s, p) => s + p.t, 0) / start.length, mx = start.reduce((s, p) => s + p.x, 0) / start.length;
      const den = start.reduce((s, p) => s + (p.t - mt) ** 2, 0), speed = den > 0 ? start.reduce((s, p) => s + (p.t - mt) * (p.x - mx), 0) / den : 0;
      const ys = followed.slice(0, 30).flatMap(f => f.pose!.filter(p => (p.visibility ?? 0) >= .3).map(p => p.y));
      const top = Math.max(0, Math.min(...ys) - .1), bottom = Math.min(1, Math.max(...ys) + .1);
      const earlier: CrouchFrame[] = [];
      progress(.85, '踏切の前の動きを確認しています。');
      await readFrames(file, signal, i => i < seed.frame, async (frame, source, w, h) => {
        const x = mx + speed * (frame.pts - mt);
        if (x < -.02 || x > 1.02) return;
        const region = { x: Math.max(0, Math.min(.64, x - .18)), y: top, w: .36, h: bottom - top };
        const pose = detect(model, source, region, frame, w, h, true).map(p => ({ p, d: Math.abs(pelvis(p).x - x) }))
          .filter(c => c.d < PATH_TOLERANCE).sort((a, b) => a.d - b.d)[0]?.p;
        if (!pose) return;
        const found: CrouchFrame = { frame: frame.frameIndex, pts: frame.pts, pose: pose as CrouchPoint[] };
        if (refiner) found.refined = await refiner.refine(source, found.pose!);
        earlier.push(found);
        progress(.85 + .15 * frame.frameIndex / seed.frame, '踏切の前の動きを確認しています。');
      });
      frames.unshift(...earlier);
    }
    progress(1, '解析が終わりました。');
    return { frames, width, height, refiner: refiner?.backend ?? null, direction };
  } finally { model.dispose(); }
}
