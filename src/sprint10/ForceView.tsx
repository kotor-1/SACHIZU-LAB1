import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { numberInput } from './number-input';
import { anglePose, type CrouchFrame } from './crouch';
import type { Contact } from './contacts';
import { bodyTrack, G, groundForces, scaleFromHeight, type GroundForces } from './ground-force';
import { usePhasePictures, type FigureOverlay } from './CrouchViews';
import type { Phase } from './crouch-figure';

/** The body's weight and height, kept on this device only (the user enters them once). */
const WEIGHT_KEY = 'sachizu-body-weight', HEIGHT_KEY = 'sachizu-body-height';
const stored = (key: string) => { try { const v = Number(localStorage.getItem(key)); return v > 0 ? v : null; } catch { return null; } };
const store = (key: string, v: number | null) => { try { if (v) localStorage.setItem(key, String(v)); else localStorage.removeItem(key); } catch { /* not kept */ } };

/** The studies' mean forward forces in body weights, worked out from Graham-Smith, Colyer & Salo 2020 (Int J Sports Sci
 * Coach 15:418; 17 elite senior and 20 junior academy men): the block, exit speed ÷ push ÷ g (3.36 m/s, 0.365 s;
 * 3.16 m/s, 0.412 s); the first and second contacts, the speed gained ÷ contact time ÷ g (to 4.60 and 5.48 m/s in
 * 0.195 and 0.173 s; juniors to 4.39 and 5.27 in 0.202 and 0.173). Men only: no women's values were found. */
export const FORCE_STUDY = {
  block: { elite: 3.36 / .365 / G, junior: 3.16 / .412 / G, power: { elite: 15.5, junior: 12.4 } },
  steps: [{ elite: (4.60 - 3.36) / .195 / G, junior: (4.39 - 3.16) / .202 / G }, { elite: (5.48 - 4.60) / .173 / G, junior: (5.27 - 4.39) / .173 / G }],
} as const;
/** Where a forward force stands against the elite men's: within 15% alike. */
export function against(v: number, elite: number): string {
  const q = v / elite;
  return v < 0 ? 'ブレーキの方が大きい' : q >= 1.15 ? '一流男子より大きい' : q >= .85 ? '一流男子並み' : q >= .6 ? '一流男子よりやや小さい' : '一流男子より小さい';
}
const times = (v: number, mass: number) => `${(v / (mass * G)).toFixed(2)}倍`;

interface Moment { key: string; label: string; frame: number; pts: number; origin: { x: number; y: number } | null;
  horizontal: number | null; vertical: number | null; angle: number | null; ratio: number | null; extra: [string, string][]; against: string | null; study: string | null }

/** A number typed in, as the 10 m screen's (number-input.ts): the text kept while typing, the value within min-max. */
function NumberBox({ label, unit, value, onValue, min, max, example }: { label: string; unit: string; value: number | null; onValue: (v: number | null) => void; min: number; max: number; example: string }) {
  const [text, setText] = useState(value === null ? '' : String(value));
  useEffect(() => { setText(t => Number(t) === value ? t : value === null ? '' : String(value)); }, [value]);
  return <label>{label}<input type="text" inputMode="decimal" value={text} placeholder={example}
    onChange={e => { const r = numberInput(e.target.value, min, max, false); setText(r.text); onValue(r.text === '' ? null : r.value !== null && r.value >= min ? r.value : value); }}
    onBlur={() => setText(value === null ? '' : String(value))} />{unit}</label>;
}

/** The ground's push (ground-force.ts) on the crouch start or a run: the weight (and, for the crouch start, the height)
 * typed in, then each moment's mean push as one arrow on the athlete's picture, in body weights, beside the studies'. */
