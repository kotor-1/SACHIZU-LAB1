/** The pictures around the release for the implement's flight (implement.ts):
 * the region above and ahead of the throwing hand, read again from the video
 * after the athlete's pose is known. Frames 0.25-0.375 s before and after the
 * release make the background; the frames just after it are kept as masks of
 * what differs from it, the athlete's body masked out. A release moved by the
 * user within a few frames is covered by the same masks. */
import { readFrames } from '../hurdling/recording';
import { anglePose, type CrouchFrame } from '../sprint10/crouch';
import { bodyMask, differenceMask, medianBackground, type MaskFrame } from './implement';

/** The region: from 0.8 m behind to 1.8 m ahead of the hand, 1.8 m above to 0.5 m below it; worked on at most
 * MAX_WIDTH pixels wide (at 480 and 640 the 7 videos' flights agreed within 3%, recorded). */
const BEHIND = .8, AHEAD = 1.8, ABOVE = 1.8, BELOW = .5, MAX_WIDTH = 480;
/** In frames of 120 fps (every other frame at 240): the masks from 6 before to 22 after the release, the
 * background from 30 to 45 on either side (16 frames each side; fewer made a daylight video's flight fail). */
const MASKS = [-6, 22] as const, BACKGROUND = [30, 45] as const;

export interface ImplementFrames { masks: MaskFrame[]; release: number }

export async function measureImplement(file: File, frames: readonly CrouchFrame[], width: number, height: number,
  release: { frame: number; pts: number }, hand: { x: number; y: number }, direction: number, scale: number,
  signal: AbortSignal, progress: (fraction: number, message: string) => void): Promise<ImplementFrames> {
  const seen = frames.filter(f => f.pose), at = new Map(seen.map(f => [f.frame, f]));
  const d = seen.slice(1).map((f, i) => f.pts - seen[i].pts).filter(v => v > 0).sort((a, b) => a - b);
  const fps = d.length ? 1 / d[d.length >> 1] : 120, step = Math.max(1, Math.round(fps / 120));
  const left = direction > 0 ? hand.x - BEHIND * scale : hand.x - AHEAD * scale, right = direction > 0 ? hand.x + AHEAD * scale : hand.x + BEHIND * scale;
  const x0 = Math.max(0, Math.floor(left)), x1 = Math.min(width, Math.ceil(right)), y0 = Math.max(0, Math.floor(hand.y - ABOVE * scale)), y1 = Math.min(height, Math.ceil(hand.y + BELOW * scale));
  if (x1 - x0 < 8 || y1 - y0 < 8) return { masks: [], release: release.frame };
  const k = Math.min(1, MAX_WIDTH / (x1 - x0)), w = Math.max(1, Math.round((x1 - x0) * k)), h = Math.max(1, Math.round((y1 - y0) * k)), n = w * h;
  const near = new Set<number>(), back = new Set<number>();
  for (let i = MASKS[0]; i <= MASKS[1]; i++) near.add(release.frame + i * step);
  for (let i = BACKGROUND[0]; i <= BACKGROUND[1]; i++) { back.add(release.frame - i * step); back.add(release.frame + i * step); }
  const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('映像処理を開始できません。');
  const images = new Map<number, Uint8ClampedArray>(), backgrounds: Uint8ClampedArray[] = [];
  const last = Math.max(...near, ...back);
  progress(0, '用具の動きを調べています。');
  try {
    await readFrames(file, signal, i => near.has(i) || back.has(i), async (frame, source) => {
      ctx.drawImage(source, x0, y0, x1 - x0, y1 - y0, 0, 0, w, h);
      const data = ctx.getImageData(0, 0, w, h).data;
      if (back.has(frame.frameIndex)) backgrounds.push(data);
      if (near.has(frame.frameIndex)) images.set(frame.frameIndex, data);
      progress(Math.min(1, frame.frameIndex / last), '用具の動きを調べています。');
    });
  } finally { canvas.width = 0; }
  if (backgrounds.length < 8) return { masks: [], release: release.frame };
  const bg = medianBackground(backgrounds, n);
  const masks: MaskFrame[] = [];
  for (const [index, data] of [...images].sort((a, b) => a[0] - b[0])) {
    const f = at.get(index); if (!f) continue;
    const pose = anglePose(f)!.map(p => ({ x: (p.x * width - x0) / (x1 - x0), y: (p.y * height - y0) / (y1 - y0) }));
    masks.push({ frame: index, pts: f.pts, on: differenceMask(data, bg, bodyMask(pose, w, h, scale * k), n), w, h, origin: { x: x0, y: y0 }, k });
  }
  return { masks, release: release.frame };
}
