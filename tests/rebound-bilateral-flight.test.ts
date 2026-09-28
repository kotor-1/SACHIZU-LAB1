import { describe, expect, it } from 'vitest';
import { bilateralFlightFraction } from '../src/rebound/bilateral-flight';

describe('bilateral latent aerial overlap (geometry, not video accuracy)', () => {
  it('keeps simultaneous feet unchanged, and takes the contained interval rather than its average', () => {
    expect(bilateralFlightFraction({ fraction: .6, phase: 0 }, { fraction: .6, phase: 0 })).toBeCloseTo(.6, 12);
    expect(bilateralFlightFraction({ fraction: .7, phase: 0 }, { fraction: .5, phase: 0 })).toBeCloseTo(.5, 12);
  });
  it('reduces common flight by the phase displacement when neither lobe contains the other', () => {
    expect(bilateralFlightFraction({ fraction: .6, phase: -.05 }, { fraction: .6, phase: .05 })).toBeCloseTo(.5, 12);
    expect(bilateralFlightFraction({ fraction: .6, phase: 0 }, { fraction: .5, phase: .1 })).toBeCloseTo(.45, 12);
  });
  it('is independent of the phase origin, period wrap and ordering of feet', () => {
    for (const shift of [-2, -.7, 0, .7, 2]) {
      const a = { fraction: .65, phase: shift - .075 }, b = { fraction: .6, phase: shift + .05 };
      expect(bilateralFlightFraction(a, b)).toBeCloseTo(.5, 12);
      expect(bilateralFlightFraction(b, a)).toBeCloseTo(.5, 12);
      expect(bilateralFlightFraction(a, { ...b, phase: b.phase + 2 })).toBeCloseTo(.5, 12);
    }
  });
  it('rejects absent or disconnected common flight instead of summing different jumps', () => {
    expect(bilateralFlightFraction({ fraction: .2, phase: -.15 }, { fraction: .2, phase: .15 })).toBeNull();
    expect(bilateralFlightFraction({ fraction: .85, phase: -.15 }, { fraction: .85, phase: .15 })).toBeNull();
  });
  it('rejects nonfinite and nonphysical lobe parameters', () => {
    for (const fraction of [-1, 0, 1, 2, NaN, Infinity]) expect(bilateralFlightFraction({ fraction, phase: 0 }, { fraction: .6, phase: 0 })).toBeNull();
    for (const phase of [NaN, Infinity, -Infinity]) expect(bilateralFlightFraction({ fraction: .6, phase }, { fraction: .6, phase: 0 })).toBeNull();
  });
});
