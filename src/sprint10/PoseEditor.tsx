import { useEffect, useMemo, useRef, useState } from 'react';
import { anglePose, type CrouchFrame, type CrouchPoint } from './crouch';
import { drawCrouchFigure, type Mark } from './crouch-figure';
import type { PhaseStill } from './CrouchViews';
import { copyPose, EDITABLE } from './pose-edits';

/** The editor's picture: 4:3 at this width (pixels), as the phase pictures. */
const PIC_W = 720, PIC_H = 540;
/** A touch within this (picture pixels, about 23 on a phone's screen) takes the nearest point. */
const HIT = 48;
/** One tap of an arrow moves the chosen point this much (picture pixels). */
const NUDGE = 1.5;
const seen = (p?: CrouchPoint) => !!p && Number.isFinite(p.x) && Number.isFinite(p.y) && (p.visibility ?? 1) >= .3;

/** A handle: the points it moves together (the shoulders as one: the trunk takes their middle), its name and its colour
 * (each leg its own, as the model names the sides; which is which is seen on the picture). */
interface Handle { id: string; points: number[]; name: string; color: string; leg: string }
const LEG_COLORS = ['#5ec8ff', '#ff8fb1'], LEG_NAMES = ['水色の脚', 'ピンクの脚'];
function handlesOf(editable: readonly number[]): Handle[] {
  const out: Handle[] = [];
  if (editable.includes(11) || editable.includes(12)) out.push({ id: 'shoulders', points: [11, 12].filter(k => editable.includes(k)), name: '肩', color: '#ffffff', leg: '' });
  for (const side of [0, 1]) for (const [base, name] of [[23, '腰'], [25, '膝'], [27, '足首']] as const)
    if (editable.includes(base + side)) out.push({ id: `${base + side}`, points: [base + side], name, color: LEG_COLORS[side], leg: LEG_NAMES[side] });
  return out;
}

/** The skeleton of one frame set by hand: the frame as its picture was cut (`still`, from usePhasePictures: no second
 * reading of the video, which with the pictures still being made hung a page on a 4K video), the skeleton and the
 * measured lines on it, and a handle on each point that can be moved; a point is dragged with a finger, or chosen (on the
 * picture or by name) and moved with the arrows. `onDone` gets the points moved (normalized). */
