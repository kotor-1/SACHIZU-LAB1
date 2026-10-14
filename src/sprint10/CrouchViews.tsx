import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { nearestPoseFrame } from '../cmj/pose-drawing';
import { anglePose, type CrouchFrame } from './crouch';
import { visible } from './contacts';
import { drawCrouchFigure, figureView, markText, type Mark, type Phase } from './crouch-figure';
import PlayerBar from './PlayerBar';
import { frameInterval, insideFrame, once, seekTo } from './frame-seek';
import PoseEditor from './PoseEditor';
import type { PoseEditing } from './pose-edits';
export { frameInterval, insideFrame, once, seekTo };

/** Pictures are 4:3, drawn at this width (pixels). */
const FIGURE_W = 720, FIGURE_H = 540;
/** A phase's angles are drawn in the replay from this many frames before to after its frame. */
const PHASE_REACH = 3;

/** Pictures of `phases` (key → JPEG data URL), made from a hidden copy of the video: the athlete cut out of each frame,
 * the skeleton, the measured angles with their values, then `overlay`. */
/** A phase's frame as cut for its picture, before anything is drawn on it (JPEG data URL), and where it was cut from
 * (pixels of the W × H video): the skeleton set by hand is edited on it (PoseEditor.tsx), with no second video read. */
export interface PhaseStill { image: string; view: { x: number; y: number; w: number; h: number }; W: number; H: number }
export function usePhasePictures(url: string, frames: readonly CrouchFrame[], phases: Phase[], overlay?: FigureOverlay) {
  const [images, setImages] = useState<Record<string, string>>({}), [failed, setFailed] = useState(false);
  const [stills, setStills] = useState<Record<string, PhaseStill>>({});
  const interval = useMemo(() => frameInterval(frames), [frames]);
  // Drawn again only when a picture would change (a moment's frame or marks): a new array of the same phases on every
  // render (a tap in 確認, a key in 身長) started the hidden video over each time, several at once on a phone.
  const shownKey = phases.map(p => `${p.key}:${p.frame}:${JSON.stringify(p.marks ?? null)}:${p.focus?.join(',') ?? ''}`).join('|');
  const latest = useRef(phases); latest.current = phases;
  useEffect(() => {
    const phases = latest.current;
    let closed = false;
    setImages({}); setStills({}); setFailed(false);
    const v = document.createElement('video');
    v.muted = true; v.playsInline = true; v.preload = 'auto';
    v.style.cssText = 'position:fixed;left:-10000px;top:0;width:320px;height:180px;pointer-events:none';
    document.body.appendChild(v);
    (async () => {
      try {
        const loaded = once(v, 'loadeddata', 20000);
        v.src = url; v.load();
        // Some browsers load nothing until the video plays once.
        const nudge = setTimeout(() => { if (v.readyState < 2) v.play().then(() => v.pause()).catch(() => undefined); }, 1500);
        await loaded; clearTimeout(nudge);
        for (const p of phases) {
          const shown = frames.find(f => f.frame === p.frame), pose = shown ? anglePose(shown) : null;
          if (closed) return;
          if (!pose) continue;
          // The frame whose pose is drawn, by its own time: a moment's time may lie between frames (a touchdown from the
          // pictures, crouch-pixels.ts), and its middle-of-frame seek then showed the frame before under this skeleton.
          await seekTo(v, insideFrame(shown!.pts, interval));
          if (closed) return;
          const canvas = document.createElement('canvas'); canvas.width = FIGURE_W; canvas.height = FIGURE_H;
          const ctx = canvas.getContext('2d'); if (!ctx) throw new Error('no canvas');
          const around = p.focus ? pose.map((q, i) => p.focus!.includes(i) ? q : { ...q, visibility: 0 }) : pose;
          // A side whose foot RTMPose had wrong and nothing could mend (left out, leg-check.ts): the picture is still cut
          // round the feet, with MediaPipe's pose of the frame (it was cut round the body above the knees).
          const footless = !p.focus && shown!.pose && shown!.pose !== pose && ([0, 1] as const).some(s => [27, 29, 31].every(k => !visible(pose[k + s], .3)));
          const W = v.videoWidth, H = v.videoHeight, view = figureView(footless ? [...around, ...shown!.pose!] : around, W, H, FIGURE_W / FIGURE_H), k = FIGURE_W / view.w;
          ctx.drawImage(v, view.x, view.y, view.w, view.h, 0, 0, FIGURE_W, FIGURE_H);
          const still: PhaseStill = { image: canvas.toDataURL('image/jpeg', .85), view, W, H };
          const to = (q: { x: number; y: number }) => ({ x: (q.x * W - view.x) * k, y: (q.y * H - view.y) * k });
          drawCrouchFigure(ctx, pose, to, p.marks, FIGURE_W / 48, true);
          overlay?.(p, ctx, to, FIGURE_W / 48);
          const image = canvas.toDataURL('image/jpeg', .85);
          if (!closed) { setImages(m => ({ ...m, [p.key]: image })); setStills(m => ({ ...m, [p.key]: still })); }
        }
      } catch { if (!closed) setFailed(true); }
    })();
    return () => { closed = true; v.pause(); v.removeAttribute('src'); v.load(); v.remove(); };
  }, [url, frames, shownKey, interval, overlay]);   // eslint-disable-line react-hooks/exhaustive-deps
  return { images, failed, stills };
}

