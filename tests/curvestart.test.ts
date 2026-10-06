import { describe, expect, it } from 'vitest';
import { fitCamera, focalPixels, makeCamera, LANE, type CameraParams, type P2 } from '../src/curvestart/camera';
import { analyzeCurveStart, MEASURE } from '../src/curvestart/analysis';
import { curveAdvice } from '../src/curvestart/advice';
import { focalFromBytes } from '../src/curvestart/focal';
import { laneLine, traceLanes, type Luma } from '../src/curvestart/lanes';
import type { CrouchFrame, CrouchPoint } from '../src/sprint10/crouch';

// A curve start filmed from behind the blocks as the test videos: 4K portrait, 25 mm, the camera 1.4 m high, 4.5 m behind
// the start line and 1.7 m out from the inner line (a lane further out), turned 10° toward the curve, pitched down 10°.
const W = 2160, H = 3840, MM = 25, F = focalPixels(W, H, MM), R = 40;
const TRUE: CameraParams = [Math.PI / 2 + 10 * Math.PI / 180, -10 * Math.PI / 180, -.01, R + 1.7, -4.5, 1.4];
const cam = makeCamera(TRUE, F, W, H);
const inPicture = (q: P2 | null): q is P2 => !!q && q[0] >= 0 && q[0] < W && q[1] > .42 * H && q[1] < H;
const circle = (r: number) => { const pts: P2[] = []; for (let a = -.1; a < .7; a += .002) { const q = cam.project([r * Math.cos(a), r * Math.sin(a), 0]); if (inPicture(q)) pts.push(q); } return pts; };
const INNER = circle(R), OUTER = circle(R + LANE);
const START: P2[] = []; for (let r = R + .05; r < R + LANE - .05; r += .02) { const q = cam.project([r, 0, 0]); if (q) START.push(q); }

describe('curve start camera from the lane lines', () => {
  it('finds the camera from the inner and outer lines, the start line and the focal length', () => {
    const fit = fitCamera([{ k: 0, pts: INNER }, { k: 1, pts: OUTER }], START, W, H, MM)!;
    expect(fit).not.toBeNull();
    expect(fit.params[5]).toBeCloseTo(1.4, 1);
    expect(-fit.params[4]).toBeGreaterThan(4.3); expect(-fit.params[4]).toBeLessThan(4.7);
    expect(fit.params[3] - fit.R).toBeCloseTo(1.7, 1);
    expect(fit.rms).toBeLessThan(1);
  });
});

// An athlete: hands on the start line 0.75 m out from the inner line until frame 30, then straight along the tangent to
// the measurement line (20 cm in), then round the curve 25 cm from the inner line; feet 9 cm either side of the path
// (on the curve the feet land 10 cm further out than the body, so the body leans in about 7°).
const D0 = .75, LEAN_IN = 7;
const S: P2 = [R + D0, 0], RT = R + MEASURE, TL = Math.sqrt((R + D0) ** 2 - RT ** 2), TA = Math.acos(RT / (R + D0)), Tg: P2 = [RT * Math.cos(TA), RT * Math.sin(TA)];
/** The path's point and direction at distance s run: straight along the tangent, then round the curve 25 cm in; or, for
 * an athlete drawn in by the curve, turning off the straight line at `turnAt` m on a 40 m radius. */
