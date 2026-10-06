import type { CurveStartResult } from './analysis';
import { CURVE_GUIDE } from './advice';
import type { P2 } from './camera';

const LEFT_FOOT = '#ff4d4d', RIGHT_FOOT = '#3d7bff', PATH = '#ffd400', IDEAL = '#ffffff';
const d = (pts: P2[]) => pts.map((q, i) => `${i ? 'L' : 'M'}${q[0].toFixed(1)},${q[1].toFixed(1)}`).join('');

/** The path drawn on the video's last frame (the track clear): the athlete's lane, the straight line the blocks aim
 * along (from the start, tangent to the line 20 cm into the lane), the footprints and the body's path between them. */
export function PathPicture({ result, image, width, height, offset = [0, 0] }: { result: CurveStartResult; image: string; width: number; height: number; offset?: P2 }) {
  // The result is in the first frame's picture; the picture drawn on is the last frame, `offset` further on.
  const o = (q: P2): P2 => [q[0] + offset[0], q[1] + offset[1]];
  const S0 = result.start?.img, T0 = result.tangent?.img; if (!S0 || !T0) return null;
  const S = o(S0), T = o(T0), steps = result.steps.map(q => ({ ...q, img: o(q.img) })), path = result.path.map(q => o(q.img)), measure = result.lines.measure.map(o);
  const pts = [S, ...steps.map(q => q.img)], xs = pts.map(q => q[0]), ys = pts.map(q => q[1]);
  const pad = .1 * Math.max(width, height), x0 = Math.max(0, Math.min(...xs) - pad), x1 = Math.min(width, Math.max(...xs) + pad);
  const y0 = Math.max(0, Math.min(...ys) - pad * .6), y1 = Math.min(height, Math.max(...ys) + pad * .8), unit = (x1 - x0) / 100;
  const far: P2 = [S[0] + (T[0] - S[0]) * 1.8, S[1] + (T[1] - S[1]) * 1.8];
  return <figure className="sprint10-chart curvestart-picture">
    <figcaption>動画の上に描いた軌跡<small>（白い点線＝まっすぐの線、黄＝体の通り道）</small></figcaption>
    <svg viewBox={`${x0} ${y0} ${x1 - x0} ${y1 - y0}`} role="img" aria-label={`軌跡：${steps.length}歩の足跡と体の通り道`}>
      <image href={image} x={0} y={0} width={width} height={height} preserveAspectRatio="none" />
      <path d={d(measure)} fill="none" stroke="rgba(255,255,255,.55)" strokeWidth={unit * .25} strokeDasharray={`${unit} ${unit}`} />
      <line x1={S[0]} y1={S[1]} x2={far[0]} y2={far[1]} stroke={IDEAL} strokeWidth={unit * .5} strokeDasharray={`${unit * 2} ${unit * 1.4}`} />
      <path d={d(path)} fill="none" stroke={PATH} strokeWidth={unit * .9} strokeLinejoin="round" strokeLinecap="round" />
      {steps.map(q => <g key={q.i}><circle cx={q.img[0]} cy={q.img[1]} r={unit * 1.1} fill={q.side === 'L' ? LEFT_FOOT : RIGHT_FOOT} stroke="#000" strokeWidth={unit * .15} />
        <text x={q.img[0] + unit * 1.6} y={q.img[1] - unit} fontSize={unit * 4.2} fontWeight={800} fill="#fff" stroke="#000" strokeWidth={unit * .7} paintOrder="stroke">{q.i}</text></g>)}
      <circle cx={S[0]} cy={S[1]} r={unit * 1.3} fill="#fff" stroke="#000" strokeWidth={unit * .2} />
      <circle cx={T[0]} cy={T[1]} r={unit * 1.1} fill="none" stroke="#fff" strokeWidth={unit * .35} />
    </svg>
  </figure>;
}

