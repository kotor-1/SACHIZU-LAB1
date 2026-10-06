import type { HurdleAdvice } from '../hurdling/advice';
import { mps, type LongJumpResult } from './analysis';

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
/** Speeds and metres are rough values with ±SPREAD (as the throws). */
export const SPREAD = .10;
export const kmh = (v: number) => Math.round(v * 3.6);
/** The last step's speed against the one before: a change within this is not told apart. */
export const STEADY = .05;

export function longJumpAdvice(r: LongJumpResult): HurdleAdvice[] {
  const out: HurdleAdvice[] = [], G = LONG_JUMP_GUIDE;
  const v = mps(r, r.speed.lastTwoPx) ?? mps(r, r.speed.touchdownPx);
  if (v !== null)
    out.push({ topic: '助走速度', level: 'info', text: `最後の2歩で ${v.toFixed(1)} m/秒（時速約${kmh(v)}km、目安 ${(v * (1 - SPREAD)).toFixed(1)}〜${(v * (1 + SPREAD)).toFixed(1)} m/秒）。研究では助走速度が記録と最も強く結びつき、0.1 m/秒速いと記録は約13cm長い傾向です（参考：関西学生女子の踏切前の速さ ${G.speedWomen} m/秒）。` });
  const [s1, s2] = r.steps, a = mps(r, s1?.speedPx ?? null), b = mps(r, s2?.speedPx ?? null);
  if (a !== null && b !== null) {
    // Within ±STEADY the two are the same as far as the video tells: between the browsers the change differed up to
    // 5 points (+2% / −3%) on one video.
    const change = a / b - 1;
    out.push({ topic: '最後の1歩の速さ', level: change < -STEADY ? 'check' : 'good',
      text: `2歩前 ${b.toFixed(1)} → 最後の1歩 ${a.toFixed(1)} m/秒（${change >= 0 ? '+' : ''}${Math.round(change * 100)}%）。${change < -STEADY ? '最後の1歩で速さが落ちています。'
        : change > STEADY ? '最後の1歩で速さが上がっています。' : `ほぼ同じ速さで踏切に入れています（${Math.round(STEADY * 100)}%以内の差は測定の誤差の範囲です）。`}` });
  }
  const up = mps(r, r.leave?.verticalPx ?? null), ahead = mps(r, r.leave?.horizontalPx ?? null);
  if (r.leave && up !== null && ahead !== null)
    out.push({ topic: '踏切（離地）', level: 'info', text: `離地の瞬間、鉛直 ${up.toFixed(2)} m/秒・水平 ${ahead.toFixed(2)} m/秒（目安）、踏切角度 ${r.leave.angle.toFixed(1)}°。研究では離地の鉛直速度も女子で記録と結びつきます（参考：女子（平均5.50 m）鉛直${G.leave.vertical}・水平${G.leave.horizontal} m/秒・${G.leave.angle}°）。踏切角度は人ごとに最適が違い（${G.angleRange[0]}〜${G.angleRange[1]}°）、目標にする値ではありません。` });
  if (r.rhythm !== null)
    out.push({ topic: '最後の2歩のリズム', level: 'info', text: `最後の1歩の時間は、その前の歩の ${Math.round(r.rhythm * 100)}%（参考：世界室内の女子決勝の平均から ${Math.round(G.rhythm * 100)}%。最後の1歩を短く速く）。` });
  if (r.posture.legAngle !== null)
    out.push({ topic: '踏切接地の脚', level: 'info', text: `股関節から足首の線が水平から ${Math.round(r.posture.legAngle)}°（参考：トップ選手 男子${G.legAngle.men}°・女子${G.legAngle.women}°前後。小さいほど足を前に着いています）。` });
  if (r.posture.trunkPenult !== null)
    out.push({ topic: '1歩前の上体', level: 'info', text: `1歩前の接地で上体は${r.posture.trunkPenult < 0 ? `後ろへ ${Math.round(-r.posture.trunkPenult)}°` : `前へ ${Math.round(r.posture.trunkPenult)}°`}（踏切の接地で${r.posture.trunk === null ? '—' : r.posture.trunk < 0 ? `後ろへ ${Math.round(-r.posture.trunk)}°` : `前へ ${Math.round(r.posture.trunk)}°`}）。` });
  return out;
}
