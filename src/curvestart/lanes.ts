/** The lane lines and the start line in one frame of the curve start video (a frame
 * with the track clear, the last one: the athlete has run away). Lines are traced from
 * the two points the user sets on the athlete's lane's inner and outer lines, along the
 * bright ridge of the white line (luminance above the median across it), step by step
 * (docs/CurveStart_Feasibility_20261006.md §2.2). Pixel sizes are for 4K and scale with
 * the picture. */
import type { P2 } from './camera';

export interface Luma { data: Uint8Array; width: number; height: number }
export function luminance(rgba: Uint8ClampedArray, width: number, height: number): Luma {
  const data = new Uint8Array(width * height);
  for (let i = 0, j = 0; i < data.length; i++, j += 4) data[i] = (.3 * rgba[j] + .59 * rgba[j + 1] + .11 * rgba[j + 2]) | 0;
  return { data, width, height };
}
const scaleOf = (L: Luma) => Math.max(L.width, L.height) / 3840;
const at = (L: Luma, x: number, y: number) => { const xi = Math.round(x), yi = Math.round(y); return xi >= 0 && yi >= 0 && xi < L.width && yi < L.height ? L.data[yi * L.width + xi] : NaN; };
const median = (v: number[]) => { const s = v.filter(Number.isFinite).sort((a, b) => a - b); return s.length ? s[s.length >> 1] : NaN; };

/** Bright runs along a cut (centre offsets from its middle, widths), brighter than the cut's median by `contrast`. */
function ridges(L: Luma, centre: P2, n: P2, span: number, contrast: number) {
  const cut: number[] = []; for (let s = -span; s <= span; s++) cut.push(at(L, centre[0] + n[0] * s, centre[1] + n[1] * s));
  const bg = median(cut), out: { c: number; w: number }[] = [];
  for (let i = 0; i < cut.length; i++) {
    if (!(cut[i] - bg > contrast)) continue;
    let j = i; while (j + 1 < cut.length && cut[j + 1] - bg > contrast) j++;
    out.push({ c: (i + j) / 2 - span, w: j - i + 1 }); i = j;
  }
  return out;
}
/** The white line nearest a point along its row (within `reach` px sideways): its middle and width; null if none. */
function ridgeAt(L: Luma, p: P2, reach = 60): { p: P2; w: number } | null {
  const s = scaleOf(L), r = ridges(L, p, [1, 0], Math.round(reach * s * 1.5), 18).filter(q => Math.abs(q.c) <= reach * s && q.w < 160 * s)
    .sort((a, b) => Math.abs(a.c) - Math.abs(b.c))[0];
  return r ? { p: [p[0] + r.c, p[1]], w: r.w } : null;
}
/** The point moved across a line to the middle of the white line nearest it (within `reach` px sideways); null if none. */
export function snapToLine(L: Luma, p: P2, reach = 60): P2 | null { return ridgeAt(L, p, reach)?.p ?? null; }
/** Which way the line through p runs up the picture: from the same line 40-80 px further on (above) or, failing that,
 * nearer the camera (below; the blocks stand there, behind the start line). */
function heading(L: Luma, p: P2): P2 | null {
  const s = scaleOf(L);
  for (const dy of [-40, -80, 40, 80]) {
    const q = snapToLine(L, [p[0], p[1] + dy * s], 120); if (!q) continue;
    const d: P2 = dy > 0 ? [p[0] - q[0], p[1] - q[1]] : [q[0] - p[0], q[1] - p[1]], l = Math.hypot(d[0], d[1]); return [d[0] / l, d[1] / l];
  }
  return null;
}
/** Follows a white line from `seed` heading `dir`: each step the brightest ridge across it nearest the prediction. A
 * ridge much wider than the line so far is something crossing it (the start line, a block): it goes straight through. */
