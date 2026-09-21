import { describe, expect, it } from 'vitest';
import type { NormalizedLandmark } from '@mediapipe/tasks-vision';
import { centerOfMassSample, type COMSample } from '../src/cmj/center-of-mass';
import { analyzeCOM } from '../src/cmj/com-analysis';
import { COMStream, type COMResult } from '../src/cmj/com-stream';
import { G } from '../src/cmj/analysis';

// Known mechanics: stationary -> countermovement -> 15 m/s² propulsion
// for .2 s -> free fall. Takeoff v=3 m/s. No contact coordinates supplied.
function jump(fps = 60): COMSample[] {
  return Array.from({ length: Math.floor(2 * fps) + 1 }, (_, frame) => {
    const pts = frame / fps;
    let y = 500;
    if (pts > .45 && pts < .65) y += 30 * (1 - Math.cos(Math.PI * (pts - .45) / .2)) / 2;
    else if (pts >= .65 && pts < .85) y = 530 - .5 * 15 * (pts - .65) ** 2 / .004;
    else if (pts >= .85) y = Math.min(500, 455 - 3 * (pts - .85) / .004 + .5 * G * (pts - .85) ** 2 / .004);
    return { frame, pts, comX: 480, comY: y, bodyScale: 400 };
  });
}
describe('COM velocity/gravity height (independent experimental method)', () => {
  it.each([30, 60, 120, 240])('recovers known takeoff velocity from %i Hz source observations', fps => {
    const result = analyzeCOM(jump(fps), 400);
    expect(result.reason).toBeUndefined();
    expect(result.heightCm).toBeCloseTo(3 ** 2 / (2 * G) * 100, 0);
    expect(result.velocityMps).toBeCloseTo(3, 1);
    expect(result.candidates).toHaveLength(3);
  });
  it('is invariant to image translation and scale, without assuming athlete height', () => {
    const base = analyzeCOM(jump(), 400);
    const transformed = jump().map(p => ({ ...p, comX: p.comX! * .65 + 70, comY: p.comY! * .65 + 120, bodyScale: 260 }));
    expect(analyzeCOM(transformed, 260).heightCm).toBeCloseTo(base.heightCm!, 3);
  });
  it('does not use landing time or landing posture to compute height', () => {
    const base = analyzeCOM(jump(), 400);
    const changedLanding = jump().map(p => p.pts < 1.4 ? p : { ...p, comY: p.comY! + (p.pts - 1.4) * 150 });
    expect(analyzeCOM(changedLanding, 400).heightCm).toBeCloseTo(base.heightCm!, 5);
  });
  it('retains source-time meaning when processing takes longer', () => {
    const shifted = jump().map(p => ({ ...p, pts: p.pts + 100 }));
    expect(analyzeCOM(shifted, 400).heightCm).toBeCloseTo(analyzeCOM(jump(), 400).heightCm!, 4);
  });
  it('rejects dropped observations, occlusion, and camera/subject drift', () => {
    expect(analyzeCOM(jump().filter(p => p.pts < .9 || p.pts > 1.05), 400).reason).toBe('COM_SAMPLE_GAP');
    expect(analyzeCOM(jump().map(p => p.frame === 60 ? { ...p, comY: null } : p), 400).heightCm).toBeNull();
    expect(analyzeCOM(jump().map(p => ({ ...p, comX: p.comX! + p.pts * 100 })), 400).reason).toBe('SUBJECT_DRIFT');
  });
  it('does not require observations outside the propulsion/airborne measurement window', () => {
    const missingBeforePropulsion = jump().map(p => Math.abs(p.pts - .55) < .001 ? { ...p, comY: null } : p);
    expect(analyzeCOM(missingBeforePropulsion, 400).heightCm).toBeCloseTo(analyzeCOM(jump(), 400).heightCm!, 5);
  });
  it('does not infer takeoff from an isolated free-fall arc with no propulsion evidence', () => {
    const arcOnly = jump().filter(p => p.pts >= .87 && p.pts <= 1.4);
    expect(analyzeCOM(arcOnly, 400).heightCm).toBeNull();
  });
  it('does not label standing or a non-ballistic raised-and-held position a jump', () => {
    expect(analyzeCOM(jump().map(p => ({ ...p, comY: 500 })), 400).heightCm).toBeNull();
    expect(analyzeCOM(jump().map(p => ({ ...p, comY: p.pts > .8 && p.pts < 1.4 ? 400 : 500 })), 400).heightCm).toBeNull();
  });
});

