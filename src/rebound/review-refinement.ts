import type { FirstContact } from '../cmj/ExactFramePicker';
import type { JumpMode } from './lower-body';
import type { RegisteredAnalysis } from './registered-template';
import { correctRegistered } from './registered-corrections';
import { fitPixelBoundary, type PixelBoundary, type PixelRow } from './pixel-foot';

export interface ReviewRefinementEvent {
  jump: number; kind: 'takeoff' | 'landing'; originalPts: number | null; pts: number | null;
  applied: boolean; reason: string | null; feet: PixelBoundary[];
}
export interface ReviewRefinement {
  version: string; mode: JumpMode; applied: number; attempted: number; events: ReviewRefinementEvent[];
  polarity?: 'DARK' | 'BRIGHT'; alternateApplied?: number;
}

/** A search location, never an asserted contact/flight duration. Used only
 * when the coarse foot signal has no usable image fit; fits from different search starts
 * must agree. These share the same pixels, not independent measurements. */
export function missingPixelSeed(base:RegisteredAnalysis,frames:readonly FirstContact[],index:number,kind:'takeoff'|'landing'):number|null {
  const peak=frames.find(f=>f.frame===base.selectedPeakFrames[index]);
  const neighbour=frames.find(f=>f.frame===base.selectedPeakFrames[index+(kind==='takeoff'?-1:1)])
    ?? frames.find(f=>f.frame===base.selectedPeakFrames[index+(kind==='takeoff'?1:-1)]);
  if(!peak||!neighbour)return null;
  const period=Math.abs(peak.pts-neighbour.pts);
  return period>=.25&&period<=1.2 ? peak.pts+(kind==='takeoff'?-1:1)*.32*period : null;
}

/** The last landing has no next apex to bracket it. Search farther after the
 * prior-apex seed, but still require two agreeing independent fit starts on
 * the actual image trace; no flight duration is assigned from this offset. */
export function missingPixelOffsets(base: RegisteredAnalysis, index: number, kind: 'takeoff' | 'landing'): readonly number[] {
  return kind === 'landing' && index === base.jumps.length - 1 ? [-.04, 0, .04, .08, .12] : [-.04, 0, .04];
}

/** Refine unconfirmed cursors only. This is neither a contact classifier nor
 * confirmation: reviewed RSI still requires the user's three event marks.
 * No manual reference, target RSI, or constant frame shift enters the fit. */
