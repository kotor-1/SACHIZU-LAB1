import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import { analyzeSprint, SPRINT10_ANALYSIS_VERSION, SPRINT10_NOTES, type SprintSample } from './analysis';
import { measureSprint } from './recording';
import type { SprintStart } from './tracker';
import StrideResults from './StrideResults';
import './sprint10.css';

type Gate = 'start' | 'finish';
const GATE_LABEL: Record<Gate, string> = { start: 'スタート', finish: 'ゴール' };
/** Standing 10 m from the start line, or a known section the athlete runs through at speed. */
const MODES: { id: SprintStart; label: string; hint: string }[] = [
  { id: 'standing', label: 'スタート10m', hint: 'スタートラインから10m。選手は走り出す前から映っている。' },
  { id: 'flying', label: '最高速度区間', hint: '例：50〜60m。選手は走った状態で画面に入ってくる。' },
];
const DEFAULT_GATES: Record<SprintStart, [number, number]> = { standing: [.12, .88], flying: [.2, .8] };
/** One ◀/▶ tap moves a line by 0.2% of the frame width. */
const NUDGE = .002;
/** The magnifier shows the frame around the active line at this multiple of the on-screen video. */
const LOUPE_ZOOM = 4;

export default function Sprint10Lab() {
  const video = useRef<HTMLVideoElement>(null), owner = useRef<AbortController | null>(null);
  const loupe = useRef<HTMLCanvasElement>(null), resultCard = useRef<HTMLElement>(null), showResult = useRef(false);
  const [file, setFile] = useState<File | null>(null), [url, setUrl] = useState('');
  const [start, setStart] = useState(.12), [finish, setFinish] = useState(.88);
  const [mode, setMode] = useState<SprintStart>('standing');
  // Flying section: where it begins on the track (label only) and its real length (the scale).
  const [sectionStartM, setSectionStartM] = useState(50), [sectionLengthM, setSectionLengthM] = useState(10);
  const distanceM = mode === 'flying' ? sectionLengthM : 10;
  const sectionLabel = mode === 'flying' ? `${sectionStartM}〜${sectionStartM + sectionLengthM}m区間` : '10m';
  const [active, setActive] = useState<Gate>('start');
  // Where along the line the user is looking (fraction of the frame height): the touch point while dragging.
  const focusY = useRef(.75);
  const [confirmed, setConfirmed] = useState(false);
  const [ready, setReady] = useState(false), [busy, setBusy] = useState(false), [progress, setProgress] = useState(0);
  const [message, setMessage] = useState(''), [samples, setSamples] = useState<SprintSample[] | null>(null);
  const [review, setReview] = useState('');
  const result = useMemo(() => samples && confirmed && distanceM > 0 ? analyzeSprint(samples, start, finish, distanceM) : null, [samples, start, finish, confirmed, distanceM]);
  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);
  useEffect(() => () => { owner.current?.abort(); owner.current = null; }, []);
  // Bring the numbers into view once, when a new analysis finishes.
  useEffect(() => {
    if (result && showResult.current) { showResult.current = false; resultCard.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  }, [result]);
  const drawLoupe = useCallback(() => {
    const v = video.current, c = loupe.current;
    if (!v || !c || !v.videoWidth || !v.videoHeight || !c.clientWidth) return;
    const ratio = window.devicePixelRatio || 1, cw = c.clientWidth, ch = c.clientHeight;
    if (c.width !== Math.round(cw * ratio) || c.height !== Math.round(ch * ratio)) { c.width = Math.round(cw * ratio); c.height = Math.round(ch * ratio); }
    const ctx = c.getContext('2d'); if (!ctx) return;
    const W = v.videoWidth, H = v.videoHeight, shown = v.clientWidth || cw;
    const w = Math.min(W, W * cw / (shown * LOUPE_ZOOM)), h = Math.min(H, w * ch / cw);
    const x = active === 'start' ? start : finish;
    const left = Math.max(0, Math.min(W - w, x * W - w / 2)), top = Math.max(0, Math.min(H - h, focusY.current * H - h / 2));
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.fillStyle = '#0c1816'; ctx.fillRect(0, 0, cw, ch);
    try { ctx.drawImage(v, left, top, w, h, 0, 0, cw, ch); } catch { return; }
    const lineX = (x * W - left) / w * cw;
    ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(lineX - 2, 0, 4, ch);
    ctx.fillStyle = active === 'start' ? '#68ffbf' : '#ffc460'; ctx.fillRect(lineX - 1, 0, 2, ch);
  }, [active, start, finish]);
  useEffect(() => { if (ready) drawLoupe(); }, [ready, drawLoupe]);
  useEffect(() => {
    const v = video.current; if (!v) return;
    const redraw = () => drawLoupe();
    for (const name of ['seeked', 'timeupdate', 'loadeddata']) v.addEventListener(name, redraw);
    window.addEventListener('resize', redraw);
    return () => { for (const name of ['seeked', 'timeupdate', 'loadeddata']) v.removeEventListener(name, redraw); window.removeEventListener('resize', redraw); };
  }, [drawLoupe]);
  function cancel() { owner.current?.abort(); owner.current = null; setBusy(false); setMessage('解析を中止しました。'); }
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
    setActive(which);
    if (which === 'start') setStart(x); else setFinish(x);
    // The gates seed subject selection and its run direction: changing them requires a fresh run.
    setConfirmed(false); setSamples(null); setReview('');
  }
  function drag(which: Gate, event: React.PointerEvent<HTMLButtonElement>) {
    if (busy || !event.currentTarget.hasPointerCapture(event.pointerId)) return;
    const rect = event.currentTarget.parentElement!.getBoundingClientRect(), frame = video.current?.getBoundingClientRect();
    if (frame?.height) focusY.current = Math.max(0, Math.min(1, (event.clientY - frame.top) / frame.height));
    move(which, (event.clientX - rect.left) / rect.width);
  }
  async function analyze() {
    if (!file || !confirmed || busy) return;
    const control = new AbortController(); owner.current = control;
    video.current?.pause(); setBusy(true); setSamples(null); setProgress(0); setReview(''); setMessage('解析を準備しています。');
    try {
      const data = await measureSprint(file, start, control.signal, (value, text) => {
        if (owner.current === control) { setProgress(value); setMessage(text); }
      }, finish, mode);
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
    <section className="sprint10-card"><h2>1　動画を選ぶ</h2>
      <label className="sprint10-upload"><input className="sprint10-file-input" type="file" aria-label={`${sectionLabel}の動画を選ぶ`} accept="video/mp4,video/quicktime,.mov,.mp4,.m4v" disabled={busy} onChange={e => changeFile(e.target.files?.[0] ?? null)} />
        <span className="sprint10-upload-button" aria-hidden="true"><Upload size={19} />{file ? '別の動画を選ぶ' : '動画を選ぶ'}</span></label>
      {file && <p className="sprint10-file">{file.name} · {(file.size / 1024 / 1024).toFixed(1)} MB</p>}
    </section>
    <section className="sprint10-card"><h2>2　スタートとゴールを合わせる</h2>
      <p>再生して、骨盤がスタートを越える前からゴールを越えた後まで映っていることを確認します。次に、2本の線を走路上の白線・コーンに合わせてください。目印は選手が走るコース上（同じ奥行き）に置きます。画面の端ほど奥行きの差でタイムがずれます。{mode === 'flying'
        ? '選手が入ってくる側の線は、画面の端から2割以上内側に置いてください。線より手前で走っている選手を捉えてから区間を測ります。線の手前に人が立っていると選手を見失うことがあります。'
        : 'スタートの線は、選手の立ち位置より少し後ろに置いてください。'}</p>
      {ready && <figure className="sprint10-loupe"><canvas ref={loupe} aria-label={`${GATE_LABEL[active]}ライン付近の拡大表示`} />
        <figcaption className={active}>{GATE_LABEL[active]}の拡大（{LOUPE_ZOOM}倍）</figcaption></figure>}
      <div className="sprint10-player">
        <video ref={video} src={url || undefined} controls playsInline preload="auto" onLoadedData={() => setReady(true)} onError={() => { setReady(false); setMessage('この動画を再生できません。対応形式を確認してください。'); }} />
        {ready && <div className="sprint10-gates">{(['start', 'finish'] as const).map(which => <button key={which} type="button" role="slider"
          aria-label={`${GATE_LABEL[which]}ライン`} aria-valuemin={1} aria-valuemax={99} aria-valuenow={Math.round(position(which) * 100)}
          className={`sprint10-gate ${which}`} style={{ left: `${position(which) * 100}%` }} disabled={busy}
          onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); setActive(which); drag(which, e); }} onPointerMove={e => drag(which, e)}
          onPointerUp={e => { if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId); }}
          onKeyDown={e => { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); move(which, position(which) + (e.key === 'ArrowLeft' ? -NUDGE : NUDGE)); } }}>
          <span>{which === 'start' ? 'START' : 'FINISH'}</span></button>)}</div>}
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
    <section className="sprint10-card"><h2>3　解析する</h2><button className="sprint10-primary" disabled={!ready || !confirmed || busy} onClick={() => void analyze()}>解析する</button>
      {busy && <button onClick={cancel}>中止</button>}
      <p role="status">{message || '動画を選び、2本のラインを決定すると解析できます。'}</p>
      {busy && <progress max="1" value={progress} aria-label="解析の進み具合" />}
    </section>
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
          {result.start && <button onClick={() => seek(result.start!.pts, 'スタート')}>スタート {result.start.pts.toFixed(3)}秒</button>}
          {result.steps.map((s, i) => <button key={s.frame} onClick={() => seek(s.pts, `${i + 1}回目の入れ替わり`)}>
            {i + 1}回目の入れ替わり · {s.pts.toFixed(3)}秒</button>)}
          {result.finish && <button onClick={() => seek(result.finish!.pts, 'ゴール')}>ゴール {result.finish.pts.toFixed(3)}秒</button>}
        </div><p>ボタンでその時刻へ移動します。遊脚が支持脚を追い越す瞬間で、接地のコマではありません。</p></details>
      <button onClick={save}>結果と判定データを保存（JSON）</button>
    </section>}
    <footer>解析v8 · 動画はこの端末内で処理します。全フレームの解析時間は端末性能により変わります。2本のラインだけで遠近やカメラの揺れを補正することはできません。</footer>
  </main>;
}
