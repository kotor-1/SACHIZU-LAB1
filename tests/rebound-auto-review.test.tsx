import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { autoReview, reviewSummary, reviewedExport, reviewedCSV } from '../src/rebound/auto-review';
import { correctRegistered } from '../src/rebound/registered-corrections';
import type { PoseFrame } from '../src/rebound/prediction-observations';
import type { SignalResult } from '../src/rebound/waveform-fit';
import RegisteredResults from '../src/rebound/RegisteredResults';

function fixture(count=10) {
  const frames: PoseFrame[] = Array.from({length: Math.ceil((count*.6+.4)*240)},(_,frame) => {
    const pts = frame/240, phase = (pts-.3+.6)%.6;
    const y = phase < .4 ? .9-.2*Math.sin(Math.PI*phase/.4) : .9;
    return {frame,pts,poses:[Array.from({length:33},()=>({x:.5,y,z:0,visibility:1}))]};
  });
  const peaks: SignalResult = {signal:'PELVIS',detected:count,excluded:[],totalFrames:frames.length,validFrames:frames.length,
    peaks:Array.from({length:count},(_,i)=>({frame:120+144*i,pts:.5+.6*i,y:.5}))};
  return {frames,peaks,base:autoReview(frames,peaks,'BOTH')};
}
describe('recording RJ automatic candidates and confirmed review',()=>{
  it('offers candidates without registration and never calls them confirmed',()=>{
    const {base}=fixture();
    expect(base.registration).toBeNull(); expect(base.jumps).toHaveLength(10);
    expect(base.validRSICount).toBe(9); expect(base.meanRSI).toBeGreaterThan(0);
    expect(base.jumps[0].rsi).toBeNull(); expect(base.jumps[0].takeoff?.source).toBe('AUTO_FOOT');
    expect(reviewSummary(base)).toEqual({jumpNumbers:[],count:0,mean:null,max:null});
    const html=renderToStaticMarkup(<RegisteredResults reviewed result={base} seek={()=>{}} saveJSON={()=>{}} saveCSV={()=>{}}/>);
    expect(html).toContain('平均RSI（確認済み 0 回）'); expect(html).toContain('未確認の仮値');
  });
  it('requires all three event dependencies, recalculates locally and exports separate summaries',()=>{
    const {base,frames}=fixture();
    const point=(pts:number)=>frames.reduce((a,b)=>Math.abs(a.pts-pts)<Math.abs(b.pts-pts)?a:b);
    const edits={'2:takeoff':point(base.jumps[1].takeoff!.pts),'2:landing':point(base.jumps[1].landing!.pts)};
    expect(reviewSummary(correctRegistered(base,edits,frames).analysis).count).toBe(0);
    const full={...edits,'1:landing':point(base.jumps[0].landing!.pts)};
    const {analysis,error}=correctRegistered(base,full,frames);
    expect(error).toBeNull(); expect(reviewSummary(analysis).jumpNumbers).toEqual([2]);
    expect(reviewSummary(analysis).mean).toBe(analysis.jumps[1].rsi);
    const data=reviewedExport(analysis,base,full,{name:'local.mov',size:1});
    expect(data.aggregation.policy).toBe('CONFIRMED_EVENTS_ONLY'); expect(data.analysis.validRSICount).toBe(1);
    expect(data.tentativeSummary.validRSICount).toBe(9); expect(data.analysis.meanRSI).toBe(analysis.jumps[1].rsi);
    expect(data.analysis.jumps[2].reviewStatus).toBe('UNCONFIRMED'); expect(reviewedCSV(analysis)).toContain('2,CONFIRMED,');
    expect(reviewSummary(correctRegistered(base,edits,frames).analysis).count).toBe(0);
  });
  it('keeps recognized counts and excludes only the extra eleventh rebound',()=>{
    expect(fixture(5).base.jumps).toHaveLength(5);
    expect(fixture(11).base.jumps).toHaveLength(10);
    expect(fixture(11).base.excludedPeakFrames).toEqual([1560]);
    const {frames,peaks}=fixture(12);
    expect(autoReview(frames,peaks,'BOTH').jumps).toHaveLength(0);
    expect(autoReview(frames,peaks,'BOTH',2).selectedPeakFrames).toEqual(peaks.peaks.slice(1,11).map(p=>p.frame));
  });
  it('does not invent foot events when feet are absent, occluded or ambiguous',()=>{
    const {frames,peaks}=fixture(3);
    frames.forEach(f=>{f.poses[0][31].visibility=0;});
    expect(autoReview(frames,peaks,'BOTH').validRSICount).toBe(0);
    expect(autoReview(frames,peaks,'RIGHT').validRSICount).toBe(2);
    frames.forEach(f=>f.poses.push(f.poses[0]));
    expect(autoReview(frames,peaks,'RIGHT').jumps.every(j=>!j.takeoff&&!j.landing)).toBe(true);
  });
  it('allows a manual correction even if the adjacent automatic event is wrong',()=>{
    const {base,frames}=fixture(); base.jumps[0].landing={pts:.89,source:'AUTO_FOOT'};
    const r=correctRegistered(base,{'2:takeoff':frames[216]},frames);
    expect(r.error).toBeNull(); expect(r.analysis.jumps[1].contactSeconds).toBeNull();
    expect(r.analysis.jumps[1].rsi).toBeNull();
  });
});
