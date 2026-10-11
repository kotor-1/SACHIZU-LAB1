/** The ground's push on the athlete from the video and the body mass, without a force plate (the user, 2026-10-11, with
 * a summary of the methods: 「フォースプレート使わずに体重入れれば出るようにする」). Each value is a MEAN over a
 * contact (or the block push) as one arrow; no waveform and no peak beyond the estimate below.
 *
 * - Vertical, each contact: body mass × g × (flight ÷ contact + 1): over a step the ground's vertical impulse carries the
 *   weight for the contact and the flight after it (Morin et al. 2005, J Appl Biomech 21:167). Its peak, the force taken
 *   as a half sine: × π/2. In the first steps the body also rises, so these read a little low there.
 * - Horizontal, each contact: body mass × the speed gained in the contact ÷ the contact time. The speed gained: the
 *   body's forward speed in the flight after the contact less that in the flight before it (no forward force in the air,
 *   so the speed holds there), the flights' speeds fitted at once to every frame, each contact's speed a broken line
 *   (flightSpeeds). On a 10 m run
 *   (`speeds: 'steps'`), the step's mean speed (touchdown to touchdown) after the contact less the one before, as the
 *   summary the user brought gives it (「その1歩で増えた速度」): there the contacts' times are a few frames out (the athlete
 *   small, often 120 fps), and it shares a gain between neighbouring contacts (1.24 then 0.88 m/s read 0.75 then 1.03).
 * - The block: body mass × the forward speed in the first flight ÷ the push (from the body's first movement); upward,
 *   body mass × (g + the upward speed at the clearance ÷ the push), which includes what the hands bear early in the push.
 * - The arrow: its size √(horizontal² + vertical²), its angle from the ground, and the horizontal share (the ratio of
 *   forces, Morin et al. 2011).
 * The body is the whole body's centre of mass from the pose (bodyTrack). The speeds need the picture's metres: the
 * athlete's trunk and height (crouch start), or the two lines (10 m). */
import { anglePose, type CrouchFrame, type CrouchPoint } from './crouch';

export const G = 9.81;
/** A position at a moment: a straight line through the body within ±POSITION_SECONDS (two or three frames either side at
 * 240 fps). */
const POSITION_SECONDS = .0125;
/** The upward speed at the block clearance: one curve through the body from EXIT_BEFORE s before it to the first
 * touchdown (at most EXIT_AFTER s): a parabola while pushing, gravity in the flight, one speed where they meet. */
const EXIT_BEFORE = .08, EXIT_AFTER = .06;
/** The push's start: the body's forward move from the set, d, rises as (t − start)² while the push begins, so √d is a
 * line in time; one through the PUSH_FIT s after the first movement seen, its start at most PUSH_BACK s before it. The
 * user's female start (IMG_0433, 2026-10-11) gave a push of 0.465 s on the iPhone where the body was still until 6.47 s
 * (0.37 s on two browsers here): the start had run back to the old 0.1 s limit; the body moving 1 cm takes 0.02-0.05 s
 * from its first movement on the starts seen (IMG_0433, しゅん, IMG_0291). */
const PUSH_FIT = .1, PUSH_BACK = .05;
/** Where each contact's speed may bend (fractions of the contact): see flightSpeeds. */
const BENDS = [1 / 3, 2 / 3];
/** A step's mean speed (touchdown to touchdown, the 10 m's way) is used only within these step times (s): beyond, a
 * contact was missed. */
const STEP_MIN = .12, STEP_MAX = .5;

