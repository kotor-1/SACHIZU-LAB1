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

/** A contact mean's direction: its angle from the ground (°; 0 forward, 90 straight up, past 90 backward). */
export const angleOf = (horizontal: number, vertical: number) => Math.atan2(vertical, horizontal) * 180 / Math.PI;
/** The direction in words: the angle and how the two components compare, plain and without any judgment (no study's
 * direction is shown: none was found for both men and women). `noisy`: top speed, where the forward mean is within the
 * measuring spread, so only the angle is said, with that. */
export function directionWords(horizontal: number, vertical: number, noisy = false): string {
  const at = `地面から ${Math.round(angleOf(horizontal, vertical))}°。`;
  if (noisy) return `${at}最高速度の区間なので、前後の傾きは測定のぶれの範囲です。`;
  if (vertical <= 0) return `${at}上向きの力がありません。`;
  if (horizontal < 0) return `${at}前向きの平均が後ろ向き（ブレーキ）です。`;
  if (horizontal < .05 * vertical) return `${at}ほぼ真上です。`;
  const r = vertical / horizontal, x = (q: number) => q < 10 ? q.toFixed(1) : String(Math.round(q));
  return at + (r >= .9 && r <= 1.1 ? '前向きと上向きの力がほぼ同じ大きさです。' : r > 1.1 ? `上向きの力が前向きの力の約${x(r)}倍です。` : `前向きの力が上向きの力の約${x(1 / r)}倍です。`);
}
export interface DirectionItem { key: string; label: string; horizontal: number | null; vertical: number | null }
const usable = (i: DirectionItem): i is DirectionItem & { horizontal: number; vertical: number } =>
  i.horizontal !== null && i.vertical !== null && Number.isFinite(i.horizontal) && Number.isFinite(i.vertical) && Math.hypot(i.horizontal, i.vertical) > 0;
/** The arrow's tip from an origin (fixed length: the arrows show directions only). */
const tipOf = (h: number, v: number, x0: number, y0: number, length: number) => { const m = Math.hypot(h, v); return { dx: h / m, dy: -v / m, x: x0 + h / m * length, y: y0 - v / m * length }; };
/** The contact means' directions on one half-dial: every section's arrow (block, steps), the chosen one in the accent
 * with its angle, the others faint, so the change from section to section shows at a glance (the user, 2026-10-13:
 * 「図だけだとわかりにくいから見せ方を変えてほしい」). A line marks 45°, where forward and upward are equal; the words under
 * it say the chosen one's angle and how its two components compare; a small picture says what the arrow is (the
 * ground pushing the body back as the foot pushes it). Every arrow has one length: no magnitude is drawn. No study's
 * direction is shown. `block`: the chosen section is the block (the hands' support included). `noisy`: top speed. */
