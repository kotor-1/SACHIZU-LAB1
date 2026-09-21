import { useEffect, useMemo, useRef, useState } from 'react';
import type { NormalizedLandmark } from '@mediapipe/tasks-vision';
import ExactFramePicker from '../cmj/ExactFramePicker';
import { measureRecording, supportsExactRecording } from '../cmj/recording-session';
import { DEFAULT_REGION, validRegion, type SubjectRegion } from '../rebound/subject';
import { createLowerSubjectSelector, type JumpMode } from '../rebound/lower-body';
import { predictionSignals, type PoseFrame } from '../rebound/prediction-observations';
import { analyzeRegistered, type Registration } from '../rebound/registered-template';
import { detectLowerPeaks } from '../rebound/waveform-fit';
import RegisteredReview from '../rebound/RegisteredReview';
import '../rebound/rebound.css';

/** Public UI shares the tested measurement/review code. No private training
 * artifact, athlete identifiers, older A–I comparison UI, or demo videos. */
export default function ReboundPublic() {
  const video = useRef<HTMLVideoElement>(null), canvas = useRef<HTMLCanvasElement>(null);
  const owner = useRef<AbortController | null>(null);
  const [file, setFile] = useState<File | null>(null), [url, setUrl] = useState('');
  const [mode, setMode] = useState<JumpMode>('BOTH');
  const [region, setRegion] = useState<SubjectRegion>({ ...DEFAULT_REGION });
  const [confirmed, setConfirmed] = useState(false), [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0), [message, setMessage] = useState('動画を選んでください。');
  const [registration, setRegistration] = useState<Partial<Registration>>({});
  const [poses, setPoses] = useState<PoseFrame[]>([]), [first, setFirst] = useState(0);
  const signals = useMemo(() => predictionSignals(poses, region, mode), [poses, region, mode]);
  const peaks = useMemo(() => poses.length ? detectLowerPeaks(signals.PELVIS, 'PELVIS') : null, [signals, poses.length]);
  const ready = !!(registration.takeoff1 && registration.landing1 && registration.takeoff2);
  const valid = ready && registration.takeoff1!.pts < registration.landing1!.pts && registration.landing1!.pts < registration.takeoff2!.pts
    && registration.landing1!.pts - registration.takeoff1!.pts >= .12 && registration.landing1!.pts - registration.takeoff1!.pts <= .9
    && registration.takeoff2!.pts - registration.landing1!.pts >= .06 && registration.takeoff2!.pts - registration.landing1!.pts <= .6;
  const result = useMemo(() => poses.length && valid ? analyzeRegistered(signals, registration as Registration,
    peaks && peaks.detected > 11 && first > 0 ? peaks.peaks.slice(first - 1, first + 9).map(p => p.frame) : undefined) : null,
  [poses.length, valid, signals, registration, first, peaks]);
  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);
  useEffect(() => {
    const hidden = () => { if (document.hidden) owner.current?.abort(); };
    document.addEventListener('visibilitychange', hidden);
    return () => { owner.current?.abort(); owner.current = null; document.removeEventListener('visibilitychange', hidden); };
  }, []);
  function choose(next?: File) {
    if (!next || busy) return;
    setFile(next); setUrl(URL.createObjectURL(next)); setPoses([]); setRegistration({}); setFirst(0); setConfirmed(false);
    setProgress(0); setMessage('見本の3点と対象者の枠を確認してください。');
  }
  async function start() {
    if (!file || !canvas.current || !valid || !confirmed || !validRegion(region) || busy) return;
    if (!supportsExactRecording(file)) { setMessage('MOV/MP4と、元フレーム解析に対応するブラウザが必要です。'); return; }
    const control = new AbortController(); owner.current = control;
    const current = () => owner.current === control && !control.signal.aborted;
    setBusy(true); setProgress(0); setPoses([]); video.current?.pause();
    const collected: PoseFrame[] = []; let raw: NormalizedLandmark[][] = [];
    const selector = createLowerSubjectSelector(region, mode);
    try {
      await measureRecording(file, canvas.current, control.signal, state => {
        if (current()) setProgress(state.totalFrames ? Math.round(state.processedFrames / state.totalFrames * 100) : 0);
      }, text => { if (current()) setMessage(text); }, { analysis: 'OBSERVATIONS',
        selectPose: (p, pts) => { raw = p; return selector(p, pts); },
        onPose: (_p, frame, pts) => collected.push({ frame, pts, poses: raw }) });
      if (current()) { setPoses(collected); setMessage('解析が完了しました。各回の離地・着地を確認できます。修正に再解析は不要です。'); }
    } catch (e) {
      if (owner.current === control) setMessage(control.signal.aborted ? '解析を停止しました。途中のデータは結果にしません。' : e instanceof Error ? e.message : String(e));
    } finally { if (owner.current === control) { owner.current = null; setBusy(false); } }
  }
  return <main className="rj-lab rj-public">
    <header><a href={import.meta.env.BASE_URL}>← 種目を選ぶ</a><span>SACHIZU LAB</span></header>
    <div className="rj-title"><span>REBOUND JUMP</span><h1>RJ · 連続跳躍を解析</h1><p>最初の3点を見本に後続を予測。認識・算出できた回数の平均と最大RSIを表示します。</p></div>
    <p className="rj-warning">試験機能・精度未検証。予測した接地・離地は映像で確認してください。初回の動きと後半の動きが異なる場合に誤差が生じます。</p>
    <section className="rj-capture"><h2>1　動画と種目</h2>
      <input type="file" accept="video/*" aria-label="RJ動画を選ぶ" disabled={busy} onChange={e => choose(e.target.files?.[0])} />
      <label className="rj-protocol">種目<select aria-label="RJの種目" value={mode} disabled={busy} onChange={e => { setMode(e.target.value as JumpMode); setFirst(0); }}>
        <option value="BOTH">両足RJ</option><option value="RIGHT">右足RJ</option><option value="LEFT">左足RJ</option></select></label>
      <div className="rj-viewer" style={{ maxWidth: 240, marginInline: 'auto' }}><video ref={video} src={url || undefined} controls={!!file && !busy} playsInline muted hidden={busy} />
        <canvas ref={canvas} hidden={!busy} />{file && !busy && <svg className="rj-subject-box" viewBox="0 0 100 100" preserveAspectRatio="none" aria-label="対象者の枠"><rect x={region.left * 100} y={region.top * 100} width={(region.right - region.left) * 100} height={(region.bottom - region.top) * 100} /></svg>}</div>
      {file && <fieldset className="rj-region" disabled={busy}><legend>対象者の腰と支持脚を囲む</legend>
        {(['left', 'right', 'top', 'bottom'] as const).map((key, i) => <label key={key}>{['左端', '右端', '上端', '下端'][i]}<input type="range" min={0} max={100} value={Math.round(region[key] * 100)} onChange={e => { setRegion(r => ({ ...r, [key]: Number(e.target.value) / 100 })); setConfirmed(false); setFirst(0); }} /></label>)}
        <label><input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} />腰と支持脚が枠内に入ることを確認した</label>
        {!validRegion(region) && <p role="alert">枠の上下・左右・大きさを確認してください。</p>}</fieldset>}
    </section>
    {file && <section className="rj-registration"><h2>2　見本の3点を登録</h2><p>平均する回数ではなく、後続の予測に使う見本です。</p>
      <ExactFramePicker file={file} disabled={busy} getTime={() => { video.current?.pause(); return video.current?.currentTime ?? 0; }} frameLabel="RJの登録フレーム"
        instructions="①足が離れた最初のコマ → ②床に触れた最初のコマ → ③次に離れた最初のコマ。両足RJでは両足が離れた時を離地とします。"
        registrations={([['takeoff1', '① 最初の離地を登録'], ['landing1', '② その接地を登録'], ['takeoff2', '③ 次の離地を登録']] as const).map(([key, label]) => ({ label, value: registration[key] ?? null, onRegister: value => setRegistration(r => ({ ...r, [key]: value })) }))} />
      {ready && !valid && <p role="alert">離地①→接地①→離地②の順序と間隔を確認してください。</p>}
    </section>}
    {!poses.length && <button className="rj-button" disabled={!file || !valid || !confirmed || !validRegion(region) || busy} onClick={() => void start()}>連続跳躍を解析</button>}
    {busy && <><progress max={100} value={progress} aria-label="解析の進捗" /><button className="rj-button rj-secondary" onClick={() => owner.current?.abort()}>解析を停止</button></>}
    <p role="status">{busy ? `${progress}% · ` : ''}{message}</p>
    {peaks && <section className="rj-chart"><h2>認識した跳躍：{peaks.detected}回</h2><p>静止開始の1回目は高さのみ。11回なら最後の反動を集計から除外します。10回未満は認識した回数で集計します。</p>
      {peaks.detected > 11 && <label>解析する10回の範囲<select aria-label="解析する10回の範囲" value={first} onChange={e => setFirst(Number(e.target.value))}><option value={0}>範囲を選んでください</option>{Array.from({ length: peaks.detected - 9 }, (_, i) => <option key={i} value={i + 1}>{i + 1}〜{i + 10}回目</option>)}</select></label>}
    </section>}
    {result?.reason && <p role="alert" className="rj-warning">{result.reason}</p>}
    {file && result && !result.reason && <RegisteredReview key={`${url}-${JSON.stringify(registration)}-${JSON.stringify(region)}-${mode}-${first}`} file={file} poses={poses} base={result} />}
    <footer>動画は端末内で処理 · 150MB / 30秒 / 3600フレーム以内 · 記録は保存してください。靴・路面・撮影条件を揃えて比較してください。</footer>
  </main>;
}
