import { describe, expect, it } from 'vitest';
import { footBoxesForPair, footPoseUsable } from '../src/rebound/foot-boxes';
import { adaptiveFootEdge, brightFootEdge, fitPixelBoundary, type FootBox, type GrayImage, type PixelRow } from '../src/rebound/pixel-foot';

const shoeBox: FootBox = { x: 20, y: 10, width: 60, height: 75 };
function rgbImage(ground: readonly [number, number, number], width = 120, height = 110): GrayImage & { rgba: Uint8ClampedArray } {
  const pixels = new Uint8Array(width * height);
  const rgba = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const d = ((x * 17 + y * 23) % 5) - 2;
    const i = y * width + x;
    const rgb = ground.map(v => v + d) as [number, number, number];
    rgba.set([rgb[0], rgb[1], rgb[2], 255], i * 4);
    pixels[i] = (77 * rgb[0] + 150 * rgb[1] + 29 * rgb[2]) >> 8;
  }
  return { width, height, pixels, rgba };
}
function paint(image: GrayImage & { rgba: Uint8ClampedArray },
  [x0, y0, x1, y1]: readonly [number, number, number, number], rgb: readonly [number, number, number]) {
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const i = y * image.width + x;
    image.rgba.set([rgb[0], rgb[1], rgb[2], 255], i * 4);
    image.pixels[i] = (77 * rgb[0] + 150 * rgb[1] + 29 * rgb[2]) >> 8;
  }
}

function motionRows120(kind: 'takeoff' | 'landing'): PixelRow[] {
  return Array.from({ length: 121 }, (_, frame) => {
    const pts = .5 + frame / 120;
    const air = Math.max(0, (pts - 1) * (kind === 'takeoff' ? 1 : -1));
    const sole = 800 - 500 * air + 600 * air * air;
    return { frame, pts, feet: [0, 1].map(() => ({
      ys: [sole, sole + .2, sole + .4], contrast: 100, reason: null,
    })) as PixelRow['feet'] };
  });
}

describe('pose-localized foot crops', () => {
  it('allows a geometrically continuous heel-confidence dip only with a clear toe', () => {
    const pose = () => Array.from({ length: 33 }, () => ({ x: .5, y: .8, visibility: .95 }));
    const before = pose(), at = pose(), after = pose();
    at[29].visibility = .488;
    at[29].x = .503; at[31].x = .51;
    expect(footPoseUsable(at, before, after, 0)).toBe(true);
    at[29].visibility = .34;
    expect(footPoseUsable(at, before, after, 0)).toBe(false);
    at[29].visibility = .488; at[31].visibility = .79;
    expect(footPoseUsable(at, before, after, 0)).toBe(false);
    at[31].visibility = .95; after[29].visibility = .34;
    expect(footPoseUsable(at, before, after, 0)).toBe(false);
    after[29].visibility = .95; at[29].x = .54;
    expect(footPoseUsable(at, before, after, 0)).toBe(false);
    at[29].visibility = .8;
    expect(footPoseUsable(at, null, null, 0)).toBe(true);
  });

  it('keeps the original search boxes when the feet are at least 52 pixels apart', () => {
    expect(footBoxesForPair([100, 152], [800, 810])).toEqual([
      { x: 74, y: 775, width: 52, height: 90 },
      { x: 126, y: 785, width: 52, height: 90 },
    ]);
    expect(footBoxesForPair([152, 100], [810, 800])).toEqual([
      { x: 126, y: 785, width: 52, height: 90 },
      { x: 74, y: 775, width: 52, height: 90 },
    ]);
  });

  it('splits close feet at the midpoint without using pixels from the other crop', () => {
    for (const [left, right] of [[100, 125], [125, 100]] as const) {
      const boxes = footBoxesForPair([left, right], [800, 800]);
      expect(boxes[0]).not.toBeNull(); expect(boxes[1]).not.toBeNull();
      const first = boxes[0]!, second = boxes[1]!;
      const leftBox = first.x < second.x ? first : second;
      const rightBox = first.x < second.x ? second : first;
      expect(leftBox.x + leftBox.width).toBeCloseTo(112.5);
      expect(rightBox.x).toBeCloseTo(112.5);
      expect(leftBox.width).toBeGreaterThanOrEqual(8);
      expect(rightBox.width).toBeGreaterThanOrEqual(8);
    }
  });

  it('leaves nearly coincident feet unresolved and allows one visible foot', () => {
    expect(footBoxesForPair([100, 111], [800, 800])).toEqual([null, null]);
    expect(footBoxesForPair([100, 112], [800, 800]).every(Boolean)).toBe(true);
    expect(footBoxesForPair([NaN, 100], [800, 810])).toEqual([
      null, { x: 74, y: 785, width: 52, height: 90 },
    ]);
    expect(footBoxesForPair([100, NaN], [800, 810])).toEqual([
      { x: 74, y: 775, width: 52, height: 90 }, null,
    ]);
  });
});

