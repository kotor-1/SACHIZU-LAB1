import { POSE_EDGES } from '../cmj/pose-drawing';
import type { CrouchPoint, CrouchResult } from './crouch';

/** One angle drawn on the picture: the trunk (hip to shoulder) or a shank
 * (ankle to knee) against the vertical, a thigh (hip to knee) against the
 * downward vertical, or a knee (hip, knee, ankle); for the squat and RDL also a
 * hip (shoulder, hip, knee), a thigh against the level ('level', from the knee) and the trunk against a lifted leg
 * ('line': the shoulders' middle, the hip, the ankle). */
export type Mark = { kind: 'trunk'; label: string; value: number }
  | { kind: 'shank' | 'knee' | 'thigh' | 'hip' | 'level' | 'line'; side: 0 | 1; label: string; value: number };
/** A moment whose angles are reported, with the frame shown for it. */
export interface Phase { key: string; label: string; frame: number; pts: number; marks: Mark[]; /** Name on its button, when shorter than the label. */ short?: string;
  /** The landmarks the picture is cut round (all seen ones when absent): a leg, or the trunk, made larger. */ focus?: number[] }

const known = (m: Mark | null): m is Mark => m !== null;
/** The set, the front block clearance and each touchdown, with their angles (none left out when null). */
export function crouchPhases(result: CrouchResult): Phase[] {
  const out: Phase[] = [];
  const posture = (key: string, label: string, p: CrouchResult['set'], rear: boolean) => {
    if (!p) return;
    const side = p.frontSide;
    const marks = ([p.trunkAngle === null ? null : { kind: 'trunk' as const, label: '体幹', value: p.trunkAngle },
      p.frontKnee === null || side === null ? null : { kind: 'knee' as const, side, label: '前膝', value: p.frontKnee },
      !rear || p.rearKnee === null || side === null ? null : { kind: 'knee' as const, side: (1 - side) as 0 | 1, label: '後膝', value: p.rearKnee }] as (Mark | null)[]).filter(known);
    out.push({ key, label, frame: p.frame, pts: p.pts, marks });
  };
  posture('set', '構え', result.set, true);
  posture('clearance', 'ブロックを離れる瞬間', result.blockClearance, false);
  for (const s of result.steps) {
    const c = result.contacts.find(k => k.index === s.step);
    if (!c || c.touchdown === null || c.touchdownFrame === null) continue;
    const marks = ([s.shankAngle === null || s.side === null ? null : { kind: 'shank' as const, side: s.side, label: '脛', value: s.shankAngle },
      s.trunkAngle === null ? null : { kind: 'trunk' as const, label: '体幹', value: s.trunkAngle }] as (Mark | null)[]).filter(known);
    out.push({ key: `td${s.step}`, label: `${s.step}歩目の接地`, frame: c.touchdownFrame, pts: c.touchdown, marks });
  }
  return out;
}

export const markText = (m: Mark) => `${m.label} ${Math.round(m.value)}°`;
/** Trunk orange, shank cyan, thigh green, front (lead) knee pink, rear (takeoff) knee violet, hip yellow. */
export const markColor = (m: Mark) => m.kind === 'trunk' ? '#ffb02e' : m.kind === 'shank' ? '#3ad7ff' : m.kind === 'thigh' || m.kind === 'level' ? '#7dff6b'
  : m.kind === 'hip' ? '#fff35c' : m.kind === 'line' ? '#ff8a3d'
  : m.label === '後膝' || m.label.startsWith('踏切') ? '#b58cff' : '#ff6fd8';
const seen = (p?: CrouchPoint) => !!p && Number.isFinite(p.x) && Number.isFinite(p.y) && (p.visibility ?? 1) >= .3;

/** The part of the picture around the athlete (pixels), widened to `aspect`
 * (width / height) with a margin, kept inside the picture where it fits. */
export function figureView(pose: CrouchPoint[], width: number, height: number, aspect: number, margin = .35) {
  const pts = pose.filter(p => seen(p)).map(p => ({ x: p.x * width, y: p.y * height }));
  if (!pts.length) return { x: 0, y: 0, w: width, h: height };
  const x0 = Math.min(...pts.map(p => p.x)), x1 = Math.max(...pts.map(p => p.x)), y0 = Math.min(...pts.map(p => p.y)), y1 = Math.max(...pts.map(p => p.y));
  let w = (x1 - x0) * (1 + 2 * margin), h = (y1 - y0) * (1 + 2 * margin);
  if (w / h < aspect) w = h * aspect; else h = w / aspect;
  w = Math.min(w, width, height * aspect); h = w / aspect;
  const x = Math.max(0, Math.min(width - w, (x0 + x1) / 2 - w / 2)), y = Math.max(0, Math.min(height - h, (y0 + y1) / 2 - h / 2));
  return { x, y, w, h };
}

/** The skeleton and the measured angles on a picture. `to` turns a landmark
 * into canvas pixels, `unit` sizes lines and text. With `numbers`, each angle's
 * value is written by its arc. Display only. */
