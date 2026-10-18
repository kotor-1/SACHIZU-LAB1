/** The crouch start with its moments set by hand, for phones too slow for the whole analysis (the user, 2026-10-16:
 * 「スマホが低スペックの人向けに、動画をアップロード→解析したい局面にフレームを自分で合わせる→そこだけAI解析みたいな
 * モード」, then 「クラウチングで試作してみて！」). The user sets each moment in turn: the set, the front foot leaving its
 * block, each touchdown and toe-off, the next touchdown and toe-off guessed from the times before. The pose models look
 * only at those frames (and a few round the set and the clearance, whose postures are medians as in the analysis).
 * The values are the analysis' with the same frames set in 確認 (crouch-edit.ts): the moments' times at the frames'
 * edges, the postures and the steps as crouch.ts measures them. Nothing needs the whole run: no force of the block or
 * forward force (ground-force.ts follows the body through every frame). */
import { median, quantile, TOE, visible, type Contact } from './contacts';
import { CROUCH_VERSION, frameEdge, MAX_STEPS, posture, stepsOf, type CrouchFrame, type CrouchResult } from './crouch';
import { mendFeet } from './leg-check';

export const PICK_VERSION = `${CROUCH_VERSION}+picked-v0`;
export type PickKind = 'set' | 'clearance' | 'touchdown' | 'toeOff';
export interface PickStep { key: string; kind: PickKind; step: number | null; label: string; short: string }
/** The moments in the order they are set. */
export const PICK_STEPS: readonly PickStep[] = [
  { key: 'set', kind: 'set', step: null, label: '構え', short: '構え' },
  { key: 'clearance', kind: 'clearance', step: null, label: 'ブロックを離れる瞬間', short: '離れる' },
  ...Array.from({ length: MAX_STEPS }, (_, i): PickStep[] => [
    { key: `td${i + 1}`, kind: 'touchdown', step: i + 1, label: `${i + 1}歩目の接地`, short: `${i + 1}接地` },
    { key: `to${i + 1}`, kind: 'toeOff', step: i + 1, label: `${i + 1}歩目の離地`, short: `${i + 1}離地` }]).flat()];
/** The frame set for each moment, by key. */
export type Picks = Readonly<Record<string, number>>;
export const stepOf = (key: string) => PICK_STEPS.find(s => s.key === key) ?? null;
/** The moment to set next: the first in order not set; null once all are. */
export const nextPick = (picks: Picks): PickStep | null => PICK_STEPS.find(s => picks[s.key] === undefined) ?? null;
/** The moments set, in order (up to the first not set: those after it do not count). */
export function pickedSteps(picks: Picks): PickStep[] {
  const out: PickStep[] = [];
  for (const s of PICK_STEPS) { if (picks[s.key] === undefined) break; out.push(s); }
  return out;
}
/** Enough moments for a result: the set, the clearance and the first touchdown. */
export const pickedEnough = (picks: Picks) => ['set', 'clearance', 'td1'].every(k => picks[k] !== undefined);

/** The times the next moment is guessed from (s) where the steps before do not tell it: the block to the first
 * touchdown, the first contact and the flight after it. Later contacts are the one before times SHRINK (they shorten
 * step by step), later flights the one before. On the three SD athletes' moments read from the pictures (240 fps,
 * dev-validation/crouch/truth-to-20261012.json, each moment guessed from the true ones before it) the guesses were 2.7
 * frames off on average, 15 of 18 within 4 (the strip of frames in the check shows 4 either side), at most 10 (the first
 * touchdown of an athlete whose first flight was 0.10 s); the analysis' own moments are 1.4-1.5 off. The first five
 * steps of sprinters last 0.12-0.23 s on the ground and 0.05-0.10 s in the air, and the first touchdown comes
 * 0.045±0.025 s after the block (crouch-edit.ts). */
export const GUESS = { firstFlight: .06, firstContact: .18, flight: .05, shrink: .95 };