const TW = 360, TH = 150, TS = 18;   // the strip from above: TS m long
/** The path from above, true to scale: the straight line points right, the inside of the curve is up. */
export function TopView({ result }: { result: CurveStartResult }) {
  const S = result.start?.ground, T = result.tangent?.ground, R = result.camera?.R; if (!S || !T || !R) return null;
  const L = result.tangent!.length, e: P2 = [(T[0] - S[0]) / L, (T[1] - S[1]) / L], left: P2 = [-e[1], e[0]], k = (TW - 20) / TS, oy = TH - 34;
  const B = (G: P2): P2 => { const dx = G[0] - S[0], dy = G[1] - S[1]; return [10 + (dx * e[0] + dy * e[1]) * k, oy - (dx * left[0] + dy * left[1]) * k]; };
  /** A footprint on the ground: its angle round the curve from the camera, its distance from the inner line by the lane's ruler. */
  const placed = (g: P2, cm: number | null): P2 => { if (cm === null) return g; const a = Math.atan2(g[1], g[0]), r = R + cm / 100; return [r * Math.cos(a), r * Math.sin(a)]; };
  const arc = (r: number) => { const a0 = Math.atan2(S[1], S[0]), pts: P2[] = []; for (let a = a0 - .03; a < a0 + .55; a += .004) pts.push(B([r * Math.cos(a), r * Math.sin(a)])); return d(pts); };
  const feet = result.steps.map(q => ({ q, at: B(placed(q.ground, q.cm)) }));
  const mids: P2[] = []; for (let i = 0; i + 1 < feet.length; i++) if (feet[i].q.side !== feet[i + 1].q.side) mids.push([(feet[i].at[0] + feet[i + 1].at[0]) / 2, (feet[i].at[1] + feet[i + 1].at[1]) / 2]);
  const until = result.straight.until, mark = (m: number) => 10 + m * k;
  return <figure className="sprint10-chart curvestart-top">
    <figcaption>真上から<small>（走る向きを右、上がカーブの内側、実寸、1目盛り1 m）</small></figcaption>
    <svg viewBox={`0 0 ${TW} ${TH}`} role="img" aria-label={`真上から：接点 ${L.toFixed(1)} m${until !== null ? `、${until.toFixed(1)} m で直線から離れた` : ''}`}>
      <rect x={0} y={0} width={TW} height={TH} rx={6} fill="#5b7fc0" />
      {Array.from({ length: TS + 1 }, (_, m) => <g key={m}><line x1={mark(m)} x2={mark(m)} y1={0} y2={TH - 14} stroke="rgba(255,255,255,.18)" />
        {m % 2 === 0 && <text x={mark(m)} y={TH - 4} fill="#fff" fontSize={9} textAnchor="middle">{m}</text>}</g>)}
      <path d={arc(R)} fill="none" stroke="#fff" strokeWidth={2.2} />
      <path d={arc(R + 1.22)} fill="none" stroke="#fff" strokeWidth={2.2} />
      <path d={arc(R + .2)} fill="none" stroke="rgba(255,255,255,.6)" strokeWidth={.8} strokeDasharray="3 3" />
      <line x1={B(S)[0]} y1={B(S)[1]} x2={B([S[0] + e[0] * TS, S[1] + e[1] * TS])[0]} y2={B([S[0] + e[0] * TS, S[1] + e[1] * TS])[1]} stroke={IDEAL} strokeWidth={1.4} strokeDasharray="6 4" />
      <line x1={mark(L)} x2={mark(L)} y1={6} y2={TH - 16} stroke="#fff" strokeWidth={1.2} />
      <text x={mark(L) + 3} y={14} fill="#fff" fontSize={10} fontWeight={700}>接点 {L.toFixed(1)} m</text>
      {until !== null && <><line x1={mark(until)} x2={mark(until)} y1={6} y2={TH - 16} stroke="#ffb347" strokeWidth={1.6} />
        <text x={mark(until) + 3} y={Math.abs(until - L) < 3 ? 27 : 14} fill="#ffdca8" fontSize={10} fontWeight={700}>直線から離れた所 {until.toFixed(1)} m</text></>}
      <path d={d(mids)} fill="none" stroke={PATH} strokeWidth={2.6} strokeLinejoin="round" />
      {feet.map(({ q, at }) => <circle key={q.i} cx={at[0]} cy={at[1]} r={3} fill={q.side === 'L' ? LEFT_FOOT : RIGHT_FOOT} stroke="#000" strokeWidth={.6} />)}
      <circle cx={B(S)[0]} cy={B(S)[1]} r={3.5} fill="#fff" />
    </svg>
  </figure>;
}

