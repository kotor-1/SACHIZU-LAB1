import { describe, expect, it } from 'vitest';
import { LiveCountdown } from '../src/cmj/live-countdown';
import { COMStream } from '../src/cmj/com-stream';
import type { SessionUpdate } from '../src/cmj/video-session';

const state = (sourcePts: number, patch: Partial<SessionUpdate> = {}): SessionUpdate => ({
  sourcePts, phase: 'READY', detectedPeople: 1, results: [], backend: 'CPU', processedFrames: 100,
  inferenceMs: 10, playbackRate: 1, slowDevice: false, landmarks: [], com: null, observationReason: null, ...patch,
});
const advance = (countdown: LiveCountdown, from: number, until: number) => {
  for (let time = from; time <= until; time += .25) countdown.observe(state(time));
  return countdown.cue;
};

describe('live countdown before each attempt', () => {
  it('counts three full seconds of fresh ready observations before arming', () => {
    const countdown = new LiveCountdown();
    expect(countdown.observe(state(0, { phase: 'PREPARING' }))).toBeNull();
    expect(advance(countdown, 1, 1.75)).toBe(3);
    expect(advance(countdown, 2, 2.75)).toBe(2);
    expect(advance(countdown, 3, 3.75)).toBe(1);
    expect(countdown.armed).toBe(false);
    expect(countdown.observe(state(4))).toBe('jump');
    expect(countdown.armed).toBe(true);
    expect(countdown.observe(state(4.25, { phase: 'MOVING' }))).toBeNull();
    expect(countdown.armed).toBe(true);
  });
  it('restarts after occlusion, lost preparation, warm-up, or stalled capture', () => {
    for (const patch of [{ observationReason: 'BODY_POINT_OCCLUDED' }, { phase: 'PREPARING' as const },
      { modelWarmingUp: true }, { detectedPeople: 0 }]) {
      const countdown = new LiveCountdown(); advance(countdown, 0, 2);
      expect(countdown.observe(state(2.25, patch))).toBeNull();
      expect(countdown.observe(state(2.5))).toBe(3);
      expect(countdown.armed).toBe(false);
    }
    const countdown = new LiveCountdown(); advance(countdown, 0, 2);
    expect(countdown.observe(state(10))).toBe(3);
    expect(countdown.armed).toBe(false);
  });
  it('requires a new countdown after each result and a new session', () => {
    const countdown = new LiveCountdown(); advance(countdown, 0, 3);
    expect(countdown.armed).toBe(true);
    const results = [{ id: 1 }] as SessionUpdate['results'];
    expect(countdown.observe(state(3.25, { results, phase: 'PREPARING' }))).toBeNull();
    expect(countdown.armed).toBe(false);
    expect(countdown.observe(state(3.5, { results }))).toBe(3);
    expect(new LiveCountdown().armed).toBe(false);
  });
  it('keeps real COM preparation active but cannot collect movement results before the cue', () => {
    const stream = new COMStream();
    const sample = (frame: number, comY = 500) => ({ frame, pts: frame / 30, comX: 480, comY, bodyScale: 400 });
    for (let frame = 0; frame < 30; frame++) expect(stream.push(sample(frame), false)).toBeNull();
    expect(stream.phase).toBe('READY');
    for (let frame = 30; frame < 180; frame++) {
      expect(stream.push(sample(frame, 500 + 80 * Math.sin(frame / 5)), false)).toBeNull();
      expect(['PREPARING', 'READY']).toContain(stream.phase);
    }
    for (let frame = 180; frame < 210; frame++) stream.push(sample(frame), false);
    expect(stream.phase).toBe('READY');
    stream.push(sample(210, 530), true);
    expect(stream.phase).toBe('MOVING');
  });
});
