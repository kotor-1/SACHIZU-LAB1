import { describe, expect, it } from 'vitest';
import { calibrate, focalPixels, makeCamera, type UprightPoints, type Vec } from '../src/highjump/camera';
import { analyzeHighJump, SPACING } from '../src/highjump/analysis';
import { highJumpAdvice } from '../src/highjump/advice';
import { firstRunner } from '../src/highjump/recording';
import type { CrouchFrame, CrouchPoint } from '../src/sprint10/crouch';

// A synthetic scissors jump filmed by a level phone in front of the bar, at a slant to it, side-on to the last
// steps (as つばき's video): uprights 4.05 m apart, bar 1.20 m; the camera 1.1 m high, 6.5 m in front.
const W = 1920, H = 1080, F = focalPixels(W, H), BAR = 1.2, SPACE = 4.05, G = 9.81;
const C: Vec = [-.5, -6.5, 1.1];
const TAKEOFF: Vec = [3.2, -.8, 0];
// The camera looks at the takeoff spot, pitched up 0.5°.
const look = Math.atan2(TAKEOFF[1] - C[1], TAKEOFF[0] - C[0]), cam = makeCamera(look, .5 * Math.PI / 180, C, F, W / 2, H / 2);
const px = (P: Vec) => { const [x, y] = cam.project(P); return { x: x / W, y: y / H }; };
const UPRIGHTS: UprightPoints = { left: { foot: px([0, 0, 0]), bar: px([0, 0, BAR - .015]) }, right: { foot: px([SPACE, 0, 0]), bar: px([SPACE, 0, BAR - .015]) } };
// The last steps run across the picture (perpendicular to the line of sight to the takeoff), right to left.
const sight = [TAKEOFF[0] - C[0], TAKEOFF[1] - C[1]], norm = Math.hypot(sight[0], sight[1]);
const U: Vec = [sight[1] / norm, -sight[0] / norm, 0];
const along = (s: number, z: number, side = 0): Vec => [TAKEOFF[0] + U[0] * s - U[1] * side, TAKEOFF[1] + U[1] * s + U[0] * side, z];
// Timeline (s): touchdowns and toe-offs of the last three contacts; the takeoff ends at TO; then the flight.
const SPEED = 5, UP = 3, TO = .62;
const CONTACTS: [number, number][] = [[.12, .25], [.36, .5], [.47 + .0, TO]];
CONTACTS[2] = [.555, TO];
const HIP = .9, T_PEAK = TO + UP / G;
const sAt = (t: number) => SPEED * (t - .555) - .35;   // the pelvis passes over the takeoff foot mid-contact
function hipZ(t: number) { return t <= TO ? HIP + (t > .555 ? (t - .555) / (TO - .555) * .15 : 0) : HIP + .15 + UP * (t - TO) - G / 2 * (t - TO) ** 2; }
function frames(): CrouchFrame[] {
  const out: CrouchFrame[] = [];
  for (let frame = 0; frame / 240 <= 1; frame++) {
    const t = frame / 240, s = t <= TO ? sAt(t) : sAt(TO) + 3.2 * (t - TO), z = hipZ(t);
    const pose: CrouchPoint[] = Array.from({ length: 33 }, () => ({ ...px(along(s, z + .5)), visibility: .9 }));
    const put = (k: number, ds: number, dz: number) => { pose[k] = { ...px(along(s + ds, z + dz)), visibility: .9 }; };
    put(0, .05, .75); put(11, .02, .5); put(12, -.02, .5); put(13, .1, .3); put(14, -.1, .3); put(15, .15, .15); put(16, -.15, .15);
    put(23, .02, 0); put(24, -.02, 0);
    CONTACTS.forEach(([a, b], i) => {
      const side = i % 2 as 0 | 1, onGround = t >= a && t <= b;
      // Planted at the contact's place (the pelvis's place mid-contact), else carried by the body.
      const foot = onGround ? sAt((a + b) / 2) : null;
      if (onGround || !CONTACTS.some(([c, d], j) => j % 2 === side && t >= c && t <= d)) {
        const toe: Vec = foot !== null ? along(foot + .12, 0) : along(s + (side ? -.25 : .25), Math.max(.3, z - .55));
        const ankle: Vec = [toe[0] - U[0] * .12, toe[1] - U[1] * .12, toe[2] + .08], kneeAt = along(s + (side ? -.05 : .05), z - .45);
        pose[25 + side] = { ...px(kneeAt), visibility: .9 }; pose[27 + side] = { ...px(ankle), visibility: .9 };
        pose[29 + side] = { ...px([ankle[0] - U[0] * .08, ankle[1] - U[1] * .08, toe[2] + .01]), visibility: .9 }; pose[31 + side] = { ...px(toe), visibility: .9 };
      }
    });
    out.push({ frame, pts: t, pose, refined: pose });
  }
  return out;
}