/** A moment's time at its frame's edge (crouch.ts frameEdge): a touchdown before its first frame with the foot down, a
 * toe-off and the clearance after the last. */
const sideOf = (kind: PickKind): -1 | 1 => kind === 'touchdown' ? -1 : 1;
export function pickTime(key: string, picks: Picks, frames: readonly CrouchFrame[]): number | null {
  const s = stepOf(key), frame = picks[key];
  return s && frame !== undefined ? frameEdge(frames, frame, sideOf(s.kind)) : null;
}
/** The frame whose edge (`side` as frameEdge) is nearest the time `t`; null outside the video. `frames` in time order. */
export function frameAtEdge(frames: readonly CrouchFrame[], t: number, side: -1 | 1): number | null {
  const n = frames.length;
  if (!n) return null;
  const edge = (i: number) => {
    const next = frames[i + side], back = frames[i - side];
    return next ? (frames[i].pts + next.pts) / 2 : back ? frames[i].pts + (frames[i].pts - back.pts) / 2 : frames[i].pts;
  };
  if (t < edge(0) - (n > 1 ? frames[1].pts - frames[0].pts : 0) || t > edge(n - 1) + (n > 1 ? frames[n - 1].pts - frames[n - 2].pts : 0)) return null;
  let best = 0;
  for (let i = 1; i < n; i++) if (Math.abs(edge(i) - t) < Math.abs(edge(best) - t)) best = i;
  return frames[best].frame;
}
/** The frame the moment is guessed at from the moments set before it, or null: the set and the clearance are found by
 * the user, and a guess past the end of the video means the moment is not in it. */
export function guessFrame(key: string, picks: Picks, frames: readonly CrouchFrame[]): number | null {
  const s = stepOf(key);
  if (!s || s.step === null) return null;
  const n = s.step, at = (k: string) => pickTime(k, picks, frames);
  const td = (i: number) => at(`td${i}`), to = (i: number) => at(`to${i}`);
  let t: number | null = null;
  if (s.kind === 'touchdown') {
    if (n === 1) { const c = at('clearance'); t = c === null ? null : c + GUESS.firstFlight; }
    else {
      const off = to(n - 1), before = n >= 3 ? td(n - 1) : null, lastOff = n >= 3 ? to(n - 2) : null;
      const flight = before !== null && lastOff !== null && before > lastOff ? before - lastOff : GUESS.flight;
      t = off === null ? null : off + flight;
    }
  } else {
    const down = td(n), lastDown = n >= 2 ? td(n - 1) : null, lastOff = n >= 2 ? to(n - 1) : null;
    const contact = lastDown !== null && lastOff !== null && lastOff > lastDown ? GUESS.shrink * (lastOff - lastDown) : GUESS.firstContact;
    t = down === null ? null : down + contact;
  }
  return t === null ? null : frameAtEdge(frames, t, sideOf(s.kind));
}

/** The frames the pose models look at for the moments set: each moment's own; SET_MORE more before the set, SET_SPREAD s
 * apart (its posture is a median, as the analysis takes the set's last 0.2 s before the movement); CLEAR_SIDE either side
 * of the clearance (a median over five frames, as the analysis). `frames` in time order. */
