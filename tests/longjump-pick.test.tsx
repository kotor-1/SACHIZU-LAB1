import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import type { CrouchFrame, CrouchPoint } from '../src/sprint10/crouch';
import { NEAR_SIDES, NEAR_SIZE, personAt, windowsAround } from '../src/sprint10/crouch-pick-poses';
import { MomentReview } from '../src/sprint10/MomentReview';
import type { ReviewMoment } from '../src/sprint10/moment-edits';
import { STAND_GUIDE, standAdvice } from '../src/longjump/advice';
import { lowestFoot, nextStand, standEffects, standEnough, standFlags, standFocus, standGuess, standHint, standLayout, standLeg, standResult, standSteps,
  standTime, STAND_STEPS } from '../src/longjump/stand-pick';
import { StandGuide } from '../src/longjump/StandPickGuide';

const W = 1920, H = 1080, FPS = 240;
const timeline = (n = 600): CrouchFrame[] => Array.from({ length: n }, (_, i) => ({ frame: i, pts: i / FPS, pose: null }));
/** A runner going right (direction +1) at hips (hx, hy) pixels: the leg on `side` 0 is the stance leg, its ankle `ahead`
 * pixels in front of the hips and 173 below (a 200 px leg at 60° when ahead = 100), the toe ahead of the heel; the other
 * leg behind (a touchdown, `ahead` > 0) or swung ahead (a toe-off). */
function runner(hx: number, hy: number, ahead: number, lean = -10): CrouchPoint[] {
  const p: CrouchPoint[] = Array.from({ length: 33 }, () => ({ x: hx / W, y: hy / H, visibility: 1 }));
  const at = (k: number, x: number, y: number) => { p[k] = { x: x / W, y: y / H, visibility: 1 }; };
  at(23, hx, hy); at(24, hx + 4, hy);
  at(11, hx + lean, hy - 250); at(12, hx + lean + 4, hy - 250); at(0, hx + lean + 20, hy - 320);
  at(13, hx + lean - 30, hy - 150); at(14, hx + lean + 30, hy - 160); at(15, hx + lean - 20, hy - 60); at(16, hx + lean + 50, hy - 80);
  const ax = hx + ahead, ay = hy + 173;
  at(25, (hx + ax) / 2 + 12, (hy + ay) / 2); at(27, ax, ay); at(29, ax - 15, ay + 8); at(31, ax + 30, ay + 10);
  const s = ahead >= 0 ? -1 : 1;
  at(26, hx + s * 40, hy + 90); at(28, hx + s * 120, hy + 120); at(30, hx + s * 120 - 15, hy + 125); at(32, hx + s * 120 + 25, hy + 128);
  return p;
}
/** The takeoff's touchdown and toe-off, at 240 fps. */
const PICKS = { td0: 300, to0: 335 };
function withPoses(picks: Record<string, number>) {
  const t = timeline();
  for (const [k, f] of Object.entries(picks)) {
    const down = k.startsWith('td'), x = 200 + f * 3;
    t[f] = { ...t[f], pose: runner(x, 600, down ? 100 : -100), refined: runner(x, 600, down ? 100 : -100) };
  }
  return t;
}

