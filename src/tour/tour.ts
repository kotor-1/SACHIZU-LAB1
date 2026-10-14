/** The guided tours (the user, 2026-10-14: 「チュートリアルを作ってください。ガイドツアー式で」, for every screen): a screen's
 * parts lit one at a time, each with a bubble saying what it is for. Here: the steps, which tours were seen, when one may
 * open by itself, and where the lit part and the bubble go (plain numbers, so they are tested without a browser). */

export interface TourStep {
  /** The part to light: CSS selectors, the first one on screen. A step whose part is not on screen is left out (the
   * screen's other mode or state); a step without one is a bubble alone in the middle. */
  at?: string | readonly string[];
  title: string;
  text: string;
  /** Short lines under the text: a name in bold and what it is (the result tabs), each shown only when its selector, if
   * it has one, is on the screen. */
  items?: readonly (readonly [name: string, what: string, at?: string])[];
}
export interface Tour { id: string; steps: readonly TourStep[] }

/** The 「使い方」 buttons ask the page's tour host for its tour with this window event. They show only where a host
 * answers (the public app, whose TourHost sets `on`; not the development screens). */
export const TOUR_EVENT = 'sachizu-tour';
export const openTour = () => window.dispatchEvent(new Event(TOUR_EVENT));
export const tourHost = { on: false };

const KEY = 'sachizu-tours-seen';
const remembered = new Set<string>();
/** The tours opened before on this device (browser storage; without it, on this page only). */
export function wasSeen(id: string): boolean {
  if (remembered.has(id)) return true;
  try { const list: unknown = JSON.parse(localStorage.getItem(KEY) ?? '[]'); return Array.isArray(list) && list.includes(id); } catch { return false; }
}
export function markSeen(id: string) {
  remembered.add(id);
  try {
    const list: unknown = JSON.parse(localStorage.getItem(KEY) ?? '[]'), ids = Array.isArray(list) ? list.filter(x => typeof x === 'string') : [];
    if (!ids.includes(id)) localStorage.setItem(KEY, JSON.stringify([...ids, id]));
  } catch { /* storage blocked (a private window): this page remembers it */ }
}

/** Whether a tour may open by itself: not in a browser run by a script (navigator.webdriver: the checks with Playwright
 * work the screens and must not meet a layer over them), unless the address says `?tour=auto`; never with `?tour=off`. */
export function mayOpenItself(search: string, webdriver: boolean | undefined): boolean {
  const asked = new URLSearchParams(search).get('tour');
  return asked === 'auto' || (asked !== 'off' && !webdriver);
}

export interface Box { x: number; y: number; w: number; h: number }
/** The space between the lit part and the bubble, and the bubble's least distance from the screen's edges (px). */
export const GAP = 12, EDGE = 12;
/** The lit hole: the part with this much room round it (px). */
export const PAD = 6;
export const padded = (b: Box): Box => ({ x: b.x - PAD, y: b.y - PAD, w: b.w + 2 * PAD, h: b.h + 2 * PAD });
/** The part of a box on the screen, or null when none of it is. */
export function onScreen(b: Box, view: { w: number; h: number }): Box | null {
  const x = Math.max(0, b.x), y = Math.max(0, b.y), r = Math.min(view.w, b.x + b.w), bottom = Math.min(view.h, b.y + b.h);
  return r > x && bottom > y ? { x, y, w: r - x, h: bottom - y } : null;
}

export type Side = 'below' | 'above' | 'over' | 'middle';
/** The top of a part kept in sight when the bubble must lie over it (px). */
const TITLE = 60;
/** The bubble's top left: under the lit part when it fits, else over it, else (a part nearly as tall as the screen, or one
 * a short page cannot bring to the middle) at the foot of the screen over the part's lower end, keeping its top (a card's
 * title) in sight, or at the top when even that would hide it. Across, centred on the part and kept inside the screen.
 * Without a part, in the middle. */
export function placeBubble(hole: Box | null, size: { w: number; h: number }, view: { w: number; h: number }): { x: number; y: number; side: Side } {
  const across = (cx: number) => Math.round(Math.max(EDGE, Math.min(cx - size.w / 2, view.w - EDGE - size.w)));
  if (!hole) return { x: across(view.w / 2), y: Math.round(Math.max(EDGE, (view.h - size.h) / 2)), side: 'middle' };
  const cx = hole.x + hole.w / 2, below = hole.y + hole.h + GAP, above = hole.y - GAP - size.h;
  if (below + size.h <= view.h - EDGE) return { x: across(cx), y: Math.round(below), side: 'below' };
  if (above >= EDGE) return { x: across(cx), y: Math.round(above), side: 'above' };
  const foot = view.h - EDGE - size.h;
  return { x: across(cx), y: Math.round(hole.y + TITLE <= foot ? foot : EDGE), side: 'over' };
}

/** How far to scroll the page (px, + is down) to show the part within the band (the screen less the bars stuck to its top
 * and foot) with room for the bubble under it: nothing when it already shows with room above or below; the part and the
 * bubble together in the middle of the band when they fit; else the part's top at the band's top. */
export function scrollFor(part: Box, bubbleH: number, view: { h: number }, band: { top: number; bottom: number } = { top: 0, bottom: view.h }): number {
  const top = band.top + EDGE, bottom = band.bottom - EDGE, room = bottom - top, need = part.h + GAP + bubbleH;
  const shown = part.y >= top && part.y + part.h <= bottom;
  if (shown && (part.y + part.h + GAP + bubbleH <= view.h - EDGE || part.y - GAP - bubbleH >= EDGE)) return 0;
  return Math.round(need <= room ? part.y - (top + (room - need) / 2) : part.y - top);
}
