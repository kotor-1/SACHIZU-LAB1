/** The standing athlete's keypoints for the posture check: RTMPose-l 384x288 (Halpe26), read to a part of the model's
 * bin and averaged over the picture and its mirror image (and, from the camera, over a few frames). A still is measured
 * once, so it is read as finely as the model allows. v1 (RTMPose-m 256x192): on the standing frames of 6 CMJ videos
 * the parabola through the peak, the mirror image and 3 window sizes took the frame-to-frame spread of the tilts from
 * 0.3-0.7° to 0.1-0.4°. v2 (2026-10-08, the user's photos, dev-validation/posture/study3-7.ts): the larger model at the
 * larger input read the head's tilt within 0.1–0.6° of the glasses' (v1: 2° off, the other way); the window averaged
 * over each input pixel (model-input.ts) took the spread over downscales and first windows to 0.00–0.05°; and the
 * head read again in its own window (front and back) steadied the ear line (0.65° -> 0.24° over window sizes). */

/** A keypoint in the picture's pixels, with the model's score (0-1). */
export interface Keypoint { x: number; y: number; score: number }
/** Halpe26's keypoints. */
export const K = {
  nose: 0, leftEye: 1, rightEye: 2, leftEar: 3, rightEar: 4, leftShoulder: 5, rightShoulder: 6, leftElbow: 7, rightElbow: 8,
  leftWrist: 9, rightWrist: 10, leftHip: 11, rightHip: 12, leftKnee: 13, rightKnee: 14, leftAnkle: 15, rightAnkle: 16,
  head: 17, neck: 18, hip: 19, leftBigToe: 20, rightBigToe: 21, leftSmallToe: 22, rightSmallToe: 23, leftHeel: 24, rightHeel: 25,
} as const;
export const COUNT = 26;
/** Left and right keypoints, swapped in a mirror image. */
export const PAIRS: readonly (readonly [number, number])[] = [[1, 2], [3, 4], [5, 6], [7, 8], [9, 10], [11, 12], [13, 14], [15, 16], [20, 21], [22, 23], [24, 25]];
/** The model's input (pixels) and its bins (2 a pixel). */
export const IW = 288, IH = 384, SPLIT = 2;
/** The model's window on the picture: its centre (pixels) and the picture's pixels per input pixel. */
export interface Crop { cx: number; cy: number; scale: number }

/** The peak of a row of bins, to a part of a bin: the parabola through the highest bin and its neighbours. */
export function peak(row: ArrayLike<number>, start: number, n: number): { at: number; value: number } {
  let best = 0;
  for (let j = 1; j < n; j++) if (row[start + j] > row[start + best]) best = j;
  const value = row[start + best];
  if (best === 0 || best === n - 1) return { at: best, value };
  const l = row[start + best - 1], r = row[start + best + 1], den = l - 2 * value + r;
  return { at: den < 0 ? best + Math.max(-.5, Math.min(.5, (l - r) / (2 * den))) : best, value };
}

/** The model's outputs (SimCC, 26 rows of bins for x and for y) as keypoints in the picture. `mirrored`: the window was
 * drawn mirrored, so x is mirrored back and left and right swapped. */
export function decode(simccX: ArrayLike<number>, simccY: ArrayLike<number>, crop: Crop, mirrored = false): Keypoint[] {
  const NX = simccX.length / COUNT, NY = simccY.length / COUNT, out: Keypoint[] = [];
  for (let k = 0; k < COUNT; k++) {
    const px = peak(simccX, k * NX, NX), py = peak(simccY, k * NY, NY);
    const u = mirrored ? IW - px.at / SPLIT : px.at / SPLIT, v = py.at / SPLIT;
    out.push({ x: crop.cx + (u - IW / 2) * crop.scale, y: crop.cy + (v - IH / 2) * crop.scale, score: Math.min(px.value, py.value) });
  }
  if (mirrored) for (const [a, b] of PAIRS) [out[a], out[b]] = [out[b], out[a]];
  return out;
}

/** The mean of readings of the same keypoints (the score: the lowest). */
export function meanOf(list: readonly (readonly Keypoint[])[]): Keypoint[] {
  return list[0].map((_, k) => ({ x: list.reduce((t, p) => t + p[k].x, 0) / list.length, y: list.reduce((t, p) => t + p[k].y, 0) / list.length,
    score: Math.min(...list.map(p => p[k].score)) }));
}
/** The median of each keypoint's x, y and score over readings (frames): a frame read wrong does not move it. */
export function medianOf(list: readonly (readonly Keypoint[])[]): Keypoint[] {
  const mid = (v: number[]) => { const s = [...v].sort((a, b) => a - b), n = s.length; return n % 2 ? s[n >> 1] : (s[n / 2 - 1] + s[n / 2]) / 2; };
  return list[0].map((_, k) => ({ x: mid(list.map(p => p[k].x)), y: mid(list.map(p => p[k].y)), score: mid(list.map(p => p[k].score)) }));
}

/** The model's 3:4 window round points (pixels) scored at least `min`: their box widened `widen` times, as RTMPose was
 * trained (1.25). Null with fewer than 5 points. */
export function cropAround(points: readonly { x: number; y: number; score?: number }[], widen = 1.25, min = .3): Crop | null {
  const seen = points.filter(p => Number.isFinite(p.x) && Number.isFinite(p.y) && (p.score ?? 1) >= min);
  if (seen.length < 5) return null;
  const xs = seen.map(p => p.x), ys = seen.map(p => p.y);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  let w = Math.max(1, (x1 - x0) * widen), h = Math.max(1, (y1 - y0) * widen);
  if (w / h > IW / IH) h = w * IH / IW; else w = h * IW / IH;
  return { cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, scale: w / IW };
}
/** The same window `widen` times its size (the box it was made from is unchanged in the middle). */
export const resized = (c: Crop, widen: number, from = 1.25): Crop => ({ ...c, scale: c.scale * widen / from });

/** The face's points, read again in the head's window. */
export const FACE = [K.nose, K.leftEye, K.rightEye, K.leftEar, K.rightEar] as const;
/** The head's window: round the face, the top of the head, the neck and the shoulders (the ears and eyes about 4 times
 * larger than in the whole body's). Null when too few of them are seen. */
export const headCrop = (points: readonly Keypoint[]) =>
  cropAround([...FACE, K.head, K.neck, K.leftShoulder, K.rightShoulder].map(k => points[k]));
/** The body's points with the face's from the head's window (their scores: the lower of the two, so a face the body's
 * window did not see, from behind, stays unseen). */
export const withHead = (body: readonly Keypoint[], head: readonly Keypoint[]): Keypoint[] =>
  body.map((p, k) => (FACE as readonly number[]).includes(k) ? { x: head[k].x, y: head[k].y, score: Math.min(p.score, head[k].score) } : p);
