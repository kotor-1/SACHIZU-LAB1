import type { Advice } from '../sprint10/crouch-advice';
import type { HighJumpResult } from './analysis';

/** Reference values from studies, to read a takeoff by; not targets for one
 * athlete. The scissors jump's from school children (the user's videos);
 * the flop's from high school and elite jumpers, for comparison. Sources
 * (docs/HighJump_Research_20261006.md, read in full):
 * - upward speed at the toe-off: 吉田・藤田 2017 (体育学研究 62: 723-737; junior
 *   high school scissors, 22 pupils, before and after 8 lessons): 2.38-2.77 m/s
 *   (group means); 礒崎・小山 2013 (陸上競技研究紀要 9: 99-103; flop): high school
 *   4.39 ± 0.18, Japanese elite 4.65 ± 0.24 m/s; Nicholson et al. 2024 (world
 *   indoor final men) 4.62 ± 0.19 m/s. The rise it gives decides the record
 *   (柴田ら 2019, 陸上競技研究紀要 15: rise and peak height r = 0.85; 杉浦ら 2021,
 *   体育学研究 66: 827-839).
 * - peak height of the centre of mass: 吉田・藤田 2017, 1.40-1.51 m (records 1.03-1.25 m).
 * - rhythm, touchdown to touchdown: 吉田・藤田 2017, the step two before 0.29-0.32 s,
 *   the last 0.23-0.26 s (「タタタン」 after the lessons in grade 3, with a higher
 *   takeoff angle and conversion); Ljubičić 2024 (Studia Sportiva 18(1), 123
 *   children 7-12, scissors, one camera at 250 fps): the quicker the step before
 *   the takeoff, the higher the bar (β = −0.43); 藤田ら 2010 (体育学研究 55(2):
 *   539-552, grades 5-6): the run-up's rhythm related to the record reached.
 * - backward lean at the touchdown (ankle to the centre of mass): 吉田・藤田 2017,
 *   junior high 29-33°; grade 6, 26-33° (後藤ら 1997, as cited there); 藤田ら 2010
 *   (grade 6): the lean from the lowering related to the record reached.
 * - takeoff contact: 吉田・藤田 2017, 0.22-0.24 s; Ljubičić 2024, 0.229 ± 0.040 s.
 * - takeoff knee (touchdown / most bent / toe-off), flop: 礒崎・小山 2013 high
 *   school 163.5 / 138.5 / 173.2°; Nicholson et al. 2024, 162.8 / 140.2 / 170.5°.
 * - takeoff angle and conversion (upward speed at the toe-off over the
 *   horizontal at the touchdown): 吉田・藤田 2017, 38-45° and 51-60%. */
export const HIGH_JUMP_GUIDE = {
  speed: { scissors: [2.4, 2.8], highSchool: 4.39, elite: 4.62 },
  peak: { scissors: [1.40, 1.51] },
  stepBefore: [.29, .32], lastStep: [.23, .26],
  lean: { scissors: [26, 33] },
  contact: [.22, .24], contactChildren: .229,
  knee: { highSchool: [163.5, 138.5, 173.2], elite: [162.8, 140.2, 170.5] },
  angle: [38, 45], conversion: [.51, .60],
} as const;
/** Differences within these are within the analysis's error: the speed (the uprights as the ruler, ±0.1-0.15 m/s; the
 * toe-off found up to 0.012 s late moves it 0.1 m/s), the rhythm (each step ±0.015 s: the ratio ±0.1) and the lean (side view). */
const SLACK = { speed: .15, rhythm: .1, lean: 3 };
const sec = (v: number) => `${v.toFixed(3)}秒`, deg = (v: number) => `${Math.round(v)}°`, cm = (m: number) => `${Math.round(m * 100)}cm`;

export interface HighJumpAdvice extends Omit<Advice, 'level'> { level: Advice['level'] | 'info' }

