/**
 * SACHIZU LAB1 - Frame Engine 型定義
 * 設計書 v1.1 に準拠
 */

/** 使用されたデコード経路 */
export type DecoderPath = 'webcodecs' | 'rvfc' | 'htmlvideo_legacy';

/** 検証エンジンの種類 */
export type VerificationType = 'webcodecs_exact' | 'rvfc_preview';

/** サンプル試行のステータス */
export type SampleStatus = 'SUCCESS' | 'TIMEOUT' | 'ERROR' | 'UNSUPPORTED';

/** エンジンの動作モード */
export type EngineOperationMode = 'playback' | 'exact_frame';

/** デコードリソースのメモリ診断情報 (iPhone Safari Jetsam クラッシュ監視用) */
export interface MemoryDiagnostics {
  /** 現在キャッシュ中の ImageBitmap 数 (1 または 3 以下) */
  exactCacheCount: number;
  /** キャッシュ上限設定 (1 または 3) */
  maxCacheLimit: number;
  /** 生成された ImageBitmap 累計数 */
  createdImageBitmaps: number;
  /** 解放 (close) された ImageBitmap 累計数 */
  closedImageBitmaps: number;
  /** 生成された VideoFrame 累計数 */
  createdVideoFrames: number;
  /** 解放 (close) された VideoFrame 累計数 */
  closedVideoFrames: number;
  /** 現在アクティブなデコードタスク数 (最大 1) */
  activeDecodeCount: number;
  /** 連打により集約 (coalesced) された要求数 */
  coalescedRequestCount: number;
  /** 最新リクエストID */
  latestRequestId: number;
  /** 目標フレームインデックス (集約中) */
  desiredFrameIndex: number;
  /** デコーダの状態 ('idle' | 'decoding' | 'coalescing') */
  decoderState: 'idle' | 'decoding' | 'coalescing';
  /** WebCodecs decoder.configure() cumulative count */
  decoderConfigureCount: number;
  /** WebCodecs decoder.reset() cumulative count */
  decoderResetCount: number;
  /** keyframeからdecodeを開始した回数 */
  keyframeSeekCount: number;
  /** これまでに投入したraw encoded sample数の累計 */
  decodedSampleCountTotal: number;
  /** 直近要求で新たに投入したraw encoded sample数 */
  lastDecodedSampleCount: number;
  /** exact display cache hit数 */
  cacheHitCount: number;
  /** exact display cache miss数 */
  cacheMissCount: number;
  /** 直近要求がcache hitだったか */
  lastCacheHit: boolean;
  /** 直近exact要求のデコード所要時間 (ms) */
  lastDecodeLatencyMs: number;
  /** FrameEngine側のcanvas描画回数 (decoder単体では0) */
  canvasDrawCount?: number;
  /** FrameEngine側の要求開始から表示描画までの直近時間 (ms) */
  lastDisplayLatencyMs?: number;
  /** 表示専用圧縮プレビューの診断情報 */
  previewCacheCount?: number;
  previewCacheCapacity?: number;
  previewBlobCount?: number;
  previewTotalBytes?: number;
  previewCacheHitCount?: number;
  previewCacheMissCount?: number;
  previewReady?: boolean;
  /** presentation preview全数の初期生成時間 (ms) */
  previewBuildTimeMs?: number;
  /** ImageBitmap LRUのprefetch半径 */
  previewPrefetchRadius?: number;
  /** createImageBitmapの最大並列数 */
  previewMaxInflight?: number;
  /** createImageBitmap開始累計数 */
  previewBitmapCreateCount?: number;
  /** 現在のcreateImageBitmap実行数 */
  previewInflightCount?: number;
  /** rapid navigationでクリックごとに同期更新される最新presentation source target */
  requestedFrameIndex?: number;
  /** 実際に表示用source frameがsettleしたpresentation index */
  displayedFrameIndex?: number;
  /** VideoCanvasがdrawImage完了をacknowledgeしたindex */
  canvasRenderedFrameIndex?: number;
  /** latest target変更によりcanvasへ渡されなかった古いrender数 */
  staleRenderDiscardedCount?: number;
  /** preview欠落によりstep中にexact decodeした累計数 */
  exactDecodeDuringStepCount?: number;
  /** 最新inputからrequested/displayed一致までの時間 (ms) */
  lastNavigationCatchupMs?: number;
  /** 最新inputからdisplay resource settleまでの時間 (ms) */
  lastNavigationResourceSettleMs?: number;
  /** 通常の+/-1 stepが走査するpresentation source frame数 */
  navigationFrameCount?: number;
  /** PTS temporal-quantum frame-grid FPS (diagnostic metadata only). */
  detectedFrameGridFps?: number;
  /** frame-grid FPSの基礎となるpresentation時間量 (秒) */
  baseFrameIntervalSeconds?: number;
  /** 完全なpresentation source count / movie duration (diagnostic only) */
  effectiveFrameDensity?: number;
  /** @deprecated detectedFrameGridFpsの互換alias。densityではない。 */
  detectedPlaybackFps?: number;
  displayFrameCount?: number;
}

