/** The judged moments of a crouch start set again from the pictures round the feet. The pose model's toe point wanders
 * 7-23 px while a foot stands still and jumps now and then (MediaPipe and RTMPose alike, 1080p, 240 fps); in a dark or
 * noisy video the touchdowns judged from it were up to 9.5 frames off (the three test videos darkened). The place of
 * each contact and of the front block (many frames together) stays good, and there the picture tells when the shoe is
 * down: the few pixels at the toe where the standing shoe differs from the bare ground show the shoe or the ground.
 *
 * For each contact: the shoe as it stands (the frames round the middle of the contact), the bare ground before the foot
 * came and after it left, the toe pixels that tell them apart (more than DIFF, or NOISE times the picture's noise), and
 * frame by frame the share of them closer to the shoe than to the ground. The touchdown is where that share passes one
 * half going back from the middle of the contact, the toe-off going on from it; again with the shoe as it stood just
 * after the touchdown and just before the toe-off (it turns over the toe as the heel rises), between frames by the line
 * through the two frames either side. A moment is taken only when the toe pixels are clear (the shoe seen in the middle,
 * the ground before and after, enough pixels, near the pose's moment); else the pose's moment stays. The front block
 * clearance likewise with the front foot on its block and the block left bare.
 *
 * Pure: the pictures are given (crouch-pixels-read.ts takes them in the browser; dev-validation from ffmpeg). */
import type { CrouchFrame, CrouchResult } from './crouch';
import { posture, stepsOf } from './crouch';
import { legLength } from './contacts';

/** A part of the picture taken in the frames from..to (pixels, the analysis' frame size). */
export interface PixelRegion { key: string; from: number; to: number; x: number; y: number; w: number; h: number }
/** The RGB pictures of each region, frame by frame (w*h*3 bytes), and each frame's time. */
export type RegionPictures = Map<string, Map<number, Uint8Array>>;
export interface PixelMoment { key: string; frame: number | null; fromPixels: boolean; share: Map<number, number> | null }
/** Pictures are taken this far (frames) before and after the pose's moments. */
const MARGIN = 32;
/** The settings (exported for the checks in dev-validation/crouch/px-eval.ts):
 * - a toe pixel tells shoe from ground when they differ by more than DIFF (sum over R, G, B) and NOISE times the
 *   picture's noise there; a moment needs MIN_PIXELS of them;
 * - the share of toe pixels like the standing shoe: in the middle of a contact at least STANDING, before and after it at
 *   most BARE; a moment found more than FAR frames from the pose's is not taken; the moment is where the share passes
 *   TD_AT (touchdown) or TO_AT (toe-off);
 * - the toe window (leg lengths): TOE_W wide, TOE_H high, centred TOE_BACK behind the toe and TOE_UP above the ground;
 *   for the toe-off TO_W, TO_H, TO_BACK, TO_UP (the tip of the shoe: the rest turns over it as the heel rises);
 * - the front foot on its block: a wider window (the forefoot); then with BC_TIP the tip of the shoe (BC_TIP_W, BC_TIP_H,
 *   centred BC_TIP_BACK behind and BC_TIP_UP above the toe) within BC_TIP_FAR frames after: the forefoot changes as the
 *   heel rises, while the toe is still on the block. Against the pictures' truth (the user's practice videos, 2026-10-07:
 *   「スタブロから離れるところがうまくいかない動画が多い」): 15 videos (the three SD videos clean, dark and 540p 120 fps,
 *   and six from Hadano in varied light) mean |error| 4.57 → 2.37 frames (240 fps), the bias −3.85 → −0.84 (early). */
export const PIXEL_SETTINGS = { DIFF: 24, NOISE: 4, MIN_PIXELS: 8, STANDING: .7, BARE: .35, FAR: 15, TD_AT: .5, TO_AT: .5,
  TOE_W: .16, TOE_H: .08, TOE_BACK: .03, TOE_UP: .02, TO_W: .08, TO_H: .04, TO_BACK: -.01, TO_UP: .005,
  BLOCK_W: .35, BLOCK_H: .18, BLOCK_BACK: .12, BLOCK_UP: .06,
  BC_TIP: 1, BC_TIP_W: .1, BC_TIP_H: .05, BC_TIP_BACK: -.01, BC_TIP_UP: .01, BC_TIP_FAR: 12 };
const S = PIXEL_SETTINGS;

