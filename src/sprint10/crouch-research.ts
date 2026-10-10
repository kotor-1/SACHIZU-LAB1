/** The crouch start set against the studies, row by row, with a short summary (the user, 2026-10-10: 「数値を見て研究に
 * 対してどうなっているのか簡単でわかりやすい解説」). Each row gives the athlete's value, the studies' value it is set
 * against, and a verdict. Better or worse is said only where the studies tie the value to faster starts; where they do
 * not, or disagree, the row is 参考 (for reference). Values the analysis could not measure are told as such, never guessed.
 *
 * The verdicts: ◎ at the best studied level (the world-class or top sprinters' mean ± SD, or, with trained sprinters only,
 * better than their mean by an SD); ○ within the usual range, or short of the best level by no more than the measuring
 * error; △ where the studies point to more and the gap is larger than the error. The error: 5° for one segment's angle,
 * 8° for the thighs' separation (two segments, the far one partly hidden), 0.01 s for the times. Values are judged as
 * shown (whole degrees, milliseconds).
 *
 * Angles keep the app's own convention (from vertical, forward +: the 姿勢 tab's), except the trunk after the blocks, which
 * the study it is set against gives from horizontal. Studies (docs/Crouch_Start_Research_20261010.md):
 * - Bezodis, Willwacher & Salo 2019 (Sports Med 49:1345, review): set knees, front 91-99° (the faster group more flexed:
 *   Ciacci et al. 2017, 10 men and 10 women, elite and world-class), rear 117-136°; first flight 0.045 ± 0.025 s and first
 *   contact 0.225 s (women) / 0.210 s (men) in Diamond League sprinters (100 m 11.10 / 10.03 s), 0.166 / 0.176 s in the
 *   groups below (11.95 / 10.74 s).
 * - Čoh et al. 1998 (Gymnica 28:33-42; 13 men, 11 women): in the set, the front knee about 103° in women and 94° in men
 *   (p = 0.01); the trunk about 24 ± 5° (women) and 20 ± 9° (men) below horizontal (p = 0.16).
 * - Walker et al. 2021 (J Biomech 124:110554; the eight men of the 2018 World Indoor 60 m final, 150 Hz): first touchdown,
 *   trunk 39 ± 3° and shank 35 ± 3° from horizontal (55° from vertical), thighs' separation −70 ± 15° (r = −0.02 with
 *   the first stance's push); its toe-off, trunk 43 ± 3° (r = −0.59) and separation +102 ± 7° (r = 0.62), the two together
 *   R² = 0.89.
 * - Donaldson, Bezodis & Bayne 2022 (Biol Open 11:bio059501; 15 men, 6 women, 100 m 10.47 / 11.79 s): shank at touchdown
 *   39.7 ± 7.8, 26.4 ± 7.5, 16.5 ± 6.2° from vertical (steps 1-3); thighs' separation 50.1 ± 13.9, 56.6 ± 18.0, 49.6 ± 12.8°
 *   at touchdown (the swing thigh behind) and 88.0 ± 7.5° at the first toe-off; first flight 0.074 ± 0.014 s.
 * - A more forward shank at touchdown: elite against sub-elite sprinters (Donaldson, Bayne & Bezodis 2020, ISBS), and a
 *   larger share of the push forward (2023, J Sports Sci, doi:10.1080/02640414.2023.2172797). The trunk: the elite more
 *   upright than the sub-elite (the same ISBS study), against Walker's forward trunk at toe-off, so 参考 unless at the
 *   world-class value. The thighs: at toe-off tied to acceleration, against the "front-side" idea (Haugen et al. 2018,
 *   IJSPP 13:420); the swing thigh ahead at the other foot's touchdown tied to top speed, not to the start (Miyashiro et
 *   al. 2019, Front Sports Act Living 1:37). */
import type { CrouchResult } from './crouch';

export type Sex = 'female' | 'male';
/** top: the best studied level; ok: within the usual range or the error of the best; improve: where the studies point to
 * more; note: for reference (no better or worse in the studies); none: not measured in this video. */
export type Verdict = 'top' | 'ok' | 'improve' | 'note' | 'none';
export interface ResearchRow {
  key: string; group: string;
  /** The name in the table (under the group) and in the summary. */
  short: string; label: string;
  value: string; research: string; verdict: Verdict; text: string;
}
export interface ResearchSummary { rows: ResearchRow[]; good: string[]; improve: string[]; missing: string[] }

