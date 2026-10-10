import { useEffect, useMemo, useRef, useState } from 'react';
import { Camera, ImagePlus } from 'lucide-react';
import type { MobileCMJPose } from '../cmj/mobile-pose';
import { analyzeView, findingsOf, nearEdge, nearEdgeOf, nearOf, VIEW_NAMES, VIEWS, type View, type ViewResult } from './analysis';
import { findingText, MEASURE_GUIDE, nearText, READING, SHOOTING, SOURCES } from './advice';
import CameraCapture, { LEVEL } from './CameraCapture';
import { motionAllowed, Voice } from './live';
import PosturePicture, { LEVEL_COLORS } from './PosturePicture';
import { loadPostureModel, type PostureModel } from './rtm';
import { loadPhoto, phoneTilt, photoFinder, readPhoto, type Shot } from './still';
import '../sprint10/sprint10.css';
import './posture.css';

export const POSTURE_VERSION = 'posture-v2.1 (2026-10-08)';
type Tab = 'points' | View;
const LEVEL_WORDS = ['目安の範囲', 'やや', '大きめ'] as const;
const MODEL_NAMES = { l: 'RTMPose-l 384×288', m: 'RTMPose-m 384×288' } as const;
/** A photo's phone tilt worth a word (degrees): leaning sideways turns every measure by as much; looking down far bends the
 * verticals away from the middle of the picture. */
const LEAN_NOTE = 1, LOOK_NOTE = 10;
const phoneNotes = (s: Shot) => s.source !== 'photo' ? [] : [
  ...(s.roll !== null && Math.abs(s.roll) >= LEAN_NOTE ? [`撮影のとき、スマホが左右に${Math.abs(s.roll).toFixed(1)}°傾いていました（写真の記録）。測る角度もそのままずれるので、背景の縦線に合わせて「写真の傾きを直す」で直してください。`] : []),
  ...(s.pitch !== null && s.pitch >= LOOK_NOTE ? [`スマホが${s.pitch.toFixed(0)}°下を向いて撮られています（写真の記録）。腰の高さで水平に構えると正確になります。`] : []),
];

/** The posture check (src/posture/analysis.ts): the standing athlete from the front, the side and the back, from photos
 * or taken by the camera by itself once the athlete stands in the frame; the findings told with their sources. */
