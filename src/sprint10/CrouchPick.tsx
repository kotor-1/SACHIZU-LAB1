import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { untilAborted } from '../cmj/session-lifecycle';
import { demuxMP4 } from '../frame-engine/mp4-demuxer';
import type { CrouchFrame } from './crouch';
import { USUAL } from './crouch-edit';
import { focusOf, framesFor, framesToLook, guessFrame, hipGuess, layoutOf, nextPick, pickedEnough, pickedSteps, pickEffects, pickTime,
  PICK_STEPS, type Picks, type PickStep } from './crouch-pick';
import { PickPoses, type FoundPose } from './crouch-pick-poses';
import { PickGuide } from './CrouchPickGuide';
import { frameInterval } from './frame-seek';
import type { ReviewMoment } from './moment-edits';
import { MomentReview } from './MomentReview';
import { READ_LIMIT_BYTES } from './recording';
import './crouch-pick.css';

/** The crouch start's light mode on screen (crouch-pick.ts): the user sets each moment's frame with the check's controls
 * (MomentReview), a sample picture says which frame, the next touchdown and toe-off are guessed, and the pose models
 * look only at the frames set, one after another while the user goes on. */
export type PickPhase = 'idle' | 'loading' | 'picking' | 'finishing' | 'done' | 'failed';
/** The moments shown greyed after the one being set. */
const UPCOMING = 3;

export function usePick(file: File | null, url: string) {
  const [phase, setPhase] = useState<PickPhase>('idle'), [status, setStatus] = useState('');
  const [timeline, setTimeline] = useState<CrouchFrame[] | null>(null), [size, setSize] = useState<{ width: number; height: number } | null>(null);
  const [picks, setPicks] = useState<Picks>({}), [at, setAt] = useState<string | null>(null), [startFrame, setStartFrame] = useState(0);
  const [found, setFound] = useState<ReadonlyMap<number, FoundPose>>(new Map()), [asked, setAsked] = useState<ReadonlySet<number>>(new Set());
  const poses = useRef<PickPoses | null>(null), owner = useRef<AbortController | null>(null), line = useRef(.5), askedNow = useRef(new Set<number>());
  // How long the models took to be made (ms from the start), for the checks on slow phones (data-ready-ms).
  const [readyMs, setReadyMs] = useState<number | null>(null);
  // The latest state for the models' hints: a frame's turn may come after more moments were set and found.
  const latest = useRef({ picks, found, timeline, size }); latest.current = { picks, found, timeline, size };
  const reset = useCallback(() => {
    owner.current?.abort(); owner.current = null; poses.current?.dispose(); poses.current = null;
    setPhase('idle'); setStatus(''); setTimeline(null); setSize(null); setPicks({}); setAt(null); setFound(new Map()); setAsked(new Set()); askedNow.current = new Set();
  }, []);
  useEffect(() => reset, [url, reset]);
  // Every frame, with the poses found at the frames the moments now use (a moment set again leaves its old frames out).
  const frames = useMemo(() => {
    if (!timeline) return [];
    const keep = new Set(framesToLook(picks, timeline));
    return timeline.map(f => { const p = keep.has(f.frame) ? found.get(f.frame) : undefined; return p ? { ...f, pose: p.pose, refined: p.refined } : f; });
  }, [timeline, picks, found]);
  const pending = useMemo(() => new Set([...asked].filter(f => !found.has(f))), [asked, found]), waiting = pending.size;
  useEffect(() => { if (phase === 'finishing' && !waiting) setPhase('done'); }, [phase, waiting]);

  /** Starts: the video's frames (their times only), the models made while the user looks for the set. */
  async function begin(startTime: number, startX: number) {
    if (!file || !url) return;
    reset();
    const control = new AbortController(); owner.current = control; line.current = startX; setReadyMs(null);
    const began = performance.now();
    setPhase('loading'); setStatus('動画のコマを読み込んでいます。');
    try {
      if (file.size > READ_LIMIT_BYTES) throw new Error('200MB以内のMP4 / MOVを選んでください（写真アプリで、解析する部分だけに短くすると読み込めます）。');
      const d = await untilAborted(demuxMP4(file), control.signal);
      const span = d.frames.length ? d.frames.at(-1)!.pts - d.frames[0].pts : 0;
      if (!d.frames.length || d.frames.length > 3600 || span > 30) throw new Error('1走分・30秒以内・3600フレーム以内の動画を選んでください。');
      const list: CrouchFrame[] = d.frames.map(f => ({ frame: f.frameIndex, pts: f.pts, pose: null }));
      const made = new PickPoses(url, frameInterval(list), control.signal, text => { if (!control.signal.aborted) setStatus(text); });
      poses.current = made;
      made.whenReady().then(() => { if (!control.signal.aborted) { setStatus(''); setReadyMs(Math.round(performance.now() - began)); } },
        e => { if (!control.signal.aborted) setStatus(e instanceof Error ? e.message : String(e)); });
      void made.size().then(s => { if (!control.signal.aborted) setSize(s); }, () => undefined);
      const near = list.reduce((b, f) => Math.abs(f.pts - startTime) < Math.abs(b.pts - startTime) ? f : b, list[0]);
      setTimeline(list); setStartFrame(near.frame); setAt('set'); setPhase('picking');
    } catch (e) {
      if (control.signal.aborted) return;
      setPhase('failed'); setStatus(e instanceof Error ? e.message : String(e));
    }
  }
  /** A moment's frame set: the models look at its frames, and the next moment comes. */
  function decide(key: string, frame: number) {
    const tl = latest.current.timeline, made = poses.current;
    if (!tl || !made) return;
    const next = { ...latest.current.picks, [key]: frame };
    setPicks(next);
    const ask = framesFor(key, frame, tl).filter(f => !askedNow.current.has(f));
    ask.forEach(f => askedNow.current.add(f));
    if (ask.length) setAsked(new Set(askedNow.current));
    for (const f of ask) {
      const pts = tl.find(q => q.frame === f)!.pts;
      made.look(pts, () => {
        const { picks: p, found: fd, timeline: t, size: s } = latest.current;
        if (!t || !s) return line.current;
        const now = t.map(q => { const r = fd.get(q.frame); return r ? { ...q, pose: r.pose, refined: r.refined } : q; });
        return hipGuess(key, layoutOf(p, now, s.width, s.height), s.width, s.height) ?? line.current;
      }).then(r => setFound(m => new Map(m).set(f, r)), () => setFound(m => new Map(m).set(f, { pose: null, refined: null })));
    }
    setAt(nextPick(next)?.key ?? key);
  }
  /** The result once the models have looked at every frame set. */
  function finish() { if (pickedEnough(latest.current.picks)) setPhase(waiting ? 'finishing' : 'done'); }
  return { phase, status, frames, size, picks, at, setAt, startFrame, waiting, pending, looked: found.size, begin, decide, finish, reset, line: line.current, readyMs,
    backend: poses.current?.backend ?? null, took: poses.current?.took ?? [] };
}
export type PickSession = ReturnType<typeof usePick>;

