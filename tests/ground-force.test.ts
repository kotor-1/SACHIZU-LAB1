import { describe, expect, it } from 'vitest';
import { bodyTrack, G, groundForces, positionAt, pushStart, scaleFromHeight, type TrackPoint } from '../src/sprint10/ground-force';
import type { CrouchFrame, CrouchPoint } from '../src/sprint10/crouch';

// A synthetic crouch start at 240 fps, 300 px a metre, running right: the block push from rest at t = 0 to 3.36 m/s
// forward and 0.6 m/s up as the front foot leaves at 0.36 s (an elite senior's, Graham-Smith et al. 2020); then each
// contact raises the speed evenly to its toe-off speed, and the flights hold it.
const FPS = 240, PX = 300, MASS = 60;
const CONTACTS: [number, number, number][] = [[.41, .605, 4.60], [.655, .828, 5.48], [.878, 1.03, 6.10], [1.09, 1.23, 6.55]];
function speed(t: number): number {
  if (t <= 0) return 0;
  if (t <= .36) return 3.36 * t / .36;
  let v = 3.36;
  for (const [td, to, after] of CONTACTS) {
    if (t < td) return v;
    if (t <= to) return v + (after - v) * (t - td) / (to - td);
    v = after;
  }
  return v;
}
function rise(t: number): number {   // upward position (m)
  if (t <= 0) return 0;
  if (t <= .36) return .6 * t * t / (2 * .36);
  const d = Math.min(t, .41) - .36;
  return .6 * .36 / 2 + .6 * d - G * d * d / 2;
}
function track(noise = 0): TrackPoint[] {
  let seed = 7, x = 0;
  const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648 - .5; };
  const out: TrackPoint[] = [], dt = 1 / FPS;
  for (let i = -72; i * dt <= 1.4; i++) {
    const t = i * dt;
    // The position: the speed integrated finely.
    if (i > -72) for (let k = 0; k < 20; k++) x += speed(t - dt + (k + .5) * dt / 20) * dt / 20;
    out.push({ t, x: 500 + x * PX + noise * rnd(), y: 700 - rise(t) * PX + noise * rnd() });
  }
  return out;
}
const contacts = CONTACTS.map(([touchdown, toeOff]) => ({ touchdown, toeOff }));

