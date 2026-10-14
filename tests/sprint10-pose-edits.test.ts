import { describe, expect, it } from 'vitest';
import { EDITABLE, withPoseEdits } from '../src/sprint10/pose-edits';
import { analyzeCrouchStart, type CrouchFrame, type CrouchPoint } from '../src/sprint10/crouch';
import { applyEdits } from '../src/sprint10/crouch-edit';
import { shankAngle, trunkAngle } from '../src/sprint10/angles';
import { legLength } from '../src/sprint10/contacts';
import { syntheticRun, W, H } from './crouch-synthetic';

const point = (x: number, y: number): CrouchPoint => ({ x, y, visibility: .8 });
const pose = (dx = 0) => Array.from({ length: 33 }, (_, i) => point(.3 + i * .01 + dx, .5));

describe('the skeleton set by hand (pose-edits)', () => {
  it('leaves the frames as they are without edits', () => {
    const frames: CrouchFrame[] = [{ frame: 0, pts: 0, pose: pose(), refined: pose() }];
    expect(withPoseEdits(frames, {})).toBe(frames);
  });

  it('moves the points in the pose the angles use, seen, the other frames and MediaPipe\'s pose as they are', () => {
    const frames: CrouchFrame[] = [{ frame: 0, pts: 0, pose: pose(), refined: pose(.1) }, { frame: 1, pts: .01, pose: pose(), refined: pose(.1) }];
    const out = withPoseEdits(frames, { 1: { 25: { x: .9, y: .9 } } });
    expect(out[0]).toBe(frames[0]);
    expect(out[1].refined![25]).toEqual({ x: .9, y: .9, visibility: 1 });
    expect(out[1].refined![26]).toEqual(frames[1].refined![26]);
    expect(out[1].pose).toBe(frames[1].pose);
    expect(frames[1].refined![25].x).not.toBe(.9);   // the frames given are not changed
  });

  it('makes RTMPose\'s pose of a frame without one in a video with them, else moves MediaPipe\'s', () => {
    const some: CrouchFrame[] = [{ frame: 0, pts: 0, pose: pose(), refined: pose(.1) }, { frame: 1, pts: .01, pose: pose(), refined: null }];
    const a = withPoseEdits(some, { 1: { 27: { x: .7, y: .6 } } });
    expect(a[1].refined![27]).toEqual({ x: .7, y: .6, visibility: 1 }); expect(a[1].refined![26]).toEqual(some[1].pose![26]); expect(a[1].pose).toBe(some[1].pose);
    const none: CrouchFrame[] = [{ frame: 0, pts: 0, pose: pose() }];
    const b = withPoseEdits(none, { 0: { 27: { x: .7, y: .6 } } });
    expect(b[0].pose![27]).toEqual({ x: .7, y: .6, visibility: 1 }); expect(b[0].refined).toBeUndefined();
  });

  it('lets the shoulders, hips, knees and ankles be moved, not the toes and heels', () => {
    expect([...EDITABLE]).toEqual([11, 12, 23, 24, 25, 26, 27, 28]);
  });
});

describe('the crouch start with a skeleton set by hand', () => {
  const frames = syntheticRun(), auto = analyzeCrouchStart(frames, { width: W, height: H }), leg = legLength(frames.filter(f => f.pose), W, H);

  it('takes the touchdown\'s shank again from the knee moved, and nothing else', () => {
    const td = auto.contacts[1].touchdownFrame!, side = auto.steps[1].side!, f = frames.find(q => q.frame === td)!;
    const knee = f.refined![25 + side], moved = { x: knee.x + 30 / W, y: knee.y };
    const edited = withPoseEdits(frames, { [td]: { [25 + side]: moved } }), r = applyEdits(auto, {}, edited, W, H, new Set([td]));
    const expected = shankAngle(edited.find(q => q.frame === td)!.refined!, side, W, H, auto.direction)!;
    expect(r.steps[1].shankAngle).toBeCloseTo(expected, 6);
    expect(r.steps[1].shankAngle).not.toBeCloseTo(auto.steps[1].shankAngle!, 0);
    expect(r.steps[0].shankAngle).toBe(auto.steps[0].shankAngle);
    expect(r.contacts).toEqual(auto.contacts);   // the times are the moments', not the skeleton's
  });

  it('takes the set\'s posture from its frame alone when that frame\'s skeleton was set (as its picture shows)', () => {
    const at = auto.set!.frame, f = frames.find(q => q.frame === at)!;
    const up = (k: number) => ({ x: f.refined![k].x - 30 / W, y: f.refined![k].y - 20 / H });
    const edited = withPoseEdits(frames, { [at]: { 11: up(11), 12: up(12) } }), r = applyEdits(auto, {}, edited, W, H, new Set([at]));
    expect(r.set!.frame).toBe(at);
    expect(r.set!.trunkAngle).toBeCloseTo(trunkAngle(edited.find(q => q.frame === at)!.refined!, W, H, auto.direction, leg)!, 6);
    expect(r.set!.trunkAngle).not.toBeCloseTo(auto.set!.trunkAngle!, 0);
  });

  it('is the automatic result again without edits', () => {
    expect(applyEdits(auto, {}, frames, W, H, new Set())).toBe(auto);
  });
});

describe('pictures that let the skeleton be set by hand', () => {
  it('offer 「骨格を直す」 under each picture, and for one set by hand say so and offer 「自動に戻す」', async () => {
    const { renderToStaticMarkup } = await import('react-dom/server');
    const { createElement } = await import('react');
    const { PhaseFigures } = await import('../src/sprint10/CrouchViews');
    const frames = syntheticRun(), phases = [{ key: 'a', label: '1歩目の接地', frame: 180, pts: .75, marks: [] }, { key: 'b', label: '2歩目の接地', frame: 236, pts: .98, marks: [] }];
    const editing = { edited: new Set([236]), onSet: () => {}, onReset: () => {} };
    const html = renderToStaticMarkup(createElement(PhaseFigures, { url: 'blob:x', frames, phases, onShow: () => {}, editing }));
    expect(html.match(/骨格を直す<\/button>/g)).toHaveLength(2);
    expect(html.match(/✎ 骨格を手で直したコマ/g)).toHaveLength(1);
    expect(html).toContain('aria-label="2歩目の接地の骨格を自動に戻す"');
    const plain = renderToStaticMarkup(createElement(PhaseFigures, { url: 'blob:x', frames, phases, onShow: () => {} }));
    expect(plain).not.toContain('骨格を直す');
  });

  it('name the angles the automatic skeleton had and the one set by hand has not (the trunk whichever way it leans, a leg on either side)', async () => {
    const { lostMarks } = await import('../src/sprint10/CrouchViews');
    const auto = [{ kind: 'trunk' as const, label: '体幹の後傾', value: 1 }, { kind: 'knee' as const, side: 1 as const, label: '支持脚の膝', value: 136 }];
    expect(lostMarks(auto, [{ kind: 'trunk', label: '体幹の前傾', value: 13 }]).map(m => m.label)).toEqual(['支持脚の膝']);
    expect(lostMarks(auto, [{ kind: 'trunk', label: '体幹の後傾', value: 2 }, { kind: 'knee', side: 0, label: '支持脚の膝', value: 150 }])).toEqual([]);
    expect(lostMarks(undefined, [])).toEqual([]);
  });
});
