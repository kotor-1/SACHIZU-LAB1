import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { numberInput } from './number-input';
import type { CrouchFrame } from './crouch';
import type { Contact } from './contacts';
import { bodyTrack, G, groundForces, scaleFromHeight, type GroundForces } from './ground-force';

/** The body's weight and height, kept on this device only (the user enters them once). */
const WEIGHT_KEY = 'sachizu-body-weight', HEIGHT_KEY = 'sachizu-body-height';
const stored = (key: string) => { try { const v = Number(localStorage.getItem(key)); return v > 0 ? v : null; } catch { return null; } };
const store = (key: string, v: number | null) => { try { if (v) localStorage.setItem(key, String(v)); else localStorage.removeItem(key); } catch { /* not kept */ } };

/** The studies' mean forward forces in body weights, worked out from Graham-Smith, Colyer & Salo 2020 (Int J Sports Sci
 * Coach 15:418; 17 elite senior and 20 junior academy men): the block, exit speed ÷ push ÷ g (3.36 m/s, 0.365 s;
 * 3.16 m/s, 0.412 s); the first and second contacts, the speed gained ÷ contact time ÷ g (to 4.60 and 5.48 m/s in
 * 0.195 and 0.173 s; juniors to 4.39 and 5.27 in 0.202 and 0.173). Men only: no women's values were found. */
