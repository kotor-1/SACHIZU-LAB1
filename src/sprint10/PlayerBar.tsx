import { useEffect, useState, type RefObject } from 'react';

/** Play/pause and a position slider under a video whose lines are being set,
 * in place of the browser's own controls: on the iPhone their large play
 * button sat in the middle of the picture, over the line (2026-10-04, the
 * user: 「スタート位置調整の時の再生ボタンが邪魔」). */
export default function PlayerBar({ video, url, disabled = false }: { video: RefObject<HTMLVideoElement | null>; url: string; disabled?: boolean }) {
  const [playing, setPlaying] = useState(false), [time, setTime] = useState(0), [duration, setDuration] = useState(0);
  useEffect(() => {
    const v = video.current; if (!v) return;
    const update = () => { setPlaying(!v.paused && !v.ended); setTime(v.currentTime); setDuration(Number.isFinite(v.duration) ? v.duration : 0); };
    const events = ['play', 'pause', 'ended', 'timeupdate', 'seeked', 'loadedmetadata', 'durationchange', 'emptied'];
    for (const e of events) v.addEventListener(e, update);
    update();
    return () => { for (const e of events) v.removeEventListener(e, update); };
  }, [video, url]);
  /** Safari loads a video's pictures only once it has played: a seek before that shows nothing. */
  async function loaded(v: HTMLVideoElement) {
    if (v.readyState >= 2) return;
    const wasMuted = v.muted; v.muted = true;
    await v.play().catch(() => undefined); v.pause(); v.muted = wasMuted;
  }
  async function toggle() {
    const v = video.current; if (!v) return;
    if (v.paused || v.ended) { if (v.ended) v.currentTime = 0; await v.play().catch(() => undefined); } else v.pause();
  }
  async function seek(t: number) {
    const v = video.current; if (!v) return;
    await loaded(v); v.currentTime = t; setTime(t);
  }
  return <div className="sprint10-playerbar">
    <button type="button" aria-label={playing ? '一時停止' : '再生'} disabled={disabled || !url} onClick={() => void toggle()}>{playing ? '❚❚' : '▶'}</button>
    <input type="range" aria-label="動画の位置" min={0} max={duration || 0} step="any" value={Math.min(time, duration || 0)} disabled={disabled || !duration}
      onChange={e => void seek(Number(e.target.value))} />
    <span>{time.toFixed(2)} / {duration.toFixed(2)}秒</span>
  </div>;
}
