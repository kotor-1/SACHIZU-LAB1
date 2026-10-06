import{r as Ee,j as pe}from"./index-CJVIMzRP.js";import{P as Vo,n as Fo}from"./pose-drawing-BrHAClDZ.js";import{S as xr,d as ba,t as Jp}from"./video-orientation-DNKyXU7h.js";import{d as uy,u as dt,M as Yn}from"./session-lifecycle-HAlMxkI0.js";const yw="sprint10-experimental-v10",ly=["歩数は、2本のラインの間に経過した脚の入れ替わり（遊脚が支持脚を追い越す動き）の周期の数です。ライン上の半端な1歩は周期の割合で数えます。接地回数を1つずつ数えた値ではありません。","各歩の距離は骨盤の画面内移動をライン間隔（既知の距離）で比例換算した推定です。真の全身重心・接地位置間の距離ではなく、遠近やカメラの揺れも補正していません。"],ai=e=>{const t=[...e].sort((r,i)=>r-i);return t.length?t[Math.floor(t.length/2)]:0};function dy(e){const t=i=>{const n=[...i].sort((s,o)=>s-o),a=Math.floor(n.length/2);return n.length?n.length%2?n[a]:(n[a-1]+n[a])/2:0},r=t(e);return t(e.filter(i=>i<=Qn[1]*r+wa))}const Lr=e=>!!e&&Number.isFinite(e.x)&&Number.isFinite(e.y)&&e.x>0&&e.x<1&&e.y>0&&e.y<1&&(e.visibility??0)>=.3,wa=1e-9,ze=(e,t)=>e-t>wa;function gi(e){const t=[];for(let r=1;r<e.length;r++)e[r].hipX!==null&&e[r-1].hipX!==null&&t.push(e[r].pts-e[r-1].pts);return Math.max(.05,2.5*(t.length?ai(t):0))}const _w=.2;function ec(e,t=gi(e),r=0){const i=new Map;for(let n=1;n<e.length;n++)i.set(e[n],e[n-1]);return(n,a)=>!ze(a.pts-n.pts,t)||i.get(a)===n&&!ze(a.pts-n.pts,r)}const Pt=(e,t)=>t-e>wa,si=.65,py=.025,Qn=[.7,1.5];function Fi(e,t,r,i){const n=[23,24].every(o=>Lr(e[o])),a=[23,24,25,26,27,28].every(o=>Lr(e[o])),s=(o,l)=>Math.hypot((e[o].x-e[l].x)*i,e[o].y-e[l].y);return{frame:t,pts:r,hipX:n?(e[23].x+e[24].x)/2:null,ankleGap:[27,28].every(o=>Lr(e[o]))?Math.abs(e[27].x-e[28].x)*i:null,kneeGap:[25,26].every(o=>Lr(e[o]))?Math.abs(e[25].x-e[26].x)*i:null,legLength:a?(s(23,25)+s(25,27)+s(24,26)+s(26,28))/2:null}}function cy(e,t,r,i=ec(e)){const n=[],a=e.filter(s=>s.hipX!==null);for(let s=1;s<a.length;s++){const o=a[s-1],l=a[s],d=(o.hipX-t)*r,p=(l.hipX-t)*r;if(d>0||p<=0||!i(o,l))continue;const h=a.some(m=>m.pts<=o.pts&&!ze(o.pts-m.pts,.15)&&(m.hipX-t)*r<-.003),f=a.some(m=>m.pts>=l.pts&&!ze(m.pts-l.pts,.15)&&(m.hipX-t)*r>.003);if(!h||!f)continue;const g=o.pts+-d/(p-d)*(l.pts-o.pts);(!n.length||ze(g-n.at(-1).pts,.15))&&n.push({pts:g,before:o.pts,after:l.pts,frame:l.frame})}return n}function hy(e,t,r=gi(e)){const i=t?e.filter(x=>!Pt(x.pts,t.startPts)&&!ze(x.pts,t.finishPts)):e,n=ai(i.flatMap(x=>x.legLength!==null&&x.legLength>.01?[x.legLength]:[]));if(!n)return{events:[],gaps:[]};const s=(t?e.filter(x=>!Pt(x.pts,t.startPts-si)&&!ze(x.pts,t.finishPts+si)):e).filter(x=>x.ankleGap!==null&&x.kneeGap!==null),o=x=>x.map(I=>({...I,value:ai(x.filter(C=>!ze(Math.abs(C.pts-I.pts),py)).map(C=>C.ankleGap/n))})),l=o(s),p=(t?o(i.filter(x=>x.ankleGap!==null&&x.kneeGap!==null)):l).map(x=>x.value).sort((x,I)=>x-I),h=p[Math.floor(p.length*.9)]??0;if(h<.2)return{events:[],gaps:[]};const f=h*.55,g=h*.3,m=[],b=[];let v=!1,$=null,w=null,S=[];for(const x of l){const I=w;if(w&&ze(x.pts-w.pts,r)&&(b.push([w.pts,x.pts]),v=!1,$=null,S=[]),w=x,!v){x.value>=(f+g)/2&&(v=!0);continue}if(x.value<=g&&(!$||x.value<$.value)?($=x,S=[x]):$&&x.value===$.value&&S.at(-1)===I&&S.push(x),$&&x.value>=f){const z=s.filter(D=>!ze(Math.abs(D.pts-$.pts),.06)).some(D=>D.kneeGap/n<.4),k=S[S.length-1>>1]??$;z&&(!m.length||!Pt(k.pts-m.at(-1).pts,.12))&&m.push({pts:k.pts,frame:k.frame}),$=null,S=[]}}return{events:m,gaps:b}}function fy(e,t,r,i,n,a,s=10,o=gi(e)){const l=[];for(let d=1;d<t.length;d++){const p=t[d-1],h=t[d],f=e.find(S=>S.frame===p.frame&&S.pts===p.pts),g=e.find(S=>S.frame===h.frame&&S.pts===h.pts),b=e.filter(S=>S.pts>=p.pts&&S.pts<=h.pts).filter(S=>S.hipX!==null&&Number.isFinite(S.hipX)&&S.ankleGap!==null&&S.kneeGap!==null).map(S=>S.pts),v=h.pts-p.pts;let $=null;Pt(p.pts,n)||ze(h.pts,a)?$="区間外を含むため未算出":Pt(v,.12)||ze(v,si)?$="入れ替わり周期を確認できません":f?.hipX==null||g?.hipX==null||!Number.isFinite(f.hipX)||!Number.isFinite(g.hipX)?$="端点の骨盤位置がありません":(!b.length||ze(b[0]-p.pts,o)||ze(h.pts-b.at(-1),o)||b.some((S,x)=>x>0&&ze(S-b[x-1],o)))&&($="この区間の追跡が途切れています");const w=f?.hipX!=null&&g?.hipX!=null?s*(g.hipX-f.hipX)/(i-r):NaN;!$&&(!Number.isFinite(w)||w<=0||w>10)&&($="進行方向の移動距離を確認できません"),l.push({fromStep:d,toStep:d+1,fromPts:p.pts,toPts:h.pts,fromHipX:f?.hipX??null,toHipX:g?.hipX??null,distanceM:$?null:w,reason:$})}return l}const my={standing:{noFinish:"ゴール通過を確認できません。ゴールラインの位置と、ゴールを越えた後まで選手が映っているかを確認してください。",startGap:"スタートラインを越える瞬間の追跡が途切れています。スタート付近が隠れない位置から撮影してください。",noStart:"スタートラインより後ろにいる選手を確認できません。ラインを選手の立ち位置より少し後ろに置くか、走り出す前から映った動画を使ってください。"},flying:{noFinish:"出口の線の通過を確認できません。選手が出口の線を越えるまで動画が続いているか、出口の付近で選手が他の人と重なっていないか確認してください。",startGap:"入口の線を越える瞬間の追跡が途切れています。入口の付近で選手が他の人や物に隠れていないか確認してください。",noStart:"入口の線を越える選手を捉えられませんでした。入口の付近で選手が他の人と重なっている場合や、線を越えた後0.1秒以上、体が画面の外にかかっている場合は測れません。"}},gy=.25,yy=.1,tc=.2,_y=.08,by=.006;function rc(e){let t=e;for(let r=0;r<3;r++){if(t.length<3)return null;const i=t.reduce((p,h)=>p+h.pts,0)/t.length,n=t.reduce((p,h)=>p+h.hipX,0)/t.length,a=t.reduce((p,h)=>p+(h.pts-i)**2,0);if(!(a>0))return null;const s=t.reduce((p,h)=>p+(h.pts-i)*(h.hipX-n),0)/a,o=t.map(p=>Math.abs(p.hipX-(n+s*(p.pts-i)))),l=1.4826*ai(o),d=t.filter((p,h)=>o[h]<=Math.max(by,3*l));if(d.length===t.length||d.length<3||r===2)return{mt:i,mx:n,speed:s,used:t};t=d}return null}function Ho(e,t,r,i){let n=i.pts;for(let a=0;a<3;a++){const s=rc(e.filter(d=>!ze(Math.abs(d.pts-n),_y)));if(!s||!(s.speed*r>=tc)||s.used.length<5)return i;const o=s.mt+(t-s.mx)/s.speed;if(o<s.used[0].pts||o>s.used.at(-1).pts)return i;const l=Math.abs(o-n)<.001;if(n=o,l)break}return{...i,pts:n}}function jo(e,t,r,i,n,a){const s=i==="entry"?e:[...e].reverse(),o=[s[0]];for(const g of s.slice(1)){const[m,b]=i==="entry"?[o.at(-1),g]:[g,o.at(-1)];if(!a(m,b)||ze(Math.abs(g.pts-o[0].pts),gy))break;o.push(g)}if(o.length<3||Pt(Math.abs(o.at(-1).pts-o[0].pts),.05))return null;const l=rc(o);if(!l||!(l.speed*r>=tc))return null;const d=i==="entry"?l.used.reduce((g,m)=>m.pts<g.pts?m:g):l.used.reduce((g,m)=>m.pts>g.pts?m:g),p=l.mt+(t-l.mx)/l.speed,h=Math.abs(d.pts-p);return!((d.hipX-t)*r*(i==="entry"?1:-1)>0)||ze(h,yy)||p<n[0]||p>n[1]?null:i==="entry"?{pts:p,before:p,after:d.pts,frame:d.frame,extendedSeconds:h}:{pts:p,before:d.pts,after:p,frame:d.frame,extendedSeconds:h}}const wy=.6;function $y(e,t,r,i){const n=e.events.filter($=>!Pt($.pts,r-1)&&!ze($.pts,i+1)),a=$=>$.slice(1).map((w,S)=>w.pts-$[S].pts),s=dy(t.length>=3?a(t):a(n));if(!(s>0))return null;const o=[...t];let l=0;for(;;){const $=o.slice(1).map((I,C)=>I.pts-o[C].pts),w=$.reduce((I,C,z)=>C<$[I]?z:I,0);if(!$.length||$[w]>=wy*s)break;const S=w>0?$[w-1]:1/0,x=w+1<$.length?$[w+1]:1/0;o.splice(Math.abs(S+$[w]-s)<Math.abs(x+$[w]-s)?w:w+1,1),l++}const d=o.slice(1).map(($,w)=>($.pts-o[w].pts)/s),p=d.map($=>$<=Qn[1]+1e-9?1:Math.max(2,Math.round($))),h=d.some(($,w)=>p[w]>=2&&Math.abs($-p[w])>.35);if(!o.length)return{count:(i-r)/s,steps:o,multiples:p,edges:null,estimatedEdges:[!1,!1],ambiguous:h,removed:l,cycle:s};const f=e.events.filter($=>$.pts<=r).at(-1),g=e.events.find($=>$.pts>=i),m=($,w)=>{const S=$?Math.abs(w.pts-$.pts):NaN;return $&&!ze(S,si)&&S/s<=Qn[1]&&!e.gaps.some(([I,C])=>I<Math.max(w.pts,$.pts)&&C>Math.min(w.pts,$.pts))?S:s},b=(o[0].pts-r)/m(f,o[0]),v=(i-o.at(-1).pts)/m(g,o.at(-1));return{count:p.reduce(($,w)=>$+w,0)+b+v,steps:o,multiples:p,edges:[b,v],estimatedEdges:[b>1+1e-9,v>1+1e-9],ambiguous:h,removed:l,cycle:s}}const vy=.02;function xy(e){const t=e.filter(i=>i.hipX!==null),r=new Set;for(const i of t){const n=t.filter(d=>d!==i&&!ze(Math.abs(d.pts-i.pts),.1));if(n.length<4)continue;const a=n.reduce((d,p)=>d+p.pts,0)/n.length,s=n.reduce((d,p)=>d+p.hipX,0)/n.length,o=n.reduce((d,p)=>d+(p.pts-a)**2,0),l=o>0?n.reduce((d,p)=>d+(p.pts-a)*(p.hipX-s),0)/o:0;Math.abs(i.hipX-(s+l*(i.pts-a)))>vy&&r.add(i)}return r.size?e.map(i=>r.has(i)?{...i,hipX:null}:i):e}function bw(e,t,r,i=10,n="standing",a=0){const s=my[n],o={start:null,finish:null,duration:null,steps:[],count:null,speed:null,cadence:null,stride:null,edgeFractions:null,strideIntervals:[],warnings:[],reason:null};if(![t,r].every(q=>Number.isFinite(q)&&q>0&&q<1)||Math.abs(r-t)<.1)return{...o,reason:"スタートとゴールを離して設定してください。"};if(!e.length||e.some((q,H)=>!Number.isFinite(q.pts)||H>0&&q.pts<=e[H-1].pts))return{...o,reason:"動画の時刻を確認できません。"};const l=Math.sign(r-t),d=n==="flying"?xy(e):e,p=d.filter(q=>q.hipX!==null),h=[e[0].pts,e.at(-1).pts],f=gi(d),g=ec(d,f,a),m=cy(d,r,l,g);if(!m.length&&n==="flying"){let q=p.length-1;for(;q>=0&&(p[q].hipX-r)*l>0;)q--;const H=q<0?null:jo(p.slice(0,q+1),r,l,"exit",h,g);H&&m.push(H)}if(!m.length)return{...o,reason:s.noFinish};let b=null,v=null,$=!1;for(const q of m){const H=p.filter(se=>se.pts<q.pts);let X=H.length-1;for(;X>=0&&(H[X].hipX-t)*l>0;)X--;if(X===H.length-1)continue;const W=H[X],J=H[X+1];if(X<0||!g(W,J)){const se=n==="flying"?jo(H.slice(X+1),t,l,"entry",h,g):null;if(se){b=se,v=q;break}X>=0&&($=!0);continue}const Q=(W.hipX-t)*l,R=(J.hipX-t)*l;b={pts:W.pts+-Q/(R-Q)*(J.pts-W.pts),before:W.pts,after:J.pts,frame:J.frame},v=q;break}if(n==="flying"&&b&&v&&(b.extendedSeconds||(b=Ho(p,t,l,b)),v.extendedSeconds||(v=Ho(p,r,l,v))),!b||!v)return{...o,reason:$?s.startGap:s.noStart};const w=v.pts-b.pts,S=m.filter(q=>q.pts>v.pts+1),x=hy(e,{startPts:b.pts,finishPts:v.pts},f),I=b.extendedSeconds?b.after:b.pts,C=v.extendedSeconds?v.before:v.pts,z=e.filter(q=>q.pts>=I&&q.pts<=C),k=z.filter(q=>q.ankleGap!==null&&q.kneeGap!==null).length/Math.max(1,z.length),D=[I,...z.filter(q=>q.ankleGap!==null&&q.kneeGap!==null).map(q=>q.pts),C],L=k<.9||x.gaps.some(([q,H])=>q<C&&H>I)||D.some((q,H)=>H>0&&ze(q-D[H-1],f)),j=x.events.filter(q=>q.pts>b.pts&&q.pts<v.pts),O=$y(x,j,b.pts,v.pts),G=O?.count??null,M=[...ly];if(!O)M.unshift("脚の入れ替わりを2回以上捉えられなかったため、歩数・ピッチ・歩幅を出せません。");else{const q=[];O.removed&&q.push(`入れ替わりの誤検出と思われるもの（${O.removed}回）を除いて数えました。`),O.steps.length||q.push(`区間内の入れ替わりを捉えられなかったため、歩数は周期（${O.cycle.toFixed(3)}秒）から推定しました。`);const H=O.multiples.reduce((X,W)=>X+W-1,0);H===1?q.push("脚の入れ替わりを1回見逃した区間があり、周期の長さから2歩分として数えました。"):H>1&&q.push(`脚の入れ替わりを${H}回見逃した区間があり、周期の長さから数えました。`),O.estimatedEdges[0]&&q.push(`入口の直後の入れ替わりが映っていないため、その部分は周期（${O.cycle.toFixed(3)}秒）から推定しました。`),O.estimatedEdges[1]&&q.push(`出口の直前の入れ替わりが映っていないため、その部分は周期（${O.cycle.toFixed(3)}秒）から推定しました。`),O.ambiguous&&q.push("1歩分とも2歩分とも決めにくい周期があり、歩数が1歩ずれている可能性があります。"),L&&!H&&!O.estimatedEdges.some(Boolean)&&q.push("脚が映っていない時間がありますが、その前後の入れ替わりの間隔は通常の周期でした。"),M.unshift(...q)}S.length&&M.unshift("ゴールを2回以上越えています。最初の走りを解析しました。");const B=(q,H,X)=>`${q}の線を越える瞬間の骨盤は映っていない（体が画面の端にかかる・隠れる）ため、${X}の動きを${Math.round(H.extendedSeconds*1e3)}ミリ秒延ばして通過時刻を推定しました。`;v.extendedSeconds&&M.unshift(B("出口",v,"直前")),b.extendedSeconds&&M.unshift(B("入口",b,"直後"));const V=O?.steps??j,Y=O?.multiples??[];return{...o,start:b,finish:v,duration:w,speed:i/w,steps:V,count:G,edgeFractions:O?.edges??null,strideIntervals:fy(e,V,t,r,b.pts,v.pts,i,f).map((q,H)=>(Y[H]??1)>1?{...q,distanceM:null,reason:`入れ替わりの見逃しで${Y[H]}歩分の区間です`}:q),cadence:G===null?null:G/w,stride:G===null?null:i/G,warnings:M}}var $a=Object.defineProperty,Sy=Object.getOwnPropertyDescriptor,ky=Object.getOwnPropertyNames,Ty=Object.prototype.hasOwnProperty,Iy=(e=>typeof require<"u"?require:typeof Proxy<"u"?new Proxy(e,{get:(t,r)=>(typeof require<"u"?require:t)[r]}):e)(function(e){if(typeof require<"u")return require.apply(this,arguments);throw Error('Dynamic require of "'+e+'" is not supported')}),F=(e,t)=>()=>(e&&(t=e(e=0)),t),ir=(e,t)=>{for(var r in t)$a(e,r,{get:t[r],enumerable:!0})},Ey=(e,t,r,i)=>{if(t&&typeof t=="object"||typeof t=="function")for(let n of ky(t))!Ty.call(e,n)&&n!==r&&$a(e,n,{get:()=>t[n],enumerable:!(i=Sy(t,n))||i.enumerable});return e},kr=e=>Ey($a({},"__esModule",{value:!0}),e),ur,vt,Yt,Ko,ic,nc=F(()=>{ur=new Map,vt=[],Yt=(e,t,r)=>{if(t&&typeof t.init=="function"&&typeof t.createInferenceSessionHandler=="function"){let i=ur.get(e);if(i===void 0)ur.set(e,{backend:t,priority:r});else{if(i.priority>r)return;if(i.priority===r&&i.backend!==t)throw new Error(`cannot register backend "${e}" using priority ${r}`)}if(r>=0){let n=vt.indexOf(e);n!==-1&&vt.splice(n,1);for(let a=0;a<vt.length;a++)if(ur.get(vt[a]).priority<=r){vt.splice(a,0,e);return}vt.push(e)}return}throw new TypeError("not a valid backend")},Ko=async e=>{let t=ur.get(e);if(!t)return"backend not found.";if(t.initialized)return t.backend;if(t.aborted)return t.error;{let r=!!t.initPromise;try{return r||(t.initPromise=t.backend.init(e)),await t.initPromise,t.initialized=!0,t.backend}catch(i){return r||(t.error=`${i}`,t.aborted=!0),t.error}finally{delete t.initPromise}}},ic=async e=>{let t=e.executionProviders||[],r=t.map(l=>typeof l=="string"?l:l.name),i=r.length===0?vt:r,n,a=[],s=new Set;for(let l of i){let d=await Ko(l);typeof d=="string"?a.push({name:l,err:d}):(n||(n=d),n===d&&s.add(l))}if(!n)throw new Error(`no available backend found. ERR: ${a.map(l=>`[${l.name}] ${l.err}`).join(", ")}`);for(let{name:l,err:d}of a)r.includes(l)&&console.warn(`removing requested execution provider "${l}" from session options because it is not available: ${d}`);let o=t.filter(l=>s.has(typeof l=="string"?l:l.name));return[n,new Proxy(e,{get:(l,d)=>d==="executionProviders"?o:Reflect.get(l,d)})]}}),Cy=F(()=>{nc()}),ac,zy=F(()=>{ac="1.27.0"}),Hi,Oe,sc=F(()=>{zy(),Hi="warning",Oe={wasm:{},webgl:{},webgpu:{},versions:{common:ac},set logLevel(e){if(e!==void 0){if(typeof e!="string"||["verbose","info","warning","error","fatal"].indexOf(e)===-1)throw new Error(`Unsupported logging level: ${e}`);Hi=e}},get logLevel(){return Hi}},Object.defineProperty(Oe,"logLevel",{enumerable:!0})}),be,Ay=F(()=>{sc(),be=Oe}),oc,uc,My=F(()=>{oc=(e,t)=>{let r=typeof document<"u"?document.createElement("canvas"):new OffscreenCanvas(1,1);r.width=e.dims[3],r.height=e.dims[2];let i=r.getContext("2d");if(i!=null){let n,a;t?.tensorLayout!==void 0&&t.tensorLayout==="NHWC"?(n=e.dims[2],a=e.dims[3]):(n=e.dims[3],a=e.dims[2]);let s=t?.format!==void 0?t.format:"RGB",o=t?.norm,l,d;o===void 0||o.mean===void 0?l=[255,255,255,255]:typeof o.mean=="number"?l=[o.mean,o.mean,o.mean,o.mean]:(l=[o.mean[0],o.mean[1],o.mean[2],0],o.mean[3]!==void 0&&(l[3]=o.mean[3])),o===void 0||o.bias===void 0?d=[0,0,0,0]:typeof o.bias=="number"?d=[o.bias,o.bias,o.bias,o.bias]:(d=[o.bias[0],o.bias[1],o.bias[2],0],o.bias[3]!==void 0&&(d[3]=o.bias[3]));let p=a*n,h=0,f=p,g=p*2,m=-1;s==="RGBA"?(h=0,f=p,g=p*2,m=p*3):s==="RGB"?(h=0,f=p,g=p*2):s==="RBG"&&(h=0,g=p,f=p*2);for(let b=0;b<a;b++)for(let v=0;v<n;v++){let $=(e.data[h++]-d[0])*l[0],w=(e.data[f++]-d[1])*l[1],S=(e.data[g++]-d[2])*l[2],x=m===-1?255:(e.data[m++]-d[3])*l[3];i.fillStyle="rgba("+$+","+w+","+S+","+x+")",i.fillRect(v,b,1,1)}if("toDataURL"in r)return r.toDataURL();throw new Error("toDataURL is not supported")}else throw new Error("Can not access image data")},uc=(e,t)=>{let r=typeof document<"u"?document.createElement("canvas").getContext("2d"):new OffscreenCanvas(1,1).getContext("2d"),i;if(r!=null){let n,a,s;t?.tensorLayout!==void 0&&t.tensorLayout==="NHWC"?(n=e.dims[2],a=e.dims[1],s=e.dims[3]):(n=e.dims[3],a=e.dims[2],s=e.dims[1]);let o=t!==void 0&&t.format!==void 0?t.format:"RGB",l=t?.norm,d,p;l===void 0||l.mean===void 0?d=[255,255,255,255]:typeof l.mean=="number"?d=[l.mean,l.mean,l.mean,l.mean]:(d=[l.mean[0],l.mean[1],l.mean[2],255],l.mean[3]!==void 0&&(d[3]=l.mean[3])),l===void 0||l.bias===void 0?p=[0,0,0,0]:typeof l.bias=="number"?p=[l.bias,l.bias,l.bias,l.bias]:(p=[l.bias[0],l.bias[1],l.bias[2],0],l.bias[3]!==void 0&&(p[3]=l.bias[3]));let h=a*n;if(t!==void 0&&(t.format!==void 0&&s===4&&t.format!=="RGBA"||s===3&&t.format!=="RGB"&&t.format!=="BGR"))throw new Error("Tensor format doesn't match input tensor dims");let f=4,g=0,m=1,b=2,v=3,$=0,w=h,S=h*2,x=-1;o==="RGBA"?($=0,w=h,S=h*2,x=h*3):o==="RGB"?($=0,w=h,S=h*2):o==="RBG"&&($=0,S=h,w=h*2),i=r.createImageData(n,a);for(let I=0;I<a*n;g+=f,m+=f,b+=f,v+=f,I++)i.data[g]=(e.data[$++]-p[0])*d[0],i.data[m]=(e.data[w++]-p[1])*d[1],i.data[b]=(e.data[S++]-p[2])*d[2],i.data[v]=x===-1?255:(e.data[x++]-p[3])*d[3]}else throw new Error("Can not access image data");return i}}),qr,lc,dc,pc,cc,hc,Oy=F(()=>{va(),qr=(e,t)=>{if(e===void 0)throw new Error("Image buffer must be defined");if(t.height===void 0||t.width===void 0)throw new Error("Image height and width must be defined");if(t.tensorLayout==="NHWC")throw new Error("NHWC Tensor layout is not supported yet");let{height:r,width:i}=t,n=t.norm??{mean:255,bias:0},a,s;typeof n.mean=="number"?a=[n.mean,n.mean,n.mean,n.mean]:a=[n.mean[0],n.mean[1],n.mean[2],n.mean[3]??255],typeof n.bias=="number"?s=[n.bias,n.bias,n.bias,n.bias]:s=[n.bias[0],n.bias[1],n.bias[2],n.bias[3]??0];let o=t.format!==void 0?t.format:"RGBA",l=t.tensorFormat!==void 0&&t.tensorFormat!==void 0?t.tensorFormat:"RGB",d=r*i,p=l==="RGBA"?new Float32Array(d*4):new Float32Array(d*3),h=4,f=0,g=1,m=2,b=3,v=0,$=d,w=d*2,S=-1;o==="RGB"&&(h=3,f=0,g=1,m=2,b=-1),l==="RGBA"?S=d*3:l==="RBG"?(v=0,w=d,$=d*2):l==="BGR"&&(w=0,$=d,v=d*2);for(let x=0;x<d;x++,f+=h,m+=h,g+=h,b+=h)p[v++]=(e[f]+s[0])/a[0],p[$++]=(e[g]+s[1])/a[1],p[w++]=(e[m]+s[2])/a[2],S!==-1&&b!==-1&&(p[S++]=(e[b]+s[3])/a[3]);return l==="RGBA"?new We("float32",p,[1,4,r,i]):new We("float32",p,[1,3,r,i])},lc=async(e,t)=>{let r=typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement,i=typeof ImageData<"u"&&e instanceof ImageData,n=typeof ImageBitmap<"u"&&e instanceof ImageBitmap,a=typeof e=="string",s,o=t??{},l=()=>{if(typeof document<"u")return document.createElement("canvas");if(typeof OffscreenCanvas<"u")return new OffscreenCanvas(1,1);throw new Error("Canvas is not supported")},d=p=>typeof HTMLCanvasElement<"u"&&p instanceof HTMLCanvasElement||p instanceof OffscreenCanvas?p.getContext("2d"):null;if(r){let p=l();p.width=e.width,p.height=e.height;let h=d(p);if(h!=null){let f=e.height,g=e.width;if(t!==void 0&&t.resizedHeight!==void 0&&t.resizedWidth!==void 0&&(f=t.resizedHeight,g=t.resizedWidth),t!==void 0){if(o=t,t.tensorFormat!==void 0)throw new Error("Image input config format must be RGBA for HTMLImageElement");o.tensorFormat="RGBA",o.height=f,o.width=g}else o.tensorFormat="RGBA",o.height=f,o.width=g;h.drawImage(e,0,0),s=h.getImageData(0,0,g,f).data}else throw new Error("Can not access image data")}else if(i){let p,h;if(t!==void 0&&t.resizedWidth!==void 0&&t.resizedHeight!==void 0?(p=t.resizedHeight,h=t.resizedWidth):(p=e.height,h=e.width),t!==void 0&&(o=t),o.format="RGBA",o.height=p,o.width=h,t!==void 0){let f=l();f.width=h,f.height=p;let g=d(f);if(g!=null)g.putImageData(e,0,0),s=g.getImageData(0,0,h,p).data;else throw new Error("Can not access image data")}else s=e.data}else if(n){if(t===void 0)throw new Error("Please provide image config with format for Imagebitmap");let p=l();p.width=e.width,p.height=e.height;let h=d(p);if(h!=null){let f=e.height,g=e.width;return h.drawImage(e,0,0,g,f),s=h.getImageData(0,0,g,f).data,o.height=f,o.width=g,qr(s,o)}else throw new Error("Can not access image data")}else{if(a)return new Promise((p,h)=>{let f=l(),g=d(f);if(!e||!g)return h();let m=new Image;m.crossOrigin="Anonymous",m.src=e,m.onload=()=>{f.width=m.width,f.height=m.height,g.drawImage(m,0,0,f.width,f.height);let b=g.getImageData(0,0,f.width,f.height);o.height=f.height,o.width=f.width,p(qr(b.data,o))}});throw new Error("Input data provided is not supported - aborted tensor creation")}if(s!==void 0)return qr(s,o);throw new Error("Input data provided is not supported - aborted tensor creation")},dc=(e,t)=>{let{width:r,height:i,download:n,dispose:a}=t,s=[1,i,r,4];return new We({location:"texture",type:"float32",texture:e,dims:s,download:n,dispose:a})},pc=(e,t)=>{let{dataType:r,dims:i,download:n,dispose:a}=t;return new We({location:"gpu-buffer",type:r??"float32",gpuBuffer:e,dims:i,download:n,dispose:a})},cc=(e,t)=>{let{dataType:r,dims:i,download:n,dispose:a}=t;return new We({location:"ml-tensor",type:r??"float32",mlTensor:e,dims:i,download:n,dispose:a})},hc=(e,t,r)=>new We({location:"cpu-pinned",type:e,data:t,dims:r??[t.length]})}),Nt,br,ji,fc,Ry=F(()=>{Nt=new Map([["float32",Float32Array],["uint8",Uint8Array],["int8",Int8Array],["uint16",Uint16Array],["int16",Int16Array],["int32",Int32Array],["bool",Uint8Array],["float64",Float64Array],["uint32",Uint32Array],["int4",Uint8Array],["uint4",Uint8Array]]),br=new Map([[Float32Array,"float32"],[Uint8Array,"uint8"],[Int8Array,"int8"],[Uint16Array,"uint16"],[Int16Array,"int16"],[Int32Array,"int32"],[Float64Array,"float64"],[Uint32Array,"uint32"]]),ji=!1,fc=()=>{if(!ji){ji=!0;let e=typeof BigInt64Array<"u"&&BigInt64Array.from,t=typeof BigUint64Array<"u"&&BigUint64Array.from,r=globalThis.Float16Array,i=typeof r<"u"&&r.from;e&&(Nt.set("int64",BigInt64Array),br.set(BigInt64Array,"int64")),t&&(Nt.set("uint64",BigUint64Array),br.set(BigUint64Array,"uint64")),i?(Nt.set("float16",r),br.set(r,"float16")):Nt.set("float16",Uint16Array)}}}),mc,gc,Ny=F(()=>{va(),mc=e=>{let t=1;for(let r=0;r<e.length;r++){let i=e[r];if(typeof i!="number"||!Number.isSafeInteger(i))throw new TypeError(`dims[${r}] must be an integer, got: ${i}`);if(i<0)throw new RangeError(`dims[${r}] must be a non-negative integer, got: ${i}`);t*=i}return t},gc=(e,t)=>{switch(e.location){case"cpu":return new We(e.type,e.data,t);case"cpu-pinned":return new We({location:"cpu-pinned",data:e.data,type:e.type,dims:t});case"texture":return new We({location:"texture",texture:e.texture,type:e.type,dims:t});case"gpu-buffer":return new We({location:"gpu-buffer",gpuBuffer:e.gpuBuffer,type:e.type,dims:t});case"ml-tensor":return new We({location:"ml-tensor",mlTensor:e.mlTensor,type:e.type,dims:t});default:throw new Error(`tensorReshape: tensor location ${e.location} is not supported`)}}}),We,va=F(()=>{My(),Oy(),Ry(),Ny(),We=class{constructor(e,t,r){fc();let i,n;if(typeof e=="object"&&"location"in e)switch(this.dataLocation=e.location,i=e.type,n=e.dims,e.location){case"cpu-pinned":{let s=Nt.get(i);if(!s)throw new TypeError(`unsupported type "${i}" to create tensor from pinned buffer`);if(!(e.data instanceof s))throw new TypeError(`buffer should be of type ${s.name}`);this.cpuData=e.data;break}case"texture":{if(i!=="float32")throw new TypeError(`unsupported type "${i}" to create tensor from texture`);this.gpuTextureData=e.texture,this.downloader=e.download,this.disposer=e.dispose;break}case"gpu-buffer":{if(i!=="float32"&&i!=="float16"&&i!=="int32"&&i!=="int64"&&i!=="uint32"&&i!=="uint8"&&i!=="bool"&&i!=="uint4"&&i!=="int4")throw new TypeError(`unsupported type "${i}" to create tensor from gpu buffer`);this.gpuBufferData=e.gpuBuffer,this.downloader=e.download,this.disposer=e.dispose;break}case"ml-tensor":{if(i!=="float32"&&i!=="float16"&&i!=="int32"&&i!=="int64"&&i!=="uint32"&&i!=="uint64"&&i!=="int8"&&i!=="uint8"&&i!=="bool"&&i!=="uint4"&&i!=="int4")throw new TypeError(`unsupported type "${i}" to create tensor from MLTensor`);this.mlTensorData=e.mlTensor,this.downloader=e.download,this.disposer=e.dispose;break}default:throw new Error(`Tensor constructor: unsupported location '${this.dataLocation}'`)}else{let s,o;if(typeof e=="string")if(i=e,o=r,e==="string"){if(!Array.isArray(t))throw new TypeError("A string tensor's data must be a string array.");s=t}else{let l=Nt.get(e);if(l===void 0)throw new TypeError(`Unsupported tensor type: ${e}.`);if(Array.isArray(t)){if(e==="float16"&&l===Uint16Array||e==="uint4"||e==="int4")throw new TypeError(`Creating a ${e} tensor from number array is not supported. Please use ${l.name} as data.`);e==="uint64"||e==="int64"?s=l.from(t,BigInt):s=l.from(t)}else if(t instanceof l)s=t;else if(t instanceof Uint8ClampedArray)if(e==="uint8")s=Uint8Array.from(t);else throw new TypeError("A Uint8ClampedArray tensor's data must be type of uint8");else if(e==="float16"&&t instanceof Uint16Array&&l!==Uint16Array)s=new globalThis.Float16Array(t.buffer,t.byteOffset,t.length);else throw new TypeError(`A ${i} tensor's data must be type of ${l}`)}else if(o=t,Array.isArray(e)){if(e.length===0)throw new TypeError("Tensor type cannot be inferred from an empty array.");let l=typeof e[0];if(l==="string")i="string",s=e;else if(l==="boolean")i="bool",s=Uint8Array.from(e);else throw new TypeError(`Invalid element type of data array: ${l}.`)}else if(e instanceof Uint8ClampedArray)i="uint8",s=Uint8Array.from(e);else{let l=br.get(e.constructor);if(l===void 0)throw new TypeError(`Unsupported type for tensor data: ${e.constructor}.`);i=l,s=e}if(o===void 0)o=[s.length];else if(!Array.isArray(o))throw new TypeError("A tensor's dims must be a number array");n=o,this.cpuData=s,this.dataLocation="cpu"}let a=mc(n);if(this.cpuData&&a!==this.cpuData.length&&!((i==="uint4"||i==="int4")&&Math.ceil(a/2)===this.cpuData.length))throw new Error(`Tensor's size(${a}) does not match data length(${this.cpuData.length}).`);this.type=i,this.dims=n,this.size=a}static async fromImage(e,t){return lc(e,t)}static fromTexture(e,t){return dc(e,t)}static fromGpuBuffer(e,t){return pc(e,t)}static fromMLTensor(e,t){return cc(e,t)}static fromPinnedBuffer(e,t,r){return hc(e,t,r)}toDataURL(e){return oc(this,e)}toImageData(e){return uc(this,e)}get data(){if(this.ensureValid(),!this.cpuData)throw new Error("The data is not on CPU. Use `getData()` to download GPU data to CPU, or use `texture` or `gpuBuffer` property to access the GPU data directly.");return this.cpuData}get location(){return this.dataLocation}get texture(){if(this.ensureValid(),!this.gpuTextureData)throw new Error("The data is not stored as a WebGL texture.");return this.gpuTextureData}get gpuBuffer(){if(this.ensureValid(),!this.gpuBufferData)throw new Error("The data is not stored as a WebGPU buffer.");return this.gpuBufferData}get mlTensor(){if(this.ensureValid(),!this.mlTensorData)throw new Error("The data is not stored as a WebNN MLTensor.");return this.mlTensorData}async getData(e){switch(this.ensureValid(),this.dataLocation){case"cpu":case"cpu-pinned":return this.data;case"texture":case"gpu-buffer":case"ml-tensor":{if(!this.downloader)throw new Error("The current tensor is not created with a specified data downloader.");if(this.isDownloading)throw new Error("The current tensor is being downloaded.");try{this.isDownloading=!0;let t=await this.downloader();return this.downloader=void 0,this.dataLocation="cpu",this.cpuData=t,e&&this.disposer&&(this.disposer(),this.disposer=void 0),t}finally{this.isDownloading=!1}}default:throw new Error(`cannot get data from location: ${this.dataLocation}`)}}dispose(){if(this.isDownloading)throw new Error("The current tensor is being downloaded.");this.disposer&&(this.disposer(),this.disposer=void 0),this.cpuData=void 0,this.gpuTextureData=void 0,this.gpuBufferData=void 0,this.mlTensorData=void 0,this.downloader=void 0,this.isDownloading=void 0,this.dataLocation="none"}ensureValid(){if(this.dataLocation==="none")throw new Error("The tensor is disposed.")}reshape(e){if(this.ensureValid(),this.downloader||this.disposer)throw new Error("Cannot reshape a tensor that owns GPU resource.");return gc(this,e)}}}),rt,yc=F(()=>{va(),rt=We}),oi,Ki,pt,it,Ut,Lt,_c=F(()=>{sc(),oi=(e,t)=>{(typeof Oe.trace>"u"?!Oe.wasm.trace:!Oe.trace)||console.timeStamp(`${e}::ORT::${t}`)},Ki=(e,t)=>{let r=new Error().stack?.split(/\r\n|\r|\n/g)||[],i=!1;for(let n=0;n<r.length;n++){if(i&&!r[n].includes("TRACE_FUNC")){let a=`FUNC_${e}::${r[n].trim().split(" ")[1]}`;t&&(a+=`::${t}`),oi("CPU",a);return}r[n].includes("TRACE_FUNC")&&(i=!0)}},pt=e=>{(typeof Oe.trace>"u"?!Oe.wasm.trace:!Oe.trace)||Ki("BEGIN",e)},it=e=>{(typeof Oe.trace>"u"?!Oe.wasm.trace:!Oe.trace)||Ki("END",e)},Ut=e=>{(typeof Oe.trace>"u"?!Oe.wasm.trace:!Oe.trace)||console.time(`ORT::${e}`)},Lt=e=>{(typeof Oe.trace>"u"?!Oe.wasm.trace:!Oe.trace)||console.timeEnd(`ORT::${e}`)}}),bc,By=F(()=>{nc(),yc(),_c(),bc=class wc{constructor(t){this.handler=t}async run(t,r,i){pt(),Ut("InferenceSession.run");let n={},a={};if(typeof t!="object"||t===null||t instanceof rt||Array.isArray(t))throw new TypeError("'feeds' must be an object that use input names as keys and OnnxValue as corresponding values.");let s=!0;if(typeof r=="object"){if(r===null)throw new TypeError("Unexpected argument[1]: cannot be null.");if(r instanceof rt)throw new TypeError("'fetches' cannot be a Tensor");if(Array.isArray(r)){if(r.length===0)throw new TypeError("'fetches' cannot be an empty array.");s=!1;for(let d of r){if(typeof d!="string")throw new TypeError("'fetches' must be a string array or an object.");if(this.outputNames.indexOf(d)===-1)throw new RangeError(`'fetches' contains invalid output name: ${d}.`);n[d]=null}if(typeof i=="object"&&i!==null)a=i;else if(typeof i<"u")throw new TypeError("'options' must be an object.")}else{let d=!1,p=Object.getOwnPropertyNames(r);for(let h of this.outputNames)if(p.indexOf(h)!==-1){let f=r[h];(f===null||f instanceof rt)&&(d=!0,s=!1,n[h]=f)}if(d){if(typeof i=="object"&&i!==null)a=i;else if(typeof i<"u")throw new TypeError("'options' must be an object.")}else a=r}}else if(typeof r<"u")throw new TypeError("Unexpected argument[1]: must be 'fetches' or 'options'.");for(let d of this.inputNames)if(typeof t[d]>"u")throw new Error(`input '${d}' is missing in 'feeds'.`);if(s)for(let d of this.outputNames)n[d]=null;let o=await this.handler.run(t,n,a),l={};for(let d in o)if(Object.hasOwnProperty.call(o,d)){let p=o[d];p instanceof rt?l[d]=p:l[d]=new rt(p.type,p.data,p.dims)}return Lt("InferenceSession.run"),it(),l}async release(){return this.handler.dispose()}static async create(t,r,i,n){pt(),Ut("InferenceSession.create");let a,s={};if(typeof t=="string"){if(a=t,typeof r=="object"&&r!==null)s=r;else if(typeof r<"u")throw new TypeError("'options' must be an object.")}else if(t instanceof Uint8Array){if(a=t,typeof r=="object"&&r!==null)s=r;else if(typeof r<"u")throw new TypeError("'options' must be an object.")}else if(t instanceof ArrayBuffer||typeof SharedArrayBuffer<"u"&&t instanceof SharedArrayBuffer){let p=t,h=0,f=t.byteLength;if(typeof r=="object"&&r!==null)s=r;else if(typeof r=="number"){if(h=r,!Number.isSafeInteger(h))throw new RangeError("'byteOffset' must be an integer.");if(h<0||h>=p.byteLength)throw new RangeError(`'byteOffset' is out of range [0, ${p.byteLength}).`);if(f=t.byteLength-h,typeof i=="number"){if(f=i,!Number.isSafeInteger(f))throw new RangeError("'byteLength' must be an integer.");if(f<=0||h+f>p.byteLength)throw new RangeError(`'byteLength' is out of range (0, ${p.byteLength-h}].`);if(typeof n=="object"&&n!==null)s=n;else if(typeof n<"u")throw new TypeError("'options' must be an object.")}else if(typeof i<"u")throw new TypeError("'byteLength' must be a number.")}else if(typeof r<"u")throw new TypeError("'options' must be an object.");a=new Uint8Array(p,h,f)}else throw new TypeError("Unexpected argument[0]: must be 'path' or 'buffer'.");let[o,l]=await ic(s),d=await o.createInferenceSessionHandler(a,l);return Lt("InferenceSession.create"),it(),new wc(d)}startProfiling(){this.handler.startProfiling()}endProfiling(){this.handler.endProfiling()}get inputNames(){return this.handler.inputNames}get outputNames(){return this.handler.outputNames}get inputMetadata(){return this.handler.inputMetadata}get outputMetadata(){return this.handler.outputMetadata}}}),xa,Dy=F(()=>{By(),xa=bc}),Py=F(()=>{}),Uy=F(()=>{}),Ly=F(()=>{}),qy=F(()=>{}),Wy={};ir(Wy,{InferenceSession:()=>xa,TRACE:()=>oi,TRACE_EVENT_BEGIN:()=>Ut,TRACE_EVENT_END:()=>Lt,TRACE_FUNC_BEGIN:()=>pt,TRACE_FUNC_END:()=>it,Tensor:()=>rt,env:()=>be,registerBackend:()=>Yt});var Ke=F(()=>{Cy(),Ay(),Dy(),yc(),Py(),Uy(),_c(),Ly(),qy()}),Sa=F(()=>{}),$c={};ir($c,{default:()=>vc});var Xi,Zi,vc,Gy=F(()=>{Em(),Vt(),ka(),Xi="ort-wasm-proxy-worker",Zi=globalThis.self?.name===Xi,Zi&&(self.onmessage=e=>{let{type:t,in:r}=e.data;try{switch(t){case"init-wasm":Ta(r.wasm).then(()=>{Ga(r).then(()=>{postMessage({type:t})},i=>{postMessage({type:t,err:i})})},i=>{postMessage({type:t,err:i})});break;case"init-ep":{let{epName:i,env:n}=r;Va(n,i).then(()=>{postMessage({type:t})},a=>{postMessage({type:t,err:a})});break}case"copy-from":{let{buffer:i}=r,n=fi(i);postMessage({type:t,out:n});break}case"create":{let{model:i,options:n}=r;Fa(i,n).then(a=>{postMessage({type:t,out:a})},a=>{postMessage({type:t,err:a})});break}case"release":Ha(r),postMessage({type:t});break;case"run":{let{sessionId:i,inputIndices:n,inputs:a,outputIndices:s,options:o}=r;ja(i,n,a,s,new Array(s.length).fill(null),o).then(l=>{l.some(d=>d[3]!=="cpu")?postMessage({type:t,err:"Proxy does not support non-cpu tensor location."}):postMessage({type:t,out:l},Xa([...a,...l]))},l=>{postMessage({type:t,err:l})});break}case"end-profiling":Ka(r),postMessage({type:t});break;default:}}catch(i){postMessage({type:t,err:i})}}),vc=Zi?null:e=>new Worker(e??Le,{type:"module",name:Xi})}),xc={};ir(xc,{default:()=>Sc});async function Xo(e={}){var t=e,r=!!globalThis.window,i=!!globalThis.WorkerGlobalScope,n=i&&self.name?.startsWith("em-pthread");t.mountExternalData=(u,c)=>{u.startsWith("./")&&(u=u.substring(2)),(t.Xc||(t.Xc=new Map)).set(u,c)},t.unmountExternalData=()=>{delete t.Xc},globalThis.SharedArrayBuffer??new WebAssembly.Memory({initial:0,maximum:0,shared:!0}).buffer.constructor;let a=u=>async(...c)=>{try{if(t.Yc)throw Error("Session already started");let _=t.Yc={Kd:c[0],errors:[]},y=await u(...c);if(t.Yc!==_)throw Error("Session mismatch");t.dd?.flush();let T=_.errors;if(0<T.length){let E=await Promise.all(T);if(E=E.filter(A=>A),0<E.length)throw Error(E.join(`
`))}return y}finally{t.Yc=null}};t.jsepInit=(u,c)=>{if(u==="webgpu"){[t.dd,t.Ad,t.Ed,t.ed,t.Dd,t.$b,t.Fd,t.Hd,t.Bd,t.Cd,t.Gd]=c;let _=t.dd;t.jsepRegisterBuffer=(y,T,E,A)=>_.registerBuffer(y,T,E,A),t.jsepGetBuffer=y=>_.getBuffer(y),t.jsepCreateDownloader=(y,T,E)=>_.createDownloader(y,T,E),t.jsepOnCreateSession=y=>{_.onCreateSession(y)},t.jsepOnReleaseSession=y=>{_.onReleaseSession(y)},t.jsepOnRunStart=y=>_.onRunStart(y),t.Id=(y,T)=>{_.upload(y,T)}}else if(u==="webnn"){let _=c[0];[t.Sd,t.sd,t.webnnEnsureTensor,t.td,t.webnnDownloadTensor,t.Rd,t.webnnEnableTraceEvent]=c.slice(1),t.webnnReleaseTensorId=t.sd,t.webnnUploadTensor=t.td,t.webnnRegisterMLContext=t.Rd,t.webnnOnRunStart=y=>_.onRunStart(y),t.webnnOnRunEnd=_.onRunEnd.bind(_),t.webnnOnReleaseSession=y=>{_.onReleaseSession(y)},t.webnnCreateMLTensorDownloader=(y,T)=>_.createMLTensorDownloader(y,T),t.webnnRegisterMLTensor=(y,T,E,A)=>_.registerMLTensor(y,T,E,A),t.webnnCreateMLContext=y=>_.createMLContext(y),t.webnnRegisterMLConstant=(y,T,E,A,P,K)=>_.registerMLConstant(y,T,E,A,P,t.Xc,K),t.webnnRegisterGraphInput=_.registerGraphInput.bind(_),t.webnnIsGraphInput=_.isGraphInput.bind(_),t.webnnRegisterGraphOutput=_.registerGraphOutput.bind(_),t.webnnIsGraphOutput=_.isGraphOutput.bind(_),t.webnnCreateTemporaryTensor=_.createTemporaryTensor.bind(_),t.webnnIsGraphInputOutputTypeSupported=_.isGraphInputOutputTypeSupported.bind(_)}};let s=()=>{let u=c=>(..._)=>{let y=st;return _=c(..._),st!=y?new Promise((T,E)=>{Mi={resolve:T,reject:E}}):_};(()=>{for(let c of["_OrtAppendExecutionProvider","_OrtCreateSession","_OrtRun","_OrtRunWithBinding","_OrtBindInput"])t[c]=u(t[c])})(),a!==void 0&&(t._OrtRun=a(t._OrtRun),t._OrtRunWithBinding=a(t._OrtRunWithBinding)),s=void 0};t.asyncInit=()=>{s?.()};var o,l,d=(u,c)=>{throw c},p=import.meta.url,h="";if(r||i){try{h=new URL(".",p).href}catch{}i&&(l=u=>{var c=new XMLHttpRequest;return c.open("GET",u,!1),c.responseType="arraybuffer",c.send(null),new Uint8Array(c.response)}),o=async u=>{if(z(u))return new Promise((_,y)=>{var T=new XMLHttpRequest;T.open("GET",u,!0),T.responseType="arraybuffer",T.onload=()=>{T.status==200||T.status==0&&T.response?_(T.response):y(T.status)},T.onerror=y,T.send(null)});var c=await fetch(u,{credentials:"same-origin"});if(c.ok)return c.arrayBuffer();throw Error(c.status+" : "+c.url)}}var f,g,m,b,v,$,w=console.log.bind(console),S=console.error.bind(console),x=w,I=S,C=!1,z=u=>u.startsWith("file://");function k(){_t.buffer!=L.buffer&&J()}if(n){let u=function(c){try{var _=c.data,y=_.Sc;if(y==="load"){let T=[];self.onmessage=E=>T.push(E),$=()=>{postMessage({Sc:"loaded"});for(let E of T)u(E);self.onmessage=u};for(let E of _.xd)t[E]&&!t[E].proxy||(t[E]=(...A)=>{postMessage({Sc:"callHandler",wd:E,args:A})},E=="print"&&(x=t[E]),E=="printErr"&&(I=t[E]));_t=_.Od,J(),g=_.Pd,Ie(),Ur()}else if(y==="run"){(function(T){var E=(k(),B)[T+52>>>2>>>0];T=(k(),B)[T+56>>>2>>>0],Js(E,E-T),ue(E)})(_.Rc),Di(_.Rc,0,0,1,0,0),es(),Ci(_.Rc),D||(js(),D=!0);try{eg(_.Md,_.bd)}catch(T){if(T!="unwind")throw T}}else _.target!=="setimmediate"&&(y==="checkMailbox"?D&&Mr():y&&(I(`worker: received unknown command ${y}`),I(_)))}catch(T){throw Ks(),T}};var D=!1;self.onunhandledrejection=c=>{throw c.reason||c},self.onmessage=u}var L,j,O,G,M,B,V,Y,q,H,X,W=!1;function J(){var u=_t.buffer;t.HEAP8=L=new Int8Array(u),O=new Int16Array(u),t.HEAPU8=j=new Uint8Array(u),G=new Uint16Array(u),t.HEAP32=M=new Int32Array(u),t.HEAPU32=B=new Uint32Array(u),V=new Float32Array(u),Y=new Float64Array(u),q=new BigInt64Array(u),H=new BigUint64Array(u)}function Q(){W=!0,n?$():ht.sb()}function R(u){throw I(u="Aborted("+u+")"),C=!0,u=new WebAssembly.RuntimeError(u+". Build with -sASSERTIONS for more info."),v?.(u),u}function se(){return{a:{ma:x0,gb:v0,g:tg,J:rg,f:ig,o:ng,h:ag,ha:sg,b:og,T:ug,Ha:ss,n:lg,$:ds,Xa:ps,Da:cs,Fa:hs,Ya:fs,Va:ms,Oa:gs,Ua:ys,ka:_s,Ea:bs,Ba:ws,Wa:$s,Ca:vs,bb:dg,ea:pg,wa:cg,ua:fg,da:gg,O:yg,H:_g,va:bg,_:Tg,xa:Ig,Ra:Eg,za:zg,Ia:Ag,sa:Mg,fa:Og,Qa:Ci,_a:Rg,R:Pg,r:Gg,c:Ii,hb:Vg,y:Fg,M:Hg,D:jg,l:Kg,s:zs,ib:Xg,I:Zg,S:Yg,j:Qg,u:Jg,q:e0,k:t0,La:r0,Ma:i0,Na:n0,Ja:Rs,Ka:Ns,ta:Bs,db:s0,ab:u0,v:l0,aa:d0,ga:p0,$a:o0,W:c0,Za:h0,Aa:f0,F:a0,U:m0,la:Dr,ya:y0,fb:g0,eb:_0,Sa:Ls,Ta:qs,Ga:vi,V:Ws,ja:Gs,Pa:Vs,ia:Fs,kb:ay,na:ey,lb:ny,oa:J0,G:V0,e:I0,t:k0,w:S0,B:D0,mb:Z0,K:q0,x:z0,pa:Y0,Y:ty,ba:X0,nb:K0,ob:j0,P:P0,qa:H0,pb:F0,N:W0,Z:Q0,d:T0,A:C0,m:E0,jb:sy,p:M0,z:O0,C:A0,E:R0,L:U0,qb:G0,Q:ry,ca:L0,X:iy,rb:B0,ra:N0,i:w0,a:_t,cb:$i}}}async function Ie(){function u(y,T){var E=ht=y.exports;y={};for(let[A,P]of Object.entries(E))typeof P=="function"?(E=Ng(P),y[A]=E):y[A]=P;return ht=y,ht=(function(){var A=ht,P=Z=>oe=>Z(oe)>>>0,K=Z=>()=>Z()>>>0;return(A=Object.assign({},A)).tb=P(A.tb),A.Xb=K(A.Xb),A.Zb=P(A.Zb),A.lc=P(A.lc),A.mc=K(A.mc),A.qc=P(A.qc),A})(),Qa.push(ht._b),Hs=(y=ht).tb,js=y.ub,t._OrtInit=y.vb,t._OrtGetLastError=y.wb,t._OrtCreateSessionOptions=y.xb,t._OrtAppendExecutionProvider=y.yb,t._OrtAddFreeDimensionOverride=y.zb,t._OrtAddSessionConfigEntry=y.Ab,t._OrtReleaseSessionOptions=y.Bb,t._OrtCreateSession=y.Cb,t._OrtReleaseSession=y.Db,t._OrtGetInputOutputCount=y.Eb,t._OrtGetInputOutputMetadata=y.Fb,t._OrtFree=y.Gb,t._OrtCreateTensor=y.Hb,t._OrtGetTensorData=y.Ib,t._OrtReleaseTensor=y.Jb,t._OrtCreateRunOptions=y.Kb,t._OrtAddRunConfigEntry=y.Lb,t._OrtReleaseRunOptions=y.Mb,t._OrtCreateBinding=y.Nb,t._OrtBindInput=y.Ob,t._OrtBindOutput=y.Pb,t._OrtClearBoundOutputs=y.Qb,t._OrtReleaseBinding=y.Rb,t._OrtRunWithBinding=y.Sb,t._OrtRun=y.Tb,t._OrtEndProfiling=y.Ub,t._JsepOutput=y.Vb,t._JsepGetNodeName=y.Wb,Pr=y.Xb,ot=t._free=y.Yb,sr=t._malloc=y.Zb,Di=y.ac,Ks=y.bc,Xs=y.cc,Zs=y.dc,Pi=y.ec,Ys=y.fc,Qs=y.gc,de=y.hc,or=y.ic,Js=y.jc,ue=y.kc,Ui=y.lc,le=y.mc,eo=y.nc,Li=y.oc,to=y.pc,ro=y.qc,io=y.rc,qi=y.sc,no=y.tc,ao=y.uc,so=y.vc,oo=y.wc,uo=y.xc,lo=y.yc,po=y.zc,co=y.Ac,ho=y.Bc,fo=y.Cc,mo=y.Dc,go=y.Ec,yo=y.Fc,_o=y.Gc,bo=y.Hc,wo=y.Ic,$o=y.Jc,vo=y.Kc,xo=y.Lc,So=y.Mc,ko=y.Nc,To=y.Pc,Io=y.Qc,Eo=y.$c,Co=y.ad,zo=y.fd,Ao=y.jd,Mo=y.kd,Oo=y.ld,Ro=y.md,No=y.nd,Bo=y.od,Do=y.pd,Po=y.qd,Uo=y.vd,Lo=y.Td,qo=y.Ud,Wo=y.Vd,Go=y.Wd,g=T,ht}var c,_=se();return t.instantiateWasm?new Promise(y=>{t.instantiateWasm(_,(T,E)=>{y(u(T,E))})}):n?u(new WebAssembly.Instance(g,se()),g):(X??=t.locateFile?t.locateFile?t.locateFile("ort-wasm-simd-threaded.jsep.wasm",h):h+"ort-wasm-simd-threaded.jsep.wasm":new URL("/SACHIZU-LAB1/assets/ort-wasm-simd-threaded.jsep-DC5y_g6C.wasm",import.meta.url).href,c=await(async function(y){var T=X;if(!f&&!z(T))try{var E=fetch(T,{credentials:"same-origin"});return await WebAssembly.instantiateStreaming(E,y)}catch(A){I(`wasm streaming compile failed: ${A}`),I("falling back to ArrayBuffer instantiation")}return(async function(A,P){try{var K=await(async function(Z){if(!f)try{var oe=await o(Z);return new Uint8Array(oe)}catch{}if(Z==X&&f)Z=new Uint8Array(f);else{if(!l)throw"both async and sync fetching of the wasm failed";Z=l(Z)}return Z})(A);return await WebAssembly.instantiate(K,P)}catch(Z){I(`failed to asynchronously prepare wasm: ${Z}`),R(Z)}})(T,y)})(_),u(c.instance,c.module))}class Se{name="ExitStatus";constructor(c){this.message=`Program terminated with exit(${c})`,this.status=c}}var Ne=u=>{u.terminate(),u.onmessage=()=>{}},ye=[],ve=0,De=null,Ir=u=>{yt.length==0&&(rs(),ts(yt[0]));var c=yt.pop();if(!c)return 6;nr.push(c),It[u.Rc]=c,c.Rc=u.Rc;var _={Sc:"run",Md:u.Ld,bd:u.bd,Rc:u.Rc};return c.postMessage(_,u.rd),0},nt=0,ke=(u,c,..._)=>{var y,T=16*_.length,E=le(),A=Ui(T),P=A>>>3;for(y of _)typeof y=="bigint"?((k(),q)[P++>>>0]=1n,(k(),q)[P++>>>0]=y):((k(),q)[P++>>>0]=0n,(k(),Y)[P++>>>0]=y);return u=Xs(u,0,T,A,c),ue(E),u};function $i(u){if(n)return ke(0,1,u);if(m=u,!(0<nt)){for(var c of nr)Ne(c);for(c of yt)Ne(c);yt=[],nr=[],It={},C=!0}d(0,new Se(u))}function Ya(u){if(n)return ke(1,0,u);vi(u)}var vi=u=>{if(m=u,n)throw Ya(u),"unwind";$i(u)},yt=[],nr=[],Qa=[],It={},Ja=u=>{var c=u.Rc;delete It[c],yt.push(u),nr.splice(nr.indexOf(u),1),u.Rc=0,Zs(c)};function es(){Qa.forEach(u=>u())}var ts=u=>new Promise(c=>{u.onmessage=T=>{var E=T.data;if(T=E.Sc,E.Zc&&E.Zc!=Pr()){var A=It[E.Zc];A?A.postMessage(E,E.rd):I(`Internal error! Worker sent a message "${T}" to target pthread ${E.Zc}, but that thread no longer exists!`)}else T==="checkMailbox"?Mr():T==="spawnThread"?Ir(E):T==="cleanupThread"?Ar(()=>{Ja(It[E.Nd])}):T==="loaded"?(u.loaded=!0,c(u)):E.target==="setimmediate"?u.postMessage(E):T==="uncaughtException"?u.onerror(E.error):T==="callHandler"?t[E.wd](...E.args):T&&I(`worker sent an unknown command ${T}`)},u.onerror=T=>{throw I(`worker sent an error! ${T.filename}:${T.lineno}: ${T.message}`),T};var _,y=[];for(_ of[])t.propertyIsEnumerable(_)&&y.push(_);u.postMessage({Sc:"load",xd:y,Od:_t,Pd:g})});function rs(){var u=new Worker((()=>{let c=URL;return import.meta.url>"file:"&&import.meta.url<"file;"?new c("ort.bundle.min.mjs",import.meta.url):new URL(import.meta.url)})(),{type:"module",workerData:"em-pthread",name:"em-pthread"});yt.push(u)}var _t,eg=(u,c)=>{nt=0,u=qi(u,c),0<nt?m=u:Pi(u)},Er=[],Cr=0;function tg(u){var c=new xi(u>>>=0);return(k(),L)[c.Tc+12>>>0]==0&&(is(c,!0),Cr--),ns(c,!1),Er.push(c),ro(u)}var Ht=0,rg=()=>{de(0,0);var u=Er.pop();eo(u.cd),Ht=0};function is(u,c){c=c?1:0,(k(),L)[u.Tc+12>>>0]=c}function ns(u,c){c=c?1:0,(k(),L)[u.Tc+13>>>0]=c}class xi{constructor(c){this.cd=c,this.Tc=c-24}}var Si=u=>{var c=Ht;if(!c)return or(0),0;var _=new xi(c);(k(),B)[_.Tc+16>>>2>>>0]=c;var y=(k(),B)[_.Tc+4>>>2>>>0];if(!y)return or(0),c;for(var T of u){if(T===0||T===y)break;if(to(T,y,_.Tc+16))return or(T),c}return or(y),c};function ig(){return Si([])}function ng(u){return Si([u>>>0])}function ag(u,c,_,y){return Si([u>>>0,c>>>0,_>>>0,y>>>0])}var sg=()=>{var u=Er.pop();u||R("no exception to throw");var c=u.cd;throw(k(),L)[u.Tc+13>>>0]==0&&(Er.push(u),ns(u,!0),is(u,!1),Cr++),Li(c),Ht=c};function og(u,c,_){var y=new xi(u>>>=0);throw c>>>=0,_>>>=0,(k(),B)[y.Tc+16>>>2>>>0]=0,(k(),B)[y.Tc+4>>>2>>>0]=c,(k(),B)[y.Tc+8>>>2>>>0]=_,Li(u),Cr++,Ht=u}var ug=()=>Cr;function as(u,c,_,y){return n?ke(2,1,u,c,_,y):ss(u,c,_,y)}function ss(u,c,_,y){if(u>>>=0,c>>>=0,_>>>=0,y>>>=0,!globalThis.SharedArrayBuffer)return 6;var T=[];return n&&T.length===0?as(u,c,_,y):(u={Ld:_,Rc:u,bd:y,rd:T},n?(u.Sc="spawnThread",postMessage(u,T),0):Ir(u))}function lg(u){throw Ht||=u>>>0,Ht}var os=globalThis.TextDecoder&&new TextDecoder,us=(u,c,_,y)=>{if(_=c+_,y)return _;for(;u[c]&&!(c>=_);)++c;return c},ls=(u,c=0,_,y)=>{if(16<(_=us(u,c>>>=0,_,y))-c&&u.buffer&&os)return os.decode(u.buffer instanceof ArrayBuffer?u.subarray(c,_):u.slice(c,_));for(y="";c<_;){var T=u[c++];if(128&T){var E=63&u[c++];if((224&T)==192)y+=String.fromCharCode((31&T)<<6|E);else{var A=63&u[c++];65536>(T=(240&T)==224?(15&T)<<12|E<<6|A:(7&T)<<18|E<<12|A<<6|63&u[c++])?y+=String.fromCharCode(T):(T-=65536,y+=String.fromCharCode(55296|T>>10,56320|1023&T))}}else y+=String.fromCharCode(T)}return y},Ae=(u,c,_)=>(u>>>=0)?ls((k(),j),u,c,_):"";function ds(u,c,_){return n?ke(3,1,u,c,_):0}function ps(u,c){if(n)return ke(4,1,u,c)}function cs(u,c){if(n)return ke(5,1,u,c)}function hs(u,c,_){if(n)return ke(6,1,u,c,_)}function fs(u,c,_){return n?ke(7,1,u,c,_):0}function ms(u,c){if(n)return ke(8,1,u,c)}function gs(u,c,_){if(n)return ke(9,1,u,c,_)}function ys(u,c,_,y){if(n)return ke(10,1,u,c,_,y)}function _s(u,c,_,y){if(n)return ke(11,1,u,c,_,y)}function bs(u,c,_,y){if(n)return ke(12,1,u,c,_,y)}function ws(u){if(n)return ke(13,1,u)}function $s(u,c){if(n)return ke(14,1,u,c)}function vs(u,c,_){if(n)return ke(15,1,u,c,_)}var dg=()=>R(""),at=u=>{u>>>=0;for(var c="";;){var _=(k(),j)[u++>>>0];if(!_)return c;c+=String.fromCharCode(_)}},ki={},Ti={},jt=class extends Error{constructor(u){super(u),this.name="BindingError"}};function ct(u,c,_={}){return(function(y,T,E={}){var A=T.name;if(!y)throw new jt(`type "${A}" must have a positive integer typeid pointer`);if(Ti.hasOwnProperty(y)){if(E.yd)return;throw new jt(`Cannot register type '${A}' twice`)}Ti[y]=T,ki.hasOwnProperty(y)&&(T=ki[y],delete ki[y],T.forEach(P=>P()))})(u,c,_)}var xs=(u,c,_)=>{switch(c){case 1:return _?y=>(k(),L)[y>>>0]:y=>(k(),j)[y>>>0];case 2:return _?y=>(k(),O)[y>>>1>>>0]:y=>(k(),G)[y>>>1>>>0];case 4:return _?y=>(k(),M)[y>>>2>>>0]:y=>(k(),B)[y>>>2>>>0];case 8:return _?y=>(k(),q)[y>>>3>>>0]:y=>(k(),H)[y>>>3>>>0];default:throw new TypeError(`invalid integer width (${c}): ${u}`)}};function pg(u,c,_,y,T){u>>>=0,_>>>=0,c=at(c>>>0);let E=A=>A;if(y=y===0n){let A=8*_;E=P=>BigInt.asUintN(A,P),T=E(T)}ct(u,{name:c,Oc:E,Vc:(A,P)=>(typeof P=="number"&&(P=BigInt(P)),P),Uc:xs(c,_,!y),Wc:null})}function cg(u,c,_,y){ct(u>>>=0,{name:c=at(c>>>0),Oc:function(T){return!!T},Vc:function(T,E){return E?_:y},Uc:function(T){return this.Oc((k(),j)[T>>>0])},Wc:null})}var Ss=[],Et=[0,1,,1,null,1,!0,1,!1,1];function Ii(u){9<(u>>>=0)&&--Et[u+1]===0&&(Et[u]=void 0,Ss.push(u))}var Ve=u=>{if(!u)throw new jt(`Cannot use deleted val. handle = ${u}`);return Et[u]},Xe=u=>{switch(u){case void 0:return 2;case null:return 4;case!0:return 6;case!1:return 8;default:let c=Ss.pop()||Et.length;return Et[c]=u,Et[c+1]=1,c}};function Ei(u){return this.Oc((k(),B)[u>>>2>>>0])}var hg={name:"emscripten::val",Oc:u=>{var c=Ve(u);return Ii(u),c},Vc:(u,c)=>Xe(c),Uc:Ei,Wc:null};function fg(u){return ct(u>>>0,hg)}var mg=(u,c)=>{switch(c){case 4:return function(_){return this.Oc((k(),V)[_>>>2>>>0])};case 8:return function(_){return this.Oc((k(),Y)[_>>>3>>>0])};default:throw new TypeError(`invalid float width (${c}): ${u}`)}};function gg(u,c,_){_>>>=0,ct(u>>>=0,{name:c=at(c>>>0),Oc:y=>y,Vc:(y,T)=>T,Uc:mg(c,_),Wc:null})}function yg(u,c,_,y,T){u>>>=0,_>>>=0,c=at(c>>>0);let E=P=>P;if(y===0){var A=32-8*_;E=P=>P<<A>>>A,T=E(T)}ct(u,{name:c,Oc:E,Vc:(P,K)=>K,Uc:xs(c,_,y!==0),Wc:null})}function _g(u,c,_){function y(E){var A=(k(),B)[E>>>2>>>0];return E=(k(),B)[E+4>>>2>>>0],new T((k(),L).buffer,E,A)}var T=[Int8Array,Uint8Array,Int16Array,Uint16Array,Int32Array,Uint32Array,Float32Array,Float64Array,BigInt64Array,BigUint64Array][c];ct(u>>>=0,{name:_=at(_>>>0),Oc:y,Uc:y},{yd:!0})}var bt=(u,c,_)=>{var y=(k(),j);if(c>>>=0,0<_){var T=c;_=c+_-1;for(var E=0;E<u.length;++E){var A=u.codePointAt(E);if(127>=A){if(c>=_)break;y[c++>>>0]=A}else if(2047>=A){if(c+1>=_)break;y[c++>>>0]=192|A>>6,y[c++>>>0]=128|63&A}else if(65535>=A){if(c+2>=_)break;y[c++>>>0]=224|A>>12,y[c++>>>0]=128|A>>6&63,y[c++>>>0]=128|63&A}else{if(c+3>=_)break;y[c++>>>0]=240|A>>18,y[c++>>>0]=128|A>>12&63,y[c++>>>0]=128|A>>6&63,y[c++>>>0]=128|63&A,E++}}y[c>>>0]=0,u=c-T}else u=0;return u},zr=u=>{for(var c=0,_=0;_<u.length;++_){var y=u.charCodeAt(_);127>=y?c++:2047>=y?c+=2:55296<=y&&57343>=y?(c+=4,++_):c+=3}return c};function bg(u,c){ct(u>>>=0,{name:c=at(c>>>0),Oc(_){var y=(k(),B)[_>>>2>>>0];return y=Ae(_+4,y,!0),ot(_),y},Vc(_,y){y instanceof ArrayBuffer&&(y=new Uint8Array(y));var T=typeof y=="string";if(!(T||ArrayBuffer.isView(y)&&y.BYTES_PER_ELEMENT==1))throw new jt("Cannot pass non-string to std::string");var E=T?zr(y):y.length,A=sr(4+E+1),P=A+4;return(k(),B)[A>>>2>>>0]=E,T?bt(y,P,E+1):(k(),j).set(y,P>>>0),_!==null&&_.push(ot,A),A},Uc:Ei,Wc(_){ot(_)}})}var ks=globalThis.TextDecoder?new TextDecoder("utf-16le"):void 0,wg=(u,c,_)=>{if(u>>>=1,16<(c=us((k(),G),u,c/2,_))-u&&ks)return ks.decode((k(),G).slice(u,c));for(_="";u<c;++u){var y=(k(),G)[u>>>0];_+=String.fromCharCode(y)}return _},$g=(u,c,_)=>{if(_??=2147483647,2>_)return 0;var y=c;_=(_-=2)<2*u.length?_/2:u.length;for(var T=0;T<_;++T){var E=u.charCodeAt(T);(k(),O)[c>>>1>>>0]=E,c+=2}return(k(),O)[c>>>1>>>0]=0,c-y},vg=u=>2*u.length,xg=(u,c,_)=>{var y="";u>>>=2;for(var T=0;!(T>=c/4);T++){var E=(k(),B)[u+T>>>0];if(!E&&!_)break;y+=String.fromCodePoint(E)}return y},Sg=(u,c,_)=>{if(c>>>=0,_??=2147483647,4>_)return 0;var y=c;_=y+_-4;for(var T=0;T<u.length;++T){var E=u.codePointAt(T);if(65535<E&&T++,(k(),M)[c>>>2>>>0]=E,(c+=4)+4>_)break}return(k(),M)[c>>>2>>>0]=0,c-y},kg=u=>{for(var c=0,_=0;_<u.length;++_)65535<u.codePointAt(_)&&_++,c+=4;return c};function Tg(u,c,_){if(u>>>=0,c>>>=0,_=at(_>>>=0),c===2)var y=wg,T=$g,E=vg;else y=xg,T=Sg,E=kg;ct(u,{name:_,Oc:A=>{var P=(k(),B)[A>>>2>>>0];return P=y(A+4,P*c,!0),ot(A),P},Vc:(A,P)=>{if(typeof P!="string")throw new jt(`Cannot pass non-string to C++ string type ${_}`);var K=E(P),Z=sr(4+K+c);return(k(),B)[Z>>>2>>>0]=K/c,T(P,Z+4,K+c),A!==null&&A.push(ot,Z),Z},Uc:Ei,Wc(A){ot(A)}})}function Ig(u,c){ct(u>>>=0,{zd:!0,name:c=at(c>>>0),Oc:()=>{},Vc:()=>{}})}function Eg(u){Di(u>>>0,!i,1,!r,131072,!1),es()}var Ar=u=>{if(!C)try{if(u(),!(0<nt))try{n?Pr()&&Pi(m):vi(m)}catch(c){c instanceof Se||c=="unwind"||d(0,c)}}catch(c){c instanceof Se||c=="unwind"||d(0,c)}},Cg=!Atomics.waitAsync||globalThis.navigator?.userAgent&&91>Number((navigator.userAgent.match(/Chrom(e|ium)\/([0-9]+)\./)||[])[2]);function Ci(u){u>>>=0,Cg||(Atomics.waitAsync((k(),M),u>>>2,u).value.then(Mr),u+=128,Atomics.store((k(),M),u>>>2,1))}var Mr=()=>Ar(()=>{var u=Pr();u&&(Ci(u),Qs())});function zg(u,c){(u>>>=0)==c>>>0?setTimeout(Mr):n?postMessage({Zc:u,Sc:"checkMailbox"}):(u=It[u])&&u.postMessage({Sc:"checkMailbox"})}var zi=[];function Ag(u,c,_,y,T){for(c>>>=0,T>>>=0,zi.length=0,_=T>>>3,y=T+y>>>3;_<y;){var E;E=(k(),q)[_++>>>0]?(k(),q)[_++>>>0]:(k(),Y)[_++>>>0],zi.push(E)}return(c?Wi[c]:$0[u])(...zi)}var Mg=()=>{nt=0};function Og(u){u>>>=0,n?postMessage({Sc:"cleanupThread",Nd:u}):Ja(It[u])}function Rg(u){}var Or=u=>{try{u()}catch(c){R(c)}};function Ng(u){var c=(..._)=>{Rr.push(u);try{return u(..._)}finally{C||(Rr.pop(),st&&wt===1&&Rr.length===0&&(wt=0,nt+=1,Or(qo),typeof Fibers<"u"&&Fibers.Zd()))}};return Es.set(u,c),c}var wt=0,st=null,Ts=0,Rr=[],Ai=new Map,Is=new Map,Es=new Map,Bg=0,Mi=null,Dg=[],Cs=u=>(function(c){if(!C){if(wt===0){var _=!1,y=!1;c((T=0)=>{if(!C&&(Ts=T,_=!0,y)){wt=2,Or(()=>Wo(st)),typeof MainLoop<"u"&&MainLoop.ud&&MainLoop.resume(),T=!1;try{var E=(function(){var K=(k(),M)[st+8>>>2>>>0];return K=Is.get(K),K=Es.get(K),--nt,K()})()}catch(K){E=K,T=!0}var A=!1;if(!st){var P=Mi;P&&(Mi=null,(T?P.reject:P.resolve)(E),A=!0)}if(T&&!A)throw E}}),y=!0,_||(wt=1,st=(function(){var T=sr(65548),E=T+12;if((k(),B)[T>>>2>>>0]=E,(k(),B)[T+4>>>2>>>0]=E+65536,E=Rr[0],!Ai.has(E)){var A=Bg++;Ai.set(E,A),Is.set(A,E)}return E=Ai.get(E),(k(),M)[T+8>>>2>>>0]=E,T})(),typeof MainLoop<"u"&&MainLoop.ud&&MainLoop.pause(),Or(()=>Lo(st)))}else wt===2?(wt=0,Or(Go),ot(st),st=null,Dg.forEach(Ar)):R(`invalid state: ${wt}`);return Ts}})(c=>{u().then(c)});function Pg(u){return u>>>=0,Cs(async()=>{var c=await Ve(u);return Xe(c)})}var Oi=[],Ug=u=>{var c=Oi.length;return Oi.push(u),c},Lg=(u,c)=>{for(var _=Array(u),y=0;y<u;++y){var T=y,E=(k(),B)[c+4*y>>>2>>>0],A=Ti[E];if(A===void 0)throw u=`parameter ${y}`,E=Hs(E),c=at(E),ot(E),new jt(`${u} has unknown type ${c}`);_[T]=A}return _},qg=(u,c,_)=>{var y=[];return u=u(y,_),y.length&&((k(),B)[c>>>2>>>0]=Xe(y)),u},Wg={},Nr=u=>{var c=Wg[u];return c===void 0?at(u):c};function Gg(u,c,_){var[y,...T]=Lg(u,c>>>0);c=y.Vc.bind(y);var E=T.map(K=>K.Uc.bind(K));u--;var A={toValue:Ve};switch(u=E.map((K,Z)=>{var oe=`argFromPtr${Z}`;return A[oe]=K,`${oe}(args${Z?"+"+8*Z:""})`}),_){case 0:var P="toValue(handle)";break;case 2:P="new (toValue(handle))";break;case 3:P="";break;case 1:A.getStringOrSymbol=Nr,P="toValue(handle)[getStringOrSymbol(methodName)]"}return P+=`(${u})`,y.zd||(A.toReturnWire=c,A.emval_returnValue=qg,P=`return emval_returnValue(toReturnWire, destructorsRef, ${P})`),P=`return function (handle, methodName, destructorsRef, args) {
  ${P}
  }`,_=new Function(Object.keys(A),P)(...Object.values(A)),P=`methodCaller<(${T.map(K=>K.name)}) => ${y.name}>`,Ug(Object.defineProperty(_,"name",{value:P}))}function Vg(u,c){return c>>>=0,(u=Ve(u>>>0))==Ve(c)}function Fg(u){return(u>>>=0)?(u=Nr(u),Xe(globalThis[u])):Xe(globalThis)}function Hg(u){return u=Nr(u>>>0),Xe(t[u])}function jg(u,c){return c>>>=0,u=Ve(u>>>0),c=Ve(c),Xe(u[c])}function Kg(u){9<(u>>>=0)&&(Et[u+1]+=1)}function zs(u,c,_,y,T){return Oi[u>>>0](c>>>0,_>>>0,y>>>0,T>>>0)}function Xg(u,c,_,y,T){return zs(u>>>0,c>>>0,_>>>0,y>>>0,T>>>0)}function Zg(){return Xe([])}function Yg(u){u=Ve(u>>>0);for(var c=Array(u.length),_=0;_<u.length;_++)c[_]=u[_];return Xe(c)}function Qg(u){return Xe(Nr(u>>>0))}function Jg(){return Xe({})}function e0(u){for(var c=Ve(u>>>=0);c.length;){var _=c.pop();c.pop()(_)}Ii(u)}function t0(u,c,_){c>>>=0,_>>>=0,u=Ve(u>>>0),c=Ve(c),_=Ve(_),u[c]=_}function r0(u,c){u=-9007199254740992>u||9007199254740992<u?NaN:Number(u),c>>>=0,u=new Date(1e3*u),(k(),M)[c>>>2>>>0]=u.getUTCSeconds(),(k(),M)[c+4>>>2>>>0]=u.getUTCMinutes(),(k(),M)[c+8>>>2>>>0]=u.getUTCHours(),(k(),M)[c+12>>>2>>>0]=u.getUTCDate(),(k(),M)[c+16>>>2>>>0]=u.getUTCMonth(),(k(),M)[c+20>>>2>>>0]=u.getUTCFullYear()-1900,(k(),M)[c+24>>>2>>>0]=u.getUTCDay(),u=(u.getTime()-Date.UTC(u.getUTCFullYear(),0,1,0,0,0,0))/864e5|0,(k(),M)[c+28>>>2>>>0]=u}var As=u=>u%4==0&&(u%100!=0||u%400==0),Ms=[0,31,60,91,121,152,182,213,244,274,305,335],Os=[0,31,59,90,120,151,181,212,243,273,304,334];function i0(u,c){u=-9007199254740992>u||9007199254740992<u?NaN:Number(u),c>>>=0,u=new Date(1e3*u),(k(),M)[c>>>2>>>0]=u.getSeconds(),(k(),M)[c+4>>>2>>>0]=u.getMinutes(),(k(),M)[c+8>>>2>>>0]=u.getHours(),(k(),M)[c+12>>>2>>>0]=u.getDate(),(k(),M)[c+16>>>2>>>0]=u.getMonth(),(k(),M)[c+20>>>2>>>0]=u.getFullYear()-1900,(k(),M)[c+24>>>2>>>0]=u.getDay();var _=(As(u.getFullYear())?Ms:Os)[u.getMonth()]+u.getDate()-1|0;(k(),M)[c+28>>>2>>>0]=_,(k(),M)[c+36>>>2>>>0]=-60*u.getTimezoneOffset(),_=new Date(u.getFullYear(),6,1).getTimezoneOffset();var y=new Date(u.getFullYear(),0,1).getTimezoneOffset();u=0|(_!=y&&u.getTimezoneOffset()==Math.min(y,_)),(k(),M)[c+32>>>2>>>0]=u}function n0(u){u>>>=0;var c=new Date((k(),M)[u+20>>>2>>>0]+1900,(k(),M)[u+16>>>2>>>0],(k(),M)[u+12>>>2>>>0],(k(),M)[u+8>>>2>>>0],(k(),M)[u+4>>>2>>>0],(k(),M)[u>>>2>>>0],0),_=(k(),M)[u+32>>>2>>>0],y=c.getTimezoneOffset(),T=new Date(c.getFullYear(),6,1).getTimezoneOffset(),E=new Date(c.getFullYear(),0,1).getTimezoneOffset(),A=Math.min(E,T);return 0>_?(k(),M)[u+32>>>2>>>0]=+(T!=E&&A==y):0<_!=(A==y)&&(T=Math.max(E,T),c.setTime(c.getTime()+6e4*((0<_?A:T)-y))),(k(),M)[u+24>>>2>>>0]=c.getDay(),_=(As(c.getFullYear())?Ms:Os)[c.getMonth()]+c.getDate()-1|0,(k(),M)[u+28>>>2>>>0]=_,(k(),M)[u>>>2>>>0]=c.getSeconds(),(k(),M)[u+4>>>2>>>0]=c.getMinutes(),(k(),M)[u+8>>>2>>>0]=c.getHours(),(k(),M)[u+12>>>2>>>0]=c.getDate(),(k(),M)[u+16>>>2>>>0]=c.getMonth(),(k(),M)[u+20>>>2>>>0]=c.getYear(),u=c.getTime(),BigInt(isNaN(u)?-1:u/1e3)}function Rs(u,c,_,y,T,E,A){return n?ke(16,1,u,c,_,y,T,E,A):-52}function Ns(u,c,_,y,T,E){if(n)return ke(17,1,u,c,_,y,T,E)}var ar={},a0=()=>performance.timeOrigin+performance.now();function Bs(u,c){if(n)return ke(18,1,u,c);if(ar[u]&&(clearTimeout(ar[u].id),delete ar[u]),!c)return 0;var _=setTimeout(()=>{delete ar[u],Ar(()=>Ys(u,performance.timeOrigin+performance.now()))},c);return ar[u]={id:_,Yd:c},0}function s0(u,c,_,y){u>>>=0,c>>>=0,_>>>=0,y>>>=0;var T=new Date().getFullYear(),E=new Date(T,0,1).getTimezoneOffset();T=new Date(T,6,1).getTimezoneOffset();var A=Math.max(E,T);(k(),B)[u>>>2>>>0]=60*A,(k(),M)[c>>>2>>>0]=+(E!=T),u=(c=P=>{var K=Math.abs(P);return`UTC${0<=P?"-":"+"}${String(Math.floor(K/60)).padStart(2,"0")}${String(K%60).padStart(2,"0")}`})(E),c=c(T),T<E?(bt(u,_,17),bt(c,y,17)):(bt(u,y,17),bt(c,_,17))}var o0=()=>Date.now();function u0(u,c,_){return _>>>=0,0<=u&&3>=u?(u===0?u=Date.now():u=performance.timeOrigin+performance.now(),u=Math.round(1e6*u),(k(),q)[_>>>3>>>0]=BigInt(u),0):28}var Ri=[],Ds=(u,c)=>{Ri.length=0;for(var _;_=(k(),j)[u++>>>0];){var y=_!=105;c+=(y&=_!=112)&&c%8?4:0,Ri.push(_==112?(k(),B)[c>>>2>>>0]:_==106?(k(),q)[c>>>3>>>0]:_==105?(k(),M)[c>>>2>>>0]:(k(),Y)[c>>>3>>>0]),c+=y?8:4}return Ri};function l0(u,c,_){return u>>>=0,c=Ds(c>>>0,_>>>0),Wi[u](...c)}function d0(u,c,_){return u>>>=0,c=Ds(c>>>0,_>>>0),Wi[u](...c)}var p0=()=>{};function c0(u,c){return I(Ae(u>>>0,c>>>0))}var h0=()=>{throw nt+=1,"unwind"};function f0(){return 4294901760}var m0=()=>navigator.hardwareConcurrency,Ct={},Br=u=>{var c;return(c=/\bwasm-function\[\d+\]:(0x[0-9a-f]+)/.exec(u))?+c[1]:(c=/:(\d+):\d+(?:\)|$)/.exec(u))?2147483648|+c[1]:0},Ps=u=>{for(var c of u)(u=Br(c))&&(Ct[u]=c)};function g0(){var u=Error().stack.toString().split(`
`);return u[0]=="Error"&&u.shift(),Ps(u),Ct.gd=Br(u[3]),Ct.Jd=u,Ct.gd}function Dr(u){if(!(u=Ct[u>>>0]))return 0;var c;if(c=/^\s+at .*\.wasm\.(.*) \(.*\)$/.exec(u))u=c[1];else if(c=/^\s+at (.*) \(.*\)$/.exec(u))u=c[1];else{if(!(c=/^(.+?)@/.exec(u)))return 0;u=c[1]}ot(Dr.hd??0),c=zr(u)+1;var _=sr(c);return _&&bt(u,_,c),Dr.hd=_,Dr.hd}function y0(u){u>>>=0;var c=(k(),j).length;if(u<=c||4294901760<u)return!1;for(var _=1;4>=_;_*=2){var y=c*(1+.2/_);y=Math.min(y,u+100663296);e:{y=(Math.min(4294901760,65536*Math.ceil(Math.max(u,y)/65536))-_t.buffer.byteLength+65535)/65536|0;try{_t.grow(y),J();var T=1;break e}catch{}T=void 0}if(T)return!0}return!1}function _0(u,c,_){if(u>>>=0,c>>>=0,Ct.gd==u)var y=Ct.Jd;else(y=Error().stack.toString().split(`
`))[0]=="Error"&&y.shift(),Ps(y);for(var T=3;y[T]&&Br(y[T])!=u;)++T;for(u=0;u<_&&y[u+T];++u)(k(),M)[c+4*u>>>2>>>0]=Br(y[u+T]);return u}var Ni,Bi={},Us=()=>{if(!Ni){var u,c={USER:"web_user",LOGNAME:"web_user",PATH:"/",PWD:"/",HOME:"/home/web_user",LANG:(globalThis.navigator?.language??"C").replace("-","_")+".UTF-8",_:"./this.program"};for(u in Bi)Bi[u]===void 0?delete c[u]:c[u]=Bi[u];var _=[];for(u in c)_.push(`${u}=${c[u]}`);Ni=_}return Ni};function Ls(u,c){if(n)return ke(19,1,u,c);u>>>=0,c>>>=0;var _,y=0,T=0;for(_ of Us()){var E=c+y;(k(),B)[u+T>>>2>>>0]=E,y+=bt(_,E,1/0)+1,T+=4}return 0}function qs(u,c){if(n)return ke(20,1,u,c);u>>>=0,c>>>=0;var _=Us();for(var y of((k(),B)[u>>>2>>>0]=_.length,u=0,_))u+=zr(y)+1;return(k(),B)[c>>>2>>>0]=u,0}function Ws(u){return n?ke(21,1,u):52}function Gs(u,c,_,y){return n?ke(22,1,u,c,_,y):52}function Vs(u,c,_,y){return n?ke(23,1,u,c,_,y):70}var b0=[null,[],[]];function Fs(u,c,_,y){if(n)return ke(24,1,u,c,_,y);c>>>=0,_>>>=0,y>>>=0;for(var T=0,E=0;E<_;E++){var A=(k(),B)[c>>>2>>>0],P=(k(),B)[c+4>>>2>>>0];c+=8;for(var K=0;K<P;K++){var Z=u,oe=(k(),j)[A+K>>>0],he=b0[Z];oe===0||oe===10?((Z===1?x:I)(ls(he)),he.length=0):he.push(oe)}T+=P}return(k(),B)[y>>>2>>>0]=T,0}function w0(u){return u>>>0}n||(function(){for(var u=t.numThreads-1;u--;)rs();ye.push(async()=>{var c=(async function(){if(!n)return Promise.all(yt.map(ts))})();ve++,await c,--ve==0&&De&&(c=De,De=null,c())})})(),n||(_t=new WebAssembly.Memory({initial:256,maximum:65536,shared:!0}),J()),t.wasmBinary&&(f=t.wasmBinary),t.stackSave=()=>le(),t.stackRestore=u=>ue(u),t.stackAlloc=u=>Ui(u),t.setValue=function(u,c,_="i8"){switch(_.endsWith("*")&&(_="*"),_){case"i1":case"i8":(k(),L)[u>>>0]=c;break;case"i16":(k(),O)[u>>>1>>>0]=c;break;case"i32":(k(),M)[u>>>2>>>0]=c;break;case"i64":(k(),q)[u>>>3>>>0]=BigInt(c);break;case"float":(k(),V)[u>>>2>>>0]=c;break;case"double":(k(),Y)[u>>>3>>>0]=c;break;case"*":(k(),B)[u>>>2>>>0]=c;break;default:R(`invalid type for setValue: ${_}`)}},t.getValue=function(u,c="i8"){switch(c.endsWith("*")&&(c="*"),c){case"i1":case"i8":return(k(),L)[u>>>0];case"i16":return(k(),O)[u>>>1>>>0];case"i32":return(k(),M)[u>>>2>>>0];case"i64":return(k(),q)[u>>>3>>>0];case"float":return(k(),V)[u>>>2>>>0];case"double":return(k(),Y)[u>>>3>>>0];case"*":return(k(),B)[u>>>2>>>0];default:R(`invalid type for getValue: ${c}`)}},t.UTF8ToString=Ae,t.stringToUTF8=bt,t.lengthBytesUTF8=zr;var Hs,js,Pr,ot,sr,Di,Ks,Xs,Zs,Pi,Ys,Qs,de,or,Js,ue,Ui,le,eo,Li,to,ro,io,qi,no,ao,so,oo,uo,lo,po,co,ho,fo,mo,go,yo,_o,bo,wo,$o,vo,xo,So,ko,To,Io,Eo,Co,zo,Ao,Mo,Oo,Ro,No,Bo,Do,Po,Uo,Lo,qo,Wo,Go,ht,$0=[$i,Ya,as,ds,ps,cs,hs,fs,ms,gs,ys,_s,bs,ws,$s,vs,Rs,Ns,Bs,Ls,qs,Ws,Gs,Vs,Fs],Wi={1003524:(u,c,_,y,T)=>{if(t===void 0||!t.Xc)return 1;if((u=Ae(Number(u>>>0))).startsWith("./")&&(u=u.substring(2)),!(u=t.Xc.get(u)))return 2;if(c=Number(c>>>0),_=Number(_>>>0),y=Number(y>>>0),c+_>u.byteLength)return 3;try{let E=u.subarray(c,c+_);switch(T){case 0:(k(),j).set(E,y>>>0);break;case 1:t.Qd?t.Qd(y,E):t.Id(y,E);break;default:return 4}return 0}catch{return 4}},1004348:(u,c,_)=>{t.td(u,(k(),j).subarray(c>>>0,c+_>>>0))},1004412:()=>t.Sd(),1004454:u=>{t.sd(u)},1004491:()=>{t.Bd()},1004522:()=>{t.Cd()},1004551:()=>{t.Gd()},1004576:u=>t.Ad(u),1004609:u=>t.Ed(u),1004641:(u,c,_)=>{t.ed(Number(u),Number(c),Number(_),!0)},1004704:(u,c,_)=>{t.ed(Number(u),Number(c),Number(_))},1004761:()=>typeof wasmOffsetConverter<"u",1004818:u=>{t.$b("Abs",u,void 0)},1004869:u=>{t.$b("Neg",u,void 0)},1004920:u=>{t.$b("Floor",u,void 0)},1004973:u=>{t.$b("Ceil",u,void 0)},1005025:u=>{t.$b("Reciprocal",u,void 0)},1005083:u=>{t.$b("Sqrt",u,void 0)},1005135:u=>{t.$b("Exp",u,void 0)},1005186:u=>{t.$b("Erf",u,void 0)},1005237:u=>{t.$b("Sigmoid",u,void 0)},1005292:(u,c,_)=>{t.$b("HardSigmoid",u,{alpha:c,beta:_})},1005371:u=>{t.$b("Log",u,void 0)},1005422:u=>{t.$b("Sin",u,void 0)},1005473:u=>{t.$b("Cos",u,void 0)},1005524:u=>{t.$b("Tan",u,void 0)},1005575:u=>{t.$b("Asin",u,void 0)},1005627:u=>{t.$b("Acos",u,void 0)},1005679:u=>{t.$b("Atan",u,void 0)},1005731:u=>{t.$b("Sinh",u,void 0)},1005783:u=>{t.$b("Cosh",u,void 0)},1005835:u=>{t.$b("Asinh",u,void 0)},1005888:u=>{t.$b("Acosh",u,void 0)},1005941:u=>{t.$b("Atanh",u,void 0)},1005994:u=>{t.$b("Tanh",u,void 0)},1006046:u=>{t.$b("Not",u,void 0)},1006097:(u,c,_)=>{t.$b("Clip",u,{min:c,max:_})},1006166:u=>{t.$b("Clip",u,void 0)},1006218:(u,c)=>{t.$b("Elu",u,{alpha:c})},1006276:u=>{t.$b("Gelu",u,void 0)},1006328:u=>{t.$b("Relu",u,void 0)},1006380:(u,c)=>{t.$b("LeakyRelu",u,{alpha:c})},1006444:(u,c)=>{t.$b("ThresholdedRelu",u,{alpha:c})},1006514:(u,c)=>{t.$b("Cast",u,{to:c})},1006572:u=>{t.$b("Add",u,void 0)},1006623:u=>{t.$b("Sub",u,void 0)},1006674:u=>{t.$b("Mul",u,void 0)},1006725:u=>{t.$b("Div",u,void 0)},1006776:u=>{t.$b("Pow",u,void 0)},1006827:u=>{t.$b("Equal",u,void 0)},1006880:u=>{t.$b("Greater",u,void 0)},1006935:u=>{t.$b("GreaterOrEqual",u,void 0)},1006997:u=>{t.$b("Less",u,void 0)},1007049:u=>{t.$b("LessOrEqual",u,void 0)},1007108:(u,c,_,y,T)=>{t.$b("ReduceMean",u,{keepDims:!!c,noopWithEmptyAxes:!!_,axes:y?Array.from((k(),M).subarray(Number(y)>>>0,Number(T)>>>0)):[]})},1007283:(u,c,_,y,T)=>{t.$b("ReduceMax",u,{keepDims:!!c,noopWithEmptyAxes:!!_,axes:y?Array.from((k(),M).subarray(Number(y)>>>0,Number(T)>>>0)):[]})},1007457:(u,c,_,y,T)=>{t.$b("ReduceMin",u,{keepDims:!!c,noopWithEmptyAxes:!!_,axes:y?Array.from((k(),M).subarray(Number(y)>>>0,Number(T)>>>0)):[]})},1007631:(u,c,_,y,T)=>{t.$b("ReduceProd",u,{keepDims:!!c,noopWithEmptyAxes:!!_,axes:y?Array.from((k(),M).subarray(Number(y)>>>0,Number(T)>>>0)):[]})},1007806:(u,c,_,y,T)=>{t.$b("ReduceSum",u,{keepDims:!!c,noopWithEmptyAxes:!!_,axes:y?Array.from((k(),M).subarray(Number(y)>>>0,Number(T)>>>0)):[]})},1007980:(u,c,_,y,T)=>{t.$b("ReduceL1",u,{keepDims:!!c,noopWithEmptyAxes:!!_,axes:y?Array.from((k(),M).subarray(Number(y)>>>0,Number(T)>>>0)):[]})},1008153:(u,c,_,y,T)=>{t.$b("ReduceL2",u,{keepDims:!!c,noopWithEmptyAxes:!!_,axes:y?Array.from((k(),M).subarray(Number(y)>>>0,Number(T)>>>0)):[]})},1008326:(u,c,_,y,T)=>{t.$b("ReduceLogSum",u,{keepDims:!!c,noopWithEmptyAxes:!!_,axes:y?Array.from((k(),M).subarray(Number(y)>>>0,Number(T)>>>0)):[]})},1008503:(u,c,_,y,T)=>{t.$b("ReduceSumSquare",u,{keepDims:!!c,noopWithEmptyAxes:!!_,axes:y?Array.from((k(),M).subarray(Number(y)>>>0,Number(T)>>>0)):[]})},1008683:(u,c,_,y,T)=>{t.$b("ReduceLogSumExp",u,{keepDims:!!c,noopWithEmptyAxes:!!_,axes:y?Array.from((k(),M).subarray(Number(y)>>>0,Number(T)>>>0)):[]})},1008863:u=>{t.$b("Where",u,void 0)},1008916:(u,c,_)=>{t.$b("Transpose",u,{perm:c?Array.from((k(),M).subarray(Number(c)>>>0,Number(_)>>>0)):[]})},1009040:(u,c,_,y)=>{t.$b("DepthToSpace",u,{blocksize:c,mode:Ae(_),format:y?"NHWC":"NCHW"})},1009173:(u,c,_,y)=>{t.$b("DepthToSpace",u,{blocksize:c,mode:Ae(_),format:y?"NHWC":"NCHW"})},1009306:(u,c,_,y,T,E,A,P,K,Z,oe,he,_e,$e,$t)=>{t.$b("ConvTranspose",u,{format:K?"NHWC":"NCHW",autoPad:c,dilations:[_],group:y,kernelShape:[T],pads:[E,A],strides:[P],wIsConst:()=>!!(k(),L)[Z>>>0],outputPadding:oe?Array.from((k(),M).subarray(Number(oe)>>>0,Number(he)>>>0)):[],outputShape:_e?Array.from((k(),M).subarray(Number(_e)>>>0,Number($e)>>>0)):[],activation:Ae($t)})},1009739:(u,c,_,y,T,E,A,P,K,Z,oe,he,_e,$e)=>{t.$b("ConvTranspose",u,{format:P?"NHWC":"NCHW",autoPad:c,dilations:Array.from((k(),M).subarray(Number(_)>>>0,(Number(_)>>>0)+2>>>0)),group:y,kernelShape:Array.from((k(),M).subarray(Number(T)>>>0,(Number(T)>>>0)+2>>>0)),pads:Array.from((k(),M).subarray(Number(E)>>>0,(Number(E)>>>0)+4>>>0)),strides:Array.from((k(),M).subarray(Number(A)>>>0,(Number(A)>>>0)+2>>>0)),wIsConst:()=>!!(k(),L)[K>>>0],outputPadding:Z?Array.from((k(),M).subarray(Number(Z)>>>0,Number(oe)>>>0)):[],outputShape:he?Array.from((k(),M).subarray(Number(he)>>>0,Number(_e)>>>0)):[],activation:Ae($e)})},1010400:(u,c,_,y,T,E,A,P,K,Z,oe,he,_e,$e,$t)=>{t.$b("ConvTranspose",u,{format:K?"NHWC":"NCHW",autoPad:c,dilations:[_],group:y,kernelShape:[T],pads:[E,A],strides:[P],wIsConst:()=>!!(k(),L)[Z>>>0],outputPadding:oe?Array.from((k(),M).subarray(Number(oe)>>>0,Number(he)>>>0)):[],outputShape:_e?Array.from((k(),M).subarray(Number(_e)>>>0,Number($e)>>>0)):[],activation:Ae($t)})},1010833:(u,c,_,y,T,E,A,P,K,Z,oe,he,_e,$e)=>{t.$b("ConvTranspose",u,{format:P?"NHWC":"NCHW",autoPad:c,dilations:Array.from((k(),M).subarray(Number(_)>>>0,(Number(_)>>>0)+2>>>0)),group:y,kernelShape:Array.from((k(),M).subarray(Number(T)>>>0,(Number(T)>>>0)+2>>>0)),pads:Array.from((k(),M).subarray(Number(E)>>>0,(Number(E)>>>0)+4>>>0)),strides:Array.from((k(),M).subarray(Number(A)>>>0,(Number(A)>>>0)+2>>>0)),wIsConst:()=>!!(k(),L)[K>>>0],outputPadding:Z?Array.from((k(),M).subarray(Number(Z)>>>0,Number(oe)>>>0)):[],outputShape:he?Array.from((k(),M).subarray(Number(he)>>>0,Number(_e)>>>0)):[],activation:Ae($e)})},1011494:(u,c)=>{t.$b("GlobalAveragePool",u,{format:c?"NHWC":"NCHW"})},1011585:(u,c,_,y,T,E,A,P,K,Z,oe,he,_e,$e)=>{t.$b("AveragePool",u,{format:$e?"NHWC":"NCHW",auto_pad:c,ceil_mode:_,count_include_pad:y,storage_order:T,dilations:E?Array.from((k(),M).subarray(Number(E)>>>0,Number(A)>>>0)):[],kernel_shape:P?Array.from((k(),M).subarray(Number(P)>>>0,Number(K)>>>0)):[],pads:Z?Array.from((k(),M).subarray(Number(Z)>>>0,Number(oe)>>>0)):[],strides:he?Array.from((k(),M).subarray(Number(he)>>>0,Number(_e)>>>0)):[]})},1012064:(u,c)=>{t.$b("GlobalAveragePool",u,{format:c?"NHWC":"NCHW"})},1012155:(u,c,_,y,T,E,A,P,K,Z,oe,he,_e,$e)=>{t.$b("AveragePool",u,{format:$e?"NHWC":"NCHW",auto_pad:c,ceil_mode:_,count_include_pad:y,storage_order:T,dilations:E?Array.from((k(),M).subarray(Number(E)>>>0,Number(A)>>>0)):[],kernel_shape:P?Array.from((k(),M).subarray(Number(P)>>>0,Number(K)>>>0)):[],pads:Z?Array.from((k(),M).subarray(Number(Z)>>>0,Number(oe)>>>0)):[],strides:he?Array.from((k(),M).subarray(Number(he)>>>0,Number(_e)>>>0)):[]})},1012634:(u,c)=>{t.$b("GlobalMaxPool",u,{format:c?"NHWC":"NCHW"})},1012721:(u,c,_,y,T,E,A,P,K,Z,oe,he,_e,$e)=>{t.$b("MaxPool",u,{format:$e?"NHWC":"NCHW",auto_pad:c,ceil_mode:_,count_include_pad:y,storage_order:T,dilations:E?Array.from((k(),M).subarray(Number(E)>>>0,Number(A)>>>0)):[],kernel_shape:P?Array.from((k(),M).subarray(Number(P)>>>0,Number(K)>>>0)):[],pads:Z?Array.from((k(),M).subarray(Number(Z)>>>0,Number(oe)>>>0)):[],strides:he?Array.from((k(),M).subarray(Number(he)>>>0,Number(_e)>>>0)):[]})},1013196:(u,c)=>{t.$b("GlobalMaxPool",u,{format:c?"NHWC":"NCHW"})},1013283:(u,c,_,y,T,E,A,P,K,Z,oe,he,_e,$e)=>{t.$b("MaxPool",u,{format:$e?"NHWC":"NCHW",auto_pad:c,ceil_mode:_,count_include_pad:y,storage_order:T,dilations:E?Array.from((k(),M).subarray(Number(E)>>>0,Number(A)>>>0)):[],kernel_shape:P?Array.from((k(),M).subarray(Number(P)>>>0,Number(K)>>>0)):[],pads:Z?Array.from((k(),M).subarray(Number(Z)>>>0,Number(oe)>>>0)):[],strides:he?Array.from((k(),M).subarray(Number(he)>>>0,Number(_e)>>>0)):[]})},1013758:(u,c,_,y,T)=>{t.$b("Gemm",u,{alpha:c,beta:_,transA:y,transB:T})},1013862:u=>{t.$b("MatMul",u,void 0)},1013916:(u,c,_,y)=>{t.$b("ArgMax",u,{keepDims:!!c,selectLastIndex:!!_,axis:y})},1014024:(u,c,_,y)=>{t.$b("ArgMin",u,{keepDims:!!c,selectLastIndex:!!_,axis:y})},1014132:(u,c)=>{t.$b("Softmax",u,{axis:c})},1014195:(u,c)=>{t.$b("Concat",u,{axis:c})},1014255:(u,c,_,y,T)=>{t.$b("Split",u,{axis:c,numOutputs:_,splitSizes:y?Array.from((k(),M).subarray(Number(y)>>>0,Number(T)>>>0)):[]})},1014411:u=>{t.$b("Expand",u,void 0)},1014465:(u,c)=>{t.$b("Gather",u,{axis:Number(c)})},1014536:(u,c)=>{t.$b("GatherElements",u,{axis:Number(c)})},1014615:(u,c)=>{t.$b("GatherND",u,{batch_dims:Number(c)})},1014694:(u,c,_,y,T,E,A,P,K,Z,oe)=>{t.$b("Resize",u,{antialias:c,axes:_?Array.from((k(),M).subarray(Number(_)>>>0,Number(y)>>>0)):[],coordinateTransformMode:Ae(T),cubicCoeffA:E,excludeOutside:A,extrapolationValue:P,keepAspectRatioPolicy:Ae(K),mode:Ae(Z),nearestMode:Ae(oe)})},1015056:(u,c,_,y,T,E,A)=>{t.$b("Slice",u,{starts:c?Array.from((k(),M).subarray(Number(c)>>>0,Number(_)>>>0)):[],ends:y?Array.from((k(),M).subarray(Number(y)>>>0,Number(T)>>>0)):[],axes:E?Array.from((k(),M).subarray(Number(E)>>>0,Number(A)>>>0)):[]})},1015320:u=>{t.$b("Tile",u,void 0)},1015372:(u,c,_)=>{t.$b("InstanceNormalization",u,{epsilon:c,format:_?"NHWC":"NCHW"})},1015486:(u,c,_)=>{t.$b("InstanceNormalization",u,{epsilon:c,format:_?"NHWC":"NCHW"})},1015600:u=>{t.$b("Range",u,void 0)},1015653:(u,c)=>{t.$b("Einsum",u,{equation:Ae(c)})},1015734:(u,c,_,y,T)=>{t.$b("Pad",u,{mode:c,value:_,pads:y?Array.from((k(),M).subarray(Number(y)>>>0,Number(T)>>>0)):[]})},1015877:(u,c,_,y,T,E)=>{t.$b("BatchNormalization",u,{epsilon:c,momentum:_,spatial:!!T,trainingMode:!!y,format:E?"NHWC":"NCHW"})},1016046:(u,c,_,y,T,E)=>{t.$b("BatchNormalization",u,{epsilon:c,momentum:_,spatial:!!T,trainingMode:!!y,format:E?"NHWC":"NCHW"})},1016215:(u,c,_)=>{t.$b("CumSum",u,{exclusive:Number(c),reverse:Number(_)})},1016312:(u,c,_)=>{t.$b("DequantizeLinear",u,{axis:c,blockSize:_})},1016402:(u,c,_,y,T)=>{t.$b("GridSample",u,{align_corners:c,mode:Ae(_),padding_mode:Ae(y),format:T?"NHWC":"NCHW"})},1016572:(u,c,_,y,T)=>{t.$b("GridSample",u,{align_corners:c,mode:Ae(_),padding_mode:Ae(y),format:T?"NHWC":"NCHW"})},1016742:(u,c)=>{t.$b("ScatterND",u,{reduction:Ae(c)})},1016827:(u,c,_,y,T,E,A,P,K)=>{t.$b("Attention",u,{numHeads:c,isUnidirectional:_,maskFilterValue:y,scale:T,doRotary:E,qkvHiddenSizes:A?Array.from((k(),M).subarray(Number(P)>>>0,Number(P)+A>>>0)):[],pastPresentShareBuffer:!!K})},1017099:u=>{t.$b("BiasAdd",u,void 0)},1017154:u=>{t.$b("BiasSplitGelu",u,void 0)},1017215:u=>{t.$b("FastGelu",u,void 0)},1017271:(u,c,_,y,T,E,A,P,K,Z,oe,he,_e,$e,$t,Gi)=>{t.$b("Conv",u,{format:he?"NHWC":"NCHW",auto_pad:c,dilations:_?Array.from((k(),M).subarray(Number(_)>>>0,Number(y)>>>0)):[],group:T,kernel_shape:E?Array.from((k(),M).subarray(Number(E)>>>0,Number(A)>>>0)):[],pads:P?Array.from((k(),M).subarray(Number(P)>>>0,Number(K)>>>0)):[],strides:Z?Array.from((k(),M).subarray(Number(Z)>>>0,Number(oe)>>>0)):[],w_is_const:()=>!!(k(),L)[Number(_e)>>>0],activation:Ae($e),activation_params:$t?Array.from((k(),V).subarray(Number($t)>>>0,Number(Gi)>>>0)):[]})},1017855:u=>{t.$b("Gelu",u,void 0)},1017907:(u,c,_,y,T,E,A,P,K)=>{t.$b("GroupQueryAttention",u,{numHeads:c,kvNumHeads:_,scale:y,softcap:T,doRotary:E,rotaryInterleaved:A,smoothSoftmax:P,localWindowSize:K})},1018124:(u,c,_,y)=>{t.$b("LayerNormalization",u,{axis:c,epsilon:_,simplified:!!y})},1018235:(u,c,_,y)=>{t.$b("LayerNormalization",u,{axis:c,epsilon:_,simplified:!!y})},1018346:(u,c,_,y,T,E)=>{t.$b("MatMulNBits",u,{k:c,n:_,accuracyLevel:y,bits:T,blockSize:E})},1018473:(u,c,_,y,T,E)=>{t.$b("MultiHeadAttention",u,{numHeads:c,isUnidirectional:_,maskFilterValue:y,scale:T,doRotary:E})},1018632:(u,c)=>{t.$b("QuickGelu",u,{alpha:c})},1018696:(u,c,_,y,T)=>{t.$b("RotaryEmbedding",u,{interleaved:!!c,numHeads:_,rotaryEmbeddingDim:y,scale:T})},1018835:(u,c,_)=>{t.$b("SkipLayerNormalization",u,{epsilon:c,simplified:!!_})},1018937:(u,c,_)=>{t.$b("SkipLayerNormalization",u,{epsilon:c,simplified:!!_})},1019039:(u,c,_,y)=>{t.$b("GatherBlockQuantized",u,{gatherAxis:c,quantizeAxis:_,blockSize:y})},1019160:u=>{t.Fd(u)},1019194:(u,c)=>t.Hd(Number(u),Number(c),t.Yc.Kd,t.Yc.errors)};function v0(u,c,_){return Cs(async()=>{await t.Dd(Number(u),Number(c),Number(_))})}function x0(){return typeof wasmOffsetConverter<"u"}function S0(u,c,_,y){var T=le();try{return co(u,c,_,y)}catch(E){if(ue(T),E!==E+0)throw E;de(1,0)}}function k0(u,c,_){var y=le();try{return oo(u,c,_)}catch(T){if(ue(y),T!==T+0)throw T;de(1,0)}}function T0(u){var c=le();try{no(u)}catch(_){if(ue(c),_!==_+0)throw _;de(1,0)}}function I0(u,c){var _=le();try{return qi(u,c)}catch(y){if(ue(_),y!==y+0)throw y;de(1,0)}}function E0(u,c,_){var y=le();try{io(u,c,_)}catch(T){if(ue(y),T!==T+0)throw T;de(1,0)}}function C0(u,c){var _=le();try{ho(u,c)}catch(y){if(ue(_),y!==y+0)throw y;de(1,0)}}function z0(u,c,_,y,T,E,A){var P=le();try{return lo(u,c,_,y,T,E,A)}catch(K){if(ue(P),K!==K+0)throw K;de(1,0)}}function A0(u,c,_,y,T,E){var A=le();try{ao(u,c,_,y,T,E)}catch(P){if(ue(A),P!==P+0)throw P;de(1,0)}}function M0(u,c,_,y){var T=le();try{po(u,c,_,y)}catch(E){if(ue(T),E!==E+0)throw E;de(1,0)}}function O0(u,c,_,y,T){var E=le();try{so(u,c,_,y,T)}catch(A){if(ue(E),A!==A+0)throw A;de(1,0)}}function R0(u,c,_,y,T,E,A){var P=le();try{mo(u,c,_,y,T,E,A)}catch(K){if(ue(P),K!==K+0)throw K;de(1,0)}}function N0(u,c,_,y,T,E,A){var P=le();try{go(u,c,_,y,T,E,A)}catch(K){if(ue(P),K!==K+0)throw K;de(1,0)}}function B0(u,c,_,y,T,E,A,P){var K=le();try{wo(u,c,_,y,T,E,A,P)}catch(Z){if(ue(K),Z!==Z+0)throw Z;de(1,0)}}function D0(u,c,_,y,T){var E=le();try{return fo(u,c,_,y,T)}catch(A){if(ue(E),A!==A+0)throw A;de(1,0)}}function P0(u,c,_){var y=le();try{return $o(u,c,_)}catch(T){if(ue(y),T!==T+0)throw T;de(1,0)}}function U0(u,c,_,y,T,E,A,P){var K=le();try{vo(u,c,_,y,T,E,A,P)}catch(Z){if(ue(K),Z!==Z+0)throw Z;de(1,0)}}function L0(u,c,_,y,T,E,A,P,K,Z,oe,he){var _e=le();try{yo(u,c,_,y,T,E,A,P,K,Z,oe,he)}catch($e){if(ue(_e),$e!==$e+0)throw $e;de(1,0)}}function q0(u,c,_,y,T,E){var A=le();try{return _o(u,c,_,y,T,E)}catch(P){if(ue(A),P!==P+0)throw P;de(1,0)}}function W0(u,c,_){var y=le();try{return xo(u,c,_)}catch(T){if(ue(y),T!==T+0)throw T;return de(1,0),0n}}function G0(u,c,_,y,T,E,A,P,K){var Z=le();try{uo(u,c,_,y,T,E,A,P,K)}catch(oe){if(ue(Z),oe!==oe+0)throw oe;de(1,0)}}function V0(u){var c=le();try{return So(u)}catch(_){if(ue(c),_!==_+0)throw _;de(1,0)}}function F0(u,c){var _=le();try{return Uo(u,c)}catch(y){if(ue(_),y!==y+0)throw y;return de(1,0),0n}}function H0(u){var c=le();try{return ko(u)}catch(_){if(ue(c),_!==_+0)throw _;return de(1,0),0n}}function j0(u,c,_,y){var T=le();try{return Ao(u,c,_,y)}catch(E){if(ue(T),E!==E+0)throw E;de(1,0)}}function K0(u,c,_,y,T){var E=le();try{return Mo(u,c,_,y,T)}catch(A){if(ue(E),A!==A+0)throw A;de(1,0)}}function X0(u,c,_,y,T,E){var A=le();try{return Oo(u,c,_,y,T,E)}catch(P){if(ue(A),P!==P+0)throw P;de(1,0)}}function Z0(u,c,_,y,T,E){var A=le();try{return Ro(u,c,_,y,T,E)}catch(P){if(ue(A),P!==P+0)throw P;de(1,0)}}function Y0(u,c,_,y,T,E,A,P){var K=le();try{return bo(u,c,_,y,T,E,A,P)}catch(Z){if(ue(K),Z!==Z+0)throw Z;de(1,0)}}function Q0(u,c,_,y,T){var E=le();try{return No(u,c,_,y,T)}catch(A){if(ue(E),A!==A+0)throw A;return de(1,0),0n}}function J0(u,c,_,y){var T=le();try{return Bo(u,c,_,y)}catch(E){if(ue(T),E!==E+0)throw E;de(1,0)}}function ey(u,c,_,y){var T=le();try{return Do(u,c,_,y)}catch(E){if(ue(T),E!==E+0)throw E;de(1,0)}}function ty(u,c,_,y,T,E,A,P,K,Z,oe,he){var _e=le();try{return Po(u,c,_,y,T,E,A,P,K,Z,oe,he)}catch($e){if(ue(_e),$e!==$e+0)throw $e;de(1,0)}}function ry(u,c,_,y,T,E,A,P,K,Z,oe){var he=le();try{Co(u,c,_,y,T,E,A,P,K,Z,oe)}catch(_e){if(ue(he),_e!==_e+0)throw _e;de(1,0)}}function iy(u,c,_,y,T,E,A,P,K,Z,oe,he,_e,$e,$t,Gi){var oy=le();try{zo(u,c,_,y,T,E,A,P,K,Z,oe,he,_e,$e,$t,Gi)}catch(Vi){if(ue(oy),Vi!==Vi+0)throw Vi;de(1,0)}}function ny(u,c,_){var y=le();try{return To(u,c,_)}catch(T){if(ue(y),T!==T+0)throw T;de(1,0)}}function ay(u,c,_){var y=le();try{return Io(u,c,_)}catch(T){if(ue(y),T!==T+0)throw T;de(1,0)}}function sy(u,c,_,y){var T=le();try{Eo(u,c,_,y)}catch(E){if(ue(T),E!==E+0)throw E;de(1,0)}}function Ur(){if(0<ve)De=Ur;else if(n)b?.(t),Q();else{for(var u=ye;0<u.length;)u.shift()(t);0<ve?De=Ur:(t.calledRun=!0,C||(Q(),b?.(t)))}}return n||(ht=await Ie(),Ur()),t.PTR_SIZE=4,W?t:new Promise((u,c)=>{b=u,v=c})}var Sc,Zo,Vy=F(()=>{Sc=Xo,Zo=globalThis.self?.name?.startsWith("em-pthread"),Zo&&Xo()}),Yi,Jn,Yo,Le,kc,Wr,Qo,Jo,Qi,eu,Ji,Tc,en,Ic,ka=F(()=>{Sa(),Yi=typeof location>"u"?void 0:location.origin,Jn=import.meta.url>"file:"&&import.meta.url<"file;",Yo=()=>{{if(Jn){let e=URL;return new URL(new e("ort.bundle.min.mjs",import.meta.url).href,Yi).href}return import.meta.url}},Le=Yo(),kc=()=>{if(Le&&!Le.startsWith("blob:"))return Le.substring(0,Le.lastIndexOf("/")+1)},Wr=(e,t)=>{try{let r=t??Le;return(r?new URL(e,r):new URL(e)).origin===Yi}catch{return!1}},Qo=(e,t)=>{let r=t??Le;try{return(r?new URL(e,r):new URL(e)).href}catch{return}},Jo=(e,t)=>`${t??"./"}${e}`,Qi=async e=>{let t=await(await fetch(e,{credentials:"same-origin"})).blob();return URL.createObjectURL(t)},eu=async e=>(await import(e)).default,Ji=(Gy(),kr($c)).default,Tc=async()=>{if(!Le)throw new Error("Failed to load proxy worker: cannot determine the script source URL.");if(Wr(Le))return[void 0,Ji()];let e=await Qi(Le);return[e,Ji(e)]},en=(Vy(),kr(xc)).default,Ic=async(e,t,r,i)=>{let n=en&&!(e||t);if(n)if(Le)n=Wr(Le)||i&&!r;else if(i&&!r)n=!0;else throw new Error("cannot determine the script source URL.");if(n)return[void 0,en];{let a="ort-wasm-simd-threaded.jsep.mjs",s=e??Qo(a,t),o=r&&s&&!Wr(s,t),l=o?await Qi(s):s??Jo(a,t);return[o?l:void 0,await eu(l)]}}}),tn,Gr,lr,rn,tu,ru,iu,Ta,we,Vt=F(()=>{ka(),Gr=!1,lr=!1,rn=!1,tu=()=>{if(typeof SharedArrayBuffer>"u")return!1;try{return typeof MessageChannel<"u"&&new MessageChannel().port1.postMessage(new SharedArrayBuffer(1)),WebAssembly.validate(new Uint8Array([0,97,115,109,1,0,0,0,1,4,1,96,0,0,3,2,1,0,5,4,1,3,1,1,10,11,1,9,0,65,0,254,16,2,0,26,11]))}catch{return!1}},ru=()=>{try{return WebAssembly.validate(new Uint8Array([0,97,115,109,1,0,0,0,1,4,1,96,0,0,3,2,1,0,10,30,1,28,0,65,0,253,15,253,12,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,253,186,1,26,11]))}catch{return!1}},iu=()=>{try{return WebAssembly.validate(new Uint8Array([0,97,115,109,1,0,0,0,1,5,1,96,0,1,123,3,2,1,0,10,19,1,17,0,65,1,253,15,65,2,253,15,65,3,253,15,253,147,2,11]))}catch{return!1}},Ta=async e=>{if(Gr)return Promise.resolve();if(lr)throw new Error("multiple calls to 'initializeWebAssembly()' detected.");if(rn)throw new Error("previous call to 'initializeWebAssembly()' failed.");lr=!0;let t=e.initTimeout,r=e.numThreads;if(e.simd!==!1){if(e.simd==="relaxed"){if(!iu())throw new Error("Relaxed WebAssembly SIMD is not supported in the current environment.")}else if(!ru())throw new Error("WebAssembly SIMD is not supported in the current environment.")}let i=tu();r>1&&!i&&(typeof self<"u"&&!self.crossOriginIsolated&&console.warn("env.wasm.numThreads is set to "+r+", but this will not work unless you enable crossOriginIsolated mode. See https://web.dev/cross-origin-isolation-guide/ for more info."),console.warn("WebAssembly multi-threading is not supported in the current environment. Falling back to single-threading."),e.numThreads=r=1);let n=e.wasmPaths,a=typeof n=="string"?n:void 0,s=n?.mjs,o=s?.href??s,l=n?.wasm,d=l?.href??l,p=e.wasmBinary,[h,f]=await Ic(o,a,r>1,!!p||!!d),g=!1,m=[];if(t>0&&m.push(new Promise(b=>{setTimeout(()=>{g=!0,b()},t)})),m.push(new Promise((b,v)=>{let $={numThreads:r};if(p)$.wasmBinary=p,$.locateFile=w=>w;else if(d||a)$.locateFile=w=>d??a+w;else if(o&&o.indexOf("blob:")!==0)$.locateFile=w=>new URL(w,o).href;else if(h){let w=kc();w&&($.locateFile=S=>w+S)}f($).then(w=>{lr=!1,Gr=!0,tn=w,b(),h&&URL.revokeObjectURL(h)},w=>{lr=!1,rn=!0,v(w)})})),await Promise.race(m),g)throw new Error(`WebAssembly backend initializing failed due to timeout: ${t}ms`)},we=()=>{if(Gr&&tn)return tn;throw new Error("WebAssembly is not initialized yet.")}}),tt,ui,ge,Ia=F(()=>{Vt(),tt=(e,t)=>{let r=we(),i=r.lengthBytesUTF8(e)+1,n=r._malloc(i);return r.stringToUTF8(e,n,i),t.push(n),n},ui=(e,t,r,i)=>{if(typeof e=="object"&&e!==null){if(r.has(e))throw new Error("Circular reference in options");r.add(e)}Object.entries(e).forEach(([n,a])=>{let s=t?t+n:n;if(typeof a=="object")ui(a,s+".",r,i);else if(typeof a=="string"||typeof a=="number")i(s,a.toString());else if(typeof a=="boolean")i(s,a?"1":"0");else throw new Error(`Can't handle extra config type: ${typeof a}`)})},ge=e=>{let t=we(),r=t.stackSave();try{let i=t.PTR_SIZE,n=t.stackAlloc(2*i);t._OrtGetLastError(n,n+i);let a=Number(t.getValue(n,i===4?"i32":"i64")),s=t.getValue(n+i,"*"),o=s?t.UTF8ToString(s):"";throw new Error(`${e} ERROR_CODE: ${a}, ERROR_MESSAGE: ${o}`)}finally{t.stackRestore(r)}}}),Ec,Fy=F(()=>{Vt(),Ia(),Ec=e=>{let t=we(),r=0,i=[],n=e||{};try{if(e?.logSeverityLevel===void 0)n.logSeverityLevel=2;else if(typeof e.logSeverityLevel!="number"||!Number.isInteger(e.logSeverityLevel)||e.logSeverityLevel<0||e.logSeverityLevel>4)throw new Error(`log severity level is not valid: ${e.logSeverityLevel}`);if(e?.logVerbosityLevel===void 0)n.logVerbosityLevel=0;else if(typeof e.logVerbosityLevel!="number"||!Number.isInteger(e.logVerbosityLevel))throw new Error(`log verbosity level is not valid: ${e.logVerbosityLevel}`);e?.terminate===void 0&&(n.terminate=!1);let a=0;return e?.tag!==void 0&&(a=tt(e.tag,i)),r=t._OrtCreateRunOptions(n.logSeverityLevel,n.logVerbosityLevel,!!n.terminate,a),r===0&&ge("Can't create run options."),e?.extra!==void 0&&ui(e.extra,"",new WeakSet,(s,o)=>{let l=tt(s,i),d=tt(o,i);t._OrtAddRunConfigEntry(r,l,d)!==0&&ge(`Can't set a run config entry: ${s} - ${o}.`)}),[r,i]}catch(a){throw r!==0&&t._OrtReleaseRunOptions(r),i.forEach(s=>t._free(s)),a}}}),nu,au,su,zt,ou,Cc,Hy=F(()=>{Vt(),Ia(),nu=e=>{switch(e){case"disabled":return 0;case"basic":return 1;case"extended":return 2;case"layout":return 3;case"all":return 99;default:throw new Error(`unsupported graph optimization level: ${e}`)}},au=e=>{switch(e){case"sequential":return 0;case"parallel":return 1;default:throw new Error(`unsupported execution mode: ${e}`)}},su=e=>{e.extra||(e.extra={}),e.extra.session||(e.extra.session={});let t=e.extra.session;t.use_ort_model_bytes_directly||(t.use_ort_model_bytes_directly="1"),e.executionProviders&&e.executionProviders.some(r=>(typeof r=="string"?r:r.name)==="webgpu")&&(e.enableMemPattern=!1)},zt=(e,t,r,i)=>{let n=tt(t,i),a=tt(r,i);we()._OrtAddSessionConfigEntry(e,n,a)!==0&&ge(`Can't set a session config entry: ${t} - ${r}.`)},ou=async(e,t,r)=>{let i=t.executionProviders;for(let n of i){let a=typeof n=="string"?n:n.name,s=[];switch(a){case"webnn":if(a="WEBNN",zt(e,"session.disable_quant_qdq","1",r),zt(e,"session.disable_qdq_constant_folding","1",r),typeof n!="string"){let h=n?.deviceType;h&&zt(e,"deviceType",h,r)}break;case"webgpu":if(a="JS",typeof n!="string"){let h=n;if(h?.preferredLayout){if(h.preferredLayout!=="NCHW"&&h.preferredLayout!=="NHWC")throw new Error(`preferredLayout must be either 'NCHW' or 'NHWC': ${h.preferredLayout}`);zt(e,"preferredLayout",h.preferredLayout,r)}}break;case"wasm":case"cpu":continue;default:throw new Error(`not supported execution provider: ${a}`)}let o=tt(a,r),l=s.length,d=0,p=0;if(l>0){d=we()._malloc(l*we().PTR_SIZE),r.push(d),p=we()._malloc(l*we().PTR_SIZE),r.push(p);for(let h=0;h<l;h++)we().setValue(d+h*we().PTR_SIZE,s[h][0],"*"),we().setValue(p+h*we().PTR_SIZE,s[h][1],"*")}await we()._OrtAppendExecutionProvider(e,o,d,p,l)!==0&&ge(`Can't append execution provider: ${a}.`)}},Cc=async e=>{let t=we(),r=0,i=[],n=e||{};su(n);try{let a=nu(n.graphOptimizationLevel??"all"),s=au(n.executionMode??"sequential"),o=typeof n.logId=="string"?tt(n.logId,i):0,l=n.logSeverityLevel??2;if(!Number.isInteger(l)||l<0||l>4)throw new Error(`log severity level is not valid: ${l}`);let d=n.logVerbosityLevel??0;if(!Number.isInteger(d)||d<0||d>4)throw new Error(`log verbosity level is not valid: ${d}`);let p=typeof n.optimizedModelFilePath=="string"?tt(n.optimizedModelFilePath,i):0;if(r=t._OrtCreateSessionOptions(a,!!n.enableCpuMemArena,!!n.enableMemPattern,s,!!n.enableProfiling,0,o,l,d,p),r===0&&ge("Can't create session options."),n.executionProviders&&await ou(r,n,i),n.enableGraphCapture!==void 0){if(typeof n.enableGraphCapture!="boolean")throw new Error(`enableGraphCapture must be a boolean value: ${n.enableGraphCapture}`);zt(r,"enableGraphCapture",n.enableGraphCapture.toString(),i)}if(n.freeDimensionOverrides)for(let[h,f]of Object.entries(n.freeDimensionOverrides)){if(typeof h!="string")throw new Error(`free dimension override name must be a string: ${h}`);if(typeof f!="number"||!Number.isInteger(f)||f<0)throw new Error(`free dimension override value must be a non-negative integer: ${f}`);let g=tt(h,i);t._OrtAddFreeDimensionOverride(r,g,f)!==0&&ge(`Can't set a free dimension override: ${h} - ${f}.`)}return n.extra!==void 0&&ui(n.extra,"",new WeakSet,(h,f)=>{zt(r,h,f,i)}),[r,i]}catch(a){throw r!==0&&t._OrtReleaseSessionOptions(r)!==0&&ge("Can't release session options."),i.forEach(s=>t._free(s)),a}}}),Bt,mt,Dt,yi,li,Ea,Ca,ea,ie=F(()=>{Bt=e=>{switch(e){case"int8":return 3;case"uint8":return 2;case"bool":return 9;case"int16":return 5;case"uint16":return 4;case"int32":return 6;case"uint32":return 12;case"float16":return 10;case"float32":return 1;case"float64":return 11;case"string":return 8;case"int64":return 7;case"uint64":return 13;case"int4":return 22;case"uint4":return 21;default:throw new Error(`unsupported data type: ${e}`)}},mt=e=>{switch(e){case 3:return"int8";case 2:return"uint8";case 9:return"bool";case 5:return"int16";case 4:return"uint16";case 6:return"int32";case 12:return"uint32";case 10:return"float16";case 1:return"float32";case 11:return"float64";case 8:return"string";case 7:return"int64";case 13:return"uint64";case 22:return"int4";case 21:return"uint4";default:throw new Error(`unsupported data type: ${e}`)}},Dt=(e,t)=>{let r=[-1,4,1,1,2,2,4,8,-1,1,2,8,4,8,-1,-1,-1,-1,-1,-1,-1,.5,.5][e],i=typeof t=="number"?t:t.reduce((n,a)=>n*a,1);return r>0?Math.ceil(i*r):void 0},yi=e=>{switch(e){case"float16":return typeof Float16Array<"u"?Float16Array:Uint16Array;case"float32":return Float32Array;case"uint8":return Uint8Array;case"int8":return Int8Array;case"uint16":return Uint16Array;case"int16":return Int16Array;case"int32":return Int32Array;case"bool":return Uint8Array;case"float64":return Float64Array;case"uint32":return Uint32Array;case"int64":return BigInt64Array;case"uint64":return BigUint64Array;default:throw new Error(`unsupported type: ${e}`)}},li=e=>{switch(e){case"verbose":return 0;case"info":return 1;case"warning":return 2;case"error":return 3;case"fatal":return 4;default:throw new Error(`unsupported logging level: ${e}`)}},Ea=e=>e==="float32"||e==="float16"||e==="int32"||e==="int64"||e==="uint32"||e==="uint8"||e==="bool"||e==="uint4"||e==="int4",Ca=e=>e==="float32"||e==="float16"||e==="int32"||e==="int64"||e==="uint32"||e==="uint64"||e==="int8"||e==="uint8"||e==="bool"||e==="uint4"||e==="int4",ea=e=>{switch(e){case"none":return 0;case"cpu":return 1;case"cpu-pinned":return 2;case"texture":return 3;case"gpu-buffer":return 4;case"ml-tensor":return 5;default:throw new Error(`unsupported data location: ${e}`)}}}),za,zc=F(()=>{Sa(),za=async e=>{if(typeof e=="string"){let t=await fetch(e);if(!t.ok)throw new Error(`failed to load external data file: ${e}`);let r=t.headers.get("Content-Length"),i=r?parseInt(r,10):0;if(i<1073741824)return new Uint8Array(await t.arrayBuffer());{if(!t.body)throw new Error(`failed to load external data file: ${e}, no response body.`);let n=t.body.getReader(),a;try{a=new ArrayBuffer(i)}catch(o){if(o instanceof RangeError){let l=Math.ceil(i/65536);a=new WebAssembly.Memory({initial:l,maximum:l}).buffer}else throw o}let s=0;for(;;){let{done:o,value:l}=await n.read();if(o)break;let d=l.byteLength;new Uint8Array(a,s,d).set(l),s+=d}return new Uint8Array(a,0,i)}}else return e instanceof Blob?new Uint8Array(await e.arrayBuffer()):e instanceof Uint8Array?e:new Uint8Array(e)}}),uu,lu,du,pu,Aa,cu,ce,gt=F(()=>{ie(),uu=["V","I","W","E","F"],lu=(e,t)=>{console.log(`[${uu[e]},${new Date().toISOString()}]${t}`)},Aa=(e,t)=>{du=e,pu=t},cu=(e,t)=>{let r=li(e),i=li(du);r>=i&&lu(r,typeof t=="function"?t():t)},ce=(...e)=>{pu&&cu(...e)}}),hu,tr,N,di,Ac,Mc,Oc,ne=F(()=>{hu=class{static calcMatMulShape(e,t){return e[1]!==t[0]?void 0:[e[0],t[1]]}},tr=class{static calcShape(e,t,r=!1){let i=e.length,n=t.length;if(i===0)return t;if(n===0)return e;let a=Math.max(e.length,t.length),s=new Array(a);if(r){if(i<2||n<2)return;let o=hu.calcMatMulShape([e[i-2],e[i-1]],[t[n-2],t[n-1]]);if(o===void 0)return;[s[a-2],s[a-1]]=o}for(let o=r?3:1;o<=a;o++){let l=i-o<0?1:e[i-o],d=n-o<0?1:t[n-o];if(l!==d&&l>1&&d>1)return;let p=Math.max(l,d);if(l&&d)s[a-o]=Math.max(l,d);else{if(p>1)return;s[a-o]=0}}return s}static isValidBroadcast(e,t){let r=e.length,i=t.length;if(r>i)return!1;for(let n=1;n<=r;n++)if(e[r-n]!==1&&e[r-n]!==t[i-n])return!1;return!0}},N=class ii{static size(t){return ii.getSizeFromDimensionRange(t,0,t.length)}static convertShape(t,r=4){let i=t.length;if(i===0)return[];let n=new Array(i),a=i-1;for(;a>=0;){if(t[a]%r===0){n[a]=t[a]/r;break}if(r%t[a]!==0)throw new Error("cannot convert shape");n[a]=1,r/=t[a],a--}for(a--;a>=0;a--)n[a]=t[a];return n}static sizeFromDimension(t,r){if(r<0||r>t.length)throw new Error(`invalid dimension of ${r} for sizeFromDimension as Tensor has ${t.length} dimensions.`);return ii.getSizeFromDimensionRange(t,r,t.length)}static sizeToDimension(t,r){if(r<0||r>t.length)throw new Error(`invalid dimension of ${r} for sizeToDimension as Tensor has ${t.length} dimensions.`);return ii.getSizeFromDimensionRange(t,0,r)}static getSizeFromDimensionRange(t,r,i){let n=1;for(let a=r;a<i;a++){if(t[a]<0)throw new Error("cannot get valid size from specified dimension range. Most likely the range contains negative values in them.");n*=Number(t[a])}return n}static computeStrides(t){let r=t.length;if(r===0)return[];if(r===1)return[1];let i=new Array(r);i[r-1]=1,i[r-2]=t[r-1];for(let n=r-3;n>=0;--n)i[n]=i[n+1]*t[n+1];return i}static normalizeAxis(t,r){if(t<-r&&t>=r)throw new Error("unsupported axis for this operation.");return t<0?t+r:t}static normalizeAxes(t,r){return t.map(i=>this.normalizeAxis(i,r??t.length))}static sortBasedOnPerm(t,r){return r?r.map(i=>t[i]):t.slice().reverse()}static padShape(t,r){let i=t.length;return t.map((n,a)=>n+r[a]+r[a+i])}static areEqual(t,r){return t.length!==r.length?!1:t.every((i,n)=>i===r[n])}},di=class wr{static adjustPoolAttributes(t,r,i,n,a,s){if(!t&&i.length!==r.length-2)throw new Error("length of specified kernel shapes should be 2 less than length of input dimensions");if(t)for(let o=0;o<r.length-2;o++)o>=i.length?i.push(r[o+2]):i[o]=r[o+2];for(let o=0;o<i.length;o++)if(o<n.length){if(n[o]<0)throw new Error("strides should be greater than or equal to 1")}else n.push(1);for(let o=0;o<i.length;o++)if(o<a.length){if(a[o]<0)throw new Error("dilations should be greater than or equal to 1")}else a.push(1);for(let o=0;o<i.length*2;o++)if(o<s.length){if(s[o]<0)throw new Error("pad should be greater than or equal to 1")}else s.push(0);for(let o=0;o<i.length;o++){if(i[o]<=0)throw new Error("kernel shapes need to be greater than 0");if(s[o]>=i[o]||s[o+i.length]>=i[o])throw new Error("pads should be smaller than kernel")}}static adjustPadsBasedOnAutoPad(t,r,i,n,a,s,o){if(o){if(a.length!==2*(t.length-2))throw new Error("length of pads should be twice the length of data dimensions");if(r.length!==t.length-2)throw new Error("length of strides should be the length of data dimensions");if(n.length!==t.length-2)throw new Error("length of kernel shapes should be the length of data dimensions");for(let l=0;l<t.length-2;l++)wr.adjustPadAndReturnShape(t[l+(s?1:2)],r[l],i[l],n[l],a,l,l+t.length-2,o)}}static computePoolOutputShape(t,r,i,n,a,s,o){if(r.length<=0)throw new Error("input shape must be of size greater than 0");let l=[r[0],r[1]];return wr.computeShapeHelper(t,r,l,i,n,a,s,o),l}static computeConvOutputShape(t,r,i,n,a,s,o){if(t.length<=0||r.length<=0)throw new Error("invalid input tensor dims or invalid filter tensor dims");let l=[t[0],r[0]];return wr.computeShapeHelper(!1,t,l,i,n,a,s,o),l}static computeShapeHelper(t,r,i,n,a,s,o,l){if(t)for(let d=0;d<r.length-2;d++)i.push(1);else for(let d=0;d<r.length-2;d++)i.push(wr.adjustPadAndReturnShape(r[d+2],n[d],a[d],s[d],o,d,d+r.length-2,l))}static adjustPadAndReturnShape(t,r,i,n,a,s,o,l){let d=i*(n-1)+1;if(l&&l!=="NOTSET")switch(l){case"VALID":return a[s]=0,a[o]=0,Math.floor((t-d)/r+1);case"SAME_LOWER":case"SAME_UPPER":if(i!==1)throw new Error("Dilation not supported for SAME_UPPER or SAME_LOWER");{let p=((t+r-1)/r-1)*r+n-t;return a[s]=Math.floor(l==="SAME_LOWER"?(p+1)/2:p/2),a[o]=p-a[s],Math.floor((t+p-n)/r+1)}default:throw new Error("Unsupported AutoPad type")}else return Math.floor((t+a[s]+a[o]-d)/r+1)}},Ac=class{static getShapeOfGemmResult(e,t,r,i,n){if(e.length!==2||r.length!==2)throw new Error("shape need to be of size 2");let a,s,o;t?(a=e[1],s=e[0]):(a=e[0],s=e[1]);let l=-1;if(i?(o=r[0],l=1):(o=r[1],l=0),r[l]!==s)throw new Error("dimension mismatch");if(a<=0||o<=0||s<=0)throw new Error("invalid shape specified");if(n&&!tr.isValidBroadcast(n,[a,o]))throw new Error("gemm: invalid bias shape for broadcast");return[a,o,s]}},Mc=-34028234663852886e22,Oc=34028234663852886e22}),Ma,Rc=F(()=>{ie(),Ma=(e,t)=>new(yi(t))(e)}),nn,ta,an,fu,sn,mu,on,un,ln,gu,Nc,jy=F(()=>{ie(),gt(),nn=new Map([["float32",32],["float16",16],["int32",32],["uint32",32],["int64",64],["uint64",64],["int8",8],["uint8",8],["int4",4],["uint4",4]]),ta=(e,t)=>{if(t==="int32")return e;let r=nn.get(t);if(!r)throw new Error(`WebNN backend does not support data type: ${t}`);let i=r/8;if(e.byteLength%i!==0)throw new Error(`Invalid Uint8Array length - must be a multiple of ${i}.`);let n=e.byteLength/i,a=new(yi(t))(e.buffer,e.byteOffset,n);switch(t){case"int64":case"uint64":{let s=new Int32Array(n);for(let o=0;o<n;o++){let l=a[o];if(l>2147483647n||l<-2147483648n)throw new Error("Can not convert int64 data to int32 - value out of range.");s[o]=Number(l)}return new Uint8Array(s.buffer)}case"int8":case"uint8":case"uint32":{if(t==="uint32"&&a.some(o=>o>2147483647))throw new Error("Can not convert uint32 data to int32 - value out of range.");let s=Int32Array.from(a,Number);return new Uint8Array(s.buffer)}default:throw new Error(`Unsupported data conversion from ${t} to 'int32'`)}},an=(e,t)=>{if(t==="int32")return e;if(e.byteLength%4!==0)throw new Error("Invalid Uint8Array length - must be a multiple of 4 (int32).");let r=e.byteLength/4,i=new Int32Array(e.buffer,e.byteOffset,r);switch(t){case"int64":{let n=BigInt64Array.from(i,BigInt);return new Uint8Array(n.buffer)}case"uint64":{if(i.some(a=>a<0))throw new Error("Can not convert int32 data to uin64 - negative value found.");let n=BigUint64Array.from(i,BigInt);return new Uint8Array(n.buffer)}case"int8":{if(i.some(a=>a<-128||a>127))throw new Error("Can not convert int32 data to int8 - value out of range.");let n=Int8Array.from(i,Number);return new Uint8Array(n.buffer)}case"uint8":{if(i.some(n=>n<0||n>255))throw new Error("Can not convert int32 data to uint8 - value out of range.");return Uint8Array.from(i,Number)}case"uint32":{if(i.some(a=>a<0))throw new Error("Can not convert int32 data to uint32 - negative value found.");let n=Uint32Array.from(i,Number);return new Uint8Array(n.buffer)}default:throw new Error(`Unsupported data conversion from 'int32' to ${t}`)}},fu=1,sn=()=>fu++,mu=new Map([["int8","int32"],["uint8","int32"],["uint32","int32"],["int64","int32"]]),on=(e,t)=>{let r=nn.get(e);if(!r)throw new Error(`WebNN backend does not support data type: ${e}`);return t.length>0?Math.ceil(t.reduce((i,n)=>i*n)*r/8):0},un=class{constructor(e){this.isDataConverted=!1;let{sessionId:t,context:r,tensor:i,dataType:n,shape:a,fallbackDataType:s}=e;this.sessionId=t,this.mlContext=r,this.mlTensor=i,this.dataType=n,this.tensorShape=a,this.fallbackDataType=s}get tensor(){return this.mlTensor}get type(){return this.dataType}get fallbackType(){return this.fallbackDataType}get shape(){return this.tensorShape}get byteLength(){return on(this.dataType,this.tensorShape)}destroy(){ce("verbose",()=>"[WebNN] TensorWrapper.destroy"),this.mlTensor.destroy()}write(e){this.mlContext.writeTensor(this.mlTensor,e)}async read(e){if(this.fallbackDataType){let t=await this.mlContext.readTensor(this.mlTensor),r=an(new Uint8Array(t),this.dataType);if(e){(e instanceof ArrayBuffer?new Uint8Array(e):new Uint8Array(e.buffer,e.byteOffset,e.byteLength)).set(r);return}else return new Uint8Array(r).buffer}else return e?this.mlContext.readTensor(this.mlTensor,e):this.mlContext.readTensor(this.mlTensor)}canReuseTensor(e,t,r){return this.mlContext===e&&this.dataType===t&&this.tensorShape.length===r.length&&this.tensorShape.every((i,n)=>i===r[n])}setIsDataConverted(e){this.isDataConverted=e}},ln=class{constructor(e,t){this.tensorManager=e,this.wrapper=t}get tensorWrapper(){return this.wrapper}releaseTensor(){this.tensorWrapper&&(this.tensorManager.releaseTensor(this.tensorWrapper),this.wrapper=void 0)}async ensureTensor(e,t,r,i){let n=this.tensorManager.getMLContext(e),a=this.tensorManager.getMLOpSupportLimits(e),s;if(!a?.input.dataTypes.includes(t)){if(s=mu.get(t),!s||a?.input.dataTypes.includes(s))throw new Error(`WebNN backend does not support data type: ${t}`);ce("verbose",()=>`[WebNN] TensorIdTracker.ensureTensor: fallback dataType from ${t} to ${s}`)}if(this.wrapper){if(this.wrapper.canReuseTensor(n,t,r))return this.wrapper.tensor;if(i){if(this.wrapper.byteLength!==on(t,r))throw new Error("Unable to copy data to tensor with different size.");this.activeUpload=new Uint8Array(await this.wrapper.read())}this.tensorManager.releaseTensor(this.wrapper)}let o=typeof MLTensorUsage>"u"?void 0:MLTensorUsage.READ|MLTensorUsage.WRITE;return this.wrapper=await this.tensorManager.getCachedTensor(e,t,r,o,!0,!0,s),i&&this.activeUpload&&(this.wrapper.write(this.activeUpload),this.activeUpload=void 0),this.wrapper.tensor}upload(e){let t=e;if(this.wrapper){if(this.wrapper.fallbackType)if(this.wrapper.fallbackType==="int32")t=ta(e,this.wrapper.type),this.wrapper.setIsDataConverted(!0);else throw new Error(`Unsupported fallback data type: ${this.wrapper.fallbackType}`);if(e.byteLength===this.wrapper.byteLength){this.wrapper.write(t);return}else ce("verbose",()=>"Data size does not match tensor size. Releasing tensor."),this.releaseTensor()}this.activeUpload?this.activeUpload.set(t):this.activeUpload=new Uint8Array(t)}async download(e){if(this.activeUpload){let t=this.wrapper?.isDataConverted?an(this.activeUpload,this.wrapper?.type):this.activeUpload;if(e){e instanceof ArrayBuffer?new Uint8Array(e).set(t):new Uint8Array(e.buffer,e.byteOffset,e.byteLength).set(t);return}else return t.buffer}if(!this.wrapper)throw new Error("Tensor has not been created.");return e?this.wrapper.read(e):this.wrapper.read()}},gu=class{constructor(e){this.backend=e,this.tensorTrackersById=new Map,this.freeTensors=[],this.externalTensors=new Set}getMLContext(e){let t=this.backend.getMLContext(e);if(!t)throw new Error("MLContext not found for session.");return t}getMLOpSupportLimits(e){return this.backend.getMLOpSupportLimits(e)}reserveTensorId(){let e=sn();return this.tensorTrackersById.set(e,new ln(this)),e}releaseTensorId(e){let t=this.tensorTrackersById.get(e);t&&(this.tensorTrackersById.delete(e),t.tensorWrapper&&this.releaseTensor(t.tensorWrapper))}async ensureTensor(e,t,r,i,n){ce("verbose",()=>`[WebNN] TensorManager.ensureTensor {tensorId: ${t}, dataType: ${r}, shape: ${i}, copyOld: ${n}}`);let a=this.tensorTrackersById.get(t);if(!a)throw new Error("Tensor not found.");return a.ensureTensor(e,r,i,n)}upload(e,t){let r=this.tensorTrackersById.get(e);if(!r)throw new Error("Tensor not found.");r.upload(t)}async download(e,t){ce("verbose",()=>`[WebNN] TensorManager.download {tensorId: ${e}, dstBuffer: ${t?.byteLength}}`);let r=this.tensorTrackersById.get(e);if(!r)throw new Error("Tensor not found.");return r.download(t)}releaseTensorsForSession(e){for(let t of this.freeTensors)t.sessionId===e&&t.destroy();this.freeTensors=this.freeTensors.filter(t=>t.sessionId!==e)}registerTensor(e,t,r,i){let n=this.getMLContext(e),a=sn(),s=new un({sessionId:e,context:n,tensor:t,dataType:r,shape:i});return this.tensorTrackersById.set(a,new ln(this,s)),this.externalTensors.add(s),a}async getCachedTensor(e,t,r,i,n,a,s){let o=this.getMLContext(e);for(let[d,p]of this.freeTensors.entries())if(p.canReuseTensor(o,t,r)){ce("verbose",()=>`[WebNN] Reusing tensor {dataType: ${t}, ${s?`fallbackDataType: ${s},`:""} shape: ${r}`);let h=this.freeTensors.splice(d,1)[0];return h.sessionId=e,h}ce("verbose",()=>`[WebNN] MLContext.createTensor {dataType: ${t}, ${s?`fallbackDataType: ${s},`:""} shape: ${r}}`);let l=await o.createTensor({dataType:s??t,shape:r,dimensions:r,usage:i,writable:n,readable:a});return new un({sessionId:e,context:o,tensor:l,dataType:t,shape:r,fallbackDataType:s})}releaseTensor(e){this.externalTensors.has(e)&&this.externalTensors.delete(e),this.freeTensors.push(e)}},Nc=(...e)=>new gu(...e)}),dr,yu,Bc,Ky=F(()=>{ie(),Vt(),Rc(),jy(),gt(),dr=new Map([[1,"float32"],[10,"float16"],[6,"int32"],[12,"uint32"],[7,"int64"],[13,"uint64"],[22,"int4"],[21,"uint4"],[3,"int8"],[2,"uint8"],[9,"uint8"]]),yu=(e,t)=>{if(e===t)return!0;if(e===void 0||t===void 0)return!1;let r=Object.keys(e).sort(),i=Object.keys(t).sort();return r.length===i.length&&r.every((n,a)=>n===i[a]&&e[n]===t[n])},Bc=class{constructor(e){this.tensorManager=Nc(this),this.mlContextBySessionId=new Map,this.sessionIdsByMLContext=new Map,this.mlContextCache=[],this.sessionGraphInputs=new Map,this.sessionGraphOutputs=new Map,this.temporaryGraphInputs=[],this.temporaryGraphOutputs=[],this.temporarySessionTensorIds=new Map,this.mlOpSupportLimitsBySessionId=new Map,Aa(e.logLevel,!!e.debug)}get currentSessionId(){if(this.activeSessionId===void 0)throw new Error("No active session");return this.activeSessionId}onRunStart(e){ce("verbose",()=>`[WebNN] onRunStart {sessionId: ${e}}`),this.activeSessionId=e}onRunEnd(e){ce("verbose",()=>`[WebNN] onRunEnd {sessionId: ${e}}`);let t=this.temporarySessionTensorIds.get(e);if(t){for(let r of t)ce("verbose",()=>`[WebNN] releasing temporary tensor {tensorId: ${r}}`),this.tensorManager.releaseTensorId(r);this.temporarySessionTensorIds.delete(e),this.activeSessionId=void 0}}async createMLContext(e){if(e instanceof GPUDevice){let r=this.mlContextCache.findIndex(i=>i.gpuDevice===e);if(r!==-1)return this.mlContextCache[r].mlContext;{let i=await navigator.ml.createContext(e);return this.mlContextCache.push({gpuDevice:e,mlContext:i}),i}}else if(e===void 0){let r=this.mlContextCache.findIndex(i=>i.options===void 0&&i.gpuDevice===void 0);if(r!==-1)return this.mlContextCache[r].mlContext;{let i=await navigator.ml.createContext();return this.mlContextCache.push({mlContext:i}),i}}let t=this.mlContextCache.findIndex(r=>yu(r.options,e));if(t!==-1)return this.mlContextCache[t].mlContext;{let r=await navigator.ml.createContext(e);return this.mlContextCache.push({options:e,mlContext:r}),r}}registerMLContext(e,t){this.mlContextBySessionId.set(e,t);let r=this.sessionIdsByMLContext.get(t);r||(r=new Set,this.sessionIdsByMLContext.set(t,r)),r.add(e),this.mlOpSupportLimitsBySessionId.has(e)||this.mlOpSupportLimitsBySessionId.set(e,t.opSupportLimits()),this.temporaryGraphInputs.length>0&&(this.sessionGraphInputs.set(e,this.temporaryGraphInputs),this.temporaryGraphInputs=[]),this.temporaryGraphOutputs.length>0&&(this.sessionGraphOutputs.set(e,this.temporaryGraphOutputs),this.temporaryGraphOutputs=[])}onReleaseSession(e){this.sessionGraphInputs.delete(e),this.sessionGraphOutputs.delete(e);let t=this.mlContextBySessionId.get(e);if(!t)return;this.tensorManager.releaseTensorsForSession(e),this.mlContextBySessionId.delete(e),this.mlOpSupportLimitsBySessionId.delete(e);let r=this.sessionIdsByMLContext.get(t);if(r.delete(e),r.size===0){this.sessionIdsByMLContext.delete(t);let i=this.mlContextCache.findIndex(n=>n.mlContext===t);i!==-1&&this.mlContextCache.splice(i,1)}}getMLContext(e){return this.mlContextBySessionId.get(e)}getMLOpSupportLimits(e){return this.mlOpSupportLimitsBySessionId.get(e)}reserveTensorId(){return this.tensorManager.reserveTensorId()}releaseTensorId(e){ce("verbose",()=>`[WebNN] releaseTensorId {tensorId: ${e}}`),this.tensorManager.releaseTensorId(e)}async ensureTensor(e,t,r,i,n){let a=dr.get(r);if(!a)throw new Error(`Unsupported ONNX data type: ${r}`);return this.tensorManager.ensureTensor(e??this.currentSessionId,t,a,i,n)}async createTemporaryTensor(e,t,r){ce("verbose",()=>`[WebNN] createTemporaryTensor {onnxDataType: ${t}, shape: ${r}}`);let i=dr.get(t);if(!i)throw new Error(`Unsupported ONNX data type: ${t}`);let n=this.tensorManager.reserveTensorId();await this.tensorManager.ensureTensor(e,n,i,r,!1);let a=this.temporarySessionTensorIds.get(e);return a?a.push(n):this.temporarySessionTensorIds.set(e,[n]),n}uploadTensor(e,t){if(!we().shouldTransferToMLTensor)throw new Error("Trying to upload to a MLTensor while shouldTransferToMLTensor is false");ce("verbose",()=>`[WebNN] uploadTensor {tensorId: ${e}, data: ${t.byteLength}}`),this.tensorManager.upload(e,t)}async downloadTensor(e,t){return this.tensorManager.download(e,t)}createMLTensorDownloader(e,t){return async()=>{let r=await this.tensorManager.download(e);return Ma(r,t)}}registerMLTensor(e,t,r,i){let n=dr.get(r);if(!n)throw new Error(`Unsupported ONNX data type: ${r}`);let a=this.tensorManager.registerTensor(e,t,n,i);return ce("verbose",()=>`[WebNN] registerMLTensor {tensor: ${t}, dataType: ${n}, dimensions: ${i}} -> {tensorId: ${a}}`),a}registerMLConstant(e,t,r,i,n,a,s=!1){if(!a)throw new Error("External mounted files are not available.");let o=e;e.startsWith("./")&&(o=e.substring(2));let l=a.get(o);if(!l)throw new Error(`File with name ${o} not found in preloaded files.`);if(t+r>l.byteLength)throw new Error("Out of bounds: data offset and length exceed the external file data size.");let d=l.slice(t,t+r).buffer,p;switch(n.dataType){case"float32":p=new Float32Array(d);break;case"float16":p=typeof Float16Array<"u"?new Float16Array(d):new Uint16Array(d);break;case"int32":p=new Int32Array(d);break;case"uint32":p=new Uint32Array(d);break;case"int64":if(s){let h=ta(new Uint8Array(d),"int64");p=new Int32Array(h.buffer),n.dataType="int32"}else p=new BigInt64Array(d);break;case"uint64":p=new BigUint64Array(d);break;case"int8":p=new Int8Array(d);break;case"int4":case"uint4":case"uint8":p=new Uint8Array(d);break;default:throw new Error(`Unsupported data type: ${n.dataType} in creating WebNN Constant from external data.`)}return ce("verbose",()=>`[WebNN] registerMLConstant {dataType: ${n.dataType}, shape: ${n.shape}}} ${s?"(Note: it was int64 data type and registered to int32 as workaround)":""}`),i.constant(n,p)}registerGraphInput(e){this.temporaryGraphInputs.push(e)}registerGraphOutput(e){this.temporaryGraphOutputs.push(e)}isGraphInput(e,t){let r=this.sessionGraphInputs.get(e);return r?r.includes(t):!1}isGraphOutput(e,t){let r=this.sessionGraphOutputs.get(e);return r?r.includes(t):!1}isGraphInputOutputTypeSupported(e,t,r=!0){let i=dr.get(Bt(t)),n=this.mlOpSupportLimitsBySessionId.get(e);return typeof i>"u"?!1:r?!!n?.input.dataTypes.includes(i):!!n?.output.dataTypes.includes(i)}flush(){}}}),Oa=F(()=>{}),dn,Vr,Fr,_u,bu,pn,ra,wu,Dc,Xy=F(()=>{gt(),Oa(),dn=new Map([[64,250],[128,200],[256,200],[512,200],[2048,230],[4096,200],[8192,50],[16384,50],[32768,50],[65536,50],[131072,50],[262144,50],[524288,50],[1048576,50],[2097152,30],[4194304,20],[8388608,10],[12582912,10],[16777216,10],[26214400,15],[33554432,22],[44236800,2],[58982400,6],[67108864,6],[134217728,6],[167772160,6]]),Vr=[],Fr=e=>Math.ceil(Number(e)/16)*16,_u=e=>{for(let t=0;t<Vr.length;t++){let r=Vr[t];if(e<=r)return r}return Math.ceil(e/16)*16},bu=1,pn=()=>bu++,ra=async(e,t,r,i)=>{let n=Fr(r),a=e.device.createBuffer({size:n,usage:GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ});try{let s=e.getCommandEncoder();e.endComputePass(),s.copyBufferToBuffer(t,0,a,0,n),e.flush(),await a.mapAsync(GPUMapMode.READ);let o=a.getMappedRange();if(i){let l=i();return l.set(new Uint8Array(o,0,r)),l}else return new Uint8Array(o.slice(0,r))}finally{a.destroy()}},wu=class{constructor(e){this.backend=e,this.storageCache=new Map,this.freeBuffers=new Map,this.freeUniformBuffers=new Map,this.buffersPending=[],this.capturedPendingBuffers=new Map;for(let[t]of dn)Vr.push(t),this.freeBuffers.set(t,[]),this.freeUniformBuffers.set(t,[]);this.sessionCount=0}upload(e,t){let r=t.buffer,i=t.byteOffset,n=t.byteLength,a=Fr(n),s=this.storageCache.get(e);if(!s)throw new Error("gpu data for uploading does not exist");if(Number(s.originalSize)!==n)throw new Error(`inconsistent data size. gpu data size=${s.originalSize}, data size=${n}`);let o=this.backend.device.createBuffer({mappedAtCreation:!0,size:a,usage:GPUBufferUsage.MAP_WRITE|GPUBufferUsage.COPY_SRC}),l=o.getMappedRange();new Uint8Array(l).set(new Uint8Array(r,i,n)),o.unmap();let d=this.backend.device.createCommandEncoder();d.copyBufferToBuffer(o,0,s.gpuData.buffer,0,a),this.backend.device.queue.submit([d.finish()]),o.destroy(),ce("verbose",()=>`[WebGPU] GpuDataManager.upload(id=${e})`)}memcpy(e,t){let r=this.storageCache.get(e);if(!r)throw new Error("source gpu data for memcpy does not exist");let i=this.storageCache.get(t);if(!i)throw new Error("destination gpu data for memcpy does not exist");if(r.originalSize!==i.originalSize)throw new Error("inconsistent source and destination gpu data size");let n=Fr(r.originalSize),a=this.backend.getCommandEncoder();this.backend.endComputePass(),a.copyBufferToBuffer(r.gpuData.buffer,0,i.gpuData.buffer,0,n)}registerExternalBuffer(e,t,r){let i;if(r){if(i=r[0],e===r[1])return ce("verbose",()=>`[WebGPU] GpuDataManager.registerExternalBuffer(size=${t}) => id=${i}, buffer is the same, skip.`),i;if(this.backend.capturedCommandList.has(this.backend.currentSessionId))throw new Error(`Registering a different external buffer under graph capture mode is not supported yet.
             Please use the previous external buffer!`)}else i=pn();return this.storageCache.set(i,{gpuData:{id:i,type:0,buffer:e},originalSize:t}),ce("verbose",()=>`[WebGPU] GpuDataManager.registerExternalBuffer(size=${t}) => id=${i}, registered.`),i}unregisterExternalBuffer(e){e!==void 0&&(this.storageCache.delete(e),ce("verbose",()=>`[WebGPU] GpuDataManager.unregisterExternalBuffer() => id=${e}`))}create(e,t=GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC|GPUBufferUsage.COPY_DST){let r=_u(e),i,n=(t&GPUBufferUsage.STORAGE)===GPUBufferUsage.STORAGE,a=(t&GPUBufferUsage.UNIFORM)===GPUBufferUsage.UNIFORM;if(n||a){let o=(n?this.freeBuffers:this.freeUniformBuffers).get(r);o?o.length>0?i=o.pop():i=this.backend.device.createBuffer({size:r,usage:t}):i=this.backend.device.createBuffer({size:r,usage:t})}else i=this.backend.device.createBuffer({size:r,usage:t});let s={id:pn(),type:0,buffer:i};return this.storageCache.set(s.id,{gpuData:s,originalSize:Number(e)}),ce("verbose",()=>`[WebGPU] GpuDataManager.create(size=${e}) => id=${s.id}`),s}get(e){return this.storageCache.get(e)?.gpuData}release(e){let t=typeof e=="bigint"?Number(e):e,r=this.storageCache.get(t);if(!r){if(this.storageCache.size===0)return 0;throw new Error("releasing data does not exist")}return ce("verbose",()=>`[WebGPU] GpuDataManager.release(id=${t}), gpuDataId=${r.gpuData.id}`),this.storageCache.delete(t),this.buffersPending.push(r.gpuData.buffer),r.originalSize}async download(e,t){let r=this.storageCache.get(Number(e));if(!r)throw new Error("data does not exist");await ra(this.backend,r.gpuData.buffer,r.originalSize,t)}refreshPendingBuffers(){if(this.buffersPending.length!==0)if(this.backend.sessionStatus==="default"){for(let e of this.buffersPending){let t=dn.get(e.size);if((e.usage&GPUBufferUsage.STORAGE)===GPUBufferUsage.STORAGE){let r=this.freeBuffers.get(e.size)||[];t===void 0||r.length>=t?e.destroy():r.push(e)}else if((e.usage&GPUBufferUsage.UNIFORM)===GPUBufferUsage.UNIFORM){let r=this.freeUniformBuffers.get(e.size)||[];t===void 0||r.length>=t?e.destroy():r.push(e)}else e.destroy()}this.buffersPending=[]}else{let e=this.capturedPendingBuffers.get(this.backend.currentSessionId);e||(e=[],this.capturedPendingBuffers.set(this.backend.currentSessionId,e));for(let t of this.buffersPending)e.push(t);this.buffersPending=[]}}dispose(){this.freeBuffers.forEach(e=>{e.forEach(t=>{t.destroy()})}),this.freeUniformBuffers.forEach(e=>{e.forEach(t=>{t.destroy()})}),this.storageCache.forEach(e=>{e.gpuData.buffer.destroy()}),this.capturedPendingBuffers.forEach(e=>{e.forEach(t=>{t.destroy()})}),this.storageCache=new Map,this.freeBuffers=new Map,this.freeUniformBuffers=new Map,this.capturedPendingBuffers=new Map}onCreateSession(){this.sessionCount+=1}onReleaseSession(e){let t=this.capturedPendingBuffers.get(e);t&&(t.forEach(r=>{r.destroy()}),this.capturedPendingBuffers.delete(e)),this.sessionCount-=1,this.sessionCount===0&&(ce("warning",()=>"[WebGPU] Clearing webgpu buffer cache"),this.storageCache.forEach(r=>{r.gpuData.buffer.destroy()}),this.storageCache=new Map)}},Dc=(...e)=>new wu(...e)}),$u,me,Ce=F(()=>{$u=class{constructor(e){Object.assign(this,e)}get cacheKey(){return this.key||(this.key=Object.getOwnPropertyNames(this).sort().map(e=>`${this[e]}`).join(";")),this.key}},me=e=>new $u(e)}),rr,Hr,Me,Be,re,Te,ia,Qt,kt,te,pr,U,ee,Pc,Ra,vu,Uc,ae=F(()=>{ie(),ne(),rr=64,Hr=(e,t)=>{if(t===3)throw new Error("vec3 has same alignment as vec4, use vec4 instead");switch(Number(e)){case 10:return t>1?`vec${t}<f16>`:"f16";case 1:return t>1?`vec${t}<f32>`:"f32";case 6:return t>1?`vec${t}<i32>`:"i32";case 12:return t>1?`vec${t}<u32>`:"u32";case 7:if(t>1)throw new Error("currently not supported vecX of uint64 yet");return["vec2<u32>","i32"];case 13:if(t>1)throw new Error("currently not supported vecX of uint64 yet");return["vec2<u32>","u32"];case 9:if(t!==4)throw new Error("bool must be vec4");return["u32","vec4<bool>"];case 22:return"i32";case 21:return"u32";default:throw new Error(`Unknown data type: ${e}`)}},Me=(e,t=1)=>{let r=Hr(e,t);return typeof r=="string"?r:r[0]},Be=(e,t=1)=>{let r=Hr(e,t);return typeof r=="string"?r:r[1]},re=(...e)=>{let t=[];return e.forEach(r=>{r.length!==0&&t.push({type:12,data:r},{type:12,data:N.computeStrides(r)})}),t},Te=e=>e%4===0?4:e%2===0?2:1,ia=(e="f32",t,r="0")=>!t||t===1?`${e}(${r})`:`vec${t}<${e}>(${r})`,Qt=(e,t,r)=>e==="f32"?r:t===1?`f32(${r})`:`vec${t}<f32>(${r})`,kt=(e,t)=>t===4?`(${e}.x + ${e}.y + ${e}.z + ${e}.w)`:t===2?`(${e}.x + ${e}.y)`:t===3?`(${e}.x + ${e}.y + ${e}.z)`:e,te=(e,t,r,i)=>e.startsWith("uniforms.")&&r>4?typeof t=="string"?i==="f16"?`${e}[(${t}) / 8][(${t}) % 8 / 4][(${t}) % 8 % 4]`:`${e}[(${t}) / 4][(${t}) % 4]`:i==="f16"?`${e}[${Math.floor(t/8)}][${Math.floor(t%8/4)}][${t%8%4}]`:`${e}[${Math.floor(t/4)}][${t%4}]`:r>1?`${e}[${t}]`:e,pr=(e,t,r,i,n)=>{let a=typeof r=="number",s=a?r:r.length,o=[...new Array(s).keys()],l=s<2?"u32":s<=4?`vec${s}<u32>`:`array<u32, ${s}>`,d=Hr(t,n),p=typeof d=="string"?d:d[1],h=typeof d=="string"?d:d[0],f={indices:l,value:p,storage:h,tensor:t},g=W=>typeof W=="string"?W:`${W}u`,m={offsetToIndices:!1,indicesToOffset:!1,broadcastedIndicesToOffset:!1,set:!1,setByIndices:!1,get:!1,getByIndices:!1},b=a?"uniforms.":"",v=`${b}${e}_shape`,$=`${b}${e}_strides`,w="";for(let W=0;W<s-1;W++)w+=`
    let dim${W} = current / ${te($,W,s)};
    let rest${W} = current % ${te($,W,s)};
    indices[${W}] = dim${W};
    current = rest${W};
    `;w+=`indices[${s-1}] = current;`;let S=s<2?"":`
  fn o2i_${e}(offset: u32) -> ${f.indices} {
    var indices: ${f.indices};
    var current = offset;
    ${w}
    return indices;
  }`,x=W=>(m.offsetToIndices=!0,s<2?W:`o2i_${e}(${W})`),I=[];if(s>=2)for(let W=s-1;W>=0;W--)I.push(`${te($,W,s)} * (indices[${W}])`);let C=s<2?"":`
  fn i2o_${e}(indices: ${f.indices}) -> u32 {
    return ${I.join("+")};
  }`,z=W=>(m.indicesToOffset=!0,s<2?W:`i2o_${e}(${W})`),k=(...W)=>s===0?"0u":`${f.indices}(${W.map(g).join(",")})`,D=(W,J)=>s<2?`${W}`:`${te(W,J,s)}`,L=(W,J,Q)=>s<2?`${W}=${Q};`:`${te(W,J,s)}=${Q};`,j={},O=(W,J)=>{m.broadcastedIndicesToOffset=!0;let Q=`${J.name}broadcastedIndicesTo${e}Offset`;if(Q in j)return`${Q}(${W})`;let R=[];for(let se=s-1;se>=0;se--){let Ie=J.indicesGet("outputIndices",se+J.rank-s);R.push(`${D($,se)} * (${Ie} % ${D(v,se)})`)}return j[Q]=`fn ${Q}(outputIndices: ${J.type.indices}) -> u32 {
             return ${R.length>0?R.join("+"):"0u"};
           }`,`${Q}(${W})`},G=(W,J)=>(()=>{if(f.storage===f.value)return`${e}[${W}]=${J};`;if(f.storage==="vec2<u32>"&&f.value==="i32")return`${e}[${W}]=vec2<u32>(u32(${J}), select(0u, 0xFFFFFFFFu, ${J} < 0));`;if(f.storage==="vec2<u32>"&&f.value==="u32")return`${e}[${W}]=vec2<u32>(u32(${J}), 0u);`;if(f.storage==="u32"&&f.value==="vec4<bool>")return`${e}[${W}]=dot(vec4<u32>(0x1, 0x100, 0x10000, 0x1000000), vec4<u32>(${J}));`;throw new Error(`not supported combination of storage type ${f.storage} and value type ${f.value} yet`)})(),M=W=>(()=>{if(f.storage===f.value)return`${e}[${W}]`;if(f.storage==="vec2<u32>"&&f.value==="i32")return`i32(${e}[${W}].x)`;if(f.storage==="vec2<u32>"&&f.value==="u32")return`u32(${e}[${W}].x)`;if(f.storage==="u32"&&f.value==="vec4<bool>")return`vec4<bool>(bool(${e}[${W}] & 0xFFu), bool(${e}[${W}] & 0xFF00u), bool(${e}[${W}] & 0xFF0000u), bool(${e}[${W}] & 0xFF000000u))`;throw new Error(`not supported combination of storage type ${f.storage} and value type ${f.value} yet`)})(),B=s<2?"":`
  fn get_${e}ByIndices(indices: ${f.indices}) -> ${p} {
    return ${M(`i2o_${e}(indices)`)};
  }`,V=s<2?"":(()=>{let W=o.map(Q=>`d${Q}: u32`).join(", "),J=o.map(Q=>`d${Q}`).join(", ");return`
  fn get_${e}(${W}) -> ${p} {
    return get_${e}ByIndices(${k(J)});
  }`})(),Y=(...W)=>{if(W.length!==s)throw new Error(`indices length must be ${s}`);let J=W.map(g).join(",");return s===0?M("0u"):s===1?M(J[0]):(m.get=!0,m.getByIndices=!0,m.indicesToOffset=!0,`get_${e}(${J})`)},q=W=>s<2?M(W):(m.getByIndices=!0,m.indicesToOffset=!0,`get_${e}ByIndices(${W})`),H=s<2?"":`
  fn set_${e}ByIndices(indices: ${f.indices}, value: ${p}) {
    ${G(`i2o_${e}(indices)`,"value")}
  }`,X=s<2?"":(()=>{let W=o.map(Q=>`d${Q}: u32`).join(", "),J=o.map(Q=>`d${Q}`).join(", ");return`
  fn set_${e}(${W}, value: ${p}) {
    set_${e}ByIndices(${k(J)}, value);
  }`})();return{impl:()=>{let W=[],J=!1;return m.offsetToIndices&&(W.push(S),J=!0),m.indicesToOffset&&(W.push(C),J=!0),m.broadcastedIndicesToOffset&&(Object.values(j).forEach(Q=>W.push(Q)),J=!0),m.set&&(W.push(X),J=!0),m.setByIndices&&(W.push(H),J=!0),m.get&&(W.push(V),J=!0),m.getByIndices&&(W.push(B),J=!0),!a&&J&&W.unshift(`const ${v} = ${f.indices}(${r.join(",")});`,`const ${$} = ${f.indices}(${N.computeStrides(r).join(",")});`),W.join(`
`)},type:f,offsetToIndices:x,indicesToOffset:z,broadcastedIndicesToOffset:O,indices:k,indicesGet:D,indicesSet:L,set:(...W)=>{if(W.length!==s+1)throw new Error(`indices length must be ${s}`);let J=W[s];if(typeof J!="string")throw new Error("value must be string");let Q=W.slice(0,s).map(g).join(",");return s===0?G("0u",J):s===1?G(Q[0],J):(m.set=!0,m.setByIndices=!0,m.indicesToOffset=!0,`set_${e}(${Q}, ${J})`)},setByOffset:G,setByIndices:(W,J)=>s<2?G(W,J):(m.setByIndices=!0,m.indicesToOffset=!0,`set_${e}ByIndices(${W}, ${J});`),get:Y,getByOffset:M,getByIndices:q,usage:i,name:e,strides:$,shape:v,rank:s}},U=(e,t,r,i=1)=>pr(e,t,r,"input",i),ee=(e,t,r,i=1)=>pr(e,t,r,"output",i),Pc=(e,t,r)=>pr(e,t,r,"atomicOutput",1),Ra=(e,t,r,i=1)=>pr(e,t,r,"internal",i),vu=class{constructor(e,t){this.normalizedDispatchGroup=e,this.limits=t,this.internalVariables=[],this.variables=[],this.uniforms=[],this.variableIndex=0}guardAgainstOutOfBoundsWorkgroupSizes(e){return`if (global_idx >= ${typeof e=="number"?`${e}u`:e}) { return; }`}mainStart(e=rr){let t=typeof e=="number"?e:e[0],r=typeof e=="number"?1:e[1],i=typeof e=="number"?1:e[2];if(t>this.limits.maxComputeWorkgroupSizeX||r>this.limits.maxComputeWorkgroupSizeY||i>this.limits.maxComputeWorkgroupSizeZ)throw new Error(`workgroup size [${t}, ${r}, ${i}] exceeds the maximum workgroup size [${this.limits.maxComputeWorkgroupSizeX}, ${this.limits.maxComputeWorkgroupSizeY}, ${this.limits.maxComputeWorkgroupSizeZ}].`);if(t*r*i>this.limits.maxComputeInvocationsPerWorkgroup)throw new Error(`workgroup size [${t}, ${r}, ${i}] exceeds the maximum workgroup invocations ${this.limits.maxComputeInvocationsPerWorkgroup}.`);let n=this.normalizedDispatchGroup[1]===1&&this.normalizedDispatchGroup[2]===1,a=n?`@builtin(global_invocation_id) global_id : vec3<u32>,
    @builtin(workgroup_id) workgroup_id : vec3<u32>,
    @builtin(local_invocation_index) local_idx : u32,
    @builtin(local_invocation_id) local_id : vec3<u32>`:`@builtin(global_invocation_id) global_id : vec3<u32>,
                                             @builtin(local_invocation_id) local_id : vec3<u32>,
    @builtin(local_invocation_index) local_idx : u32,
    @builtin(workgroup_id) workgroup_id : vec3<u32>,
    @builtin(num_workgroups) num_workgroups : vec3<u32>`,s=n?`let global_idx = global_id.x;
         let workgroup_index = workgroup_id.x;`:`let workgroup_index = workgroup_id.z * num_workgroups[0] * num_workgroups[1] +
             workgroup_id.y * num_workgroups[0] + workgroup_id.x;
         let global_idx = workgroup_index * ${t*r*i}u + local_idx;`;return`@compute @workgroup_size(${t}, ${r}, ${i})
  fn main(${a}) {
    ${s}
  `}appendVariableUniforms(e){e.rank!==0&&(e.shape.startsWith("uniforms.")&&this.uniforms.push({name:e.shape.replace("uniforms.",""),type:"u32",length:e.rank}),e.strides.startsWith("uniforms.")&&this.uniforms.push({name:e.strides.replace("uniforms.",""),type:"u32",length:e.rank}))}declareVariable(e,t){if(e.usage==="internal")throw new Error("cannot use internal variable with declareVariable(). use registerInternalVariables() instead.");this.variables.push(e),this.appendVariableUniforms(e);let r=e.usage==="input"?"read":"read_write",i=e.usage==="atomicOutput"?"atomic<i32>":e.type.storage;return`@group(0) @binding(${t}) var<storage, ${r}> ${e.name}: array<${i}>;`}declareVariables(...e){return e.map(t=>this.declareVariable(t,this.variableIndex++)).join(`
`)}registerInternalVariable(e){if(e.usage!=="internal")throw new Error("cannot use input or output variable with registerInternalVariable(). use declareVariables() instead.");this.internalVariables.push(e),this.appendVariableUniforms(e)}registerInternalVariables(...e){return e.forEach(t=>this.registerInternalVariable(t)),this}registerUniform(e,t,r=1){return this.uniforms.push({name:e,type:t,length:r}),this}registerUniforms(e){return this.uniforms=this.uniforms.concat(e),this}uniformDeclaration(){if(this.uniforms.length===0)return"";let e=[];for(let{name:t,type:r,length:i}of this.uniforms)if(i&&i>4)r==="f16"?e.push(`@align(16) ${t}:array<mat2x4<${r}>, ${Math.ceil(i/8)}>`):e.push(`${t}:array<vec4<${r}>, ${Math.ceil(i/4)}>`);else{let n=i==null||i===1?r:`vec${i}<${r}>`;e.push(`${t}:${n}`)}return`
      struct Uniforms { ${e.join(", ")} };
      @group(0) @binding(${this.variableIndex}) var<uniform> uniforms: Uniforms;`}get additionalImplementations(){return this.uniformDeclaration()+this.variables.map(e=>e.impl()).join(`
`)+this.internalVariables.map(e=>e.impl()).join(`
`)}get variablesInfo(){if(this.uniforms.length===0)return;let e=t=>[12,10,1,6][["u32","f16","f32","i32"].indexOf(t)];return this.uniforms.map(t=>[e(t.type),t.length??1])}},Uc=(e,t)=>new vu(e,t)}),xu,cn,Su,ku,Tu,Iu,Ge,Lc,qc,Tt=F(()=>{ie(),ne(),Ce(),ae(),xu=(e,t)=>{if(!e||e.length!==1)throw new Error("Transpose requires 1 input.");if(t.length!==0&&t.length!==e[0].dims.length)throw new Error(`perm size ${t.length} does not match input rank ${e[0].dims.length}`)},cn=(e,t)=>t.length!==0?t:[...new Array(e).keys()].reverse(),Su=(e,t)=>N.sortBasedOnPerm(e,cn(e.length,t)),ku=(e,t,r,i)=>{let n=`fn perm(i: ${i.type.indices}) -> ${r.type.indices} {
    var a: ${r.type.indices};`;for(let a=0;a<t;++a)n+=`a[${e[a]}]=i[${a}];`;return n+="return a;}"},Tu=(e,t)=>{let r=[],i=[];for(let n=0;n<e.length;++n)e[n]!==1&&r.push(e[n]),e[t[n]]!==1&&i.push(t[n]);return{newShape:r,newPerm:i}},Iu=(e,t)=>{let r=0;for(let i=0;i<e.length;++i)if(t[e[i]]!==1){if(e[i]<r)return!1;r=e[i]}return!0},Ge=(e,t)=>{let r=e.dataType,i=e.dims.length,n=cn(i,t),a=Su(e.dims,n),s=e.dims,o=a,l=i<2||Iu(n,e.dims),d;if(l)return d=m=>{let b=U("input",r,s,4),v=ee("output",r,o,4);return`
  ${m.registerUniform("output_size","u32").declareVariables(b,v)}
  ${m.mainStart()}
    ${m.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
    output[global_idx] = input[global_idx];
  }`},{name:"TransposeCopy",shaderCache:{inputDependencies:["type"]},getRunData:()=>{let m=N.size(a);return{outputs:[{dims:a,dataType:e.dataType}],dispatchGroup:{x:Math.ceil(m/64/4)},programUniforms:[{type:12,data:Math.ceil(m/4)}]}},getShaderSource:d};let{newShape:p,newPerm:h}=Tu(e.dims,n),f=N.areEqual(h,[2,3,1]),g=N.areEqual(h,[3,1,2]);if(p.length===2||f||g){s=f?[p[0],p[1]*p[2]]:g?[p[0]*p[1],p[2]]:p,o=[s[1],s[0]];let m=16;return d=b=>{let v=U("a",r,s.length),$=ee("output",r,o.length);return`
  ${b.registerUniform("output_size","u32").declareVariables(v,$)}
  var<workgroup> tile : array<array<${$.type.value}, ${m+1}>, ${m}>;
  ${b.mainStart([m,m,1])}
    let stride = (uniforms.output_shape[1] - 1) / ${m} + 1;
    let workgroup_id_x = workgroup_index % stride;
    let workgroup_id_y = workgroup_index / stride;
    let input_col = workgroup_id_y * ${m}u + local_id.x;
    let input_row = workgroup_id_x * ${m}u + local_id.y;
    if (input_row < uniforms.a_shape[0] && input_col < uniforms.a_shape[1]) {
      tile[local_id.y][local_id.x] = ${v.getByIndices(`${v.type.indices}(input_row, input_col)`)};
    }
    workgroupBarrier();

    let output_col = workgroup_id_x * ${m}u + local_id.x;
    let output_row = workgroup_id_y * ${m}u + local_id.y;
    if (output_row < uniforms.output_shape[0] && output_col < uniforms.output_shape[1]) {
      ${$.setByIndices(`${$.type.indices}(output_row, output_col)`,"tile[local_id.x][local_id.y]")}
    }
  }`},{name:"TransposeShared",shaderCache:{inputDependencies:["type"]},getRunData:()=>{let b=N.size(a);return{outputs:[{dims:a,dataType:e.dataType}],dispatchGroup:{x:Math.ceil(o[1]/m),y:Math.ceil(o[0]/m)},programUniforms:[{type:12,data:b},...re(s,o)]}},getShaderSource:d}}return d=m=>{let b=U("a",r,s.length),v=ee("output",r,o.length);return`
  ${m.registerUniform("output_size","u32").declareVariables(b,v)}

  ${ku(n,i,b,v)}

  ${m.mainStart()}
    ${m.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}

    let indices = ${v.offsetToIndices("global_idx")};
    let aIndices = perm(indices);

    ${v.setByOffset("global_idx",b.getByIndices("aIndices"))}
  }`},{name:"Transpose",shaderCache:{hint:`${t}`,inputDependencies:["rank"]},getRunData:()=>{let m=N.size(a);return{outputs:[{dims:a,dataType:e.dataType}],dispatchGroup:{x:Math.ceil(m/64)},programUniforms:[{type:12,data:m},...re(s,o)]}},getShaderSource:d}},Lc=(e,t)=>{xu(e.inputs,t.perm),e.compute(Ge(e.inputs[0],t.perm))},qc=e=>me({perm:e.perm})}),Eu,Cu,zu,Au,Mu,Ou,Ru,Nu,Bu,Du,Ze,Wc,Gc,Vc,Fc,Hc,jc,Kc,Xc,Zc,Yc,Zy=F(()=>{ie(),ne(),ae(),Na(),Tt(),Eu={max:"select(bestValue, candidate, candidate > bestValue)",min:"select(bestValue, candidate, candidate < bestValue)",mean:"bestValue + candidate",sum:"bestValue + candidate",prod:"bestValue * candidate",sumSquare:"bestValue + candidate * candidate",logSumExp:"bestValue + exp(candidate)",l1:"bestValue + abs(candidate)",l2:"bestValue + candidate * candidate",logSum:"bestValue + candidate"},Cu={max:"select(bestValue, candidate, candidate > bestValue)",min:"select(bestValue, candidate, candidate < bestValue)",mean:"bestValue + candidate",sum:"bestValue + candidate",prod:"bestValue * candidate",sumSquare:"bestValue + candidate",logSumExp:"bestValue + candidate",l1:"bestValue + candidate",l2:"bestValue + candidate",logSum:"bestValue + candidate"},zu={max:"_A[offset]",min:"_A[offset]",mean:"0",sum:"0",prod:"1",sumSquare:"0",logSumExp:"0",l1:"0",l2:"0",logSum:"0"},Au={max:"bestValue",min:"bestValue",sum:"bestValue",prod:"bestValue",sumSquare:"bestValue",logSumExp:"log(bestValue)",l1:"bestValue",l2:"sqrt(bestValue)",logSum:"log(bestValue)"},Mu=(e,t)=>{let r=[];for(let i=t-e;i<t;++i)r.push(i);return r},Ou=(e,t)=>{let r=[],i=e.length;for(let a=0;a<i;a++)t.indexOf(a)===-1&&r.push(e[a]);let n=t.map(a=>e[a]);return[r,n]},Ru=(e,t)=>{let r=e.length+t.length,i=[],n=0;for(let a=0;a<r;a++)t.indexOf(a)===-1?i.push(e[n++]):i.push(1);return i},Nu=(e,t)=>{for(let r=0;r<e.length;++r)if(e[e.length-r-1]!==t-1-r)return!1;return!0},Bu=(e,t)=>{let r=[];if(!Nu(e,t)){for(let i=0;i<t;++i)e.indexOf(i)===-1&&r.push(i);e.forEach(i=>r.push(i))}return r},Du=(e,t,r,i,n,a,s)=>{let o=r[0].dims,l=N.size(a),d=N.size(s),p=U("_A",r[0].dataType,o),h=ee("output",n,a),f=64;l===1&&(f=256);let g=`
          var<workgroup> aBestValues : array<f32, ${f}>;
       `,m=b=>`
        ${b.registerUniform("reduceSize","u32").declareVariables(p,h)}
        ${g}
        fn DIV_CEIL(a : u32, b : u32) -> u32 {
          return ((a - 1u) / b + 1u);
         }
         ${b.mainStart(f)}

          let outputIndex = global_idx / ${f};
          let offset = outputIndex * uniforms.reduceSize;

          var bestValue = f32(${zu[i]});
          let Length = uniforms.reduceSize;
          for (var k = local_idx; k < Length; k = k + ${f}) {
           let candidate = f32(${p.getByOffset("offset + k")});
           bestValue = ${Eu[i]};
          }
          aBestValues[local_idx] = bestValue;
          workgroupBarrier();

         var reduceSize = min(Length, ${f}u);
         for (var currentSize = reduceSize / 2u; reduceSize > 1u;
             currentSize = reduceSize / 2u) {
           let interval = DIV_CEIL(reduceSize, 2u);
           if (local_idx < currentSize) {
            let candidate = aBestValues[local_idx + interval];
            bestValue = ${Cu[i]};
            aBestValues[local_idx] = bestValue;
           }
           reduceSize = interval;
           workgroupBarrier();
         }

         if (local_idx == 0u) {
          ${h.setByOffset("outputIndex",`${i==="mean"?`${h.type.storage}(bestValue / f32(uniforms.reduceSize))`:`${h.type.storage}(${Au[i]})`}`)};
         }
        }`;return{name:e,shaderCache:{hint:`${t};${f}`,inputDependencies:["type"]},getShaderSource:m,getRunData:()=>({outputs:[{dims:a,dataType:n}],dispatchGroup:{x:l},programUniforms:[{type:12,data:d}]})}},Ze=(e,t,r,i)=>{let n=e.inputs.length===1?r:na(e.inputs,r),a=n.axes;a.length===0&&!n.noopWithEmptyAxes&&(a=e.inputs[0].dims.map((g,m)=>m));let s=N.normalizeAxes(a,e.inputs[0].dims.length),o=s,l=e.inputs[0],d=Bu(o,e.inputs[0].dims.length);d.length>0&&(l=e.compute(Ge(e.inputs[0],d),{inputs:[0],outputs:[-1]})[0],o=Mu(o.length,l.dims.length));let[p,h]=Ou(l.dims,o),f=p;n.keepDims&&(f=Ru(p,s)),e.compute(Du(t,n.cacheKey,[l],i,e.inputs[0].dataType,f,h),{inputs:[l]})},Wc=(e,t)=>{Ze(e,"ReduceMeanShared",t,"mean")},Gc=(e,t)=>{Ze(e,"ReduceL1Shared",t,"l1")},Vc=(e,t)=>{Ze(e,"ReduceL2Shared",t,"l2")},Fc=(e,t)=>{Ze(e,"ReduceLogSumExpShared",t,"logSumExp")},Hc=(e,t)=>{Ze(e,"ReduceMaxShared",t,"max")},jc=(e,t)=>{Ze(e,"ReduceMinShared",t,"min")},Kc=(e,t)=>{Ze(e,"ReduceProdShared",t,"prod")},Xc=(e,t)=>{Ze(e,"ReduceSumShared",t,"sum")},Zc=(e,t)=>{Ze(e,"ReduceSumSquareShared",t,"sumSquare")},Yc=(e,t)=>{Ze(e,"ReduceLogSumShared",t,"logSum")}}),Ye,Pu,pi,na,Qe,Uu,Lu,qu,Wu,Gu,Vu,Fu,Hu,ju,Ku,Je,Qc,Jc,eh,th,rh,ih,nh,ah,sh,oh,Na=F(()=>{ie(),ne(),Ce(),ae(),Zy(),Ye=e=>{if(!e||e.length===0||e.length>2)throw new Error("Reduce op requires 1 or 2 inputs.");if(e.length===2&&e[1].dims.length!==1)throw new Error("Invalid axes input dims.")},Pu=e=>["","",`var value = ${e.getByIndices("input_indices")};`,""],pi=(e,t,r,i,n,a,s=!1,o=!1)=>{let l=[],d=r[0].dims,p=d.length,h=N.normalizeAxes(n,p),f=!o&&h.length===0;d.forEach((b,v)=>{f||h.indexOf(v)>=0?s&&l.push(1):l.push(b)});let g=l.length,m=N.size(l);return{name:e,shaderCache:t,getShaderSource:b=>{let v=[],$=U("_A",r[0].dataType,p),w=ee("output",a,g),S=i($,w,h),x=S[2];for(let I=0,C=0;I<p;I++)f||h.indexOf(I)>=0?(s&&C++,x=`for(var j${I}: u32 = 0; j${I} < ${d[I]}; j${I}++) {
                  ${S[2].includes("last_index")?`let last_index = j${I};`:""}
                  ${$.indicesSet("input_indices",I,`j${I}`)}
                  ${x}
                }`):(v.push(`${$.indicesSet("input_indices",I,w.indicesGet("output_indices",C))};`),C++);return`

        ${b.registerUniform("output_size","u32").declareVariables($,w)}

        ${b.mainStart()}
          ${b.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
          var input_indices: ${$.type.indices};
          let output_indices = ${w.offsetToIndices("global_idx")};

          ${v.join(`
`)}
          ${S[0]}       // init ops for reduce max/min
          ${S[1]}
          ${x}
          ${S[3]}
          ${S.length===4?w.setByOffset("global_idx","value"):S.slice(4).join(`
`)}
        }`},getRunData:()=>({outputs:[{dims:l,dataType:a}],dispatchGroup:{x:Math.ceil(m/64)},programUniforms:[{type:12,data:m},...re(d,l)]})}},na=(e,t)=>{let r=[];return e[1].dims[0]>0&&e[1].getBigInt64Array().forEach(i=>r.push(Number(i))),me({axes:r,keepDims:t.keepDims,noopWithEmptyAxes:t.noopWithEmptyAxes})},Qe=(e,t,r,i)=>{let n=e.inputs,a=n.length===1?r:na(n,r);e.compute(pi(t,{hint:a.cacheKey,inputDependencies:["rank"]},[n[0]],a.noopWithEmptyAxes&&a.axes.length===0?Pu:i,a.axes,n[0].dataType,a.keepDims,a.noopWithEmptyAxes),{inputs:[0]})},Uu=(e,t)=>{Ye(e.inputs),Qe(e,"ReduceLogSum",t,(r,i)=>[`var value = ${i.type.storage}(0);`,"",`value += ${r.getByIndices("input_indices")};`,"value = log(value);"])},Lu=(e,t)=>{Ye(e.inputs),Qe(e,"ReduceL1",t,(r,i)=>[`var value = ${i.type.storage}(0);`,"",`value += abs(${r.getByIndices("input_indices")});`,""])},qu=(e,t)=>{Ye(e.inputs),Qe(e,"ReduceL2",t,(r,i)=>[`var t = ${i.type.value}(0); var value = ${i.type.value}(0);`,"",`t = ${r.getByIndices("input_indices")}; value += (t * t);`,"value = sqrt(value);"])},Wu=(e,t)=>{Ye(e.inputs),Qe(e,"ReduceLogSumExp",t,(r,i)=>[`var value = ${i.type.storage}(0);`,"",`value += exp(${r.getByIndices("input_indices")});`,"value = log(value);"])},Gu=(e,t)=>{Ye(e.inputs),Qe(e,"ReduceMax",t,(r,i,n)=>{let a=[];for(let s=0;s<r.rank;s++)(n.indexOf(s)>=0||n.length===0)&&a.push(r.indicesSet("input_indices",s,0));return[`${a.join(`
`)}`,`var value = ${r.getByIndices("input_indices")};`,`value = max(value, ${r.getByIndices("input_indices")});`,""]})},Vu=(e,t)=>{Ye(e.inputs),Qe(e,"ReduceMean",t,(r,i,n)=>{let a=1;for(let s=0;s<r.rank;s++)(n.indexOf(s)>=0||n.length===0)&&(a*=e.inputs[0].dims[s]);return["var sum = f32(0);","",`sum += f32(${r.getByIndices("input_indices")});`,`let value = ${i.type.value}(sum / ${a});`]})},Fu=(e,t)=>{Ye(e.inputs),Qe(e,"ReduceMin",t,(r,i,n)=>{let a=[];for(let s=0;s<r.rank;s++)(n.indexOf(s)>=0||n.length===0)&&a.push(`input_indices[${s}] = 0;`);return[`${a.join(`
`)}`,`var value = ${r.getByIndices("input_indices")};`,`value = min(value, ${r.getByIndices("input_indices")});`,""]})},Hu=(e,t)=>{Ye(e.inputs),Qe(e,"ReduceProd",t,(r,i)=>[`var value = ${i.type.storage}(1);`,"",`value *= ${r.getByIndices("input_indices")};`,""])},ju=(e,t)=>{Ye(e.inputs),Qe(e,"ReduceSum",t,(r,i)=>[`var value = ${i.type.storage}(0);`,"",`value += ${r.getByIndices("input_indices")};`,""])},Ku=(e,t)=>{Ye(e.inputs),Qe(e,"ReduceSumSquare",t,(r,i)=>[`var t = ${i.type.value}(0); var value = ${i.type.value}(0);`,"",`t = ${r.getByIndices("input_indices")}; value += t * t;`,""])},Je=(e,t,r)=>{if(t.length===0)return r;let i=1,n=1;for(let a=0;a<t.length;a++)t.indexOf(a)===-1?i*=e[a]:n*=e[a];return n<32&&i>1024},Qc=(e,t)=>{Je(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?Vu(e,t):Wc(e,t)},Jc=(e,t)=>{Je(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?Lu(e,t):Gc(e,t)},eh=(e,t)=>{Je(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?qu(e,t):Vc(e,t)},th=(e,t)=>{Je(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?Wu(e,t):Fc(e,t)},rh=(e,t)=>{Je(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?Gu(e,t):Hc(e,t)},ih=(e,t)=>{Je(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?Fu(e,t):jc(e,t)},nh=(e,t)=>{Je(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?Hu(e,t):Kc(e,t)},ah=(e,t)=>{Je(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?ju(e,t):Xc(e,t)},sh=(e,t)=>{Je(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?Ku(e,t):Zc(e,t)},oh=(e,t)=>{Je(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?Uu(e,t):Yc(e,t)}}),hn,uh,lh,aa,Yy=F(()=>{ie(),Ce(),Na(),hn=e=>{if(!e||e.length===0||e.length>2)throw new Error("ArgMinMaxOp op requires 1 or 2 inputs.");if(e[0].dataType!==1)throw new Error("Invalid input type.")},uh=(e,t)=>{hn(e.inputs);let r=(i,n,a)=>{let s=[];for(let o=0;o<i.rank;o++)(a.indexOf(o)>=0||a.length===0)&&s.push(`input_indices[${o}] = 0;`);return[`${s.join(`
`)}`,`var value = ${i.getByIndices("input_indices")};
var best_index : i32 = 0;`,`if (${i.getByIndices("input_indices")} ${t.selectLastIndex>0?"<=":"<"} value) {
         value = ${i.getByIndices("input_indices")};
         best_index = i32(last_index);
       }`,"",n.setByOffset("global_idx","best_index")]};e.compute(pi("ArgMin",{hint:t.cacheKey,inputDependencies:["rank"]},[e.inputs[0]],r,[t.axis],7,t.keepDims),{inputs:[0]})},lh=(e,t)=>{hn(e.inputs);let r=(i,n,a)=>{let s=[];for(let o=0;o<i.rank;o++)(a.indexOf(o)>=0||a.length===0)&&s.push(`input_indices[${o}] = 0;`);return[`${s.join(`
`)}`,`var value = ${i.getByIndices("input_indices")};
var best_index : i32 = 0;`,`if (${i.getByIndices("input_indices")} ${t.selectLastIndex>0?">=":">"} value) {
         value = ${i.getByIndices("input_indices")};
         best_index = i32(last_index);
       }`,"",n.setByOffset("global_idx","best_index")]};e.compute(pi("argMax",{hint:t.cacheKey,inputDependencies:["rank"]},[e.inputs[0]],r,[t.axis],7,t.keepDims),{inputs:[0]})},aa=e=>me(e)}),Xu,jr,Zu,Yu,Qu,Tr,Ju,dh,Ba=F(()=>{ie(),ne(),Oa(),ae(),Xu=(e,t)=>{let r=e[0],i=e[1],n=e[2],a=e[3],s=e[4],o=e[5];if(s&&o)throw new Error("Attention cannot have both past and attention_bias");if(r.dims.length!==3)throw new Error('Input "input" must have 3 dimensions');let l=r.dims[0],d=r.dims[1],p=r.dims[2];if(n.dims.length!==1)throw new Error('Input "bias" is expected to have 1 dimensions');if(i.dims.length!==2)throw new Error('Input "weights" is expected to have 2 dimensions');if(i.dims[0]!==p)throw new Error("Input 1 dimension 0 should have same length as dimension 2 of input 0");if(n.dims[0]!==i.dims[1])throw new Error('Input "bias" dimension 0 should have same length as dimension 1 of input "weights"');let h=n.dims[0]/3,f=h,g=f;if(t.qkvHiddenSizes.length>0){if(t.qkvHiddenSizes.length!==3)throw new Error("qkv_hidden_sizes attribute should have 3 elements");for(let S of t.qkvHiddenSizes)if(S%t.numHeads!==0)throw new Error("qkv_hidden_sizes should be divisible by num_heads");h=t.qkvHiddenSizes[0],f=t.qkvHiddenSizes[1],g=t.qkvHiddenSizes[2]}let m=d;if(h!==f)throw new Error("qkv_hidden_sizes first element should be same as the second");if(n.dims[0]!==h+f+g)throw new Error('Input "bias" dimension 0 should have same length as sum of Q/K/V hidden sizes');let b=0;if(s){if(f!==g)throw new Error('Input "past" expect k_hidden_size == v_hidden_size');if(s.dims.length!==5)throw new Error('Input "past" must have 5 dimensions');if(s.dims[0]!==2)throw new Error('Input "past" first dimension must be 2');if(s.dims[1]!==l)throw new Error('Input "past" second dimension must be batch_size');if(s.dims[2]!==t.numHeads)throw new Error('Input "past" third dimension must be num_heads');if(s.dims[4]!==f/t.numHeads)throw new Error('Input "past" fifth dimension must be k_hidden_size / num_heads');t.pastPresentShareBuffer||(b=s.dims[3])}let v=m+b,$=-1,w=0;if(a)throw new Error("Mask not supported");if(s)throw new Error("past is not supported");if(o){if(o.dims.length!==4)throw new Error('Input "attention_bias" must have 4 dimensions');if(o.dims[0]!==l||o.dims[1]!==t.numHeads||o.dims[2]!==d||o.dims[3]!==v)throw new Error('Expect "attention_bias" shape (batch_size, num_heads, sequence_length, total_sequence_length)')}return{batchSize:l,sequenceLength:d,pastSequenceLength:b,kvSequenceLength:m,totalSequenceLength:v,maxSequenceLength:$,inputHiddenSize:p,hiddenSize:h,vHiddenSize:g,headSize:Math.floor(h/t.numHeads),vHeadSize:Math.floor(g/t.numHeads),numHeads:t.numHeads,isUnidirectional:!1,pastPresentShareBuffer:!1,maskFilterValue:t.maskFilterValue,maskType:w,scale:t.scale,broadcastResPosBias:!1,passPastInKv:!1,qkvFormat:1}},jr=(e,t,r)=>t&&e?`
      let total_sequence_length_input = u32(${t.getByOffset("0")});
      let present_sequence_length = max(total_sequence_length_input, uniforms.past_sequence_length);
      let is_subsequent_prompt: bool = sequence_length > 1 && sequence_length != total_sequence_length_input;
      let is_first_prompt: bool = is_subsequent_prompt == false && sequence_length == total_sequence_length_input;
      total_sequence_length = u32(${e?.getByOffset("batchIdx")}) + 1;
      var past_sequence_length: u32 = 0;
      if (is_first_prompt == false) {
        past_sequence_length = total_sequence_length - sequence_length;
      }
       `:`
    ${r?"let past_sequence_length = uniforms.past_sequence_length":""};
    let present_sequence_length = total_sequence_length;
    `,Zu=(e,t,r,i,n,a,s,o)=>{let l=Te(s?1:a),d=64,p=a/l;p<d&&(d=32);let h=Math.ceil(a/l/d),f=[{type:12,data:t},{type:12,data:r},{type:12,data:i},{type:12,data:n},{type:12,data:p},{type:12,data:h}],g=Me(e.dataType,l),m=Be(1,l),b=["type"];s&&b.push("type"),o&&b.push("type");let v=$=>{let w=ee("x",e.dataType,e.dims,l),S=[w],x=s?U("seq_lens",s.dataType,s.dims):void 0;x&&S.push(x);let I=o?U("total_sequence_length_input",o.dataType,o.dims):void 0;I&&S.push(I);let C=Be(e.dataType),z=[{name:"batch_size",type:"u32"},{name:"num_heads",type:"u32"},{name:"past_sequence_length",type:"u32"},{name:"sequence_length",type:"u32"},{name:"total_sequence_length",type:"u32"},{name:"elements_per_thread",type:"u32"}];return`
  var<workgroup> thread_max: array<f32, ${d}>;
  var<workgroup> thread_sum: array<f32, ${d}>;
  ${$.registerUniforms(z).declareVariables(...S)}
  ${$.mainStart([d,1,1])}
    let batchIdx = workgroup_id.z / uniforms.num_heads;
    let headIdx = workgroup_id.z % uniforms.num_heads;
    let sequence_length = uniforms.sequence_length;
    var total_sequence_length = uniforms.total_sequence_length;
    ${jr(x,I,!1)}
    let local_offset = local_idx * uniforms.elements_per_thread;
    let offset = (global_idx / ${d}) * uniforms.total_sequence_length + local_offset;
    let seq_causal_length = ${s?"u32(past_sequence_length + workgroup_id.y + 1)":"total_sequence_length"};
    var thread_max_vector = ${m}(-3.4028234663852886e+38f);
    for (var i: u32 = 0; i < uniforms.elements_per_thread && i + local_offset < seq_causal_length; i++) {
      thread_max_vector = max(${m}(x[offset + i]), thread_max_vector);
    }
    thread_max[local_idx] = ${(()=>{switch(l){case 1:return"thread_max_vector";case 2:return"max(thread_max_vector.x, thread_max_vector.y)";case 4:return"max(max(thread_max_vector.x, thread_max_vector.y), max(thread_max_vector.z, thread_max_vector.w))";default:throw new Error(`Unsupported components: ${l}`)}})()};
    workgroupBarrier();

    var max_value =  f32(-3.4028234663852886e+38f);
    for (var i = 0u; i < ${d}; i++) {
      max_value = max(thread_max[i], max_value);
    }

    var sum_vector = ${m}(0);
    for (var i: u32 = 0; i < uniforms.elements_per_thread && i + local_offset < seq_causal_length; i++) {
      sum_vector += exp(${m}(x[offset + i]) - max_value);
    }
    thread_sum[local_idx] = ${(()=>{switch(l){case 1:return"sum_vector";case 2:return"sum_vector.x + sum_vector.y";case 4:return"sum_vector.x + sum_vector.y + sum_vector.z + sum_vector.w";default:throw new Error(`Unsupported components: ${l}`)}})()};
    workgroupBarrier();

    var sum: f32 = 0;
    for (var i = 0u; i < ${d}; i++) {
      sum += thread_sum[i];
    }

    if (sum == 0) {
      for (var i: u32 = 0; i < uniforms.elements_per_thread && i + local_offset < seq_causal_length; i++) {
        x[offset + i] = ${w.type.value}(${C}(1.0) / ${C}(seq_causal_length));
      }
    } else {
      for (var i: u32 = 0; i < uniforms.elements_per_thread && i + local_offset < seq_causal_length; i++) {
        var f32input = ${m}(x[offset + i]);
        x[offset + i] = ${w.type.value}(exp(f32input - max_value) / sum);
      }
    }
      ${s?`
        for (var total_seq_id: u32 = seq_causal_length; total_seq_id + local_offset < uniforms.total_sequence_length; total_seq_id++) {
          x[offset + total_seq_id] = ${w.type.value}(${C}(0));
        }`:""};
  }`};return{name:"AttentionProbsSoftmax",shaderCache:{hint:`${d};${g};${l}`,inputDependencies:b},getShaderSource:v,getRunData:()=>({outputs:[],dispatchGroup:{x:1,y:n,z:t*r},programUniforms:f})}},Yu=(e,t,r,i,n,a,s,o,l)=>{let d=s+a.kvSequenceLength,p=[a.batchSize,a.numHeads,a.sequenceLength,d],h=e>1&&i,f=a.kvNumHeads?a.kvNumHeads:a.numHeads,g=h?[a.batchSize,f,d,a.headSize]:void 0,m=a.nReps?a.nReps:1,b=a.scale===0?1/Math.sqrt(a.headSize):a.scale,v=Te(a.headSize),$=a.headSize/v,w=12,S={x:Math.ceil(d/w),y:Math.ceil(a.sequenceLength/w),z:a.batchSize*a.numHeads},x=[{type:12,data:a.sequenceLength},{type:12,data:$},{type:12,data:d},{type:12,data:a.numHeads},{type:12,data:a.headSize},{type:1,data:b},{type:12,data:s},{type:12,data:a.kvSequenceLength},{type:12,data:m}],I=h&&i&&N.size(i.dims)>0,C=["type","type"];I&&C.push("type"),n&&C.push("type"),o&&C.push("type"),l&&C.push("type");let z=[{dims:p,dataType:t.dataType,gpuDataType:0}];h&&z.push({dims:g,dataType:t.dataType,gpuDataType:0});let k=D=>{let L=U("q",t.dataType,t.dims,v),j=U("key",r.dataType,r.dims,v),O=[L,j];if(I){let H=U("past_key",i.dataType,i.dims,v);O.push(H)}n&&O.push(U("attention_bias",n.dataType,n.dims));let G=o?U("seq_lens",o.dataType,o.dims):void 0;G&&O.push(G);let M=l?U("total_sequence_length_input",l.dataType,l.dims):void 0;M&&O.push(M);let B=ee("output",t.dataType,p),V=[B];h&&V.push(ee("present_key",t.dataType,g,v));let Y=Be(1,v),q=[{name:"M",type:"u32"},{name:"K",type:"u32"},{name:"N",type:"u32"},{name:"num_heads",type:"u32"},{name:"head_size",type:"u32"},{name:"alpha",type:"f32"},{name:"past_sequence_length",type:"u32"},{name:"kv_sequence_length",type:"u32"},{name:"n_reps",type:"u32"}];return`
  const TILE_SIZE = ${w}u;

  var<workgroup> tileQ: array<${L.type.storage}, ${w*w}>;
  var<workgroup> tileK: array<${L.type.storage}, ${w*w}>;
  ${D.registerUniforms(q).declareVariables(...O,...V)}
  ${D.mainStart([w,w,1])}
    // x holds the N and y holds the M
    let headIdx = workgroup_id.z % uniforms.num_heads;
    let kvHeadIdx = ${m===1?"headIdx":"headIdx / uniforms.n_reps"};
    let kv_num_heads = ${m===1?"uniforms.num_heads":"uniforms.num_heads / uniforms.n_reps"};
    let batchIdx = workgroup_id.z / uniforms.num_heads;
    let m = workgroup_id.y * TILE_SIZE;
    let n = workgroup_id.x * TILE_SIZE;
    let sequence_length = uniforms.M;
    var total_sequence_length = uniforms.N;
    ${jr(G,M,!0)}
    let absKvHeadIdx = batchIdx * kv_num_heads + kvHeadIdx;
    let qOffset = workgroup_id.z * uniforms.M * uniforms.K + m * uniforms.K;
    ${I&&h?"let pastKeyOffset = absKvHeadIdx * uniforms.past_sequence_length * uniforms.K;":""};
    let kOffset = absKvHeadIdx * uniforms.kv_sequence_length * uniforms.K;
    ${h?"let presentKeyOffset = absKvHeadIdx * uniforms.N * uniforms.K;":""}
    var value = ${Y}(0);
    for (var w: u32 = 0u; w < uniforms.K; w += TILE_SIZE) {
      if (global_id.y < uniforms.M && w + local_id.x < uniforms.K) {
        tileQ[TILE_SIZE * local_id.y + local_id.x] = q[qOffset + local_id.y * uniforms.K + w + local_id.x];
      }
      if (n + local_id.y < uniforms.N && w + local_id.x < uniforms.K) {
        var idx = TILE_SIZE * local_id.y + local_id.x;
      ${I&&h?`
              if (n + local_id.y < past_sequence_length) {
                tileK[idx] = past_key[pastKeyOffset + (n + local_id.y) * uniforms.K + w + local_id.x];
              } else if (n + local_id.y - past_sequence_length < uniforms.kv_sequence_length) {
                tileK[idx] = key[kOffset + (n + local_id.y - past_sequence_length) * uniforms.K + w + local_id.x];
              }`:`
          if (n + local_id.y < uniforms.kv_sequence_length) {
            tileK[idx] = key[kOffset + (n + local_id.y) * uniforms.K + w + local_id.x];
          }`}
      ${h?`if (n + local_id.y < present_sequence_length) {
        present_key[presentKeyOffset + (n + local_id.y) * uniforms.K + w + local_id.x] = tileK[idx];
      }`:""}
      }
      workgroupBarrier();

      for (var k: u32 = 0u; k < TILE_SIZE && w+k < uniforms.K; k++) {
          value += ${Y}(tileQ[TILE_SIZE * local_id.y + k] * tileK[TILE_SIZE * local_id.x + k]);
      }

      workgroupBarrier();
    }

    if (global_id.y < uniforms.M && global_id.x < total_sequence_length) {
      let headOffset = workgroup_id.z * uniforms.M * uniforms.N;
      let outputIdx = headOffset + global_id.y * uniforms.N + global_id.x;
      var sum: f32 = ${(()=>{switch(v){case 1:return"value";case 2:return"value.x + value.y";case 4:return"value.x + value.y + value.z + value.w";default:throw new Error(`Unsupported components: ${v}`)}})()};
        output[outputIdx] = ${B.type.value} (sum * uniforms.alpha) + ${n?"attention_bias[outputIdx]":"0.0"};
    }
  }`};return{name:"AttentionProbs",shaderCache:{hint:`${v};${n!==void 0};${i!==void 0};${e}`,inputDependencies:C},getRunData:()=>({outputs:z,dispatchGroup:S,programUniforms:x}),getShaderSource:k}},Qu=(e,t,r,i,n,a,s=void 0,o=void 0)=>{let l=a+n.kvSequenceLength,d=n.nReps?n.nReps:1,p=n.vHiddenSize*d,h=e>1&&i,f=n.kvNumHeads?n.kvNumHeads:n.numHeads,g=h?[n.batchSize,f,l,n.headSize]:void 0,m=[n.batchSize,n.sequenceLength,p],b=12,v={x:Math.ceil(n.vHeadSize/b),y:Math.ceil(n.sequenceLength/b),z:n.batchSize*n.numHeads},$=[{type:12,data:n.sequenceLength},{type:12,data:l},{type:12,data:n.vHeadSize},{type:12,data:n.numHeads},{type:12,data:n.headSize},{type:12,data:p},{type:12,data:a},{type:12,data:n.kvSequenceLength},{type:12,data:d}],w=h&&i&&N.size(i.dims)>0,S=["type","type"];w&&S.push("type"),s&&S.push("type"),o&&S.push("type");let x=[{dims:m,dataType:t.dataType,gpuDataType:0}];h&&x.push({dims:g,dataType:t.dataType,gpuDataType:0});let I=C=>{let z=U("probs",t.dataType,t.dims),k=U("v",r.dataType,r.dims),D=[z,k];w&&D.push(U("past_value",i.dataType,i.dims));let L=s?U("seq_lens",s.dataType,s.dims):void 0;s&&D.push(L);let j=o?U("total_sequence_length_input",o.dataType,o.dims):void 0;o&&D.push(j);let O=[ee("output",t.dataType,m)];h&&O.push(ee("present_value",t.dataType,g));let G=[{name:"M",type:"u32"},{name:"K",type:"u32"},{name:"N",type:"u32"},{name:"num_heads",type:"u32"},{name:"head_size",type:"u32"},{name:"v_hidden_size",type:"u32"},{name:"past_sequence_length",type:"u32"},{name:"kv_sequence_length",type:"u32"},{name:"n_reps",type:"u32"}];return`
  const TILE_SIZE = ${b}u;
  var<workgroup> tileQ: array<${z.type.value}, ${b*b}>;
  var<workgroup> tileV: array<${z.type.value}, ${b*b}>;
  ${C.registerUniforms(G).declareVariables(...D,...O)}
  ${C.mainStart([b,b,1])}
   let headIdx = workgroup_id.z % uniforms.num_heads;
   let batchIdx = workgroup_id.z / uniforms.num_heads;
   let kvHeadIdx = ${d===1?"headIdx":"headIdx / uniforms.n_reps"};
   let kv_num_heads = ${d===1?"uniforms.num_heads":"uniforms.num_heads / uniforms.n_reps"};
   let m = global_id.y;
   let n = global_id.x;
   let sequence_length = uniforms.M;
   var total_sequence_length = uniforms.K;
   ${jr(L,j,!0)}
   let offsetA = workgroup_id.z * uniforms.M * uniforms.K + m * uniforms.K;
   let absKvHeadIdx = batchIdx * kv_num_heads + kvHeadIdx; // kvHeadIdx is relative to the batch
   ${w&&h?"let pastValueOffset = absKvHeadIdx * uniforms.N * uniforms.past_sequence_length + n;":""};
   let vOffset = absKvHeadIdx * uniforms.N * uniforms.kv_sequence_length + n;
   ${h?"let presentValueOffset = absKvHeadIdx * uniforms.N * uniforms.K + n;":""}
   var value = ${z.type.storage}(0);
   for (var w: u32 = 0u; w < uniforms.K; w += TILE_SIZE) {
      if (m < uniforms.M && w + local_id.x < uniforms.K) {
        tileQ[TILE_SIZE * local_id.y + local_id.x] = probs[offsetA + w + local_id.x];
      }
      if (n < uniforms.N && w + local_id.y < uniforms.K) {
        var idx = TILE_SIZE * local_id.y + local_id.x;
        ${w&&h?`
        if (w + local_id.y < past_sequence_length) {
          tileV[idx] = past_value[pastValueOffset + (w + local_id.y) * uniforms.N];
        } else if (w + local_id.y - past_sequence_length < uniforms.kv_sequence_length) {
          tileV[idx] = v[vOffset + (w + local_id.y - past_sequence_length) * uniforms.N];
        }
      `:`
            if (w + local_id.y < uniforms.kv_sequence_length) {
              tileV[idx] = v[vOffset + (w + local_id.y) * uniforms.N];
            }`}
        ${h?`
            if (w + local_id.y < present_sequence_length) {
          present_value[presentValueOffset + (w + local_id.y) * uniforms.N] = tileV[idx];
        }`:""}
      }
     workgroupBarrier();
     for (var k: u32 = 0u; k < TILE_SIZE && w+k < total_sequence_length; k++) {
       value += tileQ[TILE_SIZE * local_id.y + k] * tileV[TILE_SIZE * k + local_id.x];
     }
     workgroupBarrier();
   }

   // we need to transpose output from BNSH_v to BSND_v
   if (m < uniforms.M && n < uniforms.N) {
     let outputIdx = batchIdx * uniforms.M * uniforms.v_hidden_size + m * uniforms.v_hidden_size
       + headIdx * uniforms.N + n;
     output[outputIdx] = value;
   }
  }`};return{name:"AttentionScore",shaderCache:{hint:`${i!==void 0};${e}`,inputDependencies:S},getRunData:()=>({outputs:x,dispatchGroup:v,programUniforms:$}),getShaderSource:I}},Tr=(e,t,r,i,n,a,s,o,l,d,p=void 0,h=void 0)=>{let f=Math.min(e.outputCount,1+(s?1:0)+(o?1:0)),g=f>1?s:void 0,m=f>1?o:void 0,b=f>1?d.pastSequenceLength:0,v=b+d.kvSequenceLength,$=l&&N.size(l.dims)>0?l:void 0,w=[t,r];g&&N.size(g.dims)>0&&w.push(g),$&&w.push($),p&&w.push(p),h&&w.push(h);let S=e.compute(Yu(f,t,r,g,$,d,b,p,h),{inputs:w,outputs:f>1?[-1,1]:[-1]})[0];e.compute(Zu(S,d.batchSize,d.numHeads,b,d.sequenceLength,v,p,h),{inputs:p&&h?[S,p,h]:[S],outputs:[]});let x=[S,i];m&&N.size(m.dims)>0&&x.push(m),p&&x.push(p),h&&x.push(h),e.compute(Qu(f,S,i,m,d,b,p,h),{inputs:x,outputs:f>1?[0,2]:[0]})},Ju=(e,t)=>{let r=[t.batchSize,t.numHeads,t.sequenceLength,t.headSize],i=t.sequenceLength,n=t.inputHiddenSize,a=t.headSize,s=12,o={x:Math.ceil(t.headSize/s),y:Math.ceil(t.sequenceLength/s),z:t.batchSize*t.numHeads},l=[e.inputs[0],e.inputs[1],e.inputs[2]],d=[{type:12,data:i},{type:12,data:n},{type:12,data:a},{type:12,data:t.numHeads},{type:12,data:t.headSize},{type:12,data:t.hiddenSize},{type:12,data:t.hiddenSize+t.hiddenSize+t.vHiddenSize}],p=h=>{let f=ee("output_q",l[0].dataType,r),g=ee("output_k",l[0].dataType,r),m=ee("output_v",l[0].dataType,r),b=U("input",l[0].dataType,l[0].dims),v=U("weight",l[1].dataType,l[1].dims),$=U("bias",l[2].dataType,l[2].dims),w=b.type.storage,S=[{name:"M",type:"u32"},{name:"K",type:"u32"},{name:"N",type:"u32"},{name:"num_heads",type:"u32"},{name:"head_size",type:"u32"},{name:"hidden_size",type:"u32"},{name:"ldb",type:"u32"}];return`
  const TILE_SIZE = ${s}u;
  var<workgroup> tileInput: array<${w}, ${s*s}>;
  var<workgroup> tileWeightQ: array<${w}, ${s*s}>;
  var<workgroup> tileWeightK: array<${w}, ${s*s}>;
  var<workgroup> tileWeightV: array<${w}, ${s*s}>;
  ${h.registerUniforms(S).declareVariables(b,v,$,f,g,m)}
  ${h.mainStart([s,s,1])}
    let batchIndex = workgroup_id.z / uniforms.num_heads;
    let headNumber = workgroup_id.z % uniforms.num_heads;
    let m = global_id.y;
    let n = global_id.x;

    let inputOffset = batchIndex * (uniforms.M * uniforms.K) + m * uniforms.K;
    let biasOffsetQ = headNumber * uniforms.head_size;
    let biasOffsetK = uniforms.hidden_size + biasOffsetQ;
    let biasOffsetV = uniforms.hidden_size + biasOffsetK;

    var valueQ = ${w}(0);
    var valueK = ${w}(0);
    var valueV = ${w}(0);
    for (var w: u32 = 0u; w < uniforms.K; w += TILE_SIZE) {
      if (m < uniforms.M && w + local_id.x < uniforms.K) {
        tileInput[TILE_SIZE * local_id.y + local_id.x] = input[inputOffset + w + local_id.x];
      }
      if (n < uniforms.N && w + local_id.y < uniforms.K) {
        let offset = n + (w + local_id.y) * uniforms.ldb;
        tileWeightQ[TILE_SIZE * local_id.y + local_id.x] = weight[biasOffsetQ + offset];
        tileWeightK[TILE_SIZE * local_id.y + local_id.x] = weight[biasOffsetK + offset];
        tileWeightV[TILE_SIZE * local_id.y + local_id.x] = weight[biasOffsetV + offset];
      }
      workgroupBarrier();
      for (var k: u32 = 0u; k<TILE_SIZE && w+k < uniforms.K; k++) {
        let inputTileOffset = TILE_SIZE * local_id.y + k;
        let weightTileOffset = TILE_SIZE * k + local_id.x;
        valueQ += tileInput[inputTileOffset] * tileWeightQ[weightTileOffset];
        valueK += tileInput[inputTileOffset] * tileWeightK[weightTileOffset];
        valueV += tileInput[inputTileOffset] * tileWeightV[weightTileOffset];
      }

      workgroupBarrier();
    }

    let headOffset = (m * uniforms.N + n) % uniforms.head_size;
    valueQ += bias[headOffset + biasOffsetQ];
    valueK += bias[headOffset + biasOffsetK];
    valueV += bias[headOffset + biasOffsetV];

    let offset = workgroup_id.z * uniforms.M * uniforms.N;
    if (m < uniforms.M && n < uniforms.N) {
      let outputIdx = offset + m * uniforms.N + n;
      output_q[outputIdx] = valueQ;
      output_k[outputIdx] = valueK;
      output_v[outputIdx] = valueV;
    }
  }`};return e.compute({name:"AttentionPrepare",shaderCache:{inputDependencies:["type","type","type"]},getRunData:()=>({outputs:[{dims:r,dataType:e.inputs[0].dataType,gpuDataType:0},{dims:r,dataType:e.inputs[0].dataType,gpuDataType:0},{dims:r,dataType:e.inputs[0].dataType,gpuDataType:0}],dispatchGroup:o,programUniforms:d}),getShaderSource:p},{inputs:l,outputs:[-1,-1,-1]})},dh=(e,t)=>{let r=Xu(e.inputs,t),[i,n,a]=Ju(e,r);return Tr(e,i,n,a,e.inputs[4],void 0,void 0,void 0,e.inputs[5],r)}}),el,tl,rl,ph,Qy=F(()=>{Ke(),ie(),ne(),Ce(),ae(),el=(e,t)=>{if(!e||e.length!==5)throw new Error("BatchNormalization requires 5 inputs");let r=(i,n,a)=>{let s=n.length;if(s!==i.length)throw new Error(`${a}: num dimensions != ${s}`);n.forEach((o,l)=>{if(o!==i[l])throw new Error(`${a}: dim[${l}] do not match`)})};if(e[0].dims.length>1){let i=t.format==="NHWC"?t.spatial?e[0].dims.slice(-1):e[0].dims.slice(-1).concat(e[0].dims.slice(1,e[0].dims.length-1)):e[0].dims.slice(1,t.spatial?2:void 0);r(e[1].dims,i,"Invalid input scale"),r(e[2].dims,i,"Invalid input B"),r(e[3].dims,i,"Invalid input mean"),r(e[4].dims,i,"Invalid input var")}else r(e[1].dims,[1],"Invalid input scale"),r(e[2].dims,[1],"Invalid input B"),r(e[3].dims,[1],"Invalid input mean"),r(e[4].dims,[1],"Invalid input var")},tl=(e,t)=>{let{epsilon:r,spatial:i,format:n}=t,a=e[0].dims,s=i?Te(a[a.length-1]):1,o=n==="NHWC"&&a.length>1?s:1,l=N.size(a)/s,d=i,p=d?a.length:a,h=U("x",e[0].dataType,e[0].dims,s),f=U("scale",e[1].dataType,e[1].dims,o),g=U("bias",e[2].dataType,e[2].dims,o),m=U("inputMean",e[3].dataType,e[3].dims,o),b=U("inputVar",e[4].dataType,e[4].dims,o),v=ee("y",e[0].dataType,p,s),$=()=>{let S="";if(i)S=`let cOffset = ${a.length===1?"0u":n==="NHWC"?`outputIndices[${a.length-1}] / ${s}`:"outputIndices[1]"};`;else if(n==="NCHW")S=`
            ${v.indicesSet("outputIndices","0","0")}
            let cOffset = ${v.indicesToOffset("outputIndices")};`;else{S=`var cIndices = ${f.type.indices}(0);
                       cIndices[0] = outputIndices[${a.length-1}];`;for(let x=1;x<f.rank;x++)S+=`cIndices[${x}] = outputIndices[${x}];`;S+=`let cOffset = ${f.indicesToOffset("cIndices")};`}return S},w=S=>`
  const epsilon = ${r};
  ${S.registerUniform("outputSize","u32").declareVariables(h,f,g,m,b,v)}
  ${S.mainStart()}
  ${S.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}
    var outputIndices = ${v.offsetToIndices(`global_idx * ${s}`)};
    ${$()}
    let scale = ${f.getByOffset("cOffset")};
    let bias = ${g.getByOffset("cOffset")};
    let inputMean = ${m.getByOffset("cOffset")};
    let inputVar = ${b.getByOffset("cOffset")};
    let x = ${h.getByOffset("global_idx")};
    let value = (x - inputMean) * inverseSqrt(inputVar + epsilon) * scale + bias;
    ${v.setByOffset("global_idx","value")}
  }`;return{name:"BatchNormalization",shaderCache:{hint:`${t.epsilon}_${t.format}_${i}_${s}`,inputDependencies:d?["rank","type","type","type","type"]:void 0},getShaderSource:w,getRunData:()=>({outputs:[{dims:e[0].dims,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(l/64)},programUniforms:d?[{type:12,data:l},...re(a)]:[{type:12,data:l}]})}},rl=e=>me(e),ph=(e,t)=>{let{inputs:r,outputCount:i}=e,n=rl({...t,outputCount:i});if(be.webgpu.validateInputContent&&el(r,n),t.trainingMode)throw new Error("BatchNormalization trainingMode is not supported yet.");e.compute(tl(r,n))}}),il,nl,ch,Jy=F(()=>{ne(),ae(),il=e=>{if(e[0].dims.length!==3)throw new Error("input should have 3 dimensions");if(![320,640,1280].includes(e[0].dims[2]))throw new Error("number of channels should be 320, 640 or 1280");if(e[1].dims.length!==1)throw new Error("bias is expected to have 1 dimensions");if(e[0].dims[2]!==e[1].dims[0])throw new Error("last dimension of input and bias are not the same")},nl=e=>{let t=e[0].dims,r=e[0].dims[2],i=N.size(t)/4,n=e[0].dataType,a=U("input",n,t,4),s=U("bias",n,[r],4),o=U("residual",n,t,4),l=ee("output",n,t,4);return{name:"BiasAdd",getRunData:()=>({outputs:[{dims:t,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(i/64)}}),getShaderSource:d=>`
  const channels = ${r}u / 4;
  ${d.declareVariables(a,s,o,l)}

  ${d.mainStart()}
    ${d.guardAgainstOutOfBoundsWorkgroupSizes(i)}
    let value = ${a.getByOffset("global_idx")}
      + ${s.getByOffset("global_idx % channels")} + ${o.getByOffset("global_idx")};
    ${l.setByOffset("global_idx","value")}
  }`}},ch=e=>{il(e.inputs),e.compute(nl(e.inputs))}}),al,fe,hh,fh,mh,gh,yh,_h,bh,wh,$h,sl,vh,xh,Sh,kh,$r,Th,ni,Ih,Eh,Ch,zh,Ah,Mh,Oh,Rh,Nh,Bh,Dh,Ph,Uh,Lh,qh,Wh,fn,Gh,sa,oa,Vh,Fh,Hh,ol,ul,jh,Da=F(()=>{ie(),ne(),Ce(),ae(),al=(e,t,r,i,n,a,s)=>{let o=Math.ceil(t/4),l="";typeof n=="string"?l=`${n}(a)`:l=n("a");let d=U("inputData",r,[o],4),p=ee("outputData",i,[o],4),h=[{name:"vec_size",type:"u32"}];return s&&h.push(...s),`
      ${e.registerUniforms(h).declareVariables(d,p)}

  ${a??""}

  ${e.mainStart()}
    ${e.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.vec_size")}

    let a = ${d.getByOffset("global_idx")};
    ${p.setByOffset("global_idx",l)}
  }`},fe=(e,t,r,i,n,a=e.dataType,s,o)=>{let l=[{type:12,data:Math.ceil(N.size(e.dims)/4)}];return s&&l.push(...s),{name:t,shaderCache:{hint:n,inputDependencies:["type"]},getShaderSource:d=>al(d,N.size(e.dims),e.dataType,a,r,i,o),getRunData:d=>({outputs:[{dims:e.dims,dataType:a}],dispatchGroup:{x:Math.ceil(N.size(d[0].dims)/64/4)},programUniforms:l})}},hh=e=>{e.compute(fe(e.inputs[0],"Abs","abs"))},fh=e=>{e.compute(fe(e.inputs[0],"Acos","acos"))},mh=e=>{e.compute(fe(e.inputs[0],"Acosh","acosh"))},gh=e=>{e.compute(fe(e.inputs[0],"Asin","asin"))},yh=e=>{e.compute(fe(e.inputs[0],"Asinh","asinh"))},_h=e=>{e.compute(fe(e.inputs[0],"Atan","atan"))},bh=e=>{e.compute(fe(e.inputs[0],"Atanh","atanh"))},wh=e=>me(e),$h=(e,t)=>{let r;switch(t.to){case 10:r="vec4<f16>";break;case 1:r="vec4<f32>";break;case 12:r="vec4<u32>";break;case 6:r="vec4<i32>";break;case 9:r="vec4<bool>";break;default:throw new RangeError(`not supported type (specified in attribute 'to' from 'Cast' operator): ${t.to}`)}e.compute(fe(e.inputs[0],"Cast",r,void 0,t.cacheKey,t.to))},sl=e=>{let t,r,i=e.length>=2&&e[1].data!==0,n=e.length>=3&&e[2].data!==0;switch(e[0].dataType){case 1:t=i?e[1].getFloat32Array()[0]:-34028234663852886e22,r=n?e[2].getFloat32Array()[0]:34028234663852886e22;break;case 10:t=i?e[1].getUint16Array()[0]:64511,r=n?e[2].getUint16Array()[0]:31743;break;default:throw new Error("Unsupport data type")}return me({min:t,max:r})},vh=(e,t)=>{let r=t||sl(e.inputs),i=Be(e.inputs[0].dataType);e.compute(fe(e.inputs[0],"Clip",n=>`clamp(${n}, vec4<${i}>(uniforms.min), vec4<${i}>(uniforms.max))`,void 0,r.cacheKey,void 0,[{type:e.inputs[0].dataType,data:r.min},{type:e.inputs[0].dataType,data:r.max}],[{name:"min",type:i},{name:"max",type:i}]),{inputs:[0]})},xh=e=>{e.compute(fe(e.inputs[0],"Ceil","ceil"))},Sh=e=>{e.compute(fe(e.inputs[0],"Cos","cos"))},kh=e=>{e.compute(fe(e.inputs[0],"Cosh","cosh"))},$r=e=>me(e),Th=(e,t)=>{let r=Be(e.inputs[0].dataType);e.compute(fe(e.inputs[0],"Elu",i=>`elu_vf32(${i})`,`
  const elu_alpha_ = ${r}(${t.alpha});

  fn elu_f32(a: ${r}) -> ${r} {
  return select((exp(a) - 1.0) * elu_alpha_, a, a >= 0.0);
  }

  fn elu_vf32(v: vec4<${r}>) -> vec4<${r}> {
  return vec4(elu_f32(v.x), elu_f32(v.y), elu_f32(v.z), elu_f32(v.w));
  }`,t.cacheKey))},ni=(e="f32")=>`
const r0: ${e} = 0.3275911;
const r1: ${e} = 0.254829592;
const r2: ${e} = -0.284496736;
const r3: ${e} = 1.421413741;
const r4: ${e} = -1.453152027;
const r5: ${e} = 1.061405429;

fn erf_vf32(v: vec4<${e}>) -> vec4<${e}> {
  let absv = abs(v);
  let x = 1.0 / (1.0 + r0 * absv);
  return sign(v) * (1.0 - ((((r5 * x + r4) * x + r3) * x + r2) * x + r1) * x * exp(-absv * absv));
}`,Ih=e=>{let t=Be(e.inputs[0].dataType);e.compute(fe(e.inputs[0],"Erf",r=>`erf_vf32(${r})`,ni(t)))},Eh=e=>{e.compute(fe(e.inputs[0],"Exp","exp"))},Ch=e=>{e.compute(fe(e.inputs[0],"Floor","floor"))},zh=e=>{let t=Be(e.inputs[0].dataType);e.compute(fe(e.inputs[0],"Gelu",r=>`0.5 * ${r} * (1.0 + erf_vf32(${r} * 0.7071067811865475))`,ni(t)))},Ah=(e,t)=>{let r=Be(e.inputs[0].dataType);e.compute(fe(e.inputs[0],"LeakyRelu",i=>`select(leaky_relu_alpha_ * ${i}, ${i}, ${i} >= vec4<${r}>(0.0))`,`const leaky_relu_alpha_ = ${r}(${t.alpha});`,t.cacheKey))},Mh=e=>{e.compute(fe(e.inputs[0],"Not",t=>`!${t}`))},Oh=e=>{e.compute(fe(e.inputs[0],"Neg",t=>`-${t}`))},Rh=e=>{e.compute(fe(e.inputs[0],"Reciprocal",t=>`1.0/${t}`))},Nh=e=>{let t=Be(e.inputs[0].dataType);e.compute(fe(e.inputs[0],"Relu",r=>`select(vec4<${t}>(0.0), ${r}, ${r} > vec4<${t}>(0.0))`))},Bh=e=>{e.compute(fe(e.inputs[0],"Sigmoid",t=>`(1.0 / (1.0 + exp(-${t})))`))},Dh=e=>me(e),Ph=(e,t)=>{let r=Be(e.inputs[0].dataType);e.compute(fe(e.inputs[0],"HardSigmoid",i=>`max(vec4<${r}>(0.0), min(vec4<${r}>(1.0), ${t.alpha} * ${i} + vec4<${r}>(${t.beta})))`,void 0,t.cacheKey))},Uh=e=>{e.compute(fe(e.inputs[0],"Sin","sin"))},Lh=e=>{e.compute(fe(e.inputs[0],"Sinh","sinh"))},qh=e=>{e.compute(fe(e.inputs[0],"Sqrt","sqrt"))},Wh=e=>{e.compute(fe(e.inputs[0],"Tan","tan"))},fn=e=>`sign(${e}) * (1 - exp(-2 * abs(${e}))) / (1 + exp(-2 * abs(${e})))`,Gh=e=>{e.compute(fe(e.inputs[0],"Tanh",fn))},sa=(e="f32")=>`
const fast_gelu_a: ${e} = 0.5;
const fast_gelu_b: ${e} = 0.7978845608028654;
const fast_gelu_c: ${e} = 0.035677408136300125;

fn tanh_v(v: vec4<${e}>) -> vec4<${e}> {
  return ${fn("v")};
}
`,oa=e=>`(fast_gelu_a + fast_gelu_a * tanh_v(${e} * (fast_gelu_c * ${e} * ${e} + fast_gelu_b))) * ${e}`,Vh=e=>{let t=Be(e.inputs[0].dataType);e.compute(fe(e.inputs[0],"FastGelu",oa,sa(t),void 0,e.inputs[0].dataType))},Fh=(e,t)=>{let r=Be(e.inputs[0].dataType);return e.compute(fe(e.inputs[0],"ThresholdedRelu",i=>`select(vec4<${r}>(0.0), ${i}, ${i} > thresholded_relu_alpha_)`,`const thresholded_relu_alpha_ = vec4<${r}>(${t.alpha});`,t.cacheKey)),0},Hh=e=>{e.compute(fe(e.inputs[0],"Log","log"))},ol=(e,t)=>`
const alpha = vec4<${e}>(${t});
const one = ${e}(1.0);
const zero = ${e}(0.0);

fn quick_gelu_impl(x: vec4<${e}>) -> vec4<${e}> {
  let v = x *alpha;
  var x1 : vec4<${e}>;
  for (var i = 0; i < 4; i = i + 1) {
    if (v[i] >= zero) {
      x1[i] = one / (one + exp(-v[i]));
    } else {
      x1[i] = one - one / (one + exp(v[i]));
    }
  }
  return x * x1;
}
`,ul=e=>`quick_gelu_impl(${e})`,jh=(e,t)=>{let r=Be(e.inputs[0].dataType);e.compute(fe(e.inputs[0],"QuickGelu",ul,ol(r,t.alpha),t.cacheKey,e.inputs[0].dataType))}}),ll,dl,Kh,e_=F(()=>{ne(),ae(),Da(),ll=e=>{if(e[0].dims.length!==3)throw new Error("input should have 3 dimensions");if(![2560,5120,10240].includes(e[0].dims[2]))throw new Error("hidden state should be 2560, 5120 or 10240");if(e[1].dims.length!==1)throw new Error("bias is expected to have 1 dimensions");if(e[0].dims[2]!==e[1].dims[0])throw new Error("last dimension of input and bias are not the same")},dl=e=>{let t=e[0].dims.slice();t[2]=t[2]/2;let r=U("input",e[0].dataType,e[0].dims,4),i=U("bias",e[0].dataType,[e[0].dims[2]],4),n=ee("output",e[0].dataType,t,4),a=N.size(t)/4,s=Me(e[0].dataType);return{name:"BiasSplitGelu",getRunData:()=>({outputs:[{dims:t,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(a/64)}}),getShaderSource:o=>`
  const M_SQRT2 = sqrt(2.0);
  const halfChannels = ${e[0].dims[2]/4/2}u;

  ${o.declareVariables(r,i,n)}

  ${ni(s)}

  ${o.mainStart()}
    ${o.guardAgainstOutOfBoundsWorkgroupSizes(a)}
    let biasIdx = global_idx % halfChannels;
    let batchIndex = global_idx / halfChannels;
    let inputOffset = biasIdx + batchIndex * halfChannels * 2;
    let valueLeft = input[inputOffset] + bias[biasIdx];
    let valueRight = input[inputOffset + halfChannels] + bias[biasIdx + halfChannels];
    let geluRight = valueRight * 0.5 * (erf_vf32(valueRight / M_SQRT2) + 1);

    ${n.setByOffset("global_idx","valueLeft * geluRight")}
  }`}},Kh=e=>{ll(e.inputs),e.compute(dl(e.inputs))}}),pl,cl,et,Xh,Zh,Yh,Qh,Jh,ef,tf,rf,nf,af,t_=F(()=>{ie(),ne(),ae(),pl=(e,t,r,i,n,a,s,o,l,d,p,h)=>{let f,g;typeof o=="string"?f=g=(w,S)=>`${o}((${w}),(${S}))`:typeof o=="function"?f=g=o:(f=o.scalar,g=o.vector);let m=ee("outputData",p,i.length,4),b=U("aData",l,t.length,4),v=U("bData",d,r.length,4),$;if(n)if(a){let w=N.size(t)===1,S=N.size(r)===1,x=t.length>0&&t[t.length-1]%4===0,I=r.length>0&&r[r.length-1]%4===0;w||S?$=m.setByOffset("global_idx",g(w?`${b.type.value}(${b.getByOffset("0")}.x)`:b.getByOffset("global_idx"),S?`${v.type.value}(${v.getByOffset("0")}.x)`:v.getByOffset("global_idx"))):$=`
            let outputIndices = ${m.offsetToIndices("global_idx * 4u")};
            let offsetA = ${b.broadcastedIndicesToOffset("outputIndices",m)};
            let offsetB = ${v.broadcastedIndicesToOffset("outputIndices",m)};
            ${m.setByOffset("global_idx",g(s||x?b.getByOffset("offsetA / 4u"):`${b.type.value}(${b.getByOffset("offsetA / 4u")}[offsetA % 4u])`,s||I?v.getByOffset("offsetB / 4u"):`${v.type.value}(${v.getByOffset("offsetB / 4u")}[offsetB % 4u])`))}
          `}else $=m.setByOffset("global_idx",g(b.getByOffset("global_idx"),v.getByOffset("global_idx")));else{if(!a)throw new Error("no necessary to use scalar implementation for element-wise binary op implementation.");let w=(S,x,I="")=>{let C=`aData[indexA${x}][componentA${x}]`,z=`bData[indexB${x}][componentB${x}]`;return`
            let outputIndices${x} = ${m.offsetToIndices(`global_idx * 4u + ${x}u`)};
            let offsetA${x} = ${b.broadcastedIndicesToOffset(`outputIndices${x}`,m)};
            let offsetB${x} = ${v.broadcastedIndicesToOffset(`outputIndices${x}`,m)};
            let indexA${x} = offsetA${x} / 4u;
            let indexB${x} = offsetB${x} / 4u;
            let componentA${x} = offsetA${x} % 4u;
            let componentB${x} = offsetB${x} % 4u;
            ${S}[${x}] = ${I}(${f(C,z)});
          `};p===9?$=`
            var data = vec4<u32>(0);
            ${w("data",0,"u32")}
            ${w("data",1,"u32")}
            ${w("data",2,"u32")}
            ${w("data",3,"u32")}
            outputData[global_idx] = dot(vec4<u32>(0x1, 0x100, 0x10000, 0x1000000), vec4<u32>(data));`:$=`
            ${w("outputData[global_idx]",0)}
            ${w("outputData[global_idx]",1)}
            ${w("outputData[global_idx]",2)}
            ${w("outputData[global_idx]",3)}
          `}return`
        ${e.registerUniform("vec_size","u32").declareVariables(b,v,m)}

        ${h??""}

        ${e.mainStart()}
        ${e.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.vec_size")}
        ${$}
      }`},cl=(e,t,r,i,n,a,s=r.dataType)=>{let o=r.dims.map(Number),l=i.dims.map(Number),d=!N.areEqual(o,l),p=o,h=N.size(o),f=!1,g=!1,m=[d];if(d){let b=tr.calcShape(o,l,!1);if(!b)throw new Error("Can't perform binary op on the given tensors");p=b.slice(),h=N.size(p);let v=N.size(o)===1,$=N.size(l)===1,w=o.length>0&&o[o.length-1]%4===0,S=l.length>0&&l[l.length-1]%4===0;m.push(v),m.push($),m.push(w),m.push(S);let x=1;for(let I=1;I<p.length;I++){let C=o[o.length-I],z=l[l.length-I];if(C===z)x*=C;else break}x%4===0?(g=!0,f=!0):(v||$||w||S)&&(f=!0)}else f=!0;return m.push(f),{name:e,shaderCache:{hint:t+m.map(b=>b.toString()).join("_"),inputDependencies:["rank","rank"]},getShaderSource:b=>pl(b,o,l,p,f,d,g,n,r.dataType,i.dataType,s,a),getRunData:()=>({outputs:[{dims:p,dataType:s}],dispatchGroup:{x:Math.ceil(h/64/4)},programUniforms:[{type:12,data:Math.ceil(N.size(p)/4)},...re(o,l,p)]})}},et=(e,t,r,i,n,a)=>{e.compute(cl(t,n??"",e.inputs[0],e.inputs[1],r,i,a))},Xh=e=>{et(e,"Add",(t,r)=>`${t}+${r}`)},Zh=e=>{et(e,"Div",(t,r)=>`${t}/${r}`)},Yh=e=>{et(e,"Equal",{scalar:(t,r)=>`u32(${t}==${r})`,vector:(t,r)=>`vec4<u32>(${t}==${r})`},void 0,void 0,9)},Qh=e=>{et(e,"Mul",(t,r)=>`${t}*${r}`)},Jh=e=>{let t=U("input",e.inputs[0].dataType,e.inputs[0].dims).type.value;et(e,"Pow",{scalar:(r,i)=>`pow_custom(${r},${i})`,vector:(r,i)=>`pow_vector_custom(${r},${i})`},`
    fn pow_custom(a : ${t}, b : ${t}) -> ${t} {
      if (b == ${t}(0.0)) {
        return ${t}(1.0);
      } else if (a < ${t}(0.0) && f32(b) != floor(f32(b))) {
        return ${t}(pow(f32(a), f32(b))); // NaN
      }
      return select(sign(a), ${t}(1.0), round(f32(abs(b) % ${t}(2.0))) != 1.0) * ${t}(${t==="i32"?"round":""}(pow(f32(abs(a)), f32(b))));
    }
    fn pow_vector_custom(a : vec4<${t}>, b : vec4<${t}>) -> vec4<${t}> {
      // TODO: implement vectorized pow
      return vec4<${t}>(pow_custom(a.x, b.x), pow_custom(a.y, b.y), pow_custom(a.z, b.z), pow_custom(a.w, b.w));
    }
      `)},ef=e=>{et(e,"Sub",(t,r)=>`${t}-${r}`)},tf=e=>{et(e,"Greater",{scalar:(t,r)=>`u32(${t}>${r})`,vector:(t,r)=>`vec4<u32>(${t}>${r})`},void 0,void 0,9)},rf=e=>{et(e,"Less",{scalar:(t,r)=>`u32(${t}<${r})`,vector:(t,r)=>`vec4<u32>(${t}<${r})`},void 0,void 0,9)},nf=e=>{et(e,"GreaterOrEqual",{scalar:(t,r)=>`u32(${t}>=${r})`,vector:(t,r)=>`vec4<u32>(${t}>=${r})`},void 0,void 0,9)},af=e=>{et(e,"LessOrEqual",{scalar:(t,r)=>`u32(${t}<=${r})`,vector:(t,r)=>`vec4<u32>(${t}<=${r})`},void 0,void 0,9)}}),hl,fl,ml,gl,sf,of,r_=F(()=>{ie(),ne(),Ce(),ae(),hl=(e,t)=>{if(!e||e.length<1)throw new Error("too few inputs");let r=0,i=e[r],n=i.dataType,a=i.dims.length;e.forEach((s,o)=>{if(o!==r){if(s.dataType!==n)throw new Error("input tensors should be one type");if(s.dims.length!==a)throw new Error("input tensors should have the same shape");s.dims.forEach((l,d)=>{if(d!==t&&l!==i.dims[d])throw new Error("non concat dimensions must match")})}})},fl=(e,t)=>`
  fn calculateInputIndex(index: u32) -> u32 {
    let sizeInConcatAxis = array<u32, ${e}u>(${t});
    for (var i: u32 = 0u; i < ${e}; i += 1u ) {
      if (index < sizeInConcatAxis[i]) {
        return i;
      }
    }
    return ${e}u;
  }`,ml=(e,t)=>{let r=e.length,i=[];for(let n=0;n<r;++n){let a=t.setByOffset("global_idx",e[n].getByIndices("indices"));r===1?i.push(a):n===0?i.push(`if (inputIndex == ${n}u) { ${a} }`):n===r-1?i.push(`else { ${a} }`):i.push(`else if (inputIndex == ${n}) { ${a} }`)}return i.join(`
`)},gl=(e,t,r,i)=>{let n=N.size(r),a=new Array(e.length),s=new Array(e.length),o=0,l=[],d=[],p=[{type:12,data:n}];for(let b=0;b<e.length;++b)o+=e[b].dims[t],a[b]=o,d.push(e[b].dims.length),s[b]=U(`input${b}`,i,d[b]),l.push("rank"),p.push({type:12,data:a[b]});for(let b=0;b<e.length;++b)p.push(...re(e[b].dims));p.push(...re(r));let h=ee("output",i,r.length),f=h.indicesGet("indices",t),g=Array.from(Array(a.length).keys()).map(b=>`uniforms.sizeInConcatAxis${b}`).join(","),m=b=>`

  ${(()=>{b.registerUniform("outputSize","u32");for(let v=0;v<e.length;v++)b.registerUniform(`sizeInConcatAxis${v}`,"u32");return b.declareVariables(...s,h)})()}

  ${fl(a.length,g)}

  ${b.mainStart()}
    ${b.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}

    var indices = ${h.offsetToIndices("global_idx")};

    let inputIndex = calculateInputIndex(${f});
    if (inputIndex != 0u) {
      let sizeInConcatAxis = array<u32, ${a.length}u>(${g});
      ${f} -= sizeInConcatAxis[inputIndex - 1u];
    }

    ${ml(s,h)}
  }`;return{name:"Concat",shaderCache:{hint:`${t}`,inputDependencies:l},getRunData:()=>({outputs:[{dims:r,dataType:i}],dispatchGroup:{x:Math.ceil(n/64)},programUniforms:p}),getShaderSource:m}},sf=(e,t)=>{let r=e.inputs,i=r[0].dims,n=N.normalizeAxis(t.axis,i.length);hl(r,n);let a=i.slice();a[n]=r.reduce((o,l)=>o+(l.dims.length>n?l.dims[n]:0),0);let s=r.filter(o=>N.size(o.dims)>0);e.compute(gl(s,n,a,r[0].dataType),{inputs:s})},of=e=>me({axis:e.axis})}),qt,Wt,Gt,Pa,Ft=F(()=>{ie(),ne(),qt=(e,t,r="f32")=>{switch(e.activation){case"Relu":return`value = max(value, ${t}(0.0));`;case"Sigmoid":return`value = (${t}(1.0) / (${t}(1.0) + exp(-value)));`;case"Clip":return`value = clamp(value, ${t}(${r}(uniforms.clip_min)), ${t}(${r}(uniforms.clip_max)));`;case"HardSigmoid":return`value = max(${t}(0.0), min(${t}(1.0), ${r}(uniforms.alpha) * value + ${r}(uniforms.beta)));`;case"LeakyRelu":return`value = select(${r}(uniforms.alpha) * value, value, value >= ${t}(0.0));`;case"Tanh":return`let e2x = exp(-2.0 * abs(value));
              value = sign(value) * (1.0 - e2x) / (1.0 + e2x);
        `;case"":return"";default:throw new Error(`Unsupported activation ${e.activation}`)}},Wt=(e,t)=>{e.activation==="Clip"?t.push({type:1,data:e.clipMax},{type:1,data:e.clipMin}):e.activation==="HardSigmoid"?t.push({type:1,data:e.alpha},{type:1,data:e.beta}):e.activation==="LeakyRelu"&&t.push({type:1,data:e.alpha})},Gt=(e,t)=>{e.activation==="Clip"?t.push({name:"clip_max",type:"f32"},{name:"clip_min",type:"f32"}):e.activation==="HardSigmoid"?t.push({name:"alpha",type:"f32"},{name:"beta",type:"f32"}):e.activation==="LeakyRelu"&&t.push({name:"alpha",type:"f32"})},Pa=e=>{let t=e?.activation||"";if(t==="HardSigmoid"){let[r,i]=e?.activation_params||[.2,.5];return{activation:t,alpha:r,beta:i}}else if(t==="Clip"){let[r,i]=e?.activation_params||[Mc,Oc];return{activation:t,clipMax:i,clipMin:r}}else if(t==="LeakyRelu"){let[r]=e?.activation_params||[.01];return{activation:t,alpha:r}}return{activation:t}}}),Re,uf,Ua=F(()=>{Re=(e,t)=>{switch(e){case 1:return t;case 2:return`vec2<${t}>`;case 3:return`vec3<${t}>`;case 4:return`vec4<${t}>`;default:throw new Error(`${e}-component is not supported.`)}},uf=e=>`
      ${e?"value = value + getBiasByOutputCoords(coords);":""}
      `}),lf,i_=F(()=>{lf=e=>`
fn getIndexFromCoords4D(coords : vec4<i32>, shape : vec4<i32>) -> i32 {
  return dot(coords, vec4<i32>(
      shape.y * shape.z * shape.w, shape.z * shape.w, shape.w, 1));
}
fn getOutputIndexFromCoords(coords : vec4<i32>) -> i32 {
  return dot(coords, vec4<i32>(
    i32(${e}.x), i32(${e}.y), i32(${e}.z), 1));
}
`}),Sr,La,qa=F(()=>{ie(),ne(),ae(),Ft(),Sr=(e,t,r,i,n)=>{let a=i-r;return`
      ${Array.from({length:r}).map((s,o)=>`
      if (${te(t.shape,o,t.rank)} != 1) {
        ${t.indicesSet(e,o,te(n,o+a,i))}
      } else {
        ${t.indicesSet(e,o,0)}
      }`).join("")}
`},La=(e,t,r,i,n=!1,a)=>{let s=e[0].dims,o=e[1].dims,l=s[s.length-2],d=o[o.length-1],p=s[s.length-1],h=Te(d),f=Te(p),g=Te(l),m=N.size(r)/h/g,b=e.length>2,v=i?i.slice(0,-2):r.slice(0,-2),$=[N.size(v),l,d],w=[{type:12,data:m},{type:12,data:l},{type:12,data:d},{type:12,data:p}];Wt(t,w),w.push(...re(v,s,o)),b&&w.push(...re(e[2].dims)),w.push(...re($));let S=x=>{let I=Ra("batch_dims",e[0].dataType,v.length),C=U("a",e[0].dataType,s.length,f),z=U("b",e[1].dataType,o.length,h),k=ee("output",e[0].dataType,$.length,h),D=Me(k.type.tensor),L=qt(t,k.type.value,D),j=[C,z],O="";if(b){let B=n?h:1;j.push(U("bias",e[2].dataType,e[2].dims.length,B)),O=`${n?`value += bias[col / ${B}];`:`value += ${k.type.value}(bias[row + i]);`}`}let G=[{name:"output_size",type:"u32"},{name:"M",type:"u32"},{name:"N",type:"u32"},{name:"K",type:"u32"}];Gt(t,G);let M=()=>{let B=`var a_data: ${C.type.value};`;for(let V=0;V<f;V++)B+=`
              let b_data${V} = b[(b_offset + (k + ${V}) * uniforms.N + col) / ${h}];`;for(let V=0;V<g;V++){B+=`a_data = a[(a_offset + (row + ${V}) * uniforms.K + k) / ${f}];`;for(let Y=0;Y<f;Y++)B+=`
            values[${V}] = fma(${z.type.value}(a_data${f===1?"":`[${Y}]`}), b_data${Y}, values[${V}]);
`}return B};return`
  ${x.registerUniforms(G).registerInternalVariables(I).declareVariables(...j,k)}
  ${x.mainStart()}
    ${x.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
    let col = (global_idx % (uniforms.N / ${h})) * ${h};
    var index1 = global_idx / (uniforms.N / ${h});
    let stride1 = uniforms.M / ${g};
    let row = (index1 % stride1) * ${g};
    let batch = index1 / stride1;

    ${r.length===2?"":`let batch_indices = ${I.offsetToIndices("batch")};`}

    var a_indices: ${C.type.indices};
    ${Sr("a_indices",C,C.rank-2,I.rank,"batch_indices")}
    ${C.indicesSet("a_indices",C.rank-2,0)}
    ${C.indicesSet("a_indices",C.rank-1,0)}
    let a_offset = ${C.indicesToOffset("a_indices")};

    var b_indices: ${z.type.indices};
    ${Sr("b_indices",z,z.rank-2,I.rank,"batch_indices")}
    ${z.indicesSet("b_indices",z.rank-2,0)}
    ${z.indicesSet("b_indices",z.rank-1,0)}
    let b_offset = ${z.indicesToOffset("b_indices")};
    var values: array<${k.type.value}, ${g}>;
    for (var k: u32 = 0u; k < uniforms.K; k = k + ${f}) {
      ${M()}
    }
    for (var i = 0u; i < ${g}u; i++) {
      var value = values[i];
      ${O}
      ${L}
      let cur_indices = ${k.type.indices}(batch, row + i, col);
      let offset = ${k.indicesToOffset("cur_indices")};
      ${k.setByOffset(`offset / ${h}`,"value")};
    }
  }
  `};return{name:"MatMulNaive",shaderCache:{hint:`${t.activation};${h};${f};${g};${n}`,inputDependencies:b?["rank","rank","rank"]:["rank","rank"]},getRunData:()=>({outputs:[{dims:a?a(r):r,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(m/64)},programUniforms:w}),getShaderSource:S}}}),yl,_l,ua,mn,bl,la,wl,ci,Wa=F(()=>{ie(),ne(),ae(),Ft(),qa(),Ua(),yl=(e,t)=>e?`
        mm_Asub[inputRow][inputCol] = mm_readA(batch,
          kStart + inputRow,
          globalRowStart / innerElementSize + inputCol${t?", batchIndices":""});
        `:`
        mm_Asub[inputRow][inputCol] = mm_readA(batch,
          globalRow + innerRow,
          kStart / innerElementSize + inputCol${t?", batchIndices":""});
        `,_l=(e,t)=>e?`
        let ACached0 = mm_Asub[k * innerElementSize][localRow];
        let ACached1 = mm_Asub[k * innerElementSize + 1][localRow];
        let ACached2 = mm_Asub[k * innerElementSize + 2][localRow];
        ${t===3?"":"let ACached3 = mm_Asub[k * innerElementSize + 3][localRow];"}
        for (var i = 0; i < rowPerThread; i = i + 1) {
          acc[i] = BCached0 * ACached0[i] + acc[i];
          acc[i] = BCached1 * ACached1[i] + acc[i];
          acc[i] = BCached2 * ACached2[i] + acc[i];
          ${t===3?"":"acc[i] = BCached3 * ACached3[i] + acc[i];"}
        }`:`
        for (var i = 0; i < rowPerThread; i = i + 1) {
          let ACached = mm_Asub[tileRow + i][k];
          acc[i] = BCached0 * ACached.x + acc[i];
          acc[i] = BCached1 * ACached.y + acc[i];
          acc[i] = BCached2 * ACached.z + acc[i];
          ${t===3?"":"acc[i] = BCached3 * ACached.w + acc[i];"}
        }`,ua=(e,t,r="f32",i,n=!1,a=32,s=!1,o=32)=>{let l=t[1]*e[1],d=t[0]*e[0],p=n?l:a,h=n?a:l,f=p/t[0],g=a/t[1];if(!((n&&f===4&&e[1]===4||!n&&(f===3||f===4))&&p%t[0]===0&&a%t[1]===0&&e[0]===4))throw new Error(`If transposeA ${n} is true, innerElementSize ${f} and workPerThread[1] ${e[1]} must be 4.
      Otherwise, innerElementSize ${f} must be 3 or 4.
  tileAWidth ${p} must be divisible by workgroupSize[0]${t[0]}. tileInner ${a} must be divisible by workgroupSize[1] ${t[1]}. colPerThread ${e[0]} must be 4.`);return`
var<workgroup> mm_Asub: array<array<vec${f}<${r}>, ${p/f}>, ${h}>;
var<workgroup> mm_Bsub: array<array<vec4<${r}>, ${d/e[0]}>, ${a}>;

const rowPerThread = ${e[1]};
const colPerThread = ${e[0]};
const innerElementSize = ${f};
const tileInner = ${a};

@compute @workgroup_size(${t[0]}, ${t[1]}, ${t[2]})
fn main(@builtin(local_invocation_id) localId : vec3<u32>,
        @builtin(global_invocation_id) globalId : vec3<u32>,
        @builtin(workgroup_id) workgroupId : vec3<u32>) {
  let localRow = i32(localId.y);
  let tileRow = localRow * rowPerThread;
  let tileCol = i32(localId.x);

  let globalRow =i32(globalId.y) * rowPerThread;
  let globalCol = i32(globalId.x);
  let batch = ${s?"0":"i32(globalId.z)"};
  ${i?`let batchIndices = ${i.offsetToIndices("u32(batch)")};`:""}
  let globalRowStart = i32(workgroupId.y) * ${l};

  let num_tiles = ${s?`${Math.ceil(o/a)}`:"(uniforms.dim_inner - 1) / tileInner + 1"};
  var kStart = ${s?`i32(globalId.z) * ${o}`:"0"};

  var acc: array<vec4<${r}>, rowPerThread>;

  // Loop over shared dimension.
  let tileRowB = localRow * ${g};
  for (var t = 0; t < num_tiles; t = t + 1) {
      // Load one tile of A into local memory.
      for (var innerRow = 0; innerRow < rowPerThread; innerRow = innerRow + 1) {
          let inputRow = tileRow + innerRow;
          let inputCol = tileCol;
          ${yl(n,i)}
      }

      // Load one tile of B into local memory.
      for (var innerRow = 0; innerRow < ${g}; innerRow = innerRow + 1) {
          let inputRow = tileRowB + innerRow;
          let inputCol = tileCol;
          mm_Bsub[inputRow][inputCol] = mm_readB(batch, kStart + inputRow, globalCol${i?", batchIndices":""});
      }
      kStart = kStart + tileInner;
      workgroupBarrier();

      // Compute acc values for a single thread.
      for (var k = 0; k < tileInner / innerElementSize; k = k + 1) {
          let BCached0 = mm_Bsub[k * innerElementSize][tileCol];
          let BCached1 = mm_Bsub[k * innerElementSize + 1][tileCol];
          let BCached2 = mm_Bsub[k * innerElementSize + 2][tileCol];
          ${f===3?"":"let BCached3 = mm_Bsub[k * innerElementSize + 3][tileCol];"}

          ${_l(n,f)}
      }

      workgroupBarrier();
  }

  for (var innerRow = 0; innerRow < rowPerThread; innerRow = innerRow + 1) {
      mm_write(batch, globalRow + innerRow, globalCol, acc[innerRow]);
  }
}`},mn=(e,t)=>e?`
            mm_Asub[inputRow][inputCol] = mm_readA(batch,
              kStart + inputRow,
              globalRowStart + inputCol${t?", batchIndices":""});
            `:`
            mm_Asub[inputRow][inputCol] = mm_readA(batch,
              globalRowStart + inputRow,
              kStart + inputCol${t?", batchIndices":""});
            `,bl=e=>e?"let ACached = mm_Asub[k][tileRow + innerRow];":"let ACached = mm_Asub[tileRow + innerRow][k];",la=(e,t,r="f32",i,n=!1,a=32,s=!1,o=32,l=!1)=>{let d=e[1]*t[1],p=e[0]*t[0],h=n?d:a,f=n?a:d;if(!(f%t[1]===0&&h%t[0]===0&&a%t[1]===0))throw new Error(`tileAHight ${f} must be divisible by workgroupSize[1]${t[1]}, tileAWidth ${h} must be divisible by workgroupSize[0]${t[0]}, tileInner ${a} must be divisible by workgroupSize[1]${t[1]}`);let g=f/t[1],m=h/t[0],b=a/t[1],v=l?`
    let localRow = i32(localId.y);
    let localCol = i32(localId.x);
    let globalRowStart = i32(workgroupId.y) * ${d};
    let globalColStart = i32(workgroupId.x) * ${p};

    // Loop over shared dimension.
    for (var t = 0; t < num_tiles; t = t + 1) {
      // Load one tile of A into local memory.
      for (var inputRow = localRow; inputRow < ${f}; inputRow = inputRow + ${t[1]}) {
        for (var inputCol = localCol; inputCol < ${h}; inputCol = inputCol + ${t[0]}) {
          ${mn(n,i)}
        }
      }
      // Load one tile of B into local memory.
      for (var inputRow = localRow; inputRow < ${a}; inputRow = inputRow + ${t[1]}) {
            for (var inputCol = localCol; inputCol < ${p}; inputCol = inputCol + ${t[0]}) {
          mm_Bsub[inputRow][inputCol] = mm_readB(batch,
            kStart + inputRow,
            globalColStart + inputCol${i?", batchIndices":""});
        }
      }
      kStart = kStart + tileInner;
      workgroupBarrier();

      // Compute acc values for a single thread.
      var BCached : array<${r}, colPerThread>;
      for (var k = 0; k < tileInner; k = k + 1) {
        for (var inner = 0; inner < colPerThread; inner = inner + 1) {
          BCached[inner] = mm_Bsub[k][localCol + inner * ${t[0]}];
        }
        for (var innerRow = 0; innerRow < rowPerThread; innerRow = innerRow + 1) {
          let ACached = ${n?`mm_Asub[k][localRow + innerRow * ${t[1]}];`:`mm_Asub[localRow + innerRow * ${t[1]}][k];`}
          for (var innerCol = 0; innerCol < colPerThread; innerCol = innerCol + 1) {
            acc[innerRow][innerCol] = acc[innerRow][innerCol] +
                ACached * BCached[innerCol];
          }
        }
      }
      workgroupBarrier();
    }
    for (var innerRow = 0; innerRow < rowPerThread; innerRow = innerRow + 1) {
      let gRow = globalRowStart + localRow + innerRow * ${t[1]};
      for (var innerCol = 0; innerCol < colPerThread; innerCol = innerCol + 1) {
        let gCol = globalColStart + localCol + innerCol * ${t[0]};
        mm_write(batch, gRow, gCol, acc[innerRow][innerCol]);
      }
    }
    `:`
let tileRow = i32(localId.y) * rowPerThread;
let tileCol = i32(localId.x) * colPerThread;

let globalRow = i32(globalId.y) * rowPerThread;
let globalCol = i32(globalId.x) * colPerThread;
let globalRowStart = i32(workgroupId.y) * ${d};

let tileRowA = i32(localId.y) * ${g};
let tileColA = i32(localId.x) * ${m};
let tileRowB = i32(localId.y) * ${b};
// Loop over shared dimension.
for (var t = 0; t < num_tiles; t = t + 1) {
  // Load one tile of A into local memory.
  for (var innerRow = 0; innerRow < ${g}; innerRow = innerRow + 1) {
    for (var innerCol = 0; innerCol < ${m}; innerCol = innerCol + 1) {
      let inputRow = tileRowA + innerRow;
      let inputCol = tileColA + innerCol;
      ${mn(n,i)}
    }
  }

  // Load one tile of B into local memory.
  for (var innerRow = 0; innerRow < ${b}; innerRow = innerRow + 1) {
    for (var innerCol = 0; innerCol < colPerThread; innerCol = innerCol + 1) {
      let inputRow = tileRowB + innerRow;
      let inputCol = tileCol + innerCol;
      mm_Bsub[inputRow][inputCol] = mm_readB(batch,
        kStart + inputRow,
        globalCol + innerCol${i?", batchIndices":""});
    }
  }
  kStart = kStart + tileInner;
  workgroupBarrier();

  // Compute acc values for a single thread.
  var BCached : array<${r}, colPerThread>;
  for (var k = 0; k < tileInner; k = k + 1) {
    for (var inner = 0; inner < colPerThread; inner = inner + 1) {
      BCached[inner] = mm_Bsub[k][tileCol + inner];
    }

    for (var innerRow = 0; innerRow < rowPerThread; innerRow = innerRow + 1) {
      ${bl(n)}
      for (var innerCol = 0; innerCol < colPerThread; innerCol = innerCol + 1) {
        acc[innerRow][innerCol] = acc[innerRow][innerCol] + ACached * BCached[innerCol];
      }
    }
  }

  workgroupBarrier();
}

for (var innerRow = 0; innerRow < rowPerThread; innerRow = innerRow + 1) {
  for (var innerCol = 0; innerCol < colPerThread; innerCol = innerCol + 1) {
    mm_write(batch, globalRow + innerRow, globalCol + innerCol,
        acc[innerRow][innerCol]);
  }
}
`;return`
  var<workgroup> mm_Asub : array<array<${r}, ${h}>, ${f}>;
  var<workgroup> mm_Bsub : array<array<${r}, ${p}>, ${a}>;
  const rowPerThread = ${e[1]};
  const colPerThread = ${e[0]};
  const tileInner = ${a};

@compute @workgroup_size(${t[0]}, ${t[1]}, ${t[2]})
fn main(@builtin(local_invocation_id) localId : vec3<u32>,
        @builtin(global_invocation_id) globalId : vec3<u32>,
        @builtin(workgroup_id) workgroupId : vec3<u32>) {
    let batch = ${s?"0":"i32(globalId.z)"};
    ${i?`let batchIndices = ${i.offsetToIndices("u32(batch)")};`:""}
    let num_tiles = ${s?`${Math.ceil(o/a)}`:"(uniforms.dim_inner - 1) / tileInner + 1"};
    var kStart = ${s?`i32(globalId.z) * ${o}`:"0"};

    var acc : array<array<${r}, colPerThread>, rowPerThread>;
    ${v}
  }
`},wl=(e,t,r,i,n=!1)=>{let[a,s,o,l]=i,d=Me(i[0].type.tensor);return`
    fn mm_readA(batch: i32, row: i32, colIn: i32, batchIndices: ${a.type.indices}) -> ${Re(e,d)} {
      var value = ${Re(e,d)}(0.0);
      let col = colIn * ${e};
      if(row < uniforms.dim_a_outer && col < uniforms.dim_inner)
      {
        var aIndices: ${s.type.indices};
        ${Sr("aIndices",s,s.rank-2,a.rank,"batchIndices")}
        ${s.indicesSet("aIndices",s.rank-2,"u32(row)")}
        ${s.indicesSet("aIndices",s.rank-1,"u32(colIn)")}
        value = ${s.getByIndices("aIndices")};
      }
      return value;
    }

    fn mm_readB(batch: i32, row: i32, colIn: i32, batchIndices: ${a.type.indices}) -> ${Re(e,d)} {
      var value = ${Re(e,d)}(0.0);
      let col = colIn * ${e};
      if(row < uniforms.dim_inner && col < uniforms.dim_b_outer)
      {
        var bIndices: ${o.type.indices};
        ${Sr("bIndices",o,o.rank-2,a.rank,"batchIndices")}
        ${o.indicesSet("bIndices",o.rank-2,"u32(row)")}
        ${o.indicesSet("bIndices",o.rank-1,"u32(colIn)")}
        value = ${o.getByIndices("bIndices")};
      }
      return value;
    }

    fn mm_write(batch: i32, row: i32, colIn: i32, valueIn: ${Re(e,d)}) {
      let col = colIn * ${e};
      if (row < uniforms.dim_a_outer && col < uniforms.dim_b_outer) {
        var value = valueIn;
        let coords = vec3<i32>(batch, row, colIn);
        ${t?`value = value + ${n?"bias[colIn]":`${Re(e,d)}(bias[row])`};`:""}
        ${r}
        ${l.setByIndices("vec3<u32>(coords)","value")}
      }
    }
    `},ci=(e,t,r,i,n=!1,a)=>{let s=e[0].dims,o=e[1].dims,l=s.slice(0,-2),d=o.slice(0,-2),p=i?i.slice(0,-2):r.slice(0,-2),h=N.size(p),f=s[s.length-2],g=s[s.length-1],m=o[o.length-1],b=g%4===0&&m%4===0,v=f<=8?[4,1,1]:[4,4,1],$=[8,8,1],w=[Math.ceil(m/$[0]/v[0]),Math.ceil(f/$[1]/v[1]),Math.ceil(h/$[2]/v[2])],S=b?4:1,x=[...l,f,g/S],I=x.length,C=[...d,g,m/S],z=C.length,k=[h,f,m/S],D=[{type:6,data:f},{type:6,data:m},{type:6,data:g}];Wt(t,D),D.push(...re(p,x,C));let L=["rank","rank"],j=e.length>2;j&&(D.push(...re(e[2].dims)),L.push("rank")),D.push(...re(k));let O=G=>{let M=p.length,B=Ra("batchDims",e[0].dataType,M,1),V=Me(e[0].dataType),Y=U("a",e[0].dataType,I,S),q=U("b",e[1].dataType,z,S),H=ee("result",e[0].dataType,k.length,S),X=[Y,q];if(j){let se=n?S:1;X.push(U("bias",e[2].dataType,e[2].dims.length,se))}let W=[{name:"dim_a_outer",type:"i32"},{name:"dim_b_outer",type:"i32"},{name:"dim_inner",type:"i32"}];Gt(t,W);let J=Me(H.type.tensor),Q=qt(t,H.type.value,J),R=wl(S,j,Q,[B,Y,q,H],n);return`
  ${G.registerUniforms(W).registerInternalVariables(B).declareVariables(...X,H)}
  ${R}
  ${b?ua(v,$,V,B):la(v,$,V,B)}
                   `};return{name:"MatMul",shaderCache:{hint:`${v};${t.activation};${b};${n}`,inputDependencies:L},getRunData:()=>({outputs:[{dims:a?a(r):r,dataType:e[0].dataType}],dispatchGroup:{x:w[0],y:w[1],z:w[2]},programUniforms:D}),getShaderSource:O}}}),$l,df,n_=F(()=>{ie(),gt(),ae(),Ft(),Ua(),i_(),Wa(),$l=(e,t,r,i,n=!1,a,s=4,o=4,l=4,d="f32")=>{let p=D=>{switch(D){case 1:return"resData = x[xIndex];";case 3:return`resData = vec3<${d}>(x[xIndex], x[xIndex + 1], x[xIndex + 2]);`;case 4:return"resData = x[xIndex / 4];";default:throw new Error(`innerElementSize ${D} is not supported.`)}},h=D=>{switch(D){case 1:return"return w[row * i32(uniforms.w_shape[3]) + colIn];";case 4:return"return w[row * i32(uniforms.w_shape[3]) / 4 + colIn];";default:throw new Error(`innerElementSize ${D} is not supported.`)}},f=e?`
    let coord = vec4<i32>(batch, xRow, xCol, xCh);
    `:`
    let coord = vec4<i32>(batch, xCh, xRow, xCol);
    `,g=e?`
    let coords = vec4<i32>(
      batch,
      row / outWidth,
      row % outWidth,
      col);
    `:`
    let coords = vec4<i32>(
      batch,
      row,
      col / outWidth,
      col % outWidth);
    `,m=e?"i32(uniforms.x_shape[1])":"i32(uniforms.x_shape[2])",b=e?"i32(uniforms.x_shape[2])":"i32(uniforms.x_shape[3])",v=e?"row":"col",$=e?"col":"row",w=`
    let inChannels = i32(uniforms.w_shape[2]);
    let outWidth = ${e?"i32(uniforms.result_shape[2])":"i32(uniforms.result_shape[3])"};
    let outRow = ${v} / outWidth;
    let outCol = ${v} % outWidth;

    let WRow = ${$} / (i32(uniforms.w_shape[1]) * inChannels);
    let WCol = ${$} / inChannels % i32(uniforms.w_shape[1]);
    let xRow = outRow * uniforms.stride[0] + uniforms.dilation[0] * WRow - uniforms.pad[0];
    let xCol = outCol * uniforms.stride[1] + uniforms.dilation[1] * WCol - uniforms.pad[1];
    let xCh = ${$} % inChannels;
    var resData = ${Re(s,d)}(0.0);
    // The bounds checking is always needed since we use it to pad zero for
    // the 'same' padding type.
    if (xRow >= 0 && xRow < ${m} && xCol >= 0 && xCol < ${b}) {
      ${f}
      let xIndex = getIndexFromCoords4D(coord, vec4<i32>(uniforms.x_shape));
      ${p(s)}
    }
    return resData;`,S=e?t&&i?`
    let col = colIn * ${s};
    ${w}`:`
    let col = colIn * ${s};
    if (row < uniforms.dim_a_outer && col < uniforms.dim_inner) {
      ${w}
    }
    return ${Re(s,d)}(0.0);`:i&&r?`
    let col = colIn * ${s};
    ${w}`:`
    let col = colIn * ${s};
    if (row < uniforms.dim_inner && col < uniforms.dim_b_outer) {
      ${w}
    }
    return ${Re(s,d)}(0.0);`,x=e?i&&r?h(o):`
    let col = colIn * ${o};
    if (row < uniforms.dim_inner && col < uniforms.dim_b_outer) {
      ${h(o)}
    }
    return ${Re(o,d)}(0.0);`:`
    let col = colIn * ${o};
    if (row < uniforms.dim_inner && col < uniforms.dim_a_outer) {
      ${h(o)}
    }
    return ${Re(o,d)}(0.0);`,I=Re(l,d),C=Re(e?s:o,d),z=Re(e?o:s,d),k=qt(a,I,d);return`
    fn mm_readA(batch: i32, row : i32, colIn : i32) -> ${C} {
      ${e?S:x}
    }

    fn mm_readB(batch: i32, row : i32, colIn : i32) -> ${z} {
      ${e?x:S}
    }

    fn mm_write(batch: i32, row : i32, colIn : i32, valueIn : ${I}) {
      let col = colIn * ${l};
      if (row < uniforms.dim_a_outer && col < uniforms.dim_b_outer)
      {
      var value = valueIn;
      let outWidth = ${e?"i32(uniforms.result_shape[2])":"i32(uniforms.result_shape[3])"};
      ${g}
      ${uf(n)}
      ${k}
      setOutputAtCoords(coords[0], coords[1], coords[2], coords[3], value);
      }
    }`},df=(e,t,r,i,n,a,s,o,l)=>{let d=t.format==="NHWC",p=d?e[0].dims[3]:e[0].dims[1],h=r[0],f=d?r[2]:r[3],g=d?r[1]:r[2],m=d?r[3]:r[1],b=d&&(p%4===0||p%3===0)&&m%4===0,v=d?m:f*g,$=d?f*g:m,w=[8,8,1],S=i<=8?[4,1,1]:[4,4,1],x=[Math.ceil(v/w[0]/S[0]),Math.ceil($/w[1]/S[1]),Math.ceil(h/w[2]/S[2])];ce("verbose",()=>`[conv2d_mm_webgpu] dispatch = ${x}`);let I=b?d&&p%4!==0?3:4:1,C=w[1]*S[1],z=w[0]*S[0],k=Math.max(w[0]*I,w[1]),D=i%C===0,L=n%z===0,j=a%k===0,O=b?[I,4,4]:[1,1,1],G=[{type:6,data:i},{type:6,data:n},{type:6,data:a},{type:6,data:[t.pads[0],t.pads[1]]},{type:6,data:t.strides},{type:6,data:t.dilations}];Wt(t,G),G.push(...re(e[0].dims,e[1].dims));let M=["rank","rank"];s&&(G.push(...re(e[2].dims)),M.push("rank")),G.push(...re(r));let B=V=>{let Y=[{name:"dim_a_outer",type:"i32"},{name:"dim_b_outer",type:"i32"},{name:"dim_inner",type:"i32"},{name:"pad",type:"i32",length:2},{name:"stride",type:"i32",length:2},{name:"dilation",type:"i32",length:2}];Gt(t,Y);let q=b?4:1,H=Me(e[0].dataType),X=`
      fn setOutputAtIndex(flatIndex : i32, value : ${b?`vec4<${H}>`:H}) {
        result[flatIndex] = ${b?`vec4<${H}>`:H}(value);
      }
      fn setOutputAtCoords(d0 : i32, d1 : i32, d2 : i32, d3 : i32, value : ${b?`vec4<${H}>`:H}) {
        let flatIndex = getOutputIndexFromCoords(vec4<i32>(d0, d1, d2, d3));
        setOutputAtIndex(flatIndex ${b?"/ 4":""}, value);
      }`,W=U("x",e[0].dataType,e[0].dims.length,I===3?1:I),J=U("w",e[1].dataType,e[1].dims.length,q),Q=[W,J],R=ee("result",e[0].dataType,r.length,q);if(s){let se=U("bias",e[2].dataType,e[2].dims.length,q);Q.push(se),X+=`
        fn getBiasByOutputCoords(coords : vec4<i32>) -> ${b?`vec4<${H}>`:H} {
          return bias[coords.${d?"w":"y"}${b?"/ 4":""}];
        }`}return`
        ${lf("uniforms.result_strides")}
        //struct Uniforms { xShape : vec4<i32>, wShape : vec4<i32>, outShape : vec4<i32>,
        //  outShapeStrides: vec3<i32>, filterDims : vec2<i32>, pad : vec2<i32>, stride : vec2<i32>,
        //  dilation : vec2<i32>, dimAOuter : i32, dimBOuter : i32, dimInner : i32 };
        ${V.registerUniforms(Y).declareVariables(...Q,R)}
        ${X}
        ${$l(d,D,L,j,s,t,O[0],O[1],O[2],H)}
        ${b?ua(S,w,H,void 0,!d,k):la(S,w,H,void 0,!d,k,!1,void 0,o)}`};return{name:"Conv2DMatMul",shaderCache:{hint:`${t.cacheKey};${I};${b};${D};${L};${j};${C};${z};${k}`,inputDependencies:M},getRunData:()=>({outputs:[{dims:l?l(r):r,dataType:e[0].dataType}],dispatchGroup:{x:x[0],y:x[1],z:x[2]},programUniforms:G}),getShaderSource:B}}}),vl,gn,cr,xl,yn,Sl,pf,cf,a_=F(()=>{ie(),gt(),ne(),ae(),Ft(),Ua(),vl=e=>{let t=1;for(let r=0;r<e.length;r++)t*=e[r];return t},gn=e=>typeof e=="number"?[e,e,e]:e,cr=(e,t)=>t<=1?e:e+(e-1)*(t-1),xl=(e,t,r,i=1)=>{let n=cr(t,i);return Math.floor((e[0]*(r-1)-r+n)/2)},yn=(e,t,r,i,n)=>{n==null&&(n=xl(e,t[0],i[0]));let a=[0,0,0,r];for(let s=0;s<3;s++)e[s]+2*n>=t[s]&&(a[s]=Math.trunc((e[s]-t[s]+2*n)/i[s]+1));return a},Sl=(e,t,r,i,n,a,s,o,l,d)=>{let p,h,f,g;if(e==="VALID"&&(e=0),typeof e=="number"){p={top:e,bottom:e,left:e,right:e,front:e,back:e};let m=yn([t,r,i,1],[o,l,d],1,[n,a,s],e);h=m[0],f=m[1],g=m[2]}else if(Array.isArray(e)){if(!e.every((b,v,$)=>b===$[0]))throw Error(`Unsupported padding parameter: ${e}`);p={top:e[0],bottom:e[1],left:e[2],right:e[3],front:e[4],back:e[5]};let m=yn([t,r,i,1],[o,l,d],1,[n,a,s],e[0]);h=m[0],f=m[1],g=m[2]}else if(e==="SAME_UPPER"){h=Math.ceil(t/n),f=Math.ceil(r/a),g=Math.ceil(i/s);let m=(h-1)*n+o-t,b=(f-1)*a+l-r,v=(g-1)*s+d-i,$=Math.floor(m/2),w=m-$,S=Math.floor(b/2),x=b-S,I=Math.floor(v/2),C=v-I;p={top:S,bottom:x,left:I,right:C,front:$,back:w}}else throw Error(`Unknown padding parameter: ${e}`);return{padInfo:p,outDepth:h,outHeight:f,outWidth:g}},pf=(e,t,r,i,n,a=!1,s="channelsLast")=>{let o,l,d,p,h;if(s==="channelsLast")[o,l,d,p,h]=e;else if(s==="channelsFirst")[o,h,l,d,p]=e;else throw new Error(`Unknown dataFormat ${s}`);let[f,,g,m,b]=t,[v,$,w]=gn(r),[S,x,I]=gn(i),C=cr(g,S),z=cr(m,x),k=cr(b,I),{padInfo:D,outDepth:L,outHeight:j,outWidth:O}=Sl(n,l,d,p,v,$,w,C,z,k),G=a?f*h:f,M=[0,0,0,0,0];return s==="channelsFirst"?M=[o,G,L,j,O]:s==="channelsLast"&&(M=[o,L,j,O,G]),{batchSize:o,dataFormat:s,inDepth:l,inHeight:d,inWidth:p,inChannels:h,outDepth:L,outHeight:j,outWidth:O,outChannels:G,padInfo:D,strideDepth:v,strideHeight:$,strideWidth:w,filterDepth:g,filterHeight:m,filterWidth:b,effectiveFilterDepth:C,effectiveFilterHeight:z,effectiveFilterWidth:k,dilationDepth:S,dilationHeight:x,dilationWidth:I,inShape:e,outShape:M,filterShape:t}},cf=(e,t,r,i,n,a)=>{let s=a==="channelsLast";s?e[0].dims[3]:e[0].dims[1];let o=[64,1,1],l={x:r.map((v,$)=>$)},d=[Math.ceil(vl(l.x.map(v=>r[v]))/o[0]),1,1];ce("verbose",()=>`[conv3d_naive_webgpu] dispatch = ${d}`);let p=1,h=N.size(r),f=[{type:12,data:h},{type:12,data:i},{type:12,data:n},{type:12,data:t.strides},{type:12,data:t.dilations}];Wt(t,f),f.push(...re(e[0].dims,e[1].dims));let g=["rank","rank"],m=e.length===3;m&&(f.push(...re(e[2].dims)),g.push("rank")),f.push(...re(r));let b=v=>{let $=[{name:"output_size",type:"u32"},{name:"filter_dims",type:"u32",length:i.length},{name:"pads",type:"u32",length:n.length},{name:"strides",type:"u32",length:t.strides.length},{name:"dilations",type:"u32",length:t.dilations.length}];Gt(t,$);let w=1,S=Me(e[0].dataType),x=U("x",e[0].dataType,e[0].dims.length,p),I=U("W",e[1].dataType,e[1].dims.length,w),C=[x,I],z=ee("result",e[0].dataType,r.length,w),k="";if(m){let j=U("bias",e[2].dataType,e[2].dims.length,w);C.push(j),k+=`
        fn getBiasByOutputCoords(coords : array<u32, 5>) -> ${S} {
          return bias[${s?te("coords",4,5):te("coords",1,5)}];
        }`}let D=Re(p,S),L=qt(t,D,S);return`
            ${k}
            fn getX(d0 : u32, d1 : u32, d2 : u32, d3 : u32, d4 : u32) -> f32 {
              let aIndices = array<u32, 5>(d0, d1, d2, d3, d4);
              return ${x.getByIndices("aIndices")};
            }
            fn getW(d0 : u32, d1 : u32, d2 : u32, d3 : u32, d4 : u32) -> f32 {
              let aIndices = array<u32, 5>(d0, d1, d2, d3, d4);
              return ${I.getByIndices("aIndices")};
            }
          ${v.registerUniforms($).declareVariables(...C,z)}
          ${v.mainStart()}
          ${v.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
              let coords = ${z.offsetToIndices("global_idx")};
              let batch = ${te("coords",0,x.rank)};
              let d2 = ${s?te("coords",x.rank-1,x.rank):te("coords",1,x.rank)};
              let xFRCCorner = vec3<u32>(${s?te("coords",1,x.rank):te("coords",2,x.rank)},
              ${s?te("coords",2,x.rank):te("coords",3,x.rank)},
              ${s?te("coords",3,x.rank):te("coords",4,x.rank)}) * uniforms.strides - uniforms.pads;
              let xFCorner = xFRCCorner.x;
              let xRCorner = xFRCCorner.y;
              let xCCorner = xFRCCorner.z;
              let xShapeY = ${s?te("uniforms.x_shape",1,x.rank):te("uniforms.x_shape",2,x.rank)};
              let xShapeZ = ${s?te("uniforms.x_shape",2,x.rank):te("uniforms.x_shape",3,x.rank)};
              let xShapeW = ${s?te("uniforms.x_shape",3,x.rank):te("uniforms.x_shape",4,x.rank)};
              let xShapeU = ${s?te("uniforms.x_shape",4,x.rank):te("uniforms.x_shape",1,x.rank)};
              let inputDepthNearestVec4 = (xShapeU / 4) * 4;
              let inputDepthVec4Remainder = xShapeU % 4;

              var value = 0.0;
              for (var wF = 0u; wF < uniforms.filter_dims[0]; wF++) {
                let xF = xFCorner + wF * uniforms.dilations[0];
                if (xF < 0 || xF >= xShapeY) {
                  continue;
                }

                for (var wR = 0u; wR < uniforms.filter_dims[1]; wR++) {
                  let xR = xRCorner + wR * uniforms.dilations[1];
                  if (xR < 0 || xR >= xShapeZ) {
                    continue;
                  }

                  for (var wC = 0u; wC < uniforms.filter_dims[2]; wC++) {
                    let xC = xCCorner + wC * uniforms.dilations[2];
                    if (xC < 0 || xC >= xShapeW) {
                      continue;
                    }

                    for (var d1 = 0u; d1 < inputDepthNearestVec4; d1 += 4) {
                      ${s?`let xValues = vec4<f32>(
                               getX(batch, xF, xR, xC, d1),
                               getX(batch, xF, xR, xC, d1 + 1),
                               getX(batch, xF, xR, xC, d1 + 2),
                               getX(batch, xF, xR, xC, d1 + 3));
                            `:`let xValues = vec4<f32>(
                               getX(batch, d1, xF, xR, xC),
                               getX(batch, d1 + 1, xF, xR, xC),
                               getX(batch, d1 + 2, xF, xR, xC),
                               getX(batch, d1 + 3, xF, xR, xC));
                            `}
                            let wValues = vec4<f32>(
                              getW(d2, d1, wF, wR, wC),
                              getW(d2, d1 + 1, wF, wR, wC),
                              getW(d2, d1 + 2, wF, wR, wC),
                              getW(d2, d1 + 3, wF, wR, wC));
                      value += dot(xValues, wValues);
                    }
                    if (inputDepthVec4Remainder == 1) {
                        ${s?`value += getX(batch, xF, xR, xC, inputDepthNearestVec4)
                          * getW(d2, inputDepthNearestVec4, wF, wR, wC);`:`value += getX(batch, inputDepthNearestVec4, xF, xR, xC)
                          * getW(d2, inputDepthNearestVec4, wF, wR, wC);`}
                    } else if (inputDepthVec4Remainder == 2) {
                      ${s?`let xValues = vec2<f32>(
                        getX(batch, xF, xR, xC, inputDepthNearestVec4),
                        getX(batch, xF, xR, xC, inputDepthNearestVec4 + 1));
                      `:`let xValues = vec2<f32>(
                        getX(batch, inputDepthNearestVec4, xF, xR, xC),
                        getX(batch, inputDepthNearestVec4 + 1, xF, xR, xC));
                    `}
                    let wValues = vec2<f32>(
                      getW(d2, inputDepthNearestVec4, wF, wR, wC),
                      getW(d2, inputDepthNearestVec4 + 1, wF, wR, wC));
                      value += dot(xValues, wValues);
                    } else if (inputDepthVec4Remainder == 3) {
                      ${s?`let xValues = vec3<f32>(
                        getX(batch, xF, xR, xC, inputDepthNearestVec4),
                        getX(batch, xF, xR, xC, inputDepthNearestVec4 + 1),
                        getX(batch, xF, xR, xC, inputDepthNearestVec4 + 2));
                      `:`let xValues = vec3<f32>(
                        getX(batch, inputDepthNearestVec4, xF, xR, xC),
                        getX(batch, inputDepthNearestVec4 + 1, xF, xR, xC),
                        getX(batch, inputDepthNearestVec4 + 2, xF, xR, xC));
                    `}
                    let wValues = vec3<f32>(
                      getW(d2, inputDepthNearestVec4, wF, wR, wC),
                      getW(d2, inputDepthNearestVec4 + 1, wF, wR, wC),
                      getW(d2, inputDepthNearestVec4 + 2, wF, wR, wC));
                      value += dot(xValues, wValues);
                    }
                  }
                }
              }
              ${m?"value = value + getBiasByOutputCoords(coords)":""};
              ${L}
              result[global_idx] = f32(value);
          }`};return{name:"Conv3DNaive",shaderCache:{hint:`${t.cacheKey};${s};${p};${m}`,inputDependencies:g},getRunData:()=>({outputs:[{dims:r,dataType:e[0].dataType}],dispatchGroup:{x:d[0],y:d[1],z:d[2]},programUniforms:f}),getShaderSource:b}}}),hf,ff,s_=F(()=>{ie(),ne(),ae(),Ft(),hf=(e,t,r,i)=>{let n=e.length>2,a=n?"value += b[output_channel];":"",s=e[0].dims,o=e[1].dims,l=t.format==="NHWC",d=l?r[3]:r[1],p=d/t.group,h=l&&p>=4?Te(d):1,f=N.size(r)/h,g=[{type:12,data:f},{type:12,data:t.dilations},{type:12,data:[t.strides[0],t.strides[1]]},{type:12,data:[t.pads[0],t.pads[1]]},{type:12,data:p}];Wt(t,g),g.push(...re(s,[o[0],o[1],o[2],o[3]/h]));let m=n?["rank","rank","rank"]:["rank","rank"];g.push(...re([r[0],r[1],r[2],r[3]/h]));let b=v=>{let $=ee("output",e[0].dataType,r.length,h),w=Me($.type.tensor),S=qt(t,$.type.value,w),x=U("x",e[0].dataType,s.length),I=U("w",e[1].dataType,o.length,h),C=[x,I];n&&C.push(U("b",e[2].dataType,e[2].dims,h));let z=[{name:"output_size",type:"u32"},{name:"dilations",type:"u32",length:t.dilations.length},{name:"strides",type:"u32",length:2},{name:"pads",type:"u32",length:2},{name:"output_channels_per_group",type:"u32"}];Gt(t,z);let k=l?`
      for (var wHeight: u32 = 0u; wHeight < uniforms.w_shape[0]; wHeight++) {
        let xHeight = xRCCorner.x + wHeight * uniforms.dilations[0];

        if (xHeight < 0u || xHeight >= uniforms.x_shape[1]) {
          continue;
        }

        for (var wWidth: u32 = 0u; wWidth < uniforms.w_shape[1]; wWidth++) {
          let xWidth = xRCCorner.y + wWidth * uniforms.dilations[1];
          if (xWidth < 0u || xWidth >= uniforms.x_shape[2]) {
            continue;
          }

          for (var wInChannel: u32 = 0u; wInChannel < uniforms.w_shape[2]; wInChannel++) {
            let input_channel = in_channel_offset + wInChannel;
            let xVal = ${x.get("batch","xHeight","xWidth","input_channel")};
            let wVal = ${I.get("wHeight","wWidth","wInChannel","output_channel")};
            value += xVal * wVal;
          }
        }
      }
      `:`
      for (var wInChannel: u32 = 0u; wInChannel < uniforms.w_shape[1]; wInChannel++) {
        let input_channel = in_channel_offset + wInChannel;
        for (var wHeight: u32 = 0u; wHeight < uniforms.w_shape[2]; wHeight++) {
          let xHeight = xRCCorner.x + wHeight * uniforms.dilations[0];

          if (xHeight < 0u || xHeight >= uniforms.x_shape[2]) {
            continue;
          }

          for (var wWidth: u32 = 0u; wWidth < uniforms.w_shape[3]; wWidth++) {
            let xWidth = xRCCorner.y + wWidth * uniforms.dilations[1];
            if (xWidth < 0u || xWidth >= uniforms.x_shape[3]) {
              continue;
            }

            let xVal = ${x.get("batch","input_channel","xHeight","xWidth")};
            let wVal = ${I.get("output_channel","wInChannel","wHeight","wWidth")};
            value += xVal * wVal;
          }
        }
      }
      `;return`
  ${v.registerUniforms(z).declareVariables(...C,$)}

  ${v.mainStart()}
    ${v.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}

    let outputIndices = ${$.offsetToIndices("global_idx")};
    let batch: u32 = outputIndices[0];
    let output_channel: u32 = outputIndices[${l?3:1}];
    let xRCCorner: vec2<u32> = vec2<u32>(outputIndices[${l?1:2}], outputIndices[${l?2:3}]) * uniforms.strides - uniforms.pads;
    let group_id: u32 = output_channel * ${h} / uniforms.output_channels_per_group;
    var in_channel_offset = group_id * uniforms.w_shape[${l?2:1}];

    var value: ${$.type.value} = ${$.type.value}(0);
    ${k}
    ${a}
    ${S}
    ${$.setByOffset("global_idx","value")}
  }`};return{name:"GroupedConv",shaderCache:{hint:`${t.cacheKey}_${h}`,inputDependencies:m},getRunData:()=>({outputs:[{dims:i?i(r):r,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(f/64)},programUniforms:g}),getShaderSource:b}},ff=(e,t,r,i)=>{let n=e.length>2,a=Te(r[3]),s=Te(r[2]),o=N.size(r)/a/s,l=[e[0].dims[0],e[0].dims[1],e[0].dims[2],e[0].dims[3]/a],d=[e[1].dims[0],e[1].dims[1],e[1].dims[2],e[1].dims[3]/a],p=[r[0],r[1],r[2],r[3]/a],h=[{type:12,data:o},{type:6,data:[t.strides[0],t.strides[1]]},{type:6,data:[t.pads[0],t.pads[1]]}];Wt(t,h),h.push(...re(l,d,p));let f=(s-1)*t.strides[1]+d[1],g=m=>{let b=ee("output",e[0].dataType,p.length,a),v=Me(b.type.tensor),$=qt(t,b.type.value,v),w=U("x",e[0].dataType,l.length,a),S=U("w",e[1].dataType,d.length,a),x=[w,S];n&&x.push(U("b",e[2].dataType,e[2].dims,a));let I=n?"value += b[output_channel];":"",C=[{name:"output_size",type:"u32"},{name:"strides",type:"i32",length:2},{name:"pads",type:"i32",length:2}];return Gt(t,C),`
  ${m.registerUniforms(C).declareVariables(...x,b)}
  ${m.mainStart()}
    ${m.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
    let width0 = uniforms.output_shape[3];
    let output_channel = global_idx % width0;
    var index1 = global_idx / width0;
    let width1 = uniforms.output_shape[2] / ${s}u;
    let col = (index1 % width1) * ${s}u;
    index1 = index1 / width1;
    let row = index1 % uniforms.output_shape[1];
    let batch = index1 / uniforms.output_shape[1];

    let x_corner = vec2<i32>(i32(row), i32(col)) * uniforms.strides - uniforms.pads;

    var x_vals: array<${w.type.value}, ${f}>;
    var values: array<${b.type.value}, ${s}>;
    let input_channel = output_channel;
    // Use constant instead of uniform can give better performance for w's height/width.
    for (var w_height: u32 = 0u; w_height < ${d[0]}; w_height++) {
      let x_height = x_corner.x + i32(w_height);
      if (x_height >= 0 && u32(x_height) < uniforms.x_shape[1]) {
        for (var i = 0; i < ${f}; i++) {
          let x_width = x_corner.y + i;
          if (x_width >= 0 && u32(x_width) < uniforms.x_shape[2]) {
            x_vals[i] = ${w.get("batch","u32(x_height)","u32(x_width)","input_channel")};
          } else {
            x_vals[i] = ${w.type.value}(0);
          }
        }
        for (var w_width: u32 = 0u; w_width < ${d[1]}; w_width++) {
          let w_val = ${S.get("w_height","w_width","0","output_channel")};
          for (var i = 0u; i < ${s}u; i++) {
            values[i] = fma(x_vals[i * u32(uniforms.strides[1]) + w_width], w_val, values[i]);
          }
        }
      }
    }

    for (var i = 0u; i < ${s}u; i++) {
      var value = values[i];
      ${I}
      ${$}
      ${b.set("batch","row","col + i","output_channel","value")};
    }
  }`};return{name:"GroupedConv-Vectorize",shaderCache:{hint:`${t.cacheKey};${a};${s};${f};${d[0]};${d[1]}`,inputDependencies:n?["rank","rank","type"]:["rank","rank"]},getRunData:()=>({outputs:[{dims:i?i(r):r,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(o/64)},programUniforms:h}),getShaderSource:g}}}),kl,Kr,Tl,Xr,da,_n,Il,El,pa,o_=F(()=>{ne(),n_(),a_(),Wa(),s_(),Ft(),qa(),Tt(),kl=(e,t,r,i,n,a)=>{let s=e[0],o=e.slice(a?1:2,a?3:4),l=o.length,d=t[0],p=t.slice(2).map((f,g)=>f+(f-1)*(r[g]-1)),h=o.map((f,g)=>f+i[g]+i[g+l]).map((f,g)=>Math.floor((f-p[g]+n[g])/n[g]));return h.splice(0,0,s),h.splice(a?3:1,0,d),h},Kr=[2,3,1,0],Tl=(e,t)=>{if(!e||e.length!==2&&e.length!==3)throw new Error("Conv requires 2 or 3 inputs");if(e[0].dims.length>5)throw new Error("greater than 5D is not supported");if(e[0].dims.length!==e[1].dims.length)throw new Error("filter does not have same dimension as input");let r=e[0].dims[t.format==="NHWC"?e[0].dims.length-1:1],i=e[1].dims[1]*t.group;if(r!==i)throw new Error("FILTER_IN_CHANNEL should be equal to DATA_CHANNEL");if(e.length===3&&(e[2].dims.length!==1||e[1].dims[0]!==e[2].dims[0]))throw new Error("invalid bias");let n=e[0].dims.length-2;if(t.dilations.length!==n)throw new Error(`dilations should be ${n}D`);if(t.strides.length!==n)throw new Error(`strides should be ${n}D`);if(t.pads.length!==n*2)throw new Error(`pads should be ${n*2}D`);if(t.kernelShape.length!==0&&t.kernelShape.length!==e[1].dims.length-2)throw new Error("invalid kernel shape")},Xr=(e,t)=>{let r=e.kernelShape.slice();r.length<t[1].dims.length-2&&r.push(...Array(t[1].dims.length-2-r.length).fill(0));for(let a=2;a<t[1].dims.length;++a)r[a-2]===0&&(r[a-2]=t[1].dims[a]);let i=e.pads.slice();di.adjustPadsBasedOnAutoPad(t[0].dims,e.strides,e.dilations,r,i,e.format==="NHWC",e.autoPad);let n=Object.assign({},e);return Object.assign(n,{kernelShape:r,pads:i}),n},da=e=>{let t=Pa(e),r=e.format,i=["NOTSET","VALID","SAME_UPPER","SAME_LOWER"][e.auto_pad],n=e.dilations,a=e.group,s=e.kernel_shape,o=e.pads,l=e.strides,d=e.w_is_const();return{autoPad:i,format:r,dilations:n,group:a,kernelShape:s,pads:o,strides:l,wIsConst:d,...t,cacheKey:`${e.format};${t.activation};`}},_n=(e,t,r,i)=>{let n=r.format==="NHWC",a=kl(t[0].dims,t[1].dims,r.dilations,r.pads,r.strides,n);if(r.group!==1){let C=[t[0]];if(n){let z=e.kernelCustomData.wT??e.compute(Ge(t[1],Kr),{inputs:[1],outputs:[r.wIsConst?-2:-1]})[0];r.wIsConst&&!e.kernelCustomData.wT&&(e.kernelCustomData.wT=z),C.push(z)}else C.push(t[1]);t.length===3&&C.push(t[2]),!e.adapterInfo.isArchitecture("ampere")&&n&&t[1].dims[0]===r.group&&t[1].dims[1]===1&&r.dilations[0]===1&&r.dilations[1]===1?e.compute(ff(C,r,a,i),{inputs:C}):e.compute(hf(C,r,a,i),{inputs:C});return}let s=t.length===3,o=t[0].dims[n?1:2],l=t[0].dims[n?2:3],d=t[0].dims[n?3:1],p=t[1].dims[2],h=t[1].dims[3],f=a[n?1:2],g=a[n?2:3],m=a[n?3:1],b=n&&p===o&&h===l&&r.pads[0]===0&&r.pads[1]===0;if(b||p===1&&h===1&&r.dilations[0]===1&&r.dilations[1]===1&&r.strides[0]===1&&r.strides[1]===1&&r.pads[0]===0&&r.pads[1]===0){let C=a[0],z,k,D,L=[];if(n){let G=e.kernelCustomData.wT??e.compute(Ge(t[1],Kr),{inputs:[1],outputs:[r.wIsConst?-2:-1]})[0];if(r.wIsConst&&!e.kernelCustomData.wT&&(e.kernelCustomData.wT=G),b){let M=o*l*d;z=t[0].reshape([1,C,M]),k=G.reshape([1,M,m]),D=[1,C,m]}else z=t[0].reshape([C,o*l,d]),k=G.reshape([1,d,m]),D=[C,f*g,m];L.push(z),L.push(k)}else z=t[0].reshape([C,d,o*l]),k=t[1].reshape([1,m,d]),D=[C,m,f*g],L.push(k),L.push(z);s&&L.push(t[2]);let j=D[2],O=L[0].dims[L[0].dims.length-1];j<8&&O<8?e.compute(La(L,r,a,D,n,i),{inputs:L}):e.compute(ci(L,r,a,D,n,i),{inputs:L});return}let v=!0,$=e.kernelCustomData.wT??e.compute(Ge(t[1],Kr),{inputs:[1],outputs:[r.wIsConst?-2:-1]})[0];r.wIsConst&&!e.kernelCustomData.wT&&(e.kernelCustomData.wT=$);let w=[t[0],$];s&&w.push(t[2]);let S=n?f*g:m,x=n?m:f*g,I=p*h*d;e.compute(df(w,r,a,S,x,I,s,v,i),{inputs:w})},Il=(e,t)=>{let r=t.format==="NHWC",i=[e.inputs[0].reshape(r?[e.inputs[0].dims[0],1,e.inputs[0].dims[1],e.inputs[0].dims[2]]:[e.inputs[0].dims[0],e.inputs[0].dims[1],1,e.inputs[0].dims[2]]),e.inputs[1].reshape([e.inputs[1].dims[0],e.inputs[1].dims[1],1,e.inputs[1].dims[2]])];e.inputs.length===3&&i.push(e.inputs[2]);let n=[0,t.pads[0],0,t.pads[1]],a=[1].concat(t.strides),s=[1].concat(t.dilations),o=[1].concat(t.kernelShape),l=Xr({...t,pads:n,strides:a,dilations:s,kernelShape:o},i);_n(e,i,l,d=>r?[d[0],d[2],d[3]]:[d[0],d[1],d[3]])},El=(e,t,r)=>{let i=r.format==="NHWC"?"channelsLast":"channelsFirst",n=Xr(r,t),a=r.autoPad==="NOTSET"?r.pads:r.autoPad,s=pf(t[0].dims,t[1].dims,r.strides,r.dilations,a,!1,i);e.compute(cf(t,n,s.outShape,[s.filterDepth,s.filterHeight,s.filterWidth],[s.padInfo.front,s.padInfo.top,s.padInfo.left],i))},pa=(e,t)=>{if(Tl(e.inputs,t),e.inputs[0].dims.length===3)Il(e,t);else if(e.inputs[0].dims.length===5)El(e,e.inputs,t);else{let r=Xr(t,e.inputs);_n(e,e.inputs,r)}}}),mf,u_=F(()=>{ie(),gt(),ne(),ae(),mf=(e,t,r)=>{let i=e.length>2,n=t.outputShape,a=t.format==="NHWC",s=t.group,o=e[1].dims,l=o[2]/s,d=o[3],p=a?Te(l):1,h=a&&d===1&&l>=4,f=h?Math.floor(l/4)*4:Math.floor(l/p)*p,g=l-f,m=a?Te(d):1,b=a?d===1?p:m:1,v=N.size(n)/m,$=[Math.ceil(v/64),1,1];ce("verbose",()=>`[conv2d_backprop_webgpu] dispatch = ${$}`);let w=["rank","rank"],S=[t.strides[0],t.strides[1]],x=[t.kernelShape[a?1:2],t.kernelShape[a?2:3]],I=[t.dilations[0],t.dilations[1]],C=[x[0]+(t.dilations[0]<=1?0:(t.kernelShape[a?1:2]-1)*(t.dilations[0]-1)),x[1]+(t.dilations[1]<=1?0:(t.kernelShape[a?2:3]-1)*(t.dilations[1]-1))],z=[C[0]-1-Math.floor((t.pads[0]+t.pads[2])/2),C[1]-1-Math.floor((t.pads[1]+t.pads[3])/2)],k=[{type:12,data:v},{type:12,data:S},{type:12,data:x},{type:12,data:I},{type:12,data:C},{type:6,data:z},{type:12,data:f},{type:12,data:l},{type:12,data:d},...re(e[0].dims,e[1].dims)];i&&(k.push(...re(e[2].dims)),w.push("rank")),k.push(...re(n));let D=L=>{let j=[{name:"output_size",type:"u32"},{name:"strides",type:"u32",length:S.length},{name:"filter_dims",type:"u32",length:x.length},{name:"dilations",type:"u32",length:x.length},{name:"effective_filter_dims",type:"u32",length:C.length},{name:"pads",type:"i32",length:z.length},{name:"input_channels_per_group_int",type:"u32"},{name:"input_channels_per_group",type:"u32"},{name:"output_channels_per_group",type:"u32"}],O=Me(e[0].dataType),G=a?1:2,M=a?2:3,B=a?3:1,V=U("W",e[1].dataType,e[1].dims.length,b),Y=U("Dy",e[0].dataType,e[0].dims.length,p),q=[Y,V];i&&q.push(U("bias",e[2].dataType,[n[B]].length,m));let H=ee("result",e[0].dataType,n.length,m),X=()=>{let Q="";if(h)p===4?Q+=`
        let xValue = ${Y.getByOffset("x_offset")};
        let wValue = ${V.getByOffset("w_offset")};
        dotProd = dotProd + dot(xValue, wValue);
        x_offset += 1u;
        w_offset += 1u;`:p===2?Q+=`
          dotProd = dotProd + dot(vec4<${O}>(${Y.getByOffset("x_offset")}, ${Y.getByOffset("x_offset + 1u")}), vec4<${O}>(${V.getByOffset("w_offset")}, ${V.getByOffset("w_offset + 1u")}));
          x_offset += 2u;
          w_offset += 2u;`:p===1&&(Q+=`
          dotProd = dotProd + dot(vec4<${O}>(${Y.getByOffset("x_offset")}, ${Y.getByOffset("x_offset + 1u")}, ${Y.getByOffset("x_offset + 2u")}, ${Y.getByOffset("x_offset + 3u")}), vec4<${O}>(${V.getByOffset("w_offset")}, ${V.getByOffset("w_offset + 1u")}, ${V.getByOffset("w_offset + 2u")}, ${V.getByOffset("w_offset + 3u")}));
          x_offset += 4u;
          w_offset += 4u;`);else if(Q+=`
                  let xValue = ${a?Y.getByOffset(`${Y.indicesToOffset(`${Y.type.indices}(batch, idyR, idyC, inputChannel)`)} / ${p}`):Y.get("batch","inputChannel","idyR","idyC")};
        `,p===1)Q+=`
          let w_offset = ${V.indicesToOffset(`${V.type.indices}(u32(wRPerm), u32(wCPerm), inputChannel, wOutChannel)`)};
          let wValue = ${V.getByOffset(`w_offset / ${b}`)};
          dotProd = dotProd + xValue * wValue;`;else for(let R=0;R<p;R++)Q+=`
            let wValue${R} = ${V.getByOffset(`${V.indicesToOffset(`${V.type.indices}(u32(wRPerm), u32(wCPerm), inputChannel + ${R}, wOutChannel)`)} / ${b}`)};
            dotProd = dotProd + xValue[${R}] * wValue${R};`;return Q},W=()=>{if(g===0)return"";if(!h)throw new Error(`packInputAs4 ${h} is not true.`);let Q="";if(p===1){Q+="dotProd = dotProd";for(let R=0;R<g;R++)Q+=`
            + ${Y.getByOffset(`x_offset + ${R}`)} * ${V.getByOffset(`w_offset + ${R}`)}`;Q+=";"}else if(p===2){if(g!==2)throw new Error(`Invalid inputChannelsRemainder ${g}.`);Q+=`
          let xValue = ${Y.getByOffset("x_offset")};
          let wValue = ${V.getByOffset("w_offset")};
          dotProd = dotProd + dot(xValue, wValue);`}return Q},J=`
            let outputIndices = ${H.offsetToIndices(`global_idx * ${m}`)};
            let batch = ${H.indicesGet("outputIndices",0)};
            let d1 = ${H.indicesGet("outputIndices",B)};
            let r = ${H.indicesGet("outputIndices",G)};
            let c = ${H.indicesGet("outputIndices",M)};
            let dyCorner = vec2<i32>(i32(r), i32(c)) - uniforms.pads;
            let dyRCorner = dyCorner.x;
            let dyCCorner = dyCorner.y;
            let groupId = d1 / uniforms.output_channels_per_group;
            let wOutChannel = d1 - groupId * uniforms.output_channels_per_group;
            // Convolve dy(?, ?, d2) with w(:, :, d1, d2) to compute dx(xR, xC, d1).
            // ? = to be determined. : = across all values in that axis.
            var dotProd = ${H.type.value}(0.0);
            var wR: u32 = 0;
            if (uniforms.dilations.x == 1) {
              // Minimum wR >= 0 that satisfies (dyRCorner + wR) % (uniforms.strides.x) == 0
              wR = u32(((dyRCorner + i32(uniforms.strides.x) - 1) / i32(uniforms.strides.x)) * i32(uniforms.strides.x) - dyRCorner);
            }
            for (; wR < uniforms.effective_filter_dims.x; wR = wR + 1) {
              if (wR % uniforms.dilations.x != 0) {
                continue;
              }
              let dyR = (${O}(dyRCorner) + ${O}(wR)) / ${O}(uniforms.strides[0]);
              let wRPerm = uniforms.filter_dims.x - 1 - wR / uniforms.dilations.x;
              if (dyR < 0.0 || dyR >= ${O}(uniforms.Dy_shape[${G}]) || fract(dyR) > 0.0 ||
                  wRPerm < 0) {
                continue;
              }
              let idyR: u32 = u32(dyR);
              var wC: u32 = 0;
              if (uniforms.dilations.y == 1) {
                // Minimum wC >= 0 that satisfies (dyCCorner + wC) % (uniforms.strides.y) == 0
                wC = u32(((dyCCorner + i32(uniforms.strides.y) - 1) / i32(uniforms.strides.y)) * i32(uniforms.strides.y) - dyCCorner);
              }
              for (; wC < uniforms.effective_filter_dims.y; wC = wC + 1) {
                if (wC % uniforms.dilations.y != 0) {
                  continue;
                }
                let dyC = (${O}(dyCCorner) + ${O}(wC)) / ${O}(uniforms.strides.y);
                let wCPerm = uniforms.filter_dims.y - 1 - wC / uniforms.dilations.y;
                if (dyC < 0.0 || dyC >= ${O}(uniforms.Dy_shape[${M}]) ||
                    fract(dyC) > 0.0 || wCPerm < 0) {
                  continue;
                }
                let idyC: u32 = u32(dyC);
                var inputChannel = groupId * uniforms.input_channels_per_group;
                ${h?`
                var x_offset = ${Y.indicesToOffset(`${Y.type.indices}(batch, idyR, idyC, inputChannel)`)} / ${p};
                var w_offset = ${V.indicesToOffset(`${V.type.indices}(wRPerm, wCPerm, inputChannel, wOutChannel)`)} / ${b};
                  `:""}
                for (var d2: u32 = 0; d2 < uniforms.input_channels_per_group_int; d2 = d2 + ${h?4:p}) {
                  ${X()}
                  inputChannel = inputChannel + ${h?4:p};
                }
                ${W()}
                wC = wC + uniforms.strides.y - 1;
              }
              wR = wR + uniforms.strides[0] - 1;
            }
            let value = dotProd${i?` + bias[d1 / ${m}]`:""};
            ${H.setByOffset("global_idx","value")};
          `;return`
    ${L.registerUniforms(j).declareVariables(...q,H)}
      ${L.mainStart()}
      ${L.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")};
    ${J}}`};return{name:"ConvTranspose2D",shaderCache:{hint:`${t.cacheKey};${p}${b}${m}${h}${g}`,inputDependencies:w},getRunData:()=>({dispatchGroup:{x:$[0],y:$[1],z:$[2]},outputs:[{dims:r?r(n):n,dataType:e[0].dataType}],programUniforms:k}),getShaderSource:D}}}),Cl,zl,Al,bn,gf,Ml,wn,Ol,yf,l_=F(()=>{u_(),Ft(),Tt(),Cl=(e,t,r,i,n,a)=>(e-1)*t+r+(i-1)*n+1-a,zl=(e,t,r,i,n)=>{let a=Math.floor(e/2);t==="SAME_UPPER"?(r[i]=a,r[n]=e-a):t==="SAME_LOWER"&&(r[i]=e-a,r[n]=a)},Al=(e,t,r,i,n,a,s,o,l,d)=>{let p=e.length-2,h=d.length===0;l.length<p&&l.push(...Array(p-l.length).fill(0));let f=e[0],g=t[o?3:1]*n;for(let m=0,b=e.length-p-(o?1:0);m<p;++m,++b){let v=e[b],$=h?v*s[m]:d[m],w=Cl(v,s[m],a[m],t[b],r[m],$);zl(w,i,a,m,m+p),h&&d.push(s[m]*(v-1)+l[m]+(t[b]-1)*r[m]+1-a[m]-a[m+p])}d.splice(0,0,f),d.splice(o?3:1,0,g)},bn=(e,t)=>{let r=e.kernelShape.slice();if(e.kernelShape.length===0||e.kernelShape.reduce((h,f)=>h*f,1)===0){r.length=0;for(let h=2;h<t[1].dims.length;++h)r.push(t[1].dims[h])}let i=e.format==="NHWC";r.splice(0,0,t[1].dims[0]),r.splice(i?3:1,0,t[1].dims[1]);let n=e.pads.slice(),a=e.outputShape.slice(),s=e.outputPadding.slice(),o=t[0].dims,l=e.dilations.slice();if(l.reduce((h,f)=>h+f,0)===0){let h=t[0].dims.length-2;l=new Array(h).fill(1)}let d=e.strides.slice();if(d.reduce((h,f)=>h+f,0)===0){let h=t[0].dims.length-2;d=new Array(h).fill(1)}Al(o,r,l,e.autoPad,e.group,n,d,i,s,a);let p=Object.assign({},e);return Object.assign(p,{kernelShape:r,pads:n,outputPadding:s,outputShape:a,dilations:l,strides:d}),p},gf=e=>{let t=Pa(e),r=e.format,i=["NOTSET","VALID","SAME_UPPER","SAME_LOWER"][typeof e.autoPad>"u"?0:e.autoPad],n=e.dilations,a=e.group??1,s=e.kernelShape,o=e.pads,l=e.strides,d=e.wIsConst(),p=e.outputPadding,h=e.outputShape;return{autoPad:i,format:r,dilations:n,group:a,kernelShape:s,outputPadding:p,outputShape:h,pads:o,strides:l,wIsConst:d,...t,cacheKey:`${e.format};${t.activation};`}},Ml=(e,t)=>{if(!e||e.length!==2&&e.length!==3)throw new Error("Conv requires 2 or 3 inputs");if(e[0].dims.length!==4&&e[0].dims.length!==3)throw new Error("currently only support 2-dimensional conv");if(e[0].dims.length!==e[1].dims.length)throw new Error("filter does not have same dimension as input");let r=e[0].dims[t.format==="NHWC"?e[0].dims.length-1:1],i=e[1].dims[0];if(r!==i)throw new Error("FILTER_IN_CHANNEL should be equal to DATA_CHANNEL");let n=e[1].dims[1]*t.group;if(e.length===3&&(e[2].dims.length!==1||e[2].dims[0]!==n))throw new Error("invalid bias");let a=e[0].dims.length-2;if(t.dilations.reduce((s,o)=>s+o,0)>0&&t.dilations.length!==a)throw new Error(`dilations should be ${a}D`);if(t.strides.reduce((s,o)=>s+o,0)>0&&t.strides.length!==a)throw new Error(`strides should be ${a}D`);if(t.pads.reduce((s,o)=>s+o,0)>0&&t.pads.length!==a*2)throw new Error(`pads should be ${a*2}D`);if(t.outputPadding.length!==a&&t.outputPadding.length!==0)throw new Error(`output_padding should be ${a}D`);if(t.kernelShape.reduce((s,o)=>s+o,0)>0&&t.kernelShape.length!==0&&t.kernelShape.length!==e[1].dims.length-2)throw new Error("invalid kernel shape");if(t.outputShape.length!==0&&t.outputShape.length!==e[0].dims.length-2)throw new Error("invalid output shape")},wn=(e,t,r,i)=>{let n=e.kernelCustomData.wT??e.compute(Ge(t[1],[2,3,0,1]),{inputs:[1],outputs:[r.wIsConst?-2:-1]})[0];r.wIsConst&&!e.kernelCustomData.wT&&(e.kernelCustomData.wT=n);let a=[t[0],n];t.length===3&&a.push(t[2]),e.compute(mf(a,r,i),{inputs:a})},Ol=(e,t)=>{let r=t.format==="NHWC",i=[e.inputs[0].reshape(r?[e.inputs[0].dims[0],1,e.inputs[0].dims[1],e.inputs[0].dims[2]]:[e.inputs[0].dims[0],e.inputs[0].dims[1],1,e.inputs[0].dims[2]]),e.inputs[1].reshape([e.inputs[1].dims[0],e.inputs[1].dims[1],1,e.inputs[1].dims[2]])];e.inputs.length===3&&i.push(e.inputs[2]);let n=t.kernelShape;(n.length===0||n[0]===0)&&(n=[e.inputs[1].dims[2]]);let a=t.dilations;(a.length===0||a[0]===0)&&(a=[1]);let s=t.strides;(s.length===0||s[0]===0)&&(s=[1]);let o=t.pads;o.length===0&&(o=[0,0]),o=[0,o[0],0,o[1]],s=[1].concat(s),a=[1].concat(a),n=[1].concat(n);let l=t.outputPadding;l=[0].concat(l);let d=bn({...t,pads:o,strides:s,dilations:a,kernelShape:n,outputPadding:l},i);wn(e,i,d,p=>r?[p[0],p[2],p[3]]:[p[0],p[1],p[3]])},yf=(e,t)=>{if(Ml(e.inputs,t),e.inputs[0].dims.length===3)Ol(e,t);else{let r=bn(t,e.inputs);wn(e,e.inputs,r)}}}),Rl,_f,bf,d_=F(()=>{ie(),ne(),Ce(),ae(),Rl=(e,t,r,i)=>{let n=N.size(t),a=t.length,s=U("input",e,a),o=ee("output",e,a),l=r.dataType===6?r.getInt32Array()[0]:Number(r.getBigInt64Array()[0]),d=N.normalizeAxis(l,a),p=h=>{let f=` i32(${s.indicesGet("inputIndices","uniforms.axis")}) `,g=te("uniforms.input_shape","uniforms.axis",a),m=i.reverse?f+(i.exclusive?" + 1":""):"0",b=i.reverse?g:f+(i.exclusive?"":" + 1");return`
                ${h.registerUniform("outputSize","u32").registerUniform("axis","u32").declareVariables(s,o)}
                ${h.mainStart()}
                  ${h.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}
                  var inputIndices = ${o.offsetToIndices("global_idx")};
                  var sum = ${o.type.value}(0);
                  let first : i32 = ${m};
                  let last : i32 = ${b};
                  for (var i : i32 = first; i < last; i++) {
                    ${s.indicesSet("inputIndices","uniforms.axis","u32(i)")};
                    sum = sum + ${s.getByIndices("inputIndices")};
                  }
                  ${o.setByOffset("global_idx","sum")};
                }`};return{name:"CumSum",shaderCache:{hint:i.cacheKey,inputDependencies:["rank"]},getRunData:()=>({outputs:[{dims:t,dataType:e}],dispatchGroup:{x:Math.ceil(n/64)},programUniforms:[{type:12,data:n},{type:12,data:d},...re(t,t)]}),getShaderSource:p}},_f=(e,t)=>{let r=e.inputs[0].dims,i=e.inputs[0].dataType,n=e.inputs[1];e.compute(Rl(i,r,n,t),{inputs:[0]})},bf=e=>{let t=e.exclusive===1,r=e.reverse===1;return me({exclusive:t,reverse:r})}}),Nl,Bl,Dl,wf,$f,p_=F(()=>{ie(),ne(),Ce(),ae(),Nl=e=>{if(!e||e.length!==1)throw new Error("DepthToSpace requires 1 input.");if(e[0].dims.length!==4)throw new Error("DepthToSpace requires 4D input.")},Bl=(e,t,r,i)=>{let n=[];n.push(`fn perm(i: ${i.type.indices}) -> ${r.type.indices} {
    var a: ${r.type.indices};`);for(let a=0;a<t;++a)n.push(r.indicesSet("a",e[a],`i[${a}]`));return n.push("return a;}"),n.join(`
`)},Dl=(e,t)=>{let r,i,n,a,s,o,l=t.format==="NHWC",d=t.blocksize,p=t.mode==="DCR";l?([r,i,n,a]=e.dims,s=p?[r,i,n,d,d,a/d**2]:[r,i,n,a/d**2,d,d],o=p?[0,1,3,2,4,5]:[0,1,4,2,5,3]):([r,i,n,a]=[e.dims[0],e.dims[2],e.dims[3],e.dims[1]],s=p?[r,d,d,a/d**2,i,n]:[r,a/d**2,d,d,i,n],o=p?[0,3,4,1,5,2]:[0,1,4,2,5,3]);let h=e.reshape(s),f=h.dims.length,g=e.dataType,m=U("a",g,f),b=ee("output",g,f),v=$=>`
  ${$.registerUniform("output_size","u32").declareVariables(m,b)}

  ${Bl(o,f,m,b)}

  ${$.mainStart()}
    ${$.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}

    let indices = ${b.offsetToIndices("global_idx")};
    let aIndices = perm(indices);

    ${b.setByOffset("global_idx",m.getByIndices("aIndices"))}
  }`;return{name:"DepthToSpace",shaderCache:{hint:`${e.dims};${t.blocksize};${t.mode}`,inputDependencies:["rank"]},getRunData:$=>{let w=l?[r,i*d,n*d,a/d**2]:[r,a/d**2,i*d,n*d],S=N.size(w),x=h.dims,I=N.sortBasedOnPerm(x,o);return{outputs:[{dims:w,dataType:$[0].dataType}],dispatchGroup:{x:Math.ceil(S/64)},programUniforms:[{type:12,data:S},...re(x,I)]}},getShaderSource:v}},wf=(e,t)=>{Nl(e.inputs),e.compute(Dl(e.inputs[0],t))},$f=e=>me({blocksize:e.blocksize,mode:e.mode,format:e.format})}),Zr,hr,$n,Pl,Ul,Ll,ql,vn,Wl,vf,xf,c_=F(()=>{ie(),ne(),Ce(),ae(),Zr="[a-zA-Z]|\\.\\.\\.",hr="("+Zr+")+",$n="^"+hr+"$",Pl="("+hr+",)*"+hr,Ul="^"+Pl+"$",Ll=class{constructor(e=-1){this.symbolToIndices=new Map,this.inputIndex=e}addSymbol(e,t){let r=this.symbolToIndices.get(e);r===void 0?r=[t]:r.push(t),this.symbolToIndices.set(e,r)}},ql=class{constructor(e,t){this.equation=t,this.hasEllipsis=!1,this.symbolToInfo=new Map,this.lhs=new Array,this.outputDims=[];let[r,i]=t.includes("->")?t.split("->",2):[t,""];if(!r.match(RegExp(Ul)))throw new Error("Invalid LHS term");if(r.split(",").forEach((n,a)=>{let s=e[a].dims.slice();if(!n.match(RegExp($n)))throw new Error("Invalid LHS term");let o=this.processTerm(n,!0,s,a);this.lhs.push(o)}),i==="")i+=[...this.symbolToInfo.entries()].filter(([n,a])=>a.count===1||n==="...").map(([n])=>n).join("");else if(!i.match(RegExp(hr)))throw new Error("Invalid RHS");i.match(RegExp(Zr,"g"))?.forEach(n=>{if(n==="...")this.outputDims=this.outputDims.concat(this.ellipsisDims);else{let a=this.symbolToInfo.get(n);if(a===void 0)throw new Error("Invalid RHS symbol");this.outputDims.push(a.dimValue)}}),this.rhs=this.processTerm(i,!1,this.outputDims)}addSymbol(e,t,r){let i=this.symbolToInfo.get(e);if(i!==void 0){if(i.dimValue!==t&&i.count!==1)throw new Error("Dimension mismatch");i.count++,i.inputIndices.push(r)}else i={count:1,dimValue:t,inputIndices:[r]};this.symbolToInfo.set(e,i)}processTerm(e,t,r,i=-1){let n=r.length,a=!1,s=[],o=0;if(!e.match(RegExp($n))&&!t&&e!=="")throw new Error("Invalid LHS term");let l=e.match(RegExp(Zr,"g")),d=new Ll(i);return l?.forEach((p,h)=>{if(p==="..."){if(a)throw new Error("Only one ellipsis is allowed per input term");a=!0;let f=n-l.length+1;if(f<0)throw new Error("Ellipsis out of bounds");if(s=r.slice(o,o+f),this.hasEllipsis){if(this.ellipsisDims.length!==s.length||this.ellipsisDims.toString()!==s.toString())throw new Error("Ellipsis dimensions mismatch")}else if(t)this.hasEllipsis=!0,this.ellipsisDims=s;else throw new Error("Ellipsis must be specified in the LHS");for(let g=0;g<s.length;g++){let m=String.fromCharCode(48+g);d.addSymbol(m,h+g),this.addSymbol(m,r[o++],i)}}else d.addSymbol(p,h+(this.hasEllipsis?this.ellipsisDims.length-1:0)),this.addSymbol(p,r[o++],i)}),d}},vn=e=>e+"_max",Wl=(e,t,r,i)=>{let n=e.map(d=>d.length).map((d,p)=>U(`input${p}`,t,d)),a=N.size(i),s=ee("output",t,i.length),o=[...r.symbolToInfo.keys()].filter(d=>!r.rhs.symbolToIndices.has(d)),l=d=>{let p=[],h="var prod = 1.0;",f="var sum = 0.0;",g="sum += prod;",m=[],b=[],v=[],$=[],w=r.symbolToInfo.size===r.rhs.symbolToIndices.size;r.symbolToInfo.forEach((x,I)=>{if(r.rhs.symbolToIndices.has(I)){let C=r.rhs.symbolToIndices.get(I)?.[0];C!==void 0&&r.lhs.forEach((z,k)=>{if(x.inputIndices.includes(k)){let D=z.symbolToIndices.get(I);if(D===void 0)throw new Error("Invalid symbol error");D.forEach(L=>{p.push(`${n[k].indicesSet(`input${k}Indices`,L,s.indicesGet("outputIndices",C))}`)})}})}else r.lhs.forEach((C,z)=>{if(x.inputIndices.includes(z)){let k=C.symbolToIndices.get(I);if(k===void 0)throw new Error("Invalid symbol error");k.forEach(D=>{m.push(`${n[z].indicesSet(`input${z}Indices`,D,`${I}`)}`)}),$.push(`prod *= ${n[z].getByIndices(`input${z}Indices`)};`)}}),b.push(`for(var ${I}: u32 = 0; ${I} < uniforms.${vn(I)}; ${I}++) {`),v.push("}")});let S=w?[...p,`let sum = ${n.map((x,I)=>x.getByIndices(`input${I}Indices`)).join(" * ")};`]:[...p,f,...b,...m,h,...$,g,...v];return`
            ${d.registerUniforms(o.map(x=>({name:`${vn(x)}`,type:"u32"}))).registerUniform("outputSize","u32").declareVariables(...n,s)}

            ${d.mainStart()}
            ${d.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}
            var outputIndices = ${s.offsetToIndices("global_idx")};
            ${n.map((x,I)=>`var input${I}Indices: ${n[I].type.indices};`).join(`
`)}
            ${S.join(`
`)};
            ${s.setByOffset("global_idx","sum")};
          }`};return{name:"Einsum",shaderCache:{hint:r.equation,inputDependencies:e.map(()=>"rank")},getRunData:()=>{let d=o.filter(h=>r.symbolToInfo.has(h)).map(h=>({type:12,data:r.symbolToInfo.get(h)?.dimValue||0}));d.push({type:12,data:a});let p=e.map((h,f)=>[...re(h)]).reduce((h,f)=>h.concat(f),d);return p.push(...re(i)),{outputs:[{dims:i,dataType:t}],dispatchGroup:{x:Math.ceil(a/64)},programUniforms:p}},getShaderSource:l}},vf=(e,t)=>{let r=new ql(e.inputs,t.equation),i=r.outputDims,n=e.inputs.map((a,s)=>a.dims);e.compute(Wl(n,e.inputs[0].dataType,r,i))},xf=e=>{let t=e.equation.replace(/\s+/g,"");return me({equation:t})}}),Gl,xn,Vl,Fl,Sf,h_=F(()=>{ie(),ne(),ae(),Gl=e=>{if(!e||e.length!==2)throw new Error("Expand requires 2 input.");let t=e[0].dims,r=Array.from(e[1].getBigInt64Array(),Number),i=r.length<t.length?0:r.length-t.length,n=t.length<r.length?0:t.length-r.length;for(;i<r.length&&n<t.length;++i,++n)if(r[i]!==t[n]&&r[i]!==1&&t[n]!==1)throw new Error("Expand requires shape to be broadcastable to input")},xn=(e,t)=>{let r=e.length-t.length,i=[];for(let n=0;n<r;++n)i.push(e[n]);for(let n=0;n<t.length;++n)i.push(t[n]===1?e[n+r]:t[n]);return i},Vl=(e,t)=>e.length>t.length?xn(e,t):xn(t,e),Fl=e=>{let t=e[0].dims,r=Array.from(e[1].getBigInt64Array(),Number),i=Vl(t,r),n=e[0].dataType,a=n===9||N.size(t)===1,s=n===9||t.length>0&&t[t.length-1]%4===0?4:1,o=a||i.length>0&&i[i.length-1]%4===0?4:1,l=Math.ceil(N.size(i)/o),d=h=>{let f=U("input",n,t.length,s),g=ee("output",n,i.length,o),m;if(n===9){let b=(v,$,w="")=>`
          let outputIndices${$} = ${g.offsetToIndices(`outputOffset + ${$}u`)};
          let offset${$} = ${f.broadcastedIndicesToOffset(`outputIndices${$}`,g)};
          let index${$} = offset${$} / 4u;
          let component${$} = offset${$} % 4u;
          ${v}[${$}] = ${w}(${f.getByOffset(`index${$}`)}[component${$}]);
        `;m=`
        let outputOffset = global_idx * ${o};
        var data = vec4<u32>(0);
        ${b("data",0,"u32")}
        ${b("data",1,"u32")}
        ${b("data",2,"u32")}
        ${b("data",3,"u32")}
        ${g.setByOffset("global_idx","data")}
      }`}else m=`
        let outputIndices = ${g.offsetToIndices(`global_idx * ${o}`)};
        let inputOffset = ${f.broadcastedIndicesToOffset("outputIndices",g)};
        let data = ${g.type.value}(${f.getByOffset(`inputOffset / ${s}`)});
        ${g.setByOffset("global_idx","data")}
      }`;return`
    ${h.registerUniform("vec_size","u32").declareVariables(f,g)}
    ${h.mainStart()}
    ${h.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.vec_size")}
    ${m}`},p=[{type:12,data:l},...re(t,i)];return{name:"Expand",shaderCache:{hint:`${i.length};${s}${o}`,inputDependencies:["rank"]},getShaderSource:d,getRunData:()=>({outputs:[{dims:i,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(l/64)},programUniforms:p})}},Sf=e=>{Gl(e.inputs),e.compute(Fl(e.inputs),{inputs:[0]})}}),Hl,kf,f_=F(()=>{ie(),ne(),ae(),Da(),Hl=e=>{let t=e[0].dataType,r=N.size(e[0].dims),i=N.size(e[1].dims),n=i%4===0,a=s=>{let o=U("x",t,[1],4),l=U("bias",t,[1],4),d=ee("y",t,[1],4),p=[{name:"output_vec_size",type:"u32"},{name:"bias_size",type:"u32"}],h=g=>`
      let bias${g}_offset: u32 = (global_idx * 4 + ${g}) % uniforms.bias_size;
      let bias${g} = ${l.getByOffset(`bias${g}_offset / 4`)}[bias${g}_offset % 4];`,f=n?`
      let bias = ${l.getByOffset("global_idx % (uniforms.bias_size / 4)")};`:`${h(0)}${h(1)}${h(2)}${h(3)}
      let bias = ${o.type.value}(bias0, bias1, bias2, bias3);`;return`${s.registerUniforms(p).declareVariables(o,l,d)}

    ${sa(Be(t))}

    ${s.mainStart(rr)}
      ${s.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_vec_size")}

      let x = ${o.getByOffset("global_idx")};
      ${f}
      let x_in = x + bias;
      ${d.setByOffset("global_idx",oa("x_in"))}
    }`};return{name:"FastGeluWithBias",shaderCache:{hint:`${n}`,inputDependencies:["type","type"]},getShaderSource:a,getRunData:s=>({outputs:[{dims:s[0].dims,dataType:s[0].dataType}],programUniforms:[{type:12,data:Math.ceil(r/4)},{type:12,data:i}],dispatchGroup:{x:Math.ceil(r/rr/4)}})}},kf=e=>{e.inputs.length<2||N.size(e.inputs[1].dims)===0?Vh(e):e.compute(Hl(e.inputs))}}),jl,Kl,Tf,If,m_=F(()=>{ie(),ne(),Ce(),ae(),jl=e=>{if(!e||e.length!==2)throw new Error("Gather requires 2 inputs.")},Kl=(e,t)=>{let r=e[0].dims,i=e[1].dims,n=r.length,a=N.normalizeAxis(t.axis,n),s=r.slice(0);s.splice(a,1,...i);let o=r[a],l=e[0].dataType===9?4:1,d=Math.ceil(N.size(s)/l),p=[{type:12,data:d},{type:6,data:o},{type:12,data:a},...re(e[0].dims,e[1].dims,s)],h=f=>{let g=U("data",e[0].dataType,e[0].dims.length,l),m=U("inputIndices",e[1].dataType,e[1].dims.length),b=ee("output",e[0].dataType,s.length,l),v=w=>{let S=i.length,x=`var indicesIndices${w}  = ${m.type.indices}(0);`;for(let I=0;I<S;I++)x+=`${S>1?`indicesIndices${w}[${I}]`:`indicesIndices${w}`} = ${s.length>1?`outputIndices${w}[uniforms.axis + ${I}]`:`outputIndices${w}`};`;x+=`
          var idx${w} = ${m.getByIndices(`indicesIndices${w}`)};
          if (idx${w} < 0) {
            idx${w} = idx${w} + uniforms.axisDimLimit;
          }
          var dataIndices${w} : ${g.type.indices};
        `;for(let I=0,C=0;I<n;I++)I===a?(x+=`${n>1?`dataIndices${w}[${I}]`:`dataIndices${w}`} = u32(idx${w});`,C+=S):(x+=`${n>1?`dataIndices${w}[${I}]`:`dataIndices${w}`} = ${s.length>1?`outputIndices${w}[${C}]`:`outputIndices${w}`};`,C++);return x},$;if(e[0].dataType===9){let w=(S,x,I="")=>`
          let outputIndices${x} = ${b.offsetToIndices(`outputOffset + ${x}u`)};
          ${v(x)};
          let offset${x} = ${g.indicesToOffset(`dataIndices${x}`)};
          let index${x} = offset${x} / 4u;
          let component${x} = offset${x} % 4u;
          ${S}[${x}] = ${I}(${g.getByOffset(`index${x}`)}[component${x}]);
        `;$=`
        let outputOffset = global_idx * ${l};
        var value = vec4<u32>(0);
        ${w("value",0,"u32")}
        ${w("value",1,"u32")}
        ${w("value",2,"u32")}
        ${w("value",3,"u32")}
        ${b.setByOffset("global_idx","value")}
      `}else $=`
      let outputIndices = ${b.offsetToIndices("global_idx")};
      ${v("")};
      let value = ${g.getByIndices("dataIndices")};
      ${b.setByOffset("global_idx","value")};
      `;return`
      ${f.registerUniform("outputSize","u32").registerUniform("axisDimLimit","i32").registerUniform("axis","u32").declareVariables(g,m,b)}
      ${f.mainStart()}
        ${f.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}
        ${$}
      }`};return{name:"Gather",shaderCache:{hint:t.cacheKey,inputDependencies:["rank","rank"]},getRunData:()=>({outputs:[{dims:s,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(d/64)},programUniforms:p}),getShaderSource:h}},Tf=e=>me({axis:e.axis}),If=(e,t)=>{let r=e.inputs;jl(r),e.compute(Kl(e.inputs,t))}}),Xl,Ef,Cf,g_=F(()=>{ie(),ne(),ae(),Xl=(e,t,r,i,n,a,s,o,l)=>{let d=[{type:12,data:a},{type:12,data:i},{type:12,data:n},{type:12,data:r},{type:12,data:s},{type:12,data:o},{type:12,data:l}],p=[a];d.push(...re(t.dims,p));let h=f=>{let g=U("indices_data",t.dataType,t.dims.length),m=ee("input_slice_offsets_data",12,1,1),b=[g,m],v=[{name:"output_size",type:"u32"},{name:"batch_dims",type:"u32"},{name:"input_dims",type:"u32",length:n.length},{name:"sizes_from_slice_dims_data",type:"u32",length:r.length},{name:"num_slices_per_batch",type:"u32"},{name:"input_batch_stride",type:"u32"},{name:"num_slice_dims",type:"u32"}];return`
  ${f.registerUniforms(v).declareVariables(...b)}
  ${f.mainStart()}
    ${f.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
    let batch_idx = global_idx / uniforms.num_slices_per_batch;
    let base_offset = batch_idx * uniforms.input_batch_stride;

    let slice_indices_base_offset = global_idx * uniforms.num_slice_dims;
    var relative_slice_offset = 0;
    for (var dim_idx = 0u; dim_idx < uniforms.num_slice_dims; dim_idx ++) {
      var index = i32(indices_data[dim_idx + slice_indices_base_offset].x);
      let input_dim_idx = uniforms.batch_dims + dim_idx;
      if (index < 0) {
        ${n.length===1?"index += i32(uniforms.input_dims);":"index += i32(uniforms.input_dims[input_dim_idx]);"}
      }
      ${r.length===1?"relative_slice_offset += index * i32(uniforms.sizes_from_slice_dims_data);":"relative_slice_offset += index * i32(uniforms.sizes_from_slice_dims_data[dim_idx]);"}
    }

    input_slice_offsets_data[global_idx] =  base_offset + u32(relative_slice_offset);
  }`};return e.compute({name:"computeSliceOffsets",shaderCache:{hint:`${n.length}_${r.length}`,inputDependencies:["rank"]},getRunData:()=>({outputs:[{dims:p,dataType:e.inputs[1].dataType}],dispatchGroup:{x:Math.ceil(a/64)},programUniforms:d}),getShaderSource:h},{inputs:[t],outputs:[-1]})[0]},Ef=(e,t)=>{let r=e.inputs,i=r[0].dims,n=r[0].dataType,a=r[1].dims,s=a[a.length-1],o=N.sizeToDimension(a,a.length-1),l=N.sizeFromDimension(i,t.batchDims+s),d=N.sizeToDimension(i,t.batchDims),p=N.sizeFromDimension(i,t.batchDims),h=o/d,f=new Array(s),g=l;for(let x=0;x<s;++x)f[s-1-x]=g,g*=i[t.batchDims+s-1-x];let m=Xl(e,r[1],f,t.batchDims,i,o,h,p,s),b=t.batchDims+s;if(b>i.length)throw new Error("last dimension of indices must not be larger than rank of input tensor");let v=a.slice(0,-1).concat(i.slice(b)),$=N.size(v),w=[{type:12,data:$},{type:12,data:l},...re(r[0].dims,m.dims,v)],S=x=>{let I=U("data",r[0].dataType,r[0].dims.length),C=U("slice_offsets",12,m.dims.length),z=ee("output",r[0].dataType,v.length);return`
          ${x.registerUniform("output_size","u32").registerUniform("slice_size","u32").declareVariables(I,C,z)}
            ${x.mainStart()}
            ${x.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
          let slice_offset = slice_offsets[global_idx / uniforms.slice_size];
          output[global_idx] = data[u32(slice_offset) + global_idx % uniforms.slice_size];
        }`};e.compute({name:"GatherND",shaderCache:{hint:t.cacheKey,inputDependencies:["rank","rank"]},getRunData:()=>({outputs:[{dims:v,dataType:n}],dispatchGroup:{x:Math.ceil($/64)},programUniforms:w}),getShaderSource:S},{inputs:[r[0],m]})},Cf=e=>({batchDims:e.batch_dims,cacheKey:""})}),Zl,Yl,zf,Af,y_=F(()=>{ie(),ne(),Ce(),ae(),Zl=(e,t)=>{if(e.length<3||e.length>4)throw new Error("GatherBlockQuantized requires 3 or 4 inputs.");let r=N.normalizeAxis(t.quantizeAxis,e[0].dims.length),i=t.blockSize,n=e[0],a=e[2],s=e.length===4?e[3]:void 0;if(a.dims.length!==n.dims.length||!n.dims.map((o,l)=>l===r?Math.ceil(o/i)===a.dims[l]:o===a.dims[l]).reduce((o,l)=>o&&l,!0))throw new Error("Scales must have the same rank as the input tensor and the dims should match except on gatherAxis.");if(s){if(s.dataType!==n.dataType)throw new Error("Zero point must have the same data type as the input tensor.");if(s.dims.length!==a.dims.length||!s.dims.map((o,l)=>o===a.dims[l]).reduce((o,l)=>o&&l,!0))throw new Error("Zero point must have the same rank as the input tensor and the dims should match except on quantizeAxis.")}},Yl=(e,t)=>{let r=e[0].dims,i=e[1].dims,n=r.length,a=N.normalizeAxis(t.gatherAxis,n),s=N.normalizeAxis(t.quantizeAxis,n),o=r.slice(0);o.splice(a,1,...i);let l=N.size(o),d=e[2].dataType,p=e[0].dataType===22,h=[{type:12,data:l},{type:12,data:s},{type:12,data:a},{type:12,data:t.blockSize},...re(...e.map((g,m)=>g.dims),o)],f=g=>{let m=U("data",e[0].dataType,e[0].dims.length),b=U("inputIndices",e[1].dataType,e[1].dims.length),v=U("scales",e[2].dataType,e[2].dims.length),$=e.length>3?U("zeroPoint",e[3].dataType,e[3].dims.length):void 0,w=ee("output",d,o.length),S=[m,b,v];$&&S.push($);let x=[{name:"output_size",type:"u32"},{name:"quantize_axis",type:"u32"},{name:"gather_axis",type:"u32"},{name:"block_size",type:"u32"}];return`
        ${g.registerUniforms(x).declareVariables(...S,w)}
        ${g.mainStart()}
        let output_indices = ${w.offsetToIndices("global_idx")};
        var indices_indices = ${b.type.indices}(0);
        ${i.length>1?`
          for (var i: u32 = 0; i < ${i.length}; i++) {
            let index = ${w.indicesGet("output_indices","uniforms.gather_axis + i")};
            ${b.indicesSet("indices_indices","i","index")};
          }`:`indices_indices = ${w.indicesGet("output_indices","uniforms.gather_axis")};`};
        var data_indices = ${m.type.indices}(0);
        for (var i: u32 = 0; i < uniforms.gather_axis; i++) {
          let index = ${w.indicesGet("output_indices","i")};
          ${m.indicesSet("data_indices","i","index")};
        }
        var index_from_indices = ${b.getByIndices("indices_indices")};
        if (index_from_indices < 0) {
          index_from_indices += ${r[a]};
        }
        ${m.indicesSet("data_indices","uniforms.gather_axis","u32(index_from_indices)")};
        for (var i = uniforms.gather_axis + 1; i < ${o.length}; i++) {
          let index = ${w.indicesGet("output_indices",`i + ${i.length} - 1`)};
          ${m.indicesSet("data_indices","i","index")};
        }
        let data_offset = ${m.indicesToOffset("data_indices")};
        let data_index = data_offset % 8;
        // Convert 4-bit packed data to 8-bit packed data.
        let packed_4bit_quantized_data = ${m.getByOffset("data_offset / 8")};
        let packed_8bit_quantized_data = (packed_4bit_quantized_data >> (4 * (data_index % 2))) & 0x0f0f0f0f;
        let quantized_data_vec = ${p?"unpack4xI8":"unpack4xU8"}(u32(packed_8bit_quantized_data));
        let quantized_data = quantized_data_vec[data_index / 2];
        var scale_indices = data_indices;
        let quantize_axis_index = ${v.indicesGet("data_indices","uniforms.quantize_axis")} / uniforms.block_size;
        ${v.indicesSet("scale_indices","uniforms.quantize_axis","quantize_axis_index")};
        var scale = ${v.getByIndices("scale_indices")};
        ${$?`
              let zero_point_indices = scale_indices;
              let zero_point_offset = ${$.indicesToOffset("zero_point_indices")};
              let zero_point_index = zero_point_offset % 8;
              let packed_4bit_zero_points = ${$.getByOffset("zero_point_offset / 8")};
              let packed_8bit_zero_points = (packed_4bit_zero_points >> (4 * (zero_point_index % 2))) & 0x0f0f0f0f;
              let zero_point_vec = ${p?"unpack4xI8":"unpack4xU8"}(u32(packed_8bit_zero_points));
              let zero_point = zero_point_vec[zero_point_index / 2];`:"var zero_point = 0"};
        let dequantized_data = ${Be(d)}(quantized_data - zero_point) * scale;
        ${w.setByOffset("global_idx","dequantized_data")};
    }`};return{name:"GatherBlockQuantized",shaderCache:{hint:`${t.cacheKey};${e.filter((g,m)=>m!==1).map(g=>g.dims.join("_")).join(";")}`,inputDependencies:Array.from({length:e.length},(g,m)=>"rank")},getRunData:()=>({outputs:[{dims:o,dataType:d}],dispatchGroup:{x:Math.ceil(l/64)},programUniforms:h}),getShaderSource:f}},zf=(e,t)=>{let r=e.inputs;Zl(r,t),e.compute(Yl(e.inputs,t))},Af=e=>me({blockSize:e.blockSize,gatherAxis:e.gatherAxis,quantizeAxis:e.quantizeAxis})}),Ql,Jl,Mf,Of,__=F(()=>{ie(),ne(),Ce(),ae(),Ql=e=>{if(!e||e.length!==2)throw new Error("GatherElements requires 2 inputs.");if(e[0].dims.length<1)throw new Error("GatherElements requires that the data input be rank >= 1.");if(e[0].dims.length!==e[1].dims.length)throw new Error(`GatherElements requires that the data input and
                     indices input tensors be of same rank.`)},Jl=(e,t)=>{let r=e[0].dims,i=e[0].dataType,n=r.length,a=e[1].dims,s=e[1].dataType,o=N.normalizeAxis(t.axis,n),l=r[o],d=a.slice(0),p=N.size(d),h=U("input",i,n),f=U("indicesInput",s,a.length),g=ee("output",i,d.length),m=[{type:12,data:p},{type:6,data:l},{type:12,data:o}];return m.push(...re(r,a,d)),{name:"GatherElements",shaderCache:{inputDependencies:["rank","rank"]},getRunData:()=>({outputs:[{dims:d,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(p/64)},programUniforms:m}),getShaderSource:b=>`
      ${b.registerUniform("outputSize","u32").registerUniform("axisDimLimit","i32").registerUniform("axis","u32").declareVariables(h,f,g)}
      ${b.mainStart()}
      ${b.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}

      let outputIndices = ${g.offsetToIndices("global_idx")};

      var idx = ${f.getByOffset("global_idx")};
      if (idx < 0) {
        idx = idx + uniforms.axisDimLimit;
      }
      var inputIndices = ${h.type.indices}(outputIndices);
      ${h.indicesSet("inputIndices","uniforms.axis","u32(idx)")};
      let value = ${h.getByIndices("inputIndices")};

      ${g.setByOffset("global_idx","value")};
  }`}},Mf=e=>me({axis:e.axis}),Of=(e,t)=>{let r=e.inputs;Ql(r),e.compute(Jl(e.inputs,t))}}),ed,td,Rf,Nf,b_=F(()=>{ie(),ne(),ae(),ed=e=>{if(!e)throw new Error("Input is missing");if(e.length<2||e.length>3)throw new Error("Invaid input number.");if(e.length===3&&e[2].dims.length>2)throw new Error("Invalid input shape of C");if(e[0].dataType!==e[1].dataType||e.length===3&&e[0].dataType!==e[2].dataType)throw new Error("Input types are mismatched")},td=(e,t)=>{let r=e[0].dims.slice(),i=e[1].dims.slice(),[n,a,s]=Ac.getShapeOfGemmResult(r,t.transA,i,t.transB,e.length===3?e[2].dims:void 0),o=[n,a];if(!o)throw new Error("Can't use gemm on the given tensors");let l=16,d=Math.ceil(a/l),p=Math.ceil(n/l),h=!0,f=N.size(o),g=[{type:12,data:h?d:f},{type:12,data:n},{type:12,data:a},{type:12,data:s},{type:1,data:t.alpha},{type:1,data:t.beta}],m=["type","type"];e.length===3&&(g.push(...re(e[2].dims)),m.push("rank")),g.push(...re(o));let b=$=>{let w="";t.transA&&t.transB?w="value += a[k * uniforms.M + m] * b[n * uniforms.K + k];":t.transA&&!t.transB?w="value += a[k * uniforms.M + m] * b[k * uniforms.N + n];":!t.transA&&t.transB?w="value += a[m * uniforms.K + k] * b[n * uniforms.K + k];":!t.transA&&!t.transB&&(w="value += a[m * uniforms.K + k] * b[k * uniforms.N + n];");let S=t.alpha===1?"":"value *= uniforms.alpha;",x=U("a",e[0].dataType,e[0].dims),I=U("b",e[1].dataType,e[1].dims),C=x.type.value,z=null,k=[x,I];e.length===3&&(z=U("c",e[2].dataType,e[2].dims.length),k.push(z));let D=ee("output",e[0].dataType,o.length);k.push(D);let L=[{name:"output_size",type:"u32"},{name:"M",type:"u32"},{name:"N",type:"u32"},{name:"K",type:"u32"},{name:"alpha",type:"f32"},{name:"beta",type:"f32"}];return`
  ${$.registerUniforms(L).declareVariables(...k)}

  ${$.mainStart()}
    ${$.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}

    let m = global_idx / uniforms.N;
    let n = global_idx % uniforms.N;

    var value = ${C}(0);
    for (var k: u32 = 0u; k < uniforms.K; k++) {
      ${w}
    }

    ${S}
    ${z!=null?`let cOffset = ${z.broadcastedIndicesToOffset("vec2(m, n)",D)}; value += ${C}(uniforms.beta) * ${z.getByOffset("cOffset")};`:""}
    output[global_idx] = value;
  }`},v=$=>{let w=U("a",e[0].dataType,e[0].dims),S=U("b",e[1].dataType,e[1].dims),x=null,I=[w,S];e.length===3&&(x=U("c",e[2].dataType,e[2].dims.length),I.push(x));let C=ee("output",e[0].dataType,o.length);I.push(C);let z=[{name:"num_tile_n",type:"u32"},{name:"M",type:"u32"},{name:"N",type:"u32"},{name:"K",type:"u32"},{name:"alpha",type:"f32"},{name:"beta",type:"f32"}],k="",D="";t.transA&&t.transB?(D=`
      var col = tile_row_start + local_id.x;
      var row = k_start + local_id.y;
      if (col < uniforms.M && row < uniforms.K) {
        tile_a[local_id.y][local_id.x] = a[row * uniforms.M + col];
      } else {
        tile_a[local_id.y][local_id.x] = ${w.type.value}(0);
      }

      col = k_start + local_id.x;
      row = tile_col_start + local_id.y;
      if (col < uniforms.K && row < uniforms.N) {
        tile_b[local_id.y][local_id.x] = b[row * uniforms.K + col];
      } else {
        tile_b[local_id.y][local_id.x] = ${S.type.value}(0);
      }
      `,k="value += tile_a[k][local_id.y] * tile_b[local_id.x][k];"):t.transA&&!t.transB?(D=`
      var col = tile_row_start + local_id.x;
      var row = k_start + local_id.y;
      if (col < uniforms.M && row < uniforms.K) {
        tile_a[local_id.y][local_id.x] = a[row * uniforms.M + col];
      } else {
        tile_a[local_id.y][local_id.x] = ${w.type.value}(0);
      }

      col = tile_col_start + local_id.x;
      row = k_start + local_id.y;
      if (col < uniforms.N && row < uniforms.K) {
        tile_b[local_id.y][local_id.x] = b[row * uniforms.N + col];
      } else {
        tile_b[local_id.y][local_id.x] = ${S.type.value}(0);
      }
      `,k="value += tile_a[k][local_id.y] * tile_b[k][local_id.x];"):!t.transA&&t.transB?(D=`
      var col = k_start + local_id.x;
      var row = tile_row_start + local_id.y;
      if (col < uniforms.K && row < uniforms.M) {
        tile_a[local_id.y][local_id.x] = a[row * uniforms.K + col];
      } else {
        tile_a[local_id.y][local_id.x] = ${w.type.value}(0);
      }

      col = k_start + local_id.x;
      row = tile_col_start + local_id.y;
      if (col < uniforms.K && row < uniforms.N) {
        tile_b[local_id.y][local_id.x] = b[row * uniforms.K + col];
      } else {
        tile_b[local_id.y][local_id.x] = ${S.type.value}(0);
      }
      `,k="value += tile_a[local_id.y][k] * tile_b[local_id.x][k];"):!t.transA&&!t.transB&&(D=`
      var col = k_start + local_id.x;
      var row = tile_row_start + local_id.y;
      if (col < uniforms.K && row < uniforms.M) {
        tile_a[local_id.y][local_id.x] = a[row * uniforms.K + col];
      } else {
        tile_a[local_id.y][local_id.x] = ${w.type.value}(0);
      }

      col = tile_col_start + local_id.x;
      row = k_start + local_id.y;
      if (col < uniforms.N && row < uniforms.K) {
        tile_b[local_id.y][local_id.x] = b[row * uniforms.N + col];
      } else {
        tile_b[local_id.y][local_id.x] = ${S.type.value}(0);
      }
      `,k="value += tile_a[local_id.y][k] * tile_b[k][local_id.x];");let L=t.alpha===1?"":"value *= uniforms.alpha;";return`
  ${$.registerUniforms(z).declareVariables(...I)}
  var<workgroup> tile_a: array<array<${w.type.storage}, ${l}>, ${l}>;
  var<workgroup> tile_b: array<array<${S.type.storage}, ${l}>, ${l}>;
  ${$.mainStart([l,l,1])}
    let tile_col_start = (workgroup_index % uniforms.num_tile_n) * ${l};
    let tile_row_start = (workgroup_index / uniforms.num_tile_n) * ${l};
    let num_tiles = (uniforms.K - 1) / ${l} + 1;
    var k_start = 0u;
    var value = ${C.type.value}(0);
    for (var t: u32 = 0u; t < num_tiles; t++) {
      ${D}
      k_start = k_start + ${l};
      workgroupBarrier();

      for (var k: u32 = 0u; k < ${l}; k++) {
        ${k}
      }
      workgroupBarrier();
    }

    ${L}
    let m = tile_row_start + local_id.y;
    let n = tile_col_start + local_id.x;
    ${x!=null?`let cOffset = ${x.broadcastedIndicesToOffset("vec2(m, n)",C)}; value += ${C.type.value}(uniforms.beta) * ${x.getByOffset("cOffset")};`:""}
    if (m < uniforms.M && n < uniforms.N) {
      output[m * uniforms.N + n] = value;
    }
  }`};return h?{name:"GemmShared",shaderCache:{hint:`${t.cacheKey}`,inputDependencies:m},getRunData:()=>({outputs:[{dims:o,dataType:e[0].dataType}],dispatchGroup:{x:d*p},programUniforms:g}),getShaderSource:v}:{name:"Gemm",shaderCache:{hint:`${t.cacheKey}`,inputDependencies:m},getRunData:()=>({outputs:[{dims:o,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(f/64)},programUniforms:g}),getShaderSource:b}},Rf=e=>{let t=e.transA,r=e.transB,i=e.alpha,n=e.beta;return{transA:t,transB:r,alpha:i,beta:n,cacheKey:`${e.transA};${e.transB};${e.alpha===1}`}},Nf=(e,t)=>{ed(e.inputs),e.compute(td(e.inputs,t))}}),ut,ft,At,Mt,rd,id,nd,ad,sd,od,ud,ld,Bf,Df,w_=F(()=>{ie(),ne(),Ce(),ae(),[ut,ft,At,Mt]=[0,1,2,3],rd=e=>{if(e[0].dims.length!==4)throw new Error("only 4-D tensor is supported.");if(e[0].dims.length!==e[1].dims.length)throw new Error("input dimensions must be equal to grid dimensions");if(e[0].dims.length-2!==e[1].dims[e[1].dims.length-1])throw new Error(`last dimension of grid must be equal to ${e[0].dims.length-2}`);if(e[0].dims[0]!==e[1].dims[0])throw new Error("grid batch size must match input batch size")},id=`
  fn gs_get_cubic_coeffs(x: f32) -> vec4<f32> {
    let cubic_alpha = -0.75f;
    let x_abs = abs(x);
    var coeffs: vec4<f32>;
    coeffs[0] = (((cubic_alpha * (x_abs + 1) - 5 * cubic_alpha) * (x_abs + 1) + 8 * cubic_alpha) * (x_abs + 1) - 4 * cubic_alpha);
    coeffs[1] = (((cubic_alpha + 2) * x_abs - (cubic_alpha + 3)) * x_abs * x_abs + 1);
    coeffs[2] = (((cubic_alpha + 2) * (1 - x_abs) - (cubic_alpha + 3)) * (1 - x_abs) * (1 - x_abs) + 1);
    coeffs[3] = (((cubic_alpha * (2 - x_abs) - 5 * cubic_alpha) * (2 - x_abs) + 8 * cubic_alpha) * (2 - x_abs) - 4 * cubic_alpha);
    return coeffs;
  }
`,nd=e=>`
  fn gs_bicubic_interpolate(p: mat4x4<${e}>, x: f32, y: f32) -> ${e} {
    var v: vec4<f32>;
    var coeffs = gs_get_cubic_coeffs(x);
    for (var i = 0; i < 4; i++) {
      v[i] = coeffs[0] * p[i][0] + coeffs[1] * p[i][1] + coeffs[2] * p[i][2] + coeffs[3] * p[i][3];
    }
    coeffs = gs_get_cubic_coeffs(y);
    let pixel = ${e}(coeffs[0] * v[0] + coeffs[1] * v[1] + coeffs[2] * v[2] + coeffs[3] * v[3]);
    return pixel;
  }
`,ad=e=>`
  fn gs_denormalize(n: f32, length: i32) -> f32 {
    ${e.alignCorners===0?`
    // alignCorners: false => [-1, 1] to [-0.5, length - 0.5]
    return ((n + 1.0) * f32(length) - 1.0) / 2.0;
    `:`
    // alignCorners: true => [-1, 1] to [0, length - 1]
    return (n + 1.0) / 2.0 * (f32(length - 1));
    `}
  }
`,sd=e=>`
  ${e.paddingMode==="reflection"?`
      fn gs_reflect(x: i32, x_min: f32, x_max: f32) -> u32 {
        var dx = 0.0;
        var fx = f32(x);
        let range = x_max - x_min;
        if (fx < x_min) {
          dx = x_min - fx;
          let n = u32(dx / range);
          let r = dx - f32(n) * range;
          if (n % 2 == 0) {
            fx = x_min + r;
          } else {
            fx = x_max - r;
          }
        } else if (fx > x_max) {
          dx = fx - x_max;
          let n = u32(dx / range);
          let r = dx - f32(n) * range;
          if (n % 2 == 0) {
            fx = x_max - r;
          } else {
            fx = x_min + r;
          }
        }
        return u32(fx);
      }`:""}
`,od=(e,t,r)=>`
  fn pixel_at_grid(r: i32, c: i32, H: i32, W: i32, batch: u32, channel: u32, border: vec4<f32>) -> ${t} {
     var pixel = ${t}(0);
     var indices = vec4<u32>(0);
     indices[${ut}] = batch;
     indices[${ft}] = channel;`+(()=>{switch(r.paddingMode){case"zeros":return`
          if (r >= 0 && r < H && c >=0 && c < W) {
            indices[${At}] = u32(r);
            indices[${Mt}] = u32(c);
          } else {
            return ${t}(0);
          }
        `;case"border":return`
          indices[${At}] = u32(clamp(r, 0, H - 1));
          indices[${Mt}] = u32(clamp(c, 0, W - 1));
        `;case"reflection":return`
          indices[${At}] = gs_reflect(r, border[1], border[3]);
          indices[${Mt}] = gs_reflect(c, border[0], border[2]);
        `;default:throw new Error(`padding mode ${r.paddingMode} is not supported`)}})()+`
    return ${e.getByIndices("indices")};
  }
`,ud=(e,t,r)=>(()=>{switch(r.mode){case"nearest":return`
          let result = pixel_at_grid(i32(round(y)), i32(round(x)), H_in, W_in, indices[${ut}], indices[${ft}], border);
        `;case"bilinear":return`
          let x1 = i32(floor(x));
          let y1 = i32(floor(y));
          let x2 = x1 + 1;
          let y2 = y1 + 1;

          let p11 = pixel_at_grid(y1, x1, H_in, W_in, indices[${ut}], indices[${ft}], border);
          let p12 = pixel_at_grid(y1, x2, H_in, W_in, indices[${ut}], indices[${ft}], border);
          let p21 = pixel_at_grid(y2, x1, H_in, W_in, indices[${ut}], indices[${ft}], border);
          let p22 = pixel_at_grid(y2, x2, H_in, W_in, indices[${ut}], indices[${ft}], border);

          let dx2 = ${t}(f32(x2) - x);
          let dx1 = ${t}(x - f32(x1));
          let dy2 = ${t}(f32(y2) - y);
          let dy1 = ${t}(y - f32(y1));
          let result = dy2 * (dx2 * p11 + dx1 * p12) + dy1 * (dx2 * p21 + dx1 * p22);
        `;case"bicubic":return`
          let x0 = i32(floor(x)) - 1;
          let y0 = i32(floor(y)) - 1;
          var p: mat4x4<${t}>;
          for (var h = 0; h < 4; h++) {
            for (var w = 0; w < 4; w++) {
              p[h][w] = pixel_at_grid(h + y0, w + x0, H_in, W_in, indices[${ut}], indices[${ft}], border);
            }
          }

          let dx = x - f32(x0 + 1);
          let dy = y - f32(y0 + 1);
          let result = gs_bicubic_interpolate(p, dx, dy);
        `;default:throw new Error(`mode ${r.mode} is not supported`)}})()+`${e.setByOffset("global_idx","result")}`,ld=(e,t)=>{let r=U("x",e[0].dataType,e[0].dims.length),i=[e[1].dims[0],e[1].dims[1],e[1].dims[2]],n=U("grid",e[1].dataType,i.length,2),a=[e[0].dims[0],e[0].dims[1],e[1].dims[1],e[1].dims[2]];t.format==="NHWC"&&(a=[e[0].dims[0],e[1].dims[1],e[1].dims[2],e[0].dims[3]],[ut,ft,At,Mt]=[0,3,1,2]);let s=ee("output",e[0].dataType,a.length),o=r.type.value,l=N.size(a),d=[{type:12,data:l},...re(e[0].dims,i,a)],p=h=>`
  ${h.registerUniform("output_size","u32").declareVariables(r,n,s)}
  ${id}
  ${nd(o)}
  ${ad(t)}
  ${sd(t)}
  ${od(r,o,t)}

  ${h.mainStart()}
    ${h.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
      let H_in = i32(uniforms.x_shape[${At}]);
      let W_in = i32(uniforms.x_shape[${Mt}]);

      ${t.alignCorners===0?`
      let x_min = -0.5;
      let x_max = f32(W_in) - 0.5;
      let y_min = -0.5;
      let y_max = f32(H_in) - 0.5;
      `:`
      let x_min = 0.0;
      let x_max = f32(W_in) - 1.0;
      let y_min = 0.0;
      let y_max = f32(H_in) - 1.0;
      `};
      let border = vec4<f32>(x_min, y_min, x_max, y_max);

      let indices = ${s.offsetToIndices("global_idx")};
      var grid_indices = vec3<u32>(indices[${ut}], indices[${At}], indices[${Mt}]);
      let nxy = ${n.getByIndices("grid_indices")};
      var x = gs_denormalize(f32(nxy[0]), W_in);
      var y = gs_denormalize(f32(nxy[1]), H_in);

      ${ud(s,o,t)}
  }`;return{name:"GridSample",shaderCache:{hint:`${t.cacheKey}`,inputDependencies:["type","type"]},getRunData:h=>{let f=N.size(a);return{outputs:[{dims:a,dataType:h[0].dataType}],dispatchGroup:{x:Math.ceil(f/64)},programUniforms:d}},getShaderSource:p}},Bf=(e,t)=>{rd(e.inputs),e.compute(ld(e.inputs,t))},Df=e=>me({alignCorners:e.align_corners,mode:e.mode,paddingMode:e.padding_mode,format:e.format})}),Pe,dd,Pf,Sn,pd,vr,Uf,Lf=F(()=>{ie(),ne(),Ce(),Oa(),Ba(),ae(),Tt(),Pe=(e,t)=>e.length>t&&e[t].dims.length>0?e[t]:void 0,dd=(e,t)=>{let r=e[0],i=Pe(e,1),n=Pe(e,2),a=Pe(e,3),s=Pe(e,4),o=Pe(e,5),l=Pe(e,6),d=Pe(e,7);if(r.dims.length!==3&&r.dims.length!==5)throw new Error("Input query is expected to have 3 or 5 dimensions");let p=r.dims[0],h=r.dims[1],f=r.dims.length===3?r.dims[2]:t.numHeads*r.dims[4],g=h,m=0,b=0,v=Math.floor(f/t.numHeads);if(l&&d&&N.size(l.dims)&&N.size(d.dims)){if(l.dims.length!==4)throw new Error('Input "past_key" is expected to have 4 dimensions');if(l.dims[0]!==p||l.dims[1]!==t.numHeads||l.dims[3]!==v)throw new Error('Input "past_key" shape (batch_size, num_heads, past_sequence_length, head_size)');if(d.dims[0]!==p||d.dims[1]!==t.numHeads||d.dims[3]!==v)throw new Error('Input "past_value" shape (batch_size, num_heads, past_sequence_length, head_size)');if(l.dims[2]!==d.dims[2])throw new Error('Input "past_key" and "past_value" shall have same dim 2 (past_sequence_length)');if(d.dims.length!==4)throw new Error('Input "past_value" is expected to have 4 dimensions');m=l.dims[2],b=l.dims[2]}else if(l&&N.size(l.dims)||d&&N.size(d.dims))throw new Error('Input "past_key" and "past_value" shall be both present or both absent');let $;if(i&&N.size(i.dims)>0){if(r.dims.length!==3)throw new Error('Input "query" is expected to have 3 dimensions when key is given');if(i.dims.length<3||i.dims.length>5)throw new Error('Input "key" is expected to have 3, 4, or 5 dimensions');if(r.dims[0]!==i.dims[0])throw new Error('Input "query" and "key" shall have same dim 0 (batch size)');if(i.dims.length===3){if(i.dims[2]!==r.dims[2])throw new Error('Input "query" and "key" shall have same dim 2 (hidden_size)');$=2,g=i.dims[1]}else if(i.dims.length===5){if(i.dims[2]!==t.numHeads||i.dims[3]!==2||i.dims[4]!==v)throw new Error('Expect "key" shape (batch_size, kv_sequence_length, num_heads, 2, head_size) for packed kv');if(n)throw new Error('Expect "value" be none when "key" has packed kv format.');$=5,g=i.dims[1]}else{if(i.dims[1]!==t.numHeads||i.dims[3]!==v)throw new Error('Expect "key" shape (batch_size, num_heads, kv_sequence_length, head_size) for past_key');$=0,g=i.dims[2]}}else{if(r.dims.length!==5)throw new Error('Input "query" is expected to have 5 dimensions when key is empty');if(r.dims[2]!==t.numHeads||r.dims[3]!==3)throw new Error('Expect "query" shape (batch_size, kv_sequence_length, num_heads, 3, head_size) for packed kv');$=3}if(a&&N.size(a.dims)>0){if(a.dims.length!==1)throw new Error('Input "bias" is expected to have 1 dimension');if(i&&i.dims.length===5&&i.dims[3]===2)throw new Error("bias is not allowed for packed kv.")}let w=m+g,S=0;if(s&&N.size(s.dims)>0){S=8;let z=s.dims;throw z.length===1?z[0]===p?S=1:z[0]===3*p+2&&(S=3):z.length===2&&z[0]===p&&z[1]===w&&(S=5),S===8?new Error('Input "key_padding_mask" shape shall be (batch_size) or (batch_size, total_sequence_length)'):new Error("Mask not supported")}let x=!1,I=f;if(n&&N.size(n.dims)>0){if(n.dims.length!==3&&n.dims.length!==4)throw new Error('Input "value" is expected to have 3 or 4 dimensions');if(r.dims[0]!==n.dims[0])throw new Error('Input "query" and "value" shall have same dim 0 (batch_size)');if(n.dims.length===3){if(g!==n.dims[1])throw new Error('Input "key" and "value" shall have the same dim 1 (kv_sequence_length)');I=n.dims[2]}else{if(g!==n.dims[2])throw new Error('Input "key" and "value" shall have the same dim 2 (kv_sequence_length)');I=n.dims[1]*n.dims[3],x=!0}}let C=!1;if(s&&N.size(s.dims)>0)throw new Error("Key padding mask is not supported");if(o&&N.size(o.dims)>0){if(o.dims.length!==4)throw new Error('Input "attention_bias" is expected to have 4 dimensions');if(o.dims[0]!==p||o.dims[1]!==t.numHeads||o.dims[2]!==h||o.dims[3]!==w)throw new Error('Expect "attention_bias" shape (batch_size, num_heads, sequence_length, total_sequence_length)')}return{batchSize:p,sequenceLength:h,pastSequenceLength:m,kvSequenceLength:g,totalSequenceLength:w,maxSequenceLength:b,inputHiddenSize:0,hiddenSize:f,vHiddenSize:I,headSize:v,vHeadSize:Math.floor(I/t.numHeads),numHeads:t.numHeads,isUnidirectional:!1,pastPresentShareBuffer:!1,maskFilterValue:t.maskFilterValue,maskType:S,scale:t.scale,broadcastResPosBias:C,passPastInKv:x,qkvFormat:$}},Pf=e=>me({...e}),Sn=me({perm:[0,2,1,3]}),pd=(e,t,r,i,n,a,s)=>{let o=[i,n,a],l=N.size(o),d=[{type:12,data:l},{type:12,data:s},{type:12,data:a}],p=h=>{let f=ee("qkv_with_bias",t.dataType,o),g=U("qkv",t.dataType,o),m=U("bias",r.dataType,o),b=[{name:"output_size",type:"u32"},{name:"bias_offset",type:"u32"},{name:"hidden_size",type:"u32"}];return`
  ${h.registerUniforms(b).declareVariables(g,m,f)}
  ${h.mainStart()}
    ${h.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
    let bias_offset_idx = (global_idx % uniforms.hidden_size) + uniforms.bias_offset;

    qkv_with_bias[global_idx] = qkv[global_idx] + bias[bias_offset_idx];
  }`};return e.compute({name:"MultiHeadAttentionAddBias",shaderCache:{inputDependencies:["type","type"]},getRunData:()=>({outputs:[{dims:o,dataType:t.dataType,gpuDataType:0}],dispatchGroup:{x:Math.ceil(l/64)},programUniforms:d}),getShaderSource:p},{inputs:[t,r],outputs:[-1]})[0]},vr=(e,t,r,i,n,a,s,o)=>{let l=a;if(s&&N.size(s.dims)>0){if(i===1)throw new Error("AddBiasReshape is not implemented. Please export your model with packed QKV or KV");return l=pd(e,a,s,t,i,r*n,o),l=l.reshape([t,i,r,n]),r===1||i===1?l:e.compute(Ge(l,Sn.perm),{inputs:[l],outputs:[-1]})[0]}else return a.dims.length===3&&(l=a.reshape([t,i,r,n])),r===1||i===1?l:e.compute(Ge(l,Sn.perm),{inputs:[l],outputs:[-1]})[0]},Uf=(e,t)=>{let r=dd(e.inputs,t),i=e.inputs[0],n=Pe(e.inputs,1),a=Pe(e.inputs,2),s=Pe(e.inputs,3),o=Pe(e.inputs,4),l=Pe(e.inputs,5),d=Pe(e.inputs,6),p=Pe(e.inputs,7);if(i.dims.length===5)throw new Error("Packed QKV is not implemented");if(n?.dims.length===5)throw new Error("Packed KV is not implemented");let h=n&&a&&n.dims.length===4&&a.dims.length===4,f=vr(e,r.batchSize,r.numHeads,r.sequenceLength,r.headSize,i,s,0);if(h)return Tr(e,f,n,a,o,void 0,d,p,l,r);if(!n||!a)throw new Error("key and value must be provided");let g=vr(e,r.batchSize,r.numHeads,r.kvSequenceLength,r.headSize,n,s,r.hiddenSize),m=vr(e,r.batchSize,r.numHeads,r.kvSequenceLength,r.vHeadSize,a,s,2*r.hiddenSize);Tr(e,f,g,m,o,void 0,d,p,l,r)}}),cd,hd,fd,md,ca,qf,Wf,Gf=F(()=>{ie(),ne(),Ce(),ae(),cd=e=>{if(!e||e.length<1)throw new Error("too few inputs")},hd=(e,t)=>{let r=[],i=t.numOutputs;return e[1].dims[0]>0&&(e[1].getBigInt64Array().forEach(n=>r.push(Number(n))),i=r.length),me({numOutputs:i,axis:t.axis,splitSizes:r})},fd=e=>`
fn calculateOutputIndex(index: u32) -> u32 {
    for (var i: u32 = 0u; i < ${e}u; i += 1u ) {
    if (index < ${te("uniforms.size_in_split_axis","i",e)}) {
        return i;
    }
    }
    return ${e}u;
}`,md=e=>{let t=e.length,r=[];for(let i=0;i<t;++i){let n=e[i].setByIndices("indices","input[global_idx]");t===1?r.push(n):i===0?r.push(`if (output_number == ${i}u) { ${n} }`):i===t-1?r.push(`else { ${n} }`):r.push(`else if (output_number == ${i}) { ${n} }`)}return`
      fn writeBufferData(output_number: u32, indices: ${e[0].type.indices}, global_idx: u32) {
        ${r.join(`
`)}
      }`},ca=(e,t)=>{let r=e[0].dims,i=N.size(r),n=e[0].dataType,a=N.normalizeAxis(t.axis,r.length),s=new Array(t.numOutputs),o=U("input",n,r.length),l=new Array(t.numOutputs),d=[],p=[],h=0,f=[{type:12,data:i}];for(let m=0;m<t.numOutputs;m++){h+=t.splitSizes[m],l[m]=h;let b=r.slice();b[a]=t.splitSizes[m],p.push(b),s[m]=ee(`output${m}`,n,b.length),d.push({dims:p[m],dataType:e[0].dataType})}f.push({type:12,data:l},...re(r,...p));let g=m=>`
  ${m.registerUniform("input_size","u32").registerUniform("size_in_split_axis","u32",l.length).declareVariables(o,...s)}
  ${fd(l.length)}
  ${md(s)}

  ${m.mainStart()}
    ${m.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.input_size")}

    var indices = ${o.offsetToIndices("global_idx")};
    var index = ${o.indicesGet("indices",a)};
    let output_number = calculateOutputIndex(index);
    if (output_number != 0) {
      index -= ${te("uniforms.size_in_split_axis","output_number - 1u",l.length)};
      ${o.indicesSet("indices",a,"index")};
    }
    writeBufferData(output_number, indices, global_idx);
  }`;return{name:"Split",shaderCache:{hint:t.cacheKey,inputDependencies:["rank"]},getShaderSource:g,getRunData:()=>({outputs:d,dispatchGroup:{x:Math.ceil(i/64)},programUniforms:f})}},qf=(e,t)=>{cd(e.inputs);let r=e.inputs.length===1?t:hd(e.inputs,t);e.compute(ca(e.inputs,r),{inputs:[0]})},Wf=e=>{let t=e.axis,r=e.splitSizes,i=e.numOutputs<0?r.length:e.numOutputs;if(i!==r.length)throw new Error("numOutputs and splitSizes length must be equal");return me({axis:t,numOutputs:i,splitSizes:r})}}),gd,hi,Vf,Ff=F(()=>{ie(),ne(),Ce(),ae(),gd=(e,t)=>{let[r,i,n,a]=e,{numHeads:s,rotaryEmbeddingDim:o}=t;if(r.dims.length!==3&&r.dims.length!==4)throw new Error(`Input 'x' is expected to have 3 or 4 dimensions, got ${r.dims.length}`);if(!N.areEqual(i.dims,[])&&!N.areEqual(i.dims,[1])&&i.dims.length!==2)throw new Error(`Input 'position_ids' is expected to have 0, 1, or 2 dimensions, got ${i.dims.length}`);if(n.dims.length!==2)throw new Error(`Input 'cos_cache' is expected to have 2 dimensions, got ${n.dims.length}`);if(a.dims.length!==2)throw new Error(`Input 'sin_cache' is expected to have 2 dimensions, got ${a.dims.length}`);if(!N.areEqual(n.dims,a.dims))throw new Error("Inputs 'cos_cache' and 'sin_cache' are expected to have the same shape");if(o>0&&s===0)throw new Error("num_heads must be provided if rotary_embedding_dim is specified");let l=r.dims[0],d=r.dims[r.dims.length-2],p=n.dims[0],h=N.sizeFromDimension(r.dims,1)/d,f=o===0?n.dims[1]*2:h/s;if(o>f)throw new Error("rotary_embedding_dim must be less than or equal to head_size");if(i.dims.length===2){if(l!==i.dims[0])throw new Error(`Input 'position_ids' dimension 0 should be of size batch_size, got ${i.dims[0]}`);if(d!==i.dims[1])throw new Error(`Input 'position_ids' dimension 1 should be of size sequence_length, got ${i.dims[1]}`)}if(d>p)throw new Error("Updating cos_cache and sin_cache in RotaryEmbedding is not currently supported");if(f/2!==n.dims[1]&&o/2!==n.dims[1])throw new Error(`Input 'cos_cache' dimension 1 should be same as head_size / 2 or rotary_embedding_dim / 2, got ${n.dims[1]}`)},hi=(e,t)=>{let{interleaved:r,numHeads:i,rotaryEmbeddingDim:n,scale:a}=t,s=e[0].dims[0],o=N.sizeFromDimension(e[0].dims,1),l=e[0].dims[e[0].dims.length-2],d=o/l,p=e[2].dims[1],h=n===0?p*2:d/i,f=new Array(s,l,d/h,h-p),g=N.computeStrides(f),m=[{type:1,data:a},{type:12,data:f},{type:12,data:g},...e[0].dims.length===3?new Array({type:12,data:[o,d,h,1]}):[],...e[0].dims.length===4?new Array({type:12,data:[o,h,l*h,1]}):[],...re(e[0].dims,e[1].dims,e[2].dims,e[3].dims,e[0].dims)],b=v=>{let $=U("input",e[0].dataType,e[0].dims.length),w=U("position_ids",e[1].dataType,e[1].dims.length),S=U("cos_cache",e[2].dataType,e[2].dims.length),x=U("sin_cache",e[3].dataType,e[3].dims.length),I=ee("output",e[0].dataType,e[0].dims.length);return v.registerUniforms([{name:"scale",type:"f32"},{name:"global_shape",type:"u32",length:f.length},{name:"global_strides",type:"u32",length:g.length},{name:"input_output_strides",type:"u32",length:g.length}]),`
        ${v.declareVariables($,w,S,x,I)}

        ${v.mainStart(rr)}
          let half_rotary_emb_dim = uniforms.${S.name}_shape[1];
          let bsnh = global_idx / uniforms.global_strides % uniforms.global_shape;
          let size = uniforms.global_shape[0] * uniforms.global_strides[0];
          ${v.guardAgainstOutOfBoundsWorkgroupSizes("size")}

          if (bsnh[3] < half_rotary_emb_dim) {
            let position_ids_idx =
                ${w.broadcastedIndicesToOffset("bsnh.xy",ee("",w.type.tensor,2))};
            let position_id =
                u32(${w.getByOffset("position_ids_idx")}) + select(0, bsnh[1], position_ids_idx == 0);
            let i = dot(bsnh, uniforms.input_output_strides) + select(0, bsnh[3], ${r});
            let j = i + select(half_rotary_emb_dim, 1, ${r});
            let re = ${$.getByOffset("i")} * ${S.get("position_id","bsnh[3]")} -
                ${$.getByOffset("j")} * ${x.get("position_id","bsnh[3]")};
            ${I.setByOffset("i","re")}
            let im = ${$.getByOffset("i")} * ${x.get("position_id","bsnh[3]")} +
                ${$.getByOffset("j")} * ${S.get("position_id","bsnh[3]")};
            ${I.setByOffset("j","im")}
          } else {
            let k = dot(bsnh, uniforms.input_output_strides) + half_rotary_emb_dim;
            ${I.setByOffset("k",$.getByOffset("k"))}
          }
        }`};return{name:"RotaryEmbedding",shaderCache:{hint:me({interleaved:r}).cacheKey,inputDependencies:["rank","rank","rank","rank"]},getShaderSource:b,getRunData:()=>({outputs:[{dims:e[0].dims,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(N.size(f)/rr)},programUniforms:m})}},Vf=(e,t)=>{gd(e.inputs,t),e.compute(hi(e.inputs,t))}}),yd,_d,kn,bd,Hf,$_=F(()=>{Ce(),ie(),Ba(),Lf(),Gf(),Tt(),Ff(),ae(),yd=(e,t)=>{if(t.doRotary&&e.length<=7)throw new Error("cos_cache and sin_cache inputs are required if do_rotary is specified");let r=e[0],i=e[1],n=e[2],a=e[3],s=e[4];if(t.doRotary!==0&&e.length<=7)throw new Error("cos_cast and sin_cache are expected if do_rotary attribute is non-zero");if(t.localWindowSize!==-1)throw new Error("Local attention is not supported");if(t.softcap!==0)throw new Error("Softcap is not supported");if(t.rotaryInterleaved!==0)throw new Error("Rotary interleaved is not supported");if(t.smoothSoftmax)throw new Error("Smooth softmax is not supported");if(r.dims.length!==3&&r.dims.length!==5)throw new Error("Input query is expected to have 3 or 5 dimensions");let o=!1,l=r.dims[0],d=r.dims[1],p=r.dims.length===3?o?r.dims[2]/3:r.dims[2]:t.numHeads*r.dims[4],h=d,f=0,g=!i||i.dims.length===0,m=Math.floor(g?p/(t.numHeads+2*t.kvNumHeads):p/t.numHeads);g&&(p=m*t.numHeads);let b=a&&a.dims.length!==0,v=s&&s.dims.length!==0;if(b&&a.dims.length===4&&a.dims[0]===l&&a.dims[1]!==t.kvNumHeads&&a.dims[2]===t.kvNumHeads&&a.dims[3]===m)throw new Error("BSNH pastKey/pastValue is not supported");if(b&&v){if(a.dims.length!==4)throw new Error('Input "past_key" is expected to have 4 dimensions');if(s.dims.length!==4)throw new Error('Input "past_value" is expected to have 4 dimensions');f=a.dims[2]}else if(b||v)throw new Error('Input "past_key" and "past_value" shall be both present or both absent');let $=1;if(i&&i.dims.length>0){if(r.dims.length!==3)throw new Error('Input "query" is expected to have 3 dimensions when key is given');if(i.dims.length<3||i.dims.length>5)throw new Error('Input "key" is expected to have 3, 4, or 5 dimensions');if(r.dims[0]!==i.dims[0])throw new Error('Input "query" and "key" shall have same dim 0 (batch size)');if(i.dims.length===3){if(r.dims[2]%i.dims[2]!==0)throw new Error('Dimension 2 of "query" should be a multiple of "key"');h=i.dims[1]}else if(i.dims.length===5){if(i.dims[2]!==t.numHeads||i.dims[3]!==2||i.dims[4]!==m)throw new Error('Expect "key" shape (batch_size, kv_sequence_length, num_heads, 2, head_size) for packed kv');if(n)throw new Error('Expect "value" be none when "key" has packed kv format.');h=i.dims[1]}else{if(i.dims[1]!==t.numHeads||i.dims[3]!==m)throw new Error('Expect "key" shape (batch_size, num_heads, kv_sequence_length, head_size) for past_key');h=i.dims[2]}}else{if(r.dims.length!==3&&r.dims.length!==5)throw new Error('Input "query" is expected to have 3 or 5 dimensions when key is empty');if(r.dims.length===5&&(r.dims[2]!==t.numHeads||r.dims[3]!==3))throw new Error('Expect "query" shape (batch_size, kv_sequence_length, num_heads, 3, head_size) for packed kv');$=3}let w=0,S=!1,x=t.kvNumHeads?m*t.kvNumHeads:p;if(n&&n.dims.length>0){if(n.dims.length!==3&&n.dims.length!==4)throw new Error('Input "value" is expected to have 3 or 4 dimensions');if(r.dims[0]!==n.dims[0])throw new Error('Input "query" and "value" shall have same dim 0 (batch_size)');if(n.dims.length===3){if(h!==n.dims[1])throw new Error('Input "key" and "value" shall have the same dim 1 (kv_sequence_length)');x=n.dims[2]}else{if(h!==n.dims[2])throw new Error('Input "past_key" and "past_value" shall have the same dim 2 (kv_sequence_length)');x=n.dims[1]*n.dims[3],S=!0}}let I=e.length>4?e[5]:void 0;if(I){if(I.dims.length===0)throw new Error("seqlens_k must be at least 1D, got scalar.");let C=I.dims.reduce((z,k)=>z*k,1);if(C!==l)throw new Error(`seqlens_k must have batch_size (${l}) elements, got ${C}.`);for(let z=0;z<I.dims.length;z++)if(I.dims[z]!==1&&I.dims[z]!==l)throw new Error(`seqlens_k has unexpected shape. Each dimension must be 1 or batch_size (${l}), got dims[${z}] = ${I.dims[z]}.`)}return{batchSize:l,sequenceLength:d,pastSequenceLength:f,kvSequenceLength:h,totalSequenceLength:-1,maxSequenceLength:-1,inputHiddenSize:0,hiddenSize:p,vHiddenSize:x,headSize:m,vHeadSize:Math.floor(x/t.kvNumHeads),numHeads:t.numHeads,kvNumHeads:t.kvNumHeads,nReps:t.numHeads/t.kvNumHeads,pastPresentShareBuffer:!1,maskType:w,scale:t.scale,broadcastResPosBias:!1,passPastInKv:S,qkvFormat:$}},_d=me({perm:[0,2,1,3]}),kn=(e,t,r)=>{let i=t,n=r.kvNumHeads;return t.dims.length===3&&r.kvSequenceLength!==0&&(i=t.reshape([r.batchSize,r.kvSequenceLength,n,r.headSize]),i=e.compute(Ge(i,_d.perm),{inputs:[i],outputs:[-1]})[0]),i},bd=(e,t,r,i)=>{let n=7,a=["type","type"],s=[e*t],o=e*t,l=[{type:12,data:o},{type:12,data:t},{type:12,data:e}],d=p=>{let h=U("seq_lens",r.dataType,r.dims),f=U("total_seq_lens",i.dataType,i.dims),g=ee("pos_ids",n,s),m=[{name:"output_size",type:"u32"},{name:"sequence_length",type:"u32"},{name:"batch_size",type:"u32"}];return`
  ${p.registerUniforms(m).declareVariables(h,f,g)}
  ${p.mainStart()}
    ${p.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
    let total_sequence_length = u32(${f.getByOffset("0")});
    let is_subsequent_prompt = uniforms.sequence_length > 1 && uniforms.sequence_length != total_sequence_length;
    let is_first_prompt = !is_subsequent_prompt && uniforms.sequence_length == total_sequence_length;
    let batch_idx = global_idx / uniforms.sequence_length;
    let sequence_idx = i32(global_idx % uniforms.sequence_length);
    var pos_id: i32 = 0;
    let seqlen = ${h.getByOffset("batch_idx")};
    let total_seqlen = seqlen + 1;
    if (is_first_prompt) {
      if (sequence_idx < total_seqlen) {
        pos_id = sequence_idx;
      } else {
        pos_id = 1;
      }
      ${g.setByOffset("global_idx","pos_id")}
    } else if (is_subsequent_prompt) {
      let past_seqlen = total_seqlen - i32(uniforms.sequence_length);
      if (past_seqlen + sequence_idx < total_seqlen) {
        pos_id = past_seqlen + sequence_idx;
      } else {
        pos_id = 1;
      }
      ${g.setByOffset("global_idx","pos_id")}
    } else if (global_idx < uniforms.batch_size) {
      ${g.setByOffset("global_idx","seqlen")}
    };
  }
  `};return{name:"GeneratePositionIds",shaderCache:{hint:`${e};${t}`,inputDependencies:a},getRunData:()=>({outputs:[{dims:s,dataType:n}],dispatchGroup:{x:Math.ceil(o/64)},programUniforms:l}),getShaderSource:d}},Hf=(e,t)=>{let r=yd(e.inputs,t);if(e.inputs[0].dims.length===5)throw new Error("Packed QKV is not implemented");if(e.inputs[1]?.dims.length===5)throw new Error("Packed KV is not implemented");let i=e.inputs[0],n=e.inputs[1]&&e.inputs[1].dims.length>0?e.inputs[1]:void 0,a=e.inputs[2]&&e.inputs[2].dims.length>0?e.inputs[2]:void 0,s=e.inputs[3]&&e.inputs[3].dims.length!==0?e.inputs[3]:void 0,o=e.inputs[4]&&e.inputs[4].dims.length!==0?e.inputs[4]:void 0,l=e.inputs.length>4?e.inputs[5]:void 0,d=e.inputs.length>5?e.inputs[6]:void 0,p=r.kvNumHeads?r.kvNumHeads:r.numHeads,h=me({axis:2,numOutputs:3,splitSizes:[r.numHeads*r.headSize,p*r.headSize,p*r.headSize]}),[f,g,m]=!n&&!a?e.compute(ca([i],h),{inputs:[i],outputs:[-1,-1,-1]}):[i,n,a],b,v;if(t.doRotary){let x=e.compute(bd(r.batchSize,r.sequenceLength,l,d),{inputs:[l,d],outputs:[-1]})[0],I=e.inputs[7],C=e.inputs[8],z=me({interleaved:t.rotaryInterleaved!==0,numHeads:r.numHeads,rotaryEmbeddingDim:0,scale:t.scale}),k=[f,x,I,C],D=[-1];b=e.compute(hi(k,z),{inputs:k,outputs:D})[0],k.splice(0,1,g);let L=me({interleaved:t.rotaryInterleaved!==0,numHeads:r.kvNumHeads,rotaryEmbeddingDim:0,scale:t.scale});v=e.compute(hi(k,L),{inputs:k,outputs:D})[0]}let $=vr(e,r.batchSize,r.numHeads,r.sequenceLength,r.headSize,t.doRotary?b:f,void 0,0),w=kn(e,t.doRotary?v:g,r),S=kn(e,m,r);Tr(e,$,w,S,void 0,void 0,s,o,void 0,r,l,d)}}),Tn,wd,$d,jf,v_=F(()=>{ie(),ne(),Tt(),ae(),Tn=(e,t,r,i,n,a,s,o)=>{let l=Te(a),d=l===1?"f32":`vec${l}f`,p=l===1?"vec2f":`mat2x${l}f`,h=n*s,f=64;h===1&&(f=256);let g=[n,s,a/l],m=[n,s,2],b=["rank","type","type"],v=[];v.push(...re(g,m));let $=w=>{let S=U("x",t.dataType,3,l),x=U("scale",r.dataType,r.dims),I=U("bias",i.dataType,i.dims),C=ee("output",1,3,2),z=[S,x,I,C];return`
  var<workgroup> workgroup_shared : array<${p}, ${f}>;
  const workgroup_size = ${f}u;
  ${w.declareVariables(...z)}
  ${w.mainStart(f)}
    let batch = workgroup_index / uniforms.x_shape[1];
    let channel = workgroup_index % uniforms.x_shape[1];
    let hight = uniforms.x_shape[2];
    // initialize workgroup memory
    var sum = ${d}(0);
    var squared_sum = ${d}(0);
    for (var h = local_idx; h < hight; h += workgroup_size) {
      let value = ${d}(${S.get("batch","channel","h")});
      sum += value;
      squared_sum += value * value;
    }
    workgroup_shared[local_idx] = ${p}(sum, squared_sum);
    workgroupBarrier();

    for (var currSize = workgroup_size >> 1;  currSize > 0; currSize = currSize >> 1) {
      if (local_idx < currSize) {
        workgroup_shared[local_idx] = workgroup_shared[local_idx] + workgroup_shared[local_idx + currSize];
      }
      workgroupBarrier();
    }
    if (local_idx == 0) {
      let sum_final = ${kt("workgroup_shared[0][0]",l)} / f32(hight * ${l});
      let squared_sum_final = ${kt("workgroup_shared[0][1]",l)} / f32(hight * ${l});

      let inv_std_dev = inverseSqrt(squared_sum_final - sum_final * sum_final + f32(${o}));
      let channel_scale = inv_std_dev * f32(scale[channel]);
      let channel_shift = f32(bias[channel]) - sum_final * channel_scale;
      output[workgroup_index] = vec2f(channel_scale, channel_shift);
    }
  }`};return e.compute({name:"InstanceNormComputeChannelScaleShift",shaderCache:{hint:`${l};${o};${f}`,inputDependencies:b},getRunData:()=>({outputs:[{dims:m,dataType:1}],dispatchGroup:{x:h},programUniforms:v}),getShaderSource:$},{inputs:[t,r,i],outputs:[-1]})[0]},wd=(e,t,r)=>{let i=t[0].dims,n=i,a=2,s=i[0],o=i[1],l=N.sizeFromDimension(i,a),d=Te(l),p=N.size(n)/d,h=Tn(e,t[0],t[1],t[2],s,l,o,r.epsilon),f=[s,o,l/d],g=[s,o],m=["type","none"],b=v=>{let $=U("x",t[0].dataType,f.length,d),w=U("scale_shift",1,g.length,2),S=ee("output",t[0].dataType,f.length,d),x=[$,w,S];return`
  ${v.registerUniform("output_size","u32").declareVariables(...x)}
  ${v.mainStart()}
  ${v.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
      let outputIndices = ${S.offsetToIndices("global_idx")};
      let batch = outputIndices[0];
      let channel = outputIndices[1];
      let scale_shift = ${w.getByIndices("vec2<u32>(batch, channel)")};
      let value = ${$.getByOffset("global_idx")} * ${S.type.value}(scale_shift.x) + ${S.type.value}(scale_shift.y);
      ${S.setByOffset("global_idx","value")};
  }`};e.compute({name:"InstanceNormalization",shaderCache:{hint:`${d}`,inputDependencies:m},getRunData:()=>({outputs:[{dims:n,dataType:t[0].dataType}],dispatchGroup:{x:Math.ceil(p/64)},programUniforms:[{type:12,data:p},...re(f,g,f)]}),getShaderSource:b},{inputs:[t[0],h]})},$d=(e,t,r)=>{let i=t[0].dims,n=i,a=i[0],s=i[i.length-1],o=N.sizeFromDimension(i,1)/s,l=Te(s),d=N.size(n)/l,p=[{type:12,data:o},{type:12,data:Math.floor(s/l)}],h=["type","type"],f=!1,g=[0,i.length-1];for(let $=0;$<i.length-2;$++)f=f||i[$+1]!==1,g.push($+1);f=f&&i[i.length-1]!==1;let m=f?e.compute(Ge(e.inputs[0],g),{inputs:[e.inputs[0]],outputs:[-1]})[0]:e.inputs[0].reshape(Array.from({length:i.length},($,w)=>i[g[w]])),b=Tn(e,m,t[1],t[2],a,o,s,r.epsilon),v=$=>{let w=Me(t[0].dataType),S=l===1?"vec2f":`mat${l}x2f`,x=z=>{let k=z===0?"x":"y",D=l===1?"f32":`vec${l}f`;switch(l){case 1:return`${w}(${D}(scale.${k}))`;case 2:return`vec2<${w}>(${D}(scale[0].${k}, scale[1].${k}))`;case 4:return`vec4<${w}>(${D}(scale[0].${k}, scale[1].${k}, scale[2].${k}, scale[3].${k}))`;default:throw new Error(`Not supported compoents ${l}`)}},I=U("input",t[0].dataType,t[0].dims,l),C=ee("output",t[0].dataType,n,l);return`
  @group(0) @binding(0) var<storage, read> input : array<${I.type.storage}>;
  @group(0) @binding(1) var<storage, read> scale_input : array<${S}>;
  @group(0) @binding(2) var<storage, read_write> output : array<${C.type.storage}>;
  struct Uniforms {H: u32, C : u32};
  @group(0) @binding(3) var<uniform> uniforms: Uniforms;

  ${$.mainStart()}
    let current_image_number = global_idx / (uniforms.C * uniforms.H);
    let current_channel_number = global_idx % uniforms.C;

    let scale_offset = current_image_number * uniforms.C + current_channel_number;
    let scale = scale_input[scale_offset];
    output[global_idx] = fma(input[global_idx], ${x(0)}, ${x(1)});
  }`};e.compute({name:"InstanceNormalizationNHWC",shaderCache:{hint:`${l}`,inputDependencies:h},getRunData:()=>({outputs:[{dims:n,dataType:t[0].dataType}],dispatchGroup:{x:Math.ceil(d/64)},programUniforms:p}),getShaderSource:v},{inputs:[t[0],b]})},jf=(e,t)=>{t.format==="NHWC"?$d(e,e.inputs,t):wd(e,e.inputs,t)}}),vd,xd,Kf,x_=F(()=>{ie(),ne(),ae(),vd=e=>{if(!e||e.length<2)throw new Error("layerNorm requires at least 2 inputs.")},xd=(e,t,r)=>{let i=t.simplified,n=e[0].dims,a=e[1],s=!i&&e[2],o=n,l=N.normalizeAxis(t.axis,n.length),d=N.sizeToDimension(n,l),p=N.sizeFromDimension(n,l),h=N.size(a.dims),f=s?N.size(s.dims):0;if(h!==p||s&&f!==p)throw new Error(`Size of X.shape()[axis:] == ${p}.
       Size of scale and bias (if provided) must match this.
       Got scale size of ${h} and bias size of ${f}`);let g=[];for(let I=0;I<n.length;++I)I<l?g.push(n[I]):g.push(1);let m=Te(p),b=["type","type"],v=[{type:12,data:d},{type:1,data:p},{type:12,data:Math.floor(p/m)},{type:1,data:t.epsilon}];s&&b.push("type");let $=r>1,w=r>2,S=I=>{let C=Me(e[0].dataType),z=[U("x",e[0].dataType,e[0].dims,m),U("scale",a.dataType,a.dims,m)];s&&z.push(U("bias",s.dataType,s.dims,m)),z.push(ee("output",e[0].dataType,o,m)),$&&z.push(ee("mean_data_output",1,g)),w&&z.push(ee("inv_std_output",1,g));let k=[{name:"norm_count",type:"u32"},{name:"norm_size",type:"f32"},{name:"norm_size_vectorized",type:"u32"},{name:"epsilon",type:"f32"}];return`
  ${I.registerUniforms(k).declareVariables(...z)}
  ${I.mainStart()}
    ${I.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.norm_count")}
    let offset = global_idx * uniforms.norm_size_vectorized;
    var mean_vector = ${ia("f32",m)};
    var mean_square_vector = ${ia("f32",m)};

    for (var h: u32 = 0u; h < uniforms.norm_size_vectorized; h++) {
      let value = ${Qt(C,m,"x[h + offset]")};
      mean_vector += value;
      mean_square_vector += value * value;
    }
    let mean = ${kt("mean_vector",m)} / uniforms.norm_size;
    let inv_std_dev = inverseSqrt(${kt("mean_square_vector",m)} / uniforms.norm_size ${i?"":"- mean * mean"} + uniforms.epsilon);

    for (var j: u32 = 0; j < uniforms.norm_size_vectorized; j++) {
      let f32input = ${Qt(C,m,"x[j + offset]")};
      let f32scale = ${Qt(C,m,"scale[j]")};
      output[j + offset] = ${z[0].type.value}((f32input ${i?"":"- mean"}) * inv_std_dev * f32scale
        ${s?`+ ${Qt(C,m,"bias[j]")}`:""}
      );
    }

    ${$?"mean_data_output[global_idx] = mean":""};
    ${w?"inv_std_output[global_idx] = inv_std_dev":""};
  }`},x=[{dims:o,dataType:e[0].dataType}];return $&&x.push({dims:g,dataType:1}),w&&x.push({dims:g,dataType:1}),{name:"LayerNormalization",shaderCache:{hint:`${m};${r};${i}`,inputDependencies:b},getRunData:()=>({outputs:x,dispatchGroup:{x:Math.ceil(d/64)},programUniforms:v}),getShaderSource:S}},Kf=(e,t)=>{vd(e.inputs),e.compute(xd(e.inputs,t,e.outputCount))}}),Sd,Xf,S_=F(()=>{ne(),qa(),Wa(),Sd=e=>{if(!e||e.length!==2)throw new Error("MatMul requires 2 inputs.");if(e[0].dims[e[0].dims.length-1]!==e[1].dims[e[1].dims.length-2])throw new Error("shared dimension does not match.")},Xf=e=>{Sd(e.inputs);let t=tr.calcShape(e.inputs[0].dims,e.inputs[1].dims,!0);if(!t)throw new Error("Can't use matmul on the given tensors");let r=t[t.length-1],i=e.inputs[0].dims[e.inputs[0].dims.length-1];if(r<8&&i<8)e.compute(La(e.inputs,{activation:""},t));else{let n=t[t.length-2],a=N.size(e.inputs[0].dims.slice(0,-2)),s=N.size(e.inputs[1].dims.slice(0,-2));if(a!==1&&n===1&&s===1){let o=e.inputs[0].reshape([1,a,i]),l=e.inputs[1].reshape([1,i,r]),d=[1,a,r],p=[o,l];e.compute(ci(p,{activation:""},t,d),{inputs:p})}else e.compute(ci(e.inputs,{activation:""},t))}}}),kd,Td,Id,Zf,Yf,k_=F(()=>{ie(),ne(),Ce(),ae(),kd=(e,t)=>{if(e.length<3||e.length>4)throw new Error("MatMulNBits requires 3 or 4 inputs");let r=e[0],i=r.dims.length;if(r.dims[i-1]!==t.k)throw new Error("The last dim of input shape does not match the k value");let n=Math.floor((t.k+t.blockSize-1)/t.blockSize),a=t.blockSize/8*t.bits,s=e[1];if(!N.areEqual(s.dims,[t.n,n,a]))throw new Error("The second inputs must be 3D tensor with shape N X nBlocksPerCol X blobSize");let o=e[2].dims;if(N.size(o)!==t.n*n)throw new Error("scales input size error.");if(e.length===4){let l=e[3].dims,d=t.n*(t.bits===8?n:Math.floor((n*t.bits+7)/8));if(N.size(l)!==d)throw new Error("zeroPoints input size error.")}},Td=(e,t)=>{let r=e[0].dims,i=r.length,n=r[i-2],a=t.k,s=t.n,o=r.slice(0,i-2),l=N.size(o),d=e[1].dims[2]/4,p=e[0].dataType,h=Te(t.k),f=Te(d),g=Te(s),m=o.concat([n,s]),b=n>1&&s/g%2===0?2:1,v=N.size(m)/g/b,$=64,w=[],S=[l,n,a/h],x=N.convertShape(e[1].dims).slice();x.splice(-1,1,d/f),w.push(...re(S)),w.push(...re(x)),w.push(...re(e[2].dims)),e.length===4&&w.push(...re(N.convertShape(e[3].dims)));let I=[l,n,s/g];w.push(...re(I));let C=z=>{let k=S.length,D=U("a",e[0].dataType,k,h),L=U("b",12,x.length,f),j=U("scales",e[2].dataType,e[2].dims.length),O=[D,L,j],G=e.length===4?U("zero_points",12,e[3].dims.length):void 0;G&&O.push(G);let M=I.length,B=ee("output",e[0].dataType,M,g),V=Me(e[0].dataType),Y=(()=>{switch(h){case 1:return`array<${V}, 8>`;case 2:return`mat4x2<${V}>`;case 4:return`mat2x4<${V}>`;default:throw new Error(`${h}-component is not supported.`)}})(),q=Math.floor(32/t.bits),H=Math.floor(q/8),X=()=>{let Q="";for(let R=0;R<H;R++){let se=R*t.bits*4,Ie=se+t.bits;Q+=`
          // reuse a data (pass ${R})
            var input_offset${R>0?R:""} = ${R===0?D.indicesToOffset(`${D.type.indices}(batch, row, word_offset)`):"input_offset"};
            var a_data${R>0?R:""}: ${Y};
            for (var j${R>0?R:""}: u32 = 0; j${R>0?R:""} < ${8/h}; j${R>0?R:""}++) {
              a_data${R>0?R:""}[j${R>0?R:""}] = ${D.getByOffset(`input_offset${R>0?R:""}`)};
              input_offset${R>0?R:""}++;
            }
          `;for(let Se=0;Se<g*b;Se++)Q+=`
            b_value = ${f===1?`b${Se}_data`:`b${Se}_data[i]`};
            ${t.bits===2?`{
              let half_word = b_value >> ${R*16}u;
              let byte_lo = half_word & 0xFFu;
              let byte_hi = (half_word >> 8u) & 0xFFu;
              let spread_word = (byte_lo & 0xFu) | ((byte_lo >> 4u) << 8u) | ((byte_hi & 0xFu) << 16u) | ((byte_hi >> 4u) << 24u);
              b_value_lower = unpack4xU8(spread_word & b_mask);
              b_value_upper = unpack4xU8((spread_word >> 2u) & b_mask);
            }`:`b_value_lower = unpack4xU8((b_value >> ${se}u) & b_mask);
            b_value_upper = unpack4xU8((b_value >> ${Ie}u) & b_mask);`}
            b_quantized_values = ${Y}(${Array.from({length:4},(Ne,ye)=>`${V}(b_value_lower[${ye}]), ${V}(b_value_upper[${ye}])`).join(", ")});
            b_dequantized_values = ${h===1?`${Y}(${Array.from({length:8},(Ne,ye)=>`(b_quantized_values[${ye}] - ${G?`zero_point${Se}`:"zero_point"}) * scale${Se}`).join(", ")});`:`(b_quantized_values - ${Y}(${Array(8).fill(`${G?`zero_point${Se}`:"zero_point"}`).join(",")})) * scale${Se};`};
            workgroup_shared[local_id.x * ${b} + ${Math.floor(Se/g)}]${g>1?`[${Se%g}]`:""} += ${Array.from({length:8/h},(Ne,ye)=>`${h===1?`a_data${R>0?R:""}[${ye}] * b_dequantized_values[${ye}]`:`dot(a_data${R>0?R:""}[${ye}], b_dequantized_values[${ye}])`}`).join(" + ")};
          `}return Q},W=()=>{let Q=`
            var col_index = col * ${g};
            ${G?`
            let zero_point_values_per_byte: u32 = ${Math.floor(8/t.bits)}u;
            let zero_point_bytes_per_col = (nBlocksPerCol + zero_point_values_per_byte - 1u) / zero_point_values_per_byte;
            var zero_point_byte_count: u32;
            var zero_point_word_index: u32;
            var zero_point_byte_offset: u32;
            let zero_point_sub_offset: u32 = block % zero_point_values_per_byte;
            var zero_point_bits_offset: u32;
            var zero_point_word: u32;`:`
            // The default zero point is ${Math.pow(2,t.bits-1)} for unsigned ${t.bits}-bit quantization.
            let zero_point = ${V}(${Math.pow(2,t.bits-1).toFixed(1)});`}
            `;for(let R=0;R<g*b;R++)Q+=`
            let scale${R} = ${j.getByOffset("col_index * nBlocksPerCol + block")};
            ${G?`
            zero_point_byte_count = col_index * zero_point_bytes_per_col + (block / zero_point_values_per_byte);
            zero_point_word_index = zero_point_byte_count >> 0x2u;
            zero_point_byte_offset = zero_point_byte_count & 0x3u;
            zero_point_bits_offset = (zero_point_byte_offset << 3) + (zero_point_sub_offset * ${t.bits}u);
            zero_point_word = ${G.getByOffset("zero_point_word_index")} >> zero_point_bits_offset;
            let zero_point${R} = ${V}((zero_point_word) & ${t.bits===2?"0x3u":"0xFu"});`:""}
            col_index += 1;`;return Q},J=()=>{let Q=`col_index = col * ${g};`;for(let R=0;R<g*b;R++)Q+=`
            let b${R}_data = ${L.getByIndices(`${L.type.indices}(col_index, block, word)`)};
            col_index += 1;`;return Q+=`
            var b_value: u32;
            let b_mask: u32 = ${t.bits===2?"0x03030303u":"0x0F0F0F0Fu"};
            var b_value_lower: vec4<u32>;
            var b_value_upper: vec4<u32>;
            var b_quantized_values: ${Y};
            var b_dequantized_values: ${Y};`,Q};return`
        var<workgroup> workgroup_shared: array<${B.type.value}, ${b*$}>;
        ${z.declareVariables(...O,B)}
        ${z.mainStart([$,1,1])}
          let output_indices = ${B.offsetToIndices(`(global_idx / ${$}) * ${b}`)};
          let col = output_indices[2];
          let row = output_indices[1];
          let batch = output_indices[0];
          let nBlocksPerCol = uniforms.b_shape[1];

          for (var block = local_id.x; block < nBlocksPerCol; block += ${$}) {
            //process one block
            var word_offset: u32 = block * ${t.blockSize/h};
            ${W()}
            for (var word: u32 = 0; word < ${d}; word += ${f}) {
              ${J()}
              for (var i: u32 = 0; i < ${f}; i++) {
                ${X()}
                word_offset += ${q/h};
              }
            }
          }
          workgroupBarrier();

          if (local_id.x < ${b}) {
            var output_value: ${B.type.value} = ${B.type.value}(0);
            var workgroup_shared_offset: u32 = local_id.x;
            for (var b: u32 = 0u; b < ${$}u; b++) {
              output_value += workgroup_shared[workgroup_shared_offset];
              workgroup_shared_offset += ${b};
            }
            ${B.setByIndices(`${B.type.indices}(batch, row, col + local_id.x)`,"output_value")};
          }
        }`};return{name:"MatMulNBits",shaderCache:{hint:`${t.blockSize};${t.bits};${h};${f};${g};${b};${$}`,inputDependencies:Array(e.length).fill("rank")},getRunData:()=>({outputs:[{dims:m,dataType:p}],dispatchGroup:{x:v},programUniforms:w}),getShaderSource:C}},Id=(e,t)=>{let r=e[0].dims,i=r.length,n=r[i-2],a=t.k,s=t.n,o=r.slice(0,i-2),l=N.size(o),d=e[1].dims[2]/4,p=e[0].dataType,h=Te(t.k),f=Te(d),g=o.concat([n,s]),m=128,b=s%8===0?8:s%4===0?4:1,v=m/b,$=Math.floor(32/t.bits),w=v*f*$,S=w/h,x=w/t.blockSize,I=N.size(g)/b,C=[],z=[l,n,a/h],k=N.convertShape(e[1].dims).slice();k.splice(-1,1,d/f),C.push(...re(z)),C.push(...re(k)),C.push(...re(e[2].dims)),e.length===4&&C.push(...re(N.convertShape(e[3].dims)));let D=[l,n,s];C.push(...re(D));let L=j=>{let O=z.length,G=U("a",e[0].dataType,O,h),M=U("b",12,k.length,f),B=U("scales",e[2].dataType,e[2].dims.length),V=[G,M,B],Y=e.length===4?U("zero_points",12,e[3].dims.length):void 0;Y&&V.push(Y);let q=D.length,H=ee("output",e[0].dataType,q),X=Me(e[0].dataType),W=()=>{switch(h){case 1:return`
          let a_data0 = vec4<${X}>(sub_a[word_offset], sub_a[word_offset + 1], sub_a[word_offset + 2], sub_a[word_offset + 3]);
          let a_data1 = vec4<${X}>(sub_a[word_offset + 4], sub_a[word_offset + 5], sub_a[word_offset + 6], sub_a[word_offset + 7]);`;case 2:return`
          let a_data0 = vec4<${X}>(sub_a[word_offset], sub_a[word_offset + 1]);
          let a_data1 = vec4<${X}>(sub_a[word_offset + 2], sub_a[word_offset + 3]);`;case 4:return`
          let a_data0 = sub_a[word_offset];
          let a_data1 = sub_a[word_offset + 1];`;default:throw new Error(`${h}-component is not supported.`)}};return`
        var<workgroup> sub_a: array<${G.type.value}, ${S}>;
        var<workgroup> inter_results: array<array<${H.type.value}, ${v}>, ${b}>;
        ${j.declareVariables(...V,H)}
        ${j.mainStart([v,b,1])}
          let output_indices = ${H.offsetToIndices(`workgroup_index * ${b}`)};
          let col = output_indices[2];
          let row = output_indices[1];
          let batch = output_indices[0];
          let n_blocks_per_col = uniforms.b_shape[1];
          let num_tiles =  (n_blocks_per_col - 1) / ${x} + 1;

          // Loop over shared dimension.
          for (var tile: u32 = 0; tile < num_tiles; tile += 1) {
            let a_col_start = tile * ${S};
            // load one tile A data into shared memory.
            for (var a_offset = local_idx; a_offset < ${S}; a_offset += ${m})
            {
              let a_col = a_col_start + a_offset;
              if (a_col < uniforms.a_shape[2])
              {
                sub_a[a_offset] = ${G.getByIndices(`${G.type.indices}(batch, row, a_col)`)};
              } else {
                sub_a[a_offset] = ${G.type.value}(0);
              }
            }
            workgroupBarrier();

            // each thread process one block
            let b_row = col + local_id.y;
            let block = tile * ${x} + local_id.x;
            ${Y?`
            let zero_point_values_per_byte: u32 = ${Math.floor(8/t.bits)}u;
            let zero_point_bytes_per_col = (n_blocks_per_col + zero_point_values_per_byte - 1u) / zero_point_values_per_byte;
            let zero_point_byte_count = b_row * zero_point_bytes_per_col + (block / zero_point_values_per_byte);
            let zero_point_word_index = zero_point_byte_count >> 0x2u;
            let zero_point_byte_offset = zero_point_byte_count & 0x3u;
            let zero_point_sub_offset: u32 = block % zero_point_values_per_byte;
            let zero_point_bits_offset = (zero_point_byte_offset << 3) + (zero_point_sub_offset * ${t.bits}u);
            let zero_point_word = ${Y.getByOffset("zero_point_word_index")} >> zero_point_bits_offset;
            let zero_point = ${X}((zero_point_word) & ${t.bits===2?"0x3u":"0xFu"});`:`
            // The default zero point is ${Math.pow(2,t.bits-1)} for unsigned ${t.bits}-bit quantization.
            let zero_point = ${X}(${Math.pow(2,t.bits-1).toFixed(1)});`}
            let scale = ${B.getByOffset("b_row * n_blocks_per_col + block")};
            let b_data = ${M.getByIndices(`${M.type.indices}(b_row, block, 0)`)};
            var word_offset = local_id.x * ${t.blockSize/h};
            for (var i: u32 = 0; i < ${f}; i++) {
              let b_value = ${f===1?"b_data":"b_data[i]"};
              ${(()=>{let J=Math.floor($/8),Q="";for(let R=0;R<J;R++){let se=R*t.bits*4,Ie=se+t.bits;Q+=`
              ${W()}
              {${t.bits===2?`
                let half_word = b_value >> ${R*16}u;
                let byte_lo = half_word & 0xFFu;
                let byte_hi = (half_word >> 8u) & 0xFFu;
                let spread_word = (byte_lo & 0xFu) | ((byte_lo >> 4u) << 8u) | ((byte_hi & 0xFu) << 16u) | ((byte_hi >> 4u) << 24u);
                let b_value_lower = unpack4xU8(spread_word & 0x03030303u);
                let b_value_upper = unpack4xU8((spread_word >> 2u) & 0x03030303u);`:`
                let b_value_lower = unpack4xU8((b_value >> ${se}u) & 0x0F0F0F0Fu);
                let b_value_upper = unpack4xU8((b_value >> ${Ie}u) & 0x0F0F0F0Fu);`}
                let b_quantized_values = mat2x4<${X}>(${Array.from({length:4},(Se,Ne)=>`${X}(b_value_lower[${Ne}]), ${X}(b_value_upper[${Ne}])`).join(", ")});
                let b_dequantized_values = (b_quantized_values - mat2x4<${X}>(${Array(8).fill("zero_point").join(",")})) * scale;
                inter_results[local_id.y][local_id.x] += ${Array.from({length:2},(Se,Ne)=>`${`dot(a_data${Ne}, b_dequantized_values[${Ne}])`}`).join(" + ")};
              }
              word_offset += ${8/h};`}return Q})()}
            }
            workgroupBarrier();
          }

          if (local_idx < ${b}) {
            var output_value: ${H.type.value} = ${H.type.value}(0);
            for (var b = 0u; b < ${v}; b++) {
              output_value += inter_results[local_idx][b];
            }
            if (col + local_idx < uniforms.output_shape[2])
            {
              ${H.setByIndices(`${H.type.indices}(batch, row, col + local_idx)`,"output_value")}
            }
          }
        }`};return{name:"BlockwiseMatMulNBits32",shaderCache:{hint:`${t.blockSize};${h};${f};${v};${b}`,inputDependencies:Array(e.length).fill("rank")},getRunData:()=>({outputs:[{dims:g,dataType:p}],dispatchGroup:{x:I},programUniforms:C}),getShaderSource:L}},Zf=(e,t)=>{kd(e.inputs,t),t.blockSize===32&&e.adapterInfo.isVendor("intel")&&e.adapterInfo.isArchitecture("gen-12lp")?e.compute(Id(e.inputs,t)):e.compute(Td(e.inputs,t))},Yf=e=>me(e)}),Ed,Cd,zd,Ad,Md,Od,Rd,Nd,Qf,T_=F(()=>{ie(),ne(),ae(),Ed=e=>{if(!e||e.length<1)throw new Error("Too few inputs");if(e[0].dataType!==1&&e[0].dataType!==10)throw new Error("Input type must be float or float16.");if(e.length>=2){let t=e[0].dims.length*2===e[1].dims[0];if(e.length===4&&(t=e[3].dims[0]*2===e[1].dims[0]),!t)throw new Error("The pads should be a 1D tensor of shape [2 * input_rank] or [2 * num_axes].")}},Cd=(e,t,r)=>{let i="";for(let n=t-1;n>=0;--n)i+=`
            k = i32(${e.indicesGet("indices",n)}) - ${te("uniforms.pads",n,r)};
            if (k < 0) {
              break;
            }
            if (k >= i32(${te("uniforms.x_shape",n,t)})) {
              break;
            }
            offset += k * i32(${te("uniforms.x_strides",n,t)});
        `;return`
          value = ${e.type.value}(uniforms.constant_value);
          for (var i = 0; i < 1; i++) {
            var offset = 0;
            var k = 0;
            ${i}
            value = x[offset];
          }
      `},zd=(e,t,r)=>{let i="";for(let n=t-1;n>=0;--n)i+=`
                k = i32(${e.indicesGet("indices",n)}) - ${te("uniforms.pads",n,r)};
                if (k < 0) {
                  k = -k;
                }
                {
                  let _2n_1 = 2 * (i32(${te("uniforms.x_shape",n,t)}) - 1);
                  k = k % _2n_1;
                  if(k >= i32(${te("uniforms.x_shape",n,t)})) {
                    k = _2n_1 - k;
                  }
                }
                offset += k * i32(${te("uniforms.x_strides",n,t)});
            `;return`
              var offset = 0;
              var k = 0;
              ${i}
              value = x[offset];
          `},Ad=(e,t,r)=>{let i="";for(let n=t-1;n>=0;--n)i+=`
                k = i32(${e.indicesGet("indices",n)}) - ${te("uniforms.pads",n,r)};
                if (k < 0) {
                  k = 0;
                }
                if (k >= i32(${te("uniforms.x_shape",n,t)})) {
                  k = i32(${te("uniforms.x_shape",n,t)}) - 1;
                }
                offset += k * i32(${te("uniforms.x_strides",n,t)});
            `;return`
              var offset = 0;
              var k = 0;
              ${i}
              value = x[offset];
          `},Md=(e,t,r)=>{let i="";for(let n=t-1;n>=0;--n)i+=`
                k = i32(${e.indicesGet("indices",n)}) - ${te("uniforms.pads",n,r)};
                if (k < 0)  {
                  k += i32(${te("uniforms.x_shape",n,t)}]);
                }
                if (k >= i32(${te("uniforms.x_shape",n,t)})) {
                  k -= i32(${te("uniforms.x_shape",n,t)});
                }
                offset += k * i32(${te("uniforms.x_strides",n,t)});
            `;return`
              var offset = 0;
              var k = 0;
              ${i}
              value = x[offset];
          `},Od=(e,t,r)=>{switch(r.mode){case 0:return Cd(e,t,r.pads.length);case 1:return zd(e,t,r.pads.length);case 2:return Ad(e,t,r.pads.length);case 3:return Md(e,t,r.pads.length);default:throw new Error("Invalid mode")}},Rd=(e,t)=>{let r=N.padShape(e[0].dims.slice(),t.pads),i=e[0].dims,n=N.size(r),a=[{type:12,data:n},{type:6,data:t.pads}],s=e.length>=3&&e[2].data;t.mode===0&&a.push({type:s?e[2].dataType:1,data:t.value}),a.push(...re(e[0].dims,r));let o=["rank"],l=d=>{let p=ee("output",e[0].dataType,r.length),h=U("x",e[0].dataType,i.length),f=h.type.value,g=Od(p,i.length,t),m=[{name:"output_size",type:"u32"},{name:"pads",type:"i32",length:t.pads.length}];return t.mode===0&&m.push({name:"constant_value",type:s?f:"f32"}),`
            ${d.registerUniforms(m).declareVariables(h,p)}
            ${d.mainStart()}
            ${d.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}

            let indices = ${p.offsetToIndices("global_idx")};

            var value = ${f}(0);
            ${g}
            output[global_idx] = value;
        }`};return{name:"Pad",shaderCache:{hint:`${t.mode}${s}`,inputDependencies:o},getRunData:()=>({outputs:[{dims:r,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(N.size(r)/64)},programUniforms:a}),getShaderSource:l}},Nd=(e,t)=>{if(e.length>1){let r=e[1].getBigInt64Array(),i=e.length>=3&&e[2].data?e[2].dataType===10?e[2].getUint16Array()[0]:e[2].getFloat32Array()[0]:0,n=e[0].dims.length,a=new Int32Array(2*n).fill(0);if(e.length>=4){let o=e[3].getBigInt64Array();for(let l=0;l<o.length;l++)a[Number(o[l])]=Number(r[l]),a[Number(o[l])+n]=Number(r[l+o.length])}else r.forEach((o,l)=>a[Number(l)]=Number(o));let s=[];return a.forEach(o=>s.push(o)),{mode:t.mode,value:i,pads:s}}else return t},Qf=(e,t)=>{Ed(e.inputs);let r=Nd(e.inputs,t);e.compute(Rd(e.inputs,r),{inputs:[0]})}}),fr,In,En,Cn,zn,Bd,Dd,An,Mn,Jf,em,On,tm,rm,Rn,im,nm,am,sm,I_=F(()=>{Ke(),ie(),ne(),ae(),fr=e=>{if(be.webgpu.validateInputContent&&(!e||e.length!==1))throw new Error("Pool ops requires 1 input.")},In=(e,t,r)=>{let i=t.format==="NHWC",n=e.dims.slice();i&&n.splice(1,0,n.pop());let a=Object.hasOwnProperty.call(t,"dilations"),s=t.kernelShape.slice(),o=t.strides.slice(),l=a?t.dilations.slice():[],d=t.pads.slice();di.adjustPoolAttributes(r,n,s,o,l,d);let p=di.computePoolOutputShape(r,n,o,l,s,d,t.autoPad),h=Object.assign({},t);a?Object.assign(h,{kernelShape:s,strides:o,pads:d,dilations:l,cacheKey:t.cacheKey}):Object.assign(h,{kernelShape:s,strides:o,pads:d,cacheKey:t.cacheKey});let f=p.slice();return f.push(f.splice(1,1)[0]),[h,i?f:p]},En=(e,t)=>{let r=t.format==="NHWC",i=N.size(e),n=N.size(t.kernelShape),a=[{type:12,data:i},{type:12,data:n}],s=[{name:"outputSize",type:"u32"},{name:"kernelSize",type:"u32"}];if(t.kernelShape.length<=2){let o=t.kernelShape[t.kernelShape.length-1],l=t.strides[t.strides.length-1],d=t.pads[t.pads.length/2-1],p=t.pads[t.pads.length-1],h=!!(d+p);a.push({type:12,data:o},{type:12,data:l},{type:12,data:d},{type:12,data:p}),s.push({name:"kw",type:"u32"},{name:"sw",type:"u32"},{name:"pwStart",type:"u32"},{name:"pwEnd",type:"u32"});let f=!1;if(t.kernelShape.length===2){let g=t.kernelShape[t.kernelShape.length-2],m=t.strides[t.strides.length-2],b=t.pads[t.pads.length/2-2],v=t.pads[t.pads.length-2];f=!!(b+v),a.push({type:12,data:g},{type:12,data:m},{type:12,data:b},{type:12,data:v}),s.push({name:"kh",type:"u32"},{name:"sh",type:"u32"},{name:"phStart",type:"u32"},{name:"phEnd",type:"u32"})}return[a,s,!0,h,f]}else{if(r)throw new Error("Pooling with kernelShape.length > 2 is not supported for NHWC format.");let o=N.computeStrides(t.kernelShape);a.push({type:12,data:o},{type:12,data:t.pads},{type:12,data:t.strides}),s.push({name:"kernelStrides",type:"u32",length:o.length},{name:"pads",type:"u32",length:t.pads.length},{name:"strides",type:"u32",length:t.strides.length});let l=t.pads.reduce((d,p)=>d+p);return[a,s,!!l,!1,!1]}},Cn=(e,t,r,i,n,a,s,o,l,d,p,h)=>{let f=n.format==="NHWC",g=t.type.value,m=ee("output",t.type.tensor,i);if(n.kernelShape.length<=2){let b="",v="",$="",w=r-(f?2:1);if(p?b=`
                for (var i: u32 = 0u; i < uniforms.kw; i++) {
                  xIndices[${w}] = indices[${w}] * uniforms.sw - uniforms.pwStart + i;
                  if (xIndices[${w}] < 0 || xIndices[${w}]
                      >= uniforms.x_shape[${w}]) {
                    pad++;
                    continue;
                  }
                  let x_val = x[${t.indicesToOffset("xIndices")}];
                  ${a}
                }`:b=`
                for (var i: u32 = 0u; i < uniforms.kw; i++) {
                  xIndices[${w}] = indices[${w}] * uniforms.sw - uniforms.pwStart + i;
                  let x_val = x[${t.indicesToOffset("xIndices")}];
                  ${a}
                }`,n.kernelShape.length===2){let S=r-(f?3:2);h?v=`
                for (var j: u32 = 0u; j < uniforms.kh; j++) {
                  xIndices[${S}] = indices[${S}] * uniforms.sh - uniforms.phStart + j;
                  if (xIndices[${S}] < 0 || xIndices[${S}] >= uniforms.x_shape[${S}]) {
                    pad += i32(uniforms.kw);
                    continue;
                  }
              `:v=`
                for (var j: u32 = 0u; j < uniforms.kh; j++) {
                  xIndices[${S}] = indices[${S}] * uniforms.sh - uniforms.phStart + j;
                `,$=`
              }
            `}return`
            ${e.registerUniforms(l).declareVariables(t,m)}

            ${e.mainStart()}
              ${e.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}

              let indices = ${m.offsetToIndices("global_idx")};
              var xIndices = ${m.offsetToIndices("global_idx")};

              var value = ${g}(${o});
              var pad = 0;
              ${v}
              ${b}
              ${$}
              ${s}

              output[global_idx] = value;
            }`}else{if(f)throw new Error("Pooling with kernelShape.length > 2 is not supported for NHWC format.");let b=n.kernelShape.length,v=n.pads.length,$="";return d?$=`
                if (xIndices[j] >= uniforms.x_shape[j]) {
                  pad++;
                  isPad = true;
                  break;
                }
              }
              if (!isPad) {
                let x_val = x[${t.indicesToOffset("xIndices")}];
                ${a}
              }`:$=`
              }
              let x_val = x[${t.indicesToOffset("xIndices")}];
              ${a}
            `,`
            ${e.registerUniforms(l).declareVariables(t,m)}

            ${e.mainStart()}
              ${e.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}
              let indices = ${m.offsetToIndices("global_idx")};
              var xIndices = ${m.offsetToIndices("global_idx")};

              var offsets: array<u32, ${b}>;

              var value = ${g}(${o});
              var pad = 0;
              var isPad = false;

              for (var i: u32 = 0u; i < uniforms.kernelSize; i++) {
                var offset = i;
                for (var j = 0u; j < ${b-1}u; j++) {
                  offsets[j] = offset / ${te("uniforms.kernelStrides","j",b)};
                  offset -= offsets[j] * ${te("uniforms.kernelStrides","j",b)};
                }
                offsets[${b-1}] = offset;

                isPad = false;
                for (var j = ${r-b}u; j < ${r}u; j++) {
                  xIndices[j] = indices[j] * ${te("uniforms.strides",`j - ${r-b}u`,b)}
                    + offsets[j - ${r-b}u] - ${te("uniforms.pads","j - 2u",v)};
                  ${$}
              }
              ${s}

              output[global_idx] = value;
            }`}},zn=e=>`${e.format};${e.ceilMode};${e.autoPad};${e.kernelShape.length}`,Bd=e=>`${zn(e)};${e.countIncludePad}`,Dd=e=>`${zn(e)};${e.storageOrder};${e.dilations}`,An=e=>({format:e.format,autoPad:["NOTSET","VALID","SAME_UPPER","SAME_LOWER"][e.auto_pad],ceilMode:e.ceil_mode,kernelShape:e.kernel_shape,strides:e.strides,pads:e.pads}),Mn=(e,t,r,i)=>{let[n,a]=In(t,i,r),s=U("x",t.dataType,t.dims.length),o=s.type.value,l="value += x_val;",d="";n.countIncludePad?d+=`value /= ${o}(uniforms.kernelSize);`:d+=`value /= ${o}(i32(uniforms.kernelSize) - pad);`;let[p,h,f,g,m]=En(a,n);p.push(...re(t.dims,a));let b=["rank"];return{name:e,shaderCache:{hint:`${i.cacheKey};${f};${g};${m}`,inputDependencies:b},getRunData:()=>({outputs:[{dims:a,dataType:t.dataType}],dispatchGroup:{x:Math.ceil(N.size(a)/64)},programUniforms:p}),getShaderSource:v=>Cn(v,s,t.dims.length,a.length,n,l,d,0,h,f,g,m)}},Jf=e=>{let t=e.count_include_pad!==0,r=An(e);if(r.ceilMode!==0)throw new Error("using ceil() in shape computation is not yet supported for AveragePool");let i={countIncludePad:t,...r,cacheKey:""};return{...i,cacheKey:Bd(i)}},em=(e,t)=>{fr(e.inputs),e.compute(Mn("AveragePool",e.inputs[0],!1,t))},On={autoPad:"",ceilMode:0,countIncludePad:!1,kernelShape:[],strides:[],pads:[],storageOrder:0,dilations:[]},tm=e=>{let t=e.format;return{format:t,...On,cacheKey:t}},rm=(e,t)=>{fr(e.inputs),e.compute(Mn("GlobalAveragePool",e.inputs[0],!0,t))},Rn=(e,t,r,i)=>{let[n,a]=In(t,i,r),s=`
      value = max(x_val, value);
    `,o="",l=U("x",t.dataType,t.dims.length),d=["rank"],[p,h,f,g,m]=En(a,n);return p.push(...re(t.dims,a)),{name:e,shaderCache:{hint:`${i.cacheKey};${f};${g};${m}`,inputDependencies:d},getRunData:()=>({outputs:[{dims:a,dataType:t.dataType}],dispatchGroup:{x:Math.ceil(N.size(a)/64)},programUniforms:p}),getShaderSource:b=>Cn(b,l,t.dims.length,a.length,n,s,o,t.dataType===10?-65504:-1e5,h,f,g,m)}},im=(e,t)=>{fr(e.inputs),e.compute(Rn("MaxPool",e.inputs[0],!1,t))},nm=e=>{let t=e.storage_order,r=e.dilations,i=An(e);if(t!==0)throw new Error("column major storage order is not yet supported for MaxPool");if(i.ceilMode!==0)throw new Error("using ceil() in shape computation is not yet supported for MaxPool");let n={storageOrder:t,dilations:r,...i,cacheKey:""};return{...n,cacheKey:Dd(n)}},am=e=>{let t=e.format;return{format:t,...On,cacheKey:t}},sm=(e,t)=>{fr(e.inputs),e.compute(Rn("GlobalMaxPool",e.inputs[0],!0,t))}}),Pd,Ud,om,um,E_=F(()=>{ie(),ne(),Ce(),ae(),Pd=(e,t)=>{if(e.length<2||e.length>3)throw new Error("DequantizeLinear requires 2 or 3 inputs.");if(e.length===3&&e[1].dims===e[2].dims)throw new Error("x-scale and x-zero-point must have the same shape.");if(e.length===3&&e[0].dataType!==e[2].dataType)throw new Error("x and x-zero-point must have the same data type.");if(e[1].dims.length!==0&&e[1].dims.length!==1&&e[1].dims.length!==e[0].dims.length)throw new Error("scale input must be a scalar, a 1D tensor, or have the same rank as the input tensor.");if(e.length>2){if(e[0].dataType!==e[2].dataType)throw new Error("x and x-zero-point must have the same data type.");if(e[1].dims.length!==e[2].dims.length)throw new Error("scale and zero-point inputs must have the same rank.");if(!e[1].dims.map((r,i)=>r===e[2].dims[i]).reduce((r,i)=>r&&i,!0))throw new Error("scale and zero-point inputs must have the same shape.")}if(t.blockSize>0){if(e[1].dims.length===0||e[1].dims.length===1&&e[1].dims[0]===1)throw new Error("blockSize must be set only for block quantization.");if(!e[1].dims.map((n,a)=>a===t.axis||n===e[0].dims[a]).reduce((n,a)=>n&&a,!0))throw new Error("For block qunatization, scale input shape to match the input shape except for the axis");if(e[1].dims.length!==e[0].dims.length)throw new Error("For block qunatization the scale input rank must be the same as the x rank.");let r=e[0].dims[t.axis],i=e[1].dims[t.axis];if(t.blockSize<Math.ceil(r/i)||t.blockSize>Math.ceil(r/(i-1)-1))throw new Error("blockSize must be with in the range [ceil(dI / Si), ceil(dI / (Si - 1) - 1)].")}},Ud=(e,t)=>{let r=N.normalizeAxis(t.axis,e[0].dims.length),i=e[0].dataType,n=i===3,a=e[0].dims,s=e[1].dataType,o=N.size(a),l=i===3||i===2,d=l?[Math.ceil(N.size(e[0].dims)/4)]:e[0].dims,p=e[1].dims,h=e.length>2?e[2]:void 0,f=h?l?[Math.ceil(N.size(h.dims)/4)]:h.dims:void 0,g=p.length===0||p.length===1&&p[0]===1,m=g===!1&&p.length===1,b=Te(o),v=g&&(!l||b===4),$=v?b:1,w=v&&!l?b:1,S=U("input",l?12:i,d.length,w),x=U("scale",s,p.length),I=h?U("zero_point",l?12:i,f.length):void 0,C=ee("output",s,a.length,$),z=[S,x];I&&z.push(I);let k=[d,p];h&&k.push(f);let D=[{type:12,data:o/$},{type:12,data:r},{type:12,data:t.blockSize},...re(...k,a)],L=j=>{let O=[{name:"output_size",type:"u32"},{name:"axis",type:"u32"},{name:"block_size",type:"u32"}];return`
      ${j.registerUniforms(O).declareVariables(...z,C)}
      ${j.mainStart()}
          ${j.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
          let output_indices = ${C.offsetToIndices("global_idx")};

          // Set input x
          ${l?`
            let input = ${S.getByOffset("global_idx / 4")};
            let x_vec = ${n?"unpack4xI8(input)":"unpack4xU8(input)"};
            let x_value = ${$===1?"x_vec[global_idx % 4]":"x_vec"};`:`let x_value = ${S.getByOffset("global_idx")};`};

          // Set scale input
          ${g?`let scale_value= ${x.getByOffset("0")}`:m?`
            let scale_index = ${C.indicesGet("output_indices","uniforms.axis")};
            let scale_value= ${x.getByOffset("scale_index")};`:`
            var scale_indices: ${x.type.indices} = output_indices;
            let index = ${x.indicesGet("scale_indices","uniforms.axis")} / uniforms.block_size;
            ${x.indicesSet("scale_indices","uniforms.axis","index")};
            let scale_value= ${x.getByIndices("scale_indices")};`};

          // Set zero-point input
          ${I?g?l?`
                let zero_point_input = ${I.getByOffset("0")};
                let zero_point_vec =  ${n?"unpack4xI8(zero_point_input)":"unpack4xU8(zero_point_input)"};
                let zero_point_value= zero_point_vec[0]`:`let zero_point_value = ${I.getByOffset("0")}`:m?l?`
                let zero_point_index = ${C.indicesGet("output_indices","uniforms.axis")};
                let zero_point_input = ${I.getByOffset("zero_point_index / 4")};
                let zero_point_vec =  ${n?"unpack4xI8(zero_point_input)":"unpack4xU8(zero_point_input)"};
                let zero_point_value = zero_point_vec[zero_point_index % 4]`:`
                let zero_point_index = ${C.indicesGet("output_indices","uniforms.axis")};
                let zero_point_value = ${I.getByOffset("zero_point_index")};`:l?`
                let zero_point_offset = ${x.indicesToOffset("scale_indices")};
                let zero_point_input = ${I.getByOffset("zero_point_offset / 4")};
                let zero_point_vec = ${n?"unpack4xI8(zero_point_input)":"unpack4xU8(zero_point_input)"};
                let zero_point_value = zero_point_vec[zero_point_offset % 4];`:`let zero_point_value = ${I.getByIndices("scale_indices")};`:`let zero_point_value = ${l?n?"i32":"u32":S.type.value}(0);`};
      // Compute and write output
      ${C.setByOffset("global_idx",`${C.type.value}(x_value - zero_point_value) * scale_value`)};
      }`};return{name:"DequantizeLinear",shaderCache:{hint:t.cacheKey,inputDependencies:I?["rank","rank","rank"]:["rank","rank"]},getShaderSource:L,getRunData:()=>({outputs:[{dims:a,dataType:s}],dispatchGroup:{x:Math.ceil(o/$/64),y:1,z:1},programUniforms:D})}},om=(e,t)=>{Pd(e.inputs,t),e.compute(Ud(e.inputs,t))},um=e=>me({axis:e.axis,blockSize:e.blockSize})}),Ld,qd,lm,C_=F(()=>{Ke(),ie(),ae(),Ld=(e,t,r)=>{let i=e===t,n=e<t&&r<0,a=e>t&&r>0;if(i||n||a)throw new Error("Range these inputs' contents are invalid.")},qd=(e,t,r,i)=>{let n=Math.abs(Math.ceil((t-e)/r)),a=[n],s=n,o=[{type:12,data:s},{type:i,data:e},{type:i,data:r},...re(a)],l=d=>{let p=ee("output",i,a.length),h=p.type.value,f=[{name:"outputSize",type:"u32"},{name:"start",type:h},{name:"delta",type:h}];return`
        ${d.registerUniforms(f).declareVariables(p)}
        ${d.mainStart()}
        ${d.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}
        output[global_idx] = uniforms.start + ${h}(global_idx) * uniforms.delta;
      }`};return{name:"Range",shaderCache:{hint:`${i}`},getShaderSource:l,getRunData:()=>({outputs:[{dims:a,dataType:i}],dispatchGroup:{x:Math.ceil(s/64)},programUniforms:o})}},lm=e=>{let t=0,r=0,i=0;e.inputs[0].dataType===6?(t=e.inputs[0].getInt32Array()[0],r=e.inputs[1].getInt32Array()[0],i=e.inputs[2].getInt32Array()[0]):e.inputs[0].dataType===1&&(t=e.inputs[0].getFloat32Array()[0],r=e.inputs[1].getFloat32Array()[0],i=e.inputs[2].getFloat32Array()[0]),be.webgpu.validateInputContent&&Ld(t,r,i),e.compute(qd(t,r,i,e.inputs[0].dataType),{inputs:[]})}}),Wd,Gd,dm,pm,z_=F(()=>{ie(),ne(),Ce(),ae(),Wd=(e,t,r,i)=>{if(e!=="none"&&i!=="i32"&&i!=="u32"&&i!=="f32")throw new Error(`Input ${i} is not supported with reduction ${e}.`);let n=`{
                var oldValue = 0;
                loop {
                  let newValueF32 =`,a=`;
                  let newValue = bitcast<i32>(newValueF32);
                  let res = atomicCompareExchangeWeak(&${t}, oldValue, newValue);
                  if res.exchanged {
                    break;
                  }
                  oldValue = res.old_value;
                }
              }`;switch(e){case"none":return`${t}=${r};`;case"add":return i==="i32"||i==="u32"?`atomicAdd(&${t}, bitcast<${i}>(${r}));`:`
              ${n}bitcast<${i}>(oldValue) + (${r})${a}`;case"max":return i==="i32"||i==="u32"?`atomicMax(&${t}, bitcast<${i}>(${r}));`:`
                ${n}max(bitcast<f32>(oldValue), (${r}))${a}`;case"min":return i==="i32"||i==="u32"?`atomicMin(&${t}, bitcast<${i}>(${r}));`:`${n}min(bitcast<${i}>(oldValue), (${r}))${a}`;case"mul":return`${n}(bitcast<${i}>(oldValue) * (${r}))${a}`;default:throw new Error(`Reduction ${e} is not supported.`)}},Gd=(e,t)=>{let r=e[0].dims,i=e[1].dims,n=r,a=1,s=Math.ceil(N.sizeToDimension(i,i.length-1)/a),o=i[i.length-1],l=N.sizeFromDimension(r,o),d=[{type:12,data:s},{type:12,data:o},{type:12,data:l},...re(e[1].dims,e[2].dims,n)],p=h=>{let f=U("indices",e[1].dataType,e[1].dims.length),g=U("updates",e[2].dataType,e[2].dims.length,a),m=t.reduction!=="none"&&t.reduction!==""?Pc("output",e[0].dataType,n.length):ee("output",e[0].dataType,n.length,a);return`
      ${h.registerUniform("output_size","u32").registerUniform("last_index_dimension","u32").registerUniform("num_updates_elements","u32").declareVariables(f,g,m)}
      ${h.mainStart()}
        ${h.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
  var data_offset = 0u;
  let indices_start = uniforms.last_index_dimension * global_idx;
  let indices_end = indices_start + uniforms.last_index_dimension;
  for (var i = indices_start; i < indices_end; i++) {
    var index = i32(indices[i].x);
    ${e[0].dims.length===1?`
    let element_count_dim = uniforms.output_strides;
    let dim_value = uniforms.output_shape;`:`
    let element_count_dim = uniforms.output_strides[i - indices_start];
    let dim_value = uniforms.output_shape[i - indices_start];`}
    if (index >= 0) {
      if (index >= i32(dim_value)) {
        index = i32(dim_value - 1);
      }
    } else {
      if (index < -i32(dim_value)) {
        index = 0;
      } else {
        index += i32(dim_value);
      }
    }
    data_offset += u32((u32(index) * element_count_dim));
  }

  for (var i = 0u; i < uniforms.num_updates_elements; i++) {
    let value = updates[uniforms.num_updates_elements * global_idx + i];
    ${Wd(t.reduction,"output[data_offset + i]","value",m.type.value)}
  }

      }`};return{name:"ScatterND",shaderCache:{hint:`${t.cacheKey}_${t.reduction}`,inputDependencies:["rank","rank"]},getRunData:()=>({outputs:[{dims:n,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(s/64)},programUniforms:d}),getShaderSource:p}},dm=e=>me({reduction:e.reduction}),pm=(e,t)=>{e.compute(Gd(e.inputs,t),{inputs:[e.inputs[1],e.inputs[2]],outputs:[]})}}),Vd,Fd,Hd,Nn,jd,Kd,Xd,Zd,Yd,Qd,Jd,ep,Bn,tp,rp,ip,np,ap,cm,hm,A_=F(()=>{ie(),ne(),Ce(),ae(),Vd=(e,t)=>{if(e.every(r=>r>0||(()=>{throw new Error("Resize requires scales input values to be positive")})),e.length>0){if(t.mode==="linear"){if(!(e.length===2||e.length===3||e.length===4&&e[0]===1&&e[1]===1||e.length===4&&e[0]===1&&e[3]===1||e.length===5&&e[0]===1&&e[1]===1))throw new Error(`For linear mode, Resize requires scales to be 2D, 3D, 4D with either two outermost or one innermost and
            one outermost scale values equal to 1, or 5D with two outermost scale values equal to 1`)}else if(t.mode==="cubic"&&!(e.length===2||e.length===4&&e[0]===1&&e[1]===1||e.length===4&&e[0]===1&&e[3]===1))throw new Error("Resize requires scales input size to be 2 or 4 for cubic mode")}},Fd=(e,t,r)=>{t.every(n=>n>=0&&n<r||(()=>{throw new Error("Resize requires axes input values to be positive and less than rank")}));let i=new Array(r).fill(1);return t.forEach((n,a)=>i[n]=e[a]),i},Hd=(e,t,r,i,n,a)=>{let[s,o,l]=r>10?[1,2,3]:[-1,e.length>1?1:-1,-1],d=e[0].dims.length;if(s>0&&e.length>s&&e[s].dims.length>0)e[s].getFloat32Array().forEach(p=>a.push(p));else if(t.coordinateTransformMode==="tf_crop_and_resize")throw new Error("Resize requires RoI input to be specified when coordinateTransformMode is tfCropAndResize");if(o>0&&e.length>o&&e[o].dims.length===1&&e[o].dims[0]>0){if(e[o].getFloat32Array().forEach(p=>i.push(p)),i.length!==0&&i.length!==d&&r>=18&&i.length!==t.axes.length)throw new Error("Resize requires scales input size to be same as input rank or axes size for opset 18 and up");Vd(i,t),t.axes.length>0&&Fd(i,t.axes,d).forEach((p,h)=>i[h]=p)}if(l>0&&e.length>l&&e[l].dims.length===1&&e[l].dims[0]>0&&(e[l].getBigInt64Array().forEach(p=>n.push(Number(p))),n.length!==0&&n.length!==d&&r>=18&&n.length!==t.axes.length))throw new Error("Resize requires sizes input size to be same as input rank or axes size for opset 18 and up");if(t.axes.length>0){if(i.length!==0&&i.length!==t.axes.length)throw new Error('Resize requires "scales" input size to be of axes rank when axes attributes is specified');if(n.length!==0&&n.length!==t.axes.length)throw new Error('Resize requires "sizes" input size to be of rank axes rank when axes attributes is specified')}if(typeof i<"u"&&typeof n<"u"&&i.length>0&&n.length>d)throw new Error("Resize requires only of scales or sizes to be specified")},Nn=(e,t,r,i)=>`
  // The whole part and the fractional part are calculated separately due to inaccuracy of floating
  // point division. As an example, f32(21) / f32(7) may evaluate to 2.99... instead of 3, causing an
  // offset-by-one error later in floor().
  let big = (${e}) * (${t});
  let whole = ${i}(big / (${r}));
  let fract = ${i}(big % (${r})) / ${i}(${r});
  return whole + fract;
`,jd=(e,t)=>`fn getOriginalCoordinateFromResizedCoordinate(xResized: u32, xScale: f32, lengthResized: u32,
     lengthOriginal: u32, roiStart: f32, roiEnd: f32) -> ${t} { `+(()=>{switch(e){case"asymmetric":return`
          if (xScale < 1.0 || floor(xScale) != xScale) {
            return ${t}(xResized) / ${t}(xScale);
          } else {
            ${Nn("xResized","lengthOriginal","lengthResized",t)}
          }
        `;case"pytorch_half_pixel":return`if (lengthResized > 1) {
                    return (${t}(xResized) + 0.5) / ${t}(xScale) - 0.5;
                  } else {
                    return 0.0;
                  }`;case"tf_half_pixel_for_nn":return`return (${t}(xResized) + 0.5) / ${t}(xScale);`;case"align_corners":return`if (lengthResized == 1) {
                    return 0.0;
                  } else {
                    ${Nn("xResized","lengthOriginal - 1","lengthResized - 1",t)}
                  }`;case"tf_crop_and_resize":return`if (lengthResized > 1) {
                    return ${t}(roiStart) * ${t}(lengthOriginal - 1) +
                        (${t}(xResized) * ${t}(roiEnd - roiStart) * ${t}(lengthOriginal - 1)) /
                        ${t}(lengthResized - 1);
                  } else {
                    return 0.5 * ${t}(roiStart + roiEnd) * ${t}(lengthOriginal - 1);
                  }`;case"half_pixel_symmetric":return`const outputWidth = ${t}xScale * ${t}(lengthResized);
                  const adjustment = ${t}(lengthResized) / outputWidth;
                  const center = ${t}(lengthOriginal) / 2;
                  const offset = center * (1 - adjustment);
                  return offset + ((${t}(xResized) + 0.5) / ${t}(xScale)) - 0.5;`;case"half_pixel":return`return ((${t}(xResized) + 0.5) / ${t}(xScale)) - 0.5;`;default:throw new Error(`Coordinate transform mode ${e} is not supported`)}})()+"}",Kd=(e,t,r)=>`fn getNearestPixelFromOriginal(xOriginal: ${r}, isDownSample: bool) -> ${r} {`+(()=>{switch(e){case"round_prefer_ceil":return"if (fract(xOriginal) == 0.5) {             return ceil(xOriginal);           } else {             return round(xOriginal);           }";case"floor":return"return floor(xOriginal);";case"ceil":return"return ceil(xOriginal);";case"round_prefer_floor":return"if (fract(xOriginal) == 0.5) {                     return floor(xOriginal);                   } else {                     return round(xOriginal);                   }";default:if(t<11)return"if (isDownSample)                     {                       return ceil(xOriginal);                     } else {                       return xOriginal;                     }";throw new Error(`Nearest mode ${e} is not supported`)}})()+"}",Xd=(e,t,r)=>{let i=new Array(r).fill(0).concat(new Array(r).fill(1)),n=e.length===0?i:e.slice();return t.length>0?(t.forEach((a,s)=>{i[a]=n[s],i[s+r]=n[t.length+s]}),i):n},Zd=(e,t,r,i)=>{let n=[];if(r.length>0)if(i.length>0){if(e.forEach(a=>n.push(a)),Math.max(...i)>e.length)throw new Error("axes is out of bound");i.forEach((a,s)=>n[a]=r[s])}else r.forEach(a=>n.push(a));else{if(t.length===0)throw new Error("Resize requires either scales or sizes.");n=e.map((a,s)=>Math.round(a*t[s]))}return n},Yd=(e,t,r)=>{let i=(()=>{switch(r.keepAspectRatioPolicy){case"not_larger":return r.axes.length>0?Math.min(...r.axes.map(a=>t[a]),Number.MAX_VALUE):Math.min(...t,Number.MAX_VALUE);case"not_smaller":return r.axes.length>0?Math.max(...r.axes.map(a=>t[a]),Number.MIN_VALUE):Math.max(...t,Number.MIN_VALUE);default:throw new Error(`Keep aspect ratio policy ${r.keepAspectRatioPolicy} is not supported`)}})();t.fill(1,0,t.length);let n=e.slice();return r.axes.length>0?(r.axes.forEach(a=>t[a]=i),r.axes.forEach(a=>n[a]=Math.round(e[a]*t[a]))):(t.fill(i,0,t.length),n.forEach((a,s)=>n[s]=Math.round(a*t[s]))),n},Qd=(e,t,r,i,n)=>`
    fn calculateOriginalIndicesFromOutputIndices(output_indices: ${e.type.indices}) -> array<${e.type.value}, ${r.length}> {
      var original_indices: array<${e.type.value}, ${r.length}>;
      for (var i:u32 = 0; i < ${r.length}; i++) {
        var output_index = ${e.indicesGet("output_indices","i")};
        var scale = ${te("uniforms.scales","i",i)};
        var roi_low = ${te("uniforms.roi","i",n)};
        var roi_hi = ${te("uniforms.roi",`i + ${t.length}`,n)};
        if (scale == 1.0) {
          original_indices[i] = ${e.type.value}(output_index);
        } else {
          var input_shape_i = ${te("uniforms.input_shape","i",t.length)};
          var output_shape_i = ${te("uniforms.output_shape","i",r.length)};
          original_indices[i] = getOriginalCoordinateFromResizedCoordinate(output_index, scale, output_shape_i,
                                                                           input_shape_i, roi_low, roi_hi);
        }
      }
      return original_indices;
    }`,Jd=(e,t,r,i,n,a,s)=>`
    fn calculateInputIndicesFromOutputIndices(output_indices: ${t.type.indices}) -> ${e.type.indices} {
      var input_indices: ${e.type.indices};
      for (var i:u32 = 0; i < ${i.length}; i++) {
        var output_index = ${t.indicesGet("output_indices","i")};
        var input_index: u32;
        var scale = ${te("uniforms.scales","i",n)};
        if (scale == 1.0) {
          input_index = output_index;
        } else {
          var roi_low = ${te("uniforms.roi","i",a)};
          var roi_hi = ${te("uniforms.roi",`i + ${r.length}`,a)};
          var input_shape_i = ${te("uniforms.input_shape","i",r.length)};
          var output_shape_i = ${te("uniforms.output_shape","i",i.length)};
          var original_idx = getOriginalCoordinateFromResizedCoordinate(output_index, scale, output_shape_i,
                                                                        input_shape_i, roi_low, roi_hi);
          if (!${s} || (original_idx >= 0 && original_idx < ${t.type.value}(input_shape_i))) {
            if (original_idx < 0) {
              input_index = 0;
            } else if (original_idx > ${t.type.value}(input_shape_i - 1)) {
              input_index = input_shape_i - 1;
            } else {
              input_index = u32(getNearestPixelFromOriginal(original_idx, scale < 1));
            }
          } else {
            input_index = u32(original_idx);
          }
        }
        ${e.indicesSet("input_indices","i","input_index")}
      }
      return input_indices;
    }`,ep=(e,t)=>`
    fn checkInputIndices(input_indices: ${e.type.indices}) -> bool {
      for (var i:u32 = 0; i < ${t.length}; i++) {
        var input_index = ${e.indicesGet("input_indices","i")};
        if (input_index < 0 || input_index >= ${te("uniforms.input_shape","i",t.length)}) {
          return false;
        }
      }
      return true;
    }`,Bn=(e,t,r,i)=>e.rank>i?`
    ${e.indicesSet("input_indices",t,"channel")};
    ${e.indicesSet("input_indices",r,"batch")};
`:"",tp=(e,t,r,i,n)=>{let[a,s,o,l]=r.length===2?[-1,0,1,-1]:[0,2,3,1],d=e.type.value;return`
    fn getInputValue(batch: u32, channel: u32, row: u32, col: u32) -> ${d} {
      var input_indices: ${e.type.indices};
      ${e.indicesSet("input_indices",s,`max(0, min(row, ${r[s]} - 1))`)};
      ${e.indicesSet("input_indices",o,`max(0, min(col, ${r[o]} - 1))`)};
      ${Bn(e,l,a,2)}
      return ${e.getByIndices("input_indices")};
    }

    fn bilinearInterpolation(output_indices: ${t.type.indices}) -> ${d} {
      var originalIndices = calculateOriginalIndicesFromOutputIndices(output_indices);
      var row:${d} = originalIndices[${s}];
      var col:${d} = originalIndices[${o}];
      ${i?`if (row < 0 || row > (${r[s]} - 1) || col < 0 || col > (${r[o]} - 1)) {
        return ${n};
      }`:""};
      row = max(0, min(row, ${r[s]} - 1));
      col = max(0, min(col, ${r[o]} - 1));
      var row1: u32 = u32(row);
      var col1: u32 = u32(col);
      var row2: u32 = u32(row + 1);
      var col2: u32 = u32(col + 1);
      var channel: u32 = ${r.length>2?`u32(originalIndices[${l}])`:"0"};
      var batch: u32 =  ${r.length>2?`u32(originalIndices[${a}])`:"0"};
      var x11: ${d} = getInputValue(batch, channel, row1, col1);
      var x12: ${d} = getInputValue(batch, channel, row1, col2);
      var x21: ${d} = getInputValue(batch, channel, row2, col1);
      var x22: ${d} = getInputValue(batch, channel, row2, col2);
      var dx1: ${d} = abs(row - ${d}(row1));
      var dx2: ${d} = abs(${d}(row2) - row);
      var dy1: ${d} = abs(col - ${d}(col1));
      var dy2: ${d} = abs(${d}(col2) - col);
      if (row1 == row2) {
        dx1 = 0.5;
        dx2 = 0.5;
      }
      if (col1 == col2) {
        dy1 = 0.5;
        dy2 = 0.5;
      }
      return (x11 * dx2 * dy2 + x12 * dx2 * dy1 + x21 * dx1 * dy2 + x22 * dx1 * dy1);
    }`},rp=(e,t,r,i,n,a,s,o,l,d)=>{let p=r.length===2,[h,f]=p?[0,1]:[2,3],g=e.type.value,m=b=>{let v=b===h?"row":"col";return`
      fn ${v}CubicInterpolation(input_indices: ${e.type.indices}, output_indices: ${t.type.indices}) -> ${g} {
        var output_index = ${t.indicesGet("output_indices",b)};
        var originalIdx: ${g} = getOriginalCoordinateFromResizedCoordinate(output_index, ${n[b]},
        ${i[b]}, ${r[b]}, ${a[b]}, ${a[b]} + ${r.length});
        var fractOriginalIdx: ${g} = originalIdx - floor(originalIdx);
        var coefs = getCubicInterpolationCoefs(fractOriginalIdx);

        if (${o} && (originalIdx < 0 || originalIdx > (${r[b]} - 1))) {
          return ${l};
        }
        var data: array<${g}, 4> = array<${g}, 4>(0.0, 0.0, 0.0, 0.0);
        for (var i: i32 = -1; i < 3; i++) {
          var ${v}: ${g} = originalIdx + ${g}(i);
          if (${v} < 0 || ${v} >= ${r[b]}) {
            ${d?`coefs[i + 1] = 0.0;
                        continue;`:o?`return ${l};`:`${v} = max(0, min(${v}, ${r[b]} - 1));`};
          }
        var input_indices_copy: ${e.type.indices} = input_indices;
          ${e.indicesSet("input_indices_copy",b,`u32(${v})`)};
          data[i + 1] = ${b===h?e.getByIndices("input_indices_copy"):"rowCubicInterpolation(input_indices_copy, output_indices)"};
        }
        return cubicInterpolation1D(data, coefs);
      }`};return`
    ${m(h)};
    ${m(f)};
  fn getCubicInterpolationCoefs(s: ${g}) -> array<${g}, 4> {
    var absS = abs(s);
    var coeffs: array<${g}, 4> = array<${g}, 4>(0.0, 0.0, 0.0, 0.0);
    var oneMinusAbsS: ${g} = 1.0 - absS;
    var twoMinusAbsS: ${g} = 2.0 - absS;
    var onePlusAbsS: ${g} = 1.0 + absS;
    coeffs[0] = ((${s} * onePlusAbsS - 5 * ${s}) * onePlusAbsS + 8 * ${s}) * onePlusAbsS - 4 * ${s};
    coeffs[1] = ((${s} + 2) * absS - (${s} + 3)) * absS * absS + 1;
    coeffs[2] = ((${s} + 2) * oneMinusAbsS - (${s} + 3)) * oneMinusAbsS * oneMinusAbsS + 1;
    coeffs[3] = ((${s} * twoMinusAbsS - 5 * ${s}) * twoMinusAbsS + 8 * ${s}) * twoMinusAbsS - 4 * ${s};
    return coeffs;
  }

  fn cubicInterpolation1D(x: array<${g}, 4>, coefs: array<${g}, 4>) -> ${g} {
    var coefsSum: ${g} = coefs[0] + coefs[1] + coefs[2] + coefs[3];
    return (x[0] * coefs[0] + x[1] * coefs[1]+ x[2] * coefs[2]+ x[3] * coefs[3]) / coefsSum;
  }

  fn bicubicInterpolation(output_indices: ${t.type.indices}) -> ${g} {
    var input_indices: ${e.type.indices} = output_indices;
    return colCubicInterpolation(input_indices, output_indices);
  }
    `},ip=(e,t,r,i,n)=>{let[a,s,o,l,d]=r.length===3?[-1,0,1,2,-1]:[0,2,3,4,1],p=e.type.value;return`
    fn getInputValue(batch: u32, channel: u32, depth:u32, height: u32, width: u32) -> ${p} {
      var input_indices: ${e.type.indices};
      ${e.indicesSet("input_indices",s,`max(0, min(depth, ${r[s]} - 1))`)};
      ${e.indicesSet("input_indices",o,`max(0, min(height, ${r[o]} - 1))`)};
      ${e.indicesSet("input_indices",l,`max(0, min(width, ${r[l]} - 1))`)};
      ${Bn(e,d,a,3)}
      return ${e.getByIndices("input_indices")};
    }

    fn trilinearInterpolation(output_indices: ${t.type.indices}) -> ${p} {
      var originalIndices = calculateOriginalIndicesFromOutputIndices(output_indices);
      var depth:${p} = originalIndices[${s}];
      var height:${p} = originalIndices[${o}];
      var width:${p} = originalIndices[${l}];
      ${i?`if (depth < 0 || depth > (${r[s]} - 1) || height < 0 || height > (${r[o]} - 1) || width < 0 || (width > ${r[l]} - 1)) {
      return ${n};
        }`:""};

    depth = max(0, min(depth, ${r[s]} - 1));
      height = max(0, min(height, ${r[o]} - 1));
      width = max(0, min(width, ${r[l]} - 1));
      var depth1: u32 = u32(depth);
      var height1: u32 = u32(height);
      var width1: u32 = u32(width);
      var depth2: u32 = u32(depth + 1);
      var height2: u32 = u32(height + 1);
      var width2: u32 = u32(width + 1);
      var channel: u32 = ${r.length>3?`u32(originalIndices[${d}])`:"0"};
      var batch: u32 =  ${r.length>3?`u32(originalIndices[${a}])`:"0"};

      var x111: ${p} = getInputValue(batch, channel, depth1, height1, width1);
      var x112: ${p} = getInputValue(batch, channel, depth1, height1, width2);
      var x121: ${p} = getInputValue(batch, channel, depth1, height2, width1);
      var x122: ${p} = getInputValue(batch, channel, depth1, height2, width2);
      var x211: ${p} = getInputValue(batch, channel, depth2, height1, width1);
      var x212: ${p} = getInputValue(batch, channel, depth2, height1, width2);
      var x221: ${p} = getInputValue(batch, channel, depth2, height2, width1);
      var x222: ${p} = getInputValue(batch, channel, depth2, height2, width2);
      var dx1: ${p} = abs(depth - ${p}(depth1));
      var dx2: ${p} = abs(${p}(depth2) - depth);
      var dy1: ${p} = abs(height - ${p}(height1));
      var dy2: ${p} = abs(${p}(height2) - height);
      var dz1: ${p} = abs(width - ${p}(width1));
      var dz2: ${p} = abs(${p}(width2) - width);
      if (depth1 == depth2) {
        dx1 = 0.5;
        dx2 = 0.5;
      }
      if (height1 == height2) {
        dy1 = 0.5;
        dy2 = 0.5;
      }
      if (width1 == width2) {
        dz1 = 0.5;
        dz2 = 0.5;
      }
      return (x111 * dx2 * dy2 * dz2 + x112 * dx2 * dy2 * dz1 + x121 * dx2 * dy1 *dz2 + x122 * dx2 * dy1 * dz1 +
              x211 * dx1 * dy2 * dz2 + x212 * dx1 * dy2 * dz1 + x221 * dx1 * dy1 *dz2 + x222 * dx1 * dy1 * dz1);
    }`},np=(e,t,r,i,n,a)=>{let s=e.dims,o=Xd(a,t.axes,s.length),l=Zd(s,i,n,t.axes),d=i.slice();i.length===0&&(d=s.map((w,S)=>w===0?1:l[S]/w),t.keepAspectRatioPolicy!=="stretch"&&(l=Yd(s,d,t)));let p=ee("output",e.dataType,l.length),h=U("input",e.dataType,s.length),f=N.size(l),g=s.length===l.length&&s.every((w,S)=>w===l[S]),m=t.coordinateTransformMode==="tf_crop_and_resize",b=t.extrapolationValue,v=h.type.value,$=w=>`
      ${g?"":`
      ${jd(t.coordinateTransformMode,v)};
      ${(()=>{switch(t.mode){case"nearest":return`
              ${ep(h,s)};
              ${Kd(t.nearestMode,r,v)};
              ${Jd(h,p,s,l,d.length,o.length,m)};
              `;case"linear":return`
              ${Qd(p,s,l,d.length,o.length)};
              ${(()=>{if(s.length===2||s.length===4)return`${tp(h,p,s,m,b)}`;if(s.length===3||s.length===5)return`${ip(h,p,s,m,b)}`;throw Error("Linear mode only supports input dims 2, 3, 4 and 5 are supported in linear mode.")})()};
            `;case"cubic":return`
            ${(()=>{if(s.length===2||s.length===4)return`${rp(h,p,s,l,d,o,t.cubicCoeffA,m,t.extrapolationValue,t.excludeOutside)}`;throw Error("Cubic mode only supports input dims 2 and 4 are supported in linear mode.")})()};
            `;default:throw Error("Invalid resize mode")}})()};
      `}
      ${w.registerUniform("output_size","u32").registerUniform("scales","f32",d.length).registerUniform("roi","f32",o.length).declareVariables(h,p)}
      ${w.mainStart()}
        ${w.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
        ${g?"output[global_idx] = input[global_idx];":`
        let output_indices = ${p.offsetToIndices("global_idx")};
        var input_indices: ${h.type.indices};
        ${(()=>{switch(t.mode){case"nearest":return`input_indices = calculateInputIndicesFromOutputIndices(output_indices);
                if (checkInputIndices(input_indices)) {
                  output[global_idx] = ${h.getByIndices("input_indices")};
                } else {
                  output[global_idx] = ${t.extrapolationValue};
                }`;case"linear":return`output[global_idx] = ${s.length===2||s.length===4?"bilinearInterpolation":"trilinearInterpolation"}(output_indices);`;case"cubic":return"output[global_idx] = bicubicInterpolation(output_indices);";default:throw Error(`Unsupported resize mode: ${t.mode}`)}})()};
`}
      }`;return{name:"Resize",shaderCache:{hint:`${t.cacheKey}|${r}|${d.length>0?t.mode==="cubic"?d:d.length:""}|${n.length>0?n:""}|${o.length>0?o:""}|${g}|${t.mode==="nearest"?s.length:s}`,inputDependencies:["rank"]},getShaderSource:$,getRunData:()=>({outputs:[{dims:l,dataType:e.dataType}],dispatchGroup:{x:Math.ceil(f/64)},programUniforms:[{type:12,data:f},{type:1,data:d},{type:1,data:o},...re(s,l)]})}},ap=e=>{let t=e.customDataBuffer;return new Uint32Array(t.buffer,t.byteOffset,1)[0]},cm=(e,t)=>{let r=[],i=[],n=[],a=ap(e);if(t.antialias!==0)throw Error("Only default value (0) for Antialias attribute is supported");Hd(e.inputs,t,a,r,i,n),e.compute(np(e.inputs[0],t,a,r,i,n),{inputs:[0]})},hm=e=>{let t=e.antialias,r=e.axes,i=e.coordinateTransformMode,n=e.cubicCoeffA,a=e.excludeOutside!==0,s=e.extrapolationValue,o=e.keepAspectRatioPolicy,l=e.mode,d=e.nearestMode===""?"simple":e.nearestMode;return me({antialias:t,axes:r,coordinateTransformMode:i,cubicCoeffA:n,excludeOutside:a,extrapolationValue:s,keepAspectRatioPolicy:o,mode:l,nearestMode:d})}}),sp,op,fm,M_=F(()=>{ie(),ne(),ae(),sp=e=>{if(!e||e.length<3)throw new Error("layerNorm requires at least 3 inputs.");let t=e[0],r=e[1],i=e[2];if(t.dataType!==r.dataType||t.dataType!==i.dataType)throw new Error("All inputs must have the same data type");if(t.dims.length!==3&&t.dims.length!==2)throw new Error("Input must be 2D or 3D");if(r.dims.length!==3&&r.dims.length!==2)throw new Error("Skip must be 2D or 3D");let n=t.dims[t.dims.length-1],a=t.dims[t.dims.length-2];if(r.dims[r.dims.length-1]!==n)throw new Error("Skip must have the same hidden size as input");if(r.dims[r.dims.length-2]!==a)throw new Error("Skip must have the same sequence length as input");if(i.dims.length!==1)throw new Error("Gamma must be 1D");if(i.dims[i.dims.length-1]!==n)throw new Error("Gamma must have the same hidden size as input");if(e.length>3){let s=e[3];if(s.dims.length!==1)throw new Error("Beta must be 1D");if(s.dims[s.dims.length-1]!==n)throw new Error("Beta must have the same hidden size as input")}if(e.length>4){let s=e[4];if(s.dims.length!==1)throw new Error("Bias must be 1D");if(s.dims[s.dims.length-1]!==n)throw new Error("Bias must have the same hidden size as input")}},op=(e,t,r,i)=>{let n=t.simplified,a=e[0].dims,s=N.size(a),o=a,l=s,d=a.slice(-1)[0],p=i?a.slice(0,-1).concat(1):[],h=!n&&e.length>3,f=e.length>4,g=i&&r>1,m=i&&r>2,b=r>3,v=64,$=Te(d),w=[{type:12,data:l},{type:12,data:$},{type:12,data:d},{type:1,data:t.epsilon}],S=I=>{let C=[{name:"output_size",type:"u32"},{name:"components",type:"u32"},{name:"hidden_size",type:"u32"},{name:"epsilon",type:"f32"}],z=[U("x",e[0].dataType,e[0].dims,$),U("skip",e[1].dataType,e[1].dims,$),U("gamma",e[2].dataType,e[2].dims,$)];h&&z.push(U("beta",e[3].dataType,e[3].dims,$)),f&&z.push(U("bias",e[4].dataType,e[4].dims,$)),z.push(ee("output",e[0].dataType,o,$)),g&&z.push(ee("mean_output",1,p)),m&&z.push(ee("inv_std_output",1,p)),b&&z.push(ee("input_skip_bias_sum",e[0].dataType,o,$));let k=Me(e[0].dataType),D=Me(1,$);return`

      ${I.registerUniforms(C).declareVariables(...z)}
      var<workgroup> sum_shared : array<${D}, ${v}>;
      var<workgroup> sum_squared_shared : array<${D}, ${v}>;

      ${I.mainStart([v,1,1])}
        let ix = local_id.x;
        let iy = global_id.x / ${v};

        let hidden_size_vectorized: u32 = uniforms.hidden_size / uniforms.components;
        var stride = hidden_size_vectorized / ${v};
        let offset = ix * stride + iy * hidden_size_vectorized;
        let offset1d = stride * ix;
        if (ix == ${v-1}) {
          stride = hidden_size_vectorized - stride * ix;
        }
        for (var i: u32 = 0; i < stride; i++) {
          let skip_value = skip[offset + i];
          let bias_value = ${f?"bias[offset1d + i]":k+"(0.0)"};
          let input_value = x[offset + i];
          let value = input_value + skip_value + bias_value;
          ${b?"input_skip_bias_sum[offset + i] = value;":""}
          output[offset + i] = value;
          let f32_value = ${Qt(k,$,"value")};
          sum_shared[ix] += f32_value;
          sum_squared_shared[ix] += f32_value * f32_value;
        }
        workgroupBarrier();

        var reduce_size : u32 = ${v};
        for (var curr_size = reduce_size >> 1;  curr_size > 0; curr_size = reduce_size >> 1) {
          reduce_size = curr_size + (reduce_size & 1);
          if (ix < curr_size) {
            sum_shared[ix] += sum_shared[ix + reduce_size];
            sum_squared_shared[ix] += sum_squared_shared[ix + reduce_size];
          }
          workgroupBarrier();
        }

        let sum = sum_shared[0];
        let square_sum = sum_squared_shared[0];
        let mean = ${kt("sum",$)} / f32(uniforms.hidden_size);
        let inv_std_dev = inverseSqrt(${kt("square_sum",$)} / f32(uniforms.hidden_size) ${n?"":"- mean * mean"} + uniforms.epsilon);
        ${g?"mean_output[global_idx] = mean;":""}
        ${m?"inv_std_output[global_idx] = inv_std_dev;":""}

        for (var i: u32 = 0; i < stride; i++) {
          output[offset + i] = (output[offset + i] ${n?"":`- ${k}(mean)`}) *
            ${k}(inv_std_dev) * gamma[offset1d + i]
            ${h?"+ beta[offset1d + i]":""};
        }
      }`},x=[{dims:o,dataType:e[0].dataType}];return r>1&&x.push({dims:p,dataType:1}),r>2&&x.push({dims:p,dataType:1}),r>3&&x.push({dims:a,dataType:e[0].dataType}),{name:"SkipLayerNormalization",shaderCache:{hint:`${$};${g};${m};${b}`,inputDependencies:e.map((I,C)=>"type")},getShaderSource:S,getRunData:()=>({outputs:x,dispatchGroup:{x:Math.ceil(l/d)},programUniforms:w})}},fm=(e,t)=>{sp(e.inputs);let r=[0];e.outputCount>1&&r.push(-3),e.outputCount>2&&r.push(-3),e.outputCount>3&&r.push(3),e.compute(op(e.inputs,t,e.outputCount,!1),{outputs:r})}}),up,mr,lp,Dn,dp,pp,mm,gm,O_=F(()=>{ie(),ne(),Ce(),ae(),up=(e,t)=>{if(!e||e.length<1)throw new Error("too few inputs");if(t.axes.length!==0){if(t.axes.length!==t.starts.length||t.axes.length!==t.ends.length)throw new Error("axes, starts and ends must have the same length")}else if(t.starts.length!==t.ends.length)throw new Error("starts and ends must have the same length");e.slice(1).forEach((r,i)=>{if(e[i+1].dataType!==6&&e[i+1].dataType!==7)throw new Error(`Input ${i} must be an array of int32 or int64`)})},mr=(e,t)=>{let r=[];if(e.length>t)if(e[t].dataType===7)e[t].getBigInt64Array().forEach(i=>r.push(Number(i)));else if(e[t].dataType===6)e[t].getInt32Array().forEach(i=>r.push(Number(i)));else throw new Error(`Input ${t} must be an array of int32 or int64`);return r},lp=(e,t)=>{if(e.length>1){let r=mr(e,1),i=mr(e,2),n=mr(e,3);return n.length===0&&(n=[...Array(e[0].dims.length).keys()]),me({starts:r,ends:i,axes:n})}else return t},Dn=(e,t,r,i,n)=>{let a=e;return e<0&&(a+=r[i[t]]),n[t]<0?Math.max(0,Math.min(a,r[i[t]]-1)):Math.max(0,Math.min(a,r[i[t]]))},dp=(e,t,r)=>`fn calculateInputIndices(output_indices: ${t.type.indices}) -> ${e.type.indices} {
          var input_indices: ${e.type.indices};
          var carry = 0u;
          for (var i = ${r.length-1}; i >= 0; i--) {
            let input_shape_i = ${te("uniforms.input_shape","i",r.length)};
            let steps_i = ${te("uniforms.steps","i",r.length)};
            let signs_i = ${te("uniforms.signs","i",r.length)};
            let starts_i = ${te("uniforms.starts","i",r.length)};
            var output_index = ${t.indicesGet("output_indices","i")};
            var input_index = output_index * steps_i + starts_i + carry;
            carry = input_index / input_shape_i;
            input_index = input_index % input_shape_i;
            if (signs_i < 0) {
              input_index = input_shape_i - input_index - 1u + starts_i;
            }
            ${e.indicesSet("input_indices","i","input_index")};
          }
          return input_indices;
      }`,pp=(e,t)=>{let r=e[0].dims,i=N.size(r),n=t.axes.length>0?N.normalizeAxes(t.axes,r.length):[...Array(r.length).keys()],a=mr(e,4);a.forEach($=>$!==0||(()=>{throw new Error("step cannot be 0")})),a.length===0&&(a=Array(n.length).fill(1));let s=t.starts.map(($,w)=>Dn($,w,r,n,a)),o=t.ends.map(($,w)=>Dn($,w,r,n,a));if(n.length!==s.length||n.length!==o.length)throw new Error("start, ends and axes should have the same number of elements");if(n.length!==r.length)for(let $=0;$<r.length;++$)n.includes($)||(s.splice($,0,0),o.splice($,0,r[$]),a.splice($,0,1));let l=a.map($=>Math.sign($));a.forEach(($,w,S)=>{if($<0){let x=(o[w]-s[w])/$,I=s[w],C=I+x*a[w];s[w]=C,o[w]=I,S[w]=-$}});let d=r.slice(0);n.forEach(($,w)=>{d[$]=Math.ceil((o[$]-s[$])/a[$])});let p={dims:d,dataType:e[0].dataType},h=ee("output",e[0].dataType,d.length),f=U("input",e[0].dataType,e[0].dims.length),g=N.size(d),m=[{name:"outputSize",type:"u32"},{name:"starts",type:"u32",length:s.length},{name:"signs",type:"i32",length:l.length},{name:"steps",type:"u32",length:a.length}],b=[{type:12,data:g},{type:12,data:s},{type:6,data:l},{type:12,data:a},...re(e[0].dims,d)],v=$=>`
      ${$.registerUniforms(m).declareVariables(f,h)}
        ${dp(f,h,r)}
        ${$.mainStart()}
          ${$.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}
          let output_indices = ${h.offsetToIndices("global_idx")};
          let input_indices = calculateInputIndices(output_indices);
          ${h.setByOffset("global_idx",f.getByIndices("input_indices"))}
      }`;return{name:"Slice",shaderCache:{hint:`${l.length}_${s.length}_${a.length}`,inputDependencies:["rank"]},getShaderSource:v,getRunData:()=>({outputs:[p],dispatchGroup:{x:Math.ceil(i/64)},programUniforms:b})}},mm=(e,t)=>{up(e.inputs,t);let r=lp(e.inputs,t);e.compute(pp(e.inputs,r),{inputs:[0]})},gm=e=>{let t=e.starts,r=e.ends,i=e.axes;return me({starts:t,ends:r,axes:i})}}),cp,hp,ym,_m,R_=F(()=>{ie(),ne(),Ce(),Tt(),ae(),cp=e=>{if(!e||e.length!==1)throw new Error("Softmax op requires 1 input.")},hp=(e,t)=>{let r=e.inputs[0],i=r.dims,n=N.size(i),a=i.length,s=N.normalizeAxis(t.axis,a),o=s<i.length-1,l,d=[];o?(d=Array.from({length:a},(z,k)=>k),d[s]=a-1,d[a-1]=s,l=e.compute(Ge(r,d),{inputs:[r],outputs:[-1]})[0]):l=r;let p=l.dims,h=p[a-1],f=n/h,g=Te(h),m=h/g,b=64;f===1&&(b=256);let v=(z,k)=>k===4?`max(max(${z}.x, ${z}.y), max(${z}.z, ${z}.w))`:k===2?`max(${z}.x, ${z}.y)`:k===3?`max(max(${z}.x, ${z}.y), ${z}.z)`:z,$=U("x",l.dataType,l.dims,g),w=ee("result",l.dataType,l.dims,g),S=$.type.value,x=Me(l.dataType)==="f32"?`var threadMax = ${S}(-3.4028234663852886e+38f);`:`var threadMax = ${S}(-65504.0h);`,I=z=>`
      var<workgroup> rowMaxShared : ${S};
      var<workgroup> rowSumShared : ${S};
      var<workgroup> threadShared : array<${S}, ${b}>;

      fn getValue(row: i32, col: i32, row_stride: i32) -> ${S} {
        let index = row * row_stride + col;
        return x[index];
      }

      fn setValue(row: i32, col: i32, row_stride: i32, value: ${S}) {
        let index = row * row_stride + col;
        result[index] = value;
      }
      ${z.registerUniform("packedCols","i32").declareVariables($,w)}
      ${z.mainStart(b)}
        let gindex = i32(global_idx);
        let lindex = i32(local_idx);
        const wg = ${b};
        let row = gindex / wg;
        let cols = uniforms.packedCols;
        let row_stride : i32 = uniforms.packedCols;

        // find the rows max
        ${x}
        for (var col = lindex; col < cols; col += wg) {
          let value = getValue(row, col, row_stride);
          threadMax = max(threadMax, value);
        }
        if (lindex < cols) {
          threadShared[lindex] = threadMax;
        }
        workgroupBarrier();

        var reduceSize = min(cols, wg);
        for (var currSize = reduceSize >> 1;  currSize > 0; currSize = reduceSize >> 1) {
          reduceSize = currSize + (reduceSize & 1);
          if (lindex < currSize) {
            threadShared[lindex] = max(threadShared[lindex], threadShared[lindex + reduceSize]);
          }
          workgroupBarrier();
        }
        if (lindex == 0) {
          rowMaxShared = ${S}(${v("threadShared[0]",g)});
        }
        workgroupBarrier();

        // find the rows sum
        var threadSum = ${S}(0.0);
        for (var col = lindex; col < cols; col += wg) {
          let subExp = exp(getValue(row, col, row_stride) - rowMaxShared);
          threadSum += subExp;
        }
        threadShared[lindex] = threadSum;
        workgroupBarrier();

        for (var currSize = wg >> 1;  currSize > 0; currSize = currSize >> 1) {
          if (lindex < currSize) {
            threadShared[lindex] = threadShared[lindex] + threadShared[lindex + currSize];
          }
          workgroupBarrier();
        }
        if (lindex == 0) {
          rowSumShared = ${S}(${kt("threadShared[0]",g)});
        }
        workgroupBarrier();

        // calculate final value for each element in the row
        for (var col = lindex; col < cols; col += wg) {
          var value = exp(getValue(row, col, row_stride) - rowMaxShared) / rowSumShared;
          // max operation protects against NaN since all values should be >=0
          value = max(value, ${S}(0.0));
          setValue(row, col, row_stride, value);
        }
      }`,C=e.compute({name:"Softmax",shaderCache:{hint:`${g};${b}`,inputDependencies:["type"]},getRunData:()=>({outputs:[{dims:p,dataType:l.dataType}],dispatchGroup:{x:f},programUniforms:[{type:6,data:m}]}),getShaderSource:I},{inputs:[l],outputs:[o?-1:0]})[0];o&&e.compute(Ge(C,d),{inputs:[C]})},ym=(e,t)=>{cp(e.inputs),hp(e,t)},_m=e=>me({axis:e.axis})}),Pn,fp,mp,gp,bm,N_=F(()=>{ie(),ne(),ae(),Pn=e=>Array.from(e.getBigInt64Array(),Number),fp=e=>{if(!e||e.length!==2)throw new Error("Tile requires 2 inputs.");if(e[0].dataType!==1&&e[0].dataType!==10&&e[0].dataType!==6&&e[0].dataType!==12)throw new Error("Tile only support float, float16, int32, and uint32 data types");if(e[1].dataType!==7)throw new Error("Tile `repeats` input should be of int64 data type");if(e[1].dims.length!==1)throw new Error("Tile `repeats` input should be 1-D");if(Pn(e[1]).length!==e[0].dims.length)throw new Error("Tile `repeats` input should have same number of elements as rank of input data tensor")},mp=(e,t)=>{let r=[];for(let i=0;i<e.length;++i)r.push(e[i]*t[i]);return r},gp=(e,t)=>{let r=e[0].dims,i=t??Pn(e[1]),n=mp(r,i),a=N.size(n),s=e[0].dataType,o=U("input",s,r.length),l=ee("output",s,n.length),d=p=>`
      const inputShape = ${o.indices(...r)};
      ${p.registerUniform("output_size","u32").declareVariables(o,l)}
      ${p.mainStart()}
      ${p.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
      let output_indices = ${l.offsetToIndices("global_idx")};
      var input_indices: ${o.type.indices};
      for (var i = 0; i < ${r.length}; i++) {
        let input_dim_i = ${o.indicesGet("uniforms.input_shape","i")};
        let input_dim_value = ${l.indicesGet("output_indices","i")}  % input_dim_i;

        ${o.indicesSet("input_indices","i","input_dim_value")}
      }
      ${l.setByOffset("global_idx",o.getByIndices("input_indices"))}
    }`;return{name:"Tile",shaderCache:{hint:`${i}`,inputDependencies:["rank"]},getRunData:()=>({outputs:[{dims:n,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(a/64)},programUniforms:[{type:12,data:a},...re(e[0].dims,n)]}),getShaderSource:d}},bm=e=>{fp(e.inputs),e.compute(gp(e.inputs),{inputs:[0]})}}),yp,_p,wm,B_=F(()=>{ie(),ne(),ae(),yp=(e,t,r,i,n)=>{let a=ee("output_data",n,r.length,4),s=U("a_data",t[1].dataType,t[1].dims.length,4),o=U("b_data",t[2].dataType,t[2].dims.length,4),l=U("c_data",t[0].dataType,t[0].dims.length,4),d,p=(h,f,g)=>`select(${f}, ${h}, ${g})`;if(!i)d=a.setByOffset("global_idx",p(s.getByOffset("global_idx"),o.getByOffset("global_idx"),l.getByOffset("global_idx")));else{let h=(f,g,m="")=>{let b=`a_data[index_a${g}][component_a${g}]`,v=`b_data[index_b${g}][component_b${g}]`,$=`bool(c_data[index_c${g}] & (0xffu << (component_c${g} * 8)))`;return`
            let output_indices${g} = ${a.offsetToIndices(`global_idx * 4u + ${g}u`)};
            let offset_a${g} = ${s.broadcastedIndicesToOffset(`output_indices${g}`,a)};
            let offset_b${g} = ${o.broadcastedIndicesToOffset(`output_indices${g}`,a)};
            let offset_c${g} = ${l.broadcastedIndicesToOffset(`output_indices${g}`,a)};
            let index_a${g} = offset_a${g} / 4u;
            let index_b${g} = offset_b${g} / 4u;
            let index_c${g} = offset_c${g} / 4u;
            let component_a${g} = offset_a${g} % 4u;
            let component_b${g} = offset_b${g} % 4u;
            let component_c${g} = offset_c${g} % 4u;
            ${f}[${g}] = ${m}(${p(b,v,$)});
          `};n===9?d=`
            var data = vec4<u32>(0);
            ${h("data",0,"u32")}
            ${h("data",1,"u32")}
            ${h("data",2,"u32")}
            ${h("data",3,"u32")}
            output_data[global_idx] = dot(vec4<u32>(0x1, 0x100, 0x10000, 0x1000000), vec4<u32>(data));`:d=`
            ${h("output_data[global_idx]",0)}
            ${h("output_data[global_idx]",1)}
            ${h("output_data[global_idx]",2)}
            ${h("output_data[global_idx]",3)}
          `}return`
        ${e.registerUniform("vec_size","u32").declareVariables(l,s,o,a)}
        ${e.mainStart()}
        ${e.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.vec_size")}
        ${d}
      }`},_p=e=>{let t=e[1].dims,r=e[2].dims,i=e[0].dims,n=e[1].dataType,a=!(N.areEqual(t,r)&&N.areEqual(r,i)),s=t,o=N.size(t);if(a){let d=tr.calcShape(tr.calcShape(t,r,!1),i,!1);if(!d)throw new Error("Can't perform where op on the given tensors");s=d,o=N.size(s)}let l=Math.ceil(o/4);return{name:"Where",shaderCache:{inputDependencies:["rank","rank","rank"]},getShaderSource:d=>yp(d,e,s,a,n),getRunData:()=>({outputs:[{dims:s,dataType:n}],dispatchGroup:{x:Math.ceil(o/64/4)},programUniforms:[{type:12,data:l},...re(i,t,r,s)]})}},wm=e=>{e.compute(_p(e.inputs))}}),$m,D_=F(()=>{Yy(),Ba(),Qy(),Jy(),e_(),t_(),r_(),o_(),l_(),d_(),p_(),c_(),h_(),f_(),m_(),g_(),y_(),__(),b_(),w_(),$_(),v_(),x_(),S_(),k_(),Lf(),T_(),I_(),E_(),C_(),z_(),Na(),A_(),Ff(),M_(),O_(),R_(),Gf(),N_(),Tt(),Da(),B_(),$m=new Map([["Abs",[hh]],["Acos",[fh]],["Acosh",[mh]],["Add",[Xh]],["ArgMax",[lh,aa]],["ArgMin",[uh,aa]],["Asin",[gh]],["Asinh",[yh]],["Atan",[_h]],["Atanh",[bh]],["Attention",[dh]],["AveragePool",[em,Jf]],["BatchNormalization",[ph]],["BiasAdd",[ch]],["BiasSplitGelu",[Kh]],["Cast",[$h,wh]],["Ceil",[xh]],["Clip",[vh]],["Concat",[sf,of]],["Conv",[pa,da]],["ConvTranspose",[yf,gf]],["Cos",[Sh]],["Cosh",[kh]],["CumSum",[_f,bf]],["DepthToSpace",[wf,$f]],["DequantizeLinear",[om,um]],["Div",[Zh]],["Einsum",[vf,xf]],["Elu",[Th,$r]],["Equal",[Yh]],["Erf",[Ih]],["Exp",[Eh]],["Expand",[Sf]],["FastGelu",[kf]],["Floor",[Ch]],["FusedConv",[pa,da]],["Gather",[If,Tf]],["GatherElements",[Of,Mf]],["GatherBlockQuantized",[zf,Af]],["GatherND",[Ef,Cf]],["Gelu",[zh]],["Gemm",[Nf,Rf]],["GlobalAveragePool",[rm,tm]],["GlobalMaxPool",[sm,am]],["Greater",[tf]],["GreaterOrEqual",[nf]],["GridSample",[Bf,Df]],["GroupQueryAttention",[Hf]],["HardSigmoid",[Ph,Dh]],["InstanceNormalization",[jf]],["LayerNormalization",[Kf]],["LeakyRelu",[Ah,$r]],["Less",[rf]],["LessOrEqual",[af]],["Log",[Hh]],["MatMul",[Xf]],["MatMulNBits",[Zf,Yf]],["MaxPool",[im,nm]],["Mul",[Qh]],["MultiHeadAttention",[Uf,Pf]],["Neg",[Oh]],["Not",[Mh]],["Pad",[Qf]],["Pow",[Jh]],["QuickGelu",[jh,$r]],["Range",[lm]],["Reciprocal",[Rh]],["ReduceMin",[ih]],["ReduceMean",[Qc]],["ReduceMax",[rh]],["ReduceSum",[ah]],["ReduceProd",[nh]],["ReduceL1",[Jc]],["ReduceL2",[eh]],["ReduceLogSum",[oh]],["ReduceLogSumExp",[th]],["ReduceSumSquare",[sh]],["Relu",[Nh]],["Resize",[cm,hm]],["RotaryEmbedding",[Vf]],["ScatterND",[pm,dm]],["Sigmoid",[Bh]],["Sin",[Uh]],["Sinh",[Lh]],["Slice",[mm,gm]],["SkipLayerNormalization",[fm]],["Split",[qf,Wf]],["Sqrt",[qh]],["Softmax",[ym,_m]],["Sub",[ef]],["Tan",[Wh]],["Tanh",[Gh]],["ThresholdedRelu",[Fh,$r]],["Tile",[bm]],["Transpose",[Lc,qc]],["Where",[wm]]])}),vm,P_=F(()=>{Ke(),gt(),ae(),vm=class{constructor(e){this.backend=e,this.repo=new Map,this.attributesBound=!1}getArtifact(e){return this.repo.get(e)}setArtifact(e,t){this.repo.set(e,t)}run(e,t,r,i,n){pt(e.programInfo.name);let a=this.backend.device,s=this.backend.getComputePassEncoder();this.backend.writeTimestamp(this.backend.pendingDispatchNumber*2);let o=[];for(let d of t)o.push({binding:o.length,resource:{buffer:d.buffer}});for(let d of r)o.push({binding:o.length,resource:{buffer:d.buffer}});n&&o.push({binding:o.length,resource:n});let l=a.createBindGroup({layout:e.computePipeline.getBindGroupLayout(0),entries:o,label:e.programInfo.name});if(this.backend.sessionStatus==="capturing"){let d={kernelId:this.backend.currentKernelId,computePipeline:e.computePipeline,bindGroup:l,dispatchGroup:i};this.backend.capturedCommandList.get(this.backend.currentSessionId).push(d)}s.setPipeline(e.computePipeline),s.setBindGroup(0,l),s.dispatchWorkgroups(...i),this.backend.writeTimestamp(this.backend.pendingDispatchNumber*2+1),this.backend.pendingDispatchNumber++,(this.backend.pendingDispatchNumber>=this.backend.maxDispatchNumber||this.backend.queryType==="at-passes")&&this.backend.endComputePass(),this.backend.pendingDispatchNumber>=this.backend.maxDispatchNumber&&this.backend.flush(),it(e.programInfo.name)}dispose(){}build(e,t){pt(e.name);let r=this.backend.device,i=[];[{feature:"shader-f16",extension:"f16"},{feature:"subgroups",extension:"subgroups"}].forEach(d=>{r.features.has(d.feature)&&i.push(`enable ${d.extension};`)});let n=Uc(t,this.backend.device.limits),a=e.getShaderSource(n),s=`${i.join(`
`)}
${n.additionalImplementations}
${a}`,o=r.createShaderModule({code:s,label:e.name});ce("verbose",()=>`[WebGPU] ${e.name} shader code: ${s}`);let l=r.createComputePipeline({compute:{module:o,entryPoint:"main"},layout:"auto",label:e.name});return it(e.name),{programInfo:e,computePipeline:l,uniformVariablesInfo:n.variablesInfo}}normalizeDispatchGroupSize(e){let t=typeof e=="number"?e:e.x,r=typeof e=="number"?1:e.y||1,i=typeof e=="number"?1:e.z||1,n=this.backend.device.limits.maxComputeWorkgroupsPerDimension;if(t<=n&&r<=n&&i<=n)return[t,r,i];let a=t*r*i,s=Math.ceil(Math.sqrt(a));if(s>n){if(s=Math.ceil(Math.cbrt(a)),s>n)throw new Error("Total dispatch size exceeds WebGPU maximum.");return[s,s,s]}else return[s,s,1]}}}),xm={};ir(xm,{WebGpuBackend:()=>Sm});var bp,wp,$p,Sm,U_=F(()=>{Ke(),ie(),gt(),Rc(),Xy(),D_(),P_(),bp=(e,t)=>{if(t.length!==e.length)throw new Error(`inputDependencies length ${t.length} is not equal to inputTensors length ${e.length}.`);let r=[];for(let i=0;i<e.length;++i){let n=e[i].dataType;switch(t[i]){case"none":{r.push("");break}case"type":{r.push(`${n}`);break}case"rank":{let a=e[i].dims.length;r.push(`${n};${a}`);break}case"dims":{let a=e[i].dims.join(",");r.push(`${n};${a}`);break}default:throw new Error(`unsupported input dependency: ${t[i]}`)}}return r.join("|")},wp=(e,t,r)=>{let i=e.name;return e.shaderCache?.hint&&(i+="["+e.shaderCache.hint+"]"),i+=":"+r+`:${bp(t,e.shaderCache?.inputDependencies??new Array(t.length).fill("dims"))}`,i},$p=class{constructor(e){e&&(this.architecture=e.architecture,this.vendor=e.vendor)}isArchitecture(e){return this.architecture===e}isVendor(e){return this.vendor===e}},Sm=class{constructor(){this.currentSessionId=null,this.currentKernelId=null,this.commandEncoder=null,this.computePassEncoder=null,this.maxDispatchNumber=16,this.pendingDispatchNumber=0,this.pendingKernels=[],this.pendingQueries=new Map,this.sessionStatus="default",this.capturedCommandList=new Map,this.capturedPendingKernels=new Map,this.sessionExternalDataMapping=new Map}get currentKernelCustomData(){if(this.currentKernelId===null)throw new Error("currentKernelCustomData(): currentKernelId is null. (should not happen)");let e=this.kernelCustomData.get(this.currentKernelId);return e||(e={},this.kernelCustomData.set(this.currentKernelId,e)),e}async initialize(e,t){this.env=e;let r=[],i={requiredLimits:{maxComputeWorkgroupStorageSize:t.limits.maxComputeWorkgroupStorageSize,maxComputeWorkgroupsPerDimension:t.limits.maxComputeWorkgroupsPerDimension,maxStorageBufferBindingSize:t.limits.maxStorageBufferBindingSize,maxBufferSize:t.limits.maxBufferSize,maxComputeInvocationsPerWorkgroup:t.limits.maxComputeInvocationsPerWorkgroup,maxComputeWorkgroupSizeX:t.limits.maxComputeWorkgroupSizeX,maxComputeWorkgroupSizeY:t.limits.maxComputeWorkgroupSizeY,maxComputeWorkgroupSizeZ:t.limits.maxComputeWorkgroupSizeZ},requiredFeatures:r},n=o=>t.features.has(o)&&r.push(o)&&!0;n("chromium-experimental-timestamp-query-inside-passes")||n("timestamp-query"),n("shader-f16"),n("subgroups"),this.device=await t.requestDevice(i);let a=t,s=t.info??(typeof a.requestAdapterInfo=="function"?await a.requestAdapterInfo():void 0);this.adapterInfo=new $p(s),this.gpuDataManager=Dc(this),this.programManager=new vm(this),this.kernels=new Map,this.kernelPersistentData=new Map,this.kernelCustomData=new Map,Aa(e.logLevel,!!e.debug),this.device.onuncapturederror=o=>{o.error instanceof GPUValidationError&&console.error(`An uncaught WebGPU validation error was raised: ${o.error.message}`)},Object.defineProperty(this.env.webgpu,"device",{value:this.device,writable:!1,enumerable:!0,configurable:!0}),Object.defineProperty(this.env.webgpu,"adapter",{value:t,writable:!1,enumerable:!0,configurable:!1}),this.setQueryType()}dispose(){typeof this.querySet<"u"&&this.querySet.destroy(),this.gpuDataManager.dispose(),this.device&&this.env?.webgpu&&this.device.lost.then(()=>{delete this.env.webgpu.device})}getCommandEncoder(){return this.commandEncoder||(this.commandEncoder=this.device.createCommandEncoder()),this.commandEncoder}getComputePassEncoder(){if(!this.computePassEncoder){let e=this.getCommandEncoder(),t={};this.queryType==="at-passes"&&(t.timestampWrites={querySet:this.querySet,beginningOfPassWriteIndex:this.pendingDispatchNumber*2,endOfPassWriteIndex:this.pendingDispatchNumber*2+1}),this.computePassEncoder=e.beginComputePass(t)}return this.computePassEncoder}endComputePass(){this.computePassEncoder&&(this.computePassEncoder.end(),this.computePassEncoder=null)}flush(){if(!this.commandEncoder)return;pt(),this.endComputePass();let e;this.queryType!=="none"&&(this.commandEncoder.resolveQuerySet(this.querySet,0,this.pendingDispatchNumber*2,this.queryResolveBuffer,0),e=this.device.createBuffer({size:this.pendingDispatchNumber*2*8,usage:GPUBufferUsage.MAP_READ|GPUBufferUsage.COPY_DST}),this.pendingQueries.set(e,this.pendingKernels),this.pendingKernels=[],this.commandEncoder.copyBufferToBuffer(this.queryResolveBuffer,0,e,0,this.pendingDispatchNumber*2*8)),this.device.queue.submit([this.commandEncoder.finish()]),this.gpuDataManager.refreshPendingBuffers(),this.commandEncoder=null,this.pendingDispatchNumber=0,this.queryType!=="none"&&e.mapAsync(GPUMapMode.READ).then(()=>{let t=new BigUint64Array(e.getMappedRange()),r=this.pendingQueries.get(e);for(let i=0;i<t.length/2;i++){let n=r[i],a=n.kernelId,s=this.kernels.get(a),o=s.kernelType,l=s.kernelName,d=n.programName,p=n.inputTensorViews,h=n.outputTensorViews,f=t[i*2],g=t[i*2+1];typeof this.queryTimeBase>"u"&&(this.queryTimeBase=f);let m=Number(f-this.queryTimeBase),b=Number(g-this.queryTimeBase);if(!Number.isSafeInteger(m)||!Number.isSafeInteger(b))throw new RangeError("incorrect timestamp range");if(this.env.webgpu.profiling?.ondata)this.env.webgpu.profiling.ondata({version:1,inputsMetadata:p.map(v=>({dims:v.dims,dataType:mt(v.dataType)})),outputsMetadata:h.map(v=>({dims:v.dims,dataType:mt(v.dataType)})),kernelId:a,kernelType:o,kernelName:l,programName:d,startTime:m,endTime:b});else{let v="";p.forEach((w,S)=>{v+=`input[${S}]: [${w.dims}] | ${mt(w.dataType)}, `});let $="";h.forEach((w,S)=>{$+=`output[${S}]: [${w.dims}] | ${mt(w.dataType)}, `}),console.log(`[profiling] kernel "${a}|${o}|${l}|${d}" ${v}${$}start time: ${m} ns, execution time: ${b-m} ns`)}oi("GPU",`${d}::${f}::${g}`)}e.unmap(),this.pendingQueries.delete(e)}),it()}run(e,t,r,i,n,a){pt(e.name);let s=[];for(let w=0;w<t.length;++w){let S=t[w].data;if(S===0)continue;let x=this.gpuDataManager.get(S);if(!x)throw new Error(`no GPU data for input: ${S}`);s.push(x)}let{outputs:o,dispatchGroup:l,programUniforms:d}=e.getRunData(t),p=r.length===0?o.map((w,S)=>S):r;if(p.length!==o.length)throw new Error(`Output size ${p.length} must be equal to ${o.length}.`);let h=[],f=[];for(let w=0;w<o.length;++w){if(!Number.isInteger(p[w])||p[w]<-3||p[w]>=a)throw new Error(`Invalid output index: ${p[w]}`);if(p[w]===-3)continue;let S=p[w]===-1,x=p[w]===-2,I=S||x?n(o[w].dataType,o[w].dims):i(p[w],o[w].dataType,o[w].dims);if(h.push(I),I.data===0)continue;let C=this.gpuDataManager.get(I.data);if(!C)throw new Error(`no GPU data for output: ${I.data}`);if(S&&this.temporaryData.push(C),x){let z=this.kernelPersistentData.get(this.currentKernelId);z||(z=[],this.kernelPersistentData.set(this.currentKernelId,z)),z.push(C)}f.push(C)}if(s.length!==t.length||f.length!==h.length){if(f.length===0)return it(e.name),h;throw new Error(`Program ${e.name} has zero-sized tensor(s) in inputs or outputs. This is not supported now.`)}let g;if(d){let w=0,S=[];d.forEach(z=>{let k=typeof z.data=="number"?[z.data]:z.data;if(k.length===0)return;let D=z.type===10?2:4,L,j;z.type===10?(j=k.length>4?16:k.length>2?8:k.length*D,L=k.length>4?16:D*k.length):(j=k.length<=2?k.length*D:16,L=16),w=Math.ceil(w/j)*j,S.push(w);let O=z.type===10?8:4;w+=k.length>4?Math.ceil(k.length/O)*L:k.length*D});let x=16;w=Math.ceil(w/x)*x;let I=new ArrayBuffer(w);d.forEach((z,k)=>{let D=S[k],L=typeof z.data=="number"?[z.data]:z.data;if(z.type===6)new Int32Array(I,D,L.length).set(L);else if(z.type===12)new Uint32Array(I,D,L.length).set(L);else if(z.type===10)new Uint16Array(I,D,L.length).set(L);else if(z.type===1)new Float32Array(I,D,L.length).set(L);else throw new Error(`Unsupported uniform type: ${mt(z.type)}`)});let C=this.gpuDataManager.create(w,GPUBufferUsage.COPY_DST|GPUBufferUsage.UNIFORM);this.device.queue.writeBuffer(C.buffer,0,I,0,w),this.gpuDataManager.release(C.id),g={offset:0,size:w,buffer:C.buffer}}let m=this.programManager.normalizeDispatchGroupSize(l),b=m[1]===1&&m[2]===1,v=wp(e,t,b),$=this.programManager.getArtifact(v);if($||($=this.programManager.build(e,m),this.programManager.setArtifact(v,$),ce("info",()=>`[artifact] key: ${v}, programName: ${e.name}`)),d&&$.uniformVariablesInfo){if(d.length!==$.uniformVariablesInfo.length)throw new Error(`Uniform variables count mismatch: expect ${$.uniformVariablesInfo.length}, got ${d.length} in program "${$.programInfo.name}".`);for(let w=0;w<d.length;w++){let S=d[w],x=S.type,I=typeof S.data=="number"?1:S.data.length,[C,z]=$.uniformVariablesInfo[w];if(x!==C||I!==z)throw new Error(`Uniform variable ${w} mismatch: expect type ${C} with size ${z}, got type ${x} with size ${I} in program "${$.programInfo.name}".`)}}if(ce("info",()=>`[ProgramManager] run "${e.name}" (key=${v}) with ${m[0]}x${m[1]}x${m[2]}`),this.queryType!=="none"||this.sessionStatus==="capturing"){let w={kernelId:this.currentKernelId,programName:$.programInfo.name,inputTensorViews:t,outputTensorViews:h};this.pendingKernels.push(w),this.sessionStatus==="capturing"&&this.capturedPendingKernels.get(this.currentSessionId).push(w)}return this.programManager.run($,s,f,m,g),it(e.name),h}upload(e,t){this.gpuDataManager.upload(e,t)}memcpy(e,t){this.gpuDataManager.memcpy(e,t)}async download(e,t){await this.gpuDataManager.download(e,t)}alloc(e){return this.gpuDataManager.create(e).id}free(e){return this.gpuDataManager.release(e)}createKernel(e,t,r,i){let n=$m.get(e);if(!n)throw new Error(`kernel not implemented: ${e}`);let a={kernelType:e,kernelName:i,kernelEntry:n[0],attributes:[n[1],r]};this.kernels.set(t,a)}releaseKernel(e){let t=this.kernelPersistentData.get(e);if(t){for(let r of t)this.gpuDataManager.release(r.id);this.kernelPersistentData.delete(e)}this.kernelCustomData.delete(e),this.kernels.delete(e)}computeKernel(e,t,r){let i=this.kernels.get(e);if(!i)throw new Error(`kernel not created: ${e}`);let n=i.kernelType,a=i.kernelName,s=i.kernelEntry,o=i.attributes;if(this.currentKernelId!==null)throw new Error(`kernel "[${n}] ${a}" is not allowed to be called recursively`);this.currentKernelId=e,o[0]&&(o[1]=o[0](o[1]),o[0]=void 0),ce("info",()=>`[WebGPU] Start to run kernel "[${n}] ${a}"...`);let l=this.env.debug;this.temporaryData=[];try{return l&&this.device.pushErrorScope("validation"),s(t,o[1]),0}catch(d){return r.push(Promise.resolve(`[WebGPU] Kernel "[${n}] ${a}" failed. ${d}`)),1}finally{l&&r.push(this.device.popErrorScope().then(d=>d?`GPU validation error for kernel "[${n}] ${a}": ${d.message}`:null));for(let d of this.temporaryData)this.gpuDataManager.release(d.id);this.temporaryData=[],this.currentKernelId=null}}registerBuffer(e,t,r,i){let n=this.sessionExternalDataMapping.get(e);n||(n=new Map,this.sessionExternalDataMapping.set(e,n));let a=n.get(t),s=this.gpuDataManager.registerExternalBuffer(r,i,a);return n.set(t,[s,r]),s}unregisterBuffers(e){let t=this.sessionExternalDataMapping.get(e);t&&(t.forEach(r=>this.gpuDataManager.unregisterExternalBuffer(r[0])),this.sessionExternalDataMapping.delete(e))}getBuffer(e){let t=this.gpuDataManager.get(e);if(!t)throw new Error(`no GPU data for buffer: ${e}`);return t.buffer}createDownloader(e,t,r){return async()=>{let i=await ra(this,e,t);return Ma(i.buffer,r)}}writeTimestamp(e){this.queryType==="inside-passes"&&this.computePassEncoder.writeTimestamp(this.querySet,e)}setQueryType(){this.queryType="none",(this.env.webgpu.profiling?.mode==="default"||(typeof this.env.trace>"u"?this.env.wasm.trace:this.env.trace))&&(this.device.features.has("chromium-experimental-timestamp-query-inside-passes")?this.queryType="inside-passes":this.device.features.has("timestamp-query")&&(this.queryType="at-passes"),this.queryType!=="none"&&typeof this.querySet>"u"&&(this.querySet=this.device.createQuerySet({type:"timestamp",count:this.maxDispatchNumber*2}),this.queryResolveBuffer=this.device.createBuffer({size:this.maxDispatchNumber*2*8,usage:GPUBufferUsage.COPY_SRC|GPUBufferUsage.QUERY_RESOLVE})))}captureBegin(){ce("info","captureBegin"),this.capturedCommandList.get(this.currentSessionId)||this.capturedCommandList.set(this.currentSessionId,[]),this.capturedPendingKernels.get(this.currentSessionId)||this.capturedPendingKernels.set(this.currentSessionId,[]),this.flush(),this.sessionStatus="capturing"}captureEnd(){ce("info","captureEnd"),this.flush(),this.sessionStatus="default"}replay(){ce("info","replay"),this.sessionStatus="replaying";let e=this.capturedCommandList.get(this.currentSessionId),t=this.capturedPendingKernels.get(this.currentSessionId),r=e.length;this.pendingKernels=[];for(let i=0;i<r;i++){let n=this.getComputePassEncoder(),a=e[i];this.writeTimestamp(this.pendingDispatchNumber*2),n.setPipeline(a.computePipeline),n.setBindGroup(0,a.bindGroup),n.dispatchWorkgroups(...a.dispatchGroup),this.writeTimestamp(this.pendingDispatchNumber*2+1),this.pendingDispatchNumber++,this.queryType!=="none"&&this.pendingKernels.push(t[i]),(this.pendingDispatchNumber>=this.maxDispatchNumber||this.queryType==="at-passes")&&this.endComputePass(),this.pendingDispatchNumber>=this.maxDispatchNumber&&this.flush()}this.flush(),this.sessionStatus="default"}onCreateSession(){this.gpuDataManager.onCreateSession()}onReleaseSession(e){this.unregisterBuffers(e),this.capturedCommandList.has(e)&&this.capturedCommandList.delete(e),this.capturedPendingKernels.has(e)&&this.capturedPendingKernels.delete(e),this.gpuDataManager.onReleaseSession(e)}onRunStart(e){this.currentSessionId=e,this.setQueryType()}}}),km={};ir(km,{init:()=>Tm});var Yr,vp,Tm,L_=F(()=>{ie(),gt(),ne(),Ky(),Yr=class Im{constructor(t,r,i,n){this.module=t,this.dataType=r,this.data=i,this.dims=n}getFloat32Array(){if(this.dataType!==1)throw new Error("Invalid data type");let t=N.size(this.dims);return t===0?new Float32Array:new Float32Array(this.module.HEAP8.buffer,this.data,t)}getBigInt64Array(){if(this.dataType!==7)throw new Error("Invalid data type");let t=N.size(this.dims);return t===0?new BigInt64Array:new BigInt64Array(this.module.HEAP8.buffer,this.data,t)}getInt32Array(){if(this.dataType!==6)throw new Error("Invalid data type");let t=N.size(this.dims);return t===0?new Int32Array:new Int32Array(this.module.HEAP8.buffer,this.data,t)}getUint16Array(){if(this.dataType!==10&&this.dataType!==4)throw new Error("Invalid data type");let t=N.size(this.dims);return t===0?new Uint16Array:new Uint16Array(this.module.HEAP8.buffer,this.data,t)}reshape(t){if(N.size(t)!==N.size(this.dims))throw new Error("Invalid new shape");return new Im(this.module,this.dataType,this.data,t)}},vp=class{constructor(e,t,r){this.module=e,this.backend=t,this.customDataOffset=0,this.customDataSize=0,this.adapterInfo=t.adapterInfo;let i=e.PTR_SIZE,n=r/e.PTR_SIZE,a=i===4?"i32":"i64";this.opKernelContext=Number(e.getValue(i*n++,a));let s=Number(e.getValue(i*n++,a));this.outputCount=Number(e.getValue(i*n++,a)),this.customDataOffset=Number(e.getValue(i*n++,"*")),this.customDataSize=Number(e.getValue(i*n++,a));let o=[];for(let l=0;l<s;l++){let d=Number(e.getValue(i*n++,a)),p=Number(e.getValue(i*n++,"*")),h=Number(e.getValue(i*n++,a)),f=[];for(let g=0;g<h;g++)f.push(Number(e.getValue(i*n++,a)));o.push(new Yr(e,d,p,f))}this.inputs=o}get kernelCustomData(){return this.backend.currentKernelCustomData}get customDataBuffer(){return this.module.HEAPU8.subarray(this.customDataOffset,this.customDataOffset+this.customDataSize)}compute(e,t){let r=t?.inputs?.map(s=>typeof s=="number"?this.inputs[s]:s)??this.inputs,i=t?.outputs??[],n=(s,o,l)=>new Yr(this.module,o,this.output(s,l),l),a=(s,o)=>{let l=Dt(s,o);if(!l)throw new Error(`Unsupported data type: ${s}`);let d=l>0?this.backend.gpuDataManager.create(l).id:0;return new Yr(this.module,s,d,o)};return this.backend.run(e,r,i,n,a,this.outputCount)}output(e,t){let r=this.module.stackSave();try{let i=this.module.PTR_SIZE,n=i===4?"i32":"i64",a=this.module.stackAlloc((1+t.length)*i);this.module.setValue(a,t.length,n);for(let s=0;s<t.length;s++)this.module.setValue(a+i*(s+1),t[s],n);return this.module._JsepOutput(this.opKernelContext,e,a)}catch(i){throw new Error(`Failed to generate kernel's output[${e}] with dims [${t}]. If you are running with pre-allocated output, please make sure the output type/dims are correct. Error: ${i}`)}finally{this.module.stackRestore(r)}}},Tm=async(e,t,r,i)=>{let n=t.jsepInit;if(!n)throw new Error("Failed to initialize JSEP. The WebAssembly module is not built with JSEP support.");if(e==="webgpu"){let a=(U_(),kr(xm)).WebGpuBackend,s=new a;await s.initialize(r,i),n("webgpu",[s,o=>s.alloc(Number(o)),o=>s.free(o),(o,l,d,p=!1)=>{if(p)ce("verbose",()=>`[WebGPU] jsepCopyGpuToGpu: src=${Number(o)}, dst=${Number(l)}, size=${Number(d)}`),s.memcpy(Number(o),Number(l));else{ce("verbose",()=>`[WebGPU] jsepCopyCpuToGpu: dataOffset=${Number(o)}, gpuDataId=${Number(l)}, size=${Number(d)}`);let h=t.HEAPU8.subarray(Number(o>>>0),Number(o>>>0)+Number(d));s.upload(Number(l),h)}},async(o,l,d)=>{ce("verbose",()=>`[WebGPU] jsepCopyGpuToCpu: gpuDataId=${o}, dataOffset=${l}, size=${d}`),await s.download(Number(o),()=>t.HEAPU8.subarray(Number(l)>>>0,Number(l+d)>>>0))},(o,l,d)=>s.createKernel(o,Number(l),d,t.UTF8ToString(t._JsepGetNodeName(Number(l)))),o=>s.releaseKernel(o),(o,l,d,p)=>{ce("verbose",()=>`[WebGPU] jsepRun: sessionHandle=${d}, kernel=${o}, contextDataOffset=${l}`);let h=new vp(t,s,Number(l));return s.computeKernel(Number(o),h,p)},()=>s.captureBegin(),()=>s.captureEnd(),()=>s.replay()])}else{let a=new Bc(r);n("webnn",[a,()=>a.reserveTensorId(),s=>a.releaseTensorId(s),async(s,o,l,d,p)=>a.ensureTensor(s,o,l,d,p),(s,o)=>{a.uploadTensor(s,o)},async(s,o)=>a.downloadTensor(s,o),(s,o)=>a.registerMLContext(s,o),!!r.trace])}}}),xp,Ga,Va,xt,Sp,Un,fi,Fa,Ha,Ln,ja,Ka,Xa,Em=F(()=>{Ke(),Fy(),Hy(),ie(),Vt(),Ia(),zc(),xp=(e,t)=>{we()._OrtInit(e,t)!==0&&ge("Can't initialize onnxruntime.")},Ga=async e=>{xp(e.wasm.numThreads,li(e.logLevel))},Va=async(e,t)=>{we().asyncInit?.();let r=e.webgpu.adapter;if(t==="webgpu"){if(typeof navigator>"u"||!navigator.gpu)throw new Error("WebGPU is not supported in current environment");if(r){if(typeof r.limits!="object"||typeof r.features!="object"||typeof r.requestDevice!="function")throw new Error("Invalid GPU adapter set in `env.webgpu.adapter`. It must be a GPUAdapter object.")}else{let i=e.webgpu.powerPreference;if(i!==void 0&&i!=="low-power"&&i!=="high-performance")throw new Error(`Invalid powerPreference setting: "${i}"`);let n=e.webgpu.forceFallbackAdapter;if(n!==void 0&&typeof n!="boolean")throw new Error(`Invalid forceFallbackAdapter setting: "${n}"`);if(r=await navigator.gpu.requestAdapter({powerPreference:i,forceFallbackAdapter:n}),!r)throw new Error('Failed to get GPU adapter. You may need to enable flag "--enable-unsafe-webgpu" if you are using Chrome.')}}if(t==="webnn"&&(typeof navigator>"u"||!navigator.ml))throw new Error("WebNN is not supported in current environment");{let i=(L_(),kr(km)).init;t==="webgpu"&&await i("webgpu",we(),e,r),t==="webnn"&&await i("webnn",we(),e)}},xt=new Map,Sp=e=>{let t=we(),r=t.stackSave();try{let i=t.PTR_SIZE,n=t.stackAlloc(2*i);t._OrtGetInputOutputCount(e,n,n+i)!==0&&ge("Can't get session input/output count.");let a=i===4?"i32":"i64";return[Number(t.getValue(n,a)),Number(t.getValue(n+i,a))]}finally{t.stackRestore(r)}},Un=(e,t)=>{let r=we(),i=r.stackSave(),n=0;try{let a=r.PTR_SIZE,s=r.stackAlloc(2*a);r._OrtGetInputOutputMetadata(e,t,s,s+a)!==0&&ge("Can't get session input/output metadata.");let o=Number(r.getValue(s,"*"));n=Number(r.getValue(s+a,"*"));let l=r.HEAP32[n/4];if(l===0)return[o,0];let d=r.HEAPU32[n/4+1],p=[];for(let h=0;h<d;h++){let f=Number(r.getValue(n+8+h*a,"*"));p.push(f!==0?r.UTF8ToString(f):Number(r.getValue(n+8+(h+d)*a,"*")))}return[o,l,p]}finally{r.stackRestore(i),n!==0&&r._OrtFree(n)}},fi=e=>{let t=we(),r=t._malloc(e.byteLength);if(r===0)throw new Error(`Can't create a session. failed to allocate a buffer of size ${e.byteLength}.`);return t.HEAPU8.set(e,r),[r,e.byteLength]},Fa=async(e,t)=>{let r,i,n=we();Array.isArray(e)?[r,i]=e:e.buffer===n.HEAPU8.buffer?[r,i]=[e.byteOffset,e.byteLength]:[r,i]=fi(e);let a=0,s=0,o=0,l=[],d=[],p=[];try{if([s,l]=await Cc(t),t?.externalData&&n.mountExternalData){let x=[];for(let I of t.externalData){let C=typeof I=="string"?I:I.path;x.push(za(typeof I=="string"?I:I.data).then(z=>{n.mountExternalData(C,z)}))}await Promise.all(x)}for(let x of t?.executionProviders??[])if((typeof x=="string"?x:x.name)==="webnn"){if(n.shouldTransferToMLTensor=!1,typeof x!="string"){let I=x,C=I?.context,z=I?.gpuDevice,k=I?.deviceType,D=I?.powerPreference;C?n.currentContext=C:z?n.currentContext=await n.webnnCreateMLContext(z):n.currentContext=await n.webnnCreateMLContext({deviceType:k,powerPreference:D})}else n.currentContext=await n.webnnCreateMLContext();break}a=await n._OrtCreateSession(r,i,s),n.webgpuOnCreateSession?.(a),a===0&&ge("Can't create a session."),n.jsepOnCreateSession?.(),n.currentContext&&(n.webnnRegisterMLContext(a,n.currentContext),n.currentContext=void 0,n.shouldTransferToMLTensor=!0);let[h,f]=Sp(a),g=!!t?.enableGraphCapture,m=[],b=[],v=[],$=[],w=[];for(let x=0;x<h;x++){let[I,C,z]=Un(a,x);I===0&&ge("Can't get an input name."),d.push(I);let k=n.UTF8ToString(I);m.push(k),v.push(C===0?{name:k,isTensor:!1}:{name:k,isTensor:!0,type:mt(C),shape:z})}for(let x=0;x<f;x++){let[I,C,z]=Un(a,x+h);I===0&&ge("Can't get an output name."),p.push(I);let k=n.UTF8ToString(I);b.push(k),$.push(C===0?{name:k,isTensor:!1}:{name:k,isTensor:!0,type:mt(C),shape:z});{if(g&&t?.preferredOutputLocation===void 0){w.push("gpu-buffer");continue}let D=typeof t?.preferredOutputLocation=="string"?t.preferredOutputLocation:t?.preferredOutputLocation?.[k]??"cpu",L=n.webnnIsGraphOutput;if(D==="cpu"&&L&&L(a,k)){w.push("ml-tensor-cpu-output");continue}if(D!=="cpu"&&D!=="cpu-pinned"&&D!=="gpu-buffer"&&D!=="ml-tensor")throw new Error(`Not supported preferred output location: ${D}.`);if(g&&D!=="gpu-buffer")throw new Error(`Not supported preferred output location: ${D}. Only 'gpu-buffer' location is supported when enableGraphCapture is true.`);w.push(D)}}let S=null;return w.some(x=>x==="gpu-buffer"||x==="ml-tensor"||x==="ml-tensor-cpu-output")&&(o=n._OrtCreateBinding(a),o===0&&ge("Can't create IO binding."),S={handle:o,outputPreferredLocations:w,outputPreferredLocationsEncoded:w.map(x=>x==="ml-tensor-cpu-output"?"ml-tensor":x).map(x=>ea(x))}),xt.set(a,[a,d,p,S,g,!1]),[a,m,b,v,$]}catch(h){throw d.forEach(f=>n._OrtFree(f)),p.forEach(f=>n._OrtFree(f)),o!==0&&n._OrtReleaseBinding(o)!==0&&ge("Can't release IO binding."),a!==0&&n._OrtReleaseSession(a)!==0&&ge("Can't release session."),h}finally{n._free(r),s!==0&&n._OrtReleaseSessionOptions(s)!==0&&ge("Can't release session options."),l.forEach(h=>n._free(h)),n.unmountExternalData?.()}},Ha=e=>{let t=we(),r=xt.get(e);if(!r)throw new Error(`cannot release session. invalid session id: ${e}`);let[i,n,a,s,o]=r;s&&(o&&t._OrtClearBoundOutputs(s.handle)!==0&&ge("Can't clear bound outputs."),t._OrtReleaseBinding(s.handle)!==0&&ge("Can't release IO binding.")),t.jsepOnReleaseSession?.(e),t.webnnOnReleaseSession?.(e),t.webgpuOnReleaseSession?.(e),n.forEach(l=>t._OrtFree(l)),a.forEach(l=>t._OrtFree(l)),t._OrtReleaseSession(i)!==0&&ge("Can't release session."),xt.delete(e)},Ln=async(e,t,r,i,n,a,s=!1)=>{if(!e){t.push(0);return}let o=we(),l=o.PTR_SIZE,d=e[0],p=e[1],h=e[3],f=h,g,m;if(d==="string"&&(h==="gpu-buffer"||h==="ml-tensor"))throw new Error("String tensor is not supported on GPU.");if(s&&h!=="gpu-buffer")throw new Error(`External buffer must be provided for input/output index ${a} when enableGraphCapture is true.`);if(h==="gpu-buffer"){let $=e[2].gpuBuffer;m=Dt(Bt(d),p);{let w=o.jsepRegisterBuffer;if(!w)throw new Error('Tensor location "gpu-buffer" is not supported without using WebGPU.');g=w(i,a,$,m)}}else if(h==="ml-tensor"){let $=e[2].mlTensor;m=Dt(Bt(d),p);let w=o.webnnRegisterMLTensor;if(!w)throw new Error('Tensor location "ml-tensor" is not supported without using WebNN.');g=w(i,$,Bt(d),p)}else{let $=e[2];if(Array.isArray($)){m=l*$.length,g=o._malloc(m),r.push(g);for(let w=0;w<$.length;w++){if(typeof $[w]!="string")throw new TypeError(`tensor data at index ${w} is not a string`);o.setValue(g+w*l,tt($[w],r),"*")}}else{let w=o.webnnIsGraphInput,S=o.webnnIsGraphOutput;if(d!=="string"&&w&&S){let x=o.UTF8ToString(n);if(w(i,x)||S(i,x)){let I=Bt(d);m=Dt(I,p),f="ml-tensor";let C=o.webnnCreateTemporaryTensor,z=o.webnnUploadTensor;if(!C||!z)throw new Error('Tensor location "ml-tensor" is not supported without using WebNN.');let k=await C(i,I,p);z(k,new Uint8Array($.buffer,$.byteOffset,$.byteLength)),g=k}else m=$.byteLength,g=o._malloc(m),r.push(g),o.HEAPU8.set(new Uint8Array($.buffer,$.byteOffset,m),g)}else m=$.byteLength,g=o._malloc(m),r.push(g),o.HEAPU8.set(new Uint8Array($.buffer,$.byteOffset,m),g)}}let b=o.stackSave(),v=o.stackAlloc(4*p.length);try{p.forEach((w,S)=>o.setValue(v+S*l,w,l===4?"i32":"i64"));let $=o._OrtCreateTensor(Bt(d),g,m,v,p.length,ea(f));$===0&&ge(`Can't create tensor for input/output. session=${i}, index=${a}.`),t.push($)}finally{o.stackRestore(b)}},ja=async(e,t,r,i,n,a)=>{let s=we(),o=s.PTR_SIZE,l=xt.get(e);if(!l)throw new Error(`cannot run inference. invalid session id: ${e}`);let d=l[0],p=l[1],h=l[2],f=l[3],g=l[4],m=l[5],b=t.length,v=i.length,$=0,w=[],S=[],x=[],I=[],C=[],z=s.stackSave(),k=s.stackAlloc(b*o),D=s.stackAlloc(b*o),L=s.stackAlloc(v*o),j=s.stackAlloc(v*o);try{[$,w]=Ec(a),Ut("wasm prepareInputOutputTensor");for(let B=0;B<b;B++)await Ln(r[B],S,I,e,p[t[B]],t[B],g);for(let B=0;B<v;B++)await Ln(n[B],x,I,e,h[i[B]],b+i[B],g);Lt("wasm prepareInputOutputTensor");for(let B=0;B<b;B++)s.setValue(k+B*o,S[B],"*"),s.setValue(D+B*o,p[t[B]],"*");for(let B=0;B<v;B++)s.setValue(L+B*o,x[B],"*"),s.setValue(j+B*o,h[i[B]],"*");if(f&&!m){let{handle:B,outputPreferredLocations:V,outputPreferredLocationsEncoded:Y}=f;if(p.length!==b)throw new Error(`input count from feeds (${b}) is expected to be always equal to model's input count (${p.length}).`);Ut("wasm bindInputsOutputs");for(let q=0;q<b;q++){let H=t[q];await s._OrtBindInput(B,p[H],S[q])!==0&&ge(`Can't bind input[${q}] for session=${e}.`)}for(let q=0;q<v;q++){let H=i[q];n[q]?.[3]?(C.push(x[q]),s._OrtBindOutput(B,h[H],x[q],0)!==0&&ge(`Can't bind pre-allocated output[${q}] for session=${e}.`)):s._OrtBindOutput(B,h[H],0,Y[H])!==0&&ge(`Can't bind output[${q}] to ${V[q]} for session=${e}.`)}Lt("wasm bindInputsOutputs"),xt.set(e,[d,p,h,f,g,!0])}s.jsepOnRunStart?.(d),s.webnnOnRunStart?.(d);let O;f?O=await s._OrtRunWithBinding(d,f.handle,v,L,$):O=await s._OrtRun(d,D,k,b,j,v,L,$),O!==0&&ge("failed to call OrtRun().");let G=[],M=[];Ut("wasm ProcessOutputTensor");for(let B=0;B<v;B++){let V=Number(s.getValue(L+B*o,"*"));if(V===x[B]||C.includes(x[B])){G.push(n[B]),V!==x[B]&&s._OrtReleaseTensor(V)!==0&&ge("Can't release tensor.");continue}let Y=s.stackSave(),q=s.stackAlloc(4*o),H=!1,X,W=0;try{s._OrtGetTensorData(V,q,q+o,q+2*o,q+3*o)!==0&&ge(`Can't access output tensor data on index ${B}.`);let J=o===4?"i32":"i64",Q=Number(s.getValue(q,J));W=s.getValue(q+o,"*");let R=s.getValue(q+o*2,"*"),se=Number(s.getValue(q+o*3,J)),Ie=[];for(let ye=0;ye<se;ye++)Ie.push(Number(s.getValue(R+ye*o,J)));s._OrtFree(R)!==0&&ge("Can't free memory for tensor dims.");let Se=Ie.reduce((ye,ve)=>ye*ve,1);X=mt(Q);let Ne=f?.outputPreferredLocations[i[B]];if(X==="string"){if(Ne==="gpu-buffer"||Ne==="ml-tensor")throw new Error("String tensor is not supported on GPU.");let ye=[];for(let ve=0;ve<Se;ve++){let De=s.getValue(W+ve*o,"*"),Ir=s.getValue(W+(ve+1)*o,"*"),nt=ve===Se-1?void 0:Ir-De;ye.push(s.UTF8ToString(De,nt))}G.push([X,Ie,ye,"cpu"])}else if(Ne==="gpu-buffer"&&Se>0){let ye=s.jsepGetBuffer;if(!ye)throw new Error('preferredLocation "gpu-buffer" is not supported without using WebGPU.');let ve=ye(W),De=Dt(Q,Se);if(De===void 0||!Ea(X))throw new Error(`Unsupported data type: ${X}`);H=!0,G.push([X,Ie,{gpuBuffer:ve,download:s.jsepCreateDownloader(ve,De,X),dispose:()=>{s._OrtReleaseTensor(V)!==0&&ge("Can't release tensor.")}},"gpu-buffer"])}else if(Ne==="ml-tensor"&&Se>0){let ye=s.webnnEnsureTensor,ve=s.webnnIsGraphInputOutputTypeSupported;if(!ye||!ve)throw new Error('preferredLocation "ml-tensor" is not supported without using WebNN.');if(Dt(Q,Se)===void 0||!Ca(X))throw new Error(`Unsupported data type: ${X}`);if(!ve(e,X,!1))throw new Error(`preferredLocation "ml-tensor" for ${X} output is not supported by current WebNN Context.`);let De=await ye(e,W,Q,Ie,!1);H=!0,G.push([X,Ie,{mlTensor:De,download:s.webnnCreateMLTensorDownloader(W,X),dispose:()=>{s.webnnReleaseTensorId(W),s._OrtReleaseTensor(V)}},"ml-tensor"])}else if(Ne==="ml-tensor-cpu-output"&&Se>0){let ye=s.webnnCreateMLTensorDownloader(W,X)(),ve=G.length;H=!0,M.push((async()=>{let De=[ve,await ye];return s.webnnReleaseTensorId(W),s._OrtReleaseTensor(V),De})()),G.push([X,Ie,[],"cpu"])}else{let ye=yi(X),ve=new ye(Se);new Uint8Array(ve.buffer,ve.byteOffset,ve.byteLength).set(s.HEAPU8.subarray(W,W+ve.byteLength)),G.push([X,Ie,ve,"cpu"])}}finally{s.stackRestore(Y),X==="string"&&W&&s._free(W),H||s._OrtReleaseTensor(V)}}f&&!g&&(s._OrtClearBoundOutputs(f.handle)!==0&&ge("Can't clear bound outputs."),xt.set(e,[d,p,h,f,g,!1]));for(let[B,V]of await Promise.all(M))G[B][2]=V;return Lt("wasm ProcessOutputTensor"),G}finally{s.webnnOnRunEnd?.(d),s.stackRestore(z),S.forEach(O=>s._OrtReleaseTensor(O)),x.forEach(O=>s._OrtReleaseTensor(O)),I.forEach(O=>s._free(O)),$!==0&&s._OrtReleaseRunOptions($),w.forEach(O=>s._free(O))}},Ka=e=>{let t=we(),r=xt.get(e);if(!r)throw new Error("invalid session id");let i=r[0],n=t._OrtEndProfiling(i);n===0&&ge("Can't get an profile file name."),t._OrtFree(n)},Xa=e=>{let t=[];for(let r of e){let i=r[2];!Array.isArray(i)&&"buffer"in i&&t.push(i.buffer)}return t}}),St,Fe,Kt,gr,yr,Qr,qn,Jr,Ot,Rt,kp,Cm,zm,Am,Mm,Om,Rm,Nm,Bm=F(()=>{Ke(),Em(),Vt(),ka(),St=()=>!!be.wasm.proxy&&typeof document<"u",Kt=!1,gr=!1,yr=!1,Jr=new Map,Ot=(e,t)=>{let r=Jr.get(e);r?r.push(t):Jr.set(e,[t])},Rt=()=>{if(Kt||!gr||yr||!Fe)throw new Error("worker not ready")},kp=e=>{switch(e.data.type){case"init-wasm":Kt=!1,e.data.err?(yr=!0,qn[1](e.data.err)):(gr=!0,qn[0]()),Qr&&(URL.revokeObjectURL(Qr),Qr=void 0);break;case"init-ep":case"copy-from":case"create":case"release":case"run":case"end-profiling":{let t=Jr.get(e.data.type);e.data.err?t.shift()[1](e.data.err):t.shift()[0](e.data.out);break}}},Cm=async()=>{if(!gr){if(Kt)throw new Error("multiple calls to 'initWasm()' detected.");if(yr)throw new Error("previous call to 'initWasm()' failed.");if(Kt=!0,St())return new Promise((e,t)=>{Fe?.terminate(),Tc().then(([r,i])=>{try{Fe=i,Fe.onerror=a=>t(a),Fe.onmessage=kp,qn=[e,t];let n={type:"init-wasm",in:be};!n.in.wasm.wasmPaths&&(r||Jn)&&(n.in.wasm.wasmPaths={wasm:new URL("/SACHIZU-LAB1/assets/ort-wasm-simd-threaded.jsep-DC5y_g6C.wasm",import.meta.url).href}),Fe.postMessage(n),Qr=r}catch(n){t(n)}},t)});try{await Ta(be.wasm),await Ga(be),gr=!0}catch(e){throw yr=!0,e}finally{Kt=!1}}},zm=async e=>{if(St())return Rt(),new Promise((t,r)=>{Ot("init-ep",[t,r]);let i={type:"init-ep",in:{epName:e,env:be}};Fe.postMessage(i)});await Va(be,e)},Am=async e=>St()?(Rt(),new Promise((t,r)=>{Ot("copy-from",[t,r]);let i={type:"copy-from",in:{buffer:e}};Fe.postMessage(i,[e.buffer])})):fi(e),Mm=async(e,t)=>{if(St()){if(t?.preferredOutputLocation)throw new Error('session option "preferredOutputLocation" is not supported for proxy.');return Rt(),new Promise((r,i)=>{Ot("create",[r,i]);let n={type:"create",in:{model:e,options:{...t}}},a=[];e instanceof Uint8Array&&a.push(e.buffer),Fe.postMessage(n,a)})}else return Fa(e,t)},Om=async e=>{if(St())return Rt(),new Promise((t,r)=>{Ot("release",[t,r]);let i={type:"release",in:e};Fe.postMessage(i)});Ha(e)},Rm=async(e,t,r,i,n,a)=>{if(St()){if(r.some(s=>s[3]!=="cpu"))throw new Error("input tensor on GPU is not supported for proxy.");if(n.some(s=>s))throw new Error("pre-allocated output tensor is not supported for proxy.");return Rt(),new Promise((s,o)=>{Ot("run",[s,o]);let l=r,d={type:"run",in:{sessionId:e,inputIndices:t,inputs:l,outputIndices:i,options:a}};Fe.postMessage(d,Xa(l))})}else return ja(e,t,r,i,n,a)},Nm=async e=>{if(St())return Rt(),new Promise((t,r)=>{Ot("end-profiling",[t,r]);let i={type:"end-profiling",in:e};Fe.postMessage(i)});Ka(e)}}),Wn,Tp,Dm,q_=F(()=>{Ke(),Bm(),ie(),Sa(),zc(),Wn=(e,t)=>{switch(e.location){case"cpu":return[e.type,e.dims,e.data,"cpu"];case"gpu-buffer":return[e.type,e.dims,{gpuBuffer:e.gpuBuffer},"gpu-buffer"];case"ml-tensor":return[e.type,e.dims,{mlTensor:e.mlTensor},"ml-tensor"];default:throw new Error(`invalid data location: ${e.location} for ${t()}`)}},Tp=e=>{switch(e[3]){case"cpu":return new rt(e[0],e[2],e[1]);case"gpu-buffer":{let t=e[0];if(!Ea(t))throw new Error(`not supported data type: ${t} for deserializing GPU tensor`);let{gpuBuffer:r,download:i,dispose:n}=e[2];return rt.fromGpuBuffer(r,{dataType:t,dims:e[1],download:i,dispose:n})}case"ml-tensor":{let t=e[0];if(!Ca(t))throw new Error(`not supported data type: ${t} for deserializing MLTensor tensor`);let{mlTensor:r,download:i,dispose:n}=e[2];return rt.fromMLTensor(r,{dataType:t,dims:e[1],download:i,dispose:n})}default:throw new Error(`invalid data location: ${e[3]}`)}},Dm=class{async fetchModelAndCopyToWasmMemory(e){return Am(await za(e))}async loadModel(e,t){pt();let r;typeof e=="string"?r=await this.fetchModelAndCopyToWasmMemory(e):r=e,[this.sessionId,this.inputNames,this.outputNames,this.inputMetadata,this.outputMetadata]=await Mm(r,t),it()}async dispose(){return Om(this.sessionId)}async run(e,t,r){pt();let i=[],n=[];Object.entries(e).forEach(h=>{let f=h[0],g=h[1],m=this.inputNames.indexOf(f);if(m===-1)throw new Error(`invalid input '${f}'`);i.push(g),n.push(m)});let a=[],s=[];Object.entries(t).forEach(h=>{let f=h[0],g=h[1],m=this.outputNames.indexOf(f);if(m===-1)throw new Error(`invalid output '${f}'`);a.push(g),s.push(m)});let o=i.map((h,f)=>Wn(h,()=>`input "${this.inputNames[n[f]]}"`)),l=a.map((h,f)=>h?Wn(h,()=>`output "${this.outputNames[s[f]]}"`):null),d=await Rm(this.sessionId,n,o,s,l,r),p={};for(let h=0;h<d.length;h++)p[this.outputNames[s[h]]]=a[h]??Tp(d[h]);return it(),p}startProfiling(){}endProfiling(){Nm(this.sessionId)}}}),Pm={};ir(Pm,{OnnxruntimeWebAssemblyBackend:()=>fa,initializeFlags:()=>ha,wasmBackend:()=>Um});var ha,fa,Um,W_=F(()=>{Ke(),Bm(),q_(),ha=()=>{(typeof be.wasm.initTimeout!="number"||be.wasm.initTimeout<0)&&(be.wasm.initTimeout=0);let e=be.wasm.simd;if(typeof e!="boolean"&&e!==void 0&&e!=="fixed"&&e!=="relaxed"&&(console.warn(`Property "env.wasm.simd" is set to unknown value "${e}". Reset it to \`false\` and ignore SIMD feature checking.`),be.wasm.simd=!1),typeof be.wasm.proxy!="boolean"&&(be.wasm.proxy=!1),typeof be.wasm.trace!="boolean"&&(be.wasm.trace=!1),typeof be.wasm.numThreads!="number"||!Number.isInteger(be.wasm.numThreads)||be.wasm.numThreads<=0)if(typeof self<"u"&&!self.crossOriginIsolated)be.wasm.numThreads=1;else{let t=typeof navigator>"u"?Iy("node:os").cpus().length:navigator.hardwareConcurrency;be.wasm.numThreads=Math.min(4,Math.ceil((t||1)/2))}},fa=class{async init(e){ha(),await Cm(),await zm(e)}async createInferenceSessionHandler(e,t){let r=new Dm;return await r.loadModel(e,t),r}},Um=new fa});Ke();Ke();Ke();var G_="1.27.0";{let e=(W_(),kr(Pm)).wasmBackend;Yt("webgpu",e,5),Yt("webnn",e,5),Yt("cpu",e,10),Yt("wasm",e,10)}Object.defineProperty(be.versions,"web",{value:G_,enumerable:!0});const V_="rtmpose-m-halpe26-256x192.onnx",F_="26f3a19e61304a600dfb82d1001d41d24343b89fc70a33ffc84657e0b0bf2ecf",H_=new URL("/SACHIZU-LAB1/assets/ort-wasm-simd-threaded.jsep-DC5y_g6C.wasm",import.meta.url).href,qe=192,He=256,j_=[123.675,116.28,103.53],K_=[58.395,57.12,57.375],Ip={0:0,11:5,12:6,13:7,14:8,15:9,16:10,23:11,24:12,25:13,26:14,27:15,28:16,29:24,30:25,31:20,32:21};function X_(e,t,r){const i=e.filter(f=>Number.isFinite(f.x)&&Number.isFinite(f.y)&&(f.visibility??1)>=.3);if(i.length<5)return null;const n=i.map(f=>f.x*t),a=i.map(f=>f.y*r),s=Math.min(...n),o=Math.max(...n),l=Math.min(...a),d=Math.max(...a);let p=Math.max(1,(o-s)*1.25),h=Math.max(1,(d-l)*1.25);return p/h>qe/He?h=p*He/qe:p=h*qe/He,{cx:(s+o)/2,cy:(l+d)/2,scale:p/qe}}function Z_(e,t,r,i,n){const s=e.length/26,o=t.length/26,l=[];for(let d=0;d<26;d++){let p=0,h=0;for(let f=1;f<s;f++)e[d*s+f]>e[d*s+p]&&(p=f);for(let f=1;f<o;f++)t[d*o+f]>t[d*o+h]&&(h=f);l.push({x:(r.cx+(p/2-qe/2)*r.scale)/i,y:(r.cy+(h/2-He/2)*r.scale)/n,visibility:Math.min(e[d*s+p],t[d*o+h])})}return Array.from({length:33},(d,p)=>p in Ip?{...l[Ip[p]]}:{...l[0],visibility:0})}let Gn=null;function Lm(e,t){return Gn??=Y_(e,t).catch(r=>{throw Gn=null,r}),Gn}async function Y_(e,t){const r=await uy(`/SACHIZU-LAB1/models/rtmpose/${V_}`,e,h=>t(h.replace("姿勢モデル","高精度の骨格モデル")));if(Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",r)),h=>h.toString(16).padStart(2,"0")).join("")!==F_)throw new Error("高精度の骨格モデルのファイルが正しくありません。");t("高精度の骨格モデルを準備しています…"),be.wasm.wasmPaths={wasm:H_},be.wasm.numThreads=1;let n=null,a="wasm";const s=typeof navigator<"u"&&!!navigator.gpu;for(const h of s?["webgpu","wasm"]:["wasm"])try{n=await xa.create(r,{executionProviders:[h],graphOptimizationLevel:"all"}),a=h;break}catch{}if(!n)throw new Error("高精度の骨格モデルを開始できませんでした。");const o=n,l=document.createElement("canvas");l.width=qe,l.height=He;const d=l.getContext("2d",{willReadFrequently:!0});if(!d)throw new Error("映像処理を開始できません。");const p=new Float32Array(3*qe*He);return{backend:a,async refine(h,f){const g=h.width,m=h.height,b=X_(f,g,m);if(!b)return null;const v=b.cx-qe/2*b.scale,$=b.cy-He/2*b.scale,w=Math.max(0,v),S=Math.max(0,$),x=Math.min(g,v+qe*b.scale),I=Math.min(m,$+He*b.scale);d.clearRect(0,0,qe,He),x>w&&I>S&&d.drawImage(h,w,S,x-w,I-S,(w-v)/b.scale,(S-$)/b.scale,(x-w)/b.scale,(I-S)/b.scale);const C=d.getImageData(0,0,qe,He).data,z=qe*He;for(let D=0;D<z;D++)for(let L=0;L<3;L++)p[L*z+D]=(C[4*D+L]-j_[L])/K_[L];const k=await o.run({input:new rt("float32",p,[1,3,He,qe])});return Z_(k.simcc_x.data,k.simcc_y.data,b,g,m)}}}const xe=1e-9,Ep=.2,Q_=.1,lt=.2,Cp=.1,ei=1.5,zp=.03,J_=1,Xt=.06,Vn=.15,Ap=.05,eb=.08,ti=3,tb=.06,rb=6,ib=.25,ma=2.5,Fn=.03,Mp=1.2,nb=.1,Op=2.5,ab=4.5,sb=4.5,ob=2.5,ub=[11,12,23,24,25,26,27,28],lb=.012,db=.02,Rp=.05,pb=.015,cb=.5,Np=.01,hb=(e,t)=>ub.every(r=>!e[r]||e[r].x>t[0]+Np*(t[1]-t[0])/.36&&e[r].x<t[1]-Np*(t[1]-t[0])/.36),fb=15;function Bp(e,t){e.push(t),e.length>fb&&e.shift()}function Dp(e){if(!e.length)return null;const t=[...e].sort((r,i)=>r-i);return t[t.length>>1]}function Ue(e){const t=e.reduce((n,a)=>n+a.t,0)/e.length,r=e.reduce((n,a)=>n+a.x,0)/e.length,i=e.reduce((n,a)=>n+(a.t-t)**2,0);return{mt:t,mx:r,slope:i>0?e.reduce((n,a)=>n+(a.t-t)*(a.x-r),0)/i:0}}function _r(e,t,r,i,n=.08){return e.filter(a=>Math.abs(a.x-t)<r&&(i===null||Math.abs(a.y-i)<n)).sort((a,s)=>Math.abs(a.x-t)-Math.abs(s.x-t))}const Hn=(e,t)=>Math.abs(e.x-t.x)<lb&&Math.abs(e.y-t.y)<db,ri=(e,t)=>e.length>1&&Math.abs(e[1].x-t)-Math.abs(e[0].x-t)<.03,mb=.03,gb=1/50,Pp=.035,Up=.08,Lp=12,yb=.1,_b=.5;function qp(e,t,r,i,n=.08){return e.filter(a=>Math.abs(a.x-t)<r&&(i===null||Math.abs(a.y-i)<n)).sort((a,s)=>Math.hypot(a.x-t,i===null?0:a.y-i)-Math.hypot(s.x-t,i===null?0:s.y-i))}const Wp=(e,t,r)=>{const i=e.slice(1).find(n=>r===null||Math.abs(n.y-r)<mb);return!!i&&Math.abs(i.x-t)-Math.abs(e[0].x-t)<.03};class bb{x;y=null;pts=null;velocity=0;history=[];acquisition=null;provisional=[];resumption=null;challenger=null;running=!1;behindStart=!1;backfill=[];watchTracks=[];intervals=[];watchIntervals=[];lastPts=null;lastWatchPts=null;lastInterval=1/120;publishedFrom=null;retraction=null;rivalSeen=!1;nearer=[];finishX;seed;direction;start;sprintSpeed;fromBlocks;constructor(t,r=0,i="standing",n=0,a=!1){this.fromBlocks=a,this.seed=t,this.direction=Math.sign(r),this.finishX=t+r,this.start=this.direction&&i==="flying"?"flying":"standing",this.sprintSpeed=Math.max(lt,n),this.x=this.flyingSeed()}frameInterval(){return Dp(this.intervals)??this.lastInterval}watchInterval(){return Dp(this.watchIntervals)??2*this.frameInterval()}gapLimit(t=this.frameInterval()){return Math.max(.05,Op*t)}get sparse(){return this.frameInterval()>gb}trackHeight(){return this.sparse?Pp:Up}frameRadius(){return Math.min(Xt,zp+J_*Math.max(0,this.frameInterval()-1/120))}shortGap(){return Math.max(Cp,Op*this.frameInterval())}decisionWindow(t=this.frameInterval()){return Math.max(nb,sb*t)}minSpan(t=this.frameInterval()){return Math.max(tb,ob*t)}flyingSeed(){return this.start==="flying"?Math.max(.02,Math.min(.98,this.seed-this.direction*eb)):this.seed}searchAgain(){this.x=this.flyingSeed(),this.y=null,this.pts=null,this.velocity=0,this.history=[],this.provisional=[],this.watchTracks=[],this.resumption=null,this.running=!1,this.behindStart=!1,this.rivalSeen=!1,this.nearer=[]}expected(t){if(this.pts===null&&this.start==="flying"){const r=this.leadCentre(this.provisional,t);if(r!==null)return r}return this.x+this.velocity*Math.max(0,Math.min(ei,this.pts===null?0:t-this.pts))}leadCentre(t,r){const n=t.filter(s=>{const o=s.points.filter(l=>s.pts-l.t<=this.decisionWindow()+xe);return o.length>=ti&&o.at(-1).t-o[0].t>=this.minSpan()-xe&&Ue(o).slope*this.direction>=this.sprintSpeed}).sort((s,o)=>(o.x-s.x)*this.direction)[0];if(!n||r-n.pts>this.shortGap()+xe)return null;const a=n.points.filter(s=>n.pts-s.t<=this.decisionWindow()+xe);return Math.max(0,Math.min(1,n.x+Ue(a).slope*(r-n.pts)))}watchCentre(t){return this.start!=="flying"||this.pts===null||(this.x-this.finishX)*this.direction>=0?null:this.flyingSeed()}get following(){return this.pts!==null}get contested(){return this.rivalSeen}get watching(){return this.watchTracks.some(t=>t.points.length<2||Ue(t.points).slope*this.direction>=lt)}get idle(){return this.start==="flying"&&this.pts===null&&this.provisional.every(t=>{const r=t.points.filter(i=>t.pts-i.t<=this.decisionWindow()+xe);return r.length>=4&&r.at(-1).t-r[0].t>=.06-xe&&Math.abs(Ue(r).slope)<lt/2})}takeBackfill(){const t=this.backfill;return this.backfill=[],t}takeRetraction(){const t=this.retraction;return this.retraction=null,t}choose(t,r,i=[0,1],n){if(!Number.isFinite(r))return this.acquisition=null,this.provisional=[],this.resumption=null,[];if(this.pts!==null&&r<=this.pts)return[];this.lastPts!==null&&r>this.lastPts&&(this.lastInterval=r-this.lastPts,this.idle||Bp(this.intervals,this.lastInterval)),this.lastPts=r,n&&this.pts!==null&&(this.lastWatchPts!==null&&r>this.lastWatchPts&&Bp(this.watchIntervals,r-this.lastWatchPts),this.lastWatchPts=r);const a=(h,f)=>h.filter(g=>[23,24].every(m=>g[m]&&Number.isFinite(g[m].x)&&Number.isFinite(g[m].y)&&g[m].x>0&&g[m].x<1&&g[m].y>0&&g[m].y<1&&(g[m].visibility??0)>=.3)&&(this.start!=="flying"||hb(g,f))).map(g=>({p:g,x:(g[23].x+g[24].x)/2,y:(g[23].y+g[24].y)/2})),s=a(t,i),o=this.start==="flying"&&this.pts!==null,l=this.follow(s,r);if(!o||this.pts===null)return l;const d=s.find(h=>h.p===l),p=[];for(const h of[...s,...n?a(n.poses,n.view):[]])h!==d&&!(d&&Hn(h,d))&&!p.some(f=>Hn(f,h))&&p.push(h);return this.watch(p,r)??l}watch(t,r){if((this.x-this.finishX)*this.direction>=0)return this.watchTracks=[],null;const{next:i,confirmed:n}=this.advance(this.watchTracks,t,r,this.watchInterval());this.watchTracks=i;const a=this.y;if(a!==null&&i.some(o=>o.points.length>=ti&&o.y-a>=Fn&&Ue(o.points).slope*this.direction>=this.sprintSpeed)&&(this.rivalSeen=!0),a!==null){const o=Math.max(this.sprintSpeed,Mp*Math.abs(this.velocity)),l=Lp*this.sprintSpeed/ma,d=t.filter(p=>p.y-a>=Fn).map(p=>({t:r,x:p.x,y:p.y}));this.nearer=this.nearer.filter(p=>r-p.t<=_b),d.some(p=>this.nearer.some(h=>p.t-h.t>=yb-xe&&Math.abs(p.y-h.y)<Pp&&(p.x-h.x)*this.direction>=o*(p.t-h.t)&&(p.x-h.x)*this.direction<=l*(p.t-h.t)))&&(this.rivalSeen=!0),this.nearer.push(...d)}if(!n||this.y===null)return null;const s=Ue(n.points).slope*this.direction;return n.y-this.y>=Fn&&s>=Mp*Math.abs(this.velocity)?(this.retraction=this.publishedFrom,this.adopt(n,r)):null}follow(t,r){if(this.start==="flying"&&this.pts!==null){const o=r-this.pts,l=(this.x-this.seed)*this.direction<0;(o-ei>xe||l&&o-this.shortGap()>xe)&&this.searchAgain()}if(this.pts===null)return this.start==="flying"?this.acquireFlying(t,r):this.acquire(t,r);const i=this.challenge(t,r);if(i)return i;const n=r-this.pts;if(n-ei>xe)return this.start==="flying"||this.running?[]:(this.searchAgain(),this.acquire(t,r));if(n-this.shortGap()>xe||this.resumption)return this.resume(t,r);const a=this.reference(r)??this.expected(r);if(this.start==="flying"){const o=qp(t,a,this.frameRadius(),this.y,this.trackHeight());return!o.length||Wp(o,a,this.y)?[]:this.accept(o[0],r)}const s=_r(t,a,this.frameRadius(),this.y);return!s.length||ri(s,a)?[]:this.accept(s[0],r)}reference(t){if(this.fromBlocks||Math.abs(this.velocity)<lt)return null;const r=this.history.filter(n=>t-n.t>=Cp-xe&&t-n.t<=.4+xe);if(r.length<4||r.at(-1).t-r[0].t<.08)return null;const i=Ue(r);return i.mx+i.slope*(t-i.mt)}accept(t,r){for(this.x=t.x,this.y=t.y,this.pts=r,this.resumption=null,(t.x-this.seed)*this.direction<=0&&(this.behindStart=!0),this.history.push({t:r,x:t.x});this.history.length&&r-this.history[0].t>.6;)this.history.shift();return this.updateVelocity(r),t.p}updateVelocity(t){const r=this.history.filter(i=>t-i.t<=Ep+xe);r.length<3||r.at(-1).t-r[0].t<Q_-xe||(this.velocity=Math.max(-1,Math.min(1,Ue(r).slope)),this.behindStart&&this.velocity*this.direction>=lt&&(this.running=!0))}challenge(t,r){if(!this.direction||this.start==="flying"||this.running||this.velocity*this.direction>=Ap)return this.challenger=null,null;const i=Math.abs(this.expected(r)-this.seed),n=_r(t,this.seed,Math.min(Vn,i-.03),null)[0],a=this.challenger;if(!n)return this.challenger=null,null;const o=a&&r-a.pts-this.gapLimit()<=xe&&Math.abs(n.x-a.x)<Xt&&Math.abs(n.y-a.y)<.08?a.count+1:1;return o<3?(this.challenger={x:n.x,y:n.y,pts:r,count:o},null):(this.x=n.x,this.y=n.y,this.pts=r,this.velocity=0,this.history=[{t:r,x:n.x}],this.resumption=null,this.challenger=null,this.behindStart=(n.x-this.seed)*this.direction<=0,n.p)}resume(t,r){const i=this.expected(r),n=r-this.pts,a=Xt+.5*Math.abs(this.velocity)*Math.min(1,n),s=Math.abs(this.velocity)>=lt||this.velocity*this.direction>=Ap,o=_r(t,i,a,this.y,this.start==="flying"?this.trackHeight():Up).filter(m=>!s||(m.x-this.x)*Math.sign(this.velocity)>=.4*Math.abs(this.velocity)*Math.min(ei,n));if(!o.length||ri(o,i))return this.resumption=null,[];const l=o[0],d=this.resumption,h=d&&r-d.pts-this.gapLimit()<=xe&&Math.abs(l.x-(d.x+this.velocity*(r-d.pts)))<Xt&&Math.abs(l.y-d.y)<.08?{...d,x:l.x,y:l.y,pts:r,count:d.count+1}:{startX:l.x,startPts:r,x:l.x,y:l.y,pts:r,count:1};this.resumption=h;const f=h.pts-h.startPts;if(h.count<3||f-.04<-xe)return[];const g=(h.x-h.startX)/f;return s&&(Math.sign(g)!==Math.sign(this.velocity)||Math.abs(g)<.4*Math.abs(this.velocity))?(this.resumption=null,[]):(this.history=[],this.accept(l,r))}acquire(t,r){const i=this.acquisition;if(i&&r>i.pts&&r-i.pts-this.gapLimit()<=xe){const s=i.points.length>1?Ue(i.points).slope:0,o=i.x+s*(r-i.pts),l=_r(t,o,Xt,i.y);if(ri(l,o))return this.acquisition=null,[];if(l.length){const d=l[0],p=[...i.points,{t:r,x:d.x}];return p.length<3?(this.acquisition={x:d.x,y:d.y,pts:r,points:p},[]):(this.x=d.x,this.y=d.y,this.pts=r,this.acquisition=null,this.behindStart=p.some(h=>(h.x-this.seed)*this.direction<=0),this.history=p,this.updateVelocity(r),d.p)}}this.acquisition=null;const n=_r(t,this.x,Vn,null);if(!n.length||ri(n,this.x))return[];const a=n[0];return this.acquisition={x:a.x,y:a.y,pts:r,points:[{t:r,x:a.x}]},[]}acquireFlying(t,r){const{next:i,confirmed:n}=this.advance(this.provisional,t,r);return this.provisional=i,n?this.adopt(n,r):[]}advance(t,r,i,n=this.frameInterval()){const a=t.filter(m=>i>m.pts&&i-m.pts-(m.points.length>=ti?Math.max(.05,ab*n):this.gapLimit(n))<=xe),s=[],o=new Set,l=new Set;for(const m of a){const b=m.points.length>1?Ue(m.points).slope:0,v=m.x+b*(i-m.pts),$=m.points.length<2?Lp*this.sprintSpeed/ma*Math.max(0,i-m.pts-.05):0,w=qp(r.filter(x=>!o.has(x)),v,Xt+$,m.y,this.trackHeight());if(!w.length||Wp(w,v,m.y)){for(const x of w)l.add(x);s.push(m);continue}const S=w[0];o.add(S),s.push({x:S.x,y:S.y,pts:i,points:[...m.points.filter(x=>i-x.t<=.4),{t:i,x:S.x,p:S.p}]})}const d=[];for(const m of r)o.has(m)||l.has(m)||(m.x-this.seed)*this.direction>Vn||[...o,...d].some(b=>Hn(m,b))||(d.push(m),s.push({x:m.x,y:m.y,pts:i,points:[{t:i,x:m.x,p:m.p}]}));s.sort((m,b)=>b.points.length-m.points.length||(b.x-m.x)*this.direction);const p=s.slice(0,rb),h=m=>m.points.filter(b=>i-b.t<=this.decisionWindow(n)+xe),f=p.filter(m=>{if(m.pts!==i)return!1;const b=h(m),v=b.length?b.at(-1).t-b[0].t:0;if(b.length<ti||v-this.minSpan(n)<-xe)return!1;const $=Ue(b).slope*this.direction,w=(b.at(-1).x-b[0].x)*this.direction,S=m.points,x=S.at(-1).t-S[0].t,I=(S.at(-1).x-S[0].x)*this.direction;if(!($>=lt&&w>=.7*lt*v&&I>=.5*lt*x))return!1;const C=.1*Math.max(0,Ue(S).slope*this.direction);return(S[0].x-this.seed)*this.direction>C+xe?!1:this.sprintSpeed<=lt||x-ib>-xe&&Ue(S).slope*this.direction>=this.sprintSpeed}),g=f[0]??null;return g&&f.length>1&&Math.abs(f[1].x-g.x)<zp?{next:p,confirmed:null}:{next:p,confirmed:g}}adopt(t,r){const i=wb(t.points);this.x=t.x,this.y=t.y,this.pts=r,this.provisional=[],this.watchTracks=[],this.rivalSeen=!1,this.nearer=[];const n=t.points.filter(a=>r-a.t<=Math.max(Ep,this.decisionWindow())+xe);return this.velocity=this.sparse&&n.length>=2?Math.max(-1,Math.min(1,Ue(n).slope)):0,this.resumption=null,this.behindStart=!0,this.history=i.map(({t:a,x:s})=>({t:a,x:s})),this.updateVelocity(r),this.running=!0,this.backfill=i.slice(0,-1).map(a=>({pts:a.t,pose:a.p})),this.publishedFrom=i[0].t,t.points.at(-1).p}}function wb(e){const t=e.at(-1).t;let r=e.findIndex(n=>t-n.t<=Rp+xe);r=Math.min(r,Math.max(0,e.length-3));const i=Ue(e.slice(r));for(;r>0;){const n=e[r-1],a=Math.max(0,t-Rp-n.t);if(Math.abs(i.mx+i.slope*(n.t-i.mt)-n.x)>pb+.5*cb*a**2)break;r--}return e.slice(r)}const ga=4;class $b{constructor(t,r,i,n,a,s,o,l=!1,d=!1){this.source=t,this.model=r,this.watcher=i,this.liveWatch=l,this.fromBlocks=d,this.crop=document.createElement("canvas");const p=this.crop.getContext("2d");if(!p)throw new Error("映像処理を開始できません。");this.cc=p;const h=a===void 0||!(o>0)?0:ma*Math.abs(a-n)/o;this.tracker=new bb(n,a===void 0?0:a-n,s,h,d)}source;model;watcher;liveWatch;fromBlocks;samples=[];tracker;sampleAt=new Map;crop;cc;top=0;bottom=1;analysed=0;get idle(){return this.tracker.idle}detect(t,r,i,n,a){return this.crop.width=512,this.crop.height=Math.round(512*r.h*a/(r.w*n)),this.cc.drawImage(this.source,r.x*n,r.y*a,r.w*n,r.h*a,0,0,this.crop.width,this.crop.height),t.estimate(this.crop,i.frameIndex,i.pts).landmarks.map(s=>s.map(o=>({...o,x:r.x+o.x*r.w,y:r.y+o.y*r.h})))}async process(t,r,i){this.analysed++;const n=this.tracker,a=this.samples,s={x:Math.max(0,Math.min(.64,n.expected(i.pts)-.18)),y:this.top,w:.36,h:this.bottom-this.top},o=this.detect(this.model,s,i,t,r),l=n.watchCentre(i.pts),d=l===null?null:{x:Math.max(0,Math.min(.64,l-.18)),y:0,w:.36,h:1};let p;d&&Math.abs(d.x-s.x)>.01&&(this.analysed%2===0||this.liveWatch&&n.watching)&&(p={poses:this.detect(await this.watcher(),d,i,t,r),view:[d.x,d.x+d.w]});const h=n.choose(o,i.pts,[s.x,s.x+s.w],p),f=n.takeRetraction();if(f!==null)for(let m=a.length-1;m>=0&&a[m].pts>=f;m--)a[m]=Fi([],a[m].frame,a[m].pts,t/r);const g=n.takeBackfill();for(const{pts:m,pose:b}of g){const v=this.sampleAt.get(m);v!==void 0&&(a[v]=Fi(b,a[v].frame,m,t/r))}if(g.length&&(this.top=0,this.bottom=1),h.length&&!this.fromBlocks){const m=h.filter($=>($.visibility??0)>=.3).map($=>$.y),b=Math.max(0,Math.min(...m)-.12),v=Math.min(1,Math.max(...m)+.12);v-b>.2&&(this.top=.8*this.top+.2*b,this.bottom=.8*this.bottom+.2*v)}return this.sampleAt.set(i.pts,a.length),a.push(Fi(h,i.frameIndex,i.pts,t/r)),h}}const qm=2;class _i extends Error{constructor(t,r){super(`動画の読み出しに失敗しました（${t+1}コマ目：${r}）。もう一度お試しください。`),this.frame=t,this.reason=r}frame;reason}async function mi(e,t,r){try{return await dt(e,t)}catch(i){throw t.aborted||i instanceof DOMException&&i.name==="AbortError"?i:new _i(r,i instanceof Error?i.message:String(i))}}const Gp=120,vb=30,Wm=240;async function Gm(e,t,r,i,n,a="standing",s=10,o={}){const l=()=>{if(r.aborted)throw new DOMException("中止","AbortError")};if(l(),!xr.isAvailable())throw new Error("このブラウザではフレーム解析ができません。対応する最新のブラウザでお試しください。");if(e.size>150*1024*1024)throw new Error("150MB以内のMP4 / MOVを選んでください。");i(0,"元動画のフレーム時刻を確認しています。");const d=await dt(ba(e),r);if(l(),!d.frames.length||d.frames.length>3600||d.frames.at(-1).pts-d.frames[0].pts>30)throw new Error("1走分・30秒以内・3600フレーム以内の動画を選んでください。");const p=Jp(d.videoTrack.matrix);let h=new xr(e,d.videoTrack,d.frames,d.rawSamples,d.descriptionBuffer);const f=new Yn("full",void 0,"CPU",ga);let g=o.watcher??null;const m=async()=>(g||(g=new Yn("full",void 0,"CPU",ga,"IMAGE"),await dt(g.initialize(r),r),l()),g),b=document.createElement("canvas"),v=b.getContext("2d");if(!v)throw new Error("映像処理を開始できません。");const $=new $b(b,f,m,t,n,a,s,!1,o.fromBlocks),w=()=>h.dispose();r.addEventListener("abort",w,{once:!0});let S=performance.now(),x=-1/0;const I=d.frames.at(-1).pts-d.frames[0].pts,C=I>0?(d.frames.length-1)/I:Gp,z=Math.max(1,Math.round(C/(o.maxFps??Gp))),k=Math.max(z,Math.round(C/vb));let D=0,L=-1;try{await dt(f.initialize(r,j=>i(0,j)),r),l();for(let j=0;;j++)try{for(const O of d.frames){if(O.frameIndex<=L||O.frameIndex<D){await mi(h.skipExactFrame(O.frameIndex),r,O.frameIndex),l();continue}const G=await mi(h.decodeExactFrame(O.frameIndex).then(H=>(r.aborted&&h.dispose(),H)),r,O.frameIndex);if(l(),D=O.frameIndex+z,G.status!=="SUCCESS"||G.actualDecodedFrameIndex!==O.frameIndex)throw new Error("動画フレームを正しく読み出せません。");const M=G.bitmap,B=p%180?M.height:M.width,V=p%180?M.width:M.height;(b.width!==B||b.height!==V)&&(b.width=B,b.height=V),v.setTransform(1,0,0,1,0,0),v.clearRect(0,0,B,V),v.translate(B/2,V/2),v.rotate(p*Math.PI/180),v.drawImage(M,-M.width/2,-M.height/2),v.setTransform(1,0,0,1,0,0);const Y=await $.process(B,V,O);o.onSelected?.(O,Y,B,V),o.afterSelected&&(await dt(o.afterSelected(b),r),l()),L=O.frameIndex,$.idle&&(D=O.frameIndex+k);const q=performance.now();q-x>100&&(i((O.frameIndex+1)/d.frames.length,"選手と脚の動きを解析しています。"),x=q),q-S>32&&(await new Promise(H=>setTimeout(H,0)),S=performance.now(),l())}break}catch(O){if(!(O instanceof _i)||r.aborted||j>=qm)throw O;i((L+1)/d.frames.length,"動画の読み出しをやり直しています。"),h.dispose(),h=new xr(e,d.videoTrack,d.frames,d.rawSamples,d.descriptionBuffer)}return i(1,"解析が終わりました。"),$.samples}finally{r.removeEventListener("abort",w),h.dispose(),f.dispose(),g!==o.watcher&&g?.dispose(),b.width=0}}async function ww(e,t,r,i){const n=[];let a=0,s=0,o=null;try{o=await dt(Lm(r,l=>i(0,l)),r)}catch(l){if(r.aborted)throw l;o=null}return await Gm(e,t,r,i,void 0,"standing",10,{maxFps:Wm,fromBlocks:!0,onSelected:(l,d,p,h)=>{a=p,s=h,n.push({frame:l.frameIndex,pts:l.pts,pose:d.length===33?d.map(f=>({x:f.x,y:f.y,visibility:f.visibility})):null})},afterSelected:o?async l=>{const d=n.at(-1);d?.pose&&(d.refined=await o.refine(l,d.pose))}:void 0}),{frames:n,width:a,height:s,refiner:o?.backend??null}}const xb=1280;function jn(e,t,r){return new Promise((i,n)=>{const a=()=>{clearTimeout(s),e.removeEventListener(t,a),i()},s=setTimeout(()=>{e.removeEventListener(t,a),n(new Error(`${t} timed out`))},r);e.addEventListener(t,a)})}async function Sb(e,t=15e3){const r=document.createElement("video");r.muted=!0,r.playsInline=!0,r.preload="auto",r.style.cssText="position:fixed;left:-10000px;top:0;width:320px;height:180px;pointer-events:none",document.body.appendChild(r);try{const i=jn(r,"loadedmetadata",t);if(r.src=e,r.load(),await i,r.readyState<2){const o=jn(r,"loadeddata",t);await r.play().catch(()=>{}),r.pause(),r.readyState<2&&await o}if(r.currentTime>0){const o=jn(r,"seeked",t);r.currentTime=0,await o}if(await new Promise(o=>requestAnimationFrame(()=>o())),!r.videoWidth||!r.videoHeight)return null;const n=Math.min(1,xb/r.videoWidth),a=document.createElement("canvas");a.width=Math.round(r.videoWidth*n),a.height=Math.round(r.videoHeight*n);const s=a.getContext("2d");return s?(s.drawImage(r,0,0,a.width,a.height),{image:a.toDataURL("image/jpeg",.85),width:r.videoWidth,height:r.videoHeight}):null}catch{return null}finally{r.pause(),r.removeAttribute("src"),r.load(),r.remove()}}function $w(e){const[t,r]=Ee.useState(null);return Ee.useEffect(()=>{let i=!1;return r(null),e&&Sb(e).then(n=>{i||r(n)}),()=>{i=!0}},[e]),t}function kb({video:e,url:t,disabled:r=!1}){const[i,n]=Ee.useState(!1),[a,s]=Ee.useState(0),[o,l]=Ee.useState(0);Ee.useEffect(()=>{const f=e.current;if(!f)return;const g=()=>{n(!f.paused&&!f.ended),s(f.currentTime),l(Number.isFinite(f.duration)?f.duration:0)},m=["play","pause","ended","timeupdate","seeked","loadedmetadata","durationchange","emptied"];for(const b of m)f.addEventListener(b,g);return g(),()=>{for(const b of m)f.removeEventListener(b,g)}},[e,t]);async function d(f){if(f.readyState>=2)return;const g=f.muted;f.muted=!0,await f.play().catch(()=>{}),f.pause(),f.muted=g}async function p(){const f=e.current;f&&(f.paused||f.ended?(f.ended&&(f.currentTime=0),await f.play().catch(()=>{})):f.pause())}async function h(f){const g=e.current;g&&(await d(g),g.currentTime=f,s(f))}return pe.jsxs("div",{className:"sprint10-playerbar",children:[pe.jsx("button",{type:"button","aria-label":i?"一時停止":"再生",disabled:r||!t,onClick:()=>{p()},children:i?"❚❚":"▶"}),pe.jsx("input",{type:"range","aria-label":"動画の位置",min:0,max:o||0,step:"any",value:Math.min(a,o||0),disabled:r||!o,onChange:f=>{h(Number(f.target.value))}}),pe.jsxs("span",{children:[a.toFixed(2)," / ",o.toFixed(2),"秒"]})]})}const Vm=[31,32],je=(e,t=.5)=>!!e&&Number.isFinite(e.x)&&Number.isFinite(e.y)&&(e.visibility??1)>=t,Jt=e=>{const t=[...e].sort((r,i)=>r-i);return t.length?t[t.length>>1]:NaN},er=(e,t)=>{const r=[...e].sort((i,n)=>i-n);return r.length?r[Math.min(r.length-1,Math.floor(t*r.length))]:NaN},Tb=.02,Fm=.05,Hm=.1,jm=.03,Ib=.03,Eb=.06,Cb=.4,zb=.03,Ab=.05;function Mb(e,t,r){return er(e.flatMap(i=>[[23,27],[24,28]].flatMap(([n,a])=>je(i.pose[n])&&je(i.pose[a])?[Math.hypot((i.pose[n].x-i.pose[a].x)*t,(i.pose[n].y-i.pose[a].y)*r)]:[])),.9)}const Ob=(e,t,r)=>e.flatMap(i=>Vm.filter(n=>je(i.pose[n])).map(n=>({t:i.pts,frame:i.frame,x:i.pose[n].x*t,y:i.pose[n].y*r}))),Rb=(e,t)=>e.filter(r=>e.some(i=>i!==r&&Math.abs(i.t-r.t)<=Tb&&Math.abs(i.t-r.t)>0&&Math.hypot(i.x-r.x,i.y-r.y)<Fm*t));function Nb(e,t){const r=[];for(const i of e){const n=r.find(a=>Math.abs(a.x-i.x)<Hm*t&&i.t-a.to<=jm);n?(n.toes.push(i),n.to=Math.max(n.to,i.t),n.x=Jt(n.toes.map(a=>a.x))):r.push({x:i.x,y:i.y,from:i.t,to:i.t,toes:[i]})}for(const i of r)i.y=er(i.toes.map(n=>n.y),.8);return r.filter(i=>i.to-i.from>=Ib)}function Bb(e,t){const r=[];for(const i of[...e].sort((n,a)=>n.from-a.from)){const n=r.find(a=>Math.abs(a.x-i.x)<Hm*t);n?(n.toes.push(...i.toes),n.from=Math.min(n.from,i.from),n.to=Math.max(n.to,i.to),n.x=Jt(n.toes.map(a=>a.x)),n.y=er(n.toes.map(a=>a.y),.8)):r.push({...i,toes:[...i.toes]})}return r}function Db(e,t,r,i=1/0){const n=[];for(const a of Bb(e,t).filter(s=>s.to-s.from>=Eb).sort((s,o)=>s.from-o.from)){const s=n.at(-1);if((!s||(a.x-s.x)*r>Cb*t)&&n.push(a),n.length===i)break}return n}function Pb(e,t,r,i,n,a=-1/0){const s=r.filter(h=>Math.abs(h.x-e.x)<Fm*2*i&&h.t>=e.from-.1&&h.t<=e.to+.1).sort((h,f)=>h.t-f.t),o=s.find(h=>e.y-h.y<zb*i)??null,l=[...s].reverse().find(h=>e.y-h.y<Ab*i)??null,d=l===null||n-l.t<.02,p=o===null||o.t-a<.02;return{index:t,x:e.x,groundY:e.y,touchdown:p?null:o.t,touchdownFrame:p?null:o.frame,toeOff:d?null:l.t,toeOffFrame:d?null:l.frame}}const Ub=.45,ya=.38,bi=e=>e*180/Math.PI;function Km(e,t,r){const i=Vm.map(n=>je(e[n],.3)?Math.abs(e[n].x-t)*r:1/0);return i[0]===1/0&&i[1]===1/0?null:i[0]<=i[1]?0:1}function Xm(e,t,r,i,n){if(![11,12,23,24].every(d=>je(e[d],.3)))return null;const a=(e[11].x+e[12].x)/2*t,s=(e[11].y+e[12].y)/2*r,o=(e[23].x+e[24].x)/2*t,l=(e[23].y+e[24].y)/2*r;return Math.hypot(a-o,s-l)<Ub*n?null:bi(Math.atan2((a-o)*i,l-s))}function Lb(e,t,r,i,n){const a=e[25+t],s=e[27+t];return!je(a,.3)||!je(s,.3)?null:bi(Math.atan2((a.x-s.x)*r*n,(s.y-a.y)*i))}function vw(e,t,r,i,n,a){const s=e[23+t],o=e[25+t];if(!je(s,.3)||!je(o,.3))return null;const l=(o.x-s.x)*r*n,d=(o.y-s.y)*i;return Math.hypot(l,d)<ya*a?null:bi(Math.atan2(l,d))}function Vp(e,t,r,i,n){const[a,s,o]=[e[23+t],e[25+t],e[27+t]];if(![a,s,o].every(h=>je(h,.3)))return null;const l={x:(a.x-s.x)*r,y:(a.y-s.y)*i},d={x:(o.x-s.x)*r,y:(o.y-s.y)*i};if(Math.hypot(l.x,l.y)<ya*n||Math.hypot(d.x,d.y)<ya*n)return null;const p=(l.x*d.x+l.y*d.y)/(Math.hypot(l.x,l.y)*Math.hypot(d.x,d.y));return bi(Math.acos(Math.max(-1,Math.min(1,p))))}const qb="crouch-start-v2-experimental",Wb=5,wi=e=>e.refined??e.pose,Fp=.06,Hp=.15,Gb=.05,Vb=.2,Fb=.1,Hb=.5,jb=.3,Kb=.3,Xb=2,Zb=.8,jp=.2,Yb=.1,Qb=.1;function xw(e,t){const r={version:qb,reason:null,direction:0,set:null,blockClearance:null,blocks:null,contacts:[],steps:[],firstFlight:null,notes:[]},i=R=>({...r,reason:R}),{width:n,height:a}=t,s=e.filter(R=>R.pose);if(s.length<20)return i("選手を十分に捉えられませんでした。真横から、全身が映るように撮影してください。");const o=R=>({x:R.x*n,y:R.y*a}),l=R=>je(R[23],.3)&&je(R[24],.3)?o({x:(R[23].x+R[24].x)/2,y:(R[23].y+R[24].y)/2}):null,d=Mb(s,n,a);if(!(d>0))return i("脚を十分に捉えられませんでした。");const p=s.flatMap(R=>{const se=l(R.pose);return se?[{t:R.pts,frame:R.frame,...se}]:[]}),h=Math.sign(p.at(-1).x-p[0].x);if(!h)return i("走る向きを確認できませんでした。");r.direction=h;const f=Jb(p,d,h),g=p.slice(f),m=Jt(g.slice(0,Math.max(3,Math.round((f?g.length:p.length)*.05))).map(R=>R.x)),b=g.findIndex((R,se)=>(R.x-m)*h>Fp*d&&g.slice(se,se+10).every(Ie=>(Ie.x-m)*h>Fp*d));if(b<0)return i("走り出しを確認できませんでした。");const v=g[b].t,$=f?g[0].t:-1/0;if(v-g[0].t<Fb)return i("スタートの構えを確認できませんでした。構えから映っている動画を使ってください。");const w=Ob(s,n,a),S=Rb(w,d),x=Nb(S,d),I=S.filter(R=>R.t>=$&&R.t<v);if(I.length<4)return i("スタートの構え（ブロック上の足）を確認できませんでした。構えから映っている動画を使ってください。");const C=R=>R*h,z=[er(I.map(R=>C(R.x)),.05)-Hp*d,er(I.map(R=>C(R.x)),.95)+Hp*d],k=R=>C(R.x)>=z[0]&&C(R.x)<=z[1],D=S.filter(R=>R.t>=v&&k(R)).sort((R,se)=>R.t-se.t),L=D.filter(R=>R.t<=v+.15),j=L.length?er(L.map(R=>C(R.x)),.75):z[1];let O=v;for(const R of w.filter(se=>se.t>=v).sort((se,Ie)=>se.t-Ie.t)){const se=C(R.x)-j;if(!(se<-.12*d||se>Qb*d)){if(R.t-O>Gb)break;O=R.t}}const G=D.filter(R=>R.t>=O-.05),M=G.length?Jt(G.map(R=>R.x)):h>0?z[1]/h:z[0]/h,B=I.filter(R=>(M-R.x)*h>.15*d);r.blocks={front:M/n,rear:B.length?Jt(B.map(R=>R.x))/n:null};const V={x:M},Y=Db(x.filter(R=>R.from>O-jm&&C(R.x)>z[1]+.2*d),d,h,Wb),q=s.at(-1).pts;r.contacts=Y.map((R,se)=>Pb(R,se+1,w,d,q));const H=s.filter(R=>R.pts<v&&R.pts>=v-Vb),X=s.findIndex(R=>R.pts>=O),W=X<0?[]:s.slice(Math.max(0,X-2),X+3);r.set=H.length?Kp(H,V.x/n,n,a,h,d):null,r.blockClearance=W.length?Kp(W,V.x/n,n,a,h,d,s[X]):null;const J=r.contacts[0];r.firstFlight=J?.touchdown!=null?J.touchdown-O:null,r.steps=ew(r.contacts,e,n,a,h,d),r.contacts.length||r.notes.push("ブロックを離れた後の接地が映っていません。");const Q=r.contacts.filter(R=>R.toeOff===null).map(R=>R.index);return Q.length&&r.notes.push(`${Q.join("・")}歩目は離地が映っていないため、接地時間を出していません。`),r}function Jb(e,t,r){const i=o=>o.x*r;let n=-1;for(let o=0,l=0;o<e.length&&n<0;o++){l<o&&(l=o);for(let d=l;d<e.length&&e[d].t-e[o].t<=Zb;d++)if(i(e[d])-i(e[o])>=Xb*t){n=o;break}}if(n<0)return 0;let a=-1;for(let o=n;o>=0&&a<0;o--){const l=e.filter(p=>p.t<=e[o].t&&p.t>=e[o].t-jp),d=l.map(p=>p.x);l.length>=3&&l.at(-1).t-l[0].t>=jp/2&&Math.max(...d)-Math.min(...d)<Yb*t&&(a=e.indexOf(l[0]))}if(a<0)return 0;let s=0;for(let o=1,l=0;o<=a;o++){for(e[o].t-e[o-1].t>Hb&&(s=o);e[o].t-e[l].t>Kb;)l++;for(let d=l;d<o;d++)if(Math.abs(e[o].x-e[d].x)>jb*t){s=o+1;break}}return Math.min(s,a)}function ew(e,t,r,i,n,a){return e.map((s,o)=>{const l=e[o+1]??null,d=s.touchdown!==null&&s.toeOff!==null?s.toeOff-s.touchdown:null,p=l?.touchdown!=null&&s.toeOff!==null?l.touchdown-s.toeOff:null,h=l?.touchdown!=null&&s.touchdown!==null?l.touchdown-s.touchdown:null,f=s.touchdownFrame!==null?t.find(b=>b.frame===s.touchdownFrame):null,g=f?wi(f):null,m=g?Km(g,s.x/r,r):null;return{step:s.index,contactSeconds:d,flightSeconds:p,stepSeconds:h,pitch:h?1/h:null,shankAngle:g&&m!==null?Lb(g,m,r,i,n):null,trunkAngle:g?Xm(g,r,i,n,a):null,side:m}})}function Kp(e,t,r,i,n,a,s){const o=b=>{const v=wi(b),$=Km(v,t,r);return{side:$,trunk:Xm(v,r,i,n,a),front:$===null?null:Vp(v,$,r,i,a),rear:$===null?null:Vp(v,1-$,r,i,a)}},l=e.map(o),d=b=>{const v=l.flatMap($=>$[b]===null?[]:[$[b]]);return v.length*2>=e.length?Jt(v):null},p=d("trunk"),h=d("front"),f=d("rear"),g=b=>[[b.trunk,p],[b.front,h],[b.rear,f]].reduce((v,[$,w])=>w===null?v:$===null?1/0:v+Math.abs($-w),0),m=s??e[l.reduce((b,v,$)=>g(v)<g(l[b])?$:b,l.length-1)];return{frame:m.frame,pts:m.pts,trunkAngle:p,frontKnee:h,rearKnee:f,frontSide:o(m).side}}const Xp=e=>e!==null;function Sw(e){const t=[],r=(i,n,a,s)=>{if(!a)return;const o=a.frontSide,l=[a.trunkAngle===null?null:{kind:"trunk",label:"体幹",value:a.trunkAngle},a.frontKnee===null||o===null?null:{kind:"knee",side:o,label:"前膝",value:a.frontKnee},!s||a.rearKnee===null||o===null?null:{kind:"knee",side:1-o,label:"後膝",value:a.rearKnee}].filter(Xp);t.push({key:i,label:n,frame:a.frame,pts:a.pts,marks:l})};r("set","構え",e.set,!0),r("clearance","ブロックを離れる瞬間",e.blockClearance,!1);for(const i of e.steps){const n=e.contacts.find(s=>s.index===i.step);if(!n||n.touchdown===null||n.touchdownFrame===null)continue;const a=[i.shankAngle===null||i.side===null?null:{kind:"shank",side:i.side,label:"脛",value:i.shankAngle},i.trunkAngle===null?null:{kind:"trunk",label:"体幹",value:i.trunkAngle}].filter(Xp);t.push({key:`td${i.step}`,label:`${i.step}歩目の接地`,frame:n.touchdownFrame,pts:n.touchdown,marks:a})}return t}const Za=e=>`${e.label} ${Math.round(e.value)}°`,tw=e=>e.kind==="trunk"?"#ffb02e":e.kind==="shank"?"#3ad7ff":e.kind==="thigh"?"#7dff6b":e.label==="後膝"||e.label.startsWith("踏切")?"#b58cff":"#ff6fd8",Zm=e=>!!e&&Number.isFinite(e.x)&&Number.isFinite(e.y)&&(e.visibility??1)>=.3;function rw(e,t,r,i,n=.35){const a=e.filter(m=>Zm(m)).map(m=>({x:m.x*t,y:m.y*r}));if(!a.length)return{x:0,y:0,w:t,h:r};const s=Math.min(...a.map(m=>m.x)),o=Math.max(...a.map(m=>m.x)),l=Math.min(...a.map(m=>m.y)),d=Math.max(...a.map(m=>m.y));let p=(o-s)*(1+2*n),h=(d-l)*(1+2*n);p/h<i?p=h*i:h=p/i,p=Math.min(p,t,r*i),h=p/i;const f=Math.max(0,Math.min(t-p,(s+o)/2-p/2)),g=Math.max(0,Math.min(r-h,(l+d)/2-h/2));return{x:f,y:g,w:p,h}}function Ym(e,t,r,i,n,a){const s=p=>Zm(t[p])?r(t[p]):null;e.save(),e.lineCap="round",e.lineJoin="round",e.strokeStyle="rgba(255,255,255,.85)",e.lineWidth=n*.25;for(const[p,h]of Vo){const f=s(p),g=s(h);!f||!g||(e.beginPath(),e.moveTo(f.x,f.y),e.lineTo(g.x,g.y),e.stroke())}e.fillStyle="#ffffff";for(const p of new Set(Vo.flat())){const h=s(p);h&&(e.beginPath(),e.arc(h.x,h.y,n*.3,0,Math.PI*2),e.fill())}const o=(p,h)=>{const f=s(p),g=s(h);return f&&g?{x:(f.x+g.x)/2,y:(f.y+g.y)/2}:null},l=[],d=p=>l.every(h=>p.x+p.w<=h.x||h.x+h.w<=p.x||p.y+p.h<=h.y||h.y+h.h<=p.y);for(const p of i){const h=tw(p),[f,g,m]=p.kind==="trunk"?[o(23,24),o(11,12),null]:p.kind==="shank"?[s(27+p.side),s(25+p.side),null]:p.kind==="thigh"?[s(23+p.side),s(25+p.side),null]:[s(25+p.side),s(27+p.side),s(23+p.side)];if(!f||!g||p.kind==="knee"&&!m)continue;const b=Math.hypot(g.x-f.x,g.y-f.y),v=m??{x:f.x,y:f.y+(p.kind==="thigh"?b:-b)};e.strokeStyle=h,e.lineWidth=n*.7,e.beginPath(),e.moveTo(f.x,f.y),e.lineTo(g.x,g.y),m&&(e.moveTo(f.x,f.y),e.lineTo(m.x,m.y)),e.stroke(),p.kind!=="knee"&&(e.setLineDash([n*.8,n*.6]),e.lineWidth=n*.35,e.beginPath(),e.moveTo(f.x,f.y),e.lineTo(v.x,v.y),e.stroke(),e.setLineDash([]));const $=Math.atan2(v.y-f.y,v.x-f.x);let S=Math.atan2(g.y-f.y,g.x-f.x)-$;for(;S>Math.PI;)S-=2*Math.PI;for(;S<-Math.PI;)S+=2*Math.PI;const x=Math.max(n*2.2,Math.min(b*.35,n*5));if(e.lineWidth=n*.45,e.beginPath(),e.arc(f.x,f.y,x,$,$+S,S<0),e.stroke(),a){const I=$+S/2,C=Za(p),z=n*1.8,k=n*.45;e.font=`700 ${z}px system-ui, sans-serif`,e.textBaseline="middle";const D=e.measureText(C).width,L=D+2*k,j=z+2*k,O=e.canvas.width,G=e.canvas.height,M=(W,J)=>{const Q=Math.cos(I)*W,R=Math.sin(I)*W,se=f.x+Q*J+(Q<-.3?-L:Q>.3?0:-L/2),Ie=f.y+R*J+(R<-.3?-j:R>.3?0:-j/2);return{x:Math.max(2,Math.min(O-L-2,se)),y:Math.max(2,Math.min(G-j-2,Ie)),w:L,h:j}},B=M(1,x+n*1.4),V=M(-1,n*1.6),Y=p.kind==="knee"?[V,B]:[B,V],q=Y.find(d)??{...Y[0],y:Math.min(G-j-2,Math.max(...l.map(W=>W.y+W.h))+2)};l.push(q);const{x:H,y:X}=q;e.fillStyle="rgba(8,18,16,.72)",e.beginPath(),e.roundRect?e.roundRect(H,X,L,j,k):e.rect(H,X,L,j),e.fill(),e.fillStyle=h,e.fillText(C,H+k,X+j/2)}}e.restore()}const Zt=720,Kn=540,iw=3;function Qm(e){const t=e.slice(1).map((r,i)=>r.pts-e[i].pts).filter(r=>r>0).sort((r,i)=>r-i);return t.length?t[t.length>>1]:1/240}const _a=(e,t)=>e+.5*t;function Jm(e,t,r){return new Promise((i,n)=>{const a=()=>{clearTimeout(s),e.removeEventListener(t,a),i()},s=setTimeout(()=>{e.removeEventListener(t,a),n(new Error(`${t} timed out`))},r);e.addEventListener(t,a)})}async function nw(e,t){const r=Jm(e,"seeked",8e3);e.currentTime=t,await r,await new Promise(i=>requestAnimationFrame(()=>i()))}function kw({url:e,frames:t,phases:r,onShow:i,guides:n={},overlay:a}){const[s,o]=Ee.useState({}),[l,d]=Ee.useState(!1),p=Ee.useMemo(()=>Qm(t),[t]);Ee.useEffect(()=>{let b=!1;o({}),d(!1);const v=document.createElement("video");return v.muted=!0,v.playsInline=!0,v.preload="auto",v.style.cssText="position:fixed;left:-10000px;top:0;width:320px;height:180px;pointer-events:none",document.body.appendChild(v),(async()=>{try{const $=Jm(v,"loadeddata",2e4);v.src=e,v.load();const w=setTimeout(()=>{v.readyState<2&&v.play().then(()=>v.pause()).catch(()=>{})},1500);await $,clearTimeout(w);for(const S of r){const x=t.find(M=>M.frame===S.frame),I=x?wi(x):null;if(b)return;if(!I)continue;if(await nw(v,_a(S.pts,p)),b)return;const C=document.createElement("canvas");C.width=Zt,C.height=Kn;const z=C.getContext("2d");if(!z)throw new Error("no canvas");const k=v.videoWidth,D=v.videoHeight,L=rw(I,k,D,Zt/Kn),j=Zt/L.w;z.drawImage(v,L.x,L.y,L.w,L.h,0,0,Zt,Kn);const O=M=>({x:(M.x*k-L.x)*j,y:(M.y*D-L.y)*j});Ym(z,I,O,S.marks,Zt/48,!0),a?.(S,z,O,Zt/48);const G=C.toDataURL("image/jpeg",.85);b||o(M=>({...M,[S.key]:G}))}}catch{b||d(!0)}})(),()=>{b=!0,v.pause(),v.removeAttribute("src"),v.load(),v.remove()}},[e,t,r,p,a]);const h=Ee.useRef(null),[f,g]=Ee.useState(0),m=b=>{const v=h.current;v?.clientWidth&&v.scrollTo({left:b*v.clientWidth,behavior:"smooth"}),g(b)};return pe.jsxs("div",{className:"sprint10-phase-view",children:[pe.jsx("div",{className:"sprint10-chips",role:"group","aria-label":"局面を選ぶ",children:r.map((b,v)=>pe.jsx("button",{type:"button","aria-pressed":f===v,"aria-label":b.label,onClick:()=>m(v),children:aw(b)},b.key))}),pe.jsx("ol",{ref:h,className:"sprint10-phases","aria-label":"局面ごとの姿勢",onScroll:b=>{const v=b.currentTarget;v.clientWidth&&g(Math.max(0,Math.min(r.length-1,Math.round(v.scrollLeft/v.clientWidth))))},children:r.map((b,v)=>pe.jsxs("li",{"aria-label":`${v+1}/${r.length} ${b.label}`,children:[pe.jsxs("div",{className:"sprint10-phase-head",children:[pe.jsxs("div",{children:[pe.jsx("strong",{children:b.label}),pe.jsxs("small",{children:[b.pts.toFixed(3),"秒"]})]}),pe.jsx("button",{type:"button","aria-label":`${b.label}をスロー再生で見る`,onClick:()=>i(b),children:"▶ スローで見る"})]}),s[b.key]?pe.jsx("img",{src:s[b.key],alt:`${b.label}の骨格と角度`}):pe.jsx("div",{className:"sprint10-phase-wait",children:l?"画像を作れませんでした":"画像を作成しています…"}),pe.jsx("p",{children:b.marks.length?b.marks.map(Za).join(" · "):"角度を測れませんでした"}),n[b.key]&&pe.jsx("small",{className:"sprint10-guide",children:n[b.key]})]},b.key))})]})}const aw=e=>e.short??(e.key==="set"?"構え":e.key==="clearance"?"離れる":e.label.replace("の接地","")),sw=[["1/8",.125],["1/4",.25],["通常",1]];function Tw({url:e,video:t,frames:r,phases:i,events:n}){const a=Ee.useRef(null),[s,o]=Ee.useState(.125),[l,d]=Ee.useState(!0),[p,h]=Ee.useState(""),[f,g]=Ee.useState(-1),m=Ee.useRef(null),b=Ee.useMemo(()=>r.filter(S=>S.pose),[r]),v=Ee.useMemo(()=>Qm(r),[r]);Ee.useEffect(()=>{const S=t.current;S&&(S.defaultPlaybackRate=s,S.playbackRate=s)},[t,s,e]),Ee.useEffect(()=>{const S=t.current,x=a.current,I=x?.getContext("2d");if(!S||!x||!I)return;let C=0,z=!1,k="",D=-1;const L=(B,V=-1)=>{B!==k&&(k=B,h(B)),V!==D&&(D=V,g(V))},j=()=>{I.clearRect(0,0,x.width,x.height),delete x.dataset.frame,L("")},O=B=>{if(S.seeking||!S.videoWidth){j();return}(x.width!==S.videoWidth||x.height!==S.videoHeight)&&(x.width=S.videoWidth,x.height=S.videoHeight),I.clearRect(0,0,x.width,x.height);const V=Fo(b,B);if(!V||Math.abs(V.pts-B)>1.5*v){delete x.dataset.frame,L("");return}const Y=i.find(q=>Math.abs(q.pts-V.pts)<=(iw+.5)*v)??null;l&&Ym(I,wi(V),q=>({x:q.x*x.width,y:q.y*x.height}),Y?.marks??[],x.width/110,!1),x.dataset.frame=String(V.frame),L(Y?`${Y.label}　${Y.marks.map(Za).join(" · ")}`:"",n.findIndex(q=>Math.abs(q.pts-V.pts)<.5*v))},G=()=>O(S.currentTime),M=(B,V)=>{z||(O(V.mediaTime),C=S.requestVideoFrameCallback(M))};for(const B of["seeked","loadeddata","timeupdate","pause"])S.addEventListener(B,G);return S.addEventListener("seeking",j),G(),S.requestVideoFrameCallback&&(C=S.requestVideoFrameCallback(M)),()=>{z=!0,C&&S.cancelVideoFrameCallback(C);for(const B of["seeked","loadeddata","timeupdate","pause"])S.removeEventListener(B,G);S.removeEventListener("seeking",j),I.clearRect(0,0,x.width,x.height)}},[t,b,i,n,l,v,e]),Ee.useEffect(()=>{const S=m.current,x=S?.children[f];S&&x&&S.scrollTo({left:x.offsetLeft-(S.clientWidth-x.offsetWidth)/2,behavior:"smooth"})},[f]);function $(S){const x=t.current;if(!x||!b.length)return;x.pause();const I=Fo(b,x.currentTime)??b[0],C=b.indexOf(I),z=b[Math.max(0,Math.min(b.length-1,C+S))];x.currentTime=_a(z.pts,v)}function w(S){const x=t.current;x&&(x.pause(),x.currentTime=_a(S,v))}return pe.jsxs(pe.Fragment,{children:[pe.jsxs("div",{className:"sprint10-player",children:[pe.jsx("video",{ref:t,src:e,playsInline:!0,muted:!0,preload:"auto"}),pe.jsx("canvas",{ref:a,className:"sprint10-replay-overlay","aria-label":"選手の骨格"}),pe.jsxs("label",{className:"sprint10-overlay-toggle",children:[pe.jsx("input",{type:"checkbox",checked:l,onChange:S=>d(S.target.checked)}),"骨格"]})]}),pe.jsx(kb,{video:t,url:e}),pe.jsx("p",{className:"sprint10-replay-caption","aria-live":"polite",children:p||" "}),pe.jsxs("div",{className:"sprint10-replay-controls",children:[pe.jsx("div",{className:"sprint10-seg",role:"group","aria-label":"再生の速さ",children:sw.map(([S,x])=>pe.jsx("button",{type:"button","aria-pressed":s===x,onClick:()=>o(x),children:S},S))}),pe.jsxs("div",{className:"sprint10-stepper",role:"group","aria-label":"1コマ送り",children:[pe.jsx("button",{type:"button","aria-label":"1コマ戻る",onClick:()=>$(-1),children:"◀"}),pe.jsx("span",{"aria-hidden":"true",children:"1コマ"}),pe.jsx("button",{type:"button","aria-label":"1コマ進む",onClick:()=>$(1),children:"▶"})]})]}),pe.jsx("div",{ref:m,className:"sprint10-events sprint10-chips",role:"group","aria-label":"判定した瞬間へ移動",children:n.map((S,x)=>pe.jsxs("button",{type:"button","aria-label":`${S.label} ${S.pts.toFixed(3)}秒`,"aria-pressed":f===x,onClick:()=>w(S.pts),children:[S.short,pe.jsx("small",{children:S.pts.toFixed(3)})]},`${S.label}${S.pts}`))})]})}const ow=24,uw=[0,.32,.64].map(e=>({x:e,y:0,w:.36,h:1})),Xn=[.2,2.5],lw=.1,dw=.08,pw=[11,12,23,24,25,26,27,28],Zp=.01,Zn=e=>({x:(e[23].x+e[24].x)/2,y:(e[23].y+e[24].y)/2});async function Yp(e,t,r,i){const n=()=>{if(t.aborted)throw new DOMException("中止","AbortError")},a=await dt(ba(e),t);n();const s=Jp(a.videoTrack.matrix);let o=new xr(e,a.videoTrack,a.frames,a.rawSamples,a.descriptionBuffer);const l=document.createElement("canvas"),d=l.getContext("2d");if(!d)throw new Error("映像処理を開始できません。");const p=()=>o.dispose();t.addEventListener("abort",p,{once:!0});const h=a.frames.reduce((g,m)=>r(m.frameIndex)?m.frameIndex:g,-1);let f=-1;try{for(let g=0;;g++)try{for(const m of a.frames){if(m.frameIndex>h)break;if(m.frameIndex<=f||!r(m.frameIndex)){await mi(o.skipExactFrame(m.frameIndex),t,m.frameIndex),n();continue}const b=await mi(o.decodeExactFrame(m.frameIndex),t,m.frameIndex);if(n(),b.status!=="SUCCESS"||b.actualDecodedFrameIndex!==m.frameIndex)throw new Error("動画フレームを正しく読み出せません。");const v=b.bitmap,$=s%180?v.height:v.width,w=s%180?v.width:v.height;(l.width!==$||l.height!==w)&&(l.width=$,l.height=w),d.setTransform(1,0,0,1,0,0),d.clearRect(0,0,$,w),d.translate($/2,w/2),d.rotate(s*Math.PI/180),d.drawImage(v,-v.width/2,-v.height/2),d.setTransform(1,0,0,1,0,0),await i(m,l,$,w),n(),f=m.frameIndex}break}catch(m){if(!(m instanceof _i)||t.aborted||g>=qm)throw m;o.dispose(),o=new xr(e,a.videoTrack,a.frames,a.rawSamples,a.descriptionBuffer)}}finally{t.removeEventListener("abort",p),o.dispose(),l.width=0}return a.frames.length}function Qp(e,t,r,i,n,a){const s=document.createElement("canvas"),o=s.getContext("2d");s.width=512,s.height=Math.round(512*r.h*a/(r.w*n)),o.drawImage(t,r.x*n,r.y*a,r.w*n,r.h*a,0,0,s.width,s.height);const l=e.estimate(s,i.frameIndex,i.pts).landmarks.map(d=>d.map(p=>({x:r.x+p.x*r.w,y:r.y+p.y*r.h,visibility:p.visibility})));return s.width=0,l.filter(d=>pw.every(p=>d[p]&&d[p].x>r.x+Zp&&d[p].x<r.x+r.w-Zp))}function cw(e){let t=0;for(let r=1;r<e.length;r++){const i=e[r].pts-e[r-1].pts;if(i>0)for(const n of e[r-1].people){const a=e[r].people.filter(s=>Math.abs(s.y-n.y)<.05).map(s=>(s.x-n.x)/i).filter(s=>Math.abs(s)>=Xn[0]&&Math.abs(s)<=Xn[1]).sort((s,o)=>Math.abs(s)-Math.abs(o));a.length&&(t+=a[0])}}return Math.abs(t)<Xn[0]?0:Math.sign(t)}async function Iw(e,t,r){const i=[];let n=0,a=0,s=0,o=null;const l=async(p,h)=>{try{return await h()}catch(f){throw f instanceof _i?new Error(`${p}の途中で、${f.message}`):f}},d=new Yn("full",void 0,"CPU",ga,"IMAGE");try{await dt(d.initialize(t,O=>r(0,O)),t),r(0,"走る向きを確認しています。");const p=(await dt(ba(e),t)).frames.length,h=Math.max(1,Math.floor(p/ow)),f=[];if(await l("走る向きの確認",()=>Yp(e,t,O=>O%h===0,async(O,G,M,B)=>{f.push({pts:O.pts,people:uw.flatMap(V=>Qp(d,G,V,O,M,B)).map(Zn)}),r(.1*O.frameIndex/p,"走る向きを確認しています。")})),s=cw(f),!s)throw new Error("走っている選手を見つけられませんでした。選手が画面を横切る動画を使ってください。");await l("選手の追跡",()=>Gm(e,s>0?.03:.97,t,(O,G)=>r(.1+.6*O,G),s>0?.97:.03,"flying",10,{maxFps:Wm,watcher:d,onSelected:(O,G,M,B)=>{n=M,a=B,i.push({frame:O.frameIndex,pts:O.pts,pose:G.length===33?G.map(V=>({x:V.x,y:V.y,visibility:V.visibility})):null})}}));try{o=await dt(Lm(t,O=>r(.7,O)),t)}catch(O){if(t.aborted)throw O;o=null}const g=i.filter(O=>O.pose);if(!g.length)return{frames:i,width:n,height:a,refiner:o?.backend??null,direction:s};const m=g[0],b=g.filter(O=>O.pts-m.pts<=lw).map(O=>({t:O.pts,...Zn(O.pose)})),v=b.reduce((O,G)=>O+G.t,0)/b.length,$=b.reduce((O,G)=>O+G.x,0)/b.length,w=b.reduce((O,G)=>O+(G.t-v)**2,0),S=w>0?b.reduce((O,G)=>O+(G.t-v)*(G.x-$),0)/w:0,x=g.slice(0,30).flatMap(O=>O.pose.filter(G=>(G.visibility??0)>=.3).map(G=>G.y)),I=Math.max(0,Math.min(...x)-.1),C=Math.min(1,Math.max(...x)+.1),z=O=>$+S*(O-v),k=new Map,D=new Map(g.map(O=>[O.frame,O])),L=g.at(-1).frame;r(.75,"踏切の前の動きを確認しています。"),await l("骨格の仕上げ",()=>Yp(e,t,O=>O<m.frame||!!o&&D.has(O),async(O,G,M,B)=>{if(O.frameIndex<m.frame){const V=z(O.pts);if(V<-.02||V>1.02)return;const Y={x:Math.max(0,Math.min(.64,V-.18)),y:I,w:.36,h:C-I},q=Qp(d,G,Y,O,M,B).map(X=>({p:X,d:Math.abs(Zn(X).x-V)})).filter(X=>X.d<dw).sort((X,W)=>X.d-W.d)[0]?.p;if(!q)return;const H={frame:O.frameIndex,pts:O.pts,pose:q.map(X=>({x:X.x,y:X.y,visibility:X.visibility??0}))};o&&(H.refined=await o.refine(G,H.pose)),k.set(O.frameIndex,H),r(.75+.05*O.frameIndex/m.frame,"踏切の前の動きを確認しています。")}else{const V=D.get(O.frameIndex);V.refined=await o.refine(G,V.pose),r(.8+.2*O.frameIndex/L,"骨格を細かく調べています。")}}));const j=new Map(i.map(O=>[O.frame,O]));for(const[O,G]of k)j.set(O,G);i.splice(0,i.length,...[...j.values()].sort((O,G)=>O.frame-G.frame))}finally{d.dispose()}return r(1,"解析が終わりました。"),{frames:i,width:n,height:a,refiner:o?.backend??null,direction:s}}export{wi as A,Hm as B,Tw as C,Eb as D,Xm as E,Db as F,zb as G,Pb as H,Vp as I,vw as J,Lm as K,_w as L,Wb as M,cw as N,Lb as O,Fm as P,ga as S,Vm as T,$b as a,bw as b,Ab as c,xw as d,Sw as e,Qm as f,kb as g,kw as h,_a as i,ww as j,qb as k,Mb as l,Jt as m,ly as n,Gm as o,Kp as p,yw as q,Yp as r,ew as s,Iw as t,$w as u,je as v,Ob as w,Nb as x,Rb as y,er as z};
