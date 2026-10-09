/** The posture check (the user, 2026-10-08: 「次に姿勢解析のモードが欲しい。正面、横、後ろの写真をアップロードするか、
 * リアルタイムでスケルトンが表示されてぴったり収まったら勝手に解析が始まってフィードバックが出せる」): the standing
 * athlete seen from the front, the side and the back, measured as angles (no scale needed) from the keypoints.
 *
 * From the front and the back: the tilt of the ears' line (the head), the shoulders' line and the hips' line (reference:
 * the hip joints are found under the clothes, not the pelvis's bony points), the body's axis (the ankles' middle to the
 * shoulders' middle) and each knee off the line from the hip to the ankle (outward: the way of bow legs, inward: of
 * knock knees). From the side, along the plumb line of the ideal posture (Kendall: ear, shoulder, hip, just in front of
 * the knee and the ankle): the ear ahead of the shoulder (the head forward), the trunk's lean, the hip ahead of the ankle,
 * the knee bent or pressed back (hyperextension) and the whole body's lean.
 *
 * The guides are the app's own: round the ideal posture, as wide as the keypoints' error (a few degrees: the model's
 * points are not the skin markers of photo posture methods; app posture measures differ from 3D motion capture, Hopkins
 * 2019) and small asymmetries (the norm in young adults: Ferreira 2011). They mark what to look at again, not a fault. */
import { K, type Keypoint } from './keypoints';

export type View = 'front' | 'side' | 'back';
export const VIEWS: readonly View[] = ['front', 'side', 'back'];
export const VIEW_NAMES: Record<View, string> = { front: '正面', side: '横', back: '後ろ' };
/** 0: within the guide; 1: a little out; 2: clearly out. */
export type Level = 0 | 1 | 2;
export type FrontalKey = 'headTilt' | 'shoulderTilt' | 'pelvisTilt' | 'bodyAxis' | 'kneeLeft' | 'kneeRight';
export type SideKey = 'headForward' | 'trunkLean' | 'pelvisForward' | 'knee' | 'bodyLean';
export type MeasureKey = FrontalKey | SideKey;
export interface Measure {
  key: MeasureKey; label: string;
  /** Degrees, signed as the key's guide says; null when the keypoints were not seen well enough. */
  value: number | null;
  /** The value in words (the side, the way), e.g. 「右が低い 2.1°」. */
  text: string;
  level: Level | null;
  /** Shown, but not among the findings (the hips' line). */
  reference?: boolean;
}
export interface ViewResult {
  view: View; measures: Measure[];
  /** Side view: the way the athlete faces in the picture. */
  facing: 'left' | 'right' | null;
  /** What makes this picture less sure (the wrong view, the body cut off, arms away from the body, ...). */
  warnings: string[];
  /** The keypoints the measures were taken from: turned by the tilt set for the picture, the person's left and right
   * set from the view (front: the left on the picture's right; back: on its left). */
  points: Keypoint[];
}

/** Keypoints scored lower than this are not used. */
export const MIN_SCORE = .3;
/** Each measure's guide: where the ideal is, and how far from it is a little and clearly out (degrees). */
export const GUIDES: Record<MeasureKey, { ideal: number; slight: number; clear: number }> = {
  headTilt: { ideal: 0, slight: 2, clear: 4 }, shoulderTilt: { ideal: 0, slight: 1.5, clear: 3 }, pelvisTilt: { ideal: 0, slight: 1.5, clear: 3 },
  bodyAxis: { ideal: 0, slight: 1.5, clear: 3 }, kneeLeft: { ideal: 0, slight: 4, clear: 8 }, kneeRight: { ideal: 0, slight: 4, clear: 8 },
  // The ear over the shoulder; the hip just in front of the ankle, the ear a little more (Kendall's plumb line, just in front of the ankle).
  headForward: { ideal: 0, slight: 10, clear: 20 }, trunkLean: { ideal: 0, slight: 4, clear: 8 }, pelvisForward: { ideal: 2, slight: 3, clear: 6 },
  knee: { ideal: 0, slight: 5, clear: 10 }, bodyLean: { ideal: 1, slight: 2, clear: 4 },
};
/** A standing knee bent a little is usual; bent this much more than the guide's is out (pressed back keeps the guide). */
const KNEE_BENT = { slight: 8, clear: 15 };

