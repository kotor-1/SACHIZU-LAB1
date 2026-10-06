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
/** How far (px at 4K) to either side of a point set on a line its white line is looked for. */
const SEED_REACH = 200;
/** The whole line through the point set where the start line crosses it. The tracer never crosses the start line there:
 * the lane line is picked up a little beyond the start line (above) and a little nearer the camera (below; the blocks
 * stand there, so it is looked for further down if need be), followed away and toward the camera from those, and joined
 * straight across the start line between them (about 100 px). */
export function laneLine(L: Luma, point: P2): P2[] | null {
  const s = scaleOf(L), top = .35 * L.height;
  // White streaks (at least 6 px wide: specks are not lines) on rows 30-150 px above and 30-110 px below the point, up to
  // SEED_REACH px to either side (a point set by a finger on a phone is often 100 px off at 4K) and further on rows further
  // from the point: a lane line at the side of the picture runs up it at up to 1.5 px across per px up.
  const found: { p: P2; w: number; above: boolean }[] = [];
  for (const dy of [-150, -140, -130, -120, -110, -100, -90, -80, -70, -60, -50, -40, -30, 30, 40, 50, 60, 70, 80, 90, 100, 110]) {
    const reach = (SEED_REACH + 1.5 * Math.abs(dy)) * s;
    for (const q of ridges(L, [point[0], point[1] + dy * s], [1, 0], Math.round(reach * 1.3), 15))
      if (Math.abs(q.c) <= reach && q.w >= 6 * s && q.w < 160 * s) found.push({ p: [point[0] + q.c, point[1] + dy * s], w: q.w, above: dy < 0 });
  }
  // The lane line is the straight line through the most streaks, drawn through two streaks beyond the start line (above:
  // nothing stands on the track there; nearer the camera the blocks, their shadows and marks clutter it), not near-flat,
  // nearest the point among equals. Streaks on its other side (below) that fall on it count too. A streak counts by its
  // width up to 25 px (a lane line is 25-45 px wide near the camera at 4K; specks and marks are thinner and scattered), and
  // one line has one width: streaks much wider or thinner than those beyond the start line are something else.
  let best: { score: number; slope: number; on: typeof found } | null = null;
  const above = found.filter(q => q.above);
  for (const a of above) for (const b of above) {
    if (b.p[1] - a.p[1] < 15 * s) continue;
    const slope = (a.p[0] - b.p[0]) / (a.p[1] - b.p[1]); if (Math.abs(slope) > 3) continue;
    const xAt = (y: number) => b.p[0] + (y - b.p[1]) * slope, near = found.filter(q => Math.abs(q.p[0] - xAt(q.p[1])) <= 6 * s);
    const width = median(near.filter(q => q.above).map(q => q.w)), on = near.filter(q => q.w <= 2.2 * width && q.w >= .4 * width);
    if (on.filter(q => q.above).length < 2) continue;
    const score = on.reduce((t, q) => t + Math.min(1, q.w / (25 * s)), 0) - Math.abs(xAt(point[1]) - point[0]) / (100 * s);
    if (!best || score > best.score) best = { score, slope, on };
  }
  if (best) {
    // The line through its streaks (least squares, x by y), followed on from the furthest streak and back from the nearest
    // (or from a point on the line below the start line when no streak was seen there), joined straight between.
    const on = best.on, my = on.reduce((t, q) => t + q.p[1], 0) / on.length, mx = on.reduce((t, q) => t + q.p[0], 0) / on.length;
    const sy = on.reduce((t, q) => t + (q.p[1] - my) ** 2, 0), slope = sy > 0 ? on.reduce((t, q) => t + (q.p[1] - my) * (q.p[0] - mx), 0) / sy : best.slope;
    const xAt = (y: number) => mx + (y - my) * slope, l = Math.hypot(1, slope), dir: P2 = [-slope / l, -1 / l];   // up the picture
    const first = on.reduce((m, q) => q.p[1] < m.p[1] ? q : m), lowest = on.reduce((m, q) => q.p[1] > m.p[1] ? q : m);
    const lastY = lowest.above ? point[1] + 60 * s : lowest.p[1], last: P2 = [xAt(lastY), lastY], start: P2 = [xAt(first.p[1]), first.p[1]];
    const up = traceUp(L, start, dir, top, first.w * Math.abs(dir[1]));
    const down = untilAstray(untilTurn(traceLine(L, last, [-dir[0], -dir[1]], top, first.w * Math.abs(dir[1]))), true, [-dir[0], -dir[1]], L);
    const span = Math.hypot(start[0] - last[0], start[1] - last[1]), bridge: P2[] = [];
    for (let t = 6 * s; t < span; t += 6 * s) bridge.push([last[0] + dir[0] * t, last[1] + dir[1] * t]);
    const pts = [...down.slice(1).reverse(), last, ...bridge, ...up];
    if (up.length >= 10 && pts.length > 20) return pts;
  }
  // Only one side seen: follow the nearest streak that can be followed from there.
  for (const seed of found.sort((a, b) => Math.abs(a.p[0] - point[0]) - Math.abs(b.p[0] - point[0])).slice(0, 6)) {
    const dir = heading(L, seed.p); if (!dir) continue;
    const width = seed.w * Math.abs(dir[1]);
    const up = dir[1] < 0 ? traceUp(L, seed.p, dir, top, width) : untilAstray(untilTurn(traceLine(L, seed.p, dir, top, width)), true, dir, L);
    const down = untilAstray(untilTurn(traceLine(L, seed.p, [-dir[0], -dir[1]], top, width)), dir[1] < 0, [-dir[0], -dir[1]], L);
    const pts = [...down.slice(1).reverse(), ...up];
    if (pts.length > 20) return pts;
  }
  return null;
}
/** x of a traced line at picture row y (where it first crosses it); null if it does not. */
export function xAtRow(line: P2[], y: number) {
  for (let i = 0; i + 1 < line.length; i++) { const [x0, y0] = line[i], [x1, y1] = line[i + 1]; if ((y - y0) * (y - y1) <= 0 && y0 !== y1) return x0 + (x1 - x0) * (y - y0) / (y1 - y0); }
  return null;
}
/** The start line between the lane's lines near `row`: the straight, nearly level line through the bright ridges of the
 * most columns across the lane, the nearest to the row among equals (the points may be set 80 px above or below it, where
 * the lane's own lines also cross a column's cut: ridges on them are left out); then points off one straight line (the
 * blocks' metal) are dropped. */
