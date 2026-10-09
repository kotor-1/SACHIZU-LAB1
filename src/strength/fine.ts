/** The squat's and RDL's pose read with RTMPose-m 384×288 (Halpe26, the posture check's lighter model), the input made
 * by averaging the pixels each input pixel covers (src/posture/model-input.ts), the angles' frames also read mirrored and
 * averaged. The team squats and hinges with the hands on the hips (the user, 2026-10-09: 「チームとして手を腰に当てて
 * エクササイズをします」「手で少し隠れるだけなんだから予測くらいできるでしょ」): the hip joint lies under the hand.
 * RTMPose-m 256×192 put the hip higher than the larger models and the thigh's own axis (the user's squat at the bottom:
 * thigh −14/−12/−11°; this model −11/−9/−9°; RTMPose-l −10/−8/−7°); on videos without the hands there all agree within
 * 1-3°. RTMPose-l was not taken: on an iPhone it runs on WebAssembly (the posture check's start on iPhones), and WebKit
 * named as an iPhone then took 147 s, not 63, and 1.07 GB, not 0.73, for the user's 8 s 4K video. This model is as large
 * as RTMPose-m 256×192 and runs on WebGPU where there is one. */
import * as ort from 'onnxruntime-web';
import { downloadModel } from '../cmj/model-download';
import type { CrouchPoint } from '../sprint10/crouch';
import { FROM_HALPE } from '../sprint10/rtm-refine';
import { cropAround, decode, IH, IW, meanOf, type Crop, type Keypoint } from '../posture/keypoints';
import { areaInput } from '../posture/model-input';

/** The model file and its SHA-256 (public/models/rtmpose/README.md, the posture check's lighter model). */
const FINE_MODEL = 'rtmpose-m-halpe26-384x288.onnx', FINE_SHA256 = 'f04d739dcebb43cce86e589ca65f0934959bf42b787b89f4abaa7111baf38a70';
const ORT_WASM = new URL('../../node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.jsep.wasm', import.meta.url).href;
/** The window drawn from the picture with this margin round it (the rest of the picture is not copied), at most DETAIL
 * picture pixels to an input pixel: the window of a 4K frame copied whole was 10-30 MB of pixels a frame, and WebKit's
 * page peaked at 1.3-1.6 GB, not 0.73 (named as an iPhone). Drawn smaller by the canvas, each input pixel still averages
 * DETAIL × DETAIL of them (model-input.ts). */
const MARGIN = 1.1, DETAIL = 3;

export interface FineModel {
  backend: 'webgpu' | 'wasm';
  /** The keypoints (pixels of `pixels`) in a window, as it is or mirrored. */
  read(pixels: ImageData, crop: Crop, mirrored: boolean): Promise<Keypoint[]>;
}
let opening: Promise<FineModel> | null = null;
/** The model, opened once a page. */
export function loadFineModel(signal: AbortSignal, status: (text: string) => void): Promise<FineModel> {
  opening ??= open(signal, status).catch(e => { opening = null; throw e; });
  return opening;
}
async function open(signal: AbortSignal, status: (text: string) => void): Promise<FineModel> {
  const bytes = await downloadModel(`${import.meta.env.BASE_URL}models/rtmpose/${FINE_MODEL}`, signal, text => status(text.replace('姿勢モデル', '角度用の骨格モデル')), FINE_SHA256);
  const digest = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)), b => b.toString(16).padStart(2, '0')).join('');
  if (digest !== FINE_SHA256) throw new Error('角度用の骨格モデルのファイルが正しくありません。');
  status('角度用の骨格モデルを準備しています…');
  ort.env.wasm.wasmPaths = { wasm: ORT_WASM }; ort.env.wasm.numThreads = 1;
  const gpu = typeof navigator !== 'undefined' && !!(navigator as Navigator & { gpu?: unknown }).gpu;
  for (const ep of (gpu ? ['webgpu', 'wasm'] : ['wasm']) as FineModel['backend'][]) {
    let session: ort.InferenceSession;
    try { session = await ort.InferenceSession.create(bytes, { executionProviders: [ep], graphOptimizationLevel: 'all' }); } catch { continue; }
    const input = new Float32Array(3 * IW * IH);
    return { backend: ep, async read(pixels, crop, mirrored) {
      areaInput(pixels.data, pixels.width, pixels.height, crop, mirrored, input);
      const out = await session.run({ input: new ort.Tensor('float32', input, [1, 3, IH, IW]) });
      return decode(out.simcc_x.data as Float32Array, out.simcc_y.data as Float32Array, crop, mirrored);
    } };
  }
  throw new Error('角度用の骨格モデルを開始できませんでした。');
}

let part: HTMLCanvasElement | null = null;
/** The pose (MediaPipe's indices, normalized) in a picture, the window round `around` (normalized, MediaPipe's); `both`:
 * also read mirrored and averaged (the angles' frames). */
export async function readFine(model: FineModel, source: HTMLCanvasElement, around: readonly CrouchPoint[], both = true): Promise<CrouchPoint[] | null> {
  const W = source.width, H = source.height;
  const crop = cropAround(around.map(p => ({ x: p.x * W, y: p.y * H, score: p.visibility ?? 0 })));
  if (!crop) return null;
  // Only the window's part of the picture is copied for the model's input (a 4K frame is 33 MB of pixels).
  const hw = crop.scale * IW / 2 * MARGIN, hh = crop.scale * IH / 2 * MARGIN;
  const x0 = Math.max(0, Math.floor(crop.cx - hw)), y0 = Math.max(0, Math.floor(crop.cy - hh));
  const x1 = Math.min(W, Math.ceil(crop.cx + hw)), y1 = Math.min(H, Math.ceil(crop.cy + hh));
  if (x1 - x0 < 2 || y1 - y0 < 2) return null;
  const f = Math.min(1, DETAIL / crop.scale), w = Math.max(1, Math.round((x1 - x0) * f)), h = Math.max(1, Math.round((y1 - y0) * f));
  // One canvas for every frame, grown when needed (a new one each frame left their pixels to the collector).
  part ??= document.createElement('canvas');
  if (part.width < w || part.height < h) { part.width = Math.max(part.width, w); part.height = Math.max(part.height, h); }
  const ctx = part.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(source, x0, y0, x1 - x0, y1 - y0, 0, 0, w, h);
  const pixels = ctx.getImageData(0, 0, w, h), inPart = { cx: (crop.cx - x0) * f, cy: (crop.cy - y0) * f, scale: crop.scale * f };
  const first = await model.read(pixels, inPart, false), k = both ? meanOf([first, await model.read(pixels, inPart, true)]) : first;
  const at = (q: Keypoint, visibility: number) => ({ x: (q.x / f + x0) / W, y: (q.y / f + y0) / H, visibility });
  return Array.from({ length: 33 }, (_, i) => i in FROM_HALPE ? at(k[FROM_HALPE[i]], k[FROM_HALPE[i]].score) : at(k[0], 0));
}
