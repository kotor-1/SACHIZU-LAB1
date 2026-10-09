import { hinge, type Exercise, type Rep, type StrengthResult } from './analysis';

/** General guides for the BODYWEIGHT squat and RDL (two legs, one leg), to read a set by; not targets for one athlete
 * (the user, 2026-10-08: 「バーベルじゃなくて自体重のエクササイズ想定」). Angles of joints are the app's (180 =
 * straight). Sources (docs/Strength_Form_v1_20261008.md; literature reviews of 2026-10-08):
 * - Squat, how it is judged without load: Myer et al. 2014 (Strength Cond J 36) and the FMS deep squat (score 3: trunk
 *   parallel to the shank or more upright, thigh below level, heels down; Butler et al. 2010, Heredia et al. 2021: those
 *   scoring 3 reach more hip, knee and ankle bend). Coaching criteria: weak as injury predictors (Moore et al. 2019,
 *   Sports Med). Bodyweight squats, young adults: Kasahara et al. 2024 (J Hum Kinet; parallel squat, arms crossed: knee
 *   bend 107 ± 11° = knee angle ~73° here, hip 83 ± 6°, trunk 35 ± 12°, ankle 33 ± 6°); Ota et al. 2020 (Gait Posture
 *   80); Graber et al. 2023 (Phys Ther Sport 61; arms forward: trunk 23-38°, shank 24-36°).
 * - Depth: a bodyweight squat stopping short is mostly the ankle (Kim et al. 2015, J Hum Kinet 45: ankle and hip range
 *   explained 32-44% of depth; Dill et al. 2014, J Athl Train 49: limited lunge test, knee bend 97 vs 113°). Loaded
 *   training reached deeper with more effect (Bloomquist et al. 2013; Kubo et al. 2019; Pallarés et al. 2020, 2021).
 *   The keypoints read the thigh a few degrees apart from one model to the other (MediaPipe against RTMPose: -9 to +7°
 *   on the test videos): a squat is told shallow only from `shallow` (-10°, clearly above level).
 * - Trunk against shank: more trunk lean, more hip work; more shank lean, more knee (Graber et al. 2023, bodyweight:
 *   +0.020 and -0.030 in the hip/knee moment ratio a degree; with trunk = shank still knee-biased); Straub et al. 2021,
 *   Barrack et al. 2021 (loaded). The FMS and Myer ask the trunk parallel to the shank or more upright; told past +10°
 *   (this app's margin for the points' error). Knees past the toes are no fault (Fry et al. 2003; Illmeier et al. 2023).
 * - Arms: held in front, the knees bent more (Glave et al. 2012) and the hips worked more (Lynn & Noffal 2012): the
 *   same arms every time.
 * - Heels down: Myer et al. 2014 (coaching). The keypoints' heel and toe read 10-13° of "rise" with the heels down (test
 *   videos): only a clear rise (onto the toes) is told, from 20°.
 * - Form drifting over the set: Hooper et al. 2014 (J Strength Cond Res 28). The 10° is this app's.
 * - Hip hinge on two legs: the "waiter's bow" (Luomajoki et al. 2007, BMC Musculoskelet Disord 8: 50-70° of hip bend
 *   with the low back still is correct, under 50° not); untrained adults after one lesson, hip bend 81 → 105° (Hanney et
 *   al. 2026, J Funct Morphol Kinesiol; knee and ankle unchanged; no agreed angles for a correct hinge); loaded RDLs
 *   (Lee et al. 2018: knee bend 34 ± 13°, hip 80 ± 16°, shank about vertical); NSCA (knees slightly bent and kept so).
 *   Here: trunk at least 50° at the bottom, hip 75-100°, knee 145-170°, the knee bending no more than 20°.
 * - Single-leg RDL: study protocols, not measured norms: the standing knee bent ~15° (10-20°) and held, the trunk
 *   toward level, the free leg level and in line with the trunk (Mo et al. 2023, Front Physiol 14; Kim et al. 2026, Sci
 *   Rep; Askling et al. 2014, Br J Sports Med 48: the "Diver", knee 10-20°, in the protocol that shortened sprinters'
 *   return after hamstring injury). Bodyweight, gluteus maximus ~59% of its maximum (Distefano et al. 2009, JOSPT 39).
 *   The line from 160° is this app's (coaching consensus). */
