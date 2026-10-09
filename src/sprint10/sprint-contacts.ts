/** The 10 m's and the flying section's steps as the crouch start's (the user, 2026-10-09: 「クラウチングスタートと同じ
 * ような表示、機能にしてください。手動調整したら自動で数値が変わるようにしてください」): each step's touchdown and
 * toe-off on MediaPipe's toes in the frames the runner was followed, found as the hurdle finds its contacts
 * (contacts.ts, hurdling/analysis.ts), with the frames the user set (moment-edits.ts), and each step's contact and flight
 * times. The section's own measures (time, steps, cadence, stride: analysis.ts) are not taken from these. */
import type { CrouchFrame, CrouchPoint } from './crouch';
import { contactOf, contactPlants, legLength, plantedToes, plantsOf, toesOf, visible, type Contact } from './contacts';
import { editContacts, type Edits } from './moment-edits';

/** Plants this many leg lengths above the lowest are not on the ground (as the hurdle). */
const GROUND_SPREAD = .4;
export interface RunContacts { contacts: Contact[]; leg: number; direction: number }

/** The contacts in time order (`edits`: the user's frames by `td{n}` / `to{n}`); null without enough of the runner. */
export function runContacts(frames: readonly CrouchFrame[], W: number, H: number, edits?: Edits): RunContacts | null {
  const seen = frames.filter(f => f.pose);
  if (seen.length < 10) return null;
  const leg = legLength(seen, W, H);
  if (!(leg > 0)) return null;
  const hipX = (p: CrouchPoint[]) => visible(p[23], .3) && visible(p[24], .3) ? (p[23].x + p[24].x) / 2 : null;
  const hips = seen.flatMap(f => { const x = hipX(f.pose!); return x === null ? [] : [x]; });
  const direction = hips.length > 1 ? Math.sign(hips.at(-1)! - hips[0]) : 0;
  if (!direction) return null;
  const toes = toesOf(seen, W, H), plants = contactPlants(plantsOf(plantedToes(toes, leg), leg), leg, direction);
  if (!plants.length) return { contacts: [], leg, direction };
  const ground = Math.max(...plants.map(p => p.y));
  const onGround = plants.filter(p => ground - p.y < GROUND_SPREAD * leg);
  let contacts = onGround.map((p, i) => contactOf(p, i + 1, toes, leg, seen.at(-1)!.pts, seen[0].pts));
  if (edits && Object.keys(edits).length) contacts = editContacts(contacts, edits, frames);
  return { contacts, leg, direction };
}

export interface StepTime {
  index: number; touchdown: number | null; toeOff: number | null;
  /** Touchdown to toe-off, and toe-off to the next touchdown (s); null when either is not in the picture. */
  contact: number | null; flight: number | null;
  /** Set down between the two gate crossings. */
  inSection: boolean;
}
export function stepTimes(contacts: readonly Contact[], from: number | null, to: number | null): StepTime[] {
  const lo = from === null || to === null ? null : Math.min(from, to), hi = from === null || to === null ? null : Math.max(from, to);
  return contacts.map((c, i) => {
    const next = contacts[i + 1], at = c.touchdown ?? c.toeOff;
    return { index: c.index, touchdown: c.touchdown, toeOff: c.toeOff,
      contact: c.touchdown !== null && c.toeOff !== null ? c.toeOff - c.touchdown : null,
      flight: c.toeOff !== null && next && next.touchdown !== null ? next.touchdown - c.toeOff : null,
      inSection: lo !== null && hi !== null && at !== null && at >= lo && at <= hi };
  });
}
/** The section's mean contact and flight times over its steps. */
export function sectionTimes(steps: readonly StepTime[]): { contact: number | null; flight: number | null; steps: number } {
  const inside = steps.filter(s => s.inSection), mean = (v: number[]) => v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
  return { contact: mean(inside.flatMap(s => s.contact === null ? [] : [s.contact])), flight: mean(inside.flatMap(s => s.flight === null ? [] : [s.flight])), steps: inside.length };
}
