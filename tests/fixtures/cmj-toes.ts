import { G } from '../../src/cmj/analysis';
import type { COMSample } from '../../src/cmj/center-of-mass';

/** Adds physically consistent toe observations to a synthetic COM jump: the
 * toes stay on the floor until `takeoff`, then follow the same ballistic rise
 * as the COM (velocity `v` m/s, `scale` m per image unit) until they return to
 * the floor. Missing COM rows stay missing. */
export function withToes<T extends COMSample>(rows: T[], takeoff: number, v: number, scale: number, floor = 850): T[] {
  return rows.map(p => {
    if (p.comY === null) return p;
    const t = p.pts - takeoff, rise = t > 0 ? Math.max(0, v * t - G * t * t / 2) / scale : 0;
    return { ...p, toeY: [floor - rise, floor - rise] as [number, number] };
  });
}
