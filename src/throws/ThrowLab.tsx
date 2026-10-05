import { useEffect, useMemo, useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import { useFirstFrame } from '../sprint10/first-frame';
import PlayerBar from '../sprint10/PlayerBar';
import type { Phase } from '../sprint10/crouch-figure';
import type { CrouchFrame } from '../sprint10/crouch';
import { measureCrouch } from '../sprint10/recording';
import { CrouchReplay, frameInterval, insideFrame, PhaseFigures, type ReplayEvent } from '../sprint10/CrouchViews';
import { nearestPoseFrame } from '../cmj/pose-drawing';
import { analyzeThrow, throwNames, THROW_VERSION, type Hand, type ShotStyle, type ThrowEvent, type ThrowResult } from './analysis';
import { THROW_GUIDE, throwAdvice } from './advice';
import '../sprint10/sprint10.css';

/** One ◀/▶ tap moves the line by 0.2% of the frame width. */
const NUDGE = .002;
type Tab = 'advice' | 'pose' | 'times' | 'replay';
const TABS: [Tab, string][] = [['advice', 'ポイント'], ['pose', '姿勢'], ['times', '時間'], ['replay', 'スロー']];
const LEGEND = { jav: [['#ffb02e', '体幹（腰→肩）'], ['#ff6fd8', 'ブロック脚の膝']], shot: [['#ffb02e', '体幹（腰→肩）'], ['#ff6fd8', '前脚の膝'], ['#b58cff', '後ろ脚の膝']] } as const;
const G = THROW_GUIDE;
const fixed = (v: number | null | undefined, digits = 3) => v == null ? '—' : v.toFixed(digits);
const round = (v: number | null | undefined) => v == null ? '—' : String(Math.round(v));

/** Throws filmed from the side: ジャベリックスロー / javelin, or the shot put
 * (glide or standing; the user, 2026-10-05: 「グライドもしくは助走なし投げのみ」).
 * The user's measures: the javelin's block knee and the time from the block
 * contact to the release; the shot put's phase times and power position. The
 * crouch start's and the hurdle's screen. */
export default function ThrowLab({ event }: { event: ThrowEvent }) {
  const video = useRef<HTMLVideoElement>(null), replay = useRef<HTMLVideoElement>(null);
  const owner = useRef<AbortController | null>(null), resultCard = useRef<HTMLElement>(null);
  const [file, setFile] = useState<File | null>(null), [url, setUrl] = useState('');
  const [loaded, setLoaded] = useState(false), [busy, setBusy] = useState(false), [progress, setProgress] = useState(0);
  const still = useFirstFrame(url), ready = loaded || !!still;
  // The athlete is the person by this line in the first frames (as the crouch start's start line).
  const [line, setLine] = useState(.5), [message, setMessage] = useState('');
  const [hand, setHand] = useState<Hand | null>(null), [style, setStyle] = useState<ShotStyle | null>(null);
  const [measured, setMeasured] = useState<{ frames: CrouchFrame[]; width: number; height: number; refiner: 'webgpu' | 'wasm' | null } | null>(null);
  // The release frame chosen by the user in the replay; null: the one found.
  const [releaseFrame, setReleaseFrame] = useState<number | null>(null);
  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);
  useEffect(() => () => { owner.current?.abort(); owner.current = null; }, []);
  useEffect(() => { setReleaseFrame(null); }, [measured, hand]);
  const result: ThrowResult | null = useMemo(() => measured && hand ? analyzeThrow(measured.frames, { width: measured.width, height: measured.height,
    event, hand, style: style ?? undefined, releaseFrame }) : null, [measured, event, hand, style, releaseFrame]);
  const advice = useMemo(() => result && !result.reason ? throwAdvice(result) : [], [result]);
  const checks = advice.filter(a => a.level === 'check').length;
  const names = throwNames({ event, hand: hand ?? 'right' });
  const events: ReplayEvent[] = useMemo(() => {
    if (!result || result.reason) return [];
    const out: ReplayEvent[] = [];
    const c = (i: number | null) => i === null ? null : result.contacts[i];
    const start = c(result.start), rear = c(result.rear), front = c(result.front);
    if (start?.toeOff != null) out.push({ label: `グライドの開始（${names.rearFoot}が離れる）`, short: 'グライド開始', pts: start.toeOff });
    if (rear?.touchdown != null) out.push({ label: names.rearDown, short: names.rearShort, pts: rear.touchdown });
    if (front?.touchdown != null) out.push({ label: names.frontDown, short: names.frontShort, pts: front.touchdown });
    if (result.power) out.push({ label: names.power, short: '突き出し開始', pts: result.power.pts });
    if (event === 'jav' && result.frontKnee.leastAt) out.push({ label: 'ブロック膝が最も曲がった時', short: '最も曲がる', pts: result.frontKnee.leastAt.pts });
    if (result.release) out.push({ label: 'リリース', short: 'リリース', pts: result.release.pts });
    return out.sort((a, b) => a.pts - b.pts);
  }, [result, event, names.rearFoot, names.rearDown, names.rearShort, names.frontDown, names.frontShort, names.power]);
  const [tab, setTab] = useState<Tab>('advice'), tabs = useRef<HTMLDivElement>(null), panels = useRef<HTMLDivElement>(null);
  const seekTo = useRef<number | null>(null);
  useEffect(() => { setTab('advice'); if (measured) resultCard.current?.scrollIntoView?.({ behavior: 'smooth', block: 'start' }); }, [measured]);
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
  function move(x: number) { if (!busy) setLine(Math.max(.01, Math.min(.99, x))); }
  function drag(e: React.PointerEvent<HTMLButtonElement>) {
    if (busy || !e.currentTarget.hasPointerCapture(e.pointerId)) return;
    const rect = e.currentTarget.parentElement!.getBoundingClientRect();
    move((e.clientX - rect.left) / rect.width);
  }
  async function analyze() {
    if (!file || busy) return;
    const control = new AbortController(); owner.current = control;
    setBusy(true); setMeasured(null); setProgress(0); setMessage('');
    try {
      const data = await measureCrouch(file, line, control.signal, (fraction, text) => { setProgress(fraction); setMessage(text); });
      if (control.signal.aborted) return;
      setMeasured(data); setMessage('解析が終わりました。');
    } catch (e) {
      if (!control.signal.aborted) setMessage(e instanceof Error ? e.message : String(e));
    } finally { if (owner.current === control) { owner.current = null; setBusy(false); } }
  }
  function choose(next: Tab) {
    setTab(next);
    const top = panels.current?.getBoundingClientRect().top, bar = tabs.current?.offsetHeight ?? 0;
    if (top !== undefined && top < bar) window.scrollBy({ top: top - bar });
  }
  function show(p: Phase) { seekTo.current = p.pts; choose('replay'); }
  /** The frame on screen in the replay becomes the release (the user sees the implement leave the hand). */
  function releaseHere() {
    const v = replay.current; if (!v || !measured) return;
    const f = nearestPoseFrame(measured.frames.filter(q => q.pose), v.currentTime - .5 * frameInterval(measured.frames));
    if (f) setReleaseFrame(f.frame === result?.releaseFound?.frame ? null : f.frame);
  }
  function save() {
    if (!result) return;
    const blob = new Blob([JSON.stringify({ version: THROW_VERSION, file: file?.name, line, hand, style, releaseFrame, result }, null, 2)], { type: 'application/json' });
    const href = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = href; a.download = `${event === 'jav' ? 'javelin' : 'shot-put'}-result.json`; a.click(); setTimeout(() => URL.revokeObjectURL(href), 1000);
  }
  const jav = event === 'jav', title = jav ? 'ジャベリックスロー・やり投げの解析' : '砲丸投の解析';
  const settingsReady = hand !== null && (event === 'jav' || style !== null);
  const k = result?.frontKnee, t = result?.times;
  const frontSeen = result && result.front !== null && result.contacts[result.front].touchdown !== null;
  const tiles: [string, string, string, string?][] = !result ? [] : jav ? [
    ['ブロック膝（接地）', round(k?.atStart), '°', frontSeen ? `参考 ${G.blockKnee.contact[0]}〜${G.blockKnee.contact[1]}°` : '接地は映っていません'],
    ['最も曲がった時', round(k?.least), '°', `参考 ${G.blockKnee.least[0]}〜${G.blockKnee.least[1]}°`],
    ['リリース時', round(k?.atRelease), '°', `参考 ${G.blockKnee.release[0]}〜${G.blockKnee.release[1]}°`],
    [frontSeen ? 'ブロック接地→リリース' : '投げ始め→リリース', fixed(t?.delivery), '秒', `参考 ${G.javDelivery.men}（男子）・${G.javDelivery.women}（女子）`],
  ] : style === 'glide' ? [
    ['グライド', fixed(t?.glide), '秒', `参考 ${G.shotTimes.glide}`],
    [`${names.rearFoot}→${names.frontFoot}（移行）`, fixed(t?.rearToFront), '秒', `参考 ${G.shotTimes.transition}`],
    ['突き出し', fixed(t?.delivery), '秒', `参考 ${G.shotTimes.delivery}`],
    ['パワーポジションの後ろ膝', round(result.rearKnee.atStart), '°'],
  ] : [
    ['突き出し', fixed(t?.delivery), '秒', '腰が最も後ろ→リリース'],
    ['開始の後ろ膝', round(result.rearKnee.atStart), '°'],
    ['開始の上体', result.trunk.atStart === null ? '—' : String(Math.round(Math.abs(result.trunk.atStart))), '°', result.trunk.atStart === null ? undefined : result.trunk.atStart < 0 ? '後ろへ' : '前へ'],
    ['リリースの前膝', round(k?.atRelease), '°', `参考 ${G.shotRelease.frontKnee}°前後`],
  ];
  const guides: Record<string, string> = jav
    ? { front: `参考：トップ選手のブロック膝 ${G.blockKnee.contact[0]}〜${G.blockKnee.contact[1]}°、上体は後ろへ${G.javTrunkBack.men}〜${G.javTrunkBack.women}°前後`,
      least: `参考：トップ選手 ${G.blockKnee.least[0]}〜${G.blockKnee.least[1]}°`, release: `参考：トップ選手のブロック膝 ${G.blockKnee.release[0]}〜${G.blockKnee.release[1]}°` }
    : { release: `参考：トップ選手の前膝 ${G.shotRelease.frontKnee}°・後ろ膝 ${G.shotRelease.rearKnee}°前後、上体は前へ${G.shotRelease.trunk}°前後`,
      front: 'パワーポジション：比べられる研究の値は見つかりませんでした' };
  return <main className="sprint10">
    <a className="sprint10-back" href={import.meta.env.BASE_URL}>← 種目を選ぶ</a>
    <header><p className="sprint10-eyebrow">EVENT / {jav ? 'JAVELIN' : 'SHOT PUT'}</p><h1>{title}</h1>
      <p>{jav ? 'ブロック脚（前足）の接地からリリースまで：ブロック脚の膝の角度と、投げの時間。'
        : 'グライドまたは立ち投げ：局面ごとの時間と、パワーポジションの姿勢。'}</p></header>
    <p className="sprint10-note">試験機能。三脚で固定したカメラで、投げる方向に対して真横から全身と足元が映るように撮影してください。{jav
      ? 'ブロック脚の接地の少し前からリリースの後までが映るようにします。'
      : 'グライドの構えから（立ち投げは構えから）リリースの後までが映るようにします。回転投法には対応していません。'}1秒120コマ以上（240推奨）・通常速度の時間軸の動画を使います。</p>
    <section className="sprint10-card"><h2>1　動画を選ぶ</h2>
      <label className="sprint10-upload"><input className="sprint10-file-input" type="file" aria-label={`${jav ? 'ジャベリックスロー・やり投げ' : '砲丸投'}の動画を選ぶ`} accept="video/mp4,video/quicktime,.mov,.mp4,.m4v" disabled={busy}
        onChange={e => changeFile(e.target.files?.[0] ?? null)} />
        <span className="sprint10-upload-button" aria-hidden="true"><Upload size={19} />{file ? '別の動画を選ぶ' : '動画を選ぶ'}</span></label>
      {file && <p className="sprint10-file">{file.name} · {(file.size / 1024 / 1024).toFixed(1)} MB</p>}
    </section>
    <section className="sprint10-card"><h2>2　選手と投げ方</h2>
      <p>線を、動画の最初のコマの選手に合わせます。選手はこの線の近くの人として選ばれます。</p>
      <div className="sprint10-player">
        <video ref={video} src={url || undefined} playsInline preload="auto" poster={still?.image}
          style={still ? { aspectRatio: `${still.width} / ${still.height}` } : undefined}
          onLoadedMetadata={() => setLoaded(true)} onLoadedData={() => setLoaded(true)}
          onError={() => { setLoaded(false); setMessage('この動画を再生できません。対応形式を確認してください。'); }} />
        {ready && <div className="sprint10-gates"><button type="button" role="slider" aria-label="選手の線" aria-valuemin={1} aria-valuemax={99} aria-valuenow={Math.round(line * 100)}
          className={`sprint10-gate start${line < .1 ? ' at-left' : line > .9 ? ' at-right' : ''}`} style={{ left: `${line * 100}%` }} disabled={busy}
          onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); drag(e); }} onPointerMove={drag}
          onPointerUp={e => { if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId); }}
          onKeyDown={e => { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); move(line + (e.key === 'ArrowLeft' ? -NUDGE : NUDGE)); } }}>
          <span>ATHLETE</span></button></div>}
      </div>
      {url && <PlayerBar video={video} url={url} disabled={busy} />}
      <div className="sprint10-gate-controls"><div className="sprint10-gate-row">
        <span>選手</span>
        <button type="button" aria-label="線を左へ" disabled={!ready || busy} onClick={() => move(line - NUDGE)}>◀</button>
        <input type="range" aria-label="選手の線の位置" min="1" max="99" step=".1" value={line * 100} disabled={!ready || busy} onChange={e => move(Number(e.target.value) / 100)} />
        <button type="button" aria-label="線を右へ" disabled={!ready || busy} onClick={() => move(line + NUDGE)}>▶</button>
      </div></div>
      <div className="throw-choices" role="group" aria-label="投げる手"><span>投げる手</span>
        {([['right', '右投げ'], ['left', '左投げ']] as const).map(([id, label]) =>
          <button key={id} type="button" aria-pressed={hand === id} disabled={busy} onClick={() => setHand(id)}>{label}</button>)}</div>
      {!jav && <div className="throw-choices" role="group" aria-label="投法"><span>投法</span>
        {([['glide', 'グライド'], ['standing', '立ち投げ（助走なし）']] as const).map(([id, label]) =>
          <button key={id} type="button" aria-pressed={style === id} disabled={busy} onClick={() => setStyle(id)}>{label}</button>)}</div>}
    </section>
    <section className="sprint10-card"><h2>3　解析する</h2>
      <button className="sprint10-primary" disabled={!ready || busy || !settingsReady} onClick={() => void analyze()}>解析する</button>
      {busy && <button onClick={() => { owner.current?.abort(); owner.current = null; setBusy(false); setMessage('解析を中止しました。'); }}>中止</button>}
      <p role="status">{message || (settingsReady ? '動画を選び、線を選手に合わせると解析できます。' : `動画を選び、線を選手に合わせ、${jav ? '投げる手' : '投げる手と投法'}を選ぶと解析できます。`)}</p>
      {busy && <progress max="1" value={progress} aria-label="解析の進み具合" />}
    </section>
    {result && measured && <section ref={resultCard} className="sprint10-card sprint10-result" aria-label="解析結果"><h2>解析結果</h2>
      {result.reason ? <p role="alert" className="sprint10-note">{result.reason}</p> : <>
        <div className="sprint10-metrics sprint10-summary">{tiles.map(([label, value, unit, note]) =>
          <div key={label}><span>{label}</span><strong>{value}<small>{value === '—' ? '' : unit}</small></strong>{note && <em>{note}</em>}</div>)}</div>
        {!measured.refiner && <p className="sprint10-note">高精度の骨格モデル（RTMPose）を読み込めなかったため、角度と骨格の表示はMediaPipeの骨格を使っています。</p>}
        {result.releaseSetByUser && <p className="sprint10-hint">リリースは、スロー再生で選んだコマ（{result.release!.pts.toFixed(3)}秒）を使っています。</p>}
        <div ref={tabs} className="sprint10-tabs" role="tablist" aria-label="結果の表示">{TABS.map(([id, label]) =>
          <button key={id} id={`throw-tab-${id}`} type="button" role="tab" aria-selected={tab === id} aria-controls={`throw-panel-${id}`} onClick={() => choose(id)}>
            {label}{id === 'advice' && checks > 0 && <span className="sprint10-badge" aria-label={`確かめたい点 ${checks}件`}>{checks}</span>}</button>)}</div>
        <div ref={panels} className="sprint10-panels">
          <div id="throw-panel-advice" role="tabpanel" aria-labelledby="throw-tab-advice" hidden={tab !== 'advice'}>
            {advice.length > 0 && <ul className="sprint10-advice" aria-label="見方のポイント">{advice.map(a => <li key={a.topic + a.text} className={a.level}>
              <span aria-hidden="true">{a.level === 'good' ? '✓' : a.level === 'check' ? '!' : 'i'}</span><div><strong>{a.topic}</strong>{a.text}</div></li>)}</ul>}
            <p className="sprint10-hint">参考値は研究で報告されたトップ選手の値で、選手ごとの目標ではありません（出典は「数値の見方」）。</p>
            {result.notes.map(n => <p className="sprint10-note" key={n}>{n}</p>)}
          </div>
          <div id="throw-panel-pose" role="tabpanel" aria-labelledby="throw-tab-pose" hidden={tab !== 'pose'}>
            <ul className="sprint10-mark-legend" aria-label="線の色">{LEGEND[event].map(([color, label]) => <li key={label}><i style={{ background: color }} />{label}</li>)}</ul>
            <p className="sprint10-hint">点線は鉛直、弧が測った角度。上体は鉛直からの傾き（前傾・後傾）です。画像を左右にスワイプして局面を切り替えます。</p>
            {result.moments.length ? <PhaseFigures url={url} frames={measured.frames} phases={result.moments} onShow={show} guides={guides} /> : <p>角度を測れる局面がありませんでした。</p>}
          </div>
          <div id="throw-panel-times" role="tabpanel" aria-labelledby="throw-tab-times" hidden={tab !== 'times'}>
            <TimeTable result={result} />
            <p className="sprint10-hint">—：映っていないため出せない値。参考はトップ選手の値です（{jav ? '世界選手権の決勝、やり投げ' : '世界選手権の女子決勝・日本のトップ8女子、グライド'}）。</p>
          </div>
          <div id="throw-panel-replay" role="tabpanel" aria-labelledby="throw-tab-replay" hidden={tab !== 'replay'} className="sprint10-replay">
            <CrouchReplay url={url} video={replay} frames={measured.frames} phases={result.moments} events={events} />
            <div className="throw-release-fix">
              <button type="button" onClick={releaseHere}>表示中のコマをリリースにする</button>
              {result.releaseSetByUser && <button type="button" onClick={() => setReleaseFrame(null)}>自動の判定に戻す</button>}
            </div>
            <p className="sprint10-hint">リリースは投げる手が最も高くなったコマとして自動で決めています（実際と2〜3コマずれることがあります）。{jav ? 'やり' : '砲丸'}が手から離れたコマで止めて「表示中のコマをリリースにする」を押すと、そのコマで計算し直します。1/8は実際の8分の1の速さです。</p>
          </div>
        </div>
        <details className="sprint10-more"><summary>数値の見方</summary>
          <p>角度は真横から見た2次元の角度です。膝は伸び切った状態が180°、上体（腰→肩）は鉛直からの傾きです。ブロック脚・前脚・後ろ脚は、骨格の左右ではなく、リリースのときに地面に着いている一番前の足（前足）の場所から決めています。</p>
          <p>接地は、つま先が地面の高さで止まった瞬間を骨格の動きから判定しています。リリースは、選んだ側の手首が最も高くなった瞬間です。真横から1秒120〜240コマで撮った7本（ジャベリックスロー・やり投げ4本、砲丸投グライド3本）をChromeとSafari系のブラウザで解析し、映像で見た瞬間と比べると、前足の接地は0〜3コマ遅く、砲丸投の後ろ足は離地が0〜1コマ早く・接地が0〜3コマ早く、リリースは2コマ早い〜3コマ遅いでした（120コマ/秒で1コマ＝0.008秒）。そのため時間は±0.03秒ほど、膝の角度は、膝が速く動く瞬間（リリースなど）ではコマが1〜2ずれると数度変わります。やり投げの後ろ足（最後の1歩）は、着いた後も足が滑り、止まる瞬間が0.1秒ほど遅れたため出していません。</p>
          {jav ? <p>参考値の出典：ブロック脚の膝はCamposら（2004、1999年世界選手権男子決勝7人：接地158〜178°・最も曲がった時137〜163°・リリース137〜173°）とBennett・Walker・Bissas（2018、2017年世界選手権決勝：リリース 男子162±22°・女子169±17°）。ブロック脚の接地からリリースまでの時間はBennettら（2018：男子0.129±0.013秒・女子0.141±0.012秒）、Camposら（2004：0.11〜0.14秒）、瀧川ら（2020、日本選手権女子決勝：0.132±0.023秒）。接地での上体の後傾はBennettら（2018：男子14±3°・女子16±4°）、田内ら（2012：約15°）。いずれもやり投げの値で、ジャベリックスローの研究値は見つかりませんでした。</p>
            : <p>参考値の出典：グライドの局面時間はDinsdale・Thomas・Bissas（2018、2017年世界選手権女子決勝のグライドの7人：グライド0.136±0.014秒・右足→左足0.112±0.039秒・左足→リリース0.252±0.028秒）と田内ら（2006、日本のトップ8女子：0.148・0.165・0.233秒）。リリースの上体はDinsdaleら（2018：前へ6±6°）、リリースの膝はMastalerz・Sadowski（2022、トップ男子3人：前膝173±3°・後ろ膝142±11°）。パワーポジションの膝と上体の角度は、比べられる研究の値が見つかりませんでした（Young・Li 2005は、右足接地の右膝が曲がっている選手ほど記録が良い傾向を7人の女子で報告しています）。立ち投げの時間の研究値も見つかりませんでした。</p>}
          <p>骨格：選手を見つけて追うのはMediaPipe、接地・リリースの判定、角度と画像・スロー再生の骨格はRTMPose（{measured.refiner === 'webgpu' ? 'WebGPU' : measured.refiner === 'wasm' ? 'WebAssembly' : '今回は未使用'}）です。</p></details>
      </>}
      <button onClick={save}>結果を保存（JSON）</button>
    </section>}
    <footer>{THROW_VERSION} · 動画はこの端末内で処理します。解析時間は端末の性能により変わります。</footer>
  </main>;
}

