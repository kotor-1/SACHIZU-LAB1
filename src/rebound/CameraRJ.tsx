import { useEffect, useRef, useState } from 'react';
import { Camera } from 'lucide-react';
import { drawPose } from '../cmj/pose-drawing';
import { keepAwake } from '../cmj/keep-awake';
import { waitForCurrentFrame } from '../cmj/media-ready';
import { recordCamera } from '../cmj/camera-recording';
import { openRJCamera, RJ_CAMERA, type CameraTry } from './rj-camera';
import { startRJWorker, type RJLiveClient } from './rj-live-client';
import { RJCameraPump, type RJPumpState, type RJSet } from './rj-live-session';
import { feetAndLeg } from './jump-watch';
import { cameraFrames } from './rj-frame-source';

/** One set measured on this screen, for the list under the camera. */
export interface CameraRecord { n: number; time: string; rsi: number | null; lastThree: number | null; best: number | null; contactMs: number | null }
type Phase = 'off' | 'opening' | 'ready' | 'measuring' | 'computing';
type Live = { stream: MediaStream; client: RJLiveClient; pump: RJCameraPump; release: () => void; control: AbortController;
  frames: Awaited<ReturnType<typeof cameraFrames>> };
const fmt = (v: number | null, digits = 2) => v == null ? '—' : v.toFixed(digits);

/** RJ from the camera (the user, 2026-10-22: 「RJのリアルタイム解析の再チャレンジしたい…作ってください」): the camera at
 * 60 frames a second, every frame of a set read in order on the phone (rj-live-session.ts), and the result right
 * after the last jump, from the same analysis as a chosen video. The camera stays on for the next athlete. */
