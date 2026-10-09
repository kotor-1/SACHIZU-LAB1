import { describe, expect, it } from 'vitest';
import { analyzeView, findingsOf, frontal, levelOf, nearEdgeOf, sagittal, sided, turned, viewWarnings, type Measure, type ViewResult } from '../src/posture/analysis';
import { findingText, MEASURE_GUIDE, nearText } from '../src/posture/advice';
import { boxOf, fitOf, Stillness, type Landmark } from '../src/posture/fit';
import { cropAround, decode, FACE, headCrop, IH, IW, K, meanOf, medianOf, peak, withHead, type Keypoint } from '../src/posture/keypoints';
import { areaInput, PIXEL_MEAN, PIXEL_STD, widen } from '../src/posture/model-input';
import { tiltOf } from '../src/posture/live';
import { appleGravity, phoneTiltOf } from '../src/posture/still';

const W = 1200, H = 1600;
const at = (x: number, y: number, score = .9): Keypoint => ({ x, y, score });
/** A person standing square to the camera, from the front (the person's left on the picture's right), 1000 px tall. */
function front(): Keypoint[] {
  const p: Keypoint[] = Array.from({ length: 26 }, () => at(600, 700));
  const pair = (l: number, r: number, dx: number, y: number) => { p[l] = at(600 + dx, y); p[r] = at(600 - dx, y); };
  p[K.nose] = at(600, 290); pair(K.leftEye, K.rightEye, 15, 270); pair(K.leftEar, K.rightEar, 35, 280);
  pair(K.leftShoulder, K.rightShoulder, 90, 380); pair(K.leftElbow, K.rightElbow, 100, 530); pair(K.leftWrist, K.rightWrist, 105, 660);
  pair(K.leftHip, K.rightHip, 50, 690); pair(K.leftKnee, K.rightKnee, 50, 940); pair(K.leftAnkle, K.rightAnkle, 50, 1170);
  pair(K.leftBigToe, K.rightBigToe, 65, 1195); pair(K.leftSmallToe, K.rightSmallToe, 85, 1190); pair(K.leftHeel, K.rightHeel, 50, 1200);
  p[K.head] = at(600, 200); p[K.neck] = at(600, 370); p[K.hip] = at(600, 690);
  return p;
}
/** The same person from the side, facing the picture's right: the ear `ahead` px in front of the shoulder (100 px
 * above it), the knee `knee` px in front of the hip–ankle line. */
function side(ahead = 0, knee = 0): Keypoint[] {
  const p: Keypoint[] = Array.from({ length: 26 }, () => at(600, 700));
  const both = (l: number, r: number, x: number, y: number) => { p[l] = at(x - 4, y, .6); p[r] = at(x, y); };
  both(K.leftShoulder, K.rightShoulder, 600, 380); both(K.leftEar, K.rightEar, 600 + ahead, 280); both(K.leftEye, K.rightEye, 630 + ahead, 270);
  both(K.leftHip, K.rightHip, 600, 690); both(K.leftKnee, K.rightKnee, 600 + knee, 940); both(K.leftAnkle, K.rightAnkle, 600, 1170);
  both(K.leftHeel, K.rightHeel, 580, 1200); both(K.leftBigToe, K.rightBigToe, 670, 1200); both(K.leftSmallToe, K.rightSmallToe, 660, 1195);
  both(K.leftElbow, K.rightElbow, 600, 530); both(K.leftWrist, K.rightWrist, 600, 660);
  p[K.nose] = at(645 + ahead, 290); p[K.head] = at(605, 200); p[K.neck] = at(600, 370); p[K.hip] = at(600, 690);
  return p;
}
const mirror = (p: Keypoint[]) => p.map(q => ({ ...q, x: W - q.x }));
const value = (m: Measure[], key: string) => m.find(q => q.key === key)!.value!;
const deg = (r: number) => r * 180 / Math.PI;

