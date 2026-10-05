/** The implement's flight just after the release, from the picture: what
 * differs from the background (per pixel the median of frames well before and
 * after the release, and how much the pixel moves anyway), the athlete's body
 * and hands masked out with the skeleton; then the flight — release point,
 * speed and angle, falling with gravity — that covers the most of it over the
 * next frames (dev-validation/throw/implement2.mjs, 7 videos).
 *
 * Following the implement frame by frame went astray in front of trees in the
 * wind (two daylight videos: 150-260 moving bits of leaves a frame); the whole
 * flight searched at once did not. A javelin is followed by its tail end (it
 * moves along its length, so a window sliding along its body is covered as
 * well as one moving with it: two of four javelins came 15% slow). Angles
 * need no scale; the speed needs one (the athlete's height). Pure functions;
 * the frames are read in `recording.ts`. */

/** The background: per pixel the median (RGB) of frames without the implement,
 * and how much the pixel moves anyway (the median absolute difference from it,
 * largest channel), so leaves in the wind need a larger difference than a wall or sky. */
export interface Background { median: Uint8Array; spread: Uint8Array }
/** One frame's pixels taken (1) over the analysed region: the source picture from `origin`, scaled by `k`. */
export interface MaskFrame { frame: number; pts: number; on: Uint8Array; w: number; h: number; origin: { x: number; y: number }; k: number }
export interface FlightPath {
  /** The flight's place at the release time t0 (source pixels): a shot's centre, a javelin's tail. */
  x0: number; y0: number; t0: number;
  /** Velocity at the release (source px/s, y down), its size and its angle above horizontal toward the throw. */
  vx: number; vy: number; speedPx: number; angle: number;
  /** Frames where the window was mostly covered, and the summed coverage. */
  frames: number; score: number;
}

/** A pixel is the implement's when it differs from the median by THRESHOLD and by SPREAD_FACTOR times its own spread. */
const SPREAD_FACTOR = 5;
export const THRESHOLD = 30;
/** Implements fly at 3-35 m/s, leaving the hand -10 to 70 degrees above horizontal. */
const SPEED_RANGE = [3, 35] as const, ANGLE_RANGE = [-10, 70] as const;
/** The window (half-size, m) counted around the predicted place; the frames used, from two frames (at 120 fps)
 * before the release found from the hand: it is often a frame or two late, and starting after it left a junior's
 * implement 3 frames in view (no flight) — before the release the implement is in the masked hand and counts
 * little (from -0.015 s all 7 videos' flights were found in Chrome and WebKit, speeds within 5%, recorded).
 * A frame counts as covered at FILLED of its window, and a flight needs MIN_FRAMES covered frames. */
const WINDOW = .05, SEARCH_FRAMES = 10, AFTER_RELEASE = -.015, FILLED = .3, MIN_FRAMES = 4, G = 9.81;
/** Where the flight may be at the release time, ahead of / above the throwing wrist (m): a javelin's tail is
 * 0.2-0.35 m behind the hand, and a release time two frames early puts it further back (0.15 m failed); a shot is
 * in the hand, and with the javelin's range one video's flight was found in the corner of it, 0.6 m behind and
 * above the hand, through the edge of the moving arm (recorded). */
const START = { jav: [[-.6, .6], [-.3, .6]], shot: [[-.25, .4], [-.2, .45]] } as const;
/** A javelin's long axis counts when its blob is ATTITUDE_RATIO times longer than wide. */
const ATTITUDE_RATIO = 3;

/** The background of the given frames (RGBA or RGB, `channels` per pixel). */
export function medianBackground(frames: (Uint8ClampedArray | Uint8Array)[], n: number, channels = 4): Background {
  const median = new Uint8Array(n * 3), spread = new Uint8Array(n), v = new Array<number>(frames.length);
  for (let p = 0; p < n; p++) for (let c = 0; c < 3; c++) {
    for (let i = 0; i < frames.length; i++) v[i] = frames[i][p * channels + c];
    v.sort((a, b) => a - b); const m = v[v.length >> 1]; median[p * 3 + c] = m;
    for (let i = 0; i < v.length; i++) v[i] = Math.abs(v[i] - m);
    v.sort((a, b) => a - b); spread[p] = Math.max(spread[p], v[v.length >> 1]);
  }
  return { median, spread };
}