export default function CameraRJ({ onSet, onBusy, records }: {
  onSet: (set: RJSet, camera: CameraTry) => Promise<void>; onBusy: (busy: boolean) => void; records: readonly CameraRecord[];
}) {
  const video = useRef<HTMLVideoElement>(null), overlay = useRef<HTMLCanvasElement>(null);
  const live = useRef<Live | null>(null);
  const [phase, setPhase] = useState<Phase>('off');
  const [camera, setCamera] = useState<CameraTry | null>(null), [state, setState] = useState<RJPumpState | null>(null);
  const [note, setNote] = useState<string | null>(null), [aspect, setAspect] = useState(9 / 16);
  const [keepClip, setKeepClip] = useState(false), [clip, setClip] = useState<File | null>(null);
  useEffect(() => { onBusy(phase === 'opening' || phase === 'measuring' || phase === 'computing'); }, [phase, onBusy]);
  useEffect(() => {
    const hidden = () => { if (document.hidden && live.current) { close(); setNote('画面が隠れたため、カメラを止めました。もう一度「カメラを起動」を押してください。'); } };
    document.addEventListener('visibilitychange', hidden);
    return () => { document.removeEventListener('visibilitychange', hidden); close(); };
  }, []);
  useEffect(() => {
    const canvas = overlay.current, size = state?.frameSize;
    if (!canvas || !size) return;
    if (canvas.width !== size.width || canvas.height !== size.height) { canvas.width = size.width; canvas.height = size.height; }
    const context = canvas.getContext('2d');
    if (!context) return;
    context.clearRect(0, 0, canvas.width, canvas.height);
    drawPose(context, state.landmarks, 0, 0);
  }, [state]);

  function close() {
    const l = live.current; live.current = null;
    if (l) { l.control.abort(); l.frames?.close(); l.pump.stop(); l.client.dispose(); l.stream.getTracks().forEach(t => t.stop()); l.release(); }
    if (video.current) video.current.srcObject = null;
    setPhase('off'); setState(null); setCamera(null);
  }
  async function open() {
    if (live.current || phase !== 'off') return;
    const control = new AbortController();
    setPhase('opening'); setClip(null);
    setNote('カメラと解析の準備をしています。初めてのときは、姿勢モデルの読み込みに1分ほどかかります。');
    const [worker, cam] = await Promise.allSettled([startRJWorker(control.signal, text => setNote(text)), openRJCamera(control.signal)]);
    try {
      if (worker.status === 'rejected') throw worker.reason;
      if (cam.status === 'rejected') throw cam.reason;
      const element = video.current;
      if (!element) throw new DOMException('中止', 'AbortError');
      element.removeAttribute('src'); element.srcObject = cam.value.stream;
      await element.play(); await waitForCurrentFrame(element, control.signal);
      if (element.videoWidth && element.videoHeight) setAspect(element.videoWidth / element.videoHeight);
      const failed = (error: Error) => { close(); setNote(error.message); };
      const pump = new RJCameraPump(element, worker.value.client, setState, failed);
      // Every camera frame where the browser can read the camera's track; else the frames shown on the page.
      const frames = await cameraFrames(cam.value.stream, element, frame => pump.feed(frame), failed);
      if (control.signal.aborted) { frames?.close(); pump.stop(); throw new DOMException('中止', 'AbortError'); }
      if (frames) { pump.readFrames(); element.addEventListener('resize', () => void frames.level()); } else pump.start();
      live.current = { stream: cam.value.stream, client: worker.value.client, pump, control, frames, release: await keepAwake() };
      // A reader that started but gives no frames, or frames whose times do not move on: the frames shown on the page instead.
      if (frames) setTimeout(() => {
        const l = live.current;
        if (l?.pump === pump && l.frames && pump.received < 10) { l.frames.close(); l.frames = null; pump.start(); }
      }, 4000);
      setCamera(cam.value.chosen); setPhase('ready'); setNote(null);
    } catch (e) {
      if (worker.status === 'fulfilled' && live.current?.client !== worker.value.client) worker.value.client.dispose();
      if (cam.status === 'fulfilled' && !live.current) cam.value.stream.getTracks().forEach(t => t.stop());
      if (!live.current) { setPhase('off'); if (video.current) video.current.srcObject = null; }
      const name = e instanceof DOMException ? e.name : '';
      setNote(name === 'NotAllowedError' ? 'カメラの使用が許可されていません。ブラウザの設定でこのサイトのカメラを許可してください。'
        : name === 'NotFoundError' || name === 'OverconstrainedError' ? 'カメラが見つかりませんでした。標準カメラで撮った動画を「録画した動画」から読み込んでください。'
        : name === 'AbortError' ? null : e instanceof Error ? e.message : String(e));
    }
  }
  async function measure() {
    const l = live.current;
    if (!l || phase !== 'ready' || !camera) return;
    setPhase('measuring'); setClip(null); setNote(null);
    let recorder: ReturnType<typeof recordCamera> | null = null;
    if (keepClip) {
      try { recorder = recordCamera(l.stream, () => undefined, { milliseconds: (RJ_CAMERA.maximumSeconds + 5) * 1000, bytes: 150 * 1024 * 1024 }); }
      catch { setNote('このブラウザでは動画を残せません。計測はそのまま続けます。'); }
    }
    try {
      const set = await l.pump.beginSet();
      const saved = recorder ? await recorder.stop() : null; recorder = null;
      if (saved) setClip(new File([saved], `rj-camera-${new Date().toISOString().replace(/[:.]/g, '-')}.${saved.type.includes('mp4') ? 'mp4' : 'webm'}`, { type: saved.type }));
      if (live.current !== l) return;
      setPhase('computing');
      await new Promise<void>(resolve => setTimeout(resolve, 0)); // the message shows before the analysis runs
      await onSet(set, camera);
    } catch (e) {
      if (live.current === l && !(e instanceof DOMException && e.name === 'AbortError')) setNote(e instanceof Error ? e.message : String(e));
    } finally {
      recorder?.discard();
      if (live.current === l) setPhase('ready');
    }
  }
  function saveClip() {
    if (!clip) return;
    const href = URL.createObjectURL(clip), a = document.createElement('a');
    a.href = href; a.download = clip.name; a.click(); setTimeout(() => URL.revokeObjectURL(href), 1000);
  }

  const fps = state?.cameraFps ?? null, slow = fps !== null && fps < RJ_CAMERA.minimumFps;
  const athlete = state?.landmarks.length === 1 && !!feetAndLeg(state.landmarks[0]);
  return <section className="rj-camera" aria-label="カメラで計測">
    <h2>カメラで計測</h2>
    <p>スマホを三脚などで固定し、縦向きで、正面から全身と左右の靴・床が映るようにします。「計測を開始」を押してから跳んでください。跳び終わって1秒ほど止まると自動で終わり、すぐに結果が出ます。カメラは点けたままなので、続けて次の人を測れます。映像は端末の中だけで解析し、送信しません。</p>
    <p className="rj-camera-small">カメラは1秒60コマで撮ります（60コマで撮れないスマホでは測れません）。標準カメラの1秒120コマの動画より接地の時間がやや粗く、PUSHとの差は平均0.10から0.13ほどに広がります（検証動画18本のコマを間引いた比較）。</p>
    {phase === 'off' && <button className="rj-button" onClick={() => void open()}><Camera size={19} />カメラを起動</button>}
    {phase === 'opening' && <p className="rj-camera-small" role="status">準備しています…</p>}
    {/* Shown while the camera opens too: Safari does not start a video it cannot see (NotAllowedError). */}
    <div className="rj-viewer" hidden={phase === 'off'} style={{ maxWidth: Math.min(720, aspect * 520), aspectRatio: aspect, marginInline: 'auto' }}>
      <video ref={video} playsInline muted aria-label="カメラの映像" />
      <canvas ref={overlay} className="rj-pose-overlay" aria-hidden="true" />
      {phase === 'measuring' && state && <div className="rj-overlay" data-testid="rj-camera-count"><strong>{state.jumps}</strong><span>回 · {state.setSeconds.toFixed(1)}秒</span></div>}
    </div>
    {camera && <p className="rj-filename" data-testid="rj-camera-info" data-rotation={live.current?.frames?.rotation ?? undefined}>カメラ {camera.width}×{camera.height} · {fps === null ? 'コマ数を確認中' : `1秒${Math.round(fps)}コマ`}{state?.backend ? ` · ${state.backend === 'GPU' ? 'GPU' : 'CPU'}` : ''}{state ? state.frames === 'processor' ? ' · 全コマ受け取り' : ' · 画面のコマ' : ''}</p>}
    {state?.frames === 'screen' && phase === 'ready' && <p className="rj-camera-small" data-testid="rj-camera-screen-frames">このブラウザでは、画面に出たコマだけを受け取ります。コマを取りこぼすと、その周期は測れないことがあります（iOS 18以降のSafariでは、カメラのコマを全部受け取れます）。</p>}
    {slow && <p className="rj-warning" role="alert" data-testid="rj-camera-slow">このスマホのブラウザのカメラは1秒{Math.round(fps!)}コマです。RJの接地の時間には1秒60コマ必要なため、カメラでは測れません。標準カメラ（スローモーション・1秒120コマ）で撮った動画を「録画した動画」から読み込んでください。</p>}
    {phase === 'ready' && !slow && <ul className="rj-camera-checks">
      <li className={athlete ? 'is-ok' : ''}>{athlete ? '全身と両足が映っています' : '全身と両足が映るようにしてください（映るのは1人だけ）'}</li>
      {state?.readFps != null && fps !== null && <li className={state.longestSeconds === null ? 'is-ok' : ''} data-testid="rj-camera-speed">{state.longestSeconds === null
        ? `撮りながら全部のコマを解析できます（このスマホは1秒${Math.round(state.readFps)}コマ）`
        : `このスマホの解析は1秒${Math.round(state.readFps)}コマです。1回の計測は最長${Math.floor(state.longestSeconds)}秒（過ぎると自動で終わります）`}</li>}
    </ul>}
    {phase === 'ready' && <button className="rj-button" disabled={slow || fps === null} onClick={() => void measure()}>計測を開始</button>}
    {phase === 'measuring' && <>
      <p className="rj-camera-small" role="status">計測中 · {state?.setSeconds.toFixed(1) ?? '0.0'}秒 · ジャンプ {state?.jumps ?? 0}回{state && state.setFrames - state.readFrames > 30 ? ` · 解析待ち ${state.setFrames - state.readFrames}コマ` : ''}</p>
      <button className="rj-button rj-secondary" onClick={() => live.current?.pump.endSet('BUTTON')}>計測を終える</button>
    </>}
    {phase === 'computing' && <p className="rj-camera-small" role="status">結果を計算しています…</p>}
    {(phase === 'ready' || phase === 'opening') && <button type="button" className="rj-link-button" onClick={close}>カメラを止める</button>}
    <label className="rj-camera-clip"><input type="checkbox" checked={keepClip} disabled={phase === 'measuring' || phase === 'computing'}
      onChange={e => setKeepClip(e.target.checked)} />撮った動画も端末に残す（結果のあとで保存できます。動画は送信しません）</label>
    {clip && phase !== 'measuring' && <button type="button" className="rj-link-button" onClick={saveClip}>撮影した動画を保存（{(clip.size / 1024 / 1024).toFixed(1)} MB）</button>}
    {note && <p className="rj-warning" role="alert">{note}</p>}
    {records.length > 0 && <details className="rj-camera-records" open><summary>この画面で測った記録（{records.length}回）</summary>
      <div style={{ overflowX: 'auto' }}><table className="rj-table"><thead><tr><th>回</th><th>時刻</th><th>平均RSI</th><th>最後3回</th><th>最高</th><th>接地 ms</th></tr></thead><tbody>
        {[...records].reverse().map(r => <tr key={r.n}><th>{r.n}</th><td>{r.time}</td><td>{fmt(r.rsi)}</td><td>{fmt(r.lastThree)}</td><td>{fmt(r.best)}</td><td>{r.contactMs ?? '—'}</td></tr>)}
      </tbody></table></div>
      <p className="rj-camera-small">ページを閉じると消えます。残すときは、結果ごとに「予測結果・骨格をJSON保存」を押してください。</p>
    </details>}
  </section>;
}
