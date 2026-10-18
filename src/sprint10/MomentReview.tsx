import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { CrouchFrame } from './crouch';
import { legLength } from './contacts';
import type { Edits, ReviewEffect, ReviewMoment } from './moment-edits';
import { frameInterval, insideFrame } from './CrouchViews';
import './crouch-review.css';

/** Frames in the strip under the picture: the one chosen near the middle and four either side. */
const STRIP = 9;
/** The picture around the foot: this many leg lengths wide (4:3), the foot this far down it. */
const FOOT_LEGS = 1.6, FOOT_AT = .62;
/** Round a gate crossing: this many leg lengths wide, the pelvis in the middle (the trunk and the legs in view). */
const CROSS_LEGS = 2.4;
/** The set chosen by hand: this share of the picture's width round the start line (a 9 m wide view: about 4 m). */
const SET_VIEW = .45;
type View = 'foot' | 'all';

/** While a frame is chosen and not decided, leaving the check asks first: people forgot to press 「このコマに決める」, and
 * the frame they had chosen was dropped without a word on going to another moment or tab (the user, 2026-10-11:
 * 「それを押すのを忘れるっていう意見が出た…忘れないように点滅させるとか」). The check shown sets it. */
let leaveGuard: ((go: () => void) => boolean) | null = null;
/** Leave the check by `go` (another tab, or the check opened again): at once, or once the user has answered the check's
 * question about a frame chosen and not decided. */
export function leaveReview(go: () => void): void { if (!leaveGuard?.(go)) go(); }

/** Moments set by hand one after another (the crouch start's light mode, crouch-pick.ts; the user, 2026-10-16: 「動画を
 * アップロード→解析したい局面にフレームを自分で合わせる→そこだけAI解析」「今のアプリの手動修正と同じUIで調整する」): a
 * moment's `autoFrame` is the frame guessed for it (`guessed`), or where its search starts; the moments set are
 * `checked`. The frames are also searched with a slider and slow play, `guide` shows which frame to set (a sample
 * picture and a line), and there is no automatic judgment to go back to. */
export interface PickOptions {
  guide: (m: ReviewMoment) => ReactNode;
  guessed: (m: ReviewMoment) => boolean;
  /** The moments still to set after the list's, shown greyed in the row. */
  upcoming: readonly { key: string; short: string }[];
  /** A tap on the picture (normalized, at the frame shown): the long jump from the stands has the athlete tapped among others. */
  onTap?: (x: number, y: number, frame: number) => void;
  /** The narrowest enlarged view, as a share of the picture's width (else 0.15): an athlete far away is small. */
  zoom?: number;
  /** What setting the last moment leads to, said instead of going on to the next (the long jump from the stands: its result). */
  lastly?: string;
}
/** Slow play while frames are searched (pick): a quarter of the speed. */
const PLAY_RATE = .25;

/** The judged moments one at a time, with the foot enlarged: OK as judged, or another frame chosen (◀▶ or the strip)
 * and set; the values change at once. Made so a check of a whole start is a few taps (the user, 2026-10-06:
 * 「デザインUIも含めて操作が面倒に感じないように工夫してほしい」): the moments worth a look are marked, the buttons
 * are where the thumb is, and each decision goes on to the next moment. Shared by the events (the user, 2026-10-07:
 * 「他のモードにも同じように」): each gives its moments, what a frame would change, and the strip's bars. */
