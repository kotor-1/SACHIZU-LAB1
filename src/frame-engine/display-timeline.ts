import { FrameInfo } from './types';

/**
 * Every exact source frame receives one dedicated display slot. Slots left
 * over after that injective assignment hold the most recently assigned source
 * frame; no pixels or synthetic source identities are created.
 */
export type DisplayTimelineMappingPolicy = 'lossless_monotonic_hold';

/** A diagnostic FPS inferred from presentation PTS deltas. */
export type PlaybackFpsDetectionMethod = 'pts_temporal_quantum';

export interface PlaybackFpsCandidates {
  /** Diagnostic effective density: complete presentation source count / duration. */
  effectiveFrameDensity: number;
  /** Backward-compatible alias for effectiveFrameDensity. */
  presentationDensityFps: number;
  /** Diagnostic span estimate: (N - 1) / (last PTS - first PTS). */
  ptsSpanFps: number;
  /** Historical rounded density value; never used for navigation. */
  legacyRoundedPresentationFps: number;
  /** Diagnostic FPS from the median positive source PTS transition. */
  medianIntervalFps: number;
  /** Diagnostic FPS from the most frequent exact media-timescale transition. */
  dominantIntervalFps: number;
  /** Diagnostic FPS from the short-cadence cluster mean. */
  shortIntervalMeanFps: number;
  /** Estimated base temporal quantum in presentation seconds. */
  baseFrameIntervalSeconds: number;
  /** FPS represented by baseFrameIntervalSeconds; this is the grid candidate. */
  temporalQuantumFps: number;
}

export interface FrameGridFpsDetection {
  /** FPS authority for this diagnostic uniform display grid. */
  detectedFrameGridFps: number;
  /** Same value before reciprocal conversion, in seconds. */
  baseFrameIntervalSeconds: number;
  candidates: PlaybackFpsCandidates;
  method: PlaybackFpsDetectionMethod;
  /** Deprecated compatibility alias; it also means the grid FPS, never density. */
  detectedPlaybackFps: number;
}

export interface DisplayFrameInfo {
  /** Uniform-grid frame number used by diagnostics (not normal navigation). */
  displayFrameIndex: number;
  /** Uniform-grid presentation-local time (seconds). */
  displayPts: number;
  /** Exact source presentation frame selected for this display slot. */
  sourceFrame: FrameInfo;
  /** Explicit aliases make the two index domains hard to confuse. */
  sourcePresentationFrameIndex: number;
  sourceRawSampleIndex: number;
  /** True only for the dedicated, injective slot assigned to this source. */
  isDirectSourceAssignment: boolean;
}

export interface SourceDisplayAssignment {
  sourcePresentationFrameIndex: number;
  displayFrameIndex: number;
  idealDisplayFrameIndex: number;
}

export interface DisplayTimeline {
  /** FPS authority for this diagnostic uniform display grid. */
  detectedFrameGridFps: number;
  /** Temporal quantum (seconds) from which detectedFrameGridFps is derived. */
  baseFrameIntervalSeconds: number;
  /** Complete presentation source density, retained for diagnostics only. */
  effectiveFrameDensity: number;
  detectionMethod: PlaybackFpsDetectionMethod;
  duration: number;
  displayFrameCount: number;
  mappingPolicy: DisplayTimelineMappingPolicy;
  fpsCandidates: PlaybackFpsCandidates;
  frames: DisplayFrameInfo[];
  sourceAssignments: SourceDisplayAssignment[];
  duplicateDisplaySlotCount: number;
  /** Empty means every source presentation frame can be reached by a slot. */
  unreachableSourcePresentationFrameIndices: number[];
  /** Deprecated compatibility alias for detectedFrameGridFps. */
  detectedPlaybackFps: number;
}

/** Fail closed instead of silently dropping source frames from a too-small diagnostic grid. */
export class FpsGridCapacityConflictError extends Error {
  readonly code = 'FPS_GRID_CAPACITY_CONFLICT';
  readonly detectedFrameGridFps: number;
  readonly detectedPlaybackFps: number;
  readonly displayFrameCount: number;
  readonly sourceFrameCount: number;

