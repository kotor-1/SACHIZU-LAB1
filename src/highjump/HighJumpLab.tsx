import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import { useFirstFrame } from '../sprint10/first-frame';
import PlayerBar from '../sprint10/PlayerBar';
import type { Phase } from '../sprint10/crouch-figure';
import type { CrouchFrame } from '../sprint10/crouch';
import { CrouchReplay, frameInterval, insideFrame, PhaseFigures, type FigureOverlay, type ReplayEvent } from '../sprint10/CrouchViews';
import { analyzeHighJump, HIGH_JUMP_VERSION, SPACING, type HighJumpResult } from './analysis';
import { HIGH_JUMP_GUIDE, highJumpAdvice } from './advice';
import { measureHighJump } from './recording';
import type { UprightPoints } from './camera';
import { LiftChart, RhythmTable } from './HighJumpCharts';
import { legLength } from '../sprint10/contacts';
import { footDown } from '../sprint10/crouch-edit';
import { contactMoments, effectsBetween, poseFlags, relatedValues, type ReviewMoment, type ReviewValue } from '../sprint10/moment-edits';
import { MomentReview } from '../sprint10/MomentReview';
import '../sprint10/sprint10.css';
import './highjump.css';
import { keepAwake } from '../cmj/keep-awake';

/** One ▲▼◀▶ tap moves the chosen point by 0.1% of the picture. */
const NUDGE = .001;
type Tab = 'advice' | 'check' | 'pose' | 'times' | 'replay';
const TABS: [Tab, string][] = [['advice', 'ポイント'], ['check', '確認'], ['pose', '姿勢'], ['times', 'リズム'], ['replay', 'スロー']];
/** The contacts before the bar, by role: the check's moments and their names. */
const ROLES = [['before', '踏切の2歩前', '2歩前'], ['penult', '踏切の1歩前', '1歩前'], ['takeoff', '踏切', '踏切']] as const;
/** The values a moment's frame changes (the check shows them before and after). */
const valuesOf = (r: HighJumpResult): ReviewValue[] => [
  { label: '上向きの速さ（離地）', value: r.lift?.speed ?? null, unit: 'm/s', digits: 2 }, { label: '空中で上がった高さ', value: r.lift ? r.lift.h2 * 100 : null, unit: 'cm', digits: 0 },
  { label: '踏切の接地時間', value: r.times.takeoffContact, unit: '秒', digits: 3 }, { label: '最後の1歩（接地→接地）', value: r.times.lastStep, unit: '秒', digits: 3 },
  { label: 'その前の1歩（接地→接地）', value: r.times.stepBefore, unit: '秒', digits: 3 }, { label: '最後の2歩のリズム', value: r.rhythm === null ? null : r.rhythm * 100, unit: '%', digits: 0 },
  { label: '1歩前の接地時間', value: r.times.penultContact, unit: '秒', digits: 3 }, { label: '踏切前の空中', value: r.times.lastFlight, unit: '秒', digits: 3 },
  { label: '2歩前の接地時間', value: r.times.beforeContact, unit: '秒', digits: 3 }, { label: '踏切接地の後傾', value: r.posture.lean, unit: '°', digits: 0 }];
type Handle = 'leftBar' | 'leftFoot' | 'rightBar' | 'rightFoot';
const HANDLES: [Handle, string, string][] = [['leftBar', '左の支柱：バー', '左バー'], ['leftFoot', '左の支柱：根元', '左根元'], ['rightBar', '右の支柱：バー', '右バー'], ['rightFoot', '右の支柱：根元', '右根元']];
interface Setting { points: Record<Handle, { x: number; y: number }>; barCm: number | null }
const START: Setting['points'] = { leftBar: { x: .2, y: .45 }, leftFoot: { x: .2, y: .75 }, rightBar: { x: .8, y: .45 }, rightFoot: { x: .8, y: .75 } };
/** A bar height that can be used (cm): while 120 is typed the box holds 12 on the way, which must not be analysed. */
const barOk = (cm: number | null): cm is number => cm !== null && cm >= 50 && cm <= 250;
const same = (a: Setting, b: Setting) => a.barCm === b.barCm && HANDLES.every(([h]) => a.points[h].x === b.points[h].x && a.points[h].y === b.points[h].y);
const clamp = (v: number) => Math.max(0, Math.min(1, v));
const uprights = (s: Setting): UprightPoints => ({ left: { foot: s.points.leftFoot, bar: s.points.leftBar }, right: { foot: s.points.rightFoot, bar: s.points.rightBar } });
const LEGEND = [['#ff5b4a', '後傾（足首→重心）'], ['#b58cff', '踏切脚の膝'], ['#ffb02e', '体幹（腰→肩）'], ['#7dff6b', '振り上げ脚の大腿']] as const;
const G = HIGH_JUMP_GUIDE;

