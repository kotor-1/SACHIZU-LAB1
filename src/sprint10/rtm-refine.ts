import * as ort from 'onnxruntime-web';
import { downloadModel } from '../cmj/model-download';
import type { CrouchPoint } from './crouch';

/** The athlete's pose once more, with RTMPose-m (Halpe26), inside the box of
 * the MediaPipe pose that found and followed the athlete. Used for the angles
 * and the skeleton shown; contacts stay on MediaPipe's toes (2026-10-04, the
 * user's choice after a study on 3 videos: RTMPose fitted the body better, in
 * the crouched set above all, where MediaPipe's knees collapsed; on its toes
 * touchdown was up to 4.7 frames off the picture, MediaPipe's 2.2).
 * RTMPose (OpenMMLab, Apache-2.0); the Body7 weights were trained with data
 * limited to non-commercial use: the app is non-commercial (the user, 2026-10-04). */
export const RTM_MODEL = 'rtmpose-m-halpe26-256x192.onnx';
/** Checked before use (public/models/rtmpose/README.md). */
export const RTM_MODEL_SHA256 = '26f3a19e61304a600dfb82d1001d41d24343b89fc70a33ffc84657e0b0bf2ecf';
const ORT_WASM = new URL('../../node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.jsep.wasm', import.meta.url).href;
const IW = 192, IH = 256, MEAN = [123.675, 116.28, 103.53], STD = [58.395, 57.12, 57.375];
/** Halpe26 keypoints in MediaPipe's 33 indices (toes: the big toes). */
const FROM_HALPE: Record<number, number> = { 0: 0, 11: 5, 12: 6, 13: 7, 14: 8, 15: 9, 16: 10, 23: 11, 24: 12, 25: 13, 26: 14, 27: 15, 28: 16, 29: 24, 30: 25, 31: 20, 32: 21 };

/** The model's input window (pixels): the pose's box widened 1.25 times to 3:4, as RTMPose was trained. */
export function cropOf(pose: readonly CrouchPoint[], width: number, height: number) {
  const seen = pose.filter(p => Number.isFinite(p.x) && Number.isFinite(p.y) && (p.visibility ?? 1) >= .3);
  if (seen.length < 5) return null;
  const xs = seen.map(p => p.x * width), ys = seen.map(p => p.y * height);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  let w = Math.max(1, (x1 - x0) * 1.25), h = Math.max(1, (y1 - y0) * 1.25);
  if (w / h > IW / IH) h = w * IH / IW; else w = h * IW / IH;
  return { cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, scale: w / IW };
}

/** SimCC outputs (26 keypoints, 2 bins a pixel) to a pose in MediaPipe's
 * indices, normalized to the picture; visibility is the SimCC score. */
export function decodePose(simccX: ArrayLike<number>, simccY: ArrayLike<number>, crop: { cx: number; cy: number; scale: number },
  width: number, height: number): CrouchPoint[] {
  const K = 26, NX = simccX.length / K, NY = simccY.length / K, halpe: CrouchPoint[] = [];
  for (let k = 0; k < K; k++) {
    let bx = 0, by = 0;
    for (let j = 1; j < NX; j++) if (simccX[k * NX + j] > simccX[k * NX + bx]) bx = j;
    for (let j = 1; j < NY; j++) if (simccY[k * NY + j] > simccY[k * NY + by]) by = j;
    halpe.push({ x: (crop.cx + (bx / 2 - IW / 2) * crop.scale) / width, y: (crop.cy + (by / 2 - IH / 2) * crop.scale) / height,
      visibility: Math.min(simccX[k * NX + bx], simccY[k * NY + by]) });
  }
  return Array.from({ length: 33 }, (_, i) => i in FROM_HALPE ? { ...halpe[FROM_HALPE[i]] } : { ...halpe[0], visibility: 0 });
}

export interface Refiner {
  backend: 'webgpu' | 'wasm';
  /** RTMPose in the box of `pose` (normalized) on `source` (the whole frame); null without a box. */
  refine(source: HTMLCanvasElement, pose: readonly CrouchPoint[]): Promise<CrouchPoint[] | null>;
}
let loading: Promise<Refiner> | null = null;
/** The model, loaded once a page (55.7 MB; WebGPU when the browser has it, else WebAssembly). */
export function loadRefiner(signal: AbortSignal, status: (text: string) => void): Promise<Refiner> {
  loading ??= create(signal, status).catch(e => { loading = null; throw e; });
  return loading;
}
async function create(signal: AbortSignal, status: (text: string) => void): Promise<Refiner> {
  const bytes = await downloadModel(`${import.meta.env.BASE_URL}models/rtmpose/${RTM_MODEL}`, signal, text => status(text.replace('姿勢モデル', '高精度の骨格モデル')));
  const digest = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)), b => b.toString(16).padStart(2, '0')).join('');
  if (digest !== RTM_MODEL_SHA256) throw new Error('高精度の骨格モデルのファイルが正しくありません。');
  status('高精度の骨格モデルを準備しています…');
  ort.env.wasm.wasmPaths = { wasm: ORT_WASM }; ort.env.wasm.numThreads = 1;
  let session: ort.InferenceSession | null = null, backend: Refiner['backend'] = 'wasm';
  const gpu = typeof navigator !== 'undefined' && !!(navigator as Navigator & { gpu?: unknown }).gpu;
  for (const ep of (gpu ? ['webgpu', 'wasm'] : ['wasm']) as Refiner['backend'][]) {
    try { session = await ort.InferenceSession.create(bytes, { executionProviders: [ep], graphOptimizationLevel: 'all' }); backend = ep; break; } catch { /* the next */ }
  }
  if (!session) throw new Error('高精度の骨格モデルを開始できませんでした。');
  const model = session, crop = document.createElement('canvas');
  crop.width = IW; crop.height = IH;
  const ctx = crop.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('映像処理を開始できません。');
  const input = new Float32Array(3 * IW * IH);
  return { backend, async refine(source, pose) {
    const W = source.width, H = source.height, c = cropOf(pose, W, H);
    if (!c) return null;
    // The window may reach past the picture: draw only its part inside, the rest left black (as in training).
    const sx = c.cx - IW / 2 * c.scale, sy = c.cy - IH / 2 * c.scale, x0 = Math.max(0, sx), y0 = Math.max(0, sy);
    const x1 = Math.min(W, sx + IW * c.scale), y1 = Math.min(H, sy + IH * c.scale);
    ctx.clearRect(0, 0, IW, IH);
    if (x1 > x0 && y1 > y0) ctx.drawImage(source, x0, y0, x1 - x0, y1 - y0, (x0 - sx) / c.scale, (y0 - sy) / c.scale, (x1 - x0) / c.scale, (y1 - y0) / c.scale);
    const rgba = ctx.getImageData(0, 0, IW, IH).data, N = IW * IH;
    for (let i = 0; i < N; i++) for (let ch = 0; ch < 3; ch++) input[ch * N + i] = (rgba[4 * i + ch] - MEAN[ch]) / STD[ch];
    const out = await model.run({ input: new ort.Tensor('float32', input, [1, 3, IH, IW]) });
    return decodePose(out.simcc_x.data as Float32Array, out.simcc_y.data as Float32Array, c, W, H);
  } };
}