export function MomentReview({ url, frames, width: W, height: H, list, edits, checked, at, onAt, onSet, onRevert, onRevertAll, onDone, preview, down, source, doneText, doneLabel, note, leg: legGiven, point, pick }: {
  url: string; frames: readonly CrouchFrame[]; width: number; height: number;
  list: ReviewMoment[]; edits: Edits; checked: ReadonlySet<string>;
  at: string | null; onAt: (key: string) => void;
  /** A frame set for a moment (also when it is the one judged: confirmed), the moment back to the judged frame, all back. */
  onSet: (key: string, frame: number) => void; onRevert: (key: string) => void; onRevertAll: () => void;
  /** To the values, once every moment is checked. */
  onDone: () => void;
  /** The values that depend on the moment: as they are (`frame` = the moment's), or with `frame` set. */
  preview: (m: ReviewMoment, frame: number) => ReviewEffect[];
  /** The strip's bar for a frame: the foot down (true), up (false), not known (null); at a gate, the pelvis past the line. */
  down: (m: ReviewMoment, f: CrouchFrame) => boolean | null;
  /** What judged the moment, for its heading ('足元の画像', '骨格', …), or null. */
  source?: (m: ReviewMoment) => string | null;
  /** The closing note's text and its button's, once every moment is checked. */
  doneText?: string; doneLabel?: string;
  /** More about the moment as set, under the values (the throws: the release's speed and angle, searched for afterwards). */
  note?: (m: ReviewMoment) => ReactNode;
  /** The leg length (pixels) when the frames carry no pose (the 10 m keeps the pelvis and the legs' measures only). */
  leg?: number;
  /** A point marked in the frame shown (normalized), or null: the 10 m's pelvis as the pose has it. */
  point?: (m: ReviewMoment, frame: number) => { x: number; y: number } | null;
  /** The moments are set by hand one after another (PickOptions), not checked against a judgment. */
  pick?: PickOptions;
}) {
  const m = list.find(q => q.key === at) ?? list[0];
  const ordered = useMemo(() => [...frames].sort((a, b) => a.frame - b.frame), [frames]);
  const byFrame = useMemo(() => new Map(ordered.map(f => [f.frame, f])), [ordered]);
  const leg = useMemo(() => legGiven ?? legLength(frames.filter(f => f.pose), W, H), [legGiven, frames, W, H]);
  const interval = useMemo(() => frameInterval(frames), [frames]);
  const [cursor, setCursor] = useState(m?.frame ?? 0), [view, setView] = useState<View>('foot'), [marks, setMarks] = useState(true);
  // The cursor follows the moment's frame as set: another moment, a frame decided, or the moment (or all) put back to the
  // automatic one (after 「すべて自動に戻す」 it stayed on the old frame, and 「このコマに決める」 set that again).
  useEffect(() => { if (m) setCursor(m.frame); }, [m?.key, m?.frame]);   // eslint-disable-line react-hooks/exhaustive-deps
  // A moment stays between its neighbours of the same kind in time: a gate's crossing between the gates, a foot's moments
  // between the feet's (the 10 m lists both: a gate could not be moved past a touchdown near it, nor a touchdown past it).
  const peers = m ? list.filter(q => (q.kind === 'crossing') === (m.kind === 'crossing')) : [];
  const i = m ? peers.indexOf(m) : -1, lo = i > 0 ? peers[i - 1].frame : -Infinity, hi = i >= 0 && i + 1 < peers.length ? peers[i + 1].frame : Infinity;
  const allowed = (frame: number) => frame > lo && frame < hi && byFrame.has(frame);

  // The video: loaded once (Safari shows no picture until a video has played), then moved to the frame chosen.
  const video = useRef<HTMLVideoElement>(null), [ready, setReady] = useState(false);
  useEffect(() => {
    const v = video.current; if (!v) return;
    let closed = false; setReady(false);
    const prime = async () => { try { await v.play(); } catch { /* the picture may still come */ } v.pause(); if (!closed) setReady(true); };
    if (v.readyState >= 1) void prime(); else v.addEventListener('loadedmetadata', () => void prime(), { once: true });
    return () => { closed = true; };
  }, [url]);
  useEffect(() => {
    const v = video.current, f = byFrame.get(cursor); if (!v || !f || !ready) return;
    v.pause(); v.currentTime = insideFrame(f.pts, interval);
  }, [cursor, ready, byFrame, interval]);

  // Slow play (pick): the frame shown when it stops becomes the cursor (within the moment's neighbours). Only a stop of
  // this play counts: WebKit also told a pause after the video's first loading play, late, and the frame then shown took
  // the place of the one just chosen with the slider.
  const [playing, setPlaying] = useState(false), landed = useRef<(t: number) => void>(() => undefined), ours = useRef(false);
  landed.current = (t: number) => {
    let k = -1;
    for (let j = 0; j < ordered.length && ordered[j].pts <= t + 1e-4; j++) k = j;
    let f = ordered[Math.max(0, k)];
    if (f && !allowed(f.frame)) f = ordered.filter(q => allowed(q.frame)).reduce<CrouchFrame | undefined>((b, q) => !b || Math.abs(q.pts - t) < Math.abs(b.pts - t) ? q : b, undefined) ?? f;
    if (f) setCursor(f.frame);
  };
  useEffect(() => {
    const v = video.current; if (!v || !pick) return;
    const stopped = () => { if (!ours.current) return; ours.current = false; setPlaying(false); landed.current(v.currentTime); };
    const went = () => { if (v.paused) return; const next = ordered.find(q => q.pts > v.currentTime + 1e-4); if (next && !allowed(next.frame) && next.frame > cursor) v.pause(); };
    v.addEventListener('pause', stopped); v.addEventListener('ended', stopped); v.addEventListener('timeupdate', went);
    return () => { v.removeEventListener('pause', stopped); v.removeEventListener('ended', stopped); v.removeEventListener('timeupdate', went); };
  });
  const play = () => {
    const v = video.current; if (!v) return;
    if (!v.paused) { v.pause(); return; }
    v.defaultPlaybackRate = PLAY_RATE; v.playbackRate = PLAY_RATE; setPlaying(true); ours.current = true;
    void v.play().catch(() => { ours.current = false; setPlaying(false); });
  };

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
  const effects = useMemo(() => m ? preview(m, cursor) : [], [preview, m, cursor]);
  const candidate = !!m && cursor !== m.frame;
  // Set by hand (pick): a moment not set yet waits for its frame to be decided, also on the frame guessed (the button
  // blinks); going to another moment asks first only once a frame was chosen (candidate), not for an untouched guess.
  const undecided = !!pick && !!m && !checked.has(m.key);
  // A frame chosen and not decided: the button blinks with a line under the values, and going elsewhere (another moment,
  // another tab, the values) first asks whether to decide it. `leaving` is where the user was going.
  const [leaving, setLeaving] = useState<{ go: () => void } | null>(null), ask = useRef<HTMLDivElement>(null);
  useEffect(() => { setLeaving(null); }, [m?.key, candidate]);
  useEffect(() => {
    if (!candidate) return;
    const guard = (go: () => void) => { setLeaving({ go }); return true; };
    leaveGuard = guard;
    return () => { if (leaveGuard === guard) leaveGuard = null; };
  }, [candidate]);
  useEffect(() => { if (leaving) ask.current?.scrollIntoView?.({ block: 'center', behavior: 'smooth' }); }, [leaving]);
  const away = (go: () => void) => { if (candidate) setLeaving({ go }); else go(); };

  if (!m) return <p>確かめられる瞬間がありません。</p>;
  const judged = source?.(m) ?? null, crossing = m.kind === 'crossing', mark = crossing || pick ? point?.(m, cursor) ?? null : null;
  const region = regionOf(view, m, W, H, leg, pick?.zoom), box = {
    left: `${-region.x / region.w * 100}%`, top: `${-region.y / region.h * 100}%`, width: `${W / region.w * 100}%`, height: `${H / region.h * 100}%` };
  const unit = region.w / 100;
  const isSet = checked.has(m.key), guessed = !!pick && !isSet && pick.guessed(m);
  // The frame the strip and the heading count from: the judged one; set by hand, the one set, else the guess, else the cursor.
  const ref = !pick ? m.autoFrame : isSet ? m.frame : guessed ? m.autoFrame : cursor;
  const refName = !pick ? '自動' : isSet ? '選んだコマ' : guessed ? '予測' : '';
  const offset = cursor - ref, dt = (byFrame.get(cursor)?.pts ?? m.pts) - (byFrame.get(ref)?.pts ?? m.pts);
  const shift = `${offset > 0 ? '+' : ''}${offset}コマ（${dt > 0 ? '+' : ''}${dt.toFixed(3)}秒）`;
  const heading = !pick ? (offset === 0 ? `自動の判定${judged ? `（${judged}）` : ''}` : `自動より ${shift}`)
    : isSet ? (offset === 0 ? '選んだコマ' : `選んだコマより ${shift}`) : guessed ? (offset === 0 ? '予測したコマ' : `予測より ${shift}`) : '動画を動かして、このコマを探してください';
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
      {pick ? <span>選んだ瞬間 <b>{done}</b></span> : <span>確認 <b>{done}</b>/{list.length}</span>}
      {waiting > 0 ? <span className="warn">要確認 {waiting}</span> : !pick && done === list.length ? <span className="ok">すべて確認しました</span> : null}
      {!pick && Object.keys(edits).length > 0 && <span className="edited">直した {Object.keys(edits).length}</span>}
    </div>
    {!pick && done === list.length && <div className="crouch-review-done"><span>{doneText ?? 'すべての瞬間を確認しました。値は結果のすべての表示に反映されています。'}</span>
      <button type="button" onClick={() => away(onDone)}>{doneLabel ?? '歩ごとの値を見る'}</button></div>}
    <div ref={chips} className="sprint10-chips crouch-review-moments" role="group" aria-label="確かめる瞬間">{list.map(q => {
      const state = pick ? checked.has(q.key) ? 'ok' : q.flag ? 'warn' : '' : q.frame !== q.autoFrame ? 'edited' : checked.has(q.key) ? 'ok' : q.flag ? 'warn' : '';
      return <button key={q.key} type="button" aria-pressed={q.key === m.key} className={state} onClick={() => q.key === m.key ? undefined : away(() => onAt(q.key))}
        aria-label={`${q.label}${state === 'edited' ? '（直した）' : state === 'ok' ? pick ? '（選んだ）' : '（確認済み）' : state === 'warn' ? '（要確認）' : ''}`}>
        {state && <i aria-hidden="true">{state === 'edited' ? '✎' : state === 'ok' ? '✓' : '!'}</i>}{q.short}</button>;
    })}{pick?.upcoming.map(u => <button key={u.key} type="button" className="upcoming" disabled aria-label={`${u.short}（このあと選ぶ）`}>{u.short}</button>)}</div>
    <div className="crouch-review-head"><strong>{m.label}</strong>
      <small>{heading}</small></div>
    {pick?.guide(m)}
    {m.flag && !checked.has(m.key) && <p className="crouch-review-flag">{m.flag}</p>}
    <div className={pick?.onTap ? 'crouch-review-view tappable' : 'crouch-review-view'} onClick={pick?.onTap ? e => {
      // The tap's place in the picture: the view shows `region`, the box fills the view (the tools in it are left out).
      if ((e.target as HTMLElement).closest('.crouch-review-tools')) return;
      const r = e.currentTarget.getBoundingClientRect();
      if (!r.width || !r.height) return;
      pick.onTap!((region.x + (e.clientX - r.left) / r.width * region.w) / W, (region.y + (e.clientY - r.top) / r.height * region.h) / H, cursor);
    } : undefined}>
      <video ref={video} src={url} muted playsInline preload="auto" style={box} />
      {marks && <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={box} aria-hidden="true">
        {m.ground !== null && <line x1={region.x} x2={region.x + region.w} y1={m.ground * H} y2={m.ground * H} stroke="#7dff6b" strokeWidth={unit * .5} strokeDasharray={`${unit * 2} ${unit * 1.5}`} />}
        {m.kind === 'clearance' && m.focus && <line x1={m.focus.x * W} x2={m.focus.x * W} y1={region.y} y2={region.y + region.h} stroke="#7dff6b" strokeWidth={unit * .5} strokeDasharray={`${unit * 2} ${unit * 1.5}`} />}
        {/* Where the foot is set down: the place the toe stood through the contact (the median over its frames), which does
            not wander as a single frame's toe point does (the user, 2026-10-06: 「つま先がズレてるんだよね。フレームによっては
            ぜんぜんズレてる」: 7-23 px while the foot stood still, jumps of 65-150 px). */}
        {!pick && m.kind !== 'clearance' && m.focus && m.ground !== null && <path fill="#7dff6b" stroke="#0c1816" strokeWidth={unit * .25}
          d={`M${m.focus.x * W},${m.ground * H + unit * .6}l${unit * 1.5},${unit * 2.6}h${-unit * 3}z`} />}
        {m.kind === 'release' && m.focus && <circle cx={m.focus.x * W} cy={m.focus.y * H} r={unit * 2.2} fill="none" stroke="#ffd400" strokeWidth={unit * .5} />}
        {/* A gate: its line as on the player, and the pelvis of the frame shown as the pose has it. */}
        {crossing && m.focus && <>
          <line x1={m.focus.x * W} x2={m.focus.x * W} y1={region.y} y2={region.y + region.h} stroke="#0c1816" strokeOpacity={.55} strokeWidth={unit * 1.1} />
          <line x1={m.focus.x * W} x2={m.focus.x * W} y1={region.y} y2={region.y + region.h} stroke={m.color ?? '#7dff6b'} strokeWidth={unit * .55} /></>}
        {mark && <circle cx={mark.x * W} cy={mark.y * H} r={unit * 1.3} fill="#ffd400" stroke="#0c1816" strokeWidth={unit * .35} />}
      </svg>}
      <div className="crouch-review-tools">
        <div className="sprint10-seg" role="group" aria-label="表示の範囲">{([['foot', m.kind === 'release' ? '手元' : crossing ? '腰まわり' : '足元'], ['all', '全体']] as const).map(([id, label]) =>
          <button key={id} type="button" aria-pressed={view === id} onClick={() => setView(id)}>{label}</button>)}</div>
        <label><input type="checkbox" checked={marks} onChange={e => setMarks(e.target.checked)} />目印</label>
      </div>
    </div>
    <div className="crouch-review-strip" role="group" aria-label="コマを選ぶ">{strip.map(f => {
      const off = f.frame - ref, isDown = down(m, f);
      const zero = !pick ? '自動の判定' : isSet ? '選んだコマ' : guessed ? '予測したコマ' : '今のコマ', from = refName || '今のコマ';
      return <button key={f.frame} type="button" disabled={!allowed(f.frame)} aria-current={f.frame === cursor}
        className={(!pick ? [f.frame === m.autoFrame ? 'auto' : '', f.frame === m.frame && m.frame !== m.autoFrame ? 'set' : '']
          : [guessed && f.frame === m.autoFrame ? 'auto' : '', isSet && f.frame === m.frame ? 'set' : '']).join(' ').trim() || undefined}
        aria-label={`${off === 0 ? zero : `${from}より${off > 0 ? '+' : ''}${off}コマ`}${isDown === null ? '' : crossing ? isDown ? '（線を越えている）' : '（線の手前）' : isDown ? '（足が着いている）' : '（足が離れている）'}`}
        onClick={() => setCursor(f.frame)}>
        <span>{off === 0 ? (!pick ? '自動' : isSet ? '選択' : guessed ? '予測' : '・') : off > 0 ? `+${off}` : off}</span><i className={isDown === null ? undefined : isDown ? 'down' : 'up'} /></button>;
    })}</div>
    {pick && <div className="crouch-review-scrub">
      <button type="button" aria-label={playing ? '一時停止' : 'スロー再生（1/4）'} onClick={play}>{playing ? '❚❚' : '▶'}</button>
      <input type="range" aria-label="動画のコマの位置" min={0} max={Math.max(0, ordered.length - 1)} step={1}
        value={Math.max(0, ordered.findIndex(f => f.frame === cursor))}
        onChange={e => { const f = ordered[Number(e.target.value)]; if (f && allowed(f.frame)) setCursor(f.frame); }} />
      <span>{(byFrame.get(cursor)?.pts ?? 0).toFixed(2)}秒</span>
    </div>}
    {pick ? m.focus && <p className="crouch-review-legend">{m.kind === 'clearance' ? '縦の点線は、構えのコマで見た前の足の位置です。'
      : m.kind === 'set' ? '拡大は、スタートラインのまわりです。選手が見えなければ「全体」で見てください。'
      : m.ground !== null ? '点線は床の目安（前の接地の足の高さ）です。' : '拡大は、ここまでの足の位置から見た目安です。足が見えなければ「全体」で見てください。'}</p>
    : <p className="crouch-review-legend">{m.kind === 'release' ? '黄色の丸は、自動の判定のコマで骨格が捉えた投げる手（目安）。投げる物が手から離れたコマを選んでください。'
      : crossing ? `縦の線は${m.short}の線、黄色の点は骨格が捉えた骨盤中心（目安）。帯の緑は、骨盤中心が線を越えているコマ（骨格から見た目安）。映像の腰を見て、線を越えた最初のコマを選んでください。`
      : <>{m.kind === 'clearance' ? '点線は前のブロックの足の位置。' : '点線は床、▲は足が着く場所。'}帯の緑は、{judged === '足元の画像'
        ? `足元の画像で${m.kind === 'clearance' ? '足がブロックにある' : '靴が着いている'}コマ` : `骨格から見て${m.kind === 'clearance' ? '足がブロックの位置にある' : '足先が床の高さにある'}コマ（目安）`}。映像の靴と床を見て決めてください。</>}</p>}
    {effects.length > 0 && <ul className="crouch-review-effect" aria-live="polite">{effects.map(e => <li key={e.label}>
      <span>{e.label}</span>{candidate || undecided ? pick && e.from === null ? <b>{fixed(e.to, e.digits)}</b> : <><s>{fixed(e.from, e.digits)}</s>→<b>{fixed(e.to, e.digits)}</b></> : <b>{fixed(e.from, e.digits)}</b>}<small>{e.unit}</small></li>)}</ul>}
    {note?.(m)}
    {candidate && (leaving
      ? <div ref={ask} className="crouch-review-ask"><p role="alert">選んだコマをまだ決めていません。決めてから移りますか？</p>
        <div><button type="button" className="sprint10-primary" onClick={() => { const { go } = leaving; decide(); go(); }}>決めて移る</button>
          <button type="button" onClick={() => { const { go } = leaving; setLeaving(null); go(); }}>決めずに移る</button>
          <button type="button" onClick={() => setLeaving(null)}>キャンセル</button></div></div>
      : <p className="crouch-review-pending" role="status">{pick ? `まだ決めていません。合っていれば「このコマに決める」を押すと、${pick.lastly && !pick.upcoming.length && !isSet ? pick.lastly : '次の瞬間へ進みます'}。` : 'まだ決めていません。「このコマに決める」を押すと数値に入ります。'}</p>)}
    <div className="crouch-review-actions">
      <button type="button" aria-label="1コマ戻る" onClick={() => step(-1)}>◀</button>
      <button type="button" className={candidate || undecided ? 'sprint10-primary pending' : 'sprint10-primary'} onClick={decide}>{cursor === m.frame && (!pick || isSet) ? 'OK・次へ' : 'このコマに決める'}</button>
      <button type="button" aria-label="1コマ進む" onClick={() => step(1)}>▶</button>
    </div>
    {!pick && <div className="crouch-review-more">
      {/* Back to the automatic frame only where it keeps the order (a neighbour moved past it would come after it). */}
      {m.frame !== m.autoFrame && (allowed(m.autoFrame)
        ? <button type="button" onClick={() => onRevert(m.key)}>この瞬間を自動の判定に戻す</button>
        : <small>隣の瞬間を直したため、この瞬間は自動の判定に戻せません（先に隣を戻してください）。</small>)}
      {Object.keys(edits).length > 0 && <button type="button" onClick={onRevertAll}>すべて自動に戻す</button>}
    </div>}
  </div>;
}

