import { useEffect, useMemo, useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import { useFirstFrame, type FirstFrame } from '../sprint10/first-frame';
import { readFrames } from '../hurdling/recording';
import PlayerBar from '../sprint10/PlayerBar';
import { CrouchReplay, frameInterval, insideFrame, type ReplayEvent } from '../sprint10/CrouchViews';
import { analyzeCurveStart, CURVE_START_VERSION, LEAVE_CM, type CurveStartResult } from './analysis';
import { CURVE_GUIDE, curveAdvice } from './advice';
import { traceLanes } from './lanes';
import { measureCurveStart, type CurveRecording } from './recording';
import { LeanChart, PathPicture, TopView } from './CurveStartCharts';
import '../sprint10/sprint10.css';
import './curvestart.css';

/** One ▲▼◀▶ tap moves the chosen point by 0.1% of the picture. */
const NUDGE = .001;
type Tab = 'advice' | 'path' | 'lean' | 'replay';
const TABS: [Tab, string][] = [['advice', 'ポイント'], ['path', '軌跡'], ['lean', '内傾'], ['replay', 'スロー']];
type Handle = 'inner' | 'outer';
const HANDLES: [Handle, string, string][] = [['inner', '内側のライン', '内側'], ['outer', '外側のライン', '外側']];
type Points = Record<Handle, { x: number; y: number }>;
const START: Points = { inner: { x: .3, y: .6 }, outer: { x: .62, y: .6 } };
const same = (a: Points, b: Points) => HANDLES.every(([h]) => a[h].x === b[h].x && a[h].y === b[h].y);
const clamp = (v: number) => Math.max(0, Math.min(1, v));
const m1 = (v: number | null | undefined) => v == null ? '—' : v.toFixed(1), round = (v: number | null | undefined) => v == null ? '—' : String(Math.round(v));

/** The curve start (200 m, 400 m, relays) filmed from behind the blocks: did the athlete leave the blocks straight, not
 * drawn in by the curved lines, and then lean into the curve and run along it? (the user, 2026-10-06). The path is drawn
 * on the video and from above; the lane's 1.22 m is the ruler. */
export default function CurveStartLab() {
  const video = useRef<HTMLVideoElement>(null), replay = useRef<HTMLVideoElement>(null), stage = useRef<HTMLDivElement>(null);
  const owner = useRef<AbortController | null>(null), resultCard = useRef<HTMLElement>(null);
  const [file, setFile] = useState<File | null>(null), [url, setUrl] = useState('');
  const [loaded, setLoaded] = useState(false), [busy, setBusy] = useState(false), [progress, setProgress] = useState(0);
  // The first frame to set the points on: from the browser's video player, or, where it shows none (HEVC in some browsers),
  // decoded as the analysis decodes it.
  const fromPlayer = useFirstFrame(url), [decoded, setDecoded] = useState<FirstFrame | null>(null);
  useEffect(() => {
    setDecoded(null);
    if (!file || fromPlayer) return;
    let closed = false; const control = new AbortController();
    const timer = setTimeout(() => void (async () => {
      let picture: FirstFrame | null = null;
      try {
        await readFrames(file, control.signal, i => i === 0, async (_f, source, w, h) => {
          const k = Math.min(1, 1280 / w), c = document.createElement('canvas'); c.width = Math.round(w * k); c.height = Math.round(h * k);
          c.getContext('2d')!.drawImage(source, 0, 0, c.width, c.height); picture = { image: c.toDataURL('image/jpeg', .85), width: w, height: h }; c.width = 0;
        });
      } catch { picture = null; }
      if (!closed && picture) setDecoded(picture);
    })(), 4000);
    return () => { closed = true; clearTimeout(timer); control.abort(); };
  }, [file, fromPlayer]);
  const still = fromPlayer ?? decoded, ready = loaded || !!still;
  const [points, setPoints] = useState<Points>(START), [chosen, setChosen] = useState<Handle>('inner'), [message, setMessage] = useState('');
  const [measured, setMeasured] = useState<CurveRecording | null>(null), [used, setUsed] = useState<Points | null>(null);
  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);
  useEffect(() => () => { owner.current?.abort(); owner.current = null; }, []);
  // Development builds keep the last recording reachable for the browser checks (dev-validation/curve/ui.mjs).
  useEffect(() => { if (import.meta.env.DEV && measured) (window as unknown as { __curvestart?: unknown }).__curvestart = { measured, used }; }, [measured, used]);
  const result: CurveStartResult | null = useMemo(() => {
    if (!measured || !used) return null;
    const { width: w, height: h } = measured, lines = traceLanes(measured.clear.luma, [used.inner.x * w, used.inner.y * h], [used.outer.x * w, used.outer.y * h]);
    return analyzeCurveStart(measured.frames, { width: w, height: h, lines, mm35: measured.mm35 });
  }, [measured, used]);
  const advice = useMemo(() => result && !result.reason ? curveAdvice(result) : [], [result]);
  const checks = advice.filter(a => a.level === 'check').length;
  const events: ReplayEvent[] = useMemo(() => result && !result.reason ? result.steps.map(q => ({ label: `${q.i}歩目（${q.side === 'L' ? '左' : '右'}足）の足跡`, short: `${q.i}歩`, pts: q.pts })) : [], [result]);
  const [tab, setTab] = useState<Tab>('advice'), tabs = useRef<HTMLDivElement>(null), panels = useRef<HTMLDivElement>(null);
  const seekTo = useRef<number | null>(null);
  useEffect(() => { setTab('advice'); if (result) resultCard.current?.scrollIntoView?.({ behavior: 'smooth', block: 'start' }); }, [measured]);   // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const v = replay.current;
    if (tab !== 'replay' || !v || seekTo.current === null) return;
    const t = insideFrame(seekTo.current, measured ? frameInterval(measured.frames) : 1 / 60); seekTo.current = null;
    const go = () => { v.pause(); v.currentTime = t; };
    if (v.readyState >= 1) go(); else v.addEventListener('loadedmetadata', go, { once: true });
  }, [tab, measured]);

  function changeFile(next: File | null) {
    owner.current?.abort(); owner.current = null; setBusy(false);
    setFile(next); setUrl(next ? URL.createObjectURL(next) : ''); setLoaded(false); setMeasured(null); setUsed(null); setMessage('');
  }
  const place = (h: Handle, x: number, y: number) => { if (!busy) setPoints(p => ({ ...p, [h]: { x: clamp(x), y: clamp(y) } })); };
  const nudge = (dx: number, dy: number) => place(chosen, points[chosen].x + dx, points[chosen].y + dy);
  function drag(h: Handle) {
    return (event: React.PointerEvent<HTMLButtonElement>) => {
      if (busy || !event.currentTarget.hasPointerCapture(event.pointerId)) return;
      const rect = stage.current!.getBoundingClientRect();
      place(h, (event.clientX - rect.left) / rect.width, (event.clientY - rect.top) / rect.height);
    };
  }
  const handle = (h: Handle) => ({
    onPointerDown: (e: React.PointerEvent<HTMLButtonElement>) => { setChosen(h); e.currentTarget.setPointerCapture(e.pointerId); },
    onPointerMove: drag(h),
    onPointerUp: (e: React.PointerEvent<HTMLButtonElement>) => { if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId); },
    onFocus: () => setChosen(h),
    onKeyDown: (e: React.KeyboardEvent<HTMLButtonElement>) => {
      const by: Record<string, [number, number]> = { ArrowLeft: [-NUDGE, 0], ArrowRight: [NUDGE, 0], ArrowUp: [0, -NUDGE], ArrowDown: [0, NUDGE] };
      const d = by[e.key]; if (d) { e.preventDefault(); place(h, points[h].x + d[0], points[h].y + d[1]); }
    },
  });
  async function analyze() {
    if (!file || busy) return;
    const control = new AbortController(); owner.current = control;
    setBusy(true); setMeasured(null); setProgress(0); setMessage('');
    try {
      const data = await measureCurveStart(file, control.signal, (fraction, text) => { setProgress(fraction); setMessage(text); });
      if (control.signal.aborted) return;
      setMeasured(data); setUsed(points); setMessage('解析が終わりました。');
    } catch (e) {
      if (!control.signal.aborted) setMessage(e instanceof Error ? e.message : String(e));
    } finally { if (owner.current === control) { owner.current = null; setBusy(false); } }
  }
  function choose(next: Tab) {
    setTab(next);
    const top = panels.current?.getBoundingClientRect().top, bar = tabs.current?.offsetHeight ?? 0;
    if (top !== undefined && top < bar) window.scrollBy({ top: top - bar });
  }
  function save() {
    if (!result) return;
    const blob = new Blob([JSON.stringify({ version: CURVE_START_VERSION, file: file?.name, points: used, focal35: measured?.mm35, result: { ...result, lines: undefined } }, null, 2)], { type: 'application/json' });
    const href = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = href; a.download = 'curvestart-result.json'; a.click(); setTimeout(() => URL.revokeObjectURL(href), 1000);
  }
  const s = result?.straight, L = result?.tangent?.length ?? null, cam = result?.camera ?? null;
  const verdict = s?.verdict === 'early' ? '早く曲がった' : s?.verdict === 'straight' ? 'まっすぐ出られた' : null;
  return <main className="sprint10 curvestart">
    <a className="sprint10-back" href={import.meta.env.BASE_URL}>← 種目を選ぶ</a>
    <header><p className="sprint10-eyebrow">EVENT / CURVE START</p><h1>カーブスタートの解析</h1>
      <p>カーブの線に惑わされずに、ブロックからまっすぐ出られたか。その後、カーブに沿って自然に内傾して走れたか。走った軌跡を描きます。</p></header>
    <p className="sprint10-note">試験機能。200 m・400 m・リレーなど、曲走路からのスタートを、スマホを三脚に固定してブロックの真後ろ（スタートラインの3〜5 m後ろ、高さ1.3 m以上）から撮影します。選手のレーンの左右の白線が、ブロックから15 m先まで映るようにしてください（レーン幅1.22 mが物差しになります）。構えから走り出しまでを撮り、選手が遠ざかるまで撮り続けます。</p>
    <section className="sprint10-card"><h2>1　動画を選ぶ</h2>
      <label className="sprint10-upload"><input className="sprint10-file-input" type="file" aria-label="カーブスタートの動画を選ぶ" accept="video/mp4,video/quicktime,.mov,.mp4,.m4v" disabled={busy}
        onChange={e => changeFile(e.target.files?.[0] ?? null)} />
        <span className="sprint10-upload-button" aria-hidden="true"><Upload size={19} />{file ? '別の動画を選ぶ' : '動画を選ぶ'}</span></label>
      {file && <p className="sprint10-file">{file.name} · {(file.size / 1024 / 1024).toFixed(1)} MB</p>}
    </section>
    <section className="sprint10-card"><h2>2　レーンの白線に点を合わせる</h2>
      <p>選手のレーンの内側（カーブの内側）と外側の白線に、スタートラインと交わる所で点を合わせます。点はドラッグで動かし、選んだ点は下の矢印で細かく動かせます。</p>
      <div ref={stage} className="sprint10-player curvestart-stage">
        <video ref={video} src={url || undefined} playsInline preload="auto" poster={still?.image}
          style={still ? { aspectRatio: `${still.width} / ${still.height}` } : undefined}
          onLoadedMetadata={() => setLoaded(true)} onLoadedData={() => setLoaded(true)}
          onError={() => { setLoaded(false); setMessage('この動画を再生できません。対応形式を確認してください。'); }} />
        {ready && <div className="curvestart-marks">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <line x1={points.inner.x * 100} y1={points.inner.y * 100} x2={points.outer.x * 100} y2={points.outer.y * 100} vectorEffect="non-scaling-stroke" />
          </svg>
          {HANDLES.map(([h, label, tag]) => <button key={h} type="button" aria-label={`${label}の点`} aria-pressed={chosen === h} disabled={busy}
            className={`curvestart-point ${h}`} style={{ left: `${points[h].x * 100}%`, top: `${points[h].y * 100}%` }} {...handle(h)}><span>{tag}</span></button>)}
        </div>}
      </div>
      {url && <PlayerBar video={video} url={url} disabled={busy} />}
      <div className="curvestart-nudge" role="group" aria-label="選んだ点を細かく動かす">
        <div className="sprint10-seg" role="group" aria-label="動かす点">{HANDLES.map(([h, label, tag]) =>
          <button key={h} type="button" aria-pressed={chosen === h} aria-label={`${label}を選ぶ`} disabled={!ready || busy} onClick={() => setChosen(h)}>{tag}</button>)}</div>
        <div className="curvestart-pad">
          <button type="button" aria-label="上へ" disabled={!ready || busy} onClick={() => nudge(0, -NUDGE)}>▲</button>
          <button type="button" aria-label="左へ" disabled={!ready || busy} onClick={() => nudge(-NUDGE, 0)}>◀</button>
          <button type="button" aria-label="右へ" disabled={!ready || busy} onClick={() => nudge(NUDGE, 0)}>▶</button>
          <button type="button" aria-label="下へ" disabled={!ready || busy} onClick={() => nudge(0, NUDGE)}>▼</button>
        </div>
      </div>
    </section>
    <section className="sprint10-card"><h2>3　解析する</h2>
      <button className="sprint10-primary" disabled={!ready || busy} onClick={() => void analyze()}>解析する</button>
      {measured && used && !same(used, points) && !busy && <button className="sprint10-recalc" onClick={() => setUsed(points)}>今の点で計算し直す</button>}
      {busy && <button onClick={() => { owner.current?.abort(); owner.current = null; setBusy(false); setMessage('解析を中止しました。'); }}>中止</button>}
      <p role="status">{message || '動画を選び、白線に2つの点を合わせると解析できます。'}</p>
      {busy && <progress max="1" value={progress} aria-label="解析の進み具合" />}
    </section>
    {result && measured && <section ref={resultCard} className="sprint10-card sprint10-result" aria-label="解析結果"><h2>解析結果</h2>
      {result.reason ? <p role="alert" className="sprint10-note">{result.reason}</p> : <>
        <div className="sprint10-metrics sprint10-summary">
          <div><span>理想の道より内側へ</span><strong>{s!.inward === null ? '—' : Math.max(0, Math.round(s!.inward))}<small>cm</small></strong><em>{verdict ?? '—'}（接点 {m1(L)} m）</em></div>
          <div><span>出た向き</span><strong>{s!.aim === null ? '—' : Math.abs(s!.aim).toFixed(1)}<small>°</small></strong>{s!.aim !== null && s!.atTangent !== null && <em>{Math.abs(s!.aim) < CURVE_GUIDE.aim ? 'ほぼ理想の向き' : `${s!.aim > 0 ? '外' : '内'}向き（接点で${Math.round(Math.abs(s!.atTangent))}cm）`}</em>}</div>
          <div><span>接点の後のラインからの距離</span><strong>{round(result.after.median)}<small>cm</small></strong>{result.after.max !== null && <em>最大 {Math.round(result.after.max)} cm</em>}</div>
          <div><span>曲がってからの内傾</span><strong>{result.lean.curve === null ? '—' : Math.abs(result.lean.curve).toFixed(1)}<small>°</small></strong><em>まっすぐの区間 {m1(result.lean.straight)}°</em></div></div>
        {!measured.refiner && <p className="sprint10-note">高精度の骨格モデル（RTMPose）を読み込めなかったため、MediaPipeの骨格を使っています。</p>}
        <div ref={tabs} className="sprint10-tabs" role="tablist" aria-label="結果の表示">{TABS.map(([id, label]) =>
          <button key={id} id={`curvestart-tab-${id}`} type="button" role="tab" aria-selected={tab === id} aria-controls={`curvestart-panel-${id}`} onClick={() => choose(id)}>
            {label}{id === 'advice' && checks > 0 && <span className="sprint10-badge" aria-label={`確かめたい点 ${checks}件`}>{checks}</span>}</button>)}</div>
        <div ref={panels} className="sprint10-panels">
          <div id="curvestart-panel-advice" role="tabpanel" aria-labelledby="curvestart-tab-advice" hidden={tab !== 'advice'}>
            <TopView result={result} />
            {advice.length > 0 && <ul className="sprint10-advice" aria-label="見方のポイント">{advice.map(a => <li key={a.topic + a.text} className={a.level}>
              <span aria-hidden="true">{a.level === 'good' ? '✓' : a.level === 'check' ? '!' : 'i'}</span><div><strong>{a.topic}</strong>{a.text}</div></li>)}</ul>}
            {result.notes.map(n => <p className="sprint10-note" key={n}>{n}</p>)}
          </div>
          <div id="curvestart-panel-path" role="tabpanel" aria-labelledby="curvestart-tab-path" hidden={tab !== 'path'}>
            <PathPicture result={result} image={measured.clear.image} width={measured.width} height={measured.height} />
            <ul className="sprint10-mark-legend" aria-label="線の色"><li><i style={{ background: '#ffffff', outline: '1px solid #9fb8ae' }} />まっすぐの線（ブロックからの理想の進路）</li>
              <li><i style={{ background: '#ffd400' }} />体の通り道（左右の足の中点）</li><li><i style={{ background: '#ff4d4d' }} />左足</li><li><i style={{ background: '#3d7bff' }} />右足</li></ul>
            <p className="sprint10-hint">白い丸がスタート位置、白い輪が接点（まっすぐの線が内側から20 cmの線に接する所）。点線の白い線は内側から20 cmの線（規則で距離を測る線）です。</p>
          </div>
          <div id="curvestart-panel-lean" role="tabpanel" aria-labelledby="curvestart-tab-lean" hidden={tab !== 'lean'}>
            <LeanChart result={result} />
            <p className="sprint10-hint">点は1歩ごと（赤＝左足、青＝右足）、線は左右2歩の平均。まっすぐ走る間は左右の足で交互に傾き、平均は0°前後になります。曲がると両足とも内側へ傾きます。</p>
          </div>
          <div id="curvestart-panel-replay" role="tabpanel" aria-labelledby="curvestart-tab-replay" hidden={tab !== 'replay'} className="sprint10-replay">
            <CrouchReplay url={url} video={replay} frames={measured.frames} phases={[]} events={events} />
            <p className="sprint10-hint">下のボタンで各歩の足跡のコマへ移ります。1/8は実際の8分の1の速さです。</p>
          </div>
        </div>
        <details className="sprint10-more"><summary>数値の見方</summary>
          <p>まっすぐの線：スタート位置（スタートラインの上、構えた両手の間）から、内側の白線から20 cmの線（規則で距離を測る線）に接する直線です。レーンの外寄りから出るとき、内側に入らずに進むいちばん短い道は「この直線をまっすぐ走り、接点からラインに沿う」です。接点までの長さは {m1(L)} m でした。</p>
          <p>足跡と体の通り道：足跡は後ろから見て足が止まった所です。体の通り道は、各歩の接地の中ほどで骨盤の真下にあたる地面の点（足跡から、測った内傾の分だけ横へ）を結んだ線です。カーブで体を内側へ傾けると足は体より外（7°で約10 cm）に着くため、足跡だけでは体の動きを見誤ります。</p>
          <p>判定：理想の道は、接点まで理想の線をまっすぐ進み、その後は内側から20 cmの線に沿う道です。カーブの線に引き込まれて早く曲がると、接点の前後で体がこの道より内側に入ります。接点の2 m先までに{LEAVE_CM} cmより内側に入ったら「早く曲がった」とします（カメラから10 m以内で測るので精度が高い所です）。出た向きは、接点までの通り道に当てた直線と理想の線の向きの差です。図の「直線から離れた所」は、通り道が自分の直線から{LEAVE_CM} cm内側に離れた所です（接点からラインに沿って曲がると、約3 m先で離れます）。</p>
          <p>物差し：内側と外側の白線の間（レーン幅 1.22 m）を、足跡の所で直角に横切る線で測ります。カメラの位置と向きは、白線とスタートライン、スマホの焦点距離（{measured.mm35} mm{measured.mm35Read ? '、動画に記録された値' : '、動画に記録がないため標準の値'}）から計算します。{cam && `今回：カメラの高さ ${cam.height.toFixed(2)} m、スタートラインの ${cam.behind.toFixed(1)} m 後ろ。`}</p>
          <p>精度の見込み：横の位置は8 mまで±5〜10 cm、出た向きは±1°程度、曲がり始めの位置は±1〜2 m、内傾は1歩ごとに±2〜3°（2歩の平均で見ます）。焦点距離やカーブの半径の仮定を変えても、横の位置・出た向き・内傾はほとんど変わりません（4本の動画で確認）。後ろからの撮影では接地・離地の時刻は決められないため、時間は出しません。</p>
          <p>内傾：各歩の接地の中ほどで、足から骨盤への線の、走る向きに直角な面の中での鉛直からの角度です（Churchill ら 2015、Judson ら 2020 の「体の側方傾斜」と同じ考え方）。研究では、約8 m/s で直線は左+6°・右−5°、カーブは左−5°・右−12°でした（Judson ら 2020）。速さと半径から必要な内傾は tanθ＝v²÷(gR) で、7〜8.5 m/s・半径36〜45 mで約{CURVE_GUIDE.leanBand[0]}〜{CURVE_GUIDE.leanBand[1]}°です。</p>
          <p>研究：ブロックの向きや最初の数歩のまっすぐさとタイムの関係を比べた研究はありません。ブロックを斜めに置くのは最短距離を取るためと規則の解説にあり（世界陸連 TR15.1 の注記、日本のルールブック2026年度版 p.132）、指導書は最初の6〜10 mをまっすぐ走るよう教えます（南アフリカ陸連）。直線を保ちすぎるとレースの線から離れる、という指摘もあります（Judson ら 2020）。外を回る損は距離の計算で、測る線より10 cm外を200 mのカーブで回ると約0.26〜0.31 m（約0.03〜0.04秒）です。規則：曲走路で左のラインに1歩だけ触れても失格になりませんが、その種目で2回目は失格です（TR17.3.3）。</p>
          <p>骨格：選手を見つけて追うのはMediaPipe、足跡・内傾とスロー再生の骨格はRTMPose（{measured.refiner === 'webgpu' ? 'WebGPU' : measured.refiner === 'wasm' ? 'WebAssembly' : '今回は未使用'}）です。</p></details>
      </>}
      <button onClick={save}>結果を保存（JSON）</button>
    </section>}
    <footer>{CURVE_START_VERSION} · 動画はこの端末内で処理します。解析時間は端末の性能により変わります。</footer>
  </main>;
}
