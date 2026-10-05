import { describe, expect, it, vi } from 'vitest';
vi.mock('onnxruntime-web', () => ({ env: { wasm: {} }, InferenceSession: { create: vi.fn() }, Tensor: class {} }));
import { cropOf, decodePose } from '../src/sprint10/rtm-refine';
import { anglePose, type CrouchFrame, type CrouchPoint } from '../src/sprint10/crouch';

describe('RTMPose refinement (crouch start angles)', () => {
  it('cuts a 3:4 window 1.25 times the pose box around its centre', () => {
    const pose: CrouchPoint[] = [{ x: .4, y: .3 }, { x: .6, y: .3 }, { x: .4, y: .7 }, { x: .6, y: .7 }, { x: .5, y: .5 }];
    const c = cropOf(pose, 1920, 1080)!;
    expect(c.cx).toBeCloseTo(960, 6); expect(c.cy).toBeCloseTo(540, 6);
    // Box 384 x 432 px -> 480 x 540 -> widened to 3:4: 540 tall needs 405 wide, so 480 wide makes it 640 tall.
    expect(c.scale * 192).toBeCloseTo(480, 6); expect(c.scale * 256).toBeCloseTo(640, 6);
    expect(cropOf(pose.slice(0, 3), 1920, 1080)).toBeNull();
  });
  it('turns the SimCC peaks into the picture position of each keypoint, in MediaPipe indices', () => {
    const K = 26, NX = 384, NY = 512, x = new Float32Array(K * NX), y = new Float32Array(K * NY);
    // Halpe 13 (left knee) at input (100, 50) with score 0.8; Halpe 20 (left big toe) at (10, 240).
    x[13 * NX + 200] = .8; y[13 * NY + 100] = .9; x[20 * NX + 20] = .7; y[20 * NY + 480] = .6;
    const crop = { cx: 1000, cy: 500, scale: 2 }, pose = decodePose(x, y, crop, 2000, 1000);
    expect(pose).toHaveLength(33);
    expect(pose[25].x * 2000).toBeCloseTo(1000 + (100 - 96) * 2, 6); expect(pose[25].y * 1000).toBeCloseTo(500 + (50 - 128) * 2, 6);
    expect(pose[25].visibility).toBeCloseTo(.8, 6);
    expect(pose[31].x * 2000).toBeCloseTo(1000 + (10 - 96) * 2, 6); expect(pose[31].y * 1000).toBeCloseTo(500 + (240 - 128) * 2, 6);
    expect(pose[1].visibility).toBe(0);   // no Halpe point: not used
  });
  it('uses the refined pose for the angles when there is one', () => {
    const frames: CrouchFrame[] = [{ frame: 0, pts: 0, pose: [{ x: .1, y: .1 }], refined: [{ x: .2, y: .2 }] }, { frame: 1, pts: 0, pose: [{ x: .1, y: .1 }] }];
    expect(anglePose(frames[0])![0].x).toBe(.2); expect(anglePose(frames[1])![0].x).toBe(.1);
  });
});
