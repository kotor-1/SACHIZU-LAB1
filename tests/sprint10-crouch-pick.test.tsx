import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { analyzeCrouchStart, frameEdge, type CrouchFrame, type CrouchPoint } from '../src/sprint10/crouch';
import { legLength } from '../src/sprint10/contacts';
import { clearanceFramesOf, FIRST_STEP_LEGS, focusOf, frameAtEdge, framesFor, framesToLook, GUESS, guessFrame, hipGuess, layoutOf, nextPick,
  pickedEnough, pickedResult, pickedSteps, pickEffects, pickLeg, pickTime, PICK_STEPS, setFramesOf, withMendedFeet, type Picks } from '../src/sprint10/crouch-pick';
import { nearestAthlete } from '../src/sprint10/crouch-pick-poses';
import { PickGuide, PICK_TEXT } from '../src/sprint10/CrouchPickGuide';
import { MomentReview } from '../src/sprint10/MomentReview';
import type { ReviewMoment } from '../src/sprint10/moment-edits';
import ForceView from '../src/sprint10/ForceView';

// A synthetic crouch start from the side at 240 fps, 1920x1080, running right (as tests/sprint10-crouch.test.ts): the
// set until 0.5 s, the rear foot (left landmarks) off its block at 0.55 s, the front foot (right) at 0.70 s; three
// contacts from the rear foot. Leg length about 240 px, the ground at y = 800 px.
const W = 1920, H = 1080, GROUND = 800;
type Stance = { from: number; to: number; x: number; y?: number };
function startFrames(contacts = [[.76, .93, 700], [.98, 1.13, 950], [1.19, 1.33, 1230]], until = 1.5): CrouchFrame[] {
  const left: Stance[] = [{ from: -1, to: .55, x: 400, y: GROUND - 10 }], right: Stance[] = [{ from: -1, to: .70, x: 480, y: GROUND - 10 }];
  contacts.forEach(([from, to, x], i) => (i % 2 ? right : left).push({ from, to, x }));
  const foot = (stances: Stance[], t: number) => {
    const i = stances.findIndex(s => t >= s.from && t <= s.to);
    if (i >= 0) return { x: stances[i].x, y: stances[i].y ?? GROUND };
    const prev = [...stances].reverse().find(s => s.to < t), next = stances.find(s => s.from > t);
    if (!prev) return { x: stances[0].x, y: GROUND };
    if (!next) { const dt = t - prev.to; return { x: prev.x + 1500 * dt, y: GROUND - 60 * Math.sqrt(Math.min(1, dt / .15)) }; }
    const s = (t - prev.to) / (next.from - prev.to);
    return { x: prev.x + (next.x - prev.x) * s, y: GROUND - 60 * Math.sqrt(Math.sin(Math.PI * s)) };
  };
  const frames: CrouchFrame[] = [];
  for (let frame = 0; frame / 240 <= until; frame++) {
    const t = frame / 240, dt = Math.max(0, t - .5), toes = [foot(left, t), foot(right, t)];
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
    frames.push({ frame, pts: frame / 240, pose });
  }
  return frames;
}
/** The analysis' own moments as picks, and the frames with poses only where the light mode looks. */
function asPicked(frames: CrouchFrame[]) {
  const auto = analyzeCrouchStart(frames, { width: W, height: H });
  const picks: Record<string, number> = { set: auto.set!.frame, clearance: auto.blockClearance!.frame };
  for (const c of auto.contacts) { if (c.touchdownFrame != null) picks[`td${c.index}`] = c.touchdownFrame; if (c.toeOffFrame != null) picks[`to${c.index}`] = c.toeOffFrame; }
  const look = new Set(framesToLook(picks, frames));
  const sparse = frames.map(f => look.has(f.frame) ? f : { frame: f.frame, pts: f.pts, pose: null });
  return { auto, picks, sparse, look };
}

