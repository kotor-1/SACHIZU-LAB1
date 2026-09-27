import { useEffect, useRef, useState } from 'react';
import { measureRecording, supportsExactRecording } from '../cmj/recording-session';
import type { PoseFrame } from './prediction-observations';
import { predictionSignals } from './prediction-observations';
import { AUTOMATIC_REGION } from './automatic-foot';
import { wholeCycleReport } from './whole-cycle-research';
import { toeCycleReport } from './toe-cycle-research';
import { parseToeCycleImport, MAX_TOE_CYCLE_IMPORT_BYTES } from './toe-cycle-import';
import PoseReplay from './PoseReplay';
import './rebound.css';

type Report = ReturnType<typeof toeCycleReport>;
type Observation = { file: File | null; filename: string; sourceBytes: number; hash: string;
  poses: PoseFrame[]; origin: 'VIDEO' | 'SAVED_JSON' };
export const TOE_CYCLE_PRESENTATION_VERSION = 'rj-toe-cycle-presentation-v3';
const fmt = (v: number | null | undefined, digits = 2) => v == null ? '—' : v.toFixed(digits);
const reasons: Record<string, string> = {
  TRACKING_GAP: 'つま先の追跡が不足', TOE_TRACKING_GAP: 'つま先の追跡が不足',
  INSUFFICIENT_MOTION: 'つま先の上下動が小さい', WAVEFORM_MISMATCH: 'つま先の軌跡がモデルと合わない',
  INSUFFICIENT_PEAKS: '周期を作る頂点が不足', FRAME_RATE_TOO_LOW: '元動画のフレームレートが不足',
  PERIOD_OUT_OF_RANGE: '周期が条件外', INVALID_TIMELINE: '動画の時刻が不正',
  LEFT_TOE_TRACKING_GAP: '左つま先の追跡が不足', RIGHT_TOE_TRACKING_GAP: '右つま先の追跡が不足',
  LEFT_TOE_INSUFFICIENT_MOTION: '左つま先の上下動が小さい', RIGHT_TOE_INSUFFICIENT_MOTION: '右つま先の上下動が小さい',
  TOE_WAVEFORM_MISMATCH: 'つま先の軌跡がモデルと合わない', TOES_DISAGREE: '左右のつま先で推定が一致しない',
  TOE_WAVEFORM_UNIDENTIFIABLE: 'つま先の軌跡から時間割合を絞れない', LOWER_SCALE_UNAVAILABLE: '下肢の追跡が不足',
  LOWER_POINTS_UNAVAILABLE: '下肢の追跡が不足', INSUFFICIENT_SAMPLES: '動画のコマ数が不足',
  PELVIS_TRACKING_GAP: '骨盤の追跡が不足', PELVIS_WAVEFORM_MISMATCH: '骨盤の軌跡がモデルと合わない',
  PELVIS_SUBJECT_DRIFT: '対象者の横移動が大きい', PELVIS_INSUFFICIENT_EXCURSION: '骨盤の上下動が小さい',
};
export function ToeCycleResults({ report: r, pelvisMean }: { report: Report; pelvisMean: number | null }) {
  return <section aria-label="つま先軌跡によるRJ予測結果">
    <div className="rj-auto-headline">
      <p>RSI予測 · モデル設定による候補幅</p>
      <strong data-testid="toe-cycle-range" style={{ fontSize: 'clamp(28px, 7vw, 56px)', overflowWrap: 'anywhere' }}>
        {r.meanProfileRange ? `${fmt(r.meanProfileRange[0])}～${fmt(r.meanProfileRange[1])}` : '—'} <small>m/s</small>
      </strong>
      <p>この幅は信頼区間・実測誤差の上限ではありません。選手の能力を比較できる精度は確認できていません。</p>
      <p>各周期の最適候補の平均（参考）：<span data-testid="toe-cycle-rsi">{fmt(r.mean)} m/s</span></p>
      <p>計算できた周期 {r.acceptedCycles} / {r.totalCycles} · 認識 {r.detected} 頂点</p>
      <p>全周期を計算できても、RSIの正確さを確認した意味ではありません。</p>
      <p>表示 v3 · 推定モデルは試験版 v2のまま</p>
    </div>
    {r.mean === null && <p role="alert" className="rj-warning">{reasons[r.reason ?? ''] ?? r.reason ?? 'この動画では予測を算出できませんでした。下の各周期の理由を確認してください。'} 数値を0や過去の平均で補っていません。</p>}
    {r.partial && <p className="rj-warning">全周期の平均ではありません。算出周期：{r.acceptedCycleIds.join('・') || 'なし'}。</p>}
    <p>身長入力・手動のコマ指定は不要です。離地・着地を1コマずつ確定せず、つま先が上下する軌跡全体から内部の時間割合を推定します。</p>
    <p className="rj-warning">精度未検証の予測です。つま先の動きと全身重心の動きは同じではありません。接地に相当する時間もモデル内部の推定で、測定器の実測値ではありません。</p>
    {!!r.boundaryCycles.length && <p className="rj-warning">探索範囲の端に達した周期：{r.boundaryCycles.join('・')}。この平均は特に不安定な可能性があります。</p>}
    {!!r.phaseBoundaryCycles.length && <p className="rj-warning">骨盤とつま先のタイミング差が探索範囲の端に達した周期：{r.phaseBoundaryCycles.join('・')}。時間割合を十分に絞れていない可能性があります。</p>}
    <details><summary>各周期の値・算出できなかった理由</summary>
      <div style={{ overflowX: 'auto' }}><table className="rj-table"><thead><tr><th>頂点間</th><th>周期 秒</th><th>RSI候補幅 / 参考値</th><th>状態</th></tr></thead><tbody>
        {r.cycles.map(c => <tr key={c.id}><th>{c.id}→{c.id + 1}</th><td>{fmt(c.period, 3)}</td><td>{c.result ? <>{fmt(c.result.profileRange[0])}～{fmt(c.result.profileRange[1])}<br />参考 {fmt(c.result.value)}</> : '—'}</td>
          <td>{c.reason ? reasons[c.reason] ?? c.reason : c.result?.boundary || c.result?.phaseBoundary ? '探索範囲の端・要注意' : 'モデル予測'}</td></tr>)}
      </tbody></table></div>
    </details>
    <details><summary>モデル候補の幅・今回の確認ポイント</summary>
      <p>各周期の候補下限・上限を平均した範囲：{fmt(r.meanProfileRange?.[0])}～{fmt(r.meanProfileRange?.[1])} m/s。モデル設定に依存する幅で、信頼区間・誤差保証ではありません。</p>
      <p>まず認識した頂点数が動画の跳躍回数と合うか、算出周期がいくつかを確認してください。同じ動画で再解析し、保存したJSONと一緒に結果を比較できます。</p>
    </details>
    <details><summary>従来の骨盤モデルとの違い</summary>
      <p>同じ骨格データの従来モデル：{fmt(pelvisMean)} m/s。新方式と採用周期が異なる場合があります。高い方を正解として選んだり、両者を混ぜたりしていません。</p>
      <p>隣接する頂点間を1周期とします。11頂点なら10周期です。各跳躍の実測RSIや「最後3回平均」と同じ集計ではありません。</p>
    </details>
  </section>;
}