export function startLine(L: Luma, inner: P2[], outer: P2[], row: number): P2[] {
  const s = scaleOf(L), xi = xAtRow(inner, row), xo = xAtRow(outer, row); if (xi === null || xo === null) return [];
  const win = Math.round(200 * s), off = (line: P2[], q: P2) => { const x = xAtRow(line, q[1]); return x === null ? Infinity : Math.abs(x - q[0]); };
  const cols: P2[][] = [];
  for (let x = Math.round(Math.min(xi, xo) + 25 * s); x < Math.max(xi, xo) - 25 * s; x += Math.max(2, Math.round(8 * s)))
    cols.push(ridges(L, [x, row], [0, 1], win, 15).filter(q => q.w < 40 * s && q.w >= 2).map(q => [x, row + q.c] as P2)
      .filter(q => off(inner, q) > 30 * s && off(outer, q) > 30 * s));
  // Candidate lines through a ridge in the left third and one in the right third.
  const third = Math.floor(cols.length / 3);
  let best: { score: number; a: number; b: number } | null = null;
  for (const p of cols.slice(0, third).flat()) for (const q of cols.slice(cols.length - third).flat()) {
    const b = (q[1] - p[1]) / (q[0] - p[0]); if (Math.abs(b) > .3) continue;
    const a = p[1] - b * p[0], on = cols.filter(c => c.some(r => Math.abs(r[1] - (a + b * r[0])) <= 6 * s)).length;
    const score = on - Math.abs(a + b * (xi + xo) / 2 - row) / (100 * s);
    if (!best || score > best.score) best = { score, a, b };
  }
  const pts: P2[] = [];
  for (const c of cols) {
    const r = best ? c.filter(q => Math.abs(q[1] - (best.a + best.b * q[0])) <= 6 * s).sort((u, v) => Math.abs(u[1] - (best.a + best.b * u[0])) - Math.abs(v[1] - (best.a + best.b * v[0])))[0]
      : c.sort((u, v) => Math.abs(u[1] - row) - Math.abs(v[1] - row))[0];
    if (r) pts.push(r);
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
/** A lane line runs one way up (or down) the picture: a trace that turns back (12 px at 4K beyond its furthest point) has
 * left the line (near the camera a trace lost on a wide line came back up the next lane: the iPhone's picture of SD3),
 * so it ends at its furthest point. `down`: the trace runs down the picture, towards the camera, where the lines are
 * nearly straight (the bend is beyond the start line), so it also ends where it has turned 30° from `along`. */
function untilAstray(pts: P2[], down: boolean, along: P2, L: Luma) {
  const back = 12 * scaleOf(L);
  let far = 0;
  for (let i = 1; i < pts.length; i++) {
    const y = pts[i][1], best = pts[far][1];
    if (down ? y > best : y < best) far = i;
    else if (down ? y < best - back : y > best + back) return pts.slice(0, far + 1);
    if (down && i >= 5) {
      const dx = pts[i][0] - pts[i - 5][0], dy = pts[i][1] - pts[i - 5][1], l = Math.hypot(dx, dy);
      if (l > 0 && (dx * along[0] + dy * along[1]) / l < Math.cos(30 * Math.PI / 180)) return pts.slice(0, i - 4);
    }
  }
  return pts;
}
/** A line followed up the picture past where its trace stopped: at a crossing mark, a junction with another line, a worn
 * patch or where the bend turns sharply in the picture the trace can lose it (SD2: a stagger mark touches the inner line
 * where it turns from rising right to rising left; the lane's outer line meets the track's edge line; the trace stopped
 * there or not by a fraction of a pixel of the point). Looked for again 20-60 px (4K) on from its end, straight on or
 * turned up to 60° the way the line was turning, a line as wide as it was, and followed on from there (up to RESUME times). */
const RESUME = 3;
function traceUp(L: Luma, seed: P2, dir: P2, top: number, width: number): P2[] {
  const s = scaleOf(L);
  let pts = untilAstray(untilTurn(traceLine(L, seed, dir, top, width)), false, dir, L);
  for (let n = 0; n < RESUME && pts.length >= 21; n++) {
    const end = pts.at(-1)!, mid = pts[pts.length - 11], old = pts[pts.length - 21];
    const d0 = Math.atan2(mid[1] - old[1], mid[0] - old[0]), d1 = Math.atan2(end[1] - mid[1], end[0] - mid[0]);
    if (end[1] < top + 20 * s) break;
    let turn = d1 - d0; if (turn > Math.PI) turn -= 2 * Math.PI; if (turn < -Math.PI) turn += 2 * Math.PI;
    // The line's width a little before the end (at the end a mark or a junction may widen it).
    const widths = [6, 10, 14].map(k => ridges(L, pts[pts.length - 1 - k], [-Math.sin(d1), Math.cos(d1)], Math.round(40 * s), 15).sort((a, b) => Math.abs(a.c) - Math.abs(b.c))[0]?.w).filter((v): v is number => v !== undefined);
    const sign = turn < 0 ? -1 : 1, w = widths.length ? median(widths) : width;
    let found: { p: P2; d: P2 } | null = null;
    for (const deg of [0, 20, 40, 60]) {
      const a = d1 + sign * deg * Math.PI / 180, d: P2 = [Math.cos(a), Math.sin(a)], nrm: P2 = [-d[1], d[0]];
      for (const g of [20, 40, 60]) {
        const q: P2 = [end[0] + d[0] * g * s, end[1] + d[1] * g * s];
        const r = ridges(L, q, nrm, Math.round(40 * s), 15).filter(x => Math.abs(x.c) <= (8 + .2 * g) * s && x.w <= 1.6 * w + 4 * s && x.w >= .5 * w).sort((x, y) => Math.abs(x.c) - Math.abs(y.c))[0];
        if (r) { found = { p: [q[0] + nrm[0] * r.c, q[1] + nrm[1] * r.c], d }; break; }
      }
      if (found) break;
    }
    if (!found || found.d[1] > .2) break;   // a lane line does not turn back down the picture
    const more = untilAstray(untilTurn(traceLine(L, found.p, found.d, top, w)), false, found.d, L);
    if (more.length < 8) break;
    const gap = Math.hypot(found.p[0] - end[0], found.p[1] - end[1]), bridge: P2[] = [];
    for (let t = 6 * s; t < gap; t += 6 * s) bridge.push([end[0] + (found.p[0] - end[0]) * t / gap, end[1] + (found.p[1] - end[1]) * t / gap]);
    pts = [...pts, ...bridge, ...more];
  }
  return pts;
}
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
