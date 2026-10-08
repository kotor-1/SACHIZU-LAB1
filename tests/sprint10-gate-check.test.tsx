import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { analyzeSprint, sprintSample, type SprintSample } from '../src/sprint10/analysis';
import type { CrouchFrame } from '../src/sprint10/crouch';
import { crossingFrame, gateMoments, gateShifts, legPixels, pelvisAt } from '../src/sprint10/gate-check';
import type { ReviewMoment } from '../src/sprint10/moment-edits';
import { MomentReview } from '../src/sprint10/MomentReview';

/** A run at 0.3 picture widths a second, its legs crossing every 0.25 s, analysed at `fps` (the video at `video` fps). */
const run = (fps = 120, video = 240) => {
  const samples: SprintSample[] = Array.from({ length: 3 * fps + 1 }, (_, i) => {
    const pts = i / fps, gap = .03 + .25 * Math.abs(Math.cos(4 * Math.PI * pts));
    return { frame: i * video / fps, pts, hipX: .05 + .3 * pts, hipY: .55, ankleGap: gap, kneeGap: gap * .5, legLength: .3 };
  });
  const frames: CrouchFrame[] = Array.from({ length: 3 * video + 1 }, (_, i) => ({ frame: i, pts: i / video, pose: null }));
  return { samples, frames };
};
const LABELS = { start: 'スタート', finish: 'ゴール' }, COLORS = { start: '#68ffbf', finish: '#ffc460' };

