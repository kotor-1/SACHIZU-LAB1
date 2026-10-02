import type { NormalizedLandmark } from '@mediapipe/tasks-vision';
import type { COMSample } from './center-of-mass';

/** Which legs a jump is made on. Right and left are the athlete's own; they
 * only label the result. The analysis follows the stance foot itself: the
 * foot nearer the floor in each frame (the other is held off the floor). Pose
 * models swap left and right landmarks in side views, so the labels are not
 * used to find it. */
export type JumpLegs = 'BOTH' | 'RIGHT' | 'LEFT';
export const JUMP_LEGS: readonly JumpLegs[] = ['BOTH', 'RIGHT', 'LEFT'];
export const LEG_LABELS: Record<JumpLegs, string> = { BOTH: '両脚', RIGHT: '右脚', LEFT: '左脚' };
export const singleLeg = (legs: JumpLegs) => legs !== 'BOTH';
/** The single-leg choice stays off the screens until real single-leg videos
 * have checked it (2026-10-02: none yet; the right-leg RJ video has no
 * reference values). The analysis is in place and tested. */
export const SINGLE_LEG_READY = false;

/** The foot nearer the floor (image y grows downward): 0 for the left
 * landmarks, 1 for the right, null when neither foot is located. Heel and toe
 * together, so a raised toe or heel of the stance foot does not flip it. */
export function stanceSide(pose: readonly NormalizedLandmark[]): 0 | 1 | null {
  const level = (side: 0 | 1) => {
    const heel = pose[29 + side], toe = pose[31 + side];
    return heel && toe && Number.isFinite(heel.y) && Number.isFinite(toe.y) ? (heel.y + toe.y) / 2 : NaN;
  };
  const left = level(0), right = level(1);
  if (Number.isNaN(left) && Number.isNaN(right)) return null;
  if (Number.isNaN(right)) return 0;
  if (Number.isNaN(left)) return 1;
  return right > left ? 1 : 0;
}

/** Single-leg jumps: the pose with the held leg below the hip (knee, ankle,
 * heel, toe) replaced by the stance leg, so analyses of two feet (common
 * flight, both soles, both toes' rise and fall) follow the stance foot alone.
 * The hips are kept: the pelvis is unchanged. */
export function stanceLegPose(pose: readonly NormalizedLandmark[]): NormalizedLandmark[] {
  const side = stanceSide(pose), copy = [...pose];
  if (side === null) return copy;
  for (const left of [25, 27, 29, 31]) copy[left + 1 - side] = pose[left + side];
  return copy;
}

/** Single-leg CMJ: takeoff and landing are timed on the lower toe only (the
 * held foot never touches the floor). The center of mass keeps both legs. */
export function stanceToes(sample: COMSample): COMSample {
  if (!sample.toeY) return sample;
  const lower = Math.max(sample.toeY[0], sample.toeY[1]);
  return { ...sample, toeY: [lower, lower] };
}