/** Times out of the usual range, said at both their ends (as the check's moments, crouch-edit.ts). */
function flagsOf(picks: Picks, frames: readonly CrouchFrame[]): Map<string, string> {
  const out = new Map<string, string>(), t = (k: string) => pickTime(k, picks, frames), s = (v: number) => `${v.toFixed(3)}秒`;
  const flag = (keys: string[], text: string) => keys.forEach(k => { if (picks[k] !== undefined && !out.has(k)) out.set(k, text); });
  const span = (a: string, b: string) => { const x = t(a), y = t(b); return x === null || y === null ? null : y - x; };
  const first = span('clearance', 'td1');
  if (first !== null && (first < USUAL.first[0] || first > USUAL.first[1])) flag(['clearance', 'td1'], `ブロックを離れてから1歩目の接地まで ${s(first)}：ふつうは${USUAL.first[0]}〜${USUAL.first[1]}秒です。`);
  for (const st of PICK_STEPS) {
    if (st.kind !== 'touchdown') continue;
    const n = st.step!, contact = span(`td${n}`, `to${n}`), flight = span(`to${n}`, `td${n + 1}`);
    if (contact !== null && (contact < USUAL.contact[0] || contact > USUAL.contact[1])) flag([`td${n}`, `to${n}`], `${n}歩目の接地時間 ${s(contact)}：ふつうは${USUAL.contact[0]}〜${USUAL.contact[1]}秒です。`);
    if (flight !== null && (flight < USUAL.flight[0] || flight > USUAL.flight[1])) flag([`to${n}`, `td${n + 1}`], `${n}歩目の後の滞空時間 ${s(flight)}：ふつうは${USUAL.flight[0]}〜${USUAL.flight[1]}秒です。`);
  }
  return out;
}

