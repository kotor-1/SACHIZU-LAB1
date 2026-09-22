import { useEffect, useRef, type RefObject } from 'react';
import type { PoseFrame } from './prediction-observations';
import { drawPose, nearestPoseFrame } from '../cmj/pose-drawing';

/** Synchronize to presented media time, not wall time. Never reuse poses across gaps. */
export default function PoseReplay({ video, frames }: { video: RefObject<HTMLVideoElement | null>; frames: readonly PoseFrame[] }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const v = video.current, c = canvas.current, ctx = c?.getContext('2d');
    if (!v || !c || !ctx) return;
    let callback = 0, closed = false;
    const clear = () => { ctx.clearRect(0, 0, c.width, c.height); delete c.dataset.frame; };
    const draw = (pts: number) => {
      clear(); if (v.seeking || !v.videoWidth) return;
      c.width = v.videoWidth; c.height = v.videoHeight;
      const f = nearestPoseFrame(frames, pts);
      if (f) { drawPose(ctx, f.poses, f.frame, f.pts); c.dataset.frame = String(f.frame); }
    };
    const changed = () => draw(v.currentTime);
    const next = (_now: number, meta: VideoFrameCallbackMetadata) => {
      if (closed) return;
      draw(meta.mediaTime); callback = v.requestVideoFrameCallback(next);
    };
    for (const event of ['seeked', 'loadeddata', 'timeupdate', 'pause']) v.addEventListener(event, changed);
    v.addEventListener('seeking', clear); changed();
    if (v.requestVideoFrameCallback) callback = v.requestVideoFrameCallback(next);
    return () => {
      closed = true; if (callback) v.cancelVideoFrameCallback(callback);
      for (const event of ['seeked', 'loadeddata', 'timeupdate', 'pause']) v.removeEventListener(event, changed);
      v.removeEventListener('seeking', clear); clear();
    };
  }, [video, frames]);
  return <canvas ref={canvas} aria-label="RJの骨格と推定重心" className="rj-pose-overlay" />;
}
