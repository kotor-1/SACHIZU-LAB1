import { describe, expect, it } from 'vitest';
import { analyzeStrength, findReps, type Exercise } from '../src/strength/analysis';
import type { CrouchFrame, CrouchPoint } from '../src/sprint10/crouch';

const rad = (d: number) => d * Math.PI / 180;
/** A side-on body facing `dir` (+1 right) in a 1000×1000 picture: shank, thigh (hip behind the knee) and trunk angles
 * from the vertical, the heel raised by `heel` degrees about the toe; `spread`: the shoulders' and hips' left-right
 * spread (0.02 from the side). Arms hang from the shoulders (RDL) or hold the bar at them (squat). */
function body(shank: number, thigh: number, trunk: number, o: { dir?: number; heel?: number; spread?: number; exercise?: Exercise; swap?: boolean } = {}): CrouchPoint[] {
  const d = o.dir ?? 1, spread = o.spread ?? .02;
  const toe = { x: .5 + .12 * d, y: .88 }, footLen = .15, pitch = rad(o.heel ?? 0);
  const heel = { x: toe.x - footLen * Math.cos(pitch) * d, y: toe.y - footLen * Math.sin(pitch) };
  const ankle = { x: heel.x + .03 * d, y: heel.y - .03 };
  const knee = { x: ankle.x + .22 * Math.sin(rad(shank)) * d, y: ankle.y - .22 * Math.cos(rad(shank)) };
  const hip = { x: knee.x - .22 * Math.sin(rad(thigh)) * d, y: knee.y - .22 * Math.cos(rad(thigh)) };
  const shoulder = { x: hip.x + .28 * Math.sin(rad(trunk)) * d, y: hip.y - .28 * Math.cos(rad(trunk)) };
  const ear = { x: shoulder.x + .07 * Math.sin(rad(trunk)) * d, y: shoulder.y - .07 * Math.cos(rad(trunk)) };
  const wrist = o.exercise === 'rdl' ? { x: shoulder.x, y: shoulder.y + .25 } : { x: shoulder.x - .02 * d, y: shoulder.y + .01 };
  const p: CrouchPoint[] = Array.from({ length: 33 }, () => ({ x: .5, y: .5, visibility: 0 }));
  const pair = (i: number, q: { x: number; y: number }, w = .004) => { p[i] = { x: q.x - w, y: q.y, visibility: .9 }; p[i + 1] = { x: q.x + w, y: q.y, visibility: .9 }; };
  p[0] = { x: ear.x + .03 * d, y: ear.y + .01, visibility: .9 };
  pair(7, ear); pair(11, shoulder, spread * .14); pair(13, { x: (shoulder.x + wrist.x) / 2, y: (shoulder.y + wrist.y) / 2 }); pair(15, wrist);
  pair(23, hip, spread * .1); pair(25, knee); pair(27, ankle); pair(29, heel); pair(31, toe);
  if (o.swap) for (const i of [11, 23, 25, 27]) [p[i], p[i + 1]] = [p[i + 1], p[i]];
  return p;
}
/** Reps at 30 fps: rest, then each rep down over `down` s and up over its `up` s; `at(u)` the body at depth u (0-1). */
function reps(at: (u: number, frame: number) => CrouchPoint[], ups: number[], down = 1.5, rest = 1) {
  const frames: CrouchFrame[] = [];
  let time = 0;
  const push = (u: number) => { const n = frames.length; frames.push({ frame: n, pts: n / 30, pose: at(u, n) }); };
  const hold = (s: number) => { for (let k = 0; k < s * 30; k++) push(0); time += s; };
  hold(rest);
  for (const up of ups) {
    for (let k = 0; k < down * 30; k++) push((1 - Math.cos(Math.PI * k / (down * 30))) / 2);
    for (let k = 0; k < up * 30; k++) push((1 + Math.cos(Math.PI * k / (up * 30))) / 2);
    hold(rest);
  }
  return frames;
}
const squat = (u: number) => body(35 * u, 95 * u, 40 * u);
const O = { width: 1000, height: 1000 };