export const STRENGTH_GUIDE = {
  squat: { level: 0, shallow: -10, beep: -5, knee: [60, 85], trunkShank: 10, heel: 20, drift: 10 },
  rdl: { trunk: 50, hip: [75, 100], knee: [145, 170], kneeChange: 20, shank: 15 },
  slrdl: { trunk: [70, 90], line: 160, knee: [160, 170], kneeChange: 20, shank: 15 },
};
const G = STRENGTH_GUIDE, S = G.squat, R = G.rdl, L = G.slrdl;
/** Another exercise taken for this one: a hinge with the trunk under hingeTrunk and the knee under hingeKnee at the
 * bottom (a tuck jump chosen as a single-leg RDL: 36° and 45°), a squat with the knee over squatKnee and the trunk over
 * squatTrunk. */
const MISMATCH = { hingeTrunk: 45, hingeKnee: 110, squatKnee: 130, squatTrunk: 55 };
/** The leg (hip to ankle) under this many pixels: small (a single-leg RDL filmed wide, its leg ~100 px in the camera's
 * 960 x 540 recording, read its trunk-leg line 50° off; the same athlete in the 4K video, 410 px, read right). The
 * test videos read right had 250-850 px. */
const SMALL = 150;
/** Shoulders spread more than this against the trunk: not quite from the side (about 30°; no result past FRONT_VIEW). */
export const VIEW_LIMIT = .35;
export interface StrengthAdvice { topic: string; level: 'good' | 'check' | 'info'; text: string }

const round = (v: number) => Math.round(v);
const signed = (v: number) => `${v > 0 ? '+' : ''}${round(v)}`;
const known = (v: (number | null)[]) => v.filter((x): x is number => x !== null);
const span = (v: number[], f: (x: number) => string = x => String(round(x))) => !v.length ? '—'
  : round(Math.min(...v)) === round(Math.max(...v)) ? f(v[0]) : `${f(Math.min(...v))}〜${f(Math.max(...v))}`;
export const trunkShank = (r: Rep) => r.low.trunk === null || r.low.shank === null ? null : r.low.trunk - r.low.shank;
/** How much more the knee bent from standing to the bottom (degrees, more bent positive). */
export const kneeBend = (r: Rep) => r.low.knee === null || r.top.knee === null ? null : r.top.knee - r.low.knee;
/** The squat's work sharing read from the trunk against the shank. */
export const emphasis = (v: number) => v > S.trunkShank ? '股関節（お尻）寄り' : v < -S.trunkShank ? '膝（太もも前）寄り' : 'バランス型';
/** The hinges' limits for the knee. */
const H = (e: Exercise) => e === 'slrdl' ? L : R;

export interface Column { key: string; label: string; short: string; unit: string; digits: number; value: (r: Rep) => number | null;
  format?: (v: number) => string; flag?: (r: Rep) => boolean; band?: [number, number]; chart?: boolean }
const TEMPO: Column[] = [
  { key: 'down', label: '下ろす時間', short: '下ろす', unit: '秒', digits: 2, value: r => r.down },
  { key: 'up', label: '上げる時間', short: '上げる', unit: '秒', digits: 2, value: r => r.up },
  { key: 'total', label: '1回の時間', short: '1回', unit: '秒', digits: 2, value: r => r.down + r.up }];
const kneeColumns = (e: Exercise): Column[] => [
  { key: 'knee', label: `膝の角度（${e === 'slrdl' ? '軸脚、' : ''}最も倒した所、180°＝伸びた状態）`, short: '膝', unit: '°', digits: 0, value: r => r.low.knee, band: [H(e).knee[0], H(e).knee[1]] },
  { key: 'bend', label: '膝の曲がりの増え（立った姿勢→最も倒した所）', short: '膝の増え', unit: '°', digits: 0, value: kneeBend, format: signed, flag: r => (kneeBend(r) ?? 0) > H(e).kneeChange, band: [0, H(e).kneeChange] }];