/** The studies' values (see above). Angles from vertical unless named. */
export const STUDY = {
  frontKnee: [91, 99] as const, frontKneeWomen: 103, rearKnee: [117, 136] as const,
  setTrunkBelow: { female: { mean: 24, sd: 5 }, male: { mean: 20, sd: 9 } },
  firstFlight: { top: .045, topSd: .025, trained: .074 },
  firstContact: { female: { top: .225, below: .166 }, male: { top: .210, below: .176 } },
  /** From horizontal. */
  trunkTouchdown: { mean: 39, sd: 3 }, trunkToeOff: { mean: 43, sd: 3 },
  shankTopFirst: { mean: 55, sd: 3 },
  shank: [{ mean: 39.7, sd: 7.8 }, { mean: 26.4, sd: 7.5 }, { mean: 16.5, sd: 6.2 }],
  gapTouchdownTop: -70, gapToeOffTop: { mean: 102, sd: 7 }, gapToeOff: 88.0,
  gapTouchdown: [-50.1, -56.6, -49.6],
} as const;
export const ERROR = { angle: 5, gap: 8, time: .01 } as const;
/** The analysis times the block clearance about 0.01 s early, so its first flight reads that much long (数値の見方). */
const FLIGHT_EARLY = .01;
/** What the summary lists first among the rows pointing to more: the studies' strongest ties first. */
const PRIORITY = ['gapToeOff1', 'shank1', 'firstFlight', 'shank2', 'shank3', 'frontKnee'];

const deg = (v: number) => `${Math.round(v)}°`;
const sec = (v: number) => `${v.toFixed(3)}秒`;
/** A thighs' separation in words: the swing knee ahead of (前) or behind (後ろ) the stance knee. */
export const gapText = (v: number) => `${v >= 0 ? '前' : '後ろ'}${Math.round(Math.abs(v))}°`;
const NOT_MEASURED = '映っていない、または骨格がはっきりしないため測れませんでした。';
const SHANK_WHY = '研究では、接地で脛が前に倒れているほど前へ押す力の割合が大きく、一流の選手ほど前に倒れています。';
const GAP_WHY = '研究では、1歩目の離地で後ろ足のももが前に来ているほど、1歩目で前へ進む力が大きい選手でした（世界トップ男子8人）。';

