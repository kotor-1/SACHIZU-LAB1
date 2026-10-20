import { useRef, useState } from 'react';
import { foulCm, foulWords, type FoulHandle, type FoulPoints } from './foul';
import type { Point } from './ruler';
import type { Still } from './still';

/** The points for the foul line (foul.ts), set on a still of the takeoff magnified round the foot: a tap puts the point
 * chosen there and goes on to the next not put yet, so four taps set them all. While a point is still to be put, the points
 * already put are only marks: a tap on or by one of them puts the chosen point there (on a phone the board is a few
 * fingers wide, and the user's fourth tap, the toe, fell on the first point's button and only chose it again, 2026-10-19).
 * Once all four are put, a point can be dragged, or moved a pixel at a time. Points are in parts of the picture. */
export const FOUL_HANDLES: [FoulHandle, string, string][] = [
  ['lineA', '踏切線の上', '線1'],
  ['lineB', '踏切線の上の、線1から離れた所', '線2'],
  ['back', '白い板の助走路側の端（つま先の真後ろ）', '板の端'],
  ['toe', '踏切足の靴の先', 'つま先'],
];
/** The magnified part: this many leg lengths wide (the board is 1.22 m, a leg about 0.9 m: the board and the toe fill the
 * part, each picture pixel about one screen pixel on a phone), 4:3, wider or narrower by ZOOM. */
export const SPAN = 1.6, ZOOM = 1.5, ASPECT = 3 / 4, MIN_SPAN = 80;
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** The point to put next once `justPut` is put: the first after it, in order, not put yet (round the end), else itself. */
export function nextToPlace(placed: ReadonlySet<FoulHandle>, justPut: FoulHandle): FoulHandle {
  const order = FOUL_HANDLES.map(([h]) => h), i = order.indexOf(justPut);
  for (let k = 1; k <= order.length; k++) { const h = order[(i + k) % order.length]; if (h !== justPut && !placed.has(h)) return h; }
  return justPut;
}

