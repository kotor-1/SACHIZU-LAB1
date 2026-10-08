/** The judged moments of a side-view event the user may check and set by hand (the hurdle, the long jump, the high
 * jump, the throws, the 10 m's gate crossings in gate-check.ts; the crouch start has its own in crouch-edit.ts), shared:
 * the contacts with the user's frames in place of the judged ones, the moments to check, the flags for an unclear
 * video, and what a frame would change (the user, 2026-10-07: 「他のモードにも同じように自動解析と微調整モード追加しましょう」). */
import { median, TOE, type Contact } from './contacts';
import type { CrouchFrame } from './crouch';

/** The frames the user chose, by moment key: `td{n}` / `to{n}` for contact n's touchdown / toe-off, others by event. */
export type Edits = Readonly<Record<string, number>>;
export interface ReviewMoment {
  key: string; kind: 'clearance' | 'touchdown' | 'toeOff' | 'release' | 'crossing';
  /** The contact's index (`td{n}`, `to{n}`), else null. */
  step: number | null;
  label: string; short: string;
  /** The frame now (the user's, or else the judged one) and the judged one. */
  frame: number; pts: number; autoFrame: number;
  /** Where to look (normalized): the foot where it is set down (the hand at the release, the line at the pelvis's
   * height for a gate crossing). */
  focus: { x: number; y: number } | null;
  /** The ground level under the foot (normalized y), for the line drawn there; null when not on the ground. */
  ground: number | null;
  /** Why the moment is worth a look, or null. */
  flag: string | null;
  /** The colour of the line drawn at a gate crossing (as on the player), else the default. */
  color?: string;
}
/** A value a moment's frame changes, before and after. */
export interface ReviewEffect { label: string; from: number | null; to: number | null; unit: string; digits: number }
/** A value of a result shown in the check (seconds, metres, degrees, ...). */
export interface ReviewValue { label: string; value: number | null; unit: string; digits: number }

/** The contacts with the user's frames: `td{n}` and `to{n}` (n: the contact's index) set its touchdown and toe-off. */
export function editContacts(contacts: readonly Contact[], edits: Edits, frames: readonly CrouchFrame[]): Contact[] {
  if (!Object.keys(edits).length) return [...contacts];
  const byFrame = new Map(frames.map(f => [f.frame, f]));
  return contacts.map(c => {
    const td = byFrame.get(edits[`td${c.index}`]), to = byFrame.get(edits[`to${c.index}`]);
    return { ...c, ...(td && c.touchdown !== null ? { touchdown: td.pts, touchdownFrame: td.frame } : {}),
      ...(to && c.toeOff !== null ? { toeOff: to.pts, toeOffFrame: to.frame } : {}) };
  });
}

/** The touchdown and toe-off of the contacts chosen (by index, with their names), in time order, with the user's frames.
 * `auto`: the contacts as judged. */
export function contactMoments(auto: readonly Contact[], edits: Edits, frames: readonly CrouchFrame[], W: number, H: number,
  chosen: readonly { index: number; name: string; short: string }[]): ReviewMoment[] {
  const byFrame = new Map(frames.map(f => [f.frame, f])), out: ReviewMoment[] = [];
  for (const { index, name, short } of chosen) {
    const c = auto.find(k => k.index === index); if (!c) continue;
    const focus = { x: c.x / W, y: c.groundY / H };
    const add = (key: string, kind: 'touchdown' | 'toeOff', label: string, s: string, autoFrame: number | null | undefined) => {
      if (autoFrame == null) return;
      const frame = edits[key] !== undefined && byFrame.has(edits[key]) ? edits[key] : autoFrame, f = byFrame.get(frame);
      if (f) out.push({ key, kind, step: index, label, short: s, frame, pts: f.pts, autoFrame, focus, ground: c.groundY / H, flag: null });
    };
    if (c.touchdown !== null) add(`td${index}`, 'touchdown', `${name}の接地`, `${short}接地`, c.touchdownFrame);
    if (c.toeOff !== null) add(`to${index}`, 'toeOff', `${name}の離地`, `${short}離地`, c.toeOffFrame);
  }
  return out.sort((a, b) => a.autoFrame - b.autoFrame);
}

/** Moments where the toe point around the judged frame (±3) is faint (median confidence under one half: dark, blurred)
 * or the pose is missing in two frames or more: worth a look (the moments keep any flag they had). */
export function poseFlags(list: ReviewMoment[], frames: readonly CrouchFrame[], W: number) {
  for (const m of list) {
    if (m.flag || !m.focus || m.kind === 'release' || m.kind === 'crossing') continue;
    const around = frames.filter(f => Math.abs(f.frame - m.autoFrame) <= 3);
    const toes = around.flatMap(f => { if (!f.pose) return []; const p = nearestToe(f.pose, m.focus!.x, W); return p ? [p.visibility ?? 0] : []; });
    if (around.filter(f => !f.pose).length >= 2) m.flag = '骨格が取れていないコマがあります。映像で確かめてください。';
    else if (toes.length && median(toes) < .5) m.flag = '足先がはっきり映っていません（暗い・ぶれている）。映像で確かめてください。';
  }
  return list;
}

/** Two values alike as shown (rounded to their digits). */
const shown = (v: number | null, digits: number) => v === null ? '—' : v.toFixed(digits);
/** What setting a moment to a frame changes: the values that differ from now as shown. With the frame it has now, the
 * values that depend on it (`related`), as they are. */
export function effectsBetween(now: readonly ReviewValue[], then: readonly ReviewValue[], related: readonly string[] = []): ReviewEffect[] {
  return now.flatMap(v => {
    const w = then.find(q => q.label === v.label), to = w ? w.value : null;
    return shown(v.value, v.digits) !== shown(to, v.digits) || related.includes(v.label) ? [{ label: v.label, from: v.value, to, unit: v.unit, digits: v.digits }] : [];
  });
}
/** The values that depend on a moment: those that change as shown when it is moved two frames (on, or back). */
export function relatedValues(now: readonly ReviewValue[], on: readonly ReviewValue[], back: readonly ReviewValue[]) {
  return now.filter((v, i) => shown(v.value, v.digits) !== shown(on[i]?.value ?? null, v.digits) || shown(v.value, v.digits) !== shown(back[i]?.value ?? null, v.digits)).map(v => v.label);
}

const nearestToe = (pose: readonly { x: number; y: number; visibility?: number }[], x: number, W: number) =>
  TOE.map(k => pose[k]).filter(p => p && Number.isFinite(p.x)).reduce<{ x: number; y: number; visibility?: number } | null>((b, p) =>
    !b || Math.abs(p.x - x) * W < Math.abs(b.x - x) * W ? p : b, null);
