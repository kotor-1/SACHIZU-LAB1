import { describe, expect, it } from 'vitest';
import type { Point } from '../src/sprint10/analysis';
import { SprintTracker } from '../src/sprint10/tracker';

const pose = (x: number, y = .65): Point[] => Array.from({ length: 33 }, () => ({ x, y, visibility: .95 }));
const reflect = (points: Point[]) => points.map(p => ({ ...p, x: 1 - p.x }));

describe('10m subject acquisition', () => {
  it.each([false, true])('requires three observations and keeps the crop seed fixed until then (reflected=%s)', reversed => {
    const x = (value: number) => reversed ? 1 - value : value;
    const tracker = new SprintTracker(x(.2));
    const first = pose(x(.16)), second = pose(x(.17)), third = pose(x(.18));
    expect(tracker.choose([first], 0)).toEqual([]); expect(tracker.expected(.01)).toBe(x(.2));
    expect(tracker.choose([second], .01)).toEqual([]); expect(tracker.expected(.02)).toBe(x(.2));
    expect(tracker.choose([third], .02)).toBe(third); expect(tracker.expected(.02)).toBe(x(.18));
    const fourth = pose(x(.19));
    expect(tracker.choose([fourth], .03)).toBe(fourth);
  });

  it.each([false, true])('discards an isolated false initialization before the actual runner appears (reflected=%s)', reversed => {
    const points = (x: number, y: number) => reversed ? reflect(pose(x, y)) : pose(x, y);
    const tracker = new SprintTracker(reversed ? .88 : .12);
    // One erroneous pose, then missing detections, then a continuous runner.
    expect(tracker.choose([points(.1133, .6328)], .05)).toEqual([]);
    expect(tracker.choose([], .058333)).toEqual([]);
    expect(tracker.choose([points(.0419, .6722)], 44 / 120)).toEqual([]);
    expect(tracker.choose([points(.0433, .6757)], 45 / 120)).toEqual([]);
    const confirmed = points(.044, .6765);
    expect(tracker.choose([confirmed], 46 / 120)).toBe(confirmed);
    expect(tracker.expected(46 / 120)).toBeCloseTo(reversed ? .956 : .044);
  });

  it('resets provisional observations after an empty frame', () => {
    const tracker = new SprintTracker(.2), target = pose(.2);
    expect(tracker.choose([target], 0)).toEqual([]);
    expect(tracker.choose([target], .01)).toEqual([]);
    expect(tracker.choose([], .02)).toEqual([]);
    expect(tracker.choose([target], .03)).toEqual([]);
    expect(tracker.choose([target], .04)).toEqual([]);
    expect(tracker.choose([target], .05)).toBe(target);
  });

  it('resets provisional observations when candidate identity is ambiguous', () => {
    const tracker = new SprintTracker(.2), target = pose(.2);
    expect(tracker.choose([target], 0)).toEqual([]);
    expect(tracker.choose([target], .01)).toEqual([]);
    expect(tracker.choose([pose(.19), pose(.21)], .02)).toEqual([]);
    expect(tracker.choose([target], .03)).toEqual([]);
    expect(tracker.choose([target], .04)).toEqual([]);
    expect(tracker.choose([target], .05)).toBe(target);
  });

  it('accepts exactly 50 ms acquisition spacing but restarts after 50.001 ms', () => {
    const target = pose(.2), exact = new SprintTracker(.2), longer = new SprintTracker(.2);
    expect(exact.choose([target], .5)).toEqual([]);
    expect(exact.choose([target], .55)).toEqual([]);
    expect(exact.choose([target], .6)).toBe(target);
    expect(longer.choose([target], .5)).toEqual([]);
    expect(longer.choose([target], .550001)).toEqual([]);
    expect(longer.choose([target], .600001)).toEqual([]);
    expect(longer.choose([target], .650001)).toBe(target);
  });

  it.each(['horizontal', 'vertical'])('restarts a discontinuous %s candidate from the original seed', axis => {
    const tracker = new SprintTracker(.2), first = pose(.2, .5);
    const changed = axis === 'horizontal' ? pose(.28, .5) : pose(.2, .6);
    expect(tracker.choose([first], 0)).toEqual([]);
    expect(tracker.choose([changed], .01)).toEqual([]);
    expect(tracker.choose([changed], .02)).toEqual([]);
    expect(tracker.expected(.03)).toBe(.2);
    expect(tracker.choose([changed], .03)).toBe(changed);
  });

  it('does not restart a discontinuous candidate outside the original seed radius', () => {
    const tracker = new SprintTracker(.2), near = pose(.34), far = pose(.37);
    expect(tracker.choose([pose(.2)], 0)).toEqual([]);
    expect(tracker.choose([far], .01)).toEqual([]);
    expect(tracker.choose([far], .02)).toEqual([]);
    expect(tracker.choose([far], .03)).toEqual([]);
    expect(tracker.expected(.04)).toBe(.2);
    expect(tracker.choose([near], .04)).toEqual([]);
    expect(tracker.choose([near], .05)).toEqual([]);
    expect(tracker.choose([near], .06)).toBe(near);
  });

  it.each([.01, .005, NaN])('does not count repeated, reversed or invalid timestamps as a third observation (%s)', invalidTime => {
    const tracker = new SprintTracker(.2), target = pose(.2);
    expect(tracker.choose([target], 0)).toEqual([]);
    expect(tracker.choose([target], .01)).toEqual([]);
    expect(tracker.choose([target], invalidTime)).toEqual([]);
    expect(tracker.expected(.02)).toBe(.2);
    expect(tracker.choose([target], .02)).toEqual([]);
  });

  it('discards observations whose hips are invalid or not visible', () => {
    const tracker = new SprintTracker(.2), target = pose(.2), invalid = pose(.2);
    invalid[23].visibility = .2;
    expect(tracker.choose([target], 0)).toEqual([]);
    expect(tracker.choose([invalid], .01)).toEqual([]);
    expect(tracker.choose([target], .02)).toEqual([]);
    expect(tracker.choose([target], .03)).toEqual([]);
    expect(tracker.choose([target], .04)).toBe(target);
  });

  it('abandons a confirmed track that has been lost for more than 1.5 s', () => {
    const tracker = new SprintTracker(.2), target = pose(.2);
    tracker.choose([target], 0); tracker.choose([target], .01);
    expect(tracker.choose([target], .02)).toBe(target);
    expect(tracker.choose([], .1)).toEqual([]);
    for (const t of [1.520001, 1.53, 1.54, 1.55, 1.56, 1.57]) expect(tracker.choose([target], t)).toEqual([]);
  });

  it('keeps a running subject when a slow bystander walking the other way is briefly nearest', () => {
    const fps = 120, tracker = new SprintTracker(.1), runner = (t: number) => .1 + .4 * Math.max(0, t - .2);
    const walker = (t: number) => .62 - .05 * t;
    let lastRunner = 0, onWalker = 0;
    for (let frame = 0; frame < 2.4 * fps; frame++) {
      const t = frame / fps, r = runner(t), w = walker(t);
      // The runner's pose drops out for 40 ms while passing the walker.
      const passing = Math.abs(r - w) < .04 && Math.abs(r - w) > .01;
      const poses = passing ? [pose(w)] : Math.abs(r - w) <= .01 ? [pose(r)] : [pose(r), pose(w)];
      const chosen = tracker.choose(poses, t);
      if (!chosen.length) continue;
      const x = (chosen[23].x + chosen[24].x) / 2;
      if (Math.abs(x - r) < 1e-9) lastRunner = t; else onWalker = t;
    }
    // After the pass the track is back on the runner, never following the walker.
    expect(lastRunner).toBeGreaterThan(2.2);
    expect(onWalker).toBeLessThan(1.6);
  });
  it('resumes a runner after a longer occlusion only at the predicted, forward-moving position', () => {
    const fps = 120, tracker = new SprintTracker(.1), runner = (t: number) => .1 + .4 * Math.max(0, t - .2);
    let resumed = -1;
    for (let frame = 0; frame < 2.4 * fps; frame++) {
      const t = frame / fps, hidden = t > 1 && t < 1.6;
      const poses = hidden ? [pose(.7)] : [pose(runner(t))];   // a static bystander while the runner is hidden
      const chosen = tracker.choose(poses, t);
      if (hidden) expect(chosen).toEqual([]);
      if (!hidden && t > 1.6 && chosen.length && resumed < 0) resumed = t;
    }
    expect(resumed).toBeGreaterThan(1.6); expect(resumed).toBeLessThan(1.7);
  });
  it('does not resume on a pose moving backwards after a running loss', () => {
    const fps = 120, tracker = new SprintTracker(.1), runner = (t: number) => .1 + .4 * Math.max(0, t - .2);
    for (let frame = 0; frame <= 1.2 * fps; frame++) tracker.choose([pose(runner(frame / fps))], frame / fps);
    let taken = 0, seen = 0;
    for (let frame = 1.2 * fps + 1; frame < 2.4 * fps; frame++) {
      const t = frame / fps;
      // After the loss, someone appears exactly at the predicted position but walks back towards the start.
      if (t < 1.55) { tracker.choose([], t); continue; }
      const x = runner(1.2) + .4 * .35 - .05 * (t - 1.55);
      if (Math.abs(x - tracker.expected(t)) < .1) seen++;
      if (tracker.choose([pose(x)], t).length) taken++;
    }
    expect(seen).toBeGreaterThan(10);
    expect(taken).toBe(0);
  });
  it.each([.175, .35])('before the run, replaces a bystander acquired first with the person nearer the start gate, then passes them (acceleration %s)', acceleration => {
    // The bystander stands 0.08 image widths ahead of the runner, who accelerates from rest at t = 1 s.
    const fps = 120, tracker = new SprintTracker(.05, 1), bystander = .13;
    const runner = (t: number) => .054 + acceleration * Math.max(0, t - 1) ** 2;
    let onBystanderAfter = 0, firstOnRunner = -1, last = 0;
    for (let frame = 0; frame < 3 * fps; frame++) {
      const t = frame / fps, r = runner(t);
      // The runner at the gate is detected only from 0.2 s; the bystander stands still.
      const poses = t < .2 ? [pose(bystander)] : Math.abs(r - bystander) < .01 ? [pose(r)] : [pose(r), pose(bystander)];
      const chosen = tracker.choose(poses, t);
      if (!chosen.length) continue;
      const x = (chosen[23].x + chosen[24].x) / 2;
      if (Math.abs(x - r) < 1e-9) { if (firstOnRunner < 0) firstOnRunner = t; last = x; } else if (firstOnRunner >= 0) onBystanderAfter++;
    }
    expect(firstOnRunner).toBeGreaterThan(.2); expect(firstOnRunner).toBeLessThan(.25);
    expect(onBystanderAfter).toBe(0);
    expect(last).toBeGreaterThan(.45);
  });
  it.each([.175, .35])('keeps a runner who overtakes a person walking back past the start (acceleration %s)', acceleration => {
    // The runner walks in from behind the gate, then accelerates from 0.8 s.
    const fps = 120, tracker = new SprintTracker(.05, 1), walker = (t: number) => .21 - .07 * t;
    const runner = (t: number) => t < .8 ? .025 + .13 * (t - .2) : .103 + .13 * (t - .8) + acceleration * (t - .8) ** 2;
    let onWalkerAfter = 0, onRunner = -1, last = 0;
    for (let frame = 0; frame < 3 * fps; frame++) {
      const t = frame / fps, w = walker(t), r = runner(t);
      const poses = t < .2 ? [pose(w)] : Math.abs(r - w) < .01 ? [pose(r)] : [pose(r), pose(w)];
      const chosen = tracker.choose(poses, t);
      if (!chosen.length) continue;
      const x = (chosen[23].x + chosen[24].x) / 2;
      if (t >= .2 && Math.abs(x - r) < 1e-9) { if (onRunner < 0) onRunner = t; last = x; } else if (onRunner >= 0) onWalkerAfter++;
    }
    expect(onRunner).toBeGreaterThan(.2); expect(onRunner).toBeLessThan(.25);
    expect(onWalkerAfter).toBe(0);
    expect(last).toBeGreaterThan(.5);
  });
  it('without a run direction keeps the subject acquired first', () => {
    const tracker = new SprintTracker(.05), bystander = pose(.13), runner = pose(.054);
    for (let frame = 0; frame < 24; frame++) tracker.choose([bystander], frame / 120);
    for (let frame = 24; frame < 60; frame++) expect(tracker.choose([runner, bystander], frame / 120)).toBe(bystander);
  });
  it('preserves confirmed tracking through a short gap or ambiguous observation', () => {
    const tracker = new SprintTracker(.2), target = pose(.2);
    tracker.choose([target], 0); tracker.choose([target], .01);
    expect(tracker.choose([target], .02)).toBe(target);
    expect(tracker.choose([pose(.19), pose(.21)], .03)).toEqual([]);
    expect(tracker.choose([], .04)).toEqual([]);
    expect(tracker.choose([target], .05)).toBe(target);
    expect(tracker.choose([target], .15)).toBe(target);
  });
  it('needs three consistent observations over 40 ms to resume after a gap longer than 0.1 s', () => {
    const tracker = new SprintTracker(.2), target = pose(.2);
    tracker.choose([target], 0); tracker.choose([target], .01);
    expect(tracker.choose([target], .02)).toBe(target);
    expect(tracker.choose([target], .4)).toEqual([]);
    expect(tracker.choose([target], .42)).toEqual([]);
    expect(tracker.choose([target], .44)).toBe(target);
    expect(tracker.choose([target], .45)).toBe(target);
  });
});

