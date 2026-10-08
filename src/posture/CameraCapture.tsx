import { useEffect, useRef, useState } from 'react';
import { POSE_EDGES } from '../cmj/pose-drawing';
import { VIEW_NAMES, type View } from './analysis';
import { FRAME, fitOf, Stillness, type Landmark } from './fit';
import { PostureCamera, tiltOf, type LiveFrame, type Voice } from './live';
import type { PostureModel } from './rtm';
import { readFrames, tallest, type Shot } from './still';

/** What the athlete is asked, shown and spoken. */
export const ASK: Record<View, string> = {
  front: '正面を向いて、枠の中に立ってください。',
  side: '横を向いてください。右向きでも左向きでもかまいません。',
  back: '後ろを向いて、カメラに背中を向けてください。',
};
/** Seconds counted down once the athlete fits and is still; frames taken then, a moment apart (seconds). */
const COUNT = 3, TAKES = [0, .15, .3];
/** The phone may lean this much in the screen's plane (degrees): the tilts measured are a few degrees. */
export const LEVEL = 1.5;
/** A fit lost for less than this (seconds) does not stop the countdown (the pose flickers). */
const GRACE = .4;

type Phase = 'starting' | 'position' | 'countdown' | 'taking' | 'error';
interface Props {
  views: readonly View[]; facing: 'user' | 'environment'; voice: Voice;
  /** Whether the phone's tilt may be read (asked for on the tap that started the camera). */
  motion: boolean;
  model: () => Promise<PostureModel>;
  onShot: (shot: Shot) => void;
  /** The camera closed: all views taken (or skipped), or stopped. */
  onEnd: () => void;
}

/** The camera with the frame to stand in and the athlete's skeleton; each view taken by itself once the athlete fits
 * and keeps still (a 3-second count with tones), the next view asked for by voice. */
