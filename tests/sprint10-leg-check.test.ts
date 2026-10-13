import { describe, expect, it } from 'vitest';
import { footSound, mendFeet, mendRefinedFeet, MENDED_SCORE } from '../src/sprint10/leg-check';
import { toesOf } from '../src/sprint10/contacts';
import { sideNearest, stanceSide } from '../src/sprint10/angles';
import { analyzeCrouchStart, type CrouchFrame, type CrouchPoint } from '../src/sprint10/crouch';

// One frame side-on, running to the right, 1920x1080: the stance foot down at x 900-950 on the ground (y 815), the swing
// foot behind and up. Leg (hip to ankle) 230 px.
const W = 1920, H = 1080, LEG = 230;
type Leg = { knee: [number, number]; ankle: [number, number]; heel: [number, number]; toe: [number, number] };
const STANCE: Leg = { knee: [940, 680], ankle: [900, 790], heel: [880, 805], toe: [950, 815] };
const SWING: Leg = { knee: [820, 650], ankle: [700, 690], heel: [680, 680], toe: [690, 740] };
function pose(left: Leg, right: Leg): CrouchPoint[] {
  const p: CrouchPoint[] = Array.from({ length: 33 }, () => ({ x: 900 / W, y: 400 / H, visibility: .9 }));
  const put = (k: number, [x, y]: [number, number]) => { p[k] = { x: x / W, y: y / H, visibility: .9 }; };
  put(11, [960, 380]); put(12, [964, 382]); put(23, [900, 560]); put(24, [904, 562]);
  [left, right].forEach((leg, side) => { put(25 + side, leg.knee); put(27 + side, leg.ankle); put(29 + side, leg.heel); put(31 + side, leg.toe); });
  return p;
}
const px = (p: CrouchPoint) => [Math.round(p.x * W), Math.round(p.y * H)];

