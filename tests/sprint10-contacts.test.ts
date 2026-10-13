import { describe, expect, it } from 'vitest';
import type { CrouchFrame, CrouchPoint } from '../src/sprint10/crouch';
import { runContacts, sectionTimes, stepTimes } from '../src/sprint10/sprint-contacts';

// A runner crossing a 1920x1080 picture to the right at 8 m/s (160 px/m), filmed at 120 fps: a step every 0.24 s,
// each foot down for 0.11 s (contact) and up for 0.13 s (flight) in turn, planted under the pelvis at mid-contact.
const W = 1920, H = 1080, GROUND = 820, SPEED = 8 * 160, STEP = .24, CONTACT = .11, FIRST = .1;
const hipX = (t: number) => 100 + SPEED * t;
function frames(until = 1.4): CrouchFrame[] {
  const out: CrouchFrame[] = [];
  for (let frame = 0; frame / 120 <= until; frame++) {
    const t = frame / 120, hx = hipX(t), hy = 600;
    const pose: CrouchPoint[] = Array.from({ length: 33 }, () => ({ x: hx / W, y: (hy - 200) / H, visibility: .9 }));
    const put = (k: number, x: number, y: number) => { pose[k] = { x: x / W, y: y / H, visibility: .9 }; };
    put(11, hx - 20, hy - 180); put(12, hx + 20, hy - 180); put(23, hx - 12, hy); put(24, hx + 12, hy);
    for (const side of [0, 1] as const) {
      // Steps alternate sides: step k (from FIRST + k STEP) is on side k % 2.
      const k = Math.floor((t - FIRST) / STEP), down = k >= 0 && k % 2 === side && t - FIRST - k * STEP <= CONTACT;
      const mid = FIRST + k * STEP + CONTACT / 2;
      const toe = down ? { x: hipX(mid) + 25, y: GROUND } : { x: hx + (side ? 80 : -80) + 25, y: GROUND - 120 };
      const ankle = { x: toe.x - 25, y: toe.y - 25 };
      put(25 + side, (hx + ankle.x) / 2 + 20, (hy + ankle.y) / 2); put(27 + side, ankle.x, ankle.y); put(29 + side, toe.x - 45, toe.y - 5); put(31 + side, toe.x, toe.y);
    }
    out.push({ frame, pts: t, pose });
  }
  return out;
}

describe('the 10 m steps as the crouch start\'s', () => {
  it('finds each step\'s touchdown and toe-off and their times', () => {
    const r = runContacts(frames(), W, H)!;
    expect(r.direction).toBe(1);
    const whole = r.contacts.filter(c => c.touchdown !== null && c.toeOff !== null);
    expect(whole.length).toBeGreaterThanOrEqual(4);
    const steps = stepTimes(r.contacts, .3, 1.2);
    for (const s of steps.filter(s => s.contact !== null)) expect(s.contact!).toBeCloseTo(CONTACT, 1);
    for (const s of steps.filter(s => s.flight !== null)) expect(s.flight!).toBeCloseTo(STEP - CONTACT, 1);
    const sec = sectionTimes(steps);
    expect(sec.steps).toBeGreaterThan(2);
    expect(sec.contact!).toBeCloseTo(CONTACT, 1); expect(sec.flight!).toBeCloseTo(STEP - CONTACT, 1);
  });
  it('takes the frames the user set, and the times follow', () => {
    const f = frames(), r = runContacts(f, W, H)!, c = r.contacts.find(k => k.touchdownFrame !== null && k.toeOffFrame != null)!;
    const moved = runContacts(f, W, H, { [`td${c.index}`]: c.touchdownFrame! - 3, [`to${c.index}`]: c.toeOffFrame! + 2 })!;
    const before = stepTimes(r.contacts, 0, 2).find(s => s.index === c.index)!, after = stepTimes(moved.contacts, 0, 2).find(s => s.index === c.index)!;
    expect(after.contact! - before.contact!).toBeCloseTo(5 / 120, 6);
    // Only that step's times (and the flight before it, which ends at its touchdown) change.
    expect(moved.contacts.filter(k => k.index !== c.index)).toEqual(r.contacts.filter(k => k.index !== c.index));
  });
  it('counts only the steps set down between the crossings in the section', () => {
    const steps = stepTimes(runContacts(frames(), W, H)!.contacts, .55, .95);
    expect(steps.filter(s => s.inSection).every(s => s.touchdown! >= .55 && s.touchdown! <= .95)).toBe(true);
    expect(sectionTimes(stepTimes([], null, null))).toEqual({ contact: null, flight: null, steps: 0 });
  });
});