export function refineReview(base: RegisteredAnalysis, rows: readonly PixelRow[], frames: readonly FirstContact[], mode: JumpMode): RegisteredAnalysis {
  if (rows.length && rows.every(row => row.darkFeet && row.brightFeet)) {
    const variant = (polarity: 'DARK' | 'BRIGHT') => refineReview(base,
      rows.map(row => ({ frame: row.frame, pts: row.pts, feet: polarity === 'DARK' ? row.darkFeet! : row.brightFeet! })), frames, mode);
    const dark = variant('DARK'), bright = variant('BRIGHT');
    // A coherent boundary must survive both feet, three thresholds and three
    // fit windows. Prefer the polarity satisfying more such checks throughout
    // this recording, never a target jump height or RSI. Ties preserve the
    // original dark-shoe behavior rather than choosing per frame.
    const darkCount = dark.footRefinement?.applied ?? 0, brightCount = bright.footRefinement?.applied ?? 0;
    const chosen = brightCount > darkCount ? bright : dark;
    return { ...chosen, footRefinement: chosen.footRefinement && {
      ...chosen.footRefinement, polarity: brightCount > darkCount ? 'BRIGHT' : 'DARK',
      alternateApplied: brightCount > darkCount ? darkCount : brightCount,
    } };
  }
  const sides: (0|1)[] = mode === 'LEFT' ? [0] : mode === 'RIGHT' ? [1] : [0,1];
  const events: ReviewRefinementEvent[] = [];
  const validTimeline = frames.length > 0 && frames.every((f,i) => Number.isFinite(f.pts) && Number.isInteger(f.frame)
    && (!i || f.pts > frames[i-1].pts && f.frame > frames[i-1].frame))
    && rows.every((r,i) => frames.some(f => f.frame === r.frame && Math.abs(f.pts-r.pts) < 1e-7) && (!i || r.pts > rows[i-1].pts));
  const jumps = base.jumps.map((j,i) => {
    const next = {...j};
    for (const kind of ['takeoff','landing'] as const) {
      const boundary = j[kind];
      if (boundary?.source === 'MANUAL') continue;
      const event: ReviewRefinementEvent = {jump:j.jump,kind,originalPts:boundary?.pts ?? null,pts:null,applied:false,reason:null,feet:[]};
      events.push(event);
      if (!validTimeline) {event.reason='元フレームの時刻が一致しません'; continue;}
      event.feet=boundary?sides.map(side=>fitPixelBoundary(rows,side,boundary.pts,kind)):[];
      const consistent=(feet:PixelBoundary[])=>feet.length===sides.length&&feet.every(f=>f.pts!==null)
        && Math.max(...feet.map(f=>f.pts!))-Math.min(...feet.map(f=>f.pts!))<=.025+1e-9;
      // A poor pose-derived cursor can place the local window entirely before
      // the motion change. Retry from the apex neighbourhood, only on failure.
      // An already accepted local fit must never be moved by this fallback.
      if (!consistent(event.feet)) {
        const seed=missingPixelSeed(base,frames,i,kind);
        if(seed===null){event.reason='起点の候補がありません。映像で確認してください';continue;}
        const alternatives=missingPixelOffsets(base,i,kind).map(offset=>sides.map(side=>fitPixelBoundary(rows,side,seed+offset,kind)))
          .filter(consistent);
        const times=alternatives.map(feet=>(kind==='takeoff'?Math.max:Math.min)(...feet.map(f=>f.pts!)));
        if(times.length<2||Math.max(...times)-Math.min(...times)>.025+1e-9){event.reason='足元の再探索で複数の画像候補が一致しません';continue;}
        const median=[...times].sort((a,b)=>a-b)[Math.floor(times.length/2)];
        event.feet=alternatives[times.indexOf(median)];
      }
      if (event.feet.some(f=>f.pts===null)) {event.reason='足元の動きから候補を絞れませんでした'; continue;}
      const times = event.feet.map(f=>f.pts!);
      if (Math.max(...times)-Math.min(...times) > .025+1e-9) {event.reason='左右の足の候補が一致しません'; continue;}
      const pts = (kind === 'takeoff' ? Math.max : Math.min)(...times);
      const apex = frames.find(f=>f.frame===base.selectedPeakFrames[i]);
      if (!apex || (kind==='takeoff' ? pts>=apex.pts : pts<=apex.pts)) {event.reason='頂点との順序が一致しません'; continue;}
      if (!frames.some(f=>Math.abs(f.pts-pts)<1e-7)) {event.reason='元フレームに対応する候補がありません'; continue;}
      event.pts=pts; event.applied=true;
      next[kind]={pts,source:'PIXEL_REFINED'};
    }
    return next;
  });
  // Revert proposed changes involved in a contradictory interval. Unchanged
  // old candidates may still be missing/invalid; do not invent new timings.
  const reject = (jump:number,kind:'takeoff'|'landing') => {
    const e=events.find(e=>e.jump===jump&&e.kind===kind);
    if(!e?.applied) return;
    e.applied=false; e.reason='隣の候補との時間間隔が不成立です';
    const index=jumps.findIndex(j=>j.jump===jump); jumps[index][kind]=base.jumps[index][kind];
  };
  for(let pass=0;pass<jumps.length;pass++) {
    const before=events.filter(e=>e.applied).length;
    jumps.forEach((j,i)=>{
      const flight=j.takeoff&&j.landing ? j.landing.pts-j.takeoff.pts : null;
      const previous=jumps[i-1]?.landing;
      const contact=j.takeoff&&previous ? j.takeoff.pts-previous.pts : null;
      if(flight!==null&&(flight<.12||flight>.9)) {reject(j.jump,'takeoff');reject(j.jump,'landing');}
      if(contact!==null&&(contact<.06||contact>.6)) {reject(j.jump,'takeoff');reject(jumps[i-1].jump,'landing');}
    });
    if(before===events.filter(e=>e.applied).length) break;
  }
  const report:ReviewRefinement = {version:'foot-review-v1',mode,events,applied:events.filter(e=>e.applied).length,attempted:events.length};
  const result=correctRegistered({...base,jumps}, {},frames);
  if(result.error) return {...base,footRefinement:{...report,applied:0,events:events.map(e=>({...e,applied:false,reason:result.error}))}};
  return {...result.analysis,footRefinement:report};
}
