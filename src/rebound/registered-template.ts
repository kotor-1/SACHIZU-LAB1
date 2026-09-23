import type { FirstContact } from '../cmj/ExactFramePicker';
import type { COMSample } from '../cmj/center-of-mass';
import { G } from '../cmj/analysis';
import type { PredictionSignals } from './predictions';
import { detectLowerPeaks, type Apex } from './waveform-fit';

export interface Registration { takeoff1: FirstContact; landing1: FirstContact; takeoff2: FirstContact }
export interface Boundary { pts: number; source: 'MANUAL' | 'TEMPLATE' | 'TERMINAL_FLIGHT_TEMPLATE' | 'AUTO_FOOT' }
export interface TemplateFit {
  afterJump: number; landing: Boundary | null; takeoff: Boundary | null;
  error: number | null; contactRange: [number, number] | null; reason: string | null;
}
export interface RegisteredJump {
  jump: number; takeoff: Boundary | null; landing: Boundary | null;
  contactSeconds: number | null; flightSeconds: number | null; heightM: number | null; rsi: number | null;
  contactSource: 'MANUAL' | 'PREDICTED' | null; flightSource: 'MANUAL' | 'PREDICTED' | null; reason: string | null;
}
export interface RegisteredAnalysis {
  version: string; validated: false; registration: Registration | null; reason: string | null;
  detected: number; selectedPeakFrames: number[]; excludedPeakFrames: number[];
  fits: TemplateFit[]; jumps: RegisteredJump[]; validRSICount: number; meanRSI: number | null; maxRSI: number | null;
  warnings: string[];
}
export const TEMPLATE_PARAMETERS = { points: 41, maxGapSeconds: .05, minCoverage: .9, maxError: .18,
  ambiguityError: .005, maxContactRangeSeconds: .08, minContactSeconds: .06, maxContactSeconds: .6 } as const;
const avg = (v: number[]) => v.reduce((s, x) => s + x, 0) / v.length;
const valid = (s: COMSample) => s.comY !== null && Number.isFinite(s.comY) && s.comX !== null && Number.isFinite(s.comX) && s.bodyScale !== null && Number.isFinite(s.bodyScale) && s.bodyScale > 0;

/** Resample only within short observed brackets; do not bridge tracking loss. */
function curve(samples: COMSample[], a: number, b: number): number[] | null {
  if (!(b > a)) return null;
  const inside = samples.filter(s => s.pts >= a && s.pts <= b), good = samples.filter(valid);
  if (inside.length < 12 || inside.filter(valid).length / inside.length < TEMPLATE_PARAMETERS.minCoverage) return null;
  const times = [a, ...inside.filter(valid).map(s => s.pts), b];
  if (times.some((t, i) => i > 0 && t - times[i - 1] > TEMPLATE_PARAMETERS.maxGapSeconds + 1e-7)) return null;
  const rows = inside.filter(valid), scale = avg(rows.map(s => s.bodyScale!));
  if (Math.max(...rows.map(s => s.comX!)) - Math.min(...rows.map(s => s.comX!)) > scale * .25) return null;
  const values: number[] = []; let index = 0;
  for (let j = 0; j < TEMPLATE_PARAMETERS.points; j++) {
    const t = a + (b - a) * j / (TEMPLATE_PARAMETERS.points - 1);
    while (index < good.length && good[index].pts < t - 1e-9) index++;
    const after = good[index];
    if (after && Math.abs(after.pts - t) < 1e-8) { values.push(after.comY!); continue; }
    const before = good[index - 1];
    if (!before || !after || after.pts - before.pts > TEMPLATE_PARAMETERS.maxGapSeconds + 1e-7) return null;
    values.push(before.comY! + (after.comY! - before.comY!) * (t - before.pts) / (after.pts - before.pts));
  }
  const residual = values.map((y, i) => y - (values[0] + (values.at(-1)! - values[0]) * i / (values.length - 1)));
  const span = Math.max(...residual) - Math.min(...residual);
  return span < scale * .05 ? null : residual.map(v => v / span);
}
const sampleCurve = (v: number[], t: number) => { const k = Math.max(0, Math.min(v.length - 1, t * (v.length - 1))), i = Math.floor(k); return v[i] + (v[Math.min(i + 1, v.length - 1)] - v[i]) * (k - i); };
const warp = (t: number, u: number, v: number, ru: number, rv: number) => t <= u ? t / u * ru : t <= v ? ru + (t - u) / (v - u) * (rv - ru) : rv + (t - v) / (1 - v) * (1 - rv);

