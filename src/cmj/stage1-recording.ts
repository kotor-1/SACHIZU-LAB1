import type { NormalizedLandmark } from '@mediapipe/tasks-vision';
import type { FrameInfo, VideoMetadata } from '../frame-engine/types';
import { darkFootEdge, brightFootEdge, type FootEdge, type GrayImage, type FootBox } from '../rebound/pixel-foot';
import { footBoxesForPair } from '../rebound/foot-boxes';
import { analyzeStage1, type Stage1Analysis, type Stage1Observation, type SoleObservation } from './stage1-analysis';
import { measureRecording, supportsExactRecording } from './recording-session';
import { POSE_MODEL_HASHES } from './mobile-pose';
import { untilAborted } from './session-lifecycle';
import type { SessionUpdate } from './video-session';

type FootPoints = Pick<SoleObservation, 'toe' | 'heel'>;
type Pair<T> = [T, T];
type Polarity = 'DARK' | 'BRIGHT';
export interface Stage1PixelObservation {
  frame: number; pts: number;
  darkFeet: Pair<FootEdge>; brightFeet: Pair<FootEdge>;
  points: Pair<FootPoints>; boxes: Pair<FootBox | null>; poseCount: number;
}
export const STAGE1_PIXEL_POLICY = {
  version: 'stage1-pixel-crops-v1', imageHeight: 960, minimumFootVisibility: .5,
  rasterHalfPixel: .5,
  occludedHeelCrop: 'TOE_LOCALIZATION_ONLY',
  polaritySelection: 'PER_FOOT_VALID_COUNT_THEN_SUM_CONTRAST_DARK_TIE',
} as const;

/** Pose defines only the image search region. No landmark becomes a sole edge. */
export function extractStage1Feet(image: GrayImage, poses: readonly NormalizedLandmark[][]): Omit<Stage1PixelObservation, 'frame' | 'pts'> {
  const pose = poses.length === 1 ? poses[0] : undefined;
  const point = (index: number): SoleObservation['toe'] => {
    const p = pose?.[index];
    return p && [p.x, p.y, p.visibility].every(Number.isFinite)
      ? { x: p.x * image.width, y: p.y * image.height, visibility: p.visibility } : undefined;
  };
  const points: Pair<FootPoints> = [{ heel: point(29), toe: point(31) }, { heel: point(30), toe: point(32) }];
  const usable = (q: SoleObservation['toe']) => q && q.visibility >= STAGE1_PIXEL_POLICY.minimumFootVisibility
    && q.x > 0 && q.x < image.width && q.y > 0 && q.y < image.height;
  const valid = points.map(p => !!usable(p.toe));
  // Front views may hide the heel. The visible toe still localizes pixels;
  // it cannot supply an edge, ground contact, or a replacement COM sample.
  const centers = points.map((p, side) => valid[side]
    ? usable(p.heel) ? (p.toe!.x + p.heel!.x) / 2 : p.toe!.x : NaN) as Pair<number>;
  const bottoms = points.map((p, side) => valid[side]
    ? usable(p.heel) ? Math.max(p.toe!.y, p.heel!.y) : p.toe!.y : NaN) as Pair<number>;
  const boxes = footBoxesForPair(centers, bottoms);
  const measure = (side: 0 | 1, polarity: Polarity): FootEdge => {
    if (!valid[side]) return { ys: null, contrast: 0, reason: poses.length !== 1 ? 'POSE_NOT_UNIQUE' : 'FOOT_POSE_MISSING' };
    if (!boxes[side]) return { ys: null, contrast: 0, reason: 'FEET_OVERLAP' };
    return polarity === 'DARK' ? darkFootEdge(image, boxes[side]) : brightFootEdge(image, boxes[side]);
  };
  return { points, boxes, poseCount: poses.length,
    darkFeet: [measure(0, 'DARK'), measure(1, 'DARK')], brightFeet: [measure(0, 'BRIGHT'), measure(1, 'BRIGHT')] };
}

