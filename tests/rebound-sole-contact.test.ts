import { describe, expect, it } from 'vitest';
import { fractionRSI } from '../src/rebound/hybrid-physics';
import { measureSoleBoxes, modelContact, soleBoxes, soleContactReport, soleRegion, SOLE_CONTACT_SETTINGS, type SoleFrame } from '../src/rebound/sole-contact';
import type { ToeCycleReport } from '../src/rebound/toe-cycle-research';

const FPS = 120, LEG = 200, PERIOD = .6;
// Template: both feet flight fraction .6 around each apex -> model contact [a+.18, a+.42].
function report(cycles: number, start = 1): ToeCycleReport {
  const list = Array.from({ length: cycles }, (_, i) => {
    const startPts = start + i * PERIOD;
    return { id: i + 1, fromPeak: i + 1, toPeak: i + 2, startPts, endPts: startPts + PERIOD, period: PERIOD, reason: null,
      result: { value: fractionRSI(PERIOD, .6), fraction: .6, footFractions: [.6, .6], footPhases: [0, 0] } };
  });
  const samples = Array.from({ length: Math.round((start + cycles * PERIOD + 1) * FPS) }, (_, n) => ({ pts: n / FPS, bodyScale: LEG }));
  return { cycles: list, samples, reason: null, mean: fractionRSI(PERIOD, .6) } as unknown as ToeCycleReport;
}
/** Shoe bottom row (image y, down-positive): falls onto the floor at `land`,
 * rolls slowly onto the tip for 30 ms, then leaves fast at `off`. */
function soleRow(t: number, land: number, off: number, floor = 700) {
  const fast = 600, roll = 240, rollStart = off - .03; // roll 240 px/s < 1.3 leg/s = 260 px/s
  if (t < land) return floor - fast * (land - t);
  if (t < rollStart) return floor;
  if (t < off) return floor - roll * (t - rollStart);
  return floor - roll * .03 - fast * (t - off);
}
function soles(events: { land: number; off: number }[], end: number, edit: (f: SoleFrame) => SoleFrame | null = f => f): SoleFrame[] {
  return Array.from({ length: Math.round(end * FPS) }, (_, n) => {
    const t = n / FPS, e = events.find(ev => t < ev.off + .15) ?? events.at(-1)!;
    const y = soleRow(t, e.land, e.off), foot = { dark: y, bright: null };
    return edit({ frame: n, pts: t, feet: [foot, { ...foot }] });
  }).filter((f): f is SoleFrame => f !== null);
}
const frame = 1 / FPS;