export const FORCE_STUDY = {
  block: { elite: 3.36 / .365 / G, junior: 3.16 / .412 / G, power: { elite: 15.5, junior: 12.4 } },
  steps: [{ elite: (4.60 - 3.36) / .195 / G, junior: (4.39 - 3.16) / .202 / G }, { elite: (5.48 - 4.60) / .173 / G, junior: (5.27 - 4.39) / .173 / G }],
} as const;
const times = (v: number, mass: number) => `${(v / (mass * G)).toFixed(2)}倍`;
interface ForcePeriod {
  key: string; label: string; horizontal: number | null; vertical: number | null; ratio: number | null;
  extra: [string, string][]; study: string | null;
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

/** Contact-period estimates only: no still frame or posture is presented as an instantaneous force measurement. */
export default function ForceView({ kind, contacts, frames, width: W, height: H, direction, block, pxPerM, top = false }: {
  kind: 'crouch' | 'run'; contacts: readonly Contact[]; frames: readonly CrouchFrame[]; width: number; height: number; direction: number; url: string;
  /** A section at top speed (the flying 10 m): the forward force about nil there, the vertical the one to read. */
  top?: boolean;
  /** The crouch start: the first movement seen, the front block's clearance and the front foot's side. */
  block?: { moveStart: number; clearance: number; side: 0 | 1 | null } | null;
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
    const out: ForcePeriod[] = [];
    const b = forces.block;
    if (b) {
      const S = FORCE_STUDY.block;
      out.push({ key: 'block', label: 'ブロック', horizontal: b.horizontal, vertical: b.vertical, ratio: b.ratio,
        study: `一流男子 ${S.elite.toFixed(2)}倍・ジュニア男子 ${S.junior.toFixed(2)}倍`,
        extra: [['押した時間', `${b.pushSeconds.toFixed(3)}秒`], ['平均の前向きパワー', `${b.power.toFixed(1)} W/kg（研究の区間平均：一流男子 ${S.power.elite}・ジュニア男子 ${S.power.junior}）`],
          ['上向きの力', '手で支えた分も含みます']] });
    }
    forces.steps.forEach((s, i) => {
      const c = contacts[i];
      if (!c || c.touchdown === null || c.toeOff === null || (s.horizontal === null && s.vertical === null)) return;
      const S = kind === 'crouch' ? FORCE_STUDY.steps[i] : undefined;
      out.push({ key: `step${i + 1}`, label: `${i + 1}歩目`, horizontal: s.horizontal, vertical: s.vertical, ratio: s.ratio,
        study: S ? `一流男子 約${S.elite.toFixed(2)}倍・ジュニア男子 約${S.junior.toFixed(2)}倍` : null,
        extra: [...(top ? [['研究の上向きの力（区間平均）', '速い選手で約2〜2.5倍（Weyandら 2000）'] as [string, string]] : []),
          ...(s.contactSeconds !== null ? [['接地時間', `${s.contactSeconds.toFixed(3)}秒`] as [string, string]] : [])] });
    });
    return out;
  }, [forces, contacts, kind, top]);
  const [picked, setPicked] = useState<string | null>(null), summary = useRef<HTMLDivElement>(null);
  const shown = periods.find(p => p.key === picked) ?? periods.find(p => p.horizontal !== null) ?? periods[0] ?? null;
  const pick = (k: string) => { setPicked(k); requestAnimationFrame(() => summary.current?.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' })); };

  return <section className="force-view" aria-label="平均の力">
    <h3>接地から離地までの平均（動画から推定）</h3>
    <p className="force-limit">接地中のどの瞬間に、どちらへ力を出したかは、この結果では判断できません。</p>
    <div className="force-inputs">
      <NumberBox label="体重" unit="kg" value={weight} onValue={setWeight} min={20} max={150} example="例 55" />
      {kind === 'crouch' && <NumberBox label="身長" unit="cm" value={height} onValue={setHeight} min={100} max={220} example="例 160" />}
    </div>
    {!weight ? <p className="sprint10-hint">体重を入れると、{kind === 'crouch' ? 'ブロックと' : ''}1歩ごとの平均の力を出します。値はこの端末にだけ残ります。</p> : <>
      {kind === 'crouch' && !height && <p className="sprint10-note">身長を入れると、前向きの平均の力も出ます（今は上向きの力だけ）。</p>}
      {kind === 'run' && !pxPerM && <p className="sprint10-note">2本の線から距離が分からないため、上向きの平均の力だけを出しています。</p>}
      {top && <p className="sprint10-note">最高速度の区間では、前向きの力は平均するとほぼ0になります。途中で力を出していないという意味ではありません。</p>}
      <p className="force-weight-note">数値は、体重を1とした平均の力の大きさです。</p>
      <ul className="force-list">{periods.map(p => <li key={p.key}><button type="button" aria-pressed={shown?.key === p.key} onClick={() => pick(p.key)}>
        <strong>{p.label}</strong>
        <span>{p.horizontal !== null ? <>前へ <b>{times(p.horizontal, forces!.mass)}</b></> : '前へ —'}　上へ <b>{p.vertical !== null ? times(p.vertical, forces!.mass) : '—'}</b></span>
        </button></li>)}</ul>
      {shown && <div ref={summary} className="force-summary" aria-live="polite">
        <div className="force-summary-head"><strong>{shown.label}</strong></div>
        <p className="force-average">{shown.key === 'block' ? '押し始めからブロックを離れるまでの平均' : '接地から離地までの平均'}（動画から推定）</p>
        <dl className="force-values force-mean-values">
          <dt>前向きの平均</dt><dd>{shown.horizontal !== null ? times(shown.horizontal, forces!.mass) : '—'}</dd>
          <dt>上向きの平均</dt><dd>{shown.vertical !== null ? times(shown.vertical, forces!.mass) : '—'}</dd>
        </dl>
        <details className="force-details"><summary>時間・割合・研究の数値</summary>
        <dl className="force-values">
          {shown.ratio !== null && <><dt>平均の力の前向きの割合</dt><dd>{Math.round(shown.ratio * 100)}%</dd></>}
          {shown.study && <><dt>研究の前向きの力（区間平均）</dt><dd>{shown.study}</dd></>}
          {shown.extra.map(([k, v]) => <Fragment key={k}><dt>{k}</dt><dd>{v}</dd></Fragment>)}
        </dl>
        </details>
      </div>}
      <p className="sprint10-hint">研究の数値は男子の区間平均です。その瞬間の力や、姿勢の良し悪しを示すものではありません。出し方は「数値の見方」で確認できます。</p>
    </>}
  </section>;
}