describe('posture keypoints (RTMPose Halpe26)', () => {
  it('reads a peak to a part of a bin with the parabola through its neighbours', () => {
    expect(peak([0, .2, .8, .6, 0], 0, 5).at).toBeCloseTo(2 + (.2 - .6) / (2 * (.2 - 1.6 + .6)), 9);
    expect(peak([0, .5, 1, .5, 0], 0, 5)).toEqual({ at: 2, value: 1 });
    expect(peak([1, .5, 0], 0, 3).at).toBe(0);   // at the end: the bin itself
  });
  it('turns the bins into picture pixels, and a mirrored window back with left and right swapped', () => {
    const NX = IW * 2, NY = IH * 2, x = new Float32Array(26 * NX), y = new Float32Array(26 * NY);
    // left shoulder (5) at input (40, 60), right shoulder (6) at (150, 62)
    x[5 * NX + 80] = .9; y[5 * NY + 120] = .9; x[6 * NX + 300] = .8; y[6 * NY + 124] = .8;
    const crop = { cx: 500, cy: 400, scale: 2 }, p = decode(x, y, crop);
    expect(p[5].x).toBeCloseTo(500 + (40 - IW / 2) * 2, 9); expect(p[5].y).toBeCloseTo(400 + (60 - IH / 2) * 2, 9); expect(p[5].score).toBeCloseTo(.9, 6);
    const m = decode(x, y, crop, true);
    // Mirrored: the model's left shoulder seen at input x=40 is the picture's x at IW-40, and it is the right one.
    expect(m[6].x).toBeCloseTo(500 + (IW - 40 - IW / 2) * 2, 9); expect(m[6].score).toBeCloseTo(.9, 6);
    expect(m[5].x).toBeCloseTo(500 + (IW - 150 - IW / 2) * 2, 9);
  });
  it('averages readings, takes the median over frames, and cuts the 3:4 window round the points', () => {
    const a = [at(0, 0, .9), at(10, 10, .5)], b = [at(2, 2, .7), at(12, 14, .8)], c = [at(100, 100, .1), at(11, 12, .6)];
    expect(meanOf([a, b])).toEqual([at(1, 1, .7), at(11, 12, .5)]);
    expect(medianOf([a, b, c])[0]).toEqual(at(2, 2, .7));   // the wild frame does not move it
    const box = cropAround(front())!;
    expect(box.cx).toBeCloseTo(600, 6); expect(box.cy).toBeCloseTo(700, 6);
    expect(box.scale * IH).toBeCloseTo(1000 * 1.25, 6);
    expect(cropAround(front().slice(0, 4))).toBeNull();
  });
  it('reads the face again in the head\'s window, keeping the lower score', () => {
    const body = front(), head = headCrop(body)!;
    // Round the face, the top of the head, the neck and the shoulders: 3:4, much smaller than the body's window.
    expect(head.cx).toBeCloseTo(600, 6); expect(head.scale).toBeLessThan(cropAround(body)!.scale / 2);
    const again = body.map(p => ({ x: p.x + 3, y: p.y - 2, score: .5 }));
    const both = withHead(body, again);
    for (const k of FACE) expect(both[k]).toEqual({ x: body[k].x + 3, y: body[k].y - 2, score: .5 });
    expect(both[K.leftShoulder]).toEqual(body[K.leftShoulder]);   // the rest stays the body's
    const back = body.map((p, k) => (FACE as readonly number[]).includes(k) && k < 3 ? { ...p, score: .1 } : p);   // no face from behind
    expect(withHead(back, body.map(p => ({ ...p, score: .9 })))[K.nose].score).toBe(.1);
  });
});