export const SET_SPREAD = .04, SET_MORE = 4, CLEAR_SIDE = 2;
export function setFramesOf(frame: number, frames: readonly CrouchFrame[]): number[] {
  const i = frames.findIndex(f => f.frame === frame);
  if (i < 0) return [];
  const gap = medianGap(frames), k = Math.max(1, Math.round(SET_SPREAD / gap)), out: number[] = [];
  for (let j = 0; j <= SET_MORE; j++) if (frames[i - j * k]) out.push(frames[i - j * k].frame);
  return out;
}
export function clearanceFramesOf(frame: number, frames: readonly CrouchFrame[]): number[] {
  const i = frames.findIndex(f => f.frame === frame);
  return i < 0 ? [] : frames.slice(Math.max(0, i - CLEAR_SIDE), i + CLEAR_SIDE + 1).map(f => f.frame);
}
/** The frames to look at for a moment set at `frame`, its own first. */
export function framesFor(key: string, frame: number, frames: readonly CrouchFrame[]): number[] {
  const around = key === 'set' ? setFramesOf(frame, frames) : key === 'clearance' ? clearanceFramesOf(frame, frames) : [];
  return [frame, ...around.filter(f => f !== frame)];
}
/** Every frame to look at for `picks`, moment by moment in order. */
export function framesToLook(picks: Picks, frames: readonly CrouchFrame[]): number[] {
  const out: number[] = [];
  for (const s of PICK_STEPS) if (picks[s.key] !== undefined) for (const f of framesFor(s.key, picks[s.key], frames)) if (!out.includes(f)) out.push(f);
  return out;
}
function medianGap(frames: readonly CrouchFrame[]) {
  const d = frames.slice(1).map((f, i) => f.pts - frames[i].pts).filter(v => v > 0).sort((a, b) => a - b);
  return d.length ? d[d.length >> 1] : 1 / 240;
}

/** The leg length (hip to ankle, pixels: the scale of every threshold) from the few frames looked at: their 80th
 * percentile, which on the eight saved starts was 0.95-1.07 of the analysis' (the 90th percentile over every frame,
 * contacts.ts legLength), 1.00 on average; their 90th was 0.97-1.10 (most of the frames looked at are the clearance's and
 * the toe-offs', the leg straight), and a thigh at a toe-off then fell under the shortest measured (angles.ts). */
export const LEG_QUANTILE = .8;
export function pickLeg(frames: readonly CrouchFrame[], W: number, H: number): number {
  return quantile(frames.flatMap(f => f.pose ? [[23, 27], [24, 28]].flatMap(([a, b]) => visible(f.pose![a]) && visible(f.pose![b])
    ? [Math.hypot((f.pose![a].x - f.pose![b].x) * W, (f.pose![a].y - f.pose![b].y) * H)] : []) : []), LEG_QUANTILE);
}
/** RTMPose's feet mended from MediaPipe's (leg-check.ts), as the analysis does before anything is judged or drawn; the
 * frames without RTMPose's pose as they are. `leg`: the leg length to mend by (the long jump from the stands has its own). */
export function withMendedFeet(frames: readonly CrouchFrame[], W: number, H: number, leg = pickLeg(frames, W, H)): CrouchFrame[] {
  if (!(leg > 0)) return frames as CrouchFrame[];
  return frames.map(f => { if (!f.refined) return f; const mended = mendFeet(f.refined, f.pose, W, H, leg); return mended === f.refined ? f : { ...f, refined: mended }; });
}

type Px = { x: number; y: number };
/** What the poses found so far tell: the leg length (pixels), the running direction, the front foot on its block and
 * where each contact's foot was set down (pixels; the toe ahead at the touchdown, as the analysis takes the contacts from
 * MediaPipe's toes), the hips at each moment. */
export interface PickLayout { leg: number; direction: number; front: Px | null; rear: Px | null; places: Map<number, Px> }
const toesOf = (f: CrouchFrame | undefined, W: number, H: number): Px[] =>
  f?.pose ? TOE.map(k => f.pose![k]).filter(p => visible(p, .3)).map(p => ({ x: p.x * W, y: p.y * H })) : [];
const hipOf = (f: CrouchFrame | undefined, W: number) =>
  f?.pose && visible(f.pose[23], .3) && visible(f.pose[24], .3) ? (f.pose[23].x + f.pose[24].x) / 2 * W : null;