export default function FoulSetter({ still, points, placed, leg, onChange, disabled }: {
  still: Still; points: FoulPoints; placed: ReadonlySet<FoulHandle>; leg: number;
  /** A point moved (`handle`), the points as they are then. */
  onChange: (p: FoulPoints, handle: FoulHandle) => void; disabled?: boolean;
}) {
  const W = still.width, H = still.height, maxSpan = Math.min(W, H / ASPECT);
  const centroid = (): Point => { const ps = Object.values(points); return { x: ps.reduce((a, p) => a + p.x, 0) / ps.length, y: ps.reduce((a, p) => a + p.y, 0) / ps.length }; };
  const [chosen, setChosen] = useState<FoulHandle>(FOUL_HANDLES.find(([h]) => !placed.has(h))?.[0] ?? 'toe');
  // The magnified part stays where it is while points move (a part following them would move the picture under the finger).
  const [view, setView] = useState(() => ({ centre: centroid(), span: clamp(SPAN * leg, Math.min(160, maxSpan), maxSpan) }));
  const boxW = view.span / W, boxH = view.span * ASPECT / H;
  const c = { x: clamp(view.centre.x - boxW / 2, 0, 1 - boxW), y: clamp(view.centre.y - boxH / 2, 0, 1 - boxH) };
  const local = (p: Point) => ({ x: (p.x - c.x) / boxW * 100, y: (p.y - c.y) / boxH * 100 });
  const area = useRef<HTMLDivElement>(null);
  const toPicture = (e: { clientX: number; clientY: number }): Point | null => {
    const r = area.current?.getBoundingClientRect();
    return r && r.width ? { x: clamp(c.x + (e.clientX - r.left) / r.width * boxW, 0, 1), y: clamp(c.y + (e.clientY - r.top) / r.height * boxH, 0, 1) } : null;
  };
  const put = (h: FoulHandle, p: Point) => onChange({ ...points, [h]: p }, h);
  const zoom = (by: number) => setView({ centre: centroid(), span: clamp(view.span * by, Math.min(MIN_SPAN, maxSpan), maxSpan) });
  const nudge = (dx: number, dy: number) => put(chosen, { x: clamp(points[chosen].x + dx / W, 0, 1), y: clamp(points[chosen].y + dy / H, 0, 1) });

  // The lines in the magnified part: the foul line and the board's back edge along it, and the toe square to the line.
  const px = (p: Point) => ({ x: p.x * W, y: p.y * H }), pt = (q: { x: number; y: number }) => ({ x: q.x / W, y: q.y / H });
  const a = px(points.lineA), b = px(points.lineB), d = { x: b.x - a.x, y: b.y - a.y }, len = Math.hypot(d.x, d.y);
  const along = (p: Point, k: number) => local(pt({ x: px(p).x + d.x * k, y: px(p).y + d.y * k }));
  const t = px(points.toe), u = len ? ((t.x - a.x) * d.x + (t.y - a.y) * d.y) / len / len : 0, foot = local(pt({ x: a.x + d.x * u, y: a.y + d.y * u }));
  const all = FOUL_HANDLES.every(([h]) => placed.has(h)), cm = all ? foulCm(points, W, H) : null, words = cm === null ? null : foulWords(cm);
  const left = FOUL_HANDLES.filter(([h]) => !placed.has(h));
  const seg = (p: { x: number; y: number }, q: { x: number; y: number }, cls: string) =>
    <line className={cls} x1={p.x} y1={p.y} x2={q.x} y2={q.y} vectorEffect="non-scaling-stroke" />;
  const [, chosenLabel, chosenTag] = FOUL_HANDLES.find(([h]) => h === chosen)!;

  return <div className="foul-setter">
    <div ref={area} className={`longjump-loupe-view foul-view${all ? '' : ' is-placing'}`} style={{ aspectRatio: `${boxW * W} / ${boxH * H}` }} data-crop={`${c.x * W},${c.y * H},${boxW * W},${boxH * H}`}
      onClick={e => { if (disabled) return; const p = toPicture(e); if (p) { put(chosen, p); setChosen(nextToPlace(new Set([...placed, chosen]), chosen)); } }}>
      <img src={still.image} alt="踏切のコマ（拡大）" draggable={false} style={{ width: `${100 / boxW}%`, left: `${-c.x / boxW * 100}%`, top: `${-c.y / boxH * 100}%` }} />
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        {len > 0 && (placed.has('lineA') || placed.has('lineB')) && seg(along(points.lineA, -20), along(points.lineA, 20), 'line')}
        {len > 0 && placed.has('back') && seg(along(points.back, -20), along(points.back, 20), 'back')}
        {len > 0 && placed.has('toe') && seg(local(points.toe), foot, words?.foul ? 'gap over' : 'gap')}
      </svg>
      {FOUL_HANDLES.filter(([h]) => placed.has(h)).map(([h, label, tag]) => { const p = local(points[h]), cls = `longjump-point foul-point ${h} ${h === 'lineA' || h === 'back' ? 'far' : 'near'}`;
        // While a point is still to be put: a mark that takes no tap (the tap goes to the picture and puts the chosen point).
        if (!all) return <span key={h} className={`${cls} foul-mark${chosen === h ? ' is-chosen' : ''}`} aria-hidden="true" data-handle={h} style={{ left: `${p.x}%`, top: `${p.y}%` }}><span>{tag}</span></span>;
        return <button key={h} type="button" className={cls}
          aria-label={`${label}の点`} aria-pressed={chosen === h} data-handle={h} disabled={disabled} style={{ left: `${p.x}%`, top: `${p.y}%` }}
          onClick={e => { e.stopPropagation(); setChosen(h); }}
          onPointerDown={e => { if (disabled) return; e.stopPropagation(); setChosen(h); e.currentTarget.setPointerCapture(e.pointerId); }}
          onPointerMove={e => { if (disabled || !e.currentTarget.hasPointerCapture(e.pointerId)) return; const q = toPicture(e); if (q) put(h, q); }}
          onPointerUp={e => { if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId); }}
          onKeyDown={e => { const by: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
            const k = by[e.key]; if (k) { e.preventDefault(); setChosen(h); put(h, { x: clamp(points[h].x + k[0] / W, 0, 1), y: clamp(points[h].y + k[1] / H, 0, 1) }); } }}>
          <span>{tag}</span></button>; })}
    </div>
    {all && <p className={`foul-result${words?.foul ? ' over' : ''}`} role="status" aria-live="polite">{words ? `${words.text}。` : '点から板を作れませんでした。「線1」「線2」を踏切線の上で離して置き、「板の端」を踏切線から離して置いてください。'}</p>}
    <p className="foul-ask" role="status">
      {all ? <><b>{chosenTag}</b>：{chosenLabel}を、タップし直すか、ドラッグや矢印で動かします。</>
        : <><b>{chosenTag}</b>：{chosenLabel}を{placed.has(chosen) ? 'タップし直すか、矢印で動かします' : 'タップします'}。<span className="foul-left">あと{left.length}点（{left.map(([, , tag]) => tag).join('・')}）。置いた点の近くを押しても、次の点が置けます。</span></>}
    </p>
    <div className="longjump-nudge" role="group" aria-label="選んだ点を細かく動かす">
      <div className="sprint10-seg" role="group" aria-label="置く点">{FOUL_HANDLES.map(([h, label, tag]) =>
        <button key={h} type="button" aria-pressed={chosen === h} aria-label={`${label}を選ぶ${placed.has(h) ? '（置いた）' : '（まだ）'}`} data-placed={placed.has(h) ? 'true' : 'false'} disabled={disabled} onClick={() => setChosen(h)}>{placed.has(h) ? '✓' : ''}{tag}</button>)}</div>
      <div className="longjump-pad">
        <button type="button" aria-label="上へ" disabled={disabled || !placed.has(chosen)} onClick={() => nudge(0, -1)}>▲</button>
        <button type="button" aria-label="左へ" disabled={disabled || !placed.has(chosen)} onClick={() => nudge(-1, 0)}>◀</button>
        <button type="button" aria-label="右へ" disabled={disabled || !placed.has(chosen)} onClick={() => nudge(1, 0)}>▶</button>
        <button type="button" aria-label="下へ" disabled={disabled || !placed.has(chosen)} onClick={() => nudge(0, 1)}>▼</button>
      </div>
    </div>
    <div className="foul-zoom" role="group" aria-label="拡大の範囲">
      <button type="button" disabled={disabled || view.span >= maxSpan} onClick={() => zoom(ZOOM)}>広く見る</button>
      <button type="button" disabled={disabled || view.span <= Math.min(MIN_SPAN, maxSpan)} onClick={() => zoom(1 / ZOOM)}>狭く見る</button>
    </div>
  </div>;
}
