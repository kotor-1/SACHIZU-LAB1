import { useCallback } from 'react';
import type { CrouchFrame, CrouchResult } from './crouch';
import { legLength } from './contacts';
import { applyEdits, effectsOf, footDown, type Edits, type Moment } from './crouch-edit';
import type { PixelMoment } from './crouch-pixels';
import type { ReviewMoment } from './moment-edits';
import { MomentReview } from './MomentReview';

/** The crouch start's check (MomentReview) with its own moments: what a frame changes (crouch-edit.ts), and the strip's
 * bars from the pictures round the feet where those set the moment (crouch-pixels.ts), else from the pose's toe point. */
export function CrouchReview({ url, frames, width: W, height: H, pixels, auto, result, list, edits, checked, at, onAt, onSet, onRevert, onRevertAll, onDone }: {
  url: string; frames: readonly CrouchFrame[]; width: number; height: number;
  /** The moments set from the pictures round the feet, with the share of the shoe seen frame by frame. */
  pixels: readonly PixelMoment[];
  /** The automatic result and the result with the user's frames. */
  auto: CrouchResult; result: CrouchResult; list: Moment[]; edits: Edits; checked: ReadonlySet<string>;
  at: string | null; onAt: (key: string) => void;
  onSet: (key: string, frame: number) => void; onRevert: (key: string) => void; onRevertAll: () => void;
  onDone: () => void;
}) {
  const leg = legLength(frames.filter(f => f.pose), W, H);
  const share = (m: ReviewMoment) => { const p = pixels.find(q => q.key === m.key); return p?.fromPixels ? p.share : null; };
  const preview = useCallback((m: ReviewMoment, frame: number) => {
    const then = frame === m.frame ? result : applyEdits(auto, { ...edits, [m.key]: frame }, frames, W, H);
    return effectsOf(result, then, m as Moment);
  }, [auto, result, edits, frames, W, H]);
  return <MomentReview url={url} frames={frames} width={W} height={H} list={list} edits={edits} checked={checked} at={at} onAt={onAt}
    onSet={onSet} onRevert={onRevert} onRevertAll={onRevertAll} onDone={onDone} preview={preview}
    down={(m, f) => { const s = share(m); return s ? (s.has(f.frame) ? s.get(f.frame)! >= .5 : null) : footDown(f, m as Moment, W, H, leg); }}
    source={m => share(m) ? '足元の画像' : '骨格'} doneText="すべての瞬間を確認しました。値は「ポイント」「歩ごと」に反映されています。" />;
}
