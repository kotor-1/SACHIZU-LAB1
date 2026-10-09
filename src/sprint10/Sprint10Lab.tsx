import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import { analyzeSprint, continuityLimit, SPRINT10_ANALYSIS_VERSION, SPRINT10_NOTES, type SprintResult, type SprintSample } from './analysis';
import type { CrouchFrame } from './crouch';
import { gateMoments, gateShifts, legPixels, pelvisAt, type GateKey } from './gate-check';
import { effectsBetween, relatedValues, type ReviewMoment, type ReviewValue } from './moment-edits';
import { MomentReview } from './MomentReview';
import { measureSprint } from './recording';
import { useFirstFrame } from './first-frame';
import PlayerBar from './PlayerBar';
import type { SprintStart } from './tracker';
import StrideResults from './StrideResults';
import CrouchLab from './CrouchLab';
import './sprint10.css';

type Gate = 'start' | 'finish';
/** A flying section is entered and left at speed: its gates are the entry and the exit. */
const GATE_LABELS: Record<SprintStart, Record<Gate, string>> = {
  standing: { start: 'スタート', finish: 'ゴール' }, flying: { start: '入口', finish: '出口' },
};
/** Standing 10 m from the start line, or a known section the athlete runs through at speed. */
const MODES: { id: SprintStart | 'crouch'; label: string; hint: string }[] = [
  { id: 'standing', label: 'スタート10m', hint: 'スタートラインから10m。選手は走り出す前から映っている。' },
  { id: 'flying', label: '最高速度区間', hint: '例：50〜60m。選手は走った状態で画面に入ってくる。' },
  { id: 'crouch', label: 'クラウチングスタート', hint: 'ブロックから5歩目まで。各歩の接地・滞空・ピッチと姿勢。' },
];
/** A mode's name, allowed to break only after クラウチング when a phone's narrow button wraps it. */
const wrapped = (label: string) => label.split(/(?<=クラウチング)/).flatMap((part, i) => i ? [<wbr key={i} />, part] : [part]);
const DEFAULT_GATES: Record<SprintStart, [number, number]> = { standing: [.12, .88], flying: [.2, .8] };
/** The gates' lines as on the player (sprint10.css), drawn again in the check. */
const GATE_COLORS: Record<GateKey, string> = { start: '#68ffbf', finish: '#ffc460' };
/** The values the gate crossings change (the check shows them before and after), as in the result's tiles. */
const valuesOf = (r: SprintResult | null, section: string): ReviewValue[] => [
  { label: `${section}通過時間`, value: r?.duration ?? null, unit: '秒', digits: 3 }, { label: '平均速度', value: r?.speed ?? null, unit: 'm/s', digits: 2 },
  { label: '推定歩数', value: r?.count ?? null, unit: '歩', digits: 1 }, { label: '推定ピッチ', value: r?.cadence ?? null, unit: '歩/秒', digits: 2 },
  { label: '平均歩幅', value: r?.stride ?? null, unit: 'm', digits: 2 }];
/** One ◀/▶ tap moves a line by 0.2% of the frame width. */
const NUDGE = .002;

