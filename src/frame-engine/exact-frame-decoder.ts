/**
 * SACHIZU LAB1 - WebCodecs Exact Frame Decoder
 *
 * MP4 samples are decoded exactly. The public cache is keyed by presentation-
 * frame index; raw sample indexes remain an internal decode identity only.
 */

import { FrameInfo, MemoryDiagnostics } from './types';
import { MP4Sample, MP4VideoTrack } from './mp4-demuxer';
import {
  classifyLengthPrefixedHevcSample,
  getHevcNalLengthSize,
  HevcRandomAccessKind,
  HevcSampleClassification,
} from './hevc-sample-classifier';

export interface DecodedResult {
  bitmap: ImageBitmap | null;
  canvas: HTMLCanvasElement | null;
  targetFrameIndex: number;
  actualDecodedFrameIndex: number;
  targetRawSampleIndex: number;
  actualDecodedRawSampleIndex: number;
  frameIndexDiff: number;
  targetSamplePts: number;
  decodedVideoFrameTimestampUs: number;
  timestampDiffUs: number;
  keyframeIndex: number;
  keyframeRawSampleIndex: number;
  /** Actual VCL NAL type that established HEVC random access (16-21). */
  randomAccessHevcNalUnitType: number | null;
  /** Decode-order samples omitted because they are pre-CRA RASL pictures. */
  omittedRaslRawSampleIndexes: number[];
  decodedSampleCount: number;
  decodeLatencyMs: number;
  status: 'SUCCESS' | 'ERROR' | 'UNSUPPORTED';
  errorMessage?: string;
}

interface DecodeRequest {
  targetPresentationIndex: number;
  resolve: (result: DecodedResult) => void;
}

interface PendingOutputFrame {
  frame: VideoFrame;
  presentationIndex: number;
}

interface DecodePlanSample {
  rawSampleIndex: number;
  sample: MP4Sample;
  data: ArrayBuffer;
  chunkType: 'key' | 'delta';
}

interface ExactDecodePlan {
  randomAccessRawSampleIndex: number;
  randomAccessHevcNalUnitType: number | null;
  omittedRaslRawSampleIndexes: number[];
  samples: DecodePlanSample[];
}

/**
 * WebCodecs decoder with exact presentation-frame stepping.
 *
 * A small sliding cache (Prev/Current/Next in the normal mode) is deliberate:
 * keeping decoded VideoFrames or all 4K bitmaps alive is unsafe on mobile.
 * ImageBitmaps are display-only; the exact decoder always reads original
 * encoded samples for Motion analysis.
 */
export class WebCodecsExactDecoder {
  // Decode output can contain a reordered presentation neighborhood around a
  // target. Retain only a small part of it for nearby cache hits; every cache
  // miss still starts an independent random-access sequence.
  private static readonly PRESENTATION_CACHE_RADIUS = 4;

  private file: File | Blob;
  private videoTrack: MP4VideoTrack;
  private frames: FrameInfo[];
  private rawSamples: MP4Sample[];
  private descriptionBuffer: ArrayBuffer | undefined;

  // Bounded display cache: 3 = previous/current/next, 1 = current only.
  private maxCacheLimit: 1 | 3 = 3;
  private frameCache: Map<number, ImageBitmap> = new Map();
  private cacheKeysOrder: number[] = [];
  private activeCacheWindow: { start: number; end: number } = { start: 0, end: -1 };
  private activeCacheCenter = 0;
  private protectedCacheKeys = new Set<number>();

  // Requests are serialized, but never dropped. This keeps rapid clicks and
  // the displayed presentation index in lockstep.
  private isDecoding = false;
  private pendingDesiredIndex: number | null = null;
  private requestQueue: DecodeRequest[] = [];

  // Each cache miss starts a fresh random-access sequence. flush() restores
  // WebCodecs' key-chunk requirement, so a later request cannot depend on the
  // previous request's decoder state.
  private decoder: VideoDecoder | null = null;
  private decoderError: Error | null = null;
  private pendingOutputFrames: PendingOutputFrame[] = [];

  // Request and resource diagnostics.
  private latestRequestId = 0;
  private createdImageBitmaps = 0;
  private closedImageBitmaps = 0;
  private createdVideoFrames = 0;
  private closedVideoFrames = 0;
  private coalescedRequestCount = 0;
  private decoderConfigureCount = 0;
  private decoderResetCount = 0;
  private keyframeSeekCount = 0;
  private decodedSampleCountTotal = 0;
  private lastDecodedSampleCount = 0;
  private cacheHitCount = 0;
  private cacheMissCount = 0;
  private lastCacheHit = false;
  private lastDecodeLatencyMs = 0;