/** A picture of each phase: the athlete cut out of its frame, the skeleton and
 * the measured angles with their values. Made from a hidden copy of the video. */
/** Draws more on a phase's picture: `to` turns a normalized point into canvas pixels, `unit` sizes lines and text. */
export type FigureOverlay = (p: Phase, ctx: CanvasRenderingContext2D, to: (q: { x: number; y: number }) => { x: number; y: number }, unit: number) => void;
export function PhaseFigures({ url, frames, phases, onShow, guides = {}, overlay, editing }: { url: string; frames: readonly CrouchFrame[]; phases: Phase[];
  onShow: (p: Phase) => void; guides?: Record<string, string>; overlay?: FigureOverlay;
  /** The skeleton can be set by hand on each picture (pose-edits.ts); the frames given are then with the points set. */
  editing?: PoseEditing }) {
  const { images, failed, stills } = usePhasePictures(url, frames, phases, overlay);
  // One picture at a time: swiped sideways, or chosen above (six stacked
  // pictures made the phone screen long, the user 2026-10-05: 「縦長で使いにくい」).
  const track = useRef<HTMLOListElement>(null), [at, setAt] = useState(0);
  const [open, setOpen] = useState<string | null>(null);
  // Each frame's angles with the automatic skeleton: one a skeleton set by hand cannot be measured with (a segment drawn
  // too short, angles.ts SEGMENT_MIN) is named under the picture, not left out unsaid.
  const auto = useRef<Record<number, Mark[]>>({});
  const go = (i: number) => { const el = track.current; if (el?.clientWidth) el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' }); setAt(i); };
  return <div className="sprint10-phase-view">
    <div className="sprint10-chips" role="group" aria-label="局面を選ぶ">{phases.map((p, i) =>
      <button key={p.key} type="button" aria-pressed={at === i} aria-label={p.label} onClick={() => go(i)}>{shortLabel(p)}</button>)}</div>
    <ol ref={track} className="sprint10-phases" aria-label="局面ごとの姿勢"
      onScroll={e => { const el = e.currentTarget; if (el.clientWidth) setAt(Math.max(0, Math.min(phases.length - 1, Math.round(el.scrollLeft / el.clientWidth)))); }}>
      {phases.map((p, i) => { const shown = frames.find(f => f.frame === p.frame), hand = !!editing?.edited.has(p.frame);
        if (!hand) auto.current[p.frame] = p.marks;
        const lost = hand ? lostMarks(auto.current[p.frame], p.marks) : [];
        return <li key={p.key} aria-label={`${i + 1}/${phases.length} ${p.label}`}>
        <div className="sprint10-phase-head"><div><strong>{p.label}</strong><small>{p.pts.toFixed(3)}秒</small></div>
          <button type="button" aria-label={`${p.label}をスロー再生で見る`} onClick={() => onShow(p)}>▶ スローで見る</button></div>
        {editing && open === p.key && shown && stills[p.key] ? <PoseEditor still={stills[p.key]} frame={shown} editable={editing.editable} marks={p.marks} edited={hand}
            onDone={moved => { editing.onSet(p.frame, moved); setOpen(null); }} onCancel={() => setOpen(null)} onReset={() => { editing.onReset(p.frame); setOpen(null); }} />
          : images[p.key] ? <img src={images[p.key]} alt={`${p.label}の骨格と角度`} />
          : <div className="sprint10-phase-wait">{failed ? '画像を作れませんでした' : '画像を作成しています…'}</div>}
        <p>{p.marks.length ? p.marks.map(markText).join(' · ') : '角度を測れませんでした'}</p>
        {p.note && <small className="sprint10-guide">{p.note}</small>}
        {guides[p.key] && <small className="sprint10-guide">{guides[p.key]}</small>}
        {lost.length > 0 && <LostNote names={lost.map(m => m.label)} />}
        {editing && shown && open !== p.key && <PoseEditRow label={p.label} hand={hand} ready={!!stills[p.key]} onOpen={() => setOpen(p.key)} onReset={() => editing.onReset(p.frame)} />}
      </li>; })}</ol>
  </div>;
}
/** The angles the automatic skeleton had and the one set by hand has not (the trunk by its kind: its name says which way
 * it leans; the others by name: a leg's side may change with the points). */
export const lostMarks = (auto: readonly Mark[] | undefined, now: readonly Mark[]) =>
  (auto ?? []).filter(m => !now.some(n => n.kind === m.kind && (m.kind === 'trunk' || n.label === m.label)));
/** Under a picture whose skeleton was set by hand: the angles it could not measure, and why. */
export function LostNote({ names }: { names: readonly string[] }) {
  return <small className="sprint10-guide pose-lost" role="status">手で直した骨格では「{names.join('」「')}」を測れませんでした。肩から腰、腰から膝、膝から足首の長さが短すぎると、角度を測りません。点の位置を見直してください。</small>;
}
/** Under a picture: 「骨格を直す」 (once its picture is made: the editor works on its frame as cut), and for a skeleton set
 * by hand, that it is and 「自動に戻す」. */
export function PoseEditRow({ label, hand, ready, onOpen, onReset }: { label: string; hand: boolean; ready: boolean; onOpen?: () => void; onReset: () => void }) {
  return <div className="pose-edit-row">
    {hand && <span className="pose-edited">✎ 骨格を手で直したコマ</span>}
    {onOpen && <button type="button" aria-label={`${label}の骨格を直す`} disabled={!ready} onClick={onOpen}>骨格を直す</button>}
    {hand && <button type="button" aria-label={`${label}の骨格を自動に戻す`} onClick={onReset}>自動に戻す</button>}
  </div>;
}
/** The phase's name on its button, short enough for a row of them on a phone. */
const shortLabel = (p: Phase) => p.short ?? (p.key === 'set' ? '構え' : p.key === 'clearance' ? '離れる' : p.label.replace('の接地', ''));

/** A judged moment to jump to: its name and, on its button, a shorter one. */
export interface ReplayEvent { label: string; short: string; pts: number }
const RATES = [['1/8', .125], ['1/4', .25], ['通常', 1]] as const;
/** The video with the athlete's skeleton following it, in slow motion or frame
 * by frame; near a phase's frame its measured lines and values are shown. */
export function CrouchReplay({ url, video, frames, phases, events }: { url: string; video: RefObject<HTMLVideoElement | null>;
  frames: readonly CrouchFrame[]; phases: Phase[]; events: ReplayEvent[] }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [rate, setRate] = useState(.125), [skeleton, setSkeleton] = useState(true), [shown, setShown] = useState('');
  // The judged moment on screen, lit among the buttons that jump to them.
  const [current, setCurrent] = useState(-1), chips = useRef<HTMLDivElement>(null);
  const seen = useMemo(() => frames.filter(f => f.pose), [frames]), interval = useMemo(() => frameInterval(frames), [frames]);
  useEffect(() => { const v = video.current; if (v) { v.defaultPlaybackRate = rate; v.playbackRate = rate; } }, [video, rate, url]);
  useEffect(() => {
    const v = video.current, c = canvas.current, ctx = c?.getContext('2d');
    if (!v || !c || !ctx) return;
    let callback = 0, closed = false, caption = '', lit = -1;
    const say = (text: string, event = -1) => {
      if (text !== caption) { caption = text; setShown(text); }
      if (event !== lit) { lit = event; setCurrent(event); }
    };
    const clear = () => { ctx.clearRect(0, 0, c.width, c.height); delete c.dataset.frame; say(''); };
    const draw = (pts: number) => {
      if (v.seeking || !v.videoWidth) { clear(); return; }
      if (c.width !== v.videoWidth || c.height !== v.videoHeight) { c.width = v.videoWidth; c.height = v.videoHeight; }
      ctx.clearRect(0, 0, c.width, c.height);
      const f = nearestPoseFrame(seen, pts);
      if (!f || Math.abs(f.pts - pts) > 1.5 * interval) { delete c.dataset.frame; say(''); return; }
      const phase = phases.find(p => Math.abs(p.pts - f.pts) <= (PHASE_REACH + .5) * interval) ?? null;
      if (skeleton) drawCrouchFigure(ctx, anglePose(f)!, q => ({ x: q.x * c.width, y: q.y * c.height }), phase?.marks ?? [], c.width / 110, false);
      c.dataset.frame = String(f.frame);
      say(phase ? `${phase.label}　${phase.marks.map(markText).join(' · ')}` : '', events.findIndex(e => Math.abs(e.pts - f.pts) < .5 * interval));
    };
    const changed = () => draw(v.currentTime);
    const next = (_now: number, meta: VideoFrameCallbackMetadata) => { if (closed) return; draw(meta.mediaTime); callback = v.requestVideoFrameCallback(next); };
    for (const event of ['seeked', 'loadeddata', 'timeupdate', 'pause']) v.addEventListener(event, changed);
    v.addEventListener('seeking', clear); changed();
    if (v.requestVideoFrameCallback) callback = v.requestVideoFrameCallback(next);
    return () => {
      closed = true; if (callback) v.cancelVideoFrameCallback(callback);
      for (const event of ['seeked', 'loadeddata', 'timeupdate', 'pause']) v.removeEventListener(event, changed);
      v.removeEventListener('seeking', clear); ctx.clearRect(0, 0, c.width, c.height);
    };
  }, [video, seen, phases, events, skeleton, interval, url]);
  // Keep the lit button in view in its sideways row.
  useEffect(() => {
    const row = chips.current, chip = row?.children[current] as HTMLElement | undefined;
    if (row && chip) row.scrollTo({ left: chip.offsetLeft - (row.clientWidth - chip.offsetWidth) / 2, behavior: 'smooth' });
  }, [current]);
  function step(by: number) {
    const v = video.current; if (!v || !seen.length) return;
    v.pause();
    const now = nearestPoseFrame(seen, v.currentTime) ?? seen[0], i = seen.indexOf(now);
    const target = seen[Math.max(0, Math.min(seen.length - 1, i + by))];
    v.currentTime = insideFrame(target.pts, interval);
  }
  function jump(pts: number) { const v = video.current; if (v) { v.pause(); v.currentTime = insideFrame(pts, interval); } }
  return <>
    <div className="sprint10-player">
      <video ref={video} src={url} playsInline muted preload="auto" />
      <canvas ref={canvas} className="sprint10-replay-overlay" aria-label="選手の骨格" />
      <label className="sprint10-overlay-toggle"><input type="checkbox" checked={skeleton} onChange={e => setSkeleton(e.target.checked)} />骨格</label>
    </div>
    <PlayerBar video={video} url={url} />
    <p className="sprint10-replay-caption" aria-live="polite">{shown || ' '}</p>
    <div className="sprint10-replay-controls">
      <div className="sprint10-seg" role="group" aria-label="再生の速さ">{RATES.map(([label, r]) =>
        <button key={label} type="button" aria-pressed={rate === r} onClick={() => setRate(r)}>{label}</button>)}</div>
      <div className="sprint10-stepper" role="group" aria-label="1コマ送り">
        <button type="button" aria-label="1コマ戻る" onClick={() => step(-1)}>◀</button><span aria-hidden="true">1コマ</span>
        <button type="button" aria-label="1コマ進む" onClick={() => step(1)}>▶</button></div>
    </div>
    <div ref={chips} className="sprint10-events sprint10-chips" role="group" aria-label="判定した瞬間へ移動">{events.map((e, i) =>
      <button key={`${e.label}${e.pts}`} type="button" aria-label={`${e.label} ${e.pts.toFixed(3)}秒`} aria-pressed={current === i} onClick={() => jump(e.pts)}>
        {e.short}<small>{e.pts.toFixed(3)}</small></button>)}</div>
  </>;
}
