/** The 2 m ruler on the ground (the user, 2026-10-06: 「走り幅跳びの踏切板から砂場までちょうど２m」「踏切板の白と緑
 * の境目が0mで、砂場と助走路の境目が２m」「砂が始まるところで正解」): four points set on the picture, the takeoff
 * line and the sand's start, each where it meets the runway's far and near edges.
 *
 * The scale is taken where the athlete's foot was at the takeoff: the runway is 1.22 m wide and the camera ~7 m away,
 * so across it the scale changed by 17% in the test videos. With the camera square to the runway (the filming asked
 * for), the scale along the run is f / depth, and over the ground the inverse depth is linear in the picture's rows: so
 * it is linear between the far edge's 2 m and the near edge's, by where the foot is between the two edges (exact for a
 * pinhole camera, pitched or not). A plane's homography from the four points was tried first and dropped: the runway is
 * 11-35 px high in the picture, and moving one point 0.6 px changed its scale by 11% (a test video, WebKit). */

export interface Point { x: number; y: number }
/** In parts of the picture (0-1), as the screen places them. */
export interface RulerPoints { boardFar: Point; boardNear: Point; sandFar: Point; sandNear: Point }
export interface RulerScale {
  /** Pixels per metre along the run at the foot. */
  pxPerM: number;
  /** The foot: metres before the takeoff line (behind it positive), and across the runway (0 at the far edge, 1 at
   * the near one). */
  behind: number; across: number;
}

/** y on the line through a and b at x (pixels). */
const yAt = (a: Point, b: Point, x: number) => a.y + (b.y - a.y) * (x - a.x) / (b.x - a.x);
/** x on the line through a and b at y. */
const xAt = (a: Point, b: Point, y: number) => a.x + (b.x - a.x) * (y - a.y) / (b.y - a.y);

/** The scale at the foot (`foot` in pixels), or null when the points do not make a ruler: the takeoff line and the
 * sand's start apart along the run, on the same side at both edges, and each far point above its near one. */
export function rulerScale(points: RulerPoints, distance: number, foot: Point, width: number, height: number): RulerScale | null {
  const px = (p: Point): Point => ({ x: p.x * width, y: p.y * height });
  const bf = px(points.boardFar), bn = px(points.boardNear), sf = px(points.sandFar), sn = px(points.sandNear);
  if (!(distance > 0) || bf.y >= bn.y || sf.y >= sn.y) return null;
  const side = Math.sign(sf.x - bf.x);
  if (!side || side !== Math.sign(sn.x - bn.x) || Math.min(Math.abs(sf.x - bf.x), Math.abs(sn.x - bn.x)) < .05 * width) return null;
  const far = Math.hypot(sf.x - bf.x, sf.y - bf.y) / distance, near = Math.hypot(sn.x - bn.x, sn.y - bn.y) / distance;
  const yFar = yAt(bf, sf, foot.x), yNear = yAt(bn, sn, foot.x);
  if (!(yNear > yFar)) return null;
  const across = (foot.y - yFar) / (yNear - yFar), pxPerM = far + (near - far) * across;
  if (!(pxPerM > 0)) return null;
  return { pxPerM, across, behind: (foot.x - xAt(bf, bn, foot.y)) * -side / pxPerM };
}
