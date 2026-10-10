/** The crouch start set against the studies (the user, 2026-10-10: 「数値を見て研究に対してどうなっているのか簡単で
 * わかりやすい解説」; then 「解説が長いし文章ばかりだし見る気が起きない」, so each value carries what a picture needs:
 * the studies' ranges and the side of faster starts, with one or two short sentences). Better or worse is said only where
 * the studies tie the value to faster starts; where they do not, or disagree, the row is 参考 (for reference). Values the
 * analysis could not measure are told as such, never guessed.
 *
 * The verdicts: ◎ at the best studied level (the world-class or top sprinters' mean ± SD, or, with trained sprinters only,
 * better than their mean by an SD); ○ within the usual range, or short of the best level by no more than the measuring
 * error; △ where the studies point to more and the gap is larger than the error. The error: 5° for one segment's angle,
 * 8° for the thighs' separation (two segments, the far one partly hidden), 0.01 s for the times (the first flight reads
 * about that much long). Values are judged as shown (whole degrees, milliseconds).
 *
 * Angles are the app's own (from vertical, forward +, as the 姿勢 tab shows them); the studies' trunk angles from
 * horizontal are turned into that. Studies (docs/Crouch_Start_Research_20261010.md):
 * - Bezodis, Willwacher & Salo 2019 (Sports Med 49:1345, review): set knees, front 91-99° (the faster group more flexed:
 *   Ciacci et al. 2017, 10 men and 10 women, elite and world-class), rear 117-136°; first flight 0.045 ± 0.025 s and first
 *   contact 0.225 s (women) / 0.210 s (men) in Diamond League sprinters (100 m 11.10 / 10.03 s), 0.166 / 0.176 s in the
 *   groups below (11.95 / 10.74 s).
 * - Čoh et al. 1998 (Gymnica 28:33-42; 13 men, 11 women): in the set, the front knee about 103° in women and 94° in men
 *   (p = 0.01); the trunk about 24 ± 5° (women) and 20 ± 9° (men) below horizontal (p = 0.16).
 * - Walker et al. 2021 (J Biomech 124:110554; the eight men of the 2018 World Indoor 60 m final, 150 Hz): first touchdown,
 *   trunk 39 ± 3° and shank 35 ± 3° from horizontal, thighs' separation −70 ± 15° (r = −0.02 with the first stance's
 *   push); its toe-off, trunk 43 ± 3° (r = −0.59) and separation +102 ± 7° (r = 0.62), the two together R² = 0.89.
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
/** A studied range drawn on the row's scale: the best level (world-class, top) or the trained sprinters'. */
export interface Band { from: number; to: number; label: string; kind: 'top' | 'trained' }
export interface ResearchRow {
  key: string; group: string;
  /** The name on the row's button (under its group) and in the summary. */
  short: string; label: string;
  kind: 'angle' | 'seconds' | 'gap';
  value: string; num: number | null;
  /** The studies on the row's scale: ranges, single values (no spread given), and the side of faster starts (0: none). */
  bands: Band[]; marks: { at: number; label: string }[]; better: -1 | 0 | 1;
  research: string; verdict: Verdict; text: string;
  /** The best studied level (or the studies' range) in words, for 「いま 35° → 世界トップ男子 52〜58°」. */
  target: string;
  /** The moment the value is seen at (its picture), and the joints drawn on it: the leg's side for a knee or a shank,
   * the stance leg's for the thighs. None for the times. */
  moment: { frame: number; pts: number; name: string } | null;
  figure: { kind: 'trunk' | 'shank' | 'knee' | 'gap'; side: 0 | 1 | null } | null;
  /** In plain words for the summary: what is good (top), or what to work on (improve) with how. */
  plain: string | null; cue: string | null;
}
type Base = Omit<ResearchRow, 'target' | 'moment' | 'figure' | 'plain' | 'cue'>;
export interface ResearchSummary { rows: ResearchRow[]; good: string[]; improve: string[]; missing: string[] }