export function layoutOf(picks: Picks, frames: readonly CrouchFrame[], W: number, H: number): PickLayout {
  const byFrame = new Map(frames.map(f => [f.frame, f])), leg = pickLeg(frames, W, H);
  const set = picks.set === undefined ? undefined : byFrame.get(picks.set);
  // The run: the hips from the set to the last moment set; else the trunk in the set, leaning forward over the hands.
  const later = [...PICK_STEPS].reverse().map(s => picks[s.key] === undefined || s.key === 'set' ? undefined : byFrame.get(picks[s.key]))
    .find(f => hipOf(f, W) !== null);
  const setHip = hipOf(set, W), laterHip = hipOf(later, W);
  let direction = setHip !== null && laterHip !== null && Math.abs(laterHip - setHip) > .2 * (leg || 0) ? Math.sign(laterHip - setHip) : 0;
  if (!direction && set?.pose && [11, 12, 23, 24].every(k => visible(set.pose![k], .3)))
    direction = Math.sign(set.pose[11].x + set.pose[12].x - set.pose[23].x - set.pose[24].x);
  const places = new Map<number, Px>();
  let front: Px | null = null, rear: Px | null = null;
  if (!direction) return { leg, direction, front, rear, places };
  // The blocks: in the set, the front foot is the one ahead (medians over the set's frames).
  const setFrames = picks.set === undefined ? [] : setFramesOf(picks.set, frames).map(n => byFrame.get(n));
  const pairs = setFrames.map(f => toesOf(f, W, H)).filter(t => t.length === 2).map(t => (t[1].x - t[0].x) * direction > 0 ? [t[1], t[0]] : t);
  if (pairs.length) {
    front = { x: median(pairs.map(p => p[0].x)), y: median(pairs.map(p => p[0].y)) };
    const r = { x: median(pairs.map(p => p[1].x)), y: median(pairs.map(p => p[1].y)) };
    rear = leg > 0 && (front.x - r.x) * direction > .15 * leg ? r : null;
  }
  for (let n = 1; n <= MAX_STEPS; n++) {
    const td = picks[`td${n}`], to = picks[`to${n}`];
    if (td === undefined) break;
    // At the touchdown the landing foot is ahead (the other one left the ground behind); at the toe-off the pushing foot
    // is behind (the swing foot ahead): either gives the place, the touchdown's first.
    const down = toesOf(byFrame.get(td), W, H), off = to === undefined ? [] : toesOf(byFrame.get(to), W, H);
    const ahead = down.length ? down.reduce((a, b) => (b.x - a.x) * direction > 0 ? b : a) : null;
    const behind = off.length ? off.reduce((a, b) => (b.x - a.x) * direction < 0 ? b : a) : null;
    const place = ahead ?? behind;
    if (!place) continue;
    // The ground: the lower of the two toes when they agree on the place.
    const y = ahead && behind && leg > 0 && Math.abs(ahead.x - behind.x) < .3 * leg ? Math.max(ahead.y, behind.y) : place.y;
    places.set(n, { x: place.x, y });
  }
  return { leg, direction, front, rear, places };
}

/** Where the view is enlarged for a moment and the ground's level there (normalized), from the poses found so far: the
 * whole picture for the set; the front foot on its block; each contact's place, or the next guessed a step ahead (the
 * saved starts, dev-validation/crouch-pick/geometry.ts: the first contact 1.1-1.5 leg lengths ahead of the front block,
 * each next 1.2-1.8 ahead of the one before). The ground's level only where a contact's foot was found. */