describe('10 m: the gate crossings checked and set by hand', () => {
  it('moves a crossing by the time given and measures everything from it, the leg overlaps found as judged', () => {
    const { samples } = run(), auto = analyzeSprint(samples, .2, .8);
    const r = analyzeSprint(samples, .2, .8, 10, 'standing', { start: 2 / 240, finish: -1 / 240 });
    expect(r.reason).toBeNull();
    expect(r.start!.pts - auto.start!.pts).toBeCloseTo(2 / 240, 12); expect(r.finish!.pts - auto.finish!.pts).toBeCloseTo(-1 / 240, 12);
    expect(r.start!.movedSeconds).toBeCloseTo(2 / 240, 12); expect(auto.start!.movedSeconds).toBeUndefined();
    expect(r.duration! - auto.duration!).toBeCloseTo(-3 / 240, 12);
    expect(r.speed).toBeCloseTo(10 / r.duration!, 12);
    // The same overlaps; only the part of a cycle at each gate changes (0.25 s a cycle).
    expect(r.steps.map(s => s.pts)).toEqual(auto.steps.map(s => s.pts));
    expect(r.count! - auto.count!).toBeCloseTo(-3 / 240 / .25, 2);
    // Nothing moved: the judged result itself.
    expect(analyzeSprint(samples, .2, .8, 10, 'standing', {})).toEqual(auto);
  });
  it('refuses crossings set in the wrong order', () => {
    const { samples } = run(), auto = analyzeSprint(samples, .2, .8);
    const r = analyzeSprint(samples, .2, .8, 10, 'standing', { start: auto.duration! + .01 });
    expect(r.reason).toContain('順番が逆'); expect(r.duration).toBeNull();
  });
  it('drops the note of a crossing estimated out of view once the user set it', () => {
    // A flying run whose pelvis crosses the entry .2 at 0.5 s unseen (hidden for 50 ms after it).
    const samples = run().samples.map(s => s.pts > .45 && s.pts < .55 ? { ...s, hipX: null, hipY: null, ankleGap: null, kneeGap: null, legLength: null } : s);
    const auto = analyzeSprint(samples, .2, .8, 10, 'flying');
    expect(auto.start!.extendedSeconds).toBeGreaterThan(0); expect(auto.warnings.some(w => w.includes('入口の線を越える瞬間'))).toBe(true);
    const r = analyzeSprint(samples, .2, .8, 10, 'flying', { start: -1 / 240 });
    expect(r.start!.extendedSeconds).toBe(auto.start!.extendedSeconds); expect(r.duration! - auto.duration!).toBeCloseTo(1 / 240, 12);
    expect(r.warnings.some(w => w.includes('入口の線を越える瞬間'))).toBe(false);
  });
  it('takes the first frame at or after a crossing, among every frame of the video', () => {
    const { frames } = run();
    expect(crossingFrame(frames, 1.0021)).toBe(241); expect(crossingFrame(frames, 241 / 240)).toBe(241);
    expect(crossingFrame(frames, 99)).toBe(720);
  });
  it('gives the pelvis in frames not analysed from the samples round them, and none across a gap', () => {
    const { samples } = run(), gap = 2.5 / 120;
    expect(pelvisAt(samples, 1 / 240, gap)!.x).toBeCloseTo(.05 + .3 / 240, 12);
    expect(pelvisAt(samples, 1 / 120, gap)).toEqual({ x: samples[1].hipX, y: .55 });
    const holed = samples.map((s, i) => i >= 10 && i < 14 ? { ...s, hipX: null } : s);
    expect(pelvisAt(holed, 11 / 120, gap)).toBeNull(); expect(pelvisAt(holed, 13.5 / 120, gap)).toBeNull();
    // A flying runner watched every other sample: between the sightings, also in the samples without the pose.
    const watched = samples.map((s, i) => i % 2 ? { ...s, hipX: null, hipY: null } : s);
    expect(pelvisAt(watched, 1 / 120, gap)!.x).toBeCloseTo(.05 + .3 / 120, 12); expect(pelvisAt(watched, 3 / 240, gap)!.y).toBeCloseTo(.55, 12);
    expect(pelvisAt(samples.map(s => ({ ...s, hipY: undefined })), 1 / 240, gap)!.y).toBeNull();
  });
  it('keeps the pelvis height in each sample', () => {
    const points = Array.from({ length: 33 }, (_, i) => ({ x: .3 + (i % 2 ? .01 : 0), y: .2 + i * .02, visibility: .9 }));
    expect(sprintSample(points, 0, 0, 16 / 9).hipY).toBeCloseTo((points[23].y + points[24].y) / 2, 12);
    expect(sprintSample([], 0, 0, 16 / 9).hipY).toBeNull();
  });
  it('lists both crossings with the frames judged and set, where to look, and what was moved', () => {
    const { samples, frames } = run(), auto = analyzeSprint(samples, .2, .8);
    const list = gateMoments(auto, {}, frames, samples, { start: .2, finish: .8 }, LABELS, COLORS);
    expect(list.map(m => [m.key, m.kind, m.short, m.label, m.flag])).toEqual([
      ['start', 'crossing', 'スタート', 'スタートの線を越える瞬間', null], ['finish', 'crossing', 'ゴール', 'ゴールの線を越える瞬間', null]]);
    expect(list[0].autoFrame).toBe(crossingFrame(frames, auto.start!.pts)); expect(list[0].frame).toBe(list[0].autoFrame);
    expect(list[0].focus).toEqual({ x: .2, y: .55 }); expect(list[1].color).toBe('#ffc460'); expect(list[0].ground).toBeNull();
    expect(gateShifts(list, frames)).toEqual({});
    const set = gateMoments(auto, { finish: list[1].autoFrame - 3 }, frames, samples, { start: .2, finish: .8 }, LABELS, COLORS);
    expect(set[1].frame).toBe(list[1].autoFrame - 3);
    const shifts = gateShifts(set, frames);
    expect(Object.keys(shifts)).toEqual(['finish']); expect(shifts.finish).toBeCloseTo(-3 / 240, 12);
    expect(analyzeSprint(samples, .2, .8, 10, 'standing', shifts).duration! - auto.duration!).toBeCloseTo(-3 / 240, 12);
    // A frame not in the video is not taken.
    expect(gateMoments(auto, { start: 99999 }, frames, samples, { start: .2, finish: .8 }, LABELS, COLORS)[0].frame).toBe(list[0].autoFrame);
    expect(legPixels(samples, 1080)).toBeCloseTo(.3 * 1080, 9);
  });
  it('marks a crossing worth a look: the pose missing round it, or the pelvis going back and forth over the line', () => {
    const { samples, frames } = run(), auto = analyzeSprint(samples, .2, .8);
    const k = samples.findIndex(s => s.pts >= auto.finish!.pts);
    const missing = samples.map((s, i) => i === k + 1 || i === k + 2 ? { ...s, hipX: null } : s);
    expect(gateMoments(analyzeSprint(missing, .2, .8), {}, frames, missing, { start: .2, finish: .8 }, LABELS, COLORS)[1].flag).toContain('骨格が取れていない');
    // One sample at a time without the pose (a flying runner watched every other sample) is not.
    const watched = samples.map((s, i) => i % 2 ? { ...s, hipX: null } : s);
    expect(gateMoments(analyzeSprint(watched, .2, .8), {}, frames, watched, { start: .2, finish: .8 }, LABELS, COLORS).map(m => m.flag)).toEqual([null, null]);
    // Standing sway over the start line (5 a second) up to the run, at 1 s: over it 0.1-0.15 s before the start.
    const sway = samples.map(s => ({ ...s, hipX: s.pts < 1 ? .2 + .006 * Math.sin(2 * Math.PI * 5 * s.pts) : .2 + .4 * (s.pts - 1) }));
    const swayed = gateMoments(analyzeSprint(sway, .2, .8), {}, frames, sway, { start: .2, finish: .8 }, LABELS, COLORS);
    expect(swayed[0].flag).toContain('行き来'); expect(swayed[1].flag).toBeNull();
  });
});

