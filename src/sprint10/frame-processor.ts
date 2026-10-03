import { MobileCMJPose } from '../cmj/mobile-pose';
import { sprintSample, type SprintSample } from './analysis';
import { FLYING_MIN_SPEED_MPS, SprintTracker, type SprintStart } from './tracker';

/** People detected per frame in a sprint video. */
export const SPRINT_POSES = 4;
type Region = { x: number; y: number; w: number; h: number };

/** One sprint's frame-by-frame analysis, shared by recorded videos and the
 * live camera: the subject's crop and pose, the flying start's watch crop,
 * subject selection, and the samples (with backfill and retraction applied).
 * The caller draws each frame into `source` (upright) before `process`. */
export class SprintFrameProcessor {
  readonly samples: SprintSample[] = [];
  readonly tracker: SprintTracker;
  private readonly sampleAt = new Map<number, number>();
  private readonly crop: HTMLCanvasElement;
  private readonly cc: CanvasRenderingContext2D;
  private top = 0;
  private bottom = 1;
  private analysed = 0;
  constructor(private readonly source: HTMLCanvasElement, private readonly model: MobileCMJPose,
    private readonly watcher: () => Promise<MobileCMJPose>,
    startX: number, finishX: number | undefined, start: SprintStart, distanceM: number,
    /** Live camera: watch every frame while someone comes in (see SprintTracker.watching). */
    private readonly liveWatch = false,
    /** Crouch start: the crop keeps the full picture height (narrowed to the
     * crouched set, it cut off the athlete rising out of the blocks), and the
     * tracker follows the athlete out of the blocks (see SprintTracker). */
    private readonly fromBlocks = false) {
    this.crop = document.createElement('canvas');
    const cc = this.crop.getContext('2d');
    if (!cc) throw new Error('映像処理を開始できません。');
    this.cc = cc;
    // Flying section: the runner must move at sprint speed, which the gate spacing turns into image widths/s.
    const sprintSpeed = finishX === undefined || !(distanceM > 0) ? 0 : FLYING_MIN_SPEED_MPS * Math.abs(finishX - startX) / distanceM;
    this.tracker = new SprintTracker(startX, finishX === undefined ? 0 : finishX - startX, start, sprintSpeed, fromBlocks);
  }
  get idle() { return this.tracker.idle; }
  /** Crops source-resolution pixels BEFORE resizing, so distant runners retain detail. */
  private detect(pose: MobileCMJPose, region: Region, frame: { frameIndex: number; pts: number }, w: number, h: number) {
    this.crop.width = 512; this.crop.height = Math.round(512 * region.h * h / (region.w * w));
    this.cc.drawImage(this.source, region.x * w, region.y * h, region.w * w, region.h * h, 0, 0, this.crop.width, this.crop.height);
    return pose.estimate(this.crop, frame.frameIndex, frame.pts).landmarks
      .map(p => p.map(q => ({ ...q, x: region.x + q.x * region.w, y: region.y + q.y * region.h })));
  }
  async process(w: number, h: number, frame: { frameIndex: number; pts: number }) {
    this.analysed++;
    const tracker = this.tracker, samples = this.samples;
    const roi = { x: Math.max(0, Math.min(.64, tracker.expected(frame.pts) - .18)), y: this.top, w: .36, h: this.bottom - this.top };
    const poses = this.detect(this.model, roi, frame, w, h);
    // While the subject is elsewhere, the run-in side is watched with its full height.
    const watch = tracker.watchCentre(frame.pts);
    const region = watch === null ? null : { x: Math.max(0, Math.min(.64, watch - .18)), y: 0, w: .36, h: 1 };
    let watched: { poses: typeof poses; view: readonly [number, number] } | undefined;
    // Any offset matters: a runner entering at the frame edge is outside a crop shifted only partly
    // toward the subject (recorded: the subject's crop covered 0.12-0.48, the runner came in at 0-0.1).
    // A live camera is processed at 15-30 frames/s: every other frame left the runner
    // coming in 0.13 s between sightings, too few to measure the entry (recorded).
    if (region && Math.abs(region.x - roi.x) > .01 && (this.analysed % 2 === 0 || (this.liveWatch && tracker.watching)))
      watched = { poses: this.detect(await this.watcher(), region, frame, w, h), view: [region.x, region.x + region.w] };
    const selected = tracker.choose(poses, frame.pts, [roi.x, roi.x + roi.w], watched);
    // A nearer, faster runner replaced the subject: its earlier samples belonged to someone else.
    const retracted = tracker.takeRetraction();
    if (retracted !== null) for (let i = samples.length - 1; i >= 0 && samples[i].pts >= retracted; i--) samples[i] = sprintSample([], samples[i].frame, samples[i].pts, w / h);
    // A flying start is confirmed after the runner has been seen for a while:
    // publish those earlier sightings so the entry gate crossing is measured.
    const backfill = tracker.takeBackfill();
    for (const { pts, pose } of backfill) {
      const i = this.sampleAt.get(pts);
      if (i !== undefined) samples[i] = sprintSample(pose, samples[i].frame, pts, w / h);
    }
    // A newly decided subject may be outside the height band of the previous one.
    if (backfill.length) { this.top = 0; this.bottom = 1; }
    if (selected.length && !this.fromBlocks) {
      const ys = selected.filter(p => (p.visibility ?? 0) >= .3).map(p => p.y);
      const nextTop = Math.max(0, Math.min(...ys) - .12), nextBottom = Math.min(1, Math.max(...ys) + .12);
      if (nextBottom - nextTop > .2) { this.top = .8 * this.top + .2 * nextTop; this.bottom = .8 * this.bottom + .2 * nextBottom; }
    }
    this.sampleAt.set(frame.pts, samples.length);
    samples.push(sprintSample(selected, frame.frameIndex, frame.pts, w / h));
    return selected;
  }
}