/** The phases' times with the top throwers' values beside them. */
function TimeTable({ result }: { result: ThrowResult }) {
  const t = result.times, n = throwNames(result);
  const rows: [string, number | null, string][] = result.event === 'jav'
    ? [[result.front !== null && result.contacts[result.front].touchdown !== null ? 'ブロック脚の接地 → リリース' : '投げ始め（腰が最も後ろ） → リリース', t.delivery, `男子 ${G.javDelivery.men}・女子 ${G.javDelivery.women}`]]
    : result.style === 'glide'
    ? [[`グライド（${n.rearFoot}が離れる → ${n.rearFoot}の接地）`, t.glide, `${G.shotTimes.glide}・${G.shotTimesJapan.glide}`],
      [`移行（${n.rearFoot}の接地 → ${n.frontFoot}の接地）`, t.rearToFront, `${G.shotTimes.transition}・${G.shotTimesJapan.transition}`],
      [`突き出し（${n.frontFoot}の接地 → リリース）`, t.delivery, `${G.shotTimes.delivery}・${G.shotTimesJapan.delivery}`]]
    : [['突き出し（腰が最も後ろ → リリース）', t.delivery, '—']];
  return <div className="sprint10-table-wrap"><table className="sprint10-table throw-times" aria-label="局面の時間">
    <thead><tr><th scope="col">局面</th><th scope="col">時間<small>秒</small></th><th scope="col">参考<small>秒</small></th></tr></thead>
    <tbody>{rows.map(([label, value, ref]) => <tr key={label}><th scope="row">{label}</th><td>{fixed(value)}</td><td>{ref}</td></tr>)}</tbody>
  </table></div>;
}
