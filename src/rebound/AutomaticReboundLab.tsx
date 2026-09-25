import { useEffect, useRef, useState } from 'react';
import { supportsExactRecording } from '../cmj/recording-session';
import { type JumpMode } from './lower-body';
import type { PoseFrame } from './prediction-observations';
import { type AutomaticFootResult } from './automatic-foot';
import { runAutomaticFoot, type AutomaticRun } from './automatic-run';
import { comparePoseModels, type PoseComparison } from './model-comparison';
import PoseModelComparison from './PoseModelComparison';
import PoseReplay from './PoseReplay';
import './rebound.css';

const number = (n: number | null, digits = 2) => n === null ? '—' : n.toFixed(digits);
export function AutomaticReboundResults({ result }: { result: AutomaticFootResult }) {
  return <section aria-label="RJ自動解析結果">
    <div className="rj-auto-headline">
      <p>平均RSI · 自動推定{result.partial ? '（成立した回のみ）' : ''}</p>
      <strong data-testid="automatic-rsi">{number(result.meanRSI)} <small>m/s</small></strong>
      <p>最大 {number(result.maxRSI)} m/s ／ 採用 {result.acceptedRSICount} / {result.expectedRSICount} 回</p>
      <p>認識 {result.recognizedJumps} 跳躍 · 最初の1回はRSI対象外</p>
    </div>
    {result.meanRSI === null ? <p role="alert" className="rj-warning">{result.reason ?? '足元の画像からRSIを算出できませんでした。靴と床の境界が見え、左右の足が重ならない方向から、カメラを固定して撮影してください。身長入力や手動登録は不要です。'}</p>
      : result.partial && <p className="rj-warning">全跳躍の平均ではありません。採用したのは {result.acceptedJumpNumbers.join('・')} 回目。判定できなかった回を0で埋めたり、別の回の時間で補ったりしていません。</p>}
    <p>平均跳躍高 {number(result.meanHeightM === null ? null : result.meanHeightM * 100, 1)} cm（算出 {result.heightCount} 回）</p>
    <details><summary>各跳躍の結果・判定できなかった理由</summary>
      <div style={{ overflowX: 'auto' }}><table className="rj-table"><thead><tr><th>跳躍</th><th>RSI m/s</th><th>高さ cm</th><th>接地 秒</th><th>滞空 秒</th><th>状態</th></tr></thead>
        <tbody>{result.jumps.map(j => <tr key={j.jump}><th>{j.jump}回目</th><td>{number(j.rsi)}</td><td>{number(j.heightM === null ? null : j.heightM * 100, 1)}</td><td>{number(j.contactSeconds, 3)}</td><td>{number(j.flightSeconds, 3)}</td><td>{j.reason ?? '自動推定'}{j.rsi === null && j.diagnostics.map((s, i) => <p key={i}>{s}</p>)}</td></tr>)}</tbody></table></div>
    </details>
    <p className="rj-warning">試験機能・精度未検証。足元の動きから時刻を推定し、跳躍高＝g×滞空時間²÷8、RSI＝跳躍高÷直前の接地時間で計算します。離地・着地時の重心高が等しい仮定を含みます。画像の条件判定を通っても正確さの保証ではありません。</p>
  </section>;
}