describe('RTMPose feet checked and mended (leg-check)', () => {
  it('leaves a pose whose feet can be feet as it is', () => {
    const p = pose(SWING, STANCE);
    expect(footSound(p, 0, W, H, LEG)).toBe(true); expect(footSound(p, 1, W, H, LEG)).toBe(true);
    expect(mendFeet(p, pose(STANCE, SWING), W, H, LEG)).toBe(p);
  });

  it('takes a stance toe gone behind (the swing foot\'s x, the ground\'s y) from MediaPipe\'s leg with the same knee and ankle', () => {
    // MediaPipe's labels are the other way round: its left leg is the stance leg.
    const rtm = pose(SWING, { ...STANCE, toe: [690, 812] }), mp = pose(STANCE, SWING);
    expect(footSound(rtm, 1, W, H, LEG)).toBe(false);
    const out = mendFeet(rtm, mp, W, H, LEG);
    expect(px(out[32])).toEqual([950, 815]); expect(out[32].visibility).toBe(MENDED_SCORE);
    expect(px(out[26])).toEqual(STANCE.knee); expect(px(out[28])).toEqual(STANCE.ankle); expect(px(out[30])).toEqual(STANCE.heel);
    for (const k of [25, 27, 29, 31]) expect(out[k]).toEqual(rtm[k]);
    expect(px(rtm[32])).toEqual([690, 812]);   // the pose given is not changed
  });

  it('takes the toe and heel together when both went behind (they hold together, the knee and ankle are MediaPipe\'s)', () => {
    const rtm = pose(SWING, { ...STANCE, heel: [705, 800], toe: [690, 812] }), mp = pose(SWING, STANCE);
    const out = mendFeet(rtm, mp, W, H, LEG);
    expect(px(out[30])).toEqual(STANCE.heel); expect(px(out[32])).toEqual(STANCE.toe); expect(px(out[28])).toEqual(STANCE.ankle);
  });

  it('takes an ankle put on the other leg when the heel and toe are MediaPipe\'s', () => {
    const rtm = pose({ ...SWING, ankle: [905, 785] }, STANCE), mp = pose(SWING, STANCE);
    const out = mendFeet(rtm, mp, W, H, LEG);
    expect(px(out[27])).toEqual(SWING.ankle); expect(px(out[25])).toEqual(SWING.knee);
  });

  it('keeps RTMPose\'s knee: MediaPipe\'s may fold between the legs in a crouched set', () => {
    const rtm = pose(SWING, { ...STANCE, toe: [690, 812] }), mp = pose(SWING, { ...STANCE, knee: [930, 700] });
    expect(px(mendFeet(rtm, mp, W, H, LEG)[26])).toEqual(STANCE.knee);
  });

  it('leaves the part out (not drawn, not used) without MediaPipe\'s leg to take it from', () => {
    const rtm = pose(SWING, { ...STANCE, toe: [690, 812] });
    const out = mendFeet(rtm, null, W, H, LEG);
    expect(out[32].visibility).toBe(0); expect(out[28].visibility).toBe(.9); expect(out[30].visibility).toBe(.9); expect(out[26].visibility).toBe(.9);
    // Put on its ankle: code reading positions whatever the score (the high jump's centre of mass) takes a place on the leg.
    expect(px(out[32])).toEqual(STANCE.ankle);
    // MediaPipe's own feet far from RTMPose's leg (wrong too) are not taken.
    const lost = pose({ ...SWING, ankle: [800, 720], heel: [780, 715], toe: [790, 760] }, { ...STANCE, knee: [700, 700], ankle: [760, 740], heel: [740, 735], toe: [750, 770] });
    expect(mendFeet(rtm, lost, W, H, LEG)[32].visibility).toBe(0);
  });

  it('leaves the whole foot out when none of it can be told right', () => {
    const rtm = pose(SWING, { ...STANCE, knee: [905, 760], heel: [690, 690], toe: [960, 815] });
    const out = mendFeet(rtm, null, W, H, LEG);
    expect([28, 30, 32].map(k => out[k].visibility)).toEqual([0, 0, 0]);
  });

  it('gives the contacts no point taken from MediaPipe: they stay on RTMPose\'s own toes', () => {
    const frame: CrouchFrame = { frame: 0, pts: 0, pose: pose(STANCE, SWING), refined: mendFeet(pose(SWING, { ...STANCE, toe: [690, 812] }), pose(STANCE, SWING), W, H, LEG) };
    expect(px(frame.refined![32])).toEqual(STANCE.toe);
    expect(toesOf([{ ...frame, pose: frame.refined! }], W, H).map(t => Math.round(t.x))).toEqual([SWING.toe[0]]);
  });

  it('mends every frame\'s RTMPose pose in place, MediaPipe\'s poses left as they are', () => {
    const frames: CrouchFrame[] = Array.from({ length: 30 }, (_, i) => ({ frame: i, pts: i / 240, pose: pose(STANCE, SWING), refined: pose(SWING, STANCE) }));
    frames[7].refined = pose(SWING, { ...STANCE, toe: [690, 812] });
    const before = JSON.stringify(frames.map(f => f.pose));
    expect(mendRefinedFeet(frames, W, H)).toBe(1);
    expect(px(frames[7].refined![32])).toEqual(STANCE.toe);
    expect(JSON.stringify(frames.map(f => f.pose))).toBe(before);
  });
});

