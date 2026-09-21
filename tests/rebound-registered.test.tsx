import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { analyzeRegistered, registeredCSV, type Registration } from '../src/rebound/registered-template';
import RegisteredResults from '../src/rebound/RegisteredResults';
import { emptySignals } from '../src/rebound/predictions';
import { G } from '../src/cmj/analysis';

function fixture(count = 10, vary = false) {
  const flights: { start: number; end: number }[] = [];
  let t = .3;
  for (let i = 0; i < count; i++) { flights.push({ start: t, end: t + .4 }); t += .4 + .2 + (vary ? i / 120 : 0); }
  const signals = emptySignals();
  for (let frame = 0; frame <= Math.ceil((flights.at(-1)!.end + .4) * 120); frame++) {
    const pts = frame / 120; let y = 500;
    const flight = flights.find(f => pts >= f.start && pts <= f.end);
    if (flight) { const u = (pts - flight.start) / (flight.end - flight.start); y -= 80 * 4 * u * (1 - u); }
    else {
      const i = flights.findIndex((f, i) => i < flights.length - 1 && pts > f.end && pts < flights[i + 1].start);
      if (i >= 0) y += 30 * Math.sin(Math.PI * (pts - flights[i].end) / (flights[i + 1].start - flights[i].end));
    }
    const sample = { frame, pts, comX: 480, comY: y, bodyScale: 300, reason: undefined };
    signals.PELVIS.push(sample); signals.HIP_KNEE.push({ ...sample, comY: y * .85 + 30 }); signals.COM.push(sample);
  }
  const registration: Registration = { takeoff1: { frame: 36, pts: .3 }, landing1: { frame: 84, pts: .7 }, takeoff2: { frame: 108, pts: .9 } };
  return { signals, registration, flights };
}
describe('RJ manually registered template experiment', () => {
  it('accepts the recognized jump count below ten and reports the actual RSI denominator', () => {
    for (const n of [2, 5, 8]) {
      const { signals, registration } = fixture(n), r = analyzeRegistered(signals, registration);
      expect(r.reason).toBeNull(); expect(r.jumps).toHaveLength(n);
      expect(r.validRSICount).toBe(n - 1);
      expect(r.meanRSI).toBeCloseTo(r.jumps.slice(1).reduce((s, j) => s + j.rsi!, 0) / (n - 1));
    }
  });
  it('pairs contact before jump N with flight of jump N, excluding initial standing', () => {
    const { signals, registration } = fixture(); const r = analyzeRegistered(signals, registration);
    expect(r.reason).toBeNull(); expect(r.jumps).toHaveLength(10); expect(r.validRSICount).toBe(9);
    expect(r.jumps[0].rsi).toBeNull(); expect(r.jumps[0].flightSource).toBe('MANUAL');
    expect(r.jumps[1].contactSeconds).toBeCloseTo(.2); expect(r.jumps[1].contactSource).toBe('MANUAL');
    for (const j of r.jumps.slice(1)) {
      expect(j.flightSource).toBe('PREDICTED'); expect(j.contactSeconds).toBeCloseTo(.2, 1);
      expect(j.rsi).toBeCloseTo(G * j.flightSeconds! ** 2 / 8 / j.contactSeconds!, 8);
    }
    expect(r.jumps[9].landing?.source).toBe('TERMINAL_FLIGHT_TEMPLATE');
  });
  it('adapts support duration instead of copying the manual value to every jump', () => {
    const { signals, registration } = fixture(10, true); const r = analyzeRegistered(signals, registration);
    expect(r.reason).toBeNull(); expect(r.validRSICount).toBeGreaterThan(5);
    expect(r.jumps[8].contactSeconds!).toBeGreaterThan(r.jumps[1].contactSeconds! + .025);
  });
  it('excludes an eleventh rebound from aggregation, using it only as boundary evidence', () => {
    const { signals, registration } = fixture(11); const r = analyzeRegistered(signals, registration);
    expect(r.jumps).toHaveLength(10); expect(r.excludedPeakFrames).toHaveLength(1);
    expect(r.jumps[9].landing?.source).toBe('TEMPLATE'); expect(r.validRSICount).toBe(9);
  });
  it('rejects invalid ordering, foreign frame timestamps and wrong jump anchors', () => {
    const { signals, registration } = fixture();
    expect(analyzeRegistered(signals, { ...registration, landing1: registration.takeoff1 }).reason).toContain('順');
    expect(analyzeRegistered(signals, { ...registration, takeoff1: { frame: 37, pts: .3 } }).reason).toContain('一致');
    expect(analyzeRegistered(signals, { takeoff1: { frame: 108, pts: .9 }, landing1: { frame: 156, pts: 1.3 }, takeoff2: { frame: 180, pts: 1.5 } }).reason).toContain('対応');
  });
  it('does not silently fill a tracking gap or pretend a partial mean covers all nine', () => {
    const { signals, registration } = fixture();
    signals.HIP_KNEE = signals.HIP_KNEE.map(s => s.pts > 2 && s.pts < 2.2 ? { ...s, comY: null } : s);
    const r = analyzeRegistered(signals, registration);
    expect(r.validRSICount).toBeLessThan(9); expect(r.jumps.some(j => j.jump > 1 && j.rsi === null)).toBe(true);
    if (r.validRSICount) expect(r.warnings.join()).toContain('だけの集計');
  });
  it('rejects a clipped final landing instead of inventing the eleventh apex', () => {
    const { signals, registration, flights } = fixture(); const end = flights.at(-1)!.end - .08;
    for (const key of ['PELVIS', 'HIP_KNEE', 'COM'] as const) signals[key] = signals[key].filter(s => s.pts < end);
    const r = analyzeRegistered(signals, registration);
    expect(r.reason).toBeNull(); expect(r.jumps[9].flightSeconds).toBeNull(); expect(r.jumps[9].rsi).toBeNull();
  });
  it('labels manual/predicted values and exports failures as blanks', () => {
    const { signals, registration } = fixture(); const r = analyzeRegistered(signals, registration);
    const html = renderToStaticMarkup(<RegisteredResults result={r} seek={() => {}} saveJSON={() => {}} saveCSV={() => {}} />);
    expect(html).toContain('手動登録'); expect(html).toContain('予測'); expect(html).toContain('採用回数'); expect(html).toContain('信頼区間ではありません');
    const csv = registeredCSV(r); expect(csv.split('\n')).toHaveLength(11); expect(csv).toContain('MANUAL'); expect(csv).toContain('TERMINAL_FLIGHT_TEMPLATE');
    expect(csv).not.toContain('NaN'); expect(csv).not.toContain('undefined');
  });
});
