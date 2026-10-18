import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { untilAborted } from '../cmj/session-lifecycle';
import { demuxMP4 } from '../frame-engine/mp4-demuxer';
import { anglePose, type CrouchFrame } from '../sprint10/crouch';
import { withMendedFeet } from '../sprint10/crouch-pick';
import { PickPoses, type FoundPose } from '../sprint10/crouch-pick-poses';
import { CrouchReplay, PhaseFigures, type ReplayEvent } from '../sprint10/CrouchViews';
import type { Phase } from '../sprint10/crouch-figure';
import { frameInterval, insideFrame } from '../sprint10/frame-seek';
import type { ReviewMoment } from '../sprint10/moment-edits';
import { leaveReview, MomentReview } from '../sprint10/MomentReview';
import { usePoseEdits } from '../sprint10/pose-edits';
import { READ_LIMIT_BYTES } from '../sprint10/recording';
import { STAND_GUIDE, standAdvice } from './advice';
import { lowestFoot, nextStand, standEffects, standEnough, standFlags, standFocus, standFrames, standGuess, standHint, standLayout, standLeg, standResult, standSteps,
  STAND_STEPS, STAND_VERSION, type Picks, type StandStep } from './stand-pick';
import { StandGuide } from './StandPickGuide';
import FoulSetter, { FOUL_HANDLES } from './FoulSetter';
import { foulCm, foulStart, foulWords, type FoulHandle, type FoulPoints } from './foul';
import { useStill } from './still';
import '../sprint10/crouch-pick.css';

/** The long jump from the stands on screen (stand-pick.ts): the athlete tapped, then the takeoff's touchdown and toe-off set
 * with the check's controls (MomentReview), a sample picture saying which frame, the toe-off guessed; the pose models look
 * only at the frames set, round the athlete, and the result comes once both are set. */
export type StandPhase = 'idle' | 'loading' | 'picking' | 'finishing' | 'done' | 'failed';
/** The narrowest enlarged view, as a share of the picture's width: from the stands the athlete is small (the check's 0.15
 * left a foot of 15 px on a 288 px wide view). */
const STAND_ZOOM = .08;