const FORM: Record<Exercise, Column[]> = {
  squat: [
    { key: 'thigh', label: '深さ（太ももの水平からの角度、下が＋）', short: '深さ', unit: '°', digits: 0, value: r => r.low.thigh, format: signed, flag: r => (r.low.thigh ?? 0) < S.shallow, band: [S.level, 30] },
    { key: 'knee', label: '膝の角度（最も深い所、180°＝伸びた状態）', short: '膝', unit: '°', digits: 0, value: r => r.low.knee, band: [S.knee[0], S.knee[1]] },
    { key: 'ts', label: '体幹−脛（最も深い所、体幹が大きいと＋）', short: '体幹−脛', unit: '°', digits: 0, value: trunkShank, format: signed, band: [-S.trunkShank, S.trunkShank] },
    { key: 'trunk', label: '体幹の前傾（最も深い所）', short: '体幹', unit: '°', digits: 0, value: r => r.low.trunk },
    { key: 'shank', label: '脛の前傾（最も深い所）', short: '脛', unit: '°', digits: 0, value: r => r.low.shank },
    { key: 'heel', label: 'かかとの浮き（足の傾きの増え、15°未満は点のぶれの範囲）', short: 'かかと', unit: '°', digits: 0, value: r => r.heelRise, flag: r => (r.heelRise ?? 0) > S.heel }],
  rdl: [
    { key: 'hip', label: '股関節の角度（最も倒した所、180°＝伸びた状態）', short: '股関節', unit: '°', digits: 0, value: r => r.low.hip, band: [R.hip[0], R.hip[1]] },
    ...kneeColumns('rdl'),
    { key: 'trunk', label: '体幹の前傾（最も倒した所、90°＝床と平行）', short: '体幹', unit: '°', digits: 0, value: r => r.low.trunk },
    { key: 'shank', label: '脛の前傾（最も倒した所）', short: '脛', unit: '°', digits: 0, value: r => r.low.shank, flag: r => (r.low.shank ?? 0) > R.shank, band: [0, R.shank] }],
  slrdl: [
    { key: 'line', label: '体幹と浮かせた脚の一直線（肩−股関節−足首、180°＝一直線）', short: '一直線', unit: '°', digits: 0, value: r => r.low.line, flag: r => (r.low.line ?? 180) < L.line, band: [L.line, 180] },
    { key: 'trunk', label: '体幹の前傾（最も倒した所、90°＝床と平行）', short: '体幹', unit: '°', digits: 0, value: r => r.low.trunk },
    ...kneeColumns('slrdl'),
    { key: 'hip', label: '軸脚の股関節の角度（最も倒した所）', short: '股関節', unit: '°', digits: 0, value: r => r.low.hip },
    { key: 'shank', label: '軸脚の脛の前傾（最も倒した所）', short: '脛', unit: '°', digits: 0, value: r => r.low.shank, flag: r => (r.low.shank ?? 0) > L.shank, band: [0, L.shank] }],
};
export const columnsOf = (exercise: Exercise, table: 'form' | 'tempo') => table === 'form' ? FORM[exercise] : TEMPO;

/** The few numbers on top. */
export function summaryOf(r: StrengthResult): { label: string; value: string; unit: string; note?: string }[] {
  const reps = r.reps, count = { label: '回数', value: String(reps.length), unit: '回' };
  const knees = { label: '膝の角度', value: span(known(reps.map(x => x.low.knee))), unit: '°', note: r.exercise === 'squat' ? '最も深い所' : '最も倒した所' };
  if (r.exercise === 'squat') {
    const ts = known(reps.map(trunkShank)), mid = ts.length ? [...ts].sort((a, b) => a - b)[ts.length >> 1] : null;
    return [count, { label: '深さ（太もも）', value: span(known(reps.map(x => x.low.thigh)), signed), unit: '°', note: '0°＝水平、＋は水平より下' },
      { label: '体幹−脛', value: span(ts, signed), unit: '°', note: mid === null ? undefined : emphasis(mid) }, knees];
  }
  if (r.exercise === 'slrdl') return [count, { label: '体幹と脚の一直線', value: span(known(reps.map(x => x.low.line))), unit: '°', note: '180°＝一直線' },
    { label: '体幹の前傾', value: span(known(reps.map(x => x.low.trunk))), unit: '°', note: '90°＝床と平行' }, { ...knees, label: '軸脚の膝の角度' }];
  return [count, { label: '股関節の角度', value: span(known(reps.map(x => x.low.hip))), unit: '°', note: '最も倒した所' }, knees,
    { label: '膝の曲がりの増え', value: span(known(reps.map(kneeBend)), signed), unit: '°', note: '立った姿勢→最も倒した所' }];
}