export default function ForceView({ kind, contacts, frames, width: W, height: H, direction, url, block, pxPerM, top = false }: {
  kind: 'crouch' | 'run'; contacts: readonly Contact[]; frames: readonly CrouchFrame[]; width: number; height: number; direction: number; url: string;
  /** A section at top speed (the flying 10 m): the forward force about nil there, the vertical the one to read. */
  top?: boolean;
  /** The crouch start: the first movement seen, the front block's clearance and the front foot's side. */
  block?: { moveStart: number; clearance: number; side: 0 | 1 | null } | null;
  /** A run: the picture's pixels per metre from its two lines. */
  pxPerM?: number | null;
}) {
  const [weight, setWeight] = useState<number | null>(() => stored(WEIGHT_KEY)), [height, setHeight] = useState<number | null>(() => stored(HEIGHT_KEY));
  useEffect(() => store(WEIGHT_KEY, weight), [weight]); useEffect(() => store(HEIGHT_KEY, height), [height]);
  const track = useMemo(() => bodyTrack(frames, W, H), [frames, W, H]);
  const scale = useMemo(() => kind === 'run' ? pxPerM ?? null : height ? scaleFromHeight(frames, W, H, height / 100, block?.clearance ?? -Infinity) : null,
    [kind, pxPerM, height, frames, W, H, block?.clearance]);
  const forces: GroundForces | null = useMemo(() => weight ? groundForces({ mass: weight, contacts, track, pxPerM: scale, scaleSource: kind === 'run' ? 'lines' : 'height', direction,
    speeds: kind === 'run' ? 'steps' : 'flights',
    block: block ? { moveStart: block.moveStart, clearance: block.clearance } : null }) : null, [weight, contacts, track, scale, kind, direction, block]);
  // The moments: the block's middle of the push and each contact's middle, their arrow from the foot on the ground.
  const nearest = useCallback((t: number) => frames.reduce<CrouchFrame | null>((best, f) => f.pose && (!best || Math.abs(f.pts - t) < Math.abs(best.pts - t)) ? f : best, null), [frames]);
  const moments: Moment[] = useMemo(() => {
    if (!forces) return [];
    const out: Moment[] = [], m = forces.mass;
    const b = forces.block;
    if (b && block) {
      const f = nearest(b.pushStart + b.pushSeconds / 2), pose = f ? anglePose(f) : null, toe = pose && block.side !== null ? pose[31 + block.side] : null;
      const S = FORCE_STUDY.block;
      out.push({ key: 'block', label: 'ブロック', frame: f?.frame ?? 0, pts: f?.pts ?? 0, origin: toe ? { x: toe.x * W, y: toe.y * H } : null,
        horizontal: b.horizontal, vertical: b.vertical, angle: b.angle, ratio: b.ratio, against: against(b.horizontal / (m * G), S.elite),
        study: `一流男子 ${S.elite.toFixed(2)}倍・ジュニア男子 ${S.junior.toFixed(2)}倍`,
        extra: [['押した時間', `${b.pushSeconds.toFixed(3)}秒`], ['押す強さ', `${b.power.toFixed(1)} W/kg（平均の前向きパワー。一流男子 ${S.power.elite}・ジュニア男子 ${S.power.junior}）`],
          ['縦の力', '手で支えた分も含みます']] });
    }
    forces.steps.forEach((s, i) => {
      const c = contacts[i];
      if (!c || c.touchdown === null || c.toeOff === null || (s.horizontal === null && s.vertical === null)) return;
      const f = nearest((c.touchdown + c.toeOff) / 2), S = kind === 'crouch' ? FORCE_STUDY.steps[i] : undefined;
      out.push({ key: `step${i + 1}`, label: `${i + 1}歩目`, frame: f?.frame ?? 0, pts: f?.pts ?? 0, origin: { x: c.x, y: c.groundY },
        horizontal: s.horizontal, vertical: s.vertical, angle: s.angle, ratio: s.ratio,
        against: S && s.horizontal !== null ? against(s.horizontal / (m * G), S.elite) : null,
        study: S ? `一流男子 約${S.elite.toFixed(2)}倍・ジュニア男子 約${S.junior.toFixed(2)}倍` : null,
        extra: [...(top ? [['研究（縦）', '速い選手ほど大きく、速い選手で約2〜2.5倍（Weyandら 2000）'] as [string, string]] : []),
          ...(s.verticalPeak !== null ? [['縦の最大（目安）', times(s.verticalPeak, m)] as [string, string]] : []),
          ...(s.contactSeconds !== null ? [['接地時間', `${s.contactSeconds.toFixed(3)}秒`] as [string, string]] : [])] });
    });
    return out;
  }, [forces, block, contacts, kind, nearest, W, H]);
  const [picked, setPicked] = useState<string | null>(null), picture = useRef<HTMLDivElement>(null);
  const shown = moments.find(m => m.key === picked) ?? moments.find(m => m.horizontal !== null) ?? moments[0] ?? null;
  const pick = (k: string) => { setPicked(k); requestAnimationFrame(() => picture.current?.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' })); };
  const bw = (forces?.mass ?? 1) * G;

  // The arrow on the picture: from the foot on the ground, its length a body weight per LEG_PER_WEIGHT of the leg.
  const phases: Phase[] = useMemo(() => shown && shown.origin ? [{ key: shown.key, label: shown.label, frame: shown.frame, pts: shown.pts, marks: [] }] : [], [shown?.key, shown?.frame, shown?.origin?.x]);   // eslint-disable-line react-hooks/exhaustive-deps
  const overlay = useCallback<FigureOverlay>((p, ctx, to, unit) => {
    if (!shown?.origin || shown.vertical === null) return;
    const f = frames.find(q => q.frame === p.frame), pose = f ? anglePose(f) : null;
    drawForceArrow(ctx, to, { x: shown.origin.x / W, y: shown.origin.y / H }, pose, shown.horizontal ?? 0, shown.vertical, bw, direction || 1, unit, shown.horizontal !== null);
  }, [shown, frames, W, H, bw, direction]);
  const { images, failed } = usePhasePictures(url, frames, phases, overlay);

  return <section className="force-view" aria-label="床反力">
    <h3>床反力（地面が押し返す力）</h3>
    <div className="force-inputs">
      <NumberBox label="体重" unit="kg" value={weight} onValue={setWeight} min={20} max={150} example="例 55" />
      {kind === 'crouch' && <NumberBox label="身長" unit="cm" value={height} onValue={setHeight} min={100} max={220} example="例 160" />}
    </div>
    {!weight ? <p className="sprint10-hint">体重を入れると、{kind === 'crouch' ? 'ブロックと' : ''}1歩ごとに地面を押した力を出します。値はこの端末にだけ残ります。</p> : <>
      {kind === 'crouch' && !height && <p className="sprint10-note">身長を入れると、前向きの力と力の向きも出ます（今は縦の力だけ）。</p>}
      {kind === 'run' && !pxPerM && <p className="sprint10-note">2本の線から距離が分からないため、縦の力だけを出しています。</p>}
      {top && <p className="sprint10-note">最高速度の区間では前向きの力はほぼ0になるのがふつうで、1歩ごとの前向きの値は測定のぶれ（体重の±0.2倍ほど）の範囲です。この区間では縦の力を見てください。</p>}
      <ul className="force-list">{moments.map(m => <li key={m.key}><button type="button" aria-pressed={shown?.key === m.key} onClick={() => pick(m.key)}>
        <strong>{m.label}</strong>
        <span>{m.horizontal !== null ? <>前へ <b>{times(m.horizontal, forces!.mass)}</b></> : '前へ —'}　縦 <b>{m.vertical !== null ? times(m.vertical, forces!.mass) : '—'}</b></span>
        {m.against && <em className={m.against.includes('小さい') || m.against.includes('ブレーキ') ? 'low' : 'ok'}>{m.against}</em>}</button></li>)}</ul>
      {shown && <div ref={picture} className="force-pic" aria-live="polite">
        <div className="force-pic-head"><strong>{shown.label}</strong>
          {shown.horizontal !== null && <span>前へ {times(shown.horizontal, forces!.mass)}</span>}{shown.vertical !== null && <span>縦 {times(shown.vertical, forces!.mass)}</span>}</div>
        {shown.origin && (images[shown.key] ? <img src={images[shown.key]} alt={`${shown.label}の押す力の矢印`} />
          : <div className="sprint10-phase-wait">{failed ? '画像を作れませんでした' : '画像を作成しています…'}</div>)}
        <p className="cr-key" aria-hidden="true"><span><i style={{ background: ARROW_COLOR }} />押す力（平均）</span>{shown.horizontal !== null && <span><i className="white" />前向き・縦</span>}</p>
        <dl className="force-values">
          {shown.angle !== null && <><dt>向き</dt><dd>地面から {Math.round(shown.angle)}°</dd></>}
          {shown.ratio !== null && <><dt>前向きの割合</dt><dd>{Math.round(shown.ratio * 100)}%</dd></>}
          {shown.study && <><dt>研究（前向き）</dt><dd>{shown.study}</dd></>}
          {shown.extra.map(([k, v]) => <Fragment key={k}><dt>{k}</dt><dd>{v}</dd></Fragment>)}
        </dl>
      </div>}
      <p className="sprint10-hint">体重の何倍の力で地面を押したか（1回の接地の平均）。研究は男子の値です（出し方は「数値の見方」）。</p>
    </>}
  </section>;
}

export const ARROW_COLOR = '#ffd23f';
/** The mean push as an arrow from the foot: forward along the run, up; its length a body weight to 0.8 of the leg
 * (hip to ankle at that moment) on the picture; with `parts`, its forward and upward parts dashed. */
function drawForceArrow(ctx: CanvasRenderingContext2D, to: (q: { x: number; y: number }) => { x: number; y: number }, origin: { x: number; y: number },
  pose: { x: number; y: number }[] | null, horizontal: number, vertical: number, weight: number, dir: number, unit: number, parts: boolean) {
  const o = to(origin);
  const hip = pose ? to({ x: (pose[23].x + pose[24].x) / 2, y: (pose[23].y + pose[24].y) / 2 }) : null;
  const leg = hip ? Math.max(unit * 12, Math.hypot(hip.x - o.x, hip.y - o.y)) : unit * 20;
  const k = .8 * leg / weight, dx = dir * horizontal * k, dy = -vertical * k;
  ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  if (parts) {
    ctx.setLineDash([unit * .8, unit * .6]); ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = unit * .35;
    ctx.beginPath(); ctx.moveTo(o.x, o.y); ctx.lineTo(o.x + dx, o.y); ctx.lineTo(o.x + dx, o.y + dy); ctx.moveTo(o.x, o.y); ctx.lineTo(o.x, o.y + dy); ctx.lineTo(o.x + dx, o.y + dy); ctx.stroke();
    ctx.setLineDash([]);
  }
  const head = unit * 2.2, a = Math.atan2(dy, dx);
  for (const [color, width] of [['rgba(8,18,16,.75)', unit * 1.5], [ARROW_COLOR, unit * .9]] as const) {
    ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = width;
    ctx.beginPath(); ctx.moveTo(o.x, o.y); ctx.lineTo(o.x + dx - Math.cos(a) * head * .6, o.y + dy - Math.sin(a) * head * .6); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(o.x + dx, o.y + dy);
    ctx.lineTo(o.x + dx - head * Math.cos(a - .45), o.y + dy - head * Math.sin(a - .45)); ctx.lineTo(o.x + dx - head * Math.cos(a + .45), o.y + dy - head * Math.sin(a + .45));
    ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}
