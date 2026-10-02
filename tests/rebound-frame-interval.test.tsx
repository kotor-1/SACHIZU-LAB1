import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import type { NormalizedLandmark } from '@mediapipe/tasks-vision';
import { gapLimit, RJ_MIN_FPS, sampleMinimum, typicalInterval } from '../src/rebound/frame-interval';
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

describe('RJ from the camera (screen)', () => {
  it('offers the camera next to recorded videos', () => {
    const html = renderToStaticMarkup(<ToeCycleLab />);
    expect(html).toContain('録画した動画'); expect(html).toContain('カメラで計測');
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
