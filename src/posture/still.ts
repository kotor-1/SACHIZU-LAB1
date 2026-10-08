/** A posture picture's keypoints: the athlete found by MediaPipe (the tallest person), then read by RTMPose (rtm.ts). */
import { MobileCMJPose } from '../cmj/mobile-pose';
import type { View } from './analysis';
import type { Landmark } from './fit';
import { cropAround, medianOf, type Keypoint } from './keypoints';
import { keypointsIn, release, withHeadIn, type Picture, type PostureModel } from './rtm';

/** A picture taken for a view, with the athlete's keypoints read from it. */
export interface Shot {
  view: View; picture: HTMLCanvasElement; points: Keypoint[];
  source: 'photo' | 'camera';
  /** Camera: the frames the keypoints are the median of; a photo: 1. */
  frames: number;
  /** People found in the photo (the tallest is read). */
  people: number;
  /** The phone's tilt in the screen's plane when taken (degrees; photos: from the photo's own record), null when not known. */
  roll: number | null;
  /** A photo: how far the phone looked down when taken (degrees, from its record), null when not known. */
  pitch: number | null;
  name?: string; takenAt: string;
}

/** A photo's longest side as kept (pixels): the athlete stays many times the model's 256 pixels, and a 48-megapixel
 * photo would not fit a phone's canvas. */
export const MAX_SIDE = 2048;

/** A photo as the person saw it (turned as the camera recorded), at most MAX_SIDE. Decoded through an ImageBitmap: a
 * 24-megapixel HEIC took the page 191 MB more for a moment in WebKit, not 365 MB through <img>.decode(), and 0.2 s, not
 * 1.4 s; <img> when the bitmap cannot be made turned as the photo says (older browsers). */