describe('a standing start and the tracker\'s corrections', () => {
  // The runner stands still for 0.5 s with both feet down (staggered), then runs as above.
  const T0 = .5;
  function standing(): CrouchFrame[] {
    const run = frames(1.4);
    const still: CrouchFrame[] = [];
    for (let frame = 0; frame / 120 < T0; frame++) {
      const pose = run[0].pose!.map(p => ({ ...p }));
      const put = (k: number, x: number, y: number) => { pose[k] = { x: x / W, y: y / H, visibility: .9 }; };
      for (const [side, dx] of [[0, -40], [1, 50]] as const) {
        put(27 + side, 100 + dx - 25, GROUND - 25); put(29 + side, 100 + dx - 45, GROUND - 5); put(31 + side, 100 + dx, GROUND);
      }
      still.push({ frame, pts: frame / 120, pose });
    }
    return [...still, ...run.map(f => ({ frame: f.frame + still.length, pts: f.pts + T0, pose: f.pose }))];
  }
  it('leaves the stance out of a standing start\'s steps', () => {
    const all = runContacts(standing(), W, H)!, steps = runContacts(standing(), W, H, undefined, true)!;
    expect(all.contacts[0].touchdown).toBeNull();   // down from the first frame: the stance, listed as a step
    expect(steps.contacts[0].touchdown).not.toBeNull();
    expect(steps.contacts[0].touchdown!).toBeGreaterThan(T0);
    expect(steps.contacts.every(c => c.touchdown === null || c.toeOff === null || c.toeOff - c.touchdown < .4)).toBe(true);
  });
  it('revises the poses kept beside the samples as the tracker revised them', async () => {
    const { revisePoses } = await import('../src/sprint10/frame-processor');
    const poses = new Map([[1, 'jogger'], [2, 'jogger'], [3, 'jogger']]), times = new Map([[0, 0], [1, .1], [2, .2], [3, .3]]);
    revisePoses(poses, times, .2, [{ frameIndex: 0, pose: 'runner' }, { frameIndex: 2, pose: 'runner' }]);
    expect([...poses.entries()].sort()).toEqual([[0, 'runner'], [1, 'jogger'], [2, 'runner']]);
  });
});

describe('the number boxes', () => {
  it('takes what is typed as a number within its range', async () => {
    const { numberInput } = await import('../src/sprint10/number-input');
    expect(numberInput('０５０', 0, 400, true)).toEqual({ text: '50', value: 50, low: false });   // full-width, a leading zero
    expect(numberInput('50.5', 0, 400, true)).toEqual({ text: '50', value: 50, low: false });     // a whole number stops at the point
    expect(numberInput('10,5', 1, 100, false)).toEqual({ text: '10.5', value: 10.5, low: false }); // a comma as the decimal point
    expect(numberInput('1.2.3', 1, 100, false)).toEqual({ text: '1.23', value: 1.23, low: false });
    expect(numberInput('1000', 1, 100, false)).toEqual({ text: '100', value: 100, low: false });  // past the largest: what is used
    expect(numberInput('', 1, 100, false)).toEqual({ text: '', value: null, low: false });
    expect(numberInput('.', 1, 100, false)).toEqual({ text: '.', value: null, low: false });
    // Below the smallest the typing is kept and marked low, so a box does not take the smallest for it (a weight's 5 on
    // the way to 55 became 20).
    expect(numberInput('5', 20, 150, false)).toEqual({ text: '5', value: 20, low: true });
    expect(numberInput('55', 20, 150, false)).toEqual({ text: '55', value: 55, low: false });
    expect(numberInput('1', 1, 100, false)).toEqual({ text: '1', value: 1, low: false });
  });
});