describe('crouch start, moments set by hand (light mode)', () => {
  it('sets the moments in order: the set, the clearance, then each touchdown and toe-off', () => {
    expect(PICK_STEPS.map(s => s.key).slice(0, 6)).toEqual(['set', 'clearance', 'td1', 'to1', 'td2', 'to2']);
    expect(PICK_STEPS).toHaveLength(12);
    expect(nextPick({})!.key).toBe('set'); expect(nextPick({ set: 10, clearance: 20 })!.key).toBe('td1');
    expect(pickedSteps({ set: 10, td1: 30 }).map(s => s.key)).toEqual(['set']);
    expect(pickedEnough({ set: 1, clearance: 2 })).toBe(false); expect(pickedEnough({ set: 1, clearance: 2, td1: 3 })).toBe(true);
  });

  it('puts a moment at its frame\'s edge and finds the frame from an edge, nothing outside the video', () => {
    const frames = startFrames();
    expect(pickTime('td1', { td1: 100 }, frames)).toBeCloseTo(99.5 / 240, 9);
    expect(pickTime('to1', { to1: 100 }, frames)).toBeCloseTo(100.5 / 240, 9);
    expect(pickTime('clearance', { clearance: 100 }, frames)).toBe(frameEdge(frames, 100, 1));
    for (const f of [5, 100, 300]) { expect(frameAtEdge(frames, frameEdge(frames, f, -1)!, -1)).toBe(f); expect(frameAtEdge(frames, frameEdge(frames, f, 1)!, 1)).toBe(f); }
    expect(frameAtEdge(frames, 10, 1)).toBeNull(); expect(frameAtEdge(frames, -1, -1)).toBeNull();
  });

  it('guesses each touchdown and toe-off from the moments before it, none for the set and the clearance', () => {
    const frames = startFrames(), e = (f: number, side: -1 | 1) => frameEdge(frames, f, side)!;
    expect(guessFrame('set', {}, frames)).toBeNull(); expect(guessFrame('clearance', { set: 50 }, frames)).toBeNull();
    const picks: Record<string, number> = { set: 50, clearance: 168 };
    expect(guessFrame('td1', picks, frames)).toBe(frameAtEdge(frames, e(168, 1) + GUESS.firstFlight, -1));
    picks.td1 = 183;
    expect(guessFrame('to1', picks, frames)).toBe(frameAtEdge(frames, e(183, -1) + GUESS.firstContact, 1));
    picks.to1 = 223;
    expect(guessFrame('td2', picks, frames)).toBe(frameAtEdge(frames, e(223, 1) + GUESS.flight, -1));
    picks.td2 = 236;
    // later contacts shrink from the one before, later flights repeat it
    expect(guessFrame('to2', picks, frames)).toBe(frameAtEdge(frames, e(236, -1) + GUESS.shrink * (e(223, 1) - e(183, -1)), 1));
    picks.to2 = 271;
    expect(guessFrame('td3', picks, frames)).toBe(frameAtEdge(frames, e(271, 1) + (e(236, -1) - e(223, 1)), -1));
    // past the end of the video: not in it
    expect(guessFrame('td3', { ...picks, to2: frames.at(-1)!.frame }, frames)).toBeNull();
  });

  it('looks at each moment\'s frame, four more before the set 0.04 s apart, two either side of the clearance', () => {
    const frames = startFrames();
    expect(setFramesOf(100, frames)).toEqual([100, 90, 80, 70, 60]);
    expect(setFramesOf(15, frames)).toEqual([15, 5]);
    expect(clearanceFramesOf(168, frames)).toEqual([166, 167, 168, 169, 170]);
    expect(framesFor('clearance', 168, frames)[0]).toBe(168);
    expect(framesFor('td1', 183, frames)).toEqual([183]);
    expect(framesToLook({ set: 100, clearance: 168, td1: 183 }, frames)).toEqual([100, 90, 80, 70, 60, 168, 166, 167, 169, 170, 183]);
  });

  it('gives the analysis\' values for the same frames, with poses only at the frames looked at', () => {
    const frames = startFrames(), { auto, picks, sparse, look } = asPicked(frames);
    expect(look.size).toBeLessThan(25);
    const r = pickedResult(picks, withMendedFeet(sparse, W, H), W, H);
    expect(r.reason).toBeNull(); expect(r.direction).toBe(1);
    expect(r.contacts.map(c => [c.touchdownFrame, c.toeOffFrame])).toEqual(auto.contacts.map(c => [c.touchdownFrame, c.toeOffFrame]));
    expect(r.firstFlight).toBeCloseTo(auto.firstFlight!, 9);
    r.steps.forEach((s, i) => {
      const a = auto.steps[i];
      expect(s.contactSeconds).toBeCloseTo(a.contactSeconds!, 9);
      if (a.flightSeconds !== null) expect(s.flightSeconds).toBeCloseTo(a.flightSeconds, 9);
      expect(s.shankAngle).toBeCloseTo(a.shankAngle!, 6); expect(s.trunkAngle).toBeCloseTo(a.trunkAngle!, 6);
    });
    expect(r.blockClearance!.trunkAngle).toBeCloseTo(auto.blockClearance!.trunkAngle!, 6);
    expect(r.blockClearance!.frontKnee).toBeCloseTo(auto.blockClearance!.frontKnee!, 6);
    expect(Math.abs(r.set!.trunkAngle! - auto.set!.trunkAngle!)).toBeLessThan(3);
    expect(r.blocks!.front * W).toBeCloseTo(auto.blocks!.front * W, -1);
    expect(r.moveStart).toBeNull();
  });

  it('measures the leg from the few frames at their 80th percentile, near the analysis\' leg', () => {
    const frames = startFrames(), { sparse } = asPicked(frames);
    const all = legLength(frames.filter(f => f.pose), W, H), few = pickLeg(sparse, W, H);
    expect(Math.abs(few / all - 1)).toBeLessThan(.1);
  });

  it('says what is missing: too few moments, no athlete in the set, a toe-off not set', () => {
    const frames = startFrames(), { picks, sparse } = asPicked(frames);
    expect(pickedResult({ set: picks.set, clearance: picks.clearance }, sparse, W, H).reason).toContain('1歩目の接地まで');
    const noSet = sparse.map(f => f.frame === picks.set ? { ...f, pose: null } : f);
    expect(pickedResult(picks, noSet, W, H).reason).toContain('構えのコマで選手を見つけられませんでした');
    const noOff = { ...picks }; delete noOff.to3;
    const r = pickedResult(noOff, sparse, W, H);
    expect(r.steps[2].contactSeconds).toBeNull(); expect(r.notes.join()).toContain('3歩目は離地を選んでいない');
    const noTd2 = sparse.map(f => f.frame === picks.td2 ? { ...f, pose: null } : f), lost = pickedResult(picks, noTd2, W, H);
    expect(lost.steps[1].shankAngle).toBeNull(); expect(lost.steps[1].contactSeconds).not.toBeNull();
    expect(lost.notes.join()).toContain('2歩目の接地のコマでは選手を見つけられなかった');
    // a frame the models have not looked at yet: its angle waits, nothing said missing
    const waiting = pickedResult(picks, noTd2, W, H, new Set(), new Set([picks.td2]));
    expect(waiting.steps[1].shankAngle).toBeNull(); expect(waiting.notes.join()).not.toContain('見つけられなかった');
    expect(pickedResult(picks, noSet, W, H, new Set(), new Set([picks.set])).reason).toBe('構えのコマの骨格を調べています。');
  });

  it('zooms on the front block for the clearance, a step ahead for the next touchdown, the place once found', () => {
    const frames = startFrames(), { picks, sparse } = asPicked(frames);
    const early: Picks = { set: picks.set, clearance: picks.clearance };
    const layout = layoutOf(early, sparse, W, H);
    expect(layout.direction).toBe(1); expect(layout.front!.x).toBeCloseTo(480, -1); expect(layout.rear!.x).toBeCloseTo(400, -1);
    expect(focusOf('set', layout, W, H).focus).toBeNull();
    expect(focusOf('clearance', layout, W, H).focus!.x * W).toBeCloseTo(480, -1);
    expect(focusOf('td1', layout, W, H).focus!.x * W).toBeCloseTo(480 + FIRST_STEP_LEGS * layout.leg, 0);
    expect(focusOf('td1', layout, W, H).ground).toBeNull();
    const later = layoutOf(picks, sparse, W, H);
    expect(later.places.get(1)!.x).toBeCloseTo(700, -1);
    expect(focusOf('to1', later, W, H).focus!.x * W).toBeCloseTo(700, -1); expect(focusOf('to1', later, W, H).ground! * H).toBeCloseTo(800, -1);
    // the hips looked for a little behind the foot at a touchdown, ahead of it at the toe-off
    expect(hipGuess('td1', later, W, H)! * W).toBeLessThan(700); expect(hipGuess('to1', later, W, H)! * W).toBeGreaterThan(700);
  });

  it('tells the times a frame would set before it is decided', () => {
    const frames = startFrames(), picks: Picks = { set: 50, clearance: 168, td1: 183 };
    const fx = pickEffects(picks, 'to1', 223, frames);
    expect(fx.map(e => e.label)).toEqual(['1歩目の接地時間']);
    expect(fx[0].from).toBeNull(); expect(fx[0].to).toBeCloseTo((223.5 - 182.5) / 240, 9);
    expect(pickEffects(picks, 'td1', 185, frames)[0]).toMatchObject({ label: 'ブロック→1歩目の接地' });
  });

  it('takes the person whose hips are nearest where the athlete should be', () => {
    const person = (x: number) => Array.from({ length: 33 }, () => ({ x, y: .5, visibility: .9 }));
    expect(nearestAthlete([person(.2), person(.6)], .55)![23].x).toBe(.6);
    expect(nearestAthlete([person(.2), person(.6)], null)![23].x).toBe(.2);
    expect(nearestAthlete([], .5)).toBeNull();
  });
});

