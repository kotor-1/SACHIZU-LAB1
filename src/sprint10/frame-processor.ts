import { MobileCMJPose } from '../cmj/mobile-pose';
import { sprintSample, type Point, type SprintSample } from './analysis';
import { BODY_POINTS, FLYING_MIN_SPEED_MPS, samePerson, SprintTracker, type SprintStart } from './tracker';

/** People detected per frame in a sprint video. */
export const SPRINT_POSES = 4;
export type Region = { x: number; y: number; w: number; h: number };

/** Flying start, nobody followed yet and nobody in the subject's crop: the crop is searched again in two tiles, its
 * top and its bottom, each about square. The whole 0.36-wide crop of a landscape picture (512 x 800) shrinks a runner a sixth of the picture
 * high to about 40 px in the pose detector's input. In the user's 240 fps clips (2026-10-09, 「人間を見つけられなかっ
 * た」) the runner was found in 0 of 24 frames of the first 0.8 s in IMG_0409 and IMG_0401, and in 18-20 of 24 in a
 * crop of the track's height. IMG_0409 was never followed; IMG_0401 was found past its entry and never measured.
 * Empty when the crop is about square already. */
export function tilesOf(roi: Region, w: number, h: number): Region[] {
  const square = roi.w * w / h;   // a square tile's height, in picture heights
  if (square >= .75 * roi.h) return [];
  const tall = Math.max(square, .6 * roi.h);
  return [{ ...roi, h: tall }, { ...roi, y: roi.y + roi.h - tall, h: tall }];
}
/** A body within this much (picture heights) of a tile's top or bottom is cut by it. */
const TILE_EDGE = .01;
/** The tiles' poses worth adding to the crop's: a body cut by a tile's top or bottom (inside the picture) is left to
 * the other tile, and a person already detected (in the crop or an earlier tile) is not added twice: two detections of
 * one runner made the tracker undecided between them. */
export function fromTiles(found: readonly { poses: Point[][]; tile: Region }[], seen: readonly Point[][]): Point[][] {
  const kept: Point[][] = [];
  for (const { poses, tile } of found) for (const p of poses) {
    const cut = BODY_POINTS.some(i => p[i] && ((tile.y > 0 && p[i].y < tile.y + TILE_EDGE) || (tile.y + tile.h < 1 && p[i].y > tile.y + tile.h - TILE_EDGE)));
    if (!cut && ![...seen, ...kept].some(q => samePerson(p, q))) kept.push(p);
  }
  return kept;
}

/** One sprint's frame-by-frame analysis of a recorded video: the subject's crop and pose, the flying start's watch crop,
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
    /** Crouch start: the crop keeps the full picture height (narrowed to the
     * crouched set, it cut off the athlete rising out of the blocks), and the
     * tracker follows the athlete out of the blocks (see SprintTracker). */
    private readonly fromBlocks = false,
    /** Flying start: until someone is followed, the crop is also searched in tiles (tilesOf), with the watcher. */
    private readonly tiles = false) {
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
    let poses: Point[][] = this.detect(this.model, roi, frame, w, h), tiled: Point[][] = [];
    // The watcher is free until someone is followed (its watch crop needs a subject). Only when the crop found nobody:
    // where it found people (others, behind the track), the tiles found more of them, and the frames thinned while
    // nobody runs were all looked at (recorded: a 50-60 m video, 448 frames instead of 333).
    const tiles = this.tiles && !tracker.following && !poses.length ? tilesOf(roi, w, h) : [];
    if (tiles.length) {
      const watcher = await this.watcher();
      tiled = fromTiles(tiles.map(tile => ({ poses: this.detect(watcher, tile, frame, w, h), tile })), poses);
      poses = [...poses, ...tiled];
    }
    // While the subject is elsewhere, the run-in side is watched with its full height.
    const watch = tracker.watchCentre(frame.pts);
    const region = watch === null ? null : { x: Math.max(0, Math.min(.64, watch - .18)), y: 0, w: .36, h: 1 };
    let watched: { poses: typeof poses; view: readonly [number, number] } | undefined;
    // Any offset matters: a runner entering at the frame edge is outside a crop shifted only partly
    // toward the subject (recorded: the subject's crop covered 0.12-0.48, the runner came in at 0-0.1).
    if (region && Math.abs(region.x - roi.x) > .01 && this.analysed % 2 === 0)
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
      // A runner found only in a tile was too small for this crop: the crop takes its band at once.
      const k = tiled.includes(selected) ? 1 : .2;
      if (nextBottom - nextTop > .2) { this.top = (1 - k) * this.top + k * nextTop; this.bottom = (1 - k) * this.bottom + k * nextBottom; }
    }
    this.sampleAt.set(frame.pts, samples.length);
    samples.push(sprintSample(selected, frame.frameIndex, frame.pts, w / h));
    return selected;
  }
}
