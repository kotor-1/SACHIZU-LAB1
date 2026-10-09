import { useEffect, useMemo, useRef, useState } from 'react';
import type { CrouchFrame } from '../sprint10/crouch';
import type { Phase } from '../sprint10/crouch-figure';
import { CrouchReplay, frameInterval, insideFrame, PhaseFigures, type ReplayEvent } from '../sprint10/CrouchViews';
import { ticks } from '../sprint10/CrouchCharts';
import type { Rep, StrengthResult } from './analysis';
import { columnsOf, phaseGuides, strengthAdvice, summaryOf, type Column } from './advice';
import { repPhases, sideOn } from './figure';
import StrengthNotes from './StrengthNotes';

type Tab = 'advice' | 'reps' | 'pose' | 'replay';
const TABLES = [['form', '姿勢'], ['tempo', 'テンポ']] as const;

/** The result on the phone (the user, 2026-10-05: 「縦長で使いにくい」): a few numbers, then tabs; one table and one
 * graph at a time. Pictures and the slow replay need the video (not the camera without its recording). */
export default function StrengthResults({ result, frames, width, height, url, refiner, fine, camera, onSave }: {
  result: StrengthResult; frames: readonly CrouchFrame[]; width: number; height: number; url: string | null;
  refiner: 'webgpu' | 'wasm' | null; fine: boolean; camera: boolean; onSave: () => void }) {
  void width; void height;
  const card = useRef<HTMLElement>(null), tabsRef = useRef<HTMLDivElement>(null), panels = useRef<HTMLDivElement>(null), replay = useRef<HTMLVideoElement>(null);
  const [tab, setTab] = useState<Tab>('advice'), [table, setTable] = useState<typeof TABLES[number][0]>('form');
  const shown = useMemo(() => sideOn(frames, result.exercise), [frames, result.exercise]);
  const phases = useMemo(() => result.reason ? [] : repPhases(result), [result]);
  const advice = useMemo(() => result.reason ? [] : strengthAdvice(result), [result]);
  const checks = advice.filter(a => a.level === 'check').length;
  const events: ReplayEvent[] = useMemo(() => result.reps.flatMap(r => [{ label: `${r.index}回目の始まり`, short: `${r.index} 始`, pts: r.start },
    { label: `${r.index}回目の${result.exercise === 'squat' ? '最も深い所' : '最も倒した所'}`, short: `${r.index} 底`, pts: r.bottom }]), [result]);
  const seekTo = useRef<number | null>(null);
  const tabs: [Tab, string][] = url ? [['advice', 'ポイント'], ['reps', '回ごと'], ['pose', '姿勢'], ['replay', 'スロー']] : [['advice', 'ポイント'], ['reps', '回ごと']];
  useEffect(() => { setTab('advice'); card.current?.scrollIntoView?.({ behavior: 'smooth', block: 'start' }); }, [frames]);
  useEffect(() => {
    const v = replay.current;
    if (tab !== 'replay' || !v || seekTo.current === null) return;
    const t = insideFrame(seekTo.current, frameInterval(frames)); seekTo.current = null;
    const go = () => { v.pause(); v.currentTime = t; };
    if (v.readyState >= 1) go(); else v.addEventListener('loadedmetadata', go, { once: true });
  }, [tab, frames]);
  function choose(next: Tab) {
    setTab(next);
    const top = panels.current?.getBoundingClientRect().top, bar = tabsRef.current?.offsetHeight ?? 0;
    if (top !== undefined && top < bar) window.scrollBy({ top: top - bar });
  }
  function show(p: Phase) { seekTo.current = p.pts; choose('replay'); }
  const summary = result.reason ? [] : summaryOf(result), columns = columnsOf(result.exercise, table).filter(c => c.key !== 'heel' || result.refined);
  return <section ref={card} className="sprint10-card sprint10-result" aria-label="解析結果"><h2>解析結果</h2>
    {result.reason ? <p role="alert" className="sprint10-note">{result.reason}</p> : <>
      {camera && <p className="sprint10-note">カメラでの計測（簡易版）の結果です。録画を残した場合は「録画を詳しく解析」で、高精度の骨格による角度と姿勢の画像を見られます。</p>}
      <div className="sprint10-metrics sprint10-summary">{summary.map(m => <div key={m.label}><span>{m.label}</span><strong>{m.value}<small>{m.unit}</small></strong>{m.note && <em>{m.note}</em>}</div>)}</div>
      {!camera && !refiner && <p className="sprint10-note">高精度の骨格モデル（RTMPose）を読み込めなかったため、MediaPipeの骨格で角度を測っています。</p>}
      <div ref={tabsRef} className={`sprint10-tabs strength-tabs n${tabs.length}`} role="tablist" aria-label="結果の表示">{tabs.map(([id, label]) =>
        <button key={id} id={`strength-tab-${id}`} type="button" role="tab" aria-selected={tab === id} aria-controls={`strength-panel-${id}`} onClick={() => choose(id)}>
          {label}{id === 'advice' && checks > 0 && <span className="sprint10-badge" aria-label={`確かめたい点 ${checks}件`}>{checks}</span>}</button>)}</div>
      <div ref={panels} className="sprint10-panels">
        <div id="strength-panel-advice" role="tabpanel" aria-labelledby="strength-tab-advice" hidden={tab !== 'advice'}>
          {advice.length > 0 && <ul className="sprint10-advice" aria-label="見方のポイント">{advice.map(a => <li key={a.topic + a.text} className={a.level}>
            <span aria-hidden="true">{a.level === 'good' ? '✓' : a.level === 'check' ? '!' : 'i'}</span><div><strong>{a.topic}</strong>{a.text}</div></li>)}</ul>}
          <p className="sprint10-hint">目安は研究や指導書で報告された値で、選手ごとの目標ではありません（出典は「数値の見方」）。</p>
        </div>
        <div id="strength-panel-reps" role="tabpanel" aria-labelledby="strength-tab-reps" hidden={tab !== 'reps'}>
          <div className="sprint10-seg strength-table-seg" role="group" aria-label="表を選ぶ">{TABLES.map(([id, label]) =>
            <button key={id} type="button" aria-pressed={table === id} onClick={() => setTable(id)}>{label}</button>)}</div>
          <RepTable reps={result.reps} columns={columns} />
          <RepChart reps={result.reps} columns={columns} />
        </div>
        {url && <div id="strength-panel-pose" role="tabpanel" aria-labelledby="strength-tab-pose" hidden={tab !== 'pose'}>
          <p className="sprint10-hint">点線は鉛直（太ももは水平）、弧が測った角度。{result.exercise === 'slrdl' ? 'オレンジの線は肩・股関節・浮かせた足首（180°で一直線）。' : ''}画像を左右にスワイプして回を切り替えます。</p>
          {tab === 'pose' && phases.length ? <PhaseFigures url={url} frames={shown} phases={phases} onShow={show} guides={phaseGuides(result)} /> : null}
        </div>}
        {url && <div id="strength-panel-replay" role="tabpanel" aria-labelledby="strength-tab-replay" hidden={tab !== 'replay'} className="sprint10-replay">
          <CrouchReplay url={url} video={replay} frames={shown} phases={phases} events={events} />
          <p className="sprint10-hint">各回の最も深い所の前後では、測った線と角度を表示します。1/8は実際の8分の1の速さです。</p>
        </div>}
      </div>
      <StrengthNotes result={result} refiner={refiner} fine={fine} camera={camera} />
    </>}
    <button onClick={onSave}>結果を保存（JSON）</button>
  </section>;
}