describe('posture model input', () => {
  /** A picture `w` x `h` (RGBA) from a colour at each pixel. */
  const picture = (w: number, h: number, at: (x: number, y: number) => number) => {
    const p = new Uint8ClampedArray(w * h * 4);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const v = at(x, y); p.set([v, v, v, 255], (y * w + x) * 4); }
    return p;
  };
  const value = (input: Float32Array, u: number, v: number) => input[v * IW + u] * PIXEL_STD[0] + PIXEL_MEAN[0];   // red, back to 0-255
  it('averages the picture over each input pixel\'s footprint, black outside it', () => {
    // Stripes 1 px wide (0 and 200) read 2 px an input pixel: every input pixel is their mean, never a stripe.
    const W = 2 * IW, H = 2 * IH, stripes = picture(W, H, x => x % 2 ? 200 : 0);
    const input = areaInput(stripes, W, H, { cx: W / 2, cy: H / 2, scale: 2 }, false);
    for (const [u, v] of [[0, 0], [17, 40], [IW - 1, IH - 1]]) expect(value(input, u, v)).toBeCloseTo(100, 3);
    // A window 1.5 px a pixel: footprints cover parts of pixels, in proportion.
    const half = areaInput(picture(W, H, x => x < W / 2 ? 0 : 120), W, H, { cx: W / 2 + .75, cy: H / 2, scale: 1.5 }, false);
    expect(value(half, IW / 2, 10)).toBeCloseTo(120, 3); expect(value(half, IW / 2 - 1, 10)).toBeCloseTo(120 * .5, 3);
    // Half the window past the picture's top: black there, the picture below.
    const top = areaInput(picture(W, H, () => 90), W, H, { cx: W / 2, cy: 0, scale: 1 }, false);
    expect(value(top, 5, 0)).toBeCloseTo(0, 3); expect(value(top, 5, IH - 1)).toBeCloseTo(90, 3);
  });
  it('draws a mirrored window right to left', () => {
    const W = IW, H = IH, ramp = picture(W, H, x => x);
    const plain = areaInput(ramp, W, H, { cx: W / 2, cy: H / 2, scale: 1 }, false), mirrored = areaInput(ramp, W, H, { cx: W / 2, cy: H / 2, scale: 1 }, true);
    for (const u of [0, 10, IW - 1]) expect(value(mirrored, u, 7)).toBeCloseTo(value(plain, IW - 1 - u, 7), 3);
    expect(value(plain, 10, 7)).toBeCloseTo(10, 3);
  });
  it('widens float16 weights back to float32', () => {
    const w = widen(new Uint16Array([0x3c00, 0xc000, 0x7bff, 0x0001, 0x0000, 0x8000, 0x7c00, 0x3555]));
    expect(Array.from(w.slice(0, 5))).toEqual([1, -2, 65504, 2 ** -24, 0]);
    expect(Object.is(w[5], -0)).toBe(true); expect(w[6]).toBe(Infinity); expect(w[7]).toBeCloseTo(1 / 3, 3);
  });
});

