import { describe, expect, it } from 'vitest';
import { rulerScale } from '../src/longjump/ruler';

// A pinhole camera beside a runway: f px, at height h, `back` metres from the runway's far edge... looking across it
// (z away from the camera), pitched down by `pitch` and turned by `yaw` about the vertical. Ground point (along the run
// a, across from the far edge c) → picture.
const W = 1920, H = 1080, WIDTH = 1.22;
function camera(f: number, h: number, near: number, pitch = 0, yaw = 0) {
  return (a: number, c: number) => {
    // world: x along the run, z away from the camera (the near edge at `near`, the far edge at near + WIDTH), y down
    let x = a, z = near + WIDTH - c, y = h;
    [x, z] = [x * Math.cos(yaw) - z * Math.sin(yaw), x * Math.sin(yaw) + z * Math.cos(yaw)];
    [y, z] = [y * Math.cos(pitch) - z * Math.sin(pitch), y * Math.sin(pitch) + z * Math.cos(pitch)];
    return { x: (W / 2 + f * x / z) / W, y: (H / 2 + f * y / z) / H };
  };
}
const points = (cam: ReturnType<typeof camera>, distance: number) =>
  ({ boardFar: cam(0, 0), boardNear: cam(0, WIDTH), sandFar: cam(-distance, 0), sandNear: cam(-distance, WIDTH) });
// the true pixels per metre along the run at a ground point
const truth = (cam: ReturnType<typeof camera>, a: number, c: number) => {
  const p = cam(a - .005, c), q = cam(a + .005, c); return Math.hypot((q.x - p.x) * W, (q.y - p.y) * H) / .01;
};

describe('the ruler on the ground', () => {
  it('the scale at the foot: across the runway it changes, and the ruler follows', () => {
    const cam = camera(1500, 1.1, 6, .03);   // the runway runs to the left in the picture: the pit at a < 0
    for (const across of [.1, .5, .9]) {
      const foot = cam(.4, across * WIDTH);   // 0.4 m behind the takeoff line
      const r = rulerScale(points(cam, 2), 2, { x: foot.x * W, y: foot.y * H }, W, H)!;
      expect(r.pxPerM / truth(cam, .4, across * WIDTH)).toBeCloseTo(1, 4);
      expect(r.behind).toBeCloseTo(.4, 2);
    }
    // the near edge's scale over the far edge's: (near + width) / near
    const far = rulerScale(points(cam, 2), 2, (p => ({ x: p.x * W, y: p.y * H }))(cam(.4, 0)), W, H)!.pxPerM;
    const near = rulerScale(points(cam, 2), 2, (p => ({ x: p.x * W, y: p.y * H }))(cam(.4, WIDTH)), W, H)!.pxPerM;
    expect(near / far).toBeGreaterThan(1.15);
  });
  it('steady under a point moved a pixel or two (a homography moved 11% for 0.6 px)', () => {
    // as test video ③: the runway 11 px high where the points were set, the ruler 450 px long
    const P = (x: number, y: number) => ({ x: x / W, y: y / H });
    const p = { boardFar: P(545, 748), boardNear: P(523.2, 759), sandFar: P(91.1, 748), sandNear: P(29.2, 759) }, foot = { x: 676, y: 747 };
    const base = rulerScale(p, 2, foot, W, H)!.pxPerM;
    expect(base).toBeCloseTo(225, 0);
    for (const [k, dx, dy] of [['sandNear', -.6, -.6], ['boardFar', 2, 0], ['sandFar', 0, 2], ['boardNear', -2, -2]] as const) {
      const moved = { ...p, [k]: P(p[k].x * W + dx, p[k].y * H + dy) };
      expect(Math.abs(rulerScale(moved, 2, foot, W, H)!.pxPerM / base - 1)).toBeLessThan(.02);
    }
  });
  it('a camera turned from square: 3° within 3%, 7° about 6% (the scale changes along the run; recorded)', () => {
    for (const [yaw, within] of [[.05, .03], [.12, .07]]) {
      const cam = camera(1500, 1.1, 6, .03, yaw), foot = cam(.5, .6);
      const r = rulerScale(points(cam, 2), 2, { x: foot.x * W, y: foot.y * H }, W, H)!;
      expect(Math.abs(r.pxPerM / truth(cam, .5, .6) - 1)).toBeLessThan(within);
    }
  });
  it('points that make no ruler', () => {
    const cam = camera(1500, 1.1, 6), p = points(cam, 2), foot = { x: 900, y: 750 };
    expect(rulerScale({ ...p, boardFar: p.boardNear, boardNear: p.boardFar }, 2, foot, W, H)).toBeNull();   // far below near
    expect(rulerScale({ ...p, sandFar: p.boardFar, sandNear: p.boardNear }, 2, foot, W, H)).toBeNull();     // not apart
    expect(rulerScale(p, 0, foot, W, H)).toBeNull();
  });
});
