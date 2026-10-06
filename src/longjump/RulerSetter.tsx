import { useRef, useState } from 'react';
import type { Point, RulerPoints } from './ruler';
import type { Still } from './still';

/** The ruler's four points, set on a still of the takeoff: the whole picture with two boxes (the board, the sand), and
 * each box magnified with its far and near points (the runway is ~35 px across in a 1080p picture: too small to set
 * on a phone without). Points are in parts of the picture. */
export type Handle = keyof RulerPoints;
const HANDLES: [Handle, string, string][] = [['boardFar', '踏切線・奥', '板・奥'], ['boardNear', '踏切線・手前', '板・手前'], ['sandFar', '砂の始まり・奥', '砂・奥'], ['sandNear', '砂の始まり・手前', '砂・手前']];
/** A box: this part of the picture's width, twice as wide as high. */
const BOX = .13;
const clamp = (v: number) => Math.max(0, Math.min(1, v));

export default function RulerSetter({ still, points, foot, onChange, disabled }: {
  still: Still; points: RulerPoints; foot: Point | null; onChange: (p: RulerPoints) => void; disabled?: boolean;
}) {
  const [chosen, setChosen] = useState<Handle>('boardFar');
  const W = still.width, H = still.height, boxW = BOX, boxH = BOX / 2 * W / H;
  const centre = (a: Point, b: Point) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
  // Each box stays where it was put; moving a box moves its two points with it.
  const [boxes, setBoxes] = useState(() => ({ board: centre(points.boardFar, points.boardNear), sand: centre(points.sandFar, points.sandNear) }));
  const overview = useRef<HTMLDivElement>(null), views = useRef<Record<'board' | 'sand', HTMLDivElement | null>>({ board: null, sand: null });
  const crop = (c: Point) => ({ x: Math.min(1 - boxW, Math.max(0, c.x - boxW / 2)), y: Math.min(1 - boxH, Math.max(0, c.y - boxH / 2)) });
  const move = (h: Handle, p: Point) => onChange({ ...points, [h]: { x: clamp(p.x), y: clamp(p.y) } });
  const moveBox = (which: 'board' | 'sand', c: Point) => {
    const old = boxes[which], dx = c.x - old.x, dy = c.y - old.y, [far, near] = which === 'board' ? ['boardFar', 'boardNear'] as const : ['sandFar', 'sandNear'] as const;
    setBoxes(b => ({ ...b, [which]: c }));
    onChange({ ...points, [far]: { x: clamp(points[far].x + dx), y: clamp(points[far].y + dy) }, [near]: { x: clamp(points[near].x + dx), y: clamp(points[near].y + dy) } });
  };
  const nudge = (dx: number, dy: number) => move(chosen, { x: points[chosen].x + dx / W, y: points[chosen].y + dy / H });
  /** Pointer handlers for a thing dragged within an element, the pointer turned into parts of the picture. */
  const dragging = (to: (e: React.PointerEvent<HTMLElement>) => Point | null, apply: (p: Point) => void, pick?: () => void) => ({
    onPointerDown: (e: React.PointerEvent<HTMLElement>) => { if (disabled) return; pick?.(); e.currentTarget.setPointerCapture(e.pointerId); },
    onPointerMove: (e: React.PointerEvent<HTMLElement>) => { if (disabled || !e.currentTarget.hasPointerCapture(e.pointerId)) return; const p = to(e); if (p) apply(p); },
    onPointerUp: (e: React.PointerEvent<HTMLElement>) => { if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId); },
  });
  const inOverview = (e: React.PointerEvent<HTMLElement>) => {
    const r = overview.current?.getBoundingClientRect(); return r ? { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height } : null;
  };
  const line = (a: Point, b: Point, cls: string, k: string) => <line key={k} className={cls} x1={a.x * 100} y1={a.y * 100} x2={b.x * 100} y2={b.y * 100} vectorEffect="non-scaling-stroke" />;
  const quad = (map: (p: Point) => Point) => [
    line(map(points.boardFar), map(points.boardNear), 'board', 'b'), line(map(points.sandFar), map(points.sandNear), 'sand', 's'),
    line(map(points.boardFar), map(points.sandFar), 'edge', 'f'), line(map(points.boardNear), map(points.sandNear), 'edge', 'n')];

  // A function, not a component: a component made in the render would be a new one each time, and a drag would lose its pointer.
  function loupe(which: 'board' | 'sand', title: string) {
    const c = crop(boxes[which]);
    const local = (p: Point) => ({ x: (p.x - c.x) / boxW, y: (p.y - c.y) / boxH });
    const toPicture = (e: React.PointerEvent<HTMLElement>) => {
      const r = views.current[which]?.getBoundingClientRect(); return r ? { x: c.x + (e.clientX - r.left) / r.width * boxW, y: c.y + (e.clientY - r.top) / r.height * boxH } : null;
    };
    const mine = HANDLES.filter(([h]) => h.startsWith(which));
    return <figure className="longjump-loupe" key={which}><figcaption>{title}</figcaption>
      <div ref={el => { views.current[which] = el; }} className="longjump-loupe-view" style={{ aspectRatio: `${boxW * W} / ${boxH * H}` }}
        data-crop={`${c.x * W},${c.y * H},${boxW * W},${boxH * H}`} data-which={which}>
        <img src={still.image} alt="" draggable={false} style={{ width: `${100 / boxW}%`, left: `${-c.x / boxW * 100}%`, top: `${-c.y / boxH * 100}%` }} />
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">{quad(local)}</svg>
        {mine.map(([h, label, tag]) => { const p = local(points[h]);
          return <button key={h} type="button" className={`longjump-point ${h.endsWith('Far') ? 'far' : 'near'}`} aria-label={`${label}の点`} aria-pressed={chosen === h}
            data-handle={h} disabled={disabled} style={{ left: `${p.x * 100}%`, top: `${p.y * 100}%` }}
            {...dragging(toPicture, q => move(h, q), () => setChosen(h))} onFocus={() => setChosen(h)}
            onKeyDown={e => { const by: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
              const d = by[e.key]; if (d) { e.preventDefault(); setChosen(h); move(h, { x: points[h].x + d[0] / W, y: points[h].y + d[1] / H }); } }}><span>{tag.split('・')[1]}</span></button>; })}
      </div></figure>;
  }

  return <div className="longjump-ruler">
    <div ref={overview} className="longjump-overview" style={{ aspectRatio: `${W} / ${H}` }}>
      <img src={still.image} alt="踏切のコマ" draggable={false} />
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">{quad(p => p)}
        {foot && <circle className="foot" cx={foot.x * 100} cy={foot.y * 100} r={.6} />}</svg>
      {(['board', 'sand'] as const).map(which => { const c = crop(boxes[which]);
        return <button key={which} type="button" className={`longjump-box ${which}`} aria-label={which === 'board' ? '踏切板の拡大の範囲' : '砂場の拡大の範囲'} disabled={disabled}
          style={{ left: `${c.x * 100}%`, top: `${c.y * 100}%`, width: `${boxW * 100}%`, height: `${boxH * 100}%` }}
          {...dragging(inOverview, p => moveBox(which, p))}><span>{which === 'board' ? '板' : '砂'}</span></button>; })}
    </div>
    <p className="sprint10-hint">上の画像の「板」「砂」の枠をドラッグして、踏切板と砂場の境目に重ねると、下に拡大して表示します。{foot ? '緑の点は踏切足の位置です。' : ''}</p>
    <div className="longjump-loupes">
      {loupe('board', '踏切板：白と緑の境目（踏切線）')}
      {loupe('sand', '砂場：砂が始まる所')}
    </div>
    <div className="longjump-nudge" role="group" aria-label="選んだ点を細かく動かす">
      <div className="sprint10-seg" role="group" aria-label="動かす点">{HANDLES.map(([h, label, tag]) =>
        <button key={h} type="button" aria-pressed={chosen === h} aria-label={`${label}を選ぶ`} disabled={disabled} onClick={() => setChosen(h)}>{tag}</button>)}</div>
      <div className="longjump-pad">
        <button type="button" aria-label="上へ" disabled={disabled} onClick={() => nudge(0, -1)}>▲</button>
        <button type="button" aria-label="左へ" disabled={disabled} onClick={() => nudge(-1, 0)}>◀</button>
        <button type="button" aria-label="右へ" disabled={disabled} onClick={() => nudge(1, 0)}>▶</button>
        <button type="button" aria-label="下へ" disabled={disabled} onClick={() => nudge(0, 1)}>▼</button>
      </div>
    </div>
  </div>;
}
