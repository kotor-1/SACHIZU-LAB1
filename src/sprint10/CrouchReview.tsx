import { useEffect, useMemo, useRef, useState } from 'react';
import type { CrouchFrame, CrouchResult } from './crouch';
import { legLength } from './contacts';
import { applyEdits, effectsOf, footDown, type Edits, type Moment } from './crouch-edit';
import { frameInterval, insideFrame } from './CrouchViews';
import './crouch-review.css';

/** Frames in the strip under the picture: the one chosen near the middle and four either side. */
const STRIP = 9;
/** The picture around the foot: this many leg lengths wide (4:3), the foot this far down it. */
const FOOT_LEGS = 1.6, FOOT_AT = .62;
type View = 'foot' | 'all';

/** The judged moments one at a time, with the foot enlarged: OK as judged, or another frame chosen (◀▶ or the strip)
 * and set; the values change at once. Made so a check of a whole start is a few taps (the user, 2026-10-06:
 * 「デザインUIも含めて操作が面倒に感じないように工夫してほしい」): the moments worth a look are marked, the buttons
 * are where the thumb is, and each decision goes on to the next moment. */
export function CrouchReview({ url, frames, width: W, height: H, auto, result, list, edits, checked, at, onAt, onSet, onRevert, onRevertAll, onDone }: {
  url: string; frames: readonly CrouchFrame[]; width: number; height: number;
  /** The automatic result and the result with the user's frames. */
  auto: CrouchResult; result: CrouchResult; list: Moment[]; edits: Edits; checked: ReadonlySet<string>;
  at: string | null; onAt: (key: string) => void;
  /** A frame set for a moment (also when it is the one judged: confirmed), the moment back to the judged frame, all back. */
  onSet: (key: string, frame: number) => void; onRevert: (key: string) => void; onRevertAll: () => void;
  /** To the values, once every moment is checked. */
  onDone: () => void;
}) {
  const m = list.find(q => q.key === at) ?? list[0];
  const ordered = useMemo(() => [...frames].sort((a, b) => a.frame - b.frame), [frames]);
  const byFrame = useMemo(() => new Map(ordered.map(f => [f.frame, f])), [ordered]);
  const leg = useMemo(() => legLength(frames.filter(f => f.pose), W, H), [frames, W, H]);
  const interval = useMemo(() => frameInterval(frames), [frames]);
  const [cursor, setCursor] = useState(m?.frame ?? 0), [view, setView] = useState<View>('foot'), [marks, setMarks] = useState(true);
  useEffect(() => { if (m) setCursor(m.frame); }, [m?.key]);   // eslint-disable-line react-hooks/exhaustive-deps
  // A moment stays between its neighbours in time.
  const i = m ? list.indexOf(m) : -1, lo = i > 0 ? list[i - 1].frame : -Infinity, hi = i >= 0 && i + 1 < list.length ? list[i + 1].frame : Infinity;
  const allowed = (frame: number) => frame > lo && frame < hi && byFrame.has(frame);

  // The video: loaded once (Safari shows no picture until a video has played), then moved to the frame chosen.
  const video = useRef<HTMLVideoElement>(null), [ready, setReady] = useState(false), [shown, setShown] = useState<number | null>(null);
  useEffect(() => {
    const v = video.current; if (!v) return;
    let closed = false; setReady(false);
    const prime = async () => { try { await v.play(); } catch { /* the picture may still come */ } v.pause(); if (!closed) setReady(true); };
    if (v.readyState >= 1) void prime(); else v.addEventListener('loadedmetadata', () => void prime(), { once: true });
    return () => { closed = true; };
  }, [url]);
  useEffect(() => {
    const v = video.current, f = byFrame.get(cursor); if (!v || !f || !ready) return;
    const done = () => setShown(f.frame);
    v.addEventListener('seeked', done, { once: true });
    v.pause(); v.currentTime = insideFrame(f.pts, interval);
    return () => v.removeEventListener('seeked', done);
  }, [cursor, ready, byFrame, interval]);

  // The strip: STRIP frames round the cursor, moved only when the cursor reaches its ends.
  const [first, setFirst] = useState(0);
  useEffect(() => {
    const k = ordered.findIndex(f => f.frame === cursor); if (k < 0) return;
    setFirst(s => k <= s || k >= s + STRIP - 1 ? Math.max(0, Math.min(ordered.length - STRIP, k - (STRIP >> 1))) : s);
  }, [cursor, ordered]);
  useEffect(() => {   // a new moment: its frame in the middle
    const k = m ? ordered.findIndex(f => f.frame === m.frame) : -1;
    if (k >= 0) setFirst(Math.max(0, Math.min(ordered.length - STRIP, k - (STRIP >> 1))));
  }, [m?.key, ordered]);   // eslint-disable-line react-hooks/exhaustive-deps
  const strip = ordered.slice(first, first + STRIP);

  // The moment's button kept in view in its sideways row.
  const chips = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const row = chips.current, chip = row?.querySelector<HTMLElement>('button[aria-pressed=true]');
    if (row && chip) row.scrollTo({ left: chip.offsetLeft - (row.clientWidth - chip.offsetWidth) / 2, behavior: 'smooth' });
  }, [m?.key]);
  // What the frame under the cursor would change.
  const candidate = useMemo(() => m && cursor !== m.frame ? applyEdits(auto, { ...edits, [m.key]: cursor }, frames, W, H) : null, [auto, edits, m, cursor, frames, W, H]);
  const effects = m ? effectsOf(result, candidate ?? result, m) : [];

  if (!m) return <p>確かめられる瞬間がありません。</p>;
  const region = regionOf(view, m, W, H, leg), box = {
    left: `${-region.x / region.w * 100}%`, top: `${-region.y / region.h * 100}%`, width: `${W / region.w * 100}%`, height: `${H / region.h * 100}%` };
  const pose = byFrame.get(shown ?? cursor)?.pose ?? null, unit = region.w / 100;
  const offset = cursor - m.autoFrame, dt = (byFrame.get(cursor)?.pts ?? m.pts) - (byFrame.get(m.autoFrame)?.pts ?? m.pts);
  const step = (by: number) => { const k = ordered.findIndex(f => f.frame === cursor), next = ordered[k + by]; if (next && allowed(next.frame)) setCursor(next.frame); };
  const decide = () => onSet(m.key, cursor);
  const done = list.filter(q => checked.has(q.key)).length, waiting = list.filter(q => q.flag && !checked.has(q.key)).length;
  const fixed = (v: number | null, d: number) => v === null ? '—' : v.toFixed(d);

  return <div className="crouch-review" onKeyDown={e => {
    if (e.target instanceof HTMLInputElement) return;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); step(e.key === 'ArrowLeft' ? -1 : 1); }
    else if (e.key === 'Enter' && e.target === e.currentTarget) { e.preventDefault(); decide(); }
  }} tabIndex={-1}>
    <div className="crouch-review-progress" aria-live="polite">
      <span>確認 <b>{done}</b>/{list.length}</span>
      {waiting > 0 ? <span className="warn">要確認 {waiting}</span> : done === list.length ? <span className="ok">すべて確認しました</span> : null}
      {Object.keys(edits).length > 0 && <span className="edited">直した {Object.keys(edits).length}</span>}
    </div>
    {done === list.length && <div className="crouch-review-done"><span>すべての瞬間を確認しました。値は「ポイント」「歩ごと」に反映されています。</span>
      <button type="button" onClick={onDone}>歩ごとの値を見る</button></div>}
    <div ref={chips} className="sprint10-chips crouch-review-moments" role="group" aria-label="確かめる瞬間">{list.map(q => {
      const state = q.frame !== q.autoFrame ? 'edited' : checked.has(q.key) ? 'ok' : q.flag ? 'warn' : '';
      return <button key={q.key} type="button" aria-pressed={q.key === m.key} className={state} onClick={() => onAt(q.key)}
        aria-label={`${q.label}${state === 'edited' ? '（直した）' : state === 'ok' ? '（確認済み）' : state === 'warn' ? '（要確認）' : ''}`}>
        {state && <i aria-hidden="true">{state === 'edited' ? '✎' : state === 'ok' ? '✓' : '!'}</i>}{q.short}</button>;
    })}</div>
    <div className="crouch-review-head"><strong>{m.label}</strong>
      <small>{offset === 0 ? '自動の判定' : `自動より ${offset > 0 ? '+' : ''}${offset}コマ（${dt > 0 ? '+' : ''}${dt.toFixed(3)}秒）`}</small></div>
    {m.flag && !checked.has(m.key) && <p className="crouch-review-flag">{m.flag}</p>}
    <div className="crouch-review-view">
      <video ref={video} src={url} muted playsInline preload="auto" style={box} />
      {marks && <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={box} aria-hidden="true">
        {m.ground !== null && <line x1={region.x} x2={region.x + region.w} y1={m.ground * H} y2={m.ground * H} stroke="#7dff6b" strokeWidth={unit * .5} strokeDasharray={`${unit * 2} ${unit * 1.5}`} />}
        {m.kind === 'clearance' && m.focus && <line x1={m.focus.x * W} x2={m.focus.x * W} y1={region.y} y2={region.y + region.h} stroke="#7dff6b" strokeWidth={unit * .5} strokeDasharray={`${unit * 2} ${unit * 1.5}`} />}
        {pose && [31, 32].map(k => pose[k] && <circle key={k} cx={pose[k].x * W} cy={pose[k].y * H} r={unit * 1.3} fill="none"
          stroke="#ffd400" strokeWidth={unit * .45} opacity={(pose[k].visibility ?? 1) < .5 ? .45 : .95} />)}
      </svg>}
      <div className="crouch-review-tools">
        <div className="sprint10-seg" role="group" aria-label="表示の範囲">{([['foot', '足元'], ['all', '全体']] as const).map(([id, label]) =>
          <button key={id} type="button" aria-pressed={view === id} onClick={() => setView(id)}>{label}</button>)}</div>
        <label><input type="checkbox" checked={marks} onChange={e => setMarks(e.target.checked)} />目印</label>
      </div>
    </div>
    <div className="crouch-review-strip" role="group" aria-label="コマを選ぶ">{strip.map(f => {
      const off = f.frame - m.autoFrame, down = footDown(f, m, W, H, leg);
      return <button key={f.frame} type="button" disabled={!allowed(f.frame)} aria-current={f.frame === cursor}
        className={[f.frame === m.autoFrame ? 'auto' : '', f.frame === m.frame && m.frame !== m.autoFrame ? 'set' : ''].join(' ').trim() || undefined}
        aria-label={`${off === 0 ? '自動の判定' : `自動より${off > 0 ? '+' : ''}${off}`}コマ${down === null ? '' : down ? '（足先が床）' : '（足先が離れている）'}`}
        onClick={() => setCursor(f.frame)}>
        <span>{off === 0 ? '自動' : off > 0 ? `+${off}` : off}</span><i className={down === null ? undefined : down ? 'down' : 'up'} /></button>;
    })}</div>
    <p className="crouch-review-legend">帯：緑＝{m.kind === 'clearance' ? '足がブロックの位置' : '足先が床の高さ'}（骨格から見た目安）。黄色の丸は足先の点です。</p>
    {effects.length > 0 && <ul className="crouch-review-effect" aria-live="polite">{effects.map(e => <li key={e.label}>
      <span>{e.label}</span>{candidate ? <><s>{fixed(e.from, e.digits)}</s>→<b>{fixed(e.to, e.digits)}</b></> : <b>{fixed(e.from, e.digits)}</b>}<small>{e.unit}</small></li>)}</ul>}
    <div className="crouch-review-actions">
      <button type="button" aria-label="1コマ戻る" onClick={() => step(-1)}>◀</button>
      <button type="button" className="sprint10-primary" onClick={decide}>{cursor === m.frame ? 'OK・次へ' : 'このコマに決める'}</button>
      <button type="button" aria-label="1コマ進む" onClick={() => step(1)}>▶</button>
    </div>
    <div className="crouch-review-more">
      {m.frame !== m.autoFrame && <button type="button" onClick={() => { onRevert(m.key); setCursor(m.autoFrame); }}>この瞬間を自動の判定に戻す</button>}
      {Object.keys(edits).length > 0 && <button type="button" onClick={onRevertAll}>すべて自動に戻す</button>}
    </div>
  </div>;
}

/** The part of the picture shown (pixels, 4:3): round the foot, or the whole picture fitted in. */
function regionOf(view: View, m: Moment, W: number, H: number, leg: number) {
  if (view === 'all' || !m.focus || !(leg > 0)) {
    const w = W / H > 4 / 3 ? W : H * 4 / 3, h = w * 3 / 4;
    return { x: (W - w) / 2, y: (H - h) / 2, w, h };
  }
  const w = Math.min(Math.max(FOOT_LEGS * leg, .15 * W), W, H * 4 / 3), h = w * 3 / 4;
  const x = Math.max(0, Math.min(W - w, m.focus.x * W - w / 2)), y = Math.max(0, Math.min(H - h, m.focus.y * H - h * FOOT_AT));
  return { x, y, w, h };
}