/** The moments set and the one to set next, with the check's controls; `onFinish` (while picking) to the result. */
export function PickView({ session: s, url, onFinish }: { session: PickSession; url: string; onFinish?: () => void }) {
  const { frames, picks, size } = s, W = size?.width ?? 0, H = size?.height ?? 0;
  const layout = useMemo(() => W ? layoutOf(picks, frames, W, H) : null, [picks, frames, W, H]);
  const done = pickedSteps(picks), next = nextPick(picks);
  // The next moment's frame: guessed from the moments before, or (the set, the clearance) where the search starts; a
  // touchdown or toe-off guessed past the end of the video is not in it.
  const guess = next ? guessFrame(next.key, picks, frames) : null;
  const start = !next ? null : next.kind === 'set' ? s.startFrame : next.kind === 'clearance'
    ? frames[Math.min(frames.length - 1, frames.findIndex(f => f.frame === picks.set) + 1)]?.frame ?? null : guess;
  const ended = !!next && next.step !== null && start === null;
  const flags = useMemo(() => flagsOf(picks, frames), [picks, frames]);
  const moment = (st: PickStep, frame: number): ReviewMoment => {
    const f = frames.find(q => q.frame === frame), place = layout ? focusOf(st.key, layout, W, H) : { focus: null, ground: null };
    // The set: round the start line (the athlete's hands are on it), the athlete's middle a little below the picture's.
    if (st.kind === 'set') place.focus = { x: s.line, y: .58 };
    return { key: st.key, kind: st.kind, step: st.step, label: st.label, short: st.short, frame, pts: f?.pts ?? 0, autoFrame: frame,
      focus: place.focus, ground: place.ground, flag: flags.get(st.key) ?? null };
  };
  const list = [...done.map(st => moment(st, picks[st.key])), ...(next && start !== null ? [moment(next, start)] : [])];
  const checked = useMemo(() => new Set(done.map(st => st.key)), [done.map(st => st.key).join()]);   // eslint-disable-line react-hooks/exhaustive-deps
  const upcoming = PICK_STEPS.slice(PICK_STEPS.findIndex(st => st.key === next?.key) + 1).slice(0, next && !ended ? UPCOMING : 0)
    .map(st => ({ key: st.key, short: st.short }));
  const at = list.some(m => m.key === s.at) ? s.at : list.at(-1)?.key ?? null;
  const preview = useCallback((m: ReviewMoment, frame: number) => pickEffects(picks, m.key, frame, frames), [picks, frames]);
  if (!frames.length || !W) return <p role="status">{s.status || '動画を読み込んでいます。'}</p>;
  // The models' times in the page (data-…) for the checks on slow phones: when they were ready, each frame's time.
  return <div className="pick-view" data-ready-ms={s.readyMs ?? undefined} data-took-ms={s.took.map(Math.round).join(',') || undefined}>
    <MomentReview url={url} frames={frames} width={W} height={H} list={list} edits={{}} checked={checked} at={at} onAt={s.setAt}
      onSet={s.decide} onRevert={() => undefined} onRevertAll={() => undefined} onDone={() => undefined} preview={preview} down={() => null}
      leg={layout?.leg} pick={{ guide: m => <PickGuide m={m} />, guessed: m => m.key === next?.key && guess !== null, upcoming }} />
    {ended && <p className="sprint10-note" role="status">動画の終わりまで選びました（{done.filter(st => st.kind === 'touchdown').length}歩目まで）。</p>}
    <p className="pick-status" role="status" aria-live="polite">{s.status || (s.waiting ? `選んだコマの骨格を調べています（あと${s.waiting}コマ）。` : s.looked ? `選んだコマの骨格を調べました（${s.looked}コマ）。` : '')}</p>
    {onFinish && <div className="pick-finish">
      <button type="button" className="sprint10-primary" disabled={!pickedEnough(picks) || s.phase === 'finishing'} onClick={onFinish}>
        {s.phase === 'finishing' ? '骨格を調べています…' : !next || ended ? '結果を見る' : 'ここまでで結果を見る'}</button>
      <small>{pickedEnough(picks) ? '選んだ歩までの値を出します。歩を多く選ぶほど、歩ごとの変化が分かります。' : '1歩目の接地まで選ぶと、結果を出せます。'}</small>
    </div>}
  </div>;
}