  constructor(
    file: File | Blob,
    videoTrack: MP4VideoTrack,
    frames: FrameInfo[],
    rawSamples: MP4Sample[],
    descriptionBuffer?: ArrayBuffer
  ) {
    this.file = file;
    this.videoTrack = videoTrack;
    this.frames = frames;
    this.rawSamples = rawSamples;
    this.descriptionBuffer = descriptionBuffer;
  }

  /** WebCodecs が現在のブラウザ環境で利用可能か確認 */
  static isAvailable(): boolean {
    return (
      typeof window !== 'undefined' &&
      typeof VideoDecoder !== 'undefined' &&
      typeof VideoDecoder.isConfigSupported === 'function'
    );
  }

  /** キャッシュ上限を設定 (3: 前後含む / 1: 現在のみ) */
  setCacheLimit(limit: 1 | 3): void {
    this.maxCacheLimit = limit;
    this.enforceCacheLimit();
  }

  /**
   * メモリおよびフレームステップ性能の診断情報を取得。
   * `decodedSampleCountTotal` はアプリが投入したraw sample数の累計であり、
   * `lastDecodedSampleCount` は直近クリックで新たに投入した数。
   */
  getMemoryDiagnostics(): MemoryDiagnostics {
    return {
      exactCacheCount: this.frameCache.size,
      maxCacheLimit: this.maxCacheLimit,
      createdImageBitmaps: this.createdImageBitmaps,
      closedImageBitmaps: this.closedImageBitmaps,
      createdVideoFrames: this.createdVideoFrames,
      closedVideoFrames: this.closedVideoFrames,
      activeDecodeCount: this.isDecoding ? 1 : 0,
      coalescedRequestCount: this.coalescedRequestCount,
      latestRequestId: this.latestRequestId,
      desiredFrameIndex: this.pendingDesiredIndex ?? -1,
      decoderState: this.isDecoding
        ? this.requestQueue.length > 0
          ? 'coalescing'
          : 'decoding'
        : 'idle',
      decoderConfigureCount: this.decoderConfigureCount,
      decoderResetCount: this.decoderResetCount,
      keyframeSeekCount: this.keyframeSeekCount,
      decodedSampleCountTotal: this.decodedSampleCountTotal,
      lastDecodedSampleCount: this.lastDecodedSampleCount,
      cacheHitCount: this.cacheHitCount,
      cacheMissCount: this.cacheMissCount,
      lastCacheHit: this.lastCacheHit,
      lastDecodeLatencyMs: this.lastDecodeLatencyMs,
    };
  }

  /**
   * 指定された Presentation Frame Index のフレームを精密デコード。
   * 連打中も各要求をFIFOで処理し、中間要求を捨てない。
   */
  decodeExactFrame(targetPresentationIndex: number): Promise<DecodedResult> {
    const totalFrames = this.frames.length;
    const clampedIndex = totalFrames > 0
      ? Math.max(0, Math.min(totalFrames - 1, targetPresentationIndex))
      : 0;

    return new Promise<DecodedResult>((resolve) => {
      if (this.isDecoding || this.requestQueue.length > 0) {
        // Kept as a diagnostic name for compatibility; requests are queued,
        // not silently collapsed.
        this.coalescedRequestCount++;
      }
      this.latestRequestId++;
      this.pendingDesiredIndex = clampedIndex;
      this.requestQueue.push({ targetPresentationIndex: clampedIndex, resolve });
      void this.drainRequestQueue();
    });
  }

  /** FIFO drain: every click receives the exact frame it requested. */
  private async drainRequestQueue(): Promise<void> {
    if (this.isDecoding) return;
    this.isDecoding = true;

    try {
      while (this.requestQueue.length > 0) {
        const request = this.requestQueue.shift()!;
        this.pendingDesiredIndex = this.requestQueue.length > 0
          ? this.requestQueue[this.requestQueue.length - 1].targetPresentationIndex
          : null;

        let result: DecodedResult;
        try {
          result = await this.executeSingleDecode(request.targetPresentationIndex);
        } catch (error) {
          result = this.createErrorResult(
            request.targetPresentationIndex,
            error instanceof Error ? error.message : String(error)
          );
        }
        request.resolve(result);
      }
    } finally {
      this.isDecoding = false;
      this.pendingDesiredIndex = null;
      // A dispose() can clear queued requests while this loop is awaiting.
      const remaining = this.requestQueue.splice(0);
      remaining.forEach((request) => request.resolve(
        this.createErrorResult(request.targetPresentationIndex, 'Decoder disposed.')
      ));
    }
  }

