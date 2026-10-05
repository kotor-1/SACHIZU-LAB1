import{S as Bo,d as K0,t as X0}from"./video-orientation-DNKyXU7h.js";import{d as Z0,u as Rt,M as Do}from"./session-lifecycle-CBYeVhin.js";import{r as Ce,j as de}from"./index-DG5_m2iR.js";import{P as Po,n as Uo}from"./pose-drawing-Bu_8P2_g.js";const Kb="sprint10-experimental-v10",Y0=["歩数は、2本のラインの間に経過した脚の入れ替わり（遊脚が支持脚を追い越す動き）の周期の数です。ライン上の半端な1歩は周期の割合で数えます。接地回数を1つずつ数えた値ではありません。","各歩の距離は骨盤の画面内移動をライン間隔（既知の距離）で比例換算した推定です。真の全身重心・接地位置間の距離ではなく、遠近やカメラの揺れも補正していません。"],ni=e=>{const t=[...e].sort((r,i)=>r-i);return t.length?t[Math.floor(t.length/2)]:0};function Q0(e){const t=i=>{const n=[...i].sort((s,o)=>s-o),a=Math.floor(n.length/2);return n.length?n.length%2?n[a]:(n[a-1]+n[a])/2:0},r=t(e);return t(e.filter(i=>i<=Hn[1]*r+ca))}const Ur=e=>!!e&&Number.isFinite(e.x)&&Number.isFinite(e.y)&&e.x>0&&e.x<1&&e.y>0&&e.y<1&&(e.visibility??0)>=.3,ca=1e-9,Ae=(e,t)=>e-t>ca;function fi(e){const t=[];for(let r=1;r<e.length;r++)e[r].hipX!==null&&e[r-1].hipX!==null&&t.push(e[r].pts-e[r-1].pts);return Math.max(.05,2.5*(t.length?ni(t):0))}const Xb=.2;function Vp(e,t=fi(e),r=0){const i=new Map;for(let n=1;n<e.length;n++)i.set(e[n],e[n-1]);return(n,a)=>!Ae(a.pts-n.pts,t)||i.get(a)===n&&!Ae(a.pts-n.pts,r)}const Pt=(e,t)=>t-e>ca,ai=.65,J0=.025,Hn=[.7,1.5];function Wi(e,t,r,i){const n=[23,24].every(o=>Ur(e[o])),a=[23,24,25,26,27,28].every(o=>Ur(e[o])),s=(o,l)=>Math.hypot((e[o].x-e[l].x)*i,e[o].y-e[l].y);return{frame:t,pts:r,hipX:n?(e[23].x+e[24].x)/2:null,ankleGap:[27,28].every(o=>Ur(e[o]))?Math.abs(e[27].x-e[28].x)*i:null,kneeGap:[25,26].every(o=>Ur(e[o]))?Math.abs(e[25].x-e[26].x)*i:null,legLength:a?(s(23,25)+s(25,27)+s(24,26)+s(26,28))/2:null}}function ey(e,t,r,i=Vp(e)){const n=[],a=e.filter(s=>s.hipX!==null);for(let s=1;s<a.length;s++){const o=a[s-1],l=a[s],d=(o.hipX-t)*r,p=(l.hipX-t)*r;if(d>0||p<=0||!i(o,l))continue;const h=a.some(m=>m.pts<=o.pts&&!Ae(o.pts-m.pts,.15)&&(m.hipX-t)*r<-.003),f=a.some(m=>m.pts>=l.pts&&!Ae(m.pts-l.pts,.15)&&(m.hipX-t)*r>.003);if(!h||!f)continue;const y=o.pts+-d/(p-d)*(l.pts-o.pts);(!n.length||Ae(y-n.at(-1).pts,.15))&&n.push({pts:y,before:o.pts,after:l.pts,frame:l.frame})}return n}function ty(e,t,r=fi(e)){const i=t?e.filter(v=>!Pt(v.pts,t.startPts)&&!Ae(v.pts,t.finishPts)):e,n=ni(i.flatMap(v=>v.legLength!==null&&v.legLength>.01?[v.legLength]:[]));if(!n)return{events:[],gaps:[]};const s=(t?e.filter(v=>!Pt(v.pts,t.startPts-ai)&&!Ae(v.pts,t.finishPts+ai)):e).filter(v=>v.ankleGap!==null&&v.kneeGap!==null),o=v=>v.map(I=>({...I,value:ni(v.filter(C=>!Ae(Math.abs(C.pts-I.pts),J0)).map(C=>C.ankleGap/n))})),l=o(s),p=(t?o(i.filter(v=>v.ankleGap!==null&&v.kneeGap!==null)):l).map(v=>v.value).sort((v,I)=>v-I),h=p[Math.floor(p.length*.9)]??0;if(h<.2)return{events:[],gaps:[]};const f=h*.55,y=h*.3,m=[],b=[];let x=!1,$=null,w=null,S=[];for(const v of l){const I=w;if(w&&Ae(v.pts-w.pts,r)&&(b.push([w.pts,v.pts]),x=!1,$=null,S=[]),w=v,!x){v.value>=(f+y)/2&&(x=!0);continue}if(v.value<=y&&(!$||v.value<$.value)?($=v,S=[v]):$&&v.value===$.value&&S.at(-1)===I&&S.push(v),$&&v.value>=f){const z=s.filter(N=>!Ae(Math.abs(N.pts-$.pts),.06)).some(N=>N.kneeGap/n<.4),k=S[S.length-1>>1]??$;z&&(!m.length||!Pt(k.pts-m.at(-1).pts,.12))&&m.push({pts:k.pts,frame:k.frame}),$=null,S=[]}}return{events:m,gaps:b}}function ry(e,t,r,i,n,a,s=10,o=fi(e)){const l=[];for(let d=1;d<t.length;d++){const p=t[d-1],h=t[d],f=e.find(S=>S.frame===p.frame&&S.pts===p.pts),y=e.find(S=>S.frame===h.frame&&S.pts===h.pts),b=e.filter(S=>S.pts>=p.pts&&S.pts<=h.pts).filter(S=>S.hipX!==null&&Number.isFinite(S.hipX)&&S.ankleGap!==null&&S.kneeGap!==null).map(S=>S.pts),x=h.pts-p.pts;let $=null;Pt(p.pts,n)||Ae(h.pts,a)?$="区間外を含むため未算出":Pt(x,.12)||Ae(x,ai)?$="入れ替わり周期を確認できません":f?.hipX==null||y?.hipX==null||!Number.isFinite(f.hipX)||!Number.isFinite(y.hipX)?$="端点の骨盤位置がありません":(!b.length||Ae(b[0]-p.pts,o)||Ae(h.pts-b.at(-1),o)||b.some((S,v)=>v>0&&Ae(S-b[v-1],o)))&&($="この区間の追跡が途切れています");const w=f?.hipX!=null&&y?.hipX!=null?s*(y.hipX-f.hipX)/(i-r):NaN;!$&&(!Number.isFinite(w)||w<=0||w>10)&&($="進行方向の移動距離を確認できません"),l.push({fromStep:d,toStep:d+1,fromPts:p.pts,toPts:h.pts,fromHipX:f?.hipX??null,toHipX:y?.hipX??null,distanceM:$?null:w,reason:$})}return l}const iy={standing:{noFinish:"ゴール通過を確認できません。ゴールラインの位置と、ゴールを越えた後まで選手が映っているかを確認してください。",startGap:"スタートラインを越える瞬間の追跡が途切れています。スタート付近が隠れない位置から撮影してください。",noStart:"スタートラインより後ろにいる選手を確認できません。ラインを選手の立ち位置より少し後ろに置くか、走り出す前から映った動画を使ってください。"},flying:{noFinish:"出口の線の通過を確認できません。選手が出口の線を越えるまで動画が続いているか、出口の付近で選手が他の人と重なっていないか確認してください。",startGap:"入口の線を越える瞬間の追跡が途切れています。入口の付近で選手が他の人や物に隠れていないか確認してください。",noStart:"入口の線を越える選手を捉えられませんでした。入口の付近で選手が他の人と重なっている場合や、線を越えた後0.1秒以上、体が画面の外にかかっている場合は測れません。"}},ny=.25,ay=.1,Fp=.2,sy=.08,oy=.006;function Hp(e){let t=e;for(let r=0;r<3;r++){if(t.length<3)return null;const i=t.reduce((p,h)=>p+h.pts,0)/t.length,n=t.reduce((p,h)=>p+h.hipX,0)/t.length,a=t.reduce((p,h)=>p+(h.pts-i)**2,0);if(!(a>0))return null;const s=t.reduce((p,h)=>p+(h.pts-i)*(h.hipX-n),0)/a,o=t.map(p=>Math.abs(p.hipX-(n+s*(p.pts-i)))),l=1.4826*ni(o),d=t.filter((p,h)=>o[h]<=Math.max(oy,3*l));if(d.length===t.length||d.length<3||r===2)return{mt:i,mx:n,speed:s,used:t};t=d}return null}function Lo(e,t,r,i){let n=i.pts;for(let a=0;a<3;a++){const s=Hp(e.filter(d=>!Ae(Math.abs(d.pts-n),sy)));if(!s||!(s.speed*r>=Fp)||s.used.length<5)return i;const o=s.mt+(t-s.mx)/s.speed;if(o<s.used[0].pts||o>s.used.at(-1).pts)return i;const l=Math.abs(o-n)<.001;if(n=o,l)break}return{...i,pts:n}}function qo(e,t,r,i,n,a){const s=i==="entry"?e:[...e].reverse(),o=[s[0]];for(const y of s.slice(1)){const[m,b]=i==="entry"?[o.at(-1),y]:[y,o.at(-1)];if(!a(m,b)||Ae(Math.abs(y.pts-o[0].pts),ny))break;o.push(y)}if(o.length<3||Pt(Math.abs(o.at(-1).pts-o[0].pts),.05))return null;const l=Hp(o);if(!l||!(l.speed*r>=Fp))return null;const d=i==="entry"?l.used.reduce((y,m)=>m.pts<y.pts?m:y):l.used.reduce((y,m)=>m.pts>y.pts?m:y),p=l.mt+(t-l.mx)/l.speed,h=Math.abs(d.pts-p);return!((d.hipX-t)*r*(i==="entry"?1:-1)>0)||Ae(h,ay)||p<n[0]||p>n[1]?null:i==="entry"?{pts:p,before:p,after:d.pts,frame:d.frame,extendedSeconds:h}:{pts:p,before:d.pts,after:p,frame:d.frame,extendedSeconds:h}}const uy=.6;function ly(e,t,r,i){const n=e.events.filter($=>!Pt($.pts,r-1)&&!Ae($.pts,i+1)),a=$=>$.slice(1).map((w,S)=>w.pts-$[S].pts),s=Q0(t.length>=3?a(t):a(n));if(!(s>0))return null;const o=[...t];let l=0;for(;;){const $=o.slice(1).map((I,C)=>I.pts-o[C].pts),w=$.reduce((I,C,z)=>C<$[I]?z:I,0);if(!$.length||$[w]>=uy*s)break;const S=w>0?$[w-1]:1/0,v=w+1<$.length?$[w+1]:1/0;o.splice(Math.abs(S+$[w]-s)<Math.abs(v+$[w]-s)?w:w+1,1),l++}const d=o.slice(1).map(($,w)=>($.pts-o[w].pts)/s),p=d.map($=>$<=Hn[1]+1e-9?1:Math.max(2,Math.round($))),h=d.some(($,w)=>p[w]>=2&&Math.abs($-p[w])>.35);if(!o.length)return{count:(i-r)/s,steps:o,multiples:p,edges:null,estimatedEdges:[!1,!1],ambiguous:h,removed:l,cycle:s};const f=e.events.filter($=>$.pts<=r).at(-1),y=e.events.find($=>$.pts>=i),m=($,w)=>{const S=$?Math.abs(w.pts-$.pts):NaN;return $&&!Ae(S,ai)&&S/s<=Hn[1]&&!e.gaps.some(([I,C])=>I<Math.max(w.pts,$.pts)&&C>Math.min(w.pts,$.pts))?S:s},b=(o[0].pts-r)/m(f,o[0]),x=(i-o.at(-1).pts)/m(y,o.at(-1));return{count:p.reduce(($,w)=>$+w,0)+b+x,steps:o,multiples:p,edges:[b,x],estimatedEdges:[b>1+1e-9,x>1+1e-9],ambiguous:h,removed:l,cycle:s}}const dy=.02;function py(e){const t=e.filter(i=>i.hipX!==null),r=new Set;for(const i of t){const n=t.filter(d=>d!==i&&!Ae(Math.abs(d.pts-i.pts),.1));if(n.length<4)continue;const a=n.reduce((d,p)=>d+p.pts,0)/n.length,s=n.reduce((d,p)=>d+p.hipX,0)/n.length,o=n.reduce((d,p)=>d+(p.pts-a)**2,0),l=o>0?n.reduce((d,p)=>d+(p.pts-a)*(p.hipX-s),0)/o:0;Math.abs(i.hipX-(s+l*(i.pts-a)))>dy&&r.add(i)}return r.size?e.map(i=>r.has(i)?{...i,hipX:null}:i):e}function Zb(e,t,r,i=10,n="standing",a=0){const s=iy[n],o={start:null,finish:null,duration:null,steps:[],count:null,speed:null,cadence:null,stride:null,edgeFractions:null,strideIntervals:[],warnings:[],reason:null};if(![t,r].every(L=>Number.isFinite(L)&&L>0&&L<1)||Math.abs(r-t)<.1)return{...o,reason:"スタートとゴールを離して設定してください。"};if(!e.length||e.some((L,F)=>!Number.isFinite(L.pts)||F>0&&L.pts<=e[F-1].pts))return{...o,reason:"動画の時刻を確認できません。"};const l=Math.sign(r-t),d=n==="flying"?py(e):e,p=d.filter(L=>L.hipX!==null),h=[e[0].pts,e.at(-1).pts],f=fi(d),y=Vp(d,f,a),m=ey(d,r,l,y);if(!m.length&&n==="flying"){let L=p.length-1;for(;L>=0&&(p[L].hipX-r)*l>0;)L--;const F=L<0?null:qo(p.slice(0,L+1),r,l,"exit",h,y);F&&m.push(F)}if(!m.length)return{...o,reason:s.noFinish};let b=null,x=null,$=!1;for(const L of m){const F=p.filter(ye=>ye.pts<L.pts);let ee=F.length-1;for(;ee>=0&&(F[ee].hipX-t)*l>0;)ee--;if(ee===F.length-1)continue;const A=F[ee],K=F[ee+1];if(ee<0||!y(A,K)){const ye=n==="flying"?qo(F.slice(ee+1),t,l,"entry",h,y):null;if(ye){b=ye,x=L;break}ee>=0&&($=!0);continue}const Z=(A.hipX-t)*l,X=(K.hipX-t)*l;b={pts:A.pts+-Z/(X-Z)*(K.pts-A.pts),before:A.pts,after:K.pts,frame:K.frame},x=L;break}if(n==="flying"&&b&&x&&(b.extendedSeconds||(b=Lo(p,t,l,b)),x.extendedSeconds||(x=Lo(p,r,l,x))),!b||!x)return{...o,reason:$?s.startGap:s.noStart};const w=x.pts-b.pts,S=m.filter(L=>L.pts>x.pts+1),v=ty(e,{startPts:b.pts,finishPts:x.pts},f),I=b.extendedSeconds?b.after:b.pts,C=x.extendedSeconds?x.before:x.pts,z=e.filter(L=>L.pts>=I&&L.pts<=C),k=z.filter(L=>L.ankleGap!==null&&L.kneeGap!==null).length/Math.max(1,z.length),N=[I,...z.filter(L=>L.ankleGap!==null&&L.kneeGap!==null).map(L=>L.pts),C],B=k<.9||v.gaps.some(([L,F])=>L<C&&F>I)||N.some((L,F)=>F>0&&Ae(L-N[F-1],f)),H=v.events.filter(L=>L.pts>b.pts&&L.pts<x.pts),q=ly(v,H,b.pts,x.pts),V=q?.count??null,O=[...Y0];if(!q)O.unshift("脚の入れ替わりを2回以上捉えられなかったため、歩数・ピッチ・歩幅を出せません。");else{const L=[];q.removed&&L.push(`入れ替わりの誤検出と思われるもの（${q.removed}回）を除いて数えました。`),q.steps.length||L.push(`区間内の入れ替わりを捉えられなかったため、歩数は周期（${q.cycle.toFixed(3)}秒）から推定しました。`);const F=q.multiples.reduce((ee,A)=>ee+A-1,0);F===1?L.push("脚の入れ替わりを1回見逃した区間があり、周期の長さから2歩分として数えました。"):F>1&&L.push(`脚の入れ替わりを${F}回見逃した区間があり、周期の長さから数えました。`),q.estimatedEdges[0]&&L.push(`入口の直後の入れ替わりが映っていないため、その部分は周期（${q.cycle.toFixed(3)}秒）から推定しました。`),q.estimatedEdges[1]&&L.push(`出口の直前の入れ替わりが映っていないため、その部分は周期（${q.cycle.toFixed(3)}秒）から推定しました。`),q.ambiguous&&L.push("1歩分とも2歩分とも決めにくい周期があり、歩数が1歩ずれている可能性があります。"),B&&!F&&!q.estimatedEdges.some(Boolean)&&L.push("脚が映っていない時間がありますが、その前後の入れ替わりの間隔は通常の周期でした。"),O.unshift(...L)}S.length&&O.unshift("ゴールを2回以上越えています。最初の走りを解析しました。");const P=(L,F,ee)=>`${L}の線を越える瞬間の骨盤は映っていない（体が画面の端にかかる・隠れる）ため、${ee}の動きを${Math.round(F.extendedSeconds*1e3)}ミリ秒延ばして通過時刻を推定しました。`;x.extendedSeconds&&O.unshift(P("出口",x,"直前")),b.extendedSeconds&&O.unshift(P("入口",b,"直後"));const G=q?.steps??H,Y=q?.multiples??[];return{...o,start:b,finish:x,duration:w,speed:i/w,steps:G,count:V,edgeFractions:q?.edges??null,strideIntervals:ry(e,G,t,r,b.pts,x.pts,i,f).map((L,F)=>(Y[F]??1)>1?{...L,distanceM:null,reason:`入れ替わりの見逃しで${Y[F]}歩分の区間です`}:L),cadence:V===null?null:V/w,stride:V===null?null:i/V,warnings:O}}var ha=Object.defineProperty,cy=Object.getOwnPropertyDescriptor,hy=Object.getOwnPropertyNames,fy=Object.prototype.hasOwnProperty,my=(e=>typeof require<"u"?require:typeof Proxy<"u"?new Proxy(e,{get:(t,r)=>(typeof require<"u"?require:t)[r]}):e)(function(e){if(typeof require<"u")return require.apply(this,arguments);throw Error('Dynamic require of "'+e+'" is not supported')}),W=(e,t)=>()=>(e&&(t=e(e=0)),t),ir=(e,t)=>{for(var r in t)ha(e,r,{get:t[r],enumerable:!0})},gy=(e,t,r,i)=>{if(t&&typeof t=="object"||typeof t=="function")for(let n of hy(t))!fy.call(e,n)&&n!==r&&ha(e,n,{get:()=>t[n],enumerable:!(i=cy(t,n))||i.enumerable});return e},Sr=e=>gy(ha({},"__esModule",{value:!0}),e),ur,$t,Yt,Wo,jp,Kp=W(()=>{ur=new Map,$t=[],Yt=(e,t,r)=>{if(t&&typeof t.init=="function"&&typeof t.createInferenceSessionHandler=="function"){let i=ur.get(e);if(i===void 0)ur.set(e,{backend:t,priority:r});else{if(i.priority>r)return;if(i.priority===r&&i.backend!==t)throw new Error(`cannot register backend "${e}" using priority ${r}`)}if(r>=0){let n=$t.indexOf(e);n!==-1&&$t.splice(n,1);for(let a=0;a<$t.length;a++)if(ur.get($t[a]).priority<=r){$t.splice(a,0,e);return}$t.push(e)}return}throw new TypeError("not a valid backend")},Wo=async e=>{let t=ur.get(e);if(!t)return"backend not found.";if(t.initialized)return t.backend;if(t.aborted)return t.error;{let r=!!t.initPromise;try{return r||(t.initPromise=t.backend.init(e)),await t.initPromise,t.initialized=!0,t.backend}catch(i){return r||(t.error=`${i}`,t.aborted=!0),t.error}finally{delete t.initPromise}}},jp=async e=>{let t=e.executionProviders||[],r=t.map(l=>typeof l=="string"?l:l.name),i=r.length===0?$t:r,n,a=[],s=new Set;for(let l of i){let d=await Wo(l);typeof d=="string"?a.push({name:l,err:d}):(n||(n=d),n===d&&s.add(l))}if(!n)throw new Error(`no available backend found. ERR: ${a.map(l=>`[${l.name}] ${l.err}`).join(", ")}`);for(let{name:l,err:d}of a)r.includes(l)&&console.warn(`removing requested execution provider "${l}" from session options because it is not available: ${d}`);let o=t.filter(l=>s.has(typeof l=="string"?l:l.name));return[n,new Proxy(e,{get:(l,d)=>d==="executionProviders"?o:Reflect.get(l,d)})]}}),yy=W(()=>{Kp()}),Xp,_y=W(()=>{Xp="1.27.0"}),Gi,Re,Zp=W(()=>{_y(),Gi="warning",Re={wasm:{},webgl:{},webgpu:{},versions:{common:Xp},set logLevel(e){if(e!==void 0){if(typeof e!="string"||["verbose","info","warning","error","fatal"].indexOf(e)===-1)throw new Error(`Unsupported logging level: ${e}`);Gi=e}},get logLevel(){return Gi}},Object.defineProperty(Re,"logLevel",{enumerable:!0})}),$e,by=W(()=>{Zp(),$e=Re}),Yp,Qp,wy=W(()=>{Yp=(e,t)=>{let r=typeof document<"u"?document.createElement("canvas"):new OffscreenCanvas(1,1);r.width=e.dims[3],r.height=e.dims[2];let i=r.getContext("2d");if(i!=null){let n,a;t?.tensorLayout!==void 0&&t.tensorLayout==="NHWC"?(n=e.dims[2],a=e.dims[3]):(n=e.dims[3],a=e.dims[2]);let s=t?.format!==void 0?t.format:"RGB",o=t?.norm,l,d;o===void 0||o.mean===void 0?l=[255,255,255,255]:typeof o.mean=="number"?l=[o.mean,o.mean,o.mean,o.mean]:(l=[o.mean[0],o.mean[1],o.mean[2],0],o.mean[3]!==void 0&&(l[3]=o.mean[3])),o===void 0||o.bias===void 0?d=[0,0,0,0]:typeof o.bias=="number"?d=[o.bias,o.bias,o.bias,o.bias]:(d=[o.bias[0],o.bias[1],o.bias[2],0],o.bias[3]!==void 0&&(d[3]=o.bias[3]));let p=a*n,h=0,f=p,y=p*2,m=-1;s==="RGBA"?(h=0,f=p,y=p*2,m=p*3):s==="RGB"?(h=0,f=p,y=p*2):s==="RBG"&&(h=0,y=p,f=p*2);for(let b=0;b<a;b++)for(let x=0;x<n;x++){let $=(e.data[h++]-d[0])*l[0],w=(e.data[f++]-d[1])*l[1],S=(e.data[y++]-d[2])*l[2],v=m===-1?255:(e.data[m++]-d[3])*l[3];i.fillStyle="rgba("+$+","+w+","+S+","+v+")",i.fillRect(x,b,1,1)}if("toDataURL"in r)return r.toDataURL();throw new Error("toDataURL is not supported")}else throw new Error("Can not access image data")},Qp=(e,t)=>{let r=typeof document<"u"?document.createElement("canvas").getContext("2d"):new OffscreenCanvas(1,1).getContext("2d"),i;if(r!=null){let n,a,s;t?.tensorLayout!==void 0&&t.tensorLayout==="NHWC"?(n=e.dims[2],a=e.dims[1],s=e.dims[3]):(n=e.dims[3],a=e.dims[2],s=e.dims[1]);let o=t!==void 0&&t.format!==void 0?t.format:"RGB",l=t?.norm,d,p;l===void 0||l.mean===void 0?d=[255,255,255,255]:typeof l.mean=="number"?d=[l.mean,l.mean,l.mean,l.mean]:(d=[l.mean[0],l.mean[1],l.mean[2],255],l.mean[3]!==void 0&&(d[3]=l.mean[3])),l===void 0||l.bias===void 0?p=[0,0,0,0]:typeof l.bias=="number"?p=[l.bias,l.bias,l.bias,l.bias]:(p=[l.bias[0],l.bias[1],l.bias[2],0],l.bias[3]!==void 0&&(p[3]=l.bias[3]));let h=a*n;if(t!==void 0&&(t.format!==void 0&&s===4&&t.format!=="RGBA"||s===3&&t.format!=="RGB"&&t.format!=="BGR"))throw new Error("Tensor format doesn't match input tensor dims");let f=4,y=0,m=1,b=2,x=3,$=0,w=h,S=h*2,v=-1;o==="RGBA"?($=0,w=h,S=h*2,v=h*3):o==="RGB"?($=0,w=h,S=h*2):o==="RBG"&&($=0,S=h,w=h*2),i=r.createImageData(n,a);for(let I=0;I<a*n;y+=f,m+=f,b+=f,x+=f,I++)i.data[y]=(e.data[$++]-p[0])*d[0],i.data[m]=(e.data[w++]-p[1])*d[1],i.data[b]=(e.data[S++]-p[2])*d[2],i.data[x]=v===-1?255:(e.data[v++]-p[3])*d[3]}else throw new Error("Can not access image data");return i}}),Lr,Jp,ec,tc,rc,ic,$y=W(()=>{fa(),Lr=(e,t)=>{if(e===void 0)throw new Error("Image buffer must be defined");if(t.height===void 0||t.width===void 0)throw new Error("Image height and width must be defined");if(t.tensorLayout==="NHWC")throw new Error("NHWC Tensor layout is not supported yet");let{height:r,width:i}=t,n=t.norm??{mean:255,bias:0},a,s;typeof n.mean=="number"?a=[n.mean,n.mean,n.mean,n.mean]:a=[n.mean[0],n.mean[1],n.mean[2],n.mean[3]??255],typeof n.bias=="number"?s=[n.bias,n.bias,n.bias,n.bias]:s=[n.bias[0],n.bias[1],n.bias[2],n.bias[3]??0];let o=t.format!==void 0?t.format:"RGBA",l=t.tensorFormat!==void 0&&t.tensorFormat!==void 0?t.tensorFormat:"RGB",d=r*i,p=l==="RGBA"?new Float32Array(d*4):new Float32Array(d*3),h=4,f=0,y=1,m=2,b=3,x=0,$=d,w=d*2,S=-1;o==="RGB"&&(h=3,f=0,y=1,m=2,b=-1),l==="RGBA"?S=d*3:l==="RBG"?(x=0,w=d,$=d*2):l==="BGR"&&(w=0,$=d,x=d*2);for(let v=0;v<d;v++,f+=h,m+=h,y+=h,b+=h)p[x++]=(e[f]+s[0])/a[0],p[$++]=(e[y]+s[1])/a[1],p[w++]=(e[m]+s[2])/a[2],S!==-1&&b!==-1&&(p[S++]=(e[b]+s[3])/a[3]);return l==="RGBA"?new We("float32",p,[1,4,r,i]):new We("float32",p,[1,3,r,i])},Jp=async(e,t)=>{let r=typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement,i=typeof ImageData<"u"&&e instanceof ImageData,n=typeof ImageBitmap<"u"&&e instanceof ImageBitmap,a=typeof e=="string",s,o=t??{},l=()=>{if(typeof document<"u")return document.createElement("canvas");if(typeof OffscreenCanvas<"u")return new OffscreenCanvas(1,1);throw new Error("Canvas is not supported")},d=p=>typeof HTMLCanvasElement<"u"&&p instanceof HTMLCanvasElement||p instanceof OffscreenCanvas?p.getContext("2d"):null;if(r){let p=l();p.width=e.width,p.height=e.height;let h=d(p);if(h!=null){let f=e.height,y=e.width;if(t!==void 0&&t.resizedHeight!==void 0&&t.resizedWidth!==void 0&&(f=t.resizedHeight,y=t.resizedWidth),t!==void 0){if(o=t,t.tensorFormat!==void 0)throw new Error("Image input config format must be RGBA for HTMLImageElement");o.tensorFormat="RGBA",o.height=f,o.width=y}else o.tensorFormat="RGBA",o.height=f,o.width=y;h.drawImage(e,0,0),s=h.getImageData(0,0,y,f).data}else throw new Error("Can not access image data")}else if(i){let p,h;if(t!==void 0&&t.resizedWidth!==void 0&&t.resizedHeight!==void 0?(p=t.resizedHeight,h=t.resizedWidth):(p=e.height,h=e.width),t!==void 0&&(o=t),o.format="RGBA",o.height=p,o.width=h,t!==void 0){let f=l();f.width=h,f.height=p;let y=d(f);if(y!=null)y.putImageData(e,0,0),s=y.getImageData(0,0,h,p).data;else throw new Error("Can not access image data")}else s=e.data}else if(n){if(t===void 0)throw new Error("Please provide image config with format for Imagebitmap");let p=l();p.width=e.width,p.height=e.height;let h=d(p);if(h!=null){let f=e.height,y=e.width;return h.drawImage(e,0,0,y,f),s=h.getImageData(0,0,y,f).data,o.height=f,o.width=y,Lr(s,o)}else throw new Error("Can not access image data")}else{if(a)return new Promise((p,h)=>{let f=l(),y=d(f);if(!e||!y)return h();let m=new Image;m.crossOrigin="Anonymous",m.src=e,m.onload=()=>{f.width=m.width,f.height=m.height,y.drawImage(m,0,0,f.width,f.height);let b=y.getImageData(0,0,f.width,f.height);o.height=f.height,o.width=f.width,p(Lr(b.data,o))}});throw new Error("Input data provided is not supported - aborted tensor creation")}if(s!==void 0)return Lr(s,o);throw new Error("Input data provided is not supported - aborted tensor creation")},ec=(e,t)=>{let{width:r,height:i,download:n,dispose:a}=t,s=[1,i,r,4];return new We({location:"texture",type:"float32",texture:e,dims:s,download:n,dispose:a})},tc=(e,t)=>{let{dataType:r,dims:i,download:n,dispose:a}=t;return new We({location:"gpu-buffer",type:r??"float32",gpuBuffer:e,dims:i,download:n,dispose:a})},rc=(e,t)=>{let{dataType:r,dims:i,download:n,dispose:a}=t;return new We({location:"ml-tensor",type:r??"float32",mlTensor:e,dims:i,download:n,dispose:a})},ic=(e,t,r)=>new We({location:"cpu-pinned",type:e,data:t,dims:r??[t.length]})}),Nt,br,Vi,nc,vy=W(()=>{Nt=new Map([["float32",Float32Array],["uint8",Uint8Array],["int8",Int8Array],["uint16",Uint16Array],["int16",Int16Array],["int32",Int32Array],["bool",Uint8Array],["float64",Float64Array],["uint32",Uint32Array],["int4",Uint8Array],["uint4",Uint8Array]]),br=new Map([[Float32Array,"float32"],[Uint8Array,"uint8"],[Int8Array,"int8"],[Uint16Array,"uint16"],[Int16Array,"int16"],[Int32Array,"int32"],[Float64Array,"float64"],[Uint32Array,"uint32"]]),Vi=!1,nc=()=>{if(!Vi){Vi=!0;let e=typeof BigInt64Array<"u"&&BigInt64Array.from,t=typeof BigUint64Array<"u"&&BigUint64Array.from,r=globalThis.Float16Array,i=typeof r<"u"&&r.from;e&&(Nt.set("int64",BigInt64Array),br.set(BigInt64Array,"int64")),t&&(Nt.set("uint64",BigUint64Array),br.set(BigUint64Array,"uint64")),i?(Nt.set("float16",r),br.set(r,"float16")):Nt.set("float16",Uint16Array)}}}),ac,sc,xy=W(()=>{fa(),ac=e=>{let t=1;for(let r=0;r<e.length;r++){let i=e[r];if(typeof i!="number"||!Number.isSafeInteger(i))throw new TypeError(`dims[${r}] must be an integer, got: ${i}`);if(i<0)throw new RangeError(`dims[${r}] must be a non-negative integer, got: ${i}`);t*=i}return t},sc=(e,t)=>{switch(e.location){case"cpu":return new We(e.type,e.data,t);case"cpu-pinned":return new We({location:"cpu-pinned",data:e.data,type:e.type,dims:t});case"texture":return new We({location:"texture",texture:e.texture,type:e.type,dims:t});case"gpu-buffer":return new We({location:"gpu-buffer",gpuBuffer:e.gpuBuffer,type:e.type,dims:t});case"ml-tensor":return new We({location:"ml-tensor",mlTensor:e.mlTensor,type:e.type,dims:t});default:throw new Error(`tensorReshape: tensor location ${e.location} is not supported`)}}}),We,fa=W(()=>{wy(),$y(),vy(),xy(),We=class{constructor(e,t,r){nc();let i,n;if(typeof e=="object"&&"location"in e)switch(this.dataLocation=e.location,i=e.type,n=e.dims,e.location){case"cpu-pinned":{let s=Nt.get(i);if(!s)throw new TypeError(`unsupported type "${i}" to create tensor from pinned buffer`);if(!(e.data instanceof s))throw new TypeError(`buffer should be of type ${s.name}`);this.cpuData=e.data;break}case"texture":{if(i!=="float32")throw new TypeError(`unsupported type "${i}" to create tensor from texture`);this.gpuTextureData=e.texture,this.downloader=e.download,this.disposer=e.dispose;break}case"gpu-buffer":{if(i!=="float32"&&i!=="float16"&&i!=="int32"&&i!=="int64"&&i!=="uint32"&&i!=="uint8"&&i!=="bool"&&i!=="uint4"&&i!=="int4")throw new TypeError(`unsupported type "${i}" to create tensor from gpu buffer`);this.gpuBufferData=e.gpuBuffer,this.downloader=e.download,this.disposer=e.dispose;break}case"ml-tensor":{if(i!=="float32"&&i!=="float16"&&i!=="int32"&&i!=="int64"&&i!=="uint32"&&i!=="uint64"&&i!=="int8"&&i!=="uint8"&&i!=="bool"&&i!=="uint4"&&i!=="int4")throw new TypeError(`unsupported type "${i}" to create tensor from MLTensor`);this.mlTensorData=e.mlTensor,this.downloader=e.download,this.disposer=e.dispose;break}default:throw new Error(`Tensor constructor: unsupported location '${this.dataLocation}'`)}else{let s,o;if(typeof e=="string")if(i=e,o=r,e==="string"){if(!Array.isArray(t))throw new TypeError("A string tensor's data must be a string array.");s=t}else{let l=Nt.get(e);if(l===void 0)throw new TypeError(`Unsupported tensor type: ${e}.`);if(Array.isArray(t)){if(e==="float16"&&l===Uint16Array||e==="uint4"||e==="int4")throw new TypeError(`Creating a ${e} tensor from number array is not supported. Please use ${l.name} as data.`);e==="uint64"||e==="int64"?s=l.from(t,BigInt):s=l.from(t)}else if(t instanceof l)s=t;else if(t instanceof Uint8ClampedArray)if(e==="uint8")s=Uint8Array.from(t);else throw new TypeError("A Uint8ClampedArray tensor's data must be type of uint8");else if(e==="float16"&&t instanceof Uint16Array&&l!==Uint16Array)s=new globalThis.Float16Array(t.buffer,t.byteOffset,t.length);else throw new TypeError(`A ${i} tensor's data must be type of ${l}`)}else if(o=t,Array.isArray(e)){if(e.length===0)throw new TypeError("Tensor type cannot be inferred from an empty array.");let l=typeof e[0];if(l==="string")i="string",s=e;else if(l==="boolean")i="bool",s=Uint8Array.from(e);else throw new TypeError(`Invalid element type of data array: ${l}.`)}else if(e instanceof Uint8ClampedArray)i="uint8",s=Uint8Array.from(e);else{let l=br.get(e.constructor);if(l===void 0)throw new TypeError(`Unsupported type for tensor data: ${e.constructor}.`);i=l,s=e}if(o===void 0)o=[s.length];else if(!Array.isArray(o))throw new TypeError("A tensor's dims must be a number array");n=o,this.cpuData=s,this.dataLocation="cpu"}let a=ac(n);if(this.cpuData&&a!==this.cpuData.length&&!((i==="uint4"||i==="int4")&&Math.ceil(a/2)===this.cpuData.length))throw new Error(`Tensor's size(${a}) does not match data length(${this.cpuData.length}).`);this.type=i,this.dims=n,this.size=a}static async fromImage(e,t){return Jp(e,t)}static fromTexture(e,t){return ec(e,t)}static fromGpuBuffer(e,t){return tc(e,t)}static fromMLTensor(e,t){return rc(e,t)}static fromPinnedBuffer(e,t,r){return ic(e,t,r)}toDataURL(e){return Yp(this,e)}toImageData(e){return Qp(this,e)}get data(){if(this.ensureValid(),!this.cpuData)throw new Error("The data is not on CPU. Use `getData()` to download GPU data to CPU, or use `texture` or `gpuBuffer` property to access the GPU data directly.");return this.cpuData}get location(){return this.dataLocation}get texture(){if(this.ensureValid(),!this.gpuTextureData)throw new Error("The data is not stored as a WebGL texture.");return this.gpuTextureData}get gpuBuffer(){if(this.ensureValid(),!this.gpuBufferData)throw new Error("The data is not stored as a WebGPU buffer.");return this.gpuBufferData}get mlTensor(){if(this.ensureValid(),!this.mlTensorData)throw new Error("The data is not stored as a WebNN MLTensor.");return this.mlTensorData}async getData(e){switch(this.ensureValid(),this.dataLocation){case"cpu":case"cpu-pinned":return this.data;case"texture":case"gpu-buffer":case"ml-tensor":{if(!this.downloader)throw new Error("The current tensor is not created with a specified data downloader.");if(this.isDownloading)throw new Error("The current tensor is being downloaded.");try{this.isDownloading=!0;let t=await this.downloader();return this.downloader=void 0,this.dataLocation="cpu",this.cpuData=t,e&&this.disposer&&(this.disposer(),this.disposer=void 0),t}finally{this.isDownloading=!1}}default:throw new Error(`cannot get data from location: ${this.dataLocation}`)}}dispose(){if(this.isDownloading)throw new Error("The current tensor is being downloaded.");this.disposer&&(this.disposer(),this.disposer=void 0),this.cpuData=void 0,this.gpuTextureData=void 0,this.gpuBufferData=void 0,this.mlTensorData=void 0,this.downloader=void 0,this.isDownloading=void 0,this.dataLocation="none"}ensureValid(){if(this.dataLocation==="none")throw new Error("The tensor is disposed.")}reshape(e){if(this.ensureValid(),this.downloader||this.disposer)throw new Error("Cannot reshape a tensor that owns GPU resource.");return sc(this,e)}}}),rt,oc=W(()=>{fa(),rt=We}),si,Fi,dt,it,Ut,Lt,uc=W(()=>{Zp(),si=(e,t)=>{(typeof Re.trace>"u"?!Re.wasm.trace:!Re.trace)||console.timeStamp(`${e}::ORT::${t}`)},Fi=(e,t)=>{let r=new Error().stack?.split(/\r\n|\r|\n/g)||[],i=!1;for(let n=0;n<r.length;n++){if(i&&!r[n].includes("TRACE_FUNC")){let a=`FUNC_${e}::${r[n].trim().split(" ")[1]}`;t&&(a+=`::${t}`),si("CPU",a);return}r[n].includes("TRACE_FUNC")&&(i=!0)}},dt=e=>{(typeof Re.trace>"u"?!Re.wasm.trace:!Re.trace)||Fi("BEGIN",e)},it=e=>{(typeof Re.trace>"u"?!Re.wasm.trace:!Re.trace)||Fi("END",e)},Ut=e=>{(typeof Re.trace>"u"?!Re.wasm.trace:!Re.trace)||console.time(`ORT::${e}`)},Lt=e=>{(typeof Re.trace>"u"?!Re.wasm.trace:!Re.trace)||console.timeEnd(`ORT::${e}`)}}),lc,Sy=W(()=>{Kp(),oc(),uc(),lc=class dc{constructor(t){this.handler=t}async run(t,r,i){dt(),Ut("InferenceSession.run");let n={},a={};if(typeof t!="object"||t===null||t instanceof rt||Array.isArray(t))throw new TypeError("'feeds' must be an object that use input names as keys and OnnxValue as corresponding values.");let s=!0;if(typeof r=="object"){if(r===null)throw new TypeError("Unexpected argument[1]: cannot be null.");if(r instanceof rt)throw new TypeError("'fetches' cannot be a Tensor");if(Array.isArray(r)){if(r.length===0)throw new TypeError("'fetches' cannot be an empty array.");s=!1;for(let d of r){if(typeof d!="string")throw new TypeError("'fetches' must be a string array or an object.");if(this.outputNames.indexOf(d)===-1)throw new RangeError(`'fetches' contains invalid output name: ${d}.`);n[d]=null}if(typeof i=="object"&&i!==null)a=i;else if(typeof i<"u")throw new TypeError("'options' must be an object.")}else{let d=!1,p=Object.getOwnPropertyNames(r);for(let h of this.outputNames)if(p.indexOf(h)!==-1){let f=r[h];(f===null||f instanceof rt)&&(d=!0,s=!1,n[h]=f)}if(d){if(typeof i=="object"&&i!==null)a=i;else if(typeof i<"u")throw new TypeError("'options' must be an object.")}else a=r}}else if(typeof r<"u")throw new TypeError("Unexpected argument[1]: must be 'fetches' or 'options'.");for(let d of this.inputNames)if(typeof t[d]>"u")throw new Error(`input '${d}' is missing in 'feeds'.`);if(s)for(let d of this.outputNames)n[d]=null;let o=await this.handler.run(t,n,a),l={};for(let d in o)if(Object.hasOwnProperty.call(o,d)){let p=o[d];p instanceof rt?l[d]=p:l[d]=new rt(p.type,p.data,p.dims)}return Lt("InferenceSession.run"),it(),l}async release(){return this.handler.dispose()}static async create(t,r,i,n){dt(),Ut("InferenceSession.create");let a,s={};if(typeof t=="string"){if(a=t,typeof r=="object"&&r!==null)s=r;else if(typeof r<"u")throw new TypeError("'options' must be an object.")}else if(t instanceof Uint8Array){if(a=t,typeof r=="object"&&r!==null)s=r;else if(typeof r<"u")throw new TypeError("'options' must be an object.")}else if(t instanceof ArrayBuffer||typeof SharedArrayBuffer<"u"&&t instanceof SharedArrayBuffer){let p=t,h=0,f=t.byteLength;if(typeof r=="object"&&r!==null)s=r;else if(typeof r=="number"){if(h=r,!Number.isSafeInteger(h))throw new RangeError("'byteOffset' must be an integer.");if(h<0||h>=p.byteLength)throw new RangeError(`'byteOffset' is out of range [0, ${p.byteLength}).`);if(f=t.byteLength-h,typeof i=="number"){if(f=i,!Number.isSafeInteger(f))throw new RangeError("'byteLength' must be an integer.");if(f<=0||h+f>p.byteLength)throw new RangeError(`'byteLength' is out of range (0, ${p.byteLength-h}].`);if(typeof n=="object"&&n!==null)s=n;else if(typeof n<"u")throw new TypeError("'options' must be an object.")}else if(typeof i<"u")throw new TypeError("'byteLength' must be a number.")}else if(typeof r<"u")throw new TypeError("'options' must be an object.");a=new Uint8Array(p,h,f)}else throw new TypeError("Unexpected argument[0]: must be 'path' or 'buffer'.");let[o,l]=await jp(s),d=await o.createInferenceSessionHandler(a,l);return Lt("InferenceSession.create"),it(),new dc(d)}startProfiling(){this.handler.startProfiling()}endProfiling(){this.handler.endProfiling()}get inputNames(){return this.handler.inputNames}get outputNames(){return this.handler.outputNames}get inputMetadata(){return this.handler.inputMetadata}get outputMetadata(){return this.handler.outputMetadata}}}),ma,ky=W(()=>{Sy(),ma=lc}),Ty=W(()=>{}),Iy=W(()=>{}),Ey=W(()=>{}),Cy=W(()=>{}),zy={};ir(zy,{InferenceSession:()=>ma,TRACE:()=>si,TRACE_EVENT_BEGIN:()=>Ut,TRACE_EVENT_END:()=>Lt,TRACE_FUNC_BEGIN:()=>dt,TRACE_FUNC_END:()=>it,Tensor:()=>rt,env:()=>$e,registerBackend:()=>Yt});var Ke=W(()=>{yy(),by(),ky(),oc(),Ty(),Iy(),uc(),Ey(),Cy()}),ga=W(()=>{}),pc={};ir(pc,{default:()=>cc});var Hi,ji,cc,Ay=W(()=>{_m(),Vt(),ya(),Hi="ort-wasm-proxy-worker",ji=globalThis.self?.name===Hi,ji&&(self.onmessage=e=>{let{type:t,in:r}=e.data;try{switch(t){case"init-wasm":_a(r.wasm).then(()=>{Na(r).then(()=>{postMessage({type:t})},i=>{postMessage({type:t,err:i})})},i=>{postMessage({type:t,err:i})});break;case"init-ep":{let{epName:i,env:n}=r;Ba(n,i).then(()=>{postMessage({type:t})},a=>{postMessage({type:t,err:a})});break}case"copy-from":{let{buffer:i}=r,n=hi(i);postMessage({type:t,out:n});break}case"create":{let{model:i,options:n}=r;Da(i,n).then(a=>{postMessage({type:t,out:a})},a=>{postMessage({type:t,err:a})});break}case"release":Pa(r),postMessage({type:t});break;case"run":{let{sessionId:i,inputIndices:n,inputs:a,outputIndices:s,options:o}=r;Ua(i,n,a,s,new Array(s.length).fill(null),o).then(l=>{l.some(d=>d[3]!=="cpu")?postMessage({type:t,err:"Proxy does not support non-cpu tensor location."}):postMessage({type:t,out:l},qa([...a,...l]))},l=>{postMessage({type:t,err:l})});break}case"end-profiling":La(r),postMessage({type:t});break;default:}}catch(i){postMessage({type:t,err:i})}}),cc=ji?null:e=>new Worker(e??Le,{type:"module",name:Hi})}),hc={};ir(hc,{default:()=>fc});async function Go(e={}){var t=e,r=!!globalThis.window,i=!!globalThis.WorkerGlobalScope,n=i&&self.name?.startsWith("em-pthread");t.mountExternalData=(u,c)=>{u.startsWith("./")&&(u=u.substring(2)),(t.Xc||(t.Xc=new Map)).set(u,c)},t.unmountExternalData=()=>{delete t.Xc},globalThis.SharedArrayBuffer??new WebAssembly.Memory({initial:0,maximum:0,shared:!0}).buffer.constructor;let a=u=>async(...c)=>{try{if(t.Yc)throw Error("Session already started");let _=t.Yc={Kd:c[0],errors:[]},g=await u(...c);if(t.Yc!==_)throw Error("Session mismatch");t.dd?.flush();let T=_.errors;if(0<T.length){let E=await Promise.all(T);if(E=E.filter(M=>M),0<E.length)throw Error(E.join(`
`))}return g}finally{t.Yc=null}};t.jsepInit=(u,c)=>{if(u==="webgpu"){[t.dd,t.Ad,t.Ed,t.ed,t.Dd,t.$b,t.Fd,t.Hd,t.Bd,t.Cd,t.Gd]=c;let _=t.dd;t.jsepRegisterBuffer=(g,T,E,M)=>_.registerBuffer(g,T,E,M),t.jsepGetBuffer=g=>_.getBuffer(g),t.jsepCreateDownloader=(g,T,E)=>_.createDownloader(g,T,E),t.jsepOnCreateSession=g=>{_.onCreateSession(g)},t.jsepOnReleaseSession=g=>{_.onReleaseSession(g)},t.jsepOnRunStart=g=>_.onRunStart(g),t.Id=(g,T)=>{_.upload(g,T)}}else if(u==="webnn"){let _=c[0];[t.Sd,t.sd,t.webnnEnsureTensor,t.td,t.webnnDownloadTensor,t.Rd,t.webnnEnableTraceEvent]=c.slice(1),t.webnnReleaseTensorId=t.sd,t.webnnUploadTensor=t.td,t.webnnRegisterMLContext=t.Rd,t.webnnOnRunStart=g=>_.onRunStart(g),t.webnnOnRunEnd=_.onRunEnd.bind(_),t.webnnOnReleaseSession=g=>{_.onReleaseSession(g)},t.webnnCreateMLTensorDownloader=(g,T)=>_.createMLTensorDownloader(g,T),t.webnnRegisterMLTensor=(g,T,E,M)=>_.registerMLTensor(g,T,E,M),t.webnnCreateMLContext=g=>_.createMLContext(g),t.webnnRegisterMLConstant=(g,T,E,M,D,j)=>_.registerMLConstant(g,T,E,M,D,t.Xc,j),t.webnnRegisterGraphInput=_.registerGraphInput.bind(_),t.webnnIsGraphInput=_.isGraphInput.bind(_),t.webnnRegisterGraphOutput=_.registerGraphOutput.bind(_),t.webnnIsGraphOutput=_.isGraphOutput.bind(_),t.webnnCreateTemporaryTensor=_.createTemporaryTensor.bind(_),t.webnnIsGraphInputOutputTypeSupported=_.isGraphInputOutputTypeSupported.bind(_)}};let s=()=>{let u=c=>(..._)=>{let g=st;return _=c(..._),st!=g?new Promise((T,E)=>{Ci={resolve:T,reject:E}}):_};(()=>{for(let c of["_OrtAppendExecutionProvider","_OrtCreateSession","_OrtRun","_OrtRunWithBinding","_OrtBindInput"])t[c]=u(t[c])})(),a!==void 0&&(t._OrtRun=a(t._OrtRun),t._OrtRunWithBinding=a(t._OrtRunWithBinding)),s=void 0};t.asyncInit=()=>{s?.()};var o,l,d=(u,c)=>{throw c},p=import.meta.url,h="";if(r||i){try{h=new URL(".",p).href}catch{}i&&(l=u=>{var c=new XMLHttpRequest;return c.open("GET",u,!1),c.responseType="arraybuffer",c.send(null),new Uint8Array(c.response)}),o=async u=>{if(z(u))return new Promise((_,g)=>{var T=new XMLHttpRequest;T.open("GET",u,!0),T.responseType="arraybuffer",T.onload=()=>{T.status==200||T.status==0&&T.response?_(T.response):g(T.status)},T.onerror=g,T.send(null)});var c=await fetch(u,{credentials:"same-origin"});if(c.ok)return c.arrayBuffer();throw Error(c.status+" : "+c.url)}}var f,y,m,b,x,$,w=console.log.bind(console),S=console.error.bind(console),v=w,I=S,C=!1,z=u=>u.startsWith("file://");function k(){yt.buffer!=B.buffer&&K()}if(n){let u=function(c){try{var _=c.data,g=_.Sc;if(g==="load"){let T=[];self.onmessage=E=>T.push(E),$=()=>{postMessage({Sc:"loaded"});for(let E of T)u(E);self.onmessage=u};for(let E of _.xd)t[E]&&!t[E].proxy||(t[E]=(...M)=>{postMessage({Sc:"callHandler",wd:E,args:M})},E=="print"&&(v=t[E]),E=="printErr"&&(I=t[E]));yt=_.Od,K(),y=_.Pd,Ee(),Pr()}else if(g==="run"){(function(T){var E=(k(),P)[T+52>>>2>>>0];T=(k(),P)[T+56>>>2>>>0],Fs(E,E-T),oe(E)})(_.Rc),Ri(_.Rc,0,0,1,0,0),Ha(),Ti(_.Rc),N||(Us(),N=!0);try{Lm(_.Md,_.bd)}catch(T){if(T!="unwind")throw T}}else _.target!=="setimmediate"&&(g==="checkMailbox"?N&&Ar():g&&(I(`worker: received unknown command ${g}`),I(_)))}catch(T){throw Ls(),T}};var N=!1;self.onunhandledrejection=c=>{throw c.reason||c},self.onmessage=u}var B,H,q,V,O,P,G,Y,L,F,ee,A=!1;function K(){var u=yt.buffer;t.HEAP8=B=new Int8Array(u),q=new Int16Array(u),t.HEAPU8=H=new Uint8Array(u),V=new Uint16Array(u),t.HEAP32=O=new Int32Array(u),t.HEAPU32=P=new Uint32Array(u),G=new Float32Array(u),Y=new Float64Array(u),L=new BigInt64Array(u),F=new BigUint64Array(u)}function Z(){A=!0,n?$():ct.sb()}function X(u){throw I(u="Aborted("+u+")"),C=!0,u=new WebAssembly.RuntimeError(u+". Build with -sASSERTIONS for more info."),x?.(u),u}function ye(){return{a:{ma:l0,gb:u0,g:qm,J:Wm,f:Gm,o:Vm,h:Fm,ha:Hm,b:jm,T:Km,Ha:Qa,n:Xm,$:rs,Xa:is,Da:ns,Fa:as,Ya:ss,Va:os,Oa:us,Ua:ls,ka:ds,Ea:ps,Ba:cs,Wa:hs,Ca:fs,bb:Zm,ea:Ym,wa:Qm,ua:eg,da:rg,O:ig,H:ng,va:ag,_:cg,xa:hg,Ra:fg,za:gg,Ia:yg,sa:_g,fa:bg,Qa:Ti,_a:wg,R:Sg,r:Cg,c:Si,hb:zg,y:Ag,M:Mg,D:Og,l:Rg,s:vs,ib:Ng,I:Bg,S:Dg,j:Pg,u:Ug,q:Lg,k:qg,La:Wg,Ma:Gg,Na:Vg,Ja:Ts,Ka:Is,ta:Es,db:Hg,ab:Kg,v:Xg,aa:Zg,ga:Yg,$a:jg,W:Qg,Za:Jg,Aa:e0,F:Fg,U:t0,la:Br,ya:i0,fb:r0,eb:n0,Sa:Ms,Ta:Os,Ga:bi,V:Rs,ja:Ns,Pa:Bs,ia:Ds,kb:F0,na:L0,lb:V0,oa:U0,G:z0,e:h0,t:p0,w:d0,B:x0,mb:B0,K:I0,x:g0,pa:D0,Y:q0,ba:N0,nb:R0,ob:O0,P:S0,qa:M0,pb:A0,N:E0,Z:P0,d:c0,A:m0,m:f0,jb:H0,p:_0,z:b0,C:y0,E:w0,L:k0,qb:C0,Q:W0,ca:T0,X:G0,rb:v0,ra:$0,i:s0,a:yt,cb:_i}}}async function Ee(){function u(g,T){var E=ct=g.exports;g={};for(let[M,D]of Object.entries(E))typeof D=="function"?(E=$g(D),g[M]=E):g[M]=D;return ct=g,ct=(function(){var M=ct,D=Q=>se=>Q(se)>>>0,j=Q=>()=>Q()>>>0;return(M=Object.assign({},M)).tb=D(M.tb),M.Xb=j(M.Xb),M.Zb=D(M.Zb),M.lc=D(M.lc),M.mc=j(M.mc),M.qc=D(M.qc),M})(),Va.push(ct._b),Ps=(g=ct).tb,Us=g.ub,t._OrtInit=g.vb,t._OrtGetLastError=g.wb,t._OrtCreateSessionOptions=g.xb,t._OrtAppendExecutionProvider=g.yb,t._OrtAddFreeDimensionOverride=g.zb,t._OrtAddSessionConfigEntry=g.Ab,t._OrtReleaseSessionOptions=g.Bb,t._OrtCreateSession=g.Cb,t._OrtReleaseSession=g.Db,t._OrtGetInputOutputCount=g.Eb,t._OrtGetInputOutputMetadata=g.Fb,t._OrtFree=g.Gb,t._OrtCreateTensor=g.Hb,t._OrtGetTensorData=g.Ib,t._OrtReleaseTensor=g.Jb,t._OrtCreateRunOptions=g.Kb,t._OrtAddRunConfigEntry=g.Lb,t._OrtReleaseRunOptions=g.Mb,t._OrtCreateBinding=g.Nb,t._OrtBindInput=g.Ob,t._OrtBindOutput=g.Pb,t._OrtClearBoundOutputs=g.Qb,t._OrtReleaseBinding=g.Rb,t._OrtRunWithBinding=g.Sb,t._OrtRun=g.Tb,t._OrtEndProfiling=g.Ub,t._JsepOutput=g.Vb,t._JsepGetNodeName=g.Wb,Dr=g.Xb,ot=t._free=g.Yb,sr=t._malloc=g.Zb,Ri=g.ac,Ls=g.bc,qs=g.cc,Ws=g.dc,Ni=g.ec,Gs=g.fc,Vs=g.gc,le=g.hc,or=g.ic,Fs=g.jc,oe=g.kc,Bi=g.lc,ue=g.mc,Hs=g.nc,Di=g.oc,js=g.pc,Ks=g.qc,Xs=g.rc,Pi=g.sc,Zs=g.tc,Ys=g.uc,Qs=g.vc,Js=g.wc,eo=g.xc,to=g.yc,ro=g.zc,io=g.Ac,no=g.Bc,ao=g.Cc,so=g.Dc,oo=g.Ec,uo=g.Fc,lo=g.Gc,po=g.Hc,co=g.Ic,ho=g.Jc,fo=g.Kc,mo=g.Lc,go=g.Mc,yo=g.Nc,_o=g.Pc,bo=g.Qc,wo=g.$c,$o=g.ad,vo=g.fd,xo=g.jd,So=g.kd,ko=g.ld,To=g.md,Io=g.nd,Eo=g.od,Co=g.pd,zo=g.qd,Ao=g.vd,Mo=g.Td,Oo=g.Ud,Ro=g.Vd,No=g.Wd,y=T,ct}var c,_=ye();return t.instantiateWasm?new Promise(g=>{t.instantiateWasm(_,(T,E)=>{g(u(T,E))})}):n?u(new WebAssembly.Instance(y,ye()),y):(ee??=t.locateFile?t.locateFile?t.locateFile("ort-wasm-simd-threaded.jsep.wasm",h):h+"ort-wasm-simd-threaded.jsep.wasm":new URL("/SACHIZU-LAB1/assets/ort-wasm-simd-threaded.jsep-DC5y_g6C.wasm",import.meta.url).href,c=await(async function(g){var T=ee;if(!f&&!z(T))try{var E=fetch(T,{credentials:"same-origin"});return await WebAssembly.instantiateStreaming(E,g)}catch(M){I(`wasm streaming compile failed: ${M}`),I("falling back to ArrayBuffer instantiation")}return(async function(M,D){try{var j=await(async function(Q){if(!f)try{var se=await o(Q);return new Uint8Array(se)}catch{}if(Q==ee&&f)Q=new Uint8Array(f);else{if(!l)throw"both async and sync fetching of the wasm failed";Q=l(Q)}return Q})(M);return await WebAssembly.instantiate(j,D)}catch(Q){I(`failed to asynchronously prepare wasm: ${Q}`),X(Q)}})(T,g)})(_),u(c.instance,c.module))}class be{name="ExitStatus";constructor(c){this.message=`Program terminated with exit(${c})`,this.status=c}}var Te=u=>{u.terminate(),u.onmessage=()=>{}},ce=[],we=0,De=null,Tr=u=>{gt.length==0&&(Ka(),ja(gt[0]));var c=gt.pop();if(!c)return 6;nr.push(c),Tt[u.Rc]=c,c.Rc=u.Rc;var _={Sc:"run",Md:u.Ld,bd:u.bd,Rc:u.Rc};return c.postMessage(_,u.rd),0},nt=0,ke=(u,c,..._)=>{var g,T=16*_.length,E=ue(),M=Bi(T),D=M>>>3;for(g of _)typeof g=="bigint"?((k(),L)[D++>>>0]=1n,(k(),L)[D++>>>0]=g):((k(),L)[D++>>>0]=0n,(k(),Y)[D++>>>0]=g);return u=qs(u,0,T,M,c),oe(E),u};function _i(u){if(n)return ke(0,1,u);if(m=u,!(0<nt)){for(var c of nr)Te(c);for(c of gt)Te(c);gt=[],nr=[],Tt={},C=!0}d(0,new be(u))}function Ga(u){if(n)return ke(1,0,u);bi(u)}var bi=u=>{if(m=u,n)throw Ga(u),"unwind";_i(u)},gt=[],nr=[],Va=[],Tt={},Fa=u=>{var c=u.Rc;delete Tt[c],gt.push(u),nr.splice(nr.indexOf(u),1),u.Rc=0,Ws(c)};function Ha(){Va.forEach(u=>u())}var ja=u=>new Promise(c=>{u.onmessage=T=>{var E=T.data;if(T=E.Sc,E.Zc&&E.Zc!=Dr()){var M=Tt[E.Zc];M?M.postMessage(E,E.rd):I(`Internal error! Worker sent a message "${T}" to target pthread ${E.Zc}, but that thread no longer exists!`)}else T==="checkMailbox"?Ar():T==="spawnThread"?Tr(E):T==="cleanupThread"?zr(()=>{Fa(Tt[E.Nd])}):T==="loaded"?(u.loaded=!0,c(u)):E.target==="setimmediate"?u.postMessage(E):T==="uncaughtException"?u.onerror(E.error):T==="callHandler"?t[E.wd](...E.args):T&&I(`worker sent an unknown command ${T}`)},u.onerror=T=>{throw I(`worker sent an error! ${T.filename}:${T.lineno}: ${T.message}`),T};var _,g=[];for(_ of[])t.propertyIsEnumerable(_)&&g.push(_);u.postMessage({Sc:"load",xd:g,Od:yt,Pd:y})});function Ka(){var u=new Worker((()=>{let c=URL;return import.meta.url>"file:"&&import.meta.url<"file;"?new c("ort.bundle.min.mjs",import.meta.url):new URL(import.meta.url)})(),{type:"module",workerData:"em-pthread",name:"em-pthread"});gt.push(u)}var yt,Lm=(u,c)=>{nt=0,u=Pi(u,c),0<nt?m=u:Ni(u)},Ir=[],Er=0;function qm(u){var c=new wi(u>>>=0);return(k(),B)[c.Tc+12>>>0]==0&&(Xa(c,!0),Er--),Za(c,!1),Ir.push(c),Ks(u)}var Ht=0,Wm=()=>{le(0,0);var u=Ir.pop();Hs(u.cd),Ht=0};function Xa(u,c){c=c?1:0,(k(),B)[u.Tc+12>>>0]=c}function Za(u,c){c=c?1:0,(k(),B)[u.Tc+13>>>0]=c}class wi{constructor(c){this.cd=c,this.Tc=c-24}}var $i=u=>{var c=Ht;if(!c)return or(0),0;var _=new wi(c);(k(),P)[_.Tc+16>>>2>>>0]=c;var g=(k(),P)[_.Tc+4>>>2>>>0];if(!g)return or(0),c;for(var T of u){if(T===0||T===g)break;if(js(T,g,_.Tc+16))return or(T),c}return or(g),c};function Gm(){return $i([])}function Vm(u){return $i([u>>>0])}function Fm(u,c,_,g){return $i([u>>>0,c>>>0,_>>>0,g>>>0])}var Hm=()=>{var u=Ir.pop();u||X("no exception to throw");var c=u.cd;throw(k(),B)[u.Tc+13>>>0]==0&&(Ir.push(u),Za(u,!0),Xa(u,!1),Er++),Di(c),Ht=c};function jm(u,c,_){var g=new wi(u>>>=0);throw c>>>=0,_>>>=0,(k(),P)[g.Tc+16>>>2>>>0]=0,(k(),P)[g.Tc+4>>>2>>>0]=c,(k(),P)[g.Tc+8>>>2>>>0]=_,Di(u),Er++,Ht=u}var Km=()=>Er;function Ya(u,c,_,g){return n?ke(2,1,u,c,_,g):Qa(u,c,_,g)}function Qa(u,c,_,g){if(u>>>=0,c>>>=0,_>>>=0,g>>>=0,!globalThis.SharedArrayBuffer)return 6;var T=[];return n&&T.length===0?Ya(u,c,_,g):(u={Ld:_,Rc:u,bd:g,rd:T},n?(u.Sc="spawnThread",postMessage(u,T),0):Tr(u))}function Xm(u){throw Ht||=u>>>0,Ht}var Ja=globalThis.TextDecoder&&new TextDecoder,es=(u,c,_,g)=>{if(_=c+_,g)return _;for(;u[c]&&!(c>=_);)++c;return c},ts=(u,c=0,_,g)=>{if(16<(_=es(u,c>>>=0,_,g))-c&&u.buffer&&Ja)return Ja.decode(u.buffer instanceof ArrayBuffer?u.subarray(c,_):u.slice(c,_));for(g="";c<_;){var T=u[c++];if(128&T){var E=63&u[c++];if((224&T)==192)g+=String.fromCharCode((31&T)<<6|E);else{var M=63&u[c++];65536>(T=(240&T)==224?(15&T)<<12|E<<6|M:(7&T)<<18|E<<12|M<<6|63&u[c++])?g+=String.fromCharCode(T):(T-=65536,g+=String.fromCharCode(55296|T>>10,56320|1023&T))}}else g+=String.fromCharCode(T)}return g},Me=(u,c,_)=>(u>>>=0)?ts((k(),H),u,c,_):"";function rs(u,c,_){return n?ke(3,1,u,c,_):0}function is(u,c){if(n)return ke(4,1,u,c)}function ns(u,c){if(n)return ke(5,1,u,c)}function as(u,c,_){if(n)return ke(6,1,u,c,_)}function ss(u,c,_){return n?ke(7,1,u,c,_):0}function os(u,c){if(n)return ke(8,1,u,c)}function us(u,c,_){if(n)return ke(9,1,u,c,_)}function ls(u,c,_,g){if(n)return ke(10,1,u,c,_,g)}function ds(u,c,_,g){if(n)return ke(11,1,u,c,_,g)}function ps(u,c,_,g){if(n)return ke(12,1,u,c,_,g)}function cs(u){if(n)return ke(13,1,u)}function hs(u,c){if(n)return ke(14,1,u,c)}function fs(u,c,_){if(n)return ke(15,1,u,c,_)}var Zm=()=>X(""),at=u=>{u>>>=0;for(var c="";;){var _=(k(),H)[u++>>>0];if(!_)return c;c+=String.fromCharCode(_)}},vi={},xi={},jt=class extends Error{constructor(u){super(u),this.name="BindingError"}};function pt(u,c,_={}){return(function(g,T,E={}){var M=T.name;if(!g)throw new jt(`type "${M}" must have a positive integer typeid pointer`);if(xi.hasOwnProperty(g)){if(E.yd)return;throw new jt(`Cannot register type '${M}' twice`)}xi[g]=T,vi.hasOwnProperty(g)&&(T=vi[g],delete vi[g],T.forEach(D=>D()))})(u,c,_)}var ms=(u,c,_)=>{switch(c){case 1:return _?g=>(k(),B)[g>>>0]:g=>(k(),H)[g>>>0];case 2:return _?g=>(k(),q)[g>>>1>>>0]:g=>(k(),V)[g>>>1>>>0];case 4:return _?g=>(k(),O)[g>>>2>>>0]:g=>(k(),P)[g>>>2>>>0];case 8:return _?g=>(k(),L)[g>>>3>>>0]:g=>(k(),F)[g>>>3>>>0];default:throw new TypeError(`invalid integer width (${c}): ${u}`)}};function Ym(u,c,_,g,T){u>>>=0,_>>>=0,c=at(c>>>0);let E=M=>M;if(g=g===0n){let M=8*_;E=D=>BigInt.asUintN(M,D),T=E(T)}pt(u,{name:c,Oc:E,Vc:(M,D)=>(typeof D=="number"&&(D=BigInt(D)),D),Uc:ms(c,_,!g),Wc:null})}function Qm(u,c,_,g){pt(u>>>=0,{name:c=at(c>>>0),Oc:function(T){return!!T},Vc:function(T,E){return E?_:g},Uc:function(T){return this.Oc((k(),H)[T>>>0])},Wc:null})}var gs=[],It=[0,1,,1,null,1,!0,1,!1,1];function Si(u){9<(u>>>=0)&&--It[u+1]===0&&(It[u]=void 0,gs.push(u))}var Ve=u=>{if(!u)throw new jt(`Cannot use deleted val. handle = ${u}`);return It[u]},Xe=u=>{switch(u){case void 0:return 2;case null:return 4;case!0:return 6;case!1:return 8;default:let c=gs.pop()||It.length;return It[c]=u,It[c+1]=1,c}};function ki(u){return this.Oc((k(),P)[u>>>2>>>0])}var Jm={name:"emscripten::val",Oc:u=>{var c=Ve(u);return Si(u),c},Vc:(u,c)=>Xe(c),Uc:ki,Wc:null};function eg(u){return pt(u>>>0,Jm)}var tg=(u,c)=>{switch(c){case 4:return function(_){return this.Oc((k(),G)[_>>>2>>>0])};case 8:return function(_){return this.Oc((k(),Y)[_>>>3>>>0])};default:throw new TypeError(`invalid float width (${c}): ${u}`)}};function rg(u,c,_){_>>>=0,pt(u>>>=0,{name:c=at(c>>>0),Oc:g=>g,Vc:(g,T)=>T,Uc:tg(c,_),Wc:null})}function ig(u,c,_,g,T){u>>>=0,_>>>=0,c=at(c>>>0);let E=D=>D;if(g===0){var M=32-8*_;E=D=>D<<M>>>M,T=E(T)}pt(u,{name:c,Oc:E,Vc:(D,j)=>j,Uc:ms(c,_,g!==0),Wc:null})}function ng(u,c,_){function g(E){var M=(k(),P)[E>>>2>>>0];return E=(k(),P)[E+4>>>2>>>0],new T((k(),B).buffer,E,M)}var T=[Int8Array,Uint8Array,Int16Array,Uint16Array,Int32Array,Uint32Array,Float32Array,Float64Array,BigInt64Array,BigUint64Array][c];pt(u>>>=0,{name:_=at(_>>>0),Oc:g,Uc:g},{yd:!0})}var _t=(u,c,_)=>{var g=(k(),H);if(c>>>=0,0<_){var T=c;_=c+_-1;for(var E=0;E<u.length;++E){var M=u.codePointAt(E);if(127>=M){if(c>=_)break;g[c++>>>0]=M}else if(2047>=M){if(c+1>=_)break;g[c++>>>0]=192|M>>6,g[c++>>>0]=128|63&M}else if(65535>=M){if(c+2>=_)break;g[c++>>>0]=224|M>>12,g[c++>>>0]=128|M>>6&63,g[c++>>>0]=128|63&M}else{if(c+3>=_)break;g[c++>>>0]=240|M>>18,g[c++>>>0]=128|M>>12&63,g[c++>>>0]=128|M>>6&63,g[c++>>>0]=128|63&M,E++}}g[c>>>0]=0,u=c-T}else u=0;return u},Cr=u=>{for(var c=0,_=0;_<u.length;++_){var g=u.charCodeAt(_);127>=g?c++:2047>=g?c+=2:55296<=g&&57343>=g?(c+=4,++_):c+=3}return c};function ag(u,c){pt(u>>>=0,{name:c=at(c>>>0),Oc(_){var g=(k(),P)[_>>>2>>>0];return g=Me(_+4,g,!0),ot(_),g},Vc(_,g){g instanceof ArrayBuffer&&(g=new Uint8Array(g));var T=typeof g=="string";if(!(T||ArrayBuffer.isView(g)&&g.BYTES_PER_ELEMENT==1))throw new jt("Cannot pass non-string to std::string");var E=T?Cr(g):g.length,M=sr(4+E+1),D=M+4;return(k(),P)[M>>>2>>>0]=E,T?_t(g,D,E+1):(k(),H).set(g,D>>>0),_!==null&&_.push(ot,M),M},Uc:ki,Wc(_){ot(_)}})}var ys=globalThis.TextDecoder?new TextDecoder("utf-16le"):void 0,sg=(u,c,_)=>{if(u>>>=1,16<(c=es((k(),V),u,c/2,_))-u&&ys)return ys.decode((k(),V).slice(u,c));for(_="";u<c;++u){var g=(k(),V)[u>>>0];_+=String.fromCharCode(g)}return _},og=(u,c,_)=>{if(_??=2147483647,2>_)return 0;var g=c;_=(_-=2)<2*u.length?_/2:u.length;for(var T=0;T<_;++T){var E=u.charCodeAt(T);(k(),q)[c>>>1>>>0]=E,c+=2}return(k(),q)[c>>>1>>>0]=0,c-g},ug=u=>2*u.length,lg=(u,c,_)=>{var g="";u>>>=2;for(var T=0;!(T>=c/4);T++){var E=(k(),P)[u+T>>>0];if(!E&&!_)break;g+=String.fromCodePoint(E)}return g},dg=(u,c,_)=>{if(c>>>=0,_??=2147483647,4>_)return 0;var g=c;_=g+_-4;for(var T=0;T<u.length;++T){var E=u.codePointAt(T);if(65535<E&&T++,(k(),O)[c>>>2>>>0]=E,(c+=4)+4>_)break}return(k(),O)[c>>>2>>>0]=0,c-g},pg=u=>{for(var c=0,_=0;_<u.length;++_)65535<u.codePointAt(_)&&_++,c+=4;return c};function cg(u,c,_){if(u>>>=0,c>>>=0,_=at(_>>>=0),c===2)var g=sg,T=og,E=ug;else g=lg,T=dg,E=pg;pt(u,{name:_,Oc:M=>{var D=(k(),P)[M>>>2>>>0];return D=g(M+4,D*c,!0),ot(M),D},Vc:(M,D)=>{if(typeof D!="string")throw new jt(`Cannot pass non-string to C++ string type ${_}`);var j=E(D),Q=sr(4+j+c);return(k(),P)[Q>>>2>>>0]=j/c,T(D,Q+4,j+c),M!==null&&M.push(ot,Q),Q},Uc:ki,Wc(M){ot(M)}})}function hg(u,c){pt(u>>>=0,{zd:!0,name:c=at(c>>>0),Oc:()=>{},Vc:()=>{}})}function fg(u){Ri(u>>>0,!i,1,!r,131072,!1),Ha()}var zr=u=>{if(!C)try{if(u(),!(0<nt))try{n?Dr()&&Ni(m):bi(m)}catch(c){c instanceof be||c=="unwind"||d(0,c)}}catch(c){c instanceof be||c=="unwind"||d(0,c)}},mg=!Atomics.waitAsync||globalThis.navigator?.userAgent&&91>Number((navigator.userAgent.match(/Chrom(e|ium)\/([0-9]+)\./)||[])[2]);function Ti(u){u>>>=0,mg||(Atomics.waitAsync((k(),O),u>>>2,u).value.then(Ar),u+=128,Atomics.store((k(),O),u>>>2,1))}var Ar=()=>zr(()=>{var u=Dr();u&&(Ti(u),Vs())});function gg(u,c){(u>>>=0)==c>>>0?setTimeout(Ar):n?postMessage({Zc:u,Sc:"checkMailbox"}):(u=Tt[u])&&u.postMessage({Sc:"checkMailbox"})}var Ii=[];function yg(u,c,_,g,T){for(c>>>=0,T>>>=0,Ii.length=0,_=T>>>3,g=T+g>>>3;_<g;){var E;E=(k(),L)[_++>>>0]?(k(),L)[_++>>>0]:(k(),Y)[_++>>>0],Ii.push(E)}return(c?Ui[c]:o0[u])(...Ii)}var _g=()=>{nt=0};function bg(u){u>>>=0,n?postMessage({Sc:"cleanupThread",Nd:u}):Fa(Tt[u])}function wg(u){}var Mr=u=>{try{u()}catch(c){X(c)}};function $g(u){var c=(..._)=>{Or.push(u);try{return u(..._)}finally{C||(Or.pop(),st&&bt===1&&Or.length===0&&(bt=0,nt+=1,Mr(Oo),typeof Fibers<"u"&&Fibers.Zd()))}};return ws.set(u,c),c}var bt=0,st=null,_s=0,Or=[],Ei=new Map,bs=new Map,ws=new Map,vg=0,Ci=null,xg=[],$s=u=>(function(c){if(!C){if(bt===0){var _=!1,g=!1;c((T=0)=>{if(!C&&(_s=T,_=!0,g)){bt=2,Mr(()=>Ro(st)),typeof MainLoop<"u"&&MainLoop.ud&&MainLoop.resume(),T=!1;try{var E=(function(){var j=(k(),O)[st+8>>>2>>>0];return j=bs.get(j),j=ws.get(j),--nt,j()})()}catch(j){E=j,T=!0}var M=!1;if(!st){var D=Ci;D&&(Ci=null,(T?D.reject:D.resolve)(E),M=!0)}if(T&&!M)throw E}}),g=!0,_||(bt=1,st=(function(){var T=sr(65548),E=T+12;if((k(),P)[T>>>2>>>0]=E,(k(),P)[T+4>>>2>>>0]=E+65536,E=Or[0],!Ei.has(E)){var M=vg++;Ei.set(E,M),bs.set(M,E)}return E=Ei.get(E),(k(),O)[T+8>>>2>>>0]=E,T})(),typeof MainLoop<"u"&&MainLoop.ud&&MainLoop.pause(),Mr(()=>Mo(st)))}else bt===2?(bt=0,Mr(No),ot(st),st=null,xg.forEach(zr)):X(`invalid state: ${bt}`);return _s}})(c=>{u().then(c)});function Sg(u){return u>>>=0,$s(async()=>{var c=await Ve(u);return Xe(c)})}var zi=[],kg=u=>{var c=zi.length;return zi.push(u),c},Tg=(u,c)=>{for(var _=Array(u),g=0;g<u;++g){var T=g,E=(k(),P)[c+4*g>>>2>>>0],M=xi[E];if(M===void 0)throw u=`parameter ${g}`,E=Ps(E),c=at(E),ot(E),new jt(`${u} has unknown type ${c}`);_[T]=M}return _},Ig=(u,c,_)=>{var g=[];return u=u(g,_),g.length&&((k(),P)[c>>>2>>>0]=Xe(g)),u},Eg={},Rr=u=>{var c=Eg[u];return c===void 0?at(u):c};function Cg(u,c,_){var[g,...T]=Tg(u,c>>>0);c=g.Vc.bind(g);var E=T.map(j=>j.Uc.bind(j));u--;var M={toValue:Ve};switch(u=E.map((j,Q)=>{var se=`argFromPtr${Q}`;return M[se]=j,`${se}(args${Q?"+"+8*Q:""})`}),_){case 0:var D="toValue(handle)";break;case 2:D="new (toValue(handle))";break;case 3:D="";break;case 1:M.getStringOrSymbol=Rr,D="toValue(handle)[getStringOrSymbol(methodName)]"}return D+=`(${u})`,g.zd||(M.toReturnWire=c,M.emval_returnValue=Ig,D=`return emval_returnValue(toReturnWire, destructorsRef, ${D})`),D=`return function (handle, methodName, destructorsRef, args) {
  ${D}
  }`,_=new Function(Object.keys(M),D)(...Object.values(M)),D=`methodCaller<(${T.map(j=>j.name)}) => ${g.name}>`,kg(Object.defineProperty(_,"name",{value:D}))}function zg(u,c){return c>>>=0,(u=Ve(u>>>0))==Ve(c)}function Ag(u){return(u>>>=0)?(u=Rr(u),Xe(globalThis[u])):Xe(globalThis)}function Mg(u){return u=Rr(u>>>0),Xe(t[u])}function Og(u,c){return c>>>=0,u=Ve(u>>>0),c=Ve(c),Xe(u[c])}function Rg(u){9<(u>>>=0)&&(It[u+1]+=1)}function vs(u,c,_,g,T){return zi[u>>>0](c>>>0,_>>>0,g>>>0,T>>>0)}function Ng(u,c,_,g,T){return vs(u>>>0,c>>>0,_>>>0,g>>>0,T>>>0)}function Bg(){return Xe([])}function Dg(u){u=Ve(u>>>0);for(var c=Array(u.length),_=0;_<u.length;_++)c[_]=u[_];return Xe(c)}function Pg(u){return Xe(Rr(u>>>0))}function Ug(){return Xe({})}function Lg(u){for(var c=Ve(u>>>=0);c.length;){var _=c.pop();c.pop()(_)}Si(u)}function qg(u,c,_){c>>>=0,_>>>=0,u=Ve(u>>>0),c=Ve(c),_=Ve(_),u[c]=_}function Wg(u,c){u=-9007199254740992>u||9007199254740992<u?NaN:Number(u),c>>>=0,u=new Date(1e3*u),(k(),O)[c>>>2>>>0]=u.getUTCSeconds(),(k(),O)[c+4>>>2>>>0]=u.getUTCMinutes(),(k(),O)[c+8>>>2>>>0]=u.getUTCHours(),(k(),O)[c+12>>>2>>>0]=u.getUTCDate(),(k(),O)[c+16>>>2>>>0]=u.getUTCMonth(),(k(),O)[c+20>>>2>>>0]=u.getUTCFullYear()-1900,(k(),O)[c+24>>>2>>>0]=u.getUTCDay(),u=(u.getTime()-Date.UTC(u.getUTCFullYear(),0,1,0,0,0,0))/864e5|0,(k(),O)[c+28>>>2>>>0]=u}var xs=u=>u%4==0&&(u%100!=0||u%400==0),Ss=[0,31,60,91,121,152,182,213,244,274,305,335],ks=[0,31,59,90,120,151,181,212,243,273,304,334];function Gg(u,c){u=-9007199254740992>u||9007199254740992<u?NaN:Number(u),c>>>=0,u=new Date(1e3*u),(k(),O)[c>>>2>>>0]=u.getSeconds(),(k(),O)[c+4>>>2>>>0]=u.getMinutes(),(k(),O)[c+8>>>2>>>0]=u.getHours(),(k(),O)[c+12>>>2>>>0]=u.getDate(),(k(),O)[c+16>>>2>>>0]=u.getMonth(),(k(),O)[c+20>>>2>>>0]=u.getFullYear()-1900,(k(),O)[c+24>>>2>>>0]=u.getDay();var _=(xs(u.getFullYear())?Ss:ks)[u.getMonth()]+u.getDate()-1|0;(k(),O)[c+28>>>2>>>0]=_,(k(),O)[c+36>>>2>>>0]=-60*u.getTimezoneOffset(),_=new Date(u.getFullYear(),6,1).getTimezoneOffset();var g=new Date(u.getFullYear(),0,1).getTimezoneOffset();u=0|(_!=g&&u.getTimezoneOffset()==Math.min(g,_)),(k(),O)[c+32>>>2>>>0]=u}function Vg(u){u>>>=0;var c=new Date((k(),O)[u+20>>>2>>>0]+1900,(k(),O)[u+16>>>2>>>0],(k(),O)[u+12>>>2>>>0],(k(),O)[u+8>>>2>>>0],(k(),O)[u+4>>>2>>>0],(k(),O)[u>>>2>>>0],0),_=(k(),O)[u+32>>>2>>>0],g=c.getTimezoneOffset(),T=new Date(c.getFullYear(),6,1).getTimezoneOffset(),E=new Date(c.getFullYear(),0,1).getTimezoneOffset(),M=Math.min(E,T);return 0>_?(k(),O)[u+32>>>2>>>0]=+(T!=E&&M==g):0<_!=(M==g)&&(T=Math.max(E,T),c.setTime(c.getTime()+6e4*((0<_?M:T)-g))),(k(),O)[u+24>>>2>>>0]=c.getDay(),_=(xs(c.getFullYear())?Ss:ks)[c.getMonth()]+c.getDate()-1|0,(k(),O)[u+28>>>2>>>0]=_,(k(),O)[u>>>2>>>0]=c.getSeconds(),(k(),O)[u+4>>>2>>>0]=c.getMinutes(),(k(),O)[u+8>>>2>>>0]=c.getHours(),(k(),O)[u+12>>>2>>>0]=c.getDate(),(k(),O)[u+16>>>2>>>0]=c.getMonth(),(k(),O)[u+20>>>2>>>0]=c.getYear(),u=c.getTime(),BigInt(isNaN(u)?-1:u/1e3)}function Ts(u,c,_,g,T,E,M){return n?ke(16,1,u,c,_,g,T,E,M):-52}function Is(u,c,_,g,T,E){if(n)return ke(17,1,u,c,_,g,T,E)}var ar={},Fg=()=>performance.timeOrigin+performance.now();function Es(u,c){if(n)return ke(18,1,u,c);if(ar[u]&&(clearTimeout(ar[u].id),delete ar[u]),!c)return 0;var _=setTimeout(()=>{delete ar[u],zr(()=>Gs(u,performance.timeOrigin+performance.now()))},c);return ar[u]={id:_,Yd:c},0}function Hg(u,c,_,g){u>>>=0,c>>>=0,_>>>=0,g>>>=0;var T=new Date().getFullYear(),E=new Date(T,0,1).getTimezoneOffset();T=new Date(T,6,1).getTimezoneOffset();var M=Math.max(E,T);(k(),P)[u>>>2>>>0]=60*M,(k(),O)[c>>>2>>>0]=+(E!=T),u=(c=D=>{var j=Math.abs(D);return`UTC${0<=D?"-":"+"}${String(Math.floor(j/60)).padStart(2,"0")}${String(j%60).padStart(2,"0")}`})(E),c=c(T),T<E?(_t(u,_,17),_t(c,g,17)):(_t(u,g,17),_t(c,_,17))}var jg=()=>Date.now();function Kg(u,c,_){return _>>>=0,0<=u&&3>=u?(u===0?u=Date.now():u=performance.timeOrigin+performance.now(),u=Math.round(1e6*u),(k(),L)[_>>>3>>>0]=BigInt(u),0):28}var Ai=[],Cs=(u,c)=>{Ai.length=0;for(var _;_=(k(),H)[u++>>>0];){var g=_!=105;c+=(g&=_!=112)&&c%8?4:0,Ai.push(_==112?(k(),P)[c>>>2>>>0]:_==106?(k(),L)[c>>>3>>>0]:_==105?(k(),O)[c>>>2>>>0]:(k(),Y)[c>>>3>>>0]),c+=g?8:4}return Ai};function Xg(u,c,_){return u>>>=0,c=Cs(c>>>0,_>>>0),Ui[u](...c)}function Zg(u,c,_){return u>>>=0,c=Cs(c>>>0,_>>>0),Ui[u](...c)}var Yg=()=>{};function Qg(u,c){return I(Me(u>>>0,c>>>0))}var Jg=()=>{throw nt+=1,"unwind"};function e0(){return 4294901760}var t0=()=>navigator.hardwareConcurrency,Et={},Nr=u=>{var c;return(c=/\bwasm-function\[\d+\]:(0x[0-9a-f]+)/.exec(u))?+c[1]:(c=/:(\d+):\d+(?:\)|$)/.exec(u))?2147483648|+c[1]:0},zs=u=>{for(var c of u)(u=Nr(c))&&(Et[u]=c)};function r0(){var u=Error().stack.toString().split(`
`);return u[0]=="Error"&&u.shift(),zs(u),Et.gd=Nr(u[3]),Et.Jd=u,Et.gd}function Br(u){if(!(u=Et[u>>>0]))return 0;var c;if(c=/^\s+at .*\.wasm\.(.*) \(.*\)$/.exec(u))u=c[1];else if(c=/^\s+at (.*) \(.*\)$/.exec(u))u=c[1];else{if(!(c=/^(.+?)@/.exec(u)))return 0;u=c[1]}ot(Br.hd??0),c=Cr(u)+1;var _=sr(c);return _&&_t(u,_,c),Br.hd=_,Br.hd}function i0(u){u>>>=0;var c=(k(),H).length;if(u<=c||4294901760<u)return!1;for(var _=1;4>=_;_*=2){var g=c*(1+.2/_);g=Math.min(g,u+100663296);e:{g=(Math.min(4294901760,65536*Math.ceil(Math.max(u,g)/65536))-yt.buffer.byteLength+65535)/65536|0;try{yt.grow(g),K();var T=1;break e}catch{}T=void 0}if(T)return!0}return!1}function n0(u,c,_){if(u>>>=0,c>>>=0,Et.gd==u)var g=Et.Jd;else(g=Error().stack.toString().split(`
`))[0]=="Error"&&g.shift(),zs(g);for(var T=3;g[T]&&Nr(g[T])!=u;)++T;for(u=0;u<_&&g[u+T];++u)(k(),O)[c+4*u>>>2>>>0]=Nr(g[u+T]);return u}var Mi,Oi={},As=()=>{if(!Mi){var u,c={USER:"web_user",LOGNAME:"web_user",PATH:"/",PWD:"/",HOME:"/home/web_user",LANG:(globalThis.navigator?.language??"C").replace("-","_")+".UTF-8",_:"./this.program"};for(u in Oi)Oi[u]===void 0?delete c[u]:c[u]=Oi[u];var _=[];for(u in c)_.push(`${u}=${c[u]}`);Mi=_}return Mi};function Ms(u,c){if(n)return ke(19,1,u,c);u>>>=0,c>>>=0;var _,g=0,T=0;for(_ of As()){var E=c+g;(k(),P)[u+T>>>2>>>0]=E,g+=_t(_,E,1/0)+1,T+=4}return 0}function Os(u,c){if(n)return ke(20,1,u,c);u>>>=0,c>>>=0;var _=As();for(var g of((k(),P)[u>>>2>>>0]=_.length,u=0,_))u+=Cr(g)+1;return(k(),P)[c>>>2>>>0]=u,0}function Rs(u){return n?ke(21,1,u):52}function Ns(u,c,_,g){return n?ke(22,1,u,c,_,g):52}function Bs(u,c,_,g){return n?ke(23,1,u,c,_,g):70}var a0=[null,[],[]];function Ds(u,c,_,g){if(n)return ke(24,1,u,c,_,g);c>>>=0,_>>>=0,g>>>=0;for(var T=0,E=0;E<_;E++){var M=(k(),P)[c>>>2>>>0],D=(k(),P)[c+4>>>2>>>0];c+=8;for(var j=0;j<D;j++){var Q=u,se=(k(),H)[M+j>>>0],he=a0[Q];se===0||se===10?((Q===1?v:I)(ts(he)),he.length=0):he.push(se)}T+=D}return(k(),P)[g>>>2>>>0]=T,0}function s0(u){return u>>>0}n||(function(){for(var u=t.numThreads-1;u--;)Ka();ce.push(async()=>{var c=(async function(){if(!n)return Promise.all(gt.map(ja))})();we++,await c,--we==0&&De&&(c=De,De=null,c())})})(),n||(yt=new WebAssembly.Memory({initial:256,maximum:65536,shared:!0}),K()),t.wasmBinary&&(f=t.wasmBinary),t.stackSave=()=>ue(),t.stackRestore=u=>oe(u),t.stackAlloc=u=>Bi(u),t.setValue=function(u,c,_="i8"){switch(_.endsWith("*")&&(_="*"),_){case"i1":case"i8":(k(),B)[u>>>0]=c;break;case"i16":(k(),q)[u>>>1>>>0]=c;break;case"i32":(k(),O)[u>>>2>>>0]=c;break;case"i64":(k(),L)[u>>>3>>>0]=BigInt(c);break;case"float":(k(),G)[u>>>2>>>0]=c;break;case"double":(k(),Y)[u>>>3>>>0]=c;break;case"*":(k(),P)[u>>>2>>>0]=c;break;default:X(`invalid type for setValue: ${_}`)}},t.getValue=function(u,c="i8"){switch(c.endsWith("*")&&(c="*"),c){case"i1":case"i8":return(k(),B)[u>>>0];case"i16":return(k(),q)[u>>>1>>>0];case"i32":return(k(),O)[u>>>2>>>0];case"i64":return(k(),L)[u>>>3>>>0];case"float":return(k(),G)[u>>>2>>>0];case"double":return(k(),Y)[u>>>3>>>0];case"*":return(k(),P)[u>>>2>>>0];default:X(`invalid type for getValue: ${c}`)}},t.UTF8ToString=Me,t.stringToUTF8=_t,t.lengthBytesUTF8=Cr;var Ps,Us,Dr,ot,sr,Ri,Ls,qs,Ws,Ni,Gs,Vs,le,or,Fs,oe,Bi,ue,Hs,Di,js,Ks,Xs,Pi,Zs,Ys,Qs,Js,eo,to,ro,io,no,ao,so,oo,uo,lo,po,co,ho,fo,mo,go,yo,_o,bo,wo,$o,vo,xo,So,ko,To,Io,Eo,Co,zo,Ao,Mo,Oo,Ro,No,ct,o0=[_i,Ga,Ya,rs,is,ns,as,ss,os,us,ls,ds,ps,cs,hs,fs,Ts,Is,Es,Ms,Os,Rs,Ns,Bs,Ds],Ui={1003524:(u,c,_,g,T)=>{if(t===void 0||!t.Xc)return 1;if((u=Me(Number(u>>>0))).startsWith("./")&&(u=u.substring(2)),!(u=t.Xc.get(u)))return 2;if(c=Number(c>>>0),_=Number(_>>>0),g=Number(g>>>0),c+_>u.byteLength)return 3;try{let E=u.subarray(c,c+_);switch(T){case 0:(k(),H).set(E,g>>>0);break;case 1:t.Qd?t.Qd(g,E):t.Id(g,E);break;default:return 4}return 0}catch{return 4}},1004348:(u,c,_)=>{t.td(u,(k(),H).subarray(c>>>0,c+_>>>0))},1004412:()=>t.Sd(),1004454:u=>{t.sd(u)},1004491:()=>{t.Bd()},1004522:()=>{t.Cd()},1004551:()=>{t.Gd()},1004576:u=>t.Ad(u),1004609:u=>t.Ed(u),1004641:(u,c,_)=>{t.ed(Number(u),Number(c),Number(_),!0)},1004704:(u,c,_)=>{t.ed(Number(u),Number(c),Number(_))},1004761:()=>typeof wasmOffsetConverter<"u",1004818:u=>{t.$b("Abs",u,void 0)},1004869:u=>{t.$b("Neg",u,void 0)},1004920:u=>{t.$b("Floor",u,void 0)},1004973:u=>{t.$b("Ceil",u,void 0)},1005025:u=>{t.$b("Reciprocal",u,void 0)},1005083:u=>{t.$b("Sqrt",u,void 0)},1005135:u=>{t.$b("Exp",u,void 0)},1005186:u=>{t.$b("Erf",u,void 0)},1005237:u=>{t.$b("Sigmoid",u,void 0)},1005292:(u,c,_)=>{t.$b("HardSigmoid",u,{alpha:c,beta:_})},1005371:u=>{t.$b("Log",u,void 0)},1005422:u=>{t.$b("Sin",u,void 0)},1005473:u=>{t.$b("Cos",u,void 0)},1005524:u=>{t.$b("Tan",u,void 0)},1005575:u=>{t.$b("Asin",u,void 0)},1005627:u=>{t.$b("Acos",u,void 0)},1005679:u=>{t.$b("Atan",u,void 0)},1005731:u=>{t.$b("Sinh",u,void 0)},1005783:u=>{t.$b("Cosh",u,void 0)},1005835:u=>{t.$b("Asinh",u,void 0)},1005888:u=>{t.$b("Acosh",u,void 0)},1005941:u=>{t.$b("Atanh",u,void 0)},1005994:u=>{t.$b("Tanh",u,void 0)},1006046:u=>{t.$b("Not",u,void 0)},1006097:(u,c,_)=>{t.$b("Clip",u,{min:c,max:_})},1006166:u=>{t.$b("Clip",u,void 0)},1006218:(u,c)=>{t.$b("Elu",u,{alpha:c})},1006276:u=>{t.$b("Gelu",u,void 0)},1006328:u=>{t.$b("Relu",u,void 0)},1006380:(u,c)=>{t.$b("LeakyRelu",u,{alpha:c})},1006444:(u,c)=>{t.$b("ThresholdedRelu",u,{alpha:c})},1006514:(u,c)=>{t.$b("Cast",u,{to:c})},1006572:u=>{t.$b("Add",u,void 0)},1006623:u=>{t.$b("Sub",u,void 0)},1006674:u=>{t.$b("Mul",u,void 0)},1006725:u=>{t.$b("Div",u,void 0)},1006776:u=>{t.$b("Pow",u,void 0)},1006827:u=>{t.$b("Equal",u,void 0)},1006880:u=>{t.$b("Greater",u,void 0)},1006935:u=>{t.$b("GreaterOrEqual",u,void 0)},1006997:u=>{t.$b("Less",u,void 0)},1007049:u=>{t.$b("LessOrEqual",u,void 0)},1007108:(u,c,_,g,T)=>{t.$b("ReduceMean",u,{keepDims:!!c,noopWithEmptyAxes:!!_,axes:g?Array.from((k(),O).subarray(Number(g)>>>0,Number(T)>>>0)):[]})},1007283:(u,c,_,g,T)=>{t.$b("ReduceMax",u,{keepDims:!!c,noopWithEmptyAxes:!!_,axes:g?Array.from((k(),O).subarray(Number(g)>>>0,Number(T)>>>0)):[]})},1007457:(u,c,_,g,T)=>{t.$b("ReduceMin",u,{keepDims:!!c,noopWithEmptyAxes:!!_,axes:g?Array.from((k(),O).subarray(Number(g)>>>0,Number(T)>>>0)):[]})},1007631:(u,c,_,g,T)=>{t.$b("ReduceProd",u,{keepDims:!!c,noopWithEmptyAxes:!!_,axes:g?Array.from((k(),O).subarray(Number(g)>>>0,Number(T)>>>0)):[]})},1007806:(u,c,_,g,T)=>{t.$b("ReduceSum",u,{keepDims:!!c,noopWithEmptyAxes:!!_,axes:g?Array.from((k(),O).subarray(Number(g)>>>0,Number(T)>>>0)):[]})},1007980:(u,c,_,g,T)=>{t.$b("ReduceL1",u,{keepDims:!!c,noopWithEmptyAxes:!!_,axes:g?Array.from((k(),O).subarray(Number(g)>>>0,Number(T)>>>0)):[]})},1008153:(u,c,_,g,T)=>{t.$b("ReduceL2",u,{keepDims:!!c,noopWithEmptyAxes:!!_,axes:g?Array.from((k(),O).subarray(Number(g)>>>0,Number(T)>>>0)):[]})},1008326:(u,c,_,g,T)=>{t.$b("ReduceLogSum",u,{keepDims:!!c,noopWithEmptyAxes:!!_,axes:g?Array.from((k(),O).subarray(Number(g)>>>0,Number(T)>>>0)):[]})},1008503:(u,c,_,g,T)=>{t.$b("ReduceSumSquare",u,{keepDims:!!c,noopWithEmptyAxes:!!_,axes:g?Array.from((k(),O).subarray(Number(g)>>>0,Number(T)>>>0)):[]})},1008683:(u,c,_,g,T)=>{t.$b("ReduceLogSumExp",u,{keepDims:!!c,noopWithEmptyAxes:!!_,axes:g?Array.from((k(),O).subarray(Number(g)>>>0,Number(T)>>>0)):[]})},1008863:u=>{t.$b("Where",u,void 0)},1008916:(u,c,_)=>{t.$b("Transpose",u,{perm:c?Array.from((k(),O).subarray(Number(c)>>>0,Number(_)>>>0)):[]})},1009040:(u,c,_,g)=>{t.$b("DepthToSpace",u,{blocksize:c,mode:Me(_),format:g?"NHWC":"NCHW"})},1009173:(u,c,_,g)=>{t.$b("DepthToSpace",u,{blocksize:c,mode:Me(_),format:g?"NHWC":"NCHW"})},1009306:(u,c,_,g,T,E,M,D,j,Q,se,he,_e,xe,wt)=>{t.$b("ConvTranspose",u,{format:j?"NHWC":"NCHW",autoPad:c,dilations:[_],group:g,kernelShape:[T],pads:[E,M],strides:[D],wIsConst:()=>!!(k(),B)[Q>>>0],outputPadding:se?Array.from((k(),O).subarray(Number(se)>>>0,Number(he)>>>0)):[],outputShape:_e?Array.from((k(),O).subarray(Number(_e)>>>0,Number(xe)>>>0)):[],activation:Me(wt)})},1009739:(u,c,_,g,T,E,M,D,j,Q,se,he,_e,xe)=>{t.$b("ConvTranspose",u,{format:D?"NHWC":"NCHW",autoPad:c,dilations:Array.from((k(),O).subarray(Number(_)>>>0,(Number(_)>>>0)+2>>>0)),group:g,kernelShape:Array.from((k(),O).subarray(Number(T)>>>0,(Number(T)>>>0)+2>>>0)),pads:Array.from((k(),O).subarray(Number(E)>>>0,(Number(E)>>>0)+4>>>0)),strides:Array.from((k(),O).subarray(Number(M)>>>0,(Number(M)>>>0)+2>>>0)),wIsConst:()=>!!(k(),B)[j>>>0],outputPadding:Q?Array.from((k(),O).subarray(Number(Q)>>>0,Number(se)>>>0)):[],outputShape:he?Array.from((k(),O).subarray(Number(he)>>>0,Number(_e)>>>0)):[],activation:Me(xe)})},1010400:(u,c,_,g,T,E,M,D,j,Q,se,he,_e,xe,wt)=>{t.$b("ConvTranspose",u,{format:j?"NHWC":"NCHW",autoPad:c,dilations:[_],group:g,kernelShape:[T],pads:[E,M],strides:[D],wIsConst:()=>!!(k(),B)[Q>>>0],outputPadding:se?Array.from((k(),O).subarray(Number(se)>>>0,Number(he)>>>0)):[],outputShape:_e?Array.from((k(),O).subarray(Number(_e)>>>0,Number(xe)>>>0)):[],activation:Me(wt)})},1010833:(u,c,_,g,T,E,M,D,j,Q,se,he,_e,xe)=>{t.$b("ConvTranspose",u,{format:D?"NHWC":"NCHW",autoPad:c,dilations:Array.from((k(),O).subarray(Number(_)>>>0,(Number(_)>>>0)+2>>>0)),group:g,kernelShape:Array.from((k(),O).subarray(Number(T)>>>0,(Number(T)>>>0)+2>>>0)),pads:Array.from((k(),O).subarray(Number(E)>>>0,(Number(E)>>>0)+4>>>0)),strides:Array.from((k(),O).subarray(Number(M)>>>0,(Number(M)>>>0)+2>>>0)),wIsConst:()=>!!(k(),B)[j>>>0],outputPadding:Q?Array.from((k(),O).subarray(Number(Q)>>>0,Number(se)>>>0)):[],outputShape:he?Array.from((k(),O).subarray(Number(he)>>>0,Number(_e)>>>0)):[],activation:Me(xe)})},1011494:(u,c)=>{t.$b("GlobalAveragePool",u,{format:c?"NHWC":"NCHW"})},1011585:(u,c,_,g,T,E,M,D,j,Q,se,he,_e,xe)=>{t.$b("AveragePool",u,{format:xe?"NHWC":"NCHW",auto_pad:c,ceil_mode:_,count_include_pad:g,storage_order:T,dilations:E?Array.from((k(),O).subarray(Number(E)>>>0,Number(M)>>>0)):[],kernel_shape:D?Array.from((k(),O).subarray(Number(D)>>>0,Number(j)>>>0)):[],pads:Q?Array.from((k(),O).subarray(Number(Q)>>>0,Number(se)>>>0)):[],strides:he?Array.from((k(),O).subarray(Number(he)>>>0,Number(_e)>>>0)):[]})},1012064:(u,c)=>{t.$b("GlobalAveragePool",u,{format:c?"NHWC":"NCHW"})},1012155:(u,c,_,g,T,E,M,D,j,Q,se,he,_e,xe)=>{t.$b("AveragePool",u,{format:xe?"NHWC":"NCHW",auto_pad:c,ceil_mode:_,count_include_pad:g,storage_order:T,dilations:E?Array.from((k(),O).subarray(Number(E)>>>0,Number(M)>>>0)):[],kernel_shape:D?Array.from((k(),O).subarray(Number(D)>>>0,Number(j)>>>0)):[],pads:Q?Array.from((k(),O).subarray(Number(Q)>>>0,Number(se)>>>0)):[],strides:he?Array.from((k(),O).subarray(Number(he)>>>0,Number(_e)>>>0)):[]})},1012634:(u,c)=>{t.$b("GlobalMaxPool",u,{format:c?"NHWC":"NCHW"})},1012721:(u,c,_,g,T,E,M,D,j,Q,se,he,_e,xe)=>{t.$b("MaxPool",u,{format:xe?"NHWC":"NCHW",auto_pad:c,ceil_mode:_,count_include_pad:g,storage_order:T,dilations:E?Array.from((k(),O).subarray(Number(E)>>>0,Number(M)>>>0)):[],kernel_shape:D?Array.from((k(),O).subarray(Number(D)>>>0,Number(j)>>>0)):[],pads:Q?Array.from((k(),O).subarray(Number(Q)>>>0,Number(se)>>>0)):[],strides:he?Array.from((k(),O).subarray(Number(he)>>>0,Number(_e)>>>0)):[]})},1013196:(u,c)=>{t.$b("GlobalMaxPool",u,{format:c?"NHWC":"NCHW"})},1013283:(u,c,_,g,T,E,M,D,j,Q,se,he,_e,xe)=>{t.$b("MaxPool",u,{format:xe?"NHWC":"NCHW",auto_pad:c,ceil_mode:_,count_include_pad:g,storage_order:T,dilations:E?Array.from((k(),O).subarray(Number(E)>>>0,Number(M)>>>0)):[],kernel_shape:D?Array.from((k(),O).subarray(Number(D)>>>0,Number(j)>>>0)):[],pads:Q?Array.from((k(),O).subarray(Number(Q)>>>0,Number(se)>>>0)):[],strides:he?Array.from((k(),O).subarray(Number(he)>>>0,Number(_e)>>>0)):[]})},1013758:(u,c,_,g,T)=>{t.$b("Gemm",u,{alpha:c,beta:_,transA:g,transB:T})},1013862:u=>{t.$b("MatMul",u,void 0)},1013916:(u,c,_,g)=>{t.$b("ArgMax",u,{keepDims:!!c,selectLastIndex:!!_,axis:g})},1014024:(u,c,_,g)=>{t.$b("ArgMin",u,{keepDims:!!c,selectLastIndex:!!_,axis:g})},1014132:(u,c)=>{t.$b("Softmax",u,{axis:c})},1014195:(u,c)=>{t.$b("Concat",u,{axis:c})},1014255:(u,c,_,g,T)=>{t.$b("Split",u,{axis:c,numOutputs:_,splitSizes:g?Array.from((k(),O).subarray(Number(g)>>>0,Number(T)>>>0)):[]})},1014411:u=>{t.$b("Expand",u,void 0)},1014465:(u,c)=>{t.$b("Gather",u,{axis:Number(c)})},1014536:(u,c)=>{t.$b("GatherElements",u,{axis:Number(c)})},1014615:(u,c)=>{t.$b("GatherND",u,{batch_dims:Number(c)})},1014694:(u,c,_,g,T,E,M,D,j,Q,se)=>{t.$b("Resize",u,{antialias:c,axes:_?Array.from((k(),O).subarray(Number(_)>>>0,Number(g)>>>0)):[],coordinateTransformMode:Me(T),cubicCoeffA:E,excludeOutside:M,extrapolationValue:D,keepAspectRatioPolicy:Me(j),mode:Me(Q),nearestMode:Me(se)})},1015056:(u,c,_,g,T,E,M)=>{t.$b("Slice",u,{starts:c?Array.from((k(),O).subarray(Number(c)>>>0,Number(_)>>>0)):[],ends:g?Array.from((k(),O).subarray(Number(g)>>>0,Number(T)>>>0)):[],axes:E?Array.from((k(),O).subarray(Number(E)>>>0,Number(M)>>>0)):[]})},1015320:u=>{t.$b("Tile",u,void 0)},1015372:(u,c,_)=>{t.$b("InstanceNormalization",u,{epsilon:c,format:_?"NHWC":"NCHW"})},1015486:(u,c,_)=>{t.$b("InstanceNormalization",u,{epsilon:c,format:_?"NHWC":"NCHW"})},1015600:u=>{t.$b("Range",u,void 0)},1015653:(u,c)=>{t.$b("Einsum",u,{equation:Me(c)})},1015734:(u,c,_,g,T)=>{t.$b("Pad",u,{mode:c,value:_,pads:g?Array.from((k(),O).subarray(Number(g)>>>0,Number(T)>>>0)):[]})},1015877:(u,c,_,g,T,E)=>{t.$b("BatchNormalization",u,{epsilon:c,momentum:_,spatial:!!T,trainingMode:!!g,format:E?"NHWC":"NCHW"})},1016046:(u,c,_,g,T,E)=>{t.$b("BatchNormalization",u,{epsilon:c,momentum:_,spatial:!!T,trainingMode:!!g,format:E?"NHWC":"NCHW"})},1016215:(u,c,_)=>{t.$b("CumSum",u,{exclusive:Number(c),reverse:Number(_)})},1016312:(u,c,_)=>{t.$b("DequantizeLinear",u,{axis:c,blockSize:_})},1016402:(u,c,_,g,T)=>{t.$b("GridSample",u,{align_corners:c,mode:Me(_),padding_mode:Me(g),format:T?"NHWC":"NCHW"})},1016572:(u,c,_,g,T)=>{t.$b("GridSample",u,{align_corners:c,mode:Me(_),padding_mode:Me(g),format:T?"NHWC":"NCHW"})},1016742:(u,c)=>{t.$b("ScatterND",u,{reduction:Me(c)})},1016827:(u,c,_,g,T,E,M,D,j)=>{t.$b("Attention",u,{numHeads:c,isUnidirectional:_,maskFilterValue:g,scale:T,doRotary:E,qkvHiddenSizes:M?Array.from((k(),O).subarray(Number(D)>>>0,Number(D)+M>>>0)):[],pastPresentShareBuffer:!!j})},1017099:u=>{t.$b("BiasAdd",u,void 0)},1017154:u=>{t.$b("BiasSplitGelu",u,void 0)},1017215:u=>{t.$b("FastGelu",u,void 0)},1017271:(u,c,_,g,T,E,M,D,j,Q,se,he,_e,xe,wt,Li)=>{t.$b("Conv",u,{format:he?"NHWC":"NCHW",auto_pad:c,dilations:_?Array.from((k(),O).subarray(Number(_)>>>0,Number(g)>>>0)):[],group:T,kernel_shape:E?Array.from((k(),O).subarray(Number(E)>>>0,Number(M)>>>0)):[],pads:D?Array.from((k(),O).subarray(Number(D)>>>0,Number(j)>>>0)):[],strides:Q?Array.from((k(),O).subarray(Number(Q)>>>0,Number(se)>>>0)):[],w_is_const:()=>!!(k(),B)[Number(_e)>>>0],activation:Me(xe),activation_params:wt?Array.from((k(),G).subarray(Number(wt)>>>0,Number(Li)>>>0)):[]})},1017855:u=>{t.$b("Gelu",u,void 0)},1017907:(u,c,_,g,T,E,M,D,j)=>{t.$b("GroupQueryAttention",u,{numHeads:c,kvNumHeads:_,scale:g,softcap:T,doRotary:E,rotaryInterleaved:M,smoothSoftmax:D,localWindowSize:j})},1018124:(u,c,_,g)=>{t.$b("LayerNormalization",u,{axis:c,epsilon:_,simplified:!!g})},1018235:(u,c,_,g)=>{t.$b("LayerNormalization",u,{axis:c,epsilon:_,simplified:!!g})},1018346:(u,c,_,g,T,E)=>{t.$b("MatMulNBits",u,{k:c,n:_,accuracyLevel:g,bits:T,blockSize:E})},1018473:(u,c,_,g,T,E)=>{t.$b("MultiHeadAttention",u,{numHeads:c,isUnidirectional:_,maskFilterValue:g,scale:T,doRotary:E})},1018632:(u,c)=>{t.$b("QuickGelu",u,{alpha:c})},1018696:(u,c,_,g,T)=>{t.$b("RotaryEmbedding",u,{interleaved:!!c,numHeads:_,rotaryEmbeddingDim:g,scale:T})},1018835:(u,c,_)=>{t.$b("SkipLayerNormalization",u,{epsilon:c,simplified:!!_})},1018937:(u,c,_)=>{t.$b("SkipLayerNormalization",u,{epsilon:c,simplified:!!_})},1019039:(u,c,_,g)=>{t.$b("GatherBlockQuantized",u,{gatherAxis:c,quantizeAxis:_,blockSize:g})},1019160:u=>{t.Fd(u)},1019194:(u,c)=>t.Hd(Number(u),Number(c),t.Yc.Kd,t.Yc.errors)};function u0(u,c,_){return $s(async()=>{await t.Dd(Number(u),Number(c),Number(_))})}function l0(){return typeof wasmOffsetConverter<"u"}function d0(u,c,_,g){var T=ue();try{return io(u,c,_,g)}catch(E){if(oe(T),E!==E+0)throw E;le(1,0)}}function p0(u,c,_){var g=ue();try{return Js(u,c,_)}catch(T){if(oe(g),T!==T+0)throw T;le(1,0)}}function c0(u){var c=ue();try{Zs(u)}catch(_){if(oe(c),_!==_+0)throw _;le(1,0)}}function h0(u,c){var _=ue();try{return Pi(u,c)}catch(g){if(oe(_),g!==g+0)throw g;le(1,0)}}function f0(u,c,_){var g=ue();try{Xs(u,c,_)}catch(T){if(oe(g),T!==T+0)throw T;le(1,0)}}function m0(u,c){var _=ue();try{no(u,c)}catch(g){if(oe(_),g!==g+0)throw g;le(1,0)}}function g0(u,c,_,g,T,E,M){var D=ue();try{return to(u,c,_,g,T,E,M)}catch(j){if(oe(D),j!==j+0)throw j;le(1,0)}}function y0(u,c,_,g,T,E){var M=ue();try{Ys(u,c,_,g,T,E)}catch(D){if(oe(M),D!==D+0)throw D;le(1,0)}}function _0(u,c,_,g){var T=ue();try{ro(u,c,_,g)}catch(E){if(oe(T),E!==E+0)throw E;le(1,0)}}function b0(u,c,_,g,T){var E=ue();try{Qs(u,c,_,g,T)}catch(M){if(oe(E),M!==M+0)throw M;le(1,0)}}function w0(u,c,_,g,T,E,M){var D=ue();try{so(u,c,_,g,T,E,M)}catch(j){if(oe(D),j!==j+0)throw j;le(1,0)}}function $0(u,c,_,g,T,E,M){var D=ue();try{oo(u,c,_,g,T,E,M)}catch(j){if(oe(D),j!==j+0)throw j;le(1,0)}}function v0(u,c,_,g,T,E,M,D){var j=ue();try{co(u,c,_,g,T,E,M,D)}catch(Q){if(oe(j),Q!==Q+0)throw Q;le(1,0)}}function x0(u,c,_,g,T){var E=ue();try{return ao(u,c,_,g,T)}catch(M){if(oe(E),M!==M+0)throw M;le(1,0)}}function S0(u,c,_){var g=ue();try{return ho(u,c,_)}catch(T){if(oe(g),T!==T+0)throw T;le(1,0)}}function k0(u,c,_,g,T,E,M,D){var j=ue();try{fo(u,c,_,g,T,E,M,D)}catch(Q){if(oe(j),Q!==Q+0)throw Q;le(1,0)}}function T0(u,c,_,g,T,E,M,D,j,Q,se,he){var _e=ue();try{uo(u,c,_,g,T,E,M,D,j,Q,se,he)}catch(xe){if(oe(_e),xe!==xe+0)throw xe;le(1,0)}}function I0(u,c,_,g,T,E){var M=ue();try{return lo(u,c,_,g,T,E)}catch(D){if(oe(M),D!==D+0)throw D;le(1,0)}}function E0(u,c,_){var g=ue();try{return mo(u,c,_)}catch(T){if(oe(g),T!==T+0)throw T;return le(1,0),0n}}function C0(u,c,_,g,T,E,M,D,j){var Q=ue();try{eo(u,c,_,g,T,E,M,D,j)}catch(se){if(oe(Q),se!==se+0)throw se;le(1,0)}}function z0(u){var c=ue();try{return go(u)}catch(_){if(oe(c),_!==_+0)throw _;le(1,0)}}function A0(u,c){var _=ue();try{return Ao(u,c)}catch(g){if(oe(_),g!==g+0)throw g;return le(1,0),0n}}function M0(u){var c=ue();try{return yo(u)}catch(_){if(oe(c),_!==_+0)throw _;return le(1,0),0n}}function O0(u,c,_,g){var T=ue();try{return xo(u,c,_,g)}catch(E){if(oe(T),E!==E+0)throw E;le(1,0)}}function R0(u,c,_,g,T){var E=ue();try{return So(u,c,_,g,T)}catch(M){if(oe(E),M!==M+0)throw M;le(1,0)}}function N0(u,c,_,g,T,E){var M=ue();try{return ko(u,c,_,g,T,E)}catch(D){if(oe(M),D!==D+0)throw D;le(1,0)}}function B0(u,c,_,g,T,E){var M=ue();try{return To(u,c,_,g,T,E)}catch(D){if(oe(M),D!==D+0)throw D;le(1,0)}}function D0(u,c,_,g,T,E,M,D){var j=ue();try{return po(u,c,_,g,T,E,M,D)}catch(Q){if(oe(j),Q!==Q+0)throw Q;le(1,0)}}function P0(u,c,_,g,T){var E=ue();try{return Io(u,c,_,g,T)}catch(M){if(oe(E),M!==M+0)throw M;return le(1,0),0n}}function U0(u,c,_,g){var T=ue();try{return Eo(u,c,_,g)}catch(E){if(oe(T),E!==E+0)throw E;le(1,0)}}function L0(u,c,_,g){var T=ue();try{return Co(u,c,_,g)}catch(E){if(oe(T),E!==E+0)throw E;le(1,0)}}function q0(u,c,_,g,T,E,M,D,j,Q,se,he){var _e=ue();try{return zo(u,c,_,g,T,E,M,D,j,Q,se,he)}catch(xe){if(oe(_e),xe!==xe+0)throw xe;le(1,0)}}function W0(u,c,_,g,T,E,M,D,j,Q,se){var he=ue();try{$o(u,c,_,g,T,E,M,D,j,Q,se)}catch(_e){if(oe(he),_e!==_e+0)throw _e;le(1,0)}}function G0(u,c,_,g,T,E,M,D,j,Q,se,he,_e,xe,wt,Li){var j0=ue();try{vo(u,c,_,g,T,E,M,D,j,Q,se,he,_e,xe,wt,Li)}catch(qi){if(oe(j0),qi!==qi+0)throw qi;le(1,0)}}function V0(u,c,_){var g=ue();try{return _o(u,c,_)}catch(T){if(oe(g),T!==T+0)throw T;le(1,0)}}function F0(u,c,_){var g=ue();try{return bo(u,c,_)}catch(T){if(oe(g),T!==T+0)throw T;le(1,0)}}function H0(u,c,_,g){var T=ue();try{wo(u,c,_,g)}catch(E){if(oe(T),E!==E+0)throw E;le(1,0)}}function Pr(){if(0<we)De=Pr;else if(n)b?.(t),Z();else{for(var u=ce;0<u.length;)u.shift()(t);0<we?De=Pr:(t.calledRun=!0,C||(Z(),b?.(t)))}}return n||(ct=await Ee(),Pr()),t.PTR_SIZE=4,A?t:new Promise((u,c)=>{b=u,x=c})}var fc,Vo,My=W(()=>{fc=Go,Vo=globalThis.self?.name?.startsWith("em-pthread"),Vo&&Go()}),Ki,jn,Fo,Le,mc,qr,Ho,jo,Xi,Ko,Zi,gc,Yi,yc,ya=W(()=>{ga(),Ki=typeof location>"u"?void 0:location.origin,jn=import.meta.url>"file:"&&import.meta.url<"file;",Fo=()=>{{if(jn){let e=URL;return new URL(new e("ort.bundle.min.mjs",import.meta.url).href,Ki).href}return import.meta.url}},Le=Fo(),mc=()=>{if(Le&&!Le.startsWith("blob:"))return Le.substring(0,Le.lastIndexOf("/")+1)},qr=(e,t)=>{try{let r=t??Le;return(r?new URL(e,r):new URL(e)).origin===Ki}catch{return!1}},Ho=(e,t)=>{let r=t??Le;try{return(r?new URL(e,r):new URL(e)).href}catch{return}},jo=(e,t)=>`${t??"./"}${e}`,Xi=async e=>{let t=await(await fetch(e,{credentials:"same-origin"})).blob();return URL.createObjectURL(t)},Ko=async e=>(await import(e)).default,Zi=(Ay(),Sr(pc)).default,gc=async()=>{if(!Le)throw new Error("Failed to load proxy worker: cannot determine the script source URL.");if(qr(Le))return[void 0,Zi()];let e=await Xi(Le);return[e,Zi(e)]},Yi=(My(),Sr(hc)).default,yc=async(e,t,r,i)=>{let n=Yi&&!(e||t);if(n)if(Le)n=qr(Le)||i&&!r;else if(i&&!r)n=!0;else throw new Error("cannot determine the script source URL.");if(n)return[void 0,Yi];{let a="ort-wasm-simd-threaded.jsep.mjs",s=e??Ho(a,t),o=r&&s&&!qr(s,t),l=o?await Xi(s):s??jo(a,t);return[o?l:void 0,await Ko(l)]}}}),Qi,Wr,lr,Ji,Xo,Zo,Yo,_a,ve,Vt=W(()=>{ya(),Wr=!1,lr=!1,Ji=!1,Xo=()=>{if(typeof SharedArrayBuffer>"u")return!1;try{return typeof MessageChannel<"u"&&new MessageChannel().port1.postMessage(new SharedArrayBuffer(1)),WebAssembly.validate(new Uint8Array([0,97,115,109,1,0,0,0,1,4,1,96,0,0,3,2,1,0,5,4,1,3,1,1,10,11,1,9,0,65,0,254,16,2,0,26,11]))}catch{return!1}},Zo=()=>{try{return WebAssembly.validate(new Uint8Array([0,97,115,109,1,0,0,0,1,4,1,96,0,0,3,2,1,0,10,30,1,28,0,65,0,253,15,253,12,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,253,186,1,26,11]))}catch{return!1}},Yo=()=>{try{return WebAssembly.validate(new Uint8Array([0,97,115,109,1,0,0,0,1,5,1,96,0,1,123,3,2,1,0,10,19,1,17,0,65,1,253,15,65,2,253,15,65,3,253,15,253,147,2,11]))}catch{return!1}},_a=async e=>{if(Wr)return Promise.resolve();if(lr)throw new Error("multiple calls to 'initializeWebAssembly()' detected.");if(Ji)throw new Error("previous call to 'initializeWebAssembly()' failed.");lr=!0;let t=e.initTimeout,r=e.numThreads;if(e.simd!==!1){if(e.simd==="relaxed"){if(!Yo())throw new Error("Relaxed WebAssembly SIMD is not supported in the current environment.")}else if(!Zo())throw new Error("WebAssembly SIMD is not supported in the current environment.")}let i=Xo();r>1&&!i&&(typeof self<"u"&&!self.crossOriginIsolated&&console.warn("env.wasm.numThreads is set to "+r+", but this will not work unless you enable crossOriginIsolated mode. See https://web.dev/cross-origin-isolation-guide/ for more info."),console.warn("WebAssembly multi-threading is not supported in the current environment. Falling back to single-threading."),e.numThreads=r=1);let n=e.wasmPaths,a=typeof n=="string"?n:void 0,s=n?.mjs,o=s?.href??s,l=n?.wasm,d=l?.href??l,p=e.wasmBinary,[h,f]=await yc(o,a,r>1,!!p||!!d),y=!1,m=[];if(t>0&&m.push(new Promise(b=>{setTimeout(()=>{y=!0,b()},t)})),m.push(new Promise((b,x)=>{let $={numThreads:r};if(p)$.wasmBinary=p,$.locateFile=w=>w;else if(d||a)$.locateFile=w=>d??a+w;else if(o&&o.indexOf("blob:")!==0)$.locateFile=w=>new URL(w,o).href;else if(h){let w=mc();w&&($.locateFile=S=>w+S)}f($).then(w=>{lr=!1,Wr=!0,Qi=w,b(),h&&URL.revokeObjectURL(h)},w=>{lr=!1,Ji=!0,x(w)})})),await Promise.race(m),y)throw new Error(`WebAssembly backend initializing failed due to timeout: ${t}ms`)},ve=()=>{if(Wr&&Qi)return Qi;throw new Error("WebAssembly is not initialized yet.")}}),tt,oi,ge,ba=W(()=>{Vt(),tt=(e,t)=>{let r=ve(),i=r.lengthBytesUTF8(e)+1,n=r._malloc(i);return r.stringToUTF8(e,n,i),t.push(n),n},oi=(e,t,r,i)=>{if(typeof e=="object"&&e!==null){if(r.has(e))throw new Error("Circular reference in options");r.add(e)}Object.entries(e).forEach(([n,a])=>{let s=t?t+n:n;if(typeof a=="object")oi(a,s+".",r,i);else if(typeof a=="string"||typeof a=="number")i(s,a.toString());else if(typeof a=="boolean")i(s,a?"1":"0");else throw new Error(`Can't handle extra config type: ${typeof a}`)})},ge=e=>{let t=ve(),r=t.stackSave();try{let i=t.PTR_SIZE,n=t.stackAlloc(2*i);t._OrtGetLastError(n,n+i);let a=Number(t.getValue(n,i===4?"i32":"i64")),s=t.getValue(n+i,"*"),o=s?t.UTF8ToString(s):"";throw new Error(`${e} ERROR_CODE: ${a}, ERROR_MESSAGE: ${o}`)}finally{t.stackRestore(r)}}}),_c,Oy=W(()=>{Vt(),ba(),_c=e=>{let t=ve(),r=0,i=[],n=e||{};try{if(e?.logSeverityLevel===void 0)n.logSeverityLevel=2;else if(typeof e.logSeverityLevel!="number"||!Number.isInteger(e.logSeverityLevel)||e.logSeverityLevel<0||e.logSeverityLevel>4)throw new Error(`log severity level is not valid: ${e.logSeverityLevel}`);if(e?.logVerbosityLevel===void 0)n.logVerbosityLevel=0;else if(typeof e.logVerbosityLevel!="number"||!Number.isInteger(e.logVerbosityLevel))throw new Error(`log verbosity level is not valid: ${e.logVerbosityLevel}`);e?.terminate===void 0&&(n.terminate=!1);let a=0;return e?.tag!==void 0&&(a=tt(e.tag,i)),r=t._OrtCreateRunOptions(n.logSeverityLevel,n.logVerbosityLevel,!!n.terminate,a),r===0&&ge("Can't create run options."),e?.extra!==void 0&&oi(e.extra,"",new WeakSet,(s,o)=>{let l=tt(s,i),d=tt(o,i);t._OrtAddRunConfigEntry(r,l,d)!==0&&ge(`Can't set a run config entry: ${s} - ${o}.`)}),[r,i]}catch(a){throw r!==0&&t._OrtReleaseRunOptions(r),i.forEach(s=>t._free(s)),a}}}),Qo,Jo,eu,Ct,tu,bc,Ry=W(()=>{Vt(),ba(),Qo=e=>{switch(e){case"disabled":return 0;case"basic":return 1;case"extended":return 2;case"layout":return 3;case"all":return 99;default:throw new Error(`unsupported graph optimization level: ${e}`)}},Jo=e=>{switch(e){case"sequential":return 0;case"parallel":return 1;default:throw new Error(`unsupported execution mode: ${e}`)}},eu=e=>{e.extra||(e.extra={}),e.extra.session||(e.extra.session={});let t=e.extra.session;t.use_ort_model_bytes_directly||(t.use_ort_model_bytes_directly="1"),e.executionProviders&&e.executionProviders.some(r=>(typeof r=="string"?r:r.name)==="webgpu")&&(e.enableMemPattern=!1)},Ct=(e,t,r,i)=>{let n=tt(t,i),a=tt(r,i);ve()._OrtAddSessionConfigEntry(e,n,a)!==0&&ge(`Can't set a session config entry: ${t} - ${r}.`)},tu=async(e,t,r)=>{let i=t.executionProviders;for(let n of i){let a=typeof n=="string"?n:n.name,s=[];switch(a){case"webnn":if(a="WEBNN",Ct(e,"session.disable_quant_qdq","1",r),Ct(e,"session.disable_qdq_constant_folding","1",r),typeof n!="string"){let h=n?.deviceType;h&&Ct(e,"deviceType",h,r)}break;case"webgpu":if(a="JS",typeof n!="string"){let h=n;if(h?.preferredLayout){if(h.preferredLayout!=="NCHW"&&h.preferredLayout!=="NHWC")throw new Error(`preferredLayout must be either 'NCHW' or 'NHWC': ${h.preferredLayout}`);Ct(e,"preferredLayout",h.preferredLayout,r)}}break;case"wasm":case"cpu":continue;default:throw new Error(`not supported execution provider: ${a}`)}let o=tt(a,r),l=s.length,d=0,p=0;if(l>0){d=ve()._malloc(l*ve().PTR_SIZE),r.push(d),p=ve()._malloc(l*ve().PTR_SIZE),r.push(p);for(let h=0;h<l;h++)ve().setValue(d+h*ve().PTR_SIZE,s[h][0],"*"),ve().setValue(p+h*ve().PTR_SIZE,s[h][1],"*")}await ve()._OrtAppendExecutionProvider(e,o,d,p,l)!==0&&ge(`Can't append execution provider: ${a}.`)}},bc=async e=>{let t=ve(),r=0,i=[],n=e||{};eu(n);try{let a=Qo(n.graphOptimizationLevel??"all"),s=Jo(n.executionMode??"sequential"),o=typeof n.logId=="string"?tt(n.logId,i):0,l=n.logSeverityLevel??2;if(!Number.isInteger(l)||l<0||l>4)throw new Error(`log severity level is not valid: ${l}`);let d=n.logVerbosityLevel??0;if(!Number.isInteger(d)||d<0||d>4)throw new Error(`log verbosity level is not valid: ${d}`);let p=typeof n.optimizedModelFilePath=="string"?tt(n.optimizedModelFilePath,i):0;if(r=t._OrtCreateSessionOptions(a,!!n.enableCpuMemArena,!!n.enableMemPattern,s,!!n.enableProfiling,0,o,l,d,p),r===0&&ge("Can't create session options."),n.executionProviders&&await tu(r,n,i),n.enableGraphCapture!==void 0){if(typeof n.enableGraphCapture!="boolean")throw new Error(`enableGraphCapture must be a boolean value: ${n.enableGraphCapture}`);Ct(r,"enableGraphCapture",n.enableGraphCapture.toString(),i)}if(n.freeDimensionOverrides)for(let[h,f]of Object.entries(n.freeDimensionOverrides)){if(typeof h!="string")throw new Error(`free dimension override name must be a string: ${h}`);if(typeof f!="number"||!Number.isInteger(f)||f<0)throw new Error(`free dimension override value must be a non-negative integer: ${f}`);let y=tt(h,i);t._OrtAddFreeDimensionOverride(r,y,f)!==0&&ge(`Can't set a free dimension override: ${h} - ${f}.`)}return n.extra!==void 0&&oi(n.extra,"",new WeakSet,(h,f)=>{Ct(r,h,f,i)}),[r,i]}catch(a){throw r!==0&&t._OrtReleaseSessionOptions(r)!==0&&ge("Can't release session options."),i.forEach(s=>t._free(s)),a}}}),Bt,ft,Dt,mi,ui,wa,$a,Kn,ie=W(()=>{Bt=e=>{switch(e){case"int8":return 3;case"uint8":return 2;case"bool":return 9;case"int16":return 5;case"uint16":return 4;case"int32":return 6;case"uint32":return 12;case"float16":return 10;case"float32":return 1;case"float64":return 11;case"string":return 8;case"int64":return 7;case"uint64":return 13;case"int4":return 22;case"uint4":return 21;default:throw new Error(`unsupported data type: ${e}`)}},ft=e=>{switch(e){case 3:return"int8";case 2:return"uint8";case 9:return"bool";case 5:return"int16";case 4:return"uint16";case 6:return"int32";case 12:return"uint32";case 10:return"float16";case 1:return"float32";case 11:return"float64";case 8:return"string";case 7:return"int64";case 13:return"uint64";case 22:return"int4";case 21:return"uint4";default:throw new Error(`unsupported data type: ${e}`)}},Dt=(e,t)=>{let r=[-1,4,1,1,2,2,4,8,-1,1,2,8,4,8,-1,-1,-1,-1,-1,-1,-1,.5,.5][e],i=typeof t=="number"?t:t.reduce((n,a)=>n*a,1);return r>0?Math.ceil(i*r):void 0},mi=e=>{switch(e){case"float16":return typeof Float16Array<"u"?Float16Array:Uint16Array;case"float32":return Float32Array;case"uint8":return Uint8Array;case"int8":return Int8Array;case"uint16":return Uint16Array;case"int16":return Int16Array;case"int32":return Int32Array;case"bool":return Uint8Array;case"float64":return Float64Array;case"uint32":return Uint32Array;case"int64":return BigInt64Array;case"uint64":return BigUint64Array;default:throw new Error(`unsupported type: ${e}`)}},ui=e=>{switch(e){case"verbose":return 0;case"info":return 1;case"warning":return 2;case"error":return 3;case"fatal":return 4;default:throw new Error(`unsupported logging level: ${e}`)}},wa=e=>e==="float32"||e==="float16"||e==="int32"||e==="int64"||e==="uint32"||e==="uint8"||e==="bool"||e==="uint4"||e==="int4",$a=e=>e==="float32"||e==="float16"||e==="int32"||e==="int64"||e==="uint32"||e==="uint64"||e==="int8"||e==="uint8"||e==="bool"||e==="uint4"||e==="int4",Kn=e=>{switch(e){case"none":return 0;case"cpu":return 1;case"cpu-pinned":return 2;case"texture":return 3;case"gpu-buffer":return 4;case"ml-tensor":return 5;default:throw new Error(`unsupported data location: ${e}`)}}}),va,wc=W(()=>{ga(),va=async e=>{if(typeof e=="string"){let t=await fetch(e);if(!t.ok)throw new Error(`failed to load external data file: ${e}`);let r=t.headers.get("Content-Length"),i=r?parseInt(r,10):0;if(i<1073741824)return new Uint8Array(await t.arrayBuffer());{if(!t.body)throw new Error(`failed to load external data file: ${e}, no response body.`);let n=t.body.getReader(),a;try{a=new ArrayBuffer(i)}catch(o){if(o instanceof RangeError){let l=Math.ceil(i/65536);a=new WebAssembly.Memory({initial:l,maximum:l}).buffer}else throw o}let s=0;for(;;){let{done:o,value:l}=await n.read();if(o)break;let d=l.byteLength;new Uint8Array(a,s,d).set(l),s+=d}return new Uint8Array(a,0,i)}}else return e instanceof Blob?new Uint8Array(await e.arrayBuffer()):e instanceof Uint8Array?e:new Uint8Array(e)}}),ru,iu,nu,au,xa,su,pe,mt=W(()=>{ie(),ru=["V","I","W","E","F"],iu=(e,t)=>{console.log(`[${ru[e]},${new Date().toISOString()}]${t}`)},xa=(e,t)=>{nu=e,au=t},su=(e,t)=>{let r=ui(e),i=ui(nu);r>=i&&iu(r,typeof t=="function"?t():t)},pe=(...e)=>{au&&su(...e)}}),ou,tr,R,li,$c,vc,xc,ne=W(()=>{ou=class{static calcMatMulShape(e,t){return e[1]!==t[0]?void 0:[e[0],t[1]]}},tr=class{static calcShape(e,t,r=!1){let i=e.length,n=t.length;if(i===0)return t;if(n===0)return e;let a=Math.max(e.length,t.length),s=new Array(a);if(r){if(i<2||n<2)return;let o=ou.calcMatMulShape([e[i-2],e[i-1]],[t[n-2],t[n-1]]);if(o===void 0)return;[s[a-2],s[a-1]]=o}for(let o=r?3:1;o<=a;o++){let l=i-o<0?1:e[i-o],d=n-o<0?1:t[n-o];if(l!==d&&l>1&&d>1)return;let p=Math.max(l,d);if(l&&d)s[a-o]=Math.max(l,d);else{if(p>1)return;s[a-o]=0}}return s}static isValidBroadcast(e,t){let r=e.length,i=t.length;if(r>i)return!1;for(let n=1;n<=r;n++)if(e[r-n]!==1&&e[r-n]!==t[i-n])return!1;return!0}},R=class ri{static size(t){return ri.getSizeFromDimensionRange(t,0,t.length)}static convertShape(t,r=4){let i=t.length;if(i===0)return[];let n=new Array(i),a=i-1;for(;a>=0;){if(t[a]%r===0){n[a]=t[a]/r;break}if(r%t[a]!==0)throw new Error("cannot convert shape");n[a]=1,r/=t[a],a--}for(a--;a>=0;a--)n[a]=t[a];return n}static sizeFromDimension(t,r){if(r<0||r>t.length)throw new Error(`invalid dimension of ${r} for sizeFromDimension as Tensor has ${t.length} dimensions.`);return ri.getSizeFromDimensionRange(t,r,t.length)}static sizeToDimension(t,r){if(r<0||r>t.length)throw new Error(`invalid dimension of ${r} for sizeToDimension as Tensor has ${t.length} dimensions.`);return ri.getSizeFromDimensionRange(t,0,r)}static getSizeFromDimensionRange(t,r,i){let n=1;for(let a=r;a<i;a++){if(t[a]<0)throw new Error("cannot get valid size from specified dimension range. Most likely the range contains negative values in them.");n*=Number(t[a])}return n}static computeStrides(t){let r=t.length;if(r===0)return[];if(r===1)return[1];let i=new Array(r);i[r-1]=1,i[r-2]=t[r-1];for(let n=r-3;n>=0;--n)i[n]=i[n+1]*t[n+1];return i}static normalizeAxis(t,r){if(t<-r&&t>=r)throw new Error("unsupported axis for this operation.");return t<0?t+r:t}static normalizeAxes(t,r){return t.map(i=>this.normalizeAxis(i,r??t.length))}static sortBasedOnPerm(t,r){return r?r.map(i=>t[i]):t.slice().reverse()}static padShape(t,r){let i=t.length;return t.map((n,a)=>n+r[a]+r[a+i])}static areEqual(t,r){return t.length!==r.length?!1:t.every((i,n)=>i===r[n])}},li=class wr{static adjustPoolAttributes(t,r,i,n,a,s){if(!t&&i.length!==r.length-2)throw new Error("length of specified kernel shapes should be 2 less than length of input dimensions");if(t)for(let o=0;o<r.length-2;o++)o>=i.length?i.push(r[o+2]):i[o]=r[o+2];for(let o=0;o<i.length;o++)if(o<n.length){if(n[o]<0)throw new Error("strides should be greater than or equal to 1")}else n.push(1);for(let o=0;o<i.length;o++)if(o<a.length){if(a[o]<0)throw new Error("dilations should be greater than or equal to 1")}else a.push(1);for(let o=0;o<i.length*2;o++)if(o<s.length){if(s[o]<0)throw new Error("pad should be greater than or equal to 1")}else s.push(0);for(let o=0;o<i.length;o++){if(i[o]<=0)throw new Error("kernel shapes need to be greater than 0");if(s[o]>=i[o]||s[o+i.length]>=i[o])throw new Error("pads should be smaller than kernel")}}static adjustPadsBasedOnAutoPad(t,r,i,n,a,s,o){if(o){if(a.length!==2*(t.length-2))throw new Error("length of pads should be twice the length of data dimensions");if(r.length!==t.length-2)throw new Error("length of strides should be the length of data dimensions");if(n.length!==t.length-2)throw new Error("length of kernel shapes should be the length of data dimensions");for(let l=0;l<t.length-2;l++)wr.adjustPadAndReturnShape(t[l+(s?1:2)],r[l],i[l],n[l],a,l,l+t.length-2,o)}}static computePoolOutputShape(t,r,i,n,a,s,o){if(r.length<=0)throw new Error("input shape must be of size greater than 0");let l=[r[0],r[1]];return wr.computeShapeHelper(t,r,l,i,n,a,s,o),l}static computeConvOutputShape(t,r,i,n,a,s,o){if(t.length<=0||r.length<=0)throw new Error("invalid input tensor dims or invalid filter tensor dims");let l=[t[0],r[0]];return wr.computeShapeHelper(!1,t,l,i,n,a,s,o),l}static computeShapeHelper(t,r,i,n,a,s,o,l){if(t)for(let d=0;d<r.length-2;d++)i.push(1);else for(let d=0;d<r.length-2;d++)i.push(wr.adjustPadAndReturnShape(r[d+2],n[d],a[d],s[d],o,d,d+r.length-2,l))}static adjustPadAndReturnShape(t,r,i,n,a,s,o,l){let d=i*(n-1)+1;if(l&&l!=="NOTSET")switch(l){case"VALID":return a[s]=0,a[o]=0,Math.floor((t-d)/r+1);case"SAME_LOWER":case"SAME_UPPER":if(i!==1)throw new Error("Dilation not supported for SAME_UPPER or SAME_LOWER");{let p=((t+r-1)/r-1)*r+n-t;return a[s]=Math.floor(l==="SAME_LOWER"?(p+1)/2:p/2),a[o]=p-a[s],Math.floor((t+p-n)/r+1)}default:throw new Error("Unsupported AutoPad type")}else return Math.floor((t+a[s]+a[o]-d)/r+1)}},$c=class{static getShapeOfGemmResult(e,t,r,i,n){if(e.length!==2||r.length!==2)throw new Error("shape need to be of size 2");let a,s,o;t?(a=e[1],s=e[0]):(a=e[0],s=e[1]);let l=-1;if(i?(o=r[0],l=1):(o=r[1],l=0),r[l]!==s)throw new Error("dimension mismatch");if(a<=0||o<=0||s<=0)throw new Error("invalid shape specified");if(n&&!tr.isValidBroadcast(n,[a,o]))throw new Error("gemm: invalid bias shape for broadcast");return[a,o,s]}},vc=-34028234663852886e22,xc=34028234663852886e22}),Sa,Sc=W(()=>{ie(),Sa=(e,t)=>new(mi(t))(e)}),en,Xn,tn,uu,rn,lu,nn,an,sn,du,kc,Ny=W(()=>{ie(),mt(),en=new Map([["float32",32],["float16",16],["int32",32],["uint32",32],["int64",64],["uint64",64],["int8",8],["uint8",8],["int4",4],["uint4",4]]),Xn=(e,t)=>{if(t==="int32")return e;let r=en.get(t);if(!r)throw new Error(`WebNN backend does not support data type: ${t}`);let i=r/8;if(e.byteLength%i!==0)throw new Error(`Invalid Uint8Array length - must be a multiple of ${i}.`);let n=e.byteLength/i,a=new(mi(t))(e.buffer,e.byteOffset,n);switch(t){case"int64":case"uint64":{let s=new Int32Array(n);for(let o=0;o<n;o++){let l=a[o];if(l>2147483647n||l<-2147483648n)throw new Error("Can not convert int64 data to int32 - value out of range.");s[o]=Number(l)}return new Uint8Array(s.buffer)}case"int8":case"uint8":case"uint32":{if(t==="uint32"&&a.some(o=>o>2147483647))throw new Error("Can not convert uint32 data to int32 - value out of range.");let s=Int32Array.from(a,Number);return new Uint8Array(s.buffer)}default:throw new Error(`Unsupported data conversion from ${t} to 'int32'`)}},tn=(e,t)=>{if(t==="int32")return e;if(e.byteLength%4!==0)throw new Error("Invalid Uint8Array length - must be a multiple of 4 (int32).");let r=e.byteLength/4,i=new Int32Array(e.buffer,e.byteOffset,r);switch(t){case"int64":{let n=BigInt64Array.from(i,BigInt);return new Uint8Array(n.buffer)}case"uint64":{if(i.some(a=>a<0))throw new Error("Can not convert int32 data to uin64 - negative value found.");let n=BigUint64Array.from(i,BigInt);return new Uint8Array(n.buffer)}case"int8":{if(i.some(a=>a<-128||a>127))throw new Error("Can not convert int32 data to int8 - value out of range.");let n=Int8Array.from(i,Number);return new Uint8Array(n.buffer)}case"uint8":{if(i.some(n=>n<0||n>255))throw new Error("Can not convert int32 data to uint8 - value out of range.");return Uint8Array.from(i,Number)}case"uint32":{if(i.some(a=>a<0))throw new Error("Can not convert int32 data to uint32 - negative value found.");let n=Uint32Array.from(i,Number);return new Uint8Array(n.buffer)}default:throw new Error(`Unsupported data conversion from 'int32' to ${t}`)}},uu=1,rn=()=>uu++,lu=new Map([["int8","int32"],["uint8","int32"],["uint32","int32"],["int64","int32"]]),nn=(e,t)=>{let r=en.get(e);if(!r)throw new Error(`WebNN backend does not support data type: ${e}`);return t.length>0?Math.ceil(t.reduce((i,n)=>i*n)*r/8):0},an=class{constructor(e){this.isDataConverted=!1;let{sessionId:t,context:r,tensor:i,dataType:n,shape:a,fallbackDataType:s}=e;this.sessionId=t,this.mlContext=r,this.mlTensor=i,this.dataType=n,this.tensorShape=a,this.fallbackDataType=s}get tensor(){return this.mlTensor}get type(){return this.dataType}get fallbackType(){return this.fallbackDataType}get shape(){return this.tensorShape}get byteLength(){return nn(this.dataType,this.tensorShape)}destroy(){pe("verbose",()=>"[WebNN] TensorWrapper.destroy"),this.mlTensor.destroy()}write(e){this.mlContext.writeTensor(this.mlTensor,e)}async read(e){if(this.fallbackDataType){let t=await this.mlContext.readTensor(this.mlTensor),r=tn(new Uint8Array(t),this.dataType);if(e){(e instanceof ArrayBuffer?new Uint8Array(e):new Uint8Array(e.buffer,e.byteOffset,e.byteLength)).set(r);return}else return new Uint8Array(r).buffer}else return e?this.mlContext.readTensor(this.mlTensor,e):this.mlContext.readTensor(this.mlTensor)}canReuseTensor(e,t,r){return this.mlContext===e&&this.dataType===t&&this.tensorShape.length===r.length&&this.tensorShape.every((i,n)=>i===r[n])}setIsDataConverted(e){this.isDataConverted=e}},sn=class{constructor(e,t){this.tensorManager=e,this.wrapper=t}get tensorWrapper(){return this.wrapper}releaseTensor(){this.tensorWrapper&&(this.tensorManager.releaseTensor(this.tensorWrapper),this.wrapper=void 0)}async ensureTensor(e,t,r,i){let n=this.tensorManager.getMLContext(e),a=this.tensorManager.getMLOpSupportLimits(e),s;if(!a?.input.dataTypes.includes(t)){if(s=lu.get(t),!s||a?.input.dataTypes.includes(s))throw new Error(`WebNN backend does not support data type: ${t}`);pe("verbose",()=>`[WebNN] TensorIdTracker.ensureTensor: fallback dataType from ${t} to ${s}`)}if(this.wrapper){if(this.wrapper.canReuseTensor(n,t,r))return this.wrapper.tensor;if(i){if(this.wrapper.byteLength!==nn(t,r))throw new Error("Unable to copy data to tensor with different size.");this.activeUpload=new Uint8Array(await this.wrapper.read())}this.tensorManager.releaseTensor(this.wrapper)}let o=typeof MLTensorUsage>"u"?void 0:MLTensorUsage.READ|MLTensorUsage.WRITE;return this.wrapper=await this.tensorManager.getCachedTensor(e,t,r,o,!0,!0,s),i&&this.activeUpload&&(this.wrapper.write(this.activeUpload),this.activeUpload=void 0),this.wrapper.tensor}upload(e){let t=e;if(this.wrapper){if(this.wrapper.fallbackType)if(this.wrapper.fallbackType==="int32")t=Xn(e,this.wrapper.type),this.wrapper.setIsDataConverted(!0);else throw new Error(`Unsupported fallback data type: ${this.wrapper.fallbackType}`);if(e.byteLength===this.wrapper.byteLength){this.wrapper.write(t);return}else pe("verbose",()=>"Data size does not match tensor size. Releasing tensor."),this.releaseTensor()}this.activeUpload?this.activeUpload.set(t):this.activeUpload=new Uint8Array(t)}async download(e){if(this.activeUpload){let t=this.wrapper?.isDataConverted?tn(this.activeUpload,this.wrapper?.type):this.activeUpload;if(e){e instanceof ArrayBuffer?new Uint8Array(e).set(t):new Uint8Array(e.buffer,e.byteOffset,e.byteLength).set(t);return}else return t.buffer}if(!this.wrapper)throw new Error("Tensor has not been created.");return e?this.wrapper.read(e):this.wrapper.read()}},du=class{constructor(e){this.backend=e,this.tensorTrackersById=new Map,this.freeTensors=[],this.externalTensors=new Set}getMLContext(e){let t=this.backend.getMLContext(e);if(!t)throw new Error("MLContext not found for session.");return t}getMLOpSupportLimits(e){return this.backend.getMLOpSupportLimits(e)}reserveTensorId(){let e=rn();return this.tensorTrackersById.set(e,new sn(this)),e}releaseTensorId(e){let t=this.tensorTrackersById.get(e);t&&(this.tensorTrackersById.delete(e),t.tensorWrapper&&this.releaseTensor(t.tensorWrapper))}async ensureTensor(e,t,r,i,n){pe("verbose",()=>`[WebNN] TensorManager.ensureTensor {tensorId: ${t}, dataType: ${r}, shape: ${i}, copyOld: ${n}}`);let a=this.tensorTrackersById.get(t);if(!a)throw new Error("Tensor not found.");return a.ensureTensor(e,r,i,n)}upload(e,t){let r=this.tensorTrackersById.get(e);if(!r)throw new Error("Tensor not found.");r.upload(t)}async download(e,t){pe("verbose",()=>`[WebNN] TensorManager.download {tensorId: ${e}, dstBuffer: ${t?.byteLength}}`);let r=this.tensorTrackersById.get(e);if(!r)throw new Error("Tensor not found.");return r.download(t)}releaseTensorsForSession(e){for(let t of this.freeTensors)t.sessionId===e&&t.destroy();this.freeTensors=this.freeTensors.filter(t=>t.sessionId!==e)}registerTensor(e,t,r,i){let n=this.getMLContext(e),a=rn(),s=new an({sessionId:e,context:n,tensor:t,dataType:r,shape:i});return this.tensorTrackersById.set(a,new sn(this,s)),this.externalTensors.add(s),a}async getCachedTensor(e,t,r,i,n,a,s){let o=this.getMLContext(e);for(let[d,p]of this.freeTensors.entries())if(p.canReuseTensor(o,t,r)){pe("verbose",()=>`[WebNN] Reusing tensor {dataType: ${t}, ${s?`fallbackDataType: ${s},`:""} shape: ${r}`);let h=this.freeTensors.splice(d,1)[0];return h.sessionId=e,h}pe("verbose",()=>`[WebNN] MLContext.createTensor {dataType: ${t}, ${s?`fallbackDataType: ${s},`:""} shape: ${r}}`);let l=await o.createTensor({dataType:s??t,shape:r,dimensions:r,usage:i,writable:n,readable:a});return new an({sessionId:e,context:o,tensor:l,dataType:t,shape:r,fallbackDataType:s})}releaseTensor(e){this.externalTensors.has(e)&&this.externalTensors.delete(e),this.freeTensors.push(e)}},kc=(...e)=>new du(...e)}),dr,pu,Tc,By=W(()=>{ie(),Vt(),Sc(),Ny(),mt(),dr=new Map([[1,"float32"],[10,"float16"],[6,"int32"],[12,"uint32"],[7,"int64"],[13,"uint64"],[22,"int4"],[21,"uint4"],[3,"int8"],[2,"uint8"],[9,"uint8"]]),pu=(e,t)=>{if(e===t)return!0;if(e===void 0||t===void 0)return!1;let r=Object.keys(e).sort(),i=Object.keys(t).sort();return r.length===i.length&&r.every((n,a)=>n===i[a]&&e[n]===t[n])},Tc=class{constructor(e){this.tensorManager=kc(this),this.mlContextBySessionId=new Map,this.sessionIdsByMLContext=new Map,this.mlContextCache=[],this.sessionGraphInputs=new Map,this.sessionGraphOutputs=new Map,this.temporaryGraphInputs=[],this.temporaryGraphOutputs=[],this.temporarySessionTensorIds=new Map,this.mlOpSupportLimitsBySessionId=new Map,xa(e.logLevel,!!e.debug)}get currentSessionId(){if(this.activeSessionId===void 0)throw new Error("No active session");return this.activeSessionId}onRunStart(e){pe("verbose",()=>`[WebNN] onRunStart {sessionId: ${e}}`),this.activeSessionId=e}onRunEnd(e){pe("verbose",()=>`[WebNN] onRunEnd {sessionId: ${e}}`);let t=this.temporarySessionTensorIds.get(e);if(t){for(let r of t)pe("verbose",()=>`[WebNN] releasing temporary tensor {tensorId: ${r}}`),this.tensorManager.releaseTensorId(r);this.temporarySessionTensorIds.delete(e),this.activeSessionId=void 0}}async createMLContext(e){if(e instanceof GPUDevice){let r=this.mlContextCache.findIndex(i=>i.gpuDevice===e);if(r!==-1)return this.mlContextCache[r].mlContext;{let i=await navigator.ml.createContext(e);return this.mlContextCache.push({gpuDevice:e,mlContext:i}),i}}else if(e===void 0){let r=this.mlContextCache.findIndex(i=>i.options===void 0&&i.gpuDevice===void 0);if(r!==-1)return this.mlContextCache[r].mlContext;{let i=await navigator.ml.createContext();return this.mlContextCache.push({mlContext:i}),i}}let t=this.mlContextCache.findIndex(r=>pu(r.options,e));if(t!==-1)return this.mlContextCache[t].mlContext;{let r=await navigator.ml.createContext(e);return this.mlContextCache.push({options:e,mlContext:r}),r}}registerMLContext(e,t){this.mlContextBySessionId.set(e,t);let r=this.sessionIdsByMLContext.get(t);r||(r=new Set,this.sessionIdsByMLContext.set(t,r)),r.add(e),this.mlOpSupportLimitsBySessionId.has(e)||this.mlOpSupportLimitsBySessionId.set(e,t.opSupportLimits()),this.temporaryGraphInputs.length>0&&(this.sessionGraphInputs.set(e,this.temporaryGraphInputs),this.temporaryGraphInputs=[]),this.temporaryGraphOutputs.length>0&&(this.sessionGraphOutputs.set(e,this.temporaryGraphOutputs),this.temporaryGraphOutputs=[])}onReleaseSession(e){this.sessionGraphInputs.delete(e),this.sessionGraphOutputs.delete(e);let t=this.mlContextBySessionId.get(e);if(!t)return;this.tensorManager.releaseTensorsForSession(e),this.mlContextBySessionId.delete(e),this.mlOpSupportLimitsBySessionId.delete(e);let r=this.sessionIdsByMLContext.get(t);if(r.delete(e),r.size===0){this.sessionIdsByMLContext.delete(t);let i=this.mlContextCache.findIndex(n=>n.mlContext===t);i!==-1&&this.mlContextCache.splice(i,1)}}getMLContext(e){return this.mlContextBySessionId.get(e)}getMLOpSupportLimits(e){return this.mlOpSupportLimitsBySessionId.get(e)}reserveTensorId(){return this.tensorManager.reserveTensorId()}releaseTensorId(e){pe("verbose",()=>`[WebNN] releaseTensorId {tensorId: ${e}}`),this.tensorManager.releaseTensorId(e)}async ensureTensor(e,t,r,i,n){let a=dr.get(r);if(!a)throw new Error(`Unsupported ONNX data type: ${r}`);return this.tensorManager.ensureTensor(e??this.currentSessionId,t,a,i,n)}async createTemporaryTensor(e,t,r){pe("verbose",()=>`[WebNN] createTemporaryTensor {onnxDataType: ${t}, shape: ${r}}`);let i=dr.get(t);if(!i)throw new Error(`Unsupported ONNX data type: ${t}`);let n=this.tensorManager.reserveTensorId();await this.tensorManager.ensureTensor(e,n,i,r,!1);let a=this.temporarySessionTensorIds.get(e);return a?a.push(n):this.temporarySessionTensorIds.set(e,[n]),n}uploadTensor(e,t){if(!ve().shouldTransferToMLTensor)throw new Error("Trying to upload to a MLTensor while shouldTransferToMLTensor is false");pe("verbose",()=>`[WebNN] uploadTensor {tensorId: ${e}, data: ${t.byteLength}}`),this.tensorManager.upload(e,t)}async downloadTensor(e,t){return this.tensorManager.download(e,t)}createMLTensorDownloader(e,t){return async()=>{let r=await this.tensorManager.download(e);return Sa(r,t)}}registerMLTensor(e,t,r,i){let n=dr.get(r);if(!n)throw new Error(`Unsupported ONNX data type: ${r}`);let a=this.tensorManager.registerTensor(e,t,n,i);return pe("verbose",()=>`[WebNN] registerMLTensor {tensor: ${t}, dataType: ${n}, dimensions: ${i}} -> {tensorId: ${a}}`),a}registerMLConstant(e,t,r,i,n,a,s=!1){if(!a)throw new Error("External mounted files are not available.");let o=e;e.startsWith("./")&&(o=e.substring(2));let l=a.get(o);if(!l)throw new Error(`File with name ${o} not found in preloaded files.`);if(t+r>l.byteLength)throw new Error("Out of bounds: data offset and length exceed the external file data size.");let d=l.slice(t,t+r).buffer,p;switch(n.dataType){case"float32":p=new Float32Array(d);break;case"float16":p=typeof Float16Array<"u"?new Float16Array(d):new Uint16Array(d);break;case"int32":p=new Int32Array(d);break;case"uint32":p=new Uint32Array(d);break;case"int64":if(s){let h=Xn(new Uint8Array(d),"int64");p=new Int32Array(h.buffer),n.dataType="int32"}else p=new BigInt64Array(d);break;case"uint64":p=new BigUint64Array(d);break;case"int8":p=new Int8Array(d);break;case"int4":case"uint4":case"uint8":p=new Uint8Array(d);break;default:throw new Error(`Unsupported data type: ${n.dataType} in creating WebNN Constant from external data.`)}return pe("verbose",()=>`[WebNN] registerMLConstant {dataType: ${n.dataType}, shape: ${n.shape}}} ${s?"(Note: it was int64 data type and registered to int32 as workaround)":""}`),i.constant(n,p)}registerGraphInput(e){this.temporaryGraphInputs.push(e)}registerGraphOutput(e){this.temporaryGraphOutputs.push(e)}isGraphInput(e,t){let r=this.sessionGraphInputs.get(e);return r?r.includes(t):!1}isGraphOutput(e,t){let r=this.sessionGraphOutputs.get(e);return r?r.includes(t):!1}isGraphInputOutputTypeSupported(e,t,r=!0){let i=dr.get(Bt(t)),n=this.mlOpSupportLimitsBySessionId.get(e);return typeof i>"u"?!1:r?!!n?.input.dataTypes.includes(i):!!n?.output.dataTypes.includes(i)}flush(){}}}),ka=W(()=>{}),on,Gr,Vr,cu,hu,un,Zn,fu,Ic,Dy=W(()=>{mt(),ka(),on=new Map([[64,250],[128,200],[256,200],[512,200],[2048,230],[4096,200],[8192,50],[16384,50],[32768,50],[65536,50],[131072,50],[262144,50],[524288,50],[1048576,50],[2097152,30],[4194304,20],[8388608,10],[12582912,10],[16777216,10],[26214400,15],[33554432,22],[44236800,2],[58982400,6],[67108864,6],[134217728,6],[167772160,6]]),Gr=[],Vr=e=>Math.ceil(Number(e)/16)*16,cu=e=>{for(let t=0;t<Gr.length;t++){let r=Gr[t];if(e<=r)return r}return Math.ceil(e/16)*16},hu=1,un=()=>hu++,Zn=async(e,t,r,i)=>{let n=Vr(r),a=e.device.createBuffer({size:n,usage:GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ});try{let s=e.getCommandEncoder();e.endComputePass(),s.copyBufferToBuffer(t,0,a,0,n),e.flush(),await a.mapAsync(GPUMapMode.READ);let o=a.getMappedRange();if(i){let l=i();return l.set(new Uint8Array(o,0,r)),l}else return new Uint8Array(o.slice(0,r))}finally{a.destroy()}},fu=class{constructor(e){this.backend=e,this.storageCache=new Map,this.freeBuffers=new Map,this.freeUniformBuffers=new Map,this.buffersPending=[],this.capturedPendingBuffers=new Map;for(let[t]of on)Gr.push(t),this.freeBuffers.set(t,[]),this.freeUniformBuffers.set(t,[]);this.sessionCount=0}upload(e,t){let r=t.buffer,i=t.byteOffset,n=t.byteLength,a=Vr(n),s=this.storageCache.get(e);if(!s)throw new Error("gpu data for uploading does not exist");if(Number(s.originalSize)!==n)throw new Error(`inconsistent data size. gpu data size=${s.originalSize}, data size=${n}`);let o=this.backend.device.createBuffer({mappedAtCreation:!0,size:a,usage:GPUBufferUsage.MAP_WRITE|GPUBufferUsage.COPY_SRC}),l=o.getMappedRange();new Uint8Array(l).set(new Uint8Array(r,i,n)),o.unmap();let d=this.backend.device.createCommandEncoder();d.copyBufferToBuffer(o,0,s.gpuData.buffer,0,a),this.backend.device.queue.submit([d.finish()]),o.destroy(),pe("verbose",()=>`[WebGPU] GpuDataManager.upload(id=${e})`)}memcpy(e,t){let r=this.storageCache.get(e);if(!r)throw new Error("source gpu data for memcpy does not exist");let i=this.storageCache.get(t);if(!i)throw new Error("destination gpu data for memcpy does not exist");if(r.originalSize!==i.originalSize)throw new Error("inconsistent source and destination gpu data size");let n=Vr(r.originalSize),a=this.backend.getCommandEncoder();this.backend.endComputePass(),a.copyBufferToBuffer(r.gpuData.buffer,0,i.gpuData.buffer,0,n)}registerExternalBuffer(e,t,r){let i;if(r){if(i=r[0],e===r[1])return pe("verbose",()=>`[WebGPU] GpuDataManager.registerExternalBuffer(size=${t}) => id=${i}, buffer is the same, skip.`),i;if(this.backend.capturedCommandList.has(this.backend.currentSessionId))throw new Error(`Registering a different external buffer under graph capture mode is not supported yet.
             Please use the previous external buffer!`)}else i=un();return this.storageCache.set(i,{gpuData:{id:i,type:0,buffer:e},originalSize:t}),pe("verbose",()=>`[WebGPU] GpuDataManager.registerExternalBuffer(size=${t}) => id=${i}, registered.`),i}unregisterExternalBuffer(e){e!==void 0&&(this.storageCache.delete(e),pe("verbose",()=>`[WebGPU] GpuDataManager.unregisterExternalBuffer() => id=${e}`))}create(e,t=GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC|GPUBufferUsage.COPY_DST){let r=cu(e),i,n=(t&GPUBufferUsage.STORAGE)===GPUBufferUsage.STORAGE,a=(t&GPUBufferUsage.UNIFORM)===GPUBufferUsage.UNIFORM;if(n||a){let o=(n?this.freeBuffers:this.freeUniformBuffers).get(r);o?o.length>0?i=o.pop():i=this.backend.device.createBuffer({size:r,usage:t}):i=this.backend.device.createBuffer({size:r,usage:t})}else i=this.backend.device.createBuffer({size:r,usage:t});let s={id:un(),type:0,buffer:i};return this.storageCache.set(s.id,{gpuData:s,originalSize:Number(e)}),pe("verbose",()=>`[WebGPU] GpuDataManager.create(size=${e}) => id=${s.id}`),s}get(e){return this.storageCache.get(e)?.gpuData}release(e){let t=typeof e=="bigint"?Number(e):e,r=this.storageCache.get(t);if(!r){if(this.storageCache.size===0)return 0;throw new Error("releasing data does not exist")}return pe("verbose",()=>`[WebGPU] GpuDataManager.release(id=${t}), gpuDataId=${r.gpuData.id}`),this.storageCache.delete(t),this.buffersPending.push(r.gpuData.buffer),r.originalSize}async download(e,t){let r=this.storageCache.get(Number(e));if(!r)throw new Error("data does not exist");await Zn(this.backend,r.gpuData.buffer,r.originalSize,t)}refreshPendingBuffers(){if(this.buffersPending.length!==0)if(this.backend.sessionStatus==="default"){for(let e of this.buffersPending){let t=on.get(e.size);if((e.usage&GPUBufferUsage.STORAGE)===GPUBufferUsage.STORAGE){let r=this.freeBuffers.get(e.size)||[];t===void 0||r.length>=t?e.destroy():r.push(e)}else if((e.usage&GPUBufferUsage.UNIFORM)===GPUBufferUsage.UNIFORM){let r=this.freeUniformBuffers.get(e.size)||[];t===void 0||r.length>=t?e.destroy():r.push(e)}else e.destroy()}this.buffersPending=[]}else{let e=this.capturedPendingBuffers.get(this.backend.currentSessionId);e||(e=[],this.capturedPendingBuffers.set(this.backend.currentSessionId,e));for(let t of this.buffersPending)e.push(t);this.buffersPending=[]}}dispose(){this.freeBuffers.forEach(e=>{e.forEach(t=>{t.destroy()})}),this.freeUniformBuffers.forEach(e=>{e.forEach(t=>{t.destroy()})}),this.storageCache.forEach(e=>{e.gpuData.buffer.destroy()}),this.capturedPendingBuffers.forEach(e=>{e.forEach(t=>{t.destroy()})}),this.storageCache=new Map,this.freeBuffers=new Map,this.freeUniformBuffers=new Map,this.capturedPendingBuffers=new Map}onCreateSession(){this.sessionCount+=1}onReleaseSession(e){let t=this.capturedPendingBuffers.get(e);t&&(t.forEach(r=>{r.destroy()}),this.capturedPendingBuffers.delete(e)),this.sessionCount-=1,this.sessionCount===0&&(pe("warning",()=>"[WebGPU] Clearing webgpu buffer cache"),this.storageCache.forEach(r=>{r.gpuData.buffer.destroy()}),this.storageCache=new Map)}},Ic=(...e)=>new fu(...e)}),mu,me,ze=W(()=>{mu=class{constructor(e){Object.assign(this,e)}get cacheKey(){return this.key||(this.key=Object.getOwnPropertyNames(this).sort().map(e=>`${this[e]}`).join(";")),this.key}},me=e=>new mu(e)}),rr,Fr,Oe,Be,re,Ie,Yn,Qt,St,te,pr,U,J,Ec,Ta,gu,Cc,ae=W(()=>{ie(),ne(),rr=64,Fr=(e,t)=>{if(t===3)throw new Error("vec3 has same alignment as vec4, use vec4 instead");switch(Number(e)){case 10:return t>1?`vec${t}<f16>`:"f16";case 1:return t>1?`vec${t}<f32>`:"f32";case 6:return t>1?`vec${t}<i32>`:"i32";case 12:return t>1?`vec${t}<u32>`:"u32";case 7:if(t>1)throw new Error("currently not supported vecX of uint64 yet");return["vec2<u32>","i32"];case 13:if(t>1)throw new Error("currently not supported vecX of uint64 yet");return["vec2<u32>","u32"];case 9:if(t!==4)throw new Error("bool must be vec4");return["u32","vec4<bool>"];case 22:return"i32";case 21:return"u32";default:throw new Error(`Unknown data type: ${e}`)}},Oe=(e,t=1)=>{let r=Fr(e,t);return typeof r=="string"?r:r[0]},Be=(e,t=1)=>{let r=Fr(e,t);return typeof r=="string"?r:r[1]},re=(...e)=>{let t=[];return e.forEach(r=>{r.length!==0&&t.push({type:12,data:r},{type:12,data:R.computeStrides(r)})}),t},Ie=e=>e%4===0?4:e%2===0?2:1,Yn=(e="f32",t,r="0")=>!t||t===1?`${e}(${r})`:`vec${t}<${e}>(${r})`,Qt=(e,t,r)=>e==="f32"?r:t===1?`f32(${r})`:`vec${t}<f32>(${r})`,St=(e,t)=>t===4?`(${e}.x + ${e}.y + ${e}.z + ${e}.w)`:t===2?`(${e}.x + ${e}.y)`:t===3?`(${e}.x + ${e}.y + ${e}.z)`:e,te=(e,t,r,i)=>e.startsWith("uniforms.")&&r>4?typeof t=="string"?i==="f16"?`${e}[(${t}) / 8][(${t}) % 8 / 4][(${t}) % 8 % 4]`:`${e}[(${t}) / 4][(${t}) % 4]`:i==="f16"?`${e}[${Math.floor(t/8)}][${Math.floor(t%8/4)}][${t%8%4}]`:`${e}[${Math.floor(t/4)}][${t%4}]`:r>1?`${e}[${t}]`:e,pr=(e,t,r,i,n)=>{let a=typeof r=="number",s=a?r:r.length,o=[...new Array(s).keys()],l=s<2?"u32":s<=4?`vec${s}<u32>`:`array<u32, ${s}>`,d=Fr(t,n),p=typeof d=="string"?d:d[1],h=typeof d=="string"?d:d[0],f={indices:l,value:p,storage:h,tensor:t},y=A=>typeof A=="string"?A:`${A}u`,m={offsetToIndices:!1,indicesToOffset:!1,broadcastedIndicesToOffset:!1,set:!1,setByIndices:!1,get:!1,getByIndices:!1},b=a?"uniforms.":"",x=`${b}${e}_shape`,$=`${b}${e}_strides`,w="";for(let A=0;A<s-1;A++)w+=`
    let dim${A} = current / ${te($,A,s)};
    let rest${A} = current % ${te($,A,s)};
    indices[${A}] = dim${A};
    current = rest${A};
    `;w+=`indices[${s-1}] = current;`;let S=s<2?"":`
  fn o2i_${e}(offset: u32) -> ${f.indices} {
    var indices: ${f.indices};
    var current = offset;
    ${w}
    return indices;
  }`,v=A=>(m.offsetToIndices=!0,s<2?A:`o2i_${e}(${A})`),I=[];if(s>=2)for(let A=s-1;A>=0;A--)I.push(`${te($,A,s)} * (indices[${A}])`);let C=s<2?"":`
  fn i2o_${e}(indices: ${f.indices}) -> u32 {
    return ${I.join("+")};
  }`,z=A=>(m.indicesToOffset=!0,s<2?A:`i2o_${e}(${A})`),k=(...A)=>s===0?"0u":`${f.indices}(${A.map(y).join(",")})`,N=(A,K)=>s<2?`${A}`:`${te(A,K,s)}`,B=(A,K,Z)=>s<2?`${A}=${Z};`:`${te(A,K,s)}=${Z};`,H={},q=(A,K)=>{m.broadcastedIndicesToOffset=!0;let Z=`${K.name}broadcastedIndicesTo${e}Offset`;if(Z in H)return`${Z}(${A})`;let X=[];for(let ye=s-1;ye>=0;ye--){let Ee=K.indicesGet("outputIndices",ye+K.rank-s);X.push(`${N($,ye)} * (${Ee} % ${N(x,ye)})`)}return H[Z]=`fn ${Z}(outputIndices: ${K.type.indices}) -> u32 {
             return ${X.length>0?X.join("+"):"0u"};
           }`,`${Z}(${A})`},V=(A,K)=>(()=>{if(f.storage===f.value)return`${e}[${A}]=${K};`;if(f.storage==="vec2<u32>"&&f.value==="i32")return`${e}[${A}]=vec2<u32>(u32(${K}), select(0u, 0xFFFFFFFFu, ${K} < 0));`;if(f.storage==="vec2<u32>"&&f.value==="u32")return`${e}[${A}]=vec2<u32>(u32(${K}), 0u);`;if(f.storage==="u32"&&f.value==="vec4<bool>")return`${e}[${A}]=dot(vec4<u32>(0x1, 0x100, 0x10000, 0x1000000), vec4<u32>(${K}));`;throw new Error(`not supported combination of storage type ${f.storage} and value type ${f.value} yet`)})(),O=A=>(()=>{if(f.storage===f.value)return`${e}[${A}]`;if(f.storage==="vec2<u32>"&&f.value==="i32")return`i32(${e}[${A}].x)`;if(f.storage==="vec2<u32>"&&f.value==="u32")return`u32(${e}[${A}].x)`;if(f.storage==="u32"&&f.value==="vec4<bool>")return`vec4<bool>(bool(${e}[${A}] & 0xFFu), bool(${e}[${A}] & 0xFF00u), bool(${e}[${A}] & 0xFF0000u), bool(${e}[${A}] & 0xFF000000u))`;throw new Error(`not supported combination of storage type ${f.storage} and value type ${f.value} yet`)})(),P=s<2?"":`
  fn get_${e}ByIndices(indices: ${f.indices}) -> ${p} {
    return ${O(`i2o_${e}(indices)`)};
  }`,G=s<2?"":(()=>{let A=o.map(Z=>`d${Z}: u32`).join(", "),K=o.map(Z=>`d${Z}`).join(", ");return`
  fn get_${e}(${A}) -> ${p} {
    return get_${e}ByIndices(${k(K)});
  }`})(),Y=(...A)=>{if(A.length!==s)throw new Error(`indices length must be ${s}`);let K=A.map(y).join(",");return s===0?O("0u"):s===1?O(K[0]):(m.get=!0,m.getByIndices=!0,m.indicesToOffset=!0,`get_${e}(${K})`)},L=A=>s<2?O(A):(m.getByIndices=!0,m.indicesToOffset=!0,`get_${e}ByIndices(${A})`),F=s<2?"":`
  fn set_${e}ByIndices(indices: ${f.indices}, value: ${p}) {
    ${V(`i2o_${e}(indices)`,"value")}
  }`,ee=s<2?"":(()=>{let A=o.map(Z=>`d${Z}: u32`).join(", "),K=o.map(Z=>`d${Z}`).join(", ");return`
  fn set_${e}(${A}, value: ${p}) {
    set_${e}ByIndices(${k(K)}, value);
  }`})();return{impl:()=>{let A=[],K=!1;return m.offsetToIndices&&(A.push(S),K=!0),m.indicesToOffset&&(A.push(C),K=!0),m.broadcastedIndicesToOffset&&(Object.values(H).forEach(Z=>A.push(Z)),K=!0),m.set&&(A.push(ee),K=!0),m.setByIndices&&(A.push(F),K=!0),m.get&&(A.push(G),K=!0),m.getByIndices&&(A.push(P),K=!0),!a&&K&&A.unshift(`const ${x} = ${f.indices}(${r.join(",")});`,`const ${$} = ${f.indices}(${R.computeStrides(r).join(",")});`),A.join(`
`)},type:f,offsetToIndices:v,indicesToOffset:z,broadcastedIndicesToOffset:q,indices:k,indicesGet:N,indicesSet:B,set:(...A)=>{if(A.length!==s+1)throw new Error(`indices length must be ${s}`);let K=A[s];if(typeof K!="string")throw new Error("value must be string");let Z=A.slice(0,s).map(y).join(",");return s===0?V("0u",K):s===1?V(Z[0],K):(m.set=!0,m.setByIndices=!0,m.indicesToOffset=!0,`set_${e}(${Z}, ${K})`)},setByOffset:V,setByIndices:(A,K)=>s<2?V(A,K):(m.setByIndices=!0,m.indicesToOffset=!0,`set_${e}ByIndices(${A}, ${K});`),get:Y,getByOffset:O,getByIndices:L,usage:i,name:e,strides:$,shape:x,rank:s}},U=(e,t,r,i=1)=>pr(e,t,r,"input",i),J=(e,t,r,i=1)=>pr(e,t,r,"output",i),Ec=(e,t,r)=>pr(e,t,r,"atomicOutput",1),Ta=(e,t,r,i=1)=>pr(e,t,r,"internal",i),gu=class{constructor(e,t){this.normalizedDispatchGroup=e,this.limits=t,this.internalVariables=[],this.variables=[],this.uniforms=[],this.variableIndex=0}guardAgainstOutOfBoundsWorkgroupSizes(e){return`if (global_idx >= ${typeof e=="number"?`${e}u`:e}) { return; }`}mainStart(e=rr){let t=typeof e=="number"?e:e[0],r=typeof e=="number"?1:e[1],i=typeof e=="number"?1:e[2];if(t>this.limits.maxComputeWorkgroupSizeX||r>this.limits.maxComputeWorkgroupSizeY||i>this.limits.maxComputeWorkgroupSizeZ)throw new Error(`workgroup size [${t}, ${r}, ${i}] exceeds the maximum workgroup size [${this.limits.maxComputeWorkgroupSizeX}, ${this.limits.maxComputeWorkgroupSizeY}, ${this.limits.maxComputeWorkgroupSizeZ}].`);if(t*r*i>this.limits.maxComputeInvocationsPerWorkgroup)throw new Error(`workgroup size [${t}, ${r}, ${i}] exceeds the maximum workgroup invocations ${this.limits.maxComputeInvocationsPerWorkgroup}.`);let n=this.normalizedDispatchGroup[1]===1&&this.normalizedDispatchGroup[2]===1,a=n?`@builtin(global_invocation_id) global_id : vec3<u32>,
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
`)}get variablesInfo(){if(this.uniforms.length===0)return;let e=t=>[12,10,1,6][["u32","f16","f32","i32"].indexOf(t)];return this.uniforms.map(t=>[e(t.type),t.length??1])}},Cc=(e,t)=>new gu(e,t)}),yu,ln,_u,bu,wu,$u,Ge,zc,Ac,kt=W(()=>{ie(),ne(),ze(),ae(),yu=(e,t)=>{if(!e||e.length!==1)throw new Error("Transpose requires 1 input.");if(t.length!==0&&t.length!==e[0].dims.length)throw new Error(`perm size ${t.length} does not match input rank ${e[0].dims.length}`)},ln=(e,t)=>t.length!==0?t:[...new Array(e).keys()].reverse(),_u=(e,t)=>R.sortBasedOnPerm(e,ln(e.length,t)),bu=(e,t,r,i)=>{let n=`fn perm(i: ${i.type.indices}) -> ${r.type.indices} {
    var a: ${r.type.indices};`;for(let a=0;a<t;++a)n+=`a[${e[a]}]=i[${a}];`;return n+="return a;}"},wu=(e,t)=>{let r=[],i=[];for(let n=0;n<e.length;++n)e[n]!==1&&r.push(e[n]),e[t[n]]!==1&&i.push(t[n]);return{newShape:r,newPerm:i}},$u=(e,t)=>{let r=0;for(let i=0;i<e.length;++i)if(t[e[i]]!==1){if(e[i]<r)return!1;r=e[i]}return!0},Ge=(e,t)=>{let r=e.dataType,i=e.dims.length,n=ln(i,t),a=_u(e.dims,n),s=e.dims,o=a,l=i<2||$u(n,e.dims),d;if(l)return d=m=>{let b=U("input",r,s,4),x=J("output",r,o,4);return`
  ${m.registerUniform("output_size","u32").declareVariables(b,x)}
  ${m.mainStart()}
    ${m.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
    output[global_idx] = input[global_idx];
  }`},{name:"TransposeCopy",shaderCache:{inputDependencies:["type"]},getRunData:()=>{let m=R.size(a);return{outputs:[{dims:a,dataType:e.dataType}],dispatchGroup:{x:Math.ceil(m/64/4)},programUniforms:[{type:12,data:Math.ceil(m/4)}]}},getShaderSource:d};let{newShape:p,newPerm:h}=wu(e.dims,n),f=R.areEqual(h,[2,3,1]),y=R.areEqual(h,[3,1,2]);if(p.length===2||f||y){s=f?[p[0],p[1]*p[2]]:y?[p[0]*p[1],p[2]]:p,o=[s[1],s[0]];let m=16;return d=b=>{let x=U("a",r,s.length),$=J("output",r,o.length);return`
  ${b.registerUniform("output_size","u32").declareVariables(x,$)}
  var<workgroup> tile : array<array<${$.type.value}, ${m+1}>, ${m}>;
  ${b.mainStart([m,m,1])}
    let stride = (uniforms.output_shape[1] - 1) / ${m} + 1;
    let workgroup_id_x = workgroup_index % stride;
    let workgroup_id_y = workgroup_index / stride;
    let input_col = workgroup_id_y * ${m}u + local_id.x;
    let input_row = workgroup_id_x * ${m}u + local_id.y;
    if (input_row < uniforms.a_shape[0] && input_col < uniforms.a_shape[1]) {
      tile[local_id.y][local_id.x] = ${x.getByIndices(`${x.type.indices}(input_row, input_col)`)};
    }
    workgroupBarrier();

    let output_col = workgroup_id_x * ${m}u + local_id.x;
    let output_row = workgroup_id_y * ${m}u + local_id.y;
    if (output_row < uniforms.output_shape[0] && output_col < uniforms.output_shape[1]) {
      ${$.setByIndices(`${$.type.indices}(output_row, output_col)`,"tile[local_id.x][local_id.y]")}
    }
  }`},{name:"TransposeShared",shaderCache:{inputDependencies:["type"]},getRunData:()=>{let b=R.size(a);return{outputs:[{dims:a,dataType:e.dataType}],dispatchGroup:{x:Math.ceil(o[1]/m),y:Math.ceil(o[0]/m)},programUniforms:[{type:12,data:b},...re(s,o)]}},getShaderSource:d}}return d=m=>{let b=U("a",r,s.length),x=J("output",r,o.length);return`
  ${m.registerUniform("output_size","u32").declareVariables(b,x)}

  ${bu(n,i,b,x)}

  ${m.mainStart()}
    ${m.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}

    let indices = ${x.offsetToIndices("global_idx")};
    let aIndices = perm(indices);

    ${x.setByOffset("global_idx",b.getByIndices("aIndices"))}
  }`},{name:"Transpose",shaderCache:{hint:`${t}`,inputDependencies:["rank"]},getRunData:()=>{let m=R.size(a);return{outputs:[{dims:a,dataType:e.dataType}],dispatchGroup:{x:Math.ceil(m/64)},programUniforms:[{type:12,data:m},...re(s,o)]}},getShaderSource:d}},zc=(e,t)=>{yu(e.inputs,t.perm),e.compute(Ge(e.inputs[0],t.perm))},Ac=e=>me({perm:e.perm})}),vu,xu,Su,ku,Tu,Iu,Eu,Cu,zu,Au,Ze,Mc,Oc,Rc,Nc,Bc,Dc,Pc,Uc,Lc,qc,Py=W(()=>{ie(),ne(),ae(),Ia(),kt(),vu={max:"select(bestValue, candidate, candidate > bestValue)",min:"select(bestValue, candidate, candidate < bestValue)",mean:"bestValue + candidate",sum:"bestValue + candidate",prod:"bestValue * candidate",sumSquare:"bestValue + candidate * candidate",logSumExp:"bestValue + exp(candidate)",l1:"bestValue + abs(candidate)",l2:"bestValue + candidate * candidate",logSum:"bestValue + candidate"},xu={max:"select(bestValue, candidate, candidate > bestValue)",min:"select(bestValue, candidate, candidate < bestValue)",mean:"bestValue + candidate",sum:"bestValue + candidate",prod:"bestValue * candidate",sumSquare:"bestValue + candidate",logSumExp:"bestValue + candidate",l1:"bestValue + candidate",l2:"bestValue + candidate",logSum:"bestValue + candidate"},Su={max:"_A[offset]",min:"_A[offset]",mean:"0",sum:"0",prod:"1",sumSquare:"0",logSumExp:"0",l1:"0",l2:"0",logSum:"0"},ku={max:"bestValue",min:"bestValue",sum:"bestValue",prod:"bestValue",sumSquare:"bestValue",logSumExp:"log(bestValue)",l1:"bestValue",l2:"sqrt(bestValue)",logSum:"log(bestValue)"},Tu=(e,t)=>{let r=[];for(let i=t-e;i<t;++i)r.push(i);return r},Iu=(e,t)=>{let r=[],i=e.length;for(let a=0;a<i;a++)t.indexOf(a)===-1&&r.push(e[a]);let n=t.map(a=>e[a]);return[r,n]},Eu=(e,t)=>{let r=e.length+t.length,i=[],n=0;for(let a=0;a<r;a++)t.indexOf(a)===-1?i.push(e[n++]):i.push(1);return i},Cu=(e,t)=>{for(let r=0;r<e.length;++r)if(e[e.length-r-1]!==t-1-r)return!1;return!0},zu=(e,t)=>{let r=[];if(!Cu(e,t)){for(let i=0;i<t;++i)e.indexOf(i)===-1&&r.push(i);e.forEach(i=>r.push(i))}return r},Au=(e,t,r,i,n,a,s)=>{let o=r[0].dims,l=R.size(a),d=R.size(s),p=U("_A",r[0].dataType,o),h=J("output",n,a),f=64;l===1&&(f=256);let y=`
          var<workgroup> aBestValues : array<f32, ${f}>;
       `,m=b=>`
        ${b.registerUniform("reduceSize","u32").declareVariables(p,h)}
        ${y}
        fn DIV_CEIL(a : u32, b : u32) -> u32 {
          return ((a - 1u) / b + 1u);
         }
         ${b.mainStart(f)}

          let outputIndex = global_idx / ${f};
          let offset = outputIndex * uniforms.reduceSize;

          var bestValue = f32(${Su[i]});
          let Length = uniforms.reduceSize;
          for (var k = local_idx; k < Length; k = k + ${f}) {
           let candidate = f32(${p.getByOffset("offset + k")});
           bestValue = ${vu[i]};
          }
          aBestValues[local_idx] = bestValue;
          workgroupBarrier();

         var reduceSize = min(Length, ${f}u);
         for (var currentSize = reduceSize / 2u; reduceSize > 1u;
             currentSize = reduceSize / 2u) {
           let interval = DIV_CEIL(reduceSize, 2u);
           if (local_idx < currentSize) {
            let candidate = aBestValues[local_idx + interval];
            bestValue = ${xu[i]};
            aBestValues[local_idx] = bestValue;
           }
           reduceSize = interval;
           workgroupBarrier();
         }

         if (local_idx == 0u) {
          ${h.setByOffset("outputIndex",`${i==="mean"?`${h.type.storage}(bestValue / f32(uniforms.reduceSize))`:`${h.type.storage}(${ku[i]})`}`)};
         }
        }`;return{name:e,shaderCache:{hint:`${t};${f}`,inputDependencies:["type"]},getShaderSource:m,getRunData:()=>({outputs:[{dims:a,dataType:n}],dispatchGroup:{x:l},programUniforms:[{type:12,data:d}]})}},Ze=(e,t,r,i)=>{let n=e.inputs.length===1?r:Qn(e.inputs,r),a=n.axes;a.length===0&&!n.noopWithEmptyAxes&&(a=e.inputs[0].dims.map((y,m)=>m));let s=R.normalizeAxes(a,e.inputs[0].dims.length),o=s,l=e.inputs[0],d=zu(o,e.inputs[0].dims.length);d.length>0&&(l=e.compute(Ge(e.inputs[0],d),{inputs:[0],outputs:[-1]})[0],o=Tu(o.length,l.dims.length));let[p,h]=Iu(l.dims,o),f=p;n.keepDims&&(f=Eu(p,s)),e.compute(Au(t,n.cacheKey,[l],i,e.inputs[0].dataType,f,h),{inputs:[l]})},Mc=(e,t)=>{Ze(e,"ReduceMeanShared",t,"mean")},Oc=(e,t)=>{Ze(e,"ReduceL1Shared",t,"l1")},Rc=(e,t)=>{Ze(e,"ReduceL2Shared",t,"l2")},Nc=(e,t)=>{Ze(e,"ReduceLogSumExpShared",t,"logSumExp")},Bc=(e,t)=>{Ze(e,"ReduceMaxShared",t,"max")},Dc=(e,t)=>{Ze(e,"ReduceMinShared",t,"min")},Pc=(e,t)=>{Ze(e,"ReduceProdShared",t,"prod")},Uc=(e,t)=>{Ze(e,"ReduceSumShared",t,"sum")},Lc=(e,t)=>{Ze(e,"ReduceSumSquareShared",t,"sumSquare")},qc=(e,t)=>{Ze(e,"ReduceLogSumShared",t,"logSum")}}),Ye,Mu,di,Qn,Qe,Ou,Ru,Nu,Bu,Du,Pu,Uu,Lu,qu,Wu,Je,Wc,Gc,Vc,Fc,Hc,jc,Kc,Xc,Zc,Yc,Ia=W(()=>{ie(),ne(),ze(),ae(),Py(),Ye=e=>{if(!e||e.length===0||e.length>2)throw new Error("Reduce op requires 1 or 2 inputs.");if(e.length===2&&e[1].dims.length!==1)throw new Error("Invalid axes input dims.")},Mu=e=>["","",`var value = ${e.getByIndices("input_indices")};`,""],di=(e,t,r,i,n,a,s=!1,o=!1)=>{let l=[],d=r[0].dims,p=d.length,h=R.normalizeAxes(n,p),f=!o&&h.length===0;d.forEach((b,x)=>{f||h.indexOf(x)>=0?s&&l.push(1):l.push(b)});let y=l.length,m=R.size(l);return{name:e,shaderCache:t,getShaderSource:b=>{let x=[],$=U("_A",r[0].dataType,p),w=J("output",a,y),S=i($,w,h),v=S[2];for(let I=0,C=0;I<p;I++)f||h.indexOf(I)>=0?(s&&C++,v=`for(var j${I}: u32 = 0; j${I} < ${d[I]}; j${I}++) {
                  ${S[2].includes("last_index")?`let last_index = j${I};`:""}
                  ${$.indicesSet("input_indices",I,`j${I}`)}
                  ${v}
                }`):(x.push(`${$.indicesSet("input_indices",I,w.indicesGet("output_indices",C))};`),C++);return`

        ${b.registerUniform("output_size","u32").declareVariables($,w)}

        ${b.mainStart()}
          ${b.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
          var input_indices: ${$.type.indices};
          let output_indices = ${w.offsetToIndices("global_idx")};

          ${x.join(`
`)}
          ${S[0]}       // init ops for reduce max/min
          ${S[1]}
          ${v}
          ${S[3]}
          ${S.length===4?w.setByOffset("global_idx","value"):S.slice(4).join(`
`)}
        }`},getRunData:()=>({outputs:[{dims:l,dataType:a}],dispatchGroup:{x:Math.ceil(m/64)},programUniforms:[{type:12,data:m},...re(d,l)]})}},Qn=(e,t)=>{let r=[];return e[1].dims[0]>0&&e[1].getBigInt64Array().forEach(i=>r.push(Number(i))),me({axes:r,keepDims:t.keepDims,noopWithEmptyAxes:t.noopWithEmptyAxes})},Qe=(e,t,r,i)=>{let n=e.inputs,a=n.length===1?r:Qn(n,r);e.compute(di(t,{hint:a.cacheKey,inputDependencies:["rank"]},[n[0]],a.noopWithEmptyAxes&&a.axes.length===0?Mu:i,a.axes,n[0].dataType,a.keepDims,a.noopWithEmptyAxes),{inputs:[0]})},Ou=(e,t)=>{Ye(e.inputs),Qe(e,"ReduceLogSum",t,(r,i)=>[`var value = ${i.type.storage}(0);`,"",`value += ${r.getByIndices("input_indices")};`,"value = log(value);"])},Ru=(e,t)=>{Ye(e.inputs),Qe(e,"ReduceL1",t,(r,i)=>[`var value = ${i.type.storage}(0);`,"",`value += abs(${r.getByIndices("input_indices")});`,""])},Nu=(e,t)=>{Ye(e.inputs),Qe(e,"ReduceL2",t,(r,i)=>[`var t = ${i.type.value}(0); var value = ${i.type.value}(0);`,"",`t = ${r.getByIndices("input_indices")}; value += (t * t);`,"value = sqrt(value);"])},Bu=(e,t)=>{Ye(e.inputs),Qe(e,"ReduceLogSumExp",t,(r,i)=>[`var value = ${i.type.storage}(0);`,"",`value += exp(${r.getByIndices("input_indices")});`,"value = log(value);"])},Du=(e,t)=>{Ye(e.inputs),Qe(e,"ReduceMax",t,(r,i,n)=>{let a=[];for(let s=0;s<r.rank;s++)(n.indexOf(s)>=0||n.length===0)&&a.push(r.indicesSet("input_indices",s,0));return[`${a.join(`
`)}`,`var value = ${r.getByIndices("input_indices")};`,`value = max(value, ${r.getByIndices("input_indices")});`,""]})},Pu=(e,t)=>{Ye(e.inputs),Qe(e,"ReduceMean",t,(r,i,n)=>{let a=1;for(let s=0;s<r.rank;s++)(n.indexOf(s)>=0||n.length===0)&&(a*=e.inputs[0].dims[s]);return["var sum = f32(0);","",`sum += f32(${r.getByIndices("input_indices")});`,`let value = ${i.type.value}(sum / ${a});`]})},Uu=(e,t)=>{Ye(e.inputs),Qe(e,"ReduceMin",t,(r,i,n)=>{let a=[];for(let s=0;s<r.rank;s++)(n.indexOf(s)>=0||n.length===0)&&a.push(`input_indices[${s}] = 0;`);return[`${a.join(`
`)}`,`var value = ${r.getByIndices("input_indices")};`,`value = min(value, ${r.getByIndices("input_indices")});`,""]})},Lu=(e,t)=>{Ye(e.inputs),Qe(e,"ReduceProd",t,(r,i)=>[`var value = ${i.type.storage}(1);`,"",`value *= ${r.getByIndices("input_indices")};`,""])},qu=(e,t)=>{Ye(e.inputs),Qe(e,"ReduceSum",t,(r,i)=>[`var value = ${i.type.storage}(0);`,"",`value += ${r.getByIndices("input_indices")};`,""])},Wu=(e,t)=>{Ye(e.inputs),Qe(e,"ReduceSumSquare",t,(r,i)=>[`var t = ${i.type.value}(0); var value = ${i.type.value}(0);`,"",`t = ${r.getByIndices("input_indices")}; value += t * t;`,""])},Je=(e,t,r)=>{if(t.length===0)return r;let i=1,n=1;for(let a=0;a<t.length;a++)t.indexOf(a)===-1?i*=e[a]:n*=e[a];return n<32&&i>1024},Wc=(e,t)=>{Je(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?Pu(e,t):Mc(e,t)},Gc=(e,t)=>{Je(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?Ru(e,t):Oc(e,t)},Vc=(e,t)=>{Je(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?Nu(e,t):Rc(e,t)},Fc=(e,t)=>{Je(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?Bu(e,t):Nc(e,t)},Hc=(e,t)=>{Je(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?Du(e,t):Bc(e,t)},jc=(e,t)=>{Je(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?Uu(e,t):Dc(e,t)},Kc=(e,t)=>{Je(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?Lu(e,t):Pc(e,t)},Xc=(e,t)=>{Je(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?qu(e,t):Uc(e,t)},Zc=(e,t)=>{Je(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?Wu(e,t):Lc(e,t)},Yc=(e,t)=>{Je(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?Ou(e,t):qc(e,t)}}),dn,Qc,Jc,Jn,Uy=W(()=>{ie(),ze(),Ia(),dn=e=>{if(!e||e.length===0||e.length>2)throw new Error("ArgMinMaxOp op requires 1 or 2 inputs.");if(e[0].dataType!==1)throw new Error("Invalid input type.")},Qc=(e,t)=>{dn(e.inputs);let r=(i,n,a)=>{let s=[];for(let o=0;o<i.rank;o++)(a.indexOf(o)>=0||a.length===0)&&s.push(`input_indices[${o}] = 0;`);return[`${s.join(`
`)}`,`var value = ${i.getByIndices("input_indices")};
var best_index : i32 = 0;`,`if (${i.getByIndices("input_indices")} ${t.selectLastIndex>0?"<=":"<"} value) {
         value = ${i.getByIndices("input_indices")};
         best_index = i32(last_index);
       }`,"",n.setByOffset("global_idx","best_index")]};e.compute(di("ArgMin",{hint:t.cacheKey,inputDependencies:["rank"]},[e.inputs[0]],r,[t.axis],7,t.keepDims),{inputs:[0]})},Jc=(e,t)=>{dn(e.inputs);let r=(i,n,a)=>{let s=[];for(let o=0;o<i.rank;o++)(a.indexOf(o)>=0||a.length===0)&&s.push(`input_indices[${o}] = 0;`);return[`${s.join(`
`)}`,`var value = ${i.getByIndices("input_indices")};
var best_index : i32 = 0;`,`if (${i.getByIndices("input_indices")} ${t.selectLastIndex>0?">=":">"} value) {
         value = ${i.getByIndices("input_indices")};
         best_index = i32(last_index);
       }`,"",n.setByOffset("global_idx","best_index")]};e.compute(di("argMax",{hint:t.cacheKey,inputDependencies:["rank"]},[e.inputs[0]],r,[t.axis],7,t.keepDims),{inputs:[0]})},Jn=e=>me(e)}),Gu,Hr,Vu,Fu,Hu,kr,ju,eh,Ea=W(()=>{ie(),ne(),ka(),ae(),Gu=(e,t)=>{let r=e[0],i=e[1],n=e[2],a=e[3],s=e[4],o=e[5];if(s&&o)throw new Error("Attention cannot have both past and attention_bias");if(r.dims.length!==3)throw new Error('Input "input" must have 3 dimensions');let l=r.dims[0],d=r.dims[1],p=r.dims[2];if(n.dims.length!==1)throw new Error('Input "bias" is expected to have 1 dimensions');if(i.dims.length!==2)throw new Error('Input "weights" is expected to have 2 dimensions');if(i.dims[0]!==p)throw new Error("Input 1 dimension 0 should have same length as dimension 2 of input 0");if(n.dims[0]!==i.dims[1])throw new Error('Input "bias" dimension 0 should have same length as dimension 1 of input "weights"');let h=n.dims[0]/3,f=h,y=f;if(t.qkvHiddenSizes.length>0){if(t.qkvHiddenSizes.length!==3)throw new Error("qkv_hidden_sizes attribute should have 3 elements");for(let S of t.qkvHiddenSizes)if(S%t.numHeads!==0)throw new Error("qkv_hidden_sizes should be divisible by num_heads");h=t.qkvHiddenSizes[0],f=t.qkvHiddenSizes[1],y=t.qkvHiddenSizes[2]}let m=d;if(h!==f)throw new Error("qkv_hidden_sizes first element should be same as the second");if(n.dims[0]!==h+f+y)throw new Error('Input "bias" dimension 0 should have same length as sum of Q/K/V hidden sizes');let b=0;if(s){if(f!==y)throw new Error('Input "past" expect k_hidden_size == v_hidden_size');if(s.dims.length!==5)throw new Error('Input "past" must have 5 dimensions');if(s.dims[0]!==2)throw new Error('Input "past" first dimension must be 2');if(s.dims[1]!==l)throw new Error('Input "past" second dimension must be batch_size');if(s.dims[2]!==t.numHeads)throw new Error('Input "past" third dimension must be num_heads');if(s.dims[4]!==f/t.numHeads)throw new Error('Input "past" fifth dimension must be k_hidden_size / num_heads');t.pastPresentShareBuffer||(b=s.dims[3])}let x=m+b,$=-1,w=0;if(a)throw new Error("Mask not supported");if(s)throw new Error("past is not supported");if(o){if(o.dims.length!==4)throw new Error('Input "attention_bias" must have 4 dimensions');if(o.dims[0]!==l||o.dims[1]!==t.numHeads||o.dims[2]!==d||o.dims[3]!==x)throw new Error('Expect "attention_bias" shape (batch_size, num_heads, sequence_length, total_sequence_length)')}return{batchSize:l,sequenceLength:d,pastSequenceLength:b,kvSequenceLength:m,totalSequenceLength:x,maxSequenceLength:$,inputHiddenSize:p,hiddenSize:h,vHiddenSize:y,headSize:Math.floor(h/t.numHeads),vHeadSize:Math.floor(y/t.numHeads),numHeads:t.numHeads,isUnidirectional:!1,pastPresentShareBuffer:!1,maskFilterValue:t.maskFilterValue,maskType:w,scale:t.scale,broadcastResPosBias:!1,passPastInKv:!1,qkvFormat:1}},Hr=(e,t,r)=>t&&e?`
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
    `,Vu=(e,t,r,i,n,a,s,o)=>{let l=Ie(s?1:a),d=64,p=a/l;p<d&&(d=32);let h=Math.ceil(a/l/d),f=[{type:12,data:t},{type:12,data:r},{type:12,data:i},{type:12,data:n},{type:12,data:p},{type:12,data:h}],y=Oe(e.dataType,l),m=Be(1,l),b=["type"];s&&b.push("type"),o&&b.push("type");let x=$=>{let w=J("x",e.dataType,e.dims,l),S=[w],v=s?U("seq_lens",s.dataType,s.dims):void 0;v&&S.push(v);let I=o?U("total_sequence_length_input",o.dataType,o.dims):void 0;I&&S.push(I);let C=Be(e.dataType),z=[{name:"batch_size",type:"u32"},{name:"num_heads",type:"u32"},{name:"past_sequence_length",type:"u32"},{name:"sequence_length",type:"u32"},{name:"total_sequence_length",type:"u32"},{name:"elements_per_thread",type:"u32"}];return`
  var<workgroup> thread_max: array<f32, ${d}>;
  var<workgroup> thread_sum: array<f32, ${d}>;
  ${$.registerUniforms(z).declareVariables(...S)}
  ${$.mainStart([d,1,1])}
    let batchIdx = workgroup_id.z / uniforms.num_heads;
    let headIdx = workgroup_id.z % uniforms.num_heads;
    let sequence_length = uniforms.sequence_length;
    var total_sequence_length = uniforms.total_sequence_length;
    ${Hr(v,I,!1)}
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
  }`};return{name:"AttentionProbsSoftmax",shaderCache:{hint:`${d};${y};${l}`,inputDependencies:b},getShaderSource:x,getRunData:()=>({outputs:[],dispatchGroup:{x:1,y:n,z:t*r},programUniforms:f})}},Fu=(e,t,r,i,n,a,s,o,l)=>{let d=s+a.kvSequenceLength,p=[a.batchSize,a.numHeads,a.sequenceLength,d],h=e>1&&i,f=a.kvNumHeads?a.kvNumHeads:a.numHeads,y=h?[a.batchSize,f,d,a.headSize]:void 0,m=a.nReps?a.nReps:1,b=a.scale===0?1/Math.sqrt(a.headSize):a.scale,x=Ie(a.headSize),$=a.headSize/x,w=12,S={x:Math.ceil(d/w),y:Math.ceil(a.sequenceLength/w),z:a.batchSize*a.numHeads},v=[{type:12,data:a.sequenceLength},{type:12,data:$},{type:12,data:d},{type:12,data:a.numHeads},{type:12,data:a.headSize},{type:1,data:b},{type:12,data:s},{type:12,data:a.kvSequenceLength},{type:12,data:m}],I=h&&i&&R.size(i.dims)>0,C=["type","type"];I&&C.push("type"),n&&C.push("type"),o&&C.push("type"),l&&C.push("type");let z=[{dims:p,dataType:t.dataType,gpuDataType:0}];h&&z.push({dims:y,dataType:t.dataType,gpuDataType:0});let k=N=>{let B=U("q",t.dataType,t.dims,x),H=U("key",r.dataType,r.dims,x),q=[B,H];if(I){let F=U("past_key",i.dataType,i.dims,x);q.push(F)}n&&q.push(U("attention_bias",n.dataType,n.dims));let V=o?U("seq_lens",o.dataType,o.dims):void 0;V&&q.push(V);let O=l?U("total_sequence_length_input",l.dataType,l.dims):void 0;O&&q.push(O);let P=J("output",t.dataType,p),G=[P];h&&G.push(J("present_key",t.dataType,y,x));let Y=Be(1,x),L=[{name:"M",type:"u32"},{name:"K",type:"u32"},{name:"N",type:"u32"},{name:"num_heads",type:"u32"},{name:"head_size",type:"u32"},{name:"alpha",type:"f32"},{name:"past_sequence_length",type:"u32"},{name:"kv_sequence_length",type:"u32"},{name:"n_reps",type:"u32"}];return`
  const TILE_SIZE = ${w}u;

  var<workgroup> tileQ: array<${B.type.storage}, ${w*w}>;
  var<workgroup> tileK: array<${B.type.storage}, ${w*w}>;
  ${N.registerUniforms(L).declareVariables(...q,...G)}
  ${N.mainStart([w,w,1])}
    // x holds the N and y holds the M
    let headIdx = workgroup_id.z % uniforms.num_heads;
    let kvHeadIdx = ${m===1?"headIdx":"headIdx / uniforms.n_reps"};
    let kv_num_heads = ${m===1?"uniforms.num_heads":"uniforms.num_heads / uniforms.n_reps"};
    let batchIdx = workgroup_id.z / uniforms.num_heads;
    let m = workgroup_id.y * TILE_SIZE;
    let n = workgroup_id.x * TILE_SIZE;
    let sequence_length = uniforms.M;
    var total_sequence_length = uniforms.N;
    ${Hr(V,O,!0)}
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
      var sum: f32 = ${(()=>{switch(x){case 1:return"value";case 2:return"value.x + value.y";case 4:return"value.x + value.y + value.z + value.w";default:throw new Error(`Unsupported components: ${x}`)}})()};
        output[outputIdx] = ${P.type.value} (sum * uniforms.alpha) + ${n?"attention_bias[outputIdx]":"0.0"};
    }
  }`};return{name:"AttentionProbs",shaderCache:{hint:`${x};${n!==void 0};${i!==void 0};${e}`,inputDependencies:C},getRunData:()=>({outputs:z,dispatchGroup:S,programUniforms:v}),getShaderSource:k}},Hu=(e,t,r,i,n,a,s=void 0,o=void 0)=>{let l=a+n.kvSequenceLength,d=n.nReps?n.nReps:1,p=n.vHiddenSize*d,h=e>1&&i,f=n.kvNumHeads?n.kvNumHeads:n.numHeads,y=h?[n.batchSize,f,l,n.headSize]:void 0,m=[n.batchSize,n.sequenceLength,p],b=12,x={x:Math.ceil(n.vHeadSize/b),y:Math.ceil(n.sequenceLength/b),z:n.batchSize*n.numHeads},$=[{type:12,data:n.sequenceLength},{type:12,data:l},{type:12,data:n.vHeadSize},{type:12,data:n.numHeads},{type:12,data:n.headSize},{type:12,data:p},{type:12,data:a},{type:12,data:n.kvSequenceLength},{type:12,data:d}],w=h&&i&&R.size(i.dims)>0,S=["type","type"];w&&S.push("type"),s&&S.push("type"),o&&S.push("type");let v=[{dims:m,dataType:t.dataType,gpuDataType:0}];h&&v.push({dims:y,dataType:t.dataType,gpuDataType:0});let I=C=>{let z=U("probs",t.dataType,t.dims),k=U("v",r.dataType,r.dims),N=[z,k];w&&N.push(U("past_value",i.dataType,i.dims));let B=s?U("seq_lens",s.dataType,s.dims):void 0;s&&N.push(B);let H=o?U("total_sequence_length_input",o.dataType,o.dims):void 0;o&&N.push(H);let q=[J("output",t.dataType,m)];h&&q.push(J("present_value",t.dataType,y));let V=[{name:"M",type:"u32"},{name:"K",type:"u32"},{name:"N",type:"u32"},{name:"num_heads",type:"u32"},{name:"head_size",type:"u32"},{name:"v_hidden_size",type:"u32"},{name:"past_sequence_length",type:"u32"},{name:"kv_sequence_length",type:"u32"},{name:"n_reps",type:"u32"}];return`
  const TILE_SIZE = ${b}u;
  var<workgroup> tileQ: array<${z.type.value}, ${b*b}>;
  var<workgroup> tileV: array<${z.type.value}, ${b*b}>;
  ${C.registerUniforms(V).declareVariables(...N,...q)}
  ${C.mainStart([b,b,1])}
   let headIdx = workgroup_id.z % uniforms.num_heads;
   let batchIdx = workgroup_id.z / uniforms.num_heads;
   let kvHeadIdx = ${d===1?"headIdx":"headIdx / uniforms.n_reps"};
   let kv_num_heads = ${d===1?"uniforms.num_heads":"uniforms.num_heads / uniforms.n_reps"};
   let m = global_id.y;
   let n = global_id.x;
   let sequence_length = uniforms.M;
   var total_sequence_length = uniforms.K;
   ${Hr(B,H,!0)}
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
  }`};return{name:"AttentionScore",shaderCache:{hint:`${i!==void 0};${e}`,inputDependencies:S},getRunData:()=>({outputs:v,dispatchGroup:x,programUniforms:$}),getShaderSource:I}},kr=(e,t,r,i,n,a,s,o,l,d,p=void 0,h=void 0)=>{let f=Math.min(e.outputCount,1+(s?1:0)+(o?1:0)),y=f>1?s:void 0,m=f>1?o:void 0,b=f>1?d.pastSequenceLength:0,x=b+d.kvSequenceLength,$=l&&R.size(l.dims)>0?l:void 0,w=[t,r];y&&R.size(y.dims)>0&&w.push(y),$&&w.push($),p&&w.push(p),h&&w.push(h);let S=e.compute(Fu(f,t,r,y,$,d,b,p,h),{inputs:w,outputs:f>1?[-1,1]:[-1]})[0];e.compute(Vu(S,d.batchSize,d.numHeads,b,d.sequenceLength,x,p,h),{inputs:p&&h?[S,p,h]:[S],outputs:[]});let v=[S,i];m&&R.size(m.dims)>0&&v.push(m),p&&v.push(p),h&&v.push(h),e.compute(Hu(f,S,i,m,d,b,p,h),{inputs:v,outputs:f>1?[0,2]:[0]})},ju=(e,t)=>{let r=[t.batchSize,t.numHeads,t.sequenceLength,t.headSize],i=t.sequenceLength,n=t.inputHiddenSize,a=t.headSize,s=12,o={x:Math.ceil(t.headSize/s),y:Math.ceil(t.sequenceLength/s),z:t.batchSize*t.numHeads},l=[e.inputs[0],e.inputs[1],e.inputs[2]],d=[{type:12,data:i},{type:12,data:n},{type:12,data:a},{type:12,data:t.numHeads},{type:12,data:t.headSize},{type:12,data:t.hiddenSize},{type:12,data:t.hiddenSize+t.hiddenSize+t.vHiddenSize}],p=h=>{let f=J("output_q",l[0].dataType,r),y=J("output_k",l[0].dataType,r),m=J("output_v",l[0].dataType,r),b=U("input",l[0].dataType,l[0].dims),x=U("weight",l[1].dataType,l[1].dims),$=U("bias",l[2].dataType,l[2].dims),w=b.type.storage,S=[{name:"M",type:"u32"},{name:"K",type:"u32"},{name:"N",type:"u32"},{name:"num_heads",type:"u32"},{name:"head_size",type:"u32"},{name:"hidden_size",type:"u32"},{name:"ldb",type:"u32"}];return`
  const TILE_SIZE = ${s}u;
  var<workgroup> tileInput: array<${w}, ${s*s}>;
  var<workgroup> tileWeightQ: array<${w}, ${s*s}>;
  var<workgroup> tileWeightK: array<${w}, ${s*s}>;
  var<workgroup> tileWeightV: array<${w}, ${s*s}>;
  ${h.registerUniforms(S).declareVariables(b,x,$,f,y,m)}
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
  }`};return e.compute({name:"AttentionPrepare",shaderCache:{inputDependencies:["type","type","type"]},getRunData:()=>({outputs:[{dims:r,dataType:e.inputs[0].dataType,gpuDataType:0},{dims:r,dataType:e.inputs[0].dataType,gpuDataType:0},{dims:r,dataType:e.inputs[0].dataType,gpuDataType:0}],dispatchGroup:o,programUniforms:d}),getShaderSource:p},{inputs:l,outputs:[-1,-1,-1]})},eh=(e,t)=>{let r=Gu(e.inputs,t),[i,n,a]=ju(e,r);return kr(e,i,n,a,e.inputs[4],void 0,void 0,void 0,e.inputs[5],r)}}),Ku,Xu,Zu,th,Ly=W(()=>{Ke(),ie(),ne(),ze(),ae(),Ku=(e,t)=>{if(!e||e.length!==5)throw new Error("BatchNormalization requires 5 inputs");let r=(i,n,a)=>{let s=n.length;if(s!==i.length)throw new Error(`${a}: num dimensions != ${s}`);n.forEach((o,l)=>{if(o!==i[l])throw new Error(`${a}: dim[${l}] do not match`)})};if(e[0].dims.length>1){let i=t.format==="NHWC"?t.spatial?e[0].dims.slice(-1):e[0].dims.slice(-1).concat(e[0].dims.slice(1,e[0].dims.length-1)):e[0].dims.slice(1,t.spatial?2:void 0);r(e[1].dims,i,"Invalid input scale"),r(e[2].dims,i,"Invalid input B"),r(e[3].dims,i,"Invalid input mean"),r(e[4].dims,i,"Invalid input var")}else r(e[1].dims,[1],"Invalid input scale"),r(e[2].dims,[1],"Invalid input B"),r(e[3].dims,[1],"Invalid input mean"),r(e[4].dims,[1],"Invalid input var")},Xu=(e,t)=>{let{epsilon:r,spatial:i,format:n}=t,a=e[0].dims,s=i?Ie(a[a.length-1]):1,o=n==="NHWC"&&a.length>1?s:1,l=R.size(a)/s,d=i,p=d?a.length:a,h=U("x",e[0].dataType,e[0].dims,s),f=U("scale",e[1].dataType,e[1].dims,o),y=U("bias",e[2].dataType,e[2].dims,o),m=U("inputMean",e[3].dataType,e[3].dims,o),b=U("inputVar",e[4].dataType,e[4].dims,o),x=J("y",e[0].dataType,p,s),$=()=>{let S="";if(i)S=`let cOffset = ${a.length===1?"0u":n==="NHWC"?`outputIndices[${a.length-1}] / ${s}`:"outputIndices[1]"};`;else if(n==="NCHW")S=`
            ${x.indicesSet("outputIndices","0","0")}
            let cOffset = ${x.indicesToOffset("outputIndices")};`;else{S=`var cIndices = ${f.type.indices}(0);
                       cIndices[0] = outputIndices[${a.length-1}];`;for(let v=1;v<f.rank;v++)S+=`cIndices[${v}] = outputIndices[${v}];`;S+=`let cOffset = ${f.indicesToOffset("cIndices")};`}return S},w=S=>`
  const epsilon = ${r};
  ${S.registerUniform("outputSize","u32").declareVariables(h,f,y,m,b,x)}
  ${S.mainStart()}
  ${S.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}
    var outputIndices = ${x.offsetToIndices(`global_idx * ${s}`)};
    ${$()}
    let scale = ${f.getByOffset("cOffset")};
    let bias = ${y.getByOffset("cOffset")};
    let inputMean = ${m.getByOffset("cOffset")};
    let inputVar = ${b.getByOffset("cOffset")};
    let x = ${h.getByOffset("global_idx")};
    let value = (x - inputMean) * inverseSqrt(inputVar + epsilon) * scale + bias;
    ${x.setByOffset("global_idx","value")}
  }`;return{name:"BatchNormalization",shaderCache:{hint:`${t.epsilon}_${t.format}_${i}_${s}`,inputDependencies:d?["rank","type","type","type","type"]:void 0},getShaderSource:w,getRunData:()=>({outputs:[{dims:e[0].dims,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(l/64)},programUniforms:d?[{type:12,data:l},...re(a)]:[{type:12,data:l}]})}},Zu=e=>me(e),th=(e,t)=>{let{inputs:r,outputCount:i}=e,n=Zu({...t,outputCount:i});if($e.webgpu.validateInputContent&&Ku(r,n),t.trainingMode)throw new Error("BatchNormalization trainingMode is not supported yet.");e.compute(Xu(r,n))}}),Yu,Qu,rh,qy=W(()=>{ne(),ae(),Yu=e=>{if(e[0].dims.length!==3)throw new Error("input should have 3 dimensions");if(![320,640,1280].includes(e[0].dims[2]))throw new Error("number of channels should be 320, 640 or 1280");if(e[1].dims.length!==1)throw new Error("bias is expected to have 1 dimensions");if(e[0].dims[2]!==e[1].dims[0])throw new Error("last dimension of input and bias are not the same")},Qu=e=>{let t=e[0].dims,r=e[0].dims[2],i=R.size(t)/4,n=e[0].dataType,a=U("input",n,t,4),s=U("bias",n,[r],4),o=U("residual",n,t,4),l=J("output",n,t,4);return{name:"BiasAdd",getRunData:()=>({outputs:[{dims:t,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(i/64)}}),getShaderSource:d=>`
  const channels = ${r}u / 4;
  ${d.declareVariables(a,s,o,l)}

  ${d.mainStart()}
    ${d.guardAgainstOutOfBoundsWorkgroupSizes(i)}
    let value = ${a.getByOffset("global_idx")}
      + ${s.getByOffset("global_idx % channels")} + ${o.getByOffset("global_idx")};
    ${l.setByOffset("global_idx","value")}
  }`}},rh=e=>{Yu(e.inputs),e.compute(Qu(e.inputs))}}),Ju,fe,ih,nh,ah,sh,oh,uh,lh,dh,ph,el,ch,hh,fh,mh,$r,gh,ii,yh,_h,bh,wh,$h,vh,xh,Sh,kh,Th,Ih,Eh,Ch,zh,Ah,Mh,pn,Oh,ea,ta,Rh,Nh,Bh,tl,rl,Dh,Ca=W(()=>{ie(),ne(),ze(),ae(),Ju=(e,t,r,i,n,a,s)=>{let o=Math.ceil(t/4),l="";typeof n=="string"?l=`${n}(a)`:l=n("a");let d=U("inputData",r,[o],4),p=J("outputData",i,[o],4),h=[{name:"vec_size",type:"u32"}];return s&&h.push(...s),`
      ${e.registerUniforms(h).declareVariables(d,p)}

  ${a??""}

  ${e.mainStart()}
    ${e.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.vec_size")}

    let a = ${d.getByOffset("global_idx")};
    ${p.setByOffset("global_idx",l)}
  }`},fe=(e,t,r,i,n,a=e.dataType,s,o)=>{let l=[{type:12,data:Math.ceil(R.size(e.dims)/4)}];return s&&l.push(...s),{name:t,shaderCache:{hint:n,inputDependencies:["type"]},getShaderSource:d=>Ju(d,R.size(e.dims),e.dataType,a,r,i,o),getRunData:d=>({outputs:[{dims:e.dims,dataType:a}],dispatchGroup:{x:Math.ceil(R.size(d[0].dims)/64/4)},programUniforms:l})}},ih=e=>{e.compute(fe(e.inputs[0],"Abs","abs"))},nh=e=>{e.compute(fe(e.inputs[0],"Acos","acos"))},ah=e=>{e.compute(fe(e.inputs[0],"Acosh","acosh"))},sh=e=>{e.compute(fe(e.inputs[0],"Asin","asin"))},oh=e=>{e.compute(fe(e.inputs[0],"Asinh","asinh"))},uh=e=>{e.compute(fe(e.inputs[0],"Atan","atan"))},lh=e=>{e.compute(fe(e.inputs[0],"Atanh","atanh"))},dh=e=>me(e),ph=(e,t)=>{let r;switch(t.to){case 10:r="vec4<f16>";break;case 1:r="vec4<f32>";break;case 12:r="vec4<u32>";break;case 6:r="vec4<i32>";break;case 9:r="vec4<bool>";break;default:throw new RangeError(`not supported type (specified in attribute 'to' from 'Cast' operator): ${t.to}`)}e.compute(fe(e.inputs[0],"Cast",r,void 0,t.cacheKey,t.to))},el=e=>{let t,r,i=e.length>=2&&e[1].data!==0,n=e.length>=3&&e[2].data!==0;switch(e[0].dataType){case 1:t=i?e[1].getFloat32Array()[0]:-34028234663852886e22,r=n?e[2].getFloat32Array()[0]:34028234663852886e22;break;case 10:t=i?e[1].getUint16Array()[0]:64511,r=n?e[2].getUint16Array()[0]:31743;break;default:throw new Error("Unsupport data type")}return me({min:t,max:r})},ch=(e,t)=>{let r=t||el(e.inputs),i=Be(e.inputs[0].dataType);e.compute(fe(e.inputs[0],"Clip",n=>`clamp(${n}, vec4<${i}>(uniforms.min), vec4<${i}>(uniforms.max))`,void 0,r.cacheKey,void 0,[{type:e.inputs[0].dataType,data:r.min},{type:e.inputs[0].dataType,data:r.max}],[{name:"min",type:i},{name:"max",type:i}]),{inputs:[0]})},hh=e=>{e.compute(fe(e.inputs[0],"Ceil","ceil"))},fh=e=>{e.compute(fe(e.inputs[0],"Cos","cos"))},mh=e=>{e.compute(fe(e.inputs[0],"Cosh","cosh"))},$r=e=>me(e),gh=(e,t)=>{let r=Be(e.inputs[0].dataType);e.compute(fe(e.inputs[0],"Elu",i=>`elu_vf32(${i})`,`
  const elu_alpha_ = ${r}(${t.alpha});

  fn elu_f32(a: ${r}) -> ${r} {
  return select((exp(a) - 1.0) * elu_alpha_, a, a >= 0.0);
  }

  fn elu_vf32(v: vec4<${r}>) -> vec4<${r}> {
  return vec4(elu_f32(v.x), elu_f32(v.y), elu_f32(v.z), elu_f32(v.w));
  }`,t.cacheKey))},ii=(e="f32")=>`
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
}`,yh=e=>{let t=Be(e.inputs[0].dataType);e.compute(fe(e.inputs[0],"Erf",r=>`erf_vf32(${r})`,ii(t)))},_h=e=>{e.compute(fe(e.inputs[0],"Exp","exp"))},bh=e=>{e.compute(fe(e.inputs[0],"Floor","floor"))},wh=e=>{let t=Be(e.inputs[0].dataType);e.compute(fe(e.inputs[0],"Gelu",r=>`0.5 * ${r} * (1.0 + erf_vf32(${r} * 0.7071067811865475))`,ii(t)))},$h=(e,t)=>{let r=Be(e.inputs[0].dataType);e.compute(fe(e.inputs[0],"LeakyRelu",i=>`select(leaky_relu_alpha_ * ${i}, ${i}, ${i} >= vec4<${r}>(0.0))`,`const leaky_relu_alpha_ = ${r}(${t.alpha});`,t.cacheKey))},vh=e=>{e.compute(fe(e.inputs[0],"Not",t=>`!${t}`))},xh=e=>{e.compute(fe(e.inputs[0],"Neg",t=>`-${t}`))},Sh=e=>{e.compute(fe(e.inputs[0],"Reciprocal",t=>`1.0/${t}`))},kh=e=>{let t=Be(e.inputs[0].dataType);e.compute(fe(e.inputs[0],"Relu",r=>`select(vec4<${t}>(0.0), ${r}, ${r} > vec4<${t}>(0.0))`))},Th=e=>{e.compute(fe(e.inputs[0],"Sigmoid",t=>`(1.0 / (1.0 + exp(-${t})))`))},Ih=e=>me(e),Eh=(e,t)=>{let r=Be(e.inputs[0].dataType);e.compute(fe(e.inputs[0],"HardSigmoid",i=>`max(vec4<${r}>(0.0), min(vec4<${r}>(1.0), ${t.alpha} * ${i} + vec4<${r}>(${t.beta})))`,void 0,t.cacheKey))},Ch=e=>{e.compute(fe(e.inputs[0],"Sin","sin"))},zh=e=>{e.compute(fe(e.inputs[0],"Sinh","sinh"))},Ah=e=>{e.compute(fe(e.inputs[0],"Sqrt","sqrt"))},Mh=e=>{e.compute(fe(e.inputs[0],"Tan","tan"))},pn=e=>`sign(${e}) * (1 - exp(-2 * abs(${e}))) / (1 + exp(-2 * abs(${e})))`,Oh=e=>{e.compute(fe(e.inputs[0],"Tanh",pn))},ea=(e="f32")=>`
const fast_gelu_a: ${e} = 0.5;
const fast_gelu_b: ${e} = 0.7978845608028654;
const fast_gelu_c: ${e} = 0.035677408136300125;

fn tanh_v(v: vec4<${e}>) -> vec4<${e}> {
  return ${pn("v")};
}
`,ta=e=>`(fast_gelu_a + fast_gelu_a * tanh_v(${e} * (fast_gelu_c * ${e} * ${e} + fast_gelu_b))) * ${e}`,Rh=e=>{let t=Be(e.inputs[0].dataType);e.compute(fe(e.inputs[0],"FastGelu",ta,ea(t),void 0,e.inputs[0].dataType))},Nh=(e,t)=>{let r=Be(e.inputs[0].dataType);return e.compute(fe(e.inputs[0],"ThresholdedRelu",i=>`select(vec4<${r}>(0.0), ${i}, ${i} > thresholded_relu_alpha_)`,`const thresholded_relu_alpha_ = vec4<${r}>(${t.alpha});`,t.cacheKey)),0},Bh=e=>{e.compute(fe(e.inputs[0],"Log","log"))},tl=(e,t)=>`
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
`,rl=e=>`quick_gelu_impl(${e})`,Dh=(e,t)=>{let r=Be(e.inputs[0].dataType);e.compute(fe(e.inputs[0],"QuickGelu",rl,tl(r,t.alpha),t.cacheKey,e.inputs[0].dataType))}}),il,nl,Ph,Wy=W(()=>{ne(),ae(),Ca(),il=e=>{if(e[0].dims.length!==3)throw new Error("input should have 3 dimensions");if(![2560,5120,10240].includes(e[0].dims[2]))throw new Error("hidden state should be 2560, 5120 or 10240");if(e[1].dims.length!==1)throw new Error("bias is expected to have 1 dimensions");if(e[0].dims[2]!==e[1].dims[0])throw new Error("last dimension of input and bias are not the same")},nl=e=>{let t=e[0].dims.slice();t[2]=t[2]/2;let r=U("input",e[0].dataType,e[0].dims,4),i=U("bias",e[0].dataType,[e[0].dims[2]],4),n=J("output",e[0].dataType,t,4),a=R.size(t)/4,s=Oe(e[0].dataType);return{name:"BiasSplitGelu",getRunData:()=>({outputs:[{dims:t,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(a/64)}}),getShaderSource:o=>`
  const M_SQRT2 = sqrt(2.0);
  const halfChannels = ${e[0].dims[2]/4/2}u;

  ${o.declareVariables(r,i,n)}

  ${ii(s)}

  ${o.mainStart()}
    ${o.guardAgainstOutOfBoundsWorkgroupSizes(a)}
    let biasIdx = global_idx % halfChannels;
    let batchIndex = global_idx / halfChannels;
    let inputOffset = biasIdx + batchIndex * halfChannels * 2;
    let valueLeft = input[inputOffset] + bias[biasIdx];
    let valueRight = input[inputOffset + halfChannels] + bias[biasIdx + halfChannels];
    let geluRight = valueRight * 0.5 * (erf_vf32(valueRight / M_SQRT2) + 1);

    ${n.setByOffset("global_idx","valueLeft * geluRight")}
  }`}},Ph=e=>{il(e.inputs),e.compute(nl(e.inputs))}}),al,sl,et,Uh,Lh,qh,Wh,Gh,Vh,Fh,Hh,jh,Kh,Gy=W(()=>{ie(),ne(),ae(),al=(e,t,r,i,n,a,s,o,l,d,p,h)=>{let f,y;typeof o=="string"?f=y=(w,S)=>`${o}((${w}),(${S}))`:typeof o=="function"?f=y=o:(f=o.scalar,y=o.vector);let m=J("outputData",p,i.length,4),b=U("aData",l,t.length,4),x=U("bData",d,r.length,4),$;if(n)if(a){let w=R.size(t)===1,S=R.size(r)===1,v=t.length>0&&t[t.length-1]%4===0,I=r.length>0&&r[r.length-1]%4===0;w||S?$=m.setByOffset("global_idx",y(w?`${b.type.value}(${b.getByOffset("0")}.x)`:b.getByOffset("global_idx"),S?`${x.type.value}(${x.getByOffset("0")}.x)`:x.getByOffset("global_idx"))):$=`
            let outputIndices = ${m.offsetToIndices("global_idx * 4u")};
            let offsetA = ${b.broadcastedIndicesToOffset("outputIndices",m)};
            let offsetB = ${x.broadcastedIndicesToOffset("outputIndices",m)};
            ${m.setByOffset("global_idx",y(s||v?b.getByOffset("offsetA / 4u"):`${b.type.value}(${b.getByOffset("offsetA / 4u")}[offsetA % 4u])`,s||I?x.getByOffset("offsetB / 4u"):`${x.type.value}(${x.getByOffset("offsetB / 4u")}[offsetB % 4u])`))}
          `}else $=m.setByOffset("global_idx",y(b.getByOffset("global_idx"),x.getByOffset("global_idx")));else{if(!a)throw new Error("no necessary to use scalar implementation for element-wise binary op implementation.");let w=(S,v,I="")=>{let C=`aData[indexA${v}][componentA${v}]`,z=`bData[indexB${v}][componentB${v}]`;return`
            let outputIndices${v} = ${m.offsetToIndices(`global_idx * 4u + ${v}u`)};
            let offsetA${v} = ${b.broadcastedIndicesToOffset(`outputIndices${v}`,m)};
            let offsetB${v} = ${x.broadcastedIndicesToOffset(`outputIndices${v}`,m)};
            let indexA${v} = offsetA${v} / 4u;
            let indexB${v} = offsetB${v} / 4u;
            let componentA${v} = offsetA${v} % 4u;
            let componentB${v} = offsetB${v} % 4u;
            ${S}[${v}] = ${I}(${f(C,z)});
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
        ${e.registerUniform("vec_size","u32").declareVariables(b,x,m)}

        ${h??""}

        ${e.mainStart()}
        ${e.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.vec_size")}
        ${$}
      }`},sl=(e,t,r,i,n,a,s=r.dataType)=>{let o=r.dims.map(Number),l=i.dims.map(Number),d=!R.areEqual(o,l),p=o,h=R.size(o),f=!1,y=!1,m=[d];if(d){let b=tr.calcShape(o,l,!1);if(!b)throw new Error("Can't perform binary op on the given tensors");p=b.slice(),h=R.size(p);let x=R.size(o)===1,$=R.size(l)===1,w=o.length>0&&o[o.length-1]%4===0,S=l.length>0&&l[l.length-1]%4===0;m.push(x),m.push($),m.push(w),m.push(S);let v=1;for(let I=1;I<p.length;I++){let C=o[o.length-I],z=l[l.length-I];if(C===z)v*=C;else break}v%4===0?(y=!0,f=!0):(x||$||w||S)&&(f=!0)}else f=!0;return m.push(f),{name:e,shaderCache:{hint:t+m.map(b=>b.toString()).join("_"),inputDependencies:["rank","rank"]},getShaderSource:b=>al(b,o,l,p,f,d,y,n,r.dataType,i.dataType,s,a),getRunData:()=>({outputs:[{dims:p,dataType:s}],dispatchGroup:{x:Math.ceil(h/64/4)},programUniforms:[{type:12,data:Math.ceil(R.size(p)/4)},...re(o,l,p)]})}},et=(e,t,r,i,n,a)=>{e.compute(sl(t,n??"",e.inputs[0],e.inputs[1],r,i,a))},Uh=e=>{et(e,"Add",(t,r)=>`${t}+${r}`)},Lh=e=>{et(e,"Div",(t,r)=>`${t}/${r}`)},qh=e=>{et(e,"Equal",{scalar:(t,r)=>`u32(${t}==${r})`,vector:(t,r)=>`vec4<u32>(${t}==${r})`},void 0,void 0,9)},Wh=e=>{et(e,"Mul",(t,r)=>`${t}*${r}`)},Gh=e=>{let t=U("input",e.inputs[0].dataType,e.inputs[0].dims).type.value;et(e,"Pow",{scalar:(r,i)=>`pow_custom(${r},${i})`,vector:(r,i)=>`pow_vector_custom(${r},${i})`},`
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
      `)},Vh=e=>{et(e,"Sub",(t,r)=>`${t}-${r}`)},Fh=e=>{et(e,"Greater",{scalar:(t,r)=>`u32(${t}>${r})`,vector:(t,r)=>`vec4<u32>(${t}>${r})`},void 0,void 0,9)},Hh=e=>{et(e,"Less",{scalar:(t,r)=>`u32(${t}<${r})`,vector:(t,r)=>`vec4<u32>(${t}<${r})`},void 0,void 0,9)},jh=e=>{et(e,"GreaterOrEqual",{scalar:(t,r)=>`u32(${t}>=${r})`,vector:(t,r)=>`vec4<u32>(${t}>=${r})`},void 0,void 0,9)},Kh=e=>{et(e,"LessOrEqual",{scalar:(t,r)=>`u32(${t}<=${r})`,vector:(t,r)=>`vec4<u32>(${t}<=${r})`},void 0,void 0,9)}}),ol,ul,ll,dl,Xh,Zh,Vy=W(()=>{ie(),ne(),ze(),ae(),ol=(e,t)=>{if(!e||e.length<1)throw new Error("too few inputs");let r=0,i=e[r],n=i.dataType,a=i.dims.length;e.forEach((s,o)=>{if(o!==r){if(s.dataType!==n)throw new Error("input tensors should be one type");if(s.dims.length!==a)throw new Error("input tensors should have the same shape");s.dims.forEach((l,d)=>{if(d!==t&&l!==i.dims[d])throw new Error("non concat dimensions must match")})}})},ul=(e,t)=>`
  fn calculateInputIndex(index: u32) -> u32 {
    let sizeInConcatAxis = array<u32, ${e}u>(${t});
    for (var i: u32 = 0u; i < ${e}; i += 1u ) {
      if (index < sizeInConcatAxis[i]) {
        return i;
      }
    }
    return ${e}u;
  }`,ll=(e,t)=>{let r=e.length,i=[];for(let n=0;n<r;++n){let a=t.setByOffset("global_idx",e[n].getByIndices("indices"));r===1?i.push(a):n===0?i.push(`if (inputIndex == ${n}u) { ${a} }`):n===r-1?i.push(`else { ${a} }`):i.push(`else if (inputIndex == ${n}) { ${a} }`)}return i.join(`
`)},dl=(e,t,r,i)=>{let n=R.size(r),a=new Array(e.length),s=new Array(e.length),o=0,l=[],d=[],p=[{type:12,data:n}];for(let b=0;b<e.length;++b)o+=e[b].dims[t],a[b]=o,d.push(e[b].dims.length),s[b]=U(`input${b}`,i,d[b]),l.push("rank"),p.push({type:12,data:a[b]});for(let b=0;b<e.length;++b)p.push(...re(e[b].dims));p.push(...re(r));let h=J("output",i,r.length),f=h.indicesGet("indices",t),y=Array.from(Array(a.length).keys()).map(b=>`uniforms.sizeInConcatAxis${b}`).join(","),m=b=>`

  ${(()=>{b.registerUniform("outputSize","u32");for(let x=0;x<e.length;x++)b.registerUniform(`sizeInConcatAxis${x}`,"u32");return b.declareVariables(...s,h)})()}

  ${ul(a.length,y)}

  ${b.mainStart()}
    ${b.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}

    var indices = ${h.offsetToIndices("global_idx")};

    let inputIndex = calculateInputIndex(${f});
    if (inputIndex != 0u) {
      let sizeInConcatAxis = array<u32, ${a.length}u>(${y});
      ${f} -= sizeInConcatAxis[inputIndex - 1u];
    }

    ${ll(s,h)}
  }`;return{name:"Concat",shaderCache:{hint:`${t}`,inputDependencies:l},getRunData:()=>({outputs:[{dims:r,dataType:i}],dispatchGroup:{x:Math.ceil(n/64)},programUniforms:p}),getShaderSource:m}},Xh=(e,t)=>{let r=e.inputs,i=r[0].dims,n=R.normalizeAxis(t.axis,i.length);ol(r,n);let a=i.slice();a[n]=r.reduce((o,l)=>o+(l.dims.length>n?l.dims[n]:0),0);let s=r.filter(o=>R.size(o.dims)>0);e.compute(dl(s,n,a,r[0].dataType),{inputs:s})},Zh=e=>me({axis:e.axis})}),qt,Wt,Gt,za,Ft=W(()=>{ie(),ne(),qt=(e,t,r="f32")=>{switch(e.activation){case"Relu":return`value = max(value, ${t}(0.0));`;case"Sigmoid":return`value = (${t}(1.0) / (${t}(1.0) + exp(-value)));`;case"Clip":return`value = clamp(value, ${t}(${r}(uniforms.clip_min)), ${t}(${r}(uniforms.clip_max)));`;case"HardSigmoid":return`value = max(${t}(0.0), min(${t}(1.0), ${r}(uniforms.alpha) * value + ${r}(uniforms.beta)));`;case"LeakyRelu":return`value = select(${r}(uniforms.alpha) * value, value, value >= ${t}(0.0));`;case"Tanh":return`let e2x = exp(-2.0 * abs(value));
              value = sign(value) * (1.0 - e2x) / (1.0 + e2x);
        `;case"":return"";default:throw new Error(`Unsupported activation ${e.activation}`)}},Wt=(e,t)=>{e.activation==="Clip"?t.push({type:1,data:e.clipMax},{type:1,data:e.clipMin}):e.activation==="HardSigmoid"?t.push({type:1,data:e.alpha},{type:1,data:e.beta}):e.activation==="LeakyRelu"&&t.push({type:1,data:e.alpha})},Gt=(e,t)=>{e.activation==="Clip"?t.push({name:"clip_max",type:"f32"},{name:"clip_min",type:"f32"}):e.activation==="HardSigmoid"?t.push({name:"alpha",type:"f32"},{name:"beta",type:"f32"}):e.activation==="LeakyRelu"&&t.push({name:"alpha",type:"f32"})},za=e=>{let t=e?.activation||"";if(t==="HardSigmoid"){let[r,i]=e?.activation_params||[.2,.5];return{activation:t,alpha:r,beta:i}}else if(t==="Clip"){let[r,i]=e?.activation_params||[vc,xc];return{activation:t,clipMax:i,clipMin:r}}else if(t==="LeakyRelu"){let[r]=e?.activation_params||[.01];return{activation:t,alpha:r}}return{activation:t}}}),Ne,Yh,Aa=W(()=>{Ne=(e,t)=>{switch(e){case 1:return t;case 2:return`vec2<${t}>`;case 3:return`vec3<${t}>`;case 4:return`vec4<${t}>`;default:throw new Error(`${e}-component is not supported.`)}},Yh=e=>`
      ${e?"value = value + getBiasByOutputCoords(coords);":""}
      `}),Qh,Fy=W(()=>{Qh=e=>`
fn getIndexFromCoords4D(coords : vec4<i32>, shape : vec4<i32>) -> i32 {
  return dot(coords, vec4<i32>(
      shape.y * shape.z * shape.w, shape.z * shape.w, shape.w, 1));
}
fn getOutputIndexFromCoords(coords : vec4<i32>) -> i32 {
  return dot(coords, vec4<i32>(
    i32(${e}.x), i32(${e}.y), i32(${e}.z), 1));
}
`}),xr,Ma,Oa=W(()=>{ie(),ne(),ae(),Ft(),xr=(e,t,r,i,n)=>{let a=i-r;return`
      ${Array.from({length:r}).map((s,o)=>`
      if (${te(t.shape,o,t.rank)} != 1) {
        ${t.indicesSet(e,o,te(n,o+a,i))}
      } else {
        ${t.indicesSet(e,o,0)}
      }`).join("")}
`},Ma=(e,t,r,i,n=!1,a)=>{let s=e[0].dims,o=e[1].dims,l=s[s.length-2],d=o[o.length-1],p=s[s.length-1],h=Ie(d),f=Ie(p),y=Ie(l),m=R.size(r)/h/y,b=e.length>2,x=i?i.slice(0,-2):r.slice(0,-2),$=[R.size(x),l,d],w=[{type:12,data:m},{type:12,data:l},{type:12,data:d},{type:12,data:p}];Wt(t,w),w.push(...re(x,s,o)),b&&w.push(...re(e[2].dims)),w.push(...re($));let S=v=>{let I=Ta("batch_dims",e[0].dataType,x.length),C=U("a",e[0].dataType,s.length,f),z=U("b",e[1].dataType,o.length,h),k=J("output",e[0].dataType,$.length,h),N=Oe(k.type.tensor),B=qt(t,k.type.value,N),H=[C,z],q="";if(b){let P=n?h:1;H.push(U("bias",e[2].dataType,e[2].dims.length,P)),q=`${n?`value += bias[col / ${P}];`:`value += ${k.type.value}(bias[row + i]);`}`}let V=[{name:"output_size",type:"u32"},{name:"M",type:"u32"},{name:"N",type:"u32"},{name:"K",type:"u32"}];Gt(t,V);let O=()=>{let P=`var a_data: ${C.type.value};`;for(let G=0;G<f;G++)P+=`
              let b_data${G} = b[(b_offset + (k + ${G}) * uniforms.N + col) / ${h}];`;for(let G=0;G<y;G++){P+=`a_data = a[(a_offset + (row + ${G}) * uniforms.K + k) / ${f}];`;for(let Y=0;Y<f;Y++)P+=`
            values[${G}] = fma(${z.type.value}(a_data${f===1?"":`[${Y}]`}), b_data${Y}, values[${G}]);
`}return P};return`
  ${v.registerUniforms(V).registerInternalVariables(I).declareVariables(...H,k)}
  ${v.mainStart()}
    ${v.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
    let col = (global_idx % (uniforms.N / ${h})) * ${h};
    var index1 = global_idx / (uniforms.N / ${h});
    let stride1 = uniforms.M / ${y};
    let row = (index1 % stride1) * ${y};
    let batch = index1 / stride1;

    ${r.length===2?"":`let batch_indices = ${I.offsetToIndices("batch")};`}

    var a_indices: ${C.type.indices};
    ${xr("a_indices",C,C.rank-2,I.rank,"batch_indices")}
    ${C.indicesSet("a_indices",C.rank-2,0)}
    ${C.indicesSet("a_indices",C.rank-1,0)}
    let a_offset = ${C.indicesToOffset("a_indices")};

    var b_indices: ${z.type.indices};
    ${xr("b_indices",z,z.rank-2,I.rank,"batch_indices")}
    ${z.indicesSet("b_indices",z.rank-2,0)}
    ${z.indicesSet("b_indices",z.rank-1,0)}
    let b_offset = ${z.indicesToOffset("b_indices")};
    var values: array<${k.type.value}, ${y}>;
    for (var k: u32 = 0u; k < uniforms.K; k = k + ${f}) {
      ${O()}
    }
    for (var i = 0u; i < ${y}u; i++) {
      var value = values[i];
      ${q}
      ${B}
      let cur_indices = ${k.type.indices}(batch, row + i, col);
      let offset = ${k.indicesToOffset("cur_indices")};
      ${k.setByOffset(`offset / ${h}`,"value")};
    }
  }
  `};return{name:"MatMulNaive",shaderCache:{hint:`${t.activation};${h};${f};${y};${n}`,inputDependencies:b?["rank","rank","rank"]:["rank","rank"]},getRunData:()=>({outputs:[{dims:a?a(r):r,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(m/64)},programUniforms:w}),getShaderSource:S}}}),pl,cl,ra,cn,hl,ia,fl,pi,Ra=W(()=>{ie(),ne(),ae(),Ft(),Oa(),Aa(),pl=(e,t)=>e?`
        mm_Asub[inputRow][inputCol] = mm_readA(batch,
          kStart + inputRow,
          globalRowStart / innerElementSize + inputCol${t?", batchIndices":""});
        `:`
        mm_Asub[inputRow][inputCol] = mm_readA(batch,
          globalRow + innerRow,
          kStart / innerElementSize + inputCol${t?", batchIndices":""});
        `,cl=(e,t)=>e?`
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
        }`,ra=(e,t,r="f32",i,n=!1,a=32,s=!1,o=32)=>{let l=t[1]*e[1],d=t[0]*e[0],p=n?l:a,h=n?a:l,f=p/t[0],y=a/t[1];if(!((n&&f===4&&e[1]===4||!n&&(f===3||f===4))&&p%t[0]===0&&a%t[1]===0&&e[0]===4))throw new Error(`If transposeA ${n} is true, innerElementSize ${f} and workPerThread[1] ${e[1]} must be 4.
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
  let tileRowB = localRow * ${y};
  for (var t = 0; t < num_tiles; t = t + 1) {
      // Load one tile of A into local memory.
      for (var innerRow = 0; innerRow < rowPerThread; innerRow = innerRow + 1) {
          let inputRow = tileRow + innerRow;
          let inputCol = tileCol;
          ${pl(n,i)}
      }

      // Load one tile of B into local memory.
      for (var innerRow = 0; innerRow < ${y}; innerRow = innerRow + 1) {
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

          ${cl(n,f)}
      }

      workgroupBarrier();
  }

  for (var innerRow = 0; innerRow < rowPerThread; innerRow = innerRow + 1) {
      mm_write(batch, globalRow + innerRow, globalCol, acc[innerRow]);
  }
}`},cn=(e,t)=>e?`
            mm_Asub[inputRow][inputCol] = mm_readA(batch,
              kStart + inputRow,
              globalRowStart + inputCol${t?", batchIndices":""});
            `:`
            mm_Asub[inputRow][inputCol] = mm_readA(batch,
              globalRowStart + inputRow,
              kStart + inputCol${t?", batchIndices":""});
            `,hl=e=>e?"let ACached = mm_Asub[k][tileRow + innerRow];":"let ACached = mm_Asub[tileRow + innerRow][k];",ia=(e,t,r="f32",i,n=!1,a=32,s=!1,o=32,l=!1)=>{let d=e[1]*t[1],p=e[0]*t[0],h=n?d:a,f=n?a:d;if(!(f%t[1]===0&&h%t[0]===0&&a%t[1]===0))throw new Error(`tileAHight ${f} must be divisible by workgroupSize[1]${t[1]}, tileAWidth ${h} must be divisible by workgroupSize[0]${t[0]}, tileInner ${a} must be divisible by workgroupSize[1]${t[1]}`);let y=f/t[1],m=h/t[0],b=a/t[1],x=l?`
    let localRow = i32(localId.y);
    let localCol = i32(localId.x);
    let globalRowStart = i32(workgroupId.y) * ${d};
    let globalColStart = i32(workgroupId.x) * ${p};

    // Loop over shared dimension.
    for (var t = 0; t < num_tiles; t = t + 1) {
      // Load one tile of A into local memory.
      for (var inputRow = localRow; inputRow < ${f}; inputRow = inputRow + ${t[1]}) {
        for (var inputCol = localCol; inputCol < ${h}; inputCol = inputCol + ${t[0]}) {
          ${cn(n,i)}
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

let tileRowA = i32(localId.y) * ${y};
let tileColA = i32(localId.x) * ${m};
let tileRowB = i32(localId.y) * ${b};
// Loop over shared dimension.
for (var t = 0; t < num_tiles; t = t + 1) {
  // Load one tile of A into local memory.
  for (var innerRow = 0; innerRow < ${y}; innerRow = innerRow + 1) {
    for (var innerCol = 0; innerCol < ${m}; innerCol = innerCol + 1) {
      let inputRow = tileRowA + innerRow;
      let inputCol = tileColA + innerCol;
      ${cn(n,i)}
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
      ${hl(n)}
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
    ${x}
  }
`},fl=(e,t,r,i,n=!1)=>{let[a,s,o,l]=i,d=Oe(i[0].type.tensor);return`
    fn mm_readA(batch: i32, row: i32, colIn: i32, batchIndices: ${a.type.indices}) -> ${Ne(e,d)} {
      var value = ${Ne(e,d)}(0.0);
      let col = colIn * ${e};
      if(row < uniforms.dim_a_outer && col < uniforms.dim_inner)
      {
        var aIndices: ${s.type.indices};
        ${xr("aIndices",s,s.rank-2,a.rank,"batchIndices")}
        ${s.indicesSet("aIndices",s.rank-2,"u32(row)")}
        ${s.indicesSet("aIndices",s.rank-1,"u32(colIn)")}
        value = ${s.getByIndices("aIndices")};
      }
      return value;
    }

    fn mm_readB(batch: i32, row: i32, colIn: i32, batchIndices: ${a.type.indices}) -> ${Ne(e,d)} {
      var value = ${Ne(e,d)}(0.0);
      let col = colIn * ${e};
      if(row < uniforms.dim_inner && col < uniforms.dim_b_outer)
      {
        var bIndices: ${o.type.indices};
        ${xr("bIndices",o,o.rank-2,a.rank,"batchIndices")}
        ${o.indicesSet("bIndices",o.rank-2,"u32(row)")}
        ${o.indicesSet("bIndices",o.rank-1,"u32(colIn)")}
        value = ${o.getByIndices("bIndices")};
      }
      return value;
    }

    fn mm_write(batch: i32, row: i32, colIn: i32, valueIn: ${Ne(e,d)}) {
      let col = colIn * ${e};
      if (row < uniforms.dim_a_outer && col < uniforms.dim_b_outer) {
        var value = valueIn;
        let coords = vec3<i32>(batch, row, colIn);
        ${t?`value = value + ${n?"bias[colIn]":`${Ne(e,d)}(bias[row])`};`:""}
        ${r}
        ${l.setByIndices("vec3<u32>(coords)","value")}
      }
    }
    `},pi=(e,t,r,i,n=!1,a)=>{let s=e[0].dims,o=e[1].dims,l=s.slice(0,-2),d=o.slice(0,-2),p=i?i.slice(0,-2):r.slice(0,-2),h=R.size(p),f=s[s.length-2],y=s[s.length-1],m=o[o.length-1],b=y%4===0&&m%4===0,x=f<=8?[4,1,1]:[4,4,1],$=[8,8,1],w=[Math.ceil(m/$[0]/x[0]),Math.ceil(f/$[1]/x[1]),Math.ceil(h/$[2]/x[2])],S=b?4:1,v=[...l,f,y/S],I=v.length,C=[...d,y,m/S],z=C.length,k=[h,f,m/S],N=[{type:6,data:f},{type:6,data:m},{type:6,data:y}];Wt(t,N),N.push(...re(p,v,C));let B=["rank","rank"],H=e.length>2;H&&(N.push(...re(e[2].dims)),B.push("rank")),N.push(...re(k));let q=V=>{let O=p.length,P=Ta("batchDims",e[0].dataType,O,1),G=Oe(e[0].dataType),Y=U("a",e[0].dataType,I,S),L=U("b",e[1].dataType,z,S),F=J("result",e[0].dataType,k.length,S),ee=[Y,L];if(H){let ye=n?S:1;ee.push(U("bias",e[2].dataType,e[2].dims.length,ye))}let A=[{name:"dim_a_outer",type:"i32"},{name:"dim_b_outer",type:"i32"},{name:"dim_inner",type:"i32"}];Gt(t,A);let K=Oe(F.type.tensor),Z=qt(t,F.type.value,K),X=fl(S,H,Z,[P,Y,L,F],n);return`
  ${V.registerUniforms(A).registerInternalVariables(P).declareVariables(...ee,F)}
  ${X}
  ${b?ra(x,$,G,P):ia(x,$,G,P)}
                   `};return{name:"MatMul",shaderCache:{hint:`${x};${t.activation};${b};${n}`,inputDependencies:B},getRunData:()=>({outputs:[{dims:a?a(r):r,dataType:e[0].dataType}],dispatchGroup:{x:w[0],y:w[1],z:w[2]},programUniforms:N}),getShaderSource:q}}}),ml,Jh,Hy=W(()=>{ie(),mt(),ae(),Ft(),Aa(),Fy(),Ra(),ml=(e,t,r,i,n=!1,a,s=4,o=4,l=4,d="f32")=>{let p=N=>{switch(N){case 1:return"resData = x[xIndex];";case 3:return`resData = vec3<${d}>(x[xIndex], x[xIndex + 1], x[xIndex + 2]);`;case 4:return"resData = x[xIndex / 4];";default:throw new Error(`innerElementSize ${N} is not supported.`)}},h=N=>{switch(N){case 1:return"return w[row * i32(uniforms.w_shape[3]) + colIn];";case 4:return"return w[row * i32(uniforms.w_shape[3]) / 4 + colIn];";default:throw new Error(`innerElementSize ${N} is not supported.`)}},f=e?`
    let coord = vec4<i32>(batch, xRow, xCol, xCh);
    `:`
    let coord = vec4<i32>(batch, xCh, xRow, xCol);
    `,y=e?`
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
    `,m=e?"i32(uniforms.x_shape[1])":"i32(uniforms.x_shape[2])",b=e?"i32(uniforms.x_shape[2])":"i32(uniforms.x_shape[3])",x=e?"row":"col",$=e?"col":"row",w=`
    let inChannels = i32(uniforms.w_shape[2]);
    let outWidth = ${e?"i32(uniforms.result_shape[2])":"i32(uniforms.result_shape[3])"};
    let outRow = ${x} / outWidth;
    let outCol = ${x} % outWidth;

    let WRow = ${$} / (i32(uniforms.w_shape[1]) * inChannels);
    let WCol = ${$} / inChannels % i32(uniforms.w_shape[1]);
    let xRow = outRow * uniforms.stride[0] + uniforms.dilation[0] * WRow - uniforms.pad[0];
    let xCol = outCol * uniforms.stride[1] + uniforms.dilation[1] * WCol - uniforms.pad[1];
    let xCh = ${$} % inChannels;
    var resData = ${Ne(s,d)}(0.0);
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
    return ${Ne(s,d)}(0.0);`:i&&r?`
    let col = colIn * ${s};
    ${w}`:`
    let col = colIn * ${s};
    if (row < uniforms.dim_inner && col < uniforms.dim_b_outer) {
      ${w}
    }
    return ${Ne(s,d)}(0.0);`,v=e?i&&r?h(o):`
    let col = colIn * ${o};
    if (row < uniforms.dim_inner && col < uniforms.dim_b_outer) {
      ${h(o)}
    }
    return ${Ne(o,d)}(0.0);`:`
    let col = colIn * ${o};
    if (row < uniforms.dim_inner && col < uniforms.dim_a_outer) {
      ${h(o)}
    }
    return ${Ne(o,d)}(0.0);`,I=Ne(l,d),C=Ne(e?s:o,d),z=Ne(e?o:s,d),k=qt(a,I,d);return`
    fn mm_readA(batch: i32, row : i32, colIn : i32) -> ${C} {
      ${e?S:v}
    }

    fn mm_readB(batch: i32, row : i32, colIn : i32) -> ${z} {
      ${e?v:S}
    }

    fn mm_write(batch: i32, row : i32, colIn : i32, valueIn : ${I}) {
      let col = colIn * ${l};
      if (row < uniforms.dim_a_outer && col < uniforms.dim_b_outer)
      {
      var value = valueIn;
      let outWidth = ${e?"i32(uniforms.result_shape[2])":"i32(uniforms.result_shape[3])"};
      ${y}
      ${Yh(n)}
      ${k}
      setOutputAtCoords(coords[0], coords[1], coords[2], coords[3], value);
      }
    }`},Jh=(e,t,r,i,n,a,s,o,l)=>{let d=t.format==="NHWC",p=d?e[0].dims[3]:e[0].dims[1],h=r[0],f=d?r[2]:r[3],y=d?r[1]:r[2],m=d?r[3]:r[1],b=d&&(p%4===0||p%3===0)&&m%4===0,x=d?m:f*y,$=d?f*y:m,w=[8,8,1],S=i<=8?[4,1,1]:[4,4,1],v=[Math.ceil(x/w[0]/S[0]),Math.ceil($/w[1]/S[1]),Math.ceil(h/w[2]/S[2])];pe("verbose",()=>`[conv2d_mm_webgpu] dispatch = ${v}`);let I=b?d&&p%4!==0?3:4:1,C=w[1]*S[1],z=w[0]*S[0],k=Math.max(w[0]*I,w[1]),N=i%C===0,B=n%z===0,H=a%k===0,q=b?[I,4,4]:[1,1,1],V=[{type:6,data:i},{type:6,data:n},{type:6,data:a},{type:6,data:[t.pads[0],t.pads[1]]},{type:6,data:t.strides},{type:6,data:t.dilations}];Wt(t,V),V.push(...re(e[0].dims,e[1].dims));let O=["rank","rank"];s&&(V.push(...re(e[2].dims)),O.push("rank")),V.push(...re(r));let P=G=>{let Y=[{name:"dim_a_outer",type:"i32"},{name:"dim_b_outer",type:"i32"},{name:"dim_inner",type:"i32"},{name:"pad",type:"i32",length:2},{name:"stride",type:"i32",length:2},{name:"dilation",type:"i32",length:2}];Gt(t,Y);let L=b?4:1,F=Oe(e[0].dataType),ee=`
      fn setOutputAtIndex(flatIndex : i32, value : ${b?`vec4<${F}>`:F}) {
        result[flatIndex] = ${b?`vec4<${F}>`:F}(value);
      }
      fn setOutputAtCoords(d0 : i32, d1 : i32, d2 : i32, d3 : i32, value : ${b?`vec4<${F}>`:F}) {
        let flatIndex = getOutputIndexFromCoords(vec4<i32>(d0, d1, d2, d3));
        setOutputAtIndex(flatIndex ${b?"/ 4":""}, value);
      }`,A=U("x",e[0].dataType,e[0].dims.length,I===3?1:I),K=U("w",e[1].dataType,e[1].dims.length,L),Z=[A,K],X=J("result",e[0].dataType,r.length,L);if(s){let ye=U("bias",e[2].dataType,e[2].dims.length,L);Z.push(ye),ee+=`
        fn getBiasByOutputCoords(coords : vec4<i32>) -> ${b?`vec4<${F}>`:F} {
          return bias[coords.${d?"w":"y"}${b?"/ 4":""}];
        }`}return`
        ${Qh("uniforms.result_strides")}
        //struct Uniforms { xShape : vec4<i32>, wShape : vec4<i32>, outShape : vec4<i32>,
        //  outShapeStrides: vec3<i32>, filterDims : vec2<i32>, pad : vec2<i32>, stride : vec2<i32>,
        //  dilation : vec2<i32>, dimAOuter : i32, dimBOuter : i32, dimInner : i32 };
        ${G.registerUniforms(Y).declareVariables(...Z,X)}
        ${ee}
        ${ml(d,N,B,H,s,t,q[0],q[1],q[2],F)}
        ${b?ra(S,w,F,void 0,!d,k):ia(S,w,F,void 0,!d,k,!1,void 0,o)}`};return{name:"Conv2DMatMul",shaderCache:{hint:`${t.cacheKey};${I};${b};${N};${B};${H};${C};${z};${k}`,inputDependencies:O},getRunData:()=>({outputs:[{dims:l?l(r):r,dataType:e[0].dataType}],dispatchGroup:{x:v[0],y:v[1],z:v[2]},programUniforms:V}),getShaderSource:P}}}),gl,hn,cr,yl,fn,_l,ef,tf,jy=W(()=>{ie(),mt(),ne(),ae(),Ft(),Aa(),gl=e=>{let t=1;for(let r=0;r<e.length;r++)t*=e[r];return t},hn=e=>typeof e=="number"?[e,e,e]:e,cr=(e,t)=>t<=1?e:e+(e-1)*(t-1),yl=(e,t,r,i=1)=>{let n=cr(t,i);return Math.floor((e[0]*(r-1)-r+n)/2)},fn=(e,t,r,i,n)=>{n==null&&(n=yl(e,t[0],i[0]));let a=[0,0,0,r];for(let s=0;s<3;s++)e[s]+2*n>=t[s]&&(a[s]=Math.trunc((e[s]-t[s]+2*n)/i[s]+1));return a},_l=(e,t,r,i,n,a,s,o,l,d)=>{let p,h,f,y;if(e==="VALID"&&(e=0),typeof e=="number"){p={top:e,bottom:e,left:e,right:e,front:e,back:e};let m=fn([t,r,i,1],[o,l,d],1,[n,a,s],e);h=m[0],f=m[1],y=m[2]}else if(Array.isArray(e)){if(!e.every((b,x,$)=>b===$[0]))throw Error(`Unsupported padding parameter: ${e}`);p={top:e[0],bottom:e[1],left:e[2],right:e[3],front:e[4],back:e[5]};let m=fn([t,r,i,1],[o,l,d],1,[n,a,s],e[0]);h=m[0],f=m[1],y=m[2]}else if(e==="SAME_UPPER"){h=Math.ceil(t/n),f=Math.ceil(r/a),y=Math.ceil(i/s);let m=(h-1)*n+o-t,b=(f-1)*a+l-r,x=(y-1)*s+d-i,$=Math.floor(m/2),w=m-$,S=Math.floor(b/2),v=b-S,I=Math.floor(x/2),C=x-I;p={top:S,bottom:v,left:I,right:C,front:$,back:w}}else throw Error(`Unknown padding parameter: ${e}`);return{padInfo:p,outDepth:h,outHeight:f,outWidth:y}},ef=(e,t,r,i,n,a=!1,s="channelsLast")=>{let o,l,d,p,h;if(s==="channelsLast")[o,l,d,p,h]=e;else if(s==="channelsFirst")[o,h,l,d,p]=e;else throw new Error(`Unknown dataFormat ${s}`);let[f,,y,m,b]=t,[x,$,w]=hn(r),[S,v,I]=hn(i),C=cr(y,S),z=cr(m,v),k=cr(b,I),{padInfo:N,outDepth:B,outHeight:H,outWidth:q}=_l(n,l,d,p,x,$,w,C,z,k),V=a?f*h:f,O=[0,0,0,0,0];return s==="channelsFirst"?O=[o,V,B,H,q]:s==="channelsLast"&&(O=[o,B,H,q,V]),{batchSize:o,dataFormat:s,inDepth:l,inHeight:d,inWidth:p,inChannels:h,outDepth:B,outHeight:H,outWidth:q,outChannels:V,padInfo:N,strideDepth:x,strideHeight:$,strideWidth:w,filterDepth:y,filterHeight:m,filterWidth:b,effectiveFilterDepth:C,effectiveFilterHeight:z,effectiveFilterWidth:k,dilationDepth:S,dilationHeight:v,dilationWidth:I,inShape:e,outShape:O,filterShape:t}},tf=(e,t,r,i,n,a)=>{let s=a==="channelsLast";s?e[0].dims[3]:e[0].dims[1];let o=[64,1,1],l={x:r.map((x,$)=>$)},d=[Math.ceil(gl(l.x.map(x=>r[x]))/o[0]),1,1];pe("verbose",()=>`[conv3d_naive_webgpu] dispatch = ${d}`);let p=1,h=R.size(r),f=[{type:12,data:h},{type:12,data:i},{type:12,data:n},{type:12,data:t.strides},{type:12,data:t.dilations}];Wt(t,f),f.push(...re(e[0].dims,e[1].dims));let y=["rank","rank"],m=e.length===3;m&&(f.push(...re(e[2].dims)),y.push("rank")),f.push(...re(r));let b=x=>{let $=[{name:"output_size",type:"u32"},{name:"filter_dims",type:"u32",length:i.length},{name:"pads",type:"u32",length:n.length},{name:"strides",type:"u32",length:t.strides.length},{name:"dilations",type:"u32",length:t.dilations.length}];Gt(t,$);let w=1,S=Oe(e[0].dataType),v=U("x",e[0].dataType,e[0].dims.length,p),I=U("W",e[1].dataType,e[1].dims.length,w),C=[v,I],z=J("result",e[0].dataType,r.length,w),k="";if(m){let H=U("bias",e[2].dataType,e[2].dims.length,w);C.push(H),k+=`
        fn getBiasByOutputCoords(coords : array<u32, 5>) -> ${S} {
          return bias[${s?te("coords",4,5):te("coords",1,5)}];
        }`}let N=Ne(p,S),B=qt(t,N,S);return`
            ${k}
            fn getX(d0 : u32, d1 : u32, d2 : u32, d3 : u32, d4 : u32) -> f32 {
              let aIndices = array<u32, 5>(d0, d1, d2, d3, d4);
              return ${v.getByIndices("aIndices")};
            }
            fn getW(d0 : u32, d1 : u32, d2 : u32, d3 : u32, d4 : u32) -> f32 {
              let aIndices = array<u32, 5>(d0, d1, d2, d3, d4);
              return ${I.getByIndices("aIndices")};
            }
          ${x.registerUniforms($).declareVariables(...C,z)}
          ${x.mainStart()}
          ${x.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
              let coords = ${z.offsetToIndices("global_idx")};
              let batch = ${te("coords",0,v.rank)};
              let d2 = ${s?te("coords",v.rank-1,v.rank):te("coords",1,v.rank)};
              let xFRCCorner = vec3<u32>(${s?te("coords",1,v.rank):te("coords",2,v.rank)},
              ${s?te("coords",2,v.rank):te("coords",3,v.rank)},
              ${s?te("coords",3,v.rank):te("coords",4,v.rank)}) * uniforms.strides - uniforms.pads;
              let xFCorner = xFRCCorner.x;
              let xRCorner = xFRCCorner.y;
              let xCCorner = xFRCCorner.z;
              let xShapeY = ${s?te("uniforms.x_shape",1,v.rank):te("uniforms.x_shape",2,v.rank)};
              let xShapeZ = ${s?te("uniforms.x_shape",2,v.rank):te("uniforms.x_shape",3,v.rank)};
              let xShapeW = ${s?te("uniforms.x_shape",3,v.rank):te("uniforms.x_shape",4,v.rank)};
              let xShapeU = ${s?te("uniforms.x_shape",4,v.rank):te("uniforms.x_shape",1,v.rank)};
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
              ${B}
              result[global_idx] = f32(value);
          }`};return{name:"Conv3DNaive",shaderCache:{hint:`${t.cacheKey};${s};${p};${m}`,inputDependencies:y},getRunData:()=>({outputs:[{dims:r,dataType:e[0].dataType}],dispatchGroup:{x:d[0],y:d[1],z:d[2]},programUniforms:f}),getShaderSource:b}}}),rf,nf,Ky=W(()=>{ie(),ne(),ae(),Ft(),rf=(e,t,r,i)=>{let n=e.length>2,a=n?"value += b[output_channel];":"",s=e[0].dims,o=e[1].dims,l=t.format==="NHWC",d=l?r[3]:r[1],p=d/t.group,h=l&&p>=4?Ie(d):1,f=R.size(r)/h,y=[{type:12,data:f},{type:12,data:t.dilations},{type:12,data:[t.strides[0],t.strides[1]]},{type:12,data:[t.pads[0],t.pads[1]]},{type:12,data:p}];Wt(t,y),y.push(...re(s,[o[0],o[1],o[2],o[3]/h]));let m=n?["rank","rank","rank"]:["rank","rank"];y.push(...re([r[0],r[1],r[2],r[3]/h]));let b=x=>{let $=J("output",e[0].dataType,r.length,h),w=Oe($.type.tensor),S=qt(t,$.type.value,w),v=U("x",e[0].dataType,s.length),I=U("w",e[1].dataType,o.length,h),C=[v,I];n&&C.push(U("b",e[2].dataType,e[2].dims,h));let z=[{name:"output_size",type:"u32"},{name:"dilations",type:"u32",length:t.dilations.length},{name:"strides",type:"u32",length:2},{name:"pads",type:"u32",length:2},{name:"output_channels_per_group",type:"u32"}];Gt(t,z);let k=l?`
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
            let xVal = ${v.get("batch","xHeight","xWidth","input_channel")};
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

            let xVal = ${v.get("batch","input_channel","xHeight","xWidth")};
            let wVal = ${I.get("output_channel","wInChannel","wHeight","wWidth")};
            value += xVal * wVal;
          }
        }
      }
      `;return`
  ${x.registerUniforms(z).declareVariables(...C,$)}

  ${x.mainStart()}
    ${x.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}

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
  }`};return{name:"GroupedConv",shaderCache:{hint:`${t.cacheKey}_${h}`,inputDependencies:m},getRunData:()=>({outputs:[{dims:i?i(r):r,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(f/64)},programUniforms:y}),getShaderSource:b}},nf=(e,t,r,i)=>{let n=e.length>2,a=Ie(r[3]),s=Ie(r[2]),o=R.size(r)/a/s,l=[e[0].dims[0],e[0].dims[1],e[0].dims[2],e[0].dims[3]/a],d=[e[1].dims[0],e[1].dims[1],e[1].dims[2],e[1].dims[3]/a],p=[r[0],r[1],r[2],r[3]/a],h=[{type:12,data:o},{type:6,data:[t.strides[0],t.strides[1]]},{type:6,data:[t.pads[0],t.pads[1]]}];Wt(t,h),h.push(...re(l,d,p));let f=(s-1)*t.strides[1]+d[1],y=m=>{let b=J("output",e[0].dataType,p.length,a),x=Oe(b.type.tensor),$=qt(t,b.type.value,x),w=U("x",e[0].dataType,l.length,a),S=U("w",e[1].dataType,d.length,a),v=[w,S];n&&v.push(U("b",e[2].dataType,e[2].dims,a));let I=n?"value += b[output_channel];":"",C=[{name:"output_size",type:"u32"},{name:"strides",type:"i32",length:2},{name:"pads",type:"i32",length:2}];return Gt(t,C),`
  ${m.registerUniforms(C).declareVariables(...v,b)}
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
  }`};return{name:"GroupedConv-Vectorize",shaderCache:{hint:`${t.cacheKey};${a};${s};${f};${d[0]};${d[1]}`,inputDependencies:n?["rank","rank","type"]:["rank","rank"]},getRunData:()=>({outputs:[{dims:i?i(r):r,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(o/64)},programUniforms:h}),getShaderSource:y}}}),bl,jr,wl,Kr,na,mn,$l,vl,aa,Xy=W(()=>{ne(),Hy(),jy(),Ra(),Ky(),Ft(),Oa(),kt(),bl=(e,t,r,i,n,a)=>{let s=e[0],o=e.slice(a?1:2,a?3:4),l=o.length,d=t[0],p=t.slice(2).map((f,y)=>f+(f-1)*(r[y]-1)),h=o.map((f,y)=>f+i[y]+i[y+l]).map((f,y)=>Math.floor((f-p[y]+n[y])/n[y]));return h.splice(0,0,s),h.splice(a?3:1,0,d),h},jr=[2,3,1,0],wl=(e,t)=>{if(!e||e.length!==2&&e.length!==3)throw new Error("Conv requires 2 or 3 inputs");if(e[0].dims.length>5)throw new Error("greater than 5D is not supported");if(e[0].dims.length!==e[1].dims.length)throw new Error("filter does not have same dimension as input");let r=e[0].dims[t.format==="NHWC"?e[0].dims.length-1:1],i=e[1].dims[1]*t.group;if(r!==i)throw new Error("FILTER_IN_CHANNEL should be equal to DATA_CHANNEL");if(e.length===3&&(e[2].dims.length!==1||e[1].dims[0]!==e[2].dims[0]))throw new Error("invalid bias");let n=e[0].dims.length-2;if(t.dilations.length!==n)throw new Error(`dilations should be ${n}D`);if(t.strides.length!==n)throw new Error(`strides should be ${n}D`);if(t.pads.length!==n*2)throw new Error(`pads should be ${n*2}D`);if(t.kernelShape.length!==0&&t.kernelShape.length!==e[1].dims.length-2)throw new Error("invalid kernel shape")},Kr=(e,t)=>{let r=e.kernelShape.slice();r.length<t[1].dims.length-2&&r.push(...Array(t[1].dims.length-2-r.length).fill(0));for(let a=2;a<t[1].dims.length;++a)r[a-2]===0&&(r[a-2]=t[1].dims[a]);let i=e.pads.slice();li.adjustPadsBasedOnAutoPad(t[0].dims,e.strides,e.dilations,r,i,e.format==="NHWC",e.autoPad);let n=Object.assign({},e);return Object.assign(n,{kernelShape:r,pads:i}),n},na=e=>{let t=za(e),r=e.format,i=["NOTSET","VALID","SAME_UPPER","SAME_LOWER"][e.auto_pad],n=e.dilations,a=e.group,s=e.kernel_shape,o=e.pads,l=e.strides,d=e.w_is_const();return{autoPad:i,format:r,dilations:n,group:a,kernelShape:s,pads:o,strides:l,wIsConst:d,...t,cacheKey:`${e.format};${t.activation};`}},mn=(e,t,r,i)=>{let n=r.format==="NHWC",a=bl(t[0].dims,t[1].dims,r.dilations,r.pads,r.strides,n);if(r.group!==1){let C=[t[0]];if(n){let z=e.kernelCustomData.wT??e.compute(Ge(t[1],jr),{inputs:[1],outputs:[r.wIsConst?-2:-1]})[0];r.wIsConst&&!e.kernelCustomData.wT&&(e.kernelCustomData.wT=z),C.push(z)}else C.push(t[1]);t.length===3&&C.push(t[2]),!e.adapterInfo.isArchitecture("ampere")&&n&&t[1].dims[0]===r.group&&t[1].dims[1]===1&&r.dilations[0]===1&&r.dilations[1]===1?e.compute(nf(C,r,a,i),{inputs:C}):e.compute(rf(C,r,a,i),{inputs:C});return}let s=t.length===3,o=t[0].dims[n?1:2],l=t[0].dims[n?2:3],d=t[0].dims[n?3:1],p=t[1].dims[2],h=t[1].dims[3],f=a[n?1:2],y=a[n?2:3],m=a[n?3:1],b=n&&p===o&&h===l&&r.pads[0]===0&&r.pads[1]===0;if(b||p===1&&h===1&&r.dilations[0]===1&&r.dilations[1]===1&&r.strides[0]===1&&r.strides[1]===1&&r.pads[0]===0&&r.pads[1]===0){let C=a[0],z,k,N,B=[];if(n){let V=e.kernelCustomData.wT??e.compute(Ge(t[1],jr),{inputs:[1],outputs:[r.wIsConst?-2:-1]})[0];if(r.wIsConst&&!e.kernelCustomData.wT&&(e.kernelCustomData.wT=V),b){let O=o*l*d;z=t[0].reshape([1,C,O]),k=V.reshape([1,O,m]),N=[1,C,m]}else z=t[0].reshape([C,o*l,d]),k=V.reshape([1,d,m]),N=[C,f*y,m];B.push(z),B.push(k)}else z=t[0].reshape([C,d,o*l]),k=t[1].reshape([1,m,d]),N=[C,m,f*y],B.push(k),B.push(z);s&&B.push(t[2]);let H=N[2],q=B[0].dims[B[0].dims.length-1];H<8&&q<8?e.compute(Ma(B,r,a,N,n,i),{inputs:B}):e.compute(pi(B,r,a,N,n,i),{inputs:B});return}let x=!0,$=e.kernelCustomData.wT??e.compute(Ge(t[1],jr),{inputs:[1],outputs:[r.wIsConst?-2:-1]})[0];r.wIsConst&&!e.kernelCustomData.wT&&(e.kernelCustomData.wT=$);let w=[t[0],$];s&&w.push(t[2]);let S=n?f*y:m,v=n?m:f*y,I=p*h*d;e.compute(Jh(w,r,a,S,v,I,s,x,i),{inputs:w})},$l=(e,t)=>{let r=t.format==="NHWC",i=[e.inputs[0].reshape(r?[e.inputs[0].dims[0],1,e.inputs[0].dims[1],e.inputs[0].dims[2]]:[e.inputs[0].dims[0],e.inputs[0].dims[1],1,e.inputs[0].dims[2]]),e.inputs[1].reshape([e.inputs[1].dims[0],e.inputs[1].dims[1],1,e.inputs[1].dims[2]])];e.inputs.length===3&&i.push(e.inputs[2]);let n=[0,t.pads[0],0,t.pads[1]],a=[1].concat(t.strides),s=[1].concat(t.dilations),o=[1].concat(t.kernelShape),l=Kr({...t,pads:n,strides:a,dilations:s,kernelShape:o},i);mn(e,i,l,d=>r?[d[0],d[2],d[3]]:[d[0],d[1],d[3]])},vl=(e,t,r)=>{let i=r.format==="NHWC"?"channelsLast":"channelsFirst",n=Kr(r,t),a=r.autoPad==="NOTSET"?r.pads:r.autoPad,s=ef(t[0].dims,t[1].dims,r.strides,r.dilations,a,!1,i);e.compute(tf(t,n,s.outShape,[s.filterDepth,s.filterHeight,s.filterWidth],[s.padInfo.front,s.padInfo.top,s.padInfo.left],i))},aa=(e,t)=>{if(wl(e.inputs,t),e.inputs[0].dims.length===3)$l(e,t);else if(e.inputs[0].dims.length===5)vl(e,e.inputs,t);else{let r=Kr(t,e.inputs);mn(e,e.inputs,r)}}}),af,Zy=W(()=>{ie(),mt(),ne(),ae(),af=(e,t,r)=>{let i=e.length>2,n=t.outputShape,a=t.format==="NHWC",s=t.group,o=e[1].dims,l=o[2]/s,d=o[3],p=a?Ie(l):1,h=a&&d===1&&l>=4,f=h?Math.floor(l/4)*4:Math.floor(l/p)*p,y=l-f,m=a?Ie(d):1,b=a?d===1?p:m:1,x=R.size(n)/m,$=[Math.ceil(x/64),1,1];pe("verbose",()=>`[conv2d_backprop_webgpu] dispatch = ${$}`);let w=["rank","rank"],S=[t.strides[0],t.strides[1]],v=[t.kernelShape[a?1:2],t.kernelShape[a?2:3]],I=[t.dilations[0],t.dilations[1]],C=[v[0]+(t.dilations[0]<=1?0:(t.kernelShape[a?1:2]-1)*(t.dilations[0]-1)),v[1]+(t.dilations[1]<=1?0:(t.kernelShape[a?2:3]-1)*(t.dilations[1]-1))],z=[C[0]-1-Math.floor((t.pads[0]+t.pads[2])/2),C[1]-1-Math.floor((t.pads[1]+t.pads[3])/2)],k=[{type:12,data:x},{type:12,data:S},{type:12,data:v},{type:12,data:I},{type:12,data:C},{type:6,data:z},{type:12,data:f},{type:12,data:l},{type:12,data:d},...re(e[0].dims,e[1].dims)];i&&(k.push(...re(e[2].dims)),w.push("rank")),k.push(...re(n));let N=B=>{let H=[{name:"output_size",type:"u32"},{name:"strides",type:"u32",length:S.length},{name:"filter_dims",type:"u32",length:v.length},{name:"dilations",type:"u32",length:v.length},{name:"effective_filter_dims",type:"u32",length:C.length},{name:"pads",type:"i32",length:z.length},{name:"input_channels_per_group_int",type:"u32"},{name:"input_channels_per_group",type:"u32"},{name:"output_channels_per_group",type:"u32"}],q=Oe(e[0].dataType),V=a?1:2,O=a?2:3,P=a?3:1,G=U("W",e[1].dataType,e[1].dims.length,b),Y=U("Dy",e[0].dataType,e[0].dims.length,p),L=[Y,G];i&&L.push(U("bias",e[2].dataType,[n[P]].length,m));let F=J("result",e[0].dataType,n.length,m),ee=()=>{let Z="";if(h)p===4?Z+=`
        let xValue = ${Y.getByOffset("x_offset")};
        let wValue = ${G.getByOffset("w_offset")};
        dotProd = dotProd + dot(xValue, wValue);
        x_offset += 1u;
        w_offset += 1u;`:p===2?Z+=`
          dotProd = dotProd + dot(vec4<${q}>(${Y.getByOffset("x_offset")}, ${Y.getByOffset("x_offset + 1u")}), vec4<${q}>(${G.getByOffset("w_offset")}, ${G.getByOffset("w_offset + 1u")}));
          x_offset += 2u;
          w_offset += 2u;`:p===1&&(Z+=`
          dotProd = dotProd + dot(vec4<${q}>(${Y.getByOffset("x_offset")}, ${Y.getByOffset("x_offset + 1u")}, ${Y.getByOffset("x_offset + 2u")}, ${Y.getByOffset("x_offset + 3u")}), vec4<${q}>(${G.getByOffset("w_offset")}, ${G.getByOffset("w_offset + 1u")}, ${G.getByOffset("w_offset + 2u")}, ${G.getByOffset("w_offset + 3u")}));
          x_offset += 4u;
          w_offset += 4u;`);else if(Z+=`
                  let xValue = ${a?Y.getByOffset(`${Y.indicesToOffset(`${Y.type.indices}(batch, idyR, idyC, inputChannel)`)} / ${p}`):Y.get("batch","inputChannel","idyR","idyC")};
        `,p===1)Z+=`
          let w_offset = ${G.indicesToOffset(`${G.type.indices}(u32(wRPerm), u32(wCPerm), inputChannel, wOutChannel)`)};
          let wValue = ${G.getByOffset(`w_offset / ${b}`)};
          dotProd = dotProd + xValue * wValue;`;else for(let X=0;X<p;X++)Z+=`
            let wValue${X} = ${G.getByOffset(`${G.indicesToOffset(`${G.type.indices}(u32(wRPerm), u32(wCPerm), inputChannel + ${X}, wOutChannel)`)} / ${b}`)};
            dotProd = dotProd + xValue[${X}] * wValue${X};`;return Z},A=()=>{if(y===0)return"";if(!h)throw new Error(`packInputAs4 ${h} is not true.`);let Z="";if(p===1){Z+="dotProd = dotProd";for(let X=0;X<y;X++)Z+=`
            + ${Y.getByOffset(`x_offset + ${X}`)} * ${G.getByOffset(`w_offset + ${X}`)}`;Z+=";"}else if(p===2){if(y!==2)throw new Error(`Invalid inputChannelsRemainder ${y}.`);Z+=`
          let xValue = ${Y.getByOffset("x_offset")};
          let wValue = ${G.getByOffset("w_offset")};
          dotProd = dotProd + dot(xValue, wValue);`}return Z},K=`
            let outputIndices = ${F.offsetToIndices(`global_idx * ${m}`)};
            let batch = ${F.indicesGet("outputIndices",0)};
            let d1 = ${F.indicesGet("outputIndices",P)};
            let r = ${F.indicesGet("outputIndices",V)};
            let c = ${F.indicesGet("outputIndices",O)};
            let dyCorner = vec2<i32>(i32(r), i32(c)) - uniforms.pads;
            let dyRCorner = dyCorner.x;
            let dyCCorner = dyCorner.y;
            let groupId = d1 / uniforms.output_channels_per_group;
            let wOutChannel = d1 - groupId * uniforms.output_channels_per_group;
            // Convolve dy(?, ?, d2) with w(:, :, d1, d2) to compute dx(xR, xC, d1).
            // ? = to be determined. : = across all values in that axis.
            var dotProd = ${F.type.value}(0.0);
            var wR: u32 = 0;
            if (uniforms.dilations.x == 1) {
              // Minimum wR >= 0 that satisfies (dyRCorner + wR) % (uniforms.strides.x) == 0
              wR = u32(((dyRCorner + i32(uniforms.strides.x) - 1) / i32(uniforms.strides.x)) * i32(uniforms.strides.x) - dyRCorner);
            }
            for (; wR < uniforms.effective_filter_dims.x; wR = wR + 1) {
              if (wR % uniforms.dilations.x != 0) {
                continue;
              }
              let dyR = (${q}(dyRCorner) + ${q}(wR)) / ${q}(uniforms.strides[0]);
              let wRPerm = uniforms.filter_dims.x - 1 - wR / uniforms.dilations.x;
              if (dyR < 0.0 || dyR >= ${q}(uniforms.Dy_shape[${V}]) || fract(dyR) > 0.0 ||
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
                let dyC = (${q}(dyCCorner) + ${q}(wC)) / ${q}(uniforms.strides.y);
                let wCPerm = uniforms.filter_dims.y - 1 - wC / uniforms.dilations.y;
                if (dyC < 0.0 || dyC >= ${q}(uniforms.Dy_shape[${O}]) ||
                    fract(dyC) > 0.0 || wCPerm < 0) {
                  continue;
                }
                let idyC: u32 = u32(dyC);
                var inputChannel = groupId * uniforms.input_channels_per_group;
                ${h?`
                var x_offset = ${Y.indicesToOffset(`${Y.type.indices}(batch, idyR, idyC, inputChannel)`)} / ${p};
                var w_offset = ${G.indicesToOffset(`${G.type.indices}(wRPerm, wCPerm, inputChannel, wOutChannel)`)} / ${b};
                  `:""}
                for (var d2: u32 = 0; d2 < uniforms.input_channels_per_group_int; d2 = d2 + ${h?4:p}) {
                  ${ee()}
                  inputChannel = inputChannel + ${h?4:p};
                }
                ${A()}
                wC = wC + uniforms.strides.y - 1;
              }
              wR = wR + uniforms.strides[0] - 1;
            }
            let value = dotProd${i?` + bias[d1 / ${m}]`:""};
            ${F.setByOffset("global_idx","value")};
          `;return`
    ${B.registerUniforms(H).declareVariables(...L,F)}
      ${B.mainStart()}
      ${B.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")};
    ${K}}`};return{name:"ConvTranspose2D",shaderCache:{hint:`${t.cacheKey};${p}${b}${m}${h}${y}`,inputDependencies:w},getRunData:()=>({dispatchGroup:{x:$[0],y:$[1],z:$[2]},outputs:[{dims:r?r(n):n,dataType:e[0].dataType}],programUniforms:k}),getShaderSource:N}}}),xl,Sl,kl,gn,sf,Tl,yn,Il,of,Yy=W(()=>{Zy(),Ft(),kt(),xl=(e,t,r,i,n,a)=>(e-1)*t+r+(i-1)*n+1-a,Sl=(e,t,r,i,n)=>{let a=Math.floor(e/2);t==="SAME_UPPER"?(r[i]=a,r[n]=e-a):t==="SAME_LOWER"&&(r[i]=e-a,r[n]=a)},kl=(e,t,r,i,n,a,s,o,l,d)=>{let p=e.length-2,h=d.length===0;l.length<p&&l.push(...Array(p-l.length).fill(0));let f=e[0],y=t[o?3:1]*n;for(let m=0,b=e.length-p-(o?1:0);m<p;++m,++b){let x=e[b],$=h?x*s[m]:d[m],w=xl(x,s[m],a[m],t[b],r[m],$);Sl(w,i,a,m,m+p),h&&d.push(s[m]*(x-1)+l[m]+(t[b]-1)*r[m]+1-a[m]-a[m+p])}d.splice(0,0,f),d.splice(o?3:1,0,y)},gn=(e,t)=>{let r=e.kernelShape.slice();if(e.kernelShape.length===0||e.kernelShape.reduce((h,f)=>h*f,1)===0){r.length=0;for(let h=2;h<t[1].dims.length;++h)r.push(t[1].dims[h])}let i=e.format==="NHWC";r.splice(0,0,t[1].dims[0]),r.splice(i?3:1,0,t[1].dims[1]);let n=e.pads.slice(),a=e.outputShape.slice(),s=e.outputPadding.slice(),o=t[0].dims,l=e.dilations.slice();if(l.reduce((h,f)=>h+f,0)===0){let h=t[0].dims.length-2;l=new Array(h).fill(1)}let d=e.strides.slice();if(d.reduce((h,f)=>h+f,0)===0){let h=t[0].dims.length-2;d=new Array(h).fill(1)}kl(o,r,l,e.autoPad,e.group,n,d,i,s,a);let p=Object.assign({},e);return Object.assign(p,{kernelShape:r,pads:n,outputPadding:s,outputShape:a,dilations:l,strides:d}),p},sf=e=>{let t=za(e),r=e.format,i=["NOTSET","VALID","SAME_UPPER","SAME_LOWER"][typeof e.autoPad>"u"?0:e.autoPad],n=e.dilations,a=e.group??1,s=e.kernelShape,o=e.pads,l=e.strides,d=e.wIsConst(),p=e.outputPadding,h=e.outputShape;return{autoPad:i,format:r,dilations:n,group:a,kernelShape:s,outputPadding:p,outputShape:h,pads:o,strides:l,wIsConst:d,...t,cacheKey:`${e.format};${t.activation};`}},Tl=(e,t)=>{if(!e||e.length!==2&&e.length!==3)throw new Error("Conv requires 2 or 3 inputs");if(e[0].dims.length!==4&&e[0].dims.length!==3)throw new Error("currently only support 2-dimensional conv");if(e[0].dims.length!==e[1].dims.length)throw new Error("filter does not have same dimension as input");let r=e[0].dims[t.format==="NHWC"?e[0].dims.length-1:1],i=e[1].dims[0];if(r!==i)throw new Error("FILTER_IN_CHANNEL should be equal to DATA_CHANNEL");let n=e[1].dims[1]*t.group;if(e.length===3&&(e[2].dims.length!==1||e[2].dims[0]!==n))throw new Error("invalid bias");let a=e[0].dims.length-2;if(t.dilations.reduce((s,o)=>s+o,0)>0&&t.dilations.length!==a)throw new Error(`dilations should be ${a}D`);if(t.strides.reduce((s,o)=>s+o,0)>0&&t.strides.length!==a)throw new Error(`strides should be ${a}D`);if(t.pads.reduce((s,o)=>s+o,0)>0&&t.pads.length!==a*2)throw new Error(`pads should be ${a*2}D`);if(t.outputPadding.length!==a&&t.outputPadding.length!==0)throw new Error(`output_padding should be ${a}D`);if(t.kernelShape.reduce((s,o)=>s+o,0)>0&&t.kernelShape.length!==0&&t.kernelShape.length!==e[1].dims.length-2)throw new Error("invalid kernel shape");if(t.outputShape.length!==0&&t.outputShape.length!==e[0].dims.length-2)throw new Error("invalid output shape")},yn=(e,t,r,i)=>{let n=e.kernelCustomData.wT??e.compute(Ge(t[1],[2,3,0,1]),{inputs:[1],outputs:[r.wIsConst?-2:-1]})[0];r.wIsConst&&!e.kernelCustomData.wT&&(e.kernelCustomData.wT=n);let a=[t[0],n];t.length===3&&a.push(t[2]),e.compute(af(a,r,i),{inputs:a})},Il=(e,t)=>{let r=t.format==="NHWC",i=[e.inputs[0].reshape(r?[e.inputs[0].dims[0],1,e.inputs[0].dims[1],e.inputs[0].dims[2]]:[e.inputs[0].dims[0],e.inputs[0].dims[1],1,e.inputs[0].dims[2]]),e.inputs[1].reshape([e.inputs[1].dims[0],e.inputs[1].dims[1],1,e.inputs[1].dims[2]])];e.inputs.length===3&&i.push(e.inputs[2]);let n=t.kernelShape;(n.length===0||n[0]===0)&&(n=[e.inputs[1].dims[2]]);let a=t.dilations;(a.length===0||a[0]===0)&&(a=[1]);let s=t.strides;(s.length===0||s[0]===0)&&(s=[1]);let o=t.pads;o.length===0&&(o=[0,0]),o=[0,o[0],0,o[1]],s=[1].concat(s),a=[1].concat(a),n=[1].concat(n);let l=t.outputPadding;l=[0].concat(l);let d=gn({...t,pads:o,strides:s,dilations:a,kernelShape:n,outputPadding:l},i);yn(e,i,d,p=>r?[p[0],p[2],p[3]]:[p[0],p[1],p[3]])},of=(e,t)=>{if(Tl(e.inputs,t),e.inputs[0].dims.length===3)Il(e,t);else{let r=gn(t,e.inputs);yn(e,e.inputs,r)}}}),El,uf,lf,Qy=W(()=>{ie(),ne(),ze(),ae(),El=(e,t,r,i)=>{let n=R.size(t),a=t.length,s=U("input",e,a),o=J("output",e,a),l=r.dataType===6?r.getInt32Array()[0]:Number(r.getBigInt64Array()[0]),d=R.normalizeAxis(l,a),p=h=>{let f=` i32(${s.indicesGet("inputIndices","uniforms.axis")}) `,y=te("uniforms.input_shape","uniforms.axis",a),m=i.reverse?f+(i.exclusive?" + 1":""):"0",b=i.reverse?y:f+(i.exclusive?"":" + 1");return`
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
                }`};return{name:"CumSum",shaderCache:{hint:i.cacheKey,inputDependencies:["rank"]},getRunData:()=>({outputs:[{dims:t,dataType:e}],dispatchGroup:{x:Math.ceil(n/64)},programUniforms:[{type:12,data:n},{type:12,data:d},...re(t,t)]}),getShaderSource:p}},uf=(e,t)=>{let r=e.inputs[0].dims,i=e.inputs[0].dataType,n=e.inputs[1];e.compute(El(i,r,n,t),{inputs:[0]})},lf=e=>{let t=e.exclusive===1,r=e.reverse===1;return me({exclusive:t,reverse:r})}}),Cl,zl,Al,df,pf,Jy=W(()=>{ie(),ne(),ze(),ae(),Cl=e=>{if(!e||e.length!==1)throw new Error("DepthToSpace requires 1 input.");if(e[0].dims.length!==4)throw new Error("DepthToSpace requires 4D input.")},zl=(e,t,r,i)=>{let n=[];n.push(`fn perm(i: ${i.type.indices}) -> ${r.type.indices} {
    var a: ${r.type.indices};`);for(let a=0;a<t;++a)n.push(r.indicesSet("a",e[a],`i[${a}]`));return n.push("return a;}"),n.join(`
`)},Al=(e,t)=>{let r,i,n,a,s,o,l=t.format==="NHWC",d=t.blocksize,p=t.mode==="DCR";l?([r,i,n,a]=e.dims,s=p?[r,i,n,d,d,a/d**2]:[r,i,n,a/d**2,d,d],o=p?[0,1,3,2,4,5]:[0,1,4,2,5,3]):([r,i,n,a]=[e.dims[0],e.dims[2],e.dims[3],e.dims[1]],s=p?[r,d,d,a/d**2,i,n]:[r,a/d**2,d,d,i,n],o=p?[0,3,4,1,5,2]:[0,1,4,2,5,3]);let h=e.reshape(s),f=h.dims.length,y=e.dataType,m=U("a",y,f),b=J("output",y,f),x=$=>`
  ${$.registerUniform("output_size","u32").declareVariables(m,b)}

  ${zl(o,f,m,b)}

  ${$.mainStart()}
    ${$.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}

    let indices = ${b.offsetToIndices("global_idx")};
    let aIndices = perm(indices);

    ${b.setByOffset("global_idx",m.getByIndices("aIndices"))}
  }`;return{name:"DepthToSpace",shaderCache:{hint:`${e.dims};${t.blocksize};${t.mode}`,inputDependencies:["rank"]},getRunData:$=>{let w=l?[r,i*d,n*d,a/d**2]:[r,a/d**2,i*d,n*d],S=R.size(w),v=h.dims,I=R.sortBasedOnPerm(v,o);return{outputs:[{dims:w,dataType:$[0].dataType}],dispatchGroup:{x:Math.ceil(S/64)},programUniforms:[{type:12,data:S},...re(v,I)]}},getShaderSource:x}},df=(e,t)=>{Cl(e.inputs),e.compute(Al(e.inputs[0],t))},pf=e=>me({blocksize:e.blocksize,mode:e.mode,format:e.format})}),Xr,hr,_n,Ml,Ol,Rl,Nl,bn,Bl,cf,hf,e_=W(()=>{ie(),ne(),ze(),ae(),Xr="[a-zA-Z]|\\.\\.\\.",hr="("+Xr+")+",_n="^"+hr+"$",Ml="("+hr+",)*"+hr,Ol="^"+Ml+"$",Rl=class{constructor(e=-1){this.symbolToIndices=new Map,this.inputIndex=e}addSymbol(e,t){let r=this.symbolToIndices.get(e);r===void 0?r=[t]:r.push(t),this.symbolToIndices.set(e,r)}},Nl=class{constructor(e,t){this.equation=t,this.hasEllipsis=!1,this.symbolToInfo=new Map,this.lhs=new Array,this.outputDims=[];let[r,i]=t.includes("->")?t.split("->",2):[t,""];if(!r.match(RegExp(Ol)))throw new Error("Invalid LHS term");if(r.split(",").forEach((n,a)=>{let s=e[a].dims.slice();if(!n.match(RegExp(_n)))throw new Error("Invalid LHS term");let o=this.processTerm(n,!0,s,a);this.lhs.push(o)}),i==="")i+=[...this.symbolToInfo.entries()].filter(([n,a])=>a.count===1||n==="...").map(([n])=>n).join("");else if(!i.match(RegExp(hr)))throw new Error("Invalid RHS");i.match(RegExp(Xr,"g"))?.forEach(n=>{if(n==="...")this.outputDims=this.outputDims.concat(this.ellipsisDims);else{let a=this.symbolToInfo.get(n);if(a===void 0)throw new Error("Invalid RHS symbol");this.outputDims.push(a.dimValue)}}),this.rhs=this.processTerm(i,!1,this.outputDims)}addSymbol(e,t,r){let i=this.symbolToInfo.get(e);if(i!==void 0){if(i.dimValue!==t&&i.count!==1)throw new Error("Dimension mismatch");i.count++,i.inputIndices.push(r)}else i={count:1,dimValue:t,inputIndices:[r]};this.symbolToInfo.set(e,i)}processTerm(e,t,r,i=-1){let n=r.length,a=!1,s=[],o=0;if(!e.match(RegExp(_n))&&!t&&e!=="")throw new Error("Invalid LHS term");let l=e.match(RegExp(Xr,"g")),d=new Rl(i);return l?.forEach((p,h)=>{if(p==="..."){if(a)throw new Error("Only one ellipsis is allowed per input term");a=!0;let f=n-l.length+1;if(f<0)throw new Error("Ellipsis out of bounds");if(s=r.slice(o,o+f),this.hasEllipsis){if(this.ellipsisDims.length!==s.length||this.ellipsisDims.toString()!==s.toString())throw new Error("Ellipsis dimensions mismatch")}else if(t)this.hasEllipsis=!0,this.ellipsisDims=s;else throw new Error("Ellipsis must be specified in the LHS");for(let y=0;y<s.length;y++){let m=String.fromCharCode(48+y);d.addSymbol(m,h+y),this.addSymbol(m,r[o++],i)}}else d.addSymbol(p,h+(this.hasEllipsis?this.ellipsisDims.length-1:0)),this.addSymbol(p,r[o++],i)}),d}},bn=e=>e+"_max",Bl=(e,t,r,i)=>{let n=e.map(d=>d.length).map((d,p)=>U(`input${p}`,t,d)),a=R.size(i),s=J("output",t,i.length),o=[...r.symbolToInfo.keys()].filter(d=>!r.rhs.symbolToIndices.has(d)),l=d=>{let p=[],h="var prod = 1.0;",f="var sum = 0.0;",y="sum += prod;",m=[],b=[],x=[],$=[],w=r.symbolToInfo.size===r.rhs.symbolToIndices.size;r.symbolToInfo.forEach((v,I)=>{if(r.rhs.symbolToIndices.has(I)){let C=r.rhs.symbolToIndices.get(I)?.[0];C!==void 0&&r.lhs.forEach((z,k)=>{if(v.inputIndices.includes(k)){let N=z.symbolToIndices.get(I);if(N===void 0)throw new Error("Invalid symbol error");N.forEach(B=>{p.push(`${n[k].indicesSet(`input${k}Indices`,B,s.indicesGet("outputIndices",C))}`)})}})}else r.lhs.forEach((C,z)=>{if(v.inputIndices.includes(z)){let k=C.symbolToIndices.get(I);if(k===void 0)throw new Error("Invalid symbol error");k.forEach(N=>{m.push(`${n[z].indicesSet(`input${z}Indices`,N,`${I}`)}`)}),$.push(`prod *= ${n[z].getByIndices(`input${z}Indices`)};`)}}),b.push(`for(var ${I}: u32 = 0; ${I} < uniforms.${bn(I)}; ${I}++) {`),x.push("}")});let S=w?[...p,`let sum = ${n.map((v,I)=>v.getByIndices(`input${I}Indices`)).join(" * ")};`]:[...p,f,...b,...m,h,...$,y,...x];return`
            ${d.registerUniforms(o.map(v=>({name:`${bn(v)}`,type:"u32"}))).registerUniform("outputSize","u32").declareVariables(...n,s)}

            ${d.mainStart()}
            ${d.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}
            var outputIndices = ${s.offsetToIndices("global_idx")};
            ${n.map((v,I)=>`var input${I}Indices: ${n[I].type.indices};`).join(`
`)}
            ${S.join(`
`)};
            ${s.setByOffset("global_idx","sum")};
          }`};return{name:"Einsum",shaderCache:{hint:r.equation,inputDependencies:e.map(()=>"rank")},getRunData:()=>{let d=o.filter(h=>r.symbolToInfo.has(h)).map(h=>({type:12,data:r.symbolToInfo.get(h)?.dimValue||0}));d.push({type:12,data:a});let p=e.map((h,f)=>[...re(h)]).reduce((h,f)=>h.concat(f),d);return p.push(...re(i)),{outputs:[{dims:i,dataType:t}],dispatchGroup:{x:Math.ceil(a/64)},programUniforms:p}},getShaderSource:l}},cf=(e,t)=>{let r=new Nl(e.inputs,t.equation),i=r.outputDims,n=e.inputs.map((a,s)=>a.dims);e.compute(Bl(n,e.inputs[0].dataType,r,i))},hf=e=>{let t=e.equation.replace(/\s+/g,"");return me({equation:t})}}),Dl,wn,Pl,Ul,ff,t_=W(()=>{ie(),ne(),ae(),Dl=e=>{if(!e||e.length!==2)throw new Error("Expand requires 2 input.");let t=e[0].dims,r=Array.from(e[1].getBigInt64Array(),Number),i=r.length<t.length?0:r.length-t.length,n=t.length<r.length?0:t.length-r.length;for(;i<r.length&&n<t.length;++i,++n)if(r[i]!==t[n]&&r[i]!==1&&t[n]!==1)throw new Error("Expand requires shape to be broadcastable to input")},wn=(e,t)=>{let r=e.length-t.length,i=[];for(let n=0;n<r;++n)i.push(e[n]);for(let n=0;n<t.length;++n)i.push(t[n]===1?e[n+r]:t[n]);return i},Pl=(e,t)=>e.length>t.length?wn(e,t):wn(t,e),Ul=e=>{let t=e[0].dims,r=Array.from(e[1].getBigInt64Array(),Number),i=Pl(t,r),n=e[0].dataType,a=n===9||R.size(t)===1,s=n===9||t.length>0&&t[t.length-1]%4===0?4:1,o=a||i.length>0&&i[i.length-1]%4===0?4:1,l=Math.ceil(R.size(i)/o),d=h=>{let f=U("input",n,t.length,s),y=J("output",n,i.length,o),m;if(n===9){let b=(x,$,w="")=>`
          let outputIndices${$} = ${y.offsetToIndices(`outputOffset + ${$}u`)};
          let offset${$} = ${f.broadcastedIndicesToOffset(`outputIndices${$}`,y)};
          let index${$} = offset${$} / 4u;
          let component${$} = offset${$} % 4u;
          ${x}[${$}] = ${w}(${f.getByOffset(`index${$}`)}[component${$}]);
        `;m=`
        let outputOffset = global_idx * ${o};
        var data = vec4<u32>(0);
        ${b("data",0,"u32")}
        ${b("data",1,"u32")}
        ${b("data",2,"u32")}
        ${b("data",3,"u32")}
        ${y.setByOffset("global_idx","data")}
      }`}else m=`
        let outputIndices = ${y.offsetToIndices(`global_idx * ${o}`)};
        let inputOffset = ${f.broadcastedIndicesToOffset("outputIndices",y)};
        let data = ${y.type.value}(${f.getByOffset(`inputOffset / ${s}`)});
        ${y.setByOffset("global_idx","data")}
      }`;return`
    ${h.registerUniform("vec_size","u32").declareVariables(f,y)}
    ${h.mainStart()}
    ${h.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.vec_size")}
    ${m}`},p=[{type:12,data:l},...re(t,i)];return{name:"Expand",shaderCache:{hint:`${i.length};${s}${o}`,inputDependencies:["rank"]},getShaderSource:d,getRunData:()=>({outputs:[{dims:i,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(l/64)},programUniforms:p})}},ff=e=>{Dl(e.inputs),e.compute(Ul(e.inputs),{inputs:[0]})}}),Ll,mf,r_=W(()=>{ie(),ne(),ae(),Ca(),Ll=e=>{let t=e[0].dataType,r=R.size(e[0].dims),i=R.size(e[1].dims),n=i%4===0,a=s=>{let o=U("x",t,[1],4),l=U("bias",t,[1],4),d=J("y",t,[1],4),p=[{name:"output_vec_size",type:"u32"},{name:"bias_size",type:"u32"}],h=y=>`
      let bias${y}_offset: u32 = (global_idx * 4 + ${y}) % uniforms.bias_size;
      let bias${y} = ${l.getByOffset(`bias${y}_offset / 4`)}[bias${y}_offset % 4];`,f=n?`
      let bias = ${l.getByOffset("global_idx % (uniforms.bias_size / 4)")};`:`${h(0)}${h(1)}${h(2)}${h(3)}
      let bias = ${o.type.value}(bias0, bias1, bias2, bias3);`;return`${s.registerUniforms(p).declareVariables(o,l,d)}

    ${ea(Be(t))}

    ${s.mainStart(rr)}
      ${s.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_vec_size")}

      let x = ${o.getByOffset("global_idx")};
      ${f}
      let x_in = x + bias;
      ${d.setByOffset("global_idx",ta("x_in"))}
    }`};return{name:"FastGeluWithBias",shaderCache:{hint:`${n}`,inputDependencies:["type","type"]},getShaderSource:a,getRunData:s=>({outputs:[{dims:s[0].dims,dataType:s[0].dataType}],programUniforms:[{type:12,data:Math.ceil(r/4)},{type:12,data:i}],dispatchGroup:{x:Math.ceil(r/rr/4)}})}},mf=e=>{e.inputs.length<2||R.size(e.inputs[1].dims)===0?Rh(e):e.compute(Ll(e.inputs))}}),ql,Wl,gf,yf,i_=W(()=>{ie(),ne(),ze(),ae(),ql=e=>{if(!e||e.length!==2)throw new Error("Gather requires 2 inputs.")},Wl=(e,t)=>{let r=e[0].dims,i=e[1].dims,n=r.length,a=R.normalizeAxis(t.axis,n),s=r.slice(0);s.splice(a,1,...i);let o=r[a],l=e[0].dataType===9?4:1,d=Math.ceil(R.size(s)/l),p=[{type:12,data:d},{type:6,data:o},{type:12,data:a},...re(e[0].dims,e[1].dims,s)],h=f=>{let y=U("data",e[0].dataType,e[0].dims.length,l),m=U("inputIndices",e[1].dataType,e[1].dims.length),b=J("output",e[0].dataType,s.length,l),x=w=>{let S=i.length,v=`var indicesIndices${w}  = ${m.type.indices}(0);`;for(let I=0;I<S;I++)v+=`${S>1?`indicesIndices${w}[${I}]`:`indicesIndices${w}`} = ${s.length>1?`outputIndices${w}[uniforms.axis + ${I}]`:`outputIndices${w}`};`;v+=`
          var idx${w} = ${m.getByIndices(`indicesIndices${w}`)};
          if (idx${w} < 0) {
            idx${w} = idx${w} + uniforms.axisDimLimit;
          }
          var dataIndices${w} : ${y.type.indices};
        `;for(let I=0,C=0;I<n;I++)I===a?(v+=`${n>1?`dataIndices${w}[${I}]`:`dataIndices${w}`} = u32(idx${w});`,C+=S):(v+=`${n>1?`dataIndices${w}[${I}]`:`dataIndices${w}`} = ${s.length>1?`outputIndices${w}[${C}]`:`outputIndices${w}`};`,C++);return v},$;if(e[0].dataType===9){let w=(S,v,I="")=>`
          let outputIndices${v} = ${b.offsetToIndices(`outputOffset + ${v}u`)};
          ${x(v)};
          let offset${v} = ${y.indicesToOffset(`dataIndices${v}`)};
          let index${v} = offset${v} / 4u;
          let component${v} = offset${v} % 4u;
          ${S}[${v}] = ${I}(${y.getByOffset(`index${v}`)}[component${v}]);
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
      ${x("")};
      let value = ${y.getByIndices("dataIndices")};
      ${b.setByOffset("global_idx","value")};
      `;return`
      ${f.registerUniform("outputSize","u32").registerUniform("axisDimLimit","i32").registerUniform("axis","u32").declareVariables(y,m,b)}
      ${f.mainStart()}
        ${f.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}
        ${$}
      }`};return{name:"Gather",shaderCache:{hint:t.cacheKey,inputDependencies:["rank","rank"]},getRunData:()=>({outputs:[{dims:s,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(d/64)},programUniforms:p}),getShaderSource:h}},gf=e=>me({axis:e.axis}),yf=(e,t)=>{let r=e.inputs;ql(r),e.compute(Wl(e.inputs,t))}}),Gl,_f,bf,n_=W(()=>{ie(),ne(),ae(),Gl=(e,t,r,i,n,a,s,o,l)=>{let d=[{type:12,data:a},{type:12,data:i},{type:12,data:n},{type:12,data:r},{type:12,data:s},{type:12,data:o},{type:12,data:l}],p=[a];d.push(...re(t.dims,p));let h=f=>{let y=U("indices_data",t.dataType,t.dims.length),m=J("input_slice_offsets_data",12,1,1),b=[y,m],x=[{name:"output_size",type:"u32"},{name:"batch_dims",type:"u32"},{name:"input_dims",type:"u32",length:n.length},{name:"sizes_from_slice_dims_data",type:"u32",length:r.length},{name:"num_slices_per_batch",type:"u32"},{name:"input_batch_stride",type:"u32"},{name:"num_slice_dims",type:"u32"}];return`
  ${f.registerUniforms(x).declareVariables(...b)}
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
  }`};return e.compute({name:"computeSliceOffsets",shaderCache:{hint:`${n.length}_${r.length}`,inputDependencies:["rank"]},getRunData:()=>({outputs:[{dims:p,dataType:e.inputs[1].dataType}],dispatchGroup:{x:Math.ceil(a/64)},programUniforms:d}),getShaderSource:h},{inputs:[t],outputs:[-1]})[0]},_f=(e,t)=>{let r=e.inputs,i=r[0].dims,n=r[0].dataType,a=r[1].dims,s=a[a.length-1],o=R.sizeToDimension(a,a.length-1),l=R.sizeFromDimension(i,t.batchDims+s),d=R.sizeToDimension(i,t.batchDims),p=R.sizeFromDimension(i,t.batchDims),h=o/d,f=new Array(s),y=l;for(let v=0;v<s;++v)f[s-1-v]=y,y*=i[t.batchDims+s-1-v];let m=Gl(e,r[1],f,t.batchDims,i,o,h,p,s),b=t.batchDims+s;if(b>i.length)throw new Error("last dimension of indices must not be larger than rank of input tensor");let x=a.slice(0,-1).concat(i.slice(b)),$=R.size(x),w=[{type:12,data:$},{type:12,data:l},...re(r[0].dims,m.dims,x)],S=v=>{let I=U("data",r[0].dataType,r[0].dims.length),C=U("slice_offsets",12,m.dims.length),z=J("output",r[0].dataType,x.length);return`
          ${v.registerUniform("output_size","u32").registerUniform("slice_size","u32").declareVariables(I,C,z)}
            ${v.mainStart()}
            ${v.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
          let slice_offset = slice_offsets[global_idx / uniforms.slice_size];
          output[global_idx] = data[u32(slice_offset) + global_idx % uniforms.slice_size];
        }`};e.compute({name:"GatherND",shaderCache:{hint:t.cacheKey,inputDependencies:["rank","rank"]},getRunData:()=>({outputs:[{dims:x,dataType:n}],dispatchGroup:{x:Math.ceil($/64)},programUniforms:w}),getShaderSource:S},{inputs:[r[0],m]})},bf=e=>({batchDims:e.batch_dims,cacheKey:""})}),Vl,Fl,wf,$f,a_=W(()=>{ie(),ne(),ze(),ae(),Vl=(e,t)=>{if(e.length<3||e.length>4)throw new Error("GatherBlockQuantized requires 3 or 4 inputs.");let r=R.normalizeAxis(t.quantizeAxis,e[0].dims.length),i=t.blockSize,n=e[0],a=e[2],s=e.length===4?e[3]:void 0;if(a.dims.length!==n.dims.length||!n.dims.map((o,l)=>l===r?Math.ceil(o/i)===a.dims[l]:o===a.dims[l]).reduce((o,l)=>o&&l,!0))throw new Error("Scales must have the same rank as the input tensor and the dims should match except on gatherAxis.");if(s){if(s.dataType!==n.dataType)throw new Error("Zero point must have the same data type as the input tensor.");if(s.dims.length!==a.dims.length||!s.dims.map((o,l)=>o===a.dims[l]).reduce((o,l)=>o&&l,!0))throw new Error("Zero point must have the same rank as the input tensor and the dims should match except on quantizeAxis.")}},Fl=(e,t)=>{let r=e[0].dims,i=e[1].dims,n=r.length,a=R.normalizeAxis(t.gatherAxis,n),s=R.normalizeAxis(t.quantizeAxis,n),o=r.slice(0);o.splice(a,1,...i);let l=R.size(o),d=e[2].dataType,p=e[0].dataType===22,h=[{type:12,data:l},{type:12,data:s},{type:12,data:a},{type:12,data:t.blockSize},...re(...e.map((y,m)=>y.dims),o)],f=y=>{let m=U("data",e[0].dataType,e[0].dims.length),b=U("inputIndices",e[1].dataType,e[1].dims.length),x=U("scales",e[2].dataType,e[2].dims.length),$=e.length>3?U("zeroPoint",e[3].dataType,e[3].dims.length):void 0,w=J("output",d,o.length),S=[m,b,x];$&&S.push($);let v=[{name:"output_size",type:"u32"},{name:"quantize_axis",type:"u32"},{name:"gather_axis",type:"u32"},{name:"block_size",type:"u32"}];return`
        ${y.registerUniforms(v).declareVariables(...S,w)}
        ${y.mainStart()}
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
        let quantize_axis_index = ${x.indicesGet("data_indices","uniforms.quantize_axis")} / uniforms.block_size;
        ${x.indicesSet("scale_indices","uniforms.quantize_axis","quantize_axis_index")};
        var scale = ${x.getByIndices("scale_indices")};
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
    }`};return{name:"GatherBlockQuantized",shaderCache:{hint:`${t.cacheKey};${e.filter((y,m)=>m!==1).map(y=>y.dims.join("_")).join(";")}`,inputDependencies:Array.from({length:e.length},(y,m)=>"rank")},getRunData:()=>({outputs:[{dims:o,dataType:d}],dispatchGroup:{x:Math.ceil(l/64)},programUniforms:h}),getShaderSource:f}},wf=(e,t)=>{let r=e.inputs;Vl(r,t),e.compute(Fl(e.inputs,t))},$f=e=>me({blockSize:e.blockSize,gatherAxis:e.gatherAxis,quantizeAxis:e.quantizeAxis})}),Hl,jl,vf,xf,s_=W(()=>{ie(),ne(),ze(),ae(),Hl=e=>{if(!e||e.length!==2)throw new Error("GatherElements requires 2 inputs.");if(e[0].dims.length<1)throw new Error("GatherElements requires that the data input be rank >= 1.");if(e[0].dims.length!==e[1].dims.length)throw new Error(`GatherElements requires that the data input and
                     indices input tensors be of same rank.`)},jl=(e,t)=>{let r=e[0].dims,i=e[0].dataType,n=r.length,a=e[1].dims,s=e[1].dataType,o=R.normalizeAxis(t.axis,n),l=r[o],d=a.slice(0),p=R.size(d),h=U("input",i,n),f=U("indicesInput",s,a.length),y=J("output",i,d.length),m=[{type:12,data:p},{type:6,data:l},{type:12,data:o}];return m.push(...re(r,a,d)),{name:"GatherElements",shaderCache:{inputDependencies:["rank","rank"]},getRunData:()=>({outputs:[{dims:d,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(p/64)},programUniforms:m}),getShaderSource:b=>`
      ${b.registerUniform("outputSize","u32").registerUniform("axisDimLimit","i32").registerUniform("axis","u32").declareVariables(h,f,y)}
      ${b.mainStart()}
      ${b.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}

      let outputIndices = ${y.offsetToIndices("global_idx")};

      var idx = ${f.getByOffset("global_idx")};
      if (idx < 0) {
        idx = idx + uniforms.axisDimLimit;
      }
      var inputIndices = ${h.type.indices}(outputIndices);
      ${h.indicesSet("inputIndices","uniforms.axis","u32(idx)")};
      let value = ${h.getByIndices("inputIndices")};

      ${y.setByOffset("global_idx","value")};
  }`}},vf=e=>me({axis:e.axis}),xf=(e,t)=>{let r=e.inputs;Hl(r),e.compute(jl(e.inputs,t))}}),Kl,Xl,Sf,kf,o_=W(()=>{ie(),ne(),ae(),Kl=e=>{if(!e)throw new Error("Input is missing");if(e.length<2||e.length>3)throw new Error("Invaid input number.");if(e.length===3&&e[2].dims.length>2)throw new Error("Invalid input shape of C");if(e[0].dataType!==e[1].dataType||e.length===3&&e[0].dataType!==e[2].dataType)throw new Error("Input types are mismatched")},Xl=(e,t)=>{let r=e[0].dims.slice(),i=e[1].dims.slice(),[n,a,s]=$c.getShapeOfGemmResult(r,t.transA,i,t.transB,e.length===3?e[2].dims:void 0),o=[n,a];if(!o)throw new Error("Can't use gemm on the given tensors");let l=16,d=Math.ceil(a/l),p=Math.ceil(n/l),h=!0,f=R.size(o),y=[{type:12,data:h?d:f},{type:12,data:n},{type:12,data:a},{type:12,data:s},{type:1,data:t.alpha},{type:1,data:t.beta}],m=["type","type"];e.length===3&&(y.push(...re(e[2].dims)),m.push("rank")),y.push(...re(o));let b=$=>{let w="";t.transA&&t.transB?w="value += a[k * uniforms.M + m] * b[n * uniforms.K + k];":t.transA&&!t.transB?w="value += a[k * uniforms.M + m] * b[k * uniforms.N + n];":!t.transA&&t.transB?w="value += a[m * uniforms.K + k] * b[n * uniforms.K + k];":!t.transA&&!t.transB&&(w="value += a[m * uniforms.K + k] * b[k * uniforms.N + n];");let S=t.alpha===1?"":"value *= uniforms.alpha;",v=U("a",e[0].dataType,e[0].dims),I=U("b",e[1].dataType,e[1].dims),C=v.type.value,z=null,k=[v,I];e.length===3&&(z=U("c",e[2].dataType,e[2].dims.length),k.push(z));let N=J("output",e[0].dataType,o.length);k.push(N);let B=[{name:"output_size",type:"u32"},{name:"M",type:"u32"},{name:"N",type:"u32"},{name:"K",type:"u32"},{name:"alpha",type:"f32"},{name:"beta",type:"f32"}];return`
  ${$.registerUniforms(B).declareVariables(...k)}

  ${$.mainStart()}
    ${$.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}

    let m = global_idx / uniforms.N;
    let n = global_idx % uniforms.N;

    var value = ${C}(0);
    for (var k: u32 = 0u; k < uniforms.K; k++) {
      ${w}
    }

    ${S}
    ${z!=null?`let cOffset = ${z.broadcastedIndicesToOffset("vec2(m, n)",N)}; value += ${C}(uniforms.beta) * ${z.getByOffset("cOffset")};`:""}
    output[global_idx] = value;
  }`},x=$=>{let w=U("a",e[0].dataType,e[0].dims),S=U("b",e[1].dataType,e[1].dims),v=null,I=[w,S];e.length===3&&(v=U("c",e[2].dataType,e[2].dims.length),I.push(v));let C=J("output",e[0].dataType,o.length);I.push(C);let z=[{name:"num_tile_n",type:"u32"},{name:"M",type:"u32"},{name:"N",type:"u32"},{name:"K",type:"u32"},{name:"alpha",type:"f32"},{name:"beta",type:"f32"}],k="",N="";t.transA&&t.transB?(N=`
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
      `,k="value += tile_a[k][local_id.y] * tile_b[local_id.x][k];"):t.transA&&!t.transB?(N=`
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
      `,k="value += tile_a[k][local_id.y] * tile_b[k][local_id.x];"):!t.transA&&t.transB?(N=`
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
      `,k="value += tile_a[local_id.y][k] * tile_b[local_id.x][k];"):!t.transA&&!t.transB&&(N=`
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
      `,k="value += tile_a[local_id.y][k] * tile_b[k][local_id.x];");let B=t.alpha===1?"":"value *= uniforms.alpha;";return`
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
      ${N}
      k_start = k_start + ${l};
      workgroupBarrier();

      for (var k: u32 = 0u; k < ${l}; k++) {
        ${k}
      }
      workgroupBarrier();
    }

    ${B}
    let m = tile_row_start + local_id.y;
    let n = tile_col_start + local_id.x;
    ${v!=null?`let cOffset = ${v.broadcastedIndicesToOffset("vec2(m, n)",C)}; value += ${C.type.value}(uniforms.beta) * ${v.getByOffset("cOffset")};`:""}
    if (m < uniforms.M && n < uniforms.N) {
      output[m * uniforms.N + n] = value;
    }
  }`};return h?{name:"GemmShared",shaderCache:{hint:`${t.cacheKey}`,inputDependencies:m},getRunData:()=>({outputs:[{dims:o,dataType:e[0].dataType}],dispatchGroup:{x:d*p},programUniforms:y}),getShaderSource:x}:{name:"Gemm",shaderCache:{hint:`${t.cacheKey}`,inputDependencies:m},getRunData:()=>({outputs:[{dims:o,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(f/64)},programUniforms:y}),getShaderSource:b}},Sf=e=>{let t=e.transA,r=e.transB,i=e.alpha,n=e.beta;return{transA:t,transB:r,alpha:i,beta:n,cacheKey:`${e.transA};${e.transB};${e.alpha===1}`}},kf=(e,t)=>{Kl(e.inputs),e.compute(Xl(e.inputs,t))}}),ut,ht,zt,At,Zl,Yl,Ql,Jl,ed,td,rd,id,Tf,If,u_=W(()=>{ie(),ne(),ze(),ae(),[ut,ht,zt,At]=[0,1,2,3],Zl=e=>{if(e[0].dims.length!==4)throw new Error("only 4-D tensor is supported.");if(e[0].dims.length!==e[1].dims.length)throw new Error("input dimensions must be equal to grid dimensions");if(e[0].dims.length-2!==e[1].dims[e[1].dims.length-1])throw new Error(`last dimension of grid must be equal to ${e[0].dims.length-2}`);if(e[0].dims[0]!==e[1].dims[0])throw new Error("grid batch size must match input batch size")},Yl=`
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
`,Ql=e=>`
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
`,Jl=e=>`
  fn gs_denormalize(n: f32, length: i32) -> f32 {
    ${e.alignCorners===0?`
    // alignCorners: false => [-1, 1] to [-0.5, length - 0.5]
    return ((n + 1.0) * f32(length) - 1.0) / 2.0;
    `:`
    // alignCorners: true => [-1, 1] to [0, length - 1]
    return (n + 1.0) / 2.0 * (f32(length - 1));
    `}
  }
`,ed=e=>`
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
`,td=(e,t,r)=>`
  fn pixel_at_grid(r: i32, c: i32, H: i32, W: i32, batch: u32, channel: u32, border: vec4<f32>) -> ${t} {
     var pixel = ${t}(0);
     var indices = vec4<u32>(0);
     indices[${ut}] = batch;
     indices[${ht}] = channel;`+(()=>{switch(r.paddingMode){case"zeros":return`
          if (r >= 0 && r < H && c >=0 && c < W) {
            indices[${zt}] = u32(r);
            indices[${At}] = u32(c);
          } else {
            return ${t}(0);
          }
        `;case"border":return`
          indices[${zt}] = u32(clamp(r, 0, H - 1));
          indices[${At}] = u32(clamp(c, 0, W - 1));
        `;case"reflection":return`
          indices[${zt}] = gs_reflect(r, border[1], border[3]);
          indices[${At}] = gs_reflect(c, border[0], border[2]);
        `;default:throw new Error(`padding mode ${r.paddingMode} is not supported`)}})()+`
    return ${e.getByIndices("indices")};
  }
`,rd=(e,t,r)=>(()=>{switch(r.mode){case"nearest":return`
          let result = pixel_at_grid(i32(round(y)), i32(round(x)), H_in, W_in, indices[${ut}], indices[${ht}], border);
        `;case"bilinear":return`
          let x1 = i32(floor(x));
          let y1 = i32(floor(y));
          let x2 = x1 + 1;
          let y2 = y1 + 1;

          let p11 = pixel_at_grid(y1, x1, H_in, W_in, indices[${ut}], indices[${ht}], border);
          let p12 = pixel_at_grid(y1, x2, H_in, W_in, indices[${ut}], indices[${ht}], border);
          let p21 = pixel_at_grid(y2, x1, H_in, W_in, indices[${ut}], indices[${ht}], border);
          let p22 = pixel_at_grid(y2, x2, H_in, W_in, indices[${ut}], indices[${ht}], border);

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
              p[h][w] = pixel_at_grid(h + y0, w + x0, H_in, W_in, indices[${ut}], indices[${ht}], border);
            }
          }

          let dx = x - f32(x0 + 1);
          let dy = y - f32(y0 + 1);
          let result = gs_bicubic_interpolate(p, dx, dy);
        `;default:throw new Error(`mode ${r.mode} is not supported`)}})()+`${e.setByOffset("global_idx","result")}`,id=(e,t)=>{let r=U("x",e[0].dataType,e[0].dims.length),i=[e[1].dims[0],e[1].dims[1],e[1].dims[2]],n=U("grid",e[1].dataType,i.length,2),a=[e[0].dims[0],e[0].dims[1],e[1].dims[1],e[1].dims[2]];t.format==="NHWC"&&(a=[e[0].dims[0],e[1].dims[1],e[1].dims[2],e[0].dims[3]],[ut,ht,zt,At]=[0,3,1,2]);let s=J("output",e[0].dataType,a.length),o=r.type.value,l=R.size(a),d=[{type:12,data:l},...re(e[0].dims,i,a)],p=h=>`
  ${h.registerUniform("output_size","u32").declareVariables(r,n,s)}
  ${Yl}
  ${Ql(o)}
  ${Jl(t)}
  ${ed(t)}
  ${td(r,o,t)}

  ${h.mainStart()}
    ${h.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
      let H_in = i32(uniforms.x_shape[${zt}]);
      let W_in = i32(uniforms.x_shape[${At}]);

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
      var grid_indices = vec3<u32>(indices[${ut}], indices[${zt}], indices[${At}]);
      let nxy = ${n.getByIndices("grid_indices")};
      var x = gs_denormalize(f32(nxy[0]), W_in);
      var y = gs_denormalize(f32(nxy[1]), H_in);

      ${rd(s,o,t)}
  }`;return{name:"GridSample",shaderCache:{hint:`${t.cacheKey}`,inputDependencies:["type","type"]},getRunData:h=>{let f=R.size(a);return{outputs:[{dims:a,dataType:h[0].dataType}],dispatchGroup:{x:Math.ceil(f/64)},programUniforms:d}},getShaderSource:p}},Tf=(e,t)=>{Zl(e.inputs),e.compute(id(e.inputs,t))},If=e=>me({alignCorners:e.align_corners,mode:e.mode,paddingMode:e.padding_mode,format:e.format})}),Pe,nd,Ef,$n,ad,vr,Cf,zf=W(()=>{ie(),ne(),ze(),ka(),Ea(),ae(),kt(),Pe=(e,t)=>e.length>t&&e[t].dims.length>0?e[t]:void 0,nd=(e,t)=>{let r=e[0],i=Pe(e,1),n=Pe(e,2),a=Pe(e,3),s=Pe(e,4),o=Pe(e,5),l=Pe(e,6),d=Pe(e,7);if(r.dims.length!==3&&r.dims.length!==5)throw new Error("Input query is expected to have 3 or 5 dimensions");let p=r.dims[0],h=r.dims[1],f=r.dims.length===3?r.dims[2]:t.numHeads*r.dims[4],y=h,m=0,b=0,x=Math.floor(f/t.numHeads);if(l&&d&&R.size(l.dims)&&R.size(d.dims)){if(l.dims.length!==4)throw new Error('Input "past_key" is expected to have 4 dimensions');if(l.dims[0]!==p||l.dims[1]!==t.numHeads||l.dims[3]!==x)throw new Error('Input "past_key" shape (batch_size, num_heads, past_sequence_length, head_size)');if(d.dims[0]!==p||d.dims[1]!==t.numHeads||d.dims[3]!==x)throw new Error('Input "past_value" shape (batch_size, num_heads, past_sequence_length, head_size)');if(l.dims[2]!==d.dims[2])throw new Error('Input "past_key" and "past_value" shall have same dim 2 (past_sequence_length)');if(d.dims.length!==4)throw new Error('Input "past_value" is expected to have 4 dimensions');m=l.dims[2],b=l.dims[2]}else if(l&&R.size(l.dims)||d&&R.size(d.dims))throw new Error('Input "past_key" and "past_value" shall be both present or both absent');let $;if(i&&R.size(i.dims)>0){if(r.dims.length!==3)throw new Error('Input "query" is expected to have 3 dimensions when key is given');if(i.dims.length<3||i.dims.length>5)throw new Error('Input "key" is expected to have 3, 4, or 5 dimensions');if(r.dims[0]!==i.dims[0])throw new Error('Input "query" and "key" shall have same dim 0 (batch size)');if(i.dims.length===3){if(i.dims[2]!==r.dims[2])throw new Error('Input "query" and "key" shall have same dim 2 (hidden_size)');$=2,y=i.dims[1]}else if(i.dims.length===5){if(i.dims[2]!==t.numHeads||i.dims[3]!==2||i.dims[4]!==x)throw new Error('Expect "key" shape (batch_size, kv_sequence_length, num_heads, 2, head_size) for packed kv');if(n)throw new Error('Expect "value" be none when "key" has packed kv format.');$=5,y=i.dims[1]}else{if(i.dims[1]!==t.numHeads||i.dims[3]!==x)throw new Error('Expect "key" shape (batch_size, num_heads, kv_sequence_length, head_size) for past_key');$=0,y=i.dims[2]}}else{if(r.dims.length!==5)throw new Error('Input "query" is expected to have 5 dimensions when key is empty');if(r.dims[2]!==t.numHeads||r.dims[3]!==3)throw new Error('Expect "query" shape (batch_size, kv_sequence_length, num_heads, 3, head_size) for packed kv');$=3}if(a&&R.size(a.dims)>0){if(a.dims.length!==1)throw new Error('Input "bias" is expected to have 1 dimension');if(i&&i.dims.length===5&&i.dims[3]===2)throw new Error("bias is not allowed for packed kv.")}let w=m+y,S=0;if(s&&R.size(s.dims)>0){S=8;let z=s.dims;throw z.length===1?z[0]===p?S=1:z[0]===3*p+2&&(S=3):z.length===2&&z[0]===p&&z[1]===w&&(S=5),S===8?new Error('Input "key_padding_mask" shape shall be (batch_size) or (batch_size, total_sequence_length)'):new Error("Mask not supported")}let v=!1,I=f;if(n&&R.size(n.dims)>0){if(n.dims.length!==3&&n.dims.length!==4)throw new Error('Input "value" is expected to have 3 or 4 dimensions');if(r.dims[0]!==n.dims[0])throw new Error('Input "query" and "value" shall have same dim 0 (batch_size)');if(n.dims.length===3){if(y!==n.dims[1])throw new Error('Input "key" and "value" shall have the same dim 1 (kv_sequence_length)');I=n.dims[2]}else{if(y!==n.dims[2])throw new Error('Input "key" and "value" shall have the same dim 2 (kv_sequence_length)');I=n.dims[1]*n.dims[3],v=!0}}let C=!1;if(s&&R.size(s.dims)>0)throw new Error("Key padding mask is not supported");if(o&&R.size(o.dims)>0){if(o.dims.length!==4)throw new Error('Input "attention_bias" is expected to have 4 dimensions');if(o.dims[0]!==p||o.dims[1]!==t.numHeads||o.dims[2]!==h||o.dims[3]!==w)throw new Error('Expect "attention_bias" shape (batch_size, num_heads, sequence_length, total_sequence_length)')}return{batchSize:p,sequenceLength:h,pastSequenceLength:m,kvSequenceLength:y,totalSequenceLength:w,maxSequenceLength:b,inputHiddenSize:0,hiddenSize:f,vHiddenSize:I,headSize:x,vHeadSize:Math.floor(I/t.numHeads),numHeads:t.numHeads,isUnidirectional:!1,pastPresentShareBuffer:!1,maskFilterValue:t.maskFilterValue,maskType:S,scale:t.scale,broadcastResPosBias:C,passPastInKv:v,qkvFormat:$}},Ef=e=>me({...e}),$n=me({perm:[0,2,1,3]}),ad=(e,t,r,i,n,a,s)=>{let o=[i,n,a],l=R.size(o),d=[{type:12,data:l},{type:12,data:s},{type:12,data:a}],p=h=>{let f=J("qkv_with_bias",t.dataType,o),y=U("qkv",t.dataType,o),m=U("bias",r.dataType,o),b=[{name:"output_size",type:"u32"},{name:"bias_offset",type:"u32"},{name:"hidden_size",type:"u32"}];return`
  ${h.registerUniforms(b).declareVariables(y,m,f)}
  ${h.mainStart()}
    ${h.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
    let bias_offset_idx = (global_idx % uniforms.hidden_size) + uniforms.bias_offset;

    qkv_with_bias[global_idx] = qkv[global_idx] + bias[bias_offset_idx];
  }`};return e.compute({name:"MultiHeadAttentionAddBias",shaderCache:{inputDependencies:["type","type"]},getRunData:()=>({outputs:[{dims:o,dataType:t.dataType,gpuDataType:0}],dispatchGroup:{x:Math.ceil(l/64)},programUniforms:d}),getShaderSource:p},{inputs:[t,r],outputs:[-1]})[0]},vr=(e,t,r,i,n,a,s,o)=>{let l=a;if(s&&R.size(s.dims)>0){if(i===1)throw new Error("AddBiasReshape is not implemented. Please export your model with packed QKV or KV");return l=ad(e,a,s,t,i,r*n,o),l=l.reshape([t,i,r,n]),r===1||i===1?l:e.compute(Ge(l,$n.perm),{inputs:[l],outputs:[-1]})[0]}else return a.dims.length===3&&(l=a.reshape([t,i,r,n])),r===1||i===1?l:e.compute(Ge(l,$n.perm),{inputs:[l],outputs:[-1]})[0]},Cf=(e,t)=>{let r=nd(e.inputs,t),i=e.inputs[0],n=Pe(e.inputs,1),a=Pe(e.inputs,2),s=Pe(e.inputs,3),o=Pe(e.inputs,4),l=Pe(e.inputs,5),d=Pe(e.inputs,6),p=Pe(e.inputs,7);if(i.dims.length===5)throw new Error("Packed QKV is not implemented");if(n?.dims.length===5)throw new Error("Packed KV is not implemented");let h=n&&a&&n.dims.length===4&&a.dims.length===4,f=vr(e,r.batchSize,r.numHeads,r.sequenceLength,r.headSize,i,s,0);if(h)return kr(e,f,n,a,o,void 0,d,p,l,r);if(!n||!a)throw new Error("key and value must be provided");let y=vr(e,r.batchSize,r.numHeads,r.kvSequenceLength,r.headSize,n,s,r.hiddenSize),m=vr(e,r.batchSize,r.numHeads,r.kvSequenceLength,r.vHeadSize,a,s,2*r.hiddenSize);kr(e,f,y,m,o,void 0,d,p,l,r)}}),sd,od,ud,ld,sa,Af,Mf,Of=W(()=>{ie(),ne(),ze(),ae(),sd=e=>{if(!e||e.length<1)throw new Error("too few inputs")},od=(e,t)=>{let r=[],i=t.numOutputs;return e[1].dims[0]>0&&(e[1].getBigInt64Array().forEach(n=>r.push(Number(n))),i=r.length),me({numOutputs:i,axis:t.axis,splitSizes:r})},ud=e=>`
fn calculateOutputIndex(index: u32) -> u32 {
    for (var i: u32 = 0u; i < ${e}u; i += 1u ) {
    if (index < ${te("uniforms.size_in_split_axis","i",e)}) {
        return i;
    }
    }
    return ${e}u;
}`,ld=e=>{let t=e.length,r=[];for(let i=0;i<t;++i){let n=e[i].setByIndices("indices","input[global_idx]");t===1?r.push(n):i===0?r.push(`if (output_number == ${i}u) { ${n} }`):i===t-1?r.push(`else { ${n} }`):r.push(`else if (output_number == ${i}) { ${n} }`)}return`
      fn writeBufferData(output_number: u32, indices: ${e[0].type.indices}, global_idx: u32) {
        ${r.join(`
`)}
      }`},sa=(e,t)=>{let r=e[0].dims,i=R.size(r),n=e[0].dataType,a=R.normalizeAxis(t.axis,r.length),s=new Array(t.numOutputs),o=U("input",n,r.length),l=new Array(t.numOutputs),d=[],p=[],h=0,f=[{type:12,data:i}];for(let m=0;m<t.numOutputs;m++){h+=t.splitSizes[m],l[m]=h;let b=r.slice();b[a]=t.splitSizes[m],p.push(b),s[m]=J(`output${m}`,n,b.length),d.push({dims:p[m],dataType:e[0].dataType})}f.push({type:12,data:l},...re(r,...p));let y=m=>`
  ${m.registerUniform("input_size","u32").registerUniform("size_in_split_axis","u32",l.length).declareVariables(o,...s)}
  ${ud(l.length)}
  ${ld(s)}

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
  }`;return{name:"Split",shaderCache:{hint:t.cacheKey,inputDependencies:["rank"]},getShaderSource:y,getRunData:()=>({outputs:d,dispatchGroup:{x:Math.ceil(i/64)},programUniforms:f})}},Af=(e,t)=>{sd(e.inputs);let r=e.inputs.length===1?t:od(e.inputs,t);e.compute(sa(e.inputs,r),{inputs:[0]})},Mf=e=>{let t=e.axis,r=e.splitSizes,i=e.numOutputs<0?r.length:e.numOutputs;if(i!==r.length)throw new Error("numOutputs and splitSizes length must be equal");return me({axis:t,numOutputs:i,splitSizes:r})}}),dd,ci,Rf,Nf=W(()=>{ie(),ne(),ze(),ae(),dd=(e,t)=>{let[r,i,n,a]=e,{numHeads:s,rotaryEmbeddingDim:o}=t;if(r.dims.length!==3&&r.dims.length!==4)throw new Error(`Input 'x' is expected to have 3 or 4 dimensions, got ${r.dims.length}`);if(!R.areEqual(i.dims,[])&&!R.areEqual(i.dims,[1])&&i.dims.length!==2)throw new Error(`Input 'position_ids' is expected to have 0, 1, or 2 dimensions, got ${i.dims.length}`);if(n.dims.length!==2)throw new Error(`Input 'cos_cache' is expected to have 2 dimensions, got ${n.dims.length}`);if(a.dims.length!==2)throw new Error(`Input 'sin_cache' is expected to have 2 dimensions, got ${a.dims.length}`);if(!R.areEqual(n.dims,a.dims))throw new Error("Inputs 'cos_cache' and 'sin_cache' are expected to have the same shape");if(o>0&&s===0)throw new Error("num_heads must be provided if rotary_embedding_dim is specified");let l=r.dims[0],d=r.dims[r.dims.length-2],p=n.dims[0],h=R.sizeFromDimension(r.dims,1)/d,f=o===0?n.dims[1]*2:h/s;if(o>f)throw new Error("rotary_embedding_dim must be less than or equal to head_size");if(i.dims.length===2){if(l!==i.dims[0])throw new Error(`Input 'position_ids' dimension 0 should be of size batch_size, got ${i.dims[0]}`);if(d!==i.dims[1])throw new Error(`Input 'position_ids' dimension 1 should be of size sequence_length, got ${i.dims[1]}`)}if(d>p)throw new Error("Updating cos_cache and sin_cache in RotaryEmbedding is not currently supported");if(f/2!==n.dims[1]&&o/2!==n.dims[1])throw new Error(`Input 'cos_cache' dimension 1 should be same as head_size / 2 or rotary_embedding_dim / 2, got ${n.dims[1]}`)},ci=(e,t)=>{let{interleaved:r,numHeads:i,rotaryEmbeddingDim:n,scale:a}=t,s=e[0].dims[0],o=R.sizeFromDimension(e[0].dims,1),l=e[0].dims[e[0].dims.length-2],d=o/l,p=e[2].dims[1],h=n===0?p*2:d/i,f=new Array(s,l,d/h,h-p),y=R.computeStrides(f),m=[{type:1,data:a},{type:12,data:f},{type:12,data:y},...e[0].dims.length===3?new Array({type:12,data:[o,d,h,1]}):[],...e[0].dims.length===4?new Array({type:12,data:[o,h,l*h,1]}):[],...re(e[0].dims,e[1].dims,e[2].dims,e[3].dims,e[0].dims)],b=x=>{let $=U("input",e[0].dataType,e[0].dims.length),w=U("position_ids",e[1].dataType,e[1].dims.length),S=U("cos_cache",e[2].dataType,e[2].dims.length),v=U("sin_cache",e[3].dataType,e[3].dims.length),I=J("output",e[0].dataType,e[0].dims.length);return x.registerUniforms([{name:"scale",type:"f32"},{name:"global_shape",type:"u32",length:f.length},{name:"global_strides",type:"u32",length:y.length},{name:"input_output_strides",type:"u32",length:y.length}]),`
        ${x.declareVariables($,w,S,v,I)}

        ${x.mainStart(rr)}
          let half_rotary_emb_dim = uniforms.${S.name}_shape[1];
          let bsnh = global_idx / uniforms.global_strides % uniforms.global_shape;
          let size = uniforms.global_shape[0] * uniforms.global_strides[0];
          ${x.guardAgainstOutOfBoundsWorkgroupSizes("size")}

          if (bsnh[3] < half_rotary_emb_dim) {
            let position_ids_idx =
                ${w.broadcastedIndicesToOffset("bsnh.xy",J("",w.type.tensor,2))};
            let position_id =
                u32(${w.getByOffset("position_ids_idx")}) + select(0, bsnh[1], position_ids_idx == 0);
            let i = dot(bsnh, uniforms.input_output_strides) + select(0, bsnh[3], ${r});
            let j = i + select(half_rotary_emb_dim, 1, ${r});
            let re = ${$.getByOffset("i")} * ${S.get("position_id","bsnh[3]")} -
                ${$.getByOffset("j")} * ${v.get("position_id","bsnh[3]")};
            ${I.setByOffset("i","re")}
            let im = ${$.getByOffset("i")} * ${v.get("position_id","bsnh[3]")} +
                ${$.getByOffset("j")} * ${S.get("position_id","bsnh[3]")};
            ${I.setByOffset("j","im")}
          } else {
            let k = dot(bsnh, uniforms.input_output_strides) + half_rotary_emb_dim;
            ${I.setByOffset("k",$.getByOffset("k"))}
          }
        }`};return{name:"RotaryEmbedding",shaderCache:{hint:me({interleaved:r}).cacheKey,inputDependencies:["rank","rank","rank","rank"]},getShaderSource:b,getRunData:()=>({outputs:[{dims:e[0].dims,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(R.size(f)/rr)},programUniforms:m})}},Rf=(e,t)=>{dd(e.inputs,t),e.compute(ci(e.inputs,t))}}),pd,cd,vn,hd,Bf,l_=W(()=>{ze(),ie(),Ea(),zf(),Of(),kt(),Nf(),ae(),pd=(e,t)=>{if(t.doRotary&&e.length<=7)throw new Error("cos_cache and sin_cache inputs are required if do_rotary is specified");let r=e[0],i=e[1],n=e[2],a=e[3],s=e[4];if(t.doRotary!==0&&e.length<=7)throw new Error("cos_cast and sin_cache are expected if do_rotary attribute is non-zero");if(t.localWindowSize!==-1)throw new Error("Local attention is not supported");if(t.softcap!==0)throw new Error("Softcap is not supported");if(t.rotaryInterleaved!==0)throw new Error("Rotary interleaved is not supported");if(t.smoothSoftmax)throw new Error("Smooth softmax is not supported");if(r.dims.length!==3&&r.dims.length!==5)throw new Error("Input query is expected to have 3 or 5 dimensions");let o=!1,l=r.dims[0],d=r.dims[1],p=r.dims.length===3?o?r.dims[2]/3:r.dims[2]:t.numHeads*r.dims[4],h=d,f=0,y=!i||i.dims.length===0,m=Math.floor(y?p/(t.numHeads+2*t.kvNumHeads):p/t.numHeads);y&&(p=m*t.numHeads);let b=a&&a.dims.length!==0,x=s&&s.dims.length!==0;if(b&&a.dims.length===4&&a.dims[0]===l&&a.dims[1]!==t.kvNumHeads&&a.dims[2]===t.kvNumHeads&&a.dims[3]===m)throw new Error("BSNH pastKey/pastValue is not supported");if(b&&x){if(a.dims.length!==4)throw new Error('Input "past_key" is expected to have 4 dimensions');if(s.dims.length!==4)throw new Error('Input "past_value" is expected to have 4 dimensions');f=a.dims[2]}else if(b||x)throw new Error('Input "past_key" and "past_value" shall be both present or both absent');let $=1;if(i&&i.dims.length>0){if(r.dims.length!==3)throw new Error('Input "query" is expected to have 3 dimensions when key is given');if(i.dims.length<3||i.dims.length>5)throw new Error('Input "key" is expected to have 3, 4, or 5 dimensions');if(r.dims[0]!==i.dims[0])throw new Error('Input "query" and "key" shall have same dim 0 (batch size)');if(i.dims.length===3){if(r.dims[2]%i.dims[2]!==0)throw new Error('Dimension 2 of "query" should be a multiple of "key"');h=i.dims[1]}else if(i.dims.length===5){if(i.dims[2]!==t.numHeads||i.dims[3]!==2||i.dims[4]!==m)throw new Error('Expect "key" shape (batch_size, kv_sequence_length, num_heads, 2, head_size) for packed kv');if(n)throw new Error('Expect "value" be none when "key" has packed kv format.');h=i.dims[1]}else{if(i.dims[1]!==t.numHeads||i.dims[3]!==m)throw new Error('Expect "key" shape (batch_size, num_heads, kv_sequence_length, head_size) for past_key');h=i.dims[2]}}else{if(r.dims.length!==3&&r.dims.length!==5)throw new Error('Input "query" is expected to have 3 or 5 dimensions when key is empty');if(r.dims.length===5&&(r.dims[2]!==t.numHeads||r.dims[3]!==3))throw new Error('Expect "query" shape (batch_size, kv_sequence_length, num_heads, 3, head_size) for packed kv');$=3}let w=0,S=!1,v=t.kvNumHeads?m*t.kvNumHeads:p;if(n&&n.dims.length>0){if(n.dims.length!==3&&n.dims.length!==4)throw new Error('Input "value" is expected to have 3 or 4 dimensions');if(r.dims[0]!==n.dims[0])throw new Error('Input "query" and "value" shall have same dim 0 (batch_size)');if(n.dims.length===3){if(h!==n.dims[1])throw new Error('Input "key" and "value" shall have the same dim 1 (kv_sequence_length)');v=n.dims[2]}else{if(h!==n.dims[2])throw new Error('Input "past_key" and "past_value" shall have the same dim 2 (kv_sequence_length)');v=n.dims[1]*n.dims[3],S=!0}}let I=e.length>4?e[5]:void 0;if(I){if(I.dims.length===0)throw new Error("seqlens_k must be at least 1D, got scalar.");let C=I.dims.reduce((z,k)=>z*k,1);if(C!==l)throw new Error(`seqlens_k must have batch_size (${l}) elements, got ${C}.`);for(let z=0;z<I.dims.length;z++)if(I.dims[z]!==1&&I.dims[z]!==l)throw new Error(`seqlens_k has unexpected shape. Each dimension must be 1 or batch_size (${l}), got dims[${z}] = ${I.dims[z]}.`)}return{batchSize:l,sequenceLength:d,pastSequenceLength:f,kvSequenceLength:h,totalSequenceLength:-1,maxSequenceLength:-1,inputHiddenSize:0,hiddenSize:p,vHiddenSize:v,headSize:m,vHeadSize:Math.floor(v/t.kvNumHeads),numHeads:t.numHeads,kvNumHeads:t.kvNumHeads,nReps:t.numHeads/t.kvNumHeads,pastPresentShareBuffer:!1,maskType:w,scale:t.scale,broadcastResPosBias:!1,passPastInKv:S,qkvFormat:$}},cd=me({perm:[0,2,1,3]}),vn=(e,t,r)=>{let i=t,n=r.kvNumHeads;return t.dims.length===3&&r.kvSequenceLength!==0&&(i=t.reshape([r.batchSize,r.kvSequenceLength,n,r.headSize]),i=e.compute(Ge(i,cd.perm),{inputs:[i],outputs:[-1]})[0]),i},hd=(e,t,r,i)=>{let n=7,a=["type","type"],s=[e*t],o=e*t,l=[{type:12,data:o},{type:12,data:t},{type:12,data:e}],d=p=>{let h=U("seq_lens",r.dataType,r.dims),f=U("total_seq_lens",i.dataType,i.dims),y=J("pos_ids",n,s),m=[{name:"output_size",type:"u32"},{name:"sequence_length",type:"u32"},{name:"batch_size",type:"u32"}];return`
  ${p.registerUniforms(m).declareVariables(h,f,y)}
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
      ${y.setByOffset("global_idx","pos_id")}
    } else if (is_subsequent_prompt) {
      let past_seqlen = total_seqlen - i32(uniforms.sequence_length);
      if (past_seqlen + sequence_idx < total_seqlen) {
        pos_id = past_seqlen + sequence_idx;
      } else {
        pos_id = 1;
      }
      ${y.setByOffset("global_idx","pos_id")}
    } else if (global_idx < uniforms.batch_size) {
      ${y.setByOffset("global_idx","seqlen")}
    };
  }
  `};return{name:"GeneratePositionIds",shaderCache:{hint:`${e};${t}`,inputDependencies:a},getRunData:()=>({outputs:[{dims:s,dataType:n}],dispatchGroup:{x:Math.ceil(o/64)},programUniforms:l}),getShaderSource:d}},Bf=(e,t)=>{let r=pd(e.inputs,t);if(e.inputs[0].dims.length===5)throw new Error("Packed QKV is not implemented");if(e.inputs[1]?.dims.length===5)throw new Error("Packed KV is not implemented");let i=e.inputs[0],n=e.inputs[1]&&e.inputs[1].dims.length>0?e.inputs[1]:void 0,a=e.inputs[2]&&e.inputs[2].dims.length>0?e.inputs[2]:void 0,s=e.inputs[3]&&e.inputs[3].dims.length!==0?e.inputs[3]:void 0,o=e.inputs[4]&&e.inputs[4].dims.length!==0?e.inputs[4]:void 0,l=e.inputs.length>4?e.inputs[5]:void 0,d=e.inputs.length>5?e.inputs[6]:void 0,p=r.kvNumHeads?r.kvNumHeads:r.numHeads,h=me({axis:2,numOutputs:3,splitSizes:[r.numHeads*r.headSize,p*r.headSize,p*r.headSize]}),[f,y,m]=!n&&!a?e.compute(sa([i],h),{inputs:[i],outputs:[-1,-1,-1]}):[i,n,a],b,x;if(t.doRotary){let v=e.compute(hd(r.batchSize,r.sequenceLength,l,d),{inputs:[l,d],outputs:[-1]})[0],I=e.inputs[7],C=e.inputs[8],z=me({interleaved:t.rotaryInterleaved!==0,numHeads:r.numHeads,rotaryEmbeddingDim:0,scale:t.scale}),k=[f,v,I,C],N=[-1];b=e.compute(ci(k,z),{inputs:k,outputs:N})[0],k.splice(0,1,y);let B=me({interleaved:t.rotaryInterleaved!==0,numHeads:r.kvNumHeads,rotaryEmbeddingDim:0,scale:t.scale});x=e.compute(ci(k,B),{inputs:k,outputs:N})[0]}let $=vr(e,r.batchSize,r.numHeads,r.sequenceLength,r.headSize,t.doRotary?b:f,void 0,0),w=vn(e,t.doRotary?x:y,r),S=vn(e,m,r);kr(e,$,w,S,void 0,void 0,s,o,void 0,r,l,d)}}),xn,fd,md,Df,d_=W(()=>{ie(),ne(),kt(),ae(),xn=(e,t,r,i,n,a,s,o)=>{let l=Ie(a),d=l===1?"f32":`vec${l}f`,p=l===1?"vec2f":`mat2x${l}f`,h=n*s,f=64;h===1&&(f=256);let y=[n,s,a/l],m=[n,s,2],b=["rank","type","type"],x=[];x.push(...re(y,m));let $=w=>{let S=U("x",t.dataType,3,l),v=U("scale",r.dataType,r.dims),I=U("bias",i.dataType,i.dims),C=J("output",1,3,2),z=[S,v,I,C];return`
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
      let sum_final = ${St("workgroup_shared[0][0]",l)} / f32(hight * ${l});
      let squared_sum_final = ${St("workgroup_shared[0][1]",l)} / f32(hight * ${l});

      let inv_std_dev = inverseSqrt(squared_sum_final - sum_final * sum_final + f32(${o}));
      let channel_scale = inv_std_dev * f32(scale[channel]);
      let channel_shift = f32(bias[channel]) - sum_final * channel_scale;
      output[workgroup_index] = vec2f(channel_scale, channel_shift);
    }
  }`};return e.compute({name:"InstanceNormComputeChannelScaleShift",shaderCache:{hint:`${l};${o};${f}`,inputDependencies:b},getRunData:()=>({outputs:[{dims:m,dataType:1}],dispatchGroup:{x:h},programUniforms:x}),getShaderSource:$},{inputs:[t,r,i],outputs:[-1]})[0]},fd=(e,t,r)=>{let i=t[0].dims,n=i,a=2,s=i[0],o=i[1],l=R.sizeFromDimension(i,a),d=Ie(l),p=R.size(n)/d,h=xn(e,t[0],t[1],t[2],s,l,o,r.epsilon),f=[s,o,l/d],y=[s,o],m=["type","none"],b=x=>{let $=U("x",t[0].dataType,f.length,d),w=U("scale_shift",1,y.length,2),S=J("output",t[0].dataType,f.length,d),v=[$,w,S];return`
  ${x.registerUniform("output_size","u32").declareVariables(...v)}
  ${x.mainStart()}
  ${x.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
      let outputIndices = ${S.offsetToIndices("global_idx")};
      let batch = outputIndices[0];
      let channel = outputIndices[1];
      let scale_shift = ${w.getByIndices("vec2<u32>(batch, channel)")};
      let value = ${$.getByOffset("global_idx")} * ${S.type.value}(scale_shift.x) + ${S.type.value}(scale_shift.y);
      ${S.setByOffset("global_idx","value")};
  }`};e.compute({name:"InstanceNormalization",shaderCache:{hint:`${d}`,inputDependencies:m},getRunData:()=>({outputs:[{dims:n,dataType:t[0].dataType}],dispatchGroup:{x:Math.ceil(p/64)},programUniforms:[{type:12,data:p},...re(f,y,f)]}),getShaderSource:b},{inputs:[t[0],h]})},md=(e,t,r)=>{let i=t[0].dims,n=i,a=i[0],s=i[i.length-1],o=R.sizeFromDimension(i,1)/s,l=Ie(s),d=R.size(n)/l,p=[{type:12,data:o},{type:12,data:Math.floor(s/l)}],h=["type","type"],f=!1,y=[0,i.length-1];for(let $=0;$<i.length-2;$++)f=f||i[$+1]!==1,y.push($+1);f=f&&i[i.length-1]!==1;let m=f?e.compute(Ge(e.inputs[0],y),{inputs:[e.inputs[0]],outputs:[-1]})[0]:e.inputs[0].reshape(Array.from({length:i.length},($,w)=>i[y[w]])),b=xn(e,m,t[1],t[2],a,o,s,r.epsilon),x=$=>{let w=Oe(t[0].dataType),S=l===1?"vec2f":`mat${l}x2f`,v=z=>{let k=z===0?"x":"y",N=l===1?"f32":`vec${l}f`;switch(l){case 1:return`${w}(${N}(scale.${k}))`;case 2:return`vec2<${w}>(${N}(scale[0].${k}, scale[1].${k}))`;case 4:return`vec4<${w}>(${N}(scale[0].${k}, scale[1].${k}, scale[2].${k}, scale[3].${k}))`;default:throw new Error(`Not supported compoents ${l}`)}},I=U("input",t[0].dataType,t[0].dims,l),C=J("output",t[0].dataType,n,l);return`
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
    output[global_idx] = fma(input[global_idx], ${v(0)}, ${v(1)});
  }`};e.compute({name:"InstanceNormalizationNHWC",shaderCache:{hint:`${l}`,inputDependencies:h},getRunData:()=>({outputs:[{dims:n,dataType:t[0].dataType}],dispatchGroup:{x:Math.ceil(d/64)},programUniforms:p}),getShaderSource:x},{inputs:[t[0],b]})},Df=(e,t)=>{t.format==="NHWC"?md(e,e.inputs,t):fd(e,e.inputs,t)}}),gd,yd,Pf,p_=W(()=>{ie(),ne(),ae(),gd=e=>{if(!e||e.length<2)throw new Error("layerNorm requires at least 2 inputs.")},yd=(e,t,r)=>{let i=t.simplified,n=e[0].dims,a=e[1],s=!i&&e[2],o=n,l=R.normalizeAxis(t.axis,n.length),d=R.sizeToDimension(n,l),p=R.sizeFromDimension(n,l),h=R.size(a.dims),f=s?R.size(s.dims):0;if(h!==p||s&&f!==p)throw new Error(`Size of X.shape()[axis:] == ${p}.
       Size of scale and bias (if provided) must match this.
       Got scale size of ${h} and bias size of ${f}`);let y=[];for(let I=0;I<n.length;++I)I<l?y.push(n[I]):y.push(1);let m=Ie(p),b=["type","type"],x=[{type:12,data:d},{type:1,data:p},{type:12,data:Math.floor(p/m)},{type:1,data:t.epsilon}];s&&b.push("type");let $=r>1,w=r>2,S=I=>{let C=Oe(e[0].dataType),z=[U("x",e[0].dataType,e[0].dims,m),U("scale",a.dataType,a.dims,m)];s&&z.push(U("bias",s.dataType,s.dims,m)),z.push(J("output",e[0].dataType,o,m)),$&&z.push(J("mean_data_output",1,y)),w&&z.push(J("inv_std_output",1,y));let k=[{name:"norm_count",type:"u32"},{name:"norm_size",type:"f32"},{name:"norm_size_vectorized",type:"u32"},{name:"epsilon",type:"f32"}];return`
  ${I.registerUniforms(k).declareVariables(...z)}
  ${I.mainStart()}
    ${I.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.norm_count")}
    let offset = global_idx * uniforms.norm_size_vectorized;
    var mean_vector = ${Yn("f32",m)};
    var mean_square_vector = ${Yn("f32",m)};

    for (var h: u32 = 0u; h < uniforms.norm_size_vectorized; h++) {
      let value = ${Qt(C,m,"x[h + offset]")};
      mean_vector += value;
      mean_square_vector += value * value;
    }
    let mean = ${St("mean_vector",m)} / uniforms.norm_size;
    let inv_std_dev = inverseSqrt(${St("mean_square_vector",m)} / uniforms.norm_size ${i?"":"- mean * mean"} + uniforms.epsilon);

    for (var j: u32 = 0; j < uniforms.norm_size_vectorized; j++) {
      let f32input = ${Qt(C,m,"x[j + offset]")};
      let f32scale = ${Qt(C,m,"scale[j]")};
      output[j + offset] = ${z[0].type.value}((f32input ${i?"":"- mean"}) * inv_std_dev * f32scale
        ${s?`+ ${Qt(C,m,"bias[j]")}`:""}
      );
    }

    ${$?"mean_data_output[global_idx] = mean":""};
    ${w?"inv_std_output[global_idx] = inv_std_dev":""};
  }`},v=[{dims:o,dataType:e[0].dataType}];return $&&v.push({dims:y,dataType:1}),w&&v.push({dims:y,dataType:1}),{name:"LayerNormalization",shaderCache:{hint:`${m};${r};${i}`,inputDependencies:b},getRunData:()=>({outputs:v,dispatchGroup:{x:Math.ceil(d/64)},programUniforms:x}),getShaderSource:S}},Pf=(e,t)=>{gd(e.inputs),e.compute(yd(e.inputs,t,e.outputCount))}}),_d,Uf,c_=W(()=>{ne(),Oa(),Ra(),_d=e=>{if(!e||e.length!==2)throw new Error("MatMul requires 2 inputs.");if(e[0].dims[e[0].dims.length-1]!==e[1].dims[e[1].dims.length-2])throw new Error("shared dimension does not match.")},Uf=e=>{_d(e.inputs);let t=tr.calcShape(e.inputs[0].dims,e.inputs[1].dims,!0);if(!t)throw new Error("Can't use matmul on the given tensors");let r=t[t.length-1],i=e.inputs[0].dims[e.inputs[0].dims.length-1];if(r<8&&i<8)e.compute(Ma(e.inputs,{activation:""},t));else{let n=t[t.length-2],a=R.size(e.inputs[0].dims.slice(0,-2)),s=R.size(e.inputs[1].dims.slice(0,-2));if(a!==1&&n===1&&s===1){let o=e.inputs[0].reshape([1,a,i]),l=e.inputs[1].reshape([1,i,r]),d=[1,a,r],p=[o,l];e.compute(pi(p,{activation:""},t,d),{inputs:p})}else e.compute(pi(e.inputs,{activation:""},t))}}}),bd,wd,$d,Lf,qf,h_=W(()=>{ie(),ne(),ze(),ae(),bd=(e,t)=>{if(e.length<3||e.length>4)throw new Error("MatMulNBits requires 3 or 4 inputs");let r=e[0],i=r.dims.length;if(r.dims[i-1]!==t.k)throw new Error("The last dim of input shape does not match the k value");let n=Math.floor((t.k+t.blockSize-1)/t.blockSize),a=t.blockSize/8*t.bits,s=e[1];if(!R.areEqual(s.dims,[t.n,n,a]))throw new Error("The second inputs must be 3D tensor with shape N X nBlocksPerCol X blobSize");let o=e[2].dims;if(R.size(o)!==t.n*n)throw new Error("scales input size error.");if(e.length===4){let l=e[3].dims,d=t.n*(t.bits===8?n:Math.floor((n*t.bits+7)/8));if(R.size(l)!==d)throw new Error("zeroPoints input size error.")}},wd=(e,t)=>{let r=e[0].dims,i=r.length,n=r[i-2],a=t.k,s=t.n,o=r.slice(0,i-2),l=R.size(o),d=e[1].dims[2]/4,p=e[0].dataType,h=Ie(t.k),f=Ie(d),y=Ie(s),m=o.concat([n,s]),b=n>1&&s/y%2===0?2:1,x=R.size(m)/y/b,$=64,w=[],S=[l,n,a/h],v=R.convertShape(e[1].dims).slice();v.splice(-1,1,d/f),w.push(...re(S)),w.push(...re(v)),w.push(...re(e[2].dims)),e.length===4&&w.push(...re(R.convertShape(e[3].dims)));let I=[l,n,s/y];w.push(...re(I));let C=z=>{let k=S.length,N=U("a",e[0].dataType,k,h),B=U("b",12,v.length,f),H=U("scales",e[2].dataType,e[2].dims.length),q=[N,B,H],V=e.length===4?U("zero_points",12,e[3].dims.length):void 0;V&&q.push(V);let O=I.length,P=J("output",e[0].dataType,O,y),G=Oe(e[0].dataType),Y=(()=>{switch(h){case 1:return`array<${G}, 8>`;case 2:return`mat4x2<${G}>`;case 4:return`mat2x4<${G}>`;default:throw new Error(`${h}-component is not supported.`)}})(),L=Math.floor(32/t.bits),F=Math.floor(L/8),ee=()=>{let Z="";for(let X=0;X<F;X++){let ye=X*t.bits*4,Ee=ye+t.bits;Z+=`
          // reuse a data (pass ${X})
            var input_offset${X>0?X:""} = ${X===0?N.indicesToOffset(`${N.type.indices}(batch, row, word_offset)`):"input_offset"};
            var a_data${X>0?X:""}: ${Y};
            for (var j${X>0?X:""}: u32 = 0; j${X>0?X:""} < ${8/h}; j${X>0?X:""}++) {
              a_data${X>0?X:""}[j${X>0?X:""}] = ${N.getByOffset(`input_offset${X>0?X:""}`)};
              input_offset${X>0?X:""}++;
            }
          `;for(let be=0;be<y*b;be++)Z+=`
            b_value = ${f===1?`b${be}_data`:`b${be}_data[i]`};
            ${t.bits===2?`{
              let half_word = b_value >> ${X*16}u;
              let byte_lo = half_word & 0xFFu;
              let byte_hi = (half_word >> 8u) & 0xFFu;
              let spread_word = (byte_lo & 0xFu) | ((byte_lo >> 4u) << 8u) | ((byte_hi & 0xFu) << 16u) | ((byte_hi >> 4u) << 24u);
              b_value_lower = unpack4xU8(spread_word & b_mask);
              b_value_upper = unpack4xU8((spread_word >> 2u) & b_mask);
            }`:`b_value_lower = unpack4xU8((b_value >> ${ye}u) & b_mask);
            b_value_upper = unpack4xU8((b_value >> ${Ee}u) & b_mask);`}
            b_quantized_values = ${Y}(${Array.from({length:4},(Te,ce)=>`${G}(b_value_lower[${ce}]), ${G}(b_value_upper[${ce}])`).join(", ")});
            b_dequantized_values = ${h===1?`${Y}(${Array.from({length:8},(Te,ce)=>`(b_quantized_values[${ce}] - ${V?`zero_point${be}`:"zero_point"}) * scale${be}`).join(", ")});`:`(b_quantized_values - ${Y}(${Array(8).fill(`${V?`zero_point${be}`:"zero_point"}`).join(",")})) * scale${be};`};
            workgroup_shared[local_id.x * ${b} + ${Math.floor(be/y)}]${y>1?`[${be%y}]`:""} += ${Array.from({length:8/h},(Te,ce)=>`${h===1?`a_data${X>0?X:""}[${ce}] * b_dequantized_values[${ce}]`:`dot(a_data${X>0?X:""}[${ce}], b_dequantized_values[${ce}])`}`).join(" + ")};
          `}return Z},A=()=>{let Z=`
            var col_index = col * ${y};
            ${V?`
            let zero_point_values_per_byte: u32 = ${Math.floor(8/t.bits)}u;
            let zero_point_bytes_per_col = (nBlocksPerCol + zero_point_values_per_byte - 1u) / zero_point_values_per_byte;
            var zero_point_byte_count: u32;
            var zero_point_word_index: u32;
            var zero_point_byte_offset: u32;
            let zero_point_sub_offset: u32 = block % zero_point_values_per_byte;
            var zero_point_bits_offset: u32;
            var zero_point_word: u32;`:`
            // The default zero point is ${Math.pow(2,t.bits-1)} for unsigned ${t.bits}-bit quantization.
            let zero_point = ${G}(${Math.pow(2,t.bits-1).toFixed(1)});`}
            `;for(let X=0;X<y*b;X++)Z+=`
            let scale${X} = ${H.getByOffset("col_index * nBlocksPerCol + block")};
            ${V?`
            zero_point_byte_count = col_index * zero_point_bytes_per_col + (block / zero_point_values_per_byte);
            zero_point_word_index = zero_point_byte_count >> 0x2u;
            zero_point_byte_offset = zero_point_byte_count & 0x3u;
            zero_point_bits_offset = (zero_point_byte_offset << 3) + (zero_point_sub_offset * ${t.bits}u);
            zero_point_word = ${V.getByOffset("zero_point_word_index")} >> zero_point_bits_offset;
            let zero_point${X} = ${G}((zero_point_word) & ${t.bits===2?"0x3u":"0xFu"});`:""}
            col_index += 1;`;return Z},K=()=>{let Z=`col_index = col * ${y};`;for(let X=0;X<y*b;X++)Z+=`
            let b${X}_data = ${B.getByIndices(`${B.type.indices}(col_index, block, word)`)};
            col_index += 1;`;return Z+=`
            var b_value: u32;
            let b_mask: u32 = ${t.bits===2?"0x03030303u":"0x0F0F0F0Fu"};
            var b_value_lower: vec4<u32>;
            var b_value_upper: vec4<u32>;
            var b_quantized_values: ${Y};
            var b_dequantized_values: ${Y};`,Z};return`
        var<workgroup> workgroup_shared: array<${P.type.value}, ${b*$}>;
        ${z.declareVariables(...q,P)}
        ${z.mainStart([$,1,1])}
          let output_indices = ${P.offsetToIndices(`(global_idx / ${$}) * ${b}`)};
          let col = output_indices[2];
          let row = output_indices[1];
          let batch = output_indices[0];
          let nBlocksPerCol = uniforms.b_shape[1];

          for (var block = local_id.x; block < nBlocksPerCol; block += ${$}) {
            //process one block
            var word_offset: u32 = block * ${t.blockSize/h};
            ${A()}
            for (var word: u32 = 0; word < ${d}; word += ${f}) {
              ${K()}
              for (var i: u32 = 0; i < ${f}; i++) {
                ${ee()}
                word_offset += ${L/h};
              }
            }
          }
          workgroupBarrier();

          if (local_id.x < ${b}) {
            var output_value: ${P.type.value} = ${P.type.value}(0);
            var workgroup_shared_offset: u32 = local_id.x;
            for (var b: u32 = 0u; b < ${$}u; b++) {
              output_value += workgroup_shared[workgroup_shared_offset];
              workgroup_shared_offset += ${b};
            }
            ${P.setByIndices(`${P.type.indices}(batch, row, col + local_id.x)`,"output_value")};
          }
        }`};return{name:"MatMulNBits",shaderCache:{hint:`${t.blockSize};${t.bits};${h};${f};${y};${b};${$}`,inputDependencies:Array(e.length).fill("rank")},getRunData:()=>({outputs:[{dims:m,dataType:p}],dispatchGroup:{x},programUniforms:w}),getShaderSource:C}},$d=(e,t)=>{let r=e[0].dims,i=r.length,n=r[i-2],a=t.k,s=t.n,o=r.slice(0,i-2),l=R.size(o),d=e[1].dims[2]/4,p=e[0].dataType,h=Ie(t.k),f=Ie(d),y=o.concat([n,s]),m=128,b=s%8===0?8:s%4===0?4:1,x=m/b,$=Math.floor(32/t.bits),w=x*f*$,S=w/h,v=w/t.blockSize,I=R.size(y)/b,C=[],z=[l,n,a/h],k=R.convertShape(e[1].dims).slice();k.splice(-1,1,d/f),C.push(...re(z)),C.push(...re(k)),C.push(...re(e[2].dims)),e.length===4&&C.push(...re(R.convertShape(e[3].dims)));let N=[l,n,s];C.push(...re(N));let B=H=>{let q=z.length,V=U("a",e[0].dataType,q,h),O=U("b",12,k.length,f),P=U("scales",e[2].dataType,e[2].dims.length),G=[V,O,P],Y=e.length===4?U("zero_points",12,e[3].dims.length):void 0;Y&&G.push(Y);let L=N.length,F=J("output",e[0].dataType,L),ee=Oe(e[0].dataType),A=()=>{switch(h){case 1:return`
          let a_data0 = vec4<${ee}>(sub_a[word_offset], sub_a[word_offset + 1], sub_a[word_offset + 2], sub_a[word_offset + 3]);
          let a_data1 = vec4<${ee}>(sub_a[word_offset + 4], sub_a[word_offset + 5], sub_a[word_offset + 6], sub_a[word_offset + 7]);`;case 2:return`
          let a_data0 = vec4<${ee}>(sub_a[word_offset], sub_a[word_offset + 1]);
          let a_data1 = vec4<${ee}>(sub_a[word_offset + 2], sub_a[word_offset + 3]);`;case 4:return`
          let a_data0 = sub_a[word_offset];
          let a_data1 = sub_a[word_offset + 1];`;default:throw new Error(`${h}-component is not supported.`)}};return`
        var<workgroup> sub_a: array<${V.type.value}, ${S}>;
        var<workgroup> inter_results: array<array<${F.type.value}, ${x}>, ${b}>;
        ${H.declareVariables(...G,F)}
        ${H.mainStart([x,b,1])}
          let output_indices = ${F.offsetToIndices(`workgroup_index * ${b}`)};
          let col = output_indices[2];
          let row = output_indices[1];
          let batch = output_indices[0];
          let n_blocks_per_col = uniforms.b_shape[1];
          let num_tiles =  (n_blocks_per_col - 1) / ${v} + 1;

          // Loop over shared dimension.
          for (var tile: u32 = 0; tile < num_tiles; tile += 1) {
            let a_col_start = tile * ${S};
            // load one tile A data into shared memory.
            for (var a_offset = local_idx; a_offset < ${S}; a_offset += ${m})
            {
              let a_col = a_col_start + a_offset;
              if (a_col < uniforms.a_shape[2])
              {
                sub_a[a_offset] = ${V.getByIndices(`${V.type.indices}(batch, row, a_col)`)};
              } else {
                sub_a[a_offset] = ${V.type.value}(0);
              }
            }
            workgroupBarrier();

            // each thread process one block
            let b_row = col + local_id.y;
            let block = tile * ${v} + local_id.x;
            ${Y?`
            let zero_point_values_per_byte: u32 = ${Math.floor(8/t.bits)}u;
            let zero_point_bytes_per_col = (n_blocks_per_col + zero_point_values_per_byte - 1u) / zero_point_values_per_byte;
            let zero_point_byte_count = b_row * zero_point_bytes_per_col + (block / zero_point_values_per_byte);
            let zero_point_word_index = zero_point_byte_count >> 0x2u;
            let zero_point_byte_offset = zero_point_byte_count & 0x3u;
            let zero_point_sub_offset: u32 = block % zero_point_values_per_byte;
            let zero_point_bits_offset = (zero_point_byte_offset << 3) + (zero_point_sub_offset * ${t.bits}u);
            let zero_point_word = ${Y.getByOffset("zero_point_word_index")} >> zero_point_bits_offset;
            let zero_point = ${ee}((zero_point_word) & ${t.bits===2?"0x3u":"0xFu"});`:`
            // The default zero point is ${Math.pow(2,t.bits-1)} for unsigned ${t.bits}-bit quantization.
            let zero_point = ${ee}(${Math.pow(2,t.bits-1).toFixed(1)});`}
            let scale = ${P.getByOffset("b_row * n_blocks_per_col + block")};
            let b_data = ${O.getByIndices(`${O.type.indices}(b_row, block, 0)`)};
            var word_offset = local_id.x * ${t.blockSize/h};
            for (var i: u32 = 0; i < ${f}; i++) {
              let b_value = ${f===1?"b_data":"b_data[i]"};
              ${(()=>{let K=Math.floor($/8),Z="";for(let X=0;X<K;X++){let ye=X*t.bits*4,Ee=ye+t.bits;Z+=`
              ${A()}
              {${t.bits===2?`
                let half_word = b_value >> ${X*16}u;
                let byte_lo = half_word & 0xFFu;
                let byte_hi = (half_word >> 8u) & 0xFFu;
                let spread_word = (byte_lo & 0xFu) | ((byte_lo >> 4u) << 8u) | ((byte_hi & 0xFu) << 16u) | ((byte_hi >> 4u) << 24u);
                let b_value_lower = unpack4xU8(spread_word & 0x03030303u);
                let b_value_upper = unpack4xU8((spread_word >> 2u) & 0x03030303u);`:`
                let b_value_lower = unpack4xU8((b_value >> ${ye}u) & 0x0F0F0F0Fu);
                let b_value_upper = unpack4xU8((b_value >> ${Ee}u) & 0x0F0F0F0Fu);`}
                let b_quantized_values = mat2x4<${ee}>(${Array.from({length:4},(be,Te)=>`${ee}(b_value_lower[${Te}]), ${ee}(b_value_upper[${Te}])`).join(", ")});
                let b_dequantized_values = (b_quantized_values - mat2x4<${ee}>(${Array(8).fill("zero_point").join(",")})) * scale;
                inter_results[local_id.y][local_id.x] += ${Array.from({length:2},(be,Te)=>`${`dot(a_data${Te}, b_dequantized_values[${Te}])`}`).join(" + ")};
              }
              word_offset += ${8/h};`}return Z})()}
            }
            workgroupBarrier();
          }

          if (local_idx < ${b}) {
            var output_value: ${F.type.value} = ${F.type.value}(0);
            for (var b = 0u; b < ${x}; b++) {
              output_value += inter_results[local_idx][b];
            }
            if (col + local_idx < uniforms.output_shape[2])
            {
              ${F.setByIndices(`${F.type.indices}(batch, row, col + local_idx)`,"output_value")}
            }
          }
        }`};return{name:"BlockwiseMatMulNBits32",shaderCache:{hint:`${t.blockSize};${h};${f};${x};${b}`,inputDependencies:Array(e.length).fill("rank")},getRunData:()=>({outputs:[{dims:y,dataType:p}],dispatchGroup:{x:I},programUniforms:C}),getShaderSource:B}},Lf=(e,t)=>{bd(e.inputs,t),t.blockSize===32&&e.adapterInfo.isVendor("intel")&&e.adapterInfo.isArchitecture("gen-12lp")?e.compute($d(e.inputs,t)):e.compute(wd(e.inputs,t))},qf=e=>me(e)}),vd,xd,Sd,kd,Td,Id,Ed,Cd,Wf,f_=W(()=>{ie(),ne(),ae(),vd=e=>{if(!e||e.length<1)throw new Error("Too few inputs");if(e[0].dataType!==1&&e[0].dataType!==10)throw new Error("Input type must be float or float16.");if(e.length>=2){let t=e[0].dims.length*2===e[1].dims[0];if(e.length===4&&(t=e[3].dims[0]*2===e[1].dims[0]),!t)throw new Error("The pads should be a 1D tensor of shape [2 * input_rank] or [2 * num_axes].")}},xd=(e,t,r)=>{let i="";for(let n=t-1;n>=0;--n)i+=`
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
      `},Sd=(e,t,r)=>{let i="";for(let n=t-1;n>=0;--n)i+=`
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
          `},kd=(e,t,r)=>{let i="";for(let n=t-1;n>=0;--n)i+=`
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
          `},Td=(e,t,r)=>{let i="";for(let n=t-1;n>=0;--n)i+=`
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
          `},Id=(e,t,r)=>{switch(r.mode){case 0:return xd(e,t,r.pads.length);case 1:return Sd(e,t,r.pads.length);case 2:return kd(e,t,r.pads.length);case 3:return Td(e,t,r.pads.length);default:throw new Error("Invalid mode")}},Ed=(e,t)=>{let r=R.padShape(e[0].dims.slice(),t.pads),i=e[0].dims,n=R.size(r),a=[{type:12,data:n},{type:6,data:t.pads}],s=e.length>=3&&e[2].data;t.mode===0&&a.push({type:s?e[2].dataType:1,data:t.value}),a.push(...re(e[0].dims,r));let o=["rank"],l=d=>{let p=J("output",e[0].dataType,r.length),h=U("x",e[0].dataType,i.length),f=h.type.value,y=Id(p,i.length,t),m=[{name:"output_size",type:"u32"},{name:"pads",type:"i32",length:t.pads.length}];return t.mode===0&&m.push({name:"constant_value",type:s?f:"f32"}),`
            ${d.registerUniforms(m).declareVariables(h,p)}
            ${d.mainStart()}
            ${d.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}

            let indices = ${p.offsetToIndices("global_idx")};

            var value = ${f}(0);
            ${y}
            output[global_idx] = value;
        }`};return{name:"Pad",shaderCache:{hint:`${t.mode}${s}`,inputDependencies:o},getRunData:()=>({outputs:[{dims:r,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(R.size(r)/64)},programUniforms:a}),getShaderSource:l}},Cd=(e,t)=>{if(e.length>1){let r=e[1].getBigInt64Array(),i=e.length>=3&&e[2].data?e[2].dataType===10?e[2].getUint16Array()[0]:e[2].getFloat32Array()[0]:0,n=e[0].dims.length,a=new Int32Array(2*n).fill(0);if(e.length>=4){let o=e[3].getBigInt64Array();for(let l=0;l<o.length;l++)a[Number(o[l])]=Number(r[l]),a[Number(o[l])+n]=Number(r[l+o.length])}else r.forEach((o,l)=>a[Number(l)]=Number(o));let s=[];return a.forEach(o=>s.push(o)),{mode:t.mode,value:i,pads:s}}else return t},Wf=(e,t)=>{vd(e.inputs);let r=Cd(e.inputs,t);e.compute(Ed(e.inputs,r),{inputs:[0]})}}),fr,Sn,kn,Tn,In,zd,Ad,En,Cn,Gf,Vf,zn,Ff,Hf,An,jf,Kf,Xf,Zf,m_=W(()=>{Ke(),ie(),ne(),ae(),fr=e=>{if($e.webgpu.validateInputContent&&(!e||e.length!==1))throw new Error("Pool ops requires 1 input.")},Sn=(e,t,r)=>{let i=t.format==="NHWC",n=e.dims.slice();i&&n.splice(1,0,n.pop());let a=Object.hasOwnProperty.call(t,"dilations"),s=t.kernelShape.slice(),o=t.strides.slice(),l=a?t.dilations.slice():[],d=t.pads.slice();li.adjustPoolAttributes(r,n,s,o,l,d);let p=li.computePoolOutputShape(r,n,o,l,s,d,t.autoPad),h=Object.assign({},t);a?Object.assign(h,{kernelShape:s,strides:o,pads:d,dilations:l,cacheKey:t.cacheKey}):Object.assign(h,{kernelShape:s,strides:o,pads:d,cacheKey:t.cacheKey});let f=p.slice();return f.push(f.splice(1,1)[0]),[h,i?f:p]},kn=(e,t)=>{let r=t.format==="NHWC",i=R.size(e),n=R.size(t.kernelShape),a=[{type:12,data:i},{type:12,data:n}],s=[{name:"outputSize",type:"u32"},{name:"kernelSize",type:"u32"}];if(t.kernelShape.length<=2){let o=t.kernelShape[t.kernelShape.length-1],l=t.strides[t.strides.length-1],d=t.pads[t.pads.length/2-1],p=t.pads[t.pads.length-1],h=!!(d+p);a.push({type:12,data:o},{type:12,data:l},{type:12,data:d},{type:12,data:p}),s.push({name:"kw",type:"u32"},{name:"sw",type:"u32"},{name:"pwStart",type:"u32"},{name:"pwEnd",type:"u32"});let f=!1;if(t.kernelShape.length===2){let y=t.kernelShape[t.kernelShape.length-2],m=t.strides[t.strides.length-2],b=t.pads[t.pads.length/2-2],x=t.pads[t.pads.length-2];f=!!(b+x),a.push({type:12,data:y},{type:12,data:m},{type:12,data:b},{type:12,data:x}),s.push({name:"kh",type:"u32"},{name:"sh",type:"u32"},{name:"phStart",type:"u32"},{name:"phEnd",type:"u32"})}return[a,s,!0,h,f]}else{if(r)throw new Error("Pooling with kernelShape.length > 2 is not supported for NHWC format.");let o=R.computeStrides(t.kernelShape);a.push({type:12,data:o},{type:12,data:t.pads},{type:12,data:t.strides}),s.push({name:"kernelStrides",type:"u32",length:o.length},{name:"pads",type:"u32",length:t.pads.length},{name:"strides",type:"u32",length:t.strides.length});let l=t.pads.reduce((d,p)=>d+p);return[a,s,!!l,!1,!1]}},Tn=(e,t,r,i,n,a,s,o,l,d,p,h)=>{let f=n.format==="NHWC",y=t.type.value,m=J("output",t.type.tensor,i);if(n.kernelShape.length<=2){let b="",x="",$="",w=r-(f?2:1);if(p?b=`
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
                }`,n.kernelShape.length===2){let S=r-(f?3:2);h?x=`
                for (var j: u32 = 0u; j < uniforms.kh; j++) {
                  xIndices[${S}] = indices[${S}] * uniforms.sh - uniforms.phStart + j;
                  if (xIndices[${S}] < 0 || xIndices[${S}] >= uniforms.x_shape[${S}]) {
                    pad += i32(uniforms.kw);
                    continue;
                  }
              `:x=`
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

              var value = ${y}(${o});
              var pad = 0;
              ${x}
              ${b}
              ${$}
              ${s}

              output[global_idx] = value;
            }`}else{if(f)throw new Error("Pooling with kernelShape.length > 2 is not supported for NHWC format.");let b=n.kernelShape.length,x=n.pads.length,$="";return d?$=`
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

              var value = ${y}(${o});
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
                    + offsets[j - ${r-b}u] - ${te("uniforms.pads","j - 2u",x)};
                  ${$}
              }
              ${s}

              output[global_idx] = value;
            }`}},In=e=>`${e.format};${e.ceilMode};${e.autoPad};${e.kernelShape.length}`,zd=e=>`${In(e)};${e.countIncludePad}`,Ad=e=>`${In(e)};${e.storageOrder};${e.dilations}`,En=e=>({format:e.format,autoPad:["NOTSET","VALID","SAME_UPPER","SAME_LOWER"][e.auto_pad],ceilMode:e.ceil_mode,kernelShape:e.kernel_shape,strides:e.strides,pads:e.pads}),Cn=(e,t,r,i)=>{let[n,a]=Sn(t,i,r),s=U("x",t.dataType,t.dims.length),o=s.type.value,l="value += x_val;",d="";n.countIncludePad?d+=`value /= ${o}(uniforms.kernelSize);`:d+=`value /= ${o}(i32(uniforms.kernelSize) - pad);`;let[p,h,f,y,m]=kn(a,n);p.push(...re(t.dims,a));let b=["rank"];return{name:e,shaderCache:{hint:`${i.cacheKey};${f};${y};${m}`,inputDependencies:b},getRunData:()=>({outputs:[{dims:a,dataType:t.dataType}],dispatchGroup:{x:Math.ceil(R.size(a)/64)},programUniforms:p}),getShaderSource:x=>Tn(x,s,t.dims.length,a.length,n,l,d,0,h,f,y,m)}},Gf=e=>{let t=e.count_include_pad!==0,r=En(e);if(r.ceilMode!==0)throw new Error("using ceil() in shape computation is not yet supported for AveragePool");let i={countIncludePad:t,...r,cacheKey:""};return{...i,cacheKey:zd(i)}},Vf=(e,t)=>{fr(e.inputs),e.compute(Cn("AveragePool",e.inputs[0],!1,t))},zn={autoPad:"",ceilMode:0,countIncludePad:!1,kernelShape:[],strides:[],pads:[],storageOrder:0,dilations:[]},Ff=e=>{let t=e.format;return{format:t,...zn,cacheKey:t}},Hf=(e,t)=>{fr(e.inputs),e.compute(Cn("GlobalAveragePool",e.inputs[0],!0,t))},An=(e,t,r,i)=>{let[n,a]=Sn(t,i,r),s=`
      value = max(x_val, value);
    `,o="",l=U("x",t.dataType,t.dims.length),d=["rank"],[p,h,f,y,m]=kn(a,n);return p.push(...re(t.dims,a)),{name:e,shaderCache:{hint:`${i.cacheKey};${f};${y};${m}`,inputDependencies:d},getRunData:()=>({outputs:[{dims:a,dataType:t.dataType}],dispatchGroup:{x:Math.ceil(R.size(a)/64)},programUniforms:p}),getShaderSource:b=>Tn(b,l,t.dims.length,a.length,n,s,o,t.dataType===10?-65504:-1e5,h,f,y,m)}},jf=(e,t)=>{fr(e.inputs),e.compute(An("MaxPool",e.inputs[0],!1,t))},Kf=e=>{let t=e.storage_order,r=e.dilations,i=En(e);if(t!==0)throw new Error("column major storage order is not yet supported for MaxPool");if(i.ceilMode!==0)throw new Error("using ceil() in shape computation is not yet supported for MaxPool");let n={storageOrder:t,dilations:r,...i,cacheKey:""};return{...n,cacheKey:Ad(n)}},Xf=e=>{let t=e.format;return{format:t,...zn,cacheKey:t}},Zf=(e,t)=>{fr(e.inputs),e.compute(An("GlobalMaxPool",e.inputs[0],!0,t))}}),Md,Od,Yf,Qf,g_=W(()=>{ie(),ne(),ze(),ae(),Md=(e,t)=>{if(e.length<2||e.length>3)throw new Error("DequantizeLinear requires 2 or 3 inputs.");if(e.length===3&&e[1].dims===e[2].dims)throw new Error("x-scale and x-zero-point must have the same shape.");if(e.length===3&&e[0].dataType!==e[2].dataType)throw new Error("x and x-zero-point must have the same data type.");if(e[1].dims.length!==0&&e[1].dims.length!==1&&e[1].dims.length!==e[0].dims.length)throw new Error("scale input must be a scalar, a 1D tensor, or have the same rank as the input tensor.");if(e.length>2){if(e[0].dataType!==e[2].dataType)throw new Error("x and x-zero-point must have the same data type.");if(e[1].dims.length!==e[2].dims.length)throw new Error("scale and zero-point inputs must have the same rank.");if(!e[1].dims.map((r,i)=>r===e[2].dims[i]).reduce((r,i)=>r&&i,!0))throw new Error("scale and zero-point inputs must have the same shape.")}if(t.blockSize>0){if(e[1].dims.length===0||e[1].dims.length===1&&e[1].dims[0]===1)throw new Error("blockSize must be set only for block quantization.");if(!e[1].dims.map((n,a)=>a===t.axis||n===e[0].dims[a]).reduce((n,a)=>n&&a,!0))throw new Error("For block qunatization, scale input shape to match the input shape except for the axis");if(e[1].dims.length!==e[0].dims.length)throw new Error("For block qunatization the scale input rank must be the same as the x rank.");let r=e[0].dims[t.axis],i=e[1].dims[t.axis];if(t.blockSize<Math.ceil(r/i)||t.blockSize>Math.ceil(r/(i-1)-1))throw new Error("blockSize must be with in the range [ceil(dI / Si), ceil(dI / (Si - 1) - 1)].")}},Od=(e,t)=>{let r=R.normalizeAxis(t.axis,e[0].dims.length),i=e[0].dataType,n=i===3,a=e[0].dims,s=e[1].dataType,o=R.size(a),l=i===3||i===2,d=l?[Math.ceil(R.size(e[0].dims)/4)]:e[0].dims,p=e[1].dims,h=e.length>2?e[2]:void 0,f=h?l?[Math.ceil(R.size(h.dims)/4)]:h.dims:void 0,y=p.length===0||p.length===1&&p[0]===1,m=y===!1&&p.length===1,b=Ie(o),x=y&&(!l||b===4),$=x?b:1,w=x&&!l?b:1,S=U("input",l?12:i,d.length,w),v=U("scale",s,p.length),I=h?U("zero_point",l?12:i,f.length):void 0,C=J("output",s,a.length,$),z=[S,v];I&&z.push(I);let k=[d,p];h&&k.push(f);let N=[{type:12,data:o/$},{type:12,data:r},{type:12,data:t.blockSize},...re(...k,a)],B=H=>{let q=[{name:"output_size",type:"u32"},{name:"axis",type:"u32"},{name:"block_size",type:"u32"}];return`
      ${H.registerUniforms(q).declareVariables(...z,C)}
      ${H.mainStart()}
          ${H.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
          let output_indices = ${C.offsetToIndices("global_idx")};

          // Set input x
          ${l?`
            let input = ${S.getByOffset("global_idx / 4")};
            let x_vec = ${n?"unpack4xI8(input)":"unpack4xU8(input)"};
            let x_value = ${$===1?"x_vec[global_idx % 4]":"x_vec"};`:`let x_value = ${S.getByOffset("global_idx")};`};

          // Set scale input
          ${y?`let scale_value= ${v.getByOffset("0")}`:m?`
            let scale_index = ${C.indicesGet("output_indices","uniforms.axis")};
            let scale_value= ${v.getByOffset("scale_index")};`:`
            var scale_indices: ${v.type.indices} = output_indices;
            let index = ${v.indicesGet("scale_indices","uniforms.axis")} / uniforms.block_size;
            ${v.indicesSet("scale_indices","uniforms.axis","index")};
            let scale_value= ${v.getByIndices("scale_indices")};`};

          // Set zero-point input
          ${I?y?l?`
                let zero_point_input = ${I.getByOffset("0")};
                let zero_point_vec =  ${n?"unpack4xI8(zero_point_input)":"unpack4xU8(zero_point_input)"};
                let zero_point_value= zero_point_vec[0]`:`let zero_point_value = ${I.getByOffset("0")}`:m?l?`
                let zero_point_index = ${C.indicesGet("output_indices","uniforms.axis")};
                let zero_point_input = ${I.getByOffset("zero_point_index / 4")};
                let zero_point_vec =  ${n?"unpack4xI8(zero_point_input)":"unpack4xU8(zero_point_input)"};
                let zero_point_value = zero_point_vec[zero_point_index % 4]`:`
                let zero_point_index = ${C.indicesGet("output_indices","uniforms.axis")};
                let zero_point_value = ${I.getByOffset("zero_point_index")};`:l?`
                let zero_point_offset = ${v.indicesToOffset("scale_indices")};
                let zero_point_input = ${I.getByOffset("zero_point_offset / 4")};
                let zero_point_vec = ${n?"unpack4xI8(zero_point_input)":"unpack4xU8(zero_point_input)"};
                let zero_point_value = zero_point_vec[zero_point_offset % 4];`:`let zero_point_value = ${I.getByIndices("scale_indices")};`:`let zero_point_value = ${l?n?"i32":"u32":S.type.value}(0);`};
      // Compute and write output
      ${C.setByOffset("global_idx",`${C.type.value}(x_value - zero_point_value) * scale_value`)};
      }`};return{name:"DequantizeLinear",shaderCache:{hint:t.cacheKey,inputDependencies:I?["rank","rank","rank"]:["rank","rank"]},getShaderSource:B,getRunData:()=>({outputs:[{dims:a,dataType:s}],dispatchGroup:{x:Math.ceil(o/$/64),y:1,z:1},programUniforms:N})}},Yf=(e,t)=>{Md(e.inputs,t),e.compute(Od(e.inputs,t))},Qf=e=>me({axis:e.axis,blockSize:e.blockSize})}),Rd,Nd,Jf,y_=W(()=>{Ke(),ie(),ae(),Rd=(e,t,r)=>{let i=e===t,n=e<t&&r<0,a=e>t&&r>0;if(i||n||a)throw new Error("Range these inputs' contents are invalid.")},Nd=(e,t,r,i)=>{let n=Math.abs(Math.ceil((t-e)/r)),a=[n],s=n,o=[{type:12,data:s},{type:i,data:e},{type:i,data:r},...re(a)],l=d=>{let p=J("output",i,a.length),h=p.type.value,f=[{name:"outputSize",type:"u32"},{name:"start",type:h},{name:"delta",type:h}];return`
        ${d.registerUniforms(f).declareVariables(p)}
        ${d.mainStart()}
        ${d.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}
        output[global_idx] = uniforms.start + ${h}(global_idx) * uniforms.delta;
      }`};return{name:"Range",shaderCache:{hint:`${i}`},getShaderSource:l,getRunData:()=>({outputs:[{dims:a,dataType:i}],dispatchGroup:{x:Math.ceil(s/64)},programUniforms:o})}},Jf=e=>{let t=0,r=0,i=0;e.inputs[0].dataType===6?(t=e.inputs[0].getInt32Array()[0],r=e.inputs[1].getInt32Array()[0],i=e.inputs[2].getInt32Array()[0]):e.inputs[0].dataType===1&&(t=e.inputs[0].getFloat32Array()[0],r=e.inputs[1].getFloat32Array()[0],i=e.inputs[2].getFloat32Array()[0]),$e.webgpu.validateInputContent&&Rd(t,r,i),e.compute(Nd(t,r,i,e.inputs[0].dataType),{inputs:[]})}}),Bd,Dd,em,tm,__=W(()=>{ie(),ne(),ze(),ae(),Bd=(e,t,r,i)=>{if(e!=="none"&&i!=="i32"&&i!=="u32"&&i!=="f32")throw new Error(`Input ${i} is not supported with reduction ${e}.`);let n=`{
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
                ${n}max(bitcast<f32>(oldValue), (${r}))${a}`;case"min":return i==="i32"||i==="u32"?`atomicMin(&${t}, bitcast<${i}>(${r}));`:`${n}min(bitcast<${i}>(oldValue), (${r}))${a}`;case"mul":return`${n}(bitcast<${i}>(oldValue) * (${r}))${a}`;default:throw new Error(`Reduction ${e} is not supported.`)}},Dd=(e,t)=>{let r=e[0].dims,i=e[1].dims,n=r,a=1,s=Math.ceil(R.sizeToDimension(i,i.length-1)/a),o=i[i.length-1],l=R.sizeFromDimension(r,o),d=[{type:12,data:s},{type:12,data:o},{type:12,data:l},...re(e[1].dims,e[2].dims,n)],p=h=>{let f=U("indices",e[1].dataType,e[1].dims.length),y=U("updates",e[2].dataType,e[2].dims.length,a),m=t.reduction!=="none"&&t.reduction!==""?Ec("output",e[0].dataType,n.length):J("output",e[0].dataType,n.length,a);return`
      ${h.registerUniform("output_size","u32").registerUniform("last_index_dimension","u32").registerUniform("num_updates_elements","u32").declareVariables(f,y,m)}
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
    ${Bd(t.reduction,"output[data_offset + i]","value",m.type.value)}
  }

      }`};return{name:"ScatterND",shaderCache:{hint:`${t.cacheKey}_${t.reduction}`,inputDependencies:["rank","rank"]},getRunData:()=>({outputs:[{dims:n,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(s/64)},programUniforms:d}),getShaderSource:p}},em=e=>me({reduction:e.reduction}),tm=(e,t)=>{e.compute(Dd(e.inputs,t),{inputs:[e.inputs[1],e.inputs[2]],outputs:[]})}}),Pd,Ud,Ld,Mn,qd,Wd,Gd,Vd,Fd,Hd,jd,Kd,On,Xd,Zd,Yd,Qd,Jd,rm,im,b_=W(()=>{ie(),ne(),ze(),ae(),Pd=(e,t)=>{if(e.every(r=>r>0||(()=>{throw new Error("Resize requires scales input values to be positive")})),e.length>0){if(t.mode==="linear"){if(!(e.length===2||e.length===3||e.length===4&&e[0]===1&&e[1]===1||e.length===4&&e[0]===1&&e[3]===1||e.length===5&&e[0]===1&&e[1]===1))throw new Error(`For linear mode, Resize requires scales to be 2D, 3D, 4D with either two outermost or one innermost and
            one outermost scale values equal to 1, or 5D with two outermost scale values equal to 1`)}else if(t.mode==="cubic"&&!(e.length===2||e.length===4&&e[0]===1&&e[1]===1||e.length===4&&e[0]===1&&e[3]===1))throw new Error("Resize requires scales input size to be 2 or 4 for cubic mode")}},Ud=(e,t,r)=>{t.every(n=>n>=0&&n<r||(()=>{throw new Error("Resize requires axes input values to be positive and less than rank")}));let i=new Array(r).fill(1);return t.forEach((n,a)=>i[n]=e[a]),i},Ld=(e,t,r,i,n,a)=>{let[s,o,l]=r>10?[1,2,3]:[-1,e.length>1?1:-1,-1],d=e[0].dims.length;if(s>0&&e.length>s&&e[s].dims.length>0)e[s].getFloat32Array().forEach(p=>a.push(p));else if(t.coordinateTransformMode==="tf_crop_and_resize")throw new Error("Resize requires RoI input to be specified when coordinateTransformMode is tfCropAndResize");if(o>0&&e.length>o&&e[o].dims.length===1&&e[o].dims[0]>0){if(e[o].getFloat32Array().forEach(p=>i.push(p)),i.length!==0&&i.length!==d&&r>=18&&i.length!==t.axes.length)throw new Error("Resize requires scales input size to be same as input rank or axes size for opset 18 and up");Pd(i,t),t.axes.length>0&&Ud(i,t.axes,d).forEach((p,h)=>i[h]=p)}if(l>0&&e.length>l&&e[l].dims.length===1&&e[l].dims[0]>0&&(e[l].getBigInt64Array().forEach(p=>n.push(Number(p))),n.length!==0&&n.length!==d&&r>=18&&n.length!==t.axes.length))throw new Error("Resize requires sizes input size to be same as input rank or axes size for opset 18 and up");if(t.axes.length>0){if(i.length!==0&&i.length!==t.axes.length)throw new Error('Resize requires "scales" input size to be of axes rank when axes attributes is specified');if(n.length!==0&&n.length!==t.axes.length)throw new Error('Resize requires "sizes" input size to be of rank axes rank when axes attributes is specified')}if(typeof i<"u"&&typeof n<"u"&&i.length>0&&n.length>d)throw new Error("Resize requires only of scales or sizes to be specified")},Mn=(e,t,r,i)=>`
  // The whole part and the fractional part are calculated separately due to inaccuracy of floating
  // point division. As an example, f32(21) / f32(7) may evaluate to 2.99... instead of 3, causing an
  // offset-by-one error later in floor().
  let big = (${e}) * (${t});
  let whole = ${i}(big / (${r}));
  let fract = ${i}(big % (${r})) / ${i}(${r});
  return whole + fract;
`,qd=(e,t)=>`fn getOriginalCoordinateFromResizedCoordinate(xResized: u32, xScale: f32, lengthResized: u32,
     lengthOriginal: u32, roiStart: f32, roiEnd: f32) -> ${t} { `+(()=>{switch(e){case"asymmetric":return`
          if (xScale < 1.0 || floor(xScale) != xScale) {
            return ${t}(xResized) / ${t}(xScale);
          } else {
            ${Mn("xResized","lengthOriginal","lengthResized",t)}
          }
        `;case"pytorch_half_pixel":return`if (lengthResized > 1) {
                    return (${t}(xResized) + 0.5) / ${t}(xScale) - 0.5;
                  } else {
                    return 0.0;
                  }`;case"tf_half_pixel_for_nn":return`return (${t}(xResized) + 0.5) / ${t}(xScale);`;case"align_corners":return`if (lengthResized == 1) {
                    return 0.0;
                  } else {
                    ${Mn("xResized","lengthOriginal - 1","lengthResized - 1",t)}
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
                  return offset + ((${t}(xResized) + 0.5) / ${t}(xScale)) - 0.5;`;case"half_pixel":return`return ((${t}(xResized) + 0.5) / ${t}(xScale)) - 0.5;`;default:throw new Error(`Coordinate transform mode ${e} is not supported`)}})()+"}",Wd=(e,t,r)=>`fn getNearestPixelFromOriginal(xOriginal: ${r}, isDownSample: bool) -> ${r} {`+(()=>{switch(e){case"round_prefer_ceil":return"if (fract(xOriginal) == 0.5) {             return ceil(xOriginal);           } else {             return round(xOriginal);           }";case"floor":return"return floor(xOriginal);";case"ceil":return"return ceil(xOriginal);";case"round_prefer_floor":return"if (fract(xOriginal) == 0.5) {                     return floor(xOriginal);                   } else {                     return round(xOriginal);                   }";default:if(t<11)return"if (isDownSample)                     {                       return ceil(xOriginal);                     } else {                       return xOriginal;                     }";throw new Error(`Nearest mode ${e} is not supported`)}})()+"}",Gd=(e,t,r)=>{let i=new Array(r).fill(0).concat(new Array(r).fill(1)),n=e.length===0?i:e.slice();return t.length>0?(t.forEach((a,s)=>{i[a]=n[s],i[s+r]=n[t.length+s]}),i):n},Vd=(e,t,r,i)=>{let n=[];if(r.length>0)if(i.length>0){if(e.forEach(a=>n.push(a)),Math.max(...i)>e.length)throw new Error("axes is out of bound");i.forEach((a,s)=>n[a]=r[s])}else r.forEach(a=>n.push(a));else{if(t.length===0)throw new Error("Resize requires either scales or sizes.");n=e.map((a,s)=>Math.round(a*t[s]))}return n},Fd=(e,t,r)=>{let i=(()=>{switch(r.keepAspectRatioPolicy){case"not_larger":return r.axes.length>0?Math.min(...r.axes.map(a=>t[a]),Number.MAX_VALUE):Math.min(...t,Number.MAX_VALUE);case"not_smaller":return r.axes.length>0?Math.max(...r.axes.map(a=>t[a]),Number.MIN_VALUE):Math.max(...t,Number.MIN_VALUE);default:throw new Error(`Keep aspect ratio policy ${r.keepAspectRatioPolicy} is not supported`)}})();t.fill(1,0,t.length);let n=e.slice();return r.axes.length>0?(r.axes.forEach(a=>t[a]=i),r.axes.forEach(a=>n[a]=Math.round(e[a]*t[a]))):(t.fill(i,0,t.length),n.forEach((a,s)=>n[s]=Math.round(a*t[s]))),n},Hd=(e,t,r,i,n)=>`
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
    }`,jd=(e,t,r,i,n,a,s)=>`
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
    }`,Kd=(e,t)=>`
    fn checkInputIndices(input_indices: ${e.type.indices}) -> bool {
      for (var i:u32 = 0; i < ${t.length}; i++) {
        var input_index = ${e.indicesGet("input_indices","i")};
        if (input_index < 0 || input_index >= ${te("uniforms.input_shape","i",t.length)}) {
          return false;
        }
      }
      return true;
    }`,On=(e,t,r,i)=>e.rank>i?`
    ${e.indicesSet("input_indices",t,"channel")};
    ${e.indicesSet("input_indices",r,"batch")};
`:"",Xd=(e,t,r,i,n)=>{let[a,s,o,l]=r.length===2?[-1,0,1,-1]:[0,2,3,1],d=e.type.value;return`
    fn getInputValue(batch: u32, channel: u32, row: u32, col: u32) -> ${d} {
      var input_indices: ${e.type.indices};
      ${e.indicesSet("input_indices",s,`max(0, min(row, ${r[s]} - 1))`)};
      ${e.indicesSet("input_indices",o,`max(0, min(col, ${r[o]} - 1))`)};
      ${On(e,l,a,2)}
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
    }`},Zd=(e,t,r,i,n,a,s,o,l,d)=>{let p=r.length===2,[h,f]=p?[0,1]:[2,3],y=e.type.value,m=b=>{let x=b===h?"row":"col";return`
      fn ${x}CubicInterpolation(input_indices: ${e.type.indices}, output_indices: ${t.type.indices}) -> ${y} {
        var output_index = ${t.indicesGet("output_indices",b)};
        var originalIdx: ${y} = getOriginalCoordinateFromResizedCoordinate(output_index, ${n[b]},
        ${i[b]}, ${r[b]}, ${a[b]}, ${a[b]} + ${r.length});
        var fractOriginalIdx: ${y} = originalIdx - floor(originalIdx);
        var coefs = getCubicInterpolationCoefs(fractOriginalIdx);

        if (${o} && (originalIdx < 0 || originalIdx > (${r[b]} - 1))) {
          return ${l};
        }
        var data: array<${y}, 4> = array<${y}, 4>(0.0, 0.0, 0.0, 0.0);
        for (var i: i32 = -1; i < 3; i++) {
          var ${x}: ${y} = originalIdx + ${y}(i);
          if (${x} < 0 || ${x} >= ${r[b]}) {
            ${d?`coefs[i + 1] = 0.0;
                        continue;`:o?`return ${l};`:`${x} = max(0, min(${x}, ${r[b]} - 1));`};
          }
        var input_indices_copy: ${e.type.indices} = input_indices;
          ${e.indicesSet("input_indices_copy",b,`u32(${x})`)};
          data[i + 1] = ${b===h?e.getByIndices("input_indices_copy"):"rowCubicInterpolation(input_indices_copy, output_indices)"};
        }
        return cubicInterpolation1D(data, coefs);
      }`};return`
    ${m(h)};
    ${m(f)};
  fn getCubicInterpolationCoefs(s: ${y}) -> array<${y}, 4> {
    var absS = abs(s);
    var coeffs: array<${y}, 4> = array<${y}, 4>(0.0, 0.0, 0.0, 0.0);
    var oneMinusAbsS: ${y} = 1.0 - absS;
    var twoMinusAbsS: ${y} = 2.0 - absS;
    var onePlusAbsS: ${y} = 1.0 + absS;
    coeffs[0] = ((${s} * onePlusAbsS - 5 * ${s}) * onePlusAbsS + 8 * ${s}) * onePlusAbsS - 4 * ${s};
    coeffs[1] = ((${s} + 2) * absS - (${s} + 3)) * absS * absS + 1;
    coeffs[2] = ((${s} + 2) * oneMinusAbsS - (${s} + 3)) * oneMinusAbsS * oneMinusAbsS + 1;
    coeffs[3] = ((${s} * twoMinusAbsS - 5 * ${s}) * twoMinusAbsS + 8 * ${s}) * twoMinusAbsS - 4 * ${s};
    return coeffs;
  }

  fn cubicInterpolation1D(x: array<${y}, 4>, coefs: array<${y}, 4>) -> ${y} {
    var coefsSum: ${y} = coefs[0] + coefs[1] + coefs[2] + coefs[3];
    return (x[0] * coefs[0] + x[1] * coefs[1]+ x[2] * coefs[2]+ x[3] * coefs[3]) / coefsSum;
  }

  fn bicubicInterpolation(output_indices: ${t.type.indices}) -> ${y} {
    var input_indices: ${e.type.indices} = output_indices;
    return colCubicInterpolation(input_indices, output_indices);
  }
    `},Yd=(e,t,r,i,n)=>{let[a,s,o,l,d]=r.length===3?[-1,0,1,2,-1]:[0,2,3,4,1],p=e.type.value;return`
    fn getInputValue(batch: u32, channel: u32, depth:u32, height: u32, width: u32) -> ${p} {
      var input_indices: ${e.type.indices};
      ${e.indicesSet("input_indices",s,`max(0, min(depth, ${r[s]} - 1))`)};
      ${e.indicesSet("input_indices",o,`max(0, min(height, ${r[o]} - 1))`)};
      ${e.indicesSet("input_indices",l,`max(0, min(width, ${r[l]} - 1))`)};
      ${On(e,d,a,3)}
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
    }`},Qd=(e,t,r,i,n,a)=>{let s=e.dims,o=Gd(a,t.axes,s.length),l=Vd(s,i,n,t.axes),d=i.slice();i.length===0&&(d=s.map((w,S)=>w===0?1:l[S]/w),t.keepAspectRatioPolicy!=="stretch"&&(l=Fd(s,d,t)));let p=J("output",e.dataType,l.length),h=U("input",e.dataType,s.length),f=R.size(l),y=s.length===l.length&&s.every((w,S)=>w===l[S]),m=t.coordinateTransformMode==="tf_crop_and_resize",b=t.extrapolationValue,x=h.type.value,$=w=>`
      ${y?"":`
      ${qd(t.coordinateTransformMode,x)};
      ${(()=>{switch(t.mode){case"nearest":return`
              ${Kd(h,s)};
              ${Wd(t.nearestMode,r,x)};
              ${jd(h,p,s,l,d.length,o.length,m)};
              `;case"linear":return`
              ${Hd(p,s,l,d.length,o.length)};
              ${(()=>{if(s.length===2||s.length===4)return`${Xd(h,p,s,m,b)}`;if(s.length===3||s.length===5)return`${Yd(h,p,s,m,b)}`;throw Error("Linear mode only supports input dims 2, 3, 4 and 5 are supported in linear mode.")})()};
            `;case"cubic":return`
            ${(()=>{if(s.length===2||s.length===4)return`${Zd(h,p,s,l,d,o,t.cubicCoeffA,m,t.extrapolationValue,t.excludeOutside)}`;throw Error("Cubic mode only supports input dims 2 and 4 are supported in linear mode.")})()};
            `;default:throw Error("Invalid resize mode")}})()};
      `}
      ${w.registerUniform("output_size","u32").registerUniform("scales","f32",d.length).registerUniform("roi","f32",o.length).declareVariables(h,p)}
      ${w.mainStart()}
        ${w.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
        ${y?"output[global_idx] = input[global_idx];":`
        let output_indices = ${p.offsetToIndices("global_idx")};
        var input_indices: ${h.type.indices};
        ${(()=>{switch(t.mode){case"nearest":return`input_indices = calculateInputIndicesFromOutputIndices(output_indices);
                if (checkInputIndices(input_indices)) {
                  output[global_idx] = ${h.getByIndices("input_indices")};
                } else {
                  output[global_idx] = ${t.extrapolationValue};
                }`;case"linear":return`output[global_idx] = ${s.length===2||s.length===4?"bilinearInterpolation":"trilinearInterpolation"}(output_indices);`;case"cubic":return"output[global_idx] = bicubicInterpolation(output_indices);";default:throw Error(`Unsupported resize mode: ${t.mode}`)}})()};
`}
      }`;return{name:"Resize",shaderCache:{hint:`${t.cacheKey}|${r}|${d.length>0?t.mode==="cubic"?d:d.length:""}|${n.length>0?n:""}|${o.length>0?o:""}|${y}|${t.mode==="nearest"?s.length:s}`,inputDependencies:["rank"]},getShaderSource:$,getRunData:()=>({outputs:[{dims:l,dataType:e.dataType}],dispatchGroup:{x:Math.ceil(f/64)},programUniforms:[{type:12,data:f},{type:1,data:d},{type:1,data:o},...re(s,l)]})}},Jd=e=>{let t=e.customDataBuffer;return new Uint32Array(t.buffer,t.byteOffset,1)[0]},rm=(e,t)=>{let r=[],i=[],n=[],a=Jd(e);if(t.antialias!==0)throw Error("Only default value (0) for Antialias attribute is supported");Ld(e.inputs,t,a,r,i,n),e.compute(Qd(e.inputs[0],t,a,r,i,n),{inputs:[0]})},im=e=>{let t=e.antialias,r=e.axes,i=e.coordinateTransformMode,n=e.cubicCoeffA,a=e.excludeOutside!==0,s=e.extrapolationValue,o=e.keepAspectRatioPolicy,l=e.mode,d=e.nearestMode===""?"simple":e.nearestMode;return me({antialias:t,axes:r,coordinateTransformMode:i,cubicCoeffA:n,excludeOutside:a,extrapolationValue:s,keepAspectRatioPolicy:o,mode:l,nearestMode:d})}}),ep,tp,nm,w_=W(()=>{ie(),ne(),ae(),ep=e=>{if(!e||e.length<3)throw new Error("layerNorm requires at least 3 inputs.");let t=e[0],r=e[1],i=e[2];if(t.dataType!==r.dataType||t.dataType!==i.dataType)throw new Error("All inputs must have the same data type");if(t.dims.length!==3&&t.dims.length!==2)throw new Error("Input must be 2D or 3D");if(r.dims.length!==3&&r.dims.length!==2)throw new Error("Skip must be 2D or 3D");let n=t.dims[t.dims.length-1],a=t.dims[t.dims.length-2];if(r.dims[r.dims.length-1]!==n)throw new Error("Skip must have the same hidden size as input");if(r.dims[r.dims.length-2]!==a)throw new Error("Skip must have the same sequence length as input");if(i.dims.length!==1)throw new Error("Gamma must be 1D");if(i.dims[i.dims.length-1]!==n)throw new Error("Gamma must have the same hidden size as input");if(e.length>3){let s=e[3];if(s.dims.length!==1)throw new Error("Beta must be 1D");if(s.dims[s.dims.length-1]!==n)throw new Error("Beta must have the same hidden size as input")}if(e.length>4){let s=e[4];if(s.dims.length!==1)throw new Error("Bias must be 1D");if(s.dims[s.dims.length-1]!==n)throw new Error("Bias must have the same hidden size as input")}},tp=(e,t,r,i)=>{let n=t.simplified,a=e[0].dims,s=R.size(a),o=a,l=s,d=a.slice(-1)[0],p=i?a.slice(0,-1).concat(1):[],h=!n&&e.length>3,f=e.length>4,y=i&&r>1,m=i&&r>2,b=r>3,x=64,$=Ie(d),w=[{type:12,data:l},{type:12,data:$},{type:12,data:d},{type:1,data:t.epsilon}],S=I=>{let C=[{name:"output_size",type:"u32"},{name:"components",type:"u32"},{name:"hidden_size",type:"u32"},{name:"epsilon",type:"f32"}],z=[U("x",e[0].dataType,e[0].dims,$),U("skip",e[1].dataType,e[1].dims,$),U("gamma",e[2].dataType,e[2].dims,$)];h&&z.push(U("beta",e[3].dataType,e[3].dims,$)),f&&z.push(U("bias",e[4].dataType,e[4].dims,$)),z.push(J("output",e[0].dataType,o,$)),y&&z.push(J("mean_output",1,p)),m&&z.push(J("inv_std_output",1,p)),b&&z.push(J("input_skip_bias_sum",e[0].dataType,o,$));let k=Oe(e[0].dataType),N=Oe(1,$);return`

      ${I.registerUniforms(C).declareVariables(...z)}
      var<workgroup> sum_shared : array<${N}, ${x}>;
      var<workgroup> sum_squared_shared : array<${N}, ${x}>;

      ${I.mainStart([x,1,1])}
        let ix = local_id.x;
        let iy = global_id.x / ${x};

        let hidden_size_vectorized: u32 = uniforms.hidden_size / uniforms.components;
        var stride = hidden_size_vectorized / ${x};
        let offset = ix * stride + iy * hidden_size_vectorized;
        let offset1d = stride * ix;
        if (ix == ${x-1}) {
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

        var reduce_size : u32 = ${x};
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
        let mean = ${St("sum",$)} / f32(uniforms.hidden_size);
        let inv_std_dev = inverseSqrt(${St("square_sum",$)} / f32(uniforms.hidden_size) ${n?"":"- mean * mean"} + uniforms.epsilon);
        ${y?"mean_output[global_idx] = mean;":""}
        ${m?"inv_std_output[global_idx] = inv_std_dev;":""}

        for (var i: u32 = 0; i < stride; i++) {
          output[offset + i] = (output[offset + i] ${n?"":`- ${k}(mean)`}) *
            ${k}(inv_std_dev) * gamma[offset1d + i]
            ${h?"+ beta[offset1d + i]":""};
        }
      }`},v=[{dims:o,dataType:e[0].dataType}];return r>1&&v.push({dims:p,dataType:1}),r>2&&v.push({dims:p,dataType:1}),r>3&&v.push({dims:a,dataType:e[0].dataType}),{name:"SkipLayerNormalization",shaderCache:{hint:`${$};${y};${m};${b}`,inputDependencies:e.map((I,C)=>"type")},getShaderSource:S,getRunData:()=>({outputs:v,dispatchGroup:{x:Math.ceil(l/d)},programUniforms:w})}},nm=(e,t)=>{ep(e.inputs);let r=[0];e.outputCount>1&&r.push(-3),e.outputCount>2&&r.push(-3),e.outputCount>3&&r.push(3),e.compute(tp(e.inputs,t,e.outputCount,!1),{outputs:r})}}),rp,mr,ip,Rn,np,ap,am,sm,$_=W(()=>{ie(),ne(),ze(),ae(),rp=(e,t)=>{if(!e||e.length<1)throw new Error("too few inputs");if(t.axes.length!==0){if(t.axes.length!==t.starts.length||t.axes.length!==t.ends.length)throw new Error("axes, starts and ends must have the same length")}else if(t.starts.length!==t.ends.length)throw new Error("starts and ends must have the same length");e.slice(1).forEach((r,i)=>{if(e[i+1].dataType!==6&&e[i+1].dataType!==7)throw new Error(`Input ${i} must be an array of int32 or int64`)})},mr=(e,t)=>{let r=[];if(e.length>t)if(e[t].dataType===7)e[t].getBigInt64Array().forEach(i=>r.push(Number(i)));else if(e[t].dataType===6)e[t].getInt32Array().forEach(i=>r.push(Number(i)));else throw new Error(`Input ${t} must be an array of int32 or int64`);return r},ip=(e,t)=>{if(e.length>1){let r=mr(e,1),i=mr(e,2),n=mr(e,3);return n.length===0&&(n=[...Array(e[0].dims.length).keys()]),me({starts:r,ends:i,axes:n})}else return t},Rn=(e,t,r,i,n)=>{let a=e;return e<0&&(a+=r[i[t]]),n[t]<0?Math.max(0,Math.min(a,r[i[t]]-1)):Math.max(0,Math.min(a,r[i[t]]))},np=(e,t,r)=>`fn calculateInputIndices(output_indices: ${t.type.indices}) -> ${e.type.indices} {
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
      }`,ap=(e,t)=>{let r=e[0].dims,i=R.size(r),n=t.axes.length>0?R.normalizeAxes(t.axes,r.length):[...Array(r.length).keys()],a=mr(e,4);a.forEach($=>$!==0||(()=>{throw new Error("step cannot be 0")})),a.length===0&&(a=Array(n.length).fill(1));let s=t.starts.map(($,w)=>Rn($,w,r,n,a)),o=t.ends.map(($,w)=>Rn($,w,r,n,a));if(n.length!==s.length||n.length!==o.length)throw new Error("start, ends and axes should have the same number of elements");if(n.length!==r.length)for(let $=0;$<r.length;++$)n.includes($)||(s.splice($,0,0),o.splice($,0,r[$]),a.splice($,0,1));let l=a.map($=>Math.sign($));a.forEach(($,w,S)=>{if($<0){let v=(o[w]-s[w])/$,I=s[w],C=I+v*a[w];s[w]=C,o[w]=I,S[w]=-$}});let d=r.slice(0);n.forEach(($,w)=>{d[$]=Math.ceil((o[$]-s[$])/a[$])});let p={dims:d,dataType:e[0].dataType},h=J("output",e[0].dataType,d.length),f=U("input",e[0].dataType,e[0].dims.length),y=R.size(d),m=[{name:"outputSize",type:"u32"},{name:"starts",type:"u32",length:s.length},{name:"signs",type:"i32",length:l.length},{name:"steps",type:"u32",length:a.length}],b=[{type:12,data:y},{type:12,data:s},{type:6,data:l},{type:12,data:a},...re(e[0].dims,d)],x=$=>`
      ${$.registerUniforms(m).declareVariables(f,h)}
        ${np(f,h,r)}
        ${$.mainStart()}
          ${$.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}
          let output_indices = ${h.offsetToIndices("global_idx")};
          let input_indices = calculateInputIndices(output_indices);
          ${h.setByOffset("global_idx",f.getByIndices("input_indices"))}
      }`;return{name:"Slice",shaderCache:{hint:`${l.length}_${s.length}_${a.length}`,inputDependencies:["rank"]},getShaderSource:x,getRunData:()=>({outputs:[p],dispatchGroup:{x:Math.ceil(i/64)},programUniforms:b})}},am=(e,t)=>{rp(e.inputs,t);let r=ip(e.inputs,t);e.compute(ap(e.inputs,r),{inputs:[0]})},sm=e=>{let t=e.starts,r=e.ends,i=e.axes;return me({starts:t,ends:r,axes:i})}}),sp,op,om,um,v_=W(()=>{ie(),ne(),ze(),kt(),ae(),sp=e=>{if(!e||e.length!==1)throw new Error("Softmax op requires 1 input.")},op=(e,t)=>{let r=e.inputs[0],i=r.dims,n=R.size(i),a=i.length,s=R.normalizeAxis(t.axis,a),o=s<i.length-1,l,d=[];o?(d=Array.from({length:a},(z,k)=>k),d[s]=a-1,d[a-1]=s,l=e.compute(Ge(r,d),{inputs:[r],outputs:[-1]})[0]):l=r;let p=l.dims,h=p[a-1],f=n/h,y=Ie(h),m=h/y,b=64;f===1&&(b=256);let x=(z,k)=>k===4?`max(max(${z}.x, ${z}.y), max(${z}.z, ${z}.w))`:k===2?`max(${z}.x, ${z}.y)`:k===3?`max(max(${z}.x, ${z}.y), ${z}.z)`:z,$=U("x",l.dataType,l.dims,y),w=J("result",l.dataType,l.dims,y),S=$.type.value,v=Oe(l.dataType)==="f32"?`var threadMax = ${S}(-3.4028234663852886e+38f);`:`var threadMax = ${S}(-65504.0h);`,I=z=>`
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
        ${v}
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
          rowMaxShared = ${S}(${x("threadShared[0]",y)});
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
          rowSumShared = ${S}(${St("threadShared[0]",y)});
        }
        workgroupBarrier();

        // calculate final value for each element in the row
        for (var col = lindex; col < cols; col += wg) {
          var value = exp(getValue(row, col, row_stride) - rowMaxShared) / rowSumShared;
          // max operation protects against NaN since all values should be >=0
          value = max(value, ${S}(0.0));
          setValue(row, col, row_stride, value);
        }
      }`,C=e.compute({name:"Softmax",shaderCache:{hint:`${y};${b}`,inputDependencies:["type"]},getRunData:()=>({outputs:[{dims:p,dataType:l.dataType}],dispatchGroup:{x:f},programUniforms:[{type:6,data:m}]}),getShaderSource:I},{inputs:[l],outputs:[o?-1:0]})[0];o&&e.compute(Ge(C,d),{inputs:[C]})},om=(e,t)=>{sp(e.inputs),op(e,t)},um=e=>me({axis:e.axis})}),Nn,up,lp,dp,lm,x_=W(()=>{ie(),ne(),ae(),Nn=e=>Array.from(e.getBigInt64Array(),Number),up=e=>{if(!e||e.length!==2)throw new Error("Tile requires 2 inputs.");if(e[0].dataType!==1&&e[0].dataType!==10&&e[0].dataType!==6&&e[0].dataType!==12)throw new Error("Tile only support float, float16, int32, and uint32 data types");if(e[1].dataType!==7)throw new Error("Tile `repeats` input should be of int64 data type");if(e[1].dims.length!==1)throw new Error("Tile `repeats` input should be 1-D");if(Nn(e[1]).length!==e[0].dims.length)throw new Error("Tile `repeats` input should have same number of elements as rank of input data tensor")},lp=(e,t)=>{let r=[];for(let i=0;i<e.length;++i)r.push(e[i]*t[i]);return r},dp=(e,t)=>{let r=e[0].dims,i=t??Nn(e[1]),n=lp(r,i),a=R.size(n),s=e[0].dataType,o=U("input",s,r.length),l=J("output",s,n.length),d=p=>`
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
    }`;return{name:"Tile",shaderCache:{hint:`${i}`,inputDependencies:["rank"]},getRunData:()=>({outputs:[{dims:n,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(a/64)},programUniforms:[{type:12,data:a},...re(e[0].dims,n)]}),getShaderSource:d}},lm=e=>{up(e.inputs),e.compute(dp(e.inputs),{inputs:[0]})}}),pp,cp,dm,S_=W(()=>{ie(),ne(),ae(),pp=(e,t,r,i,n)=>{let a=J("output_data",n,r.length,4),s=U("a_data",t[1].dataType,t[1].dims.length,4),o=U("b_data",t[2].dataType,t[2].dims.length,4),l=U("c_data",t[0].dataType,t[0].dims.length,4),d,p=(h,f,y)=>`select(${f}, ${h}, ${y})`;if(!i)d=a.setByOffset("global_idx",p(s.getByOffset("global_idx"),o.getByOffset("global_idx"),l.getByOffset("global_idx")));else{let h=(f,y,m="")=>{let b=`a_data[index_a${y}][component_a${y}]`,x=`b_data[index_b${y}][component_b${y}]`,$=`bool(c_data[index_c${y}] & (0xffu << (component_c${y} * 8)))`;return`
            let output_indices${y} = ${a.offsetToIndices(`global_idx * 4u + ${y}u`)};
            let offset_a${y} = ${s.broadcastedIndicesToOffset(`output_indices${y}`,a)};
            let offset_b${y} = ${o.broadcastedIndicesToOffset(`output_indices${y}`,a)};
            let offset_c${y} = ${l.broadcastedIndicesToOffset(`output_indices${y}`,a)};
            let index_a${y} = offset_a${y} / 4u;
            let index_b${y} = offset_b${y} / 4u;
            let index_c${y} = offset_c${y} / 4u;
            let component_a${y} = offset_a${y} % 4u;
            let component_b${y} = offset_b${y} % 4u;
            let component_c${y} = offset_c${y} % 4u;
            ${f}[${y}] = ${m}(${p(b,x,$)});
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
      }`},cp=e=>{let t=e[1].dims,r=e[2].dims,i=e[0].dims,n=e[1].dataType,a=!(R.areEqual(t,r)&&R.areEqual(r,i)),s=t,o=R.size(t);if(a){let d=tr.calcShape(tr.calcShape(t,r,!1),i,!1);if(!d)throw new Error("Can't perform where op on the given tensors");s=d,o=R.size(s)}let l=Math.ceil(o/4);return{name:"Where",shaderCache:{inputDependencies:["rank","rank","rank"]},getShaderSource:d=>pp(d,e,s,a,n),getRunData:()=>({outputs:[{dims:s,dataType:n}],dispatchGroup:{x:Math.ceil(o/64/4)},programUniforms:[{type:12,data:l},...re(i,t,r,s)]})}},dm=e=>{e.compute(cp(e.inputs))}}),pm,k_=W(()=>{Uy(),Ea(),Ly(),qy(),Wy(),Gy(),Vy(),Xy(),Yy(),Qy(),Jy(),e_(),t_(),r_(),i_(),n_(),a_(),s_(),o_(),u_(),l_(),d_(),p_(),c_(),h_(),zf(),f_(),m_(),g_(),y_(),__(),Ia(),b_(),Nf(),w_(),$_(),v_(),Of(),x_(),kt(),Ca(),S_(),pm=new Map([["Abs",[ih]],["Acos",[nh]],["Acosh",[ah]],["Add",[Uh]],["ArgMax",[Jc,Jn]],["ArgMin",[Qc,Jn]],["Asin",[sh]],["Asinh",[oh]],["Atan",[uh]],["Atanh",[lh]],["Attention",[eh]],["AveragePool",[Vf,Gf]],["BatchNormalization",[th]],["BiasAdd",[rh]],["BiasSplitGelu",[Ph]],["Cast",[ph,dh]],["Ceil",[hh]],["Clip",[ch]],["Concat",[Xh,Zh]],["Conv",[aa,na]],["ConvTranspose",[of,sf]],["Cos",[fh]],["Cosh",[mh]],["CumSum",[uf,lf]],["DepthToSpace",[df,pf]],["DequantizeLinear",[Yf,Qf]],["Div",[Lh]],["Einsum",[cf,hf]],["Elu",[gh,$r]],["Equal",[qh]],["Erf",[yh]],["Exp",[_h]],["Expand",[ff]],["FastGelu",[mf]],["Floor",[bh]],["FusedConv",[aa,na]],["Gather",[yf,gf]],["GatherElements",[xf,vf]],["GatherBlockQuantized",[wf,$f]],["GatherND",[_f,bf]],["Gelu",[wh]],["Gemm",[kf,Sf]],["GlobalAveragePool",[Hf,Ff]],["GlobalMaxPool",[Zf,Xf]],["Greater",[Fh]],["GreaterOrEqual",[jh]],["GridSample",[Tf,If]],["GroupQueryAttention",[Bf]],["HardSigmoid",[Eh,Ih]],["InstanceNormalization",[Df]],["LayerNormalization",[Pf]],["LeakyRelu",[$h,$r]],["Less",[Hh]],["LessOrEqual",[Kh]],["Log",[Bh]],["MatMul",[Uf]],["MatMulNBits",[Lf,qf]],["MaxPool",[jf,Kf]],["Mul",[Wh]],["MultiHeadAttention",[Cf,Ef]],["Neg",[xh]],["Not",[vh]],["Pad",[Wf]],["Pow",[Gh]],["QuickGelu",[Dh,$r]],["Range",[Jf]],["Reciprocal",[Sh]],["ReduceMin",[jc]],["ReduceMean",[Wc]],["ReduceMax",[Hc]],["ReduceSum",[Xc]],["ReduceProd",[Kc]],["ReduceL1",[Gc]],["ReduceL2",[Vc]],["ReduceLogSum",[Yc]],["ReduceLogSumExp",[Fc]],["ReduceSumSquare",[Zc]],["Relu",[kh]],["Resize",[rm,im]],["RotaryEmbedding",[Rf]],["ScatterND",[tm,em]],["Sigmoid",[Th]],["Sin",[Ch]],["Sinh",[zh]],["Slice",[am,sm]],["SkipLayerNormalization",[nm]],["Split",[Af,Mf]],["Sqrt",[Ah]],["Softmax",[om,um]],["Sub",[Vh]],["Tan",[Mh]],["Tanh",[Oh]],["ThresholdedRelu",[Nh,$r]],["Tile",[lm]],["Transpose",[zc,Ac]],["Where",[dm]]])}),cm,T_=W(()=>{Ke(),mt(),ae(),cm=class{constructor(e){this.backend=e,this.repo=new Map,this.attributesBound=!1}getArtifact(e){return this.repo.get(e)}setArtifact(e,t){this.repo.set(e,t)}run(e,t,r,i,n){dt(e.programInfo.name);let a=this.backend.device,s=this.backend.getComputePassEncoder();this.backend.writeTimestamp(this.backend.pendingDispatchNumber*2);let o=[];for(let d of t)o.push({binding:o.length,resource:{buffer:d.buffer}});for(let d of r)o.push({binding:o.length,resource:{buffer:d.buffer}});n&&o.push({binding:o.length,resource:n});let l=a.createBindGroup({layout:e.computePipeline.getBindGroupLayout(0),entries:o,label:e.programInfo.name});if(this.backend.sessionStatus==="capturing"){let d={kernelId:this.backend.currentKernelId,computePipeline:e.computePipeline,bindGroup:l,dispatchGroup:i};this.backend.capturedCommandList.get(this.backend.currentSessionId).push(d)}s.setPipeline(e.computePipeline),s.setBindGroup(0,l),s.dispatchWorkgroups(...i),this.backend.writeTimestamp(this.backend.pendingDispatchNumber*2+1),this.backend.pendingDispatchNumber++,(this.backend.pendingDispatchNumber>=this.backend.maxDispatchNumber||this.backend.queryType==="at-passes")&&this.backend.endComputePass(),this.backend.pendingDispatchNumber>=this.backend.maxDispatchNumber&&this.backend.flush(),it(e.programInfo.name)}dispose(){}build(e,t){dt(e.name);let r=this.backend.device,i=[];[{feature:"shader-f16",extension:"f16"},{feature:"subgroups",extension:"subgroups"}].forEach(d=>{r.features.has(d.feature)&&i.push(`enable ${d.extension};`)});let n=Cc(t,this.backend.device.limits),a=e.getShaderSource(n),s=`${i.join(`
`)}
${n.additionalImplementations}
${a}`,o=r.createShaderModule({code:s,label:e.name});pe("verbose",()=>`[WebGPU] ${e.name} shader code: ${s}`);let l=r.createComputePipeline({compute:{module:o,entryPoint:"main"},layout:"auto",label:e.name});return it(e.name),{programInfo:e,computePipeline:l,uniformVariablesInfo:n.variablesInfo}}normalizeDispatchGroupSize(e){let t=typeof e=="number"?e:e.x,r=typeof e=="number"?1:e.y||1,i=typeof e=="number"?1:e.z||1,n=this.backend.device.limits.maxComputeWorkgroupsPerDimension;if(t<=n&&r<=n&&i<=n)return[t,r,i];let a=t*r*i,s=Math.ceil(Math.sqrt(a));if(s>n){if(s=Math.ceil(Math.cbrt(a)),s>n)throw new Error("Total dispatch size exceeds WebGPU maximum.");return[s,s,s]}else return[s,s,1]}}}),hm={};ir(hm,{WebGpuBackend:()=>fm});var hp,fp,mp,fm,I_=W(()=>{Ke(),ie(),mt(),Sc(),Dy(),k_(),T_(),hp=(e,t)=>{if(t.length!==e.length)throw new Error(`inputDependencies length ${t.length} is not equal to inputTensors length ${e.length}.`);let r=[];for(let i=0;i<e.length;++i){let n=e[i].dataType;switch(t[i]){case"none":{r.push("");break}case"type":{r.push(`${n}`);break}case"rank":{let a=e[i].dims.length;r.push(`${n};${a}`);break}case"dims":{let a=e[i].dims.join(",");r.push(`${n};${a}`);break}default:throw new Error(`unsupported input dependency: ${t[i]}`)}}return r.join("|")},fp=(e,t,r)=>{let i=e.name;return e.shaderCache?.hint&&(i+="["+e.shaderCache.hint+"]"),i+=":"+r+`:${hp(t,e.shaderCache?.inputDependencies??new Array(t.length).fill("dims"))}`,i},mp=class{constructor(e){e&&(this.architecture=e.architecture,this.vendor=e.vendor)}isArchitecture(e){return this.architecture===e}isVendor(e){return this.vendor===e}},fm=class{constructor(){this.currentSessionId=null,this.currentKernelId=null,this.commandEncoder=null,this.computePassEncoder=null,this.maxDispatchNumber=16,this.pendingDispatchNumber=0,this.pendingKernels=[],this.pendingQueries=new Map,this.sessionStatus="default",this.capturedCommandList=new Map,this.capturedPendingKernels=new Map,this.sessionExternalDataMapping=new Map}get currentKernelCustomData(){if(this.currentKernelId===null)throw new Error("currentKernelCustomData(): currentKernelId is null. (should not happen)");let e=this.kernelCustomData.get(this.currentKernelId);return e||(e={},this.kernelCustomData.set(this.currentKernelId,e)),e}async initialize(e,t){this.env=e;let r=[],i={requiredLimits:{maxComputeWorkgroupStorageSize:t.limits.maxComputeWorkgroupStorageSize,maxComputeWorkgroupsPerDimension:t.limits.maxComputeWorkgroupsPerDimension,maxStorageBufferBindingSize:t.limits.maxStorageBufferBindingSize,maxBufferSize:t.limits.maxBufferSize,maxComputeInvocationsPerWorkgroup:t.limits.maxComputeInvocationsPerWorkgroup,maxComputeWorkgroupSizeX:t.limits.maxComputeWorkgroupSizeX,maxComputeWorkgroupSizeY:t.limits.maxComputeWorkgroupSizeY,maxComputeWorkgroupSizeZ:t.limits.maxComputeWorkgroupSizeZ},requiredFeatures:r},n=o=>t.features.has(o)&&r.push(o)&&!0;n("chromium-experimental-timestamp-query-inside-passes")||n("timestamp-query"),n("shader-f16"),n("subgroups"),this.device=await t.requestDevice(i);let a=t,s=t.info??(typeof a.requestAdapterInfo=="function"?await a.requestAdapterInfo():void 0);this.adapterInfo=new mp(s),this.gpuDataManager=Ic(this),this.programManager=new cm(this),this.kernels=new Map,this.kernelPersistentData=new Map,this.kernelCustomData=new Map,xa(e.logLevel,!!e.debug),this.device.onuncapturederror=o=>{o.error instanceof GPUValidationError&&console.error(`An uncaught WebGPU validation error was raised: ${o.error.message}`)},Object.defineProperty(this.env.webgpu,"device",{value:this.device,writable:!1,enumerable:!0,configurable:!0}),Object.defineProperty(this.env.webgpu,"adapter",{value:t,writable:!1,enumerable:!0,configurable:!1}),this.setQueryType()}dispose(){typeof this.querySet<"u"&&this.querySet.destroy(),this.gpuDataManager.dispose(),this.device&&this.env?.webgpu&&this.device.lost.then(()=>{delete this.env.webgpu.device})}getCommandEncoder(){return this.commandEncoder||(this.commandEncoder=this.device.createCommandEncoder()),this.commandEncoder}getComputePassEncoder(){if(!this.computePassEncoder){let e=this.getCommandEncoder(),t={};this.queryType==="at-passes"&&(t.timestampWrites={querySet:this.querySet,beginningOfPassWriteIndex:this.pendingDispatchNumber*2,endOfPassWriteIndex:this.pendingDispatchNumber*2+1}),this.computePassEncoder=e.beginComputePass(t)}return this.computePassEncoder}endComputePass(){this.computePassEncoder&&(this.computePassEncoder.end(),this.computePassEncoder=null)}flush(){if(!this.commandEncoder)return;dt(),this.endComputePass();let e;this.queryType!=="none"&&(this.commandEncoder.resolveQuerySet(this.querySet,0,this.pendingDispatchNumber*2,this.queryResolveBuffer,0),e=this.device.createBuffer({size:this.pendingDispatchNumber*2*8,usage:GPUBufferUsage.MAP_READ|GPUBufferUsage.COPY_DST}),this.pendingQueries.set(e,this.pendingKernels),this.pendingKernels=[],this.commandEncoder.copyBufferToBuffer(this.queryResolveBuffer,0,e,0,this.pendingDispatchNumber*2*8)),this.device.queue.submit([this.commandEncoder.finish()]),this.gpuDataManager.refreshPendingBuffers(),this.commandEncoder=null,this.pendingDispatchNumber=0,this.queryType!=="none"&&e.mapAsync(GPUMapMode.READ).then(()=>{let t=new BigUint64Array(e.getMappedRange()),r=this.pendingQueries.get(e);for(let i=0;i<t.length/2;i++){let n=r[i],a=n.kernelId,s=this.kernels.get(a),o=s.kernelType,l=s.kernelName,d=n.programName,p=n.inputTensorViews,h=n.outputTensorViews,f=t[i*2],y=t[i*2+1];typeof this.queryTimeBase>"u"&&(this.queryTimeBase=f);let m=Number(f-this.queryTimeBase),b=Number(y-this.queryTimeBase);if(!Number.isSafeInteger(m)||!Number.isSafeInteger(b))throw new RangeError("incorrect timestamp range");if(this.env.webgpu.profiling?.ondata)this.env.webgpu.profiling.ondata({version:1,inputsMetadata:p.map(x=>({dims:x.dims,dataType:ft(x.dataType)})),outputsMetadata:h.map(x=>({dims:x.dims,dataType:ft(x.dataType)})),kernelId:a,kernelType:o,kernelName:l,programName:d,startTime:m,endTime:b});else{let x="";p.forEach((w,S)=>{x+=`input[${S}]: [${w.dims}] | ${ft(w.dataType)}, `});let $="";h.forEach((w,S)=>{$+=`output[${S}]: [${w.dims}] | ${ft(w.dataType)}, `}),console.log(`[profiling] kernel "${a}|${o}|${l}|${d}" ${x}${$}start time: ${m} ns, execution time: ${b-m} ns`)}si("GPU",`${d}::${f}::${y}`)}e.unmap(),this.pendingQueries.delete(e)}),it()}run(e,t,r,i,n,a){dt(e.name);let s=[];for(let w=0;w<t.length;++w){let S=t[w].data;if(S===0)continue;let v=this.gpuDataManager.get(S);if(!v)throw new Error(`no GPU data for input: ${S}`);s.push(v)}let{outputs:o,dispatchGroup:l,programUniforms:d}=e.getRunData(t),p=r.length===0?o.map((w,S)=>S):r;if(p.length!==o.length)throw new Error(`Output size ${p.length} must be equal to ${o.length}.`);let h=[],f=[];for(let w=0;w<o.length;++w){if(!Number.isInteger(p[w])||p[w]<-3||p[w]>=a)throw new Error(`Invalid output index: ${p[w]}`);if(p[w]===-3)continue;let S=p[w]===-1,v=p[w]===-2,I=S||v?n(o[w].dataType,o[w].dims):i(p[w],o[w].dataType,o[w].dims);if(h.push(I),I.data===0)continue;let C=this.gpuDataManager.get(I.data);if(!C)throw new Error(`no GPU data for output: ${I.data}`);if(S&&this.temporaryData.push(C),v){let z=this.kernelPersistentData.get(this.currentKernelId);z||(z=[],this.kernelPersistentData.set(this.currentKernelId,z)),z.push(C)}f.push(C)}if(s.length!==t.length||f.length!==h.length){if(f.length===0)return it(e.name),h;throw new Error(`Program ${e.name} has zero-sized tensor(s) in inputs or outputs. This is not supported now.`)}let y;if(d){let w=0,S=[];d.forEach(z=>{let k=typeof z.data=="number"?[z.data]:z.data;if(k.length===0)return;let N=z.type===10?2:4,B,H;z.type===10?(H=k.length>4?16:k.length>2?8:k.length*N,B=k.length>4?16:N*k.length):(H=k.length<=2?k.length*N:16,B=16),w=Math.ceil(w/H)*H,S.push(w);let q=z.type===10?8:4;w+=k.length>4?Math.ceil(k.length/q)*B:k.length*N});let v=16;w=Math.ceil(w/v)*v;let I=new ArrayBuffer(w);d.forEach((z,k)=>{let N=S[k],B=typeof z.data=="number"?[z.data]:z.data;if(z.type===6)new Int32Array(I,N,B.length).set(B);else if(z.type===12)new Uint32Array(I,N,B.length).set(B);else if(z.type===10)new Uint16Array(I,N,B.length).set(B);else if(z.type===1)new Float32Array(I,N,B.length).set(B);else throw new Error(`Unsupported uniform type: ${ft(z.type)}`)});let C=this.gpuDataManager.create(w,GPUBufferUsage.COPY_DST|GPUBufferUsage.UNIFORM);this.device.queue.writeBuffer(C.buffer,0,I,0,w),this.gpuDataManager.release(C.id),y={offset:0,size:w,buffer:C.buffer}}let m=this.programManager.normalizeDispatchGroupSize(l),b=m[1]===1&&m[2]===1,x=fp(e,t,b),$=this.programManager.getArtifact(x);if($||($=this.programManager.build(e,m),this.programManager.setArtifact(x,$),pe("info",()=>`[artifact] key: ${x}, programName: ${e.name}`)),d&&$.uniformVariablesInfo){if(d.length!==$.uniformVariablesInfo.length)throw new Error(`Uniform variables count mismatch: expect ${$.uniformVariablesInfo.length}, got ${d.length} in program "${$.programInfo.name}".`);for(let w=0;w<d.length;w++){let S=d[w],v=S.type,I=typeof S.data=="number"?1:S.data.length,[C,z]=$.uniformVariablesInfo[w];if(v!==C||I!==z)throw new Error(`Uniform variable ${w} mismatch: expect type ${C} with size ${z}, got type ${v} with size ${I} in program "${$.programInfo.name}".`)}}if(pe("info",()=>`[ProgramManager] run "${e.name}" (key=${x}) with ${m[0]}x${m[1]}x${m[2]}`),this.queryType!=="none"||this.sessionStatus==="capturing"){let w={kernelId:this.currentKernelId,programName:$.programInfo.name,inputTensorViews:t,outputTensorViews:h};this.pendingKernels.push(w),this.sessionStatus==="capturing"&&this.capturedPendingKernels.get(this.currentSessionId).push(w)}return this.programManager.run($,s,f,m,y),it(e.name),h}upload(e,t){this.gpuDataManager.upload(e,t)}memcpy(e,t){this.gpuDataManager.memcpy(e,t)}async download(e,t){await this.gpuDataManager.download(e,t)}alloc(e){return this.gpuDataManager.create(e).id}free(e){return this.gpuDataManager.release(e)}createKernel(e,t,r,i){let n=pm.get(e);if(!n)throw new Error(`kernel not implemented: ${e}`);let a={kernelType:e,kernelName:i,kernelEntry:n[0],attributes:[n[1],r]};this.kernels.set(t,a)}releaseKernel(e){let t=this.kernelPersistentData.get(e);if(t){for(let r of t)this.gpuDataManager.release(r.id);this.kernelPersistentData.delete(e)}this.kernelCustomData.delete(e),this.kernels.delete(e)}computeKernel(e,t,r){let i=this.kernels.get(e);if(!i)throw new Error(`kernel not created: ${e}`);let n=i.kernelType,a=i.kernelName,s=i.kernelEntry,o=i.attributes;if(this.currentKernelId!==null)throw new Error(`kernel "[${n}] ${a}" is not allowed to be called recursively`);this.currentKernelId=e,o[0]&&(o[1]=o[0](o[1]),o[0]=void 0),pe("info",()=>`[WebGPU] Start to run kernel "[${n}] ${a}"...`);let l=this.env.debug;this.temporaryData=[];try{return l&&this.device.pushErrorScope("validation"),s(t,o[1]),0}catch(d){return r.push(Promise.resolve(`[WebGPU] Kernel "[${n}] ${a}" failed. ${d}`)),1}finally{l&&r.push(this.device.popErrorScope().then(d=>d?`GPU validation error for kernel "[${n}] ${a}": ${d.message}`:null));for(let d of this.temporaryData)this.gpuDataManager.release(d.id);this.temporaryData=[],this.currentKernelId=null}}registerBuffer(e,t,r,i){let n=this.sessionExternalDataMapping.get(e);n||(n=new Map,this.sessionExternalDataMapping.set(e,n));let a=n.get(t),s=this.gpuDataManager.registerExternalBuffer(r,i,a);return n.set(t,[s,r]),s}unregisterBuffers(e){let t=this.sessionExternalDataMapping.get(e);t&&(t.forEach(r=>this.gpuDataManager.unregisterExternalBuffer(r[0])),this.sessionExternalDataMapping.delete(e))}getBuffer(e){let t=this.gpuDataManager.get(e);if(!t)throw new Error(`no GPU data for buffer: ${e}`);return t.buffer}createDownloader(e,t,r){return async()=>{let i=await Zn(this,e,t);return Sa(i.buffer,r)}}writeTimestamp(e){this.queryType==="inside-passes"&&this.computePassEncoder.writeTimestamp(this.querySet,e)}setQueryType(){this.queryType="none",(this.env.webgpu.profiling?.mode==="default"||(typeof this.env.trace>"u"?this.env.wasm.trace:this.env.trace))&&(this.device.features.has("chromium-experimental-timestamp-query-inside-passes")?this.queryType="inside-passes":this.device.features.has("timestamp-query")&&(this.queryType="at-passes"),this.queryType!=="none"&&typeof this.querySet>"u"&&(this.querySet=this.device.createQuerySet({type:"timestamp",count:this.maxDispatchNumber*2}),this.queryResolveBuffer=this.device.createBuffer({size:this.maxDispatchNumber*2*8,usage:GPUBufferUsage.COPY_SRC|GPUBufferUsage.QUERY_RESOLVE})))}captureBegin(){pe("info","captureBegin"),this.capturedCommandList.get(this.currentSessionId)||this.capturedCommandList.set(this.currentSessionId,[]),this.capturedPendingKernels.get(this.currentSessionId)||this.capturedPendingKernels.set(this.currentSessionId,[]),this.flush(),this.sessionStatus="capturing"}captureEnd(){pe("info","captureEnd"),this.flush(),this.sessionStatus="default"}replay(){pe("info","replay"),this.sessionStatus="replaying";let e=this.capturedCommandList.get(this.currentSessionId),t=this.capturedPendingKernels.get(this.currentSessionId),r=e.length;this.pendingKernels=[];for(let i=0;i<r;i++){let n=this.getComputePassEncoder(),a=e[i];this.writeTimestamp(this.pendingDispatchNumber*2),n.setPipeline(a.computePipeline),n.setBindGroup(0,a.bindGroup),n.dispatchWorkgroups(...a.dispatchGroup),this.writeTimestamp(this.pendingDispatchNumber*2+1),this.pendingDispatchNumber++,this.queryType!=="none"&&this.pendingKernels.push(t[i]),(this.pendingDispatchNumber>=this.maxDispatchNumber||this.queryType==="at-passes")&&this.endComputePass(),this.pendingDispatchNumber>=this.maxDispatchNumber&&this.flush()}this.flush(),this.sessionStatus="default"}onCreateSession(){this.gpuDataManager.onCreateSession()}onReleaseSession(e){this.unregisterBuffers(e),this.capturedCommandList.has(e)&&this.capturedCommandList.delete(e),this.capturedPendingKernels.has(e)&&this.capturedPendingKernels.delete(e),this.gpuDataManager.onReleaseSession(e)}onRunStart(e){this.currentSessionId=e,this.setQueryType()}}}),mm={};ir(mm,{init:()=>gm});var Zr,gp,gm,E_=W(()=>{ie(),mt(),ne(),By(),Zr=class ym{constructor(t,r,i,n){this.module=t,this.dataType=r,this.data=i,this.dims=n}getFloat32Array(){if(this.dataType!==1)throw new Error("Invalid data type");let t=R.size(this.dims);return t===0?new Float32Array:new Float32Array(this.module.HEAP8.buffer,this.data,t)}getBigInt64Array(){if(this.dataType!==7)throw new Error("Invalid data type");let t=R.size(this.dims);return t===0?new BigInt64Array:new BigInt64Array(this.module.HEAP8.buffer,this.data,t)}getInt32Array(){if(this.dataType!==6)throw new Error("Invalid data type");let t=R.size(this.dims);return t===0?new Int32Array:new Int32Array(this.module.HEAP8.buffer,this.data,t)}getUint16Array(){if(this.dataType!==10&&this.dataType!==4)throw new Error("Invalid data type");let t=R.size(this.dims);return t===0?new Uint16Array:new Uint16Array(this.module.HEAP8.buffer,this.data,t)}reshape(t){if(R.size(t)!==R.size(this.dims))throw new Error("Invalid new shape");return new ym(this.module,this.dataType,this.data,t)}},gp=class{constructor(e,t,r){this.module=e,this.backend=t,this.customDataOffset=0,this.customDataSize=0,this.adapterInfo=t.adapterInfo;let i=e.PTR_SIZE,n=r/e.PTR_SIZE,a=i===4?"i32":"i64";this.opKernelContext=Number(e.getValue(i*n++,a));let s=Number(e.getValue(i*n++,a));this.outputCount=Number(e.getValue(i*n++,a)),this.customDataOffset=Number(e.getValue(i*n++,"*")),this.customDataSize=Number(e.getValue(i*n++,a));let o=[];for(let l=0;l<s;l++){let d=Number(e.getValue(i*n++,a)),p=Number(e.getValue(i*n++,"*")),h=Number(e.getValue(i*n++,a)),f=[];for(let y=0;y<h;y++)f.push(Number(e.getValue(i*n++,a)));o.push(new Zr(e,d,p,f))}this.inputs=o}get kernelCustomData(){return this.backend.currentKernelCustomData}get customDataBuffer(){return this.module.HEAPU8.subarray(this.customDataOffset,this.customDataOffset+this.customDataSize)}compute(e,t){let r=t?.inputs?.map(s=>typeof s=="number"?this.inputs[s]:s)??this.inputs,i=t?.outputs??[],n=(s,o,l)=>new Zr(this.module,o,this.output(s,l),l),a=(s,o)=>{let l=Dt(s,o);if(!l)throw new Error(`Unsupported data type: ${s}`);let d=l>0?this.backend.gpuDataManager.create(l).id:0;return new Zr(this.module,s,d,o)};return this.backend.run(e,r,i,n,a,this.outputCount)}output(e,t){let r=this.module.stackSave();try{let i=this.module.PTR_SIZE,n=i===4?"i32":"i64",a=this.module.stackAlloc((1+t.length)*i);this.module.setValue(a,t.length,n);for(let s=0;s<t.length;s++)this.module.setValue(a+i*(s+1),t[s],n);return this.module._JsepOutput(this.opKernelContext,e,a)}catch(i){throw new Error(`Failed to generate kernel's output[${e}] with dims [${t}]. If you are running with pre-allocated output, please make sure the output type/dims are correct. Error: ${i}`)}finally{this.module.stackRestore(r)}}},gm=async(e,t,r,i)=>{let n=t.jsepInit;if(!n)throw new Error("Failed to initialize JSEP. The WebAssembly module is not built with JSEP support.");if(e==="webgpu"){let a=(I_(),Sr(hm)).WebGpuBackend,s=new a;await s.initialize(r,i),n("webgpu",[s,o=>s.alloc(Number(o)),o=>s.free(o),(o,l,d,p=!1)=>{if(p)pe("verbose",()=>`[WebGPU] jsepCopyGpuToGpu: src=${Number(o)}, dst=${Number(l)}, size=${Number(d)}`),s.memcpy(Number(o),Number(l));else{pe("verbose",()=>`[WebGPU] jsepCopyCpuToGpu: dataOffset=${Number(o)}, gpuDataId=${Number(l)}, size=${Number(d)}`);let h=t.HEAPU8.subarray(Number(o>>>0),Number(o>>>0)+Number(d));s.upload(Number(l),h)}},async(o,l,d)=>{pe("verbose",()=>`[WebGPU] jsepCopyGpuToCpu: gpuDataId=${o}, dataOffset=${l}, size=${d}`),await s.download(Number(o),()=>t.HEAPU8.subarray(Number(l)>>>0,Number(l+d)>>>0))},(o,l,d)=>s.createKernel(o,Number(l),d,t.UTF8ToString(t._JsepGetNodeName(Number(l)))),o=>s.releaseKernel(o),(o,l,d,p)=>{pe("verbose",()=>`[WebGPU] jsepRun: sessionHandle=${d}, kernel=${o}, contextDataOffset=${l}`);let h=new gp(t,s,Number(l));return s.computeKernel(Number(o),h,p)},()=>s.captureBegin(),()=>s.captureEnd(),()=>s.replay()])}else{let a=new Tc(r);n("webnn",[a,()=>a.reserveTensorId(),s=>a.releaseTensorId(s),async(s,o,l,d,p)=>a.ensureTensor(s,o,l,d,p),(s,o)=>{a.uploadTensor(s,o)},async(s,o)=>a.downloadTensor(s,o),(s,o)=>a.registerMLContext(s,o),!!r.trace])}}}),yp,Na,Ba,vt,_p,Bn,hi,Da,Pa,Dn,Ua,La,qa,_m=W(()=>{Ke(),Oy(),Ry(),ie(),Vt(),ba(),wc(),yp=(e,t)=>{ve()._OrtInit(e,t)!==0&&ge("Can't initialize onnxruntime.")},Na=async e=>{yp(e.wasm.numThreads,ui(e.logLevel))},Ba=async(e,t)=>{ve().asyncInit?.();let r=e.webgpu.adapter;if(t==="webgpu"){if(typeof navigator>"u"||!navigator.gpu)throw new Error("WebGPU is not supported in current environment");if(r){if(typeof r.limits!="object"||typeof r.features!="object"||typeof r.requestDevice!="function")throw new Error("Invalid GPU adapter set in `env.webgpu.adapter`. It must be a GPUAdapter object.")}else{let i=e.webgpu.powerPreference;if(i!==void 0&&i!=="low-power"&&i!=="high-performance")throw new Error(`Invalid powerPreference setting: "${i}"`);let n=e.webgpu.forceFallbackAdapter;if(n!==void 0&&typeof n!="boolean")throw new Error(`Invalid forceFallbackAdapter setting: "${n}"`);if(r=await navigator.gpu.requestAdapter({powerPreference:i,forceFallbackAdapter:n}),!r)throw new Error('Failed to get GPU adapter. You may need to enable flag "--enable-unsafe-webgpu" if you are using Chrome.')}}if(t==="webnn"&&(typeof navigator>"u"||!navigator.ml))throw new Error("WebNN is not supported in current environment");{let i=(E_(),Sr(mm)).init;t==="webgpu"&&await i("webgpu",ve(),e,r),t==="webnn"&&await i("webnn",ve(),e)}},vt=new Map,_p=e=>{let t=ve(),r=t.stackSave();try{let i=t.PTR_SIZE,n=t.stackAlloc(2*i);t._OrtGetInputOutputCount(e,n,n+i)!==0&&ge("Can't get session input/output count.");let a=i===4?"i32":"i64";return[Number(t.getValue(n,a)),Number(t.getValue(n+i,a))]}finally{t.stackRestore(r)}},Bn=(e,t)=>{let r=ve(),i=r.stackSave(),n=0;try{let a=r.PTR_SIZE,s=r.stackAlloc(2*a);r._OrtGetInputOutputMetadata(e,t,s,s+a)!==0&&ge("Can't get session input/output metadata.");let o=Number(r.getValue(s,"*"));n=Number(r.getValue(s+a,"*"));let l=r.HEAP32[n/4];if(l===0)return[o,0];let d=r.HEAPU32[n/4+1],p=[];for(let h=0;h<d;h++){let f=Number(r.getValue(n+8+h*a,"*"));p.push(f!==0?r.UTF8ToString(f):Number(r.getValue(n+8+(h+d)*a,"*")))}return[o,l,p]}finally{r.stackRestore(i),n!==0&&r._OrtFree(n)}},hi=e=>{let t=ve(),r=t._malloc(e.byteLength);if(r===0)throw new Error(`Can't create a session. failed to allocate a buffer of size ${e.byteLength}.`);return t.HEAPU8.set(e,r),[r,e.byteLength]},Da=async(e,t)=>{let r,i,n=ve();Array.isArray(e)?[r,i]=e:e.buffer===n.HEAPU8.buffer?[r,i]=[e.byteOffset,e.byteLength]:[r,i]=hi(e);let a=0,s=0,o=0,l=[],d=[],p=[];try{if([s,l]=await bc(t),t?.externalData&&n.mountExternalData){let v=[];for(let I of t.externalData){let C=typeof I=="string"?I:I.path;v.push(va(typeof I=="string"?I:I.data).then(z=>{n.mountExternalData(C,z)}))}await Promise.all(v)}for(let v of t?.executionProviders??[])if((typeof v=="string"?v:v.name)==="webnn"){if(n.shouldTransferToMLTensor=!1,typeof v!="string"){let I=v,C=I?.context,z=I?.gpuDevice,k=I?.deviceType,N=I?.powerPreference;C?n.currentContext=C:z?n.currentContext=await n.webnnCreateMLContext(z):n.currentContext=await n.webnnCreateMLContext({deviceType:k,powerPreference:N})}else n.currentContext=await n.webnnCreateMLContext();break}a=await n._OrtCreateSession(r,i,s),n.webgpuOnCreateSession?.(a),a===0&&ge("Can't create a session."),n.jsepOnCreateSession?.(),n.currentContext&&(n.webnnRegisterMLContext(a,n.currentContext),n.currentContext=void 0,n.shouldTransferToMLTensor=!0);let[h,f]=_p(a),y=!!t?.enableGraphCapture,m=[],b=[],x=[],$=[],w=[];for(let v=0;v<h;v++){let[I,C,z]=Bn(a,v);I===0&&ge("Can't get an input name."),d.push(I);let k=n.UTF8ToString(I);m.push(k),x.push(C===0?{name:k,isTensor:!1}:{name:k,isTensor:!0,type:ft(C),shape:z})}for(let v=0;v<f;v++){let[I,C,z]=Bn(a,v+h);I===0&&ge("Can't get an output name."),p.push(I);let k=n.UTF8ToString(I);b.push(k),$.push(C===0?{name:k,isTensor:!1}:{name:k,isTensor:!0,type:ft(C),shape:z});{if(y&&t?.preferredOutputLocation===void 0){w.push("gpu-buffer");continue}let N=typeof t?.preferredOutputLocation=="string"?t.preferredOutputLocation:t?.preferredOutputLocation?.[k]??"cpu",B=n.webnnIsGraphOutput;if(N==="cpu"&&B&&B(a,k)){w.push("ml-tensor-cpu-output");continue}if(N!=="cpu"&&N!=="cpu-pinned"&&N!=="gpu-buffer"&&N!=="ml-tensor")throw new Error(`Not supported preferred output location: ${N}.`);if(y&&N!=="gpu-buffer")throw new Error(`Not supported preferred output location: ${N}. Only 'gpu-buffer' location is supported when enableGraphCapture is true.`);w.push(N)}}let S=null;return w.some(v=>v==="gpu-buffer"||v==="ml-tensor"||v==="ml-tensor-cpu-output")&&(o=n._OrtCreateBinding(a),o===0&&ge("Can't create IO binding."),S={handle:o,outputPreferredLocations:w,outputPreferredLocationsEncoded:w.map(v=>v==="ml-tensor-cpu-output"?"ml-tensor":v).map(v=>Kn(v))}),vt.set(a,[a,d,p,S,y,!1]),[a,m,b,x,$]}catch(h){throw d.forEach(f=>n._OrtFree(f)),p.forEach(f=>n._OrtFree(f)),o!==0&&n._OrtReleaseBinding(o)!==0&&ge("Can't release IO binding."),a!==0&&n._OrtReleaseSession(a)!==0&&ge("Can't release session."),h}finally{n._free(r),s!==0&&n._OrtReleaseSessionOptions(s)!==0&&ge("Can't release session options."),l.forEach(h=>n._free(h)),n.unmountExternalData?.()}},Pa=e=>{let t=ve(),r=vt.get(e);if(!r)throw new Error(`cannot release session. invalid session id: ${e}`);let[i,n,a,s,o]=r;s&&(o&&t._OrtClearBoundOutputs(s.handle)!==0&&ge("Can't clear bound outputs."),t._OrtReleaseBinding(s.handle)!==0&&ge("Can't release IO binding.")),t.jsepOnReleaseSession?.(e),t.webnnOnReleaseSession?.(e),t.webgpuOnReleaseSession?.(e),n.forEach(l=>t._OrtFree(l)),a.forEach(l=>t._OrtFree(l)),t._OrtReleaseSession(i)!==0&&ge("Can't release session."),vt.delete(e)},Dn=async(e,t,r,i,n,a,s=!1)=>{if(!e){t.push(0);return}let o=ve(),l=o.PTR_SIZE,d=e[0],p=e[1],h=e[3],f=h,y,m;if(d==="string"&&(h==="gpu-buffer"||h==="ml-tensor"))throw new Error("String tensor is not supported on GPU.");if(s&&h!=="gpu-buffer")throw new Error(`External buffer must be provided for input/output index ${a} when enableGraphCapture is true.`);if(h==="gpu-buffer"){let $=e[2].gpuBuffer;m=Dt(Bt(d),p);{let w=o.jsepRegisterBuffer;if(!w)throw new Error('Tensor location "gpu-buffer" is not supported without using WebGPU.');y=w(i,a,$,m)}}else if(h==="ml-tensor"){let $=e[2].mlTensor;m=Dt(Bt(d),p);let w=o.webnnRegisterMLTensor;if(!w)throw new Error('Tensor location "ml-tensor" is not supported without using WebNN.');y=w(i,$,Bt(d),p)}else{let $=e[2];if(Array.isArray($)){m=l*$.length,y=o._malloc(m),r.push(y);for(let w=0;w<$.length;w++){if(typeof $[w]!="string")throw new TypeError(`tensor data at index ${w} is not a string`);o.setValue(y+w*l,tt($[w],r),"*")}}else{let w=o.webnnIsGraphInput,S=o.webnnIsGraphOutput;if(d!=="string"&&w&&S){let v=o.UTF8ToString(n);if(w(i,v)||S(i,v)){let I=Bt(d);m=Dt(I,p),f="ml-tensor";let C=o.webnnCreateTemporaryTensor,z=o.webnnUploadTensor;if(!C||!z)throw new Error('Tensor location "ml-tensor" is not supported without using WebNN.');let k=await C(i,I,p);z(k,new Uint8Array($.buffer,$.byteOffset,$.byteLength)),y=k}else m=$.byteLength,y=o._malloc(m),r.push(y),o.HEAPU8.set(new Uint8Array($.buffer,$.byteOffset,m),y)}else m=$.byteLength,y=o._malloc(m),r.push(y),o.HEAPU8.set(new Uint8Array($.buffer,$.byteOffset,m),y)}}let b=o.stackSave(),x=o.stackAlloc(4*p.length);try{p.forEach((w,S)=>o.setValue(x+S*l,w,l===4?"i32":"i64"));let $=o._OrtCreateTensor(Bt(d),y,m,x,p.length,Kn(f));$===0&&ge(`Can't create tensor for input/output. session=${i}, index=${a}.`),t.push($)}finally{o.stackRestore(b)}},Ua=async(e,t,r,i,n,a)=>{let s=ve(),o=s.PTR_SIZE,l=vt.get(e);if(!l)throw new Error(`cannot run inference. invalid session id: ${e}`);let d=l[0],p=l[1],h=l[2],f=l[3],y=l[4],m=l[5],b=t.length,x=i.length,$=0,w=[],S=[],v=[],I=[],C=[],z=s.stackSave(),k=s.stackAlloc(b*o),N=s.stackAlloc(b*o),B=s.stackAlloc(x*o),H=s.stackAlloc(x*o);try{[$,w]=_c(a),Ut("wasm prepareInputOutputTensor");for(let P=0;P<b;P++)await Dn(r[P],S,I,e,p[t[P]],t[P],y);for(let P=0;P<x;P++)await Dn(n[P],v,I,e,h[i[P]],b+i[P],y);Lt("wasm prepareInputOutputTensor");for(let P=0;P<b;P++)s.setValue(k+P*o,S[P],"*"),s.setValue(N+P*o,p[t[P]],"*");for(let P=0;P<x;P++)s.setValue(B+P*o,v[P],"*"),s.setValue(H+P*o,h[i[P]],"*");if(f&&!m){let{handle:P,outputPreferredLocations:G,outputPreferredLocationsEncoded:Y}=f;if(p.length!==b)throw new Error(`input count from feeds (${b}) is expected to be always equal to model's input count (${p.length}).`);Ut("wasm bindInputsOutputs");for(let L=0;L<b;L++){let F=t[L];await s._OrtBindInput(P,p[F],S[L])!==0&&ge(`Can't bind input[${L}] for session=${e}.`)}for(let L=0;L<x;L++){let F=i[L];n[L]?.[3]?(C.push(v[L]),s._OrtBindOutput(P,h[F],v[L],0)!==0&&ge(`Can't bind pre-allocated output[${L}] for session=${e}.`)):s._OrtBindOutput(P,h[F],0,Y[F])!==0&&ge(`Can't bind output[${L}] to ${G[L]} for session=${e}.`)}Lt("wasm bindInputsOutputs"),vt.set(e,[d,p,h,f,y,!0])}s.jsepOnRunStart?.(d),s.webnnOnRunStart?.(d);let q;f?q=await s._OrtRunWithBinding(d,f.handle,x,B,$):q=await s._OrtRun(d,N,k,b,H,x,B,$),q!==0&&ge("failed to call OrtRun().");let V=[],O=[];Ut("wasm ProcessOutputTensor");for(let P=0;P<x;P++){let G=Number(s.getValue(B+P*o,"*"));if(G===v[P]||C.includes(v[P])){V.push(n[P]),G!==v[P]&&s._OrtReleaseTensor(G)!==0&&ge("Can't release tensor.");continue}let Y=s.stackSave(),L=s.stackAlloc(4*o),F=!1,ee,A=0;try{s._OrtGetTensorData(G,L,L+o,L+2*o,L+3*o)!==0&&ge(`Can't access output tensor data on index ${P}.`);let K=o===4?"i32":"i64",Z=Number(s.getValue(L,K));A=s.getValue(L+o,"*");let X=s.getValue(L+o*2,"*"),ye=Number(s.getValue(L+o*3,K)),Ee=[];for(let ce=0;ce<ye;ce++)Ee.push(Number(s.getValue(X+ce*o,K)));s._OrtFree(X)!==0&&ge("Can't free memory for tensor dims.");let be=Ee.reduce((ce,we)=>ce*we,1);ee=ft(Z);let Te=f?.outputPreferredLocations[i[P]];if(ee==="string"){if(Te==="gpu-buffer"||Te==="ml-tensor")throw new Error("String tensor is not supported on GPU.");let ce=[];for(let we=0;we<be;we++){let De=s.getValue(A+we*o,"*"),Tr=s.getValue(A+(we+1)*o,"*"),nt=we===be-1?void 0:Tr-De;ce.push(s.UTF8ToString(De,nt))}V.push([ee,Ee,ce,"cpu"])}else if(Te==="gpu-buffer"&&be>0){let ce=s.jsepGetBuffer;if(!ce)throw new Error('preferredLocation "gpu-buffer" is not supported without using WebGPU.');let we=ce(A),De=Dt(Z,be);if(De===void 0||!wa(ee))throw new Error(`Unsupported data type: ${ee}`);F=!0,V.push([ee,Ee,{gpuBuffer:we,download:s.jsepCreateDownloader(we,De,ee),dispose:()=>{s._OrtReleaseTensor(G)!==0&&ge("Can't release tensor.")}},"gpu-buffer"])}else if(Te==="ml-tensor"&&be>0){let ce=s.webnnEnsureTensor,we=s.webnnIsGraphInputOutputTypeSupported;if(!ce||!we)throw new Error('preferredLocation "ml-tensor" is not supported without using WebNN.');if(Dt(Z,be)===void 0||!$a(ee))throw new Error(`Unsupported data type: ${ee}`);if(!we(e,ee,!1))throw new Error(`preferredLocation "ml-tensor" for ${ee} output is not supported by current WebNN Context.`);let De=await ce(e,A,Z,Ee,!1);F=!0,V.push([ee,Ee,{mlTensor:De,download:s.webnnCreateMLTensorDownloader(A,ee),dispose:()=>{s.webnnReleaseTensorId(A),s._OrtReleaseTensor(G)}},"ml-tensor"])}else if(Te==="ml-tensor-cpu-output"&&be>0){let ce=s.webnnCreateMLTensorDownloader(A,ee)(),we=V.length;F=!0,O.push((async()=>{let De=[we,await ce];return s.webnnReleaseTensorId(A),s._OrtReleaseTensor(G),De})()),V.push([ee,Ee,[],"cpu"])}else{let ce=mi(ee),we=new ce(be);new Uint8Array(we.buffer,we.byteOffset,we.byteLength).set(s.HEAPU8.subarray(A,A+we.byteLength)),V.push([ee,Ee,we,"cpu"])}}finally{s.stackRestore(Y),ee==="string"&&A&&s._free(A),F||s._OrtReleaseTensor(G)}}f&&!y&&(s._OrtClearBoundOutputs(f.handle)!==0&&ge("Can't clear bound outputs."),vt.set(e,[d,p,h,f,y,!1]));for(let[P,G]of await Promise.all(O))V[P][2]=G;return Lt("wasm ProcessOutputTensor"),V}finally{s.webnnOnRunEnd?.(d),s.stackRestore(z),S.forEach(q=>s._OrtReleaseTensor(q)),v.forEach(q=>s._OrtReleaseTensor(q)),I.forEach(q=>s._free(q)),$!==0&&s._OrtReleaseRunOptions($),w.forEach(q=>s._free(q))}},La=e=>{let t=ve(),r=vt.get(e);if(!r)throw new Error("invalid session id");let i=r[0],n=t._OrtEndProfiling(i);n===0&&ge("Can't get an profile file name."),t._OrtFree(n)},qa=e=>{let t=[];for(let r of e){let i=r[2];!Array.isArray(i)&&"buffer"in i&&t.push(i.buffer)}return t}}),xt,Fe,Kt,gr,yr,Yr,Pn,Qr,Mt,Ot,bp,bm,wm,$m,vm,xm,Sm,km,Tm=W(()=>{Ke(),_m(),Vt(),ya(),xt=()=>!!$e.wasm.proxy&&typeof document<"u",Kt=!1,gr=!1,yr=!1,Qr=new Map,Mt=(e,t)=>{let r=Qr.get(e);r?r.push(t):Qr.set(e,[t])},Ot=()=>{if(Kt||!gr||yr||!Fe)throw new Error("worker not ready")},bp=e=>{switch(e.data.type){case"init-wasm":Kt=!1,e.data.err?(yr=!0,Pn[1](e.data.err)):(gr=!0,Pn[0]()),Yr&&(URL.revokeObjectURL(Yr),Yr=void 0);break;case"init-ep":case"copy-from":case"create":case"release":case"run":case"end-profiling":{let t=Qr.get(e.data.type);e.data.err?t.shift()[1](e.data.err):t.shift()[0](e.data.out);break}}},bm=async()=>{if(!gr){if(Kt)throw new Error("multiple calls to 'initWasm()' detected.");if(yr)throw new Error("previous call to 'initWasm()' failed.");if(Kt=!0,xt())return new Promise((e,t)=>{Fe?.terminate(),gc().then(([r,i])=>{try{Fe=i,Fe.onerror=a=>t(a),Fe.onmessage=bp,Pn=[e,t];let n={type:"init-wasm",in:$e};!n.in.wasm.wasmPaths&&(r||jn)&&(n.in.wasm.wasmPaths={wasm:new URL("/SACHIZU-LAB1/assets/ort-wasm-simd-threaded.jsep-DC5y_g6C.wasm",import.meta.url).href}),Fe.postMessage(n),Yr=r}catch(n){t(n)}},t)});try{await _a($e.wasm),await Na($e),gr=!0}catch(e){throw yr=!0,e}finally{Kt=!1}}},wm=async e=>{if(xt())return Ot(),new Promise((t,r)=>{Mt("init-ep",[t,r]);let i={type:"init-ep",in:{epName:e,env:$e}};Fe.postMessage(i)});await Ba($e,e)},$m=async e=>xt()?(Ot(),new Promise((t,r)=>{Mt("copy-from",[t,r]);let i={type:"copy-from",in:{buffer:e}};Fe.postMessage(i,[e.buffer])})):hi(e),vm=async(e,t)=>{if(xt()){if(t?.preferredOutputLocation)throw new Error('session option "preferredOutputLocation" is not supported for proxy.');return Ot(),new Promise((r,i)=>{Mt("create",[r,i]);let n={type:"create",in:{model:e,options:{...t}}},a=[];e instanceof Uint8Array&&a.push(e.buffer),Fe.postMessage(n,a)})}else return Da(e,t)},xm=async e=>{if(xt())return Ot(),new Promise((t,r)=>{Mt("release",[t,r]);let i={type:"release",in:e};Fe.postMessage(i)});Pa(e)},Sm=async(e,t,r,i,n,a)=>{if(xt()){if(r.some(s=>s[3]!=="cpu"))throw new Error("input tensor on GPU is not supported for proxy.");if(n.some(s=>s))throw new Error("pre-allocated output tensor is not supported for proxy.");return Ot(),new Promise((s,o)=>{Mt("run",[s,o]);let l=r,d={type:"run",in:{sessionId:e,inputIndices:t,inputs:l,outputIndices:i,options:a}};Fe.postMessage(d,qa(l))})}else return Ua(e,t,r,i,n,a)},km=async e=>{if(xt())return Ot(),new Promise((t,r)=>{Mt("end-profiling",[t,r]);let i={type:"end-profiling",in:e};Fe.postMessage(i)});La(e)}}),Un,wp,Im,C_=W(()=>{Ke(),Tm(),ie(),ga(),wc(),Un=(e,t)=>{switch(e.location){case"cpu":return[e.type,e.dims,e.data,"cpu"];case"gpu-buffer":return[e.type,e.dims,{gpuBuffer:e.gpuBuffer},"gpu-buffer"];case"ml-tensor":return[e.type,e.dims,{mlTensor:e.mlTensor},"ml-tensor"];default:throw new Error(`invalid data location: ${e.location} for ${t()}`)}},wp=e=>{switch(e[3]){case"cpu":return new rt(e[0],e[2],e[1]);case"gpu-buffer":{let t=e[0];if(!wa(t))throw new Error(`not supported data type: ${t} for deserializing GPU tensor`);let{gpuBuffer:r,download:i,dispose:n}=e[2];return rt.fromGpuBuffer(r,{dataType:t,dims:e[1],download:i,dispose:n})}case"ml-tensor":{let t=e[0];if(!$a(t))throw new Error(`not supported data type: ${t} for deserializing MLTensor tensor`);let{mlTensor:r,download:i,dispose:n}=e[2];return rt.fromMLTensor(r,{dataType:t,dims:e[1],download:i,dispose:n})}default:throw new Error(`invalid data location: ${e[3]}`)}},Im=class{async fetchModelAndCopyToWasmMemory(e){return $m(await va(e))}async loadModel(e,t){dt();let r;typeof e=="string"?r=await this.fetchModelAndCopyToWasmMemory(e):r=e,[this.sessionId,this.inputNames,this.outputNames,this.inputMetadata,this.outputMetadata]=await vm(r,t),it()}async dispose(){return xm(this.sessionId)}async run(e,t,r){dt();let i=[],n=[];Object.entries(e).forEach(h=>{let f=h[0],y=h[1],m=this.inputNames.indexOf(f);if(m===-1)throw new Error(`invalid input '${f}'`);i.push(y),n.push(m)});let a=[],s=[];Object.entries(t).forEach(h=>{let f=h[0],y=h[1],m=this.outputNames.indexOf(f);if(m===-1)throw new Error(`invalid output '${f}'`);a.push(y),s.push(m)});let o=i.map((h,f)=>Un(h,()=>`input "${this.inputNames[n[f]]}"`)),l=a.map((h,f)=>h?Un(h,()=>`output "${this.outputNames[s[f]]}"`):null),d=await Sm(this.sessionId,n,o,s,l,r),p={};for(let h=0;h<d.length;h++)p[this.outputNames[s[h]]]=a[h]??wp(d[h]);return it(),p}startProfiling(){}endProfiling(){km(this.sessionId)}}}),Em={};ir(Em,{OnnxruntimeWebAssemblyBackend:()=>ua,initializeFlags:()=>oa,wasmBackend:()=>Cm});var oa,ua,Cm,z_=W(()=>{Ke(),Tm(),C_(),oa=()=>{(typeof $e.wasm.initTimeout!="number"||$e.wasm.initTimeout<0)&&($e.wasm.initTimeout=0);let e=$e.wasm.simd;if(typeof e!="boolean"&&e!==void 0&&e!=="fixed"&&e!=="relaxed"&&(console.warn(`Property "env.wasm.simd" is set to unknown value "${e}". Reset it to \`false\` and ignore SIMD feature checking.`),$e.wasm.simd=!1),typeof $e.wasm.proxy!="boolean"&&($e.wasm.proxy=!1),typeof $e.wasm.trace!="boolean"&&($e.wasm.trace=!1),typeof $e.wasm.numThreads!="number"||!Number.isInteger($e.wasm.numThreads)||$e.wasm.numThreads<=0)if(typeof self<"u"&&!self.crossOriginIsolated)$e.wasm.numThreads=1;else{let t=typeof navigator>"u"?my("node:os").cpus().length:navigator.hardwareConcurrency;$e.wasm.numThreads=Math.min(4,Math.ceil((t||1)/2))}},ua=class{async init(e){oa(),await bm(),await wm(e)}async createInferenceSessionHandler(e,t){let r=new Im;return await r.loadModel(e,t),r}},Cm=new ua});Ke();Ke();Ke();var A_="1.27.0";{let e=(z_(),Sr(Em)).wasmBackend;Yt("webgpu",e,5),Yt("webnn",e,5),Yt("cpu",e,10),Yt("wasm",e,10)}Object.defineProperty($e.versions,"web",{value:A_,enumerable:!0});const M_="rtmpose-m-halpe26-256x192.onnx",O_="26f3a19e61304a600dfb82d1001d41d24343b89fc70a33ffc84657e0b0bf2ecf",R_=new URL("/SACHIZU-LAB1/assets/ort-wasm-simd-threaded.jsep-DC5y_g6C.wasm",import.meta.url).href,qe=192,He=256,N_=[123.675,116.28,103.53],B_=[58.395,57.12,57.375],$p={0:0,11:5,12:6,13:7,14:8,15:9,16:10,23:11,24:12,25:13,26:14,27:15,28:16,29:24,30:25,31:20,32:21};function D_(e,t,r){const i=e.filter(f=>Number.isFinite(f.x)&&Number.isFinite(f.y)&&(f.visibility??1)>=.3);if(i.length<5)return null;const n=i.map(f=>f.x*t),a=i.map(f=>f.y*r),s=Math.min(...n),o=Math.max(...n),l=Math.min(...a),d=Math.max(...a);let p=Math.max(1,(o-s)*1.25),h=Math.max(1,(d-l)*1.25);return p/h>qe/He?h=p*He/qe:p=h*qe/He,{cx:(s+o)/2,cy:(l+d)/2,scale:p/qe}}function P_(e,t,r,i,n){const s=e.length/26,o=t.length/26,l=[];for(let d=0;d<26;d++){let p=0,h=0;for(let f=1;f<s;f++)e[d*s+f]>e[d*s+p]&&(p=f);for(let f=1;f<o;f++)t[d*o+f]>t[d*o+h]&&(h=f);l.push({x:(r.cx+(p/2-qe/2)*r.scale)/i,y:(r.cy+(h/2-He/2)*r.scale)/n,visibility:Math.min(e[d*s+p],t[d*o+h])})}return Array.from({length:33},(d,p)=>p in $p?{...l[$p[p]]}:{...l[0],visibility:0})}let Ln=null;function U_(e,t){return Ln??=L_(e,t).catch(r=>{throw Ln=null,r}),Ln}async function L_(e,t){const r=await Z0(`/SACHIZU-LAB1/models/rtmpose/${M_}`,e,h=>t(h.replace("姿勢モデル","高精度の骨格モデル")));if(Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",r)),h=>h.toString(16).padStart(2,"0")).join("")!==O_)throw new Error("高精度の骨格モデルのファイルが正しくありません。");t("高精度の骨格モデルを準備しています…"),$e.wasm.wasmPaths={wasm:R_},$e.wasm.numThreads=1;let n=null,a="wasm";const s=typeof navigator<"u"&&!!navigator.gpu;for(const h of s?["webgpu","wasm"]:["wasm"])try{n=await ma.create(r,{executionProviders:[h],graphOptimizationLevel:"all"}),a=h;break}catch{}if(!n)throw new Error("高精度の骨格モデルを開始できませんでした。");const o=n,l=document.createElement("canvas");l.width=qe,l.height=He;const d=l.getContext("2d",{willReadFrequently:!0});if(!d)throw new Error("映像処理を開始できません。");const p=new Float32Array(3*qe*He);return{backend:a,async refine(h,f){const y=h.width,m=h.height,b=D_(f,y,m);if(!b)return null;const x=b.cx-qe/2*b.scale,$=b.cy-He/2*b.scale,w=Math.max(0,x),S=Math.max(0,$),v=Math.min(y,x+qe*b.scale),I=Math.min(m,$+He*b.scale);d.clearRect(0,0,qe,He),v>w&&I>S&&d.drawImage(h,w,S,v-w,I-S,(w-x)/b.scale,(S-$)/b.scale,(v-w)/b.scale,(I-S)/b.scale);const C=d.getImageData(0,0,qe,He).data,z=qe*He;for(let N=0;N<z;N++)for(let B=0;B<3;B++)p[B*z+N]=(C[4*N+B]-N_[B])/B_[B];const k=await o.run({input:new rt("float32",p,[1,3,He,qe])});return P_(k.simcc_x.data,k.simcc_y.data,b,y,m)}}}const Se=1e-9,vp=.2,q_=.1,lt=.2,xp=.1,Jr=1.5,Sp=.03,W_=1,Xt=.06,qn=.15,kp=.05,G_=.08,ei=3,V_=.06,F_=6,H_=.25,la=2.5,Wn=.03,Tp=1.2,j_=.1,Ip=2.5,K_=4.5,X_=4.5,Z_=2.5,Y_=[11,12,23,24,25,26,27,28],Q_=.012,J_=.02,Ep=.05,eb=.015,tb=.5,Cp=.01,rb=(e,t)=>Y_.every(r=>!e[r]||e[r].x>t[0]+Cp*(t[1]-t[0])/.36&&e[r].x<t[1]-Cp*(t[1]-t[0])/.36),ib=15;function zp(e,t){e.push(t),e.length>ib&&e.shift()}function Ap(e){if(!e.length)return null;const t=[...e].sort((r,i)=>r-i);return t[t.length>>1]}function Ue(e){const t=e.reduce((n,a)=>n+a.t,0)/e.length,r=e.reduce((n,a)=>n+a.x,0)/e.length,i=e.reduce((n,a)=>n+(a.t-t)**2,0);return{mt:t,mx:r,slope:i>0?e.reduce((n,a)=>n+(a.t-t)*(a.x-r),0)/i:0}}function _r(e,t,r,i,n=.08){return e.filter(a=>Math.abs(a.x-t)<r&&(i===null||Math.abs(a.y-i)<n)).sort((a,s)=>Math.abs(a.x-t)-Math.abs(s.x-t))}const Gn=(e,t)=>Math.abs(e.x-t.x)<Q_&&Math.abs(e.y-t.y)<J_,ti=(e,t)=>e.length>1&&Math.abs(e[1].x-t)-Math.abs(e[0].x-t)<.03,nb=.03,ab=1/50,Mp=.035,Op=.08,Rp=12,sb=.1,ob=.5;function Np(e,t,r,i,n=.08){return e.filter(a=>Math.abs(a.x-t)<r&&(i===null||Math.abs(a.y-i)<n)).sort((a,s)=>Math.hypot(a.x-t,i===null?0:a.y-i)-Math.hypot(s.x-t,i===null?0:s.y-i))}const Bp=(e,t,r)=>{const i=e.slice(1).find(n=>r===null||Math.abs(n.y-r)<nb);return!!i&&Math.abs(i.x-t)-Math.abs(e[0].x-t)<.03};class ub{x;y=null;pts=null;velocity=0;history=[];acquisition=null;provisional=[];resumption=null;challenger=null;running=!1;behindStart=!1;backfill=[];watchTracks=[];intervals=[];watchIntervals=[];lastPts=null;lastWatchPts=null;lastInterval=1/120;publishedFrom=null;retraction=null;rivalSeen=!1;nearer=[];finishX;seed;direction;start;sprintSpeed;fromBlocks;constructor(t,r=0,i="standing",n=0,a=!1){this.fromBlocks=a,this.seed=t,this.direction=Math.sign(r),this.finishX=t+r,this.start=this.direction&&i==="flying"?"flying":"standing",this.sprintSpeed=Math.max(lt,n),this.x=this.flyingSeed()}frameInterval(){return Ap(this.intervals)??this.lastInterval}watchInterval(){return Ap(this.watchIntervals)??2*this.frameInterval()}gapLimit(t=this.frameInterval()){return Math.max(.05,Ip*t)}get sparse(){return this.frameInterval()>ab}trackHeight(){return this.sparse?Mp:Op}frameRadius(){return Math.min(Xt,Sp+W_*Math.max(0,this.frameInterval()-1/120))}shortGap(){return Math.max(xp,Ip*this.frameInterval())}decisionWindow(t=this.frameInterval()){return Math.max(j_,X_*t)}minSpan(t=this.frameInterval()){return Math.max(V_,Z_*t)}flyingSeed(){return this.start==="flying"?Math.max(.02,Math.min(.98,this.seed-this.direction*G_)):this.seed}searchAgain(){this.x=this.flyingSeed(),this.y=null,this.pts=null,this.velocity=0,this.history=[],this.provisional=[],this.watchTracks=[],this.resumption=null,this.running=!1,this.behindStart=!1,this.rivalSeen=!1,this.nearer=[]}expected(t){if(this.pts===null&&this.start==="flying"){const r=this.leadCentre(this.provisional,t);if(r!==null)return r}return this.x+this.velocity*Math.max(0,Math.min(Jr,this.pts===null?0:t-this.pts))}leadCentre(t,r){const n=t.filter(s=>{const o=s.points.filter(l=>s.pts-l.t<=this.decisionWindow()+Se);return o.length>=ei&&o.at(-1).t-o[0].t>=this.minSpan()-Se&&Ue(o).slope*this.direction>=this.sprintSpeed}).sort((s,o)=>(o.x-s.x)*this.direction)[0];if(!n||r-n.pts>this.shortGap()+Se)return null;const a=n.points.filter(s=>n.pts-s.t<=this.decisionWindow()+Se);return Math.max(0,Math.min(1,n.x+Ue(a).slope*(r-n.pts)))}watchCentre(t){return this.start!=="flying"||this.pts===null||(this.x-this.finishX)*this.direction>=0?null:this.flyingSeed()}get following(){return this.pts!==null}get contested(){return this.rivalSeen}get watching(){return this.watchTracks.some(t=>t.points.length<2||Ue(t.points).slope*this.direction>=lt)}get idle(){return this.start==="flying"&&this.pts===null&&this.provisional.every(t=>{const r=t.points.filter(i=>t.pts-i.t<=this.decisionWindow()+Se);return r.length>=4&&r.at(-1).t-r[0].t>=.06-Se&&Math.abs(Ue(r).slope)<lt/2})}takeBackfill(){const t=this.backfill;return this.backfill=[],t}takeRetraction(){const t=this.retraction;return this.retraction=null,t}choose(t,r,i=[0,1],n){if(!Number.isFinite(r))return this.acquisition=null,this.provisional=[],this.resumption=null,[];if(this.pts!==null&&r<=this.pts)return[];this.lastPts!==null&&r>this.lastPts&&(this.lastInterval=r-this.lastPts,this.idle||zp(this.intervals,this.lastInterval)),this.lastPts=r,n&&this.pts!==null&&(this.lastWatchPts!==null&&r>this.lastWatchPts&&zp(this.watchIntervals,r-this.lastWatchPts),this.lastWatchPts=r);const a=(h,f)=>h.filter(y=>[23,24].every(m=>y[m]&&Number.isFinite(y[m].x)&&Number.isFinite(y[m].y)&&y[m].x>0&&y[m].x<1&&y[m].y>0&&y[m].y<1&&(y[m].visibility??0)>=.3)&&(this.start!=="flying"||rb(y,f))).map(y=>({p:y,x:(y[23].x+y[24].x)/2,y:(y[23].y+y[24].y)/2})),s=a(t,i),o=this.start==="flying"&&this.pts!==null,l=this.follow(s,r);if(!o||this.pts===null)return l;const d=s.find(h=>h.p===l),p=[];for(const h of[...s,...n?a(n.poses,n.view):[]])h!==d&&!(d&&Gn(h,d))&&!p.some(f=>Gn(f,h))&&p.push(h);return this.watch(p,r)??l}watch(t,r){if((this.x-this.finishX)*this.direction>=0)return this.watchTracks=[],null;const{next:i,confirmed:n}=this.advance(this.watchTracks,t,r,this.watchInterval());this.watchTracks=i;const a=this.y;if(a!==null&&i.some(o=>o.points.length>=ei&&o.y-a>=Wn&&Ue(o.points).slope*this.direction>=this.sprintSpeed)&&(this.rivalSeen=!0),a!==null){const o=Math.max(this.sprintSpeed,Tp*Math.abs(this.velocity)),l=Rp*this.sprintSpeed/la,d=t.filter(p=>p.y-a>=Wn).map(p=>({t:r,x:p.x,y:p.y}));this.nearer=this.nearer.filter(p=>r-p.t<=ob),d.some(p=>this.nearer.some(h=>p.t-h.t>=sb-Se&&Math.abs(p.y-h.y)<Mp&&(p.x-h.x)*this.direction>=o*(p.t-h.t)&&(p.x-h.x)*this.direction<=l*(p.t-h.t)))&&(this.rivalSeen=!0),this.nearer.push(...d)}if(!n||this.y===null)return null;const s=Ue(n.points).slope*this.direction;return n.y-this.y>=Wn&&s>=Tp*Math.abs(this.velocity)?(this.retraction=this.publishedFrom,this.adopt(n,r)):null}follow(t,r){if(this.start==="flying"&&this.pts!==null){const o=r-this.pts,l=(this.x-this.seed)*this.direction<0;(o-Jr>Se||l&&o-this.shortGap()>Se)&&this.searchAgain()}if(this.pts===null)return this.start==="flying"?this.acquireFlying(t,r):this.acquire(t,r);const i=this.challenge(t,r);if(i)return i;const n=r-this.pts;if(n-Jr>Se)return[];if(n-this.shortGap()>Se||this.resumption)return this.resume(t,r);const a=this.reference(r)??this.expected(r);if(this.start==="flying"){const o=Np(t,a,this.frameRadius(),this.y,this.trackHeight());return!o.length||Bp(o,a,this.y)?[]:this.accept(o[0],r)}const s=_r(t,a,this.frameRadius(),this.y);return!s.length||ti(s,a)?[]:this.accept(s[0],r)}reference(t){if(this.fromBlocks||Math.abs(this.velocity)<lt)return null;const r=this.history.filter(n=>t-n.t>=xp-Se&&t-n.t<=.4+Se);if(r.length<4||r.at(-1).t-r[0].t<.08)return null;const i=Ue(r);return i.mx+i.slope*(t-i.mt)}accept(t,r){for(this.x=t.x,this.y=t.y,this.pts=r,this.resumption=null,(t.x-this.seed)*this.direction<=0&&(this.behindStart=!0),this.history.push({t:r,x:t.x});this.history.length&&r-this.history[0].t>.6;)this.history.shift();return this.updateVelocity(r),t.p}updateVelocity(t){const r=this.history.filter(i=>t-i.t<=vp+Se);r.length<3||r.at(-1).t-r[0].t<q_-Se||(this.velocity=Math.max(-1,Math.min(1,Ue(r).slope)),this.behindStart&&this.velocity*this.direction>=lt&&(this.running=!0))}challenge(t,r){if(!this.direction||this.start==="flying"||this.running||this.velocity*this.direction>=kp)return this.challenger=null,null;const i=Math.abs(this.expected(r)-this.seed),n=_r(t,this.seed,Math.min(qn,i-.03),null)[0],a=this.challenger;if(!n)return this.challenger=null,null;const o=a&&r-a.pts-this.gapLimit()<=Se&&Math.abs(n.x-a.x)<Xt&&Math.abs(n.y-a.y)<.08?a.count+1:1;return o<3?(this.challenger={x:n.x,y:n.y,pts:r,count:o},null):(this.x=n.x,this.y=n.y,this.pts=r,this.velocity=0,this.history=[{t:r,x:n.x}],this.resumption=null,this.challenger=null,this.behindStart=(n.x-this.seed)*this.direction<=0,n.p)}resume(t,r){const i=this.expected(r),n=r-this.pts,a=Xt+.5*Math.abs(this.velocity)*Math.min(1,n),s=Math.abs(this.velocity)>=lt||this.velocity*this.direction>=kp,o=_r(t,i,a,this.y,this.start==="flying"?this.trackHeight():Op).filter(m=>!s||(m.x-this.x)*Math.sign(this.velocity)>=.4*Math.abs(this.velocity)*Math.min(Jr,n));if(!o.length||ti(o,i))return this.resumption=null,[];const l=o[0],d=this.resumption,h=d&&r-d.pts-this.gapLimit()<=Se&&Math.abs(l.x-(d.x+this.velocity*(r-d.pts)))<Xt&&Math.abs(l.y-d.y)<.08?{...d,x:l.x,y:l.y,pts:r,count:d.count+1}:{startX:l.x,startPts:r,x:l.x,y:l.y,pts:r,count:1};this.resumption=h;const f=h.pts-h.startPts;if(h.count<3||f-.04<-Se)return[];const y=(h.x-h.startX)/f;return s&&(Math.sign(y)!==Math.sign(this.velocity)||Math.abs(y)<.4*Math.abs(this.velocity))?(this.resumption=null,[]):(this.history=[],this.accept(l,r))}acquire(t,r){const i=this.acquisition;if(i&&r>i.pts&&r-i.pts-this.gapLimit()<=Se){const s=i.points.length>1?Ue(i.points).slope:0,o=i.x+s*(r-i.pts),l=_r(t,o,Xt,i.y);if(ti(l,o))return this.acquisition=null,[];if(l.length){const d=l[0],p=[...i.points,{t:r,x:d.x}];return p.length<3?(this.acquisition={x:d.x,y:d.y,pts:r,points:p},[]):(this.x=d.x,this.y=d.y,this.pts=r,this.acquisition=null,this.behindStart=p.some(h=>(h.x-this.seed)*this.direction<=0),this.history=p,this.updateVelocity(r),d.p)}}this.acquisition=null;const n=_r(t,this.x,qn,null);if(!n.length||ti(n,this.x))return[];const a=n[0];return this.acquisition={x:a.x,y:a.y,pts:r,points:[{t:r,x:a.x}]},[]}acquireFlying(t,r){const{next:i,confirmed:n}=this.advance(this.provisional,t,r);return this.provisional=i,n?this.adopt(n,r):[]}advance(t,r,i,n=this.frameInterval()){const a=t.filter(m=>i>m.pts&&i-m.pts-(m.points.length>=ei?Math.max(.05,K_*n):this.gapLimit(n))<=Se),s=[],o=new Set,l=new Set;for(const m of a){const b=m.points.length>1?Ue(m.points).slope:0,x=m.x+b*(i-m.pts),$=m.points.length<2?Rp*this.sprintSpeed/la*Math.max(0,i-m.pts-.05):0,w=Np(r.filter(v=>!o.has(v)),x,Xt+$,m.y,this.trackHeight());if(!w.length||Bp(w,x,m.y)){for(const v of w)l.add(v);s.push(m);continue}const S=w[0];o.add(S),s.push({x:S.x,y:S.y,pts:i,points:[...m.points.filter(v=>i-v.t<=.4),{t:i,x:S.x,p:S.p}]})}const d=[];for(const m of r)o.has(m)||l.has(m)||(m.x-this.seed)*this.direction>qn||[...o,...d].some(b=>Gn(m,b))||(d.push(m),s.push({x:m.x,y:m.y,pts:i,points:[{t:i,x:m.x,p:m.p}]}));s.sort((m,b)=>b.points.length-m.points.length||(b.x-m.x)*this.direction);const p=s.slice(0,F_),h=m=>m.points.filter(b=>i-b.t<=this.decisionWindow(n)+Se),f=p.filter(m=>{if(m.pts!==i)return!1;const b=h(m),x=b.length?b.at(-1).t-b[0].t:0;if(b.length<ei||x-this.minSpan(n)<-Se)return!1;const $=Ue(b).slope*this.direction,w=(b.at(-1).x-b[0].x)*this.direction,S=m.points,v=S.at(-1).t-S[0].t,I=(S.at(-1).x-S[0].x)*this.direction;if(!($>=lt&&w>=.7*lt*x&&I>=.5*lt*v))return!1;const C=.1*Math.max(0,Ue(S).slope*this.direction);return(S[0].x-this.seed)*this.direction>C+Se?!1:this.sprintSpeed<=lt||v-H_>-Se&&Ue(S).slope*this.direction>=this.sprintSpeed}),y=f[0]??null;return y&&f.length>1&&Math.abs(f[1].x-y.x)<Sp?{next:p,confirmed:null}:{next:p,confirmed:y}}adopt(t,r){const i=lb(t.points);this.x=t.x,this.y=t.y,this.pts=r,this.provisional=[],this.watchTracks=[],this.rivalSeen=!1,this.nearer=[];const n=t.points.filter(a=>r-a.t<=Math.max(vp,this.decisionWindow())+Se);return this.velocity=this.sparse&&n.length>=2?Math.max(-1,Math.min(1,Ue(n).slope)):0,this.resumption=null,this.behindStart=!0,this.history=i.map(({t:a,x:s})=>({t:a,x:s})),this.updateVelocity(r),this.running=!0,this.backfill=i.slice(0,-1).map(a=>({pts:a.t,pose:a.p})),this.publishedFrom=i[0].t,t.points.at(-1).p}}function lb(e){const t=e.at(-1).t;let r=e.findIndex(n=>t-n.t<=Ep+Se);r=Math.min(r,Math.max(0,e.length-3));const i=Ue(e.slice(r));for(;r>0;){const n=e[r-1],a=Math.max(0,t-Ep-n.t);if(Math.abs(i.mx+i.slope*(n.t-i.mt)-n.x)>eb+.5*tb*a**2)break;r--}return e.slice(r)}const Dp=4;class db{constructor(t,r,i,n,a,s,o,l=!1,d=!1){this.source=t,this.model=r,this.watcher=i,this.liveWatch=l,this.fromBlocks=d,this.crop=document.createElement("canvas");const p=this.crop.getContext("2d");if(!p)throw new Error("映像処理を開始できません。");this.cc=p;const h=a===void 0||!(o>0)?0:la*Math.abs(a-n)/o;this.tracker=new ub(n,a===void 0?0:a-n,s,h,d)}source;model;watcher;liveWatch;fromBlocks;samples=[];tracker;sampleAt=new Map;crop;cc;top=0;bottom=1;analysed=0;get idle(){return this.tracker.idle}detect(t,r,i,n,a){return this.crop.width=512,this.crop.height=Math.round(512*r.h*a/(r.w*n)),this.cc.drawImage(this.source,r.x*n,r.y*a,r.w*n,r.h*a,0,0,this.crop.width,this.crop.height),t.estimate(this.crop,i.frameIndex,i.pts).landmarks.map(s=>s.map(o=>({...o,x:r.x+o.x*r.w,y:r.y+o.y*r.h})))}async process(t,r,i){this.analysed++;const n=this.tracker,a=this.samples,s={x:Math.max(0,Math.min(.64,n.expected(i.pts)-.18)),y:this.top,w:.36,h:this.bottom-this.top},o=this.detect(this.model,s,i,t,r),l=n.watchCentre(i.pts),d=l===null?null:{x:Math.max(0,Math.min(.64,l-.18)),y:0,w:.36,h:1};let p;d&&Math.abs(d.x-s.x)>.01&&(this.analysed%2===0||this.liveWatch&&n.watching)&&(p={poses:this.detect(await this.watcher(),d,i,t,r),view:[d.x,d.x+d.w]});const h=n.choose(o,i.pts,[s.x,s.x+s.w],p),f=n.takeRetraction();if(f!==null)for(let m=a.length-1;m>=0&&a[m].pts>=f;m--)a[m]=Wi([],a[m].frame,a[m].pts,t/r);const y=n.takeBackfill();for(const{pts:m,pose:b}of y){const x=this.sampleAt.get(m);x!==void 0&&(a[x]=Wi(b,a[x].frame,m,t/r))}if(y.length&&(this.top=0,this.bottom=1),h.length&&!this.fromBlocks){const m=h.filter($=>($.visibility??0)>=.3).map($=>$.y),b=Math.max(0,Math.min(...m)-.12),x=Math.min(1,Math.max(...m)+.12);x-b>.2&&(this.top=.8*this.top+.2*b,this.bottom=.8*this.bottom+.2*x)}return this.sampleAt.set(i.pts,a.length),a.push(Wi(h,i.frameIndex,i.pts,t/r)),h}}const Pp=120,pb=30,cb=240;async function hb(e,t,r,i,n,a="standing",s=10,o={}){const l=()=>{if(r.aborted)throw new DOMException("中止","AbortError")};if(l(),!Bo.isAvailable())throw new Error("このブラウザではフレーム解析ができません。対応する最新のブラウザでお試しください。");if(e.size>150*1024*1024)throw new Error("150MB以内のMP4 / MOVを選んでください。");i(0,"元動画のフレーム時刻を確認しています。");const d=await Rt(K0(e),r);if(l(),!d.frames.length||d.frames.length>3600||d.frames.at(-1).pts-d.frames[0].pts>30)throw new Error("1走分・30秒以内・3600フレーム以内の動画を選んでください。");const p=X0(d.videoTrack.matrix),h=new Bo(e,d.videoTrack,d.frames,d.rawSamples,d.descriptionBuffer),f=new Do("full",void 0,"CPU",Dp);let y=null;const m=async()=>(y||(y=new Do("full",void 0,"CPU",Dp,"IMAGE"),await Rt(y.initialize(r),r),l()),y),b=document.createElement("canvas"),x=b.getContext("2d");if(!x)throw new Error("映像処理を開始できません。");const $=new db(b,f,m,t,n,a,s,!1,o.fromBlocks),w=()=>h.dispose();r.addEventListener("abort",w,{once:!0});let S=performance.now(),v=-1/0;const I=d.frames.at(-1).pts-d.frames[0].pts,C=I>0?(d.frames.length-1)/I:Pp,z=Math.max(1,Math.round(C/(o.maxFps??Pp))),k=Math.max(z,Math.round(C/pb));let N=0;try{await Rt(f.initialize(r,B=>i(0,B)),r),l();for(const B of d.frames){if(B.frameIndex<N){await Rt(h.skipExactFrame(B.frameIndex),r),l();continue}N=B.frameIndex+z;const H=await Rt(h.decodeExactFrame(B.frameIndex).then(Y=>(r.aborted&&h.dispose(),Y)),r);if(l(),H.status!=="SUCCESS"||H.actualDecodedFrameIndex!==B.frameIndex)throw new Error("動画フレームを正しく読み出せません。");const q=H.bitmap,V=p%180?q.height:q.width,O=p%180?q.width:q.height;(b.width!==V||b.height!==O)&&(b.width=V,b.height=O),x.setTransform(1,0,0,1,0,0),x.clearRect(0,0,V,O),x.translate(V/2,O/2),x.rotate(p*Math.PI/180),x.drawImage(q,-q.width/2,-q.height/2),x.setTransform(1,0,0,1,0,0);const P=await $.process(V,O,B);o.onSelected?.(B,P,V,O),o.afterSelected&&(await Rt(o.afterSelected(b),r),l()),$.idle&&(N=B.frameIndex+k);const G=performance.now();G-v>100&&(i((B.frameIndex+1)/d.frames.length,"選手と脚の動きを解析しています。"),v=G),G-S>32&&(await new Promise(Y=>setTimeout(Y,0)),S=performance.now(),l())}return i(1,"解析が終わりました。"),$.samples}finally{r.removeEventListener("abort",w),h.dispose(),f.dispose(),y?.dispose(),b.width=0}}async function Yb(e,t,r,i){const n=[];let a=0,s=0,o=null;try{o=await Rt(U_(r,l=>i(0,l)),r)}catch(l){if(r.aborted)throw l;o=null}return await hb(e,t,r,i,void 0,"standing",10,{maxFps:cb,fromBlocks:!0,onSelected:(l,d,p,h)=>{a=p,s=h,n.push({frame:l.frameIndex,pts:l.pts,pose:d.length===33?d.map(f=>({x:f.x,y:f.y,visibility:f.visibility})):null})},afterSelected:o?async l=>{const d=n.at(-1);d?.pose&&(d.refined=await o.refine(l,d.pose))}:void 0}),{frames:n,width:a,height:s,refiner:o?.backend??null}}const fb=1280;function Vn(e,t,r){return new Promise((i,n)=>{const a=()=>{clearTimeout(s),e.removeEventListener(t,a),i()},s=setTimeout(()=>{e.removeEventListener(t,a),n(new Error(`${t} timed out`))},r);e.addEventListener(t,a)})}async function mb(e,t=15e3){const r=document.createElement("video");r.muted=!0,r.playsInline=!0,r.preload="auto",r.style.cssText="position:fixed;left:-10000px;top:0;width:320px;height:180px;pointer-events:none",document.body.appendChild(r);try{const i=Vn(r,"loadedmetadata",t);if(r.src=e,r.load(),await i,r.readyState<2){const o=Vn(r,"loadeddata",t);await r.play().catch(()=>{}),r.pause(),r.readyState<2&&await o}if(r.currentTime>0){const o=Vn(r,"seeked",t);r.currentTime=0,await o}if(await new Promise(o=>requestAnimationFrame(()=>o())),!r.videoWidth||!r.videoHeight)return null;const n=Math.min(1,fb/r.videoWidth),a=document.createElement("canvas");a.width=Math.round(r.videoWidth*n),a.height=Math.round(r.videoHeight*n);const s=a.getContext("2d");return s?(s.drawImage(r,0,0,a.width,a.height),{image:a.toDataURL("image/jpeg",.85),width:r.videoWidth,height:r.videoHeight}):null}catch{return null}finally{r.pause(),r.removeAttribute("src"),r.load(),r.remove()}}function Qb(e){const[t,r]=Ce.useState(null);return Ce.useEffect(()=>{let i=!1;return r(null),e&&mb(e).then(n=>{i||r(n)}),()=>{i=!0}},[e]),t}function gb({video:e,url:t,disabled:r=!1}){const[i,n]=Ce.useState(!1),[a,s]=Ce.useState(0),[o,l]=Ce.useState(0);Ce.useEffect(()=>{const f=e.current;if(!f)return;const y=()=>{n(!f.paused&&!f.ended),s(f.currentTime),l(Number.isFinite(f.duration)?f.duration:0)},m=["play","pause","ended","timeupdate","seeked","loadedmetadata","durationchange","emptied"];for(const b of m)f.addEventListener(b,y);return y(),()=>{for(const b of m)f.removeEventListener(b,y)}},[e,t]);async function d(f){if(f.readyState>=2)return;const y=f.muted;f.muted=!0,await f.play().catch(()=>{}),f.pause(),f.muted=y}async function p(){const f=e.current;f&&(f.paused||f.ended?(f.ended&&(f.currentTime=0),await f.play().catch(()=>{})):f.pause())}async function h(f){const y=e.current;y&&(await d(y),y.currentTime=f,s(f))}return de.jsxs("div",{className:"sprint10-playerbar",children:[de.jsx("button",{type:"button","aria-label":i?"一時停止":"再生",disabled:r||!t,onClick:()=>{p()},children:i?"❚❚":"▶"}),de.jsx("input",{type:"range","aria-label":"動画の位置",min:0,max:o||0,step:"any",value:Math.min(a,o||0),disabled:r||!o,onChange:f=>{h(Number(f.target.value))}}),de.jsxs("span",{children:[a.toFixed(2)," / ",o.toFixed(2),"秒"]})]})}const zm=[31,32],je=(e,t=.5)=>!!e&&Number.isFinite(e.x)&&Number.isFinite(e.y)&&(e.visibility??1)>=t,Jt=e=>{const t=[...e].sort((r,i)=>r-i);return t.length?t[t.length>>1]:NaN},er=(e,t)=>{const r=[...e].sort((i,n)=>i-n);return r.length?r[Math.min(r.length-1,Math.floor(t*r.length))]:NaN},yb=.02,Am=.05,Mm=.1,Om=.03,_b=.03,bb=.06,wb=.4,$b=.03,vb=.05;function xb(e,t,r){return er(e.flatMap(i=>[[23,27],[24,28]].flatMap(([n,a])=>je(i.pose[n])&&je(i.pose[a])?[Math.hypot((i.pose[n].x-i.pose[a].x)*t,(i.pose[n].y-i.pose[a].y)*r)]:[])),.9)}const Sb=(e,t,r)=>e.flatMap(i=>zm.filter(n=>je(i.pose[n])).map(n=>({t:i.pts,frame:i.frame,x:i.pose[n].x*t,y:i.pose[n].y*r}))),kb=(e,t)=>e.filter(r=>e.some(i=>i!==r&&Math.abs(i.t-r.t)<=yb&&Math.abs(i.t-r.t)>0&&Math.hypot(i.x-r.x,i.y-r.y)<Am*t));function Tb(e,t){const r=[];for(const i of e){const n=r.find(a=>Math.abs(a.x-i.x)<Mm*t&&i.t-a.to<=Om);n?(n.toes.push(i),n.to=Math.max(n.to,i.t),n.x=Jt(n.toes.map(a=>a.x))):r.push({x:i.x,y:i.y,from:i.t,to:i.t,toes:[i]})}for(const i of r)i.y=er(i.toes.map(n=>n.y),.8);return r.filter(i=>i.to-i.from>=_b)}function Ib(e,t){const r=[];for(const i of[...e].sort((n,a)=>n.from-a.from)){const n=r.find(a=>Math.abs(a.x-i.x)<Mm*t);n?(n.toes.push(...i.toes),n.from=Math.min(n.from,i.from),n.to=Math.max(n.to,i.to),n.x=Jt(n.toes.map(a=>a.x)),n.y=er(n.toes.map(a=>a.y),.8)):r.push({...i,toes:[...i.toes]})}return r}function Eb(e,t,r,i=1/0){const n=[];for(const a of Ib(e,t).filter(s=>s.to-s.from>=bb).sort((s,o)=>s.from-o.from)){const s=n.at(-1);if((!s||(a.x-s.x)*r>wb*t)&&n.push(a),n.length===i)break}return n}function Cb(e,t,r,i,n,a=-1/0){const s=r.filter(h=>Math.abs(h.x-e.x)<Am*2*i&&h.t>=e.from-.1&&h.t<=e.to+.1).sort((h,f)=>h.t-f.t),o=s.find(h=>e.y-h.y<$b*i)??null,l=[...s].reverse().find(h=>e.y-h.y<vb*i)??null,d=l===null||n-l.t<.02,p=o===null||o.t-a<.02;return{index:t,x:e.x,groundY:e.y,touchdown:p?null:o.t,touchdownFrame:p?null:o.frame,toeOff:d?null:l.t,toeOffFrame:d?null:l.frame}}const zb=.45,da=.38,gi=e=>e*180/Math.PI;function Rm(e,t,r){const i=zm.map(n=>je(e[n],.3)?Math.abs(e[n].x-t)*r:1/0);return i[0]===1/0&&i[1]===1/0?null:i[0]<=i[1]?0:1}function Nm(e,t,r,i,n){if(![11,12,23,24].every(d=>je(e[d],.3)))return null;const a=(e[11].x+e[12].x)/2*t,s=(e[11].y+e[12].y)/2*r,o=(e[23].x+e[24].x)/2*t,l=(e[23].y+e[24].y)/2*r;return Math.hypot(a-o,s-l)<zb*n?null:gi(Math.atan2((a-o)*i,l-s))}function Ab(e,t,r,i,n){const a=e[25+t],s=e[27+t];return!je(a,.3)||!je(s,.3)?null:gi(Math.atan2((a.x-s.x)*r*n,(s.y-a.y)*i))}function Jb(e,t,r,i,n,a){const s=e[23+t],o=e[25+t];if(!je(s,.3)||!je(o,.3))return null;const l=(o.x-s.x)*r*n,d=(o.y-s.y)*i;return Math.hypot(l,d)<da*a?null:gi(Math.atan2(l,d))}function Up(e,t,r,i,n){const[a,s,o]=[e[23+t],e[25+t],e[27+t]];if(![a,s,o].every(h=>je(h,.3)))return null;const l={x:(a.x-s.x)*r,y:(a.y-s.y)*i},d={x:(o.x-s.x)*r,y:(o.y-s.y)*i};if(Math.hypot(l.x,l.y)<da*n||Math.hypot(d.x,d.y)<da*n)return null;const p=(l.x*d.x+l.y*d.y)/(Math.hypot(l.x,l.y)*Math.hypot(d.x,d.y));return gi(Math.acos(Math.max(-1,Math.min(1,p))))}const Mb="crouch-start-v2-experimental",Ob=5,yi=e=>e.refined??e.pose,Lp=.06,qp=.15,Rb=.05,Nb=.2,Bb=.1,Db=.1;function ew(e,t){const r={version:Mb,reason:null,direction:0,set:null,blockClearance:null,blocks:null,contacts:[],steps:[],firstFlight:null,notes:[]},i=A=>({...r,reason:A}),{width:n,height:a}=t,s=e.filter(A=>A.pose);if(s.length<20)return i("選手を十分に捉えられませんでした。真横から、全身が映るように撮影してください。");const o=A=>({x:A.x*n,y:A.y*a}),l=A=>je(A[23],.3)&&je(A[24],.3)?o({x:(A[23].x+A[24].x)/2,y:(A[23].y+A[24].y)/2}):null,d=xb(s,n,a);if(!(d>0))return i("脚を十分に捉えられませんでした。");const p=s.flatMap(A=>{const K=l(A.pose);return K?[{t:A.pts,frame:A.frame,...K}]:[]}),h=Math.sign(p.at(-1).x-p[0].x);if(!h)return i("走る向きを確認できませんでした。");r.direction=h;const f=Jt(p.slice(0,Math.max(3,Math.round(p.length*.05))).map(A=>A.x)),y=p.findIndex((A,K)=>(A.x-f)*h>Lp*d&&p.slice(K,K+10).every(Z=>(Z.x-f)*h>Lp*d));if(y<0)return i("走り出しを確認できませんでした。");const m=p[y].t;if(m-p[0].t<Bb)return i("スタートの構えを確認できませんでした。構えから映っている動画を使ってください。");const b=Sb(s,n,a),x=kb(b,d),$=Tb(x,d),w=x.filter(A=>A.t<m);if(w.length<4)return i("スタートの構え（ブロック上の足）を確認できませんでした。構えから映っている動画を使ってください。");const S=A=>A*h,v=[er(w.map(A=>S(A.x)),.05)-qp*d,er(w.map(A=>S(A.x)),.95)+qp*d],I=A=>S(A.x)>=v[0]&&S(A.x)<=v[1],C=x.filter(A=>A.t>=m&&I(A)).sort((A,K)=>A.t-K.t),z=C.filter(A=>A.t<=m+.15),k=z.length?er(z.map(A=>S(A.x)),.75):v[1];let N=m;for(const A of b.filter(K=>K.t>=m).sort((K,Z)=>K.t-Z.t)){const K=S(A.x)-k;if(!(K<-.12*d||K>Db*d)){if(A.t-N>Rb)break;N=A.t}}const B=C.filter(A=>A.t>=N-.05),H=B.length?Jt(B.map(A=>A.x)):h>0?v[1]/h:v[0]/h,q=w.filter(A=>(H-A.x)*h>.15*d);r.blocks={front:H/n,rear:q.length?Jt(q.map(A=>A.x))/n:null};const V={x:H},O=Eb($.filter(A=>A.from>N-Om&&S(A.x)>v[1]+.2*d),d,h,Ob),P=s.at(-1).pts;r.contacts=O.map((A,K)=>Cb(A,K+1,b,d,P));const G=s.filter(A=>A.pts<m&&A.pts>=m-Nb),Y=s.findIndex(A=>A.pts>=N),L=Y<0?[]:s.slice(Math.max(0,Y-2),Y+3);r.set=G.length?Wp(G,V.x/n,n,a,h,d):null,r.blockClearance=L.length?Wp(L,V.x/n,n,a,h,d,s[Y]):null;const F=r.contacts[0];r.firstFlight=F?.touchdown!=null?F.touchdown-N:null,r.steps=r.contacts.map((A,K)=>{const Z=r.contacts[K+1]??null,X=A.touchdown!==null&&A.toeOff!==null?A.toeOff-A.touchdown:null,ye=Z?.touchdown!=null&&A.toeOff!==null?Z.touchdown-A.toeOff:null,Ee=Z?.touchdown!=null&&A.touchdown!==null?Z.touchdown-A.touchdown:null,be=A.touchdownFrame!==null?e.find(we=>we.frame===A.touchdownFrame):null,Te=be?yi(be):null,ce=Te?Rm(Te,A.x/n,n):null;return{step:A.index,contactSeconds:X,flightSeconds:ye,stepSeconds:Ee,pitch:Ee?1/Ee:null,shankAngle:Te&&ce!==null?Ab(Te,ce,n,a,h):null,trunkAngle:Te?Nm(Te,n,a,h,d):null,side:ce}}),r.contacts.length||r.notes.push("ブロックを離れた後の接地が映っていません。");const ee=r.contacts.filter(A=>A.toeOff===null).map(A=>A.index);return ee.length&&r.notes.push(`${ee.join("・")}歩目は離地が映っていないため、接地時間を出していません。`),r}function Wp(e,t,r,i,n,a,s){const o=b=>{const x=yi(b),$=Rm(x,t,r);return{side:$,trunk:Nm(x,r,i,n,a),front:$===null?null:Up(x,$,r,i,a),rear:$===null?null:Up(x,1-$,r,i,a)}},l=e.map(o),d=b=>{const x=l.flatMap($=>$[b]===null?[]:[$[b]]);return x.length*2>=e.length?Jt(x):null},p=d("trunk"),h=d("front"),f=d("rear"),y=b=>[[b.trunk,p],[b.front,h],[b.rear,f]].reduce((x,[$,w])=>w===null?x:$===null?1/0:x+Math.abs($-w),0),m=s??e[l.reduce((b,x,$)=>y(x)<y(l[b])?$:b,l.length-1)];return{frame:m.frame,pts:m.pts,trunkAngle:p,frontKnee:h,rearKnee:f,frontSide:o(m).side}}const Gp=e=>e!==null;function tw(e){const t=[],r=(i,n,a,s)=>{if(!a)return;const o=a.frontSide,l=[a.trunkAngle===null?null:{kind:"trunk",label:"体幹",value:a.trunkAngle},a.frontKnee===null||o===null?null:{kind:"knee",side:o,label:"前膝",value:a.frontKnee},!s||a.rearKnee===null||o===null?null:{kind:"knee",side:1-o,label:"後膝",value:a.rearKnee}].filter(Gp);t.push({key:i,label:n,frame:a.frame,pts:a.pts,marks:l})};r("set","構え",e.set,!0),r("clearance","ブロックを離れる瞬間",e.blockClearance,!1);for(const i of e.steps){const n=e.contacts.find(s=>s.index===i.step);if(!n||n.touchdown===null||n.touchdownFrame===null)continue;const a=[i.shankAngle===null||i.side===null?null:{kind:"shank",side:i.side,label:"脛",value:i.shankAngle},i.trunkAngle===null?null:{kind:"trunk",label:"体幹",value:i.trunkAngle}].filter(Gp);t.push({key:`td${i.step}`,label:`${i.step}歩目の接地`,frame:n.touchdownFrame,pts:n.touchdown,marks:a})}return t}const Wa=e=>`${e.label} ${Math.round(e.value)}°`,Pb=e=>e.kind==="trunk"?"#ffb02e":e.kind==="shank"?"#3ad7ff":e.kind==="thigh"?"#7dff6b":e.label==="後膝"||e.label.startsWith("踏切")?"#b58cff":"#ff6fd8",Bm=e=>!!e&&Number.isFinite(e.x)&&Number.isFinite(e.y)&&(e.visibility??1)>=.3;function Ub(e,t,r,i,n=.35){const a=e.filter(m=>Bm(m)).map(m=>({x:m.x*t,y:m.y*r}));if(!a.length)return{x:0,y:0,w:t,h:r};const s=Math.min(...a.map(m=>m.x)),o=Math.max(...a.map(m=>m.x)),l=Math.min(...a.map(m=>m.y)),d=Math.max(...a.map(m=>m.y));let p=(o-s)*(1+2*n),h=(d-l)*(1+2*n);p/h<i?p=h*i:h=p/i,p=Math.min(p,t,r*i),h=p/i;const f=Math.max(0,Math.min(t-p,(s+o)/2-p/2)),y=Math.max(0,Math.min(r-h,(l+d)/2-h/2));return{x:f,y,w:p,h}}function Dm(e,t,r,i,n,a){const s=p=>Bm(t[p])?r(t[p]):null;e.save(),e.lineCap="round",e.lineJoin="round",e.strokeStyle="rgba(255,255,255,.85)",e.lineWidth=n*.25;for(const[p,h]of Po){const f=s(p),y=s(h);!f||!y||(e.beginPath(),e.moveTo(f.x,f.y),e.lineTo(y.x,y.y),e.stroke())}e.fillStyle="#ffffff";for(const p of new Set(Po.flat())){const h=s(p);h&&(e.beginPath(),e.arc(h.x,h.y,n*.3,0,Math.PI*2),e.fill())}const o=(p,h)=>{const f=s(p),y=s(h);return f&&y?{x:(f.x+y.x)/2,y:(f.y+y.y)/2}:null},l=[],d=p=>l.every(h=>p.x+p.w<=h.x||h.x+h.w<=p.x||p.y+p.h<=h.y||h.y+h.h<=p.y);for(const p of i){const h=Pb(p),[f,y,m]=p.kind==="trunk"?[o(23,24),o(11,12),null]:p.kind==="shank"?[s(27+p.side),s(25+p.side),null]:p.kind==="thigh"?[s(23+p.side),s(25+p.side),null]:[s(25+p.side),s(27+p.side),s(23+p.side)];if(!f||!y||p.kind==="knee"&&!m)continue;const b=Math.hypot(y.x-f.x,y.y-f.y),x=m??{x:f.x,y:f.y+(p.kind==="thigh"?b:-b)};e.strokeStyle=h,e.lineWidth=n*.7,e.beginPath(),e.moveTo(f.x,f.y),e.lineTo(y.x,y.y),m&&(e.moveTo(f.x,f.y),e.lineTo(m.x,m.y)),e.stroke(),p.kind!=="knee"&&(e.setLineDash([n*.8,n*.6]),e.lineWidth=n*.35,e.beginPath(),e.moveTo(f.x,f.y),e.lineTo(x.x,x.y),e.stroke(),e.setLineDash([]));const $=Math.atan2(x.y-f.y,x.x-f.x);let S=Math.atan2(y.y-f.y,y.x-f.x)-$;for(;S>Math.PI;)S-=2*Math.PI;for(;S<-Math.PI;)S+=2*Math.PI;const v=Math.max(n*2.2,Math.min(b*.35,n*5));if(e.lineWidth=n*.45,e.beginPath(),e.arc(f.x,f.y,v,$,$+S,S<0),e.stroke(),a){const I=$+S/2,C=Wa(p),z=n*1.8,k=n*.45;e.font=`700 ${z}px system-ui, sans-serif`,e.textBaseline="middle";const N=e.measureText(C).width,B=N+2*k,H=z+2*k,q=e.canvas.width,V=e.canvas.height,O=(A,K)=>{const Z=Math.cos(I)*A,X=Math.sin(I)*A,ye=f.x+Z*K+(Z<-.3?-B:Z>.3?0:-B/2),Ee=f.y+X*K+(X<-.3?-H:X>.3?0:-H/2);return{x:Math.max(2,Math.min(q-B-2,ye)),y:Math.max(2,Math.min(V-H-2,Ee)),w:B,h:H}},P=O(1,v+n*1.4),G=O(-1,n*1.6),Y=p.kind==="knee"?[G,P]:[P,G],L=Y.find(d)??{...Y[0],y:Math.min(V-H-2,Math.max(...l.map(A=>A.y+A.h))+2)};l.push(L);const{x:F,y:ee}=L;e.fillStyle="rgba(8,18,16,.72)",e.beginPath(),e.roundRect?e.roundRect(F,ee,B,H,k):e.rect(F,ee,B,H),e.fill(),e.fillStyle=h,e.fillText(C,F+k,ee+H/2)}}e.restore()}const Zt=720,Fn=540,Lb=3;function Pm(e){const t=e.slice(1).map((r,i)=>r.pts-e[i].pts).filter(r=>r>0).sort((r,i)=>r-i);return t.length?t[t.length>>1]:1/240}const pa=(e,t)=>e+.5*t;function Um(e,t,r){return new Promise((i,n)=>{const a=()=>{clearTimeout(s),e.removeEventListener(t,a),i()},s=setTimeout(()=>{e.removeEventListener(t,a),n(new Error(`${t} timed out`))},r);e.addEventListener(t,a)})}async function qb(e,t){const r=Um(e,"seeked",8e3);e.currentTime=t,await r,await new Promise(i=>requestAnimationFrame(()=>i()))}function rw({url:e,frames:t,phases:r,onShow:i,guides:n={},overlay:a}){const[s,o]=Ce.useState({}),[l,d]=Ce.useState(!1),p=Ce.useMemo(()=>Pm(t),[t]);Ce.useEffect(()=>{let b=!1;o({}),d(!1);const x=document.createElement("video");return x.muted=!0,x.playsInline=!0,x.preload="auto",x.style.cssText="position:fixed;left:-10000px;top:0;width:320px;height:180px;pointer-events:none",document.body.appendChild(x),(async()=>{try{const $=Um(x,"loadeddata",2e4);x.src=e,x.load();const w=setTimeout(()=>{x.readyState<2&&x.play().then(()=>x.pause()).catch(()=>{})},1500);await $,clearTimeout(w);for(const S of r){const v=t.find(O=>O.frame===S.frame),I=v?yi(v):null;if(b)return;if(!I)continue;if(await qb(x,pa(S.pts,p)),b)return;const C=document.createElement("canvas");C.width=Zt,C.height=Fn;const z=C.getContext("2d");if(!z)throw new Error("no canvas");const k=x.videoWidth,N=x.videoHeight,B=Ub(I,k,N,Zt/Fn),H=Zt/B.w;z.drawImage(x,B.x,B.y,B.w,B.h,0,0,Zt,Fn);const q=O=>({x:(O.x*k-B.x)*H,y:(O.y*N-B.y)*H});Dm(z,I,q,S.marks,Zt/48,!0),a?.(S,z,q,Zt/48);const V=C.toDataURL("image/jpeg",.85);b||o(O=>({...O,[S.key]:V}))}}catch{b||d(!0)}})(),()=>{b=!0,x.pause(),x.removeAttribute("src"),x.load(),x.remove()}},[e,t,r,p,a]);const h=Ce.useRef(null),[f,y]=Ce.useState(0),m=b=>{const x=h.current;x?.clientWidth&&x.scrollTo({left:b*x.clientWidth,behavior:"smooth"}),y(b)};return de.jsxs("div",{className:"sprint10-phase-view",children:[de.jsx("div",{className:"sprint10-chips",role:"group","aria-label":"局面を選ぶ",children:r.map((b,x)=>de.jsx("button",{type:"button","aria-pressed":f===x,"aria-label":b.label,onClick:()=>m(x),children:Wb(b)},b.key))}),de.jsx("ol",{ref:h,className:"sprint10-phases","aria-label":"局面ごとの姿勢",onScroll:b=>{const x=b.currentTarget;x.clientWidth&&y(Math.max(0,Math.min(r.length-1,Math.round(x.scrollLeft/x.clientWidth))))},children:r.map((b,x)=>de.jsxs("li",{"aria-label":`${x+1}/${r.length} ${b.label}`,children:[de.jsxs("div",{className:"sprint10-phase-head",children:[de.jsxs("div",{children:[de.jsx("strong",{children:b.label}),de.jsxs("small",{children:[b.pts.toFixed(3),"秒"]})]}),de.jsx("button",{type:"button","aria-label":`${b.label}をスロー再生で見る`,onClick:()=>i(b),children:"▶ スローで見る"})]}),s[b.key]?de.jsx("img",{src:s[b.key],alt:`${b.label}の骨格と角度`}):de.jsx("div",{className:"sprint10-phase-wait",children:l?"画像を作れませんでした":"画像を作成しています…"}),de.jsx("p",{children:b.marks.length?b.marks.map(Wa).join(" · "):"角度を測れませんでした"}),n[b.key]&&de.jsx("small",{className:"sprint10-guide",children:n[b.key]})]},b.key))})]})}const Wb=e=>e.short??(e.key==="set"?"構え":e.key==="clearance"?"離れる":e.label.replace("の接地","")),Gb=[["1/8",.125],["1/4",.25],["通常",1]];function iw({url:e,video:t,frames:r,phases:i,events:n}){const a=Ce.useRef(null),[s,o]=Ce.useState(.125),[l,d]=Ce.useState(!0),[p,h]=Ce.useState(""),[f,y]=Ce.useState(-1),m=Ce.useRef(null),b=Ce.useMemo(()=>r.filter(S=>S.pose),[r]),x=Ce.useMemo(()=>Pm(r),[r]);Ce.useEffect(()=>{const S=t.current;S&&(S.defaultPlaybackRate=s,S.playbackRate=s)},[t,s,e]),Ce.useEffect(()=>{const S=t.current,v=a.current,I=v?.getContext("2d");if(!S||!v||!I)return;let C=0,z=!1,k="",N=-1;const B=(P,G=-1)=>{P!==k&&(k=P,h(P)),G!==N&&(N=G,y(G))},H=()=>{I.clearRect(0,0,v.width,v.height),delete v.dataset.frame,B("")},q=P=>{if(S.seeking||!S.videoWidth){H();return}(v.width!==S.videoWidth||v.height!==S.videoHeight)&&(v.width=S.videoWidth,v.height=S.videoHeight),I.clearRect(0,0,v.width,v.height);const G=Uo(b,P);if(!G||Math.abs(G.pts-P)>1.5*x){delete v.dataset.frame,B("");return}const Y=i.find(L=>Math.abs(L.pts-G.pts)<=(Lb+.5)*x)??null;l&&Dm(I,yi(G),L=>({x:L.x*v.width,y:L.y*v.height}),Y?.marks??[],v.width/110,!1),v.dataset.frame=String(G.frame),B(Y?`${Y.label}　${Y.marks.map(Wa).join(" · ")}`:"",n.findIndex(L=>Math.abs(L.pts-G.pts)<.5*x))},V=()=>q(S.currentTime),O=(P,G)=>{z||(q(G.mediaTime),C=S.requestVideoFrameCallback(O))};for(const P of["seeked","loadeddata","timeupdate","pause"])S.addEventListener(P,V);return S.addEventListener("seeking",H),V(),S.requestVideoFrameCallback&&(C=S.requestVideoFrameCallback(O)),()=>{z=!0,C&&S.cancelVideoFrameCallback(C);for(const P of["seeked","loadeddata","timeupdate","pause"])S.removeEventListener(P,V);S.removeEventListener("seeking",H),I.clearRect(0,0,v.width,v.height)}},[t,b,i,n,l,x,e]),Ce.useEffect(()=>{const S=m.current,v=S?.children[f];S&&v&&S.scrollTo({left:v.offsetLeft-(S.clientWidth-v.offsetWidth)/2,behavior:"smooth"})},[f]);function $(S){const v=t.current;if(!v||!b.length)return;v.pause();const I=Uo(b,v.currentTime)??b[0],C=b.indexOf(I),z=b[Math.max(0,Math.min(b.length-1,C+S))];v.currentTime=pa(z.pts,x)}function w(S){const v=t.current;v&&(v.pause(),v.currentTime=pa(S,x))}return de.jsxs(de.Fragment,{children:[de.jsxs("div",{className:"sprint10-player",children:[de.jsx("video",{ref:t,src:e,playsInline:!0,muted:!0,preload:"auto"}),de.jsx("canvas",{ref:a,className:"sprint10-replay-overlay","aria-label":"選手の骨格"}),de.jsxs("label",{className:"sprint10-overlay-toggle",children:[de.jsx("input",{type:"checkbox",checked:l,onChange:S=>d(S.target.checked)}),"骨格"]})]}),de.jsx(gb,{video:t,url:e}),de.jsx("p",{className:"sprint10-replay-caption","aria-live":"polite",children:p||" "}),de.jsxs("div",{className:"sprint10-replay-controls",children:[de.jsx("div",{className:"sprint10-seg",role:"group","aria-label":"再生の速さ",children:Gb.map(([S,v])=>de.jsx("button",{type:"button","aria-pressed":s===v,onClick:()=>o(v),children:S},S))}),de.jsxs("div",{className:"sprint10-stepper",role:"group","aria-label":"1コマ送り",children:[de.jsx("button",{type:"button","aria-label":"1コマ戻る",onClick:()=>$(-1),children:"◀"}),de.jsx("span",{"aria-hidden":"true",children:"1コマ"}),de.jsx("button",{type:"button","aria-label":"1コマ進む",onClick:()=>$(1),children:"▶"})]})]}),de.jsx("div",{ref:m,className:"sprint10-events sprint10-chips",role:"group","aria-label":"判定した瞬間へ移動",children:n.map((S,v)=>de.jsxs("button",{type:"button","aria-label":`${S.label} ${S.pts.toFixed(3)}秒`,"aria-pressed":f===v,onClick:()=>w(S.pts),children:[S.short,de.jsx("small",{children:S.pts.toFixed(3)})]},`${S.label}${S.pts}`))})]})}export{cb as A,iw as C,Xb as L,Ob as M,gb as P,Dp as S,db as a,Zb as b,ew as c,tw as d,rw as e,Pm as f,Mb as g,Y0 as h,pa as i,hb as j,Kb as k,xb as l,Yb as m,Eb as n,kb as o,Tb as p,Cb as q,yi as r,Ab as s,Sb as t,Qb as u,je as v,Up as w,Jb as x,Nm as y,U_ as z};
