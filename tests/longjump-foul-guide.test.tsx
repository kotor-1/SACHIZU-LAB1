import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import FoulGuide from '../src/longjump/FoulGuide';
import { FOUL_HANDLES } from '../src/longjump/FoulSetter';

const html = (left = false) => renderToStaticMarkup(<FoulGuide left={left} />);
const numbers = (s: string, cls: string) => [...s.matchAll(new RegExp(`<polygon class="${cls}" points="([^"]+)"`, 'g'))][0][1].split(/[ ,]/).map(Number);

describe('the foul line sample (2026-10-19: 「見本の画像をください。説明文がわかりにくく設定が意味不明」)', () => {
  it('draws the four points with the tags the magnified picture uses, numbered in the order the taps put them', () => {
    const s = html();
    FOUL_HANDLES.forEach(([h, , tag], i) => { expect(s).toContain(`class="mark ${h}"`); expect(s).toContain(`${'①②③④'[i]}${tag}`); });
    expect(s).toContain('踏切線');
    expect(s).toContain('砂場側の端');
    expect(s).toContain('<details class="foul-guide" open=""');
  });
  it('is mirrored when the athlete runs to the left, its words kept readable', () => {
    const right = numbers(html(), 'board'), left = numbers(html(true), 'board');
    // x, y pairs: each x mirrored over the 300-wide picture, each y the same.
    right.forEach((v, i) => expect(left[i]).toBeCloseTo(i % 2 ? v : 300 - v, 6));
    expect(html()).toContain('助走 →');
    expect(html(true)).toContain('← 助走');
    expect(html(true)).toContain('text-anchor="end"');
  });
  it('words the steps as the ask under the picture does', () => {
    expect(FOUL_HANDLES.map(([, where]) => where)).toEqual(['踏切線の上', '踏切線の上の、線1から離れた所', '白い板の助走路側の端（つま先の真後ろ）', '踏切足の靴の先']);
  });
});