describe('the long jump from the stands: the moments', () => {
  it('sets only the takeoff\'s touchdown, then its toe-off', () => {
    expect(STAND_STEPS.map(s => s.key)).toEqual(['td0', 'to0']);
    expect(nextStand({})!.key).toBe('td0');
    expect(nextStand({ td0: 300 })!.key).toBe('to0');
    expect(nextStand({ td0: 300, to0: 335 })).toBeNull();
    expect(standSteps({ to0: 335 })).toEqual([]);
    expect(standEnough({ td0: 300 })).toBe(false);
    expect(standEnough({ td0: 300, to0: 335 })).toBe(true);
  });
  it('times the moments at the frames\' edges and guesses the toe-off from the touchdown', () => {
    const t = timeline();
    expect(standTime('td0', { td0: 300 }, t)).toBeCloseTo(299.5 / FPS, 6);
    expect(standTime('to0', { to0: 335 }, t)).toBeCloseTo(335.5 / FPS, 6);
    // 0.145 s after the touchdown: 299.5/240 + 0.145 s → the toe-off edge of frame 334.
    expect(standGuess('to0', { td0: 300 }, t)).toBe(334);
    expect(standGuess('td0', {}, t)).toBeNull();
    // Past the video's end: not in it.
    expect(standGuess('to0', { td0: 590 }, t)).toBeNull();
  });
  it('says the times out of the usual range at both their moments', () => {
    const flags = standFlags({ td0: 300, to0: 360 }, timeline());
    expect(flags.get('td0')).toContain('踏切の接地時間 0.254秒');
    expect(flags.get('to0')).toBe(flags.get('td0'));
    expect(standFlags({ td0: 300, to0: 335 }, timeline()).size).toBe(0);
  });
  it('lists what a frame would change', () => {
    const e = standEffects({ td0: 300, to0: 335 }, 'to0', 340, timeline());
    expect(e).toEqual([{ label: '踏切の接地時間', from: expect.closeTo(36 / FPS, 9), to: expect.closeTo(41 / FPS, 9), unit: '秒', digits: 3 }]);
    expect(standEffects({ td0: 300, to0: 335 }, 'td0', 298, timeline())[0].to).toBeCloseTo(38 / FPS, 9);
    expect(standEffects({}, 'td0', 300, timeline())).toEqual([]);
  });
});

describe('the long jump from the stands: the values', () => {
  it('gives the takeoff\'s contact and the posture at its touchdown as the analysis measures them', () => {
    const r = standResult(PICKS, withPoses(PICKS), W, H);
    expect(r.reason).toBeNull();
    expect(r.direction).toBe(1);
    expect(r.contacts.map(c => [c.touchdownFrame, c.toeOffFrame])).toEqual([[300, 335]]);
    expect(r.takeoff).toBe(0);
    expect(r.takeoffContact).toBeCloseTo(36 / FPS, 6);
    expect(r.steps).toEqual([]);
    expect(r.rhythm).toBeNull();
    expect(r.posture.legAngle).toBeCloseTo(Math.atan2(173, 100) * 180 / Math.PI, 1);
    expect(r.posture.trunk!).toBeLessThan(0);
    expect(r.posture.knee!).toBeGreaterThan(150);
    expect(r.posture.trunkPenult).toBeNull();
    expect(r.speed).toEqual({ lastTwoPx: null, touchdownPx: null });
    expect(r.leave).toBeNull();
    expect(r.moments.map(m => m.key)).toEqual(['takeoff']);
    expect(r.notes).toEqual([]);
  });
  it('waits for a frame not looked at yet, and says when the athlete was not found', () => {
    expect(standResult({ td0: 300 }, withPoses({ td0: 300 }), W, H).reason).toContain('選んでください');
    expect(standResult(PICKS, timeline(), W, H, new Set([300])).reason).toContain('調べています');
    expect(standResult(PICKS, timeline(), W, H).reason).toContain('見つけられませんでした');
    // The toe-off's pose is not needed for the values.
    expect(standResult(PICKS, withPoses({ td0: 300 }), W, H).takeoffContact).toBeCloseTo(36 / FPS, 6);
  });
  it('takes the leg from hips and ankles seen less surely when none is sure (a small athlete far away)', () => {
    const unsure = (p: CrouchPoint[]) => p.map((q, k) => [23, 24, 27, 28].includes(k) ? { ...q, visibility: .4 } : q);
    const t = timeline();
    for (const [k, f] of Object.entries(PICKS)) { const p = unsure(runner(200 + f * 3, 600, k === 'td0' ? 100 : -100)); t[f] = { ...t[f], pose: p, refined: p }; }
    expect(standLeg(t.filter(f => f.pose), W, H)).toBeCloseTo(200, 0);
    expect(standResult(PICKS, t, W, H).reason).toBeNull();
    expect(standLeg(withPoses(PICKS).filter(f => f.pose), W, H)).toBeCloseTo(200, 0);
  });
  it('tells the direction by the feet while a camera following the athlete keeps the hips still', () => {
    const t = timeline();
    for (const f of [300, 335]) t[f] = { ...t[f], pose: runner(900, 600, f === 300 ? 100 : -100), refined: runner(900, 600, f === 300 ? 100 : -100) };
    expect(standLayout({ td0: 300, to0: 335 }, t, W, H).direction).toBe(1);
  });
});