/** High jump takeoff (scissors), filmed side-on to the takeoff: the upward speed
 * at the toe-off and the rise in the air, with the bar and both uprights as the
 * ruler; the rhythm of the last two steps; the lean at the touchdown (the user,
 * 2026-10-06: 「記録向上につながる数値がメイン指標」「上向きの速さ・上がった高さは
 * メインに欲しい」). Same method and screen as the hurdle. */
export default function HighJumpLab() {
  const video = useRef<HTMLVideoElement>(null), replay = useRef<HTMLVideoElement>(null), stage = useRef<HTMLDivElement>(null);
  const owner = useRef<AbortController | null>(null), resultCard = useRef<HTMLElement>(null);
  const [file, setFile] = useState<File | null>(null), [url, setUrl] = useState('');
  const [loaded, setLoaded] = useState(false), [busy, setBusy] = useState(false), [progress, setProgress] = useState(0);
  const still = useFirstFrame(url), ready = loaded || !!still;
  const [setting, setSetting] = useState<Setting>({ points: START, barCm: null }), [chosen, setChosen] = useState<Handle>('leftBar'), [message, setMessage] = useState('');
  const [measured, setMeasured] = useState<{ frames: CrouchFrame[]; width: number; height: number; refiner: 'webgpu' | 'wasm' | null } | null>(null);
  // The setting the result was worked out with; a changed one is applied on request (no new video pass).
  const [used, setUsed] = useState<Setting | null>(null);
  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);
  useEffect(() => () => { owner.current?.abort(); owner.current = null; }, []);
  // The judged moments the user set (frames by moment key), those confirmed, and the one being checked; everything shown
  // uses the result with them (the user, 2026-10-07: 「他のモードにも同じように自動解析と微調整モード追加しましょう」).
  const [edits, setEdits] = useState<Record<string, number>>({}), [checked, setChecked] = useState<ReadonlySet<string>>(new Set()), [moment, setMoment] = useState<string | null>(null);
  // Reset for a new analysis only: the moments are the contacts (td{n} / to{n}), the same whatever lines and heights are
  // used; 「計算し直す」 discarded every correction made.
  useEffect(() => { setEdits({}); setChecked(new Set()); setMoment(null); }, [measured]);
  const options = useMemo(() => measured && used && used.barCm ? { width: measured.width, height: measured.height, uprights: uprights(used), barHeight: used.barCm / 100 } : null, [measured, used]);
  const auto: HighJumpResult | null = useMemo(() => measured && options ? analyzeHighJump(measured.frames, options) : null, [measured, options]);
  const result: HighJumpResult | null = useMemo(() => measured && options && auto ? Object.keys(edits).length ? analyzeHighJump(measured.frames, { ...options, edits }) : auto : null, [measured, options, auto, edits]);
  // The contacts are judged on RTMPose's points where there are any (analysis.ts): the strip's bars and the flags too.
  const poseFrames = useMemo(() => measured ? measured.frames.map(f => f.refined ? { ...f, pose: f.refined } : f) : [], [measured]);
  const list: ReviewMoment[] = useMemo(() => !auto || auto.reason || !measured ? [] : poseFlags(contactMoments(auto.contacts, edits, measured.frames, measured.width, measured.height,
    ROLES.flatMap(([role, name, short]) => auto[role] === null ? [] : [{ index: auto.contacts[auto[role]!].index, name, short }])), poseFrames, measured.width), [auto, edits, measured, poseFrames]);
  const waiting = list.filter(m => m.flag && !checked.has(m.key)).length, editedCount = Object.keys(edits).length;
  const leg = useMemo(() => measured ? legLength(poseFrames.filter(f => f.pose), measured.width, measured.height) : 0, [poseFrames, measured]);
  const preview = useCallback((m: ReviewMoment, frame: number) => {
    if (!measured || !options || !result) return [];
    const at = (n: number) => valuesOf(analyzeHighJump(measured.frames, { ...options, edits: { ...edits, [m.key]: n } }));
    const now = valuesOf(result), then = frame === m.frame ? now : at(frame);
    return effectsBetween(now, then, relatedValues(now, at(m.frame + 2), at(m.frame - 2)));
  }, [measured, options, result, edits]);
  const advice = useMemo(() => result && !result.reason ? highJumpAdvice(result) : [], [result]);
  const checks = advice.filter(a => a.level === 'check').length;
  const events: ReplayEvent[] = useMemo(() => {
    if (!result || result.reason) return [];
    const names = ['踏切の2歩前', '踏切の1歩前', '踏切'], roles = [result.before, result.penult, result.takeoff];
    return roles.flatMap((i, k) => { const c = i === null ? null : result.contacts[i]; if (!c) return [];
      return [...(c.touchdown !== null ? [{ label: `${names[k]}の接地`, short: `${names[k].replace('踏切の', '')} 接地`, pts: c.touchdown }] : []),
        ...(c.toeOff !== null ? [{ label: `${names[k]}の離地`, short: `${names[k].replace('踏切の', '')} 離地`, pts: c.toeOff }] : [])]; }).sort((a, b) => a.pts - b.pts);
  }, [result]);
  const [tab, setTab] = useState<Tab>('advice'), tabs = useRef<HTMLDivElement>(null), panels = useRef<HTMLDivElement>(null);
  const seekTo = useRef<number | null>(null);
  useEffect(() => { setTab('advice'); if (result) resultCard.current?.scrollIntoView?.({ behavior: 'smooth', block: 'start' }); }, [measured]);   // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const v = replay.current;
    if (tab !== 'replay' || !v || seekTo.current === null) return;
    const t = insideFrame(seekTo.current, measured ? frameInterval(measured.frames) : 1 / 240); seekTo.current = null;
    const go = () => { v.pause(); v.currentTime = t; };
    if (v.readyState >= 1) go(); else v.addEventListener('loadedmetadata', go, { once: true });
  }, [tab, measured]);
  // The touchdown's picture: the lean, from the stance ankle to the centre of mass, against the vertical.
  const overlay: FigureOverlay = useCallback((p, ctx, to, unit) => {
    const l = result?.leanLine; if (p.key !== 'touchdown' || !l || result?.posture.lean == null) return;
    const a = to(l.ankle), m = to(l.com), length = Math.hypot(m.x - a.x, m.y - a.y);
    ctx.save(); ctx.lineCap = 'round';
    ctx.strokeStyle = '#ff5b4a'; ctx.lineWidth = unit * .7; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(m.x, m.y); ctx.stroke();
    ctx.setLineDash([unit * .8, unit * .6]); ctx.lineWidth = unit * .35; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(a.x, a.y - length); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = '#ff5b4a'; ctx.strokeStyle = '#08120f'; ctx.lineWidth = unit * .2; ctx.beginPath(); ctx.arc(m.x, m.y, unit * .7, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    const text = `後傾 ${Math.round(result.posture.lean)}°`;
    ctx.font = `700 ${unit * 1.8}px system-ui, sans-serif`; ctx.textBaseline = 'top';
    const w = ctx.measureText(text).width + unit;
    ctx.fillStyle = 'rgba(8,18,16,.75)'; ctx.fillRect(unit * .5, unit * .5, w, unit * 2.7);
    ctx.fillStyle = '#ff5b4a'; ctx.fillText(text, unit, unit * .95);
    ctx.restore();
  }, [result]);

  function changeFile(next: File | null) {
    owner.current?.abort(); owner.current = null; setBusy(false);
    setFile(next); setUrl(next ? URL.createObjectURL(next) : ''); setLoaded(false); setMeasured(null); setUsed(null); setMessage('');
  }
  const place = (h: Handle, x: number, y: number) => { if (!busy) setSetting(s => ({ ...s, points: { ...s.points, [h]: { x: clamp(x), y: clamp(y) } } })); };
  const nudge = (dx: number, dy: number) => place(chosen, setting.points[chosen].x + dx, setting.points[chosen].y + dy);
  /** Dragging a point anywhere on the picture. */
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
      const d = by[e.key]; if (d) { e.preventDefault(); place(h, setting.points[h].x + d[0], setting.points[h].y + d[1]); }
    },
  });
  async function analyze() {
    if (!file || busy || !barOk(setting.barCm)) return;
    const control = new AbortController(); owner.current = control; let awake = () => {};
    setBusy(true); setMeasured(null); setProgress(0); setMessage('');
    try {
      awake = await keepAwake();
      const data = await measureHighJump(file, control.signal, (fraction, text) => { if (control.signal.aborted) return; setProgress(fraction); setMessage(text); });
      if (control.signal.aborted) return;
      setMeasured(data); setUsed(setting); setMessage('解析が終わりました。');
    } catch (e) {
      if (!control.signal.aborted) setMessage(e instanceof Error ? e.message : String(e));
    } finally { awake(); if (owner.current === control) { owner.current = null; setBusy(false); } }
  }
  function choose(next: Tab) {
    setTab(next);
    const top = panels.current?.getBoundingClientRect().top, bar = tabs.current?.offsetHeight ?? 0;
    if (top !== undefined && top < bar) window.scrollBy({ top: top - bar });
  }
  function show(p: Phase) { seekTo.current = p.pts; choose('replay'); }
  /** A moment set (or confirmed as judged), and on to the next one not yet checked. */
  function setMomentFrame(key: string, frame: number) {
    const m = list.find(q => q.key === key); if (!m) return;
    setEdits(e => { const next = { ...e }; if (frame === m.autoFrame) delete next[key]; else next[key] = frame; return next; });
    setChecked(c => new Set(c).add(key));
    const i = list.indexOf(m), next = [...list.slice(i + 1), ...list.slice(0, i)].find(q => !checked.has(q.key));
    setMoment(next ? next.key : key);
  }
  function openCheck() { const first = list.find(q => q.flag && !checked.has(q.key)) ?? list.find(q => !checked.has(q.key)); if (first) setMoment(first.key); choose('check'); }
  function save() {
    if (!result) return;
    const blob = new Blob([JSON.stringify({ version: HIGH_JUMP_VERSION, file: file?.name, setting: used, result,
      ...(editedCount ? { edited: { frames: edits, auto } } : {}), checked: [...checked] }, null, 2)], { type: 'application/json' });
    const href = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = href; a.download = 'highjump-result.json'; a.click(); setTimeout(() => URL.revokeObjectURL(href), 1000);
  }
  const l = result?.lift ?? null, t = result?.times, pts = setting.points, cam = result?.camera ?? null;
  const setBar = (cm: number) => setSetting(s => ({ ...s, barCm: Math.max(50, Math.min(250, Math.round(cm))) }));
  return <main className="sprint10 highjump">
    <a className="sprint10-back" href={import.meta.env.BASE_URL}>← 種目を選ぶ</a>
    <header><p className="sprint10-eyebrow">EVENT / HIGH JUMP</p><h1>走高跳（はさみ跳び）の解析</h1>
      <p>踏切で得た上向きの速さと空中で上がった高さ、最後の2歩のリズム、踏切接地の後傾。</p></header>
    <p className="sprint10-note">試験機能。三脚で固定したスマホを水平に置き、踏切の動きの真横から、踏切の3歩前から踏切の後の上昇までが映るように撮影してください。左右両方の支柱の根元とバーが画面に入るようにします（支柱とバーの高さが物差しになります）。1秒240コマ（スロー）推奨・通常速度の時間軸の動画を使います。</p>
    <section className="sprint10-card"><h2>1　動画を選ぶ</h2>
      <label className="sprint10-upload"><input className="sprint10-file-input" type="file" aria-label="走高跳の動画を選ぶ" accept="video/mp4,video/quicktime,.mov,.mp4,.m4v" disabled={busy}
        onChange={e => changeFile(e.target.files?.[0] ?? null)} />
        <span className="sprint10-upload-button" aria-hidden="true"><Upload size={19} />{file ? '別の動画を選ぶ' : '動画を選ぶ'}</span></label>
      {file && <p className="sprint10-file">{file.name} · {(file.size / 1024 / 1024).toFixed(1)} MB</p>}
    </section>
    <section className="sprint10-card"><h2>2　支柱とバーに点を合わせる</h2>
      <p>左右の支柱それぞれで、上の点をバーがのっている所に、下の点を支柱の根元（地面）に合わせ、バーの高さを入れます。点はドラッグで動かし、選んだ点は下の矢印で細かく動かせます。</p>
      <div ref={stage} className="sprint10-player highjump-stage">
        <video ref={video} src={url || undefined} playsInline preload="auto" poster={still?.image}
          style={still ? { aspectRatio: `${still.width} / ${still.height}` } : undefined}
          onLoadedMetadata={() => setLoaded(true)} onLoadedData={() => setLoaded(true)}
          onError={() => { setLoaded(false); setMessage('この動画を再生できません。対応形式を確認してください。'); }} />
        {ready && <div className="highjump-marks">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            {(['left', 'right'] as const).map(side => <line key={side} x1={pts[`${side}Bar`].x * 100} y1={pts[`${side}Bar`].y * 100} x2={pts[`${side}Foot`].x * 100} y2={pts[`${side}Foot`].y * 100} vectorEffect="non-scaling-stroke" />)}
            <line className="bar" x1={pts.leftBar.x * 100} y1={pts.leftBar.y * 100} x2={pts.rightBar.x * 100} y2={pts.rightBar.y * 100} vectorEffect="non-scaling-stroke" />
          </svg>
          {HANDLES.map(([h, label, tag]) => <button key={h} type="button" aria-label={`${label}の点`} aria-pressed={chosen === h} disabled={busy}
            className={`highjump-point ${h.endsWith('Bar') ? 'bar' : 'foot'}`} style={{ left: `${pts[h].x * 100}%`, top: `${pts[h].y * 100}%` }} {...handle(h)}><span>{tag}</span></button>)}
        </div>}
      </div>
      {url && <PlayerBar video={video} url={url} disabled={busy} />}
      <div className="highjump-nudge" role="group" aria-label="選んだ点を細かく動かす">
        <div className="sprint10-seg" role="group" aria-label="動かす点">{HANDLES.map(([h, label, tag]) =>
          <button key={h} type="button" aria-pressed={chosen === h} aria-label={`${label}を選ぶ`} disabled={!ready || busy} onClick={() => setChosen(h)}>{tag}</button>)}</div>
        <div className="highjump-pad">
          <button type="button" aria-label="上へ" disabled={!ready || busy} onClick={() => nudge(0, -NUDGE)}>▲</button>
          <button type="button" aria-label="左へ" disabled={!ready || busy} onClick={() => nudge(-NUDGE, 0)}>◀</button>
          <button type="button" aria-label="右へ" disabled={!ready || busy} onClick={() => nudge(NUDGE, 0)}>▶</button>
          <button type="button" aria-label="下へ" disabled={!ready || busy} onClick={() => nudge(0, NUDGE)}>▼</button>
        </div>
      </div>
      <div className="highjump-bar-height" role="group" aria-label="バーの高さ"><span>バーの高さ</span>
        <button type="button" aria-label="1cm下げる" disabled={busy || !setting.barCm} onClick={() => setBar((setting.barCm ?? 120) - 1)}>−</button>
        <input type="number" inputMode="numeric" min={50} max={250} step={1} aria-label="バーの高さ（cm）" placeholder="例 120" disabled={busy}
          value={setting.barCm ?? ''} onChange={e => setSetting(s => ({ ...s, barCm: e.target.value === '' ? null : Number(e.target.value) || null }))} /><small>cm</small>
        <button type="button" aria-label="1cm上げる" disabled={busy} onClick={() => setBar((setting.barCm ?? 119) + 1)}>＋</button>
      </div>
    </section>
    <section className="sprint10-card"><h2>3　解析する</h2>
      <button className="sprint10-primary" disabled={!ready || busy || !barOk(setting.barCm)} onClick={() => void analyze()}>解析する</button>
      {measured && used && !same(used, setting) && barOk(setting.barCm) && !busy && <button className="sprint10-recalc" onClick={() => setUsed(setting)}>今の点とバーの高さで計算し直す</button>}
      {busy && <button onClick={() => { owner.current?.abort(); owner.current = null; setBusy(false); setMessage('解析を中止しました。'); }}>中止</button>}
      <p role="status">{message || (barOk(setting.barCm) ? '動画を選び、支柱とバーに点を合わせると解析できます。' : setting.barCm ? 'バーの高さは50〜250cmで入れてください。' : '動画を選び、支柱とバーに点を合わせ、バーの高さを入れると解析できます。')}</p>
      {busy && <progress max="1" value={progress} aria-label="解析の進み具合" />}
    </section>
    {result && used?.barCm && <section ref={resultCard} className="sprint10-card sprint10-result" aria-label="解析結果"><h2>解析結果</h2>
      {result.reason ? <p role="alert" className="sprint10-note">{result.reason}</p> : <>
        <div className="sprint10-metrics sprint10-summary">
          <div><span>上向きの速さ（離地）</span><strong>{l ? l.speed.toFixed(2) : '—'}<small>m/s</small></strong>{l && <em>±0.15</em>}</div>
          <div><span>空中で上がった高さ</span><strong>{l ? Math.round(l.h2 * 100) : '—'}<small>cm</small></strong>{l && <em>最高点 {l.peak.toFixed(2)}m</em>}</div>
          <div><span>最後の2歩（接地→接地）</span><strong>{t?.stepBefore != null && t.lastStep != null ? <>{t.stepBefore.toFixed(2)}<small>→</small>{t.lastStep.toFixed(2)}</> : '—'}<small>秒</small></strong></div>
          <div><span>踏切接地の後傾</span><strong>{result.posture.lean == null ? '—' : Math.round(result.posture.lean)}<small>°</small></strong></div></div>
        {measured && !measured.refiner && <p className="sprint10-note">高精度の骨格モデル（RTMPose）を読み込めなかったため、MediaPipeの骨格を使っています。</p>}
        {list.length > 0 && <p className="crouch-check-note"><span>{editedCount ? `手で直したコマを使っています（${editedCount}か所）。` : '接地・離地のコマは自動判定です。ずれていたら1コマ単位で直せます。'}
          {waiting > 0 && ` 要確認 ${waiting}か所。`}</span>
          {tab !== 'check' && <button type="button" onClick={openCheck}>確認する</button>}</p>}
        <div ref={tabs} className="sprint10-tabs crouch-tabs" role="tablist" aria-label="結果の表示">{TABS.map(([id, label]) =>
          <button key={id} id={`highjump-tab-${id}`} type="button" role="tab" aria-selected={tab === id} aria-controls={`highjump-panel-${id}`} onClick={() => id === 'check' ? openCheck() : choose(id)}>
            {label}{id === 'advice' && checks > 0 && <span className="sprint10-badge" aria-label={`確かめたい点 ${checks}件`}>{checks}</span>}
            {id === 'check' && waiting > 0 && <span className="sprint10-badge" aria-label={`要確認 ${waiting}か所`}>{waiting}</span>}</button>)}</div>
        <div ref={panels} className="sprint10-panels">
          <div id="highjump-panel-advice" role="tabpanel" aria-labelledby="highjump-tab-advice" hidden={tab !== 'advice'}>
            <LiftChart result={result} barHeight={used.barCm / 100} />
            {advice.length > 0 && <ul className="sprint10-advice" aria-label="見方のポイント">{advice.map(a => <li key={a.topic + a.text} className={a.level}>
              <span aria-hidden="true">{a.level === 'good' ? '✓' : a.level === 'check' ? '!' : 'i'}</span><div><strong>{a.topic}</strong>{a.text}</div></li>)}</ul>}
            <p className="sprint10-hint">参考値は研究で報告された値で、選手ごとの目標ではありません（出典は「数値の見方」）。</p>
            {result.notes.map(n => <p className="sprint10-note" key={n}>{n}</p>)}
          </div>
          <div id="highjump-panel-check" role="tabpanel" aria-labelledby="highjump-tab-check" hidden={tab !== 'check'}>
            <p className="sprint10-hint">自動判定のコマを1つずつ確かめます。ずれていたら◀▶か下のコマで合わせて「このコマに決める」、合っていれば「OK」。数値はすぐ変わります。</p>
            {tab === 'check' && measured && <MomentReview url={url} frames={measured.frames} width={measured.width} height={measured.height}
              list={list} edits={edits} checked={checked} at={moment} onAt={setMoment} onSet={setMomentFrame}
              onRevert={key => setEdits(e => { const next = { ...e }; delete next[key]; return next; })} onRevertAll={() => setEdits({})}
              onDone={() => choose('times')} preview={preview} source={() => '骨格'} doneText="すべての瞬間を確認しました。値は「ポイント」「姿勢」「リズム」に反映されています。"
              down={(m, f) => { const p = poseFrames.find(q => q.frame === f.frame); return p ? footDown(p, m, measured.width, measured.height, leg) : null; }} />}
          </div>
          <div id="highjump-panel-pose" role="tabpanel" aria-labelledby="highjump-tab-pose" hidden={tab !== 'pose'}>
            <ul className="sprint10-mark-legend" aria-label="線の色">{LEGEND.map(([color, label]) => <li key={label}><i style={{ background: color }} />{label}</li>)}</ul>
            <p className="sprint10-hint">点線は鉛直、弧が測った角度。「踏切の接地」の赤い線は足首から重心への線で、鉛直からの傾きが後傾です。画像を左右にスワイプして局面を切り替えます。</p>
            {result.moments.length ? <PhaseFigures url={url} frames={measured!.frames} phases={result.moments} onShow={show} overlay={overlay}
              guides={{ touchdown: `後傾 ${result.posture.lean == null ? '—' : `${Math.round(result.posture.lean)}°`}（参考：小6・中学生のはさみ跳び ${G.lean.scissors[0]}〜${G.lean.scissors[1]}°）`,
                least: `参考：高校の背面跳び ${G.knee.highSchool[1]}°・世界トップ男子 ${G.knee.elite[1]}°` }} /> : <p>角度を測れる局面がありませんでした。</p>}
          </div>
          <div id="highjump-panel-times" role="tabpanel" aria-labelledby="highjump-tab-times" hidden={tab !== 'times'}>
            <RhythmTable result={result} />
            <p className="sprint10-hint">—：映っていないため出せない値。「1歩」は接地から次の接地までの時間で、最後の1歩がその前より短いのがリズムアップ（タタタン）です。参考：中学生のはさみ跳び {G.stepBefore[0]}〜{G.stepBefore[1]}秒 → {G.lastStep[0]}〜{G.lastStep[1]}秒。</p>
          </div>
          <div id="highjump-panel-replay" role="tabpanel" aria-labelledby="highjump-tab-replay" hidden={tab !== 'replay'} className="sprint10-replay">
            <CrouchReplay url={url} video={replay} frames={measured!.frames} phases={result.moments} events={events} />
            <p className="sprint10-hint">判定した瞬間の前後では、測った線と角度を表示します。1/8は実際の8分の1の速さです。</p>
          </div>
        </div>
        <details className="sprint10-more"><summary>数値の見方</summary>
          <p>接地・離地のコマは「確認」で1コマ単位で直せ、直すと上向きの速さ・上がった高さ・リズム・後傾の値がすぐ変わります（保存のJSONには自動の結果も残します）。</p>
          <p>上向きの速さは、離地の直後0.1秒の重心の高さに、重力（9.81m/s²）で減速する放物線を当てはめて求めます。空中で上がった高さは速さから（速さ²÷2÷9.81）、重心の最高点は離地時の重心の高さに上がった高さを足した値です。重心は骨格の各部位の位置と体重に占める割合（de Leva 1996）から求めます。</p>
          <p>物差し：スマホの焦点距離（iPhoneの通常の画角、35mm換算27mm）と、左右の支柱の根元・バーの位置の4点、バーの高さから、カメラの高さ・向き・位置を計算します。そのうえで、踏切足が地面に着いた場所と、1歩前の足の場所を結ぶ向きを跳躍の面として、重心の高さをメートルに直します。カメラが斜めでも、選手のいる距離で高さを測れます。{cam && ` 今回：カメラの高さ ${cam.height.toFixed(2)}m・踏切から ${cam.distance == null ? '—' : cam.distance.toFixed(1)}m、最後の1歩を見る角度 ${cam.view == null ? '—' : Math.round(cam.view)}°（90°が真横）、支柱の間隔 ${cam.spacing.toFixed(2)}m。`}</p>
          <p>確かめ方：計算した支柱の間隔が規格（約4m）に近ければ、バーの高さと点の位置が合っています（{SPACING[0]}〜{SPACING[1]}mの外では注意を表示）。はるき・つばきの動画（バー120cm）では4.13・4.20mでした。精度の見込みは上向きの速さ±0.1〜0.15m/s、上がった高さ±3〜4cmです。踏切の離地の判定が0.01秒ずれると、上向きの速さは約0.1m/s、上がった高さは約3cm変わります（最高点の高さは変わりません）。フォースプレートなどの真の値との比較はしていません。</p>
          <p>接地・離地は、つま先が地面の高さまで下りた時・地面から離れた時を骨格の動きから判定しています。走高跳の4本（踏切と1歩前、8回）では、映像で見た瞬間との差は踏切の接地時間で最大0.008秒、1歩の時間で最大0.015秒でした。後傾は踏切接地の時の、踏切足の足首から重心への線と鉛直の角度です。角度は真横の画像から測った値で、斜めから撮ると実際より小さく出ます。</p>
          <p>参考値の出典：中学生のはさみ跳び（上向きの速さ・最高重心高・1歩の時間・後傾・接地時間・跳び出しの角度）は吉田・藤田（2017、体育学研究62）、小学6年の後傾は後藤ら（1997、吉田・藤田2017の引用）、7〜12歳の接地時間と1歩の時間と記録の関係はLjubičić（2024、Studia Sportiva 18）、助走のリズム・後傾と記録の到達の関係は藤田ら（2010、体育学研究55）、背面跳びの値は礒崎・小山（2013、陸上競技研究紀要9：高校・日本一流）とNicholsonら（2024、世界室内決勝の男子）。上向きの速さと記録の関係は柴田ら（2019、陸上競技研究紀要15）・杉浦ら（2021、体育学研究66）。</p>
          <p>骨格：選手を見つけて追うのはMediaPipe、接地・離地の判定、角度・重心と画像・スロー再生の骨格はRTMPose（{measured?.refiner === 'webgpu' ? 'WebGPU' : measured?.refiner === 'wasm' ? 'WebAssembly' : '今回は未使用'}）です。バーの上では骨格が乱れるため、空中の重心は離地の直後だけを使っています。</p></details>
      </>}
      <button onClick={save}>結果を保存（JSON）</button>
    </section>}
    <footer>{HIGH_JUMP_VERSION} · 動画はこの端末内で処理します。解析時間は端末の性能により変わります。</footer>
  </main>;
}