  constructor(
    detectedFrameGridFps: number,
    displayFrameCount: number,
    sourceFrameCount: number
  ) {
    super(
      `自動検出frame-grid FPS ${detectedFrameGridFps} のdisplay grid (${displayFrameCount} slots) `
      + `へ${sourceFrameCount} source framesをlossless配置できません。`
    );
    this.name = 'FpsGridCapacityConflictError';
    this.detectedFrameGridFps = detectedFrameGridFps;
    this.detectedPlaybackFps = detectedFrameGridFps;
    this.displayFrameCount = displayFrameCount;
    this.sourceFrameCount = sourceFrameCount;
  }
}

interface IntervalCluster {
  values: number[];
  center: number;
}

interface QuantumEvaluation {
  base: number;
  coverage: number;
  directSupport: number;
  clusterSupport: number;
  normalizedError: number;
}

function finitePositive(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
}

/**
 * Tolerance deliberately permits timestamp tick rounding and small jitter,
 * but is far smaller than the separation between 1x and 2x cadence. With a
 * media timescale available, 1.5 ticks also joins adjacent rounded values
 * such as 11/12 ticks for a true ~213fps stream.
 */
function intervalTolerance(interval: number, timeScale?: number): number {
  const relative = Math.abs(interval) * 0.03;
  const tick = typeof timeScale === 'number' && finitePositive(timeScale)
    ? 1.5 / timeScale
    : 0;
  return Math.max(1e-9, relative, tick);
}

function clusterIntervals(intervals: number[], timeScale?: number): IntervalCluster[] {
  const sorted = [...intervals].filter(finitePositive).sort((a, b) => a - b);
  const clusters: IntervalCluster[] = [];
  for (const interval of sorted) {
    const current = clusters[clusters.length - 1];
    if (!current || interval - current.center > intervalTolerance(current.center, timeScale)) {
      clusters.push({ values: [interval], center: interval });
      continue;
    }
    current.values.push(interval);
    current.center = current.values.reduce((sum, value) => sum + value, 0) / current.values.length;
  }
  return clusters;
}

/**
 * Estimate the fundamental presentation time quantum from adjacent PTS
 * deltas. Each observed interval is matched to the nearest positive integer
 * multiple of a candidate cluster. Candidates are ranked by coverage first,
 * then by direct 1x support, so an isolated short outlier cannot become the
 * authority while 2x/3x gaps remain explainable by the real cadence.
 */
function estimateTemporalQuantum(intervals: number[], timeScale?: number): number {
  const valid = intervals.filter(finitePositive);
  if (valid.length === 0) return 0;
  const clusters = clusterIntervals(valid, timeScale);
  const evaluations: QuantumEvaluation[] = clusters.map((cluster) => {
    const base = cluster.center;
    let coverage = 0;
    let directSupport = 0;
    let normalizedError = 0;
    for (const interval of valid) {
      const multiplier = Math.max(1, Math.round(interval / base));
      const residual = Math.abs(interval - multiplier * base);
      const tolerance = intervalTolerance(base * multiplier, timeScale);
      if (residual <= tolerance) {
        coverage++;
        normalizedError += residual / Math.max(tolerance, 1e-9);
        if (multiplier === 1) directSupport++;
      }
    }
    return {
      base,
      coverage,
      directSupport,
      clusterSupport: cluster.values.length,
      normalizedError,
    };
  });

  evaluations.sort((left, right) => (
    right.coverage - left.coverage
    || right.directSupport - left.directSupport
    || right.clusterSupport - left.clusterSupport
    || left.normalizedError - right.normalizedError
    || left.base - right.base
  ));
  return evaluations[0]?.base ?? valid[0];
}

