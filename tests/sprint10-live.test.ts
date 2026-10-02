import { describe, expect, it } from 'vitest';
import { CONTESTED_RUN, LOST_RUN, settledRun, SETTLE_SECONDS } from '../src/sprint10/live';
import type { SprintSample } from '../src/sprint10/analysis';

// A runner at 0.3 image widths/s through gates at 0.2 (0.5 s) and 0.8 (2.5 s), sampled at 30 fps as from a camera.
const camera = (until: number, fps = 30): SprintSample[] => Array.from({ length: Math.floor(until * fps) + 1 }, (_, i) => {
  const pts = 100 + i / fps, t = i / fps, gap = .03 + .25 * Math.abs(Math.cos(4 * Math.PI * t));
  return { frame: i, pts, hipX: .05 + .3 * t, ankleGap: gap, kneeGap: gap * .5, legLength: .3 };
});
const options = { startX: .2, finishX: .8, start: 'flying' as const, distanceM: 10 };

describe('live sprint runs', () => {
  it('reports a run only once the exit was crossed SETTLE_SECONDS ago, with its time and average speed', () => {
    expect(settledRun(camera(2.4), options, 102.4)).toBeNull();                      // not at the exit yet
    expect(settledRun(camera(2.6), options, 102.6)).toBeNull();                      // crossed 0.1 s ago
    const run = settledRun(camera(2.5 + SETTLE_SECONDS + .05), options, 100 + 2.5 + SETTLE_SECONDS + .05) as Exclude<ReturnType<typeof settledRun>, 'invalid' | null>;
    expect(run.duration).toBeCloseTo(2, 2); expect(run.speed).toBeCloseTo(5, 1);
    expect(run.startPts).toBeCloseTo(100.5, 2); expect(run.finishPts).toBeCloseTo(102.5, 2);
    expect(run.notes).toEqual([]); expect(run.failure).toBeNull();
  });
  it('gives a run without a time, saying why, when the subject passed the exit but was lost on the way', () => {
    // Recorded: the entry of one pass and the exit of a later one, joined across a lost track.
    const lost = camera(3).map(s => s.pts - 100 > .8 && s.pts - 100 < 1.9 ? { ...s, hipX: null } : s);
    const run = settledRun(lost, options, 103) as { duration: number | null; failure: string | null };
    expect(run.duration).toBeNull(); expect(run.failure).toBe(LOST_RUN);
  });
  it('gives a run without a time when the entry was not measured, so later runs keep their numbers', () => {
    // Not seen from 0.3 s to 0.8 s (the entry at 0.5 s), then followed to well past the exit.
    const hidden = camera(3).map(s => s.pts - 100 > .3 && s.pts - 100 < .8 ? { ...s, hipX: null } : s);
    expect(settledRun(hidden.filter(s => s.pts - 100 < 2.6), options, 102.6)).toBeNull();     // not settled yet
    const run = settledRun(hidden, options, 103) as { duration: number | null; failure: string | null; finishPts: number };
    expect(run.duration).toBeNull(); expect(run.failure).toContain('入口の線'); expect(run.finishPts).toBeGreaterThan(102.4);
  });
  it('asks about the exit, not the video, when the exit crossing was not seen', () => {
    // Hidden from 0.3 s before the exit (2.5 s) until after it: too long to extend.
    const hidden = camera(3).map(s => s.pts - 100 > 2.2 && s.pts - 100 < 2.7 ? { ...s, hipX: null } : s);
    const run = settledRun(hidden, options, 103) as { duration: number | null; failure: string };
    expect(run.duration).toBeNull(); expect(run.failure).toContain('出口の線の通過'); expect(run.failure).not.toContain('動画');
  });
  it('ignores someone walking through both gates', () => {
    const slow = camera(13.5, 30).map(s => ({ ...s, hipX: .05 + .06 * (s.pts - 100) }));    // 1 m/s, exit at 12.5 s
    expect(settledRun(slow, options, 113.5)).toBe('invalid');
  });
  it('gives no time for a run where a nearer runner was seen but not followed', () => {
    const run = settledRun(camera(3), options, 103, true) as Exclude<ReturnType<typeof settledRun>, 'invalid' | null>;
    expect(run.duration).toBeNull(); expect(run.speed).toBeNull(); expect(run.failure).toBe(CONTESTED_RUN);
    expect(run.finishPts).toBeCloseTo(102.5, 2);
  });
  it('says when a gate time was estimated, and never reports without a subject', () => {
    const hidden = camera(3).map(s => s.pts - 100 > .45 && s.pts - 100 < .55 ? { ...s, hipX: null } : s);
    expect((settledRun(hidden, options, 103) as { notes: string[] }).notes[0]).toContain('入口の線を越える瞬間');
    expect(settledRun(camera(3).map(s => ({ ...s, hipX: null })), options, 103)).toBeNull();
  });
});