describe('posture measures', () => {
  it('a square stance is level and straight from the front and from the back', () => {
    for (const view of ['front', 'back'] as const) {
      const m = frontal(view === 'front' ? front() : mirror(front()), view);
      for (const q of m) { expect(q.value).toBeCloseTo(0, 6); expect(q.level).toBe(0); }
    }
  });
  it('tells which shoulder is lower from where it is in the picture, whatever the model called it', () => {
    const p = front();
    p[K.rightShoulder] = at(510, 380 + Math.tan(3 / 180 * Math.PI) * 180);   // the picture's left shoulder 3° lower
    const f = frontal(p, 'front'), b = frontal(p, 'back');
    // From the front the picture's left is the person's right; from behind, the person's left.
    expect(value(f, 'shoulderTilt')).toBeCloseTo(-3, 6); expect(f.find(q => q.key === 'shoulderTilt')!.text).toBe('右が低い 3.0°');
    expect(value(b, 'shoulderTilt')).toBeCloseTo(3, 6); expect(levelOf('shoulderTilt', 3)).toBe(2);
    // The model's left and right crossed (seen from behind): the same answer.
    const crossed = p.map(q => ({ ...q }));
    [crossed[K.leftShoulder], crossed[K.rightShoulder]] = [crossed[K.rightShoulder], crossed[K.leftShoulder]];
    expect(value(frontal(crossed, 'front'), 'shoulderTilt')).toBeCloseTo(-3, 6);
    expect(sided(crossed, 'front')[K.leftShoulder].x).toBeGreaterThan(sided(crossed, 'front')[K.rightShoulder].x);
  });
  it('signs the knees outward (bow legs) and inward (knock knees), the axis toward the person\'s left', () => {
    const p = front(), out = 30;   // each knee 30 px off the 480 px hip–ankle line, halfway down
    p[K.leftKnee] = at(650 + out, 940); p[K.rightKnee] = at(550 + out, 940);   // both knees moved to the picture's right
    const m = frontal(p, 'front');
    const off = deg(Math.atan(out / 250)) + deg(Math.atan(out / 230));   // the thigh (250 px) and the shank (230 px) each turn
    expect(value(m, 'kneeLeft')).toBeCloseTo(off, 1);    // left knee outward
    expect(value(m, 'kneeRight')).toBeCloseTo(-off, 1);  // right knee inward
    const q = front(); q[K.leftShoulder] = at(690 + 50, 380); q[K.rightShoulder] = at(510 + 50, 380);
    expect(value(frontal(q, 'front'), 'bodyAxis')).toBeCloseTo(deg(Math.atan(50 / 790)), 6);   // shoulders over to the person's left
    expect(value(frontal(q, 'back'), 'bodyAxis')).toBeCloseTo(-deg(Math.atan(50 / 790)), 6);
  });
  it('measures the side the same facing right or left, forward positive', () => {
    for (const p of [side(36, -20), mirror(side(36, -20))]) {
      const s = sagittal(p);
      expect(value(s.measures, 'headForward')).toBeCloseTo(deg(Math.atan(36 / 100)), 6);
      expect(value(s.measures, 'knee')).toBeLessThan(-4);   // the knee behind the hip–ankle line: pressed back
      expect(value(s.measures, 'pelvisForward')).toBeCloseTo(0, 6);
    }
    expect(sagittal(side()).facing).toBe('right'); expect(sagittal(mirror(side())).facing).toBe('left');
    const bent = sagittal(side(0, 40)).measures.find(q => q.key === 'knee')!;
    expect(bent.value).toBeGreaterThan(8); expect(bent.text).toMatch(/^屈曲/);
    // A knee bent a little is usual; pressed back as far is not.
    expect(levelOf('knee', 6)).toBe(0); expect(levelOf('knee', -6)).toBe(1);
  });
  it('measures a picture taken with the phone leaning as upright when the tilt is set back', () => {
    const p = front(); p[K.leftShoulder] = at(690, 386);
    const leaned = turned(p, 4, W, H), base = analyzeView(p, 'front', W, H), back = analyzeView(leaned, 'front', W, H, -4);
    for (const m of base.measures) expect(back.measures.find(q => q.key === m.key)!.value).toBeCloseTo(m.value!, 6);
    expect(value(analyzeView(leaned, 'front', W, H).measures, 'shoulderTilt')).not.toBeCloseTo(value(base.measures, 'shoulderTilt'), 1);
  });
  it('warns about a picture taken the wrong way, cut off, or with the elbows held out', () => {
    expect(viewWarnings(front(), 'side', W, H).join()).toMatch(/横向きの写真ではない/);
    expect(viewWarnings(side(), 'front', W, H).join()).toMatch(/正面を向いた写真ではない/);
    const cut = front(); cut[K.head] = at(600, 2);
    expect(viewWarnings(cut, 'front', W, H).join()).toMatch(/全身が写っていない/);
    const akimbo = front(); akimbo[K.leftElbow] = at(800, 520); akimbo[K.rightElbow] = at(400, 520);
    expect(viewWarnings(akimbo, 'front', W, H).join()).toMatch(/ひじが体から離れて/);
    expect(viewWarnings(front(), 'front', W, H)).toEqual([]);
    const away = front(); for (const k of [K.nose, K.leftEye, K.rightEye]) away[k] = at(away[k].x, away[k].y, .1);
    expect(viewWarnings(away, 'front', W, H).join()).toMatch(/後ろ向きの写真ではありませんか/);
  });
});

