import { readFrames } from '../hurdling/recording';
import type { PixelRegion, RegionPictures } from './crouch-pixels';

/** The pictures of the regions round the feet (crouch-pixels.ts regionsOf), RGB, in the frames each needs: the video is
 * read once more, only up to the last of them, and only the small regions are kept (a few MB). */
export async function readPictures(file: File, regions: readonly PixelRegion[], signal: AbortSignal,
  progress: (fraction: number) => void = () => {}): Promise<RegionPictures> {
  const out: RegionPictures = new Map(regions.map(q => [q.key, new Map()]));
  if (!regions.length) return out;
  const first = Math.min(...regions.map(q => q.from)), last = Math.max(...regions.map(q => q.to));
  const wanted = (i: number) => regions.some(q => i >= q.from && i <= q.to);
  await readFrames(file, signal, wanted, async (frame, source) => {
    const ctx = source.getContext('2d'); if (!ctx) return;
    for (const q of regions) if (frame.frameIndex >= q.from && frame.frameIndex <= q.to) {
      const rgba = ctx.getImageData(q.x, q.y, q.w, q.h).data, rgb = new Uint8Array(q.w * q.h * 3);
      for (let i = 0, j = 0; i < rgb.length; i += 3, j += 4) { rgb[i] = rgba[j]; rgb[i + 1] = rgba[j + 1]; rgb[i + 2] = rgba[j + 2]; }
      out.get(q.key)!.set(frame.frameIndex, rgb);
    }
    progress((frame.frameIndex - first) / Math.max(1, last - first));
  });
  return out;
}
