/** Finding a frame in a video element: the frames' interval, the time inside a frame to seek to, and waiting for the
 * seek (the phase pictures, the replay, the skeleton set by hand). */
import type { CrouchFrame } from './crouch';

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

export function once(target: HTMLVideoElement, event: string, ms: number) {
  return new Promise<void>((resolve, reject) => {
    const done = () => { clearTimeout(timer); target.removeEventListener(event, done); resolve(); };
    const timer = setTimeout(() => { target.removeEventListener(event, done); reject(new Error(`${event} timed out`)); }, ms);
    target.addEventListener(event, done);
  });
}
export async function seekTo(v: HTMLVideoElement, t: number) {
  const seeked = once(v, 'seeked', 8000);
  v.currentTime = t; await seeked;
  await new Promise<void>(r => requestAnimationFrame(() => r()));
}
