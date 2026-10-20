import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import FoulSetter, { FOUL_HANDLES, SPAN, nextToPlace } from '../src/longjump/FoulSetter';
import type { FoulHandle, FoulPoints } from '../src/longjump/foul';

// IMG_0558's toe-off frame (dev-validation/longjump-pick/moments.json), in parts of a 1080 x 1920 picture.
const W = 1080, H = 1920;
const points: FoulPoints = { lineA: { x: 588.9 / W, y: 1330 / H }, lineB: { x: 739.8 / W, y: 1440 / H }, back: { x: 711.4 / W, y: 1373 / H }, toe: { x: 635 / W, y: 1373.1 / H } };
const still = { image: 'data:,', width: W, height: H, frame: 31, at: 0 } as unknown as Parameters<typeof FoulSetter>[0]['still'];
const html = (placed: FoulHandle[]) => renderToStaticMarkup(<FoulSetter still={still} points={points} placed={new Set(placed)} leg={225} onChange={() => undefined} />);

describe('the foul line points on a phone (2026-10-19: the fourth tap fell on the first point and put nothing)', () => {
  it('shows the points already put as marks that take no tap while one is still to be put, and as buttons once all are put', () => {
    const three = html(['lineA', 'lineB', 'back']);
    expect(three).toContain('foul-view is-placing');
    expect(three.match(/foul-mark/g)?.length).toBe(3);
    expect(three).not.toMatch(/<button[^>]*class="longjump-point/);
    const four = html(['lineA', 'lineB', 'back', 'toe']);
    expect(four).not.toContain('is-placing');
    expect(four.match(/<button[^>]*class="longjump-point foul-point/g)?.length).toBe(4);
    expect(four).not.toContain('foul-mark');
  });
  it('says which points are still to be put, and marks them in the row', () => {
    const three = html(['lineA', 'lineB', 'back']);
    expect(three).toContain('あと1点（つま先）');
    expect(three).toContain('置いた点の近くを押しても、次の点が置けます');
    expect(three.match(/data-placed="false"/g)?.length).toBe(1);
    expect(three.match(/data-placed="true"/g)?.length).toBe(3);
    expect(html([])).toContain('あと4点（線1・線2・板の端・つま先）');
  });
  it('puts the result right under the magnified picture once all four are put (+4 cm on IMG_0558)', () => {
    const four = html(['lineA', 'lineB', 'back', 'toe']);
    expect(four).toContain('約4cm越えています（ファール）');
    expect(four.indexOf('foul-result')).toBeLessThan(four.indexOf('foul-ask'));
    expect(four.indexOf('foul-result')).toBeLessThan(four.indexOf('longjump-nudge'));
    expect(html(['lineA', 'lineB', 'back'])).not.toContain('foul-result');
  });
  it('goes on to the next point not put yet, round the end, and stays when all are put', () => {
    const order = FOUL_HANDLES.map(([h]) => h);
    expect(order).toEqual(['lineA', 'lineB', 'back', 'toe']);
    expect(nextToPlace(new Set(['lineA']), 'lineA')).toBe('lineB');
    expect(nextToPlace(new Set(['lineA', 'lineB', 'back']), 'back')).toBe('toe');
    // 線1 put again after the others: the toe is still to be put.
    expect(nextToPlace(new Set(['lineA', 'lineB', 'back']), 'lineA')).toBe('toe');
    expect(nextToPlace(new Set(['lineA', 'lineB', 'toe']), 'toe')).toBe('back');
    expect(nextToPlace(new Set(order), 'toe')).toBe('toe');
  });
  it('magnifies closer by default: 1.6 leg lengths, about one screen pixel per picture pixel on a phone', () => {
    expect(SPAN).toBe(1.6);
    // leg 225 px: a 360 px wide part; the 1080 px picture's board (63 px) is 58 px in a 332 px wide view.
    const crop = html([]).match(/data-crop="([^"]+)"/)![1].split(',').map(Number);
    expect(crop[2]).toBeCloseTo(360, 6);
    expect(crop[3]).toBeCloseTo(270, 6);
  });
});