/** 動画のメタデータ情報 */
export interface VideoMetadata {
  /** 動画の総時間 (秒) */
  duration: number;
  /** 横幅 (px) */
  width: number;
  /** 高さ (px) */
  height: number;
  /** 公称フレームレート (fps) または平均サンプルレート */
  nominalFps: number;
  /** PTSテーブルから算出された実際の総フレーム数 */
  actualFrameCount: number;
  /** 可変フレームレート (VFR) かどうか */
  isVFR: boolean;
  /** 最小フレーム間隔 (秒) */
  minFrameInterval: number;
  /** 最大フレーム間隔 (秒) */
  maxFrameInterval: number;
  /** 平均フレーム間隔 (秒) */
  avgFrameInterval: number;
  /** コーデック文字列 (例: "avc1.640028", "hvc1.1.6.L120.90") */
  codec: string;
  /** コンテナ種別 */
  containerType: 'mp4' | 'quicktime' | 'unknown';
  /** MP4 Timescale (1秒あたりの単位数) */
  timeScale: number;
  /** 60/120/240fps 分類 */
  fpsCategory: 'unsupported_low' | '60fps' | '120fps_recommended' | '240fps_high';
  /** スローモーション素材かどうかの検出フラグ */
  isSlowMotion: boolean;
  /** VFR動画におけるフレームレート分布 */
  fpsDistribution: Array<{ label: string; fpsEquivalent: number; percentage: number }>;
  /** MP4内の未編集raw video sample数 (診断用) */
  rawSampleCount?: number;
  /** presentation CTSの最小グリッドから求めた公称FPS (診断用。コマ送りには不使用) */
  nominalGridFps?: number;
  /** public presentation frame数 / presentation duration (診断用。コマ送りには不使用) */
  presentationEffectiveFps?: number;
  /** nominal grid上でsource sampleが存在しないpresentation interval数 */
  missingGridIntervalCount?: number;
  /** 完全なedit-list-aware presentation source count / duration (診断値)。 */
  effectiveFrameDensity?: number;
  /** PTS temporal quantumから自動検出したframe-grid (diagnostic metadata)。 */
  detectedFrameGridFps?: number;
  /** detectedFrameGridFpsの根拠となるpresentation時間量 (秒)。 */
  baseFrameIntervalSeconds?: number;
  /** detectedFrameGridFpsで生成したuniform display slot数。source frame数とは別。 */
  displayFrameCount?: number;
  /** @deprecated detectedFrameGridFpsの互換alias。値はgrid FPS。 */
  detectedPlaybackFps?: number;
  /** frame-grid FPSの検出根拠（診断用）。 */
  frameGridDetectionMethod?: 'pts_temporal_quantum';
  /** 旧名称を読むコードとの互換。 */
  playbackFpsDetectionMethod?: 'presentation_density' | 'pts_temporal_quantum';
  /** FPS候補の監査値。effective densityとtemporal quantumを分離する。 */
  playbackFpsCandidates?: {
    effectiveFrameDensity: number;
    presentationDensityFps: number;
    ptsSpanFps: number;
    legacyRoundedPresentationFps: number;
    medianIntervalFps: number;
    dominantIntervalFps: number;
    shortIntervalMeanFps: number;
    baseFrameIntervalSeconds: number;
    temporalQuantumFps: number;
  };
  /** lossless source assignment後、余剰slotを直前sourceのholdで埋める規則。 */
  displayMappingPolicy?: 'lossless_monotonic_hold';
  /** exact source assignment以外のhold slot数。 */
  duplicateDisplaySlotCount?: number;
}