describe('squat and RDL form', () => {
  it('finds each squat, its times and the posture at the bottom', () => {
    const r = analyzeStrength(reps(squat, [1.5, 1.5, 1.5]), { ...O, exercise: 'squat' });
    expect(r.reason).toBeUndefined();
    expect(r.direction).toBe(1);
    expect(r.reps).toHaveLength(3);
    for (const rep of r.reps) {
      // From 10% of the hip's drop to the bottom: the 1.5 s less the slow start (the hip drops little at first).
      expect(rep.down).toBeGreaterThan(.85); expect(rep.down).toBeLessThan(1.5);
      expect(rep.up).toBeGreaterThan(.85); expect(rep.up).toBeLessThan(1.5);
      expect(Math.abs(rep.up - rep.down)).toBeLessThan(.05);
      expect(rep.low.thigh!).toBeCloseTo(5, 0);
      expect(rep.low.knee!).toBeCloseTo(50, 0);
      expect(rep.low.trunk!).toBeCloseTo(40, 0);
      expect(rep.low.shank!).toBeCloseTo(35, 0);
      expect(rep.low.hip!).toBeCloseTo(45, 0);
      expect(rep.heelRise!).toBeCloseTo(0, 1);
    }
    expect(r.view!).toBeLessThan(.1);
  });
  it('gives the same angles facing left, and with left and right swapped in some frames', () => {
    const right = analyzeStrength(reps(squat, [1.5, 1.5]), { ...O, exercise: 'squat' });
    const left = analyzeStrength(reps(u => body(35 * u, 95 * u, 40 * u, { dir: -1 }), [1.5, 1.5]), { ...O, exercise: 'squat' });
    const swapped = analyzeStrength(reps((u, n) => body(35 * u, 95 * u, 40 * u, { swap: n % 3 === 0 }), [1.5, 1.5]), { ...O, exercise: 'squat' });
    expect(left.direction).toBe(-1);
    for (const r of [left, swapped]) {
      expect(r.reps).toHaveLength(2);
      r.reps.forEach((rep, i) => { for (const k of ['knee', 'hip', 'trunk', 'shank', 'thigh'] as const) expect(rep.low[k]!).toBeCloseTo(right.reps[i].low[k]!, 0); });
    }
  });
  it('measures the nearer leg when the feet stand apart (the far foot higher in the picture), and draws it', async () => {
    // The far leg's knee and foot 0.06 higher and a little back, labelled right, or left in every third frame.
    const apart = (u: number, n: number) => {
      const p = body(35 * u, 95 * u, 40 * u), far = n % 3 === 0 ? 0 : 1;
      for (const i of [25, 27, 29, 31]) {
        const q = p[i + far];
        p[i + far] = { ...q, x: q.x - .02, y: q.y - .06 };
        if (far === 0) [p[i], p[i + 1]] = [p[i + 1], p[i]];
      }
      return p;
    };
    const plain = analyzeStrength(reps(squat, [1.5, 1.5]), { ...O, exercise: 'squat' });
    const r = analyzeStrength(reps(apart, [1.5, 1.5]), { ...O, exercise: 'squat' });
    expect(r.reps).toHaveLength(2);
    r.reps.forEach((rep, i) => { for (const k of ['knee', 'hip', 'trunk', 'shank', 'thigh'] as const) expect(rep.low[k]!).toBeCloseTo(plain.reps[i].low[k]!, 0); });
    // The picture's knee and ankle are the near ones (on both landmark sides).
    const { sideOn } = await import('../src/strength/figure');
    const shown = sideOn([{ frame: 0, pts: 0, pose: apart(1, 1) }], 'squat')[0].pose!, near = body(35, 95, 40);
    for (const i of [25, 26, 27, 28]) { expect(shown[i].y).toBeCloseTo(near[i].y, 6); }
  });
  it('tells the heel rising and how much slower the bar came up', () => {
    const r = analyzeStrength(reps(u => body(35 * u, 95 * u, 40 * u, { heel: 12 * u }), [1, 1, 1.25]), { ...O, exercise: 'squat' });
    expect(r.reps).toHaveLength(3);
    expect(r.reps[0].heelRise!).toBeCloseTo(12, 0);
    expect(r.reps[0].loss!).toBeCloseTo(0, 0);
    expect(r.reps[2].loss!).toBeGreaterThan(15); expect(r.reps[2].loss!).toBeLessThan(25);
  });
  it('finds RDLs by the trunk, the knees staying bent alike', () => {
    const r = analyzeStrength(reps(u => body(8 + 2 * u, 15 * u, 80 * u, { exercise: 'rdl' }), [1.5, 1.5]), { ...O, exercise: 'rdl' });
    expect(r.reps).toHaveLength(2);
    const rep = r.reps[0];
    expect(rep.low.trunk!).toBeCloseTo(80, 0);
    expect(rep.top.knee! - rep.low.knee!).toBeLessThan(20);
    expect(rep.low.hip!).toBeCloseTo(85, 0);
    // Hanging hands lie ahead of the legs as the trunk leans.
    expect(rep.maxGap!).toBeGreaterThan(0);
  });
  it('counts no rep before the athlete comes back up, and a quarter dip is no rep', () => {
    const frames = reps(squat, [1.5, 1.5]);
    const half = frames.slice(0, 30 + 45 + 45 + 30 + 45 + 10);
    const r = analyzeStrength(half, { ...O, exercise: 'squat' });
    expect(r.reps).toHaveLength(1);
    const dip = analyzeStrength(reps(u => body(8 * u, 20 * u, 8 * u), [1.5]), { ...O, exercise: 'squat' });
    expect(dip.reps).toHaveLength(0); expect(dip.reason).toBeTruthy();
  });
  it('marks a rep settled only once back at rest or the next one begun', () => {
    const t = Array.from({ length: 40 }, (_, i) => i / 10);
    const g = t.map(x => x < 1 ? 0 : x < 2 ? x - 1 : Math.max(.15, 3 - x));
    const live = findReps(t.slice(0, 28), g.slice(0, 28), .12);
    expect(live).toHaveLength(1); expect(live[0].complete).toBe(true); expect(live[0].settled).toBe(false);
    const later = findReps(t, g, .12);
    expect(later[0].settled).toBe(false);
    expect(findReps(t, t.map(x => x < 1 ? 0 : x < 2 ? x - 1 : Math.max(0, 3 - x)), .12)[0].settled).toBe(true);
  });
  it('sees a camera facing the athlete from the front', () => {
    const r = analyzeStrength(reps(u => body(35 * u, 95 * u, 40 * u, { spread: 2.2 }), [1.5]), { ...O, exercise: 'squat' });
    expect(r.view!).toBeGreaterThan(.5);
  });
});