/** What the set shows, a line each. */
export function strengthAdvice(r: StrengthResult): StrengthAdvice[] {
  const out: StrengthAdvice[] = [], reps = r.reps, n = reps.length, e = r.exercise;
  const which = (f: (x: Rep) => boolean) => reps.filter(f).map(x => x.index).join('・');
  if (r.view !== null && r.view > VIEW_LIMIT) out.push({ topic: '撮り方', level: 'check', text: '真横から撮れていない可能性があります（肩が左右に開いて映っています）。斜めから撮ると角度が実際と変わります。' });
  if (r.size !== null && r.size < SMALL) out.push({ topic: '撮り方', level: 'check', text: '選手が画面に小さく映っています。骨格の点がずれやすくなるため、頭から足先までが画面の高さの半分以上になるよう近づいて撮るか、解像度を上げて撮ると、角度が安定します。' });
  // The other exercise filmed (or a jump): the hinge hardly leaning with the knees bent deep, the squat's knees straight.
  const mid = (f: (x: Rep) => number | null) => { const v = known(reps.map(f)).sort((a, b) => a - b); return v.length ? v[v.length >> 1] : null; };
  const trunk = mid(x => x.low.trunk), knee = mid(x => x.low.knee);
  if (hinge(e) && trunk !== null && knee !== null && trunk < MISMATCH.hingeTrunk && knee < MISMATCH.hingeKnee)
    out.push({ topic: '種目', level: 'check', text: `上体があまり倒れず（${round(trunk)}°）、膝が大きく曲がっています（${round(knee)}°）。スクワットやジャンプの動画ではありませんか？種目の選び方を確かめてください。` });
  if (e === 'squat' && trunk !== null && knee !== null && knee > MISMATCH.squatKnee && trunk > MISMATCH.squatTrunk)
    out.push({ topic: '種目', level: 'check', text: `膝がほとんど曲がらず（${round(knee)}°）、上体が大きく倒れています（${round(trunk)}°）。RDLの動画ではありませんか？種目の選び方を確かめてください。` });
  if (e === 'squat') {
    const thighs = known(reps.map(x => x.low.thigh));
    if (thighs.length) {
      const shallow = (x: Rep) => x.low.thigh !== null && x.low.thigh < S.shallow, low = Math.min(...thighs);
      out.push(reps.some(shallow) ? { topic: '深さ', level: 'check', text: `太ももが水平まで届かなかった回：${which(shallow)}回目（最も浅い ${signed(low)}°）。重りなしのスクワットの評価（FMS・Myer）では、太ももが水平かそれより下まで下がるかを見ます。かかとを着けたまま下がれないときは、足首の硬さが原因のことが多いです。重りを持つ練習でも、深いスクワットの方が筋力や跳躍の伸びが大きかった研究があります。` }
        : low >= S.level ? { topic: '深さ', level: 'good', text: `全${n}回、太ももが水平かそれより深くまで下がっています（${span(thighs, signed)}°）。` }
        : { topic: '深さ', level: 'good', text: `全${n}回、太ももがほぼ水平まで下がっています（${span(thighs, signed)}°。骨格の点による角度は数度ずれることがあり、${S.shallow}°より浅いときだけ知らせます）。` });
    }
    const ts = known(reps.map(trunkShank));
    if (ts.length) {
      const mid = [...ts].sort((a, b) => a - b)[ts.length >> 1];
      out.push(mid > S.trunkShank ? { topic: '体幹と脛', level: 'check', text: `最も深い所で、体幹が脛より ${signed(mid)}° 前に倒れています（回の中央値）。重りなしのスクワットの評価（FMS・Myer）では、体幹が脛と平行かそれより起きていることを目安にします。体幹が倒れるほどお尻・もも裏と腰が多く働き、太もも前の働きが減ります。足首が硬く膝を前に出せないと、上体で釣り合いを取って倒れやすくなります。膝がつま先より前に出ることは問題ありません。` }
        : { topic: '体幹と脛', level: 'good', text: `最も深い所で、体幹は脛と平行かそれより起きています（体幹−脛 ${signed(mid)}°、回の中央値）。体幹が倒れるほどお尻・もも裏、起きるほど太もも前が多く働きます。` });
    }
    const heels = known(reps.map(x => x.heelRise)), up = (x: Rep) => (x.heelRise ?? 0) > S.heel;
    if (heels.length && r.refined) out.push(reps.some(up) ? { topic: 'かかと', level: 'check', text: `かかとが浮いた回：${which(up)}回目。足裏全体で床を踏んだまま下りられる深さ・足幅を確かめましょう（足首が硬いと浮きやすくなります）。` }
      : { topic: 'かかと', level: 'good', text: 'かかとが大きく浮いた回はありません（つま先立ちになるほどの浮きを見ています）。' });
    drift(out, reps, x => x.low.thigh, '深さ');
    drift(out, reps, x => x.low.trunk, '体幹の前傾');
  } else {
    const lim = H(e);
    if (e === 'slrdl') {
      const lines = known(reps.map(x => x.low.line)), bent = (x: Rep) => (x.low.line ?? 180) < L.line;
      const low = reps.filter(x => bent(x) && x.low.legBelow === true).length, high = reps.filter(x => bent(x) && x.low.legBelow === false).length;
      if (lines.length) out.push(reps.some(bent) ? { topic: '体幹と脚の一直線', level: 'check', text: `最も倒した所で、肩・股関節・浮かせた足首が一直線から外れた回：${which(bent)}回目（${span(lines)}°、180°が一直線）。${low >= high
        ? '浮かせた脚が体幹の線より下がっています。上体を倒すのと同じだけ、脚を後ろへ伸ばして上げます。'
        : '浮かせた脚が体幹の線より上がっています。脚を上げすぎると腰が反ったり、骨盤が開いたりしやすくなります。'}上体と浮かせた脚を1本の板のようにして、股関節を軸に倒します。` }
        : { topic: '体幹と脚の一直線', level: 'good', text: `最も倒した所で、体幹と浮かせた脚がほぼ一直線です（${span(lines)}°）。` });
      const trunks = known(reps.map(x => x.low.trunk));
      if (trunks.length) out.push({ topic: '倒す深さ', level: 'info', text: `最も倒した所の上体の前傾 ${span(trunks)}°（90°で床と平行。研究の手順では上体をできるだけ床と平行に近づけます：${L.trunk[0]}〜${L.trunk[1]}°が目安）。` });
    } else {
      const hips = known(reps.map(x => x.low.hip)), trunks = known(reps.map(x => x.low.trunk)), upright = (x: Rep) => (x.low.trunk ?? 90) < R.trunk;
      if (trunks.length && reps.some(upright)) out.push({ topic: '股関節の曲げ', level: 'check', text: `最も倒した所で上体の倒れが${R.trunk}°に届かなかった回：${which(upright)}回目（${span(trunks)}°）。股関節から曲げる動きの評価（ウェイターズボウ）では、背中をまっすぐ保ったまま${R.trunk}°以上倒せるかを見ます。お尻を後ろへ引いて倒しましょう。` });
      else if (hips.length) out.push({ topic: '股関節の曲げ', level: 'good', text: `最も倒した所で上体は${span(trunks)}°倒れ、股関節の角度は ${span(hips)}°です（参考：指導を受けた大人で約${R.hip[0]}〜${R.hip[1]}°）。どこまで倒すかは、もも裏の柔らかさと背中をまっすぐ保てるかで決まります。背中が丸まる手前までにしましょう。` });
    }
    const knees = known(reps.map(x => x.low.knee)), bends = known(reps.map(kneeBend)), bent = (x: Rep) => (kneeBend(x) ?? 0) > lim.kneeChange;
    if (knees.length) out.push(reps.some(bent) ? { topic: e === 'slrdl' ? '軸脚の膝' : '膝', level: 'check', text: `下ろす間に膝が ${lim.kneeChange}°以上曲がった回：${which(bent)}回目（最大 ${signed(Math.max(...bends))}°）。膝の角度は始めのまま（軽く曲げて固定）、お尻を後ろへ引いて上体を倒します。膝が曲がり続けるとスクワットに近づきます。` }
      : { topic: e === 'slrdl' ? '軸脚の膝' : '膝', level: 'good', text: `膝の角度は最も倒した所で ${span(knees)}°、下ろす間の曲がりの増えは ${bends.length ? span(bends, signed) : '—'}°で、股関節から曲げられています（参考：${e === 'slrdl' ? `研究の手順では軸脚の膝を10〜20°曲げて保つ＝膝の角度${L.knee[0]}〜${L.knee[1]}°` : `膝の角度${R.knee[0]}〜${R.knee[1]}°`}）。` });
    const shin = (x: Rep) => (x.low.shank ?? 0) > lim.shank;
    if (reps.some(shin)) out.push({ topic: '脛', level: 'check', text: `最も倒した所で脛が前に ${lim.shank}°以上傾いた回：${which(shin)}回目。脛はほぼ垂直のまま、お尻を後ろへ引きます。` });
    out.push({ topic: '背中', level: 'info', text: '背中の丸まりは骨格の点からは測れません。「姿勢」の画像で、腰から肩までがまっすぐか確かめてください。' });
    drift(out, reps, x => x.low.knee, '膝の角度');
  }
  const downs = reps.map(x => x.down), ups = reps.map(x => x.up);
  if (n) out.push({ topic: 'テンポ', level: 'info', text: `下ろす ${(downs.reduce((s, x) => s + x, 0) / n).toFixed(1)}秒・上げる ${(ups.reduce((s, x) => s + x, 0) / n).toFixed(1)}秒（${n}回の平均）。回ごとの時間は「回ごと」の「テンポ」で見られます。` });
  return out;
}
/** A value changing from the first reps to the last ones by more than the drift limit (tiring changes form). */
function drift(out: StrengthAdvice[], reps: Rep[], value: (r: Rep) => number | null, name: string) {
  const v = reps.map(value);
  if (reps.length < 4 || v.some(x => x === null)) return;
  const k = Math.max(1, Math.floor(reps.length / 3)), first = known(v.slice(0, k)), last = known(v.slice(-k));
  const change = last.reduce((s, x) => s + x, 0) / last.length - first.reduce((s, x) => s + x, 0) / first.length;
  if (Math.abs(change) > S.drift) out.push({ topic: 'セットの後半', level: 'check', text: `${name}が最初の${k}回と最後の${k}回で ${signed(change)}° 変わりました。疲れてくるとフォームが崩れやすくなります。回数を見直す目安にしてください。` });
}

