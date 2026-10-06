import { useState } from 'react';
import type { CrouchResult } from './crouch';
import { ELITE_EXAMPLE } from './crouch-advice';

interface Series { label: string; color: string; values: (number | null)[]; dashed?: boolean }
const W = 340, H = 180, LEFT = 44, RIGHT = 14, TOP = 26, BOTTOM = 26, INSET = 18;

/** Round ticks (1, 2 or 5 times a power of ten), about four, from below the
 * lowest value to at or above the highest; values all alike are given room. */
export function ticks(min: number, max: number) {
  const pad = max - min < 1e-9 ? Math.max(Math.abs(max) * .05, 1e-3) : 0, lo = min - pad, hi = max + pad;
  const raw = (hi - lo) / 4, power = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 5, 10].map(m => m * power).find(s => s >= raw)!;
  const out: number[] = [];
  for (let v = Math.floor(lo / step + 1e-9) * step; ; v += step) { out.push(+v.toFixed(10)); if (v >= hi - step * 1e-9) break; }
  return out;
}

/** One small line graph over the steps, with each point's value. */
function StepChart({ title, steps, series, digits, unit }: { title: string; steps: number; series: Series[]; digits: number; unit: string }) {
  const all = series.flatMap(s => s.values.filter((v): v is number => v !== null));
  if (!all.length) return null;
  const marks = ticks(Math.min(...all), Math.max(...all)), lo = marks[0], hi = marks.at(-1)!;
  // The points stand clear of the axis labels (a first value's label ran into them).
  const x = (i: number) => LEFT + INSET + (steps > 1 ? i / (steps - 1) : .5) * (W - LEFT - RIGHT - 2 * INSET), y = (v: number) => TOP + (hi - v) / (hi - lo) * (H - TOP - BOTTOM);
  const summary = series.filter(s => !s.dashed).map(s => `${s.label}：${s.values.map((v, i) => `${i + 1}歩目 ${v === null ? 'なし' : v.toFixed(digits)}`).join('、')}`).join('。');
  return <figure className="sprint10-chart">
    <figcaption>{title}<small>（{unit}）</small></figcaption>
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${title}：${summary}`}>
      {marks.map(m => <g key={m}><line x1={LEFT} x2={W - RIGHT} y1={y(m)} y2={y(m)} className="grid" />
        <text x={LEFT - 6} y={y(m)} textAnchor="end" dominantBaseline="middle">{m.toFixed(digits === 3 ? 2 : digits)}</text></g>)}
      {Array.from({ length: steps }, (_, i) => <text key={i} x={x(i)} y={H - 8} textAnchor="middle">{i + 1}歩目</text>)}
      {series.map(s => {
        const points = s.values.map((v, i) => v === null || i >= steps ? null : { x: x(i), y: y(v), v });
        const path = points.reduce((d, p, i) => p ? `${d}${d && points[i - 1] ? 'L' : 'M'}${p.x.toFixed(1)},${p.y.toFixed(1)}` : d, '');
        return <g key={s.label}>
          <path d={path} fill="none" stroke={s.color} strokeWidth={s.dashed ? 1.5 : 2.5} strokeDasharray={s.dashed ? '5 4' : undefined} />
          {!s.dashed && points.map((p, i) => p && <g key={i}><circle cx={p.x} cy={p.y} r={3.5} fill={s.color} />
            <text x={p.x} y={p.y - 7} textAnchor="middle" className="value" style={{ fill: s.color }}>{p.v.toFixed(digits)}</text></g>)}
        </g>;
      })}
    </svg>
    <ul className="sprint10-legend">{series.map(s => <li key={s.label}><span style={{ borderTop: `${s.dashed ? '2px dashed' : '3px solid'} ${s.color}` }} />{s.label}</li>)}</ul>
  </figure>;
}

const CHARTS = [['time', '接地・滞空'], ['pitch', 'ピッチ'], ['angle', '接地時の角度']] as const;

/** How the steps change: times, pitch and the angles at touchdown, step by
 * step; one graph at a time, chosen above it (three stacked graphs made the
 * phone screen long, the user 2026-10-05: 「縦長で使いにくい」). */
export default function CrouchCharts({ result }: { result: CrouchResult }) {
  const [shown, setShown] = useState<typeof CHARTS[number][0]>('time');
  const steps = result.steps.length;
  if (steps < 2) return <p>2歩以上の接地が映っていると、歩ごとの変化をグラフで表示します。</p>;
  const elite = (v: readonly number[]) => Array.from({ length: steps }, (_, i) => v[i] ?? null);
  return <div className="sprint10-charts">
    <div className="sprint10-seg" role="group" aria-label="グラフを選ぶ">{CHARTS.map(([id, label]) =>
      <button key={id} type="button" aria-pressed={shown === id} onClick={() => setShown(id)}>{label}</button>)}</div>
    {shown === 'time' && <StepChart title="接地時間・滞空時間" unit="秒" steps={steps} digits={3} series={[
      { label: '接地時間', color: '#127a55', values: result.steps.map(s => s.contactSeconds) },
      { label: '滞空時間', color: '#2a6fdb', values: result.steps.map(s => s.flightSeconds) },
      { label: 'トップ選手の例（接地）', color: '#127a55', values: elite(ELITE_EXAMPLE.contact), dashed: true },
      { label: 'トップ選手の例（滞空）', color: '#2a6fdb', values: elite(ELITE_EXAMPLE.flight), dashed: true }]} />}
    {shown === 'pitch' && <StepChart title="ピッチ" unit="歩/秒" steps={steps} digits={2} series={[
      { label: 'ピッチ', color: '#8a4fd8', values: result.steps.map(s => s.pitch) }]} />}
    {shown === 'angle' && <StepChart title="接地時の角度" unit="°" steps={steps} digits={0} series={[
      { label: '脛（鉛直から前へ）', color: '#0b9bc4', values: result.steps.map(s => s.shankAngle) },
      { label: '体幹（鉛直から前へ）', color: '#e08a00', values: result.steps.map(s => s.trunkAngle) }]} />}
  </div>;
}

const fixed = (v: number | null, digits: number) => v === null ? '—' : v.toFixed(digits);
/** Every step's values in one table, in place of a card per step. */
export function StepTable({ result, edited }: { result: CrouchResult; /** Steps with a value from a frame the user chose. */ edited?: ReadonlySet<number> }) {
  return <div className="sprint10-table-wrap"><table className="sprint10-table" aria-label="1歩ごとの値">
    <thead><tr><th scope="col">歩</th><th scope="col">接地<small>秒</small></th><th scope="col">滞空<small>秒</small></th>
      <th scope="col">ピッチ<small>歩/秒</small></th><th scope="col">脛<small>接地時</small></th><th scope="col">体幹<small>接地時</small></th></tr></thead>
    <tbody>{result.steps.map(s => <tr key={s.step}><th scope="row">{s.step}歩目{edited?.has(s.step) && <i className="crouch-edited" aria-label="（手で直した値を含む）">✎</i>}</th>
      <td>{fixed(s.contactSeconds, 3)}</td><td>{fixed(s.flightSeconds, 3)}</td><td>{fixed(s.pitch, 2)}</td>
      <td>{s.shankAngle === null ? '—' : `${Math.round(s.shankAngle)}°`}</td><td>{s.trunkAngle === null ? '—' : `${Math.round(s.trunkAngle)}°`}</td></tr>)}</tbody>
  </table></div>;
}
