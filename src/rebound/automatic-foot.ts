import { G } from '../cmj/analysis';
import { autoReview } from './auto-review';
import { createLowerSubjectSelector, type JumpMode } from './lower-body';
import { predictionSignals, type PoseFrame } from './prediction-observations';
import type { RegisteredAnalysis } from './registered-template';
import { detectLowerPeaks } from './waveform-fit';

export const AUTOMATIC_REGION = { left: 0, right: 1, top: 0, bottom: 1 };
export function automaticFootSeeds(poses: readonly PoseFrame[], mode: JumpMode) {
  const select = createLowerSubjectSelector(AUTOMATIC_REGION, mode);
  const selected = poses.map(f => ({ ...f, poses: select(f.poses, f.pts) }));
  const signals = predictionSignals(poses, AUTOMATIC_REGION, mode);
  const peaks = detectLowerPeaks(signals.PELVIS, 'PELVIS');
  const base = autoReview(selected, peaks, mode, 0, true);
  if (!base.jumps.length && peaks.reason !== 'FRAME_RATE_TOO_LOW') base.reason = '跳躍を認識できませんでした。1人の腰・膝・足元が見切れず、カメラを固定した動画で試してください。';
  return { selected, base };
}

/** Only image-supported boundaries enter this automatic estimate. Coarse pose
 * thresholds, manual marks and a desired RSI never supply fallback timings.
 * Quality gates are engineering checks, not clinical validation. */
export function automaticFootResult(analysis: RegisteredAnalysis) {
  const event = (jump: number, kind: 'takeoff' | 'landing') => {
    const b = analysis.jumps.find(j => j.jump === jump)?.[kind];
    const e = analysis.footRefinement?.events.find(e => e.jump === jump && e.kind === kind);
    return b?.source === 'PIXEL_REFINED' && Number.isFinite(b.pts) && e?.applied && e.pts === b.pts ? b.pts : null;
  };
  const jumps = analysis.jumps.map((j, i) => {
    const takeoff = event(j.jump, 'takeoff'), landing = event(j.jump, 'landing');
    const previousLanding = i ? event(analysis.jumps[i - 1].jump, 'landing') : null;
    const f = takeoff !== null && landing !== null ? landing - takeoff : null;
    const c = takeoff !== null && previousLanding !== null ? takeoff - previousLanding : null;
    const flightSeconds = f !== null && f >= .12 && f <= .9 ? f : null;
    const contactSeconds = c !== null && c >= .06 && c <= .6 ? c : null;
    const heightM = flightSeconds === null ? null : G * flightSeconds ** 2 / 8;
    const rsi = i && heightM !== null && contactSeconds !== null ? heightM / contactSeconds : null;
    const failed = analysis.footRefinement?.events.filter(e => (e.jump === j.jump || i > 0 && e.jump === analysis.jumps[i - 1].jump && e.kind === 'landing') && !e.applied);
    return { jump: j.jump, takeoff, landing, flightSeconds, contactSeconds, heightM, rsi,
      reason: i === 0 ? heightM === null ? '最初の跳躍はRSI対象外・高さも判定不成立' : '最初の跳躍は高さのみ' : rsi !== null ? null : '足元の自動判定が不成立（平均から除外）',
      diagnostics: failed?.map(e => `${e.jump}回目 ${e.kind === 'takeoff' ? '離地' : '着地'}：${e.reason}`) ?? [] };
  });
  const accepted = jumps.filter(j => j.rsi !== null);
  const heights = jumps.flatMap(j => j.heightM === null ? [] : [j.heightM]);
  const expected = Math.max(0, jumps.length - 1);
  return { version: 'rj-automatic-foot-v2', validated: false as const, manualEventInputsUsed: false,
    manualLengthInputsUsed: false, referenceRSIUsed: false, policy: 'IMAGE_SUPPORTED_EVENTS_ONLY',
    recognizedJumps: analysis.detected, expectedRSICount: expected, acceptedRSICount: accepted.length,
    acceptedJumpNumbers: accepted.map(j => j.jump), partial: accepted.length < expected,
    meanRSI: accepted.length ? accepted.reduce((s, j) => s + j.rsi!, 0) / accepted.length : null,
    maxRSI: accepted.length ? Math.max(...accepted.map(j => j.rsi!)) : null,
    meanHeightM: heights.length ? heights.reduce((s, h) => s + h, 0) / heights.length : null,
    heightCount: heights.length, reason: analysis.reason, jumps };
}
export type AutomaticFootResult = ReturnType<typeof automaticFootResult>;