describe('squat and RDL guides', () => {
  it('asks the trunk parallel to the shank or more upright (the bodyweight squat assessments)', async () => {
    const { strengthAdvice, emphasis, repCue } = await import('../src/strength/advice');
    expect(emphasis(18)).toContain('股関節'); expect(emphasis(-14)).toContain('膝'); expect(emphasis(4)).toBe('バランス型');
    // Thighs below level, trunk well ahead of the shank (a low-bar squat): no check for the lean.
    const r = analyzeStrength(reps(u => body(25 * u, 100 * u, 50 * u), [1.5, 1.5, 1.5]), { ...O, exercise: 'squat' });
    const advice = strengthAdvice(r);
    expect(advice.find(a => a.topic === '体幹と脛')!.level).toBe('check');
    expect(advice.find(a => a.topic === '深さ')!.level).toBe('good');
    expect(repCue(r, r.reps[0])).toBe('1回、良し');
    // Upright (a goblet squat's way): fine.
    const upright = analyzeStrength(reps(u => body(40 * u, 95 * u, 25 * u), [1.5]), { ...O, exercise: 'squat' });
    expect(strengthAdvice(upright).find(a => a.topic === '体幹と脛')!.level).toBe('good');
    // Just above level (within the points' error): told as about level, not shallow.
    const near = analyzeStrength(reps(u => body(35 * u, 85 * u, 35 * u), [1.5]), { ...O, exercise: 'squat' });
    expect(near.reps[0].low.thigh!).toBeCloseTo(-5, 0);
    expect(strengthAdvice(near).find(a => a.topic === '深さ')!.text).toContain('ほぼ水平');
    expect(repCue(near, near.reps[0])).toBe('1回、良し');
  });
  it('tells a shallow squat and a heel rising aloud', async () => {
    const { repCue, strengthAdvice } = await import('../src/strength/advice');
    const shallow = analyzeStrength(reps(u => body(25 * u, 70 * u, 25 * u), [1.5]), { ...O, exercise: 'squat' });
    expect(repCue(shallow, shallow.reps[0])).toBe('1回、浅め');
    // The heel told from RTMPose's points (a recorded video), not from the camera's MediaPipe alone.
    const frames = reps(u => body(35 * u, 95 * u, 40 * u, { heel: 25 * u }), [1, 1, 1.3]);
    const heel = analyzeStrength(frames.map(f => ({ ...f, refined: f.pose })), { ...O, exercise: 'squat' });
    expect(repCue(heel, heel.reps[0])).toBe('1回、かかと');
    const live = analyzeStrength(frames, { ...O, exercise: 'squat' });
    expect(repCue(live, live.reps[0])).toBe('1回、良し');
    expect(strengthAdvice(live).find(a => a.topic === 'かかと')).toBeUndefined();
    // Bodyweight: the speed's fall is not judged (it means fatigue only with a load lifted as fast as possible).
    expect(strengthAdvice(heel).find(a => a.topic === '上げる速さ')).toBeUndefined();
    expect(strengthAdvice(heel).find(a => a.topic === 'テンポ')!.text).toContain('下ろす');
  });
  it('flags an RDL whose knees keep bending', async () => {
    const { repCue, strengthAdvice } = await import('../src/strength/advice');
    const r = analyzeStrength(reps(u => body(8 + 20 * u, 30 * u, 70 * u, { exercise: 'rdl' }), [1.5, 1.5]), { ...O, exercise: 'rdl' });
    expect(r.reps).toHaveLength(2);
    expect(strengthAdvice(r).find(a => a.topic === '膝')!.level).toBe('check');
    expect(repCue(r, r.reps[0])).toBe('1回、膝が曲がった');
    const good = analyzeStrength(reps(u => body(8 + 2 * u, 12 * u, 80 * u, { exercise: 'rdl' }), [1.5, 1.5]), { ...O, exercise: 'rdl' });
    expect(strengthAdvice(good).find(a => a.topic === '膝')!.level).toBe('good');
  });
});

