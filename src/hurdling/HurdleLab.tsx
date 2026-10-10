import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import { useFirstFrame } from '../sprint10/first-frame';
import PlayerBar from '../sprint10/PlayerBar';
import type { Phase } from '../sprint10/crouch-figure';
import type { CrouchFrame } from '../sprint10/crouch';
import { CrouchReplay, frameInterval, insideFrame, PhaseFigures, type FigureOverlay, type ReplayEvent } from '../sprint10/CrouchViews';
import { analyzeHurdle, HURDLE_HEIGHTS, HURDLE_VERSION, type HurdleResult } from './analysis';
import { HURDLE_GUIDE, hurdleAdvice } from './advice';
import { measureHurdle } from './recording';
import { ComPathChart, ReferenceTable, TimeTable } from './HurdleCharts';
import { legLength } from '../sprint10/contacts';
import { footDown } from '../sprint10/crouch-edit';
import { contactMoments, effectsBetween, poseFlags, relatedValues, type ReviewMoment, type ReviewValue } from '../sprint10/moment-edits';
import { MomentReview } from '../sprint10/MomentReview';
import '../sprint10/sprint10.css';
import { keepAwake } from '../cmj/keep-awake';

/** One ◀/▶ (▲/▼) tap moves a line by 0.2% of the frame width (height). */
const NUDGE = .002;
type Tab = 'advice' | 'check' | 'pose' | 'times' | 'replay';
const TABS: [Tab, string][] = [['advice', 'ポイント'], ['check', '確認'], ['pose', '姿勢'], ['times', '時間'], ['replay', 'スロー']];
/** The contacts round the hurdle, by role: the check's moments and their names. */
const ROLES = [['approach', '踏切の1歩前', '1歩前'], ['takeoff', '踏切', '踏切'], ['landing', '着地', '着地'], ['after', '着地の次', '次']] as const;
/** The values a moment's frame changes (the check shows them before and after). */
const valuesOf = (r: HurdleResult): ReviewValue[] => [
  { label: '踏切の1歩前の接地時間', value: r.times.approachContact, unit: '秒', digits: 3 }, { label: '踏切の前の空中', value: r.times.approachFlight, unit: '秒', digits: 3 },
  { label: '踏切の接地時間', value: r.times.takeoffContact, unit: '秒', digits: 3 }, { label: '空中時間（踏切→着地）', value: r.times.clearance, unit: '秒', digits: 3 },
  { label: '着地の接地時間', value: r.times.landingContact, unit: '秒', digits: 3 }, { label: '着地の後の空中', value: r.times.afterFlight, unit: '秒', digits: 3 },
  { label: '重心最高点（ハードルの手前）', value: r.apex?.beforeM == null ? null : r.apex.beforeM * 100, unit: 'cm', digits: 0 }];
/** The hurdle as set on the video: its line across, its top and foot down the picture (0-1), its height (m). */
interface HurdleSetting { x: number; barY: number; groundY: number; height: number | null }
const same = (a: HurdleSetting, b: HurdleSetting) => a.x === b.x && a.barY === b.barY && a.groundY === b.groundY && a.height === b.height;
const clamp = (v: number) => Math.max(.01, Math.min(.99, v));
const LEGEND = [['#ffb02e', '体幹（腰→肩）'], ['#3ad7ff', '脛'], ['#7dff6b', 'リード脚の大腿'], ['#ff6fd8', 'リード脚の膝'], ['#b58cff', '踏切脚の膝']] as const;
const G = HURDLE_GUIDE;

/** Hurdle clearance, one hurdle filmed from the side: the contacts around it,
 * the time over it, the angles at each moment and where the centre of mass
 * peaks against the hurdle (the user, 2026-10-05: 「ハードルのどのくらい手前で
 * 重心が最高点になったかが重要」). Same method and screen as the crouch start. */
