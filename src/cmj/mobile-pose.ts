import type { PoseLandmarker, NormalizedLandmark } from '@mediapipe/tasks-vision';
import type { Sample } from './analysis';
import { centerOfMassSample } from './center-of-mass';
import { downloadModel } from './model-download';

const wasm = new URL('../../node_modules/@mediapipe/tasks-vision/wasm/vision_wasm_internal.wasm', import.meta.url).href;
const loader = new URL('../../node_modules/@mediapipe/tasks-vision/wasm/vision_wasm_internal.js', import.meta.url).href;
const noSimdWasm = new URL('../../node_modules/@mediapipe/tasks-vision/wasm/vision_wasm_nosimd_internal.wasm', import.meta.url).href;
const noSimdLoader = new URL('../../node_modules/@mediapipe/tasks-vision/wasm/vision_wasm_nosimd_internal.js', import.meta.url).href;
export const MOBILE_MODEL_SHA256 = '59929e1d1ee95287735ddd833b19cf4ac46d29bc7afddbbf6753c459690d574a';
export const RECORDING_MODEL_SHA256 = '5134a3aad27a58b93da0088d431f366da362b44e3ccfbe3462b3827a839011b1';
// At most Lite + Full (15 MB); never cache videos or failed/partial downloads.
const verifiedModels = new Map<string, Uint8Array<ArrayBuffer>>();
export type PoseSelector = (poses: NormalizedLandmark[][], pts: number) => NormalizedLandmark[][];
export function mobileSample(points: readonly NormalizedLandmark[][], frame: number, pts: number): Sample {
  const fail = (reason: string): Sample => ({ frame, pts, hipY: null, footY: null, reason });
  if (points.length !== 1) return fail('POSE_NOT_UNIQUE');
  const p = points[0];
  if ([23, 24, 31, 32].some(i => !p[i] || !Number.isFinite(p[i].x) || !Number.isFinite(p[i].y)
    || p[i].x <= 0 || p[i].x >= 1 || p[i].y <= 0 || p[i].y >= 1)) return fail('REQUIRED_POINT_OUTSIDE_IMAGE');
  // Common normalized image-height domain for stream trigger settings. Not physical cm.
  return { frame, pts, hipY: (p[23].y + p[24].y) * 480, footY: Math.max(p[31].y, p[32].y) * 960 };
}
export class MobileCMJPose {
  constructor(readonly variant: 'lite' | 'full' = 'lite', private selectPose?: PoseSelector) {}
  private model: PoseLandmarker | null = null;
  backend: 'CPU' = 'CPU';
  async initialize(signal: AbortSignal, status: (message: string) => void = () => {}) {
    const check = () => { if (signal.aborted) throw new DOMException('中止', 'AbortError'); };
    status('処理プログラムを読み込んでいます。');
    const { FilesetResolver, PoseLandmarker } = await import('@mediapipe/tasks-vision'); check();
    const simd = await FilesetResolver.isSimdSupported();
    status('姿勢モデルを確認しています。');
    let bytes = verifiedModels.get(this.variant);
    if (!bytes) {
      bytes = await downloadModel(`${import.meta.env.BASE_URL}models/cmj/pose_landmarker_${this.variant}.task`, signal, status);
      check(); status('受信した姿勢モデルを検証しています。');
      const digest = await crypto.subtle.digest('SHA-256', bytes);
      if (Array.from(new Uint8Array(digest), v => v.toString(16).padStart(2, '0')).join('') !== (this.variant === 'lite' ? MOBILE_MODEL_SHA256 : RECORDING_MODEL_SHA256))
        throw new Error('姿勢モデルの整合性を確認できませんでした。');
      check(); verifiedModels.set(this.variant, bytes);
    }
    const files = { wasmLoaderPath: simd ? loader : noSimdLoader, wasmBinaryPath: simd ? wasm : noSimdWasm };
    status(this.variant === 'lite' ? 'カメラ用の姿勢モデルを準備しています。' : '録画解析用の姿勢モデルを準備しています。');
    this.model = await PoseLandmarker.createFromOptions(files, {
      baseOptions: { modelAssetBuffer: bytes, delegate: 'CPU' }, runningMode: 'VIDEO', numPoses: 2,
      outputSegmentationMasks: false,
    });
    if (signal.aborted) { this.dispose(); check(); }
    status('映像処理を準備しています。');
  }
  estimate(image: HTMLVideoElement | HTMLCanvasElement, frame: number, pts: number) {
    if (!this.model) throw new Error('MODEL_NOT_READY');
    const start = performance.now();
    const result = this.model.detectForVideo(image, pts * 1000 + 1);
    const landmarks = this.selectPose ? this.selectPose(result.landmarks, pts) : result.landmarks;
    return { comSample: centerOfMassSample(landmarks, frame, pts), landmarks,
      inferenceMs: performance.now() - start };
  }
  warm(image: HTMLCanvasElement) { this.model?.detectForVideo(image, 0); }
  dispose() { this.model?.close(); this.model = null; }
}