export function ForceDirections({ items, chosen, block = false, noisy = false }: {
  items: readonly DirectionItem[]; chosen: string; block?: boolean; noisy?: boolean }) {
  const pick = items.find(i => i.key === chosen);
  if (!pick || pick.horizontal === null || pick.vertical === null || !Number.isFinite(pick.horizontal) || !Number.isFinite(pick.vertical)) {
    return <p className="force-direction-unavailable">前向きと上向きの両方の力が求まると、平均の向きを表示できます。</p>;
  }
  if (!usable(pick)) return <p className="force-direction-unavailable">平均の力が0のため、矢印の向きはありません。</p>;
  const shown = items.filter(usable), down = shown.some(i => i.vertical < 0);
  const X0 = 160, Y0 = down ? 126 : 186, L = 108, R = 120;
  const at = (deg: number, r: number) => [X0 + r * Math.cos(deg * Math.PI / 180), Y0 - r * Math.sin(deg * Math.PI / 180)] as const;
  const head = (t: ReturnType<typeof tipOf>, w: number, len: number) => `${t.x},${t.y} ${t.x - t.dx * len - t.dy * w},${t.y - t.dy * len + t.dx * w} ${t.x - t.dx * len + t.dy * w},${t.y - t.dy * len - t.dx * w}`;
  // Labels: the chosen one's always, another's only where its box overlaps no label already placed (the dial's own
  // words included), so none sit on top of another (at top speed the arrows all stand near 90°).
  type Box = { l: number; r: number; t: number; b: number };
  const textWidth = (t: string) => [...t].reduce((w, ch) => w + (/[\x00-\x7f]/.test(ch) ? 7.2 : 12.5), 0);
  const anchorOf = (a: number) => a < 75 ? 'start' as const : a > 105 ? 'end' as const : 'middle' as const;
  const boxOf = (x: number, y: number, w: number, anchor: 'start' | 'middle' | 'end'): Box =>
    ({ l: anchor === 'start' ? x : anchor === 'end' ? x - w : x - w / 2, r: anchor === 'start' ? x + w : anchor === 'end' ? x : x + w / 2, t: y - 9, b: y + 9 });
  const overlaps = (p: Box, q: Box) => p.l < q.r + 3 && q.l < p.r + 3 && p.t < q.b && q.t < p.b;
  const placed: Box[] = [boxOf(X0, Y0 - R - 30, textWidth('真上'), 'middle')];
  const labels: { key: string; text: string; x: number; y: number; anchor: 'start' | 'middle' | 'end'; mine: boolean }[] = [];
  for (const i of [pick, ...shown.filter(i => i.key !== pick.key)]) {
    const a = angleOf(i.horizontal, i.vertical), [x, y] = at(a, L + 16), mine = i.key === pick.key, text = mine ? `${i.label} ${Math.round(a)}°` : i.label;
    // Kept inside the picture: a label that would run off an edge is moved in.
    const w = textWidth(text), anchor = anchorOf(a), lx = anchor === 'start' ? Math.min(x, 316 - w) : anchor === 'end' ? Math.max(x, 4 + w) : Math.min(Math.max(x, 4 + w / 2), 316 - w / 2);
    const box = boxOf(lx, y, w, anchor);
    if (!mine && placed.some(p => overlaps(p, box))) continue;
    placed.push(box); labels.push({ key: i.key, text, x: lx, y, anchor, mine });
  }
  const ticks = Array.from({ length: down ? 24 : 13 }, (_, k) => k * 15);
  const others = shown.filter(i => i.key !== pick.key);
  const tip = tipOf(pick.horizontal, pick.vertical, X0, Y0, L);
  return <figure className="force-direction">
    <figcaption>平均の力の向き</figcaption>
    <svg viewBox={`0 0 320 ${down ? 252 : 220}`} role="img" aria-label={`区間ごとの平均の力の向き。図の右が走る方向、上が上向きです。${pick.label}：${directionWords(pick.horizontal, pick.vertical, noisy)}`}>
      <g className="force-direction-axis">
        <path d={down ? `M${X0 + R} ${Y0} A${R} ${R} 0 1 0 ${X0 - R} ${Y0} A${R} ${R} 0 1 0 ${X0 + R} ${Y0}` : `M${X0 + R} ${Y0} A${R} ${R} 0 0 0 ${X0 - R} ${Y0}`} className="force-direction-arc" />
        <path d={`M20 ${Y0} H300`} />
        {ticks.map(d => { const [x1, y1] = at(d, R), [x2, y2] = at(d, R + (d % 45 ? 4 : 8)); return <line key={d} x1={x1} y1={y1} x2={x2} y2={y2} />; })}
      </g>
      <path d={`M${X0} ${Y0} L${at(45, R)[0]} ${at(45, R)[1]}`} className="force-direction-guide" />
      <g className="force-direction-label">
        <text x={X0} y={Y0 - R - 30} textAnchor="middle" dominantBaseline="middle">真上</text>
        <text x="300" y={Y0 + 20} textAnchor="end">前（走る方向）</text>
        <text x="20" y={Y0 + 20}>後ろ</text>
        {down && <text x={X0} y={Y0 + R + 22} textAnchor="middle">下</text>}
      </g>
      {others.map(i => { const t = tipOf(i.horizontal, i.vertical, X0, Y0, L); return <g key={i.key} className="force-direction-other">
        <line x1={X0} y1={Y0} x2={t.x - t.dx * 8} y2={t.y - t.dy * 8} /><polygon points={head(t, 6, 13)} /></g>; })}
      <g className="force-direction-vector">
        <line x1={X0} y1={Y0} x2={tip.x - tip.dx * 10} y2={tip.y - tip.dy * 10} />
        <polygon points={head(tip, 8, 18)} />
      </g>
      {labels.map(t => <text key={t.key} x={t.x} y={t.y} textAnchor={t.anchor} dominantBaseline="middle" className={`force-direction-tip${t.mine ? ' chosen' : ''}`}>{t.text}</text>)}
      <circle cx={X0} cy={Y0} r="4" className="force-direction-origin" />
    </svg>
    <p className="force-direction-words"><b>{pick.label}</b>：{directionWords(pick.horizontal, pick.vertical, noisy)}</p>
    <p className="force-direction-note">点線（45°）より下なら前向きの力の方が大きく、上なら上向きの力の方が大きい向きです。</p>
    <div className="force-howto">
      <svg viewBox="0 0 110 66" aria-hidden="true">
        <path d="M4 50 H106" className="force-howto-ground" />
        <path d="M22 50 V40 Q22 34 29 34 H38 Q43 34 47 38 L59 43 Q64 45 64 50 Z" className="force-howto-foot" />
        <path d="M36 52 L14 63" className="force-howto-push" /><path d="M14 63 L17 56 M14 63 L21 62" className="force-howto-push" />
        <path d="M50 47 L82 13" className="force-howto-back" /><path d="M82 13 L74 16 M82 13 L80 21" className="force-howto-back" />
      </svg>
      <p>足で地面を<b>後ろ下</b>へ押すと、地面は体を<b>前上</b>へ押し返します。矢印はその押し返す向きの、区間の平均です。{block && '手で支えた分も含みます。'}</p>
    </div>
    <p className="force-direction-note">矢印の長さはどれも同じです。力の大きさは数値で確認できます。{shown.length > 1 ? '薄い矢印は、ほかの区間の向きです。' : ''}</p>
    {noisy && <p className="force-direction-note">最高速度の区間では、矢印の前後の傾きは測定のぶれ（前向きで体重の±0.2倍ほど）の範囲です。</p>}
  </figure>;
}