export default function CameraCapture({ views, facing, voice, motion, model, onShot, onEnd }: Props) {
  const video = useRef<HTMLVideoElement>(null), overlay = useRef<HTMLCanvasElement>(null), stage = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(0), [phase, setPhase] = useState<Phase>('starting');
  const [message, setMessage] = useState('カメラを起動しています…'), [count, setCount] = useState(0), [roll, setRoll] = useState<number | null>(null);
  const [taken, setTaken] = useState<View[]>([]), [flash, setFlash] = useState(0);
  const flow = useRef({ step: 0, phase: 'starting' as Phase, until: 0, count: 0, lost: 0, roll: null as number | null, message: '', since: 0, spoken: '', spokenAt: -99 });
  const still = useRef(new Stillness()), camera = useRef<PostureCamera | null>(null), ended = useRef(false), skip = useRef(() => {});
  const props = useRef({ views, onShot, onEnd, model, voice }); props.current = { views, onShot, onEnd, model, voice };

  useEffect(() => { stage.current?.scrollIntoView?.({ behavior: 'smooth', block: 'start' }); }, []);
  // The phone's tilt, smoothed; none when the sensor is not there or not allowed.
  useEffect(() => {
    if (!motion) return;
    const read = (e: DeviceMotionEvent) => {
      const g = e.accelerationIncludingGravity, t = g && tiltOf({ x: g.x, y: g.y, z: g.z });
      if (!t) return;
      const r = flow.current.roll === null ? t.roll : flow.current.roll * .8 + t.roll * .2;
      flow.current.roll = r; setRoll(Math.round(r * 10) / 10);
    };
    window.addEventListener('devicemotion', read);
    return () => window.removeEventListener('devicemotion', read);
  }, [motion]);

  useEffect(() => {
    const control = new AbortController(), cam = new PostureCamera(video.current!, frame), f = flow.current;
    camera.current = cam;
    const set = (next: Phase) => { f.phase = next; setPhase(next); };
    const tell = (text: string, now: number) => {
      if (text !== f.message) { f.message = text; f.since = now; setMessage(text); }
      // A request kept for 2.5 s is spoken (not more often than every 7 s, the same one).
      else if (text && now - f.since > 2.5 && (text !== f.spoken || now - f.spokenAt > 7)) { f.spoken = text; f.spokenAt = now; props.current.voice.say(text); }
    };
    cam.start(facing, control.signal, text => text && setMessage(text)).then(() => {
      if (control.signal.aborted) return;
      set('position'); const ask = ASK[props.current.views[0]]; f.message = ask; f.since = performance.now() / 1000; setMessage(ask); props.current.voice.say(ask);
    }, e => {
      if (control.signal.aborted) return;
      set('error'); setMessage(e instanceof Error && e.name === 'NotAllowedError' ? 'カメラの使用が許可されませんでした。ブラウザの設定でカメラを許可するか、写真を選んでください。'
        : e instanceof Error ? e.message : String(e));
    });

    function frame(live: LiveFrame) {
      const view = props.current.views[f.step], aspect = live.width / live.height;
      const fit = view ? fitOf(live.poses, view, aspect) : null, pose = fit?.box ? live.poses[fit.person] : null;
      const tall = fit?.box ? fit.box.bottom - fit.box.top : 0, now = live.time;
      const isStill = still.current.push(now, fit?.ok ? pose : null, tall, aspect);
      const level = f.roll === null || Math.abs(f.roll) <= LEVEL;
      draw(overlay.current, live, pose, fit?.ok ? (f.phase === 'countdown' ? 'go' : 'fit') : 'off');
      if (!view) return;
      if (f.phase === 'position') {
        const ask = !fit!.ok ? fit!.message : !level ? 'スマホをまっすぐ縦に立ててください。' : !isStill ? 'そのまま動かないでください。' : '';
        tell(ask || 'そのまま…', now);
        if (fit!.ok && level && isStill) { f.until = now + COUNT; f.count = COUNT; f.lost = 0; set('countdown'); setCount(COUNT); props.current.voice.beep(); }
      } else if (f.phase === 'countdown') {
        if (!fit!.ok || !level) {
          f.lost ||= now;
          if (now - f.lost > GRACE) { set('position'); still.current.reset(); tell(!fit!.ok ? fit!.message : 'スマホをまっすぐ縦に立ててください。', now); }
          return;
        }
        f.lost = 0;
        const left = Math.ceil(f.until - now);
        if (left <= 0) void take(view);
        else if (left !== f.count) { f.count = left; setCount(left); props.current.voice.beep(); }
      }
    }

    async function take(view: View) {
      f.phase = 'taking'; setPhase('taking'); setCount(0); props.current.voice.beep(880, 220); setFlash(n => n + 1);
      const frames: { picture: HTMLCanvasElement; pose: readonly Landmark[] }[] = [];
      for (let i = 0; i < TAKES.length; i++) {
        if (i) await new Promise(r => setTimeout(r, (TAKES[i] - TAKES[i - 1]) * 1000));
        if (control.signal.aborted) return;
        const g = cam.grab(), pose = tallest(g.poses);
        if (pose) frames.push({ picture: g.picture, pose });
      }
      const views = props.current.views, next = views[f.step + 1];
      props.current.voice.say(next ? `OK。次は、${ASK[next]}` : '撮影が終わりました。結果を表示します。');
      setMessage(next ? `${VIEW_NAMES[view]}を撮りました。読み取っています…` : '読み取っています…');
      try {
        const points = await readFrames(await props.current.model(), frames, view);
        if (control.signal.aborted) return;
        props.current.onShot({ view, picture: frames[0].picture, points, source: 'camera', frames: frames.length, people: 1,
          roll: f.roll, pitch: null, takenAt: new Date().toISOString() });
        setTaken(t => [...t, view]);
        advance(now());
      } catch (e) {
        if (control.signal.aborted) return;
        set('position'); still.current.reset();
        tell(`うまく読み取れませんでした（${e instanceof Error ? e.message : String(e)}）。もう一度撮ります。`, now());
      }
    }
    function advance(at: number) {
      const views = props.current.views;
      if (f.step + 1 >= views.length) { finish(); return; }
      f.step++; setStep(f.step); still.current.reset(); set('position');
      f.message = ASK[views[f.step]]; f.since = at; f.spoken = f.message; f.spokenAt = at; setMessage(f.message);
    }
    skip.current = () => {
      if (f.phase === 'taking' || f.phase === 'starting' || f.phase === 'error') return;
      const at = now(), next = props.current.views[f.step + 1];
      if (next) props.current.voice.say(ASK[next]);
      advance(at);
    };
    return () => { control.abort(); cam.stop(); };
  }, [facing]);

  function finish() { if (ended.current) return; ended.current = true; camera.current?.stop(); props.current.onEnd(); }
  const view = views[step];
  return <section ref={stage} className="sprint10-card posture-camera" aria-label="カメラで撮影">
    <ol className="posture-steps" aria-label="撮る向き">{views.map((v, i) => <li key={v} className={taken.includes(v) ? 'done' : i === step ? 'now' : ''}>
      {taken.includes(v) ? '✓ ' : ''}{VIEW_NAMES[v]}</li>)}</ol>
    <p className={`posture-ask ${phase}`} role="status" aria-live="polite">{phase === 'countdown' ? `そのまま… ${count}` : message}</p>
    <div className={`posture-stage${facing === 'user' ? ' mirrored' : ''}`}>
      <video ref={video} playsInline muted aria-label="カメラの映像" />
      <canvas ref={overlay} className="posture-overlay" aria-hidden="true" />
      {phase === 'countdown' && <span className="posture-count" aria-hidden="true">{count}</span>}
      {flash > 0 && <span key={flash} className="posture-flash" aria-hidden="true" />}
    </div>
    <div className="posture-camera-bar">
      {roll !== null && <span className={Math.abs(roll) <= LEVEL ? 'posture-level ok' : 'posture-level'}>スマホの傾き {Math.abs(roll).toFixed(1)}°</span>}
      {view && phase !== 'error' && <button type="button" onClick={() => skip.current()} disabled={phase === 'taking'}>{VIEW_NAMES[view]}を飛ばす</button>}
      <button type="button" onClick={finish}>{phase === 'error' ? '閉じる' : 'やめる'}</button>
    </div>
  </section>;
}

