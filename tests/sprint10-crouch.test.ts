import { describe, expect, it } from 'vitest';
import { analyzeCrouchStart, MAX_STEPS, type CrouchFrame, type CrouchPoint } from '../src/sprint10/crouch';
import { crouchPhases, drawCrouchFigure, figureView, markText } from '../src/sprint10/crouch-figure';
import { frameInterval, insideFrame } from '../src/sprint10/CrouchViews';
import { crouchAdvice, GUIDE } from '../src/sprint10/crouch-advice';
import type { CrouchResult, StepResult } from '../src/sprint10/crouch';

// A synthetic crouch start filmed from the side at 240 fps, 1920x1080, running to the right.
// Leg length about 240 px; ground at y = 800 px. Set until 0.5 s; the rear foot (left landmarks)
// leaves its block at 0.55 s, the front foot (right) at 0.70 s; contacts alternate from the rear foot.
const W = 1920, H = 1080, GROUND = 800;
type Stance = { from: number; to: number; x: number; y?: number };
function startFrames({ until = 1.5, contacts = [[.76, .93, 700], [.98, 1.13, 950], [1.19, 1.33, 1230]], swapEvery = 0, set = true }:
  { until?: number; contacts?: number[][]; swapEvery?: number; set?: boolean } = {}): CrouchFrame[] {
  const left: Stance[] = [{ from: -1, to: .55, x: 400, y: GROUND - 10 }], right: Stance[] = [{ from: -1, to: .70, x: 480, y: GROUND - 10 }];
  contacts.forEach(([from, to, x], i) => (i % 2 ? right : left).push({ from, to, x }));
  const foot = (stances: Stance[], t: number) => {
    const i = stances.findIndex(s => t >= s.from && t <= s.to);
    if (i >= 0) return { x: stances[i].x, y: stances[i].y ?? GROUND };
    const prev = [...stances].reverse().find(s => s.to < t), next = stances.find(s => s.from > t);
    if (!prev) return { x: stances[0].x, y: GROUND };
    if (!next) { const dt = t - prev.to; return { x: prev.x + 1500 * dt, y: GROUND - 60 * Math.sqrt(Math.min(1, dt / .15)) }; }
    const s = (t - prev.to) / (next.from - prev.to);
    // The foot leaves and meets the ground steeply, as a toe point does.
    return { x: prev.x + (next.x - prev.x) * s, y: GROUND - 60 * Math.sqrt(Math.sin(Math.PI * s)) };
  };
  const frames: CrouchFrame[] = [];
  for (let frame = 0; frame / 240 <= until; frame++) {
    const t = frame / 240 + (set ? 0 : .6), dt = Math.max(0, t - .5);
    const toes = [foot(left, t), foot(right, t)];
    // The hip moves first and stays above the feet (at most 120 px ahead of their middle).
    const hip = { x: Math.min(500 + 300 * dt + 900 * dt * dt, Math.max(500, (toes[0].x + toes[1].x) / 2 + 120)), y: Math.max(600, 650 - 200 * dt) };
    const lean = (t < .5 ? 110 : Math.max(45, 110 - 130 * dt)) * Math.PI / 180;
    const shoulder = { x: hip.x + 200 * Math.sin(lean), y: hip.y - 200 * Math.cos(lean) };
    const pose: CrouchPoint[] = Array.from({ length: 33 }, () => ({ x: hip.x / W, y: (hip.y - 150) / H, visibility: .9 }));
    const put = (k: number, x: number, y: number) => { pose[k] = { x: x / W, y: y / H, visibility: .9 }; };
    put(11, shoulder.x, shoulder.y); put(12, shoulder.x + 4, shoulder.y + 2); put(23, hip.x, hip.y); put(24, hip.x + 4, hip.y + 2);
    toes.forEach((toe, side) => {
      const heel = { x: toe.x - 50, y: toe.y - 15 }, ankle = { x: heel.x + 10, y: heel.y - 25 };
      const knee = { x: (hip.x + ankle.x) / 2 + 35, y: (hip.y + ankle.y) / 2 };
      put(25 + side, knee.x, knee.y); put(27 + side, ankle.x, ankle.y); put(29 + side, heel.x, heel.y); put(31 + side, toe.x, toe.y);
    });
    // Side views swap the pose model's left and right labels.
    if (swapEvery && Math.floor(frame / swapEvery) % 2) for (const k of [25, 27, 29, 31]) [pose[k], pose[k + 1]] = [pose[k + 1], pose[k]];
    frames.push({ frame, pts: frame / 240, pose });
  }
  return frames;
}

