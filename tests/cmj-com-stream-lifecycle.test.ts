import { describe, expect, it } from 'vitest';
import { COMStream, type COMResult } from '../src/cmj/com-stream';
import { analyzeToeFlight } from '../src/cmj/toe-flight';
import { G } from '../src/cmj/analysis';
import type { COMSample } from '../src/cmj/center-of-mass';
import { withToes } from './fixtures/cmj-toes';

const sample = (frame: number, pts = frame / 30, comY = 500): COMSample =>
  ({ frame, pts, comX: 480, comY, bodyScale: 400 });
const missing = (frame: number): COMSample =>
  ({ frame, pts: frame / 30, comX: null, comY: null, bodyScale: null, reason: 'BODY_POINT_OCCLUDED' });
function ready(stream: COMStream) {
  for (let frame = 0; frame <= 30; frame++) stream.push(sample(frame));
  expect(stream.phase).toBe('READY');
}
function jump(land = 500, duration = 6, offset = 0, baseline = 500): COMSample[] {
  const v = Math.sqrt(2 * G * .3), scale = .003, depth = v * .1 / scale;
  return withToes(Array.from({ length: Math.floor(duration * 30) + 1 }, (_, frame) => {
    const pts = frame / 30;
    let y = baseline;
    if (pts > .45 && pts < .65) y += depth * (1 - Math.cos(Math.PI * (pts - .45) / .2)) / 2;
    else if (pts >= .65 && pts < .85) y = baseline + depth - .5 * (v / .2) * (pts - .65) ** 2 / scale;
    else if (pts >= .85) y = Math.min(land, baseline - v * (pts - .85) / scale + .5 * G * (pts - .85) ** 2 / scale);
    return sample(frame + Math.round(offset * 30), pts + offset, y);
  }), .85 + offset, v, scale);
}
const process = (stream: COMStream, rows: COMSample[]): COMResult[] =>
  rows.flatMap(p => { const result = stream.push(p); return result ? [result] : []; });

describe('COM stream preparation diagnostics', () => {
  it.each([8, 10, 12, 13])('explains why %i Hz cannot satisfy the unchanged standing evidence requirement', fps => {
    const stream = new COMStream();
    for (let frame = 0; frame <= fps * 4; frame++) stream.push(sample(frame, frame / fps));
    expect(stream.phase).toBe('PREPARING');
    expect(stream.observationReason).toBe('PREPARATION_SAMPLE_CADENCE');
    expect(stream.diagnostics).toMatchObject({ prepared: false, observationReason: 'PREPARATION_SAMPLE_CADENCE' });
    expect(stream.diagnostics.preparationSampleCount).toBeLessThan(8);
    expect(stream.diagnostics.preparationSpanSeconds).toBeLessThanOrEqual(.5);
    expect(stream.end()).toBeNull();
  });
  it('distinguishes initial evidence collection, unstable standing, and readiness', () => {
    const stream = new COMStream();
    stream.push(sample(0));
    expect(stream.diagnostics).toEqual({ prepared: false, preparationSampleCount: 1,
      preparationSpanSeconds: 0, observationReason: 'PREPARATION_NOT_CONFIRMED' });
    for (let frame = 1; frame <= 30; frame++) stream.push(sample(frame, frame / 30, frame % 2 ? 515 : 485));
    expect(stream.observationReason).toBe('PREPARATION_NOT_STILL');
    for (let frame = 31; frame <= 60; frame++) stream.push(sample(frame));
    expect(stream.phase).toBe('READY');
    expect(stream.diagnostics.prepared).toBe(true);
    expect(stream.diagnostics.preparationSampleCount).toBeGreaterThanOrEqual(8);
    expect(stream.diagnostics.preparationSpanSeconds).toBeGreaterThanOrEqual(.3);
    expect(stream.observationReason).toBeNull();
  });
  it('returns diagnostics by value, without letting callers mutate stream state', () => {
    const stream = new COMStream(); ready(stream);
    const diagnostics = stream.diagnostics;
    diagnostics.prepared = false; diagnostics.observationReason = 'changed';
    expect(stream.diagnostics.prepared).toBe(true);
    expect(stream.observationReason).toBeNull();
  });
});

