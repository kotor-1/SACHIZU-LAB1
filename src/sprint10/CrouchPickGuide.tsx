import type { ReviewMoment } from './moment-edits';

/** The sample picture for each moment of the crouch start's light mode (the user, 2026-10-16: 「どの局面にコマを合わせる
 * のか見本画像も表示して」): a stick figure of a saved start at that moment (RTMPose's joints at the analysis' frames of
 * みゆうSD, dev-validation/crouch-pick/sample-poses.ts; leg lengths from the front block's or the stance foot's toe, the
 * ground at 0, running right), the foot to look at in the accent colour, and beside it that foot enlarged against the
 * ground or the block. A drawing, not anyone's picture. */
type Joints = Record<number, readonly [number, number]>;
type Kind = 'set' | 'clearance' | 'touchdown' | 'toeOff';
const SAMPLES: Record<Kind, Joints> = {
  set: { 0: [.76, -.65], 11: [.62, -.9], 12: [.59, -.88], 13: [.53, -.52], 14: [.54, -.55], 15: [.55, -.22], 16: [.51, -.21], 23: [.11, -1.08], 24: [-.01, -1.1],
    25: [.35, -.63], 26: [0, -.55], 27: [-.05, -.33], 28: [-.48, -.33], 29: [-.13, -.31], 30: [-.56, -.33], 31: [.02, -.15], 32: [-.38, -.11] },
  clearance: { 0: [1.64, -1.37], 11: [1.5, -1.28], 12: [1.36, -1.63], 13: [1.56, -1.02], 14: [1.2, -1.88], 15: [1.74, -1.23], 16: [.99, -2.04], 23: [.85, -1.09], 24: [.92, -1.09],
    25: [.47, -.71], 26: [1.25, -.72], 27: [.08, -.37], 28: [.88, -.42], 29: [-.01, -.34], 30: [.8, -.39], 31: [.04, -.17], 32: [1.02, -.22] },
  touchdown: { 0: [.68, -1.43], 11: [.48, -1.34], 12: [.3, -1.62], 13: [.28, -1.11], 14: [-.03, -1.72], 15: [.38, -.94], 16: [-.2, -1.52], 23: [-.07, -1.08], 24: [-.04, -1.09],
    25: [-.34, -.57], 26: [.21, -.62], 27: [-.84, -.6], 28: [-.13, -.24], 29: [-.91, -.66], 30: [-.2, -.21], 31: [-.99, -.41], 32: [0, -.07] },
  toeOff: { 0: [1.57, -1.47], 11: [1.21, -1.53], 12: [1.42, -1.45], 13: [.92, -1.57], 14: [1.34, -1.17], 15: [.89, -1.31], 16: [1.49, -1.12], 23: [.97, -1.01], 24: [.84, -1.06],
    25: [1.24, -.7], 26: [.54, -.59], 27: [.96, -.31], 28: [.09, -.33], 29: [.89, -.27], 30: [.03, -.33], 31: [1.11, -.18], 32: [.07, -.11] },
};
/** What to set at each moment (the analysis' moments: a touchdown is the first frame with the foot down, a toe-off and
 * the clearance the last; crouch.ts frameEdge). */
export const PICK_TEXT: Record<Kind, { title: string; text: string; zoom: string }> = {
  set: { title: '構えて止まっているコマ', text: '合図の前に構えて、まだ動いていないコマを選びます（動き出す直前がおすすめ）。', zoom: '' },
  clearance: { title: '前の足がブロックに着いている最後のコマ', text: '次のコマで、前の足の靴の先がブロックから離れます。', zoom: '靴の先がブロックに着いている' },
  touchdown: { title: '足が床に着いた最初のコマ', text: '1つ前のコマでは、まだ足が浮いています。', zoom: '靴が床に着いた' },
  toeOff: { title: 'つま先が床に着いている最後のコマ', text: '次のコマで、つま先が床から離れます（かかとはもう上がっています）。', zoom: 'つま先だけ床に着いている' },
};
const LEGS = [[23, 25, 27, 29, 31], [24, 26, 28, 30, 32]] as const;

/** The stick figure: `watch`, the side of the foot to look at (the toe nearest the origin: the front block's or the
 * stance foot's place). */