/** Pixels differing from the background (largest channel difference), not masked. */
export function differenceMask(image: Uint8ClampedArray | Uint8Array, background: Background, mask: Uint8Array, n: number, threshold = THRESHOLD, channels = 4): Uint8Array {
  const on = new Uint8Array(n), bg = background.median;
  for (let p = 0; p < n; p++) {
    if (mask[p]) continue;
    let d = 0;
    for (let c = 0; c < 3; c++) d = Math.max(d, Math.abs(image[p * channels + c] - bg[p * 3 + c]));
    if (d >= threshold && d >= SPREAD_FACTOR * background.spread[p]) on[p] = 1;
  }
  return on;
}

/** The athlete's body and both hands as a mask over a region (1 = masked), from the skeleton in the region's
 * own normalized coordinates (`pose[k].x * w` is a region pixel): limbs and trunk 0.09 m wide, the head 0.14 m,
 * each palm a circle of 0.11 m past the wrist. `scale`: region pixels per metre. */
export function bodyMask(pose: { x: number; y: number }[] | null, w: number, h: number, scale: number): Uint8Array {
  const m = new Uint8Array(w * h);
  if (!pose) return m;
  const P = (k: number) => ({ x: pose[k].x * w, y: pose[k].y * h });
  const paint = (cx: number, cy: number, rad: number) => {
    for (let y = Math.max(0, Math.floor(cy - rad)); y <= Math.min(h - 1, Math.ceil(cy + rad)); y++)
      for (let x = Math.max(0, Math.floor(cx - rad)); x <= Math.min(w - 1, Math.ceil(cx + rad)); x++)
        if ((x - cx) ** 2 + (y - cy) ** 2 <= rad * rad) m[y * w + x] = 1;
  };
  const r = .09 * scale;
  for (const [a, b] of [[11, 12], [11, 23], [12, 24], [23, 24], [11, 13], [13, 15], [12, 14], [14, 16], [23, 25], [25, 27], [24, 26], [26, 28], [0, 11], [0, 12]]) {
    const p = P(a), q = P(b), steps = Math.max(1, Math.ceil(Math.hypot(q.x - p.x, q.y - p.y) / (r / 2)));
    for (let i = 0; i <= steps; i++) paint(p.x + (q.x - p.x) * i / steps, p.y + (q.y - p.y) * i / steps, r);
  }
  const head = P(0); paint(head.x, head.y, .14 * scale);
  for (const [wr, el] of [[15, 13], [16, 14]]) {
    const a = P(wr), b = P(el), l = Math.hypot(a.x - b.x, a.y - b.y) || 1;
    paint(a.x + (a.x - b.x) / l * .07 * scale, a.y + (a.y - b.y) / l * .07 * scale, .11 * scale);
  }
  return m;
}

/** The frames searched: from AFTER_RELEASE s after the release, in time order. */
const searched = (frames: MaskFrame[], t0: number) => frames.filter(f => f.pts - t0 >= AFTER_RELEASE).sort((a, b) => a.pts - b.pts).slice(0, SEARCH_FRAMES);

/** The flight from the frames after the release. `hand`: the throwing wrist at the release (source pixels);
 * `scale`: source pixels per metre at the athlete (for the search's ranges and gravity); `direction`: +1 to the right. */