describe('the stance leg at a contact', () => {
  it('is the side whose toe is at the contact\'s place on the ground, not the swing foot passing over it', () => {
    // Mid-contact: the swing foot passes above the stance foot, its toe nearer across the picture.
    const p = pose({ ...SWING, knee: [960, 640], ankle: [945, 735], heel: [925, 730], toe: [948, 770] }, { ...STANCE, toe: [920, 815] });
    expect(sideNearest(p, 950 / W, W)).toBe(0);
    expect(stanceSide(p, 950 / W, 815 / H, W, H)).toBe(1);
  });

  it('takes the heel, then the ankle, of a foot whose toe is not seen', () => {
    const p = pose(SWING, STANCE); p[32] = { ...p[32], visibility: 0 };
    expect(stanceSide(p, 950 / W, 815 / H, W, H)).toBe(1); expect(sideNearest(p, 950 / W, W)).toBe(1);
    p[30] = { ...p[30], visibility: 0 };
    expect(stanceSide(p, 950 / W, 815 / H, W, H)).toBe(1);
  });

  it('measures the shank on the stance leg when the stance toe went behind at a touchdown', () => {
    // A synthetic run: three contacts; RTMPose (refined) = MediaPipe, but at the 2nd touchdown its stance toe goes behind.
    const frames: CrouchFrame[] = [];
    const contacts = [[.76, .93, 700], [.98, 1.13, 950], [1.19, 1.33, 1230]];
    for (let frame = 0; frame / 240 <= 1.5; frame++) {
      const t = frame / 240, at = (side: number) => {
        const mine = [{ from: -1, to: side ? .7 : .55, x: side ? 480 : 400 }, ...contacts.filter((_, i) => i % 2 === side).map(([from, to, x]) => ({ from, to, x }))];
        const i = mine.findIndex(s => t >= s.from && t <= s.to);
        if (i >= 0) return { x: mine[i].x, y: 800 };
        const prev = [...mine].reverse().find(s => s.to < t), next = mine.find(s => s.from > t);
        if (!prev) return { x: mine[0].x, y: 800 };
        if (!next) return { x: prev.x + 1500 * (t - prev.to), y: 800 - 60 * Math.sqrt(Math.min(1, (t - prev.to) / .15)) };
        const s = (t - prev.to) / (next.from - prev.to);
        return { x: prev.x + (next.x - prev.x) * s, y: 800 - 60 * Math.sqrt(Math.sin(Math.PI * s)) };
      };
      const dt = Math.max(0, t - .5), toes = [at(0), at(1)];
      const hip = { x: Math.min(500 + 300 * dt + 900 * dt * dt, Math.max(500, (toes[0].x + toes[1].x) / 2 + 120)), y: Math.max(600, 650 - 200 * dt) };
      const lean = (t < .5 ? 110 : Math.max(45, 110 - 130 * dt)) * Math.PI / 180;
      const p: CrouchPoint[] = Array.from({ length: 33 }, () => ({ x: hip.x / W, y: (hip.y - 150) / H, visibility: .9 }));
      const put = (k: number, x: number, y: number) => { p[k] = { x: x / W, y: y / H, visibility: .9 }; };
      put(11, hip.x + 200 * Math.sin(lean), hip.y - 200 * Math.cos(lean)); put(12, hip.x + 204 * Math.sin(lean), hip.y - 198 * Math.cos(lean));
      put(23, hip.x, hip.y); put(24, hip.x + 4, hip.y + 2);
      toes.forEach((toe, side) => {
        const heel = { x: toe.x - 50, y: toe.y - 15 }, ankle = { x: heel.x + 10, y: heel.y - 25 };
        put(25 + side, (hip.x + ankle.x) / 2 + 35, (hip.y + ankle.y) / 2); put(27 + side, ankle.x, ankle.y); put(29 + side, heel.x, heel.y); put(31 + side, toe.x, toe.y);
      });
      frames.push({ frame, pts: t, pose: p, refined: p.map(q => ({ ...q })) });
    }
    const clean = analyzeCrouchStart(frames, { width: W, height: H }), td = clean.contacts[1].touchdownFrame!;
    const stance = clean.steps[1].side!, swing = 1 - stance, f = frames.find(q => q.frame === td)!;
    // The toe on the ground behind the swing foot: farther from the contact than the swing foot's toe.
    f.refined![31 + stance] = { ...f.refined![31 + stance], x: f.refined![31 + swing].x - 80 / W, visibility: .4 };
    const fooled = analyzeCrouchStart(frames, { width: W, height: H }).steps[1];
    expect(fooled.side).toBe(swing); expect(fooled.shankAngle).not.toBeCloseTo(clean.steps[1].shankAngle!, 0);
    mendRefinedFeet(frames, W, H);
    const mended = analyzeCrouchStart(frames, { width: W, height: H });
    expect(mended.steps[1].side).toBe(stance); expect(mended.steps[1].shankAngle).toBeCloseTo(clean.steps[1].shankAngle!, 5);
  });
});