/** A window of the picture by its centre and size (pixels of the analysis' frames). */
interface Spot { cx: number; cy: number; w: number; h: number }
/** Where the pictures are looked at, for each moment's place: the toe window (and the shoe's tip, for the toe-off) of each
 * contact, the forefoot on the front block; with the frames round the pose's moments. */
function placesOf(r: CrouchResult, frames: readonly CrouchFrame[], W: number, H: number) {
  const leg = legLength(frames.filter(f => f.pose), W, H), dir = r.direction || 1, last = Math.max(0, ...frames.map(f => f.frame));
  const out: { key: string; from: number; to: number; main: Spot; tip: Spot | null }[] = [];
  const span = (a: number, b: number) => ({ from: Math.max(0, a - MARGIN), to: Math.min(last, b + MARGIN) });
  const front = frontToe(r, frames, W, H);
  if (r.blockClearance && front) out.push({ key: 'bc', ...span(r.blockClearance.frame, r.blockClearance.frame),
    tip: { cx: front.x - dir * S.BC_TIP_BACK * leg, cy: front.y - S.BC_TIP_UP * leg, w: S.BC_TIP_W * leg, h: S.BC_TIP_H * leg },
    main: { cx: front.x - dir * S.BLOCK_BACK * leg, cy: front.y - S.BLOCK_UP * leg, w: S.BLOCK_W * leg, h: S.BLOCK_H * leg } });
  for (const c of r.contacts) if (c.touchdownFrame !== null) out.push({ key: `c${c.index}`, ...span(c.touchdownFrame, c.toeOffFrame ?? c.touchdownFrame),
    main: { cx: c.x - dir * S.TOE_BACK * leg, cy: c.groundY - S.TOE_UP * leg, w: S.TOE_W * leg, h: S.TOE_H * leg },
    tip: { cx: c.x - dir * S.TO_BACK * leg, cy: c.groundY - S.TO_UP * leg, w: S.TO_W * leg, h: S.TO_H * leg } });
  return out;
}
/** The parts of the picture to take (a little round the windows), with their frames. */
export function regionsOf(r: CrouchResult, frames: readonly CrouchFrame[], W: number, H: number): PixelRegion[] {
  if (r.reason) return [];
  return placesOf(r, frames, W, H).map(p => {
    const spots = [p.main, ...(p.tip ? [p.tip] : [])];
    const x0 = Math.min(...spots.map(q => Math.round(q.cx - q.w / 2))) - 1, y0 = Math.min(...spots.map(q => Math.round(q.cy - q.h / 2))) - 1;
    const x1 = Math.max(...spots.map(q => Math.round(q.cx + q.w / 2))) + 1, y1 = Math.max(...spots.map(q => Math.round(q.cy + q.h / 2))) + 1;
    const x = Math.max(0, x0), y = Math.max(0, y0);
    return { key: p.key, from: p.from, to: p.to, x, y, w: Math.max(1, Math.min(W, x1) - x), h: Math.max(1, Math.min(H, y1) - y) };
  });
}

/** The result with the moments the pictures tell (the others as judged from the pose), and for each moment whether it
 * came from the pictures and the share of toe pixels like the standing shoe frame by frame (for the check). */