/** One fixed polarity per foot for the entire run, independent of height. */
export function selectStage1Polarities(rows: readonly Stage1PixelObservation[]): Pair<Polarity> {
  return ([0, 1] as const).map(side => {
    const score = (key: 'darkFeet' | 'brightFeet') => rows.reduce((s, row) => {
      const edge = row[key][side];
      return edge.ys ? [s[0] + 1, s[1] + edge.contrast] : s;
    }, [0, 0]);
    const dark = score('darkFeet'), bright = score('brightFeet');
    return bright[0] > dark[0] || (bright[0] === dark[0] && bright[1] > dark[1]) ? 'BRIGHT' : 'DARK';
  }) as Pair<Polarity>;
}

export interface Stage1RecordingRun {
  version: 'cmj-stage1-recording-v1'; stage: 'RECORDING_ONLY';
  file: { name: string; size: number; type: string; lastModified: number; sha256: string };
  acquisition: 'EXACT_FRAMES'; frameCount: number; stride: 1;
  poseModel: 'full'; modelSha256: string; backend: 'CPU';
  rotation: number; metadata: Readonly<VideoMetadata> | null;
  sourceFrames: Readonly<FrameInfo>[]; frameTimes: number[]; frameIntervals: number[];
  coordinates: { comX: string; vertical: string; footX: string };
  observations: Stage1Observation[]; pixelObservations: Stage1PixelObservation[];
  pixelPolicy: typeof STAGE1_PIXEL_POLICY; polarities: Pair<Polarity>;
  analysis: Stage1Analysis; elapsedSeconds: number;
  decodeDiagnostics: SessionUpdate['decodeDiagnostics'];
}

