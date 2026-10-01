import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import Sprint10Lab from '../src/sprint10/Sprint10Lab';
import StrideResults from '../src/sprint10/StrideResults';
import { analyzeSprint, sprintSample, stepCandidates, strideIntervals, type SprintSample, type Point } from '../src/sprint10/analysis';
import { SprintTracker } from '../src/sprint10/tracker';

const synthetic = (fps = 240): SprintSample[] => Array.from({ length: 3 * fps + 1 }, (_, i) => {
  const pts = i / fps, gap = .03 + .25 * Math.abs(Math.cos(4 * Math.PI * pts));
  return { frame: i, pts, hipX: .05 + .3 * pts, ankleGap: gap, kneeGap: gap * .5, legLength: .3 };
});
const pose = (x: number): Point[] => Array.from({ length: 33 }, (_, i) => ({ x: x + (i % 2 ? -.02 : .02), y: .4 + i * .01, visibility: .95 }));
describe('10m sprint experiment', () => {
  it('calculates time, overlap cycles and per-step metrics without any manual input', () => {
    const r = analyzeSprint(synthetic(), .2, .8);
    expect(r.reason).toBeNull(); expect(r.duration).toBeCloseTo(2); expect(r.speed).toBeCloseTo(5);
    // Overlaps every .25 s: 7 whole cycles inside plus half a cycle at each gate.
    expect(r.count).toBeCloseTo(8, 9); expect(r.edgeFractions![0]).toBeCloseTo(.5, 9); expect(r.edgeFractions![1]).toBeCloseTo(.5, 9);
    expect(r.cadence).toBeCloseTo(4); expect(r.stride).toBeCloseTo(1.25);
    expect(r.steps).toHaveLength(8); expect(r.steps[0]).not.toHaveProperty('foot');
  });
  it('counts the partial cycle at BOTH gates the same way, including running right-to-left', () => {
    const at = (t: number) => .05 + .3 * t;
    const r = analyzeSprint(synthetic(), at(.55), at(2.45));
    expect(r.duration).toBeCloseTo(1.9); expect(r.edgeFractions![0]).toBeCloseTo(.3, 6); expect(r.edgeFractions![1]).toBeCloseTo(.3, 6);
    expect(r.count).toBeCloseTo(7.6, 6); expect(r.cadence).toBeCloseTo(4, 6);
    const reverse = analyzeSprint(synthetic().map(s => ({ ...s, hipX: 1 - s.hipX! })), 1 - at(.55), 1 - at(2.45));
    expect(reverse.count).toBeCloseTo(r.count!, 9);
  });
  it('uses the median cycle for an edge whose neighbouring overlap was not filmed', () => {
    const r = analyzeSprint(synthetic().filter(s => s.pts <= 2.55), .2, .05 + .3 * 2.45);
    expect(r.reason).toBeNull(); expect(r.edgeFractions![1]).toBeCloseTo(.3, 2);
    expect(r.count).toBeCloseTo(7.8, 2);
  });
  it('does not count a 1-2 frame ankle-label glitch as a step', () => {
    // Pose estimation can place both ankles on one leg for a frame or two while the legs are split.
    const clean = synthetic(120), glitch = clean.map(s => s.pts > .995 && s.pts < 1.012 ? { ...s, ankleGap: .02, kneeGap: .01 } : s);
    expect(glitch.filter(s => s.ankleGap === .02)).toHaveLength(2);
    expect(stepCandidates(glitch).events.map(e => e.pts)).toEqual(stepCandidates(clean).events.map(e => e.pts));
    expect(analyzeSprint(glitch, .2, .8).count).toBeCloseTo(analyzeSprint(clean, .2, .8).count!, 9);
  });
  it('treats standing sway on the start line as one start: the last time the pelvis was on or behind it', () => {
    // Pelvis sways +-.006 around the start line for 1 s, then runs.
    const sway = synthetic().map(s => ({ ...s, hipX: s.pts < 1 ? .2 + .006 * Math.sin(2 * Math.PI * 3 * s.pts) : .2 + .4 * (s.pts - 1) }));
    const r = analyzeSprint(sway, .2, .8);
    expect(r.reason).toBeNull();
    expect(r.start!.pts).toBeGreaterThan(.95); expect(r.start!.pts).toBeLessThanOrEqual(1.0001);
    expect(r.duration).toBeCloseTo(1.5, 1);
  });
  it('analyses a run after the athlete walked back to the start and warns about a second run', () => {
    const walk = synthetic().map(s => ({ ...s, hipX: s.pts < .5 ? .3 - .3 * s.pts : .15 + .3 * (s.pts - .5) }));
    const r = analyzeSprint(walk, .2, .8);
    expect(r.reason).toBeNull(); expect(r.start!.pts).toBeCloseTo(.5 + .05 / .3, 3);
    const twice = [...synthetic(), ...synthetic().map(s => ({ ...s, frame: s.frame + 1000, pts: s.pts + 10 }))];
    const t = analyzeSprint(twice, .2, .8);
    expect(t.duration).toBeCloseTo(2); expect(t.warnings[0]).toContain('最初の走り');
  });
  it('explains a start line placed in front of where the athlete already stands', () => {
    const r = analyzeSprint(synthetic().filter(s => s.pts > .6), .2, .8);
    expect(r.reason).toContain('スタートラインより後ろにいる選手を確認できません');
  });
  it('counts one missed overlap (a cycle about twice the usual) as two steps and leaves its distance blank', () => {
    const missed = synthetic(120).map(s => Math.abs(s.pts - 1.375) < .07 ? { ...s, ankleGap: .2, kneeGap: .1 } : s);
    const clean = analyzeSprint(synthetic(120), .2, .8), r = analyzeSprint(missed, .2, .8);
    expect(r.steps.length).toBe(clean.steps.length - 1);
    expect(r.count).toBeCloseTo(clean.count!, 6);
    expect(r.warnings[0]).toContain('2歩分');
    expect(r.strideIntervals.some(s => s.reason === '入れ替わりの見逃しで2歩分の区間です' && s.distanceM === null)).toBe(true);
  });
  it('counts a cycle up to 1.5x the median as one, about 1.7x as two, and withholds the band between', () => {
    // Overlaps every 30 frames (0.25 s at 120 fps) except one longer cycle after 1.375 s.
    const gait = (longFrames: number) => {
      const overlaps: number[] = [];
      for (let f = 15; f <= 165; f += 30) overlaps.push(f);
      for (let f = 165 + longFrames; f <= 400; f += 30) overlaps.push(f);
      return Array.from({ length: 361 }, (_, i) => {
        const k = overlaps.filter(o => o <= i).length - 1, a = overlaps[k] ?? overlaps[0] - 30, b = overlaps[k + 1] ?? a + 30;
        const gap = .03 + .25 * Math.sin(Math.PI * (i - a) / (b - a));
        return { frame: i, pts: i / 120, hipX: .05 + .3 * i / 120, ankleGap: gap, kneeGap: gap * .5, legLength: .3 };
      });
    };
    const single = analyzeSprint(gait(43), .2, .8);           // 1.43x: easing off, one cycle
    // Start .5 is half a cycle before .625; the finish 2.5 is 2 frames after the overlap at frame 298.
    expect(single.count).toBeCloseTo(.5 + 7 + (2.5 - 298 / 120) / .25, 6);
    expect(single.warnings[0]).not.toContain('2歩分');
    expect(analyzeSprint(gait(47), .2, .8).count).toBeNull(); // 1.57x: ambiguous
    const double = analyzeSprint(gait(52), .2, .8);            // 1.73x: one missed overlap
    expect(double.count).not.toBeNull(); expect(double.warnings[0]).toContain('2歩分');
  });
  it('detects the first leg crossing out of a standing stance narrower than a running stride', () => {
    // Stance gap 0.45 (scaled by leg length) lies between the closed (0.28) and open (0.51) levels;
    // the legs first close at 0.625 s, just after the start line at 0.5 s.
    const standing = synthetic(120).map(s => s.pts < .5905 ? { ...s, ankleGap: .135, kneeGap: .0675 } : s);
    const r = analyzeSprint(standing, .2, .8);
    // Within one frame: the stance flattens one side of the smoothed minimum.
    expect(Math.abs(r.steps[0].pts - .625)).toBeLessThanOrEqual(1 / 120 + 1e-9);
    expect(Math.abs(r.count! - 8)).toBeLessThanOrEqual(1 / 120 / .25 + 1e-9);
  });
  it('scales speed, stride and per-step distances by the real gate distance', () => {
    const ten = analyzeSprint(synthetic(), .2, .8), section = analyzeSprint(synthetic(), .2, .8, 6.5);
    expect(section.duration).toBe(ten.duration); expect(section.count).toBe(ten.count); expect(section.cadence).toBe(ten.cadence);
    expect(section.speed).toBeCloseTo(6.5 / 2, 9); expect(section.stride).toBeCloseTo(6.5 / ten.count!, 9);
    section.strideIntervals.forEach((s, i) => expect(s.distanceM!).toBeCloseTo(ten.strideIntervals[i].distanceM! * .65, 9));
    expect(section.warnings.join('')).not.toContain('10mのライン間隔');
  });
  it('uses measured displacements between equal gait phases, with N-1 complete intervals', () => {
    const r = analyzeSprint(synthetic(), .2, .8);
    expect(r.strideIntervals).toHaveLength(r.steps.length - 1);
    for (const interval of r.strideIntervals) expect(interval.distanceM).toBeCloseTo(1.25);
    expect(r.strideIntervals[0].fromPts).toBe(r.steps[0].pts);
    const changing = synthetic().map(s => ({ ...s, hipX: .05 + .1 * s.pts + .066 * s.pts ** 2 }));
    const varied = analyzeSprint(changing, .2, .8).strideIntervals;
    expect(varied.length).toBeGreaterThan(2);
    expect(varied.at(-1)!.distanceM!).toBeGreaterThan(varied[0].distanceM! + .1);
    for (const interval of varied) expect(interval.distanceM).toBeCloseTo(10 * (interval.toHipX! - interval.fromHipX!) / .6);
  });
  it('withholds individual distances with missing endpoint positions', () => {
    const s = synthetic().map(s => Math.abs(s.pts - .875) < .01 ? { ...s, hipX: null } : s);
    const r = analyzeSprint(s, .2, .8);
    expect(r.strideIntervals[0].distanceM).toBeNull(); expect(r.strideIntervals[1].distanceM).toBeNull();
    expect(r.strideIntervals[2].distanceM).toBeCloseTo(1.25);
  });
  it('preserves positive per-cycle distances when running right-to-left', () => {
    const a = analyzeSprint(synthetic(), .2, .8);
    const b = analyzeSprint(synthetic().map(s => ({ ...s, hipX: 1 - s.hipX! })), .8, .2);
    b.strideIntervals.forEach((s, i) => expect(s.distanceM).toBeCloseTo(a.strideIntervals[i].distanceM!));
  });
  it('renders individual distances and explicit partial interval caveats', () => {
    const r = analyzeSprint(synthetic(), .2, .8);
    const html = renderToStaticMarkup(<StrideResults intervals={r.strideIntervals} seek={() => {}} />);
    expect(html).toContain('1.25 m'); expect(html).toContain('始点を見る'); expect(html).toContain('部分区間');
  });
  it('supports right-to-left running', () => {
    const r = analyzeSprint(synthetic().map(s => ({ ...s, hipX: 1 - s.hipX! })), .8, .2);
    expect(r.duration).toBeCloseTo(2); expect(r.count).toBe(8);
  });
  it('is invariant to swapping hip, knee and ankle labels', () => {
    const original = pose(.5), swapped = [...original];
    for (const [a, b] of [[23, 24], [25, 26], [27, 28]]) [swapped[a], swapped[b]] = [swapped[b], swapped[a]];
    expect(sprintSample(original, 0, 0, 16 / 9)).toEqual(sprintSample(swapped, 0, 0, 16 / 9));
  });
  it('does not fabricate unseen crossings or bridge a long timing gap', () => {
    expect(analyzeSprint(synthetic().filter(s => s.pts > .6), .2, .8).duration).toBeNull();
    expect(analyzeSprint(synthetic().filter(s => s.pts < .45 || s.pts > .55), .2, .8).duration).toBeNull();
    expect(analyzeSprint(synthetic().filter(s => s.pts < 2.4), .2, .8).duration).toBeNull();
  });
  it.each([.5, 1, 2, 2.5])('accepts an exact 50 ms observation interval beginning at %s seconds', a => {
    const b = a + .05;
    const samples = synthetic(60).map(s => s.pts > a + 1e-9 && s.pts < b - 1e-9
      ? { ...s, hipX: null, ankleGap: null, kneeGap: null, legLength: null } : s);
    const baseline = analyzeSprint(synthetic(60), .2, .8);
    const result = analyzeSprint(samples, .2, .8);
    expect(result.reason).toBeNull(); expect(result.duration).toBeCloseTo(2); expect(result.count).toBe(baseline.count);
    expect(result.strideIntervals).toEqual(baseline.strideIntervals);
    // Changing the timestamp origin must not change a 50 ms acceptance decision.
    const shifted = analyzeSprint(samples.map(s => ({ ...s, pts: s.pts + 10 })), .2, .8);
    expect(shifted.reason).toBeNull(); expect(shifted.duration).toBeCloseTo(2); expect(shifted.count).toBe(result.count);
  });
  it.each([.5, 1, 2.5])('still rejects a 50.001 ms observation interval beginning at %s seconds', a => {
    const b = a + .05;
    const samples = synthetic(60).map(s => {
      if (s.pts > a + 1e-9 && s.pts < b - 1e-9) return { ...s, hipX: null, ankleGap: null, kneeGap: null, legLength: null };
      return Math.abs(s.pts - b) < 1e-9 ? { ...s, pts: s.pts + .000001 } : s;
    });
    const result = analyzeSprint(samples, .2, .8);
    if (a === 1) {
      expect(result.duration).toBeCloseTo(2); expect(result.count).toBeNull();
      expect(result.strideIntervals.some(s => s.reason === 'この区間の追跡が途切れています')).toBe(true);
    } else expect(result.duration).toBeNull();
  });
  it('accepts exactly 50 ms frame spacing for crossing timing at 20 fps', () => {
    const result = analyzeSprint(synthetic(20), .2, .8);
    expect(result.reason).toBeNull(); expect(result.duration).toBeCloseTo(2);
    expect(stepCandidates(synthetic(20)).gaps).toEqual([]);
  });
  it.each([.12, .65])('accepts the exact %s second cycle boundary without expanding its limit', period => {
    const from = .55;
    const evaluate = (dt: number) => {
      const samples = Array.from({ length: 41 }, (_, i) => ({ frame: i, pts: from + dt * i / 40,
        hipX: .3 + .1 * i / 40, ankleGap: .1, kneeGap: .05, legLength: .3 }));
      return strideIntervals(samples, [{ frame: 0, pts: from }, { frame: 40, pts: from + dt }], .2, .8, .5, 2)[0];
    };
    expect(evaluate(period).distanceM).toBeCloseTo(10 / 6);
    expect(evaluate(period + (period === .12 ? -.000001 : .000001)).reason).toBe('入れ替わり周期を確認できません');
  });
  it('keeps exact 120 ms candidates while suppressing genuinely shorter intervals', () => {
    const events = (period: number, offset = 0) => stepCandidates(Array.from({ length: 121 }, (_, frame) => {
      const phase = frame % 12, gap = phase >= 3 && phase <= 5 ? .03 : .28;
      return { frame, pts: frame / 100 * (period / .12) + offset,
        hipX: .5, ankleGap: gap, kneeGap: gap * .5, legLength: .3 };
    })).events;
    expect(events(.12)).toHaveLength(10); expect(events(.12, 10)).toHaveLength(10);
    expect(events(.119999)).toHaveLength(5);
  });
  it('accepts 650 ms overlap cycles but still withholds counts for longer cycles', () => {
    const evaluate = (period: number) => analyzeSprint(synthetic().map(s => {
      const gap = .03 + .25 * Math.abs(Math.cos(Math.PI * s.pts / period));
      return { ...s, ankleGap: gap, kneeGap: gap * .5 };
    }), .2, .8);
    expect(evaluate(.65).count).toBeCloseTo(2 / .65, 9);
    const tooLong = evaluate(.75);
    expect(tooLong.duration).toBeCloseTo(2); expect(tooLong.count).toBeNull();
    expect(tooLong.strideIntervals.every(s => s.reason === '入れ替わり周期を確認できません')).toBe(true);
  });
  it('keeps gait measurements invariant to stationary padding before or after the run', () => {
    const core = synthetic(60).map(s => ({ ...s, pts: s.pts + 10, frame: s.frame + 600 }));
    const before = Array.from({ length: 600 }, (_, frame) => ({ frame, pts: frame / 60,
      hipX: .05, ankleGap: .015, kneeGap: .0075, legLength: .2 }));
    const after = Array.from({ length: 1019 }, (_, i) => ({ frame: 781 + i, pts: (781 + i) / 60,
      hipX: .95, ankleGap: .015, kneeGap: .0075, legLength: .4 }));
    // 30 s / 1800 frames remains inside the recorder's supported limits.
    for (const reverse of [false, true]) {
      const direction = (s: SprintSample) => reverse ? { ...s, hipX: 1 - s.hipX! } : s;
      const start = reverse ? .8 : .2, finish = reverse ? .2 : .8;
      const baseline = analyzeSprint(core.map(direction), start, finish);
      expect(baseline.count).toBeCloseTo(8, 9); expect(baseline.duration).toBeCloseTo(2);
      for (const padded of [[...before, ...core], [...core, ...after], [...before, ...core, ...after]]) {
        expect(analyzeSprint(padded.map(direction), start, finish)).toEqual(baseline);
      }
    }
  });
  it('retains opening observations outside the gates for overlaps just inside both boundaries', () => {
    const samples = synthetic();
    const result = analyzeSprint(samples, .05 + .3 * .6, .05 + .3 * 2.39);
    expect(result.reason).toBeNull(); expect(result.count).toBeCloseTo(7.16, 6);
    expect(result.steps[0].pts).toBeCloseTo(.625, 2);
    expect(result.steps.at(-1)!.pts).toBeCloseTo(2.375, 2);
    expect(result.strideIntervals).toHaveLength(7);
  });
  it('withholds gait metrics after a tracking dropout, while keeping time', () => {
    const r = analyzeSprint(synthetic().map(s => s.pts > 1 && s.pts < 1.2 ? { ...s, ankleGap: null, kneeGap: null } : s), .2, .8);
    expect(r.duration).toBeCloseTo(2); expect(r.count).toBeNull(); expect(r.stride).toBeNull();
  });
  it('rejects stationary noise, missing legs and non-monotonic timestamps', () => {
    expect(stepCandidates(synthetic().map(s => ({ ...s, ankleGap: .005 }))).events).toEqual([]);
    expect(stepCandidates(synthetic().map(s => ({ ...s, legLength: null }))).events).toEqual([]);
    expect(analyzeSprint([...synthetic(), synthetic()[0]], .2, .8).duration).toBeNull();
  });
  it('does not change subject through ambiguity or a long loss', () => {
    const t = new SprintTracker(.2);
    expect(t.choose([pose(.19), pose(.21)], 0)).toEqual([]);
    expect(t.choose([pose(.2)], .01)).toEqual([]);
    expect(t.choose([pose(.21)], .02)).toEqual([]);
    expect(t.choose([pose(.22)], .03)).toHaveLength(33);
    expect(t.choose([pose(.23)], .5)).toEqual([]);
  });
  it('renders upload, playback, gates and analyze, with no first-step or foot input', () => {
    const html = renderToStaticMarkup(<Sprint10Lab />);
    expect(html).not.toContain('type="radio"'); expect(html).not.toContain('左足から'); expect(html).not.toContain('1歩目');
    expect(html).toContain('3　解析する'); expect(html).toContain('解析v8'); expect(html).toContain('aria-label="10mの動画を選ぶ"');
    expect(html).toContain('この2本のラインで決定'); expect(html).toContain('解析する'); expect(html).toContain('<video');
    expect(html).toContain('スタート10m'); expect(html).toContain('最高速度区間');
  });
});
