import type { NormalizedLandmark } from '@mediapipe/tasks-vision';
import type { SoleFrame } from './sole-contact';

/** One camera frame for the RJ camera's worker (rj-live-worker.ts). */
export interface RJFrameRequest {
  type: 'frame';
  /** The frame as the shoes are read: 960 px high (SOLE_CONTACT_SETTINGS.imageHeight), as a chosen video. */
  image: ImageBitmap;
  /** The pose model's picture: the frame at most 720 px on its long side, as a chosen video (recording-session.ts). */
  poseWidth: number; poseHeight: number;
  frame: number;
  /** Always increasing, for the model's tracking only; `pts` is the frame's own camera time, for the analysis. */
  inferencePts: number;
  pts: number;
  /** Read the shoes too: every frame of a set. The preview only follows the athlete. */
  sole: boolean;
}
/** `set`: a new set starts, with a new shoe meter (the selector follows one set's frames in order). */
export type RJLiveRequest = ({ type: 'init' } | { type: 'set' } | RJFrameRequest) & { id: number };
export interface RJFrameResult {
  /** Everyone found (the model looks for two), as a chosen video's analysis keeps them. */
  landmarks: NormalizedLandmark[][];
  sole: SoleFrame | null;
  inferenceMs: number;
  /** The worker's whole time for the frame (picture, model, shoes). */
  workMs: number;
  backend: 'CPU' | 'GPU';
}