export function PickSample({ kind }: { kind: Kind }) {
  const j = SAMPLES[kind], at = (k: number) => j[k];
  const watch = Math.hypot(...at(31)) <= Math.hypot(...at(32)) ? 0 : 1;
  const xs = Object.values(j).map(p => p[0]), ys = Object.values(j).map(p => p[1]);
  // The figure fitted into 4:3 with a margin, the ground in view.
  const x0 = Math.min(...xs) - .25, x1 = Math.max(...xs) + .25, y0 = Math.min(...ys) - .2, y1 = .18;
  let w = x1 - x0, h = y1 - y0;
  if (w / h < 4 / 3) w = h * 4 / 3; else h = w * 3 / 4;
  const vx = (x0 + x1) / 2 - w / 2, vy = y1 - h;
  const line = (ks: readonly number[]) => ks.map(k => at(k).join(',')).join(' ');
  const mid = (a: number, b: number) => [(at(a)[0] + at(b)[0]) / 2, (at(a)[1] + at(b)[1]) / 2];
  const [sx, sy] = mid(11, 12), [hx, hy] = mid(23, 24), s = w / 60;
  const blocks = kind === 'set' ? [31, 32] : kind === 'clearance' ? [watch ? 32 : 31] : [];
  const toe = at(LEGS[watch][4]);
  return <svg className="pick-sample" viewBox={`${vx} ${vy} ${w} ${h}`} role="img" aria-label={`見本：${PICK_TEXT[kind].title}`}>
    <line className="pick-ground" x1={vx} x2={vx + w} y1={0} y2={0} strokeWidth={s} />
    {blocks.map(k => <path key={k} className="pick-block" d={`M${at(k)[0] + .06},${0}L${at(k)[0] + .06},${at(k)[1] + .02}L${at(k)[0] - .22},0Z`} />)}
    <g className="pick-body" strokeWidth={2.2 * s}>
      {LEGS.map((leg, side) => side === watch ? null : <polyline key={side} points={line([leg[0], leg[1], leg[2], leg[3], leg[4], leg[2]])} />)}
      <polyline points={line([13, 11, 12, 14])} /><polyline points={line([15, 13])} /><polyline points={line([16, 14])} />
      <line x1={sx} y1={sy} x2={hx} y2={hy} />
      <circle cx={at(0)[0]} cy={at(0)[1]} r={.09} />
    </g>
    {kind !== 'set' && <g className="pick-watch" strokeWidth={2.6 * s}>
      <polyline points={line([LEGS[watch][0], LEGS[watch][1], LEGS[watch][2], LEGS[watch][3], LEGS[watch][4], LEGS[watch][2]])} />
      <circle cx={toe[0]} cy={toe[1] - .02} r={.2} fill="none" strokeWidth={1.4 * s} />
    </g>}
    {kind === 'set' && <g className="pick-body" strokeWidth={2.2 * s}>
      <polyline points={line([LEGS[watch][0], LEGS[watch][1], LEGS[watch][2], LEGS[watch][3], LEGS[watch][4], LEGS[watch][2]])} /></g>}
  </svg>;
}
/** The foot enlarged against the ground (or the block): a shoe set down flat, tipped onto its toe, or on the block's
 * face, the point that decides the frame ringed. */
export function PickFoot({ kind }: { kind: Exclude<Kind, 'set'> }) {
  // A shoe, toe to the right: its sole from the heel (0) to the toe (1), its upper above; tipped by `tilt` degrees about the toe.
  const tilt = kind === 'touchdown' ? 4 : kind === 'toeOff' ? 38 : 30;
  const shoe = 'M-.02,0 L.82,0 Q1.04,0 1.02,-.1 Q.98,-.2 .7,-.24 L.42,-.3 Q.3,-.42 .14,-.4 L.02,-.36 Q-.06,-.2 -.02,0Z';
  return <svg className="pick-foot" viewBox="-.25 -.95 1.55 1.16" role="img" aria-label={`拡大：${PICK_TEXT[kind].zoom}`}>
    {kind === 'clearance' ? <path className="pick-block" d="M.86,.12 L1.3,.12 L1.3,-.62 Z" /> : <line className="pick-ground" x1={-.25} x2={1.3} y1={.12} y2={.12} strokeWidth={.025} />}
    <g transform={kind === 'clearance' ? 'translate(.98,-.06) rotate(-58) translate(-1,0)' : `translate(1,.12) rotate(${-tilt}) translate(-1,0)`}>
      <path className="pick-shoe" d={shoe} strokeWidth={.03} />
    </g>
    <circle className="pick-ring" cx={kind === 'touchdown' ? .62 : kind === 'clearance' ? .98 : 1} cy={kind === 'clearance' ? -.06 : .1} r={.16} fill="none" strokeWidth={.035} />
  </svg>;
}

/** The sample and the words for the moment being set. */
export function PickGuide({ m }: { m: Pick<ReviewMoment, 'kind' | 'label'> }) {
  if (m.kind !== 'set' && m.kind !== 'clearance' && m.kind !== 'touchdown' && m.kind !== 'toeOff') return null;
  const t = PICK_TEXT[m.kind];
  return <div className="pick-guide">
    <div className="pick-guide-pictures"><PickSample kind={m.kind} />{m.kind !== 'set' && <PickFoot kind={m.kind} />}</div>
    <div className="pick-guide-words"><small>見本</small><strong>{t.title}</strong><p>{t.text}</p></div>
  </div>;
}
