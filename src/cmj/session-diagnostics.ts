import type { SessionUpdate } from './video-session';

export const CMJ_LIVE_VERSION = 'live-toe-flight-v8';

/** Explain a stopped camera without fabricating a completed jump. */
export function cameraStopReason(state: SessionUpdate | null): string {
  if (!state) return 'PREPARATION_NOT_CONFIRMED';
  if (state.phase === 'MOVING' || state.phase === 'RECOVERING') return 'RECORDING_ENDED_BEFORE_RECOVERY';
  const last = state.results.at(-1);
  if (last?.analysis.reason) return last.analysis.reason;
  if (state.observationReason && state.observationReason !== 'LIVE_MODEL_WARMUP') return state.observationReason;
  if (state.streamDiagnostics?.observationReason) return state.streamDiagnostics.observationReason;
  return state.streamDiagnostics?.prepared || state.phase === 'READY' ? 'NO_JUMP_DETECTED' : 'PREPARATION_NOT_CONFIRMED';
}

/** Keep a successful measurement visible after a rejected movement, explicitly
 * labelled as a previous result. Selecting a failed attempt still shows no height. */
export function displayedResult(state: SessionUpdate | null, selectedId: number | null) {
  if (selectedId !== null) return state?.results.find(result => result.id === selectedId);
  return state?.results.slice().reverse().find(result => result.analysis.heightCm !== null) ?? state?.results.at(-1);
}

export function isPreviousResult(state: SessionUpdate | null, resultId: number | undefined): boolean {
  return resultId !== undefined && (resultId !== state?.results.at(-1)?.id ||
    state?.phase === 'MOVING' || state?.phase === 'RECOVERING');
}
