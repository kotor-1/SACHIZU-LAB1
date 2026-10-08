import { useEffect, useRef } from 'react';
import { sidePoints, type Level, type MeasureKey, type ViewResult, VIEW_NAMES } from './analysis';
import { K, type Keypoint } from './keypoints';
import type { Picture } from './rtm';

/** The colours of a measure on the picture: within the guide, a little out, clearly out, not measured. */
export const LEVEL_COLORS: Record<Level | 'none', string> = { 0: '#46e08a', 1: '#ffc93c', 2: '#ff5d5d', none: '#c9d6d0' };
const BONES: readonly (readonly [number, number])[] = [[5, 7], [7, 9], [6, 8], [8, 10], [5, 11], [6, 12], [11, 13], [13, 15], [12, 14], [14, 16],
  [15, 24], [15, 20], [16, 25], [16, 21], [17, 18], [18, 5], [18, 6]];
/** The canvas drawn (pixels), 3:4. */
const CW = 900, CH = 1200;

/** The picture round the athlete, turned upright by `tilt`, with the lines each measure is taken along, coloured by
 * how far it is from its guide. `grid`: square lines to set the tilt against (a pillar, a door's edge). */
export default function PosturePicture({ picture, result, tilt, grid }: { picture: Picture; result: ViewResult; tilt: number; grid: boolean }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => { if (canvas.current) draw(canvas.current, picture, result, tilt, grid); }, [picture, result, tilt, grid]);
  return <canvas ref={canvas} className="posture-picture" width={CW} height={CH} role="img"
    aria-label={`${VIEW_NAMES[result.view]}の写真と、測った線（緑：目安の範囲、黄：少しずれ、赤：大きめのずれ）`} />;
}

