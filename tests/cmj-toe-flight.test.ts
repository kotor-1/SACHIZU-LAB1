import { describe, expect, it } from 'vitest';
import { analyzeToeFlight } from '../src/cmj/toe-flight';
import { analyzeCOM } from '../src/cmj/com-analysis';
import type { COMSample } from '../src/cmj/center-of-mass';
import { makeSyntheticFixture, NOISE_PROFILES } from './fixtures/cmj-stage1-synthetic';

// Stage-1 fixtures carry noisy toe points on heel-raise-then-toe-off feet.
function samples(options: Parameters<typeof makeSyntheticFixture>[0] = {}): COMSample[] {
  return makeSyntheticFixture(options).observations.map(({ feet, ...row }) =>
    row.comY === null ? row : { ...row, toeY: [feet[0].toe!.y, feet[1].toe!.y] as [number, number] });
}

describe('toe takeoff + airborne COM apex (cmj-toe-flight-v2)', () => {
  it('holds all 54 audit smooth-force conditions within 1 cm where the legacy estimator spread 21-39 cm', () => {
    const legacy: number[] = [];
    for (const T of [.15, .25, .35]) for (const fps of [30, 45, 60]) for (const p of [1, 2, 3, 4, 5, 6]) {
      const rows = samples({ T, p, fps }), r = analyzeToeFlight(rows, 400);
      expect(r.heightCm, `${T}/${fps}/${p} ${r.reason}`).not.toBeNull();
      expect(Math.abs(r.heightCm! - 30), `${T}/${fps}/${p}`).toBeLessThan(1);
      const old = analyzeCOM(rows, 400).heightCm;
      if (old !== null) legacy.push(old);
    }
    expect(Math.max(...legacy) - Math.min(...legacy)).toBeGreaterThan(10);
  }, 30000); // the legacy comparison fits are slow
  it('gives the same height across 30-240 fps and sub-frame phase', () => {
    const heights = [30, 45, 60, 120, 240].flatMap(fps => [0, .37].map(phase =>
      analyzeToeFlight(samples({ fps, phase }), 400).heightCm!));
    expect(Math.max(...heights) - Math.min(...heights)).toBeLessThan(1);
  });
  it('stays within 2 cm under 1 px toe noise at live frame rates', () => {
    for (const fps of [45, 60]) for (const p of [1, 3, 6]) {
      const r = analyzeToeFlight(samples({ fps, p, noise: NOISE_PROFILES[4] }), 400);
      expect(Math.abs(r.heightCm! - 30), r.reason).toBeLessThan(2);
    }
  });
  it('does not pull takeoff late or landing early under heavy toe-point noise at 30 fps', () => {
    // v1 (short floor window) went down to -12 cm here; phones add this much toe noise.
    const errors: number[] = [];
    for (let seed = 1; seed <= 40; seed++) {
      let state = seed * 7919 % 2147483647;
      const rand = () => (state = (state * 16807) % 2147483647) / 2147483647;
      const gauss = () => Math.sqrt(-2 * Math.log(rand() + 1e-12)) * Math.cos(2 * Math.PI * rand());
      const rows = samples({ fps: 30, p: 1 + seed % 6, phase: (seed % 10) / 10 }).map(row =>
        row.toeY ? { ...row, toeY: [row.toeY[0] + 8 * gauss(), row.toeY[1] + 8 * gauss()] as [number, number] } : row);
      const r = analyzeToeFlight(rows, 400);
      if (r.heightCm !== null) errors.push(r.heightCm - 30);
    }
    errors.sort((a, b) => a - b);
    expect(errors.length).toBeGreaterThanOrEqual(38);
    expect(Math.abs(errors[errors.length >> 1])).toBeLessThan(1.5);
    expect(errors[0]).toBeGreaterThan(-6);
  }, 30000);
  it('does not turn a heel raise without toe-off into a jump', () => {
    for (const fps of [45, 60, 240]) expect(analyzeToeFlight(samples({ fps, stress: 'heel-only' }), 400).heightCm).toBeNull();
  });
  it('withholds duplicated timestamps, a hole at takeoff and a too-slow cadence', () => {
    expect(analyzeToeFlight(samples({ stress: 'invalid-time' }), 400).reason).toBe('INVALID_TIMELINE');
    expect(analyzeToeFlight(samples({ stress: 'time-gap' }), 400).heightCm).toBeNull();
    const slow = samples({ fps: 240 }).filter(p => p.frame % 16 === 0);
    expect(analyzeToeFlight(slow, 400).reason).toBe('FRAME_RATE_TOO_LOW');
  });
  it('keeps the legacy estimate only as a diagnostic', () => {
    const r = analyzeToeFlight(samples({ fps: 60 }), 400);
    expect(r.version).toBe('cmj-toe-flight-v2-experimental');
    expect(r.toeFlight.legacyHeightCm).toBe(analyzeCOM(samples({ fps: 60 }), 400).heightCm);
    expect(r.toeFlight.takeoffPts).toBeLessThan(r.toeFlight.apexPts!);
    expect(r.toeFlight.apexPts).toBeLessThan(r.toeFlight.landingPts!);
  });
});
