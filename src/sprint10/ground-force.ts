/** The ground's push on the athlete from the video and the body mass, without a force plate (the user, 2026-10-11, with
 * a summary of the methods: 「フォースプレート使わずに体重入れれば出るようにする」). Each value is a MEAN over a
 * contact (or the block push) as one arrow; no waveform and no peak beyond the estimate below.
 *
 * - Vertical, each contact: body mass × g × (flight ÷ contact + 1): over a step the ground's vertical impulse carries the
 *   weight for the contact and the flight after it (Morin et al. 2005, J Appl Biomech 21:167). Its peak, the force taken
 *   as a half sine: × π/2. In the first steps the body also rises, so these read a little low there.
 * - Horizontal, each contact: body mass × the speed gained in the contact ÷ the contact time. The speed gained: the
 *   body's forward speed in the flight after the contact less that in the flight before it (no forward force in the air,
 *   so the speed holds there). Not from a speed rising evenly through the contact: the practice start IMG_0291 braked at
 *   its first touchdown (3.5 → 3.3 m/s, then up to 4.3), and an even rise read that contact as losing speed. On a 10 m
 *   run (`speeds: 'steps'`), the step's mean speed (touchdown to touchdown) after the contact less the one before, as
 *   the summary the user brought gives it (「その1歩で増えた速度」): steadier there, though it shares a gain between
 *   neighbouring contacts (a step of 1.24 then 0.88 m/s reads about 0.75 then 1.03).
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
/** A flight's speed: a line through the body inside the flight, FLIGHT_INSIDE s clear of the touchdown and the toe-off;
 * a flight shorter than FLIGHT_SHORT s is taken FLIGHT_OVER s into the contacts either side (where the force is small),
 * so as to have FLIGHT_FRAMES. */
const FLIGHT_INSIDE = .004, FLIGHT_SHORT = .03, FLIGHT_OVER = .01, FLIGHT_FRAMES = 5;
/** The upward speed at the block clearance: one curve through the body from EXIT_BEFORE s before it to the first
 * touchdown (at most EXIT_AFTER s): a parabola while pushing, gravity in the flight, one speed where they meet. */
const EXIT_BEFORE = .08, EXIT_AFTER = .06;
/** The push's start: the body's forward move from the set, d, rises as (t − start)² while the push begins, so √d is a
 * line in time; one through the PUSH_FIT s after the first movement seen, its start at most PUSH_BACK s before it. */
const PUSH_FIT = .1, PUSH_BACK = .1;
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
  /** The speeds before and after each contact: the flights' ('flights', the crouch start: near camera, 240 fps), or each
   * step's mean from touchdown to touchdown ('steps', a 10 m run: the athlete small and often 120 fps, where the contacts'
   * times are a few frames out and a flight's own speed scattered ±0.3 m/s on IMG_4802; the steps' means rose smoothly). */
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
/** The body's forward speed (pixels/s along x) in a flight from `from` (a toe-off or the clearance) to `to` (a touchdown). */
export function flightSpeed(track: readonly TrackPoint[], from: number, to: number): number | null {
  const pad = to - from >= FLIGHT_SHORT ? -FLIGHT_INSIDE : FLIGHT_OVER;
  const pts = within(track, from - pad, to + pad);
  return pts.length >= FLIGHT_FRAMES ? fit(pts, 'x', (from + to) / 2)?.slope ?? null : null;
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
  const speed = (from: number | null | undefined, to: number | null | undefined) => {
    if (!pxPerM || from == null || to == null || !(to > from)) return null;
    const v = flightSpeed(track, from, to);
    return v === null ? null : v * dir / pxPerM;
  };
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
    const exit = speed(clearance, firstTouchdown), rise = exitRise(track, clearance, firstTouchdown, G * pxPerM);
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
    else {
      if (i > 0) before = speed(contacts[i - 1].toeOff, c.touchdown);
      else if (!out.block) before = null;
      after = speed(c.toeOff, next?.touchdown);
    }
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
