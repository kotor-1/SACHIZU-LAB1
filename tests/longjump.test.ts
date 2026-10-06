import { describe, expect, it } from 'vitest';
import { analyzeLongJump, mps } from '../src/longjump/analysis';
import { longJumpAdvice } from '../src/longjump/advice';
import { centreOfMass } from '../src/hurdling/analysis';
import type { CrouchFrame, CrouchPoint } from '../src/sprint10/crouch';

// A synthetic run-up into a long jump, side view, 240 fps, 1920x1080, running to the left at 6 m/s, 200 px per metre,
// the ground at y = 900. The body is rigid and left/right symmetric about the pelvis but for the feet, planted at each
// contact; after the takeoff the pelvis (and so the centre of mass) follows a parabola under gravity.
const W = 1920, H = 1080, FPS = 240, SCALE = 200, SPEED = 6 * SCALE, G = 9.81 * SCALE, GROUND = 900, HIP = 520;
// Contacts [from, to, side]: three run-up steps, then the takeoff 0.80-0.94 s; the flight after it.
const CONTACTS: [number, number, 0 | 1][] = [[.10, .24, 1], [.36, .50, 0], [.62, .74, 1], [.80, .94, 0]];
const TAKEOFF_END = .94, VY = 3 * SCALE;
const hipX = (t: number) => 1800 - SPEED * t;
const hipY = (t: number) => t <= TAKEOFF_END ? HIP : HIP - VY * (t - TAKEOFF_END) + G / 2 * (t - TAKEOFF_END) ** 2;
function frames(until: number): CrouchFrame[] {
  const out: CrouchFrame[] = [];
  for (let frame = 0; frame / FPS <= until; frame++) {
    const t = frame / FPS, hx = hipX(t), hy = hipY(t);
    const pose: CrouchPoint[] = Array.from({ length: 33 }, () => ({ x: hx / W, y: (hy - 200) / H, visibility: .9 }));
    const put = (k: number, x: number, y: number) => { pose[k] = { x: x / W, y: y / H, visibility: .9 }; };
    put(0, hx - 10, hy - 250); put(7, hx - 5, hy - 240); put(8, hx + 5, hy - 240);
    put(11, hx - 8, hy - 200); put(12, hx + 8, hy - 200); put(13, hx - 20, hy - 110); put(14, hx + 20, hy - 110);
    put(15, hx - 15, hy - 40); put(16, hx + 15, hy - 40); put(23, hx - 8, hy); put(24, hx + 8, hy);
    for (const side of [0, 1] as const) {
      const c = CONTACTS.find(([a, b, s]) => s === side && t >= a && t <= b);
      // Planted ahead of the hips at mid-contact, else carried with the body (220 px below the hips: 160 above the
      // ground in the run-up; in the flight the whole body, feet too, follows the parabola).
      const toe = c ? { x: hipX((c[0] + c[1]) / 2) - 40, y: GROUND } : { x: hx + (side ? 60 : -60) - 40, y: hy + 220 };
      const ankle = { x: toe.x + 25, y: toe.y - 25 }, knee = { x: (hx + ankle.x) / 2 - 25, y: (hy + ankle.y) / 2 };
      put(25 + side, knee.x, knee.y); put(27 + side, ankle.x, ankle.y); put(29 + side, toe.x + 45, toe.y - 5); put(31 + side, toe.x, toe.y);
    }
    out.push({ frame, pts: t, pose, refined: pose });
  }
  return out;
}
const run = (until = 1.54, athleteHeight: number | null = null) => analyzeLongJump(frames(until), { width: W, height: H, athleteHeight });

