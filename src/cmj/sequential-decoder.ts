import type { FrameInfo } from '../frame-engine/types';
import type { MP4Sample, MP4VideoTrack } from '../frame-engine/mp4-demuxer';
import { classifyLengthPrefixedHevcSample, getHevcNalLengthSize } from '../frame-engine/hevc-sample-classifier';

/** One continuous decode pass. Never flush between frames (flush requires a
 * new key chunk). Encoded chunks stay in decode order; output identity is CTS,
 * not callback order. Backpressure bounds retained frames on mobile devices. */
export class SequentialRecordingDecoder {
  static readonly MAX_AHEAD = 16;
  static isAvailable() {
    return typeof VideoDecoder !== 'undefined' && typeof VideoDecoder.isConfigSupported === 'function';
  }
  private decoder: VideoDecoder | null = null;
  private outputs = new Map<number, VideoFrame>();
  private seen = new Set<number>();
  private timestamps = new Map<number, number>();
  private rawTimestamps = new Set<number>();
  private submitted = 0;
  private emitted = 0;
  private nextIndex = 0;
  private flushed = false;
  private flushing = false;
  private disposed = false;
  private failure: Error | null = null;
  private wake: (() => void) | null = null;
  private bitmap: ImageBitmap | null = null;
  private nalLengthSize: number | null = null;
  readonly diagnostics = { submittedSamples: 0, emittedFrames: 0, maxRetainedFrames: 0, configureCount: 0 };

  constructor(private file: Blob, private track: MP4VideoTrack, private frames: FrameInfo[],
    private samples: MP4Sample[], private description?: ArrayBuffer) {
    for (const sample of samples) {
      const ts = this.timestamp(sample.cts);
      if (!Number.isSafeInteger(ts) || this.rawTimestamps.has(ts)) throw new Error('動画に不正または重複するフレーム時刻があります。');
      this.rawTimestamps.add(ts);
    }
    for (const [index, f] of frames.entries()) {
      const ts = this.timestamp(f.rawCts ?? f.cts);
      if (!this.rawTimestamps.has(ts) || f.frameIndex !== index) throw new Error('元動画と解析対象のフレーム情報が一致しません。');
      this.timestamps.set(ts, f.frameIndex);
    }
    if (this.timestamps.size !== frames.length) throw new Error('動画のフレーム時刻を一意に確認できません。');
    if (/^(hvc1|hev1)\./i.test(track.codec)) {
      if (!description) throw new Error('HEVCの設定情報がありません。');
      this.nalLengthSize = getHevcNalLengthSize(description);
    }
  }
  private timestamp(cts: number) { return Math.round(cts / (this.track.timescale || 1000) * 1_000_000); }
  private check() {
    if (this.disposed) throw new DOMException('中止', 'AbortError');
    if (this.failure) throw this.failure;
  }
  private initialize() {
    this.decoder = new VideoDecoder({
      output: frame => {
        if (this.disposed || this.failure) { frame.close(); return; }
        this.emitted++; this.diagnostics.emittedFrames++;
        const ts = frame.timestamp;
        if (!this.rawTimestamps.has(ts) || this.seen.has(ts)) {
          frame.close(); this.failure = new Error('読み出した映像の時刻が元フレームと一致しません。');
        } else {
          this.seen.add(ts);
          const index = this.timestamps.get(ts);
          // Decode preroll for reference dependencies, but do not measure it.
          if (index === undefined) frame.close();
          else {
            this.outputs.set(index, frame);
            this.diagnostics.maxRetainedFrames = Math.max(this.diagnostics.maxRetainedFrames, this.outputs.size);
          }
        }
        this.wake?.();
      },
      error: error => { this.failure = error; this.wake?.(); },
    });
    this.decoder.configure({ codec: this.track.codec, codedWidth: this.track.track_width,
      codedHeight: this.track.track_height, description: this.description });
    this.diagnostics.configureCount++;
  }
  private async feed() {
    // Count both pending codec outputs and retained outputs, not just the
    // browser decodeQueueSize (which excludes internal codec buffers).
    while (this.submitted < this.samples.length &&
      this.submitted - this.emitted + this.outputs.size < SequentialRecordingDecoder.MAX_AHEAD) {
      this.check();
      const sample = this.samples[this.submitted];
      const data = sample.data ?? await this.file.slice(sample.offset, sample.offset + sample.size).arrayBuffer();
      this.check();
      if (data.byteLength !== sample.size) throw new Error('動画の圧縮データが不足しています。');
      const isKey = this.nalLengthSize === null ? sample.is_sync
        : !!classifyLengthPrefixedHevcSample(data, this.nalLengthSize).randomAccessKind;
      if (this.submitted === 0 && !isKey) throw new Error('先頭の基準フレームを確認できません。互換性優先のMP4をお試しください。');
      this.submitted++; this.diagnostics.submittedSamples++;
      this.decoder!.decode(new EncodedVideoChunk({ type: isKey ? 'key' : 'delta',
        timestamp: this.timestamp(sample.cts), duration: this.timestamp(sample.duration), data }));
    }
    if (this.submitted === this.samples.length && !this.flushing) {
      this.flushing = true;
      void this.decoder!.flush().then(() => { this.flushed = true; this.wake?.(); }, error => {
        if (!this.disposed) this.failure = error instanceof Error ? error : new Error(String(error));
        this.wake?.();
      });
    }
  }
  async decodeExactFrame(index: number) {
    this.check();
    if (index !== this.nextIndex || !this.frames[index]) throw new Error('録画フレームは先頭から順番に解析してください。');
    this.bitmap?.close(); this.bitmap = null;
    if (!this.decoder) this.initialize();
    while (!this.outputs.has(index)) {
      await this.feed(); this.check();
      if (this.outputs.has(index)) break;
      if (this.flushed) throw new Error(`元動画のフレーム ${index} を読み出せませんでした。`);
      // A stalled codec must not leave the UI waiting forever. Abort/dispose
      // wakes immediately; no polling or long uninterruptible waits.
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => { this.wake = null; reject(new Error('動画の読み出しが停止しました。互換性優先のMP4をお試しください。')); }, 15000);
        this.wake = () => { clearTimeout(timeout); this.wake = null; resolve(); };
      });
      this.check();
    }
    const frame = this.outputs.get(index)!; this.outputs.delete(index);
    try {
      // Keep the same bitmap conversion as the reference exact decoder, so
      // inference receives the same pixels, dimensions and color conversion.
      const bitmap = await createImageBitmap(frame);
      if (this.disposed) { bitmap.close(); this.check(); }
      this.bitmap = bitmap;
    } finally { frame.close(); }
    this.nextIndex++;
    return { status: 'SUCCESS' as const, bitmap: this.bitmap!, actualDecodedFrameIndex: index };
  }
  dispose() {
    this.disposed = true; this.wake?.();
    if (this.decoder && this.decoder.state !== 'closed') this.decoder.close();
    this.decoder = null;
    for (const frame of this.outputs.values()) frame.close();
    this.outputs.clear(); this.bitmap?.close(); this.bitmap = null;
  }
}
