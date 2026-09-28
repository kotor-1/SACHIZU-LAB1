import { describe, expect, it } from 'vitest';
import { bilateralFlightFraction, bilateralFlightLobe, bilateralFlightRange, type AerialLobe } from '../src/rebound/bilateral-flight';

// Independent exhaustive enumeration of the admissible pair set. This checks
// the optimized extrema search, not the biomechanical accuracy of toe lobes.
function exhaustive(left: readonly AerialLobe[], right: readonly AerialLobe[], difference: number): [number, number] | null {
  const values: number[] = [];
  for (const a of left) for (const b of right) {
    if (Math.abs(a.fraction - b.fraction) > difference + 1e-8) continue;
    const fraction = bilateralFlightFraction(a, b);
    if (fraction !== null) values.push(fraction);
  }
  return values.length ? [Math.min(...values), Math.max(...values)] : null;
}

function expectSame(actual: [number, number] | null, expected: [number, number] | null) {
  if (expected === null) expect(actual).toBeNull();
  else {
    expect(actual).not.toBeNull();
    expect(actual![0]).toBeCloseTo(expected[0], 11);
    expect(actual![1]).toBeCloseTo(expected[1], 11);
  }
}

describe('bilateral alternative-grid sensitivity extrema', () => {
  it('matches exhaustive pairs on deterministic random grids with wrap, disconnected lobes and width differences', () => {
    let state = 0x48c7321;
    const random = () => { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return state / 0x100000000; };
    const point = (): AerialLobe => ({
      fraction: .05 + Math.floor(random() * 181) * .005,
      phase: Math.floor(random() * 41) / 40 + Math.floor(random() * 5) - 2,
    });
    for (let trial = 0; trial < 350; trial++) {
      const left = Array.from({ length: 1 + Math.floor(random() * 15) }, point);
      const right = Array.from({ length: 1 + Math.floor(random() * 17) }, point);
      const difference = [0, .05, .15, .4, 1][trial % 5];
      expectSame(bilateralFlightRange(left, right, difference), exhaustive(left, right, difference));
      expectSame(bilateralFlightRange(right, left, difference), exhaustive(left, right, difference));
    }
  });

  it('retains the smallest nonzero overlap and the largest admissible overlap at numerical boundaries', () => {
    const left = [{ fraction: .4, phase: 0 }];
    const right = [
      { fraction: .2, phase: .3 }, // just touching: not a flight
      { fraction: .2 + 4e-12, phase: .3 },
      { fraction: .8, phase: .4 }, // just touching the second overlap
      { fraction: .8 + 4e-12, phase: .4 }, // disconnected: reject
      { fraction: .55 + 1e-8, phase: 0 },
      { fraction: .55 + 1.1e-8, phase: 0 },
    ];
    for (const difference of [0, .15, .2, .4, 1]) {
      expectSame(bilateralFlightRange(left, right, difference), exhaustive(left, right, difference));
    }
  });

  it('handles containment, duplicates, reversed input and periodic phase origins without mutating inputs', () => {
    const left = Object.freeze([
      Object.freeze({ fraction: .6, phase: 3.05 }),
      Object.freeze({ fraction: .65, phase: -2.075 }),
    ]);
    const right = Object.freeze([
      Object.freeze({ fraction: .7, phase: -4 }),
      Object.freeze({ fraction: .5, phase: 1.05 }),
      Object.freeze({ fraction: .5, phase: 1.05 }),
      Object.freeze({ fraction: .8, phase: 5.2 }),
    ]);
    const expected = exhaustive(left, right, .15);
    expectSame(bilateralFlightRange(left, right, .15), expected);
    expectSame(bilateralFlightRange([...left].reverse(), [...right].reverse(), .15), expected);
    expectSame(bilateralFlightRange(right, left, .15), expected);
  });

  it('returns null if every pair is disjoint, disconnected or outside the width tolerance', () => {
    expect(bilateralFlightRange([{ fraction: .2, phase: -.15 }], [{ fraction: .2, phase: .15 }], .15)).toBeNull();
    expect(bilateralFlightRange([{ fraction: .85, phase: -.15 }], [{ fraction: .85, phase: .15 }], .15)).toBeNull();
    expect(bilateralFlightRange([{ fraction: .2, phase: 0 }], [{ fraction: .8, phase: 0 }], .15)).toBeNull();
  });

  it('handles complete 131 by 25 phase-duration grids without a Cartesian-sized allocation', () => {
    const grid = Array.from({ length: 131 }, (_, width) =>
      Array.from({ length: 25 }, (_, phase) => ({ fraction: .2 + width * .005, phase: -.15 + phase * .0125 }))).flat();
    const range = bilateralFlightRange(grid, [...grid].reverse(), .15);
    expect(range).not.toBeNull();
    // On this grid each strictly positive partial overlap is a multiple of
    // .0025; identical .85-wide lobes attain the greatest possible value.
    expect(range![0]).toBeCloseTo(.0025, 11);
    expect(range![1]).toBeCloseTo(.85, 11);
  });

  it('rejects invalid parameters and keeps very large finite phases finite', () => {
    const valid = [{ fraction: .6, phase: 0 }];
    for (const difference of [-1, NaN, Infinity, 1.001]) expect(bilateralFlightRange(valid, valid, difference)).toBeNull();
    expect(bilateralFlightRange([], valid, .15)).toBeNull();
    expect(bilateralFlightRange(valid, [], .15)).toBeNull();
    for (const fraction of [0, 1, NaN, Infinity]) expect(bilateralFlightRange(valid, [{ fraction, phase: 0 }], .15)).toBeNull();
    for (const phase of [NaN, Infinity, -Infinity]) expect(bilateralFlightRange([{ fraction: .6, phase }], valid, .15)).toBeNull();
    const left = { fraction: .6, phase: 1e308 }, right = { fraction: .6, phase: -1e308 };
    const lobe = bilateralFlightLobe(left, right);
    expect(lobe).not.toBeNull();
    expect(Number.isFinite(lobe!.fraction)).toBe(true);
    expect(Number.isFinite(lobe!.phase)).toBe(true);
    expectSame(bilateralFlightRange([left], [right], .15), exhaustive([left], [right], .15));
  });
});