export interface TrackPoint { t: number; x: number; y: number }
export interface ForceStep {
  step: number;
  contactSeconds: number | null; flightSeconds: number | null;
  /** Mean forces over the contact (N): vertical (and its peak estimate) and horizontal (forward +). */
  vertical: number | null; verticalPeak: number | null; horizontal: number | null;
  /** The speed gained in the contact (m/s) and the flights' speeds before and after it. */
  gained: number | null; speedBefore: number | null; speedAfter: number | null;
  /** The mean force as one arrow: size (N), angle from the ground (°, 90 = straight up), horizontal share (0-1). */
  resultant: number | null; angle: number | null; ratio: number | null;
}
export interface BlockForce {
  /** From the body's first movement to the front foot's clearance (s), and the body's speed then (m/s, forward and up). */
  pushStart: number; pushSeconds: number; exitSpeed: number; exitRise: number;
  horizontal: number; vertical: number; resultant: number; angle: number; ratio: number;
  /** The mean horizontal power over the push per kg (W/kg): ½ × forward speed² ÷ push (Bezodis et al. 2010). */
  power: number;
}
export interface GroundForces {
  mass: number;
  /** The picture's pixels per metre and where it came from; null: no speeds, so vertical forces only. */
  scale: { pxPerM: number; source: 'height' | 'lines' } | null;
  block: BlockForce | null; steps: ForceStep[];
}
export interface ForceInput {
  mass: number;
  /** Contacts in order (s); a contact without both times gives what it can. */
  contacts: readonly { touchdown: number | null; toeOff: number | null }[];
  /** The body's centre of mass (pixels) frame by frame (bodyTrack). */
  track: readonly TrackPoint[]; pxPerM: number | null; scaleSource?: 'height' | 'lines'; direction: number;
  /** The speeds before and after each contact: the flights' ('flights', fitted at once to every frame: the crouch start),
   * or each step's mean from touchdown to touchdown ('steps', a 10 m run: the athlete small and often 120 fps, the
   * contacts' times a few frames out; the steps' means rose smoothly on IMG_4802). */
  speeds?: 'flights' | 'steps';
  /** The crouch start: the body's first movement as seen (the crouch analysis' moveStart) and the front foot's clearance. */
  block?: { moveStart: number; clearance: number } | null;
}

/** The whole body's centre of mass in pixels, frame by frame: the segments' mass fractions and centres of de Leva (1996)
 * on the followed pose (MediaPipe's, the same model in every frame), as the CMJ's (center-of-mass.ts). Side-on, the far
 * limbs are where the pose model puts them; both sides count alike, so their labels swapping changes nothing. Not the
 * hips: the trunk rising out of the set moved them about 0.5 m/s faster than the body at the clearance (IMG_0291). */
export function bodyTrack(frames: readonly CrouchFrame[], W: number, H: number): TrackPoint[] {
  const between = (a: CrouchPoint, b: CrouchPoint, f: number) => ({ x: a.x + f * (b.x - a.x), y: a.y + f * (b.y - a.y) });
  return frames.flatMap(f => {
    const p = f.pose;
    if (!p || p.length < 33 || ![7, 8, 11, 12, 23, 24].every(k => (p[k].visibility ?? 1) >= .3) || !p.every(q => Number.isFinite(q.x) && Number.isFinite(q.y))) return [];
    const shoulders = between(p[11], p[12], .5), hips = between(p[23], p[24], .5);
    const parts: [number, { x: number; y: number }][] = [[.0681, between(p[7], p[8], .5)], [.43015, between(shoulders, hips, .5051)]];
    for (const s of [0, 1]) parts.push([.0263, between(p[11 + s], p[13 + s], .5763)], [.015, between(p[13 + s], p[15 + s], .45665)], [.00585, p[15 + s]],
      [.1447, between(p[23 + s], p[25 + s], .38535)], [.0457, between(p[25 + s], p[27 + s], .43735)], [.0133, between(p[29 + s], p[31 + s], .42145)]);
    const mass = parts.reduce((sum, [m]) => sum + m, 0);
    return [{ t: f.pts, x: parts.reduce((sum, [m, q]) => sum + m * q.x, 0) / mass * W, y: parts.reduce((sum, [m, q]) => sum + m * q.y, 0) / mass * H }];
  }).sort((a, b) => a.t - b.t);
}

