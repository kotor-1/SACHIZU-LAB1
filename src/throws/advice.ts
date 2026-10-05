import type { HurdleAdvice } from '../hurdling/advice';
import type { ReleaseMeasures, ThrowResult } from './analysis';

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
 *   3 elite men). No values were found for the power position's angles.
 * Added with the release (2026-10-06, the user chose them all; checked in the tables):
 * - javelin release, Bennett et al. 2018 (London 2017 finals): speed men 27.9 ± 0.7, women 24.3 ± 1.0 m/s;
 *   angle 34.4 ± 2.7° / 34.9 ± 3.3°; height (grip) 2.00 ± 0.12 / 1.86 ± 0.10 m; attitude 39.6 ± 4.2° /
 *   40.7 ± 5.7°; angle of attack 5.2 ± 3.7° / 5.9 ± 6.4°. 瀧川ら 2020 (Japanese women finalists): 22.6 ±
 *   0.7 m/s; and the centre of mass's forward speed fell 44 ± 8% from the block contact to the release.
 *   For ジャベリックスロー (前田・丹松 2008, junior high): release angles mostly 30-45°, attack -5 to 50°.
 * - glide shot put, Dinsdale et al. 2018 (London 2017, women gliders): release 12.67 ± 0.32 m/s, 36.4 ±
 *   1.3°, 2.07 ± 0.04 m = 116 ± 3% of the height; stance at the power position 1.08 ± 0.15 m = 0.61 ±
 *   0.09 of the height; glide 0.80 ± 0.12 m. 加藤ら 2019 (Japan's top 3 women): 11.90 ± 0.12 m/s, 33.7 ±
 *   1.5°. Schaa 2010 (Berlin 2009, men gliders): stance 1.25 ± 0.07 m, glide 0.90 ± 0.03 m. */
export const THROW_GUIDE = {
  javDelivery: { men: .129, women: .141 },
  blockKnee: { contact: [158, 178], least: [137, 163], release: [137, 173] },
  javTrunkBack: { men: 14, women: 16 },
  shotTimes: { glide: .136, transition: .112, delivery: .252 },
  shotTimesJapan: { glide: .148, transition: .165, delivery: .233 },
  shotRelease: { trunk: 6, frontKnee: 173, rearKnee: 142 },
  javRelease: { speed: { men: 27.9, women: 24.3, japanWomen: 22.6 }, angle: { men: 34.4, women: 34.9 }, height: { men: 2.00, women: 1.86 },
    attitude: { men: 39.6, women: 40.7 }, attack: { men: 5.2, women: 5.9 }, attackRange: [-.3, 10.1] },
  javDeceleration: .44,
  shotReleaseFull: { speed: 12.67, speedJapan: 11.90, angle: 36.4, angleJapan: 33.7, height: 2.07, heightShare: 1.16 },
  shotStance: { women: 1.08, share: .61, men: 1.25 },
  shotGlide: { women: .80, men: .90 },
} as const;
/** Differences within these are within the analysis's error: a knee angle in a side view, a time to a frame or two at 120 fps. */
const SLACK = { knee: 10, seconds: .02 };
const deg = (v: number) => `${Math.round(v)}°`;
/** Speeds are shown per hour (the user, 2026-10-06: 「リリース速度は時速じゃないとわかりにくい」); m/s beside them. */
export const kmh = (mps: number) => Math.round(mps * 3.6);
/** The speed and the metres are rough values (the user, 2026-10-06: 「正直に目安ですと書いておこう」): against the
 * speeds the records give they differed by 7% on average and 13% at most, so they are shown with ±SPREAD. */
export const SPREAD = .10;
/** A speed (m/s) as 「約62km（目安 56〜68km）」 per hour. */
export const speedRange = (mps: number) => `約${kmh(mps)}km（目安 ${kmh(mps * (1 - SPREAD))}〜${kmh(mps * (1 + SPREAD))}km）`;
const sec = (v: number) => `${v.toFixed(3)}秒`;
const lean = (v: number) => v < 0 ? `後ろへ ${deg(-v)}` : `前へ ${deg(v)}`;

/** Release items (with the implement's flight) and the added posture items. */
function releaseAdvice(r: ThrowResult, rel: ReleaseMeasures | null): HurdleAdvice[] {
  const out: HurdleAdvice[] = [], G = THROW_GUIDE;
  if (!rel) return out;
  if (r.event === 'jav') {
    const J = G.javRelease;
    if (rel.speed !== null) out.push({ topic: 'リリース速度', level: 'info', text: `時速${speedRange(rel.speed)}。動画から推定した目安の値です（記録から求めた値との差は平均7%・最大13%）。参考：世界選手権の決勝のやり投げで男子 時速${kmh(J.speed.men)}km・女子 時速${kmh(J.speed.women)}km、日本選手権女子 時速${kmh(J.speed.japanWomen)}km。用具が軽いジャベリックスローとは比べられません）。` });
    if (rel.angle !== null) out.push({ topic: 'リリース角度', level: rel.angle < 25 || rel.angle > 45 ? 'check' : 'good',
      text: `${Math.round(rel.angle)}°（参考：世界選手権の決勝で男子 ${J.angle.men}°・女子 ${J.angle.women}°。ジャベリックスローの中学生は多くが30〜45°）。${rel.angle < 25 ? '低めに出ています。' : rel.angle > 45 ? '高めに出ています。' : ''}` });
    if (rel.attack !== null && rel.attitude !== null) out.push({ topic: '迎え角', level: rel.attack > J.attackRange[1] + 5 ? 'check' : 'good',
      text: `やりの向き ${Math.round(rel.attitude)}°、飛び出す角度との差（迎え角）${rel.attack >= 0 ? '+' : ''}${Math.round(rel.attack)}°（参考：世界選手権の決勝で迎え角 男子 ${J.attack.men}°・女子 ${J.attack.women}° 前後）。${rel.attack > J.attackRange[1] + 5 ? 'やりの先が飛ぶ向きより上を向いています。' : ''}` });
    if (r.com.atStart && r.com.atRelease !== null) {
      const loss = 1 - r.com.atRelease / r.com.atStart;
      out.push({ topic: 'ブロックでの減速', level: 'info', text: `重心の前に進む速さが、ブロック脚の接地からリリースまでに ${Math.round(loss * 100)}% 落ちています（参考：日本選手権女子で ${Math.round(G.javDeceleration * 100)}% 前後。値は±10ポイントほどぶれます）。` });
    }
    return out;
  }
  const S = G.shotReleaseFull;
  if (rel.speed !== null) out.push({ topic: 'リリース速度', level: 'info', text: `時速${speedRange(rel.speed)}。動画から推定した目安の値です（記録から求めた値との差は平均7%・最大13%）。参考：世界選手権の女子決勝 時速${kmh(S.speed)}km、日本のトップ3女子 時速${kmh(S.speedJapan)}km。砲丸の重さで変わります）。` });
  if (rel.angle !== null) out.push({ topic: 'リリース角度', level: rel.angle < 28 || rel.angle > 45 ? 'check' : 'good',
    text: `${Math.round(rel.angle)}°（参考：世界選手権の女子決勝 ${S.angle}°、日本のトップ3女子 ${S.angleJapan}°）。${rel.angle < 28 ? '低めに出ています。' : rel.angle > 45 ? '高めに出ています。' : ''}` });
  if (rel.heightShare !== null) out.push({ topic: 'リリースの高さ', level: 'info', text: `身長の ${Math.round(rel.heightShare * 100)}%${rel.height !== null ? `（約${rel.height.toFixed(2)} m）` : ''}（参考：世界選手権の女子決勝 ${Math.round(S.heightShare * 100)}%・${S.height} m）。` });
  return out;
}

export function throwAdvice(r: ThrowResult, rel: ReleaseMeasures | null = null, heightM: number | null = null): HurdleAdvice[] {
  const out: HurdleAdvice[] = [], G = THROW_GUIDE, k = r.frontKnee, t = r.times;
  out.push(...releaseAdvice(r, rel));
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
      out.push({ topic: '上体', level: 'info', text: `ブロック脚の接地で、上体は${lean(r.trunk.atStart)}傾いています（参考：世界選手権の決勝で後ろへ 男子 ${G.javTrunkBack.men}°・女子 ${G.javTrunkBack.women}° 前後）。${r.trunk.atRelease !== null ? `リリースでは${lean(r.trunk.atRelease)}。` : ''}` });
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
  if (r.stancePx !== null && r.bodyPx) {
    const share = r.stancePx / r.bodyPx;
    out.push({ topic: '足幅', level: 'info', text: `${glide ? '前足の接地' : '突き出しの開始'}で、前後の足の間は身長の ${Math.round(share * 100)}%${heightM ? `（約${(share * heightM).toFixed(2)} m）` : ''}（参考：世界選手権の女子決勝のグライドで身長の ${Math.round(G.shotStance.share * 100)}%・${G.shotStance.women} m）。` });
  }
  if (glide && r.glidePx !== null && r.bodyPx && heightM)
    out.push({ topic: 'グライドの距離', level: 'info', text: `後ろ足が進んだ距離 約${(r.glidePx / r.bodyPx * heightM).toFixed(2)} m（参考：世界選手権の女子決勝 ${G.shotGlide.women} m、男子 ${G.shotGlide.men} m）。` });
  if (r.trunk.atStart !== null && r.trunk.atRelease !== null)
    out.push({ topic: '上体の起こし', level: 'info', text: `${glide ? '前足の接地' : '突き出しの開始'}からリリースまでに上体を ${Math.round(r.trunk.atRelease - r.trunk.atStart)}° 起こしています。` });
  if (r.rearKnee.atStart !== null && r.rearKnee.atRelease !== null)
    out.push({ topic: '後ろ脚の伸び', level: 'info', text: `後ろ膝 ${deg(r.rearKnee.atStart)} → リリース ${deg(r.rearKnee.atRelease)}（参考：トップ選手のリリースの後ろ膝 ${G.shotRelease.rearKnee}°前後）。` });
  if (k.atStart !== null && k.least !== null)
    out.push({ topic: '前脚の膝', level: 'info', text: `${glide ? '接地' : '突き出しの開始'} ${deg(k.atStart)}、最も曲がった時 ${deg(k.least)}。研究で比べられる値は見つかりませんでした。` });
  if (k.atRelease !== null)
    out.push({ topic: 'リリース', level: k.atRelease < G.shotRelease.frontKnee - 2 * SLACK.knee ? 'check' : 'good',
      text: `リリースのときの前脚の膝 ${deg(k.atRelease)}（参考：トップ選手 ${G.shotRelease.frontKnee}°前後）。${k.atRelease < G.shotRelease.frontKnee - 2 * SLACK.knee ? '前脚が曲がったまま突き出しています。' : ''}` });
  if (r.trunk.atRelease !== null)
    out.push({ topic: 'リリース', level: 'info', text: `リリースのときの上体は${lean(r.trunk.atRelease)}（参考：世界選手権の女子決勝で前へ ${G.shotRelease.trunk}°前後）。` });
  return out;
}