export function levelOf(key: MeasureKey, value: number): Level {
  const g = GUIDES[key], off = value - g.ideal;
  const { slight, clear } = key === 'knee' && off > 0 ? KNEE_BENT : g;
  return Math.abs(off) >= clear ? 2 : Math.abs(off) >= slight ? 1 : 0;
}

const deg = (r: number) => r * 180 / Math.PI;
const mid = (a: Keypoint, b: Keypoint): Keypoint => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, score: Math.min(a.score, b.score) });
const seen = (...p: Keypoint[]) => p.every(q => q && q.score >= MIN_SCORE && Number.isFinite(q.x) && Number.isFinite(q.y));
const f1 = (v: number) => `${Math.abs(v).toFixed(1)}°`;
/** The line from the person's right point to the left one against level: positive when the left side is lower. */
function tilt(left: Keypoint, right: Keypoint) {
  const dx = Math.abs(left.x - right.x);
  return dx < 1 ? null : deg(Math.atan((left.y - right.y) / dx));
}
/** The line from a point below to one above against the vertical: positive toward the picture's right. */
const lean = (below: Keypoint, above: Keypoint) => deg(Math.atan2(above.x - below.x, below.y - above.y));
/** How far the knee is bent off the line from the hip to the ankle (degrees), and on which side of the line in the
 * picture (+1: right, -1: left). */
function bend(hip: Keypoint, knee: Keypoint, ankle: Keypoint) {
  const a = { x: hip.x - knee.x, y: hip.y - knee.y }, b = { x: ankle.x - knee.x, y: ankle.y - knee.y };
  const cos = (a.x * b.x + a.y * b.y) / (Math.hypot(a.x, a.y) * Math.hypot(b.x, b.y));
  const off = 180 - deg(Math.acos(Math.max(-1, Math.min(1, cos))));
  const u = (knee.y - hip.y) / (ankle.y - hip.y), lineX = hip.x + u * (ankle.x - hip.x);
  return { off, side: knee.x >= lineX ? 1 : -1 };
}

/** The points turned by `degrees` (clockwise on the screen) round the picture's centre: a picture whose camera leaned is
 * measured upright, as it is drawn turned. */
export function turned(points: readonly Keypoint[], degrees: number, width: number, height: number): Keypoint[] {
  if (!degrees) return points.map(p => ({ ...p }));
  const a = degrees * Math.PI / 180, c = Math.cos(a), s = Math.sin(a), cx = width / 2, cy = height / 2;
  return points.map(p => ({ x: cx + (p.x - cx) * c - (p.y - cy) * s, y: cy + (p.x - cx) * s + (p.y - cy) * c, score: p.score }));
}

/** Left and right of a front or back picture set by where they are (the model's own left and right may be crossed,
 * above all from behind): from the front the person's left is on the picture's right; from behind, on its left. */
export function sided(points: readonly Keypoint[], view: 'front' | 'back'): Keypoint[] {
  const out = points.map(p => ({ ...p }));
  for (const [l, r] of [[K.leftEye, K.rightEye], [K.leftEar, K.rightEar], [K.leftShoulder, K.rightShoulder], [K.leftElbow, K.rightElbow],
    [K.leftWrist, K.rightWrist], [K.leftHip, K.rightHip], [K.leftKnee, K.rightKnee], [K.leftAnkle, K.rightAnkle], [K.leftBigToe, K.rightBigToe],
    [K.leftSmallToe, K.rightSmallToe], [K.leftHeel, K.rightHeel]] as const) {
    const leftOnRight = out[l].x >= out[r].x;
    if (leftOnRight !== (view === 'front')) [out[l], out[r]] = [out[r], out[l]];
  }
  return out;
}