describe('the toe-offs where the shoe\'s tip leaves the ground (read again against the picture, 2026-10-13)', () => {
  // The frames each step is down: from its first frame on the ground to its last.
  const downFrames = (k: number) => { const a = Math.ceil((FIRST + k * STEP) * 120 - 1e-9), b = Math.floor((FIRST + k * STEP + CONTACT) * 120 + 1e-9); return [a, b]; };
  it('times a contact from the edge before its first frame down to the edge after its last', () => {
    const r = runContacts(frames(), W, H)!;
    for (const c of r.contacts.filter(c => c.touchdown !== null && c.toeOff !== null)) {
      const k = Math.round((c.touchdownFrame! / 120 - FIRST) / STEP), [a, b] = downFrames(k);
      expect([c.touchdownFrame, c.toeOffFrame]).toEqual([a, b]);
      expect(c.touchdown!).toBeCloseTo((a - .5) / 120, 9);
      expect(c.toeOff!).toBeCloseTo((b + .5) / 120, 9);
    }
  });
  it('keeps the toe down while the heel rises, the toe point up to 0.07 leg lengths above the ground', async () => {
    const { LIFT_BAND, legLength } = await import('../src/sprint10/contacts');
    const { SPRINT_CONTACT } = await import('../src/sprint10/sprint-contacts');
    expect(SPRINT_CONTACT.liftBand).toBe(.09); expect(LIFT_BAND).toBe(.05);   // the other events keep theirs
    // The toe point rises in the last 4 frames of each contact (to 0.07 leg lengths) while the tip is still down.
    const plain = frames(), leg = legLength(plain.filter(f => f.pose), W, H);
    const rising = plain.map(f => {
      const pose = f.pose!.map(p => ({ ...p }));
      for (const side of [0, 1]) {
        const k = Math.floor((f.pts - FIRST) / STEP), [, b] = k >= 0 && k % 2 === side ? downFrames(k) : [0, -9];
        if (b - f.frame >= 0 && b - f.frame < 4) pose[31 + side] = { ...pose[31 + side], y: pose[31 + side].y - (4 - (b - f.frame)) / 4 * .07 * leg / H };
      }
      return { ...f, pose };
    });
    const r = runContacts(rising, W, H)!;
    for (const c of r.contacts.filter(c => c.toeOff !== null && c.touchdown !== null)) {
      const k = Math.round((c.touchdownFrame! / 120 - FIRST) / STEP);
      expect(c.toeOffFrame).toBe(downFrames(k)[1]);   // 0.05 put it up to 2 frames early
    }
  });
  it('marks a frame down in 確認 by the band the step is judged with', async () => {
    const { footDown } = await import('../src/sprint10/crouch-edit');
    const { SPRINT_CONTACT } = await import('../src/sprint10/sprint-contacts');
    const { legLength } = await import('../src/sprint10/contacts');
    const plain = frames(), leg = legLength(plain.filter(f => f.pose), W, H), f = plain[0];
    // one toe 0.07 leg lengths above its ground level (the heel up, the tip down), the other far off
    const pose = f.pose!.map(p => ({ ...p }));
    pose[31] = { x: 500 / W, y: (GROUND - .07 * leg) / H, visibility: .9 }; pose[32] = { x: 1500 / W, y: (GROUND - 120) / H, visibility: .9 };
    const m = { kind: 'toeOff', focus: { x: 500 / W, y: GROUND / H }, ground: GROUND / H };
    expect(footDown({ ...f, pose }, m, W, H, leg, SPRINT_CONTACT.liftBand)).toBe(true);   // the 10 m judges it down
    expect(footDown({ ...f, pose }, m, W, H, leg)).toBe(false);                           // the hurdle's and the jumps' band
  });
  it('times a frame set by hand at its edge too', () => {
    const f = frames(), r = runContacts(f, W, H)!, c = r.contacts.find(k => k.touchdownFrame !== null && k.toeOffFrame != null)!;
    const moved = runContacts(f, W, H, { [`to${c.index}`]: c.toeOffFrame! + 1 })!.contacts.find(k => k.index === c.index)!;
    expect(moved.toeOffFrame).toBe(c.toeOffFrame! + 1);
    expect(moved.toeOff!).toBeCloseTo((c.toeOffFrame! + 1.5) / 120, 9);
  });
});

describe('a stretch where the runner was not followed', () => {
  it('gives no touchdown time for a step set down while the runner was lost', () => {
    // The runner not followed from 0.68 s to 0.80 s: the step set down at 0.70 s is first seen at 0.80 s.
    const lost = frames().map(f => f.pts > .68 && f.pts < .8 ? { ...f, pose: null } : f);
    const all = runContacts(frames(), W, H)!, gapped = runContacts(lost, W, H)!;
    const at = (r: typeof all, t: number) => r.contacts.find(c => (c.toeOff ?? 0) > t && (c.touchdown ?? -1) < t + .2);
    expect(at(all, .7)!.touchdown).not.toBeNull();
    expect(at(gapped, .7)!.touchdown).toBeNull();   // not a late time
    expect(gapped.contacts.filter(c => c.touchdown !== null).length).toBe(all.contacts.filter(c => c.touchdown !== null).length - 1);
  });
  it('gives no 50 m time for a section run faster than anyone has run', async () => {
    const { target50 } = await import('../src/sprint10/target50');
    expect(target50(50, 10, .55)).toBeNull();
    expect(target50(50, 10, 1.909)?.time).toBeCloseTo(10.64, 1);
  });
});