describe('RJ sole-contact timing (rj-sole-contact-v1)', () => {
  it('derives the template contact interval from the toe lobes', () => {
    expect(modelContact(report(1).cycles[0])).toEqual({ landing: expect.closeTo(1.18, 9), takeoff: expect.closeTo(1.42, 9) });
  });
  it('times landing and takeoff from shoe-bottom motion, not the slow roll onto the tip', () => {
    const r = report(3), truth = r.cycles.map(c => ({ land: c.startPts + .1771, off: c.startPts + .4352 }));
    const out = soleContactReport(r, soles(truth, 3.2));
    expect(out.reason).toBeNull();
    expect(out.measuredCycles).toBe(3);
    out.cycles.forEach((c, i) => {
      // The roll starts 30 ms earlier but is slower than 1.3 leg lengths/s.
      expect(Math.abs(c.takeoffPts! - truth[i].off)).toBeLessThanOrEqual(frame / 2 + 1e-9);
      expect(Math.abs(c.landingPts! - truth[i].land)).toBeLessThanOrEqual(frame + 1e-9);
      expect(c.value).toBeCloseTo(fractionRSI(PERIOD, 1 - c.contactSeconds! / PERIOD), 12);
    });
    // The template's earlier takeoff (1.42 vs 1.435) gives a shorter contact and a higher RSI.
    expect(out.mean!).toBeLessThan(out.modelMean!);
  });
  it('uses the later foot for takeoff and the earlier foot for landing', () => {
    const r = report(3), truth = r.cycles.map(c => ({ land: c.startPts + .1771, off: c.startPts + .4352 }));
    const late = soles(truth.map(e => ({ land: e.land + .01, off: e.off + .02 })), 3.2);
    const both = soles(truth, 3.2).map((f, i) => ({ ...f, feet: [f.feet[0], late[i].feet[1]] as SoleFrame['feet'] }));
    const out = soleContactReport(r, both);
    out.cycles.forEach((c, i) => {
      expect(c.footTakeoffs[1]!).toBeGreaterThan(c.footTakeoffs[0]!);
      expect(c.takeoffPts).toBe(c.footTakeoffs[1]);
      expect(c.landingPts).toBe(c.footLandings[0]);
      expect(Math.abs(c.takeoffPts! - (truth[i].off + .02))).toBeLessThanOrEqual(frame / 2 + 1e-9);
    });
  });
  it('ignores a one-frame silhouette glitch during support', () => {
    const r = report(3), truth = r.cycles.map(c => ({ land: c.startPts + .1771, off: c.startPts + .4352 }));
    const clean = soleContactReport(r, soles(truth, 3.2));
    const glitch = soleContactReport(r, soles(truth, 3.2, f => Math.abs(f.pts - (truth[0].off - .07)) < frame / 2
      ? { ...f, feet: [{ dark: 680, bright: null }, f.feet[1]] } : f));
    expect(glitch.cycles[0].takeoffPts).toBe(clean.cycles[0].takeoffPts);
  });
  it('does not bridge missing shoe frames at an event and never fills from the template', () => {
    const r = report(3), truth = r.cycles.map(c => ({ land: c.startPts + .1771, off: c.startPts + .4352 }));
    const out = soleContactReport(r, soles(truth, 3.2, f => Math.abs(f.pts - truth[1].off) < .015 ? null : f));
    expect(out.cycles[1]).toMatchObject({ value: null, reason: 'SOLE_EDGE_GAP' });
    expect(out.measuredCycles).toBe(2);
    expect(out.mean).toBeNull();
    expect(out.reason).toBe('SOLE_CONTACT_INSUFFICIENT_CYCLES');
  });
  it('holds when no shoe observations exist (older saved JSON)', () => {
    const out = soleContactReport(report(3), null);
    expect(out).toMatchObject({ available: false, mean: null, reason: 'SOLE_OBSERVATIONS_UNAVAILABLE' });
    expect(out.modelMean).toBeCloseTo(fractionRSI(PERIOD, .6), 12);
  });
  it('rejects an event far from the template contact instead of re-labelling another movement', () => {
    const r = report(3), truth = r.cycles.map(c => ({ land: c.startPts + .1771, off: c.startPts + .4352 }));
    truth[2] = { ...truth[2], off: truth[2].land + .06 };
    const out = soleContactReport(r, soles(truth, 3.2));
    expect(out.cycles[2].value).toBeNull();
    expect(out.cycles[2].reason).toMatch(/^SOLE_/);
  });
  it('measures the shoe bottom identically from a crop and from the full image', () => {
    const width = 540, height = SOLE_CONTACT_SETTINGS.imageHeight, pixels = new Uint8Array(width * height).fill(200);
    const shoe = (x0: number) => { for (let y = 690; y <= 725; y++) for (let x = x0; x < x0 + 40; x++) pixels[y * width + x] = 30; };
    shoe(230); shoe(300);
    const pose = Array.from({ length: 33 }, () => ({ x: .5, y: .5, z: 0, visibility: 1 }));
    for (const [i, x] of [[29, 250], [31, 250], [30, 320], [32, 320]]) pose[i] = { x: x / width, y: 715 / height, z: 0, visibility: 1 };
    const boxes = soleBoxes(pose, width, height), region = soleRegion(boxes, width, height)!;
    const full = measureSoleBoxes({ width, height, pixels }, boxes);
    const crop = new Uint8Array(region.width * region.height);
    for (let y = 0; y < region.height; y++) for (let x = 0; x < region.width; x++) crop[y * region.width + x] = pixels[(region.y + y) * width + region.x + x];
    expect(full[0]!.dark).toBe(725); expect(full[1]!.dark).toBe(725);
    expect(measureSoleBoxes({ width: region.width, height: region.height, pixels: crop }, boxes, region.x, region.y)).toEqual(full);
    expect(soleBoxes(null, width, height)).toEqual([null, null]);
  });
});