function collectPlaybackFpsCandidates(
  sourceFrames: FrameInfo[],
  duration: number,
  timeScale?: number
): PlaybackFpsCandidates {
  const intervalsInSeconds: number[] = [];
  const intervalsInTicks: number[] = [];
  for (let index = 1; index < sourceFrames.length; index++) {
    const previous = sourceFrames[index - 1];
    const current = sourceFrames[index];
    const previousPts = previous.presentationPts ?? previous.pts;
    const currentPts = current.presentationPts ?? current.pts;
    const seconds = currentPts - previousPts;
    if (finitePositive(seconds)) intervalsInSeconds.push(seconds);

    const previousCts = previous.rawCts ?? previous.cts;
    const currentCts = current.rawCts ?? current.cts;
    const ticks = currentCts - previousCts;
    if (Number.isInteger(ticks) && ticks > 0) intervalsInTicks.push(ticks);
  }

  // A one-frame/metadata-only source has no adjacent PTS delta to cluster.
  // In that degenerate case the encoded sample duration is the only timing
  // signal available; never derive a navigation interval from frameCount /
  // movie duration (that is effective density, not cadence).
  const sampleDurationsInSeconds = sourceFrames
    .map((frame) => frame.duration)
    .filter(finitePositive);

  const effectiveFrameDensity = finitePositive(duration) && sourceFrames.length > 0
    ? sourceFrames.length / duration
    : 0;
  const firstPts = sourceFrames[0]
    ? sourceFrames[0].presentationPts ?? sourceFrames[0].pts
    : 0;
  const lastFrame = sourceFrames.at(-1);
  const lastPts = lastFrame ? lastFrame.presentationPts ?? lastFrame.pts : firstPts;
  const ptsSpan = lastPts - firstPts;
  const ptsSpanFps = sourceFrames.length > 1 && finitePositive(ptsSpan)
    ? (sourceFrames.length - 1) / ptsSpan
    : 0;

  const medianInterval = median(intervalsInSeconds);
  const medianIntervalFps = finitePositive(medianInterval) ? 1 / medianInterval : 0;
  const shortIntervals = medianInterval > 0
    ? intervalsInSeconds.filter((interval) => interval <= medianInterval * 1.5 + 1e-12)
    : [];
  const shortIntervalMean = shortIntervals.length > 0
    ? shortIntervals.reduce((sum, interval) => sum + interval, 0) / shortIntervals.length
    : 0;
  const shortIntervalMeanFps = finitePositive(shortIntervalMean) ? 1 / shortIntervalMean : 0;

  let dominantIntervalFps = 0;
  if (intervalsInTicks.length > 0 && typeof timeScale === 'number' && finitePositive(timeScale)) {
    const counts = new Map<number, number>();
    for (const ticks of intervalsInTicks) counts.set(ticks, (counts.get(ticks) ?? 0) + 1);
    let dominantTicks = intervalsInTicks[0];
    let dominantCount = counts.get(dominantTicks) ?? 0;
    for (const [ticks, count] of counts) {
      if (count > dominantCount || (count === dominantCount && ticks < dominantTicks)) {
        dominantTicks = ticks;
        dominantCount = count;
      }
    }
    dominantIntervalFps = timeScale / dominantTicks;
  }

  const baseFrameIntervalSeconds = estimateTemporalQuantum(
    intervalsInSeconds.length > 0 ? intervalsInSeconds : sampleDurationsInSeconds,
    timeScale
  );
  const temporalQuantumFps = finitePositive(baseFrameIntervalSeconds)
    ? 1 / baseFrameIntervalSeconds
    : 0;

  return {
    effectiveFrameDensity,
    presentationDensityFps: effectiveFrameDensity,
    ptsSpanFps,
    legacyRoundedPresentationFps: Math.round(effectiveFrameDensity),
    medianIntervalFps,
    dominantIntervalFps,
    shortIntervalMeanFps,
    baseFrameIntervalSeconds,
    temporalQuantumFps,
  };
}

