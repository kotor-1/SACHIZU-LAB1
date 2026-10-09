import { describe, expect, it } from 'vitest';
import type { Point } from '../src/sprint10/analysis';
import { SprintTracker } from '../src/sprint10/tracker';
import { fromTiles, tilesOf } from '../src/sprint10/frame-processor';

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

  it('at 120 frames/s bridges a gap of exactly 50 ms in acquisition but restarts after 50.001 ms', () => {
    const target = pose(.2), exact = new SprintTracker(.2), longer = new SprintTracker(.2);
    for (const tracker of [exact, longer]) for (let i = 0; i < 6; i++) tracker.choose([], .4 + i / 120);
    expect(exact.choose([target], .5)).toEqual([]);
    expect(exact.choose([target], .55)).toEqual([]);
    expect(exact.choose([target], .6)).toBe(target);
    expect(longer.choose([target], .5)).toEqual([]);
    expect(longer.choose([target], .550001)).toEqual([]);
    expect(longer.choose([target], .600001)).toEqual([]);
    expect(longer.choose([target], .650001)).toBe(target);
  });

  it('at a live camera rate bridges one missed frame in acquisition, not two', () => {
    // Processed at 15 frames/s: three sightings with one frame missed between them are one person.
    const target = pose(.2), bridged = new SprintTracker(.2), restarted = new SprintTracker(.2);
    for (const tracker of [bridged, restarted]) for (let i = 0; i < 4; i++) tracker.choose([], i / 15);
    expect(bridged.choose([target], 4 / 15)).toEqual([]);
    expect(bridged.choose([target], 6 / 15)).toEqual([]);
    expect(bridged.choose([target], 8 / 15)).toBe(target);
    expect(restarted.choose([target], 4 / 15)).toEqual([]);
    expect(restarted.choose([target], 7 / 15)).toEqual([]);
    expect(restarted.choose([target], 10 / 15)).toEqual([]);
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

  it('looks again at the start line for a track lost for more than 1.5 s before the run', () => {
    // Recorded: a crouch start whose video began 8 s before the set; someone seen for a moment and lost left the
    // athlete in the set never followed (the old track was abandoned and nobody looked again).
    const tracker = new SprintTracker(.2), target = pose(.2);
    tracker.choose([target], 0); tracker.choose([target], .01);
    expect(tracker.choose([target], .02)).toBe(target);
    expect(tracker.choose([], .1)).toEqual([]);
    // taken again after three sightings at the line
    expect(tracker.choose([target], 1.520001)).toEqual([]);
    expect(tracker.choose([target], 1.53)).toEqual([]);
    for (const t of [1.54, 1.55, 1.56]) expect(tracker.choose([target], t)).toBe(target);
  });

  it('keeps a runner lost after the run lost, even with someone at the start line', () => {
    const tracker = new SprintTracker(.2, .6), fps = 120;
    for (let frame = 0; frame / fps <= .6; frame++) { const t = frame / fps; tracker.choose([pose(.2 + .5 * Math.max(0, t - .1))], t); }
    for (const t of [2.7, 2.71, 2.72, 2.73, 2.74, 2.75]) expect(tracker.choose([pose(.2)], t)).toEqual([]);
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
    // The runner appears at x = .01 (t = .2 + .06/.64) and is confirmed within 100 ms (clear of the
    // 1% edge margin, then 60 ms of motion), still well before the gate.
    expect(chosen[0].t).toBeLessThan(.2 + .06 / .64 + .1);
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
  it('hands back the runner\'s sightings before the running decision, and only the runner\'s', () => {
    // A person stands at .08 one lane further back (0.03 higher in the picture) until the runner
    // reaches them, then is hidden behind the runner.
    const tracker = new SprintTracker(.12, 1, 'flying'), here = (t: number) => .08 + .64 * (t - .3);
    const published: { t: number; x: number }[] = [];
    for (let frame = 0; frame < .8 * fps; frame++) {
      const t = frame / fps, poses: Point[][] = [];
      if (t < .3) poses.push(pose(.08, .62));
      if (inFrame(here(t)) && Math.abs(here(t) - .08) > .005) poses.push(pose(here(t)));
      const c = tracker.choose(poses, t);
      for (const b of tracker.takeBackfill()) published.push({ t: b.pts, x: (b.pose[23].x + b.pose[24].x) / 2 });
      if (c.length) published.push({ t, x: (c[23].x + c[24].x) / 2 });
    }
    expect(published.length).toBeGreaterThan(50);
    for (const p of published) expect(Math.abs(p.x - here(p.t))).toBeLessThan(1e-9);
    // Published in time order without duplicates, and seen before the gate.
    for (let i = 1; i < published.length; i++) expect(published[i].t).toBeGreaterThan(published[i - 1].t);
    expect(published[0].x).toBeLessThan(.12);
  });
  it('does not hand back sightings of a person the runner emerged from behind', () => {
    // The runner is hidden behind a person standing at .06 until 0.33 s, then appears there; the
    // provisional track of the standing person continues onto the runner.
    const tracker = new SprintTracker(.12, 1, 'flying'), here = (t: number) => .06 + .64 * (t - .33);
    const published: { t: number; x: number }[] = [];
    for (let frame = 0; frame < .8 * fps; frame++) {
      const t = frame / fps, c = tracker.choose([pose(t < .33 ? .06 : here(t))], t);
      for (const b of tracker.takeBackfill()) published.push({ t: b.pts, x: (b.pose[23].x + b.pose[24].x) / 2 });
      if (c.length) published.push({ t, x: (c[23].x + c[24].x) / 2 });
    }
    expect(published.length).toBeGreaterThan(40);
    // Standing sightings join the path only within pose jitter (.015) of the runner's line.
    for (const p of published) expect(Math.abs(p.x - here(p.t))).toBeLessThan(.016);
    expect(published[0].t).toBeGreaterThan(.33 - .016 / .64 - 1e-9);
  });
  it('treats a body cut by the edge of the analysed crop like one cut by the frame edge', () => {
    // The crop covers .3-.66 of the frame: a runner entering it is cut at .3, not at the frame edge.
    const tracker = new SprintTracker(.5, 1, 'flying'), view = [.3, .66] as const;
    const at = (t: number) => .25 + .64 * t, published: number[] = [];
    for (let frame = 0; frame < .6 * fps; frame++) {
      const t = frame / fps, hip = at(t);
      // MediaPipe extends a cut body beyond the crop; the trailing ankle is .05 behind the pelvis.
      const p = pose(hip); p[27] = { ...p[27], x: hip - .05 };
      const c = tracker.choose(hip < .66 ? [p] : [], t, view);
      for (const b of tracker.takeBackfill()) published.push(b.pose[27].x);
      if (c.length) published.push(c[27].x);
    }
    expect(published.length).toBeGreaterThan(10);
    for (const ankle of published) expect(ankle).toBeGreaterThan(.3);
  });
  // A 10 m section spanning 0.84 of the picture: 1 m/s is 0.084 image widths/s; sprint speed 4 m/s.
  const widths = (mps: number) => mps * .084, sprint = widths(4);
  it('never takes a person jogging toward the finish (3.5 m/s) for the runner, and takes the runner (8 m/s) after them', () => {
    // Recorded: people jogging behind the track at 3.2-3.6 m/s were taken before the runner arrived.
    const tracker = new SprintTracker(.09, 1, 'flying', sprint);
    const jogger = (t: number) => .03 + widths(3.5) * t, runner = (t: number) => -.05 + widths(8) * (t - 2);
    const chosen = run(tracker, t => {
      const poses: Point[][] = [];
      if (inFrame(jogger(t))) poses.push(pose(jogger(t), .55));
      if (inFrame(runner(t))) poses.push(pose(runner(t), .7));
      return poses;
    }, 4);
    expect(chosen.length).toBeGreaterThan(100);
    for (const c of chosen) expect(Math.abs(c.x - runner(c.t))).toBeLessThan(1e-9);
  });
  it('keeps following a runner who is missed for a frame or two, and decides at sprint speed', () => {
    // Recorded at night: the runner's pose was missed for 1-3 frames every few frames.
    const tracker = new SprintTracker(.1, 1, 'flying', sprint), runner = (t: number) => -.05 + widths(7) * (t - .2);
    const chosen = run(tracker, t => {
      const frame = Math.round(t * fps);
      return inFrame(runner(t)) && frame % 7 > 2 ? [pose(runner(t))] : [];
    });
    expect(chosen.length).toBeGreaterThan(60);
    for (const c of chosen) expect(Math.abs(c.x - runner(c.t))).toBeLessThan(1e-9);
    // Decided before the runner reaches the entry gate's far side, so the entry is measured.
    expect(chosen[0].x).toBeLessThan(.3);
  });
  it('treats one person detected twice as one person', () => {
    // Recorded with four people per frame: the runner was often detected twice, 0.003-0.007 apart.
    const tracker = new SprintTracker(.1, 1, 'flying', sprint), runner = (t: number) => -.05 + widths(7) * (t - .2);
    const chosen = run(tracker, t => {
      const frame = Math.round(t * fps), r = runner(t);
      if (!inFrame(r)) return [];
      return frame % 3 ? [pose(r)] : [pose(r), pose(r + .005, .655)];
    });
    expect(chosen.length).toBeGreaterThan(100);
    expect(chosen[0].x).toBeLessThan(.3);
    for (const c of chosen) expect(Math.abs(c.x - runner(c.t))).toBeLessThan(.006);
  });
  it('passes in front of people jogging behind at the same horizontal position', () => {
    // Recorded: the runner (pelvis at 0.67 of the height) passed joggers on the field behind (0.61).
    const tracker = new SprintTracker(.1, 1, 'flying', sprint), runner = (t: number) => -.05 + widths(7) * (t - .2);
    // The runner passes them at about 0.45 s, while its track is still provisional.
    const jogger = (t: number) => -.02 + widths(3) * t, other = (t: number) => .01 + widths(3) * t;
    const published: { t: number; x: number }[] = [];
    for (let frame = 0; frame < 2.5 * fps; frame++) {
      const t = frame / fps, poses: Point[][] = [jogger(t), other(t)].filter(inFrame).map((x, i) => pose(x, .61 - .005 * i));
      if (inFrame(runner(t))) poses.push(pose(runner(t), .67));
      const c = tracker.choose(poses, t);
      for (const b of tracker.takeBackfill()) published.push({ t: b.pts, x: (b.pose[23].x + b.pose[24].x) / 2 });
      if (c.length) published.push({ t, x: (c[23].x + c[24].x) / 2 });
    }
    expect(published.length).toBeGreaterThan(100);
    expect(published[0].x).toBeLessThan(.1);   // seen before the entry gate, so the entry is measured
    for (const p of published) expect(Math.abs(p.x - runner(p.t))).toBeLessThan(1e-9);
  });
  it('never takes someone first seen well past the entry gate, whose entry cannot be measured', () => {
    // Recorded: a person 0.12 widths past the entry, apparently at sprint speed (a panning camera), was taken.
    const tracker = new SprintTracker(.09, 1, 'flying', sprint);
    const past = (t: number) => .21 + widths(5) * t, runner = (t: number) => -.05 + widths(8) * (t - 1.5);
    const chosen = run(tracker, t => {
      const poses: Point[][] = [];
      if (t < 1 && inFrame(past(t))) poses.push(pose(past(t), .55));
      if (inFrame(runner(t))) poses.push(pose(runner(t), .7));
      return poses;
    }, 3.5);
    expect(chosen.length).toBeGreaterThan(100);
    for (const c of chosen) expect(Math.abs(c.x - runner(c.t))).toBeLessThan(1e-9);
  });
  it('replaces a person jogging behind, taken first, with a nearer and faster young runner', () => {
    // Young runners (4-5 m/s) are as slow as people jogging (3-3.6 m/s): speed alone cannot tell them apart.
    const tracker = new SprintTracker(.1, .8, 'flying', widths(2.5));
    const jogger = (t: number) => .03 + widths(3.2) * t, runner = (t: number) => -.05 + widths(5) * (t - 1);
    const published = new Map<number, number>();
    for (let frame = 0; frame < 3.5 * fps; frame++) {
      const t = frame / fps, poses: Point[][] = [];
      if (inFrame(jogger(t))) poses.push(pose(jogger(t), .58));
      if (inFrame(runner(t))) poses.push(pose(runner(t), .7));
      const c = tracker.choose(poses, t), from = tracker.takeRetraction();
      if (from !== null) for (const k of [...published.keys()]) if (k >= from) published.delete(k);
      for (const b of tracker.takeBackfill()) published.set(b.pts, (b.pose[23].x + b.pose[24].x) / 2);
      if (c.length) published.set(t, (c[23].x + c[24].x) / 2);
    }
    const kept = [...published.entries()];
    expect(kept.length).toBeGreaterThan(100);
    for (const [t, x] of kept) expect(Math.abs(x - runner(t))).toBeLessThan(1e-9);
    expect(Math.min(...kept.map(([, x]) => x))).toBeLessThan(.1);   // the runner's entry is measured
  });
  it('keeps the runner when a slower or farther person comes along', () => {
    const tracker = new SprintTracker(.1, .8, 'flying', widths(2.5));
    const runner = (t: number) => -.05 + widths(5) * (t - .2), nearSlow = (t: number) => -.05 + widths(3) * (t - .6);
    const farFast = (t: number) => -.05 + widths(7) * (t - .8);
    const chosen = run(tracker, t => {
      const poses: Point[][] = [];
      if (inFrame(runner(t))) poses.push(pose(runner(t), .65));
      if (inFrame(nearSlow(t))) poses.push(pose(nearSlow(t), .75));   // nearer but slower
      if (inFrame(farFast(t))) poses.push(pose(farFast(t), .55));     // faster but farther
      return poses;
    });
    expect(chosen.length).toBeGreaterThan(100);
    for (const c of chosen) expect(Math.abs(c.x - runner(c.t))).toBeLessThan(1e-9);
    expect(tracker.takeRetraction()).toBeNull();
  });
  it('is idle only while nobody on the run-in side has moved in the last 0.1 s', () => {
    // Recorded: a person standing for 0.3 s then setting off looked still over the whole track.
    const tracker = new SprintTracker(.2, 1, 'flying', widths(2.5));
    const person = (t: number) => t < .3 ? .08 : .08 + widths(5) * (t - .3);
    const states: { t: number; idle: boolean }[] = [];
    for (let frame = 0; frame < .5 * fps; frame++) { const t = frame / fps; tracker.choose([pose(person(t))], t); states.push({ t, idle: tracker.idle }); }
    expect(states.filter(s => s.t > .1 && s.t < .29).every(s => s.idle)).toBe(true);    // standing
    expect(states.filter(s => s.t > .33 && s.t < .45).some(s => s.idle)).toBe(false);   // moving off
    expect(new SprintTracker(.2, 1, 'standing').idle).toBe(false);
  });
  it('searches again when the person taken disappears before the entry gate', () => {
    // Someone sprints in at the left edge for 0.4 s and drops out of the picture before the gate; the runner comes 2 s later.
    const tracker = new SprintTracker(.3, 1, 'flying', sprint);
    const first = (t: number) => .03 + widths(7) * t, runner = (t: number) => -.05 + widths(8) * (t - 2);
    const chosen = run(tracker, t => {
      const poses: Point[][] = [];
      if (t < .4 && inFrame(first(t))) poses.push(pose(first(t), .6));
      if (inFrame(runner(t))) poses.push(pose(runner(t), .7));
      return poses;
    }, 4);
    const later = chosen.filter(c => c.t > 1);
    expect(later.length).toBeGreaterThan(100);
    for (const c of later) expect(Math.abs(c.x - runner(c.t))).toBeLessThan(1e-9);
  });
  it('lets the crop follow a provisional runner at sprint speed before the decision, but not a jogger', () => {
    const tracker = new SprintTracker(.09, 1, 'flying', sprint);
    for (let frame = 0; frame < .15 * fps; frame++) tracker.choose([pose(.05 + widths(8) * frame / fps), pose(.03 + widths(3) * frame / fps, .5)], frame / fps);
    const t = .15, runnerAt = .05 + widths(8) * t;
    expect(Math.abs(tracker.expected(t) - runnerAt)).toBeLessThan(.01);
    const slow = new SprintTracker(.09, 1, 'flying', sprint);
    for (let frame = 0; frame < .15 * fps; frame++) slow.choose([pose(.03 + widths(3) * frame / fps, .5)], frame / fps);
    expect(slow.expected(t)).toBeCloseTo(.02, 9);   // the seed, 0.08 on the run-in side, kept inside the picture
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

describe('at a live camera frame rate', () => {
  const widths = (mps: number) => mps * .084;
  /** Frames at about `fps`, unevenly spaced as a live camera is processed (every third interval 70% longer). */
  const times = (fps: number, seconds: number) => {
    const out: number[] = [];
    for (let t = 0, i = 0; t < seconds; i++) { out.push(t); t += (i % 3 === 2 ? 1.7 : 1) / fps; }
    return out;
  };
  const inFrame = (x: number) => x > .01 && x < .99;
  type Published = Map<number, number>;
  /** Runs the tracker over the scene, applying retraction and backfill as the frame processor does. */
  function live(tracker: SprintTracker, frames: number[], scene: (t: number) => Point[][], watchEvery = 2) {
    const published: Published = new Map();
    frames.forEach((t, i) => {
      const poses = scene(t);
      // Everyone is visible to the subject's crop; the watch crop adds the same poses on every `watchEvery` frame.
      const c = tracker.choose(poses, t, [0, 1], i % watchEvery === 0 ? { poses, view: [0, 1] } : undefined);
      const from = tracker.takeRetraction();
      if (from !== null) for (const k of [...published.keys()]) if (k >= from) published.delete(k);
      for (const b of tracker.takeBackfill()) published.set(b.pts, (b.pose[23].x + b.pose[24].x) / 2);
      if (c.length) published.set(t, (c[23].x + c[24].x) / 2);
    });
    return published;
  }

  it('follows a runner through a flying section at 30 frames/s with uneven frame spacing', () => {
    const tracker = new SprintTracker(.1, .8, 'flying', widths(2.5));
    const runner = (t: number) => -.05 + widths(8) * (t - .3);
    const published = live(tracker, times(30, 2.5), t => inFrame(runner(t)) ? [pose(runner(t))] : []);
    const kept = [...published.entries()].sort((a, b) => a[0] - b[0]);
    for (const [t, x] of kept) expect(Math.abs(x - runner(t))).toBeLessThan(1e-9);
    expect(kept[0][1]).toBeLessThan(.1); expect(kept.at(-1)![1]).toBeGreaterThan(.9);   // both gates observed
    // No gap longer than one missed frame between the gates.
    const inside = kept.filter(([, x]) => x > .05 && x < .95);
    expect(Math.max(...inside.slice(1).map(([t], i) => t - inside[i][0]))).toBeLessThan(.06);
  });

  it('replaces a person jogging with the nearer runner, and keeps it while hidden for 0.6 s passing them, at 15 frames/s', () => {
    const tracker = new SprintTracker(.1, .8, 'flying', widths(2.5));
    const jogger = (t: number) => .03 + widths(3.2) * t, runner = (t: number) => -.05 + widths(6) * (t - .6);
    const hidden = (t: number) => Math.abs(runner(t) - jogger(t)) < .07;      // undetected while overlapping
    const published = live(tracker, times(15, 3.5), t => {
      const poses: Point[][] = [];
      if (inFrame(jogger(t))) poses.push(pose(jogger(t), .6));
      if (inFrame(runner(t)) && !hidden(t)) poses.push(pose(runner(t), .67));
      return poses;
    }, 1);
    const kept = [...published.entries()].sort((a, b) => a[0] - b[0]);
    expect(kept.at(-1)![1]).toBeGreaterThan(.9);
    for (const [t, x] of kept) expect(Math.abs(x - runner(t))).toBeLessThan(1e-9);
    expect(kept[0][1]).toBeLessThan(.1);                 // the runner's entry is measured
    expect(tracker.contested).toBe(false);
  });

  it('marks the run contested when a nearer, faster person is seen but never followed', () => {
    // The subject jogs through; someone nearer the camera sprints past in the middle of the picture only.
    const scene = (nearerY: number, speed: number) => (t: number) => {
      const poses = [pose(.03 + widths(3.2) * t, .6)];
      const other = .35 + widths(speed) * (t - 1);
      if (t > 1 && other < .9) poses.push(pose(other, nearerY));
      return poses;
    };
    const contested = (nearerY: number, speed: number) => {
      const tracker = new SprintTracker(.1, .8, 'flying', widths(2.5));
      live(tracker, times(15, 2.2), scene(nearerY, speed));
      return tracker.contested;
    };
    expect(contested(.67, 7)).toBe(true);     // nearer and faster: the time may be the wrong person's
    expect(contested(.55, 7)).toBe(false);    // farther
    expect(contested(.67, 3.4)).toBe(false);  // nearer but not faster than the subject
  });

  it('follows the first step of a standing start at 30 frames/s', () => {
    // Recorded (live, 30 frames/s): the pelvis moved 0.036 between two frames at the first step,
    // the subject was missed across the start line, and its crossing could not be measured.
    const recorded = [[.708, .045], [.744, .05], [.773, .051], [.809, .056], [.842, .062], [.877, .069], [.911, .061], [.944, .075],
      [.975, .06], [1.011, .072], [1.037, .108], [1.075, .117], [1.103, .126], [1.142, .131], [1.177, .142], [1.211, .151], [1.242, .163], [1.275, .174]];
    const tracker = new SprintTracker(.12, .76, 'standing');
    const chosen = recorded.filter(([t, x]) => tracker.choose([pose(x, .55)], t).length).map(([t]) => t);
    for (const t of [1.011, 1.037, 1.075, 1.103, 1.142]) expect(chosen).toContain(t);
  });
});

describe('10m flying start: the search in tiles until someone is followed', () => {
  it('splits a tall crop into two about-square tiles, top and bottom, and leaves a square one alone', () => {
    // Landscape 1920x1080, the 0.36-wide crop at full height (the user's 240 fps clips, 2026-10-09).
    const [top, bottom] = tilesOf({ x: .1, y: 0, w: .36, h: 1 }, 1920, 1080);
    expect(top.x).toBe(.1); expect(top.w).toBe(.36); expect(top.y).toBe(0); expect(top.h).toBeCloseTo(.64, 9);
    expect(bottom.y).toBeCloseTo(.36, 9); expect(bottom.y + bottom.h).toBeCloseTo(1, 9);
    // Narrowed to the runner's band, the crop is about square already.
    expect(tilesOf({ x: .1, y: .3, w: .36, h: .45 }, 1920, 1080)).toEqual([]);
    // Portrait: two tiles of 0.6 of the height (half the crop's, still taller than wide).
    const portrait = tilesOf({ x: 0, y: 0, w: .36, h: 1 }, 1080, 1920);
    expect(portrait.map(r => [r.y, r.h].map(v => +v.toFixed(9)))).toEqual([[0, .6], [.4, .6]]);
  });
  it('keeps a tile pose unless the tile cuts the body or the person was already detected', () => {
    // A body from y0 to y1 (its landmarks spread evenly; shoulders to ankles 0.34-0.88 of that span).
    const body = (x: number, y0: number, y1: number): Point[] => Array.from({ length: 33 }, (_, i) => ({ x, y: y0 + (y1 - y0) * i / 32, visibility: .9 }));
    const [top, bottom] = tilesOf({ x: 0, y: 0, w: .36, h: 1 }, 1920, 1080);
    const runner = body(.2, .45, .7);   // its ankles at 0.67, past the top tile's bottom (0.64)
    expect(fromTiles([{ poses: [runner], tile: top }], [])).toEqual([]);
    expect(fromTiles([{ poses: [runner], tile: bottom }], [])).toEqual([runner]);
    // Inside both tiles: added once. Already found in the crop: not added. Someone else: added.
    const small = body(.25, .45, .6), again = body(.252, .45, .6), other = body(.3, .4, .55);
    expect(fromTiles([{ poses: [small], tile: top }, { poses: [again], tile: bottom }], [])).toEqual([small]);
    expect(fromTiles([{ poses: [small, other], tile: top }], [again])).toEqual([other]);
  });
});
