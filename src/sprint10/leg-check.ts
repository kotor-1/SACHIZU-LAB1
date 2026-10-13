/** RTMPose's feet checked against what a foot can be, and mended from MediaPipe's (2026-10-13). The user moved the
 * crouch start's 2nd touchdown by a frame on an iPhone and the picture showed the stance foot's toe far behind it on the
 * ground (「右足のスケルトンが飛んじゃってる」); the shank was then measured on the swing leg (85°, the stance leg's ~36°),
 * the stance leg being the side whose toe is nearest the contact. RTMPose reads a point's x and y apart (SimCC): with two
 * feet in view, the stance foot's toe (and heel) took the swing foot's x and the ground's y, a point on neither foot. The
 * same video in WebKit on a Mac did it 3 frames before that touchdown (the shank 81°, on the swing leg). Frames with a
 * foot part where no foot can be, of RTMPose's (saved poses): crouch start 0-5.4%, hurdle 0-1.8%, throws 0-3.5%, long jump
 * 3.6-7.3%, high jump 3.1-7.0%, curve start 1.4-13.9%; MediaPipe's feet never (11,463 legs), and its leg was there in
 * most of those frames. Every event's measuring mends them before anything is judged or drawn (mendRefinedFeet). */
import { legLength, visible } from './contacts';
import type { CrouchFrame, CrouchPoint } from './crouch';

/** The farthest (leg lengths, hip to ankle) a toe or heel may be from its ankle, and the heel from the toe. MediaPipe's
 * largest over those 11,463 legs: ankle-toe 0.35, ankle-heel 0.28, heel-toe 0.42; RTMPose's 99th percentiles 0.32, 0.19,
 * 0.46, with a tail to 1.06, 1.14 and 1.12. */
export const FOOT_LIMITS = { toe: .42, heel: .3, heelToe: .5 };
/** A shank (knee to ankle) this long (leg lengths) holds its ankle when the foot does not: RTMPose's 0.1st to 99.9th
 * percentiles 0.30-0.77, MediaPipe's 0.20-0.66 (its knees fold onto the ankles in a crouched set). */
export const SHANK_RANGE = [.35, .75] as const;
/** RTMPose's point is MediaPipe's own when within MATCH_LIMIT (leg lengths) of it. A leg of MediaPipe's is RTMPose's
 * when MATCH_MIN of the four points (knee, ankle, heel, toe) are (a knee alone was in both models where MediaPipe's feet
 * were wrong too); a sound RTMPose leg that is MediaPipe's in SURE of them leaves MediaPipe's other leg to the other side. */
export const MATCH_LIMIT = .15, MATCH_MIN = 2, SURE = 3;
/** The score a point taken from MediaPipe is given: above the 0.3 that the pictures and the angles take, below the
 * 0.4-0.5 that the contacts take (toesOf, the long jump's 0.4). The hurdle, the jumps and the throws find the contacts
 * from RTMPose's toes: MediaPipe's toe, a few pixels from where RTMPose puts it, joined the long jump's toe held in the air
 * before a touchdown (a plant too short to count) to one long enough, which took the real contact's place (すずね幅跳び３,
 * WebKit). Times stay on RTMPose's own toes; a point left out is left out there too. */
export const MENDED_SCORE = .35;
const KNEE = 25, ANKLE = 27, HEEL = 29, TOE = 31;
const CHAIN = [KNEE, ANKLE, HEEL, TOE], FOOT = [ANKLE, HEEL, TOE];

const seen = (p: CrouchPoint | undefined): p is CrouchPoint => visible(p, .3);
const apart = (a: CrouchPoint, b: CrouchPoint, W: number, H: number) => Math.hypot((a.x - b.x) * W, (a.y - b.y) * H);

/** Whether the foot of one side can be a foot: toe and heel near the ankle, near each other. */
export function footSound(pose: readonly CrouchPoint[], side: 0 | 1, W: number, H: number, leg: number): boolean {
  const [a, e, t] = [ANKLE, HEEL, TOE].map(k => pose[k + side]), L = FOOT_LIMITS;
  return (!seen(a) || !seen(t) || apart(a, t, W, H) <= L.toe * leg) && (!seen(a) || !seen(e) || apart(a, e, W, H) <= L.heel * leg)
    && (!seen(e) || !seen(t) || apart(e, t, W, H) <= L.heelToe * leg);
}

/** The points of a leg (knee, ankle, heel, toe; offsets on side 0) that are MediaPipe's leg `m`'s too. */
function shared(pose: readonly CrouchPoint[], side: 0 | 1, mp: readonly CrouchPoint[], m: 0 | 1, W: number, H: number, leg: number) {
  return CHAIN.filter(k => seen(pose[k + side]) && seen(mp[k + m]) && apart(pose[k + side], mp[k + m], W, H) <= MATCH_LIMIT * leg);
}

/** The points of an unsound foot (ankle, heel, toe; offsets on side 0) taken to be wrong, and MediaPipe's leg to take them from.
 * MediaPipe's leg is this one's when RTMPose's other leg is sound and SURE of MediaPipe's (this leg is then MediaPipe's
 * other one), or else when MATCH_MIN of its points are this leg's (the one with more, then nearer); the points that are
 * not that leg's are wrong (the stance foot's toe and heel gone behind while its knee and ankle are MediaPipe's), the knee
 * aside. Without MediaPipe's leg, the leg's own shape: a shank of a shank's length keeps its ankle (the toe and
 * heel far from it are wrong), a foot whose heel and toe hold together keeps them (the ankle is wrong), else every part. */
