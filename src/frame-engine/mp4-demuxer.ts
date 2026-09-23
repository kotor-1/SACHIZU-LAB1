/**
 * SACHIZU LAB1 - MP4 Demuxer モジュール
 * mp4box.js を用いてコンテナ内のトラック情報、正確な PTS リスト、サンプルバイナリメタデータを抽出
 * Presentation Order (CTS順) でソートされた決定論的タイムラインを構築 (SSOT)
 */

import MP4Box from 'mp4box';
import { FrameInfo, VideoMetadata } from './types';
import { analyzeFrameIntervals, classifyFps } from './timeline-tracker';
import {
  buildDisplayTimelineForFrameGridFps,
  detectFrameGridFps,
  DisplayTimeline,
} from './display-timeline';

/** Demuxer のパース結果 */
export interface DemuxResult {
  metadata: VideoMetadata;
  frames: FrameInfo[];
  videoTrack: MP4VideoTrack;
  rawSamples: MP4Sample[];
  descriptionBuffer?: ArrayBuffer;
  hasEditList: boolean;
  presentationWindow: PresentationWindow | null;
  displayTimeline: DisplayTimeline;
  mp4File: MP4Box.MP4File;
}

/** mp4box 0.5.2 が info.tracks[*].edits へ公開する elst entry の実型。 */
export interface MP4EditListEntry {
  /** movie timescale単位 */
  segment_duration: number;
  /** track media timescale単位。-1はempty edit。 */
  media_time: number;
  media_rate_integer: number;
  media_rate_fraction: number;
}

// mp4box.js の簡易型定義 (onReady info.videoTracks[*] の公開objectに合わせる)
export interface MP4VideoTrack {
  id: number;
  name?: string;
  codec: string;
  size?: number;
  track_width: number;
  track_height: number;
  timescale: number;
  duration: number;
  nb_samples: number;
  movie_timescale?: number;
  movie_duration?: number;
  /** edts/elstが存在する場合だけmp4box 0.5.2が追加する公開配列。 */
  edits?: MP4EditListEntry[];
  mdia?: {
    minf?: {
      stbl?: {
        stsd?: {
          entries?: Array<{
            avcC?: { buffer?: ArrayBuffer };
            hvcC?: { buffer?: ArrayBuffer };
          }>;
        };
      };
    };
  };
}

export interface MP4Sample {
  track_id: number;
  number: number;
  cts: number;
  dts: number;
  duration: number;
  is_sync: boolean;
  offset: number;
  size: number;
  data?: ArrayBuffer;
  description?: unknown;
}

/** 単一playable editから確定したpresentation/media対応。 */
export interface PresentationWindow {
  /** track media timescale単位のedit開始CTS。 */
  mediaStartCts: number;
  /** track media timescale単位の半開区間終端。 */
  mediaEndCtsExclusive: number;
  /** movie timeline上のpresentation duration (秒)。 */
  presentationDuration: number;
  /** public PTS=0へ正規化した最初のeligible sample CTS。 */
  presentationOriginCts: number;
  /** edit開始より前のraw presentation-order sample数。 */
  excludedPreRollSampleCount: number;
  /** edit終端以後のraw presentation-order sample数。 */
  excludedPostRollSampleCount: number;
}

export interface PresentationTimelineBuildResult {
  frames: FrameInfo[];
  frameIntervals: number[];
  presentationDuration: number;
  hasEditList: boolean;
  presentationWindow: PresentationWindow | null;
  nominalGridFps: number;
  /** Complete presentation source count / duration; diagnostics only. */
  effectiveFrameDensity: number;
  presentationEffectiveFps: number;
  /** PTS temporal-quantum frame-grid diagnostic. */
  detectedFrameGridFps: number;
  /** PTS temporal-quantum interval used by detectedFrameGridFps. */
  baseFrameIntervalSeconds: number;
  missingGridIntervalCount: number;
}

/** silentな誤timelineを禁止するためのfail-closedエラー。 */
export class UnsupportedMP4EditListError extends Error {
  readonly code = 'UNSUPPORTED_MP4_EDIT_LIST';

