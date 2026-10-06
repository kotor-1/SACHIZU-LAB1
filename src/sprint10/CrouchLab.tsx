import { useEffect, useMemo, useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import { analyzeCrouchStart, CROUCH_VERSION, MAX_STEPS, type CrouchFrame, type CrouchResult } from './crouch';
import { measureCrouchStart } from './recording';
import { useFirstFrame } from './first-frame';
import PlayerBar from './PlayerBar';
import { crouchPhases, type Phase } from './crouch-figure';
import { crouchAdvice, GUIDE } from './crouch-advice';
import CrouchCharts, { StepTable } from './CrouchCharts';
import { CrouchReplay, frameInterval, insideFrame, PhaseFigures, type ReplayEvent } from './CrouchViews';
import { applyEdits, moments } from './crouch-edit';
import { refineByPixels, regionsOf, type PixelRegion, type RegionPictures } from './crouch-pixels';
import { readPictures } from './crouch-pixels-read';
import { CrouchReview } from './CrouchReview';

/** One ◀/▶ tap moves the line by 0.2% of the frame width. */
const NUDGE = .002;
const seconds = (v: number | null | undefined, digits = 3) => v == null ? '—' : v.toFixed(digits);
type Tab = 'advice' | 'check' | 'pose' | 'steps' | 'replay';
const TABS: [Tab, string][] = [['advice', 'ポイント'], ['check', '確認'], ['pose', '姿勢'], ['steps', '歩ごと'], ['replay', 'スロー']];
/** The colours of the measured lines on the pictures (markColor in crouch-figure). */
const LEGEND = [['#ffb02e', '体幹（腰→肩）'], ['#3ad7ff', '脛（足首→膝）'], ['#ff6fd8', '前膝'], ['#b58cff', '後膝']] as const;

/** Crouch start from the blocks to the fifth step at most, filmed from the side.
 * Motion only: times and angles, nothing that needs a distance (the user,
 * 2026-10-03: 「距離が必要なものは無しにして動作解析に徹底する」). */
export default function CrouchLab() {
  const video = useRef<HTMLVideoElement>(null), replay = useRef<HTMLVideoElement>(null);
  const owner = useRef<AbortController | null>(null), resultCard = useRef<HTMLElement>(null);
  const [file, setFile] = useState<File | null>(null), [url, setUrl] = useState('');
  const [loaded, setLoaded] = useState(false), [busy, setBusy] = useState(false), [progress, setProgress] = useState(0);
  // The line can be placed on the first frame before the video is played.
  const still = useFirstFrame(url), ready = loaded || !!still;
  const [start, setStart] = useState(.3);
  const [message, setMessage] = useState('');
  const [measured, setMeasured] = useState<{ frames: CrouchFrame[]; width: number; height: number; refiner: 'webgpu' | 'wasm' | null;
    /** The small pictures round the feet the moments are set again from (crouch-pixels.ts). */
    regions: PixelRegion[]; pictures: RegionPictures } | null>(null);
  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);
  useEffect(() => () => { owner.current?.abort(); owner.current = null; }, []);
  // Development builds keep the last recording reachable for the browser checks (dev-validation/crouch/dump-poses.mjs).
  // The moments judged from the pose, then set again from the pictures round the feet where those are clear (the pose's
  // toe point wanders; in darkened test videos the touchdowns were up to 9.5 frames off, from the pictures 5.3).
  const pixels = useMemo(() => measured ? refineByPixels(analyzeCrouchStart(measured.frames, { width: measured.width, height: measured.height }),
    measured.pictures, measured.regions, measured.frames, measured.width, measured.height) : null, [measured]);
  const auto: CrouchResult | null = pixels?.result ?? null;
  const fromPixels = useMemo(() => new Set(pixels?.moments.filter(m => m.fromPixels).map(m => m.key) ?? []), [pixels]);
  useEffect(() => { if (import.meta.env.DEV && measured) (window as unknown as { __crouch?: unknown }).__crouch = { measured, auto, pixels }; }, [measured, auto, pixels]);
  // The judged moments the user moved (frames by moment key), those confirmed, and the one being checked; everything shown
  // uses the result with them (the user, 2026-10-06: 「自動解析→ズレていたら手動で微調整→自動的に数値もそれに伴ってすぐに変化する」).
  const [edits, setEdits] = useState<Record<string, number>>({}), [checked, setChecked] = useState<ReadonlySet<string>>(new Set()), [moment, setMoment] = useState<string | null>(null);
  useEffect(() => { setEdits({}); setChecked(new Set()); setMoment(null); }, [measured]);
  const result: CrouchResult | null = useMemo(() => auto && measured ? applyEdits(auto, edits, measured.frames, measured.width, measured.height) : auto, [auto, edits, measured]);
  const list = useMemo(() => auto && result && measured ? moments(auto, edits, result, measured.frames, measured.width, measured.height, fromPixels) : [], [auto, edits, result, measured, fromPixels]);
  const waiting = list.filter(m => m.flag && !checked.has(m.key)).length, editedCount = Object.keys(edits).length;
  const editedSteps = new Set(Object.keys(edits).flatMap(k => k === 'clearance' ? [] : k.startsWith('td') ? [+k.slice(2), +k.slice(2) - 1] : [+k.slice(2)]));
  // The pictures of the phases are made again only when a phase's frame or angles change (not for a toe-off).
  const phasesNow: Phase[] = result && !result.reason ? crouchPhases(result) : [];
  const phaseKey = JSON.stringify(phasesNow.map(p => [p.key, p.frame, p.marks.map(k => k.value)]));
  const phases: Phase[] = useMemo(() => phasesNow, [phaseKey]);   // eslint-disable-line react-hooks/exhaustive-deps
  const advice = useMemo(() => result && !result.reason ? crouchAdvice(result) : [], [result]);
  const checks = advice.filter(a => a.level === 'check').length;
  const events: ReplayEvent[] = useMemo(() => !result || result.reason ? [] : [
    ...(result.set ? [{ label: '構え', short: '構え', pts: result.set.pts }] : []),
    ...(result.blockClearance ? [{ label: 'ブロックを離れる', short: '離れる', pts: result.blockClearance.pts }] : []),
    ...result.contacts.flatMap(c => [...(c.touchdown !== null ? [{ label: `${c.index}歩目の接地`, short: `${c.index}歩目 接地`, pts: c.touchdown }] : []),
      ...(c.toeOff !== null ? [{ label: `${c.index}歩目の離地`, short: `${c.index}歩目 離地`, pts: c.toeOff }] : [])])], [result]);
  // The result is shown one part at a time under tabs that stay at the top of
  // the screen (all parts one under another were too long on a phone, the
  // user 2026-10-05: 「縦長で使いにくい」).
  const [tab, setTab] = useState<Tab>('advice'), tabs = useRef<HTMLDivElement>(null), panels = useRef<HTMLDivElement>(null);
  const seekTo = useRef<number | null>(null);
  useEffect(() => { setTab('advice'); if (result) resultCard.current?.scrollIntoView?.({ behavior: 'smooth', block: 'start' }); }, [measured]);   // eslint-disable-line react-hooks/exhaustive-deps
  // A phase asked for from its picture is shown once the replay is on screen
  // (a video kept hidden may not know its length yet).
  useEffect(() => {
    const v = replay.current;
    if (tab !== 'replay' || !v || seekTo.current === null) return;
    const t = insideFrame(seekTo.current, measured ? frameInterval(measured.frames) : 1 / 240); seekTo.current = null;
    const go = () => { v.pause(); v.currentTime = t; };
    if (v.readyState >= 1) go(); else v.addEventListener('loadedmetadata', go, { once: true });
  }, [tab, measured]);

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
      const data = await measureCrouchStart(file, start, control.signal, (fraction, text) => { setProgress(fraction); setMessage(text); });
      if (control.signal.aborted) return;
      // The video once more, only round the feet near the judged moments; without these pictures the pose's moments stay.
      const regions = regionsOf(analyzeCrouchStart(data.frames, { width: data.width, height: data.height }), data.frames, data.width, data.height);
      let pictures: RegionPictures = new Map();
      setMessage('足元の画像で、接地・離地の瞬間を確かめています。'); setProgress(0);
      try { pictures = await readPictures(file, regions, control.signal, setProgress); }
      catch (e) { if (control.signal.aborted) throw e; pictures = new Map(); }
      if (control.signal.aborted) return;
      setMeasured({ ...data, regions, pictures }); setMessage('解析が終わりました。');
    } catch (e) {
      if (!control.signal.aborted) setMessage(e instanceof Error ? e.message : String(e));
    } finally { if (owner.current === control) { owner.current = null; setBusy(false); } }
  }
  /** Another tab; when the page is scrolled past the top of the tabs' content,
   * back to that top, so the new part starts just under the tabs. */
  function choose(next: Tab) {
    setTab(next);
    const top = panels.current?.getBoundingClientRect().top, bar = tabs.current?.offsetHeight ?? 0;
    if (top !== undefined && top < bar) window.scrollBy({ top: top - bar });
  }
  /** A moment set (or confirmed as judged), and on to the next one not yet checked. */
  function setMomentFrame(key: string, frame: number) {
    const m = list.find(q => q.key === key); if (!m) return;
    setEdits(e => { const next = { ...e }; if (frame === m.autoFrame) delete next[key]; else next[key] = frame; return next; });
    setChecked(c => new Set(c).add(key));
    const i = list.indexOf(m), next = [...list.slice(i + 1), ...list.slice(0, i)].find(q => !checked.has(q.key));
    setMoment(next ? next.key : key);
  }
  function revert(key: string) { setEdits(e => { const next = { ...e }; delete next[key]; return next; }); }
  /** The check, from the first moment worth a look not yet checked. */
  function openCheck() { const first = list.find(q => q.flag && !checked.has(q.key)) ?? list.find(q => !checked.has(q.key)); if (first) setMoment(first.key); choose('check'); }
  /** A phase in the slow replay: its tab, paused on its frame. */
  function show(p: Phase) { seekTo.current = p.pts; choose('replay'); }
  function save() {
    if (!result) return;
    const blob = new Blob([JSON.stringify({ version: CROUCH_VERSION, file: file?.name, startX: start, result,
      ...(editedCount ? { edited: { frames: edits, auto } } : {}), checked: [...checked],
      fromPictures: [...fromPixels] }, null, 2)],
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
        <div className="sprint10-metrics sprint10-summary">{[['解析した歩数', `${result.contacts.length}`, '歩', false],
          ['ブロック→1歩目の接地', seconds(result.firstFlight), '秒', edits.clearance !== undefined || edits.td1 !== undefined]].map(([label, v, unit, edited]) =>
          <div key={String(label)}><span>{label}{edited && <i className="crouch-edited" aria-label="（手で直した値）">✎</i>}</span><strong>{v}<small>{unit}</small></strong></div>)}</div>
        <p className="crouch-check-note"><span>{editedCount ? `手で直したコマを使っています（${editedCount}か所）。` : '接地・離地などのコマは自動判定です。ずれていたら1コマ単位で直せます。'}
          {waiting > 0 && ` 要確認 ${waiting}か所。`}</span>
          {tab !== 'check' && <button type="button" onClick={openCheck}>確認する</button>}</p>
        {measured && !measured.refiner && <p className="sprint10-note">高精度の骨格モデル（RTMPose）を読み込めなかったため、角度と骨格の表示はMediaPipeの骨格を使っています。</p>}
        <div ref={tabs} className="sprint10-tabs crouch-tabs" role="tablist" aria-label="結果の表示">{TABS.map(([id, label]) =>
          <button key={id} id={`crouch-tab-${id}`} type="button" role="tab" aria-selected={tab === id} aria-controls={`crouch-panel-${id}`} onClick={() => id === 'check' ? openCheck() : choose(id)}>
            {label}{id === 'advice' && checks > 0 && <span className="sprint10-badge" aria-label={`確かめたい点 ${checks}件`}>{checks}</span>}
            {id === 'check' && waiting > 0 && <span className="sprint10-badge" aria-label={`要確認 ${waiting}か所`}>{waiting}</span>}</button>)}</div>
        <div ref={panels} className="sprint10-panels">
          <div id="crouch-panel-advice" role="tabpanel" aria-labelledby="crouch-tab-advice" hidden={tab !== 'advice'}>
            {advice.length > 0 ? <><ul className="sprint10-advice" aria-label="見方のポイント">{advice.map(a => <li key={a.topic + a.text} className={a.level}>
              <span aria-hidden="true">{a.level === 'good' ? '✓' : '!'}</span><div><strong>{a.topic}</strong>{a.text}</div></li>)}</ul>
              <p className="sprint10-hint">目安は短距離選手の研究で報告された一般的な値で、選手ごとの目標ではありません（出典は「数値の見方」）。</p></>
              : <p>目安と比べられる値がありませんでした。</p>}
          </div>
          <div id="crouch-panel-check" role="tabpanel" aria-labelledby="crouch-tab-check" hidden={tab !== 'check'}>
            <p className="sprint10-hint">自動判定のコマを1つずつ確かめます。ずれていたら◀▶か下のコマで合わせて「このコマに決める」、合っていれば「OK」。数値はすぐ変わります。</p>
            {tab === 'check' && auto && <CrouchReview url={url} frames={measured!.frames} width={measured!.width} height={measured!.height} pixels={pixels!.moments}
              auto={auto} result={result} list={list} edits={edits} checked={checked} at={moment} onAt={setMoment}
              onSet={setMomentFrame} onRevert={revert} onRevertAll={() => setEdits({})} onDone={() => choose('steps')} />}
          </div>
          <div id="crouch-panel-pose" role="tabpanel" aria-labelledby="crouch-tab-pose" hidden={tab !== 'pose'}>
            <ul className="sprint10-mark-legend" aria-label="線の色">{LEGEND.map(([color, label]) => <li key={label}><i style={{ background: color }} />{label}</li>)}</ul>
            <p className="sprint10-hint">点線は鉛直、弧が測った角度。画像を左右にスワイプして局面を切り替えます。</p>
            {phases.length ? <PhaseFigures url={url} frames={measured!.frames} phases={phases} onShow={show}
              guides={{ set: `目安：前膝 ${GUIDE.frontKnee[0]}〜${GUIDE.frontKnee[1]}°・後膝 ${GUIDE.rearKnee[0]}〜${GUIDE.rearKnee[1]}°` }} /> : <p>角度を測れる局面がありませんでした。</p>}
          </div>
          <div id="crouch-panel-steps" role="tabpanel" aria-labelledby="crouch-tab-steps" hidden={tab !== 'steps'}>
            <StepTable result={result} edited={editedSteps} />
            <p className="sprint10-hint">—：映っていないため出せない値（滞空とピッチは次の接地まで、接地時間は離地まで必要）。</p>
            {result.notes.map(n => <p className="sprint10-note" key={n}>{n}</p>)}
            <h3>歩ごとの変化</h3>
            <p className="sprint10-hint">加速では歩ごとに、接地時間は短く、滞空時間は長くなり、接地時の脛と体幹は起きていきます。点線はトップ選手1人の例です。</p>
            <CrouchCharts result={result} />
          </div>
          <div id="crouch-panel-replay" role="tabpanel" aria-labelledby="crouch-tab-replay" hidden={tab !== 'replay'} className="sprint10-replay">
            <CrouchReplay url={url} video={replay} frames={measured!.frames} phases={phases} events={events} />
            <p className="sprint10-hint">判定した瞬間の前後では、測った線と角度を表示します。1/8は実際の8分の1の速さです（1秒240コマの動画で毎秒30コマ）。</p>
          </div>
        </div>
        <details className="sprint10-more"><summary>数値の見方</summary>
          <p>接地は靴が床に着いた時、離地はつま先が床から離れた時です。骨格の動きで、足が着く場所とおおよその瞬間を決め、その前後の足元の画像（靴先の画素が、着地した靴と床のどちらに近いか）で瞬間を決め直します。画像ではっきりしない所は骨格の判定のままです。真横から1秒240コマで撮影した3人の検証動画では、映像で見た瞬間との差は最大でおよそ1/60秒でした。同じ動画を暗く・ノイズを多くすると、骨格だけでは接地が最大約1/25秒ずれましたが、画像で決め直すと約1/45秒でした。</p>
          <p>ピッチは接地から次の接地までの時間の逆数です。角度は鉛直を0°とし、進行方向へ倒れる向きを正とします（脛は足首から膝、体幹は腰から肩）。膝は伸び切った状態が180°です。</p>
          <p>骨格の推定が崩れたコマの角度は出しません。</p>
          <p>骨格：選手を見つけて追い、接地・離地を判定するのはMediaPipe、角度と画像・スロー再生の骨格はRTMPose（{measured?.refiner === 'webgpu' ? 'WebGPU' : measured?.refiner === 'wasm' ? 'WebAssembly' : '今回は未使用'}）です。かがんだ構えではRTMPoseの方が膝・腰の位置が体に合い、接地・離地の時刻は映像との差がMediaPipeの方が小さかったためです（3人の検証動画）。</p>
          <p>目安の出典：構えの膝はCavedonら（2019、地方〜全国レベルの短距離選手42人：前膝90〜92°、後膝112〜117°）とBezodisら（2019、総説：前膝91〜99°、後膝117〜136°）。ブロックを離れてから1歩目の接地までは0.045±0.025秒（Bezodisら 2019）。1歩目の接地はトップ選手の例0.177秒（Čoh・Tomazin 2006、100m 10.15秒の選手）、ダイヤモンドリーグの選手の平均0.210秒（男子）・0.225秒（女子）（Bezodisら 2019）。グラフの点線はČoh・Tomazin（2006）の1〜4歩目。歩ごとに脛と体幹が起きていくことはDonaldsonら（2022）。</p>
          <p>接地・離地・ブロックを離れる瞬間は、「確認」で1コマ単位で直せます。直した値には ✎ を付け、保存（JSON）には自動の結果も残します。暗い動画や、カメラの性能が低いスマホの動画では、自動の判定が1コマ以上ずれることがあります。</p>
          <p>この解析の時間はコマ単位（1/240秒）で判定しているため、0.01〜0.02秒の差は誤差の範囲です。ブロックを離れる瞬間は平均で約0.01秒早めに判定するため、1歩目の接地までの時間は少し長めに出ます。</p></details>
      </>}
      <button onClick={save}>結果を保存（JSON）</button>
    </section>}
  </>;
}
