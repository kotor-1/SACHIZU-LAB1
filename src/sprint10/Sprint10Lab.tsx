import { useEffect, useMemo, useRef, useState } from 'react';
import { analyzeSprint, type FirstFoot, type SprintSample } from './analysis';
import { measureSprint } from './recording';
import FirstContactPicker, { type FirstContact } from './FirstContactPicker';
import StrideResults from './StrideResults';
import './sprint10.css';

export default function Sprint10Lab() {
  const video = useRef<HTMLVideoElement>(null), owner = useRef<AbortController | null>(null);
  const [file, setFile] = useState<File | null>(null), [url, setUrl] = useState('');
  const [start, setStart] = useState(.12), [finish, setFinish] = useState(.88);
  const [confirmed, setConfirmed] = useState(false), [firstFoot, setFirstFoot] = useState<FirstFoot | null>(null);
  const [ready, setReady] = useState(false), [busy, setBusy] = useState(false), [progress, setProgress] = useState(0);
  const [message, setMessage] = useState(''), [samples, setSamples] = useState<SprintSample[] | null>(null);
  const [review, setReview] = useState('');
  const [firstContact, setFirstContact] = useState<FirstContact | null>(null);
  const result = useMemo(() => samples && firstFoot && confirmed && firstContact ? analyzeSprint(samples, start, finish, firstFoot, firstContact.pts) : null, [samples, start, finish, firstFoot, confirmed, firstContact]);
  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);
  useEffect(() => () => { owner.current?.abort(); owner.current = null; }, []);
  function cancel() { owner.current?.abort(); owner.current = null; setBusy(false); setMessage('解析を中止しました。'); }
  function changeFile(next: File | null) {
    cancel(); setFile(next); setUrl(next ? URL.createObjectURL(next) : ''); setReady(false);
    setSamples(null); setConfirmed(false); setFirstFoot(null); setMessage(''); setProgress(0); setReview('');
    setFirstContact(null);
  }
  function move(which: 'start' | 'finish', value: number) {
    if (busy) return;
    const x = Math.max(.01, Math.min(.99, value));
    if (which === 'start') setStart(x); else setFinish(x);
    // The start gate seeds subject selection: changing gates requires a fresh run.
    setConfirmed(false); setSamples(null); setReview('');
  }
  function drag(which: 'start' | 'finish', event: React.PointerEvent<HTMLButtonElement>) {
    if (busy || !event.currentTarget.hasPointerCapture(event.pointerId)) return;
    const rect = event.currentTarget.parentElement!.getBoundingClientRect();
    move(which, (event.clientX - rect.left) / rect.width);
  }
  async function analyze() {
    if (!file || !firstFoot || !confirmed || !firstContact || busy) return;
    const control = new AbortController(); owner.current = control;
    video.current?.pause(); setBusy(true); setSamples(null); setProgress(0); setReview(''); setMessage('解析を準備しています。');
    try {
      const data = await measureSprint(file, start, control.signal, (value, text) => {
        if (owner.current === control) { setProgress(value); setMessage(text); }
      });
      if (owner.current === control && !control.signal.aborted) setSamples(data);
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
    const blob = new Blob([JSON.stringify({ version: 'sprint10-experimental-v4', file: file?.name, distanceM: 10, firstContact,
      gates: { start, finish }, firstFoot, timeBasis: 'SOURCE_PRESENTATION_TIME', crossingBasis: 'PELVIS_MIDPOINT',
      stepBasis: 'FIRST_CONTACT_AND_FOLLOWING_OVERLAP_ARE_ONE_STEP', strideBasis: 'PELVIS_DISPLACEMENT_BETWEEN_OVERLAPS',
      calibration: 'TWO_GATE_LINEAR_SCALE_NOT_PERSPECTIVE_CORRECTED', result, samples }, null, 2)], { type: 'application/json' });
    const link = document.createElement('a'), objectURL = URL.createObjectURL(blob); link.href = objectURL;
    link.download = 'sprint10-result.json'; link.click(); setTimeout(() => URL.revokeObjectURL(objectURL), 1000);
  }
  const display = (value: number | null | undefined, digits = 2) => value == null ? '—' : value.toFixed(digits);
  return <main className="sprint10">
    <a href={`${import.meta.env.BASE_URL}?dev=1`}>← アプリに戻る</a>
    <header><p className="sprint10-eyebrow">SPRINT / 10 METRES</p><h1>10m スプリント解析</h1>
      <p>2本のラインと最初の足を設定。通過時間と脚の交差周期を解析します。</p></header>
    <p className="sprint10-note">試験機能・精度未検証。固定カメラで真横に近い方向から、1人の全身と10m区間を撮影してください。通常速度の時間軸の動画を使用します。スロー書き出し動画の速度倍率は自動補正しません。</p>
    <section className="sprint10-card"><h2>1　動画をアップロード</h2>
      <label className="sprint10-upload">10m動画を選ぶ<input type="file" accept="video/mp4,video/quicktime,.mov,.mp4,.m4v" disabled={busy} onChange={e => changeFile(e.target.files?.[0] ?? null)} /></label>
      {file && <p>{file.name} · {(file.size / 1024 / 1024).toFixed(1)} MB</p>}
    </section>
    <section className="sprint10-card"><h2>2　動画を再生して確認</h2><p>骨盤がスタートを越える前から、ゴールを越えた後まで映っていることを確認します。</p>
      <div className="sprint10-player">
        <video ref={video} src={url || undefined} controls playsInline preload="auto" onLoadedData={() => setReady(true)} onError={() => { setReady(false); setMessage('この動画を再生できません。対応形式を確認してください。'); }} />
        {ready && <div className="sprint10-gates">{(['start', 'finish'] as const).map(which => <button key={which} type="button" role="slider"
          aria-label={which === 'start' ? 'スタートライン' : 'ゴールライン'} aria-valuemin={1} aria-valuemax={99} aria-valuenow={Math.round((which === 'start' ? start : finish) * 100)}
          className={`sprint10-gate ${which}`} style={{ left: `${(which === 'start' ? start : finish) * 100}%` }} disabled={busy}
          onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); drag(which, e); }} onPointerMove={e => drag(which, e)}
          onPointerUp={e => { if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId); }}
          onKeyDown={e => { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); move(which, (which === 'start' ? start : finish) + (e.key === 'ArrowLeft' ? -.005 : .005)); } }}>
          <span>{which === 'start' ? 'START' : 'FINISH'}</span></button>)}</div>}
      </div>
      {review && <p aria-live="polite">確認中：{review}</p>}
    </section>
    <section className="sprint10-card"><h2>3　スタートとゴールを設定</h2><p>ラインをドラッグして、走路上の白線・コーンに合わせてください。距離は10m固定です。左右の矢印キーでも微調整できます。</p>
      <div className="sprint10-ranges">{(['start', 'finish'] as const).map(which => <label key={which}>{which === 'start' ? 'スタート位置' : 'ゴール位置'}
        <input type="range" min="1" max="99" step=".1" value={(which === 'start' ? start : finish) * 100} disabled={!ready || busy} onChange={e => move(which, Number(e.target.value) / 100)} /></label>)}</div>
      <button disabled={!ready || busy || Math.abs(start - finish) < .1} onClick={() => setConfirmed(true)}>{confirmed ? '✓ ライン設定済み' : 'この2本のラインで決定'}</button>
    </section>
    <section className="sprint10-card"><h2>4　最初の1歩を選択</h2><fieldset disabled={!confirmed || busy}><legend>区間内の最初の1歩（選手本人の左右）</legend>
      <div className="sprint10-feet">{(['left', 'right'] as const).map(foot => <label key={foot} className={firstFoot === foot ? 'selected' : ''}>
        <input type="radio" name="first-foot" value={foot} checked={firstFoot === foot} onChange={() => setFirstFoot(foot)} />{foot === 'left' ? '左足から' : '右足から'}</label>)}</div>
    </fieldset><p>最初に新しく接地する遊脚の左右を選び、その接地コマを登録します。</p>
      {file && <FirstContactPicker key={url} file={file} disabled={busy || !confirmed || !firstFoot} registered={firstContact}
        getTime={() => { video.current?.pause(); return video.current?.currentTime ?? 0; }} onRegister={setFirstContact} />}
    </section>
    <section className="sprint10-card"><h2>5　自動解析</h2><button className="sprint10-primary" disabled={!ready || !confirmed || !firstFoot || !firstContact || busy} onClick={() => void analyze()}>解析する</button>
      {busy && <button onClick={cancel}>中止</button>}
      <p role="status">{message || '動画・ライン・最初の足を設定すると解析できます。'}</p>
      {busy && <progress max="1" value={progress} aria-label="解析の進み具合" />}
    </section>
    {result && <section className="sprint10-card" aria-label="解析結果"><h2>解析結果</h2>
      {result.reason && <p role="alert" className="sprint10-note">{result.reason}</p>}
      <div className="sprint10-metrics">{[['10m通過時間', display(result.duration, 3), '秒'], ['平均速度', display(result.speed), 'm/s'],
        ['推定歩数', display(result.count, 0), '歩'], ['推定ピッチ', display(result.cadence), '歩/秒']].map(([label, value, unit]) => <div key={label}><span>{label}</span><strong>{value}</strong><small>{unit}</small></div>)}</div>
      <p>タイムは骨盤中心のライン通過間隔です。合図からのスタートタイム・全身の重心の測定ではありません。</p>
      {result.warnings.map(w => <p className="sprint10-note" key={w}>{w}</p>)}
      <StrideResults intervals={result.strideIntervals} seek={seek} />
      <h3>検出位置を動画で確認</h3><div className="sprint10-events">
        {result.start && <button onClick={() => seek(result.start!.pts, 'スタート')}>スタート {result.start.pts.toFixed(3)}秒</button>}
        {result.steps.map((s, i) => <button key={s.frame} onClick={() => seek(s.pts, s.registeredContactPts !== undefined ? '1歩目の接地（手動登録）' : `${i + 1}歩目候補（入れ替わり）`)}>
          {s.registeredContactPts !== undefined ? '1歩目の接地（手動登録）' : `${i + 1}歩目候補（入れ替わり）`} · {s.foot === 'left' ? '左' : '右'} · {s.pts.toFixed(4)}秒</button>)}
        {result.finish && <button onClick={() => seek(result.finish!.pts, 'ゴール')}>ゴール {result.finish.pts.toFixed(3)}秒</button>}
      </div><p>候補ボタンでその時刻へ移動します。脚の交差を数えているため、接地フレームを示すものではありません。</p>
      <button onClick={save}>結果と判定データを保存（JSON）</button>
    </section>}
    <footer>動画はこの端末内で処理します。全フレームの解析時間は端末性能により変わります。2本のラインだけで遠近やカメラの揺れを補正することはできません。</footer>
  </main>;
}