function measure(key: MeasureKey, label: string, value: number | null, words: (v: number) => string, reference = false): Measure {
  if (value === null || !Number.isFinite(value)) return { key, label, value: null, text: '測れません（点がはっきりしません）', level: null, reference };
  return { key, label, value, text: words(value), level: levelOf(key, value), reference };
}
const within = (key: MeasureKey, v: number) => levelOf(key, v) === 0;

/** The front or back picture's measures. Signs: tilts positive when the person's left side is lower; the axis positive
 * leaning to the person's left; knees positive outward (bow legs' way), negative inward (knock knees'). */
export function frontal(points: readonly Keypoint[], view: 'front' | 'back'): Measure[] {
  const p = sided(points, view), toLeft = view === 'front' ? 1 : -1;
  const lower = (key: MeasureKey, flat: string) => (v: number) => within(key, v) ? `${flat} ${f1(v)}` : `${v > 0 ? '左' : '右'}が低い ${f1(v)}`;
  // Anatomical words (the user, 2026-10-09: 「膝の外向きという表現が間違えている」「解剖学的に正しい表現にしてください」): the
  // knee off the hip–ankle line in the frontal plane is varus (内反, bow legs) or valgus (外反, knock knees), not where
  // the kneecap faces (its rotation).
  const ears = seen(p[K.leftEar], p[K.rightEar]) ? tilt(p[K.leftEar], p[K.rightEar])
    : seen(p[K.leftEye], p[K.rightEye]) ? tilt(p[K.leftEye], p[K.rightEye]) : null;
  const shoulders = seen(p[K.leftShoulder], p[K.rightShoulder]) ? tilt(p[K.leftShoulder], p[K.rightShoulder]) : null;
  const hips = seen(p[K.leftHip], p[K.rightHip]) ? tilt(p[K.leftHip], p[K.rightHip]) : null;
  const axis = seen(p[K.leftAnkle], p[K.rightAnkle], p[K.leftShoulder], p[K.rightShoulder])
    ? toLeft * lean(mid(p[K.leftAnkle], p[K.rightAnkle]), mid(p[K.leftShoulder], p[K.rightShoulder])) : null;
  const knee = (hip: number, k: number, ankle: number, outward: number) => {
    if (!seen(p[hip], p[k], p[ankle])) return null;
    const b = bend(p[hip], p[k], p[ankle]); return b.side * outward * b.off;
  };
  const way = (key: MeasureKey) => (v: number) => within(key, v) ? `ほぼ中間（まっすぐ） ${f1(v)}` : `${v > 0 ? '内反（O脚傾向）' : '外反（X脚傾向）'} ${f1(v)}`;
  return [
    // From behind the ears are often under the hair: the ear line moved 0.5-0.7° with the window and the browser on the
    // user's back photo (the front's, 0.2°), so the back's is shown for reference and the findings take the front's.
    measure('headTilt', '頭部の側方傾斜（両耳の線）', ears, v => within('headTilt', v) ? `ほぼ水平 ${f1(v)}` : `${v > 0 ? '左' : '右'}へ傾斜（${v > 0 ? '左' : '右'}耳が低い） ${f1(v)}`, view === 'back'),
    measure('shoulderTilt', '肩の高さの左右差（両肩関節の線）', shoulders, lower('shoulderTilt', 'ほぼ水平')),
    measure('pelvisTilt', '骨盤の側方傾斜（左右の股関節中心の線）', hips, lower('pelvisTilt', 'ほぼ水平'), true),
    measure('bodyAxis', '体幹の側方傾斜（両足関節の中点→両肩の中点）', axis, v => within('bodyAxis', v) ? `ほぼ鉛直 ${f1(v)}` : `${v > 0 ? '左' : '右'}へ傾斜 ${f1(v)}`),
    // The person's left knee outward is toward the person's left: the picture's right from the front.
    measure('kneeRight', '右膝の内反・外反（股関節・膝・足関節の並び）', knee(K.rightHip, K.rightKnee, K.rightAnkle, -toLeft), way('kneeRight')),
    measure('kneeLeft', '左膝の内反・外反（股関節・膝・足関節の並び）', knee(K.leftHip, K.leftKnee, K.leftAnkle, toLeft), way('kneeLeft')),
  ];
}

