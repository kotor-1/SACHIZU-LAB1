/** Experimental, high-contrast footwear silhouette on a contrasting floor.
 * No RSI or desired duration is an input to this module. */
export interface GrayImage { width: number; height: number; pixels: Uint8Array; rgba?: Uint8ClampedArray }
export interface FootBox { x: number; y: number; width: number; height: number }
export interface FootEdge { ys: [number, number, number] | null; contrast: number; reason: string | null }
export interface PixelRow {
  frame: number; pts: number; feet: [FootEdge, FootEdge];
  /** Matched frame and crop, retained so the whole recording can choose a
   * stable shoe/ground polarity instead of switching at individual frames. */
  darkFeet?: [FootEdge, FootEdge]; brightFeet?: [FootEdge, FootEdge];
}
export interface PixelBoundary {
  seed: number; pts: number | null; range: [number, number] | null;
  reason: string | null; error: number | null;
  model?: 'CURVED_SUPPORT';
  /** Sensitivity checks share pixels; these are not independent measurements. */
  conditionPts?: number[];
}
export const PIXEL_PARAMETERS = { version: 'contrast-foot-edge-v3-median-experimental',
  minimumContrast: 35, thresholds: [.25, .35, .45], searchSeconds: .075,
  windows: [.08, .10, .12], maximumGapSeconds: .013, maximumSensitivitySeconds: .025,
  imageHeight: 960, minimumAirTravelPixels: 8, minimumEdgeSpeedPixelsPerSecond: 160, maximumFitErrorPixels: 3,
} as const;
const median = (a: number[]) => { const b = [...a].sort((x, y) => x - y); return b.length ? b[Math.floor(b.length / 2)] : NaN; };
function solve(xs: number[][], ys: number[]): number[] | null {
  const n = xs[0].length;
  const a = Array.from({ length: n }, (_, i) => [...Array.from({ length: n }, (_, j) => xs.reduce((s, x) => s + x[i] * x[j], 0)), xs.reduce((s, x, k) => s + x[i] * ys[k], 0)]);
  for (let i = 0; i < n; i++) {
    let pivot = i; for (let j = i + 1; j < n; j++) if (Math.abs(a[j][i]) > Math.abs(a[pivot][i])) pivot = j;
    if (Math.abs(a[pivot][i]) < 1e-9) return null;
    [a[i], a[pivot]] = [a[pivot], a[i]];
    const v = a[i][i]; for (let j = i; j <= n; j++) a[i][j] /= v;
    for (let k = 0; k < n; k++) if (k !== i) { const f = a[k][i]; for (let j = i; j <= n; j++) a[k][j] -= f * a[i][j]; }
  }
  return a.map(r => r[n]);
}

/** Segment the pose-localized shoe against the floor immediately below it.
 * For a light shoe, minimum RGB separates a white sole from green grass even
 * when their gray levels are close. A component running into the floor strip
 * is rejected, including painted lines that merge into the sole. */