export function refineByPixels(r: CrouchResult, pictures: RegionPictures, regions: readonly PixelRegion[], frames: readonly CrouchFrame[],
  W: number, H: number): { result: CrouchResult; moments: PixelMoment[] } {
  if (r.reason || !regions.length) return { result: r, moments: [] };
  const seen = frames.filter(f => f.pose), leg = legLength(seen, W, H), dir = r.direction || 1, moments: PixelMoment[] = [];
  const timeOf = timeline(frames), places = placesOf(r, frames, W, H), placeOf = (key: string) => places.find(p => p.key === key);
  const bcRegion = regions.find(q => q.key === 'bc'), bcPlace = placeOf('bc');
  let blockClearance = r.blockClearance, clearancePts: number | null = null;
  if (bcRegion && bcPlace && r.blockClearance) {
    const p = pictures.get('bc'), win = windowOf(bcRegion, bcPlace.main);
    const found = p ? leaving(p, bcRegion, win, r.blockClearance.frame, bcPlace.tip ? windowOf(bcRegion, bcPlace.tip) : null) : null;
    moments.push({ key: 'clearance', frame: found?.at ?? null, fromPixels: !!found, share: found?.share ?? null });
    if (found) {
      const n = Math.floor(found.at), i = seen.findIndex(f => f.frame >= n);   // the last frame with the foot on the block
      if (i >= 0) { blockClearance = posture(seen.slice(Math.max(0, i - 2), i + 3), r.blocks!.front, W, H, dir, leg, seen[i]); clearancePts = timeOf(found.at); }
    }
  }
  const contacts = r.contacts.map(c => {
    const q = regions.find(g => g.key === `c${c.index}`), p = pictures.get(`c${c.index}`), place = placeOf(`c${c.index}`);
    if (!q || !p || !place?.tip || c.touchdownFrame === null) {
      moments.push({ key: `td${c.index}`, frame: null, fromPixels: false, share: null });
      if (c.toeOffFrame != null) moments.push({ key: `to${c.index}`, frame: null, fromPixels: false, share: null });
      return c;
    }
    const found = contactOf(p, q, windowOf(q, place.main), windowOf(q, place.tip), c.touchdownFrame, c.toeOffFrame ?? null);
    moments.push({ key: `td${c.index}`, frame: found.td?.at ?? null, fromPixels: !!found.td, share: found.tdShare });
    if (c.toeOffFrame != null) moments.push({ key: `to${c.index}`, frame: found.to?.at ?? null, fromPixels: !!found.to, share: found.toShare });
    const out = { ...c };
    // The times between frames; the frames shown (and the angles): the first with the shoe down, the last with the toe down.
    if (found.td) { out.touchdown = timeOf(found.td.at); out.touchdownFrame = Math.ceil(found.td.at); }
    if (found.to && c.toeOff !== null) { out.toeOff = timeOf(found.to.at); out.toeOffFrame = Math.floor(found.to.at); }
    return out;
  });
  const steps = stepsOf(contacts, frames, W, H, dir, leg);
  const firstTd = contacts[0]?.touchdown ?? null, startPts = clearancePts ?? r.blockClearance?.pts ?? null;
  const firstFlight = firstTd !== null && startPts !== null ? firstTd - startPts : r.firstFlight;
  return { result: { ...r, contacts, steps, blockClearance, firstFlight }, moments };
}

/** The front foot's toe on its block at the clearance (pixels): the toe nearest the front block in that frame. */
function frontToe(r: CrouchResult, frames: readonly CrouchFrame[], W: number, H: number) {
  if (!r.blockClearance || !r.blocks) return null;
  const f = frames.find(g => g.frame === r.blockClearance!.frame), pose = f?.pose; if (!pose) return null;
  const toes = [pose[31], pose[32]].filter(p => p && Number.isFinite(p.x) && Number.isFinite(p.y));
  const toe = toes.reduce<(typeof toes)[number] | null>((b, p) => !b || Math.abs(p.x - r.blocks!.front) < Math.abs(b.x - r.blocks!.front) ? p : b, null);
  return toe ? { x: r.blocks.front * W, y: toe.y * H } : null;
}
/** Frame number (fractional) to time: between the analysed frames' times; beyond them by the frame interval. */
function timeline(frames: readonly CrouchFrame[]) {
  const sorted = [...frames].sort((a, b) => a.frame - b.frame);
  const d = sorted.slice(1).map((f, i) => (f.pts - sorted[i].pts) / Math.max(1, f.frame - sorted[i].frame)).filter(v => v > 0).sort((a, b) => a - b);
  const step = d.length ? d[d.length >> 1] : 1 / 240;
  return (at: number) => {
    const i = sorted.findIndex(f => f.frame > at);
    if (i <= 0) { const f = i === 0 ? sorted[0] : sorted.at(-1)!; return f.pts + (at - f.frame) * step; }
    const a = sorted[i - 1], b = sorted[i];
    return a.pts + (at - a.frame) / (b.frame - a.frame) * (b.pts - a.pts);
  };
}
interface Window { x0: number; y0: number; x1: number; y1: number }
/** A window in a region's picture (region pixels), from its centre and size in the frame's pixels. */
function windowOf(q: PixelRegion, { cx, cy, w, h }: Spot): Window {
  const x0 = Math.max(0, Math.round(cx - w / 2) - q.x), y0 = Math.max(0, Math.round(cy - h / 2) - q.y);
  return { x0, y0, x1: Math.min(q.w, Math.max(x0 + 1, Math.round(cx + w / 2) - q.x)), y1: Math.min(q.h, Math.max(y0 + 1, Math.round(cy + h / 2) - q.y)) };
}

