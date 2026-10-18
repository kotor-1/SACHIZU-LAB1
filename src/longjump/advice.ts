import type { HurdleAdvice } from '../hurdling/advice';
import { mps, SPREADS, type LongJumpResult } from './analysis';

/** Reference values, from studies (docs/LongJump_MainMeasures_Research_20261006.md; checked in the full text or tables
 * unless marked): not targets for one athlete.
 * - run-up speed: 太田ら 2010 (コーチング学研究 24(1), Kansai students): speed 7-2 m before the board and the
 *   distance r = 0.858 men / 0.811 women; women (4.28-5.88 m) 8.28 ± 0.37 m/s. Across levels from high school to
 *   elite, 0.1 m/s faster went with 12.8 cm longer (Hay 1993, as Bridgett & Linthorne 2006 report it).
 * - the last steps' rhythm: the world indoor 2018 women's final (Tucker & Bissas 2018): contacts 0.105 / 0.113 /
 *   0.122 s, flights 0.112 / 0.136 / 0.075 s over the last three steps; the last step's time over the one before's,
 *   computed from these means, 0.79.
 * - the leg at the takeoff touchdown (hip to ankle below horizontal): Bridgett & Linthorne 2006 61 ± 3°, Nemtsev et al.
 *   2016 women 59.6 ± 2.8°.
 * - the takeoff's contact: Nemtsev et al. 2016 women 0.133 ± 0.011 s (shorter with longer jumps, r = −0.70).
 * - the toe-off: Nemtsev et al. 2016 women (5.50 m on average, 240 Hz side view): horizontal 7.06, vertical 2.75 m/s,
 *   angle 21.3°; with the distance (women) vertical r = 0.61, horizontal r = 0.64. The angle's best is individual,
 *   20.9-25.4° (Linthorne et al. 2005): not a target. */
export const LONG_JUMP_GUIDE = {
  speedWomen: 8.28, gainPerTenth: 12.8,
  rhythm: .79, legAngle: { men: 61, women: 59.6 }, takeoffContact: .133,
  leave: { horizontal: 7.06, vertical: 2.75, angle: 21.3 }, angleRange: [20.9, 25.4],
} as const;
export const kmh = (v: number) => Math.round(v * 3.6);
/** The last step's speed against the one before: a change within this is not told apart. */
export const STEADY = .05;

export function longJumpAdvice(r: LongJumpResult): HurdleAdvice[] {
  const out: HurdleAdvice[] = [], G = LONG_JUMP_GUIDE, SPREAD = r.scale ? SPREADS[r.scale.source] : SPREADS.trunk;
  // The last two steps' speed, else (not both in the picture) the speed at the takeoff's touchdown: said as which.
  const two = mps(r, r.speed.lastTwoPx), v = two ?? mps(r, r.speed.touchdownPx);
  if (v !== null)
    out.push({ topic: '助走速度', level: 'info', text: `${two !== null ? '最後の2歩で' : '踏切の接地の瞬間で'} ${v.toFixed(1)} m/s（時速約${kmh(v)}km、目安 ${(v * (1 - SPREAD)).toFixed(1)}〜${(v * (1 + SPREAD)).toFixed(1)} m/s）。研究では助走速度が記録と最も強く結びつき、0.1 m/s速いと記録は約13cm長い傾向です（参考：記録4.3〜5.9 mの大学生の踏切前の速さ ${G.speedWomen} m/s）。` });
  const [s1, s2] = r.steps, a = mps(r, s1?.speedPx ?? null), b = mps(r, s2?.speedPx ?? null);
  if (a !== null && b !== null) {
    // Within ±STEADY the two are the same as far as the video tells: between the browsers the change differed up to
    // 5 points (+2% / −3%) on one video.
    const change = a / b - 1;
    out.push({ topic: '最後の1歩の速さ', level: change < -STEADY ? 'check' : 'good',
      text: `2歩前 ${b.toFixed(1)} → 最後の1歩 ${a.toFixed(1)} m/s（${change >= 0 ? '+' : ''}${Math.round(change * 100)}%）。${change < -STEADY ? '最後の1歩で速さが落ちています。'
        : change > STEADY ? '最後の1歩で速さが上がっています。' : `ほぼ同じ速さで踏切に入れています（${Math.round(STEADY * 100)}%以内の差は測定の誤差の範囲です）。`}` });
  }
  const up = mps(r, r.leave?.verticalPx ?? null), ahead = mps(r, r.leave?.horizontalPx ?? null);
  if (r.leave && up !== null && ahead !== null)
    out.push({ topic: '踏切（離地）', level: 'info', text: `離地の瞬間、鉛直 ${up.toFixed(2)} m/s・水平 ${ahead.toFixed(2)} m/s（目安）、踏切角度 ${r.leave.angle.toFixed(1)}°。研究では離地の鉛直速度も女子で記録と結びつきます（参考：平均記録5.50 mの選手で 鉛直${G.leave.vertical}・水平${G.leave.horizontal} m/s・${G.leave.angle}°）。踏切角度は人ごとに最適が違い（${G.angleRange[0]}〜${G.angleRange[1]}°）、目標にする値ではありません。` });
  if (r.rhythm !== null)
    out.push({ topic: '最後の2歩のリズム', level: 'info', text: `最後の1歩の時間は、その前の歩の ${Math.round(r.rhythm * 100)}%（参考：世界室内の決勝の平均から ${Math.round(G.rhythm * 100)}%。最後の1歩を短く速く）。` });
  if (r.posture.legAngle !== null)
    out.push({ topic: '踏切接地の脚', level: 'info', text: `股関節から足首の線が水平から ${Math.round(r.posture.legAngle)}°（参考：トップ選手 男子${G.legAngle.men}°・女子${G.legAngle.women}°前後。小さいほど足を前に着いています）。` });
  if (r.posture.trunkPenult !== null)
    out.push({ topic: '1歩前の上体', level: 'info', text: `1歩前の接地で上体は${r.posture.trunkPenult < 0 ? `後ろへ ${Math.round(-r.posture.trunkPenult)}°` : `前へ ${Math.round(r.posture.trunkPenult)}°`}（踏切の接地で${r.posture.trunk === null ? '—' : r.posture.trunk < 0 ? `後ろへ ${Math.round(-r.posture.trunk)}°` : `前へ ${Math.round(r.posture.trunk)}°`}）。` });
  return out;
}