/** The way a side picture's athlete faces: the nose ahead of the ears, the toes ahead of the heels. */
export function facingOf(p: readonly Keypoint[]): 'left' | 'right' | null {
  let vote = 0;
  const ears = [p[K.leftEar], p[K.rightEar]].filter(q => seen(q));
  if (seen(p[K.nose]) && ears.length) vote += Math.sign(p[K.nose].x - ears.reduce((t, q) => t + q.x, 0) / ears.length);
  for (const [toe, heel] of [[K.leftBigToe, K.leftHeel], [K.rightBigToe, K.rightHeel]] as const)
    if (seen(p[toe], p[heel])) vote += .5 * Math.sign(p[toe].x - p[heel].x);
  return vote > 0 ? 'right' : vote < 0 ? 'left' : null;
}

/** The side picture's points on the side nearer the camera (facing right, the right side; the far side's where the
 * near one was not seen): ear, shoulder, hip, knee, ankle. */
export function sidePoints(points: readonly Keypoint[], facing: 'left' | 'right' | null) {
  const pick = (left: number, right: number) => {
    const [a, b] = facing === 'left' ? [points[left], points[right]] : [points[right], points[left]];
    return seen(a) ? a : b;
  };
  return { ear: pick(K.leftEar, K.rightEar), shoulder: pick(K.leftShoulder, K.rightShoulder), hip: pick(K.leftHip, K.rightHip),
    knee: pick(K.leftKnee, K.rightKnee), ankle: pick(K.leftAnkle, K.rightAnkle) };
}

/** The side picture's measures, on the side nearer the camera, forward positive: the ear ahead of the shoulder, the
 * trunk leaning forward, the hip ahead of the ankle, the knee bent (pressed back: negative), the ear ahead of the ankle. */
export function sagittal(points: readonly Keypoint[]): { facing: 'left' | 'right' | null; measures: Measure[] } {
  const facing = facingOf(points), d = facing === 'left' ? -1 : 1;
  const { ear, shoulder, hip, knee, ankle } = sidePoints(points, facing);
  const ok = (...q: Keypoint[]) => facing !== null && seen(...q);
  const fwd = (key: MeasureKey, flat: string, ahead: string, behind: string) => (v: number) => within(key, v) ? `${flat} ${f1(v)}` : `${v - GUIDES[key].ideal > 0 ? ahead : behind} ${f1(v)}`;
  const kneeValue = ok(hip, knee, ankle) ? (() => { const b = bend(hip, knee, ankle); return b.side * d * b.off; })() : null;
  return { facing, measures: [
    // The trunk's line leaning back is not the low back arched (lumbar extension, 「反る」): in sway-back the thorax is
    // behind and the lumbar curve often flatter. The hip ahead of the ankle is the pelvis displaced forward, not tilted
    // forward (anterior pelvic tilt cannot be seen from these points).
    measure('headForward', '頭部の前方偏位（肩関節→耳の線）', ok(shoulder, ear) ? d * lean(shoulder, ear) : null, fwd('headForward', '耳が肩のほぼ真上', '前方偏位（頭部前方位）', '後方偏位')),
    measure('trunkLean', '体幹の前傾・後傾（股関節→肩関節の線）', ok(hip, shoulder) ? d * lean(hip, shoulder) : null, fwd('trunkLean', 'ほぼ鉛直', '前傾', '後傾')),
    measure('pelvisForward', '骨盤の前後の偏位（足関節→股関節の線）', ok(ankle, hip) ? d * lean(ankle, hip) : null, fwd('pelvisForward', 'ほぼ足関節の上', '前方偏位', '後方偏位')),
    measure('knee', '膝関節の屈曲・過伸展（股関節・膝・足関節の並び）', kneeValue, v => within('knee', v) ? `ほぼ伸展位 ${f1(v)}` : v > 0 ? `屈曲 ${f1(v)}` : `過伸展（反張膝の傾向） ${f1(v)}`),
    measure('bodyLean', '全身の前傾・後傾（足関節→耳の線）', ok(ankle, ear) ? d * lean(ankle, ear) : null, fwd('bodyLean', 'ほぼ鉛直', '前傾', '後傾')),
  ] };
}

