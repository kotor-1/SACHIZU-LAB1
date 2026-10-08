/** The camera's way to the picture (the user, 2026-10-08: 「リアルタイムでスケルトンが表示されてぴったり収まったら勝手に
 * 解析が始まって」): the athlete stands in the frame drawn on the camera view, whole, large, in the middle, turned the
 * way asked and still; then the picture is taken by itself. From MediaPipe's pose (33 points, normalized), which the
 * camera view shows. */
import type { View } from './analysis';

export interface Landmark { x: number; y: number; visibility?: number }
/** The frame drawn on the camera view (shares of the picture's height; centred). */
export const FRAME = { top: .04, bottom: .96 };
/** The athlete's height as a share of the picture's: the model reads a larger athlete better; a little room is kept. */
export const SIZE = { min: .6, max: .92 };
/** How far off the middle the athlete may stand (share of the picture's width). */
export const MIDDLE = .12;
/** The shoulders' spread across the picture, as a share of the athlete's height: from the front or back about 0.2,
 * from the side under 0.05 (the shoulders overlap). */
const SQUARE = .13, SIDEWAYS = .08;

const M = { nose: 0, leftEye: 2, rightEye: 5, leftEar: 7, rightEar: 8, leftShoulder: 11, rightShoulder: 12, leftHip: 23, rightHip: 24,
  leftKnee: 25, rightKnee: 26, leftAnkle: 27, rightAnkle: 28, leftHeel: 29, rightHeel: 30, leftFoot: 31, rightFoot: 32 };
const shown = (p?: Landmark) => !!p && Number.isFinite(p.x) && Number.isFinite(p.y) && (p.visibility ?? 1) >= .5 && p.x > 0 && p.x < 1 && p.y > 0 && p.y < 1;

export interface Fit {
  ok: boolean;
  /** What to do, for the athlete ('' when it fits). */
  message: string;
  /** The athlete's box (shares of the picture), and which of `people` it is. */
  box: { top: number; bottom: number; left: number; right: number } | null;
  person: number;
}

/** The athlete's box: from the top of the head (above the face by 0.6 of the face to the shoulders) to the feet. */
export function boxOf(p: readonly Landmark[]) {
  const face = [M.nose, M.leftEye, M.rightEye, M.leftEar, M.rightEar].filter(i => shown(p[i])).map(i => p[i].y);
  const shoulders = [M.leftShoulder, M.rightShoulder].filter(i => shown(p[i])).map(i => p[i].y);
  const feet = [M.leftHeel, M.rightHeel, M.leftFoot, M.rightFoot, M.leftAnkle, M.rightAnkle].filter(i => shown(p[i])).map(i => p[i].y);
  const xs = p.filter(q => shown(q)).map(q => q.x);
  if (!face.length || !shoulders.length || !feet.length || !xs.length) return null;
  const faceY = Math.min(...face), shoulderY = shoulders.reduce((a, b) => a + b, 0) / shoulders.length;
  return { top: faceY - .6 * Math.max(0, shoulderY - faceY), bottom: Math.max(...feet), left: Math.min(...xs), right: Math.max(...xs) };
}

/** Whether the athlete fits for `view`. `people`: the poses found (the tallest is the athlete); `aspect`: the picture's
 * width over its height. */
export function fitOf(people: readonly (readonly Landmark[])[], view: View, aspect: number): Fit {
  const boxes = people.map(boxOf), tall = (b: ReturnType<typeof boxOf>) => b ? b.bottom - b.top : 0;
  const person = boxes.reduce((best, b, i) => tall(b) > tall(boxes[best] ?? null) ? i : best, 0);
  const p = people[person], box = boxes[person] ?? null;
  const no = (message: string): Fit => ({ ok: false, message, box, person });
  if (!p || !box) return no('枠の中に、頭から足先まで全身が映るように立ってください。');
  if (boxes.some((b, i) => i !== person && tall(b) > tall(box) * .5)) return no('1人だけが映るようにしてください。');
  const h = box.bottom - box.top;
  // The way the athlete faces first: turned the wrong way, the far side's points are not seen. The shoulders' spread is
  // taken where MediaPipe puts them, seen or not.
  const spread = p[M.leftShoulder] && p[M.rightShoulder] ? Math.abs(p[M.leftShoulder].x - p[M.rightShoulder].x) * aspect / Math.max(h, .01) : 0;
  if (view === 'side' && spread > SIDEWAYS) return no('真横を向いてください（右向き・左向きどちらでも）。');
  if (view === 'front' && spread < SQUARE) return no('カメラの方を向いて、まっすぐ立ってください。');
  if (view === 'back' && spread < SQUARE) return no('カメラに背中を向けて、まっすぐ立ってください。');
  const both = (l: number, r: number) => view === 'side' ? shown(p[l]) || shown(p[r]) : shown(p[l]) && shown(p[r]);
  if (![[M.leftShoulder, M.rightShoulder], [M.leftHip, M.rightHip], [M.leftKnee, M.rightKnee], [M.leftAnkle, M.rightAnkle]].every(([l, r]) => both(l, r)))
    return no('頭から足先まで全身が映るように立ってください。');
  if (box.top < FRAME.top / 2) return no('頭が切れています。少し下がってください。');
  if (box.bottom > 1 - (1 - FRAME.bottom) / 2) return no('足先が切れています。少し下がってください。');
  if (h < SIZE.min) return no('もう少し近づいてください。');
  if (h > SIZE.max) return no('もう少し下がってください。');
  if (Math.abs((box.left + box.right) / 2 - .5) > MIDDLE) return no('枠のまん中に立ってください。');
  if (view === 'front' && !shown(p[M.nose])) return no('カメラの方を向いて、まっすぐ立ってください。');
  return { ok: true, message: '', box, person };
}

/** Points followed for keeping still (MediaPipe's): the face, shoulders, hips, knees and ankles. */
const STILL_POINTS = [M.nose, M.leftEar, M.rightEar, M.leftShoulder, M.rightShoulder, M.leftHip, M.rightHip, M.leftKnee, M.rightKnee, M.leftAnkle, M.rightAnkle];
/** Still: over the last WINDOW seconds no point moved further than TOLERANCE of the athlete's height from its mean. */
export const WINDOW = .6, TOLERANCE = .012;
export class Stillness {
  private frames: { t: number; points: (Landmark | null)[]; tall: number }[] = [];
  /** A frame of the athlete (seconds; null when not seen; `aspect`: the picture's width over its height); whether the
   * athlete has kept still for the last WINDOW seconds. */
  push(t: number, p: readonly Landmark[] | null, tall: number, aspect: number, tolerance = TOLERANCE): boolean {
    if (!p || !(tall > 0)) { this.frames = []; return false; }
    this.frames.push({ t, points: STILL_POINTS.map(i => shown(p[i]) ? { x: p[i].x * aspect, y: p[i].y } : null), tall });
    while (this.frames.length > 2 && t - this.frames[1].t >= WINDOW) this.frames.shift();
    if (this.frames.length < 4 || t - this.frames[0].t < WINDOW * .8) return false;
    return STILL_POINTS.every((_, k) => {
      const seen = this.frames.flatMap(f => f.points[k] ? [f.points[k]!] : []);
      if (seen.length < this.frames.length / 2) return true;
      const mx = seen.reduce((a, q) => a + q.x, 0) / seen.length, my = seen.reduce((a, q) => a + q.y, 0) / seen.length;
      return seen.every(q => Math.hypot(q.x - mx, q.y - my) <= tolerance * tall);
    });
  }
  reset() { this.frames = []; }
}