describe('flying start (maximal-velocity section)', () => {
  const fps = 120;
  /** Runner enters from the frame edge at full speed; pelvis x per second. */
  const runner = (t: number, speed = .64, enter = .2) => -.05 + speed * (t - enter);
  function run(tracker: SprintTracker, scene: (t: number) => Point[][], seconds = 2.5) {
    const chosen: { t: number; x: number }[] = [];
    for (let frame = 0; frame < seconds * fps; frame++) {
      const t = frame / fps, c = tracker.choose(scene(t), t);
      if (c.length) chosen.push({ t, x: (c[23].x + c[24].x) / 2 });
    }
    return chosen;
  }
  const inFrame = (x: number) => x > .01 && x < .99;
  it.each([false, true])('acquires a runner entering at speed before the gate, ignoring people standing at and past it (reflected=%s)', reflected => {
    const x = (v: number) => reflected ? 1 - v : v;
    const tracker = new SprintTracker(x(.2), reflected ? -1 : 1, 'flying');
    const chosen = run(tracker, t => {
      const r = runner(t), poses = [pose(x(.2)), pose(x(.27))];      // one on the line, one 1 m past it
      if (inFrame(r)) poses.unshift(pose(x(r)));
      return poses;
    });
    expect(chosen.length).toBeGreaterThan(100);
    // Every published sample is the runner, none the bystanders.
    for (const c of chosen) expect(Math.abs(c.x - x(runner(c.t)))).toBeLessThan(1e-9);
    // The runner appears at x = .01 (t = .2 + .06/.64) and is confirmed within 80 ms (60 ms of motion
    // are required), still well before the gate.
    expect(chosen[0].t).toBeLessThan(.2 + .06 / .64 + .08);
    expect((chosen[0].x - x(.2)) * (reflected ? -1 : 1)).toBeLessThan(-.05);
  });
  it('never acquires a person walking through the gate, then takes the runner', () => {
    const tracker = new SprintTracker(.2, 1, 'flying');
    const walker = (t: number) => .05 + .08 * t;                      // ~1 m/s
    const chosen = run(tracker, t => {
      const r = runner(t, .64, 1.2), poses = [pose(walker(t))];
      if (inFrame(r)) poses.unshift(pose(r));
      return poses;
    }, 3);
    expect(chosen.length).toBeGreaterThan(50);
    for (const c of chosen) expect(Math.abs(c.x - runner(c.t, .64, 1.2))).toBeLessThan(1e-9);
  });
  it('never confirms a jittery person walking back near the gate, then takes the runner', () => {
    // Recorded: a person at .26 drifting back to .23 with ±.006 pose jitter was confirmed over 40 ms.
    const tracker = new SprintTracker(.2, 1, 'flying');
    const jitter = [.006, -.004, .005, -.006, .004, .006, -.005, .003];
    const back = (t: number, frame: number) => .26 - .14 * t + jitter[frame % jitter.length];
    const chosen = run(tracker, t => {
      const frame = Math.round(t * fps), r = runner(t, .64, 1.2), poses = [];
      if (back(t, frame) > .01) poses.push(pose(back(t, frame)));
      if (inFrame(r)) poses.push(pose(r));
      return poses;
    }, 3);
    expect(chosen.length).toBeGreaterThan(50);
    for (const c of chosen) expect(Math.abs(c.x - runner(c.t, .64, 1.2))).toBeLessThan(1e-9);
  });
  it('is not blocked by a bystander who is nearest the seed every frame', () => {
    const tracker = new SprintTracker(.2, 1, 'flying');
    const chosen = run(tracker, t => {
      const r = runner(t, .5), poses = [pose(.13), pose(.16, .62)];   // two people standing on the run-in
      if (inFrame(r)) poses.push(pose(r));
      return poses;
    });
    expect(chosen.length).toBeGreaterThan(100);
    for (const c of chosen) expect(Math.abs(c.x - runner(c.t, .5))).toBeLessThan(1e-9);
  });
  it('does not acquire anyone already past the gate, and keeps the subject after acquisition', () => {
    const tracker = new SprintTracker(.2, 1, 'flying');
    const chosen = run(tracker, t => {
      const ahead = .4 + .64 * t, r = runner(t, .64, 1);              // a runner already past the gate, then ours
      const poses = []; if (inFrame(ahead)) poses.push(pose(ahead)); if (inFrame(r)) poses.push(pose(r));
      return poses;
    }, 3);
    expect(chosen.length).toBeGreaterThan(50);
    for (const c of chosen) expect(Math.abs(c.x - runner(c.t, .64, 1))).toBeLessThan(1e-9);
  });
  it('ignores a runner cut by the frame edge (pelvis jumping around), then tracks it through the gate without a gap', () => {
    // Recorded pattern: entering at the edge, the pelvis read .087, .060, .065, .031, .034, .073, ... before settling.
    const tracker = new SprintTracker(.2, 1, 'flying');
    const noise = [.03, -.02, -.01, -.045, -.04, .015, -.01, .02, -.03, .01, -.025, .02];
    // Still accelerating at the edge (a crop of a standing 10 m): .25 widths/s rising by 1.2 widths/s².
    const accelerating = (t: number) => -.02 + .25 * (t - .2) + .6 * (t - .2) ** 2;
    const chosen = run(tracker, t => {
      const r = accelerating(t), frame = Math.round((t - .2) * fps);
      if (t < .2 || r <= .01 || r >= .99) return [];
      const p = pose(Math.max(.005, r + (r < .1 ? noise[frame % noise.length] : 0)));
      // The trailing leg and arm are outside the frame while the pelvis is within .08 of the edge.
      if (r < .08) for (const i of [11, 25, 27]) p[i] = { ...p[i], x: r - .09 };
      return [p];
    });
    const before = chosen.filter(c => c.x < .2), after = chosen.filter(c => c.x >= .2);
    expect(before.length).toBeGreaterThan(3); expect(after.length).toBeGreaterThan(50);
    const crossing = chosen.findIndex(c => c.x >= .2);
    expect(chosen[crossing].t - chosen[crossing - 1].t).toBeLessThanOrEqual(.05);
  });
  it('seeds the crop on the run-in side of the gate and falls back to standing without a direction', () => {
    expect(new SprintTracker(.2, 1, 'flying').expected(0)).toBeCloseTo(.12, 9);
    expect(new SprintTracker(.8, -1, 'flying').expected(0)).toBeCloseTo(.88, 9);
    expect(new SprintTracker(.05, 1, 'flying').expected(0)).toBeCloseTo(.02, 9);
    const t = new SprintTracker(.2, 0, 'flying'), target = pose(.2);
    expect(t.expected(0)).toBe(.2);
    t.choose([target], 0); t.choose([target], .01);
    expect(t.choose([target], .02)).toBe(target);                       // standing acquisition
  });
});
