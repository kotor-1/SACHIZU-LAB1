import type { HurdleResult } from './analysis';

const W = 340, H = 200, LEFT = 40, RIGHT = 14, TOP = 30, BOTTOM = 30;
const round = (v: number, step: number) => Math.round(v / step) * step;

/** The centre of mass seen from the side: its height over the ground against
 * its distance from the hurdle (m), the fitted parabola, the peak and the
 * hurdle (with its bar when its top is set). Null without a scale. */
export function ComPathChart({ result, width, height }: { result: HurdleResult; width: number; height: number }) {
  const a = result.apex, s = result.ruler.scale, T = result.takeoff === null ? null : result.contacts[result.takeoff], L = result.landing === null ? null : result.contacts[result.landing];
  if (!a || !s || a.beforeM === null || !T || !L) return null;
  const dir = result.direction, ground = result.hurdle.groundY !== null ? result.hurdle.groundY * height : (T.groundY + L.groundY) / 2;
  const along = (x: number) => (x - result.hurdleX) * dir * width / s, up = (y: number) => (ground - y * height) / s;
  const pts = a.path.map(p => ({ x: along(p.x), y: up(p.y) }));
  const curve = Array.from({ length: 41 }, (_, i) => {
    const t = a.path[0].pts + (a.path.at(-1)!.pts - a.path[0].pts) * i / 40, dt = t - a.curve.t0;
    return { x: along(a.curve.x0 + a.curve.vx * dt), y: up(a.curve.c + a.curve.b * dt + a.curve.a * dt * dt) };
  });
  const feet = [{ x: along(T.x / width), label: '踏切' }, { x: along(L.x / width), label: '着地' }];
  const bar = result.ruler.source === 'hurdle' && result.hurdle.barY !== null ? up(result.hurdle.barY) : null;
  const xs = [...pts.map(p => p.x), ...feet.map(f => f.x)], x0 = Math.min(...xs) - .1, x1 = Math.max(...xs) + .1;
  // Height: the range the centre of mass moves through and the bar (the ground left out), so the curve shows.
  const ys = pts.map(p => p.y), y0 = Math.floor((Math.min(...ys, bar ?? Infinity) - .05) * 20) / 20, y1 = Math.ceil((Math.max(...ys) + .07) * 20) / 20;
  const X = (v: number) => LEFT + (v - x0) / (x1 - x0) * (W - LEFT - RIGHT), Y = (v: number) => TOP + (y1 - v) / (y1 - y0) * (H - TOP - BOTTOM);
  const peak = { x: -a.beforeM, y: up(a.y) }, base = H - BOTTOM;
  const xTicks = [] as number[]; for (let v = Math.ceil(x0 / .5) * .5; v <= x1; v += .5) xTicks.push(round(v, .5));
  const yStep = y1 - y0 > .4 ? .1 : .05, yTicks = [] as number[]; for (let v = Math.ceil(y0 / yStep) * yStep; v <= y1 + 1e-9; v += yStep) yTicks.push(round(v, yStep));
  const place = a.beforeM >= 0 ? `${Math.round(a.beforeM * 100)}cm手前` : `${Math.round(-a.beforeM * 100)}cm先`;
  const above = result.overBar.atPeak === null ? null : `バーの${Math.round(result.overBar.atPeak * 100)}cm上`;
  const anchor = X(peak.x) > W - 90 ? 'end' : X(peak.x) < LEFT + 60 ? 'start' : 'middle';
  return <figure className="sprint10-chart">
    <figcaption>重心の軌跡<small>（真横から見た位置、m）</small></figcaption>
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`重心の軌跡：最高点はハードルの${place}${above ? `、${above}` : ''}、地面から${peak.y.toFixed(2)}m`}>
      {yTicks.map(v => <g key={`y${v}`}><line x1={LEFT} x2={W - RIGHT} y1={Y(v)} y2={Y(v)} className="grid" />
        <text x={LEFT - 6} y={Y(v)} textAnchor="end" dominantBaseline="middle">{v.toFixed(2)}</text></g>)}
      <line x1={LEFT} x2={W - RIGHT} y1={base} y2={base} stroke="#b8cec5" />
      {xTicks.map(v => <text key={`x${v}`} x={X(v)} y={H - 6} textAnchor="middle">{v === 0 ? '0' : v.toFixed(1)}</text>)}
      {bar === null ? <line x1={X(0)} x2={X(0)} y1={TOP} y2={base} stroke="#c0392b" strokeWidth={2} strokeDasharray="4 3" />
        : <g><line x1={X(0)} x2={X(0)} y1={Y(bar)} y2={base} stroke="#c0392b" strokeWidth={3} />
          <line x1={X(0) - 10} x2={X(0) + 10} y1={Y(bar)} y2={Y(bar)} stroke="#c0392b" strokeWidth={5} strokeLinecap="round" />
          <line x1={X(0)} x2={X(0)} y1={TOP} y2={Y(bar)} stroke="#c0392b" strokeWidth={1} strokeDasharray="3 3" /></g>}
      <text x={X(0) + 6} y={base - 6} className="value" style={{ fill: '#c0392b' }}>ハードル</text>
      {feet.map(f => <g key={f.label}><path d={`M${X(f.x) - 5},${base} L${X(f.x) + 5},${base} L${X(f.x)},${base - 8}Z`} fill="#3f5f55" />
        <text x={X(f.x)} y={base - 12} textAnchor="middle">{f.label}</text></g>)}
      {pts.map((p, i) => <circle key={i} cx={X(p.x)} cy={Y(p.y)} r={1.8} fill="#8aa89d" />)}
      <path d={curve.map((p, i) => `${i ? 'L' : 'M'}${X(p.x).toFixed(1)},${Y(p.y).toFixed(1)}`).join('')} fill="none" stroke="#e08a00" strokeWidth={2.5} />
      <line x1={X(peak.x)} x2={X(peak.x)} y1={Y(peak.y)} y2={base} stroke="#e08a00" strokeWidth={1} strokeDasharray="2 3" />
      <circle cx={X(peak.x)} cy={Y(peak.y)} r={5} fill="#e08a00" stroke="#fff" strokeWidth={1.5} />
      <text x={X(peak.x)} y={Y(peak.y) - (above ? 24 : 10)} textAnchor={anchor} className="value" style={{ fill: '#b06a00' }}>最高点：{place}</text>
      {above && <text x={X(peak.x)} y={Y(peak.y) - 10} textAnchor={anchor} className="value" style={{ fill: '#b06a00' }}>{above}</text>}
    </svg>
    <ul className="sprint10-legend"><li><span style={{ borderTop: '3px solid #e08a00' }} />重心の放物線</li><li><span style={{ borderTop: '2px dotted #8aa89d' }} />各コマの重心</li><li><span style={{ borderTop: '3px solid #c0392b' }} />ハードル</li></ul>
    <p className="sprint10-hint">縦軸は地面からの重心の高さ、横軸はハードルからの距離（踏切側がマイナス）。縮尺は{result.ruler.source === 'hurdle' ? 'ハードルの高さ' : '重心の放物線（重力）'}から。</p>
  </figure>;
}

