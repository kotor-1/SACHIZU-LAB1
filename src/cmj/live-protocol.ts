import type { MobileCMJPose } from './mobile-pose';
import type { COMPhase, COMResult, COMStreamDiagnostics } from './com-stream';
import type { LiveProfileReason } from './live-profile';

export interface LiveFrameRequest {
  type: 'frame'; image: ImageBitmap; frame: number; inferencePts: number;
  measurementPts: number | null; reset: boolean;
  /** Main-thread snapshot start through previous response; never source-frame spacing. */
  previousProcessingMs?: number | null;
  allowMovement?: boolean;
}
export type LiveWorkerRequest = ({ type: 'init' } | LiveFrameRequest) & { id: number };
export type LiveFrameResult = ReturnType<MobileCMJPose['estimate']> & {
  found: COMResult | null; phase: COMPhase; backend: 'CPU' | 'GPU';
  poseModel: 'full' | 'lite'; warmingUp: boolean; profileReason: LiveProfileReason;
  profileChanged: boolean; streamDiagnostics: COMStreamDiagnostics;
};
