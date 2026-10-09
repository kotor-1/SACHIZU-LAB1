import { useEffect, useMemo, useRef, useState } from 'react';
import { Camera, Upload } from 'lucide-react';
import { cameraConstraints } from '../cmj/camera-geometry';
import { recordCamera } from '../cmj/camera-recording';
import { untilAborted } from '../cmj/session-lifecycle';
import { waitForCurrentFrame } from '../cmj/media-ready';
import type { CrouchFrame } from '../sprint10/crouch';
import { drawCrouchFigure } from '../sprint10/crouch-figure';
import { analyzeStrength, EXERCISES, STRENGTH_VERSION, type Exercise, type Rep, type StrengthResult } from './analysis';
import { liveMarks, sideOn } from './figure';
import { repCue, STRENGTH_GUIDE } from './advice';
import { Voice } from './voice';
import StrengthResults from './StrengthResults';
import '../sprint10/sprint10.css';
import './strength.css';

type Source = 'video' | 'camera';
interface Measured { frames: CrouchFrame[]; width: number; height: number; refiner: 'webgpu' | 'wasm' | null;
  /** The pose read with RTMPose-m 384×288 (fine.ts), not 256×192. */
  fine?: boolean;
  /** The video the frames came from (pictures and the slow replay); null for the camera without a recording. */
  url: string | null; from: 'video' | 'camera' | 'clip' }
/** The camera's recording: at most as long as a video taken (recording.ts) and this large; the counting goes on. */
const CLIP_LIMIT = { milliseconds: 90_000, bytes: 120 * 1024 * 1024 };
/** The analysis of the camera's frames so far is run at most this often (s). */
const LIVE_EVERY = .25;
/** A rep is told when its bottom is at least this long after the last one told (s). */
const TOLD_APART = .5;

/** A camera that would not start, in words with what to do: WebKit's own text is English (「スクワットのリアルタイム解析で
 * カメラが起動しない」, the user, 2026-10-09). */
export function cameraTrouble(e: unknown): string {
  const name = e instanceof Error || e instanceof DOMException ? e.name : '';
  if (name === 'NotAllowedError' || name === 'SecurityError') return 'カメラの使用が許可されていません。Safariでは、アドレスバーの「ぁあ」（aA）→「Webサイトの設定」→「カメラ」を「許可」にして、ページを読み込み直してください。録画した動画でも解析できます。';
  if (name === 'NotReadableError') return 'カメラを開けませんでした。ほかのアプリ（カメラ・ビデオ通話など）がカメラを使っていないか確かめて、ページを読み込み直してください。';
  if (name === 'NotFoundError' || name === 'OverconstrainedError') return 'この端末で使えるカメラが見つかりませんでした。録画した動画を読み込んでください。';
  return e instanceof Error ? e.message : String(e);
}

/** Squat and Romanian deadlift form from the side, a recorded video or the camera (the user, 2026-10-08:
 * 「録画でもリアルタイムでもできるようにしたい」). The camera tells each rep aloud: from the side the athlete faces
 * away from the phone. */
