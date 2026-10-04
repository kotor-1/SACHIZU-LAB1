import { useEffect, useState } from 'react';

/** A video file's first frame as a still picture, so the lines can be placed on
 * it before the video is played: Safari shows no picture of a chosen video
 * (and the lines waited for one) until the user pressed play (2026-10-04,
 * the user: 「動画を再生しないと設定できないのが手間」). */
export interface FirstFrame { image: string; width: number; height: number }
/** Largest width of the still (pixels); the lines need no more. */
const STILL_WIDTH = 1280;

function waitFor(v: HTMLVideoElement, event: string, ms: number) {
  return new Promise<void>((resolve, reject) => {
    const done = () => { clearTimeout(timer); v.removeEventListener(event, done); resolve(); };
    const timer = setTimeout(() => { v.removeEventListener(event, done); reject(new Error(`${event} timed out`)); }, ms);
    v.addEventListener(event, done);
  });
}

/** The first frame from a hidden, muted copy of the video (a muted video may
 * play without a tap, which makes Safari load its pictures); null when the
 * browser gives none. */
export async function firstFrame(url: string, timeoutMs = 15000): Promise<FirstFrame | null> {
  const v = document.createElement('video');
  v.muted = true; v.playsInline = true; v.preload = 'auto';
  v.style.cssText = 'position:fixed;left:-10000px;top:0;width:320px;height:180px;pointer-events:none';
  document.body.appendChild(v);
  try {
    const meta = waitFor(v, 'loadedmetadata', timeoutMs);
    v.src = url; v.load(); await meta;
    if (v.readyState < 2) {
      const data = waitFor(v, 'loadeddata', timeoutMs);
      await v.play().catch(() => undefined); v.pause();
      if (v.readyState < 2) await data;
    }
    if (v.currentTime > 0) { const seeked = waitFor(v, 'seeked', timeoutMs); v.currentTime = 0; await seeked; }
    await new Promise<void>(r => requestAnimationFrame(() => r()));
    if (!v.videoWidth || !v.videoHeight) return null;
    const scale = Math.min(1, STILL_WIDTH / v.videoWidth), canvas = document.createElement('canvas');
    canvas.width = Math.round(v.videoWidth * scale); canvas.height = Math.round(v.videoHeight * scale);
    const ctx = canvas.getContext('2d'); if (!ctx) return null;
    ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
    return { image: canvas.toDataURL('image/jpeg', .85), width: v.videoWidth, height: v.videoHeight };
  } catch { return null; }
  finally { v.pause(); v.removeAttribute('src'); v.load(); v.remove(); }
}

/** The first frame of the chosen video (null until made, or when it cannot be). */
export function useFirstFrame(url: string): FirstFrame | null {
  const [still, setStill] = useState<FirstFrame | null>(null);
  useEffect(() => {
    let closed = false; setStill(null);
    if (url) void firstFrame(url).then(f => { if (!closed) setStill(f); });
    return () => { closed = true; };
  }, [url]);
  return still;
}
