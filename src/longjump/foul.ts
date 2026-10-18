/** The takeoff's distance to the foul line, from the stands (the user, 2026-10-18: 「踏切位置がファールラインから何センチ
 * 余裕があるのか、何センチファールしたのか？の解析が入ってない」). Points are set on a still of the takeoff: two on the foul
 * line (the board's edge on the pit side: here the border of its white and the green strip beyond it), one on the board's
 * other edge (the runway side), and the shoe's tip where it is on the board. The board's white is 0.20 m along the run
 * (World Athletics' technical rules for the long jump: 0.20 m ± 2 mm wide), the ruler.
 *
 * Measured as a ratio, which a slanted view keeps: near the board the ground is drawn by one affine map (the board is 1.22 m
 * and the camera tens of metres away), which keeps parallel lines parallel and ratios of distances to them. So the toe's
 * distance to the foul line over the board's width in the picture, each taken square to the line, is the one on the ground. */
import type { Point } from './ruler';

export const BOARD_CM = 20;
export type FoulHandle = 'lineA' | 'lineB' | 'back' | 'toe';
/** In parts of the picture (0-1), as the screen places them. */
export type FoulPoints = Record<FoulHandle, Point>;
/** The foul line's two points this far apart at least (pixels): closer, its slant is not known. */
const MIN_LINE = 8;
/** The board's back edge this far off the foul line at least (pixels). */
const MIN_BOARD = 3;

/** The toe's distance from the foul line in cm: beyond it (a foul) positive, before it negative; null when the points make
 * no board (the line's points together, the board's edge on the line). */
export function foulCm(p: FoulPoints, width: number, height: number): number | null {
  const px = (q: Point) => ({ x: q.x * width, y: q.y * height });
  const a = px(p.lineA), b = px(p.lineB), dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy);
  if (!(len >= MIN_LINE)) return null;
  // Signed distance square to the line.
  const off = (q: Point) => { const r = px(q); return ((r.x - a.x) * -dy + (r.y - a.y) * dx) / len; };
  const board = off(p.back);
  if (!(Math.abs(board) >= MIN_BOARD)) return null;
  return -off(p.toe) / board * BOARD_CM;
}

/** Where the points start, round the toe found at the takeoff (pixels): the line's points above and below the toe, the
 * board's back edge behind it (against `direction`, the running direction in x), all to be put on the board by the user. */
export function foulStart(toe: Point, leg: number, direction: number, width: number, height: number): FoulPoints {
  const at = (x: number, y: number): Point => ({ x: Math.max(0, Math.min(1, x / width)), y: Math.max(0, Math.min(1, y / height)) });
  const r = Math.max(12, .35 * leg), d = direction || 1;
  return { lineA: at(toe.x + d * .1 * r, toe.y - r), lineB: at(toe.x + d * .1 * r, toe.y + r), back: at(toe.x - d * r, toe.y), toe: at(toe.x, toe.y) };
}

/** The measure in words: `value` and `unit` for a tile, `text` for a sentence; within 0.5 cm, on the line. */
export function foulWords(cm: number): { value: string; note: string; text: string; foul: boolean } {
  const n = Math.round(Math.abs(cm));
  if (n === 0) return { value: '0', note: '踏切線の上', text: 'つま先はほぼ踏切線（ファールライン）の上です', foul: false };
  return cm > 0
    ? { value: `+${n}`, note: 'ファール（踏切線を越えた）', text: `つま先が踏切線（ファールライン）を約${n}cm越えています（ファール）`, foul: true }
    : { value: `${n}`, note: '踏切線の手前（余裕）', text: `つま先は踏切線（ファールライン）の手前 約${n}cm です`, foul: false };
}
