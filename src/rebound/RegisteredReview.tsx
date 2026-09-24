import { useMemo, useRef, useState } from 'react';
import ExactFramePicker, { type FirstContact } from '../cmj/ExactFramePicker';
import type { PoseFrame } from './prediction-observations';
import { type RegisteredAnalysis } from './registered-template';
import { reviewSummary, reviewedCSV, reviewedExport } from './auto-review';
import { correctRegistered, eventKey, type BoundaryCorrections, type EventKind } from './registered-corrections';
import RegisteredResults from './RegisteredResults';

/** Mounted per source/template. Corrections update arithmetic only: no model
 * inference, video replay, or propagation of one manual timing to other jumps. */
export default function RegisteredReview({ file, poses, base, coarse = base }: {
  file: File; poses: readonly PoseFrame[]; base: RegisteredAnalysis; coarse?: RegisteredAnalysis;
}) {
  const [edits, setEdits] = useState<BoundaryCorrections>({});
  const [active, setActive] = useState<{ jump: number; kind: EventKind; pts: number } | null>(null);
  const [error, setError] = useState('');
  const [zoom, setZoom] = useState(true);
  const [advance, setAdvance] = useState(true);
  const viewer = useRef<HTMLDivElement>(null);
  const result = useMemo(() => correctRegistered(base, edits, poses).analysis, [base, edits, poses]);
  const key = active ? eventKey(active.jump, active.kind) : '';
  const summary = reviewSummary(result);
  const events = result.jumps.flatMap(j => (['takeoff', 'landing'] as const).map(kind => ({ jump:j.jump,kind,confirmed:j[kind]?.source === 'MANUAL' })));
  const currentIndex = events.findIndex(e => eventKey(e.jump,e.kind) === key);
  const pending = events.find(e => !e.confirmed);
  const crop = useMemo(() => {
    if (!active || !poses.length || !zoom) return undefined;
    const p = poses.reduce((a, b) => Math.abs(a.pts - active.pts) < Math.abs(b.pts - active.pts) ? a : b).poses;
    const feet = p.length === 1 ? [29, 30, 31, 32].map(i => p[0][i]).filter(v => v && Number.isFinite(v.x) && Number.isFinite(v.y)) : [];
    if (feet.length !== 4) return undefined;
    const left = Math.max(0, Math.min(...feet.map(v => v.x)) - .12), right = Math.min(1, Math.max(...feet.map(v => v.x)) + .12);
    const top = Math.max(0, Math.min(...feet.map(v => v.y)) - .09), bottom = Math.min(1, Math.max(...feet.map(v => v.y)) + .1);
    return right > left && bottom > top ? { left, right, top, bottom } : undefined;
  }, [active, poses, zoom]);
  function open(jump: number, kind: EventKind) {
    const j = result.jumps.find(j => j.jump === jump);
    const apex = poses.find(f => f.frame === base.selectedPeakFrames[jump - 1]);
    setActive({ jump, kind, pts: j?.[kind]?.pts ?? apex?.pts ?? 0 }); setError('');
    setTimeout(() => viewer.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 0);
  }
  function register(value: FirstContact) {
    const next = { ...edits, [key]: value }, checked = correctRegistered(base, next, poses);
    if (checked.error) { setError(checked.error); return; }
    setEdits(next); setError('');
    if (advance) {
      const nextEvent = events.slice(currentIndex+1).find(e => !e.confirmed);
      if (nextEvent) open(nextEvent.jump,nextEvent.kind);
    }
  }
  function save(csv: boolean) {
    const data = csv ? reviewedCSV(result) : JSON.stringify({...reviewedExport(result, base, edits, file), coarseCandidates:coarse}, null, 2);
    const url = URL.createObjectURL(new Blob([data], { type: csv ? 'text/csv;charset=utf-8' : 'application/json' }));
    const a = document.createElement('a'); a.href = url; a.download = `rebound-reviewed.${csv ? 'csv' : 'json'}`; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <section className="rj-review" aria-label="跳躍の確認と修正">
    <h2>{result.jumps.length}跳躍の結果を確認・修正</h2>
    <p>候補の足元を確認し、合っていればそのまま確定、ずれていればコマ送りで修正します。再解析は不要です。確認した時刻だけを使うRSIと、未確認の仮値を分けて表示します。</p>
    {base.footRefinement&&<div className="rj-partial-note"><strong>足元による絞り込み：{base.footRefinement.applied} / {base.footRefinement.attempted} 箇所</strong>
      {base.footRefinement.polarity&&<p>動画全体で採用した輪郭：地面より{base.footRefinement.polarity==='BRIGHT'?'明るい':'暗い'}側。別の明暗判定の成立数は{base.footRefinement.alternateApplied ?? '—'}箇所です。</p>}
      <p>画像から候補を絞れた箇所を反映しました。未確定なので映像で確認してください。靴と地面に明暗差があり、左右の足が分離して見える映像向けです。絞れない箇所は元候補／未取得のまま残します。</p>
      <details><summary>要確認箇所と補正量</summary>{base.footRefinement.events.map(e=><p key={`${e.jump}-${e.kind}`}>
        {e.jump}回目の{e.kind==='takeoff'?'離地':'着地'}：{e.applied&&e.pts!==null ? e.originalPts!==null?`足元候補へ ${((e.pts-e.originalPts)*1000).toFixed(1)}ms` : '複数の画像候補が一致・未確認' : e.reason}
      </p>)}</details></div>}
    <div className="rj-review-progress"><strong>確認 {events.filter(e => e.confirmed).length} / {events.length} 箇所 · RSI確定 {summary.count} 回</strong>
      <button className="rj-button" disabled={!pending} onClick={() => pending && open(pending.jump,pending.kind)}>{pending ? '未確認から順に確認' : 'すべて確認済み'}</button>
      <p>静止開始の1回目は高さのみ。RSIは直前の着地・今回の離地・着地がそろった回から集計します。</p></div>
    <div className="rj-review-jumps">{result.jumps.map(j => <article key={j.jump}>
      <strong>{j.jump}回目</strong><span>{j.rsi === null ? 'RSI —' : `${summary.jumpNumbers.includes(j.jump) ? '確認済み' : '仮値'} ${j.rsi.toFixed(2)}`}</span>
      {(['takeoff', 'landing'] as const).map(kind => <button key={kind} onClick={() => open(j.jump, kind)}
        aria-pressed={active?.jump === j.jump && active.kind === kind}>
        {j.jump}回目の{kind === 'takeoff' ? '離地' : '着地'}を修正
        <small>{j[kind]?.pts.toFixed(4) ?? '未取得'} 秒 · {j[kind]?.source === 'MANUAL' ? '確認済み' : j[kind]?.source === 'PIXEL_REFINED' ? '足元で絞った候補・未確認' : '元候補・要確認'}</small>
      </button>)}
    </article>)}</div>
    {active && <div className="rj-review-editor" ref={viewer}>
      <h3>{active.jump}回目の{active.kind === 'takeoff' ? '離地' : '着地'}を登録</h3>
      {!result.jumps.find(j => j.jump === active.jump)?.[active.kind] && <p className="rj-warning">この箇所の候補は取得できませんでした。跳躍の頂点付近を表示しています。シークバーで足元の{active.kind === 'takeoff' ? '離地' : '着地'}を探してください。</p>}
      <nav className="rj-review-nav" aria-label="確認箇所の移動">{[-1,1].map(offset => <button key={offset} disabled={!events[currentIndex+offset]} onClick={() => {
        const e = events[currentIndex+offset]; if(e) open(e.jump,e.kind);
      }}>{offset < 0 ? '前の箇所' : '次の箇所'}</button>)}</nav>
      <label><input type="checkbox" checked={advance} onChange={e => setAdvance(e.target.checked)} />確定したら次の未確認箇所へ</label><br />
      <label><input type="checkbox" checked={zoom} onChange={e => setZoom(e.target.checked)} />足元を拡大（切替時は候補位置に戻ります）</label>
      <ExactFramePicker key={`${key}-${zoom}`} file={file} disabled={false} initialTime={active.pts} getTime={() => active.pts} previewRegion={crop}
        frameLabel="RJ結果の修正フレーム" instructions={active.kind === 'takeoff'
          ? '離地：支持していた足が床から離れた最初のコマ。両足RJでは両足が離れたコマを選びます。'
          : '着地：支持脚が床に触れた最初のコマ。両足RJではどちらかの足が触れたコマを選びます。'}
        registrations={[{ label: `${active.jump}回目の${active.kind === 'takeoff' ? '離地' : '着地'}に確定`, value: edits[key] ?? null, onRegister: register }]} />
      {error && <p role="alert">{error}</p>}
      <p role="status">{edits[key] ? '登録済み。下の結果・平均・保存データに反映しました。' : 'コマを選び「確定」を押すと結果が更新されます。'}</p>
      {edits[key] && <button onClick={() => {
        const next = { ...edits }; delete next[key]; const checked = correctRegistered(base, next, poses);
        if (checked.error) { setError(checked.error); return; } setEdits(next); setError('');
      }}>この箇所を元の候補に戻す</button>}
      <button onClick={() => setActive(null)}>確認画面を閉じる</button>
    </div>}
    <RegisteredResults reviewed result={result} seek={pts => {
      const j = result.jumps.find(j => j.takeoff?.pts === pts || j.landing?.pts === pts);
      if (j) open(j.jump, j.takeoff?.pts === pts ? 'takeoff' : 'landing');
    }} saveJSON={() => save(false)} saveCSV={() => save(true)} />
  </section>;
}
