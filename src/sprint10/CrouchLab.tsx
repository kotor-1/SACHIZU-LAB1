import { useEffect, useMemo, useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import { analyzeCrouchStart, CROUCH_VERSION, MAX_STEPS, type CrouchFrame, type CrouchResult } from './crouch';
import { measureCrouch } from './recording';

/** One ◀/▶ tap moves the line by 0.2% of the frame width. */
const NUDGE = .002;
const seconds = (v: number | null | undefined, digits = 3) => v == null ? '—' : v.toFixed(digits);
const value = (v: number | null | undefined, digits = 2) => v == null ? '—' : v.toFixed(digits);
const angle = (v: number | null | undefined) => v == null ? '—' : `${Math.round(v)}°`;

/** Crouch start from the blocks to the fifth step at most, filmed from the side.
 * Motion only: times and angles, nothing that needs a distance (the user,
 * 2026-10-03: 「距離が必要なものは無しにして動作解析に徹底する」). */
export default function CrouchLab() {
  const video = useRef<HTMLVideoElement>(null), owner = useRef<AbortController | null>(null), resultCard = useRef<HTMLElement>(null);
  const [file, setFile] = useState<File | null>(null), [url, setUrl] = useState('');
  const [ready, setReady] = useState(false), [busy, setBusy] = useState(false), [progress, setProgress] = useState(0);
  const [start, setStart] = useState(.3);
  const [message, setMessage] = useState(''), [review, setReview] = useState('');
  const [measured, setMeasured] = useState<{ frames: CrouchFrame[]; width: number; height: number } | null>(null);
  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);
  useEffect(() => () => { owner.current?.abort(); owner.current = null; }, []);
  const result: CrouchResult | null = useMemo(() => measured ? analyzeCrouchStart(measured.frames, { width: measured.width, height: measured.height }) : null, [measured]);
  useEffect(() => { if (result) resultCard.current?.scrollIntoView?.({ behavior: 'smooth', block: 'start' }); }, [measured]);   // eslint-disable-line react-hooks/exhaustive-deps

  function changeFile(next: File | null) {
    owner.current?.abort(); owner.current = null; setBusy(false);
    setFile(next); setUrl(next ? URL.createObjectURL(next) : ''); setReady(false); setMeasured(null); setMessage(''); setReview('');
  }
  function move(x: number) { if (!busy) setStart(Math.max(.01, Math.min(.99, x))); }
  function drag(event: React.PointerEvent<HTMLButtonElement>) {
    if (busy || !event.currentTarget.hasPointerCapture(event.pointerId)) return;
    const rect = event.currentTarget.parentElement!.getBoundingClientRect();
    move((event.clientX - rect.left) / rect.width);
  }
  async function analyze() {
    if (!file || busy) return;
    const control = new AbortController(); owner.current = control;
    setBusy(true); setMeasured(null); setProgress(0); setMessage('');
    try {
      const data = await measureCrouch(file, start, control.signal, (fraction, text) => { setProgress(fraction); setMessage(text); });
      if (control.signal.aborted) return;
      setMeasured(data); setMessage('解析が終わりました。');
    } catch (e) {
      if (!control.signal.aborted) setMessage(e instanceof Error ? e.message : String(e));
    } finally { if (owner.current === control) { owner.current = null; setBusy(false); } }
  }
  function seek(pts: number, label: string) {
    const v = video.current; if (!v) return;
    v.pause(); v.currentTime = pts; setReview(`${label}（${pts.toFixed(3)}秒）`);
  }
  function save() {
    if (!result) return;
    const blob = new Blob([JSON.stringify({ version: CROUCH_VERSION, file: file?.name, startX: start, result }, null, 2)],
      { type: 'application/json' });
    const href = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = href; a.download = 'crouch-start-result.json'; a.click(); setTimeout(() => URL.revokeObjectURL(href), 1000);
  }
  return <>
    <p className="sprint10-note">試験機能・精度未検証。三脚で固定したカメラで真横から、構え（ブロック）から{MAX_STEPS}歩目までが映るように撮影してください。1秒120コマ以上（240推奨）・通常速度の時間軸の動画を使います。映っている歩だけ（最大{MAX_STEPS}歩）を解析します。</p>
    <section className="sprint10-card"><h2>1　動画を選ぶ</h2>
      <label className="sprint10-upload"><input className="sprint10-file-input" type="file" aria-label="クラウチングスタートの動画を選ぶ" accept="video/mp4,video/quicktime,.mov,.mp4,.m4v" disabled={busy}
        onChange={e => changeFile(e.target.files?.[0] ?? null)} />
        <span className="sprint10-upload-button" aria-hidden="true"><Upload size={19} />{file ? '別の動画を選ぶ' : '動画を選ぶ'}</span></label>
      {file && <p className="sprint10-file">{file.name} · {(file.size / 1024 / 1024).toFixed(1)} MB</p>}
    </section>
    <section className="sprint10-card"><h2>2　スタートラインを合わせる</h2>
      <p>線を、走路のスタートラインに合わせます。選手はこの線の近くの人として選ばれます。</p>
      <div className="sprint10-player">
        <video ref={video} src={url || undefined} controls playsInline preload="auto" onLoadedData={() => setReady(true)}
          onError={() => { setReady(false); setMessage('この動画を再生できません。対応形式を確認してください。'); }} />
        {ready && <div className="sprint10-gates"><button type="button" role="slider"
          aria-label="スタートラインの線" aria-valuemin={1} aria-valuemax={99} aria-valuenow={Math.round(start * 100)}
          className={`sprint10-gate start${start < .1 ? ' at-left' : start > .9 ? ' at-right' : ''}`}
          style={{ left: `${start * 100}%` }} disabled={busy}
          onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); drag(e); }} onPointerMove={drag}
          onPointerUp={e => { if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId); }}
          onKeyDown={e => { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); move(start + (e.key === 'ArrowLeft' ? -NUDGE : NUDGE)); } }}>
          <span>START</span></button></div>}
      </div>
      {review && <p aria-live="polite">確認中：{review}</p>}
      <div className="sprint10-gate-controls"><div className="sprint10-gate-row start">
        <span>スタートライン</span>
        <button type="button" aria-label="スタートラインを左へ" disabled={!ready || busy} onClick={() => move(start - NUDGE)}>◀</button>
        <input type="range" aria-label="スタートラインの位置" min="1" max="99" step=".1" value={start * 100} disabled={!ready || busy}
          onChange={e => move(Number(e.target.value) / 100)} />
        <button type="button" aria-label="スタートラインを右へ" disabled={!ready || busy} onClick={() => move(start + NUDGE)}>▶</button>
      </div></div>
    </section>
    <section className="sprint10-card"><h2>3　解析する</h2>
      <button className="sprint10-primary" disabled={!ready || busy} onClick={() => void analyze()}>解析する</button>
      {busy && <button onClick={() => { owner.current?.abort(); owner.current = null; setBusy(false); setMessage('解析を中止しました。'); }}>中止</button>}
      <p role="status">{message || '動画を選び、スタートラインを合わせると解析できます。'}</p>
      {busy && <progress max="1" value={progress} aria-label="解析の進み具合" />}
    </section>
    {result && <section ref={resultCard} className="sprint10-card sprint10-result" aria-label="解析結果"><h2>解析結果</h2>
      {result.reason ? <p role="alert" className="sprint10-note">{result.reason}</p> : <>
        <div className="sprint10-metrics">{[['解析した歩数', `${result.contacts.length}`, '歩'],
          ['ブロックを離れてから1歩目の接地まで', seconds(result.firstFlight), '秒']].map(([label, v, unit]) =>
          <div key={label}><span>{label}</span><strong>{v}</strong><small>{unit}</small></div>)}</div>
        <ol className="sprint10-strides" aria-label="1歩ごとの値">{result.steps.map(s => <li key={s.step}>
          <div><strong>{s.step}歩目</strong></div>
          <p>接地 {s.contactSeconds === null ? '—（離地が映っていません）' : `${seconds(s.contactSeconds)}秒`}{s.stepSeconds !== null && ` · 滞空 ${seconds(s.flightSeconds)}秒`}</p>
          {s.stepSeconds === null ? <p>滞空・ピッチ：次の接地が映っていません</p>
            : <p>ピッチ {value(s.pitch)}歩/秒</p>}
          <p>接地時の脛 {angle(s.shankAngle)} · 体幹 {angle(s.trunkAngle)}</p>
        </li>)}</ol>
        <div className="sprint10-metrics">{[['構え：体幹の前傾', angle(result.set?.trunkAngle)], ['構え：前膝', angle(result.set?.frontKnee)], ['構え：後膝', angle(result.set?.rearKnee)],
          ['ブロックを離れる瞬間：体幹の前傾', angle(result.blockClearance?.trunkAngle)], ['ブロックを離れる瞬間：前膝', angle(result.blockClearance?.frontKnee)]].map(([label, v]) =>
          <div key={label}><span>{label}</span><strong>{v}</strong></div>)}</div>
        {result.notes.map(n => <p className="sprint10-note" key={n}>{n}</p>)}
        <details className="sprint10-more"><summary>判定した瞬間を動画で確認</summary>
          <div className="sprint10-events">
            {result.blockClearance && <button onClick={() => seek(result.blockClearance!.pts, 'ブロックを離れる')}>ブロックを離れる {result.blockClearance.pts.toFixed(3)}秒</button>}
            {result.contacts.flatMap(c => [
              c.touchdown !== null && <button key={`td${c.index}`} onClick={() => seek(c.touchdown!, `${c.index}歩目の接地`)}>{c.index}歩目の接地 {c.touchdown.toFixed(3)}秒</button>,
              c.toeOff !== null && <button key={`to${c.index}`} onClick={() => seek(c.toeOff!, `${c.index}歩目の離地`)}>{c.index}歩目の離地 {c.toeOff.toFixed(3)}秒</button>])}
          </div><p>ボタンでその時刻へ移動します。</p></details>
        <details className="sprint10-more"><summary>数値の見方</summary>
          <p>接地は、つま先が床の高さまで下りた時、離地はつま先が床から離れた時を、骨格の動きから判定しています。真横から1秒240コマで撮影した3人の検証動画では、映像で見た瞬間との差は最大でおよそ1/60秒でした。</p>
          <p>ピッチは接地から次の接地までの時間の逆数です。角度は鉛直を0°とし、進行方向へ倒れる向きを正とします（脛は足首から膝、体幹は腰から肩）。膝は伸び切った状態が180°です。</p>
          <p>骨格の推定が崩れたコマの角度は出しません。</p></details>
      </>}
      <button onClick={save}>結果を保存（JSON）</button>
    </section>}
  </>;
}
