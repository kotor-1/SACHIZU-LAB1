import type { CrouchResult } from './crouch';

/** General reference values from studies of trained sprinters, to read a
 * crouch start by; not targets for one athlete (the user, 2026-10-04: the
 * results alone left them unsure 「どうすべきか」; they chose reference values
 * with comments, and graphs of the steps). Sources (docs/Crouch_Start_v1_20261003.md):
 * - set knees: Cavedon et al. 2019 (42 regional/national sprinters: front
 *   90-92 ± 8-9°, rear 112-117 ± 11°); Bezodis, Willwacher & Salo 2019 review
 *   (front 91-99°, rear 117-136°).
 * - first flight: Bezodis et al. 2019, 0.045 ± 0.025 s.
 * - first contact: Čoh & Tomazin 2006 (one 10.15 s sprinter, 0.177 s);
 *   Diamond League means 0.210 s (men), 0.225 s (women) (Bezodis et al. 2019).
 * - step to step: contact times shorten and flight times lengthen (Bezodis et al.
 *   2019); the shank and the trunk become more upright at each touchdown, the
 *   shank most (Donaldson, Bezodis & Bayne 2022). */
export const GUIDE = { frontKnee: [90, 100], rearKnee: [115, 135], firstFlight: [.02, .07], firstContact: [.17, .23] } as const;
/** One sprinter's steps 1-4 (Čoh & Tomazin 2006, PB 10.15 s, mean of 5 starts), drawn on the graphs. */
export const ELITE_EXAMPLE = { contact: [.177, .159, .136, .131], flight: [.051, .082, .082, .099] } as const;
/** Differences below these are within the analysis's error (times to the
 * frame at 240 fps: contact time up to 0.017 s, flight longer; angles from the
 * side-view skeleton). */
const SLACK = { knee: 5, contact: .015, flight: .02, shankBack: 3, trunkUp: 10, trunkDown: 5 };

export interface Advice { topic: string; level: 'good' | 'check'; text: string }
const deg = (v: number) => `${Math.round(v)}°`, sec = (v: number) => `${v.toFixed(3)}秒`;

export function crouchAdvice(r: CrouchResult): Advice[] {
  const out: Advice[] = [];
  const knee = (label: string, v: number | null | undefined, [lo, hi]: readonly number[]) => {
    if (v == null) return;
    const range = `目安${lo}〜${hi}°`;
    if (v < lo - SLACK.knee) out.push({ topic: '構え', level: 'check', text: `${label} ${deg(v)}：${range}より深く曲がっています。ブロックの前後の位置や腰の高さで変わります。` });
    else if (v > hi + SLACK.knee) out.push({ topic: '構え', level: 'check', text: `${label} ${deg(v)}：${range}より伸びています。ブロックの前後の位置や腰の高さで変わります。` });
    else out.push({ topic: '構え', level: 'good', text: v >= lo && v <= hi ? `${label} ${deg(v)}：${range}の範囲です。`
      : `${label} ${deg(v)}：${range}に近い値です（差は測定の誤差の範囲）。` });
  };
  knee('前膝', r.set?.frontKnee, GUIDE.frontKnee);
  knee('後膝', r.set?.rearKnee, GUIDE.rearKnee);

  if (r.firstFlight !== null) {
    const [lo, hi] = GUIDE.firstFlight;
    out.push(r.firstFlight > hi
      ? { topic: 'ブロックから1歩目', level: 'check', text: `ブロックを離れてから1歩目の接地まで ${sec(r.firstFlight)}：目安（${lo}〜${hi}秒）より長めです（この解析は0.01秒ほど長めに出ます）。ブロックから上へ跳び出していないか、スロー再生で確かめてください。` }
      : { topic: 'ブロックから1歩目', level: 'good', text: `ブロックを離れてから1歩目の接地まで ${sec(r.firstFlight)}：目安（${lo}〜${hi}秒）の範囲です。` });
  }
  const first = r.steps[0]?.contactSeconds;
  if (first != null) {
    const [lo, hi] = GUIDE.firstContact;
    out.push(first > hi
      ? { topic: '1歩目', level: 'check', text: `1歩目の接地 ${sec(first)}：目安（${lo}〜${hi}秒）より長めです。` }
      : { topic: '1歩目', level: 'good', text: `1歩目の接地 ${sec(first)}：目安（${lo}〜${hi}秒）${first < lo ? 'より短めです' : 'の範囲です'}。` });
  }

  // Step to step: each value against the step before it.
  const trend = (topic: string, values: (number | null)[], worse: (now: number, before: number) => string | null, good: string) => {
    const known = values.map((v, i) => ({ v, step: i + 1 })).filter((p): p is { v: number; step: number } => p.v !== null);
    if (known.length < 2) return;
    const notes = known.slice(1).flatMap((p, i) => { const text = worse(p.v, known[i].v); return text ? [`${p.step}歩目：${text}`] : []; });
    out.push(notes.length ? { topic, level: 'check', text: notes.join(' ') } : { topic, level: 'good', text: good });
  };
  trend('接地時間', r.steps.map(s => s.contactSeconds), (now, before) => now > before + SLACK.contact
    ? `接地時間（${sec(now)}）が前の歩（${sec(before)}）より長くなっています。ふつうは歩ごとに短くなります。` : null,
    '接地時間はおおむね歩ごとに短くなっています（加速の流れどおり）。');
  trend('滞空時間', r.steps.map(s => s.flightSeconds), (now, before) => now < before - SLACK.flight
    ? `滞空時間（${sec(now)}）が前の歩（${sec(before)}）より短くなっています。ふつうは歩ごとに長くなります。` : null,
    '滞空時間はおおむね歩ごとに同じか長くなっています（加速の流れどおり）。');
  trend('脛', r.steps.map(s => s.shankAngle), (now, before) => now > before + SLACK.shankBack
    ? `接地時の脛（${deg(now)}）が前の歩（${deg(before)}）より前に倒れています。ふつうは歩ごとに起きていきます。` : null,
    '接地時の脛はおおむね歩ごとに起きています（加速の流れどおり）。');
  for (const s of r.steps) if (s.shankAngle !== null && s.shankAngle < 0)
    out.push({ topic: '脛', level: 'check', text: `${s.step}歩目：脛が後ろへ傾いた（足首が膝より前の）接地です（${deg(s.shankAngle)}）。加速の初めは、膝が足首より前に出た形で接地するのがふつうです。` });
  trend('体幹', r.steps.map(s => s.trunkAngle), (now, before) => now < before - SLACK.trunkUp
    ? `体幹が急に起きています（${deg(before)}→${deg(now)}）。ふつうは少しずつ起きていきます。`
    : now > before + SLACK.trunkDown ? `体幹が前の歩より前に倒れています（${deg(before)}→${deg(now)}）。` : null,
    '接地時の体幹に、急に起きる・前に倒れるといった大きな変化はありません。');
  return out;
}