function draw(c: HTMLCanvasElement, picture: Picture, r: ViewResult, tilt: number, grid: boolean) {
  const ctx = c.getContext('2d');
  if (!ctx) return;
  const p = r.points, used = p.filter(q => q.score >= .3);
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#0c1816'; ctx.fillRect(0, 0, CW, CH);
  if (!used.length) return;
  // The window: the athlete's box with room round it, 3:4.
  const x0 = Math.min(...used.map(q => q.x)), x1 = Math.max(...used.map(q => q.x)), y0 = Math.min(...used.map(q => q.y)), y1 = Math.max(...used.map(q => q.y));
  let h = (y1 - y0) * 1.16, w = Math.max((x1 - x0) * 1.3, h * CW / CH);
  h = Math.max(h, w * CH / CW); w = h * CW / CH;
  const ox = (x0 + x1) / 2 - w / 2, oy = (y0 + y1) / 2 - h / 2, s = CW / w;
  const toCanvas = () => ctx.setTransform(s, 0, 0, s, -ox * s, -oy * s);
  toCanvas();
  ctx.translate(picture.width / 2, picture.height / 2); ctx.rotate(tilt * Math.PI / 180); ctx.translate(-picture.width / 2, -picture.height / 2);
  ctx.drawImage(picture, 0, 0);
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = 'rgba(12,24,22,.28)'; ctx.fillRect(0, 0, CW, CH);
  if (grid) {
    ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 1.5;
    for (let i = 1; i < 10; i++) { line(ctx, CW * i / 10, 0, CW * i / 10, CH); line(ctx, 0, CH * i / 10, CW, CH * i / 10); }
  }
  toCanvas();
  const lw = 1 / s, colorOf = (key: MeasureKey) => { const m = r.measures.find(q => q.key === key); return LEVEL_COLORS[m?.level ?? 'none']; };
  const valueOf = (key: MeasureKey) => r.measures.find(q => q.key === key)?.value ?? null;
  const seen = (...q: Keypoint[]) => q.every(k => k && k.score >= .3);
  ctx.lineCap = 'round';
  ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 4 * lw;
  for (const [a, b] of BONES) if (seen(p[a], p[b])) line(ctx, p[a].x, p[a].y, p[b].x, p[b].y);
  const tag = (text: string, x: number, y: number, color: string, toward: 1 | -1 = 1) => label(ctx, text, x, y, color, toward);
  if (r.view === 'side') {
    const { ear, shoulder, hip, knee, ankle } = sidePoints(p, r.facing), top = seen(p[K.head]) ? p[K.head].y : y0;
    if (!seen(ankle)) return;
    ctx.setLineDash([14 * lw, 10 * lw]); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3 * lw;
    line(ctx, ankle.x, top - (y1 - y0) * .04, ankle.x, ankle.y + (y1 - y0) * .03); ctx.setLineDash([]);
    const chain: [Keypoint, Keypoint, MeasureKey][] = [[ankle, knee, 'knee'], [knee, hip, 'knee'], [hip, shoulder, 'trunkLean'], [shoulder, ear, 'headForward']];
    for (const [a, b, key] of chain) if (seen(a, b)) { ctx.strokeStyle = colorOf(key); ctx.lineWidth = 9 * lw; line(ctx, a.x, a.y, b.x, b.y); }
    for (const [q, key] of [[ear, 'headForward'], [shoulder, 'trunkLean'], [hip, 'pelvisForward'], [knee, 'knee']] as [Keypoint, MeasureKey][]) if (seen(q)) {
      ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 2.5 * lw; line(ctx, q.x, q.y, ankle.x, q.y);
      dot(ctx, q.x, q.y, 9 * lw, colorOf(key));
    }
    dot(ctx, ankle.x, ankle.y, 9 * lw, '#ffffff');
    // The tags behind the athlete (the side away from the face), clear of the line in front.
    const back = r.facing === 'left' ? 1 : -1, at = (q: Keypoint) => Math.min(q.x, ankle.x) - 40 * lw + (back > 0 ? Math.abs(q.x - ankle.x) + 80 * lw : 0);
    // Forward or back (the knee: bent or pressed back), as the table says.
    const v = (key: MeasureKey, ahead = '前', behind = '後') => { const x = valueOf(key); return x === null ? '—' : `${x < 0 ? behind : ahead}${Math.abs(x).toFixed(1)}°`; };
    if (seen(ear)) tag(`頭 ${v('headForward')}`, at(ear), ear.y, colorOf('headForward'), back);
    if (seen(shoulder)) tag(`上体 ${v('trunkLean')}`, at(shoulder), shoulder.y, colorOf('trunkLean'), back);
    if (seen(hip)) tag(`骨盤 ${v('pelvisForward')}`, at(hip), hip.y, colorOf('pelvisForward'), back);
    if (seen(knee)) tag(`膝 ${v('knee', '曲', '反')}`, at(knee), knee.y, colorOf('knee'), back);
    return;
  }
  // Front and back: the lines across (ears, shoulders, hips) against level, the axis against the vertical, the knees.
  const across: [number, number, MeasureKey, string][] = [[K.leftEar, K.rightEar, 'headTilt', '耳'], [K.leftShoulder, K.rightShoulder, 'shoulderTilt', '肩'], [K.leftHip, K.rightHip, 'pelvisTilt', '腰']];
  for (const [a, b, key, name] of across) if (seen(p[a], p[b])) {
    const mx = (p[a].x + p[b].x) / 2, my = (p[a].y + p[b].y) / 2, half = Math.abs(p[a].x - p[b].x) / 2 + (x1 - x0) * .08;
    ctx.setLineDash([12 * lw, 9 * lw]); ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 2.5 * lw; line(ctx, mx - half, my, mx + half, my); ctx.setLineDash([]);
    ctx.strokeStyle = colorOf(key); ctx.lineWidth = 7 * lw; line(ctx, p[a].x, p[a].y, p[b].x, p[b].y);
    const x = valueOf(key);
    tag(`${name} ${x === null ? '—' : `${Math.abs(x).toFixed(1)}°`}`, mx + half + 12 * lw, my, colorOf(key));
  }
  const ankles = seen(p[K.leftAnkle], p[K.rightAnkle]) ? { x: (p[K.leftAnkle].x + p[K.rightAnkle].x) / 2, y: (p[K.leftAnkle].y + p[K.rightAnkle].y) / 2 } : null;
  const shoulders = seen(p[K.leftShoulder], p[K.rightShoulder]) ? { x: (p[K.leftShoulder].x + p[K.rightShoulder].x) / 2, y: (p[K.leftShoulder].y + p[K.rightShoulder].y) / 2 } : null;
  if (ankles && shoulders) {
    ctx.setLineDash([12 * lw, 9 * lw]); ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 2.5 * lw;
    line(ctx, ankles.x, ankles.y, ankles.x, y0 - (y1 - y0) * .02); ctx.setLineDash([]);
    ctx.strokeStyle = colorOf('bodyAxis'); ctx.lineWidth = 5 * lw; line(ctx, ankles.x, ankles.y, shoulders.x, shoulders.y);
    dot(ctx, shoulders.x, shoulders.y, 8 * lw, colorOf('bodyAxis'));
  }
  for (const [hip, knee, ankle, key, name] of [[K.leftHip, K.leftKnee, K.leftAnkle, 'kneeLeft', '左膝'], [K.rightHip, K.rightKnee, K.rightAnkle, 'kneeRight', '右膝']] as [number, number, number, MeasureKey, string][]) {
    if (!seen(p[hip], p[knee], p[ankle])) continue;
    ctx.setLineDash([10 * lw, 8 * lw]); ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 2 * lw; line(ctx, p[hip].x, p[hip].y, p[ankle].x, p[ankle].y); ctx.setLineDash([]);
    ctx.strokeStyle = colorOf(key); ctx.lineWidth = 7 * lw; line(ctx, p[hip].x, p[hip].y, p[knee].x, p[knee].y); line(ctx, p[knee].x, p[knee].y, p[ankle].x, p[ankle].y);
    dot(ctx, p[knee].x, p[knee].y, 9 * lw, colorOf(key));
    const x = valueOf(key), outward = p[knee].x < (ankles?.x ?? p[knee].x) ? -1 : 1;
    tag(`${name} ${x === null ? '—' : `${Math.abs(x).toFixed(1)}°`}`, p[knee].x + outward * 40 * lw, p[knee].y, colorOf(key), outward);
  }
}

function line(ctx: CanvasRenderingContext2D, ax: number, ay: number, bx: number, by: number) { ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke(); }
function dot(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string) {
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = color; ctx.fill(); ctx.lineWidth = r * .35; ctx.strokeStyle = '#0c1816'; ctx.stroke();
}
/** A value's tag beside (x, y) in the picture: starting there (`toward` 1) or ending there (-1), kept inside the canvas. */
function label(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color: string, toward: 1 | -1) {
  const t = ctx.getTransform(), cx = t.a * x + t.c * y + t.e, cy = t.b * x + t.d * y + t.f;
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.font = '700 30px system-ui, sans-serif';
  const w = ctx.measureText(text).width + 20, h = 42;
  const left = Math.max(6, Math.min(CW - w - 6, toward > 0 ? cx : cx - w)), top = Math.max(6, Math.min(CH - h - 6, cy - h / 2));
  ctx.fillStyle = 'rgba(12,24,22,.82)'; roundRect(ctx, left, top, w, h, 10); ctx.fill();
  ctx.fillStyle = color; ctx.fillRect(left, top + 8, 5, h - 16);
  ctx.fillStyle = '#ffffff'; ctx.textBaseline = 'middle'; ctx.fillText(text, left + 13, top + h / 2 + 1);
  ctx.restore();
}
function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
