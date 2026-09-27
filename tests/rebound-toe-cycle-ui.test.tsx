import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync } from 'node:fs';
import { ToeCycleResults } from '../src/rebound/ToeCycleLab';
import { toeCycleReport } from '../src/rebound/toe-cycle-research';

describe('continuous toe-cycle result presentation', () => {
  it('labels an unavailable estimate instead of filling zero or previous values', () => {
    const report = toeCycleReport([], 'test', 'test.mov');
    const html = renderToStaticMarkup(<ToeCycleResults report={report} pelvisMean={1.59} />);
    expect(html).toContain('— <small>m/s');
    expect(html).toContain('動画のコマ数が不足');
    expect(html).toContain('数値を0や過去の平均で補っていません');
    expect(html).not.toContain('0.00');
  });
  it('distinguishes a subset, model estimate, assumptions and alternative baseline', () => {
    const base = toeCycleReport([], 'test', 'test.mov');
    const report = { ...base, detected: 11, totalCycles: 10, acceptedCycles: 8,
      acceptedCycleIds: [1, 2, 3, 4, 5, 7, 8, 9], mean: 1.1234, partial: true,
      boundaryCycles: [9], meanProfileRange: [.8, 1.5] as [number, number] };
    const html = renderToStaticMarkup(<ToeCycleResults report={report} pelvisMean={1.59} />);
    for (const s of ['1.12', '計算できた周期 8 / 10', '全周期の平均ではありません', '精度未検証',
      '接地に相当する時間もモデル内部の推定', '探索範囲の端', '信頼区間・誤差保証ではありません',
      '最後3回平均', '同じ骨格データの従来モデル：1.59']) expect(html).toContain(s);
    expect(html).not.toContain('type="number"');
  });
  it('is a separate route and cannot silently replace CMJ, sprint or normal RJ', () => {
    const main = readFileSync('src/public-app/main.tsx', 'utf8');
    expect(main).toContain("const RJ = lazy(() => import('../rebound/AutomaticReboundLab'))");
    expect(main).toContain("lab === 'rj-toe-cycle' ? <RJToeCycle />");
    const component = readFileSync('src/rebound/ToeCycleLab.tsx', 'utf8');
    expect(component).toContain('toeCycleReport(observation.poses');
    expect(component).not.toMatch(/collectPixelRows|refineAutomaticReview|automaticFootResult/);
    expect(component).toContain('cached.current?.file === file');
  });
  it('shows the model revision and warns when the timing search hits its limit', () => {
    const base = toeCycleReport([], 'test', 'test.mov');
    const report = { ...base, phaseBoundaryCycles: [2, 4] };
    const html = renderToStaticMarkup(<ToeCycleResults report={report} pelvisMean={null} />);
    expect(html).toContain('試験版 v2');
    expect(html).toContain('骨盤とつま先のタイミング差が探索範囲の端に達した周期：2・4');
    expect(html).toContain('時間割合を十分に絞れていない可能性');
  });
  it('puts the setting-dependent range in the headline and keeps the optimum secondary', () => {
    const base = toeCycleReport([], 'test', 'test.mov');
    const report = { ...base, mean: 1.3602501729526453, totalCycles: 10, acceptedCycles: 10,
      meanProfileRange: [.884534319108584, 2.4094902846166955] as [number, number] };
    const html = renderToStaticMarkup(<ToeCycleResults report={report} pelvisMean={null} />);
    expect(html).toMatch(/<strong[^>]+data-testid="toe-cycle-range"[^>]*>0.88～2.41/);
    expect(html).toContain('各周期の最適候補の平均（参考）');
    expect(html).toContain('<span data-testid="toe-cycle-rsi">1.36 m/s</span>');
    expect(html).toContain('全周期を計算できても、RSIの正確さを確認した意味ではありません');
    expect(html).toContain('表示 v3 · 推定モデルは試験版 v2のまま');
    expect(html).toContain('この幅は信頼区間・実測誤差の上限ではありません');
    expect(html).not.toMatch(/<strong[^>]*>1.36/);
  });
  it('shows a range for each cycle instead of only the optimum', () => {
    const base = toeCycleReport([], 'test', 'test.mov');
    const report = { ...base, cycles: [{ id: 1, period: .58, reason: null,
      result: { value: 1.453, profileRange: [.969, 2.559], boundary: false, phaseBoundary: false } }] } as typeof base;
    const html = renderToStaticMarkup(<ToeCycleResults report={report} pelvisMean={null} />);
    expect(html).toContain('RSI候補幅 / 参考値');
    expect(html).toContain('0.97～2.56<br/>参考 1.45');
  });
});