describe('the long jump from the stands: where the athlete is', () => {
  it('looks round the tap in squares of falling size, then round the athlete at its height', () => {
    const near = windowsAround({ x: .5, y: .5, size: null }, W, H);
    expect(near).toHaveLength(NEAR_SIDES.length + 2);
    expect(near[0].h).toBeCloseTo(NEAR_SIDES[0], 6);
    expect(near[0].w * W).toBeCloseTo(near[0].h * H, 3);
    expect(near.at(-1)).toEqual({ x: 0, y: 0, w: 1, h: 1 });
    const known = windowsAround({ x: .9, y: .2, size: .1, spread: .05 }, W, H);
    expect(known[0].h).toBeCloseTo(NEAR_SIZE * .1 + .05, 6);
    expect(known[0].x + known[0].w).toBeLessThanOrEqual(1);
    expect(windowsAround(null, W, H)).toEqual([{ x: 0, y: 0, w: 1, h: 1 }]);
  });
  it('takes the person whose body holds the point, not someone else in the window', () => {
    const athlete = runner(1000, 600, 100), official = runner(400, 650, 0);
    expect(personAt([official, athlete], { x: 1000 / W, y: 650 / H, size: null }, W, H)).toBe(athlete);
    expect(personAt([official], { x: 1000 / W, y: 650 / H, size: null }, W, H)).toBeNull();
  });
  it('takes the small athlete far away in front of a larger figure holding the same point, and none of another size', () => {
    const scale = (p: CrouchPoint[], k: number, cx: number, cy: number) => p.map(q => ({ ...q, x: (cx + (q.x * W - cx) * k) / W, y: (cy + (q.y * H - cy) * k) / H }));
    const big = scale(runner(960, 500, 100), 2.2, 960, 500), small = scale(runner(960, 760, 100), .4, 960, 760);
    expect(personAt([big, small], { x: 960 / W, y: 760 / H, size: null }, W, H)).toBe(small);
    const tall = (p: CrouchPoint[]) => (Math.max(...p.map(q => q.y)) - Math.min(...p.map(q => q.y)));
    expect(personAt([big], { x: 960 / W, y: 760 / H, size: tall(small) }, W, H)).toBeNull();
    expect(personAt([big, small], { x: 975 / W, y: 760 / H, size: tall(small) }, W, H)).toBe(small);
  });
  it('moves the hips on at their speed, else at the usual speed with the window widened', () => {
    const t = timeline();
    t[300] = { ...t[300], pose: runner(900, 600, 100), refined: runner(900, 600, 100) };
    const one = standLayout({ td0: 300 }, t, W, H);
    const back = standHint(250 / FPS, one, null, W, H)!;
    expect(back.x * W).toBeLessThan(902);
    expect(back.spread!).toBeGreaterThan(0);
    t[335] = { ...t[335], pose: runner(1040, 600, -100), refined: runner(1040, 600, -100) };
    const two = standHint(250 / FPS, standLayout({ td0: 300, to0: 335 }, t, W, H), null, W, H)!;
    expect(two.x * W).toBeCloseTo(902 + (1042 - 902) / 35 * -50, 0);
    expect(standHint(1, { leg: 0, direction: 0, size: null, hips: [], places: new Map() }, { x: .3, y: .4 }, W, H)).toEqual({ x: .3, y: .4, size: null });
  });
  it('enlarges round each moment\'s foot, else the takeoff foot found, else the tapped athlete\'s', () => {
    const t = withPoses(PICKS), layout = standLayout(PICKS, t, W, H);
    // Each moment's own foot: the landing toe ahead at the touchdown, the pushing toe behind at the toe-off.
    expect(standFocus('td0', layout, null, W, H).focus!.x * W).toBeCloseTo(200 + 300 * 3 + 100 + 30, 0);
    expect(standFocus('to0', layout, null, W, H).focus!.x * W).toBeCloseTo(200 + 335 * 3 - 100 + 30, 0);
    // The toe-off not looked at yet: the touchdown's foot on the board.
    const one = standLayout({ td0: 300 }, withPoses({ td0: 300 }), W, H);
    expect(standFocus('to0', one, null, W, H)).toEqual(standFocus('td0', one, null, W, H));
    const tapFoot = lowestFoot(runner(1000, 600, 100), W, H)!;
    expect(tapFoot.y).toBeCloseTo(600 + 173 + 10, 3);
    expect(standFocus('td0', { leg: 0, direction: 0, size: null, hips: [], places: new Map() }, tapFoot, W, H).focus).toEqual({ x: tapFoot.x / W, y: tapFoot.y / H });
  });
});