export function searchFlight(frames: MaskFrame[], hand: { x: number; y: number }, t0: number, direction: number, scale: number, kind: 'jav' | 'shot'): FlightPath | null {
  const use = searched(frames, t0);
  if (use.length < MIN_FRAMES || !(scale > 0)) return null;
  // Summed-area tables, to count a window's pixels at once.
  const sums = use.map(f => { const s = new Float64Array((f.w + 1) * (f.h + 1)), W1 = f.w + 1;
    for (let y = 0; y < f.h; y++) { let row = 0; for (let x = 0; x < f.w; x++) { row += f.on[y * f.w + x]; s[(y + 1) * W1 + x + 1] = s[y * W1 + x + 1] + row; } }
    return s; });
  /** The share of the window around a source point that is taken; -1 outside the region. */
  const share = (i: number, X: number, Y: number) => {
    const f = use[i], cx = (X - f.origin.x) * f.k, cy = (Y - f.origin.y) * f.k, r = Math.max(1, WINDOW * scale * f.k);
    const x0 = Math.max(0, Math.round(cx - r)), x1 = Math.min(f.w, Math.round(cx + r)), y0 = Math.max(0, Math.round(cy - r)), y1 = Math.min(f.h, Math.round(cy + r));
    if (x1 <= x0 || y1 <= y0) return -1;
    const W1 = f.w + 1, s = sums[i];
    return (s[y1 * W1 + x1] - s[y0 * W1 + x1] - s[y1 * W1 + x0] + s[y0 * W1 + x0]) / ((x1 - x0) * (y1 - y0));
  };
  const back = 2 * WINDOW * scale;
  const score = (px: number, py: number, speed: number, deg: number) => {
    const c = Math.cos(deg * Math.PI / 180), si = Math.sin(deg * Math.PI / 180);
    const vx = direction * speed * c * scale, vy = -speed * si * scale, bx = -direction * c * back, by = si * back;
    let total = 0, filled = 0;
    for (let i = 0; i < use.length; i++) {
      // From the release point: straight across, falling with gravity (speed and angle are at the release).
      const t = use[i].pts - t0, X = px + vx * t, Y = py + vy * t + .5 * G * scale * t * t, here = share(i, X, Y);
      if (here < 0) break;
      // A javelin's tail: what is just behind it on its way counts against it.
      const v = kind === 'jav' ? Math.max(0, here - Math.max(0, share(i, X + bx, Y + by))) : here;
      total += v; if (v >= FILLED) filled++;
    }
    return { total, filled, vx, vy };
  };
  type Best = { px: number; py: number; speed: number; deg: number; total: number; filled: number; vx: number; vy: number };
  let best: Best | null = null;
  const consider = (px: number, py: number, speed: number, deg: number) => {
    const s = score(px, py, speed, deg);
    if (!best || s.total > best.total) best = { px, py, speed, deg, ...s };
  };
  // Coarse: the place at the release time near the hand, every 0.05 m (see START); every 0.5 m/s and 2 degrees.
  // Then finer around the best.
  // Only inside the range: a flight held against its edge is something else (a shot's search went to the edge of
  // the arm, 0.3 m behind and 0.45 m above the hand, and the shot itself was lost, recorded).
  const [[ax0, ax1], [ay0, ay1]] = START[kind], inside = (ax: number, ay: number) => ax > ax0 && ax < ax1 && ay > ay0 && ay < ay1;
  for (let ax = ax0 + .05; ax < ax1 - 1e-9; ax += .05) for (let ay = ay0 + .05; ay < ay1 - 1e-9; ay += .05)
    for (let speed = SPEED_RANGE[0]; speed <= SPEED_RANGE[1]; speed += .5) for (let deg = ANGLE_RANGE[0] + 2; deg < ANGLE_RANGE[1]; deg += 2)
      consider(hand.x + direction * ax * scale, hand.y - ay * scale, speed, deg);
  for (const [dp, ds, dd] of [[.02, .2, .5], [.005, .05, .1]]) {
    const b = best as Best | null; if (!b) break;
    const bx = (b.px - hand.x) * direction / scale, by = (hand.y - b.py) / scale;
    for (let i = -3; i <= 3; i++) for (let j = -3; j <= 3; j++) for (let s = -3; s <= 3; s++) for (let d = -3; d <= 3; d++)
      if (inside(bx + i * dp, by + j * dp) && b.deg + d * dd > ANGLE_RANGE[0] && b.deg + d * dd < ANGLE_RANGE[1])
        consider(b.px + i * dp * direction * scale, b.py - j * dp * scale, b.speed + s * ds, b.deg + d * dd);
  }
  const b = best as Best | null;
  if (!b || b.filled < MIN_FRAMES) return null;
  // Still held against the edge of what was searched: something else than the implement (see START), none.
  const ax = (b.px - hand.x) * direction / scale, ay = (hand.y - b.py) / scale, edge = .02;
  if (ax < ax0 + edge || ax > ax1 - edge || ay < ay0 + edge || ay > ay1 - edge || b.deg <= ANGLE_RANGE[0] + .5 || b.deg >= ANGLE_RANGE[1] - .5) return null;
  return { x0: b.px, y0: b.py, t0, vx: b.vx, vy: b.vy, speedPx: b.speed * scale, angle: b.deg, frames: b.filled, score: b.total };
}

