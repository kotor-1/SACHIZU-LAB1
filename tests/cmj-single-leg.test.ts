import { describe, expect, it } from 'vitest';
import type { NormalizedLandmark } from '@mediapipe/tasks-vision';
import type { COMSample } from '../src/cmj/center-of-mass';
import { COMStream, type COMResult } from '../src/cmj/com-stream';
import { G } from '../src/cmj/analysis';
import { stanceLegPose, stanceSide, stanceToes } from '../src/cmj/single-leg';
import { withToes } from './fixtures/cmj-toes';

// The countermovement jump of cmj-com.test.ts: takeoff at 0.85 s at 3 m/s.
function jump(fps = 60): COMSample[] {
  return withToes(Array.from({ length: Math.floor(2 * fps) + 1 }, (_, frame) => {
    const pts = frame / fps;
    let y = 500;
    if (pts > .45 && pts < .65) y += 30 * (1 - Math.cos(Math.PI * (pts - .45) / .2)) / 2;
    else if (pts >= .65 && pts < .85) y = 530 - .5 * 15 * (pts - .65) ** 2 / .004;
    else if (pts >= .85) y = Math.min(500, 455 - 3 * (pts - .85) / .004 + .5 * G * (pts - .85) ** 2 / .004);
    return { frame, pts, comX: 480, comY: y, bodyScale: 400 };
  }), .85, 3, .004);
}
/** One leg: the held foot's toe rides with the body, 150 units above the floor
 * when standing, and never touches it. With `swapEvery`, the landmark side of
 * the stance foot changes every that many frames (side views swap labels). */
function oneLeg(rows: COMSample[], swapEvery = 0): COMSample[] {
  return rows.map((p, i) => {
    if (!p.toeY || p.comY === null) return p;
    const stance = p.toeY[0], held = p.comY + 200;
    const right = swapEvery > 0 && Math.floor(i / swapEvery) % 2 === 1;
    return { ...p, toeY: right ? [held, stance] : [stance, held] };
  });
}
function measure(rows: COMSample[], stream: COMStream) {
  const results: COMResult[] = [];
  for (const p of rows) { const r = stream.push(p); if (r) results.push(r); }
  const last = stream.end(); if (last) results.push(last);
  return results;
}
const expected = 3 ** 2 / (2 * G) * 100;

describe('single-leg CMJ', () => {
  it('times takeoff and landing on the lower toe and keeps the center of mass', () => {
    const p: COMSample = { frame: 0, pts: 0, comX: 480, comY: 500, bodyScale: 400, toeY: [700, 850] };
    expect(stanceToes(p)).toEqual({ ...p, toeY: [850, 850] });
    expect(stanceToes({ ...p, toeY: undefined }).toeY).toBeUndefined();
  });
  it('measures the jump on one leg, whichever landmark side the stance foot is labelled', () => {
    for (const swapEvery of [0, 7]) {
      const results = measure(oneLeg(jump()), new COMStream(undefined, 'RIGHT'));
      expect(results, `swap ${swapEvery}`).toHaveLength(1);
      expect(results[0].analysis.heightCm).toBeCloseTo(expected, 0);
      const swapped = measure(oneLeg(jump(), swapEvery), new COMStream(undefined, 'LEFT'));
      expect(swapped[0].analysis.heightCm).toBeCloseTo(results[0].analysis.heightCm!, 6);
    }
  });
  it('leaves a both-legs jump unchanged', () => {
    const both = measure(jump(), new COMStream()), single = measure(jump(), new COMStream(undefined, 'RIGHT'));
    expect(single[0].analysis.heightCm).toBeCloseTo(both[0].analysis.heightCm!, 9);
  });
});

describe('stance leg pose (single-leg RJ)', () => {
  const pose = (leftFoot: number, rightFoot: number): NormalizedLandmark[] => Array.from({ length: 33 }, (_, i) => {
    const foot = i >= 25 && i <= 32 ? (i % 2 ? leftFoot : rightFoot) - (32 - i) * .01 : .5;
    return { x: i / 100, y: foot, z: 0, visibility: .9 };
  });
  it('finds the foot nearer the floor and copies its leg below the hip onto the held one', () => {
    const p = pose(.9, .7);                 // left foot on the floor, right foot held up
    expect(stanceSide(p)).toBe(0);
    const s = stanceLegPose(p);
    for (const left of [25, 27, 29, 31]) expect(s[left + 1]).toEqual(p[left]);
    for (const i of [23, 24]) expect(s[i]).toEqual(p[i]);  // the hips (pelvis) are kept
    expect(stanceSide(pose(.7, .9))).toBe(1);
    expect(stanceLegPose(pose(.7, .9))[29]).toEqual(pose(.7, .9)[30]);
    expect(stanceSide(pose(NaN, .9))).toBe(1);
    expect(stanceSide(pose(NaN, NaN))).toBeNull();
  });
});