const cm = (m: number | null) => m === null ? '—' : `${Math.round(m * 100)}`;
/** Distances against the hurdle and the centre of mass over the bar, with the ruler used. */
export function DistanceTable({ result }: { result: HurdleResult }) {
  const d = result.distances, a = result.apex, o = result.overBar, r = result.ruler;
  const ratio = d.takeoff !== null && d.landing !== null && d.takeoff + d.landing > 0 ? Math.round(d.takeoff / (d.takeoff + d.landing) * 100) : null;
  const rows: [string, string, string][] = [
    ['踏切距離', cm(d.takeoff), '踏切のつま先 → ハードル'],
    ['着地距離', cm(d.landing), 'ハードル → 着地のつま先'],
    ['踏切：着地', ratio === null ? '—' : `${ratio}:${100 - ratio}`, '踏切距離と着地距離の割合'],
    ['重心最高点の位置', a?.beforeM == null ? '—' : `${cm(Math.abs(a.beforeM))}${a.beforeM >= 0 ? ' 手前' : ' 先'}`, 'ハードルからの距離'],
    ['重心最高点の高さ', cm(o.atPeak), 'バーの上端から重心まで（重心が一番高い時）'],
    ['ハードル上の重心の高さ', cm(o.atHurdle), 'バーの上端から重心まで（重心がハードルの線を越える時）'],
  ];
  return <div className="sprint10-table-wrap"><table className="sprint10-table hurdle-distances" aria-label="ハードルに対する距離と高さ">
    <thead><tr><th scope="col">項目</th><th scope="col">cm</th></tr></thead>
    <tbody>{rows.map(([label, value, note]) => <tr key={label}><th scope="row">{label}<small>{note}</small></th><td>{value}</td></tr>)}</tbody>
    <caption>縮尺：{r.source === 'hurdle' ? `ハードルの高さから ${r.scale!.toFixed(0)}画素/m` : r.source === 'gravity' ? `重心の放物線（重力）から ${r.scale!.toFixed(0)}画素/m` : 'なし'}
      {r.source === 'hurdle' && r.gap !== null && `（重力からは ${r.gravityScale!.toFixed(0)}画素/m、差 ${r.gap >= 0 ? '+' : ''}${(r.gap * 100).toFixed(0)}%）`}</caption>
  </table></div>;
}

const fixed = (v: number | null, digits = 3) => v === null ? '—' : v.toFixed(digits);
/** The contacts around the hurdle and the flights between them, in one table. */
export function TimeTable({ result }: { result: HurdleResult }) {
  const t = result.times;
  const rows: [string, number | null, string, number | null][] = [
    ['踏切の1歩前', t.approachContact, '→ 踏切の接地', t.approachFlight],
    ['踏切', t.takeoffContact, '→ 着地（ハードル越え）', t.clearance],
    ['着地', t.landingContact, '→ 次の接地', t.afterFlight],
    ['着地の次の1歩', t.afterContact, '', null],
  ];
  return <div className="sprint10-table-wrap"><table className="sprint10-table hurdle-times" aria-label="接地と空中の時間">
    <thead><tr><th scope="col">接地</th><th scope="col">接地時間<small>秒</small></th><th scope="col">その後の空中<small>秒</small></th></tr></thead>
    <tbody>{rows.map(([label, contact, next, flight]) => <tr key={label} className={label === '踏切' ? 'is-key' : undefined}><th scope="row">{label}</th>
      <td>{fixed(contact)}</td><td>{next ? <>{fixed(flight)}<small>{next}</small></> : ''}</td></tr>)}</tbody>
  </table></div>;
}