export default function PostureLab() {
  const [mode, setMode] = useState<'camera' | 'photo'>('camera');
  const [shots, setShots] = useState<Partial<Record<View, Shot>>>({});
  const [tilts, setTilts] = useState<Partial<Record<View, number>>>({});
  const [working, setWorking] = useState<Partial<Record<View, boolean>>>({}), [errors, setErrors] = useState<Partial<Record<View, string>>>({});
  const [status, setStatus] = useState(''), [tab, setTab] = useState<Tab>('points'), [leveling, setLeveling] = useState(false);
  // The model the keypoints come from on this device, and how it runs (shown, and saved with the results).
  const [made, setMade] = useState<Pick<PostureModel, 'size' | 'backend'> | null>(null);
  // The camera: which way, the views to take, the voice; running while `capture` is set.
  const [facing, setFacing] = useState<'user' | 'environment'>('environment'), [voiceOn, setVoiceOn] = useState(true);
  const [chosen, setChosen] = useState<View[]>([...VIEWS]), [capture, setCapture] = useState<{ views: View[]; motion: boolean } | null>(null);
  const voice = useRef(new Voice()), resultCard = useRef<HTMLElement>(null);
  const loads = useRef<{ model?: Promise<PostureModel>; finder?: Promise<MobileCMJPose> }>({});
  // One reading at a time: the model's session runs one picture after another.
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  useEffect(() => () => voice.current.close(), []);
  useEffect(() => { voice.current.on = voiceOn; }, [voiceOn]);

  const model = () => loads.current.model ??= loadPostureModel(new AbortController().signal, setStatus)
    .then(m => { setMade({ size: m.size, backend: m.backend }); return m; })
    .catch(e => { loads.current.model = undefined; throw e; }).finally(() => setStatus(''));
  const finder = () => loads.current.finder ??= photoFinder(new AbortController().signal, setStatus)
    .catch(e => { loads.current.finder = undefined; throw e; });

  const results = useMemo(() => Object.fromEntries(VIEWS.flatMap(v => {
    const s = shots[v]; return s ? [[v, analyzeView(s.points, v, s.picture.width, s.picture.height, tilts[v] ?? 0)]] : [];
  })) as Partial<Record<View, ViewResult>>, [shots, tilts]);
  const findings = useMemo(() => findingsOf(results), [results]), near = useMemo(() => nearEdgeOf(results), [results]);
  const taken = VIEWS.filter(v => results[v]);
  useEffect(() => { if (tab !== 'points' && !results[tab]) setTab('points'); }, [results, tab]);

  function keep(shot: Shot) {
    setShots(s => ({ ...s, [shot.view]: shot })); setTilts(t => ({ ...t, [shot.view]: 0 }));
    setErrors(e => ({ ...e, [shot.view]: undefined }));
  }
  function choosePhoto(view: View, file?: File) {
    if (!file) return;
    setWorking(w => ({ ...w, [view]: true })); setErrors(e => ({ ...e, [view]: undefined }));
    const run = queue.current.then(async () => {
      try {
        // The photo first, then the models one after another: a 24-megapixel photo takes the page 0.2 GB for a moment while
        // it opens and gives it back at once, while the models' spent buffers wait for the collector; opened after them it
        // came on top (0.91 GB in WebKit). A phone's Safari closes a page that takes too much.
        const picture = await loadPhoto(file), tilt = await phoneTilt(file).catch(() => null), m = await model(), f = await finder();
        const r = await readPhoto(f, m, picture, view);
        keep({ view, picture, points: r.points, source: 'photo', frames: 1, people: r.people, roll: tilt?.roll ?? null, pitch: tilt?.pitch ?? null,
          name: file.name, takenAt: new Date().toISOString() });
      } catch (e) { setErrors(x => ({ ...x, [view]: e instanceof Error ? e.message : String(e) })); }
      finally { setWorking(w => ({ ...w, [view]: false })); }
    });
    queue.current = run;
  }
  function startCamera(views: View[]) {
    if (!views.length) return;
    // On the tap: the iPhone asks for the tilt sensor and lets the page speak only now.
    voice.current.unlock();
    const asked = motionAllowed();
    // The model is made once the camera and its skeleton are running, not with them: each takes the page hundreds of MB
    // for a moment while it starts. It is ready before the first picture is taken (the athlete steps in, 3 s count).
    setTimeout(() => void model().catch(() => undefined), 3000);
    void asked.then(motion => setCapture({ views, motion }));
  }
  function cameraClosed() {
    setCapture(null);
    setTimeout(() => resultCard.current?.scrollIntoView?.({ behavior: 'smooth', block: 'start' }), 50);
  }
  function retake(view: View) {
    if (shots[view]?.source === 'camera' || mode === 'camera') { setMode('camera'); startCamera([view]); }
    else document.getElementById(`posture-photo-${view}`)?.click();
  }
  function save() {
    const data = { version: POSTURE_VERSION, savedAt: new Date().toISOString(), model: made && `${MODEL_NAMES[made.size]} (${made.backend})`, findings, nearEdge: near,
      views: Object.fromEntries(taken.map(v => [v, { source: shots[v]!.source, name: shots[v]!.name, takenAt: shots[v]!.takenAt, frames: shots[v]!.frames,
        roll: shots[v]!.roll, pitch: shots[v]!.pitch, tilt: tilts[v] ?? 0, width: shots[v]!.picture.width, height: shots[v]!.picture.height,
        facing: results[v]!.facing, measures: results[v]!.measures, warnings: results[v]!.warnings, keypoints: shots[v]!.points }])) };
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })), a = document.createElement('a');
    a.href = url; a.download = `posture-${new Date().toISOString().slice(0, 10)}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  const busy = VIEWS.some(v => working[v]), roll = VIEWS.map(v => shots[v]?.source === 'camera' ? shots[v]!.roll : null).find(r => r != null) ?? null;
  const notesOf = (v: View) => [...(results[v]?.warnings ?? []), ...(shots[v] ? phoneNotes(shots[v]!) : [])];
  // Each warning once, with the views it came from.
  const warned = [...VIEWS.reduce((m, v) => { for (const w of notesOf(v)) m.set(w, [...(m.get(w) ?? []), v]); return m; }, new Map<string, View[]>())];
  const unknownTilt = taken.some(v => shots[v]!.source === 'camera' && shots[v]!.roll === null);
  return <main className="sprint10 posture">
    <a className="sprint10-back" href={import.meta.env.BASE_URL}>← 種目を選ぶ</a>
    <header><p className="sprint10-eyebrow">BODY / POSTURE</p><h1>姿勢解析</h1>
      <p>正面・横・後ろの立ち姿勢から、左右の傾きと前後のずれを角度で見ます。写真を選ぶか、カメラの枠に立つと自動で撮影します。</p></header>
    <div className="sprint10-seg posture-mode" role="group" aria-label="撮り方">
      <button type="button" aria-pressed={mode === 'camera'} onClick={() => setMode('camera')} disabled={!!capture}><Camera size={18} aria-hidden="true" />カメラで撮る</button>
      <button type="button" aria-pressed={mode === 'photo'} onClick={() => setMode('photo')} disabled={!!capture}><ImagePlus size={18} aria-hidden="true" />写真を選ぶ</button>
    </div>
    {capture ? <CameraCapture views={capture.views} facing={facing} voice={voice.current} motion={capture.motion} model={model} onShot={keep} onEnd={cameraClosed} />
      : mode === 'camera' ? <section className="sprint10-card"><h2>カメラで撮る</h2>
        <p className="sprint10-hint">スマホを置いて離れ、枠の中に立つと、頭から足先まで入ってまっすぐ止まったところで自動で撮ります（3秒数えて「ピッ」）。正面→横→後ろの順に声で案内します。</p>
        <div className="posture-options">
          <div className="sprint10-seg" role="group" aria-label="使うカメラ">
            <button type="button" aria-pressed={facing === 'environment'} onClick={() => setFacing('environment')}>外カメラ（撮る人がいる）</button>
            <button type="button" aria-pressed={facing === 'user'} onClick={() => setFacing('user')}>内カメラ（ひとりで）</button>
          </div>
          <fieldset className="posture-views"><legend>撮る向き</legend>{VIEWS.map(v => <label key={v} className="sprint10-check">
            <input type="checkbox" checked={chosen.includes(v)} onChange={e => setChosen(c => VIEWS.filter(x => x === v ? e.target.checked : c.includes(x)))} />{VIEW_NAMES[v]}</label>)}</fieldset>
          <label className="sprint10-check"><input type="checkbox" checked={voiceOn} onChange={e => setVoiceOn(e.target.checked)} />音声で案内する</label>
        </div>
        <button className="sprint10-primary" type="button" disabled={!chosen.length} onClick={() => startCamera(chosen)}><Camera size={19} aria-hidden="true" />カメラを起動する</button>
        <Shooting />
      </section>
      : <section className="sprint10-card"><h2>写真を選ぶ</h2>
        <p className="sprint10-hint">向きごとに1枚。選んだらすぐ解析します。1枚だけでも見られます。</p>
        <div className="posture-slots">{VIEWS.map(v => <label key={v} className={`posture-slot${results[v] ? ' done' : ''}`}>
          <input id={`posture-photo-${v}`} className="sprint10-file-input" type="file" accept="image/*" aria-label={`${VIEW_NAMES[v]}の写真を選ぶ`}
            onChange={e => { choosePhoto(v, e.target.files?.[0]); e.target.value = ''; }} />
          {shots[v] ? <Thumb picture={shots[v]!.picture} /> : <span className={`posture-figure ${v}`} aria-hidden="true" />}
          <strong>{VIEW_NAMES[v]}</strong>
          <small>{working[v] ? '解析中…' : errors[v] ? '読み取れません' : results[v] ? '✓ 解析済み' : v === 'side' ? '右向き・左向きどちらでも' : '写真を選ぶ'}</small>
        </label>)}</div>
        {VIEWS.map(v => errors[v] && <p key={v} role="alert" className="sprint10-note">{VIEW_NAMES[v]}：{errors[v]}</p>)}
        <Shooting />
      </section>}
    {status && <p role="status" className="sprint10-hint">{status}</p>}
    {busy && !status && <p role="status" className="sprint10-hint">写真を解析しています…</p>}

    {taken.length > 0 && <section ref={resultCard} className="sprint10-card sprint10-result" aria-label="姿勢の結果"><h2>姿勢の結果</h2>
      <div className="sprint10-tabs" role="tablist" aria-label="結果の表示">{(['points', ...taken] as Tab[]).map(id =>
        <button key={id} id={`posture-tab-${id}`} type="button" role="tab" aria-selected={tab === id} aria-controls={`posture-panel-${id}`} onClick={() => { setTab(id); setLeveling(false); }}>
          {id === 'points' ? 'ポイント' : VIEW_NAMES[id]}{id === 'points' && findings.length > 0 && <span className="sprint10-badge" aria-label={`気づいた点 ${findings.length}件`}>{findings.length}</span>}</button>)}</div>
      <div id="posture-panel-points" role="tabpanel" aria-labelledby="posture-tab-points" hidden={tab !== 'points'}>
        <ul className="sprint10-advice" aria-label="気づいた点">
          {findings.length ? findings.map(f => { const t = findingText(f); return <li key={f.key} className="check">
            <span aria-hidden="true">!</span><div><strong>{t.title}<small className="posture-where">{f.views.map(v => VIEW_NAMES[v]).join('・')}</small></strong>{t.detail}</div></li>; })
            : <li><span aria-hidden="true">✓</span><div><strong>{near.length ? 'はっきり目安から外れた所はありませんでした' : '目安の範囲から外れた所はありませんでした'}</strong>{taken.map(v => VIEW_NAMES[v]).join('・')}の写真で見ました。</div></li>}
        </ul>
        {near.length > 0 && <div className="posture-near"><strong>目安の境目</strong>
          <p>境目との差が読み取りの誤差（±{nearOf('shoulderTilt')}°、横の頭の位置は±{nearOf('headForward')}°）より小さく、撮り直すと判定が変わることがあるため、ポイントには入れていません。</p>
          <ul>{near.map(f => <li key={f.key}>{nearText(f)}<small className="posture-where">{f.views.map(v => VIEW_NAMES[v]).join('・')}</small></li>)}</ul></div>}
        {warned.map(([w, views]) => <p key={w} className="sprint10-note">{views.map(v => VIEW_NAMES[v]).join('・')}：{w}</p>)}
        {made?.size === 'm' && <p className="sprint10-note">この端末では大きい骨格モデルを使えなかったため、軽いモデル（{MODEL_NAMES.m}）で読み取りました。値は少し粗くなります（頭の傾きで1°ほど）。</p>}
        {unknownTilt && <p className="sprint10-note">撮影のときスマホの傾きを確かめられませんでした。背景の柱や壁の縦線が傾いて見えたら、各向きの「写真の傾きを直す」で合わせてください。</p>}
        {roll !== null && <p className="sprint10-hint">撮影のときのスマホの傾き：{Math.abs(roll).toFixed(1)}°（{LEVEL}°以内で撮っています）</p>}
        <details className="sprint10-more"><summary>この結果の見方</summary><ul className="posture-reading">{READING.map(r => <li key={r}>{r}</li>)}</ul></details>
      </div>
      {taken.map(v => { const r = results[v]!, s = shots[v]!; return <div key={v} id={`posture-panel-${v}`} role="tabpanel" aria-labelledby={`posture-tab-${v}`} hidden={tab !== v}>
        <PosturePicture picture={s.picture} result={r} tilt={tilts[v] ?? 0} grid={leveling} />
        <ul className="sprint10-mark-legend posture-legend" aria-label="線の色">{([0, 1, 2] as const).map(l => <li key={l}><i style={{ background: LEVEL_COLORS[l] }} />{LEVEL_WORDS[l]}</li>)}
          <li><i style={{ background: '#ffffff' }} />{v === 'side' ? '足首を通る鉛直線' : '水平・鉛直の基準線'}</li></ul>
        <details className="sprint10-more posture-tilt" open={leveling} onToggle={e => setLeveling((e.target as HTMLDetailsElement).open)}>
          <summary>写真の傾きを直す（{(tilts[v] ?? 0).toFixed(1)}°）</summary>
          <p className="sprint10-hint">背景の柱・ドア・壁の角などの縦線が、写真の上の格子の縦線と平行になるように回します。数値はすぐ計算し直します。</p>
          <div className="posture-tilt-row">
            <button type="button" aria-label="左に0.1°回す" onClick={() => setTilts(t => ({ ...t, [v]: Math.max(-8, Math.round(((t[v] ?? 0) - .1) * 10) / 10) }))}>−</button>
            <input type="range" min={-8} max={8} step={.1} value={tilts[v] ?? 0} aria-label="写真の傾き（度）" onChange={e => setTilts(t => ({ ...t, [v]: Number(e.target.value) }))} />
            <button type="button" aria-label="右に0.1°回す" onClick={() => setTilts(t => ({ ...t, [v]: Math.min(8, Math.round(((t[v] ?? 0) + .1) * 10) / 10) }))}>＋</button>
            <button type="button" onClick={() => setTilts(t => ({ ...t, [v]: 0 }))}>0に戻す</button>
          </div>
        </details>
        {s.source === 'photo' && s.roll !== null && s.pitch !== null && <p className="sprint10-hint">撮影のときのスマホの傾き（写真の記録）：左右{Math.abs(s.roll).toFixed(1)}°・{s.pitch >= 0 ? '下' : '上'}向き{Math.abs(s.pitch).toFixed(1)}°</p>}
        {v === 'side' && r.facing && <p className="sprint10-hint">{r.facing === 'right' ? '右' : '左'}向き。カメラに近い側（{r.facing === 'right' ? '右' : '左'}半身）の点で測っています。</p>}
        <table className="sprint10-table posture-table"><thead><tr><th scope="col">項目</th><th scope="col">結果</th><th scope="col">判定</th></tr></thead>
          <tbody>{r.measures.map(m => <tr key={m.key}><th scope="row">{m.label}{m.reference && <small style={{ whiteSpace: 'nowrap' }}>（参考）</small>}</th><td>{m.text}</td>
            <td>{m.level === null ? '—' : <><span className="posture-level-tag" style={{ borderColor: LEVEL_COLORS[m.level] }}>{LEVEL_WORDS[m.level]}</span>
              {nearEdge(m.key, m.value!) && <small className="posture-edge">境目</small>}</>}</td></tr>)}</tbody></table>
        {notesOf(v).map(w => <p key={w} className="sprint10-note">{w}</p>)}
        <button type="button" onClick={() => retake(v)} disabled={!!capture || busy}>{VIEW_NAMES[v]}を{s.source === 'camera' ? '撮り直す' : '選び直す'}</button>
      </div>; })}
      <details className="sprint10-more"><summary>数値の見方</summary>
        <p>どの値も骨格の点を結んだ線の角度で、距離の物差しは使いません。目安の範囲は、理想の姿勢（Kendall）のまわりに、骨格の点のずれ（数度）と、ふつうに見られる小さな左右差の分だけ幅を持たせた、このアプリの基準です。</p>
        <dl className="posture-guides">{(Object.keys(MEASURE_GUIDE) as (keyof typeof MEASURE_GUIDE)[]).filter(k => k !== 'kneeRight').map(k =>
          <div key={k}><dt>{k === 'kneeLeft' ? '膝の内反・外反（正面・後ろ）' : labelOf(k)}</dt><dd>{MEASURE_GUIDE[k]}</dd></div>)}</dl>
        <p>正面と後ろの両方を撮ったときは、同じ傾きを2回測ることになります。ポイントでは2枚の平均を伝え、2枚で向きが逆のときは（はっきりしないため）伝えません。</p>
        <p>境目との差が読み取りの誤差（±{nearOf('shoulderTilt')}°、横の頭の位置は±{nearOf('headForward')}°）より小さい値は「境目」として、ポイントに入れず別にまとめます。同じ写真でも、ブラウザや端末の画像の読み込みの違いで、この程度は値が動くためです。</p>
        <p>骨格：人を見つけるのはMediaPipe、測る点はRTMPose-l（Halpe26、入力384×288）です。点は、写真そのままと左右反転の2通り×枠の大きさ3通りで読み取った平均です（カメラは3コマの中央値）。正面・後ろでは、耳と目を頭と肩だけの枠でもう一度読み取ります（頭の傾きが正確になります）。モデルに渡す画像は、各画素の範囲の平均で作ります（どのブラウザでも同じ値になります）。</p>
        <h3>出典</h3><ul className="posture-sources">{SOURCES.map(s => <li key={s}>{s}</li>)}</ul>
      </details>
      <button type="button" onClick={save}>結果を保存（JSON）</button>
    </section>}
    <footer>{POSTURE_VERSION}{made && ` · ${MODEL_NAMES[made.size]} / ${made.backend}`} · 写真・映像はこの端末内で処理し、送信しません。</footer>
  </main>;
}

const LABELS: Record<string, string> = { headTilt: '頭部の側方傾斜', shoulderTilt: '肩の高さの左右差', pelvisTilt: '骨盤の側方傾斜（参考）', bodyAxis: '体幹の側方傾斜',
  headForward: '頭部の前方偏位（横）', trunkLean: '体幹の前傾・後傾（横）', pelvisForward: '骨盤の前後の偏位（横）', knee: '膝関節の屈曲・過伸展（横）', bodyLean: '全身の前傾・後傾（横）' };
const labelOf = (k: string) => LABELS[k] ?? k;

function Shooting() {
  return <details className="sprint10-more"><summary>撮り方</summary><ul className="posture-reading">{SHOOTING.map(s => <li key={s}>{s}</li>)}</ul></details>;
}
/** A photo's small picture in its slot. */
function Thumb({ picture }: { picture: HTMLCanvasElement }) {
  const c = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const ctx = c.current?.getContext('2d'); if (!ctx || !c.current) return;
    const W = c.current.width, H = c.current.height, s = Math.max(W / picture.width, H / picture.height);
    ctx.drawImage(picture, (W - picture.width * s) / 2, (H - picture.height * s) / 2, picture.width * s, picture.height * s);
  }, [picture]);
  return <canvas ref={c} className="posture-thumb" width={150} height={200} aria-hidden="true" />;
}