/** The stands' reference values (stand-pick.ts), the same sources as LONG_JUMP_GUIDE, said without men and women: the
 * takeoff's contact of women of 5.50 m on average (0.133 s) and of 17-year-old men of 6.16 m (0.140 s; Nemtsev et al. 2016,
 * 2018); the knee at the takeoff touchdown, women of 5.50 m 165.5° (Nemtsev et al. 2016); the leg's angle about 60°
 * (59.6-61°). A slanted view makes the leg's angle read larger: its forward part shrinks by the cosine of the slant (60°
 * reads 63° at 30° off the side view, 68° at 45°). */
export const STAND_GUIDE = { contact: [.133, .140], knee: 165.5, legAngle: 60, slant: [[30, 63], [45, 68]] } as const;
/** The takeoff's contact this much longer than the reference's upper end reads as a little long, twice as much as long. */
export const STAND_LONGER = .01;

/** The advice from the stands: the takeoff's contact time and the leg's angle at its touchdown first (research ties both to
 * the distance, and neither needs a scale), then the trunk and the knee at the touchdown (reference). */
export function standAdvice(r: LongJumpResult): HurdleAdvice[] {
  const out: HurdleAdvice[] = [], S = STAND_GUIDE, [lo, hi] = S.contact;
  const c = r.takeoffContact;
  if (c !== null) {
    // Within STAND_LONGER over the reference: a frame at 120 fps, and the frames' counting differs by one between studies.
    const level = c <= hi + STAND_LONGER ? 'good' : c <= hi + 3 * STAND_LONGER ? 'info' : 'check';
    out.push({ topic: '踏切の接地時間', level, text: `${c.toFixed(3)}秒（参考値 ${lo.toFixed(3)}〜${hi.toFixed(3)}秒：記録5.5〜6.2 mの選手の平均）。${c <= hi
      ? '参考値並みか短く、素早く踏み切れています。' : level === 'good' ? `参考値並みです（${STAND_LONGER.toFixed(2)}秒ほどの差は、コマの数え方による誤差の範囲です）。`
      : level === 'info' ? '参考値よりやや長めです。接地時間が短いほど遠くへ跳べている傾向があります。'
      : '参考値より長めです。接地時間が短いほど遠くへ跳べている傾向があります。踏切の膝の曲がり（「姿勢」）と合わせて確かめてください。'}` });
  }
  const a = r.posture.legAngle;
  if (a !== null)
    out.push({ topic: '踏切で脚を着く角度', level: 'info', text: `股関節から足首の線が水平から ${Math.round(a)}°（参考値 約${S.legAngle}°）。小さいほど足を体の前に着いていて、記録の良い選手ほど小さい傾向があります。斜めから撮ると大きめに出ます（${S.slant.map(([d, v]) => `斜め${d}°で約${v}°`).join('、')}に見えます）。` });
  const t = r.posture.trunk;
  if (t !== null)
    out.push({ topic: '上体', level: 'info', text: `踏切の接地で${t < 0 ? `後ろへ ${Math.round(-t)}°` : `前へ ${Math.round(t)}°`}（鉛直から。記録との直接の結びつきは見つかっていないため、参考です）。` });
  if (r.posture.knee !== null)
    out.push({ topic: '踏切接地の膝', level: 'info', text: `${Math.round(r.posture.knee)}°（参考値 約${Math.round(S.knee)}°：記録5.50 mの選手の平均。180°が伸び切った状態）。` });
  return out;
}