export function crouchResearch(r: CrouchResult, sex: Sex): ResearchSummary {
  const rows: ResearchRow[] = [];
  // Judged on the value as shown (degrees whole, seconds to the millisecond), so a 104° shown is judged as 104°.
  const add = (key: string, group: string, short: string, label: string, v: number | null | undefined, research: string,
    show: (v: number) => string, judge: (v: number) => [Verdict, string], digits = 0) => {
    if (v == null) { rows.push({ key, group, short, label, value: '—', research, verdict: 'none', text: NOT_MEASURED }); return; }
    const shown = Number(v.toFixed(digits)), [verdict, text] = judge(shown);
    rows.push({ key, group, short, label, value: show(shown), research, verdict, text });
  };
  const women = sex === 'female', step = (i: number) => r.steps[i] ?? null;
  const fromHorizontal = (v: number | null | undefined) => v == null ? null : 90 - v;

  // The set.
  const [kneeLo, kneeHi] = STUDY.frontKnee, kneeWhy = '速い選手ほど前膝を深く曲げる傾向があります（ただし構えの角度と記録の結びつきは弱い）。';
  add('frontKnee', '構え', '前膝', '構えの前膝', r.set?.frontKnee, `${kneeLo}〜${kneeHi}°${women ? `（女子の平均 約${STUDY.frontKneeWomen}°）` : ''}`, deg, v =>
    v > kneeHi + ERROR.angle ? ['improve', `研究の範囲より伸びています。${women ? `女子の平均（約${STUDY.frontKneeWomen}°）に近い値ですが、` : ''}${kneeWhy}`]
    : v < kneeLo - ERROR.angle ? ['note', '研究の範囲より深く曲がっています。ブロックの位置や腰の高さで変わります。']
    : ['ok', v > kneeHi ? `研究の範囲に近い値です（誤差の範囲）。${kneeWhy}` : `研究の範囲です。${kneeWhy}`]);
  const [rearLo, rearHi] = STUDY.rearKnee;
  add('rearKnee', '構え', '後膝', '構えの後膝', r.set?.rearKnee, `${rearLo}〜${rearHi}°`, deg, v =>
    v >= rearLo - ERROR.angle && v <= rearHi + ERROR.angle ? ['ok', '研究の範囲です。']
    : ['note', `研究の範囲より${v > rearHi ? '伸びて' : '曲がって'}います（後膝は、研究によって良いとされる向きが違います）。`]);
  const setRef = STUDY.setTrunkBelow[sex];
  add('setTrunk', '構え', '体幹', '構えの体幹', r.set?.trunkAngle == null ? null : r.set.trunkAngle - 90,
    `${women ? '女子' : '男子'}の平均 肩が腰より約${setRef.mean}°低い`, v => `肩が${Math.round(Math.abs(v))}°${v >= 0 ? '低い' : '高い'}`, v =>
    Math.abs(v - setRef.mean) <= 2 * setRef.sd ? ['ok', '研究の範囲です（構えの体幹と記録の結びつきは弱い）。']
    : ['note', `研究の平均より肩が${v > setRef.mean ? '低い' : '高い'}構えです（構えの体幹と記録の結びつきは弱い）。`]);

  // Leaving the blocks.
  const F = STUDY.firstFlight, topFlight = F.top + F.topSd;
  add('firstFlight', 'ブロック→1歩目', '空中時間', 'ブロック→1歩目の空中', r.firstFlight, `トップ選手 ${sec(F.top)}・鍛えた選手 ${sec(F.trained)}`, sec, v => {
    const t = Number((v - FLIGHT_EARLY).toFixed(3)), why = '研究では、上位の選手ほど短い傾向です。この解析は0.01秒ほど長めに出るため、0.01秒引いて比べています。';
    return t < F.top - F.topSd ? ['top', `トップ選手の範囲（${sec(F.top - F.topSd)}〜${sec(topFlight)}）より短い値です。${why}`]
      : t <= topFlight ? ['top', `トップ選手の範囲です。${why}`]
      : t <= topFlight + ERROR.time ? ['ok', `トップ選手の範囲（${sec(topFlight)}まで）より${sec(t - topFlight)}長く、誤差ほどの差です。${why}`]
      : ['improve', `トップ選手より長めです。ブロックから上へ跳び出していないか、スロー再生で確かめてください。${why}`];
  }, 3);

  // The first contact.
  const T = STUDY.trunkTouchdown;
  add('trunk1', '1歩目の接地', '体幹（水平から）', '1歩目接地の体幹', fromHorizontal(step(0)?.trunkAngle), `世界トップ男子 ${T.mean}°`, deg, v =>
    Math.abs(v - T.mean) <= T.sd ? ['top', '世界トップ男子と同じくらいの前傾です（体幹は研究によって良いとされる向きが違います）。']
    : ['note', `世界トップ男子より${v > T.mean ? '起きて' : '前に倒れて'}います（体幹は、研究によって良いとされる向きが違います）。`]);
  const shankRow = (i: number) => {
    const S = STUDY.shank[i], top = i === 0 ? STUDY.shankTopFirst : null, low = S.mean - S.sd;
    add(`shank${i + 1}`, i === 0 ? '1歩目の接地' : '2・3歩目の接地', i === 0 ? '脛' : `${i + 1}歩目の脛`, `${i + 1}歩目接地の脛`, step(i)?.shankAngle,
      top ? `世界トップ男子 ${top.mean}°・鍛えた選手 ${Math.round(S.mean)}°` : `鍛えた選手 ${Math.round(S.mean)}°`, deg, v => {
        if (top) {
          const best = top.mean - top.sd, short = `世界トップ男子より${Math.round(top.mean - v)}°立っています。`;
          return v >= best ? ['top', '世界トップ男子と同じくらい脛が前に倒れています。']
            : v >= best - ERROR.angle ? ['ok', `世界トップ男子の範囲（${best}°以上）まであと${best - v}°で、角度の誤差ほどの差です。${SHANK_WHY}`]
            : ['improve', `${v >= low ? '鍛えた選手の範囲ですが、' : '鍛えた選手より脛が立った接地で、'}${short}${SHANK_WHY}`];
        }
        return v >= S.mean + S.sd ? ['top', `鍛えた選手の平均より脛の前傾を保てています。${SHANK_WHY}`]
          : v >= low ? ['ok', `鍛えた選手の範囲です。${SHANK_WHY}`]
          : ['improve', `鍛えた選手より脛が立った接地です。${SHANK_WHY}`];
      });
  };
  shankRow(0);
  add('gapTouchdown1', '1歩目の接地', 'ももの開き', '1歩目接地のももの開き', step(0)?.thighGapTouchdown,
    `世界トップ男子 ${gapText(STUDY.gapTouchdownTop)}・鍛えた選手 ${gapText(STUDY.gapTouchdown[0])}`, gapText, () =>
    ['note', 'ブロックを出た1歩目の接地では、後ろ足が後ろに残るのがふつうです（世界トップ男子でも約70°後ろ）。接地の瞬間の開きは、1歩目の推進と関係しませんでした。']);
  const C = STUDY.firstContact[sex];
  add('firstContact', '1歩目の接地', '接地時間', '1歩目の接地時間', step(0)?.contactSeconds, `上位の${women ? '女子' : '男子'} ${sec(C.top)}・その下 ${sec(C.below)}`, sec, v =>
    ['note', `${Math.abs(v - C.top) <= Math.abs(v - C.below) ? '上位の選手に近い長さです' : 'その下の選手に近い長さです'}。上位の選手ほど1歩目を長く押す傾向がありますが、同じ選手では速く走れた回ほど短く、長ければ良いとは言えません。`], 3);

  // The first toe-off: the two values tied to the first step's push.
  const O = STUDY.trunkToeOff;
  add('trunkToeOff1', '1歩目の離地', '体幹（水平から）', '1歩目離地の体幹', fromHorizontal(step(0)?.trunkToeOff), `世界トップ男子 ${O.mean}°`, deg, v =>
    Math.abs(v - O.mean) <= O.sd ? ['top', '世界トップ男子と同じくらいの前傾です。']
    : ['note', `世界トップ男子より${v > O.mean ? '起きて' : '前に倒れて'}います。世界トップ男子の中では離地で前に倒れているほど1歩目で前へ進む力が大きい選手でしたが、一流と準一流の比較では一流のほうが体幹が起きていて、研究によって良いとされる向きが違います。`]);
  const GO = STUDY.gapToeOffTop;
  add('gapToeOff1', '1歩目の離地', 'ももの開き', '1歩目離地のももの開き', step(0)?.thighGapToeOff,
    `世界トップ男子 ${gapText(GO.mean)}・鍛えた選手 ${gapText(STUDY.gapToeOff)}`, gapText, v => {
      const best = GO.mean - GO.sd;
      return v >= best ? ['top', `世界トップ男子と同じくらい、離地で後ろ足のももが前に来ています。${GAP_WHY}`]
        : v >= best - ERROR.gap ? ['ok', `世界トップ男子の範囲（${best}°以上）まであと${best - v}°で、角度の誤差ほどの差です。${GAP_WHY}`]
        : ['improve', `${v >= STUDY.gapToeOff - ERROR.gap ? '鍛えた選手の平均並みですが、' : ''}世界トップ男子より後ろ足のももが${Math.round(GO.mean - v)}°後ろです。${GAP_WHY}`];
    });

  // The next contacts.
  shankRow(1); shankRow(2);
  for (const i of [1, 2]) add(`gapTouchdown${i + 1}`, '2・3歩目の接地', `${i + 1}歩目のももの開き`, `${i + 1}歩目接地のももの開き`, step(i)?.thighGapTouchdown,
    `鍛えた選手 ${gapText(STUDY.gapTouchdown[i])}`, gapText, () =>
    ['note', '加速の初めは、接地のとき後ろ足が後ろにあるのがふつうです。接地で後ろ足のももが前にある（挟み込み）ほど速いという関係は、最高速度の局面で報告されたもので、スタートの加速では見られていません。']);

  const of = (v: Verdict) => rows.filter(row => row.verdict === v);
  const improve = of('improve').sort((a, b) => PRIORITY.indexOf(a.key) - PRIORITY.indexOf(b.key)).map(row => row.label);
  return { rows, good: of('top').map(row => row.label), improve, missing: of('none').map(row => row.label) };
}