export function useStandPick(file: File | null, url: string) {
  const [phase, setPhase] = useState<StandPhase>('idle'), [status, setStatus] = useState('');
  const [timeline, setTimeline] = useState<CrouchFrame[] | null>(null), [size, setSize] = useState<{ width: number; height: number } | null>(null);
  const [picks, setPicks] = useState<Picks>({}), [at, setAt] = useState<string | null>(null), [startFrame, setStartFrame] = useState(0);
  const [found, setFound] = useState<ReadonlyMap<number, FoundPose>>(new Map()), [asked, setAsked] = useState<ReadonlySet<number>>(new Set());
  // The athlete tapped (normalized) at a frame where they were found; null until then.
  const [tap, setTap] = useState<{ x: number; y: number; frame: number } | null>(null), [tapping, setTapping] = useState(false);
  // 「このコマに決める」 pressed on the takeoff's touchdown before the athlete was found (the user, 2026-10-18: 「フレーム調整
  // してこのコマで決めるを押した時反応しない」: the only word was a line far below the button): the frame pressed, set as
  // soon as the athlete is found at it; `asked` counts the presses, to say so by the button and show the picture again.
  const [queued, setQueued] = useState<number | null>(null), [askedTap, setAskedTap] = useState(0);
  const poses = useRef<PickPoses | null>(null), owner = useRef<AbortController | null>(null), askedNow = useRef(new Set<number>());
  // How long the models took to be made (ms from the start), for the checks on slow phones (data-ready-ms).
  const [readyMs, setReadyMs] = useState<number | null>(null);
  // The latest state for the models' hints: a frame's turn may come after more moments were set and found.
  const latest = useRef({ picks, found, timeline, size, tap }); latest.current = { picks, found, timeline, size, tap };
  const reset = useCallback(() => {
    owner.current?.abort(); owner.current = null; poses.current?.dispose(); poses.current = null;
    setPhase('idle'); setStatus(''); setTimeline(null); setSize(null); setPicks({}); setAt(null); setFound(new Map()); setAsked(new Set());
    setTap(null); setTapping(false); setQueued(null); setAskedTap(0); askedNow.current = new Set();
  }, []);
  useEffect(() => reset, [url, reset]);
  // Every frame, with the poses found at the frames the moments now use and at the tap's (where the athlete is), the
  // feet mended as the analysis' are.
  const frames = useMemo(() => {
    if (!timeline) return [];
    const keep = new Set([...standFrames(picks), ...(tap ? [tap.frame] : [])]);
    const withPoses = timeline.map(f => { const p = keep.has(f.frame) ? found.get(f.frame) : undefined; return p ? { ...f, pose: p.pose, refined: p.refined } : f; });
    return size ? withMendedFeet(withPoses, size.width, size.height, standLeg(withPoses, size.width, size.height)) : withPoses;
  }, [timeline, picks, found, tap, size]);
  const pending = useMemo(() => new Set([...asked].filter(f => !found.has(f))), [asked, found]), waiting = pending.size;
  useEffect(() => { if (phase === 'finishing' && !waiting) setPhase('done'); }, [phase, waiting]);

  /** Starts: the video's frames (their times only), the models made while the user looks for the takeoff. */
  async function begin() {
    if (!file || !url) return;
    reset();
    const control = new AbortController(); owner.current = control; setReadyMs(null);
    const began = performance.now();
    setPhase('loading'); setStatus('動画のコマを読み込んでいます。');
    try {
      if (file.size > READ_LIMIT_BYTES) throw new Error('200MB以内のMP4 / MOVを選んでください（写真アプリで、踏切の前後だけに短くすると読み込めます）。');
      const d = await untilAborted(demuxMP4(file), control.signal);
      const span = d.frames.length ? d.frames.at(-1)!.pts - d.frames[0].pts : 0;
      if (!d.frames.length || d.frames.length > 3600 || span > 30) throw new Error('1回の跳躍・30秒以内・3600フレーム以内の動画を選んでください。');
      const list: CrouchFrame[] = d.frames.map(f => ({ frame: f.frameIndex, pts: f.pts, pose: null }));
      const made = new PickPoses(url, frameInterval(list), control.signal, text => { if (!control.signal.aborted) setStatus(text); });
      poses.current = made;
      made.whenReady().then(() => { if (!control.signal.aborted) { setStatus(''); setReadyMs(Math.round(performance.now() - began)); } },
        e => { if (!control.signal.aborted) setStatus(e instanceof Error ? e.message : String(e)); });
      void made.size().then(s => { if (!control.signal.aborted) setSize(s); }, () => undefined);
      setTimeline(list); setStartFrame(list[Math.floor(list.length / 2)].frame); setAt('td0'); setPhase('picking');
    } catch (e) {
      if (control.signal.aborted) return;
      setPhase('failed'); setStatus(e instanceof Error ? e.message : String(e));
    }
  }
  /** The athlete tapped at a frame: looked for round the point (the person whose body holds it). */
  function choose(x: number, y: number, frame: number) {
    const tl = latest.current.timeline, made = poses.current, control = owner.current;
    const f = tl?.find(q => q.frame === frame);
    if (!f || !made || !control || tapping) return;
    setTapping(true); setStatus('タップした選手を探しています。');
    made.lookNear(f.pts, () => ({ x, y, size: null })).then(r => {
      if (control.signal.aborted) return;
      setTapping(false);
      if (!r.pose) { setStatus('そこに選手を見つけられませんでした。跳ぶ選手の体（腰のあたり）をタップしてください。'); return; }
      setFound(m => new Map(m).set(frame, r)); setTap({ x, y, frame }); setStatus('');
    }, () => { if (!control.signal.aborted) { setTapping(false); setStatus('選手を探せませんでした。もう一度タップしてください。'); } });
  }
  // The touchdown pressed before the athlete was found: set once found at that frame (another frame tapped: pressed again).
  useEffect(() => {
    if (!tap || queued === null) return;
    const frame = queued; setQueued(null);
    if (frame === tap.frame && latest.current.picks.td0 === undefined) decide('td0', frame);
  }, [tap, queued]);   // eslint-disable-line react-hooks/exhaustive-deps
  /** A moment's frame set: the models look at it round where the athlete should be, and the next moment comes; once both
   * are set while picking, the result (as soon as the models have looked). */
  function decide(key: string, frame: number) {
    const { timeline: tl, tap: tp, found: fd } = latest.current, made = poses.current;
    if (!tl || !made) return;
    if (key === 'td0' && !tp) { setQueued(frame); setAskedTap(n => n + 1); return; }
    const next = { ...latest.current.picks, [key]: frame };
    setPicks(next);
    // A frame already looked at with the athlete found (the tap's) is not looked at again.
    const prior = fd.get(frame), waitingFor = askedNow.current.has(frame) && !prior;
    if (!prior?.pose && !waitingFor) {
      askedNow.current.add(frame); setAsked(new Set(askedNow.current));
      if (prior) setFound(m => { const n = new Map(m); n.delete(frame); return n; });
      const pts = tl.find(q => q.frame === frame)!.pts;
      made.lookNear(pts, () => {
        const { picks: p, found: now, timeline: t, size: s, tap: t0 } = latest.current;
        if (!t || !s) return t0 ? { x: t0.x, y: t0.y, size: null } : null;
        const seen = t.map(q => { const r = now.get(q.frame); return r ? { ...q, pose: r.pose, refined: r.refined } : q; });
        return standHint(pts, standLayout(p, seen, s.width, s.height), t0, s.width, s.height);
      }).then(r => setFound(m => new Map(m).set(frame, r)), () => setFound(m => new Map(m).set(frame, { pose: null, refined: null })));
    }
    setAt(nextStand(next)?.key ?? key);
    if (standEnough(next)) setPhase(p => p === 'picking' ? 'finishing' : p);
  }
  return { phase, status, frames, size, picks, at, setAt, startFrame, waiting, pending, looked: found.size, tap, tapping, queued, askedTap, begin, choose, decide, reset, readyMs,
    backend: poses.current?.backend ?? null, took: poses.current?.took ?? [] };
}
export type StandSession = ReturnType<typeof useStandPick>;