export default function ToeCycleLab() {
  const video = useRef<HTMLVideoElement>(null), canvas = useRef<HTMLCanvasElement>(null);
  const videoInput = useRef<HTMLInputElement>(null);
  const owner = useRef<AbortController | null>(null);
  const cached = useRef<Observation | null>(null);
  const [file, setFile] = useState<File | null>(null), [url, setUrl] = useState('');
  const [savedSource, setSavedSource] = useState<string | null>(null);
  const [busy, setBusy] = useState(false), [aspect, setAspect] = useState(9 / 16);
  const [poses, setPoses] = useState<PoseFrame[]>([]), [report, setReport] = useState<Report | null>(null);
  const [pelvisMean, setPelvisMean] = useState<number | null>(null), [exportData, setExportData] = useState<object | null>(null);
  const [message, setMessage] = useState('両足RJの元動画を選んでください。');
  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);
  useEffect(() => {
    const hidden = () => { if (document.hidden) owner.current?.abort(); };
    document.addEventListener('visibilitychange', hidden);
    return () => { owner.current?.abort(); owner.current = null; cached.current = null; document.removeEventListener('visibilitychange', hidden); };
  }, []);
  function clear() { setReport(null); setPoses([]); setPelvisMean(null); setExportData(null); }
  async function loadJSON(selected: File) {
    if (owner.current) return;
    const control = new AbortController(); owner.current = control; setBusy(true);
    cached.current = null; clear(); setFile(null); setUrl(''); setSavedSource(null);
    if (videoInput.current) videoInput.current.value = '';
    setMessage('保存済みJSONの骨格と時刻を検査しています。');
    try {
      if (selected.size > MAX_TOE_CYCLE_IMPORT_BYTES) throw Error('保存済みJSONのサイズが上限を超えています。');
      const text = await selected.text();
      if (owner.current !== control || control.signal.aborted) return;
      const imported = parseToeCycleImport(text, selected.size);
      cached.current = { file: null, filename: imported.filename, sourceBytes: imported.sourceBytes,
        hash: imported.sourceVideoSHA256, poses: imported.poses, origin: 'SAVED_JSON' };
      setSavedSource(imported.filename);
      setMessage('JSONを読み込みました。「入力なしでRJを解析」で、骨格の再取得なしに再計算できます。');
    } catch (e) {
      if (owner.current === control) setMessage(e instanceof Error ? e.message : String(e));
    } finally {
      if (owner.current === control) {
        if (control.signal.aborted) setMessage('停止しました。途中の結果は表示しません。');
        owner.current = null; setBusy(false);
      }
    }
  }
  async function start() {
    if ((!file && !cached.current) || !canvas.current || owner.current) return;
    if (file && file.size > 150 * 1024 * 1024) { setMessage('150MB以内の動画を選んでください。'); return; }
    if (file && !supportsExactRecording(file)) { setMessage('MOV/MP4の元動画と元フレーム解析に対応したブラウザが必要です。'); return; }
    const control = new AbortController(); owner.current = control; setBusy(true); clear(); video.current?.pause();
    const current = () => owner.current === control && !control.signal.aborted;
    const started = performance.now();
    try {
      let observation = cached.current?.file === file ? cached.current : null;
      const reused = !!observation;
      if (!observation) {
        if (!file) throw Error('動画または保存済みJSONを選んでください。');
        setMessage('動画の同一性を確認しています。');
        const bytes = await file.arrayBuffer();
        const hash = [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map(b => b.toString(16).padStart(2, '0')).join('');
        if (!current()) { setMessage('停止しました。途中の結果は表示しません。'); return; }
        const frames: PoseFrame[] = [];
        await measureRecording(file, canvas.current, control.signal, state => {
          if (!current()) return;
          if (canvas.current?.height) setAspect(canvas.current.width / canvas.current.height);
          setMessage(`骨格を取得中：${state.processedFrames} / ${state.totalFrames ?? '—'} コマ`);
        }, text => { if (current()) setMessage(text); }, { analysis: 'OBSERVATIONS', observationModel: 'full',
          onPose: (p, frame, pts) => frames.push({ frame, pts, poses: p }) });
        if (!current()) { setMessage('停止しました。途中の結果は表示しません。'); return; }
        observation = { file, filename: file.name, sourceBytes: file.size, hash, poses: frames, origin: 'VIDEO' }; cached.current = observation;
      }
      setMessage(reused ? '保存済みの骨格から再計算しています。' : 'つま先の連続軌跡を計算しています。');
      // Yield so the progress message and stop button remain visible before the fit.
      await new Promise<void>(resolve => setTimeout(resolve, 0));
      if (!current()) { setMessage('停止しました。途中の結果は表示しません。'); return; }
      const result = toeCycleReport(observation.poses, observation.hash, observation.filename);
      const baseline = wholeCycleReport(predictionSignals(observation.poses, AUTOMATIC_REGION, 'BOTH').PELVIS, observation.hash, observation.filename);
      if (!current()) return;
      setPoses(observation.poses); setReport(result); setPelvisMean(baseline.mean);
      setExportData({ version: 'rj-toe-cycle-export-v1', presentationVersion: TOE_CYCLE_PRESENTATION_VERSION,
        result, pelvisComparison: baseline, inputProvenance: { kind: observation.origin, sourceVideoVerified: observation.origin === 'VIDEO' },
        observationModel: 'full', manualInputsUsed: false, videoUploaded: false, poses: observation.poses,
        environment: { userAgent: navigator.userAgent, sourceFrames: observation.poses.length, sourceBytes: observation.sourceBytes } });
      setMessage(`解析完了（${Math.round((performance.now() - started) / 1000)}秒）${reused ? ' · 骨格の再取得なし' : ''}。${result.mean === null ? '算出できなかった理由を確認してください。' : '候補幅と参考値を表示しました。精度確認ではありません。'}`);
    } catch (e) {
      if (owner.current === control) setMessage(control.signal.aborted ? '停止しました。途中の結果は表示しません。' : e instanceof Error ? e.message : String(e));
    } finally { if (owner.current === control) { owner.current = null; setBusy(false); } }
  }
  function save() {
    if (!exportData) return;
    const objectURL = URL.createObjectURL(new Blob([JSON.stringify(exportData)], { type: 'application/json' }));
    const a = document.createElement('a'); a.href = objectURL; a.download = 'rebound-toe-cycle.json'; a.click();
    setTimeout(() => URL.revokeObjectURL(objectURL), 1000);
  }
  return <main className="rj-lab rj-public">
    <header><a href={import.meta.env.BASE_URL}>← 種目を選ぶ</a><span>SACHIZU LAB · RJ TEST</span></header>
    <div className="rj-title"><span>RJ · 連続軌跡モデル</span><h1>両足RJ · 自動予測</h1><p>動画または保存済みJSONから、モデルの候補幅と参考値を確認します。身長・基準物・接地や離地の手動指定は不要です。</p></div>
    <section className="rj-capture"><h2>動画を選ぶ</h2>
      <input ref={videoInput} type="file" accept="video/*" aria-label="つま先軌跡RJの動画を選ぶ" disabled={busy} onChange={e => {
        const f = e.target.files?.[0] ?? null; cached.current = null; clear(); setSavedSource(null); setFile(f); setUrl(f ? URL.createObjectURL(f) : '');
        setMessage(f ? '動画を選択しました。解析を開始できます。' : '両足RJの元動画を選んでください。');
      }} />
      <p>固定カメラ・全身と左右のつま先・120/240fpsの元動画。踵が見えることは条件にしません。録画解析です。</p>
      <div className="rj-viewer" hidden={!!savedSource} style={{ maxWidth: Math.min(720, aspect * 520), aspectRatio: aspect, marginInline: 'auto' }}>
        <video ref={video} src={url || undefined} controls={!!file && !busy} playsInline muted hidden={busy} onLoadedMetadata={e => {
          if (e.currentTarget.videoHeight) setAspect(e.currentTarget.videoWidth / e.currentTarget.videoHeight);
        }} />
        <canvas ref={canvas} hidden={!busy} aria-label="RJの解析中の骨格" />
        {!busy && file && poses.length > 0 && <PoseReplay video={video} frames={poses} />}
      </div>
    </section>
    <section aria-label="保存済み骨格から再計算">
      <h2>保存済みJSONから再計算</h2>
      <p>以前保存した rebound-toe-cycle.json を使えます。動画の再解析・骨格の再取得はしません。保存されていたRSI値は使わず、骨格から計算し直します。</p>
      <input type="file" accept="application/json,.json" aria-label="保存済みつま先軌跡JSONを選ぶ" disabled={busy} onChange={e => {
        const selected = e.target.files?.[0]; e.target.value = ''; if (selected) void loadJSON(selected);
      }} />
      {savedSource && <p className="rj-warning" data-testid="toe-cycle-import-source">{savedSource} の保存済み骨格を使用。元動画との同一性や骨格の正確さは、このJSONだけでは検証できません。元動画の再生はありません。</p>}
    </section>
    <button className="rj-button" disabled={(!file && !savedSource) || busy} onClick={() => void start()}>入力なしでRJを解析</button>
    {busy && <button className="rj-button rj-secondary" onClick={() => owner.current?.abort()}>解析を停止</button>}
    <p role="status">{message}</p>
    {report && <ToeCycleResults report={report} pelvisMean={pelvisMean} />}
    {exportData && <button className="rj-button" onClick={save}>予測結果・骨格をJSON保存</button>}
    <footer>動画は端末内で処理。150MB / 30秒 / 3600フレーム以内。ページを閉じると未保存の結果は消えます。</footer>
  </main>;
}