/** The athlete's height in the picture (pixels): the top of the head to the lower of the heels (or ankles). */
export function bodyHeight(p: readonly Keypoint[]) {
  const top = seen(p[K.head]) ? p[K.head].y : Math.min(...[K.nose, K.leftEye, K.rightEye, K.leftEar, K.rightEar].filter(k => seen(p[k])).map(k => p[k].y));
  const feet = [K.leftHeel, K.rightHeel, K.leftAnkle, K.rightAnkle, K.leftBigToe, K.rightBigToe].filter(k => seen(p[k])).map(k => p[k].y);
  return feet.length && Number.isFinite(top) ? Math.max(...feet) - top : null;
}

/** What makes the picture less sure for its view. `width`, `height`: the picture's. */
export function viewWarnings(p: readonly Keypoint[], view: View, width: number, height: number): string[] {
  const out: string[] = [], tall = bodyHeight(p);
  const top = p[K.head], feet = [p[K.leftHeel], p[K.rightHeel], p[K.leftAnkle], p[K.rightAnkle]].filter(q => seen(q));
  const edge = p.some(q => seen(q) && (q.x < width * .005 || q.x > width * .995));
  if (tall === null || !seen(top) || top.y < height * .005 || !feet.length || feet.some(q => q.y > height * .995) || edge)
    out.push('頭から足先まで全身が写っていないようです。全身が入るように撮ると正確になります。');
  else if (tall < height * .4) out.push('体が小さく写っています。もう少し近づくか、ズームして体を大きく写すと正確になります。');
  if (tall && seen(p[K.leftShoulder], p[K.rightShoulder])) {
    const spread = Math.abs(p[K.leftShoulder].x - p[K.rightShoulder].x) / tall;
    if (view === 'side' && spread > .1) out.push('横向きの写真ではないようです（両肩が左右に離れて写っています）。真横から撮ると正確になります。');
    if (view !== 'side' && spread < .12) out.push(`${VIEW_NAMES[view]}を向いた写真ではないようです（両肩が重なって写っています）。`);
  }
  if (view !== 'side') {
    const face = (p[K.nose].score + p[K.leftEye].score + p[K.rightEye].score) / 3;
    if (view === 'front' && face < .3) out.push('顔が写っていないようです。後ろ向きの写真ではありませんか。');
    if (view === 'back' && face > .75) out.push('顔が写っているようです。正面の写真ではありませんか。');
    // Elbows held away from the body (hands on the hips) lift and pull the shoulders: the arms hang for the check.
    if (tall && [[K.leftElbow, K.leftShoulder], [K.rightElbow, K.rightShoulder]].some(([e, s]) => seen(p[e], p[s])
      && Math.abs(p[e].x - p[s].x) > tall * .07 && Math.abs(p[e].x - (p[K.leftShoulder].x + p[K.rightShoulder].x) / 2) > Math.abs(p[s].x - (p[K.leftShoulder].x + p[K.rightShoulder].x) / 2)))
      out.push('ひじが体から離れています。腕は体の横に自然に下ろして撮ると、肩の高さが正確になります。');
  }
  return out;
}

