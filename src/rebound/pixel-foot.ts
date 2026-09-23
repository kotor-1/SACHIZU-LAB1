/** Experimental, high-contrast dark-footwear silhouette only. Not a general
 * shoe segmenter. No RSI or desired duration is an input to this module. */
export interface GrayImage { width: number; height: number; pixels: Uint8Array }
export interface FootBox { x: number; y: number; width: number; height: number }
export interface FootEdge { ys: [number, number, number] | null; contrast: number; reason: string | null }
export interface PixelRow { frame: number; pts: number; feet: [FootEdge, FootEdge] }
export interface PixelBoundary {
  seed: number; pts: number | null; range: [number, number] | null;
  reason: string | null; error: number | null;
}
export const PIXEL_PARAMETERS = { version: 'dark-foot-edge-v1-experimental',
  minimumContrast: 35, thresholds: [.25, .35, .45], searchSeconds: .075,
  windows: [.08, .10, .12], maximumGapSeconds: .013, maximumSensitivitySeconds: .025,
  imageHeight: 960, minimumAirTravelPixels: 8, minimumEdgeSpeedPixelsPerSecond: 160, maximumFitErrorPixels: 3,
} as const;
const median = (a: number[]) => { const b = [...a].sort((x, y) => x - y); return b.length ? b[Math.floor(b.length / 2)] : NaN; };
function solve(xs: number[][], ys: number[]): number[] | null {
  const a = Array.from({ length: 4 }, (_, i) => [...Array.from({ length: 4 }, (_, j) => xs.reduce((s, x) => s + x[i] * x[j], 0)), xs.reduce((s, x, k) => s + x[i] * ys[k], 0)]);
  for (let i = 0; i < 4; i++) {
    let pivot = i; for (let j = i + 1; j < 4; j++) if (Math.abs(a[j][i]) > Math.abs(a[pivot][i])) pivot = j;
    if (Math.abs(a[pivot][i]) < 1e-9) return null;
    [a[i], a[pivot]] = [a[pivot], a[i]];
    const v = a[i][i]; for (let j = i; j <= 4; j++) a[i][j] /= v;
    for (let k = 0; k < 4; k++) if (k !== i) { const f = a[k][i]; for (let j = i; j <= 4; j++) a[k][j] -= f * a[i][j]; }
  }
  return a.map(r => r[4]);
}

/** A floor strip below the pose-localized shoe must be brighter than footwear.
 * Reject dark/occluded floors and masks clipped by the search box. */
export function darkFootEdge(image: GrayImage, box: FootBox): FootEdge {
  const fail = (reason: string, contrast = 0): FootEdge => ({ ys: null, contrast, reason });
  const { width: w, height: h, pixels } = image;
  if (![box.x, box.y, box.width, box.height].every(Number.isFinite) || pixels.length !== w * h) return fail('INVALID_IMAGE_OR_BOX');
  const x0 = Math.floor(box.x), y0 = Math.floor(box.y), bw = Math.floor(box.width), bh = Math.floor(box.height);
  if (x0 < 0 || y0 < 0 || x0 + bw >= w || y0 + bh >= h || bw < 8 || bh < 12) return fail('FOOT_OUTSIDE_IMAGE');
  const floor: number[] = [], values: number[] = [];
  for (let y = 0; y < bh; y++) for (let x = 0; x < bw; x++) {
    const v = pixels[(y0 + y) * w + x0 + x];
    if (y >= bh * .85) floor.push(v); else values.push(v);
  }
  values.sort((a, b) => a - b);
  const dark = values[Math.floor(values.length * .1)], background = median(floor), contrast = background - dark;
  if (contrast < PIXEL_PARAMETERS.minimumContrast) return fail('FOOT_FLOOR_CONTRAST_LOW', contrast);
  const ys: number[] = [];
  for (const ratio of PIXEL_PARAMETERS.thresholds) {
    const threshold = dark + contrast * ratio;
    const mask = new Uint8Array(bw * bh);
    for (let y = 0; y < bh; y++) for (let x = 0; x < bw; x++) mask[y * bw + x] = pixels[(y0 + y) * w + x0 + x] < threshold ? 1 : 0;
    let component: number[] = [];
    for (let k = 0; k < mask.length; k++) {
      if (!mask[k]) continue;
      mask[k] = 0; const queue = [k];
      for (let i = 0; i < queue.length; i++) {
        const p = queue[i], x = p % bw, y = Math.floor(p / bw);
        for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
          const nx = x + dx, ny = y + dy, n = ny * bw + nx;
          if (nx >= 0 && nx < bw && ny >= 0 && ny < bh && mask[n]) { mask[n] = 0; queue.push(n); }
        }
      }
      if (queue.length > component.length) component = queue;
    }
    if (component.length < bw * 3) return fail('SHOE_COMPONENT_MISSING', contrast);
    mask.fill(0); for (const p of component) mask[p] = 1;
    let last = -1, previous = false;
    for (let y = 0; y < bh; y++) {
      let run = 0, longest = 0;
      for (let x = 0; x < bw; x++) {
        run = mask[y * bw + x] ? run + 1 : 0;
        longest = Math.max(longest, run);
      }
      const good = longest >= Math.max(3, Math.ceil(bw * .12));
      if (good && previous) last = y;
      previous = good;
    }
    if (last < 2 || last >= bh * .85) return fail('SOLE_MASK_UNRESOLVED', contrast);
    ys.push(y0 + last);
  }
  return { ys: ys as [number, number, number], contrast, reason: null };
}

