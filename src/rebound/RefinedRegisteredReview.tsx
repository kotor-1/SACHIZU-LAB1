import {useEffect,useMemo,useRef,useState} from 'react';
import type {PoseFrame} from './prediction-observations';
import type {RegisteredAnalysis} from './registered-template';
import type {SubjectRegion} from './subject';
import {createLowerSubjectSelector,type JumpMode} from './lower-body';
import {collectPixelRows} from './pixel-recording';
import {refineReview} from './review-refinement';
import RegisteredReview from './RegisteredReview';

/** Complete the bounded image pass before enabling edits. Cancellation and
 * failures expose the original candidates, never a partly refined aggregate. */
export default function RefinedRegisteredReview({file,poses,region,mode,base}:{
  file:File;poses:readonly PoseFrame[];region:SubjectRegion;mode:JumpMode;base:RegisteredAnalysis;
}) {
  const [state,setState]=useState<{base:RegisteredAnalysis;result:RegisteredAnalysis|null;error:string;progress:number}>({base,result:null,error:'',progress:0});
  const control=useRef<AbortController|null>(null);
  const selected=useMemo(()=>{const select=createLowerSubjectSelector(region,mode);return poses.map(f=>({...f,poses:select(f.poses,f.pts)}));},[poses,region,mode]);
  useEffect(()=>{
    const owner=new AbortController();control.current=owner;
    let mounted=true;
    const current=()=>mounted&&control.current===owner;
    setState({base,result:null,error:'',progress:0});
    const hidden=()=>{if(document.hidden)owner.abort();};document.addEventListener('visibilitychange',hidden);
    void collectPixelRows(file,poses,region,base,owner.signal,p=>{
      if(current()&&!owner.signal.aborted)setState({base,result:null,error:'',progress:p});
    },mode).then(async rows=>{
      // Release paint/input once before the small, bounded boundary fit.
      await new Promise<void>(resolve=>setTimeout(resolve,0));
      if(!current()||owner.signal.aborted)throw new DOMException('中止','AbortError');
      const result=refineReview(base,rows,selected,mode);
      if(current()&&!owner.signal.aborted)setState({base,result,error:'',progress:100});
    }).catch(e=>{
      if(current())setState({base,result:base,error:owner.signal.aborted?'足元の絞り込みを停止しました。元の未確認候補から確認できます。':`足元の絞り込みを実行できませんでした。元候補を表示します。${e instanceof Error?e.message:String(e)}`,progress:0});
    }).finally(()=>{if(current())control.current=null;});
    return ()=>{mounted=false;owner.abort();if(control.current===owner)control.current=null;document.removeEventListener('visibilitychange',hidden);};
  },[file,poses,region,mode,base,selected]);
  const ready=state.base===base&&state.result;
  return <>
    {!ready&&<section className="rj-registration" aria-label="足元の候補を絞り込み"><h2>足元の映像で候補を絞り込み</h2>
      <p role="status">{state.progress}% · 靴の下端の動きを元フレームで確認しています。姿勢モデルの再解析はしません。</p>
      <progress aria-label="足元候補の進捗" value={state.progress} max={100}/>
      <button onClick={()=>control.current?.abort()}>足元の絞り込みを停止</button></section>}
    {ready&&<>{state.error&&<p className="rj-warning" role="alert">{state.error}</p>}
      <RegisteredReview file={file} poses={selected} base={ready} coarse={base}/></>}
  </>;
}