/** コーデック適合性チェック結果 (Preflight) */
export interface CodecSupportResult {
  /** サポートされているか */
  isSupported: boolean;
  /** 使用可能なデコーダ方式 */
  decoderType: 'webcodecs' | 'htmlvideo' | 'none';
  /** 検出されたコーデック */
  codec: string;
  /** ユーザー向けメッセージ */
  message: string;
  /** 警告リスト */
  warnings: string[];
}

/** 1フレームのPTSタイムライン情報 (Presentation Order 基準) */
export interface FrameInfo {
  /** 0から始まる人間が見る表示順のフレーム番号 (SSOT) */
  frameIndex: number;
  /** 表示順フレーム番号 (frameIndexと同値) */
  presentationFrameIndex: number;
  /** MP4抽出配列内のraw sample index。WebCodecs decode identityのauthority。 */
  rawSampleIndex?: number;
  /** @deprecated rawSampleIndexの互換alias */
  sampleIndex: number;
  /** presentation-local PTS (秒, 0-based)。UI/TD/TO/fallback seekのauthority。 */
  presentationPts?: number;
  /** @deprecated presentationPtsの互換alias */
  pts: number;
  /** media-spaceのraw Composition Time Stamp */
  rawCts?: number;
  /** @deprecated rawCtsの互換alias */
  cts: number;
  /** 生の Decoding Time Stamp */
  dts: number;
  /** フレームの表示継続時間 (秒) */
  duration: number;
  /** キーフレーム (Iフレーム / Sync sample) かどうか */
  isKeyframe: boolean;
  /** MP4サンプルのバイトオフセット (WebCodecsデコード用) */
  sampleOffset?: number;
  /** MP4サンプルのバイトサイズ */
  sampleSize?: number;
}