const LW = 340, LH = 200, L0 = 34, R0 = 10, T0 = 12, B0 = 26, LMAX = 6, LMIN = -14;
/** The body lean step by step (dots: each footprint; line: two steps, left and right, averaged) by the distance run. */
export function LeanChart({ result }: { result: CurveStartResult }) {
  const pairs = result.lean.pairs; if (!pairs.length) return null;
  const L = result.tangent?.length ?? 0, curveFrom = Math.max(L + 2, result.straight.until ?? 0), until = result.lean.curve === null ? null : curveFrom, xmax = Math.max(12, Math.ceil(Math.max(...result.steps.map(q => q.along)) / 2) * 2);
  const X = (m: number) => L0 + m / xmax * (LW - L0 - R0), Y = (v: number) => T0 + (LMAX - v) / (LMAX - LMIN) * (LH - T0 - B0);
  const [lo, hi] = CURVE_GUIDE.leanBand;
  return <figure className="sprint10-chart">
    <figcaption>体の内傾<small>（足から骨盤への線と鉛直の角度、°。−が内側）</small></figcaption>
    <svg viewBox={`0 0 ${LW} ${LH}`} role="img" aria-label={`体の内傾：まっすぐの区間 ${result.lean.straight?.toFixed(1) ?? '—'}°、曲がってから ${result.lean.curve?.toFixed(1) ?? '—'}°`}>
      {until !== null && <><rect x={X(until)} y={Y(-lo)} width={LW - R0 - X(until)} height={Y(-hi) - Y(-lo)} fill="rgba(46,160,67,.15)" />
        <text x={LW - R0 - 3} y={Y(-hi) + 11} fontSize={9} fill="#2e7d4f" textAnchor="end">必要な内傾の目安 {lo}〜{hi}°</text>
        <line x1={X(until)} x2={X(until)} y1={T0} y2={LH - B0} stroke="#ffb347" strokeWidth={1.5} /></>}
      {[5, 0, -5, -10].map(v => <g key={v}><line x1={L0} x2={LW - R0} y1={Y(v)} y2={Y(v)} className="grid" />
        <text x={L0 - 5} y={Y(v)} textAnchor="end" dominantBaseline="middle">{v > 0 ? `+${v}` : v}</text></g>)}
      {Array.from({ length: xmax / 2 + 1 }, (_, i) => i * 2).map(m => <text key={m} x={X(m)} y={LH - 8} textAnchor="middle">{m} m</text>)}
      <line x1={X(L)} x2={X(L)} y1={T0} y2={LH - B0} stroke="#7d8f87" strokeDasharray="3 3" />
      <line x1={L0} x2={LW - R0} y1={Y(0)} y2={Y(0)} stroke="#123a30" />
      {result.steps.map(q => q.lean === null ? null : <circle key={q.i} cx={X(q.along)} cy={Y(Math.max(LMIN, Math.min(LMAX, q.lean)))} r={2.6} fill={q.side === 'L' ? '#ff9a9a' : '#9ab6ff'} />)}
      <path d={d(pairs.map(p => [X(p.along), Y(Math.max(LMIN, Math.min(LMAX, p.deg)))]))} fill="none" stroke="#123a30" strokeWidth={2.4} />
    </svg>
  </figure>;
}