describe('posture findings', () => {
  const result = (view: 'front' | 'back' | 'side', measures: Partial<Record<string, number>>): ViewResult => ({ view, facing: null, warnings: [], points: [],
    measures: Object.entries(measures).map(([key, v]) => ({ key: key as Measure['key'], label: key, value: v!, text: '', level: levelOf(key as Measure['key'], v!) })) });
  it('tells the mean of the front and the back, and nothing when they point opposite ways', () => {
    const same = findingsOf({ front: result('front', { shoulderTilt: 2.4 }), back: result('back', { shoulderTilt: 3.6 }) });
    expect(same).toHaveLength(1); expect(same[0].value).toBeCloseTo(3, 9); expect(same[0].level).toBe(2); expect(same[0].views).toEqual(['front', 'back']);
    expect(findingsOf({ front: result('front', { shoulderTilt: 2.4 }), back: result('back', { shoulderTilt: -2.4 }) })).toEqual([]);
    // One out, the other within the other way: their mean is told only when it is out.
    expect(findingsOf({ front: result('front', { shoulderTilt: 2.4 }), back: result('back', { shoulderTilt: -.5 }) })).toEqual([]);
    expect(findingsOf({ front: result('front', { shoulderTilt: 4.6 }), back: result('back', { shoulderTilt: -.4 }) })[0].value).toBeCloseTo(2.1, 9);
  });
  it('keeps a value too near the guide\'s edge to call apart from the findings, on either side of the edge', () => {
    // The same side photo read in Safari and in Chrome: 10.4° and 9.7°, both near the head's edge (10°, ±1°).
    for (const headForward of [10.4, 9.73]) {
      const r = { side: result('side', { headForward, pelvisForward: 5.08, knee: -4.6, bodyLean: 2.85, trunkLean: -2.66 }) };
      expect(findingsOf(r)).toEqual([]);
      expect(nearEdgeOf(r).map(f => f.key)).toEqual(['headForward', 'knee', 'pelvisForward', 'bodyLean']);
    }
    expect(findingsOf({ side: result('side', { headForward: 11.1, knee: 7.8 }) }).map(f => f.key)).toEqual(['headForward']);
    expect(nearEdgeOf({ side: result('side', { headForward: 11.1, knee: 7.8 }) }).map(f => f.key)).toEqual(['knee']);
    expect(nearEdgeOf({ side: result('side', { headForward: 8.9 }) })).toEqual([]);
    // The front and the back's mean, as for the findings.
    const tilt = { front: result('front', { bodyAxis: -1.24, kneeLeft: 3.59 }), back: result('back', { bodyAxis: -1, kneeLeft: 4.13 }) };
    expect(findingsOf(tilt)).toEqual([]);
    expect(nearEdgeOf(tilt).map(f => [f.key, f.value.toFixed(2), f.views.join()])).toEqual([['bodyAxis', '-1.12', 'front,back'], ['kneeLeft', '3.86', 'front,back']]);
    expect(nearEdgeOf({ front: result('front', { shoulderTilt: 3.6 }), back: result('back', { shoulderTilt: -.4 }) })[0].value).toBeCloseTo(1.6, 9);
    expect(nearEdgeOf(tilt).map(nearText)).toEqual(['体幹の側方傾斜 右1.1°', '左膝 内反（O脚傾向）3.9°']);
    expect(nearText({ key: 'headTilt', level: 0, value: -1.87, views: ['front'] })).toBe('頭部の側方傾斜 右1.9°');
    expect(nearText({ key: 'headForward', level: 1, value: 10.4, views: ['side'] })).toBe('頭部 前方偏位10.4°');
    expect(nearText({ key: 'knee', level: 0, value: -4.6, views: ['side'] })).toBe('膝関節 過伸展4.6°');
  });
  it('tells the clearest first, the head forward and the knee pressed back before plain asymmetries, at most 4', () => {
    const f = findingsOf({ front: result('front', { shoulderTilt: 2, headTilt: 5, bodyAxis: 2, kneeLeft: 5 }), side: result('side', { headForward: 15, knee: -12, trunkLean: 5 }) });
    expect(f.map(x => x.key)).toEqual(['knee', 'headTilt', 'headForward', 'shoulderTilt']);
    expect(findingText(f[0]).title).toBe('膝関節が過伸展しています（反張膝の傾向）');
    expect(findingText({ key: 'shoulderTilt', level: 1, value: -2, views: ['front'] }).title).toBe('右肩が低めです（肩の高さの左右差）');
    expect(findingText({ key: 'kneeLeft', level: 1, value: 5, views: ['front'] }).title).toBe('左膝が内反しています（O脚傾向）');
    expect(Object.keys(MEASURE_GUIDE)).toHaveLength(11);
  });
  it('tells the head\'s tilt from the front only: from behind it is for reference', () => {
    const fromFront = analyzeView(front(), 'front', W, H).measures.find(m => m.key === 'headTilt')!;
    const fromBack = analyzeView(mirror(front()), 'back', W, H).measures.find(m => m.key === 'headTilt')!;
    expect(fromFront.reference).toBe(false); expect(fromBack.reference).toBe(true);
    const tilted = (view: 'front' | 'back', v: number): ViewResult => ({ view, facing: null, warnings: [], points: [],
      measures: [{ key: 'headTilt', label: '', value: v, text: '', level: levelOf('headTilt', v), reference: view === 'back' }] });
    expect(findingsOf({ front: tilted('front', 3), back: tilted('back', -5) }).map(f => [f.key, f.value, f.views])).toEqual([['headTilt', 3, ['front']]]);
    expect(findingsOf({ back: tilted('back', -5) })).toEqual([]);
  });
});

