import { openTour, tourHost } from './tour';

/** 「使い方」: the screen's guided tour, again (src/tour/TourHost.tsx). */
export default function TourButton() {
  if (!tourHost.on) return null;
  // The name kept when the words are hidden (the CMJ header on a narrow phone shows the mark alone).
  return <button type="button" className="tour-open" aria-label="使い方" aria-haspopup="dialog" onClick={openTour}>
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9.5" /><path d="M9.6 9.3a2.5 2.5 0 0 1 4.9.8c0 1.7-2.5 2.3-2.5 3.9" /><path d="M12 17.3h.01" /></svg><span>使い方</span></button>;
}