function pathAt(s: number, turnAt = TL): { p: P2; dir: P2; curve: boolean } {
  const e: P2 = [(Tg[0] - S[0]) / TL, (Tg[1] - S[1]) / TL], left: P2 = [-e[1], e[0]];
  if (s <= turnAt) return { p: [S[0] + e[0] * s, S[1] + e[1] * s], dir: e, curve: false };
  if (turnAt < TL) {
    const rho = 40, u = (s - turnAt) / rho, P0: P2 = [S[0] + e[0] * turnAt, S[1] + e[1] * turnAt];
    return { p: [P0[0] + e[0] * rho * Math.sin(u) + left[0] * rho * (1 - Math.cos(u)), P0[1] + e[1] * rho * Math.sin(u) + left[1] * rho * (1 - Math.cos(u))],
      dir: [e[0] * Math.cos(u) + left[0] * Math.sin(u), e[1] * Math.cos(u) + left[1] * Math.sin(u)], curve: true };
  }
  const r = R + .25, a = TA + (s - TL) / r;
  return { p: [r * Math.cos(a), r * Math.sin(a)], dir: [-Math.sin(a), Math.cos(a)], curve: true };
}
const STEPS = [.6, 1.6, 2.7, 3.9, 5.2, 6.6, 8.1, 9.7, 11.4, 13.2, 15.0, 16.8];
const RUN = 30, FIRST_TD = 42, STEP_FRAMES = 13, CONTACT = 8, FPS = 60;
function athleteFrames(turnAt = TL): CrouchFrame[] {
  const frames: CrouchFrame[] = [];
  const contacts = STEPS.map((s, i) => { const { p, dir, curve } = pathAt(s, turnAt), side = i % 2 === 0 ? 1 : -1, out = curve ? .85 * Math.tan(LEAN_IN * Math.PI / 180) : 0;
    const right: P2 = [dir[1], -dir[0]], lat = side * .09 + out;   // + to the right of the way of running (outward)
    return { from: FIRST_TD + i * STEP_FRAMES, to: FIRST_TD + i * STEP_FRAMES + CONTACT - 1, foot: [p[0] + right[0] * lat, p[1] + right[1] * lat] as P2, side, s }; });
  for (let f = 0; f < FIRST_TD + STEPS.length * STEP_FRAMES + 10; f++) {
    // Where the body is: in the set position at the start, then moving along the path between footprints.
    // The body passes over each footprint in the middle of its contact (s from one footprint's middle to the next).
    const mids = contacts.map(q => ({ f: (q.from + q.to) / 2, s: q.s })), k = mids.findIndex(m => m.f >= f);
    const s = f < RUN ? -.4 : f < mids[0].f ? -.4 + (f - RUN) / (mids[0].f - RUN) * (mids[0].s + .4)
      : k < 0 ? mids.at(-1)!.s + (f - mids.at(-1)!.f) / STEP_FRAMES * 1.8 : mids[k - 1].s + (f - mids[k - 1].f) / (mids[k].f - mids[k - 1].f) * (mids[k].s - mids[k - 1].s);
    const { p, dir } = pathAt(Math.max(0, s), turnAt), right: P2 = [dir[1], -dir[0]];
    const at = (lat: number, z: number, fwd = 0): CrouchPoint => { const q = cam.project([p[0] + right[0] * lat + dir[0] * fwd, p[1] + right[1] * lat + dir[1] * fwd, z])!; return { x: q[0] / W, y: q[1] / H, visibility: .9 }; };
    const pose: CrouchPoint[] = Array.from({ length: 33 }, () => at(0, .9));
    const set = f < RUN, hip = set ? .55 : .85;
    pose[0] = at(0, set ? .55 : 1.6, set ? .5 : .1);
    pose[11] = at(-.2, set ? .6 : 1.35, set ? .35 : .05); pose[12] = at(.2, set ? .6 : 1.35, set ? .35 : .05);
    pose[23] = at(-.1, hip); pose[24] = at(.1, hip);
    // Hands: on the start line, either side of the body, until the start; then swinging at the hips.
    if (set) { const hand = (lat: number) => { const q = cam.project([S[0] + lat, S[1] - .02, .02])!; return { x: q[0] / W, y: q[1] / H, visibility: .9 }; }; pose[15] = hand(-.25); pose[16] = hand(.25); }
    else { pose[15] = at(-.25, 1.0, .2); pose[16] = at(.25, 1.0, -.2); }
    for (const side of [-1, 1]) {
      const own = contacts.filter(q => q.side === side), on = own.find(q => f >= q.from && f <= q.to), idx = side < 0 ? 0 : 1;
      let toe: CrouchPoint, heel: CrouchPoint;
      if (on) {
        const g = (fwd: number, z: number) => { const q = cam.project([on.foot[0] + dir[0] * fwd, on.foot[1] + dir[1] * fwd, z])!; return { x: q[0] / W, y: q[1] / H, visibility: .9 }; };
        toe = g(.08, 0); heel = g(-.12, .03);
      } else if (set || f < FIRST_TD) { toe = at(side * .12, .05, -.5 - (side < 0 ? .3 : 0)); heel = at(side * .12, .15, -.65 - (side < 0 ? .3 : 0)); }
      else {
        // Swinging from its last footprint to its next, lifted up to 35 cm on the way.
        const prev = [...own].reverse().find(q => q.to < f), next = own.find(q => q.from > f);
        const a = prev?.foot ?? [p[0] - dir[0] * .5, p[1] - dir[1] * .5] as P2, b = next?.foot ?? [p[0] + dir[0] * .5, p[1] + dir[1] * .5] as P2;
        const t0 = prev?.to ?? f - 1, t1 = next?.from ?? f + 1, u = Math.min(1, Math.max(0, (f - t0) / Math.max(1, t1 - t0))), z = .35 * Math.sin(Math.PI * u);
        const g = (fwd: number, dz: number) => { const q = cam.project([a[0] + (b[0] - a[0]) * u + dir[0] * fwd, a[1] + (b[1] - a[1]) * u + dir[1] * fwd, z + dz])!; return { x: q[0] / W, y: q[1] / H, visibility: .9 }; };
        toe = g(.08, 0); heel = g(-.12, .05);
      }
      pose[31 + idx] = toe; pose[29 + idx] = heel;
      pose[27 + idx] = { ...heel, y: heel.y - .01 }; pose[25 + idx] = at(side * .1, .5, .1);
    }
    frames.push({ frame: f, pts: f / FPS, pose, refined: pose });
  }
  return frames;
}

