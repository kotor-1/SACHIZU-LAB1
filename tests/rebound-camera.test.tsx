import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import type { NormalizedLandmark } from '@mediapipe/tasks-vision';
import { feetAndLeg, JUMP_WATCH, jumpWatch } from '../src/rebound/jump-watch';
import { bestCamera, goodCamera, measuredFps, RJ_CAMERA, type CameraTry } from '../src/rebound/rj-camera';
import { longestSet, missedFrames, RJ_BACKLOG_BYTES, RJCameraPump, RJ_STALL_MS, type RJSet } from '../src/rebound/rj-live-session';
import type { RJLiveClient } from '../src/rebound/rj-live-client';
import CameraRJ from '../src/rebound/CameraRJ';
import { CameraTaken, cameraObservation, toeCycleExport } from '../src/rebound/ToeCycleLab';
import { toeCycleDepth, toeCycleReport } from '../src/rebound/toe-cycle-research';
import { soleContactReport } from '../src/rebound/sole-contact';
import { wholeCycleReport } from '../src/rebound/whole-cycle-research';
import { predictionSignals, type PoseFrame } from '../src/rebound/prediction-observations';
import { AUTOMATIC_REGION } from '../src/rebound/automatic-foot';
import { hybridDisplacement } from '../src/rebound/hybrid-physics';
import { parseToeCycleImport } from '../src/rebound/toe-cycle-import';

/** A front-view athlete: hips at .45, ankles .30 below (the leg), heels/toes a little lower, the whole body `lift` up. */
function athlete(lift: number): NormalizedLandmark[] {
  const p: NormalizedLandmark[] = Array.from({ length: 33 }, () => ({ x: .5, y: .2, z: 0, visibility: .99 }));
  const set = (i: number, y: number) => { p[i] = { x: i % 2 ? .45 : .55, y: y - lift, z: 0, visibility: .99 }; };
  set(23, .45); set(24, .45); set(25, .6); set(26, .6); set(27, .75); set(28, .75); set(29, .78); set(30, .78); set(31, .78); set(32, .78);
  return p;
}
/** 60 frames a second: standing `before` s, `jumps` rebounds (contact .2 s, flight .4 s, feet up to .12 of the image), standing `after` s. */
function rebounds(jumps: number, before = .6, after = 2) {
  const frames: { pts: number; lift: number }[] = [], dt = 1 / 60, end = before + jumps * .6 + after;
  for (let i = 0; i * dt < end; i++) {
    const t = i * dt, k = Math.floor((t - before) / .6), local = t - before - k * .6;
    const lift = t >= before && k < jumps && local < .4 ? .12 * Math.sin(Math.PI * local / .4) : 0;
    frames.push({ pts: t, lift });
  }
  return frames;
}

describe('the RJ camera follows the jumps of a set (jump-watch.ts)', () => {
  it('counts each rebound once and ends the set after the athlete has stood still', () => {
    const watch = jumpWatch(), frames = rebounds(5);
    let ended: number | null = null, jumps = 0;
    for (const f of frames) { const s = watch(athlete(f.lift), f.pts); jumps = s.jumps; if (s.ended && ended === null) ended = f.pts; }
    expect(jumps).toBe(5);
    // The last flight lands near 0.6 + 4 x 0.6 + 0.4 = 3.4 s; the set ends about quietSeconds later (the feet still
    // over that long, the 10th-90th percentile range leaving its first tenth out).
    expect(ended).not.toBeNull();
    expect(ended! - 3.4).toBeGreaterThan(JUMP_WATCH.quietSeconds - .3);
    expect(ended! - 3.4).toBeLessThan(JUMP_WATCH.quietSeconds + .1);
  });
  it('does not end before two jumps, and ends once the athlete leaves after them', () => {
    const one = jumpWatch();
    expect(rebounds(1, .6, 3).map(f => one(athlete(f.lift), f.pts)).some(s => s.ended)).toBe(false);
    const gone = jumpWatch(), frames = rebounds(3, .6, 0);
    for (const f of frames) gone(athlete(f.lift), f.pts);
    const last = frames.at(-1)!.pts;
    expect(gone(null, last + .5).ended).toBe(false);
    expect(gone(null, last + JUMP_WATCH.quietSeconds + .05).ended).toBe(true);
  });
  it('does not count walking (one foot always down) as jumps', () => {
    const watch = jumpWatch();
    let last = { jumps: 0, ended: false };
    for (let i = 0; i < 240; i++) {
      const pts = i / 60, p = athlete(0), step = .1 * Math.max(0, Math.sin(Math.PI * pts / .5));
      // One foot up at a time, the other on the floor.
      for (const k of (Math.floor(pts / .5) % 2 ? [27, 29, 31] : [28, 30, 32])) p[k] = { ...p[k], y: p[k].y - step };
      last = watch(p, pts);
    }
    expect(last.jumps).toBe(0);
  });
  it('needs both feet and both legs seen', () => {
    const p = athlete(0); expect(feetAndLeg(p)?.leg).toBeCloseTo(.3, 6);
    for (const i of [27, 29, 31]) p[i] = { ...p[i], visibility: .1 };
    expect(feetAndLeg(p)).toBeNull();
  });
});

