import { describe, expect, it } from 'vitest';
import { distanceAt, target50, timeAt, topSpeed } from '../src/sprint10/target50';

describe('the 50 m time a section points to', () => {
  it('runs the model both ways', () => {
    expect(distanceAt(0, 10)).toBe(0);
    expect(distanceAt(timeAt(50, 9), 9)).toBeCloseTo(50, 6);
    // Late in the run the distance is v0 (t − τ): 50 m at 9 m/s is about 50/9 + 1.1 s.
    expect(timeAt(50, 9)).toBeCloseTo(50 / 9 + 1.1, 2);
  });
  it('finds the top speed from a section anywhere in the run', () => {
    for (const v0 of [7, 9, 11.5]) for (const entry of [20, 50]) {
      const seconds = timeAt(entry + 10, v0) - timeAt(entry, v0);
      expect(topSpeed(entry, 10, seconds)!).toBeCloseTo(v0, 6);
    }
    // At 50-60 m the section's mean speed is the top speed; at 20-30 m it is still below it.
    const late = timeAt(60, 9) - timeAt(50, 9), early = timeAt(30, 9) - timeAt(20, 9);
    expect(10 / late).toBeCloseTo(9, 1);
    expect(10 / early).toBeLessThan(9 * .99);
    expect(topSpeed(20, 10, 0)).toBeNull();
  });
  it('gives the 50 m time with its spread over the time constants reported', () => {
    const r = target50(50, 10, 10 / 9)!;
    expect(r.time).toBeCloseTo(timeAt(50, r.topSpeed), 6);
    expect(r.topSpeed).toBeGreaterThan(8.95);
    expect(r.range[0]).toBeLessThan(r.time); expect(r.range[1]).toBeGreaterThan(r.time);
    expect(r.range[1] - r.range[0]).toBeLessThan(.4);
    // The user's section 20-30 m in 1.4 s: still accelerating, the top speed above its 7.1 m/s.
    expect(target50(20, 10, 1.4)!.topSpeed).toBeGreaterThan(10 / 1.4);
  });
});