/** The studies' values (see above), in the app's convention. */
export const STUDY = {
  frontKnee: [91, 99] as const, frontKneeWomen: 103, rearKnee: [117, 136] as const,
  /** The trunk in the set from vertical: 90° + the degrees the shoulders are below the hips. */
  setTrunk: { female: { mean: 114, sd: 5 }, male: { mean: 110, sd: 9 } },
  firstFlight: { top: .045, topSd: .025, trained: .074, trainedSd: .014 },
  firstContact: { female: { top: .225, below: .166 }, male: { top: .210, below: .176 } },
  trunkTouchdown: { mean: 51, sd: 3 }, trunkToeOff: { mean: 47, sd: 3 },
  shankTopFirst: { mean: 55, sd: 3 },
  shank: [{ mean: 39.7, sd: 7.8 }, { mean: 26.4, sd: 7.5 }, { mean: 16.5, sd: 6.2 }],
  gapTouchdownTop: { mean: -70, sd: 15 }, gapToeOffTop: { mean: 102, sd: 7 }, gapToeOff: { mean: 88.0, sd: 7.5 },
  gapTouchdown: [{ mean: -50.1, sd: 13.9 }, { mean: -56.6, sd: 18.0 }, { mean: -49.6, sd: 12.8 }],
} as const;
export const ERROR = { angle: 5, gap: 8, time: .01 } as const;
/** What the summary lists first among the rows pointing to more: the studies' strongest ties first. */
const PRIORITY = ['gapToeOff1', 'shank1', 'firstFlight', 'shank2', 'shank3', 'frontKnee'];

/** A thighs' separation in words: the swing knee ahead of (前) or behind (後ろ) the stance knee. */
export const gapText = (v: number) => `${v >= 0 ? '前' : '後ろ'}${Math.round(Math.abs(v))}°`;
export const shown = (kind: ResearchRow['kind'], v: number) =>
  kind === 'seconds' ? `${v.toFixed(3)}秒` : kind === 'gap' ? gapText(v) : `${Math.round(v)}°`;
/** A studied range in words: 32〜48°, 0.020〜0.070秒, 後ろ55〜85°. */
export function rangeText(kind: ResearchRow['kind'], from: number, to: number): string {
  if (kind === 'seconds') return `${from.toFixed(3)}〜${to.toFixed(3)}秒`;
  const [a, b] = [Math.round(from), Math.round(to)];
  if (kind !== 'gap') return `${a}〜${b}°`;
  return b <= 0 ? `後ろ${-b}〜${-a}°` : a >= 0 ? `前${a}〜${b}°` : `後ろ${-a}〜前${b}°`;
}
const band = (mean: number, sd: number, label: string, kind: Band['kind']): Band => ({ from: mean - sd, to: mean + sd, label, kind });
const NOT_MEASURED = '映っていない、または骨格がはっきりしないため測れませんでした。';
const SHANK_WHY = '脛が前に倒れているほど、前へ押す力が大きくなります。';
const GAP_WHY = '離地で後ろ足のももが前に来ている選手ほど、1歩目の推進が大きい結果です。';
const NEAR = '世界トップ男子に近い値です（差は誤差ほど）。';