export default function Sprint10Lab() {
  const video = useRef<HTMLVideoElement>(null), owner = useRef<AbortController | null>(null);
  const resultCard = useRef<HTMLElement>(null), showResult = useRef(false);
  const [file, setFile] = useState<File | null>(null), [url, setUrl] = useState('');
  const [start, setStart] = useState(.12), [finish, setFinish] = useState(.88);
  const [mode, setMode] = useState<SprintStart>('standing'), [crouch, setCrouch] = useState(false);
  // Flying section: where it begins on the track (label only) and its real length (the scale).
  const [sectionStartM, setSectionStartM] = useState(50), [sectionLengthM, setSectionLengthM] = useState(10);
  const distanceM = mode === 'flying' ? sectionLengthM : 10;
  const sectionLabel = mode === 'flying' ? `${sectionStartM}〜${sectionStartM + sectionLengthM}m区間` : '10m';
  const GATE_LABEL = GATE_LABELS[mode];
  const [confirmed, setConfirmed] = useState(false);
  const [loaded, setReady] = useState(false), [busy, setBusy] = useState(false), [progress, setProgress] = useState(0);
  const [message, setMessage] = useState(''), [samples, setSamples] = useState<SprintSample[] | null>(null);
  const [review, setReview] = useState('');
  // A chosen video's lines can be placed on its first frame before it is played.
  const still = useFirstFrame(url), ready = loaded || !!still;
  // The check of the gate crossings (as the other events' contacts): every frame of the video and the picture's size,
  // the frames the user set (by gate), those confirmed, the one being checked, and whether the check is open.
  const [timeline, setTimeline] = useState<{ frames: CrouchFrame[]; width: number; height: number } | null>(null);
  const [edits, setEdits] = useState<Record<string, number>>({}), [checked, setChecked] = useState<ReadonlySet<string>>(new Set());
  const [moment, setMoment] = useState<string | null>(null), [checking, setChecking] = useState(false);
  const checkPanel = useRef<HTMLDivElement>(null);
  useEffect(() => { setEdits({}); setChecked(new Set()); setMoment(null); setChecking(false); }, [samples]);
  useEffect(() => { if (checking) checkPanel.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, [checking]);
  const auto = useMemo(() => samples && confirmed && distanceM > 0 ? analyzeSprint(samples, start, finish, distanceM, mode) : null, [samples, start, finish, confirmed, distanceM, mode]);
  const list = useMemo(() => auto && samples && timeline ? gateMoments(auto, edits, timeline.frames, samples, { start, finish }, GATE_LABEL, GATE_COLORS) : [],
    [auto, edits, timeline, samples, start, finish, GATE_LABEL]);
  const shifts = useMemo(() => timeline ? gateShifts(list, timeline.frames) : {}, [list, timeline]);
  // Everything shown and saved comes from the crossings as set.
  const result = useMemo(() => auto && samples && Object.keys(shifts).length ? analyzeSprint(samples, start, finish, distanceM, mode, shifts) : auto,
    [auto, samples, shifts, start, finish, distanceM, mode]);
  const editedCount = Object.keys(shifts).length, waiting = list.filter(m => m.flag && !checked.has(m.key)).length;
  const gap = useMemo(() => samples ? continuityLimit(samples) : 0, [samples]);
  const ptsOf = useMemo(() => new Map(timeline?.frames.map(f => [f.frame, f.pts]) ?? []), [timeline]);
  const preview = useCallback((m: ReviewMoment, frame: number) => {
    if (!samples || !timeline || !result) return [];
    const now = valuesOf(result, sectionLabel);
    const at = (n: number) => { const pts = ptsOf.get(n); if (pts === undefined) return now;
      const moved = gateShifts(list.map(q => q.key === m.key ? { ...q, frame: n, pts } : q), timeline.frames);
      return valuesOf(analyzeSprint(samples, start, finish, distanceM, mode, moved), sectionLabel); };
    return effectsBetween(now, frame === m.frame ? now : at(frame), relatedValues(now, at(m.frame + 2), at(m.frame - 2)));
  }, [samples, timeline, result, list, ptsOf, start, finish, distanceM, mode, sectionLabel]);
  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);
  useEffect(() => () => { owner.current?.abort(); owner.current = null; }, []);
  // Bring the numbers into view once, when a new analysis finishes.
  useEffect(() => {
    if (result && showResult.current) { showResult.current = false; resultCard.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  }, [result]);
  function cancel() {
    owner.current?.abort(); owner.current = null; setBusy(false);
    setMessage('解析を中止しました。');
  }
  function changeFile(next: File | null) {
    cancel(); setFile(next); setUrl(next ? URL.createObjectURL(next) : ''); setReady(false);
    setSamples(null); setTimeline(null); setConfirmed(false); setMessage(''); setProgress(0); setReview('');
  }
  function changeMode(next: SprintStart | 'crouch') {
    if (busy) return;
    if (next === 'crouch') { if (!crouch) { cancel(); setCrouch(true); } return; }
    setCrouch(false);
    if (next === mode) return;
    setMode(next); setStart(DEFAULT_GATES[next][0]); setFinish(DEFAULT_GATES[next][1]);
    // Subject acquisition differs between modes: a fresh run is required.
    setConfirmed(false); setSamples(null); setReview('');
  }
  function move(which: Gate, value: number) {
    if (busy) return;
    const x = Math.max(.01, Math.min(.99, value));
    if (which === 'start') setStart(x); else setFinish(x);
    // The gates seed subject selection and its run direction: changing them requires a fresh run.
    setConfirmed(false); setSamples(null); setReview('');
  }
  function drag(which: Gate, event: React.PointerEvent<HTMLButtonElement>) {
    if (busy || !event.currentTarget.hasPointerCapture(event.pointerId)) return;
    const rect = event.currentTarget.parentElement!.getBoundingClientRect();
    move(which, (event.clientX - rect.left) / rect.width);
  }
  async function analyze() {
    if (!file || !confirmed || busy) return;
    const control = new AbortController(); owner.current = control;
    video.current?.pause(); setBusy(true); setSamples(null); setTimeline(null); setProgress(0); setReview(''); setMessage('解析を準備しています。');
    try {
      let frames: CrouchFrame[] = [], width = 0, height = 0;
      const run = (tiles: boolean) => measureSprint(file, start, control.signal, (value, text) => {
        if (owner.current === control) { setProgress(value); setMessage(tiles ? `選手を探し直しています。${text}` : text); }
      }, finish, mode, distanceM, {
        tiles,
        onTimeline: all => { frames = [...all].sort((a, b) => a.pts - b.pts).map(f => ({ frame: f.frameIndex, pts: f.pts, pose: null })); },
        onSelected: (_frame, _selected, w, h) => { width = w; height = h; },
      });
      let data = await run(false);
      // A flying section not measured: looked at again with the search in tiles (frame-processor.ts tilesOf; the user's
      // 240 fps clips, 2026-10-09: a runner a sixth of the picture high, there from the first frame, was never found).
      // Only then: always on, it changed sections measured before (the runner taken up from a tile in a frame the crop
      // missed: 3 of 152 validation clips no longer measured), and looked at the empty run-in in tiles (+51% pose calls).
      if (mode === 'flying' && !control.signal.aborted && analyzeSprint(data, start, finish, distanceM, mode).reason) {
        const again = await run(true);
        if (!analyzeSprint(again, start, finish, distanceM, mode).reason) data = again;
      }
      if (owner.current === control && !control.signal.aborted) {
        showResult.current = true; setTimeline(frames.length && width ? { frames, width, height } : null); setSamples(data);
      }
    } catch (error) {
      if (owner.current === control && !control.signal.aborted) setMessage(error instanceof Error ? error.message : String(error));
    } finally { if (owner.current === control) { owner.current = null; setBusy(false); } }
  }
  /** A crossing set (or confirmed as judged), and on to the other one if not yet checked. */
  function setMomentFrame(key: string, frame: number) {
    const m = list.find(q => q.key === key); if (!m) return;
    setEdits(e => { const next = { ...e }; if (frame === m.autoFrame) delete next[key]; else next[key] = frame; return next; });
    setChecked(c => new Set(c).add(key));
    const i = list.indexOf(m), next = [...list.slice(i + 1), ...list.slice(0, i)].find(q => !checked.has(q.key));
    setMoment(next ? next.key : key);
  }
  function openCheck() {
    const first = list.find(q => q.flag && !checked.has(q.key)) ?? list.find(q => !checked.has(q.key));
    if (first) setMoment(first.key);
    setChecking(true);
  }
  function closeCheck() { setChecking(false); resultCard.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  function seek(pts: number, label: string) {
    if (video.current) {
      video.current.pause(); video.current.currentTime = pts; setReview(`${label} · ${pts.toFixed(3)}秒`);
      video.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }
  function save() {
    const blob = new Blob([JSON.stringify({ version: SPRINT10_ANALYSIS_VERSION, file: file?.name, distanceM,
      mode, section: mode === 'flying' ? { startM: sectionStartM, lengthM: sectionLengthM } : null,
      gates: { start, finish }, timeBasis: 'SOURCE_PRESENTATION_TIME', crossingBasis: 'PELVIS_MIDPOINT',
      stepBasis: 'LEG_OVERLAP_CYCLES_BETWEEN_GATES_WITH_FRACTIONAL_EDGES', strideBasis: 'PELVIS_DISPLACEMENT_BETWEEN_OVERLAPS',
      calibration: 'TWO_GATE_LINEAR_SCALE_NOT_PERSPECTIVE_CORRECTED', result,
      ...(editedCount ? { edited: { frames: edits, shiftsSeconds: shifts, auto } } : {}), checked: [...checked], samples }, null, 2)], { type: 'application/json' });
    const link = document.createElement('a'), objectURL = URL.createObjectURL(blob); link.href = objectURL;
    link.download = mode === 'flying' ? `sprint-section-${sectionStartM}-${sectionStartM + sectionLengthM}m-result.json` : 'sprint10-result.json';
    link.click(); setTimeout(() => URL.revokeObjectURL(objectURL), 1000);
  }
  const display = (value: number | null | undefined, digits = 2) => value == null ? '—' : value.toFixed(digits);
  const position = (which: Gate) => which === 'start' ? start : finish;
  const specific = result ? result.warnings.filter(w => !SPRINT10_NOTES.includes(w)) : [];
  return <main className="sprint10">
    <a className="sprint10-back" href={import.meta.env.BASE_URL}>← 種目を選ぶ</a>
    <header><p className="sprint10-eyebrow">SPRINT / {crouch ? 'CROUCH START' : mode === 'flying' ? 'MAX VELOCITY SECTION' : '10 METRES'}</p>
      <h1>{crouch ? 'クラウチングスタートの解析' : mode === 'flying' ? '最高速度区間の解析' : '10m スプリント解析'}</h1>
      <p>{crouch ? 'ブロックから最大5歩目まで、各歩の接地・滞空・ピッチと姿勢の角度を解析します。' : '2本のラインを設定するだけで、通過時間・歩数・ピッチ・歩幅を解析します。'}</p></header>
    <div className="sprint10-modes" role="group" aria-label="解析の種類">{MODES.map(m => { const selected = m.id === 'crouch' ? crouch : !crouch && mode === m.id;
      return <button key={m.id} type="button" aria-pressed={selected} disabled={busy}
        className={selected ? 'is-selected' : ''} onClick={() => changeMode(m.id)}><strong>{wrapped(m.label)}</strong><span>{m.hint}</span></button>; })}</div>
    {/* On a phone the modes are one row of names; the chosen one's hint is shown under them. */}
    <p className="sprint10-mode-hint">{MODES.find(m => m.id === (crouch ? 'crouch' : mode))?.hint}</p>
    {crouch ? <CrouchLab /> : <>
    {mode === 'flying' && <div className="sprint10-section"><label>区間の入口<input type="number" inputMode="numeric" min={0} max={400} step={5} value={sectionStartM} disabled={busy}
        onChange={e => setSectionStartM(Math.max(0, Math.min(400, Math.round(Number(e.target.value) || 0))))} /><span>m地点</span></label>
      <label>区間の長さ<input type="number" inputMode="decimal" min={1} max={100} step={1} value={sectionLengthM} disabled={busy}
        onChange={e => { setSectionLengthM(Math.max(0, Math.min(100, Number(e.target.value) || 0))); setConfirmed(false); setReview(''); }} /><span>m</span></label>
      <p>{sectionLabel}として記録します。長さは2本のラインの実際の間隔です。</p></div>}
    <p className="sprint10-note">試験機能・精度未検証。固定カメラで真横に近い方向から、1人の全身と{mode === 'flying' ? '区間全体' : '10m区間'}を撮影してください。通常速度の時間軸の動画を使用します。スロー書き出し動画の速度倍率は自動補正しません。</p>
    <section className="sprint10-card"><h2>1　動画を選ぶ</h2>
      <label className="sprint10-upload"><input className="sprint10-file-input" type="file" aria-label={`${sectionLabel}の動画を選ぶ`} accept="video/mp4,video/quicktime,.mov,.mp4,.m4v" disabled={busy} onChange={e => changeFile(e.target.files?.[0] ?? null)} />
        <span className="sprint10-upload-button" aria-hidden="true"><Upload size={19} />{file ? '別の動画を選ぶ' : '動画を選ぶ'}</span></label>
      {file && <p className="sprint10-file">{file.name} · {(file.size / 1024 / 1024).toFixed(1)} MB</p>}
    </section>
    <section className="sprint10-card"><h2>{`2　${GATE_LABEL.start}と${GATE_LABEL.finish}を合わせる`}</h2>
      <p>{mode === 'flying'
        ? '再生して、選手が入口と出口の線を越えて走る様子が映っていることを確認します。最初は選手が画面に入っていなくて構いません。'
        : '再生して、骨盤がスタートを越える前からゴールを越えた後まで映っていることを確認します。'}次に、2本の線を走路上の白線・コーンに合わせてください。目印は選手が走るコース上（同じ奥行き）に置きます。画面の端ほど奥行きの差でタイムがずれます。{mode === 'flying'
        ? '線は画面の端の近くでも構いません。線を越える瞬間に体が画面の端にかかっている場合は、その前後の動きから通過時刻を推定し、結果にその旨を表示します。'
        : 'スタートの線は、選手の立ち位置より少し後ろに置いてください。'}</p>
      <div className="sprint10-player">
        <video ref={video} src={url || undefined} playsInline preload="auto"
          poster={still?.image} style={still ? { aspectRatio: `${still.width} / ${still.height}` } : undefined}
          onLoadedMetadata={() => setReady(true)} onLoadedData={() => setReady(true)} onError={() => { setReady(false); setMessage('この動画を再生できません。対応形式を確認してください。'); }} />
        {ready && <div className="sprint10-gates">{(['start', 'finish'] as const).map(which => <button key={which} type="button" role="slider"
          aria-label={`${GATE_LABEL[which]}ライン`} aria-valuemin={1} aria-valuemax={99} aria-valuenow={Math.round(position(which) * 100)}
          // Near a frame edge the label sits beside the line, inside the picture.
          className={`sprint10-gate ${which}${position(which) < .1 ? ' at-left' : position(which) > .9 ? ' at-right' : ''}`} style={{ left: `${position(which) * 100}%` }} disabled={busy}
          onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); drag(which, e); }} onPointerMove={e => drag(which, e)}
          onPointerUp={e => { if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId); }}
          onKeyDown={e => { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); move(which, position(which) + (e.key === 'ArrowLeft' ? -NUDGE : NUDGE)); } }}>
          <span>{mode === 'flying' ? GATE_LABEL[which] : which === 'start' ? 'START' : 'FINISH'}</span></button>)}</div>}
      </div>
      {url && <PlayerBar video={video} url={url} disabled={busy} />}
      {review && <p aria-live="polite">確認中：{review}</p>}
      <p className="sprint10-hint">線をドラッグして大まかに合わせ、◀ ▶ で少しずつ動かします。</p>
      <div className="sprint10-gate-controls">{(['start', 'finish'] as const).map(which => <div key={which} className={`sprint10-gate-row ${which}`}>
        <span>{GATE_LABEL[which]}</span>
        <button type="button" aria-label={`${GATE_LABEL[which]}を左へ`} disabled={!ready || busy} onClick={() => move(which, position(which) - NUDGE)}>◀</button>
        <input type="range" aria-label={`${GATE_LABEL[which]}位置`} min="1" max="99" step=".1" value={position(which) * 100} disabled={!ready || busy}
          onChange={e => move(which, Number(e.target.value) / 100)} />
        <button type="button" aria-label={`${GATE_LABEL[which]}を右へ`} disabled={!ready || busy} onClick={() => move(which, position(which) + NUDGE)}>▶</button>
      </div>)}</div>
      <button className="sprint10-confirm" disabled={!ready || busy || Math.abs(start - finish) < .1 || distanceM <= 0} onClick={() => setConfirmed(true)}>{confirmed ? '✓ ライン設定済み' : 'この2本のラインで決定'}</button>
    </section>
    <section className="sprint10-card"><h2>3　解析する</h2><button className="sprint10-primary" disabled={!ready || !confirmed || busy} onClick={() => void analyze()}>解析する</button>
      {busy && <button onClick={cancel}>中止</button>}
      <p role="status">{message || '動画を選び、2本のラインを決定すると解析できます。'}</p>
      {busy && <progress max="1" value={progress} aria-label="解析の進み具合" />}
    </section>
    {result && <section ref={resultCard} className="sprint10-card sprint10-result" aria-label="解析結果"><h2>解析結果</h2>
      {result.reason && <p role="alert" className="sprint10-note">{result.reason}</p>}
      <div className="sprint10-metrics">{[[`${sectionLabel}通過時間`, display(result.duration, 3), '秒'], ['平均速度', display(result.speed), 'm/s'],
        ['推定歩数', display(result.count, 1), '歩'], ['推定ピッチ', display(result.cadence), '歩/秒'], ['平均歩幅', display(result.stride), 'm']].map(([label, value, unit]) => <div key={label}><span>{label}</span><strong>{value}</strong><small>{unit}</small></div>)}</div>
      {list.length > 0 && <p className="crouch-check-note"><span>{editedCount ? `手で直したコマを使っています（${editedCount}か所）。` : '線を越えるコマは自動判定です。ずれていたら1コマ単位で直せます。'}
        {waiting > 0 && ` 要確認 ${waiting}か所。`}</span>
        <button type="button" aria-expanded={checking} onClick={() => checking ? closeCheck() : openCheck()}>{checking ? '閉じる' : '確認する'}</button></p>}
      {checking && timeline && samples && url && list.length > 0 && <div ref={checkPanel} className="sprint10-gate-review">
        <p className="sprint10-hint">骨盤が線を越えるコマを確かめます。ずれていたら◀▶か下のコマで合わせて「このコマに決める」、合っていれば「OK」。数値はすぐ変わります。</p>
        <MomentReview url={url} frames={timeline.frames} width={timeline.width} height={timeline.height} list={list} edits={edits} checked={checked}
          at={moment} onAt={setMoment} onSet={setMomentFrame}
          onRevert={key => setEdits(e => { const next = { ...e }; delete next[key]; return next; })} onRevertAll={() => setEdits({})}
          onDone={closeCheck} preview={preview} source={() => '骨格'} leg={legPixels(samples, timeline.height)}
          point={(_m, frame) => { const pts = ptsOf.get(frame), p = pts === undefined ? null : pelvisAt(samples, pts, gap); return p && p.y !== null ? { x: p.x, y: p.y } : null; }}
          down={(m, f) => { const p = pelvisAt(samples, f.pts, gap); return p && m.focus ? (p.x - m.focus.x) * Math.sign(finish - start) > 0 : null; }}
          doneText="2本の線の通過を確認しました。値は上の数値と保存に反映されています。" doneLabel="数値を見る" />
      </div>}
      {!checking && <>
      {specific.map(w => <p className="sprint10-note" key={w}>{w}</p>)}
      <details className="sprint10-more"><summary>数値の見方</summary>
        <p>タイムは骨盤中心のライン通過間隔です。合図からのスタートタイム・全身の重心の測定ではありません。</p>
        <p>「確認」で線を越えるコマを直すと、直したコマの分だけ通過の時刻をずらして計算し直します（コマの間の細かい時刻と、脚の入れ替わりは自動の判定のままです）。</p>
        {SPRINT10_NOTES.map(w => <p key={w}>{w}</p>)}</details>
      <details className="sprint10-more"><summary>1歩ごとの詳細を見る</summary><StrideResults intervals={result.strideIntervals} seek={seek} /></details>
      <details className="sprint10-more"><summary>検出位置を動画で確認</summary>
        <div className="sprint10-events">
          {result.start && <button onClick={() => seek(result.start!.pts, GATE_LABEL.start)}>{GATE_LABEL.start} {result.start.pts.toFixed(3)}秒</button>}
          {result.steps.map((s, i) => <button key={s.frame} onClick={() => seek(s.pts, `${i + 1}回目の入れ替わり`)}>
            {i + 1}回目の入れ替わり · {s.pts.toFixed(3)}秒</button>)}
          {result.finish && <button onClick={() => seek(result.finish!.pts, GATE_LABEL.finish)}>{GATE_LABEL.finish} {result.finish.pts.toFixed(3)}秒</button>}
        </div><p>ボタンでその時刻へ移動します。遊脚が支持脚を追い越す瞬間で、接地のコマではありません。</p></details>
      <button onClick={save}>結果と判定データを保存（JSON）</button>
      </>}
    </section>}
    </>}
    <footer>解析v10 · 動画はこの端末内で処理します。全フレームの解析時間は端末性能により変わります。2本のラインだけで遠近やカメラの揺れを補正することはできません。</footer>
  </main>;
}