describe('ground reaction force from the video and the body mass', () => {
  it('gives the block push and each contact\'s mean forces from the hips\' speeds', () => {
    const r = groundForces({ mass: MASS, contacts, track: track(), pxPerM: PX, scaleSource: 'height', direction: 1, block: { moveStart: .0463, clearance: .36 } });
    const b = r.block!;
    // The push from its start (the move first seen 1 cm out, at 0.0463 s, traced back along √move): 0 s.
    expect(Math.abs(b.pushStart)).toBeLessThan(.005); expect(b.pushSeconds).toBeCloseTo(.36, 2);
    expect(b.exitSpeed).toBeCloseTo(3.36, 1); expect(b.exitRise).toBeCloseTo(.6, 1);
    expect(b.horizontal / (MASS * 3.36 / .36)).toBeCloseTo(1, 1);
    expect(b.vertical / (MASS * (G + .6 / .36))).toBeCloseTo(1, 1);
    expect(b.power).toBeCloseTo(3.36 ** 2 / 2 / .36, 0);
    expect(b.ratio).toBeCloseTo(b.horizontal / Math.hypot(b.horizontal, b.vertical), 5);
    // Each contact's gain (the step means untangled) and its mean forward force.
    const [s1, s2, s3, s4] = r.steps;
    expect(s1.gained!).toBeCloseTo(1.24, 1); expect(s2.gained!).toBeCloseTo(.88, 1); expect(s3.gained!).toBeCloseTo(.62, 1);
    expect(s1.horizontal! / (MASS * 1.24 / .195)).toBeCloseTo(1, 1);
    expect(s2.horizontal! / (MASS * .88 / .173)).toBeCloseTo(1, 1);
    // Vertical from the times alone: m·g·(flight ÷ contact + 1), its peak a half sine.
    expect(s1.vertical!).toBeCloseTo(MASS * G * (.05 / .195 + 1), 6); expect(s1.verticalPeak!).toBeCloseTo(s1.vertical! * Math.PI / 2, 6);
    expect(s1.angle!).toBeCloseTo(Math.atan2(s1.vertical!, s1.horizontal!) * 180 / Math.PI, 6);
    expect(s1.ratio!).toBeGreaterThan(s2.ratio!); expect(s2.ratio!).toBeGreaterThan(s3.ratio!);
    // The last contact: no next touchdown, so no flight and no step speed.
    expect(s4).toMatchObject({ vertical: null, horizontal: null, ratio: null });
  });
  it('is little moved by a pixel or two of noise in the hips', () => {
    // ±1.5 px on every frame (300 px a metre): the block's forward force within 5%, each gain within 0.1 m/s.
    const r = groundForces({ mass: MASS, contacts, track: track(3), pxPerM: PX, direction: 1, block: { moveStart: 0, clearance: .36 } });
    expect(Math.abs(r.block!.horizontal / (MASS * 3.36 / .36) - 1)).toBeLessThan(.05);
    [1.24, .88, .62].forEach((g, i) => { expect(Math.abs(r.steps[i].gained! - g)).toBeLessThan(.1); });
  });
  it('without a block gives no forward force to the first contact (no flight seen before it), and the next from their flights', () => {
    const r = groundForces({ mass: MASS, contacts, track: track(), pxPerM: PX, direction: 1 });
    expect(r.block).toBeNull(); expect(r.steps[0]).toMatchObject({ speedBefore: null, horizontal: null });
    expect(r.steps[0].vertical).not.toBeNull(); expect(r.steps[1].speedBefore!).toBeCloseTo(4.6, 1); expect(r.steps[1].gained!).toBeCloseTo(.88, 1);
  });
  it('on a run takes each step\'s mean speed, touchdown to touchdown, before and after the contact', () => {
    const r = groundForces({ mass: MASS, contacts, track: track(), pxPerM: PX, direction: 1, speeds: 'steps' });
    // Step means: 4.107 m/s (0.41-0.655) and 5.134 (0.655-0.878): the second contact's gain is their difference.
    expect(r.steps[0].horizontal).toBeNull(); expect(r.steps[1].speedBefore!).toBeCloseTo(4.107, 1); expect(r.steps[1].gained!).toBeCloseTo(1.03, 1);
    expect(r.steps[1].horizontal!).toBeCloseTo(MASS * r.steps[1].gained! / .173, 6);
    // Steady against noise: within 0.05 m/s at ±1.5 px.
    const noisy = groundForces({ mass: MASS, contacts, track: track(3), pxPerM: PX, direction: 1, speeds: 'steps' });
    expect(Math.abs(noisy.steps[1].gained! - r.steps[1].gained!)).toBeLessThan(.05); expect(Math.abs(noisy.steps[2].gained! - r.steps[2].gained!)).toBeLessThan(.05);
  });
  it('traces the push back to its start from the move first seen', () => {
    // Seen 1 cm out at 0.0463 s; the push began at 0.
    expect(Math.abs(pushStart(track(), .0463, 1)!)).toBeLessThan(.005);
    expect(Math.abs(pushStart(track(2), .0463, 1)!)).toBeLessThan(.02);
  });
  it('gives the vertical forces alone without a scale, and works running left', () => {
    const none = groundForces({ mass: MASS, contacts, track: track(), pxPerM: null, direction: 1, block: { moveStart: 0, clearance: .36 } });
    expect(none.scale).toBeNull(); expect(none.block).toBeNull();
    expect(none.steps[0].vertical).not.toBeNull(); expect(none.steps[0].horizontal).toBeNull();
    const left = track().map(h => ({ ...h, x: 2000 - h.x }));
    const r = groundForces({ mass: MASS, contacts, track: left, pxPerM: PX, direction: -1, block: { moveStart: 0, clearance: .36 } });
    expect(r.block!.exitSpeed).toBeCloseTo(3.36, 1); expect(r.steps[1].gained!).toBeCloseTo(.88, 1);
  });
  it('reads the hips from the poses and the scale from the trunk and the height', () => {
    // Every point of a pose at one place: the centre of mass there too.
    const pose = (x: number, y: number): CrouchPoint[] => Array.from({ length: 33 }, (_, k) => k === 11 || k === 12 ? { x: x / 1920, y: (y - 100) / 1080, visibility: .9 }
      : { x: x / 1920, y: y / 1080, visibility: .9 });
    const frames: CrouchFrame[] = Array.from({ length: 24 }, (_, i) => ({ frame: i, pts: i / FPS, pose: pose(600 + 10 * i, 500) }));
    const body = bodyTrack(frames, 1920, 1080);
    expect(body).toHaveLength(24); expect(body[3].x).toBeCloseTo(630, 6);
    // The trunk's share of the mass sits between the shoulders and the hips: above the other points.
    expect(body[3].y).toBeLessThan(500); expect(body[3].y).toBeGreaterThan(450);
    expect(positionAt(body, 5.5 / FPS)).toBeCloseTo(655, 3);
    // A frame without the head or trunk seen is left out.
    expect(bodyTrack([{ frame: 0, pts: 0, pose: pose(600, 500).map((q, k) => k === 7 ? { ...q, visibility: .1 } : q) }], 1920, 1080)).toEqual([]);
    // A trunk of 100 px and 1.60 m: 100 / 0.288 / 1.6 px a metre.
    expect(scaleFromHeight(frames, 1920, 1080, 1.6)).toBeCloseTo(100 / .288 / 1.6, 6);
    expect(scaleFromHeight(frames.slice(0, 5), 1920, 1080, 1.6)).toBeNull();
  });
});

describe('the studies the forces are set against', () => {
  it('works the forward forces out of the published speeds and times, and puts a value against the elite men\'s in words', async () => {
    const { FORCE_STUDY, against } = await import('../src/sprint10/ForceView');
    // Graham-Smith et al. 2020: elite men 3.36 m/s in 0.365 s → 0.94 body weights; juniors 3.16 in 0.412 → 0.78.
    expect(FORCE_STUDY.block.elite).toBeCloseTo(.938, 2); expect(FORCE_STUDY.block.junior).toBeCloseTo(.782, 2);
    expect(FORCE_STUDY.steps[0].elite).toBeCloseTo(.648, 2); expect(FORCE_STUDY.steps[1].elite).toBeCloseTo(.519, 2);
    expect(against(.98, .938)).toBe('一流男子並み'); expect(against(1.2, .938)).toBe('一流男子より大きい');
    expect(against(.7, .938)).toBe('一流男子よりやや小さい'); expect(against(.13, .648)).toBe('一流男子より小さい');
    expect(against(-.1, .648)).toBe('ブレーキの方が大きい');
  });
});
