import { describe, expect, it } from 'vitest';
import { cameraStopReason, displayedResult, isPreviousResult } from '../src/cmj/session-diagnostics';
import { comFeedback } from '../src/cmj/com-feedback';
import type { SessionUpdate } from '../src/cmj/video-session';
import type { COMResult } from '../src/cmj/com-stream';

const attempt = (id: number, heightCm: number | null, reason: string | null = null) =>
  ({ id, analysis: { heightCm, reason } }) as COMResult;
const state = (patch: Partial<SessionUpdate> = {}): SessionUpdate => ({
  phase: 'PREPARING', results: [], backend: 'CPU', processedFrames: 50, sourcePts: 1,
  inferenceMs: 10, playbackRate: 1, slowDevice: false, landmarks: [], com: null, observationReason: null,
  ...patch,
});

describe('live no-result explanation', () => {
  it('distinguishes never prepared, prepared but no movement, and an incomplete jump', () => {
    expect(cameraStopReason(null)).toBe('PREPARATION_NOT_CONFIRMED');
    expect(cameraStopReason(state())).toBe('PREPARATION_NOT_CONFIRMED');
    expect(cameraStopReason(state({ phase: 'READY' }))).toBe('NO_JUMP_DETECTED');
    for (const phase of ['MOVING', 'RECOVERING'] as const)
      expect(cameraStopReason(state({ phase }))).toBe('RECORDING_ENDED_BEFORE_RECOVERY');
  });
  it('retains concrete tracking and cadence failures instead of blaming an absent jump', () => {
    for (const reason of ['BODY_POINT_OCCLUDED', 'CAMERA_TIME_UNAVAILABLE', 'PREPARATION_SAMPLE_CADENCE']) {
      expect(cameraStopReason(state({ observationReason: reason }))).toBe(reason);
      expect(comFeedback(reason)).not.toBe(comFeedback('UNKNOWN'));
    }
    expect(cameraStopReason(state({ streamDiagnostics: { prepared: false, preparationSampleCount: 6,
      preparationSpanSeconds: .5, observationReason: 'PREPARATION_SAMPLE_CADENCE' } }))).toBe('PREPARATION_SAMPLE_CADENCE');
  });
  it('reports an estimator rejection after a completed movement', () => {
    expect(cameraStopReason(state({ results: [attempt(1, null, 'APEX_NOT_BRACKETED')] }))).toBe('APEX_NOT_BRACKETED');
    expect(comFeedback('APEX_NOT_BRACKETED')).toContain('最高点');
  });
});

describe('live result selection', () => {
  it('keeps a real successful result selected when the latest movement was rejected', () => {
    const original = state({ results: [attempt(1, 24), attempt(2, null, 'MOVEMENT_NOT_RESOLVED')] });
    expect(displayedResult(original, null)?.id).toBe(1);
    expect(original.results.map(r => r.id)).toEqual([1, 2]);
    expect(displayedResult(original, 2)?.analysis.heightCm).toBeNull();
  });
  it('does not invent a height when every attempt failed and picks the newest success otherwise', () => {
    expect(displayedResult(state({ results: [attempt(1, null)] }), null)?.analysis.heightCm).toBeNull();
    expect(displayedResult(state({ results: [attempt(1, 24), attempt(2, 28)] }), null)?.id).toBe(2);
    expect(displayedResult(state(), null)).toBeUndefined();
  });
  it('labels a prior height and keeps the incomplete reason when the next movement has not produced a result', () => {
    const inProgress = state({ phase: 'MOVING', results: [attempt(1, 24)] });
    expect(cameraStopReason(inProgress)).toBe('RECORDING_ENDED_BEFORE_RECOVERY');
    expect(isPreviousResult(inProgress, displayedResult(inProgress, null)?.id)).toBe(true);
    expect(isPreviousResult(state({ phase: 'READY', results: [attempt(1, 24)] }), 1)).toBe(false);
  });
});
