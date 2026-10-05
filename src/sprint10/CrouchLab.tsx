import { useEffect, useMemo, useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import { analyzeCrouchStart, CROUCH_VERSION, MAX_STEPS, type CrouchFrame, type CrouchResult } from './crouch';
import { measureCrouch } from './recording';
import { useFirstFrame } from './first-frame';
import PlayerBar from './PlayerBar';
import { crouchPhases, type Phase } from './crouch-figure';
import { crouchAdvice, GUIDE } from './crouch-advice';
import CrouchCharts from './CrouchCharts';
import { CrouchReplay, frameInterval, insideFrame, PhaseFigures, type ReplayEvent } from './CrouchViews';

/** One ◀/▶ tap moves the line by 0.2% of the frame width. */
const NUDGE = .002;
const seconds = (v: number | null | undefined, digits = 3) => v == null ? '—' : v.toFixed(digits);
const value = (v: number | null | undefined, digits = 2) => v == null ? '—' : v.toFixed(digits);

/** Crouch start from the blocks to the fifth step at most, filmed from the side.
 * Motion only: times and angles, nothing that needs a distance (the user,
 * 2026-10-03: 「距離が必要なものは無しにして動作解析に徹底する」). */
export default function CrouchLab() {
  const video = useRef<HTMLVideoElement>(null), replay = useRef<HTMLVideoElement>(null), replayCard = useRef<HTMLDivElement>(null);
  const owner = useRef<AbortController | null>(null), resultCard = useRef<HTMLElement>(null);
  const [file, setFile] = useState<File | null>(null), [url, setUrl] = useState('');
  const [loaded, setLoaded] = useState(false), [busy, setBusy] = useState(false), [progress, setProgress] = useState(0);
  // The line can be placed on the first frame before the video is played.
  const still = useFirstFrame(url), ready = loaded || !!still;
  const [start, setStart] = useState(.3);
  const [message, setMessage] = useState('');
  const [measured, setMeasured] = useState<{ frames: CrouchFrame[]; width: number; height: number; refiner: 'webgpu' | 'wasm' | null } | null>(null);
  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);
  useEffect(() => () => { owner.current?.abort(); owner.current = null; }, []);
  const result: CrouchResult | null = useMemo(() => measured ? analyzeCrouchStart(measured.frames, { width: measured.width, height: measured.height }) : null, [measured]);
  const phases: Phase[] = useMemo(() => result && !result.reason ? crouchPhases(result) : [], [result]);
  const advice = useMemo(() => result && !result.reason ? crouchAdvice(result) : [], [result]);
  const events: ReplayEvent[] = useMemo(() => !result || result.reason ? [] : [
    ...(result.set ? [{ label: '構え', pts: result.set.pts }] : []),
    ...(result.blockClearance ? [{ label: 'ブロックを離れる', pts: result.blockClearance.pts }] : []),
    ...result.contacts.flatMap(c => [...(c.touchdown !== null ? [{ label: `${c.index}歩目の接地`, pts: c.touchdown }] : []),
      ...(c.toeOff !== null ? [{ label: `${c.index}歩目の離地`, pts: c.toeOff }] : [])])], [result]);
  useEffect(() => { if (result) resultCard.current?.scrollIntoView?.({ behavior: 'smooth', block: 'start' }); }, [measured]);   // eslint-disable-line react-hooks/exhaustive-deps

  function changeFile(next: File | null) {
    owner.current?.abort(); owner.current = null; setBusy(false);
    setFile(next); setUrl(next ? URL.createObjectURL(next) : ''); setLoaded(false); setMeasured(null); setMessage('');
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
  /** A phase in the slow replay: paused on its frame, scrolled into view. */
  function show(p: Phase) {
    const v = replay.current; if (!v) return;
    v.pause(); v.currentTime = insideFrame(p.pts, measured ? frameInterval(measured.frames) : 1 / 240); replayCard.current?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
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
        <video ref={video} src={url || undefined} playsInline preload="auto" poster={still?.image}
          style={still ? { aspectRatio: `${still.width} / ${still.height}` } : undefined}
          onLoadedMetadata={() => setLoaded(true)} onLoadedData={() => setLoaded(true)}
          onError={() => { setLoaded(false); setMessage('この動画を再生できません。対応形式を確認してください。'); }} />
        {ready && <div className="sprint10-gates"><button type="button" role="slider"
          aria-label="スタートラインの線" aria-valuemin={1} aria-valuemax={99} aria-valuenow={Math.round(start * 100)}
          className={`sprint10-gate start${start < .1 ? ' at-left' : start > .9 ? ' at-right' : ''}`}
          style={{ left: `${start * 100}%` }} disabled={busy}
          onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); drag(e); }} onPointerMove={drag}
          onPointerUp={e => { if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId); }}
          onKeyDown={e => { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); move(start + (e.key === 'ArrowLeft' ? -NUDGE : NUDGE)); } }}>
          <span>START</span></button></div>}
      </div>
      {url && <PlayerBar video={video} url={url} disabled={busy} />}
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
        {advice.length > 0 && <><h3>見方のポイント</h3>
          <ul className="sprint10-advice" aria-label="見方のポイント">{advice.map(a => <li key={a.topic + a.text} className={a.level}>
            <span aria-hidden="true">{a.level === 'good' ? '✓' : '!'}</span><div><strong>{a.topic}</strong>{a.text}</div></li>)}</ul>
          <p className="sprint10-hint">目安は短距離選手の研究で報告された一般的な値で、選手ごとの目標ではありません（出典は「数値の見方」）。</p></>}
        <h3>局面ごとの姿勢</h3>
        <p className="sprint10-hint">オレンジ：体幹（腰から肩）、水色：脛（足首から膝）、ピンク：前膝、紫：後膝。点線は鉛直で、弧が測った角度です。</p>
        {phases.length ? <PhaseFigures url={url} frames={measured!.frames} phases={phases} onShow={show}
          guides={{ set: `目安：前膝 ${GUIDE.frontKnee[0]}〜${GUIDE.frontKnee[1]}°・後膝 ${GUIDE.rearKnee[0]}〜${GUIDE.rearKnee[1]}°` }} /> : <p>角度を測れる局面がありませんでした。</p>}
        <h3>歩ごとの変化</h3>
        <p className="sprint10-hint">加速では、接地時間は歩ごとに短く、滞空時間は長くなり、接地時の脛と体幹は歩ごとに起きていきます。点線はトップ選手1人の例です。</p>
        <CrouchCharts result={result} />
        <h3>1歩ごとの時間</h3>
        <ol className="sprint10-strides" aria-label="1歩ごとの値">{result.steps.map(s => <li key={s.step}>
          <div><strong>{s.step}歩目</strong></div>
          <p>接地 {s.contactSeconds === null ? '—（離地が映っていません）' : `${seconds(s.contactSeconds)}秒`}{s.stepSeconds !== null && ` · 滞空 ${seconds(s.flightSeconds)}秒`}</p>
          {s.stepSeconds === null ? <p>滞空・ピッチ：次の接地が映っていません</p>
            : <p>ピッチ {value(s.pitch)}歩/秒</p>}
        </li>)}</ol>
        {result.notes.map(n => <p className="sprint10-note" key={n}>{n}</p>)}
        {measured && !measured.refiner && <p className="sprint10-note">高精度の骨格モデル（RTMPose）を読み込めなかったため、角度と骨格の表示はMediaPipeの骨格を使っています。</p>}
        <div ref={replayCard} className="sprint10-replay"><h3>スロー再生（骨格つき）</h3>
          <p className="sprint10-hint">1/8は実際の8分の1の速さ（1秒240コマの動画で毎秒30コマ）。判定した瞬間の前後では、測った線と角度を表示します。</p>
          <CrouchReplay url={url} video={replay} frames={measured!.frames} phases={phases} events={events} /></div>
        <details className="sprint10-more"><summary>数値の見方</summary>
          <p>接地は、つま先が床の高さまで下りた時、離地はつま先が床から離れた時を、骨格の動きから判定しています。真横から1秒240コマで撮影した3人の検証動画では、映像で見た瞬間との差は最大でおよそ1/60秒でした。</p>
          <p>ピッチは接地から次の接地までの時間の逆数です。角度は鉛直を0°とし、進行方向へ倒れる向きを正とします（脛は足首から膝、体幹は腰から肩）。膝は伸び切った状態が180°です。</p>
          <p>骨格の推定が崩れたコマの角度は出しません。</p>
          <p>骨格：選手を見つけて追い、接地・離地を判定するのはMediaPipe、角度と画像・スロー再生の骨格はRTMPose（{measured?.refiner === 'webgpu' ? 'WebGPU' : measured?.refiner === 'wasm' ? 'WebAssembly' : '今回は未使用'}）です。かがんだ構えではRTMPoseの方が膝・腰の位置が体に合い、接地・離地の時刻は映像との差がMediaPipeの方が小さかったためです（3人の検証動画）。</p>
          <p>目安の出典：構えの膝はCavedonら（2019、地方〜全国レベルの短距離選手42人：前膝90〜92°、後膝112〜117°）とBezodisら（2019、総説：前膝91〜99°、後膝117〜136°）。ブロックを離れてから1歩目の接地までは0.045±0.025秒（Bezodisら 2019）。1歩目の接地はトップ選手の例0.177秒（Čoh・Tomazin 2006、100m 10.15秒の選手）、ダイヤモンドリーグの選手の平均0.210秒（男子）・0.225秒（女子）（Bezodisら 2019）。グラフの点線はČoh・Tomazin（2006）の1〜4歩目。歩ごとに脛と体幹が起きていくことはDonaldsonら（2022）。</p>
          <p>この解析の時間はコマ単位（1/240秒）で判定しているため、0.01〜0.02秒の差は誤差の範囲です。ブロックを離れる瞬間は平均で約0.01秒早めに判定するため、1歩目の接地までの時間は少し長めに出ます。</p></details>
      </>}
      <button onClick={save}>結果を保存（JSON）</button>
    </section>}
  </>;
}
