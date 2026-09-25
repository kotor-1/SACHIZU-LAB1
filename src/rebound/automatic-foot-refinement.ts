import type { FirstContact } from '../cmj/ExactFramePicker';
import type { JumpMode } from './lower-body';
import type { RegisteredAnalysis } from './registered-template';
import { correctRegistered } from './registered-corrections';
import { fitCurvedPixelBoundary, type PixelRow } from './pixel-foot';
import { missingPixelSeed, refineReview } from './review-refinement';

/** Preserve every previously accepted event and its chosen recording-wide
 * polarity. Only failed takeoffs receive a curved-support second pass. */
export function refineAutomaticReview(base: RegisteredAnalysis, rows: readonly PixelRow[], frames: readonly FirstContact[], mode: JumpMode): RegisteredAnalysis {
  const original = refineReview(base, rows, frames, mode);
  if (!original.footRefinement) return original;
  if (!frames.length || frames.some((f, i) => !Number.isFinite(f.pts) || !Number.isInteger(f.frame)
    || i > 0 && (f.pts <= frames[i - 1].pts || f.frame <= frames[i - 1].frame))
    || rows.some((r, i) => !frames.some(f => f.frame === r.frame && Math.abs(f.pts - r.pts) < 1e-7)
      || i > 0 && r.pts <= rows[i - 1].pts)) return original;
  const polarity = original.footRefinement.polarity;
  const selected = rows.map(r => ({ ...r, feet: polarity === 'BRIGHT' ? r.brightFeet ?? r.feet : polarity === 'DARK' ? r.darkFeet ?? r.feet : r.feet }));
  const sides: (0 | 1)[] = mode === 'BOTH' ? [0, 1] : mode === 'LEFT' ? [0] : [1];
  const jumps = original.jumps.map(j => ({ ...j }));
  const events = original.footRefinement.events.map(e => ({ ...e }));
  for (let i = 0; i < jumps.length; i++) {
    const j = jumps[i], event = events.find(e => e.jump === j.jump && e.kind === 'takeoff');
    if (!event || event.applied || j.takeoff?.source === 'MANUAL') continue;
    const seed = event.originalPts ?? missingPixelSeed(base, frames, i, 'takeoff');
    if (seed === null) continue;
    const alternatives = [-.04, -.02, 0, .02, .04].map(offset => sides.map((side, sideIndex) => {
      // A valid other foot is evidence, not a substitute for the failed foot.
      // Keep its original nine-window/threshold fit, and independently recover
      // the missing side from at least two search starts below.
      const known = event.feet[sideIndex];
      return known?.pts !== null && known?.pts !== undefined && !known.reason ? known
        : fitCurvedPixelBoundary(selected, side, seed + offset, 'takeoff');
    }))
      .filter(feet => feet.every(f => f.pts !== null) && Math.max(...feet.map(f => f.pts!)) - Math.min(...feet.map(f => f.pts!)) <= .025 + 1e-9);
    if (alternatives.length < 2) continue;
    const times = alternatives.map(feet => Math.max(...feet.map(f => f.pts!)));
    // All successful search starts must agree; no picking just a convenient pair.
    if (Math.max(...times) - Math.min(...times) > .0125 + 1e-9) continue;
    const pts = [...times].sort((a, b) => a - b)[Math.floor(times.length / 2)];
    const apex = frames.find(f => f.frame === base.selectedPeakFrames[i]);
    if (!apex || pts >= apex.pts || !frames.some(f => Math.abs(f.pts - pts) < 1e-7)) continue;
    const f = j.landing ? j.landing.pts - pts : null, previous = jumps[i - 1]?.landing;
    const c = previous ? pts - previous.pts : null;
    if (f !== null && (f < .12 || f > .9) || c !== null && (c < .06 || c > .6)) continue;
    j.takeoff = { pts, source: 'PIXEL_REFINED' };
    event.pts = pts; event.applied = true; event.reason = null; event.feet = alternatives[times.indexOf(pts)];
  }
  const corrected = correctRegistered({ ...original, jumps }, {}, frames);
  if (corrected.error) return original;
  return { ...corrected.analysis, footRefinement: { ...original.footRefinement, version: 'automatic-median-support-v3', events,
    applied: events.filter(e => e.applied).length } };
}