describe('crouch start (side view)', () => {
  it('finds the front block clearance and each contact with its touchdown and toe-off', () => {
    const r = analyzeCrouchStart(startFrames(), { width: W, height: H });
    expect(r.reason).toBeNull(); expect(r.direction).toBe(1);
    expect(r.blocks!.front * W).toBeCloseTo(480, -1); expect(r.blocks!.rear! * W).toBeCloseTo(400, -1);
    expect(r.blockClearance!.pts).toBeGreaterThan(.69); expect(r.blockClearance!.pts).toBeLessThan(.73);
    expect(r.contacts.map(c => Math.round(c.x))).toEqual([700, 950, 1230]);
    const truth = [[.76, .93], [.98, 1.13], [1.19, 1.33]];
    r.contacts.forEach((c, i) => {
      expect(Math.abs(c.touchdown! - truth[i][0])).toBeLessThan(.015);
      expect(Math.abs(c.toeOff! - truth[i][1])).toBeLessThan(.015);
    });
    expect(r.steps.map(s => s.step)).toEqual([1, 2, 3]);
    expect(r.steps[0].stepSeconds).toBeCloseTo(.22, 1); expect(r.steps[0].pitch).toBeCloseTo(1 / .22, 0);
    expect(r.steps[2].flightSeconds).toBeNull();     // no touchdown after the last contact
    expect(r.firstFlight).toBeCloseTo(.76 - .70, 1);
    expect(r.set!.trunkAngle).toBeCloseTo(110, -1); expect(r.steps[0].shankAngle).not.toBeNull();
    // Motion only: no distance or speed in the result.
    expect(JSON.stringify(r)).not.toMatch(/length|speed|distance|meters|scale/i);
  });
  it('does not depend on the left/right labels of the pose model', () => {
    const plain = analyzeCrouchStart(startFrames(), { width: W, height: H });
    const swapped = analyzeCrouchStart(startFrames({ swapEvery: 7 }), { width: W, height: H });
    expect(swapped.contacts.map(c => [c.touchdown, c.toeOff])).toEqual(plain.contacts.map(c => [c.touchdown, c.toeOff]));
    expect(swapped.blockClearance!.pts).toBe(plain.blockClearance!.pts);
  });
  it('gives no contact time for a contact whose toe-off is not in the video', () => {
    const r = analyzeCrouchStart(startFrames({ until: 1.28 }), { width: W, height: H });
    expect(r.contacts).toHaveLength(3); expect(r.contacts[2].toeOff).toBeNull(); expect(r.steps[2].contactSeconds).toBeNull();
    expect(r.notes.some(n => n.includes('3歩目は離地が映っていない'))).toBe(true);
  });
  it(`reports at most ${MAX_STEPS} steps`, () => {
    const contacts = Array.from({ length: 7 }, (_, i) => [.76 + .22 * i, .76 + .22 * i + .15, 650 + 180 * i]);
    const r = analyzeCrouchStart(startFrames({ until: 2.4, contacts }), { width: W, height: H });
    expect(r.contacts).toHaveLength(MAX_STEPS);
  });
  it('says so when the set position is not in the video', () => {
    expect(analyzeCrouchStart(startFrames({ set: false }), { width: W, height: H }).reason).toContain('構え');
  });
});