/** 解析用および描画用に抽出されたフレーム */
export interface ExtractedFrame {
  /** 対応する目標フレーム情報 */
  frameInfo: FrameInfo;
  /** 画面描画用 ImageBitmap (解放可能) */
  bitmap: ImageBitmap | null;
  /**
   * 表示専用の圧縮プレビュー。presentation frame indexはexact bitmapと
   * 同じだが、TD/TO・Pose入力には絶対に使用しない。
   */
  displayBitmap?: ImageBitmap | null;
  /** Canvas要素への描画補助 (解放可能) */
  canvas: HTMLCanvasElement | null;
  /** フレーム横幅 */
  width: number;
  /** フレーム高さ */
  height: number;
  /** 実際に取得・提示されたタイムスタンプ (秒, timeout/error時は-1) */
  actualPts: number;
  /** 実decode provenanceから照合したpresentation frame index。target metadataのechoではない。 */
  actualFrameIndex: number;
  /**
   * 互換表示フィールド。現在はpresentationFrameIndexと同じsource index
   * であり、通常ナビゲーションにduplicate/hold domainは存在しない。
   */
  displayFrameIndex?: number;
  /** 互換表示フィールド。現在はsource presentation PTS (seconds)。 */
  displayPts?: number;
  /** Development diagnostic: source identity of the selected display resource. */
  displayResourceSourceIndex?: number;
  /** Development diagnostic: exact presentation-index key used by preview LRU. */
  displayBitmapCacheKey?: number | null;
  /** Development diagnostic: SHA-256 prefix of the selected preview JPEG. */
  displayResourceFingerprint?: string | null;
  /** 要求したraw MP4 sample index (WebCodecs経路の診断用) */
  targetRawSampleIndex?: number;
  /** 実際にtimestamp照合できたraw MP4 sample index (WebCodecs経路の診断用) */
  actualDecodedRawSampleIndex?: number;
  /** 目標フレームインデックスとの差 (|actualFrameIndex - targetFrameIndex|) */
  frameIndexDiff: number;
  /** 目標PTSと実PTSの誤差 (|targetPts - actualPts|, 秒) */
  ptsDiff: number;
  /** Phase 0A取得診断の互換値。scientific exact identityの証明には使用しない。 */
  isPass: boolean;
  /** 採用されたデコード経路 */
  decoderPath: DecoderPath;
  /** 試行ステータス */
  status: SampleStatus;
  /** デコード所要時間 (ms) */
  decodeLatencyMs?: number;
  /** 直近要求で新たに投入されたencoded sample数 (cache hitは0) */
  decodedSampleCount?: number;
  /** 要求開始からdisplay canvas描画完了までの所要時間 (ms) */
  displayLatencyMs?: number;
  /** 直前キーフレームインデックス */
  keyframeIndex?: number;
  /** decode開始点となったraw MP4 key sample index */
  keyframeRawSampleIndex?: number;
  /** WebCodecs出力そのもののtimestamp (microseconds)。 */
  decodedVideoFrameTimestampUs?: number;
  /** HEVC random access authorityとなったVCL NAL type (16-21)。 */
  randomAccessHevcNalUnitType?: number | null;
  /** CRA開始時に非decodable leading pictureとして除外したraw RASL samples。 */
  omittedRaslRawSampleIndexes?: number[];
  /** デバッグ用 raw currentTime */
  rawCurrentTime?: number;
  /** リソース解放ハンドラ (メモリリーク防止) */
  dispose: () => void;
}

/** 単一サンプルの精度検証記録 (証拠データ) */
export interface GateVerificationSample {
  sampleIndex: number;
  targetFrameIndex: number;
  actualDecodedFrameIndex: number;
  frameIndexDiff: number;
  targetSamplePts: number;
  decodedVideoFrameTimestampUs: number;
  timestampDiffUs: number;
  diffMs: number;
  keyframeIndex: number;
  decodedSampleCount: number;
  decodeLatencyMs: number;
  decoderPath: DecoderPath;
  status: SampleStatus;
  rawCurrentTime?: number;
  isPass: boolean;
}

/** Phase 0A 暫定合格基準の検証結果 */
export interface GateVerificationResult {
  /** 検証種別 */
  verificationType: VerificationType;
  /** 検証モード (formal_gate: 100+ samples, smoke_test: <100 samples) */
  sampleMode: 'formal_gate' | 'smoke_test';
  /** 総試行回数 */
  totalTrials: number;
  /** 合格試行回数 (frameIndexDiff <= 1 かつ status == 'SUCCESS') */
  passTrials: number;
  /** 不合格試行回数 */
  failTrials: number;
  /** 完全一致試行回数 (frameIndexDiff === 0) */
  exactMatchTrials: number;
  /** タイムアウト発生回数 */
  timeoutCount: number;
  /** 合格率 (0.0 〜 1.0) */
  passRate: number;
  /** 完全一致率 (0.0 〜 1.0, 診断情報) */
  exactMatchRate: number;
  /** 設計書基準の合格率 (0.99 = 99.0%) */
  gateStandard: number;
  /** ゲートを通過したか */
  isPassed: boolean;
  /** 最大PTS誤差 (ms, 診断情報) */
  maxDiffMs: number;
  /** 中央値PTS誤差 (ms, 診断情報) */
  medianDiffMs: number;
  /** 95%タイルPTS誤差 (ms, 診断情報) */
  p95DiffMs: number;
  /** 99%タイルPTS誤差 (ms, 診断情報) */
  p99DiffMs: number;
  /** 平均PTS誤差 (ms, 診断情報) */
  avgDiffMs: number;
  /** デコードレイテンシ中央値 (ms) */
  medianLatencyMs: number;
  /** デコードレイテンシ95%タイル (ms) */
  p95LatencyMs: number;
  /** デコードレイテンシ最大値 (ms) */
  maxLatencyMs: number;
  /** 平均デコードサンプル数 */
  avgDecodedSampleCount: number;
  /** 主に使用されたデコーダ経路 */
  decoderPath: DecoderPath;
  /** 不合格サンプルのリスト */
  failedSamples: GateVerificationSample[];
  /** 各試行の全サンプリング詳細 */
  samples: GateVerificationSample[];
  /** 警告・診断メッセージ */
  warnings: string[];
}

