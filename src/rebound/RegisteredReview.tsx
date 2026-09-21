import { useMemo, useRef, useState } from 'react';
import ExactFramePicker, { type FirstContact } from '../cmj/ExactFramePicker';
import type { PoseFrame } from './prediction-observations';
import { registeredCSV, type RegisteredAnalysis } from './registered-template';
import { correctRegistered, eventKey, type BoundaryCorrections, type EventKind } from './registered-corrections';
import RegisteredResults from './RegisteredResults';

/** Mounted per source/template. Corrections update arithmetic only: no model
 * inference, video replay, or propagation of one manual timing to other jumps. */
export default function RegisteredReview({ file, poses, base }: {
  file: File; poses: readonly PoseFrame[]; base: RegisteredAnalysis;
}) {
  const [edits, setEdits] = useState<BoundaryCorrections>({});
  const [active, setActive] = useState<{ jump: number; kind: EventKind; pts: number } | null>(null);
  const [error, setError] = useState('');
  const [zoom, setZoom] = useState(true);
  const viewer = useRef<HTMLDivElement>(null);
  const result = useMemo(() => correctRegistered(base, edits, poses).analysis, [base, edits, poses]);
  const key = active ? eventKey(active.jump, active.kind) : '';
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
  }
  function save(csv: boolean) {
    const data = csv ? registeredCSV(result) : JSON.stringify({ version: result.version,
      file: { name: file.name, size: file.size }, referenceUsed: false,
      aggregation: { selectedJumps: result.jumps.map(j => j.jump),
        rsiJumps: result.jumps.filter(j => j.rsi !== null).map(j => j.jump),
        expectedRSICount: Math.max(0, result.jumps.length - 1), validRSICount: result.validRSICount, policy: 'MEAN_OF_RECOGNIZED_RSI' },
      corrections: edits, original: base, analysis: result }, null, 2);
    const url = URL.createObjectURL(new Blob([data], { type: csv ? 'text/csv;charset=utf-8' : 'application/json' }));
    const a = document.createElement('a'); a.href = url; a.download = `rebound-reviewed.${csv ? 'csv' : 'json'}`; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <section className="rj-review" aria-label="10跳躍の確認と修正">
    <h2>{result.jumps.length}跳躍の結果を確認・修正</h2>
    <p>3点は自動候補を作るための見本です。平均するのは3点ではありません。各回の離地・着地を直すと、その回と隣の回の数値・全体平均が即座に更新されます。</p>
    <p className="rj-partial-note">今回の集計：認識した{result.jumps.length}跳躍の高さ、RSIを算出できた{result.validRSICount}回の平均・最大。静止から跳ぶ1回目には直前の着地がないため、RSIを作りません。11回目は追加しません。</p>
    <div className="rj-review-jumps">{result.jumps.map(j => <article key={j.jump}>
      <strong>{j.jump}回目</strong><span>{j.rsi === null ? 'RSI —' : `RSI ${j.rsi.toFixed(2)}`}</span>
      {(['takeoff', 'landing'] as const).map(kind => <button key={kind} onClick={() => open(j.jump, kind)}
        aria-pressed={active?.jump === j.jump && active.kind === kind}>
        {j.jump}回目の{kind === 'takeoff' ? '離地' : '着地'}を修正
        <small>{j[kind]?.pts.toFixed(4) ?? '未取得'} 秒 · {edits[eventKey(j.jump, kind)] ? '修正済み' : j[kind]?.source === 'MANUAL' ? '登録値' : '予測'}</small>
      </button>)}
    </article>)}</div>
    {active && <div className="rj-review-editor" ref={viewer}>
      <h3>{active.jump}回目の{active.kind === 'takeoff' ? '離地' : '着地'}を登録</h3>
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
    <RegisteredResults result={result} seek={pts => {
      const j = result.jumps.find(j => j.takeoff?.pts === pts || j.landing?.pts === pts);
      if (j) open(j.jump, j.takeoff?.pts === pts ? 'takeoff' : 'landing');
    }} saveJSON={() => save(false)} saveCSV={() => save(true)} />
  </section>;
}
