import { afterEach, describe, expect, it, vi } from 'vitest';
import { EDGE, GAP, markSeen, mayOpenItself, onScreen, padded, PAD, placeBubble, scrollFor, wasSeen } from '../src/tour/tour';
import { SETS } from '../src/tour/tours';

const phone = { w: 390, h: 844 };

describe('where the guided tour puts its bubble', () => {
  const size = { w: 366, h: 200 };
  it('goes under the lit part when it fits, centred on it and kept inside the screen', () => {
    const p = placeBubble({ x: 16, y: 100, w: 120, h: 44 }, size, phone);
    expect(p).toEqual({ x: EDGE, y: 100 + 44 + GAP, side: 'below' });
  });
  it('goes over it when there is no room under it', () => {
    const p = placeBubble({ x: 100, y: 700, w: 200, h: 60 }, size, phone);
    expect(p.side).toBe('above');
    expect(p.y).toBe(700 - GAP - 200);
    expect(p.x + size.w).toBeLessThanOrEqual(phone.w - EDGE);
  });
  it('lies at the foot over the part\'s lower end when neither fits, its top kept in sight, or at the top when that would hide it', () => {
    expect(placeBubble({ x: 0, y: 60, w: 390, h: 700 }, size, phone)).toEqual({ x: EDGE, y: phone.h - EDGE - 200, side: 'over' });
    expect(placeBubble({ x: 6, y: 240, w: 378, h: 366 }, { w: 366, h: 260 }, phone)).toEqual({ x: EDGE, y: 844 - EDGE - 260, side: 'over' });   // the crouch start's line card on its short page
    expect(placeBubble({ x: 0, y: 150, w: 390, h: 240 }, size, { w: 390, h: 400 })).toEqual({ x: EDGE, y: EDGE, side: 'over' });   // a phone on its side
  });
  it('is in the middle without a part', () => {
    expect(placeBubble(null, size, phone)).toEqual({ x: EDGE, y: (844 - 200) / 2, side: 'middle' });
  });
  it('lights the part with room round it, and only the part on the screen', () => {
    expect(padded({ x: 10, y: 20, w: 30, h: 40 })).toEqual({ x: 10 - PAD, y: 20 - PAD, w: 30 + 2 * PAD, h: 40 + 2 * PAD });
    expect(onScreen({ x: -10, y: 800, w: 100, h: 100 }, phone)).toEqual({ x: 0, y: 800, w: 90, h: 44 });
    expect(onScreen({ x: 0, y: 900, w: 100, h: 100 }, phone)).toBeNull();
  });
});

describe('how far the guided tour scrolls to a part', () => {
  it('does not scroll to a part in view with room for the bubble', () => {
    expect(scrollFor({ x: 0, y: 200, w: 390, h: 100 }, 220, phone)).toBe(0);
  });
  it('brings a part below the screen up, with its bubble, to the middle of the screen less the bar at the foot', () => {
    const band = { top: 0, bottom: 744 }, part = { x: 0, y: 1500, w: 390, h: 120 };
    const dy = scrollFor(part, 220, phone, band), top = part.y - dy;
    const room = band.bottom - band.top - 2 * EDGE, need = part.h + GAP + 220;
    expect(top).toBeCloseTo(EDGE + (room - need) / 2, 0);
    expect(top + need).toBeLessThanOrEqual(band.bottom - EDGE);
  });
  it('brings a part too tall for the screen to its top', () => {
    expect(scrollFor({ x: 0, y: 900, w: 390, h: 1000 }, 220, phone)).toBe(900 - EDGE);
  });
  it('clears a bar stuck to the top', () => {
    const dy = scrollFor({ x: 0, y: 20, w: 390, h: 60 }, 220, phone, { top: 56, bottom: 844 });
    expect(20 - dy).toBeGreaterThanOrEqual(56 + EDGE);
  });
});

describe('when a guided tour may open by itself', () => {
  it('opens for people, not in a browser run by a script unless asked, and never when turned off', () => {
    expect(mayOpenItself('?lab=cmj', false)).toBe(true);
    expect(mayOpenItself('?lab=cmj', undefined)).toBe(true);
    expect(mayOpenItself('?lab=cmj', true)).toBe(false);
    expect(mayOpenItself('?lab=cmj&tour=auto', true)).toBe(true);
    expect(mayOpenItself('?tour=off', false)).toBe(false);
  });
});

describe('the tours seen on this device', () => {
  afterEach(() => { vi.unstubAllGlobals(); });
  it('are kept in the browser\'s storage', () => {
    const store = new Map<string, string>();
    vi.stubGlobal('localStorage', { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => { store.set(k, v); } });
    expect(wasSeen('crouch')).toBe(false);
    markSeen('crouch'); markSeen('crouch');
    expect(JSON.parse(store.get('sachizu-tours-seen')!)).toEqual(['crouch']);
    expect(wasSeen('crouch')).toBe(true);
  });
  it('are remembered on the page when the storage is blocked (a private window)', () => {
    vi.stubGlobal('localStorage', { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('blocked'); } });
    expect(wasSeen('hurdle-x')).toBe(false);
    expect(() => markSeen('hurdle-x')).not.toThrow();
    expect(wasSeen('hurdle-x')).toBe(true);
  });
});

describe('the words of every screen\'s tours', () => {
  const pages = ['home', 'cmj', 'rj', 'sprint10', 'flying', 'crouch', 'hurdle', 'jav', 'shot', 'highjump', 'longjump', 'curve', 'strength', 'posture'];
  const tours = Object.values(SETS).flatMap(s => [s.setup, ...(s.results ? [s.results] : [])]);
  it('cover every screen, with a result tour where there is a result', () => {
    expect(Object.keys(SETS).sort()).toEqual([...pages].sort());
    for (const [page, set] of Object.entries(SETS)) if (page !== 'home') { expect(set.results, page).toBeDefined(); expect(set.resultsAt, page).toBeTruthy(); }
  });
  it('have their own names, and short steps a phone\'s bubble can hold', () => {
    const ids = tours.map(t => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const t of tours) {
      expect(t.steps.length, t.id).toBeGreaterThanOrEqual(2);
      for (const s of t.steps) {
        expect(s.title.length, `${t.id}: ${s.title}`).toBeLessThanOrEqual(18);
        expect(s.text.length, `${t.id}: ${s.title}`).toBeLessThanOrEqual(90);
        expect((s.items ?? []).length, `${t.id}: ${s.title}`).toBeLessThanOrEqual(6);
      }
    }
  });
  it('end the first visit\'s tour of every analysis screen at 「使い方」, to be seen again', () => {
    for (const [page, set] of Object.entries(SETS)) expect(set.setup.steps.at(-1)!.at, page).toBe('.tour-open');
  });
  it('tell how to set the skeleton by hand wherever a pose picture can be set', () => {
    for (const page of ['crouch', 'hurdle', 'jav', 'shot', 'highjump', 'longjump', 'strength'])
      expect(SETS[page].results!.steps.some(s => /骨格を直す/.test(s.text)), page).toBe(true);
  });
});