/** The moments set and the one to set next, with the check's controls. */
export function StandPickView({ session: s, url }: { session: StandSession; url: string }) {
  const { frames, picks, size, tap } = s, W = size?.width ?? 0, H = size?.height ?? 0;
  const layout = useMemo(() => W ? standLayout(picks, frames, W, H) : null, [picks, frames, W, H]);
  const tapFrame = tap ? frames.find(f => f.frame === tap.frame) : undefined;
  const tapFoot = useMemo(() => tapFrame ? lowestFoot(anglePose(tapFrame), W, H) : null, [tapFrame, W, H]);
  const done = standSteps(picks), next = nextStand(picks);
  // The next moment's frame: the touchdown where the athlete was tapped (else where the search starts), the toe-off
  // guessed (the video's last frame when the guess is past its end).
  const guess = next ? standGuess(next.key, picks, frames) : null;
  const start = !next ? null : next.key === 'td0' ? tap?.frame ?? s.startFrame : guess ?? frames.at(-1)?.frame ?? null;
  const flags = useMemo(() => standFlags(picks, frames), [picks, frames]);
  const moment = (st: StandStep, frame: number): ReviewMoment => {
    const f = frames.find(q => q.frame === frame), place = layout ? standFocus(st.key, layout, tapFoot, W, H) : { focus: null, ground: null };
    return { key: st.key, kind: st.kind, step: 0, label: st.label, short: st.short, frame, pts: f?.pts ?? 0, autoFrame: frame,
      focus: place.focus, ground: place.ground, flag: flags.get(st.key) ?? null };
  };
  const list = [...done.map(st => moment(st, picks[st.key])), ...(next && start !== null ? [moment(next, start)] : [])];
  const checked = useMemo(() => new Set(done.map(st => st.key)), [done.map(st => st.key).join()]);   // eslint-disable-line react-hooks/exhaustive-deps
  const upcoming = next ? STAND_STEPS.slice(STAND_STEPS.indexOf(next) + 1).map(st => ({ key: st.key, short: st.short })) : [];
  const at = list.some(m => m.key === s.at) ? s.at : list.at(-1)?.key ?? null;
  const preview = useCallback((m: ReviewMoment, frame: number) => standEffects(picks, m.key, frame, frames), [picks, frames]);
  // A press before the athlete is found shows the picture again (the hooks before the early return below).
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => { if (s.askedTap) root.current?.scrollIntoView?.({ behavior: 'smooth', block: 'start' }); }, [s.askedTap]);
  if (!frames.length || !W) return <p role="status">{s.status || '動画を読み込んでいます。'}</p>;
  const onTakeoff = at === 'td0';
  // By the button while the touchdown waits for the athlete: what to do, or what is going on (the models are made on the
  // first use, a minute or so on a phone).
  const preparing = s.readyMs === null ? '（AIを準備しています。初めて使うときは1分ほどかかります）' : '';
  const ask = !onTakeoff || tap ? null : s.tapping
    ? `タップした選手を探しています…${preparing}${s.queued !== null ? '　見つかりしだい、このコマに決めます。' : ''}`
    : s.status && s.status !== 'タップした選手を探しています。' && /見つけられ|探せません/.test(s.status) ? s.status
    : `先に、映像の中の跳ぶ選手をタップしてください。AIがその選手を見つけてから、このコマに決まります。${preparing}`;
  return <div ref={root} className="pick-view" data-ready-ms={s.readyMs ?? undefined} data-took-ms={s.took.map(Math.round).join(',') || undefined}
    data-tap={tap ? `${tap.frame}:${tap.x.toFixed(3)},${tap.y.toFixed(3)}` : undefined}>
    <MomentReview url={url} frames={frames} width={W} height={H} list={list} edits={{}} checked={checked} at={at} onAt={s.setAt}
      onSet={s.decide} onRevert={() => undefined} onRevertAll={() => undefined} onDone={() => undefined} preview={preview} down={() => null}
      leg={layout && layout.leg > 0 ? layout.leg : undefined}
      point={(m, frame) => m.key === 'td0' && tap && frame === tap.frame ? { x: tap.x, y: tap.y } : null}
      note={m => m.key === 'td0' && ask ? <p className={`pick-tap-ask${s.askedTap && !s.tapping ? ' asked' : ''}`} role="status" aria-live="polite">{ask}</p> : null}
      pick={{ guide: m => <StandGuide m={m} tapping={m.key === 'td0' && !tap} />, guessed: m => m.key === next?.key && guess !== null, upcoming,
        onTap: onTakeoff ? s.choose : undefined, zoom: STAND_ZOOM, lastly: '結果が出ます' }} />
    {onTakeoff && tap && <p className="sprint10-hint">選手が違うときは、跳ぶ選手をもう一度タップしてください（「全体」で画面全体を見られます）。</p>}
    <p className="pick-status" role="status" aria-live="polite">{s.tapping ? 'タップした選手を探しています。' : s.status || (s.waiting ? `選んだコマの骨格を調べています（あと${s.waiting}コマ）。${s.phase === 'finishing' ? '終わると結果が出ます。' : ''}` : s.looked ? `選んだコマの骨格を調べました（${s.looked}コマ）。` : '')}</p>
  </div>;
}