export function traceLine(L: Luma, seed: P2, dir: P2, top: number, startWidth = 0) {
  const s = scaleOf(L), step = 6 * s, reach = 10 * s, span = Math.round(60 * s), pts: P2[] = [[seed[0], seed[1]]];
  let t = dir, p = seed, misses = 0, width = startWidth;
  for (let k = 0; k < 3000; k++) {
    const q: P2 = [p[0] + t[0] * step, p[1] + t[1] * step], n: P2 = [-t[1], t[0]];
    if (q[0] < 0 || q[0] >= L.width || q[1] < top || q[1] >= L.height) break;
    const r = reach + 3 * s * misses;
    const near = ridges(L, q, n, span, 15).filter(x => Math.abs(x.c) <= r).sort((a, b) => Math.abs(a.c) - Math.abs(b.c))[0];
    if (!near || (width > 0 && near.w > 2.5 * width + 4 * s)) { if (++misses > 12) break; p = q; continue; }
    width = width ? .8 * width + .2 * near.w : near.w; misses = 0;
    p = [q[0] + n[0] * near.c, q[1] + n[1] * near.c]; pts.push(p);
    const back = pts[Math.max(0, pts.length - 8)], dx = p[0] - back[0], dy = p[1] - back[1], len = Math.hypot(dx, dy);
    if (len > step * 2) t = [dx / len, dy / len];
  }
  return pts;
}
/** A trace stops where it turns sharply (more than 0.9 rad between two chords of 5 steps: it jumped to something else). */
function untilTurn(pts: P2[]) {
  const out: P2[] = [];
  for (let i = 0; i < pts.length; i++) {
    if (i >= 10) {
      const a = pts[i - 10], b = pts[i - 5], c = pts[i];
      let d = Math.abs(Math.atan2(c[1] - b[1], c[0] - b[0]) - Math.atan2(b[1] - a[1], b[0] - a[0])); if (d > Math.PI) d = 2 * Math.PI - d;
      if (d > .9) break;
    }
    out.push(pts[i]);
  }
  return out;
}
/** The whole line through the point set where the start line crosses it. The tracer never crosses the start line there:
 * the lane line is picked up a little beyond the start line (above) and a little nearer the camera (below; the blocks
 * stand there, so it is looked for further down if need be), followed away and toward the camera from those, and joined
 * straight across the start line between them (about 100 px). */
export function laneLine(L: Luma, point: P2): P2[] | null {
  const s = scaleOf(L), top = .35 * L.height;
  const find = (offsets: number[]) => { for (const dy of offsets) { const r = ridgeAt(L, [point[0], point[1] + dy * s]); if (r) return r; } return null; };
  const above = find([-40, -60, -80]), below = find([40, 60, 80, 100]);
  if (above && below) {
    const d: P2 = [above.p[0] - below.p[0], above.p[1] - below.p[1]], l = Math.hypot(d[0], d[1]), dir: P2 = [d[0] / l, d[1] / l];
    const up = untilTurn(traceLine(L, above.p, dir, top, above.w * Math.abs(dir[1]))), down = untilTurn(traceLine(L, below.p, [-dir[0], -dir[1]], top, below.w * Math.abs(dir[1])));
    const bridge: P2[] = []; for (let t = 6 * s; t < l; t += 6 * s) bridge.push([below.p[0] + dir[0] * t, below.p[1] + dir[1] * t]);
    const pts = [...down.slice(1).reverse(), below.p, ...bridge, ...up];
    return pts.length > 20 ? pts : null;
  }
  const seed = above ?? below; if (!seed) return null;
  const dir = heading(L, seed.p); if (!dir) return null;
  const width = seed.w * Math.abs(dir[1]);
  const up = untilTurn(traceLine(L, seed.p, dir, top, width)), down = untilTurn(traceLine(L, seed.p, [-dir[0], -dir[1]], top, width));
  const pts = [...down.slice(1).reverse(), ...up];
  return pts.length > 20 ? pts : null;
}
/** x of a traced line at picture row y (where it first crosses it); null if it does not. */
export function xAtRow(line: P2[], y: number) {
  for (let i = 0; i + 1 < line.length; i++) { const [x0, y0] = line[i], [x1, y1] = line[i + 1]; if ((y - y0) * (y - y1) <= 0 && y0 !== y1) return x0 + (x1 - x0) * (y - y0) / (y1 - y0); }
  return null;
}
/** The start line between the lane's lines near `row`: in columns across the lane, the bright horizontal ridge nearest
 * the row; points that do not lie on one straight line (the blocks' metal) are dropped. */
