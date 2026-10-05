import type { Advice } from '../sprint10/crouch-advice';
import { markValue, type HurdleResult } from './analysis';

/** Reference values from studies of hurdlers, to read a clearance by; not
 * targets for one athlete, and from senior hurdles, higher than youths' (the
 * user, 2026-10-05: the centre of mass peaks before the hurdle, and how far
 * before matters). Sources (docs/Hurdle_v1_20261005.md):
 * - peak before the hurdle: McDonald & Dapena 1991 (men 0.03 m, women 0.30 m);
 *   森田ら 1994 (Foster 0.22 m); 谷川ら 2009 (men 0.02-0.11 m); 谷川ら 2010
 *   (women 0.12-0.40 m).
 * - time over the hurdle (takeoff toe-off to landing touchdown): Hanley et al.
 *   2021, world finalists: men 0.33 ± 0.02 s, women 0.28 ± 0.02 s.
 * - lead knee at landing: Bissas et al. 2022 (same finalists): men 166 ± 10°,
 *   women 156 ± 9°; trunk lean from vertical at landing: men 29 ± 6°, women 31 ± 6°
 *   (their 61° and 59° from horizontal). */
export const HURDLE_GUIDE = {
  peakBefore: { men: [.02, .22], women: [.12, .40] },
  clearance: { men: .33, women: .28 },
  landingKnee: { men: 166, women: 156 },
  landingTrunk: { men: 29, women: 31 },
} as const;
/** Differences within these are within the analysis's error: the peak's place
 * (window and scale checks moved it by up to about 5 cm), the knee (side view). */
const SLACK = { peak: .05, knee: 10 };
const cm = (m: number) => `${Math.round(Math.abs(m) * 100)}cm`;
const deg = (v: number) => `${Math.round(v)}°`;

export interface HurdleAdvice extends Omit<Advice, 'level'> { level: Advice['level'] | 'info' }

export function hurdleAdvice(r: HurdleResult): HurdleAdvice[] {
  const out: HurdleAdvice[] = [];
  const a = r.apex, G = HURDLE_GUIDE;
  const ranges = `男子 ${G.peakBefore.men[0].toFixed(2)}〜${G.peakBefore.men[1].toFixed(2)}m、女子 ${G.peakBefore.women[0].toFixed(2)}〜${G.peakBefore.women[1].toFixed(2)}m 手前`, refs = `トップ選手では${ranges}`;
  if (a?.beforeM != null) {
    const m = a.beforeM;
    out.push(m < -SLACK.peak
      ? { topic: '重心最高点', level: 'check', text: `ハードルを越えてから ${cm(m)} 先で最高点になっています（${refs}）。踏切の位置や、踏切で上へ跳び上がっていないかを、スロー再生で確かめてください。` }
      : m > G.peakBefore.women[1] + SLACK.peak
      ? { topic: '重心最高点', level: 'check', text: `ハードルの ${cm(m)} 手前で最高点になっています。トップ選手（${ranges}）より手前です。踏切の位置（ハードルからの遠さ）を、スロー再生で確かめてください。` }
      : m <= SLACK.peak
      ? { topic: '重心最高点', level: 'good', text: `ほぼハードルの真上で最高点です（${refs}）。` }
      : { topic: '重心最高点', level: 'good', text: `ハードルの ${cm(m)} 手前で最高点になっています（${refs}）。` });
  } else if (a?.beforeSeconds != null)
    out.push({ topic: '重心最高点', level: a.beforeSeconds < 0 ? 'check' : 'good',
      text: a.beforeSeconds < 0 ? `重心がハードルの上を通ってから ${Math.abs(a.beforeSeconds).toFixed(3)}秒後に最高点です。トップ選手ではハードルの手前で最高点になります。`
        : `重心がハードルの上を通る ${a.beforeSeconds.toFixed(3)}秒前に最高点です（トップ選手でもハードルの手前）。` });

  if (r.times.clearance !== null)
    out.push({ topic: '空中時間', level: 'info', text: `踏切の離地から着地まで ${r.times.clearance.toFixed(3)}秒。参考：世界大会の決勝の選手で男子 ${G.clearance.men}秒・女子 ${G.clearance.women}秒（ハードルが高く、走る速さも違います）。` });
  const knee = markValue(r, 'landing', 'リード膝');
  if (knee !== null)
    out.push(knee < G.landingKnee.women - SLACK.knee - 9
      ? { topic: '着地', level: 'check', text: `着地のリード脚の膝 ${deg(knee)}：大きく曲がって着いています（参考：トップ選手 男子 ${G.landingKnee.men}°・女子 ${G.landingKnee.women}° 前後）。` }
      : { topic: '着地', level: 'good', text: `着地のリード脚の膝 ${deg(knee)}（参考：トップ選手 男子 ${G.landingKnee.men}°・女子 ${G.landingKnee.women}° 前後）。` });
  const trunk = markValue(r, 'landing', '体幹');
  if (trunk !== null)
    out.push({ topic: '着地', level: 'info', text: `着地の体幹の前傾 ${deg(trunk)}（参考：トップ選手 男子 ${G.landingTrunk.men}°・女子 ${G.landingTrunk.women}° 前後）。` });
  return out;
}
