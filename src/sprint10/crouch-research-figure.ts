/** A value of 「研究と比べる」 on the athlete's own picture (the user, 2026-10-10: 「何の角度か分からない」「記号と図の見方」が
 * 分かりにくい): the studies' range as a green sector from the joint the angle is measured at, so the athlete's line can be
 * seen inside or outside it. The athlete's trunk, shank and knee are drawn by drawCrouchFigure (its marks); the thighs'
 * separation, which has no mark there, is drawn here. Display only. */
import type { CrouchPoint } from './crouch';
import type { ResearchRow } from './crouch-research';

type Pt = { x: number; y: number };
const seen = (p?: CrouchPoint) => !!p && Number.isFinite(p.x) && Number.isFinite(p.y) && (p.visibility ?? 1) >= .3;
export const TARGET_COLOR = '#35d07f', SWING_COLOR = '#ff8a3d', STANCE_COLOR = '#ffffff';
const RAD = Math.PI / 180;
/** The canvas direction (radians, y down) of a segment `deg` from vertical, forward + for a run towards `dir` (+1 right):
 * pointing up from its lower joint (trunk, shank), or down from the hip (thigh). */
export function directionOf(deg: number, dir: number, down: boolean): number {
  return Math.atan2(down ? Math.cos(deg * RAD) : -Math.cos(deg * RAD), dir * Math.sin(deg * RAD));
}
/** A thigh's angle from hanging down (degrees, forward +) from its canvas points. */
const thighDeg = (hip: Pt, knee: Pt, dir: number) => Math.atan2(dir * (knee.x - hip.x), knee.y - hip.y) / RAD;
const turn = (a: number) => { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; };

/** The sector to draw for `row`: its joint, radius and the two edge directions; null when the points are not seen. */
export function targetSector(pose: CrouchPoint[], to: (p: Pt) => Pt, row: ResearchRow, dir: number):
  { vertex: Pt; radius: number; from: number; to: number } | null {
  const best = row.bands.find(b => b.kind === 'top') ?? row.bands[0], f = row.figure;
  if (!best || !f) return null;
  const at = (i: number) => seen(pose[i]) ? to(pose[i]) : null;
  const mid = (a: number, b: number) => { const p = at(a), q = at(b); return p && q ? { x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 } : null; };
  const length = (p: Pt, q: Pt) => Math.hypot(q.x - p.x, q.y - p.y);
  if (f.kind === 'trunk') {
    const hip = mid(23, 24), shoulder = mid(11, 12);
    return hip && shoulder ? { vertex: hip, radius: length(hip, shoulder), from: directionOf(best.from, dir, false), to: directionOf(best.to, dir, false) } : null;
  }
  if (f.side === null) return null;
  if (f.kind === 'shank') {
    const ankle = at(27 + f.side), knee = at(25 + f.side);
    return ankle && knee ? { vertex: ankle, radius: length(ankle, knee), from: directionOf(best.from, dir, false), to: directionOf(best.to, dir, false) } : null;
  }
  if (f.kind === 'knee') {
    // The shank turned from the thigh by the studied knee angles, on the side the athlete's shank is.
    const knee = at(25 + f.side), hip = at(23 + f.side), ankle = at(27 + f.side);
    if (!knee || !hip || !ankle) return null;
    const thigh = Math.atan2(hip.y - knee.y, hip.x - knee.x), shank = Math.atan2(ankle.y - knee.y, ankle.x - knee.x);
    const s = Math.sign(turn(shank - thigh)) || 1;
    return { vertex: knee, radius: length(knee, ankle), from: thigh + s * best.from * RAD, to: thigh + s * best.to * RAD };
  }
  // The thighs: the swing thigh at the studied separations from the stance thigh, from the hips' middle.
  const stance = f.side, swing = (1 - f.side) as 0 | 1, hip = mid(23, 24), sHip = at(23 + stance), sKnee = at(25 + stance), wHip = at(23 + swing), wKnee = at(25 + swing);
  if (!hip || !sHip || !sKnee || !wHip || !wKnee) return null;
  const base = thighDeg(sHip, sKnee, dir);
  return { vertex: hip, radius: length(wHip, wKnee), from: directionOf(base + best.from, dir, true), to: directionOf(base + best.to, dir, true) };
}

/** Draws the studies' range (and, for the thighs, the athlete's two thighs with their separation) on the picture. No
 * words on it: the legend under the picture names the colours (labels on the picture covered the lines on a phone). */
export function drawResearchTarget(ctx: CanvasRenderingContext2D, pose: CrouchPoint[], to: (p: Pt) => Pt, row: ResearchRow, dir: number, unit: number): boolean {
  const sector = targetSector(pose, to, row, dir);
  if (!sector) return false;
  const { vertex, radius } = sector, sweep = turn(sector.to - sector.from), reach = radius * 1.3;
  ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.fillStyle = 'rgba(53,208,127,.42)'; ctx.strokeStyle = TARGET_COLOR; ctx.lineWidth = unit * .45;
  ctx.beginPath(); ctx.moveTo(vertex.x, vertex.y); ctx.arc(vertex.x, vertex.y, reach, sector.from, sector.from + sweep, sweep < 0); ctx.closePath();
  ctx.fill(); ctx.stroke();
  const f = row.figure!;
  if (f.kind === 'gap' && f.side !== null) {
    // The athlete's thighs over the range: the stance thigh white, the swing thigh orange, and the arc between them.
    const p = (i: number) => to(pose[23 + i]), k = (i: number) => to(pose[25 + i]), swing = 1 - f.side;
    for (const [i, color] of [[f.side, STANCE_COLOR], [swing, SWING_COLOR]] as const) {
      ctx.strokeStyle = color; ctx.lineWidth = unit * .9; ctx.beginPath(); ctx.moveTo(p(i).x, p(i).y); ctx.lineTo(k(i).x, k(i).y); ctx.stroke();
    }
    const a1 = Math.atan2(k(f.side).y - p(f.side).y, k(f.side).x - p(f.side).x), a2 = Math.atan2(k(swing).y - p(swing).y, k(swing).x - p(swing).x);
    const s = turn(a2 - a1);
    ctx.strokeStyle = SWING_COLOR; ctx.lineWidth = unit * .5; ctx.beginPath(); ctx.arc(vertex.x, vertex.y, Math.max(unit * 2.2, radius * .4), a1, a1 + s, s < 0); ctx.stroke();
  }
  ctx.restore();
  return true;
}
