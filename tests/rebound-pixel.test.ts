import { describe, expect, it } from 'vitest';
import { adaptiveFootEdge, brightFootEdge, darkFootEdge, fitPixelBoundary, type PixelRow } from '../src/rebound/pixel-foot';
import { summarizePixelRefinement } from '../src/rebound/pixel-refinement';
import type { RegisteredAnalysis } from '../src/rebound/registered-template';

function rows(kind: 'takeoff' | 'landing', event = 1): PixelRow[] {
  return Array.from({ length: 121 }, (_, frame) => {
    const pts = .75 + frame / 240, t = Math.max(0, (pts - event) * (kind === 'takeoff' ? 1 : -1));
    const y = 800 - 500 * t + 600 * t * t;
    return { frame, pts, feet: [0, 1].map(() => ({ ys: [y, y + .2, y + .4], contrast: 100, reason: null })) as PixelRow['feet'] };
  });
}
describe('experimental foot-pixel refinement', () => {
  it('finds known image motion transitions even when the seed is late or early', () => {
    for (const kind of ['takeoff', 'landing'] as const) for (const seed of [.97, 1.03]) {
      const r = fitPixelBoundary(rows(kind), 0, seed, kind);
      expect(r.reason).toBeNull(); expect(r.pts).toBeCloseTo(1, 2);
    }
  });
  it('uses the median of all nine accepted conditions without privileging a threshold', () => {
    for (const kind of ['takeoff', 'landing'] as const) {
      const channels = [1 - 2 / 240, 1, 1 + 1 / 240].map(event => rows(kind, event));
      for (const order of [[0, 1, 2], [2, 0, 1], [1, 2, 0], [2, 1, 0]]) {
        const data = rows(kind).map((row, i) => ({ ...row, feet: row.feet.map((foot, side) => ({ ...foot,
          ys: order.map(channel => channels[channel][i].feet[side].ys![0]) as [number, number, number],
        })) as PixelRow['feet'] }));
        const fit = fitPixelBoundary(data, 0, 1, kind);
        expect(fit.reason).toBeNull();
        expect(fit.conditionPts).toHaveLength(9);
        expect(fit.pts).toBeCloseTo(1, 6);
        expect(fit.pts).toBe([...fit.conditionPts!].sort((a, b) => a - b)[4]);
        expect(data.some(r => r.pts === fit.pts)).toBe(true);
      }
    }
  });
  it('accepts sensitivity exactly at 25 ms despite floating point rounding, but rejects the next source frame', () => {
    const channels = [.975, .9875, 1].map(event => rows('takeoff', event));
    const atLimit = rows('takeoff').map((row, i) => ({ ...row,
      feet: row.feet.map((_foot, side) => ({ ys: channels.map(channel => channel[i].feet[side].ys![0]) as [number, number, number],
        contrast: 100, reason: null })) as PixelRow['feet'],
    }));
    const accepted = fitPixelBoundary(atLimit, 0, .9875, 'takeoff');
    expect(accepted.range![1] - accepted.range![0]).toBeCloseTo(.025, 10);
    expect(accepted.reason).toBeNull(); expect(accepted.pts).toBeCloseTo(.9875, 6);

    const earlier = rows('takeoff', .975 - 1 / 240);
    const overLimit = atLimit.map((row, i) => ({ ...row, feet: row.feet.map((foot, side) => ({ ...foot,
      ys: [earlier[i].feet[side].ys![0], foot.ys![1], foot.ys![2]],
    })) as PixelRow['feet'] }));
    const rejected = fitPixelBoundary(overLimit, 0, .9875, 'takeoff');
    expect(rejected.reason).toBe('THRESHOLD_OR_WINDOW_DISAGREEMENT'); expect(rejected.pts).toBeNull();
  });
  it('rejects flat images, gaps, non-finite data and invalid timeline', () => {
    const flat = rows('takeoff').map(r => ({ ...r, feet: r.feet.map(f => ({ ...f, ys: [800, 800, 800] })) as PixelRow['feet'] }));
    expect(fitPixelBoundary(flat, 0, 1, 'takeoff').pts).toBeNull();
    expect(fitPixelBoundary(rows('takeoff').filter(r => r.pts < .98 || r.pts > 1.02), 0, 1, 'takeoff').reason).toBe('PIXEL_TRACKING_GAP');
    const bad = rows('takeoff'); bad[60].feet[0].ys![0] = NaN;
    expect(fitPixelBoundary(bad, 0, 1, 'takeoff').reason).toBe('PIXEL_TRACKING_GAP');
    expect(fitPixelBoundary([...rows('takeoff')].reverse(), 0, 1, 'takeoff').reason).toBe('INVALID_TIMELINE');
  });
  it('extracts a connected dark shoe, not isolated dark floor pixels', () => {
    const image = { width: 100, height: 100, pixels: new Uint8Array(10000).fill(160) };
    for (let y = 20; y <= 49; y++) for (let x = 30; x <= 55; x++) image.pixels[y * 100 + x] = 20;
    for (let x = 30; x <= 38; x++) image.pixels[70 * 100 + x] = 20;
    const r = darkFootEdge(image, { x: 20, y: 10, width: 50, height: 75 });
    expect(r.reason).toBeNull(); expect(r.ys).toEqual([49, 49, 49]);
    image.pixels.fill(100); expect(darkFootEdge(image, { x: 20, y: 10, width: 50, height: 75 }).ys).toBeNull();
    expect(darkFootEdge(image, { x: -10, y: 10, width: 50, height: 75 }).ys).toBeNull();
  });
  it('chooses a light shoe over a lower, weaker dark patch in the same crop', () => {
    const image = { width: 100, height: 120, pixels: new Uint8Array(12000).fill(120) };
    for (let y = 20; y <= 49; y++) for (let x = 30; x <= 55; x++) image.pixels[y * 100 + x] = 240;
    for (let y = 50; y <= 70; y++) for (let x = 30; x <= 55; x++) image.pixels[y * 100 + x] = 80;
    const box = { x: 20, y: 10, width: 50, height: 95 };
    expect(brightFootEdge(image, box).ys).toEqual([49, 49, 49]);
    expect(darkFootEdge(image, box).ys).toEqual([70, 70, 70]);
    expect(adaptiveFootEdge(image, box).ys).toEqual([49, 49, 49]);
  });
  it('preserves manual anchors and never fills missing feet from the old RSI', () => {
    const base = { jumps: [{ jump: 1, takeoff: { pts: .3, source: 'MANUAL' }, landing: { pts: .7, source: 'MANUAL' } },
      { jump: 2, takeoff: { pts: .9, source: 'MANUAL' }, landing: { pts: 1.3, source: 'TEMPLATE' }, rsi: 1.23 }] } as RegisteredAnalysis;
    const saved = JSON.stringify(base), r = summarizePixelRefinement(base, []);
    expect(r.events.slice(0, 3).map(e => e.pts)).toEqual([.3, .7, .9]);
    expect(r.events[3].pts).toBeNull(); expect(r.jumps[1].rsi).toBeNull(); expect(r.jumps[1].contact).toBeCloseTo(.2);
    expect(r.validCount).toBe(0); expect(r.last3).toBeNull(); expect(JSON.stringify(base)).toBe(saved);
  });
  it('requires both feet and uses the last foot leaving, first foot landing', () => {
    const base = { jumps: [{ jump: 8, takeoff: { pts: 1.02, source: 'TEMPLATE' } }] } as RegisteredAnalysis;
    const r = rows('takeoff'); const other = rows('takeoff', 1 + 2 / 240);
    r.forEach((q, i) => q.feet[1] = other[i].feet[1]);
    expect(summarizePixelRefinement(base, r).events[0].pts).toBeCloseTo(1 + 2 / 240, 3);
    r[60].feet[1].ys = null;
    expect(summarizePixelRefinement(base, r).events[0].pts).toBeNull();
    const landing = rows('landing'), later = rows('landing', 1 + 2 / 240);
    landing.forEach((q, i) => q.feet[1] = later[i].feet[1]);
    const landBase = { jumps: [{ jump: 8, landing: { pts: 1.02, source: 'TEMPLATE' } }] } as RegisteredAnalysis;
    expect(summarizePixelRefinement(landBase, landing).events[0].pts).toBeCloseTo(1, 3);
  });
});
