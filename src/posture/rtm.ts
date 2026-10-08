/** RTMPose-l 384x288 (Halpe26), the posture check's own model: a window of the picture, as it is or mirrored, averaged
 * over each input pixel (model-input.ts) and read to a part of the model's bin (keypoints.ts). The other analyses keep
 * RTMPose-m 256x192 (rtm-refine.ts): on the user's front photo it read the head's tilt 2° off the glasses' line, the
 * other way, where this one was within 0.1–0.6° (docs/Posture_v1_20261008.md). Its weights are stored as float16 (56 MB,
 * not 113: GitHub Pages takes files under 100 MB) and widened back to float32 here; rounding them moved no measure by
 * more than 0.02°. */
import * as ort from 'onnxruntime-web';
import { downloadModel } from '../cmj/model-download';
import { cropAround, decode, headCrop, IH, IW, meanOf, resized, withHead, type Crop, type Keypoint } from './keypoints';
import { areaInput, widen } from './model-input';

export const POSTURE_MODEL = 'rtmpose-l-halpe26-384x288';
/** When the large model cannot be made on a device: RTMPose-m at the same input (288x384), one plain float32 file
 * (56 MB). The reading is the same, a little coarser: on the user's front photo it read the head's tilt 0.7–1.2° off the
 * glasses' line, where the large one was within 0.6°. The user's iPhone could make the large one neither on WebGPU nor
 * on WebAssembly (2026-10-08; why is not known yet, so the page tells which way failed). */
export const LIGHT_MODEL = 'rtmpose-m-halpe26-384x288';
/** Checked before use (public/models/rtmpose/README.md). */
const SHA256 = {
  graph: '7b7fb0efc8f986b9549b4c96b8223f3d6f93b113a0b519294cfb210e82da97ea',
  weights: 'd0ddc25f794e951bd85f2e03eeeb84cbbf95646ec69e66a49ff228d0510f32de',
  light: 'f04d739dcebb43cce86e589ca65f0934959bf42b787b89f4abaa7111baf38a70',
};
const ORT_WASM = new URL('../../node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.jsep.wasm', import.meta.url).href;

export type Picture = HTMLCanvasElement | ImageBitmap;
export type Backend = 'webgpu' | 'wasm';
export interface PostureModel {
  backend: Backend;
  /** 'l': RTMPose-l, the posture check's model; 'm': RTMPose-m, when the large one could not be made on the device. */
  size: 'l' | 'm';
  /** The keypoints in a window of the picture (pixels); `mirrored`: the window drawn mirrored (read back unmirrored). */
  read(picture: Picture, crop: Crop, mirrored: boolean): Promise<Keypoint[]>;
}

const hex = async (bytes: Uint8Array<ArrayBuffer>) => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)), b => b.toString(16).padStart(2, '0')).join('');
const BROKEN = '姿勢解析の骨格モデルのファイルが正しくありません。';
/** A large buffer let go at once (detached), not when the garbage is next collected: a photo opened just after the model
 * otherwise came on top of the model's 170 MB of spent buffers. Without ArrayBuffer.transfer (Safari before 17.4) it
 * waits for the collector. */
const letGo = (bytes: ArrayBufferView) => { (bytes.buffer as ArrayBuffer & { transfer?: (length?: number) => ArrayBuffer }).transfer?.(0); };
/** The weights: downloaded as float16, checked, widened to float32. The float16 bytes are let go when this returns, before
 * the session copies the weights in (a phone's memory: the page held 0.63 GB just after the model was made). */
async function weightsOf(url: string, signal: AbortSignal, say: (text: string) => void) {
  const half = await downloadModel(url, signal, say);
  if (await hex(half) !== SHA256.weights) throw new Error(BROKEN);
  const weights = new Uint8Array(widen(new Uint16Array(half.buffer, half.byteOffset, half.byteLength / 2)).buffer);
  letGo(half);
  return weights;
}

const DIR = `${import.meta.env.BASE_URL}models/rtmpose/`;
// 'basic': the fullest level rebuilds the weights in a CPU layout, which took the page 0.2 GB more while the session was
// made (0.74 GB, not 0.54, in WebKit) for 5% faster runs; and the weights are not packed a second time.
const SESSION = { graphOptimizationLevel: 'basic', extra: { session: { disable_prepacking: '1' } } } as const;
const said = (e: unknown) => (e instanceof Error ? `${e.name}: ${e.message}` : String(e)).replace(/\s+/g, ' ').slice(0, 140);
/** An iPhone or iPad (iPadOS says it is a Mac with a touch screen). */
const appleMobile = () => typeof navigator !== 'undefined'
  && (/iP(hone|ad|od)/.test(navigator.userAgent) || (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1));
type Made = { session: ort.InferenceSession; backend: Backend; size: 'l' | 'm' };

/** The large model on each way in turn; null when none made it (each reason added to `failed`). Its weights are let go
 * before this returns, so a fallback does not start with them still held. */
