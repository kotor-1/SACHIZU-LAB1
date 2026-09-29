import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import CMJStage1, { Stage1Height, Stage1Results } from '../src/cmj/CMJStage1';
import { analyzeStage1, type HeightEstimate } from '../src/cmj/stage1-analysis';
import type { Stage1RecordingRun } from '../src/cmj/stage1-recording';

describe('isolated recording stage1 screen', () => {
  it('limits the workflow to one recording and publishes the fixed display policy', () => {
    const html = renderToStaticMarkup(<CMJStage1 />);
    expect(html).toContain('1回のジャンプ');
    expect(html).toContain('研究用・精度未検証');
    expect(html).toContain('精度保証ではありません');
    expect(html).toContain('第2段階のライブ機能は未導入');
    expect(html).toContain('精度目標の達成を確認する前');
    expect(html).toContain('幅4cm以下は中点と範囲');
    expect(html).toContain('4cm超〜8cm以下は範囲のみ');
    expect(html).toContain('8cm超は数値を保留');
    expect(html).toMatch(/<button disabled="">全元フレームで解析/);
    expect(html.match(/<input/g)).toHaveLength(1);
    expect(html).not.toContain('type="number"');
    expect(html).not.toContain('中点 0.0');
  });
  it('labels the arithmetic midpoint and rounds endpoints outwards', () => {
    const estimate: HeightEstimate = { method: 'B', status: 'POINT', heightCm: 30.155, rangeCm: [28.161, 32.149], reason: null };
    const html = renderToStaticMarkup(<Stage1Height estimate={estimate} />);
    expect(html).toContain('中点 30.2 cm');
    expect(html).toContain('範囲 28.1〜32.2 cm');
    expect(html).not.toContain('中央値');
  });
  it('shows only the range and never a midpoint for RANGE', () => {
    const estimate: HeightEstimate = { method: 'B', status: 'RANGE', heightCm: 30, rangeCm: [27, 33], reason: null };
    const html = renderToStaticMarkup(<Stage1Height estimate={estimate} />);
    expect(html).toContain('範囲のみ 27.0〜33.0 cm');
    expect(html).not.toContain('中点');
    expect(html).not.toContain('30.0');
  });
  it('withholds the main number and preserves the reason and diagnostic range for HOLD', () => {
    const estimate: HeightEstimate = { method: 'B', status: 'HOLD', heightCm: 30, rangeCm: [25.04, 35.06], reason: 'HEIGHT_BAND_TOO_WIDE' };
    const html = renderToStaticMarkup(<Stage1Height estimate={estimate} />);
    expect(html).toContain('数値を保留'); expect(html).toContain('HEIGHT_BAND_TOO_WIDE');
    expect(html).toContain('高さの幅が8cmを超えたため');
    expect(html).not.toContain('中点'); expect(html).not.toContain('30.0');
    expect(html).toMatch(/<details><summary>保留した診断範囲<\/summary><p>25.0〜35.1 cm/);
  });
  it.each([
    ['TAKEOFF_BRACKET_UNRESOLVED', '両足が床を離れた画像までの時間帯'],
    ['INVALID_COM_COORDINATES', '重心計算に使える全身の姿勢情報が不足'],
    ['INSUFFICIENT_AIRBORNE_APEX_WINDOWS', '必要な複数の時間幅で確認できません'],
    ['UNRECOGNIZED_REASON', '判定に必要な観測を十分に確認できません'],
  ])('explains %s in Japanese while preserving its code in details', (reason, description) => {
    const estimate: HeightEstimate = { method: 'B', status: 'HOLD', heightCm: null, rangeCm: null, reason };
    const html = renderToStaticMarkup(<Stage1Height estimate={estimate} />);
    expect(html).toContain(description);
    expect(html).toContain(`<details><summary>理由の診断コード</summary><p>${reason}</p></details>`);
    expect(html).not.toContain(`<p>理由：${reason}</p>`);
  });
  it('keeps B as the main method and shows A plus the unchanged old COM result', () => {
    const analysis = analyzeStage1([]);
    const run = { analysis, file: { name: 'jump.mp4', sha256: 'abc' }, frameCount: 120,
      elapsedSeconds: 3, modelSha256: 'model-hash' } as Stage1RecordingRun;
    const html = renderToStaticMarkup(<Stage1Results run={run} />);
    expect(html.indexOf('主計算B')).toBeLessThan(html.indexOf('比較A'));
    expect(html).toContain('比較：旧COM方式');
    expect(html).toContain('全元フレーム・実PTS');
    expect(html).toContain('信頼区間でも、真値を含む保証でもありません');
    expect(html).toContain('SHA-256: abc');
  });
});
