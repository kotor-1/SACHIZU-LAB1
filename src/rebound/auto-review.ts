import type { PoseFrame } from './prediction-observations';
import type { JumpMode } from './lower-body';
import type { SignalResult } from './waveform-fit';
import type { Boundary, RegisteredAnalysis } from './registered-template';
import { correctRegistered } from './registered-corrections';
import type { BoundaryCorrections } from './registered-corrections';

/** Foot-height bands only seed the review cursor. These are NOT verified
 * contact events; never place their RSI in the confirmed aggregate. */
export function autoReview(frames: readonly PoseFrame[], peaks: SignalResult, mode: JumpMode, first = 0): RegisteredAnalysis {
  const chosen = peaks.detected > 11 ? first > 0 ? peaks.peaks.slice(first - 1, first + 9) : []
    : peaks.peaks.slice(0, peaks.detected === 11 ? 10 : peaks.detected);
  const result: RegisteredAnalysis = { version: 'rj-auto-review-v1', validated: false, registration: null,
    reason: chosen.length ? null : peaks.detected > 11 ? '解析する10回の範囲を選んでください。' : peaks.reason === 'FRAME_RATE_TOO_LOW'
      ? '時間軸から確認したフレームレートが不足しています。120/240fpsの元動画を使ってください。スロー書き出しには対応していません。'
      : '跳躍を認識できませんでした。対象者の枠と映像を確認してください。',
    detected: peaks.detected, selectedPeakFrames: chosen.map(p => p.frame), excludedPeakFrames: peaks.peaks.filter(p => !chosen.includes(p)).map(p => p.frame),
    jumps: [], fits: [], validRSICount: 0, meanRSI: null, maxRSI: null,
    warnings: ['足元の高さから作る未確認の候補です。靴底と床の接触を確認した値ではありません。',
      '確認済みRSIには、その回の離地・着地と、直前の着地の3箇所の確認が必要です。',
      '高さは滞空時間からの推定で、離地・着地の重心高が等しい仮定を含みます。'] };
  const indices = mode === 'RIGHT' ? [30, 32] : mode === 'LEFT' ? [29, 31] : [29, 30, 31, 32];
  const rows = frames.map(f => {
    const feet = f.poses.length === 1 ? indices.map(i => f.poses[0][i]) : [];
    const good = feet.length === indices.length && feet.every(p => p && Number.isFinite(p.y) && p.y > 0 && p.y < 1 && p.visibility >= .5);
    return { ...f, y: good ? Math.max(...feet.map(p => p.y)) : null };
  });
  for (let k = 0; k < chosen.length; k++) {
    const apex = chosen[k], index = peaks.peaks.indexOf(apex);
    const start = index > 0 ? (peaks.peaks[index - 1].pts + apex.pts) / 2 : apex.pts - .7;
    const end = peaks.peaks[index + 1] ? (apex.pts + peaks.peaks[index + 1].pts) / 2 : apex.pts + .7;
    const local = rows.filter(f => f.pts >= start && f.pts <= end);
    const ys = local.flatMap(f => f.y === null ? [] : [f.y]).sort((a,b) => a-b);
    let takeoff: Boundary | null = null, landing: Boundary | null = null;
    if (ys.length >= 12 && ys.length >= local.length * .85) {
      const floor = ys[Math.floor((ys.length - 1) * .9)];
      const top = ys[Math.floor((ys.length - 1) * .1)], clearance = floor - top;
      if (clearance >= .025) {
        const air = (i: number) => local[i]?.y != null && floor - local[i].y! > Math.max(.008, clearance * .12);
        const continuous = (i: number) => local.slice(i, i+4).length === 4 && local.slice(i, i+4).every((p,j) => p.y !== null && (!j || p.pts - local[i+j-1].pts <= .026));
        for (let i=1; i+3<local.length; i++) {
          if (local[i].pts < apex.pts && local[i-1].y !== null && !air(i-1) && air(i) && air(i+1) && air(i+2) && continuous(i-1))
            takeoff = {pts:local[i].pts,source:'AUTO_FOOT'};
          if (!landing && local[i].pts > apex.pts && air(i-1) && !air(i) && !air(i+1) && !air(i+2) && continuous(i-1))
            landing = {pts:local[i].pts,source:'AUTO_FOOT'};
        }
      }
    }
    if (takeoff && landing && (landing.pts-takeoff.pts < .12 || landing.pts-takeoff.pts > .9)) { takeoff=null; landing=null; }
    const previous = result.jumps.at(-1)?.landing;
    if (previous && takeoff && (takeoff.pts-previous.pts < .06 || takeoff.pts-previous.pts > .6)) takeoff=null;
    result.jumps.push({ jump:k+1,takeoff,landing,contactSeconds:null,flightSeconds:null,heightM:null,rsi:null,
      contactSource:null,flightSource:null,reason:'未確認：映像で接地・離地を確認してください。' });
  }
  return result.jumps.length ? correctRegistered(result, {}, frames).analysis : result;
}

export function reviewSummary(result: RegisteredAnalysis) {
  const confirmed = result.jumps.filter(j => j.rsi !== null && j.contactSource === 'MANUAL' && j.flightSource === 'MANUAL');
  return { jumpNumbers: confirmed.map(j => j.jump), count: confirmed.length,
    mean: confirmed.length ? confirmed.reduce((sum,j) => sum+j.rsi!,0)/confirmed.length : null,
    max: confirmed.length ? Math.max(...confirmed.map(j=>j.rsi!)) : null };
}

/** Keep tentative arithmetic explicitly separate, including in exported data. */
export function reviewedExport(result: RegisteredAnalysis, original: RegisteredAnalysis, corrections: BoundaryCorrections, file: {name: string; size: number}) {
  const confirmed = reviewSummary(result);
  return { version: 'rj-reviewed-v3', file: {name: file.name, size: file.size}, referenceUsed: false,
    aggregation: { policy: 'CONFIRMED_EVENTS_ONLY', selectedJumps: result.jumps.map(j => j.jump),
      rsiJumps: confirmed.jumpNumbers, validRSICount: confirmed.count, expectedRSICount: Math.max(0, result.jumps.length-1) },
    tentativeSummary: { meanRSI: result.meanRSI, maxRSI: result.maxRSI, validRSICount: result.validRSICount },
    corrections, original,
    analysis: { ...result, meanRSI: confirmed.mean, maxRSI: confirmed.max, validRSICount: confirmed.count,
      jumps: result.jumps.map(j => ({ ...j, reviewStatus: confirmed.jumpNumbers.includes(j.jump) ? 'CONFIRMED' : j.jump === 1 && j.flightSource === 'MANUAL' ? 'HEIGHT_CONFIRMED' : 'UNCONFIRMED' })) } };
}

export function reviewedCSV(result: RegisteredAnalysis) {
  const summary = reviewSummary(result);
  return ['jump,review_status,height_m,contact_s,flight_s,rsi_m_s,takeoff_s,landing_s,takeoff_source,landing_source,contact_source,flight_source,confirmed_mean_rsi,confirmed_max_rsi,confirmed_count',
    ...result.jumps.map(j => [j.jump, summary.jumpNumbers.includes(j.jump) ? 'CONFIRMED' : j.jump === 1 && j.flightSource === 'MANUAL' ? 'HEIGHT_CONFIRMED' : 'UNCONFIRMED',
      j.heightM,j.contactSeconds,j.flightSeconds,j.rsi,j.takeoff?.pts,j.landing?.pts,j.takeoff?.source,j.landing?.source,j.contactSource,j.flightSource,
      summary.mean,summary.max,summary.count].map(v => v ?? '').join(','))].join('\n');
}
