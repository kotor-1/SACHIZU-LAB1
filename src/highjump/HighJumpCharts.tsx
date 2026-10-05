import type { HighJumpResult } from './analysis';

const W = 340, H = 210, LEFT = 40, RIGHT = 14, TOP = 30, BOTTOM = 30, G = 9.81;
const round = (v: number, step: number) => Math.round(v / step) * step;

/** The centre of mass's height over the ground (m) by time from the toe-off: the frames measured, the parabola fitted
 * just after the toe-off (gravity fixed) carried to its peak, and the bar's height. */
export function LiftChart({ result, barHeight }: { result: HighJumpResult; barHeight: number }) {
  const l = result.lift; if (!l) return null;
  const peakT = Math.max(0, l.speed / G), z = (t: number) => l.h1 + l.speed * t - G / 2 * t * t;
  const shown = l.path.filter(p => p.t >= -.05 && p.t <= Math.max(.3, peakT + .05));
  const t0 = Math.min(-.05, ...shown.map(p => p.t)), t1 = Math.max(peakT + .05, ...shown.map(p => p.t));
  const curve = Array.from({ length: 41 }, (_, i) => { const t = peakT * i / 40; return { t, z: z(t) }; });
  const zs = [...shown.map(p => p.z), l.peak, barHeight], y0 = Math.floor((Math.min(...zs) - .05) * 10) / 10, y1 = Math.ceil((Math.max(...zs) + .1) * 10) / 10;
  const X = (t: number) => LEFT + (t - t0) / (t1 - t0) * (W - LEFT - RIGHT), Y = (v: number) => TOP + (y1 - v) / (y1 - y0) * (H - TOP - BOTTOM);
  const yStep = y1 - y0 > .6 ? .2 : .1, yTicks: number[] = []; for (let v = Math.ceil(y0 / yStep) * yStep; v <= y1 + 1e-9; v += yStep) yTicks.push(round(v, yStep));
  const xTicks: number[] = []; for (let v = Math.ceil(t0 / .1) * .1; v <= t1 + 1e-9; v += .1) xTicks.push(round(v, .1));
  const over = l.overBar >= 0 ? `バーの${Math.round(l.overBar * 100)}cm上` : `バーの${Math.round(-l.overBar * 100)}cm下`;
  const anchor = X(peakT) > W - 100 ? 'end' : 'middle';
  return <figure className="sprint10-chart">
    <figcaption>重心の高さ<small>（地面から、m。離地からの時間、秒）</small></figcaption>
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`重心の高さ：離地で${l.h1.toFixed(2)}m、上向きの速さ${l.speed.toFixed(2)}m/sで${Math.round(l.h2 * 100)}cm上がり、最高点${l.peak.toFixed(2)}m（${over}）`}>
      {yTicks.map(v => <g key={`y${v}`}><line x1={LEFT} x2={W - RIGHT} y1={Y(v)} y2={Y(v)} className="grid" />
        <text x={LEFT - 6} y={Y(v)} textAnchor="end" dominantBaseline="middle">{v.toFixed(1)}</text></g>)}
      {xTicks.map(v => <text key={`x${v}`} x={X(v)} y={H - 8} textAnchor="middle">{v === 0 ? '離地' : v.toFixed(1)}</text>)}
      <line x1={X(0)} x2={X(0)} y1={TOP} y2={H - BOTTOM} stroke="#3f5f55" strokeDasharray="2 3" />
      <line x1={LEFT} x2={W - RIGHT} y1={Y(barHeight)} y2={Y(barHeight)} stroke="#c0392b" strokeWidth={2} strokeDasharray="6 4" />
      <text x={LEFT + 4} y={Y(barHeight) + 14} className="value" style={{ fill: '#c0392b' }}>バー {barHeight.toFixed(2)}m</text>
      {shown.map((p, i) => <circle key={i} cx={X(p.t)} cy={Y(p.z)} r={p.fitted ? 2.4 : 1.6} fill={p.fitted ? '#3f5f55' : '#9fb8ae'} />)}
      <path d={curve.map((p, i) => `${i ? 'L' : 'M'}${X(p.t).toFixed(1)},${Y(p.z).toFixed(1)}`).join('')} fill="none" stroke="#e08a00" strokeWidth={2.5} />
      <line x1={X(peakT)} x2={X(peakT)} y1={Y(l.peak)} y2={Y(l.h1)} stroke="#e08a00" strokeWidth={1.5} strokeDasharray="3 3" />
      <line x1={X(0) - 4} x2={X(peakT) + 4} y1={Y(l.h1)} y2={Y(l.h1)} stroke="#e08a00" strokeWidth={1} strokeDasharray="2 3" />
      <text x={X(peakT) - 6} y={Y(l.h1 + .7 * l.h2)} textAnchor="end" className="value" style={{ fill: '#b06a00' }}>+{Math.round(l.h2 * 100)}cm</text>
      <circle cx={X(peakT)} cy={Y(l.peak)} r={5} fill="#e08a00" stroke="#fff" strokeWidth={1.5} />
      <text x={X(peakT)} y={Y(l.peak) - 10} textAnchor={anchor} className="value" style={{ fill: '#b06a00' }}>最高点 {l.peak.toFixed(2)}m</text>
    </svg>
    <ul className="sprint10-legend"><li><span style={{ borderTop: '3px solid #e08a00' }} />離地直後から求めた放物線</li><li><span style={{ borderTop: '3px dotted #3f5f55' }} />各コマの重心（濃い点で速さを計算）</li><li><span style={{ borderTop: '2px dashed #c0392b' }} />バー</li></ul>
    <p className="sprint10-hint">離地の直後（0.1秒）の重心の動きから上向きの速さを求め、重力で減速する放物線として最高点まで延ばしています。バー上では骨格が乱れるため、それより後の点は計算に使っていません。</p>
  </figure>;
}

const fixed = (v: number | null) => v === null ? '—' : v.toFixed(3);
/** The last contacts and flights, and each step's time from touchdown to touchdown. */
export function RhythmTable({ result }: { result: HighJumpResult }) {
  const t = result.times;
  const rows: [string, number | null, number | null, number | null, string][] = [
    ['踏切の2歩前', t.beforeContact, t.beforeFlight, null, ''],
    ['踏切の1歩前', t.penultContact, t.lastFlight, t.stepBefore, '2歩前→1歩前'],
    ['踏切', t.takeoffContact, null, t.lastStep, '1歩前→踏切'],
  ];
  return <div className="sprint10-table-wrap"><table className="sprint10-table highjump-times" aria-label="最後の接地と空中、1歩の時間">
    <thead><tr><th scope="col">接地</th><th scope="col">接地時間<small>秒</small></th><th scope="col">その後の空中<small>秒</small></th><th scope="col">1歩<small>接地→接地 秒</small></th></tr></thead>
    <tbody>{rows.map(([label, contact, flight, step, stepLabel]) => <tr key={label} className={label === '踏切' ? 'is-key' : undefined}><th scope="row">{label}</th>
      <td>{fixed(contact)}</td><td>{label === '踏切' ? '' : fixed(flight)}</td><td>{step === null ? '' : <>{fixed(step)}<small>{stepLabel}</small></>}</td></tr>)}</tbody>
  </table></div>;
}