describe('COM stream baseline and result lifecycle', () => {
  it('keeps readiness through a short lost pose and clears its feedback on reacquisition', () => {
    const stream = new COMStream(); ready(stream);
    stream.push(missing(31)); stream.push(missing(32));
    expect(stream.phase).toBe('READY');
    expect(stream.observationReason).toBe('BODY_POINT_OCCLUDED');
    expect(stream.diagnostics.prepared).toBe(true);
    stream.push(sample(33));
    expect(stream.phase).toBe('READY'); expect(stream.observationReason).toBeNull();
  });
  it('expires a ready baseline after sustained pose loss, even with regular camera callbacks', () => {
    const stream = new COMStream(); ready(stream);
    for (let frame = 31; frame <= 45; frame++) expect(stream.push(missing(frame))).toBeNull();
    expect(stream.phase).toBe('PREPARING');
    expect(stream.diagnostics).toEqual({ prepared: false, preparationSampleCount: 0,
      preparationSpanSeconds: 0, observationReason: 'BODY_POINT_OCCLUDED' });
    // Reacquiring another position must prepare afresh, not start a jump from
    // the old standing line. No body-coordinate substitution is performed.
    for (let frame = 46; frame <= 60; frame++) expect(stream.push(sample(frame, frame / 30, 600))).toBeNull();
    expect(stream.phase).toBe('READY'); expect(stream.diagnostics.prepared).toBe(true);
  });
  it('expires readiness on a real callback gap and requires fresh standing evidence', () => {
    const stream = new COMStream(); ready(stream);
    expect(stream.push(sample(60))).toBeNull();
    expect(stream.phase).toBe('PREPARING');
    expect(stream.observationReason).toBe('COM_SAMPLE_GAP');
    expect(stream.diagnostics.prepared).toBe(false);
  });
  it.each([500, 540, 560, 600])('does not count a held landing at y=%i as a second movement', land => {
    const stream = new COMStream(), rows = jump(land), results = process(stream, rows);
    expect(results).toHaveLength(1);
    expect(Math.abs(results[0].analysis.heightCm! - 30)).toBeLessThan(1.5); // 30 Hz toe-hinge timing: measured synthetic bias ~1.1 cm
    // Segmentation emits exactly the estimator's own result for the retained samples.
    expect(results[0].analysis.heightCm).toBe(analyzeToeFlight(results[0].analysis.samples, 400).heightCm);
    expect(stream.phase).toBe('READY');
    expect(stream.end()).toBeNull();
  });
  it('rechecks stillness after recovery and then measures the next distinct jump', () => {
    const stream = new COMStream();
    let first: COMResult | null = null;
    const rows = jump(560, 3);
    for (const row of rows) {
      const result = stream.push(row);
      if (result) {
        first = result;
        expect(stream.phase).toBe('PREPARING');
        expect(stream.diagnostics.prepared).toBe(false);
      }
    }
    expect(Math.abs(first!.analysis.heightCm! - 30)).toBeLessThan(1.5);
    expect(stream.phase).toBe('READY');
    const second = process(stream, jump(560, 3, 3 + 1 / 30, 560));
    expect(second).toHaveLength(1); expect(second[0].id).toBe(2);
    expect(Math.abs(second[0].analysis.heightCm! - 30)).toBeLessThan(1.5);
  });
  it('does not fill a lost measurement observation or publish an incomplete movement', () => {
    const stream = new COMStream();
    const rows = jump().map(p => p.frame === 33 ? { ...p, comX: null, comY: null, bodyScale: null,
      reason: 'BODY_POINT_OCCLUDED' } : p);
    const results = process(stream, rows);
    expect(results).toHaveLength(1);
    expect(results[0].analysis.heightCm).toBeNull();
    expect(results[0].analysis.reason).toBe('COM_TRACKING_LOST');
    expect(results[0].analysis.samples.some(p => p.comY === null)).toBe(true);
    const partial = new COMStream(); process(partial, jump().filter(p => p.pts <= 1));
    expect(partial.end()?.analysis).toMatchObject({ heightCm: null, reason: 'RECORDING_ENDED_BEFORE_RECOVERY' });
    expect(partial.diagnostics.prepared).toBe(false);
    expect(partial.end()).toBeNull();
  });
});
