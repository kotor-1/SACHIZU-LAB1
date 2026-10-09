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
