import type { Advice } from '../sprint10/crouch-advice';
import { LEAVE_CM, type CurveStartResult } from './analysis';

/** How to read a curve start (docs/CurveStart_Feasibility_20261006.md §3, §5; the
 * research notes are in dev-validation/curve/research-notes.md):
 * - No study has compared block angles, or straight against curved first steps, with
 *   times. Leaving the blocks along the tangent to the inside line and running along
 *   the line once there is the shortest way (geometry), what the rules' commentary says
 *   blocks are angled for (World Athletics TR15.1 note; JAAF rule book 2026 p.132,
 *   「最短距離を取るため」) and what coaching manuals teach (Athletics South Africa level 1:
 *   the first 6-10 m straight). Judson et al. 2020 (J Sports Sci 38:336) warn that
 *   keeping straight too long takes athletes off the race line.
 * - Running wide costs distance: 10 cm outside the measurement line round a 200 m bend
 *   is 0.26-0.31 m, about 0.03-0.04 s (geometry); athletes whose centre of mass went
 *   inside the race line gained race speed (Churchill et al. 2015, Sports Biomech).
 * - Lean: none is needed while running straight; on the bend the body leans in by
 *   tan θ = v²/(gR), about 6-10° at 7-8.5 m/s on radii of 36-45 m; measured at about
 *   8 m/s, left −5° and right −12° on the bend against +6° and −5° on the straight
 *   (Judson et al. 2020). */
export const CURVE_GUIDE = { aim: 1, after: [35, 45], leanStraight: 3, leanCurve: [-5, -4], leanBand: [6, 10] } as const;
export interface CurveAdvice extends Omit<Advice, 'level'> { level: Advice['level'] | 'info' }
const m = (v: number) => `${v.toFixed(1)} m`, cm = (v: number) => `${Math.round(v)} cm`, deg = (v: number) => `${Math.abs(v).toFixed(1)}°`;

export function curveAdvice(r: CurveStartResult): CurveAdvice[] {
  const out: CurveAdvice[] = [], s = r.straight, L = r.tangent?.length ?? null, G = CURVE_GUIDE;
  if (L !== null && s.verdict && s.inward !== null) {
    const v = s.inward;
    out.push(s.verdict === 'early'
      ? { topic: 'まっすぐ出られたか', level: 'check', text: `接点（${m(L)}）の前後で、体が理想の道（接点までまっすぐ、その後はラインに沿う）より内側へ最大 ${cm(v)} 入っています。カーブの線に引き込まれて、早く曲がり始めている可能性があります。ブロックの向き（内側から20 cmの線に接する方向）にまっすぐ出て、接点から曲がるのが最短の道です（規則の解説・指導書）。` }
      : { topic: 'まっすぐ出られたか', level: 'good', text: `接点（${m(L)}）まで、体は理想の道より内側に入っていません（${v > 0 ? `最も内側で ${cm(v)}` : `ずっと外側、最も近くて ${cm(-v)} 外`}）。カーブの線に惑わされず、まっすぐ出られています。` });
  }
  if (s.aim !== null && s.atTangent !== null) {
    out.push(Math.abs(s.aim) < G.aim
      ? { topic: '出た向き', level: 'good', text: `理想の線（内側から20 cmの線に接する直線）とほぼ同じ向きです（接点で ${cm(Math.abs(s.atTangent))} の差）。` }
      : { topic: '出た向き', level: 'info', text: `理想の線より ${deg(s.aim)} ${s.aim > 0 ? '外向き' : '内向き'}に出ています（接点で ${cm(Math.abs(s.atTangent))} ${s.aim > 0 ? '外' : '内'}側）。${s.aim > 0 ? 'ブロックの向きか最初の数歩が、やや外を向いています。' : '早めに内側へ寄っています。'}誤差は±1°程度です。` });
  }
  if (r.after.median !== null && r.after.max !== null) {
    const v = r.after.median, top = r.after.max, cost = (x: number) => `${((x - 20) / 10 * .03).toFixed(2)}〜${((x - 20) / 10 * .04).toFixed(2)}秒`;
    out.push(top >= G.after[1]
      ? { topic: 'カーブに沿えたか', level: 'check', text: `接点の後、体は内側のラインから約 ${cm(v)} の所を走り、最大 ${cm(top)} まで外へふくらんでいます。曲がり始めが遅いか、内傾が足りず、ラインに沿いきれていません。この位置で200 mのカーブを回ると、20 cmの線より約 ${cost(top)} 長くかかります（10 cm外で約0.03〜0.04秒、距離の計算）。` }
      : v <= G.after[0]
      ? { topic: 'カーブに沿えたか', level: 'good', text: `接点の後、体は内側のラインから約 ${cm(v)}（最大 ${cm(top)}）の所を走っています。規則の距離は内側のラインから20 cmの線で測ります。` }
      : { topic: 'カーブに沿えたか', level: 'info', text: `接点の後、体は内側のラインから約 ${cm(v)}（最大 ${cm(top)}）の所を走っています（20 cmの線より10 cm外を回るごとに、200 mで約0.03〜0.04秒）。` });
  }
  if (r.lean.straight !== null) {
    const v = r.lean.straight;
    out.push(Math.abs(v) <= G.leanStraight
      ? { topic: 'まっすぐの区間の傾き', level: 'good', text: `まっすぐ走っている間、体は左右に傾いていません（左右2歩の平均 ${v.toFixed(1)}°）。` }
      : { topic: 'まっすぐの区間の傾き', level: 'info', text: `まっすぐ走っている間に、体が${v < 0 ? '内' : '外'}側へ平均 ${deg(v)} 傾いています。${v < 0 ? '内傾は曲がり始めの最初のサインです。' : ''}` });
  }
  if (r.lean.curve !== null) {
    const v = r.lean.curve;
    out.push(v <= G.leanCurve[0]
      ? { topic: 'カーブでの内傾', level: 'good', text: `曲がってから内側へ平均 ${deg(v)} 傾いています。カーブに沿って自然に内傾できています（速さ7〜8.5 m/s・半径36〜45 mで必要な内傾は約${G.leanBand[0]}〜${G.leanBand[1]}°）。` }
      : v > G.leanCurve[1]
      ? { topic: 'カーブでの内傾', level: 'check', text: `曲がってからの内傾は平均 ${deg(v)} と小さめです（速さ7〜8.5 m/s・半径36〜45 mで必要な内傾は約${G.leanBand[0]}〜${G.leanBand[1]}°）。内傾が足りないと、カーブで外へふくらみます。` }
      : { topic: 'カーブでの内傾', level: 'info', text: `曲がってから内側へ平均 ${deg(v)} 傾いています（必要な内傾の目安は約${G.leanBand[0]}〜${G.leanBand[1]}°）。` });
  }
  return out;
}
export { LEAVE_CM };
