import { G } from '../cmj/analysis';
import type { FirstContact } from '../cmj/ExactFramePicker';
import type { RegisteredAnalysis, Boundary } from './registered-template';

export type EventKind = 'takeoff' | 'landing';
export type BoundaryCorrections = Record<string, FirstContact>;
export const eventKey = (jump: number, kind: EventKind) => `${jump}:${kind}`;

/** Edits refer to exact source frames. Do not train/shift the other jumps using
 * a correction, and never consume a comparison RSI or the excluded 11th jump. */
export function correctRegistered(base: RegisteredAnalysis, corrections: BoundaryCorrections,
  frames: readonly FirstContact[]): { analysis: RegisteredAnalysis; error: string | null } {
  const fail = (error: string) => ({ analysis: base, error });
  for (const [key, value] of Object.entries(corrections)) {
    if (!/^(?:[1-9]|10):(takeoff|landing)$/.test(key) || !base.jumps.some(j => j.jump === Number(key.split(':')[0]))
      || !frames.some(f => f.frame === value.frame && Math.abs(f.pts - value.pts) < 1e-7))
      return fail('登録コマが元動画のフレームと一致しません。');
  }
  const jumps = base.jumps.map(j => {
    const boundary = (kind: EventKind): Boundary | null => {
      const edit = corrections[eventKey(j.jump, kind)];
      return edit ? { pts: edit.pts, source: 'MANUAL' } : j[kind];
    };
    return { ...j, takeoff: boundary('takeoff'), landing: boundary('landing') };
  });
  for (let i = 0; i < jumps.length; i++) {
    const j = jumps[i], apex = frames.find(f => f.frame === base.selectedPeakFrames[i]);
    if ((j.takeoff && apex && j.takeoff.pts >= apex.pts) || (j.landing && apex && j.landing.pts <= apex.pts))
      return fail(`${j.jump}回目：離地 → 頂点 → 着地の順になるコマを選んでください。`);
    const previous = jumps[i - 1]?.landing;
    const ft = j.takeoff && j.landing ? j.landing.pts - j.takeoff.pts : null;
    const ct = j.takeoff && previous ? j.takeoff.pts - previous.pts : null;
    if (ft !== null && (ft < .12 || ft > .9)) return fail(`${j.jump}回目：滞空時間が0.12〜0.9秒の範囲外です。`);
    if (ct !== null && (ct < .06 || ct > .6)) return fail(`${j.jump}回目：直前の着地から離地までが0.06〜0.6秒の範囲外です。`);
    j.flightSeconds = ft; j.contactSeconds = ct;
    j.heightM = ft === null ? null : G * ft ** 2 / 8;
    j.rsi = ct === null || j.heightM === null ? null : j.heightM / ct;
    j.flightSource = ft === null ? null : j.takeoff?.source === 'MANUAL' && j.landing?.source === 'MANUAL' ? 'MANUAL' : 'PREDICTED';
    j.contactSource = ct === null ? null : j.takeoff?.source === 'MANUAL' && previous?.source === 'MANUAL' ? 'MANUAL' : 'PREDICTED';
    j.reason = i === 0 ? '静止開始の1回目はRSI対象外' : j.rsi === null ? '離地・着地を確認して登録してください' : null;
  }
  const valid = jumps.slice(1).flatMap(j => j.rsi === null ? [] : [j.rsi]);
  return { analysis: { ...base, version: 'rj-registered-reviewed-v2', jumps, validRSICount: valid.length,
    meanRSI: valid.length ? valid.reduce((a, b) => a + b, 0) / valid.length : null,
    maxRSI: valid.length ? Math.max(...valid) : null }, error: null };
}