  constructor(reason: string) {
    super(`未対応のMP4 edit listです: ${reason}`);
    this.name = 'UnsupportedMP4EditListError';
  }
}

function assertFiniteNumber(value: number, label: string): void {
  if (!Number.isFinite(value)) {
    throw new UnsupportedMP4EditListError(`${label}が有限数ではありません。`);
  }
}

/**
 * avcC / hvcC / vpcC / av1C ボックスから VideoDecoder の description を取り出す。
 *
 * mp4box 0.5.x の `onReady` が返す公開 videoTrack はメタデータ用の簡略
 * オブジェクトで、`mdia.minf.stbl.stsd` を持たない。configuration box は
 * 同じ MP4File の getTrackById() が返す実 box から取得する必要がある。
 * 公開 track を直接読むと iPhone HEVC の hvcC が silently 欠落し、
 * `VideoDecoder.configure()` が失敗して表示用 preview 全体が fallback になる。
 */
export function extractVideoDecoderDescription(
  file: MP4Box.MP4File,
  trackId: number
): ArrayBuffer | undefined {
  const runtimeMP4Box = MP4Box as unknown as {
    DataStream: {
      new (buffer?: ArrayBuffer, byteOffset?: number, endianness?: number): { buffer: ArrayBuffer };
      BIG_ENDIAN: number;
    };
  };
  const trak = (file as unknown as { getTrackById: (id: number) => unknown })
    .getTrackById(trackId) as {
    mdia?: {
      minf?: {
        stbl?: {
          stsd?: {
            entries?: Array<{
              avcC?: { write?: (stream: { buffer: ArrayBuffer }) => void };
              hvcC?: { write?: (stream: { buffer: ArrayBuffer }) => void };
              vpcC?: { write?: (stream: { buffer: ArrayBuffer }) => void };
              av1C?: { write?: (stream: { buffer: ArrayBuffer }) => void };
            }>;
          };
        };
      };
    };
  };
  const entries = trak.mdia?.minf?.stbl?.stsd?.entries ?? [];
  for (const entry of entries) {
    const box = entry.avcC ?? entry.hvcC ?? entry.vpcC ?? entry.av1C;
    if (!box?.write) continue;
    const stream = new runtimeMP4Box.DataStream(undefined, 0, runtimeMP4Box.DataStream.BIG_ENDIAN);
    box.write(stream);
    // description は MP4 box の size/type header を含まない decoder
    // configuration record。独立バッファへコピーしておく。
    return new Uint8Array(stream.buffer, 8).slice().buffer;
  }
  return undefined;
}

/**
 * raw samplesからpublic presentation timelineを構築する純粋関数。
 *
 * mp4box 0.5.2の公開objectではelstは track.edits に展開される。今回は
 * single playable edit / rate=1のみを実装し、それ以外はsilent fallbackせずfail-closedとする。
 */