/** Full-model, one-pass recording experiment. Every original PTS is retained. */
export async function runStage1Recording(file: File, canvas: HTMLCanvasElement, signal: AbortSignal,
  progress: (done: number, total: number, message: string) => void): Promise<Stage1RecordingRun> {
  const check = () => { if (signal.aborted) throw new DOMException('中止', 'AbortError'); };
  check();
  if (file.size > 150 * 1024 * 1024) throw new Error('150MB以内・1回のジャンプを含む短い動画を選んでください。');
  if (!supportsExactRecording(file)) throw new Error('元フレームを順番に読み出せるブラウザで、MP4・MOV・M4V動画を選んでください。');
  const started = performance.now();
  progress(0, 0, '動画のSHA-256を記録しています。');
  const bytes = await untilAborted(file.arrayBuffer(), signal); check();
  const digest = await untilAborted(crypto.subtle.digest('SHA-256', bytes), signal); check();
  const sha256 = Array.from(new Uint8Array(digest), value => value.toString(16).padStart(2, '0')).join('');
  const pixelsCanvas = document.createElement('canvas');
  const context = pixelsCanvas.getContext('2d', { willReadFrequently: true });
  if (!context) throw new Error('足元の画像を読み出せません。');
  const base: Omit<Stage1Observation, 'feet'>[] = [], pixelObservations: Stage1PixelObservation[] = [];
  const sourceFrames: Readonly<FrameInfo>[] = [];
  let rotation = 0, done = 0, total = 0, metadata: Readonly<VideoMetadata> | null = null;
  let decodeDiagnostics: SessionUpdate['decodeDiagnostics'];
  try {
    await measureRecording(file, canvas, signal, state => {
      check(); done = state.processedFrames; total = state.totalFrames ?? 0;
      decodeDiagnostics = state.decodeDiagnostics;
      progress(done, total, '元フレームの重心と左右の靴底輪郭を確認しています。');
    }, message => { check(); progress(done, total, message); }, {
      analysis: 'OBSERVATIONS', observationModel: 'full',
      onDecodedFrame: frame => {
        check();
        const { bitmap, poses, sample } = frame;
        rotation = frame.rotation; metadata = frame.metadata;
        const portrait = rotation % 180 !== 0;
        const width = portrait ? bitmap.height : bitmap.width, height = portrait ? bitmap.width : bitmap.height;
        const scale = STAGE1_PIXEL_POLICY.imageHeight / height;
        if (pixelsCanvas.width !== Math.round(width * scale) || pixelsCanvas.height !== STAGE1_PIXEL_POLICY.imageHeight) {
          pixelsCanvas.width = Math.round(width * scale); pixelsCanvas.height = STAGE1_PIXEL_POLICY.imageHeight;
        }
        context.setTransform(1, 0, 0, 1, 0, 0); context.clearRect(0, 0, pixelsCanvas.width, pixelsCanvas.height);
        context.translate(pixelsCanvas.width / 2, pixelsCanvas.height / 2);
        context.rotate(rotation * Math.PI / 180); context.scale(scale, scale);
        context.drawImage(bitmap, -bitmap.width / 2, -bitmap.height / 2); context.setTransform(1, 0, 0, 1, 0, 0);
        const rgba = context.getImageData(0, 0, pixelsCanvas.width, pixelsCanvas.height).data;
        const pixels = new Uint8Array(pixelsCanvas.width * pixelsCanvas.height);
        for (let i = 0; i < pixels.length; i++) pixels[i] = (77 * rgba[i * 4] + 150 * rgba[i * 4 + 1] + 29 * rgba[i * 4 + 2]) >> 8;
        const feet = extractStage1Feet({ width: pixelsCanvas.width, height: pixelsCanvas.height, rgba, pixels }, poses);
        pixelObservations.push({ frame: sample.frame, pts: sample.pts, ...feet });
        base.push({ ...sample }); sourceFrames.push({ ...frame.sourceFrame });
      },
    });
    check();
    if (total !== base.length || base.length !== pixelObservations.length) throw new Error('元動画と観測したフレーム数が一致しません。');
    const polarities = selectStage1Polarities(pixelObservations);
    const observations = base.map((sample, i): Stage1Observation => ({ ...sample,
      feet: ([0, 1] as const).map(side => {
        const row = pixelObservations[i], chosen = polarities[side] === 'DARK' ? row.darkFeet[side] : row.brightFeet[side];
        return { ...row.points[side], edge: chosen.ys
          ? [Math.min(...chosen.ys) - STAGE1_PIXEL_POLICY.rasterHalfPixel, Math.max(...chosen.ys) + STAGE1_PIXEL_POLICY.rasterHalfPixel]
          : null, ...(chosen.reason ? { reason: chosen.reason } : {}) };
      }) as Pair<SoleObservation>,
    }));
    progress(done, total, '固定した条件でB・A・旧COM方式を比較しています。');
    const analysis = analyzeStage1(observations); check();
    const frameTimes = observations.map(row => row.pts);
    return { version: 'cmj-stage1-recording-v1', stage: 'RECORDING_ONLY',
      file: { name: file.name, size: file.size, type: file.type, lastModified: file.lastModified, sha256 },
      acquisition: 'EXACT_FRAMES', frameCount: observations.length, stride: 1, poseModel: 'full',
      modelSha256: POSE_MODEL_HASHES.full, backend: 'CPU', rotation, metadata, sourceFrames, frameTimes,
      frameIntervals: frameTimes.slice(1).map((pts, i) => pts - frameTimes[i]),
      coordinates: { comX: 'normalized image x × 960 (unchanged legacy domain)',
        vertical: 'image-height 960 units, down-positive; no physical calibration', footX: 'rotated 960-height canvas pixel x' },
      observations, pixelObservations, pixelPolicy: STAGE1_PIXEL_POLICY, polarities, analysis,
      elapsedSeconds: (performance.now() - started) / 1000, decodeDiagnostics };
  } finally { pixelsCanvas.width = 0; pixelsCanvas.height = 0; }
}