describe('curve start path and lean', () => {
  const r = analyzeCurveStart(athleteFrames(), { width: W, height: H, mm35: MM, lines: { inner: INNER, outer: OUTER, start: START } });
  it('finds the start when the hands leave the ground, and the start place in the lane', () => {
    expect(r.reason).toBeNull();
    expect(r.runStart).toBeGreaterThanOrEqual(RUN); expect(r.runStart).toBeLessThanOrEqual(RUN + 3);
    expect(r.start!.cm!).toBeGreaterThan(D0 * 100 - 4); expect(r.start!.cm!).toBeLessThan(D0 * 100 + 4);
    expect(r.tangent!.length).toBeGreaterThan(TL - .4); expect(r.tangent!.length).toBeLessThan(TL + .4);
  });
  it('places each footprint across the lane with the lane width as the ruler', () => {
    expect(r.steps.length).toBeGreaterThanOrEqual(9);
    // The curve's footprints: the path 25 cm in, the feet 9 cm either side and 10 cm further out.
    const curve = r.steps.filter(q => q.along > TL + 1.5 && q.cm !== null);
    expect(curve.length).toBeGreaterThan(2);
    for (const q of curve) expect(Math.abs(q.cm! - (25 + 10.4 + (q.side === 'L' ? -9 : 9)))).toBeLessThan(5);
  });
  it('sees a straight start along the tangent, not drawn in before the tangent point', () => {
    expect(r.straight.verdict).toBe('straight');
    expect(r.straight.inward!).toBeLessThan(4);
    expect(Math.abs(r.straight.aim!)).toBeLessThan(.8);
    // Following the lane from the tangent point, the path leaves the straight line by 12 cm about 3 m later.
    expect(r.straight.until!).toBeGreaterThan(TL + 1.5); expect(r.straight.until!).toBeLessThan(TL + 5);
    // The body (the pelvis over the ground, the feet 10 cm further out by the lean) 25 cm from the inner line.
    expect(r.after.median!).toBeGreaterThan(20); expect(r.after.median!).toBeLessThan(31);
  });
  it('measures no lean on the straight and the inward lean on the curve', () => {
    expect(Math.abs(r.lean.straight!)).toBeLessThan(2.5);
    expect(r.lean.curve!).toBeLessThan(-LEAN_IN + 2.5); expect(r.lean.curve!).toBeGreaterThan(-LEAN_IN - 2.5);
  });
  it('turns the result into advice on going straight, the aim, the curve and the lean', () => {
    expect(curveAdvice(r).map(a => a.topic)).toEqual(expect.arrayContaining(['まっすぐ出られたか', '出た向き', 'カーブに沿えたか', 'カーブでの内傾']));
  });
  it('calls a start that turns toward the curve well before the tangent point early', () => {
    const early = analyzeCurveStart(athleteFrames(3), { width: W, height: H, mm35: MM, lines: { inner: INNER, outer: OUTER, start: START } });
    expect(early.reason).toBeNull();
    expect(early.straight.verdict).toBe('early');
    expect(early.straight.inward!).toBeGreaterThan(12);
    expect(curveAdvice(early).find(a => a.topic === 'まっすぐ出られたか')?.level).toBe('check');
  });
});

