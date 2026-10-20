import { useState } from 'react';
import { FOUL_HANDLES } from './FoulSetter';
import type { FoulHandle } from './foul';

/** The sample for the foul line's points (the user, 2026-10-19: 「見本の画像をください。説明文がわかりにくく設定が意味不明」):
 * the board drawn slanted as the stands see it (the runway, the board's white, the strip beyond it), the shoe at the toe-off
 * (heel up, the toe on the board), and the four points where the magnified picture takes them, numbered in the order the taps
 * put them, with its colours, tags and lines (FoulSetter.tsx). Short, so the magnified picture and its ask still come on a
 * phone's first screen (a word off the screen looked like a dead button, 2026-10-18); kept folded once the user folds it.
 * A drawing, not anyone's picture. */
const W = 300, H = 100, K = .36;
/** The board's edges across the run: x where they meet the top, slanting by K down the picture (a view from the side). */
const BACK = 150, LINE = 186, STRIP = 202;
const at = (x0: number, y: number) => x0 - K * y;
const TOE = { x: 150, y: 62 };
/** The toe's foot on the foul line (the line the picture draws from the toe once all four are put). */
const FOOT = (() => { const dx = at(LINE, H) - LINE, u = ((TOE.x - LINE) * dx + TOE.y * H) / (dx * dx + H * H); return { x: LINE + dx * u, y: H * u }; })();
/** Each point and its tag's corner from it; the board's back edge right behind the toe (along the run). */
const MARKS: Record<FoulHandle, { x: number; y: number; tag: [number, number] }> = {
  lineA: { x: at(LINE, 12), y: 12, tag: [7, -7] }, lineB: { x: at(LINE, 86), y: 86, tag: [7, -7] },
  back: { x: at(BACK, TOE.y), y: TOE.y, tag: [-53, -7] }, toe: { ...TOE, tag: [6, -21] },
};
/** A shoe, toe to the right (sprint10/CrouchPickGuide.tsx PickFoot), its tip at (1.022, -0.084) of its length, tipped heel
 * up about the tip by TILT degrees. */
const SHOE = 'M-.02,0 L.82,0 Q1.04,0 1.02,-.1 Q.98,-.2 .7,-.24 L.42,-.3 Q.3,-.42 .14,-.4 L.02,-.36 Q-.06,-.2 -.02,0Z', LEN = 46, TILT = 35;
const shoe = (x: number, y: number) => {
  const dx = (x - 1.022) * LEN, dy = (y + .084) * LEN, c = Math.cos(TILT * Math.PI / 180), s = Math.sin(TILT * Math.PI / 180);
  return { x: TOE.x + dx * c - dy * s, y: TOE.y + dx * s + dy * c };
};
const FOLDED = 'sachizu-foul-guide-folded';

/** `left`: the athlete runs to the left in the video, the drawing mirrored to match it (the words kept readable). */
export default function FoulGuide({ left = false }: { left?: boolean }) {
  const [open, setOpen] = useState(() => { try { return localStorage.getItem(FOLDED) !== '1'; } catch { return true; } });
  const X = (x: number) => left ? W - x : x;
  // Words at x (their start), or mirrored (their end there).
  const words = (x: number, y: number, text: string, cls = 'label') =>
    <text className={cls} x={X(x)} y={y} textAnchor={left ? 'end' : 'start'}>{text}</text>;
  const strip = (a: number, b: number) => `${X(a)},0 ${X(b)},0 ${X(at(b, H))},${H} ${X(at(a, H))},${H}`;
  const ankle = shoe(.2, -.38);
  return <details className="foul-guide" open={open} onToggle={e => { const o = e.currentTarget.open; setOpen(o);
    try { if (o) localStorage.removeItem(FOLDED); else localStorage.setItem(FOLDED, '1'); } catch { /* not kept: open again next time */ } }}>
    <summary>見本：点を置く場所</summary>
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="見本：踏切板の図。①線1と②線2は踏切線（白い板の砂場側の端）の上、③板の端はつま先の真後ろの白い板の助走路側の端、④つま先は靴の先">
      <rect className="runway" width={W} height={H} />
      <polygon className="board" points={strip(BACK, LINE)} />
      <polygon className="strip" points={strip(LINE, STRIP)} />
      {words(10, 93, left ? '← 助走' : '助走 →')}
      {words(238, 93, left ? '← 砂場' : '砂場 →')}
      {words(at(BACK, 78) + 3, 78, '白い板', 'label board-label')}
      {words(208, 31, '踏切線', 'label line-label')}
      {words(208, 44, '＝白い板の')}
      {words(208, 57, '砂場側の端')}
      <line className="back" x1={X(BACK)} y1={0} x2={X(at(BACK, H))} y2={H} />
      <line className="line" x1={X(LINE)} y1={0} x2={X(at(LINE, H))} y2={H} />
      <line className="shin" x1={X(ankle.x)} y1={ankle.y} x2={X(ankle.x + 19)} y2={0} />
      <path className="shoe" d={SHOE} transform={`translate(${X(TOE.x)},${TOE.y}) scale(${left ? -1 : 1},1) rotate(${TILT}) translate(${-1.022 * LEN},${.084 * LEN}) scale(${LEN})`} strokeWidth={1.4 / LEN} />
      <line className="gap" x1={X(TOE.x)} y1={TOE.y} x2={X(FOOT.x)} y2={FOOT.y} />
      {FOUL_HANDLES.map(([h, , tag], i) => { const m = MARKS[h], text = '①②③④'[i] + tag, w = [...text].length * 10 + 6;
        const x = left ? W - m.x - m.tag[0] - w : m.x + m.tag[0];
        return <g key={h} className={`mark ${h}`}>
          <circle className="halo" cx={X(m.x)} cy={m.y} r={5.4} /><circle className="dot" cx={X(m.x)} cy={m.y} r={4} />
          <g className="foul-guide-tag"><rect x={x} y={m.y + m.tag[1]} width={w} height={14} rx={3} />
            <text x={x + 3} y={m.y + m.tag[1] + 11}>{text}</text></g>
        </g>; })}
    </svg>
    <p>①②は踏切線の上に離して、③はつま先の真後ろの板の端に。4つ置くと、すぐ下に何cmか出ます。</p>
  </details>;
}
