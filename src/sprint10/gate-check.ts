/** The 10 m's (and the flying section's) gate crossings as moments the user may check and set by hand, frame by frame,
 * as the other events' contacts (the user, 2026-10-08: 「10mは反映して欲しいけど壊れないように進めて」). A crossing is
 * judged between frames, from the pelvis's path; the user picks the first frame where the pelvis is past the line, and
 * the crossing moves by the time between that frame and the judged one, the time within the frame kept: the judged
 * frame gives the judged time, and nothing else is judged again (analyzeSprint's `moved`). */
import type { Crossing, GateShifts, SprintResult, SprintSample } from './analysis';
import type { CrouchFrame } from './crouch';
import type { Edits, ReviewMoment } from './moment-edits';

export type GateKey = 'start' | 'finish';
const GATES: readonly GateKey[] = ['start', 'finish'];
/** Looked at round a crossing: the pelvis's height (the picture's centre) and its going back and forth over the line. */
const NEAR_SECONDS = .15;
/** Samples either side of a crossing whose pose is looked for: MISSING of them in a row without it make it worth a look.
 * One at a time is how a flying section is watched until the runner is taken (every other sample, recorded). */
const NEAR_SAMPLES = 3, MISSING = 2;

/** The first frame at or after a crossing (frames in time order): the first where the pelvis is past the line. */
export function crossingFrame(frames: readonly { frame: number; pts: number }[], pts: number): number {
  return (frames.find(f => f.pts >= pts - 1e-9) ?? frames[frames.length - 1]).frame;
}

/** The pelvis (normalized) at a time: where it was seen then, or between the two sightings round it when they are no
 * further apart than `gap` (a frame not analysed: a 240 fps video is analysed at 120; a sample without the pose: a
 * flying section's runner is watched every other sample until taken); null where it was not seen. The height is null
 * in samples saved before it was kept. */
export function pelvisAt(samples: readonly SprintSample[], pts: number, gap: number): { x: number; y: number | null } | null {
  const seen = samples.filter(s => s.hipX !== null);
  let lo = 0, hi = seen.length - 1, i = -1;
  while (lo <= hi) { const mid = (lo + hi) >> 1; if (seen[mid].pts <= pts + 1e-9) { i = mid; lo = mid + 1; } else hi = mid - 1; }
  const a = i >= 0 ? seen[i] : null;
  if (a && Math.abs(a.pts - pts) < 1e-6) return { x: a.hipX!, y: a.hipY ?? null };
  const b = seen[i + 1];
  if (!a || !b || b.pts - a.pts > gap + 1e-9) return null;
  const u = (pts - a.pts) / (b.pts - a.pts);
  return { x: a.hipX! + u * (b.hipX! - a.hipX!), y: a.hipY != null && b.hipY != null ? a.hipY + u * (b.hipY - a.hipY) : null };
}

/** The leg length in pixels (the samples' median, in picture heights), for the size of the picture round the pelvis. */
export function legPixels(samples: readonly SprintSample[], height: number): number {
  const legs = samples.flatMap(s => s.legLength !== null && s.legLength > .01 ? [s.legLength] : []).sort((a, b) => a - b);
  return legs.length ? legs[legs.length >> 1] * height : 0;
}

/** The two crossings in time order, with the user's frames, where to look (the line, at the pelvis's height) and which
 * are worth a look. `labels`: the gates' names (スタート・ゴール, or 入口・出口); `colors`: their lines on the player. */
export function gateMoments(auto: SprintResult, edits: Edits, frames: readonly CrouchFrame[], samples: readonly SprintSample[],
  gates: Readonly<Record<GateKey, number>>, labels: Readonly<Record<GateKey, string>>, colors: Readonly<Record<GateKey, string>>): ReviewMoment[] {
  if (auto.reason || !auto.start || !auto.finish || !frames.length) return [];
  const byFrame = new Map(frames.map(f => [f.frame, f])), direction = Math.sign(gates.finish - gates.start);
  return GATES.map(key => {
    const c = auto[key]!, autoFrame = crossingFrame(frames, c.pts);
    const frame = edits[key] !== undefined && byFrame.has(edits[key]) ? edits[key] : autoFrame;
    return { key, kind: 'crossing', step: null, label: `${labels[key]}の線を越える瞬間`, short: labels[key], frame, pts: byFrame.get(frame)!.pts,
      autoFrame, focus: { x: gates[key], y: heightNear(samples, c.pts) }, ground: null, flag: flagOf(c, samples, gates[key], direction), color: colors[key] };
  });
}

/** The crossings moved by the user: the time from the judged frame to the one set (see GateShifts). */
export function gateShifts(list: readonly ReviewMoment[], frames: readonly { frame: number; pts: number }[]): GateShifts {
  const ptsOf = new Map(frames.map(f => [f.frame, f.pts])), out: GateShifts = {};
  for (const m of list) {
    const from = ptsOf.get(m.autoFrame);
    if ((m.key === 'start' || m.key === 'finish') && m.frame !== m.autoFrame && from !== undefined) out[m.key] = m.pts - from;
  }
  return out;
}

/** The pelvis's height round a time (the median of the samples within NEAR_SECONDS), else the nearest seen, else the middle. */
function heightNear(samples: readonly SprintSample[], pts: number) {
  const seen = samples.filter(s => s.hipX !== null && s.hipY != null);
  const near = seen.filter(s => Math.abs(s.pts - pts) <= NEAR_SECONDS).map(s => s.hipY!).sort((a, b) => a - b);
  if (near.length) return near[near.length >> 1];
  const nearest = seen.reduce<SprintSample | null>((b, s) => !b || Math.abs(s.pts - pts) < Math.abs(b.pts - pts) ? s : b, null);
  return nearest?.hipY ?? .5;
}

/** Why a crossing is worth a look: estimated out of view, the pose missing round it (in a row), or the pelvis going back
 * and forth over the line (a standing athlete's sway, or the pose wavering). */
function flagOf(c: Crossing, samples: readonly SprintSample[], gate: number, direction: number): string | null {
  if (c.extendedSeconds) return '線を越える瞬間の骨盤は映っていません（体が画面の端にかかる・隠れる）。前後の動きから推定したコマです。映像で確かめてください。';
  const k = samples.findIndex(s => s.pts >= c.pts - 1e-9), at = k < 0 ? samples.length : k;
  let run = 0, longest = 0;
  for (const s of samples.slice(Math.max(0, at - NEAR_SAMPLES), at + NEAR_SAMPLES)) { run = s.hipX === null ? run + 1 : 0; longest = Math.max(longest, run); }
  if (longest >= MISSING) return '骨格が取れていないコマがあります。映像で確かめてください。';
  const sides = samples.filter(s => s.hipX !== null && Math.abs(s.pts - c.pts) <= NEAR_SECONDS)
    .map(s => Math.sign((s.hipX! - gate) * direction)).filter(v => v !== 0);
  const turns = sides.slice(1).filter((v, i) => v !== sides[i]).length;
  if (turns >= 2) return '骨盤の位置が線の前後を行き来しています（構えの揺れ・骨格のぶれ）。映像で確かめてください。';
  return null;
}
