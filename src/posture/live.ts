/** The posture camera: the camera's picture with MediaPipe's pose on each frame the phone keeps up with (shown on the
 * camera view and checked by fit.ts), and full frames taken for the analysis. Nothing leaves the browser. */
import type { NormalizedLandmark } from '@mediapipe/tasks-vision';
import { MobileCMJPose } from '../cmj/mobile-pose';

export interface LiveFrame { poses: NormalizedLandmark[][]; width: number; height: number; time: number }
/** The frames MediaPipe reads are made at most this size (pixels): enough to find a standing athlete, and fast. */
const READ_SIDE = 640;

/** What the camera is asked for: the way it faces, and a steady frame rate; the size is the camera's own (asking a
 * phone's browser for a portrait size can crop the picture, camera-geometry.ts). */
export function postureCamera(facing: 'user' | 'environment'): MediaStreamConstraints {
  return { audio: false, video: { facingMode: { ideal: facing }, frameRate: { ideal: 30 } } };
}

export class PostureCamera {
  private finder: MobileCMJPose | null = null;
  private stream: MediaStream | null = null;
  private callback = 0;
  private stopped = false;
  private last: NormalizedLandmark[][] = [];
  private small = document.createElement('canvas');
  private frame = 0;
  private empty = 0;
  private found = false;
  constructor(private video: HTMLVideoElement, private onFrame: (f: LiveFrame) => void) {}

  async start(facing: 'user' | 'environment', signal: AbortSignal, status: (text: string) => void) {
    if (!navigator.mediaDevices?.getUserMedia) throw new Error('カメラを利用できません。HTTPSで開いているか確かめるか、写真を選んでください。');
    status('カメラを起動しています…');
    const stream = await navigator.mediaDevices.getUserMedia(postureCamera(facing));
    if (signal.aborted || this.stopped) { stream.getTracks().forEach(t => t.stop()); throw new DOMException('中止', 'AbortError'); }
    this.stream = stream; this.video.srcObject = stream; this.video.muted = true; this.video.playsInline = true;
    await this.video.play();
    this.finder = await this.open('GPU', signal, status).catch(() => this.open('CPU', signal, status));
    if (signal.aborted || this.stopped) throw new DOMException('中止', 'AbortError');
    status('');
    this.loop();
  }
  private async open(delegate: 'GPU' | 'CPU', signal: AbortSignal, status: (text: string) => void) {
    const finder = new MobileCMJPose('full', undefined, delegate, 2, 'VIDEO');
    await finder.initialize(signal, status);
    return finder;
  }
  private loop() {
    const next = () => {
      if (this.stopped) return;
      this.read();
      this.callback = this.video.requestVideoFrameCallback ? this.video.requestVideoFrameCallback(next) : requestAnimationFrame(next);
    };
    next();
  }
  private read() {
    const v = this.video, finder = this.finder;
    if (!finder || !v.videoWidth || !v.videoHeight || v.readyState < 2) return;
    const s = Math.min(1, READ_SIDE / Math.max(v.videoWidth, v.videoHeight));
    const w = Math.round(v.videoWidth * s), h = Math.round(v.videoHeight * s);
    if (this.small.width !== w || this.small.height !== h) { this.small.width = w; this.small.height = h; }
    this.small.getContext('2d')!.drawImage(v, 0, 0, w, h);
    const time = performance.now() / 1000;
    let poses: NormalizedLandmark[][];
    try { poses = finder.estimate(this.small, this.frame++, time).landmarks; }
    catch { return; }
    // A GPU that starts but never finds anyone (some browsers): once, before anyone was found, the CPU instead.
    if (poses.length) { this.found = true; this.empty = 0; }
    else if (finder.backend === 'GPU' && !this.found && ++this.empty === 90) void this.toCpu();
    this.last = poses;
    this.onFrame({ poses, width: v.videoWidth, height: v.videoHeight, time });
  }
  private async toCpu() {
    const old = this.finder; this.finder = null;
    try { this.finder = await this.open('CPU', new AbortController().signal, () => undefined); old?.dispose(); }
    catch { this.finder = old; }
  }
  /** The frame on the camera now, full size (not mirrored), with the poses last read. */
  grab(): { picture: HTMLCanvasElement; poses: NormalizedLandmark[][] } {
    const v = this.video, picture = document.createElement('canvas');
    picture.width = v.videoWidth; picture.height = v.videoHeight;
    picture.getContext('2d')!.drawImage(v, 0, 0);
    return { picture, poses: this.last };
  }
  stop() {
    this.stopped = true;
    if (this.video.cancelVideoFrameCallback) this.video.cancelVideoFrameCallback(this.callback); else cancelAnimationFrame(this.callback);
    this.stream?.getTracks().forEach(t => t.stop()); this.stream = null;
    this.video.pause(); this.video.srcObject = null;
    this.finder?.dispose(); this.finder = null;
  }
}

/** The phone's tilt from the accelerometer (degrees): `roll`, turned in the screen's plane from upright; `pitch`, leaned
 * back or forward. Asked for on a tap (iPhone asks the person); null when there is no sensor or it is not allowed. */
export async function motionAllowed(): Promise<boolean> {
  const D = typeof DeviceMotionEvent !== 'undefined' ? DeviceMotionEvent as unknown as { requestPermission?: () => Promise<string> } : null;
  if (!D) return false;
  if (!D.requestPermission) return true;
  try { return await D.requestPermission() === 'granted'; } catch { return false; }
}
/** Roll and pitch from gravity in the device's axes (the sign of y set by the browser: upright, y is up or down). */
export function tiltOf(g: { x: number | null; y: number | null; z: number | null }): { roll: number; pitch: number } | null {
  if (g.x === null || g.y === null || g.z === null || !(Math.hypot(g.x, g.y, g.z) > 5)) return null;
  const s = g.y >= 0 ? 1 : -1, deg = 180 / Math.PI;
  return { roll: Math.atan2(-s * g.x, s * g.y) * deg, pitch: Math.atan2(s * g.z, Math.hypot(g.x, g.y)) * deg };
}

/** Spoken guidance (the athlete stands 3 m from the phone). Started on a tap: phones speak only after one. */
export class Voice {
  on = true;
  private context: AudioContext | null = null;
  unlock() {
    try { if (typeof speechSynthesis !== 'undefined') speechSynthesis.speak(new SpeechSynthesisUtterance('')); } catch { /* no speech */ }
    try { const A = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext; if (A) this.context ??= new A(); void this.context?.resume(); } catch { /* no sound */ }
  }
  say(text: string) {
    if (!this.on || typeof speechSynthesis === 'undefined' || !text) return;
    try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); u.lang = 'ja-JP'; u.rate = 1.05; speechSynthesis.speak(u); } catch { /* no speech */ }
  }
  /** A short tone: the countdown's (440 Hz) and the shutter's (880 Hz). */
  beep(hz = 440, ms = 120) {
    const c = this.context;
    if (!this.on || !c) return;
    try {
      const o = c.createOscillator(), g = c.createGain(), t = c.currentTime;
      o.frequency.value = hz; g.gain.setValueAtTime(.2, t); g.gain.exponentialRampToValueAtTime(.001, t + ms / 1000);
      o.connect(g).connect(c.destination); o.start(t); o.stop(t + ms / 1000);
    } catch { /* no sound */ }
  }
  close() { try { speechSynthesis?.cancel(); } catch { /* none */ } void this.context?.close().catch(() => undefined); this.context = null; }
}