const cell = (c: Column, r: Rep) => { const v = c.value(r); return v === null ? '—' : c.format ? c.format(v) : v.toFixed(c.digits); };
function RepTable({ reps, columns }: { reps: Rep[]; columns: Column[] }) {
  return <div className="sprint10-table-wrap"><table className="sprint10-table" aria-label="1回ごとの値">
    <thead><tr><th scope="col">回</th>{columns.map(c => <th key={c.key} scope="col">{c.short}{c.unit && <small>{c.unit}</small>}</th>)}</tr></thead>
    <tbody>{reps.map(r => <tr key={r.index}><th scope="row">{r.index}回目</th>{columns.map(c => <td key={c.key} className={c.flag?.(r) ? 'strength-flag' : undefined}>{cell(c, r)}</td>)}</tr>)}</tbody>
  </table></div>;
}

const W = 340, H = 170, LEFT = 40, RIGHT = 12, TOP = 22, BOTTOM = 24;
/** One value over the reps, chosen above it, with the guide's band where there is one. */
function RepChart({ reps, columns }: { reps: Rep[]; columns: Column[] }) {
  const charted = columns.filter(c => c.chart !== false);
  const [key, setKey] = useState(charted[0]?.key);
  const c = charted.find(x => x.key === key) ?? charted[0];
  if (!c || reps.length < 2) return null;
  const values = reps.map(r => c.value(r)), known = values.filter((v): v is number => v !== null);
  if (!known.length) return null;
  const band = c.band ?? null, marks = ticks(Math.min(...known, ...(band ?? [])), Math.max(...known, ...(band ?? []))), lo = marks[0], hi = marks.at(-1)!;
  const x = (i: number) => LEFT + 14 + (reps.length > 1 ? i / (reps.length - 1) : .5) * (W - LEFT - RIGHT - 28), y = (v: number) => TOP + (hi - v) / (hi - lo) * (H - TOP - BOTTOM);
  const points = values.map((v, i) => v === null ? null : { x: x(i), y: y(v), v });
  const path = points.reduce((d, p, i) => p ? `${d}${d && points[i - 1] ? 'L' : 'M'}${p.x.toFixed(1)},${p.y.toFixed(1)}` : d, '');
  return <figure className="sprint10-chart strength-chart">
    <div className="sprint10-chips" role="group" aria-label="グラフにする値">{charted.map(k =>
      <button key={k.key} type="button" aria-pressed={k.key === c.key} onClick={() => setKey(k.key)}>{k.short}</button>)}</div>
    <figcaption>{c.label}<small>（{c.unit || '値'}）</small></figcaption>
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${c.label}：${values.map((v, i) => `${i + 1}回目 ${v === null ? 'なし' : v.toFixed(c.digits)}`).join('、')}`}>
      {band && <rect x={LEFT} width={W - LEFT - RIGHT} y={y(Math.min(hi, band[1]))} height={Math.max(0, y(Math.max(lo, band[0])) - y(Math.min(hi, band[1])))} className="strength-band" />}
      {marks.map(m => <g key={m}><line x1={LEFT} x2={W - RIGHT} y1={y(m)} y2={y(m)} className="grid" />
        <text x={LEFT - 6} y={y(m)} textAnchor="end" dominantBaseline="middle">{m}</text></g>)}
      {reps.map((r, i) => <text key={r.index} x={x(i)} y={H - 7} textAnchor="middle">{r.index}</text>)}
      <path d={path} fill="none" stroke="#127a55" strokeWidth={2.5} />
      {points.map((p, i) => p && <g key={i}><circle cx={p.x} cy={p.y} r={3.5} fill="#127a55" />
        <text x={p.x} y={p.y - 7} textAnchor="middle" className="value" style={{ fill: '#127a55' }}>{p.v.toFixed(c.digits)}</text></g>)}
    </svg>
    {band && <p className="sprint10-hint">帯は目安の範囲（{band[0]}〜{band[1]}{c.unit}）。横軸は回数。</p>}
  </figure>;
}
