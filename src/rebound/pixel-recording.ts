import { demuxMP4 } from '../frame-engine/mp4-demuxer';
import { SequentialRecordingDecoder } from '../cmj/sequential-decoder';
import { trackRotation } from '../cmj/video-orientation';
import { untilAborted } from '../cmj/session-lifecycle';
import type { PoseFrame } from './prediction-observations';
import type { SubjectRegion } from './subject';
import { createLowerSubjectSelector, type JumpMode } from './lower-body';
import type { RegisteredAnalysis } from './registered-template';
import { darkFootEdge, type FootEdge, type PixelRow } from './pixel-foot';
import {missingPixelSeed} from './review-refinement';

/** Second decode pass, no second pose inference. Only event neighbourhoods
 * receive pixel processing. VideoFrame lifetime stays bounded by the decoder. */
export async function collectPixelRows(file: File, poses: readonly PoseFrame[], region: SubjectRegion, base: RegisteredAnalysis,
  signal: AbortSignal, progress: (percent: number) => void, mode: JumpMode = 'BOTH'): Promise<PixelRow[]> {
  const check = () => { if (signal.aborted) throw new DOMException('中止', 'AbortError'); };
  check();
  if (file.size > 150 * 1024 * 1024) throw new Error('150MB以内の動画を選んでください。');
  const d = await untilAborted(demuxMP4(file), signal); check();
  if (!d.frames.length || d.frames.length > 3600 || d.frames.at(-1)!.pts - d.frames[0].pts > 30 || poses.length !== d.frames.length
    || d.frames.some((f, i) => poses[i].frame !== f.frameIndex || Math.abs(poses[i].pts - f.pts) > 1e-7)) throw new Error('骨格と元動画のフレームが一致しません。');
  const rotation = trackRotation((d.videoTrack as typeof d.videoTrack & { matrix?: ArrayLike<number> }).matrix);
  const decoder = new SequentialRecordingDecoder(file, d.videoTrack, d.frames, d.rawSamples, d.descriptionBuffer);
  const stop = () => decoder.dispose(); signal.addEventListener('abort', stop, { once: true });
  const canvas = document.createElement('canvas'), context = canvas.getContext('2d', { willReadFrequently: true });
  const seeds = base.jumps.flatMap((j,i) => (['takeoff','landing'] as const).flatMap(kind=>{
    const nominal=j[kind]?[j[kind]!.pts]:[];
    if(j[kind]?.source==='MANUAL')return nominal;
    const seed=missingPixelSeed(base,poses,i,kind);
    return seed===null?nominal:[...nominal,seed-.04,seed,seed+.04];
  }));
  const select = createLowerSubjectSelector(region, mode), rows: PixelRow[] = [];
  let lastYield = performance.now();
  try {
    if (!context) throw new Error('足元の画像を読み出せません。');
    for (const f of d.frames) {
      check(); const selected = select(poses[f.frameIndex].poses, f.pts);
      const decoded = await untilAborted(decoder.decodeExactFrame(f.frameIndex), signal); check();
      if (decoded.status !== 'SUCCESS' || !decoded.bitmap || decoded.actualDecodedFrameIndex !== f.frameIndex) throw new Error('元動画のコマを正確に読み出せません。');
      if (seeds.some(t => Math.abs(t - f.pts) <= .19)) {
        const image = decoded.bitmap, portrait = rotation % 180 !== 0;
        const w = portrait ? image.height : image.width, h = portrait ? image.width : image.height, scale = 960 / h;
        if (canvas.height !== 960 || canvas.width !== Math.round(w * scale)) { canvas.width = Math.round(w * scale); canvas.height = 960; }
        context.setTransform(1, 0, 0, 1, 0, 0); context.clearRect(0, 0, canvas.width, canvas.height);
        context.translate(canvas.width / 2, canvas.height / 2); context.rotate(rotation * Math.PI / 180); context.scale(scale, scale);
        context.drawImage(image, -image.width / 2, -image.height / 2); context.setTransform(1, 0, 0, 1, 0, 0);
        const rgba = context.getImageData(0, 0, canvas.width, canvas.height).data, pixels = new Uint8Array(canvas.width * canvas.height);
        for (let i = 0; i < pixels.length; i++) pixels[i] = (77 * rgba[i * 4] + 150 * rgba[i * 4 + 1] + 29 * rgba[i * 4 + 2]) >> 8;
        const p = selected[0];
        const valid = (side: number) => [29 + side, 31 + side].every(i => p?.[i] && p[i].visibility >= .5 && Number.isFinite(p[i].x) && Number.isFinite(p[i].y));
        const centers = [0, 1].map(side => valid(side) ? (p[29 + side].x + p[31 + side].x) / 2 * canvas.width : NaN);
        const feet = ([0, 1] as const).map((side): FootEdge => {
          if (selected.length !== 1 || !valid(side)) return { ys: null, contrast: 0, reason: 'FOOT_POSE_MISSING' };
          // Even single-leg mode must not extract the other foot when its
          // image overlaps the support foot's search box.
          if (Number.isFinite(centers[0]) && Number.isFinite(centers[1]) && Math.abs(centers[0] - centers[1]) < 52) return { ys: null, contrast: 0, reason: 'FEET_OVERLAP' };
          return darkFootEdge({ width: canvas.width, height: canvas.height, pixels }, {
            x: centers[side] - 26, y: Math.max(p[29 + side].y, p[31 + side].y) * canvas.height - 25, width: 52, height: 90 });
        }) as [FootEdge, FootEdge];
        rows.push({ frame: f.frameIndex, pts: f.pts, feet });
      }
      if (performance.now() - lastYield > 40) { progress(Math.round((f.frameIndex + 1) / d.frames.length * 100)); await new Promise<void>(resolve => setTimeout(resolve, 0)); lastYield = performance.now(); }
    }
    check(); progress(100); return rows;
  } finally { signal.removeEventListener('abort', stop); decoder.dispose(); }
}
