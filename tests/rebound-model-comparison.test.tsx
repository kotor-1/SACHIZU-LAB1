import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { comparePoseModels } from '../src/rebound/model-comparison';
import PoseModelComparison from '../src/rebound/PoseModelComparison';
import type { AutomaticRunReport } from '../src/rebound/automatic-run';

function run(model: 'full' | 'heavy', peaks = [10, 30, 50], values: (number | null)[] = [null, 1, 2]): AutomaticRunReport {
  return { poseModel: model, mode: 'BOTH', file: { name: 'same.mov', size: 1 },
    frameTimes: Array.from({ length: 100 }, (_, i) => i / 30), frames: 100,
    seeds: { selectedPeakFrames: peaks }, recognizedJumps: peaks.length,
    acceptedJumpNumbers: values.flatMap((v, i) => v === null ? [] : [i + 1]),
    acceptedRSICount: values.filter(v => v !== null).length, expectedRSICount: peaks.length - 1,
    meanRSI: 1.5, tracking: { totalFrames: 100, poseFrames: 100, footFrames: 95 },
    timing: { totalSeconds: 10, setupSeconds: 1, processingSeconds: 9 },
    jumps: peaks.map((p, i) => ({ jump: i + 1, rsi: values[i], takeoff: p / 30 - .1, landing: p / 30 + .1 })),
  } as unknown as AutomaticRunReport;
}
describe('RJ model comparison, not a model winner selection', () => {
  it('compares common accepted jumps and never fills missing RSI with zero', () => {
    const c = comparePoseModels(run('full'), run('heavy', [11, 31, 51], [null, null, 3]));
    expect(c.commonCount).toBe(1); expect(c.commonFullMean).toBe(2); expect(c.commonHeavyMean).toBe(3);
    expect(c.pairs).toHaveLength(3); expect(c.pairs[0].takeoffDifferenceMs).toBeCloseTo(1000 / 30);
  });
  it('matches by source peak time rather than ordinal after a missed early jump', () => {
    const c = comparePoseModels(run('full'), run('heavy', [30, 50], [null, 3]));
    expect(c.pairs.map(p => [p.fullJump, p.heavyJump])).toEqual([[2, 1], [3, 2]]);
    expect(c.unmatchedFull).toEqual([1]); expect(c.commonCount).toBe(1);
  });
  it('does not force ambiguous or distant peaks into a match', () => {
    const c = comparePoseModels(run('full'), run('heavy', [9, 11, 80]));
    expect(c.pairs).toEqual([]); expect(c.commonCount).toBe(0); expect(c.commonFullMean).toBeNull();
  });
  it('requires the same model pair, file metadata, mode and exact full timeline', () => {
    for (const changed of [ { poseModel: 'full' }, { mode: 'RIGHT' }, { file: { name: 'other.mov', size: 1 } },
      { frameTimes: [0, 1] }, { frameTimes: run('heavy').frameTimes.map((t, i) => i === 4 ? NaN : t) } ]) {
      expect(() => comparePoseModels(run('full'), { ...run('heavy'), ...changed } as AutomaticRunReport)).toThrow('一致しません');
    }
  });
  it('renders practical checks, timing caveats and no accuracy winner', () => {
    const html = renderToStaticMarkup(<PoseModelComparison comparison={comparePoseModels(run('full'), run('heavy'))} />);
    expect(html).toContain('足点の追跡成立率'); expect(html).toContain('正確とは判断できません');
    expect(html).toContain('発熱やキャッシュ'); expect(html).toContain('今回見てほしいこと');
    expect(html).not.toContain('Heavyが優秀');
  });
});