describe('long jump, the end of the run-up', () => {
  it('finds the steps into the takeoff and times them', () => {
    const r = run();
    expect(r.reason).toBeNull();
    expect(r.direction).toBe(-1);
    expect(r.takeoff).toBe(3);
    expect(r.steps.map(s => s.before)).toEqual([1, 2]);
    expect(r.steps[0].stepTime).toBeCloseTo(.18, 1);   // 0.62 → 0.80
    expect(r.steps[1].stepTime).toBeCloseTo(.26, 1);   // 0.36 → 0.62
    expect(r.rhythm!).toBeCloseTo(.18 / .26, 1);
    expect(r.takeoffContact).toBeCloseTo(.14, 1);
  });
  it('the run-up speed in m/s with the scale from gravity in the flight', () => {
    const r = run();
    expect(r.scale!.source).toBe('gravity');
    expect(r.scale!.pxPerM / SCALE).toBeCloseTo(1, 1);
    // Against the synthetic body's own centre of mass (a planted foot holds it back a little behind the hips' 6 m/s).
    const f = frames(1.54), at = (t: number) => centreOfMass(f.reduce((a, q) => Math.abs(q.pts - t) < Math.abs(a.pts - t) ? q : a).pose!)!.x * W;
    // In px/s (the scale apart): within 2.5%. The synthetic foot jumps from the air to its place at a touchdown, moving the
    // centre of mass ~15 px in one frame; the app takes the median over ±0.0125 s, the truth one frame.
    const truth = (a: number, b: number) => (at(a) - at(b)) / (b - a);
    const c = r.contacts;
    expect(Math.abs(r.speed.lastTwoPx! / truth(c[1].touchdown!, c[3].touchdown!) - 1)).toBeLessThan(.025);
    r.steps.forEach(s => expect(Math.abs(s.speedPx! / truth(c[3 - s.before].touchdown!, c[4 - s.before].touchdown!) - 1)).toBeLessThan(.025));
    expect(Math.abs(mps(r, r.speed.lastTwoPx)! - 6)).toBeLessThan(.3);
    expect(Math.abs(mps(r, r.speed.touchdownPx)! - 6)).toBeLessThan(.4);
    expect(longJumpAdvice(r).map(a => a.topic)).toEqual(expect.arrayContaining(['助走速度', '最後の1歩の速さ', '最後の2歩のリズム']));
  });
  it('the toe-off: horizontal and vertical speeds and the takeoff angle from the flight', () => {
    const r = run();   // 6 m/s ahead, 3 m/s up: 26.6°
    expect(Math.abs(mps(r, r.leave!.verticalPx)! - 3)).toBeLessThan(.15);
    expect(Math.abs(mps(r, r.leave!.horizontalPx)! - 6)).toBeLessThan(.3);
    expect(Math.abs(r.leave!.angle - Math.atan2(3, 6) * 180 / Math.PI)).toBeLessThan(1.5);
    // A short flight with the trunk's scale (the synthetic trunk is 200 px: a "height" giving 200 px/m).
    const short = run(1.2, 200 / .288 / SCALE);
    expect(short.scale!.source).toBe('trunk');
    expect(Math.abs(mps(short, short.leave!.verticalPx)! - 3)).toBeLessThan(.15);
    expect(run(1.2).leave).toBeNull();
    expect(longJumpAdvice(r).map(a => a.topic)).toContain('踏切（離地）');
  });
  it('a short flight: the scale from the height entered, or none', () => {
    const r = run(1.2, 1.75);
    expect(r.scale!.source).toBe('trunk');
    expect(mps(r, r.speed.lastTwoPx)).not.toBeNull();
    const bare = run(1.2);
    expect(bare.scale).toBeNull();
    expect(mps(bare, bare.speed.lastTwoPx)).toBeNull();
    expect(bare.notes.join()).toMatch(/身長/);
  });
  it('the leg at the takeoff touchdown: hip to ankle below the horizontal ahead', () => {
    const r = run(), c = r.contacts[r.takeoff!], p = frames(1.54).find(q => q.frame === c.touchdownFrame)!.pose!;
    // The planted (left) leg: its hip-to-ankle line, ahead being to the left.
    const expected = Math.atan2((p[27].y - p[23].y) * H, (p[23].x - p[27].x) * W) * 180 / Math.PI;
    expect(r.posture.legAngle!).toBeCloseTo(expected, 3);
  });
  it('fails clearly without a takeoff', () => {
    const r = analyzeLongJump(frames(.7), { width: W, height: H });
    expect(r.reason).toMatch(/踏切/);
  });
});
