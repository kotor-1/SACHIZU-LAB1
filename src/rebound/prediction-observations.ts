import type { NormalizedLandmark } from '@mediapipe/tasks-vision';
import { centerOfMassSample } from '../cmj/center-of-mass';
import { createLowerSubjectSelector, lowerBodySamples, type JumpMode } from './lower-body';
import { emptySignals, type PredictionSignals } from './predictions';
import type { SubjectRegion } from './subject';

export interface PoseFrame { frame: number; pts: number; poses: NormalizedLandmark[][] }
/** Reusable source observations: mode/ROI changes do NOT decode or infer again. */
export function predictionSignals(frames: readonly PoseFrame[], region: SubjectRegion, mode: JumpMode): PredictionSignals {
  const signals = emptySignals(), select = createLowerSubjectSelector(region, mode);
  for (const f of frames) {
    const poses = select(f.poses, f.pts), lower = lowerBodySamples(poses, f.frame, f.pts, mode);
    signals.PELVIS.push(lower.PELVIS); signals.HIP_KNEE.push(lower.HIP_KNEE);
    const com = centerOfMassSample(poses, f.frame, f.pts);
    // Waveform-fit plausibility uses projected leg length for EVERY signal.
    signals.COM.push({ ...com, bodyScale: lower.PELVIS.bodyScale });
  }
  return signals;
}
