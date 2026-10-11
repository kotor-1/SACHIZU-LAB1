import { describe, expect, it, vi } from 'vitest';
import type { CrouchFrame, CrouchPoint } from '../src/sprint10/crouch';
import { CONTACT_COLOR, RELEASE_COLOR, drawForcePose, forcePicture } from '../src/sprint10/force-figure';

const W = 1000, H = 500;
const poseAt = (x: number, y: number): CrouchPoint[] =>
  Array.from({ length: 33 }, () => ({ x, y, visibility: .9 }));
const frameAt = (frame: number, pts: number, pose: CrouchPoint[] | null): CrouchFrame => ({ frame, pts, pose });

describe('the picture for an average force', () => {
  it('keeps the background nearest the time midpoint even if that frame has no skeleton', () => {
    const start = poseAt(.1, .8), end = poseAt(.5, .7);
    const frames = [frameAt(10, 1, start), frameAt(11, 1.08, poseAt(.2, .8)),
      frameAt(12, 1.101, null), frameAt(13, 1.14, poseAt(.4, .8)), frameAt(14, 1.2, end)];
    const anchor = { x: 120, y: 400 };
    const picture = forcePicture(frames, 1, 1.2, W, H, anchor)!;
    expect(picture.frame).toBe(12);
    expect(picture.pts).toBe(1.101);
    expect(picture.startPose).toBe(start);
    expect(picture.endPose).toBe(end);
    expect(picture.start).toEqual({ frame: 10, pts: 1 });
    expect(picture.end).toEqual({ frame: 14, pts: 1.2 });
    expect(picture.origin).toEqual(anchor);
    expect(forcePicture([], 1, 1.2, W, H, anchor)).toBeNull();
  });

  it('honors manually selected endpoint frames and includes all three poses in the crop', () => {
    const start = poseAt(.05, .9), middle = poseAt(.5, .6), end = poseAt(.95, .2);
    const frames = [frameAt(100, 2, poseAt(.2, .7)), frameAt(101, 2.01, start),
      frameAt(110, 2.2, middle), { ...frameAt(119, 2.39, poseAt(.8, .5)), refined: end },
      frameAt(120, 2.4, poseAt(.8, .5))];
    const picture = forcePicture(frames, 2, 2.4, W, H, null, { start: 101, end: 119 })!;
    expect(picture.frame).toBe(110);
    expect(picture.startPose).toBe(start);
    expect(picture.endPose).toBe(end);
    // The separate endpoint photos must use exactly the frame that supplies their skeleton.
    expect(picture.start).toEqual({ frame: 101, pts: 2.01 });
    expect(picture.end).toEqual({ frame: 119, pts: 2.39 });
    // The endpoint outlines must retain their video positions instead of being
    // aligned to the middle pose, and neither outline may be cropped away.
    for (const point of [...start, ...middle, ...end]) expect(picture.bounds).toContain(point);
    expect(Math.min(...picture.bounds.map(p => p.x))).toBe(.05);
    expect(Math.max(...picture.bounds.map(p => p.x))).toBe(.95);
  });

  it('anchors to the corrected middle-frame toe near the plant regardless of left/right labels', () => {
    const original = poseAt(.8, .8), corrected = poseAt(.5, .5);
    corrected[31] = { x: .12, y: .79, visibility: .9 };
    corrected[32] = { x: .1, y: .6, visibility: .9 };
    const middle = { ...frameAt(1, .1, original), refined: corrected };
    const frames = [frameAt(0, 0, poseAt(.1, .8)), middle, frameAt(2, .2, poseAt(.4, .8))];
    const anchor = { x: 100, y: 400 };
    expect(forcePicture(frames, 0, .2, W, H, anchor)!.origin).toEqual({ x: 120, y: 395 });
    [corrected[31], corrected[32]] = [corrected[32], corrected[31]];
    expect(forcePicture(frames, 0, .2, W, H, anchor)!.origin).toEqual({ x: 120, y: 395 });
  });

  it('does not attach the arrow to an unseen toe and retains the plant if both toes are missing', () => {
    const pose = poseAt(.5, .5), anchor = { x: 100, y: 400 };
    pose[31] = { x: .1, y: .8, visibility: .1 };
    pose[32] = { x: .13, y: .78, visibility: .9 };
    const frames = [frameAt(1, .1, pose)];
    expect(forcePicture(frames, 0, .2, W, H, anchor)!.origin).toEqual({ x: 130, y: 390 });
    pose[32].visibility = .1;
    expect(forcePicture(frames, 0, .2, W, H, anchor)!.origin).toEqual(anchor);
    expect(forcePicture(frames, 0, .2, W, H, null)!.origin).toBeNull();
  });
});

describe('the contact and release outlines', () => {
  it('draws two distinct translucent thin outlines without obscuring the force-arrow style', () => {
    const pose = poseAt(.5, .5).map(p => ({ ...p, visibility: 0 }));
    pose[11] = { x: .1, y: .2, visibility: .9 };
    pose[12] = { x: .3, y: .4, visibility: .9 };
    const strokes: { color: string; alpha: number; width: number }[] = [];
    const original = { strokeStyle: '#ffffff', globalAlpha: 1, lineWidth: 10, lineCap: 'butt', lineJoin: 'miter' };
    const ctx = {
      ...original,
      save: vi.fn(), restore: vi.fn(() => Object.assign(ctx, original)),
      beginPath: vi.fn(), moveTo: vi.fn(), lineTo: vi.fn(), arc: vi.fn(), fill: vi.fn(),
      stroke: vi.fn(() => strokes.push({ color: ctx.strokeStyle, alpha: ctx.globalAlpha, width: ctx.lineWidth })),
    };
    const to = (p: { x: number; y: number }) => ({ x: p.x * W + 20, y: p.y * H + 30 });
    for (const color of [CONTACT_COLOR, RELEASE_COLOR]) {
      drawForcePose(ctx as unknown as CanvasRenderingContext2D, pose, to, 10, color);
    }
    expect(strokes).toHaveLength(2);
    expect(new Set(strokes.map(s => s.color)).size).toBe(2);
    for (const stroke of strokes) {
      expect(stroke.alpha).toBeGreaterThan(0);
      expect(stroke.alpha).toBeLessThan(1);
      expect(stroke.width).toBeGreaterThan(0);
      expect(stroke.width).toBeLessThan(original.lineWidth);
    }
    expect(ctx.moveTo).toHaveBeenCalledWith(120, 130);
    expect(ctx.lineTo).toHaveBeenCalledWith(320, 230);
    expect(ctx.arc).not.toHaveBeenCalled();
    expect(ctx.fill).not.toHaveBeenCalled();
    expect(ctx.save).toHaveBeenCalledTimes(2);
    expect(ctx.restore).toHaveBeenCalledTimes(2);
    expect(ctx).toMatchObject(original);
  });
});