export default function HurdleLab() {
  const video = useRef<HTMLVideoElement>(null), replay = useRef<HTMLVideoElement>(null);
  const owner = useRef<AbortController | null>(null), resultCard = useRef<HTMLElement>(null);
  const [file, setFile] = useState<File | null>(null), [url, setUrl] = useState('');
  const [loaded, setLoaded] = useState(false), [busy, setBusy] = useState(false), [progress, setProgress] = useState(0);
  const still = useFirstFrame(url), ready = loaded || !!still;
  // The hurdle's line, its top and foot (horizontal lines dragged like the line:
  // the user, 2026-10-05, 「タップだけではズレるので…ドラッグで移動して設定」) and its height.
  const [setting, setSetting] = useState<HurdleSetting>({ x: .5, barY: .5, groundY: .72, height: null }), [message, setMessage] = useState('');
  const line = setting.x;
  const [measured, setMeasured] = useState<{ frames: CrouchFrame[]; width: number; height: number; refiner: 'webgpu' | 'wasm' | null } | null>(null);
  // The setting the result was worked out with; a changed one is applied on request (no new video pass).
  const [used, setUsed] = useState<HurdleSetting | null>(null);
  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);
  useEffect(() => () => { owner.current?.abort(); owner.current = null; }, []);
  // The judged moments the user set (frames by moment key), those confirmed, and the one being checked; everything shown
  // uses the result with them (the user, 2026-10-07: 「他のモードにも同じように自動解析と微調整モード追加しましょう」).
  const [edits, setEdits] = useState<Record<string, number>>({}), [checked, setChecked] = useState<ReadonlySet<string>>(new Set()), [moment, setMoment] = useState<string | null>(null);
  // Reset for a new analysis only: the moments are the contacts (td{n} / to{n}), the same whatever lines and heights are
  // used; 「計算し直す」 discarded every correction made.
  useEffect(() => { setEdits({}); setChecked(new Set()); setMoment(null); }, [measured]);
  const options = useMemo(() => measured && used ? { width: measured.width, height: measured.height,
    hurdleX: used.x, barY: used.barY, groundY: used.groundY, hurdleHeight: used.height ?? undefined } : null, [measured, used]);
  const auto: HurdleResult | null = useMemo(() => measured && options ? analyzeHurdle(measured.frames, options) : null, [measured, options]);
  const result: HurdleResult | null = useMemo(() => measured && options && auto ? Object.keys(edits).length ? analyzeHurdle(measured.frames, { ...options, edits }) : auto : null, [measured, options, auto, edits]);
  // The contacts are judged on RTMPose's points where there are any (analysis.ts): the strip's bars and the flags too.
  const poseFrames = useMemo(() => measured ? measured.frames.map(f => f.refined ? { ...f, pose: f.refined } : f) : [], [measured]);
  const list: ReviewMoment[] = useMemo(() => !auto || auto.reason || !measured ? [] : poseFlags(contactMoments(auto.contacts, edits, measured.frames, measured.width, measured.height,
    ROLES.flatMap(([role, name, short]) => auto[role] === null ? [] : [{ index: auto.contacts[auto[role]!].index, name, short }])), poseFrames, measured.width), [auto, edits, measured, poseFrames]);
  const waiting = list.filter(m => m.flag && !checked.has(m.key)).length, editedCount = Object.keys(edits).length;
  const leg = useMemo(() => measured ? legLength(poseFrames.filter(f => f.pose), measured.width, measured.height) : 0, [poseFrames, measured]);
  const preview = useCallback((m: ReviewMoment, frame: number) => {
    if (!measured || !options || !result) return [];
    const at = (n: number) => valuesOf(analyzeHurdle(measured.frames, { ...options, edits: { ...edits, [m.key]: n } }));
    const now = valuesOf(result), then = frame === m.frame ? now : at(frame);
    // The values that depend on the moment: those a frame on (or back) changes.
    return effectsBetween(now, then, relatedValues(now, at(m.frame + 2), at(m.frame - 2)));
  }, [measured, options, result, edits]);
  const advice = useMemo(() => result && !result.reason ? hurdleAdvice(result) : [], [result]);
  const checks = advice.filter(a => a.level === 'check').length;
  const events: ReplayEvent[] = useMemo(() => {
    if (!result || result.reason) return [];
    const names = ['踏切の1歩前', '踏切', '着地', '着地の次'], roles = [result.approach, result.takeoff, result.landing, result.after];
    const out: ReplayEvent[] = roles.flatMap((i, k) => { const c = i === null ? null : result.contacts[i]; if (!c) return [];
      return [...(c.touchdown !== null ? [{ label: `${names[k]}の接地`, short: `${names[k]} 接地`, pts: c.touchdown }] : []),
        ...(c.toeOff !== null ? [{ label: `${names[k]}の離地`, short: `${names[k]} 離地`, pts: c.toeOff }] : [])]; });
    if (result.apex) out.push({ label: '重心最高点', short: '重心最高点', pts: result.apex.pts });
    if (result.crossing) out.push({ label: 'ハードル上', short: 'ハードル上', pts: result.crossing.pts });
    return out.sort((a, b) => a.pts - b.pts);
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
  // The peak's picture: the centre of mass through the flight, its peak and the hurdle.
  const overlay: FigureOverlay = useCallback((p, ctx, to, unit) => {
    const a = result?.apex; if (p.key !== 'apex' || !a || !result) return;
    ctx.save();
    const top = to({ x: result.hurdleX, y: 0 }), bottom = to({ x: result.hurdleX, y: 1 });
    ctx.strokeStyle = '#ff5b4a'; ctx.lineWidth = unit * .35; ctx.setLineDash([unit, unit * .7]);
    ctx.beginPath(); ctx.moveTo(top.x, top.y); ctx.lineTo(bottom.x, bottom.y); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(255,255,255,.9)';
    for (const q of a.path) { const c = to(q); ctx.beginPath(); ctx.arc(c.x, c.y, unit * .22, 0, Math.PI * 2); ctx.fill(); }
    const peak = to(a); ctx.fillStyle = '#ffb02e'; ctx.strokeStyle = '#08120f'; ctx.lineWidth = unit * .2;
    ctx.beginPath(); ctx.arc(peak.x, peak.y, unit * .7, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    if (a.beforeM !== null) {
      const text = a.beforeM >= 0 ? `最高点：ハードルの${Math.round(a.beforeM * 100)}cm手前` : `最高点：ハードルの${Math.round(-a.beforeM * 100)}cm先`;
      ctx.font = `700 ${unit * 1.7}px system-ui, sans-serif`; ctx.textBaseline = 'top';
      const w = ctx.measureText(text).width + unit;
      ctx.fillStyle = 'rgba(8,18,16,.75)'; ctx.fillRect(unit * .5, unit * .5, w, unit * 2.6);
      ctx.fillStyle = '#ffb02e'; ctx.fillText(text, unit, unit * .9);
    }
    ctx.restore();
  }, [result]);

  function changeFile(next: File | null) {
    owner.current?.abort(); owner.current = null; setBusy(false);
    setFile(next); setUrl(next ? URL.createObjectURL(next) : ''); setLoaded(false); setMeasured(null); setUsed(null); setMessage('');
  }
  const set = (key: 'x' | 'barY' | 'groundY', v: number) => { if (!busy) setSetting(s => ({ ...s, [key]: clamp(v) })); };
  const move = (x: number) => set('x', x);
  /** Dragging a line: across for the hurdle's, up and down for its top and foot. */
  function drag(key: 'x' | 'barY' | 'groundY') {
    return (event: React.PointerEvent<HTMLButtonElement>) => {
      if (busy || !event.currentTarget.hasPointerCapture(event.pointerId)) return;
      const rect = event.currentTarget.parentElement!.getBoundingClientRect();
      set(key, key === 'x' ? (event.clientX - rect.left) / rect.width : (event.clientY - rect.top) / rect.height);
    };
  }
  const handle = (key: 'x' | 'barY' | 'groundY') => ({
    onPointerDown: (e: React.PointerEvent<HTMLButtonElement>) => { e.currentTarget.setPointerCapture(e.pointerId); drag(key)(e); },
    onPointerMove: drag(key),
    onPointerUp: (e: React.PointerEvent<HTMLButtonElement>) => { if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId); },
    onKeyDown: (e: React.KeyboardEvent<HTMLButtonElement>) => {
      const by: Record<string, number> = key === 'x' ? { ArrowLeft: -NUDGE, ArrowRight: NUDGE } : { ArrowUp: -NUDGE, ArrowDown: NUDGE };
      const d = by[e.key]; if (d) { e.preventDefault(); set(key, setting[key] + d); }
    },
  });
  async function analyze() {
    if (!file || busy) return;
    const control = new AbortController(); owner.current = control; let awake = () => {};
    setBusy(true); setMeasured(null); setProgress(0); setMessage('');
    try {
      awake = await keepAwake();
      const data = await measureHurdle(file, control.signal, (fraction, text) => { if (control.signal.aborted) return; setProgress(fraction); setMessage(text); });
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
    const blob = new Blob([JSON.stringify({ version: HURDLE_VERSION, file: file?.name, setting: used, result,
      ...(editedCount ? { edited: { frames: edits, auto } } : {}), checked: [...checked] }, null, 2)], { type: 'application/json' });
    const href = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = href; a.download = 'hurdle-result.json'; a.click(); setTimeout(() => URL.revokeObjectURL(href), 1000);
  }
  const apex = result?.apex ?? null, t = result?.times;
  // The peak: about how far before the hurdle (±5 cm), and how long before the centre of mass is over it (no scale needed).
  const peakText = apex?.beforeM != null ? [`約${Math.round(Math.abs(apex.beforeM) * 100)}`, apex.beforeM >= 0 ? 'cm手前' : 'cm先']
    : apex?.beforeSeconds != null ? [`${Math.abs(apex.beforeSeconds).toFixed(3)}`, apex.beforeSeconds >= 0 ? '秒前' : '秒後'] : ['—', ''];
  const peakNote = apex?.beforeM != null ? `±5cm${apex.beforeSeconds !== null ? `・ハードル上の${Math.abs(apex.beforeSeconds).toFixed(3)}秒${apex.beforeSeconds >= 0 ? '前' : '後'}` : ''}` : apex?.beforeSeconds != null ? 'ハードル上を通る時から' : '';
  const ratio = result?.ratio ?? null;
  return <main className="sprint10">
    <a className="sprint10-back" href={import.meta.env.BASE_URL}>← 種目を選ぶ</a>
    <header><p className="sprint10-eyebrow">EVENT / HURDLES</p><h1>ハードルの解析</h1>
      <p>踏切から着地まで：重心が最高点になる位置、接地と空中の時間、各局面の姿勢の角度。</p></header>
    <p className="sprint10-note">試験機能。三脚で固定したカメラで真横から、ハードル1台と、その手前1〜2歩から着地の後1〜2歩までが映るように撮影してください。カメラはバーくらいの高さで水平に（下に向けない）、走路に直角に向け、ハードルを画面の中央にします。1秒120コマ以上（240推奨）・通常速度の時間軸の動画を使います。</p>
    <section className="sprint10-card"><h2>1　動画を選ぶ</h2>
      <label className="sprint10-upload"><input className="sprint10-file-input" type="file" aria-label="ハードルの動画を選ぶ" accept="video/mp4,video/quicktime,.mov,.mp4,.m4v" disabled={busy}
        onChange={e => changeFile(e.target.files?.[0] ?? null)} />
        <span className="sprint10-upload-button" aria-hidden="true"><Upload size={19} />{file ? '別の動画を選ぶ' : '動画を選ぶ'}</span></label>
      {file && <p className="sprint10-file">{file.name} · {(file.size / 1024 / 1024).toFixed(1)} MB</p>}
    </section>
    <section className="sprint10-card"><h2>2　ハードルに線を合わせる</h2>
      <p>縦の線をハードルの位置に、上の横線をバーの上端に、下の横線をハードルの足元（地面）に合わせ、ハードルの高さを選びます。斜めに見えるハードルは、選手が越える真ん中の所で合わせてください。ハードルの高さを物差しにして、距離と高さをcmで出します。</p>
      <div className="sprint10-player">
        <video ref={video} src={url || undefined} playsInline preload="auto" poster={still?.image}
          style={still ? { aspectRatio: `${still.width} / ${still.height}` } : undefined}
          onLoadedMetadata={() => setLoaded(true)} onLoadedData={() => setLoaded(true)}
          onError={() => { setLoaded(false); setMessage('この動画を再生できません。対応形式を確認してください。'); }} />
        {ready && <div className="sprint10-gates">
          {([['barY', 'バーの上端の線', 'BAR', 'bar'], ['groundY', '足元の線', 'GROUND', 'ground']] as const).map(([key, label, tag, cls]) =>
            <button key={key} type="button" role="slider" aria-orientation="vertical" aria-label={label} aria-valuemin={1} aria-valuemax={99} aria-valuenow={Math.round(setting[key] * 100)}
              className={`sprint10-hline ${cls}`} style={{ top: `${setting[key] * 100}%` }} disabled={busy} {...handle(key)}><span>{tag}</span></button>)}
          <button type="button" role="slider" aria-label="ハードルの線" aria-valuemin={1} aria-valuemax={99} aria-valuenow={Math.round(line * 100)}
            className={`sprint10-gate hurdle${line < .1 ? ' at-left' : line > .9 ? ' at-right' : ''}`}
            style={{ left: `${line * 100}%` }} disabled={busy} {...handle('x')}><span>HURDLE</span></button></div>}
      </div>
      {url && <PlayerBar video={video} url={url} disabled={busy} />}
      <div className="sprint10-gate-controls">
        <div className="sprint10-gate-row hurdle">
          <span>ハードル</span>
          <button type="button" aria-label="線を左へ" disabled={!ready || busy} onClick={() => move(line - NUDGE)}>◀</button>
          <input type="range" aria-label="ハードルの線の位置" min="1" max="99" step=".1" value={line * 100} disabled={!ready || busy}
            onChange={e => move(Number(e.target.value) / 100)} />
          <button type="button" aria-label="線を右へ" disabled={!ready || busy} onClick={() => move(line + NUDGE)}>▶</button>
        </div>
        {([['barY', 'バー上端', 'bar'], ['groundY', '足元', 'ground']] as const).map(([key, label, cls]) => <div key={key} className={`sprint10-gate-row ${cls}`}>
          <span>{label}</span>
          <button type="button" aria-label={`${label}の線を上へ`} disabled={!ready || busy} onClick={() => set(key, setting[key] - NUDGE)}>▲</button>
          <input type="range" aria-label={`${label}の線の高さ`} min="1" max="99" step=".1" value={setting[key] * 100} disabled={!ready || busy}
            onChange={e => set(key, Number(e.target.value) / 100)} />
          <button type="button" aria-label={`${label}の線を下へ`} disabled={!ready || busy} onClick={() => set(key, setting[key] + NUDGE)}>▼</button>
        </div>)}
      </div>
      <div className="hurdle-heights" role="group" aria-label="ハードルの高さ"><span>ハードルの高さ</span>
        {HURDLE_HEIGHTS.map(h => <button key={h} type="button" aria-pressed={setting.height === h} disabled={busy}
          onClick={() => setSetting(s => ({ ...s, height: h }))}>{(h * 100).toFixed(h * 100 % 1 ? 1 : 0)}<small>cm</small></button>)}</div>
    </section>
    <section className="sprint10-card"><h2>3　解析する</h2>
      <button className="sprint10-primary" disabled={!ready || busy || setting.height === null} onClick={() => void analyze()}>解析する</button>
      {measured && used && !same(used, setting) && !busy && <button className="sprint10-recalc" onClick={() => setUsed(setting)}>今の線と高さで計算し直す</button>}
      {busy && <button onClick={() => { owner.current?.abort(); owner.current = null; setBusy(false); setMessage('解析を中止しました。'); }}>中止</button>}
      <p role="status">{message || (setting.height === null ? '動画を選び、ハードルに線を合わせ、ハードルの高さを選ぶと解析できます。' : '動画を選び、ハードルに線を合わせると解析できます。')}</p>
      {busy && <progress max="1" value={progress} aria-label="解析の進み具合" />}
    </section>
    {result && <section ref={resultCard} className="sprint10-card sprint10-result" aria-label="解析結果"><h2>解析結果</h2>
      {result.reason ? <p role="alert" className="sprint10-note">{result.reason}</p> : <>
        <div className="sprint10-metrics sprint10-summary">
          <div><span>重心最高点の位置</span><strong>{peakText[0]}<small>{peakText[1]}</small></strong>{peakNote && <em>{peakNote}</em>}</div>
          <div><span>空中時間（踏切→着地）</span><strong>{t?.clearance == null ? '—' : t.clearance.toFixed(3)}<small>秒</small></strong></div>
          <div><span>踏切の接地時間</span><strong>{t?.takeoffContact == null ? '—' : t.takeoffContact.toFixed(3)}<small>秒</small></strong></div>
          <div><span>踏切：着地（距離の割合）</span><strong>{ratio === null ? '—' : `${Math.round(ratio * 100)}:${100 - Math.round(ratio * 100)}`}</strong></div></div>
        {list.length > 0 && <p className="crouch-check-note"><span>{editedCount ? `手で直したコマを使っています（${editedCount}か所）。` : '接地・離地のコマは自動判定です。ずれていたら1コマ単位で直せます。'}
          {waiting > 0 && ` 要確認 ${waiting}か所。`}</span>
          {tab !== 'check' && <button type="button" onClick={openCheck}>確認する</button>}</p>}
        {measured && !measured.refiner && <p className="sprint10-note">高精度の骨格モデル（RTMPose）を読み込めなかったため、接地・離地の判定、角度・重心と骨格の表示はMediaPipeの骨格を使っています。</p>}
        <div ref={tabs} className="sprint10-tabs crouch-tabs" role="tablist" aria-label="結果の表示">{TABS.map(([id, label]) =>
          <button key={id} id={`hurdle-tab-${id}`} type="button" role="tab" aria-selected={tab === id} aria-controls={`hurdle-panel-${id}`} onClick={() => id === 'check' ? openCheck() : choose(id)}>
            {label}{id === 'advice' && checks > 0 && <span className="sprint10-badge" aria-label={`確かめたい点 ${checks}件`}>{checks}</span>}
            {id === 'check' && waiting > 0 && <span className="sprint10-badge" aria-label={`要確認 ${waiting}か所`}>{waiting}</span>}</button>)}</div>
        <div ref={panels} className="sprint10-panels">
          <div id="hurdle-panel-advice" role="tabpanel" aria-labelledby="hurdle-tab-advice" hidden={tab !== 'advice'}>
            {measured && <ComPathChart result={result} width={measured.width} height={measured.height} />}
            {advice.length > 0 && <ul className="sprint10-advice" aria-label="見方のポイント">{advice.map(a => <li key={a.topic + a.text} className={a.level}>
              <span aria-hidden="true">{a.level === 'good' ? '✓' : a.level === 'check' ? '!' : 'i'}</span><div><strong>{a.topic}</strong>{a.text}</div></li>)}</ul>}
            <p className="sprint10-hint">参考値は研究で報告されたトップ選手の値で、選手ごとの目標ではありません（出典は「数値の見方」）。</p>
            {result.notes.map(n => <p className="sprint10-note" key={n}>{n}</p>)}
          </div>
          <div id="hurdle-panel-check" role="tabpanel" aria-labelledby="hurdle-tab-check" hidden={tab !== 'check'}>
            <p className="sprint10-hint">自動判定のコマを1つずつ確かめます。ずれていたら◀▶か下のコマで合わせて「このコマに決める」、合っていれば「OK」。数値はすぐ変わります。</p>
            {tab === 'check' && measured && <MomentReview url={url} frames={measured.frames} width={measured.width} height={measured.height}
              list={list} edits={edits} checked={checked} at={moment} onAt={setMoment} onSet={setMomentFrame}
              onRevert={key => setEdits(e => { const next = { ...e }; delete next[key]; return next; })} onRevertAll={() => setEdits({})}
              onDone={() => choose('times')} preview={preview} source={() => '骨格'} doneText="すべての瞬間を確認しました。値は「ポイント」「姿勢」「時間」に反映されています。"
              down={(m, f) => { const p = poseFrames.find(q => q.frame === f.frame); return p ? footDown(p, m, measured.width, measured.height, leg) : null; }} />}
          </div>
          <div id="hurdle-panel-pose" role="tabpanel" aria-labelledby="hurdle-tab-pose" hidden={tab !== 'pose'}>
            <ul className="sprint10-mark-legend" aria-label="線の色">{LEGEND.map(([color, label]) => <li key={label}><i style={{ background: color }} />{label}</li>)}</ul>
            <p className="sprint10-hint">点線は鉛直、弧が測った角度。「重心最高点」の画像の白い点は各コマの重心、赤い点線はハードルの線です。画像を左右にスワイプして局面を切り替えます。</p>
            {result.moments.length ? <PhaseFigures url={url} frames={measured!.frames} phases={result.moments} onShow={show} overlay={overlay}
              guides={{ landing: `参考：トップ選手の着地の膝 男子 ${G.landingKnee.men}°・女子 ${G.landingKnee.women}° 前後` }} /> : <p>角度を測れる局面がありませんでした。</p>}
          </div>
          <div id="hurdle-panel-times" role="tabpanel" aria-labelledby="hurdle-tab-times" hidden={tab !== 'times'}>
            <TimeTable result={result} />
            <p className="sprint10-hint">—：映っていないため出せない値。「その後の空中」は離地から次の接地までです。踏切：着地の距離の割合は{ratio === null ? '—' : ` ${Math.round(ratio * 100)}:${100 - Math.round(ratio * 100)}`}（縮尺によらない値で、オプトジャンプとの比較でも一致しました）。</p>
            <h3>参考記録</h3>
            <ReferenceTable result={result} />
          </div>
          <div id="hurdle-panel-replay" role="tabpanel" aria-labelledby="hurdle-tab-replay" hidden={tab !== 'replay'} className="sprint10-replay">
            <CrouchReplay url={url} video={replay} frames={measured!.frames} phases={result.moments} events={events} />
            <p className="sprint10-hint">判定した瞬間の前後では、測った線と角度を表示します。1/8は実際の8分の1の速さです。</p>
          </div>
        </div>
        <details className="sprint10-more"><summary>数値の見方</summary>
          <p>接地・離地のコマは「確認」で1コマ単位で直せ、直すと時間・重心最高点・姿勢の値がすぐ変わります（保存のJSONには自動の結果も残します）。</p>
          <p>接地・離地は、つま先が床の高さまで下りた時・床から離れた時を骨格の動きから判定しています。真横から1秒240コマで撮った5人の踏切・着地（10回）では、映像で見た瞬間との差は接地で最大0.015秒、離地で最大0.010秒、接地時間で最大0.008秒、空中時間で最大0.010秒でした（ChromeとSafari系のブラウザで同じ）。</p>
          <p>重心は、骨格の各部位の位置と体重に占める割合（de Leva 1996）から求めています。空中の重心は放物線を描くため、踏切の離地から着地までの重心の高さに放物線を当てはめて最高点を決めます。最高点の位置は、計算に使うコマの範囲を変えても5人で±3cm以内でした。抜き脚が体の横に開く場面などで骨格が崩れたコマは除いています。</p>
          <p>オプトジャンプとの比較（4人、3台目）：空中時間・接地時間は0.01秒前後で一致し、踏切：着地の割合は3人で一致しました。踏切距離は7〜11cm長く出ました（カメラが少し下を向いていてハードルが2〜4%低く写り、横の距離が4〜5%長くなったため）。そのため、踏切距離・着地距離とバーの上の高さは参考記録としています。重心最高点の位置は距離が短く、このずれは1〜3cmです。</p>
          <p>距離と高さの縮尺は、選んだハードルの高さと、バーの上端・足元の線の間の画素数から求めます。踏切距離は踏切のつま先から、着地距離は着地のつま先までの、ハードルの線からの水平距離です。「バーの上」は、バーの上端から重心までの高さです（体の一番低い所とバーの隙間ではありません）。5人の動画では、上端の線を3画素ずらすと、踏切距離が約4cm、バーの上の高さが約2cm変わりました。重心の放物線の曲がり方（重力加速度 9.81m/s²）からも縮尺を求め、ハードルからの縮尺と12%を超えて違うときは、高さの選択や線の位置を確かめるよう表示します（5人では −0.3〜+8%）。</p>
          <p>角度は鉛直を0°とし、進行方向へ倒れる向きを正とします（体幹は腰から肩、脛は足首から膝、リード脚の大腿は腰から膝を真下から測った角度）。膝は伸び切った状態が180°です。抜き脚は体の横に開いて回るため、真横の動画では角度を出しません。</p>
          <p>参考値の出典：重心最高点の位置はMcDonald・Dapena（1991：男子0.03m・女子0.30m手前）、森田ら（1994：フォスター選手0.22m手前）、谷川ら（2009：劉翔0.05m・ペイン0.02m・内藤0.11m手前）、谷川ら（2010：ペリー0.40m・フェリシエン0.12m・石野0.16m手前）。空中時間はHanleyら（2021、世界選手権決勝の選手：男子0.33±0.02秒・女子0.28±0.02秒）。着地の膝と体幹はBissasら（2022、同じ選手：膝 男子166±10°・女子156±9°、体幹の前傾 男子29±6°・女子31±6°）。踏切・着地距離とバーの上の重心の高さはHanleyら（2021：踏切 男子2.24m・女子2.09m、着地 男子1.56m・女子1.40m、重心最高点 男子1.33m・女子1.13m）とMcDonald・Dapena（1991：重心最高点 男子1.347m・女子1.193m）から（バーの上の高さは、重心最高点からハードルの高さを引いた値）。トップ選手の値は一般のハードル（男子106.7cm・女子83.8cm）でのもので、ハードルの高さ・走る速さが違えば変わります。</p>
          <p>骨格：選手を見つけて追うのはMediaPipe、接地・離地の判定、角度・重心と画像・スロー再生の骨格はRTMPose（{measured?.refiner === 'webgpu' ? 'WebGPU' : measured?.refiner === 'wasm' ? 'WebAssembly' : '今回は未使用'}）です。ハードルの動画では、RTMPoseのつま先の方が接地・離地の時刻がブラウザによらず安定していました（MediaPipeはSafari系で接地時間の差が最大0.031秒）。</p></details>
      </>}
      <button onClick={save}>結果を保存（JSON）</button>
    </section>}
    <footer>{HURDLE_VERSION} · 動画はこの端末内で処理します。解析時間は端末の性能により変わります。</footer>
  </main>;
}
