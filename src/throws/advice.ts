import type { HurdleAdvice } from '../hurdling/advice';
import type { ThrowResult } from './analysis';

/** Reference values from studies of top throwers, to read a throw by; not
 * targets for one athlete. The user chose the measures (2026-10-05): the
 * javelin's block knee (at contact, most bent, at release) with the time from
 * the block contact to the release; the shot put's phase times and its power
 * position. Sources (docs/Throws_v1_20261005.md; checked in the full text or its tables):
 * - javelin, block contact to release: Bennett, Walker & Bissas 2018 (World
 *   Championships London 2017 finals, 150 Hz 3D): men 0.129 ± 0.013 s, women
 *   0.141 ± 0.012 s; Campos et al. 2004 (Sevilla 1999 men's final): 0.11-0.14 s;
 *   瀧川ら 2020 (Japanese women finalists): 0.132 ± 0.023 s.
 * - javelin block knee (180 = straight): Campos et al. 2004 (n=7 men): contact
 *   158-178°, most bent 137-163°, release 137-173°; Bennett et al. 2018 at
 *   release: men 162 ± 22°, women 169 ± 17°.
 * - javelin trunk at block contact (backward lean from vertical): Bennett et
 *   al. 2018: men 14 ± 3°, women 16 ± 4°; 田内ら 2012 (n=91 men): about 15°.
 * - glide shot put, women's world finalists (Dinsdale, Thomas & Bissas 2018,
 *   London 2017, 7 glide throwers): glide 0.136 ± 0.014 s, right-foot to
 *   left-foot touchdown 0.112 ± 0.039 s, left-foot touchdown to release 0.252 ±
 *   0.028 s; 田内ら 2006 (Japan's top 8 women): 0.148 / 0.165 / 0.233 s.
 * - glide shot put at release: trunk forward 6 ± 6° (Dinsdale et al. 2018,
 *   women); knees, front 173 ± 3°, rear 142 ± 11° (Mastalerz & Sadowski 2022,
 *   3 elite men). No values were found for the power position's angles. */
export const THROW_GUIDE = {
  javDelivery: { men: .129, women: .141 },
  blockKnee: { contact: [158, 178], least: [137, 163], release: [137, 173] },
  javTrunkBack: { men: 14, women: 16 },
  shotTimes: { glide: .136, transition: .112, delivery: .252 },
  shotTimesJapan: { glide: .148, transition: .165, delivery: .233 },
  shotRelease: { trunk: 6, frontKnee: 173, rearKnee: 142 },
} as const;
/** Differences within these are within the analysis's error: a knee angle in a side view, a time to a frame or two at 120 fps. */
const SLACK = { knee: 10, seconds: .02 };
const deg = (v: number) => `${Math.round(v)}°`;
const sec = (v: number) => `${v.toFixed(3)}秒`;
const lean = (v: number) => v < 0 ? `後ろへ ${deg(-v)}` : `前へ ${deg(v)}`;

