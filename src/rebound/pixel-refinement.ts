import { G } from '../cmj/analysis';
import type { RegisteredAnalysis } from './registered-template';
import { fitPixelBoundary, PIXEL_PARAMETERS, type PixelBoundary, type PixelRow } from './pixel-foot';

export interface PixelEvent {
  jump: number; kind: 'takeoff' | 'landing'; originalPts: number; pts: number | null;
  source: 'MANUAL' | 'PIXEL_CANDIDATE' | 'REVIEW'; feet: PixelBoundary[]; reason: string | null;
}
export interface PixelJump { jump: number; contact: number | null; flight: number | null; heightM: number | null; rsi: number | null }
export interface PixelReport {
  version: string; validated: false; parameters: typeof PIXEL_PARAMETERS; events: PixelEvent[];
  jumps: PixelJump[]; validCount: number; mean: number | null; max: number | null; last3: number | null;
}
/** BOTH mode only: last foot leaving / first foot touching. Never substitute
 * one observed foot for both, or silently fall back to the old waveform. */
export function summarizePixelRefinement(base: RegisteredAnalysis, rows: readonly PixelRow[]): PixelReport {
  const events: PixelEvent[] = base.jumps.flatMap(j => (['takeoff', 'landing'] as const).flatMap((kind): PixelEvent[] => {
    const seed = j[kind]; if (!seed) return [];
    if (seed.source === 'MANUAL') return [{ jump: j.jump, kind, originalPts: seed.pts, pts: seed.pts, source: 'MANUAL' as const, feet: [], reason: null }];
    const feet = ([0, 1] as const).map(side => fitPixelBoundary(rows, side, seed.pts, kind));
    let reason = feet.some(f => f.pts === null) ? '両足の境界を確認できません' : null;
    if (!reason && Math.abs(feet[0].pts! - feet[1].pts!) > .025 + 1e-9) reason = '左右の候補時刻が離れています';
    return [{ jump: j.jump, kind, originalPts: seed.pts, pts: reason ? null : (kind === 'takeoff' ? Math.max : Math.min)(...feet.map(f => f.pts!)),
      source: reason ? 'REVIEW' as const : 'PIXEL_CANDIDATE' as const, feet, reason }];
  }));
  const get = (jump: number, kind: PixelEvent['kind']) => events.find(e => e.jump === jump && e.kind === kind)?.pts ?? null;
  const jumps = base.jumps.map(j => {
    const t = get(j.jump, 'takeoff'), l = get(j.jump, 'landing'), previous = get(j.jump - 1, 'landing');
    const ft = t !== null && l !== null ? l - t : null, ct = t !== null && previous !== null ? t - previous : null;
    const flight = ft !== null && ft >= .12 && ft <= .9 ? ft : null;
    const contact = ct !== null && ct >= .06 && ct <= .6 ? ct : null;
    const heightM = flight === null ? null : G * flight ** 2 / 8;
    return { jump: j.jump, contact, flight, heightM, rsi: heightM !== null && contact !== null ? heightM / contact : null };
  });
  const valid = jumps.flatMap(j => j.rsi === null ? [] : [j.rsi]), last = jumps.filter(j => j.jump >= 8 && j.jump <= 10);
  return { version: PIXEL_PARAMETERS.version, validated: false, parameters: PIXEL_PARAMETERS, events, jumps, validCount: valid.length,
    mean: valid.length ? valid.reduce((a, b) => a + b, 0) / valid.length : null, max: valid.length ? Math.max(...valid) : null,
    last3: last.length === 3 && last.every(j => j.rsi !== null) ? last.reduce((s, j) => s + j.rsi!, 0) / 3 : null };
}
