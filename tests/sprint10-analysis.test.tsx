import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import Sprint10Lab from '../src/sprint10/Sprint10Lab';
import StrideResults from '../src/sprint10/StrideResults';
import { analyzeSprint, continuityLimit, sprintSample, stepCandidates, strideIntervals, type SprintSample, type Point } from '../src/sprint10/analysis';
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
  it('words gate failures for a flying section as entry and exit, never asking for a standing athlete', () => {
    const noEntry = analyzeSprint(synthetic().filter(s => s.pts > .6), .2, .8, 10, 'flying');
    expect(noEntry.reason).toContain('入口の線を越える選手を捉えられませんでした');
    expect(noEntry.reason).not.toMatch(/立ち位置|走り出す前/);
    expect(analyzeSprint(synthetic().filter(s => s.pts < .35 || s.pts > .65), .2, .8, 10, 'flying').reason).toContain('入口の線を越える瞬間');
    expect(analyzeSprint(synthetic().filter(s => s.pts < 2.4), .2, .8, 10, 'flying').reason).toContain('出口の線の通過を確認できません');
    // On clean, steady running both kinds of run measure the same.
    const flying = analyzeSprint(synthetic(), .2, .8, 10, 'flying'), standing = analyzeSprint(synthetic(), .2, .8, 10);
    expect(flying.duration).toBeCloseTo(standing.duration!, 9); expect(flying.count).toBeCloseTo(standing.count!, 6);
    expect(flying.steps).toEqual(standing.steps);
  });
  it('treats gaps up to 2.5 frame intervals as continuous when frames come less often than every 20 ms', () => {
    // 30 frames/s with uneven intervals: every third interval is 57 ms, one of them across each gate.
    const live: SprintSample[] = [];
    for (let pts = 0, i = 0; pts <= 3; i++) {
      const gap = .03 + .25 * Math.abs(Math.cos(4 * Math.PI * pts));
      live.push({ frame: i, pts, hipX: .05 + .3 * pts, ankleGap: gap, kneeGap: gap * .5, legLength: .3 });
      pts += i % 3 === 2 || Math.abs(pts - .48) < .02 || Math.abs(pts - 2.48) < .02 ? .057 : 1 / 30;
    }
    expect(continuityLimit(live)).toBeCloseTo(2.5 / 30, 6);
    for (const run of ['standing', 'flying'] as const) {
      const r = analyzeSprint(live, .2, .8, 10, run);
      expect(r.reason).toBeNull(); expect(r.duration).toBeCloseTo(2, 2);
    }
    // At 120 frames/s the limit stays 50 ms: a 57 ms gap across the start is a gap.
    expect(continuityLimit(synthetic(120))).toBe(.05);
    const gapped = synthetic(120).filter(s => s.pts < .48 || s.pts > .537);
    expect(analyzeSprint(gapped, .2, .8).reason).toContain('スタートラインを越える瞬間');
  });
  it('flying section: estimates a gate crossed out of view by extending the pelvis motion up to 0.1 s, and says so', () => {
    // The pelvis (0.3 widths/s) crosses the entry .2 at 0.5 s and the exit .8 at 2.5 s.
    const hidden = (from: number, to: number) => synthetic().map(s => s.pts > from && s.pts < to
      ? { ...s, hipX: null, ankleGap: null, kneeGap: null, legLength: null } : s);
    const entry = analyzeSprint(hidden(.45, .55), .2, .8, 10, 'flying');     // entry crossing not seen for 50 ms after it
    expect(entry.reason).toBeNull();
    expect(entry.start!.pts).toBeCloseTo(.5, 6); expect(entry.start!.extendedSeconds).toBeCloseTo(.05 - 1 / 240, 2);
    expect(entry.duration).toBeCloseTo(2, 6);
    expect(entry.warnings[0]).toContain('入口の線を越える瞬間の骨盤は映っていない');
    const exit = analyzeSprint(hidden(2.46, 3.1), .2, .8, 10, 'flying');      // the body leaves the picture before the exit
    expect(exit.reason).toBeNull();
    expect(exit.finish!.pts).toBeCloseTo(2.5, 6); expect(exit.warnings[0]).toContain('出口の線を越える瞬間の骨盤は映っていない');
    // Never further than 0.1 s, never outside the video, never for a standing start.
    expect(analyzeSprint(hidden(.35, .65), .2, .8, 10, 'flying').duration).toBeNull();
    expect(analyzeSprint(hidden(2.38, 3.1), .2, .8, 10, 'flying').duration).toBeNull();
    expect(analyzeSprint(synthetic().filter(s => s.pts > .52), .2, .8, 10, 'flying').duration).toBeNull();
    expect(analyzeSprint(hidden(.45, .55), .2, .8).reason).toContain('スタートラインを越える瞬間');
    // An unseen span at the gate is not counted as a tracking dropout of the legs.
    expect(entry.count).toBeCloseTo(analyzeSprint(synthetic(), .2, .8, 10, 'flying').count!, 1);
  });
  it('flying section: a one-frame pose error at a gate does not move its time', () => {
    // Recorded: the pelvis read 0.528 for one frame, 0.025 behind its path, just after crossing the entry 0.53.
    const glitch = (at: number, dx: number) => synthetic(120).map(s => Math.abs(s.pts - at) < 1e-9 ? { ...s, hipX: s.hipX! + dx } : s);
    const clean = analyzeSprint(synthetic(120), .2, .8, 10, 'flying');
    const back = analyzeSprint(glitch(.55, -.025), .2, .8, 10, 'flying');        // back behind the entry 50 ms after it
    const ahead = analyzeSprint(glitch(2.475, .025), .2, .8, 10, 'flying');      // past the exit 25 ms early
    expect(clean.duration).toBeCloseTo(2, 6);
    expect(back.start!.pts).toBeCloseTo(.5, 4); expect(back.duration).toBeCloseTo(2, 4);
    expect(ahead.finish!.pts).toBeCloseTo(2.5, 4); expect(ahead.duration).toBeCloseTo(2, 4);
    // A standing start keeps the last time behind the line (sway on the line), as before.
    expect(analyzeSprint(glitch(.55, -.025), .2, .8).start!.pts).toBeGreaterThan(.55);
  });
  it('flying section: one frame of another person 0.06 ahead, just past the entry and followed by a gap, does not move the entry', () => {
    // Recorded (IMG_4835 cropped): the pelvis read 0.06 ahead of the runner for one frame at the entry
    // line, then the runner was not seen for 0.1 s; the entry came out 98 ms early.
    const samples = synthetic(120).map(s => Math.abs(s.pts - .45) < 1e-9 ? { ...s, hipX: s.hipX! + .06 }
      : s.pts > .45 && s.pts < .56 ? { ...s, hipX: null } : s);
    const r = analyzeSprint(samples, .2, .8, 10, 'flying');
    expect(r.reason).toBeNull();
    expect(Math.abs(r.start!.pts - .5)).toBeLessThan(.002);
    expect(r.duration).toBeCloseTo(2, 2);
    // A standing start is unchanged (no such filtering).
    expect(analyzeSprint(samples, .2, .8).start!.pts).toBeLessThan(.46);
  });
  it('counts one missed overlap (a cycle about twice the usual) as two steps and leaves its distance blank', () => {
    const missed = synthetic(120).map(s => Math.abs(s.pts - 1.375) < .07 ? { ...s, ankleGap: .2, kneeGap: .1 } : s);
    const clean = analyzeSprint(synthetic(120), .2, .8), r = analyzeSprint(missed, .2, .8);
    expect(r.steps.length).toBe(clean.steps.length - 1);
    expect(r.count).toBeCloseTo(clean.count!, 6);
    expect(r.warnings[0]).toContain('2歩分');
    expect(r.strideIntervals.some(s => s.reason === '入れ替わりの見逃しで2歩分の区間です' && s.distanceM === null)).toBe(true);
  });
  it('counts a cycle up to 1.5x the usual one as one, about 1.7x as two, and between them as two with a caution', () => {
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
    const between = analyzeSprint(gait(47), .2, .8);         // 1.57x: hard to call, counted and flagged
    expect(between.count).toBeCloseTo(single.count! + 1 + (2.5 - 302 / 120) / .25 - (2.5 - 298 / 120) / .25, 1);
    expect(between.warnings.some(w => w.includes('1歩ずれている可能性'))).toBe(true);
    const double = analyzeSprint(gait(52), .2, .8);            // 1.73x: one missed overlap
    expect(double.count).not.toBeNull(); expect(double.warnings[0]).toContain('2歩分');
  });
  it('judges a missed overlap against the usual cycle, not one raised by the missed overlap itself', () => {
    // Recorded (IMG_4837, entry 10%): four cycles of 0.508 (one missed overlap), 0.284, 0.275 and 0.350 s.
    // Taking the upper-middle 0.350 as the usual cycle made 0.508 look like one long cycle (one step short).
    const overlaps = [8, 42, 76, 110, 171, 205, 238, 280, 314, 348];   // frames at 120 fps: cycles 61, 34, 33, 42 between the gates
    const samples = Array.from({ length: 361 }, (_, i) => {
      const k = overlaps.filter(o => o <= i).length - 1, a = overlaps[k] ?? overlaps[0] - 34, b = overlaps[k + 1] ?? a + 34;
      const gap = .03 + .25 * Math.sin(Math.PI * (i - a) / (b - a));
      return { frame: i, pts: i / 120, hipX: .05 + .3 * i / 120, ankleGap: gap, kneeGap: gap * .5, legLength: .3 };
    });
    const r = analyzeSprint(samples, .05 + .3 * 100 / 120, .05 + .3 * 300 / 120);   // gates at frames 100 and 300
    expect(r.steps).toHaveLength(5);
    expect(r.warnings[0]).toContain('2歩分');
    // Five elapsed cycles plus the partial ones at the gates (the detector places overlaps within a frame).
    expect(Math.abs(r.count! - (5 + (110 - 100) / 34 + (300 - 280) / 34))).toBeLessThan(.07);
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
      // The time stays exact; the steps are still counted, and that interval's distance is withheld.
      expect(result.duration).toBeCloseTo(2); expect(result.count).toBeCloseTo(analyzeSprint(synthetic(60), .2, .8).count!, 6);
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
  it('counts 650 ms overlap cycles, and longer ones too, without per-step distances for the long ones', () => {
    const evaluate = (period: number) => analyzeSprint(synthetic().map(s => {
      const gap = .03 + .25 * Math.abs(Math.cos(Math.PI * s.pts / period));
      return { ...s, ankleGap: gap, kneeGap: gap * .5 };
    }), .2, .8);
    expect(evaluate(.65).count).toBeCloseTo(2 / .65, 9);
    const tooLong = evaluate(.75);
    expect(tooLong.duration).toBeCloseTo(2); expect(tooLong.count).toBeCloseTo(2 / .75, 9);
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
  it('counts steps through a leg-tracking dropout from the usual cycle, and says so', () => {
    // The legs are not seen for 0.2 s, hiding the overlap at 1.125 s.
    const r = analyzeSprint(synthetic().map(s => s.pts > 1 && s.pts < 1.2 ? { ...s, ankleGap: null, kneeGap: null } : s), .2, .8);
    expect(r.duration).toBeCloseTo(2); expect(r.count).toBeCloseTo(analyzeSprint(synthetic(), .2, .8).count!, 6);
    expect(r.stride).toBeCloseTo(10 / r.count!, 9);
    expect(r.warnings[0]).toContain('1回見逃した区間');
  });
  it('always counts: missed overlaps at a gate, several missed in a row, a false detection, or none between the gates', () => {
    // Overlaps every 0.25 s at 0.125 + 0.25k (synthetic); gates at 0.5 s and 2.5 s; 8 cycles.
    const without = (times: number[], width = .06) => synthetic(120).map(s => times.some(t => Math.abs(s.pts - t) < width)
      ? { ...s, ankleGap: .2, kneeGap: .1 } : s);
    const clean = analyzeSprint(synthetic(120), .2, .8).count!;
    expect(Math.abs(clean - 8)).toBeLessThan(.05);
    // The overlap just before the exit is not seen (body leaving the picture): estimated from the cycle.
    const exit = analyzeSprint(without([2.375, 2.625]), .2, .8);
    expect(exit.count).toBeCloseTo(clean, 1); expect(exit.warnings.join()).toContain('出口の直前の入れ替わりが映っていない');
    const entry = analyzeSprint(without([.375, .625]), .2, .8);
    expect(entry.count).toBeCloseTo(clean, 1); expect(entry.warnings.join()).toContain('入口の直後の入れ替わりが映っていない');
    // Two overlaps missed in a row: one interval of three cycles.
    const three = analyzeSprint(without([1.125, 1.375]), .2, .8);
    expect(three.count).toBeCloseTo(clean, 1); expect(three.warnings[0]).toContain('2回見逃した');
    expect(three.strideIntervals.some(s => s.reason === '入れ替わりの見逃しで3歩分の区間です')).toBe(true);
    // A false overlap in the middle of a cycle is dropped.
    const spurious = synthetic(120).map(s => Math.abs(s.pts - 1.25) < .03 ? { ...s, ankleGap: .03, kneeGap: .015 } : s);
    const dropped = analyzeSprint(spurious, .2, .8);
    expect(dropped.count).toBeCloseTo(clean, 1); expect(dropped.warnings[0]).toContain('誤検出');
    // No overlap seen between the gates at all: the usual cycle from just outside them.
    const none = analyzeSprint(without([.625, .875, 1.125, 1.375, 1.625, 1.875, 2.125, 2.375], .1), .2, .8);
    expect(Math.abs(none.count! - 8)).toBeLessThan(.2); expect(none.warnings.join()).toContain('区間内の入れ替わりを捉えられなかった');
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
    expect(html).toContain('3　解析する'); expect(html).toContain('解析v10');
    // Recorded videos only: the live camera was removed (2026-10-07).
    expect(html).not.toContain('リアルタイム'); expect(html).not.toContain('カメラを起動'); expect(html).not.toContain('計測を開始');
    // The crouch start's name may break on a phone only after クラウチング.
    expect(html).toContain('クラウチング<wbr/>スタート'); expect(html).toContain('aria-label="10mの動画を選ぶ"');
    expect(html).toContain('この2本のラインで決定'); expect(html).toContain('解析する'); expect(html).toContain('<video');
    expect(html).toContain('スタート10m'); expect(html).toContain('最高速度区間');
  });
});
