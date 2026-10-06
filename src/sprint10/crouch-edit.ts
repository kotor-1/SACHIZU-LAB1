/** The judged moments of a crouch start the user may move (the front foot leaving its block, each touchdown and toe-off)
 * and the result again from the moments as set. In a dark video, or one from a phone with a poorer camera, the automatic
 * judgment can be a frame or more off (the user, 2026-10-06: 「暗かったりスマホのグレードが低かったりすると、正しく接地や
 * 離地が判定できずずれてしまいます」「自動解析→ズレていたら手動で微調整→自動的に数値もそれに伴ってすぐに変化する」).
 * Nothing is judged again: the times and the angles at the moments are taken from the frames the user chose. */
import { GROUND_BAND, legLength, LIFT_BAND, median, PLANT_RADIUS, TOE, visible } from './contacts';
import { posture, stepsOf, type CrouchFrame, type CrouchResult } from './crouch';

export type MomentKind = 'clearance' | 'touchdown' | 'toeOff';
export interface Moment {
  /** 'clearance', 'td1', 'to1', 'td2', … */
  key: string; kind: MomentKind; step: number | null; label: string; short: string;
  /** The frame now (the user's, or else the automatic one) and the automatic one. */
  frame: number; pts: number; autoFrame: number;
  /** Where to look (normalized): the foot at the place it is set down, or the front foot on its block. */
  focus: { x: number; y: number } | null;
  /** The ground level under the foot (normalized y), for the line drawn there; null on the block. */
  ground: number | null;
  /** Why the moment is worth a look (the video or the times), or null. */
  flag: string | null;
}
/** The frames the user chose, by moment key. */
export type Edits = Readonly<Record<string, number>>;

/** Contact times outside this range, flights outside FLIGHT and a block-to-first-touchdown time outside FIRST (s) are
 * worth a look: the first five steps of sprinters last 0.12-0.23 s on the ground and 0.05-0.10 s in the air, and the
 * first touchdown comes 0.045±0.025 s after the block (Čoh & Tomazin 2006; Bezodis et al. 2019). */
const CONTACT = [.07, .3], FLIGHT = [.005, .15], FIRST = [0, .12];
/** The toe points around a moment (±NEAR frames) seen with less than TOE_SEEN confidence (median), or the pose missing
 * in MISSING of them, make it worth a look. */
const NEAR = 3, TOE_SEEN = .5, MISSING = 2;

/** The result with the user's frames in place of the automatic ones: contact, flight and step times, pitch, the angles
 * at the touchdowns, the block-to-first-touchdown time and the posture as the front foot leaves the block. */
export function applyEdits(auto: CrouchResult, edits: Edits, frames: readonly CrouchFrame[], W: number, H: number): CrouchResult {
  if (auto.reason || !Object.keys(edits).length) return auto;
  const byFrame = new Map(frames.map(f => [f.frame, f]));
  const chosen = (key: string) => { const n = edits[key]; return n === undefined ? undefined : byFrame.get(n); };
  const contacts = auto.contacts.map(c => {
    const td = chosen(`td${c.index}`), to = chosen(`to${c.index}`);
    return { ...c, ...(td ? { touchdown: td.pts, touchdownFrame: td.frame } : {}), ...(to && c.toeOff !== null ? { toeOff: to.pts, toeOffFrame: to.frame } : {}) };
  });
  const seen = frames.filter(f => f.pose), leg = legLength(seen, W, H);
  const steps = stepsOf(contacts, frames, W, H, auto.direction, leg);
  let blockClearance = auto.blockClearance, firstFlight = auto.firstFlight;
  const clear = chosen('clearance');
  if (clear && auto.blocks) {
    const i = seen.findIndex(f => f.frame === clear.frame);
    if (i >= 0) blockClearance = posture(seen.slice(Math.max(0, i - 2), i + 3), auto.blocks.front, W, H, auto.direction, leg, seen[i]);
  }
  if ((clear || edits.td1 !== undefined) && blockClearance && contacts[0]?.touchdown != null) firstFlight = contacts[0].touchdown - blockClearance.pts;
  return { ...auto, contacts, steps, blockClearance, firstFlight };
}

/** The moments in time order, with the user's frames, where to look, and which are worth a look (`result`: the result
 * with the edits, whose times are checked). */