type Pictures = Map<number, Uint8Array>;
const medianOf = (v: number[]) => { const a = [...v].sort((x, y) => x - y); return a[a.length >> 1]; };
/** The pixel-by-pixel median picture of the window over the frames a..b (those present); null without three. */
function medianPicture(p: Pictures, q: PixelRegion, win: Window, a: number, b: number): Float32Array | null {
  const list: Uint8Array[] = []; for (let f = Math.round(a); f <= Math.round(b); f++) { const x = p.get(f); if (x) list.push(x); }
  if (list.length < 3) return null;
  const w = win.x1 - win.x0, out = new Float32Array(w * (win.y1 - win.y0) * 3);
  for (let y = win.y0; y < win.y1; y++) for (let x = win.x0; x < win.x1; x++) for (let c = 0; c < 3; c++) {
    const i = (y * q.w + x) * 3 + c;
    out[((y - win.y0) * w + x - win.x0) * 3 + c] = medianOf(list.map(l => l[i]));
  }
  return out;
}
/** The picture's noise in the window (the median change of a pixel from one frame to the next, R+G+B), frames a..b. */
function noiseOf(p: Pictures, q: PixelRegion, win: Window, a: number, b: number) {
  const d: number[] = [];
  for (let f = Math.round(a) + 1; f <= Math.round(b); f++) {
    const x = p.get(f), y = p.get(f - 1); if (!x || !y) continue;
    for (let yy = win.y0; yy < win.y1; yy++) for (let xx = win.x0; xx < win.x1; xx++) {
      const i = (yy * q.w + xx) * 3; d.push(Math.abs(x[i] - y[i]) + Math.abs(x[i + 1] - y[i + 1]) + Math.abs(x[i + 2] - y[i + 2]));
    }
  }
  return d.length ? medianOf(d) : 0;
}
/** The share of the window's telling pixels closer to `shoe` than to `ground`, frame by frame; null without enough of them. */
function shares(p: Pictures, q: PixelRegion, win: Window, shoe: Float32Array, ground: Float32Array, noise: number) {
  const w = win.x1 - win.x0, at: number[] = [], thr = Math.max(S.DIFF, S.NOISE * noise);
  for (let y = win.y0; y < win.y1; y++) for (let x = win.x0; x < win.x1; x++) {
    const j = ((y - win.y0) * w + x - win.x0) * 3;
    if (Math.abs(shoe[j] - ground[j]) + Math.abs(shoe[j + 1] - ground[j + 1]) + Math.abs(shoe[j + 2] - ground[j + 2]) > thr) at.push((y * q.w + x) * 3, j);
  }
  if (at.length / 2 < S.MIN_PIXELS) return null;
  const out = new Map<number, number>();
  for (const [f, x] of p) {
    let like = 0;
    for (let k = 0; k < at.length; k += 2) {
      const i = at[k], j = at[k + 1];
      const s = Math.abs(x[i] - shoe[j]) + Math.abs(x[i + 1] - shoe[j + 1]) + Math.abs(x[i + 2] - shoe[j + 2]);
      const g = Math.abs(x[i] - ground[j]) + Math.abs(x[i + 1] - ground[j + 1]) + Math.abs(x[i + 2] - ground[j + 2]);
      if (s < g) like++;
    }
    out.set(f, like / (at.length / 2));
  }
  return out;
}
const level = (s: Map<number, number>, a: number, b: number) => {
  const v: number[] = []; for (let f = Math.round(a); f <= Math.round(b); f++) { const x = s.get(f); if (x !== undefined) v.push(x); }
  return v.length ? medianOf(v) : NaN;
};
/** Going from `from` by `step` (−1 back, +1 on) while the share is at least `at`: the last such frame and, between it
 * and the next, where the share passes `at`. */
function edge(s: Map<number, number>, from: number, step: 1 | -1, at = .5) {
  let f = Math.round(from);
  if (!((s.get(f) ?? 0) >= at)) return null;
  while ((s.get(f + step) ?? -1) >= at) f += step;
  const inside = s.get(f)!, outside = s.get(f + step);
  if (outside === undefined) return null;   // ran off the pictures
  return f + step * (inside - at) / (inside - outside);
}

