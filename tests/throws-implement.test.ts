import { describe, expect, it } from 'vitest';
import { bodyMask, differenceMask, flightAt, javelinAttitude, medianBackground, searchFlight, type MaskFrame } from '../src/throws/implement';

// Synthetic flights over a 480x360 region (the source picture itself: origin 0, k 1), 100 px per metre,
// 120 fps, thrown to the right from a hand at (120, 300): the implement drawn where its flight is, plus
// speckles that come and go (leaves in the wind), 3% of the pixels in each frame.
const W = 480, H = 360, SCALE = 100, FPS = 120, G = 9.81, HAND = { x: 120, y: 300 };
function random(seed: number) { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; }
function frames(draw: (on: Uint8Array, t: number) => void, { noise = .03, seed = 7 } = {}): MaskFrame[] {
  const rnd = random(seed), out: MaskFrame[] = [];
  for (let i = 0; i <= 16; i++) {
    const t = i / FPS, on = new Uint8Array(W * H);
    for (let p = 0; p < W * H; p++) if (rnd() < noise) on[p] = 1;
    draw(on, t);
    out.push({ frame: i, pts: t, on, w: W, h: H, origin: { x: 0, y: 0 }, k: 1 });
  }
  return out;
}
/** The place at time t of a flight from (x0, y0) at `speed` m/s and `deg` degrees, falling with gravity. */
const place = (x0: number, y0: number, speed: number, deg: number, t: number) => ({
  x: x0 + speed * Math.cos(deg * Math.PI / 180) * SCALE * t, y: y0 - speed * Math.sin(deg * Math.PI / 180) * SCALE * t + .5 * G * SCALE * t * t });
function disc(on: Uint8Array, cx: number, cy: number, r: number) {
  for (let y = Math.floor(cy - r); y <= cy + r; y++) for (let x = Math.floor(cx - r); x <= cx + r; x++)
    if (x >= 0 && y >= 0 && x < W && y < H && (x - cx) ** 2 + (y - cy) ** 2 <= r * r) on[y * W + x] = 1;
}
/** A javelin: `length` px along `attitude` degrees ahead of its tail, 4 px thick. */
function bar(on: Uint8Array, tail: { x: number; y: number }, attitude: number, length: number) {
  const ux = Math.cos(attitude * Math.PI / 180), uy = -Math.sin(attitude * Math.PI / 180);
  for (let s = 0; s <= length; s += .5) disc(on, tail.x + ux * s, tail.y + uy * s, 2);
}

describe('the implement after the release', () => {
  it("finds a shot's speed and angle at the release among speckles", () => {
    const f = frames((on, t) => { const p = place(135, 285, 8, 37, t); disc(on, p.x, p.y, 5.5); });
    const path = searchFlight(f, HAND, 0, 1, SCALE, 'shot')!;
    expect(path).not.toBeNull();
    expect(path.speedPx / SCALE).toBeCloseTo(8, 0);
    expect(Math.abs(path.speedPx / SCALE - 8)).toBeLessThan(.25);
    expect(Math.abs(path.angle - 37)).toBeLessThan(1.5);
    const at = flightAt(path, 5 / FPS, SCALE), truth = place(135, 285, 8, 37, 5 / FPS);
    expect(Math.hypot(at.x - truth.x, at.y - truth.y)).toBeLessThan(3);
  });
  it('follows a javelin by its tail, not along its body, and reads its attitude', () => {
    const f = frames((on, t) => bar(on, place(100, 300, 20, 32, t), 40, 70));
    const path = searchFlight(f, HAND, 0, 1, SCALE, 'jav')!;
    expect(Math.abs(path.speedPx / SCALE - 20)).toBeLessThan(.6);
    expect(Math.abs(path.angle - 32)).toBeLessThan(1.5);
    expect(Math.abs(javelinAttitude(f, path, SCALE, 1)! - 40)).toBeLessThan(3);
  });
  it('works the other way round (thrown to the left)', () => {
    const f = frames((on, t) => { const p = place(135, 285, 8, 37, t); disc(on, W - p.x, p.y, 5.5); });
    const path = searchFlight(f, { x: W - HAND.x, y: HAND.y }, 0, -1, SCALE, 'shot')!;
    expect(Math.abs(path.speedPx / SCALE - 8)).toBeLessThan(.25);
    expect(Math.abs(path.angle - 37)).toBeLessThan(1.5);
  });
  it('finds nothing when nothing flies', () => {
    expect(searchFlight(frames(() => undefined, { noise: .01 }), HAND, 0, 1, SCALE, 'shot')).toBeNull();
  });
  it('takes what differs from the background by more than the pixel moves anyway', () => {
    const n = 4, still = (v: number) => Uint8ClampedArray.from({ length: n * 4 }, () => v);
    // Pixel 0 still at 100; pixel 1 flickering between 60 and 140 (a leaf).
    const back = [60, 140, 100, 70, 130, 90, 120].map(v => { const f = still(100); for (let c = 0; c < 3; c++) f[4 + c] = v; return f; });
    const bg = medianBackground(back, n);
    const now = still(100); for (let c = 0; c < 3; c++) { now[c] = 160; now[4 + c] = 180; }
    const on = differenceMask(now, bg, new Uint8Array(n), n);
    expect([...on]).toEqual([1, 0, 0, 0]);
  });
  it("masks the athlete's arm and hand", () => {
    const pose = Array.from({ length: 33 }, () => ({ x: .1, y: .1 }));
    pose[12] = { x: .2, y: .5 }; pose[14] = { x: .3, y: .4 }; pose[16] = { x: .4, y: .3 };
    const m = bodyMask(pose, 200, 100, 100);
    expect(m[30 * 200 + 80]).toBe(1);                                  // the wrist
    expect(m[Math.round(30 - 5) * 200 + Math.round(80 + 5)]).toBe(1);  // the palm, past it
    expect(m[90 * 200 + 190]).toBe(0);
  });
});