export function crouchResearch(r: CrouchResult, sex: Sex): ResearchSummary {
  const rows: Base[] = [];
  const women = sex === 'female', step = (i: number) => r.steps[i] ?? null;
  // Judged on the value as shown (degrees whole, seconds to the millisecond), so a 104° shown is judged as 104°.
  const add = (row: Omit<Base, 'value' | 'num' | 'verdict' | 'text'>, v: number | null | undefined,
    judge: (v: number) => [Verdict, string]) => {
    if (v == null) { rows.push({ ...row, value: '—', num: null, verdict: 'none', text: NOT_MEASURED }); return; }
    const num = Number(v.toFixed(row.kind === 'seconds' ? 3 : 0)), [verdict, text] = judge(num);
    rows.push({ ...row, value: shown(row.kind, num), num, verdict, text });
  };

  // The set.
  const [kneeLo, kneeHi] = STUDY.frontKnee;
  add({ key: 'frontKnee', group: '構え', short: '前膝', label: '構えの前膝', kind: 'angle',
    bands: [{ from: kneeLo, to: kneeHi, label: '研究の範囲', kind: 'top' }], marks: women ? [{ at: STUDY.frontKneeWomen, label: '女子の平均' }] : [], better: -1,
    research: `${kneeLo}〜${kneeHi}°${women ? `（女子の平均 約${STUDY.frontKneeWomen}°）` : ''}` }, r.set?.frontKnee, v =>
    v > kneeHi + ERROR.angle ? ['improve', `速い選手ほど前膝を深く曲げる傾向です${women ? `（女子の平均は約${STUDY.frontKneeWomen}°）` : ''}。記録との結びつきは弱めです。`]
    : v < kneeLo - ERROR.angle ? ['note', '研究の範囲より深く曲がっています。ブロックの位置や腰の高さで変わります。']
    : ['ok', v > kneeHi ? '研究の範囲に近い値です（差は誤差ほど）。' : '研究の範囲です。']);
  const [rearLo, rearHi] = STUDY.rearKnee;
  add({ key: 'rearKnee', group: '構え', short: '後膝', label: '構えの後膝', kind: 'angle',
    bands: [{ from: rearLo, to: rearHi, label: '研究の範囲', kind: 'top' }], marks: [], better: 0, research: `${rearLo}〜${rearHi}°` }, r.set?.rearKnee, v =>
    v >= rearLo - ERROR.angle && v <= rearHi + ERROR.angle ? ['ok', '研究の範囲です。']
    : ['note', `研究の範囲より${v > rearHi ? '伸びて' : '曲がって'}います。良い向きは研究で分かれます。`]);
  const T0 = STUDY.setTrunk[sex], who = women ? '女子' : '男子';
  add({ key: 'setTrunk', group: '構え', short: '体幹', label: '構えの体幹', kind: 'angle',
    bands: [{ from: T0.mean - 2 * T0.sd, to: T0.mean + 2 * T0.sd, label: `${who}（研究）`, kind: 'top' }], marks: [], better: 0,
    research: `${who}の平均 ${T0.mean}°（肩が腰より約${T0.mean - 90}°低い）` }, r.set?.trunkAngle, v =>
    Math.abs(v - T0.mean) <= 2 * T0.sd ? ['ok', `研究の範囲です（肩が腰より${Math.round(v - 90)}°低い構え）。`]
    : ['note', `研究の平均より肩が${v > T0.mean ? '低い' : '高い'}構えです。記録との結びつきは弱めです。`]);

  // Leaving the blocks.
  const F = STUDY.firstFlight, topFlight = F.top + F.topSd;
  add({ key: 'firstFlight', group: 'ブロック →1歩目', short: '空中', label: 'ブロック→1歩目の空中', kind: 'seconds',
    bands: [band(F.top, F.topSd, 'トップ選手', 'top'), band(F.trained, F.trainedSd, '鍛えた選手', 'trained')], marks: [], better: -1,
    research: `トップ選手 ${F.top.toFixed(3)}秒・鍛えた選手 ${F.trained.toFixed(3)}秒` }, r.firstFlight, v =>
    v < F.top - F.topSd ? ['top', 'トップ選手の範囲より短い値です。上位の選手ほど短い値です。']
    : v <= topFlight ? ['top', 'トップ選手の範囲です。上位の選手ほど短い値です。']
    : v <= topFlight + ERROR.time ? ['ok', 'トップ選手に近い値です（差は誤差ほど。この解析は0.01秒ほど長めに出ます）。']
    : ['improve', 'トップ選手より長めです。上へ跳び出していないか、スローで確かめてください。']);

  // The first contact.
  const T1 = STUDY.trunkTouchdown;
  add({ key: 'trunk1', group: '1歩目 接地', short: '体幹', label: '1歩目接地の体幹', kind: 'angle',
    bands: [band(T1.mean, T1.sd, '世界トップ男子', 'top')], marks: [], better: 0, research: `世界トップ男子 ${T1.mean}°` }, step(0)?.trunkAngle, v =>
    Math.abs(v - T1.mean) <= T1.sd ? ['top', '世界トップ男子と同じくらいの前傾です。']
    : ['note', `世界トップ男子より${v < T1.mean ? '起きて' : '前に倒れて'}います。良い向きは研究で分かれます。`]);
  const shankRow = (i: number) => {
    const S = STUDY.shank[i], top = i === 0 ? STUDY.shankTopFirst : null, low = S.mean - S.sd;
    add({ key: `shank${i + 1}`, group: `${i + 1}歩目 接地`, short: '脛', label: `${i + 1}歩目接地の脛`, kind: 'angle',
      bands: [...(top ? [band(top.mean, top.sd, '世界トップ男子', 'top')] : []), band(S.mean, S.sd, '鍛えた選手', 'trained')], marks: [], better: 1,
      research: top ? `世界トップ男子 ${top.mean}°・鍛えた選手 ${Math.round(S.mean)}°` : `鍛えた選手 ${Math.round(S.mean)}°` }, step(i)?.shankAngle, v => {
      if (top) {
        const best = top.mean - top.sd, gap = Math.round(top.mean - v);
        return v >= best ? ['top', '世界トップ男子並みに脛が前に倒れています。']
          : v >= best - ERROR.angle ? ['ok', NEAR]
          : ['improve', `${v >= low ? `鍛えた選手の平均並みで、世界トップ男子より${gap}°立っています。` : `鍛えた選手より脛が立っています（世界トップ男子より${gap}°）。`}${SHANK_WHY}`];
      }
      return v >= S.mean + S.sd ? ['top', '鍛えた選手の平均より前傾を保てています。']
        : v >= low ? ['ok', '鍛えた選手の範囲です。']
        : ['improve', `鍛えた選手より脛が立っています。${SHANK_WHY}`];
    });
  };
  shankRow(0);
  const GT = STUDY.gapTouchdownTop, G1 = STUDY.gapTouchdown[0];
  add({ key: 'gapTouchdown1', group: '1歩目 接地', short: 'ももの開き', label: '1歩目接地のももの開き', kind: 'gap',
    bands: [band(GT.mean, GT.sd, '世界トップ男子', 'top'), band(G1.mean, G1.sd, '鍛えた選手', 'trained')], marks: [], better: 0,
    research: `世界トップ男子 ${gapText(GT.mean)}・鍛えた選手 ${gapText(G1.mean)}` }, step(0)?.thighGapTouchdown, () =>
    ['note', '1歩目の接地で後ろ足が残るのはふつうです（世界トップ男子でも約70°後ろ）。']);
  const C = STUDY.firstContact[sex];
  add({ key: 'firstContact', group: '1歩目 接地', short: '接地時間', label: '1歩目の接地時間', kind: 'seconds',
    bands: [], marks: [{ at: C.top, label: `上位の${who}` }, { at: C.below, label: 'その下' }], better: 0,
    research: `上位の${who} ${C.top.toFixed(3)}秒・その下 ${C.below.toFixed(3)}秒` }, step(0)?.contactSeconds, v =>
    ['note', `${Math.abs(v - C.top) <= Math.abs(v - C.below) ? '上位の選手' : 'その下の選手'}に近い長さです。長ければ良いとは言えません。`]);

  // The first toe-off: the two values tied to the first step's push.
  const T2 = STUDY.trunkToeOff;
  add({ key: 'trunkToeOff1', group: '1歩目 離地', short: '体幹', label: '1歩目離地の体幹', kind: 'angle',
    bands: [band(T2.mean, T2.sd, '世界トップ男子', 'top')], marks: [], better: 0, research: `世界トップ男子 ${T2.mean}°` }, step(0)?.trunkToeOff, v =>
    Math.abs(v - T2.mean) <= T2.sd ? ['top', '世界トップ男子と同じくらいの前傾です。']
    : ['note', `世界トップ男子より${v < T2.mean ? '起きて' : '前に倒れて'}います。良い向きは研究で分かれます。`]);
  const GO = STUDY.gapToeOffTop, GN = STUDY.gapToeOff;
  add({ key: 'gapToeOff1', group: '1歩目 離地', short: 'ももの開き', label: '1歩目離地のももの開き', kind: 'gap',
    bands: [band(GO.mean, GO.sd, '世界トップ男子', 'top'), band(GN.mean, GN.sd, '鍛えた選手', 'trained')], marks: [], better: 1,
    research: `世界トップ男子 ${gapText(GO.mean)}・鍛えた選手 ${gapText(GN.mean)}` }, step(0)?.thighGapToeOff, v => {
    const best = GO.mean - GO.sd, gap = Math.round(GO.mean - v);
    return v >= best ? ['top', '世界トップ男子並みに、後ろ足のももが前に来ています。']
      : v >= best - ERROR.gap ? ['ok', NEAR]
      : ['improve', `${v >= GN.mean - ERROR.gap ? `鍛えた選手の平均並みで、世界トップ男子より${gap}°小さい開きです。` : `鍛えた選手より小さい開きです（世界トップ男子より${gap}°）。`}${GAP_WHY}`];
  });

  // The next contacts.
  for (const i of [1, 2]) {
    shankRow(i);
    const G = STUDY.gapTouchdown[i];
    add({ key: `gapTouchdown${i + 1}`, group: `${i + 1}歩目 接地`, short: 'ももの開き', label: `${i + 1}歩目接地のももの開き`, kind: 'gap',
      bands: [band(G.mean, G.sd, '鍛えた選手', 'trained')], marks: [], better: 0, research: `鍛えた選手 ${gapText(G.mean)}` }, step(i)?.thighGapTouchdown, () =>
      ['note', '加速の初めは、接地で後ろ足が後ろにあるのがふつうです。挟み込みが効くのは最高速度の局面です。']);
  }

  // Where each value is seen, and what the summary says of it in plain words (the user, 2026-10-10: 「結局どうすればいいか」).
  const contact = (i: number) => r.contacts.find(c => c.index === r.steps[i]?.step) ?? null;
  const at = (frame: number | null | undefined, pts: number | null | undefined, name: string) => frame != null && pts != null ? { frame, pts, name } : null;
  const set = r.set ? at(r.set.frame, r.set.pts, '構え') : null, front = r.set?.frontSide ?? null;
  const td = (i: number) => at(contact(i)?.touchdownFrame, contact(i)?.touchdown, `${i + 1}歩目の接地`);
  const to = (i: number) => at(contact(i)?.toeOffFrame, contact(i)?.toeOff, `${i + 1}歩目の離地`);
  const side = (i: number) => r.steps[i]?.side ?? null;
  type Seen = Pick<ResearchRow, 'moment' | 'figure'> & { top?: string; improve?: string; cue?: string };
  const later = (i: number): Record<string, Seen> => ({
    [`shank${i + 1}`]: { moment: td(i), figure: { kind: 'shank', side: side(i) }, top: `${i + 1}歩目の接地でも、脛の前傾を保てている`,
      improve: `${i + 1}歩目の接地でも、脛の前傾を保つ`, cue: '膝を前に出したまま着く' },
    [`gapTouchdown${i + 1}`]: { moment: td(i), figure: { kind: 'gap', side: side(i) } },
  });
  const SEEN: Record<string, Seen> = {
    frontKnee: { moment: set, figure: { kind: 'knee', side: front }, improve: '構えの前膝を、もう少し深く曲げる', cue: 'ブロックの位置や腰の高さで調整する' },
    rearKnee: { moment: set, figure: { kind: 'knee', side: front === null ? null : (1 - front) as 0 | 1 } },
    setTrunk: { moment: set, figure: { kind: 'trunk', side: null } },
    firstFlight: { moment: null, figure: null, top: 'ブロックから1歩目まで、低く速く出られている', improve: 'ブロックから低く前へ出る', cue: '上に跳び出さず、前へ低く出る' },
    trunk1: { moment: td(0), figure: { kind: 'trunk', side: null }, top: '1歩目の接地の前傾が、世界トップ男子並み' },
    shank1: { moment: td(0), figure: { kind: 'shank', side: side(0) }, top: '1歩目の接地で、脛が世界トップ男子並みに前に倒れている',
      improve: '1歩目の接地で、脛をもっと前に倒す', cue: '膝を前に出したまま、足を腰より後ろに着く' },
    gapTouchdown1: { moment: td(0), figure: { kind: 'gap', side: side(0) } },
    firstContact: { moment: null, figure: null },
    trunkToeOff1: { moment: to(0), figure: { kind: 'trunk', side: null }, top: '1歩目の離地の前傾が、世界トップ男子並み' },
    gapToeOff1: { moment: to(0), figure: { kind: 'gap', side: r.steps[0]?.sideToeOff ?? null },
      top: '1歩目の離地で、後ろ足の膝が世界トップ男子並みに前に来ている', improve: '1歩目の離地で、後ろ足の膝をもっと前へ', cue: '地面を押し切るときに、反対の膝を素早く前へ引き出す' },
    ...later(1), ...later(2),
  };
  const out: ResearchRow[] = rows.map(row => {
    const s = SEEN[row.key], best = row.bands.find(b => b.kind === 'top') ?? row.bands[0];
    return { ...row, moment: s.moment, figure: s.figure,
      target: best ? `${best.label} ${rangeText(row.kind, best.from, best.to)}` : row.marks.map(m => `${m.label} ${shown(row.kind, m.at)}`).join('・'),
      plain: row.verdict === 'top' ? s.top ?? null : row.verdict === 'improve' ? s.improve ?? null : null, cue: row.verdict === 'improve' ? s.cue ?? null : null };
  });
  const of = (v: Verdict) => out.filter(row => row.verdict === v);
  const improve = of('improve').sort((a, b) => PRIORITY.indexOf(a.key) - PRIORITY.indexOf(b.key)).map(row => row.label);
  return { rows: out, good: of('top').map(row => row.label), improve, missing: of('none').map(row => row.label) };
}

/** The row shown first: what to work on first, else the first at the best level, else the first measured. */
export function firstShown(s: ResearchSummary): string | null {
  const byLabel = (label: string | undefined) => s.rows.find(row => row.label === label)?.key;
  return byLabel(s.improve[0]) ?? byLabel(s.good[0]) ?? s.rows.find(row => row.num !== null)?.key ?? null;
}
