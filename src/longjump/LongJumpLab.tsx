import { useEffect, useMemo, useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import { useFirstFrame } from '../sprint10/first-frame';
import type { Phase } from '../sprint10/crouch-figure';
import type { CrouchFrame } from '../sprint10/crouch';
import { CrouchReplay, frameInterval, insideFrame, PhaseFigures, type ReplayEvent } from '../sprint10/CrouchViews';
import { measureHurdle } from '../hurdling/recording';
import { analyzeLongJump, LONG_JUMP_VERSION, mps, SPREADS, type LongJumpResult } from './analysis';
import { kmh, LONG_JUMP_GUIDE, longJumpAdvice } from './advice';
import type { RulerPoints } from './ruler';
import RulerSetter from './RulerSetter';
import { useStill } from './still';
import '../sprint10/sprint10.css';
import './longjump.css';

type Tab = 'advice' | 'pose' | 'numbers' | 'replay';
const TABS: [Tab, string][] = [['advice', 'ポイント'], ['pose', '姿勢'], ['numbers', '数値'], ['replay', 'スロー']];
const LEGEND = [['#ffb02e', '体幹（腰→肩）'], ['#b58cff', '踏切脚の膝']] as const;
const G = LONG_JUMP_GUIDE;
const HEIGHT_RANGE = [100, 230] as const;
/** The ruler's length (m): the user's runway, 2 m from the takeoff line to the sand; others differ (1-3 m). */
const DISTANCE = { start: 2, min: .5, max: 5 } as const;
/** The ruler's still may be moved this far from the takeoff touchdown (s), in steps of FRAME_STEP, when the athlete hides a point. */
const FRAME_STEP = .1, FRAME_REACH = .6;
/** First guesses for the four points, from the takeoff foot and the scale had without them; dragged into place by the user. */
function startPoints(r: LongJumpResult, width: number, height: number, distance: number): RulerPoints | null {
  const c = r.takeoff === null ? null : r.contacts[r.takeoff];
  if (!c) return null;
  const s = r.scale?.pxPerM ?? .11 * width, board = c.x + r.direction * .3 * s, sand = board + r.direction * distance * s;
  const far = c.groundY - .012 * height, near = c.groundY + .02 * height;
  const P = (x: number, y: number) => ({ x: Math.max(.01, Math.min(.99, x / width)), y: Math.max(.01, Math.min(.99, y / height)) });
  return { boardFar: P(board, far), boardNear: P(board, near), sandFar: P(sand, far), sandNear: P(sand, near) };
}

/** Long jump, the end of the run-up filmed side-on: the run-up's speed into the board (the user, 2026-10-06:
 * 「助走の最後のところをメインに解析するので跳躍動作や着地は不要」; research ties the run-up's speed to the
 * record most strongly), the rhythm of the last two steps and the posture at the takeoff touchdown as reference.
 * The hurdle's screen and following (the runner found and followed by itself). */
export default function LongJumpLab() {
  const replay = useRef<HTMLVideoElement>(null), owner = useRef<AbortController | null>(null), resultCard = useRef<HTMLElement>(null);
  const [file, setFile] = useState<File | null>(null), [url, setUrl] = useState('');
  const [busy, setBusy] = useState(false), [progress, setProgress] = useState(0), [message, setMessage] = useState('');
  const still = useFirstFrame(url);
  const [heightText, setHeightText] = useState('');
  const heightNumber = Number(heightText), athleteHeight = heightText && heightNumber >= HEIGHT_RANGE[0] && heightNumber <= HEIGHT_RANGE[1] ? heightNumber / 100 : null;
  const [measured, setMeasured] = useState<{ frames: CrouchFrame[]; width: number; height: number; refiner: 'webgpu' | 'wasm' | null } | null>(null);
  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);
  useEffect(() => () => { owner.current?.abort(); owner.current = null; }, []);
  // The ruler: set after the analysis on a still of the takeoff; used once the user turns it on.
  const [ruler, setRuler] = useState<{ use: boolean; distanceText: string; points: RulerPoints | null }>({ use: false, distanceText: String(DISTANCE.start), points: null });
  const [rulerShift, setRulerShift] = useState(0);
  // The takeoff's still (full size) is made only when asked for: an iPhone closed the page around the analysis's end.
  const [rulerOpen, setRulerOpen] = useState(false);
  const distanceNumber = Number(ruler.distanceText), distance = distanceNumber >= DISTANCE.min && distanceNumber <= DISTANCE.max ? distanceNumber : null;
  const plain: LongJumpResult | null = useMemo(() => measured ? analyzeLongJump(measured.frames, { width: measured.width, height: measured.height, athleteHeight }) : null, [measured, athleteHeight]);
  const result: LongJumpResult | null = useMemo(() => measured && plain && ruler.use && ruler.points && distance
    ? analyzeLongJump(measured.frames, { width: measured.width, height: measured.height, athleteHeight, ruler: { points: ruler.points, distance } }) : plain,
  [measured, plain, athleteHeight, ruler.use, ruler.points, distance]);
  const takeoff = plain && !plain.reason && plain.takeoff !== null ? plain.contacts[plain.takeoff] : null;
  const rulerAt = measured && takeoff?.touchdown != null ? insideFrame(takeoff.touchdown + rulerShift, frameInterval(measured.frames)) : null;
  const rulerStill = useStill(url, rulerOpen ? rulerAt : null);
  useEffect(() => {   // new analysis: first guesses for the points, the ruler off
    setRulerShift(0); setRulerOpen(false);
    setRuler(r => ({ ...r, use: false, points: plain && measured && !plain.reason ? startPoints(plain, measured.width, measured.height, distance ?? DISTANCE.start) : null }));
  }, [measured]);   // eslint-disable-line react-hooks/exhaustive-deps
  const advice = useMemo(() => result && !result.reason ? longJumpAdvice(result) : [], [result]);
  const checks = advice.filter(a => a.level === 'check').length;
  const events: ReplayEvent[] = useMemo(() => {
    if (!result || result.reason || result.takeoff === null) return [];
    const names = ['踏切', '1歩前', '2歩前', '3歩前'];
    return names.flatMap((name, k) => { const c = result.contacts[result.takeoff! - k]; if (!c) return [];
      return [...(c.touchdown !== null ? [{ label: `${name}の接地`, short: `${name} 接地`, pts: c.touchdown }] : []),
        ...(c.toeOff !== null ? [{ label: `${name}の離地`, short: `${name} 離地`, pts: c.toeOff }] : [])]; }).sort((a, b) => a.pts - b.pts);
  }, [result]);
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
    setFile(next); setUrl(next ? URL.createObjectURL(next) : ''); setMeasured(null); setMessage('');
  }
  async function analyze() {
    if (!file || busy) return;
    const control = new AbortController(); owner.current = control;
    setBusy(true); setMeasured(null); setProgress(0); setMessage('');
    try {
      const data = await measureHurdle(file, control.signal, (fraction, text) => { setProgress(fraction); setMessage(text.replace('踏切の前の動きを確認しています。', '助走の前のほうを確認しています。')); });
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
  function save() {
    if (!result) return;
    const blob = new Blob([JSON.stringify({ version: LONG_JUMP_VERSION, file: file?.name, heightCm: athleteHeight ? athleteHeight * 100 : null,
      ruler: ruler.use && ruler.points ? { distance, points: ruler.points, frameAt: rulerAt } : null, result }, null, 2)], { type: 'application/json' });
    const href = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = href; a.download = 'long-jump-result.json'; a.click(); setTimeout(() => URL.revokeObjectURL(href), 1000);
  }
  const lastTwo = result ? mps(result, result.speed.lastTwoPx) : null, atTouchdown = result ? mps(result, result.speed.touchdownPx) : null;
  const upward = result ? mps(result, result.leave?.verticalPx ?? null) : null;
  const spread = result?.scale ? SPREADS[result.scale.source] : SPREADS.trunk, missing = '身長か物差しで出ます';
  const vertical: [string, string, string, string] = ['離地の鉛直速度', upward === null ? '—' : upward.toFixed(2), 'm/秒',
    upward === null ? (result?.scale ? '' : missing) : `目安 ${(upward * (1 - spread)).toFixed(1)}〜${(upward * (1 + spread)).toFixed(1)}`];
  const angle: [string, string, string, string] = ['踏切角度（参考）', result?.leave ? Math.round(result.leave.angle).toString() : '—', '°',
    result?.leave ? '人ごとに最適が違い、目標にしない値' : result?.scale ? '' : missing];
  const speedTile = (label: string, v: number | null): [string, string, string, string] => [label, v === null ? '—' : v.toFixed(1), 'm/秒',
    v === null ? (result?.scale ? '' : missing) : `時速約${kmh(v)}km・目安 ${(v * (1 - spread)).toFixed(1)}〜${(v * (1 + spread)).toFixed(1)}`];
  const sc = result?.scale ?? null;
  const scaleText = !sc ? '' : sc.source === 'ruler'
    ? `縮尺は、踏切板と砂場の物差し（${distance} m）から、踏切足の位置で求めました（目安の幅 ±${SPREADS.ruler * 100}%）。`
    : sc.source === 'trunk'
      ? `縮尺は、身長と踏切前2歩の胴（肩〜腰）の長さから求めました（目安の幅 ±${SPREADS.trunk * 100}%）。踏切板と砂場が映っていれば、下の「物差し」を合わせると誤差が小さくなります。`
      : `縮尺は、踏切の後の空中の重心の放物線（重力）から求めました。この方法は試験動画で速さが約1割遅く出たため、目安の幅を±${SPREADS.gravity * 100}%にしています。身長を入れるか、下の「物差し」を合わせてください。`;
  return <main className="sprint10">
    <a className="sprint10-back" href={import.meta.env.BASE_URL}>← 種目を選ぶ</a>
    <header><p className="sprint10-eyebrow">EVENT / LONG JUMP</p><h1>走り幅跳び：助走の最後</h1>
      <p>踏切に入る最後の数歩：助走速度（目安）と、最後の2歩のリズム、踏切接地の姿勢。踏切の離地の速さと角度。</p></header>
    <p className="sprint10-note">試験機能。三脚で固定したカメラで、助走路に対して真横から、踏切の2〜3歩前から踏切の後の空中までが映るように撮影してください（着地は映らなくてかまいません）。踏切の後の空中が0.5秒ほど映っていると、その空中の動きから速さの縮尺が決まります。1秒120コマ以上（240推奨）・通常速度の時間軸の動画を使います。</p>
    <section className="sprint10-card"><h2>1　動画を選ぶ</h2>
      <label className="sprint10-upload"><input className="sprint10-file-input" type="file" aria-label="走り幅跳びの動画を選ぶ" accept="video/mp4,video/quicktime,.mov,.mp4,.m4v" disabled={busy}
        onChange={e => changeFile(e.target.files?.[0] ?? null)} />
        <span className="sprint10-upload-button" aria-hidden="true"><Upload size={19} />{file ? '別の動画を選ぶ' : '動画を選ぶ'}</span></label>
      {file && <p className="sprint10-file">{file.name} · {(file.size / 1024 / 1024).toFixed(1)} MB</p>}
      {still && <img className="longjump-still" src={still.image} alt="動画の最初のコマ" />}
      <label className="throw-height"><span>身長（任意）</span><input type="number" inputMode="decimal" min={HEIGHT_RANGE[0]} max={HEIGHT_RANGE[1]} step="1" placeholder="例 160"
        value={heightText} onChange={e => setHeightText(e.target.value)} aria-label="選手の身長（cm）" /><small>cm</small></label>
      <p className="sprint10-hint">身長を入れると、選手の胴の長さから速さの縮尺を求めます。踏切板と砂場が映っていれば、解析の後に「物差し」を合わせるとさらに正確になります。走る向きと選手は自動で見つけます。</p>
    </section>
    <section className="sprint10-card"><h2>2　解析する</h2>
      <button className="sprint10-primary" disabled={!file || busy} onClick={() => void analyze()}>解析する</button>
      {busy && <button onClick={() => { owner.current?.abort(); owner.current = null; setBusy(false); setMessage('解析を中止しました。'); }}>中止</button>}
      <p role="status">{message || '動画を選ぶと解析できます。'}</p>
      {busy && <progress max="1" value={progress} aria-label="解析の進み具合" />}
    </section>
    {result && measured && <section ref={resultCard} className="sprint10-card sprint10-result" aria-label="解析結果"><h2>解析結果</h2>
      {result.reason ? <p role="alert" className="sprint10-note">{result.reason}</p> : <>
        <div className="sprint10-metrics sprint10-summary">{[speedTile('助走速度（最後の2歩）', lastTwo), speedTile('踏切接地の瞬間', atTouchdown), vertical, angle].map(([label, value, unit, note]) =>
          <div key={label}><span>{label}</span><strong>{value}<small>{value === '—' ? '' : unit}</small></strong>{note && <em>{note}</em>}</div>)}</div>
        <p className="sprint10-note"><strong>速さは動画から推定した目安です。</strong>{scaleText}研究では助走速度が記録と最も強く結びつき（0.1 m/秒速いと約13cm）、離地の鉛直速度も女子で記録と結びつきます。</p>
        {!measured.refiner && <p className="sprint10-note">高精度の骨格モデル（RTMPose）を読み込めなかったため、MediaPipeの骨格を使っています。</p>}
        <div ref={tabs} className="sprint10-tabs" role="tablist" aria-label="結果の表示">{TABS.map(([id, label]) =>
          <button key={id} id={`lj-tab-${id}`} type="button" role="tab" aria-selected={tab === id} aria-controls={`lj-panel-${id}`} onClick={() => choose(id)}>
            {label}{id === 'advice' && checks > 0 && <span className="sprint10-badge" aria-label={`確かめたい点 ${checks}件`}>{checks}</span>}</button>)}</div>
        <div ref={panels} className="sprint10-panels">
          <div id="lj-panel-advice" role="tabpanel" aria-labelledby="lj-tab-advice" hidden={tab !== 'advice'}>
            <SpeedChart result={result} />
            {advice.length > 0 && <ul className="sprint10-advice" aria-label="見方のポイント">{advice.map(a => <li key={a.topic + a.text} className={a.level}>
              <span aria-hidden="true">{a.level === 'good' ? '✓' : a.level === 'check' ? '!' : 'i'}</span><div><strong>{a.topic}</strong>{a.text}</div></li>)}</ul>}
            <p className="sprint10-hint">リズムと姿勢は記録との結びつきが弱いため、参考として出しています。参考値は研究で報告された値で、選手ごとの目標ではありません（出典は「数値の見方」）。</p>
            {result.notes.map(n => <p className="sprint10-note" key={n}>{n}</p>)}
          </div>
          <div id="lj-panel-pose" role="tabpanel" aria-labelledby="lj-tab-pose" hidden={tab !== 'pose'}>
            <ul className="sprint10-mark-legend" aria-label="線の色">{LEGEND.map(([color, label]) => <li key={label}><i style={{ background: color }} />{label}</li>)}</ul>
            <p className="sprint10-hint">点線は鉛直、弧が測った角度。画像を左右にスワイプして接地を切り替えます。</p>
            {result.moments.length ? <PhaseFigures url={url} frames={measured.frames} phases={result.moments} onShow={show}
              guides={{ takeoff: `脚の角度（股関節→足首と水平）${result.posture.legAngle === null ? '—' : `${Math.round(result.posture.legAngle)}°`}・参考 女子${G.legAngle.women}°・男子${G.legAngle.men}°前後` }} /> : <p>接地の画像を作れませんでした。</p>}
          </div>
          <div id="lj-panel-numbers" role="tabpanel" aria-labelledby="lj-tab-numbers" hidden={tab !== 'numbers'}>
            <StepList result={result} />
          </div>
          <div id="lj-panel-replay" role="tabpanel" aria-labelledby="lj-tab-replay" hidden={tab !== 'replay'} className="sprint10-replay">
            <CrouchReplay url={url} video={replay} frames={measured.frames} phases={result.moments} events={events} />
            <p className="sprint10-hint">判定した接地・離地へ移動できます。1/8は実際の8分の1の速さです。</p>
          </div>
        </div>
        <details className="sprint10-more"><summary>数値の見方</summary>
          <p>助走速度は、骨格から求めた重心（de Leva 1996）が、2歩前の接地から踏切の接地までに前へ進んだ距離をその時間で割った値です。「踏切接地の瞬間」は、その瞬間の前後0.0125秒の重心の動きから求めた値です。</p>
          <p>縮尺（1 mが何画素か）は、次の順に使います。①物差し：踏切線（踏切板の白と緑の境目）から砂が始まる所までの距離と、その2本の線が助走路の奥・手前の縁と交わる4点から、地面の平面の写り方を求め、踏切足の位置での縮尺を出します（助走路の手前寄りか奥寄りかで縮尺が最大で±8%変わるため）。②身長：踏切前2歩の胴（肩の中点〜腰の中点、身長の0.288）の長さ。③重力：踏切の後の空中（0.45秒以上）の重心の放物線の曲がり。真横から240コマ/秒で撮った4本で物差し（2 m）と比べると、身長からの縮尺は−9〜+4%、重力からの縮尺は2本とも11%大きく（速さが約1割遅く出る）、物差しで測った選手の胴の長さは4本で0.40〜0.44 m（身長150 cm）でした。光電管などとの比較はしていないため、目安の幅は物差し±5%・身長±10%・重力±15%です。ChromeとSafari系の差は、最後の2歩の速さで2%以内でした。</p>
          <p>接地は、つま先が地面の高さで止まった瞬間です（左右の脚は骨格の左右ではなく、つま先の位置で判定）。踏切は、長い空中（0.25秒以上）の前の接地です。リズムは、最後の1歩（1歩前の接地→踏切の接地）の時間を、その前の歩の時間で割った値です。踏切接地の脚の角度は、股関節から足首の線と水平がなす角度です。</p>
          <p>離地の速さと踏切角度は、踏切の離地から後の空中の重心から求めます。前への位置を直線に、高さを重力の放物線（曲がりは縮尺に合わせて固定）に当てはめ、離地の瞬間の向きと速さを出します。空中が0.2秒以上映っていることが条件です。曲がりを自由に当てはめると、空中が0.3秒しか映っていない動画で角度が2.4°ずれたため固定しています。ChromeとSafari系の差は、水平速度で約2%、鉛直速度で0.03 m/秒、角度で0.3°以内でした。</p>
          <p>出典：助走速度と記録の関係は太田ら（2010、コーチング学研究24(1)：関西学生、踏切前7〜2 mの速さと記録 r = 0.858（男子）・0.811（女子）、女子（記録4.28〜5.88 m）の速さ8.28±0.37 m/秒）、0.1 m/秒あたり約13 cmはHay（1993、高校生〜エリートの横断データ、Bridgett・Linthorne 2006 の記載）。最後の3歩のリズムはTucker・Bissas（2018、世界室内選手権女子決勝：接地0.105・0.113・0.122秒、空中0.112・0.136・0.075秒、比はこれらの平均から計算）。脚の角度はBridgett・Linthorne（2006：61±3°）、Nemtsevら（2016、女子：59.6±2.8°）。踏切の接地時間はNemtsevら（2016、女子：0.133±0.011秒）。離地の速さと角度はNemtsevら（2016、240コマ/秒の真横の撮影、女子（平均5.50 m）：水平7.06・鉛直2.75 m/秒、角度21.3°、記録との相関 鉛直 r = 0.61・水平 r = 0.64（女子））。踏切角度の最適は人ごとに20.9〜25.4°（Linthorneら 2005）で、目標にする値ではありません。</p>
          <p>骨格：選手を見つけて追うのはMediaPipe、接地の判定・重心・角度と画像・スロー再生の骨格はRTMPose（{measured.refiner === 'webgpu' ? 'WebGPU' : measured.refiner === 'wasm' ? 'WebAssembly' : '今回は未使用'}）です。</p></details>
      </>}
      <button onClick={save}>結果を保存（JSON）</button>
    </section>}
    {result && measured && !result.reason && takeoff && <section className="sprint10-card" aria-label="物差し"><h2>3　踏切板と砂場の物差し（任意）</h2>
      <p>踏切板と砂場が映っていれば、踏切線（踏切板の白と緑の境目）から砂が始まる所までの距離を物差しにして、速さをより正確に出せます（目安の幅 ±{SPREADS.ruler * 100}%）。下の拡大画面で、4つの点を、踏切線と砂の始まりが<strong>助走路の奥の縁・手前の縁と交わる所</strong>に合わせてください。</p>
      {!rulerOpen ? <button type="button" onClick={() => setRulerOpen(true)}>物差しを合わせる（踏切のコマを開く）</button> : <>
      <div className="longjump-ruler-options">
        <label>踏切線から砂まで<input type="number" inputMode="decimal" min={DISTANCE.min} max={DISTANCE.max} step=".01" value={ruler.distanceText}
          onChange={e => setRuler(r => ({ ...r, distanceText: e.target.value }))} aria-label="踏切線から砂までの距離（m）" />m</label>
        <label><input type="checkbox" checked={ruler.use} disabled={!ruler.points || !distance} onChange={e => setRuler(r => ({ ...r, use: e.target.checked }))} />物差しを使う</label>
      </div>
      <div className="longjump-frame-step" role="group" aria-label="物差しを合わせるコマ">
        <button type="button" disabled={rulerShift <= -FRAME_REACH + 1e-9} onClick={() => setRulerShift(v => Math.round((v - FRAME_STEP) * 10) / 10)}>◀ 0.1秒前</button>
        <span>踏切の接地{rulerShift === 0 ? '' : ` ${rulerShift > 0 ? '+' : ''}${rulerShift.toFixed(1)}秒`}のコマ</span>
        <button type="button" disabled={rulerShift >= FRAME_REACH - 1e-9} onClick={() => setRulerShift(v => Math.round((v + FRAME_STEP) * 10) / 10)}>0.1秒後 ▶</button>
      </div>
      {rulerStill && ruler.points ? <RulerSetter key={`${file?.name}-${measured.frames.length}`} still={rulerStill} points={ruler.points}
        foot={{ x: takeoff.x / measured.width, y: takeoff.groundY / measured.height }} onChange={points => setRuler(r => ({ ...r, points }))} />
        : <p role="status">踏切のコマを読み込んでいます…</p>}
      {ruler.use && (sc?.source === 'ruler' && sc.ruler
        ? <p className="sprint10-note" role="status">物差しの縮尺 {sc.pxPerM.toFixed(0)} 画素/m（踏切足は踏切線の{sc.ruler.behind.toFixed(2)} m手前、助走路の奥から{Math.round(sc.ruler.across * 100)}%の位置）。{sc.trunk ? `身長からの縮尺との差 ${Math.round((sc.trunk / sc.pxPerM - 1) * 100)}%。` : ''}上の解析結果はこの物差しで計算しています。</p>
        : <p className="sprint10-note" role="status">4つの点から物差しを作れませんでした。奥の点が手前の点より上に、踏切線と砂の始まりが左右に離れているか確かめてください。</p>)}
      </>}
    </section>}
    <footer>{LONG_JUMP_VERSION} · 動画はこの端末内で処理します。解析時間は端末の性能により変わります。</footer>
  </main>;
}

const seconds = (v: number | null) => v === null ? '—' : `${v.toFixed(3)}秒`;
/** Each step before the takeoff (nearest last): its contact, flight and speed; the takeoff's contact. */
function StepList({ result: r }: { result: LongJumpResult }) {
  const rows: [string, string, string][] = [...r.steps].reverse().map(s => {
    const v = mps(r, s.speedPx);
    return [`${s.before === 1 ? '最後の1歩' : `${s.before}歩前`}（接地 → 次の接地）`,
      `${v === null ? '—' : `${v.toFixed(1)} m/秒`}`,
      `接地 ${seconds(s.contact)}・空中 ${seconds(s.flight)}`];
  });
  rows.push(['最後の2歩のリズム（最後の1歩 ÷ その前の歩）', r.rhythm === null ? '—' : `${Math.round(r.rhythm * 100)}%`, `参考 ${Math.round(G.rhythm * 100)}%（世界室内の女子決勝の平均から）`]);
  rows.push(['踏切の接地時間（参考）', seconds(r.takeoffContact), `参考 女子 ${G.takeoffContact}秒`]);
  const leave = (px: number | undefined) => { const v = px === undefined ? null : mps(r, px); return v === null ? '—' : `${v.toFixed(2)} m/秒`; };
  rows.push(['離地の水平速度', leave(r.leave?.horizontalPx), `目安・参考 女子（平均5.50 m）${G.leave.horizontal} m/秒`]);
  rows.push(['離地の鉛直速度', leave(r.leave?.verticalPx), `目安・参考 女子（平均5.50 m）${G.leave.vertical} m/秒`]);
  rows.push(['踏切角度（参考）', r.leave ? `${r.leave.angle.toFixed(1)}°` : '—', `人ごとの最適 ${G.angleRange[0]}〜${G.angleRange[1]}°（目標にしない）`]);
  rows.push(['踏切接地：脚の角度（股関節→足首と水平）', r.posture.legAngle === null ? '—' : `${Math.round(r.posture.legAngle)}°`, `参考 女子${G.legAngle.women}°・男子${G.legAngle.men}°`]);
  const lean = (v: number | null) => v === null ? '—' : v < 0 ? `後ろへ ${Math.round(-v)}°` : `前へ ${Math.round(v)}°`;
  rows.push(['上体：1歩前の接地 → 踏切の接地', `${lean(r.posture.trunkPenult)} → ${lean(r.posture.trunk)}`, '']);
  rows.push(['踏切接地の膝', r.posture.knee === null ? '—' : `${Math.round(r.posture.knee)}°`, '']);
  return <dl className="throw-list" aria-label="助走の最後の数値">{rows.map(([name, value, ref]) =>
    <div key={name}><dt>{name}</dt><dd>{value}</dd>{ref && <small>{ref}</small>}</div>)}</dl>;
}

/** The centre of mass's forward speed over each step into the board, as bars. */
function SpeedChart({ result: r }: { result: LongJumpResult }) {
  const bars = [...r.steps].reverse().map(s => ({ label: s.before === 1 ? '最後の1歩' : `${s.before}歩前`, v: mps(r, s.speedPx) }))
    .concat([{ label: '踏切接地', v: mps(r, r.speed.touchdownPx) }]).filter((b): b is { label: string; v: number } => b.v !== null);
  if (bars.length < 2) return null;
  const W = 340, H = 170, top = 24, bottom = 30, max = Math.ceil(Math.max(...bars.map(b => b.v)) + .5), min = Math.max(0, Math.floor(Math.min(...bars.map(b => b.v)) - 1.5));
  const bw = (W - 20) / bars.length, y = (v: number) => top + (max - v) / (max - min) * (H - top - bottom);
  return <figure className="sprint10-chart"><figcaption>踏切に入る速さ<small>（重心の前に進む速さ、m/秒、目安）</small></figcaption>
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`踏切に入る速さ：${bars.map(b => `${b.label} ${b.v.toFixed(1)}`).join('、')} m/秒`}>
      {bars.map((b, i) => <g key={b.label}>
        <rect x={10 + i * bw + 6} y={y(b.v)} width={bw - 12} height={H - bottom - y(b.v)} rx={4} fill={b.label === '踏切接地' ? '#e08a00' : '#135a48'} />
        <text x={10 + i * bw + bw / 2} y={y(b.v) - 6} textAnchor="middle" className="value">{b.v.toFixed(1)}</text>
        <text x={10 + i * bw + bw / 2} y={H - 10} textAnchor="middle">{b.label}</text></g>)}
    </svg></figure>;
}
