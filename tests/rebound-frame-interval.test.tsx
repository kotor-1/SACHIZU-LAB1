import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import type { NormalizedLandmark } from '@mediapipe/tasks-vision';
import { gapLimit, RJ_MIN_FPS, sampleMinimum, SIXTY_FPS, sixtyFps, typicalInterval } from '../src/rebound/frame-interval';
import ToeCycleLab, { ToeCycleResults } from '../src/rebound/ToeCycleLab';
import { toeCycleDepth, toeCycleReport } from '../src/rebound/toe-cycle-research';
import { soleContactReport } from '../src/rebound/sole-contact';
import { hybridDisplacement } from '../src/rebound/hybrid-physics';
import type { PoseFrame } from '../src/rebound/prediction-observations';

const times = (fps: number, n = 30) => Array.from({ length: n }, (_, i) => i / fps);

describe('RJ limits at camera frame rates', () => {
  it('keeps the 120-240 fps limits and widens them for longer frame intervals', () => {
    expect(typicalInterval(times(120))).toBeCloseTo(1 / 120, 9);
    for (const fps of [240, 120]) { expect(gapLimit(.025, times(fps))).toBe(.025); expect(sampleMinimum(20, times(fps))).toBe(20); }
    expect(gapLimit(.025, times(60))).toBe(.025); expect(sampleMinimum(20, times(60))).toBe(10);
    expect(gapLimit(.025, times(30))).toBeCloseTo(.05, 9); expect(sampleMinimum(20, times(30))).toBe(10);
    expect(RJ_MIN_FPS).toBe(25);
  });
});

// The synthetic bilateral jumps of rebound-toe-cycle.test.ts (240 fps).
function poses(count = 12, fraction = .6): PoseFrame[] {
  return Array.from({ length: count * 144 + 1 }, (_, frame) => {
    const phase = (frame / 144 + .5) % 1;
    const hip = .4 + 1200 / 960 * hybridDisplacement(phase, fraction, 'HALF_SINE');
    const landmarks: NormalizedLandmark[] = Array.from({ length: 33 }, () => ({ x: .5, y: -1, z: 0, visibility: 0 }));
    for (const [index, y] of [[23, hip], [24, hip], [25, hip + .15], [26, hip + .15],
      [27, hip + .30], [28, hip + .30], [31, .76 + .075 * toeCycleDepth(phase, fraction)],
      [32, .76 + .075 * toeCycleDepth(phase, fraction)]]) {
      landmarks[index] = { x: index % 2 ? .46 : .54, y, z: 0, visibility: .99 };
    }
    return { frame, pts: frame / 240, poses: [landmarks] };
  });
}

describe('RJ corrections at 60 fps (2026-10-23)', () => {
  it('applies only from 45 to below 90 frames/s', () => {
    for (const fps of [60, 59.94, 50, 45]) expect(sixtyFps(1 / fps)).toBe(true);
    for (const fps of [240, 120, 90, 44, 30]) expect(sixtyFps(1 / fps)).toBe(false);
  });
  it('refines every pelvis apex at 60 fps as at 240, between frames', () => {
    const all = poses(), fine = toeCycleReport(all, 'synthetic', 'a.mov');
    // Every 4th frame, starting one 240 fps frame late: the apexes fall between the 60 fps frames
    // (before 2026-10-23, 8 of these 12 stayed on a frame, 12.5 ms off).
    const frames = all.filter((_, i) => i % 4 === 1), sixty = toeCycleReport(frames, 'synthetic', 'a.mov');
    expect(sixty.peaks.length).toBe(fine.peaks.length);
    sixty.peaks.forEach((p, i) => expect(Math.abs(p.pts - fine.peaks[i].pts)).toBeLessThan(.002));
    expect(sixty.peaks.filter(p => frames.every(f => Math.abs(f.pts - p.pts) > 1e-3)).length).toBe(sixty.peaks.length);
  });
  it('moves 60 fps shoe takeoffs 0.4 frame earlier and leaves landings and 120 fps alone', () => {
    const report = toeCycleReport(poses(), 'synthetic', 'a.mov');
    const soles = (fps: number) => Array.from({ length: Math.round(report.samples.at(-1)!.pts * fps) }, (_, n) => ({ frame: n, pts: n / fps, feet: [null, null] as [null, null] }));
    expect(soleContactReport(report, soles(120)).takeoffShiftSeconds).toBe(0);
    expect(soleContactReport(report, soles(60)).takeoffShiftSeconds).toBeCloseTo(SIXTY_FPS.takeoffShiftFrames / 60, 12);
  });
});

describe('RJ at a low frame rate (screen)', () => {
  it('reads recorded videos first, with the camera next to them (back 2026-10-22)', () => {
    const html = renderToStaticMarkup(<ToeCycleLab />);
    expect(html).toContain('動画を選ぶ'); expect(html).toContain('<button type="button" class="is-selected" aria-pressed="true">録画した動画</button>');
    expect(html).toContain('カメラで計測'); expect(html).not.toContain('カメラを起動');
  });
  it('says why a 30 fps result is from the toe template and reads high', () => {
    const frames = poses().filter((_, i) => i % 8 === 0), report = toeCycleReport(frames, 'synthetic', 'camera.mp4');
    // No shoe sole measured in any frame: the toe template gives the value.
    const sole = soleContactReport(report, frames.map(f => ({ frame: f.frame, pts: f.pts, feet: [null, null] })));
    expect(sole.basis).toBe('TOE_MODEL'); expect(sole.headlineMean).not.toBeNull();
    const low = renderToStaticMarkup(<ToeCycleResults report={report} sole={sole} pelvisMean={null} fps={30} />);
    expect(low).toContain('この動画は1秒30コマのため');
    expect(low).not.toContain('床の影・靴と床の色が近い');   // the frame rate, not the floor, is why
    expect(renderToStaticMarkup(<ToeCycleResults report={report} sole={sole} pelvisMean={null} fps={120} />)).not.toContain('コマのため');
  });
});