describe('crouch start pictures', () => {
  it('lists the set, the block clearance and each touchdown with the angles measured there', () => {
    const r = analyzeCrouchStart(startFrames(), { width: W, height: H }), phases = crouchPhases(r);
    expect(phases.map(p => p.label)).toEqual(['構え', 'ブロックを離れる瞬間', '1歩目の接地', '2歩目の接地', '3歩目の接地']);
    const given = (pairs: [string, number | null][]) => pairs.filter(([, v]) => v !== null).map(([label]) => label);
    expect(phases[0].marks.map(m => m.label)).toEqual(given([['体幹', r.set!.trunkAngle], ['前膝', r.set!.frontKnee], ['後膝', r.set!.rearKnee]]));
    expect(phases[1].marks.map(m => m.label)).toEqual(given([['体幹', r.blockClearance!.trunkAngle], ['前膝', r.blockClearance!.frontKnee]]));
    expect(phases[1].marks.length).toBeGreaterThan(0);
    expect(phases[2].marks.map(markText)).toEqual([`脛 ${Math.round(r.steps[0].shankAngle!)}°`, `体幹 ${Math.round(r.steps[0].trunkAngle!)}°`]);
    expect(phases[2].frame).toBe(r.contacts[0].touchdownFrame); expect(phases[2].pts).toBe(r.contacts[0].touchdown);
    // The set's frame is one of the set frames, and the front knee is the front block's leg (the right landmarks here).
    expect(r.set!.pts).toBeLessThan(.5); expect(r.set!.frontSide).toBe(1);
    for (const m of phases[0].marks) if (m.kind === 'knee') expect(m.side).toBe(m.label === '前膝' ? 1 : 0);
    // The first contact is made by the rear foot (left landmarks).
    expect(r.steps[0].side).toBe(0);
  });
  it('cuts the picture around the athlete at the asked shape, inside the frame', () => {
    const pose = startFrames()[0].pose!, v = figureView(pose, W, H, 4 / 3);
    expect(v.w / v.h).toBeCloseTo(4 / 3, 6);
    expect(v.x).toBeGreaterThanOrEqual(0); expect(v.y).toBeGreaterThanOrEqual(0);
    expect(v.x + v.w).toBeLessThanOrEqual(W + 1e-9); expect(v.y + v.h).toBeLessThanOrEqual(H + 1e-9);
    for (const k of [11, 23, 27, 31]) { expect(pose[k].x * W).toBeGreaterThan(v.x); expect(pose[k].x * W).toBeLessThan(v.x + v.w); }
  });
  it('draws an arc for every angle, and its value only when asked', () => {
    const r = analyzeCrouchStart(startFrames(), { width: W, height: H }), touchdown = crouchPhases(r)[2];
    expect(touchdown.marks.length).toBe(2);
    const pose = startFrames().find(f => f.frame === touchdown.frame)!.pose!;
    const calls: string[] = [], texts: string[] = [];
    const ctx = new Proxy({ canvas: { width: 640, height: 480 }, measureText: (t: string) => ({ width: t.length * 10 }), fillText: (t: string) => texts.push(t) } as Record<string, unknown>, {
      get: (target, key: string) => key in target ? target[key] : (...args: unknown[]) => { calls.push(key); return args; },
      set: (target, key: string, value) => { target[key] = value; return true; },
    }) as unknown as CanvasRenderingContext2D;
    drawCrouchFigure(ctx, pose, p => ({ x: p.x * 640, y: p.y * 480 }), touchdown.marks, 10, true);
    expect(texts).toEqual(touchdown.marks.map(markText));
    texts.length = 0; calls.length = 0;
    drawCrouchFigure(ctx, pose, p => ({ x: p.x * 640, y: p.y * 480 }), touchdown.marks, 10, false);
    expect(texts).toEqual([]);
    // Joint dots and the arcs: one arc per mark beyond the dots.
    const dots = new Set([11, 12, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 13, 14, 15, 16]).size;
    expect(calls.filter(c => c === 'arc').length).toBe(dots + touchdown.marks.length);
  });
  it('steps the replay frame by frame, inside each frame', () => {
    const frames = startFrames();
    expect(frameInterval(frames)).toBeCloseTo(1 / 240, 9);
    expect(insideFrame(.5, 1 / 240)).toBeGreaterThan(.5); expect(insideFrame(.5, 1 / 240)).toBeLessThan(.5 + 1 / 240);
  });
});

