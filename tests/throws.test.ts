import { describe, expect, it } from 'vitest';
import { analyzeThrow, releaseMeasures, type ThrowOptions } from '../src/throws/analysis';
import { throwAdvice } from '../src/throws/advice';
import type { CrouchFrame, CrouchPoint } from '../src/sprint10/crouch';

// Synthetic throws filmed from the side at 120 fps, 1920x1080, thrown to the
// right; the ground at y = 900 px. Thigh and shank are 210 px; each foot is
// planted at its place during its contacts and otherwise carried through the
// air well above the ground. The throwing (right) hand is highest at the release.
const W = 1920, H = 1080, FPS = 120, GROUND = 900, THIGH = 210, SHANK = 210;
type P = { x: number; y: number };
interface Foot { contacts: { from: number; to: number; x: number }[]; air: (t: number) => P }
interface Body { until: number; hip: (t: number) => P; lean: (t: number) => number; feet: [Foot, Foot]; wristTop: number }

/** The knee where thigh and shank meet, ahead of the hip-ankle line (straight when out of reach). */
function knee(hip: P, ankle: P): P {
  const d = Math.hypot(ankle.x - hip.x, ankle.y - hip.y), ux = (ankle.x - hip.x) / d, uy = (ankle.y - hip.y) / d;
  if (d >= THIGH + SHANK - 1e-6) return { x: hip.x + ux * THIGH, y: hip.y + uy * THIGH };
  const a = (THIGH ** 2 - SHANK ** 2 + d ** 2) / (2 * d), h = Math.sqrt(THIGH ** 2 - a ** 2);
  const n = { x: -uy, y: ux }, side = n.x > 0 ? 1 : -1;   // the knee points forward (+x)
  return { x: hip.x + ux * a + side * n.x * h, y: hip.y + uy * a + side * n.y * h };
}
const angle = (a: P, b: P, c: P) => { const u = { x: a.x - b.x, y: a.y - b.y }, v = { x: c.x - b.x, y: c.y - b.y };
  return Math.acos((u.x * v.x + u.y * v.y) / Math.hypot(u.x, u.y) / Math.hypot(v.x, v.y)) * 180 / Math.PI; };

function build(body: Body, { mirror = false, spikeAt = null as number | null } = {}) {
  const frames: CrouchFrame[] = [], truth: { t: number; knees: number[] }[] = [];
  for (let frame = 0; frame / FPS <= body.until; frame++) {
    const t = frame / FPS, hip = body.hip(t), lean = body.lean(t) * Math.PI / 180;
    const pts: P[] = Array.from({ length: 33 }, () => ({ ...hip }));
    const shoulder = { x: hip.x + Math.sin(lean) * 280, y: hip.y - Math.cos(lean) * 280 };
    const put = (k: number, p: P) => { pts[k] = p; };
    put(0, { x: shoulder.x + 10, y: shoulder.y - 60 }); put(11, { x: shoulder.x - 8, y: shoulder.y }); put(12, { x: shoulder.x + 8, y: shoulder.y });
    put(23, { x: hip.x - 6, y: hip.y }); put(24, { x: hip.x + 6, y: hip.y });
    // The right hand rises to its highest at the release, the left stays at the shoulder.
    put(14, { x: shoulder.x - 40, y: shoulder.y - 60 }); put(16, { x: shoulder.x - 20, y: shoulder.y - 120 - 200 * Math.max(0, 1 - Math.abs(t - body.wristTop) / .3) });
    put(13, { x: shoulder.x + 50, y: shoulder.y + 60 }); put(15, { x: shoulder.x + 90, y: shoulder.y + 90 });
    if (spikeAt !== null && frame === spikeAt) put(16, { x: shoulder.x, y: 20 });   // one frame's jump of the pose model
    const knees: number[] = [];
    body.feet.forEach((foot, side) => {
      const c = foot.contacts.find(q => t >= q.from && t <= q.to);
      const toe = c ? { x: c.x, y: GROUND } : foot.air(t);
      const ankle = { x: toe.x - 30, y: toe.y - 30 }, k = knee(pts[23 + side], ankle);
      put(25 + side, k); put(27 + side, ankle); put(29 + side, { x: toe.x - 50, y: toe.y - 8 }); put(31 + side, toe);
      knees.push(angle(pts[23 + side], k, ankle));
    });
    const pose: CrouchPoint[] = pts.map(p => ({ x: (mirror ? W - p.x : p.x) / W, y: p.y / H, visibility: .9 }));
    frames.push({ frame, pts: t, pose, refined: pose });
    truth.push({ t, knees });
  }
  return { frames, truth };
}
const run = (frames: CrouchFrame[], o: Partial<ThrowOptions> & Pick<ThrowOptions, 'event'>) => analyzeThrow(frames, { width: W, height: H, hand: 'right', ...o });
/** A knee as the analysis gives it: the median over the frames within ±8.5 ms. */
const kneeNear = (truth: { t: number; knees: number[] }[], t: number, side: 0 | 1) => {
  const v = truth.filter(q => Math.abs(q.t - t) <= .0085).map(q => q.knees[side]).sort((a, b) => a - b); return v[v.length >> 1]; };
