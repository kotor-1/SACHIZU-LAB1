/** The posture model's input and weights, without the browser: a window of the picture averaged over each input pixel's
 * footprint, and float16 weights widened back to float32. */
import { IH, IW, type Crop } from './keypoints';

/** RTMPose's input normalization (ImageNet's mean and spread, RGB). */
export const PIXEL_MEAN = [123.675, 116.28, 103.53], PIXEL_STD = [58.395, 57.12, 57.375];

/** For each of `n` input pixels from `start` (picture pixels, `scale` a pixel), the picture's pixels under its footprint
 * and how much of each it covers. */
function spans(start: number, n: number, scale: number, size: number) {
  return Array.from({ length: n }, (_, i) => {
    const a = start + i * scale, b = a + scale, at: number[] = [], part: number[] = [];
    for (let p = Math.max(0, Math.floor(a)); p < Math.min(size, Math.ceil(b)); p++) {
      const len = Math.min(b, p + 1) - Math.max(a, p);
      if (len > 0) { at.push(p); part.push(len); }
    }
    return { at, part };
  });
}

/** The rows summed across, kept from one window to the next (about 9 MB a window: made afresh, a photo's 14 windows left
 * 0.1 GB for the collector). */
let acrossBuffer = new Float32Array(0);
/** The model's input for window `c` of a picture (RGBA, `width` x `height`), normalized: each input pixel the mean of
 * the picture over its footprint, the picture's pixels taken as little squares and black outside it, as RTMPose was
 * trained. `mirrored`: the window drawn mirrored. Drawn on a canvas instead, the window is sampled at points and the
 * photo's fine detail shook the keypoints: in the study on the user's photos (dev-validation/posture/study3.ts) the
 * spread of the measures over 4 downscales of a photo x 3 first windows was 0.1–0.3° by points and 0.00–0.05° by area,
 * and Safari and Chrome no longer differ by how they draw. */
export function areaInput(rgba: ArrayLike<number>, width: number, height: number, c: Crop, mirrored: boolean, out = new Float32Array(3 * IW * IH)) {
  const s = c.scale, x0 = c.cx - IW / 2 * s, y0 = c.cy - IH / 2 * s;
  const cols = spans(x0, IW, s, width), rows = spans(y0, IH, s, height);
  // The rows the window covers, each first summed across into the input's columns.
  const top = Math.max(0, Math.floor(y0)), bottom = Math.min(height, Math.ceil(y0 + IH * s));
  const need = Math.max(0, bottom - top) * IW * 3;
  if (acrossBuffer.length < need) acrossBuffer = new Float32Array(need);
  const across = acrossBuffer;
  for (let y = top; y < bottom; y++) {
    const line = y * width * 4, row = (y - top) * IW * 3;
    for (let u = 0; u < IW; u++) {
      const { at, part } = cols[mirrored ? IW - 1 - u : u];
      let r = 0, g = 0, b = 0;
      for (let j = 0; j < at.length; j++) { const k = line + at[j] * 4, w = part[j]; r += rgba[k] * w; g += rgba[k + 1] * w; b += rgba[k + 2] * w; }
      across[row + u * 3] = r; across[row + u * 3 + 1] = g; across[row + u * 3 + 2] = b;
    }
  }
  const N = IW * IH, area = s * s;
  for (let v = 0; v < IH; v++) {
    const { at, part } = rows[v];
    for (let u = 0; u < IW; u++) {
      let r = 0, g = 0, b = 0;
      for (let j = 0; j < at.length; j++) { const k = ((at[j] - top) * IW + u) * 3, w = part[j]; r += across[k] * w; g += across[k + 1] * w; b += across[k + 2] * w; }
      const o = v * IW + u;
      out[o] = (r / area - PIXEL_MEAN[0]) / PIXEL_STD[0];
      out[N + o] = (g / area - PIXEL_MEAN[1]) / PIXEL_STD[1];
      out[2 * N + o] = (b / area - PIXEL_MEAN[2]) / PIXEL_STD[2];
    }
  }
  return out;
}

/** IEEE float16 values widened to float32 (the stored weights; rounding them changed no measure by more than 0.02°). */
export function widen(half: Uint16Array): Float32Array {
  const out = new Float32Array(half.length), bits = new Uint32Array(out.buffer);
  for (let i = 0; i < half.length; i++) {
    const h = half[i], sign = (h & 0x8000) << 16, e = (h >> 10) & 0x1f, m = h & 0x3ff;
    if (e === 0) out[i] = (sign ? -1 : 1) * m * 2 ** -24;   // zero and the subnormals
    else if (e === 31) bits[i] = (sign | 0x7f800000 | (m << 13)) >>> 0;
    else bits[i] = (sign | ((e + 112) << 23) | (m << 13)) >>> 0;
  }
  return out;
}
