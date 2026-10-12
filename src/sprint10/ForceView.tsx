import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { numberInput } from './number-input';
import type { CrouchFrame } from './crouch';
import type { Contact } from './contacts';
import { bodyTrack, G, groundForces, scaleFromHeight, type GroundForces } from './ground-force';
import type { Sex } from './crouch-research';

/** The body's weight and height, kept on this device only (the user enters them once). */
const WEIGHT_KEY = 'sachizu-body-weight', HEIGHT_KEY = 'sachizu-body-height';
const stored = (key: string) => { try { const v = Number(localStorage.getItem(key)); return v > 0 ? v : null; } catch { return null; } };
const store = (key: string, v: number | null) => { try { if (v) localStorage.setItem(key, String(v)); else localStorage.removeItem(key); } catch { /* not kept */ } };

/** The studies the means are set against: only values found for both men and women, one each, from one study by one
 * method (the user, 2026-10-12: 「男子も女子も出せる数値だけに統一して欲しい。男子だけ多いとかはないように」). That is
 * the block alone: Mirkov et al. 2020 (Int J Environ Res Public Health 17:6447; top national-level Slovenian sprinters,
 * 22 men 17.7 ± 2.7 years and 6 women 17.0 ± 2.0, instrumented blocks, the mean of 10 training starts): the horizontal
 * take-off speed over the block time less the reaction time (men 3.20 m/s, 0.483 − 0.134 s; women 3.03 m/s,
 * 0.497 − 0.134 s), body weights 0.93 and 0.85; the mean forward power ½ × speed² ÷ that time, from the means.
 * Taken off for want of women's values: the elite and junior men's block and first two contacts (Graham-Smith et al.
 * 2020: no women), the elite men's push directions (51°, and the user's provisional 63° and 70°: no women's upward speeds
 * off the blocks), and the top-speed vertical force (Weyand et al. 2000: men and women together). Looked for and not
 * found: women's speeds at the first toe-offs (the 2018 World Indoor 60 m finalists' report and Ciacci et al. 2017 give
 * contact times; Nagahara 2023 forces by speed group in figures only). */
export const FORCE_STUDY = {
  male: { value: 3.20 / (.483 - .134) / G, power: 3.20 ** 2 / 2 / (.483 - .134) },
  female: { value: 3.03 / (.497 - .134) / G, power: 3.03 ** 2 / 2 / (.497 - .134) },
} as const;
/** The block's values in the words compared with: 参考値, not 研究 (the user, 2026-10-12: 「研究という書き方はやめて別の書き方に」). */
export const STUDY_WHO: Record<Sex, string> = { male: '男子の参考値', female: '女子の参考値' };
/** Where a mean forward force stands against a study's mean: within 15% alike. */
export function against(v: number, study: number, who: string): string {
  const q = v / study;
  return v < 0 ? 'ブレーキの方が大きい' : q >= 1.15 ? `${who}より大きい` : q >= .85 ? `${who}並み` : q >= .6 ? `${who}よりやや小さい` : `${who}より小さい`;
}
const times = (v: number, mass: number) => `${(v / (mass * G)).toFixed(2)}倍`;
interface ForcePeriod {
  key: string; label: string; horizontal: number | null; vertical: number | null; angle: number | null; ratio: number | null;
  extra: [string, string][]; against: string | null; study: string | null;
}

/** Direction of the contact mean, in running-relative coordinates. A fixed length deliberately encodes no magnitude.
 * `noisy`: a section at top speed, where the forward mean is within the measuring spread. */