  /** 単一フレームの精密デコード実行 */
  private async executeSingleDecode(clampedIndex: number): Promise<DecodedResult> {
    const startTime = performance.now();
    const targetFrame = this.frames[clampedIndex];
    this.lastCacheHit = false;

    if (!targetFrame) {
      return this.createErrorResult(clampedIndex, `Target presentation frame #${clampedIndex} not found.`);
    }

    const targetRawSampleIndex = this.getRawSampleIndex(targetFrame);
    let keyframeRawSampleIndex = this.findPrecedingRawKeyframeIndex(targetRawSampleIndex);
    let keyframeIndex = this.findPresentationIndexByRawSampleIndex(keyframeRawSampleIndex);
    const cachedBitmap = this.frameCache.get(clampedIndex);

    if (cachedBitmap) {
      this.lastCacheHit = true;
      this.cacheHitCount++;
      this.touchCacheKey(clampedIndex);
      this.updateActiveCacheWindow(clampedIndex);
      this.lastDecodedSampleCount = 0;
      this.lastDecodeLatencyMs = performance.now() - startTime;
      return this.createSuccessResult(
        clampedIndex,
        targetFrame,
        cachedBitmap,
        targetRawSampleIndex,
        targetRawSampleIndex,
        keyframeIndex,
        keyframeRawSampleIndex,
        0,
        this.getRawTimestampUs(targetFrame),
        this.lastDecodeLatencyMs,
        null,
        []
      );
    }

    this.cacheMissCount++;
    this.updateActiveCacheWindow(clampedIndex);

    if (!WebCodecsExactDecoder.isAvailable()) {
      this.lastDecodedSampleCount = 0;
      this.lastDecodeLatencyMs = performance.now() - startTime;
      return {
        ...this.createErrorResult(
          clampedIndex,
          'WebCodecs (VideoDecoder) is not supported in this environment.'
        ),
        targetRawSampleIndex,
        status: 'UNSUPPORTED',
        decodeLatencyMs: this.lastDecodeLatencyMs,
      };
    }

    const timescale = this.videoTrack.timescale || 1000;
    const targetTimestampUs = this.getRawTimestampUs(targetFrame);
    let decodedSampleCount = 0;
    let actualDecodedFrameIndex = -1;
    let actualDecodedRawSampleIndex = -1;
    let decodedVideoFrameTimestampUs = -1;
    let bitmap: ImageBitmap | null = null;
    let randomAccessHevcNalUnitType: number | null = null;
    let omittedRaslRawSampleIndexes: number[] = [];

    try {
      const plan = await this.buildExactDecodePlan(targetRawSampleIndex);
      keyframeRawSampleIndex = plan.randomAccessRawSampleIndex;
      keyframeIndex = this.findPresentationIndexByRawSampleIndex(keyframeRawSampleIndex);
      randomAccessHevcNalUnitType = plan.randomAccessHevcNalUnitType;
      omittedRaslRawSampleIndexes = plan.omittedRaslRawSampleIndexes;

      this.prepareDecoderForRandomAccess();
      if (plan.samples[0]?.chunkType !== 'key') {
        throw new Error('Exact decode plan does not begin with a proven key chunk.');
      }

      // Samples remain in container decode order. Presentation selection is
      // performed only from timestamps on actual decoded VideoFrame outputs.
      for (const planned of plan.samples) {
        const timestampUs = Math.round((planned.sample.cts / timescale) * 1_000_000);
        const durationUs = Math.round((planned.sample.duration / timescale) * 1_000_000);
        const chunk = new EncodedVideoChunk({
          type: planned.chunkType,
          timestamp: timestampUs,
          duration: durationUs,
          data: planned.data,
        });
        this.decoder!.decode(chunk);
        decodedSampleCount++;
      }
      await this.decoder!.flush();

      if (this.decoderError) throw this.decoderError;

      const processed = await this.processPendingOutputFrames(clampedIndex, targetTimestampUs, timescale);
      actualDecodedFrameIndex = processed.actualDecodedFrameIndex;
      actualDecodedRawSampleIndex = processed.actualDecodedRawSampleIndex;
      decodedVideoFrameTimestampUs = processed.decodedVideoFrameTimestampUs;
      bitmap = this.frameCache.get(clampedIndex) ?? null;
      if (bitmap) this.touchCacheKey(clampedIndex);

      if (actualDecodedFrameIndex < 0) {
        throw new Error(`Target presentation frame #${clampedIndex} was not emitted.`);
      }

      this.decodedSampleCountTotal += decodedSampleCount;
      this.lastDecodedSampleCount = decodedSampleCount;
      this.lastDecodeLatencyMs = performance.now() - startTime;
      const timestampDiffUs = Math.abs(decodedVideoFrameTimestampUs - targetTimestampUs);
      const frameIndexDiff = Math.abs(actualDecodedFrameIndex - clampedIndex);

      return {
        bitmap,
        canvas: null,
        targetFrameIndex: clampedIndex,
        actualDecodedFrameIndex,
        targetRawSampleIndex,
        actualDecodedRawSampleIndex,
        frameIndexDiff,
        targetSamplePts: targetFrame.presentationPts ?? targetFrame.pts,
        decodedVideoFrameTimestampUs,
        timestampDiffUs,
        keyframeIndex,
        keyframeRawSampleIndex,
        randomAccessHevcNalUnitType,
        omittedRaslRawSampleIndexes,
        decodedSampleCount,
        decodeLatencyMs: this.lastDecodeLatencyMs,
        status: 'SUCCESS',
      };
    } catch (error) {
      this.closePendingOutputFrames();
      // Treat any failed exact request as a decoder-state miss. The next
      // request will reset from its preceding keyframe instead of reusing a
      // potentially poisoned decoder queue.
      this.decoderError = error instanceof Error ? error : new Error(String(error));
      if (this.decoder) {
        try {
          this.decoder.close();
        } catch {
          // ignore close failures while abandoning an unsuccessful sequence
        }
        this.decoder = null;
      }
      this.lastDecodedSampleCount = decodedSampleCount;
      this.decodedSampleCountTotal += decodedSampleCount;
      this.lastDecodeLatencyMs = performance.now() - startTime;
      return {
        bitmap: null,
        canvas: null,
        targetFrameIndex: clampedIndex,
        actualDecodedFrameIndex: -1,
        targetRawSampleIndex,
        actualDecodedRawSampleIndex: -1,
        frameIndexDiff: 999,
        targetSamplePts: targetFrame.presentationPts ?? targetFrame.pts,
        decodedVideoFrameTimestampUs: -1,
        timestampDiffUs: 999999,
        keyframeIndex,
        keyframeRawSampleIndex,
        randomAccessHevcNalUnitType,
        omittedRaslRawSampleIndexes,
        decodedSampleCount,
        decodeLatencyMs: this.lastDecodeLatencyMs,
        status: 'ERROR',
        errorMessage: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /** Build one self-contained raw decode-order sequence for an exact request. */
  private async buildExactDecodePlan(targetRawSampleIndex: number): Promise<ExactDecodePlan> {
    if (targetRawSampleIndex < 0 || targetRawSampleIndex >= this.rawSamples.length) {
      throw new Error(`Raw target sample #${targetRawSampleIndex} is out of range.`);
    }

    if (!this.isHevcTrack()) {
      const randomAccessRawSampleIndex = this.findPrecedingContainerSyncIndex(targetRawSampleIndex);
      if (randomAccessRawSampleIndex < 0) {
        throw new Error(`No preceding sync sample exists for raw target #${targetRawSampleIndex}.`);
      }
      const samples: DecodePlanSample[] = [];
      for (let rawIndex = randomAccessRawSampleIndex; rawIndex <= targetRawSampleIndex; rawIndex++) {
        const sample = this.rawSamples[rawIndex];
        if (!sample) throw new Error(`Raw sample #${rawIndex} is missing.`);
        samples.push({
          rawSampleIndex: rawIndex,
          sample,
          data: await this.readEncodedSampleData(sample),
          chunkType: sample.is_sync ? 'key' : 'delta',
        });
      }
      return {
        randomAccessRawSampleIndex,
        randomAccessHevcNalUnitType: null,
        omittedRaslRawSampleIndexes: [],
        samples,
      };
    }

    if (!this.descriptionBuffer) {
      throw new Error('HEVC exact random access requires an hvcC description.');
    }
    const nalLengthSize = getHevcNalLengthSize(this.descriptionBuffer);
    const dataByRawIndex = new Map<number, ArrayBuffer>();
    const classificationByRawIndex = new Map<number, HevcSampleClassification>();
    const inspectSample = async (rawIndex: number): Promise<HevcSampleClassification> => {
      const cached = classificationByRawIndex.get(rawIndex);
      if (cached) return cached;
      const sample = this.rawSamples[rawIndex];
      if (!sample) throw new Error(`Raw sample #${rawIndex} is missing.`);
      const data = await this.readEncodedSampleData(sample);
      const classification = classifyLengthPrefixedHevcSample(data, nalLengthSize);
      dataByRawIndex.set(rawIndex, data);
      classificationByRawIndex.set(rawIndex, classification);
      return classification;
    };

    // MP4 sync flags identify candidate access points. Actual key authority
    // comes from the VCL NAL type, and unrecognized sync samples are skipped.
    let searchBeforeOrAt = targetRawSampleIndex;
    let randomAccessRawSampleIndex = -1;
    let randomAccessClassification: HevcSampleClassification | null = null;
    while (searchBeforeOrAt >= 0) {
      const candidateRawIndex = this.findPrecedingContainerSyncIndex(searchBeforeOrAt);
      if (candidateRawIndex < 0) break;
      const candidateClassification = await inspectSample(candidateRawIndex);
      if (candidateClassification.randomAccessKind) {
        const candidate = this.rawSamples[candidateRawIndex];
        const target = this.rawSamples[targetRawSampleIndex];
        // A presentation-leading target following a CRA needs an earlier
        // access point; it cannot be decoded by starting at that CRA itself.
        if (
          candidateClassification.randomAccessKind === 'CRA' &&
          targetRawSampleIndex > candidateRawIndex &&
          target.cts < candidate.cts
        ) {
          searchBeforeOrAt = candidateRawIndex - 1;
          continue;
        }
        randomAccessRawSampleIndex = candidateRawIndex;
        randomAccessClassification = candidateClassification;
        break;
      }
      searchBeforeOrAt = candidateRawIndex - 1;
    }

    if (randomAccessRawSampleIndex < 0 || !randomAccessClassification?.randomAccessKind) {
      throw new Error(`No codec-proven HEVC IRAP exists for raw target #${targetRawSampleIndex}.`);
    }

    const randomAccessSample = this.rawSamples[randomAccessRawSampleIndex];
    const randomAccessKind: HevcRandomAccessKind = randomAccessClassification.randomAccessKind;
    const omittedRaslRawSampleIndexes: number[] = [];
    const samples: DecodePlanSample[] = [];

    for (let rawIndex = randomAccessRawSampleIndex; rawIndex <= targetRawSampleIndex; rawIndex++) {
      const sample = this.rawSamples[rawIndex];
      if (!sample) throw new Error(`Raw sample #${rawIndex} is missing.`);
      const classification = await inspectSample(rawIndex);
      const isUndecodableCraLeadingRasl = (
        randomAccessKind === 'CRA' &&
        rawIndex > randomAccessRawSampleIndex &&
        classification.raslKind !== null &&
        sample.cts < randomAccessSample.cts
      );
      if (isUndecodableCraLeadingRasl) {
        omittedRaslRawSampleIndexes.push(rawIndex);
        continue;
      }

      const data = dataByRawIndex.get(rawIndex) ?? await this.readEncodedSampleData(sample);
      samples.push({
        rawSampleIndex: rawIndex,
        sample,
        data,
        // HEVC key authority is the parsed IRAP VCL type, not is_sync.
        chunkType: classification.randomAccessKind ? 'key' : 'delta',
      });
    }

    if (samples[0]?.rawSampleIndex !== randomAccessRawSampleIndex || samples[0].chunkType !== 'key') {
      throw new Error('HEVC decode sequence does not begin at its proven IRAP sample.');
    }

    return {
      randomAccessRawSampleIndex,
      randomAccessHevcNalUnitType: randomAccessClassification.primaryVclNalUnitType,
      omittedRaslRawSampleIndexes,
      samples,
    };
  }

  private isHevcTrack(): boolean {
    const codec = this.videoTrack.codec.toLowerCase();
    return codec.startsWith('hvc1.') || codec.startsWith('hev1.');
  }

  private async readEncodedSampleData(sample: MP4Sample): Promise<ArrayBuffer> {
    const data = sample.data ?? await this.file
      .slice(sample.offset, sample.offset + sample.size)
      .arrayBuffer();
    if (data.byteLength !== sample.size) {
      throw new Error(
        `Raw sample #${sample.number} has ${data.byteLength} bytes; expected ${sample.size}.`
      );
    }
    return data;
  }

  /**
   * Reset/configure before every cache-miss decode sequence. WebCodecs flush()
   * requires the next submitted chunk to be a key chunk, and exact requests
   * must never rely on retained state from a prior GOP.
   */
  private prepareDecoderForRandomAccess(): void {
    this.closePendingOutputFrames();

    if (this.decoder) {
      try {
        this.decoder.reset();
        this.decoderResetCount++;
      } catch {
        try {
          this.decoder.close();
        } catch {
          // ignore close failures while replacing a broken decoder
        }
        this.decoder = null;
      }
    }

    if (!this.decoder) {
      this.decoder = new VideoDecoder({
        output: (frame: VideoFrame) => {
          this.createdVideoFrames++;
          const presentationIndex = this.findPresentationIndexByTimestampUs(
            frame.timestamp,
            this.videoTrack.timescale || 1000
          );
          this.pendingOutputFrames.push({ frame, presentationIndex });
        },
        error: (error: Error) => {
          this.decoderError = error;
        },
      });
    }

    const config: VideoDecoderConfig = {
      codec: this.videoTrack.codec,
      codedWidth: this.videoTrack.track_width,
      codedHeight: this.videoTrack.track_height,
      description: this.descriptionBuffer,
    };
    this.decoder.configure(config);
    this.decoderConfigureCount++;
    this.decoderError = null;
    this.keyframeSeekCount++;
  }

  /** Process all output frames and retain only the active exact display window. */
  private async processPendingOutputFrames(
    targetPresentationIndex: number,
    targetTimestampUs: number,
    timescale: number
  ): Promise<{
    actualDecodedFrameIndex: number;
    actualDecodedRawSampleIndex: number;
    decodedVideoFrameTimestampUs: number;
  }> {
    let actualDecodedFrameIndex = -1;
    let actualDecodedRawSampleIndex = -1;
    let decodedVideoFrameTimestampUs = -1;

    // Process the requested output last so an LRU eviction cannot remove the
    // exact target before the result is returned when a GOP contains more
    // than the bounded cache capacity.
    this.protectedCacheKeys.clear();
    const outputs = this.pendingOutputFrames.splice(0).sort((a, b) => {
      const aIsTarget = a.presentationIndex === targetPresentationIndex;
      const bIsTarget = b.presentationIndex === targetPresentationIndex;
      if (aIsTarget === bIsTarget) return 0;
      return aIsTarget ? 1 : -1;
    });
    for (const output of outputs) {
      const { frame, presentationIndex } = output;

      if (
        presentationIndex >= 0 &&
        presentationIndex >= this.activeCacheWindow.start &&
        presentationIndex <= this.activeCacheWindow.end &&
        !this.frameCache.has(presentationIndex) &&
        typeof createImageBitmap !== 'undefined'
      ) {
        try {
          const bitmap = await createImageBitmap(frame as CanvasImageSource);
          this.createdImageBitmaps++;
          this.setFrameCache(presentationIndex, bitmap);
        } catch {
          // Exact output was still observed; a display bitmap may be
          // unavailable in a constrained environment and caller may use the
          // existing fallback path.
        }
      }

      if (presentationIndex === targetPresentationIndex) {
        actualDecodedFrameIndex = presentationIndex;
        actualDecodedRawSampleIndex = this.getRawSampleIndex(this.frames[presentationIndex]);
        decodedVideoFrameTimestampUs = frame.timestamp;
      }

      try {
        frame.close();
      } finally {
        this.closedVideoFrames++;
      }
    }

    // Use the timestamp authority for the final correspondence check. This
    // remains exact even when a decoder emits B-frame output out of order.
    if (decodedVideoFrameTimestampUs >= 0) {
      const timestampMappedIndex = this.findPresentationIndexByTimestampUs(
        decodedVideoFrameTimestampUs,
        timescale
      );
      if (timestampMappedIndex >= 0) {
        actualDecodedFrameIndex = timestampMappedIndex;
        actualDecodedRawSampleIndex = this.getRawSampleIndex(this.frames[timestampMappedIndex]);
      }
    }

    // A strict check prevents an unrelated decoder output from being treated
    // as the requested presentation frame.
    if (
      actualDecodedFrameIndex !== targetPresentationIndex ||
      Math.abs(decodedVideoFrameTimestampUs - targetTimestampUs) >= 100
    ) {
      return {
        actualDecodedFrameIndex: -1,
        actualDecodedRawSampleIndex: -1,
        decodedVideoFrameTimestampUs: -1,
      };
    }

    return {
      actualDecodedFrameIndex,
      actualDecodedRawSampleIndex,
      decodedVideoFrameTimestampUs,
    };
  }

  /** Build an exact success result for a display-cache hit. */
  private createSuccessResult(
    targetFrameIndex: number,
    targetFrame: FrameInfo,
    bitmap: ImageBitmap,
    targetRawSampleIndex: number,
    actualDecodedRawSampleIndex: number,
    keyframeIndex: number,
    keyframeRawSampleIndex: number,
    decodedSampleCount: number,
    decodedVideoFrameTimestampUs: number,
    decodeLatencyMs: number,
    randomAccessHevcNalUnitType: number | null,
    omittedRaslRawSampleIndexes: number[]
  ): DecodedResult {
    return {
      bitmap,
      canvas: null,
      targetFrameIndex,
      actualDecodedFrameIndex: targetFrameIndex,
      targetRawSampleIndex,
      actualDecodedRawSampleIndex,
      frameIndexDiff: 0,
      targetSamplePts: targetFrame.presentationPts ?? targetFrame.pts,
      decodedVideoFrameTimestampUs,
      timestampDiffUs: 0,
      keyframeIndex,
      keyframeRawSampleIndex,
      randomAccessHevcNalUnitType,
      omittedRaslRawSampleIndexes,
      decodedSampleCount,
      decodeLatencyMs,
      status: 'SUCCESS',
    };
  }

  private createErrorResult(targetFrameIndex: number, errorMessage: string): DecodedResult {
    const targetFrame = this.frames[targetFrameIndex];
    const targetRawSampleIndex = targetFrame ? this.getRawSampleIndex(targetFrame) : -1;
    return {
      bitmap: null,
      canvas: null,
      targetFrameIndex,
      actualDecodedFrameIndex: -1,
      targetRawSampleIndex,
      actualDecodedRawSampleIndex: -1,
      frameIndexDiff: 999,
      targetSamplePts: targetFrame?.presentationPts ?? targetFrame?.pts ?? 0,
      decodedVideoFrameTimestampUs: -1,
      timestampDiffUs: 999999,
      keyframeIndex: targetRawSampleIndex >= 0
        ? this.findPresentationIndexByRawSampleIndex(
            this.findPrecedingRawKeyframeIndex(targetRawSampleIndex)
          )
        : -1,
      keyframeRawSampleIndex: targetRawSampleIndex >= 0
        ? this.findPrecedingRawKeyframeIndex(targetRawSampleIndex)
        : -1,
      randomAccessHevcNalUnitType: null,
      omittedRaslRawSampleIndexes: [],
      decodedSampleCount: 0,
      decodeLatencyMs: 0,
      status: 'ERROR',
      errorMessage,
    };
  }

  /** キャッシュにフレームをセット (上限超過時は最古をclose) */
  private setFrameCache(frameIndex: number, bitmap: ImageBitmap): void {
    const existing = this.frameCache.get(frameIndex);
    if (existing) {
      if (existing !== bitmap) {
        bitmap.close();
        this.closedImageBitmaps++;
      }
      this.touchCacheKey(frameIndex);
      return;
    }

    this.frameCache.set(frameIndex, bitmap);
    this.cacheKeysOrder.push(frameIndex);
    this.protectedCacheKeys.add(frameIndex);
    this.enforceCacheLimit();
  }

  /** キャッシュ上限を強制適用し、あふれたImageBitmapを即時close */
  private enforceCacheLimit(): void {
    while (this.cacheKeysOrder.length > this.maxCacheLimit) {
      const candidates = this.cacheKeysOrder.filter((key) => !this.protectedCacheKeys.has(key));
      const evictionPool = candidates.length > 0 ? candidates : this.cacheKeysOrder;
      const oldestKey = evictionPool.reduce((worst, key) => {
        const worstDistance = Math.abs(worst - this.activeCacheCenter);
        const keyDistance = Math.abs(key - this.activeCacheCenter);
        if (keyDistance > worstDistance) return key;
        if (keyDistance < worstDistance) return worst;
        return this.cacheKeysOrder.indexOf(key) < this.cacheKeysOrder.indexOf(worst)
          ? key
          : worst;
      }, evictionPool[0]);
      if (oldestKey === undefined) continue;
      const oldBitmap = this.frameCache.get(oldestKey);
      if (oldBitmap) {
        oldBitmap.close();
        this.closedImageBitmaps++;
      }
      this.frameCache.delete(oldestKey);
      this.protectedCacheKeys.delete(oldestKey);
      const orderIndex = this.cacheKeysOrder.indexOf(oldestKey);
      if (orderIndex >= 0) this.cacheKeysOrder.splice(orderIndex, 1);
    }
  }

  private touchCacheKey(frameIndex: number): void {
    const idx = this.cacheKeysOrder.indexOf(frameIndex);
    if (idx >= 0) {
      this.cacheKeysOrder.splice(idx, 1);
      this.cacheKeysOrder.push(frameIndex);
    }
  }

  private updateActiveCacheWindow(targetPresentationIndex: number): void {
    const radius = this.maxCacheLimit === 1
      ? 0
      : WebCodecsExactDecoder.PRESENTATION_CACHE_RADIUS;
    this.activeCacheWindow = {
      start: Math.max(0, targetPresentationIndex - radius),
      end: Math.min(this.frames.length - 1, targetPresentationIndex + radius),
    };
    this.activeCacheCenter = targetPresentationIndex;
  }

  /** raw decode-order sample列でtarget以前の直近key sampleを返す */
  private findPrecedingRawKeyframeIndex(targetRawSampleIndex: number): number {
    const found = this.findPrecedingContainerSyncIndex(targetRawSampleIndex);
    return found >= 0 ? found : 0;
  }

  private findPrecedingContainerSyncIndex(targetRawSampleIndex: number): number {
    const clampedTarget = Math.max(0, Math.min(this.rawSamples.length - 1, targetRawSampleIndex));
    for (let i = clampedTarget; i >= 0; i--) {
      if (this.rawSamples[i]?.is_sync) return i;
    }
    return -1;
  }

  /** raw sampleがpublic window外 (pre-roll) の場合は-1 */
  private findPresentationIndexByRawSampleIndex(rawSampleIndex: number): number {
    return this.frames.findIndex((frame) => this.getRawSampleIndex(frame) === rawSampleIndex);
  }

  /** 実際にemitされたraw CTS timestampをpublic presentation indexへ照合 */
  private findPresentationIndexByTimestampUs(timestampUs: number, timescale: number): number {
    let closestIndex = -1;
    let closestDiffUs = Number.POSITIVE_INFINITY;
    for (let i = 0; i < this.frames.length; i++) {
      const frameTimestampUs = Math.round((this.getRawCts(this.frames[i]) / timescale) * 1_000_000);
      const diffUs = Math.abs(frameTimestampUs - timestampUs);
      if (diffUs < closestDiffUs) {
        closestDiffUs = diffUs;
        closestIndex = i;
      }
    }
    return closestDiffUs < 100 ? closestIndex : -1;
  }

  private getRawSampleIndex(frame: FrameInfo): number {
    return frame.rawSampleIndex ?? frame.sampleIndex;
  }

  private getRawCts(frame: FrameInfo): number {
    return frame.rawCts ?? frame.cts;
  }

  private getRawTimestampUs(frame: FrameInfo): number {
    const timescale = this.videoTrack.timescale || 1000;
    return Math.round((this.getRawCts(frame) / timescale) * 1_000_000);
  }

  private closePendingOutputFrames(): void {
    const pending = this.pendingOutputFrames.splice(0);
    for (const { frame } of pending) {
      try {
        frame.close();
      } finally {
        this.closedVideoFrames++;
      }
    }
  }

  /** 全キャッシュのクリア & メモリ解放 */
  clearCache(): void {
    for (const bitmap of this.frameCache.values()) {
      bitmap.close();
      this.closedImageBitmaps++;
    }
    this.frameCache.clear();
    this.cacheKeysOrder = [];
    this.protectedCacheKeys.clear();
  }

  /** Decoder、cache、queued requestsをすべて解放 */
  dispose(): void {
    this.closePendingOutputFrames();
    this.clearCache();
    const remaining = this.requestQueue.splice(0);
    remaining.forEach((request) => request.resolve(
      this.createErrorResult(request.targetPresentationIndex, 'Decoder disposed.')
    ));
    if (this.decoder) {
      try {
        this.decoder.close();
      } catch {
        // ignore close failures during teardown
      }
      this.decoder = null;
    }
    this.decoderError = null;
    this.pendingDesiredIndex = null;
  }
}