describe('high jump camera from the uprights', () => {
  it('finds the camera and the uprights\' spacing from four points and the bar height', () => {
    const toPx = (q: { x: number; y: number }) => ({ x: q.x * W, y: q.y * H });
    const c = calibrate({ left: { foot: toPx(UPRIGHTS.left.foot), bar: toPx(UPRIGHTS.left.bar) }, right: { foot: toPx(UPRIGHTS.right.foot), bar: toPx(UPRIGHTS.right.bar) } }, BAR, W, H)!;
    expect(c).not.toBeNull();
    expect(c.spacing).toBeCloseTo(SPACE, 2);
    expect(c.height).toBeCloseTo(C[2], 2);
    expect(c.pitch).toBeCloseTo(.5, 1);
    expect(c.rms).toBeLessThan(.1);
    // A point on the ground comes back to its place.
    const [u, v] = cam.project(TAKEOFF), back = c.camera.onPlane(u, v, [0, 0, 1], 0)!;
    expect(Math.hypot(back[0] - TAKEOFF[0], back[1] - TAKEOFF[1])).toBeLessThan(.01);
  });
  it('reads a wrong bar height off the uprights\' spacing', () => {
    const toPx = (q: { x: number; y: number }) => ({ x: q.x * W, y: q.y * H });
    const pts = { left: { foot: toPx(UPRIGHTS.left.foot), bar: toPx(UPRIGHTS.left.bar) }, right: { foot: toPx(UPRIGHTS.right.foot), bar: toPx(UPRIGHTS.right.bar) } };
    expect(calibrate(pts, 1.35, W, H)!.spacing).toBeGreaterThan(SPACING[1]);
  });
});

describe('high jump takeoff', () => {
  const r = analyzeHighJump(frames(), { width: W, height: H, uprights: UPRIGHTS, barHeight: BAR });
  it('finds the last three contacts and times the rhythm', () => {
    expect(r.reason).toBeNull();
    expect(r.contacts).toHaveLength(3);
    expect([r.before, r.penult, r.takeoff]).toEqual([0, 1, 2]);
    expect(r.times.takeoffContact!).toBeCloseTo(TO - .555, 1);
    expect(r.times.stepBefore!).toBeCloseTo(.36 - .12, 1);
    expect(r.times.lastStep!).toBeCloseTo(.555 - .36, 1);
    expect(r.rhythm!).toBeLessThan(1);
  });
  it('measures the upward speed and the rise in metres, with the uprights as the ruler', () => {
    expect(r.camera!.spacing).toBeCloseTo(SPACE, 1);
    expect(r.camera!.view!).toBeGreaterThan(85);
    const l = r.lift!;
    expect(l).not.toBeNull();
    // The centre of mass is the pelvis's plus a fixed offset in the flight: its upward speed is the pelvis's.
    expect(l.speed).toBeGreaterThan(UP * .97); expect(l.speed).toBeLessThan(UP * 1.03);
    expect(l.h2).toBeCloseTo(UP * UP / (2 * G), 1);
    expect(Math.abs(l.speed - l.speedCheck)).toBeLessThan(.05);
    expect(l.overBar).toBeCloseTo(l.peak - BAR, 6);
    expect(r.notes.filter(n => n.includes('支柱'))).toEqual([]);
    expect(T_PEAK).toBeGreaterThan(TO);
  });
  it('gives the lean at the touchdown and the moments for the pictures', () => {
    expect(r.posture.lean).not.toBeNull();
    expect(r.leanLine?.frame).toBe(r.contacts[r.takeoff!].touchdownFrame);
    expect(r.moments.map(m => m.key)).toEqual(expect.arrayContaining(['penult', 'touchdown', 'toeOff']));
  });
  it('warns when the uprights\' spacing is far from 4 m (a wrong bar height)', () => {
    const wrong = analyzeHighJump(frames(), { width: W, height: H, uprights: UPRIGHTS, barHeight: 1.35 });
    expect(wrong.notes.some(n => n.includes('支柱の間隔'))).toBe(true);
  });
  it('turns the result into advice with the rhythm and the speed', () => {
    const topics = highJumpAdvice(r).map(a => a.topic);
    expect(topics).toEqual(expect.arrayContaining(['上向きの速さ', '最後の2歩のリズム']));
  });
});

describe('the first runner in the survey', () => {
  const person = (x: number) => Array.from({ length: 33 }, () => ({ x, y: .5, visibility: .9 }));
  it('takes the first pose moving at running speed in the direction', () => {
    const samples = [{ frame: 0, pts: 0, poses: [person(.5)] }, { frame: 20, pts: .1, poses: [person(.5), person(.9)] },
      { frame: 40, pts: .2, poses: [person(.5), person(.8)] }];
    expect(firstRunner(samples, -1)?.frame).toBe(20);
    expect(firstRunner(samples, 1)).toBeNull();
  });
});