/** Detect the frame-grid FPS from the presentation PTS temporal quantum. */
export function detectFrameGridFps(
  sourceFrames: FrameInfo[],
  duration: number,
  timeScale?: number
): FrameGridFpsDetection {
  if (sourceFrames.length === 0) {
    throw new Error('presentation source frameがありません。');
  }
  if (!finitePositive(duration)) {
    throw new Error('playback timeline durationが正数ではありません。');
  }

  const candidates = collectPlaybackFpsCandidates(sourceFrames, duration, timeScale);
  if (!finitePositive(candidates.temporalQuantumFps)) {
    throw new Error('presentation PTSからframe-grid cadenceを検出できません。');
  }
  return {
    detectedFrameGridFps: candidates.temporalQuantumFps,
    baseFrameIntervalSeconds: candidates.baseFrameIntervalSeconds,
    candidates,
    method: 'pts_temporal_quantum',
    detectedPlaybackFps: candidates.temporalQuantumFps,
  };
}

/**
 * Deprecated name retained for callers from the previous dirty implementation.
 * Its value now means frame-grid FPS, never presentation density.
 */
export function detectPlaybackFps(
  sourceFrames: FrameInfo[],
  duration: number,
  timeScale?: number
): FrameGridFpsDetection {
  return detectFrameGridFps(sourceFrames, duration, timeScale);
}

export function getDisplayFrameCountForFps(duration: number, frameGridFps: number): number {
  const exactCount = duration * frameGridFps;
  const tolerance = Math.max(1, Math.abs(exactCount)) * Number.EPSILON * 16;
  return Math.max(1, Math.ceil(exactCount - tolerance));
}

function assertPresentationOrder(sourceFrames: FrameInfo[]): void {
  let previousPts = Number.NEGATIVE_INFINITY;
  for (const frame of sourceFrames) {
    const pts = frame.presentationPts ?? frame.pts;
    if (!Number.isFinite(pts) || pts < previousPts) {
      throw new Error('source presentation framesがPTS昇順ではありません。');
    }
    previousPts = pts;
  }
}

/**
 * Pure lossless mapping helper. It is exported so capacity, collision and hold
 * semantics can be tested independently from FPS detection.
 */