describe('lane lines in a picture', () => {
  // A grey track with two white lines (the curve's inner and outer lines as the camera sees them) and a start line across.
  const L: Luma = { data: new Uint8Array(W * H).fill(120), width: W, height: H };
  // A round brush along each line, 2 px at a time.
  const paint = (pts: P2[], r: number) => { for (let i = 0; i + 1 < pts.length; i++) {
    const n = Math.max(1, Math.ceil(Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]) / 2));
    for (let k = 0; k <= n; k++) { const x = pts[i][0] + (pts[i + 1][0] - pts[i][0]) * k / n, y = pts[i][1] + (pts[i + 1][1] - pts[i][1]) * k / n;
      for (let dx = -r; dx <= r; dx++) for (let dy = -r; dy <= r; dy++) { if (dx * dx + dy * dy > r * r) continue; const xi = Math.round(x + dx), yi = Math.round(y + dy); if (xi >= 0 && yi >= 0 && xi < W && yi < H) L.data[yi * W + xi] = 220; } } } };
  paint(INNER, 10); paint(OUTER, 10); paint(START, 6);
  it('follows a white line from a point set on it, through the start line', () => {
    const seed = INNER.reduce((best, q) => Math.abs(q[1] - START[0][1]) < Math.abs(best[1] - START[0][1]) ? q : best);
    const line = laneLine(L, seed)!;
    expect(line.length).toBeGreaterThan(100);
    // Distance to the drawn line (its polyline, segment by segment).
    const toInner = (q: P2) => { let m = Infinity; for (let i = 0; i + 1 < INNER.length; i++) { const a = INNER[i], b = INNER[i + 1], ex = b[0] - a[0], ey = b[1] - a[1], l2 = ex * ex + ey * ey, t = l2 ? Math.max(0, Math.min(1, ((q[0] - a[0]) * ex + (q[1] - a[1]) * ey) / l2)) : 0; m = Math.min(m, Math.hypot(q[0] - a[0] - t * ex, q[1] - a[1] - t * ey)); } return m; };
    expect(line.filter(q => toInner(q) > 6).length).toBeLessThan(line.length * .05);
  });
  it('traces the lane and its start line from points set where they cross', () => {
    const y = START[Math.floor(START.length / 2)][1], xi = INNER.find(q => Math.abs(q[1] - START[0][1]) < 20)!, xo = OUTER.find(q => Math.abs(q[1] - START.at(-1)![1]) < 20)!;
    const t = traceLanes(L, [xi[0], xi[1]], [xo[0], xo[1]]);
    expect(t.inner.length).toBeGreaterThan(50); expect(t.outer.length).toBeGreaterThan(50); expect(t.start.length).toBeGreaterThanOrEqual(5);
    expect(Math.abs(t.start[0][1] - y)).toBeLessThan(30);
  });
});

describe('focal length from the video', () => {
  it('reads the 35 mm equivalent focal length iPhone writes in the movie header', () => {
    const enc = (t: string) => Array.from(t, c => c.charCodeAt(0)), u32 = (n: number) => [n >>> 24 & 255, n >>> 16 & 255, n >>> 8 & 255, n & 255];
    const box = (type: string, body: number[]) => [...u32(8 + body.length), ...enc(type), ...body];
    const keyNames = ['com.apple.quicktime.camera.lens_model', 'com.apple.quicktime.camera.focal_length.35mm_equivalent'];
    const keys = box('keys', [0, 0, 0, 0, ...u32(keyNames.length), ...keyNames.flatMap(k => [...u32(8 + k.length), ...enc('mdta'), ...enc(k)])]);
    const item = (index: number, value: string) => [...u32(8 + 16 + value.length), ...u32(index), ...box('data', [0, 0, 0, 1, 0, 0, 0, 0, ...enc(value)])];
    const ilst = box('ilst', [...item(1, 'iPhone back camera'), ...item(2, '25')]);
    const bytes = new Uint8Array([...enc('junk'), ...box('meta', [...box('hdlr', new Array(24).fill(0)), ...keys, ...ilst])]);
    expect(focalFromBytes(bytes)).toBe(25);
    expect(focalFromBytes(new Uint8Array(enc('no metadata here')))).toBeNull();
  });
});