function body(): NormalizedLandmark[] {
  const p = Array.from({ length: 33 }, (_, i) => ({ x: i % 2 ? .45 : .55, y: .5, z: 0, visibility: 1 }));
  for (const i of [7, 8]) p[i].y = .15;
  for (const i of [11, 12]) p[i].y = .3;
  for (const i of [13, 14]) p[i].y = .42;
  for (const i of [15, 16, 17, 18, 19, 20, 23, 24]) p[i].y = .55;
  for (const i of [25, 26]) p[i].y = .7;
  for (const i of [27, 28, 29, 30, 31, 32]) p[i].y = .9;
  return p;
}
describe('whole-body COM proxy', () => {
  it('uses a consistent wrist-based hand model even when finger confidence changes', () => {
    const p = body(); const original = centerOfMassSample([p], 0, 0);
    for (const i of [17, 18, 19, 20]) { p[i].visibility = .01; p[i].y = .05; }
    expect(centerOfMassSample([p], 1, .02).comY).toBe(original.comY);
    p[15].visibility = .1;
    expect(centerOfMassSample([p], 2, .04).reason).toBe('BODY_POINT_OCCLUDED');
  });
  it('responds to arms even when the hips do not move', () => {
    const p = body(); const original = centerOfMassSample([p], 0, 0);
    for (const i of [13, 14, 15, 16, 17, 18, 19, 20]) p[i].y -= .15;
    const raised = centerOfMassSample([p], 1, .02);
    expect(raised.comY).toBeLessThan(original.comY!);
    expect(raised.bodyScale).toBe(original.bodyScale);
  });
  it('rejects unreliable full-body points instead of silently falling back to hip-only measurement', () => {
    const p = body(); p[13].visibility = .1;
    expect(centerOfMassSample([p], 0, 0).reason).toBe('BODY_POINT_OCCLUDED');
    expect(centerOfMassSample([body(), body()], 0, 0).reason).toBe('POSE_NOT_UNIQUE');
  });
});
describe('COM stream movement segmentation', () => {
  it('detects and measures a jump without any foot/contact input', () => {
    const stream = new COMStream(); const results: COMResult[] = [];
    for (const p of jump()) { const r = stream.push(p); if (r) results.push(r); }
    expect(results).toHaveLength(1);
    expect(results[0].analysis.heightCm).toBeCloseTo(3 ** 2 / (2 * G) * 100, 0);
    expect(results[0].detectedAtPts).toBeGreaterThan(1.5);
  });
  it('requires recovery footage and rejects tracking loss during movement', () => {
    const early = new COMStream(); for (const p of jump().filter(p => p.pts < 1.4)) early.push(p);
    expect(early.end()?.analysis).toMatchObject({ heightCm: null, reason: 'RECORDING_ENDED_BEFORE_RECOVERY' });
    const interrupted = new COMStream(); const failures: COMResult[] = [];
    for (const p of jump()) { const r = interrupted.push(p.pts === 1 ? { ...p, comY: null } : p); if (r) failures.push(r); }
    expect(failures[0]?.analysis).toMatchObject({ heightCm: null, reason: 'COM_TRACKING_LOST' });
  });
  it('retains a missing preparatory observation without filling it or losing the complete jump', () => {
    const stream = new COMStream(); const results: COMResult[] = [];
    for (const p of jump()) { const r = stream.push(Math.abs(p.pts - .55) < .001 ? { ...p, comY: null } : p); if (r) results.push(r); }
    expect(results).toHaveLength(1);
    expect(results[0].analysis.heightCm).toBeCloseTo(3 ** 2 / (2 * G) * 100, 0);
    expect(results[0].analysis.samples.some(p => p.comY === null)).toBe(true);
  });
});