export function startLine(L: Luma, inner: P2[], outer: P2[], row: number): P2[] {
  const s = scaleOf(L), xi = xAtRow(inner, row), xo = xAtRow(outer, row); if (xi === null || xo === null) return [];
  const pts: P2[] = [], win = Math.round(160 * s);
  for (let x = Math.round(Math.min(xi, xo) + 25 * s); x < Math.max(xi, xo) - 25 * s; x += Math.max(2, Math.round(8 * s))) {
    const r = ridges(L, [x, row], [0, 1], win, 25).filter(q => q.w < 40 * s).sort((a, b) => Math.abs(a.c) - Math.abs(b.c))[0];
    if (r) pts.push([x, row + r.c]);
  }
  let keep = pts;
  for (let it = 0; it < 3 && keep.length > 4; it++) {
    const n = keep.length, mx = keep.reduce((a, p) => a + p[0], 0) / n, my = keep.reduce((a, p) => a + p[1], 0) / n;
    const b = keep.reduce((a, p) => a + (p[0] - mx) * (p[1] - my), 0) / Math.max(1e-9, keep.reduce((a, p) => a + (p[0] - mx) ** 2, 0));
    const off = keep.map(p => Math.abs(p[1] - (my + b * (p[0] - mx)))), m = median(off);
    keep = keep.filter((_, i) => off[i] < Math.max(6 * s, 2.5 * m));
  }
  return keep.length >= 5 ? keep : [];
}
/** The athlete's lane from the two points the user set (picture pixels) where the start line meets its inner and outer
 * lines: both lines traced, and the start line between them at the points' height. */
/** Far away the lane's lines crowd together and a trace can step onto the next line: the lines are kept only while the
 * lane is at least FAR_LANE px wide in the picture (at 4K; about 25 m from the camera with the 1x lens). */
const FAR_LANE = 140;
/** For measuring footprints across the lane the lines are followed further, to a lane this many px wide (far beyond 20 m):
 * a cut across the lane must still be 0.9-1.8 m on the ground and pass through the footprint, which a stray trace fails. */
const RULER_LANE = 40;
function whileWide(line: P2[], other: P2[], minPx: number) {
  const near = (q: P2) => other.reduce((m, o) => Math.min(m, Math.hypot(o[0] - q[0], o[1] - q[1])), Infinity);
  // The trace runs from the camera's end up the picture: cut it at the first point (from its middle on) where the lane is narrow.
  const mid = line.reduce((best, q, i) => q[1] > line[best][1] ? i : best, 0);
  let end = line.length;
  for (let i = mid; i < line.length; i++) if (near(line[i]) < minPx) { end = i; break; }
  return line.slice(0, end);
}
export function traceLanes(L: Luma, innerPoint: P2, outerPoint: P2) {
  const rawInner = laneLine(L, innerPoint) ?? [], rawOuter = laneLine(L, outerPoint) ?? [], minPx = FAR_LANE * scaleOf(L);
  const cut = (a: P2[], b: P2[], px: number) => b.length ? whileWide(a, b, px) : a, rulerPx = RULER_LANE * scaleOf(L);
  // For the camera, each line also stops where the other was not traced (a line followed on alone may have strayed).
  const upTo = (line: P2[], other: P2[]) => { if (!other.length) return line; const top = Math.min(...other.map(q => q[1])) - 40 * scaleOf(L); return line.filter(q => q[1] >= top); };
  const nearInner = cut(rawInner, rawOuter, minPx), nearOuter = cut(rawOuter, rawInner, minPx);
  const near = { inner: upTo(nearInner, nearOuter), outer: upTo(nearOuter, nearInner) };
  const inner = cut(rawInner, rawOuter, rulerPx), outer = cut(rawOuter, rawInner, rulerPx);
  const start = near.inner.length && near.outer.length ? startLine(L, near.inner, near.outer, (innerPoint[1] + outerPoint[1]) / 2) : [];
  return { inner, outer, start, near };
}