export function MeanForceDirection({ horizontal, vertical, block = false, noisy = false }: {
  horizontal: number | null; vertical: number | null; block?: boolean; noisy?: boolean }) {
  if (horizontal === null || vertical === null || !Number.isFinite(horizontal) || !Number.isFinite(vertical)) {
    return <p className="force-direction-unavailable">前向きと上向きの両方の力が求まると、平均の向きを表示できます。</p>;
  }
  const magnitude = Math.hypot(horizontal, vertical);
  if (!magnitude) return <p className="force-direction-unavailable">平均の力が0のため、矢印の向きはありません。</p>;
  const dx = horizontal / magnitude, dy = -vertical / magnitude;
  const originY = vertical < 0 ? 56 : 172, endX = 160 + dx * 108, endY = originY + dy * 108;
  const head = `${endX},${endY} ${endX - dx * 18 - dy * 8},${endY - dy * 18 + dx * 8} ${endX - dx * 18 + dy * 8},${endY - dy * 18 - dx * 8}`;
  return <figure className="force-direction">
    <figcaption>平均の力の向き</figcaption>
    <svg viewBox="0 0 320 228" role="img" aria-label="区間全体の平均の力の向き。図の右が走る方向、上が上向きです。">
      <g className="force-direction-axis">
        <path d={`M32 ${originY} H288 M160 36 V196`} />
        <path d={`M38 ${originY - 4} L32 ${originY} L38 ${originY + 4} M282 ${originY - 4} L288 ${originY} L282 ${originY + 4} M156 42 L160 36 L164 42`} />
        {vertical < 0 && <path d="M156 190 L160 196 L164 190" />}
      </g>
      <g className="force-direction-label">
        <text x="160" y="23" textAnchor="middle">上へ</text>
        <text x="32" y={vertical < 0 ? originY - 12 : originY + 25}>後ろへ</text>
        <text x="288" y={vertical < 0 ? originY - 12 : originY + 25} textAnchor="end">前へ（走る方向）</text>
        {vertical < 0 && <text x="160" y="219" textAnchor="middle">下へ</text>}
      </g>
      <g className="force-direction-vector">
        <line x1="160" y1={originY} x2={endX - dx * 10} y2={endY - dy * 10} />
        <polygon points={head} />
      </g>
      <circle cx="160" cy={originY} r="4" className="force-direction-origin" />
    </svg>
    <p>地面が体を押し返す向きです。{block && '手で支えた分も含みます。'}</p>
    <p className="force-direction-note">矢印の長さは一定です。力の大きさは下の数値で確認できます。</p>
    {noisy && <p className="force-direction-note">最高速度の区間では、矢印の前後の傾きは測定のぶれ（前向きで体重の±0.2倍ほど）の範囲です。</p>}
  </figure>;
}

/** A box for the weight or the height: it shows what is typed (number-input.ts), and gives the value only once the
 * typing is a number within the range (a 5 on the way to 55 gives nothing, not the smallest 20). The text is set from
 * the value only when the box is not being typed in (at the start, from the device's stored value) and on leaving it. */
function NumberBox({ label, unit, value, onValue, min, max, example }: { label: string; unit: string; value: number | null; onValue: (v: number | null) => void; min: number; max: number; example: string }) {
  const [text, setText] = useState(value === null ? '' : String(value)), typing = useRef(false);
  useEffect(() => { if (!typing.current) setText(value === null ? '' : String(value)); }, [value]);
  return <label>{label}<input type="text" inputMode="decimal" value={text} placeholder={example}
    onFocus={() => { typing.current = true; }}
    onChange={e => { const r = numberInput(e.target.value, min, max, false); setText(r.text); onValue(r.value === null || r.low ? null : r.value); }}
    onBlur={() => { typing.current = false; setText(value === null ? '' : String(value)); }} />{unit}</label>;
}

/** Contact-period estimates only: no still frame or posture is presented as an instantaneous force measurement. The
 * crouch start's block is set against the men's or the women's 参考値 of one study (FORCE_STUDY), the only values found
 * for both. */