async function large(ways: readonly Backend[], failed: string[], signal: AbortSignal, say: (text: string) => void, status: (text: string) => void): Promise<Made | null> {
  let weights: Uint8Array | null = null;
  try {
    const graph = await downloadModel(`${DIR}${POSTURE_MODEL}.onnx`, signal, say);
    if (await hex(graph) !== SHA256.graph) throw new Error(BROKEN);
    const w = weights = await weightsOf(`${DIR}${POSTURE_MODEL}.f16.bin`, signal, say);
    status('姿勢解析の骨格モデルを準備しています…');
    for (const ep of ways) {
      try {
        const session = await ort.InferenceSession.create(graph, { executionProviders: [ep], ...SESSION,
          externalData: [{ path: `${POSTURE_MODEL}.data`, data: w }] });
        return { session, backend: ep, size: 'l' };
      } catch (e) { failed.push(`l/${ep} ${said(e)}`); }
    }
  } catch (e) { if (signal.aborted) throw e; failed.push(`l ${said(e)}`); }
  finally { if (weights) letGo(weights); }   // a session made holds its own copy
  return null;
}

let opening: Promise<Made> | null = null;
/** The model's session, opened once a page: the large model, else the light one; WebGPU first where it is fast and
 * proven (computers, Android), WebAssembly first on an iPhone or iPad (the way WebKit made the model in every test).
 * `?posture-model=m` goes straight to the light one. */
function open(signal: AbortSignal, status: (text: string) => void) {
  opening ??= (async (): Promise<Made> => {
    const say = (text: string) => status(text.replace('姿勢モデル', '姿勢解析の骨格モデル'));
    ort.env.wasm.wasmPaths = { wasm: ORT_WASM }; ort.env.wasm.numThreads = 1;
    const gpu = typeof navigator !== 'undefined' && !!(navigator as Navigator & { gpu?: unknown }).gpu;
    const ways: Backend[] = !gpu ? ['wasm'] : appleMobile() ? ['wasm', 'webgpu'] : ['webgpu', 'wasm'], failed: string[] = [];
    if (new URLSearchParams(location.search).get('posture-model') !== 'm') {
      const made = await large(ways, failed, signal, say, status);
      if (made) return made;
      status('この端末では大きい骨格モデルを使えないため、軽いモデルを準備しています…');
    }
    try {
      const light = await downloadModel(`${DIR}${LIGHT_MODEL}.onnx`, signal, say);
      if (await hex(light) !== SHA256.light) throw new Error(BROKEN);
      for (const ep of ways) {
        try { return { session: await ort.InferenceSession.create(light, { executionProviders: [ep], ...SESSION }), backend: ep, size: 'm' }; }
        catch (e) { failed.push(`m/${ep} ${said(e)}`); }
      }
    } catch (e) { if (signal.aborted) throw e; failed.push(`m ${said(e)}`); }
    throw new Error(`姿勢解析の骨格モデルを開始できませんでした（${failed.join(' / ')}）。`);
  })().catch(e => { opening = null; throw e; });
  return opening;
}

/** Each picture's pixels, read once for its reading (release() lets them go). */
const pixels = new WeakMap<Picture, ImageData>();
/** A picture read: its pixels (12.6 MB for a photo) are not kept. */
export const release = (picture: Picture) => { pixels.delete(picture); };
function pixelsOf(picture: Picture): ImageData {
  let p = pixels.get(picture);
  if (!p) {
    const canvas = picture instanceof HTMLCanvasElement ? picture : Object.assign(document.createElement('canvas'), { width: picture.width, height: picture.height });
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('画像処理を開始できません。');
    if (!(picture instanceof HTMLCanvasElement)) ctx.drawImage(picture, 0, 0);
    p = ctx.getImageData(0, 0, canvas.width, canvas.height);
    pixels.set(picture, p);
  }
  return p;
}

export async function loadPostureModel(signal: AbortSignal, status: (text: string) => void): Promise<PostureModel> {
  const { session, backend, size } = await open(signal, status), input = new Float32Array(3 * IW * IH);
  return { backend, size, async read(picture, c, mirrored) {
    const p = pixelsOf(picture);
    areaInput(p.data, p.width, p.height, c, mirrored, input);
    const out = await session.run({ input: new ort.Tensor('float32', input, [1, 3, IH, IW]) });
    return decode(out.simcc_x.data as Float32Array, out.simcc_y.data as Float32Array, c, mirrored);
  } };
}

/** Window sizes read for a still (the study: the spread of the tilts halved with 3 sizes and the mirror image). */
export const STILL_SIZES = [1.15, 1.25, 1.35];
const both = async (model: PostureModel, picture: Picture, crop: Crop, sizes: readonly number[]) => {
  const readings: Keypoint[][] = [];
  for (const size of sizes) for (const mirrored of [false, true]) readings.push(await model.read(picture, resized(crop, size), mirrored));
  return meanOf(readings);
};
/** The athlete's keypoints in a picture, from a first window (pixels; from MediaPipe's pose): the window set twice from
 * the model's own keypoints (they reach the top of the head and the heels), then read at `sizes`, as it is and mirrored,
 * and averaged. */
export async function keypointsIn(model: PostureModel, picture: Picture, start: Crop, sizes = STILL_SIZES): Promise<Keypoint[]> {
  let crop = start;
  for (let i = 0; i < 2; i++) crop = cropAround(await model.read(picture, crop, false)) ?? crop;
  return both(model, picture, crop, sizes);
}
/** The body's keypoints with the face's read again in the head's window, at `sizes`, as it is and mirrored (front and
 * back: the ear line for the head's tilt). */
export async function withHeadIn(model: PostureModel, picture: Picture, body: Keypoint[], sizes = STILL_SIZES): Promise<Keypoint[]> {
  const crop = headCrop(body);
  return crop ? withHead(body, await both(model, picture, crop, sizes)) : body;
}
