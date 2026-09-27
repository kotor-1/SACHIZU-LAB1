import type { NormalizedLandmark } from '@mediapipe/tasks-vision';
import type { PoseFrame } from './prediction-observations';

/** Bound parsing before JSON.parse, not just the resulting frame array. A
 * 3600-frame, 33-point trace is about 15 MB; leave room for two-person frames
 * and the old export's results while keeping the import bounded on phones. */
export const MAX_TOE_CYCLE_IMPORT_BYTES = 32 * 1024 * 1024;
const MAX_FRAMES = 3600;
const MAX_DURATION_SECONDS = 30;
const MAX_SOURCE_BYTES = 150 * 1024 * 1024;
const EXPORT_VERSION = 'rj-toe-cycle-export-v1';
const RESULT_VERSIONS = ['rj-toe-constrained-cycle-v1-research', 'rj-toe-constrained-cycle-v2-research'] as const;
type SavedResultVersion = typeof RESULT_VERSIONS[number];

export type ToeCycleImportErrorCode = 'IMPORT_TOO_LARGE' | 'IMPORT_INVALID_BYTE_LENGTH' |
  'IMPORT_INVALID_JSON' | 'IMPORT_UNSUPPORTED_EXPORT' | 'IMPORT_UNSUPPORTED_RESULT' |
  'IMPORT_INVALID_METADATA' | 'IMPORT_INVALID_FRAME_COUNT' | 'IMPORT_INVALID_FRAME_SEQUENCE' |
  'IMPORT_INVALID_TIMESTAMPS' | 'IMPORT_INVALID_POSES' | 'IMPORT_INVALID_LANDMARK';

export class ToeCycleImportError extends Error {
  readonly code: ToeCycleImportErrorCode;
  constructor(code: ToeCycleImportErrorCode, message: string) {
    super(message); this.name = 'ToeCycleImportError'; this.code = code;
  }
}

export interface ImportedToeCycleObservations {
  filename: string;
  sourceBytes: number;
  /** Identifier asserted by the saved JSON, NOT verified against a video. */
  sourceVideoSHA256: string;
  sourceFrames: number;
  poses: PoseFrame[];
  observationModel: 'full';
  savedResultVersion: SavedResultVersion;
  inputProvenance: 'SAVED_JSON';
  sourceVideoVerified: false;
  sourceVideoAvailable: false;
}

const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const finite = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const integer = (value: unknown): value is number => typeof value === 'number' && Number.isSafeInteger(value);
function fail(code: ToeCycleImportErrorCode, message: string): never { throw new ToeCycleImportError(code, message); }

/** Pure import of observations only. No inference, interpolation, filtering,
 * old-result reuse, media access, hash verification, or network requests.
 *
 * Browser caller: check file.size <= MAX_TOE_CYCLE_IMPORT_BYTES BEFORE reading,
 * then parseToeCycleImport(await file.text(), file.size). byteLength is an
 * optional early bound, not trusted: the actual text's UTF-8 size is checked
 * independently. It may differ by 3 bytes because File.text() strips a BOM.
 * A valid structure does not authenticate or verify the original recording. */
