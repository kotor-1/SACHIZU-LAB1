/**
 * SACHIZU LAB1 - Timeline Tracker (純粋ロジックモジュール)
 * PTSタイムライン検索、キーフレーム探索、Frame Index差分判定、VFR間隔分布解析、不変条件保証
 */

import { FrameInfo, GateVerificationSample } from './types';
import { FPS_THRESHOLDS } from './constants';

/**
 * PTSリストから指定タイムスタンプに最も近いフレームを検索 (二分探索)
 */
export function findClosestFrame(pts: number, frames: FrameInfo[]): FrameInfo | null {
  if (!frames || frames.length === 0) {
    return null;
  }

  // 境界値クランプ: 0秒未満の場合は先頭フレーム
  if (pts <= frames[0].pts) {
    return frames[0];
  }

  // 境界値クランプ: 最終フレーム以降の場合は末尾フレーム
  const lastIndex = frames.length - 1;
  if (pts >= frames[lastIndex].pts) {
    return frames[lastIndex];
  }

  let low = 0;
  let high = lastIndex;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const midPts = frames[mid].pts;

    if (midPts === pts) {
      return frames[mid];
    }

    if (midPts < pts) {
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  const frameLow = frames[Math.min(low, lastIndex)];
  const frameHigh = frames[Math.max(high, 0)];

  const diffLow = Math.abs(frameLow.pts - pts);
  const diffHigh = Math.abs(frameHigh.pts - pts);

  return diffLow < diffHigh ? frameLow : frameHigh;
}

/**
 * タイムスタンプから最も近い実フレームのインデックスを取得
 */
export function findClosestFrameIndex(pts: number, frames: FrameInfo[]): number {
  const frame = findClosestFrame(pts, frames);
  return frame ? frame.frameIndex : 0;
}

/**
 * 指定された targetIndex 以前で最も近いキーフレーム (sync sample) のインデックスを検索
 */
export function findPrecedingKeyframeIndex(targetIndex: number, frames: FrameInfo[]): number {
  if (!frames || frames.length === 0) return 0;
  const clampedTarget = Math.max(0, Math.min(frames.length - 1, targetIndex));

  for (let i = clampedTarget; i >= 0; i--) {
    if (frames[i].isKeyframe) {
      return i;
    }
  }
  return 0; // 見つからない場合は先頭
}

/**
 * フレーム番号 (0-indexed) によるフレーム取得 (境界クランプ付き)
 */
export function getFrameByIndex(index: number, frames: FrameInfo[]): FrameInfo | null {
  if (!frames || frames.length === 0) {
    return null;
  }
  const clampedIndex = Math.max(0, Math.min(frames.length - 1, Math.floor(index)));
  return frames[clampedIndex];
}

/**
 * 指定インデックスにおける前後フレームとの間隔 (ミリ秒) を取得
 */
export function getLocalFrameIntervals(
  frameIndex: number,
  frames: FrameInfo[]
): { prevIntervalMs: number; nextIntervalMs: number } {
  if (!frames || frames.length === 0) {
    return { prevIntervalMs: 0, nextIntervalMs: 0 };
  }

  const current = getFrameByIndex(frameIndex, frames);
  if (!current) return { prevIntervalMs: 0, nextIntervalMs: 0 };

  const prev = frameIndex > 0 ? frames[frameIndex - 1] : null;
  const next = frameIndex < frames.length - 1 ? frames[frameIndex + 1] : null;

  const prevIntervalMs = prev ? Math.abs(current.pts - prev.pts) * 1000 : (current.duration * 1000 || 8.33);
  const nextIntervalMs = next ? Math.abs(next.pts - current.pts) * 1000 : (current.duration * 1000 || 8.33);

  return { prevIntervalMs, nextIntervalMs };
}

/**
 * 現在の表示フレームインデックスから指定ステップ数だけ移動 (境界クランプ付き)
 * ※ fpsや時間計算を一切介さず、実サンプル表示順 (presentationFrameIndex) でダイレクトに移動
 */
export function stepPresentationFrames(
  currentPresentationIndex: number,
  delta: number,
  totalFrames: number
): number {
  if (totalFrames <= 0) return 0;
  return Math.max(0, Math.min(totalFrames - 1, currentPresentationIndex + delta));
}

/**
 * 現在のPTSまたはインデックスから指定ステップ数だけ移動したフレームを取得
 */
export function stepFrames(
  currentFrameIndex: number,
  stepCount: number,
  frames: FrameInfo[]
): FrameInfo | null {
  if (!frames || frames.length === 0) {
    return null;
  }
  const targetIndex = currentFrameIndex + stepCount;
  return getFrameByIndex(targetIndex, frames);
}

/**
 * Frame Diff の不変条件（Invariant）を検証
 * Invariant: frameIndexDiff === Math.abs(actualPresentedFrameIndex - targetFrameIndex)
 */
export function verifyFrameDiffInvariant(sample: GateVerificationSample): boolean {
  if (sample.status !== 'SUCCESS' || sample.actualDecodedFrameIndex < 0) {
    return true; // 失敗サンプルは別ハンドリング
  }
  const expectedDiff = Math.abs(sample.actualDecodedFrameIndex - sample.targetFrameIndex);
  return sample.frameIndexDiff === expectedDiff;
}

/**
 * サンプルごとの継続時間から VFR (可変フレームレート) 判定および詳細分布を解析
 */
export function analyzeFrameIntervals(durations: number[]): {
  isVFR: boolean;
  minInterval: number;
  maxInterval: number;
  avgInterval: number;
  nominalFps: number;
  fpsDistribution: Array<{ label: string; fpsEquivalent: number; percentage: number }>;
} {
  if (!durations || durations.length === 0) {
    return {
      isVFR: false,
      minInterval: 0,
      maxInterval: 0,
      avgInterval: 0,
      nominalFps: 0,
      fpsDistribution: [],
    };
  }

  let sum = 0;
  let min = durations[0];
  let max = durations[0];

  let count240 = 0; // ~4.17ms (<= 5.5ms)
  let count120 = 0; // ~8.33ms (5.5ms < d <= 11.0ms)
  let count60 = 0;  // ~16.67ms (11.0ms < d <= 22.0ms)
  let countOther = 0;

  for (let i = 0; i < durations.length; i++) {
    const d = durations[i];
    const ms = d * 1000;
    sum += d;
    if (d < min) min = d;
    if (d > max) max = d;

    if (ms <= 5.5) {
      count240++;
    } else if (ms <= 11.0) {
      count120++;
    } else if (ms <= 22.0) {
      count60++;
    } else {
      countOther++;
    }
  }

  const total = durations.length;
  const avgInterval = sum / total;
  const nominalFps = avgInterval > 0 ? Math.round(1 / avgInterval) : 0;

  // 分散・標準偏差の計算
  let varianceSum = 0;
  for (let i = 0; i < durations.length; i++) {
    const diff = durations[i] - avgInterval;
    varianceSum += diff * diff;
  }
  const stdDev = Math.sqrt(varianceSum / total);
  const cv = avgInterval > 0 ? stdDev / avgInterval : 0;

  // 変動係数 (CV) が 5% を超えるか、min/max の差が平均の10%を超える場合 VFR とみなす
  const isVFR = cv > 0.05 || (max - min) > avgInterval * 0.1;

  const fpsDistribution: Array<{ label: string; fpsEquivalent: number; percentage: number }> = [];
  if (count240 > 0) {
    fpsDistribution.push({
      label: '240fps相当 (~4.17ms)',
      fpsEquivalent: 240,
      percentage: Math.round((count240 / total) * 100),
    });
  }
  if (count120 > 0) {
    fpsDistribution.push({
      label: '120fps相当 (~8.33ms)',
      fpsEquivalent: 120,
      percentage: Math.round((count120 / total) * 100),
    });
  }
  if (count60 > 0) {
    fpsDistribution.push({
      label: '60fps相当 (~16.67ms)',
      fpsEquivalent: 60,
      percentage: Math.round((count60 / total) * 100),
    });
  }
  if (countOther > 0) {
    fpsDistribution.push({
      label: 'その他/低速区間 (>22ms)',
      fpsEquivalent: 30,
      percentage: Math.round((countOther / total) * 100),
    });
  }

  return {
    isVFR,
    minInterval: min,
    maxInterval: max,
    avgInterval,
    nominalFps,
    fpsDistribution,
  };
}

/**
 * 数値配列のパーセンタイル値を算出 (0.0 〜 1.0)
 */
export function calculatePercentile(values: number[], p: number): number {
  if (!values || values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.round(p * (sorted.length - 1))));
  return sorted[index];
}

/**
 * FPSから分類カテゴリを判定
 */
export function classifyFps(fps: number): 'unsupported_low' | '60fps' | '120fps_recommended' | '240fps_high' {
  if (fps < FPS_THRESHOLDS.MIN_SUPPORTED) {
    return 'unsupported_low';
  }
  if (fps < FPS_THRESHOLDS.ONE_TWENTY_FPS) {
    return '60fps';
  }
  if (fps < FPS_THRESHOLDS.TWO_FORTY_FPS) {
    return '120fps_recommended';
  }
  return '240fps_high';
}
