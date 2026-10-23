import type { NormalizedLandmark } from '@mediapipe/tasks-vision';
import { createLowerSubjectSelector } from './lower-body';
import { measureSoleBoxes, soleBoxes, soleRegion, SOLE_CONTACT_SETTINGS, type SoleFrame } from './sole-contact';

type Surface = HTMLCanvasElement | OffscreenCanvas;
type Context = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

/** Reads only the two shoe boxes of each source frame, for the same subject
 * the toe model will select (identical selector, frame order). `surface`
 * makes the canvas it draws on: a page canvas for a chosen video, an
 * OffscreenCanvas in the camera's worker (rj-live-worker.ts), so both read
 * the shoes the same way. One meter per recording or camera set. */
export function soleMeter(surface: () => Surface) {
  const select = createLowerSubjectSelector({ left: 0, right: 1, top: 0, bottom: 1 }, 'BOTH', { allowSmallInitialSubject: true });
  const canvas = surface(), context = canvas.getContext('2d', { willReadFrequently: true }) as Context | null;
  const height = SOLE_CONTACT_SETTINGS.imageHeight;
  return (bitmap: ImageBitmap, rotation: number, poses: NormalizedLandmark[][], frame: number, pts: number): SoleFrame => {
    const selected = select(poses, pts), portrait = rotation % 180 !== 0;
    const w = portrait ? bitmap.height : bitmap.width, h = portrait ? bitmap.width : bitmap.height, scale = height / h;
    const width = Math.round(w * scale), boxes = soleBoxes(selected.length === 1 ? selected[0] : null, width, height);
    const region = soleRegion(boxes, width, height);
    if (!context || !region) return { frame, pts, feet: [null, null] };
    if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.translate(width / 2, height / 2); context.rotate(rotation * Math.PI / 180); context.scale(scale, scale);
    context.drawImage(bitmap, -bitmap.width / 2, -bitmap.height / 2); context.setTransform(1, 0, 0, 1, 0, 0);
    const rgba = context.getImageData(region.x, region.y, region.width, region.height).data, pixels = new Uint8Array(region.width * region.height);
    for (let i = 0; i < pixels.length; i++) pixels[i] = (77 * rgba[i * 4] + 150 * rgba[i * 4 + 1] + 29 * rgba[i * 4 + 2]) >> 8;
    return { frame, pts, feet: measureSoleBoxes({ width: region.width, height: region.height, pixels, rgba }, boxes, region.x, region.y) };
  };
}