/** A straight line of `key` on time through `pts`: its value and slope at t0, or null. */
function fit(pts: readonly { t: number; x: number; y: number }[], key: 'x' | 'y', t0: number): { value: number; slope: number } | null {
  if (pts.length < 2) return null;
  let s0 = 0, s1 = 0, s2 = 0, b0 = 0, b1 = 0;
  for (const p of pts) { const d = p.t - t0, v = p[key]; s0++; s1 += d; s2 += d * d; b0 += v; b1 += v * d; }
  const det = s0 * s2 - s1 * s1;
  return Math.abs(det) < 1e-12 ? null : { value: (b0 * s2 - b1 * s1) / det, slope: (s0 * b1 - s1 * b0) / det };
}
const within = (track: readonly TrackPoint[], from: number, to: number) => track.filter(h => h.t >= from - 1e-9 && h.t <= to + 1e-9);
/** Least squares of values on three basis functions of time: the coefficients, or null. */
function least3(pts: readonly { t: number; v: number }[], basis: (t: number) => [number, number, number]): [number, number, number] | null {
  if (pts.length < 5) return null;
  const A = [[0, 0, 0], [0, 0, 0], [0, 0, 0]], b = [0, 0, 0];
  for (const p of pts) { const f = basis(p.t); for (let i = 0; i < 3; i++) { b[i] += f[i] * p.v; for (let j = 0; j < 3; j++) A[i][j] += f[i] * f[j]; } }
  const det3 = (a: number[][]) => a[0][0] * (a[1][1] * a[2][2] - a[1][2] * a[2][1]) - a[0][1] * (a[1][0] * a[2][2] - a[1][2] * a[2][0]) + a[0][2] * (a[1][0] * a[2][1] - a[1][1] * a[2][0]);
  const d = det3(A);
  if (Math.abs(d) < 1e-24) return null;
  const col = (j: number) => A.map((row, i) => row.map((v, k) => k === j ? b[i] : v));
  return [det3(col(0)) / d, det3(col(1)) / d, det3(col(2)) / d];
}
/** The body's horizontal position at `t` (pixels), or null when no frames are near. */
export function positionAt(track: readonly TrackPoint[], t: number): number | null {
  const near = within(track, t - POSITION_SECONDS, t + POSITION_SECONDS);
  if (near.length >= 3) return fit(near, 'x', t)?.value ?? null;
  const closest = track.reduce<TrackPoint | null>((best, h) => !best || Math.abs(h.t - t) < Math.abs(best.t - t) ? h : best, null);
  return closest && Math.abs(closest.t - t) <= POSITION_SECONDS ? closest.x : null;
}
/** Every flight's forward speed at once (pixels/s, along x): one motion through the body from `start` (in a flight) to
 * the touchdown of the last contact given, the speed holding in each flight and, through each contact, a broken line
 * from the speed before to the speed after that bends at BENDS (its values there free), the position continuous; fitted
 * to every frame by least squares. Speeds[0] is the flight before contacts[0], speeds[k] the flight after
 * contacts[k − 1]; the last contact only ends the motion. Null without enough frames.
 * Fitted on every frame, not each flight's own dozen: on the user's starts (IMG_0433, しゅん, 2026-10-11) the body's
 * position wobbles 2-3 pixels over a few hundredths of a second (its speed ±1 m/s frame to frame, even in the air), and a
 * flight's own frames moved a contact's forward force by up to 0.15 body weights for one frame's shift of a touchdown or
 * toe-off, and from one device to another (0.18 against 0.33). Bending, not changing evenly through the contact: on
 * those starts the speed hardly rose in the first half of the first contact, and an even change read the speed off the
 * blocks 0.15-0.3 m/s low (2.88 against 3.15 m/s from the flight's own frames); on synthetic contacts from an even
 * push to braking for 40% of the contact, the even change read the flights up to 0.4 m/s low, one bend at the middle
 * 0.2, the two bends within 0.05 (with a wobble of 4 pixels too), and a frame's shift moved a contact's forward force by
 * up to 0.05 body weights on the user's starts (three bends: 0.07). */
