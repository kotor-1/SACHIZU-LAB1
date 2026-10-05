import { describe, expect, it } from 'vitest';
import { analyzeHurdle, centreOfMass } from '../src/hurdling/analysis';
import { hurdleAdvice } from '../src/hurdling/advice';
import { surveyDirection } from '../src/hurdling/recording';
import type { CrouchFrame, CrouchPoint } from '../src/sprint10/crouch';

// A synthetic hurdle clearance filmed from the side at 240 fps, 1920x1080, running
// to the right at 7 m/s; 200 px per metre; ground at y = 800 px; hurdle at x = 960.
// The body is rigid and left/right symmetric about the pelvis except for the feet,
// which are planted at each contact and otherwise carried by the body, so in the flight the centre
// of mass follows the pelvis's parabola exactly. Its peak is 0.30 m before the hurdle.
const W = 1920, H = 1080, GROUND = 800, SCALE = 200, SPEED = 7 * SCALE, G = 9.81 * SCALE;
const FLIGHT = [.50, .85] as const, PEAK_T = .64, PEAK_X = 960 - .30 * SCALE;
const hipX = (t: number) => PEAK_X + SPEED * (t - PEAK_T);
// Contacts [from, to] with the foot (0 left, 1 right) planted at the hip's place mid-contact.
const CONTACTS: [number, number, 0 | 1][] = [[.13, .27, 0], [.36, .50, 1], [.85, .97, 0], [1.05, 1.17, 1]];
function hipY(t: number) {
  const peak = 590;
  if (t >= FLIGHT[0] && t <= FLIGHT[1]) return peak + G / 2 * (t - PEAK_T) ** 2;
  return peak + G / 2 * (t < FLIGHT[0] ? FLIGHT[0] - PEAK_T : FLIGHT[1] - PEAK_T) ** 2;
}
function frames(until = 1.3): CrouchFrame[] {
  const out: CrouchFrame[] = [];
  for (let frame = 0; frame / 240 <= until; frame++) {
    const t = frame / 240, hx = hipX(t), hy = hipY(t);
    const pose: CrouchPoint[] = Array.from({ length: 33 }, () => ({ x: hx / W, y: (hy - 200) / H, visibility: .9 }));
    const put = (k: number, x: number, y: number) => { pose[k] = { x: x / W, y: y / H, visibility: .9 }; };
    put(0, hx, hy - 230); put(7, hx - 10, hy - 220); put(8, hx + 10, hy - 220);
    put(11, hx - 20, hy - 180); put(12, hx + 20, hy - 180); put(13, hx - 40, hy - 100); put(14, hx + 40, hy - 100);
    put(15, hx - 30, hy - 30); put(16, hx + 30, hy - 30); put(23, hx - 12, hy); put(24, hx + 12, hy);
    for (const side of [0, 1] as const) {
      const c = CONTACTS.find(([a, b, s]) => s === side && t >= a && t <= b);
      // Planted at the contact's place, else carried by the body (in the flight, symmetric).
      const toe = c ? { x: hipX((c[0] + c[1]) / 2) + 25, y: GROUND } : { x: hx + (side ? 90 : -90) + 25, y: hy + 160 };
      const ankle = { x: toe.x - 25, y: toe.y - 25 }, knee = { x: (hx + (side ? 12 : -12) + ankle.x) / 2 + 20, y: (hy + ankle.y) / 2 };
      put(25 + side, knee.x, knee.y); put(27 + side, ankle.x, ankle.y); put(29 + side, toe.x - 45, toe.y - 5); put(31 + side, toe.x, toe.y);
    }
    out.push({ frame, pts: t, pose, refined: pose });
  }
  return out;
}
const run = (f = frames(), hurdleX = 960 / W) => analyzeHurdle(f, { width: W, height: H, hurdleX });
// The body's centre of mass sits a little ahead of the pelvis (the feet and knees are drawn forward):
// its peak is this far before the hurdle (m).
const PEAK_FRAME = frames().find(f => Math.abs(f.pts - PEAK_T) < 1 / 480)!;
const PEAK_BEFORE = (960 - (PEAK_X + centreOfMass(PEAK_FRAME.pose!)!.x * W - hipX(PEAK_FRAME.pts))) / SCALE;