export default function ForceView({ kind, contacts, frames, width: W, height: H, direction, block, pxPerM, top = false, sex = 'male', onSex }: {
  kind: 'crouch' | 'run'; contacts: readonly Contact[]; frames: readonly CrouchFrame[]; width: number; height: number; direction: number;
  /** The crouch start: whose 参考値 to compare the block with (the same choice as 参考値と比べる). */
  sex?: Sex; onSex?: (s: Sex) => void;
  /** A section at top speed (the flying 10 m): the forward force about nil there, the vertical the one to read. */
  top?: boolean;
  /** The crouch start: the first movement seen and the front block's clearance. */
  block?: { moveStart: number; clearance: number } | null;
  /** A run: the picture's pixels per metre from its two lines. */
  pxPerM?: number | null;
}) {
  const [weight, setWeight] = useState<number | null>(() => stored(WEIGHT_KEY)), [height, setHeight] = useState<number | null>(() => stored(HEIGHT_KEY));
  useEffect(() => store(WEIGHT_KEY, weight), [weight]); useEffect(() => store(HEIGHT_KEY, height), [height]);
  const track = useMemo(() => bodyTrack(frames, W, H), [frames, W, H]);
  const scale = useMemo(() => kind === 'run' ? pxPerM ?? null : height ? scaleFromHeight(frames, W, H, height / 100, block?.clearance ?? -Infinity) : null,
    [kind, pxPerM, height, frames, W, H, block?.clearance]);
  const forces: GroundForces | null = useMemo(() => weight ? groundForces({ mass: weight, contacts, track, pxPerM: scale, scaleSource: kind === 'run' ? 'lines' : 'height', direction,
    speeds: kind === 'run' ? 'steps' : 'flights',
    block: block ? { moveStart: block.moveStart, clearance: block.clearance } : null }) : null, [weight, contacts, track, scale, kind, direction, block]);
  const periods: ForcePeriod[] = useMemo(() => {
    if (!forces) return [];
    const out: ForcePeriod[] = [], m = forces.mass;
    const b = forces.block;
    if (b) {
      const S = FORCE_STUDY;
      out.push({ key: 'block', label: 'ブロック', horizontal: b.horizontal, vertical: b.vertical, angle: b.angle, ratio: b.ratio,
        against: against(b.horizontal / (m * G), S[sex].value, STUDY_WHO[sex]),
        study: `男子 ${S.male.value.toFixed(2)}倍・女子 ${S.female.value.toFixed(2)}倍（国内トップ級）`,
        extra: [['押した時間', `${b.pushSeconds.toFixed(3)}秒`], ['平均の前向きパワー', `${b.power.toFixed(1)} W/kg（参考値：男子 ${S.male.power.toFixed(1)}・女子 ${S.female.power.toFixed(1)}）`],
          ['上向きの力', '手で支えた分も含みます']] });
    }
    forces.steps.forEach((s, i) => {
      const c = contacts[i];
      if (!c || c.touchdown === null || c.toeOff === null || (s.horizontal === null && s.vertical === null)) return;
      out.push({ key: `step${i + 1}`, label: `${i + 1}歩目`, horizontal: s.horizontal, vertical: s.vertical, angle: s.angle, ratio: s.ratio,
        against: null, study: null,
        extra: s.contactSeconds !== null ? [['接地時間', `${s.contactSeconds.toFixed(3)}秒`]] : [] });
    });
    return out;
  }, [forces, contacts, sex]);
  const [picked, setPicked] = useState<string | null>(null), summary = useRef<HTMLDivElement>(null);
  const shown = periods.find(p => p.key === picked) ?? periods.find(p => p.horizontal !== null) ?? periods[0] ?? null;
  const pick = (k: string) => { setPicked(k); requestAnimationFrame(() => summary.current?.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' })); };

  return <section className="force-view" aria-label="平均の力">
    <h3>接地から離地までの平均（動画から推定）</h3>
    <p className="force-limit">接地中のどの瞬間に、どちらへ力を出したかは、この結果では判断できません。</p>
    <div className="force-inputs">
      <NumberBox label="体重" unit="kg" value={weight} onValue={setWeight} min={20} max={150} example="例 55" />
      {kind === 'crouch' && <NumberBox label="身長" unit="cm" value={height} onValue={setHeight} min={100} max={220} example="例 160" />}
      {kind === 'crouch' && onSex && <div className="force-sex"><span>参考値</span><div className="sprint10-seg" role="group" aria-label="参考値">{(['female', 'male'] as Sex[]).map(s =>
        <button key={s} type="button" aria-pressed={sex === s} onClick={() => onSex(s)}>{s === 'female' ? '女子' : '男子'}</button>)}</div></div>}
    </div>
    {!weight ? <p className="sprint10-hint">体重を入れると、{kind === 'crouch' ? 'ブロックと' : ''}1歩ごとの平均の力を出します。値はこの端末にだけ残ります。</p> : <>
      {kind === 'crouch' && !height && <p className="sprint10-note">身長を入れると、前向きの平均の力と、平均の力の向きも出ます（今は上向きの力だけ）。</p>}
      {kind === 'run' && !pxPerM && <p className="sprint10-note">2本の線から距離が分からないため、上向きの平均の力だけを出しています。</p>}
      {top && <p className="sprint10-note">最高速度の区間では、前向きの力は平均するとほぼ0になります（途中で力を出していないという意味ではありません）。1歩ごとの前向きの値は測定のぶれ（体重の±0.2倍ほど）の範囲なので、この区間では上向きの力を見てください。</p>}
      <p className="force-weight-note">数値は、体重を1とした平均の力の大きさです。</p>
      <ul className="force-list">{periods.map(p => <li key={p.key}><button type="button" aria-pressed={shown?.key === p.key} onClick={() => pick(p.key)}>
        <strong>{p.label}</strong>
        <span>{p.horizontal !== null ? <>前へ <b>{times(p.horizontal, forces!.mass)}</b></> : '前へ —'}　上へ <b>{p.vertical !== null ? times(p.vertical, forces!.mass) : '—'}</b></span>
        {p.against && <em className={p.against.includes('小さい') || p.against.includes('ブレーキ') ? 'low' : 'ok'}>前へ：{p.against}</em>}
        </button></li>)}</ul>
      {shown && <div ref={summary} className="force-summary" aria-live="polite">
        <div className="force-summary-head"><strong>{shown.label}</strong></div>
        <p className="force-average">{shown.key === 'block' ? '押し始めからブロックを離れるまでの平均' : '接地から離地までの平均'}（動画から推定）</p>
        <MeanForceDirection horizontal={shown.horizontal} vertical={shown.vertical} block={shown.key === 'block'} noisy={top} />
        <dl className="force-values force-mean-values">
          <dt>前向きの平均</dt><dd>{shown.horizontal !== null ? times(shown.horizontal, forces!.mass) : '—'}</dd>
          <dt>上向きの平均</dt><dd>{shown.vertical !== null ? times(shown.vertical, forces!.mass) : '—'}</dd>
        </dl>
        <details className="force-details"><summary>{kind === 'crouch' && shown.key === 'block' ? '時間・割合・参考値' : '時間・割合'}</summary>
        <dl className="force-values">
          {shown.angle !== null && <><dt>平均の力の向き</dt><dd>地面から {Math.round(shown.angle)}°</dd></>}
          {shown.ratio !== null && <><dt>平均の力の前向きの割合</dt><dd>{Math.round(shown.ratio * 100)}%</dd></>}
          {shown.study && <><dt>参考値（前向きの力）</dt><dd>{shown.study}</dd></>}
          {shown.extra.map(([k, v]) => <Fragment key={k}><dt>{k}</dt><dd>{v}</dd></Fragment>)}
        </dl>
        </details>
      </div>}
      <p className="sprint10-hint">{kind === 'crouch' ? '参考値と比べるのは、男子と女子の両方の値があるブロックだけです（区間平均）。' : ''}その瞬間の力や、姿勢の良し悪しを示すものではありません。出し方は「数値の見方」で確認できます。</p>
    </>}
  </section>;
}
