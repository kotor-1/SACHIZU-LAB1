import { stanceLegPose, stanceSide } from '../cmj/single-leg';
import { createLowerSubjectSelector } from './lower-body';
import type { PoseFrame } from './prediction-observations';
import type { SoleFrame } from './sole-contact';

/** Single-leg RJ: every person's held leg below the hip replaced by their own
 * stance leg (see stanceLegPose), so the two-feet toe model, apex checks and
 * sole contact follow the stance foot alone. */
export function stanceLegFrames(frames: readonly PoseFrame[]): PoseFrame[] {
  return frames.map(f => ({ ...f, poses: f.poses.map(p => stanceLegPose(p)) }));
}

/** Single-leg RJ: in each frame, the measurement of the stance foot's sole for
 * both feet. Both soles were measured for the subject chosen by the same
 * selector in the same frame order (ToeCycleLab's sole meter), so the stance
 * foot is found on that subject. Saved observations work unchanged. */
export function stanceSoles(frames: readonly PoseFrame[], soles: readonly SoleFrame[]): SoleFrame[] {
  if (soles.length !== frames.length) throw new Error('骨格と靴底の画像のコマ数が一致しません。');
  const select = createLowerSubjectSelector({ left: 0, right: 1, top: 0, bottom: 1 }, 'BOTH', { allowSmallInitialSubject: true });
  return soles.map((sole, i) => {
    const selected = select(frames[i].poses, frames[i].pts);
    const side = selected.length === 1 ? stanceSide(selected[0]) : null;
    return { ...sole, feet: side === null ? [null, null] : [sole.feet[side], sole.feet[side]] };
  });
}