export function wrongParts(pose: readonly CrouchPoint[], mp: readonly CrouchPoint[] | null, side: 0 | 1, W: number, H: number, leg: number):
  { parts: number[]; from: 0 | 1 | null } {
  const other = (1 - side) as 0 | 1;
  if (mp) {
    let from: 0 | 1 | null = null;
    if (footSound(pose, other, W, H, leg)) for (const m of [0, 1] as const)
      if (shared(pose, other, mp, m, W, H, leg).length >= SURE && shared(pose, other, mp, (1 - m) as 0 | 1, W, H, leg).length < SURE) from = (1 - m) as 0 | 1;
    if (from === null) {
      const [a, b] = ([0, 1] as const).map(m => shared(pose, side, mp, m, W, H, leg)), near = (m: 0 | 1, s: number[]) =>
        s.reduce((sum, k) => sum + apart(pose[k + side], mp[k + m], W, H), 0);
      if (Math.max(a.length, b.length) >= MATCH_MIN) from = a.length !== b.length ? (a.length > b.length ? 0 : 1) : near(0, a) <= near(1, b) ? 0 : 1;
    }
    // The knee is kept: MediaPipe's knees fold between the legs in a crouched set (the reason RTMPose draws the legs).
    if (from !== null) { const agree = shared(pose, side, mp, from, W, H, leg); return { parts: FOOT.filter(k => seen(pose[k + side]) && !agree.includes(k)), from }; }
  }
  const at = (k: number) => pose[k + side], L = FOOT_LIMITS, [k, a, e, t] = CHAIN.map(at), out: number[] = [];
  const shank = seen(k) && seen(a) ? apart(k, a, W, H) / leg : null;
  const toeFar = seen(a) && seen(t) && apart(a, t, W, H) > L.toe * leg, heelFar = seen(a) && seen(e) && apart(a, e, W, H) > L.heel * leg;
  const together = seen(e) && seen(t) && apart(e, t, W, H) <= L.heelToe * leg;
  if (shank !== null && shank >= SHANK_RANGE[0] && shank <= SHANK_RANGE[1]) { if (toeFar) out.push(TOE); if (heelFar) out.push(HEEL); if (!toeFar && !heelFar) out.push(TOE, HEEL); }
  else if (together && (toeFar || heelFar)) out.push(ANKLE);
  else for (const q of FOOT) if (seen(at(q))) out.push(q);
  return { parts: out, from: null };
}

/** RTMPose's pose (`refined`) with each unsound foot mended: its wrong points (wrongParts) taken from MediaPipe's
 * pose (`mp`, the same frame, at MENDED_SCORE) when the foot is then sound; else left out (visibility 0), so they are neither drawn nor
 * used, and moved onto the ankle (or the knee): code that reads positions whatever the score (the high jump's centre of
 * mass) takes a place on the leg, not the one RTMPose made up. A new array when anything changed, else `refined` itself. */
export function mendFeet(refined: CrouchPoint[], mp: readonly CrouchPoint[] | null, W: number, H: number, leg: number): CrouchPoint[] {
  let out = refined;
  for (const side of [0, 1] as const) {
    if (footSound(out, side, W, H, leg)) continue;
    const { parts, from } = wrongParts(out, mp, side, W, H, leg);
    if (out === refined) out = refined.map(p => ({ ...p }));
    if (from !== null && parts.every(k => seen(mp![k + from]))) {
      const mended = out.slice();
      for (const k of parts) mended[k + side] = { ...mp![k + from], visibility: MENDED_SCORE };
      if (footSound(mended, side, W, H, leg)) { out = mended; continue; }
    }
    // Not mended by MediaPipe's leg: what is left out is found from the leg's own shape (the knee kept).
    const gone = new Set(from === null ? parts : wrongParts(out, null, side, W, H, leg).parts);
    for (const k of gone) out[k + side] = { ...out[k + side], visibility: 0 };
    // Still unsound (the part left in was the wrong one): no foot at all.
    if (!footSound(out, side, W, H, leg)) for (const k of FOOT) { gone.add(k); out[k + side] = { ...out[k + side], visibility: 0 }; }
    const on = [ANKLE, KNEE].map(k => out[k + side]).find(q => seen(q));
    if (on) for (const k of gone) out[k + side] = { x: on.x, y: on.y, visibility: 0 };
  }
  return out;
}

/** Every frame's RTMPose pose with its feet mended (mendFeet), against the athlete's leg length over the video. The
 * frames are changed in place (the measured frames, before anything is judged or drawn); how many poses were mended. */
export function mendRefinedFeet(frames: CrouchFrame[], W: number, H: number): number {
  const leg = legLength(frames.filter(f => f.pose), W, H);
  if (!(leg > 0)) return 0;
  let count = 0;
  for (const f of frames) {
    if (!f.refined) continue;
    const mended = mendFeet(f.refined, f.pose, W, H, leg);
    if (mended !== f.refined) { f.refined = mended; count++; }
  }
  return count;
}