const now = () => performance.now() / 1000;
/** The frame to stand in (white; amber when the athlete fits, green while counting) and the athlete's skeleton. */
function draw(c: HTMLCanvasElement | null, live: LiveFrame, pose: readonly Landmark[] | null, state: 'off' | 'fit' | 'go') {
  if (!c) return;
  if (c.width !== live.width || c.height !== live.height) { c.width = live.width; c.height = live.height; }
  const ctx = c.getContext('2d'); if (!ctx) return;
  const W = c.width, H = c.height, u = H / 640;
  ctx.clearRect(0, 0, W, H);
  const fh = (FRAME.bottom - FRAME.top) * H, fw = Math.min(W * .9, fh * .38), x0 = (W - fw) / 2, y0 = FRAME.top * H, arm = Math.min(fw, fh) * .16;
  const color = state === 'go' ? '#46e08a' : state === 'fit' ? '#ffc93c' : 'rgba(255,255,255,.85)';
  ctx.strokeStyle = color; ctx.lineWidth = (state === 'off' ? 3 : 6) * u; ctx.lineCap = 'round';
  for (const [x, y, dx, dy] of [[x0, y0, 1, 1], [x0 + fw, y0, -1, 1], [x0, y0 + fh, 1, -1], [x0 + fw, y0 + fh, -1, -1]]) {
    ctx.beginPath(); ctx.moveTo(x + dx * arm, y); ctx.lineTo(x, y); ctx.lineTo(x, y + dy * arm); ctx.stroke();
  }
  ctx.setLineDash([8 * u, 8 * u]); ctx.lineWidth = 1.5 * u; ctx.strokeRect(x0, y0, fw, fh); ctx.setLineDash([]);
  if (!pose) return;
  const seen = (p?: Landmark) => !!p && (p.visibility ?? 1) >= .5;
  ctx.strokeStyle = state === 'off' ? 'rgba(255,255,255,.9)' : color; ctx.lineWidth = 4 * u;
  for (const [a, b] of POSE_EDGES) if (seen(pose[a]) && seen(pose[b])) {
    ctx.beginPath(); ctx.moveTo(pose[a].x * W, pose[a].y * H); ctx.lineTo(pose[b].x * W, pose[b].y * H); ctx.stroke();
  }
  ctx.fillStyle = ctx.strokeStyle;
  for (const i of [0, 7, 8, 11, 12, 23, 24, 25, 26, 27, 28]) if (seen(pose[i])) { ctx.beginPath(); ctx.arc(pose[i].x * W, pose[i].y * H, 5 * u, 0, Math.PI * 2); ctx.fill(); }
}