/** Continuous linear-support / quadratic-air change point. Each threshold
 * and window must agree; no copying a duration from the registered cycle. */
export function fitPixelBoundary(rows: readonly PixelRow[], side: 0 | 1, seed: number, kind: 'takeoff' | 'landing'): PixelBoundary {
  const base: PixelBoundary = { seed, pts: null, range: null, reason: null, error: null };
  const fail = (reason: string): PixelBoundary => ({ ...base, reason });
  if (!Number.isFinite(seed) || rows.some((r, i) => !Number.isFinite(r.pts) || (i > 0 && r.pts <= rows[i - 1].pts))) return fail('INVALID_TIMELINE');
  const direction = kind === 'takeoff' ? 1 : -1;
  const estimates: number[] = [], errors: number[] = [];
  let nominal = NaN;
  for (const window of PIXEL_PARAMETERS.windows) for (let channel = 0; channel < 3; channel++) {
    const local = rows.filter(r => Math.abs(r.pts - seed) <= window);
    if (local.length < 18 || local.some((r, i) => !r.feet[side].ys || !r.feet[side].ys!.every(Number.isFinite) || (i > 0 && r.pts - local[i - 1].pts > PIXEL_PARAMETERS.maximumGapSeconds))) return fail('PIXEL_TRACKING_GAP');
    const candidates: { time: number; error: number }[] = [];
    for (const r of local) {
      if (Math.abs(r.pts - seed) > PIXEL_PARAMETERS.searchSeconds) continue;
      // All candidates are scored on identical frames. Moving the scoring
      // window with the candidate would favour unrelated flat support patches.
      const span = local;
      const support = span.filter(q => direction * (q.pts - r.pts) <= 0);
      const air = span.filter(q => direction * (q.pts - r.pts) > 0);
      if (support.length < 5 || air.length < 5) continue;
      const xs = span.map(q => { const t = (q.pts - seed) / window, a = Math.max(0, direction * (q.pts - r.pts) / window); return [1, t, a, a * a]; });
      const ys = span.map(q => q.feet[side].ys![channel]), params = solve(xs, ys);
      if (!params || Math.abs(params[1] / window) > 120 || -params[2] / window < PIXEL_PARAMETERS.minimumEdgeSpeedPixelsPerSecond) continue;
      const maxAir = Math.max(...xs.map(x => x[2]));
      if (-params[2] * maxAir - params[3] * maxAir ** 2 < PIXEL_PARAMETERS.minimumAirTravelPixels || params[1] * direction + params[2] + 2 * params[3] * maxAir > 0) continue;
      const error = Math.sqrt(span.reduce((sum, _q, i) => sum + (ys[i] - xs[i].reduce((s, x, j) => s + x * params[j], 0)) ** 2, 0) / span.length);
      candidates.push({ time: r.pts, error });
    }
    if (!candidates.length) return fail('NO_MOTION_CHANGE');
    const best = candidates.reduce((a, b) => a.error < b.error ? a : b);
    if (Math.abs(best.time - seed) > PIXEL_PARAMETERS.searchSeconds - .006) return { ...base, error: best.error, range: [best.time, best.time], reason: 'SEARCH_EDGE' };
    if (best.error > PIXEL_PARAMETERS.maximumFitErrorPixels) return { ...base, error: best.error, range: [best.time, best.time], reason: 'SOLE_MOTION_MISMATCH' };
    estimates.push(best.time); errors.push(best.error);
    if (window === .08 && channel === 1) nominal = best.time;
  }
  const range: [number, number] = [Math.min(...estimates), Math.max(...estimates)];
  if (range[1] - range[0] > PIXEL_PARAMETERS.maximumSensitivitySeconds + 1e-9) return { ...base, range, reason: 'THRESHOLD_OR_WINDOW_DISAGREEMENT' };
  return { ...base, pts: nominal, range, error: Math.max(...errors) };
}