export default function PoseEditor({ still: cut, frame, marks = [], editable = EDITABLE, edited, onDone, onCancel, onReset }: {
  still: PhaseStill; frame: CrouchFrame; marks?: Mark[]; editable?: readonly number[]; edited: boolean;
  onDone: (moved: Record<number, { x: number; y: number }>) => void; onCancel: () => void; onReset?: () => void;
}) {
  const start = useMemo(() => copyPose(anglePose(frame) ?? []), [frame]);
  const [pose, setPose] = useState<CrouchPoint[]>(start), [moved, setMoved] = useState<ReadonlySet<number>>(new Set());
  const handles = useMemo(() => handlesOf(editable).filter(h => h.points.some(k => seen(start[k]))), [editable, start]);
  const [chosen, setChosen] = useState<string | null>(null);
  const [still, setStill] = useState<{ image: HTMLImageElement; view: PhaseStill['view']; W: number; H: number } | null>(null);
  const [failed, setFailed] = useState(false);
  const canvas = useRef<HTMLCanvasElement>(null), drag = useRef<{ id: string; dx: number; dy: number; pointer: number } | null>(null);
  useEffect(() => { setPose(start); setMoved(new Set()); setChosen(null); }, [start]);

  useEffect(() => {
    let closed = false;
    const image = new Image();
    image.onload = () => { if (!closed) setStill({ image, view: cut.view, W: cut.W, H: cut.H }); };
    image.onerror = () => { if (!closed) setFailed(true); };
    image.src = cut.image;
    return () => { closed = true; };
  }, [cut]);

  // Picture pixels ↔ normalized points.
  const to = (q: { x: number; y: number }) => still ? { x: (q.x * still.W - still.view.x) * PIC_W / still.view.w, y: (q.y * still.H - still.view.y) * PIC_W / still.view.w } : { x: 0, y: 0 };
  const from = (x: number, y: number) => still ? { x: (x * still.view.w / PIC_W + still.view.x) / still.W, y: (y * still.view.w / PIC_W + still.view.y) / still.H } : { x: 0, y: 0 };
  const at = (h: Handle, p = pose) => { const pts = h.points.filter(k => seen(p[k])).map(k => to(p[k])); return pts.length ? { x: pts.reduce((s, q) => s + q.x, 0) / pts.length, y: pts.reduce((s, q) => s + q.y, 0) / pts.length } : null; };
  // The points on the picture (cut round a leg, the shoulders may be off it).
  const onPicture = (h: Handle) => { const q = still ? at(h, start) : null; return !!q && q.x >= -20 && q.x <= PIC_W + 20 && q.y >= -20 && q.y <= PIC_H + 20; };
  const shown = still ? handles.filter(onPicture) : handles;

  useEffect(() => {
    const c = canvas.current, ctx = c?.getContext('2d');
    if (!c || !ctx || !still) return;
    ctx.clearRect(0, 0, PIC_W, PIC_H);
    ctx.drawImage(still.image, 0, 0, PIC_W, PIC_H);
    drawCrouchFigure(ctx, pose, to, marks, PIC_W / 48, false);
    for (const h of shown) {
      const q = at(h); if (!q) continue;
      const on = h.id === chosen;
      ctx.beginPath(); ctx.arc(q.x, q.y, on ? 17 : 12, 0, Math.PI * 2);
      ctx.fillStyle = on ? 'rgba(197,242,58,.35)' : 'rgba(0,0,0,.35)'; ctx.fill();
      ctx.lineWidth = on ? 5 : 3.5; ctx.strokeStyle = on ? '#c5f23a' : h.color; ctx.stroke();
    }
  }, [still, pose, shown, chosen, marks]);   // eslint-disable-line react-hooks/exhaustive-deps

  /** Moves a handle's points so that it sits at picture pixels (x, y). */
  function place(id: string, x: number, y: number) {
    const h = handles.find(q => q.id === id), now = h && at(h);
    if (!h || !now || !still) return;
    const a = from(now.x, now.y), b = from(x, y), dx = b.x - a.x, dy = b.y - a.y;
    setPose(p => p.map((q, i) => h.points.includes(i) && seen(q) ? { ...q, x: q.x + dx, y: q.y + dy } : q));
    setMoved(m => new Set([...m, ...h.points]));
  }
  const picture = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: (e.clientX - r.left) * PIC_W / r.width, y: (e.clientY - r.top) * PIC_H / r.height };
  };
  function down(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!still) return;
    const q = picture(e);
    const near = shown.map(h => ({ h, p: at(h) })).filter((c): c is { h: Handle; p: { x: number; y: number } } => !!c.p)
      .map(c => ({ ...c, d: Math.hypot(c.p.x - q.x, c.p.y - q.y) })).sort((a, b) => a.d - b.d)[0];
    if (!near || near.d > HIT) return;
    setChosen(near.h.id);
    drag.current = { id: near.h.id, dx: near.p.x - q.x, dy: near.p.y - q.y, pointer: e.pointerId };
    e.currentTarget.setPointerCapture(e.pointerId);
    e.preventDefault();
  }
  function move(e: React.PointerEvent<HTMLCanvasElement>) {
    const d = drag.current; if (!d || d.pointer !== e.pointerId) return;
    const q = picture(e);
    place(d.id, q.x + d.dx, q.y + d.dy);
  }
  function up(e: React.PointerEvent<HTMLCanvasElement>) { if (drag.current?.pointer === e.pointerId) drag.current = null; }
  function nudge(dx: number, dy: number) {
    const h = handles.find(q => q.id === chosen), now = h && at(h);
    if (h && now) place(h.id, now.x + dx * NUDGE, now.y + dy * NUDGE);
  }
  function done() {
    const out: Record<number, { x: number; y: number }> = {};
    for (const k of moved) if (seen(pose[k])) out[k] = { x: pose[k].x, y: pose[k].y };
    onDone(out);
  }
  const chosenHandle = handles.find(h => h.id === chosen) ?? null, pending = moved.size > 0;

  return <div className="pose-editor" aria-label="骨格を手で直す">
    {still ? <canvas ref={canvas} width={PIC_W} height={PIC_H} aria-label="骨格の点を動かす画像" data-handles={JSON.stringify(shown.map(h => ({ id: h.id, ...(at(h) ?? {}) })))}
      onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} />
      : <div className="sprint10-phase-wait">{failed ? '画像を作れませんでした' : '画像を作成しています…'}</div>}
    <p className="pose-editor-hint">直したい点（肩・腰・膝・足首）を指で動かします。点を押して選び、矢印で細かく動かすこともできます。</p>
    <div className="sprint10-chips pose-editor-points" role="group" aria-label="動かす点を選ぶ">{shown.map(h =>
      <button key={h.id} type="button" aria-pressed={h.id === chosen} aria-label={h.leg ? `${h.name}（${h.leg}）` : h.name} onClick={() => setChosen(h.id)}>
        <i style={{ borderColor: h.color }} aria-hidden="true" />{h.name}</button>)}</div>
    <div className="pose-editor-nudge" role="group" aria-label={chosenHandle ? `${chosenHandle.name}${chosenHandle.leg ? `（${chosenHandle.leg}）` : ''}を動かす` : '点を選ぶと矢印で動かせます'}>
      {([['←', -1, 0, '左へ'], ['↑', 0, -1, '上へ'], ['↓', 0, 1, '下へ'], ['→', 1, 0, '右へ']] as const).map(([mark, dx, dy, word]) =>
        <button key={word} type="button" disabled={!chosenHandle} aria-label={`選んだ点を${word}`} onClick={() => nudge(dx, dy)}>{mark}</button>)}
    </div>
    {pending && <p className="pose-editor-pending" role="status">まだ決めていません。「この骨格に決める」を押すと数値に入ります。</p>}
    <div className="pose-editor-actions">
      <button type="button" className={pending ? 'sprint10-primary pending' : 'sprint10-primary'} disabled={!pending} onClick={done}>この骨格に決める</button>
      {edited && onReset && <button type="button" onClick={onReset}>自動の骨格に戻す</button>}
      <button type="button" onClick={onCancel}>やめる</button>
    </div>
  </div>;
}