const flying = (from: P, to: P, t0: number, t1: number) => (t: number): P => { const f = Math.max(0, Math.min(1, (t - t0) / (t1 - t0)));
  return { x: from.x + (to.x - from.x) * f, y: Math.min(from.y, to.y) - 120 * Math.sin(Math.PI * f) }; };

// Javelin: the rear (right) foot on the ground at the start, the block (left)
// foot coming through the air and planted at 0.30 s; release at 0.50 s.
const JAV: Body = { until: .8, wristTop: .5,
  hip: t => ({ x: 650 + 420 * Math.min(t, .6) - 200 * Math.min(t, .6) ** 2, y: 560 + 40 * Math.max(0, Math.min(1, (t - .3) / .15)) }),
  lean: t => t < .3 ? -15 : t < .5 ? -15 + 25 * (t - .3) / .2 : 10,
  feet: [{ contacts: [{ from: .30, to: 1, x: 1050 }], air: flying({ x: 450, y: 780 }, { x: 1050, y: 800 }, 0, .30) },
    { contacts: [{ from: 0, to: .45, x: 700 }], air: flying({ x: 700, y: GROUND }, { x: 1150, y: 760 }, .45, .8) }] };
// Glide: the rear foot leaves the back at 0.40 s, lands mid-circle at 0.55 s;
// the front foot lands at 0.65 s; release at 0.90 s.
const GLIDE: Body = { until: 1.1, wristTop: .9,
  hip: t => ({ x: 560 + 320 * Math.max(0, Math.min(1, (t - .3) / .5)) + 60 * Math.max(0, t - .8), y: 600 }),
  lean: t => t < .65 ? -50 : t < .9 ? -50 + 55 * (t - .65) / .25 : 5,
  feet: [{ contacts: [{ from: .65, to: 1.2, x: 1110 }], air: flying({ x: 400, y: 760 }, { x: 1110, y: 780 }, 0, .65) },
    { contacts: [{ from: 0, to: .40, x: 600 }, { from: .55, to: 1.2, x: 800 }], air: flying({ x: 600, y: GROUND - 20 }, { x: 800, y: GROUND - 20 }, .40, .55) }] };
// Standing: both feet down throughout; the hips go back to 0.40 s, then forward; release at 0.80 s.
const STANDING: Body = { until: 1.0, wristTop: .8,
  hip: t => ({ x: t < .4 ? 900 - 150 * t : 840 + 200 * (t - .4), y: 600 }),
  lean: t => t < .4 ? -30 : -30 + 40 * Math.min(1, (t - .4) / .4),
  feet: [{ contacts: [{ from: 0, to: 2, x: 1080 }], air: () => ({ x: 0, y: 0 }) }, { contacts: [{ from: 0, to: 2, x: 720 }], air: () => ({ x: 0, y: 0 }) }] };