export const FIRST_STEP_LEGS = 1.35, STEP_LEGS = 1.3, STEP_GROWTH = 1.08;
export function focusOf(key: string, layout: PickLayout, W: number, H: number): { focus: { x: number; y: number } | null; ground: number | null } {
  const s = stepOf(key), { leg, direction, front, places } = layout;
  if (!s || s.kind === 'set' || !front || !(leg > 0)) return { focus: null, ground: null };
  if (s.kind === 'clearance') return { focus: { x: front.x / W, y: front.y / H }, ground: null };
  const n = s.step!, known = places.get(n);
  if (known) return { focus: { x: known.x / W, y: known.y / H }, ground: known.y / H };
  const last = places.get(n - 1), before = places.get(n - 2);
  const step = last && before ? STEP_GROWTH * (last.x - before.x) * direction : n === 1 ? FIRST_STEP_LEGS * leg : STEP_LEGS * leg;
  const from = n === 1 ? front : last ?? null;
  if (!from) return { focus: null, ground: null };
  const ground = last ? last.y : null;
  return { focus: { x: (from.x + direction * step) / W, y: (ground ?? front.y) / H }, ground: ground === null ? null : ground / H };
}
/** Where the hips should be at a moment (normalized x), for the window the athlete is looked for in: by the moments'
 * places (the saved starts: the hips 0.7-1.0 leg lengths ahead of the front block at the clearance, 0-0.4 behind the
 * foot at a touchdown and 0.8-1.1 ahead of it at the toe-off); null when not known yet (then the start line). */
export function hipGuess(key: string, layout: PickLayout, W: number, H: number): number | null {
  const s = stepOf(key), { leg, direction, front } = layout;
  if (!s || !front || !(leg > 0) || !direction) return null;
  if (s.kind === 'set') return front.x / W;
  if (s.kind === 'clearance') return (front.x + direction * .85 * leg) / W;
  const f = focusOf(`td${s.step}`, layout, W, H).focus;
  if (!f) return null;
  return (f.x * W + direction * (s.kind === 'touchdown' ? -.2 : .95) * leg) / W;
}

/** The result from the moments set and the poses found at them (`frames`: every frame of the video in time order, the
 * poses where the models looked, the feet mended: withMendedFeet). As crouch.ts and crouch-edit.ts measure it. */
export function pickedResult(picks: Picks, frames: readonly CrouchFrame[], W: number, H: number,
  /** Frames whose skeleton the user set by hand (pose-edits.ts): the set's or the clearance's posture then from that frame
   * alone, as the analysis does (crouch-edit.ts applyEdits). */
  hand: ReadonlySet<number> = new Set(),
  /** Frames the models have not looked at yet: their angles wait, nothing is said to be missing there. */
  pending: ReadonlySet<number> = new Set()): CrouchResult {
  const base: CrouchResult = { version: PICK_VERSION, reason: null, direction: 0, set: null, blockClearance: null, moveStart: null, blocks: null,
    contacts: [], steps: [], firstFlight: null, notes: [] };
  const fail = (reason: string): CrouchResult => ({ ...base, reason });
  if (!pickedEnough(picks)) return fail('構え・ブロックを離れる瞬間・1歩目の接地まで選んでください。');
  const byFrame = new Map(frames.map(f => [f.frame, f])), set = byFrame.get(picks.set);
  if (!set?.pose) return fail(pending.has(picks.set) ? '構えのコマの骨格を調べています。' : '構えのコマで選手を見つけられませんでした。全身が映っている構えのコマを選び直してください。');
  const layout = layoutOf(picks, frames, W, H), { leg, direction } = layout;
  if (!(leg > 0)) return fail('脚を十分に捉えられませんでした。');
  if (!direction) return fail('走る向きを確認できませんでした。');
  const frontX = (layout.front?.x ?? hipOf(set, W)!) / W;
  base.direction = direction;
  base.blocks = { front: frontX, rear: layout.rear ? layout.rear.x / W : null };
  const seenOf = (list: number[]) => list.map(n => byFrame.get(n)).filter((f): f is CrouchFrame => !!f?.pose);
  base.set = posture(hand.has(set.frame) ? [set] : seenOf(setFramesOf(picks.set, frames)), frontX, W, H, direction, leg, set);
  const lost: string[] = [];
  const clear = byFrame.get(picks.clearance), around = seenOf(clearanceFramesOf(picks.clearance, frames));
  if (around.length) {
    // The frame shown is the one set; when its pose was not found, the nearest frame round it with one.
    const shown = clear?.pose ? clear : around.reduce((a, b) => Math.abs(b.frame - picks.clearance) < Math.abs(a.frame - picks.clearance) ? b : a);
    base.blockClearance = { ...posture(hand.has(shown.frame) ? [shown] : around, frontX, W, H, direction, leg, shown), pts: frameEdge(frames, picks.clearance, 1)! };
  } else if (!clearanceFramesOf(picks.clearance, frames).some(f => pending.has(f))) lost.push('ブロックを離れる瞬間');
  for (let n = 1; n <= MAX_STEPS; n++) {
    const td = picks[`td${n}`], to = picks[`to${n}`];
    if (td === undefined) break;
    const place = layout.places.get(n) ?? guessedPlace(n, layout);
    if (!byFrame.get(td)?.pose && !pending.has(td)) lost.push(`${n}歩目の接地`);
    const c: Contact = { index: n, x: place.x, groundY: place.y, touchdown: frameEdge(frames, td, -1), touchdownFrame: td,
      toeOff: to === undefined ? null : frameEdge(frames, to, 1), toeOffFrame: to ?? null };
    base.contacts.push(c);
  }
  base.steps = stepsOf(base.contacts, frames, W, H, direction, leg);
  const first = base.contacts[0];
  base.firstFlight = first?.touchdown != null && base.blockClearance ? first.touchdown - base.blockClearance.pts : null;
  const partial = base.contacts.filter(c => c.toeOff === null).map(c => c.index);
  if (partial.length) base.notes.push(`${partial.join('・')}歩目は離地を選んでいないため、接地時間を出していません。`);
  if (lost.length) base.notes.push(`${lost.join('・')}のコマでは選手を見つけられなかったため、そこの角度は出していません。`);
  return base;
}
/** A contact's place when neither of its frames had the athlete's feet: steps ahead of the last place known, or of the
 * front block (only to tell the stance leg's side; no angle is measured at a frame without the athlete). */
