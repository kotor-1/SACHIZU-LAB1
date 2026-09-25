import { describe, expect, it } from 'vitest';
import { analyzeCOM } from '../src/cmj/com-analysis';
import { COMStream } from '../src/cmj/com-stream';
import { G } from '../src/cmj/analysis';

function smallJump(height: number, fps: number, noise = 0, phase = 0) {
  const v = Math.sqrt(2 * G * height / 100), scale = .003, depth = v * .1 / scale;
  return Array.from({ length: 2 * fps + 1 }, (_, frame) => {
    const pts = (frame + phase) / fps; let y = 500;
    if (pts > .45 && pts < .65) y += depth * (1 - Math.cos(Math.PI * (pts - .45) / .2)) / 2;
    else if (pts >= .65 && pts < .85) y = 500 + depth - .5 * (v / .2) * (pts - .65) ** 2 / scale;
    else if (pts >= .85) y = Math.min(500, 500 - v * (pts - .85) / scale + .5 * G * (pts - .85) ** 2 / scale);
    return { frame, pts, comX: 480, comY: y + noise * Math.sin(frame * 1.7), bodyScale: 400 };
  });
}
describe('small jumps (synthetic mechanics, not validation in children)', () => {
  it.each([5, 10, 15, 20, 30, 45])('estimates %i cm at 60 Hz and publishes automatically after recovery', height => {
    const samples = smallJump(height, 60), result = analyzeCOM(samples, 400);
    expect(result.heightCm, result.reason).toBeCloseTo(height, 0);
    const stream = new COMStream(), results = samples.map(p => stream.push(p)).filter(r => r !== null);
    expect(results).toHaveLength(1); expect(results[0].analysis.heightCm).toBeCloseTo(height, 0);
    const landing = .85 + 2 * Math.sqrt(2 * G * height / 100) / G;
    expect(results[0].detectedAtPts - landing).toBeLessThan(.5);
  });
  it.each([10, 15])('estimates %i cm at 30 Hz without changing the timestamps', height => {
    const samples = smallJump(height, 30), result = analyzeCOM(samples, 400);
    expect(result.heightCm, result.reason).toBeCloseTo(height, 0);
    expect(result.samples).toBe(samples);
  });
  it('does not turn noisy standing, heel raises, or squats into jump heights', () => {
    const samples = smallJump(10, 60);
    for (const signal of [
      (t: number) => 500 + Math.sin(t * 39) * .8,
      (t: number) => 500 - 20 * Math.max(0, Math.min(1, (t - .5) / .2, (1.7 - t) / .2)),
      (t: number) => 500 + 50 * Math.max(0, Math.sin(Math.PI * (t - .4) / 1.2)),
    ]) {
      const rows = samples.map(p => ({ ...p, comY: signal(p.pts) }));
      expect(analyzeCOM(rows, 400).heightCm).toBeNull();
      const stream = new COMStream();
      expect(rows.map(p => stream.push(p)).filter(r => r?.analysis.heightCm != null)).toHaveLength(0);
    }
  });
  it('measures every jump in a row, including one that lands away from the standing line', () => {
    const one = (offset: number, land: number) => smallJump(30, 30).map(p => (
      { ...p, frame: p.frame + Math.round(offset * 100), pts: p.pts + offset, comY: p.pts >= 1.35 ? land : p.comY }));
    const samples = [...one(0, 500), ...one(2.2, 480)];
    const stream = new COMStream();
    const results = samples.map(p => stream.push(p)).filter(r => r?.analysis.heightCm != null);
    expect(results.map(r => Math.round(r!.analysis.heightCm!))).toEqual([30, 30]);
  });
  it('becomes ready and measures a jump despite real standing sway', () => {
    const height = 30, fps = 30, v = Math.sqrt(2 * G * height / 100), scale = .003, prop = .2, takeoff = 1.6, dip = 1.1;
    const depth = .5 * (v / prop) * prop * prop / scale;
    let seed = 11;
    const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647 - .5;
    const samples = Array.from({ length: Math.floor(3.2 * fps) + 1 }, (_, frame) => {
      const pts = frame / fps; let y = 500;
      if (pts > dip && pts < takeoff - prop) y += depth * (1 - Math.cos(Math.PI * (pts - dip) / (takeoff - prop - dip))) / 2;
      else if (pts >= takeoff - prop && pts < takeoff) y = 500 + depth - .5 * (v / prop) * (pts - (takeoff - prop)) ** 2 / scale;
      else if (pts >= takeoff) y = Math.min(500, 500 + depth - .5 * v * prop / scale - v * (pts - takeoff) / scale + .5 * G * (pts - takeoff) ** 2 / scale);
      // About 1.5% COM and 4% body-extent frame jitter while standing, as
      // measured on the front-view camera clip.
      const standing = pts < dip;
      return { frame, pts, comX: 480, comY: y + (standing ? 6.4 * random() : 0), bodyScale: 400 + (standing ? 17 * random() : 0) };
    });
    const stream = new COMStream();
    const results = samples.map(p => stream.push(p)).filter(r => r !== null);
    expect(results).toHaveLength(1);
    expect(results[0].analysis.heightCm, results[0].analysis.reason).toBeCloseTo(height, 0);
  });
  it('detects jumps when phone inference intervals vary between 35 and 95 ms', () => {
    let seed = 7;
    const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (const height of [10, 30]) {
      const v = Math.sqrt(2 * G * height / 100), scale = .003, prop = .2, takeoff = 1.6, dip = 1.1;
      const depth = .5 * (v / prop) * prop * prop / scale;
      const samples = [];
      for (let pts = 0, frame = 0; pts < 3.2; pts += .035 + random() * .06, frame++) {
        let y = 500;
        if (pts > dip && pts < takeoff - prop) y += depth * (1 - Math.cos(Math.PI * (pts - dip) / (takeoff - prop - dip))) / 2;
        else if (pts >= takeoff - prop && pts < takeoff) y = 500 + depth - .5 * (v / prop) * (pts - (takeoff - prop)) ** 2 / scale;
        else if (pts >= takeoff) y = Math.min(500, 500 + depth - .5 * v * prop / scale - v * (pts - takeoff) / scale + .5 * G * (pts - takeoff) ** 2 / scale);
        samples.push({ frame, pts, comX: 480, comY: y + (random() - .5) * 1.2, bodyScale: 400 });
      }
      const stream = new COMStream();
      const results = samples.map(p => stream.push(p)).filter(r => r !== null);
      expect(results, `${height} cm`).toHaveLength(1);
    }
  });
  it.each([15])('measures a 30 cm jump from a steady %i Hz live cadence', fps => {
    const height = 30, v = Math.sqrt(2 * G * height / 100), scale = .003, prop = .2, takeoff = 1.4, dip = 1;
    const depth = .5 * (v / prop) * prop * prop / scale;
    const samples = Array.from({ length: Math.floor(3.2 * fps) + 1 }, (_, frame) => {
      const pts = frame / fps; let y = 500;
      if (pts > dip && pts < takeoff - prop) y += depth * (1 - Math.cos(Math.PI * (pts - dip) / (takeoff - prop - dip))) / 2;
      else if (pts >= takeoff - prop && pts < takeoff) y = 500 + depth - .5 * (v / prop) * (pts - (takeoff - prop)) ** 2 / scale;
      else if (pts >= takeoff) y = Math.min(500, 500 + depth - .5 * v * prop / scale - v * (pts - takeoff) / scale + .5 * G * (pts - takeoff) ** 2 / scale);
      return { frame, pts, comX: 480, comY: y, bodyScale: 400 };
    });
    const stream = new COMStream();
    const results = samples.map(p => stream.push(p)).filter(r => r !== null);
    expect(results, results[0]?.analysis.reason).toHaveLength(1);
    expect(results[0].analysis.heightCm, results[0].analysis.reason).toBeCloseTo(height, 0);
  });
  it.each([20, 24])('estimates a 30 cm jump at %i Hz instead of clamping it near 20 cm', fps => {
    const height = 30, v = Math.sqrt(2 * G * height / 100), scale = .003, prop = .2;
    const depth = .5 * (v / prop) * prop * prop / scale;
    const samples = Array.from({ length: Math.floor(2.2 * fps) + 1 }, (_, frame) => {
      const pts = frame / fps; let y = 500;
      const takeoff = .85;
      if (pts > .45 && pts < takeoff - prop) y += depth * (1 - Math.cos(Math.PI * (pts - .45) / (takeoff - prop - .45))) / 2;
      else if (pts >= takeoff - prop && pts < takeoff) y = 500 + depth - .5 * (v / prop) * (pts - (takeoff - prop)) ** 2 / scale;
      else if (pts >= takeoff) y = Math.min(500, 500 + depth - .5 * v * prop / scale - v * (pts - takeoff) / scale + .5 * G * (pts - takeoff) ** 2 / scale);
      return { frame, pts, comX: 480, comY: y, bodyScale: 400 };
    });
    const result = analyzeCOM(samples, 400);
    expect(result.heightCm, result.reason).toBeCloseTo(height, 0);
  });
  it('publishes a noisy 44 Hz jump when the full windows agree', () => {
    const samples = smallJump(30, 44, 2);
    const result = analyzeCOM(samples, 400);
    expect(Math.abs(result.heightCm! - 30), result.reason).toBeLessThan(2);
    const stream = new COMStream();
    const published = samples.map(p => stream.push(p)).filter(r => r?.analysis.heightCm != null);
    expect(published).toHaveLength(1);
  });
  it('does not bridge a missing observation at the apex', () => {
    const samples = smallJump(10, 60), apex = samples.reduce((a, b) => a.comY < b.comY ? a : b);
    expect(analyzeCOM(samples.map(p => p === apex ? { ...p, comY: null } : p), 400).heightCm).toBeNull();
  });
  it('keeps accepted low-jump estimates bounded under sub-frame offsets and coordinate noise', () => {
    let accepted = 0;
    for (const fps of [30, 60]) for (const height of [5, 10, 15]) for (const phase of [0, .3, .7]) {
      const result = analyzeCOM(smallJump(height, fps, .3, phase), 400);
      if (result.heightCm === null) continue; // Sparse/ambiguous evidence may be rejected.
      accepted++;
      expect(Math.abs(result.heightCm - height)).toBeLessThan(3);
    }
    expect(accepted).toBeGreaterThanOrEqual(9);
  });
});
