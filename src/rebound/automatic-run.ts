import { measureRecording } from '../cmj/recording-session';
import { POSE_MODEL_HASHES } from '../cmj/mobile-pose';
import { drawPose } from '../cmj/pose-drawing';
import { createLowerSubjectSelector, type JumpMode } from './lower-body';
import type { PoseFrame } from './prediction-observations';
import { automaticFootSeeds, automaticFootResult, AUTOMATIC_REGION } from './automatic-foot';
import { collectPixelRows } from './pixel-recording';
import { refineAutomaticReview } from './automatic-foot-refinement';
import { footPoseUsable } from './foot-boxes';

export type RecordingPoseModel = 'full' | 'heavy';
/** Each run creates fresh tracking state, processes every source frame, then
 * calls the same unmodified seed/pixel/RSI functions. Never select a winner. */
export async function runAutomaticFoot(file: File, canvas: HTMLCanvasElement, mode: JumpMode,
  model: RecordingPoseModel, signal: AbortSignal, progress: (percent: number, text: string) => void) {
  const check = () => { if (signal.aborted) throw new DOMException('中止', 'AbortError'); };
  check();
  const started = performance.now();
  const collected: PoseFrame[] = [], select = createLowerSubjectSelector(AUTOMATIC_REGION, mode);
  let raw: PoseFrame['poses'] = [], readyAt: number | null = null;
  let lastPercent = 0;
  await measureRecording(file, canvas, signal, state => {
    check(); lastPercent = state.totalFrames ? state.processedFrames / state.totalFrames * 70 : 0;
    progress(lastPercent, '1/2 骨格から跳躍と足元を探しています。');
  }, text => { check(); progress(lastPercent, text); }, {
    analysis: 'OBSERVATIONS', observationModel: model,
    selectPose: (p, pts) => { raw = p; return select(p, pts); },
    onPose: (p, frame, pts) => {
      readyAt ??= performance.now(); collected.push({ frame, pts, poses: raw });
      const ctx = canvas.getContext('2d'); if (ctx) drawPose(ctx, p, frame, pts);
    },
  });
  check();
  const { selected, base } = automaticFootSeeds(collected, mode);
  progress(70, '2/2 足元の画像から離地・着地を自動判定しています。');
  const rows = base.reason ? [] : await collectPixelRows(file, collected, AUTOMATIC_REGION, base, signal,
    p => progress(70 + p * .25, '2/2 足元の画像から離地・着地を自動判定しています。'), mode);
  check();
  const refined = rows.length ? refineAutomaticReview(base, rows, collected, mode) : base;
  const report = automaticFootResult(refined);
  const sides: (0 | 1)[] = mode === 'BOTH' ? [0, 1] : mode === 'RIGHT' ? [1] : [0];
  const poseFrames = selected.filter(f => f.poses.length === 1).length;
  const footFrames = selected.filter((f, i) => f.poses.length === 1 && sides.every(s =>
    footPoseUsable(f.poses[0], selected[i - 1]?.poses[0], selected[i + 1]?.poses[0], s))).length;
  const ended = performance.now();
  const traceIndices = [23, 24, 27, 28, 29, 30, 31, 32];
  return { poses: selected, report: { ...report, file: { name: file.name, size: file.size }, mode, frames: collected.length,
    poseModel: model, modelSha256: POSE_MODEL_HASHES[model], backend: 'CPU' as const,
    timing: { totalSeconds: (ended - started) / 1000, setupSeconds: ((readyAt ?? ended) - started) / 1000,
      processingSeconds: readyAt === null ? null : (ended - readyAt) / 1000 },
    tracking: { totalFrames: collected.length, poseFrames, footFrames,
      definition: '選手を追跡でき、対象足の可視性・連続性条件を満たしたコマ。接地判定の正しさではありません。' },
    frameTimes: collected.map(f => f.pts),
    // Compact, local-only observations for comparing missed foot tracks. No
    // image data, interpolation or copied landmarks across missing frames.
    poseTrace: { indices: traceIndices, frames: selected.map(f => ({ frame: f.frame, pts: f.pts,
      points: f.poses.length === 1 ? traceIndices.map(i => {
        const p = f.poses[0][i]; return p ? { x: p.x, y: p.y, visibility: p.visibility } : null;
      }) : null })) },
    environment: { userAgent: navigator.userAgent, secureContext: window.isSecureContext, videoDecoder: typeof VideoDecoder !== 'undefined' },
    source: 'AUTOMATIC_PIXEL_FOOT' as const, analysis: refined, seeds: base, pixelRows: rows } };
}
export type AutomaticRun = Awaited<ReturnType<typeof runAutomaticFoot>>;
export type AutomaticRunReport = AutomaticRun['report'];