describe('the check view at a gate crossing', () => {
  const frames: CrouchFrame[] = Array.from({ length: 40 }, (_, i) => ({ frame: i, pts: i / 240, pose: null }));
  const crossing: ReviewMoment = { key: 'finish', kind: 'crossing', step: null, label: 'ゴールの線を越える瞬間', short: 'ゴール', frame: 20, pts: 20 / 240,
    autoFrame: 20, focus: { x: .8, y: .55 }, ground: null, flag: null, color: '#ffc460' };
  const view = (m: ReviewMoment, extra = {}) => renderToStaticMarkup(<MomentReview url="blob:x" frames={frames} width={1920} height={1080} list={[m]} edits={{}}
    checked={new Set()} at={m.key} onAt={() => {}} onSet={() => {}} onRevert={() => {}} onRevertAll={() => {}} onDone={() => {}}
    preview={() => []} down={() => true} {...extra} />);
  it('draws the line in its colour and the pelvis, round the pelvis, with words for a crossing', () => {
    const html = view(crossing, { leg: 300, point: () => ({ x: .79, y: .55 }) });
    expect(html).toContain('腰まわり'); expect(html).toContain('stroke="#ffc460"'); expect(html).toContain('fill="#ffd400"');
    expect(html).toContain('縦の線はゴールの線'); expect(html).toContain('（線を越えている）'); expect(html).not.toContain('足元');
    // 2.4 leg lengths (720 px) wide, the pelvis in the middle: the 1920 px picture drawn 2.67 times as wide.
    expect(html).toContain(`width:${(1920 / 720 * 100).toString()}%`);
  });
  it('leaves a foot moment as it was', () => {
    const html = view({ ...crossing, key: 'td1', kind: 'touchdown', short: '踏切接地', label: '踏切の接地', ground: .9, color: undefined });
    expect(html).toContain('足元'); expect(html).toContain('点線は床、▲は足が着く場所。'); expect(html).toContain('（足が着いている）');
    expect(html).not.toContain('腰まわり'); expect(html).not.toContain('fill="#ffd400"');
  });
});