/** A contact's touchdown and toe-off from the toe pixels (pose's moments td0, to0; to0 null: cut by the video's end). */
function contactOf(p: Pictures, q: PixelRegion, win: Window, tip: Window, td0: number, to0: number | null) {
  const end = to0 ?? Math.max(...p.keys()) - 8, mid = (td0 + end) / 2;
  const before = medianPicture(p, q, win, td0 - 30, td0 - 20);
  const standing = medianPicture(p, q, win, mid - 3, mid + 3), noise = noiseOf(p, q, win, td0 - 30, td0 - 20);
  const none = { td: null, to: null, tdShare: null, toShare: null };
  if (!before || !standing) return none;
  // First from the shoe in the middle of the contact, then from the shoe just after the touchdown and just before the toe-off.
  const s1 = shares(p, q, win, standing, before, noise), td1 = s1 ? edge(s1, mid, -1, S.TD_AT) : null;
  const tipAfter = to0 === null ? null : medianPicture(p, q, tip, to0 + 20, to0 + 30), tipStanding = medianPicture(p, q, tip, mid - 3, mid + 3);
  const tipNoise = noiseOf(p, q, tip, td0 - 30, td0 - 20);
  const s2 = tipAfter && tipStanding ? shares(p, q, tip, tipStanding, tipAfter, tipNoise) : null, to1 = s2 ? edge(s2, mid, 1, S.TO_AT) : null;
  const early = td1 === null ? null : medianPicture(p, q, win, td1 + 2, td1 + 6), late = to1 === null ? null : medianPicture(p, q, tip, to1 - 6, to1 - 2);
  const tdShare = early ? shares(p, q, win, early, before, noise) : null, toShare = late && tipAfter ? shares(p, q, tip, late, tipAfter, tipNoise) : null;
  const tdAt = tdShare && td1 !== null ? edge(tdShare, td1 + 4, -1, S.TD_AT) : null, toAt = toShare && to1 !== null ? edge(toShare, to1 - 4, 1, S.TO_AT) : null;
  // Taken when clear: the shoe seen just inside the contact, the ground just outside, near the pose's moment.
  const tdOk = tdShare && tdAt !== null && Math.abs(tdAt - td0) <= S.FAR && level(tdShare, tdAt + 2, tdAt + 6) >= S.STANDING && level(tdShare, tdAt - 12, tdAt - 5) <= S.BARE;
  const toOk = toShare && toAt !== null && to0 !== null && Math.abs(toAt - to0) <= S.FAR && level(toShare, toAt - 6, toAt - 2) >= S.STANDING && level(toShare, toAt + 5, toAt + 12) <= S.BARE;
  const both = tdOk && toOk && toAt! - tdAt! < 10;   // a contact this short is not one
  return { td: tdOk && !both ? { at: tdAt! } : null, to: toOk && !both ? { at: toAt! } : null, tdShare, toShare };
}
/** The front foot leaving its block: the last frame the foot pixels look like the foot on the block (pose's clearance bc0). */
function leaving(p: Pictures, q: PixelRegion, win: Window, bc0: number, tip: Window | null = null) {
  const on = medianPicture(p, q, win, bc0 - 12, bc0 - 4), bare = medianPicture(p, q, win, bc0 + 20, bc0 + 30), noise = noiseOf(p, q, win, bc0 + 20, bc0 + 30);
  if (!on || !bare) return null;
  const s1 = shares(p, q, win, on, bare, noise), at1 = s1 ? edge(s1, bc0 - 8, 1, S.TO_AT) : null;
  const last = at1 === null ? null : medianPicture(p, q, win, at1 - 6, at1 - 2), share = last ? shares(p, q, win, last, bare, noise) : null;
  const at = share && at1 !== null ? edge(share, at1 - 4, 1, S.TO_AT) : null;
  if (!share || at === null || Math.abs(at - bc0) > S.FAR || level(share, at - 6, at - 2) < S.STANDING || level(share, at + 5, at + 12) > S.BARE) return null;
  // The forefoot's pixels change as the heel rises and the shoe turns over its tip, before the toe leaves the block:
  // the moment is then taken at the tip of the shoe, when its pixels pass from the toe on the block to the bare block.
  if (S.BC_TIP && tip) {
    const tipOn = medianPicture(p, q, tip, at - 4, at), tipBare = medianPicture(p, q, tip, bc0 + 20, bc0 + 30), tipNoise = noiseOf(p, q, tip, bc0 + 20, bc0 + 30);
    const s = tipOn && tipBare ? shares(p, q, tip, tipOn, tipBare, tipNoise) : null, atTip = s ? edge(s, at - 2, 1, S.TO_AT) : null;
    if (s && atTip !== null && atTip >= at - 1 && atTip - at <= S.BC_TIP_FAR && level(s, atTip - 6, atTip - 2) >= S.STANDING && level(s, atTip + 5, atTip + 12) <= S.BARE)
      return { at: atTip, share: s };
  }
  return { at, share };
}
