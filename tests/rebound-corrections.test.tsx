import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { correctRegistered, type BoundaryCorrections } from '../src/rebound/registered-corrections';
import type { RegisteredAnalysis } from '../src/rebound/registered-template';
import RegisteredResults from '../src/rebound/RegisteredResults';
import { G } from '../src/cmj/analysis';

const frames = Array.from({ length: 1700 }, (_, frame) => ({ frame, pts: frame / 240 }));
const point = (frame: number) => frames[frame];
function fixture(): RegisteredAnalysis {
  return { version: 'test', validated: false, reason: null, detected: 11,
    registration: { takeoff1: point(72), landing1: point(168), takeoff2: point(216) },
    selectedPeakFrames: Array.from({ length: 10 }, (_, i) => 120 + 144 * i), excludedPeakFrames: [1560], fits: [],
    validRSICount: 9, meanRSI: G * .1, maxRSI: G * .1, warnings: [],
    jumps: Array.from({ length: 10 }, (_, i) => ({ jump: i + 1,
      takeoff: { pts: (72 + 144 * i) / 240, source: i < 2 ? 'MANUAL' : 'TEMPLATE' },
      landing: { pts: (168 + 144 * i) / 240, source: i === 0 ? 'MANUAL' : 'TEMPLATE' },
      contactSeconds: i === 0 ? null : .2, flightSeconds: .4, heightM: G * .02, rsi: i === 0 ? null : G * .1,
      contactSource: i === 0 ? null : i === 1 ? 'MANUAL' : 'PREDICTED', flightSource: i === 0 ? 'MANUAL' : 'PREDICTED', reason: null })),
  };
}
describe('RJ exact-frame corrections and recognized-count aggregation', () => {
  it('uses all ten heights and all nine eligible RSIs, never appending the eleventh', () => {
    const { analysis: r, error } = correctRegistered(fixture(), {}, frames);
    expect(error).toBeNull(); expect(r.jumps).toHaveLength(10);
    expect(r.jumps[0].rsi).toBeNull(); expect(r.validRSICount).toBe(9);
    expect(r.meanRSI).toBeCloseTo(G * .1);
    const html = renderToStaticMarkup(<RegisteredResults result={r} seek={() => {}} saveJSON={() => {}} saveCSV={() => {}} />);
    expect(html).toContain('平均跳躍高（認識 10 回）'); expect(html).toContain('平均RSI（認識 9 回）');
  });
  it('updates only physically dependent intervals and preserves the original', () => {
    const base = fixture(), original = JSON.stringify(base);
    const edits: BoundaryCorrections = { '1:landing': point(174) };
    const { analysis: r, error } = correctRegistered(base, edits, frames);
    expect(error).toBeNull(); expect(r.jumps[0].flightSeconds).toBeCloseTo(.425);
    expect(r.jumps[1].contactSeconds).toBeCloseTo(.175);
    expect(r.jumps[1].rsi).toBeCloseTo(G * .4 ** 2 / 8 / .175);
    expect(r.jumps[2].rsi).toBeCloseTo(G * .1);
    expect(r.meanRSI).toBeCloseTo(r.jumps.slice(1).reduce((s, j) => s + j.rsi!, 0) / 9);
    expect(JSON.stringify(base)).toBe(original);
    expect(correctRegistered(base, {}, frames).analysis.meanRSI).toBeCloseTo(base.meanRSI!);
  });
  it('averages the recognized subset using its actual count, never zero-filling failures', () => {
    const base = fixture(); base.jumps[7].landing = null;
    const r = correctRegistered(base, {}, frames).analysis;
    expect(r.validRSICount).toBe(7); expect(r.meanRSI).toBeCloseTo(G * .1); expect(r.maxRSI).toBeCloseTo(G * .1);
    const fixed = correctRegistered(base, { '8:landing': point(1176) }, frames);
    expect(fixed.error).toBeNull(); expect(fixed.analysis.validRSICount).toBe(9);
    expect(fixed.analysis.meanRSI).toBeCloseTo(G * .1);
  });
  it('keeps zero-recognition summaries blank', () => {
    const base = fixture(); base.jumps.forEach(j => { j.landing = null; });
    const r = correctRegistered(base, {}, frames).analysis;
    expect(r.validRSICount).toBe(0); expect(r.meanRSI).toBeNull(); expect(r.maxRSI).toBeNull();
  });
  it('rejects foreign frames, out-of-order contacts, wrong jumps and the eleventh jump', () => {
    expect(correctRegistered(fixture(), { '2:landing': { frame: 312, pts: 1.301 } }, frames).error).toContain('一致');
    expect(correctRegistered(fixture(), { '2:takeoff': point(160) }, frames).error).toContain('直前の着地');
    expect(correctRegistered(fixture(), { '2:landing': point(220) }, frames).error).toContain('頂点');
    expect(correctRegistered(fixture(), { '11:landing': point(1608) }, frames).error).toContain('一致');
  });
  it('retains measured/manual sources separately from predictions', () => {
    const { analysis: r } = correctRegistered(fixture(), { '2:landing': point(312) }, frames);
    expect(r.jumps[1].flightSource).toBe('MANUAL'); expect(r.jumps[1].contactSource).toBe('MANUAL');
    expect(r.jumps[2].contactSource).toBe('PREDICTED');
  });
});
