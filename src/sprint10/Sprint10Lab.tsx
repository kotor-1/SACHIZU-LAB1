import { useEffect, useMemo, useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import { analyzeSprint, SPRINT10_ANALYSIS_VERSION, SPRINT10_NOTES, type SprintSample } from './analysis';
import { measureSprint } from './recording';
import { measureSprintLive, type LiveSprintRun, type LiveSprintStatus } from './live';
import { cameraConstraints } from '../cmj/camera-geometry';
import type { SprintStart } from './tracker';
import StrideResults from './StrideResults';
import './sprint10.css';

type Gate = 'start' | 'finish';
/** A flying section is entered and left at speed: its gates are the entry and the exit. */
const GATE_LABELS: Record<SprintStart, Record<Gate, string>> = {
  standing: { start: 'スタート', finish: 'ゴール' }, flying: { start: '入口', finish: '出口' },
};
/** Standing 10 m from the start line, or a known section the athlete runs through at speed. */
const MODES: { id: SprintStart; label: string; hint: string }[] = [
  { id: 'standing', label: 'スタート10m', hint: 'スタートラインから10m。選手は走り出す前から映っている。' },
  { id: 'flying', label: '最高速度区間', hint: '例：50〜60m。選手は走った状態で画面に入ってくる。' },
];
const DEFAULT_GATES: Record<SprintStart, [number, number]> = { standing: [.12, .88], flying: [.2, .8] };
/** One ◀/▶ tap moves a line by 0.2% of the frame width. */
const NUDGE = .002;

export default function Sprint10Lab() {
  const video = useRef<HTMLVideoElement>(null), owner = useRef<AbortController | null>(null);
  const resultCard = useRef<HTMLElement>(null), showResult = useRef(false);
  const [file, setFile] = useState<File | null>(null), [url, setUrl] = useState('');
  const [start, setStart] = useState(.12), [finish, setFinish] = useState(.88);
  const [mode, setMode] = useState<SprintStart>('standing');
  // Flying section: where it begins on the track (label only) and its real length (the scale).
  const [sectionStartM, setSectionStartM] = useState(50), [sectionLengthM, setSectionLengthM] = useState(10);
  const distanceM = mode === 'flying' ? sectionLengthM : 10;
  const sectionLabel = mode === 'flying' ? `${sectionStartM}〜${sectionStartM + sectionLengthM}m区間` : '10m';
  const GATE_LABEL = GATE_LABELS[mode];
  const [confirmed, setConfirmed] = useState(false);
  const [ready, setReady] = useState(false), [busy, setBusy] = useState(false), [progress, setProgress] = useState(0);
  const [message, setMessage] = useState(''), [samples, setSamples] = useState<SprintSample[] | null>(null);
  const [review, setReview] = useState('');
  // Live camera: the stream stays on while runs are measured one after another.
  const [source, setSource] = useState<'file' | 'camera'>('file');
  const stream = useRef<MediaStream | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [runs, setRuns] = useState<LiveSprintRun[]>([]), [liveStatus, setLiveStatus] = useState<LiveSprintStatus | null>(null);
  const result = useMemo(() => samples && confirmed && distanceM > 0 ? analyzeSprint(samples, start, finish, distanceM, mode) : null, [samples, start, finish, confirmed, distanceM, mode]);
  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);
  useEffect(() => () => { owner.current?.abort(); owner.current = null; stopCamera(); }, []);
  // Bring the numbers into view once, when a new analysis finishes.
  useEffect(() => {
    if (result && showResult.current) { showResult.current = false; resultCard.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  }, [result]);
  function cancel() {
    owner.current?.abort(); owner.current = null; setBusy(false); setLiveStatus(null);
    setMessage(source === 'camera' ? '計測を止めました。' : '解析を中止しました。');
  }
  function stopCamera() {
    stream.current?.getTracks().forEach(track => track.stop()); stream.current = null;
    if (video.current) video.current.srcObject = null;
    setCameraOn(false);
  }
  function chooseSource(next: 'file' | 'camera') {
    if (busy || next === source) return;
    if (next === 'file') stopCamera(); else changeFile(null);
    setSource(next); setReady(false); setConfirmed(false); setSamples(null); setRuns([]); setLiveStatus(null); setMessage('');
  }
  async function startCamera() {
    if (!video.current || cameraOn) return;
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('カメラを利用できません。HTTPS接続を確認してください。');
      const media = await navigator.mediaDevices.getUserMedia(cameraConstraints(navigator.mediaDevices.getSupportedConstraints()));
      stream.current = media; video.current.srcObject = media; await video.current.play(); setCameraOn(true); setMessage('');
    } catch (error) { stopCamera(); setMessage(error instanceof Error ? error.message : 'カメラを起動できませんでした。'); }
  }
  async function startLive() {
    if (!video.current || !cameraOn || !confirmed || busy) return;
    const control = new AbortController(); owner.current = control;
    setBusy(true); setMessage('準備しています。');
    try {
      await measureSprintLive(video.current, { startX: start, finishX: finish, start: mode, distanceM }, control.signal,
        run => setRuns(previous => [...previous, run]), status => { if (owner.current === control) setLiveStatus(status); });
    } catch (error) {
      if (owner.current === control && !control.signal.aborted) setMessage(error instanceof Error ? error.message : String(error));
    } finally { if (owner.current === control) { owner.current = null; setBusy(false); setLiveStatus(null); } }
  }
  function changeFile(next: File | null) {
    cancel(); setFile(next); setUrl(next ? URL.createObjectURL(next) : ''); setReady(false);
    setSamples(null); setConfirmed(false); setMessage(''); setProgress(0); setReview('');
  }
  function changeMode(next: SprintStart) {
    if (busy || next === mode) return;
    setMode(next); setStart(DEFAULT_GATES[next][0]); setFinish(DEFAULT_GATES[next][1]);
    // Subject acquisition differs between modes: a fresh run is required.
    setConfirmed(false); setSamples(null); setReview('');
  }
  function move(which: Gate, value: number) {
    if (busy) return;
    const x = Math.max(.01, Math.min(.99, value));
    if (which === 'start') setStart(x); else setFinish(x);
    // The gates seed subject selection and its run direction: changing them requires a fresh run.
    setConfirmed(false); setSamples(null); setReview('');
  }
  function drag(which: Gate, event: React.PointerEvent<HTMLButtonElement>) {
    if (busy || !event.currentTarget.hasPointerCapture(event.pointerId)) return;
    const rect = event.currentTarget.parentElement!.getBoundingClientRect();
    move(which, (event.clientX - rect.left) / rect.width);
  }
  async function analyze() {
    if (!file || !confirmed || busy) return;
    const control = new AbortController(); owner.current = control;
    video.current?.pause(); setBusy(true); setSamples(null); setProgress(0); setReview(''); setMessage('解析を準備しています。');
    try {
      const data = await measureSprint(file, start, control.signal, (value, text) => {
        if (owner.current === control) { setProgress(value); setMessage(text); }
      }, finish, mode, distanceM);
      if (owner.current === control && !control.signal.aborted) { showResult.current = true; setSamples(data); }
    } catch (error) {
      if (owner.current === control && !control.signal.aborted) setMessage(error instanceof Error ? error.message : String(error));
    } finally { if (owner.current === control) { owner.current = null; setBusy(false); } }
  }
  function seek(pts: number, label: string) {
    if (video.current) {
      video.current.pause(); video.current.currentTime = pts; setReview(`${label} · ${pts.toFixed(3)}秒`);
      video.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }
  function save() {
    const blob = new Blob([JSON.stringify({ version: SPRINT10_ANALYSIS_VERSION, file: file?.name, distanceM,
      mode, section: mode === 'flying' ? { startM: sectionStartM, lengthM: sectionLengthM } : null,
      gates: { start, finish }, timeBasis: 'SOURCE_PRESENTATION_TIME', crossingBasis: 'PELVIS_MIDPOINT',
      stepBasis: 'LEG_OVERLAP_CYCLES_BETWEEN_GATES_WITH_FRACTIONAL_EDGES', strideBasis: 'PELVIS_DISPLACEMENT_BETWEEN_OVERLAPS',
      calibration: 'TWO_GATE_LINEAR_SCALE_NOT_PERSPECTIVE_CORRECTED', result, samples }, null, 2)], { type: 'application/json' });
    const link = document.createElement('a'), objectURL = URL.createObjectURL(blob); link.href = objectURL;
    link.download = mode === 'flying' ? `sprint-section-${sectionStartM}-${sectionStartM + sectionLengthM}m-result.json` : 'sprint10-result.json';
    link.click(); setTimeout(() => URL.revokeObjectURL(objectURL), 1000);
  }
  const display = (value: number | null | undefined, digits = 2) => value == null ? '—' : value.toFixed(digits);
  const position = (which: Gate) => which === 'start' ? start : finish;
  const specific = result ? result.warnings.filter(w => !SPRINT10_NOTES.includes(w)) : [];
  return <main className="sprint10">
    <a className="sprint10-back" href={import.meta.env.BASE_URL}>← 種目を選ぶ</a>
    <header><p className="sprint10-eyebrow">SPRINT / {mode === 'flying' ? 'MAX VELOCITY SECTION' : '10 METRES'}</p><h1>{mode === 'flying' ? '最高速度区間の解析' : '10m スプリント解析'}</h1>
      <p>2本のラインを設定するだけで、通過時間・歩数・ピッチ・歩幅を解析します。</p></header>
    <div className="sprint10-modes" role="group" aria-label="解析の種類">{MODES.map(m => <button key={m.id} type="button" aria-pressed={mode === m.id} disabled={busy}
      className={mode === m.id ? 'is-selected' : ''} onClick={() => changeMode(m.id)}><strong>{m.label}</strong><span>{m.hint}</span></button>)}</div>
    {mode === 'flying' && <div className="sprint10-section"><label>区間の入口<input type="number" inputMode="numeric" min={0} max={400} step={5} value={sectionStartM} disabled={busy}
        onChange={e => setSectionStartM(Math.max(0, Math.min(400, Math.round(Number(e.target.value) || 0))))} /><span>m地点</span></label>
      <label>区間の長さ<input type="number" inputMode="decimal" min={1} max={100} step={1} value={sectionLengthM} disabled={busy}
        onChange={e => { setSectionLengthM(Math.max(0, Math.min(100, Number(e.target.value) || 0))); setConfirmed(false); setReview(''); }} /><span>m</span></label>
      <p>{sectionLabel}として記録します。長さは2本のラインの実際の間隔です。</p></div>}
    <p className="sprint10-note">試験機能・精度未検証。固定カメラで真横に近い方向から、1人の全身と{mode === 'flying' ? '区間全体' : '10m区間'}を撮影してください。通常速度の時間軸の動画を使用します。スロー書き出し動画の速度倍率は自動補正しません。</p>
    <section className="sprint10-card"><h2>{source === 'camera' ? '1　カメラを用意する' : '1　動画を選ぶ'}</h2>
      <div className="sprint10-sources" role="group" aria-label="映像の入力">{([['file', '録画した動画'], ['camera', 'カメラでリアルタイム計測']] as const).map(([id, label]) =>
        <button key={id} type="button" aria-pressed={source === id} className={source === id ? 'is-selected' : ''} disabled={busy} onClick={() => chooseSource(id)}>{label}</button>)}</div>
      {source === 'camera' ? <>
        <p className="sprint10-hint">スマホを三脚などで固定し、走路を真横から写します。リアルタイムでは通過時間と平均速度だけを測ります。歩数・歩幅は、録画した動画の解析で測ります。選手は1人ずつ走らせてください。ほかの人と重なると測れないことがあります。</p>
        <button className="sprint10-primary" disabled={busy || cameraOn} onClick={() => void startCamera()}>{cameraOn ? '✓ カメラ起動中' : 'カメラを起動'}</button>
      </> : <><label className="sprint10-upload"><input className="sprint10-file-input" type="file" aria-label={`${sectionLabel}の動画を選ぶ`} accept="video/mp4,video/quicktime,.mov,.mp4,.m4v" disabled={busy} onChange={e => changeFile(e.target.files?.[0] ?? null)} />
        <span className="sprint10-upload-button" aria-hidden="true"><Upload size={19} />{file ? '別の動画を選ぶ' : '動画を選ぶ'}</span></label>
      {file && <p className="sprint10-file">{file.name} · {(file.size / 1024 / 1024).toFixed(1)} MB</p>}</>}
    </section>
    <section className="sprint10-card"><h2>{`2　${GATE_LABEL.start}と${GATE_LABEL.finish}を合わせる`}</h2>
      <p>{source === 'camera'
        ? 'カメラの映像に、選手が走るコースと2本の目印が写っていることを確認します。'
        : mode === 'flying'
        ? '再生して、選手が入口と出口の線を越えて走る様子が映っていることを確認します。最初は選手が画面に入っていなくて構いません。'
        : '再生して、骨盤がスタートを越える前からゴールを越えた後まで映っていることを確認します。'}次に、2本の線を走路上の白線・コーンに合わせてください。目印は選手が走るコース上（同じ奥行き）に置きます。画面の端ほど奥行きの差でタイムがずれます。{mode === 'flying'
        ? '線は画面の端の近くでも構いません。線を越える瞬間に体が画面の端にかかっている場合は、その前後の動きから通過時刻を推定し、結果にその旨を表示します。'
        : 'スタートの線は、選手の立ち位置より少し後ろに置いてください。'}</p>
      <div className="sprint10-player">
        <video ref={video} src={source === 'file' ? url || undefined : undefined} controls={source === 'file'} muted={source === 'camera'} playsInline preload="auto"
          onLoadedData={() => setReady(true)} onError={() => { if (source === 'file') { setReady(false); setMessage('この動画を再生できません。対応形式を確認してください。'); } }} />
        {ready && <div className="sprint10-gates">{(['start', 'finish'] as const).map(which => <button key={which} type="button" role="slider"
          aria-label={`${GATE_LABEL[which]}ライン`} aria-valuemin={1} aria-valuemax={99} aria-valuenow={Math.round(position(which) * 100)}
          // Near a frame edge the label sits beside the line, inside the picture.
          className={`sprint10-gate ${which}${position(which) < .1 ? ' at-left' : position(which) > .9 ? ' at-right' : ''}`} style={{ left: `${position(which) * 100}%` }} disabled={busy}
          onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); drag(which, e); }} onPointerMove={e => drag(which, e)}
          onPointerUp={e => { if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId); }}
          onKeyDown={e => { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); move(which, position(which) + (e.key === 'ArrowLeft' ? -NUDGE : NUDGE)); } }}>
          <span>{mode === 'flying' ? GATE_LABEL[which] : which === 'start' ? 'START' : 'FINISH'}</span></button>)}</div>}
      </div>
      {review && <p aria-live="polite">確認中：{review}</p>}
      <p className="sprint10-hint">線をドラッグして大まかに合わせ、◀ ▶ で少しずつ動かします。</p>
      <div className="sprint10-gate-controls">{(['start', 'finish'] as const).map(which => <div key={which} className={`sprint10-gate-row ${which}`}>
        <span>{GATE_LABEL[which]}</span>
        <button type="button" aria-label={`${GATE_LABEL[which]}を左へ`} disabled={!ready || busy} onClick={() => move(which, position(which) - NUDGE)}>◀</button>
        <input type="range" aria-label={`${GATE_LABEL[which]}位置`} min="1" max="99" step=".1" value={position(which) * 100} disabled={!ready || busy}
          onChange={e => move(which, Number(e.target.value) / 100)} />
        <button type="button" aria-label={`${GATE_LABEL[which]}を右へ`} disabled={!ready || busy} onClick={() => move(which, position(which) + NUDGE)}>▶</button>
      </div>)}</div>
      <button className="sprint10-confirm" disabled={!ready || busy || Math.abs(start - finish) < .1 || distanceM <= 0} onClick={() => setConfirmed(true)}>{confirmed ? '✓ ライン設定済み' : 'この2本のラインで決定'}</button>
    </section>
    {source === 'camera' ? <section className="sprint10-card"><h2>3　計測する</h2>
      {busy ? <button className="sprint10-primary" onClick={cancel}>計測を止める</button>
        : <button className="sprint10-primary" disabled={!ready || !cameraOn || !confirmed} onClick={() => void startLive()}>計測を開始</button>}
      <p role="status">{liveStatus ? `${liveStatus.message}${liveStatus.fps ? `（処理 ${liveStatus.fps.toFixed(0)}コマ/秒）` : ''}`
        : message || 'カメラを起動し、2本のラインを決定すると計測できます。選手が走るたびに自動で測ります。'}</p>
      {liveStatus?.fps != null && liveStatus.fps < 20 && <p className="sprint10-note">処理が映像に追いついていません。タイムの誤差が大きくなります。</p>}
      {runs.length > 0 && <ol className="sprint10-runs" aria-label="計測結果">{[...runs].reverse().map(run => <li key={run.id}>
        <span>{run.id}本目</span>
        {run.duration !== null && run.speed !== null
          ? <><strong>{run.duration.toFixed(3)}<small>秒</small></strong><span>{run.speed.toFixed(2)} m/s</span></>
          : <><strong className="sprint10-run-failed">計測できませんでした</strong><span /></>}
        {[...(run.failure ? [run.failure] : []), ...run.notes].map(note => <small key={note} className="sprint10-run-note">{note}</small>)}</li>)}</ol>}
    </section> : <section className="sprint10-card"><h2>3　解析する</h2><button className="sprint10-primary" disabled={!ready || !confirmed || busy} onClick={() => void analyze()}>解析する</button>
      {busy && <button onClick={cancel}>中止</button>}
      <p role="status">{message || '動画を選び、2本のラインを決定すると解析できます。'}</p>
      {busy && <progress max="1" value={progress} aria-label="解析の進み具合" />}
    </section>}
    {result && <section ref={resultCard} className="sprint10-card sprint10-result" aria-label="解析結果"><h2>解析結果</h2>
      {result.reason && <p role="alert" className="sprint10-note">{result.reason}</p>}
      <div className="sprint10-metrics">{[[`${sectionLabel}通過時間`, display(result.duration, 3), '秒'], ['平均速度', display(result.speed), 'm/s'],
        ['推定歩数', display(result.count, 1), '歩'], ['推定ピッチ', display(result.cadence), '歩/秒'], ['平均歩幅', display(result.stride), 'm']].map(([label, value, unit]) => <div key={label}><span>{label}</span><strong>{value}</strong><small>{unit}</small></div>)}</div>
      {specific.map(w => <p className="sprint10-note" key={w}>{w}</p>)}
      <details className="sprint10-more"><summary>数値の見方</summary>
        <p>タイムは骨盤中心のライン通過間隔です。合図からのスタートタイム・全身の重心の測定ではありません。</p>
        {SPRINT10_NOTES.map(w => <p key={w}>{w}</p>)}</details>
      <details className="sprint10-more"><summary>1歩ごとの詳細を見る</summary><StrideResults intervals={result.strideIntervals} seek={seek} /></details>
      <details className="sprint10-more"><summary>検出位置を動画で確認</summary>
        <div className="sprint10-events">
          {result.start && <button onClick={() => seek(result.start!.pts, GATE_LABEL.start)}>{GATE_LABEL.start} {result.start.pts.toFixed(3)}秒</button>}
          {result.steps.map((s, i) => <button key={s.frame} onClick={() => seek(s.pts, `${i + 1}回目の入れ替わり`)}>
            {i + 1}回目の入れ替わり · {s.pts.toFixed(3)}秒</button>)}
          {result.finish && <button onClick={() => seek(result.finish!.pts, GATE_LABEL.finish)}>{GATE_LABEL.finish} {result.finish.pts.toFixed(3)}秒</button>}
        </div><p>ボタンでその時刻へ移動します。遊脚が支持脚を追い越す瞬間で、接地のコマではありません。</p></details>
      <button onClick={save}>結果と判定データを保存（JSON）</button>
    </section>}
    <footer>解析v10 · 動画はこの端末内で処理します。全フレームの解析時間は端末性能により変わります。2本のラインだけで遠近やカメラの揺れを補正することはできません。</footer>
  </main>;
}
