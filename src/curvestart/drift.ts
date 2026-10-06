/** How far the picture has moved since the first frame (pixels, full size). The curve start videos drift while they are
 * recorded (iPhone stabilization or the phone settling: SD3 57 px across and 32 down over 5 s, SD5 130 and 136), so the
 * points set on the first frame miss the lines in the last, and early footprints sit off the lines traced in it. A small
 * grey copy of each frame (1/8 size) is matched to the first frame's over the track (the lower half of the picture, where
 * the lines and the start line are; the athlete is a small part of it): coarse at 1/16 size, then at 1/8 with a parabola
 * through the best match. */
export interface Small { data: Float32Array; width: number; height: number }
/** A 1/8-size grey copy (block means) of a grey picture. */
export function shrink(grey: Uint8Array | Uint8ClampedArray, width: number, height: number, k = 8): Small {
  const w = Math.floor(width / k), h = Math.floor(height / k), data = new Float32Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let sum = 0; for (let j = 0; j < k; j++) { const row = (y * k + j) * width + x * k; for (let i = 0; i < k; i++) sum += grey[row + i]; }
    data[y * w + x] = sum / (k * k);
  }
  return { data, width: w, height: h };
}
const half = (s: Small): Small => {
  const w = s.width >> 1, h = s.height >> 1, data = new Float32Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const a = 2 * y * s.width + 2 * x; data[y * w + x] = (s.data[a] + s.data[a + 1] + s.data[a + s.width] + s.data[a + s.width + 1]) / 4; }
  return { data, width: w, height: h };
};
/** Mean absolute difference of the two over the lower half of the first (b moved by dx, dy), each less its own mean. */
function cost(a: Small, b: Small, dx: number, dy: number) {
  const y0 = Math.max(Math.round(a.height * .45), -dy), y1 = Math.min(Math.round(a.height * .95), b.height - dy), x0 = Math.max(0, -dx), x1 = Math.min(a.width, b.width - dx);
  if (y1 - y0 < 10 || x1 - x0 < 10) return Infinity;
  let ma = 0, mb = 0, n = 0;
  for (let y = y0; y < y1; y += 2) for (let x = x0; x < x1; x += 2) { ma += a.data[y * a.width + x]; mb += b.data[(y + dy) * b.width + x + dx]; n++; }
  ma /= n; mb /= n; let s = 0;
  for (let y = y0; y < y1; y += 2) for (let x = x0; x < x1; x += 2) s += Math.abs(a.data[y * a.width + x] - ma - (b.data[(y + dy) * b.width + x + dx] - mb));
  return s / n;
}
/** The shift (full-size px) of picture b from picture a (both 1/8 copies), searched within `range` steps of 16 px (±190 px
 * by default) round `guess` (full-size px). */
export function pictureShift(a: Small, b: Small, guess: [number, number] = [0, 0], range = 12, k = 8): [number, number] {
  // Coarse: 1/16 size, round the guess.
  const a2 = half(a), b2 = half(b), gx = Math.round(guess[0] / (2 * k)), gy = Math.round(guess[1] / (2 * k));
  let best = { c: Infinity, x: gx, y: gy };
  for (let dy = gy - range; dy <= gy + range; dy++) for (let dx = gx - range; dx <= gx + range; dx++) { const c = cost(a2, b2, dx, dy); if (c < best.c) best = { c, x: dx, y: dy }; }
  // Fine: 1/8 size, ±2 round the coarse, then a parabola through the best and its neighbours in each direction.
  let fine = { c: Infinity, x: best.x * 2, y: best.y * 2 };
  for (let dy = best.y * 2 - 2; dy <= best.y * 2 + 2; dy++) for (let dx = best.x * 2 - 2; dx <= best.x * 2 + 2; dx++) { const c = cost(a, b, dx, dy); if (c < fine.c) fine = { c, x: dx, y: dy }; }
  const sub = (m: number, c0: number, p: number) => { const d = m - 2 * c0 + p; return d > 0 ? (m - p) / (2 * d) : 0; };
  const fx = sub(cost(a, b, fine.x - 1, fine.y), fine.c, cost(a, b, fine.x + 1, fine.y)), fy = sub(cost(a, b, fine.x, fine.y - 1), fine.c, cost(a, b, fine.x, fine.y + 1));
  return [(fine.x + Math.max(-.5, Math.min(.5, fx))) * k, (fine.y + Math.max(-.5, Math.min(.5, fy))) * k];
}

/** One frame's shift from the first (full-size px). */
export interface Drift { frame: number; dx: number; dy: number }
/** The shift at a frame, between the frames measured (straight between, the nearest beyond). */
export function driftAt(drift: readonly Drift[], frame: number): [number, number] {
  if (!drift.length) return [0, 0];
  let i = 0; while (i + 1 < drift.length && drift[i + 1].frame <= frame) i++;
  const a = drift[i], b = drift[i + 1];
  if (!b || frame <= a.frame) return [a.dx, a.dy];
  const t = (frame - a.frame) / (b.frame - a.frame);
  return [a.dx + (b.dx - a.dx) * t, a.dy + (b.dy - a.dy) * t];
}
/** A 1/8-size grey copy of a picture on a canvas. The browser shrinks it on one small canvas kept for the purpose (not
 * one marked for frequent reading: drawing a large picture into such a canvas copies the whole picture out first, about
 * 33 MB at 4K for every frame measured), and only the small copy is read. */
let small: HTMLCanvasElement | null = null;
export function shrinkCanvas(source: HTMLCanvasElement, width: number, height: number, k = 8): Small {
  const w = Math.floor(width / k), h = Math.floor(height / k);
  small ??= document.createElement('canvas');
  if (small.width !== w || small.height !== h) { small.width = w; small.height = h; }
  const ctx = small.getContext('2d')!; ctx.imageSmoothingQuality = 'high'; ctx.drawImage(source, 0, 0, width, height, 0, 0, w, h);
  const rgba = ctx.getImageData(0, 0, w, h).data, data = new Float32Array(w * h);
  for (let i = 0, j = 0; i < data.length; i++, j += 4) data[i] = .3 * rgba[j] + .59 * rgba[j + 1] + .11 * rgba[j + 2];
  return { data, width: w, height: h };
}