export function drawCrouchFigure(ctx: CanvasRenderingContext2D, pose: CrouchPoint[], to: (p: CrouchPoint) => { x: number; y: number },
  marks: Mark[], unit: number, numbers: boolean) {
  const at = (i: number) => seen(pose[i]) ? to(pose[i]) : null;
  ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  // The skeleton, thin.
  ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = unit * .25;
  for (const [a, b] of POSE_EDGES) {
    const p = at(a), q = at(b); if (!p || !q) continue;
    ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
  }
  ctx.fillStyle = '#ffffff';
  for (const i of new Set(POSE_EDGES.flat())) { const p = at(i); if (p) { ctx.beginPath(); ctx.arc(p.x, p.y, unit * .3, 0, Math.PI * 2); ctx.fill(); } }
  const mid = (a: number, b: number) => { const p = at(a), q = at(b); return p && q ? { x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 } : null; };
  const placed: { x: number; y: number; w: number; h: number }[] = [];
  const free = (b: { x: number; y: number; w: number; h: number }) => placed.every(o => b.x + b.w <= o.x || o.x + o.w <= b.x || b.y + b.h <= o.y || o.y + o.h <= b.y);
  for (const m of marks) {
    const color = markColor(m);
    // Vertex, the measured segment(s) and the reference (the vertical, or the thigh).
    const [vertex, end, other] = m.kind === 'trunk' ? [mid(23, 24), mid(11, 12), null]
      : m.kind === 'shank' ? [at(27 + m.side), at(25 + m.side), null] : m.kind === 'thigh' ? [at(23 + m.side), at(25 + m.side), null]
      : m.kind === 'level' ? [at(25 + m.side), at(23 + m.side), null] : m.kind === 'hip' ? [at(23 + m.side), at(11 + m.side), at(25 + m.side)]
      : m.kind === 'line' ? [at(23 + m.side), mid(11, 12), at(27 + m.side)]
      : [at(25 + m.side), at(27 + m.side), at(23 + m.side)];
    const joint = m.kind === 'knee' || m.kind === 'hip' || m.kind === 'line';
    if (!vertex || !end || (joint && !other)) continue;
    const length = Math.hypot(end.x - vertex.x, end.y - vertex.y);
    const reference = other ?? (m.kind === 'level' ? { x: vertex.x + Math.sign(end.x - vertex.x || 1) * length, y: vertex.y }
      : { x: vertex.x, y: vertex.y + (m.kind === 'thigh' ? length : -length) });
    ctx.strokeStyle = color; ctx.lineWidth = unit * .7;
    ctx.beginPath(); ctx.moveTo(vertex.x, vertex.y); ctx.lineTo(end.x, end.y);
    if (other) { ctx.moveTo(vertex.x, vertex.y); ctx.lineTo(other.x, other.y); }
    ctx.stroke();
    if (!joint) {   // the vertical (or the level), dashed
      ctx.setLineDash([unit * .8, unit * .6]); ctx.lineWidth = unit * .35;
      ctx.beginPath(); ctx.moveTo(vertex.x, vertex.y); ctx.lineTo(reference.x, reference.y); ctx.stroke(); ctx.setLineDash([]);
    }
    // The arc between the reference and the segment, the short way round.
    const a1 = Math.atan2(reference.y - vertex.y, reference.x - vertex.x), a2 = Math.atan2(end.y - vertex.y, end.x - vertex.x);
    let sweep = a2 - a1; while (sweep > Math.PI) sweep -= 2 * Math.PI; while (sweep < -Math.PI) sweep += 2 * Math.PI;
    const radius = Math.max(unit * 2.2, Math.min(length * .35, unit * 5));
    ctx.lineWidth = unit * .45; ctx.beginPath(); ctx.arc(vertex.x, vertex.y, radius, a1, a1 + sweep, sweep < 0); ctx.stroke();
    if (numbers) {
      // Trunk and shank: inside the angle (open space by the vertical). Knee:
      // outside it (inside lie the thigh and the shank, and in the set the other leg).
      const bisector = a1 + sweep / 2, text = markText(m), size = unit * 1.8, pad = unit * .45;
      ctx.font = `700 ${size}px system-ui, sans-serif`; ctx.textBaseline = 'middle';
      const tw = ctx.measureText(text).width, bw = tw + 2 * pad, bh = size + 2 * pad, cw = ctx.canvas.width, ch = ctx.canvas.height;
      // The box's near edge at `reach` from the vertex along a direction; the
      // preferred side first, the other if a value is already there.
      const box = (out: number, reach: number) => {
        const dx = Math.cos(bisector) * out, dy = Math.sin(bisector) * out;
        const x = vertex.x + dx * reach + (dx < -.3 ? -bw : dx > .3 ? 0 : -bw / 2), y = vertex.y + dy * reach + (dy < -.3 ? -bh : dy > .3 ? 0 : -bh / 2);
        return { x: Math.max(2, Math.min(cw - bw - 2, x)), y: Math.max(2, Math.min(ch - bh - 2, y)), w: bw, h: bh };
      };
      const inside = box(1, radius + unit * 1.4), outside = box(-1, unit * 1.6);
      const choices = joint ? [outside, inside] : [inside, outside];
      const chosen = choices.find(free) ?? { ...choices[0], y: Math.min(ch - bh - 2, Math.max(...placed.map(o => o.y + o.h)) + 2) };
      placed.push(chosen);
      const { x, y } = chosen;
      ctx.fillStyle = 'rgba(8,18,16,.72)'; ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(x, y, bw, bh, pad); else ctx.rect(x, y, bw, bh);
      ctx.fill();
      ctx.fillStyle = color; ctx.fillText(text, x + pad, y + bh / 2);
    }
  }
  ctx.restore();
}