describe('the long jump from the stands: advice and screen', () => {
  it('says the takeoff\'s contact against the reference, the leg\'s angle with the slant, the trunk and the knee', () => {
    const r = standResult(PICKS, withPoses(PICKS), W, H);
    const a = standAdvice(r), contact = a.find(x => x.topic === '踏切の接地時間')!;
    expect(a.map(x => x.topic)).toEqual(['踏切の接地時間', '踏切で脚を着く角度', '上体', '踏切接地の膝']);
    expect(contact.level).toBe('good');
    expect(a.find(x => x.topic === '踏切で脚を着く角度')!.text).toContain('斜め30°で約63°');
    expect(a.find(x => x.topic === '上体')!.text).toMatch(/^踏切の接地で後ろへ \d+°/);
    expect(standAdvice({ ...r, takeoffContact: STAND_GUIDE.contact[1] + .05 }).find(x => x.topic === '踏切の接地時間')!.level).toBe('check');
    expect(a.map(x => x.text).join()).not.toMatch(/男子|女子|リズム/);
  });
  it('shows the tap first, then the sample of the moment', () => {
    expect(renderToStaticMarkup(<StandGuide m={{ kind: 'touchdown' }} tapping />)).toContain('跳ぶ選手をタップ');
    expect(renderToStaticMarkup(<StandGuide m={{ kind: 'touchdown' }} tapping={false} />)).toContain('踏切足が板に着いた最初のコマ');
    expect(renderToStaticMarkup(<StandGuide m={{ kind: 'toeOff' }} tapping={false} />)).toContain('踏切足のつま先が板に着いている最後のコマ');
  });
  it('takes taps on the picture only when asked', () => {
    const m: ReviewMoment = { key: 'td0', kind: 'touchdown', step: 0, label: '踏切の接地', short: '踏切接地', frame: 300, pts: 300 / FPS, autoFrame: 300, focus: null, ground: null, flag: null };
    const view = (onTap?: () => void) => renderToStaticMarkup(<MomentReview url="" frames={timeline()} width={W} height={H} list={[m]} edits={{}} checked={new Set()} at="td0"
      onAt={() => undefined} onSet={() => undefined} onRevert={() => undefined} onRevertAll={() => undefined} onDone={() => undefined} preview={() => []} down={() => null}
      pick={{ guide: () => null, guessed: () => false, upcoming: [], onTap }} />);
    expect(view(() => undefined)).toContain('crouch-review-view tappable');
    expect(view()).not.toContain('tappable');
  });
});