export async function loadPhoto(file: Blob): Promise<HTMLCanvasElement> {
  const url = URL.createObjectURL(file), image = new Image();
  const unreadable = () => {
    // iPhone photos are HEIC: Safari reads them, Chrome (on a computer or Android) does not.
    const heic = /hei[cf]/i.test(file.type) || (file instanceof File && /\.hei[cf]$/i.test(file.name));
    return new Error(heic ? 'HEIC形式の写真は、このブラウザでは読み込めません。Safariで開くか、JPEGに変換した写真を選んでください。'
      : 'この写真を読み込めませんでした。JPEGかPNGの写真を選んでください。');
  };
  let bitmap: ImageBitmap | null = null;
  try {
    // The size as shown, from the photo's header (its pixels not decoded yet).
    try { await new Promise((ok, no) => { image.onload = ok; image.onerror = no; image.src = url; }); } catch { throw unreadable(); }
    const width = image.naturalWidth, height = image.naturalHeight;
    try {
      bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
      if (bitmap.width !== width || bitmap.height !== height) { bitmap.close(); bitmap = null; }
    } catch { bitmap = null; }
    if (!bitmap) try { await image.decode(); } catch { throw unreadable(); }
    const s = Math.min(1, MAX_SIDE / Math.max(width, height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(width * s)); canvas.height = Math.max(1, Math.round(height * s));
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('画像処理を開始できません。');
    ctx.drawImage(bitmap ?? image, 0, 0, canvas.width, canvas.height);
    return canvas;
  } finally { bitmap?.close(); URL.revokeObjectURL(url); }
}

/** The phone's gravity when an iPhone took the photo, from the photo's own record (Apple's maker note, tag 8: x, y, z in
 * g on the phone's axes, as Core Motion's: x to the screen's right, y to its top, z out of the screen). Null without it.
 * On the user's photos it was in the HEIC and kept in a JPEG made from it; the pitch it gave put the horizon where it
 * was (2026-10-08). */
export function appleGravity(bytes: Uint8Array): [number, number, number] | null {
  const sign = [0x41, 0x70, 0x70, 0x6c, 0x65, 0x20, 0x69, 0x4f, 0x53, 0x00];   // "Apple iOS\0"
  const end = Math.min(bytes.length, 1 << 19) - sign.length;
  for (let i = 0; i < end; i++) {
    if (bytes[i] !== 0x41 || sign.some((b, j) => bytes[i + j] !== b)) continue;
    const view = new DataView(bytes.buffer, bytes.byteOffset + i, bytes.length - i), le = bytes[i + 12] === 0x49;
    try {
      for (let k = 0, n = view.getUint16(14, le); k < n; k++) {
        const e = 16 + 12 * k;
        if (view.getUint16(e, le) !== 8 || view.getUint16(e + 2, le) !== 10 || view.getUint32(e + 4, le) !== 3) continue;
        const at = view.getUint32(e + 8, le), v = [0, 1, 2].map(j => view.getInt32(at + 8 * j, le) / view.getInt32(at + 8 * j + 4, le));
        return v.every(Number.isFinite) ? v as [number, number, number] : null;
      }
    } catch { return null; }
    return null;
  }
  return null;
}
/** The phone's tilt from its gravity, held upright: roll (degrees, the phone turned clockwise as its screen is seen
 * positive) and pitch (looking down positive). Null when the phone was not upright. */
export function phoneTiltOf([x, y, z]: readonly number[]): { roll: number; pitch: number } | null {
  const n = Math.hypot(x, y, z), deg = (r: number) => r * 180 / Math.PI;
  if (!(n > .5) || -y < .8 * n) return null;
  return { roll: deg(Math.asin(x / n)), pitch: deg(Math.atan2(-z, -y)) };
}
/** A photo's phone tilt from its record, when it has one. */
export async function phoneTilt(file: Blob) {
  const g = appleGravity(new Uint8Array(await file.slice(0, 1 << 19).arrayBuffer()));
  return g && phoneTiltOf(g);
}

const height = (p: readonly Landmark[]) => {
  const ys = p.filter(q => (q.visibility ?? 1) >= .3).map(q => q.y);
  return ys.length ? Math.max(...ys) - Math.min(...ys) : 0;
};
/** The tallest of the poses found. */
export function tallest<T extends readonly Landmark[]>(poses: readonly T[]): T | null {
  return poses.reduce<T | null>((best, p) => !best || height(p) > height(best) ? p : best, null);
}
/** The model's first window from a MediaPipe pose (normalized) on a picture `width` x `height`. */
export const startCrop = (pose: readonly Landmark[], width: number, height: number) =>
  cropAround(pose.map(q => ({ x: q.x * width, y: q.y * height, score: q.visibility ?? 1 })));

export interface Reading { points: Keypoint[]; people: number }
/** The athlete in a photo taken for `view`. `finder`: MediaPipe in IMAGE mode, finding 2 people at most. */
export async function readPhoto(finder: MobileCMJPose, model: PostureModel, picture: Picture, view: View): Promise<Reading> {
  const poses = finder.estimate(picture, 0, 0).landmarks, pose = tallest(poses);
  const crop = pose && startCrop(pose, picture.width, picture.height);
  if (!crop) throw new Error('人が見つかりませんでした。頭から足先まで全身が写った写真を選んでください。');
  try {
    const body = await keypointsIn(model, picture, crop);
    return { points: view === 'side' ? body : await withHeadIn(model, picture, body), people: poses.length };
  } finally { release(picture); }
}

/** The athlete in frames taken from the camera for `view` a moment apart, each with the pose the camera view showed:
 * each read at one window size, as it is and mirrored (the head too, front and back), and the median taken over the
 * frames. */
export async function readFrames(model: PostureModel, frames: readonly { picture: Picture; pose: readonly Landmark[] }[], view: View): Promise<Keypoint[]> {
  const readings: Keypoint[][] = [];
  for (const f of frames) {
    const crop = startCrop(f.pose, f.picture.width, f.picture.height);
    if (!crop) continue;
    try {
      const body = await keypointsIn(model, f.picture, crop, [1.25]);
      readings.push(view === 'side' ? body : await withHeadIn(model, f.picture, body, [1.25]));
    } finally { release(f.picture); }
  }
  if (!readings.length) throw new Error('骨格を読み取れませんでした。もう一度撮ってください。');
  return medianOf(readings);
}

/** MediaPipe for photos (one picture at a time, the person found afresh). */
export async function photoFinder(signal: AbortSignal, status: (text: string) => void) {
  const finder = new MobileCMJPose('full', undefined, 'CPU', 2, 'IMAGE');
  await finder.initialize(signal, status);
  return finder;
}