function footEdge(image: GrayImage, box: FootBox, polarity: 'DARK' | 'BRIGHT'): FootEdge {
  const fail = (reason: string, contrast = 0): FootEdge => ({ ys: null, contrast, reason });
  const { width: w, height: h, pixels, rgba } = image;
  if (![box.x, box.y, box.width, box.height].every(Number.isFinite) || pixels.length !== w * h
    || (rgba && rgba.length !== w * h * 4)) return fail('INVALID_IMAGE_OR_BOX');
  const x0 = Math.floor(box.x), y0 = Math.floor(box.y), bw = Math.floor(box.width), bh = Math.floor(box.height);
  if (x0 < 0 || y0 < 0 || x0 + bw >= w || y0 + bh >= h || bw < 8 || bh < 12) return fail('FOOT_OUTSIDE_IMAGE');
  const score = (index: number) => polarity === 'BRIGHT' && rgba
    ? Math.min(rgba[index * 4], rgba[index * 4 + 1], rgba[index * 4 + 2]) : pixels[index];
  const floor: number[] = [], values: number[] = [];
  for (let y = 0; y < bh; y++) for (let x = 0; x < bw; x++) {
    const v = score((y0 + y) * w + x0 + x);
    if (y >= bh * .85) floor.push(v); else values.push(v);
  }
  values.sort((a, b) => a - b);
  // A shoe may occupy under a tenth of a 90 px crop when the two nearby
  // search boxes have been split. The connected-component check below rejects
  // isolated bright turf pixels selected by this upper quantile.
  const foreground = values[Math.floor(values.length * (polarity === 'DARK' ? .1 : .95))];
  const background = median(floor);
  const contrast = (foreground - background) * (polarity === 'DARK' ? -1 : 1);
  if (contrast < PIXEL_PARAMETERS.minimumContrast) return fail('FOOT_FLOOR_CONTRAST_LOW', contrast);
  const ys: number[] = [];
  for (const ratio of PIXEL_PARAMETERS.thresholds) {
    const threshold = foreground + (background - foreground) * ratio;
    const mask = new Uint8Array(bw * bh);
    for (let y = 0; y < bh; y++) for (let x = 0; x < bw; x++) {
      const v = score((y0 + y) * w + x0 + x);
      mask[y * bw + x] = (polarity === 'DARK' ? v < threshold : v > threshold) ? 1 : 0;
    }
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

/** A dark shoe against a brighter floor. Kept as an explicit diagnostic path. */
export function darkFootEdge(image: GrayImage, box: FootBox): FootEdge {
  return footEdge(image, box, 'DARK');
}

/** A light shoe against darker ground, optionally using RGB to distinguish
 * white footwear from green turf at comparable gray brightness. */
export function brightFootEdge(image: GrayImage, box: FootBox): FootEdge {
  return footEdge(image, box, 'BRIGHT');
}

/** Choose the lower valid silhouette edge when both color polarities are
 * present in one local search box (for example a dark sock above a white shoe).
 * A failed path cannot contribute an edge to the motion fit. */
export function adaptiveFootEdge(image: GrayImage, box: FootBox): FootEdge {
  const dark = darkFootEdge(image, box), bright = brightFootEdge(image, box);
  return selectFootEdge(dark, bright);
}

/** Choose between precomputed polarities for preview/diagnostics. Recording
 * review still uses one stable polarity for all frames of the video. */
export function selectFootEdge(dark: FootEdge, bright: FootEdge): FootEdge {
  if (!dark.ys) return bright.ys ? bright : dark.contrast >= bright.contrast ? dark : bright;
  if (!bright.ys) return dark;
  // Turf shadows can themselves form a long connected dark component below
  // a white shoe. Prefer the polarity with clearly stronger floor contrast;
  // only use edge position when the two contrasts are comparable.
  if (bright.contrast > dark.contrast * 1.25) return bright;
  if (dark.contrast > bright.contrast * 1.25) return dark;
  const darkEdge = median(dark.ys), brightEdge = median(bright.ys);
  return brightEdge > darkEdge + 2 ? bright : darkEdge > brightEdge + 2 ? dark
    : bright.contrast > dark.contrast ? bright : dark;
}

/** Continuous linear-support / quadratic-air change point. Each threshold
 * and window must agree; no copying a duration from the registered cycle. */
export function fitPixelBoundary(rows: readonly PixelRow[], side: 0 | 1, seed: number, kind: 'takeoff' | 'landing'): PixelBoundary {
  return fitBoundaryModel(rows, side, seed, kind, false);
}

/** Curved support silhouette (shoe rotation/deformation), retaining a distinct
 * velocity change at the boundary. Does not assume the moving edge is COM. */
export function fitCurvedPixelBoundary(rows: readonly PixelRow[], side: 0 | 1, seed: number, kind: 'takeoff' | 'landing'): PixelBoundary {
  return fitBoundaryModel(rows, side, seed, kind, true);
}
function fitBoundaryModel(rows: readonly PixelRow[], side: 0 | 1, seed: number, kind: 'takeoff' | 'landing', curved: boolean): PixelBoundary {
  const base: PixelBoundary = { seed, pts: null, range: null, reason: null, error: null, ...(curved ? { model: 'CURVED_SUPPORT' as const } : {}) };
  const fail = (reason: string): PixelBoundary => ({ ...base, reason });
  if (!Number.isFinite(seed) || rows.some((r, i) => !Number.isFinite(r.pts) || (i > 0 && r.pts <= rows[i - 1].pts))) return fail('INVALID_TIMELINE');
  const direction = kind === 'takeoff' ? 1 : -1;
  const estimates: number[] = [], errors: number[] = [];
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
      const xs = span.map(q => { const t = (q.pts - seed) / window, a = Math.max(0, direction * (q.pts - r.pts) / window); return curved ? [1, t, a, a * a, t * t] : [1, t, a, a * a]; });
      const ys = span.map(q => q.feet[side].ys![channel]);
      const params = solve(xs, ys);
      const boundaryT = (r.pts - seed) / window;
      if (!params || Math.abs((params[1] + 2 * (params[4] ?? 0) * boundaryT) / window) > 120 || -params[2] / window < PIXEL_PARAMETERS.minimumEdgeSpeedPixelsPerSecond) continue;
      const maxAir = Math.max(...xs.map(x => x[2]));
      if (-params[2] * maxAir - params[3] * maxAir ** 2 < PIXEL_PARAMETERS.minimumAirTravelPixels || (params[1] + 2 * (params[4] ?? 0) * (boundaryT + direction * maxAir)) * direction + params[2] + 2 * params[3] * maxAir > 0) continue;
      const error = Math.sqrt(span.reduce((sum, _q, i) => sum + (ys[i] - xs[i].reduce((s, x, j) => s + x * params[j], 0)) ** 2, 0) / span.length);
      if (curved) {
        // Additional flexibility must explain an actual change, not merely
        // a smooth bend. Require at least half the residual of a no-change
        // quadratic on the identical frames. Engineering gate, not a p-value.
        const noChangeX = xs.map(x => [1, x[1], x[1] ** 2]), noChange = solve(noChangeX, ys);
        const noChangeError = noChange ? Math.sqrt(ys.reduce((s, y, i) => s + (y - noChangeX[i].reduce((v, x, j) => v + x * noChange[j], 0)) ** 2, 0) / ys.length) : 0;
        if (error > noChangeError * .5) continue;
      }
      candidates.push({ time: r.pts, error });
    }
    if (!candidates.length) return fail('NO_MOTION_CHANGE');
    const best = candidates.reduce((a, b) => a.error < b.error ? a : b);
    if (Math.abs(best.time - seed) > PIXEL_PARAMETERS.searchSeconds - .006) return { ...base, error: best.error, range: [best.time, best.time], reason: 'SEARCH_EDGE' };
    if (best.error > PIXEL_PARAMETERS.maximumFitErrorPixels) return { ...base, error: best.error, range: [best.time, best.time], reason: 'SOLE_MOTION_MISMATCH' };
    estimates.push(best.time); errors.push(best.error);
  }
  const range: [number, number] = [Math.min(...estimates), Math.max(...estimates)];
  if (range[1] - range[0] > PIXEL_PARAMETERS.maximumSensitivitySeconds + 1e-9) return { ...base, range, reason: 'THRESHOLD_OR_WINDOW_DISAGREEMENT' };
  // All nine conditions already passed the same unchanged quality gates.
  // Use their median source-frame timestamp instead of privileging the
  // shortest window's middle threshold. Averaging would invent a non-frame
  // timestamp. This reduces dependence on one threshold/window, not image
  // uncertainty or the need for external validation.
  return { ...base, pts: median(estimates), range, error: Math.max(...errors), conditionPts: estimates };
}
