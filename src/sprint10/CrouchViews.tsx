import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { nearestPoseFrame } from '../cmj/pose-drawing';
import type { CrouchFrame } from './crouch';
import { drawCrouchFigure, figureView, markText, type Phase } from './crouch-figure';

/** Pictures are 4:3, drawn at this width (pixels). */
const FIGURE_W = 720, FIGURE_H = 540;
/** A phase's angles are drawn in the replay from this many frames before to after its frame. */
const PHASE_REACH = 3;

/** The median time between analysed frames (s). */
export function frameInterval(frames: readonly CrouchFrame[]): number {
  const d = frames.slice(1).map((f, i) => f.pts - frames[i].pts).filter(v => v > 0).sort((a, b) => a - b);
  return d.length ? d[d.length >> 1] : 1 / 240;
}
/** A time inside the frame starting at `pts` (seeking to its very start may show the frame before). */
export const insideFrame = (pts: number, interval: number) => pts + .3 * interval;

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

/** A picture of each phase: the athlete cut out of its frame, the skeleton and
 * the measured angles with their values. Made from a hidden copy of the video. */
export function PhaseFigures({ url, frames, phases, onShow }: { url: string; frames: readonly CrouchFrame[]; phases: Phase[]; onShow: (p: Phase) => void }) {
  const [images, setImages] = useState<Record<string, string>>({}), [failed, setFailed] = useState(false);
  const interval = useMemo(() => frameInterval(frames), [frames]);
  useEffect(() => {
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
          const pose = frames.find(f => f.frame === p.frame)?.pose;
          if (closed) return;
          if (!pose) continue;
          await seekTo(v, insideFrame(p.pts, interval));
          if (closed) return;
          const canvas = document.createElement('canvas'); canvas.width = FIGURE_W; canvas.height = FIGURE_H;
          const ctx = canvas.getContext('2d'); if (!ctx) throw new Error('no canvas');
          const W = v.videoWidth, H = v.videoHeight, view = figureView(pose, W, H, FIGURE_W / FIGURE_H), k = FIGURE_W / view.w;
          ctx.drawImage(v, view.x, view.y, view.w, view.h, 0, 0, FIGURE_W, FIGURE_H);
          drawCrouchFigure(ctx, pose, q => ({ x: (q.x * W - view.x) * k, y: (q.y * H - view.y) * k }), p.marks, FIGURE_W / 48, true);
          const image = canvas.toDataURL('image/jpeg', .85);
          if (!closed) setImages(m => ({ ...m, [p.key]: image }));
        }
      } catch { if (!closed) setFailed(true); }
    })();
    return () => { closed = true; v.pause(); v.removeAttribute('src'); v.load(); v.remove(); };
  }, [url, frames, phases, interval]);
  return <ol className="sprint10-phases" aria-label="局面ごとの姿勢">{phases.map(p => <li key={p.key}>
    <div className="sprint10-phase-head"><strong>{p.label}</strong><small>{p.pts.toFixed(3)}秒</small></div>
    {images[p.key] ? <img src={images[p.key]} alt={`${p.label}の骨格と角度`} />
      : <div className="sprint10-phase-wait">{failed ? '画像を作れませんでした' : '画像を作成しています…'}</div>}
    <p>{p.marks.length ? p.marks.map(markText).join(' · ') : '角度を測れませんでした'}</p>
    <button type="button" onClick={() => onShow(p)}>スロー再生でこの瞬間を見る</button>
  </li>)}</ol>;
}

export interface ReplayEvent { label: string; pts: number }
const RATES = [['1/8', .125], ['1/4', .25], ['通常', 1]] as const;
/** The video with the athlete's skeleton following it, in slow motion or frame
 * by frame; near a phase's frame its measured lines and values are shown. */
export function CrouchReplay({ url, video, frames, phases, events }: { url: string; video: RefObject<HTMLVideoElement | null>;
  frames: readonly CrouchFrame[]; phases: Phase[]; events: ReplayEvent[] }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [rate, setRate] = useState(.125), [skeleton, setSkeleton] = useState(true), [shown, setShown] = useState('');
  const seen = useMemo(() => frames.filter(f => f.pose), [frames]), interval = useMemo(() => frameInterval(frames), [frames]);
  useEffect(() => { const v = video.current; if (v) { v.defaultPlaybackRate = rate; v.playbackRate = rate; } }, [video, rate, url]);
  useEffect(() => {
    const v = video.current, c = canvas.current, ctx = c?.getContext('2d');
    if (!v || !c || !ctx) return;
    let callback = 0, closed = false, caption = '';
    const say = (text: string) => { if (text !== caption) { caption = text; setShown(text); } };
    const clear = () => { ctx.clearRect(0, 0, c.width, c.height); delete c.dataset.frame; say(''); };
    const draw = (pts: number) => {
      if (v.seeking || !v.videoWidth) { clear(); return; }
      if (c.width !== v.videoWidth || c.height !== v.videoHeight) { c.width = v.videoWidth; c.height = v.videoHeight; }
      ctx.clearRect(0, 0, c.width, c.height);
      const f = nearestPoseFrame(seen, pts);
      if (!f || Math.abs(f.pts - pts) > 1.5 * interval) { delete c.dataset.frame; say(''); return; }
      const phase = phases.find(p => Math.abs(p.pts - f.pts) <= (PHASE_REACH + .5) * interval) ?? null;
      if (skeleton) drawCrouchFigure(ctx, f.pose!, q => ({ x: q.x * c.width, y: q.y * c.height }), phase?.marks ?? [], c.width / 110, false);
      c.dataset.frame = String(f.frame);
      say(phase ? `${phase.label}　${phase.marks.map(markText).join(' · ')}` : '');
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
  }, [video, seen, phases, skeleton, interval, url]);
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
      <video ref={video} src={url} controls playsInline muted preload="auto" />
      <canvas ref={canvas} className="sprint10-replay-overlay" aria-label="選手の骨格" />
    </div>
    <p className="sprint10-replay-caption" aria-live="polite">{shown || ' '}</p>
    <div className="sprint10-replay-controls">
      <div role="group" aria-label="再生の速さ">{RATES.map(([label, r]) =>
        <button key={label} type="button" aria-pressed={rate === r} onClick={() => setRate(r)}>{label}</button>)}</div>
      <button type="button" onClick={() => step(-1)}>◀ 1コマ</button>
      <button type="button" onClick={() => step(1)}>1コマ ▶</button>
      <label className="sprint10-check"><input type="checkbox" checked={skeleton} onChange={e => setSkeleton(e.target.checked)} />骨格を表示</label>
    </div>
    <div className="sprint10-events" aria-label="判定した瞬間へ移動">{events.map(e =>
      <button key={`${e.label}${e.pts}`} type="button" onClick={() => jump(e.pts)}>{e.label} {e.pts.toFixed(3)}秒</button>)}</div>
  </>;
}
