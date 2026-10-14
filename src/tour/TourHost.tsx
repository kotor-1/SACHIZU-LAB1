import { useEffect, useRef, useState } from 'react';
import GuidedTour, { partOf } from './GuidedTour';
import { markSeen, mayOpenItself, TOUR_EVENT, tourHost, wasSeen, type Tour } from './tour';
import { BUSY, setOf, type TourSet } from './tours';
import './tour.css';

tourHost.on = true;

const query = (sel: string) => { try { return document.querySelector(sel); } catch { return null; } };
const busy = () => query(BUSY) !== null;
/** The tour for the screen as it is: its result's once there is one, else its first visit's. */
const tourNow = (set: TourSet): Tour => set.results && set.resultsAt && query(set.resultsAt) ? set.results : set.setup;

/** A screen's tours (src/tour/tours.ts). Its first visit's opens by itself once the screen is drawn, and its first result's
 * once a result shows, each once on this device and never while something runs (an analysis, a camera); the 「使い方」
 * buttons open the one for what is on the screen. */
export default function TourHost({ page }: { page: string }) {
  const [open, setOpen] = useState<Tour | null>(null), shown = useRef<Tour | null>(null);
  shown.current = open;

  useEffect(() => {
    const ask = () => { const set = setOf(page); if (set && !shown.current) setOpen(tourNow(set)); };
    window.addEventListener(TOUR_EVENT, ask);
    return () => window.removeEventListener(TOUR_EVENT, ask);
  }, [page]);

  useEffect(() => {
    if (!mayOpenItself(location.search, navigator.webdriver)) return;
    let timer: ReturnType<typeof setTimeout> | undefined, frame = 0;
    // Looked at again whenever the page changes (a frame later, once for many changes).
    const check = () => {
      frame = 0;
      if (shown.current || busy()) { clearTimeout(timer); timer = undefined; return; }
      const set = setOf(page); if (!set || timer !== undefined) return;
      const tour = tourNow(set);
      if (wasSeen(tour.id) || !tour.steps.some(s => s.at !== undefined && partOf(s))) return;   // seen, or the screen not drawn yet
      // A moment for the screen to settle (a result scrolls itself into view).
      timer = setTimeout(() => {
        timer = undefined;
        const now = setOf(page);
        if (!shown.current && !busy() && now && tourNow(now) === tour && !wasSeen(tour.id)) { markSeen(tour.id); setOpen(tour); }
        else later();
      }, tour === set.results ? 1200 : 600);
    };
    const later = () => { if (!frame) frame = requestAnimationFrame(check); };
    const watch = new MutationObserver(later);
    watch.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['aria-pressed', 'hidden', 'data-busy'] });
    later();
    return () => { watch.disconnect(); clearTimeout(timer); cancelAnimationFrame(frame); };
  }, [page]);

  return open ? <GuidedTour key={open.id} tour={open} onClose={() => { markSeen(open.id); setOpen(null); }} /> : null;
}
