import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync } from 'node:fs';
import { ToeCycleResults, TOE_CYCLE_PRESENTATION_VERSION } from '../src/rebound/ToeCycleLab';
import { toeCycleReport } from '../src/rebound/toe-cycle-research';
import { soleContactReport, type SoleContactReport } from '../src/rebound/sole-contact';

type Report = ReturnType<typeof toeCycleReport>;
const measured = (report: Report, extra: Partial<SoleContactReport> = {}): SoleContactReport => {
  const sole = { ...soleContactReport(report, null), available: true, reason: null, ...extra };
  // A sole-measured headline unless a test sets the basis itself.
  return 'basis' in extra ? sole : { ...sole, basis: sole.mean === null ? null : 'SOLE', headlineMean: sole.mean, headlineContactSeconds: sole.meanContactSeconds };
};

describe('continuous toe-cycle result presentation', () => {
  it('labels an unavailable estimate instead of filling zero or previous values', () => {
    const report = toeCycleReport([], 'test', 'test.mov');
    const html = renderToStaticMarkup(<ToeCycleResults report={report} sole={soleContactReport(report, [])} pelvisMean={1.59} />);
    expect(html).toContain('— <small>m/s');
    expect(html).toContain('動画のコマ数が不足');
    expect(html).toContain('数値を0や過去の平均、つま先の型だけの値で補っていません');
    expect(html).not.toContain('0.00');
  });
  it('distinguishes a subset, model estimate, assumptions and alternative baseline', () => {
    const base = toeCycleReport([], 'test', 'test.mov');
    const report = { ...base, candidateDetected: 11, detected: 11, totalCycles: 10, acceptedCycles: 8,
      acceptedCycleIds: [1, 2, 3, 4, 5, 7, 8, 9], mean: 1.1234, partial: true,
      boundaryCycles: [9], meanProfileRange: [.8, 1.5] as [number, number] };
    const sole = measured(report, { mean: .9876, measuredCycles: 7, measuredCycleIds: [1, 2, 3, 4, 5, 7, 8], meanContactSeconds: .2014, modelMean: 1.1234 });
    const html = renderToStaticMarkup(<ToeCycleResults report={report} sole={sole} pelvisMean={1.59} />);
    for (const s of ['0.99 <small>m/s', '靴底で接地を測れた周期 7 / 10', '平均接地 201 ms', '全周期の平均ではありません', '算出周期：1・2・3・4・5・7・8',
      '精度未検証', '測定器の実測値ではありません', '探索範囲の端', '信頼区間・誤差保証ではありません',
      '最後3回平均', '従来の骨盤モデル：1.59', 'つま先の型だけで計算した平均：<span data-testid="toe-cycle-template">1.12</span>']) expect(html).toContain(s);
    expect(html).not.toContain('type="number"');
  });
  it('is the public RJ entry (also at the old toe-cycle URL) on a CMJ/RJ/10m-only site', () => {
    const main = readFileSync('src/public-app/main.tsx', 'utf8');
    expect(main).toContain("const RJ = lazy(() => import('../rebound/ToeCycleLab'))");
    expect(main).toContain("lab === 'rj' || lab === 'rj-toe-cycle' ? <RJ />");
    expect(main).toContain("lab === 'cmj' ? <CMJ />"); expect(main).toContain("lab === 'sprint10' ? <Sprint />");
    // No old automatic RJ, research screens or track-and-field modules on the public site.
    expect(main).not.toMatch(/AutomaticReboundLab|CMJStage1|CMJResearch|hurdle|high-jump|long-jump|throwing|crouch/i);
    const component = readFileSync('src/rebound/ToeCycleLab.tsx', 'utf8');
    // Both-legs RJ analyses the observed poses and soles as they are; single-leg ones the stance leg of the same observation.
    expect(component).toContain('const analysed = single ? stanceLegFrames(observation.poses) : observation.poses;');
    expect(component).toContain('const soles = single && observation.soles ? stanceSoles(observation.poses, observation.soles) : observation.soles;');
    expect(component).toContain('toeCycleReport(analysed');
    expect(component).toContain('soleContactReport(result, soles)');
    // Shoe pixels are read in the single pose pass; no second decode of the video.
    expect(component).not.toMatch(/collectPixelRows|refineAutomaticReview|automaticFootResult/);
    expect(component).toContain('cached.current?.file === file');
  });
  it('names the shoe-contact timing, the template and apex versions, and warns at the search limit', () => {
    const base = toeCycleReport([], 'test', 'test.mov');
    const report = { ...base, phaseBoundaryCycles: [2, 4] };
    const html = renderToStaticMarkup(<ToeCycleResults report={report} sole={measured(report)} pelvisMean={null} />);
    expect(html).toContain('解析 v6 · 離地・着地を靴底の画像で測定。床の影と重なる動画はつま先の軌跡で計算（周期の型 v3・頂点選択 v4）');
    expect(html).toContain('rj-sole-contact-v2-experimental');
    expect(html).toContain('骨盤とつま先のタイミング差が探索範囲の端に達した周期：2・4');
    expect(html).toContain('接地の目安を十分に絞れていない可能性');
  });
  it('shows the toe-template RSI, and says why, when the shoe silhouette merged with a floor shadow', () => {
    const base = toeCycleReport([], 'test', 'test.mov');
    const report = { ...base, candidateDetected: 11, detected: 11, mean: 1.6051, totalCycles: 10, acceptedCycles: 10 };
    const sole = measured(report, { mean: .702, measuredCycles: 7, measuredCycleIds: [1, 2, 3, 4, 6, 7, 9], meanContactSeconds: .263,
      modelMean: 1.6051, basis: 'TOE_MODEL', headlineMean: 1.6051, headlineContactSeconds: .183, reason: 'SOLE_FLOOR_SHADOW_SUSPECTED',
      landingLeadSeconds: .045, takeoffLagSeconds: .04 });
    const html = renderToStaticMarkup(<ToeCycleResults report={report} sole={sole} pelvisMean={null} />);
    expect(html).toContain('<strong data-testid="toe-cycle-rsi">1.61 <small>m/s');
    expect(html).toContain('つま先の軌跡で計算した周期 10 / 10'); expect(html).toContain('平均接地 183 ms');
    expect(html).toContain('床の影と一体'); expect(html).toContain('靴底で測った場合の値（0.70 m/s）は使っていません');
    expect(html).not.toContain('全周期の平均ではありません');
    expect(html).not.toContain('role="alert"');
  });
  it('adds the last-three mean and the best cycle next to the all-cycle mean', () => {
    const base = toeCycleReport([], 'test', 'test.mov');
    const cycle = (id: number, value: number) => ({ id, fromPeak: id, toPeak: id + 1, startPts: id, endPts: id + .6, period: .6, reason: null,
      result: { value, fraction: .7, footFractions: [.7, .7], footPhases: [0, 0] } });
    const cycles = [1.48, 1.26, 1.38, 1.46, 1.57, 1.56, 1.59, 1.66, 1.75, 1.71].map((v, i) => cycle(i + 1, v));
    const report = { ...base, candidateDetected: 11, detected: 11, mean: 1.542, totalCycles: 10, acceptedCycles: 10, cycles } as unknown as typeof base;
    const sole = measured(report, { modelMean: 1.542, basis: 'TOE_MODEL', headlineMean: 1.542, headlineContactSeconds: .17, reason: 'SOLE_CONTACT_INSUFFICIENT_CYCLES' });
    const html = renderToStaticMarkup(<ToeCycleResults report={report} sole={sole} pelvisMean={null} />);
    expect(html).toContain('最後3回の平均 <b>1.71</b> · 最高 <b>1.75</b> m/s（平均は全10周期）');
  });
  it('puts the average RSI first and leaves the candidate range only in closed details', () => {
    const base = toeCycleReport([], 'test', 'test.mov');
    const report = { ...base, candidateDetected: 11, detected: 11, mean: 1.3602501729526453, totalCycles: 10, acceptedCycles: 10,
      meanProfileRange: [.884534319108584, 2.4094902846166955] as [number, number] };
    const sole = measured(report, { mean: 1.0526, measuredCycles: 10, measuredCycleIds: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], meanContactSeconds: .18 });
    const html = renderToStaticMarkup(<ToeCycleResults report={report} sole={sole} pelvisMean={null} />);
    const headline = html.slice(0, html.indexOf('</div>'));
    expect(headline).toContain('平均RSI（推定）');
    expect(headline).toContain('<strong data-testid="toe-cycle-rsi">1.05 <small>m/s</small></strong>');
    expect(headline).toContain('靴底で接地を測れた周期 10 / 10');
    expect(headline).toContain('解析対象 11 頂点');
    // The toe-template value is a reference only, never the headline.
    expect(headline).not.toContain('1.36'); expect(headline).not.toContain('候補幅'); expect(headline).not.toContain('～');
    expect(html).not.toContain('全周期の平均ではありません');
    expect(html).toMatch(/<details><summary>つま先の型だけの値（参考）<\/summary><p>つま先の型だけで計算した平均：<span data-testid="toe-cycle-template">1.36<\/span> m\/s。/);
    expect(html).toContain('型の設定による候補幅：<span data-testid="toe-cycle-range">0.88～2.41 m/s</span>');
    expect(html).not.toMatch(/<details[^>]*\bopen(?:[ =>])/);
    expect(html).toContain('信頼区間・誤差保証ではありません');
    expect(html).toContain('精度未検証の推定です');
    expect(html).not.toContain('表示 v3'); expect(html).not.toContain('選手の能力を比較');
    expect(html).not.toContain('各周期の最適候補の平均（参考）');
  });
  it('shows a single RSI per cycle instead of a candidate range', () => {
    const base = toeCycleReport([], 'test', 'test.mov');
    const report = { ...base, cycles: [{ id: 1, fromPeak: 3, toPeak: 4, period: .58, reason: null,
      result: { value: 1.453, profileRange: [.969, 2.559], boundary: false, phaseBoundary: false } }] } as typeof base;
    const sole = measured(report, { cycles: [{ id: 1, period: .58, modelLandingPts: null, modelTakeoffPts: null, landingPts: 1, takeoffPts: 1.187,
      contactSeconds: .187, flightSeconds: .393, value: 1.0317, footLandings: [1, 1], footTakeoffs: [1.187, 1.18], reason: null }] });
    const html = renderToStaticMarkup(<ToeCycleResults report={report} sole={sole} pelvisMean={null} />);
    expect(html).toContain('<th>接地 ms</th><th>RSI推定 m/s</th><th>型のみ m/s</th>');
    expect(html).toContain('<th>3→4</th>');
    expect(html).toContain('<td>0.580</td><td>187</td><td>1.03</td><td>1.45</td><td>靴底で測定</td>');
    expect(html).not.toContain('0.97～2.56'); expect(html).not.toContain('参考 1.45');
  });
  it('separates excluded candidates, unresolved candidates and drift-limited calculation counts', () => {
    const base = toeCycleReport([], 'test', 'test.mov');
    const apex = (pts: number) => ({ frame: Math.round(pts * 120), pts, y: 400 });
    const report: typeof base = { ...base, reason: null, candidateDetected: 5, detected: 3,
      totalCycles: 1, acceptedCycles: 0, acceptedCycleIds: [], mean: null, partial: true,
      excludedCandidateIndices: [1, 4], unresolvedCandidateIndices: [2],
      apexChecks: [
        { candidateIndex: 0, apex: apex(.5), status: 'SUPPORTED', included: true, reason: null,
          excursionsOverLeg: [.2, .2], recordingSectionCoverage: [1, 1, 1] },
        { candidateIndex: 1, apex: apex(1), status: 'NOT_BILATERAL', included: false,
          reason: 'APEX_NO_BILATERAL_RISE_FALL', excursionsOverLeg: [.01, .2], recordingSectionCoverage: [1, 1, 1] },
        { candidateIndex: 2, apex: apex(1.5), status: 'UNRESOLVED', included: true,
          reason: 'APEX_LEFT_TOE_GAP', excursionsOverLeg: [null, null], recordingSectionCoverage: [1, 1, 1] },
        { candidateIndex: 3, apex: apex(2), status: 'SUPPORTED', included: true, reason: null,
          excursionsOverLeg: [.2, .2], recordingSectionCoverage: [1, 1, 1] },
        { candidateIndex: 4, apex: apex(2.5), status: 'INCOMPLETE_WINDOW', included: false,
          reason: 'APEX_RECORDING_EDGE', excursionsOverLeg: [null, null], recordingSectionCoverage: [1, 1, .3] },
      ],
      cycles: [{ id: 1, fromPeak: 3, toPeak: 4, startPts: 1.5, endPts: 2, period: .5,
        reason: 'PELVIS_SUBJECT_DRIFT', result: null,
        profile: { points: [], reason: 'PELVIS_SUBJECT_DRIFT', coverage: [0, 0], spansOverLeg: [0, 0],
          leftBestFraction: null, rightBestFraction: null, period: .5, footPoints: [[], []], commonProfileRange: null },
      }],
    };
    const html = renderToStaticMarkup(<ToeCycleResults report={report} sole={soleContactReport(report, [])} pelvisMean={null} />);
    expect(html).toContain('靴底で接地を測れた周期 0 / 1 · 解析対象 3 頂点');
    expect(html).toContain('骨盤の候補 5 箇所のうち、前後の両足軌跡を確認できない 2 箇所は集計対象外');
    expect(html).toContain('実際に跳んでいないと断定した数ではありません');
    expect(html).toContain('追跡不足などで頂点確認を保留した候補があります');
    expect(html).toContain('確認保留・候補を維持：左つま先の確認用軌跡が不足');
    expect(html).toContain('集計対象外：左右のつま先にそろった上昇・下降が見られない');
    expect(html).toContain('集計対象外：録画端で左右の上昇・下降の軌跡を確認できない');
    expect(html).toContain('頂点は残していますが、横移動が大きいためRSIは計算保留');
    expect(html).toContain('対象外の候補を飛び越えて周期を作りません');
    expect(html).toContain('<th>3→4</th><td>0.500</td><td>—</td><td>—</td><td>—</td>');
    expect(html).not.toContain('<th>1→3</th>');
    expect(html).not.toContain('0.00');
  });
  it('does not claim candidate exclusions or unresolved checks when neither occurred', () => {
    const base = toeCycleReport([], 'test', 'test.mov');
    const html = renderToStaticMarkup(<ToeCycleResults report={base} sole={measured(base)} pelvisMean={null} />);
    expect(html).not.toContain('箇所は集計対象外です');
    expect(html).not.toContain('追跡不足などで頂点確認を保留した候補があります');
  });
  it('identifies the new model while preserving saved-JSON recalculation and source provenance', () => {
    expect(TOE_CYCLE_PRESENTATION_VERSION).toBe('rj-toe-cycle-presentation-v8');
    const component = readFileSync('src/rebound/ToeCycleLab.tsx', 'utf8');
    expect(component).toContain('parseToeCycleImport(text, selected.size)');
    expect(component).toContain("origin: 'SAVED_JSON'");
    expect(component).toContain("sourceVideoVerified: observation.origin === 'VIDEO'");
    expect(component).toContain("version: 'rj-toe-cycle-export-v1'");
    expect(component).toContain('toeCycleReport(analysed, observation.hash, observation.filename)');
    expect(component).toContain('soles: observation.soles');
  });
  it('explains a missing shoe trace from an older saved JSON without falling back to the template', () => {
    const base = toeCycleReport([], 'test', 'test.mov');
    const report = { ...base, reason: null, mean: 1.2, acceptedCycles: 9, totalCycles: 10 };
    const html = renderToStaticMarkup(<ToeCycleResults report={report} sole={soleContactReport(report, null)} pelvisMean={null} />);
    expect(html).toContain('<strong data-testid="toe-cycle-rsi">— <small>m/s</small></strong>');
    expect(html).toContain('靴底の画像データがありません');
    expect(html).toContain('つま先の型だけの値で補っていません');
  });
});