/** 実機検証結果 JSON Export スキーマ */
export interface DeviceVerificationExport {
  schemaVersion: '1.2.0';
  exportTimestamp: string;
  deviceInfo: {
    userAgent: string;
    platform: string;
    language: string;
    isSecureContext: boolean;
    hasVideoDecoder: boolean;
    screenWidth: number;
    screenHeight: number;
    devicePixelRatio: number;
    hardwareConcurrency?: number;
  };
  videoInfo: {
    codec: string;
    resolution: string;
    durationSec: number;
    nominalFps: number;
    detectedFps: number;
    /** PTS temporal-quantum FPS used by navigation. */
    frameGridFps?: number;
    /** Presentation source count / movie duration, diagnostics only. */
    effectiveFrameDensity?: number;
    actualFrameCount: number;
    isVFR: boolean;
    minIntervalMs: number;
    maxIntervalMs: number;
    avgIntervalMs: number;
    isSlowMotion: boolean;
    hasEditList?: boolean;
    fpsDistribution?: Array<{ label: string; fpsEquivalent: number; percentage: number }>;
  };
  gateResult: {
    verificationType: VerificationType;
    sampleMode: 'formal_gate' | 'smoke_test';
    decoderPath: DecoderPath;
    sampleCount: number;
    passCount: number;
    failCount: number;
    exactMatchCount: number;
    timeoutCount: number;
    passRatePercent: number;
    exactMatchRatePercent: number;
    gateStandardPercent: number;
    isPassed: boolean;
    medianDiffMs: number;
    p95DiffMs: number;
    p99DiffMs: number;
    maxDiffMs: number;
    avgDiffMs: number;
    medianLatencyMs: number;
    p95LatencyMs: number;
    maxLatencyMs: number;
    avgDecodedSampleCount: number;
    warnings: string[];
  };
  samples: GateVerificationSample[];
}

/** FrameProvider インターフェース */
export interface IFrameProvider {
  loadVideo(file: File | Blob): Promise<VideoMetadata>;
  getMetadata(): VideoMetadata | null;
  getCodecSupport(): CodecSupportResult | null;
  seekToTimestamp(pts: number, timeoutMs?: number): Promise<ExtractedFrame>;
  seekToFrame(frameIndex: number, timeoutMs?: number): Promise<ExtractedFrame>;
  seekExactFrame(frameIndex: number): Promise<ExtractedFrame>;
  stepExactFrame(delta: number): Promise<ExtractedFrame>;
  stepFrames(stepCount: number, timeoutMs?: number): Promise<ExtractedFrame>;
  nextFrame(timeoutMs?: number): Promise<ExtractedFrame>;
  previousFrame(timeoutMs?: number): Promise<ExtractedFrame>;
  getCurrentFrameInfo(): FrameInfo | null;
  /** Uniform display gridの診断情報を取得 (通常UI navigation domainではない)。 */
  getAllDisplayFrames?(): import('./display-timeline').DisplayFrameInfo[];
  /** 互換API。引数はpresentation source indexとして扱う。 */
  seekDisplayFrame?(sourceFrameIndex: number): Promise<ExtractedFrame>;
  setExactCacheLimit(limit: 1 | 3): void;
  getMemoryDiagnostics(): MemoryDiagnostics | null;
  verifyAccuracy(sampleCount?: number, timeoutMs?: number, type?: VerificationType): Promise<GateVerificationResult>;
  exportVerificationJson(result: GateVerificationResult): DeviceVerificationExport;
  dispose(): void;
}