describe('posture photos: the phone\'s tilt from the photo\'s record', () => {
  /** An iPhone maker note (big-endian) holding only tag 8, the gravity, `before` bytes into a file. */
  function photoWith(gravity: number[], before = 300) {
    const note = new Uint8Array(56), v = new DataView(note.buffer);
    note.set([...'Apple iOS'].map(c => c.charCodeAt(0)), 0); v.setUint16(10, 1); note.set([0x4d, 0x4d], 12);
    v.setUint16(14, 1); v.setUint16(16, 8); v.setUint16(18, 10); v.setUint32(20, 3); v.setUint32(24, 32);
    gravity.forEach((g, j) => { v.setInt32(32 + 8 * j, Math.round(g * 10000)); v.setInt32(36 + 8 * j, 10000); });
    const file = new Uint8Array(before + note.length + 100); file.set(note, before);
    return file;
  }
  it('reads the gravity an iPhone recorded, and the roll and pitch from it', () => {
    // The user's front photo: the phone turned 0.6° and looking 6.6° down (its pitch put the horizon where it was).
    const g = appleGravity(photoWith([.0102, -.9826, -.1134]))!;
    expect(g.map(x => +x.toFixed(4))).toEqual([.0102, -.9826, -.1134]);
    const t = phoneTiltOf(g)!;
    expect(t.roll).toBeCloseTo(.591, 2); expect(t.pitch).toBeCloseTo(6.583, 2);
    expect(phoneTiltOf([-.0175, -.9998, 0])!.roll).toBeCloseTo(-1.003, 2);
    expect(phoneTiltOf([.99, .05, -.1])).toBeNull();   // held sideways
    expect(appleGravity(new Uint8Array(1000))).toBeNull();
  });
});

