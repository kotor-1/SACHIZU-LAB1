import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowUpRight, Activity, Camera, Upload, Play, Square, Download, RotateCcw, Check, ChevronDown, LoaderCircle } from 'lucide-react';
import { measureVideo, type SessionUpdate } from './video-session';
import { comFeedback } from './com-feedback';
import { waitForCurrentFrame } from './media-ready';
import { untilAborted } from './session-lifecycle';
import './mobile-ui.css';

const phases = { PREPARING: '姿勢を確認しています', READY: '準備OK。ジャンプしてください', MOVING: '重心の動きを追跡中', RECOVERING: 'ジャンプの軌道を確認中' };
const skeleton = [[11, 12], [11, 13], [13, 15], [12, 14], [14, 16], [11, 23], [12, 24],
  [23, 24], [23, 25], [25, 27], [24, 26], [26, 28], [27, 31], [28, 32]];

export default function CMJMobile() {
  const video = useRef<HTMLVideoElement>(null), canvas = useRef<HTMLCanvasElement>(null), input = useRef<HTMLInputElement>(null);
  const owner = useRef<AbortController | null>(null), camera = useRef<MediaStream | null>(null), url = useRef<string | null>(null);
  const [mode, setMode] = useState<'file' | 'camera'>('file'), [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false), [cancelling, setCancelling] = useState(false);
  const [message, setMessage] = useState(''), [problem, setProblem] = useState(false);
  const [state, setState] = useState<SessionUpdate | null>(null);
  const [exact, setExact] = useState(false), [review, setReview] = useState(false);
  const [dimensions, setDimensions] = useState({ w: 720, h: 1280 });
  const [activeResult, setActiveResult] = useState<number | null>(null);
  const [failureReason, setFailureReason] = useState<string | null>(null);

  function cancel() {
    owner.current?.abort(); camera.current?.getTracks().forEach(t => t.stop()); camera.current = null;
    video.current?.pause();
    if (owner.current) { setCancelling(true); setMessage('解析を停止しています…'); }
  }
  useEffect(() => {
    const hidden = () => { if (document.hidden && owner.current) cancel(); };
    document.addEventListener('visibilitychange', hidden);
    return () => {
      document.removeEventListener('visibilitychange', hidden); owner.current?.abort(); owner.current = null;
      camera.current?.getTracks().forEach(t => t.stop()); if (url.current) URL.revokeObjectURL(url.current);
    };
  }, []);
  function selectMode(next: 'file' | 'camera') {
    if (busy) return;
    setMode(next); setState(null); setMessage(''); setProblem(false); setReview(false); setActiveResult(null);
    if (!video.current) return;
    video.current.pause(); video.current.srcObject = null;
    if (next === 'file' && url.current) video.current.src = url.current;
    else video.current.removeAttribute('src');
    video.current.load();
  }
  function fileSelected(next?: File) {
    if (!next || busy || !video.current) return;
    if (url.current) URL.revokeObjectURL(url.current);
    setFile(next); setMode('file'); setState(null); setMessage(''); setProblem(false); setReview(false); setActiveResult(null);
    url.current = URL.createObjectURL(next); video.current.srcObject = null; video.current.src = url.current; video.current.load();
  }
  async function start() {
    if (!video.current || busy || (mode === 'file' && !file)) return;
    const element = video.current, control = new AbortController(); owner.current = control;
    setBusy(true); setCancelling(false); setProblem(false); setReview(false); setState(null); setActiveResult(null);
    setExact(false); setFailureReason(null);
    if (canvas.current) canvas.current.getContext('2d')?.clearRect(0, 0, canvas.current.width, canvas.current.height);
    setMessage('計測の準備をしています…');
    const status = (value: string) => { if (owner.current === control && !control.signal.aborted) setMessage(value); };
    const update = (next: SessionUpdate) => {
      if (owner.current !== control || control.signal.aborted) return;
      setState(next); setMessage('');
      const w = next.acquisition === 'EXACT_FRAMES' ? canvas.current!.width : element.videoWidth;
      const h = next.acquisition === 'EXACT_FRAMES' ? canvas.current!.height : element.videoHeight;
      if (w && h) setDimensions(old => old.w === w && old.h === h ? old : { w, h });
    };
    try {
      let summary;
      if (mode === 'file' && file) {
        element.pause();
        const recording = await import('./recording-session');
        if (control.signal.aborted) throw new DOMException('中止', 'AbortError');
        const useExact = recording.supportsExactRecording(file); setExact(useExact);
        if (useExact) summary = await recording.measureRecording(file, canvas.current!, control.signal, update, status);
        else {
          if (element.currentTime !== 0) element.currentTime = 0;
          await waitForCurrentFrame(element, control.signal);
          summary = await measureVideo(element, 'file', control.signal, update, status);
        }
      } else {
        setExact(false);
        if (!navigator.mediaDevices?.getUserMedia) throw new Error('カメラを利用できません。HTTPS接続を確認するか、録画を読み込んでください。');
        const media = await untilAborted(navigator.mediaDevices.getUserMedia({ audio: false, video: {
          facingMode: { ideal: 'environment' }, width: { ideal: 720 }, height: { ideal: 1280 }, frameRate: { ideal: 60 },
        } }).then(media => {
          if (control.signal.aborted) media.getTracks().forEach(t => t.stop());
          return media;
        }), control.signal);
        if (control.signal.aborted) { media.getTracks().forEach(t => t.stop()); throw new DOMException('中止', 'AbortError'); }
        camera.current = media; element.removeAttribute('src'); element.srcObject = media;
        await element.play(); await waitForCurrentFrame(element, control.signal);
        summary = await measureVideo(element, 'camera', control.signal, update, status);
      }
      if (owner.current !== control || control.signal.aborted) return;
      setProblem(summary.estimateCount === 0);
      setFailureReason(summary.estimateCount ? null : summary.reason);
      setMessage(summary.estimateCount ? `${summary.estimateCount}回の解析が完了しました。` : comFeedback(summary.reason));
    } catch (e) {
      if (owner.current !== control) return;
      if (control.signal.aborted) setMessage('計測を停止しました。');
      else { setProblem(true); setMessage(e instanceof Error ? e.message : String(e)); setFailureReason(e instanceof Error ? e.message : String(e)); }
    } finally {
      if (owner.current === control) {
        owner.current = null; setBusy(false); setCancelling(false);
        camera.current?.getTracks().forEach(t => t.stop()); camera.current = null; element.pause(); element.playbackRate = 1;
      }
    }
  }
  function download() {
    const blob = new Blob([JSON.stringify({ file: mode === 'file' ? file?.name : 'camera', acquisition: state?.acquisition,
      poseModel: state?.poseModel, processingMs: state?.processingMs, decodeDiagnostics: state?.decodeDiagnostics,
      diagnostics: { reason: failureReason, message, quality: state?.quality, processedFrames: state?.processedFrames,
        browser: navigator.userAgent, videoDecoder: typeof VideoDecoder !== 'undefined', secureContext: window.isSecureContext },
      exportedAt: new Date().toISOString(), results: state?.results ?? [] }, null, 2)], { type: 'application/json' });
    const objectURL = URL.createObjectURL(blob), link = document.createElement('a');
    link.href = objectURL; link.download = 'jump-analysis.json'; link.click();
    setTimeout(() => URL.revokeObjectURL(objectURL), 1000);
  }
  const latest = activeResult === null ? state?.results.at(-1) : state?.results.find(r => r.id === activeResult);
  const height = latest?.analysis.heightCm, successful = state?.results.filter(r => r.analysis.heightCm !== null) ?? [];
  const progress = state?.totalFrames ? Math.min(100, Math.round(state.processedFrames / state.totalFrames * 100)) : null;
  const hasSource = mode === 'file' ? !!file : busy || !!state;
  const statusText = message || (state && busy ? state.observationReason ? comFeedback(state.observationReason)
    : mode === 'file' && state.phase === 'READY' ? '準備姿勢を確認しました。続けて動きを解析します。' : phases[state.phase]
    : mode === 'camera' ? 'カメラを起動して、全身をフレームに入れてください。' : file ? '準備ができました。動画を解析してください。' : '撮影したジャンプ動画を読み込んでください。');
  const showHeight = height != null && !review && (!busy || state?.phase === 'PREPARING' || state?.phase === 'READY');
  const showCanvas = mode === 'file' && exact && !review && (busy || state?.acquisition === 'EXACT_FRAMES');
  return <main className="cmj-mobile">
    <header className="cmj-header"><a href={`${import.meta.env.BASE_URL}?dev=1`} aria-label="アプリに戻る"><ArrowLeft size={20} /></a>
      <span className="cmj-brand">SACHIZU <span>LAB</span></span><span className="cmj-beta">BETA</span></header>
    <div className="cmj-heading"><p className="cmj-eyebrow">JUMP ANALYSIS</p><h1>そのジャンプを、<br className="cmj-mobile-break" />数値に。</h1><p>全身の動きから、ジャンプの高さを推定。</p></div>
    <div className="cmj-workspace"><section className="cmj-capture" aria-label="ジャンプ映像">
      <div className="cmj-mode" aria-label="入力方法">
        <button className={mode === 'file' ? 'is-selected' : ''} aria-pressed={mode === 'file'} disabled={busy} onClick={() => selectMode('file')}><Upload size={17} />録画を解析</button>
        <button className={mode === 'camera' ? 'is-selected' : ''} aria-pressed={mode === 'camera'} disabled={busy} onClick={() => selectMode('camera')}><Camera size={17} />カメラで計測</button>
      </div>
      {mode === 'camera' && <p className="cmj-inline-note">リアルタイム解析：カメラ起動後、骨格・推定重心を表示します。Readyを確認してジャンプしてください。処理が追いつかない端末では録画解析をお使いください。</p>}
      <div className={`cmj-viewer ${hasSource ? 'has-source' : ''}`}>
        <video ref={video} playsInline muted preload="metadata" controls={review && !busy} hidden={showCanvas}
          onLoadedMetadata={() => { const v = video.current!; if (v.videoWidth) setDimensions({ w: v.videoWidth, h: v.videoHeight }); }} />
        <canvas ref={canvas} hidden={!showCanvas} aria-label="解析した元動画フレーム" />
        {!hasSource && <div className="cmj-empty"><div className="cmj-frame-guide"><svg viewBox="0 0 140 240" aria-hidden="true">
          <circle cx="70" cy="35" r="17" /><path d="M46 68 Q70 58 94 68 L107 120 L88 135 M46 68 L33 120 L52 135 M49 76 L51 143 L89 143 L91 76 M53 146 L50 191 L44 221 M87 146 L90 191 L96 221 M34 223 L51 223 M89 223 L106 223" /></svg></div>
          <span>全身が映る位置で、正面から。</span><small>スマホは固定してください</small></div>}
        {busy && state?.landmarks.length === 33 && <svg className="cmj-skeleton" viewBox={`0 0 ${dimensions.w} ${dimensions.h}`} aria-label="全身と重心の追跡" preserveAspectRatio="xMidYMid meet">
          {skeleton.map(([a, b]) => <line key={`${a}-${b}`} x1={state.landmarks[a].x * dimensions.w} y1={state.landmarks[a].y * dimensions.h}
            x2={state.landmarks[b].x * dimensions.w} y2={state.landmarks[b].y * dimensions.h} strokeWidth={dimensions.w / 220} />)}
          {state.com && <circle cx={state.com.x * dimensions.w} cy={state.com.y * dimensions.h} r={dimensions.w / 70} />}</svg>}
        <div className="cmj-viewer-top"><span><i className={busy ? 'is-live' : ''} />{busy ? mode === 'file' ? 'ANALYZING' : 'LIVE' : 'CMJ / 両脚ジャンプ'}</span>{busy && state && <span>{state.sourcePts.toFixed(2)} s</span>}</div>
        {showHeight && <div className="cmj-score-overlay"><span>JUMP HEIGHT</span><strong>{height.toFixed(1)}<small>cm</small></strong><em>重心速度からの推定値</em></div>}
        {busy && !showHeight && <div className="cmj-stage-caption">{cancelling ? '停止中…' : state?.phase === 'READY' ? 'Ready' : 'Tracking'}<span>{mode === 'file' ? progress === null ? '動画を確認しています' : `${progress}% 解析済み` : 'ジャンプの間は静止してください'}</span></div>}
      </div>
      {busy && mode === 'file' && <div className="cmj-progress"><div role="progressbar" aria-label="動画の解析" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress ?? undefined} style={{ width: `${progress ?? 3}%` }} /></div>}
      <div className={`cmj-status ${problem ? 'has-problem' : ''}`} role="status">{busy ? <LoaderCircle size={18} className="cmj-spin" /> : successful.length ? <Check size={18} /> : <Activity size={18} />}<span>{statusText}</span></div>
      <input className="cmj-file-input" ref={input} type="file" accept="video/*" disabled={busy} aria-label="録画動画を選ぶ" onChange={e => fileSelected(e.target.files?.[0])} />
      {mode === 'file' && file && <div className="cmj-file"><span>{file.name}</span><button disabled={busy} onClick={() => input.current?.click()}>変更</button></div>}
      <div className="cmj-primary-actions">{busy ? <button className="cmj-stop" disabled={cancelling} onClick={cancel}><Square size={17} />{cancelling ? '停止中' : '計測を停止'}</button>
        : mode === 'file' && !file ? <button className="cmj-primary" onClick={() => input.current?.click()}><Upload size={19} />動画を読み込む<ArrowUpRight size={18} /></button>
        : <button className="cmj-primary" onClick={() => void start()}>{state ? <RotateCcw size={18} /> : <Play size={18} />}{mode === 'file' ? state ? 'もう一度解析する' : '動画を解析する' : 'カメラを起動する'}</button>}
        {!busy && file && mode === 'file' && <button className="cmj-secondary" aria-pressed={review} onClick={() => { setReview(!review); video.current?.pause(); }}>動画を確認</button>}
      </div>
      {state?.slowDevice && <p className="cmj-inline-note">撮影中の解析が追いついていません。標準カメラで録画し、「録画を解析」から読み込んでください。</p>}
      {state?.acquisition === 'PLAYBACK' && <p className="cmj-inline-note">この動画は互換モードで解析しています。映像の間隔が不足する場合は数値を確定しません。</p>}
      {state?.acquisition === 'EXACT_FRAMES' && <p className="cmj-inline-note">再生速度とは独立して、元のフレームを省略せず解析します。画面の動きは解析の進み具合です。</p>}
      {problem && !busy && <div className="cmj-inline-note" role="note"><p>この動画では高さを確定できませんでした。下の診断を保存すると、骨格未検出・重心取得・動画読み込みのどこで止まったか確認できます。動画そのものは含まれません。</p>
        {state?.quality && <p>骨格取得：{state.quality.poseFrames} / {state.processedFrames}コマ、重心取得：{state.quality.validFrames}コマ</p>}
        <button className="cmj-secondary" onClick={download}>解析できない原因を保存</button></div>}
    </section><aside className="cmj-side">
      <section className="cmj-result-panel"><div className="cmj-section-heading"><h2>今回の結果</h2><span>{successful.length} REPS</span></div>
        {state?.results.length ? <><ol className="cmj-result-list">{state.results.map(r => <li key={r.id}><button className={latest?.id === r.id ? 'is-active' : ''} onClick={() => { setActiveResult(r.id); setReview(false); }}>
          <span className="cmj-rep-index">{String(r.id).padStart(2, '0')}</span><span className="cmj-rep-label">両脚ジャンプ<small>{r.analysis.heightCm === null ? '測定条件を確認してください' : '重心速度・推定'}</small></span>
          <strong>{r.analysis.heightCm === null ? '—' : r.analysis.heightCm.toFixed(1)}{r.analysis.heightCm !== null && <small>cm</small>}</strong></button>
          {r.analysis.heightCm === null && <p>{comFeedback(r.analysis.reason)}</p>}</li>)}</ol><button className="cmj-export" onClick={download}><Download size={16} />解析データを保存</button></>
          : <div className="cmj-no-results"><Activity size={27} /><p>ジャンプの結果が<br />ここに並びます。</p><small>解析後に高さと記録を確認できます</small></div>}
      </section>
      <section className="cmj-setup"><p className="cmj-eyebrow">BEFORE YOU JUMP</p><h2>3つの準備で、撮影しやすく。</h2><ol>
        <li><span>01</span><div><strong>正面・全身・明るい場所</strong><p>頭から足先まで。ジャンプしても画面内に収まる距離に。</p></div></li>
        <li><span>02</span><div><strong>スマホを動かさず固定</strong><p>前後に移動せず、同じ場所でジャンプします。</p></div></li>
        <li><span>03</span><div><strong>腰に手を置いて、1秒静止</strong><p>両脚で跳び、ジャンプ後も撮影を続けてください。</p></div></li></ol>
        <p className="cmj-format">録画の目安：30秒以内・3600フレーム以内（240fpsでは約15秒）。MOV・MP4推奨。高fpsの元動画を使用し、フレームを間引く書き出しは避けてください。</p></section>
      <details className="cmj-method"><summary>測定方法と精度について<ChevronDown size={16} /></summary>
        <p>全身の推定重心を追跡し、空中の軌道と蹴り出し速度から高さを計算します。足と床の接触時刻は使いません。</p>
        <p>表示する高さは離地から最高点までの重心上昇量の推定です。試験機能・精度未検証。撮影状態や身体の追跡に不確かさがある場合は数値を表示しません。</p>
        <p>動画は端末内で処理します。初回はモデルのダウンロードが必要です。</p>
        {state && <><p>{state.processedFrames}フレーム処理 / {state.acquisition === 'EXACT_FRAMES' ? '元フレーム解析' : '映像再生からの解析'} / {state.inferenceMs.toFixed(0)} ms</p>
          {state.processingMs !== undefined && <p>解析時間：{(state.processingMs / 1000).toFixed(1)}秒（モデル準備を含む）。撮影時刻を計算に使用し、再生・処理の速さでは変えません。</p>}
          <pre>{JSON.stringify(state.results.map(r => ({ ...r, analysis: { ...r.analysis, samples: undefined } })), null, 2)}</pre></>}
      </details>
    </aside></div><footer className="cmj-footer"><span>SACHIZU LAB / JUMP</span><span>試験機能・精度未検証</span></footer>
  </main>;
}