describe('hurdle clearance (side view)', () => {
  it('finds the step before, the takeoff, the landing and the step after, and times them', () => {
    const r = run();
    expect(r.reason).toBeNull();
    expect(r.direction).toBe(1);
    expect(r.contacts).toHaveLength(4);
    expect([r.approach, r.takeoff, r.landing, r.after]).toEqual([0, 1, 2, 3]);
    expect(r.times.takeoffContact).toBeCloseTo(.14, 1);
    expect(r.times.clearance!).toBeGreaterThan(.33); expect(r.times.clearance!).toBeLessThan(.37);
    expect(r.times.landingContact).toBeCloseTo(.12, 1);
    expect(r.crossing!.pts).toBeGreaterThan(PEAK_T);
  });
  it('places the centre of mass peak before the hurdle, with the scale from gravity', () => {
    const a = run().apex!;
    expect(a.pts).toBeCloseTo(PEAK_T, 2);
    expect(a.scale!).toBeCloseTo(SCALE, -1);
    expect(PEAK_BEFORE).toBeGreaterThan(.27); expect(PEAK_BEFORE).toBeLessThan(.30);
    expect(Math.abs(a.beforeM! - PEAK_BEFORE)).toBeLessThan(.005);
    expect(a.beforeSeconds!).toBeCloseTo(PEAK_BEFORE * SCALE / SPEED, 3);
  });
  it('gives the moments with their angles, legs chosen by place', () => {
    const r = run();
    expect(r.moments.map(m => m.key)).toEqual(['takeoff-td', 'takeoff-to', 'apex', 'crossing', 'landing']);
    const landing = r.moments.find(m => m.key === 'landing')!;
    expect(landing.marks.map(m => m.label)).toEqual(['体幹', 'リード膝', '脛']);
    // The landing leg is the left (0) one, planted at the landing contact.
    expect(landing.marks.find(m => m.label === 'リード膝')).toMatchObject({ side: 0 });
    const takeoff = r.moments.find(m => m.key === 'takeoff-to')!;
    expect(takeoff.marks.find(m => m.label === '踏切膝')).toMatchObject({ side: 1 });
    expect(takeoff.marks.find(m => m.label === 'リード大腿')).toMatchObject({ side: 0 });
  });
  it('says so when the athlete does not cross the hurdle line, or the contacts are not in the video', () => {
    expect(run(frames(), 1900 / W).reason).toContain('線を越える');
    const late = frames().filter(f => f.pts > .55);
    const r = run(late);
    expect(r.takeoff).toBeNull();
    expect(r.notes.join()).toContain('踏切の接地が映っていません');
    expect(r.apex).toBeNull();
  });
  it('compares the peak with the references', () => {
    const near = hurdleAdvice(run());
    expect(near[0]).toMatchObject({ topic: '重心最高点', level: 'good' });
    expect(near[0].text).toContain(`${Math.round(PEAK_BEFORE * 100)}cm 手前`);
    // Far before (the line moved 0.5 m on): flagged.
    expect(hurdleAdvice(run(frames(), (960 + .5 * SCALE) / W))[0]).toMatchObject({ level: 'check' });
    // After the hurdle: flagged.
    expect(hurdleAdvice(run(frames(), (960 - .5 * SCALE) / W))[0].text).toContain('先で最高点');
  });
  it('weighs the body as the CMJ model, the head at the ears or the nose', () => {
    const pose = frames()[0].pose!;
    const withEars = centreOfMass(pose)!, noEars = centreOfMass(pose.map((p, i) => i === 7 || i === 8 ? { ...p, visibility: 0 } : p))!;
    expect(withEars.x).toBeCloseTo(noEars.x, 3);
    expect(centreOfMass(pose.map((p, i) => i === 27 ? { ...p, visibility: 0 } : p))).toBeNull();
  });
});

describe('hurdle running direction', () => {
  it('follows the person who runs, not those standing', () => {
    const samples = Array.from({ length: 10 }, (_, i) => ({ pts: i * .06, people: [{ x: .9 - .05 * i, y: .6 }, { x: .3, y: .62 }, { x: .5 + .001 * i, y: .3 }] }));
    expect(surveyDirection(samples)).toBe(-1);
    expect(surveyDirection(samples.map(s => ({ ...s, people: s.people.map(p => ({ ...p, x: 1 - p.x })) })))).toBe(1);
    expect(surveyDirection(samples.map(s => ({ ...s, people: s.people.slice(1) })))).toBe(0);
  });
});

describe('hurdle screen', () => {
  it('asks for the hurdle line only, and analyses on request', async () => {
    const { renderToStaticMarkup } = await import('react-dom/server');
    const { createElement } = await import('react');
    const { default: HurdleLab } = await import('../src/hurdling/HurdleLab');
    const html = renderToStaticMarkup(createElement(HurdleLab));
    for (const text of ['ハードルの解析', '1　動画を選ぶ', '2　ハードルに線を合わせる', '3　解析する', 'HURDLE']) expect(html).toContain(text);
    for (const text of ['m/s', '歩幅']) expect(html).not.toContain(text);
  });
});