describe('120 fps motion fitting', () => {
  it.each(['takeoff', 'landing'] as const)('finds a %s change from observed sole positions', kind => {
    const result = fitPixelBoundary(motionRows120(kind), 0, 1.025, kind);
    expect(result.reason).toBeNull();
    expect(result.pts).not.toBeNull();
    expect(Math.abs(result.pts! - 1)).toBeLessThanOrEqual(1 / 120);
  });
});

describe('light footwear on green ground', () => {
  it('extracts both light shoes after nearby pose crops are split', () => {
    const image = rgbImage([55, 160, 60], 160, 160);
    paint(image, [43, 55, 56, 74], [225, 225, 215]);
    paint(image, [68, 55, 81, 74], [225, 225, 215]);
    const boxes = footBoxesForPair([50, 75], [75, 75]);
    expect(boxes[0]).not.toBeNull(); expect(boxes[1]).not.toBeNull();
    expect(adaptiveFootEdge(image, boxes[0]!).ys).toEqual([74, 74, 74]);
    expect(adaptiveFootEdge(image, boxes[1]!).ys).toEqual([74, 74, 74]);
  });

  it('uses RGB to separate a connected pale shoe from similarly bright grass', () => {
    const image = rgbImage([145, 230, 80]);
    paint(image, [31, 24, 59, 49], [210, 210, 205]);
    const grayOnly: GrayImage = { width: image.width, height: image.height, pixels: image.pixels };
    expect(brightFootEdge(grayOnly, shoeBox).ys).toBeNull();
    expect(brightFootEdge(image, shoeBox).ys).toEqual([49, 49, 49]);
    expect(adaptiveFootEdge(image, shoeBox).ys).toEqual([49, 49, 49]);
  });

  it('ignores isolated bright grass artifacts below the shoe', () => {
    const image = rgbImage([55, 160, 60]);
    paint(image, [30, 24, 59, 49], [225, 225, 215]);
    paint(image, [67, 70, 69, 72], [255, 255, 255]);
    expect(adaptiveFootEdge(image, shoeBox).ys).toEqual([49, 49, 49]);
  });

  it('rejects a shoe-colored obstruction joined to the floor and weakly contrasting shoes', () => {
    const joined = rgbImage([55, 160, 60]);
    paint(joined, [30, 24, 59, 49], [225, 225, 215]);
    paint(joined, [43, 50, 54, 84], [225, 225, 215]);
    expect(brightFootEdge(joined, shoeBox).ys).toBeNull();

    const weak = rgbImage([70, 110, 65]);
    paint(weak, [30, 24, 59, 49], [90, 120, 85]);
    expect(adaptiveFootEdge(weak, shoeBox).ys).toBeNull();
  });

  it('retains dark-shoe extraction through the adaptive path', () => {
    const image = rgbImage([160, 160, 160]);
    paint(image, [30, 24, 59, 49], [20, 20, 20]);
    expect(adaptiveFootEdge(image, shoeBox).ys).toEqual([49, 49, 49]);
  });
});
