/** The athlete's pose in every frame of a curve start filmed from behind the blocks
 * (running away from the camera), the last frame's picture (the track clear, for the
 * lane lines) and the focal length. MediaPipe (IMAGE mode, up to 4 people) finds the
 * athlete in the first frame (the biggest person in the lower part of the picture) and
 * follows them in a square round their last place (the nearest person there); RTMPose
 * gives the points used (heels and toes for the footprints). On the four test videos
 * (4K, 60 fps) the athlete was followed to 15-20 m in 10-16 s (development machine). */
import { demuxMP4 } from '../frame-engine/mp4-demuxer';
import { MobileCMJPose } from '../cmj/mobile-pose';
import { untilAborted } from '../cmj/session-lifecycle';
import type { CrouchFrame, CrouchPoint } from '../sprint10/crouch';
import { loadRefiner, type Refiner } from '../sprint10/rtm-refine';
import { readFrames } from '../hurdling/recording';
import { luminance, type Luma } from './lanes';
import type { FirstFrame } from '../sprint10/first-frame';
import { FOCAL_35MM_DEFAULT, type P2 } from './camera';
import { readFocal35 } from './focal';
import { pictureShift, shrinkCanvas, type Drift, type Small } from './drift';

type Pt = { x: number; y: number; visibility?: number };
type Region = { x: number; y: number; w: number; h: number };
/** Where the athlete is looked for in the first frames: the lower middle of the picture, in two overlapping halves. */
const SEED_REGIONS: Region[] = [{ x: 0, y: .3, w: .7, h: .55 }, { x: .3, y: .3, w: .7, h: .55 }];
/** Following: a square FOLLOW_SIZES times the athlete's size (at least FOLLOW_MIN of the width); a person further than
 * FOLLOW_REACH sizes from the last place is someone else. The size is forgotten slowly (the athlete gets smaller). */
const FOLLOW_SIZES = 2.2, FOLLOW_MIN = .08, FOLLOW_REACH = .6, SIZE_KEEP = .97;
/** The clear frame's picture for drawing: at most this many pixels on its long side. */
const PICTURE = 1600;
/** The picture's drift from the first frame is measured every DRIFT_EVERY frames (and on the last). */
const DRIFT_EVERY = 4;

function boxOf(pose: readonly Pt[], w: number, h: number) {
  const s = pose.filter(q => (q.visibility ?? 0) >= .3); if (s.length < 5) return null;
  const xs = s.map(q => q.x * w), ys = s.map(q => q.y * h);
  return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) };
}
function detect(model: MobileCMJPose, source: HTMLCanvasElement, region: Region, frame: { frameIndex: number; pts: number }, w: number, h: number): Pt[][] {
  const crop = document.createElement('canvas'), cc = crop.getContext('2d')!;
  const pw = region.w * w, ph = region.h * h, scale = 512 / Math.max(pw, ph);
  crop.width = Math.round(pw * scale); crop.height = Math.round(ph * scale);
  cc.drawImage(source, region.x * w, region.y * h, pw, ph, 0, 0, crop.width, crop.height);
  const poses = model.estimate(crop, frame.frameIndex, frame.pts).landmarks.map(q => q.map(l => ({ x: region.x + l.x * region.w, y: region.y + l.y * region.h, visibility: l.visibility ?? 0 })));
  crop.width = 0;
  return poses;
}

