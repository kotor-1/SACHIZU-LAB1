import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { nearestPoseFrame } from '../cmj/pose-drawing';
import { anglePose, type CrouchFrame } from './crouch';
import { drawCrouchFigure, figureView, markText, type Phase } from './crouch-figure';
import PlayerBar from './PlayerBar';

/** Pictures are 4:3, drawn at this width (pixels). */
const FIGURE_W = 720, FIGURE_H = 540;
/** A phase's angles are drawn in the replay from this many frames before to after its frame. */
const PHASE_REACH = 3;

/** The median time between analysed frames (s). */
export function frameInterval(frames: readonly CrouchFrame[]): number {
  const d = frames.slice(1).map((f, i) => f.pts - frames[i].pts).filter(v => v > 0).sort((a, b) => a - b);
  return d.length ? d[d.length >> 1] : 1 / 240;
}
/** The middle of the frame starting at `pts`, to seek to. Safari showed the
 * frame before when asked for 0.3 of a frame past its start (it rounds seek
 * times down to 1/600 s); the middle gave the right frame in Safari and Chrome
 * (2026-10-04: the iPhone's pictures had the skeleton a frame off the body). */
export const insideFrame = (pts: number, interval: number) => pts + .5 * interval;

function once(target: HTMLVideoElement, event: string, ms: number) {
  return new Promise<void>((resolve, reject) => {
    const done = () => { clearTimeout(timer); target.removeEventListener(event, done); resolve(); };
    const timer = setTimeout(() => { target.removeEventListener(event, done); reject(new Error(`${event} timed out`)); }, ms);
    target.addEventListener(event, done);
  });
}
async function seekTo(v: HTMLVideoElement, t: number) {
  const seeked = once(v, 'seeked', 8000);
  v.currentTime = t; await seeked;
  await new Promise<void>(r => requestAnimationFrame(() => r()));
}

/** Pictures of `phases` (key → JPEG data URL), made from a hidden copy of the video: the athlete cut out of each frame,
 * the skeleton, the measured angles with their values, then `overlay`. */
export function usePhasePictures(url: string, frames: readonly CrouchFrame[], phases: Phase[], overlay?: FigureOverlay) {
  const [images, setImages] = useState<Record<string, string>>({}), [failed, setFailed] = useState(false);
  const interval = useMemo(() => frameInterval(frames), [frames]);
  // Drawn again only when a picture would change (a moment's frame or marks): a new array of the same phases on every
  // render (a tap in 確認, a key in 身長) started the hidden video over each time, several at once on a phone.
  const shownKey = phases.map(p => `${p.key}:${p.frame}:${JSON.stringify(p.marks ?? null)}:${p.focus?.join(',') ?? ''}`).join('|');
  const latest = useRef(phases); latest.current = phases;
  useEffect(() => {
    const phases = latest.current;
    let closed = false;
    setImages({}); setFailed(false);
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
          await seekTo(v, insideFrame(p.pts, interval));
          if (closed) return;
          const canvas = document.createElement('canvas'); canvas.width = FIGURE_W; canvas.height = FIGURE_H;
          const ctx = canvas.getContext('2d'); if (!ctx) throw new Error('no canvas');
          const around = p.focus ? pose.map((q, i) => p.focus!.includes(i) ? q : { ...q, visibility: 0 }) : pose;
          const W = v.videoWidth, H = v.videoHeight, view = figureView(around, W, H, FIGURE_W / FIGURE_H), k = FIGURE_W / view.w;
          ctx.drawImage(v, view.x, view.y, view.w, view.h, 0, 0, FIGURE_W, FIGURE_H);
          const to = (q: { x: number; y: number }) => ({ x: (q.x * W - view.x) * k, y: (q.y * H - view.y) * k });
          drawCrouchFigure(ctx, pose, to, p.marks, FIGURE_W / 48, true);
          overlay?.(p, ctx, to, FIGURE_W / 48);
          const image = canvas.toDataURL('image/jpeg', .85);
          if (!closed) setImages(m => ({ ...m, [p.key]: image }));
        }
      } catch { if (!closed) setFailed(true); }
    })();
    return () => { closed = true; v.pause(); v.removeAttribute('src'); v.load(); v.remove(); };
  }, [url, frames, shownKey, interval, overlay]);   // eslint-disable-line react-hooks/exhaustive-deps
  return { images, failed };
}

/** A picture of each phase: the athlete cut out of its frame, the skeleton and
 * the measured angles with their values. Made from a hidden copy of the video. */
/** Draws more on a phase's picture: `to` turns a normalized point into canvas pixels, `unit` sizes lines and text. */
export type FigureOverlay = (p: Phase, ctx: CanvasRenderingContext2D, to: (q: { x: number; y: number }) => { x: number; y: number }, unit: number) => void;
export function PhaseFigures({ url, frames, phases, onShow, guides = {}, overlay }: { url: string; frames: readonly CrouchFrame[]; phases: Phase[];
  onShow: (p: Phase) => void; guides?: Record<string, string>; overlay?: FigureOverlay }) {
  const { images, failed } = usePhasePictures(url, frames, phases, overlay);
  // One picture at a time: swiped sideways, or chosen above (six stacked
  // pictures made the phone screen long, the user 2026-10-05: 「縦長で使いにくい」).
  const track = useRef<HTMLOListElement>(null), [at, setAt] = useState(0);
  const go = (i: number) => { const el = track.current; if (el?.clientWidth) el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' }); setAt(i); };
  return <div className="sprint10-phase-view">
    <div className="sprint10-chips" role="group" aria-label="局面を選ぶ">{phases.map((p, i) =>
      <button key={p.key} type="button" aria-pressed={at === i} aria-label={p.label} onClick={() => go(i)}>{shortLabel(p)}</button>)}</div>
    <ol ref={track} className="sprint10-phases" aria-label="局面ごとの姿勢"
      onScroll={e => { const el = e.currentTarget; if (el.clientWidth) setAt(Math.max(0, Math.min(phases.length - 1, Math.round(el.scrollLeft / el.clientWidth)))); }}>
      {phases.map((p, i) => <li key={p.key} aria-label={`${i + 1}/${phases.length} ${p.label}`}>
        <div className="sprint10-phase-head"><div><strong>{p.label}</strong><small>{p.pts.toFixed(3)}秒</small></div>
          <button type="button" aria-label={`${p.label}をスロー再生で見る`} onClick={() => onShow(p)}>▶ スローで見る</button></div>
        {images[p.key] ? <img src={images[p.key]} alt={`${p.label}の骨格と角度`} />
          : <div className="sprint10-phase-wait">{failed ? '画像を作れませんでした' : '画像を作成しています…'}</div>}
        <p>{p.marks.length ? p.marks.map(markText).join(' · ') : '角度を測れませんでした'}</p>
        {guides[p.key] && <small className="sprint10-guide">{guides[p.key]}</small>}
      </li>)}</ol>
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
