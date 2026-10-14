/** The skeleton's points the user moved by hand at a frame (2026-10-14). On a blurred, nearly straight rear leg at the
 * crouch start's first touchdown both pose models (and RTMPose at 384×288, read mirrored too) put the knee in one place, a
 * little forward of where it looked (the user: 「ここの後あしの大腿骨のスケルトンがずれてる」, then 「修正は全て行ってください」):
 * no model reads it better, so the points can be set by hand and every value from that frame follows at once, as the
 * judged moments are (確認). The points: the shoulders (moved together: the trunk takes their middle), each hip, knee
 * and ankle; not the toes and heels, from which the hurdle, the jumps and the throws find the contacts. */
import { useCallback, useMemo, useState } from 'react';
import type { CrouchFrame, CrouchPoint } from './crouch';

/** Per frame, the landmarks the user set (MediaPipe's indices) and where (normalized). */
export type PoseEdits = Readonly<Record<number, Readonly<Record<number, { x: number; y: number }>>>>;
/** The points that can be moved: the shoulders, the hips, the knees, the ankles. */
export const EDITABLE = [11, 12, 23, 24, 25, 26, 27, 28] as const;

/** The frames with the user's points: in the pose the angles use (`refined`, RTMPose; on a frame without one, a copy of
 * MediaPipe's pose made `refined` when the video has RTMPose's poses, else MediaPipe's pose itself). A point set by
 * hand is seen (visibility 1). The same array when there is nothing to apply. */
export function withPoseEdits(frames: readonly CrouchFrame[], edits: PoseEdits): CrouchFrame[] {
  const keys = Object.keys(edits);
  if (!keys.length) return frames as CrouchFrame[];
  const anyRefined = frames.some(f => f.refined), byFrame = new Map(frames.map(f => [f.frame, f]));
  const changed = new Map<number, CrouchFrame>();
  for (const key of keys) {
    const f = byFrame.get(+key), joints = edits[+key];
    if (!f || !joints) continue;
    const base = f.refined ?? f.pose;
    if (!base) continue;
    const moved = base.map((p, i) => i in joints ? { x: joints[i].x, y: joints[i].y, visibility: 1 } : p);
    changed.set(f.frame, f.refined || anyRefined ? { ...f, refined: moved } : { ...f, pose: moved });
  }
  return changed.size ? frames.map(f => changed.get(f.frame) ?? f) : frames as CrouchFrame[];
}

/** The user's points kept for one analysis (cleared for a new one), the frames with them, and what the pictures need to
 * let them be set (`editing`). `toRaw` turns the points moved on a picture into the measured pose's (the strength's
 * pictures draw a pose made from both sides, figure.ts). */
export function usePoseEdits(frames: readonly CrouchFrame[] | null | undefined,
  toRaw?: (frame: CrouchFrame, moved: Record<number, { x: number; y: number }>) => Record<number, { x: number; y: number }>) {
  // The points belong to the frames they were set on: none for a new analysis, from its first drawing on (cleared after
  // it, a new video's pictures were drawn once with the last video's points).
  const [kept, setKept] = useState<{ of: typeof frames; edits: PoseEdits }>({ of: frames, edits: NONE });
  const edits = kept.of === frames ? kept.edits : NONE;
  const setEdits = useCallback((f: (e: PoseEdits) => PoseEdits) => setKept(k => ({ of: frames, edits: f(k.of === frames ? k.edits : NONE) })), [frames]);
  const edited = useMemo(() => frames ? withPoseEdits(frames, edits) : [], [frames, edits]);
  const hand = useMemo(() => new Set(Object.keys(edits).map(Number)), [edits]);
  const set = useCallback((frame: number, moved: Record<number, { x: number; y: number }>) => {
    // The frame as it is now (with the points set before), for `toRaw` to measure the move from.
    const f = edited.find(q => q.frame === frame);
    if (!f) return;
    const joints = toRaw ? toRaw(f, moved) : moved;
    setEdits(e => ({ ...e, [frame]: { ...e[frame], ...joints } }));
  }, [edited, toRaw, setEdits]);
  const reset = useCallback((frame: number) => setEdits(e => { const next = { ...e }; delete next[frame]; return next; }), [setEdits]);
  const editing: PoseEditing = useMemo(() => ({ edited: hand, onSet: set, onReset: reset }), [hand, set, reset]);
  return { edits, frames: edited, hand, editing };
}
const NONE: PoseEdits = {};

/** What a picture needs to let its skeleton be set by hand. */
export interface PoseEditing {
  /** Frames whose skeleton the user set. */
  edited: ReadonlySet<number>;
  /** The points moved on a frame's picture (the picture's pose, normalized). */
  onSet: (frame: number, moved: Record<number, { x: number; y: number }>) => void;
  /** Back to the automatic skeleton at a frame. */
  onReset: (frame: number) => void;
  /** The points a picture lets be moved (EDITABLE when absent). */
  editable?: readonly number[];
}

/** Copies a point list (for the editor's working pose). */
export const copyPose = (pose: readonly CrouchPoint[]) => pose.map(p => ({ ...p }));