/** One picture's result. `tilt`: the turn set for the picture (degrees, clockwise), 0 as taken. */
export function analyzeView(points: readonly Keypoint[], view: View, width: number, height: number, tilt = 0): ViewResult {
  const upright = turned(points, tilt, width, height);
  if (view === 'side') {
    const s = sagittal(upright), warnings = viewWarnings(upright, view, width, height);
    if (!s.facing) warnings.push('体の向き（右向きか左向きか）がわかりませんでした。顔と足先が写るように真横から撮ってください。');
    return { view, measures: s.measures, facing: s.facing, warnings, points: upright };
  }
  const p = sided(upright, view);
  return { view, measures: frontal(upright, view), facing: null, warnings: viewWarnings(p, view, width, height), points: p };
}

export interface Finding {
  key: MeasureKey; level: Level; value: number;
  /** Where it was seen. */
  views: View[];
}
/** In the order the findings are told: what research ties to complaints first (the head forward: neck pain in adults,
 * Mahmoud 2019; the knee pressed back: ACL injuries in female athletes, Loudon 1996), then the plain asymmetries. */
const ORDER: MeasureKey[] = ['headForward', 'knee', 'shoulderTilt', 'bodyAxis', 'pelvisForward', 'trunkLean', 'bodyLean', 'kneeLeft', 'kneeRight', 'headTilt'];

/** How near the guide's edge a value is too close to call, either side (degrees): about the reading's own spread. The
 * same photos read in Safari (HEIC) and in Chrome (JPEG) differed by up to 0.4°, the head from the side by 0.7° (its
 * ear is often under the hair); a still pose read frame to frame spread 0.2–0.7° (SD). */
export const nearOf = (key: MeasureKey) => key === 'headForward' ? 1 : .5;
/** How far a value is past the guide's edge (degrees; negative inside the guide). */
export function pastEdge(key: MeasureKey, value: number) {
  const g = GUIDES[key], off = value - g.ideal;
  return Math.abs(off) - (key === 'knee' && off > 0 ? KNEE_BENT : g).slight;
}
export const nearEdge = (key: MeasureKey, value: number) => Math.abs(pastEdge(key, value)) < nearOf(key);

/** Each measure as told, in ORDER. The front and the back measure the same tilts: when both were taken, their mean is
 * told, and nothing when both are out of the guide opposite ways (it is not clear which way it is). */
function told(results: Partial<Record<View, ViewResult>>): Finding[] {
  const out: Finding[] = [];
  for (const key of ORDER) {
    const values = VIEWS.flatMap(view => {
      const m = results[view]?.measures.find(q => q.key === key);
      return m && m.value !== null && !m.reference ? [{ view, value: m.value, level: m.level! }] : [];
    });
    if (!values.length) continue;
    const marked = values.filter(v => v.level > 0), ways = new Set(marked.map(v => Math.sign(v.value - GUIDES[key].ideal)));
    if (values.length > 1 && marked.length === values.length && ways.size > 1) continue;
    const value = values.reduce((t, v) => t + v.value, 0) / values.length;
    out.push({ key, level: levelOf(key, value), value, views: values.map(v => v.view) });
  }
  return out;
}
/** What is worth telling, at most `max`, clearest first: out of the guide by more than the reading's spread. */
export function findingsOf(results: Partial<Record<View, ViewResult>>, max = 4): Finding[] {
  return told(results).filter(f => pastEdge(f.key, f.value) >= nearOf(f.key))
    .sort((a, b) => b.level - a.level || ORDER.indexOf(a.key) - ORDER.indexOf(b.key)).slice(0, max);
}
/** What is too near the guide's edge to call either way (a retake or another browser may put it on the other side). */
export const nearEdgeOf = (results: Partial<Record<View, ViewResult>>) => told(results).filter(f => nearEdge(f.key, f.value));
