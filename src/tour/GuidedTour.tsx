import { useEffect, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import { onScreen, padded, placeBubble, scrollFor, type Box, type Side, type Tour, type TourStep } from './tour';

/** The bars kept over the page (sprint10.css): the result tabs stick to the top of the screen once their card is
 * scrolled past them, the analyse step to its foot while the cards above it are worked. A part is brought into view clear
 * of them. */
const TOP_BAR = '.sprint10-tabs', FOOT_BAR = '.sprint10-run';

const selectors = (at: string | readonly string[] | undefined): readonly string[] => at === undefined ? [] : typeof at === 'string' ? [at] : at;
/** The first of the selectors on the page and drawn (not in a hidden panel or a closed fold), or null. */
function first(sels: readonly string[]): Element | null {
  for (const sel of sels) {
    let el: Element | null = null;
    try { el = document.querySelector(sel); } catch { continue; }   // a selector this browser cannot read
    if (el && el.getClientRects().length > 0 && el.getBoundingClientRect().width > 0) return el;
  }
  return null;
}
/** A step's part on the screen now. */
export const partOf = (s: TourStep) => first(selectors(s.at));
const boxOf = (r: DOMRect): Box => ({ x: r.left, y: r.top, w: r.width, h: r.height });
const view = () => ({ w: window.innerWidth, h: window.innerHeight });

/** The screen less the bars that will be over the part once it is scrolled to: the result tabs above it in its card (they
 * stick to the top as the card scrolls up, even when not stuck yet), the analyse step stuck to the foot now. */
function bandOf(part: Element) {
  const h = window.innerHeight, p = part.getBoundingClientRect(); let top = 0, bottom = h;
  for (const el of document.querySelectorAll(TOP_BAR)) {
    if (el.contains(part) || part.contains(el) || !el.parentElement?.contains(part)) continue;
    const r = el.getBoundingClientRect();
    if (r.height > 0 && r.bottom <= p.top + 1) top = Math.max(top, r.height);
  }
  for (const el of document.querySelectorAll(FOOT_BAR)) {
    if (el.contains(part) || part.contains(el)) continue;
    const r = el.getBoundingClientRect();
    if (r.height > 0 && r.bottom >= h - 1 && r.top > h / 2 && r.top < h) bottom = Math.min(bottom, r.top);
  }
  return { top, bottom };
}

interface Layout { hole: Box | null; x: number; y: number; side: Side; arrow: number }

/** One tour over the page: the page dimmed with a lit hole round the step's part (it follows the part as the page moves),
 * and a bubble beside it with the step's words, 戻る / 次へ (終わる on the last) and ×. Taps on the page are held while it is
 * open; Esc closes it, ← → step through it. The steps whose parts are not on the screen are left out and not counted. */
export default function GuidedTour({ tour, onClose }: { tour: Tour; onClose: () => void }) {
  const steps = useMemo(() => tour.steps.filter(s => s.at === undefined || partOf(s) !== null), [tour]);
  const [at, setAt] = useState(0), step = steps[at] as TourStep | undefined;
  const [layout, setLayout] = useState<Layout | null>(null);
  const bubble = useRef<HTMLDivElement>(null), close = useRef(onClose); close.current = onClose;
  const reduce = useMemo(() => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches, []);
  const items = useMemo(() => (step?.items ?? []).filter(it => it[2] === undefined || first(selectors(it[2])) !== null), [step]);

  // Focus back where it was when the tour closes (the 「使い方」 button).
  useEffect(() => { const before = document.activeElement as HTMLElement | null; return () => { if (before?.isConnected) before.focus?.({ preventScroll: true }); }; }, []);
  useEffect(() => { if (!steps.length) close.current(); }, [steps]);
  useEffect(() => {
    const esc = (e: globalThis.KeyboardEvent) => { if (e.key === 'Escape') { e.preventDefault(); close.current(); } };
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, []);

  // Each step: its part scrolled into view clear of the stuck bars, then the hole and the bubble kept on it every frame.
  useLayoutEffect(() => {
    if (!step) return;
    setLayout(null);
    const part = partOf(step);
    if (part) {
      const dy = scrollFor(boxOf(part.getBoundingClientRect()), bubble.current?.offsetHeight || 220, view(), bandOf(part));
      if (Math.abs(dy) > 2) window.scrollBy({ top: dy, behavior: reduce ? 'auto' : 'smooth' });
    }
    let frame = 0, last = '';
    const tick = () => {
      const el = part?.isConnected ? part : step.at === undefined ? null : partOf(step), v = view();
      const hole = el ? padded(boxOf(el.getBoundingClientRect())) : null, seen = hole && onScreen(hole, v);
      const b = bubble.current, size = { w: b?.offsetWidth || 320, h: b?.offsetHeight || 200 };
      const p = placeBubble(seen, size, v), arrow = seen ? Math.max(22, Math.min(size.w - 22, seen.x + seen.w / 2 - p.x)) : 0;
      const key = [hole?.x, hole?.y, hole?.w, hole?.h, p.x, p.y, p.side, arrow].map(n => typeof n === 'number' ? Math.round(n) : n).join();
      if (key !== last) { last = key; setLayout({ hole, ...p, arrow }); }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [step, reduce]);
  // The bubble focused once placed, so a screen reader reads the step.
  const placed = layout !== null;
  useEffect(() => { if (placed) bubble.current?.focus({ preventScroll: true }); }, [placed, at]);

  if (!step) return null;
  const next = () => at + 1 < steps.length ? setAt(at + 1) : onClose(), back = () => { if (at > 0) setAt(at - 1); };
  function keys(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'ArrowRight') { e.preventDefault(); next(); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); back(); }
    else if (e.key === 'Tab') {   // kept inside the bubble
      const buttons = [...(bubble.current?.querySelectorAll('button') ?? [])]; if (!buttons.length) return;
      const i = buttons.indexOf(document.activeElement as HTMLButtonElement);
      if (e.shiftKey && i <= 0) { e.preventDefault(); buttons[buttons.length - 1].focus(); }
      else if (!e.shiftKey && (i === -1 || i === buttons.length - 1)) { e.preventDefault(); buttons[0].focus(); }
    }
  }
  const hole = layout?.hole;
  return createPortal(<div className="tour">
    <div className="tour-block" />
    {hole ? <div className="tour-hole" style={{ left: hole.x, top: hole.y, width: hole.w, height: hole.h }} /> : <div className="tour-dim" />}
    <div ref={bubble} className={`tour-bubble ${layout?.side ?? 'middle'}`} role="dialog" aria-modal="true" aria-labelledby="tour-title" aria-describedby="tour-text"
      tabIndex={-1} onKeyDown={keys} style={layout ? { left: layout.x, top: layout.y } : { left: 0, top: 0, visibility: 'hidden' }}>
      <div className="tour-head"><span className="tour-count">{at + 1} / {steps.length}</span>
        <button type="button" className="tour-close" aria-label="案内をとじる" onClick={onClose}>×</button></div>
      <h2 id="tour-title">{step.title}</h2>
      <p id="tour-text">{step.text}</p>
      {items.length > 0 && <ul className="tour-items">{items.map(([name, what]) => <li key={name}><b>{name}</b>{what}</li>)}</ul>}
      <div className="tour-actions">{at > 0 && <button type="button" className="tour-back" onClick={back}>戻る</button>}
        <button type="button" className="tour-next" onClick={next}>{at + 1 < steps.length ? '次へ' : '終わる'}</button></div>
      {(layout?.side === 'below' || layout?.side === 'above') && <i className="tour-arrow" style={{ left: layout.arrow }} aria-hidden="true" />}
    </div>
  </div>, document.body);
}
