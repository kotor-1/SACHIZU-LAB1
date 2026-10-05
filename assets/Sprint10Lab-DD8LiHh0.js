import{r as ee,j as I}from"./index-D40D0H6I.js";import{S as eu,d as xy,t as Sy}from"./video-orientation-DNKyXU7h.js";import{d as ky,u as Ht,M as Br,U as gp,b as Ty}from"./camera-geometry-lxr1txgr.js";import{C as Ey,d as Iy}from"./camera-clock-so2zI1mg.js";import{P as tu,n as ru}from"./pose-drawing-B2NT6tnK.js";const Cy="sprint10-experimental-v10",ha=["歩数は、2本のラインの間に経過した脚の入れ替わり（遊脚が支持脚を追い越す動き）の周期の数です。ライン上の半端な1歩は周期の割合で数えます。接地回数を1つずつ数えた値ではありません。","各歩の距離は骨盤の画面内移動をライン間隔（既知の距離）で比例換算した推定です。真の全身重心・接地位置間の距離ではなく、遠近やカメラの揺れも補正していません。"],xn=e=>{const t=[...e].sort((r,n)=>r-n);return t.length?t[Math.floor(t.length/2)]:0};function zy(e){const t=n=>{const i=[...n].sort((s,o)=>s-o),a=Math.floor(i.length/2);return i.length?i.length%2?i[a]:(i[a-1]+i[a])/2:0},r=t(e);return t(e.filter(n=>n<=fa[1]*r+Na))}const en=e=>!!e&&Number.isFinite(e.x)&&Number.isFinite(e.y)&&e.x>0&&e.x<1&&e.y>0&&e.y<1&&(e.visibility??0)>=.3,Na=1e-9,Re=(e,t)=>e-t>Na;function On(e){const t=[];for(let r=1;r<e.length;r++)e[r].hipX!==null&&e[r-1].hipX!==null&&t.push(e[r].pts-e[r-1].pts);return Math.max(.05,2.5*(t.length?xn(t):0))}const Ay=.2;function yp(e,t=On(e),r=0){const n=new Map;for(let i=1;i<e.length;i++)n.set(e[i],e[i-1]);return(i,a)=>!Re(a.pts-i.pts,t)||n.get(a)===i&&!Re(a.pts-i.pts,r)}const Yt=(e,t)=>t-e>Na,Sn=.65,My=.025,fa=[.7,1.5];function si(e,t,r,n){const i=[23,24].every(o=>en(e[o])),a=[23,24,25,26,27,28].every(o=>en(e[o])),s=(o,l)=>Math.hypot((e[o].x-e[l].x)*n,e[o].y-e[l].y);return{frame:t,pts:r,hipX:i?(e[23].x+e[24].x)/2:null,ankleGap:[27,28].every(o=>en(e[o]))?Math.abs(e[27].x-e[28].x)*n:null,kneeGap:[25,26].every(o=>en(e[o]))?Math.abs(e[25].x-e[26].x)*n:null,legLength:a?(s(23,25)+s(25,27)+s(24,26)+s(26,28))/2:null}}function Ny(e,t,r,n=yp(e)){const i=[],a=e.filter(s=>s.hipX!==null);for(let s=1;s<a.length;s++){const o=a[s-1],l=a[s],d=(o.hipX-t)*r,c=(l.hipX-t)*r;if(d>0||c<=0||!n(o,l))continue;const h=a.some(m=>m.pts<=o.pts&&!Re(o.pts-m.pts,.15)&&(m.hipX-t)*r<-.003),f=a.some(m=>m.pts>=l.pts&&!Re(m.pts-l.pts,.15)&&(m.hipX-t)*r>.003);if(!h||!f)continue;const g=o.pts+-d/(c-d)*(l.pts-o.pts);(!i.length||Re(g-i.at(-1).pts,.15))&&i.push({pts:g,before:o.pts,after:l.pts,frame:l.frame})}return i}function Oy(e,t,r=On(e)){const n=t?e.filter(v=>!Yt(v.pts,t.startPts)&&!Re(v.pts,t.finishPts)):e,i=xn(n.flatMap(v=>v.legLength!==null&&v.legLength>.01?[v.legLength]:[]));if(!i)return{events:[],gaps:[]};const s=(t?e.filter(v=>!Yt(v.pts,t.startPts-Sn)&&!Re(v.pts,t.finishPts+Sn)):e).filter(v=>v.ankleGap!==null&&v.kneeGap!==null),o=v=>v.map(E=>({...E,value:xn(v.filter(z=>!Re(Math.abs(z.pts-E.pts),My)).map(z=>z.ankleGap/i))})),l=o(s),c=(t?o(n.filter(v=>v.ankleGap!==null&&v.kneeGap!==null)):l).map(v=>v.value).sort((v,E)=>v-E),h=c[Math.floor(c.length*.9)]??0;if(h<.2)return{events:[],gaps:[]};const f=h*.55,g=h*.3,m=[],b=[];let x=!1,$=null,w=null,S=[];for(const v of l){const E=w;if(w&&Re(v.pts-w.pts,r)&&(b.push([w.pts,v.pts]),x=!1,$=null,S=[]),w=v,!x){v.value>=(f+g)/2&&(x=!0);continue}if(v.value<=g&&(!$||v.value<$.value)?($=v,S=[v]):$&&v.value===$.value&&S.at(-1)===E&&S.push(v),$&&v.value>=f){const M=s.filter(B=>!Re(Math.abs(B.pts-$.pts),.06)).some(B=>B.kneeGap/i<.4),k=S[S.length-1>>1]??$;M&&(!m.length||!Yt(k.pts-m.at(-1).pts,.12))&&m.push({pts:k.pts,frame:k.frame}),$=null,S=[]}}return{events:m,gaps:b}}function Ry(e,t,r,n,i,a,s=10,o=On(e)){const l=[];for(let d=1;d<t.length;d++){const c=t[d-1],h=t[d],f=e.find(S=>S.frame===c.frame&&S.pts===c.pts),g=e.find(S=>S.frame===h.frame&&S.pts===h.pts),b=e.filter(S=>S.pts>=c.pts&&S.pts<=h.pts).filter(S=>S.hipX!==null&&Number.isFinite(S.hipX)&&S.ankleGap!==null&&S.kneeGap!==null).map(S=>S.pts),x=h.pts-c.pts;let $=null;Yt(c.pts,i)||Re(h.pts,a)?$="区間外を含むため未算出":Yt(x,.12)||Re(x,Sn)?$="入れ替わり周期を確認できません":f?.hipX==null||g?.hipX==null||!Number.isFinite(f.hipX)||!Number.isFinite(g.hipX)?$="端点の骨盤位置がありません":(!b.length||Re(b[0]-c.pts,o)||Re(h.pts-b.at(-1),o)||b.some((S,v)=>v>0&&Re(S-b[v-1],o)))&&($="この区間の追跡が途切れています");const w=f?.hipX!=null&&g?.hipX!=null?s*(g.hipX-f.hipX)/(n-r):NaN;!$&&(!Number.isFinite(w)||w<=0||w>10)&&($="進行方向の移動距離を確認できません"),l.push({fromStep:d,toStep:d+1,fromPts:c.pts,toPts:h.pts,fromHipX:f?.hipX??null,toHipX:g?.hipX??null,distanceM:$?null:w,reason:$})}return l}const By={standing:{noFinish:"ゴール通過を確認できません。ゴールラインの位置と、ゴールを越えた後まで選手が映っているかを確認してください。",startGap:"スタートラインを越える瞬間の追跡が途切れています。スタート付近が隠れない位置から撮影してください。",noStart:"スタートラインより後ろにいる選手を確認できません。ラインを選手の立ち位置より少し後ろに置くか、走り出す前から映った動画を使ってください。"},flying:{noFinish:"出口の線の通過を確認できません。選手が出口の線を越えるまで動画が続いているか、出口の付近で選手が他の人と重なっていないか確認してください。",startGap:"入口の線を越える瞬間の追跡が途切れています。入口の付近で選手が他の人や物に隠れていないか確認してください。",noStart:"入口の線を越える選手を捉えられませんでした。入口の付近で選手が他の人と重なっている場合や、線を越えた後0.1秒以上、体が画面の外にかかっている場合は測れません。"}},Dy=.25,Py=.1,bp=.2,Ly=.08,Uy=.006;function _p(e){let t=e;for(let r=0;r<3;r++){if(t.length<3)return null;const n=t.reduce((c,h)=>c+h.pts,0)/t.length,i=t.reduce((c,h)=>c+h.hipX,0)/t.length,a=t.reduce((c,h)=>c+(h.pts-n)**2,0);if(!(a>0))return null;const s=t.reduce((c,h)=>c+(h.pts-n)*(h.hipX-i),0)/a,o=t.map(c=>Math.abs(c.hipX-(i+s*(c.pts-n)))),l=1.4826*xn(o),d=t.filter((c,h)=>o[h]<=Math.max(Uy,3*l));if(d.length===t.length||d.length<3||r===2)return{mt:n,mx:i,speed:s,used:t};t=d}return null}function nu(e,t,r,n){let i=n.pts;for(let a=0;a<3;a++){const s=_p(e.filter(d=>!Re(Math.abs(d.pts-i),Ly)));if(!s||!(s.speed*r>=bp)||s.used.length<5)return n;const o=s.mt+(t-s.mx)/s.speed;if(o<s.used[0].pts||o>s.used.at(-1).pts)return n;const l=Math.abs(o-i)<.001;if(i=o,l)break}return{...n,pts:i}}function iu(e,t,r,n,i,a){const s=n==="entry"?e:[...e].reverse(),o=[s[0]];for(const g of s.slice(1)){const[m,b]=n==="entry"?[o.at(-1),g]:[g,o.at(-1)];if(!a(m,b)||Re(Math.abs(g.pts-o[0].pts),Dy))break;o.push(g)}if(o.length<3||Yt(Math.abs(o.at(-1).pts-o[0].pts),.05))return null;const l=_p(o);if(!l||!(l.speed*r>=bp))return null;const d=n==="entry"?l.used.reduce((g,m)=>m.pts<g.pts?m:g):l.used.reduce((g,m)=>m.pts>g.pts?m:g),c=l.mt+(t-l.mx)/l.speed,h=Math.abs(d.pts-c);return!((d.hipX-t)*r*(n==="entry"?1:-1)>0)||Re(h,Py)||c<i[0]||c>i[1]?null:n==="entry"?{pts:c,before:c,after:d.pts,frame:d.frame,extendedSeconds:h}:{pts:c,before:d.pts,after:c,frame:d.frame,extendedSeconds:h}}const jy=.6;function qy(e,t,r,n){const i=e.events.filter($=>!Yt($.pts,r-1)&&!Re($.pts,n+1)),a=$=>$.slice(1).map((w,S)=>w.pts-$[S].pts),s=zy(t.length>=3?a(t):a(i));if(!(s>0))return null;const o=[...t];let l=0;for(;;){const $=o.slice(1).map((E,z)=>E.pts-o[z].pts),w=$.reduce((E,z,M)=>z<$[E]?M:E,0);if(!$.length||$[w]>=jy*s)break;const S=w>0?$[w-1]:1/0,v=w+1<$.length?$[w+1]:1/0;o.splice(Math.abs(S+$[w]-s)<Math.abs(v+$[w]-s)?w:w+1,1),l++}const d=o.slice(1).map(($,w)=>($.pts-o[w].pts)/s),c=d.map($=>$<=fa[1]+1e-9?1:Math.max(2,Math.round($))),h=d.some(($,w)=>c[w]>=2&&Math.abs($-c[w])>.35);if(!o.length)return{count:(n-r)/s,steps:o,multiples:c,edges:null,estimatedEdges:[!1,!1],ambiguous:h,removed:l,cycle:s};const f=e.events.filter($=>$.pts<=r).at(-1),g=e.events.find($=>$.pts>=n),m=($,w)=>{const S=$?Math.abs(w.pts-$.pts):NaN;return $&&!Re(S,Sn)&&S/s<=fa[1]&&!e.gaps.some(([E,z])=>E<Math.max(w.pts,$.pts)&&z>Math.min(w.pts,$.pts))?S:s},b=(o[0].pts-r)/m(f,o[0]),x=(n-o.at(-1).pts)/m(g,o.at(-1));return{count:c.reduce(($,w)=>$+w,0)+b+x,steps:o,multiples:c,edges:[b,x],estimatedEdges:[b>1+1e-9,x>1+1e-9],ambiguous:h,removed:l,cycle:s}}const Wy=.02;function Fy(e){const t=e.filter(n=>n.hipX!==null),r=new Set;for(const n of t){const i=t.filter(d=>d!==n&&!Re(Math.abs(d.pts-n.pts),.1));if(i.length<4)continue;const a=i.reduce((d,c)=>d+c.pts,0)/i.length,s=i.reduce((d,c)=>d+c.hipX,0)/i.length,o=i.reduce((d,c)=>d+(c.pts-a)**2,0),l=o>0?i.reduce((d,c)=>d+(c.pts-a)*(c.hipX-s),0)/o:0;Math.abs(n.hipX-(s+l*(n.pts-a)))>Wy&&r.add(n)}return r.size?e.map(n=>r.has(n)?{...n,hipX:null}:n):e}function wp(e,t,r,n=10,i="standing",a=0){const s=By[i],o={start:null,finish:null,duration:null,steps:[],count:null,speed:null,cadence:null,stride:null,edgeFractions:null,strideIntervals:[],warnings:[],reason:null};if(![t,r].every(j=>Number.isFinite(j)&&j>0&&j<1)||Math.abs(r-t)<.1)return{...o,reason:"スタートとゴールを離して設定してください。"};if(!e.length||e.some((j,K)=>!Number.isFinite(j.pts)||K>0&&j.pts<=e[K-1].pts))return{...o,reason:"動画の時刻を確認できません。"};const l=Math.sign(r-t),d=i==="flying"?Fy(e):e,c=d.filter(j=>j.hipX!==null),h=[e[0].pts,e.at(-1).pts],f=On(d),g=yp(d,f,a),m=Ny(d,r,l,g);if(!m.length&&i==="flying"){let j=c.length-1;for(;j>=0&&(c[j].hipX-r)*l>0;)j--;const K=j<0?null:iu(c.slice(0,j+1),r,l,"exit",h,g);K&&m.push(K)}if(!m.length)return{...o,reason:s.noFinish};let b=null,x=null,$=!1;for(const j of m){const K=c.filter(ie=>ie.pts<j.pts);let J=K.length-1;for(;J>=0&&(K[J].hipX-t)*l>0;)J--;if(J===K.length-1)continue;const L=K[J],re=K[J+1];if(J<0||!g(L,re)){const ie=i==="flying"?iu(K.slice(J+1),t,l,"entry",h,g):null;if(ie){b=ie,x=j;break}J>=0&&($=!0);continue}const C=(L.hipX-t)*l,R=(re.hipX-t)*l;b={pts:L.pts+-C/(R-C)*(re.pts-L.pts),before:L.pts,after:re.pts,frame:re.frame},x=j;break}if(i==="flying"&&b&&x&&(b.extendedSeconds||(b=nu(c,t,l,b)),x.extendedSeconds||(x=nu(c,r,l,x))),!b||!x)return{...o,reason:$?s.startGap:s.noStart};const w=x.pts-b.pts,S=m.filter(j=>j.pts>x.pts+1),v=Oy(e,{startPts:b.pts,finishPts:x.pts},f),E=b.extendedSeconds?b.after:b.pts,z=x.extendedSeconds?x.before:x.pts,M=e.filter(j=>j.pts>=E&&j.pts<=z),k=M.filter(j=>j.ankleGap!==null&&j.kneeGap!==null).length/Math.max(1,M.length),B=[E,...M.filter(j=>j.ankleGap!==null&&j.kneeGap!==null).map(j=>j.pts),z],U=k<.9||v.gaps.some(([j,K])=>j<z&&K>E)||B.some((j,K)=>K>0&&Re(j-B[K-1],f)),G=v.events.filter(j=>j.pts>b.pts&&j.pts<x.pts),V=qy(v,G,b.pts,x.pts),Z=V?.count??null,O=[...ha];if(!V)O.unshift("脚の入れ替わりを2回以上捉えられなかったため、歩数・ピッチ・歩幅を出せません。");else{const j=[];V.removed&&j.push(`入れ替わりの誤検出と思われるもの（${V.removed}回）を除いて数えました。`),V.steps.length||j.push(`区間内の入れ替わりを捉えられなかったため、歩数は周期（${V.cycle.toFixed(3)}秒）から推定しました。`);const K=V.multiples.reduce((J,L)=>J+L-1,0);K===1?j.push("脚の入れ替わりを1回見逃した区間があり、周期の長さから2歩分として数えました。"):K>1&&j.push(`脚の入れ替わりを${K}回見逃した区間があり、周期の長さから数えました。`),V.estimatedEdges[0]&&j.push(`入口の直後の入れ替わりが映っていないため、その部分は周期（${V.cycle.toFixed(3)}秒）から推定しました。`),V.estimatedEdges[1]&&j.push(`出口の直前の入れ替わりが映っていないため、その部分は周期（${V.cycle.toFixed(3)}秒）から推定しました。`),V.ambiguous&&j.push("1歩分とも2歩分とも決めにくい周期があり、歩数が1歩ずれている可能性があります。"),U&&!K&&!V.estimatedEdges.some(Boolean)&&j.push("脚が映っていない時間がありますが、その前後の入れ替わりの間隔は通常の周期でした。"),O.unshift(...j)}S.length&&O.unshift("ゴールを2回以上越えています。最初の走りを解析しました。");const P=(j,K,J)=>`${j}の線を越える瞬間の骨盤は映っていない（体が画面の端にかかる・隠れる）ため、${J}の動きを${Math.round(K.extendedSeconds*1e3)}ミリ秒延ばして通過時刻を推定しました。`;x.extendedSeconds&&O.unshift(P("出口",x,"直前")),b.extendedSeconds&&O.unshift(P("入口",b,"直後"));const H=V?.steps??G,Y=V?.multiples??[];return{...o,start:b,finish:x,duration:w,speed:n/w,steps:H,count:Z,edgeFractions:V?.edges??null,strideIntervals:Ry(e,H,t,r,b.pts,x.pts,n,f).map((j,K)=>(Y[K]??1)>1?{...j,distanceM:null,reason:`入れ替わりの見逃しで${Y[K]}歩分の区間です`}:j),cadence:Z===null?null:Z/w,stride:Z===null?null:n/Z,warnings:O}}var Oa=Object.defineProperty,Gy=Object.getOwnPropertyDescriptor,Vy=Object.getOwnPropertyNames,Hy=Object.prototype.hasOwnProperty,Ky=(e=>typeof require<"u"?require:typeof Proxy<"u"?new Proxy(e,{get:(t,r)=>(typeof require<"u"?require:t)[r]}):e)(function(e){if(typeof require<"u")return require.apply(this,arguments);throw Error('Dynamic require of "'+e+'" is not supported')}),X=(e,t)=>()=>(e&&(t=e(e=0)),t),fr=(e,t)=>{for(var r in t)Oa(e,r,{get:t[r],enumerable:!0})},Xy=(e,t,r,n)=>{if(t&&typeof t=="object"||typeof t=="function")for(let i of Vy(t))!Hy.call(e,i)&&i!==r&&Oa(e,i,{get:()=>t[i],enumerable:!(n=Gy(t,i))||n.enumerable});return e},Lr=e=>Xy(Oa({},"__esModule",{value:!0}),e),wr,zt,lr,au,$p,vp=X(()=>{wr=new Map,zt=[],lr=(e,t,r)=>{if(t&&typeof t.init=="function"&&typeof t.createInferenceSessionHandler=="function"){let n=wr.get(e);if(n===void 0)wr.set(e,{backend:t,priority:r});else{if(n.priority>r)return;if(n.priority===r&&n.backend!==t)throw new Error(`cannot register backend "${e}" using priority ${r}`)}if(r>=0){let i=zt.indexOf(e);i!==-1&&zt.splice(i,1);for(let a=0;a<zt.length;a++)if(wr.get(zt[a]).priority<=r){zt.splice(a,0,e);return}zt.push(e)}return}throw new TypeError("not a valid backend")},au=async e=>{let t=wr.get(e);if(!t)return"backend not found.";if(t.initialized)return t.backend;if(t.aborted)return t.error;{let r=!!t.initPromise;try{return r||(t.initPromise=t.backend.init(e)),await t.initPromise,t.initialized=!0,t.backend}catch(n){return r||(t.error=`${n}`,t.aborted=!0),t.error}finally{delete t.initPromise}}},$p=async e=>{let t=e.executionProviders||[],r=t.map(l=>typeof l=="string"?l:l.name),n=r.length===0?zt:r,i,a=[],s=new Set;for(let l of n){let d=await au(l);typeof d=="string"?a.push({name:l,err:d}):(i||(i=d),i===d&&s.add(l))}if(!i)throw new Error(`no available backend found. ERR: ${a.map(l=>`[${l.name}] ${l.err}`).join(", ")}`);for(let{name:l,err:d}of a)r.includes(l)&&console.warn(`removing requested execution provider "${l}" from session options because it is not available: ${d}`);let o=t.filter(l=>s.has(typeof l=="string"?l:l.name));return[i,new Proxy(e,{get:(l,d)=>d==="executionProviders"?o:Reflect.get(l,d)})]}}),Zy=X(()=>{vp()}),xp,Yy=X(()=>{xp="1.27.0"}),oi,Pe,Sp=X(()=>{Yy(),oi="warning",Pe={wasm:{},webgl:{},webgpu:{},versions:{common:xp},set logLevel(e){if(e!==void 0){if(typeof e!="string"||["verbose","info","warning","error","fatal"].indexOf(e)===-1)throw new Error(`Unsupported logging level: ${e}`);oi=e}},get logLevel(){return oi}},Object.defineProperty(Pe,"logLevel",{enumerable:!0})}),Ee,Qy=X(()=>{Sp(),Ee=Pe}),kp,Tp,Jy=X(()=>{kp=(e,t)=>{let r=typeof document<"u"?document.createElement("canvas"):new OffscreenCanvas(1,1);r.width=e.dims[3],r.height=e.dims[2];let n=r.getContext("2d");if(n!=null){let i,a;t?.tensorLayout!==void 0&&t.tensorLayout==="NHWC"?(i=e.dims[2],a=e.dims[3]):(i=e.dims[3],a=e.dims[2]);let s=t?.format!==void 0?t.format:"RGB",o=t?.norm,l,d;o===void 0||o.mean===void 0?l=[255,255,255,255]:typeof o.mean=="number"?l=[o.mean,o.mean,o.mean,o.mean]:(l=[o.mean[0],o.mean[1],o.mean[2],0],o.mean[3]!==void 0&&(l[3]=o.mean[3])),o===void 0||o.bias===void 0?d=[0,0,0,0]:typeof o.bias=="number"?d=[o.bias,o.bias,o.bias,o.bias]:(d=[o.bias[0],o.bias[1],o.bias[2],0],o.bias[3]!==void 0&&(d[3]=o.bias[3]));let c=a*i,h=0,f=c,g=c*2,m=-1;s==="RGBA"?(h=0,f=c,g=c*2,m=c*3):s==="RGB"?(h=0,f=c,g=c*2):s==="RBG"&&(h=0,g=c,f=c*2);for(let b=0;b<a;b++)for(let x=0;x<i;x++){let $=(e.data[h++]-d[0])*l[0],w=(e.data[f++]-d[1])*l[1],S=(e.data[g++]-d[2])*l[2],v=m===-1?255:(e.data[m++]-d[3])*l[3];n.fillStyle="rgba("+$+","+w+","+S+","+v+")",n.fillRect(x,b,1,1)}if("toDataURL"in r)return r.toDataURL();throw new Error("toDataURL is not supported")}else throw new Error("Can not access image data")},Tp=(e,t)=>{let r=typeof document<"u"?document.createElement("canvas").getContext("2d"):new OffscreenCanvas(1,1).getContext("2d"),n;if(r!=null){let i,a,s;t?.tensorLayout!==void 0&&t.tensorLayout==="NHWC"?(i=e.dims[2],a=e.dims[1],s=e.dims[3]):(i=e.dims[3],a=e.dims[2],s=e.dims[1]);let o=t!==void 0&&t.format!==void 0?t.format:"RGB",l=t?.norm,d,c;l===void 0||l.mean===void 0?d=[255,255,255,255]:typeof l.mean=="number"?d=[l.mean,l.mean,l.mean,l.mean]:(d=[l.mean[0],l.mean[1],l.mean[2],255],l.mean[3]!==void 0&&(d[3]=l.mean[3])),l===void 0||l.bias===void 0?c=[0,0,0,0]:typeof l.bias=="number"?c=[l.bias,l.bias,l.bias,l.bias]:(c=[l.bias[0],l.bias[1],l.bias[2],0],l.bias[3]!==void 0&&(c[3]=l.bias[3]));let h=a*i;if(t!==void 0&&(t.format!==void 0&&s===4&&t.format!=="RGBA"||s===3&&t.format!=="RGB"&&t.format!=="BGR"))throw new Error("Tensor format doesn't match input tensor dims");let f=4,g=0,m=1,b=2,x=3,$=0,w=h,S=h*2,v=-1;o==="RGBA"?($=0,w=h,S=h*2,v=h*3):o==="RGB"?($=0,w=h,S=h*2):o==="RBG"&&($=0,S=h,w=h*2),n=r.createImageData(i,a);for(let E=0;E<a*i;g+=f,m+=f,b+=f,x+=f,E++)n.data[g]=(e.data[$++]-c[0])*d[0],n.data[m]=(e.data[w++]-c[1])*d[1],n.data[b]=(e.data[S++]-c[2])*d[2],n.data[x]=v===-1?255:(e.data[v++]-c[3])*d[3]}else throw new Error("Can not access image data");return n}}),tn,Ep,Ip,Cp,zp,Ap,eb=X(()=>{Ra(),tn=(e,t)=>{if(e===void 0)throw new Error("Image buffer must be defined");if(t.height===void 0||t.width===void 0)throw new Error("Image height and width must be defined");if(t.tensorLayout==="NHWC")throw new Error("NHWC Tensor layout is not supported yet");let{height:r,width:n}=t,i=t.norm??{mean:255,bias:0},a,s;typeof i.mean=="number"?a=[i.mean,i.mean,i.mean,i.mean]:a=[i.mean[0],i.mean[1],i.mean[2],i.mean[3]??255],typeof i.bias=="number"?s=[i.bias,i.bias,i.bias,i.bias]:s=[i.bias[0],i.bias[1],i.bias[2],i.bias[3]??0];let o=t.format!==void 0?t.format:"RGBA",l=t.tensorFormat!==void 0&&t.tensorFormat!==void 0?t.tensorFormat:"RGB",d=r*n,c=l==="RGBA"?new Float32Array(d*4):new Float32Array(d*3),h=4,f=0,g=1,m=2,b=3,x=0,$=d,w=d*2,S=-1;o==="RGB"&&(h=3,f=0,g=1,m=2,b=-1),l==="RGBA"?S=d*3:l==="RBG"?(x=0,w=d,$=d*2):l==="BGR"&&(w=0,$=d,x=d*2);for(let v=0;v<d;v++,f+=h,m+=h,g+=h,b+=h)c[x++]=(e[f]+s[0])/a[0],c[$++]=(e[g]+s[1])/a[1],c[w++]=(e[m]+s[2])/a[2],S!==-1&&b!==-1&&(c[S++]=(e[b]+s[3])/a[3]);return l==="RGBA"?new Ke("float32",c,[1,4,r,n]):new Ke("float32",c,[1,3,r,n])},Ep=async(e,t)=>{let r=typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement,n=typeof ImageData<"u"&&e instanceof ImageData,i=typeof ImageBitmap<"u"&&e instanceof ImageBitmap,a=typeof e=="string",s,o=t??{},l=()=>{if(typeof document<"u")return document.createElement("canvas");if(typeof OffscreenCanvas<"u")return new OffscreenCanvas(1,1);throw new Error("Canvas is not supported")},d=c=>typeof HTMLCanvasElement<"u"&&c instanceof HTMLCanvasElement||c instanceof OffscreenCanvas?c.getContext("2d"):null;if(r){let c=l();c.width=e.width,c.height=e.height;let h=d(c);if(h!=null){let f=e.height,g=e.width;if(t!==void 0&&t.resizedHeight!==void 0&&t.resizedWidth!==void 0&&(f=t.resizedHeight,g=t.resizedWidth),t!==void 0){if(o=t,t.tensorFormat!==void 0)throw new Error("Image input config format must be RGBA for HTMLImageElement");o.tensorFormat="RGBA",o.height=f,o.width=g}else o.tensorFormat="RGBA",o.height=f,o.width=g;h.drawImage(e,0,0),s=h.getImageData(0,0,g,f).data}else throw new Error("Can not access image data")}else if(n){let c,h;if(t!==void 0&&t.resizedWidth!==void 0&&t.resizedHeight!==void 0?(c=t.resizedHeight,h=t.resizedWidth):(c=e.height,h=e.width),t!==void 0&&(o=t),o.format="RGBA",o.height=c,o.width=h,t!==void 0){let f=l();f.width=h,f.height=c;let g=d(f);if(g!=null)g.putImageData(e,0,0),s=g.getImageData(0,0,h,c).data;else throw new Error("Can not access image data")}else s=e.data}else if(i){if(t===void 0)throw new Error("Please provide image config with format for Imagebitmap");let c=l();c.width=e.width,c.height=e.height;let h=d(c);if(h!=null){let f=e.height,g=e.width;return h.drawImage(e,0,0,g,f),s=h.getImageData(0,0,g,f).data,o.height=f,o.width=g,tn(s,o)}else throw new Error("Can not access image data")}else{if(a)return new Promise((c,h)=>{let f=l(),g=d(f);if(!e||!g)return h();let m=new Image;m.crossOrigin="Anonymous",m.src=e,m.onload=()=>{f.width=m.width,f.height=m.height,g.drawImage(m,0,0,f.width,f.height);let b=g.getImageData(0,0,f.width,f.height);o.height=f.height,o.width=f.width,c(tn(b.data,o))}});throw new Error("Input data provided is not supported - aborted tensor creation")}if(s!==void 0)return tn(s,o);throw new Error("Input data provided is not supported - aborted tensor creation")},Ip=(e,t)=>{let{width:r,height:n,download:i,dispose:a}=t,s=[1,n,r,4];return new Ke({location:"texture",type:"float32",texture:e,dims:s,download:i,dispose:a})},Cp=(e,t)=>{let{dataType:r,dims:n,download:i,dispose:a}=t;return new Ke({location:"gpu-buffer",type:r??"float32",gpuBuffer:e,dims:n,download:i,dispose:a})},zp=(e,t)=>{let{dataType:r,dims:n,download:i,dispose:a}=t;return new Ke({location:"ml-tensor",type:r??"float32",mlTensor:e,dims:n,download:i,dispose:a})},Ap=(e,t,r)=>new Ke({location:"cpu-pinned",type:e,data:t,dims:r??[t.length]})}),Kt,Mr,ui,Mp,tb=X(()=>{Kt=new Map([["float32",Float32Array],["uint8",Uint8Array],["int8",Int8Array],["uint16",Uint16Array],["int16",Int16Array],["int32",Int32Array],["bool",Uint8Array],["float64",Float64Array],["uint32",Uint32Array],["int4",Uint8Array],["uint4",Uint8Array]]),Mr=new Map([[Float32Array,"float32"],[Uint8Array,"uint8"],[Int8Array,"int8"],[Uint16Array,"uint16"],[Int16Array,"int16"],[Int32Array,"int32"],[Float64Array,"float64"],[Uint32Array,"uint32"]]),ui=!1,Mp=()=>{if(!ui){ui=!0;let e=typeof BigInt64Array<"u"&&BigInt64Array.from,t=typeof BigUint64Array<"u"&&BigUint64Array.from,r=globalThis.Float16Array,n=typeof r<"u"&&r.from;e&&(Kt.set("int64",BigInt64Array),Mr.set(BigInt64Array,"int64")),t&&(Kt.set("uint64",BigUint64Array),Mr.set(BigUint64Array,"uint64")),n?(Kt.set("float16",r),Mr.set(r,"float16")):Kt.set("float16",Uint16Array)}}}),Np,Op,rb=X(()=>{Ra(),Np=e=>{let t=1;for(let r=0;r<e.length;r++){let n=e[r];if(typeof n!="number"||!Number.isSafeInteger(n))throw new TypeError(`dims[${r}] must be an integer, got: ${n}`);if(n<0)throw new RangeError(`dims[${r}] must be a non-negative integer, got: ${n}`);t*=n}return t},Op=(e,t)=>{switch(e.location){case"cpu":return new Ke(e.type,e.data,t);case"cpu-pinned":return new Ke({location:"cpu-pinned",data:e.data,type:e.type,dims:t});case"texture":return new Ke({location:"texture",texture:e.texture,type:e.type,dims:t});case"gpu-buffer":return new Ke({location:"gpu-buffer",gpuBuffer:e.gpuBuffer,type:e.type,dims:t});case"ml-tensor":return new Ke({location:"ml-tensor",mlTensor:e.mlTensor,type:e.type,dims:t});default:throw new Error(`tensorReshape: tensor location ${e.location} is not supported`)}}}),Ke,Ra=X(()=>{Jy(),eb(),tb(),rb(),Ke=class{constructor(e,t,r){Mp();let n,i;if(typeof e=="object"&&"location"in e)switch(this.dataLocation=e.location,n=e.type,i=e.dims,e.location){case"cpu-pinned":{let s=Kt.get(n);if(!s)throw new TypeError(`unsupported type "${n}" to create tensor from pinned buffer`);if(!(e.data instanceof s))throw new TypeError(`buffer should be of type ${s.name}`);this.cpuData=e.data;break}case"texture":{if(n!=="float32")throw new TypeError(`unsupported type "${n}" to create tensor from texture`);this.gpuTextureData=e.texture,this.downloader=e.download,this.disposer=e.dispose;break}case"gpu-buffer":{if(n!=="float32"&&n!=="float16"&&n!=="int32"&&n!=="int64"&&n!=="uint32"&&n!=="uint8"&&n!=="bool"&&n!=="uint4"&&n!=="int4")throw new TypeError(`unsupported type "${n}" to create tensor from gpu buffer`);this.gpuBufferData=e.gpuBuffer,this.downloader=e.download,this.disposer=e.dispose;break}case"ml-tensor":{if(n!=="float32"&&n!=="float16"&&n!=="int32"&&n!=="int64"&&n!=="uint32"&&n!=="uint64"&&n!=="int8"&&n!=="uint8"&&n!=="bool"&&n!=="uint4"&&n!=="int4")throw new TypeError(`unsupported type "${n}" to create tensor from MLTensor`);this.mlTensorData=e.mlTensor,this.downloader=e.download,this.disposer=e.dispose;break}default:throw new Error(`Tensor constructor: unsupported location '${this.dataLocation}'`)}else{let s,o;if(typeof e=="string")if(n=e,o=r,e==="string"){if(!Array.isArray(t))throw new TypeError("A string tensor's data must be a string array.");s=t}else{let l=Kt.get(e);if(l===void 0)throw new TypeError(`Unsupported tensor type: ${e}.`);if(Array.isArray(t)){if(e==="float16"&&l===Uint16Array||e==="uint4"||e==="int4")throw new TypeError(`Creating a ${e} tensor from number array is not supported. Please use ${l.name} as data.`);e==="uint64"||e==="int64"?s=l.from(t,BigInt):s=l.from(t)}else if(t instanceof l)s=t;else if(t instanceof Uint8ClampedArray)if(e==="uint8")s=Uint8Array.from(t);else throw new TypeError("A Uint8ClampedArray tensor's data must be type of uint8");else if(e==="float16"&&t instanceof Uint16Array&&l!==Uint16Array)s=new globalThis.Float16Array(t.buffer,t.byteOffset,t.length);else throw new TypeError(`A ${n} tensor's data must be type of ${l}`)}else if(o=t,Array.isArray(e)){if(e.length===0)throw new TypeError("Tensor type cannot be inferred from an empty array.");let l=typeof e[0];if(l==="string")n="string",s=e;else if(l==="boolean")n="bool",s=Uint8Array.from(e);else throw new TypeError(`Invalid element type of data array: ${l}.`)}else if(e instanceof Uint8ClampedArray)n="uint8",s=Uint8Array.from(e);else{let l=Mr.get(e.constructor);if(l===void 0)throw new TypeError(`Unsupported type for tensor data: ${e.constructor}.`);n=l,s=e}if(o===void 0)o=[s.length];else if(!Array.isArray(o))throw new TypeError("A tensor's dims must be a number array");i=o,this.cpuData=s,this.dataLocation="cpu"}let a=Np(i);if(this.cpuData&&a!==this.cpuData.length&&!((n==="uint4"||n==="int4")&&Math.ceil(a/2)===this.cpuData.length))throw new Error(`Tensor's size(${a}) does not match data length(${this.cpuData.length}).`);this.type=n,this.dims=i,this.size=a}static async fromImage(e,t){return Ep(e,t)}static fromTexture(e,t){return Ip(e,t)}static fromGpuBuffer(e,t){return Cp(e,t)}static fromMLTensor(e,t){return zp(e,t)}static fromPinnedBuffer(e,t,r){return Ap(e,t,r)}toDataURL(e){return kp(this,e)}toImageData(e){return Tp(this,e)}get data(){if(this.ensureValid(),!this.cpuData)throw new Error("The data is not on CPU. Use `getData()` to download GPU data to CPU, or use `texture` or `gpuBuffer` property to access the GPU data directly.");return this.cpuData}get location(){return this.dataLocation}get texture(){if(this.ensureValid(),!this.gpuTextureData)throw new Error("The data is not stored as a WebGL texture.");return this.gpuTextureData}get gpuBuffer(){if(this.ensureValid(),!this.gpuBufferData)throw new Error("The data is not stored as a WebGPU buffer.");return this.gpuBufferData}get mlTensor(){if(this.ensureValid(),!this.mlTensorData)throw new Error("The data is not stored as a WebNN MLTensor.");return this.mlTensorData}async getData(e){switch(this.ensureValid(),this.dataLocation){case"cpu":case"cpu-pinned":return this.data;case"texture":case"gpu-buffer":case"ml-tensor":{if(!this.downloader)throw new Error("The current tensor is not created with a specified data downloader.");if(this.isDownloading)throw new Error("The current tensor is being downloaded.");try{this.isDownloading=!0;let t=await this.downloader();return this.downloader=void 0,this.dataLocation="cpu",this.cpuData=t,e&&this.disposer&&(this.disposer(),this.disposer=void 0),t}finally{this.isDownloading=!1}}default:throw new Error(`cannot get data from location: ${this.dataLocation}`)}}dispose(){if(this.isDownloading)throw new Error("The current tensor is being downloaded.");this.disposer&&(this.disposer(),this.disposer=void 0),this.cpuData=void 0,this.gpuTextureData=void 0,this.gpuBufferData=void 0,this.mlTensorData=void 0,this.downloader=void 0,this.isDownloading=void 0,this.dataLocation="none"}ensureValid(){if(this.dataLocation==="none")throw new Error("The tensor is disposed.")}reshape(e){if(this.ensureValid(),this.downloader||this.disposer)throw new Error("Cannot reshape a tensor that owns GPU resource.");return Op(this,e)}}}),lt,Rp=X(()=>{Ra(),lt=Ke}),kn,li,bt,dt,Qt,Jt,Bp=X(()=>{Sp(),kn=(e,t)=>{(typeof Pe.trace>"u"?!Pe.wasm.trace:!Pe.trace)||console.timeStamp(`${e}::ORT::${t}`)},li=(e,t)=>{let r=new Error().stack?.split(/\r\n|\r|\n/g)||[],n=!1;for(let i=0;i<r.length;i++){if(n&&!r[i].includes("TRACE_FUNC")){let a=`FUNC_${e}::${r[i].trim().split(" ")[1]}`;t&&(a+=`::${t}`),kn("CPU",a);return}r[i].includes("TRACE_FUNC")&&(n=!0)}},bt=e=>{(typeof Pe.trace>"u"?!Pe.wasm.trace:!Pe.trace)||li("BEGIN",e)},dt=e=>{(typeof Pe.trace>"u"?!Pe.wasm.trace:!Pe.trace)||li("END",e)},Qt=e=>{(typeof Pe.trace>"u"?!Pe.wasm.trace:!Pe.trace)||console.time(`ORT::${e}`)},Jt=e=>{(typeof Pe.trace>"u"?!Pe.wasm.trace:!Pe.trace)||console.timeEnd(`ORT::${e}`)}}),Dp,nb=X(()=>{vp(),Rp(),Bp(),Dp=class Pp{constructor(t){this.handler=t}async run(t,r,n){bt(),Qt("InferenceSession.run");let i={},a={};if(typeof t!="object"||t===null||t instanceof lt||Array.isArray(t))throw new TypeError("'feeds' must be an object that use input names as keys and OnnxValue as corresponding values.");let s=!0;if(typeof r=="object"){if(r===null)throw new TypeError("Unexpected argument[1]: cannot be null.");if(r instanceof lt)throw new TypeError("'fetches' cannot be a Tensor");if(Array.isArray(r)){if(r.length===0)throw new TypeError("'fetches' cannot be an empty array.");s=!1;for(let d of r){if(typeof d!="string")throw new TypeError("'fetches' must be a string array or an object.");if(this.outputNames.indexOf(d)===-1)throw new RangeError(`'fetches' contains invalid output name: ${d}.`);i[d]=null}if(typeof n=="object"&&n!==null)a=n;else if(typeof n<"u")throw new TypeError("'options' must be an object.")}else{let d=!1,c=Object.getOwnPropertyNames(r);for(let h of this.outputNames)if(c.indexOf(h)!==-1){let f=r[h];(f===null||f instanceof lt)&&(d=!0,s=!1,i[h]=f)}if(d){if(typeof n=="object"&&n!==null)a=n;else if(typeof n<"u")throw new TypeError("'options' must be an object.")}else a=r}}else if(typeof r<"u")throw new TypeError("Unexpected argument[1]: must be 'fetches' or 'options'.");for(let d of this.inputNames)if(typeof t[d]>"u")throw new Error(`input '${d}' is missing in 'feeds'.`);if(s)for(let d of this.outputNames)i[d]=null;let o=await this.handler.run(t,i,a),l={};for(let d in o)if(Object.hasOwnProperty.call(o,d)){let c=o[d];c instanceof lt?l[d]=c:l[d]=new lt(c.type,c.data,c.dims)}return Jt("InferenceSession.run"),dt(),l}async release(){return this.handler.dispose()}static async create(t,r,n,i){bt(),Qt("InferenceSession.create");let a,s={};if(typeof t=="string"){if(a=t,typeof r=="object"&&r!==null)s=r;else if(typeof r<"u")throw new TypeError("'options' must be an object.")}else if(t instanceof Uint8Array){if(a=t,typeof r=="object"&&r!==null)s=r;else if(typeof r<"u")throw new TypeError("'options' must be an object.")}else if(t instanceof ArrayBuffer||typeof SharedArrayBuffer<"u"&&t instanceof SharedArrayBuffer){let c=t,h=0,f=t.byteLength;if(typeof r=="object"&&r!==null)s=r;else if(typeof r=="number"){if(h=r,!Number.isSafeInteger(h))throw new RangeError("'byteOffset' must be an integer.");if(h<0||h>=c.byteLength)throw new RangeError(`'byteOffset' is out of range [0, ${c.byteLength}).`);if(f=t.byteLength-h,typeof n=="number"){if(f=n,!Number.isSafeInteger(f))throw new RangeError("'byteLength' must be an integer.");if(f<=0||h+f>c.byteLength)throw new RangeError(`'byteLength' is out of range (0, ${c.byteLength-h}].`);if(typeof i=="object"&&i!==null)s=i;else if(typeof i<"u")throw new TypeError("'options' must be an object.")}else if(typeof n<"u")throw new TypeError("'byteLength' must be a number.")}else if(typeof r<"u")throw new TypeError("'options' must be an object.");a=new Uint8Array(c,h,f)}else throw new TypeError("Unexpected argument[0]: must be 'path' or 'buffer'.");let[o,l]=await $p(s),d=await o.createInferenceSessionHandler(a,l);return Jt("InferenceSession.create"),dt(),new Pp(d)}startProfiling(){this.handler.startProfiling()}endProfiling(){this.handler.endProfiling()}get inputNames(){return this.handler.inputNames}get outputNames(){return this.handler.outputNames}get inputMetadata(){return this.handler.inputMetadata}get outputMetadata(){return this.handler.outputMetadata}}}),Ba,ib=X(()=>{nb(),Ba=Dp}),ab=X(()=>{}),sb=X(()=>{}),ob=X(()=>{}),ub=X(()=>{}),lb={};fr(lb,{InferenceSession:()=>Ba,TRACE:()=>kn,TRACE_EVENT_BEGIN:()=>Qt,TRACE_EVENT_END:()=>Jt,TRACE_FUNC_BEGIN:()=>bt,TRACE_FUNC_END:()=>dt,Tensor:()=>lt,env:()=>Ee,registerBackend:()=>lr});var Je=X(()=>{Zy(),Qy(),ib(),Rp(),ab(),sb(),Bp(),ob(),ub()}),Da=X(()=>{}),Lp={};fr(Lp,{default:()=>Up});var di,ci,Up,db=X(()=>{Vm(),nr(),Pa(),di="ort-wasm-proxy-worker",ci=globalThis.self?.name===di,ci&&(self.onmessage=e=>{let{type:t,in:r}=e.data;try{switch(t){case"init-wasm":La(r.wasm).then(()=>{rs(r).then(()=>{postMessage({type:t})},n=>{postMessage({type:t,err:n})})},n=>{postMessage({type:t,err:n})});break;case"init-ep":{let{epName:n,env:i}=r;ns(i,n).then(()=>{postMessage({type:t})},a=>{postMessage({type:t,err:a})});break}case"copy-from":{let{buffer:n}=r,i=Mn(n);postMessage({type:t,out:i});break}case"create":{let{model:n,options:i}=r;is(n,i).then(a=>{postMessage({type:t,out:a})},a=>{postMessage({type:t,err:a})});break}case"release":as(r),postMessage({type:t});break;case"run":{let{sessionId:n,inputIndices:i,inputs:a,outputIndices:s,options:o}=r;ss(n,i,a,s,new Array(s.length).fill(null),o).then(l=>{l.some(d=>d[3]!=="cpu")?postMessage({type:t,err:"Proxy does not support non-cpu tensor location."}):postMessage({type:t,out:l},us([...a,...l]))},l=>{postMessage({type:t,err:l})});break}case"end-profiling":os(r),postMessage({type:t});break;default:}}catch(n){postMessage({type:t,err:n})}}),Up=ci?null:e=>new Worker(e??Ve,{type:"module",name:di})}),jp={};fr(jp,{default:()=>qp});async function su(e={}){var t=e,r=!!globalThis.window,n=!!globalThis.WorkerGlobalScope,i=n&&self.name?.startsWith("em-pthread");t.mountExternalData=(u,p)=>{u.startsWith("./")&&(u=u.substring(2)),(t.Xc||(t.Xc=new Map)).set(u,p)},t.unmountExternalData=()=>{delete t.Xc},globalThis.SharedArrayBuffer??new WebAssembly.Memory({initial:0,maximum:0,shared:!0}).buffer.constructor;let a=u=>async(...p)=>{try{if(t.Yc)throw Error("Session already started");let _=t.Yc={Kd:p[0],errors:[]},y=await u(...p);if(t.Yc!==_)throw Error("Session mismatch");t.dd?.flush();let T=_.errors;if(0<T.length){let A=await Promise.all(T);if(A=A.filter(N=>N),0<A.length)throw Error(A.join(`
`))}return y}finally{t.Yc=null}};t.jsepInit=(u,p)=>{if(u==="webgpu"){[t.dd,t.Ad,t.Ed,t.ed,t.Dd,t.$b,t.Fd,t.Hd,t.Bd,t.Cd,t.Gd]=p;let _=t.dd;t.jsepRegisterBuffer=(y,T,A,N)=>_.registerBuffer(y,T,A,N),t.jsepGetBuffer=y=>_.getBuffer(y),t.jsepCreateDownloader=(y,T,A)=>_.createDownloader(y,T,A),t.jsepOnCreateSession=y=>{_.onCreateSession(y)},t.jsepOnReleaseSession=y=>{_.onReleaseSession(y)},t.jsepOnRunStart=y=>_.onRunStart(y),t.Id=(y,T)=>{_.upload(y,T)}}else if(u==="webnn"){let _=p[0];[t.Sd,t.sd,t.webnnEnsureTensor,t.td,t.webnnDownloadTensor,t.Rd,t.webnnEnableTraceEvent]=p.slice(1),t.webnnReleaseTensorId=t.sd,t.webnnUploadTensor=t.td,t.webnnRegisterMLContext=t.Rd,t.webnnOnRunStart=y=>_.onRunStart(y),t.webnnOnRunEnd=_.onRunEnd.bind(_),t.webnnOnReleaseSession=y=>{_.onReleaseSession(y)},t.webnnCreateMLTensorDownloader=(y,T)=>_.createMLTensorDownloader(y,T),t.webnnRegisterMLTensor=(y,T,A,N)=>_.registerMLTensor(y,T,A,N),t.webnnCreateMLContext=y=>_.createMLContext(y),t.webnnRegisterMLConstant=(y,T,A,N,q,Q)=>_.registerMLConstant(y,T,A,N,q,t.Xc,Q),t.webnnRegisterGraphInput=_.registerGraphInput.bind(_),t.webnnIsGraphInput=_.isGraphInput.bind(_),t.webnnRegisterGraphOutput=_.registerGraphOutput.bind(_),t.webnnIsGraphOutput=_.isGraphOutput.bind(_),t.webnnCreateTemporaryTensor=_.createTemporaryTensor.bind(_),t.webnnIsGraphInputOutputTypeSupported=_.isGraphInputOutputTypeSupported.bind(_)}};let s=()=>{let u=p=>(..._)=>{let y=ht;return _=p(..._),ht!=y?new Promise((T,A)=>{Hn={resolve:T,reject:A}}):_};(()=>{for(let p of["_OrtAppendExecutionProvider","_OrtCreateSession","_OrtRun","_OrtRunWithBinding","_OrtBindInput"])t[p]=u(t[p])})(),a!==void 0&&(t._OrtRun=a(t._OrtRun),t._OrtRunWithBinding=a(t._OrtRunWithBinding)),s=void 0};t.asyncInit=()=>{s?.()};var o,l,d=(u,p)=>{throw p},c=import.meta.url,h="";if(r||n){try{h=new URL(".",c).href}catch{}n&&(l=u=>{var p=new XMLHttpRequest;return p.open("GET",u,!1),p.responseType="arraybuffer",p.send(null),new Uint8Array(p.response)}),o=async u=>{if(M(u))return new Promise((_,y)=>{var T=new XMLHttpRequest;T.open("GET",u,!0),T.responseType="arraybuffer",T.onload=()=>{T.status==200||T.status==0&&T.response?_(T.response):y(T.status)},T.onerror=y,T.send(null)});var p=await fetch(u,{credentials:"same-origin"});if(p.ok)return p.arrayBuffer();throw Error(p.status+" : "+p.url)}}var f,g,m,b,x,$,w=console.log.bind(console),S=console.error.bind(console),v=w,E=S,z=!1,M=u=>u.startsWith("file://");function k(){Ue.buffer!=U.buffer&&re()}if(i){let u=function(p){try{var _=p.data,y=_.Sc;if(y==="load"){let T=[];self.onmessage=A=>T.push(A),$=()=>{postMessage({Sc:"loaded"});for(let A of T)u(A);self.onmessage=u};for(let A of _.xd)t[A]&&!t[A].proxy||(t[A]=(...N)=>{postMessage({Sc:"callHandler",wd:A,args:N})},A=="print"&&(v=t[A]),A=="printErr"&&(E=t[A]));Ue=_.Od,re(),g=_.Pd,Se(),Jr()}else if(y==="run"){(function(T){var A=(k(),P)[T+52>>>2>>>0];T=(k(),P)[T+56>>>2>>>0],lo(A,A-T),pe(A)})(_.Rc),Qn(_.Rc,0,0,1,0,0),Pt(),Fn(_.Rc),B||(no(),B=!0);try{Dn(_.Md,_.bd)}catch(T){if(T!="unwind")throw T}}else _.target!=="setimmediate"&&(y==="checkMailbox"?B&&Vr():y&&(E(`worker: received unknown command ${y}`),E(_)))}catch(T){throw io(),T}};var B=!1;self.onunhandledrejection=p=>{throw p.reason||p},self.onmessage=u}var U,G,V,Z,O,P,H,Y,j,K,J,L=!1;function re(){var u=Ue.buffer;t.HEAP8=U=new Int8Array(u),V=new Int16Array(u),t.HEAPU8=G=new Uint8Array(u),Z=new Uint16Array(u),t.HEAP32=O=new Int32Array(u),t.HEAPU32=P=new Uint32Array(u),H=new Float32Array(u),Y=new Float64Array(u),j=new BigInt64Array(u),K=new BigUint64Array(u)}function C(){L=!0,i?$():wt.sb()}function R(u){throw E(u="Aborted("+u+")"),z=!0,u=new WebAssembly.RuntimeError(u+". Build with -sASSERTIONS for more info."),x?.(u),u}function ie(){return{a:{ma:P0,gb:D0,g:je,J:yg,f:bg,o:_g,h:wg,ha:$g,b:vg,T:xg,Ha:gs,n:Sg,$:ws,Xa:$s,Da:vs,Fa:xs,Ya:Ss,Va:ks,Oa:Ts,Ua:Es,ka:Is,Ea:Cs,Ba:zs,Wa:As,Ca:Ms,bb:kg,ea:Tg,wa:Eg,ua:Cg,da:Ag,O:Mg,H:Ng,va:Og,_:jg,xa:qg,Ra:Wg,za:Gg,Ia:Vg,sa:Hg,fa:Kg,Qa:Fn,_a:Xg,R:Jg,r:i0,c:qn,hb:a0,y:s0,M:o0,D:u0,l:l0,s:Us,ib:d0,I:c0,S:p0,j:h0,u:f0,q:m0,k:g0,La:y0,Ma:b0,Na:_0,Ja:Fs,Ka:Gs,ta:Vs,db:$0,ab:x0,v:S0,aa:k0,ga:T0,$a:v0,W:E0,Za:I0,Aa:C0,F:w0,U:z0,la:Yr,ya:M0,fb:A0,eb:N0,Sa:Zs,Ta:Ys,Ga:gr,V:Qs,ja:Js,Pa:eo,ia:to,kb:wy,na:my,lb:_y,oa:fy,G:ay,e:q0,t:U0,w:L0,B:Q0,mb:cy,K:ry,x:G0,pa:py,Y:gy,ba:dy,nb:ly,ob:uy,P:J0,qa:oy,pb:sy,N:ny,Z:hy,d:j0,A:F0,m:W0,jb:$y,p:H0,z:K0,C:V0,E:X0,L:ey,qb:iy,Q:yy,ca:ty,X:by,rb:Y0,ra:Z0,i:R0,a:Ue,cb:mr}}}async function Se(){function u(y,T){var A=wt=y.exports;y={};for(let[N,q]of Object.entries(A))typeof q=="function"?(A=Zg(q),y[N]=A):y[N]=q;return wt=y,wt=(function(){var N=wt,q=te=>ce=>te(ce)>>>0,Q=te=>()=>te()>>>0;return(N=Object.assign({},N)).tb=q(N.tb),N.Xb=Q(N.Xb),N.Zb=q(N.Zb),N.lc=q(N.lc),N.mc=Q(N.mc),N.qc=q(N.qc),N})(),St.push(wt._b),ro=(y=wt).tb,no=y.ub,t._OrtInit=y.vb,t._OrtGetLastError=y.wb,t._OrtCreateSessionOptions=y.xb,t._OrtAppendExecutionProvider=y.yb,t._OrtAddFreeDimensionOverride=y.zb,t._OrtAddSessionConfigEntry=y.Ab,t._OrtReleaseSessionOptions=y.Bb,t._OrtCreateSession=y.Cb,t._OrtReleaseSession=y.Db,t._OrtGetInputOutputCount=y.Eb,t._OrtGetInputOutputMetadata=y.Fb,t._OrtFree=y.Gb,t._OrtCreateTensor=y.Hb,t._OrtGetTensorData=y.Ib,t._OrtReleaseTensor=y.Jb,t._OrtCreateRunOptions=y.Kb,t._OrtAddRunConfigEntry=y.Lb,t._OrtReleaseRunOptions=y.Mb,t._OrtCreateBinding=y.Nb,t._OrtBindInput=y.Ob,t._OrtBindOutput=y.Pb,t._OrtClearBoundOutputs=y.Qb,t._OrtReleaseBinding=y.Rb,t._OrtRunWithBinding=y.Sb,t._OrtRun=y.Tb,t._OrtEndProfiling=y.Ub,t._JsepOutput=y.Vb,t._JsepGetNodeName=y.Wb,Qr=y.Xb,ft=t._free=y.Yb,br=t._malloc=y.Zb,Qn=y.ac,io=y.bc,ao=y.cc,so=y.dc,Jn=y.ec,oo=y.fc,uo=y.gc,me=y.hc,_r=y.ic,lo=y.jc,pe=y.kc,ei=y.lc,fe=y.mc,co=y.nc,ti=y.oc,po=y.pc,ho=y.qc,fo=y.rc,ri=y.sc,mo=y.tc,go=y.uc,yo=y.vc,bo=y.wc,_o=y.xc,wo=y.yc,$o=y.zc,vo=y.Ac,xo=y.Bc,So=y.Cc,ko=y.Dc,To=y.Ec,Eo=y.Fc,Io=y.Gc,Co=y.Hc,zo=y.Ic,Ao=y.Jc,Mo=y.Kc,No=y.Lc,Oo=y.Mc,Ro=y.Nc,Bo=y.Pc,Do=y.Qc,Po=y.$c,Lo=y.ad,Uo=y.fd,jo=y.jd,qo=y.kd,Wo=y.ld,Fo=y.md,Go=y.nd,Vo=y.od,Ho=y.pd,Ko=y.qd,Xo=y.vd,Zo=y.Td,Yo=y.Ud,Qo=y.Vd,Jo=y.Wd,g=T,wt}var p,_=ie();return t.instantiateWasm?new Promise(y=>{t.instantiateWasm(_,(T,A)=>{y(u(T,A))})}):i?u(new WebAssembly.Instance(g,ie()),g):(J??=t.locateFile?t.locateFile?t.locateFile("ort-wasm-simd-threaded.jsep.wasm",h):h+"ort-wasm-simd-threaded.jsep.wasm":new URL("/SACHIZU-LAB1/assets/ort-wasm-simd-threaded.jsep-DC5y_g6C.wasm",import.meta.url).href,p=await(async function(y){var T=J;if(!f&&!M(T))try{var A=fetch(T,{credentials:"same-origin"});return await WebAssembly.instantiateStreaming(A,y)}catch(N){E(`wasm streaming compile failed: ${N}`),E("falling back to ArrayBuffer instantiation")}return(async function(N,q){try{var Q=await(async function(te){if(!f)try{var ce=await o(te);return new Uint8Array(ce)}catch{}if(te==J&&f)te=new Uint8Array(f);else{if(!l)throw"both async and sync fetching of the wasm failed";te=l(te)}return te})(N);return await WebAssembly.instantiate(Q,q)}catch(te){E(`failed to asynchronously prepare wasm: ${te}`),R(te)}})(T,y)})(_),u(p.instance,p.module))}class ve{name="ExitStatus";constructor(p){this.message=`Program terminated with exit(${p})`,this.status=p}}var Ae=u=>{u.terminate(),u.onmessage=()=>{}},ge=[],he=0,Me=null,Te=u=>{et.length==0&&(kt(),Wr(et[0]));var p=et.pop();if(!p)return 6;Dt.push(p),ct[u.Rc]=p,p.Rc=u.Rc;var _={Sc:"run",Md:u.Ld,bd:u.bd,Rc:u.Rc};return p.postMessage(_,u.rd),0},We=0,xe=(u,p,..._)=>{var y,T=16*_.length,A=fe(),N=ei(T),q=N>>>3;for(y of _)typeof y=="bigint"?((k(),j)[q++>>>0]=1n,(k(),j)[q++>>>0]=y):((k(),j)[q++>>>0]=0n,(k(),Y)[q++>>>0]=y);return u=ao(u,0,T,N,p),pe(A),u};function mr(u){if(i)return xe(0,1,u);if(m=u,!(0<We)){for(var p of Dt)Ae(p);for(p of et)Ae(p);et=[],Dt=[],ct={},z=!0}d(0,new ve(u))}function jr(u){if(i)return xe(1,0,u);gr(u)}var gr=u=>{if(m=u,i)throw jr(u),"unwind";mr(u)},et=[],Dt=[],St=[],ct={},qr=u=>{var p=u.Rc;delete ct[p],et.push(u),Dt.splice(Dt.indexOf(u),1),u.Rc=0,so(p)};function Pt(){St.forEach(u=>u())}var Wr=u=>new Promise(p=>{u.onmessage=T=>{var A=T.data;if(T=A.Sc,A.Zc&&A.Zc!=Qr()){var N=ct[A.Zc];N?N.postMessage(A,A.rd):E(`Internal error! Worker sent a message "${T}" to target pthread ${A.Zc}, but that thread no longer exists!`)}else T==="checkMailbox"?Vr():T==="spawnThread"?Te(A):T==="cleanupThread"?Gr(()=>{qr(ct[A.Nd])}):T==="loaded"?(u.loaded=!0,p(u)):A.target==="setimmediate"?u.postMessage(A):T==="uncaughtException"?u.onerror(A.error):T==="callHandler"?t[A.wd](...A.args):T&&E(`worker sent an unknown command ${T}`)},u.onerror=T=>{throw E(`worker sent an error! ${T.filename}:${T.lineno}: ${T.message}`),T};var _,y=[];for(_ of[])t.propertyIsEnumerable(_)&&y.push(_);u.postMessage({Sc:"load",xd:y,Od:Ue,Pd:g})});function kt(){var u=new Worker((()=>{let p=URL;return import.meta.url>"file:"&&import.meta.url<"file;"?new p("ort.bundle.min.mjs",import.meta.url):new URL(import.meta.url)})(),{type:"module",workerData:"em-pthread",name:"em-pthread"});et.push(u)}var Ue,Dn=(u,p)=>{We=0,u=ri(u,p),0<We?m=u:Jn(u)},F=[],se=0;function je(u){var p=new Pn(u>>>=0);return(k(),U)[p.Tc+12>>>0]==0&&(hs(p,!0),se--),fs(p,!1),F.push(p),ho(u)}var Tt=0,yg=()=>{me(0,0);var u=F.pop();co(u.cd),Tt=0};function hs(u,p){p=p?1:0,(k(),U)[u.Tc+12>>>0]=p}function fs(u,p){p=p?1:0,(k(),U)[u.Tc+13>>>0]=p}class Pn{constructor(p){this.cd=p,this.Tc=p-24}}var Ln=u=>{var p=Tt;if(!p)return _r(0),0;var _=new Pn(p);(k(),P)[_.Tc+16>>>2>>>0]=p;var y=(k(),P)[_.Tc+4>>>2>>>0];if(!y)return _r(0),p;for(var T of u){if(T===0||T===y)break;if(po(T,y,_.Tc+16))return _r(T),p}return _r(y),p};function bg(){return Ln([])}function _g(u){return Ln([u>>>0])}function wg(u,p,_,y){return Ln([u>>>0,p>>>0,_>>>0,y>>>0])}var $g=()=>{var u=F.pop();u||R("no exception to throw");var p=u.cd;throw(k(),U)[u.Tc+13>>>0]==0&&(F.push(u),fs(u,!0),hs(u,!1),se++),ti(p),Tt=p};function vg(u,p,_){var y=new Pn(u>>>=0);throw p>>>=0,_>>>=0,(k(),P)[y.Tc+16>>>2>>>0]=0,(k(),P)[y.Tc+4>>>2>>>0]=p,(k(),P)[y.Tc+8>>>2>>>0]=_,ti(u),se++,Tt=u}var xg=()=>se;function ms(u,p,_,y){return i?xe(2,1,u,p,_,y):gs(u,p,_,y)}function gs(u,p,_,y){if(u>>>=0,p>>>=0,_>>>=0,y>>>=0,!globalThis.SharedArrayBuffer)return 6;var T=[];return i&&T.length===0?ms(u,p,_,y):(u={Ld:_,Rc:u,bd:y,rd:T},i?(u.Sc="spawnThread",postMessage(u,T),0):Te(u))}function Sg(u){throw Tt||=u>>>0,Tt}var ys=globalThis.TextDecoder&&new TextDecoder,bs=(u,p,_,y)=>{if(_=p+_,y)return _;for(;u[p]&&!(p>=_);)++p;return p},_s=(u,p=0,_,y)=>{if(16<(_=bs(u,p>>>=0,_,y))-p&&u.buffer&&ys)return ys.decode(u.buffer instanceof ArrayBuffer?u.subarray(p,_):u.slice(p,_));for(y="";p<_;){var T=u[p++];if(128&T){var A=63&u[p++];if((224&T)==192)y+=String.fromCharCode((31&T)<<6|A);else{var N=63&u[p++];65536>(T=(240&T)==224?(15&T)<<12|A<<6|N:(7&T)<<18|A<<12|N<<6|63&u[p++])?y+=String.fromCharCode(T):(T-=65536,y+=String.fromCharCode(55296|T>>10,56320|1023&T))}}else y+=String.fromCharCode(T)}return y},Be=(u,p,_)=>(u>>>=0)?_s((k(),G),u,p,_):"";function ws(u,p,_){return i?xe(3,1,u,p,_):0}function $s(u,p){if(i)return xe(4,1,u,p)}function vs(u,p){if(i)return xe(5,1,u,p)}function xs(u,p,_){if(i)return xe(6,1,u,p,_)}function Ss(u,p,_){return i?xe(7,1,u,p,_):0}function ks(u,p){if(i)return xe(8,1,u,p)}function Ts(u,p,_){if(i)return xe(9,1,u,p,_)}function Es(u,p,_,y){if(i)return xe(10,1,u,p,_,y)}function Is(u,p,_,y){if(i)return xe(11,1,u,p,_,y)}function Cs(u,p,_,y){if(i)return xe(12,1,u,p,_,y)}function zs(u){if(i)return xe(13,1,u)}function As(u,p){if(i)return xe(14,1,u,p)}function Ms(u,p,_){if(i)return xe(15,1,u,p,_)}var kg=()=>R(""),pt=u=>{u>>>=0;for(var p="";;){var _=(k(),G)[u++>>>0];if(!_)return p;p+=String.fromCharCode(_)}},Un={},jn={},ar=class extends Error{constructor(u){super(u),this.name="BindingError"}};function _t(u,p,_={}){return(function(y,T,A={}){var N=T.name;if(!y)throw new ar(`type "${N}" must have a positive integer typeid pointer`);if(jn.hasOwnProperty(y)){if(A.yd)return;throw new ar(`Cannot register type '${N}' twice`)}jn[y]=T,Un.hasOwnProperty(y)&&(T=Un[y],delete Un[y],T.forEach(q=>q()))})(u,p,_)}var Ns=(u,p,_)=>{switch(p){case 1:return _?y=>(k(),U)[y>>>0]:y=>(k(),G)[y>>>0];case 2:return _?y=>(k(),V)[y>>>1>>>0]:y=>(k(),Z)[y>>>1>>>0];case 4:return _?y=>(k(),O)[y>>>2>>>0]:y=>(k(),P)[y>>>2>>>0];case 8:return _?y=>(k(),j)[y>>>3>>>0]:y=>(k(),K)[y>>>3>>>0];default:throw new TypeError(`invalid integer width (${p}): ${u}`)}};function Tg(u,p,_,y,T){u>>>=0,_>>>=0,p=pt(p>>>0);let A=N=>N;if(y=y===0n){let N=8*_;A=q=>BigInt.asUintN(N,q),T=A(T)}_t(u,{name:p,Oc:A,Vc:(N,q)=>(typeof q=="number"&&(q=BigInt(q)),q),Uc:Ns(p,_,!y),Wc:null})}function Eg(u,p,_,y){_t(u>>>=0,{name:p=pt(p>>>0),Oc:function(T){return!!T},Vc:function(T,A){return A?_:y},Uc:function(T){return this.Oc((k(),G)[T>>>0])},Wc:null})}var Os=[],Lt=[0,1,,1,null,1,!0,1,!1,1];function qn(u){9<(u>>>=0)&&--Lt[u+1]===0&&(Lt[u]=void 0,Os.push(u))}var Ze=u=>{if(!u)throw new ar(`Cannot use deleted val. handle = ${u}`);return Lt[u]},tt=u=>{switch(u){case void 0:return 2;case null:return 4;case!0:return 6;case!1:return 8;default:let p=Os.pop()||Lt.length;return Lt[p]=u,Lt[p+1]=1,p}};function Wn(u){return this.Oc((k(),P)[u>>>2>>>0])}var Ig={name:"emscripten::val",Oc:u=>{var p=Ze(u);return qn(u),p},Vc:(u,p)=>tt(p),Uc:Wn,Wc:null};function Cg(u){return _t(u>>>0,Ig)}var zg=(u,p)=>{switch(p){case 4:return function(_){return this.Oc((k(),H)[_>>>2>>>0])};case 8:return function(_){return this.Oc((k(),Y)[_>>>3>>>0])};default:throw new TypeError(`invalid float width (${p}): ${u}`)}};function Ag(u,p,_){_>>>=0,_t(u>>>=0,{name:p=pt(p>>>0),Oc:y=>y,Vc:(y,T)=>T,Uc:zg(p,_),Wc:null})}function Mg(u,p,_,y,T){u>>>=0,_>>>=0,p=pt(p>>>0);let A=q=>q;if(y===0){var N=32-8*_;A=q=>q<<N>>>N,T=A(T)}_t(u,{name:p,Oc:A,Vc:(q,Q)=>Q,Uc:Ns(p,_,y!==0),Wc:null})}function Ng(u,p,_){function y(A){var N=(k(),P)[A>>>2>>>0];return A=(k(),P)[A+4>>>2>>>0],new T((k(),U).buffer,A,N)}var T=[Int8Array,Uint8Array,Int16Array,Uint16Array,Int32Array,Uint32Array,Float32Array,Float64Array,BigInt64Array,BigUint64Array][p];_t(u>>>=0,{name:_=pt(_>>>0),Oc:y,Uc:y},{yd:!0})}var Et=(u,p,_)=>{var y=(k(),G);if(p>>>=0,0<_){var T=p;_=p+_-1;for(var A=0;A<u.length;++A){var N=u.codePointAt(A);if(127>=N){if(p>=_)break;y[p++>>>0]=N}else if(2047>=N){if(p+1>=_)break;y[p++>>>0]=192|N>>6,y[p++>>>0]=128|63&N}else if(65535>=N){if(p+2>=_)break;y[p++>>>0]=224|N>>12,y[p++>>>0]=128|N>>6&63,y[p++>>>0]=128|63&N}else{if(p+3>=_)break;y[p++>>>0]=240|N>>18,y[p++>>>0]=128|N>>12&63,y[p++>>>0]=128|N>>6&63,y[p++>>>0]=128|63&N,A++}}y[p>>>0]=0,u=p-T}else u=0;return u},Fr=u=>{for(var p=0,_=0;_<u.length;++_){var y=u.charCodeAt(_);127>=y?p++:2047>=y?p+=2:55296<=y&&57343>=y?(p+=4,++_):p+=3}return p};function Og(u,p){_t(u>>>=0,{name:p=pt(p>>>0),Oc(_){var y=(k(),P)[_>>>2>>>0];return y=Be(_+4,y,!0),ft(_),y},Vc(_,y){y instanceof ArrayBuffer&&(y=new Uint8Array(y));var T=typeof y=="string";if(!(T||ArrayBuffer.isView(y)&&y.BYTES_PER_ELEMENT==1))throw new ar("Cannot pass non-string to std::string");var A=T?Fr(y):y.length,N=br(4+A+1),q=N+4;return(k(),P)[N>>>2>>>0]=A,T?Et(y,q,A+1):(k(),G).set(y,q>>>0),_!==null&&_.push(ft,N),N},Uc:Wn,Wc(_){ft(_)}})}var Rs=globalThis.TextDecoder?new TextDecoder("utf-16le"):void 0,Rg=(u,p,_)=>{if(u>>>=1,16<(p=bs((k(),Z),u,p/2,_))-u&&Rs)return Rs.decode((k(),Z).slice(u,p));for(_="";u<p;++u){var y=(k(),Z)[u>>>0];_+=String.fromCharCode(y)}return _},Bg=(u,p,_)=>{if(_??=2147483647,2>_)return 0;var y=p;_=(_-=2)<2*u.length?_/2:u.length;for(var T=0;T<_;++T){var A=u.charCodeAt(T);(k(),V)[p>>>1>>>0]=A,p+=2}return(k(),V)[p>>>1>>>0]=0,p-y},Dg=u=>2*u.length,Pg=(u,p,_)=>{var y="";u>>>=2;for(var T=0;!(T>=p/4);T++){var A=(k(),P)[u+T>>>0];if(!A&&!_)break;y+=String.fromCodePoint(A)}return y},Lg=(u,p,_)=>{if(p>>>=0,_??=2147483647,4>_)return 0;var y=p;_=y+_-4;for(var T=0;T<u.length;++T){var A=u.codePointAt(T);if(65535<A&&T++,(k(),O)[p>>>2>>>0]=A,(p+=4)+4>_)break}return(k(),O)[p>>>2>>>0]=0,p-y},Ug=u=>{for(var p=0,_=0;_<u.length;++_)65535<u.codePointAt(_)&&_++,p+=4;return p};function jg(u,p,_){if(u>>>=0,p>>>=0,_=pt(_>>>=0),p===2)var y=Rg,T=Bg,A=Dg;else y=Pg,T=Lg,A=Ug;_t(u,{name:_,Oc:N=>{var q=(k(),P)[N>>>2>>>0];return q=y(N+4,q*p,!0),ft(N),q},Vc:(N,q)=>{if(typeof q!="string")throw new ar(`Cannot pass non-string to C++ string type ${_}`);var Q=A(q),te=br(4+Q+p);return(k(),P)[te>>>2>>>0]=Q/p,T(q,te+4,Q+p),N!==null&&N.push(ft,te),te},Uc:Wn,Wc(N){ft(N)}})}function qg(u,p){_t(u>>>=0,{zd:!0,name:p=pt(p>>>0),Oc:()=>{},Vc:()=>{}})}function Wg(u){Qn(u>>>0,!n,1,!r,131072,!1),Pt()}var Gr=u=>{if(!z)try{if(u(),!(0<We))try{i?Qr()&&Jn(m):gr(m)}catch(p){p instanceof ve||p=="unwind"||d(0,p)}}catch(p){p instanceof ve||p=="unwind"||d(0,p)}},Fg=!Atomics.waitAsync||globalThis.navigator?.userAgent&&91>Number((navigator.userAgent.match(/Chrom(e|ium)\/([0-9]+)\./)||[])[2]);function Fn(u){u>>>=0,Fg||(Atomics.waitAsync((k(),O),u>>>2,u).value.then(Vr),u+=128,Atomics.store((k(),O),u>>>2,1))}var Vr=()=>Gr(()=>{var u=Qr();u&&(Fn(u),uo())});function Gg(u,p){(u>>>=0)==p>>>0?setTimeout(Vr):i?postMessage({Zc:u,Sc:"checkMailbox"}):(u=ct[u])&&u.postMessage({Sc:"checkMailbox"})}var Gn=[];function Vg(u,p,_,y,T){for(p>>>=0,T>>>=0,Gn.length=0,_=T>>>3,y=T+y>>>3;_<y;){var A;A=(k(),j)[_++>>>0]?(k(),j)[_++>>>0]:(k(),Y)[_++>>>0],Gn.push(A)}return(p?ni[p]:B0[u])(...Gn)}var Hg=()=>{We=0};function Kg(u){u>>>=0,i?postMessage({Sc:"cleanupThread",Nd:u}):qr(ct[u])}function Xg(u){}var Hr=u=>{try{u()}catch(p){R(p)}};function Zg(u){var p=(..._)=>{Kr.push(u);try{return u(..._)}finally{z||(Kr.pop(),ht&&It===1&&Kr.length===0&&(It=0,We+=1,Hr(Yo),typeof Fibers<"u"&&Fibers.Zd()))}};return Ps.set(u,p),p}var It=0,ht=null,Bs=0,Kr=[],Vn=new Map,Ds=new Map,Ps=new Map,Yg=0,Hn=null,Qg=[],Ls=u=>(function(p){if(!z){if(It===0){var _=!1,y=!1;p((T=0)=>{if(!z&&(Bs=T,_=!0,y)){It=2,Hr(()=>Qo(ht)),typeof MainLoop<"u"&&MainLoop.ud&&MainLoop.resume(),T=!1;try{var A=(function(){var Q=(k(),O)[ht+8>>>2>>>0];return Q=Ds.get(Q),Q=Ps.get(Q),--We,Q()})()}catch(Q){A=Q,T=!0}var N=!1;if(!ht){var q=Hn;q&&(Hn=null,(T?q.reject:q.resolve)(A),N=!0)}if(T&&!N)throw A}}),y=!0,_||(It=1,ht=(function(){var T=br(65548),A=T+12;if((k(),P)[T>>>2>>>0]=A,(k(),P)[T+4>>>2>>>0]=A+65536,A=Kr[0],!Vn.has(A)){var N=Yg++;Vn.set(A,N),Ds.set(N,A)}return A=Vn.get(A),(k(),O)[T+8>>>2>>>0]=A,T})(),typeof MainLoop<"u"&&MainLoop.ud&&MainLoop.pause(),Hr(()=>Zo(ht)))}else It===2?(It=0,Hr(Jo),ft(ht),ht=null,Qg.forEach(Gr)):R(`invalid state: ${It}`);return Bs}})(p=>{u().then(p)});function Jg(u){return u>>>=0,Ls(async()=>{var p=await Ze(u);return tt(p)})}var Kn=[],e0=u=>{var p=Kn.length;return Kn.push(u),p},t0=(u,p)=>{for(var _=Array(u),y=0;y<u;++y){var T=y,A=(k(),P)[p+4*y>>>2>>>0],N=jn[A];if(N===void 0)throw u=`parameter ${y}`,A=ro(A),p=pt(A),ft(A),new ar(`${u} has unknown type ${p}`);_[T]=N}return _},r0=(u,p,_)=>{var y=[];return u=u(y,_),y.length&&((k(),P)[p>>>2>>>0]=tt(y)),u},n0={},Xr=u=>{var p=n0[u];return p===void 0?pt(u):p};function i0(u,p,_){var[y,...T]=t0(u,p>>>0);p=y.Vc.bind(y);var A=T.map(Q=>Q.Uc.bind(Q));u--;var N={toValue:Ze};switch(u=A.map((Q,te)=>{var ce=`argFromPtr${te}`;return N[ce]=Q,`${ce}(args${te?"+"+8*te:""})`}),_){case 0:var q="toValue(handle)";break;case 2:q="new (toValue(handle))";break;case 3:q="";break;case 1:N.getStringOrSymbol=Xr,q="toValue(handle)[getStringOrSymbol(methodName)]"}return q+=`(${u})`,y.zd||(N.toReturnWire=p,N.emval_returnValue=r0,q=`return emval_returnValue(toReturnWire, destructorsRef, ${q})`),q=`return function (handle, methodName, destructorsRef, args) {
  ${q}
  }`,_=new Function(Object.keys(N),q)(...Object.values(N)),q=`methodCaller<(${T.map(Q=>Q.name)}) => ${y.name}>`,e0(Object.defineProperty(_,"name",{value:q}))}function a0(u,p){return p>>>=0,(u=Ze(u>>>0))==Ze(p)}function s0(u){return(u>>>=0)?(u=Xr(u),tt(globalThis[u])):tt(globalThis)}function o0(u){return u=Xr(u>>>0),tt(t[u])}function u0(u,p){return p>>>=0,u=Ze(u>>>0),p=Ze(p),tt(u[p])}function l0(u){9<(u>>>=0)&&(Lt[u+1]+=1)}function Us(u,p,_,y,T){return Kn[u>>>0](p>>>0,_>>>0,y>>>0,T>>>0)}function d0(u,p,_,y,T){return Us(u>>>0,p>>>0,_>>>0,y>>>0,T>>>0)}function c0(){return tt([])}function p0(u){u=Ze(u>>>0);for(var p=Array(u.length),_=0;_<u.length;_++)p[_]=u[_];return tt(p)}function h0(u){return tt(Xr(u>>>0))}function f0(){return tt({})}function m0(u){for(var p=Ze(u>>>=0);p.length;){var _=p.pop();p.pop()(_)}qn(u)}function g0(u,p,_){p>>>=0,_>>>=0,u=Ze(u>>>0),p=Ze(p),_=Ze(_),u[p]=_}function y0(u,p){u=-9007199254740992>u||9007199254740992<u?NaN:Number(u),p>>>=0,u=new Date(1e3*u),(k(),O)[p>>>2>>>0]=u.getUTCSeconds(),(k(),O)[p+4>>>2>>>0]=u.getUTCMinutes(),(k(),O)[p+8>>>2>>>0]=u.getUTCHours(),(k(),O)[p+12>>>2>>>0]=u.getUTCDate(),(k(),O)[p+16>>>2>>>0]=u.getUTCMonth(),(k(),O)[p+20>>>2>>>0]=u.getUTCFullYear()-1900,(k(),O)[p+24>>>2>>>0]=u.getUTCDay(),u=(u.getTime()-Date.UTC(u.getUTCFullYear(),0,1,0,0,0,0))/864e5|0,(k(),O)[p+28>>>2>>>0]=u}var js=u=>u%4==0&&(u%100!=0||u%400==0),qs=[0,31,60,91,121,152,182,213,244,274,305,335],Ws=[0,31,59,90,120,151,181,212,243,273,304,334];function b0(u,p){u=-9007199254740992>u||9007199254740992<u?NaN:Number(u),p>>>=0,u=new Date(1e3*u),(k(),O)[p>>>2>>>0]=u.getSeconds(),(k(),O)[p+4>>>2>>>0]=u.getMinutes(),(k(),O)[p+8>>>2>>>0]=u.getHours(),(k(),O)[p+12>>>2>>>0]=u.getDate(),(k(),O)[p+16>>>2>>>0]=u.getMonth(),(k(),O)[p+20>>>2>>>0]=u.getFullYear()-1900,(k(),O)[p+24>>>2>>>0]=u.getDay();var _=(js(u.getFullYear())?qs:Ws)[u.getMonth()]+u.getDate()-1|0;(k(),O)[p+28>>>2>>>0]=_,(k(),O)[p+36>>>2>>>0]=-60*u.getTimezoneOffset(),_=new Date(u.getFullYear(),6,1).getTimezoneOffset();var y=new Date(u.getFullYear(),0,1).getTimezoneOffset();u=0|(_!=y&&u.getTimezoneOffset()==Math.min(y,_)),(k(),O)[p+32>>>2>>>0]=u}function _0(u){u>>>=0;var p=new Date((k(),O)[u+20>>>2>>>0]+1900,(k(),O)[u+16>>>2>>>0],(k(),O)[u+12>>>2>>>0],(k(),O)[u+8>>>2>>>0],(k(),O)[u+4>>>2>>>0],(k(),O)[u>>>2>>>0],0),_=(k(),O)[u+32>>>2>>>0],y=p.getTimezoneOffset(),T=new Date(p.getFullYear(),6,1).getTimezoneOffset(),A=new Date(p.getFullYear(),0,1).getTimezoneOffset(),N=Math.min(A,T);return 0>_?(k(),O)[u+32>>>2>>>0]=+(T!=A&&N==y):0<_!=(N==y)&&(T=Math.max(A,T),p.setTime(p.getTime()+6e4*((0<_?N:T)-y))),(k(),O)[u+24>>>2>>>0]=p.getDay(),_=(js(p.getFullYear())?qs:Ws)[p.getMonth()]+p.getDate()-1|0,(k(),O)[u+28>>>2>>>0]=_,(k(),O)[u>>>2>>>0]=p.getSeconds(),(k(),O)[u+4>>>2>>>0]=p.getMinutes(),(k(),O)[u+8>>>2>>>0]=p.getHours(),(k(),O)[u+12>>>2>>>0]=p.getDate(),(k(),O)[u+16>>>2>>>0]=p.getMonth(),(k(),O)[u+20>>>2>>>0]=p.getYear(),u=p.getTime(),BigInt(isNaN(u)?-1:u/1e3)}function Fs(u,p,_,y,T,A,N){return i?xe(16,1,u,p,_,y,T,A,N):-52}function Gs(u,p,_,y,T,A){if(i)return xe(17,1,u,p,_,y,T,A)}var yr={},w0=()=>performance.timeOrigin+performance.now();function Vs(u,p){if(i)return xe(18,1,u,p);if(yr[u]&&(clearTimeout(yr[u].id),delete yr[u]),!p)return 0;var _=setTimeout(()=>{delete yr[u],Gr(()=>oo(u,performance.timeOrigin+performance.now()))},p);return yr[u]={id:_,Yd:p},0}function $0(u,p,_,y){u>>>=0,p>>>=0,_>>>=0,y>>>=0;var T=new Date().getFullYear(),A=new Date(T,0,1).getTimezoneOffset();T=new Date(T,6,1).getTimezoneOffset();var N=Math.max(A,T);(k(),P)[u>>>2>>>0]=60*N,(k(),O)[p>>>2>>>0]=+(A!=T),u=(p=q=>{var Q=Math.abs(q);return`UTC${0<=q?"-":"+"}${String(Math.floor(Q/60)).padStart(2,"0")}${String(Q%60).padStart(2,"0")}`})(A),p=p(T),T<A?(Et(u,_,17),Et(p,y,17)):(Et(u,y,17),Et(p,_,17))}var v0=()=>Date.now();function x0(u,p,_){return _>>>=0,0<=u&&3>=u?(u===0?u=Date.now():u=performance.timeOrigin+performance.now(),u=Math.round(1e6*u),(k(),j)[_>>>3>>>0]=BigInt(u),0):28}var Xn=[],Hs=(u,p)=>{Xn.length=0;for(var _;_=(k(),G)[u++>>>0];){var y=_!=105;p+=(y&=_!=112)&&p%8?4:0,Xn.push(_==112?(k(),P)[p>>>2>>>0]:_==106?(k(),j)[p>>>3>>>0]:_==105?(k(),O)[p>>>2>>>0]:(k(),Y)[p>>>3>>>0]),p+=y?8:4}return Xn};function S0(u,p,_){return u>>>=0,p=Hs(p>>>0,_>>>0),ni[u](...p)}function k0(u,p,_){return u>>>=0,p=Hs(p>>>0,_>>>0),ni[u](...p)}var T0=()=>{};function E0(u,p){return E(Be(u>>>0,p>>>0))}var I0=()=>{throw We+=1,"unwind"};function C0(){return 4294901760}var z0=()=>navigator.hardwareConcurrency,Ut={},Zr=u=>{var p;return(p=/\bwasm-function\[\d+\]:(0x[0-9a-f]+)/.exec(u))?+p[1]:(p=/:(\d+):\d+(?:\)|$)/.exec(u))?2147483648|+p[1]:0},Ks=u=>{for(var p of u)(u=Zr(p))&&(Ut[u]=p)};function A0(){var u=Error().stack.toString().split(`
`);return u[0]=="Error"&&u.shift(),Ks(u),Ut.gd=Zr(u[3]),Ut.Jd=u,Ut.gd}function Yr(u){if(!(u=Ut[u>>>0]))return 0;var p;if(p=/^\s+at .*\.wasm\.(.*) \(.*\)$/.exec(u))u=p[1];else if(p=/^\s+at (.*) \(.*\)$/.exec(u))u=p[1];else{if(!(p=/^(.+?)@/.exec(u)))return 0;u=p[1]}ft(Yr.hd??0),p=Fr(u)+1;var _=br(p);return _&&Et(u,_,p),Yr.hd=_,Yr.hd}function M0(u){u>>>=0;var p=(k(),G).length;if(u<=p||4294901760<u)return!1;for(var _=1;4>=_;_*=2){var y=p*(1+.2/_);y=Math.min(y,u+100663296);e:{y=(Math.min(4294901760,65536*Math.ceil(Math.max(u,y)/65536))-Ue.buffer.byteLength+65535)/65536|0;try{Ue.grow(y),re();var T=1;break e}catch{}T=void 0}if(T)return!0}return!1}function N0(u,p,_){if(u>>>=0,p>>>=0,Ut.gd==u)var y=Ut.Jd;else(y=Error().stack.toString().split(`
`))[0]=="Error"&&y.shift(),Ks(y);for(var T=3;y[T]&&Zr(y[T])!=u;)++T;for(u=0;u<_&&y[u+T];++u)(k(),O)[p+4*u>>>2>>>0]=Zr(y[u+T]);return u}var Zn,Yn={},Xs=()=>{if(!Zn){var u,p={USER:"web_user",LOGNAME:"web_user",PATH:"/",PWD:"/",HOME:"/home/web_user",LANG:(globalThis.navigator?.language??"C").replace("-","_")+".UTF-8",_:"./this.program"};for(u in Yn)Yn[u]===void 0?delete p[u]:p[u]=Yn[u];var _=[];for(u in p)_.push(`${u}=${p[u]}`);Zn=_}return Zn};function Zs(u,p){if(i)return xe(19,1,u,p);u>>>=0,p>>>=0;var _,y=0,T=0;for(_ of Xs()){var A=p+y;(k(),P)[u+T>>>2>>>0]=A,y+=Et(_,A,1/0)+1,T+=4}return 0}function Ys(u,p){if(i)return xe(20,1,u,p);u>>>=0,p>>>=0;var _=Xs();for(var y of((k(),P)[u>>>2>>>0]=_.length,u=0,_))u+=Fr(y)+1;return(k(),P)[p>>>2>>>0]=u,0}function Qs(u){return i?xe(21,1,u):52}function Js(u,p,_,y){return i?xe(22,1,u,p,_,y):52}function eo(u,p,_,y){return i?xe(23,1,u,p,_,y):70}var O0=[null,[],[]];function to(u,p,_,y){if(i)return xe(24,1,u,p,_,y);p>>>=0,_>>>=0,y>>>=0;for(var T=0,A=0;A<_;A++){var N=(k(),P)[p>>>2>>>0],q=(k(),P)[p+4>>>2>>>0];p+=8;for(var Q=0;Q<q;Q++){var te=u,ce=(k(),G)[N+Q>>>0],be=O0[te];ce===0||ce===10?((te===1?v:E)(_s(be)),be.length=0):be.push(ce)}T+=q}return(k(),P)[y>>>2>>>0]=T,0}function R0(u){return u>>>0}i||(function(){for(var u=t.numThreads-1;u--;)kt();ge.push(async()=>{var p=(async function(){if(!i)return Promise.all(et.map(Wr))})();he++,await p,--he==0&&Me&&(p=Me,Me=null,p())})})(),i||(Ue=new WebAssembly.Memory({initial:256,maximum:65536,shared:!0}),re()),t.wasmBinary&&(f=t.wasmBinary),t.stackSave=()=>fe(),t.stackRestore=u=>pe(u),t.stackAlloc=u=>ei(u),t.setValue=function(u,p,_="i8"){switch(_.endsWith("*")&&(_="*"),_){case"i1":case"i8":(k(),U)[u>>>0]=p;break;case"i16":(k(),V)[u>>>1>>>0]=p;break;case"i32":(k(),O)[u>>>2>>>0]=p;break;case"i64":(k(),j)[u>>>3>>>0]=BigInt(p);break;case"float":(k(),H)[u>>>2>>>0]=p;break;case"double":(k(),Y)[u>>>3>>>0]=p;break;case"*":(k(),P)[u>>>2>>>0]=p;break;default:R(`invalid type for setValue: ${_}`)}},t.getValue=function(u,p="i8"){switch(p.endsWith("*")&&(p="*"),p){case"i1":case"i8":return(k(),U)[u>>>0];case"i16":return(k(),V)[u>>>1>>>0];case"i32":return(k(),O)[u>>>2>>>0];case"i64":return(k(),j)[u>>>3>>>0];case"float":return(k(),H)[u>>>2>>>0];case"double":return(k(),Y)[u>>>3>>>0];case"*":return(k(),P)[u>>>2>>>0];default:R(`invalid type for getValue: ${p}`)}},t.UTF8ToString=Be,t.stringToUTF8=Et,t.lengthBytesUTF8=Fr;var ro,no,Qr,ft,br,Qn,io,ao,so,Jn,oo,uo,me,_r,lo,pe,ei,fe,co,ti,po,ho,fo,ri,mo,go,yo,bo,_o,wo,$o,vo,xo,So,ko,To,Eo,Io,Co,zo,Ao,Mo,No,Oo,Ro,Bo,Do,Po,Lo,Uo,jo,qo,Wo,Fo,Go,Vo,Ho,Ko,Xo,Zo,Yo,Qo,Jo,wt,B0=[mr,jr,ms,ws,$s,vs,xs,Ss,ks,Ts,Es,Is,Cs,zs,As,Ms,Fs,Gs,Vs,Zs,Ys,Qs,Js,eo,to],ni={1003524:(u,p,_,y,T)=>{if(t===void 0||!t.Xc)return 1;if((u=Be(Number(u>>>0))).startsWith("./")&&(u=u.substring(2)),!(u=t.Xc.get(u)))return 2;if(p=Number(p>>>0),_=Number(_>>>0),y=Number(y>>>0),p+_>u.byteLength)return 3;try{let A=u.subarray(p,p+_);switch(T){case 0:(k(),G).set(A,y>>>0);break;case 1:t.Qd?t.Qd(y,A):t.Id(y,A);break;default:return 4}return 0}catch{return 4}},1004348:(u,p,_)=>{t.td(u,(k(),G).subarray(p>>>0,p+_>>>0))},1004412:()=>t.Sd(),1004454:u=>{t.sd(u)},1004491:()=>{t.Bd()},1004522:()=>{t.Cd()},1004551:()=>{t.Gd()},1004576:u=>t.Ad(u),1004609:u=>t.Ed(u),1004641:(u,p,_)=>{t.ed(Number(u),Number(p),Number(_),!0)},1004704:(u,p,_)=>{t.ed(Number(u),Number(p),Number(_))},1004761:()=>typeof wasmOffsetConverter<"u",1004818:u=>{t.$b("Abs",u,void 0)},1004869:u=>{t.$b("Neg",u,void 0)},1004920:u=>{t.$b("Floor",u,void 0)},1004973:u=>{t.$b("Ceil",u,void 0)},1005025:u=>{t.$b("Reciprocal",u,void 0)},1005083:u=>{t.$b("Sqrt",u,void 0)},1005135:u=>{t.$b("Exp",u,void 0)},1005186:u=>{t.$b("Erf",u,void 0)},1005237:u=>{t.$b("Sigmoid",u,void 0)},1005292:(u,p,_)=>{t.$b("HardSigmoid",u,{alpha:p,beta:_})},1005371:u=>{t.$b("Log",u,void 0)},1005422:u=>{t.$b("Sin",u,void 0)},1005473:u=>{t.$b("Cos",u,void 0)},1005524:u=>{t.$b("Tan",u,void 0)},1005575:u=>{t.$b("Asin",u,void 0)},1005627:u=>{t.$b("Acos",u,void 0)},1005679:u=>{t.$b("Atan",u,void 0)},1005731:u=>{t.$b("Sinh",u,void 0)},1005783:u=>{t.$b("Cosh",u,void 0)},1005835:u=>{t.$b("Asinh",u,void 0)},1005888:u=>{t.$b("Acosh",u,void 0)},1005941:u=>{t.$b("Atanh",u,void 0)},1005994:u=>{t.$b("Tanh",u,void 0)},1006046:u=>{t.$b("Not",u,void 0)},1006097:(u,p,_)=>{t.$b("Clip",u,{min:p,max:_})},1006166:u=>{t.$b("Clip",u,void 0)},1006218:(u,p)=>{t.$b("Elu",u,{alpha:p})},1006276:u=>{t.$b("Gelu",u,void 0)},1006328:u=>{t.$b("Relu",u,void 0)},1006380:(u,p)=>{t.$b("LeakyRelu",u,{alpha:p})},1006444:(u,p)=>{t.$b("ThresholdedRelu",u,{alpha:p})},1006514:(u,p)=>{t.$b("Cast",u,{to:p})},1006572:u=>{t.$b("Add",u,void 0)},1006623:u=>{t.$b("Sub",u,void 0)},1006674:u=>{t.$b("Mul",u,void 0)},1006725:u=>{t.$b("Div",u,void 0)},1006776:u=>{t.$b("Pow",u,void 0)},1006827:u=>{t.$b("Equal",u,void 0)},1006880:u=>{t.$b("Greater",u,void 0)},1006935:u=>{t.$b("GreaterOrEqual",u,void 0)},1006997:u=>{t.$b("Less",u,void 0)},1007049:u=>{t.$b("LessOrEqual",u,void 0)},1007108:(u,p,_,y,T)=>{t.$b("ReduceMean",u,{keepDims:!!p,noopWithEmptyAxes:!!_,axes:y?Array.from((k(),O).subarray(Number(y)>>>0,Number(T)>>>0)):[]})},1007283:(u,p,_,y,T)=>{t.$b("ReduceMax",u,{keepDims:!!p,noopWithEmptyAxes:!!_,axes:y?Array.from((k(),O).subarray(Number(y)>>>0,Number(T)>>>0)):[]})},1007457:(u,p,_,y,T)=>{t.$b("ReduceMin",u,{keepDims:!!p,noopWithEmptyAxes:!!_,axes:y?Array.from((k(),O).subarray(Number(y)>>>0,Number(T)>>>0)):[]})},1007631:(u,p,_,y,T)=>{t.$b("ReduceProd",u,{keepDims:!!p,noopWithEmptyAxes:!!_,axes:y?Array.from((k(),O).subarray(Number(y)>>>0,Number(T)>>>0)):[]})},1007806:(u,p,_,y,T)=>{t.$b("ReduceSum",u,{keepDims:!!p,noopWithEmptyAxes:!!_,axes:y?Array.from((k(),O).subarray(Number(y)>>>0,Number(T)>>>0)):[]})},1007980:(u,p,_,y,T)=>{t.$b("ReduceL1",u,{keepDims:!!p,noopWithEmptyAxes:!!_,axes:y?Array.from((k(),O).subarray(Number(y)>>>0,Number(T)>>>0)):[]})},1008153:(u,p,_,y,T)=>{t.$b("ReduceL2",u,{keepDims:!!p,noopWithEmptyAxes:!!_,axes:y?Array.from((k(),O).subarray(Number(y)>>>0,Number(T)>>>0)):[]})},1008326:(u,p,_,y,T)=>{t.$b("ReduceLogSum",u,{keepDims:!!p,noopWithEmptyAxes:!!_,axes:y?Array.from((k(),O).subarray(Number(y)>>>0,Number(T)>>>0)):[]})},1008503:(u,p,_,y,T)=>{t.$b("ReduceSumSquare",u,{keepDims:!!p,noopWithEmptyAxes:!!_,axes:y?Array.from((k(),O).subarray(Number(y)>>>0,Number(T)>>>0)):[]})},1008683:(u,p,_,y,T)=>{t.$b("ReduceLogSumExp",u,{keepDims:!!p,noopWithEmptyAxes:!!_,axes:y?Array.from((k(),O).subarray(Number(y)>>>0,Number(T)>>>0)):[]})},1008863:u=>{t.$b("Where",u,void 0)},1008916:(u,p,_)=>{t.$b("Transpose",u,{perm:p?Array.from((k(),O).subarray(Number(p)>>>0,Number(_)>>>0)):[]})},1009040:(u,p,_,y)=>{t.$b("DepthToSpace",u,{blocksize:p,mode:Be(_),format:y?"NHWC":"NCHW"})},1009173:(u,p,_,y)=>{t.$b("DepthToSpace",u,{blocksize:p,mode:Be(_),format:y?"NHWC":"NCHW"})},1009306:(u,p,_,y,T,A,N,q,Q,te,ce,be,ke,Ce,Ct)=>{t.$b("ConvTranspose",u,{format:Q?"NHWC":"NCHW",autoPad:p,dilations:[_],group:y,kernelShape:[T],pads:[A,N],strides:[q],wIsConst:()=>!!(k(),U)[te>>>0],outputPadding:ce?Array.from((k(),O).subarray(Number(ce)>>>0,Number(be)>>>0)):[],outputShape:ke?Array.from((k(),O).subarray(Number(ke)>>>0,Number(Ce)>>>0)):[],activation:Be(Ct)})},1009739:(u,p,_,y,T,A,N,q,Q,te,ce,be,ke,Ce)=>{t.$b("ConvTranspose",u,{format:q?"NHWC":"NCHW",autoPad:p,dilations:Array.from((k(),O).subarray(Number(_)>>>0,(Number(_)>>>0)+2>>>0)),group:y,kernelShape:Array.from((k(),O).subarray(Number(T)>>>0,(Number(T)>>>0)+2>>>0)),pads:Array.from((k(),O).subarray(Number(A)>>>0,(Number(A)>>>0)+4>>>0)),strides:Array.from((k(),O).subarray(Number(N)>>>0,(Number(N)>>>0)+2>>>0)),wIsConst:()=>!!(k(),U)[Q>>>0],outputPadding:te?Array.from((k(),O).subarray(Number(te)>>>0,Number(ce)>>>0)):[],outputShape:be?Array.from((k(),O).subarray(Number(be)>>>0,Number(ke)>>>0)):[],activation:Be(Ce)})},1010400:(u,p,_,y,T,A,N,q,Q,te,ce,be,ke,Ce,Ct)=>{t.$b("ConvTranspose",u,{format:Q?"NHWC":"NCHW",autoPad:p,dilations:[_],group:y,kernelShape:[T],pads:[A,N],strides:[q],wIsConst:()=>!!(k(),U)[te>>>0],outputPadding:ce?Array.from((k(),O).subarray(Number(ce)>>>0,Number(be)>>>0)):[],outputShape:ke?Array.from((k(),O).subarray(Number(ke)>>>0,Number(Ce)>>>0)):[],activation:Be(Ct)})},1010833:(u,p,_,y,T,A,N,q,Q,te,ce,be,ke,Ce)=>{t.$b("ConvTranspose",u,{format:q?"NHWC":"NCHW",autoPad:p,dilations:Array.from((k(),O).subarray(Number(_)>>>0,(Number(_)>>>0)+2>>>0)),group:y,kernelShape:Array.from((k(),O).subarray(Number(T)>>>0,(Number(T)>>>0)+2>>>0)),pads:Array.from((k(),O).subarray(Number(A)>>>0,(Number(A)>>>0)+4>>>0)),strides:Array.from((k(),O).subarray(Number(N)>>>0,(Number(N)>>>0)+2>>>0)),wIsConst:()=>!!(k(),U)[Q>>>0],outputPadding:te?Array.from((k(),O).subarray(Number(te)>>>0,Number(ce)>>>0)):[],outputShape:be?Array.from((k(),O).subarray(Number(be)>>>0,Number(ke)>>>0)):[],activation:Be(Ce)})},1011494:(u,p)=>{t.$b("GlobalAveragePool",u,{format:p?"NHWC":"NCHW"})},1011585:(u,p,_,y,T,A,N,q,Q,te,ce,be,ke,Ce)=>{t.$b("AveragePool",u,{format:Ce?"NHWC":"NCHW",auto_pad:p,ceil_mode:_,count_include_pad:y,storage_order:T,dilations:A?Array.from((k(),O).subarray(Number(A)>>>0,Number(N)>>>0)):[],kernel_shape:q?Array.from((k(),O).subarray(Number(q)>>>0,Number(Q)>>>0)):[],pads:te?Array.from((k(),O).subarray(Number(te)>>>0,Number(ce)>>>0)):[],strides:be?Array.from((k(),O).subarray(Number(be)>>>0,Number(ke)>>>0)):[]})},1012064:(u,p)=>{t.$b("GlobalAveragePool",u,{format:p?"NHWC":"NCHW"})},1012155:(u,p,_,y,T,A,N,q,Q,te,ce,be,ke,Ce)=>{t.$b("AveragePool",u,{format:Ce?"NHWC":"NCHW",auto_pad:p,ceil_mode:_,count_include_pad:y,storage_order:T,dilations:A?Array.from((k(),O).subarray(Number(A)>>>0,Number(N)>>>0)):[],kernel_shape:q?Array.from((k(),O).subarray(Number(q)>>>0,Number(Q)>>>0)):[],pads:te?Array.from((k(),O).subarray(Number(te)>>>0,Number(ce)>>>0)):[],strides:be?Array.from((k(),O).subarray(Number(be)>>>0,Number(ke)>>>0)):[]})},1012634:(u,p)=>{t.$b("GlobalMaxPool",u,{format:p?"NHWC":"NCHW"})},1012721:(u,p,_,y,T,A,N,q,Q,te,ce,be,ke,Ce)=>{t.$b("MaxPool",u,{format:Ce?"NHWC":"NCHW",auto_pad:p,ceil_mode:_,count_include_pad:y,storage_order:T,dilations:A?Array.from((k(),O).subarray(Number(A)>>>0,Number(N)>>>0)):[],kernel_shape:q?Array.from((k(),O).subarray(Number(q)>>>0,Number(Q)>>>0)):[],pads:te?Array.from((k(),O).subarray(Number(te)>>>0,Number(ce)>>>0)):[],strides:be?Array.from((k(),O).subarray(Number(be)>>>0,Number(ke)>>>0)):[]})},1013196:(u,p)=>{t.$b("GlobalMaxPool",u,{format:p?"NHWC":"NCHW"})},1013283:(u,p,_,y,T,A,N,q,Q,te,ce,be,ke,Ce)=>{t.$b("MaxPool",u,{format:Ce?"NHWC":"NCHW",auto_pad:p,ceil_mode:_,count_include_pad:y,storage_order:T,dilations:A?Array.from((k(),O).subarray(Number(A)>>>0,Number(N)>>>0)):[],kernel_shape:q?Array.from((k(),O).subarray(Number(q)>>>0,Number(Q)>>>0)):[],pads:te?Array.from((k(),O).subarray(Number(te)>>>0,Number(ce)>>>0)):[],strides:be?Array.from((k(),O).subarray(Number(be)>>>0,Number(ke)>>>0)):[]})},1013758:(u,p,_,y,T)=>{t.$b("Gemm",u,{alpha:p,beta:_,transA:y,transB:T})},1013862:u=>{t.$b("MatMul",u,void 0)},1013916:(u,p,_,y)=>{t.$b("ArgMax",u,{keepDims:!!p,selectLastIndex:!!_,axis:y})},1014024:(u,p,_,y)=>{t.$b("ArgMin",u,{keepDims:!!p,selectLastIndex:!!_,axis:y})},1014132:(u,p)=>{t.$b("Softmax",u,{axis:p})},1014195:(u,p)=>{t.$b("Concat",u,{axis:p})},1014255:(u,p,_,y,T)=>{t.$b("Split",u,{axis:p,numOutputs:_,splitSizes:y?Array.from((k(),O).subarray(Number(y)>>>0,Number(T)>>>0)):[]})},1014411:u=>{t.$b("Expand",u,void 0)},1014465:(u,p)=>{t.$b("Gather",u,{axis:Number(p)})},1014536:(u,p)=>{t.$b("GatherElements",u,{axis:Number(p)})},1014615:(u,p)=>{t.$b("GatherND",u,{batch_dims:Number(p)})},1014694:(u,p,_,y,T,A,N,q,Q,te,ce)=>{t.$b("Resize",u,{antialias:p,axes:_?Array.from((k(),O).subarray(Number(_)>>>0,Number(y)>>>0)):[],coordinateTransformMode:Be(T),cubicCoeffA:A,excludeOutside:N,extrapolationValue:q,keepAspectRatioPolicy:Be(Q),mode:Be(te),nearestMode:Be(ce)})},1015056:(u,p,_,y,T,A,N)=>{t.$b("Slice",u,{starts:p?Array.from((k(),O).subarray(Number(p)>>>0,Number(_)>>>0)):[],ends:y?Array.from((k(),O).subarray(Number(y)>>>0,Number(T)>>>0)):[],axes:A?Array.from((k(),O).subarray(Number(A)>>>0,Number(N)>>>0)):[]})},1015320:u=>{t.$b("Tile",u,void 0)},1015372:(u,p,_)=>{t.$b("InstanceNormalization",u,{epsilon:p,format:_?"NHWC":"NCHW"})},1015486:(u,p,_)=>{t.$b("InstanceNormalization",u,{epsilon:p,format:_?"NHWC":"NCHW"})},1015600:u=>{t.$b("Range",u,void 0)},1015653:(u,p)=>{t.$b("Einsum",u,{equation:Be(p)})},1015734:(u,p,_,y,T)=>{t.$b("Pad",u,{mode:p,value:_,pads:y?Array.from((k(),O).subarray(Number(y)>>>0,Number(T)>>>0)):[]})},1015877:(u,p,_,y,T,A)=>{t.$b("BatchNormalization",u,{epsilon:p,momentum:_,spatial:!!T,trainingMode:!!y,format:A?"NHWC":"NCHW"})},1016046:(u,p,_,y,T,A)=>{t.$b("BatchNormalization",u,{epsilon:p,momentum:_,spatial:!!T,trainingMode:!!y,format:A?"NHWC":"NCHW"})},1016215:(u,p,_)=>{t.$b("CumSum",u,{exclusive:Number(p),reverse:Number(_)})},1016312:(u,p,_)=>{t.$b("DequantizeLinear",u,{axis:p,blockSize:_})},1016402:(u,p,_,y,T)=>{t.$b("GridSample",u,{align_corners:p,mode:Be(_),padding_mode:Be(y),format:T?"NHWC":"NCHW"})},1016572:(u,p,_,y,T)=>{t.$b("GridSample",u,{align_corners:p,mode:Be(_),padding_mode:Be(y),format:T?"NHWC":"NCHW"})},1016742:(u,p)=>{t.$b("ScatterND",u,{reduction:Be(p)})},1016827:(u,p,_,y,T,A,N,q,Q)=>{t.$b("Attention",u,{numHeads:p,isUnidirectional:_,maskFilterValue:y,scale:T,doRotary:A,qkvHiddenSizes:N?Array.from((k(),O).subarray(Number(q)>>>0,Number(q)+N>>>0)):[],pastPresentShareBuffer:!!Q})},1017099:u=>{t.$b("BiasAdd",u,void 0)},1017154:u=>{t.$b("BiasSplitGelu",u,void 0)},1017215:u=>{t.$b("FastGelu",u,void 0)},1017271:(u,p,_,y,T,A,N,q,Q,te,ce,be,ke,Ce,Ct,ii)=>{t.$b("Conv",u,{format:be?"NHWC":"NCHW",auto_pad:p,dilations:_?Array.from((k(),O).subarray(Number(_)>>>0,Number(y)>>>0)):[],group:T,kernel_shape:A?Array.from((k(),O).subarray(Number(A)>>>0,Number(N)>>>0)):[],pads:q?Array.from((k(),O).subarray(Number(q)>>>0,Number(Q)>>>0)):[],strides:te?Array.from((k(),O).subarray(Number(te)>>>0,Number(ce)>>>0)):[],w_is_const:()=>!!(k(),U)[Number(ke)>>>0],activation:Be(Ce),activation_params:Ct?Array.from((k(),H).subarray(Number(Ct)>>>0,Number(ii)>>>0)):[]})},1017855:u=>{t.$b("Gelu",u,void 0)},1017907:(u,p,_,y,T,A,N,q,Q)=>{t.$b("GroupQueryAttention",u,{numHeads:p,kvNumHeads:_,scale:y,softcap:T,doRotary:A,rotaryInterleaved:N,smoothSoftmax:q,localWindowSize:Q})},1018124:(u,p,_,y)=>{t.$b("LayerNormalization",u,{axis:p,epsilon:_,simplified:!!y})},1018235:(u,p,_,y)=>{t.$b("LayerNormalization",u,{axis:p,epsilon:_,simplified:!!y})},1018346:(u,p,_,y,T,A)=>{t.$b("MatMulNBits",u,{k:p,n:_,accuracyLevel:y,bits:T,blockSize:A})},1018473:(u,p,_,y,T,A)=>{t.$b("MultiHeadAttention",u,{numHeads:p,isUnidirectional:_,maskFilterValue:y,scale:T,doRotary:A})},1018632:(u,p)=>{t.$b("QuickGelu",u,{alpha:p})},1018696:(u,p,_,y,T)=>{t.$b("RotaryEmbedding",u,{interleaved:!!p,numHeads:_,rotaryEmbeddingDim:y,scale:T})},1018835:(u,p,_)=>{t.$b("SkipLayerNormalization",u,{epsilon:p,simplified:!!_})},1018937:(u,p,_)=>{t.$b("SkipLayerNormalization",u,{epsilon:p,simplified:!!_})},1019039:(u,p,_,y)=>{t.$b("GatherBlockQuantized",u,{gatherAxis:p,quantizeAxis:_,blockSize:y})},1019160:u=>{t.Fd(u)},1019194:(u,p)=>t.Hd(Number(u),Number(p),t.Yc.Kd,t.Yc.errors)};function D0(u,p,_){return Ls(async()=>{await t.Dd(Number(u),Number(p),Number(_))})}function P0(){return typeof wasmOffsetConverter<"u"}function L0(u,p,_,y){var T=fe();try{return vo(u,p,_,y)}catch(A){if(pe(T),A!==A+0)throw A;me(1,0)}}function U0(u,p,_){var y=fe();try{return bo(u,p,_)}catch(T){if(pe(y),T!==T+0)throw T;me(1,0)}}function j0(u){var p=fe();try{mo(u)}catch(_){if(pe(p),_!==_+0)throw _;me(1,0)}}function q0(u,p){var _=fe();try{return ri(u,p)}catch(y){if(pe(_),y!==y+0)throw y;me(1,0)}}function W0(u,p,_){var y=fe();try{fo(u,p,_)}catch(T){if(pe(y),T!==T+0)throw T;me(1,0)}}function F0(u,p){var _=fe();try{xo(u,p)}catch(y){if(pe(_),y!==y+0)throw y;me(1,0)}}function G0(u,p,_,y,T,A,N){var q=fe();try{return wo(u,p,_,y,T,A,N)}catch(Q){if(pe(q),Q!==Q+0)throw Q;me(1,0)}}function V0(u,p,_,y,T,A){var N=fe();try{go(u,p,_,y,T,A)}catch(q){if(pe(N),q!==q+0)throw q;me(1,0)}}function H0(u,p,_,y){var T=fe();try{$o(u,p,_,y)}catch(A){if(pe(T),A!==A+0)throw A;me(1,0)}}function K0(u,p,_,y,T){var A=fe();try{yo(u,p,_,y,T)}catch(N){if(pe(A),N!==N+0)throw N;me(1,0)}}function X0(u,p,_,y,T,A,N){var q=fe();try{ko(u,p,_,y,T,A,N)}catch(Q){if(pe(q),Q!==Q+0)throw Q;me(1,0)}}function Z0(u,p,_,y,T,A,N){var q=fe();try{To(u,p,_,y,T,A,N)}catch(Q){if(pe(q),Q!==Q+0)throw Q;me(1,0)}}function Y0(u,p,_,y,T,A,N,q){var Q=fe();try{zo(u,p,_,y,T,A,N,q)}catch(te){if(pe(Q),te!==te+0)throw te;me(1,0)}}function Q0(u,p,_,y,T){var A=fe();try{return So(u,p,_,y,T)}catch(N){if(pe(A),N!==N+0)throw N;me(1,0)}}function J0(u,p,_){var y=fe();try{return Ao(u,p,_)}catch(T){if(pe(y),T!==T+0)throw T;me(1,0)}}function ey(u,p,_,y,T,A,N,q){var Q=fe();try{Mo(u,p,_,y,T,A,N,q)}catch(te){if(pe(Q),te!==te+0)throw te;me(1,0)}}function ty(u,p,_,y,T,A,N,q,Q,te,ce,be){var ke=fe();try{Eo(u,p,_,y,T,A,N,q,Q,te,ce,be)}catch(Ce){if(pe(ke),Ce!==Ce+0)throw Ce;me(1,0)}}function ry(u,p,_,y,T,A){var N=fe();try{return Io(u,p,_,y,T,A)}catch(q){if(pe(N),q!==q+0)throw q;me(1,0)}}function ny(u,p,_){var y=fe();try{return No(u,p,_)}catch(T){if(pe(y),T!==T+0)throw T;return me(1,0),0n}}function iy(u,p,_,y,T,A,N,q,Q){var te=fe();try{_o(u,p,_,y,T,A,N,q,Q)}catch(ce){if(pe(te),ce!==ce+0)throw ce;me(1,0)}}function ay(u){var p=fe();try{return Oo(u)}catch(_){if(pe(p),_!==_+0)throw _;me(1,0)}}function sy(u,p){var _=fe();try{return Xo(u,p)}catch(y){if(pe(_),y!==y+0)throw y;return me(1,0),0n}}function oy(u){var p=fe();try{return Ro(u)}catch(_){if(pe(p),_!==_+0)throw _;return me(1,0),0n}}function uy(u,p,_,y){var T=fe();try{return jo(u,p,_,y)}catch(A){if(pe(T),A!==A+0)throw A;me(1,0)}}function ly(u,p,_,y,T){var A=fe();try{return qo(u,p,_,y,T)}catch(N){if(pe(A),N!==N+0)throw N;me(1,0)}}function dy(u,p,_,y,T,A){var N=fe();try{return Wo(u,p,_,y,T,A)}catch(q){if(pe(N),q!==q+0)throw q;me(1,0)}}function cy(u,p,_,y,T,A){var N=fe();try{return Fo(u,p,_,y,T,A)}catch(q){if(pe(N),q!==q+0)throw q;me(1,0)}}function py(u,p,_,y,T,A,N,q){var Q=fe();try{return Co(u,p,_,y,T,A,N,q)}catch(te){if(pe(Q),te!==te+0)throw te;me(1,0)}}function hy(u,p,_,y,T){var A=fe();try{return Go(u,p,_,y,T)}catch(N){if(pe(A),N!==N+0)throw N;return me(1,0),0n}}function fy(u,p,_,y){var T=fe();try{return Vo(u,p,_,y)}catch(A){if(pe(T),A!==A+0)throw A;me(1,0)}}function my(u,p,_,y){var T=fe();try{return Ho(u,p,_,y)}catch(A){if(pe(T),A!==A+0)throw A;me(1,0)}}function gy(u,p,_,y,T,A,N,q,Q,te,ce,be){var ke=fe();try{return Ko(u,p,_,y,T,A,N,q,Q,te,ce,be)}catch(Ce){if(pe(ke),Ce!==Ce+0)throw Ce;me(1,0)}}function yy(u,p,_,y,T,A,N,q,Q,te,ce){var be=fe();try{Lo(u,p,_,y,T,A,N,q,Q,te,ce)}catch(ke){if(pe(be),ke!==ke+0)throw ke;me(1,0)}}function by(u,p,_,y,T,A,N,q,Q,te,ce,be,ke,Ce,Ct,ii){var vy=fe();try{Uo(u,p,_,y,T,A,N,q,Q,te,ce,be,ke,Ce,Ct,ii)}catch(ai){if(pe(vy),ai!==ai+0)throw ai;me(1,0)}}function _y(u,p,_){var y=fe();try{return Bo(u,p,_)}catch(T){if(pe(y),T!==T+0)throw T;me(1,0)}}function wy(u,p,_){var y=fe();try{return Do(u,p,_)}catch(T){if(pe(y),T!==T+0)throw T;me(1,0)}}function $y(u,p,_,y){var T=fe();try{Po(u,p,_,y)}catch(A){if(pe(T),A!==A+0)throw A;me(1,0)}}function Jr(){if(0<he)Me=Jr;else if(i)b?.(t),C();else{for(var u=ge;0<u.length;)u.shift()(t);0<he?Me=Jr:(t.calledRun=!0,z||(C(),b?.(t)))}}return i||(wt=await Se(),Jr()),t.PTR_SIZE=4,L?t:new Promise((u,p)=>{b=u,x=p})}var qp,ou,cb=X(()=>{qp=su,ou=globalThis.self?.name?.startsWith("em-pthread"),ou&&su()}),pi,ma,uu,Ve,Wp,rn,lu,du,hi,cu,fi,Fp,mi,Gp,Pa=X(()=>{Da(),pi=typeof location>"u"?void 0:location.origin,ma=import.meta.url>"file:"&&import.meta.url<"file;",uu=()=>{{if(ma){let e=URL;return new URL(new e("ort.bundle.min.mjs",import.meta.url).href,pi).href}return import.meta.url}},Ve=uu(),Wp=()=>{if(Ve&&!Ve.startsWith("blob:"))return Ve.substring(0,Ve.lastIndexOf("/")+1)},rn=(e,t)=>{try{let r=t??Ve;return(r?new URL(e,r):new URL(e)).origin===pi}catch{return!1}},lu=(e,t)=>{let r=t??Ve;try{return(r?new URL(e,r):new URL(e)).href}catch{return}},du=(e,t)=>`${t??"./"}${e}`,hi=async e=>{let t=await(await fetch(e,{credentials:"same-origin"})).blob();return URL.createObjectURL(t)},cu=async e=>(await import(e)).default,fi=(db(),Lr(Lp)).default,Fp=async()=>{if(!Ve)throw new Error("Failed to load proxy worker: cannot determine the script source URL.");if(rn(Ve))return[void 0,fi()];let e=await hi(Ve);return[e,fi(e)]},mi=(cb(),Lr(jp)).default,Gp=async(e,t,r,n)=>{let i=mi&&!(e||t);if(i)if(Ve)i=rn(Ve)||n&&!r;else if(n&&!r)i=!0;else throw new Error("cannot determine the script source URL.");if(i)return[void 0,mi];{let a="ort-wasm-simd-threaded.jsep.mjs",s=e??lu(a,t),o=r&&s&&!rn(s,t),l=o?await hi(s):s??du(a,t);return[o?l:void 0,await cu(l)]}}}),gi,nn,$r,yi,pu,hu,fu,La,Ie,nr=X(()=>{Pa(),nn=!1,$r=!1,yi=!1,pu=()=>{if(typeof SharedArrayBuffer>"u")return!1;try{return typeof MessageChannel<"u"&&new MessageChannel().port1.postMessage(new SharedArrayBuffer(1)),WebAssembly.validate(new Uint8Array([0,97,115,109,1,0,0,0,1,4,1,96,0,0,3,2,1,0,5,4,1,3,1,1,10,11,1,9,0,65,0,254,16,2,0,26,11]))}catch{return!1}},hu=()=>{try{return WebAssembly.validate(new Uint8Array([0,97,115,109,1,0,0,0,1,4,1,96,0,0,3,2,1,0,10,30,1,28,0,65,0,253,15,253,12,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,253,186,1,26,11]))}catch{return!1}},fu=()=>{try{return WebAssembly.validate(new Uint8Array([0,97,115,109,1,0,0,0,1,5,1,96,0,1,123,3,2,1,0,10,19,1,17,0,65,1,253,15,65,2,253,15,65,3,253,15,253,147,2,11]))}catch{return!1}},La=async e=>{if(nn)return Promise.resolve();if($r)throw new Error("multiple calls to 'initializeWebAssembly()' detected.");if(yi)throw new Error("previous call to 'initializeWebAssembly()' failed.");$r=!0;let t=e.initTimeout,r=e.numThreads;if(e.simd!==!1){if(e.simd==="relaxed"){if(!fu())throw new Error("Relaxed WebAssembly SIMD is not supported in the current environment.")}else if(!hu())throw new Error("WebAssembly SIMD is not supported in the current environment.")}let n=pu();r>1&&!n&&(typeof self<"u"&&!self.crossOriginIsolated&&console.warn("env.wasm.numThreads is set to "+r+", but this will not work unless you enable crossOriginIsolated mode. See https://web.dev/cross-origin-isolation-guide/ for more info."),console.warn("WebAssembly multi-threading is not supported in the current environment. Falling back to single-threading."),e.numThreads=r=1);let i=e.wasmPaths,a=typeof i=="string"?i:void 0,s=i?.mjs,o=s?.href??s,l=i?.wasm,d=l?.href??l,c=e.wasmBinary,[h,f]=await Gp(o,a,r>1,!!c||!!d),g=!1,m=[];if(t>0&&m.push(new Promise(b=>{setTimeout(()=>{g=!0,b()},t)})),m.push(new Promise((b,x)=>{let $={numThreads:r};if(c)$.wasmBinary=c,$.locateFile=w=>w;else if(d||a)$.locateFile=w=>d??a+w;else if(o&&o.indexOf("blob:")!==0)$.locateFile=w=>new URL(w,o).href;else if(h){let w=Wp();w&&($.locateFile=S=>w+S)}f($).then(w=>{$r=!1,nn=!0,gi=w,b(),h&&URL.revokeObjectURL(h)},w=>{$r=!1,yi=!0,x(w)})})),await Promise.race(m),g)throw new Error(`WebAssembly backend initializing failed due to timeout: ${t}ms`)},Ie=()=>{if(nn&&gi)return gi;throw new Error("WebAssembly is not initialized yet.")}}),ut,Tn,$e,Ua=X(()=>{nr(),ut=(e,t)=>{let r=Ie(),n=r.lengthBytesUTF8(e)+1,i=r._malloc(n);return r.stringToUTF8(e,i,n),t.push(i),i},Tn=(e,t,r,n)=>{if(typeof e=="object"&&e!==null){if(r.has(e))throw new Error("Circular reference in options");r.add(e)}Object.entries(e).forEach(([i,a])=>{let s=t?t+i:i;if(typeof a=="object")Tn(a,s+".",r,n);else if(typeof a=="string"||typeof a=="number")n(s,a.toString());else if(typeof a=="boolean")n(s,a?"1":"0");else throw new Error(`Can't handle extra config type: ${typeof a}`)})},$e=e=>{let t=Ie(),r=t.stackSave();try{let n=t.PTR_SIZE,i=t.stackAlloc(2*n);t._OrtGetLastError(i,i+n);let a=Number(t.getValue(i,n===4?"i32":"i64")),s=t.getValue(i+n,"*"),o=s?t.UTF8ToString(s):"";throw new Error(`${e} ERROR_CODE: ${a}, ERROR_MESSAGE: ${o}`)}finally{t.stackRestore(r)}}}),Vp,pb=X(()=>{nr(),Ua(),Vp=e=>{let t=Ie(),r=0,n=[],i=e||{};try{if(e?.logSeverityLevel===void 0)i.logSeverityLevel=2;else if(typeof e.logSeverityLevel!="number"||!Number.isInteger(e.logSeverityLevel)||e.logSeverityLevel<0||e.logSeverityLevel>4)throw new Error(`log severity level is not valid: ${e.logSeverityLevel}`);if(e?.logVerbosityLevel===void 0)i.logVerbosityLevel=0;else if(typeof e.logVerbosityLevel!="number"||!Number.isInteger(e.logVerbosityLevel))throw new Error(`log verbosity level is not valid: ${e.logVerbosityLevel}`);e?.terminate===void 0&&(i.terminate=!1);let a=0;return e?.tag!==void 0&&(a=ut(e.tag,n)),r=t._OrtCreateRunOptions(i.logSeverityLevel,i.logVerbosityLevel,!!i.terminate,a),r===0&&$e("Can't create run options."),e?.extra!==void 0&&Tn(e.extra,"",new WeakSet,(s,o)=>{let l=ut(s,n),d=ut(o,n);t._OrtAddRunConfigEntry(r,l,d)!==0&&$e(`Can't set a run config entry: ${s} - ${o}.`)}),[r,n]}catch(a){throw r!==0&&t._OrtReleaseRunOptions(r),n.forEach(s=>t._free(s)),a}}}),mu,gu,yu,jt,bu,Hp,hb=X(()=>{nr(),Ua(),mu=e=>{switch(e){case"disabled":return 0;case"basic":return 1;case"extended":return 2;case"layout":return 3;case"all":return 99;default:throw new Error(`unsupported graph optimization level: ${e}`)}},gu=e=>{switch(e){case"sequential":return 0;case"parallel":return 1;default:throw new Error(`unsupported execution mode: ${e}`)}},yu=e=>{e.extra||(e.extra={}),e.extra.session||(e.extra.session={});let t=e.extra.session;t.use_ort_model_bytes_directly||(t.use_ort_model_bytes_directly="1"),e.executionProviders&&e.executionProviders.some(r=>(typeof r=="string"?r:r.name)==="webgpu")&&(e.enableMemPattern=!1)},jt=(e,t,r,n)=>{let i=ut(t,n),a=ut(r,n);Ie()._OrtAddSessionConfigEntry(e,i,a)!==0&&$e(`Can't set a session config entry: ${t} - ${r}.`)},bu=async(e,t,r)=>{let n=t.executionProviders;for(let i of n){let a=typeof i=="string"?i:i.name,s=[];switch(a){case"webnn":if(a="WEBNN",jt(e,"session.disable_quant_qdq","1",r),jt(e,"session.disable_qdq_constant_folding","1",r),typeof i!="string"){let h=i?.deviceType;h&&jt(e,"deviceType",h,r)}break;case"webgpu":if(a="JS",typeof i!="string"){let h=i;if(h?.preferredLayout){if(h.preferredLayout!=="NCHW"&&h.preferredLayout!=="NHWC")throw new Error(`preferredLayout must be either 'NCHW' or 'NHWC': ${h.preferredLayout}`);jt(e,"preferredLayout",h.preferredLayout,r)}}break;case"wasm":case"cpu":continue;default:throw new Error(`not supported execution provider: ${a}`)}let o=ut(a,r),l=s.length,d=0,c=0;if(l>0){d=Ie()._malloc(l*Ie().PTR_SIZE),r.push(d),c=Ie()._malloc(l*Ie().PTR_SIZE),r.push(c);for(let h=0;h<l;h++)Ie().setValue(d+h*Ie().PTR_SIZE,s[h][0],"*"),Ie().setValue(c+h*Ie().PTR_SIZE,s[h][1],"*")}await Ie()._OrtAppendExecutionProvider(e,o,d,c,l)!==0&&$e(`Can't append execution provider: ${a}.`)}},Hp=async e=>{let t=Ie(),r=0,n=[],i=e||{};yu(i);try{let a=mu(i.graphOptimizationLevel??"all"),s=gu(i.executionMode??"sequential"),o=typeof i.logId=="string"?ut(i.logId,n):0,l=i.logSeverityLevel??2;if(!Number.isInteger(l)||l<0||l>4)throw new Error(`log severity level is not valid: ${l}`);let d=i.logVerbosityLevel??0;if(!Number.isInteger(d)||d<0||d>4)throw new Error(`log verbosity level is not valid: ${d}`);let c=typeof i.optimizedModelFilePath=="string"?ut(i.optimizedModelFilePath,n):0;if(r=t._OrtCreateSessionOptions(a,!!i.enableCpuMemArena,!!i.enableMemPattern,s,!!i.enableProfiling,0,o,l,d,c),r===0&&$e("Can't create session options."),i.executionProviders&&await bu(r,i,n),i.enableGraphCapture!==void 0){if(typeof i.enableGraphCapture!="boolean")throw new Error(`enableGraphCapture must be a boolean value: ${i.enableGraphCapture}`);jt(r,"enableGraphCapture",i.enableGraphCapture.toString(),n)}if(i.freeDimensionOverrides)for(let[h,f]of Object.entries(i.freeDimensionOverrides)){if(typeof h!="string")throw new Error(`free dimension override name must be a string: ${h}`);if(typeof f!="number"||!Number.isInteger(f)||f<0)throw new Error(`free dimension override value must be a non-negative integer: ${f}`);let g=ut(h,n);t._OrtAddFreeDimensionOverride(r,g,f)!==0&&$e(`Can't set a free dimension override: ${h} - ${f}.`)}return i.extra!==void 0&&Tn(i.extra,"",new WeakSet,(h,f)=>{jt(r,h,f,n)}),[r,n]}catch(a){throw r!==0&&t._OrtReleaseSessionOptions(r)!==0&&$e("Can't release session options."),n.forEach(s=>t._free(s)),a}}}),Xt,vt,Zt,Rn,En,ja,qa,ga,ue=X(()=>{Xt=e=>{switch(e){case"int8":return 3;case"uint8":return 2;case"bool":return 9;case"int16":return 5;case"uint16":return 4;case"int32":return 6;case"uint32":return 12;case"float16":return 10;case"float32":return 1;case"float64":return 11;case"string":return 8;case"int64":return 7;case"uint64":return 13;case"int4":return 22;case"uint4":return 21;default:throw new Error(`unsupported data type: ${e}`)}},vt=e=>{switch(e){case 3:return"int8";case 2:return"uint8";case 9:return"bool";case 5:return"int16";case 4:return"uint16";case 6:return"int32";case 12:return"uint32";case 10:return"float16";case 1:return"float32";case 11:return"float64";case 8:return"string";case 7:return"int64";case 13:return"uint64";case 22:return"int4";case 21:return"uint4";default:throw new Error(`unsupported data type: ${e}`)}},Zt=(e,t)=>{let r=[-1,4,1,1,2,2,4,8,-1,1,2,8,4,8,-1,-1,-1,-1,-1,-1,-1,.5,.5][e],n=typeof t=="number"?t:t.reduce((i,a)=>i*a,1);return r>0?Math.ceil(n*r):void 0},Rn=e=>{switch(e){case"float16":return typeof Float16Array<"u"?Float16Array:Uint16Array;case"float32":return Float32Array;case"uint8":return Uint8Array;case"int8":return Int8Array;case"uint16":return Uint16Array;case"int16":return Int16Array;case"int32":return Int32Array;case"bool":return Uint8Array;case"float64":return Float64Array;case"uint32":return Uint32Array;case"int64":return BigInt64Array;case"uint64":return BigUint64Array;default:throw new Error(`unsupported type: ${e}`)}},En=e=>{switch(e){case"verbose":return 0;case"info":return 1;case"warning":return 2;case"error":return 3;case"fatal":return 4;default:throw new Error(`unsupported logging level: ${e}`)}},ja=e=>e==="float32"||e==="float16"||e==="int32"||e==="int64"||e==="uint32"||e==="uint8"||e==="bool"||e==="uint4"||e==="int4",qa=e=>e==="float32"||e==="float16"||e==="int32"||e==="int64"||e==="uint32"||e==="uint64"||e==="int8"||e==="uint8"||e==="bool"||e==="uint4"||e==="int4",ga=e=>{switch(e){case"none":return 0;case"cpu":return 1;case"cpu-pinned":return 2;case"texture":return 3;case"gpu-buffer":return 4;case"ml-tensor":return 5;default:throw new Error(`unsupported data location: ${e}`)}}}),Wa,Kp=X(()=>{Da(),Wa=async e=>{if(typeof e=="string"){let t=await fetch(e);if(!t.ok)throw new Error(`failed to load external data file: ${e}`);let r=t.headers.get("Content-Length"),n=r?parseInt(r,10):0;if(n<1073741824)return new Uint8Array(await t.arrayBuffer());{if(!t.body)throw new Error(`failed to load external data file: ${e}, no response body.`);let i=t.body.getReader(),a;try{a=new ArrayBuffer(n)}catch(o){if(o instanceof RangeError){let l=Math.ceil(n/65536);a=new WebAssembly.Memory({initial:l,maximum:l}).buffer}else throw o}let s=0;for(;;){let{done:o,value:l}=await i.read();if(o)break;let d=l.byteLength;new Uint8Array(a,s,d).set(l),s+=d}return new Uint8Array(a,0,n)}}else return e instanceof Blob?new Uint8Array(await e.arrayBuffer()):e instanceof Uint8Array?e:new Uint8Array(e)}}),_u,wu,$u,vu,Fa,xu,ye,xt=X(()=>{ue(),_u=["V","I","W","E","F"],wu=(e,t)=>{console.log(`[${_u[e]},${new Date().toISOString()}]${t}`)},Fa=(e,t)=>{$u=e,vu=t},xu=(e,t)=>{let r=En(e),n=En($u);r>=n&&wu(r,typeof t=="function"?t():t)},ye=(...e)=>{vu&&xu(...e)}}),Su,pr,D,In,Xp,Zp,Yp,le=X(()=>{Su=class{static calcMatMulShape(e,t){return e[1]!==t[0]?void 0:[e[0],t[1]]}},pr=class{static calcShape(e,t,r=!1){let n=e.length,i=t.length;if(n===0)return t;if(i===0)return e;let a=Math.max(e.length,t.length),s=new Array(a);if(r){if(n<2||i<2)return;let o=Su.calcMatMulShape([e[n-2],e[n-1]],[t[i-2],t[i-1]]);if(o===void 0)return;[s[a-2],s[a-1]]=o}for(let o=r?3:1;o<=a;o++){let l=n-o<0?1:e[n-o],d=i-o<0?1:t[i-o];if(l!==d&&l>1&&d>1)return;let c=Math.max(l,d);if(l&&d)s[a-o]=Math.max(l,d);else{if(c>1)return;s[a-o]=0}}return s}static isValidBroadcast(e,t){let r=e.length,n=t.length;if(r>n)return!1;for(let i=1;i<=r;i++)if(e[r-i]!==1&&e[r-i]!==t[n-i])return!1;return!0}},D=class $n{static size(t){return $n.getSizeFromDimensionRange(t,0,t.length)}static convertShape(t,r=4){let n=t.length;if(n===0)return[];let i=new Array(n),a=n-1;for(;a>=0;){if(t[a]%r===0){i[a]=t[a]/r;break}if(r%t[a]!==0)throw new Error("cannot convert shape");i[a]=1,r/=t[a],a--}for(a--;a>=0;a--)i[a]=t[a];return i}static sizeFromDimension(t,r){if(r<0||r>t.length)throw new Error(`invalid dimension of ${r} for sizeFromDimension as Tensor has ${t.length} dimensions.`);return $n.getSizeFromDimensionRange(t,r,t.length)}static sizeToDimension(t,r){if(r<0||r>t.length)throw new Error(`invalid dimension of ${r} for sizeToDimension as Tensor has ${t.length} dimensions.`);return $n.getSizeFromDimensionRange(t,0,r)}static getSizeFromDimensionRange(t,r,n){let i=1;for(let a=r;a<n;a++){if(t[a]<0)throw new Error("cannot get valid size from specified dimension range. Most likely the range contains negative values in them.");i*=Number(t[a])}return i}static computeStrides(t){let r=t.length;if(r===0)return[];if(r===1)return[1];let n=new Array(r);n[r-1]=1,n[r-2]=t[r-1];for(let i=r-3;i>=0;--i)n[i]=n[i+1]*t[i+1];return n}static normalizeAxis(t,r){if(t<-r&&t>=r)throw new Error("unsupported axis for this operation.");return t<0?t+r:t}static normalizeAxes(t,r){return t.map(n=>this.normalizeAxis(n,r??t.length))}static sortBasedOnPerm(t,r){return r?r.map(n=>t[n]):t.slice().reverse()}static padShape(t,r){let n=t.length;return t.map((i,a)=>i+r[a]+r[a+n])}static areEqual(t,r){return t.length!==r.length?!1:t.every((n,i)=>n===r[i])}},In=class Nr{static adjustPoolAttributes(t,r,n,i,a,s){if(!t&&n.length!==r.length-2)throw new Error("length of specified kernel shapes should be 2 less than length of input dimensions");if(t)for(let o=0;o<r.length-2;o++)o>=n.length?n.push(r[o+2]):n[o]=r[o+2];for(let o=0;o<n.length;o++)if(o<i.length){if(i[o]<0)throw new Error("strides should be greater than or equal to 1")}else i.push(1);for(let o=0;o<n.length;o++)if(o<a.length){if(a[o]<0)throw new Error("dilations should be greater than or equal to 1")}else a.push(1);for(let o=0;o<n.length*2;o++)if(o<s.length){if(s[o]<0)throw new Error("pad should be greater than or equal to 1")}else s.push(0);for(let o=0;o<n.length;o++){if(n[o]<=0)throw new Error("kernel shapes need to be greater than 0");if(s[o]>=n[o]||s[o+n.length]>=n[o])throw new Error("pads should be smaller than kernel")}}static adjustPadsBasedOnAutoPad(t,r,n,i,a,s,o){if(o){if(a.length!==2*(t.length-2))throw new Error("length of pads should be twice the length of data dimensions");if(r.length!==t.length-2)throw new Error("length of strides should be the length of data dimensions");if(i.length!==t.length-2)throw new Error("length of kernel shapes should be the length of data dimensions");for(let l=0;l<t.length-2;l++)Nr.adjustPadAndReturnShape(t[l+(s?1:2)],r[l],n[l],i[l],a,l,l+t.length-2,o)}}static computePoolOutputShape(t,r,n,i,a,s,o){if(r.length<=0)throw new Error("input shape must be of size greater than 0");let l=[r[0],r[1]];return Nr.computeShapeHelper(t,r,l,n,i,a,s,o),l}static computeConvOutputShape(t,r,n,i,a,s,o){if(t.length<=0||r.length<=0)throw new Error("invalid input tensor dims or invalid filter tensor dims");let l=[t[0],r[0]];return Nr.computeShapeHelper(!1,t,l,n,i,a,s,o),l}static computeShapeHelper(t,r,n,i,a,s,o,l){if(t)for(let d=0;d<r.length-2;d++)n.push(1);else for(let d=0;d<r.length-2;d++)n.push(Nr.adjustPadAndReturnShape(r[d+2],i[d],a[d],s[d],o,d,d+r.length-2,l))}static adjustPadAndReturnShape(t,r,n,i,a,s,o,l){let d=n*(i-1)+1;if(l&&l!=="NOTSET")switch(l){case"VALID":return a[s]=0,a[o]=0,Math.floor((t-d)/r+1);case"SAME_LOWER":case"SAME_UPPER":if(n!==1)throw new Error("Dilation not supported for SAME_UPPER or SAME_LOWER");{let c=((t+r-1)/r-1)*r+i-t;return a[s]=Math.floor(l==="SAME_LOWER"?(c+1)/2:c/2),a[o]=c-a[s],Math.floor((t+c-i)/r+1)}default:throw new Error("Unsupported AutoPad type")}else return Math.floor((t+a[s]+a[o]-d)/r+1)}},Xp=class{static getShapeOfGemmResult(e,t,r,n,i){if(e.length!==2||r.length!==2)throw new Error("shape need to be of size 2");let a,s,o;t?(a=e[1],s=e[0]):(a=e[0],s=e[1]);let l=-1;if(n?(o=r[0],l=1):(o=r[1],l=0),r[l]!==s)throw new Error("dimension mismatch");if(a<=0||o<=0||s<=0)throw new Error("invalid shape specified");if(i&&!pr.isValidBroadcast(i,[a,o]))throw new Error("gemm: invalid bias shape for broadcast");return[a,o,s]}},Zp=-34028234663852886e22,Yp=34028234663852886e22}),Ga,Qp=X(()=>{ue(),Ga=(e,t)=>new(Rn(t))(e)}),bi,ya,_i,ku,wi,Tu,$i,vi,xi,Eu,Jp,fb=X(()=>{ue(),xt(),bi=new Map([["float32",32],["float16",16],["int32",32],["uint32",32],["int64",64],["uint64",64],["int8",8],["uint8",8],["int4",4],["uint4",4]]),ya=(e,t)=>{if(t==="int32")return e;let r=bi.get(t);if(!r)throw new Error(`WebNN backend does not support data type: ${t}`);let n=r/8;if(e.byteLength%n!==0)throw new Error(`Invalid Uint8Array length - must be a multiple of ${n}.`);let i=e.byteLength/n,a=new(Rn(t))(e.buffer,e.byteOffset,i);switch(t){case"int64":case"uint64":{let s=new Int32Array(i);for(let o=0;o<i;o++){let l=a[o];if(l>2147483647n||l<-2147483648n)throw new Error("Can not convert int64 data to int32 - value out of range.");s[o]=Number(l)}return new Uint8Array(s.buffer)}case"int8":case"uint8":case"uint32":{if(t==="uint32"&&a.some(o=>o>2147483647))throw new Error("Can not convert uint32 data to int32 - value out of range.");let s=Int32Array.from(a,Number);return new Uint8Array(s.buffer)}default:throw new Error(`Unsupported data conversion from ${t} to 'int32'`)}},_i=(e,t)=>{if(t==="int32")return e;if(e.byteLength%4!==0)throw new Error("Invalid Uint8Array length - must be a multiple of 4 (int32).");let r=e.byteLength/4,n=new Int32Array(e.buffer,e.byteOffset,r);switch(t){case"int64":{let i=BigInt64Array.from(n,BigInt);return new Uint8Array(i.buffer)}case"uint64":{if(n.some(a=>a<0))throw new Error("Can not convert int32 data to uin64 - negative value found.");let i=BigUint64Array.from(n,BigInt);return new Uint8Array(i.buffer)}case"int8":{if(n.some(a=>a<-128||a>127))throw new Error("Can not convert int32 data to int8 - value out of range.");let i=Int8Array.from(n,Number);return new Uint8Array(i.buffer)}case"uint8":{if(n.some(i=>i<0||i>255))throw new Error("Can not convert int32 data to uint8 - value out of range.");return Uint8Array.from(n,Number)}case"uint32":{if(n.some(a=>a<0))throw new Error("Can not convert int32 data to uint32 - negative value found.");let i=Uint32Array.from(n,Number);return new Uint8Array(i.buffer)}default:throw new Error(`Unsupported data conversion from 'int32' to ${t}`)}},ku=1,wi=()=>ku++,Tu=new Map([["int8","int32"],["uint8","int32"],["uint32","int32"],["int64","int32"]]),$i=(e,t)=>{let r=bi.get(e);if(!r)throw new Error(`WebNN backend does not support data type: ${e}`);return t.length>0?Math.ceil(t.reduce((n,i)=>n*i)*r/8):0},vi=class{constructor(e){this.isDataConverted=!1;let{sessionId:t,context:r,tensor:n,dataType:i,shape:a,fallbackDataType:s}=e;this.sessionId=t,this.mlContext=r,this.mlTensor=n,this.dataType=i,this.tensorShape=a,this.fallbackDataType=s}get tensor(){return this.mlTensor}get type(){return this.dataType}get fallbackType(){return this.fallbackDataType}get shape(){return this.tensorShape}get byteLength(){return $i(this.dataType,this.tensorShape)}destroy(){ye("verbose",()=>"[WebNN] TensorWrapper.destroy"),this.mlTensor.destroy()}write(e){this.mlContext.writeTensor(this.mlTensor,e)}async read(e){if(this.fallbackDataType){let t=await this.mlContext.readTensor(this.mlTensor),r=_i(new Uint8Array(t),this.dataType);if(e){(e instanceof ArrayBuffer?new Uint8Array(e):new Uint8Array(e.buffer,e.byteOffset,e.byteLength)).set(r);return}else return new Uint8Array(r).buffer}else return e?this.mlContext.readTensor(this.mlTensor,e):this.mlContext.readTensor(this.mlTensor)}canReuseTensor(e,t,r){return this.mlContext===e&&this.dataType===t&&this.tensorShape.length===r.length&&this.tensorShape.every((n,i)=>n===r[i])}setIsDataConverted(e){this.isDataConverted=e}},xi=class{constructor(e,t){this.tensorManager=e,this.wrapper=t}get tensorWrapper(){return this.wrapper}releaseTensor(){this.tensorWrapper&&(this.tensorManager.releaseTensor(this.tensorWrapper),this.wrapper=void 0)}async ensureTensor(e,t,r,n){let i=this.tensorManager.getMLContext(e),a=this.tensorManager.getMLOpSupportLimits(e),s;if(!a?.input.dataTypes.includes(t)){if(s=Tu.get(t),!s||a?.input.dataTypes.includes(s))throw new Error(`WebNN backend does not support data type: ${t}`);ye("verbose",()=>`[WebNN] TensorIdTracker.ensureTensor: fallback dataType from ${t} to ${s}`)}if(this.wrapper){if(this.wrapper.canReuseTensor(i,t,r))return this.wrapper.tensor;if(n){if(this.wrapper.byteLength!==$i(t,r))throw new Error("Unable to copy data to tensor with different size.");this.activeUpload=new Uint8Array(await this.wrapper.read())}this.tensorManager.releaseTensor(this.wrapper)}let o=typeof MLTensorUsage>"u"?void 0:MLTensorUsage.READ|MLTensorUsage.WRITE;return this.wrapper=await this.tensorManager.getCachedTensor(e,t,r,o,!0,!0,s),n&&this.activeUpload&&(this.wrapper.write(this.activeUpload),this.activeUpload=void 0),this.wrapper.tensor}upload(e){let t=e;if(this.wrapper){if(this.wrapper.fallbackType)if(this.wrapper.fallbackType==="int32")t=ya(e,this.wrapper.type),this.wrapper.setIsDataConverted(!0);else throw new Error(`Unsupported fallback data type: ${this.wrapper.fallbackType}`);if(e.byteLength===this.wrapper.byteLength){this.wrapper.write(t);return}else ye("verbose",()=>"Data size does not match tensor size. Releasing tensor."),this.releaseTensor()}this.activeUpload?this.activeUpload.set(t):this.activeUpload=new Uint8Array(t)}async download(e){if(this.activeUpload){let t=this.wrapper?.isDataConverted?_i(this.activeUpload,this.wrapper?.type):this.activeUpload;if(e){e instanceof ArrayBuffer?new Uint8Array(e).set(t):new Uint8Array(e.buffer,e.byteOffset,e.byteLength).set(t);return}else return t.buffer}if(!this.wrapper)throw new Error("Tensor has not been created.");return e?this.wrapper.read(e):this.wrapper.read()}},Eu=class{constructor(e){this.backend=e,this.tensorTrackersById=new Map,this.freeTensors=[],this.externalTensors=new Set}getMLContext(e){let t=this.backend.getMLContext(e);if(!t)throw new Error("MLContext not found for session.");return t}getMLOpSupportLimits(e){return this.backend.getMLOpSupportLimits(e)}reserveTensorId(){let e=wi();return this.tensorTrackersById.set(e,new xi(this)),e}releaseTensorId(e){let t=this.tensorTrackersById.get(e);t&&(this.tensorTrackersById.delete(e),t.tensorWrapper&&this.releaseTensor(t.tensorWrapper))}async ensureTensor(e,t,r,n,i){ye("verbose",()=>`[WebNN] TensorManager.ensureTensor {tensorId: ${t}, dataType: ${r}, shape: ${n}, copyOld: ${i}}`);let a=this.tensorTrackersById.get(t);if(!a)throw new Error("Tensor not found.");return a.ensureTensor(e,r,n,i)}upload(e,t){let r=this.tensorTrackersById.get(e);if(!r)throw new Error("Tensor not found.");r.upload(t)}async download(e,t){ye("verbose",()=>`[WebNN] TensorManager.download {tensorId: ${e}, dstBuffer: ${t?.byteLength}}`);let r=this.tensorTrackersById.get(e);if(!r)throw new Error("Tensor not found.");return r.download(t)}releaseTensorsForSession(e){for(let t of this.freeTensors)t.sessionId===e&&t.destroy();this.freeTensors=this.freeTensors.filter(t=>t.sessionId!==e)}registerTensor(e,t,r,n){let i=this.getMLContext(e),a=wi(),s=new vi({sessionId:e,context:i,tensor:t,dataType:r,shape:n});return this.tensorTrackersById.set(a,new xi(this,s)),this.externalTensors.add(s),a}async getCachedTensor(e,t,r,n,i,a,s){let o=this.getMLContext(e);for(let[d,c]of this.freeTensors.entries())if(c.canReuseTensor(o,t,r)){ye("verbose",()=>`[WebNN] Reusing tensor {dataType: ${t}, ${s?`fallbackDataType: ${s},`:""} shape: ${r}`);let h=this.freeTensors.splice(d,1)[0];return h.sessionId=e,h}ye("verbose",()=>`[WebNN] MLContext.createTensor {dataType: ${t}, ${s?`fallbackDataType: ${s},`:""} shape: ${r}}`);let l=await o.createTensor({dataType:s??t,shape:r,dimensions:r,usage:n,writable:i,readable:a});return new vi({sessionId:e,context:o,tensor:l,dataType:t,shape:r,fallbackDataType:s})}releaseTensor(e){this.externalTensors.has(e)&&this.externalTensors.delete(e),this.freeTensors.push(e)}},Jp=(...e)=>new Eu(...e)}),vr,Iu,eh,mb=X(()=>{ue(),nr(),Qp(),fb(),xt(),vr=new Map([[1,"float32"],[10,"float16"],[6,"int32"],[12,"uint32"],[7,"int64"],[13,"uint64"],[22,"int4"],[21,"uint4"],[3,"int8"],[2,"uint8"],[9,"uint8"]]),Iu=(e,t)=>{if(e===t)return!0;if(e===void 0||t===void 0)return!1;let r=Object.keys(e).sort(),n=Object.keys(t).sort();return r.length===n.length&&r.every((i,a)=>i===n[a]&&e[i]===t[i])},eh=class{constructor(e){this.tensorManager=Jp(this),this.mlContextBySessionId=new Map,this.sessionIdsByMLContext=new Map,this.mlContextCache=[],this.sessionGraphInputs=new Map,this.sessionGraphOutputs=new Map,this.temporaryGraphInputs=[],this.temporaryGraphOutputs=[],this.temporarySessionTensorIds=new Map,this.mlOpSupportLimitsBySessionId=new Map,Fa(e.logLevel,!!e.debug)}get currentSessionId(){if(this.activeSessionId===void 0)throw new Error("No active session");return this.activeSessionId}onRunStart(e){ye("verbose",()=>`[WebNN] onRunStart {sessionId: ${e}}`),this.activeSessionId=e}onRunEnd(e){ye("verbose",()=>`[WebNN] onRunEnd {sessionId: ${e}}`);let t=this.temporarySessionTensorIds.get(e);if(t){for(let r of t)ye("verbose",()=>`[WebNN] releasing temporary tensor {tensorId: ${r}}`),this.tensorManager.releaseTensorId(r);this.temporarySessionTensorIds.delete(e),this.activeSessionId=void 0}}async createMLContext(e){if(e instanceof GPUDevice){let r=this.mlContextCache.findIndex(n=>n.gpuDevice===e);if(r!==-1)return this.mlContextCache[r].mlContext;{let n=await navigator.ml.createContext(e);return this.mlContextCache.push({gpuDevice:e,mlContext:n}),n}}else if(e===void 0){let r=this.mlContextCache.findIndex(n=>n.options===void 0&&n.gpuDevice===void 0);if(r!==-1)return this.mlContextCache[r].mlContext;{let n=await navigator.ml.createContext();return this.mlContextCache.push({mlContext:n}),n}}let t=this.mlContextCache.findIndex(r=>Iu(r.options,e));if(t!==-1)return this.mlContextCache[t].mlContext;{let r=await navigator.ml.createContext(e);return this.mlContextCache.push({options:e,mlContext:r}),r}}registerMLContext(e,t){this.mlContextBySessionId.set(e,t);let r=this.sessionIdsByMLContext.get(t);r||(r=new Set,this.sessionIdsByMLContext.set(t,r)),r.add(e),this.mlOpSupportLimitsBySessionId.has(e)||this.mlOpSupportLimitsBySessionId.set(e,t.opSupportLimits()),this.temporaryGraphInputs.length>0&&(this.sessionGraphInputs.set(e,this.temporaryGraphInputs),this.temporaryGraphInputs=[]),this.temporaryGraphOutputs.length>0&&(this.sessionGraphOutputs.set(e,this.temporaryGraphOutputs),this.temporaryGraphOutputs=[])}onReleaseSession(e){this.sessionGraphInputs.delete(e),this.sessionGraphOutputs.delete(e);let t=this.mlContextBySessionId.get(e);if(!t)return;this.tensorManager.releaseTensorsForSession(e),this.mlContextBySessionId.delete(e),this.mlOpSupportLimitsBySessionId.delete(e);let r=this.sessionIdsByMLContext.get(t);if(r.delete(e),r.size===0){this.sessionIdsByMLContext.delete(t);let n=this.mlContextCache.findIndex(i=>i.mlContext===t);n!==-1&&this.mlContextCache.splice(n,1)}}getMLContext(e){return this.mlContextBySessionId.get(e)}getMLOpSupportLimits(e){return this.mlOpSupportLimitsBySessionId.get(e)}reserveTensorId(){return this.tensorManager.reserveTensorId()}releaseTensorId(e){ye("verbose",()=>`[WebNN] releaseTensorId {tensorId: ${e}}`),this.tensorManager.releaseTensorId(e)}async ensureTensor(e,t,r,n,i){let a=vr.get(r);if(!a)throw new Error(`Unsupported ONNX data type: ${r}`);return this.tensorManager.ensureTensor(e??this.currentSessionId,t,a,n,i)}async createTemporaryTensor(e,t,r){ye("verbose",()=>`[WebNN] createTemporaryTensor {onnxDataType: ${t}, shape: ${r}}`);let n=vr.get(t);if(!n)throw new Error(`Unsupported ONNX data type: ${t}`);let i=this.tensorManager.reserveTensorId();await this.tensorManager.ensureTensor(e,i,n,r,!1);let a=this.temporarySessionTensorIds.get(e);return a?a.push(i):this.temporarySessionTensorIds.set(e,[i]),i}uploadTensor(e,t){if(!Ie().shouldTransferToMLTensor)throw new Error("Trying to upload to a MLTensor while shouldTransferToMLTensor is false");ye("verbose",()=>`[WebNN] uploadTensor {tensorId: ${e}, data: ${t.byteLength}}`),this.tensorManager.upload(e,t)}async downloadTensor(e,t){return this.tensorManager.download(e,t)}createMLTensorDownloader(e,t){return async()=>{let r=await this.tensorManager.download(e);return Ga(r,t)}}registerMLTensor(e,t,r,n){let i=vr.get(r);if(!i)throw new Error(`Unsupported ONNX data type: ${r}`);let a=this.tensorManager.registerTensor(e,t,i,n);return ye("verbose",()=>`[WebNN] registerMLTensor {tensor: ${t}, dataType: ${i}, dimensions: ${n}} -> {tensorId: ${a}}`),a}registerMLConstant(e,t,r,n,i,a,s=!1){if(!a)throw new Error("External mounted files are not available.");let o=e;e.startsWith("./")&&(o=e.substring(2));let l=a.get(o);if(!l)throw new Error(`File with name ${o} not found in preloaded files.`);if(t+r>l.byteLength)throw new Error("Out of bounds: data offset and length exceed the external file data size.");let d=l.slice(t,t+r).buffer,c;switch(i.dataType){case"float32":c=new Float32Array(d);break;case"float16":c=typeof Float16Array<"u"?new Float16Array(d):new Uint16Array(d);break;case"int32":c=new Int32Array(d);break;case"uint32":c=new Uint32Array(d);break;case"int64":if(s){let h=ya(new Uint8Array(d),"int64");c=new Int32Array(h.buffer),i.dataType="int32"}else c=new BigInt64Array(d);break;case"uint64":c=new BigUint64Array(d);break;case"int8":c=new Int8Array(d);break;case"int4":case"uint4":case"uint8":c=new Uint8Array(d);break;default:throw new Error(`Unsupported data type: ${i.dataType} in creating WebNN Constant from external data.`)}return ye("verbose",()=>`[WebNN] registerMLConstant {dataType: ${i.dataType}, shape: ${i.shape}}} ${s?"(Note: it was int64 data type and registered to int32 as workaround)":""}`),n.constant(i,c)}registerGraphInput(e){this.temporaryGraphInputs.push(e)}registerGraphOutput(e){this.temporaryGraphOutputs.push(e)}isGraphInput(e,t){let r=this.sessionGraphInputs.get(e);return r?r.includes(t):!1}isGraphOutput(e,t){let r=this.sessionGraphOutputs.get(e);return r?r.includes(t):!1}isGraphInputOutputTypeSupported(e,t,r=!0){let n=vr.get(Xt(t)),i=this.mlOpSupportLimitsBySessionId.get(e);return typeof n>"u"?!1:r?!!i?.input.dataTypes.includes(n):!!i?.output.dataTypes.includes(n)}flush(){}}}),Va=X(()=>{}),Si,an,sn,Cu,zu,ki,ba,Au,th,gb=X(()=>{xt(),Va(),Si=new Map([[64,250],[128,200],[256,200],[512,200],[2048,230],[4096,200],[8192,50],[16384,50],[32768,50],[65536,50],[131072,50],[262144,50],[524288,50],[1048576,50],[2097152,30],[4194304,20],[8388608,10],[12582912,10],[16777216,10],[26214400,15],[33554432,22],[44236800,2],[58982400,6],[67108864,6],[134217728,6],[167772160,6]]),an=[],sn=e=>Math.ceil(Number(e)/16)*16,Cu=e=>{for(let t=0;t<an.length;t++){let r=an[t];if(e<=r)return r}return Math.ceil(e/16)*16},zu=1,ki=()=>zu++,ba=async(e,t,r,n)=>{let i=sn(r),a=e.device.createBuffer({size:i,usage:GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ});try{let s=e.getCommandEncoder();e.endComputePass(),s.copyBufferToBuffer(t,0,a,0,i),e.flush(),await a.mapAsync(GPUMapMode.READ);let o=a.getMappedRange();if(n){let l=n();return l.set(new Uint8Array(o,0,r)),l}else return new Uint8Array(o.slice(0,r))}finally{a.destroy()}},Au=class{constructor(e){this.backend=e,this.storageCache=new Map,this.freeBuffers=new Map,this.freeUniformBuffers=new Map,this.buffersPending=[],this.capturedPendingBuffers=new Map;for(let[t]of Si)an.push(t),this.freeBuffers.set(t,[]),this.freeUniformBuffers.set(t,[]);this.sessionCount=0}upload(e,t){let r=t.buffer,n=t.byteOffset,i=t.byteLength,a=sn(i),s=this.storageCache.get(e);if(!s)throw new Error("gpu data for uploading does not exist");if(Number(s.originalSize)!==i)throw new Error(`inconsistent data size. gpu data size=${s.originalSize}, data size=${i}`);let o=this.backend.device.createBuffer({mappedAtCreation:!0,size:a,usage:GPUBufferUsage.MAP_WRITE|GPUBufferUsage.COPY_SRC}),l=o.getMappedRange();new Uint8Array(l).set(new Uint8Array(r,n,i)),o.unmap();let d=this.backend.device.createCommandEncoder();d.copyBufferToBuffer(o,0,s.gpuData.buffer,0,a),this.backend.device.queue.submit([d.finish()]),o.destroy(),ye("verbose",()=>`[WebGPU] GpuDataManager.upload(id=${e})`)}memcpy(e,t){let r=this.storageCache.get(e);if(!r)throw new Error("source gpu data for memcpy does not exist");let n=this.storageCache.get(t);if(!n)throw new Error("destination gpu data for memcpy does not exist");if(r.originalSize!==n.originalSize)throw new Error("inconsistent source and destination gpu data size");let i=sn(r.originalSize),a=this.backend.getCommandEncoder();this.backend.endComputePass(),a.copyBufferToBuffer(r.gpuData.buffer,0,n.gpuData.buffer,0,i)}registerExternalBuffer(e,t,r){let n;if(r){if(n=r[0],e===r[1])return ye("verbose",()=>`[WebGPU] GpuDataManager.registerExternalBuffer(size=${t}) => id=${n}, buffer is the same, skip.`),n;if(this.backend.capturedCommandList.has(this.backend.currentSessionId))throw new Error(`Registering a different external buffer under graph capture mode is not supported yet.
             Please use the previous external buffer!`)}else n=ki();return this.storageCache.set(n,{gpuData:{id:n,type:0,buffer:e},originalSize:t}),ye("verbose",()=>`[WebGPU] GpuDataManager.registerExternalBuffer(size=${t}) => id=${n}, registered.`),n}unregisterExternalBuffer(e){e!==void 0&&(this.storageCache.delete(e),ye("verbose",()=>`[WebGPU] GpuDataManager.unregisterExternalBuffer() => id=${e}`))}create(e,t=GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC|GPUBufferUsage.COPY_DST){let r=Cu(e),n,i=(t&GPUBufferUsage.STORAGE)===GPUBufferUsage.STORAGE,a=(t&GPUBufferUsage.UNIFORM)===GPUBufferUsage.UNIFORM;if(i||a){let o=(i?this.freeBuffers:this.freeUniformBuffers).get(r);o?o.length>0?n=o.pop():n=this.backend.device.createBuffer({size:r,usage:t}):n=this.backend.device.createBuffer({size:r,usage:t})}else n=this.backend.device.createBuffer({size:r,usage:t});let s={id:ki(),type:0,buffer:n};return this.storageCache.set(s.id,{gpuData:s,originalSize:Number(e)}),ye("verbose",()=>`[WebGPU] GpuDataManager.create(size=${e}) => id=${s.id}`),s}get(e){return this.storageCache.get(e)?.gpuData}release(e){let t=typeof e=="bigint"?Number(e):e,r=this.storageCache.get(t);if(!r){if(this.storageCache.size===0)return 0;throw new Error("releasing data does not exist")}return ye("verbose",()=>`[WebGPU] GpuDataManager.release(id=${t}), gpuDataId=${r.gpuData.id}`),this.storageCache.delete(t),this.buffersPending.push(r.gpuData.buffer),r.originalSize}async download(e,t){let r=this.storageCache.get(Number(e));if(!r)throw new Error("data does not exist");await ba(this.backend,r.gpuData.buffer,r.originalSize,t)}refreshPendingBuffers(){if(this.buffersPending.length!==0)if(this.backend.sessionStatus==="default"){for(let e of this.buffersPending){let t=Si.get(e.size);if((e.usage&GPUBufferUsage.STORAGE)===GPUBufferUsage.STORAGE){let r=this.freeBuffers.get(e.size)||[];t===void 0||r.length>=t?e.destroy():r.push(e)}else if((e.usage&GPUBufferUsage.UNIFORM)===GPUBufferUsage.UNIFORM){let r=this.freeUniformBuffers.get(e.size)||[];t===void 0||r.length>=t?e.destroy():r.push(e)}else e.destroy()}this.buffersPending=[]}else{let e=this.capturedPendingBuffers.get(this.backend.currentSessionId);e||(e=[],this.capturedPendingBuffers.set(this.backend.currentSessionId,e));for(let t of this.buffersPending)e.push(t);this.buffersPending=[]}}dispose(){this.freeBuffers.forEach(e=>{e.forEach(t=>{t.destroy()})}),this.freeUniformBuffers.forEach(e=>{e.forEach(t=>{t.destroy()})}),this.storageCache.forEach(e=>{e.gpuData.buffer.destroy()}),this.capturedPendingBuffers.forEach(e=>{e.forEach(t=>{t.destroy()})}),this.storageCache=new Map,this.freeBuffers=new Map,this.freeUniformBuffers=new Map,this.capturedPendingBuffers=new Map}onCreateSession(){this.sessionCount+=1}onReleaseSession(e){let t=this.capturedPendingBuffers.get(e);t&&(t.forEach(r=>{r.destroy()}),this.capturedPendingBuffers.delete(e)),this.sessionCount-=1,this.sessionCount===0&&(ye("warning",()=>"[WebGPU] Clearing webgpu buffer cache"),this.storageCache.forEach(r=>{r.gpuData.buffer.destroy()}),this.storageCache=new Map)}},th=(...e)=>new Au(...e)}),Mu,we,Oe=X(()=>{Mu=class{constructor(e){Object.assign(this,e)}get cacheKey(){return this.key||(this.key=Object.getOwnPropertyNames(this).sort().map(e=>`${this[e]}`).join(";")),this.key}},we=e=>new Mu(e)}),hr,on,De,qe,oe,Ne,_a,dr,Rt,ae,xr,W,ne,rh,Ha,Nu,nh,de=X(()=>{ue(),le(),hr=64,on=(e,t)=>{if(t===3)throw new Error("vec3 has same alignment as vec4, use vec4 instead");switch(Number(e)){case 10:return t>1?`vec${t}<f16>`:"f16";case 1:return t>1?`vec${t}<f32>`:"f32";case 6:return t>1?`vec${t}<i32>`:"i32";case 12:return t>1?`vec${t}<u32>`:"u32";case 7:if(t>1)throw new Error("currently not supported vecX of uint64 yet");return["vec2<u32>","i32"];case 13:if(t>1)throw new Error("currently not supported vecX of uint64 yet");return["vec2<u32>","u32"];case 9:if(t!==4)throw new Error("bool must be vec4");return["u32","vec4<bool>"];case 22:return"i32";case 21:return"u32";default:throw new Error(`Unknown data type: ${e}`)}},De=(e,t=1)=>{let r=on(e,t);return typeof r=="string"?r:r[0]},qe=(e,t=1)=>{let r=on(e,t);return typeof r=="string"?r:r[1]},oe=(...e)=>{let t=[];return e.forEach(r=>{r.length!==0&&t.push({type:12,data:r},{type:12,data:D.computeStrides(r)})}),t},Ne=e=>e%4===0?4:e%2===0?2:1,_a=(e="f32",t,r="0")=>!t||t===1?`${e}(${r})`:`vec${t}<${e}>(${r})`,dr=(e,t,r)=>e==="f32"?r:t===1?`f32(${r})`:`vec${t}<f32>(${r})`,Rt=(e,t)=>t===4?`(${e}.x + ${e}.y + ${e}.z + ${e}.w)`:t===2?`(${e}.x + ${e}.y)`:t===3?`(${e}.x + ${e}.y + ${e}.z)`:e,ae=(e,t,r,n)=>e.startsWith("uniforms.")&&r>4?typeof t=="string"?n==="f16"?`${e}[(${t}) / 8][(${t}) % 8 / 4][(${t}) % 8 % 4]`:`${e}[(${t}) / 4][(${t}) % 4]`:n==="f16"?`${e}[${Math.floor(t/8)}][${Math.floor(t%8/4)}][${t%8%4}]`:`${e}[${Math.floor(t/4)}][${t%4}]`:r>1?`${e}[${t}]`:e,xr=(e,t,r,n,i)=>{let a=typeof r=="number",s=a?r:r.length,o=[...new Array(s).keys()],l=s<2?"u32":s<=4?`vec${s}<u32>`:`array<u32, ${s}>`,d=on(t,i),c=typeof d=="string"?d:d[1],h=typeof d=="string"?d:d[0],f={indices:l,value:c,storage:h,tensor:t},g=L=>typeof L=="string"?L:`${L}u`,m={offsetToIndices:!1,indicesToOffset:!1,broadcastedIndicesToOffset:!1,set:!1,setByIndices:!1,get:!1,getByIndices:!1},b=a?"uniforms.":"",x=`${b}${e}_shape`,$=`${b}${e}_strides`,w="";for(let L=0;L<s-1;L++)w+=`
    let dim${L} = current / ${ae($,L,s)};
    let rest${L} = current % ${ae($,L,s)};
    indices[${L}] = dim${L};
    current = rest${L};
    `;w+=`indices[${s-1}] = current;`;let S=s<2?"":`
  fn o2i_${e}(offset: u32) -> ${f.indices} {
    var indices: ${f.indices};
    var current = offset;
    ${w}
    return indices;
  }`,v=L=>(m.offsetToIndices=!0,s<2?L:`o2i_${e}(${L})`),E=[];if(s>=2)for(let L=s-1;L>=0;L--)E.push(`${ae($,L,s)} * (indices[${L}])`);let z=s<2?"":`
  fn i2o_${e}(indices: ${f.indices}) -> u32 {
    return ${E.join("+")};
  }`,M=L=>(m.indicesToOffset=!0,s<2?L:`i2o_${e}(${L})`),k=(...L)=>s===0?"0u":`${f.indices}(${L.map(g).join(",")})`,B=(L,re)=>s<2?`${L}`:`${ae(L,re,s)}`,U=(L,re,C)=>s<2?`${L}=${C};`:`${ae(L,re,s)}=${C};`,G={},V=(L,re)=>{m.broadcastedIndicesToOffset=!0;let C=`${re.name}broadcastedIndicesTo${e}Offset`;if(C in G)return`${C}(${L})`;let R=[];for(let ie=s-1;ie>=0;ie--){let Se=re.indicesGet("outputIndices",ie+re.rank-s);R.push(`${B($,ie)} * (${Se} % ${B(x,ie)})`)}return G[C]=`fn ${C}(outputIndices: ${re.type.indices}) -> u32 {
             return ${R.length>0?R.join("+"):"0u"};
           }`,`${C}(${L})`},Z=(L,re)=>(()=>{if(f.storage===f.value)return`${e}[${L}]=${re};`;if(f.storage==="vec2<u32>"&&f.value==="i32")return`${e}[${L}]=vec2<u32>(u32(${re}), select(0u, 0xFFFFFFFFu, ${re} < 0));`;if(f.storage==="vec2<u32>"&&f.value==="u32")return`${e}[${L}]=vec2<u32>(u32(${re}), 0u);`;if(f.storage==="u32"&&f.value==="vec4<bool>")return`${e}[${L}]=dot(vec4<u32>(0x1, 0x100, 0x10000, 0x1000000), vec4<u32>(${re}));`;throw new Error(`not supported combination of storage type ${f.storage} and value type ${f.value} yet`)})(),O=L=>(()=>{if(f.storage===f.value)return`${e}[${L}]`;if(f.storage==="vec2<u32>"&&f.value==="i32")return`i32(${e}[${L}].x)`;if(f.storage==="vec2<u32>"&&f.value==="u32")return`u32(${e}[${L}].x)`;if(f.storage==="u32"&&f.value==="vec4<bool>")return`vec4<bool>(bool(${e}[${L}] & 0xFFu), bool(${e}[${L}] & 0xFF00u), bool(${e}[${L}] & 0xFF0000u), bool(${e}[${L}] & 0xFF000000u))`;throw new Error(`not supported combination of storage type ${f.storage} and value type ${f.value} yet`)})(),P=s<2?"":`
  fn get_${e}ByIndices(indices: ${f.indices}) -> ${c} {
    return ${O(`i2o_${e}(indices)`)};
  }`,H=s<2?"":(()=>{let L=o.map(C=>`d${C}: u32`).join(", "),re=o.map(C=>`d${C}`).join(", ");return`
  fn get_${e}(${L}) -> ${c} {
    return get_${e}ByIndices(${k(re)});
  }`})(),Y=(...L)=>{if(L.length!==s)throw new Error(`indices length must be ${s}`);let re=L.map(g).join(",");return s===0?O("0u"):s===1?O(re[0]):(m.get=!0,m.getByIndices=!0,m.indicesToOffset=!0,`get_${e}(${re})`)},j=L=>s<2?O(L):(m.getByIndices=!0,m.indicesToOffset=!0,`get_${e}ByIndices(${L})`),K=s<2?"":`
  fn set_${e}ByIndices(indices: ${f.indices}, value: ${c}) {
    ${Z(`i2o_${e}(indices)`,"value")}
  }`,J=s<2?"":(()=>{let L=o.map(C=>`d${C}: u32`).join(", "),re=o.map(C=>`d${C}`).join(", ");return`
  fn set_${e}(${L}, value: ${c}) {
    set_${e}ByIndices(${k(re)}, value);
  }`})();return{impl:()=>{let L=[],re=!1;return m.offsetToIndices&&(L.push(S),re=!0),m.indicesToOffset&&(L.push(z),re=!0),m.broadcastedIndicesToOffset&&(Object.values(G).forEach(C=>L.push(C)),re=!0),m.set&&(L.push(J),re=!0),m.setByIndices&&(L.push(K),re=!0),m.get&&(L.push(H),re=!0),m.getByIndices&&(L.push(P),re=!0),!a&&re&&L.unshift(`const ${x} = ${f.indices}(${r.join(",")});`,`const ${$} = ${f.indices}(${D.computeStrides(r).join(",")});`),L.join(`
`)},type:f,offsetToIndices:v,indicesToOffset:M,broadcastedIndicesToOffset:V,indices:k,indicesGet:B,indicesSet:U,set:(...L)=>{if(L.length!==s+1)throw new Error(`indices length must be ${s}`);let re=L[s];if(typeof re!="string")throw new Error("value must be string");let C=L.slice(0,s).map(g).join(",");return s===0?Z("0u",re):s===1?Z(C[0],re):(m.set=!0,m.setByIndices=!0,m.indicesToOffset=!0,`set_${e}(${C}, ${re})`)},setByOffset:Z,setByIndices:(L,re)=>s<2?Z(L,re):(m.setByIndices=!0,m.indicesToOffset=!0,`set_${e}ByIndices(${L}, ${re});`),get:Y,getByOffset:O,getByIndices:j,usage:n,name:e,strides:$,shape:x,rank:s}},W=(e,t,r,n=1)=>xr(e,t,r,"input",n),ne=(e,t,r,n=1)=>xr(e,t,r,"output",n),rh=(e,t,r)=>xr(e,t,r,"atomicOutput",1),Ha=(e,t,r,n=1)=>xr(e,t,r,"internal",n),Nu=class{constructor(e,t){this.normalizedDispatchGroup=e,this.limits=t,this.internalVariables=[],this.variables=[],this.uniforms=[],this.variableIndex=0}guardAgainstOutOfBoundsWorkgroupSizes(e){return`if (global_idx >= ${typeof e=="number"?`${e}u`:e}) { return; }`}mainStart(e=hr){let t=typeof e=="number"?e:e[0],r=typeof e=="number"?1:e[1],n=typeof e=="number"?1:e[2];if(t>this.limits.maxComputeWorkgroupSizeX||r>this.limits.maxComputeWorkgroupSizeY||n>this.limits.maxComputeWorkgroupSizeZ)throw new Error(`workgroup size [${t}, ${r}, ${n}] exceeds the maximum workgroup size [${this.limits.maxComputeWorkgroupSizeX}, ${this.limits.maxComputeWorkgroupSizeY}, ${this.limits.maxComputeWorkgroupSizeZ}].`);if(t*r*n>this.limits.maxComputeInvocationsPerWorkgroup)throw new Error(`workgroup size [${t}, ${r}, ${n}] exceeds the maximum workgroup invocations ${this.limits.maxComputeInvocationsPerWorkgroup}.`);let i=this.normalizedDispatchGroup[1]===1&&this.normalizedDispatchGroup[2]===1,a=i?`@builtin(global_invocation_id) global_id : vec3<u32>,
    @builtin(workgroup_id) workgroup_id : vec3<u32>,
    @builtin(local_invocation_index) local_idx : u32,
    @builtin(local_invocation_id) local_id : vec3<u32>`:`@builtin(global_invocation_id) global_id : vec3<u32>,
                                             @builtin(local_invocation_id) local_id : vec3<u32>,
    @builtin(local_invocation_index) local_idx : u32,
    @builtin(workgroup_id) workgroup_id : vec3<u32>,
    @builtin(num_workgroups) num_workgroups : vec3<u32>`,s=i?`let global_idx = global_id.x;
         let workgroup_index = workgroup_id.x;`:`let workgroup_index = workgroup_id.z * num_workgroups[0] * num_workgroups[1] +
             workgroup_id.y * num_workgroups[0] + workgroup_id.x;
         let global_idx = workgroup_index * ${t*r*n}u + local_idx;`;return`@compute @workgroup_size(${t}, ${r}, ${n})
  fn main(${a}) {
    ${s}
  `}appendVariableUniforms(e){e.rank!==0&&(e.shape.startsWith("uniforms.")&&this.uniforms.push({name:e.shape.replace("uniforms.",""),type:"u32",length:e.rank}),e.strides.startsWith("uniforms.")&&this.uniforms.push({name:e.strides.replace("uniforms.",""),type:"u32",length:e.rank}))}declareVariable(e,t){if(e.usage==="internal")throw new Error("cannot use internal variable with declareVariable(). use registerInternalVariables() instead.");this.variables.push(e),this.appendVariableUniforms(e);let r=e.usage==="input"?"read":"read_write",n=e.usage==="atomicOutput"?"atomic<i32>":e.type.storage;return`@group(0) @binding(${t}) var<storage, ${r}> ${e.name}: array<${n}>;`}declareVariables(...e){return e.map(t=>this.declareVariable(t,this.variableIndex++)).join(`
`)}registerInternalVariable(e){if(e.usage!=="internal")throw new Error("cannot use input or output variable with registerInternalVariable(). use declareVariables() instead.");this.internalVariables.push(e),this.appendVariableUniforms(e)}registerInternalVariables(...e){return e.forEach(t=>this.registerInternalVariable(t)),this}registerUniform(e,t,r=1){return this.uniforms.push({name:e,type:t,length:r}),this}registerUniforms(e){return this.uniforms=this.uniforms.concat(e),this}uniformDeclaration(){if(this.uniforms.length===0)return"";let e=[];for(let{name:t,type:r,length:n}of this.uniforms)if(n&&n>4)r==="f16"?e.push(`@align(16) ${t}:array<mat2x4<${r}>, ${Math.ceil(n/8)}>`):e.push(`${t}:array<vec4<${r}>, ${Math.ceil(n/4)}>`);else{let i=n==null||n===1?r:`vec${n}<${r}>`;e.push(`${t}:${i}`)}return`
      struct Uniforms { ${e.join(", ")} };
      @group(0) @binding(${this.variableIndex}) var<uniform> uniforms: Uniforms;`}get additionalImplementations(){return this.uniformDeclaration()+this.variables.map(e=>e.impl()).join(`
`)+this.internalVariables.map(e=>e.impl()).join(`
`)}get variablesInfo(){if(this.uniforms.length===0)return;let e=t=>[12,10,1,6][["u32","f16","f32","i32"].indexOf(t)];return this.uniforms.map(t=>[e(t.type),t.length??1])}},nh=(e,t)=>new Nu(e,t)}),Ou,Ti,Ru,Bu,Du,Pu,Xe,ih,ah,Bt=X(()=>{ue(),le(),Oe(),de(),Ou=(e,t)=>{if(!e||e.length!==1)throw new Error("Transpose requires 1 input.");if(t.length!==0&&t.length!==e[0].dims.length)throw new Error(`perm size ${t.length} does not match input rank ${e[0].dims.length}`)},Ti=(e,t)=>t.length!==0?t:[...new Array(e).keys()].reverse(),Ru=(e,t)=>D.sortBasedOnPerm(e,Ti(e.length,t)),Bu=(e,t,r,n)=>{let i=`fn perm(i: ${n.type.indices}) -> ${r.type.indices} {
    var a: ${r.type.indices};`;for(let a=0;a<t;++a)i+=`a[${e[a]}]=i[${a}];`;return i+="return a;}"},Du=(e,t)=>{let r=[],n=[];for(let i=0;i<e.length;++i)e[i]!==1&&r.push(e[i]),e[t[i]]!==1&&n.push(t[i]);return{newShape:r,newPerm:n}},Pu=(e,t)=>{let r=0;for(let n=0;n<e.length;++n)if(t[e[n]]!==1){if(e[n]<r)return!1;r=e[n]}return!0},Xe=(e,t)=>{let r=e.dataType,n=e.dims.length,i=Ti(n,t),a=Ru(e.dims,i),s=e.dims,o=a,l=n<2||Pu(i,e.dims),d;if(l)return d=m=>{let b=W("input",r,s,4),x=ne("output",r,o,4);return`
  ${m.registerUniform("output_size","u32").declareVariables(b,x)}
  ${m.mainStart()}
    ${m.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
    output[global_idx] = input[global_idx];
  }`},{name:"TransposeCopy",shaderCache:{inputDependencies:["type"]},getRunData:()=>{let m=D.size(a);return{outputs:[{dims:a,dataType:e.dataType}],dispatchGroup:{x:Math.ceil(m/64/4)},programUniforms:[{type:12,data:Math.ceil(m/4)}]}},getShaderSource:d};let{newShape:c,newPerm:h}=Du(e.dims,i),f=D.areEqual(h,[2,3,1]),g=D.areEqual(h,[3,1,2]);if(c.length===2||f||g){s=f?[c[0],c[1]*c[2]]:g?[c[0]*c[1],c[2]]:c,o=[s[1],s[0]];let m=16;return d=b=>{let x=W("a",r,s.length),$=ne("output",r,o.length);return`
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
  }`},{name:"TransposeShared",shaderCache:{inputDependencies:["type"]},getRunData:()=>{let b=D.size(a);return{outputs:[{dims:a,dataType:e.dataType}],dispatchGroup:{x:Math.ceil(o[1]/m),y:Math.ceil(o[0]/m)},programUniforms:[{type:12,data:b},...oe(s,o)]}},getShaderSource:d}}return d=m=>{let b=W("a",r,s.length),x=ne("output",r,o.length);return`
  ${m.registerUniform("output_size","u32").declareVariables(b,x)}

  ${Bu(i,n,b,x)}

  ${m.mainStart()}
    ${m.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}

    let indices = ${x.offsetToIndices("global_idx")};
    let aIndices = perm(indices);

    ${x.setByOffset("global_idx",b.getByIndices("aIndices"))}
  }`},{name:"Transpose",shaderCache:{hint:`${t}`,inputDependencies:["rank"]},getRunData:()=>{let m=D.size(a);return{outputs:[{dims:a,dataType:e.dataType}],dispatchGroup:{x:Math.ceil(m/64)},programUniforms:[{type:12,data:m},...oe(s,o)]}},getShaderSource:d}},ih=(e,t)=>{Ou(e.inputs,t.perm),e.compute(Xe(e.inputs[0],t.perm))},ah=e=>we({perm:e.perm})}),Lu,Uu,ju,qu,Wu,Fu,Gu,Vu,Hu,Ku,rt,sh,oh,uh,lh,dh,ch,ph,hh,fh,mh,yb=X(()=>{ue(),le(),de(),Ka(),Bt(),Lu={max:"select(bestValue, candidate, candidate > bestValue)",min:"select(bestValue, candidate, candidate < bestValue)",mean:"bestValue + candidate",sum:"bestValue + candidate",prod:"bestValue * candidate",sumSquare:"bestValue + candidate * candidate",logSumExp:"bestValue + exp(candidate)",l1:"bestValue + abs(candidate)",l2:"bestValue + candidate * candidate",logSum:"bestValue + candidate"},Uu={max:"select(bestValue, candidate, candidate > bestValue)",min:"select(bestValue, candidate, candidate < bestValue)",mean:"bestValue + candidate",sum:"bestValue + candidate",prod:"bestValue * candidate",sumSquare:"bestValue + candidate",logSumExp:"bestValue + candidate",l1:"bestValue + candidate",l2:"bestValue + candidate",logSum:"bestValue + candidate"},ju={max:"_A[offset]",min:"_A[offset]",mean:"0",sum:"0",prod:"1",sumSquare:"0",logSumExp:"0",l1:"0",l2:"0",logSum:"0"},qu={max:"bestValue",min:"bestValue",sum:"bestValue",prod:"bestValue",sumSquare:"bestValue",logSumExp:"log(bestValue)",l1:"bestValue",l2:"sqrt(bestValue)",logSum:"log(bestValue)"},Wu=(e,t)=>{let r=[];for(let n=t-e;n<t;++n)r.push(n);return r},Fu=(e,t)=>{let r=[],n=e.length;for(let a=0;a<n;a++)t.indexOf(a)===-1&&r.push(e[a]);let i=t.map(a=>e[a]);return[r,i]},Gu=(e,t)=>{let r=e.length+t.length,n=[],i=0;for(let a=0;a<r;a++)t.indexOf(a)===-1?n.push(e[i++]):n.push(1);return n},Vu=(e,t)=>{for(let r=0;r<e.length;++r)if(e[e.length-r-1]!==t-1-r)return!1;return!0},Hu=(e,t)=>{let r=[];if(!Vu(e,t)){for(let n=0;n<t;++n)e.indexOf(n)===-1&&r.push(n);e.forEach(n=>r.push(n))}return r},Ku=(e,t,r,n,i,a,s)=>{let o=r[0].dims,l=D.size(a),d=D.size(s),c=W("_A",r[0].dataType,o),h=ne("output",i,a),f=64;l===1&&(f=256);let g=`
          var<workgroup> aBestValues : array<f32, ${f}>;
       `,m=b=>`
        ${b.registerUniform("reduceSize","u32").declareVariables(c,h)}
        ${g}
        fn DIV_CEIL(a : u32, b : u32) -> u32 {
          return ((a - 1u) / b + 1u);
         }
         ${b.mainStart(f)}

          let outputIndex = global_idx / ${f};
          let offset = outputIndex * uniforms.reduceSize;

          var bestValue = f32(${ju[n]});
          let Length = uniforms.reduceSize;
          for (var k = local_idx; k < Length; k = k + ${f}) {
           let candidate = f32(${c.getByOffset("offset + k")});
           bestValue = ${Lu[n]};
          }
          aBestValues[local_idx] = bestValue;
          workgroupBarrier();

         var reduceSize = min(Length, ${f}u);
         for (var currentSize = reduceSize / 2u; reduceSize > 1u;
             currentSize = reduceSize / 2u) {
           let interval = DIV_CEIL(reduceSize, 2u);
           if (local_idx < currentSize) {
            let candidate = aBestValues[local_idx + interval];
            bestValue = ${Uu[n]};
            aBestValues[local_idx] = bestValue;
           }
           reduceSize = interval;
           workgroupBarrier();
         }

         if (local_idx == 0u) {
          ${h.setByOffset("outputIndex",`${n==="mean"?`${h.type.storage}(bestValue / f32(uniforms.reduceSize))`:`${h.type.storage}(${qu[n]})`}`)};
         }
        }`;return{name:e,shaderCache:{hint:`${t};${f}`,inputDependencies:["type"]},getShaderSource:m,getRunData:()=>({outputs:[{dims:a,dataType:i}],dispatchGroup:{x:l},programUniforms:[{type:12,data:d}]})}},rt=(e,t,r,n)=>{let i=e.inputs.length===1?r:wa(e.inputs,r),a=i.axes;a.length===0&&!i.noopWithEmptyAxes&&(a=e.inputs[0].dims.map((g,m)=>m));let s=D.normalizeAxes(a,e.inputs[0].dims.length),o=s,l=e.inputs[0],d=Hu(o,e.inputs[0].dims.length);d.length>0&&(l=e.compute(Xe(e.inputs[0],d),{inputs:[0],outputs:[-1]})[0],o=Wu(o.length,l.dims.length));let[c,h]=Fu(l.dims,o),f=c;i.keepDims&&(f=Gu(c,s)),e.compute(Ku(t,i.cacheKey,[l],n,e.inputs[0].dataType,f,h),{inputs:[l]})},sh=(e,t)=>{rt(e,"ReduceMeanShared",t,"mean")},oh=(e,t)=>{rt(e,"ReduceL1Shared",t,"l1")},uh=(e,t)=>{rt(e,"ReduceL2Shared",t,"l2")},lh=(e,t)=>{rt(e,"ReduceLogSumExpShared",t,"logSumExp")},dh=(e,t)=>{rt(e,"ReduceMaxShared",t,"max")},ch=(e,t)=>{rt(e,"ReduceMinShared",t,"min")},ph=(e,t)=>{rt(e,"ReduceProdShared",t,"prod")},hh=(e,t)=>{rt(e,"ReduceSumShared",t,"sum")},fh=(e,t)=>{rt(e,"ReduceSumSquareShared",t,"sumSquare")},mh=(e,t)=>{rt(e,"ReduceLogSumShared",t,"logSum")}}),nt,Xu,Cn,wa,it,Zu,Yu,Qu,Ju,el,tl,rl,nl,il,al,at,gh,yh,bh,_h,wh,$h,vh,xh,Sh,kh,Ka=X(()=>{ue(),le(),Oe(),de(),yb(),nt=e=>{if(!e||e.length===0||e.length>2)throw new Error("Reduce op requires 1 or 2 inputs.");if(e.length===2&&e[1].dims.length!==1)throw new Error("Invalid axes input dims.")},Xu=e=>["","",`var value = ${e.getByIndices("input_indices")};`,""],Cn=(e,t,r,n,i,a,s=!1,o=!1)=>{let l=[],d=r[0].dims,c=d.length,h=D.normalizeAxes(i,c),f=!o&&h.length===0;d.forEach((b,x)=>{f||h.indexOf(x)>=0?s&&l.push(1):l.push(b)});let g=l.length,m=D.size(l);return{name:e,shaderCache:t,getShaderSource:b=>{let x=[],$=W("_A",r[0].dataType,c),w=ne("output",a,g),S=n($,w,h),v=S[2];for(let E=0,z=0;E<c;E++)f||h.indexOf(E)>=0?(s&&z++,v=`for(var j${E}: u32 = 0; j${E} < ${d[E]}; j${E}++) {
                  ${S[2].includes("last_index")?`let last_index = j${E};`:""}
                  ${$.indicesSet("input_indices",E,`j${E}`)}
                  ${v}
                }`):(x.push(`${$.indicesSet("input_indices",E,w.indicesGet("output_indices",z))};`),z++);return`

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
        }`},getRunData:()=>({outputs:[{dims:l,dataType:a}],dispatchGroup:{x:Math.ceil(m/64)},programUniforms:[{type:12,data:m},...oe(d,l)]})}},wa=(e,t)=>{let r=[];return e[1].dims[0]>0&&e[1].getBigInt64Array().forEach(n=>r.push(Number(n))),we({axes:r,keepDims:t.keepDims,noopWithEmptyAxes:t.noopWithEmptyAxes})},it=(e,t,r,n)=>{let i=e.inputs,a=i.length===1?r:wa(i,r);e.compute(Cn(t,{hint:a.cacheKey,inputDependencies:["rank"]},[i[0]],a.noopWithEmptyAxes&&a.axes.length===0?Xu:n,a.axes,i[0].dataType,a.keepDims,a.noopWithEmptyAxes),{inputs:[0]})},Zu=(e,t)=>{nt(e.inputs),it(e,"ReduceLogSum",t,(r,n)=>[`var value = ${n.type.storage}(0);`,"",`value += ${r.getByIndices("input_indices")};`,"value = log(value);"])},Yu=(e,t)=>{nt(e.inputs),it(e,"ReduceL1",t,(r,n)=>[`var value = ${n.type.storage}(0);`,"",`value += abs(${r.getByIndices("input_indices")});`,""])},Qu=(e,t)=>{nt(e.inputs),it(e,"ReduceL2",t,(r,n)=>[`var t = ${n.type.value}(0); var value = ${n.type.value}(0);`,"",`t = ${r.getByIndices("input_indices")}; value += (t * t);`,"value = sqrt(value);"])},Ju=(e,t)=>{nt(e.inputs),it(e,"ReduceLogSumExp",t,(r,n)=>[`var value = ${n.type.storage}(0);`,"",`value += exp(${r.getByIndices("input_indices")});`,"value = log(value);"])},el=(e,t)=>{nt(e.inputs),it(e,"ReduceMax",t,(r,n,i)=>{let a=[];for(let s=0;s<r.rank;s++)(i.indexOf(s)>=0||i.length===0)&&a.push(r.indicesSet("input_indices",s,0));return[`${a.join(`
`)}`,`var value = ${r.getByIndices("input_indices")};`,`value = max(value, ${r.getByIndices("input_indices")});`,""]})},tl=(e,t)=>{nt(e.inputs),it(e,"ReduceMean",t,(r,n,i)=>{let a=1;for(let s=0;s<r.rank;s++)(i.indexOf(s)>=0||i.length===0)&&(a*=e.inputs[0].dims[s]);return["var sum = f32(0);","",`sum += f32(${r.getByIndices("input_indices")});`,`let value = ${n.type.value}(sum / ${a});`]})},rl=(e,t)=>{nt(e.inputs),it(e,"ReduceMin",t,(r,n,i)=>{let a=[];for(let s=0;s<r.rank;s++)(i.indexOf(s)>=0||i.length===0)&&a.push(`input_indices[${s}] = 0;`);return[`${a.join(`
`)}`,`var value = ${r.getByIndices("input_indices")};`,`value = min(value, ${r.getByIndices("input_indices")});`,""]})},nl=(e,t)=>{nt(e.inputs),it(e,"ReduceProd",t,(r,n)=>[`var value = ${n.type.storage}(1);`,"",`value *= ${r.getByIndices("input_indices")};`,""])},il=(e,t)=>{nt(e.inputs),it(e,"ReduceSum",t,(r,n)=>[`var value = ${n.type.storage}(0);`,"",`value += ${r.getByIndices("input_indices")};`,""])},al=(e,t)=>{nt(e.inputs),it(e,"ReduceSumSquare",t,(r,n)=>[`var t = ${n.type.value}(0); var value = ${n.type.value}(0);`,"",`t = ${r.getByIndices("input_indices")}; value += t * t;`,""])},at=(e,t,r)=>{if(t.length===0)return r;let n=1,i=1;for(let a=0;a<t.length;a++)t.indexOf(a)===-1?n*=e[a]:i*=e[a];return i<32&&n>1024},gh=(e,t)=>{at(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?tl(e,t):sh(e,t)},yh=(e,t)=>{at(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?Yu(e,t):oh(e,t)},bh=(e,t)=>{at(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?Qu(e,t):uh(e,t)},_h=(e,t)=>{at(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?Ju(e,t):lh(e,t)},wh=(e,t)=>{at(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?el(e,t):dh(e,t)},$h=(e,t)=>{at(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?rl(e,t):ch(e,t)},vh=(e,t)=>{at(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?nl(e,t):ph(e,t)},xh=(e,t)=>{at(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?il(e,t):hh(e,t)},Sh=(e,t)=>{at(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?al(e,t):fh(e,t)},kh=(e,t)=>{at(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?Zu(e,t):mh(e,t)}}),Ei,Th,Eh,$a,bb=X(()=>{ue(),Oe(),Ka(),Ei=e=>{if(!e||e.length===0||e.length>2)throw new Error("ArgMinMaxOp op requires 1 or 2 inputs.");if(e[0].dataType!==1)throw new Error("Invalid input type.")},Th=(e,t)=>{Ei(e.inputs);let r=(n,i,a)=>{let s=[];for(let o=0;o<n.rank;o++)(a.indexOf(o)>=0||a.length===0)&&s.push(`input_indices[${o}] = 0;`);return[`${s.join(`
`)}`,`var value = ${n.getByIndices("input_indices")};
var best_index : i32 = 0;`,`if (${n.getByIndices("input_indices")} ${t.selectLastIndex>0?"<=":"<"} value) {
         value = ${n.getByIndices("input_indices")};
         best_index = i32(last_index);
       }`,"",i.setByOffset("global_idx","best_index")]};e.compute(Cn("ArgMin",{hint:t.cacheKey,inputDependencies:["rank"]},[e.inputs[0]],r,[t.axis],7,t.keepDims),{inputs:[0]})},Eh=(e,t)=>{Ei(e.inputs);let r=(n,i,a)=>{let s=[];for(let o=0;o<n.rank;o++)(a.indexOf(o)>=0||a.length===0)&&s.push(`input_indices[${o}] = 0;`);return[`${s.join(`
`)}`,`var value = ${n.getByIndices("input_indices")};
var best_index : i32 = 0;`,`if (${n.getByIndices("input_indices")} ${t.selectLastIndex>0?">=":">"} value) {
         value = ${n.getByIndices("input_indices")};
         best_index = i32(last_index);
       }`,"",i.setByOffset("global_idx","best_index")]};e.compute(Cn("argMax",{hint:t.cacheKey,inputDependencies:["rank"]},[e.inputs[0]],r,[t.axis],7,t.keepDims),{inputs:[0]})},$a=e=>we(e)}),sl,un,ol,ul,ll,Ur,dl,Ih,Xa=X(()=>{ue(),le(),Va(),de(),sl=(e,t)=>{let r=e[0],n=e[1],i=e[2],a=e[3],s=e[4],o=e[5];if(s&&o)throw new Error("Attention cannot have both past and attention_bias");if(r.dims.length!==3)throw new Error('Input "input" must have 3 dimensions');let l=r.dims[0],d=r.dims[1],c=r.dims[2];if(i.dims.length!==1)throw new Error('Input "bias" is expected to have 1 dimensions');if(n.dims.length!==2)throw new Error('Input "weights" is expected to have 2 dimensions');if(n.dims[0]!==c)throw new Error("Input 1 dimension 0 should have same length as dimension 2 of input 0");if(i.dims[0]!==n.dims[1])throw new Error('Input "bias" dimension 0 should have same length as dimension 1 of input "weights"');let h=i.dims[0]/3,f=h,g=f;if(t.qkvHiddenSizes.length>0){if(t.qkvHiddenSizes.length!==3)throw new Error("qkv_hidden_sizes attribute should have 3 elements");for(let S of t.qkvHiddenSizes)if(S%t.numHeads!==0)throw new Error("qkv_hidden_sizes should be divisible by num_heads");h=t.qkvHiddenSizes[0],f=t.qkvHiddenSizes[1],g=t.qkvHiddenSizes[2]}let m=d;if(h!==f)throw new Error("qkv_hidden_sizes first element should be same as the second");if(i.dims[0]!==h+f+g)throw new Error('Input "bias" dimension 0 should have same length as sum of Q/K/V hidden sizes');let b=0;if(s){if(f!==g)throw new Error('Input "past" expect k_hidden_size == v_hidden_size');if(s.dims.length!==5)throw new Error('Input "past" must have 5 dimensions');if(s.dims[0]!==2)throw new Error('Input "past" first dimension must be 2');if(s.dims[1]!==l)throw new Error('Input "past" second dimension must be batch_size');if(s.dims[2]!==t.numHeads)throw new Error('Input "past" third dimension must be num_heads');if(s.dims[4]!==f/t.numHeads)throw new Error('Input "past" fifth dimension must be k_hidden_size / num_heads');t.pastPresentShareBuffer||(b=s.dims[3])}let x=m+b,$=-1,w=0;if(a)throw new Error("Mask not supported");if(s)throw new Error("past is not supported");if(o){if(o.dims.length!==4)throw new Error('Input "attention_bias" must have 4 dimensions');if(o.dims[0]!==l||o.dims[1]!==t.numHeads||o.dims[2]!==d||o.dims[3]!==x)throw new Error('Expect "attention_bias" shape (batch_size, num_heads, sequence_length, total_sequence_length)')}return{batchSize:l,sequenceLength:d,pastSequenceLength:b,kvSequenceLength:m,totalSequenceLength:x,maxSequenceLength:$,inputHiddenSize:c,hiddenSize:h,vHiddenSize:g,headSize:Math.floor(h/t.numHeads),vHeadSize:Math.floor(g/t.numHeads),numHeads:t.numHeads,isUnidirectional:!1,pastPresentShareBuffer:!1,maskFilterValue:t.maskFilterValue,maskType:w,scale:t.scale,broadcastResPosBias:!1,passPastInKv:!1,qkvFormat:1}},un=(e,t,r)=>t&&e?`
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
    `,ol=(e,t,r,n,i,a,s,o)=>{let l=Ne(s?1:a),d=64,c=a/l;c<d&&(d=32);let h=Math.ceil(a/l/d),f=[{type:12,data:t},{type:12,data:r},{type:12,data:n},{type:12,data:i},{type:12,data:c},{type:12,data:h}],g=De(e.dataType,l),m=qe(1,l),b=["type"];s&&b.push("type"),o&&b.push("type");let x=$=>{let w=ne("x",e.dataType,e.dims,l),S=[w],v=s?W("seq_lens",s.dataType,s.dims):void 0;v&&S.push(v);let E=o?W("total_sequence_length_input",o.dataType,o.dims):void 0;E&&S.push(E);let z=qe(e.dataType),M=[{name:"batch_size",type:"u32"},{name:"num_heads",type:"u32"},{name:"past_sequence_length",type:"u32"},{name:"sequence_length",type:"u32"},{name:"total_sequence_length",type:"u32"},{name:"elements_per_thread",type:"u32"}];return`
  var<workgroup> thread_max: array<f32, ${d}>;
  var<workgroup> thread_sum: array<f32, ${d}>;
  ${$.registerUniforms(M).declareVariables(...S)}
  ${$.mainStart([d,1,1])}
    let batchIdx = workgroup_id.z / uniforms.num_heads;
    let headIdx = workgroup_id.z % uniforms.num_heads;
    let sequence_length = uniforms.sequence_length;
    var total_sequence_length = uniforms.total_sequence_length;
    ${un(v,E,!1)}
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
        x[offset + i] = ${w.type.value}(${z}(1.0) / ${z}(seq_causal_length));
      }
    } else {
      for (var i: u32 = 0; i < uniforms.elements_per_thread && i + local_offset < seq_causal_length; i++) {
        var f32input = ${m}(x[offset + i]);
        x[offset + i] = ${w.type.value}(exp(f32input - max_value) / sum);
      }
    }
      ${s?`
        for (var total_seq_id: u32 = seq_causal_length; total_seq_id + local_offset < uniforms.total_sequence_length; total_seq_id++) {
          x[offset + total_seq_id] = ${w.type.value}(${z}(0));
        }`:""};
  }`};return{name:"AttentionProbsSoftmax",shaderCache:{hint:`${d};${g};${l}`,inputDependencies:b},getShaderSource:x,getRunData:()=>({outputs:[],dispatchGroup:{x:1,y:i,z:t*r},programUniforms:f})}},ul=(e,t,r,n,i,a,s,o,l)=>{let d=s+a.kvSequenceLength,c=[a.batchSize,a.numHeads,a.sequenceLength,d],h=e>1&&n,f=a.kvNumHeads?a.kvNumHeads:a.numHeads,g=h?[a.batchSize,f,d,a.headSize]:void 0,m=a.nReps?a.nReps:1,b=a.scale===0?1/Math.sqrt(a.headSize):a.scale,x=Ne(a.headSize),$=a.headSize/x,w=12,S={x:Math.ceil(d/w),y:Math.ceil(a.sequenceLength/w),z:a.batchSize*a.numHeads},v=[{type:12,data:a.sequenceLength},{type:12,data:$},{type:12,data:d},{type:12,data:a.numHeads},{type:12,data:a.headSize},{type:1,data:b},{type:12,data:s},{type:12,data:a.kvSequenceLength},{type:12,data:m}],E=h&&n&&D.size(n.dims)>0,z=["type","type"];E&&z.push("type"),i&&z.push("type"),o&&z.push("type"),l&&z.push("type");let M=[{dims:c,dataType:t.dataType,gpuDataType:0}];h&&M.push({dims:g,dataType:t.dataType,gpuDataType:0});let k=B=>{let U=W("q",t.dataType,t.dims,x),G=W("key",r.dataType,r.dims,x),V=[U,G];if(E){let K=W("past_key",n.dataType,n.dims,x);V.push(K)}i&&V.push(W("attention_bias",i.dataType,i.dims));let Z=o?W("seq_lens",o.dataType,o.dims):void 0;Z&&V.push(Z);let O=l?W("total_sequence_length_input",l.dataType,l.dims):void 0;O&&V.push(O);let P=ne("output",t.dataType,c),H=[P];h&&H.push(ne("present_key",t.dataType,g,x));let Y=qe(1,x),j=[{name:"M",type:"u32"},{name:"K",type:"u32"},{name:"N",type:"u32"},{name:"num_heads",type:"u32"},{name:"head_size",type:"u32"},{name:"alpha",type:"f32"},{name:"past_sequence_length",type:"u32"},{name:"kv_sequence_length",type:"u32"},{name:"n_reps",type:"u32"}];return`
  const TILE_SIZE = ${w}u;

  var<workgroup> tileQ: array<${U.type.storage}, ${w*w}>;
  var<workgroup> tileK: array<${U.type.storage}, ${w*w}>;
  ${B.registerUniforms(j).declareVariables(...V,...H)}
  ${B.mainStart([w,w,1])}
    // x holds the N and y holds the M
    let headIdx = workgroup_id.z % uniforms.num_heads;
    let kvHeadIdx = ${m===1?"headIdx":"headIdx / uniforms.n_reps"};
    let kv_num_heads = ${m===1?"uniforms.num_heads":"uniforms.num_heads / uniforms.n_reps"};
    let batchIdx = workgroup_id.z / uniforms.num_heads;
    let m = workgroup_id.y * TILE_SIZE;
    let n = workgroup_id.x * TILE_SIZE;
    let sequence_length = uniforms.M;
    var total_sequence_length = uniforms.N;
    ${un(Z,O,!0)}
    let absKvHeadIdx = batchIdx * kv_num_heads + kvHeadIdx;
    let qOffset = workgroup_id.z * uniforms.M * uniforms.K + m * uniforms.K;
    ${E&&h?"let pastKeyOffset = absKvHeadIdx * uniforms.past_sequence_length * uniforms.K;":""};
    let kOffset = absKvHeadIdx * uniforms.kv_sequence_length * uniforms.K;
    ${h?"let presentKeyOffset = absKvHeadIdx * uniforms.N * uniforms.K;":""}
    var value = ${Y}(0);
    for (var w: u32 = 0u; w < uniforms.K; w += TILE_SIZE) {
      if (global_id.y < uniforms.M && w + local_id.x < uniforms.K) {
        tileQ[TILE_SIZE * local_id.y + local_id.x] = q[qOffset + local_id.y * uniforms.K + w + local_id.x];
      }
      if (n + local_id.y < uniforms.N && w + local_id.x < uniforms.K) {
        var idx = TILE_SIZE * local_id.y + local_id.x;
      ${E&&h?`
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
        output[outputIdx] = ${P.type.value} (sum * uniforms.alpha) + ${i?"attention_bias[outputIdx]":"0.0"};
    }
  }`};return{name:"AttentionProbs",shaderCache:{hint:`${x};${i!==void 0};${n!==void 0};${e}`,inputDependencies:z},getRunData:()=>({outputs:M,dispatchGroup:S,programUniforms:v}),getShaderSource:k}},ll=(e,t,r,n,i,a,s=void 0,o=void 0)=>{let l=a+i.kvSequenceLength,d=i.nReps?i.nReps:1,c=i.vHiddenSize*d,h=e>1&&n,f=i.kvNumHeads?i.kvNumHeads:i.numHeads,g=h?[i.batchSize,f,l,i.headSize]:void 0,m=[i.batchSize,i.sequenceLength,c],b=12,x={x:Math.ceil(i.vHeadSize/b),y:Math.ceil(i.sequenceLength/b),z:i.batchSize*i.numHeads},$=[{type:12,data:i.sequenceLength},{type:12,data:l},{type:12,data:i.vHeadSize},{type:12,data:i.numHeads},{type:12,data:i.headSize},{type:12,data:c},{type:12,data:a},{type:12,data:i.kvSequenceLength},{type:12,data:d}],w=h&&n&&D.size(n.dims)>0,S=["type","type"];w&&S.push("type"),s&&S.push("type"),o&&S.push("type");let v=[{dims:m,dataType:t.dataType,gpuDataType:0}];h&&v.push({dims:g,dataType:t.dataType,gpuDataType:0});let E=z=>{let M=W("probs",t.dataType,t.dims),k=W("v",r.dataType,r.dims),B=[M,k];w&&B.push(W("past_value",n.dataType,n.dims));let U=s?W("seq_lens",s.dataType,s.dims):void 0;s&&B.push(U);let G=o?W("total_sequence_length_input",o.dataType,o.dims):void 0;o&&B.push(G);let V=[ne("output",t.dataType,m)];h&&V.push(ne("present_value",t.dataType,g));let Z=[{name:"M",type:"u32"},{name:"K",type:"u32"},{name:"N",type:"u32"},{name:"num_heads",type:"u32"},{name:"head_size",type:"u32"},{name:"v_hidden_size",type:"u32"},{name:"past_sequence_length",type:"u32"},{name:"kv_sequence_length",type:"u32"},{name:"n_reps",type:"u32"}];return`
  const TILE_SIZE = ${b}u;
  var<workgroup> tileQ: array<${M.type.value}, ${b*b}>;
  var<workgroup> tileV: array<${M.type.value}, ${b*b}>;
  ${z.registerUniforms(Z).declareVariables(...B,...V)}
  ${z.mainStart([b,b,1])}
   let headIdx = workgroup_id.z % uniforms.num_heads;
   let batchIdx = workgroup_id.z / uniforms.num_heads;
   let kvHeadIdx = ${d===1?"headIdx":"headIdx / uniforms.n_reps"};
   let kv_num_heads = ${d===1?"uniforms.num_heads":"uniforms.num_heads / uniforms.n_reps"};
   let m = global_id.y;
   let n = global_id.x;
   let sequence_length = uniforms.M;
   var total_sequence_length = uniforms.K;
   ${un(U,G,!0)}
   let offsetA = workgroup_id.z * uniforms.M * uniforms.K + m * uniforms.K;
   let absKvHeadIdx = batchIdx * kv_num_heads + kvHeadIdx; // kvHeadIdx is relative to the batch
   ${w&&h?"let pastValueOffset = absKvHeadIdx * uniforms.N * uniforms.past_sequence_length + n;":""};
   let vOffset = absKvHeadIdx * uniforms.N * uniforms.kv_sequence_length + n;
   ${h?"let presentValueOffset = absKvHeadIdx * uniforms.N * uniforms.K + n;":""}
   var value = ${M.type.storage}(0);
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
  }`};return{name:"AttentionScore",shaderCache:{hint:`${n!==void 0};${e}`,inputDependencies:S},getRunData:()=>({outputs:v,dispatchGroup:x,programUniforms:$}),getShaderSource:E}},Ur=(e,t,r,n,i,a,s,o,l,d,c=void 0,h=void 0)=>{let f=Math.min(e.outputCount,1+(s?1:0)+(o?1:0)),g=f>1?s:void 0,m=f>1?o:void 0,b=f>1?d.pastSequenceLength:0,x=b+d.kvSequenceLength,$=l&&D.size(l.dims)>0?l:void 0,w=[t,r];g&&D.size(g.dims)>0&&w.push(g),$&&w.push($),c&&w.push(c),h&&w.push(h);let S=e.compute(ul(f,t,r,g,$,d,b,c,h),{inputs:w,outputs:f>1?[-1,1]:[-1]})[0];e.compute(ol(S,d.batchSize,d.numHeads,b,d.sequenceLength,x,c,h),{inputs:c&&h?[S,c,h]:[S],outputs:[]});let v=[S,n];m&&D.size(m.dims)>0&&v.push(m),c&&v.push(c),h&&v.push(h),e.compute(ll(f,S,n,m,d,b,c,h),{inputs:v,outputs:f>1?[0,2]:[0]})},dl=(e,t)=>{let r=[t.batchSize,t.numHeads,t.sequenceLength,t.headSize],n=t.sequenceLength,i=t.inputHiddenSize,a=t.headSize,s=12,o={x:Math.ceil(t.headSize/s),y:Math.ceil(t.sequenceLength/s),z:t.batchSize*t.numHeads},l=[e.inputs[0],e.inputs[1],e.inputs[2]],d=[{type:12,data:n},{type:12,data:i},{type:12,data:a},{type:12,data:t.numHeads},{type:12,data:t.headSize},{type:12,data:t.hiddenSize},{type:12,data:t.hiddenSize+t.hiddenSize+t.vHiddenSize}],c=h=>{let f=ne("output_q",l[0].dataType,r),g=ne("output_k",l[0].dataType,r),m=ne("output_v",l[0].dataType,r),b=W("input",l[0].dataType,l[0].dims),x=W("weight",l[1].dataType,l[1].dims),$=W("bias",l[2].dataType,l[2].dims),w=b.type.storage,S=[{name:"M",type:"u32"},{name:"K",type:"u32"},{name:"N",type:"u32"},{name:"num_heads",type:"u32"},{name:"head_size",type:"u32"},{name:"hidden_size",type:"u32"},{name:"ldb",type:"u32"}];return`
  const TILE_SIZE = ${s}u;
  var<workgroup> tileInput: array<${w}, ${s*s}>;
  var<workgroup> tileWeightQ: array<${w}, ${s*s}>;
  var<workgroup> tileWeightK: array<${w}, ${s*s}>;
  var<workgroup> tileWeightV: array<${w}, ${s*s}>;
  ${h.registerUniforms(S).declareVariables(b,x,$,f,g,m)}
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
  }`};return e.compute({name:"AttentionPrepare",shaderCache:{inputDependencies:["type","type","type"]},getRunData:()=>({outputs:[{dims:r,dataType:e.inputs[0].dataType,gpuDataType:0},{dims:r,dataType:e.inputs[0].dataType,gpuDataType:0},{dims:r,dataType:e.inputs[0].dataType,gpuDataType:0}],dispatchGroup:o,programUniforms:d}),getShaderSource:c},{inputs:l,outputs:[-1,-1,-1]})},Ih=(e,t)=>{let r=sl(e.inputs,t),[n,i,a]=dl(e,r);return Ur(e,n,i,a,e.inputs[4],void 0,void 0,void 0,e.inputs[5],r)}}),cl,pl,hl,Ch,_b=X(()=>{Je(),ue(),le(),Oe(),de(),cl=(e,t)=>{if(!e||e.length!==5)throw new Error("BatchNormalization requires 5 inputs");let r=(n,i,a)=>{let s=i.length;if(s!==n.length)throw new Error(`${a}: num dimensions != ${s}`);i.forEach((o,l)=>{if(o!==n[l])throw new Error(`${a}: dim[${l}] do not match`)})};if(e[0].dims.length>1){let n=t.format==="NHWC"?t.spatial?e[0].dims.slice(-1):e[0].dims.slice(-1).concat(e[0].dims.slice(1,e[0].dims.length-1)):e[0].dims.slice(1,t.spatial?2:void 0);r(e[1].dims,n,"Invalid input scale"),r(e[2].dims,n,"Invalid input B"),r(e[3].dims,n,"Invalid input mean"),r(e[4].dims,n,"Invalid input var")}else r(e[1].dims,[1],"Invalid input scale"),r(e[2].dims,[1],"Invalid input B"),r(e[3].dims,[1],"Invalid input mean"),r(e[4].dims,[1],"Invalid input var")},pl=(e,t)=>{let{epsilon:r,spatial:n,format:i}=t,a=e[0].dims,s=n?Ne(a[a.length-1]):1,o=i==="NHWC"&&a.length>1?s:1,l=D.size(a)/s,d=n,c=d?a.length:a,h=W("x",e[0].dataType,e[0].dims,s),f=W("scale",e[1].dataType,e[1].dims,o),g=W("bias",e[2].dataType,e[2].dims,o),m=W("inputMean",e[3].dataType,e[3].dims,o),b=W("inputVar",e[4].dataType,e[4].dims,o),x=ne("y",e[0].dataType,c,s),$=()=>{let S="";if(n)S=`let cOffset = ${a.length===1?"0u":i==="NHWC"?`outputIndices[${a.length-1}] / ${s}`:"outputIndices[1]"};`;else if(i==="NCHW")S=`
            ${x.indicesSet("outputIndices","0","0")}
            let cOffset = ${x.indicesToOffset("outputIndices")};`;else{S=`var cIndices = ${f.type.indices}(0);
                       cIndices[0] = outputIndices[${a.length-1}];`;for(let v=1;v<f.rank;v++)S+=`cIndices[${v}] = outputIndices[${v}];`;S+=`let cOffset = ${f.indicesToOffset("cIndices")};`}return S},w=S=>`
  const epsilon = ${r};
  ${S.registerUniform("outputSize","u32").declareVariables(h,f,g,m,b,x)}
  ${S.mainStart()}
  ${S.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}
    var outputIndices = ${x.offsetToIndices(`global_idx * ${s}`)};
    ${$()}
    let scale = ${f.getByOffset("cOffset")};
    let bias = ${g.getByOffset("cOffset")};
    let inputMean = ${m.getByOffset("cOffset")};
    let inputVar = ${b.getByOffset("cOffset")};
    let x = ${h.getByOffset("global_idx")};
    let value = (x - inputMean) * inverseSqrt(inputVar + epsilon) * scale + bias;
    ${x.setByOffset("global_idx","value")}
  }`;return{name:"BatchNormalization",shaderCache:{hint:`${t.epsilon}_${t.format}_${n}_${s}`,inputDependencies:d?["rank","type","type","type","type"]:void 0},getShaderSource:w,getRunData:()=>({outputs:[{dims:e[0].dims,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(l/64)},programUniforms:d?[{type:12,data:l},...oe(a)]:[{type:12,data:l}]})}},hl=e=>we(e),Ch=(e,t)=>{let{inputs:r,outputCount:n}=e,i=hl({...t,outputCount:n});if(Ee.webgpu.validateInputContent&&cl(r,i),t.trainingMode)throw new Error("BatchNormalization trainingMode is not supported yet.");e.compute(pl(r,i))}}),fl,ml,zh,wb=X(()=>{le(),de(),fl=e=>{if(e[0].dims.length!==3)throw new Error("input should have 3 dimensions");if(![320,640,1280].includes(e[0].dims[2]))throw new Error("number of channels should be 320, 640 or 1280");if(e[1].dims.length!==1)throw new Error("bias is expected to have 1 dimensions");if(e[0].dims[2]!==e[1].dims[0])throw new Error("last dimension of input and bias are not the same")},ml=e=>{let t=e[0].dims,r=e[0].dims[2],n=D.size(t)/4,i=e[0].dataType,a=W("input",i,t,4),s=W("bias",i,[r],4),o=W("residual",i,t,4),l=ne("output",i,t,4);return{name:"BiasAdd",getRunData:()=>({outputs:[{dims:t,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(n/64)}}),getShaderSource:d=>`
  const channels = ${r}u / 4;
  ${d.declareVariables(a,s,o,l)}

  ${d.mainStart()}
    ${d.guardAgainstOutOfBoundsWorkgroupSizes(n)}
    let value = ${a.getByOffset("global_idx")}
      + ${s.getByOffset("global_idx % channels")} + ${o.getByOffset("global_idx")};
    ${l.setByOffset("global_idx","value")}
  }`}},zh=e=>{fl(e.inputs),e.compute(ml(e.inputs))}}),gl,_e,Ah,Mh,Nh,Oh,Rh,Bh,Dh,Ph,Lh,yl,Uh,jh,qh,Wh,Or,Fh,vn,Gh,Vh,Hh,Kh,Xh,Zh,Yh,Qh,Jh,ef,tf,rf,nf,af,sf,of,Ii,uf,va,xa,lf,df,cf,bl,_l,pf,Za=X(()=>{ue(),le(),Oe(),de(),gl=(e,t,r,n,i,a,s)=>{let o=Math.ceil(t/4),l="";typeof i=="string"?l=`${i}(a)`:l=i("a");let d=W("inputData",r,[o],4),c=ne("outputData",n,[o],4),h=[{name:"vec_size",type:"u32"}];return s&&h.push(...s),`
      ${e.registerUniforms(h).declareVariables(d,c)}

  ${a??""}

  ${e.mainStart()}
    ${e.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.vec_size")}

    let a = ${d.getByOffset("global_idx")};
    ${c.setByOffset("global_idx",l)}
  }`},_e=(e,t,r,n,i,a=e.dataType,s,o)=>{let l=[{type:12,data:Math.ceil(D.size(e.dims)/4)}];return s&&l.push(...s),{name:t,shaderCache:{hint:i,inputDependencies:["type"]},getShaderSource:d=>gl(d,D.size(e.dims),e.dataType,a,r,n,o),getRunData:d=>({outputs:[{dims:e.dims,dataType:a}],dispatchGroup:{x:Math.ceil(D.size(d[0].dims)/64/4)},programUniforms:l})}},Ah=e=>{e.compute(_e(e.inputs[0],"Abs","abs"))},Mh=e=>{e.compute(_e(e.inputs[0],"Acos","acos"))},Nh=e=>{e.compute(_e(e.inputs[0],"Acosh","acosh"))},Oh=e=>{e.compute(_e(e.inputs[0],"Asin","asin"))},Rh=e=>{e.compute(_e(e.inputs[0],"Asinh","asinh"))},Bh=e=>{e.compute(_e(e.inputs[0],"Atan","atan"))},Dh=e=>{e.compute(_e(e.inputs[0],"Atanh","atanh"))},Ph=e=>we(e),Lh=(e,t)=>{let r;switch(t.to){case 10:r="vec4<f16>";break;case 1:r="vec4<f32>";break;case 12:r="vec4<u32>";break;case 6:r="vec4<i32>";break;case 9:r="vec4<bool>";break;default:throw new RangeError(`not supported type (specified in attribute 'to' from 'Cast' operator): ${t.to}`)}e.compute(_e(e.inputs[0],"Cast",r,void 0,t.cacheKey,t.to))},yl=e=>{let t,r,n=e.length>=2&&e[1].data!==0,i=e.length>=3&&e[2].data!==0;switch(e[0].dataType){case 1:t=n?e[1].getFloat32Array()[0]:-34028234663852886e22,r=i?e[2].getFloat32Array()[0]:34028234663852886e22;break;case 10:t=n?e[1].getUint16Array()[0]:64511,r=i?e[2].getUint16Array()[0]:31743;break;default:throw new Error("Unsupport data type")}return we({min:t,max:r})},Uh=(e,t)=>{let r=t||yl(e.inputs),n=qe(e.inputs[0].dataType);e.compute(_e(e.inputs[0],"Clip",i=>`clamp(${i}, vec4<${n}>(uniforms.min), vec4<${n}>(uniforms.max))`,void 0,r.cacheKey,void 0,[{type:e.inputs[0].dataType,data:r.min},{type:e.inputs[0].dataType,data:r.max}],[{name:"min",type:n},{name:"max",type:n}]),{inputs:[0]})},jh=e=>{e.compute(_e(e.inputs[0],"Ceil","ceil"))},qh=e=>{e.compute(_e(e.inputs[0],"Cos","cos"))},Wh=e=>{e.compute(_e(e.inputs[0],"Cosh","cosh"))},Or=e=>we(e),Fh=(e,t)=>{let r=qe(e.inputs[0].dataType);e.compute(_e(e.inputs[0],"Elu",n=>`elu_vf32(${n})`,`
  const elu_alpha_ = ${r}(${t.alpha});

  fn elu_f32(a: ${r}) -> ${r} {
  return select((exp(a) - 1.0) * elu_alpha_, a, a >= 0.0);
  }

  fn elu_vf32(v: vec4<${r}>) -> vec4<${r}> {
  return vec4(elu_f32(v.x), elu_f32(v.y), elu_f32(v.z), elu_f32(v.w));
  }`,t.cacheKey))},vn=(e="f32")=>`
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
}`,Gh=e=>{let t=qe(e.inputs[0].dataType);e.compute(_e(e.inputs[0],"Erf",r=>`erf_vf32(${r})`,vn(t)))},Vh=e=>{e.compute(_e(e.inputs[0],"Exp","exp"))},Hh=e=>{e.compute(_e(e.inputs[0],"Floor","floor"))},Kh=e=>{let t=qe(e.inputs[0].dataType);e.compute(_e(e.inputs[0],"Gelu",r=>`0.5 * ${r} * (1.0 + erf_vf32(${r} * 0.7071067811865475))`,vn(t)))},Xh=(e,t)=>{let r=qe(e.inputs[0].dataType);e.compute(_e(e.inputs[0],"LeakyRelu",n=>`select(leaky_relu_alpha_ * ${n}, ${n}, ${n} >= vec4<${r}>(0.0))`,`const leaky_relu_alpha_ = ${r}(${t.alpha});`,t.cacheKey))},Zh=e=>{e.compute(_e(e.inputs[0],"Not",t=>`!${t}`))},Yh=e=>{e.compute(_e(e.inputs[0],"Neg",t=>`-${t}`))},Qh=e=>{e.compute(_e(e.inputs[0],"Reciprocal",t=>`1.0/${t}`))},Jh=e=>{let t=qe(e.inputs[0].dataType);e.compute(_e(e.inputs[0],"Relu",r=>`select(vec4<${t}>(0.0), ${r}, ${r} > vec4<${t}>(0.0))`))},ef=e=>{e.compute(_e(e.inputs[0],"Sigmoid",t=>`(1.0 / (1.0 + exp(-${t})))`))},tf=e=>we(e),rf=(e,t)=>{let r=qe(e.inputs[0].dataType);e.compute(_e(e.inputs[0],"HardSigmoid",n=>`max(vec4<${r}>(0.0), min(vec4<${r}>(1.0), ${t.alpha} * ${n} + vec4<${r}>(${t.beta})))`,void 0,t.cacheKey))},nf=e=>{e.compute(_e(e.inputs[0],"Sin","sin"))},af=e=>{e.compute(_e(e.inputs[0],"Sinh","sinh"))},sf=e=>{e.compute(_e(e.inputs[0],"Sqrt","sqrt"))},of=e=>{e.compute(_e(e.inputs[0],"Tan","tan"))},Ii=e=>`sign(${e}) * (1 - exp(-2 * abs(${e}))) / (1 + exp(-2 * abs(${e})))`,uf=e=>{e.compute(_e(e.inputs[0],"Tanh",Ii))},va=(e="f32")=>`
const fast_gelu_a: ${e} = 0.5;
const fast_gelu_b: ${e} = 0.7978845608028654;
const fast_gelu_c: ${e} = 0.035677408136300125;

fn tanh_v(v: vec4<${e}>) -> vec4<${e}> {
  return ${Ii("v")};
}
`,xa=e=>`(fast_gelu_a + fast_gelu_a * tanh_v(${e} * (fast_gelu_c * ${e} * ${e} + fast_gelu_b))) * ${e}`,lf=e=>{let t=qe(e.inputs[0].dataType);e.compute(_e(e.inputs[0],"FastGelu",xa,va(t),void 0,e.inputs[0].dataType))},df=(e,t)=>{let r=qe(e.inputs[0].dataType);return e.compute(_e(e.inputs[0],"ThresholdedRelu",n=>`select(vec4<${r}>(0.0), ${n}, ${n} > thresholded_relu_alpha_)`,`const thresholded_relu_alpha_ = vec4<${r}>(${t.alpha});`,t.cacheKey)),0},cf=e=>{e.compute(_e(e.inputs[0],"Log","log"))},bl=(e,t)=>`
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
`,_l=e=>`quick_gelu_impl(${e})`,pf=(e,t)=>{let r=qe(e.inputs[0].dataType);e.compute(_e(e.inputs[0],"QuickGelu",_l,bl(r,t.alpha),t.cacheKey,e.inputs[0].dataType))}}),wl,$l,hf,$b=X(()=>{le(),de(),Za(),wl=e=>{if(e[0].dims.length!==3)throw new Error("input should have 3 dimensions");if(![2560,5120,10240].includes(e[0].dims[2]))throw new Error("hidden state should be 2560, 5120 or 10240");if(e[1].dims.length!==1)throw new Error("bias is expected to have 1 dimensions");if(e[0].dims[2]!==e[1].dims[0])throw new Error("last dimension of input and bias are not the same")},$l=e=>{let t=e[0].dims.slice();t[2]=t[2]/2;let r=W("input",e[0].dataType,e[0].dims,4),n=W("bias",e[0].dataType,[e[0].dims[2]],4),i=ne("output",e[0].dataType,t,4),a=D.size(t)/4,s=De(e[0].dataType);return{name:"BiasSplitGelu",getRunData:()=>({outputs:[{dims:t,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(a/64)}}),getShaderSource:o=>`
  const M_SQRT2 = sqrt(2.0);
  const halfChannels = ${e[0].dims[2]/4/2}u;

  ${o.declareVariables(r,n,i)}

  ${vn(s)}

  ${o.mainStart()}
    ${o.guardAgainstOutOfBoundsWorkgroupSizes(a)}
    let biasIdx = global_idx % halfChannels;
    let batchIndex = global_idx / halfChannels;
    let inputOffset = biasIdx + batchIndex * halfChannels * 2;
    let valueLeft = input[inputOffset] + bias[biasIdx];
    let valueRight = input[inputOffset + halfChannels] + bias[biasIdx + halfChannels];
    let geluRight = valueRight * 0.5 * (erf_vf32(valueRight / M_SQRT2) + 1);

    ${i.setByOffset("global_idx","valueLeft * geluRight")}
  }`}},hf=e=>{wl(e.inputs),e.compute($l(e.inputs))}}),vl,xl,st,ff,mf,gf,yf,bf,_f,wf,$f,vf,xf,vb=X(()=>{ue(),le(),de(),vl=(e,t,r,n,i,a,s,o,l,d,c,h)=>{let f,g;typeof o=="string"?f=g=(w,S)=>`${o}((${w}),(${S}))`:typeof o=="function"?f=g=o:(f=o.scalar,g=o.vector);let m=ne("outputData",c,n.length,4),b=W("aData",l,t.length,4),x=W("bData",d,r.length,4),$;if(i)if(a){let w=D.size(t)===1,S=D.size(r)===1,v=t.length>0&&t[t.length-1]%4===0,E=r.length>0&&r[r.length-1]%4===0;w||S?$=m.setByOffset("global_idx",g(w?`${b.type.value}(${b.getByOffset("0")}.x)`:b.getByOffset("global_idx"),S?`${x.type.value}(${x.getByOffset("0")}.x)`:x.getByOffset("global_idx"))):$=`
            let outputIndices = ${m.offsetToIndices("global_idx * 4u")};
            let offsetA = ${b.broadcastedIndicesToOffset("outputIndices",m)};
            let offsetB = ${x.broadcastedIndicesToOffset("outputIndices",m)};
            ${m.setByOffset("global_idx",g(s||v?b.getByOffset("offsetA / 4u"):`${b.type.value}(${b.getByOffset("offsetA / 4u")}[offsetA % 4u])`,s||E?x.getByOffset("offsetB / 4u"):`${x.type.value}(${x.getByOffset("offsetB / 4u")}[offsetB % 4u])`))}
          `}else $=m.setByOffset("global_idx",g(b.getByOffset("global_idx"),x.getByOffset("global_idx")));else{if(!a)throw new Error("no necessary to use scalar implementation for element-wise binary op implementation.");let w=(S,v,E="")=>{let z=`aData[indexA${v}][componentA${v}]`,M=`bData[indexB${v}][componentB${v}]`;return`
            let outputIndices${v} = ${m.offsetToIndices(`global_idx * 4u + ${v}u`)};
            let offsetA${v} = ${b.broadcastedIndicesToOffset(`outputIndices${v}`,m)};
            let offsetB${v} = ${x.broadcastedIndicesToOffset(`outputIndices${v}`,m)};
            let indexA${v} = offsetA${v} / 4u;
            let indexB${v} = offsetB${v} / 4u;
            let componentA${v} = offsetA${v} % 4u;
            let componentB${v} = offsetB${v} % 4u;
            ${S}[${v}] = ${E}(${f(z,M)});
          `};c===9?$=`
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
      }`},xl=(e,t,r,n,i,a,s=r.dataType)=>{let o=r.dims.map(Number),l=n.dims.map(Number),d=!D.areEqual(o,l),c=o,h=D.size(o),f=!1,g=!1,m=[d];if(d){let b=pr.calcShape(o,l,!1);if(!b)throw new Error("Can't perform binary op on the given tensors");c=b.slice(),h=D.size(c);let x=D.size(o)===1,$=D.size(l)===1,w=o.length>0&&o[o.length-1]%4===0,S=l.length>0&&l[l.length-1]%4===0;m.push(x),m.push($),m.push(w),m.push(S);let v=1;for(let E=1;E<c.length;E++){let z=o[o.length-E],M=l[l.length-E];if(z===M)v*=z;else break}v%4===0?(g=!0,f=!0):(x||$||w||S)&&(f=!0)}else f=!0;return m.push(f),{name:e,shaderCache:{hint:t+m.map(b=>b.toString()).join("_"),inputDependencies:["rank","rank"]},getShaderSource:b=>vl(b,o,l,c,f,d,g,i,r.dataType,n.dataType,s,a),getRunData:()=>({outputs:[{dims:c,dataType:s}],dispatchGroup:{x:Math.ceil(h/64/4)},programUniforms:[{type:12,data:Math.ceil(D.size(c)/4)},...oe(o,l,c)]})}},st=(e,t,r,n,i,a)=>{e.compute(xl(t,i??"",e.inputs[0],e.inputs[1],r,n,a))},ff=e=>{st(e,"Add",(t,r)=>`${t}+${r}`)},mf=e=>{st(e,"Div",(t,r)=>`${t}/${r}`)},gf=e=>{st(e,"Equal",{scalar:(t,r)=>`u32(${t}==${r})`,vector:(t,r)=>`vec4<u32>(${t}==${r})`},void 0,void 0,9)},yf=e=>{st(e,"Mul",(t,r)=>`${t}*${r}`)},bf=e=>{let t=W("input",e.inputs[0].dataType,e.inputs[0].dims).type.value;st(e,"Pow",{scalar:(r,n)=>`pow_custom(${r},${n})`,vector:(r,n)=>`pow_vector_custom(${r},${n})`},`
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
      `)},_f=e=>{st(e,"Sub",(t,r)=>`${t}-${r}`)},wf=e=>{st(e,"Greater",{scalar:(t,r)=>`u32(${t}>${r})`,vector:(t,r)=>`vec4<u32>(${t}>${r})`},void 0,void 0,9)},$f=e=>{st(e,"Less",{scalar:(t,r)=>`u32(${t}<${r})`,vector:(t,r)=>`vec4<u32>(${t}<${r})`},void 0,void 0,9)},vf=e=>{st(e,"GreaterOrEqual",{scalar:(t,r)=>`u32(${t}>=${r})`,vector:(t,r)=>`vec4<u32>(${t}>=${r})`},void 0,void 0,9)},xf=e=>{st(e,"LessOrEqual",{scalar:(t,r)=>`u32(${t}<=${r})`,vector:(t,r)=>`vec4<u32>(${t}<=${r})`},void 0,void 0,9)}}),Sl,kl,Tl,El,Sf,kf,xb=X(()=>{ue(),le(),Oe(),de(),Sl=(e,t)=>{if(!e||e.length<1)throw new Error("too few inputs");let r=0,n=e[r],i=n.dataType,a=n.dims.length;e.forEach((s,o)=>{if(o!==r){if(s.dataType!==i)throw new Error("input tensors should be one type");if(s.dims.length!==a)throw new Error("input tensors should have the same shape");s.dims.forEach((l,d)=>{if(d!==t&&l!==n.dims[d])throw new Error("non concat dimensions must match")})}})},kl=(e,t)=>`
  fn calculateInputIndex(index: u32) -> u32 {
    let sizeInConcatAxis = array<u32, ${e}u>(${t});
    for (var i: u32 = 0u; i < ${e}; i += 1u ) {
      if (index < sizeInConcatAxis[i]) {
        return i;
      }
    }
    return ${e}u;
  }`,Tl=(e,t)=>{let r=e.length,n=[];for(let i=0;i<r;++i){let a=t.setByOffset("global_idx",e[i].getByIndices("indices"));r===1?n.push(a):i===0?n.push(`if (inputIndex == ${i}u) { ${a} }`):i===r-1?n.push(`else { ${a} }`):n.push(`else if (inputIndex == ${i}) { ${a} }`)}return n.join(`
`)},El=(e,t,r,n)=>{let i=D.size(r),a=new Array(e.length),s=new Array(e.length),o=0,l=[],d=[],c=[{type:12,data:i}];for(let b=0;b<e.length;++b)o+=e[b].dims[t],a[b]=o,d.push(e[b].dims.length),s[b]=W(`input${b}`,n,d[b]),l.push("rank"),c.push({type:12,data:a[b]});for(let b=0;b<e.length;++b)c.push(...oe(e[b].dims));c.push(...oe(r));let h=ne("output",n,r.length),f=h.indicesGet("indices",t),g=Array.from(Array(a.length).keys()).map(b=>`uniforms.sizeInConcatAxis${b}`).join(","),m=b=>`

  ${(()=>{b.registerUniform("outputSize","u32");for(let x=0;x<e.length;x++)b.registerUniform(`sizeInConcatAxis${x}`,"u32");return b.declareVariables(...s,h)})()}

  ${kl(a.length,g)}

  ${b.mainStart()}
    ${b.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}

    var indices = ${h.offsetToIndices("global_idx")};

    let inputIndex = calculateInputIndex(${f});
    if (inputIndex != 0u) {
      let sizeInConcatAxis = array<u32, ${a.length}u>(${g});
      ${f} -= sizeInConcatAxis[inputIndex - 1u];
    }

    ${Tl(s,h)}
  }`;return{name:"Concat",shaderCache:{hint:`${t}`,inputDependencies:l},getRunData:()=>({outputs:[{dims:r,dataType:n}],dispatchGroup:{x:Math.ceil(i/64)},programUniforms:c}),getShaderSource:m}},Sf=(e,t)=>{let r=e.inputs,n=r[0].dims,i=D.normalizeAxis(t.axis,n.length);Sl(r,i);let a=n.slice();a[i]=r.reduce((o,l)=>o+(l.dims.length>i?l.dims[i]:0),0);let s=r.filter(o=>D.size(o.dims)>0);e.compute(El(s,i,a,r[0].dataType),{inputs:s})},kf=e=>we({axis:e.axis})}),er,tr,rr,Ya,ir=X(()=>{ue(),le(),er=(e,t,r="f32")=>{switch(e.activation){case"Relu":return`value = max(value, ${t}(0.0));`;case"Sigmoid":return`value = (${t}(1.0) / (${t}(1.0) + exp(-value)));`;case"Clip":return`value = clamp(value, ${t}(${r}(uniforms.clip_min)), ${t}(${r}(uniforms.clip_max)));`;case"HardSigmoid":return`value = max(${t}(0.0), min(${t}(1.0), ${r}(uniforms.alpha) * value + ${r}(uniforms.beta)));`;case"LeakyRelu":return`value = select(${r}(uniforms.alpha) * value, value, value >= ${t}(0.0));`;case"Tanh":return`let e2x = exp(-2.0 * abs(value));
              value = sign(value) * (1.0 - e2x) / (1.0 + e2x);
        `;case"":return"";default:throw new Error(`Unsupported activation ${e.activation}`)}},tr=(e,t)=>{e.activation==="Clip"?t.push({type:1,data:e.clipMax},{type:1,data:e.clipMin}):e.activation==="HardSigmoid"?t.push({type:1,data:e.alpha},{type:1,data:e.beta}):e.activation==="LeakyRelu"&&t.push({type:1,data:e.alpha})},rr=(e,t)=>{e.activation==="Clip"?t.push({name:"clip_max",type:"f32"},{name:"clip_min",type:"f32"}):e.activation==="HardSigmoid"?t.push({name:"alpha",type:"f32"},{name:"beta",type:"f32"}):e.activation==="LeakyRelu"&&t.push({name:"alpha",type:"f32"})},Ya=e=>{let t=e?.activation||"";if(t==="HardSigmoid"){let[r,n]=e?.activation_params||[.2,.5];return{activation:t,alpha:r,beta:n}}else if(t==="Clip"){let[r,n]=e?.activation_params||[Zp,Yp];return{activation:t,clipMax:n,clipMin:r}}else if(t==="LeakyRelu"){let[r]=e?.activation_params||[.01];return{activation:t,alpha:r}}return{activation:t}}}),Le,Tf,Qa=X(()=>{Le=(e,t)=>{switch(e){case 1:return t;case 2:return`vec2<${t}>`;case 3:return`vec3<${t}>`;case 4:return`vec4<${t}>`;default:throw new Error(`${e}-component is not supported.`)}},Tf=e=>`
      ${e?"value = value + getBiasByOutputCoords(coords);":""}
      `}),Ef,Sb=X(()=>{Ef=e=>`
fn getIndexFromCoords4D(coords : vec4<i32>, shape : vec4<i32>) -> i32 {
  return dot(coords, vec4<i32>(
      shape.y * shape.z * shape.w, shape.z * shape.w, shape.w, 1));
}
fn getOutputIndexFromCoords(coords : vec4<i32>) -> i32 {
  return dot(coords, vec4<i32>(
    i32(${e}.x), i32(${e}.y), i32(${e}.z), 1));
}
`}),Dr,Ja,es=X(()=>{ue(),le(),de(),ir(),Dr=(e,t,r,n,i)=>{let a=n-r;return`
      ${Array.from({length:r}).map((s,o)=>`
      if (${ae(t.shape,o,t.rank)} != 1) {
        ${t.indicesSet(e,o,ae(i,o+a,n))}
      } else {
        ${t.indicesSet(e,o,0)}
      }`).join("")}
`},Ja=(e,t,r,n,i=!1,a)=>{let s=e[0].dims,o=e[1].dims,l=s[s.length-2],d=o[o.length-1],c=s[s.length-1],h=Ne(d),f=Ne(c),g=Ne(l),m=D.size(r)/h/g,b=e.length>2,x=n?n.slice(0,-2):r.slice(0,-2),$=[D.size(x),l,d],w=[{type:12,data:m},{type:12,data:l},{type:12,data:d},{type:12,data:c}];tr(t,w),w.push(...oe(x,s,o)),b&&w.push(...oe(e[2].dims)),w.push(...oe($));let S=v=>{let E=Ha("batch_dims",e[0].dataType,x.length),z=W("a",e[0].dataType,s.length,f),M=W("b",e[1].dataType,o.length,h),k=ne("output",e[0].dataType,$.length,h),B=De(k.type.tensor),U=er(t,k.type.value,B),G=[z,M],V="";if(b){let P=i?h:1;G.push(W("bias",e[2].dataType,e[2].dims.length,P)),V=`${i?`value += bias[col / ${P}];`:`value += ${k.type.value}(bias[row + i]);`}`}let Z=[{name:"output_size",type:"u32"},{name:"M",type:"u32"},{name:"N",type:"u32"},{name:"K",type:"u32"}];rr(t,Z);let O=()=>{let P=`var a_data: ${z.type.value};`;for(let H=0;H<f;H++)P+=`
              let b_data${H} = b[(b_offset + (k + ${H}) * uniforms.N + col) / ${h}];`;for(let H=0;H<g;H++){P+=`a_data = a[(a_offset + (row + ${H}) * uniforms.K + k) / ${f}];`;for(let Y=0;Y<f;Y++)P+=`
            values[${H}] = fma(${M.type.value}(a_data${f===1?"":`[${Y}]`}), b_data${Y}, values[${H}]);
`}return P};return`
  ${v.registerUniforms(Z).registerInternalVariables(E).declareVariables(...G,k)}
  ${v.mainStart()}
    ${v.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
    let col = (global_idx % (uniforms.N / ${h})) * ${h};
    var index1 = global_idx / (uniforms.N / ${h});
    let stride1 = uniforms.M / ${g};
    let row = (index1 % stride1) * ${g};
    let batch = index1 / stride1;

    ${r.length===2?"":`let batch_indices = ${E.offsetToIndices("batch")};`}

    var a_indices: ${z.type.indices};
    ${Dr("a_indices",z,z.rank-2,E.rank,"batch_indices")}
    ${z.indicesSet("a_indices",z.rank-2,0)}
    ${z.indicesSet("a_indices",z.rank-1,0)}
    let a_offset = ${z.indicesToOffset("a_indices")};

    var b_indices: ${M.type.indices};
    ${Dr("b_indices",M,M.rank-2,E.rank,"batch_indices")}
    ${M.indicesSet("b_indices",M.rank-2,0)}
    ${M.indicesSet("b_indices",M.rank-1,0)}
    let b_offset = ${M.indicesToOffset("b_indices")};
    var values: array<${k.type.value}, ${g}>;
    for (var k: u32 = 0u; k < uniforms.K; k = k + ${f}) {
      ${O()}
    }
    for (var i = 0u; i < ${g}u; i++) {
      var value = values[i];
      ${V}
      ${U}
      let cur_indices = ${k.type.indices}(batch, row + i, col);
      let offset = ${k.indicesToOffset("cur_indices")};
      ${k.setByOffset(`offset / ${h}`,"value")};
    }
  }
  `};return{name:"MatMulNaive",shaderCache:{hint:`${t.activation};${h};${f};${g};${i}`,inputDependencies:b?["rank","rank","rank"]:["rank","rank"]},getRunData:()=>({outputs:[{dims:a?a(r):r,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(m/64)},programUniforms:w}),getShaderSource:S}}}),Il,Cl,Sa,Ci,zl,ka,Al,zn,ts=X(()=>{ue(),le(),de(),ir(),es(),Qa(),Il=(e,t)=>e?`
        mm_Asub[inputRow][inputCol] = mm_readA(batch,
          kStart + inputRow,
          globalRowStart / innerElementSize + inputCol${t?", batchIndices":""});
        `:`
        mm_Asub[inputRow][inputCol] = mm_readA(batch,
          globalRow + innerRow,
          kStart / innerElementSize + inputCol${t?", batchIndices":""});
        `,Cl=(e,t)=>e?`
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
        }`,Sa=(e,t,r="f32",n,i=!1,a=32,s=!1,o=32)=>{let l=t[1]*e[1],d=t[0]*e[0],c=i?l:a,h=i?a:l,f=c/t[0],g=a/t[1];if(!((i&&f===4&&e[1]===4||!i&&(f===3||f===4))&&c%t[0]===0&&a%t[1]===0&&e[0]===4))throw new Error(`If transposeA ${i} is true, innerElementSize ${f} and workPerThread[1] ${e[1]} must be 4.
      Otherwise, innerElementSize ${f} must be 3 or 4.
  tileAWidth ${c} must be divisible by workgroupSize[0]${t[0]}. tileInner ${a} must be divisible by workgroupSize[1] ${t[1]}. colPerThread ${e[0]} must be 4.`);return`
var<workgroup> mm_Asub: array<array<vec${f}<${r}>, ${c/f}>, ${h}>;
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
  ${n?`let batchIndices = ${n.offsetToIndices("u32(batch)")};`:""}
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
          ${Il(i,n)}
      }

      // Load one tile of B into local memory.
      for (var innerRow = 0; innerRow < ${g}; innerRow = innerRow + 1) {
          let inputRow = tileRowB + innerRow;
          let inputCol = tileCol;
          mm_Bsub[inputRow][inputCol] = mm_readB(batch, kStart + inputRow, globalCol${n?", batchIndices":""});
      }
      kStart = kStart + tileInner;
      workgroupBarrier();

      // Compute acc values for a single thread.
      for (var k = 0; k < tileInner / innerElementSize; k = k + 1) {
          let BCached0 = mm_Bsub[k * innerElementSize][tileCol];
          let BCached1 = mm_Bsub[k * innerElementSize + 1][tileCol];
          let BCached2 = mm_Bsub[k * innerElementSize + 2][tileCol];
          ${f===3?"":"let BCached3 = mm_Bsub[k * innerElementSize + 3][tileCol];"}

          ${Cl(i,f)}
      }

      workgroupBarrier();
  }

  for (var innerRow = 0; innerRow < rowPerThread; innerRow = innerRow + 1) {
      mm_write(batch, globalRow + innerRow, globalCol, acc[innerRow]);
  }
}`},Ci=(e,t)=>e?`
            mm_Asub[inputRow][inputCol] = mm_readA(batch,
              kStart + inputRow,
              globalRowStart + inputCol${t?", batchIndices":""});
            `:`
            mm_Asub[inputRow][inputCol] = mm_readA(batch,
              globalRowStart + inputRow,
              kStart + inputCol${t?", batchIndices":""});
            `,zl=e=>e?"let ACached = mm_Asub[k][tileRow + innerRow];":"let ACached = mm_Asub[tileRow + innerRow][k];",ka=(e,t,r="f32",n,i=!1,a=32,s=!1,o=32,l=!1)=>{let d=e[1]*t[1],c=e[0]*t[0],h=i?d:a,f=i?a:d;if(!(f%t[1]===0&&h%t[0]===0&&a%t[1]===0))throw new Error(`tileAHight ${f} must be divisible by workgroupSize[1]${t[1]}, tileAWidth ${h} must be divisible by workgroupSize[0]${t[0]}, tileInner ${a} must be divisible by workgroupSize[1]${t[1]}`);let g=f/t[1],m=h/t[0],b=a/t[1],x=l?`
    let localRow = i32(localId.y);
    let localCol = i32(localId.x);
    let globalRowStart = i32(workgroupId.y) * ${d};
    let globalColStart = i32(workgroupId.x) * ${c};

    // Loop over shared dimension.
    for (var t = 0; t < num_tiles; t = t + 1) {
      // Load one tile of A into local memory.
      for (var inputRow = localRow; inputRow < ${f}; inputRow = inputRow + ${t[1]}) {
        for (var inputCol = localCol; inputCol < ${h}; inputCol = inputCol + ${t[0]}) {
          ${Ci(i,n)}
        }
      }
      // Load one tile of B into local memory.
      for (var inputRow = localRow; inputRow < ${a}; inputRow = inputRow + ${t[1]}) {
            for (var inputCol = localCol; inputCol < ${c}; inputCol = inputCol + ${t[0]}) {
          mm_Bsub[inputRow][inputCol] = mm_readB(batch,
            kStart + inputRow,
            globalColStart + inputCol${n?", batchIndices":""});
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
          let ACached = ${i?`mm_Asub[k][localRow + innerRow * ${t[1]}];`:`mm_Asub[localRow + innerRow * ${t[1]}][k];`}
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
      ${Ci(i,n)}
    }
  }

  // Load one tile of B into local memory.
  for (var innerRow = 0; innerRow < ${b}; innerRow = innerRow + 1) {
    for (var innerCol = 0; innerCol < colPerThread; innerCol = innerCol + 1) {
      let inputRow = tileRowB + innerRow;
      let inputCol = tileCol + innerCol;
      mm_Bsub[inputRow][inputCol] = mm_readB(batch,
        kStart + inputRow,
        globalCol + innerCol${n?", batchIndices":""});
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
      ${zl(i)}
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
  var<workgroup> mm_Bsub : array<array<${r}, ${c}>, ${a}>;
  const rowPerThread = ${e[1]};
  const colPerThread = ${e[0]};
  const tileInner = ${a};

@compute @workgroup_size(${t[0]}, ${t[1]}, ${t[2]})
fn main(@builtin(local_invocation_id) localId : vec3<u32>,
        @builtin(global_invocation_id) globalId : vec3<u32>,
        @builtin(workgroup_id) workgroupId : vec3<u32>) {
    let batch = ${s?"0":"i32(globalId.z)"};
    ${n?`let batchIndices = ${n.offsetToIndices("u32(batch)")};`:""}
    let num_tiles = ${s?`${Math.ceil(o/a)}`:"(uniforms.dim_inner - 1) / tileInner + 1"};
    var kStart = ${s?`i32(globalId.z) * ${o}`:"0"};

    var acc : array<array<${r}, colPerThread>, rowPerThread>;
    ${x}
  }
`},Al=(e,t,r,n,i=!1)=>{let[a,s,o,l]=n,d=De(n[0].type.tensor);return`
    fn mm_readA(batch: i32, row: i32, colIn: i32, batchIndices: ${a.type.indices}) -> ${Le(e,d)} {
      var value = ${Le(e,d)}(0.0);
      let col = colIn * ${e};
      if(row < uniforms.dim_a_outer && col < uniforms.dim_inner)
      {
        var aIndices: ${s.type.indices};
        ${Dr("aIndices",s,s.rank-2,a.rank,"batchIndices")}
        ${s.indicesSet("aIndices",s.rank-2,"u32(row)")}
        ${s.indicesSet("aIndices",s.rank-1,"u32(colIn)")}
        value = ${s.getByIndices("aIndices")};
      }
      return value;
    }

    fn mm_readB(batch: i32, row: i32, colIn: i32, batchIndices: ${a.type.indices}) -> ${Le(e,d)} {
      var value = ${Le(e,d)}(0.0);
      let col = colIn * ${e};
      if(row < uniforms.dim_inner && col < uniforms.dim_b_outer)
      {
        var bIndices: ${o.type.indices};
        ${Dr("bIndices",o,o.rank-2,a.rank,"batchIndices")}
        ${o.indicesSet("bIndices",o.rank-2,"u32(row)")}
        ${o.indicesSet("bIndices",o.rank-1,"u32(colIn)")}
        value = ${o.getByIndices("bIndices")};
      }
      return value;
    }

    fn mm_write(batch: i32, row: i32, colIn: i32, valueIn: ${Le(e,d)}) {
      let col = colIn * ${e};
      if (row < uniforms.dim_a_outer && col < uniforms.dim_b_outer) {
        var value = valueIn;
        let coords = vec3<i32>(batch, row, colIn);
        ${t?`value = value + ${i?"bias[colIn]":`${Le(e,d)}(bias[row])`};`:""}
        ${r}
        ${l.setByIndices("vec3<u32>(coords)","value")}
      }
    }
    `},zn=(e,t,r,n,i=!1,a)=>{let s=e[0].dims,o=e[1].dims,l=s.slice(0,-2),d=o.slice(0,-2),c=n?n.slice(0,-2):r.slice(0,-2),h=D.size(c),f=s[s.length-2],g=s[s.length-1],m=o[o.length-1],b=g%4===0&&m%4===0,x=f<=8?[4,1,1]:[4,4,1],$=[8,8,1],w=[Math.ceil(m/$[0]/x[0]),Math.ceil(f/$[1]/x[1]),Math.ceil(h/$[2]/x[2])],S=b?4:1,v=[...l,f,g/S],E=v.length,z=[...d,g,m/S],M=z.length,k=[h,f,m/S],B=[{type:6,data:f},{type:6,data:m},{type:6,data:g}];tr(t,B),B.push(...oe(c,v,z));let U=["rank","rank"],G=e.length>2;G&&(B.push(...oe(e[2].dims)),U.push("rank")),B.push(...oe(k));let V=Z=>{let O=c.length,P=Ha("batchDims",e[0].dataType,O,1),H=De(e[0].dataType),Y=W("a",e[0].dataType,E,S),j=W("b",e[1].dataType,M,S),K=ne("result",e[0].dataType,k.length,S),J=[Y,j];if(G){let ie=i?S:1;J.push(W("bias",e[2].dataType,e[2].dims.length,ie))}let L=[{name:"dim_a_outer",type:"i32"},{name:"dim_b_outer",type:"i32"},{name:"dim_inner",type:"i32"}];rr(t,L);let re=De(K.type.tensor),C=er(t,K.type.value,re),R=Al(S,G,C,[P,Y,j,K],i);return`
  ${Z.registerUniforms(L).registerInternalVariables(P).declareVariables(...J,K)}
  ${R}
  ${b?Sa(x,$,H,P):ka(x,$,H,P)}
                   `};return{name:"MatMul",shaderCache:{hint:`${x};${t.activation};${b};${i}`,inputDependencies:U},getRunData:()=>({outputs:[{dims:a?a(r):r,dataType:e[0].dataType}],dispatchGroup:{x:w[0],y:w[1],z:w[2]},programUniforms:B}),getShaderSource:V}}}),Ml,If,kb=X(()=>{ue(),xt(),de(),ir(),Qa(),Sb(),ts(),Ml=(e,t,r,n,i=!1,a,s=4,o=4,l=4,d="f32")=>{let c=B=>{switch(B){case 1:return"resData = x[xIndex];";case 3:return`resData = vec3<${d}>(x[xIndex], x[xIndex + 1], x[xIndex + 2]);`;case 4:return"resData = x[xIndex / 4];";default:throw new Error(`innerElementSize ${B} is not supported.`)}},h=B=>{switch(B){case 1:return"return w[row * i32(uniforms.w_shape[3]) + colIn];";case 4:return"return w[row * i32(uniforms.w_shape[3]) / 4 + colIn];";default:throw new Error(`innerElementSize ${B} is not supported.`)}},f=e?`
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
    var resData = ${Le(s,d)}(0.0);
    // The bounds checking is always needed since we use it to pad zero for
    // the 'same' padding type.
    if (xRow >= 0 && xRow < ${m} && xCol >= 0 && xCol < ${b}) {
      ${f}
      let xIndex = getIndexFromCoords4D(coord, vec4<i32>(uniforms.x_shape));
      ${c(s)}
    }
    return resData;`,S=e?t&&n?`
    let col = colIn * ${s};
    ${w}`:`
    let col = colIn * ${s};
    if (row < uniforms.dim_a_outer && col < uniforms.dim_inner) {
      ${w}
    }
    return ${Le(s,d)}(0.0);`:n&&r?`
    let col = colIn * ${s};
    ${w}`:`
    let col = colIn * ${s};
    if (row < uniforms.dim_inner && col < uniforms.dim_b_outer) {
      ${w}
    }
    return ${Le(s,d)}(0.0);`,v=e?n&&r?h(o):`
    let col = colIn * ${o};
    if (row < uniforms.dim_inner && col < uniforms.dim_b_outer) {
      ${h(o)}
    }
    return ${Le(o,d)}(0.0);`:`
    let col = colIn * ${o};
    if (row < uniforms.dim_inner && col < uniforms.dim_a_outer) {
      ${h(o)}
    }
    return ${Le(o,d)}(0.0);`,E=Le(l,d),z=Le(e?s:o,d),M=Le(e?o:s,d),k=er(a,E,d);return`
    fn mm_readA(batch: i32, row : i32, colIn : i32) -> ${z} {
      ${e?S:v}
    }

    fn mm_readB(batch: i32, row : i32, colIn : i32) -> ${M} {
      ${e?v:S}
    }

    fn mm_write(batch: i32, row : i32, colIn : i32, valueIn : ${E}) {
      let col = colIn * ${l};
      if (row < uniforms.dim_a_outer && col < uniforms.dim_b_outer)
      {
      var value = valueIn;
      let outWidth = ${e?"i32(uniforms.result_shape[2])":"i32(uniforms.result_shape[3])"};
      ${g}
      ${Tf(i)}
      ${k}
      setOutputAtCoords(coords[0], coords[1], coords[2], coords[3], value);
      }
    }`},If=(e,t,r,n,i,a,s,o,l)=>{let d=t.format==="NHWC",c=d?e[0].dims[3]:e[0].dims[1],h=r[0],f=d?r[2]:r[3],g=d?r[1]:r[2],m=d?r[3]:r[1],b=d&&(c%4===0||c%3===0)&&m%4===0,x=d?m:f*g,$=d?f*g:m,w=[8,8,1],S=n<=8?[4,1,1]:[4,4,1],v=[Math.ceil(x/w[0]/S[0]),Math.ceil($/w[1]/S[1]),Math.ceil(h/w[2]/S[2])];ye("verbose",()=>`[conv2d_mm_webgpu] dispatch = ${v}`);let E=b?d&&c%4!==0?3:4:1,z=w[1]*S[1],M=w[0]*S[0],k=Math.max(w[0]*E,w[1]),B=n%z===0,U=i%M===0,G=a%k===0,V=b?[E,4,4]:[1,1,1],Z=[{type:6,data:n},{type:6,data:i},{type:6,data:a},{type:6,data:[t.pads[0],t.pads[1]]},{type:6,data:t.strides},{type:6,data:t.dilations}];tr(t,Z),Z.push(...oe(e[0].dims,e[1].dims));let O=["rank","rank"];s&&(Z.push(...oe(e[2].dims)),O.push("rank")),Z.push(...oe(r));let P=H=>{let Y=[{name:"dim_a_outer",type:"i32"},{name:"dim_b_outer",type:"i32"},{name:"dim_inner",type:"i32"},{name:"pad",type:"i32",length:2},{name:"stride",type:"i32",length:2},{name:"dilation",type:"i32",length:2}];rr(t,Y);let j=b?4:1,K=De(e[0].dataType),J=`
      fn setOutputAtIndex(flatIndex : i32, value : ${b?`vec4<${K}>`:K}) {
        result[flatIndex] = ${b?`vec4<${K}>`:K}(value);
      }
      fn setOutputAtCoords(d0 : i32, d1 : i32, d2 : i32, d3 : i32, value : ${b?`vec4<${K}>`:K}) {
        let flatIndex = getOutputIndexFromCoords(vec4<i32>(d0, d1, d2, d3));
        setOutputAtIndex(flatIndex ${b?"/ 4":""}, value);
      }`,L=W("x",e[0].dataType,e[0].dims.length,E===3?1:E),re=W("w",e[1].dataType,e[1].dims.length,j),C=[L,re],R=ne("result",e[0].dataType,r.length,j);if(s){let ie=W("bias",e[2].dataType,e[2].dims.length,j);C.push(ie),J+=`
        fn getBiasByOutputCoords(coords : vec4<i32>) -> ${b?`vec4<${K}>`:K} {
          return bias[coords.${d?"w":"y"}${b?"/ 4":""}];
        }`}return`
        ${Ef("uniforms.result_strides")}
        //struct Uniforms { xShape : vec4<i32>, wShape : vec4<i32>, outShape : vec4<i32>,
        //  outShapeStrides: vec3<i32>, filterDims : vec2<i32>, pad : vec2<i32>, stride : vec2<i32>,
        //  dilation : vec2<i32>, dimAOuter : i32, dimBOuter : i32, dimInner : i32 };
        ${H.registerUniforms(Y).declareVariables(...C,R)}
        ${J}
        ${Ml(d,B,U,G,s,t,V[0],V[1],V[2],K)}
        ${b?Sa(S,w,K,void 0,!d,k):ka(S,w,K,void 0,!d,k,!1,void 0,o)}`};return{name:"Conv2DMatMul",shaderCache:{hint:`${t.cacheKey};${E};${b};${B};${U};${G};${z};${M};${k}`,inputDependencies:O},getRunData:()=>({outputs:[{dims:l?l(r):r,dataType:e[0].dataType}],dispatchGroup:{x:v[0],y:v[1],z:v[2]},programUniforms:Z}),getShaderSource:P}}}),Nl,zi,Sr,Ol,Ai,Rl,Cf,zf,Tb=X(()=>{ue(),xt(),le(),de(),ir(),Qa(),Nl=e=>{let t=1;for(let r=0;r<e.length;r++)t*=e[r];return t},zi=e=>typeof e=="number"?[e,e,e]:e,Sr=(e,t)=>t<=1?e:e+(e-1)*(t-1),Ol=(e,t,r,n=1)=>{let i=Sr(t,n);return Math.floor((e[0]*(r-1)-r+i)/2)},Ai=(e,t,r,n,i)=>{i==null&&(i=Ol(e,t[0],n[0]));let a=[0,0,0,r];for(let s=0;s<3;s++)e[s]+2*i>=t[s]&&(a[s]=Math.trunc((e[s]-t[s]+2*i)/n[s]+1));return a},Rl=(e,t,r,n,i,a,s,o,l,d)=>{let c,h,f,g;if(e==="VALID"&&(e=0),typeof e=="number"){c={top:e,bottom:e,left:e,right:e,front:e,back:e};let m=Ai([t,r,n,1],[o,l,d],1,[i,a,s],e);h=m[0],f=m[1],g=m[2]}else if(Array.isArray(e)){if(!e.every((b,x,$)=>b===$[0]))throw Error(`Unsupported padding parameter: ${e}`);c={top:e[0],bottom:e[1],left:e[2],right:e[3],front:e[4],back:e[5]};let m=Ai([t,r,n,1],[o,l,d],1,[i,a,s],e[0]);h=m[0],f=m[1],g=m[2]}else if(e==="SAME_UPPER"){h=Math.ceil(t/i),f=Math.ceil(r/a),g=Math.ceil(n/s);let m=(h-1)*i+o-t,b=(f-1)*a+l-r,x=(g-1)*s+d-n,$=Math.floor(m/2),w=m-$,S=Math.floor(b/2),v=b-S,E=Math.floor(x/2),z=x-E;c={top:S,bottom:v,left:E,right:z,front:$,back:w}}else throw Error(`Unknown padding parameter: ${e}`);return{padInfo:c,outDepth:h,outHeight:f,outWidth:g}},Cf=(e,t,r,n,i,a=!1,s="channelsLast")=>{let o,l,d,c,h;if(s==="channelsLast")[o,l,d,c,h]=e;else if(s==="channelsFirst")[o,h,l,d,c]=e;else throw new Error(`Unknown dataFormat ${s}`);let[f,,g,m,b]=t,[x,$,w]=zi(r),[S,v,E]=zi(n),z=Sr(g,S),M=Sr(m,v),k=Sr(b,E),{padInfo:B,outDepth:U,outHeight:G,outWidth:V}=Rl(i,l,d,c,x,$,w,z,M,k),Z=a?f*h:f,O=[0,0,0,0,0];return s==="channelsFirst"?O=[o,Z,U,G,V]:s==="channelsLast"&&(O=[o,U,G,V,Z]),{batchSize:o,dataFormat:s,inDepth:l,inHeight:d,inWidth:c,inChannels:h,outDepth:U,outHeight:G,outWidth:V,outChannels:Z,padInfo:B,strideDepth:x,strideHeight:$,strideWidth:w,filterDepth:g,filterHeight:m,filterWidth:b,effectiveFilterDepth:z,effectiveFilterHeight:M,effectiveFilterWidth:k,dilationDepth:S,dilationHeight:v,dilationWidth:E,inShape:e,outShape:O,filterShape:t}},zf=(e,t,r,n,i,a)=>{let s=a==="channelsLast";s?e[0].dims[3]:e[0].dims[1];let o=[64,1,1],l={x:r.map((x,$)=>$)},d=[Math.ceil(Nl(l.x.map(x=>r[x]))/o[0]),1,1];ye("verbose",()=>`[conv3d_naive_webgpu] dispatch = ${d}`);let c=1,h=D.size(r),f=[{type:12,data:h},{type:12,data:n},{type:12,data:i},{type:12,data:t.strides},{type:12,data:t.dilations}];tr(t,f),f.push(...oe(e[0].dims,e[1].dims));let g=["rank","rank"],m=e.length===3;m&&(f.push(...oe(e[2].dims)),g.push("rank")),f.push(...oe(r));let b=x=>{let $=[{name:"output_size",type:"u32"},{name:"filter_dims",type:"u32",length:n.length},{name:"pads",type:"u32",length:i.length},{name:"strides",type:"u32",length:t.strides.length},{name:"dilations",type:"u32",length:t.dilations.length}];rr(t,$);let w=1,S=De(e[0].dataType),v=W("x",e[0].dataType,e[0].dims.length,c),E=W("W",e[1].dataType,e[1].dims.length,w),z=[v,E],M=ne("result",e[0].dataType,r.length,w),k="";if(m){let G=W("bias",e[2].dataType,e[2].dims.length,w);z.push(G),k+=`
        fn getBiasByOutputCoords(coords : array<u32, 5>) -> ${S} {
          return bias[${s?ae("coords",4,5):ae("coords",1,5)}];
        }`}let B=Le(c,S),U=er(t,B,S);return`
            ${k}
            fn getX(d0 : u32, d1 : u32, d2 : u32, d3 : u32, d4 : u32) -> f32 {
              let aIndices = array<u32, 5>(d0, d1, d2, d3, d4);
              return ${v.getByIndices("aIndices")};
            }
            fn getW(d0 : u32, d1 : u32, d2 : u32, d3 : u32, d4 : u32) -> f32 {
              let aIndices = array<u32, 5>(d0, d1, d2, d3, d4);
              return ${E.getByIndices("aIndices")};
            }
          ${x.registerUniforms($).declareVariables(...z,M)}
          ${x.mainStart()}
          ${x.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
              let coords = ${M.offsetToIndices("global_idx")};
              let batch = ${ae("coords",0,v.rank)};
              let d2 = ${s?ae("coords",v.rank-1,v.rank):ae("coords",1,v.rank)};
              let xFRCCorner = vec3<u32>(${s?ae("coords",1,v.rank):ae("coords",2,v.rank)},
              ${s?ae("coords",2,v.rank):ae("coords",3,v.rank)},
              ${s?ae("coords",3,v.rank):ae("coords",4,v.rank)}) * uniforms.strides - uniforms.pads;
              let xFCorner = xFRCCorner.x;
              let xRCorner = xFRCCorner.y;
              let xCCorner = xFRCCorner.z;
              let xShapeY = ${s?ae("uniforms.x_shape",1,v.rank):ae("uniforms.x_shape",2,v.rank)};
              let xShapeZ = ${s?ae("uniforms.x_shape",2,v.rank):ae("uniforms.x_shape",3,v.rank)};
              let xShapeW = ${s?ae("uniforms.x_shape",3,v.rank):ae("uniforms.x_shape",4,v.rank)};
              let xShapeU = ${s?ae("uniforms.x_shape",4,v.rank):ae("uniforms.x_shape",1,v.rank)};
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
              ${U}
              result[global_idx] = f32(value);
          }`};return{name:"Conv3DNaive",shaderCache:{hint:`${t.cacheKey};${s};${c};${m}`,inputDependencies:g},getRunData:()=>({outputs:[{dims:r,dataType:e[0].dataType}],dispatchGroup:{x:d[0],y:d[1],z:d[2]},programUniforms:f}),getShaderSource:b}}}),Af,Mf,Eb=X(()=>{ue(),le(),de(),ir(),Af=(e,t,r,n)=>{let i=e.length>2,a=i?"value += b[output_channel];":"",s=e[0].dims,o=e[1].dims,l=t.format==="NHWC",d=l?r[3]:r[1],c=d/t.group,h=l&&c>=4?Ne(d):1,f=D.size(r)/h,g=[{type:12,data:f},{type:12,data:t.dilations},{type:12,data:[t.strides[0],t.strides[1]]},{type:12,data:[t.pads[0],t.pads[1]]},{type:12,data:c}];tr(t,g),g.push(...oe(s,[o[0],o[1],o[2],o[3]/h]));let m=i?["rank","rank","rank"]:["rank","rank"];g.push(...oe([r[0],r[1],r[2],r[3]/h]));let b=x=>{let $=ne("output",e[0].dataType,r.length,h),w=De($.type.tensor),S=er(t,$.type.value,w),v=W("x",e[0].dataType,s.length),E=W("w",e[1].dataType,o.length,h),z=[v,E];i&&z.push(W("b",e[2].dataType,e[2].dims,h));let M=[{name:"output_size",type:"u32"},{name:"dilations",type:"u32",length:t.dilations.length},{name:"strides",type:"u32",length:2},{name:"pads",type:"u32",length:2},{name:"output_channels_per_group",type:"u32"}];rr(t,M);let k=l?`
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
            let wVal = ${E.get("wHeight","wWidth","wInChannel","output_channel")};
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
            let wVal = ${E.get("output_channel","wInChannel","wHeight","wWidth")};
            value += xVal * wVal;
          }
        }
      }
      `;return`
  ${x.registerUniforms(M).declareVariables(...z,$)}

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
  }`};return{name:"GroupedConv",shaderCache:{hint:`${t.cacheKey}_${h}`,inputDependencies:m},getRunData:()=>({outputs:[{dims:n?n(r):r,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(f/64)},programUniforms:g}),getShaderSource:b}},Mf=(e,t,r,n)=>{let i=e.length>2,a=Ne(r[3]),s=Ne(r[2]),o=D.size(r)/a/s,l=[e[0].dims[0],e[0].dims[1],e[0].dims[2],e[0].dims[3]/a],d=[e[1].dims[0],e[1].dims[1],e[1].dims[2],e[1].dims[3]/a],c=[r[0],r[1],r[2],r[3]/a],h=[{type:12,data:o},{type:6,data:[t.strides[0],t.strides[1]]},{type:6,data:[t.pads[0],t.pads[1]]}];tr(t,h),h.push(...oe(l,d,c));let f=(s-1)*t.strides[1]+d[1],g=m=>{let b=ne("output",e[0].dataType,c.length,a),x=De(b.type.tensor),$=er(t,b.type.value,x),w=W("x",e[0].dataType,l.length,a),S=W("w",e[1].dataType,d.length,a),v=[w,S];i&&v.push(W("b",e[2].dataType,e[2].dims,a));let E=i?"value += b[output_channel];":"",z=[{name:"output_size",type:"u32"},{name:"strides",type:"i32",length:2},{name:"pads",type:"i32",length:2}];return rr(t,z),`
  ${m.registerUniforms(z).declareVariables(...v,b)}
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
      ${E}
      ${$}
      ${b.set("batch","row","col + i","output_channel","value")};
    }
  }`};return{name:"GroupedConv-Vectorize",shaderCache:{hint:`${t.cacheKey};${a};${s};${f};${d[0]};${d[1]}`,inputDependencies:i?["rank","rank","type"]:["rank","rank"]},getRunData:()=>({outputs:[{dims:n?n(r):r,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(o/64)},programUniforms:h}),getShaderSource:g}}}),Bl,ln,Dl,dn,Ta,Mi,Pl,Ll,Ea,Ib=X(()=>{le(),kb(),Tb(),ts(),Eb(),ir(),es(),Bt(),Bl=(e,t,r,n,i,a)=>{let s=e[0],o=e.slice(a?1:2,a?3:4),l=o.length,d=t[0],c=t.slice(2).map((f,g)=>f+(f-1)*(r[g]-1)),h=o.map((f,g)=>f+n[g]+n[g+l]).map((f,g)=>Math.floor((f-c[g]+i[g])/i[g]));return h.splice(0,0,s),h.splice(a?3:1,0,d),h},ln=[2,3,1,0],Dl=(e,t)=>{if(!e||e.length!==2&&e.length!==3)throw new Error("Conv requires 2 or 3 inputs");if(e[0].dims.length>5)throw new Error("greater than 5D is not supported");if(e[0].dims.length!==e[1].dims.length)throw new Error("filter does not have same dimension as input");let r=e[0].dims[t.format==="NHWC"?e[0].dims.length-1:1],n=e[1].dims[1]*t.group;if(r!==n)throw new Error("FILTER_IN_CHANNEL should be equal to DATA_CHANNEL");if(e.length===3&&(e[2].dims.length!==1||e[1].dims[0]!==e[2].dims[0]))throw new Error("invalid bias");let i=e[0].dims.length-2;if(t.dilations.length!==i)throw new Error(`dilations should be ${i}D`);if(t.strides.length!==i)throw new Error(`strides should be ${i}D`);if(t.pads.length!==i*2)throw new Error(`pads should be ${i*2}D`);if(t.kernelShape.length!==0&&t.kernelShape.length!==e[1].dims.length-2)throw new Error("invalid kernel shape")},dn=(e,t)=>{let r=e.kernelShape.slice();r.length<t[1].dims.length-2&&r.push(...Array(t[1].dims.length-2-r.length).fill(0));for(let a=2;a<t[1].dims.length;++a)r[a-2]===0&&(r[a-2]=t[1].dims[a]);let n=e.pads.slice();In.adjustPadsBasedOnAutoPad(t[0].dims,e.strides,e.dilations,r,n,e.format==="NHWC",e.autoPad);let i=Object.assign({},e);return Object.assign(i,{kernelShape:r,pads:n}),i},Ta=e=>{let t=Ya(e),r=e.format,n=["NOTSET","VALID","SAME_UPPER","SAME_LOWER"][e.auto_pad],i=e.dilations,a=e.group,s=e.kernel_shape,o=e.pads,l=e.strides,d=e.w_is_const();return{autoPad:n,format:r,dilations:i,group:a,kernelShape:s,pads:o,strides:l,wIsConst:d,...t,cacheKey:`${e.format};${t.activation};`}},Mi=(e,t,r,n)=>{let i=r.format==="NHWC",a=Bl(t[0].dims,t[1].dims,r.dilations,r.pads,r.strides,i);if(r.group!==1){let z=[t[0]];if(i){let M=e.kernelCustomData.wT??e.compute(Xe(t[1],ln),{inputs:[1],outputs:[r.wIsConst?-2:-1]})[0];r.wIsConst&&!e.kernelCustomData.wT&&(e.kernelCustomData.wT=M),z.push(M)}else z.push(t[1]);t.length===3&&z.push(t[2]),!e.adapterInfo.isArchitecture("ampere")&&i&&t[1].dims[0]===r.group&&t[1].dims[1]===1&&r.dilations[0]===1&&r.dilations[1]===1?e.compute(Mf(z,r,a,n),{inputs:z}):e.compute(Af(z,r,a,n),{inputs:z});return}let s=t.length===3,o=t[0].dims[i?1:2],l=t[0].dims[i?2:3],d=t[0].dims[i?3:1],c=t[1].dims[2],h=t[1].dims[3],f=a[i?1:2],g=a[i?2:3],m=a[i?3:1],b=i&&c===o&&h===l&&r.pads[0]===0&&r.pads[1]===0;if(b||c===1&&h===1&&r.dilations[0]===1&&r.dilations[1]===1&&r.strides[0]===1&&r.strides[1]===1&&r.pads[0]===0&&r.pads[1]===0){let z=a[0],M,k,B,U=[];if(i){let Z=e.kernelCustomData.wT??e.compute(Xe(t[1],ln),{inputs:[1],outputs:[r.wIsConst?-2:-1]})[0];if(r.wIsConst&&!e.kernelCustomData.wT&&(e.kernelCustomData.wT=Z),b){let O=o*l*d;M=t[0].reshape([1,z,O]),k=Z.reshape([1,O,m]),B=[1,z,m]}else M=t[0].reshape([z,o*l,d]),k=Z.reshape([1,d,m]),B=[z,f*g,m];U.push(M),U.push(k)}else M=t[0].reshape([z,d,o*l]),k=t[1].reshape([1,m,d]),B=[z,m,f*g],U.push(k),U.push(M);s&&U.push(t[2]);let G=B[2],V=U[0].dims[U[0].dims.length-1];G<8&&V<8?e.compute(Ja(U,r,a,B,i,n),{inputs:U}):e.compute(zn(U,r,a,B,i,n),{inputs:U});return}let x=!0,$=e.kernelCustomData.wT??e.compute(Xe(t[1],ln),{inputs:[1],outputs:[r.wIsConst?-2:-1]})[0];r.wIsConst&&!e.kernelCustomData.wT&&(e.kernelCustomData.wT=$);let w=[t[0],$];s&&w.push(t[2]);let S=i?f*g:m,v=i?m:f*g,E=c*h*d;e.compute(If(w,r,a,S,v,E,s,x,n),{inputs:w})},Pl=(e,t)=>{let r=t.format==="NHWC",n=[e.inputs[0].reshape(r?[e.inputs[0].dims[0],1,e.inputs[0].dims[1],e.inputs[0].dims[2]]:[e.inputs[0].dims[0],e.inputs[0].dims[1],1,e.inputs[0].dims[2]]),e.inputs[1].reshape([e.inputs[1].dims[0],e.inputs[1].dims[1],1,e.inputs[1].dims[2]])];e.inputs.length===3&&n.push(e.inputs[2]);let i=[0,t.pads[0],0,t.pads[1]],a=[1].concat(t.strides),s=[1].concat(t.dilations),o=[1].concat(t.kernelShape),l=dn({...t,pads:i,strides:a,dilations:s,kernelShape:o},n);Mi(e,n,l,d=>r?[d[0],d[2],d[3]]:[d[0],d[1],d[3]])},Ll=(e,t,r)=>{let n=r.format==="NHWC"?"channelsLast":"channelsFirst",i=dn(r,t),a=r.autoPad==="NOTSET"?r.pads:r.autoPad,s=Cf(t[0].dims,t[1].dims,r.strides,r.dilations,a,!1,n);e.compute(zf(t,i,s.outShape,[s.filterDepth,s.filterHeight,s.filterWidth],[s.padInfo.front,s.padInfo.top,s.padInfo.left],n))},Ea=(e,t)=>{if(Dl(e.inputs,t),e.inputs[0].dims.length===3)Pl(e,t);else if(e.inputs[0].dims.length===5)Ll(e,e.inputs,t);else{let r=dn(t,e.inputs);Mi(e,e.inputs,r)}}}),Nf,Cb=X(()=>{ue(),xt(),le(),de(),Nf=(e,t,r)=>{let n=e.length>2,i=t.outputShape,a=t.format==="NHWC",s=t.group,o=e[1].dims,l=o[2]/s,d=o[3],c=a?Ne(l):1,h=a&&d===1&&l>=4,f=h?Math.floor(l/4)*4:Math.floor(l/c)*c,g=l-f,m=a?Ne(d):1,b=a?d===1?c:m:1,x=D.size(i)/m,$=[Math.ceil(x/64),1,1];ye("verbose",()=>`[conv2d_backprop_webgpu] dispatch = ${$}`);let w=["rank","rank"],S=[t.strides[0],t.strides[1]],v=[t.kernelShape[a?1:2],t.kernelShape[a?2:3]],E=[t.dilations[0],t.dilations[1]],z=[v[0]+(t.dilations[0]<=1?0:(t.kernelShape[a?1:2]-1)*(t.dilations[0]-1)),v[1]+(t.dilations[1]<=1?0:(t.kernelShape[a?2:3]-1)*(t.dilations[1]-1))],M=[z[0]-1-Math.floor((t.pads[0]+t.pads[2])/2),z[1]-1-Math.floor((t.pads[1]+t.pads[3])/2)],k=[{type:12,data:x},{type:12,data:S},{type:12,data:v},{type:12,data:E},{type:12,data:z},{type:6,data:M},{type:12,data:f},{type:12,data:l},{type:12,data:d},...oe(e[0].dims,e[1].dims)];n&&(k.push(...oe(e[2].dims)),w.push("rank")),k.push(...oe(i));let B=U=>{let G=[{name:"output_size",type:"u32"},{name:"strides",type:"u32",length:S.length},{name:"filter_dims",type:"u32",length:v.length},{name:"dilations",type:"u32",length:v.length},{name:"effective_filter_dims",type:"u32",length:z.length},{name:"pads",type:"i32",length:M.length},{name:"input_channels_per_group_int",type:"u32"},{name:"input_channels_per_group",type:"u32"},{name:"output_channels_per_group",type:"u32"}],V=De(e[0].dataType),Z=a?1:2,O=a?2:3,P=a?3:1,H=W("W",e[1].dataType,e[1].dims.length,b),Y=W("Dy",e[0].dataType,e[0].dims.length,c),j=[Y,H];n&&j.push(W("bias",e[2].dataType,[i[P]].length,m));let K=ne("result",e[0].dataType,i.length,m),J=()=>{let C="";if(h)c===4?C+=`
        let xValue = ${Y.getByOffset("x_offset")};
        let wValue = ${H.getByOffset("w_offset")};
        dotProd = dotProd + dot(xValue, wValue);
        x_offset += 1u;
        w_offset += 1u;`:c===2?C+=`
          dotProd = dotProd + dot(vec4<${V}>(${Y.getByOffset("x_offset")}, ${Y.getByOffset("x_offset + 1u")}), vec4<${V}>(${H.getByOffset("w_offset")}, ${H.getByOffset("w_offset + 1u")}));
          x_offset += 2u;
          w_offset += 2u;`:c===1&&(C+=`
          dotProd = dotProd + dot(vec4<${V}>(${Y.getByOffset("x_offset")}, ${Y.getByOffset("x_offset + 1u")}, ${Y.getByOffset("x_offset + 2u")}, ${Y.getByOffset("x_offset + 3u")}), vec4<${V}>(${H.getByOffset("w_offset")}, ${H.getByOffset("w_offset + 1u")}, ${H.getByOffset("w_offset + 2u")}, ${H.getByOffset("w_offset + 3u")}));
          x_offset += 4u;
          w_offset += 4u;`);else if(C+=`
                  let xValue = ${a?Y.getByOffset(`${Y.indicesToOffset(`${Y.type.indices}(batch, idyR, idyC, inputChannel)`)} / ${c}`):Y.get("batch","inputChannel","idyR","idyC")};
        `,c===1)C+=`
          let w_offset = ${H.indicesToOffset(`${H.type.indices}(u32(wRPerm), u32(wCPerm), inputChannel, wOutChannel)`)};
          let wValue = ${H.getByOffset(`w_offset / ${b}`)};
          dotProd = dotProd + xValue * wValue;`;else for(let R=0;R<c;R++)C+=`
            let wValue${R} = ${H.getByOffset(`${H.indicesToOffset(`${H.type.indices}(u32(wRPerm), u32(wCPerm), inputChannel + ${R}, wOutChannel)`)} / ${b}`)};
            dotProd = dotProd + xValue[${R}] * wValue${R};`;return C},L=()=>{if(g===0)return"";if(!h)throw new Error(`packInputAs4 ${h} is not true.`);let C="";if(c===1){C+="dotProd = dotProd";for(let R=0;R<g;R++)C+=`
            + ${Y.getByOffset(`x_offset + ${R}`)} * ${H.getByOffset(`w_offset + ${R}`)}`;C+=";"}else if(c===2){if(g!==2)throw new Error(`Invalid inputChannelsRemainder ${g}.`);C+=`
          let xValue = ${Y.getByOffset("x_offset")};
          let wValue = ${H.getByOffset("w_offset")};
          dotProd = dotProd + dot(xValue, wValue);`}return C},re=`
            let outputIndices = ${K.offsetToIndices(`global_idx * ${m}`)};
            let batch = ${K.indicesGet("outputIndices",0)};
            let d1 = ${K.indicesGet("outputIndices",P)};
            let r = ${K.indicesGet("outputIndices",Z)};
            let c = ${K.indicesGet("outputIndices",O)};
            let dyCorner = vec2<i32>(i32(r), i32(c)) - uniforms.pads;
            let dyRCorner = dyCorner.x;
            let dyCCorner = dyCorner.y;
            let groupId = d1 / uniforms.output_channels_per_group;
            let wOutChannel = d1 - groupId * uniforms.output_channels_per_group;
            // Convolve dy(?, ?, d2) with w(:, :, d1, d2) to compute dx(xR, xC, d1).
            // ? = to be determined. : = across all values in that axis.
            var dotProd = ${K.type.value}(0.0);
            var wR: u32 = 0;
            if (uniforms.dilations.x == 1) {
              // Minimum wR >= 0 that satisfies (dyRCorner + wR) % (uniforms.strides.x) == 0
              wR = u32(((dyRCorner + i32(uniforms.strides.x) - 1) / i32(uniforms.strides.x)) * i32(uniforms.strides.x) - dyRCorner);
            }
            for (; wR < uniforms.effective_filter_dims.x; wR = wR + 1) {
              if (wR % uniforms.dilations.x != 0) {
                continue;
              }
              let dyR = (${V}(dyRCorner) + ${V}(wR)) / ${V}(uniforms.strides[0]);
              let wRPerm = uniforms.filter_dims.x - 1 - wR / uniforms.dilations.x;
              if (dyR < 0.0 || dyR >= ${V}(uniforms.Dy_shape[${Z}]) || fract(dyR) > 0.0 ||
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
                let dyC = (${V}(dyCCorner) + ${V}(wC)) / ${V}(uniforms.strides.y);
                let wCPerm = uniforms.filter_dims.y - 1 - wC / uniforms.dilations.y;
                if (dyC < 0.0 || dyC >= ${V}(uniforms.Dy_shape[${O}]) ||
                    fract(dyC) > 0.0 || wCPerm < 0) {
                  continue;
                }
                let idyC: u32 = u32(dyC);
                var inputChannel = groupId * uniforms.input_channels_per_group;
                ${h?`
                var x_offset = ${Y.indicesToOffset(`${Y.type.indices}(batch, idyR, idyC, inputChannel)`)} / ${c};
                var w_offset = ${H.indicesToOffset(`${H.type.indices}(wRPerm, wCPerm, inputChannel, wOutChannel)`)} / ${b};
                  `:""}
                for (var d2: u32 = 0; d2 < uniforms.input_channels_per_group_int; d2 = d2 + ${h?4:c}) {
                  ${J()}
                  inputChannel = inputChannel + ${h?4:c};
                }
                ${L()}
                wC = wC + uniforms.strides.y - 1;
              }
              wR = wR + uniforms.strides[0] - 1;
            }
            let value = dotProd${n?` + bias[d1 / ${m}]`:""};
            ${K.setByOffset("global_idx","value")};
          `;return`
    ${U.registerUniforms(G).declareVariables(...j,K)}
      ${U.mainStart()}
      ${U.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")};
    ${re}}`};return{name:"ConvTranspose2D",shaderCache:{hint:`${t.cacheKey};${c}${b}${m}${h}${g}`,inputDependencies:w},getRunData:()=>({dispatchGroup:{x:$[0],y:$[1],z:$[2]},outputs:[{dims:r?r(i):i,dataType:e[0].dataType}],programUniforms:k}),getShaderSource:B}}}),Ul,jl,ql,Ni,Of,Wl,Oi,Fl,Rf,zb=X(()=>{Cb(),ir(),Bt(),Ul=(e,t,r,n,i,a)=>(e-1)*t+r+(n-1)*i+1-a,jl=(e,t,r,n,i)=>{let a=Math.floor(e/2);t==="SAME_UPPER"?(r[n]=a,r[i]=e-a):t==="SAME_LOWER"&&(r[n]=e-a,r[i]=a)},ql=(e,t,r,n,i,a,s,o,l,d)=>{let c=e.length-2,h=d.length===0;l.length<c&&l.push(...Array(c-l.length).fill(0));let f=e[0],g=t[o?3:1]*i;for(let m=0,b=e.length-c-(o?1:0);m<c;++m,++b){let x=e[b],$=h?x*s[m]:d[m],w=Ul(x,s[m],a[m],t[b],r[m],$);jl(w,n,a,m,m+c),h&&d.push(s[m]*(x-1)+l[m]+(t[b]-1)*r[m]+1-a[m]-a[m+c])}d.splice(0,0,f),d.splice(o?3:1,0,g)},Ni=(e,t)=>{let r=e.kernelShape.slice();if(e.kernelShape.length===0||e.kernelShape.reduce((h,f)=>h*f,1)===0){r.length=0;for(let h=2;h<t[1].dims.length;++h)r.push(t[1].dims[h])}let n=e.format==="NHWC";r.splice(0,0,t[1].dims[0]),r.splice(n?3:1,0,t[1].dims[1]);let i=e.pads.slice(),a=e.outputShape.slice(),s=e.outputPadding.slice(),o=t[0].dims,l=e.dilations.slice();if(l.reduce((h,f)=>h+f,0)===0){let h=t[0].dims.length-2;l=new Array(h).fill(1)}let d=e.strides.slice();if(d.reduce((h,f)=>h+f,0)===0){let h=t[0].dims.length-2;d=new Array(h).fill(1)}ql(o,r,l,e.autoPad,e.group,i,d,n,s,a);let c=Object.assign({},e);return Object.assign(c,{kernelShape:r,pads:i,outputPadding:s,outputShape:a,dilations:l,strides:d}),c},Of=e=>{let t=Ya(e),r=e.format,n=["NOTSET","VALID","SAME_UPPER","SAME_LOWER"][typeof e.autoPad>"u"?0:e.autoPad],i=e.dilations,a=e.group??1,s=e.kernelShape,o=e.pads,l=e.strides,d=e.wIsConst(),c=e.outputPadding,h=e.outputShape;return{autoPad:n,format:r,dilations:i,group:a,kernelShape:s,outputPadding:c,outputShape:h,pads:o,strides:l,wIsConst:d,...t,cacheKey:`${e.format};${t.activation};`}},Wl=(e,t)=>{if(!e||e.length!==2&&e.length!==3)throw new Error("Conv requires 2 or 3 inputs");if(e[0].dims.length!==4&&e[0].dims.length!==3)throw new Error("currently only support 2-dimensional conv");if(e[0].dims.length!==e[1].dims.length)throw new Error("filter does not have same dimension as input");let r=e[0].dims[t.format==="NHWC"?e[0].dims.length-1:1],n=e[1].dims[0];if(r!==n)throw new Error("FILTER_IN_CHANNEL should be equal to DATA_CHANNEL");let i=e[1].dims[1]*t.group;if(e.length===3&&(e[2].dims.length!==1||e[2].dims[0]!==i))throw new Error("invalid bias");let a=e[0].dims.length-2;if(t.dilations.reduce((s,o)=>s+o,0)>0&&t.dilations.length!==a)throw new Error(`dilations should be ${a}D`);if(t.strides.reduce((s,o)=>s+o,0)>0&&t.strides.length!==a)throw new Error(`strides should be ${a}D`);if(t.pads.reduce((s,o)=>s+o,0)>0&&t.pads.length!==a*2)throw new Error(`pads should be ${a*2}D`);if(t.outputPadding.length!==a&&t.outputPadding.length!==0)throw new Error(`output_padding should be ${a}D`);if(t.kernelShape.reduce((s,o)=>s+o,0)>0&&t.kernelShape.length!==0&&t.kernelShape.length!==e[1].dims.length-2)throw new Error("invalid kernel shape");if(t.outputShape.length!==0&&t.outputShape.length!==e[0].dims.length-2)throw new Error("invalid output shape")},Oi=(e,t,r,n)=>{let i=e.kernelCustomData.wT??e.compute(Xe(t[1],[2,3,0,1]),{inputs:[1],outputs:[r.wIsConst?-2:-1]})[0];r.wIsConst&&!e.kernelCustomData.wT&&(e.kernelCustomData.wT=i);let a=[t[0],i];t.length===3&&a.push(t[2]),e.compute(Nf(a,r,n),{inputs:a})},Fl=(e,t)=>{let r=t.format==="NHWC",n=[e.inputs[0].reshape(r?[e.inputs[0].dims[0],1,e.inputs[0].dims[1],e.inputs[0].dims[2]]:[e.inputs[0].dims[0],e.inputs[0].dims[1],1,e.inputs[0].dims[2]]),e.inputs[1].reshape([e.inputs[1].dims[0],e.inputs[1].dims[1],1,e.inputs[1].dims[2]])];e.inputs.length===3&&n.push(e.inputs[2]);let i=t.kernelShape;(i.length===0||i[0]===0)&&(i=[e.inputs[1].dims[2]]);let a=t.dilations;(a.length===0||a[0]===0)&&(a=[1]);let s=t.strides;(s.length===0||s[0]===0)&&(s=[1]);let o=t.pads;o.length===0&&(o=[0,0]),o=[0,o[0],0,o[1]],s=[1].concat(s),a=[1].concat(a),i=[1].concat(i);let l=t.outputPadding;l=[0].concat(l);let d=Ni({...t,pads:o,strides:s,dilations:a,kernelShape:i,outputPadding:l},n);Oi(e,n,d,c=>r?[c[0],c[2],c[3]]:[c[0],c[1],c[3]])},Rf=(e,t)=>{if(Wl(e.inputs,t),e.inputs[0].dims.length===3)Fl(e,t);else{let r=Ni(t,e.inputs);Oi(e,e.inputs,r)}}}),Gl,Bf,Df,Ab=X(()=>{ue(),le(),Oe(),de(),Gl=(e,t,r,n)=>{let i=D.size(t),a=t.length,s=W("input",e,a),o=ne("output",e,a),l=r.dataType===6?r.getInt32Array()[0]:Number(r.getBigInt64Array()[0]),d=D.normalizeAxis(l,a),c=h=>{let f=` i32(${s.indicesGet("inputIndices","uniforms.axis")}) `,g=ae("uniforms.input_shape","uniforms.axis",a),m=n.reverse?f+(n.exclusive?" + 1":""):"0",b=n.reverse?g:f+(n.exclusive?"":" + 1");return`
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
                }`};return{name:"CumSum",shaderCache:{hint:n.cacheKey,inputDependencies:["rank"]},getRunData:()=>({outputs:[{dims:t,dataType:e}],dispatchGroup:{x:Math.ceil(i/64)},programUniforms:[{type:12,data:i},{type:12,data:d},...oe(t,t)]}),getShaderSource:c}},Bf=(e,t)=>{let r=e.inputs[0].dims,n=e.inputs[0].dataType,i=e.inputs[1];e.compute(Gl(n,r,i,t),{inputs:[0]})},Df=e=>{let t=e.exclusive===1,r=e.reverse===1;return we({exclusive:t,reverse:r})}}),Vl,Hl,Kl,Pf,Lf,Mb=X(()=>{ue(),le(),Oe(),de(),Vl=e=>{if(!e||e.length!==1)throw new Error("DepthToSpace requires 1 input.");if(e[0].dims.length!==4)throw new Error("DepthToSpace requires 4D input.")},Hl=(e,t,r,n)=>{let i=[];i.push(`fn perm(i: ${n.type.indices}) -> ${r.type.indices} {
    var a: ${r.type.indices};`);for(let a=0;a<t;++a)i.push(r.indicesSet("a",e[a],`i[${a}]`));return i.push("return a;}"),i.join(`
`)},Kl=(e,t)=>{let r,n,i,a,s,o,l=t.format==="NHWC",d=t.blocksize,c=t.mode==="DCR";l?([r,n,i,a]=e.dims,s=c?[r,n,i,d,d,a/d**2]:[r,n,i,a/d**2,d,d],o=c?[0,1,3,2,4,5]:[0,1,4,2,5,3]):([r,n,i,a]=[e.dims[0],e.dims[2],e.dims[3],e.dims[1]],s=c?[r,d,d,a/d**2,n,i]:[r,a/d**2,d,d,n,i],o=c?[0,3,4,1,5,2]:[0,1,4,2,5,3]);let h=e.reshape(s),f=h.dims.length,g=e.dataType,m=W("a",g,f),b=ne("output",g,f),x=$=>`
  ${$.registerUniform("output_size","u32").declareVariables(m,b)}

  ${Hl(o,f,m,b)}

  ${$.mainStart()}
    ${$.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}

    let indices = ${b.offsetToIndices("global_idx")};
    let aIndices = perm(indices);

    ${b.setByOffset("global_idx",m.getByIndices("aIndices"))}
  }`;return{name:"DepthToSpace",shaderCache:{hint:`${e.dims};${t.blocksize};${t.mode}`,inputDependencies:["rank"]},getRunData:$=>{let w=l?[r,n*d,i*d,a/d**2]:[r,a/d**2,n*d,i*d],S=D.size(w),v=h.dims,E=D.sortBasedOnPerm(v,o);return{outputs:[{dims:w,dataType:$[0].dataType}],dispatchGroup:{x:Math.ceil(S/64)},programUniforms:[{type:12,data:S},...oe(v,E)]}},getShaderSource:x}},Pf=(e,t)=>{Vl(e.inputs),e.compute(Kl(e.inputs[0],t))},Lf=e=>we({blocksize:e.blocksize,mode:e.mode,format:e.format})}),cn,kr,Ri,Xl,Zl,Yl,Ql,Bi,Jl,Uf,jf,Nb=X(()=>{ue(),le(),Oe(),de(),cn="[a-zA-Z]|\\.\\.\\.",kr="("+cn+")+",Ri="^"+kr+"$",Xl="("+kr+",)*"+kr,Zl="^"+Xl+"$",Yl=class{constructor(e=-1){this.symbolToIndices=new Map,this.inputIndex=e}addSymbol(e,t){let r=this.symbolToIndices.get(e);r===void 0?r=[t]:r.push(t),this.symbolToIndices.set(e,r)}},Ql=class{constructor(e,t){this.equation=t,this.hasEllipsis=!1,this.symbolToInfo=new Map,this.lhs=new Array,this.outputDims=[];let[r,n]=t.includes("->")?t.split("->",2):[t,""];if(!r.match(RegExp(Zl)))throw new Error("Invalid LHS term");if(r.split(",").forEach((i,a)=>{let s=e[a].dims.slice();if(!i.match(RegExp(Ri)))throw new Error("Invalid LHS term");let o=this.processTerm(i,!0,s,a);this.lhs.push(o)}),n==="")n+=[...this.symbolToInfo.entries()].filter(([i,a])=>a.count===1||i==="...").map(([i])=>i).join("");else if(!n.match(RegExp(kr)))throw new Error("Invalid RHS");n.match(RegExp(cn,"g"))?.forEach(i=>{if(i==="...")this.outputDims=this.outputDims.concat(this.ellipsisDims);else{let a=this.symbolToInfo.get(i);if(a===void 0)throw new Error("Invalid RHS symbol");this.outputDims.push(a.dimValue)}}),this.rhs=this.processTerm(n,!1,this.outputDims)}addSymbol(e,t,r){let n=this.symbolToInfo.get(e);if(n!==void 0){if(n.dimValue!==t&&n.count!==1)throw new Error("Dimension mismatch");n.count++,n.inputIndices.push(r)}else n={count:1,dimValue:t,inputIndices:[r]};this.symbolToInfo.set(e,n)}processTerm(e,t,r,n=-1){let i=r.length,a=!1,s=[],o=0;if(!e.match(RegExp(Ri))&&!t&&e!=="")throw new Error("Invalid LHS term");let l=e.match(RegExp(cn,"g")),d=new Yl(n);return l?.forEach((c,h)=>{if(c==="..."){if(a)throw new Error("Only one ellipsis is allowed per input term");a=!0;let f=i-l.length+1;if(f<0)throw new Error("Ellipsis out of bounds");if(s=r.slice(o,o+f),this.hasEllipsis){if(this.ellipsisDims.length!==s.length||this.ellipsisDims.toString()!==s.toString())throw new Error("Ellipsis dimensions mismatch")}else if(t)this.hasEllipsis=!0,this.ellipsisDims=s;else throw new Error("Ellipsis must be specified in the LHS");for(let g=0;g<s.length;g++){let m=String.fromCharCode(48+g);d.addSymbol(m,h+g),this.addSymbol(m,r[o++],n)}}else d.addSymbol(c,h+(this.hasEllipsis?this.ellipsisDims.length-1:0)),this.addSymbol(c,r[o++],n)}),d}},Bi=e=>e+"_max",Jl=(e,t,r,n)=>{let i=e.map(d=>d.length).map((d,c)=>W(`input${c}`,t,d)),a=D.size(n),s=ne("output",t,n.length),o=[...r.symbolToInfo.keys()].filter(d=>!r.rhs.symbolToIndices.has(d)),l=d=>{let c=[],h="var prod = 1.0;",f="var sum = 0.0;",g="sum += prod;",m=[],b=[],x=[],$=[],w=r.symbolToInfo.size===r.rhs.symbolToIndices.size;r.symbolToInfo.forEach((v,E)=>{if(r.rhs.symbolToIndices.has(E)){let z=r.rhs.symbolToIndices.get(E)?.[0];z!==void 0&&r.lhs.forEach((M,k)=>{if(v.inputIndices.includes(k)){let B=M.symbolToIndices.get(E);if(B===void 0)throw new Error("Invalid symbol error");B.forEach(U=>{c.push(`${i[k].indicesSet(`input${k}Indices`,U,s.indicesGet("outputIndices",z))}`)})}})}else r.lhs.forEach((z,M)=>{if(v.inputIndices.includes(M)){let k=z.symbolToIndices.get(E);if(k===void 0)throw new Error("Invalid symbol error");k.forEach(B=>{m.push(`${i[M].indicesSet(`input${M}Indices`,B,`${E}`)}`)}),$.push(`prod *= ${i[M].getByIndices(`input${M}Indices`)};`)}}),b.push(`for(var ${E}: u32 = 0; ${E} < uniforms.${Bi(E)}; ${E}++) {`),x.push("}")});let S=w?[...c,`let sum = ${i.map((v,E)=>v.getByIndices(`input${E}Indices`)).join(" * ")};`]:[...c,f,...b,...m,h,...$,g,...x];return`
            ${d.registerUniforms(o.map(v=>({name:`${Bi(v)}`,type:"u32"}))).registerUniform("outputSize","u32").declareVariables(...i,s)}

            ${d.mainStart()}
            ${d.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}
            var outputIndices = ${s.offsetToIndices("global_idx")};
            ${i.map((v,E)=>`var input${E}Indices: ${i[E].type.indices};`).join(`
`)}
            ${S.join(`
`)};
            ${s.setByOffset("global_idx","sum")};
          }`};return{name:"Einsum",shaderCache:{hint:r.equation,inputDependencies:e.map(()=>"rank")},getRunData:()=>{let d=o.filter(h=>r.symbolToInfo.has(h)).map(h=>({type:12,data:r.symbolToInfo.get(h)?.dimValue||0}));d.push({type:12,data:a});let c=e.map((h,f)=>[...oe(h)]).reduce((h,f)=>h.concat(f),d);return c.push(...oe(n)),{outputs:[{dims:n,dataType:t}],dispatchGroup:{x:Math.ceil(a/64)},programUniforms:c}},getShaderSource:l}},Uf=(e,t)=>{let r=new Ql(e.inputs,t.equation),n=r.outputDims,i=e.inputs.map((a,s)=>a.dims);e.compute(Jl(i,e.inputs[0].dataType,r,n))},jf=e=>{let t=e.equation.replace(/\s+/g,"");return we({equation:t})}}),ed,Di,td,rd,qf,Ob=X(()=>{ue(),le(),de(),ed=e=>{if(!e||e.length!==2)throw new Error("Expand requires 2 input.");let t=e[0].dims,r=Array.from(e[1].getBigInt64Array(),Number),n=r.length<t.length?0:r.length-t.length,i=t.length<r.length?0:t.length-r.length;for(;n<r.length&&i<t.length;++n,++i)if(r[n]!==t[i]&&r[n]!==1&&t[i]!==1)throw new Error("Expand requires shape to be broadcastable to input")},Di=(e,t)=>{let r=e.length-t.length,n=[];for(let i=0;i<r;++i)n.push(e[i]);for(let i=0;i<t.length;++i)n.push(t[i]===1?e[i+r]:t[i]);return n},td=(e,t)=>e.length>t.length?Di(e,t):Di(t,e),rd=e=>{let t=e[0].dims,r=Array.from(e[1].getBigInt64Array(),Number),n=td(t,r),i=e[0].dataType,a=i===9||D.size(t)===1,s=i===9||t.length>0&&t[t.length-1]%4===0?4:1,o=a||n.length>0&&n[n.length-1]%4===0?4:1,l=Math.ceil(D.size(n)/o),d=h=>{let f=W("input",i,t.length,s),g=ne("output",i,n.length,o),m;if(i===9){let b=(x,$,w="")=>`
          let outputIndices${$} = ${g.offsetToIndices(`outputOffset + ${$}u`)};
          let offset${$} = ${f.broadcastedIndicesToOffset(`outputIndices${$}`,g)};
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
    ${m}`},c=[{type:12,data:l},...oe(t,n)];return{name:"Expand",shaderCache:{hint:`${n.length};${s}${o}`,inputDependencies:["rank"]},getShaderSource:d,getRunData:()=>({outputs:[{dims:n,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(l/64)},programUniforms:c})}},qf=e=>{ed(e.inputs),e.compute(rd(e.inputs),{inputs:[0]})}}),nd,Wf,Rb=X(()=>{ue(),le(),de(),Za(),nd=e=>{let t=e[0].dataType,r=D.size(e[0].dims),n=D.size(e[1].dims),i=n%4===0,a=s=>{let o=W("x",t,[1],4),l=W("bias",t,[1],4),d=ne("y",t,[1],4),c=[{name:"output_vec_size",type:"u32"},{name:"bias_size",type:"u32"}],h=g=>`
      let bias${g}_offset: u32 = (global_idx * 4 + ${g}) % uniforms.bias_size;
      let bias${g} = ${l.getByOffset(`bias${g}_offset / 4`)}[bias${g}_offset % 4];`,f=i?`
      let bias = ${l.getByOffset("global_idx % (uniforms.bias_size / 4)")};`:`${h(0)}${h(1)}${h(2)}${h(3)}
      let bias = ${o.type.value}(bias0, bias1, bias2, bias3);`;return`${s.registerUniforms(c).declareVariables(o,l,d)}

    ${va(qe(t))}

    ${s.mainStart(hr)}
      ${s.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_vec_size")}

      let x = ${o.getByOffset("global_idx")};
      ${f}
      let x_in = x + bias;
      ${d.setByOffset("global_idx",xa("x_in"))}
    }`};return{name:"FastGeluWithBias",shaderCache:{hint:`${i}`,inputDependencies:["type","type"]},getShaderSource:a,getRunData:s=>({outputs:[{dims:s[0].dims,dataType:s[0].dataType}],programUniforms:[{type:12,data:Math.ceil(r/4)},{type:12,data:n}],dispatchGroup:{x:Math.ceil(r/hr/4)}})}},Wf=e=>{e.inputs.length<2||D.size(e.inputs[1].dims)===0?lf(e):e.compute(nd(e.inputs))}}),id,ad,Ff,Gf,Bb=X(()=>{ue(),le(),Oe(),de(),id=e=>{if(!e||e.length!==2)throw new Error("Gather requires 2 inputs.")},ad=(e,t)=>{let r=e[0].dims,n=e[1].dims,i=r.length,a=D.normalizeAxis(t.axis,i),s=r.slice(0);s.splice(a,1,...n);let o=r[a],l=e[0].dataType===9?4:1,d=Math.ceil(D.size(s)/l),c=[{type:12,data:d},{type:6,data:o},{type:12,data:a},...oe(e[0].dims,e[1].dims,s)],h=f=>{let g=W("data",e[0].dataType,e[0].dims.length,l),m=W("inputIndices",e[1].dataType,e[1].dims.length),b=ne("output",e[0].dataType,s.length,l),x=w=>{let S=n.length,v=`var indicesIndices${w}  = ${m.type.indices}(0);`;for(let E=0;E<S;E++)v+=`${S>1?`indicesIndices${w}[${E}]`:`indicesIndices${w}`} = ${s.length>1?`outputIndices${w}[uniforms.axis + ${E}]`:`outputIndices${w}`};`;v+=`
          var idx${w} = ${m.getByIndices(`indicesIndices${w}`)};
          if (idx${w} < 0) {
            idx${w} = idx${w} + uniforms.axisDimLimit;
          }
          var dataIndices${w} : ${g.type.indices};
        `;for(let E=0,z=0;E<i;E++)E===a?(v+=`${i>1?`dataIndices${w}[${E}]`:`dataIndices${w}`} = u32(idx${w});`,z+=S):(v+=`${i>1?`dataIndices${w}[${E}]`:`dataIndices${w}`} = ${s.length>1?`outputIndices${w}[${z}]`:`outputIndices${w}`};`,z++);return v},$;if(e[0].dataType===9){let w=(S,v,E="")=>`
          let outputIndices${v} = ${b.offsetToIndices(`outputOffset + ${v}u`)};
          ${x(v)};
          let offset${v} = ${g.indicesToOffset(`dataIndices${v}`)};
          let index${v} = offset${v} / 4u;
          let component${v} = offset${v} % 4u;
          ${S}[${v}] = ${E}(${g.getByOffset(`index${v}`)}[component${v}]);
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
      let value = ${g.getByIndices("dataIndices")};
      ${b.setByOffset("global_idx","value")};
      `;return`
      ${f.registerUniform("outputSize","u32").registerUniform("axisDimLimit","i32").registerUniform("axis","u32").declareVariables(g,m,b)}
      ${f.mainStart()}
        ${f.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}
        ${$}
      }`};return{name:"Gather",shaderCache:{hint:t.cacheKey,inputDependencies:["rank","rank"]},getRunData:()=>({outputs:[{dims:s,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(d/64)},programUniforms:c}),getShaderSource:h}},Ff=e=>we({axis:e.axis}),Gf=(e,t)=>{let r=e.inputs;id(r),e.compute(ad(e.inputs,t))}}),sd,Vf,Hf,Db=X(()=>{ue(),le(),de(),sd=(e,t,r,n,i,a,s,o,l)=>{let d=[{type:12,data:a},{type:12,data:n},{type:12,data:i},{type:12,data:r},{type:12,data:s},{type:12,data:o},{type:12,data:l}],c=[a];d.push(...oe(t.dims,c));let h=f=>{let g=W("indices_data",t.dataType,t.dims.length),m=ne("input_slice_offsets_data",12,1,1),b=[g,m],x=[{name:"output_size",type:"u32"},{name:"batch_dims",type:"u32"},{name:"input_dims",type:"u32",length:i.length},{name:"sizes_from_slice_dims_data",type:"u32",length:r.length},{name:"num_slices_per_batch",type:"u32"},{name:"input_batch_stride",type:"u32"},{name:"num_slice_dims",type:"u32"}];return`
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
        ${i.length===1?"index += i32(uniforms.input_dims);":"index += i32(uniforms.input_dims[input_dim_idx]);"}
      }
      ${r.length===1?"relative_slice_offset += index * i32(uniforms.sizes_from_slice_dims_data);":"relative_slice_offset += index * i32(uniforms.sizes_from_slice_dims_data[dim_idx]);"}
    }

    input_slice_offsets_data[global_idx] =  base_offset + u32(relative_slice_offset);
  }`};return e.compute({name:"computeSliceOffsets",shaderCache:{hint:`${i.length}_${r.length}`,inputDependencies:["rank"]},getRunData:()=>({outputs:[{dims:c,dataType:e.inputs[1].dataType}],dispatchGroup:{x:Math.ceil(a/64)},programUniforms:d}),getShaderSource:h},{inputs:[t],outputs:[-1]})[0]},Vf=(e,t)=>{let r=e.inputs,n=r[0].dims,i=r[0].dataType,a=r[1].dims,s=a[a.length-1],o=D.sizeToDimension(a,a.length-1),l=D.sizeFromDimension(n,t.batchDims+s),d=D.sizeToDimension(n,t.batchDims),c=D.sizeFromDimension(n,t.batchDims),h=o/d,f=new Array(s),g=l;for(let v=0;v<s;++v)f[s-1-v]=g,g*=n[t.batchDims+s-1-v];let m=sd(e,r[1],f,t.batchDims,n,o,h,c,s),b=t.batchDims+s;if(b>n.length)throw new Error("last dimension of indices must not be larger than rank of input tensor");let x=a.slice(0,-1).concat(n.slice(b)),$=D.size(x),w=[{type:12,data:$},{type:12,data:l},...oe(r[0].dims,m.dims,x)],S=v=>{let E=W("data",r[0].dataType,r[0].dims.length),z=W("slice_offsets",12,m.dims.length),M=ne("output",r[0].dataType,x.length);return`
          ${v.registerUniform("output_size","u32").registerUniform("slice_size","u32").declareVariables(E,z,M)}
            ${v.mainStart()}
            ${v.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
          let slice_offset = slice_offsets[global_idx / uniforms.slice_size];
          output[global_idx] = data[u32(slice_offset) + global_idx % uniforms.slice_size];
        }`};e.compute({name:"GatherND",shaderCache:{hint:t.cacheKey,inputDependencies:["rank","rank"]},getRunData:()=>({outputs:[{dims:x,dataType:i}],dispatchGroup:{x:Math.ceil($/64)},programUniforms:w}),getShaderSource:S},{inputs:[r[0],m]})},Hf=e=>({batchDims:e.batch_dims,cacheKey:""})}),od,ud,Kf,Xf,Pb=X(()=>{ue(),le(),Oe(),de(),od=(e,t)=>{if(e.length<3||e.length>4)throw new Error("GatherBlockQuantized requires 3 or 4 inputs.");let r=D.normalizeAxis(t.quantizeAxis,e[0].dims.length),n=t.blockSize,i=e[0],a=e[2],s=e.length===4?e[3]:void 0;if(a.dims.length!==i.dims.length||!i.dims.map((o,l)=>l===r?Math.ceil(o/n)===a.dims[l]:o===a.dims[l]).reduce((o,l)=>o&&l,!0))throw new Error("Scales must have the same rank as the input tensor and the dims should match except on gatherAxis.");if(s){if(s.dataType!==i.dataType)throw new Error("Zero point must have the same data type as the input tensor.");if(s.dims.length!==a.dims.length||!s.dims.map((o,l)=>o===a.dims[l]).reduce((o,l)=>o&&l,!0))throw new Error("Zero point must have the same rank as the input tensor and the dims should match except on quantizeAxis.")}},ud=(e,t)=>{let r=e[0].dims,n=e[1].dims,i=r.length,a=D.normalizeAxis(t.gatherAxis,i),s=D.normalizeAxis(t.quantizeAxis,i),o=r.slice(0);o.splice(a,1,...n);let l=D.size(o),d=e[2].dataType,c=e[0].dataType===22,h=[{type:12,data:l},{type:12,data:s},{type:12,data:a},{type:12,data:t.blockSize},...oe(...e.map((g,m)=>g.dims),o)],f=g=>{let m=W("data",e[0].dataType,e[0].dims.length),b=W("inputIndices",e[1].dataType,e[1].dims.length),x=W("scales",e[2].dataType,e[2].dims.length),$=e.length>3?W("zeroPoint",e[3].dataType,e[3].dims.length):void 0,w=ne("output",d,o.length),S=[m,b,x];$&&S.push($);let v=[{name:"output_size",type:"u32"},{name:"quantize_axis",type:"u32"},{name:"gather_axis",type:"u32"},{name:"block_size",type:"u32"}];return`
        ${g.registerUniforms(v).declareVariables(...S,w)}
        ${g.mainStart()}
        let output_indices = ${w.offsetToIndices("global_idx")};
        var indices_indices = ${b.type.indices}(0);
        ${n.length>1?`
          for (var i: u32 = 0; i < ${n.length}; i++) {
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
          let index = ${w.indicesGet("output_indices",`i + ${n.length} - 1`)};
          ${m.indicesSet("data_indices","i","index")};
        }
        let data_offset = ${m.indicesToOffset("data_indices")};
        let data_index = data_offset % 8;
        // Convert 4-bit packed data to 8-bit packed data.
        let packed_4bit_quantized_data = ${m.getByOffset("data_offset / 8")};
        let packed_8bit_quantized_data = (packed_4bit_quantized_data >> (4 * (data_index % 2))) & 0x0f0f0f0f;
        let quantized_data_vec = ${c?"unpack4xI8":"unpack4xU8"}(u32(packed_8bit_quantized_data));
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
              let zero_point_vec = ${c?"unpack4xI8":"unpack4xU8"}(u32(packed_8bit_zero_points));
              let zero_point = zero_point_vec[zero_point_index / 2];`:"var zero_point = 0"};
        let dequantized_data = ${qe(d)}(quantized_data - zero_point) * scale;
        ${w.setByOffset("global_idx","dequantized_data")};
    }`};return{name:"GatherBlockQuantized",shaderCache:{hint:`${t.cacheKey};${e.filter((g,m)=>m!==1).map(g=>g.dims.join("_")).join(";")}`,inputDependencies:Array.from({length:e.length},(g,m)=>"rank")},getRunData:()=>({outputs:[{dims:o,dataType:d}],dispatchGroup:{x:Math.ceil(l/64)},programUniforms:h}),getShaderSource:f}},Kf=(e,t)=>{let r=e.inputs;od(r,t),e.compute(ud(e.inputs,t))},Xf=e=>we({blockSize:e.blockSize,gatherAxis:e.gatherAxis,quantizeAxis:e.quantizeAxis})}),ld,dd,Zf,Yf,Lb=X(()=>{ue(),le(),Oe(),de(),ld=e=>{if(!e||e.length!==2)throw new Error("GatherElements requires 2 inputs.");if(e[0].dims.length<1)throw new Error("GatherElements requires that the data input be rank >= 1.");if(e[0].dims.length!==e[1].dims.length)throw new Error(`GatherElements requires that the data input and
                     indices input tensors be of same rank.`)},dd=(e,t)=>{let r=e[0].dims,n=e[0].dataType,i=r.length,a=e[1].dims,s=e[1].dataType,o=D.normalizeAxis(t.axis,i),l=r[o],d=a.slice(0),c=D.size(d),h=W("input",n,i),f=W("indicesInput",s,a.length),g=ne("output",n,d.length),m=[{type:12,data:c},{type:6,data:l},{type:12,data:o}];return m.push(...oe(r,a,d)),{name:"GatherElements",shaderCache:{inputDependencies:["rank","rank"]},getRunData:()=>({outputs:[{dims:d,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(c/64)},programUniforms:m}),getShaderSource:b=>`
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
  }`}},Zf=e=>we({axis:e.axis}),Yf=(e,t)=>{let r=e.inputs;ld(r),e.compute(dd(e.inputs,t))}}),cd,pd,Qf,Jf,Ub=X(()=>{ue(),le(),de(),cd=e=>{if(!e)throw new Error("Input is missing");if(e.length<2||e.length>3)throw new Error("Invaid input number.");if(e.length===3&&e[2].dims.length>2)throw new Error("Invalid input shape of C");if(e[0].dataType!==e[1].dataType||e.length===3&&e[0].dataType!==e[2].dataType)throw new Error("Input types are mismatched")},pd=(e,t)=>{let r=e[0].dims.slice(),n=e[1].dims.slice(),[i,a,s]=Xp.getShapeOfGemmResult(r,t.transA,n,t.transB,e.length===3?e[2].dims:void 0),o=[i,a];if(!o)throw new Error("Can't use gemm on the given tensors");let l=16,d=Math.ceil(a/l),c=Math.ceil(i/l),h=!0,f=D.size(o),g=[{type:12,data:h?d:f},{type:12,data:i},{type:12,data:a},{type:12,data:s},{type:1,data:t.alpha},{type:1,data:t.beta}],m=["type","type"];e.length===3&&(g.push(...oe(e[2].dims)),m.push("rank")),g.push(...oe(o));let b=$=>{let w="";t.transA&&t.transB?w="value += a[k * uniforms.M + m] * b[n * uniforms.K + k];":t.transA&&!t.transB?w="value += a[k * uniforms.M + m] * b[k * uniforms.N + n];":!t.transA&&t.transB?w="value += a[m * uniforms.K + k] * b[n * uniforms.K + k];":!t.transA&&!t.transB&&(w="value += a[m * uniforms.K + k] * b[k * uniforms.N + n];");let S=t.alpha===1?"":"value *= uniforms.alpha;",v=W("a",e[0].dataType,e[0].dims),E=W("b",e[1].dataType,e[1].dims),z=v.type.value,M=null,k=[v,E];e.length===3&&(M=W("c",e[2].dataType,e[2].dims.length),k.push(M));let B=ne("output",e[0].dataType,o.length);k.push(B);let U=[{name:"output_size",type:"u32"},{name:"M",type:"u32"},{name:"N",type:"u32"},{name:"K",type:"u32"},{name:"alpha",type:"f32"},{name:"beta",type:"f32"}];return`
  ${$.registerUniforms(U).declareVariables(...k)}

  ${$.mainStart()}
    ${$.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}

    let m = global_idx / uniforms.N;
    let n = global_idx % uniforms.N;

    var value = ${z}(0);
    for (var k: u32 = 0u; k < uniforms.K; k++) {
      ${w}
    }

    ${S}
    ${M!=null?`let cOffset = ${M.broadcastedIndicesToOffset("vec2(m, n)",B)}; value += ${z}(uniforms.beta) * ${M.getByOffset("cOffset")};`:""}
    output[global_idx] = value;
  }`},x=$=>{let w=W("a",e[0].dataType,e[0].dims),S=W("b",e[1].dataType,e[1].dims),v=null,E=[w,S];e.length===3&&(v=W("c",e[2].dataType,e[2].dims.length),E.push(v));let z=ne("output",e[0].dataType,o.length);E.push(z);let M=[{name:"num_tile_n",type:"u32"},{name:"M",type:"u32"},{name:"N",type:"u32"},{name:"K",type:"u32"},{name:"alpha",type:"f32"},{name:"beta",type:"f32"}],k="",B="";t.transA&&t.transB?(B=`
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
      `,k="value += tile_a[k][local_id.y] * tile_b[local_id.x][k];"):t.transA&&!t.transB?(B=`
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
      `,k="value += tile_a[k][local_id.y] * tile_b[k][local_id.x];"):!t.transA&&t.transB?(B=`
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
      `,k="value += tile_a[local_id.y][k] * tile_b[local_id.x][k];"):!t.transA&&!t.transB&&(B=`
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
      `,k="value += tile_a[local_id.y][k] * tile_b[k][local_id.x];");let U=t.alpha===1?"":"value *= uniforms.alpha;";return`
  ${$.registerUniforms(M).declareVariables(...E)}
  var<workgroup> tile_a: array<array<${w.type.storage}, ${l}>, ${l}>;
  var<workgroup> tile_b: array<array<${S.type.storage}, ${l}>, ${l}>;
  ${$.mainStart([l,l,1])}
    let tile_col_start = (workgroup_index % uniforms.num_tile_n) * ${l};
    let tile_row_start = (workgroup_index / uniforms.num_tile_n) * ${l};
    let num_tiles = (uniforms.K - 1) / ${l} + 1;
    var k_start = 0u;
    var value = ${z.type.value}(0);
    for (var t: u32 = 0u; t < num_tiles; t++) {
      ${B}
      k_start = k_start + ${l};
      workgroupBarrier();

      for (var k: u32 = 0u; k < ${l}; k++) {
        ${k}
      }
      workgroupBarrier();
    }

    ${U}
    let m = tile_row_start + local_id.y;
    let n = tile_col_start + local_id.x;
    ${v!=null?`let cOffset = ${v.broadcastedIndicesToOffset("vec2(m, n)",z)}; value += ${z.type.value}(uniforms.beta) * ${v.getByOffset("cOffset")};`:""}
    if (m < uniforms.M && n < uniforms.N) {
      output[m * uniforms.N + n] = value;
    }
  }`};return h?{name:"GemmShared",shaderCache:{hint:`${t.cacheKey}`,inputDependencies:m},getRunData:()=>({outputs:[{dims:o,dataType:e[0].dataType}],dispatchGroup:{x:d*c},programUniforms:g}),getShaderSource:x}:{name:"Gemm",shaderCache:{hint:`${t.cacheKey}`,inputDependencies:m},getRunData:()=>({outputs:[{dims:o,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(f/64)},programUniforms:g}),getShaderSource:b}},Qf=e=>{let t=e.transA,r=e.transB,n=e.alpha,i=e.beta;return{transA:t,transB:r,alpha:n,beta:i,cacheKey:`${e.transA};${e.transB};${e.alpha===1}`}},Jf=(e,t)=>{cd(e.inputs),e.compute(pd(e.inputs,t))}}),mt,$t,qt,Wt,hd,fd,md,gd,yd,bd,_d,wd,em,tm,jb=X(()=>{ue(),le(),Oe(),de(),[mt,$t,qt,Wt]=[0,1,2,3],hd=e=>{if(e[0].dims.length!==4)throw new Error("only 4-D tensor is supported.");if(e[0].dims.length!==e[1].dims.length)throw new Error("input dimensions must be equal to grid dimensions");if(e[0].dims.length-2!==e[1].dims[e[1].dims.length-1])throw new Error(`last dimension of grid must be equal to ${e[0].dims.length-2}`);if(e[0].dims[0]!==e[1].dims[0])throw new Error("grid batch size must match input batch size")},fd=`
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
`,md=e=>`
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
`,gd=e=>`
  fn gs_denormalize(n: f32, length: i32) -> f32 {
    ${e.alignCorners===0?`
    // alignCorners: false => [-1, 1] to [-0.5, length - 0.5]
    return ((n + 1.0) * f32(length) - 1.0) / 2.0;
    `:`
    // alignCorners: true => [-1, 1] to [0, length - 1]
    return (n + 1.0) / 2.0 * (f32(length - 1));
    `}
  }
`,yd=e=>`
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
`,bd=(e,t,r)=>`
  fn pixel_at_grid(r: i32, c: i32, H: i32, W: i32, batch: u32, channel: u32, border: vec4<f32>) -> ${t} {
     var pixel = ${t}(0);
     var indices = vec4<u32>(0);
     indices[${mt}] = batch;
     indices[${$t}] = channel;`+(()=>{switch(r.paddingMode){case"zeros":return`
          if (r >= 0 && r < H && c >=0 && c < W) {
            indices[${qt}] = u32(r);
            indices[${Wt}] = u32(c);
          } else {
            return ${t}(0);
          }
        `;case"border":return`
          indices[${qt}] = u32(clamp(r, 0, H - 1));
          indices[${Wt}] = u32(clamp(c, 0, W - 1));
        `;case"reflection":return`
          indices[${qt}] = gs_reflect(r, border[1], border[3]);
          indices[${Wt}] = gs_reflect(c, border[0], border[2]);
        `;default:throw new Error(`padding mode ${r.paddingMode} is not supported`)}})()+`
    return ${e.getByIndices("indices")};
  }
`,_d=(e,t,r)=>(()=>{switch(r.mode){case"nearest":return`
          let result = pixel_at_grid(i32(round(y)), i32(round(x)), H_in, W_in, indices[${mt}], indices[${$t}], border);
        `;case"bilinear":return`
          let x1 = i32(floor(x));
          let y1 = i32(floor(y));
          let x2 = x1 + 1;
          let y2 = y1 + 1;

          let p11 = pixel_at_grid(y1, x1, H_in, W_in, indices[${mt}], indices[${$t}], border);
          let p12 = pixel_at_grid(y1, x2, H_in, W_in, indices[${mt}], indices[${$t}], border);
          let p21 = pixel_at_grid(y2, x1, H_in, W_in, indices[${mt}], indices[${$t}], border);
          let p22 = pixel_at_grid(y2, x2, H_in, W_in, indices[${mt}], indices[${$t}], border);

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
              p[h][w] = pixel_at_grid(h + y0, w + x0, H_in, W_in, indices[${mt}], indices[${$t}], border);
            }
          }

          let dx = x - f32(x0 + 1);
          let dy = y - f32(y0 + 1);
          let result = gs_bicubic_interpolate(p, dx, dy);
        `;default:throw new Error(`mode ${r.mode} is not supported`)}})()+`${e.setByOffset("global_idx","result")}`,wd=(e,t)=>{let r=W("x",e[0].dataType,e[0].dims.length),n=[e[1].dims[0],e[1].dims[1],e[1].dims[2]],i=W("grid",e[1].dataType,n.length,2),a=[e[0].dims[0],e[0].dims[1],e[1].dims[1],e[1].dims[2]];t.format==="NHWC"&&(a=[e[0].dims[0],e[1].dims[1],e[1].dims[2],e[0].dims[3]],[mt,$t,qt,Wt]=[0,3,1,2]);let s=ne("output",e[0].dataType,a.length),o=r.type.value,l=D.size(a),d=[{type:12,data:l},...oe(e[0].dims,n,a)],c=h=>`
  ${h.registerUniform("output_size","u32").declareVariables(r,i,s)}
  ${fd}
  ${md(o)}
  ${gd(t)}
  ${yd(t)}
  ${bd(r,o,t)}

  ${h.mainStart()}
    ${h.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
      let H_in = i32(uniforms.x_shape[${qt}]);
      let W_in = i32(uniforms.x_shape[${Wt}]);

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
      var grid_indices = vec3<u32>(indices[${mt}], indices[${qt}], indices[${Wt}]);
      let nxy = ${i.getByIndices("grid_indices")};
      var x = gs_denormalize(f32(nxy[0]), W_in);
      var y = gs_denormalize(f32(nxy[1]), H_in);

      ${_d(s,o,t)}
  }`;return{name:"GridSample",shaderCache:{hint:`${t.cacheKey}`,inputDependencies:["type","type"]},getRunData:h=>{let f=D.size(a);return{outputs:[{dims:a,dataType:h[0].dataType}],dispatchGroup:{x:Math.ceil(f/64)},programUniforms:d}},getShaderSource:c}},em=(e,t)=>{hd(e.inputs),e.compute(wd(e.inputs,t))},tm=e=>we({alignCorners:e.align_corners,mode:e.mode,paddingMode:e.padding_mode,format:e.format})}),Fe,$d,rm,Pi,vd,Rr,nm,im=X(()=>{ue(),le(),Oe(),Va(),Xa(),de(),Bt(),Fe=(e,t)=>e.length>t&&e[t].dims.length>0?e[t]:void 0,$d=(e,t)=>{let r=e[0],n=Fe(e,1),i=Fe(e,2),a=Fe(e,3),s=Fe(e,4),o=Fe(e,5),l=Fe(e,6),d=Fe(e,7);if(r.dims.length!==3&&r.dims.length!==5)throw new Error("Input query is expected to have 3 or 5 dimensions");let c=r.dims[0],h=r.dims[1],f=r.dims.length===3?r.dims[2]:t.numHeads*r.dims[4],g=h,m=0,b=0,x=Math.floor(f/t.numHeads);if(l&&d&&D.size(l.dims)&&D.size(d.dims)){if(l.dims.length!==4)throw new Error('Input "past_key" is expected to have 4 dimensions');if(l.dims[0]!==c||l.dims[1]!==t.numHeads||l.dims[3]!==x)throw new Error('Input "past_key" shape (batch_size, num_heads, past_sequence_length, head_size)');if(d.dims[0]!==c||d.dims[1]!==t.numHeads||d.dims[3]!==x)throw new Error('Input "past_value" shape (batch_size, num_heads, past_sequence_length, head_size)');if(l.dims[2]!==d.dims[2])throw new Error('Input "past_key" and "past_value" shall have same dim 2 (past_sequence_length)');if(d.dims.length!==4)throw new Error('Input "past_value" is expected to have 4 dimensions');m=l.dims[2],b=l.dims[2]}else if(l&&D.size(l.dims)||d&&D.size(d.dims))throw new Error('Input "past_key" and "past_value" shall be both present or both absent');let $;if(n&&D.size(n.dims)>0){if(r.dims.length!==3)throw new Error('Input "query" is expected to have 3 dimensions when key is given');if(n.dims.length<3||n.dims.length>5)throw new Error('Input "key" is expected to have 3, 4, or 5 dimensions');if(r.dims[0]!==n.dims[0])throw new Error('Input "query" and "key" shall have same dim 0 (batch size)');if(n.dims.length===3){if(n.dims[2]!==r.dims[2])throw new Error('Input "query" and "key" shall have same dim 2 (hidden_size)');$=2,g=n.dims[1]}else if(n.dims.length===5){if(n.dims[2]!==t.numHeads||n.dims[3]!==2||n.dims[4]!==x)throw new Error('Expect "key" shape (batch_size, kv_sequence_length, num_heads, 2, head_size) for packed kv');if(i)throw new Error('Expect "value" be none when "key" has packed kv format.');$=5,g=n.dims[1]}else{if(n.dims[1]!==t.numHeads||n.dims[3]!==x)throw new Error('Expect "key" shape (batch_size, num_heads, kv_sequence_length, head_size) for past_key');$=0,g=n.dims[2]}}else{if(r.dims.length!==5)throw new Error('Input "query" is expected to have 5 dimensions when key is empty');if(r.dims[2]!==t.numHeads||r.dims[3]!==3)throw new Error('Expect "query" shape (batch_size, kv_sequence_length, num_heads, 3, head_size) for packed kv');$=3}if(a&&D.size(a.dims)>0){if(a.dims.length!==1)throw new Error('Input "bias" is expected to have 1 dimension');if(n&&n.dims.length===5&&n.dims[3]===2)throw new Error("bias is not allowed for packed kv.")}let w=m+g,S=0;if(s&&D.size(s.dims)>0){S=8;let M=s.dims;throw M.length===1?M[0]===c?S=1:M[0]===3*c+2&&(S=3):M.length===2&&M[0]===c&&M[1]===w&&(S=5),S===8?new Error('Input "key_padding_mask" shape shall be (batch_size) or (batch_size, total_sequence_length)'):new Error("Mask not supported")}let v=!1,E=f;if(i&&D.size(i.dims)>0){if(i.dims.length!==3&&i.dims.length!==4)throw new Error('Input "value" is expected to have 3 or 4 dimensions');if(r.dims[0]!==i.dims[0])throw new Error('Input "query" and "value" shall have same dim 0 (batch_size)');if(i.dims.length===3){if(g!==i.dims[1])throw new Error('Input "key" and "value" shall have the same dim 1 (kv_sequence_length)');E=i.dims[2]}else{if(g!==i.dims[2])throw new Error('Input "key" and "value" shall have the same dim 2 (kv_sequence_length)');E=i.dims[1]*i.dims[3],v=!0}}let z=!1;if(s&&D.size(s.dims)>0)throw new Error("Key padding mask is not supported");if(o&&D.size(o.dims)>0){if(o.dims.length!==4)throw new Error('Input "attention_bias" is expected to have 4 dimensions');if(o.dims[0]!==c||o.dims[1]!==t.numHeads||o.dims[2]!==h||o.dims[3]!==w)throw new Error('Expect "attention_bias" shape (batch_size, num_heads, sequence_length, total_sequence_length)')}return{batchSize:c,sequenceLength:h,pastSequenceLength:m,kvSequenceLength:g,totalSequenceLength:w,maxSequenceLength:b,inputHiddenSize:0,hiddenSize:f,vHiddenSize:E,headSize:x,vHeadSize:Math.floor(E/t.numHeads),numHeads:t.numHeads,isUnidirectional:!1,pastPresentShareBuffer:!1,maskFilterValue:t.maskFilterValue,maskType:S,scale:t.scale,broadcastResPosBias:z,passPastInKv:v,qkvFormat:$}},rm=e=>we({...e}),Pi=we({perm:[0,2,1,3]}),vd=(e,t,r,n,i,a,s)=>{let o=[n,i,a],l=D.size(o),d=[{type:12,data:l},{type:12,data:s},{type:12,data:a}],c=h=>{let f=ne("qkv_with_bias",t.dataType,o),g=W("qkv",t.dataType,o),m=W("bias",r.dataType,o),b=[{name:"output_size",type:"u32"},{name:"bias_offset",type:"u32"},{name:"hidden_size",type:"u32"}];return`
  ${h.registerUniforms(b).declareVariables(g,m,f)}
  ${h.mainStart()}
    ${h.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
    let bias_offset_idx = (global_idx % uniforms.hidden_size) + uniforms.bias_offset;

    qkv_with_bias[global_idx] = qkv[global_idx] + bias[bias_offset_idx];
  }`};return e.compute({name:"MultiHeadAttentionAddBias",shaderCache:{inputDependencies:["type","type"]},getRunData:()=>({outputs:[{dims:o,dataType:t.dataType,gpuDataType:0}],dispatchGroup:{x:Math.ceil(l/64)},programUniforms:d}),getShaderSource:c},{inputs:[t,r],outputs:[-1]})[0]},Rr=(e,t,r,n,i,a,s,o)=>{let l=a;if(s&&D.size(s.dims)>0){if(n===1)throw new Error("AddBiasReshape is not implemented. Please export your model with packed QKV or KV");return l=vd(e,a,s,t,n,r*i,o),l=l.reshape([t,n,r,i]),r===1||n===1?l:e.compute(Xe(l,Pi.perm),{inputs:[l],outputs:[-1]})[0]}else return a.dims.length===3&&(l=a.reshape([t,n,r,i])),r===1||n===1?l:e.compute(Xe(l,Pi.perm),{inputs:[l],outputs:[-1]})[0]},nm=(e,t)=>{let r=$d(e.inputs,t),n=e.inputs[0],i=Fe(e.inputs,1),a=Fe(e.inputs,2),s=Fe(e.inputs,3),o=Fe(e.inputs,4),l=Fe(e.inputs,5),d=Fe(e.inputs,6),c=Fe(e.inputs,7);if(n.dims.length===5)throw new Error("Packed QKV is not implemented");if(i?.dims.length===5)throw new Error("Packed KV is not implemented");let h=i&&a&&i.dims.length===4&&a.dims.length===4,f=Rr(e,r.batchSize,r.numHeads,r.sequenceLength,r.headSize,n,s,0);if(h)return Ur(e,f,i,a,o,void 0,d,c,l,r);if(!i||!a)throw new Error("key and value must be provided");let g=Rr(e,r.batchSize,r.numHeads,r.kvSequenceLength,r.headSize,i,s,r.hiddenSize),m=Rr(e,r.batchSize,r.numHeads,r.kvSequenceLength,r.vHeadSize,a,s,2*r.hiddenSize);Ur(e,f,g,m,o,void 0,d,c,l,r)}}),xd,Sd,kd,Td,Ia,am,sm,om=X(()=>{ue(),le(),Oe(),de(),xd=e=>{if(!e||e.length<1)throw new Error("too few inputs")},Sd=(e,t)=>{let r=[],n=t.numOutputs;return e[1].dims[0]>0&&(e[1].getBigInt64Array().forEach(i=>r.push(Number(i))),n=r.length),we({numOutputs:n,axis:t.axis,splitSizes:r})},kd=e=>`
fn calculateOutputIndex(index: u32) -> u32 {
    for (var i: u32 = 0u; i < ${e}u; i += 1u ) {
    if (index < ${ae("uniforms.size_in_split_axis","i",e)}) {
        return i;
    }
    }
    return ${e}u;
}`,Td=e=>{let t=e.length,r=[];for(let n=0;n<t;++n){let i=e[n].setByIndices("indices","input[global_idx]");t===1?r.push(i):n===0?r.push(`if (output_number == ${n}u) { ${i} }`):n===t-1?r.push(`else { ${i} }`):r.push(`else if (output_number == ${n}) { ${i} }`)}return`
      fn writeBufferData(output_number: u32, indices: ${e[0].type.indices}, global_idx: u32) {
        ${r.join(`
`)}
      }`},Ia=(e,t)=>{let r=e[0].dims,n=D.size(r),i=e[0].dataType,a=D.normalizeAxis(t.axis,r.length),s=new Array(t.numOutputs),o=W("input",i,r.length),l=new Array(t.numOutputs),d=[],c=[],h=0,f=[{type:12,data:n}];for(let m=0;m<t.numOutputs;m++){h+=t.splitSizes[m],l[m]=h;let b=r.slice();b[a]=t.splitSizes[m],c.push(b),s[m]=ne(`output${m}`,i,b.length),d.push({dims:c[m],dataType:e[0].dataType})}f.push({type:12,data:l},...oe(r,...c));let g=m=>`
  ${m.registerUniform("input_size","u32").registerUniform("size_in_split_axis","u32",l.length).declareVariables(o,...s)}
  ${kd(l.length)}
  ${Td(s)}

  ${m.mainStart()}
    ${m.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.input_size")}

    var indices = ${o.offsetToIndices("global_idx")};
    var index = ${o.indicesGet("indices",a)};
    let output_number = calculateOutputIndex(index);
    if (output_number != 0) {
      index -= ${ae("uniforms.size_in_split_axis","output_number - 1u",l.length)};
      ${o.indicesSet("indices",a,"index")};
    }
    writeBufferData(output_number, indices, global_idx);
  }`;return{name:"Split",shaderCache:{hint:t.cacheKey,inputDependencies:["rank"]},getShaderSource:g,getRunData:()=>({outputs:d,dispatchGroup:{x:Math.ceil(n/64)},programUniforms:f})}},am=(e,t)=>{xd(e.inputs);let r=e.inputs.length===1?t:Sd(e.inputs,t);e.compute(Ia(e.inputs,r),{inputs:[0]})},sm=e=>{let t=e.axis,r=e.splitSizes,n=e.numOutputs<0?r.length:e.numOutputs;if(n!==r.length)throw new Error("numOutputs and splitSizes length must be equal");return we({axis:t,numOutputs:n,splitSizes:r})}}),Ed,An,um,lm=X(()=>{ue(),le(),Oe(),de(),Ed=(e,t)=>{let[r,n,i,a]=e,{numHeads:s,rotaryEmbeddingDim:o}=t;if(r.dims.length!==3&&r.dims.length!==4)throw new Error(`Input 'x' is expected to have 3 or 4 dimensions, got ${r.dims.length}`);if(!D.areEqual(n.dims,[])&&!D.areEqual(n.dims,[1])&&n.dims.length!==2)throw new Error(`Input 'position_ids' is expected to have 0, 1, or 2 dimensions, got ${n.dims.length}`);if(i.dims.length!==2)throw new Error(`Input 'cos_cache' is expected to have 2 dimensions, got ${i.dims.length}`);if(a.dims.length!==2)throw new Error(`Input 'sin_cache' is expected to have 2 dimensions, got ${a.dims.length}`);if(!D.areEqual(i.dims,a.dims))throw new Error("Inputs 'cos_cache' and 'sin_cache' are expected to have the same shape");if(o>0&&s===0)throw new Error("num_heads must be provided if rotary_embedding_dim is specified");let l=r.dims[0],d=r.dims[r.dims.length-2],c=i.dims[0],h=D.sizeFromDimension(r.dims,1)/d,f=o===0?i.dims[1]*2:h/s;if(o>f)throw new Error("rotary_embedding_dim must be less than or equal to head_size");if(n.dims.length===2){if(l!==n.dims[0])throw new Error(`Input 'position_ids' dimension 0 should be of size batch_size, got ${n.dims[0]}`);if(d!==n.dims[1])throw new Error(`Input 'position_ids' dimension 1 should be of size sequence_length, got ${n.dims[1]}`)}if(d>c)throw new Error("Updating cos_cache and sin_cache in RotaryEmbedding is not currently supported");if(f/2!==i.dims[1]&&o/2!==i.dims[1])throw new Error(`Input 'cos_cache' dimension 1 should be same as head_size / 2 or rotary_embedding_dim / 2, got ${i.dims[1]}`)},An=(e,t)=>{let{interleaved:r,numHeads:n,rotaryEmbeddingDim:i,scale:a}=t,s=e[0].dims[0],o=D.sizeFromDimension(e[0].dims,1),l=e[0].dims[e[0].dims.length-2],d=o/l,c=e[2].dims[1],h=i===0?c*2:d/n,f=new Array(s,l,d/h,h-c),g=D.computeStrides(f),m=[{type:1,data:a},{type:12,data:f},{type:12,data:g},...e[0].dims.length===3?new Array({type:12,data:[o,d,h,1]}):[],...e[0].dims.length===4?new Array({type:12,data:[o,h,l*h,1]}):[],...oe(e[0].dims,e[1].dims,e[2].dims,e[3].dims,e[0].dims)],b=x=>{let $=W("input",e[0].dataType,e[0].dims.length),w=W("position_ids",e[1].dataType,e[1].dims.length),S=W("cos_cache",e[2].dataType,e[2].dims.length),v=W("sin_cache",e[3].dataType,e[3].dims.length),E=ne("output",e[0].dataType,e[0].dims.length);return x.registerUniforms([{name:"scale",type:"f32"},{name:"global_shape",type:"u32",length:f.length},{name:"global_strides",type:"u32",length:g.length},{name:"input_output_strides",type:"u32",length:g.length}]),`
        ${x.declareVariables($,w,S,v,E)}

        ${x.mainStart(hr)}
          let half_rotary_emb_dim = uniforms.${S.name}_shape[1];
          let bsnh = global_idx / uniforms.global_strides % uniforms.global_shape;
          let size = uniforms.global_shape[0] * uniforms.global_strides[0];
          ${x.guardAgainstOutOfBoundsWorkgroupSizes("size")}

          if (bsnh[3] < half_rotary_emb_dim) {
            let position_ids_idx =
                ${w.broadcastedIndicesToOffset("bsnh.xy",ne("",w.type.tensor,2))};
            let position_id =
                u32(${w.getByOffset("position_ids_idx")}) + select(0, bsnh[1], position_ids_idx == 0);
            let i = dot(bsnh, uniforms.input_output_strides) + select(0, bsnh[3], ${r});
            let j = i + select(half_rotary_emb_dim, 1, ${r});
            let re = ${$.getByOffset("i")} * ${S.get("position_id","bsnh[3]")} -
                ${$.getByOffset("j")} * ${v.get("position_id","bsnh[3]")};
            ${E.setByOffset("i","re")}
            let im = ${$.getByOffset("i")} * ${v.get("position_id","bsnh[3]")} +
                ${$.getByOffset("j")} * ${S.get("position_id","bsnh[3]")};
            ${E.setByOffset("j","im")}
          } else {
            let k = dot(bsnh, uniforms.input_output_strides) + half_rotary_emb_dim;
            ${E.setByOffset("k",$.getByOffset("k"))}
          }
        }`};return{name:"RotaryEmbedding",shaderCache:{hint:we({interleaved:r}).cacheKey,inputDependencies:["rank","rank","rank","rank"]},getShaderSource:b,getRunData:()=>({outputs:[{dims:e[0].dims,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(D.size(f)/hr)},programUniforms:m})}},um=(e,t)=>{Ed(e.inputs,t),e.compute(An(e.inputs,t))}}),Id,Cd,Li,zd,dm,qb=X(()=>{Oe(),ue(),Xa(),im(),om(),Bt(),lm(),de(),Id=(e,t)=>{if(t.doRotary&&e.length<=7)throw new Error("cos_cache and sin_cache inputs are required if do_rotary is specified");let r=e[0],n=e[1],i=e[2],a=e[3],s=e[4];if(t.doRotary!==0&&e.length<=7)throw new Error("cos_cast and sin_cache are expected if do_rotary attribute is non-zero");if(t.localWindowSize!==-1)throw new Error("Local attention is not supported");if(t.softcap!==0)throw new Error("Softcap is not supported");if(t.rotaryInterleaved!==0)throw new Error("Rotary interleaved is not supported");if(t.smoothSoftmax)throw new Error("Smooth softmax is not supported");if(r.dims.length!==3&&r.dims.length!==5)throw new Error("Input query is expected to have 3 or 5 dimensions");let o=!1,l=r.dims[0],d=r.dims[1],c=r.dims.length===3?o?r.dims[2]/3:r.dims[2]:t.numHeads*r.dims[4],h=d,f=0,g=!n||n.dims.length===0,m=Math.floor(g?c/(t.numHeads+2*t.kvNumHeads):c/t.numHeads);g&&(c=m*t.numHeads);let b=a&&a.dims.length!==0,x=s&&s.dims.length!==0;if(b&&a.dims.length===4&&a.dims[0]===l&&a.dims[1]!==t.kvNumHeads&&a.dims[2]===t.kvNumHeads&&a.dims[3]===m)throw new Error("BSNH pastKey/pastValue is not supported");if(b&&x){if(a.dims.length!==4)throw new Error('Input "past_key" is expected to have 4 dimensions');if(s.dims.length!==4)throw new Error('Input "past_value" is expected to have 4 dimensions');f=a.dims[2]}else if(b||x)throw new Error('Input "past_key" and "past_value" shall be both present or both absent');let $=1;if(n&&n.dims.length>0){if(r.dims.length!==3)throw new Error('Input "query" is expected to have 3 dimensions when key is given');if(n.dims.length<3||n.dims.length>5)throw new Error('Input "key" is expected to have 3, 4, or 5 dimensions');if(r.dims[0]!==n.dims[0])throw new Error('Input "query" and "key" shall have same dim 0 (batch size)');if(n.dims.length===3){if(r.dims[2]%n.dims[2]!==0)throw new Error('Dimension 2 of "query" should be a multiple of "key"');h=n.dims[1]}else if(n.dims.length===5){if(n.dims[2]!==t.numHeads||n.dims[3]!==2||n.dims[4]!==m)throw new Error('Expect "key" shape (batch_size, kv_sequence_length, num_heads, 2, head_size) for packed kv');if(i)throw new Error('Expect "value" be none when "key" has packed kv format.');h=n.dims[1]}else{if(n.dims[1]!==t.numHeads||n.dims[3]!==m)throw new Error('Expect "key" shape (batch_size, num_heads, kv_sequence_length, head_size) for past_key');h=n.dims[2]}}else{if(r.dims.length!==3&&r.dims.length!==5)throw new Error('Input "query" is expected to have 3 or 5 dimensions when key is empty');if(r.dims.length===5&&(r.dims[2]!==t.numHeads||r.dims[3]!==3))throw new Error('Expect "query" shape (batch_size, kv_sequence_length, num_heads, 3, head_size) for packed kv');$=3}let w=0,S=!1,v=t.kvNumHeads?m*t.kvNumHeads:c;if(i&&i.dims.length>0){if(i.dims.length!==3&&i.dims.length!==4)throw new Error('Input "value" is expected to have 3 or 4 dimensions');if(r.dims[0]!==i.dims[0])throw new Error('Input "query" and "value" shall have same dim 0 (batch_size)');if(i.dims.length===3){if(h!==i.dims[1])throw new Error('Input "key" and "value" shall have the same dim 1 (kv_sequence_length)');v=i.dims[2]}else{if(h!==i.dims[2])throw new Error('Input "past_key" and "past_value" shall have the same dim 2 (kv_sequence_length)');v=i.dims[1]*i.dims[3],S=!0}}let E=e.length>4?e[5]:void 0;if(E){if(E.dims.length===0)throw new Error("seqlens_k must be at least 1D, got scalar.");let z=E.dims.reduce((M,k)=>M*k,1);if(z!==l)throw new Error(`seqlens_k must have batch_size (${l}) elements, got ${z}.`);for(let M=0;M<E.dims.length;M++)if(E.dims[M]!==1&&E.dims[M]!==l)throw new Error(`seqlens_k has unexpected shape. Each dimension must be 1 or batch_size (${l}), got dims[${M}] = ${E.dims[M]}.`)}return{batchSize:l,sequenceLength:d,pastSequenceLength:f,kvSequenceLength:h,totalSequenceLength:-1,maxSequenceLength:-1,inputHiddenSize:0,hiddenSize:c,vHiddenSize:v,headSize:m,vHeadSize:Math.floor(v/t.kvNumHeads),numHeads:t.numHeads,kvNumHeads:t.kvNumHeads,nReps:t.numHeads/t.kvNumHeads,pastPresentShareBuffer:!1,maskType:w,scale:t.scale,broadcastResPosBias:!1,passPastInKv:S,qkvFormat:$}},Cd=we({perm:[0,2,1,3]}),Li=(e,t,r)=>{let n=t,i=r.kvNumHeads;return t.dims.length===3&&r.kvSequenceLength!==0&&(n=t.reshape([r.batchSize,r.kvSequenceLength,i,r.headSize]),n=e.compute(Xe(n,Cd.perm),{inputs:[n],outputs:[-1]})[0]),n},zd=(e,t,r,n)=>{let i=7,a=["type","type"],s=[e*t],o=e*t,l=[{type:12,data:o},{type:12,data:t},{type:12,data:e}],d=c=>{let h=W("seq_lens",r.dataType,r.dims),f=W("total_seq_lens",n.dataType,n.dims),g=ne("pos_ids",i,s),m=[{name:"output_size",type:"u32"},{name:"sequence_length",type:"u32"},{name:"batch_size",type:"u32"}];return`
  ${c.registerUniforms(m).declareVariables(h,f,g)}
  ${c.mainStart()}
    ${c.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
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
  `};return{name:"GeneratePositionIds",shaderCache:{hint:`${e};${t}`,inputDependencies:a},getRunData:()=>({outputs:[{dims:s,dataType:i}],dispatchGroup:{x:Math.ceil(o/64)},programUniforms:l}),getShaderSource:d}},dm=(e,t)=>{let r=Id(e.inputs,t);if(e.inputs[0].dims.length===5)throw new Error("Packed QKV is not implemented");if(e.inputs[1]?.dims.length===5)throw new Error("Packed KV is not implemented");let n=e.inputs[0],i=e.inputs[1]&&e.inputs[1].dims.length>0?e.inputs[1]:void 0,a=e.inputs[2]&&e.inputs[2].dims.length>0?e.inputs[2]:void 0,s=e.inputs[3]&&e.inputs[3].dims.length!==0?e.inputs[3]:void 0,o=e.inputs[4]&&e.inputs[4].dims.length!==0?e.inputs[4]:void 0,l=e.inputs.length>4?e.inputs[5]:void 0,d=e.inputs.length>5?e.inputs[6]:void 0,c=r.kvNumHeads?r.kvNumHeads:r.numHeads,h=we({axis:2,numOutputs:3,splitSizes:[r.numHeads*r.headSize,c*r.headSize,c*r.headSize]}),[f,g,m]=!i&&!a?e.compute(Ia([n],h),{inputs:[n],outputs:[-1,-1,-1]}):[n,i,a],b,x;if(t.doRotary){let v=e.compute(zd(r.batchSize,r.sequenceLength,l,d),{inputs:[l,d],outputs:[-1]})[0],E=e.inputs[7],z=e.inputs[8],M=we({interleaved:t.rotaryInterleaved!==0,numHeads:r.numHeads,rotaryEmbeddingDim:0,scale:t.scale}),k=[f,v,E,z],B=[-1];b=e.compute(An(k,M),{inputs:k,outputs:B})[0],k.splice(0,1,g);let U=we({interleaved:t.rotaryInterleaved!==0,numHeads:r.kvNumHeads,rotaryEmbeddingDim:0,scale:t.scale});x=e.compute(An(k,U),{inputs:k,outputs:B})[0]}let $=Rr(e,r.batchSize,r.numHeads,r.sequenceLength,r.headSize,t.doRotary?b:f,void 0,0),w=Li(e,t.doRotary?x:g,r),S=Li(e,m,r);Ur(e,$,w,S,void 0,void 0,s,o,void 0,r,l,d)}}),Ui,Ad,Md,cm,Wb=X(()=>{ue(),le(),Bt(),de(),Ui=(e,t,r,n,i,a,s,o)=>{let l=Ne(a),d=l===1?"f32":`vec${l}f`,c=l===1?"vec2f":`mat2x${l}f`,h=i*s,f=64;h===1&&(f=256);let g=[i,s,a/l],m=[i,s,2],b=["rank","type","type"],x=[];x.push(...oe(g,m));let $=w=>{let S=W("x",t.dataType,3,l),v=W("scale",r.dataType,r.dims),E=W("bias",n.dataType,n.dims),z=ne("output",1,3,2),M=[S,v,E,z];return`
  var<workgroup> workgroup_shared : array<${c}, ${f}>;
  const workgroup_size = ${f}u;
  ${w.declareVariables(...M)}
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
    workgroup_shared[local_idx] = ${c}(sum, squared_sum);
    workgroupBarrier();

    for (var currSize = workgroup_size >> 1;  currSize > 0; currSize = currSize >> 1) {
      if (local_idx < currSize) {
        workgroup_shared[local_idx] = workgroup_shared[local_idx] + workgroup_shared[local_idx + currSize];
      }
      workgroupBarrier();
    }
    if (local_idx == 0) {
      let sum_final = ${Rt("workgroup_shared[0][0]",l)} / f32(hight * ${l});
      let squared_sum_final = ${Rt("workgroup_shared[0][1]",l)} / f32(hight * ${l});

      let inv_std_dev = inverseSqrt(squared_sum_final - sum_final * sum_final + f32(${o}));
      let channel_scale = inv_std_dev * f32(scale[channel]);
      let channel_shift = f32(bias[channel]) - sum_final * channel_scale;
      output[workgroup_index] = vec2f(channel_scale, channel_shift);
    }
  }`};return e.compute({name:"InstanceNormComputeChannelScaleShift",shaderCache:{hint:`${l};${o};${f}`,inputDependencies:b},getRunData:()=>({outputs:[{dims:m,dataType:1}],dispatchGroup:{x:h},programUniforms:x}),getShaderSource:$},{inputs:[t,r,n],outputs:[-1]})[0]},Ad=(e,t,r)=>{let n=t[0].dims,i=n,a=2,s=n[0],o=n[1],l=D.sizeFromDimension(n,a),d=Ne(l),c=D.size(i)/d,h=Ui(e,t[0],t[1],t[2],s,l,o,r.epsilon),f=[s,o,l/d],g=[s,o],m=["type","none"],b=x=>{let $=W("x",t[0].dataType,f.length,d),w=W("scale_shift",1,g.length,2),S=ne("output",t[0].dataType,f.length,d),v=[$,w,S];return`
  ${x.registerUniform("output_size","u32").declareVariables(...v)}
  ${x.mainStart()}
  ${x.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
      let outputIndices = ${S.offsetToIndices("global_idx")};
      let batch = outputIndices[0];
      let channel = outputIndices[1];
      let scale_shift = ${w.getByIndices("vec2<u32>(batch, channel)")};
      let value = ${$.getByOffset("global_idx")} * ${S.type.value}(scale_shift.x) + ${S.type.value}(scale_shift.y);
      ${S.setByOffset("global_idx","value")};
  }`};e.compute({name:"InstanceNormalization",shaderCache:{hint:`${d}`,inputDependencies:m},getRunData:()=>({outputs:[{dims:i,dataType:t[0].dataType}],dispatchGroup:{x:Math.ceil(c/64)},programUniforms:[{type:12,data:c},...oe(f,g,f)]}),getShaderSource:b},{inputs:[t[0],h]})},Md=(e,t,r)=>{let n=t[0].dims,i=n,a=n[0],s=n[n.length-1],o=D.sizeFromDimension(n,1)/s,l=Ne(s),d=D.size(i)/l,c=[{type:12,data:o},{type:12,data:Math.floor(s/l)}],h=["type","type"],f=!1,g=[0,n.length-1];for(let $=0;$<n.length-2;$++)f=f||n[$+1]!==1,g.push($+1);f=f&&n[n.length-1]!==1;let m=f?e.compute(Xe(e.inputs[0],g),{inputs:[e.inputs[0]],outputs:[-1]})[0]:e.inputs[0].reshape(Array.from({length:n.length},($,w)=>n[g[w]])),b=Ui(e,m,t[1],t[2],a,o,s,r.epsilon),x=$=>{let w=De(t[0].dataType),S=l===1?"vec2f":`mat${l}x2f`,v=M=>{let k=M===0?"x":"y",B=l===1?"f32":`vec${l}f`;switch(l){case 1:return`${w}(${B}(scale.${k}))`;case 2:return`vec2<${w}>(${B}(scale[0].${k}, scale[1].${k}))`;case 4:return`vec4<${w}>(${B}(scale[0].${k}, scale[1].${k}, scale[2].${k}, scale[3].${k}))`;default:throw new Error(`Not supported compoents ${l}`)}},E=W("input",t[0].dataType,t[0].dims,l),z=ne("output",t[0].dataType,i,l);return`
  @group(0) @binding(0) var<storage, read> input : array<${E.type.storage}>;
  @group(0) @binding(1) var<storage, read> scale_input : array<${S}>;
  @group(0) @binding(2) var<storage, read_write> output : array<${z.type.storage}>;
  struct Uniforms {H: u32, C : u32};
  @group(0) @binding(3) var<uniform> uniforms: Uniforms;

  ${$.mainStart()}
    let current_image_number = global_idx / (uniforms.C * uniforms.H);
    let current_channel_number = global_idx % uniforms.C;

    let scale_offset = current_image_number * uniforms.C + current_channel_number;
    let scale = scale_input[scale_offset];
    output[global_idx] = fma(input[global_idx], ${v(0)}, ${v(1)});
  }`};e.compute({name:"InstanceNormalizationNHWC",shaderCache:{hint:`${l}`,inputDependencies:h},getRunData:()=>({outputs:[{dims:i,dataType:t[0].dataType}],dispatchGroup:{x:Math.ceil(d/64)},programUniforms:c}),getShaderSource:x},{inputs:[t[0],b]})},cm=(e,t)=>{t.format==="NHWC"?Md(e,e.inputs,t):Ad(e,e.inputs,t)}}),Nd,Od,pm,Fb=X(()=>{ue(),le(),de(),Nd=e=>{if(!e||e.length<2)throw new Error("layerNorm requires at least 2 inputs.")},Od=(e,t,r)=>{let n=t.simplified,i=e[0].dims,a=e[1],s=!n&&e[2],o=i,l=D.normalizeAxis(t.axis,i.length),d=D.sizeToDimension(i,l),c=D.sizeFromDimension(i,l),h=D.size(a.dims),f=s?D.size(s.dims):0;if(h!==c||s&&f!==c)throw new Error(`Size of X.shape()[axis:] == ${c}.
       Size of scale and bias (if provided) must match this.
       Got scale size of ${h} and bias size of ${f}`);let g=[];for(let E=0;E<i.length;++E)E<l?g.push(i[E]):g.push(1);let m=Ne(c),b=["type","type"],x=[{type:12,data:d},{type:1,data:c},{type:12,data:Math.floor(c/m)},{type:1,data:t.epsilon}];s&&b.push("type");let $=r>1,w=r>2,S=E=>{let z=De(e[0].dataType),M=[W("x",e[0].dataType,e[0].dims,m),W("scale",a.dataType,a.dims,m)];s&&M.push(W("bias",s.dataType,s.dims,m)),M.push(ne("output",e[0].dataType,o,m)),$&&M.push(ne("mean_data_output",1,g)),w&&M.push(ne("inv_std_output",1,g));let k=[{name:"norm_count",type:"u32"},{name:"norm_size",type:"f32"},{name:"norm_size_vectorized",type:"u32"},{name:"epsilon",type:"f32"}];return`
  ${E.registerUniforms(k).declareVariables(...M)}
  ${E.mainStart()}
    ${E.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.norm_count")}
    let offset = global_idx * uniforms.norm_size_vectorized;
    var mean_vector = ${_a("f32",m)};
    var mean_square_vector = ${_a("f32",m)};

    for (var h: u32 = 0u; h < uniforms.norm_size_vectorized; h++) {
      let value = ${dr(z,m,"x[h + offset]")};
      mean_vector += value;
      mean_square_vector += value * value;
    }
    let mean = ${Rt("mean_vector",m)} / uniforms.norm_size;
    let inv_std_dev = inverseSqrt(${Rt("mean_square_vector",m)} / uniforms.norm_size ${n?"":"- mean * mean"} + uniforms.epsilon);

    for (var j: u32 = 0; j < uniforms.norm_size_vectorized; j++) {
      let f32input = ${dr(z,m,"x[j + offset]")};
      let f32scale = ${dr(z,m,"scale[j]")};
      output[j + offset] = ${M[0].type.value}((f32input ${n?"":"- mean"}) * inv_std_dev * f32scale
        ${s?`+ ${dr(z,m,"bias[j]")}`:""}
      );
    }

    ${$?"mean_data_output[global_idx] = mean":""};
    ${w?"inv_std_output[global_idx] = inv_std_dev":""};
  }`},v=[{dims:o,dataType:e[0].dataType}];return $&&v.push({dims:g,dataType:1}),w&&v.push({dims:g,dataType:1}),{name:"LayerNormalization",shaderCache:{hint:`${m};${r};${n}`,inputDependencies:b},getRunData:()=>({outputs:v,dispatchGroup:{x:Math.ceil(d/64)},programUniforms:x}),getShaderSource:S}},pm=(e,t)=>{Nd(e.inputs),e.compute(Od(e.inputs,t,e.outputCount))}}),Rd,hm,Gb=X(()=>{le(),es(),ts(),Rd=e=>{if(!e||e.length!==2)throw new Error("MatMul requires 2 inputs.");if(e[0].dims[e[0].dims.length-1]!==e[1].dims[e[1].dims.length-2])throw new Error("shared dimension does not match.")},hm=e=>{Rd(e.inputs);let t=pr.calcShape(e.inputs[0].dims,e.inputs[1].dims,!0);if(!t)throw new Error("Can't use matmul on the given tensors");let r=t[t.length-1],n=e.inputs[0].dims[e.inputs[0].dims.length-1];if(r<8&&n<8)e.compute(Ja(e.inputs,{activation:""},t));else{let i=t[t.length-2],a=D.size(e.inputs[0].dims.slice(0,-2)),s=D.size(e.inputs[1].dims.slice(0,-2));if(a!==1&&i===1&&s===1){let o=e.inputs[0].reshape([1,a,n]),l=e.inputs[1].reshape([1,n,r]),d=[1,a,r],c=[o,l];e.compute(zn(c,{activation:""},t,d),{inputs:c})}else e.compute(zn(e.inputs,{activation:""},t))}}}),Bd,Dd,Pd,fm,mm,Vb=X(()=>{ue(),le(),Oe(),de(),Bd=(e,t)=>{if(e.length<3||e.length>4)throw new Error("MatMulNBits requires 3 or 4 inputs");let r=e[0],n=r.dims.length;if(r.dims[n-1]!==t.k)throw new Error("The last dim of input shape does not match the k value");let i=Math.floor((t.k+t.blockSize-1)/t.blockSize),a=t.blockSize/8*t.bits,s=e[1];if(!D.areEqual(s.dims,[t.n,i,a]))throw new Error("The second inputs must be 3D tensor with shape N X nBlocksPerCol X blobSize");let o=e[2].dims;if(D.size(o)!==t.n*i)throw new Error("scales input size error.");if(e.length===4){let l=e[3].dims,d=t.n*(t.bits===8?i:Math.floor((i*t.bits+7)/8));if(D.size(l)!==d)throw new Error("zeroPoints input size error.")}},Dd=(e,t)=>{let r=e[0].dims,n=r.length,i=r[n-2],a=t.k,s=t.n,o=r.slice(0,n-2),l=D.size(o),d=e[1].dims[2]/4,c=e[0].dataType,h=Ne(t.k),f=Ne(d),g=Ne(s),m=o.concat([i,s]),b=i>1&&s/g%2===0?2:1,x=D.size(m)/g/b,$=64,w=[],S=[l,i,a/h],v=D.convertShape(e[1].dims).slice();v.splice(-1,1,d/f),w.push(...oe(S)),w.push(...oe(v)),w.push(...oe(e[2].dims)),e.length===4&&w.push(...oe(D.convertShape(e[3].dims)));let E=[l,i,s/g];w.push(...oe(E));let z=M=>{let k=S.length,B=W("a",e[0].dataType,k,h),U=W("b",12,v.length,f),G=W("scales",e[2].dataType,e[2].dims.length),V=[B,U,G],Z=e.length===4?W("zero_points",12,e[3].dims.length):void 0;Z&&V.push(Z);let O=E.length,P=ne("output",e[0].dataType,O,g),H=De(e[0].dataType),Y=(()=>{switch(h){case 1:return`array<${H}, 8>`;case 2:return`mat4x2<${H}>`;case 4:return`mat2x4<${H}>`;default:throw new Error(`${h}-component is not supported.`)}})(),j=Math.floor(32/t.bits),K=Math.floor(j/8),J=()=>{let C="";for(let R=0;R<K;R++){let ie=R*t.bits*4,Se=ie+t.bits;C+=`
          // reuse a data (pass ${R})
            var input_offset${R>0?R:""} = ${R===0?B.indicesToOffset(`${B.type.indices}(batch, row, word_offset)`):"input_offset"};
            var a_data${R>0?R:""}: ${Y};
            for (var j${R>0?R:""}: u32 = 0; j${R>0?R:""} < ${8/h}; j${R>0?R:""}++) {
              a_data${R>0?R:""}[j${R>0?R:""}] = ${B.getByOffset(`input_offset${R>0?R:""}`)};
              input_offset${R>0?R:""}++;
            }
          `;for(let ve=0;ve<g*b;ve++)C+=`
            b_value = ${f===1?`b${ve}_data`:`b${ve}_data[i]`};
            ${t.bits===2?`{
              let half_word = b_value >> ${R*16}u;
              let byte_lo = half_word & 0xFFu;
              let byte_hi = (half_word >> 8u) & 0xFFu;
              let spread_word = (byte_lo & 0xFu) | ((byte_lo >> 4u) << 8u) | ((byte_hi & 0xFu) << 16u) | ((byte_hi >> 4u) << 24u);
              b_value_lower = unpack4xU8(spread_word & b_mask);
              b_value_upper = unpack4xU8((spread_word >> 2u) & b_mask);
            }`:`b_value_lower = unpack4xU8((b_value >> ${ie}u) & b_mask);
            b_value_upper = unpack4xU8((b_value >> ${Se}u) & b_mask);`}
            b_quantized_values = ${Y}(${Array.from({length:4},(Ae,ge)=>`${H}(b_value_lower[${ge}]), ${H}(b_value_upper[${ge}])`).join(", ")});
            b_dequantized_values = ${h===1?`${Y}(${Array.from({length:8},(Ae,ge)=>`(b_quantized_values[${ge}] - ${Z?`zero_point${ve}`:"zero_point"}) * scale${ve}`).join(", ")});`:`(b_quantized_values - ${Y}(${Array(8).fill(`${Z?`zero_point${ve}`:"zero_point"}`).join(",")})) * scale${ve};`};
            workgroup_shared[local_id.x * ${b} + ${Math.floor(ve/g)}]${g>1?`[${ve%g}]`:""} += ${Array.from({length:8/h},(Ae,ge)=>`${h===1?`a_data${R>0?R:""}[${ge}] * b_dequantized_values[${ge}]`:`dot(a_data${R>0?R:""}[${ge}], b_dequantized_values[${ge}])`}`).join(" + ")};
          `}return C},L=()=>{let C=`
            var col_index = col * ${g};
            ${Z?`
            let zero_point_values_per_byte: u32 = ${Math.floor(8/t.bits)}u;
            let zero_point_bytes_per_col = (nBlocksPerCol + zero_point_values_per_byte - 1u) / zero_point_values_per_byte;
            var zero_point_byte_count: u32;
            var zero_point_word_index: u32;
            var zero_point_byte_offset: u32;
            let zero_point_sub_offset: u32 = block % zero_point_values_per_byte;
            var zero_point_bits_offset: u32;
            var zero_point_word: u32;`:`
            // The default zero point is ${Math.pow(2,t.bits-1)} for unsigned ${t.bits}-bit quantization.
            let zero_point = ${H}(${Math.pow(2,t.bits-1).toFixed(1)});`}
            `;for(let R=0;R<g*b;R++)C+=`
            let scale${R} = ${G.getByOffset("col_index * nBlocksPerCol + block")};
            ${Z?`
            zero_point_byte_count = col_index * zero_point_bytes_per_col + (block / zero_point_values_per_byte);
            zero_point_word_index = zero_point_byte_count >> 0x2u;
            zero_point_byte_offset = zero_point_byte_count & 0x3u;
            zero_point_bits_offset = (zero_point_byte_offset << 3) + (zero_point_sub_offset * ${t.bits}u);
            zero_point_word = ${Z.getByOffset("zero_point_word_index")} >> zero_point_bits_offset;
            let zero_point${R} = ${H}((zero_point_word) & ${t.bits===2?"0x3u":"0xFu"});`:""}
            col_index += 1;`;return C},re=()=>{let C=`col_index = col * ${g};`;for(let R=0;R<g*b;R++)C+=`
            let b${R}_data = ${U.getByIndices(`${U.type.indices}(col_index, block, word)`)};
            col_index += 1;`;return C+=`
            var b_value: u32;
            let b_mask: u32 = ${t.bits===2?"0x03030303u":"0x0F0F0F0Fu"};
            var b_value_lower: vec4<u32>;
            var b_value_upper: vec4<u32>;
            var b_quantized_values: ${Y};
            var b_dequantized_values: ${Y};`,C};return`
        var<workgroup> workgroup_shared: array<${P.type.value}, ${b*$}>;
        ${M.declareVariables(...V,P)}
        ${M.mainStart([$,1,1])}
          let output_indices = ${P.offsetToIndices(`(global_idx / ${$}) * ${b}`)};
          let col = output_indices[2];
          let row = output_indices[1];
          let batch = output_indices[0];
          let nBlocksPerCol = uniforms.b_shape[1];

          for (var block = local_id.x; block < nBlocksPerCol; block += ${$}) {
            //process one block
            var word_offset: u32 = block * ${t.blockSize/h};
            ${L()}
            for (var word: u32 = 0; word < ${d}; word += ${f}) {
              ${re()}
              for (var i: u32 = 0; i < ${f}; i++) {
                ${J()}
                word_offset += ${j/h};
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
        }`};return{name:"MatMulNBits",shaderCache:{hint:`${t.blockSize};${t.bits};${h};${f};${g};${b};${$}`,inputDependencies:Array(e.length).fill("rank")},getRunData:()=>({outputs:[{dims:m,dataType:c}],dispatchGroup:{x},programUniforms:w}),getShaderSource:z}},Pd=(e,t)=>{let r=e[0].dims,n=r.length,i=r[n-2],a=t.k,s=t.n,o=r.slice(0,n-2),l=D.size(o),d=e[1].dims[2]/4,c=e[0].dataType,h=Ne(t.k),f=Ne(d),g=o.concat([i,s]),m=128,b=s%8===0?8:s%4===0?4:1,x=m/b,$=Math.floor(32/t.bits),w=x*f*$,S=w/h,v=w/t.blockSize,E=D.size(g)/b,z=[],M=[l,i,a/h],k=D.convertShape(e[1].dims).slice();k.splice(-1,1,d/f),z.push(...oe(M)),z.push(...oe(k)),z.push(...oe(e[2].dims)),e.length===4&&z.push(...oe(D.convertShape(e[3].dims)));let B=[l,i,s];z.push(...oe(B));let U=G=>{let V=M.length,Z=W("a",e[0].dataType,V,h),O=W("b",12,k.length,f),P=W("scales",e[2].dataType,e[2].dims.length),H=[Z,O,P],Y=e.length===4?W("zero_points",12,e[3].dims.length):void 0;Y&&H.push(Y);let j=B.length,K=ne("output",e[0].dataType,j),J=De(e[0].dataType),L=()=>{switch(h){case 1:return`
          let a_data0 = vec4<${J}>(sub_a[word_offset], sub_a[word_offset + 1], sub_a[word_offset + 2], sub_a[word_offset + 3]);
          let a_data1 = vec4<${J}>(sub_a[word_offset + 4], sub_a[word_offset + 5], sub_a[word_offset + 6], sub_a[word_offset + 7]);`;case 2:return`
          let a_data0 = vec4<${J}>(sub_a[word_offset], sub_a[word_offset + 1]);
          let a_data1 = vec4<${J}>(sub_a[word_offset + 2], sub_a[word_offset + 3]);`;case 4:return`
          let a_data0 = sub_a[word_offset];
          let a_data1 = sub_a[word_offset + 1];`;default:throw new Error(`${h}-component is not supported.`)}};return`
        var<workgroup> sub_a: array<${Z.type.value}, ${S}>;
        var<workgroup> inter_results: array<array<${K.type.value}, ${x}>, ${b}>;
        ${G.declareVariables(...H,K)}
        ${G.mainStart([x,b,1])}
          let output_indices = ${K.offsetToIndices(`workgroup_index * ${b}`)};
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
                sub_a[a_offset] = ${Z.getByIndices(`${Z.type.indices}(batch, row, a_col)`)};
              } else {
                sub_a[a_offset] = ${Z.type.value}(0);
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
            let zero_point = ${J}((zero_point_word) & ${t.bits===2?"0x3u":"0xFu"});`:`
            // The default zero point is ${Math.pow(2,t.bits-1)} for unsigned ${t.bits}-bit quantization.
            let zero_point = ${J}(${Math.pow(2,t.bits-1).toFixed(1)});`}
            let scale = ${P.getByOffset("b_row * n_blocks_per_col + block")};
            let b_data = ${O.getByIndices(`${O.type.indices}(b_row, block, 0)`)};
            var word_offset = local_id.x * ${t.blockSize/h};
            for (var i: u32 = 0; i < ${f}; i++) {
              let b_value = ${f===1?"b_data":"b_data[i]"};
              ${(()=>{let re=Math.floor($/8),C="";for(let R=0;R<re;R++){let ie=R*t.bits*4,Se=ie+t.bits;C+=`
              ${L()}
              {${t.bits===2?`
                let half_word = b_value >> ${R*16}u;
                let byte_lo = half_word & 0xFFu;
                let byte_hi = (half_word >> 8u) & 0xFFu;
                let spread_word = (byte_lo & 0xFu) | ((byte_lo >> 4u) << 8u) | ((byte_hi & 0xFu) << 16u) | ((byte_hi >> 4u) << 24u);
                let b_value_lower = unpack4xU8(spread_word & 0x03030303u);
                let b_value_upper = unpack4xU8((spread_word >> 2u) & 0x03030303u);`:`
                let b_value_lower = unpack4xU8((b_value >> ${ie}u) & 0x0F0F0F0Fu);
                let b_value_upper = unpack4xU8((b_value >> ${Se}u) & 0x0F0F0F0Fu);`}
                let b_quantized_values = mat2x4<${J}>(${Array.from({length:4},(ve,Ae)=>`${J}(b_value_lower[${Ae}]), ${J}(b_value_upper[${Ae}])`).join(", ")});
                let b_dequantized_values = (b_quantized_values - mat2x4<${J}>(${Array(8).fill("zero_point").join(",")})) * scale;
                inter_results[local_id.y][local_id.x] += ${Array.from({length:2},(ve,Ae)=>`${`dot(a_data${Ae}, b_dequantized_values[${Ae}])`}`).join(" + ")};
              }
              word_offset += ${8/h};`}return C})()}
            }
            workgroupBarrier();
          }

          if (local_idx < ${b}) {
            var output_value: ${K.type.value} = ${K.type.value}(0);
            for (var b = 0u; b < ${x}; b++) {
              output_value += inter_results[local_idx][b];
            }
            if (col + local_idx < uniforms.output_shape[2])
            {
              ${K.setByIndices(`${K.type.indices}(batch, row, col + local_idx)`,"output_value")}
            }
          }
        }`};return{name:"BlockwiseMatMulNBits32",shaderCache:{hint:`${t.blockSize};${h};${f};${x};${b}`,inputDependencies:Array(e.length).fill("rank")},getRunData:()=>({outputs:[{dims:g,dataType:c}],dispatchGroup:{x:E},programUniforms:z}),getShaderSource:U}},fm=(e,t)=>{Bd(e.inputs,t),t.blockSize===32&&e.adapterInfo.isVendor("intel")&&e.adapterInfo.isArchitecture("gen-12lp")?e.compute(Pd(e.inputs,t)):e.compute(Dd(e.inputs,t))},mm=e=>we(e)}),Ld,Ud,jd,qd,Wd,Fd,Gd,Vd,gm,Hb=X(()=>{ue(),le(),de(),Ld=e=>{if(!e||e.length<1)throw new Error("Too few inputs");if(e[0].dataType!==1&&e[0].dataType!==10)throw new Error("Input type must be float or float16.");if(e.length>=2){let t=e[0].dims.length*2===e[1].dims[0];if(e.length===4&&(t=e[3].dims[0]*2===e[1].dims[0]),!t)throw new Error("The pads should be a 1D tensor of shape [2 * input_rank] or [2 * num_axes].")}},Ud=(e,t,r)=>{let n="";for(let i=t-1;i>=0;--i)n+=`
            k = i32(${e.indicesGet("indices",i)}) - ${ae("uniforms.pads",i,r)};
            if (k < 0) {
              break;
            }
            if (k >= i32(${ae("uniforms.x_shape",i,t)})) {
              break;
            }
            offset += k * i32(${ae("uniforms.x_strides",i,t)});
        `;return`
          value = ${e.type.value}(uniforms.constant_value);
          for (var i = 0; i < 1; i++) {
            var offset = 0;
            var k = 0;
            ${n}
            value = x[offset];
          }
      `},jd=(e,t,r)=>{let n="";for(let i=t-1;i>=0;--i)n+=`
                k = i32(${e.indicesGet("indices",i)}) - ${ae("uniforms.pads",i,r)};
                if (k < 0) {
                  k = -k;
                }
                {
                  let _2n_1 = 2 * (i32(${ae("uniforms.x_shape",i,t)}) - 1);
                  k = k % _2n_1;
                  if(k >= i32(${ae("uniforms.x_shape",i,t)})) {
                    k = _2n_1 - k;
                  }
                }
                offset += k * i32(${ae("uniforms.x_strides",i,t)});
            `;return`
              var offset = 0;
              var k = 0;
              ${n}
              value = x[offset];
          `},qd=(e,t,r)=>{let n="";for(let i=t-1;i>=0;--i)n+=`
                k = i32(${e.indicesGet("indices",i)}) - ${ae("uniforms.pads",i,r)};
                if (k < 0) {
                  k = 0;
                }
                if (k >= i32(${ae("uniforms.x_shape",i,t)})) {
                  k = i32(${ae("uniforms.x_shape",i,t)}) - 1;
                }
                offset += k * i32(${ae("uniforms.x_strides",i,t)});
            `;return`
              var offset = 0;
              var k = 0;
              ${n}
              value = x[offset];
          `},Wd=(e,t,r)=>{let n="";for(let i=t-1;i>=0;--i)n+=`
                k = i32(${e.indicesGet("indices",i)}) - ${ae("uniforms.pads",i,r)};
                if (k < 0)  {
                  k += i32(${ae("uniforms.x_shape",i,t)}]);
                }
                if (k >= i32(${ae("uniforms.x_shape",i,t)})) {
                  k -= i32(${ae("uniforms.x_shape",i,t)});
                }
                offset += k * i32(${ae("uniforms.x_strides",i,t)});
            `;return`
              var offset = 0;
              var k = 0;
              ${n}
              value = x[offset];
          `},Fd=(e,t,r)=>{switch(r.mode){case 0:return Ud(e,t,r.pads.length);case 1:return jd(e,t,r.pads.length);case 2:return qd(e,t,r.pads.length);case 3:return Wd(e,t,r.pads.length);default:throw new Error("Invalid mode")}},Gd=(e,t)=>{let r=D.padShape(e[0].dims.slice(),t.pads),n=e[0].dims,i=D.size(r),a=[{type:12,data:i},{type:6,data:t.pads}],s=e.length>=3&&e[2].data;t.mode===0&&a.push({type:s?e[2].dataType:1,data:t.value}),a.push(...oe(e[0].dims,r));let o=["rank"],l=d=>{let c=ne("output",e[0].dataType,r.length),h=W("x",e[0].dataType,n.length),f=h.type.value,g=Fd(c,n.length,t),m=[{name:"output_size",type:"u32"},{name:"pads",type:"i32",length:t.pads.length}];return t.mode===0&&m.push({name:"constant_value",type:s?f:"f32"}),`
            ${d.registerUniforms(m).declareVariables(h,c)}
            ${d.mainStart()}
            ${d.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}

            let indices = ${c.offsetToIndices("global_idx")};

            var value = ${f}(0);
            ${g}
            output[global_idx] = value;
        }`};return{name:"Pad",shaderCache:{hint:`${t.mode}${s}`,inputDependencies:o},getRunData:()=>({outputs:[{dims:r,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(D.size(r)/64)},programUniforms:a}),getShaderSource:l}},Vd=(e,t)=>{if(e.length>1){let r=e[1].getBigInt64Array(),n=e.length>=3&&e[2].data?e[2].dataType===10?e[2].getUint16Array()[0]:e[2].getFloat32Array()[0]:0,i=e[0].dims.length,a=new Int32Array(2*i).fill(0);if(e.length>=4){let o=e[3].getBigInt64Array();for(let l=0;l<o.length;l++)a[Number(o[l])]=Number(r[l]),a[Number(o[l])+i]=Number(r[l+o.length])}else r.forEach((o,l)=>a[Number(l)]=Number(o));let s=[];return a.forEach(o=>s.push(o)),{mode:t.mode,value:n,pads:s}}else return t},gm=(e,t)=>{Ld(e.inputs);let r=Vd(e.inputs,t);e.compute(Gd(e.inputs,r),{inputs:[0]})}}),Tr,ji,qi,Wi,Fi,Hd,Kd,Gi,Vi,ym,bm,Hi,_m,wm,Ki,$m,vm,xm,Sm,Kb=X(()=>{Je(),ue(),le(),de(),Tr=e=>{if(Ee.webgpu.validateInputContent&&(!e||e.length!==1))throw new Error("Pool ops requires 1 input.")},ji=(e,t,r)=>{let n=t.format==="NHWC",i=e.dims.slice();n&&i.splice(1,0,i.pop());let a=Object.hasOwnProperty.call(t,"dilations"),s=t.kernelShape.slice(),o=t.strides.slice(),l=a?t.dilations.slice():[],d=t.pads.slice();In.adjustPoolAttributes(r,i,s,o,l,d);let c=In.computePoolOutputShape(r,i,o,l,s,d,t.autoPad),h=Object.assign({},t);a?Object.assign(h,{kernelShape:s,strides:o,pads:d,dilations:l,cacheKey:t.cacheKey}):Object.assign(h,{kernelShape:s,strides:o,pads:d,cacheKey:t.cacheKey});let f=c.slice();return f.push(f.splice(1,1)[0]),[h,n?f:c]},qi=(e,t)=>{let r=t.format==="NHWC",n=D.size(e),i=D.size(t.kernelShape),a=[{type:12,data:n},{type:12,data:i}],s=[{name:"outputSize",type:"u32"},{name:"kernelSize",type:"u32"}];if(t.kernelShape.length<=2){let o=t.kernelShape[t.kernelShape.length-1],l=t.strides[t.strides.length-1],d=t.pads[t.pads.length/2-1],c=t.pads[t.pads.length-1],h=!!(d+c);a.push({type:12,data:o},{type:12,data:l},{type:12,data:d},{type:12,data:c}),s.push({name:"kw",type:"u32"},{name:"sw",type:"u32"},{name:"pwStart",type:"u32"},{name:"pwEnd",type:"u32"});let f=!1;if(t.kernelShape.length===2){let g=t.kernelShape[t.kernelShape.length-2],m=t.strides[t.strides.length-2],b=t.pads[t.pads.length/2-2],x=t.pads[t.pads.length-2];f=!!(b+x),a.push({type:12,data:g},{type:12,data:m},{type:12,data:b},{type:12,data:x}),s.push({name:"kh",type:"u32"},{name:"sh",type:"u32"},{name:"phStart",type:"u32"},{name:"phEnd",type:"u32"})}return[a,s,!0,h,f]}else{if(r)throw new Error("Pooling with kernelShape.length > 2 is not supported for NHWC format.");let o=D.computeStrides(t.kernelShape);a.push({type:12,data:o},{type:12,data:t.pads},{type:12,data:t.strides}),s.push({name:"kernelStrides",type:"u32",length:o.length},{name:"pads",type:"u32",length:t.pads.length},{name:"strides",type:"u32",length:t.strides.length});let l=t.pads.reduce((d,c)=>d+c);return[a,s,!!l,!1,!1]}},Wi=(e,t,r,n,i,a,s,o,l,d,c,h)=>{let f=i.format==="NHWC",g=t.type.value,m=ne("output",t.type.tensor,n);if(i.kernelShape.length<=2){let b="",x="",$="",w=r-(f?2:1);if(c?b=`
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
                }`,i.kernelShape.length===2){let S=r-(f?3:2);h?x=`
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

              var value = ${g}(${o});
              var pad = 0;
              ${x}
              ${b}
              ${$}
              ${s}

              output[global_idx] = value;
            }`}else{if(f)throw new Error("Pooling with kernelShape.length > 2 is not supported for NHWC format.");let b=i.kernelShape.length,x=i.pads.length,$="";return d?$=`
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
                  offsets[j] = offset / ${ae("uniforms.kernelStrides","j",b)};
                  offset -= offsets[j] * ${ae("uniforms.kernelStrides","j",b)};
                }
                offsets[${b-1}] = offset;

                isPad = false;
                for (var j = ${r-b}u; j < ${r}u; j++) {
                  xIndices[j] = indices[j] * ${ae("uniforms.strides",`j - ${r-b}u`,b)}
                    + offsets[j - ${r-b}u] - ${ae("uniforms.pads","j - 2u",x)};
                  ${$}
              }
              ${s}

              output[global_idx] = value;
            }`}},Fi=e=>`${e.format};${e.ceilMode};${e.autoPad};${e.kernelShape.length}`,Hd=e=>`${Fi(e)};${e.countIncludePad}`,Kd=e=>`${Fi(e)};${e.storageOrder};${e.dilations}`,Gi=e=>({format:e.format,autoPad:["NOTSET","VALID","SAME_UPPER","SAME_LOWER"][e.auto_pad],ceilMode:e.ceil_mode,kernelShape:e.kernel_shape,strides:e.strides,pads:e.pads}),Vi=(e,t,r,n)=>{let[i,a]=ji(t,n,r),s=W("x",t.dataType,t.dims.length),o=s.type.value,l="value += x_val;",d="";i.countIncludePad?d+=`value /= ${o}(uniforms.kernelSize);`:d+=`value /= ${o}(i32(uniforms.kernelSize) - pad);`;let[c,h,f,g,m]=qi(a,i);c.push(...oe(t.dims,a));let b=["rank"];return{name:e,shaderCache:{hint:`${n.cacheKey};${f};${g};${m}`,inputDependencies:b},getRunData:()=>({outputs:[{dims:a,dataType:t.dataType}],dispatchGroup:{x:Math.ceil(D.size(a)/64)},programUniforms:c}),getShaderSource:x=>Wi(x,s,t.dims.length,a.length,i,l,d,0,h,f,g,m)}},ym=e=>{let t=e.count_include_pad!==0,r=Gi(e);if(r.ceilMode!==0)throw new Error("using ceil() in shape computation is not yet supported for AveragePool");let n={countIncludePad:t,...r,cacheKey:""};return{...n,cacheKey:Hd(n)}},bm=(e,t)=>{Tr(e.inputs),e.compute(Vi("AveragePool",e.inputs[0],!1,t))},Hi={autoPad:"",ceilMode:0,countIncludePad:!1,kernelShape:[],strides:[],pads:[],storageOrder:0,dilations:[]},_m=e=>{let t=e.format;return{format:t,...Hi,cacheKey:t}},wm=(e,t)=>{Tr(e.inputs),e.compute(Vi("GlobalAveragePool",e.inputs[0],!0,t))},Ki=(e,t,r,n)=>{let[i,a]=ji(t,n,r),s=`
      value = max(x_val, value);
    `,o="",l=W("x",t.dataType,t.dims.length),d=["rank"],[c,h,f,g,m]=qi(a,i);return c.push(...oe(t.dims,a)),{name:e,shaderCache:{hint:`${n.cacheKey};${f};${g};${m}`,inputDependencies:d},getRunData:()=>({outputs:[{dims:a,dataType:t.dataType}],dispatchGroup:{x:Math.ceil(D.size(a)/64)},programUniforms:c}),getShaderSource:b=>Wi(b,l,t.dims.length,a.length,i,s,o,t.dataType===10?-65504:-1e5,h,f,g,m)}},$m=(e,t)=>{Tr(e.inputs),e.compute(Ki("MaxPool",e.inputs[0],!1,t))},vm=e=>{let t=e.storage_order,r=e.dilations,n=Gi(e);if(t!==0)throw new Error("column major storage order is not yet supported for MaxPool");if(n.ceilMode!==0)throw new Error("using ceil() in shape computation is not yet supported for MaxPool");let i={storageOrder:t,dilations:r,...n,cacheKey:""};return{...i,cacheKey:Kd(i)}},xm=e=>{let t=e.format;return{format:t,...Hi,cacheKey:t}},Sm=(e,t)=>{Tr(e.inputs),e.compute(Ki("GlobalMaxPool",e.inputs[0],!0,t))}}),Xd,Zd,km,Tm,Xb=X(()=>{ue(),le(),Oe(),de(),Xd=(e,t)=>{if(e.length<2||e.length>3)throw new Error("DequantizeLinear requires 2 or 3 inputs.");if(e.length===3&&e[1].dims===e[2].dims)throw new Error("x-scale and x-zero-point must have the same shape.");if(e.length===3&&e[0].dataType!==e[2].dataType)throw new Error("x and x-zero-point must have the same data type.");if(e[1].dims.length!==0&&e[1].dims.length!==1&&e[1].dims.length!==e[0].dims.length)throw new Error("scale input must be a scalar, a 1D tensor, or have the same rank as the input tensor.");if(e.length>2){if(e[0].dataType!==e[2].dataType)throw new Error("x and x-zero-point must have the same data type.");if(e[1].dims.length!==e[2].dims.length)throw new Error("scale and zero-point inputs must have the same rank.");if(!e[1].dims.map((r,n)=>r===e[2].dims[n]).reduce((r,n)=>r&&n,!0))throw new Error("scale and zero-point inputs must have the same shape.")}if(t.blockSize>0){if(e[1].dims.length===0||e[1].dims.length===1&&e[1].dims[0]===1)throw new Error("blockSize must be set only for block quantization.");if(!e[1].dims.map((i,a)=>a===t.axis||i===e[0].dims[a]).reduce((i,a)=>i&&a,!0))throw new Error("For block qunatization, scale input shape to match the input shape except for the axis");if(e[1].dims.length!==e[0].dims.length)throw new Error("For block qunatization the scale input rank must be the same as the x rank.");let r=e[0].dims[t.axis],n=e[1].dims[t.axis];if(t.blockSize<Math.ceil(r/n)||t.blockSize>Math.ceil(r/(n-1)-1))throw new Error("blockSize must be with in the range [ceil(dI / Si), ceil(dI / (Si - 1) - 1)].")}},Zd=(e,t)=>{let r=D.normalizeAxis(t.axis,e[0].dims.length),n=e[0].dataType,i=n===3,a=e[0].dims,s=e[1].dataType,o=D.size(a),l=n===3||n===2,d=l?[Math.ceil(D.size(e[0].dims)/4)]:e[0].dims,c=e[1].dims,h=e.length>2?e[2]:void 0,f=h?l?[Math.ceil(D.size(h.dims)/4)]:h.dims:void 0,g=c.length===0||c.length===1&&c[0]===1,m=g===!1&&c.length===1,b=Ne(o),x=g&&(!l||b===4),$=x?b:1,w=x&&!l?b:1,S=W("input",l?12:n,d.length,w),v=W("scale",s,c.length),E=h?W("zero_point",l?12:n,f.length):void 0,z=ne("output",s,a.length,$),M=[S,v];E&&M.push(E);let k=[d,c];h&&k.push(f);let B=[{type:12,data:o/$},{type:12,data:r},{type:12,data:t.blockSize},...oe(...k,a)],U=G=>{let V=[{name:"output_size",type:"u32"},{name:"axis",type:"u32"},{name:"block_size",type:"u32"}];return`
      ${G.registerUniforms(V).declareVariables(...M,z)}
      ${G.mainStart()}
          ${G.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
          let output_indices = ${z.offsetToIndices("global_idx")};

          // Set input x
          ${l?`
            let input = ${S.getByOffset("global_idx / 4")};
            let x_vec = ${i?"unpack4xI8(input)":"unpack4xU8(input)"};
            let x_value = ${$===1?"x_vec[global_idx % 4]":"x_vec"};`:`let x_value = ${S.getByOffset("global_idx")};`};

          // Set scale input
          ${g?`let scale_value= ${v.getByOffset("0")}`:m?`
            let scale_index = ${z.indicesGet("output_indices","uniforms.axis")};
            let scale_value= ${v.getByOffset("scale_index")};`:`
            var scale_indices: ${v.type.indices} = output_indices;
            let index = ${v.indicesGet("scale_indices","uniforms.axis")} / uniforms.block_size;
            ${v.indicesSet("scale_indices","uniforms.axis","index")};
            let scale_value= ${v.getByIndices("scale_indices")};`};

          // Set zero-point input
          ${E?g?l?`
                let zero_point_input = ${E.getByOffset("0")};
                let zero_point_vec =  ${i?"unpack4xI8(zero_point_input)":"unpack4xU8(zero_point_input)"};
                let zero_point_value= zero_point_vec[0]`:`let zero_point_value = ${E.getByOffset("0")}`:m?l?`
                let zero_point_index = ${z.indicesGet("output_indices","uniforms.axis")};
                let zero_point_input = ${E.getByOffset("zero_point_index / 4")};
                let zero_point_vec =  ${i?"unpack4xI8(zero_point_input)":"unpack4xU8(zero_point_input)"};
                let zero_point_value = zero_point_vec[zero_point_index % 4]`:`
                let zero_point_index = ${z.indicesGet("output_indices","uniforms.axis")};
                let zero_point_value = ${E.getByOffset("zero_point_index")};`:l?`
                let zero_point_offset = ${v.indicesToOffset("scale_indices")};
                let zero_point_input = ${E.getByOffset("zero_point_offset / 4")};
                let zero_point_vec = ${i?"unpack4xI8(zero_point_input)":"unpack4xU8(zero_point_input)"};
                let zero_point_value = zero_point_vec[zero_point_offset % 4];`:`let zero_point_value = ${E.getByIndices("scale_indices")};`:`let zero_point_value = ${l?i?"i32":"u32":S.type.value}(0);`};
      // Compute and write output
      ${z.setByOffset("global_idx",`${z.type.value}(x_value - zero_point_value) * scale_value`)};
      }`};return{name:"DequantizeLinear",shaderCache:{hint:t.cacheKey,inputDependencies:E?["rank","rank","rank"]:["rank","rank"]},getShaderSource:U,getRunData:()=>({outputs:[{dims:a,dataType:s}],dispatchGroup:{x:Math.ceil(o/$/64),y:1,z:1},programUniforms:B})}},km=(e,t)=>{Xd(e.inputs,t),e.compute(Zd(e.inputs,t))},Tm=e=>we({axis:e.axis,blockSize:e.blockSize})}),Yd,Qd,Em,Zb=X(()=>{Je(),ue(),de(),Yd=(e,t,r)=>{let n=e===t,i=e<t&&r<0,a=e>t&&r>0;if(n||i||a)throw new Error("Range these inputs' contents are invalid.")},Qd=(e,t,r,n)=>{let i=Math.abs(Math.ceil((t-e)/r)),a=[i],s=i,o=[{type:12,data:s},{type:n,data:e},{type:n,data:r},...oe(a)],l=d=>{let c=ne("output",n,a.length),h=c.type.value,f=[{name:"outputSize",type:"u32"},{name:"start",type:h},{name:"delta",type:h}];return`
        ${d.registerUniforms(f).declareVariables(c)}
        ${d.mainStart()}
        ${d.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}
        output[global_idx] = uniforms.start + ${h}(global_idx) * uniforms.delta;
      }`};return{name:"Range",shaderCache:{hint:`${n}`},getShaderSource:l,getRunData:()=>({outputs:[{dims:a,dataType:n}],dispatchGroup:{x:Math.ceil(s/64)},programUniforms:o})}},Em=e=>{let t=0,r=0,n=0;e.inputs[0].dataType===6?(t=e.inputs[0].getInt32Array()[0],r=e.inputs[1].getInt32Array()[0],n=e.inputs[2].getInt32Array()[0]):e.inputs[0].dataType===1&&(t=e.inputs[0].getFloat32Array()[0],r=e.inputs[1].getFloat32Array()[0],n=e.inputs[2].getFloat32Array()[0]),Ee.webgpu.validateInputContent&&Yd(t,r,n),e.compute(Qd(t,r,n,e.inputs[0].dataType),{inputs:[]})}}),Jd,ec,Im,Cm,Yb=X(()=>{ue(),le(),Oe(),de(),Jd=(e,t,r,n)=>{if(e!=="none"&&n!=="i32"&&n!=="u32"&&n!=="f32")throw new Error(`Input ${n} is not supported with reduction ${e}.`);let i=`{
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
              }`;switch(e){case"none":return`${t}=${r};`;case"add":return n==="i32"||n==="u32"?`atomicAdd(&${t}, bitcast<${n}>(${r}));`:`
              ${i}bitcast<${n}>(oldValue) + (${r})${a}`;case"max":return n==="i32"||n==="u32"?`atomicMax(&${t}, bitcast<${n}>(${r}));`:`
                ${i}max(bitcast<f32>(oldValue), (${r}))${a}`;case"min":return n==="i32"||n==="u32"?`atomicMin(&${t}, bitcast<${n}>(${r}));`:`${i}min(bitcast<${n}>(oldValue), (${r}))${a}`;case"mul":return`${i}(bitcast<${n}>(oldValue) * (${r}))${a}`;default:throw new Error(`Reduction ${e} is not supported.`)}},ec=(e,t)=>{let r=e[0].dims,n=e[1].dims,i=r,a=1,s=Math.ceil(D.sizeToDimension(n,n.length-1)/a),o=n[n.length-1],l=D.sizeFromDimension(r,o),d=[{type:12,data:s},{type:12,data:o},{type:12,data:l},...oe(e[1].dims,e[2].dims,i)],c=h=>{let f=W("indices",e[1].dataType,e[1].dims.length),g=W("updates",e[2].dataType,e[2].dims.length,a),m=t.reduction!=="none"&&t.reduction!==""?rh("output",e[0].dataType,i.length):ne("output",e[0].dataType,i.length,a);return`
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
    ${Jd(t.reduction,"output[data_offset + i]","value",m.type.value)}
  }

      }`};return{name:"ScatterND",shaderCache:{hint:`${t.cacheKey}_${t.reduction}`,inputDependencies:["rank","rank"]},getRunData:()=>({outputs:[{dims:i,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(s/64)},programUniforms:d}),getShaderSource:c}},Im=e=>we({reduction:e.reduction}),Cm=(e,t)=>{e.compute(ec(e.inputs,t),{inputs:[e.inputs[1],e.inputs[2]],outputs:[]})}}),tc,rc,nc,Xi,ic,ac,sc,oc,uc,lc,dc,cc,Zi,pc,hc,fc,mc,gc,zm,Am,Qb=X(()=>{ue(),le(),Oe(),de(),tc=(e,t)=>{if(e.every(r=>r>0||(()=>{throw new Error("Resize requires scales input values to be positive")})),e.length>0){if(t.mode==="linear"){if(!(e.length===2||e.length===3||e.length===4&&e[0]===1&&e[1]===1||e.length===4&&e[0]===1&&e[3]===1||e.length===5&&e[0]===1&&e[1]===1))throw new Error(`For linear mode, Resize requires scales to be 2D, 3D, 4D with either two outermost or one innermost and
            one outermost scale values equal to 1, or 5D with two outermost scale values equal to 1`)}else if(t.mode==="cubic"&&!(e.length===2||e.length===4&&e[0]===1&&e[1]===1||e.length===4&&e[0]===1&&e[3]===1))throw new Error("Resize requires scales input size to be 2 or 4 for cubic mode")}},rc=(e,t,r)=>{t.every(i=>i>=0&&i<r||(()=>{throw new Error("Resize requires axes input values to be positive and less than rank")}));let n=new Array(r).fill(1);return t.forEach((i,a)=>n[i]=e[a]),n},nc=(e,t,r,n,i,a)=>{let[s,o,l]=r>10?[1,2,3]:[-1,e.length>1?1:-1,-1],d=e[0].dims.length;if(s>0&&e.length>s&&e[s].dims.length>0)e[s].getFloat32Array().forEach(c=>a.push(c));else if(t.coordinateTransformMode==="tf_crop_and_resize")throw new Error("Resize requires RoI input to be specified when coordinateTransformMode is tfCropAndResize");if(o>0&&e.length>o&&e[o].dims.length===1&&e[o].dims[0]>0){if(e[o].getFloat32Array().forEach(c=>n.push(c)),n.length!==0&&n.length!==d&&r>=18&&n.length!==t.axes.length)throw new Error("Resize requires scales input size to be same as input rank or axes size for opset 18 and up");tc(n,t),t.axes.length>0&&rc(n,t.axes,d).forEach((c,h)=>n[h]=c)}if(l>0&&e.length>l&&e[l].dims.length===1&&e[l].dims[0]>0&&(e[l].getBigInt64Array().forEach(c=>i.push(Number(c))),i.length!==0&&i.length!==d&&r>=18&&i.length!==t.axes.length))throw new Error("Resize requires sizes input size to be same as input rank or axes size for opset 18 and up");if(t.axes.length>0){if(n.length!==0&&n.length!==t.axes.length)throw new Error('Resize requires "scales" input size to be of axes rank when axes attributes is specified');if(i.length!==0&&i.length!==t.axes.length)throw new Error('Resize requires "sizes" input size to be of rank axes rank when axes attributes is specified')}if(typeof n<"u"&&typeof i<"u"&&n.length>0&&i.length>d)throw new Error("Resize requires only of scales or sizes to be specified")},Xi=(e,t,r,n)=>`
  // The whole part and the fractional part are calculated separately due to inaccuracy of floating
  // point division. As an example, f32(21) / f32(7) may evaluate to 2.99... instead of 3, causing an
  // offset-by-one error later in floor().
  let big = (${e}) * (${t});
  let whole = ${n}(big / (${r}));
  let fract = ${n}(big % (${r})) / ${n}(${r});
  return whole + fract;
`,ic=(e,t)=>`fn getOriginalCoordinateFromResizedCoordinate(xResized: u32, xScale: f32, lengthResized: u32,
     lengthOriginal: u32, roiStart: f32, roiEnd: f32) -> ${t} { `+(()=>{switch(e){case"asymmetric":return`
          if (xScale < 1.0 || floor(xScale) != xScale) {
            return ${t}(xResized) / ${t}(xScale);
          } else {
            ${Xi("xResized","lengthOriginal","lengthResized",t)}
          }
        `;case"pytorch_half_pixel":return`if (lengthResized > 1) {
                    return (${t}(xResized) + 0.5) / ${t}(xScale) - 0.5;
                  } else {
                    return 0.0;
                  }`;case"tf_half_pixel_for_nn":return`return (${t}(xResized) + 0.5) / ${t}(xScale);`;case"align_corners":return`if (lengthResized == 1) {
                    return 0.0;
                  } else {
                    ${Xi("xResized","lengthOriginal - 1","lengthResized - 1",t)}
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
                  return offset + ((${t}(xResized) + 0.5) / ${t}(xScale)) - 0.5;`;case"half_pixel":return`return ((${t}(xResized) + 0.5) / ${t}(xScale)) - 0.5;`;default:throw new Error(`Coordinate transform mode ${e} is not supported`)}})()+"}",ac=(e,t,r)=>`fn getNearestPixelFromOriginal(xOriginal: ${r}, isDownSample: bool) -> ${r} {`+(()=>{switch(e){case"round_prefer_ceil":return"if (fract(xOriginal) == 0.5) {             return ceil(xOriginal);           } else {             return round(xOriginal);           }";case"floor":return"return floor(xOriginal);";case"ceil":return"return ceil(xOriginal);";case"round_prefer_floor":return"if (fract(xOriginal) == 0.5) {                     return floor(xOriginal);                   } else {                     return round(xOriginal);                   }";default:if(t<11)return"if (isDownSample)                     {                       return ceil(xOriginal);                     } else {                       return xOriginal;                     }";throw new Error(`Nearest mode ${e} is not supported`)}})()+"}",sc=(e,t,r)=>{let n=new Array(r).fill(0).concat(new Array(r).fill(1)),i=e.length===0?n:e.slice();return t.length>0?(t.forEach((a,s)=>{n[a]=i[s],n[s+r]=i[t.length+s]}),n):i},oc=(e,t,r,n)=>{let i=[];if(r.length>0)if(n.length>0){if(e.forEach(a=>i.push(a)),Math.max(...n)>e.length)throw new Error("axes is out of bound");n.forEach((a,s)=>i[a]=r[s])}else r.forEach(a=>i.push(a));else{if(t.length===0)throw new Error("Resize requires either scales or sizes.");i=e.map((a,s)=>Math.round(a*t[s]))}return i},uc=(e,t,r)=>{let n=(()=>{switch(r.keepAspectRatioPolicy){case"not_larger":return r.axes.length>0?Math.min(...r.axes.map(a=>t[a]),Number.MAX_VALUE):Math.min(...t,Number.MAX_VALUE);case"not_smaller":return r.axes.length>0?Math.max(...r.axes.map(a=>t[a]),Number.MIN_VALUE):Math.max(...t,Number.MIN_VALUE);default:throw new Error(`Keep aspect ratio policy ${r.keepAspectRatioPolicy} is not supported`)}})();t.fill(1,0,t.length);let i=e.slice();return r.axes.length>0?(r.axes.forEach(a=>t[a]=n),r.axes.forEach(a=>i[a]=Math.round(e[a]*t[a]))):(t.fill(n,0,t.length),i.forEach((a,s)=>i[s]=Math.round(a*t[s]))),i},lc=(e,t,r,n,i)=>`
    fn calculateOriginalIndicesFromOutputIndices(output_indices: ${e.type.indices}) -> array<${e.type.value}, ${r.length}> {
      var original_indices: array<${e.type.value}, ${r.length}>;
      for (var i:u32 = 0; i < ${r.length}; i++) {
        var output_index = ${e.indicesGet("output_indices","i")};
        var scale = ${ae("uniforms.scales","i",n)};
        var roi_low = ${ae("uniforms.roi","i",i)};
        var roi_hi = ${ae("uniforms.roi",`i + ${t.length}`,i)};
        if (scale == 1.0) {
          original_indices[i] = ${e.type.value}(output_index);
        } else {
          var input_shape_i = ${ae("uniforms.input_shape","i",t.length)};
          var output_shape_i = ${ae("uniforms.output_shape","i",r.length)};
          original_indices[i] = getOriginalCoordinateFromResizedCoordinate(output_index, scale, output_shape_i,
                                                                           input_shape_i, roi_low, roi_hi);
        }
      }
      return original_indices;
    }`,dc=(e,t,r,n,i,a,s)=>`
    fn calculateInputIndicesFromOutputIndices(output_indices: ${t.type.indices}) -> ${e.type.indices} {
      var input_indices: ${e.type.indices};
      for (var i:u32 = 0; i < ${n.length}; i++) {
        var output_index = ${t.indicesGet("output_indices","i")};
        var input_index: u32;
        var scale = ${ae("uniforms.scales","i",i)};
        if (scale == 1.0) {
          input_index = output_index;
        } else {
          var roi_low = ${ae("uniforms.roi","i",a)};
          var roi_hi = ${ae("uniforms.roi",`i + ${r.length}`,a)};
          var input_shape_i = ${ae("uniforms.input_shape","i",r.length)};
          var output_shape_i = ${ae("uniforms.output_shape","i",n.length)};
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
    }`,cc=(e,t)=>`
    fn checkInputIndices(input_indices: ${e.type.indices}) -> bool {
      for (var i:u32 = 0; i < ${t.length}; i++) {
        var input_index = ${e.indicesGet("input_indices","i")};
        if (input_index < 0 || input_index >= ${ae("uniforms.input_shape","i",t.length)}) {
          return false;
        }
      }
      return true;
    }`,Zi=(e,t,r,n)=>e.rank>n?`
    ${e.indicesSet("input_indices",t,"channel")};
    ${e.indicesSet("input_indices",r,"batch")};
`:"",pc=(e,t,r,n,i)=>{let[a,s,o,l]=r.length===2?[-1,0,1,-1]:[0,2,3,1],d=e.type.value;return`
    fn getInputValue(batch: u32, channel: u32, row: u32, col: u32) -> ${d} {
      var input_indices: ${e.type.indices};
      ${e.indicesSet("input_indices",s,`max(0, min(row, ${r[s]} - 1))`)};
      ${e.indicesSet("input_indices",o,`max(0, min(col, ${r[o]} - 1))`)};
      ${Zi(e,l,a,2)}
      return ${e.getByIndices("input_indices")};
    }

    fn bilinearInterpolation(output_indices: ${t.type.indices}) -> ${d} {
      var originalIndices = calculateOriginalIndicesFromOutputIndices(output_indices);
      var row:${d} = originalIndices[${s}];
      var col:${d} = originalIndices[${o}];
      ${n?`if (row < 0 || row > (${r[s]} - 1) || col < 0 || col > (${r[o]} - 1)) {
        return ${i};
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
    }`},hc=(e,t,r,n,i,a,s,o,l,d)=>{let c=r.length===2,[h,f]=c?[0,1]:[2,3],g=e.type.value,m=b=>{let x=b===h?"row":"col";return`
      fn ${x}CubicInterpolation(input_indices: ${e.type.indices}, output_indices: ${t.type.indices}) -> ${g} {
        var output_index = ${t.indicesGet("output_indices",b)};
        var originalIdx: ${g} = getOriginalCoordinateFromResizedCoordinate(output_index, ${i[b]},
        ${n[b]}, ${r[b]}, ${a[b]}, ${a[b]} + ${r.length});
        var fractOriginalIdx: ${g} = originalIdx - floor(originalIdx);
        var coefs = getCubicInterpolationCoefs(fractOriginalIdx);

        if (${o} && (originalIdx < 0 || originalIdx > (${r[b]} - 1))) {
          return ${l};
        }
        var data: array<${g}, 4> = array<${g}, 4>(0.0, 0.0, 0.0, 0.0);
        for (var i: i32 = -1; i < 3; i++) {
          var ${x}: ${g} = originalIdx + ${g}(i);
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
    `},fc=(e,t,r,n,i)=>{let[a,s,o,l,d]=r.length===3?[-1,0,1,2,-1]:[0,2,3,4,1],c=e.type.value;return`
    fn getInputValue(batch: u32, channel: u32, depth:u32, height: u32, width: u32) -> ${c} {
      var input_indices: ${e.type.indices};
      ${e.indicesSet("input_indices",s,`max(0, min(depth, ${r[s]} - 1))`)};
      ${e.indicesSet("input_indices",o,`max(0, min(height, ${r[o]} - 1))`)};
      ${e.indicesSet("input_indices",l,`max(0, min(width, ${r[l]} - 1))`)};
      ${Zi(e,d,a,3)}
      return ${e.getByIndices("input_indices")};
    }

    fn trilinearInterpolation(output_indices: ${t.type.indices}) -> ${c} {
      var originalIndices = calculateOriginalIndicesFromOutputIndices(output_indices);
      var depth:${c} = originalIndices[${s}];
      var height:${c} = originalIndices[${o}];
      var width:${c} = originalIndices[${l}];
      ${n?`if (depth < 0 || depth > (${r[s]} - 1) || height < 0 || height > (${r[o]} - 1) || width < 0 || (width > ${r[l]} - 1)) {
      return ${i};
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

      var x111: ${c} = getInputValue(batch, channel, depth1, height1, width1);
      var x112: ${c} = getInputValue(batch, channel, depth1, height1, width2);
      var x121: ${c} = getInputValue(batch, channel, depth1, height2, width1);
      var x122: ${c} = getInputValue(batch, channel, depth1, height2, width2);
      var x211: ${c} = getInputValue(batch, channel, depth2, height1, width1);
      var x212: ${c} = getInputValue(batch, channel, depth2, height1, width2);
      var x221: ${c} = getInputValue(batch, channel, depth2, height2, width1);
      var x222: ${c} = getInputValue(batch, channel, depth2, height2, width2);
      var dx1: ${c} = abs(depth - ${c}(depth1));
      var dx2: ${c} = abs(${c}(depth2) - depth);
      var dy1: ${c} = abs(height - ${c}(height1));
      var dy2: ${c} = abs(${c}(height2) - height);
      var dz1: ${c} = abs(width - ${c}(width1));
      var dz2: ${c} = abs(${c}(width2) - width);
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
    }`},mc=(e,t,r,n,i,a)=>{let s=e.dims,o=sc(a,t.axes,s.length),l=oc(s,n,i,t.axes),d=n.slice();n.length===0&&(d=s.map((w,S)=>w===0?1:l[S]/w),t.keepAspectRatioPolicy!=="stretch"&&(l=uc(s,d,t)));let c=ne("output",e.dataType,l.length),h=W("input",e.dataType,s.length),f=D.size(l),g=s.length===l.length&&s.every((w,S)=>w===l[S]),m=t.coordinateTransformMode==="tf_crop_and_resize",b=t.extrapolationValue,x=h.type.value,$=w=>`
      ${g?"":`
      ${ic(t.coordinateTransformMode,x)};
      ${(()=>{switch(t.mode){case"nearest":return`
              ${cc(h,s)};
              ${ac(t.nearestMode,r,x)};
              ${dc(h,c,s,l,d.length,o.length,m)};
              `;case"linear":return`
              ${lc(c,s,l,d.length,o.length)};
              ${(()=>{if(s.length===2||s.length===4)return`${pc(h,c,s,m,b)}`;if(s.length===3||s.length===5)return`${fc(h,c,s,m,b)}`;throw Error("Linear mode only supports input dims 2, 3, 4 and 5 are supported in linear mode.")})()};
            `;case"cubic":return`
            ${(()=>{if(s.length===2||s.length===4)return`${hc(h,c,s,l,d,o,t.cubicCoeffA,m,t.extrapolationValue,t.excludeOutside)}`;throw Error("Cubic mode only supports input dims 2 and 4 are supported in linear mode.")})()};
            `;default:throw Error("Invalid resize mode")}})()};
      `}
      ${w.registerUniform("output_size","u32").registerUniform("scales","f32",d.length).registerUniform("roi","f32",o.length).declareVariables(h,c)}
      ${w.mainStart()}
        ${w.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
        ${g?"output[global_idx] = input[global_idx];":`
        let output_indices = ${c.offsetToIndices("global_idx")};
        var input_indices: ${h.type.indices};
        ${(()=>{switch(t.mode){case"nearest":return`input_indices = calculateInputIndicesFromOutputIndices(output_indices);
                if (checkInputIndices(input_indices)) {
                  output[global_idx] = ${h.getByIndices("input_indices")};
                } else {
                  output[global_idx] = ${t.extrapolationValue};
                }`;case"linear":return`output[global_idx] = ${s.length===2||s.length===4?"bilinearInterpolation":"trilinearInterpolation"}(output_indices);`;case"cubic":return"output[global_idx] = bicubicInterpolation(output_indices);";default:throw Error(`Unsupported resize mode: ${t.mode}`)}})()};
`}
      }`;return{name:"Resize",shaderCache:{hint:`${t.cacheKey}|${r}|${d.length>0?t.mode==="cubic"?d:d.length:""}|${i.length>0?i:""}|${o.length>0?o:""}|${g}|${t.mode==="nearest"?s.length:s}`,inputDependencies:["rank"]},getShaderSource:$,getRunData:()=>({outputs:[{dims:l,dataType:e.dataType}],dispatchGroup:{x:Math.ceil(f/64)},programUniforms:[{type:12,data:f},{type:1,data:d},{type:1,data:o},...oe(s,l)]})}},gc=e=>{let t=e.customDataBuffer;return new Uint32Array(t.buffer,t.byteOffset,1)[0]},zm=(e,t)=>{let r=[],n=[],i=[],a=gc(e);if(t.antialias!==0)throw Error("Only default value (0) for Antialias attribute is supported");nc(e.inputs,t,a,r,n,i),e.compute(mc(e.inputs[0],t,a,r,n,i),{inputs:[0]})},Am=e=>{let t=e.antialias,r=e.axes,n=e.coordinateTransformMode,i=e.cubicCoeffA,a=e.excludeOutside!==0,s=e.extrapolationValue,o=e.keepAspectRatioPolicy,l=e.mode,d=e.nearestMode===""?"simple":e.nearestMode;return we({antialias:t,axes:r,coordinateTransformMode:n,cubicCoeffA:i,excludeOutside:a,extrapolationValue:s,keepAspectRatioPolicy:o,mode:l,nearestMode:d})}}),yc,bc,Mm,Jb=X(()=>{ue(),le(),de(),yc=e=>{if(!e||e.length<3)throw new Error("layerNorm requires at least 3 inputs.");let t=e[0],r=e[1],n=e[2];if(t.dataType!==r.dataType||t.dataType!==n.dataType)throw new Error("All inputs must have the same data type");if(t.dims.length!==3&&t.dims.length!==2)throw new Error("Input must be 2D or 3D");if(r.dims.length!==3&&r.dims.length!==2)throw new Error("Skip must be 2D or 3D");let i=t.dims[t.dims.length-1],a=t.dims[t.dims.length-2];if(r.dims[r.dims.length-1]!==i)throw new Error("Skip must have the same hidden size as input");if(r.dims[r.dims.length-2]!==a)throw new Error("Skip must have the same sequence length as input");if(n.dims.length!==1)throw new Error("Gamma must be 1D");if(n.dims[n.dims.length-1]!==i)throw new Error("Gamma must have the same hidden size as input");if(e.length>3){let s=e[3];if(s.dims.length!==1)throw new Error("Beta must be 1D");if(s.dims[s.dims.length-1]!==i)throw new Error("Beta must have the same hidden size as input")}if(e.length>4){let s=e[4];if(s.dims.length!==1)throw new Error("Bias must be 1D");if(s.dims[s.dims.length-1]!==i)throw new Error("Bias must have the same hidden size as input")}},bc=(e,t,r,n)=>{let i=t.simplified,a=e[0].dims,s=D.size(a),o=a,l=s,d=a.slice(-1)[0],c=n?a.slice(0,-1).concat(1):[],h=!i&&e.length>3,f=e.length>4,g=n&&r>1,m=n&&r>2,b=r>3,x=64,$=Ne(d),w=[{type:12,data:l},{type:12,data:$},{type:12,data:d},{type:1,data:t.epsilon}],S=E=>{let z=[{name:"output_size",type:"u32"},{name:"components",type:"u32"},{name:"hidden_size",type:"u32"},{name:"epsilon",type:"f32"}],M=[W("x",e[0].dataType,e[0].dims,$),W("skip",e[1].dataType,e[1].dims,$),W("gamma",e[2].dataType,e[2].dims,$)];h&&M.push(W("beta",e[3].dataType,e[3].dims,$)),f&&M.push(W("bias",e[4].dataType,e[4].dims,$)),M.push(ne("output",e[0].dataType,o,$)),g&&M.push(ne("mean_output",1,c)),m&&M.push(ne("inv_std_output",1,c)),b&&M.push(ne("input_skip_bias_sum",e[0].dataType,o,$));let k=De(e[0].dataType),B=De(1,$);return`

      ${E.registerUniforms(z).declareVariables(...M)}
      var<workgroup> sum_shared : array<${B}, ${x}>;
      var<workgroup> sum_squared_shared : array<${B}, ${x}>;

      ${E.mainStart([x,1,1])}
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
          let f32_value = ${dr(k,$,"value")};
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
        let mean = ${Rt("sum",$)} / f32(uniforms.hidden_size);
        let inv_std_dev = inverseSqrt(${Rt("square_sum",$)} / f32(uniforms.hidden_size) ${i?"":"- mean * mean"} + uniforms.epsilon);
        ${g?"mean_output[global_idx] = mean;":""}
        ${m?"inv_std_output[global_idx] = inv_std_dev;":""}

        for (var i: u32 = 0; i < stride; i++) {
          output[offset + i] = (output[offset + i] ${i?"":`- ${k}(mean)`}) *
            ${k}(inv_std_dev) * gamma[offset1d + i]
            ${h?"+ beta[offset1d + i]":""};
        }
      }`},v=[{dims:o,dataType:e[0].dataType}];return r>1&&v.push({dims:c,dataType:1}),r>2&&v.push({dims:c,dataType:1}),r>3&&v.push({dims:a,dataType:e[0].dataType}),{name:"SkipLayerNormalization",shaderCache:{hint:`${$};${g};${m};${b}`,inputDependencies:e.map((E,z)=>"type")},getShaderSource:S,getRunData:()=>({outputs:v,dispatchGroup:{x:Math.ceil(l/d)},programUniforms:w})}},Mm=(e,t)=>{yc(e.inputs);let r=[0];e.outputCount>1&&r.push(-3),e.outputCount>2&&r.push(-3),e.outputCount>3&&r.push(3),e.compute(bc(e.inputs,t,e.outputCount,!1),{outputs:r})}}),_c,Er,wc,Yi,$c,vc,Nm,Om,e_=X(()=>{ue(),le(),Oe(),de(),_c=(e,t)=>{if(!e||e.length<1)throw new Error("too few inputs");if(t.axes.length!==0){if(t.axes.length!==t.starts.length||t.axes.length!==t.ends.length)throw new Error("axes, starts and ends must have the same length")}else if(t.starts.length!==t.ends.length)throw new Error("starts and ends must have the same length");e.slice(1).forEach((r,n)=>{if(e[n+1].dataType!==6&&e[n+1].dataType!==7)throw new Error(`Input ${n} must be an array of int32 or int64`)})},Er=(e,t)=>{let r=[];if(e.length>t)if(e[t].dataType===7)e[t].getBigInt64Array().forEach(n=>r.push(Number(n)));else if(e[t].dataType===6)e[t].getInt32Array().forEach(n=>r.push(Number(n)));else throw new Error(`Input ${t} must be an array of int32 or int64`);return r},wc=(e,t)=>{if(e.length>1){let r=Er(e,1),n=Er(e,2),i=Er(e,3);return i.length===0&&(i=[...Array(e[0].dims.length).keys()]),we({starts:r,ends:n,axes:i})}else return t},Yi=(e,t,r,n,i)=>{let a=e;return e<0&&(a+=r[n[t]]),i[t]<0?Math.max(0,Math.min(a,r[n[t]]-1)):Math.max(0,Math.min(a,r[n[t]]))},$c=(e,t,r)=>`fn calculateInputIndices(output_indices: ${t.type.indices}) -> ${e.type.indices} {
          var input_indices: ${e.type.indices};
          var carry = 0u;
          for (var i = ${r.length-1}; i >= 0; i--) {
            let input_shape_i = ${ae("uniforms.input_shape","i",r.length)};
            let steps_i = ${ae("uniforms.steps","i",r.length)};
            let signs_i = ${ae("uniforms.signs","i",r.length)};
            let starts_i = ${ae("uniforms.starts","i",r.length)};
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
      }`,vc=(e,t)=>{let r=e[0].dims,n=D.size(r),i=t.axes.length>0?D.normalizeAxes(t.axes,r.length):[...Array(r.length).keys()],a=Er(e,4);a.forEach($=>$!==0||(()=>{throw new Error("step cannot be 0")})),a.length===0&&(a=Array(i.length).fill(1));let s=t.starts.map(($,w)=>Yi($,w,r,i,a)),o=t.ends.map(($,w)=>Yi($,w,r,i,a));if(i.length!==s.length||i.length!==o.length)throw new Error("start, ends and axes should have the same number of elements");if(i.length!==r.length)for(let $=0;$<r.length;++$)i.includes($)||(s.splice($,0,0),o.splice($,0,r[$]),a.splice($,0,1));let l=a.map($=>Math.sign($));a.forEach(($,w,S)=>{if($<0){let v=(o[w]-s[w])/$,E=s[w],z=E+v*a[w];s[w]=z,o[w]=E,S[w]=-$}});let d=r.slice(0);i.forEach(($,w)=>{d[$]=Math.ceil((o[$]-s[$])/a[$])});let c={dims:d,dataType:e[0].dataType},h=ne("output",e[0].dataType,d.length),f=W("input",e[0].dataType,e[0].dims.length),g=D.size(d),m=[{name:"outputSize",type:"u32"},{name:"starts",type:"u32",length:s.length},{name:"signs",type:"i32",length:l.length},{name:"steps",type:"u32",length:a.length}],b=[{type:12,data:g},{type:12,data:s},{type:6,data:l},{type:12,data:a},...oe(e[0].dims,d)],x=$=>`
      ${$.registerUniforms(m).declareVariables(f,h)}
        ${$c(f,h,r)}
        ${$.mainStart()}
          ${$.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}
          let output_indices = ${h.offsetToIndices("global_idx")};
          let input_indices = calculateInputIndices(output_indices);
          ${h.setByOffset("global_idx",f.getByIndices("input_indices"))}
      }`;return{name:"Slice",shaderCache:{hint:`${l.length}_${s.length}_${a.length}`,inputDependencies:["rank"]},getShaderSource:x,getRunData:()=>({outputs:[c],dispatchGroup:{x:Math.ceil(n/64)},programUniforms:b})}},Nm=(e,t)=>{_c(e.inputs,t);let r=wc(e.inputs,t);e.compute(vc(e.inputs,r),{inputs:[0]})},Om=e=>{let t=e.starts,r=e.ends,n=e.axes;return we({starts:t,ends:r,axes:n})}}),xc,Sc,Rm,Bm,t_=X(()=>{ue(),le(),Oe(),Bt(),de(),xc=e=>{if(!e||e.length!==1)throw new Error("Softmax op requires 1 input.")},Sc=(e,t)=>{let r=e.inputs[0],n=r.dims,i=D.size(n),a=n.length,s=D.normalizeAxis(t.axis,a),o=s<n.length-1,l,d=[];o?(d=Array.from({length:a},(M,k)=>k),d[s]=a-1,d[a-1]=s,l=e.compute(Xe(r,d),{inputs:[r],outputs:[-1]})[0]):l=r;let c=l.dims,h=c[a-1],f=i/h,g=Ne(h),m=h/g,b=64;f===1&&(b=256);let x=(M,k)=>k===4?`max(max(${M}.x, ${M}.y), max(${M}.z, ${M}.w))`:k===2?`max(${M}.x, ${M}.y)`:k===3?`max(max(${M}.x, ${M}.y), ${M}.z)`:M,$=W("x",l.dataType,l.dims,g),w=ne("result",l.dataType,l.dims,g),S=$.type.value,v=De(l.dataType)==="f32"?`var threadMax = ${S}(-3.4028234663852886e+38f);`:`var threadMax = ${S}(-65504.0h);`,E=M=>`
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
      ${M.registerUniform("packedCols","i32").declareVariables($,w)}
      ${M.mainStart(b)}
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
          rowMaxShared = ${S}(${x("threadShared[0]",g)});
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
          rowSumShared = ${S}(${Rt("threadShared[0]",g)});
        }
        workgroupBarrier();

        // calculate final value for each element in the row
        for (var col = lindex; col < cols; col += wg) {
          var value = exp(getValue(row, col, row_stride) - rowMaxShared) / rowSumShared;
          // max operation protects against NaN since all values should be >=0
          value = max(value, ${S}(0.0));
          setValue(row, col, row_stride, value);
        }
      }`,z=e.compute({name:"Softmax",shaderCache:{hint:`${g};${b}`,inputDependencies:["type"]},getRunData:()=>({outputs:[{dims:c,dataType:l.dataType}],dispatchGroup:{x:f},programUniforms:[{type:6,data:m}]}),getShaderSource:E},{inputs:[l],outputs:[o?-1:0]})[0];o&&e.compute(Xe(z,d),{inputs:[z]})},Rm=(e,t)=>{xc(e.inputs),Sc(e,t)},Bm=e=>we({axis:e.axis})}),Qi,kc,Tc,Ec,Dm,r_=X(()=>{ue(),le(),de(),Qi=e=>Array.from(e.getBigInt64Array(),Number),kc=e=>{if(!e||e.length!==2)throw new Error("Tile requires 2 inputs.");if(e[0].dataType!==1&&e[0].dataType!==10&&e[0].dataType!==6&&e[0].dataType!==12)throw new Error("Tile only support float, float16, int32, and uint32 data types");if(e[1].dataType!==7)throw new Error("Tile `repeats` input should be of int64 data type");if(e[1].dims.length!==1)throw new Error("Tile `repeats` input should be 1-D");if(Qi(e[1]).length!==e[0].dims.length)throw new Error("Tile `repeats` input should have same number of elements as rank of input data tensor")},Tc=(e,t)=>{let r=[];for(let n=0;n<e.length;++n)r.push(e[n]*t[n]);return r},Ec=(e,t)=>{let r=e[0].dims,n=t??Qi(e[1]),i=Tc(r,n),a=D.size(i),s=e[0].dataType,o=W("input",s,r.length),l=ne("output",s,i.length),d=c=>`
      const inputShape = ${o.indices(...r)};
      ${c.registerUniform("output_size","u32").declareVariables(o,l)}
      ${c.mainStart()}
      ${c.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
      let output_indices = ${l.offsetToIndices("global_idx")};
      var input_indices: ${o.type.indices};
      for (var i = 0; i < ${r.length}; i++) {
        let input_dim_i = ${o.indicesGet("uniforms.input_shape","i")};
        let input_dim_value = ${l.indicesGet("output_indices","i")}  % input_dim_i;

        ${o.indicesSet("input_indices","i","input_dim_value")}
      }
      ${l.setByOffset("global_idx",o.getByIndices("input_indices"))}
    }`;return{name:"Tile",shaderCache:{hint:`${n}`,inputDependencies:["rank"]},getRunData:()=>({outputs:[{dims:i,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(a/64)},programUniforms:[{type:12,data:a},...oe(e[0].dims,i)]}),getShaderSource:d}},Dm=e=>{kc(e.inputs),e.compute(Ec(e.inputs),{inputs:[0]})}}),Ic,Cc,Pm,n_=X(()=>{ue(),le(),de(),Ic=(e,t,r,n,i)=>{let a=ne("output_data",i,r.length,4),s=W("a_data",t[1].dataType,t[1].dims.length,4),o=W("b_data",t[2].dataType,t[2].dims.length,4),l=W("c_data",t[0].dataType,t[0].dims.length,4),d,c=(h,f,g)=>`select(${f}, ${h}, ${g})`;if(!n)d=a.setByOffset("global_idx",c(s.getByOffset("global_idx"),o.getByOffset("global_idx"),l.getByOffset("global_idx")));else{let h=(f,g,m="")=>{let b=`a_data[index_a${g}][component_a${g}]`,x=`b_data[index_b${g}][component_b${g}]`,$=`bool(c_data[index_c${g}] & (0xffu << (component_c${g} * 8)))`;return`
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
            ${f}[${g}] = ${m}(${c(b,x,$)});
          `};i===9?d=`
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
      }`},Cc=e=>{let t=e[1].dims,r=e[2].dims,n=e[0].dims,i=e[1].dataType,a=!(D.areEqual(t,r)&&D.areEqual(r,n)),s=t,o=D.size(t);if(a){let d=pr.calcShape(pr.calcShape(t,r,!1),n,!1);if(!d)throw new Error("Can't perform where op on the given tensors");s=d,o=D.size(s)}let l=Math.ceil(o/4);return{name:"Where",shaderCache:{inputDependencies:["rank","rank","rank"]},getShaderSource:d=>Ic(d,e,s,a,i),getRunData:()=>({outputs:[{dims:s,dataType:i}],dispatchGroup:{x:Math.ceil(o/64/4)},programUniforms:[{type:12,data:l},...oe(n,t,r,s)]})}},Pm=e=>{e.compute(Cc(e.inputs))}}),Lm,i_=X(()=>{bb(),Xa(),_b(),wb(),$b(),vb(),xb(),Ib(),zb(),Ab(),Mb(),Nb(),Ob(),Rb(),Bb(),Db(),Pb(),Lb(),Ub(),jb(),qb(),Wb(),Fb(),Gb(),Vb(),im(),Hb(),Kb(),Xb(),Zb(),Yb(),Ka(),Qb(),lm(),Jb(),e_(),t_(),om(),r_(),Bt(),Za(),n_(),Lm=new Map([["Abs",[Ah]],["Acos",[Mh]],["Acosh",[Nh]],["Add",[ff]],["ArgMax",[Eh,$a]],["ArgMin",[Th,$a]],["Asin",[Oh]],["Asinh",[Rh]],["Atan",[Bh]],["Atanh",[Dh]],["Attention",[Ih]],["AveragePool",[bm,ym]],["BatchNormalization",[Ch]],["BiasAdd",[zh]],["BiasSplitGelu",[hf]],["Cast",[Lh,Ph]],["Ceil",[jh]],["Clip",[Uh]],["Concat",[Sf,kf]],["Conv",[Ea,Ta]],["ConvTranspose",[Rf,Of]],["Cos",[qh]],["Cosh",[Wh]],["CumSum",[Bf,Df]],["DepthToSpace",[Pf,Lf]],["DequantizeLinear",[km,Tm]],["Div",[mf]],["Einsum",[Uf,jf]],["Elu",[Fh,Or]],["Equal",[gf]],["Erf",[Gh]],["Exp",[Vh]],["Expand",[qf]],["FastGelu",[Wf]],["Floor",[Hh]],["FusedConv",[Ea,Ta]],["Gather",[Gf,Ff]],["GatherElements",[Yf,Zf]],["GatherBlockQuantized",[Kf,Xf]],["GatherND",[Vf,Hf]],["Gelu",[Kh]],["Gemm",[Jf,Qf]],["GlobalAveragePool",[wm,_m]],["GlobalMaxPool",[Sm,xm]],["Greater",[wf]],["GreaterOrEqual",[vf]],["GridSample",[em,tm]],["GroupQueryAttention",[dm]],["HardSigmoid",[rf,tf]],["InstanceNormalization",[cm]],["LayerNormalization",[pm]],["LeakyRelu",[Xh,Or]],["Less",[$f]],["LessOrEqual",[xf]],["Log",[cf]],["MatMul",[hm]],["MatMulNBits",[fm,mm]],["MaxPool",[$m,vm]],["Mul",[yf]],["MultiHeadAttention",[nm,rm]],["Neg",[Yh]],["Not",[Zh]],["Pad",[gm]],["Pow",[bf]],["QuickGelu",[pf,Or]],["Range",[Em]],["Reciprocal",[Qh]],["ReduceMin",[$h]],["ReduceMean",[gh]],["ReduceMax",[wh]],["ReduceSum",[xh]],["ReduceProd",[vh]],["ReduceL1",[yh]],["ReduceL2",[bh]],["ReduceLogSum",[kh]],["ReduceLogSumExp",[_h]],["ReduceSumSquare",[Sh]],["Relu",[Jh]],["Resize",[zm,Am]],["RotaryEmbedding",[um]],["ScatterND",[Cm,Im]],["Sigmoid",[ef]],["Sin",[nf]],["Sinh",[af]],["Slice",[Nm,Om]],["SkipLayerNormalization",[Mm]],["Split",[am,sm]],["Sqrt",[sf]],["Softmax",[Rm,Bm]],["Sub",[_f]],["Tan",[of]],["Tanh",[uf]],["ThresholdedRelu",[df,Or]],["Tile",[Dm]],["Transpose",[ih,ah]],["Where",[Pm]]])}),Um,a_=X(()=>{Je(),xt(),de(),Um=class{constructor(e){this.backend=e,this.repo=new Map,this.attributesBound=!1}getArtifact(e){return this.repo.get(e)}setArtifact(e,t){this.repo.set(e,t)}run(e,t,r,n,i){bt(e.programInfo.name);let a=this.backend.device,s=this.backend.getComputePassEncoder();this.backend.writeTimestamp(this.backend.pendingDispatchNumber*2);let o=[];for(let d of t)o.push({binding:o.length,resource:{buffer:d.buffer}});for(let d of r)o.push({binding:o.length,resource:{buffer:d.buffer}});i&&o.push({binding:o.length,resource:i});let l=a.createBindGroup({layout:e.computePipeline.getBindGroupLayout(0),entries:o,label:e.programInfo.name});if(this.backend.sessionStatus==="capturing"){let d={kernelId:this.backend.currentKernelId,computePipeline:e.computePipeline,bindGroup:l,dispatchGroup:n};this.backend.capturedCommandList.get(this.backend.currentSessionId).push(d)}s.setPipeline(e.computePipeline),s.setBindGroup(0,l),s.dispatchWorkgroups(...n),this.backend.writeTimestamp(this.backend.pendingDispatchNumber*2+1),this.backend.pendingDispatchNumber++,(this.backend.pendingDispatchNumber>=this.backend.maxDispatchNumber||this.backend.queryType==="at-passes")&&this.backend.endComputePass(),this.backend.pendingDispatchNumber>=this.backend.maxDispatchNumber&&this.backend.flush(),dt(e.programInfo.name)}dispose(){}build(e,t){bt(e.name);let r=this.backend.device,n=[];[{feature:"shader-f16",extension:"f16"},{feature:"subgroups",extension:"subgroups"}].forEach(d=>{r.features.has(d.feature)&&n.push(`enable ${d.extension};`)});let i=nh(t,this.backend.device.limits),a=e.getShaderSource(i),s=`${n.join(`
`)}
${i.additionalImplementations}
${a}`,o=r.createShaderModule({code:s,label:e.name});ye("verbose",()=>`[WebGPU] ${e.name} shader code: ${s}`);let l=r.createComputePipeline({compute:{module:o,entryPoint:"main"},layout:"auto",label:e.name});return dt(e.name),{programInfo:e,computePipeline:l,uniformVariablesInfo:i.variablesInfo}}normalizeDispatchGroupSize(e){let t=typeof e=="number"?e:e.x,r=typeof e=="number"?1:e.y||1,n=typeof e=="number"?1:e.z||1,i=this.backend.device.limits.maxComputeWorkgroupsPerDimension;if(t<=i&&r<=i&&n<=i)return[t,r,n];let a=t*r*n,s=Math.ceil(Math.sqrt(a));if(s>i){if(s=Math.ceil(Math.cbrt(a)),s>i)throw new Error("Total dispatch size exceeds WebGPU maximum.");return[s,s,s]}else return[s,s,1]}}}),jm={};fr(jm,{WebGpuBackend:()=>qm});var zc,Ac,Mc,qm,s_=X(()=>{Je(),ue(),xt(),Qp(),gb(),i_(),a_(),zc=(e,t)=>{if(t.length!==e.length)throw new Error(`inputDependencies length ${t.length} is not equal to inputTensors length ${e.length}.`);let r=[];for(let n=0;n<e.length;++n){let i=e[n].dataType;switch(t[n]){case"none":{r.push("");break}case"type":{r.push(`${i}`);break}case"rank":{let a=e[n].dims.length;r.push(`${i};${a}`);break}case"dims":{let a=e[n].dims.join(",");r.push(`${i};${a}`);break}default:throw new Error(`unsupported input dependency: ${t[n]}`)}}return r.join("|")},Ac=(e,t,r)=>{let n=e.name;return e.shaderCache?.hint&&(n+="["+e.shaderCache.hint+"]"),n+=":"+r+`:${zc(t,e.shaderCache?.inputDependencies??new Array(t.length).fill("dims"))}`,n},Mc=class{constructor(e){e&&(this.architecture=e.architecture,this.vendor=e.vendor)}isArchitecture(e){return this.architecture===e}isVendor(e){return this.vendor===e}},qm=class{constructor(){this.currentSessionId=null,this.currentKernelId=null,this.commandEncoder=null,this.computePassEncoder=null,this.maxDispatchNumber=16,this.pendingDispatchNumber=0,this.pendingKernels=[],this.pendingQueries=new Map,this.sessionStatus="default",this.capturedCommandList=new Map,this.capturedPendingKernels=new Map,this.sessionExternalDataMapping=new Map}get currentKernelCustomData(){if(this.currentKernelId===null)throw new Error("currentKernelCustomData(): currentKernelId is null. (should not happen)");let e=this.kernelCustomData.get(this.currentKernelId);return e||(e={},this.kernelCustomData.set(this.currentKernelId,e)),e}async initialize(e,t){this.env=e;let r=[],n={requiredLimits:{maxComputeWorkgroupStorageSize:t.limits.maxComputeWorkgroupStorageSize,maxComputeWorkgroupsPerDimension:t.limits.maxComputeWorkgroupsPerDimension,maxStorageBufferBindingSize:t.limits.maxStorageBufferBindingSize,maxBufferSize:t.limits.maxBufferSize,maxComputeInvocationsPerWorkgroup:t.limits.maxComputeInvocationsPerWorkgroup,maxComputeWorkgroupSizeX:t.limits.maxComputeWorkgroupSizeX,maxComputeWorkgroupSizeY:t.limits.maxComputeWorkgroupSizeY,maxComputeWorkgroupSizeZ:t.limits.maxComputeWorkgroupSizeZ},requiredFeatures:r},i=o=>t.features.has(o)&&r.push(o)&&!0;i("chromium-experimental-timestamp-query-inside-passes")||i("timestamp-query"),i("shader-f16"),i("subgroups"),this.device=await t.requestDevice(n);let a=t,s=t.info??(typeof a.requestAdapterInfo=="function"?await a.requestAdapterInfo():void 0);this.adapterInfo=new Mc(s),this.gpuDataManager=th(this),this.programManager=new Um(this),this.kernels=new Map,this.kernelPersistentData=new Map,this.kernelCustomData=new Map,Fa(e.logLevel,!!e.debug),this.device.onuncapturederror=o=>{o.error instanceof GPUValidationError&&console.error(`An uncaught WebGPU validation error was raised: ${o.error.message}`)},Object.defineProperty(this.env.webgpu,"device",{value:this.device,writable:!1,enumerable:!0,configurable:!0}),Object.defineProperty(this.env.webgpu,"adapter",{value:t,writable:!1,enumerable:!0,configurable:!1}),this.setQueryType()}dispose(){typeof this.querySet<"u"&&this.querySet.destroy(),this.gpuDataManager.dispose(),this.device&&this.env?.webgpu&&this.device.lost.then(()=>{delete this.env.webgpu.device})}getCommandEncoder(){return this.commandEncoder||(this.commandEncoder=this.device.createCommandEncoder()),this.commandEncoder}getComputePassEncoder(){if(!this.computePassEncoder){let e=this.getCommandEncoder(),t={};this.queryType==="at-passes"&&(t.timestampWrites={querySet:this.querySet,beginningOfPassWriteIndex:this.pendingDispatchNumber*2,endOfPassWriteIndex:this.pendingDispatchNumber*2+1}),this.computePassEncoder=e.beginComputePass(t)}return this.computePassEncoder}endComputePass(){this.computePassEncoder&&(this.computePassEncoder.end(),this.computePassEncoder=null)}flush(){if(!this.commandEncoder)return;bt(),this.endComputePass();let e;this.queryType!=="none"&&(this.commandEncoder.resolveQuerySet(this.querySet,0,this.pendingDispatchNumber*2,this.queryResolveBuffer,0),e=this.device.createBuffer({size:this.pendingDispatchNumber*2*8,usage:GPUBufferUsage.MAP_READ|GPUBufferUsage.COPY_DST}),this.pendingQueries.set(e,this.pendingKernels),this.pendingKernels=[],this.commandEncoder.copyBufferToBuffer(this.queryResolveBuffer,0,e,0,this.pendingDispatchNumber*2*8)),this.device.queue.submit([this.commandEncoder.finish()]),this.gpuDataManager.refreshPendingBuffers(),this.commandEncoder=null,this.pendingDispatchNumber=0,this.queryType!=="none"&&e.mapAsync(GPUMapMode.READ).then(()=>{let t=new BigUint64Array(e.getMappedRange()),r=this.pendingQueries.get(e);for(let n=0;n<t.length/2;n++){let i=r[n],a=i.kernelId,s=this.kernels.get(a),o=s.kernelType,l=s.kernelName,d=i.programName,c=i.inputTensorViews,h=i.outputTensorViews,f=t[n*2],g=t[n*2+1];typeof this.queryTimeBase>"u"&&(this.queryTimeBase=f);let m=Number(f-this.queryTimeBase),b=Number(g-this.queryTimeBase);if(!Number.isSafeInteger(m)||!Number.isSafeInteger(b))throw new RangeError("incorrect timestamp range");if(this.env.webgpu.profiling?.ondata)this.env.webgpu.profiling.ondata({version:1,inputsMetadata:c.map(x=>({dims:x.dims,dataType:vt(x.dataType)})),outputsMetadata:h.map(x=>({dims:x.dims,dataType:vt(x.dataType)})),kernelId:a,kernelType:o,kernelName:l,programName:d,startTime:m,endTime:b});else{let x="";c.forEach((w,S)=>{x+=`input[${S}]: [${w.dims}] | ${vt(w.dataType)}, `});let $="";h.forEach((w,S)=>{$+=`output[${S}]: [${w.dims}] | ${vt(w.dataType)}, `}),console.log(`[profiling] kernel "${a}|${o}|${l}|${d}" ${x}${$}start time: ${m} ns, execution time: ${b-m} ns`)}kn("GPU",`${d}::${f}::${g}`)}e.unmap(),this.pendingQueries.delete(e)}),dt()}run(e,t,r,n,i,a){bt(e.name);let s=[];for(let w=0;w<t.length;++w){let S=t[w].data;if(S===0)continue;let v=this.gpuDataManager.get(S);if(!v)throw new Error(`no GPU data for input: ${S}`);s.push(v)}let{outputs:o,dispatchGroup:l,programUniforms:d}=e.getRunData(t),c=r.length===0?o.map((w,S)=>S):r;if(c.length!==o.length)throw new Error(`Output size ${c.length} must be equal to ${o.length}.`);let h=[],f=[];for(let w=0;w<o.length;++w){if(!Number.isInteger(c[w])||c[w]<-3||c[w]>=a)throw new Error(`Invalid output index: ${c[w]}`);if(c[w]===-3)continue;let S=c[w]===-1,v=c[w]===-2,E=S||v?i(o[w].dataType,o[w].dims):n(c[w],o[w].dataType,o[w].dims);if(h.push(E),E.data===0)continue;let z=this.gpuDataManager.get(E.data);if(!z)throw new Error(`no GPU data for output: ${E.data}`);if(S&&this.temporaryData.push(z),v){let M=this.kernelPersistentData.get(this.currentKernelId);M||(M=[],this.kernelPersistentData.set(this.currentKernelId,M)),M.push(z)}f.push(z)}if(s.length!==t.length||f.length!==h.length){if(f.length===0)return dt(e.name),h;throw new Error(`Program ${e.name} has zero-sized tensor(s) in inputs or outputs. This is not supported now.`)}let g;if(d){let w=0,S=[];d.forEach(M=>{let k=typeof M.data=="number"?[M.data]:M.data;if(k.length===0)return;let B=M.type===10?2:4,U,G;M.type===10?(G=k.length>4?16:k.length>2?8:k.length*B,U=k.length>4?16:B*k.length):(G=k.length<=2?k.length*B:16,U=16),w=Math.ceil(w/G)*G,S.push(w);let V=M.type===10?8:4;w+=k.length>4?Math.ceil(k.length/V)*U:k.length*B});let v=16;w=Math.ceil(w/v)*v;let E=new ArrayBuffer(w);d.forEach((M,k)=>{let B=S[k],U=typeof M.data=="number"?[M.data]:M.data;if(M.type===6)new Int32Array(E,B,U.length).set(U);else if(M.type===12)new Uint32Array(E,B,U.length).set(U);else if(M.type===10)new Uint16Array(E,B,U.length).set(U);else if(M.type===1)new Float32Array(E,B,U.length).set(U);else throw new Error(`Unsupported uniform type: ${vt(M.type)}`)});let z=this.gpuDataManager.create(w,GPUBufferUsage.COPY_DST|GPUBufferUsage.UNIFORM);this.device.queue.writeBuffer(z.buffer,0,E,0,w),this.gpuDataManager.release(z.id),g={offset:0,size:w,buffer:z.buffer}}let m=this.programManager.normalizeDispatchGroupSize(l),b=m[1]===1&&m[2]===1,x=Ac(e,t,b),$=this.programManager.getArtifact(x);if($||($=this.programManager.build(e,m),this.programManager.setArtifact(x,$),ye("info",()=>`[artifact] key: ${x}, programName: ${e.name}`)),d&&$.uniformVariablesInfo){if(d.length!==$.uniformVariablesInfo.length)throw new Error(`Uniform variables count mismatch: expect ${$.uniformVariablesInfo.length}, got ${d.length} in program "${$.programInfo.name}".`);for(let w=0;w<d.length;w++){let S=d[w],v=S.type,E=typeof S.data=="number"?1:S.data.length,[z,M]=$.uniformVariablesInfo[w];if(v!==z||E!==M)throw new Error(`Uniform variable ${w} mismatch: expect type ${z} with size ${M}, got type ${v} with size ${E} in program "${$.programInfo.name}".`)}}if(ye("info",()=>`[ProgramManager] run "${e.name}" (key=${x}) with ${m[0]}x${m[1]}x${m[2]}`),this.queryType!=="none"||this.sessionStatus==="capturing"){let w={kernelId:this.currentKernelId,programName:$.programInfo.name,inputTensorViews:t,outputTensorViews:h};this.pendingKernels.push(w),this.sessionStatus==="capturing"&&this.capturedPendingKernels.get(this.currentSessionId).push(w)}return this.programManager.run($,s,f,m,g),dt(e.name),h}upload(e,t){this.gpuDataManager.upload(e,t)}memcpy(e,t){this.gpuDataManager.memcpy(e,t)}async download(e,t){await this.gpuDataManager.download(e,t)}alloc(e){return this.gpuDataManager.create(e).id}free(e){return this.gpuDataManager.release(e)}createKernel(e,t,r,n){let i=Lm.get(e);if(!i)throw new Error(`kernel not implemented: ${e}`);let a={kernelType:e,kernelName:n,kernelEntry:i[0],attributes:[i[1],r]};this.kernels.set(t,a)}releaseKernel(e){let t=this.kernelPersistentData.get(e);if(t){for(let r of t)this.gpuDataManager.release(r.id);this.kernelPersistentData.delete(e)}this.kernelCustomData.delete(e),this.kernels.delete(e)}computeKernel(e,t,r){let n=this.kernels.get(e);if(!n)throw new Error(`kernel not created: ${e}`);let i=n.kernelType,a=n.kernelName,s=n.kernelEntry,o=n.attributes;if(this.currentKernelId!==null)throw new Error(`kernel "[${i}] ${a}" is not allowed to be called recursively`);this.currentKernelId=e,o[0]&&(o[1]=o[0](o[1]),o[0]=void 0),ye("info",()=>`[WebGPU] Start to run kernel "[${i}] ${a}"...`);let l=this.env.debug;this.temporaryData=[];try{return l&&this.device.pushErrorScope("validation"),s(t,o[1]),0}catch(d){return r.push(Promise.resolve(`[WebGPU] Kernel "[${i}] ${a}" failed. ${d}`)),1}finally{l&&r.push(this.device.popErrorScope().then(d=>d?`GPU validation error for kernel "[${i}] ${a}": ${d.message}`:null));for(let d of this.temporaryData)this.gpuDataManager.release(d.id);this.temporaryData=[],this.currentKernelId=null}}registerBuffer(e,t,r,n){let i=this.sessionExternalDataMapping.get(e);i||(i=new Map,this.sessionExternalDataMapping.set(e,i));let a=i.get(t),s=this.gpuDataManager.registerExternalBuffer(r,n,a);return i.set(t,[s,r]),s}unregisterBuffers(e){let t=this.sessionExternalDataMapping.get(e);t&&(t.forEach(r=>this.gpuDataManager.unregisterExternalBuffer(r[0])),this.sessionExternalDataMapping.delete(e))}getBuffer(e){let t=this.gpuDataManager.get(e);if(!t)throw new Error(`no GPU data for buffer: ${e}`);return t.buffer}createDownloader(e,t,r){return async()=>{let n=await ba(this,e,t);return Ga(n.buffer,r)}}writeTimestamp(e){this.queryType==="inside-passes"&&this.computePassEncoder.writeTimestamp(this.querySet,e)}setQueryType(){this.queryType="none",(this.env.webgpu.profiling?.mode==="default"||(typeof this.env.trace>"u"?this.env.wasm.trace:this.env.trace))&&(this.device.features.has("chromium-experimental-timestamp-query-inside-passes")?this.queryType="inside-passes":this.device.features.has("timestamp-query")&&(this.queryType="at-passes"),this.queryType!=="none"&&typeof this.querySet>"u"&&(this.querySet=this.device.createQuerySet({type:"timestamp",count:this.maxDispatchNumber*2}),this.queryResolveBuffer=this.device.createBuffer({size:this.maxDispatchNumber*2*8,usage:GPUBufferUsage.COPY_SRC|GPUBufferUsage.QUERY_RESOLVE})))}captureBegin(){ye("info","captureBegin"),this.capturedCommandList.get(this.currentSessionId)||this.capturedCommandList.set(this.currentSessionId,[]),this.capturedPendingKernels.get(this.currentSessionId)||this.capturedPendingKernels.set(this.currentSessionId,[]),this.flush(),this.sessionStatus="capturing"}captureEnd(){ye("info","captureEnd"),this.flush(),this.sessionStatus="default"}replay(){ye("info","replay"),this.sessionStatus="replaying";let e=this.capturedCommandList.get(this.currentSessionId),t=this.capturedPendingKernels.get(this.currentSessionId),r=e.length;this.pendingKernels=[];for(let n=0;n<r;n++){let i=this.getComputePassEncoder(),a=e[n];this.writeTimestamp(this.pendingDispatchNumber*2),i.setPipeline(a.computePipeline),i.setBindGroup(0,a.bindGroup),i.dispatchWorkgroups(...a.dispatchGroup),this.writeTimestamp(this.pendingDispatchNumber*2+1),this.pendingDispatchNumber++,this.queryType!=="none"&&this.pendingKernels.push(t[n]),(this.pendingDispatchNumber>=this.maxDispatchNumber||this.queryType==="at-passes")&&this.endComputePass(),this.pendingDispatchNumber>=this.maxDispatchNumber&&this.flush()}this.flush(),this.sessionStatus="default"}onCreateSession(){this.gpuDataManager.onCreateSession()}onReleaseSession(e){this.unregisterBuffers(e),this.capturedCommandList.has(e)&&this.capturedCommandList.delete(e),this.capturedPendingKernels.has(e)&&this.capturedPendingKernels.delete(e),this.gpuDataManager.onReleaseSession(e)}onRunStart(e){this.currentSessionId=e,this.setQueryType()}}}),Wm={};fr(Wm,{init:()=>Fm});var pn,Nc,Fm,o_=X(()=>{ue(),xt(),le(),mb(),pn=class Gm{constructor(t,r,n,i){this.module=t,this.dataType=r,this.data=n,this.dims=i}getFloat32Array(){if(this.dataType!==1)throw new Error("Invalid data type");let t=D.size(this.dims);return t===0?new Float32Array:new Float32Array(this.module.HEAP8.buffer,this.data,t)}getBigInt64Array(){if(this.dataType!==7)throw new Error("Invalid data type");let t=D.size(this.dims);return t===0?new BigInt64Array:new BigInt64Array(this.module.HEAP8.buffer,this.data,t)}getInt32Array(){if(this.dataType!==6)throw new Error("Invalid data type");let t=D.size(this.dims);return t===0?new Int32Array:new Int32Array(this.module.HEAP8.buffer,this.data,t)}getUint16Array(){if(this.dataType!==10&&this.dataType!==4)throw new Error("Invalid data type");let t=D.size(this.dims);return t===0?new Uint16Array:new Uint16Array(this.module.HEAP8.buffer,this.data,t)}reshape(t){if(D.size(t)!==D.size(this.dims))throw new Error("Invalid new shape");return new Gm(this.module,this.dataType,this.data,t)}},Nc=class{constructor(e,t,r){this.module=e,this.backend=t,this.customDataOffset=0,this.customDataSize=0,this.adapterInfo=t.adapterInfo;let n=e.PTR_SIZE,i=r/e.PTR_SIZE,a=n===4?"i32":"i64";this.opKernelContext=Number(e.getValue(n*i++,a));let s=Number(e.getValue(n*i++,a));this.outputCount=Number(e.getValue(n*i++,a)),this.customDataOffset=Number(e.getValue(n*i++,"*")),this.customDataSize=Number(e.getValue(n*i++,a));let o=[];for(let l=0;l<s;l++){let d=Number(e.getValue(n*i++,a)),c=Number(e.getValue(n*i++,"*")),h=Number(e.getValue(n*i++,a)),f=[];for(let g=0;g<h;g++)f.push(Number(e.getValue(n*i++,a)));o.push(new pn(e,d,c,f))}this.inputs=o}get kernelCustomData(){return this.backend.currentKernelCustomData}get customDataBuffer(){return this.module.HEAPU8.subarray(this.customDataOffset,this.customDataOffset+this.customDataSize)}compute(e,t){let r=t?.inputs?.map(s=>typeof s=="number"?this.inputs[s]:s)??this.inputs,n=t?.outputs??[],i=(s,o,l)=>new pn(this.module,o,this.output(s,l),l),a=(s,o)=>{let l=Zt(s,o);if(!l)throw new Error(`Unsupported data type: ${s}`);let d=l>0?this.backend.gpuDataManager.create(l).id:0;return new pn(this.module,s,d,o)};return this.backend.run(e,r,n,i,a,this.outputCount)}output(e,t){let r=this.module.stackSave();try{let n=this.module.PTR_SIZE,i=n===4?"i32":"i64",a=this.module.stackAlloc((1+t.length)*n);this.module.setValue(a,t.length,i);for(let s=0;s<t.length;s++)this.module.setValue(a+n*(s+1),t[s],i);return this.module._JsepOutput(this.opKernelContext,e,a)}catch(n){throw new Error(`Failed to generate kernel's output[${e}] with dims [${t}]. If you are running with pre-allocated output, please make sure the output type/dims are correct. Error: ${n}`)}finally{this.module.stackRestore(r)}}},Fm=async(e,t,r,n)=>{let i=t.jsepInit;if(!i)throw new Error("Failed to initialize JSEP. The WebAssembly module is not built with JSEP support.");if(e==="webgpu"){let a=(s_(),Lr(jm)).WebGpuBackend,s=new a;await s.initialize(r,n),i("webgpu",[s,o=>s.alloc(Number(o)),o=>s.free(o),(o,l,d,c=!1)=>{if(c)ye("verbose",()=>`[WebGPU] jsepCopyGpuToGpu: src=${Number(o)}, dst=${Number(l)}, size=${Number(d)}`),s.memcpy(Number(o),Number(l));else{ye("verbose",()=>`[WebGPU] jsepCopyCpuToGpu: dataOffset=${Number(o)}, gpuDataId=${Number(l)}, size=${Number(d)}`);let h=t.HEAPU8.subarray(Number(o>>>0),Number(o>>>0)+Number(d));s.upload(Number(l),h)}},async(o,l,d)=>{ye("verbose",()=>`[WebGPU] jsepCopyGpuToCpu: gpuDataId=${o}, dataOffset=${l}, size=${d}`),await s.download(Number(o),()=>t.HEAPU8.subarray(Number(l)>>>0,Number(l+d)>>>0))},(o,l,d)=>s.createKernel(o,Number(l),d,t.UTF8ToString(t._JsepGetNodeName(Number(l)))),o=>s.releaseKernel(o),(o,l,d,c)=>{ye("verbose",()=>`[WebGPU] jsepRun: sessionHandle=${d}, kernel=${o}, contextDataOffset=${l}`);let h=new Nc(t,s,Number(l));return s.computeKernel(Number(o),h,c)},()=>s.captureBegin(),()=>s.captureEnd(),()=>s.replay()])}else{let a=new eh(r);i("webnn",[a,()=>a.reserveTensorId(),s=>a.releaseTensorId(s),async(s,o,l,d,c)=>a.ensureTensor(s,o,l,d,c),(s,o)=>{a.uploadTensor(s,o)},async(s,o)=>a.downloadTensor(s,o),(s,o)=>a.registerMLContext(s,o),!!r.trace])}}}),Oc,rs,ns,At,Rc,Ji,Mn,is,as,ea,ss,os,us,Vm=X(()=>{Je(),pb(),hb(),ue(),nr(),Ua(),Kp(),Oc=(e,t)=>{Ie()._OrtInit(e,t)!==0&&$e("Can't initialize onnxruntime.")},rs=async e=>{Oc(e.wasm.numThreads,En(e.logLevel))},ns=async(e,t)=>{Ie().asyncInit?.();let r=e.webgpu.adapter;if(t==="webgpu"){if(typeof navigator>"u"||!navigator.gpu)throw new Error("WebGPU is not supported in current environment");if(r){if(typeof r.limits!="object"||typeof r.features!="object"||typeof r.requestDevice!="function")throw new Error("Invalid GPU adapter set in `env.webgpu.adapter`. It must be a GPUAdapter object.")}else{let n=e.webgpu.powerPreference;if(n!==void 0&&n!=="low-power"&&n!=="high-performance")throw new Error(`Invalid powerPreference setting: "${n}"`);let i=e.webgpu.forceFallbackAdapter;if(i!==void 0&&typeof i!="boolean")throw new Error(`Invalid forceFallbackAdapter setting: "${i}"`);if(r=await navigator.gpu.requestAdapter({powerPreference:n,forceFallbackAdapter:i}),!r)throw new Error('Failed to get GPU adapter. You may need to enable flag "--enable-unsafe-webgpu" if you are using Chrome.')}}if(t==="webnn"&&(typeof navigator>"u"||!navigator.ml))throw new Error("WebNN is not supported in current environment");{let n=(o_(),Lr(Wm)).init;t==="webgpu"&&await n("webgpu",Ie(),e,r),t==="webnn"&&await n("webnn",Ie(),e)}},At=new Map,Rc=e=>{let t=Ie(),r=t.stackSave();try{let n=t.PTR_SIZE,i=t.stackAlloc(2*n);t._OrtGetInputOutputCount(e,i,i+n)!==0&&$e("Can't get session input/output count.");let a=n===4?"i32":"i64";return[Number(t.getValue(i,a)),Number(t.getValue(i+n,a))]}finally{t.stackRestore(r)}},Ji=(e,t)=>{let r=Ie(),n=r.stackSave(),i=0;try{let a=r.PTR_SIZE,s=r.stackAlloc(2*a);r._OrtGetInputOutputMetadata(e,t,s,s+a)!==0&&$e("Can't get session input/output metadata.");let o=Number(r.getValue(s,"*"));i=Number(r.getValue(s+a,"*"));let l=r.HEAP32[i/4];if(l===0)return[o,0];let d=r.HEAPU32[i/4+1],c=[];for(let h=0;h<d;h++){let f=Number(r.getValue(i+8+h*a,"*"));c.push(f!==0?r.UTF8ToString(f):Number(r.getValue(i+8+(h+d)*a,"*")))}return[o,l,c]}finally{r.stackRestore(n),i!==0&&r._OrtFree(i)}},Mn=e=>{let t=Ie(),r=t._malloc(e.byteLength);if(r===0)throw new Error(`Can't create a session. failed to allocate a buffer of size ${e.byteLength}.`);return t.HEAPU8.set(e,r),[r,e.byteLength]},is=async(e,t)=>{let r,n,i=Ie();Array.isArray(e)?[r,n]=e:e.buffer===i.HEAPU8.buffer?[r,n]=[e.byteOffset,e.byteLength]:[r,n]=Mn(e);let a=0,s=0,o=0,l=[],d=[],c=[];try{if([s,l]=await Hp(t),t?.externalData&&i.mountExternalData){let v=[];for(let E of t.externalData){let z=typeof E=="string"?E:E.path;v.push(Wa(typeof E=="string"?E:E.data).then(M=>{i.mountExternalData(z,M)}))}await Promise.all(v)}for(let v of t?.executionProviders??[])if((typeof v=="string"?v:v.name)==="webnn"){if(i.shouldTransferToMLTensor=!1,typeof v!="string"){let E=v,z=E?.context,M=E?.gpuDevice,k=E?.deviceType,B=E?.powerPreference;z?i.currentContext=z:M?i.currentContext=await i.webnnCreateMLContext(M):i.currentContext=await i.webnnCreateMLContext({deviceType:k,powerPreference:B})}else i.currentContext=await i.webnnCreateMLContext();break}a=await i._OrtCreateSession(r,n,s),i.webgpuOnCreateSession?.(a),a===0&&$e("Can't create a session."),i.jsepOnCreateSession?.(),i.currentContext&&(i.webnnRegisterMLContext(a,i.currentContext),i.currentContext=void 0,i.shouldTransferToMLTensor=!0);let[h,f]=Rc(a),g=!!t?.enableGraphCapture,m=[],b=[],x=[],$=[],w=[];for(let v=0;v<h;v++){let[E,z,M]=Ji(a,v);E===0&&$e("Can't get an input name."),d.push(E);let k=i.UTF8ToString(E);m.push(k),x.push(z===0?{name:k,isTensor:!1}:{name:k,isTensor:!0,type:vt(z),shape:M})}for(let v=0;v<f;v++){let[E,z,M]=Ji(a,v+h);E===0&&$e("Can't get an output name."),c.push(E);let k=i.UTF8ToString(E);b.push(k),$.push(z===0?{name:k,isTensor:!1}:{name:k,isTensor:!0,type:vt(z),shape:M});{if(g&&t?.preferredOutputLocation===void 0){w.push("gpu-buffer");continue}let B=typeof t?.preferredOutputLocation=="string"?t.preferredOutputLocation:t?.preferredOutputLocation?.[k]??"cpu",U=i.webnnIsGraphOutput;if(B==="cpu"&&U&&U(a,k)){w.push("ml-tensor-cpu-output");continue}if(B!=="cpu"&&B!=="cpu-pinned"&&B!=="gpu-buffer"&&B!=="ml-tensor")throw new Error(`Not supported preferred output location: ${B}.`);if(g&&B!=="gpu-buffer")throw new Error(`Not supported preferred output location: ${B}. Only 'gpu-buffer' location is supported when enableGraphCapture is true.`);w.push(B)}}let S=null;return w.some(v=>v==="gpu-buffer"||v==="ml-tensor"||v==="ml-tensor-cpu-output")&&(o=i._OrtCreateBinding(a),o===0&&$e("Can't create IO binding."),S={handle:o,outputPreferredLocations:w,outputPreferredLocationsEncoded:w.map(v=>v==="ml-tensor-cpu-output"?"ml-tensor":v).map(v=>ga(v))}),At.set(a,[a,d,c,S,g,!1]),[a,m,b,x,$]}catch(h){throw d.forEach(f=>i._OrtFree(f)),c.forEach(f=>i._OrtFree(f)),o!==0&&i._OrtReleaseBinding(o)!==0&&$e("Can't release IO binding."),a!==0&&i._OrtReleaseSession(a)!==0&&$e("Can't release session."),h}finally{i._free(r),s!==0&&i._OrtReleaseSessionOptions(s)!==0&&$e("Can't release session options."),l.forEach(h=>i._free(h)),i.unmountExternalData?.()}},as=e=>{let t=Ie(),r=At.get(e);if(!r)throw new Error(`cannot release session. invalid session id: ${e}`);let[n,i,a,s,o]=r;s&&(o&&t._OrtClearBoundOutputs(s.handle)!==0&&$e("Can't clear bound outputs."),t._OrtReleaseBinding(s.handle)!==0&&$e("Can't release IO binding.")),t.jsepOnReleaseSession?.(e),t.webnnOnReleaseSession?.(e),t.webgpuOnReleaseSession?.(e),i.forEach(l=>t._OrtFree(l)),a.forEach(l=>t._OrtFree(l)),t._OrtReleaseSession(n)!==0&&$e("Can't release session."),At.delete(e)},ea=async(e,t,r,n,i,a,s=!1)=>{if(!e){t.push(0);return}let o=Ie(),l=o.PTR_SIZE,d=e[0],c=e[1],h=e[3],f=h,g,m;if(d==="string"&&(h==="gpu-buffer"||h==="ml-tensor"))throw new Error("String tensor is not supported on GPU.");if(s&&h!=="gpu-buffer")throw new Error(`External buffer must be provided for input/output index ${a} when enableGraphCapture is true.`);if(h==="gpu-buffer"){let $=e[2].gpuBuffer;m=Zt(Xt(d),c);{let w=o.jsepRegisterBuffer;if(!w)throw new Error('Tensor location "gpu-buffer" is not supported without using WebGPU.');g=w(n,a,$,m)}}else if(h==="ml-tensor"){let $=e[2].mlTensor;m=Zt(Xt(d),c);let w=o.webnnRegisterMLTensor;if(!w)throw new Error('Tensor location "ml-tensor" is not supported without using WebNN.');g=w(n,$,Xt(d),c)}else{let $=e[2];if(Array.isArray($)){m=l*$.length,g=o._malloc(m),r.push(g);for(let w=0;w<$.length;w++){if(typeof $[w]!="string")throw new TypeError(`tensor data at index ${w} is not a string`);o.setValue(g+w*l,ut($[w],r),"*")}}else{let w=o.webnnIsGraphInput,S=o.webnnIsGraphOutput;if(d!=="string"&&w&&S){let v=o.UTF8ToString(i);if(w(n,v)||S(n,v)){let E=Xt(d);m=Zt(E,c),f="ml-tensor";let z=o.webnnCreateTemporaryTensor,M=o.webnnUploadTensor;if(!z||!M)throw new Error('Tensor location "ml-tensor" is not supported without using WebNN.');let k=await z(n,E,c);M(k,new Uint8Array($.buffer,$.byteOffset,$.byteLength)),g=k}else m=$.byteLength,g=o._malloc(m),r.push(g),o.HEAPU8.set(new Uint8Array($.buffer,$.byteOffset,m),g)}else m=$.byteLength,g=o._malloc(m),r.push(g),o.HEAPU8.set(new Uint8Array($.buffer,$.byteOffset,m),g)}}let b=o.stackSave(),x=o.stackAlloc(4*c.length);try{c.forEach((w,S)=>o.setValue(x+S*l,w,l===4?"i32":"i64"));let $=o._OrtCreateTensor(Xt(d),g,m,x,c.length,ga(f));$===0&&$e(`Can't create tensor for input/output. session=${n}, index=${a}.`),t.push($)}finally{o.stackRestore(b)}},ss=async(e,t,r,n,i,a)=>{let s=Ie(),o=s.PTR_SIZE,l=At.get(e);if(!l)throw new Error(`cannot run inference. invalid session id: ${e}`);let d=l[0],c=l[1],h=l[2],f=l[3],g=l[4],m=l[5],b=t.length,x=n.length,$=0,w=[],S=[],v=[],E=[],z=[],M=s.stackSave(),k=s.stackAlloc(b*o),B=s.stackAlloc(b*o),U=s.stackAlloc(x*o),G=s.stackAlloc(x*o);try{[$,w]=Vp(a),Qt("wasm prepareInputOutputTensor");for(let P=0;P<b;P++)await ea(r[P],S,E,e,c[t[P]],t[P],g);for(let P=0;P<x;P++)await ea(i[P],v,E,e,h[n[P]],b+n[P],g);Jt("wasm prepareInputOutputTensor");for(let P=0;P<b;P++)s.setValue(k+P*o,S[P],"*"),s.setValue(B+P*o,c[t[P]],"*");for(let P=0;P<x;P++)s.setValue(U+P*o,v[P],"*"),s.setValue(G+P*o,h[n[P]],"*");if(f&&!m){let{handle:P,outputPreferredLocations:H,outputPreferredLocationsEncoded:Y}=f;if(c.length!==b)throw new Error(`input count from feeds (${b}) is expected to be always equal to model's input count (${c.length}).`);Qt("wasm bindInputsOutputs");for(let j=0;j<b;j++){let K=t[j];await s._OrtBindInput(P,c[K],S[j])!==0&&$e(`Can't bind input[${j}] for session=${e}.`)}for(let j=0;j<x;j++){let K=n[j];i[j]?.[3]?(z.push(v[j]),s._OrtBindOutput(P,h[K],v[j],0)!==0&&$e(`Can't bind pre-allocated output[${j}] for session=${e}.`)):s._OrtBindOutput(P,h[K],0,Y[K])!==0&&$e(`Can't bind output[${j}] to ${H[j]} for session=${e}.`)}Jt("wasm bindInputsOutputs"),At.set(e,[d,c,h,f,g,!0])}s.jsepOnRunStart?.(d),s.webnnOnRunStart?.(d);let V;f?V=await s._OrtRunWithBinding(d,f.handle,x,U,$):V=await s._OrtRun(d,B,k,b,G,x,U,$),V!==0&&$e("failed to call OrtRun().");let Z=[],O=[];Qt("wasm ProcessOutputTensor");for(let P=0;P<x;P++){let H=Number(s.getValue(U+P*o,"*"));if(H===v[P]||z.includes(v[P])){Z.push(i[P]),H!==v[P]&&s._OrtReleaseTensor(H)!==0&&$e("Can't release tensor.");continue}let Y=s.stackSave(),j=s.stackAlloc(4*o),K=!1,J,L=0;try{s._OrtGetTensorData(H,j,j+o,j+2*o,j+3*o)!==0&&$e(`Can't access output tensor data on index ${P}.`);let re=o===4?"i32":"i64",C=Number(s.getValue(j,re));L=s.getValue(j+o,"*");let R=s.getValue(j+o*2,"*"),ie=Number(s.getValue(j+o*3,re)),Se=[];for(let ge=0;ge<ie;ge++)Se.push(Number(s.getValue(R+ge*o,re)));s._OrtFree(R)!==0&&$e("Can't free memory for tensor dims.");let ve=Se.reduce((ge,he)=>ge*he,1);J=vt(C);let Ae=f?.outputPreferredLocations[n[P]];if(J==="string"){if(Ae==="gpu-buffer"||Ae==="ml-tensor")throw new Error("String tensor is not supported on GPU.");let ge=[];for(let he=0;he<ve;he++){let Me=s.getValue(L+he*o,"*"),Te=s.getValue(L+(he+1)*o,"*"),We=he===ve-1?void 0:Te-Me;ge.push(s.UTF8ToString(Me,We))}Z.push([J,Se,ge,"cpu"])}else if(Ae==="gpu-buffer"&&ve>0){let ge=s.jsepGetBuffer;if(!ge)throw new Error('preferredLocation "gpu-buffer" is not supported without using WebGPU.');let he=ge(L),Me=Zt(C,ve);if(Me===void 0||!ja(J))throw new Error(`Unsupported data type: ${J}`);K=!0,Z.push([J,Se,{gpuBuffer:he,download:s.jsepCreateDownloader(he,Me,J),dispose:()=>{s._OrtReleaseTensor(H)!==0&&$e("Can't release tensor.")}},"gpu-buffer"])}else if(Ae==="ml-tensor"&&ve>0){let ge=s.webnnEnsureTensor,he=s.webnnIsGraphInputOutputTypeSupported;if(!ge||!he)throw new Error('preferredLocation "ml-tensor" is not supported without using WebNN.');if(Zt(C,ve)===void 0||!qa(J))throw new Error(`Unsupported data type: ${J}`);if(!he(e,J,!1))throw new Error(`preferredLocation "ml-tensor" for ${J} output is not supported by current WebNN Context.`);let Me=await ge(e,L,C,Se,!1);K=!0,Z.push([J,Se,{mlTensor:Me,download:s.webnnCreateMLTensorDownloader(L,J),dispose:()=>{s.webnnReleaseTensorId(L),s._OrtReleaseTensor(H)}},"ml-tensor"])}else if(Ae==="ml-tensor-cpu-output"&&ve>0){let ge=s.webnnCreateMLTensorDownloader(L,J)(),he=Z.length;K=!0,O.push((async()=>{let Me=[he,await ge];return s.webnnReleaseTensorId(L),s._OrtReleaseTensor(H),Me})()),Z.push([J,Se,[],"cpu"])}else{let ge=Rn(J),he=new ge(ve);new Uint8Array(he.buffer,he.byteOffset,he.byteLength).set(s.HEAPU8.subarray(L,L+he.byteLength)),Z.push([J,Se,he,"cpu"])}}finally{s.stackRestore(Y),J==="string"&&L&&s._free(L),K||s._OrtReleaseTensor(H)}}f&&!g&&(s._OrtClearBoundOutputs(f.handle)!==0&&$e("Can't clear bound outputs."),At.set(e,[d,c,h,f,g,!1]));for(let[P,H]of await Promise.all(O))Z[P][2]=H;return Jt("wasm ProcessOutputTensor"),Z}finally{s.webnnOnRunEnd?.(d),s.stackRestore(M),S.forEach(V=>s._OrtReleaseTensor(V)),v.forEach(V=>s._OrtReleaseTensor(V)),E.forEach(V=>s._free(V)),$!==0&&s._OrtReleaseRunOptions($),w.forEach(V=>s._free(V))}},os=e=>{let t=Ie(),r=At.get(e);if(!r)throw new Error("invalid session id");let n=r[0],i=t._OrtEndProfiling(n);i===0&&$e("Can't get an profile file name."),t._OrtFree(i)},us=e=>{let t=[];for(let r of e){let n=r[2];!Array.isArray(n)&&"buffer"in n&&t.push(n.buffer)}return t}}),Mt,Ye,sr,Ir,Cr,hn,ta,fn,Ft,Gt,Bc,Hm,Km,Xm,Zm,Ym,Qm,Jm,eg=X(()=>{Je(),Vm(),nr(),Pa(),Mt=()=>!!Ee.wasm.proxy&&typeof document<"u",sr=!1,Ir=!1,Cr=!1,fn=new Map,Ft=(e,t)=>{let r=fn.get(e);r?r.push(t):fn.set(e,[t])},Gt=()=>{if(sr||!Ir||Cr||!Ye)throw new Error("worker not ready")},Bc=e=>{switch(e.data.type){case"init-wasm":sr=!1,e.data.err?(Cr=!0,ta[1](e.data.err)):(Ir=!0,ta[0]()),hn&&(URL.revokeObjectURL(hn),hn=void 0);break;case"init-ep":case"copy-from":case"create":case"release":case"run":case"end-profiling":{let t=fn.get(e.data.type);e.data.err?t.shift()[1](e.data.err):t.shift()[0](e.data.out);break}}},Hm=async()=>{if(!Ir){if(sr)throw new Error("multiple calls to 'initWasm()' detected.");if(Cr)throw new Error("previous call to 'initWasm()' failed.");if(sr=!0,Mt())return new Promise((e,t)=>{Ye?.terminate(),Fp().then(([r,n])=>{try{Ye=n,Ye.onerror=a=>t(a),Ye.onmessage=Bc,ta=[e,t];let i={type:"init-wasm",in:Ee};!i.in.wasm.wasmPaths&&(r||ma)&&(i.in.wasm.wasmPaths={wasm:new URL("/SACHIZU-LAB1/assets/ort-wasm-simd-threaded.jsep-DC5y_g6C.wasm",import.meta.url).href}),Ye.postMessage(i),hn=r}catch(i){t(i)}},t)});try{await La(Ee.wasm),await rs(Ee),Ir=!0}catch(e){throw Cr=!0,e}finally{sr=!1}}},Km=async e=>{if(Mt())return Gt(),new Promise((t,r)=>{Ft("init-ep",[t,r]);let n={type:"init-ep",in:{epName:e,env:Ee}};Ye.postMessage(n)});await ns(Ee,e)},Xm=async e=>Mt()?(Gt(),new Promise((t,r)=>{Ft("copy-from",[t,r]);let n={type:"copy-from",in:{buffer:e}};Ye.postMessage(n,[e.buffer])})):Mn(e),Zm=async(e,t)=>{if(Mt()){if(t?.preferredOutputLocation)throw new Error('session option "preferredOutputLocation" is not supported for proxy.');return Gt(),new Promise((r,n)=>{Ft("create",[r,n]);let i={type:"create",in:{model:e,options:{...t}}},a=[];e instanceof Uint8Array&&a.push(e.buffer),Ye.postMessage(i,a)})}else return is(e,t)},Ym=async e=>{if(Mt())return Gt(),new Promise((t,r)=>{Ft("release",[t,r]);let n={type:"release",in:e};Ye.postMessage(n)});as(e)},Qm=async(e,t,r,n,i,a)=>{if(Mt()){if(r.some(s=>s[3]!=="cpu"))throw new Error("input tensor on GPU is not supported for proxy.");if(i.some(s=>s))throw new Error("pre-allocated output tensor is not supported for proxy.");return Gt(),new Promise((s,o)=>{Ft("run",[s,o]);let l=r,d={type:"run",in:{sessionId:e,inputIndices:t,inputs:l,outputIndices:n,options:a}};Ye.postMessage(d,us(l))})}else return ss(e,t,r,n,i,a)},Jm=async e=>{if(Mt())return Gt(),new Promise((t,r)=>{Ft("end-profiling",[t,r]);let n={type:"end-profiling",in:e};Ye.postMessage(n)});os(e)}}),ra,Dc,tg,u_=X(()=>{Je(),eg(),ue(),Da(),Kp(),ra=(e,t)=>{switch(e.location){case"cpu":return[e.type,e.dims,e.data,"cpu"];case"gpu-buffer":return[e.type,e.dims,{gpuBuffer:e.gpuBuffer},"gpu-buffer"];case"ml-tensor":return[e.type,e.dims,{mlTensor:e.mlTensor},"ml-tensor"];default:throw new Error(`invalid data location: ${e.location} for ${t()}`)}},Dc=e=>{switch(e[3]){case"cpu":return new lt(e[0],e[2],e[1]);case"gpu-buffer":{let t=e[0];if(!ja(t))throw new Error(`not supported data type: ${t} for deserializing GPU tensor`);let{gpuBuffer:r,download:n,dispose:i}=e[2];return lt.fromGpuBuffer(r,{dataType:t,dims:e[1],download:n,dispose:i})}case"ml-tensor":{let t=e[0];if(!qa(t))throw new Error(`not supported data type: ${t} for deserializing MLTensor tensor`);let{mlTensor:r,download:n,dispose:i}=e[2];return lt.fromMLTensor(r,{dataType:t,dims:e[1],download:n,dispose:i})}default:throw new Error(`invalid data location: ${e[3]}`)}},tg=class{async fetchModelAndCopyToWasmMemory(e){return Xm(await Wa(e))}async loadModel(e,t){bt();let r;typeof e=="string"?r=await this.fetchModelAndCopyToWasmMemory(e):r=e,[this.sessionId,this.inputNames,this.outputNames,this.inputMetadata,this.outputMetadata]=await Zm(r,t),dt()}async dispose(){return Ym(this.sessionId)}async run(e,t,r){bt();let n=[],i=[];Object.entries(e).forEach(h=>{let f=h[0],g=h[1],m=this.inputNames.indexOf(f);if(m===-1)throw new Error(`invalid input '${f}'`);n.push(g),i.push(m)});let a=[],s=[];Object.entries(t).forEach(h=>{let f=h[0],g=h[1],m=this.outputNames.indexOf(f);if(m===-1)throw new Error(`invalid output '${f}'`);a.push(g),s.push(m)});let o=n.map((h,f)=>ra(h,()=>`input "${this.inputNames[i[f]]}"`)),l=a.map((h,f)=>h?ra(h,()=>`output "${this.outputNames[s[f]]}"`):null),d=await Qm(this.sessionId,i,o,s,l,r),c={};for(let h=0;h<d.length;h++)c[this.outputNames[s[h]]]=a[h]??Dc(d[h]);return dt(),c}startProfiling(){}endProfiling(){Jm(this.sessionId)}}}),rg={};fr(rg,{OnnxruntimeWebAssemblyBackend:()=>za,initializeFlags:()=>Ca,wasmBackend:()=>ng});var Ca,za,ng,l_=X(()=>{Je(),eg(),u_(),Ca=()=>{(typeof Ee.wasm.initTimeout!="number"||Ee.wasm.initTimeout<0)&&(Ee.wasm.initTimeout=0);let e=Ee.wasm.simd;if(typeof e!="boolean"&&e!==void 0&&e!=="fixed"&&e!=="relaxed"&&(console.warn(`Property "env.wasm.simd" is set to unknown value "${e}". Reset it to \`false\` and ignore SIMD feature checking.`),Ee.wasm.simd=!1),typeof Ee.wasm.proxy!="boolean"&&(Ee.wasm.proxy=!1),typeof Ee.wasm.trace!="boolean"&&(Ee.wasm.trace=!1),typeof Ee.wasm.numThreads!="number"||!Number.isInteger(Ee.wasm.numThreads)||Ee.wasm.numThreads<=0)if(typeof self<"u"&&!self.crossOriginIsolated)Ee.wasm.numThreads=1;else{let t=typeof navigator>"u"?Ky("node:os").cpus().length:navigator.hardwareConcurrency;Ee.wasm.numThreads=Math.min(4,Math.ceil((t||1)/2))}},za=class{async init(e){Ca(),await Hm(),await Km(e)}async createInferenceSessionHandler(e,t){let r=new tg;return await r.loadModel(e,t),r}},ng=new za});Je();Je();Je();var d_="1.27.0";{let e=(l_(),Lr(rg)).wasmBackend;lr("webgpu",e,5),lr("webnn",e,5),lr("cpu",e,10),lr("wasm",e,10)}Object.defineProperty(Ee.versions,"web",{value:d_,enumerable:!0});const c_="rtmpose-m-halpe26-256x192.onnx",p_="26f3a19e61304a600dfb82d1001d41d24343b89fc70a33ffc84657e0b0bf2ecf",h_=new URL("/SACHIZU-LAB1/assets/ort-wasm-simd-threaded.jsep-DC5y_g6C.wasm",import.meta.url).href,He=192,Qe=256,f_=[123.675,116.28,103.53],m_=[58.395,57.12,57.375],Pc={0:0,11:5,12:6,13:7,14:8,15:9,16:10,23:11,24:12,25:13,26:14,27:15,28:16,29:24,30:25,31:20,32:21};function g_(e,t,r){const n=e.filter(f=>Number.isFinite(f.x)&&Number.isFinite(f.y)&&(f.visibility??1)>=.3);if(n.length<5)return null;const i=n.map(f=>f.x*t),a=n.map(f=>f.y*r),s=Math.min(...i),o=Math.max(...i),l=Math.min(...a),d=Math.max(...a);let c=Math.max(1,(o-s)*1.25),h=Math.max(1,(d-l)*1.25);return c/h>He/Qe?h=c*Qe/He:c=h*He/Qe,{cx:(s+o)/2,cy:(l+d)/2,scale:c/He}}function y_(e,t,r,n,i){const s=e.length/26,o=t.length/26,l=[];for(let d=0;d<26;d++){let c=0,h=0;for(let f=1;f<s;f++)e[d*s+f]>e[d*s+c]&&(c=f);for(let f=1;f<o;f++)t[d*o+f]>t[d*o+h]&&(h=f);l.push({x:(r.cx+(c/2-He/2)*r.scale)/n,y:(r.cy+(h/2-Qe/2)*r.scale)/i,visibility:Math.min(e[d*s+c],t[d*o+h])})}return Array.from({length:33},(d,c)=>c in Pc?{...l[Pc[c]]}:{...l[0],visibility:0})}let na=null;function b_(e,t){return na??=__(e,t).catch(r=>{throw na=null,r}),na}async function __(e,t){const r=await ky(`/SACHIZU-LAB1/models/rtmpose/${c_}`,e,h=>t(h.replace("姿勢モデル","高精度の骨格モデル")));if(Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",r)),h=>h.toString(16).padStart(2,"0")).join("")!==p_)throw new Error("高精度の骨格モデルのファイルが正しくありません。");t("高精度の骨格モデルを準備しています…"),Ee.wasm.wasmPaths={wasm:h_},Ee.wasm.numThreads=1;let i=null,a="wasm";const s=typeof navigator<"u"&&!!navigator.gpu;for(const h of s?["webgpu","wasm"]:["wasm"])try{i=await Ba.create(r,{executionProviders:[h],graphOptimizationLevel:"all"}),a=h;break}catch{}if(!i)throw new Error("高精度の骨格モデルを開始できませんでした。");const o=i,l=document.createElement("canvas");l.width=He,l.height=Qe;const d=l.getContext("2d",{willReadFrequently:!0});if(!d)throw new Error("映像処理を開始できません。");const c=new Float32Array(3*He*Qe);return{backend:a,async refine(h,f){const g=h.width,m=h.height,b=g_(f,g,m);if(!b)return null;const x=b.cx-He/2*b.scale,$=b.cy-Qe/2*b.scale,w=Math.max(0,x),S=Math.max(0,$),v=Math.min(g,x+He*b.scale),E=Math.min(m,$+Qe*b.scale);d.clearRect(0,0,He,Qe),v>w&&E>S&&d.drawImage(h,w,S,v-w,E-S,(w-x)/b.scale,(S-$)/b.scale,(v-w)/b.scale,(E-S)/b.scale);const z=d.getImageData(0,0,He,Qe).data,M=He*Qe;for(let B=0;B<M;B++)for(let U=0;U<3;U++)c[U*M+B]=(z[4*B+U]-f_[U])/m_[U];const k=await o.run({input:new lt("float32",c,[1,3,Qe,He])});return y_(k.simcc_x.data,k.simcc_y.data,b,g,m)}}}const ze=1e-9,Lc=.2,w_=.1,gt=.2,Uc=.1,mn=1.5,jc=.03,$_=1,or=.06,ia=.15,qc=.05,v_=.08,gn=3,x_=.06,S_=6,k_=.25,Aa=2.5,aa=.03,Wc=1.2,T_=.1,Fc=2.5,E_=4.5,I_=4.5,C_=2.5,z_=[11,12,23,24,25,26,27,28],A_=.012,M_=.02,Gc=.05,N_=.015,O_=.5,Vc=.01,R_=(e,t)=>z_.every(r=>!e[r]||e[r].x>t[0]+Vc*(t[1]-t[0])/.36&&e[r].x<t[1]-Vc*(t[1]-t[0])/.36),B_=15;function Hc(e,t){e.push(t),e.length>B_&&e.shift()}function Kc(e){if(!e.length)return null;const t=[...e].sort((r,n)=>r-n);return t[t.length>>1]}function Ge(e){const t=e.reduce((i,a)=>i+a.t,0)/e.length,r=e.reduce((i,a)=>i+a.x,0)/e.length,n=e.reduce((i,a)=>i+(a.t-t)**2,0);return{mt:t,mx:r,slope:n>0?e.reduce((i,a)=>i+(a.t-t)*(a.x-r),0)/n:0}}function zr(e,t,r,n,i=.08){return e.filter(a=>Math.abs(a.x-t)<r&&(n===null||Math.abs(a.y-n)<i)).sort((a,s)=>Math.abs(a.x-t)-Math.abs(s.x-t))}const sa=(e,t)=>Math.abs(e.x-t.x)<A_&&Math.abs(e.y-t.y)<M_,yn=(e,t)=>e.length>1&&Math.abs(e[1].x-t)-Math.abs(e[0].x-t)<.03,D_=.03,P_=1/50,Xc=.035,Zc=.08,Yc=12,L_=.1,U_=.5;function Qc(e,t,r,n,i=.08){return e.filter(a=>Math.abs(a.x-t)<r&&(n===null||Math.abs(a.y-n)<i)).sort((a,s)=>Math.hypot(a.x-t,n===null?0:a.y-n)-Math.hypot(s.x-t,n===null?0:s.y-n))}const Jc=(e,t,r)=>{const n=e.slice(1).find(i=>r===null||Math.abs(i.y-r)<D_);return!!n&&Math.abs(n.x-t)-Math.abs(e[0].x-t)<.03};class j_{x;y=null;pts=null;velocity=0;history=[];acquisition=null;provisional=[];resumption=null;challenger=null;running=!1;behindStart=!1;backfill=[];watchTracks=[];intervals=[];watchIntervals=[];lastPts=null;lastWatchPts=null;lastInterval=1/120;publishedFrom=null;retraction=null;rivalSeen=!1;nearer=[];finishX;seed;direction;start;sprintSpeed;fromBlocks;constructor(t,r=0,n="standing",i=0,a=!1){this.fromBlocks=a,this.seed=t,this.direction=Math.sign(r),this.finishX=t+r,this.start=this.direction&&n==="flying"?"flying":"standing",this.sprintSpeed=Math.max(gt,i),this.x=this.flyingSeed()}frameInterval(){return Kc(this.intervals)??this.lastInterval}watchInterval(){return Kc(this.watchIntervals)??2*this.frameInterval()}gapLimit(t=this.frameInterval()){return Math.max(.05,Fc*t)}get sparse(){return this.frameInterval()>P_}trackHeight(){return this.sparse?Xc:Zc}frameRadius(){return Math.min(or,jc+$_*Math.max(0,this.frameInterval()-1/120))}shortGap(){return Math.max(Uc,Fc*this.frameInterval())}decisionWindow(t=this.frameInterval()){return Math.max(T_,I_*t)}minSpan(t=this.frameInterval()){return Math.max(x_,C_*t)}flyingSeed(){return this.start==="flying"?Math.max(.02,Math.min(.98,this.seed-this.direction*v_)):this.seed}searchAgain(){this.x=this.flyingSeed(),this.y=null,this.pts=null,this.velocity=0,this.history=[],this.provisional=[],this.watchTracks=[],this.resumption=null,this.running=!1,this.behindStart=!1,this.rivalSeen=!1,this.nearer=[]}expected(t){if(this.pts===null&&this.start==="flying"){const r=this.leadCentre(this.provisional,t);if(r!==null)return r}return this.x+this.velocity*Math.max(0,Math.min(mn,this.pts===null?0:t-this.pts))}leadCentre(t,r){const i=t.filter(s=>{const o=s.points.filter(l=>s.pts-l.t<=this.decisionWindow()+ze);return o.length>=gn&&o.at(-1).t-o[0].t>=this.minSpan()-ze&&Ge(o).slope*this.direction>=this.sprintSpeed}).sort((s,o)=>(o.x-s.x)*this.direction)[0];if(!i||r-i.pts>this.shortGap()+ze)return null;const a=i.points.filter(s=>i.pts-s.t<=this.decisionWindow()+ze);return Math.max(0,Math.min(1,i.x+Ge(a).slope*(r-i.pts)))}watchCentre(t){return this.start!=="flying"||this.pts===null||(this.x-this.finishX)*this.direction>=0?null:this.flyingSeed()}get following(){return this.pts!==null}get contested(){return this.rivalSeen}get watching(){return this.watchTracks.some(t=>t.points.length<2||Ge(t.points).slope*this.direction>=gt)}get idle(){return this.start==="flying"&&this.pts===null&&this.provisional.every(t=>{const r=t.points.filter(n=>t.pts-n.t<=this.decisionWindow()+ze);return r.length>=4&&r.at(-1).t-r[0].t>=.06-ze&&Math.abs(Ge(r).slope)<gt/2})}takeBackfill(){const t=this.backfill;return this.backfill=[],t}takeRetraction(){const t=this.retraction;return this.retraction=null,t}choose(t,r,n=[0,1],i){if(!Number.isFinite(r))return this.acquisition=null,this.provisional=[],this.resumption=null,[];if(this.pts!==null&&r<=this.pts)return[];this.lastPts!==null&&r>this.lastPts&&(this.lastInterval=r-this.lastPts,this.idle||Hc(this.intervals,this.lastInterval)),this.lastPts=r,i&&this.pts!==null&&(this.lastWatchPts!==null&&r>this.lastWatchPts&&Hc(this.watchIntervals,r-this.lastWatchPts),this.lastWatchPts=r);const a=(h,f)=>h.filter(g=>[23,24].every(m=>g[m]&&Number.isFinite(g[m].x)&&Number.isFinite(g[m].y)&&g[m].x>0&&g[m].x<1&&g[m].y>0&&g[m].y<1&&(g[m].visibility??0)>=.3)&&(this.start!=="flying"||R_(g,f))).map(g=>({p:g,x:(g[23].x+g[24].x)/2,y:(g[23].y+g[24].y)/2})),s=a(t,n),o=this.start==="flying"&&this.pts!==null,l=this.follow(s,r);if(!o||this.pts===null)return l;const d=s.find(h=>h.p===l),c=[];for(const h of[...s,...i?a(i.poses,i.view):[]])h!==d&&!(d&&sa(h,d))&&!c.some(f=>sa(f,h))&&c.push(h);return this.watch(c,r)??l}watch(t,r){if((this.x-this.finishX)*this.direction>=0)return this.watchTracks=[],null;const{next:n,confirmed:i}=this.advance(this.watchTracks,t,r,this.watchInterval());this.watchTracks=n;const a=this.y;if(a!==null&&n.some(o=>o.points.length>=gn&&o.y-a>=aa&&Ge(o.points).slope*this.direction>=this.sprintSpeed)&&(this.rivalSeen=!0),a!==null){const o=Math.max(this.sprintSpeed,Wc*Math.abs(this.velocity)),l=Yc*this.sprintSpeed/Aa,d=t.filter(c=>c.y-a>=aa).map(c=>({t:r,x:c.x,y:c.y}));this.nearer=this.nearer.filter(c=>r-c.t<=U_),d.some(c=>this.nearer.some(h=>c.t-h.t>=L_-ze&&Math.abs(c.y-h.y)<Xc&&(c.x-h.x)*this.direction>=o*(c.t-h.t)&&(c.x-h.x)*this.direction<=l*(c.t-h.t)))&&(this.rivalSeen=!0),this.nearer.push(...d)}if(!i||this.y===null)return null;const s=Ge(i.points).slope*this.direction;return i.y-this.y>=aa&&s>=Wc*Math.abs(this.velocity)?(this.retraction=this.publishedFrom,this.adopt(i,r)):null}follow(t,r){if(this.start==="flying"&&this.pts!==null){const o=r-this.pts,l=(this.x-this.seed)*this.direction<0;(o-mn>ze||l&&o-this.shortGap()>ze)&&this.searchAgain()}if(this.pts===null)return this.start==="flying"?this.acquireFlying(t,r):this.acquire(t,r);const n=this.challenge(t,r);if(n)return n;const i=r-this.pts;if(i-mn>ze)return[];if(i-this.shortGap()>ze||this.resumption)return this.resume(t,r);const a=this.reference(r)??this.expected(r);if(this.start==="flying"){const o=Qc(t,a,this.frameRadius(),this.y,this.trackHeight());return!o.length||Jc(o,a,this.y)?[]:this.accept(o[0],r)}const s=zr(t,a,this.frameRadius(),this.y);return!s.length||yn(s,a)?[]:this.accept(s[0],r)}reference(t){if(this.fromBlocks||Math.abs(this.velocity)<gt)return null;const r=this.history.filter(i=>t-i.t>=Uc-ze&&t-i.t<=.4+ze);if(r.length<4||r.at(-1).t-r[0].t<.08)return null;const n=Ge(r);return n.mx+n.slope*(t-n.mt)}accept(t,r){for(this.x=t.x,this.y=t.y,this.pts=r,this.resumption=null,(t.x-this.seed)*this.direction<=0&&(this.behindStart=!0),this.history.push({t:r,x:t.x});this.history.length&&r-this.history[0].t>.6;)this.history.shift();return this.updateVelocity(r),t.p}updateVelocity(t){const r=this.history.filter(n=>t-n.t<=Lc+ze);r.length<3||r.at(-1).t-r[0].t<w_-ze||(this.velocity=Math.max(-1,Math.min(1,Ge(r).slope)),this.behindStart&&this.velocity*this.direction>=gt&&(this.running=!0))}challenge(t,r){if(!this.direction||this.start==="flying"||this.running||this.velocity*this.direction>=qc)return this.challenger=null,null;const n=Math.abs(this.expected(r)-this.seed),i=zr(t,this.seed,Math.min(ia,n-.03),null)[0],a=this.challenger;if(!i)return this.challenger=null,null;const o=a&&r-a.pts-this.gapLimit()<=ze&&Math.abs(i.x-a.x)<or&&Math.abs(i.y-a.y)<.08?a.count+1:1;return o<3?(this.challenger={x:i.x,y:i.y,pts:r,count:o},null):(this.x=i.x,this.y=i.y,this.pts=r,this.velocity=0,this.history=[{t:r,x:i.x}],this.resumption=null,this.challenger=null,this.behindStart=(i.x-this.seed)*this.direction<=0,i.p)}resume(t,r){const n=this.expected(r),i=r-this.pts,a=or+.5*Math.abs(this.velocity)*Math.min(1,i),s=Math.abs(this.velocity)>=gt||this.velocity*this.direction>=qc,o=zr(t,n,a,this.y,this.start==="flying"?this.trackHeight():Zc).filter(m=>!s||(m.x-this.x)*Math.sign(this.velocity)>=.4*Math.abs(this.velocity)*Math.min(mn,i));if(!o.length||yn(o,n))return this.resumption=null,[];const l=o[0],d=this.resumption,h=d&&r-d.pts-this.gapLimit()<=ze&&Math.abs(l.x-(d.x+this.velocity*(r-d.pts)))<or&&Math.abs(l.y-d.y)<.08?{...d,x:l.x,y:l.y,pts:r,count:d.count+1}:{startX:l.x,startPts:r,x:l.x,y:l.y,pts:r,count:1};this.resumption=h;const f=h.pts-h.startPts;if(h.count<3||f-.04<-ze)return[];const g=(h.x-h.startX)/f;return s&&(Math.sign(g)!==Math.sign(this.velocity)||Math.abs(g)<.4*Math.abs(this.velocity))?(this.resumption=null,[]):(this.history=[],this.accept(l,r))}acquire(t,r){const n=this.acquisition;if(n&&r>n.pts&&r-n.pts-this.gapLimit()<=ze){const s=n.points.length>1?Ge(n.points).slope:0,o=n.x+s*(r-n.pts),l=zr(t,o,or,n.y);if(yn(l,o))return this.acquisition=null,[];if(l.length){const d=l[0],c=[...n.points,{t:r,x:d.x}];return c.length<3?(this.acquisition={x:d.x,y:d.y,pts:r,points:c},[]):(this.x=d.x,this.y=d.y,this.pts=r,this.acquisition=null,this.behindStart=c.some(h=>(h.x-this.seed)*this.direction<=0),this.history=c,this.updateVelocity(r),d.p)}}this.acquisition=null;const i=zr(t,this.x,ia,null);if(!i.length||yn(i,this.x))return[];const a=i[0];return this.acquisition={x:a.x,y:a.y,pts:r,points:[{t:r,x:a.x}]},[]}acquireFlying(t,r){const{next:n,confirmed:i}=this.advance(this.provisional,t,r);return this.provisional=n,i?this.adopt(i,r):[]}advance(t,r,n,i=this.frameInterval()){const a=t.filter(m=>n>m.pts&&n-m.pts-(m.points.length>=gn?Math.max(.05,E_*i):this.gapLimit(i))<=ze),s=[],o=new Set,l=new Set;for(const m of a){const b=m.points.length>1?Ge(m.points).slope:0,x=m.x+b*(n-m.pts),$=m.points.length<2?Yc*this.sprintSpeed/Aa*Math.max(0,n-m.pts-.05):0,w=Qc(r.filter(v=>!o.has(v)),x,or+$,m.y,this.trackHeight());if(!w.length||Jc(w,x,m.y)){for(const v of w)l.add(v);s.push(m);continue}const S=w[0];o.add(S),s.push({x:S.x,y:S.y,pts:n,points:[...m.points.filter(v=>n-v.t<=.4),{t:n,x:S.x,p:S.p}]})}const d=[];for(const m of r)o.has(m)||l.has(m)||(m.x-this.seed)*this.direction>ia||[...o,...d].some(b=>sa(m,b))||(d.push(m),s.push({x:m.x,y:m.y,pts:n,points:[{t:n,x:m.x,p:m.p}]}));s.sort((m,b)=>b.points.length-m.points.length||(b.x-m.x)*this.direction);const c=s.slice(0,S_),h=m=>m.points.filter(b=>n-b.t<=this.decisionWindow(i)+ze),f=c.filter(m=>{if(m.pts!==n)return!1;const b=h(m),x=b.length?b.at(-1).t-b[0].t:0;if(b.length<gn||x-this.minSpan(i)<-ze)return!1;const $=Ge(b).slope*this.direction,w=(b.at(-1).x-b[0].x)*this.direction,S=m.points,v=S.at(-1).t-S[0].t,E=(S.at(-1).x-S[0].x)*this.direction;if(!($>=gt&&w>=.7*gt*x&&E>=.5*gt*v))return!1;const z=.1*Math.max(0,Ge(S).slope*this.direction);return(S[0].x-this.seed)*this.direction>z+ze?!1:this.sprintSpeed<=gt||v-k_>-ze&&Ge(S).slope*this.direction>=this.sprintSpeed}),g=f[0]??null;return g&&f.length>1&&Math.abs(f[1].x-g.x)<jc?{next:c,confirmed:null}:{next:c,confirmed:g}}adopt(t,r){const n=q_(t.points);this.x=t.x,this.y=t.y,this.pts=r,this.provisional=[],this.watchTracks=[],this.rivalSeen=!1,this.nearer=[];const i=t.points.filter(a=>r-a.t<=Math.max(Lc,this.decisionWindow())+ze);return this.velocity=this.sparse&&i.length>=2?Math.max(-1,Math.min(1,Ge(i).slope)):0,this.resumption=null,this.behindStart=!0,this.history=n.map(({t:a,x:s})=>({t:a,x:s})),this.updateVelocity(r),this.running=!0,this.backfill=n.slice(0,-1).map(a=>({pts:a.t,pose:a.p})),this.publishedFrom=n[0].t,t.points.at(-1).p}}function q_(e){const t=e.at(-1).t;let r=e.findIndex(i=>t-i.t<=Gc+ze);r=Math.min(r,Math.max(0,e.length-3));const n=Ge(e.slice(r));for(;r>0;){const i=e[r-1],a=Math.max(0,t-Gc-i.t);if(Math.abs(n.mx+n.slope*(i.t-n.mt)-i.x)>N_+.5*O_*a**2)break;r--}return e.slice(r)}const Pr=4;class ig{constructor(t,r,n,i,a,s,o,l=!1,d=!1){this.source=t,this.model=r,this.watcher=n,this.liveWatch=l,this.fromBlocks=d,this.crop=document.createElement("canvas");const c=this.crop.getContext("2d");if(!c)throw new Error("映像処理を開始できません。");this.cc=c;const h=a===void 0||!(o>0)?0:Aa*Math.abs(a-i)/o;this.tracker=new j_(i,a===void 0?0:a-i,s,h,d)}source;model;watcher;liveWatch;fromBlocks;samples=[];tracker;sampleAt=new Map;crop;cc;top=0;bottom=1;analysed=0;get idle(){return this.tracker.idle}detect(t,r,n,i,a){return this.crop.width=512,this.crop.height=Math.round(512*r.h*a/(r.w*i)),this.cc.drawImage(this.source,r.x*i,r.y*a,r.w*i,r.h*a,0,0,this.crop.width,this.crop.height),t.estimate(this.crop,n.frameIndex,n.pts).landmarks.map(s=>s.map(o=>({...o,x:r.x+o.x*r.w,y:r.y+o.y*r.h})))}async process(t,r,n){this.analysed++;const i=this.tracker,a=this.samples,s={x:Math.max(0,Math.min(.64,i.expected(n.pts)-.18)),y:this.top,w:.36,h:this.bottom-this.top},o=this.detect(this.model,s,n,t,r),l=i.watchCentre(n.pts),d=l===null?null:{x:Math.max(0,Math.min(.64,l-.18)),y:0,w:.36,h:1};let c;d&&Math.abs(d.x-s.x)>.01&&(this.analysed%2===0||this.liveWatch&&i.watching)&&(c={poses:this.detect(await this.watcher(),d,n,t,r),view:[d.x,d.x+d.w]});const h=i.choose(o,n.pts,[s.x,s.x+s.w],c),f=i.takeRetraction();if(f!==null)for(let m=a.length-1;m>=0&&a[m].pts>=f;m--)a[m]=si([],a[m].frame,a[m].pts,t/r);const g=i.takeBackfill();for(const{pts:m,pose:b}of g){const x=this.sampleAt.get(m);x!==void 0&&(a[x]=si(b,a[x].frame,m,t/r))}if(g.length&&(this.top=0,this.bottom=1),h.length&&!this.fromBlocks){const m=h.filter($=>($.visibility??0)>=.3).map($=>$.y),b=Math.max(0,Math.min(...m)-.12),x=Math.min(1,Math.max(...m)+.12);x-b>.2&&(this.top=.8*this.top+.2*b,this.bottom=.8*this.bottom+.2*x)}return this.sampleAt.set(n.pts,a.length),a.push(si(h,n.frameIndex,n.pts,t/r)),h}}const ep=120,W_=30,F_=240;async function ag(e,t,r,n,i,a="standing",s=10,o={}){const l=()=>{if(r.aborted)throw new DOMException("中止","AbortError")};if(l(),!eu.isAvailable())throw new Error("このブラウザではフレーム解析ができません。対応する最新のブラウザでお試しください。");if(e.size>150*1024*1024)throw new Error("150MB以内のMP4 / MOVを選んでください。");n(0,"元動画のフレーム時刻を確認しています。");const d=await Ht(xy(e),r);if(l(),!d.frames.length||d.frames.length>3600||d.frames.at(-1).pts-d.frames[0].pts>30)throw new Error("1走分・30秒以内・3600フレーム以内の動画を選んでください。");const c=Sy(d.videoTrack.matrix),h=new eu(e,d.videoTrack,d.frames,d.rawSamples,d.descriptionBuffer),f=new Br("full",void 0,"CPU",Pr);let g=null;const m=async()=>(g||(g=new Br("full",void 0,"CPU",Pr,"IMAGE"),await Ht(g.initialize(r),r),l()),g),b=document.createElement("canvas"),x=b.getContext("2d");if(!x)throw new Error("映像処理を開始できません。");const $=new ig(b,f,m,t,i,a,s,!1,o.fromBlocks),w=()=>h.dispose();r.addEventListener("abort",w,{once:!0});let S=performance.now(),v=-1/0;const E=d.frames.at(-1).pts-d.frames[0].pts,z=E>0?(d.frames.length-1)/E:ep,M=Math.max(1,Math.round(z/(o.maxFps??ep))),k=Math.max(M,Math.round(z/W_));let B=0;try{await Ht(f.initialize(r,U=>n(0,U)),r),l();for(const U of d.frames){if(U.frameIndex<B){await Ht(h.skipExactFrame(U.frameIndex),r),l();continue}B=U.frameIndex+M;const G=await Ht(h.decodeExactFrame(U.frameIndex).then(Y=>(r.aborted&&h.dispose(),Y)),r);if(l(),G.status!=="SUCCESS"||G.actualDecodedFrameIndex!==U.frameIndex)throw new Error("動画フレームを正しく読み出せません。");const V=G.bitmap,Z=c%180?V.height:V.width,O=c%180?V.width:V.height;(b.width!==Z||b.height!==O)&&(b.width=Z,b.height=O),x.setTransform(1,0,0,1,0,0),x.clearRect(0,0,Z,O),x.translate(Z/2,O/2),x.rotate(c*Math.PI/180),x.drawImage(V,-V.width/2,-V.height/2),x.setTransform(1,0,0,1,0,0);const P=await $.process(Z,O,U);o.onSelected?.(U,P,Z,O),o.afterSelected&&(await Ht(o.afterSelected(b),r),l()),$.idle&&(B=U.frameIndex+k);const H=performance.now();H-v>100&&(n((U.frameIndex+1)/d.frames.length,"選手と脚の動きを解析しています。"),v=H),H-S>32&&(await new Promise(Y=>setTimeout(Y,0)),S=performance.now(),l())}return n(1,"解析が終わりました。"),$.samples}finally{r.removeEventListener("abort",w),h.dispose(),f.dispose(),g?.dispose(),b.width=0}}async function G_(e,t,r,n){const i=[];let a=0,s=0,o=null;try{o=await Ht(b_(r,l=>n(0,l)),r)}catch(l){if(r.aborted)throw l;o=null}return await ag(e,t,r,n,void 0,"standing",10,{maxFps:F_,fromBlocks:!0,onSelected:(l,d,c,h)=>{a=c,s=h,i.push({frame:l.frameIndex,pts:l.pts,pose:d.length===33?d.map(f=>({x:f.x,y:f.y,visibility:f.visibility})):null})},afterSelected:o?async l=>{const d=i.at(-1);d?.pose&&(d.refined=await o.refine(l,d.pose))}:void 0}),{frames:i,width:a,height:s,refiner:o?.backend??null}}const V_=1280;function oa(e,t,r){return new Promise((n,i)=>{const a=()=>{clearTimeout(s),e.removeEventListener(t,a),n()},s=setTimeout(()=>{e.removeEventListener(t,a),i(new Error(`${t} timed out`))},r);e.addEventListener(t,a)})}async function H_(e,t=15e3){const r=document.createElement("video");r.muted=!0,r.playsInline=!0,r.preload="auto",r.style.cssText="position:fixed;left:-10000px;top:0;width:320px;height:180px;pointer-events:none",document.body.appendChild(r);try{const n=oa(r,"loadedmetadata",t);if(r.src=e,r.load(),await n,r.readyState<2){const o=oa(r,"loadeddata",t);await r.play().catch(()=>{}),r.pause(),r.readyState<2&&await o}if(r.currentTime>0){const o=oa(r,"seeked",t);r.currentTime=0,await o}if(await new Promise(o=>requestAnimationFrame(()=>o())),!r.videoWidth||!r.videoHeight)return null;const i=Math.min(1,V_/r.videoWidth),a=document.createElement("canvas");a.width=Math.round(r.videoWidth*i),a.height=Math.round(r.videoHeight*i);const s=a.getContext("2d");return s?(s.drawImage(r,0,0,a.width,a.height),{image:a.toDataURL("image/jpeg",.85),width:r.videoWidth,height:r.videoHeight}):null}catch{return null}finally{r.pause(),r.removeAttribute("src"),r.load(),r.remove()}}function sg(e){const[t,r]=ee.useState(null);return ee.useEffect(()=>{let n=!1;return r(null),e&&H_(e).then(i=>{n||r(i)}),()=>{n=!0}},[e]),t}function ls({video:e,url:t,disabled:r=!1}){const[n,i]=ee.useState(!1),[a,s]=ee.useState(0),[o,l]=ee.useState(0);ee.useEffect(()=>{const f=e.current;if(!f)return;const g=()=>{i(!f.paused&&!f.ended),s(f.currentTime),l(Number.isFinite(f.duration)?f.duration:0)},m=["play","pause","ended","timeupdate","seeked","loadedmetadata","durationchange","emptied"];for(const b of m)f.addEventListener(b,g);return g(),()=>{for(const b of m)f.removeEventListener(b,g)}},[e,t]);async function d(f){if(f.readyState>=2)return;const g=f.muted;f.muted=!0,await f.play().catch(()=>{}),f.pause(),f.muted=g}async function c(){const f=e.current;f&&(f.paused||f.ended?(f.ended&&(f.currentTime=0),await f.play().catch(()=>{})):f.pause())}async function h(f){const g=e.current;g&&(await d(g),g.currentTime=f,s(f))}return I.jsxs("div",{className:"sprint10-playerbar",children:[I.jsx("button",{type:"button","aria-label":n?"一時停止":"再生",disabled:r||!t,onClick:()=>{c()},children:n?"❚❚":"▶"}),I.jsx("input",{type:"range","aria-label":"動画の位置",min:0,max:o||0,step:"any",value:Math.min(a,o||0),disabled:r||!o,onChange:f=>{h(Number(f.target.value))}}),I.jsxs("span",{children:[a.toFixed(2)," / ",o.toFixed(2),"秒"]})]})}const og=.25,K_=20,X_=4,Z_=1,Y_=2,Q_="別の人と重なって選手を見分けられなかったため、この1本は計測できませんでした。",tp="走っている途中で選手を見失ったため、この1本は計測できませんでした。",J_={standing:"ゴール通過を確認できませんでした。ゴールの付近で選手が他の人と重なっていないか確認してください。",flying:"出口の線の通過を確認できませんでした。出口の付近で選手が他の人と重なっていないか確認してください。"};function rp(e,t,r,n=!1){const i=e.filter(c=>c.hipX!==null);if(!i.length)return null;const a=wp(e,t.startX,t.finishX,t.distanceM,t.start,Ay),s=Math.sign(t.finishX-t.startX),o=a.finish?.pts??i.find(c=>(c.hipX-t.finishX)*s>0)?.pts;if(o===void 0||r-o<og)return null;const l=c=>({duration:null,speed:null,startPts:a.start?.pts??null,finishPts:o,notes:[],failure:c});if(a.duration===null||!a.start||!a.finish||a.speed===null)return l(!a.reason||a.reason.includes("動画の時刻")?tp:a.reason.includes("動画")?J_[t.start]:a.reason);if(a.speed<Y_)return"invalid";const d=[a.start.pts,...i.filter(c=>c.pts>a.start.pts&&c.pts<a.finish.pts).map(c=>c.pts),a.finish.pts];return d.some((c,h)=>h>0&&c-d[h-1]>Z_)?l(tp):n?l(Q_):{duration:a.duration,speed:a.speed,startPts:a.start.pts,finishPts:a.finish.pts,notes:a.warnings.filter(c=>c.includes("推定しました")&&c.includes("線")),failure:null}}async function e1(e,t,r,n,i){const a=()=>{if(r.aborted)throw new DOMException("中止","AbortError")},s=new Br("full",void 0,"CPU",Pr);let o=null;const l=document.createElement("canvas"),d=l.getContext("2d");if(!d)throw new Error("映像処理を開始できません。");try{await s.initialize(r,z=>i({fps:null,following:!1,message:z})),a(),t.start==="flying"&&(o=new Br("full",void 0,"CPU",Pr,"IMAGE"),await o.initialize(r),a());const c=async()=>(o||(o=new Br("full",void 0,"CPU",Pr,"IMAGE"),await o.initialize(r),a()),o),h=()=>new ig(l,s,c,t.startX,t.finishX,t.start,t.distanceM,!0),f=new Ey;let g=h(),m=0,b=0,x=!1,$=0,w=!1,S=-1/0;const v=()=>{const z=g.samples.at(-1),M=z?rp(g.samples,t,z.pts+og,g.tracker.contested):null;M&&M!=="invalid"&&n({...M,id:++b}),g=h(),S=-1/0},E=[];await new Promise((z,M)=>{const k=G=>{w||(w=!0,e.cancelVideoFrameCallback($),r.removeEventListener("abort",B),G?M(G):z())},B=()=>k(new DOMException("中止","AbortError")),U=(G,V)=>{if(w||($=e.requestVideoFrameCallback(U),x||!e.videoWidth||!e.videoHeight))return;x=!0;const Z=e.videoWidth,O=e.videoHeight;(l.width!==Z||l.height!==O)&&(l.width=Z,l.height=O,v());let P;try{P=Iy(e,d,Z,O)}catch(j){x=!1,k(j);return}const H=f.read(G,{...V,frameTime:P});H.reset&&v();const Y=H.measurementPts;if(Y===null||Y<=S){x=!1;return}S=Y,(async()=>{try{for(await g.process(Z,O,{frameIndex:m++,pts:Y}),E.push(Y);E.length>2&&E.at(-1)-E[0]>1;)E.shift();if(m%X_===0){const K=rp(g.samples,t,Y,g.tracker.contested);K==="invalid"?g=h():K?(n({...K,id:++b}),g=h()):Y-g.samples[0].pts>K_&&v()}const j=E.length>1?E.at(-1)-E[0]:0;i({fps:j>=.5?(E.length-1)/j:null,following:g.tracker.following,message:g.tracker.following?"選手を追跡しています。":"選手を待っています。"})}catch(j){k(j)}finally{x=!1}})()};if(r.addEventListener("abort",B,{once:!0}),r.aborted){B();return}$=e.requestVideoFrameCallback(U)})}finally{s.dispose(),o?.dispose(),l.width=0}}function t1({intervals:e,seek:t}){return I.jsxs("section",{"aria-label":"1歩ごとのストライド",children:[I.jsx("h3",{children:"1歩ごとのストライド（推定）"}),I.jsx("p",{children:"隣り合う脚の入れ替わり時点で、骨盤中心が進んだ距離です。10mを歩数で等分した値ではありません。"}),I.jsx("p",{children:"ライン内の入れ替わり同士の間だけを計算します。スタート・ゴール端の部分区間は除外します。"}),!e.length&&I.jsx("p",{children:"距離を算出できる連続した入れ替わりがありません。"}),I.jsx("ol",{className:"sprint10-strides",children:e.map(r=>I.jsxs("li",{children:[I.jsxs("div",{children:[I.jsxs("strong",{children:[r.fromStep," → ",r.toStep,"回目の入れ替わり"]}),I.jsx("span",{className:"sprint10-stride-value",children:r.distanceM===null?"—":`${r.distanceM.toFixed(2)} m`})]}),I.jsxs("p",{children:[(r.toPts-r.fromPts).toFixed(3)," 秒",r.reason?` · ${r.reason}`:""]}),I.jsxs("div",{className:"sprint10-events",children:[I.jsx("button",{onClick:()=>t(r.fromPts,`${r.fromStep}回目の入れ替わり`),children:"始点を見る"}),I.jsx("button",{onClick:()=>t(r.toPts,`${r.toStep}回目の入れ替わり`),children:"終点を見る"})]})]},r.toStep))}),I.jsx("p",{children:"距離 = 骨盤の水平移動量 ÷ 2本のラインの水平間隔 × 10m。真横に近い固定撮影が前提です。接地間の実測ストライドではありません。"})]})}const ug="crouch-start-v2-experimental",Ma=5,Bn=e=>e.refined??e.pose,lg=[31,32],yt=(e,t=.5)=>!!e&&Number.isFinite(e.x)&&Number.isFinite(e.y)&&(e.visibility??1)>=t,cr=e=>{const t=[...e].sort((r,n)=>r-n);return t.length?t[t.length>>1]:NaN},ur=(e,t)=>{const r=[...e].sort((n,i)=>n-i);return r.length?r[Math.min(r.length-1,Math.floor(t*r.length))]:NaN},r1=.02,dg=.05,cg=.1,np=.03,n1=.03,i1=.06,a1=.4,s1=.03,o1=.05,ip=.06,ap=.15,u1=.05,l1=.2,d1=.45,sp=.38,c1=.1,p1=.1;function h1(e,t){const r={version:ug,reason:null,direction:0,set:null,blockClearance:null,blocks:null,contacts:[],steps:[],firstFlight:null,notes:[]},n=C=>({...r,reason:C}),{width:i,height:a}=t,s=e.filter(C=>C.pose);if(s.length<20)return n("選手を十分に捉えられませんでした。真横から、全身が映るように撮影してください。");const o=C=>({x:C.x*i,y:C.y*a}),l=C=>yt(C[23],.3)&&yt(C[24],.3)?o({x:(C[23].x+C[24].x)/2,y:(C[23].y+C[24].y)/2}):null,d=s.flatMap(C=>[[23,27],[24,28]].flatMap(([R,ie])=>yt(C.pose[R])&&yt(C.pose[ie])?[Math.hypot((C.pose[R].x-C.pose[ie].x)*i,(C.pose[R].y-C.pose[ie].y)*a)]:[])),c=ur(d,.9);if(!(c>0))return n("脚を十分に捉えられませんでした。");const h=s.flatMap(C=>{const R=l(C.pose);return R?[{t:C.pts,frame:C.frame,...R}]:[]}),f=Math.sign(h.at(-1).x-h[0].x);if(!f)return n("走る向きを確認できませんでした。");r.direction=f;const g=cr(h.slice(0,Math.max(3,Math.round(h.length*.05))).map(C=>C.x)),m=h.findIndex((C,R)=>(C.x-g)*f>ip*c&&h.slice(R,R+10).every(ie=>(ie.x-g)*f>ip*c));if(m<0)return n("走り出しを確認できませんでした。");const b=h[m].t;if(b-h[0].t<c1)return n("スタートの構えを確認できませんでした。構えから映っている動画を使ってください。");const x=s.flatMap(C=>lg.filter(R=>yt(C.pose[R])).map(R=>({t:C.pts,frame:C.frame,...o(C.pose[R])}))),$=x.filter(C=>x.some(R=>R!==C&&Math.abs(R.t-C.t)<=r1&&Math.abs(R.t-C.t)>0&&Math.hypot(R.x-C.x,R.y-C.y)<dg*c)),w=[];for(const C of $){const R=w.find(ie=>Math.abs(ie.x-C.x)<cg*c&&C.t-ie.to<=np);R?(R.toes.push(C),R.to=Math.max(R.to,C.t),R.x=cr(R.toes.map(ie=>ie.x))):w.push({x:C.x,y:C.y,from:C.t,to:C.t,toes:[C]})}for(const C of w)C.y=ur(C.toes.map(R=>R.y),.8);const S=w.filter(C=>C.to-C.from>=n1),v=$.filter(C=>C.t<b);if(v.length<4)return n("スタートの構え（ブロック上の足）を確認できませんでした。構えから映っている動画を使ってください。");const E=C=>C*f,z=[ur(v.map(C=>E(C.x)),.05)-ap*c,ur(v.map(C=>E(C.x)),.95)+ap*c],M=C=>E(C.x)>=z[0]&&E(C.x)<=z[1],k=$.filter(C=>C.t>=b&&M(C)).sort((C,R)=>C.t-R.t),B=k.filter(C=>C.t<=b+.15),U=B.length?ur(B.map(C=>E(C.x)),.75):z[1];let G=b;for(const C of x.filter(R=>R.t>=b).sort((R,ie)=>R.t-ie.t)){const R=E(C.x)-U;if(!(R<-.12*c||R>p1*c)){if(C.t-G>u1)break;G=C.t}}const V=k.filter(C=>C.t>=G-.05),Z=V.length?cr(V.map(C=>C.x)):f>0?z[1]/f:z[0]/f,O=v.filter(C=>(Z-C.x)*f>.15*c);r.blocks={front:Z/i,rear:O.length?cr(O.map(C=>C.x))/i:null};const P={x:Z},H=[];for(const C of f1(S.filter(R=>R.from>G-np&&E(R.x)>z[1]+.2*c),c).filter(R=>R.to-R.from>=i1).sort((R,ie)=>R.from-ie.from)){const R=H.at(-1);if((!R||(C.x-R.x)*f>a1*c)&&H.push(C),H.length===Ma)break}const Y=s.at(-1).pts;r.contacts=H.map((C,R)=>m1(C,R+1,x,c,Y));const j=s.filter(C=>C.pts<b&&C.pts>=b-l1),K=s.findIndex(C=>C.pts>=G),J=K<0?[]:s.slice(Math.max(0,K-2),K+3);r.set=j.length?up(j,P.x/i,i,a,f,c):null,r.blockClearance=J.length?up(J,P.x/i,i,a,f,c,s[K]):null;const L=r.contacts[0];r.firstFlight=L?.touchdown!=null?L.touchdown-G:null,r.steps=r.contacts.map((C,R)=>{const ie=r.contacts[R+1]??null,Se=C.touchdown!==null&&C.toeOff!==null?C.toeOff-C.touchdown:null,ve=ie?.touchdown!=null&&C.toeOff!==null?ie.touchdown-C.toeOff:null,Ae=ie?.touchdown!=null&&C.touchdown!==null?ie.touchdown-C.touchdown:null,ge=C.touchdownFrame!==null?e.find(Te=>Te.frame===C.touchdownFrame):null,he=ge?Bn(ge):null,Me=he?pg(he,C.x/i,i):null;return{step:C.index,contactSeconds:Se,flightSeconds:ve,stepSeconds:Ae,pitch:Ae?1/Ae:null,shankAngle:he&&Me!==null?g1(he,Me,i,a,f):null,trunkAngle:he?hg(he,i,a,f,c):null,side:Me}}),r.contacts.length||r.notes.push("ブロックを離れた後の接地が映っていません。");const re=r.contacts.filter(C=>C.toeOff===null).map(C=>C.index);return re.length&&r.notes.push(`${re.join("・")}歩目は離地が映っていないため、接地時間を出していません。`),r}function f1(e,t){const r=[];for(const n of[...e].sort((i,a)=>i.from-a.from)){const i=r.find(a=>Math.abs(a.x-n.x)<cg*t);i?(i.toes.push(...n.toes),i.from=Math.min(i.from,n.from),i.to=Math.max(i.to,n.to),i.x=cr(i.toes.map(a=>a.x)),i.y=ur(i.toes.map(a=>a.y),.8)):r.push({...n,toes:[...n.toes]})}return r}function m1(e,t,r,n,i){const a=r.filter(d=>Math.abs(d.x-e.x)<dg*2*n&&d.t>=e.from-.1&&d.t<=e.to+.1).sort((d,c)=>d.t-c.t),s=a.find(d=>e.y-d.y<s1*n)??null,o=[...a].reverse().find(d=>e.y-d.y<o1*n)??null,l=o===null||i-o.t<.02;return{index:t,x:e.x,groundY:e.y,touchdown:s?.t??null,touchdownFrame:s?.frame??null,toeOff:l?null:o.t}}function pg(e,t,r){const n=lg.map(i=>yt(e[i],.3)?Math.abs(e[i].x-t)*r:1/0);return n[0]===1/0&&n[1]===1/0?null:n[0]<=n[1]?0:1}const ds=e=>e*180/Math.PI;function hg(e,t,r,n,i){if(![11,12,23,24].every(d=>yt(e[d],.3)))return null;const a=(e[11].x+e[12].x)/2*t,s=(e[11].y+e[12].y)/2*r,o=(e[23].x+e[24].x)/2*t,l=(e[23].y+e[24].y)/2*r;return Math.hypot(a-o,s-l)<d1*i?null:ds(Math.atan2((a-o)*n,l-s))}function g1(e,t,r,n,i){const a=e[25+t],s=e[27+t];return!yt(a,.3)||!yt(s,.3)?null:ds(Math.atan2((a.x-s.x)*r*i,(s.y-a.y)*n))}function op(e,t,r,n,i){const[a,s,o]=[e[23+t],e[25+t],e[27+t]];if(![a,s,o].every(h=>yt(h,.3)))return null;const l={x:(a.x-s.x)*r,y:(a.y-s.y)*n},d={x:(o.x-s.x)*r,y:(o.y-s.y)*n};if(Math.hypot(l.x,l.y)<sp*i||Math.hypot(d.x,d.y)<sp*i)return null;const c=(l.x*d.x+l.y*d.y)/(Math.hypot(l.x,l.y)*Math.hypot(d.x,d.y));return ds(Math.acos(Math.max(-1,Math.min(1,c))))}function up(e,t,r,n,i,a,s){const o=b=>{const x=Bn(b),$=pg(x,t,r);return{side:$,trunk:hg(x,r,n,i,a),front:$===null?null:op(x,$,r,n,a),rear:$===null?null:op(x,1-$,r,n,a)}},l=e.map(o),d=b=>{const x=l.flatMap($=>$[b]===null?[]:[$[b]]);return x.length*2>=e.length?cr(x):null},c=d("trunk"),h=d("front"),f=d("rear"),g=b=>[[b.trunk,c],[b.front,h],[b.rear,f]].reduce((x,[$,w])=>w===null?x:$===null?1/0:x+Math.abs($-w),0),m=s??e[l.reduce((b,x,$)=>g(x)<g(l[b])?$:b,l.length-1)];return{frame:m.frame,pts:m.pts,trunkAngle:c,frontKnee:h,rearKnee:f,frontSide:o(m).side}}const lp=e=>e!==null;function y1(e){const t=[],r=(n,i,a,s)=>{if(!a)return;const o=a.frontSide,l=[a.trunkAngle===null?null:{kind:"trunk",label:"体幹",value:a.trunkAngle},a.frontKnee===null||o===null?null:{kind:"knee",side:o,label:"前膝",value:a.frontKnee},!s||a.rearKnee===null||o===null?null:{kind:"knee",side:1-o,label:"後膝",value:a.rearKnee}].filter(lp);t.push({key:n,label:i,frame:a.frame,pts:a.pts,marks:l})};r("set","構え",e.set,!0),r("clearance","ブロックを離れる瞬間",e.blockClearance,!1);for(const n of e.steps){const i=e.contacts.find(s=>s.index===n.step);if(!i||i.touchdown===null||i.touchdownFrame===null)continue;const a=[n.shankAngle===null||n.side===null?null:{kind:"shank",side:n.side,label:"脛",value:n.shankAngle},n.trunkAngle===null?null:{kind:"trunk",label:"体幹",value:n.trunkAngle}].filter(lp);t.push({key:`td${n.step}`,label:`${n.step}歩目の接地`,frame:i.touchdownFrame,pts:i.touchdown,marks:a})}return t}const cs=e=>`${e.label} ${Math.round(e.value)}°`,b1=e=>e.kind==="trunk"?"#ffb02e":e.kind==="shank"?"#3ad7ff":e.label==="後膝"?"#b58cff":"#ff6fd8",fg=e=>!!e&&Number.isFinite(e.x)&&Number.isFinite(e.y)&&(e.visibility??1)>=.3;function _1(e,t,r,n,i=.35){const a=e.filter(m=>fg(m)).map(m=>({x:m.x*t,y:m.y*r}));if(!a.length)return{x:0,y:0,w:t,h:r};const s=Math.min(...a.map(m=>m.x)),o=Math.max(...a.map(m=>m.x)),l=Math.min(...a.map(m=>m.y)),d=Math.max(...a.map(m=>m.y));let c=(o-s)*(1+2*i),h=(d-l)*(1+2*i);c/h<n?c=h*n:h=c/n,c=Math.min(c,t,r*n),h=c/n;const f=Math.max(0,Math.min(t-c,(s+o)/2-c/2)),g=Math.max(0,Math.min(r-h,(l+d)/2-h/2));return{x:f,y:g,w:c,h}}function mg(e,t,r,n,i,a){const s=c=>fg(t[c])?r(t[c]):null;e.save(),e.lineCap="round",e.lineJoin="round",e.strokeStyle="rgba(255,255,255,.85)",e.lineWidth=i*.25;for(const[c,h]of tu){const f=s(c),g=s(h);!f||!g||(e.beginPath(),e.moveTo(f.x,f.y),e.lineTo(g.x,g.y),e.stroke())}e.fillStyle="#ffffff";for(const c of new Set(tu.flat())){const h=s(c);h&&(e.beginPath(),e.arc(h.x,h.y,i*.3,0,Math.PI*2),e.fill())}const o=(c,h)=>{const f=s(c),g=s(h);return f&&g?{x:(f.x+g.x)/2,y:(f.y+g.y)/2}:null},l=[],d=c=>l.every(h=>c.x+c.w<=h.x||h.x+h.w<=c.x||c.y+c.h<=h.y||h.y+h.h<=c.y);for(const c of n){const h=b1(c),[f,g,m]=c.kind==="trunk"?[o(23,24),o(11,12),null]:c.kind==="shank"?[s(27+c.side),s(25+c.side),null]:[s(25+c.side),s(27+c.side),s(23+c.side)];if(!f||!g||c.kind==="knee"&&!m)continue;const b=Math.hypot(g.x-f.x,g.y-f.y),x=m??{x:f.x,y:f.y-b};e.strokeStyle=h,e.lineWidth=i*.7,e.beginPath(),e.moveTo(f.x,f.y),e.lineTo(g.x,g.y),m&&(e.moveTo(f.x,f.y),e.lineTo(m.x,m.y)),e.stroke(),c.kind!=="knee"&&(e.setLineDash([i*.8,i*.6]),e.lineWidth=i*.35,e.beginPath(),e.moveTo(f.x,f.y),e.lineTo(x.x,x.y),e.stroke(),e.setLineDash([]));const $=Math.atan2(x.y-f.y,x.x-f.x);let S=Math.atan2(g.y-f.y,g.x-f.x)-$;for(;S>Math.PI;)S-=2*Math.PI;for(;S<-Math.PI;)S+=2*Math.PI;const v=Math.max(i*2.2,Math.min(b*.35,i*5));if(e.lineWidth=i*.45,e.beginPath(),e.arc(f.x,f.y,v,$,$+S,S<0),e.stroke(),a){const E=$+S/2,z=cs(c),M=i*1.8,k=i*.45;e.font=`700 ${M}px system-ui, sans-serif`,e.textBaseline="middle";const B=e.measureText(z).width,U=B+2*k,G=M+2*k,V=e.canvas.width,Z=e.canvas.height,O=(L,re)=>{const C=Math.cos(E)*L,R=Math.sin(E)*L,ie=f.x+C*re+(C<-.3?-U:C>.3?0:-U/2),Se=f.y+R*re+(R<-.3?-G:R>.3?0:-G/2);return{x:Math.max(2,Math.min(V-U-2,ie)),y:Math.max(2,Math.min(Z-G-2,Se)),w:U,h:G}},P=O(1,v+i*1.4),H=O(-1,i*1.6),Y=c.kind==="knee"?[H,P]:[P,H],j=Y.find(d)??{...Y[0],y:Math.min(Z-G-2,Math.max(...l.map(L=>L.y+L.h))+2)};l.push(j);const{x:K,y:J}=j;e.fillStyle="rgba(8,18,16,.72)",e.beginPath(),e.roundRect?e.roundRect(K,J,U,G,k):e.rect(K,J,U,G),e.fill(),e.fillStyle=h,e.fillText(z,K+k,J+G/2)}}e.restore()}const Ot={frontKnee:[90,100],rearKnee:[115,135],firstFlight:[.02,.07],firstContact:[.17,.23]},dp={contact:[.177,.159,.136,.131],flight:[.051,.082,.082,.099]},Vt={knee:5,contact:.015,flight:.02,shankBack:3,trunkUp:10,trunkDown:5},ot=e=>`${Math.round(e)}°`,Nt=e=>`${e.toFixed(3)}秒`;function w1(e){const t=[],r=(a,s,[o,l])=>{if(s==null)return;const d=`目安${o}〜${l}°`;s<o-Vt.knee?t.push({topic:"構え",level:"check",text:`${a} ${ot(s)}：${d}より深く曲がっています。ブロックの前後の位置や腰の高さで変わります。`}):s>l+Vt.knee?t.push({topic:"構え",level:"check",text:`${a} ${ot(s)}：${d}より伸びています。ブロックの前後の位置や腰の高さで変わります。`}):t.push({topic:"構え",level:"good",text:s>=o&&s<=l?`${a} ${ot(s)}：${d}の範囲です。`:`${a} ${ot(s)}：${d}に近い値です（差は測定の誤差の範囲）。`})};if(r("前膝",e.set?.frontKnee,Ot.frontKnee),r("後膝",e.set?.rearKnee,Ot.rearKnee),e.firstFlight!==null){const[a,s]=Ot.firstFlight;t.push(e.firstFlight>s?{topic:"ブロックから1歩目",level:"check",text:`ブロックを離れてから1歩目の接地まで ${Nt(e.firstFlight)}：目安（${a}〜${s}秒）より長めです（この解析は0.01秒ほど長めに出ます）。ブロックから上へ跳び出していないか、スロー再生で確かめてください。`}:{topic:"ブロックから1歩目",level:"good",text:`ブロックを離れてから1歩目の接地まで ${Nt(e.firstFlight)}：目安（${a}〜${s}秒）の範囲です。`})}const n=e.steps[0]?.contactSeconds;if(n!=null){const[a,s]=Ot.firstContact;t.push(n>s?{topic:"1歩目",level:"check",text:`1歩目の接地 ${Nt(n)}：目安（${a}〜${s}秒）より長めです。`}:{topic:"1歩目",level:"good",text:`1歩目の接地 ${Nt(n)}：目安（${a}〜${s}秒）${n<a?"より短めです":"の範囲です"}。`})}const i=(a,s,o,l)=>{const d=s.map((h,f)=>({v:h,step:f+1})).filter(h=>h.v!==null);if(d.length<2)return;const c=d.slice(1).flatMap((h,f)=>{const g=o(h.v,d[f].v);return g?[`${h.step}歩目：${g}`]:[]});t.push(c.length?{topic:a,level:"check",text:c.join(" ")}:{topic:a,level:"good",text:l})};i("接地時間",e.steps.map(a=>a.contactSeconds),(a,s)=>a>s+Vt.contact?`接地時間（${Nt(a)}）が前の歩（${Nt(s)}）より長くなっています。ふつうは歩ごとに短くなります。`:null,"接地時間はおおむね歩ごとに短くなっています（加速の流れどおり）。"),i("滞空時間",e.steps.map(a=>a.flightSeconds),(a,s)=>a<s-Vt.flight?`滞空時間（${Nt(a)}）が前の歩（${Nt(s)}）より短くなっています。ふつうは歩ごとに長くなります。`:null,"滞空時間はおおむね歩ごとに同じか長くなっています（加速の流れどおり）。"),i("脛",e.steps.map(a=>a.shankAngle),(a,s)=>a>s+Vt.shankBack?`接地時の脛（${ot(a)}）が前の歩（${ot(s)}）より前に倒れています。ふつうは歩ごとに起きていきます。`:null,"接地時の脛はおおむね歩ごとに起きています（加速の流れどおり）。");for(const a of e.steps)a.shankAngle!==null&&a.shankAngle<0&&t.push({topic:"脛",level:"check",text:`${a.step}歩目：脛が後ろへ傾いた（足首が膝より前の）接地です（${ot(a.shankAngle)}）。加速の初めは、膝が足首より前に出た形で接地するのがふつうです。`});return i("体幹",e.steps.map(a=>a.trunkAngle),(a,s)=>a<s-Vt.trunkUp?`体幹が急に起きています（${ot(s)}→${ot(a)}）。ふつうは少しずつ起きていきます。`:a>s+Vt.trunkDown?`体幹が前の歩より前に倒れています（${ot(s)}→${ot(a)}）。`:null,"接地時の体幹に、急に起きる・前に倒れるといった大きな変化はありません。"),t}const ua=340,la=180,bn=44,cp=14,pp=26,$1=26,hp=18;function v1(e,t){const r=t-e<1e-9?Math.max(Math.abs(t)*.05,.001):0,n=e-r,i=t+r,a=(i-n)/4,s=10**Math.floor(Math.log10(a)),o=[1,2,5,10].map(d=>d*s).find(d=>d>=a),l=[];for(let d=Math.floor(n/o+1e-9)*o;l.push(+d.toFixed(10)),!(d>=i-o*1e-9);d+=o);return l}function da({title:e,steps:t,series:r,digits:n,unit:i}){const a=r.flatMap(f=>f.values.filter(g=>g!==null));if(!a.length)return null;const s=v1(Math.min(...a),Math.max(...a)),o=s[0],l=s.at(-1),d=f=>bn+hp+(t>1?f/(t-1):.5)*(ua-bn-cp-2*hp),c=f=>pp+(l-f)/(l-o)*(la-pp-$1),h=r.filter(f=>!f.dashed).map(f=>`${f.label}：${f.values.map((g,m)=>`${m+1}歩目 ${g===null?"なし":g.toFixed(n)}`).join("、")}`).join("。");return I.jsxs("figure",{className:"sprint10-chart",children:[I.jsxs("figcaption",{children:[e,I.jsxs("small",{children:["（",i,"）"]})]}),I.jsxs("svg",{viewBox:`0 0 ${ua} ${la}`,role:"img","aria-label":`${e}：${h}`,children:[s.map(f=>I.jsxs("g",{children:[I.jsx("line",{x1:bn,x2:ua-cp,y1:c(f),y2:c(f),className:"grid"}),I.jsx("text",{x:bn-6,y:c(f),textAnchor:"end",dominantBaseline:"middle",children:f.toFixed(n===3?2:n)})]},f)),Array.from({length:t},(f,g)=>I.jsxs("text",{x:d(g),y:la-8,textAnchor:"middle",children:[g+1,"歩目"]},g)),r.map(f=>{const g=f.values.map((b,x)=>b===null||x>=t?null:{x:d(x),y:c(b),v:b}),m=g.reduce((b,x,$)=>x?`${b}${b&&g[$-1]?"L":"M"}${x.x.toFixed(1)},${x.y.toFixed(1)}`:b,"");return I.jsxs("g",{children:[I.jsx("path",{d:m,fill:"none",stroke:f.color,strokeWidth:f.dashed?1.5:2.5,strokeDasharray:f.dashed?"5 4":void 0}),!f.dashed&&g.map((b,x)=>b&&I.jsxs("g",{children:[I.jsx("circle",{cx:b.x,cy:b.y,r:3.5,fill:f.color}),I.jsx("text",{x:b.x,y:b.y-7,textAnchor:"middle",className:"value",style:{fill:f.color},children:b.v.toFixed(n)})]},x))]},f.label)})]}),I.jsx("ul",{className:"sprint10-legend",children:r.map(f=>I.jsxs("li",{children:[I.jsx("span",{style:{borderTop:`${f.dashed?"2px dashed":"3px solid"} ${f.color}`}}),f.label]},f.label))})]})}const x1=[["time","接地・滞空"],["pitch","ピッチ"],["angle","接地時の角度"]];function S1({result:e}){const[t,r]=ee.useState("time"),n=e.steps.length;if(n<2)return I.jsx("p",{children:"2歩以上の接地が映っていると、歩ごとの変化をグラフで表示します。"});const i=a=>Array.from({length:n},(s,o)=>a[o]??null);return I.jsxs("div",{className:"sprint10-charts",children:[I.jsx("div",{className:"sprint10-seg",role:"group","aria-label":"グラフを選ぶ",children:x1.map(([a,s])=>I.jsx("button",{type:"button","aria-pressed":t===a,onClick:()=>r(a),children:s},a))}),t==="time"&&I.jsx(da,{title:"接地時間・滞空時間",unit:"秒",steps:n,digits:3,series:[{label:"接地時間",color:"#127a55",values:e.steps.map(a=>a.contactSeconds)},{label:"滞空時間",color:"#2a6fdb",values:e.steps.map(a=>a.flightSeconds)},{label:"トップ選手の例（接地）",color:"#127a55",values:i(dp.contact),dashed:!0},{label:"トップ選手の例（滞空）",color:"#2a6fdb",values:i(dp.flight),dashed:!0}]}),t==="pitch"&&I.jsx(da,{title:"ピッチ",unit:"歩/秒",steps:n,digits:2,series:[{label:"ピッチ",color:"#8a4fd8",values:e.steps.map(a=>a.pitch)}]}),t==="angle"&&I.jsx(da,{title:"接地時の角度",unit:"°",steps:n,digits:0,series:[{label:"脛（鉛直から前へ）",color:"#0b9bc4",values:e.steps.map(a=>a.shankAngle)},{label:"体幹（鉛直から前へ）",color:"#e08a00",values:e.steps.map(a=>a.trunkAngle)}]})]})}const ca=(e,t)=>e===null?"—":e.toFixed(t);function k1({result:e}){return I.jsx("div",{className:"sprint10-table-wrap",children:I.jsxs("table",{className:"sprint10-table","aria-label":"1歩ごとの値",children:[I.jsx("thead",{children:I.jsxs("tr",{children:[I.jsx("th",{scope:"col",children:"歩"}),I.jsxs("th",{scope:"col",children:["接地",I.jsx("small",{children:"秒"})]}),I.jsxs("th",{scope:"col",children:["滞空",I.jsx("small",{children:"秒"})]}),I.jsxs("th",{scope:"col",children:["ピッチ",I.jsx("small",{children:"歩/秒"})]}),I.jsxs("th",{scope:"col",children:["脛",I.jsx("small",{children:"接地時"})]}),I.jsxs("th",{scope:"col",children:["体幹",I.jsx("small",{children:"接地時"})]})]})}),I.jsx("tbody",{children:e.steps.map(t=>I.jsxs("tr",{children:[I.jsxs("th",{scope:"row",children:[t.step,"歩目"]}),I.jsx("td",{children:ca(t.contactSeconds,3)}),I.jsx("td",{children:ca(t.flightSeconds,3)}),I.jsx("td",{children:ca(t.pitch,2)}),I.jsx("td",{children:t.shankAngle===null?"—":`${Math.round(t.shankAngle)}°`}),I.jsx("td",{children:t.trunkAngle===null?"—":`${Math.round(t.trunkAngle)}°`})]},t.step))})]})})}const Ar=720,pa=540,T1=3;function ps(e){const t=e.slice(1).map((r,n)=>r.pts-e[n].pts).filter(r=>r>0).sort((r,n)=>r-n);return t.length?t[t.length>>1]:1/240}const Nn=(e,t)=>e+.5*t;function gg(e,t,r){return new Promise((n,i)=>{const a=()=>{clearTimeout(s),e.removeEventListener(t,a),n()},s=setTimeout(()=>{e.removeEventListener(t,a),i(new Error(`${t} timed out`))},r);e.addEventListener(t,a)})}async function E1(e,t){const r=gg(e,"seeked",8e3);e.currentTime=t,await r,await new Promise(n=>requestAnimationFrame(()=>n()))}function I1({url:e,frames:t,phases:r,onShow:n,guides:i={}}){const[a,s]=ee.useState({}),[o,l]=ee.useState(!1),d=ee.useMemo(()=>ps(t),[t]);ee.useEffect(()=>{let m=!1;s({}),l(!1);const b=document.createElement("video");return b.muted=!0,b.playsInline=!0,b.preload="auto",b.style.cssText="position:fixed;left:-10000px;top:0;width:320px;height:180px;pointer-events:none",document.body.appendChild(b),(async()=>{try{const x=gg(b,"loadeddata",2e4);b.src=e,b.load();const $=setTimeout(()=>{b.readyState<2&&b.play().then(()=>b.pause()).catch(()=>{})},1500);await x,clearTimeout($);for(const w of r){const S=t.find(V=>V.frame===w.frame),v=S?Bn(S):null;if(m)return;if(!v)continue;if(await E1(b,Nn(w.pts,d)),m)return;const E=document.createElement("canvas");E.width=Ar,E.height=pa;const z=E.getContext("2d");if(!z)throw new Error("no canvas");const M=b.videoWidth,k=b.videoHeight,B=_1(v,M,k,Ar/pa),U=Ar/B.w;z.drawImage(b,B.x,B.y,B.w,B.h,0,0,Ar,pa),mg(z,v,V=>({x:(V.x*M-B.x)*U,y:(V.y*k-B.y)*U}),w.marks,Ar/48,!0);const G=E.toDataURL("image/jpeg",.85);m||s(V=>({...V,[w.key]:G}))}}catch{m||l(!0)}})(),()=>{m=!0,b.pause(),b.removeAttribute("src"),b.load(),b.remove()}},[e,t,r,d]);const c=ee.useRef(null),[h,f]=ee.useState(0),g=m=>{const b=c.current;b?.clientWidth&&b.scrollTo({left:m*b.clientWidth,behavior:"smooth"}),f(m)};return I.jsxs("div",{className:"sprint10-phase-view",children:[I.jsx("div",{className:"sprint10-chips",role:"group","aria-label":"局面を選ぶ",children:r.map((m,b)=>I.jsx("button",{type:"button","aria-pressed":h===b,"aria-label":m.label,onClick:()=>g(b),children:C1(m)},m.key))}),I.jsx("ol",{ref:c,className:"sprint10-phases","aria-label":"局面ごとの姿勢",onScroll:m=>{const b=m.currentTarget;b.clientWidth&&f(Math.max(0,Math.min(r.length-1,Math.round(b.scrollLeft/b.clientWidth))))},children:r.map((m,b)=>I.jsxs("li",{"aria-label":`${b+1}/${r.length} ${m.label}`,children:[I.jsxs("div",{className:"sprint10-phase-head",children:[I.jsxs("div",{children:[I.jsx("strong",{children:m.label}),I.jsxs("small",{children:[m.pts.toFixed(3),"秒"]})]}),I.jsx("button",{type:"button","aria-label":`${m.label}をスロー再生で見る`,onClick:()=>n(m),children:"▶ スローで見る"})]}),a[m.key]?I.jsx("img",{src:a[m.key],alt:`${m.label}の骨格と角度`}):I.jsx("div",{className:"sprint10-phase-wait",children:o?"画像を作れませんでした":"画像を作成しています…"}),I.jsx("p",{children:m.marks.length?m.marks.map(cs).join(" · "):"角度を測れませんでした"}),i[m.key]&&I.jsx("small",{className:"sprint10-guide",children:i[m.key]})]},m.key))})]})}const C1=e=>e.key==="set"?"構え":e.key==="clearance"?"離れる":e.label.replace("の接地",""),z1=[["1/8",.125],["1/4",.25],["通常",1]];function A1({url:e,video:t,frames:r,phases:n,events:i}){const a=ee.useRef(null),[s,o]=ee.useState(.125),[l,d]=ee.useState(!0),[c,h]=ee.useState(""),[f,g]=ee.useState(-1),m=ee.useRef(null),b=ee.useMemo(()=>r.filter(S=>S.pose),[r]),x=ee.useMemo(()=>ps(r),[r]);ee.useEffect(()=>{const S=t.current;S&&(S.defaultPlaybackRate=s,S.playbackRate=s)},[t,s,e]),ee.useEffect(()=>{const S=t.current,v=a.current,E=v?.getContext("2d");if(!S||!v||!E)return;let z=0,M=!1,k="",B=-1;const U=(P,H=-1)=>{P!==k&&(k=P,h(P)),H!==B&&(B=H,g(H))},G=()=>{E.clearRect(0,0,v.width,v.height),delete v.dataset.frame,U("")},V=P=>{if(S.seeking||!S.videoWidth){G();return}(v.width!==S.videoWidth||v.height!==S.videoHeight)&&(v.width=S.videoWidth,v.height=S.videoHeight),E.clearRect(0,0,v.width,v.height);const H=ru(b,P);if(!H||Math.abs(H.pts-P)>1.5*x){delete v.dataset.frame,U("");return}const Y=n.find(j=>Math.abs(j.pts-H.pts)<=(T1+.5)*x)??null;l&&mg(E,Bn(H),j=>({x:j.x*v.width,y:j.y*v.height}),Y?.marks??[],v.width/110,!1),v.dataset.frame=String(H.frame),U(Y?`${Y.label}　${Y.marks.map(cs).join(" · ")}`:"",i.findIndex(j=>Math.abs(j.pts-H.pts)<.5*x))},Z=()=>V(S.currentTime),O=(P,H)=>{M||(V(H.mediaTime),z=S.requestVideoFrameCallback(O))};for(const P of["seeked","loadeddata","timeupdate","pause"])S.addEventListener(P,Z);return S.addEventListener("seeking",G),Z(),S.requestVideoFrameCallback&&(z=S.requestVideoFrameCallback(O)),()=>{M=!0,z&&S.cancelVideoFrameCallback(z);for(const P of["seeked","loadeddata","timeupdate","pause"])S.removeEventListener(P,Z);S.removeEventListener("seeking",G),E.clearRect(0,0,v.width,v.height)}},[t,b,n,i,l,x,e]),ee.useEffect(()=>{const S=m.current,v=S?.children[f];S&&v&&S.scrollTo({left:v.offsetLeft-(S.clientWidth-v.offsetWidth)/2,behavior:"smooth"})},[f]);function $(S){const v=t.current;if(!v||!b.length)return;v.pause();const E=ru(b,v.currentTime)??b[0],z=b.indexOf(E),M=b[Math.max(0,Math.min(b.length-1,z+S))];v.currentTime=Nn(M.pts,x)}function w(S){const v=t.current;v&&(v.pause(),v.currentTime=Nn(S,x))}return I.jsxs(I.Fragment,{children:[I.jsxs("div",{className:"sprint10-player",children:[I.jsx("video",{ref:t,src:e,playsInline:!0,muted:!0,preload:"auto"}),I.jsx("canvas",{ref:a,className:"sprint10-replay-overlay","aria-label":"選手の骨格"}),I.jsxs("label",{className:"sprint10-overlay-toggle",children:[I.jsx("input",{type:"checkbox",checked:l,onChange:S=>d(S.target.checked)}),"骨格"]})]}),I.jsx(ls,{video:t,url:e}),I.jsx("p",{className:"sprint10-replay-caption","aria-live":"polite",children:c||" "}),I.jsxs("div",{className:"sprint10-replay-controls",children:[I.jsx("div",{className:"sprint10-seg",role:"group","aria-label":"再生の速さ",children:z1.map(([S,v])=>I.jsx("button",{type:"button","aria-pressed":s===v,onClick:()=>o(v),children:S},S))}),I.jsxs("div",{className:"sprint10-stepper",role:"group","aria-label":"1コマ送り",children:[I.jsx("button",{type:"button","aria-label":"1コマ戻る",onClick:()=>$(-1),children:"◀"}),I.jsx("span",{"aria-hidden":"true",children:"1コマ"}),I.jsx("button",{type:"button","aria-label":"1コマ進む",onClick:()=>$(1),children:"▶"})]})]}),I.jsx("div",{ref:m,className:"sprint10-events sprint10-chips",role:"group","aria-label":"判定した瞬間へ移動",children:i.map((S,v)=>I.jsxs("button",{type:"button","aria-label":`${S.label} ${S.pts.toFixed(3)}秒`,"aria-pressed":f===v,onClick:()=>w(S.pts),children:[S.short,I.jsx("small",{children:S.pts.toFixed(3)})]},`${S.label}${S.pts}`))})]})}const _n=.002,M1=(e,t=3)=>e==null?"—":e.toFixed(t),N1=[["advice","ポイント"],["pose","姿勢"],["steps","歩ごと"],["replay","スロー"]],O1=[["#ffb02e","体幹（腰→肩）"],["#3ad7ff","脛（足首→膝）"],["#ff6fd8","前膝"],["#b58cff","後膝"]];function R1(){const e=ee.useRef(null),t=ee.useRef(null),r=ee.useRef(null),n=ee.useRef(null),[i,a]=ee.useState(null),[s,o]=ee.useState(""),[l,d]=ee.useState(!1),[c,h]=ee.useState(!1),[f,g]=ee.useState(0),m=sg(s),b=l||!!m,[x,$]=ee.useState(.3),[w,S]=ee.useState(""),[v,E]=ee.useState(null);ee.useEffect(()=>()=>{s&&URL.revokeObjectURL(s)},[s]),ee.useEffect(()=>()=>{r.current?.abort(),r.current=null},[]);const z=ee.useMemo(()=>v?h1(v.frames,{width:v.width,height:v.height}):null,[v]),M=ee.useMemo(()=>z&&!z.reason?y1(z):[],[z]),k=ee.useMemo(()=>z&&!z.reason?w1(z):[],[z]),B=k.filter(C=>C.level==="check").length,U=ee.useMemo(()=>!z||z.reason?[]:[...z.set?[{label:"構え",short:"構え",pts:z.set.pts}]:[],...z.blockClearance?[{label:"ブロックを離れる",short:"離れる",pts:z.blockClearance.pts}]:[],...z.contacts.flatMap(C=>[...C.touchdown!==null?[{label:`${C.index}歩目の接地`,short:`${C.index}歩目 接地`,pts:C.touchdown}]:[],...C.toeOff!==null?[{label:`${C.index}歩目の離地`,short:`${C.index}歩目 離地`,pts:C.toeOff}]:[]])],[z]),[G,V]=ee.useState("advice"),Z=ee.useRef(null),O=ee.useRef(null),P=ee.useRef(null);ee.useEffect(()=>{V("advice"),z&&n.current?.scrollIntoView?.({behavior:"smooth",block:"start"})},[v]),ee.useEffect(()=>{const C=t.current;if(G!=="replay"||!C||P.current===null)return;const R=Nn(P.current,v?ps(v.frames):1/240);P.current=null;const ie=()=>{C.pause(),C.currentTime=R};C.readyState>=1?ie():C.addEventListener("loadedmetadata",ie,{once:!0})},[G,v]);function H(C){r.current?.abort(),r.current=null,h(!1),a(C),o(C?URL.createObjectURL(C):""),d(!1),E(null),S("")}function Y(C){c||$(Math.max(.01,Math.min(.99,C)))}function j(C){if(c||!C.currentTarget.hasPointerCapture(C.pointerId))return;const R=C.currentTarget.parentElement.getBoundingClientRect();Y((C.clientX-R.left)/R.width)}async function K(){if(!i||c)return;const C=new AbortController;r.current=C,h(!0),E(null),g(0),S("");try{const R=await G_(i,x,C.signal,(ie,Se)=>{g(ie),S(Se)});if(C.signal.aborted)return;E(R),S("解析が終わりました。")}catch(R){C.signal.aborted||S(R instanceof Error?R.message:String(R))}finally{r.current===C&&(r.current=null,h(!1))}}function J(C){V(C);const R=O.current?.getBoundingClientRect().top,ie=Z.current?.offsetHeight??0;R!==void 0&&R<ie&&window.scrollBy({top:R-ie})}function L(C){P.current=C.pts,J("replay")}function re(){if(!z)return;const C=new Blob([JSON.stringify({version:ug,file:i?.name,startX:x,result:z},null,2)],{type:"application/json"}),R=URL.createObjectURL(C),ie=document.createElement("a");ie.href=R,ie.download="crouch-start-result.json",ie.click(),setTimeout(()=>URL.revokeObjectURL(R),1e3)}return I.jsxs(I.Fragment,{children:[I.jsxs("p",{className:"sprint10-note",children:["試験機能・精度未検証。三脚で固定したカメラで真横から、構え（ブロック）から",Ma,"歩目までが映るように撮影してください。1秒120コマ以上（240推奨）・通常速度の時間軸の動画を使います。映っている歩だけ（最大",Ma,"歩）を解析します。"]}),I.jsxs("section",{className:"sprint10-card",children:[I.jsx("h2",{children:"1　動画を選ぶ"}),I.jsxs("label",{className:"sprint10-upload",children:[I.jsx("input",{className:"sprint10-file-input",type:"file","aria-label":"クラウチングスタートの動画を選ぶ",accept:"video/mp4,video/quicktime,.mov,.mp4,.m4v",disabled:c,onChange:C=>H(C.target.files?.[0]??null)}),I.jsxs("span",{className:"sprint10-upload-button","aria-hidden":"true",children:[I.jsx(gp,{size:19}),i?"別の動画を選ぶ":"動画を選ぶ"]})]}),i&&I.jsxs("p",{className:"sprint10-file",children:[i.name," · ",(i.size/1024/1024).toFixed(1)," MB"]})]}),I.jsxs("section",{className:"sprint10-card",children:[I.jsx("h2",{children:"2　スタートラインを合わせる"}),I.jsx("p",{children:"線を、走路のスタートラインに合わせます。選手はこの線の近くの人として選ばれます。"}),I.jsxs("div",{className:"sprint10-player",children:[I.jsx("video",{ref:e,src:s||void 0,playsInline:!0,preload:"auto",poster:m?.image,style:m?{aspectRatio:`${m.width} / ${m.height}`}:void 0,onLoadedMetadata:()=>d(!0),onLoadedData:()=>d(!0),onError:()=>{d(!1),S("この動画を再生できません。対応形式を確認してください。")}}),b&&I.jsx("div",{className:"sprint10-gates",children:I.jsx("button",{type:"button",role:"slider","aria-label":"スタートラインの線","aria-valuemin":1,"aria-valuemax":99,"aria-valuenow":Math.round(x*100),className:`sprint10-gate start${x<.1?" at-left":x>.9?" at-right":""}`,style:{left:`${x*100}%`},disabled:c,onPointerDown:C=>{C.currentTarget.setPointerCapture(C.pointerId),j(C)},onPointerMove:j,onPointerUp:C=>{C.currentTarget.hasPointerCapture(C.pointerId)&&C.currentTarget.releasePointerCapture(C.pointerId)},onKeyDown:C=>{(C.key==="ArrowLeft"||C.key==="ArrowRight")&&(C.preventDefault(),Y(x+(C.key==="ArrowLeft"?-_n:_n)))},children:I.jsx("span",{children:"START"})})})]}),s&&I.jsx(ls,{video:e,url:s,disabled:c}),I.jsx("div",{className:"sprint10-gate-controls",children:I.jsxs("div",{className:"sprint10-gate-row start",children:[I.jsx("span",{children:"スタートライン"}),I.jsx("button",{type:"button","aria-label":"スタートラインを左へ",disabled:!b||c,onClick:()=>Y(x-_n),children:"◀"}),I.jsx("input",{type:"range","aria-label":"スタートラインの位置",min:"1",max:"99",step:".1",value:x*100,disabled:!b||c,onChange:C=>Y(Number(C.target.value)/100)}),I.jsx("button",{type:"button","aria-label":"スタートラインを右へ",disabled:!b||c,onClick:()=>Y(x+_n),children:"▶"})]})})]}),I.jsxs("section",{className:"sprint10-card",children:[I.jsx("h2",{children:"3　解析する"}),I.jsx("button",{className:"sprint10-primary",disabled:!b||c,onClick:()=>{K()},children:"解析する"}),c&&I.jsx("button",{onClick:()=>{r.current?.abort(),r.current=null,h(!1),S("解析を中止しました。")},children:"中止"}),I.jsx("p",{role:"status",children:w||"動画を選び、スタートラインを合わせると解析できます。"}),c&&I.jsx("progress",{max:"1",value:f,"aria-label":"解析の進み具合"})]}),z&&I.jsxs("section",{ref:n,className:"sprint10-card sprint10-result","aria-label":"解析結果",children:[I.jsx("h2",{children:"解析結果"}),z.reason?I.jsx("p",{role:"alert",className:"sprint10-note",children:z.reason}):I.jsxs(I.Fragment,{children:[I.jsx("div",{className:"sprint10-metrics sprint10-summary",children:[["解析した歩数",`${z.contacts.length}`,"歩"],["ブロック→1歩目の接地",M1(z.firstFlight),"秒"]].map(([C,R,ie])=>I.jsxs("div",{children:[I.jsx("span",{children:C}),I.jsxs("strong",{children:[R,I.jsx("small",{children:ie})]})]},C))}),v&&!v.refiner&&I.jsx("p",{className:"sprint10-note",children:"高精度の骨格モデル（RTMPose）を読み込めなかったため、角度と骨格の表示はMediaPipeの骨格を使っています。"}),I.jsx("div",{ref:Z,className:"sprint10-tabs",role:"tablist","aria-label":"結果の表示",children:N1.map(([C,R])=>I.jsxs("button",{id:`crouch-tab-${C}`,type:"button",role:"tab","aria-selected":G===C,"aria-controls":`crouch-panel-${C}`,onClick:()=>J(C),children:[R,C==="advice"&&B>0&&I.jsx("span",{className:"sprint10-badge","aria-label":`確かめたい点 ${B}件`,children:B})]},C))}),I.jsxs("div",{ref:O,className:"sprint10-panels",children:[I.jsx("div",{id:"crouch-panel-advice",role:"tabpanel","aria-labelledby":"crouch-tab-advice",hidden:G!=="advice",children:k.length>0?I.jsxs(I.Fragment,{children:[I.jsx("ul",{className:"sprint10-advice","aria-label":"見方のポイント",children:k.map(C=>I.jsxs("li",{className:C.level,children:[I.jsx("span",{"aria-hidden":"true",children:C.level==="good"?"✓":"!"}),I.jsxs("div",{children:[I.jsx("strong",{children:C.topic}),C.text]})]},C.topic+C.text))}),I.jsx("p",{className:"sprint10-hint",children:"目安は短距離選手の研究で報告された一般的な値で、選手ごとの目標ではありません（出典は「数値の見方」）。"})]}):I.jsx("p",{children:"目安と比べられる値がありませんでした。"})}),I.jsxs("div",{id:"crouch-panel-pose",role:"tabpanel","aria-labelledby":"crouch-tab-pose",hidden:G!=="pose",children:[I.jsx("ul",{className:"sprint10-mark-legend","aria-label":"線の色",children:O1.map(([C,R])=>I.jsxs("li",{children:[I.jsx("i",{style:{background:C}}),R]},R))}),I.jsx("p",{className:"sprint10-hint",children:"点線は鉛直、弧が測った角度。画像を左右にスワイプして局面を切り替えます。"}),M.length?I.jsx(I1,{url:s,frames:v.frames,phases:M,onShow:L,guides:{set:`目安：前膝 ${Ot.frontKnee[0]}〜${Ot.frontKnee[1]}°・後膝 ${Ot.rearKnee[0]}〜${Ot.rearKnee[1]}°`}}):I.jsx("p",{children:"角度を測れる局面がありませんでした。"})]}),I.jsxs("div",{id:"crouch-panel-steps",role:"tabpanel","aria-labelledby":"crouch-tab-steps",hidden:G!=="steps",children:[I.jsx(k1,{result:z}),I.jsx("p",{className:"sprint10-hint",children:"—：映っていないため出せない値（滞空とピッチは次の接地まで、接地時間は離地まで必要）。"}),z.notes.map(C=>I.jsx("p",{className:"sprint10-note",children:C},C)),I.jsx("h3",{children:"歩ごとの変化"}),I.jsx("p",{className:"sprint10-hint",children:"加速では歩ごとに、接地時間は短く、滞空時間は長くなり、接地時の脛と体幹は起きていきます。点線はトップ選手1人の例です。"}),I.jsx(S1,{result:z})]}),I.jsxs("div",{id:"crouch-panel-replay",role:"tabpanel","aria-labelledby":"crouch-tab-replay",hidden:G!=="replay",className:"sprint10-replay",children:[I.jsx(A1,{url:s,video:t,frames:v.frames,phases:M,events:U}),I.jsx("p",{className:"sprint10-hint",children:"判定した瞬間の前後では、測った線と角度を表示します。1/8は実際の8分の1の速さです（1秒240コマの動画で毎秒30コマ）。"})]})]}),I.jsxs("details",{className:"sprint10-more",children:[I.jsx("summary",{children:"数値の見方"}),I.jsx("p",{children:"接地は、つま先が床の高さまで下りた時、離地はつま先が床から離れた時を、骨格の動きから判定しています。真横から1秒240コマで撮影した3人の検証動画では、映像で見た瞬間との差は最大でおよそ1/60秒でした。"}),I.jsx("p",{children:"ピッチは接地から次の接地までの時間の逆数です。角度は鉛直を0°とし、進行方向へ倒れる向きを正とします（脛は足首から膝、体幹は腰から肩）。膝は伸び切った状態が180°です。"}),I.jsx("p",{children:"骨格の推定が崩れたコマの角度は出しません。"}),I.jsxs("p",{children:["骨格：選手を見つけて追い、接地・離地を判定するのはMediaPipe、角度と画像・スロー再生の骨格はRTMPose（",v?.refiner==="webgpu"?"WebGPU":v?.refiner==="wasm"?"WebAssembly":"今回は未使用","）です。かがんだ構えではRTMPoseの方が膝・腰の位置が体に合い、接地・離地の時刻は映像との差がMediaPipeの方が小さかったためです（3人の検証動画）。"]}),I.jsx("p",{children:"目安の出典：構えの膝はCavedonら（2019、地方〜全国レベルの短距離選手42人：前膝90〜92°、後膝112〜117°）とBezodisら（2019、総説：前膝91〜99°、後膝117〜136°）。ブロックを離れてから1歩目の接地までは0.045±0.025秒（Bezodisら 2019）。1歩目の接地はトップ選手の例0.177秒（Čoh・Tomazin 2006、100m 10.15秒の選手）、ダイヤモンドリーグの選手の平均0.210秒（男子）・0.225秒（女子）（Bezodisら 2019）。グラフの点線はČoh・Tomazin（2006）の1〜4歩目。歩ごとに脛と体幹が起きていくことはDonaldsonら（2022）。"}),I.jsx("p",{children:"この解析の時間はコマ単位（1/240秒）で判定しているため、0.01〜0.02秒の差は誤差の範囲です。ブロックを離れる瞬間は平均で約0.01秒早めに判定するため、1歩目の接地までの時間は少し長めに出ます。"})]})]}),I.jsx("button",{onClick:re,children:"結果を保存（JSON）"})]})]})}const B1={standing:{start:"スタート",finish:"ゴール"},flying:{start:"入口",finish:"出口"}},fp=[{id:"standing",label:"スタート10m",hint:"スタートラインから10m。選手は走り出す前から映っている。"},{id:"flying",label:"最高速度区間",hint:"例：50〜60m。選手は走った状態で画面に入ってくる。"},{id:"crouch",label:"クラウチングスタート",hint:"ブロックから5歩目まで。各歩の接地・滞空・ピッチと姿勢。"}],D1=e=>e.split(new RegExp("(?<=クラウチング)")).flatMap((t,r)=>r?[I.jsx("wbr",{},r),t]:[t]),mp={standing:[.12,.88],flying:[.2,.8]},wn=.002;function W1(){const e=ee.useRef(null),t=ee.useRef(null),r=ee.useRef(null),n=ee.useRef(!1),[i,a]=ee.useState(null),[s,o]=ee.useState(""),[l,d]=ee.useState(.12),[c,h]=ee.useState(.88),[f,g]=ee.useState("standing"),[m,b]=ee.useState(!1),[x,$]=ee.useState(50),[w,S]=ee.useState(10),v=f==="flying"?w:10,E=f==="flying"?`${x}〜${x+w}m区間`:"10m",z=B1[f],[M,k]=ee.useState(!1),[B,U]=ee.useState(!1),[G,V]=ee.useState(!1),[Z,O]=ee.useState(0),[P,H]=ee.useState(""),[Y,j]=ee.useState(null),[K,J]=ee.useState(""),[L,re]=ee.useState("file"),C=sg(L==="file"?s:""),R=B||L==="file"&&!!C,ie=ee.useRef(null),[Se,ve]=ee.useState(!1),[Ae,ge]=ee.useState([]),[he,Me]=ee.useState(null),Te=ee.useMemo(()=>Y&&M&&v>0?wp(Y,l,c,v,f):null,[Y,l,c,M,v,f]);ee.useEffect(()=>()=>{s&&URL.revokeObjectURL(s)},[s]),ee.useEffect(()=>()=>{t.current?.abort(),t.current=null,xe()},[]),ee.useEffect(()=>{Te&&n.current&&(n.current=!1,r.current?.scrollIntoView({behavior:"smooth",block:"start"}))},[Te]);function We(){t.current?.abort(),t.current=null,V(!1),Me(null),H(L==="camera"?"計測を止めました。":"解析を中止しました。")}function xe(){ie.current?.getTracks().forEach(F=>F.stop()),ie.current=null,e.current&&(e.current.srcObject=null),ve(!1)}function mr(F){G||F===L||(F==="file"?xe():et(null),re(F),U(!1),k(!1),j(null),ge([]),Me(null),H(""))}async function jr(){if(!(!e.current||Se))try{if(!navigator.mediaDevices?.getUserMedia)throw new Error("カメラを利用できません。HTTPS接続を確認してください。");const F=await navigator.mediaDevices.getUserMedia(Ty(navigator.mediaDevices.getSupportedConstraints()));ie.current=F,e.current.srcObject=F,await e.current.play(),ve(!0),H("")}catch(F){xe(),H(F instanceof Error?F.message:"カメラを起動できませんでした。")}}async function gr(){if(!e.current||!Se||!M||G)return;const F=new AbortController;t.current=F,V(!0),H("準備しています。");try{await e1(e.current,{startX:l,finishX:c,start:f,distanceM:v},F.signal,se=>ge(je=>[...je,se]),se=>{t.current===F&&Me(se)})}catch(se){t.current===F&&!F.signal.aborted&&H(se instanceof Error?se.message:String(se))}finally{t.current===F&&(t.current=null,V(!1),Me(null))}}function et(F){We(),a(F),o(F?URL.createObjectURL(F):""),U(!1),j(null),k(!1),H(""),O(0),J("")}function Dt(F){if(!G){if(F==="crouch"){m||(We(),xe(),b(!0));return}b(!1),F!==f&&(g(F),d(mp[F][0]),h(mp[F][1]),k(!1),j(null),J(""))}}function St(F,se){if(G)return;const je=Math.max(.01,Math.min(.99,se));F==="start"?d(je):h(je),k(!1),j(null),J("")}function ct(F,se){if(G||!se.currentTarget.hasPointerCapture(se.pointerId))return;const je=se.currentTarget.parentElement.getBoundingClientRect();St(F,(se.clientX-je.left)/je.width)}async function qr(){if(!i||!M||G)return;const F=new AbortController;t.current=F,e.current?.pause(),V(!0),j(null),O(0),J(""),H("解析を準備しています。");try{const se=await ag(i,l,F.signal,(je,Tt)=>{t.current===F&&(O(je),H(Tt))},c,f,v);t.current===F&&!F.signal.aborted&&(n.current=!0,j(se))}catch(se){t.current===F&&!F.signal.aborted&&H(se instanceof Error?se.message:String(se))}finally{t.current===F&&(t.current=null,V(!1))}}function Pt(F,se){e.current&&(e.current.pause(),e.current.currentTime=F,J(`${se} · ${F.toFixed(3)}秒`),e.current.scrollIntoView({behavior:"smooth",block:"center"}))}function Wr(){const F=new Blob([JSON.stringify({version:Cy,file:i?.name,distanceM:v,mode:f,section:f==="flying"?{startM:x,lengthM:w}:null,gates:{start:l,finish:c},timeBasis:"SOURCE_PRESENTATION_TIME",crossingBasis:"PELVIS_MIDPOINT",stepBasis:"LEG_OVERLAP_CYCLES_BETWEEN_GATES_WITH_FRACTIONAL_EDGES",strideBasis:"PELVIS_DISPLACEMENT_BETWEEN_OVERLAPS",calibration:"TWO_GATE_LINEAR_SCALE_NOT_PERSPECTIVE_CORRECTED",result:Te,samples:Y},null,2)],{type:"application/json"}),se=document.createElement("a"),je=URL.createObjectURL(F);se.href=je,se.download=f==="flying"?`sprint-section-${x}-${x+w}m-result.json`:"sprint10-result.json",se.click(),setTimeout(()=>URL.revokeObjectURL(je),1e3)}const kt=(F,se=2)=>F==null?"—":F.toFixed(se),Ue=F=>F==="start"?l:c,Dn=Te?Te.warnings.filter(F=>!ha.includes(F)):[];return I.jsxs("main",{className:"sprint10",children:[I.jsx("a",{className:"sprint10-back",href:"/SACHIZU-LAB1/",children:"← 種目を選ぶ"}),I.jsxs("header",{children:[I.jsxs("p",{className:"sprint10-eyebrow",children:["SPRINT / ",m?"CROUCH START":f==="flying"?"MAX VELOCITY SECTION":"10 METRES"]}),I.jsx("h1",{children:m?"クラウチングスタートの解析":f==="flying"?"最高速度区間の解析":"10m スプリント解析"}),I.jsx("p",{children:m?"ブロックから最大5歩目まで、各歩の接地・滞空・ピッチと姿勢の角度を解析します。":"2本のラインを設定するだけで、通過時間・歩数・ピッチ・歩幅を解析します。"})]}),I.jsx("div",{className:"sprint10-modes",role:"group","aria-label":"解析の種類",children:fp.map(F=>{const se=F.id==="crouch"?m:!m&&f===F.id;return I.jsxs("button",{type:"button","aria-pressed":se,disabled:G,className:se?"is-selected":"",onClick:()=>Dt(F.id),children:[I.jsx("strong",{children:D1(F.label)}),I.jsx("span",{children:F.hint})]},F.id)})}),I.jsx("p",{className:"sprint10-mode-hint",children:fp.find(F=>F.id===(m?"crouch":f))?.hint}),m?I.jsx(R1,{}):I.jsxs(I.Fragment,{children:[f==="flying"&&I.jsxs("div",{className:"sprint10-section",children:[I.jsxs("label",{children:["区間の入口",I.jsx("input",{type:"number",inputMode:"numeric",min:0,max:400,step:5,value:x,disabled:G,onChange:F=>$(Math.max(0,Math.min(400,Math.round(Number(F.target.value)||0))))}),I.jsx("span",{children:"m地点"})]}),I.jsxs("label",{children:["区間の長さ",I.jsx("input",{type:"number",inputMode:"decimal",min:1,max:100,step:1,value:w,disabled:G,onChange:F=>{S(Math.max(0,Math.min(100,Number(F.target.value)||0))),k(!1),J("")}}),I.jsx("span",{children:"m"})]}),I.jsxs("p",{children:[E,"として記録します。長さは2本のラインの実際の間隔です。"]})]}),I.jsxs("p",{className:"sprint10-note",children:["試験機能・精度未検証。固定カメラで真横に近い方向から、1人の全身と",f==="flying"?"区間全体":"10m区間","を撮影してください。通常速度の時間軸の動画を使用します。スロー書き出し動画の速度倍率は自動補正しません。"]}),I.jsxs("section",{className:"sprint10-card",children:[I.jsx("h2",{children:L==="camera"?"1　カメラを用意する":"1　動画を選ぶ"}),I.jsx("div",{className:"sprint10-sources",role:"group","aria-label":"映像の入力",children:[["file","録画した動画"],["camera","カメラでリアルタイム計測"]].map(([F,se])=>I.jsx("button",{type:"button","aria-pressed":L===F,className:L===F?"is-selected":"",disabled:G,onClick:()=>mr(F),children:se},F))}),L==="camera"?I.jsxs(I.Fragment,{children:[I.jsx("p",{className:"sprint10-hint",children:"スマホを三脚などで固定し、走路を真横から写します。リアルタイムでは通過時間と平均速度だけを測ります。歩数・歩幅は、録画した動画の解析で測ります。選手は1人ずつ走らせてください。ほかの人と重なると測れないことがあります。"}),I.jsx("button",{className:"sprint10-primary",disabled:G||Se,onClick:()=>{jr()},children:Se?"✓ カメラ起動中":"カメラを起動"})]}):I.jsxs(I.Fragment,{children:[I.jsxs("label",{className:"sprint10-upload",children:[I.jsx("input",{className:"sprint10-file-input",type:"file","aria-label":`${E}の動画を選ぶ`,accept:"video/mp4,video/quicktime,.mov,.mp4,.m4v",disabled:G,onChange:F=>et(F.target.files?.[0]??null)}),I.jsxs("span",{className:"sprint10-upload-button","aria-hidden":"true",children:[I.jsx(gp,{size:19}),i?"別の動画を選ぶ":"動画を選ぶ"]})]}),i&&I.jsxs("p",{className:"sprint10-file",children:[i.name," · ",(i.size/1024/1024).toFixed(1)," MB"]})]})]}),I.jsxs("section",{className:"sprint10-card",children:[I.jsx("h2",{children:`2　${z.start}と${z.finish}を合わせる`}),I.jsxs("p",{children:[L==="camera"?"カメラの映像に、選手が走るコースと2本の目印が写っていることを確認します。":f==="flying"?"再生して、選手が入口と出口の線を越えて走る様子が映っていることを確認します。最初は選手が画面に入っていなくて構いません。":"再生して、骨盤がスタートを越える前からゴールを越えた後まで映っていることを確認します。","次に、2本の線を走路上の白線・コーンに合わせてください。目印は選手が走るコース上（同じ奥行き）に置きます。画面の端ほど奥行きの差でタイムがずれます。",f==="flying"?"線は画面の端の近くでも構いません。線を越える瞬間に体が画面の端にかかっている場合は、その前後の動きから通過時刻を推定し、結果にその旨を表示します。":"スタートの線は、選手の立ち位置より少し後ろに置いてください。"]}),I.jsxs("div",{className:"sprint10-player",children:[I.jsx("video",{ref:e,src:L==="file"&&s||void 0,muted:L==="camera",playsInline:!0,preload:"auto",poster:L==="file"?C?.image:void 0,style:L==="file"&&C?{aspectRatio:`${C.width} / ${C.height}`}:void 0,onLoadedMetadata:()=>{L==="file"&&U(!0)},onLoadedData:()=>U(!0),onError:()=>{L==="file"&&(U(!1),H("この動画を再生できません。対応形式を確認してください。"))}}),R&&I.jsx("div",{className:"sprint10-gates",children:["start","finish"].map(F=>I.jsx("button",{type:"button",role:"slider","aria-label":`${z[F]}ライン`,"aria-valuemin":1,"aria-valuemax":99,"aria-valuenow":Math.round(Ue(F)*100),className:`sprint10-gate ${F}${Ue(F)<.1?" at-left":Ue(F)>.9?" at-right":""}`,style:{left:`${Ue(F)*100}%`},disabled:G,onPointerDown:se=>{se.currentTarget.setPointerCapture(se.pointerId),ct(F,se)},onPointerMove:se=>ct(F,se),onPointerUp:se=>{se.currentTarget.hasPointerCapture(se.pointerId)&&se.currentTarget.releasePointerCapture(se.pointerId)},onKeyDown:se=>{(se.key==="ArrowLeft"||se.key==="ArrowRight")&&(se.preventDefault(),St(F,Ue(F)+(se.key==="ArrowLeft"?-wn:wn)))},children:I.jsx("span",{children:f==="flying"?z[F]:F==="start"?"START":"FINISH"})},F))})]}),L==="file"&&s&&I.jsx(ls,{video:e,url:s,disabled:G}),K&&I.jsxs("p",{"aria-live":"polite",children:["確認中：",K]}),I.jsx("p",{className:"sprint10-hint",children:"線をドラッグして大まかに合わせ、◀ ▶ で少しずつ動かします。"}),I.jsx("div",{className:"sprint10-gate-controls",children:["start","finish"].map(F=>I.jsxs("div",{className:`sprint10-gate-row ${F}`,children:[I.jsx("span",{children:z[F]}),I.jsx("button",{type:"button","aria-label":`${z[F]}を左へ`,disabled:!R||G,onClick:()=>St(F,Ue(F)-wn),children:"◀"}),I.jsx("input",{type:"range","aria-label":`${z[F]}位置`,min:"1",max:"99",step:".1",value:Ue(F)*100,disabled:!R||G,onChange:se=>St(F,Number(se.target.value)/100)}),I.jsx("button",{type:"button","aria-label":`${z[F]}を右へ`,disabled:!R||G,onClick:()=>St(F,Ue(F)+wn),children:"▶"})]},F))}),I.jsx("button",{className:"sprint10-confirm",disabled:!R||G||Math.abs(l-c)<.1||v<=0,onClick:()=>k(!0),children:M?"✓ ライン設定済み":"この2本のラインで決定"})]}),L==="camera"?I.jsxs("section",{className:"sprint10-card",children:[I.jsx("h2",{children:"3　計測する"}),G?I.jsx("button",{className:"sprint10-primary",onClick:We,children:"計測を止める"}):I.jsx("button",{className:"sprint10-primary",disabled:!R||!Se||!M,onClick:()=>{gr()},children:"計測を開始"}),I.jsx("p",{role:"status",children:he?`${he.message}${he.fps?`（処理 ${he.fps.toFixed(0)}コマ/秒）`:""}`:P||"カメラを起動し、2本のラインを決定すると計測できます。選手が走るたびに自動で測ります。"}),he?.fps!=null&&he.fps<20&&I.jsx("p",{className:"sprint10-note",children:"処理が映像に追いついていません。タイムの誤差が大きくなります。"}),Ae.length>0&&I.jsx("ol",{className:"sprint10-runs","aria-label":"計測結果",children:[...Ae].reverse().map(F=>I.jsxs("li",{children:[I.jsxs("span",{children:[F.id,"本目"]}),F.duration!==null&&F.speed!==null?I.jsxs(I.Fragment,{children:[I.jsxs("strong",{children:[F.duration.toFixed(3),I.jsx("small",{children:"秒"})]}),I.jsxs("span",{children:[F.speed.toFixed(2)," m/s"]})]}):I.jsxs(I.Fragment,{children:[I.jsx("strong",{className:"sprint10-run-failed",children:"計測できませんでした"}),I.jsx("span",{})]}),[...F.failure?[F.failure]:[],...F.notes].map(se=>I.jsx("small",{className:"sprint10-run-note",children:se},se))]},F.id))})]}):I.jsxs("section",{className:"sprint10-card",children:[I.jsx("h2",{children:"3　解析する"}),I.jsx("button",{className:"sprint10-primary",disabled:!R||!M||G,onClick:()=>{qr()},children:"解析する"}),G&&I.jsx("button",{onClick:We,children:"中止"}),I.jsx("p",{role:"status",children:P||"動画を選び、2本のラインを決定すると解析できます。"}),G&&I.jsx("progress",{max:"1",value:Z,"aria-label":"解析の進み具合"})]}),Te&&I.jsxs("section",{ref:r,className:"sprint10-card sprint10-result","aria-label":"解析結果",children:[I.jsx("h2",{children:"解析結果"}),Te.reason&&I.jsx("p",{role:"alert",className:"sprint10-note",children:Te.reason}),I.jsx("div",{className:"sprint10-metrics",children:[[`${E}通過時間`,kt(Te.duration,3),"秒"],["平均速度",kt(Te.speed),"m/s"],["推定歩数",kt(Te.count,1),"歩"],["推定ピッチ",kt(Te.cadence),"歩/秒"],["平均歩幅",kt(Te.stride),"m"]].map(([F,se,je])=>I.jsxs("div",{children:[I.jsx("span",{children:F}),I.jsx("strong",{children:se}),I.jsx("small",{children:je})]},F))}),Dn.map(F=>I.jsx("p",{className:"sprint10-note",children:F},F)),I.jsxs("details",{className:"sprint10-more",children:[I.jsx("summary",{children:"数値の見方"}),I.jsx("p",{children:"タイムは骨盤中心のライン通過間隔です。合図からのスタートタイム・全身の重心の測定ではありません。"}),ha.map(F=>I.jsx("p",{children:F},F))]}),I.jsxs("details",{className:"sprint10-more",children:[I.jsx("summary",{children:"1歩ごとの詳細を見る"}),I.jsx(t1,{intervals:Te.strideIntervals,seek:Pt})]}),I.jsxs("details",{className:"sprint10-more",children:[I.jsx("summary",{children:"検出位置を動画で確認"}),I.jsxs("div",{className:"sprint10-events",children:[Te.start&&I.jsxs("button",{onClick:()=>Pt(Te.start.pts,z.start),children:[z.start," ",Te.start.pts.toFixed(3),"秒"]}),Te.steps.map((F,se)=>I.jsxs("button",{onClick:()=>Pt(F.pts,`${se+1}回目の入れ替わり`),children:[se+1,"回目の入れ替わり · ",F.pts.toFixed(3),"秒"]},F.frame)),Te.finish&&I.jsxs("button",{onClick:()=>Pt(Te.finish.pts,z.finish),children:[z.finish," ",Te.finish.pts.toFixed(3),"秒"]})]}),I.jsx("p",{children:"ボタンでその時刻へ移動します。遊脚が支持脚を追い越す瞬間で、接地のコマではありません。"})]}),I.jsx("button",{onClick:Wr,children:"結果と判定データを保存（JSON）"})]})]}),I.jsx("footer",{children:"解析v10 · 動画はこの端末内で処理します。全フレームの解析時間は端末性能により変わります。2本のラインだけで遠近やカメラの揺れを補正することはできません。"})]})}export{W1 as default};