export function highJumpAdvice(r: HighJumpResult): HighJumpAdvice[] {
  const out: HighJumpAdvice[] = [], G = HIGH_JUMP_GUIDE, l = r.lift;
  if (l) {
    const [lo, hi] = G.speed.scissors, rise = (v: number) => cm(v * v / (2 * 9.81));
    out.push({ topic: '上向きの速さ', level: l.speed < lo - SLACK.speed ? 'check' : 'good',
      text: `踏切の離地で ${l.speed.toFixed(2)} m/s、空中で重心が ${cm(l.h2)} 上がりました。参考：中学生のはさみ跳び ${lo}〜${hi} m/s（${rise(lo)}〜${rise(hi)}）、高校の背面跳び ${G.speed.highSchool} m/s。記録は踏切で得た上向きの速さでほぼ決まります。${l.speed < lo - SLACK.speed ? '踏切の前の沈み込みと、踏切での体の起こし・腕と振り上げ脚の振り上げを、スロー再生で確かめてください。' : ''}` });
    out.push({ topic: '重心の最高点', level: 'info',
      text: `重心の最高点は ${l.peak.toFixed(2)} m（バーの${l.overBar >= 0 ? `${cm(l.overBar)}上` : `${cm(-l.overBar)}下`}）。はさみ跳びは上体を起こして越えるため、重心はバーより高い所を通ります。参考：中学生のはさみ跳び ${G.peak.scissors[0].toFixed(2)}〜${G.peak.scissors[1].toFixed(2)} m（記録 1.03〜1.25 m）。` });
  }
  const t = r.times;
  if (r.rhythm !== null && t.stepBefore !== null && t.lastStep !== null) {
    const steps = `踏切の2歩前→1歩前 ${sec(t.stepBefore)}、1歩前→踏切 ${sec(t.lastStep)}`, ref = `参考：中学生 ${G.stepBefore[0]}〜${G.stepBefore[1]}秒 → ${G.lastStep[0]}〜${G.lastStep[1]}秒`;
    out.push(r.rhythm <= 1 - SLACK.rhythm
      ? { topic: '最後の2歩のリズム', level: 'good', text: `${steps}。最後の1歩がその前より${Math.round((1 - r.rhythm) * 100)}%短く、リズムアップしています（${ref}）。` }
      : r.rhythm < 1
      ? { topic: '最後の2歩のリズム', level: 'info', text: `${steps}。最後の1歩はその前とほぼ同じ速さです（差は測定の誤差の範囲。${ref}）。` }
      : { topic: '最後の2歩のリズム', level: 'check', text: `${steps}。最後の1歩がその前より遅くなっています。研究では、踏切前の1歩が速いほど記録が高く（7〜12歳）、踏切の2〜3歩前からのリズムアップで踏切が上向きになりました（中学生）。${ref}` });
  }
  const lean = r.posture.lean;
  if (lean !== null) {
    const [lo, hi] = G.lean.scissors, ref = `参考：小学6年・中学生のはさみ跳び ${lo}〜${hi}°`;
    out.push(lean < lo - SLACK.lean
      ? { topic: '踏切接地の後傾', level: 'check', text: `足首から重心への線が鉛直から ${deg(lean)} 後ろへ傾いています。小さめで、重心が踏切足の真上に近い状態で接地しています（${ref}）。1歩前の沈み込みから、踏切足を体の前に着けているかを確かめてください。` }
      : lean > hi + SLACK.lean
      ? { topic: '踏切接地の後傾', level: 'info', text: `足首から重心への線が鉛直から ${deg(lean)} 後ろへ傾いています。大きく後傾して接地しています（${ref}）。` }
      : { topic: '踏切接地の後傾', level: 'good', text: `足首から重心への線が鉛直から ${deg(lean)} 後ろへ傾いて接地しています（${ref}）。` });
  }
  if (t.takeoffContact !== null)
    out.push({ topic: '踏切の接地時間', level: 'info', text: `${sec(t.takeoffContact)}。参考：中学生のはさみ跳び ${G.contact[0]}〜${G.contact[1]}秒、7〜12歳 ${G.contactChildren}秒。短いほど良いとは限らず、記録との関係は研究によって違います。` });
  if (l?.angle != null || l?.conversion != null)
    out.push({ topic: '跳び出し', level: 'info', text: `${l.angle != null ? `跳び出しの角度 ${deg(l.angle)}` : ''}${l.angle != null && l.conversion != null ? '、' : ''}${l.conversion != null ? `踏切接地の横の速さのうち ${Math.round(l.conversion * 100)}% を上向きの速さに変えました` : ''}。参考：中学生のはさみ跳び ${G.angle[0]}〜${G.angle[1]}°・${Math.round(G.conversion[0] * 100)}〜${Math.round(G.conversion[1] * 100)}%。` });
  return out;
}