export function throwAdvice(r: ThrowResult): HurdleAdvice[] {
  const out: HurdleAdvice[] = [], G = THROW_GUIDE, k = r.frontKnee, t = r.times;
  if (r.event === 'jav') {
    const [c0, c1] = G.blockKnee.contact, [l0, l1] = G.blockKnee.least, [r0, r1] = G.blockKnee.release;
    if (k.atStart !== null && r.deliveryStart && r.front !== null && r.contacts[r.front].touchdown !== null)
      out.push({ topic: 'ブロック脚の接地', level: k.atStart < c0 - SLACK.knee ? 'check' : 'good',
        text: `接地したときの膝 ${deg(k.atStart)}（参考：トップ選手 ${c0}〜${c1}°）。${k.atStart < c0 - SLACK.knee ? '膝を曲げて着いています。スロー再生で、脚を前に伸ばして着いているかを確かめてください。' : ''}` });
    if (k.least !== null)
      out.push({ topic: 'ブロック脚の膝', level: k.least < l0 - SLACK.knee ? 'check' : 'good',
        text: `接地からリリースまでで最も曲がったとき ${deg(k.least)}（参考：トップ選手 ${l0}〜${l1}°）。${k.least < l0 - SLACK.knee ? '膝が大きく曲がっています（ブロックが効かず、体が前へ流れていないか）。' : ''}` });
    if (k.atRelease !== null)
      out.push({ topic: 'リリース', level: k.atRelease < r0 - SLACK.knee ? 'check' : 'good',
        text: `リリースのときの膝 ${deg(k.atRelease)}（参考：トップ選手 ${r0}〜${r1}°）。${k.atRelease < r0 - SLACK.knee ? '膝が曲がったまま投げています。' : ''}` });
    if (t.delivery !== null && r.deliveryStart)
      out.push({ topic: '投げの時間', level: 'info',
        text: `${r.front !== null && r.contacts[r.front].touchdown !== null ? 'ブロック脚の接地' : '投げ始め'}からリリースまで ${sec(t.delivery)}（参考：世界選手権の決勝で男子 ${G.javDelivery.men}秒・女子 ${G.javDelivery.women}秒。助走の速さや用具で変わります）。` });
    if (r.trunk.atStart !== null)
      out.push({ topic: '上体', level: 'info', text: `ブロック脚の接地で、上体は${lean(r.trunk.atStart)}傾いています（参考：世界選手権の決勝で後ろへ 男子 ${G.javTrunkBack.men}°・女子 ${G.javTrunkBack.women}° 前後）。` });
    return out;
  }
  const glide = r.style === 'glide';
  if (glide && t.glide !== null)
    out.push({ topic: 'グライド', level: 'info', text: `後ろ足が離れてから着くまで ${sec(t.glide)}（参考：世界選手権の女子決勝 ${G.shotTimes.glide}秒、日本のトップ8女子 ${G.shotTimesJapan.glide}秒）。` });
  if (glide && t.rearToFront !== null) {
    const long = t.rearToFront > G.shotTimesJapan.transition + .06 + SLACK.seconds;
    out.push({ topic: '移行局面', level: long ? 'check' : 'good',
      text: `${r.hand === 'right' ? '右足' : '左足'}の接地から${r.hand === 'right' ? '左足' : '右足'}の接地まで ${sec(t.rearToFront)}（参考：世界選手権の女子決勝 ${G.shotTimes.transition}秒、日本のトップ8女子 ${G.shotTimesJapan.transition}秒。短いほど両足が早くそろいます）。${long ? '前足が着くまでに時間がかかっています。' : ''}` });
  }
  if (t.delivery !== null)
    out.push({ topic: '突き出し', level: 'info', text: glide
      ? `前足の接地からリリースまで ${sec(t.delivery)}（参考：世界選手権の女子決勝 ${G.shotTimes.delivery}秒、日本のトップ8女子 ${G.shotTimesJapan.delivery}秒）。`
      : `腰が最も後ろにきてからリリースまで ${sec(t.delivery)}。` });
  if (r.rearKnee.atStart !== null || r.trunk.atStart !== null)
    out.push({ topic: 'パワーポジション', level: 'info', text: `${glide ? '前足の接地' : '突き出しの開始'}で、後ろ脚の膝 ${r.rearKnee.atStart === null ? '—' : deg(r.rearKnee.atStart)}・上体は${r.trunk.atStart === null ? '—' : lean(r.trunk.atStart)}。研究で比べられる値は見つかりませんでした。同じ選手の試技どうしで比べてください。` });
  if (k.atRelease !== null)
    out.push({ topic: 'リリース', level: k.atRelease < G.shotRelease.frontKnee - 2 * SLACK.knee ? 'check' : 'good',
      text: `リリースのときの前脚の膝 ${deg(k.atRelease)}（参考：トップ選手 ${G.shotRelease.frontKnee}°前後）。${k.atRelease < G.shotRelease.frontKnee - 2 * SLACK.knee ? '前脚が曲がったまま突き出しています。' : ''}` });
  if (r.trunk.atRelease !== null)
    out.push({ topic: 'リリース', level: 'info', text: `リリースのときの上体は${lean(r.trunk.atRelease)}（参考：世界選手権の女子決勝で前へ ${G.shotRelease.trunk}°前後）。` });
  return out;
}
