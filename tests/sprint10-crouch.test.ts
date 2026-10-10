import { describe, expect, it } from 'vitest';
import { analyzeCrouchStart, MAX_STEPS, runStart, type CrouchFrame, type CrouchPoint } from '../src/sprint10/crouch';
import { crouchPhases, drawCrouchFigure, figureView, markText } from '../src/sprint10/crouch-figure';
import { frameInterval, insideFrame } from '../src/sprint10/CrouchViews';
import { crouchAdvice, GUIDE } from '../src/sprint10/crouch-advice';
import type { CrouchResult, StepResult } from '../src/sprint10/crouch';
import { applyEdits, effectsOf, footDown, moments } from '../src/sprint10/crouch-edit';
import { legLength } from '../src/sprint10/contacts';
import { PIXEL_SETTINGS, refineByPixels, regionsOf, type RegionPictures } from '../src/sprint10/crouch-pixels';
import { refineTargets } from '../src/sprint10/recording';

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
  it('takes the angles from a refined pose (RTMPose) and the contacts from the first pose', () => {
    const plain = analyzeCrouchStart(startFrames(), { width: W, height: H });
    // The refined shoulders 40 px lower: the trunk leans more; the toes are the same.
    const frames = startFrames().map(f => ({ ...f, refined: f.pose && f.pose.map((p, k) => k === 11 || k === 12 ? { ...p, y: p.y + 40 / H } : p) }));
    const refined = analyzeCrouchStart(frames, { width: W, height: H });
    expect(refined.contacts.map(c => [c.touchdown, c.toeOff])).toEqual(plain.contacts.map(c => [c.touchdown, c.toeOff]));
    expect(refined.blockClearance!.pts).toBe(plain.blockClearance!.pts);
    expect(refined.steps[0].trunkAngle!).toBeGreaterThan(plain.steps[0].trunkAngle! + 3);
    expect(refined.steps[0].shankAngle).toBeCloseTo(plain.steps[0].shankAngle!, 9);
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
  it('finds the set after the athlete walked in and settled (a long video)', () => {
    // 1.5 s before the start: walking in from x 100 (hip) with one step planted behind the blocks, then still in
    // the set from 1.14 s. Before, the set was taken from the video's first hips (the walk) and the walk was the onset.
    const plain = analyzeCrouchStart(startFrames(), { width: W, height: H }), lead = 1.5, walk: CrouchFrame[] = [];
    for (let frame = 0; frame / 240 < lead; frame++) {
      const t = frame / 240, hip = { x: Math.min(500, 100 + 350 * t), y: 650 }, settled = t >= 1.14;
      const pose: CrouchPoint[] = Array.from({ length: 33 }, () => ({ x: hip.x / W, y: (hip.y - 150) / H, visibility: .9 }));
      const put = (k: number, x: number, y: number) => { pose[k] = { x: x / W, y: y / H, visibility: .9 }; };
      const shoulder = { x: hip.x + 200 * Math.sin(110 * Math.PI / 180), y: hip.y - 200 * Math.cos(110 * Math.PI / 180) };
      put(11, shoulder.x, shoulder.y); put(12, shoulder.x + 4, shoulder.y + 2); put(23, hip.x, hip.y); put(24, hip.x + 4, hip.y + 2);
      const toes = settled ? [{ x: 400, y: GROUND - 10 }, { x: 480, y: GROUND - 10 }]
        : [t >= .3 && t <= .8 ? { x: 200, y: GROUND } : { x: hip.x - 40, y: GROUND - 40 }, { x: hip.x + 40, y: GROUND - 40 }];
      toes.forEach((toe, side) => {
        const heel = { x: toe.x - 50, y: toe.y - 15 }, ankle = { x: heel.x + 10, y: heel.y - 25 };
        put(25 + side, (hip.x + ankle.x) / 2 + 35, (hip.y + ankle.y) / 2); put(27 + side, ankle.x, ankle.y); put(29 + side, heel.x, heel.y); put(31 + side, toe.x, toe.y);
      });
      walk.push({ frame, pts: t, pose });
    }
    const shifted = startFrames().map(f => ({ ...f, frame: f.frame + walk.length, pts: f.pts + lead }));
    const r = analyzeCrouchStart([...walk, ...shifted], { width: W, height: H });
    expect(r.reason).toBeNull();
    expect(r.blockClearance!.pts - lead).toBeCloseTo(plain.blockClearance!.pts, 6);
    // within a frame: the walking poses' legs change the leg length every threshold is scaled by
    expect(r.contacts.length).toBe(plain.contacts.length);
    r.contacts.forEach((c, i) => expect(Math.abs(c.touchdown! - lead - plain.contacts[i].touchdown!)).toBeLessThanOrEqual(1 / 240 + 1e-9));
    expect(r.blocks!.front).toBeCloseTo(plain.blocks!.front, 6);
  });
  it('finds the set after a moment of someone seen and a gap (a long video)', () => {
    const plain = analyzeCrouchStart(startFrames(), { width: W, height: H }), lead = 2;
    const moment = startFrames({ until: .04 }).map(f => ({ ...f, pose: f.pose!.map(p => ({ ...p, x: p.x + .2 })) }));
    const shifted = startFrames().map(f => ({ ...f, frame: f.frame + 480, pts: f.pts + lead }));
    const r = analyzeCrouchStart([...moment, ...shifted], { width: W, height: H });
    expect(r.reason).toBeNull();
    expect(r.blockClearance!.pts - lead).toBeCloseTo(plain.blockClearance!.pts, 6);
    expect(r.contacts.length).toBe(plain.contacts.length);
  });
  it('finds when the run begins from a quick look (every 8th frame), for the window measured in full', () => {
    // the synthetic set until 0.5 s, the movement then: the window (1 s before, 3 s after) holds the set and the steps
    const quick = startFrames().filter(f => f.frame % 8 === 0), run = runStart(quick, W, H)!;
    // at or a little before the movement (0.5 s): the first frame from which the hip gets 2 leg lengths ahead in 0.8 s
    expect(run).toBeGreaterThan(0); expect(run).toBeLessThanOrEqual(.5);
    const window = startFrames().filter(f => f.pts >= run - 1 && f.pts <= run + 3);
    const whole = analyzeCrouchStart(startFrames(), { width: W, height: H }), part = analyzeCrouchStart(window, { width: W, height: H });
    expect(part.blockClearance!.pts).toBe(whole.blockClearance!.pts);
    expect(part.contacts.map(c => c.touchdown)).toEqual(whole.contacts.map(c => c.touchdown));
    expect(runStart(startFrames({ until: .45 }), W, H)).toBeNull();   // no run in the picture
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
function made({ front = 95, rear = 125, setTrunk = 110, flight = .05, contacts = [.18, .16, .14], flights = [.05, .08, null], shanks = [45, 38, 30], trunks = [50, 47, 45],
  gapsTd = [null, null, null], gapsTo = [null, null, null], trunksTo = [null, null, null] }:
  { front?: number | null; rear?: number | null; setTrunk?: number | null; flight?: number | null; contacts?: (number | null)[]; flights?: (number | null)[];
    shanks?: (number | null)[]; trunks?: (number | null)[]; gapsTd?: (number | null)[]; gapsTo?: (number | null)[]; trunksTo?: (number | null)[] } = {}): CrouchResult {
  const steps: StepResult[] = contacts.map((c, i) => ({ step: i + 1, contactSeconds: c, flightSeconds: flights[i] ?? null, stepSeconds: flights[i] != null && c != null ? c + flights[i]! : null,
    pitch: flights[i] != null && c != null ? 1 / (c + flights[i]!) : null, shankAngle: shanks[i] ?? null, trunkAngle: trunks[i] ?? null, side: (i % 2) as 0 | 1,
    thighGapTouchdown: gapsTd[i] ?? null, thighGapToeOff: gapsTo[i] ?? null, trunkToeOff: trunksTo[i] ?? null, sideToeOff: i === 0 ? 1 : null }));
  return { version: 'test', reason: null, direction: 1, blocks: null, contacts: [], steps, firstFlight: flight, notes: [], moveStart: null,
    set: { frame: 1, pts: .1, trunkAngle: setTrunk, frontKnee: front, rearKnee: rear, frontSide: 1 }, blockClearance: null };
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
  it('shows one graph at a time, and every step in one table', async () => {
    const { default: CrouchCharts, StepTable } = await import('../src/sprint10/CrouchCharts');
    const { renderToStaticMarkup } = await import('react-dom/server');
    const { createElement } = await import('react');
    const html = renderToStaticMarkup(createElement(CrouchCharts, { result: made() }));
    expect(html.match(/<figure/g)).toHaveLength(1);
    expect(html).toMatch(/aria-pressed="true"[^>]*>接地・滞空</);
    const table = renderToStaticMarkup(createElement(StepTable, { result: made({ contacts: [.18, null], flights: [.05, null], shanks: [40.4, 30], trunks: [50, null] }) }));
    expect(table.match(/<tr>/g)).toHaveLength(3);
    for (const text of ['1歩目', '0.180', '0.050', '40°', '2歩目', '—']) expect(table).toContain(text);
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

describe('crouch start: moments moved by the user', () => {
  const frames = startFrames(), auto = analyzeCrouchStart(frames, { width: W, height: H });
  it('changes nothing without edits', () => {
    expect(applyEdits(auto, {}, frames, W, H)).toBe(auto);
    const list = moments(auto, {}, auto, frames, W, H);
    expect(list.map(m => m.key)).toEqual(['clearance', 'td1', 'to1', 'td2', 'to2', 'td3', 'to3']);
    expect(list.every(m => m.frame === m.autoFrame && m.flag === null)).toBe(true);
  });
  it('takes the times and the angles from the frames chosen, and the values that use them change at once', () => {
    const td2 = auto.contacts[1].touchdownFrame!, r = applyEdits(auto, { td2: td2 + 3 }, frames, W, H);
    expect(r.contacts[1].touchdownFrame).toBe(td2 + 3); expect(r.contacts[1].touchdown).toBeCloseTo((td2 + 3) / 240, 9);
    expect(r.steps[1].contactSeconds! - auto.steps[1].contactSeconds!).toBeCloseTo(-3 / 240, 9);
    expect(r.steps[0].flightSeconds! - auto.steps[0].flightSeconds!).toBeCloseTo(3 / 240, 9);
    expect(r.steps[0].pitch).toBeCloseTo(1 / r.steps[0].stepSeconds!, 9);
    expect(r.steps[1].shankAngle).not.toBeNull();
    // the automatic result is left as it was
    expect(auto.contacts[1].touchdownFrame).toBe(td2);
    const m = moments(auto, { td2: td2 + 3 }, r, frames, W, H).find(q => q.key === 'td2')!;
    expect(m.frame).toBe(td2 + 3); expect(m.autoFrame).toBe(td2);
    expect(effectsOf(auto, r, m).map(e => e.label)).toEqual(['1歩目の後の滞空', '2歩目の接地時間']);
  });
  it('moves the block clearance: its posture and the time to the first touchdown', () => {
    const at = auto.blockClearance!.frame, r = applyEdits(auto, { clearance: at - 4 }, frames, W, H);
    expect(r.blockClearance!.frame).toBe(at - 4);
    expect(r.firstFlight! - auto.firstFlight!).toBeCloseTo(4 / 240, 9);
    expect(r.steps).toEqual(auto.steps);
  });
  it('flags times out of the usual range, and a video where the toe is not seen', () => {
    const td1 = auto.contacts[0].touchdownFrame!, to1 = auto.contacts[0].toeOffFrame!;
    // a contact of 10 frames (0.042 s) is too short for a first step
    const edits = { td1: to1 - 10 }, r = applyEdits(auto, edits, frames, W, H), list = moments(auto, edits, r, frames, W, H);
    expect(list.find(m => m.key === 'td1')!.flag).toBeTruthy();   // also late for the block (0.18 s): either message
    expect(list.find(m => m.key === 'to1')!.flag).toContain('接地時間');
    expect(list.find(m => m.key === 'td2')!.flag).toBeNull();
    // the toes faint around the second touchdown
    const td2 = auto.contacts[1].touchdownFrame!;
    const dim = frames.map(f => Math.abs(f.frame - td2) <= 3 ? { ...f, pose: f.pose!.map((p, k) => k === 31 || k === 32 ? { ...p, visibility: .2 } : p) } : f);
    expect(moments(auto, {}, auto, dim, W, H).find(m => m.key === 'td2')!.flag).toContain('足先');
    expect(td1).toBeLessThan(to1);
  });
  it('tells in each frame whether the foot is down, as the judgment sees it', () => {
    const leg = legLength(frames.filter(f => f.pose), W, H), m = moments(auto, {}, auto, frames, W, H).find(q => q.key === 'td2')!;
    const at = (n: number) => footDown(frames[n], m, W, H, leg);
    expect(at(m.autoFrame)).toBe(true); expect(at(m.autoFrame + 10)).toBe(true); expect(at(m.autoFrame - 10)).toBe(false);
  });
});

describe('crouch start: moments set again from the pictures round the feet', () => {
  const frames = startFrames(), auto = analyzeCrouchStart(frames, { width: W, height: H }), regions = regionsOf(auto, frames, W, H);
  // Pictures of each region: a grey, grainy track; a yellow shoe over the whole region while the foot is down (the truth,
  // a few frames off the pose's moments), and over the block region until the front foot leaves.
  let seed = 3; const grain = () => (seed = seed * 16807 % 2147483647) % 17 - 8;
  const truth = { bc: auto.blockClearance!.frame - 3, td: auto.contacts.map(c => c.touchdownFrame! + 2), to: auto.contacts.map(c => c.toeOffFrame! - 2) };
  const pictures = (shoe: [number, number, number]): RegionPictures => new Map(regions.map(q => {
    const down = (f: number) => q.key === 'bc' ? f <= truth.bc : f >= truth.td[+q.key.slice(1) - 1] && f <= truth.to[+q.key.slice(1) - 1];
    const byFrame = new Map<number, Uint8Array>();
    for (let f = q.from; f <= q.to; f++) {
      const px = new Uint8Array(q.w * q.h * 3);
      for (let i = 0; i < px.length; i += 3) { const [r, g, b] = down(f) ? shoe : [110, 118, 125]; px[i] = r + grain(); px[i + 1] = g + grain(); px[i + 2] = b + grain(); }
      byFrame.set(f, px);
    }
    return [q.key, byFrame];
  }));
  it('takes the pictures round each toe and the front foot only (a few kB each)', () => {
    expect(regions.map(q => q.key)).toEqual(['bc', 'c1', 'c2', 'c3']);
    for (const q of regions) { expect(q.w * q.h).toBeLessThan(80 * 60); expect(q.to - q.from).toBeLessThan(120); }
  });
  it('sets each moment where the shoe comes and goes in the pictures, and the values from them', () => {
    const { result: r, moments } = refineByPixels(auto, pictures([225, 205, 40]), regions, frames, W, H);
    expect(moments.every(m => m.fromPixels)).toBe(true);
    r.contacts.forEach((c, i) => {
      // the shoe first seen in truth.td: the share passes one half between it and the frame before
      expect(Math.abs(c.touchdown! * 240 - (truth.td[i] - .5))).toBeLessThan(.6);
      expect(Math.abs(c.toeOff! * 240 - (truth.to[i] + .5))).toBeLessThan(.6);
    });
    expect(r.steps[0].contactSeconds! - auto.steps[0].contactSeconds!).toBeCloseTo(-4 / 240, 1);
    expect(Math.abs(r.blockClearance!.frame - truth.bc)).toBeLessThanOrEqual(1);
    expect(r.firstFlight! - auto.firstFlight!).toBeGreaterThan(3 / 240);
  });
  it('takes the clearance when the tip of the shoe leaves the block, not when the heel rises', () => {
    // As in the videos: the pose's clearance early, the toe leaving 6 frames after it; the heel rising over the 10 frames
    // before (the forefoot's pixels turning bare from the back), the shoe's tip (its front 30%, lower 40%) on the block to the end.
    const q = regions.find(g => g.key === 'bc')!, leave = auto.blockClearance!.frame + 6;
    const at = (i: number) => { const x = (i / 3) % q.w, y = Math.floor(i / 3 / q.w); return x >= q.w * .7 && y >= q.h * .6 ? leave : leave - 10 + 10 * x / (q.w * .7); };
    const byFrame = new Map<number, Uint8Array>();
    for (let f = q.from; f <= q.to; f++) {
      const px = new Uint8Array(q.w * q.h * 3);
      for (let i = 0; i < px.length; i += 3) { const [r, g, b] = f <= at(i) ? [225, 205, 40] : [110, 118, 125]; px[i] = r + grain(); px[i + 1] = g + grain(); px[i + 2] = b + grain(); }
      byFrame.set(f, px);
    }
    const heelUp: RegionPictures = new Map([['bc', byFrame]]);
    const bcAt = () => refineByPixels(auto, heelUp, [q], frames, W, H).moments.find(m => m.key === 'clearance')!.frame!;
    const tip = bcAt();
    expect(Math.abs(tip - (leave + .5))).toBeLessThan(1);
    PIXEL_SETTINGS.BC_TIP = 0;   // the forefoot alone: earlier, as the heel rises
    try { expect(bcAt()).toBeLessThan(tip - 1); } finally { PIXEL_SETTINGS.BC_TIP = 1; }
  });
  it('gives the same values with RTMPose only where the angles are measured', () => {
    // RTMPose's points: MediaPipe's moved a little, differently in each frame (so any frame used for an angle shows)
    const refinedOf = (f: CrouchFrame) => f.pose!.map((p, k) => ({ ...p, x: p.x + .004 * Math.sin(f.frame * 1.7 + k), y: p.y + .004 * Math.cos(f.frame * 2.3 + k) }));
    const targets = refineTargets(auto, frames);
    const every = frames.map(f => f.pose ? { ...f, refined: refinedOf(f) } : f), some = frames.map(f => f.pose && targets.has(f.frame) ? { ...f, refined: refinedOf(f) } : f);
    // Fewer frames than all (this 1.5 s clip is nearly all moments: the set, the clearance, each touchdown, the first toe-off).
    expect(targets.size).toBeLessThan(frames.filter(f => f.pose).length * .65);
    const opts = { width: W, height: H }, fromEvery = analyzeCrouchStart(every, opts), fromSome = analyzeCrouchStart(some, opts);
    expect(fromSome).toEqual(fromEvery);
    // the angles are RTMPose's: at the set, the clearance and each touchdown
    expect(fromEvery.set!.trunkAngle).not.toBe(auto.set!.trunkAngle);
    expect(fromEvery.blockClearance!.trunkAngle).not.toBe(auto.blockClearance!.trunkAngle);
    expect(fromEvery.steps.map(t => t.shankAngle)).not.toEqual(auto.steps.map(t => t.shankAngle));
    // the moments moved by the pictures (the clearance at the shoe's tip), the angles at them
    const pics = pictures([225, 205, 40]);
    expect(refineByPixels(fromSome, pics, regions, some, W, H).result).toEqual(refineByPixels(fromEvery, pics, regions, every, W, H).result);
  });
  it('keeps the moments judged from the pose where the pictures do not tell the shoe from the ground', () => {
    const { result: r, moments } = refineByPixels(auto, pictures([111, 118, 124]), regions, frames, W, H);
    expect(moments.some(m => m.fromPixels)).toBe(false);
    expect(r.contacts.map(c => [c.touchdown, c.toeOff])).toEqual(auto.contacts.map(c => [c.touchdown, c.toeOff]));
    expect(refineByPixels(auto, new Map(), regions, frames, W, H).result.contacts).toEqual(auto.contacts);
  });
});

describe('crouch start against the studies', () => {
  it('measures the thighs\' separation at each touchdown and toe-off (the swing knee comes through during the contact)', async () => {
    const { stepsOf } = await import('../src/sprint10/crouch');
    // A body running to the right, thighs 200 px from a hip at (900, 500): the stance foot at x 960 on the ground.
    const rad = (d: number) => d * Math.PI / 180;
    const frame = (n: number, stance: number, swing: number): CrouchFrame => {
      const pose: CrouchPoint[] = Array.from({ length: 33 }, () => ({ x: 900 / W, y: 300 / H, visibility: .9 }));
      const put = (k: number, x: number, y: number) => { pose[k] = { x: x / W, y: y / H, visibility: .9 }; };
      const leg = (side: 0 | 1, thigh: number, toeX: number) => {
        const knee = { x: 900 + 200 * Math.sin(rad(thigh)), y: 500 + 200 * Math.cos(rad(thigh)) };
        put(23 + side, 900, 500); put(25 + side, knee.x, knee.y); put(27 + side, toeX - 30, 760); put(29 + side, toeX - 50, 790); put(31 + side, toeX, 800);
      };
      leg(1, stance, 960); leg(0, swing, 700);   // the swing toe well behind, off the contact's place
      return { frame: n, pts: n / 240, pose };
    };
    // At touchdown the stance thigh 30° forward and the swing thigh 20° back; at toe-off 30° back and 60° forward.
    const frames = [frame(10, 30, -20), frame(50, -30, 60)];
    const [s] = stepsOf([{ index: 1, x: 960, groundY: 800, touchdown: 10 / 240, toeOff: 50 / 240, touchdownFrame: 10, toeOffFrame: 50 }], frames, W, H, 1, 400);
    expect(s.thighGapTouchdown).toBeCloseTo(-50, 5); expect(s.thighGapToeOff).toBeCloseTo(90, 5);
  });
  it('sets each value against the studies with a verdict and sums up the good points and what to work on', async () => {
    const { crouchResearch } = await import('../src/sprint10/crouch-research');
    // The user's athlete (2026-10-10): set 111/107/129°, 0.058 s to the first touchdown, trunk 50/45/36°, shank 37/34/28°.
    const r = made({ front: 107, rear: 129, setTrunk: 111, flight: .058, contacts: [.2, .16, .14], trunks: [50, 45, 36], shanks: [37, 34, 28],
      gapsTd: [-38, -18, -11], gapsTo: [90, 85, null], trunksTo: [44, null, null] });
    const s = crouchResearch(r, 'female'), v = (key: string) => s.rows.find(row => row.key === key)!;
    // In the order of the movement, under its phase.
    expect(s.rows.map(row => row.key)).toEqual(['frontKnee', 'rearKnee', 'setTrunk', 'firstFlight', 'trunk1', 'shank1', 'gapTouchdown1', 'firstContact',
      'trunkToeOff1', 'gapToeOff1', 'shank2', 'gapTouchdown2', 'shank3', 'gapTouchdown3']);
    expect([...new Set(s.rows.map(row => row.group))]).toEqual(['構え', 'ブロック →1歩目', '1歩目 接地', '1歩目 離地', '2歩目 接地', '3歩目 接地']);
    expect(v('frontKnee')).toMatchObject({ verdict: 'improve', research: '91〜99°（女子の平均 約103°）', better: -1 });
    expect(v('frontKnee').text).toContain('女子の平均は約103°');
    expect(v('rearKnee').verdict).toBe('ok');
    // The app's own angles (from vertical, as the 姿勢 tab): the set trunk 111°, the studies' 24° below horizontal = 114°.
    expect(v('setTrunk')).toMatchObject({ verdict: 'ok', value: '111°' }); expect(v('setTrunk').text).toContain('肩が腰より21°低い');
    expect(v('firstFlight').verdict).toBe('top'); expect(v('firstContact').verdict).toBe('note');
    expect(v('trunk1')).toMatchObject({ verdict: 'top', value: '50°' });
    // The first shank: the trained sprinters' average, but 18° short of the world-class men.
    expect(v('shank1').verdict).toBe('improve'); expect(v('shank1').text).toContain('鍛えた選手の平均並みで、世界トップ男子より18°立っています');
    expect(v('shank2').verdict).toBe('top'); expect(v('shank3').verdict).toBe('top');
    expect(v('gapTouchdown1')).toMatchObject({ verdict: 'note', value: '後ろ38°' });
    expect(v('trunkToeOff1')).toMatchObject({ verdict: 'top', value: '44°' });
    expect(v('gapToeOff1')).toMatchObject({ verdict: 'ok', value: '前90°', better: 1 });
    expect([v('gapTouchdown2').value, v('gapTouchdown3').value]).toEqual(['後ろ18°', '後ろ11°']);
    expect(s.good).toEqual(['ブロック→1歩目の空中', '1歩目接地の体幹', '1歩目離地の体幹', '2歩目接地の脛', '3歩目接地の脛']);
    expect(s.improve).toEqual(['1歩目接地の脛', '構えの前膝']); expect(s.missing).toEqual([]);
    // Women's and men's studies where they differ.
    expect(v('firstContact').research).toContain('女子 0.225秒');
    const men = crouchResearch(r, 'male');
    expect(men.rows.find(row => row.key === 'firstContact')!.research).toContain('男子 0.210秒');
    expect(men.rows.find(row => row.key === 'frontKnee')!.research).toBe('91〜99°');
  });
  it('puts the studies\' strongest ties first, and tells what could not be measured instead of guessing', async () => {
    const { crouchResearch } = await import('../src/sprint10/crouch-research');
    const s = crouchResearch(made({ front: 112, shanks: [25, 15, 8], gapsTo: [70, null, null], flight: .1 }), 'female');
    expect(s.improve).toEqual(['1歩目離地のももの開き', '1歩目接地の脛', 'ブロック→1歩目の空中', '2歩目接地の脛', '3歩目接地の脛', '構えの前膝']);
    const none = crouchResearch(made({ contacts: [null, null, null] }), 'female');
    expect(none.missing).toEqual(['1歩目接地のももの開き', '1歩目の接地時間', '1歩目離地の体幹', '1歩目離地のももの開き', '2歩目接地のももの開き', '3歩目接地のももの開き']);
    expect(none.rows.find(row => row.key === 'gapToeOff1')).toMatchObject({ value: '—', verdict: 'none', num: null });
  });
  it('allows the measuring error before a value is called short of the best level', async () => {
    const { crouchResearch } = await import('../src/sprint10/crouch-research');
    const verdicts = (o: Parameters<typeof made>[0]) => Object.fromEntries(crouchResearch(made(o), 'female').rows.map(row => [row.key, row.verdict]));
    // The first flight: the top sprinters' 0.045 ± 0.025 s, then 0.01 s of error (it also reads about that much long).
    expect(verdicts({ flight: .07 }).firstFlight).toBe('top'); expect(verdicts({ flight: .08 }).firstFlight).toBe('ok');
    expect(verdicts({ flight: .09 }).firstFlight).toBe('improve');
    expect(verdicts({ shanks: [52, 30, 20] }).shank1).toBe('top'); expect(verdicts({ shanks: [48, 30, 20] }).shank1).toBe('ok');
    expect(verdicts({ shanks: [46, 30, 20] }).shank1).toBe('improve');
    expect(verdicts({ gapsTo: [95, null, null] }).gapToeOff1).toBe('top'); expect(verdicts({ gapsTo: [88, null, null] }).gapToeOff1).toBe('ok');
    expect(verdicts({ gapsTo: [86, null, null] }).gapToeOff1).toBe('improve');
    expect(verdicts({ front: 104 }).frontKnee).toBe('ok'); expect(verdicts({ front: 105 }).frontKnee).toBe('improve');
    // Judged as shown: 104.4° is shown, and judged, as 104°.
    expect(verdicts({ front: 104.4 }).frontKnee).toBe('ok');
    const quick = crouchResearch(made({ flight: .015 }), 'female').rows.find(row => row.key === 'firstFlight')!;
    expect(quick.verdict).toBe('top'); expect(quick.text).toContain('より短い値です');
    expect(crouchResearch(made({ shanks: [48, 30, 20] }), 'female').rows.find(row => row.key === 'shank1')!.text).toContain('差は誤差ほど');
    // The trunk: the studies disagree, so only the world-class value is marked.
    expect(verdicts({ trunks: [40, 47, 45] }).trunk1).toBe('note'); expect(verdicts({ trunksTo: [30, null, null] }).trunkToeOff1).toBe('note');
  });
  it('says in plain words what is good and what to work on, with how, and where each value is seen', async () => {
    const { crouchResearch, firstShown } = await import('../src/sprint10/crouch-research');
    const r = made({ front: 107, shanks: [37, 34, 28], gapsTo: [83, null, null] });
    r.contacts = [1, 2, 3].map(index => ({ index, x: 700 + 250 * index, groundY: 800, touchdown: .7 + .2 * index, toeOff: .85 + .2 * index,
      touchdownFrame: 168 + 48 * index, toeOffFrame: 204 + 48 * index }));
    const s = crouchResearch(r, 'female'), v = (key: string) => s.rows.find(row => row.key === key)!;
    expect(firstShown(s)).toBe('gapToeOff1');
    expect(v('gapToeOff1')).toMatchObject({ plain: '1歩目の離地で、後ろ足の膝をもっと前へ', cue: '地面を押し切るときに、反対の膝を素早く前へ引き出す',
      target: '世界トップ男子 前95〜109°', moment: { frame: 252, name: '1歩目の離地' }, figure: { kind: 'gap', side: 1 } });
    expect(v('shank1')).toMatchObject({ plain: '1歩目の接地で、脛をもっと前に倒す', target: '世界トップ男子 52〜58°', moment: { frame: 216, name: '1歩目の接地' }, figure: { kind: 'shank', side: 0 } });
    expect(v('frontKnee')).toMatchObject({ plain: '構えの前膝を、もう少し深く曲げる', target: '研究の範囲 91〜99°', moment: { frame: 1, name: '構え' }, figure: { kind: 'knee', side: 1 } });
    expect(v('rearKnee').figure).toEqual({ kind: 'knee', side: 0 });
    // The good points in words; the times have no picture; values with nothing to say have no words.
    expect(v('firstFlight')).toMatchObject({ plain: 'ブロックから1歩目まで、低く速く出られている', moment: null, figure: null, target: 'トップ選手 0.020〜0.070秒' });
    expect(v('firstContact').target).toBe('上位の女子 0.225秒・その下 0.166秒');
    expect(v('rearKnee').plain).toBeNull(); expect(v('gapTouchdown1').plain).toBeNull();
    // Nothing to work on: the first at the best level is shown.
    expect(firstShown(crouchResearch(made({ shanks: [55, 38, 30] }), 'female'))).toBe('firstFlight');
  });
  it('draws the studies\' range from the joint the angle is measured at, on the athlete\'s side and running direction', async () => {
    const { directionOf, targetSector } = await import('../src/sprint10/crouch-research-figure');
    const { crouchResearch } = await import('../src/sprint10/crouch-research');
    const rows = crouchResearch(made(), 'female').rows, row = (key: string) => rows.find(r => r.key === key)!;
    const pose: CrouchPoint[] = Array.from({ length: 33 }, () => ({ x: 0, y: 0, visibility: 0 }));
    const put = (k: number, x: number, y: number) => { pose[k] = { x, y, visibility: .9 }; };
    // Running right: hips at (500, 400), the front (right, 1) knee ahead and down, its shank back to the ankle; the rear thigh back.
    put(23, 500, 400); put(24, 500, 400); put(11, 700, 330); put(12, 700, 330);
    put(26, 560, 460); put(28, 520, 540); put(25, 440, 480); put(27, 400, 560);
    const to = (p: { x: number; y: number }) => p, deg = (a: number) => a * 180 / Math.PI;
    const unit = (a: number) => ({ x: Math.cos(a), y: Math.sin(a) });
    // The trunk: up and forward from the hips' middle, 48-54° from vertical.
    const trunk = targetSector(pose, to, { ...row('trunk1'), figure: { kind: 'trunk', side: null } }, 1)!;
    expect(trunk.vertex).toEqual({ x: 500, y: 400 }); expect(trunk.from).toBeCloseTo(directionOf(48, 1, false));
    expect(unit(trunk.from).x).toBeGreaterThan(0); expect(unit(trunk.from).y).toBeLessThan(0);
    // Running left, the same angles point left.
    expect(unit(targetSector(pose, to, { ...row('trunk1'), figure: { kind: 'trunk', side: null } }, -1)!.from).x).toBeLessThan(0);
    // The front knee: the shank turned 91-99° from the thigh, on the side of the athlete's shank (108° here, outside).
    const knee = targetSector(pose, to, { ...row('frontKnee'), figure: { kind: 'knee', side: 1 } }, 1)!;
    const thigh = Math.atan2(400 - 460, 500 - 560), shank = Math.atan2(540 - 460, 520 - 560);
    const off = (a: number, b: number) => Math.abs(deg(Math.atan2(Math.sin(a - b), Math.cos(a - b))));
    expect(off(knee.from, thigh)).toBeCloseTo(91); expect(off(knee.to, thigh)).toBeCloseTo(99); expect(off(shank, thigh)).toBeGreaterThan(99);
    // The thighs at the first toe-off: the swing thigh 95-109° ahead of the stance thigh (the left one, 0, hangs back 37°).
    const gap = targetSector(pose, to, { ...row('gapToeOff1'), figure: { kind: 'gap', side: 0 } }, 1)!;
    const stance = deg(Math.atan2(440 - 500, 480 - 400));
    expect(gap.from).toBeCloseTo(directionOf(stance + 95, 1, true)); expect(gap.to).toBeCloseTo(directionOf(stance + 109, 1, true));
    // Points not seen: nothing drawn.
    expect(targetSector(pose, to, { ...row('shank1'), figure: { kind: 'shank', side: null } }, 1)).toBeNull();
  });
  it('shows what is good and what to work on in words, one value on its picture, and every value folded away', async () => {
    const { crouchResearch } = await import('../src/sprint10/crouch-research');
    const { default: CrouchResearch } = await import('../src/sprint10/CrouchResearch');
    const { renderToStaticMarkup } = await import('react-dom/server');
    const { createElement } = await import('react');
    const summary = crouchResearch(made({ front: 107, shanks: [37, 34, 28], gapsTo: [83, null, null] }), 'female');
    const html = renderToStaticMarkup(createElement(CrouchResearch, { summary, sex: 'female', onSex: () => {}, url: '', frames: [], direction: 1 }));
    for (const text of ['良いところ', 'ブロックから1歩目まで、低く速く出られている', '直すところ（この順に）', '① 1歩目の離地で、後ろ足の膝をもっと前へ',
      'いま 前83° → 世界トップ男子 前95〜109°', 'コツ：地面を押し切るときに、反対の膝を素早く前へ引き出す', '② 1歩目の接地で、脛をもっと前に倒す',
      `全部の項目を見る（${summary.rows.length}）`, '伸びしろ', 'トップ並み', 'ふつう']) expect(html).toContain(text);
    // Words, not marks; no table.
    expect(html).not.toMatch(/[◎○△]/); expect(html).not.toContain('<table');
    expect(html.match(/class="cr-item /g)).toHaveLength(summary.rows.length);
  });
});