/** The words told after a rep (camera): its number and one point. */
export function repCue(r: StrengthResult, rep: Rep): string {
  const n = `${rep.index}回`;
  if (r.exercise === 'squat') {
    if (rep.low.thigh !== null && rep.low.thigh < S.shallow) return `${n}、浅め`;
    if (r.refined && (rep.heelRise ?? 0) > S.heel) return `${n}、かかと`;
  } else {
    if (r.exercise === 'slrdl' && (rep.low.line ?? 180) < L.line) return rep.low.legBelow === false ? `${n}、脚が上がりすぎ` : `${n}、脚が下がった`;
    if ((kneeBend(rep) ?? 0) > H(r.exercise).kneeChange) return `${n}、膝が曲がった`;
    if ((rep.low.shank ?? 0) > H(r.exercise).shank) return `${n}、膝が前`;
  }
  return `${n}、良し`;
}

/** Under each picture. */
export function phaseGuides(r: StrengthResult): Record<string, string> {
  const out: Record<string, string> = {}, deg = (v: number | null, f = (x: number) => String(round(x))) => v === null ? '—' : `${f(v)}°`;
  for (const rep of r.reps) {
    const ts = trunkShank(rep);
    out[`rep${rep.index}`] = r.exercise === 'squat'
      ? `深さ ${deg(rep.low.thigh, signed)}（0°で太ももが水平）・膝 ${deg(rep.low.knee)}・体幹−脛 ${deg(ts, signed)}${ts === null ? '' : `（${emphasis(ts)}）`}`
      : r.exercise === 'slrdl'
        ? `一直線 ${deg(rep.low.line)}（180°が一直線）・体幹 ${deg(rep.low.trunk)}・軸脚の膝 ${deg(rep.low.knee)}（増え ${deg(kneeBend(rep), signed)}）`
        : `体幹 ${deg(rep.low.trunk)}（参考 ${R.trunk}°以上）・股関節 ${deg(rep.low.hip)}・膝 ${deg(rep.low.knee)}（参考 ${R.knee[0]}〜${R.knee[1]}°）・膝の曲がりの増え ${deg(kneeBend(rep), signed)}`;
  }
  return out;
}
export { hinge };
