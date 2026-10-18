import { describe, expect, it } from 'vitest';
import { BOARD_CM, foulCm, foulStart, foulWords, type FoulPoints } from '../src/longjump/foul';
import { standAdvice } from '../src/longjump/advice';
import type { LongJumpResult } from '../src/longjump/analysis';

const W = 1080, H = 1920;
const parts = (p: Record<string, { x: number; y: number }>) => Object.fromEntries(Object.entries(p).map(([k, q]) => [k, { x: q.x / W, y: q.y / H }])) as FoulPoints;
/** A board square to the picture: its back edge at x = 460, the foul line at x = 500 (40 px = 20 cm), running right. */
const square = (toeX: number) => parts({ lineA: { x: 500, y: 900 }, lineB: { x: 500, y: 1100 }, back: { x: 460, y: 1000 }, toe: { x: toeX, y: 1010 } });

describe('the foul line from the stands', () => {
  it('measures the toe beyond the line (a foul) and before it, by the board\'s 20 cm', () => {
    expect(foulCm(square(506), W, H)).toBeCloseTo(3, 6);
    expect(foulCm(square(480), W, H)).toBeCloseTo(-10, 6);
    expect(foulCm(square(500), W, H)).toBeCloseTo(0, 6);
    expect(BOARD_CM).toBe(20);
  });
  it('keeps the ratio when the board is seen slanted and turned (one affine map near the board)', () => {
    // The same board through a shear, a turn and a scale: the distances in cm do not change.
    const map = ({ x, y }: { x: number; y: number }) => { const sx = x + .4 * (y - 1000), sy = .6 * y; const a = .5; return { x: 300 + .9 * (Math.cos(a) * sx - Math.sin(a) * sy), y: 400 + .9 * (Math.sin(a) * sx + Math.cos(a) * sy) }; };
    for (const [toe, cm] of [[506, 3], [480, -10], [530, 15]] as const) {
      const p = { lineA: { x: 500, y: 900 }, lineB: { x: 500, y: 1100 }, back: { x: 460, y: 1000 }, toe: { x: toe, y: 1010 } };
      expect(foulCm(parts(Object.fromEntries(Object.entries(p).map(([k, q]) => [k, map(q)]))), W, H)).toBeCloseTo(cm, 6);
    }
    // Any two points on the line, and the back edge anywhere along its own line.
    expect(foulCm(parts({ lineA: { x: 500, y: 700 }, lineB: { x: 500, y: 760 }, back: { x: 460, y: 1300 }, toe: { x: 506, y: 1010 } }), W, H)).toBeCloseTo(3, 6);
  });
  it('makes no board from points together or a back edge on the line', () => {
    expect(foulCm(parts({ lineA: { x: 500, y: 1000 }, lineB: { x: 502, y: 1003 }, back: { x: 460, y: 1000 }, toe: { x: 506, y: 1010 } }), W, H)).toBeNull();
    expect(foulCm(parts({ lineA: { x: 500, y: 900 }, lineB: { x: 500, y: 1100 }, back: { x: 501, y: 1000 }, toe: { x: 506, y: 1010 } }), W, H)).toBeNull();
  });
  it('starts the points round the toe found, the board\'s back edge behind it', () => {
    const p = foulStart({ x: 540, y: 1300 }, 200, -1, W, H);
    expect(p.toe).toEqual({ x: 540 / W, y: 1300 / H });
    expect(p.back.x).toBeGreaterThan(p.toe.x);
    expect(p.lineA.y).toBeLessThan(p.toe.y);
    expect(p.lineB.y).toBeGreaterThan(p.toe.y);
  });
  it('says it in words: a foul, before the line, on the line', () => {
    expect(foulWords(3.2)).toMatchObject({ value: '+3', foul: true });
    expect(foulWords(3.2).text).toContain('約3cm越えています（ファール）');
    expect(foulWords(-11.6)).toMatchObject({ value: '12', foul: false });
    expect(foulWords(-11.6).text).toContain('手前 約12cm');
    expect(foulWords(.3)).toMatchObject({ value: '0', foul: false });
  });
  it('puts the takeoff\'s position first in the advice when measured', () => {
    const r = { takeoffContact: .15, posture: { legAngle: 60, trunk: -5, knee: 160, trunkPenult: null }, rhythm: null } as unknown as LongJumpResult;
    expect(standAdvice(r).map(a => a.topic)).not.toContain('踏切位置');
    const foul = standAdvice(r, 3)[0];
    expect(foul).toMatchObject({ topic: '踏切位置', level: 'check' });
    expect(foul.text).toContain('記録は残りません');
    const before = standAdvice(r, -8)[0];
    expect(before).toMatchObject({ topic: '踏切位置', level: 'info' });
    expect(before.text).toContain('この約8 cmは記録に入りません');
  });
});