export function buildPresentationTimeline(
  videoTrack: MP4VideoTrack,
  rawSamples: MP4Sample[]
): PresentationTimelineBuildResult {
  const timescale = videoTrack.timescale || 1000;
  const sortedSampleWrappers = rawSamples.map((sample, rawSampleIndex) => ({
    sample,
    rawSampleIndex,
  }));

  sortedSampleWrappers.sort((a, b) => {
    if (a.sample.cts !== b.sample.cts) return a.sample.cts - b.sample.cts;
    return a.sample.dts - b.sample.dts;
  });

  // mp4boxはedts boxがある場合だけown propertyとしてeditsを追加する。
  const hasEditList = Object.prototype.hasOwnProperty.call(videoTrack, 'edits');
  let presentationSamples = sortedSampleWrappers;
  let presentationDuration = videoTrack.duration / timescale;
  let presentationWindow: PresentationWindow | null = null;

  if (hasEditList) {
    const entries = videoTrack.edits;
    if (!Array.isArray(entries) || entries.length !== 1) {
      throw new UnsupportedMP4EditListError(
        `single playable entryのみ対応しています (entry count: ${entries?.length ?? 'invalid'})。`
      );
    }

    const entry = entries[0];
    assertFiniteNumber(entry.segment_duration, 'segment_duration');
    assertFiniteNumber(entry.media_time, 'media_time');
    assertFiniteNumber(entry.media_rate_integer, 'media_rate_integer');
    assertFiniteNumber(entry.media_rate_fraction, 'media_rate_fraction');

    if (entry.media_time < 0) {
      throw new UnsupportedMP4EditListError('empty editまたは負のmedia_timeには対応していません。');
    }
    if (entry.segment_duration <= 0) {
      throw new UnsupportedMP4EditListError('segment_durationは正数である必要があります。');
    }
    if (entry.media_rate_integer !== 1 || entry.media_rate_fraction !== 0) {
      throw new UnsupportedMP4EditListError(
        `media rate ${entry.media_rate_integer}+${entry.media_rate_fraction}/65536 は未対応です。`
      );
    }

    const movieTimescale = videoTrack.movie_timescale;
    if (!movieTimescale || !Number.isFinite(movieTimescale) || movieTimescale <= 0) {
      throw new UnsupportedMP4EditListError('movie_timescaleが取得できません。');
    }

    presentationDuration = entry.segment_duration / movieTimescale;
    const mediaDuration = presentationDuration * timescale;
    const mediaStartCts = entry.media_time;
    const mediaEndCtsExclusive = mediaStartCts + mediaDuration;

    presentationSamples = sortedSampleWrappers.filter(({ sample }) => (
      sample.cts >= mediaStartCts && sample.cts < mediaEndCtsExclusive
    ));

    if (presentationSamples.length === 0) {
      throw new UnsupportedMP4EditListError('playable edit window内にvideo sampleがありません。');
    }

    presentationWindow = {
      mediaStartCts,
      mediaEndCtsExclusive,
      presentationDuration,
      // edit境界がsample間にある場合、HTML/ffmpeg presentation numberingと同じく
      // 最初のeligible source sampleをpublic PTS 0へ正規化する。
      presentationOriginCts: presentationSamples[0].sample.cts,
      excludedPreRollSampleCount: sortedSampleWrappers.filter(
        ({ sample }) => sample.cts < mediaStartCts
      ).length,
      excludedPostRollSampleCount: sortedSampleWrappers.filter(
        ({ sample }) => sample.cts >= mediaEndCtsExclusive
      ).length,
    };
  }

  const presentationOriginCts = presentationSamples[0]?.sample.cts ?? 0;
  const frames: FrameInfo[] = presentationSamples.map(({ sample, rawSampleIndex }, presentationFrameIndex) => {
    const presentationPts = (sample.cts - presentationOriginCts) / timescale;
    return {
      frameIndex: presentationFrameIndex,
      presentationFrameIndex,
      rawSampleIndex,
      sampleIndex: rawSampleIndex,
      presentationPts,
      pts: presentationPts,
      rawCts: sample.cts,
      cts: sample.cts,
      dts: sample.dts,
      duration: sample.duration / timescale,
      isKeyframe: sample.is_sync,
      sampleOffset: sample.offset,
      sampleSize: sample.size,
    };
  });

  // MediaRecorder MP4 headers can retain an initial/zero duration even though
  // later fragments contain more samples. With no edit window, all extracted
  // presentation samples belong to the clip. Derive a lower bound from their
  // encoded CTS + duration, never from wall time, nominal FPS, or frame count.
  // Explicit edit-list windows above remain authoritative and are not extended.
  if (!hasEditList && frames.length > 0) {
    const sampleEnd = frames.reduce((end, frame) => Math.max(end,
      Number.isFinite(frame.duration) && frame.duration > 0 ? frame.pts + frame.duration : frame.pts), 0);
    presentationDuration = Math.max(Number.isFinite(presentationDuration) ? presentationDuration : 0, sampleEnd);
  }

  // Edit-list videoのFrameInfo.durationはdecode-order sample durationではなく、
  // presentation上の隣接source frame間隔 (末尾はmovie durationまで) とする。
  if (hasEditList && frames.length > 0) {
    for (let i = 0; i < frames.length - 1; i++) {
      frames[i].duration = frames[i + 1].pts - frames[i].pts;
    }
    frames[frames.length - 1].duration = Math.max(
      0,
      presentationDuration - frames[frames.length - 1].pts
    );
  }

  const frameIntervals = frames.map((frame) => frame.duration).filter((duration) => duration > 0);
  const transitionIntervals = frames.slice(1).map((frame, index) => (
    frame.pts - frames[index].pts
  )).filter((duration) => duration > 0);
  const nominalGridInterval = transitionIntervals.length > 0
    ? Math.min(...transitionIntervals)
    : frameIntervals[0] ?? 0;
  const nominalGridFps = nominalGridInterval > 0 ? Math.round(1 / nominalGridInterval) : 0;
  const gridDetection = frames.length > 0
    ? detectFrameGridFps(frames, presentationDuration, timescale)
    : null;
  const detectedGridInterval = gridDetection?.baseFrameIntervalSeconds || nominalGridInterval;
  const missingGridIntervalCount = detectedGridInterval > 0
    ? transitionIntervals.reduce((count, interval) => (
        count + Math.max(0, Math.round(interval / detectedGridInterval) - 1)
      ), 0)
    : 0;

  return {
    frames,
    frameIntervals,
    presentationDuration,
    hasEditList,
    presentationWindow,
    nominalGridFps,
    effectiveFrameDensity: presentationDuration > 0 ? frames.length / presentationDuration : 0,
    presentationEffectiveFps: presentationDuration > 0 ? frames.length / presentationDuration : 0,
    detectedFrameGridFps: gridDetection?.detectedFrameGridFps ?? 0,
    baseFrameIntervalSeconds: gridDetection?.baseFrameIntervalSeconds ?? 0,
    missingGridIntervalCount,
  };
}