export default function StrengthLab() {
  const [exercise, setExercise] = useState<Exercise>('squat'), [source, setSource] = useState<Source>('video');
  const [file, setFile] = useState<File | null>(null), [url, setUrl] = useState('');
  const [busy, setBusy] = useState(false), [progress, setProgress] = useState(0), [message, setMessage] = useState('');
  const [measured, setMeasured] = useState<Measured | null>(null);
  const owner = useRef<AbortController | null>(null);
  // Camera.
  const camera = useRef<HTMLVideoElement>(null), overlay = useRef<HTMLCanvasElement>(null), stream = useRef<MediaStream | null>(null);
  const [speak, setSpeak] = useState(true), [keep, setKeep] = useState(true), [live, setLive] = useState(false);
  const [hud, setHud] = useState<{ reps: number; last: string; angles: string; fps: number | null; seen: boolean }>({ reps: 0, last: '', angles: '', fps: null, seen: false });
  const [clip, setClip] = useState<File | null>(null);
  const voice = useRef<Voice | null>(null);
  useEffect(() => () => { owner.current?.abort(); stream.current?.getTracks().forEach(t => t.stop()); voice.current?.close(); }, []);
  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);
  useEffect(() => { if (voice.current) voice.current.speak = speak; }, [speak]);
  // The camera's view on screen once it starts (the steps above stay where they are).
  useEffect(() => { if (live) camera.current?.parentElement?.scrollIntoView?.({ behavior: 'smooth', block: 'start' }); }, [live]);
  useEffect(() => { const hidden = () => { if (document.hidden && live) owner.current?.abort(); };
    document.addEventListener('visibilitychange', hidden); return () => document.removeEventListener('visibilitychange', hidden); }, [live]);

  const result: StrengthResult | null = useMemo(() => measured ? analyzeStrength(measured.frames, { width: measured.width, height: measured.height, exercise }) : null, [measured, exercise]);
  useEffect(() => { if (import.meta.env.DEV && measured) (window as unknown as { __strength?: unknown }).__strength = { measured, result }; }, [measured, result]);

  function changeFile(next: File | null) {
    owner.current?.abort(); owner.current = null; setBusy(false);
    setFile(next); setUrl(next ? URL.createObjectURL(next) : ''); setMeasured(null); setMessage(''); setClip(null);
  }
  async function analyzeVideo(target: File, from: Measured['from'], targetUrl: string) {
    if (busy) return;
    const control = new AbortController(); owner.current = control;
    setBusy(true); setMeasured(null); setProgress(0); setMessage('');
    try {
      const { measureStrength } = await import('./recording');
      const data = await measureStrength(target, control.signal, (fraction, text) => { setProgress(fraction); setMessage(text); });
      if (control.signal.aborted) return;
      setMeasured({ frames: data.frames, width: data.width, height: data.height, refiner: data.refiner, fine: data.fine, url: targetUrl, from });
      setMessage('解析が終わりました。');
    } catch (e) { if (!control.signal.aborted) setMessage(e instanceof Error ? e.message : String(e)); }
    finally { if (owner.current === control) { owner.current = null; setBusy(false); } }
  }

  async function startCamera() {
    if (busy) return;
    const control = new AbortController(); owner.current = control;
    const v = new Voice(speak, true); voice.current?.close(); voice.current = v; v.unlock();
    setBusy(true); setLive(true); setMeasured(null); setClip(null); setMessage('カメラを準備しています…');
    setHud({ reps: 0, last: '', angles: '', fps: null, seen: false });
    const frames: CrouchFrame[] = [];
    let size = { width: 0, height: 0 }, lastRun = -Infinity, armed = true, lastCue = '', recorder: ReturnType<typeof recordCamera> | null = null;
    // The bottoms of the reps told: each told once, in order, and never taken back (the analysis of all the frames so
    // far may later merge or drop one; the count on screen and aloud only goes up).
    const told: number[] = [];
    let awake: { release: () => Promise<void> } | null = null;
    const element = camera.current!;
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('カメラを利用できません。HTTPS接続を確認するか、録画した動画を読み込んでください。');
      setMessage('カメラを起動しています…（カメラの使用を求められたら「許可」を押してください）');
      const media = await untilAborted(navigator.mediaDevices.getUserMedia(cameraConstraints(navigator.mediaDevices.getSupportedConstraints())), control.signal);
      stream.current = media; element.srcObject = media; await element.play(); await waitForCurrentFrame(element, control.signal);
      // The screen kept on through the set (the phone on a tripod, nobody touching it).
      try { awake = await (navigator as Navigator & { wakeLock?: { request: (t: 'screen') => Promise<{ release: () => Promise<void> }> } }).wakeLock?.request('screen') ?? null; } catch { awake = null; }
      setMessage('骨格モデルを準備しています…');
      const { prepareStrengthWorker, runLive } = await import('./live');
      const client = await prepareStrengthWorker(control.signal, text => setMessage(text));
      if (control.signal.aborted) { client.dispose(); return; }
      setMessage('');
      if (keep) try { recorder = recordCamera(media, () => setMessage('録画は90秒で止めました（回数の計測は続きます）。'), CLIP_LIMIT); } catch { setMessage('このブラウザでは同時に録画できません。解析だけ続けます。'); }
      v.say('準備できました');
      await runLive(element, client, control.signal, f => {
        frames.push(f.frame); size = { width: f.width, height: f.height };
        const body = sideOn([f.frame], exercise)[0];
        drawLive(overlay.current, element, body, exercise, f.width, f.height);
        const now = f.frame.pts;
        // The depth tone: the squat's thighs reaching level, once a rep.
        const level = liveLevel(body, f.width, f.height);
        if (exercise === 'squat' && level !== null) { if (armed && level >= STRENGTH_GUIDE.squat.beep) { v.beep(); armed = false; } else if (level <= -45) armed = true; }
        if (now - lastRun < LIVE_EVERY) return;
        lastRun = now;
        const r = analyzeStrength(frames, { ...size, exercise });
        for (const rep of r.reps) if (rep.settled && rep.bottom > (told.at(-1) ?? -Infinity) + TOLD_APART) {
          told.push(rep.bottom); lastCue = repCue(r, { ...rep, index: told.length }); v.say(lastCue);
        }
        setHud({ reps: told.length, last: lastCue, angles: liveAngles(body, exercise, f.width, f.height), fps: f.fps, seen: !!f.frame.pose });
      });
    } catch (e) { if (!control.signal.aborted) setMessage(cameraTrouble(e)); }
    finally {
      void awake?.release().catch(() => undefined);
      const recorded = recorder ? await recorder.stop() : null;
      stream.current?.getTracks().forEach(t => t.stop()); stream.current = null; element.srcObject = null;
      overlay.current?.getContext('2d')?.clearRect(0, 0, overlay.current.width, overlay.current.height);
      if (owner.current === control) {
        owner.current = null; setBusy(false); setLive(false);
        setClip(recorded && new File([recorded], `${exercise}-camera.${recorded.type.includes('mp4') ? 'mp4' : 'webm'}`, { type: recorded.type }));
        if (frames.length) { setMeasured({ frames, ...size, refiner: null, url: null, from: 'camera' }); setMessage('計測を終えました。'); }
      }
    }
  }
  function stop() { owner.current?.abort(); }
  function saveClip() {
    if (!clip) return;
    const href = URL.createObjectURL(clip), a = document.createElement('a');
    a.href = href; a.download = clip.name; a.click(); setTimeout(() => URL.revokeObjectURL(href), 1000);
  }
  function detail() {
    if (!clip) return;
    const next = URL.createObjectURL(clip);
    setUrl(old => { if (old) URL.revokeObjectURL(old); return next; });
    void analyzeVideo(clip, 'clip', next);
  }
  function save() {
    if (!result || !measured) return;
    const blob = new Blob([JSON.stringify({ version: STRENGTH_VERSION, exercise, source: measured.from, file: measured.from === 'video' ? file?.name : undefined,
      refiner: measured.refiner, fine: !!measured.fine, result: { ...result, postures: undefined }, postures: result.postures,
      // The camera's points (no video kept to analyse again): to look into a count that went wrong.
      ...(measured.from === 'camera' ? { frames: measured.frames, size: { width: measured.width, height: measured.height } } : {}) }, null, 2)], { type: 'application/json' });
    const href = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = href; a.download = `${exercise}-result.json`; a.click(); setTimeout(() => URL.revokeObjectURL(href), 1000);
  }

  return <main className="sprint10 strength">
    <a className="sprint10-back" href={import.meta.env.BASE_URL}>← 種目を選ぶ</a>
    <header><p className="sprint10-eyebrow">TRAINING / SQUAT · RDL</p><h1>スクワット・RDLのフォーム解析</h1>
      <p>自体重のスクワットとルーマニアンデッドリフト（両脚・片脚）を真横から撮って、1回ごとの姿勢の角度と上げ下げの時間を確かめます。録画した動画でも、カメラでその場でも。</p></header>
    <p className="sprint10-note">試験機能。スマホを腰くらいの高さに固定し、体の真横（左右どちら向きでも）から、頭から足先まで映るように撮影してください。斜めから撮ると角度が変わります。頭から足先までが画面の高さの半分以上になるよう近づき、腕の位置（前に伸ばす・胸の前で組むなど）は毎回同じにしてください（腕の位置で上体の倒れ方が変わります）。</p>
    <section className="sprint10-card"><h2>1　種目と方法を選ぶ</h2>
      <div className="sprint10-seg strength-seg" role="group" aria-label="種目">{(Object.keys(EXERCISES) as Exercise[]).map(id =>
        <button key={id} type="button" aria-pressed={exercise === id} disabled={busy} onClick={() => setExercise(id)}>{EXERCISES[id]}</button>)}</div>
      <div className="sprint10-seg strength-seg" role="group" aria-label="方法">
        <button type="button" aria-pressed={source === 'video'} disabled={busy} onClick={() => setSource('video')}><Upload size={16} aria-hidden="true" /> 録画した動画</button>
        <button type="button" aria-pressed={source === 'camera'} disabled={busy} onClick={() => setSource('camera')}><Camera size={16} aria-hidden="true" /> カメラでその場で</button></div>
    </section>
    {source === 'video' ? <section className="sprint10-card"><h2>2　動画を選んで解析する</h2>
      <label className="sprint10-upload"><input className="sprint10-file-input" type="file" aria-label={`${EXERCISES[exercise]}の動画を選ぶ`} accept="video/mp4,video/quicktime,.mov,.mp4,.m4v" disabled={busy}
        onChange={e => changeFile(e.target.files?.[0] ?? null)} />
        <span className="sprint10-upload-button" aria-hidden="true"><Upload size={19} />{file ? '別の動画を選ぶ' : '動画を選ぶ'}</span></label>
      {file && <p className="sprint10-file">{file.name} · {(file.size / 1024 / 1024).toFixed(1)} MB</p>}
      <p className="sprint10-hint">1セット分（90秒まで）。動画のコマの速さは何でも構いません（1秒30コマで解析します）。</p>
      <button className="sprint10-primary" disabled={!file || busy} onClick={() => file && void analyzeVideo(file, 'video', url)}>解析する</button>
      {busy && <button onClick={() => { owner.current?.abort(); owner.current = null; setBusy(false); setMessage('解析を中止しました。'); }}>中止</button>}
      <p role="status">{message || (file ? '「解析する」を押してください。' : '動画を選ぶと解析できます。')}</p>
      {busy && <progress max="1" value={progress} aria-label="解析の進み具合" />}
    </section> : <section className="sprint10-card"><h2>2　カメラで計測する</h2>
      <p className="sprint10-hint">1回ごとに回数とひとことを声で知らせます{exercise === 'squat' ? '。太ももが水平まで下がると「ピッ」と鳴ります' : ''}。端末の音量を上げてください。</p>
      <div className="strength-options">
        <label><input type="checkbox" checked={speak} onChange={e => setSpeak(e.target.checked)} />声で知らせる</label>
        <label><input type="checkbox" checked={keep} disabled={busy} onChange={e => setKeep(e.target.checked)} />録画も残す（あとで詳しく解析）</label></div>
      <div className="sprint10-player strength-camera" hidden={!live}>
        <video ref={camera} playsInline muted aria-label="カメラの映像" />
        <canvas ref={overlay} className="sprint10-replay-overlay" aria-hidden="true" />
        {live && <div className="strength-hud" aria-live="polite">
          <strong aria-label={`${hud.reps}回`}>{hud.reps}<small>回</small></strong>
          {hud.angles && <span>{hud.angles}</span>}
          {hud.last && <span>{hud.last}</span>}
          {!hud.seen && <span>全身が映る位置に立ってください</span>}</div>}
      </div>
      {!live ? <button className="sprint10-primary" disabled={busy} onClick={() => void startCamera()}>カメラを起動する</button>
        : <button className="sprint10-primary strength-stop" onClick={stop}>計測を終える</button>}
      <p role="status">{message || (live ? `計測中${hud.fps ? `（1秒${Math.round(hud.fps)}コマ）` : ''}。セットが終わったら「計測を終える」を押してください。` : '「カメラを起動する」を押すと、計測が始まります。')}</p>
      {clip && !busy && <div className="strength-clip">
        <button className="sprint10-primary" onClick={detail}>録画を詳しく解析</button>
        <button onClick={saveClip}>撮影した動画を保存</button>
        <p className="sprint10-hint">カメラの計測は速さを優先した簡易版です。録画を詳しく解析すると、高精度の骨格で角度を測り直し、姿勢の画像とスロー再生も見られます。</p></div>}
      {busy && !live && <progress max="1" value={progress} aria-label="解析の進み具合" />}
    </section>}
    {result && measured && <StrengthResults result={result} frames={measured.frames} width={measured.width} height={measured.height}
      url={measured.url} refiner={measured.refiner} fine={!!measured.fine} camera={measured.from === 'camera'} onSave={save} />}
    <footer>{STRENGTH_VERSION} · 動画とカメラの映像はこの端末内で処理し、外部へ送信しません。</footer>
  </main>;
}

/** The live picture: the skeleton and the measured lines, on the camera's view. */
function drawLive(canvas: HTMLCanvasElement | null, video: HTMLVideoElement, f: CrouchFrame, exercise: Exercise, w: number, h: number) {
  const ctx = canvas?.getContext('2d'); if (!canvas || !ctx) return;
  if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) { canvas.width = video.videoWidth; canvas.height = video.videoHeight; }
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (!f.pose) return;
  drawCrouchFigure(ctx, f.pose, q => ({ x: q.x * canvas.width, y: q.y * canvas.height }), liveMarks(f, exercise, w, h), canvas.width / 70, true);
}
/** The thigh against the level now (squat), or null. */
function liveLevel(f: CrouchFrame, w: number, h: number) {
  const m = liveMarks(f, 'squat', w, h).find(k => k.kind === 'level');
  return m ? m.value : null;
}
const liveAngles = (f: CrouchFrame, exercise: Exercise, w: number, h: number) => liveMarks(f, exercise, w, h).map(m => `${m.label} ${Math.round(m.value)}°`).join('　');
export type { Rep };