describe('posture camera: standing in the frame', () => {
  /** MediaPipe's 33 points of a person square to the camera, normalized; `h` tall from the top of the head, `cx` across,
   * the shoulders `spread` of the picture's width either side at 0.75 tall (wider when taller). */
  function pose(h = .8, cx = .5, wide = .1, nose = .9): Landmark[] {
    const top = .1, y = (f: number) => top + f * h, spread = wide * h / .75, p: Landmark[] = Array.from({ length: 33 }, () => ({ x: cx, y: y(.5), visibility: .9 }));
    const pair = (l: number, r: number, dx: number, f: number) => { p[l] = { x: cx + dx, y: y(f), visibility: .9 }; p[r] = { x: cx - dx, y: y(f), visibility: .9 }; };
    p[0] = { x: cx, y: y(.09), visibility: nose }; pair(2, 5, .02, .07); pair(7, 8, .04, .08);
    pair(11, 12, spread, .18); pair(23, 24, spread / 2, .5); pair(25, 26, spread / 2, .75); pair(27, 28, spread / 2, .96); pair(29, 30, spread / 2, .99); pair(31, 32, spread * .7, 1);
    return p;
  }
  const aspect = 9 / 16;   // a portrait camera
  it('finds the top of the head above the face and the feet', () => {
    const b = boxOf(pose())!;
    expect(b.top).toBeCloseTo(.1 + .8 * (.07 - .6 * (.18 - .07)), 6); expect(b.bottom).toBeCloseTo(.9, 6);
  });
  it('asks to come closer, step back, move to the middle, turn, or leave the picture to one person', () => {
    expect(fitOf([], 'front', aspect).message).toMatch(/全身が映るように/);
    expect(fitOf([pose(.5)], 'front', aspect).message).toBe('もう少し近づいてください。');
    expect(fitOf([pose(.9)], 'front', aspect).message).toMatch(/切れています|下がって/);
    expect(fitOf([pose(.75, .7)], 'front', aspect).message).toBe('枠のまん中に立ってください。');
    expect(fitOf([pose(.75, .5, .015)], 'front', aspect).message).toMatch(/カメラの方を向いて/);
    expect(fitOf([pose(.75, .5, .1, .2)], 'front', aspect).message).toMatch(/カメラの方を向いて/);   // no face: not the front
    expect(fitOf([pose(.75)], 'side', aspect).message).toMatch(/真横を向いて/);
    expect(fitOf([pose(.75, .5, .015)], 'side', aspect).ok).toBe(true);
    expect(fitOf([pose(.75, .5, .1, .2)], 'back', aspect).ok).toBe(true);
    expect(fitOf([pose(.75)], 'front', aspect).ok).toBe(true);
    expect(fitOf([pose(.3, .2), pose(.75)], 'front', aspect).ok).toBe(true);   // someone small far behind
    expect(fitOf([pose(.6, .3), pose(.75)], 'front', aspect).message).toBe('1人だけが映るようにしてください。');
  });
  it('is still only after the athlete has kept still for a while', () => {
    const s = new Stillness(), p = pose(.75);
    let still = false;
    for (let i = 0; i <= 20; i++) still = s.push(i / 30, p, .75, aspect);
    expect(still).toBe(true);
    const moved = pose(.75); moved[0] = { ...moved[0], y: moved[0].y + .03 };
    expect(s.push(21 / 30, moved, .75, aspect)).toBe(false);
    expect(new Stillness().push(0, p, .75, aspect)).toBe(false);
  });
  it('reads the phone\'s lean in the screen\'s plane from gravity, either sign the browser gives', () => {
    expect(tiltOf({ x: 0, y: 9.81, z: 0 })!.roll).toBeCloseTo(0, 9);
    expect(tiltOf({ x: 0, y: -9.81, z: 0 })!.roll).toBeCloseTo(0, 9);
    const a = 2 * Math.PI / 180;
    expect(Math.abs(tiltOf({ x: 9.81 * Math.sin(a), y: 9.81 * Math.cos(a), z: 0 })!.roll)).toBeCloseTo(2, 6);
    expect(Math.abs(tiltOf({ x: -9.81 * Math.sin(a), y: -9.81 * Math.cos(a), z: 0 })!.roll)).toBeCloseTo(2, 6);
    expect(tiltOf({ x: null, y: 9.81, z: 0 })).toBeNull();
  });
});
