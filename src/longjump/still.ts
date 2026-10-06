import { useEffect, useState } from 'react';

/** One frame of the video as a still at full size, for the ruler's points: the camera moved 15-30 px over a test video
 * (so the points are set at the takeoff, not on the first frame), and a point needs a pixel or two. As the sprint's
 * first frame (a hidden, muted copy of the video, which Safari will show without a tap). */
export interface Still { image: string; width: number; height: number; at: number }

function waitFor(v: HTMLVideoElement, event: string, ms: number) {
  return new Promise<void>((resolve, reject) => {
    const done = () => { clearTimeout(timer); v.removeEventListener(event, done); resolve(); };
    const timer = setTimeout(() => { v.removeEventListener(event, done); reject(new Error(`${event} timed out`)); }, ms);
    v.addEventListener(event, done);
  });
}

export async function stillAt(url: string, at: number, timeoutMs = 15000): Promise<Still | null> {
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
    const seeked = waitFor(v, 'seeked', timeoutMs); v.currentTime = at; await seeked;
    await new Promise<void>(r => requestAnimationFrame(() => r()));
    if (!v.videoWidth || !v.videoHeight) return null;
    const canvas = document.createElement('canvas');
    canvas.width = v.videoWidth; canvas.height = v.videoHeight;
    const ctx = canvas.getContext('2d'); if (!ctx) return null;
    ctx.drawImage(v, 0, 0);
    return { image: canvas.toDataURL('image/jpeg', .9), width: v.videoWidth, height: v.videoHeight, at };
  } catch { return null; }
  finally { v.pause(); v.removeAttribute('src'); v.load(); v.remove(); }
}

/** The still at `at` s (null while it is made, or when it cannot be). */
export function useStill(url: string, at: number | null): Still | null {
  const [still, setStill] = useState<Still | null>(null);
  useEffect(() => {
    let closed = false; setStill(null);
    if (url && at !== null) void stillAt(url, at).then(s => { if (!closed) setStill(s); });
    return () => { closed = true; };
  }, [url, at]);
  return still;
}
