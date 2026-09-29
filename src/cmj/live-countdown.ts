import type { SessionUpdate } from './video-session';

export type JumpCue = 3 | 2 | 1 | 'jump' | null;

/** Uses fresh camera observations, so a suspended tab cannot finish a countdown. */
export class LiveCountdown {
  armed = false;
  cue: JumpCue = null;
  private started: number | null = null;
  private previous: number | null = null;
  private lastResult = 0;

  observe(state: SessionUpdate): JumpCue {
    const time = state.sourcePts;
    const lastResult = state.results.at(-1)?.id ?? 0;
    const discontinuity = this.previous !== null && (time < this.previous || time - this.previous > .5);
    this.previous = time;
    if (lastResult !== this.lastResult || state.phase === 'PREPARING' || discontinuity) {
      this.armed = false; this.started = null;
    }
    this.lastResult = lastResult;
    if (this.armed) {
      this.cue = state.phase === 'READY' ? 'jump' : null;
      return this.cue;
    }
    if (state.phase !== 'READY' || state.modelWarmingUp || state.observationReason || state.detectedPeople !== 1) {
      this.started = null; this.cue = null;
      return null;
    }
    this.started ??= time;
    const remaining = Math.ceil(3 - (time - this.started));
    if (remaining <= 0) { this.armed = true; this.cue = 'jump'; }
    else this.cue = Math.min(3, remaining) as 1 | 2 | 3;
    return this.cue;
  }
}