export default function AutomaticReboundLab() {
  const video = useRef<HTMLVideoElement>(null), canvas = useRef<HTMLCanvasElement>(null);
  const owner = useRef<AbortController | null>(null);
  const [file, setFile] = useState<File | null>(null), [url, setUrl] = useState('');
  const [mode, setMode] = useState<JumpMode>('BOTH'), [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0), [message, setMessage] = useState('動画を選んで解析してください。');
  const [aspect, setAspect] = useState(9 / 16), [poses, setPoses] = useState<PoseFrame[]>([]);
  const [result, setResult] = useState<AutomaticFootResult | null>(null), [exportData, setExportData] = useState<object | null>(null);
  const [comparison, setComparison] = useState<PoseComparison | null>(null);
  const [comparisonRuns, setComparisonRuns] = useState<AutomaticRun[]>([]);
  const [shownModel, setShownModel] = useState<'full' | 'heavy'>('full');
  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);
  useEffect(() => {
    const hidden = () => { if (document.hidden) owner.current?.abort(); };
    document.addEventListener('visibilitychange', hidden);
    return () => { owner.current?.abort(); owner.current = null; document.removeEventListener('visibilitychange', hidden); };
  }, []);
  const clear = () => { setResult(null); setExportData(null); setPoses([]); setProgress(0); setComparison(null); setComparisonRuns([]); setShownModel('full'); };
  async function start(compare = false) {
    if (!file || !canvas.current || busy || owner.current) return;
    if (!supportsExactRecording(file)) { setMessage('MOV/MP4の元動画と、元フレーム解析に対応したブラウザが必要です。'); return; }
    const control = new AbortController(); owner.current = control;
    const current = () => owner.current === control && !control.signal.aborted;
    clear(); setBusy(true); video.current?.pause();
    try {
      const models = compare ? ['full', 'heavy'] as const : ['full'] as const;
      const runs: AutomaticRun[] = [];
      for (const [i, model] of models.entries()) {
        runs.push(await runAutomaticFoot(file, canvas.current, mode, model, control.signal, (p, text) => {
          if (!current()) return;
          setProgress(Math.round((i * 100 + p) / models.length));
          if (canvas.current?.height) setAspect(canvas.current.width / canvas.current.height);
          setMessage(`${compare ? `${i + 1}/2モデル ${model === 'full' ? 'Full' : 'Heavy'}：` : ''}${text}`);
        }));
        if (!current()) return;
      }
      const first = runs[0];
      const compared = compare ? comparePoseModels(first.report, runs[1].report) : null;
      if (!current()) return;
      setPoses(first.poses); setResult(first.report); setProgress(100);
      setComparison(compared); setComparisonRuns(compare ? runs : []); setExportData(compared ?? first.report);
      setMessage(compared ? '比較が完了しました。FullとHeavyの採用回数・追跡・解析時間を確認してください。' : first.report.meanRSI === null ? '解析が完了しました。算出できなかった理由を表示しています。' : '解析が完了しました。手動確認・入力なしの自動推定結果です。');
    } catch (e) {
      if (owner.current === control) setMessage(control.signal.aborted ? '解析を停止しました。途中の値は表示しません。' : e instanceof Error ? e.message : String(e));
    } finally { if (owner.current === control) { owner.current = null; setBusy(false); } }
  }
  function save() {
    if (!exportData) return;
    const objectURL = URL.createObjectURL(new Blob([JSON.stringify(exportData)], { type: 'application/json' }));
    const a = document.createElement('a'); a.href = objectURL; a.download = comparison ? 'rebound-model-comparison.json' : 'rebound-automatic.json'; a.click(); setTimeout(() => URL.revokeObjectURL(objectURL), 1000);
  }
  return <main className="rj-lab rj-public">
    <header><a href={import.meta.env.BASE_URL}>← 種目を選ぶ</a><span>SACHIZU LAB</span></header>
    <div className="rj-title"><span>REBOUND JUMP · AUTO · v3</span><h1>RJ · 入力なし自動解析</h1><p>動画を選ぶ → 解析する → 平均RSI。身長・基準物・枠・離地や着地の手動登録は不要です。</p><p>モデル比較テスト v1：Full / Heavy</p></div>
    <section className="rj-capture"><h2>動画を選ぶ</h2>
      <input type="file" accept="video/*" aria-label="RJ動画を選ぶ" disabled={busy} onChange={e => { const f = e.target.files?.[0]; if (f) { clear(); setFile(f); setUrl(URL.createObjectURL(f)); setMessage('動画を選択しました。自動解析を開始できます。'); } }} />
      <label className="rj-protocol">種目<select aria-label="RJの種目" value={mode} disabled={busy} onChange={e => { clear(); setMode(e.target.value as JumpMode); }}><option value="BOTH">両足RJ</option><option value="RIGHT">右足RJ</option><option value="LEFT">左足RJ</option></select></label>
      <p>固定カメラ・1人の全身と足元・120/240fpsの元動画を使ってください。靴と床の境界が見える向きで撮影してください。録画解析です（リアルタイムではありません）。</p>
      {comparison && <label>骨格・下の詳細結果のモデル<select aria-label="表示する姿勢モデル" value={shownModel} onChange={e => {
        const model = e.target.value as 'full' | 'heavy', run = comparisonRuns.find(r => r.report.poseModel === model);
        if (run) { video.current?.pause(); setShownModel(model); setPoses(run.poses); setResult(run.report); }
      }}><option value="full">Full（現行）</option><option value="heavy">Heavy（比較用）</option></select></label>}
      <div className="rj-viewer" style={{ maxWidth: Math.min(720, aspect * 520), aspectRatio: aspect, marginInline: 'auto' }}>
        <video ref={video} src={url || undefined} controls={!!file && !busy} playsInline muted hidden={busy} onLoadedMetadata={e => { const v = e.currentTarget; if (v.videoHeight) setAspect(v.videoWidth / v.videoHeight); }} />
        <canvas ref={canvas} hidden={!busy} aria-label="RJの解析映像・骨格・推定重心" />
        {!busy && poses.length > 0 && <PoseReplay video={video} frames={poses} />}
      </div>
    </section>
    <button className="rj-button" disabled={!file || busy} onClick={() => void start()}>入力なしで自動解析</button>
    <section className="rj-capture"><h2>姿勢モデルを比較する</h2>
      <p>同じ動画をFull→Heavyの順に2回解析します。Heavyは初回約30MBの追加受信があり、数分以上かかる場合があります。画面を開いたままお待ちください。途中で停止できます。身長・手動時刻の入力は不要です。</p>
      <button className="rj-button rj-secondary" disabled={!file || busy} onClick={() => void start(true)}>FullとHeavyを比較</button>
    </section>
    {busy && <><progress max={100} value={progress} aria-label="解析の進捗" /><button className="rj-button rj-secondary" onClick={() => owner.current?.abort()}>解析を停止</button></>}
    <p role="status">{busy ? `${progress}% · ` : ''}{message}</p>
    {comparison && <PoseModelComparison comparison={comparison} />}
    {comparison && <h2>{shownModel === 'full' ? 'Full（現行）' : 'Heavy（比較用）'}の詳細結果</h2>}
    {result && <AutomaticReboundResults result={result} />}
    {exportData && <button className="rj-button" onClick={save}>{comparison ? 'Full・Heavy比較をJSON保存' : '自動解析結果・診断をJSON保存'}</button>}
    <footer>動画は端末内で処理 · 150MB / 30秒 / 3600フレーム以内 · 靴・路面・撮影条件を揃えて比較してください。</footer>
  </main>;
}