export function moments(auto: CrouchResult, edits: Edits, result: CrouchResult, frames: readonly CrouchFrame[], W: number, H: number,
  /** Moments set from the pictures round the feet (crouch-pixels.ts): the toe point's clearness does not matter there. */
  fromPictures: ReadonlySet<string> = new Set()): Moment[] {
  if (auto.reason) return [];
  const byFrame = new Map(frames.map(f => [f.frame, f])), out: Moment[] = [];
  const add = (key: string, kind: MomentKind, step: number | null, label: string, short: string, autoFrame: number,
    focus: Moment['focus'], ground: number | null) => {
    const frame = edits[key] !== undefined && byFrame.has(edits[key]) ? edits[key] : autoFrame, f = byFrame.get(frame);
    if (f) out.push({ key, kind, step, label, short, frame, pts: f.pts, autoFrame, focus, ground, flag: null });
  };
  if (auto.blockClearance && auto.blocks) {
    const f = byFrame.get(auto.blockClearance.frame), toe = f?.pose ? nearestToe(f.pose, auto.blocks.front, W) : null;
    add('clearance', 'clearance', null, 'ブロックを離れる瞬間', '離れる', auto.blockClearance.frame,
      { x: auto.blocks.front, y: toe ? toe.y : .8 }, null);
  }
  for (const c of auto.contacts) {
    const focus = { x: c.x / W, y: c.groundY / H };
    if (c.touchdownFrame !== null) add(`td${c.index}`, 'touchdown', c.index, `${c.index}歩目の接地`, `${c.index}接地`, c.touchdownFrame, focus, c.groundY / H);
    if (c.toeOffFrame != null && c.toeOff !== null) add(`to${c.index}`, 'toeOff', c.index, `${c.index}歩目の離地`, `${c.index}離地`, c.toeOffFrame, focus, c.groundY / H);
  }
  out.sort((a, b) => a.autoFrame - b.autoFrame);
  // Times out of the usual range flag both their ends; an unclear video flags the moment itself.
  const flag = (key: string, text: string) => { const m = out.find(q => q.key === key); if (m && !m.flag) m.flag = text; };
  const s = (v: number) => `${v.toFixed(3)}秒`;
  if (result.firstFlight !== null && (result.firstFlight < FIRST[0] || result.firstFlight > FIRST[1])) {
    const text = `ブロックを離れてから1歩目の接地まで ${s(result.firstFlight)}：ふつうは${FIRST[0]}〜${FIRST[1]}秒です。`;
    flag('clearance', text); flag('td1', text);
  }
  for (const st of result.steps) {
    if (st.contactSeconds !== null && (st.contactSeconds < CONTACT[0] || st.contactSeconds > CONTACT[1])) {
      const text = `${st.step}歩目の接地時間 ${s(st.contactSeconds)}：ふつうは${CONTACT[0]}〜${CONTACT[1]}秒です。`;
      flag(`td${st.step}`, text); flag(`to${st.step}`, text);
    }
    if (st.flightSeconds !== null && (st.flightSeconds < FLIGHT[0] || st.flightSeconds > FLIGHT[1])) {
      const text = `${st.step}歩目の後の滞空時間 ${s(st.flightSeconds)}：ふつうは${FLIGHT[0]}〜${FLIGHT[1]}秒です。`;
      flag(`to${st.step}`, text); flag(`td${st.step + 1}`, text);
    }
  }
  for (const m of out) {
    if (m.flag || !m.focus || fromPictures.has(m.key)) continue;
    const around = frames.filter(f => Math.abs(f.frame - m.autoFrame) <= NEAR);
    const missing = around.filter(f => !f.pose).length;
    const seenToes = around.flatMap(f => f.pose ? [nearestToe(f.pose, m.focus!.x, W)?.visibility ?? 0] : []);
    if (missing >= MISSING) m.flag = '骨格が取れていないコマがあります。映像で確かめてください。';
    else if (seenToes.length && median(seenToes) < TOE_SEEN) m.flag = '足先がはっきり映っていません（暗い・ぶれている）。映像で確かめてください。';
  }
  return out;
}

/** Whether the foot is down in a frame, as the automatic judgment sees it: for a touchdown or toe-off, a toe near the
 * place within the band of its ground level (GROUND_BAND for a touchdown, LIFT_BAND for a toe-off); for the block, a toe
 * still near the front block. null when no toe is seen there. */
export function footDown(f: CrouchFrame, m: Moment, W: number, H: number, leg: number): boolean | null {
  if (!f.pose || !m.focus) return null;
  const toe = nearestToe(f.pose, m.focus.x, W);
  if (!toe || !visible(toe, .3)) return null;
  const dx = Math.abs(toe.x - m.focus.x) * W;
  if (m.kind === 'clearance') return dx < .1 * leg;
  if (dx > PLANT_RADIUS * 4 * leg) return false;
  return (m.ground! - toe.y) * H < (m.kind === 'touchdown' ? GROUND_BAND : LIFT_BAND) * leg;
}

/** What a moment's frame changes: the values that use it, before and after (rounded as shown). */
export interface Effect { label: string; from: number | null; to: number | null; unit: string; digits: number }
export function effectsOf(before: CrouchResult, after: CrouchResult, m: Moment): Effect[] {
  const step = (r: CrouchResult, n: number) => r.steps.find(q => q.step === n) ?? null, out: Effect[] = [];
  const time = (label: string, f: (r: CrouchResult) => number | null | undefined) => out.push({ label, from: f(before) ?? null, to: f(after) ?? null, unit: '秒', digits: 3 });
  if (m.kind === 'clearance') time('ブロック→1歩目の接地', r => r.firstFlight);
  else {
    const n = m.step!;
    if (m.kind === 'touchdown' && n === 1) time('ブロック→1歩目の接地', r => r.firstFlight);
    if (m.kind === 'touchdown' && n > 1) time(`${n - 1}歩目の後の滞空`, r => step(r, n - 1)?.flightSeconds);
    time(`${n}歩目の接地時間`, r => step(r, n)?.contactSeconds);
    if (m.kind === 'toeOff') time(`${n}歩目の後の滞空`, r => step(r, n)?.flightSeconds);
  }
  return out.filter(e => e.from !== null || e.to !== null);
}

/** The toe point nearest a place across the picture (normalized x), either side: the pose model's left and right swap
 * when the legs cross in a side view. */
function nearestToe(pose: readonly { x: number; y: number; visibility?: number }[], x: number, W: number) {
  const toes = TOE.map(k => pose[k]).filter(p => p && Number.isFinite(p.x) && Number.isFinite(p.y));
  return toes.reduce<(typeof toes)[number] | null>((best, p) => !best || Math.abs(p.x - x) * W < Math.abs(best.x - x) * W ? p : best, null);
}