describe('RTMPose on fewer frames', () => {
  it('gives the bottoms the same angles with RTMPose on every other frame and round each bottom', async () => {
    const { refineTargets } = await import('../src/strength/recording');
    // RTMPose's points: the same body a little off MediaPipe's (another model), so mixing them would show.
    const shift = (p: CrouchPoint[]) => p.map(q => ({ ...q, x: q.x + .004, y: q.y - .003 }));
    const base = reps((u, n) => body(35 * u, 95 * u, 40 * u, { heel: 10 * u * (n % 7 === 3 ? 1.1 : 1) }), [1.4, 1.5, 1.6]);
    const all = base.map(f => ({ ...f, refined: shift(f.pose!) }));
    const targets = refineTargets(base, 1000, 1000);
    expect(targets.size).toBeLessThan(.65 * base.length);
    const some = base.map(f => targets.has(f.frame) ? { ...f, refined: shift(f.pose!) } : { ...f });
    const a = analyzeStrength(all, { ...O, exercise: 'squat' }), b = analyzeStrength(some, { ...O, exercise: 'squat' });
    expect(b.reps).toHaveLength(3);
    b.reps.forEach((rep, i) => {
      for (const k of ['knee', 'hip', 'trunk', 'shank', 'thigh'] as const) expect(rep.low[k]!).toBeCloseTo(a.reps[i].low[k]!, 5);
      expect(rep.down).toBe(a.reps[i].down); expect(rep.loss).toBe(a.reps[i].loss);
      expect(Math.abs(rep.heelRise! - a.reps[i].heelRise!)).toBeLessThan(.5);
    });
  });
});