/** Transfer tagged descent/contact/ascent phases, fitting durations separately.
 * Fixed engineering thresholds, not validated confidence or reference-RSI fitting. */
function fitCycle(signals: PredictionSignals, reference: number[][], ru: number, rv: number, a: Apex, b: Apex, afterJump: number): TemplateFit {
  const out: TemplateFit = { afterJump, landing: null, takeoff: null, error: null, contactRange: null, reason: null };
  const period = b.pts - a.pts;
  if (period < .25 || period > 1.2) return { ...out, reason: '周期が想定範囲外です' };
  const target = [curve(signals.PELVIS, a.pts, b.pts), curve(signals.HIP_KNEE, a.pts, b.pts)];
  if (target.some(c => !c)) return { ...out, reason: '腰・膝の追跡欠落または横移動があります' };
  type Fit = { u: number; v: number; error: number; contact: number };
  const fits: Fit[] = [];
  function evaluate(u: number, v: number) {
    const contact = (v - u) * period;
    if (u < .06 || v > .94 || v <= u || contact < .06 || contact > .6) return;
    const residual = target.flatMap((c, channel) => c!.map((y, i) => y - sampleCurve(reference[channel], warp(i / (c!.length - 1), u, v, ru, rv))));
    fits.push({ u, v, contact, error: Math.sqrt(avg(residual.map(x => x * x))) });
  }
  for (let u = .08; u <= .7; u += .02) for (let v = u + .08; v <= .92; v += .02) evaluate(u, v);
  if (!fits.length) return { ...out, reason: '時間の候補がありません' };
  const coarse = fits.reduce((a, b) => a.error < b.error ? a : b);
  for (let du = -.02; du <= .02001; du += .005) for (let dv = -.02; dv <= .02001; dv += .005) evaluate(coarse.u + du, coarse.v + dv);
  const best = fits.reduce((a, b) => a.error < b.error ? a : b);
  const contacts = fits.filter(f => f.error <= best.error + TEMPLATE_PARAMETERS.ambiguityError).map(f => f.contact);
  out.error = best.error; out.contactRange = [Math.min(...contacts), Math.max(...contacts)];
  if (best.error > TEMPLATE_PARAMETERS.maxError) return { ...out, reason: '登録した動きと波形が合いません' };
  if (best.u <= .065 || best.v >= .935) return { ...out, reason: '推定が探索範囲の端に達しています' };
  if (out.contactRange[1] - out.contactRange[0] > TEMPLATE_PARAMETERS.maxContactRangeSeconds) return { ...out, reason: '似た波形に複数の接地時間が対応しています' };
  return { ...out, landing: { pts: a.pts + best.u * period, source: 'TEMPLATE' }, takeoff: { pts: a.pts + best.v * period, source: 'TEMPLATE' } };
}