export function flightSpeeds(track: readonly TrackPoint[], start: number, contacts: readonly { touchdown: number; toeOff: number }[]): number[] | null {
  const m = contacts.length - 1;
  if (m < 0 || !(contacts[0].touchdown > start) || contacts.some((c, k) => k < m && !(c.toeOff > c.touchdown && contacts[k + 1].touchdown > c.toeOff))) return null;
  const end = contacts[m].touchdown, K = m + 1, J = BENDS.length, knots = [0, ...BENDS, 1];
  // The unknowns: the position at `start`, the K flights' speeds, then each contact's speeds at its bends. A row: each
  // unknown's share of the position at t (a flight counts its time; within a contact, each piece of the broken line
  // shares its distance between the speeds at its ends).
  const P = 1 + K + m * J;
  const row = (t: number) => {
    const out = new Array<number>(P).fill(0);
    out[0] = 1;
    let from = start;
    for (let k = 0; k <= m; k++) {
      const td = contacts[k].touchdown;
      out[1 + k] += Math.max(0, Math.min(t, td) - from);
      if (k === m || t <= td) break;
      const tc = contacts[k].toeOff - td, u = (Math.min(t, contacts[k].toeOff) - td) / tc;
      const node = (j: number) => j === 0 ? 1 + k : j === J + 1 ? 2 + k : 1 + K + k * J + j - 1;
      for (let j = 0; j <= J && u > knots[j]; j++) {
        const L = knots[j + 1] - knots[j], w = Math.min(u, knots[j + 1]) - knots[j];
        out[node(j)] += tc * (w - w * w / (2 * L)); out[node(j + 1)] += tc * w * w / (2 * L);
      }
      if (t <= contacts[k].toeOff) break;
      from = contacts[k].toeOff;
    }
    return out;
  };
  const pts = within(track, start, end);
  if (pts.length < 2 * P) return null;
  const A = Array.from({ length: P }, () => new Array<number>(P).fill(0)), b = new Array<number>(P).fill(0);
  for (const p of pts) {
    const r = row(p.t);
    for (let i = 0; i < P; i++) { b[i] += r[i] * p.x; for (let j = 0; j < P; j++) A[i][j] += r[i] * r[j]; }
  }
  for (let i = 0; i < P; i++) {   // Gaussian elimination with partial pivoting
    let piv = i; for (let k = i + 1; k < P; k++) if (Math.abs(A[k][i]) > Math.abs(A[piv][i])) piv = k;
    [A[i], A[piv]] = [A[piv], A[i]]; [b[i], b[piv]] = [b[piv], b[i]];
    if (Math.abs(A[i][i]) < 1e-12) return null;
    for (let k = i + 1; k < P; k++) { const f = A[k][i] / A[i][i]; for (let j = i; j < P; j++) A[k][j] -= f * A[i][j]; b[k] -= f * b[i]; }
  }
  const x = new Array<number>(P).fill(0);
  for (let i = P - 1; i >= 0; i--) { let s = b[i]; for (let j = i + 1; j < P; j++) s -= A[i][j] * x[j]; x[i] = s / A[i][i]; }
  return x.slice(1, 1 + K);
}
/** When the push began: √(the forward move from the set) as a line in time, back to zero (see PUSH_FIT). */
export function pushStart(track: readonly TrackPoint[], moveStart: number, dir: number): number | null {
  const still = within(track, moveStart - .25, moveStart - .05).map(p => p.x).sort((a, b) => a - b);
  if (still.length < 5) return null;
  const set = still[still.length >> 1];
  const rising = within(track, moveStart, moveStart + PUSH_FIT).map(p => ({ t: p.t, x: Math.sqrt(Math.max(0, (p.x - set) * dir)), y: 0 }));
  const line = fit(rising, 'x', moveStart);
  if (!line || line.slope <= 0) return null;
  const start = moveStart - line.value / line.slope;
  return Math.max(moveStart - PUSH_BACK, Math.min(moveStart, start));
}
/** The body's upward speed (pixels/s, up +) at the clearance `bc` (see EXIT_BEFORE); `gravity` in pixels/s². */
function exitRise(track: readonly TrackPoint[], bc: number, end: number, gravity: number): number | null {
  const near = within(track, bc - EXIT_BEFORE, Math.min(end, bc + EXIT_AFTER));
  if (near.filter(h => h.t < bc).length < 6) return null;
  const y = least3(near.map(h => ({ t: h.t, v: h.y - (h.t > bc ? gravity * (h.t - bc) ** 2 / 2 : 0) })), t => { const d = t - bc; return [1, d, d < 0 ? d * d : 0]; });
  return y ? -y[1] : null;
}
const arrow = (horizontal: number, vertical: number) => {
  const resultant = Math.hypot(horizontal, vertical);
  return { resultant, angle: Math.atan2(vertical, horizontal) * 180 / Math.PI, ratio: resultant > 0 ? horizontal / resultant : 0 };
};

