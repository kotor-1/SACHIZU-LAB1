import { describe, expect, it } from 'vitest';
import { recoveryCrop, acceptRecoveredPose } from '../src/cmj/pose-recovery';
const pose = () => Array.from({ length: 33 }, (_, i) => ({ x: .45 + i % 2 * .1, y: .1 + i * .02, z: 0, visibility: .95 }));
describe('same-source-frame pose recovery', () => {
  it('accepts independently inferred confident joints in the original coordinate system', () => {
    const original = pose(); original[15].visibility = .1;
    const crop = recoveryCrop([original])!;
    const local = pose().map(p => ({ ...p, x: (p.x - crop.x) / crop.w, y: (p.y - crop.y) / crop.h }));
    const mapped = acceptRecoveredPose([original], [local], crop, 10, .1)!;
    expect(mapped[0][15].x).toBeCloseTo(original[15].x);
    expect(mapped[0][15].visibility).toBe(.95);
    expect(original[15].visibility).toBe(.1);
  });
  it('rejects multiple people, unreliable recovery and a different subject', () => {
    const p = pose(), crop = recoveryCrop([p])!;
    expect(recoveryCrop([p, p])).toBeNull();
    const local = p.map(p => ({ ...p, x: (p.x - crop.x) / crop.w, y: (p.y - crop.y) / crop.h }));
    expect(acceptRecoveredPose([p], [local, local], crop, 0, 0)).toBeNull();
    local[15].visibility = .1;
    expect(acceptRecoveredPose([p], [local], crop, 0, 0)).toBeNull();
    local[15].visibility = .95; local[23].x += .5;
    expect(acceptRecoveredPose([p], [local], crop, 0, 0)).toBeNull();
  });
});