export function parseToeCycleImport(text: string, byteLength?: number): ImportedToeCycleObservations {
  if (byteLength !== undefined) {
    if (!integer(byteLength) || byteLength < 0) fail('IMPORT_INVALID_BYTE_LENGTH', 'JSONのファイルサイズを確認できません。');
    if (byteLength > MAX_TOE_CYCLE_IMPORT_BYTES) fail('IMPORT_TOO_LARGE', '32MB以内のRJ解析JSONを選んでください。');
  }
  if (typeof text !== 'string') fail('IMPORT_INVALID_JSON', 'RJ解析JSONを読み込めません。');
  // UTF-16 length is a cheap lower bound on the UTF-8 byte length.
  if (text.length > MAX_TOE_CYCLE_IMPORT_BYTES || new TextEncoder().encode(text).byteLength > MAX_TOE_CYCLE_IMPORT_BYTES)
    fail('IMPORT_TOO_LARGE', '32MB以内のRJ解析JSONを選んでください。');
  let value: unknown;
  try { value = JSON.parse(text.charCodeAt(0) === 0xfeff ? text.slice(1) : text); }
  catch { fail('IMPORT_INVALID_JSON', 'JSONの形式が壊れています。保存したRJ解析JSONを選んでください。'); }
  if (!record(value) || value.version !== EXPORT_VERSION || value.observationModel !== 'full' ||
    value.manualInputsUsed !== false || value.videoUploaded !== false)
    fail('IMPORT_UNSUPPORTED_EXPORT', 'このJSONは対応する両足RJ・つま先軌跡の保存形式ではありません。');
  const result = value.result, environment = value.environment;
  if (!record(result) || !RESULT_VERSIONS.some(version => version === result.version))
    fail('IMPORT_UNSUPPORTED_RESULT', 'このRJ解析JSONの方式バージョンには対応していません。');
  if (!record(environment) || typeof result.filename !== 'string' || !result.filename.trim() ||
    result.filename.length > 1024 || /[\u0000-\u001f\u007f]/.test(result.filename) ||
    typeof result.sourceVideoSHA256 !== 'string' || !/^[0-9a-f]{64}$/i.test(result.sourceVideoSHA256) ||
    !integer(environment.sourceBytes) || environment.sourceBytes <= 0 || environment.sourceBytes > MAX_SOURCE_BYTES)
    fail('IMPORT_INVALID_METADATA', '元動画の名前・サイズ・識別情報を確認できません。');
  if (!Array.isArray(value.poses) || !integer(environment.sourceFrames) || environment.sourceFrames < 1 ||
    environment.sourceFrames > MAX_FRAMES || value.poses.length !== environment.sourceFrames)
    fail('IMPORT_INVALID_FRAME_COUNT', '骨格コマ数が一致しません。1〜3600コマの保存データが必要です。');

  const poses: PoseFrame[] = [];
  let firstPts = 0, previousPts = -Infinity;
  for (let index = 0; index < value.poses.length; index++) {
    const row: unknown = value.poses[index];
    if (!record(row) || !integer(row.frame) || row.frame !== index)
      fail('IMPORT_INVALID_FRAME_SEQUENCE', '骨格のコマ番号が連続していません。間引き・並べ替えせず元のJSONを使用してください。');
    if (!finite(row.pts) || row.pts < 0 || row.pts <= previousPts)
      fail('IMPORT_INVALID_TIMESTAMPS', '骨格の撮影時刻が不正、重複、または逆順です。');
    if (index === 0) firstPts = row.pts;
    if (row.pts - firstPts > MAX_DURATION_SECONDS)
      fail('IMPORT_INVALID_TIMESTAMPS', '30秒以内の骨格データを選んでください。');
    previousPts = row.pts;
    // MobileCMJPose uses numPoses: 2. Retain no-person and ambiguous two-person
    // frames exactly, so the existing subject selector can assess them later.
    if (!Array.isArray(row.poses) || row.poses.length > 2)
      fail('IMPORT_INVALID_POSES', '骨格の人数データが保存形式と一致しません。');
    const people: NormalizedLandmark[][] = [];
    for (const candidate of row.poses) {
      if (!Array.isArray(candidate) || candidate.length !== 33)
        fail('IMPORT_INVALID_POSES', '各人物の骨格には33点が必要です。欠けた点を補って読み込むことはできません。');
      const landmarks: NormalizedLandmark[] = [];
      for (const point of candidate) {
        if (!record(point) || !finite(point.x) || !finite(point.y) || !finite(point.z) ||
          !finite(point.visibility) || point.visibility < 0 || point.visibility > 1)
          fail('IMPORT_INVALID_LANDMARK', '骨格座標または可視性に不正な数値があります。');
        // Image-normalized points may lie outside [0,1]; negative z is normal.
        // Preserve them and low-confidence points, without clamping or skips.
        // Copy only the contract's fields; do not retain arbitrary JSON props.
        landmarks.push({ x: point.x, y: point.y, z: point.z, visibility: point.visibility });
      }
      people.push(landmarks);
    }
    poses.push({ frame: row.frame, pts: row.pts, poses: people });
  }
  return { filename: result.filename, sourceBytes: environment.sourceBytes,
    sourceVideoSHA256: result.sourceVideoSHA256.toLowerCase(), sourceFrames: environment.sourceFrames, poses,
    observationModel: 'full', savedResultVersion: result.version as SavedResultVersion,
    inputProvenance: 'SAVED_JSON', sourceVideoVerified: false, sourceVideoAvailable: false };
}