export function groundForces(input: ForceInput): GroundForces {
  const { mass, contacts, track, pxPerM, direction } = input, dir = direction || 1;
  const out: GroundForces = { mass, scale: pxPerM ? { pxPerM, source: input.scaleSource ?? 'lines' } : null, block: null, steps: [] };
  // The flights' speeds (m/s) before and after each contact: one motion fitted to every frame, from the block's clearance
  // (the crouch start) or the first contact's toe-off (a run), through the complete contacts that follow.
  const flightBefore = contacts.map((): number | null => null), flightAfter = contacts.map((): number | null => null);
  const first = input.block ? contacts.findIndex(c => c.touchdown !== null && c.touchdown > input.block!.clearance) : 1;
  const start = input.block ? input.block.clearance : contacts[0]?.toeOff ?? null;
  if (pxPerM && start !== null && first >= 0) {
    const used: number[] = [];
    for (let i = first; i < contacts.length && contacts[i].touchdown !== null; i++) { used.push(i); if (contacts[i].toeOff === null) break; }
    const v = used.length ? flightSpeeds(track, start, used.map(i => ({ touchdown: contacts[i].touchdown!, toeOff: contacts[i].toeOff ?? contacts[i].touchdown! }))) : null;
    if (v) used.forEach((ci, k) => { flightBefore[ci] = v[k] * dir / pxPerM; if (k + 1 < v.length) flightAfter[ci] = v[k + 1] * dir / pxPerM; });
  }
  const stepMean = (k: number) => {
    const a = contacts[k]?.touchdown, b = contacts[k + 1]?.touchdown;
    if (!pxPerM || a == null || b == null || b - a < STEP_MIN || b - a > STEP_MAX) return null;
    const x0 = positionAt(track, a), x1 = positionAt(track, b);
    return x0 === null || x1 === null ? null : (x1 - x0) * dir / pxPerM / (b - a);
  };

  // The block: the first flight's speed (the speed the push left the body with), over the push.
  let before: number | null = null;
  const firstTouchdown = input.block ? contacts.find(c => c.touchdown !== null && c.touchdown > input.block!.clearance)?.touchdown ?? null : null;
  if (input.block && pxPerM && firstTouchdown !== null) {
    const { moveStart, clearance } = input.block;
    const start = pushStart(track, moveStart, dir) ?? moveStart, push = clearance - start;
    const exit = first >= 0 ? flightBefore[first] : null, rise = exitRise(track, clearance, firstTouchdown, G * pxPerM);
    if (push > .1 && push < .8 && exit !== null && exit > 0 && rise !== null) {
      const exitRiseMs = rise / pxPerM, horizontal = mass * exit / push, vertical = mass * (G + exitRiseMs / push);
      out.block = { pushStart: start, pushSeconds: push, exitSpeed: exit, exitRise: exitRiseMs, horizontal, vertical, ...arrow(horizontal, vertical), power: exit * exit / 2 / push };
      before = exit;
    }
  }

  for (let i = 0; i < contacts.length; i++) {
    const c = contacts[i], next = contacts[i + 1] ?? null;
    const contactSeconds = c.touchdown !== null && c.toeOff !== null ? c.toeOff - c.touchdown : null;
    const flightSeconds = c.toeOff !== null && next?.touchdown != null ? next.touchdown - c.toeOff : null;
    const vertical = contactSeconds && contactSeconds > 0 && flightSeconds !== null && flightSeconds >= 0 ? mass * G * (flightSeconds / contactSeconds + 1) : null;
    // The speeds before and after this contact: the flights either side (the block's before the first after the blocks),
    // or the steps' means either side (a step: this touchdown to the next).
    let after: number | null;
    if (input.speeds === 'steps') { before = stepMean(i - 1); after = stepMean(i); }
    else { before = flightBefore[i]; after = flightAfter[i]; }
    const gained = before !== null && after !== null ? after - before : null;
    const horizontal = gained !== null && contactSeconds ? mass * gained / contactSeconds : null;
    const step: ForceStep = { step: i + 1, contactSeconds, flightSeconds, vertical, verticalPeak: vertical === null ? null : vertical * Math.PI / 2,
      horizontal, gained, speedBefore: before, speedAfter: after, resultant: null, angle: null, ratio: null };
    if (horizontal !== null && vertical !== null) Object.assign(step, arrow(horizontal, vertical));
    out.steps.push(step);
  }
  return out;
}

/** The picture's pixels per metre from the athlete's trunk (shoulders' to hips' middle; 0.288 of the standing height,
 * Drillis & Contini 1966, as the long jump and the throws) and the height entered (m): the median over the frames. */
export const TRUNK_SHARE = .288;
export function scaleFromHeight(frames: readonly CrouchFrame[], W: number, H: number, height: number, from = -Infinity, to = Infinity): number | null {
  const trunks = frames.filter(f => f.pts >= from && f.pts <= to).flatMap(f => {
    const p = anglePose(f);
    if (!p || ![11, 12, 23, 24].every(k => (p[k]?.visibility ?? 1) >= .3)) return [];
    return [Math.hypot((p[11].x + p[12].x - p[23].x - p[24].x) / 2 * W, (p[11].y + p[12].y - p[23].y - p[24].y) / 2 * H)];
  }).sort((a, b) => a - b);
  if (trunks.length < 10 || !(height > 0)) return null;
  return trunks[trunks.length >> 1] / TRUNK_SHARE / height;
}