/** Where the flight is at a time (source pixels). */
export function flightAt(f: FlightPath, t: number, scale: number) {
  const dt = t - f.t0;
  return { x: f.x0 + f.vx * dt, y: f.y0 + f.vy * dt + .5 * G * scale * dt * dt };
}

/** A javelin's long axis (degrees above horizontal toward the throw): in each frame of the flight the pixels
 * taken connected to its tail, within 0.9 m of it, when they are long and thin; the median over the first half
 * of the frames (it shortens as it leaves the picture). Null when never seen so. */
export function javelinAttitude(frames: MaskFrame[], f: FlightPath, scale: number, direction: number): number | null {
  const use = searched(frames, f.t0), angles: number[] = [];
  for (const q of use.slice(0, Math.max(2, Math.ceil(use.length / 2)))) {
    const tail = flightAt(f, q.pts, scale), cx = (tail.x - q.origin.x) * q.k, cy = (tail.y - q.origin.y) * q.k;
    const reach = .9 * scale * q.k, near = Math.max(2, WINDOW * scale * q.k);
    const seen = new Uint8Array(q.w * q.h), stack: number[] = [];
    for (let y = Math.max(0, Math.floor(cy - near)); y <= Math.min(q.h - 1, Math.ceil(cy + near)); y++)
      for (let x = Math.max(0, Math.floor(cx - near)); x <= Math.min(q.w - 1, Math.ceil(cx + near)); x++)
        if (q.on[y * q.w + x]) { seen[y * q.w + x] = 1; stack.push(y * q.w + x); }
    let n = 0, sx = 0, sy = 0, sxx = 0, syy = 0, sxy = 0;
    while (stack.length) {
      const p = stack.pop()!, x = p % q.w, y = (p - x) / q.w;
      n++; sx += x; sy += y; sxx += x * x; syy += y * y; sxy += x * y;
      for (const [nx, ny] of [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]]) {
        if (nx < 0 || ny < 0 || nx >= q.w || ny >= q.h) continue;
        const nb = ny * q.w + nx;
        if (seen[nb] || !q.on[nb] || Math.hypot(nx - cx, ny - cy) > reach) continue;
        seen[nb] = 1; stack.push(nb);
      }
    }
    if (n < 10) continue;
    const mx = sx / n, my = sy / n, a = sxx / n - mx * mx, c = syy / n - my * my, b = sxy / n - mx * my;
    const gap = Math.sqrt(Math.max(0, (a - c) ** 2 / 4 + b * b)), l1 = (a + c) / 2 + gap, l2 = Math.max(1e-9, (a + c) / 2 - gap);
    if (Math.sqrt(l1 / l2) < ATTITUDE_RATIO) continue;
    const th = .5 * Math.atan2(2 * b, a - c);
    let deg = Math.atan2(-Math.sin(th), Math.cos(th) * direction) * 180 / Math.PI;
    if (deg > 90) deg -= 180;
    if (deg < -90) deg += 180;
    angles.push(deg);
  }
  if (!angles.length) return null;
  const s = [...angles].sort((x, y) => x - y);
  return s[s.length >> 1];
}