/** A small arrow for a list row: the section's direction at a glance (the same one length). */
function DirectionGlyph({ horizontal, vertical }: { horizontal: number; vertical: number }) {
  const t = tipOf(horizontal, vertical, 12, vertical < 0 ? 10 : 18, 13);
  return <svg viewBox="0 0 24 20" width="24" height="20" aria-hidden="true" className="force-glyph">
    <path d="M1 18 H23" className="force-glyph-ground" /><line x1="12" y1={vertical < 0 ? 10 : 18} x2={t.x - t.dx * 3} y2={t.y - t.dy * 3} />
    <polygon points={`${t.x},${t.y} ${t.x - t.dx * 6 - t.dy * 3.5},${t.y - t.dy * 6 + t.dx * 3.5} ${t.x - t.dx * 6 + t.dy * 3.5},${t.y - t.dy * 6 - t.dx * 3.5}`} /></svg>;
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
export default function ForceView({ kind, contacts, frames, width: W, height: H, direction, block, pxPerM, top = false, sex = 'male', onSex, verticalOnly = false }: {
  kind: 'crouch' | 'run'; contacts: readonly Contact[]; frames: readonly CrouchFrame[]; width: number; height: number; direction: number;
  /** The crouch start: whose 参考値 to compare the block with (the same choice as 参考値と比べる). */
  sex?: Sex; onSex?: (s: Sex) => void;
  /** A section at top speed (the flying 10 m): the forward force about nil there, the vertical the one to read. */
  top?: boolean;
  /** The crouch start: the first movement seen and the front block's clearance. */
  block?: { moveStart: number; clearance: number } | null;
  /** A run: the picture's pixels per metre from its two lines. */
  pxPerM?: number | null;
  /** The crouch start's light mode (crouch-pick.ts): the body is not followed through every frame, so only the vertical
   * force (from the contact and flight times) is given. */
  verticalOnly?: boolean;
}) {
  const [weight, setWeight] = useState<number | null>(() => stored(WEIGHT_KEY)), [height, setHeight] = useState<number | null>(() => stored(HEIGHT_KEY));
  useEffect(() => store(WEIGHT_KEY, weight), [weight]); useEffect(() => store(HEIGHT_KEY, height), [height]);
  const track = useMemo(() => bodyTrack(frames, W, H), [frames, W, H]);
  const scale = useMemo(() => verticalOnly ? null : kind === 'run' ? pxPerM ?? null : height ? scaleFromHeight(frames, W, H, height / 100, block?.clearance ?? -Infinity) : null,
    [verticalOnly, kind, pxPerM, height, frames, W, H, block?.clearance]);
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
      {kind === 'crouch' && !verticalOnly && <NumberBox label="身長" unit="cm" value={height} onValue={setHeight} min={100} max={220} example="例 160" />}
      {kind === 'crouch' && onSex && <div className="force-sex"><span>参考値</span><div className="sprint10-seg" role="group" aria-label="参考値">{(['female', 'male'] as Sex[]).map(s =>
        <button key={s} type="button" aria-pressed={sex === s} onClick={() => onSex(s)}>{s === 'female' ? '女子' : '男子'}</button>)}</div></div>}
    </div>
    {!weight ? <p className="sprint10-hint">体重を入れると、{kind === 'crouch' && !verticalOnly ? 'ブロックと' : ''}1歩ごとの平均の力を出します。値はこの端末にだけ残ります。</p> : <>
      {verticalOnly && <p className="sprint10-note">コマを自分で選んだ解析では、上向きの平均の力だけを出します（前向きの力とブロックの力は、全部のコマで体を追うため「解析する」で出ます）。</p>}
      {kind === 'crouch' && !verticalOnly && !height && <p className="sprint10-note">身長を入れると、前向きの平均の力と、平均の力の向きも出ます（今は上向きの力だけ）。</p>}
      {kind === 'run' && !pxPerM && <p className="sprint10-note">2本の線から距離が分からないため、上向きの平均の力だけを出しています。</p>}
      {top && <p className="sprint10-note">最高速度の区間では、前向きの力は平均するとほぼ0になります（途中で力を出していないという意味ではありません）。1歩ごとの前向きの値は測定のぶれ（体重の±0.2倍ほど）の範囲なので、この区間では上向きの力を見てください。</p>}
      <p className="force-weight-note">数値は、体重を1とした平均の力の大きさです。</p>
      <ul className="force-list">{periods.map(p => <li key={p.key}><button type="button" aria-pressed={shown?.key === p.key} onClick={() => pick(p.key)}>
        <strong>{p.label}</strong>
        <span>{p.horizontal !== null ? <>前へ <b>{times(p.horizontal, forces!.mass)}</b></> : '前へ —'}　上へ <b>{p.vertical !== null ? times(p.vertical, forces!.mass) : '—'}</b></span>
        {(p.against || (p.horizontal !== null && p.vertical !== null && Math.hypot(p.horizontal, p.vertical) > 0)) && <span className="force-list-sub">
          {p.horizontal !== null && p.vertical !== null && Math.hypot(p.horizontal, p.vertical) > 0
            && <i className="force-list-angle"><DirectionGlyph horizontal={p.horizontal} vertical={p.vertical} />向き {Math.round(angleOf(p.horizontal, p.vertical))}°</i>}
          {p.against && <em className={p.against.includes('小さい') || p.against.includes('ブレーキ') ? 'low' : 'ok'}>前へ：{p.against}</em>}</span>}
        </button></li>)}</ul>
      {shown && <div ref={summary} className="force-summary" aria-live="polite">
        <div className="force-summary-head"><strong>{shown.label}</strong></div>
        <p className="force-average">{shown.key === 'block' ? '押し始めからブロックを離れるまでの平均' : '接地から離地までの平均'}（動画から推定）</p>
        <ForceDirections items={periods} chosen={shown.key} block={shown.key === 'block'} noisy={top} />
        <dl className="force-values force-mean-values">
          <dt>前向きの平均</dt><dd>{shown.horizontal !== null ? times(shown.horizontal, forces!.mass) : '—'}</dd>
          <dt>上向きの平均</dt><dd>{shown.vertical !== null ? times(shown.vertical, forces!.mass) : '—'}</dd>
          {shown.angle !== null && <><dt>平均の力の向き</dt><dd>地面から {Math.round(shown.angle)}°</dd></>}
        </dl>
        <details className="force-details"><summary>{kind === 'crouch' && shown.key === 'block' ? '時間・割合・参考値' : '時間・割合'}</summary>
        <dl className="force-values">
          {shown.ratio !== null && <><dt>平均の力の前向きの割合</dt><dd>{Math.round(shown.ratio * 100)}%</dd></>}
          {shown.study && <><dt>参考値（前向きの力）</dt><dd>{shown.study}</dd></>}
          {shown.extra.map(([k, v]) => <Fragment key={k}><dt>{k}</dt><dd>{v}</dd></Fragment>)}
        </dl>
        </details>
      </div>}
      <p className="sprint10-hint">{kind === 'crouch' && !verticalOnly ? '参考値と比べるのは、男子と女子の両方の値があるブロックだけです（区間平均）。' : ''}その瞬間の力や、姿勢の良し悪しを示すものではありません。出し方は「数値の見方」で確認できます。</p>
    </>}
  </section>;
}