/** A single-leg RDL: standing on `stance` (0 left, 1 right in the model's names), the trunk leaning `trunk` degrees and
 * the lifted leg `lag` degrees short of the trunk's line; the standing knee bent `knee` degrees. */
function oneLeg(trunk: number, lag: number, knee: number, stance: 0 | 1, dir = 1): CrouchPoint[] {
  const p = body(knee * .6, knee * .4 + trunk * .05, trunk, { dir, exercise: 'rdl' });
  const hip = { x: (p[23].x + p[24].x) / 2, y: (p[23].y + p[24].y) / 2 }, back = rad(trunk - lag);
  const at = (l: number) => ({ x: hip.x - l * Math.sin(back) * dir, y: hip.y + l * Math.cos(back), visibility: .9 });
  const free = (1 - stance) as 0 | 1;
  // The standing leg's points from the body (both sides alike there), the lifted leg behind and up.
  for (const i of [25, 27, 29, 31]) p[i + stance] = { ...p[i + stance] };
  p[25 + free] = at(.22); p[27 + free] = at(.44); p[29 + free] = at(.46); p[31 + free] = at(.5);
  return p;
}
describe('single-leg RDL', () => {
  it('tells the standing leg by the lower ankle and measures the trunk against the lifted leg', async () => {
    const { repCue, strengthAdvice } = await import('../src/strength/advice');
    for (const stance of [0, 1] as const) {
      const straight = analyzeStrength(reps(u => oneLeg(80 * u, 0, 20 * u * .2, stance), [1.5, 1.5]), { ...O, exercise: 'slrdl' });
      expect(straight.reps).toHaveLength(2);
      expect(straight.reps[0].low.line!).toBeGreaterThan(175);
      expect(straight.reps[0].low.trunk!).toBeCloseTo(80, 0);
      expect(repCue(straight, straight.reps[0])).toBe('1回、良し');
      const lagging = analyzeStrength(reps(u => oneLeg(80 * u, 30 * u, 4 * u, stance), [1.5]), { ...O, exercise: 'slrdl' });
      expect(lagging.reps[0].low.line!).toBeCloseTo(150, 0);
      expect(strengthAdvice(lagging).find(a => a.topic === '体幹と脚の一直線')!.level).toBe('check');
      expect(lagging.reps[0].low.legBelow).toBe(true);
      expect(repCue(lagging, lagging.reps[0])).toBe('1回、脚が下がった');
      const high = analyzeStrength(reps(u => oneLeg(80 * u, -30 * u, 4 * u, stance), [1.5]), { ...O, exercise: 'slrdl' });
      expect(high.reps[0].low.legBelow).toBe(false);
      expect(repCue(high, high.reps[0])).toBe('1回、脚が上がりすぎ');
    }
  });
  it('keeps the standing leg when the model swaps left and right in some frames', () => {
    const r = analyzeStrength(reps((u, n) => { const p = oneLeg(80 * u, 10 * u, 4 * u, 0);
      if (n % 4 === 1) for (const i of [25, 27, 29, 31]) [p[i], p[i + 1]] = [p[i + 1], p[i]];
      return p; }, [1.5, 1.5]), { ...O, exercise: 'slrdl' });
    expect(r.reps).toHaveLength(2);
    expect(r.reps[0].low.line!).toBeCloseTo(170, 0);
  });
});

