/**
 * SACHIZU LAB1 - Frame Engine 定数定義
 * 設計書 v1.1 に準拠
 */

/**
 * Phase 0A 正式合格基準 (Engineering Gate)
 * 設計書 Section 54: 「99%以上の試行でPTS誤差が1 frame interval以内」
 */
export const PHASE_0A_GATE_ACCURACY_THRESHOLD = 0.99; // 99.0%

/**
 * 正式Gate判定に必要な最小サンプル数 (50はSmoke Test扱い)
 */
export const FORMAL_GATE_MIN_SAMPLE_COUNT = 100;

/**
 * 許容PTS誤差の比率 (フレーム間隔に対する倍率)
 * 1.0 = 1 frame interval
 */
export const ALLOWED_PTS_ERROR_RATIO = 1.0;

/**
 * rVFC (requestVideoFrameCallback) のタイムアウト設定 (ミリ秒)
 * 低スペック端末・HEVC・ランダムシークのデコード遅延を考慮した安全値
 */
export const RVFC_TIMEOUT_CONFIG = {
  DEFAULT_TIMEOUT_MS: 1000 as number, // 初期値 1000ms
  MAX_TIMEOUT_MS: 2000 as number,     // 最大許容 2000ms
} as const;

/**
 * HTMLVideoElement の初期ロード待ちに与える有限の liveness bound (ミリ秒)。
 *
 * これは **engineering timeout であり、media validity の証拠ではない**。
 * timeout は「media element が時間内に loadeddata へ到達しなかった」ことだけを
 * 意味し、codec 非対応・ファイル破損・FPS 不正・frame 精度不足を意味しない。
 * metric / frame / scientific status の判定には一切使用しない。
 *
 * 目的は、loadeddata も error も発火しない stall で loadVideo が永久に
 * pending となり、UI が読み込み中のまま固まるのを防ぐことだけである
 * (H9A-1 で再現・分類済み)。通常の読み込みを打ち切らないよう十分長く取る。
 *
 * rVFC の frame 提示 timeout (RVFC_TIMEOUT_CONFIG) とは対象が異なるため、
 * 同じ値を共有しない。
 */
export const VIDEO_ELEMENT_LOAD_TIMEOUT_MS = 30000;

/**
 * fps 判定閾値 (設計書 Section 6)
 * - 30fps以下: 非対応
 * - 60fps: 利用可・注意表示
 * - 120fps: 標準推奨
 * - 240fps: 高時間分解能
 */
export const FPS_THRESHOLDS = {
  MIN_SUPPORTED: 50.0, // 60fps動画の若干のブレを考慮 (30fpsは非対応)
  SIXTY_FPS: 55.0,
  ONE_TWENTY_FPS: 110.0,
  TWO_FORTY_FPS: 220.0,
} as const;

/**
 * コーデックプレフライト用定義
 */
export const CODEC_PATTERNS = {
  AVC: /^avc1/i,
  HEVC_HVC1: /^hvc1/i,
  HEVC_HEV1: /^hev1/i,
  VP9: /^vp09/i,
  AV1: /^av01/i,
} as const;

/**
 * エラー・警告メッセージ定義
 */
export const ENGINE_MESSAGES = {
  ERR_UNSUPPORTED_CODEC: 'この動画形式は現在の端末では解析できません。H.264互換形式へ変換してください。',
  ERR_UNSUPPORTED_LOW_FPS: '30fps以下の動画は動作解析に対応していません。60fps以上（推奨: 120fps）で撮影した動画を使用してください。',
  WARN_SIXTY_FPS: '60fps動画です。解析は可能ですが、接地・離地の精度向上のため120fpsでの撮影を推奨します。',
  ERR_NO_VIDEO_TRACK: '動画ファイル内に有効な映像トラックが見つかりませんでした。',
  ERR_DECODE_FAILED: 'フレームのデコードに失敗しました。',
  ERR_NO_FILE_LOADED: '動画ファイルが読み込まれていません。',
  ERR_RVFC_TIMEOUT: 'フレーム提示 (rVFC) がタイムアウトしました。',
  ERR_VIDEO_ELEMENT_LOAD_TIMEOUT:
    '動画プレーヤーが時間内に読み込みを完了しませんでした。',
  GATE_PASS_DESC: 'Phase 0A 正式合格基準 (100+試行で99%以上のPTS誤差 <= 1 frame interval) を達成しました。',
  GATE_FAIL_DESC: 'Phase 0A 合格基準を満たしていません。フレーム精度が不足しています。',
  WARN_SMOKE_TEST: '※50サンプルによる検証はSmoke Test扱いです。Phase 0Aの正式Gate通過には100サンプル以上の検証が必要です。',
} as const;

/**
 * メモリ制限・バッファ設定
 */
export const MEMORY_LIMITS = {
  /** デフォルトの正式サンプリング数 */
  DEFAULT_FORMAL_SAMPLES: 100 as number,
  /** スモークテスト用サンプリング数 */
  SMOKE_TEST_SAMPLES: 50 as number,
  /** 最大許容フレーム数 (長すぎる動画を保護) */
  MAX_ANALYSIS_FRAMES: 3600, // 120fpsで30秒分
} as const;