export function buildDisplayTimelineForFrameGridFps(
  sourceFrames: FrameInfo[],
  duration: number,
  detectedFrameGridFps: number,
  timeScale?: number
): DisplayTimeline {
  if (sourceFrames.length === 0) {
    throw new Error('presentation source frameがありません。');
  }
  if (!finitePositive(duration) || !finitePositive(detectedFrameGridFps)) {
    throw new Error('display timeline duration/FPSが正数ではありません。');
  }
  assertPresentationOrder(sourceFrames);

  const frameCount = getDisplayFrameCountForFps(duration, detectedFrameGridFps);
  if (frameCount < sourceFrames.length) {
    throw new FpsGridCapacityConflictError(
      detectedFrameGridFps,
      frameCount,
      sourceFrames.length
    );
  }

  const sourceAssignments: SourceDisplayAssignment[] = [];
  let previousAssignedSlot = -1;
  for (let sourceIndex = 0; sourceIndex < sourceFrames.length; sourceIndex++) {
    const source = sourceFrames[sourceIndex];
    const sourcePts = source.presentationPts ?? source.pts;
    const idealDisplayFrameIndex = Math.round(sourcePts * detectedFrameGridFps);
    const minimumSlot = previousAssignedSlot + 1;
    // Reserve one distinct slot for every remaining source frame.
    const maximumSlot = frameCount - (sourceFrames.length - sourceIndex);
    const displayFrameIndex = Math.min(
      maximumSlot,
      Math.max(minimumSlot, idealDisplayFrameIndex)
    );

    if (displayFrameIndex < minimumSlot || displayFrameIndex > maximumSlot) {
      throw new FpsGridCapacityConflictError(
        detectedFrameGridFps,
        frameCount,
        sourceFrames.length
      );
    }
    sourceAssignments.push({
      sourcePresentationFrameIndex: source.presentationFrameIndex,
      displayFrameIndex,
      idealDisplayFrameIndex,
    });
    previousAssignedSlot = displayFrameIndex;
  }

  const assignmentBySlot = new Map<number, number>();
  sourceAssignments.forEach((assignment, sourceIndex) => {
    assignmentBySlot.set(assignment.displayFrameIndex, sourceIndex);
  });

  const frames: DisplayFrameInfo[] = [];
  let activeSourceIndex = 0;
  for (let displayFrameIndex = 0; displayFrameIndex < frameCount; displayFrameIndex++) {
    const assignedSourceIndex = assignmentBySlot.get(displayFrameIndex);
    const isDirectSourceAssignment = assignedSourceIndex !== undefined;
    if (isDirectSourceAssignment) activeSourceIndex = assignedSourceIndex;
    const sourceFrame = sourceFrames[activeSourceIndex];
    frames.push({
      displayFrameIndex,
      displayPts: displayFrameIndex / detectedFrameGridFps,
      sourceFrame,
      sourcePresentationFrameIndex: sourceFrame.presentationFrameIndex,
      sourceRawSampleIndex: sourceFrame.rawSampleIndex ?? sourceFrame.sampleIndex,
      isDirectSourceAssignment,
    });
  }

  const reachable = new Set(frames.map((frame) => frame.sourcePresentationFrameIndex));
  const unreachableSourcePresentationFrameIndices = sourceFrames
    .filter((frame) => !reachable.has(frame.presentationFrameIndex))
    .map((frame) => frame.presentationFrameIndex);
  if (unreachableSourcePresentationFrameIndices.length > 0) {
    throw new FpsGridCapacityConflictError(
      detectedFrameGridFps,
      frameCount,
      sourceFrames.length
    );
  }

  const candidates = collectPlaybackFpsCandidates(sourceFrames, duration, timeScale);
  return {
    detectedFrameGridFps,
    baseFrameIntervalSeconds: candidates.baseFrameIntervalSeconds,
    effectiveFrameDensity: candidates.effectiveFrameDensity,
    detectionMethod: 'pts_temporal_quantum',
    detectedPlaybackFps: detectedFrameGridFps,
    duration,
    displayFrameCount: frameCount,
    mappingPolicy: 'lossless_monotonic_hold',
    fpsCandidates: candidates,
    frames,
    sourceAssignments,
    duplicateDisplaySlotCount: frameCount - sourceFrames.length,
    unreachableSourcePresentationFrameIndices,
  };
}

/** Backward-compatible helper whose parameter now explicitly means grid FPS. */
export function buildDisplayTimelineForPlaybackFps(
  sourceFrames: FrameInfo[],
  duration: number,
  frameGridFps: number,
  timeScale?: number
): DisplayTimeline {
  return buildDisplayTimelineForFrameGridFps(
    sourceFrames,
    duration,
    frameGridFps,
    timeScale
  );
}

/** Build the diagnostic uniform display deck from the PTS-detected frame-grid FPS. */
export function buildDisplayTimeline(
  sourceFrames: FrameInfo[],
  duration: number,
  timeScale?: number
): DisplayTimeline {
  const detection = detectFrameGridFps(sourceFrames, duration, timeScale);
  return buildDisplayTimelineForFrameGridFps(
    sourceFrames,
    duration,
    detection.detectedFrameGridFps,
    timeScale
  );
}

export function getDisplayFrameByIndex(
  displayFrameIndex: number,
  timeline: DisplayTimeline
): DisplayFrameInfo | null {
  if (!Number.isInteger(displayFrameIndex)) return null;
  return timeline.frames[displayFrameIndex] ?? null;
}

/** Dedicated injective slot assigned to the requested exact source frame. */
export function findDisplayFrameIndexForSource(
  sourcePresentationFrameIndex: number,
  timeline: DisplayTimeline
): number | null {
  const assignment = timeline.sourceAssignments.find((candidate) => (
    candidate.sourcePresentationFrameIndex === sourcePresentationFrameIndex
  ));
  return assignment?.displayFrameIndex ?? null;
}