type Tab = 'advice' | 'foul' | 'check' | 'pose' | 'numbers' | 'replay';
const TABS: [Tab, string][] = [['advice', 'ポイント'], ['foul', '踏切位置'], ['check', '確認'], ['pose', '姿勢'], ['numbers', '数値'], ['replay', 'スロー']];
const LEGEND = [['#ffb02e', '体幹（腰→肩）'], ['#b58cff', '踏切脚の膝']] as const;
const seconds = (v: number | null) => v === null ? '—' : `${v.toFixed(3)}秒`;
const lean = (v: number | null) => v === null ? '—' : v < 0 ? `後ろへ ${Math.round(-v)}°` : `前へ ${Math.round(v)}°`;

/** The result of the moments set (stand-pick.ts standResult), with the tabs of the long jump's result: the advice, the
 * takeoff's distance to the foul line (points set on the board, foul.ts), the moments set again (確認), the pictures, the
 * numbers, the slow replay. */
export function StandResultCard({ session: s, url, file }: { session: StandSession; url: string; file: File | null }) {
  const W = s.size?.width ?? 0, H = s.size?.height ?? 0;
  // The skeleton's points set by hand on the pictures (sprint10/pose-edits.ts), as the analysis' result allows.
  const pose = usePoseEdits(s.frames.length ? s.frames : null);
  const result = useMemo(() => standResult(s.picks, pose.frames, W, H, s.pending), [s.picks, pose.frames, W, H, s.pending]);
  const replay = useRef<HTMLVideoElement>(null), seekTo = useRef<number | null>(null), card = useRef<HTMLElement>(null);
  const [tab, setTab] = useState<Tab>('advice'), tabs = useRef<HTMLDivElement>(null), panels = useRef<HTMLDivElement>(null);
  // The foul line (foul.ts): the points set on a still of a frame of the takeoff's contact (the toe-off's unless moved), the
  // still made only while the tab is open (a full-size picture); the distance once all four points are put.
  const [foul, setFoul] = useState<{ points: FoulPoints | null; placed: ReadonlySet<FoulHandle>; frame: number | null; round: number }>({ points: null, placed: new Set(), frame: null, round: 0 });
  const layout = useMemo(() => W ? standLayout(s.picks, pose.frames, W, H) : null, [s.picks, pose.frames, W, H]);
  const contact = useMemo(() => s.picks.td0 === undefined || s.picks.to0 === undefined ? []
    : pose.frames.filter(f => f.frame >= s.picks.td0 && f.frame <= s.picks.to0), [s.picks, pose.frames]);
  const foulFrame = foul.frame !== null && contact.some(f => f.frame === foul.frame) ? foul.frame : s.picks.to0 ?? null;
  const foulAt = useMemo(() => { const f = pose.frames.find(q => q.frame === foulFrame); return f ? insideFrame(f.pts, frameInterval(pose.frames)) : null; }, [foulFrame, pose.frames]);
  const foulStill = useStill(url, tab === 'foul' ? foulAt : null);
  const startToe = layout?.places.get('to0') ?? layout?.places.get('td0') ?? (s.tap ? { x: s.tap.x * W, y: s.tap.y * H } : null);
  const foulPoints = foul.points ?? (startToe && layout ? foulStart(startToe, layout.leg, layout.direction, W, H) : null);
  const foulDone = !!foul.points && FOUL_HANDLES.every(([h]) => foul.placed.has(h));
  const beyond = foulDone ? foulCm(foul.points!, W, H) : null, foulText = beyond === null ? null : foulWords(beyond);
  const advice = useMemo(() => result.reason ? [] : standAdvice(result, beyond), [result, beyond]);
  const checks = advice.filter(a => a.level === 'check').length;
  useEffect(() => { card.current?.scrollIntoView?.({ behavior: 'smooth', block: 'start' }); }, []);
  useEffect(() => {
    const v = replay.current;
    if (tab !== 'replay' || !v || seekTo.current === null) return;
    const t = insideFrame(seekTo.current, frameInterval(pose.frames)); seekTo.current = null;
    const go = () => { v.pause(); v.currentTime = t; };
    if (v.readyState >= 1) go(); else v.addEventListener('loadedmetadata', go, { once: true });
  }, [tab, pose.frames]);
  const events: ReplayEvent[] = useMemo(() => STAND_STEPS.flatMap(st => {
    const f = s.picks[st.key] === undefined ? undefined : pose.frames.find(q => q.frame === s.picks[st.key]);
    return f ? [{ label: st.label, short: st.short, pts: f.pts }] : [];
  }).sort((a, b) => a.pts - b.pts), [s.picks, pose.frames]);
  function choose(next: Tab) {
    setTab(next);
    const top = panels.current?.getBoundingClientRect().top, bar = tabs.current?.offsetHeight ?? 0;
    if (top !== undefined && top < bar) window.scrollBy({ top: top - bar });
  }
  function show(p: Phase) { seekTo.current = p.pts; choose('replay'); }
  function save() {
    const blob = new Blob([JSON.stringify({ version: STAND_VERSION, file: file?.name, picked: s.picks, tap: s.tap, result,
      ...(foulDone ? { foulLine: { frame: foulFrame, points: foul.points, cmBeyond: beyond } } : {}),
      ...(pose.hand.size ? { skeletonSetByHand: pose.edits } : {}) }, null, 2)], { type: 'application/json' });
    const href = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = href; a.download = 'long-jump-stands-result.json'; a.click(); setTimeout(() => URL.revokeObjectURL(href), 1000);
  }
  const S = STAND_GUIDE;
  const tiles: [string, string, string, string][] = [
    ['踏切の接地時間', result.takeoffContact === null ? '—' : result.takeoffContact.toFixed(3), '秒', `参考値 ${S.contact[0].toFixed(3)}〜${S.contact[1].toFixed(3)}`],
    ['踏切で脚を着く角度', result.posture.legAngle === null ? '—' : String(Math.round(result.posture.legAngle)), '°', `参考値 約${S.legAngle}°・斜めからだと大きめ`],
    ['踏切線まで（つま先）', foulText?.value ?? '—', 'cm', foulText?.note ?? '「踏切位置」で板に点を置くと出ます']];
  const rows: [string, string, string][] = [
    ['踏切の接地時間', seconds(result.takeoffContact), `参考値 ${S.contact[0].toFixed(3)}〜${S.contact[1].toFixed(3)}秒（記録5.5〜6.2 mの選手の平均）`],
    ['踏切接地：脚の角度（股関節→足首と水平）', result.posture.legAngle === null ? '—' : `${Math.round(result.posture.legAngle)}°`, `参考値 約${S.legAngle}°`],
    ['踏切接地の上体（鉛直から）', lean(result.posture.trunk), ''],
    ['踏切接地の膝', result.posture.knee === null ? '—' : `${Math.round(result.posture.knee)}°`, `参考値 約${Math.round(S.knee)}°（記録5.50 mの選手の平均）`],
    ['踏切線（ファールライン）まで：つま先', foulText ? `${foulText.value} cm（${foulText.note}）` : '—', '踏切板の白い部分（20 cm）を物差しにした目安。点の置き方で±1〜2 cm']];
  return <section ref={card} className="sprint10-card sprint10-result" aria-label="解析結果（スタンド）"><h2>解析結果</h2>
    {result.reason ? <><p role="alert" className="sprint10-note">{result.reason}</p><StandPickView session={s} url={url} /></> : <>
      <div className="sprint10-metrics sprint10-summary">{tiles.map(([label, value, unit, note]) =>
        <div key={label}><span>{label}</span><strong>{value}<small>{value === '—' ? '' : unit}</small></strong>{note && <em>{note}</em>}</div>)}</div>
      {s.waiting > 0 && <p className="sprint10-hint" role="status">選んだコマの骨格を調べています（あと{s.waiting}コマ）。角度はそのあと出ます。</p>}
      <p className="crouch-check-note"><span>スタンドから撮った動画のコマを自分で選んだ結果です（試作）。時間は撮る向きの影響を受けませんが、角度は斜めから撮るとずれます。</span>
        {tab !== 'check' && <button type="button" onClick={() => choose('check')}>確認する</button>}</p>
      {!s.backend && <p className="sprint10-note">高精度の骨格モデル（RTMPose）を読み込めなかったため、MediaPipeの骨格を使っています。</p>}
      <div ref={tabs} className="sprint10-tabs crouch-tabs" role="tablist" aria-label="結果の表示">{TABS.map(([id, label]) =>
        <button key={id} id={`ljs-tab-${id}`} type="button" role="tab" aria-selected={tab === id} aria-controls={`ljs-panel-${id}`} onClick={() => leaveReview(() => choose(id))}>
          {label}{id === 'advice' && checks > 0 && <span className="sprint10-badge" aria-label={`確かめたい点 ${checks}件`}>{checks}</span>}</button>)}</div>
      <div ref={panels} className="sprint10-panels">
        <div id="ljs-panel-advice" role="tabpanel" aria-labelledby="ljs-tab-advice" hidden={tab !== 'advice'}>
          {advice.length > 0 && <ul className="sprint10-advice" aria-label="見方のポイント">{advice.map(a => <li key={a.topic + a.text} className={a.level}>
            <span aria-hidden="true">{a.level === 'good' ? '✓' : a.level === 'check' ? '!' : 'i'}</span><div><strong>{a.topic}</strong>{a.text}</div></li>)}</ul>}
          <p className="sprint10-hint">参考値は研究で報告された平均で、選手ごとの目標ではありません（出典は「数値の見方」）。同じ席から撮った試技どうしで比べると、変化が分かりやすくなります。</p>
          {result.notes.map(n => <p className="sprint10-note" key={n}>{n}</p>)}
        </div>
        <div id="ljs-panel-foul" role="tabpanel" aria-labelledby="ljs-tab-foul" hidden={tab !== 'foul'}>
          <p className="sprint10-hint">白い踏切板の幅（20 cm）を物差しにして、つま先から踏切線（ファールライン）までを測ります。下の拡大した画面で、順にタップして点を置きます：①②「線1」「線2」は踏切線（白い板の砂場側の端。緑や粘土の板との境目）の上に、なるべく離して。③「板の端」は、つま先の近くで、白い板の助走路側の端に。④「つま先」は踏切足のつま先の先端（板に着いている所）に。</p>
          {contact.length > 1 && <div className="longjump-frame-step" role="group" aria-label="測るコマ">
            <button type="button" disabled={foulFrame === contact[0].frame} onClick={() => { const i = contact.findIndex(f => f.frame === foulFrame); setFoul(f => ({ ...f, frame: contact[Math.max(0, i - 1)].frame })); }}>◀ 1コマ前</button>
            <span>{foulFrame === s.picks.to0 ? '離地のコマ' : foulFrame === s.picks.td0 ? '接地のコマ' : `接地から${contact.findIndex(f => f.frame === foulFrame)}コマ目`}</span>
            <button type="button" disabled={foulFrame === contact.at(-1)!.frame} onClick={() => { const i = contact.findIndex(f => f.frame === foulFrame); setFoul(f => ({ ...f, frame: contact[Math.min(contact.length - 1, i + 1)].frame })); }}>1コマ後 ▶</button>
          </div>}
          {tab === 'foul' && (foulStill && foulPoints && layout
            ? <FoulSetter key={`${foulStill.width}x${foulStill.height}-${foul.round}`} still={foulStill} points={foulPoints} placed={foul.placed} leg={layout.leg}
              onChange={(points, h) => setFoul(f => ({ ...f, points, placed: new Set([...f.placed, h]) }))} />
            : foulStill === false ? <p className="sprint10-note" role="alert">踏切のコマを読み込めませんでした。「1コマ前」「1コマ後」で別のコマにするか、ページを読み込み直してください。</p>
            : <p role="status">踏切のコマを読み込んでいます…</p>)}
          {foulDone && <button type="button" onClick={() => setFoul(f => ({ ...f, placed: new Set(), round: f.round + 1 }))}>点を置き直す</button>}
          <p className="sprint10-hint">つま先は、板に着いている間で一番前に出たところを測ります（ふつうは離地のコマ）。公式の判定（審判・粘土板の跡）とちがうことがあります。</p>
        </div>
        <div id="ljs-panel-check" role="tabpanel" aria-labelledby="ljs-tab-check" hidden={tab !== 'check'}>
          <p className="sprint10-hint">選んだコマを選び直せます。◀▶か下のコマで合わせて「このコマに決める」。数値はすぐ変わります。</p>
          {tab === 'check' && <StandPickView session={s} url={url} />}
        </div>
        <div id="ljs-panel-pose" role="tabpanel" aria-labelledby="ljs-tab-pose" hidden={tab !== 'pose'}>
          <ul className="sprint10-mark-legend" aria-label="線の色">{LEGEND.map(([color, label]) => <li key={label}><i style={{ background: color }} />{label}</li>)}</ul>
          <p className="sprint10-hint">点線は鉛直、弧が測った角度。</p>
          {result.moments.length ? <PhaseFigures url={url} frames={pose.frames} phases={result.moments} onShow={show} editing={pose.editing}
            guides={{ takeoff: `脚の角度（股関節→足首と水平）${result.posture.legAngle === null ? '—' : `${Math.round(result.posture.legAngle)}°`}・参考値 約${S.legAngle}°` }} />
            : <p>接地の画像を作れませんでした。</p>}
        </div>
        <div id="ljs-panel-numbers" role="tabpanel" aria-labelledby="ljs-tab-numbers" hidden={tab !== 'numbers'}>
          <dl className="throw-list" aria-label="選んだコマからの数値">{rows.map(([name, value, ref]) =>
            <div key={name}><dt>{name}</dt><dd>{value}</dd>{ref && <small>{ref}</small>}</div>)}</dl>
        </div>
        <div id="ljs-panel-replay" role="tabpanel" aria-labelledby="ljs-tab-replay" hidden={tab !== 'replay'} className="sprint10-replay">
          <CrouchReplay url={url} video={replay} frames={pose.frames} phases={result.moments} events={events} />
          <p className="sprint10-hint">踏切の接地・離地へ移動できます。1/8は実際の8分の1の速さです。骨格は踏切の接地のコマだけです。</p>
        </div>
      </div>
      <details className="sprint10-more"><summary>数値の見方</summary>
        <p>スタンドから撮った動画では、選手が小さく、まわりに人がいて、カメラも選手を追って動くため、選手を最初から最後まで自動で追いません。タップした選手のまわりで、選んだコマだけ骨格のAI（選手を探すのはMediaPipe、角度はRTMPose）が見ます。接地は足が着いた最初のコマ、離地はつま先が着いている最後のコマで、時刻はそのコマと前（接地）・後（離地）のコマの間です。</p>
        <p>接地時間は、コマの時刻の差なので、撮る向きやカメラの動きの影響を受けません（1秒120コマで±0.008秒、240コマで±0.004秒）。角度は画面の上での角度なので、真横から外れるほど変わります。斜めから撮ると、前後方向の長さが縮んで見えるため、脚の角度は大きめに出ます（60°は、斜め30°で約63°、45°で約68°）。体幹の傾きは小さめに出ます。スマホを傾けて撮ると、その分だけずれます。</p>
        <p>踏切線まで：踏切板の白い部分の幅は、規則で20 cm（±2 mm）と決まっています。点を置いた踏切線と板の助走路側の端の間を20 cmとして、つま先から踏切線までの距離を、その比で求めます。板のまわりでは、斜めから撮っても長さが同じ割合で縮むので、比は変わりません。画像の1画素が何cmかは撮り方で変わり、点の置き方で±1〜2 cmほど変わります。踏切線を越えた分はプラス（ファール）、手前はその距離（記録は踏切線から測るため、この分は記録に入りません）です。</p>
        <p>出さない値：助走速度と離地の速さ・踏切角度（カメラを固定し、距離の物差しが要るため）、最後の2歩のリズム（その前の歩のコマも要るため。真横から三脚で撮った動画なら「解析する」で出ます）、膝が最も曲がった角度（試合の映像では値が安定しないという研究があるため：Cronin 2024）。</p>
        <p>出典：踏切の接地時間はNemtsevら（2016：記録平均5.50 mの女子 0.133秒、記録との相関 −0.70、2018：17歳男子（6.16 m）0.140秒）。脚の角度（股関節〜足首の線と水平）はBridgett・Linthorne（2006：61±3°）、Nemtsevら（2016：59.6±2.8°、記録との相関 −0.50）。膝はNemtsevら（2016：接地165.5°）。上体は記録との直接の結びつきが見つかっていないため、参考です。</p>
      </details>
    </>}
    <button onClick={save}>結果を保存（JSON）</button>
  </section>;
}
