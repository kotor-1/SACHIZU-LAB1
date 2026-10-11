import { describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { Contact } from '../src/sprint10/contacts';
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
    // ±1.5 px on every frame (300 px a metre): the flights' speeds fitted on every frame keep the block's forward force
    // within 2% and each gain within 0.03 m/s (each flight's own frames alone: 5% and 0.1 m/s).
    const r = groundForces({ mass: MASS, contacts, track: track(3), pxPerM: PX, direction: 1, block: { moveStart: 0, clearance: .36 } });
    expect(Math.abs(r.block!.horizontal / (MASS * 3.36 / .36) - 1)).toBeLessThan(.02);
    [1.24, .88, .62].forEach((g, i) => { expect(Math.abs(r.steps[i].gained! - g)).toBeLessThan(.03); });
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
  it('fits every flight\'s speed at once, steady when a touchdown or toe-off is a frame out', async () => {
    const { flightSpeeds } = await import('../src/sprint10/ground-force');
    const v = flightSpeeds(track(), .36, contacts.map(c => ({ touchdown: c.touchdown!, toeOff: c.toeOff! })))!.map(x => x / PX);
    [3.36, 4.60, 5.48, 6.10].forEach((s, i) => expect(v[i]).toBeCloseTo(s, 2));
    // A toe-off read a frame late: the gains move by under 0.05 m/s.
    const late = groundForces({ mass: MASS, contacts: contacts.map((c, i) => i === 1 ? { ...c, toeOff: c.toeOff! + 1 / FPS } : c), track: track(), pxPerM: PX, direction: 1, block: { moveStart: 0, clearance: .36 } });
    [1.24, .88, .62].forEach((g, i) => expect(Math.abs(late.steps[i].gained! - g)).toBeLessThan(.05));
    // Out of order, or no contact: nothing.
    expect(flightSpeeds(track(), .5, [{ touchdown: .41, toeOff: .605 }])).toBeNull(); expect(flightSpeeds(track(), .36, [])).toBeNull();
  });
  it('reads the flights\' speeds when each contact brakes first and pushes after, as on the user\'s starts', async () => {
    const { flightSpeeds } = await import('../src/sprint10/ground-force');
    // Each contact's forward force: braking (a fifth of the push's impulse) for its first quarter, then the push, both half
    // sines; the speed holds in the flights. Changing evenly through the contacts read these flights 0.2-0.3 m/s low.
    const share = (u: number) => {
      let acc = 0, total = 0;
      for (let i = 0; i < 400; i++) { const w = (i + .5) / 400, f = w < .25 ? -.2 * 3 * Math.sin(Math.PI * w / .25) : Math.sin(Math.PI * (w - .25) / .75); total += f; if (w <= u) acc += f; }
      return acc / total;
    };
    const braking = (t: number) => {
      let v = 3.36;
      for (const [td, to, after] of CONTACTS) { if (t < td) return v; if (t <= to) return v + (after - v) * share((t - td) / (to - td)); v = after; }
      return v;
    };
    const pts: TrackPoint[] = [];
    for (let i = 0, x = 0; i / FPS <= 1.3; i++) { for (let k = 0; i > 0 && k < 20; k++) x += braking((i - 1 + (k + .5) / 20) / FPS) / FPS / 20; pts.push({ t: i / FPS, x: 500 + x * PX, y: 0 }); }
    const v = flightSpeeds(pts.filter(p => p.t >= .36), .36, contacts.map(c => ({ touchdown: c.touchdown!, toeOff: c.toeOff! })))!.map(x => x / PX);
    [3.36, 4.60, 5.48, 6.10].forEach((s, i) => expect(Math.abs(v[i] - s)).toBeLessThan(.06));
  });
  it('traces the push back to its start from the move first seen', () => {
    // Seen 1 cm out at 0.0463 s; the push began at 0.
    expect(Math.abs(pushStart(track(), .0463, 1)!)).toBeLessThan(.005);
    expect(Math.abs(pushStart(track(2), .0463, 1)!)).toBeLessThan(.02);
    // Never more than 0.05 s before it (the iPhone's 0.465 s push on the user's start ran back 0.1 s).
    expect(pushStart(track(), .2, 1)!).toBeGreaterThanOrEqual(.15 - 1e-9);
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

describe('contact-period force display', () => {
  it('keeps the published mean forward-force references', async () => {
    const { FORCE_STUDY } = await import('../src/sprint10/ForceView');
    // Graham-Smith et al. 2020: elite men 3.36 m/s in 0.365 s → 0.94 body weights; juniors 3.16 in 0.412 → 0.78.
    expect(FORCE_STUDY.block.elite).toBeCloseTo(.938, 2); expect(FORCE_STUDY.block.junior).toBeCloseTo(.782, 2);
    expect(FORCE_STUDY.steps[0].elite).toBeCloseTo(.648, 2); expect(FORCE_STUDY.steps[1].elite).toBeCloseTo(.519, 2);
  });
  it('shows the same contact mean without claiming a force at a pictured instant', async () => {
    const { default: ForceView } = await import('../src/sprint10/ForceView');
    vi.stubGlobal('localStorage', { getItem: (key: string) => key === 'sachizu-body-weight' ? String(MASS) : null });
    try {
      const html = renderToStaticMarkup(createElement(ForceView, {
        kind: 'run', contacts: contacts as Contact[], frames: [], width: 1920, height: 1080, direction: 1, url: 'video.mov', pxPerM: PX,
      }));
      expect(html).toContain('接地から離地までの平均（動画から推定）');
      expect(html).toContain('接地中のどの瞬間に、どちらへ力を出したかは、この結果では判断できません。');
      expect(html).toContain('1.26倍'); // (0.05 / 0.195 + 1), unchanged from groundForces.
      expect(html).toContain('0.195秒');
      expect(html).not.toMatch(/<img|<canvas|写真の瞬間|真ん中|仮の目安|鉛直寄り|水平寄り|縦の最大/);
    } finally { vi.unstubAllGlobals(); }
  });
});