describe('crouch start light mode on screen', () => {
  const frames: CrouchFrame[] = Array.from({ length: 400 }, (_, i) => ({ frame: i, pts: i / 240, pose: null }));
  const m = (key: string, kind: ReviewMoment['kind'], frame: number, step: number | null = null): ReviewMoment =>
    ({ key, kind, step, label: key, short: key, frame, pts: frame / 240, autoFrame: frame, focus: null, ground: null, flag: null });
  const list = [m('set', 'set', 50), m('clearance', 'clearance', 168), m('td1', 'touchdown', 183, 1)];
  const review = (pick: boolean) => renderToStaticMarkup(<MomentReview url="blob:test" frames={frames} width={W} height={H} list={list} edits={{}}
    checked={new Set(['set', 'clearance'])} at="td1" onAt={() => undefined} onSet={() => undefined} onRevert={() => undefined} onRevertAll={() => undefined}
    onDone={() => undefined} preview={() => []} down={() => null}
    pick={pick ? { guide: x => <PickGuide m={x} />, guessed: x => x.key === 'td1', upcoming: [{ key: 'to1', short: '1離地' }] } : undefined} />);

  it('sets a moment with the check\'s controls, the guess named, a slider and slow play, the sample shown', () => {
    const html = review(true);
    expect(html).toContain('予測したコマ'); expect(html).toContain('選んだ瞬間'); expect(html).toContain('（選んだ）');
    expect(html).toContain('動画のコマの位置'); expect(html).toContain('スロー再生');
    expect(html).toContain(PICK_TEXT.touchdown.title); expect(html).toContain('見本：');
    expect(html).toMatch(/class="upcoming"[^>]*disabled/); expect(html).toContain('このコマに決める');
    expect(html).not.toContain('自動の判定に戻す'); expect(html).not.toContain('確認 <b>');
  });

  it('leaves the check of the judged moments as it was', () => {
    const html = review(false);
    expect(html).toContain('自動の判定'); expect(html).not.toContain('動画のコマの位置'); expect(html).not.toContain('予測');
  });

  it('gives only the vertical force when the body is not followed through every frame', () => {
    const html = renderToStaticMarkup(<ForceView kind="crouch" contacts={[]} frames={[]} width={W} height={H} direction={1} verticalOnly />);
    expect(html).not.toContain('身長'); expect(html).not.toContain('ブロックと1歩ごと');
  });
});