/**
 * File または Blob から MP4 メタデータ、全フレームの PTS リスト、およびサンプルデータを抽出
 */
export async function demuxMP4(file: File | Blob): Promise<DemuxResult> {
  return new Promise((resolve, reject) => {
    const mp4File = MP4Box.createFile();
    const reader = new FileReader();

    let videoTrack: MP4VideoTrack | null = null;
    const collectedSamples: MP4Sample[] = [];
    let isReady = false;

    mp4File.onError = (e: unknown) => {
      reject(new Error(`MP4Box 解析エラー: ${String(e)}`));
    };

    mp4File.onReady = (info: { videoTracks: MP4VideoTrack[] }) => {
      if (!info.videoTracks || info.videoTracks.length === 0) {
        reject(new Error('動画ファイル内に映像トラックが存在しません。'));
        return;
      }
      isReady = true;
      videoTrack = info.videoTracks[0];

      // サンプルの抽出トラックを設定 (全サンプル抽出)
      mp4File.setExtractionOptions(videoTrack.id, null, { nbSamples: videoTrack.nb_samples });
      mp4File.start();
    };

    mp4File.onSamples = (trackId: number, _user: unknown, samples: MP4Sample[]) => {
      if (videoTrack && trackId === videoTrack.id) {
        collectedSamples.push(...samples);
      }
    };

    reader.onload = (e) => {
      const buffer = e.target?.result as ArrayBuffer;
      if (!buffer) {
        reject(new Error('動画データの読み込みに失敗しました。'));
        return;
      }

      // MP4Box にバッファを渡すための offset 付き ArrayBuffer
      const mp4Buffer = buffer as ArrayBuffer & { fileStart: number };
      mp4Buffer.fileStart = 0;

      try {
        mp4File.appendBuffer(mp4Buffer);
        mp4File.flush();

        if (!isReady || !videoTrack) {
          // mp4box で即座に onReady が来ないケースのフォールバック
          setTimeout(() => {
            if (videoTrack && collectedSamples.length > 0) {
              finishExtraction();
            } else {
              reject(new Error('MP4 メタデータの解析が完了しませんでした。'));
            }
          }, 300);
          return;
        }

        finishExtraction();
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = () => {
      reject(new Error('ファイルの読み取り中にエラーが発生しました。'));
    };

    function finishExtraction() {
      if (!videoTrack) {
        reject(new Error('映像トラックが見つかりませんでした。'));
        return;
      }

      const timescale = videoTrack.timescale || 1000;
      let timeline: PresentationTimelineBuildResult;
      try {
        timeline = buildPresentationTimeline(videoTrack, collectedSamples);
      } catch (err) {
        reject(err);
        return;
      }

      const frames = timeline.frames;
      const durations = timeline.frameIntervals;

      // A missing extraction result cannot be repaired by inventing a 60/120/
      // 240fps grid: that would create synthetic source frames and make the
      // uploaded video's FPS authority ambiguous.  Fail closed instead and
      // let the caller report that exact presentation samples were unavailable.
      if (frames.length === 0) {
        reject(new Error('動画のpresentation sampleを抽出できませんでした。自動FPS判定を続行できません。'));
        return;
      }

      const intervalStats = analyzeFrameIntervals(durations);
      const totalDuration = timeline.presentationDuration;
      // Keep a separate uniform display grid as diagnostics. Normal frame
      // navigation uses the presentation source deck directly; the grid's
      // PTS-derived temporal quantum is never allowed to create duplicate
      // hold positions or replace a real source frame.
      let displayTimeline: DisplayTimeline;
      try {
        // buildPresentationTimeline already performed the single cadence
        // detection for this upload. Reuse that authority to avoid a second
        // independent inference during display-deck construction.
        displayTimeline = buildDisplayTimelineForFrameGridFps(
          frames,
          totalDuration,
          timeline.detectedFrameGridFps,
          timescale
        );
      } catch (err) {
        reject(err);
        return;
      }
      const nominalFps = intervalStats.nominalFps || Math.round(frames.length / (totalDuration || 1));
      const fpsCategory = classifyFps(displayTimeline.detectedFrameGridFps);

      // iPhone スローモーション動画の判定
      const isSlowMotion = nominalFps >= 110 || (frames.length > 0 && frames.length / totalDuration > 100);

      // Description buffer (avcC / hvcC) は onReady の公開 track ではなく、
      // 実 box から取り出す。特に iPhone HEVC の hvcC は WebCodecs に必要。
      const descriptionBuffer = extractVideoDecoderDescription(mp4File, videoTrack.id);

      const metadata: VideoMetadata = {
        duration: totalDuration,
        width: videoTrack.track_width,
        height: videoTrack.track_height,
        nominalFps,
        actualFrameCount: frames.length,
        isVFR: intervalStats.isVFR,
        minFrameInterval: intervalStats.minInterval,
        maxFrameInterval: intervalStats.maxInterval,
        avgFrameInterval: intervalStats.avgInterval,
        codec: videoTrack.codec,
        containerType: 'mp4',
        timeScale: timescale,
        fpsCategory,
        isSlowMotion,
        fpsDistribution: intervalStats.fpsDistribution,
        rawSampleCount: collectedSamples.length,
        nominalGridFps: timeline.nominalGridFps,
        effectiveFrameDensity: timeline.effectiveFrameDensity,
        presentationEffectiveFps: timeline.presentationEffectiveFps,
        missingGridIntervalCount: timeline.missingGridIntervalCount,
        detectedFrameGridFps: displayTimeline.detectedFrameGridFps,
        baseFrameIntervalSeconds: displayTimeline.baseFrameIntervalSeconds,
        // Deprecated compatibility alias. This value is now the grid FPS,
        // never the effective presentation density.
        detectedPlaybackFps: displayTimeline.detectedFrameGridFps,
        displayFrameCount: displayTimeline.displayFrameCount,
        playbackFpsDetectionMethod: displayTimeline.detectionMethod,
        frameGridDetectionMethod: displayTimeline.detectionMethod,
        playbackFpsCandidates: displayTimeline.fpsCandidates,
        displayMappingPolicy: displayTimeline.mappingPolicy,
        duplicateDisplaySlotCount: displayTimeline.duplicateDisplaySlotCount,
      };

      resolve({
        metadata,
        frames,
        videoTrack,
        rawSamples: collectedSamples,
        descriptionBuffer,
        hasEditList: timeline.hasEditList,
        presentationWindow: timeline.presentationWindow,
        displayTimeline,
        mp4File,
      });
    }

    reader.readAsArrayBuffer(file);
  });
}