describe('the RJ camera at 60 frames a second (rj-camera.ts)', () => {
  const t = (label: string, width: number, height: number, frameRate: number | null): CameraTry => ({ label, width, height, frameRate });
  it('takes 60 frames a second at 720p or more, and prefers 60 to a larger picture', () => {
    expect(goodCamera(t('1080p', 1920, 1080, 60))).toBe(true);
    expect(goodCamera(t('1080p', 1920, 1080, 59.94))).toBe(true);
    expect(goodCamera(t('720p', 1280, 720, 30))).toBe(false);
    expect(goodCamera(t('auto', 640, 480, 60))).toBe(false);
    expect(bestCamera([t('1080p', 1920, 1080, 30), t('720p', 1280, 720, 60), t('auto', 640, 480, 60)])?.label).toBe('720p');
    expect(bestCamera([t('1080p', 1920, 1080, 30), t('720p', 1280, 720, 30)])?.label).toBe('1080p');
    expect(RJ_CAMERA.minimumFps).toBe(50);
  });
  it('measures the frame rate and the frames missed from the frames’ own times', () => {
    const times = Array.from({ length: 120 }, (_, i) => i / 60 + (i % 3 - 1) * .0004);
    expect(measuredFps(times)).toBeGreaterThan(58); expect(measuredFps(times)).toBeLessThan(62);
    expect(measuredFps(times.slice(0, 5))).toBeNull();
    expect(missedFrames(times)).toBe(0);
    expect(missedFrames(times.filter((_, i) => i !== 10 && i !== 20 && i !== 21))).toBe(3);
  });
  it('says how long a set this phone can read without falling too far behind', () => {
    const bytes = 540 * 960 * 4;
    expect(longestSet(60, 70, bytes)).toBeNull();
    expect(longestSet(60, 59.5, bytes)).toBeNull();
    expect(longestSet(60, 45, bytes)).toBeCloseTo(RJ_BACKLOG_BYTES / bytes / 15, 6);
    expect(longestSet(60, 57, bytes)).toBe(RJ_CAMERA.maximumSeconds);
    expect(longestSet(null, 45, bytes)).toBeNull();
  });
});

// The synthetic bilateral rebounds of rebound-frame-interval.test.tsx, thinned from 240 to 60 frames a second.
function camera60(): PoseFrame[] {
  const all = Array.from({ length: 12 * 144 + 1 }, (_, frame) => {
    const phase = (frame / 144 + .5) % 1, fraction = .6;
    const hip = .4 + 1200 / 960 * hybridDisplacement(phase, fraction, 'HALF_SINE');
    const landmarks: NormalizedLandmark[] = Array.from({ length: 33 }, () => ({ x: .5, y: -1, z: 0, visibility: 0 }));
    for (const [index, y] of [[23, hip], [24, hip], [25, hip + .15], [26, hip + .15], [27, hip + .30], [28, hip + .30],
      [31, .76 + .075 * toeCycleDepth(phase, fraction)], [32, .76 + .075 * toeCycleDepth(phase, fraction)]])
      landmarks[index] = { x: index % 2 ? .46 : .54, y, z: 0, visibility: .99 };
    return { frame, pts: frame / 240, poses: [landmarks] };
  });
  return all.filter((_, i) => i % 4 === 0).map((f, i) => ({ ...f, frame: i, pts: f.pts - all[0].pts }));
}