export function analyzeRegistered(signals: PredictionSignals, registration: Registration, selectedFrames?: number[]): RegisteredAnalysis {
  const result: RegisteredAnalysis = { version: 'rj-registered-template-v1', validated: false, registration, reason: null,
    detected: 0, selectedPeakFrames: [], excludedPeakFrames: [], fits: [], jumps: [], validRSICount: 0, meanRSI: null, maxRSI: null,
    warnings: ['研究用・精度未検証。登録した1周期を見本に接地・離地の時刻を予測します。足と床の接触を確認した実測値ではありません。',
      '1回目は静止からの開始のためRSIを算出しません。2回目以降の算出できた回だけを平均・最大に採用し、採用回数を表示します。',
      '跳躍高はg×滞空時間²/8。離地と着地で全身重心高が等しい仮定があります。初回と後半の動きが異なると予測がずれます。'] };
  const fail = (reason: string) => ({ ...result, reason });
  const { takeoff1: t1, landing1: l1, takeoff2: t2 } = registration;
  const anchors = [t1, l1, t2];
  if (anchors.some(p => !Number.isFinite(p.pts) || !Number.isInteger(p.frame)) || !(t1.pts < l1.pts && l1.pts < t2.pts)) return fail('離地①→接地①→離地②の順に異なるコマを登録してください。');
  if (l1.pts - t1.pts < .12 || l1.pts - t1.pts > .9 || t2.pts - l1.pts < .06 || t2.pts - l1.pts > .6) return fail('登録した滞空・接地時間が想定範囲外です。動画の時間軸とコマを確認してください。');
  if (anchors.some(p => !signals.PELVIS.some(s => s.frame === p.frame && Math.abs(s.pts - p.pts) < 1e-7))) return fail('登録フレームと解析した動画の時刻が一致しません。');
  if (signals.HIP_KNEE.length !== signals.PELVIS.length || signals.HIP_KNEE.some((s, i) => s.frame !== signals.PELVIS[i].frame || s.pts !== signals.PELVIS[i].pts)) return fail('腰と膝の時刻が一致しません。');
  const detected = detectLowerPeaks(signals.PELVIS, 'PELVIS'); result.detected = detected.detected;
  if (detected.reason && detected.reason !== 'JUMP_COUNT_MISMATCH') return fail(`頂点を確認できません：${detected.reason}`);
  if (selectedFrames !== undefined && (selectedFrames.length < 2 || selectedFrames.length > 10)) return fail('解析対象の連続する2〜10頂点を画面で確認してください。');
  const chosen = selectedFrames ? detected.peaks.filter(p => selectedFrames.includes(p.frame))
    : detected.detected >= 2 && detected.detected <= 11 ? detected.peaks.slice(0, 10) : [];
  if (chosen.length < 2 || (selectedFrames && chosen.length !== selectedFrames.length)
    || chosen.some((p, i) => i > 0 && detected.peaks.indexOf(p) !== detected.peaks.indexOf(chosen[i - 1]) + 1)) return fail('連続する跳躍の頂点を確認してください。11頂点の場合は最後を集計から除外します。');
  const n = chosen.length;
  result.selectedPeakFrames = chosen.map(p => p.frame); result.excludedPeakFrames = detected.peaks.filter(p => !chosen.includes(p)).map(p => p.frame);
  const [a, b] = chosen;
  if (!(t1.pts < a.pts && a.pts < l1.pts && t2.pts < b.pts)) return fail('3点が選択した1・2回目の跳躍に対応していません。最初の離地・その着地・次の離地を確認してください。');
  const ru = (l1.pts - a.pts) / (b.pts - a.pts), rv = (t2.pts - a.pts) / (b.pts - a.pts);
  const reference = [curve(signals.PELVIS, a.pts, b.pts), curve(signals.HIP_KNEE, a.pts, b.pts)];
  if (reference.some(c => !c)) return fail('見本の1〜2回目の腰・膝の波形を確認できません。');
  const takeoffs: (Boundary | null)[] = [{ pts: t1.pts, source: 'MANUAL' }, { pts: t2.pts, source: 'MANUAL' }];
  const landings: (Boundary | null)[] = [{ pts: l1.pts, source: 'MANUAL' }];
  result.fits.push({ afterJump: 1, landing: landings[0], takeoff: takeoffs[1], error: 0, contactRange: [t2.pts - l1.pts, t2.pts - l1.pts], reason: null });
  for (let i = 1; i < n - 1; i++) {
    const fit = fitCycle(signals, reference as number[][], ru, rv, chosen[i], chosen[i + 1], i + 1);
    result.fits.push(fit); landings[i] = fit.landing; takeoffs[i + 1] = fit.takeoff;
  }
  const extra = detected.peaks[detected.peaks.indexOf(chosen[n - 1]) + 1];
  if (extra) {
    const fit = fitCycle(signals, reference as number[][], ru, rv, chosen[n - 1], extra, n);
    result.fits.push(fit); landings[n - 1] = fit.landing;
    result.warnings.push(`集計外の次の跳躍は${n}回目の着地推定を補助するためにのみ使用しています。`);
  } else {
    // No invented 11th apex. Transfer first-flight ascent/descent ratio, then
    // require observed terminal flight to match its shape THROUGH landing.
    const takeoff = takeoffs[n - 1], fraction = (a.pts - t1.pts) / (l1.pts - t1.pts);
    let error: number | null = null, landing: Boundary | null = null;
    if (takeoff && fraction > .2 && fraction < .8) {
      const pts = takeoff.pts + (chosen[n - 1].pts - takeoff.pts) / fraction;
      const refs = [curve(signals.PELVIS, t1.pts, l1.pts), curve(signals.HIP_KNEE, t1.pts, l1.pts)];
      const targets = [curve(signals.PELVIS, takeoff.pts, pts), curve(signals.HIP_KNEE, takeoff.pts, pts)];
      if (refs.every(Boolean) && targets.every(Boolean) && signals.PELVIS.at(-1)!.pts >= pts + .03 && pts - takeoff.pts >= .12 && pts - takeoff.pts <= .9) {
        error = Math.sqrt(avg(refs.flatMap((c, channel) => c!.map((y, j) => (y - targets[channel]![j]) ** 2))));
        if (error <= TEMPLATE_PARAMETERS.maxError) landing = { pts, source: 'TERMINAL_FLIGHT_TEMPLATE' };
      }
    }
    landings[n - 1] = landing; result.fits.push({ afterJump: n, landing, takeoff: null, error, contactRange: null, reason: landing ? null : `${n}回目の着地までの波形を確認できません` });
    result.warnings.push(`${n}回目の着地は初回の上昇・下降時間比を移した別の推定です。映像の波形照合も行いますが、姿勢変化による誤差を保証できません。`);
  }
  for (let i = 0; i < n; i++) {
    const takeoff = takeoffs[i] ?? null, landing = landings[i] ?? null, previousLanding = landings[i - 1] ?? null;
    const flight = takeoff && landing ? landing.pts - takeoff.pts : null;
    const contact = i > 0 && previousLanding && takeoff ? takeoff.pts - previousLanding.pts : null;
    const flightSeconds = flight !== null && flight >= .12 && flight <= .9 ? flight : null;
    const contactSeconds = contact !== null && contact >= .06 && contact <= .6 ? contact : null;
    const heightM = flightSeconds === null ? null : G * flightSeconds ** 2 / 8;
    const rsi = heightM !== null && contactSeconds !== null ? heightM / contactSeconds : null;
    result.jumps.push({ jump: i + 1, takeoff, landing, flightSeconds, contactSeconds, heightM, rsi,
      contactSource: contactSeconds === null ? null : i === 1 ? 'MANUAL' : 'PREDICTED', flightSource: flightSeconds === null ? null : i === 0 ? 'MANUAL' : 'PREDICTED',
      reason: i === 0 ? '静止開始の1回目はRSI対象外' : rsi === null ? '接地または滞空の推定が不成立' : null });
  }
  const good = result.jumps.slice(1).flatMap(j => j.rsi === null ? [] : [j.rsi]);
  result.validRSICount = good.length; result.meanRSI = good.length ? avg(good) : null; result.maxRSI = good.length ? Math.max(...good) : null;
  if (good.length < n - 1) result.warnings.unshift(`有効な${good.length}/${n - 1}回だけの集計です。対象の異なる平均・最大と直接比較しないでください。`);
  return result;
}

export function registeredCSV(r: RegisteredAnalysis): string {
  const rows: unknown[][] = [['jump', 'height_m', 'contact_s', 'flight_s', 'rsi_m_s', 'contact_source', 'flight_source', 'takeoff_s', 'landing_s', 'landing_method', 'reason']];
  for (const j of r.jumps) rows.push([j.jump, j.heightM, j.contactSeconds, j.flightSeconds, j.rsi, j.contactSource, j.flightSource, j.takeoff?.pts, j.landing?.pts, j.landing?.source, j.reason]);
  return rows.map(row => row.map(v => `"${String(v ?? '').replaceAll('"', '""')}"`).join(',')).join('\n');
}