// A result with chosen values, for the advice and the graphs.
function made({ front = 95, rear = 125, flight = .05, contacts = [.18, .16, .14], flights = [.05, .08, null], shanks = [45, 38, 30], trunks = [50, 47, 45] }:
  { front?: number | null; rear?: number | null; flight?: number | null; contacts?: (number | null)[]; flights?: (number | null)[];
    shanks?: (number | null)[]; trunks?: (number | null)[] } = {}): CrouchResult {
  const steps: StepResult[] = contacts.map((c, i) => ({ step: i + 1, contactSeconds: c, flightSeconds: flights[i] ?? null, stepSeconds: flights[i] != null && c != null ? c + flights[i]! : null,
    pitch: flights[i] != null && c != null ? 1 / (c + flights[i]!) : null, shankAngle: shanks[i] ?? null, trunkAngle: trunks[i] ?? null, side: (i % 2) as 0 | 1 }));
  return { version: 'test', reason: null, direction: 1, blocks: null, contacts: [], steps, firstFlight: flight, notes: [],
    set: { frame: 1, pts: .1, trunkAngle: 110, frontKnee: front, rearKnee: rear, frontSide: 1 }, blockClearance: null };
}
describe('crouch start advice', () => {
  it('says where values sit against the general guides', () => {
    const good = crouchAdvice(made());
    expect(good.every(a => a.level === 'good')).toBe(true);
    expect(good.map(a => a.topic)).toEqual(['構え', '構え', 'ブロックから1歩目', '1歩目', '接地時間', '滞空時間', '脛', '体幹']);
    expect(good[0].text).toContain(`目安${GUIDE.frontKnee[0]}〜${GUIDE.frontKnee[1]}°の範囲`);
    const off = crouchAdvice(made({ front: 75, rear: 150, flight: .09 }));
    expect(off.slice(0, 3).map(a => a.level)).toEqual(['check', 'check', 'check']);
    expect(off[0].text).toContain('深く曲がって'); expect(off[1].text).toContain('伸びて'); expect(off[2].text).toContain('長め');
    // Just outside the range but within the error: near, not a warning.
    const near = crouchAdvice(made({ front: 103 }))[0];
    expect(near.level).toBe('good'); expect(near.text).toContain('近い値');
  });
  it('flags steps against the usual trend, beyond the error', () => {
    const r = crouchAdvice(made({ contacts: [.18, .16, .19], flights: [.07, .04, null], shanks: [40, 46, -5], trunks: [50, 38, 45] }));
    const of = (topic: string) => r.filter(a => a.topic === topic);
    expect(of('接地時間')[0]).toMatchObject({ level: 'check' }); expect(of('接地時間')[0].text).toContain('3歩目');
    expect(of('滞空時間')[0]).toMatchObject({ level: 'check' }); expect(of('滞空時間')[0].text).toContain('2歩目');
    expect(of('脛').map(a => a.level)).toEqual(['check', 'check']);
    expect(of('脛')[1].text).toContain('3歩目'); expect(of('脛')[1].text).toContain('後ろへ傾いた');
    expect(of('体幹')[0].text).toContain('2歩目：体幹が急に起きて'); expect(of('体幹')[0].text).toContain('3歩目：体幹が前の歩より前に倒れて');
    // Small differences (within the error) are not flagged.
    const calm = crouchAdvice(made({ contacts: [.18, .17, .18], flights: [.06, .045, null], shanks: [40, 42, 30], trunks: [50, 42, 46] }));
    expect(calm.filter(a => a.topic !== '構え').every(a => a.level === 'good')).toBe(true);
  });
  it('draws a graph of each step quantity, with round ticks around the values', async () => {
    const { ticks, default: CrouchCharts } = await import('../src/sprint10/CrouchCharts');
    expect(ticks(32, 49).at(-1)).toBeGreaterThanOrEqual(49); expect(ticks(32, 49)[0]).toBeLessThanOrEqual(32);
    const same = ticks(4.44, 4.44); expect(same[0]).toBeLessThan(4.44); expect(same.at(-1)).toBeGreaterThan(4.44);
    const { renderToStaticMarkup } = await import('react-dom/server');
    const { createElement } = await import('react');
    const html = renderToStaticMarkup(createElement(CrouchCharts, { result: made() }));
    for (const text of ['接地時間・滞空時間', 'ピッチ', '接地時の角度', 'トップ選手の例（接地）', '1歩目 0.180']) expect(html).toContain(text);
    expect(renderToStaticMarkup(createElement(CrouchCharts, { result: made({ contacts: [.18], flights: [null], shanks: [40], trunks: [50] }) }))).toContain('2歩以上');
  });
});

describe('crouch start screen', () => {
  it('asks for the start line only, and analyses on request', async () => {
    const { renderToStaticMarkup } = await import('react-dom/server');
    const { createElement } = await import('react');
    const { default: CrouchLab } = await import('../src/sprint10/CrouchLab');
    const html = renderToStaticMarkup(createElement(CrouchLab));
    for (const text of ['1　動画を選ぶ', '2　スタートラインを合わせる', '3　解析する', `${MAX_STEPS}歩目`]) expect(html).toContain(text);
    for (const text of ['目印', '歩幅', 'm/s']) expect(html).not.toContain(text);
  });
});
