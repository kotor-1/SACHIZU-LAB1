import type { FootBox } from './pixel-foot';

interface FootPoint { x: number; y: number; visibility: number }
type FootPose = readonly FootPoint[] | null | undefined;

/** Low heel confidence should not erase an otherwise continuous shoe trace.
 * The toe must be clear, and both adjacent selected poses must show the same
 * foot with a stable heel/toe trajectory. This never supplies
 * an image edge: the actual shoe mask and motion fit still have to succeed. */
export function footPoseUsable(current: FootPose, previous: FootPose, next: FootPose, side: 0 | 1): boolean {
  const heel = 29 + side, toe = 31 + side;
  const finite = (pose: FootPose) => !!pose && [heel, toe].every(index => {
    const p = pose[index]; return p && Number.isFinite(p.x) && Number.isFinite(p.y) && Number.isFinite(p.visibility);
  });
  if (!finite(current) || current![toe].visibility < .5) return false;
  if (current![heel].visibility >= .5) return true;
  if (current![heel].visibility < .35 || current![toe].visibility < .8
    || !finite(previous) || !finite(next)) return false;
  if ([previous!, next!].some(pose => pose[heel].visibility < .35 || pose[toe].visibility < .8)) return false;
  return [heel, toe].every(index => {
    const before = previous![index], at = current![index], after = next![index];
    return Math.hypot(before.x - after.x, before.y - after.y) <= .06
      && Math.hypot(at.x - (before.x + after.x) / 2, at.y - (before.y + after.y) / 2) <= .015;
  });
}

/** Separate nearby shoe crops at the midpoint between pose centres. The
 * single-shoe search box stays unchanged when the feet are well apart. If
 * centres nearly coincide, neither foot can be identified reliably. */
export function footBoxesForPair(
  centers: readonly [number, number], bottoms: readonly [number, number],
): [FootBox | null, FootBox | null] {
  const distance = Math.abs(centers[0] - centers[1]);
  const bothVisible = centers.every(Number.isFinite);
  if (bothVisible && distance < 12) return [null, null];
  const midpoint = (centers[0] + centers[1]) / 2;
  return ([0, 1] as const).map(side => {
    const center = centers[side], bottom = bottoms[side];
    if (!Number.isFinite(center) || !Number.isFinite(bottom)) return null;
    let left = center - 26, right = center + 26;
    if (bothVisible && distance < 52) {
      if (center < centers[1 - side]) right = Math.min(right, midpoint);
      else left = Math.max(left, midpoint);
    }
    const box = { x: left, y: bottom - 25, width: right - left, height: 90 };
    return box.width >= 8 ? box : null;
  }) as [FootBox | null, FootBox | null];
}