export interface CurveRecording {
  frames: CrouchFrame[]; width: number; height: number; refiner: Refiner['backend'] | null;
  /** The last frame: its luminance for the lane lines, a smaller JPEG for drawing, and its index. */
  clear: { luma: Luma; image: string; frame: number };
  /** The focal length used (35 mm equivalent) and whether it came from the video. */
  mm35: number; mm35Read: boolean;
  /** How far the picture moved from the first frame, frame by frame (full-size px; see drift.ts). */
  drift: Drift[];
}
export async function measureCurveStart(file: File, signal: AbortSignal, progress: (fraction: number, message: string) => void): Promise<CurveRecording> {
  let refiner: Refiner | null = null;
  try { refiner = await untilAborted(loadRefiner(signal, text => progress(0, text)), signal); }
  catch (e) { if (signal.aborted) throw e; refiner = null; }
  const model = new MobileCMJPose('full', undefined, 'CPU', 4, 'IMAGE');
  try {
    await untilAborted(model.initialize(signal, message => progress(0, message)), signal);
    const read = await readFocal35(file).catch(() => null);
    const count = (await untilAborted(demuxMP4(file), signal)).frames.length;
    const frames: CrouchFrame[] = [];
    let width = 0, height = 0, last: Pt[] | null = null, size = 0, clear: CurveRecording['clear'] | null = null, first: Small | null = null;
    const drift: Drift[] = [];
    await readFrames(file, signal, () => true, async (frame, source, w, h) => {
      width = w; height = h;
      let found: Pt[] | null = null;
      if (!last) {
        // The athlete in the blocks: the biggest person in the lower part of the picture.
        let big = 0;
        for (const q of SEED_REGIONS.flatMap(r => detect(model, source, r, frame, w, h))) { const b = boxOf(q, w, h); if (b && b.y1 - b.y0 > big) { big = b.y1 - b.y0; found = q; } }
      } else {
        const lb = boxOf(last, w, h)!, cx = (lb.x0 + lb.x1) / 2, cy = (lb.y0 + lb.y1) / 2;
        size = Math.max(size * SIZE_KEEP, Math.max(lb.x1 - lb.x0, lb.y1 - lb.y0));
        const side = Math.max(FOLLOW_MIN * w, FOLLOW_SIZES * size), rx = Math.max(0, Math.min(w - side, cx - side / 2)), ry = Math.max(0, Math.min(h - side, cy - side / 2));
        let nearest = Infinity;
        for (const q of detect(model, source, { x: rx / w, y: ry / h, w: side / w, h: side / h }, frame, w, h)) {
          const b = boxOf(q, w, h); if (!b) continue;
          const d = Math.hypot((b.x0 + b.x1) / 2 - cx, (b.y0 + b.y1) / 2 - cy); if (d < nearest) { nearest = d; found = q; }
        }
        if (found && nearest > FOLLOW_REACH * size) found = null;
      }
      let refined: CrouchPoint[] | null = null;
      const base = found ?? last, b = base && boxOf(base, w, h);
      if (refiner && b) {
        const box = found ?? [[b.x0, b.y0], [b.x1, b.y0], [b.x0, b.y1], [b.x1, b.y1], [(b.x0 + b.x1) / 2, (b.y0 + b.y1) / 2]].map(([x, y]) => ({ x: x / w, y: y / h, visibility: 1 }));
        refined = await refiner.refine(source, box as CrouchPoint[]);
      }
      if (refined && boxOf(refined, w, h)) last = refined; else if (found) last = found;
      if (last && !size) { const lb = boxOf(last, w, h)!; size = Math.max(lb.x1 - lb.x0, lb.y1 - lb.y0); }
      frames.push({ frame: frame.frameIndex, pts: frame.pts, pose: found as CrouchPoint[] | null, ...(refiner ? { refined } : {}) });
      if (frame.frameIndex % DRIFT_EVERY === 0 || frame.frameIndex === count - 1) {
        const small = shrinkCanvas(source, w, h);
        if (!first) { first = small; drift.push({ frame: frame.frameIndex, dx: 0, dy: 0 }); }
        else { const prev = drift.at(-1)!, [dx, dy] = pictureShift(first, small, [prev.dx, prev.dy]); drift.push({ frame: frame.frameIndex, dx, dy }); }
      }
      if (frame.frameIndex === count - 1) {
        const ctx = source.getContext('2d')!, k = Math.min(1, PICTURE / Math.max(w, h)), small = document.createElement('canvas');
        small.width = Math.round(w * k); small.height = Math.round(h * k); small.getContext('2d')!.drawImage(source, 0, 0, small.width, small.height);
        clear = { luma: luminance(ctx.getImageData(0, 0, w, h).data, w, h), image: small.toDataURL('image/jpeg', .85), frame: frame.frameIndex }; small.width = 0;
      }
      progress(.05 + .95 * frame.frameIndex / Math.max(1, count), '選手を追っています。');
    });
    if (!frames.some(f => f.pose || f.refined)) throw new Error('選手を見つけられませんでした。ブロックの真後ろから、構えた選手の全身が映るように撮影してください。');
    if (!clear) throw new Error('動画の最後のコマを読み出せませんでした。');
    return { frames, width, height, refiner: refiner?.backend ?? null, clear, mm35: read ?? FOCAL_35MM_DEFAULT, mm35Read: read !== null, drift };
  } finally { model.dispose(); }
}

/** The picture to set the points on (the first frame, as the analysis decodes it) and the lines' picture (the last frame,
 * the track clear, and how far it has moved from the first), read in one pass when a video is chosen, so the lines the
 * analysis will follow can be drawn while the points are set. The first frame is handed on as soon as it is read. On the
 * first frame the athlete in the blocks hides parts of the lines and their arms and legs look like lines, so the lines are
 * followed in the last frame, as the analysis does. */
export interface VideoEnds { luma: Luma; shift: P2; frame: number }
export async function readEnds(file: File, signal: AbortSignal, first: (picture: FirstFrame) => void): Promise<VideoEnds | null> {
  const count = (await untilAborted(demuxMP4(file), signal)).frames.length;
  let small: Small | null = null, ends: VideoEnds | null = null;
  await readFrames(file, signal, i => i === 0 || i === count - 1, async (frame, source, w, h) => {
    if (frame.frameIndex === 0) {
      const k = Math.min(1, 1280 / w), c = document.createElement('canvas'); c.width = Math.round(w * k); c.height = Math.round(h * k);
      c.getContext('2d')!.drawImage(source, 0, 0, c.width, c.height); first({ image: c.toDataURL('image/jpeg', .85), width: w, height: h }); c.width = 0;
      small = shrinkCanvas(source, w, h);
    }
    if (frame.frameIndex === count - 1 && small) {
      // Straight from the first frame to the last, so searched wider than frame to frame (±380 px).
      const shift = pictureShift(small, shrinkCanvas(source, w, h), [0, 0], 24);
      ends = { luma: luminance(source.getContext('2d')!.getImageData(0, 0, w, h).data, w, h), shift, frame: frame.frameIndex };
    }
  });
  return ends;
}