describe('a camera set is analysed and saved as a recording is', () => {
  it('saves a JSON that 「保存済みJSONから再計算」 reads back, frame for frame', async () => {
    const poses = camera60(), soles = poses.map(p => ({ frame: p.frame, pts: p.pts, feet: [null, null] as [null, null] }));
    const observation = await cameraObservation({ poses, soles }, new Date('2026-10-22T13:00:00Z'));
    expect(observation.filename).toBe('rj-camera-2026-10-22T13-00-00-000Z');
    expect(observation.hash).toMatch(/^[0-9a-f]{64}$/); expect(observation.origin).toBe('CAMERA');
    const report = toeCycleReport(poses, observation.hash, observation.filename), sole = soleContactReport(report, soles);
    expect(sole.headlineMean).not.toBeNull();
    const baseline = wholeCycleReport(predictionSignals(poses, AUTOMATIC_REGION, 'BOTH').PELVIS, observation.hash, observation.filename);
    const saved = JSON.stringify(toeCycleExport(observation, 'BOTH', report, sole, baseline, { camera: { cameraFps: 60 } }));
    expect(JSON.parse(saved).inputProvenance).toEqual({ kind: 'CAMERA', sourceVideoVerified: false });
    const back = parseToeCycleImport(saved, new TextEncoder().encode(saved).byteLength);
    expect(back.poses).toHaveLength(poses.length); expect(back.soles).toHaveLength(poses.length);
    expect(toeCycleReport(back.poses, back.sourceVideoSHA256, back.filename).mean).toBeCloseTo(report.mean!, 9);
  });
});

describe('the RJ camera on the screen', () => {
  it('starts with the camera off and says it films at 60 frames a second', () => {
    const html = renderToStaticMarkup(<CameraRJ onSet={async () => undefined} onBusy={() => undefined} records={[]} />);
    expect(html).toContain('カメラを起動'); expect(html).toContain('1秒60コマ'); expect(html).not.toContain('>計測を開始</button>');
  });
  it('lists the sets measured on the screen', () => {
    const html = renderToStaticMarkup(<CameraRJ onSet={async () => undefined} onBusy={() => undefined}
      records={[{ n: 1, time: '13:00:00', rsi: 1.52, lastThree: 1.6, best: 1.71, contactMs: 182 }]} />);
    expect(html).toContain('この画面で測った記録（1回）'); expect(html).toContain('1.52'); expect(html).toContain('182');
  });
  it('says when a set lost camera frames or was cut short by a slow phone', () => {
    const shown = { width: 1920, height: 1080, cameraFps: 60, seconds: 6.2, frames: 372, missedFrames: 0, end: 'AUTO' as const, timing: 'frame', waited: 1.4 };
    const clean = renderToStaticMarkup(<CameraTaken shown={shown} />);
    expect(clean).toContain('1秒60コマ'); expect(clean).toContain('372コマを解析（取りこぼしなし）'); expect(clean).not.toContain('rj-warning');
    const cut = renderToStaticMarkup(<CameraTaken shown={{ ...shown, missedFrames: 2, end: 'BEHIND', timing: 'capture' }} />);
    expect(cut).toContain('2コマ取りこぼしました'); expect(cut).toContain('解析が追いつかない'); expect(cut).toContain('撮影時刻を出さない');
    expect(renderToStaticMarkup(<CameraTaken shown={{ ...shown, end: 'STALLED' }} />)).toContain('カメラの映像が2秒止まったため、そこまでで計測を終えました');
  });
});

describe('a camera set whose frames stop (2026-10-23)', () => {
  it('ends where it is when no camera frame comes for 2 s, with the frames it has', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'performance', 'Date'] });
    try {
      const video = { requestVideoFrameCallback: () => 0, cancelVideoFrameCallback: () => undefined } as unknown as HTMLVideoElement;
      const client = { request: async () => ({ landmarks: [], sole: null, inferenceMs: 1, workMs: 1, backend: 'CPU' }) } as unknown as RJLiveClient;
      const pump = new RJCameraPump(video, client, () => undefined, e => { throw e; });
      pump.readFrames();
      let done = null as RJSet | null;
      void pump.beginSet().then(s => { done = s; });
      for (let i = 0; i < 40; i++) {
        pump.feed({ image: { close() {} } as unknown as ImageBitmap, pts: i / 60, width: 540, height: 960 });
        await vi.advanceTimersByTimeAsync(1000 / 60);
      }
      await vi.advanceTimersByTimeAsync(RJ_STALL_MS - 500);
      expect(done).toBeNull();   // a short pause is not a stop
      await vi.advanceTimersByTimeAsync(1000);
      expect(done).toMatchObject({ end: 'STALLED' }); expect(done!.poses.length).toBe(40);
      pump.stop();
    } finally { vi.useRealTimers(); }
  });
});