describe('the exercise chosen', () => {
  it('tells why the camera did not start, in Japanese, with what to do', async () => {
    const { cameraTrouble } = await import('../src/strength/StrengthLab');
    const err = (name: string) => Object.assign(new Error('The request is not allowed by the user agent'), { name });
    expect(cameraTrouble(err('NotAllowedError'))).toContain('Webサイトの設定');
    expect(cameraTrouble(new DOMException('x', 'NotAllowedError'))).toContain('許可');
    expect(cameraTrouble(err('NotReadableError'))).toContain('ほかのアプリ');
    expect(cameraTrouble(err('OverconstrainedError'))).toContain('見つかりません');
    expect(cameraTrouble(new Error('骨格モデルを開始できませんでした。'))).toBe('骨格モデルを開始できませんでした。');
    // The worker's codes, the browser's and the model's English, and a video file's advice: in Japanese, for a camera.
    expect(cameraTrouble(new Error('CAMERA_WORKER_TIMEOUT'))).toContain('時間がかかりすぎました');
    expect(cameraTrouble(new Error('CAMERA_WORKER_FAILED'))).toContain('続けられませんでした');
    expect(cameraTrouble(err('AbortError'))).toContain('カメラを開けませんでした');
    expect(cameraTrouble(new Error('Packet timestamp mismatch on a calculator'))).toMatch(/^カメラでの計測を続けられませんでした（Packet timestamp mismatch/);
    expect(cameraTrouble(new Error('この動画を再生できません。別の形式で保存してください。'))).not.toContain('別の形式');
  });
  it('averages the mirrored reading with its legs named as in the first reading', async () => {
    const { matched } = await import('../src/strength/fine');
    // Halpe26: the left leg at x 100, the right at x 200; the mirrored reading names them the other way round.
    const first = Array.from({ length: 26 }, (_, i) => ({ x: [11, 13, 15, 20, 22, 24].includes(i) ? 100 : [12, 14, 16, 21, 23, 25].includes(i) ? 200 : 150, y: i * 10, score: 1 }));
    const swapped = first.map((_, i) => { const pair = [[11, 12], [13, 14], [15, 16], [20, 21], [22, 23], [24, 25]].find(p => p.includes(i)); return pair ? { ...first[pair[0] === i ? pair[1] : pair[0]] } : { ...first[i] }; });
    expect(matched(first, swapped).map(q => q.x)).toEqual(first.map(q => q.x));
    expect(matched(first, first).map(q => q.x)).toEqual(first.map(q => q.x));
  });
  it('asks again when a squat is analysed as an RDL, and an RDL as a squat', async () => {
    const { strengthAdvice } = await import('../src/strength/advice');
    const squatAsRdl = analyzeStrength(reps(u => body(35 * u, 95 * u, 40 * u), [1.5, 1.5]), { ...O, exercise: 'slrdl' });
    expect(strengthAdvice(squatAsRdl).find(a => a.topic === '種目')).toBeDefined();
    const rdlAsSquat = analyzeStrength(reps(u => body(8 + 2 * u, 30 * u, 80 * u, { exercise: 'rdl' }), [1.5, 1.5]), { ...O, exercise: 'squat' });
    if (rdlAsSquat.reps.length) expect(strengthAdvice(rdlAsSquat).find(a => a.topic === '種目')).toBeDefined();
    const rdl = analyzeStrength(reps(u => body(8 + 2 * u, 12 * u, 80 * u, { exercise: 'rdl' }), [1.5, 1.5]), { ...O, exercise: 'rdl' });
    expect(strengthAdvice(rdl).find(a => a.topic === '種目')).toBeUndefined();
  });
});