function guessedPlace(n: number, layout: PickLayout): Px {
  const { leg, direction, front, places } = layout;
  const known = [...places.keys()].filter(k => k < n), k = known.length ? Math.max(...known) : 0;
  if (k) { const p = places.get(k)!; return { x: p.x + direction * STEP_LEGS * leg * (n - k), y: p.y }; }
  const f = front ?? { x: 0, y: 0 };
  return { x: f.x + direction * (FIRST_STEP_LEGS + STEP_LEGS * (n - 1)) * leg, y: f.y };
}

/** The values a moment's frame sets (times only: the angles wait for the pose models), as `frame` would set them:
 * for the check's list of what a frame changes (MomentReview `preview`). */
export interface PickEffect { label: string; from: number | null; to: number | null; unit: string; digits: number }
export function pickEffects(picks: Picks, key: string, frame: number, frames: readonly CrouchFrame[]): PickEffect[] {
  const s = stepOf(key);
  if (!s) return [];
  const then = { ...picks, [key]: frame }, out: PickEffect[] = [];
  const time = (label: string, f: (p: Picks) => number | null) => { const to = f(then); if (to !== null) out.push({ label, from: picks[key] === undefined ? null : f(picks), to, unit: '秒', digits: 3 }); };
  const span = (a: string, b: string) => (p: Picks) => { const x = pickTime(a, p, frames), y = pickTime(b, p, frames); return x === null || y === null ? null : y - x; };
  if (s.kind === 'clearance') time('ブロック→1歩目の接地', span('clearance', 'td1'));
  if (s.step !== null) {
    const n = s.step;
    if (s.kind === 'touchdown') time(n === 1 ? 'ブロック→1歩目の接地' : `${n - 1}歩目の後の滞空`, n === 1 ? span('clearance', 'td1') : span(`to${n - 1}`, `td${n}`));
    time(`${n}歩目の接地時間`, span(`td${n}`, `to${n}`));
    if (s.kind === 'toeOff') time(`${n}歩目の後の滞空`, span(`to${n}`, `td${n + 1}`));
  }
  return out;
}