describe('throws (side view)', () => {
  it('javelin: block contact, release, the time between and the block knee', () => {
    const { frames, truth } = build(JAV), r = run(frames, { event: 'jav' });
    expect(r.reason).toBeNull();
    expect(r.direction).toBe(1);
    expect(r.contacts[r.front!].touchdown).toBeCloseTo(.30, 1);
    expect(r.release!.pts).toBeCloseTo(.5, 2);
    expect(r.times.delivery!).toBeGreaterThan(.18); expect(r.times.delivery!).toBeLessThan(.22);
    // The javelin's rear foot is not timed (it slides on after landing in real throws).
    expect(r.rear).toBeNull(); expect(r.times.rearToFront).toBeNull();
    expect(r.frontKnee.atStart!).toBeCloseTo(kneeNear(truth, r.deliveryStart!.pts, 0), 0);
    expect(r.frontKnee.atRelease!).toBeCloseTo(kneeNear(truth, .5, 0), 0);
    const least = Math.min(...truth.filter(q => q.t >= r.deliveryStart!.pts && q.t <= .5).map(q => q.knees[0]));
    expect(r.frontKnee.least!).toBeGreaterThanOrEqual(least - .5); expect(r.frontKnee.least!).toBeLessThanOrEqual(r.frontKnee.atStart! + .01);
    expect(r.trunk.atStart!).toBeLessThan(0);   // leaning back at the block contact
    expect(r.moments.map(m => m.key)).toEqual(expect.arrayContaining(['front', 'release']));
    expect(r.moments.find(m => m.key === 'front')!.marks.map(m => m.label)).toEqual(['後傾', 'ブロック膝']);
  });
  it('takes the release from the hand despite a one-frame jump, or from the user', () => {
    const { frames } = build(JAV, { spikeAt: 24 });
    const r = run(frames, { event: 'jav' });
    expect(r.release!.frame).toBe(60);
    const moved = run(frames, { event: 'jav', releaseFrame: 58 });
    expect(moved.release!.frame).toBe(58); expect(moved.releaseSetByUser).toBe(true); expect(moved.releaseFound!.frame).toBe(60);
    expect(moved.times.delivery!).toBeCloseTo(r.times.delivery! - 2 / FPS, 5);
  });
  it('glide: the glide, the transition and the delivery', () => {
    const { frames, truth } = build(GLIDE), r = run(frames, { event: 'shot', style: 'glide' });
    expect(r.reason).toBeNull();
    expect(r.times.glide!).toBeCloseTo(.15, 1);
    expect(r.times.rearToFront!).toBeCloseTo(.10, 1);
    expect(r.times.delivery!).toBeCloseTo(.25, 1);
    expect(r.rearKnee.atStart!).toBeCloseTo(kneeNear(truth, r.deliveryStart!.pts, 1), 0);
    expect(r.moments.map(m => m.key)).toEqual(['rear', 'front', 'release']);
    expect(throwAdvice(r).map(a => a.topic)).toEqual(expect.arrayContaining(['グライド', '移行局面', '突き出し', 'パワーポジション']));
  });
  it('glide: the stance at the power position, the glide, the trunk raised and the rear knee at the release', () => {
    const r = run(build(GLIDE).frames, { event: 'shot', style: 'glide' });
    expect(r.stancePx).toBeCloseTo(1110 - 800, -1);
    expect(r.glidePx).toBeCloseTo(800 - 600, -1);
    expect(r.trunk.atRelease! - r.trunk.atStart!).toBeGreaterThan(40);
    expect(r.rearKnee.atRelease).not.toBeNull();
    expect(r.bodyPx!).toBeGreaterThan(700); expect(r.bodyPx!).toBeLessThan(1300);
  });
  it('the release with a flight: speed from the height, angle, height share, attitude and attack', () => {
    const r = run(build(JAV).frames, { event: 'jav' });
    const flight = { x0: 0, y0: 0, t0: .5, vx: 1500, vy: -900, speedPx: 2000, angle: 31, frames: 8, score: 6 };
    const rel = releaseMeasures(r, flight, 38, 1.6);
    expect(rel.speed!).toBeCloseTo(2000 / (r.bodyPx! / 1.6), 6);
    expect(rel.angle).toBe(31);
    expect(rel.attack).toBe(7);
    expect(rel.heightShare!).toBeCloseTo((r.groundY! - r.releaseHand!.y) / r.bodyPx!, 6);
    expect(rel.height!).toBeCloseTo(rel.heightShare! * 1.6, 6);
    // Without the height: no speed or metres, the rest as before.
    const bare = releaseMeasures(r, flight, 38, null);
    expect([bare.speed, bare.height, bare.angle, bare.attack]).toEqual([null, null, 31, 7]);
    // The centre of mass's forward speed at both moments (here the rear leg swings through fast, so it rises).
    expect(r.com.atStart).not.toBeNull(); expect(r.com.atRelease).not.toBeNull();
  });
  it('standing throw: the delivery from the hips furthest back', () => {
    const { frames } = build(STANDING), r = run(frames, { event: 'shot', style: 'standing' });
    expect(r.reason).toBeNull();
    expect(r.power!.pts).toBeCloseTo(.4, 1);
    expect(r.times.delivery!).toBeCloseTo(.4, 1);
    expect(r.times.glide).toBeNull(); expect(r.times.rearToFront).toBeNull();
    expect(r.moments.map(m => m.key)).toEqual(['power', 'release']);
  });
  it('gives the same throw filmed the other way round', () => {
    const a = run(build(GLIDE).frames, { event: 'shot', style: 'glide' }), b = run(build(GLIDE, { mirror: true }).frames, { event: 'shot', style: 'glide' });
    expect(b.direction).toBe(-1);
    expect(b.times).toEqual(a.times);
    expect(b.frontKnee.atRelease!).toBeCloseTo(a.frontKnee.atRelease!, 6);
    expect(b.trunk.atStart!).toBeCloseTo(a.trunk.atStart!, 6);
  });
  it('a left-hander: the release from the left hand', () => {
    const { frames } = build(JAV);
    // Swap the pose model's sides so the hand that rises is the left one.
    const swapped = frames.map(f => { const p = [...f.pose!]; for (let k = 1; k < 33; k += 2) if (k >= 11) [p[k], p[k + 1]] = [p[k + 1], p[k]]; return { ...f, pose: p, refined: p }; });
    const r = run(swapped, { event: 'jav', hand: 'left' });
    expect(r.release!.frame).toBe(60);
    expect(run(swapped, { event: 'jav', hand: 'right' }).release!.frame).not.toBe(60);
  });
  it('fails clearly without the athlete or a throw', () => {
    expect(run([], { event: 'jav' }).reason).toMatch(/選手/);
    const { frames } = build({ ...STANDING, hip: () => ({ x: 900, y: 600 }) });
    expect(run(frames, { event: 'shot', style: 'standing' }).reason).toMatch(/向き/);
  });
});