/** The part of the picture shown (pixels, 4:3): round the foot (the hand, the pelvis at a gate), or the whole picture fitted
 * in; the enlarged view at least `zoom` of the picture's width. */
function regionOf(view: View, m: ReviewMoment, W: number, H: number, leg: number, zoom = .15) {
  // The set chosen by hand (pick): round the start line, before anyone was found (SET_VIEW of a landscape picture).
  if (view !== 'all' && m.kind === 'set' && m.focus && W > H) {
    const w = SET_VIEW * W, h = w * 3 / 4;
    return { x: Math.max(0, Math.min(W - w, m.focus.x * W - w / 2)), y: Math.max(0, Math.min(H - h, m.focus.y * H - h / 2)), w, h };
  }
  if (view === 'all' || !m.focus || !(leg > 0)) {
    const w = W / H > 4 / 3 ? W : H * 4 / 3, h = w * 3 / 4;
    return { x: (W - w) / 2, y: (H - h) / 2, w, h };
  }
  const w = Math.min(Math.max((m.kind === 'crossing' ? CROSS_LEGS : FOOT_LEGS) * leg, zoom * W), W, H * 4 / 3), h = w * 3 / 4;
  const x = Math.max(0, Math.min(W - w, m.focus.x * W - w / 2)), y = Math.max(0, Math.min(H - h, m.focus.y * H - h * (m.kind === 'release' || m.kind === 'crossing' ? .5 : FOOT_AT)));
  return { x, y, w, h };
}
