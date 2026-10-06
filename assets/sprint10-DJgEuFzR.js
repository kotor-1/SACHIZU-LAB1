import{r as Ee,j as ce}from"./index-CdDTncTB.js";import{P as Ho,n as jo}from"./pose-drawing-PA8s3aJj.js";import{S as xr,d as gi,t as tc}from"./video-orientation-DNKyXU7h.js";import{d as py,u as it,M as Jn}from"./session-lifecycle-BElB6Yl1.js";const Tw="sprint10-experimental-v10",cy=["歩数は、2本のラインの間に経過した脚の入れ替わり（遊脚が支持脚を追い越す動き）の周期の数です。ライン上の半端な1歩は周期の割合で数えます。接地回数を1つずつ数えた値ではありません。","各歩の距離は骨盤の画面内移動をライン間隔（既知の距離）で比例換算した推定です。真の全身重心・接地位置間の距離ではなく、遠近やカメラの揺れも補正していません。"],ai=e=>{const t=[...e].sort((r,i)=>r-i);return t.length?t[Math.floor(t.length/2)]:0};function hy(e){const t=i=>{const n=[...i].sort((s,o)=>s-o),a=Math.floor(n.length/2);return n.length?n.length%2?n[a]:(n[a-1]+n[a])/2:0},r=t(e);return t(e.filter(i=>i<=ea[1]*r+$a))}const Lr=e=>!!e&&Number.isFinite(e.x)&&Number.isFinite(e.y)&&e.x>0&&e.x<1&&e.y>0&&e.y<1&&(e.visibility??0)>=.3,$a=1e-9,Ae=(e,t)=>e-t>$a;function yi(e){const t=[];for(let r=1;r<e.length;r++)e[r].hipX!==null&&e[r-1].hipX!==null&&t.push(e[r].pts-e[r-1].pts);return Math.max(.05,2.5*(t.length?ai(t):0))}const Iw=.2;function rc(e,t=yi(e),r=0){const i=new Map;for(let n=1;n<e.length;n++)i.set(e[n],e[n-1]);return(n,a)=>!Ae(a.pts-n.pts,t)||i.get(a)===n&&!Ae(a.pts-n.pts,r)}const Ut=(e,t)=>t-e>$a,si=.65,fy=.025,ea=[.7,1.5];function Hi(e,t,r,i){const n=[23,24].every(o=>Lr(e[o])),a=[23,24,25,26,27,28].every(o=>Lr(e[o])),s=(o,l)=>Math.hypot((e[o].x-e[l].x)*i,e[o].y-e[l].y);return{frame:t,pts:r,hipX:n?(e[23].x+e[24].x)/2:null,ankleGap:[27,28].every(o=>Lr(e[o]))?Math.abs(e[27].x-e[28].x)*i:null,kneeGap:[25,26].every(o=>Lr(e[o]))?Math.abs(e[25].x-e[26].x)*i:null,legLength:a?(s(23,25)+s(25,27)+s(24,26)+s(26,28))/2:null}}function my(e,t,r,i=rc(e)){const n=[],a=e.filter(s=>s.hipX!==null);for(let s=1;s<a.length;s++){const o=a[s-1],l=a[s],d=(o.hipX-t)*r,p=(l.hipX-t)*r;if(d>0||p<=0||!i(o,l))continue;const c=a.some(m=>m.pts<=o.pts&&!Ae(o.pts-m.pts,.15)&&(m.hipX-t)*r<-.003),f=a.some(m=>m.pts>=l.pts&&!Ae(m.pts-l.pts,.15)&&(m.hipX-t)*r>.003);if(!c||!f)continue;const g=o.pts+-d/(p-d)*(l.pts-o.pts);(!n.length||Ae(g-n.at(-1).pts,.15))&&n.push({pts:g,before:o.pts,after:l.pts,frame:l.frame})}return n}function gy(e,t,r=yi(e)){const i=t?e.filter(x=>!Ut(x.pts,t.startPts)&&!Ae(x.pts,t.finishPts)):e,n=ai(i.flatMap(x=>x.legLength!==null&&x.legLength>.01?[x.legLength]:[]));if(!n)return{events:[],gaps:[]};const s=(t?e.filter(x=>!Ut(x.pts,t.startPts-si)&&!Ae(x.pts,t.finishPts+si)):e).filter(x=>x.ankleGap!==null&&x.kneeGap!==null),o=x=>x.map(I=>({...I,value:ai(x.filter(C=>!Ae(Math.abs(C.pts-I.pts),fy)).map(C=>C.ankleGap/n))})),l=o(s),p=(t?o(i.filter(x=>x.ankleGap!==null&&x.kneeGap!==null)):l).map(x=>x.value).sort((x,I)=>x-I),c=p[Math.floor(p.length*.9)]??0;if(c<.2)return{events:[],gaps:[]};const f=c*.55,g=c*.3,m=[],_=[];let v=!1,$=null,w=null,S=[];for(const x of l){const I=w;if(w&&Ae(x.pts-w.pts,r)&&(_.push([w.pts,x.pts]),v=!1,$=null,S=[]),w=x,!v){x.value>=(f+g)/2&&(v=!0);continue}if(x.value<=g&&(!$||x.value<$.value)?($=x,S=[x]):$&&x.value===$.value&&S.at(-1)===I&&S.push(x),$&&x.value>=f){const z=s.filter(B=>!Ae(Math.abs(B.pts-$.pts),.06)).some(B=>B.kneeGap/n<.4),k=S[S.length-1>>1]??$;z&&(!m.length||!Ut(k.pts-m.at(-1).pts,.12))&&m.push({pts:k.pts,frame:k.frame}),$=null,S=[]}}return{events:m,gaps:_}}function yy(e,t,r,i,n,a,s=10,o=yi(e)){const l=[];for(let d=1;d<t.length;d++){const p=t[d-1],c=t[d],f=e.find(S=>S.frame===p.frame&&S.pts===p.pts),g=e.find(S=>S.frame===c.frame&&S.pts===c.pts),_=e.filter(S=>S.pts>=p.pts&&S.pts<=c.pts).filter(S=>S.hipX!==null&&Number.isFinite(S.hipX)&&S.ankleGap!==null&&S.kneeGap!==null).map(S=>S.pts),v=c.pts-p.pts;let $=null;Ut(p.pts,n)||Ae(c.pts,a)?$="区間外を含むため未算出":Ut(v,.12)||Ae(v,si)?$="入れ替わり周期を確認できません":f?.hipX==null||g?.hipX==null||!Number.isFinite(f.hipX)||!Number.isFinite(g.hipX)?$="端点の骨盤位置がありません":(!_.length||Ae(_[0]-p.pts,o)||Ae(c.pts-_.at(-1),o)||_.some((S,x)=>x>0&&Ae(S-_[x-1],o)))&&($="この区間の追跡が途切れています");const w=f?.hipX!=null&&g?.hipX!=null?s*(g.hipX-f.hipX)/(i-r):NaN;!$&&(!Number.isFinite(w)||w<=0||w>10)&&($="進行方向の移動距離を確認できません"),l.push({fromStep:d,toStep:d+1,fromPts:p.pts,toPts:c.pts,fromHipX:f?.hipX??null,toHipX:g?.hipX??null,distanceM:$?null:w,reason:$})}return l}const _y={standing:{noFinish:"ゴール通過を確認できません。ゴールラインの位置と、ゴールを越えた後まで選手が映っているかを確認してください。",startGap:"スタートラインを越える瞬間の追跡が途切れています。スタート付近が隠れない位置から撮影してください。",noStart:"スタートラインより後ろにいる選手を確認できません。ラインを選手の立ち位置より少し後ろに置くか、走り出す前から映った動画を使ってください。"},flying:{noFinish:"出口の線の通過を確認できません。選手が出口の線を越えるまで動画が続いているか、出口の付近で選手が他の人と重なっていないか確認してください。",startGap:"入口の線を越える瞬間の追跡が途切れています。入口の付近で選手が他の人や物に隠れていないか確認してください。",noStart:"入口の線を越える選手を捉えられませんでした。入口の付近で選手が他の人と重なっている場合や、線を越えた後0.1秒以上、体が画面の外にかかっている場合は測れません。"}},by=.25,wy=.1,ic=.2,$y=.08,vy=.006;function nc(e){let t=e;for(let r=0;r<3;r++){if(t.length<3)return null;const i=t.reduce((p,c)=>p+c.pts,0)/t.length,n=t.reduce((p,c)=>p+c.hipX,0)/t.length,a=t.reduce((p,c)=>p+(c.pts-i)**2,0);if(!(a>0))return null;const s=t.reduce((p,c)=>p+(c.pts-i)*(c.hipX-n),0)/a,o=t.map(p=>Math.abs(p.hipX-(n+s*(p.pts-i)))),l=1.4826*ai(o),d=t.filter((p,c)=>o[c]<=Math.max(vy,3*l));if(d.length===t.length||d.length<3||r===2)return{mt:i,mx:n,speed:s,used:t};t=d}return null}function Ko(e,t,r,i){let n=i.pts;for(let a=0;a<3;a++){const s=nc(e.filter(d=>!Ae(Math.abs(d.pts-n),$y)));if(!s||!(s.speed*r>=ic)||s.used.length<5)return i;const o=s.mt+(t-s.mx)/s.speed;if(o<s.used[0].pts||o>s.used.at(-1).pts)return i;const l=Math.abs(o-n)<.001;if(n=o,l)break}return{...i,pts:n}}function Xo(e,t,r,i,n,a){const s=i==="entry"?e:[...e].reverse(),o=[s[0]];for(const g of s.slice(1)){const[m,_]=i==="entry"?[o.at(-1),g]:[g,o.at(-1)];if(!a(m,_)||Ae(Math.abs(g.pts-o[0].pts),by))break;o.push(g)}if(o.length<3||Ut(Math.abs(o.at(-1).pts-o[0].pts),.05))return null;const l=nc(o);if(!l||!(l.speed*r>=ic))return null;const d=i==="entry"?l.used.reduce((g,m)=>m.pts<g.pts?m:g):l.used.reduce((g,m)=>m.pts>g.pts?m:g),p=l.mt+(t-l.mx)/l.speed,c=Math.abs(d.pts-p);return!((d.hipX-t)*r*(i==="entry"?1:-1)>0)||Ae(c,wy)||p<n[0]||p>n[1]?null:i==="entry"?{pts:p,before:p,after:d.pts,frame:d.frame,extendedSeconds:c}:{pts:p,before:d.pts,after:p,frame:d.frame,extendedSeconds:c}}const xy=.6;function Sy(e,t,r,i){const n=e.events.filter($=>!Ut($.pts,r-1)&&!Ae($.pts,i+1)),a=$=>$.slice(1).map((w,S)=>w.pts-$[S].pts),s=hy(t.length>=3?a(t):a(n));if(!(s>0))return null;const o=[...t];let l=0;for(;;){const $=o.slice(1).map((I,C)=>I.pts-o[C].pts),w=$.reduce((I,C,z)=>C<$[I]?z:I,0);if(!$.length||$[w]>=xy*s)break;const S=w>0?$[w-1]:1/0,x=w+1<$.length?$[w+1]:1/0;o.splice(Math.abs(S+$[w]-s)<Math.abs(x+$[w]-s)?w:w+1,1),l++}const d=o.slice(1).map(($,w)=>($.pts-o[w].pts)/s),p=d.map($=>$<=ea[1]+1e-9?1:Math.max(2,Math.round($))),c=d.some(($,w)=>p[w]>=2&&Math.abs($-p[w])>.35);if(!o.length)return{count:(i-r)/s,steps:o,multiples:p,edges:null,estimatedEdges:[!1,!1],ambiguous:c,removed:l,cycle:s};const f=e.events.filter($=>$.pts<=r).at(-1),g=e.events.find($=>$.pts>=i),m=($,w)=>{const S=$?Math.abs(w.pts-$.pts):NaN;return $&&!Ae(S,si)&&S/s<=ea[1]&&!e.gaps.some(([I,C])=>I<Math.max(w.pts,$.pts)&&C>Math.min(w.pts,$.pts))?S:s},_=(o[0].pts-r)/m(f,o[0]),v=(i-o.at(-1).pts)/m(g,o.at(-1));return{count:p.reduce(($,w)=>$+w,0)+_+v,steps:o,multiples:p,edges:[_,v],estimatedEdges:[_>1+1e-9,v>1+1e-9],ambiguous:c,removed:l,cycle:s}}const ky=.02;function Ty(e){const t=e.filter(i=>i.hipX!==null),r=new Set;for(const i of t){const n=t.filter(d=>d!==i&&!Ae(Math.abs(d.pts-i.pts),.1));if(n.length<4)continue;const a=n.reduce((d,p)=>d+p.pts,0)/n.length,s=n.reduce((d,p)=>d+p.hipX,0)/n.length,o=n.reduce((d,p)=>d+(p.pts-a)**2,0),l=o>0?n.reduce((d,p)=>d+(p.pts-a)*(p.hipX-s),0)/o:0;Math.abs(i.hipX-(s+l*(i.pts-a)))>ky&&r.add(i)}return r.size?e.map(i=>r.has(i)?{...i,hipX:null}:i):e}function Ew(e,t,r,i=10,n="standing",a=0){const s=_y[n],o={start:null,finish:null,duration:null,steps:[],count:null,speed:null,cadence:null,stride:null,edgeFractions:null,strideIntervals:[],warnings:[],reason:null};if(![t,r].every(P=>Number.isFinite(P)&&P>0&&P<1)||Math.abs(r-t)<.1)return{...o,reason:"スタートとゴールを離して設定してください。"};if(!e.length||e.some((P,V)=>!Number.isFinite(P.pts)||V>0&&P.pts<=e[V-1].pts))return{...o,reason:"動画の時刻を確認できません。"};const l=Math.sign(r-t),d=n==="flying"?Ty(e):e,p=d.filter(P=>P.hipX!==null),c=[e[0].pts,e.at(-1).pts],f=yi(d),g=rc(d,f,a),m=my(d,r,l,g);if(!m.length&&n==="flying"){let P=p.length-1;for(;P>=0&&(p[P].hipX-r)*l>0;)P--;const V=P<0?null:Xo(p.slice(0,P+1),r,l,"exit",c,g);V&&m.push(V)}if(!m.length)return{...o,reason:s.noFinish};let _=null,v=null,$=!1;for(const P of m){const V=p.filter(be=>be.pts<P.pts);let Z=V.length-1;for(;Z>=0&&(V[Z].hipX-t)*l>0;)Z--;if(Z===V.length-1)continue;const q=V[Z],ee=V[Z+1];if(Z<0||!g(q,ee)){const be=n==="flying"?Xo(V.slice(Z+1),t,l,"entry",c,g):null;if(be){_=be,v=P;break}Z>=0&&($=!0);continue}const Q=(q.hipX-t)*l,X=(ee.hipX-t)*l;_={pts:q.pts+-Q/(X-Q)*(ee.pts-q.pts),before:q.pts,after:ee.pts,frame:ee.frame},v=P;break}if(n==="flying"&&_&&v&&(_.extendedSeconds||(_=Ko(p,t,l,_)),v.extendedSeconds||(v=Ko(p,r,l,v))),!_||!v)return{...o,reason:$?s.startGap:s.noStart};const w=v.pts-_.pts,S=m.filter(P=>P.pts>v.pts+1),x=gy(e,{startPts:_.pts,finishPts:v.pts},f),I=_.extendedSeconds?_.after:_.pts,C=v.extendedSeconds?v.before:v.pts,z=e.filter(P=>P.pts>=I&&P.pts<=C),k=z.filter(P=>P.ankleGap!==null&&P.kneeGap!==null).length/Math.max(1,z.length),B=[I,...z.filter(P=>P.ankleGap!==null&&P.kneeGap!==null).map(P=>P.pts),C],L=k<.9||x.gaps.some(([P,V])=>P<C&&V>I)||B.some((P,V)=>V>0&&Ae(P-B[V-1],f)),j=x.events.filter(P=>P.pts>_.pts&&P.pts<v.pts),M=Sy(x,j,_.pts,v.pts),W=M?.count??null,O=[...cy];if(!M)O.unshift("脚の入れ替わりを2回以上捉えられなかったため、歩数・ピッチ・歩幅を出せません。");else{const P=[];M.removed&&P.push(`入れ替わりの誤検出と思われるもの（${M.removed}回）を除いて数えました。`),M.steps.length||P.push(`区間内の入れ替わりを捉えられなかったため、歩数は周期（${M.cycle.toFixed(3)}秒）から推定しました。`);const V=M.multiples.reduce((Z,q)=>Z+q-1,0);V===1?P.push("脚の入れ替わりを1回見逃した区間があり、周期の長さから2歩分として数えました。"):V>1&&P.push(`脚の入れ替わりを${V}回見逃した区間があり、周期の長さから数えました。`),M.estimatedEdges[0]&&P.push(`入口の直後の入れ替わりが映っていないため、その部分は周期（${M.cycle.toFixed(3)}秒）から推定しました。`),M.estimatedEdges[1]&&P.push(`出口の直前の入れ替わりが映っていないため、その部分は周期（${M.cycle.toFixed(3)}秒）から推定しました。`),M.ambiguous&&P.push("1歩分とも2歩分とも決めにくい周期があり、歩数が1歩ずれている可能性があります。"),L&&!V&&!M.estimatedEdges.some(Boolean)&&P.push("脚が映っていない時間がありますが、その前後の入れ替わりの間隔は通常の周期でした。"),O.unshift(...P)}S.length&&O.unshift("ゴールを2回以上越えています。最初の走りを解析しました。");const N=(P,V,Z)=>`${P}の線を越える瞬間の骨盤は映っていない（体が画面の端にかかる・隠れる）ため、${Z}の動きを${Math.round(V.extendedSeconds*1e3)}ミリ秒延ばして通過時刻を推定しました。`;v.extendedSeconds&&O.unshift(N("出口",v,"直前")),_.extendedSeconds&&O.unshift(N("入口",_,"直後"));const G=M?.steps??j,Y=M?.multiples??[];return{...o,start:_,finish:v,duration:w,speed:i/w,steps:G,count:W,edgeFractions:M?.edges??null,strideIntervals:yy(e,G,t,r,_.pts,v.pts,i,f).map((P,V)=>(Y[V]??1)>1?{...P,distanceM:null,reason:`入れ替わりの見逃しで${Y[V]}歩分の区間です`}:P),cadence:W===null?null:W/w,stride:W===null?null:i/W,warnings:O}}const ac=[31,32],Le=(e,t=.5)=>!!e&&Number.isFinite(e.x)&&Number.isFinite(e.y)&&(e.visibility??1)>=t,Pt=e=>{const t=[...e].sort((r,i)=>r-i);return t.length?t[t.length>>1]:NaN},er=(e,t)=>{const r=[...e].sort((i,n)=>i-n);return r.length?r[Math.min(r.length-1,Math.floor(t*r.length))]:NaN},Iy=.02,sc=.05,oc=.1,uc=.03,Ey=.03,Cy=.06,zy=.4,Ay=.03,My=.05;function lc(e,t,r){return er(e.flatMap(i=>[[23,27],[24,28]].flatMap(([n,a])=>Le(i.pose[n])&&Le(i.pose[a])?[Math.hypot((i.pose[n].x-i.pose[a].x)*t,(i.pose[n].y-i.pose[a].y)*r)]:[])),.9)}const Oy=(e,t,r)=>e.flatMap(i=>ac.filter(n=>Le(i.pose[n])).map(n=>({t:i.pts,frame:i.frame,x:i.pose[n].x*t,y:i.pose[n].y*r}))),Ry=(e,t)=>e.filter(r=>e.some(i=>i!==r&&Math.abs(i.t-r.t)<=Iy&&Math.abs(i.t-r.t)>0&&Math.hypot(i.x-r.x,i.y-r.y)<sc*t));function Ny(e,t){const r=[];for(const i of e){const n=r.find(a=>Math.abs(a.x-i.x)<oc*t&&i.t-a.to<=uc);n?(n.toes.push(i),n.to=Math.max(n.to,i.t),n.x=Pt(n.toes.map(a=>a.x))):r.push({x:i.x,y:i.y,from:i.t,to:i.t,toes:[i]})}for(const i of r)i.y=er(i.toes.map(n=>n.y),.8);return r.filter(i=>i.to-i.from>=Ey)}function By(e,t){const r=[];for(const i of[...e].sort((n,a)=>n.from-a.from)){const n=r.find(a=>Math.abs(a.x-i.x)<oc*t);n?(n.toes.push(...i.toes),n.from=Math.min(n.from,i.from),n.to=Math.max(n.to,i.to),n.x=Pt(n.toes.map(a=>a.x)),n.y=er(n.toes.map(a=>a.y),.8)):r.push({...i,toes:[...i.toes]})}return r}function Dy(e,t,r,i=1/0){const n=[];for(const a of By(e,t).filter(s=>s.to-s.from>=Cy).sort((s,o)=>s.from-o.from)){const s=n.at(-1);if((!s||(a.x-s.x)*r>zy*t)&&n.push(a),n.length===i)break}return n}function Py(e,t,r,i,n,a=-1/0){const s=r.filter(c=>Math.abs(c.x-e.x)<sc*2*i&&c.t>=e.from-.1&&c.t<=e.to+.1).sort((c,f)=>c.t-f.t),o=s.find(c=>e.y-c.y<Ay*i)??null,l=[...s].reverse().find(c=>e.y-c.y<My*i)??null,d=l===null||n-l.t<.02,p=o===null||o.t-a<.02;return{index:t,x:e.x,groundY:e.y,touchdown:p?null:o.t,touchdownFrame:p?null:o.frame,toeOff:d?null:l.t,toeOffFrame:d?null:l.frame}}const Uy=.45,ta=.38,_i=e=>e*180/Math.PI;function dc(e,t,r){const i=ac.map(n=>Le(e[n],.3)?Math.abs(e[n].x-t)*r:1/0);return i[0]===1/0&&i[1]===1/0?null:i[0]<=i[1]?0:1}function pc(e,t,r,i,n){if(![11,12,23,24].every(d=>Le(e[d],.3)))return null;const a=(e[11].x+e[12].x)/2*t,s=(e[11].y+e[12].y)/2*r,o=(e[23].x+e[24].x)/2*t,l=(e[23].y+e[24].y)/2*r;return Math.hypot(a-o,s-l)<Uy*n?null:_i(Math.atan2((a-o)*i,l-s))}function Ly(e,t,r,i,n){const a=e[25+t],s=e[27+t];return!Le(a,.3)||!Le(s,.3)?null:_i(Math.atan2((a.x-s.x)*r*n,(s.y-a.y)*i))}function Cw(e,t,r,i,n,a){const s=e[23+t],o=e[25+t];if(!Le(s,.3)||!Le(o,.3))return null;const l=(o.x-s.x)*r*n,d=(o.y-s.y)*i;return Math.hypot(l,d)<ta*a?null:_i(Math.atan2(l,d))}function Zo(e,t,r,i,n){const[a,s,o]=[e[23+t],e[25+t],e[27+t]];if(![a,s,o].every(c=>Le(c,.3)))return null;const l={x:(a.x-s.x)*r,y:(a.y-s.y)*i},d={x:(o.x-s.x)*r,y:(o.y-s.y)*i};if(Math.hypot(l.x,l.y)<ta*n||Math.hypot(d.x,d.y)<ta*n)return null;const p=(l.x*d.x+l.y*d.y)/(Math.hypot(l.x,l.y)*Math.hypot(d.x,d.y));return _i(Math.acos(Math.max(-1,Math.min(1,p))))}const qy="crouch-start-v2-experimental",Wy=5,bi=e=>e.refined??e.pose,Yo=.06,Qo=.15,Gy=.05,Fy=.2,Vy=.1,Hy=.5,jy=.3,Ky=.3,Xy=2,Zy=.8,Jo=.2,Yy=.1,Qy=.1,Jy={gap:Gy,leave:Qy};function e_(e,t){const r={version:qy,reason:null,direction:0,set:null,blockClearance:null,blocks:null,contacts:[],steps:[],firstFlight:null,notes:[]},i=F=>({...r,reason:F}),{width:n,height:a}=t,s=e.filter(F=>F.pose);if(s.length<20)return i("選手を十分に捉えられませんでした。真横から、全身が映るように撮影してください。");const o=F=>({x:F.x*n,y:F.y*a}),l=F=>Le(F[23],.3)&&Le(F[24],.3)?o({x:(F[23].x+F[24].x)/2,y:(F[23].y+F[24].y)/2}):null,d=lc(s,n,a);if(!(d>0))return i("脚を十分に捉えられませんでした。");const p=s.flatMap(F=>{const pe=l(F.pose);return pe?[{t:F.pts,frame:F.frame,...pe}]:[]}),c=Math.sign(p.at(-1).x-p[0].x);if(!c)return i("走る向きを確認できませんでした。");r.direction=c;const f=r_(p,d,c),g=p.slice(f),m=Pt(g.slice(0,Math.max(3,Math.round((f?g.length:p.length)*.05))).map(F=>F.x)),_=g.findIndex((F,pe)=>(F.x-m)*c>Yo*d&&g.slice(pe,pe+10).every(fe=>(fe.x-m)*c>Yo*d));if(_<0)return i("走り出しを確認できませんでした。");const v=g[_].t,$=f?g[0].t:-1/0;if(v-g[0].t<Vy)return i("スタートの構えを確認できませんでした。構えから映っている動画を使ってください。");const w=Oy(s,n,a),S=Ry(w,d),x=Ny(S,d),I=S.filter(F=>F.t>=$&&F.t<v);if(I.length<4)return i("スタートの構え（ブロック上の足）を確認できませんでした。構えから映っている動画を使ってください。");const C=F=>F*c,z=[er(I.map(F=>C(F.x)),.05)-Qo*d,er(I.map(F=>C(F.x)),.95)+Qo*d],k=F=>C(F.x)>=z[0]&&C(F.x)<=z[1],B=S.filter(F=>F.t>=v&&k(F)).sort((F,pe)=>F.t-pe.t),L=B.filter(F=>F.t<=v+.15),j=L.length?er(L.map(F=>C(F.x)),.75):z[1];let M=v;const W=Jy;s.map(F=>F.pts);const O=w,N=(F,pe)=>pe-F;Pt(s.slice(1).map((F,pe)=>F.pts-s[pe].pts).filter(F=>F>0))||1/240;for(const F of O.filter(pe=>pe.t>=v).sort((pe,fe)=>pe.t-fe.t)){const pe=C(F.x)-j;if(!(pe<-.12*d||pe>W.leave*d)){if(N(M,F.t)>W.gap)break;M=F.t}}const G=B.filter(F=>F.t>=M-.05),Y=G.length?Pt(G.map(F=>F.x)):c>0?z[1]/c:z[0]/c,P=I.filter(F=>(Y-F.x)*c>.15*d);r.blocks={front:Y/n,rear:P.length?Pt(P.map(F=>F.x))/n:null};const V={x:Y},Z=Dy(x.filter(F=>F.from>M-uc&&C(F.x)>z[1]+.2*d),d,c,Wy),q=s.at(-1).pts;r.contacts=Z.map((F,pe)=>Py(F,pe+1,w,d,q));const ee=s.filter(F=>F.pts<v&&F.pts>=v-Fy),Q=s.findIndex(F=>F.pts>=M),X=Q<0?[]:s.slice(Math.max(0,Q-2),Q+3);r.set=ee.length?eu(ee,V.x/n,n,a,c,d):null,r.blockClearance=X.length?eu(X,V.x/n,n,a,c,d,s[Q]):null;const be=r.contacts[0];r.firstFlight=be?.touchdown!=null?be.touchdown-M:null,r.steps=i_(r.contacts,e,n,a,c,d),r.contacts.length||r.notes.push("ブロックを離れた後の接地が映っていません。");const ze=r.contacts.filter(F=>F.toeOff===null).map(F=>F.index);return ze.length&&r.notes.push(`${ze.join("・")}歩目は離地が映っていないため、接地時間を出していません。`),r}function cc(e,t,r){for(let i=0;i<e.length;i++)for(let n=i+1;n<e.length&&e[n].t-e[i].t<=Zy;n++)if((e[n].x-e[i].x)*r>=Xy*t)return i;return-1}function t_(e,t,r){const i=e.filter(l=>l.pose),n=lc(i,t,r),a=i.flatMap(l=>{const d=l.pose;return Le(d[23],.3)&&Le(d[24],.3)?[{t:l.pts,x:(d[23].x+d[24].x)/2*t}]:[]});if(a.length<2||!(n>0))return null;const s=Math.sign(a.at(-1).x-a[0].x),o=s?cc(a,n,s):-1;return o<0?null:a[o].t}function r_(e,t,r){const i=cc(e,t,r);if(i<0)return 0;let n=-1;for(let s=i;s>=0&&n<0;s--){const o=e.filter(d=>d.t<=e[s].t&&d.t>=e[s].t-Jo),l=o.map(d=>d.x);o.length>=3&&o.at(-1).t-o[0].t>=Jo/2&&Math.max(...l)-Math.min(...l)<Yy*t&&(n=e.indexOf(o[0]))}if(n<0)return 0;let a=0;for(let s=1,o=0;s<=n;s++){for(e[s].t-e[s-1].t>Hy&&(a=s);e[s].t-e[o].t>Ky;)o++;for(let l=o;l<s;l++)if(Math.abs(e[s].x-e[l].x)>jy*t){a=s+1;break}}return Math.min(a,n)}function i_(e,t,r,i,n,a){return e.map((s,o)=>{const l=e[o+1]??null,d=s.touchdown!==null&&s.toeOff!==null?s.toeOff-s.touchdown:null,p=l?.touchdown!=null&&s.toeOff!==null?l.touchdown-s.toeOff:null,c=l?.touchdown!=null&&s.touchdown!==null?l.touchdown-s.touchdown:null,f=s.touchdownFrame!==null?t.find(_=>_.frame===s.touchdownFrame):null,g=f?bi(f):null,m=g?dc(g,s.x/r,r):null;return{step:s.index,contactSeconds:d,flightSeconds:p,stepSeconds:c,pitch:c?1/c:null,shankAngle:g&&m!==null?Ly(g,m,r,i,n):null,trunkAngle:g?pc(g,r,i,n,a):null,side:m}})}function eu(e,t,r,i,n,a,s){const o=_=>{const v=bi(_),$=dc(v,t,r);return{side:$,trunk:pc(v,r,i,n,a),front:$===null?null:Zo(v,$,r,i,a),rear:$===null?null:Zo(v,1-$,r,i,a)}},l=e.map(o),d=_=>{const v=l.flatMap($=>$[_]===null?[]:[$[_]]);return v.length*2>=e.length?Pt(v):null},p=d("trunk"),c=d("front"),f=d("rear"),g=_=>[[_.trunk,p],[_.front,c],[_.rear,f]].reduce((v,[$,w])=>w===null?v:$===null?1/0:v+Math.abs($-w),0),m=s??e[l.reduce((_,v,$)=>g(v)<g(l[_])?$:_,l.length-1)];return{frame:m.frame,pts:m.pts,trunkAngle:p,frontKnee:c,rearKnee:f,frontSide:o(m).side}}var va=Object.defineProperty,n_=Object.getOwnPropertyDescriptor,a_=Object.getOwnPropertyNames,s_=Object.prototype.hasOwnProperty,o_=(e=>typeof require<"u"?require:typeof Proxy<"u"?new Proxy(e,{get:(t,r)=>(typeof require<"u"?require:t)[r]}):e)(function(e){if(typeof require<"u")return require.apply(this,arguments);throw Error('Dynamic require of "'+e+'" is not supported')}),H=(e,t)=>()=>(e&&(t=e(e=0)),t),ir=(e,t)=>{for(var r in t)va(e,r,{get:t[r],enumerable:!0})},u_=(e,t,r,i)=>{if(t&&typeof t=="object"||typeof t=="function")for(let n of a_(t))!s_.call(e,n)&&n!==r&&va(e,n,{get:()=>t[n],enumerable:!(i=n_(t,n))||i.enumerable});return e},kr=e=>u_(va({},"__esModule",{value:!0}),e),ur,vt,Qt,tu,hc,fc=H(()=>{ur=new Map,vt=[],Qt=(e,t,r)=>{if(t&&typeof t.init=="function"&&typeof t.createInferenceSessionHandler=="function"){let i=ur.get(e);if(i===void 0)ur.set(e,{backend:t,priority:r});else{if(i.priority>r)return;if(i.priority===r&&i.backend!==t)throw new Error(`cannot register backend "${e}" using priority ${r}`)}if(r>=0){let n=vt.indexOf(e);n!==-1&&vt.splice(n,1);for(let a=0;a<vt.length;a++)if(ur.get(vt[a]).priority<=r){vt.splice(a,0,e);return}vt.push(e)}return}throw new TypeError("not a valid backend")},tu=async e=>{let t=ur.get(e);if(!t)return"backend not found.";if(t.initialized)return t.backend;if(t.aborted)return t.error;{let r=!!t.initPromise;try{return r||(t.initPromise=t.backend.init(e)),await t.initPromise,t.initialized=!0,t.backend}catch(i){return r||(t.error=`${i}`,t.aborted=!0),t.error}finally{delete t.initPromise}}},hc=async e=>{let t=e.executionProviders||[],r=t.map(l=>typeof l=="string"?l:l.name),i=r.length===0?vt:r,n,a=[],s=new Set;for(let l of i){let d=await tu(l);typeof d=="string"?a.push({name:l,err:d}):(n||(n=d),n===d&&s.add(l))}if(!n)throw new Error(`no available backend found. ERR: ${a.map(l=>`[${l.name}] ${l.err}`).join(", ")}`);for(let{name:l,err:d}of a)r.includes(l)&&console.warn(`removing requested execution provider "${l}" from session options because it is not available: ${d}`);let o=t.filter(l=>s.has(typeof l=="string"?l:l.name));return[n,new Proxy(e,{get:(l,d)=>d==="executionProviders"?o:Reflect.get(l,d)})]}}),l_=H(()=>{fc()}),mc,d_=H(()=>{mc="1.27.0"}),ji,Re,gc=H(()=>{d_(),ji="warning",Re={wasm:{},webgl:{},webgpu:{},versions:{common:mc},set logLevel(e){if(e!==void 0){if(typeof e!="string"||["verbose","info","warning","error","fatal"].indexOf(e)===-1)throw new Error(`Unsupported logging level: ${e}`);ji=e}},get logLevel(){return ji}},Object.defineProperty(Re,"logLevel",{enumerable:!0})}),$e,p_=H(()=>{gc(),$e=Re}),yc,_c,c_=H(()=>{yc=(e,t)=>{let r=typeof document<"u"?document.createElement("canvas"):new OffscreenCanvas(1,1);r.width=e.dims[3],r.height=e.dims[2];let i=r.getContext("2d");if(i!=null){let n,a;t?.tensorLayout!==void 0&&t.tensorLayout==="NHWC"?(n=e.dims[2],a=e.dims[3]):(n=e.dims[3],a=e.dims[2]);let s=t?.format!==void 0?t.format:"RGB",o=t?.norm,l,d;o===void 0||o.mean===void 0?l=[255,255,255,255]:typeof o.mean=="number"?l=[o.mean,o.mean,o.mean,o.mean]:(l=[o.mean[0],o.mean[1],o.mean[2],0],o.mean[3]!==void 0&&(l[3]=o.mean[3])),o===void 0||o.bias===void 0?d=[0,0,0,0]:typeof o.bias=="number"?d=[o.bias,o.bias,o.bias,o.bias]:(d=[o.bias[0],o.bias[1],o.bias[2],0],o.bias[3]!==void 0&&(d[3]=o.bias[3]));let p=a*n,c=0,f=p,g=p*2,m=-1;s==="RGBA"?(c=0,f=p,g=p*2,m=p*3):s==="RGB"?(c=0,f=p,g=p*2):s==="RBG"&&(c=0,g=p,f=p*2);for(let _=0;_<a;_++)for(let v=0;v<n;v++){let $=(e.data[c++]-d[0])*l[0],w=(e.data[f++]-d[1])*l[1],S=(e.data[g++]-d[2])*l[2],x=m===-1?255:(e.data[m++]-d[3])*l[3];i.fillStyle="rgba("+$+","+w+","+S+","+x+")",i.fillRect(v,_,1,1)}if("toDataURL"in r)return r.toDataURL();throw new Error("toDataURL is not supported")}else throw new Error("Can not access image data")},_c=(e,t)=>{let r=typeof document<"u"?document.createElement("canvas").getContext("2d"):new OffscreenCanvas(1,1).getContext("2d"),i;if(r!=null){let n,a,s;t?.tensorLayout!==void 0&&t.tensorLayout==="NHWC"?(n=e.dims[2],a=e.dims[1],s=e.dims[3]):(n=e.dims[3],a=e.dims[2],s=e.dims[1]);let o=t!==void 0&&t.format!==void 0?t.format:"RGB",l=t?.norm,d,p;l===void 0||l.mean===void 0?d=[255,255,255,255]:typeof l.mean=="number"?d=[l.mean,l.mean,l.mean,l.mean]:(d=[l.mean[0],l.mean[1],l.mean[2],255],l.mean[3]!==void 0&&(d[3]=l.mean[3])),l===void 0||l.bias===void 0?p=[0,0,0,0]:typeof l.bias=="number"?p=[l.bias,l.bias,l.bias,l.bias]:(p=[l.bias[0],l.bias[1],l.bias[2],0],l.bias[3]!==void 0&&(p[3]=l.bias[3]));let c=a*n;if(t!==void 0&&(t.format!==void 0&&s===4&&t.format!=="RGBA"||s===3&&t.format!=="RGB"&&t.format!=="BGR"))throw new Error("Tensor format doesn't match input tensor dims");let f=4,g=0,m=1,_=2,v=3,$=0,w=c,S=c*2,x=-1;o==="RGBA"?($=0,w=c,S=c*2,x=c*3):o==="RGB"?($=0,w=c,S=c*2):o==="RBG"&&($=0,S=c,w=c*2),i=r.createImageData(n,a);for(let I=0;I<a*n;g+=f,m+=f,_+=f,v+=f,I++)i.data[g]=(e.data[$++]-p[0])*d[0],i.data[m]=(e.data[w++]-p[1])*d[1],i.data[_]=(e.data[S++]-p[2])*d[2],i.data[v]=x===-1?255:(e.data[x++]-p[3])*d[3]}else throw new Error("Can not access image data");return i}}),qr,bc,wc,$c,vc,xc,h_=H(()=>{xa(),qr=(e,t)=>{if(e===void 0)throw new Error("Image buffer must be defined");if(t.height===void 0||t.width===void 0)throw new Error("Image height and width must be defined");if(t.tensorLayout==="NHWC")throw new Error("NHWC Tensor layout is not supported yet");let{height:r,width:i}=t,n=t.norm??{mean:255,bias:0},a,s;typeof n.mean=="number"?a=[n.mean,n.mean,n.mean,n.mean]:a=[n.mean[0],n.mean[1],n.mean[2],n.mean[3]??255],typeof n.bias=="number"?s=[n.bias,n.bias,n.bias,n.bias]:s=[n.bias[0],n.bias[1],n.bias[2],n.bias[3]??0];let o=t.format!==void 0?t.format:"RGBA",l=t.tensorFormat!==void 0&&t.tensorFormat!==void 0?t.tensorFormat:"RGB",d=r*i,p=l==="RGBA"?new Float32Array(d*4):new Float32Array(d*3),c=4,f=0,g=1,m=2,_=3,v=0,$=d,w=d*2,S=-1;o==="RGB"&&(c=3,f=0,g=1,m=2,_=-1),l==="RGBA"?S=d*3:l==="RBG"?(v=0,w=d,$=d*2):l==="BGR"&&(w=0,$=d,v=d*2);for(let x=0;x<d;x++,f+=c,m+=c,g+=c,_+=c)p[v++]=(e[f]+s[0])/a[0],p[$++]=(e[g]+s[1])/a[1],p[w++]=(e[m]+s[2])/a[2],S!==-1&&_!==-1&&(p[S++]=(e[_]+s[3])/a[3]);return l==="RGBA"?new Ge("float32",p,[1,4,r,i]):new Ge("float32",p,[1,3,r,i])},bc=async(e,t)=>{let r=typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement,i=typeof ImageData<"u"&&e instanceof ImageData,n=typeof ImageBitmap<"u"&&e instanceof ImageBitmap,a=typeof e=="string",s,o=t??{},l=()=>{if(typeof document<"u")return document.createElement("canvas");if(typeof OffscreenCanvas<"u")return new OffscreenCanvas(1,1);throw new Error("Canvas is not supported")},d=p=>typeof HTMLCanvasElement<"u"&&p instanceof HTMLCanvasElement||p instanceof OffscreenCanvas?p.getContext("2d"):null;if(r){let p=l();p.width=e.width,p.height=e.height;let c=d(p);if(c!=null){let f=e.height,g=e.width;if(t!==void 0&&t.resizedHeight!==void 0&&t.resizedWidth!==void 0&&(f=t.resizedHeight,g=t.resizedWidth),t!==void 0){if(o=t,t.tensorFormat!==void 0)throw new Error("Image input config format must be RGBA for HTMLImageElement");o.tensorFormat="RGBA",o.height=f,o.width=g}else o.tensorFormat="RGBA",o.height=f,o.width=g;c.drawImage(e,0,0),s=c.getImageData(0,0,g,f).data}else throw new Error("Can not access image data")}else if(i){let p,c;if(t!==void 0&&t.resizedWidth!==void 0&&t.resizedHeight!==void 0?(p=t.resizedHeight,c=t.resizedWidth):(p=e.height,c=e.width),t!==void 0&&(o=t),o.format="RGBA",o.height=p,o.width=c,t!==void 0){let f=l();f.width=c,f.height=p;let g=d(f);if(g!=null)g.putImageData(e,0,0),s=g.getImageData(0,0,c,p).data;else throw new Error("Can not access image data")}else s=e.data}else if(n){if(t===void 0)throw new Error("Please provide image config with format for Imagebitmap");let p=l();p.width=e.width,p.height=e.height;let c=d(p);if(c!=null){let f=e.height,g=e.width;return c.drawImage(e,0,0,g,f),s=c.getImageData(0,0,g,f).data,o.height=f,o.width=g,qr(s,o)}else throw new Error("Can not access image data")}else{if(a)return new Promise((p,c)=>{let f=l(),g=d(f);if(!e||!g)return c();let m=new Image;m.crossOrigin="Anonymous",m.src=e,m.onload=()=>{f.width=m.width,f.height=m.height,g.drawImage(m,0,0,f.width,f.height);let _=g.getImageData(0,0,f.width,f.height);o.height=f.height,o.width=f.width,p(qr(_.data,o))}});throw new Error("Input data provided is not supported - aborted tensor creation")}if(s!==void 0)return qr(s,o);throw new Error("Input data provided is not supported - aborted tensor creation")},wc=(e,t)=>{let{width:r,height:i,download:n,dispose:a}=t,s=[1,i,r,4];return new Ge({location:"texture",type:"float32",texture:e,dims:s,download:n,dispose:a})},$c=(e,t)=>{let{dataType:r,dims:i,download:n,dispose:a}=t;return new Ge({location:"gpu-buffer",type:r??"float32",gpuBuffer:e,dims:i,download:n,dispose:a})},vc=(e,t)=>{let{dataType:r,dims:i,download:n,dispose:a}=t;return new Ge({location:"ml-tensor",type:r??"float32",mlTensor:e,dims:i,download:n,dispose:a})},xc=(e,t,r)=>new Ge({location:"cpu-pinned",type:e,data:t,dims:r??[t.length]})}),Nt,br,Ki,Sc,f_=H(()=>{Nt=new Map([["float32",Float32Array],["uint8",Uint8Array],["int8",Int8Array],["uint16",Uint16Array],["int16",Int16Array],["int32",Int32Array],["bool",Uint8Array],["float64",Float64Array],["uint32",Uint32Array],["int4",Uint8Array],["uint4",Uint8Array]]),br=new Map([[Float32Array,"float32"],[Uint8Array,"uint8"],[Int8Array,"int8"],[Uint16Array,"uint16"],[Int16Array,"int16"],[Int32Array,"int32"],[Float64Array,"float64"],[Uint32Array,"uint32"]]),Ki=!1,Sc=()=>{if(!Ki){Ki=!0;let e=typeof BigInt64Array<"u"&&BigInt64Array.from,t=typeof BigUint64Array<"u"&&BigUint64Array.from,r=globalThis.Float16Array,i=typeof r<"u"&&r.from;e&&(Nt.set("int64",BigInt64Array),br.set(BigInt64Array,"int64")),t&&(Nt.set("uint64",BigUint64Array),br.set(BigUint64Array,"uint64")),i?(Nt.set("float16",r),br.set(r,"float16")):Nt.set("float16",Uint16Array)}}}),kc,Tc,m_=H(()=>{xa(),kc=e=>{let t=1;for(let r=0;r<e.length;r++){let i=e[r];if(typeof i!="number"||!Number.isSafeInteger(i))throw new TypeError(`dims[${r}] must be an integer, got: ${i}`);if(i<0)throw new RangeError(`dims[${r}] must be a non-negative integer, got: ${i}`);t*=i}return t},Tc=(e,t)=>{switch(e.location){case"cpu":return new Ge(e.type,e.data,t);case"cpu-pinned":return new Ge({location:"cpu-pinned",data:e.data,type:e.type,dims:t});case"texture":return new Ge({location:"texture",texture:e.texture,type:e.type,dims:t});case"gpu-buffer":return new Ge({location:"gpu-buffer",gpuBuffer:e.gpuBuffer,type:e.type,dims:t});case"ml-tensor":return new Ge({location:"ml-tensor",mlTensor:e.mlTensor,type:e.type,dims:t});default:throw new Error(`tensorReshape: tensor location ${e.location} is not supported`)}}}),Ge,xa=H(()=>{c_(),h_(),f_(),m_(),Ge=class{constructor(e,t,r){Sc();let i,n;if(typeof e=="object"&&"location"in e)switch(this.dataLocation=e.location,i=e.type,n=e.dims,e.location){case"cpu-pinned":{let s=Nt.get(i);if(!s)throw new TypeError(`unsupported type "${i}" to create tensor from pinned buffer`);if(!(e.data instanceof s))throw new TypeError(`buffer should be of type ${s.name}`);this.cpuData=e.data;break}case"texture":{if(i!=="float32")throw new TypeError(`unsupported type "${i}" to create tensor from texture`);this.gpuTextureData=e.texture,this.downloader=e.download,this.disposer=e.dispose;break}case"gpu-buffer":{if(i!=="float32"&&i!=="float16"&&i!=="int32"&&i!=="int64"&&i!=="uint32"&&i!=="uint8"&&i!=="bool"&&i!=="uint4"&&i!=="int4")throw new TypeError(`unsupported type "${i}" to create tensor from gpu buffer`);this.gpuBufferData=e.gpuBuffer,this.downloader=e.download,this.disposer=e.dispose;break}case"ml-tensor":{if(i!=="float32"&&i!=="float16"&&i!=="int32"&&i!=="int64"&&i!=="uint32"&&i!=="uint64"&&i!=="int8"&&i!=="uint8"&&i!=="bool"&&i!=="uint4"&&i!=="int4")throw new TypeError(`unsupported type "${i}" to create tensor from MLTensor`);this.mlTensorData=e.mlTensor,this.downloader=e.download,this.disposer=e.dispose;break}default:throw new Error(`Tensor constructor: unsupported location '${this.dataLocation}'`)}else{let s,o;if(typeof e=="string")if(i=e,o=r,e==="string"){if(!Array.isArray(t))throw new TypeError("A string tensor's data must be a string array.");s=t}else{let l=Nt.get(e);if(l===void 0)throw new TypeError(`Unsupported tensor type: ${e}.`);if(Array.isArray(t)){if(e==="float16"&&l===Uint16Array||e==="uint4"||e==="int4")throw new TypeError(`Creating a ${e} tensor from number array is not supported. Please use ${l.name} as data.`);e==="uint64"||e==="int64"?s=l.from(t,BigInt):s=l.from(t)}else if(t instanceof l)s=t;else if(t instanceof Uint8ClampedArray)if(e==="uint8")s=Uint8Array.from(t);else throw new TypeError("A Uint8ClampedArray tensor's data must be type of uint8");else if(e==="float16"&&t instanceof Uint16Array&&l!==Uint16Array)s=new globalThis.Float16Array(t.buffer,t.byteOffset,t.length);else throw new TypeError(`A ${i} tensor's data must be type of ${l}`)}else if(o=t,Array.isArray(e)){if(e.length===0)throw new TypeError("Tensor type cannot be inferred from an empty array.");let l=typeof e[0];if(l==="string")i="string",s=e;else if(l==="boolean")i="bool",s=Uint8Array.from(e);else throw new TypeError(`Invalid element type of data array: ${l}.`)}else if(e instanceof Uint8ClampedArray)i="uint8",s=Uint8Array.from(e);else{let l=br.get(e.constructor);if(l===void 0)throw new TypeError(`Unsupported type for tensor data: ${e.constructor}.`);i=l,s=e}if(o===void 0)o=[s.length];else if(!Array.isArray(o))throw new TypeError("A tensor's dims must be a number array");n=o,this.cpuData=s,this.dataLocation="cpu"}let a=kc(n);if(this.cpuData&&a!==this.cpuData.length&&!((i==="uint4"||i==="int4")&&Math.ceil(a/2)===this.cpuData.length))throw new Error(`Tensor's size(${a}) does not match data length(${this.cpuData.length}).`);this.type=i,this.dims=n,this.size=a}static async fromImage(e,t){return bc(e,t)}static fromTexture(e,t){return wc(e,t)}static fromGpuBuffer(e,t){return $c(e,t)}static fromMLTensor(e,t){return vc(e,t)}static fromPinnedBuffer(e,t,r){return xc(e,t,r)}toDataURL(e){return yc(this,e)}toImageData(e){return _c(this,e)}get data(){if(this.ensureValid(),!this.cpuData)throw new Error("The data is not on CPU. Use `getData()` to download GPU data to CPU, or use `texture` or `gpuBuffer` property to access the GPU data directly.");return this.cpuData}get location(){return this.dataLocation}get texture(){if(this.ensureValid(),!this.gpuTextureData)throw new Error("The data is not stored as a WebGL texture.");return this.gpuTextureData}get gpuBuffer(){if(this.ensureValid(),!this.gpuBufferData)throw new Error("The data is not stored as a WebGPU buffer.");return this.gpuBufferData}get mlTensor(){if(this.ensureValid(),!this.mlTensorData)throw new Error("The data is not stored as a WebNN MLTensor.");return this.mlTensorData}async getData(e){switch(this.ensureValid(),this.dataLocation){case"cpu":case"cpu-pinned":return this.data;case"texture":case"gpu-buffer":case"ml-tensor":{if(!this.downloader)throw new Error("The current tensor is not created with a specified data downloader.");if(this.isDownloading)throw new Error("The current tensor is being downloaded.");try{this.isDownloading=!0;let t=await this.downloader();return this.downloader=void 0,this.dataLocation="cpu",this.cpuData=t,e&&this.disposer&&(this.disposer(),this.disposer=void 0),t}finally{this.isDownloading=!1}}default:throw new Error(`cannot get data from location: ${this.dataLocation}`)}}dispose(){if(this.isDownloading)throw new Error("The current tensor is being downloaded.");this.disposer&&(this.disposer(),this.disposer=void 0),this.cpuData=void 0,this.gpuTextureData=void 0,this.gpuBufferData=void 0,this.mlTensorData=void 0,this.downloader=void 0,this.isDownloading=void 0,this.dataLocation="none"}ensureValid(){if(this.dataLocation==="none")throw new Error("The tensor is disposed.")}reshape(e){if(this.ensureValid(),this.downloader||this.disposer)throw new Error("Cannot reshape a tensor that owns GPU resource.");return Tc(this,e)}}}),rt,Ic=H(()=>{xa(),rt=Ge}),oi,Xi,pt,nt,Lt,qt,Ec=H(()=>{gc(),oi=(e,t)=>{(typeof Re.trace>"u"?!Re.wasm.trace:!Re.trace)||console.timeStamp(`${e}::ORT::${t}`)},Xi=(e,t)=>{let r=new Error().stack?.split(/\r\n|\r|\n/g)||[],i=!1;for(let n=0;n<r.length;n++){if(i&&!r[n].includes("TRACE_FUNC")){let a=`FUNC_${e}::${r[n].trim().split(" ")[1]}`;t&&(a+=`::${t}`),oi("CPU",a);return}r[n].includes("TRACE_FUNC")&&(i=!0)}},pt=e=>{(typeof Re.trace>"u"?!Re.wasm.trace:!Re.trace)||Xi("BEGIN",e)},nt=e=>{(typeof Re.trace>"u"?!Re.wasm.trace:!Re.trace)||Xi("END",e)},Lt=e=>{(typeof Re.trace>"u"?!Re.wasm.trace:!Re.trace)||console.time(`ORT::${e}`)},qt=e=>{(typeof Re.trace>"u"?!Re.wasm.trace:!Re.trace)||console.timeEnd(`ORT::${e}`)}}),Cc,g_=H(()=>{fc(),Ic(),Ec(),Cc=class zc{constructor(t){this.handler=t}async run(t,r,i){pt(),Lt("InferenceSession.run");let n={},a={};if(typeof t!="object"||t===null||t instanceof rt||Array.isArray(t))throw new TypeError("'feeds' must be an object that use input names as keys and OnnxValue as corresponding values.");let s=!0;if(typeof r=="object"){if(r===null)throw new TypeError("Unexpected argument[1]: cannot be null.");if(r instanceof rt)throw new TypeError("'fetches' cannot be a Tensor");if(Array.isArray(r)){if(r.length===0)throw new TypeError("'fetches' cannot be an empty array.");s=!1;for(let d of r){if(typeof d!="string")throw new TypeError("'fetches' must be a string array or an object.");if(this.outputNames.indexOf(d)===-1)throw new RangeError(`'fetches' contains invalid output name: ${d}.`);n[d]=null}if(typeof i=="object"&&i!==null)a=i;else if(typeof i<"u")throw new TypeError("'options' must be an object.")}else{let d=!1,p=Object.getOwnPropertyNames(r);for(let c of this.outputNames)if(p.indexOf(c)!==-1){let f=r[c];(f===null||f instanceof rt)&&(d=!0,s=!1,n[c]=f)}if(d){if(typeof i=="object"&&i!==null)a=i;else if(typeof i<"u")throw new TypeError("'options' must be an object.")}else a=r}}else if(typeof r<"u")throw new TypeError("Unexpected argument[1]: must be 'fetches' or 'options'.");for(let d of this.inputNames)if(typeof t[d]>"u")throw new Error(`input '${d}' is missing in 'feeds'.`);if(s)for(let d of this.outputNames)n[d]=null;let o=await this.handler.run(t,n,a),l={};for(let d in o)if(Object.hasOwnProperty.call(o,d)){let p=o[d];p instanceof rt?l[d]=p:l[d]=new rt(p.type,p.data,p.dims)}return qt("InferenceSession.run"),nt(),l}async release(){return this.handler.dispose()}static async create(t,r,i,n){pt(),Lt("InferenceSession.create");let a,s={};if(typeof t=="string"){if(a=t,typeof r=="object"&&r!==null)s=r;else if(typeof r<"u")throw new TypeError("'options' must be an object.")}else if(t instanceof Uint8Array){if(a=t,typeof r=="object"&&r!==null)s=r;else if(typeof r<"u")throw new TypeError("'options' must be an object.")}else if(t instanceof ArrayBuffer||typeof SharedArrayBuffer<"u"&&t instanceof SharedArrayBuffer){let p=t,c=0,f=t.byteLength;if(typeof r=="object"&&r!==null)s=r;else if(typeof r=="number"){if(c=r,!Number.isSafeInteger(c))throw new RangeError("'byteOffset' must be an integer.");if(c<0||c>=p.byteLength)throw new RangeError(`'byteOffset' is out of range [0, ${p.byteLength}).`);if(f=t.byteLength-c,typeof i=="number"){if(f=i,!Number.isSafeInteger(f))throw new RangeError("'byteLength' must be an integer.");if(f<=0||c+f>p.byteLength)throw new RangeError(`'byteLength' is out of range (0, ${p.byteLength-c}].`);if(typeof n=="object"&&n!==null)s=n;else if(typeof n<"u")throw new TypeError("'options' must be an object.")}else if(typeof i<"u")throw new TypeError("'byteLength' must be a number.")}else if(typeof r<"u")throw new TypeError("'options' must be an object.");a=new Uint8Array(p,c,f)}else throw new TypeError("Unexpected argument[0]: must be 'path' or 'buffer'.");let[o,l]=await hc(s),d=await o.createInferenceSessionHandler(a,l);return qt("InferenceSession.create"),nt(),new zc(d)}startProfiling(){this.handler.startProfiling()}endProfiling(){this.handler.endProfiling()}get inputNames(){return this.handler.inputNames}get outputNames(){return this.handler.outputNames}get inputMetadata(){return this.handler.inputMetadata}get outputMetadata(){return this.handler.outputMetadata}}}),Sa,y_=H(()=>{g_(),Sa=Cc}),__=H(()=>{}),b_=H(()=>{}),w_=H(()=>{}),$_=H(()=>{}),v_={};ir(v_,{InferenceSession:()=>Sa,TRACE:()=>oi,TRACE_EVENT_BEGIN:()=>Lt,TRACE_EVENT_END:()=>qt,TRACE_FUNC_BEGIN:()=>pt,TRACE_FUNC_END:()=>nt,Tensor:()=>rt,env:()=>$e,registerBackend:()=>Qt});var Ke=H(()=>{l_(),p_(),y_(),Ic(),__(),b_(),Ec(),w_(),$_()}),ka=H(()=>{}),Ac={};ir(Ac,{default:()=>Mc});var Zi,Yi,Mc,x_=H(()=>{Pm(),Vt(),Ta(),Zi="ort-wasm-proxy-worker",Yi=globalThis.self?.name===Zi,Yi&&(self.onmessage=e=>{let{type:t,in:r}=e.data;try{switch(t){case"init-wasm":Ia(r.wasm).then(()=>{Fa(r).then(()=>{postMessage({type:t})},i=>{postMessage({type:t,err:i})})},i=>{postMessage({type:t,err:i})});break;case"init-ep":{let{epName:i,env:n}=r;Va(n,i).then(()=>{postMessage({type:t})},a=>{postMessage({type:t,err:a})});break}case"copy-from":{let{buffer:i}=r,n=fi(i);postMessage({type:t,out:n});break}case"create":{let{model:i,options:n}=r;Ha(i,n).then(a=>{postMessage({type:t,out:a})},a=>{postMessage({type:t,err:a})});break}case"release":ja(r),postMessage({type:t});break;case"run":{let{sessionId:i,inputIndices:n,inputs:a,outputIndices:s,options:o}=r;Ka(i,n,a,s,new Array(s.length).fill(null),o).then(l=>{l.some(d=>d[3]!=="cpu")?postMessage({type:t,err:"Proxy does not support non-cpu tensor location."}):postMessage({type:t,out:l},Za([...a,...l]))},l=>{postMessage({type:t,err:l})});break}case"end-profiling":Xa(r),postMessage({type:t});break;default:}}catch(i){postMessage({type:t,err:i})}}),Mc=Yi?null:e=>new Worker(e??qe,{type:"module",name:Zi})}),Oc={};ir(Oc,{default:()=>Rc});async function ru(e={}){var t=e,r=!!globalThis.window,i=!!globalThis.WorkerGlobalScope,n=i&&self.name?.startsWith("em-pthread");t.mountExternalData=(u,h)=>{u.startsWith("./")&&(u=u.substring(2)),(t.Xc||(t.Xc=new Map)).set(u,h)},t.unmountExternalData=()=>{delete t.Xc},globalThis.SharedArrayBuffer??new WebAssembly.Memory({initial:0,maximum:0,shared:!0}).buffer.constructor;let a=u=>async(...h)=>{try{if(t.Yc)throw Error("Session already started");let b=t.Yc={Kd:h[0],errors:[]},y=await u(...h);if(t.Yc!==b)throw Error("Session mismatch");t.dd?.flush();let T=b.errors;if(0<T.length){let E=await Promise.all(T);if(E=E.filter(A=>A),0<E.length)throw Error(E.join(`
`))}return y}finally{t.Yc=null}};t.jsepInit=(u,h)=>{if(u==="webgpu"){[t.dd,t.Ad,t.Ed,t.ed,t.Dd,t.$b,t.Fd,t.Hd,t.Bd,t.Cd,t.Gd]=h;let b=t.dd;t.jsepRegisterBuffer=(y,T,E,A)=>b.registerBuffer(y,T,E,A),t.jsepGetBuffer=y=>b.getBuffer(y),t.jsepCreateDownloader=(y,T,E)=>b.createDownloader(y,T,E),t.jsepOnCreateSession=y=>{b.onCreateSession(y)},t.jsepOnReleaseSession=y=>{b.onReleaseSession(y)},t.jsepOnRunStart=y=>b.onRunStart(y),t.Id=(y,T)=>{b.upload(y,T)}}else if(u==="webnn"){let b=h[0];[t.Sd,t.sd,t.webnnEnsureTensor,t.td,t.webnnDownloadTensor,t.Rd,t.webnnEnableTraceEvent]=h.slice(1),t.webnnReleaseTensorId=t.sd,t.webnnUploadTensor=t.td,t.webnnRegisterMLContext=t.Rd,t.webnnOnRunStart=y=>b.onRunStart(y),t.webnnOnRunEnd=b.onRunEnd.bind(b),t.webnnOnReleaseSession=y=>{b.onReleaseSession(y)},t.webnnCreateMLTensorDownloader=(y,T)=>b.createMLTensorDownloader(y,T),t.webnnRegisterMLTensor=(y,T,E,A)=>b.registerMLTensor(y,T,E,A),t.webnnCreateMLContext=y=>b.createMLContext(y),t.webnnRegisterMLConstant=(y,T,E,A,D,K)=>b.registerMLConstant(y,T,E,A,D,t.Xc,K),t.webnnRegisterGraphInput=b.registerGraphInput.bind(b),t.webnnIsGraphInput=b.isGraphInput.bind(b),t.webnnRegisterGraphOutput=b.registerGraphOutput.bind(b),t.webnnIsGraphOutput=b.isGraphOutput.bind(b),t.webnnCreateTemporaryTensor=b.createTemporaryTensor.bind(b),t.webnnIsGraphInputOutputTypeSupported=b.isGraphInputOutputTypeSupported.bind(b)}};let s=()=>{let u=h=>(...b)=>{let y=ot;return b=h(...b),ot!=y?new Promise((T,E)=>{Oi={resolve:T,reject:E}}):b};(()=>{for(let h of["_OrtAppendExecutionProvider","_OrtCreateSession","_OrtRun","_OrtRunWithBinding","_OrtBindInput"])t[h]=u(t[h])})(),a!==void 0&&(t._OrtRun=a(t._OrtRun),t._OrtRunWithBinding=a(t._OrtRunWithBinding)),s=void 0};t.asyncInit=()=>{s?.()};var o,l,d=(u,h)=>{throw h},p=import.meta.url,c="";if(r||i){try{c=new URL(".",p).href}catch{}i&&(l=u=>{var h=new XMLHttpRequest;return h.open("GET",u,!1),h.responseType="arraybuffer",h.send(null),new Uint8Array(h.response)}),o=async u=>{if(z(u))return new Promise((b,y)=>{var T=new XMLHttpRequest;T.open("GET",u,!0),T.responseType="arraybuffer",T.onload=()=>{T.status==200||T.status==0&&T.response?b(T.response):y(T.status)},T.onerror=y,T.send(null)});var h=await fetch(u,{credentials:"same-origin"});if(h.ok)return h.arrayBuffer();throw Error(h.status+" : "+h.url)}}var f,g,m,_,v,$,w=console.log.bind(console),S=console.error.bind(console),x=w,I=S,C=!1,z=u=>u.startsWith("file://");function k(){_t.buffer!=L.buffer&&ee()}if(n){let u=function(h){try{var b=h.data,y=b.Sc;if(y==="load"){let T=[];self.onmessage=E=>T.push(E),$=()=>{postMessage({Sc:"loaded"});for(let E of T)u(E);self.onmessage=u};for(let E of b.xd)t[E]&&!t[E].proxy||(t[E]=(...A)=>{postMessage({Sc:"callHandler",wd:E,args:A})},E=="print"&&(x=t[E]),E=="printErr"&&(I=t[E]));_t=b.Od,ee(),g=b.Pd,ze(),Ur()}else if(y==="run"){(function(T){var E=(k(),N)[T+52>>>2>>>0];T=(k(),N)[T+56>>>2>>>0],to(E,E-T),ue(E)})(b.Rc),Pi(b.Rc,0,0,1,0,0),rs(),zi(b.Rc),B||(Xs(),B=!0);try{ig(b.Md,b.bd)}catch(T){if(T!="unwind")throw T}}else b.target!=="setimmediate"&&(y==="checkMailbox"?B&&Mr():y&&(I(`worker: received unknown command ${y}`),I(b)))}catch(T){throw Zs(),T}};var B=!1;self.onunhandledrejection=h=>{throw h.reason||h},self.onmessage=u}var L,j,M,W,O,N,G,Y,P,V,Z,q=!1;function ee(){var u=_t.buffer;t.HEAP8=L=new Int8Array(u),M=new Int16Array(u),t.HEAPU8=j=new Uint8Array(u),W=new Uint16Array(u),t.HEAP32=O=new Int32Array(u),t.HEAPU32=N=new Uint32Array(u),G=new Float32Array(u),Y=new Float64Array(u),P=new BigInt64Array(u),V=new BigUint64Array(u)}function Q(){q=!0,n?$():ht.sb()}function X(u){throw I(u="Aborted("+u+")"),C=!0,u=new WebAssembly.RuntimeError(u+". Build with -sASSERTIONS for more info."),v?.(u),u}function be(){return{a:{ma:T0,gb:k0,g:ng,J:ag,f:sg,o:og,h:ug,ha:lg,b:dg,T:pg,Ha:us,n:cg,$:cs,Xa:hs,Da:fs,Fa:ms,Ya:gs,Va:ys,Oa:_s,Ua:bs,ka:ws,Ea:$s,Ba:vs,Wa:xs,Ca:Ss,bb:hg,ea:fg,wa:mg,ua:yg,da:bg,O:wg,H:$g,va:vg,_:Cg,xa:zg,Ra:Ag,za:Og,Ia:Rg,sa:Ng,fa:Bg,Qa:zi,_a:Dg,R:qg,r:Hg,c:Ei,hb:jg,y:Kg,M:Xg,D:Zg,l:Yg,s:Ms,ib:Qg,I:Jg,S:e0,j:t0,u:r0,q:i0,k:n0,La:a0,Ma:s0,Na:o0,Ja:Bs,Ka:Ds,ta:Ps,db:l0,ab:p0,v:c0,aa:h0,ga:f0,$a:d0,W:m0,Za:g0,Aa:y0,F:u0,U:_0,la:Dr,ya:w0,fb:b0,eb:$0,Sa:Ws,Ta:Gs,Ga:xi,V:Fs,ja:Vs,Pa:Hs,ia:js,kb:uy,na:iy,lb:oy,oa:ry,G:j0,e:z0,t:E0,w:I0,B:L0,mb:J0,K:F0,x:O0,pa:ey,Y:ny,ba:Q0,nb:Y0,ob:Z0,P:q0,qa:X0,pb:K0,N:V0,Z:ty,d:C0,A:M0,m:A0,jb:ly,p:N0,z:B0,C:R0,E:D0,L:W0,qb:H0,Q:ay,ca:G0,X:sy,rb:U0,ra:P0,i:x0,a:_t,cb:vi}}}async function ze(){function u(y,T){var E=ht=y.exports;y={};for(let[A,D]of Object.entries(E))typeof D=="function"?(E=Pg(D),y[A]=E):y[A]=D;return ht=y,ht=(function(){var A=ht,D=J=>oe=>J(oe)>>>0,K=J=>()=>J()>>>0;return(A=Object.assign({},A)).tb=D(A.tb),A.Xb=K(A.Xb),A.Zb=D(A.Zb),A.lc=D(A.lc),A.mc=K(A.mc),A.qc=D(A.qc),A})(),es.push(ht._b),Ks=(y=ht).tb,Xs=y.ub,t._OrtInit=y.vb,t._OrtGetLastError=y.wb,t._OrtCreateSessionOptions=y.xb,t._OrtAppendExecutionProvider=y.yb,t._OrtAddFreeDimensionOverride=y.zb,t._OrtAddSessionConfigEntry=y.Ab,t._OrtReleaseSessionOptions=y.Bb,t._OrtCreateSession=y.Cb,t._OrtReleaseSession=y.Db,t._OrtGetInputOutputCount=y.Eb,t._OrtGetInputOutputMetadata=y.Fb,t._OrtFree=y.Gb,t._OrtCreateTensor=y.Hb,t._OrtGetTensorData=y.Ib,t._OrtReleaseTensor=y.Jb,t._OrtCreateRunOptions=y.Kb,t._OrtAddRunConfigEntry=y.Lb,t._OrtReleaseRunOptions=y.Mb,t._OrtCreateBinding=y.Nb,t._OrtBindInput=y.Ob,t._OrtBindOutput=y.Pb,t._OrtClearBoundOutputs=y.Qb,t._OrtReleaseBinding=y.Rb,t._OrtRunWithBinding=y.Sb,t._OrtRun=y.Tb,t._OrtEndProfiling=y.Ub,t._JsepOutput=y.Vb,t._JsepGetNodeName=y.Wb,Pr=y.Xb,ut=t._free=y.Yb,sr=t._malloc=y.Zb,Pi=y.ac,Zs=y.bc,Ys=y.cc,Qs=y.dc,Ui=y.ec,Js=y.fc,eo=y.gc,de=y.hc,or=y.ic,to=y.jc,ue=y.kc,Li=y.lc,le=y.mc,ro=y.nc,qi=y.oc,io=y.pc,no=y.qc,ao=y.rc,Wi=y.sc,so=y.tc,oo=y.uc,uo=y.vc,lo=y.wc,po=y.xc,co=y.yc,ho=y.zc,fo=y.Ac,mo=y.Bc,go=y.Cc,yo=y.Dc,_o=y.Ec,bo=y.Fc,wo=y.Gc,$o=y.Hc,vo=y.Ic,xo=y.Jc,So=y.Kc,ko=y.Lc,To=y.Mc,Io=y.Nc,Eo=y.Pc,Co=y.Qc,zo=y.$c,Ao=y.ad,Mo=y.fd,Oo=y.jd,Ro=y.kd,No=y.ld,Bo=y.md,Do=y.nd,Po=y.od,Uo=y.pd,Lo=y.qd,qo=y.vd,Wo=y.Td,Go=y.Ud,Fo=y.Vd,Vo=y.Wd,g=T,ht}var h,b=be();return t.instantiateWasm?new Promise(y=>{t.instantiateWasm(b,(T,E)=>{y(u(T,E))})}):n?u(new WebAssembly.Instance(g,be()),g):(Z??=t.locateFile?t.locateFile?t.locateFile("ort-wasm-simd-threaded.jsep.wasm",c):c+"ort-wasm-simd-threaded.jsep.wasm":new URL("/SACHIZU-LAB1/assets/ort-wasm-simd-threaded.jsep-DC5y_g6C.wasm",import.meta.url).href,h=await(async function(y){var T=Z;if(!f&&!z(T))try{var E=fetch(T,{credentials:"same-origin"});return await WebAssembly.instantiateStreaming(E,y)}catch(A){I(`wasm streaming compile failed: ${A}`),I("falling back to ArrayBuffer instantiation")}return(async function(A,D){try{var K=await(async function(J){if(!f)try{var oe=await o(J);return new Uint8Array(oe)}catch{}if(J==Z&&f)J=new Uint8Array(f);else{if(!l)throw"both async and sync fetching of the wasm failed";J=l(J)}return J})(A);return await WebAssembly.instantiate(K,D)}catch(J){I(`failed to asynchronously prepare wasm: ${J}`),X(J)}})(T,y)})(b),u(h.instance,h.module))}class F{name="ExitStatus";constructor(h){this.message=`Program terminated with exit(${h})`,this.status=h}}var pe=u=>{u.terminate(),u.onmessage=()=>{}},fe=[],Se=0,De=null,Ir=u=>{yt.length==0&&(ns(),is(yt[0]));var h=yt.pop();if(!h)return 6;nr.push(h),It[u.Rc]=h,h.Rc=u.Rc;var b={Sc:"run",Md:u.Ld,bd:u.bd,Rc:u.Rc};return h.postMessage(b,u.rd),0},at=0,Te=(u,h,...b)=>{var y,T=16*b.length,E=le(),A=Li(T),D=A>>>3;for(y of b)typeof y=="bigint"?((k(),P)[D++>>>0]=1n,(k(),P)[D++>>>0]=y):((k(),P)[D++>>>0]=0n,(k(),Y)[D++>>>0]=y);return u=Ys(u,0,T,A,h),ue(E),u};function vi(u){if(n)return Te(0,1,u);if(m=u,!(0<at)){for(var h of nr)pe(h);for(h of yt)pe(h);yt=[],nr=[],It={},C=!0}d(0,new F(u))}function Ja(u){if(n)return Te(1,0,u);xi(u)}var xi=u=>{if(m=u,n)throw Ja(u),"unwind";vi(u)},yt=[],nr=[],es=[],It={},ts=u=>{var h=u.Rc;delete It[h],yt.push(u),nr.splice(nr.indexOf(u),1),u.Rc=0,Qs(h)};function rs(){es.forEach(u=>u())}var is=u=>new Promise(h=>{u.onmessage=T=>{var E=T.data;if(T=E.Sc,E.Zc&&E.Zc!=Pr()){var A=It[E.Zc];A?A.postMessage(E,E.rd):I(`Internal error! Worker sent a message "${T}" to target pthread ${E.Zc}, but that thread no longer exists!`)}else T==="checkMailbox"?Mr():T==="spawnThread"?Ir(E):T==="cleanupThread"?Ar(()=>{ts(It[E.Nd])}):T==="loaded"?(u.loaded=!0,h(u)):E.target==="setimmediate"?u.postMessage(E):T==="uncaughtException"?u.onerror(E.error):T==="callHandler"?t[E.wd](...E.args):T&&I(`worker sent an unknown command ${T}`)},u.onerror=T=>{throw I(`worker sent an error! ${T.filename}:${T.lineno}: ${T.message}`),T};var b,y=[];for(b of[])t.propertyIsEnumerable(b)&&y.push(b);u.postMessage({Sc:"load",xd:y,Od:_t,Pd:g})});function ns(){var u=new Worker((()=>{let h=URL;return import.meta.url>"file:"&&import.meta.url<"file;"?new h("ort.bundle.min.mjs",import.meta.url):new URL(import.meta.url)})(),{type:"module",workerData:"em-pthread",name:"em-pthread"});yt.push(u)}var _t,ig=(u,h)=>{at=0,u=Wi(u,h),0<at?m=u:Ui(u)},Er=[],Cr=0;function ng(u){var h=new Si(u>>>=0);return(k(),L)[h.Tc+12>>>0]==0&&(as(h,!0),Cr--),ss(h,!1),Er.push(h),no(u)}var jt=0,ag=()=>{de(0,0);var u=Er.pop();ro(u.cd),jt=0};function as(u,h){h=h?1:0,(k(),L)[u.Tc+12>>>0]=h}function ss(u,h){h=h?1:0,(k(),L)[u.Tc+13>>>0]=h}class Si{constructor(h){this.cd=h,this.Tc=h-24}}var ki=u=>{var h=jt;if(!h)return or(0),0;var b=new Si(h);(k(),N)[b.Tc+16>>>2>>>0]=h;var y=(k(),N)[b.Tc+4>>>2>>>0];if(!y)return or(0),h;for(var T of u){if(T===0||T===y)break;if(io(T,y,b.Tc+16))return or(T),h}return or(y),h};function sg(){return ki([])}function og(u){return ki([u>>>0])}function ug(u,h,b,y){return ki([u>>>0,h>>>0,b>>>0,y>>>0])}var lg=()=>{var u=Er.pop();u||X("no exception to throw");var h=u.cd;throw(k(),L)[u.Tc+13>>>0]==0&&(Er.push(u),ss(u,!0),as(u,!1),Cr++),qi(h),jt=h};function dg(u,h,b){var y=new Si(u>>>=0);throw h>>>=0,b>>>=0,(k(),N)[y.Tc+16>>>2>>>0]=0,(k(),N)[y.Tc+4>>>2>>>0]=h,(k(),N)[y.Tc+8>>>2>>>0]=b,qi(u),Cr++,jt=u}var pg=()=>Cr;function os(u,h,b,y){return n?Te(2,1,u,h,b,y):us(u,h,b,y)}function us(u,h,b,y){if(u>>>=0,h>>>=0,b>>>=0,y>>>=0,!globalThis.SharedArrayBuffer)return 6;var T=[];return n&&T.length===0?os(u,h,b,y):(u={Ld:b,Rc:u,bd:y,rd:T},n?(u.Sc="spawnThread",postMessage(u,T),0):Ir(u))}function cg(u){throw jt||=u>>>0,jt}var ls=globalThis.TextDecoder&&new TextDecoder,ds=(u,h,b,y)=>{if(b=h+b,y)return b;for(;u[h]&&!(h>=b);)++h;return h},ps=(u,h=0,b,y)=>{if(16<(b=ds(u,h>>>=0,b,y))-h&&u.buffer&&ls)return ls.decode(u.buffer instanceof ArrayBuffer?u.subarray(h,b):u.slice(h,b));for(y="";h<b;){var T=u[h++];if(128&T){var E=63&u[h++];if((224&T)==192)y+=String.fromCharCode((31&T)<<6|E);else{var A=63&u[h++];65536>(T=(240&T)==224?(15&T)<<12|E<<6|A:(7&T)<<18|E<<12|A<<6|63&u[h++])?y+=String.fromCharCode(T):(T-=65536,y+=String.fromCharCode(55296|T>>10,56320|1023&T))}}else y+=String.fromCharCode(T)}return y},Me=(u,h,b)=>(u>>>=0)?ps((k(),j),u,h,b):"";function cs(u,h,b){return n?Te(3,1,u,h,b):0}function hs(u,h){if(n)return Te(4,1,u,h)}function fs(u,h){if(n)return Te(5,1,u,h)}function ms(u,h,b){if(n)return Te(6,1,u,h,b)}function gs(u,h,b){return n?Te(7,1,u,h,b):0}function ys(u,h){if(n)return Te(8,1,u,h)}function _s(u,h,b){if(n)return Te(9,1,u,h,b)}function bs(u,h,b,y){if(n)return Te(10,1,u,h,b,y)}function ws(u,h,b,y){if(n)return Te(11,1,u,h,b,y)}function $s(u,h,b,y){if(n)return Te(12,1,u,h,b,y)}function vs(u){if(n)return Te(13,1,u)}function xs(u,h){if(n)return Te(14,1,u,h)}function Ss(u,h,b){if(n)return Te(15,1,u,h,b)}var hg=()=>X(""),st=u=>{u>>>=0;for(var h="";;){var b=(k(),j)[u++>>>0];if(!b)return h;h+=String.fromCharCode(b)}},Ti={},Ii={},Kt=class extends Error{constructor(u){super(u),this.name="BindingError"}};function ct(u,h,b={}){return(function(y,T,E={}){var A=T.name;if(!y)throw new Kt(`type "${A}" must have a positive integer typeid pointer`);if(Ii.hasOwnProperty(y)){if(E.yd)return;throw new Kt(`Cannot register type '${A}' twice`)}Ii[y]=T,Ti.hasOwnProperty(y)&&(T=Ti[y],delete Ti[y],T.forEach(D=>D()))})(u,h,b)}var ks=(u,h,b)=>{switch(h){case 1:return b?y=>(k(),L)[y>>>0]:y=>(k(),j)[y>>>0];case 2:return b?y=>(k(),M)[y>>>1>>>0]:y=>(k(),W)[y>>>1>>>0];case 4:return b?y=>(k(),O)[y>>>2>>>0]:y=>(k(),N)[y>>>2>>>0];case 8:return b?y=>(k(),P)[y>>>3>>>0]:y=>(k(),V)[y>>>3>>>0];default:throw new TypeError(`invalid integer width (${h}): ${u}`)}};function fg(u,h,b,y,T){u>>>=0,b>>>=0,h=st(h>>>0);let E=A=>A;if(y=y===0n){let A=8*b;E=D=>BigInt.asUintN(A,D),T=E(T)}ct(u,{name:h,Oc:E,Vc:(A,D)=>(typeof D=="number"&&(D=BigInt(D)),D),Uc:ks(h,b,!y),Wc:null})}function mg(u,h,b,y){ct(u>>>=0,{name:h=st(h>>>0),Oc:function(T){return!!T},Vc:function(T,E){return E?b:y},Uc:function(T){return this.Oc((k(),j)[T>>>0])},Wc:null})}var Ts=[],Et=[0,1,,1,null,1,!0,1,!1,1];function Ei(u){9<(u>>>=0)&&--Et[u+1]===0&&(Et[u]=void 0,Ts.push(u))}var Ve=u=>{if(!u)throw new Kt(`Cannot use deleted val. handle = ${u}`);return Et[u]},Xe=u=>{switch(u){case void 0:return 2;case null:return 4;case!0:return 6;case!1:return 8;default:let h=Ts.pop()||Et.length;return Et[h]=u,Et[h+1]=1,h}};function Ci(u){return this.Oc((k(),N)[u>>>2>>>0])}var gg={name:"emscripten::val",Oc:u=>{var h=Ve(u);return Ei(u),h},Vc:(u,h)=>Xe(h),Uc:Ci,Wc:null};function yg(u){return ct(u>>>0,gg)}var _g=(u,h)=>{switch(h){case 4:return function(b){return this.Oc((k(),G)[b>>>2>>>0])};case 8:return function(b){return this.Oc((k(),Y)[b>>>3>>>0])};default:throw new TypeError(`invalid float width (${h}): ${u}`)}};function bg(u,h,b){b>>>=0,ct(u>>>=0,{name:h=st(h>>>0),Oc:y=>y,Vc:(y,T)=>T,Uc:_g(h,b),Wc:null})}function wg(u,h,b,y,T){u>>>=0,b>>>=0,h=st(h>>>0);let E=D=>D;if(y===0){var A=32-8*b;E=D=>D<<A>>>A,T=E(T)}ct(u,{name:h,Oc:E,Vc:(D,K)=>K,Uc:ks(h,b,y!==0),Wc:null})}function $g(u,h,b){function y(E){var A=(k(),N)[E>>>2>>>0];return E=(k(),N)[E+4>>>2>>>0],new T((k(),L).buffer,E,A)}var T=[Int8Array,Uint8Array,Int16Array,Uint16Array,Int32Array,Uint32Array,Float32Array,Float64Array,BigInt64Array,BigUint64Array][h];ct(u>>>=0,{name:b=st(b>>>0),Oc:y,Uc:y},{yd:!0})}var bt=(u,h,b)=>{var y=(k(),j);if(h>>>=0,0<b){var T=h;b=h+b-1;for(var E=0;E<u.length;++E){var A=u.codePointAt(E);if(127>=A){if(h>=b)break;y[h++>>>0]=A}else if(2047>=A){if(h+1>=b)break;y[h++>>>0]=192|A>>6,y[h++>>>0]=128|63&A}else if(65535>=A){if(h+2>=b)break;y[h++>>>0]=224|A>>12,y[h++>>>0]=128|A>>6&63,y[h++>>>0]=128|63&A}else{if(h+3>=b)break;y[h++>>>0]=240|A>>18,y[h++>>>0]=128|A>>12&63,y[h++>>>0]=128|A>>6&63,y[h++>>>0]=128|63&A,E++}}y[h>>>0]=0,u=h-T}else u=0;return u},zr=u=>{for(var h=0,b=0;b<u.length;++b){var y=u.charCodeAt(b);127>=y?h++:2047>=y?h+=2:55296<=y&&57343>=y?(h+=4,++b):h+=3}return h};function vg(u,h){ct(u>>>=0,{name:h=st(h>>>0),Oc(b){var y=(k(),N)[b>>>2>>>0];return y=Me(b+4,y,!0),ut(b),y},Vc(b,y){y instanceof ArrayBuffer&&(y=new Uint8Array(y));var T=typeof y=="string";if(!(T||ArrayBuffer.isView(y)&&y.BYTES_PER_ELEMENT==1))throw new Kt("Cannot pass non-string to std::string");var E=T?zr(y):y.length,A=sr(4+E+1),D=A+4;return(k(),N)[A>>>2>>>0]=E,T?bt(y,D,E+1):(k(),j).set(y,D>>>0),b!==null&&b.push(ut,A),A},Uc:Ci,Wc(b){ut(b)}})}var Is=globalThis.TextDecoder?new TextDecoder("utf-16le"):void 0,xg=(u,h,b)=>{if(u>>>=1,16<(h=ds((k(),W),u,h/2,b))-u&&Is)return Is.decode((k(),W).slice(u,h));for(b="";u<h;++u){var y=(k(),W)[u>>>0];b+=String.fromCharCode(y)}return b},Sg=(u,h,b)=>{if(b??=2147483647,2>b)return 0;var y=h;b=(b-=2)<2*u.length?b/2:u.length;for(var T=0;T<b;++T){var E=u.charCodeAt(T);(k(),M)[h>>>1>>>0]=E,h+=2}return(k(),M)[h>>>1>>>0]=0,h-y},kg=u=>2*u.length,Tg=(u,h,b)=>{var y="";u>>>=2;for(var T=0;!(T>=h/4);T++){var E=(k(),N)[u+T>>>0];if(!E&&!b)break;y+=String.fromCodePoint(E)}return y},Ig=(u,h,b)=>{if(h>>>=0,b??=2147483647,4>b)return 0;var y=h;b=y+b-4;for(var T=0;T<u.length;++T){var E=u.codePointAt(T);if(65535<E&&T++,(k(),O)[h>>>2>>>0]=E,(h+=4)+4>b)break}return(k(),O)[h>>>2>>>0]=0,h-y},Eg=u=>{for(var h=0,b=0;b<u.length;++b)65535<u.codePointAt(b)&&b++,h+=4;return h};function Cg(u,h,b){if(u>>>=0,h>>>=0,b=st(b>>>=0),h===2)var y=xg,T=Sg,E=kg;else y=Tg,T=Ig,E=Eg;ct(u,{name:b,Oc:A=>{var D=(k(),N)[A>>>2>>>0];return D=y(A+4,D*h,!0),ut(A),D},Vc:(A,D)=>{if(typeof D!="string")throw new Kt(`Cannot pass non-string to C++ string type ${b}`);var K=E(D),J=sr(4+K+h);return(k(),N)[J>>>2>>>0]=K/h,T(D,J+4,K+h),A!==null&&A.push(ut,J),J},Uc:Ci,Wc(A){ut(A)}})}function zg(u,h){ct(u>>>=0,{zd:!0,name:h=st(h>>>0),Oc:()=>{},Vc:()=>{}})}function Ag(u){Pi(u>>>0,!i,1,!r,131072,!1),rs()}var Ar=u=>{if(!C)try{if(u(),!(0<at))try{n?Pr()&&Ui(m):xi(m)}catch(h){h instanceof F||h=="unwind"||d(0,h)}}catch(h){h instanceof F||h=="unwind"||d(0,h)}},Mg=!Atomics.waitAsync||globalThis.navigator?.userAgent&&91>Number((navigator.userAgent.match(/Chrom(e|ium)\/([0-9]+)\./)||[])[2]);function zi(u){u>>>=0,Mg||(Atomics.waitAsync((k(),O),u>>>2,u).value.then(Mr),u+=128,Atomics.store((k(),O),u>>>2,1))}var Mr=()=>Ar(()=>{var u=Pr();u&&(zi(u),eo())});function Og(u,h){(u>>>=0)==h>>>0?setTimeout(Mr):n?postMessage({Zc:u,Sc:"checkMailbox"}):(u=It[u])&&u.postMessage({Sc:"checkMailbox"})}var Ai=[];function Rg(u,h,b,y,T){for(h>>>=0,T>>>=0,Ai.length=0,b=T>>>3,y=T+y>>>3;b<y;){var E;E=(k(),P)[b++>>>0]?(k(),P)[b++>>>0]:(k(),Y)[b++>>>0],Ai.push(E)}return(h?Gi[h]:S0[u])(...Ai)}var Ng=()=>{at=0};function Bg(u){u>>>=0,n?postMessage({Sc:"cleanupThread",Nd:u}):ts(It[u])}function Dg(u){}var Or=u=>{try{u()}catch(h){X(h)}};function Pg(u){var h=(...b)=>{Rr.push(u);try{return u(...b)}finally{C||(Rr.pop(),ot&&wt===1&&Rr.length===0&&(wt=0,at+=1,Or(Go),typeof Fibers<"u"&&Fibers.Zd()))}};return zs.set(u,h),h}var wt=0,ot=null,Es=0,Rr=[],Mi=new Map,Cs=new Map,zs=new Map,Ug=0,Oi=null,Lg=[],As=u=>(function(h){if(!C){if(wt===0){var b=!1,y=!1;h((T=0)=>{if(!C&&(Es=T,b=!0,y)){wt=2,Or(()=>Fo(ot)),typeof MainLoop<"u"&&MainLoop.ud&&MainLoop.resume(),T=!1;try{var E=(function(){var K=(k(),O)[ot+8>>>2>>>0];return K=Cs.get(K),K=zs.get(K),--at,K()})()}catch(K){E=K,T=!0}var A=!1;if(!ot){var D=Oi;D&&(Oi=null,(T?D.reject:D.resolve)(E),A=!0)}if(T&&!A)throw E}}),y=!0,b||(wt=1,ot=(function(){var T=sr(65548),E=T+12;if((k(),N)[T>>>2>>>0]=E,(k(),N)[T+4>>>2>>>0]=E+65536,E=Rr[0],!Mi.has(E)){var A=Ug++;Mi.set(E,A),Cs.set(A,E)}return E=Mi.get(E),(k(),O)[T+8>>>2>>>0]=E,T})(),typeof MainLoop<"u"&&MainLoop.ud&&MainLoop.pause(),Or(()=>Wo(ot)))}else wt===2?(wt=0,Or(Vo),ut(ot),ot=null,Lg.forEach(Ar)):X(`invalid state: ${wt}`);return Es}})(h=>{u().then(h)});function qg(u){return u>>>=0,As(async()=>{var h=await Ve(u);return Xe(h)})}var Ri=[],Wg=u=>{var h=Ri.length;return Ri.push(u),h},Gg=(u,h)=>{for(var b=Array(u),y=0;y<u;++y){var T=y,E=(k(),N)[h+4*y>>>2>>>0],A=Ii[E];if(A===void 0)throw u=`parameter ${y}`,E=Ks(E),h=st(E),ut(E),new Kt(`${u} has unknown type ${h}`);b[T]=A}return b},Fg=(u,h,b)=>{var y=[];return u=u(y,b),y.length&&((k(),N)[h>>>2>>>0]=Xe(y)),u},Vg={},Nr=u=>{var h=Vg[u];return h===void 0?st(u):h};function Hg(u,h,b){var[y,...T]=Gg(u,h>>>0);h=y.Vc.bind(y);var E=T.map(K=>K.Uc.bind(K));u--;var A={toValue:Ve};switch(u=E.map((K,J)=>{var oe=`argFromPtr${J}`;return A[oe]=K,`${oe}(args${J?"+"+8*J:""})`}),b){case 0:var D="toValue(handle)";break;case 2:D="new (toValue(handle))";break;case 3:D="";break;case 1:A.getStringOrSymbol=Nr,D="toValue(handle)[getStringOrSymbol(methodName)]"}return D+=`(${u})`,y.zd||(A.toReturnWire=h,A.emval_returnValue=Fg,D=`return emval_returnValue(toReturnWire, destructorsRef, ${D})`),D=`return function (handle, methodName, destructorsRef, args) {
  ${D}
  }`,b=new Function(Object.keys(A),D)(...Object.values(A)),D=`methodCaller<(${T.map(K=>K.name)}) => ${y.name}>`,Wg(Object.defineProperty(b,"name",{value:D}))}function jg(u,h){return h>>>=0,(u=Ve(u>>>0))==Ve(h)}function Kg(u){return(u>>>=0)?(u=Nr(u),Xe(globalThis[u])):Xe(globalThis)}function Xg(u){return u=Nr(u>>>0),Xe(t[u])}function Zg(u,h){return h>>>=0,u=Ve(u>>>0),h=Ve(h),Xe(u[h])}function Yg(u){9<(u>>>=0)&&(Et[u+1]+=1)}function Ms(u,h,b,y,T){return Ri[u>>>0](h>>>0,b>>>0,y>>>0,T>>>0)}function Qg(u,h,b,y,T){return Ms(u>>>0,h>>>0,b>>>0,y>>>0,T>>>0)}function Jg(){return Xe([])}function e0(u){u=Ve(u>>>0);for(var h=Array(u.length),b=0;b<u.length;b++)h[b]=u[b];return Xe(h)}function t0(u){return Xe(Nr(u>>>0))}function r0(){return Xe({})}function i0(u){for(var h=Ve(u>>>=0);h.length;){var b=h.pop();h.pop()(b)}Ei(u)}function n0(u,h,b){h>>>=0,b>>>=0,u=Ve(u>>>0),h=Ve(h),b=Ve(b),u[h]=b}function a0(u,h){u=-9007199254740992>u||9007199254740992<u?NaN:Number(u),h>>>=0,u=new Date(1e3*u),(k(),O)[h>>>2>>>0]=u.getUTCSeconds(),(k(),O)[h+4>>>2>>>0]=u.getUTCMinutes(),(k(),O)[h+8>>>2>>>0]=u.getUTCHours(),(k(),O)[h+12>>>2>>>0]=u.getUTCDate(),(k(),O)[h+16>>>2>>>0]=u.getUTCMonth(),(k(),O)[h+20>>>2>>>0]=u.getUTCFullYear()-1900,(k(),O)[h+24>>>2>>>0]=u.getUTCDay(),u=(u.getTime()-Date.UTC(u.getUTCFullYear(),0,1,0,0,0,0))/864e5|0,(k(),O)[h+28>>>2>>>0]=u}var Os=u=>u%4==0&&(u%100!=0||u%400==0),Rs=[0,31,60,91,121,152,182,213,244,274,305,335],Ns=[0,31,59,90,120,151,181,212,243,273,304,334];function s0(u,h){u=-9007199254740992>u||9007199254740992<u?NaN:Number(u),h>>>=0,u=new Date(1e3*u),(k(),O)[h>>>2>>>0]=u.getSeconds(),(k(),O)[h+4>>>2>>>0]=u.getMinutes(),(k(),O)[h+8>>>2>>>0]=u.getHours(),(k(),O)[h+12>>>2>>>0]=u.getDate(),(k(),O)[h+16>>>2>>>0]=u.getMonth(),(k(),O)[h+20>>>2>>>0]=u.getFullYear()-1900,(k(),O)[h+24>>>2>>>0]=u.getDay();var b=(Os(u.getFullYear())?Rs:Ns)[u.getMonth()]+u.getDate()-1|0;(k(),O)[h+28>>>2>>>0]=b,(k(),O)[h+36>>>2>>>0]=-60*u.getTimezoneOffset(),b=new Date(u.getFullYear(),6,1).getTimezoneOffset();var y=new Date(u.getFullYear(),0,1).getTimezoneOffset();u=0|(b!=y&&u.getTimezoneOffset()==Math.min(y,b)),(k(),O)[h+32>>>2>>>0]=u}function o0(u){u>>>=0;var h=new Date((k(),O)[u+20>>>2>>>0]+1900,(k(),O)[u+16>>>2>>>0],(k(),O)[u+12>>>2>>>0],(k(),O)[u+8>>>2>>>0],(k(),O)[u+4>>>2>>>0],(k(),O)[u>>>2>>>0],0),b=(k(),O)[u+32>>>2>>>0],y=h.getTimezoneOffset(),T=new Date(h.getFullYear(),6,1).getTimezoneOffset(),E=new Date(h.getFullYear(),0,1).getTimezoneOffset(),A=Math.min(E,T);return 0>b?(k(),O)[u+32>>>2>>>0]=+(T!=E&&A==y):0<b!=(A==y)&&(T=Math.max(E,T),h.setTime(h.getTime()+6e4*((0<b?A:T)-y))),(k(),O)[u+24>>>2>>>0]=h.getDay(),b=(Os(h.getFullYear())?Rs:Ns)[h.getMonth()]+h.getDate()-1|0,(k(),O)[u+28>>>2>>>0]=b,(k(),O)[u>>>2>>>0]=h.getSeconds(),(k(),O)[u+4>>>2>>>0]=h.getMinutes(),(k(),O)[u+8>>>2>>>0]=h.getHours(),(k(),O)[u+12>>>2>>>0]=h.getDate(),(k(),O)[u+16>>>2>>>0]=h.getMonth(),(k(),O)[u+20>>>2>>>0]=h.getYear(),u=h.getTime(),BigInt(isNaN(u)?-1:u/1e3)}function Bs(u,h,b,y,T,E,A){return n?Te(16,1,u,h,b,y,T,E,A):-52}function Ds(u,h,b,y,T,E){if(n)return Te(17,1,u,h,b,y,T,E)}var ar={},u0=()=>performance.timeOrigin+performance.now();function Ps(u,h){if(n)return Te(18,1,u,h);if(ar[u]&&(clearTimeout(ar[u].id),delete ar[u]),!h)return 0;var b=setTimeout(()=>{delete ar[u],Ar(()=>Js(u,performance.timeOrigin+performance.now()))},h);return ar[u]={id:b,Yd:h},0}function l0(u,h,b,y){u>>>=0,h>>>=0,b>>>=0,y>>>=0;var T=new Date().getFullYear(),E=new Date(T,0,1).getTimezoneOffset();T=new Date(T,6,1).getTimezoneOffset();var A=Math.max(E,T);(k(),N)[u>>>2>>>0]=60*A,(k(),O)[h>>>2>>>0]=+(E!=T),u=(h=D=>{var K=Math.abs(D);return`UTC${0<=D?"-":"+"}${String(Math.floor(K/60)).padStart(2,"0")}${String(K%60).padStart(2,"0")}`})(E),h=h(T),T<E?(bt(u,b,17),bt(h,y,17)):(bt(u,y,17),bt(h,b,17))}var d0=()=>Date.now();function p0(u,h,b){return b>>>=0,0<=u&&3>=u?(u===0?u=Date.now():u=performance.timeOrigin+performance.now(),u=Math.round(1e6*u),(k(),P)[b>>>3>>>0]=BigInt(u),0):28}var Ni=[],Us=(u,h)=>{Ni.length=0;for(var b;b=(k(),j)[u++>>>0];){var y=b!=105;h+=(y&=b!=112)&&h%8?4:0,Ni.push(b==112?(k(),N)[h>>>2>>>0]:b==106?(k(),P)[h>>>3>>>0]:b==105?(k(),O)[h>>>2>>>0]:(k(),Y)[h>>>3>>>0]),h+=y?8:4}return Ni};function c0(u,h,b){return u>>>=0,h=Us(h>>>0,b>>>0),Gi[u](...h)}function h0(u,h,b){return u>>>=0,h=Us(h>>>0,b>>>0),Gi[u](...h)}var f0=()=>{};function m0(u,h){return I(Me(u>>>0,h>>>0))}var g0=()=>{throw at+=1,"unwind"};function y0(){return 4294901760}var _0=()=>navigator.hardwareConcurrency,Ct={},Br=u=>{var h;return(h=/\bwasm-function\[\d+\]:(0x[0-9a-f]+)/.exec(u))?+h[1]:(h=/:(\d+):\d+(?:\)|$)/.exec(u))?2147483648|+h[1]:0},Ls=u=>{for(var h of u)(u=Br(h))&&(Ct[u]=h)};function b0(){var u=Error().stack.toString().split(`
`);return u[0]=="Error"&&u.shift(),Ls(u),Ct.gd=Br(u[3]),Ct.Jd=u,Ct.gd}function Dr(u){if(!(u=Ct[u>>>0]))return 0;var h;if(h=/^\s+at .*\.wasm\.(.*) \(.*\)$/.exec(u))u=h[1];else if(h=/^\s+at (.*) \(.*\)$/.exec(u))u=h[1];else{if(!(h=/^(.+?)@/.exec(u)))return 0;u=h[1]}ut(Dr.hd??0),h=zr(u)+1;var b=sr(h);return b&&bt(u,b,h),Dr.hd=b,Dr.hd}function w0(u){u>>>=0;var h=(k(),j).length;if(u<=h||4294901760<u)return!1;for(var b=1;4>=b;b*=2){var y=h*(1+.2/b);y=Math.min(y,u+100663296);e:{y=(Math.min(4294901760,65536*Math.ceil(Math.max(u,y)/65536))-_t.buffer.byteLength+65535)/65536|0;try{_t.grow(y),ee();var T=1;break e}catch{}T=void 0}if(T)return!0}return!1}function $0(u,h,b){if(u>>>=0,h>>>=0,Ct.gd==u)var y=Ct.Jd;else(y=Error().stack.toString().split(`
`))[0]=="Error"&&y.shift(),Ls(y);for(var T=3;y[T]&&Br(y[T])!=u;)++T;for(u=0;u<b&&y[u+T];++u)(k(),O)[h+4*u>>>2>>>0]=Br(y[u+T]);return u}var Bi,Di={},qs=()=>{if(!Bi){var u,h={USER:"web_user",LOGNAME:"web_user",PATH:"/",PWD:"/",HOME:"/home/web_user",LANG:(globalThis.navigator?.language??"C").replace("-","_")+".UTF-8",_:"./this.program"};for(u in Di)Di[u]===void 0?delete h[u]:h[u]=Di[u];var b=[];for(u in h)b.push(`${u}=${h[u]}`);Bi=b}return Bi};function Ws(u,h){if(n)return Te(19,1,u,h);u>>>=0,h>>>=0;var b,y=0,T=0;for(b of qs()){var E=h+y;(k(),N)[u+T>>>2>>>0]=E,y+=bt(b,E,1/0)+1,T+=4}return 0}function Gs(u,h){if(n)return Te(20,1,u,h);u>>>=0,h>>>=0;var b=qs();for(var y of((k(),N)[u>>>2>>>0]=b.length,u=0,b))u+=zr(y)+1;return(k(),N)[h>>>2>>>0]=u,0}function Fs(u){return n?Te(21,1,u):52}function Vs(u,h,b,y){return n?Te(22,1,u,h,b,y):52}function Hs(u,h,b,y){return n?Te(23,1,u,h,b,y):70}var v0=[null,[],[]];function js(u,h,b,y){if(n)return Te(24,1,u,h,b,y);h>>>=0,b>>>=0,y>>>=0;for(var T=0,E=0;E<b;E++){var A=(k(),N)[h>>>2>>>0],D=(k(),N)[h+4>>>2>>>0];h+=8;for(var K=0;K<D;K++){var J=u,oe=(k(),j)[A+K>>>0],me=v0[J];oe===0||oe===10?((J===1?x:I)(ps(me)),me.length=0):me.push(oe)}T+=D}return(k(),N)[y>>>2>>>0]=T,0}function x0(u){return u>>>0}n||(function(){for(var u=t.numThreads-1;u--;)ns();fe.push(async()=>{var h=(async function(){if(!n)return Promise.all(yt.map(is))})();Se++,await h,--Se==0&&De&&(h=De,De=null,h())})})(),n||(_t=new WebAssembly.Memory({initial:256,maximum:65536,shared:!0}),ee()),t.wasmBinary&&(f=t.wasmBinary),t.stackSave=()=>le(),t.stackRestore=u=>ue(u),t.stackAlloc=u=>Li(u),t.setValue=function(u,h,b="i8"){switch(b.endsWith("*")&&(b="*"),b){case"i1":case"i8":(k(),L)[u>>>0]=h;break;case"i16":(k(),M)[u>>>1>>>0]=h;break;case"i32":(k(),O)[u>>>2>>>0]=h;break;case"i64":(k(),P)[u>>>3>>>0]=BigInt(h);break;case"float":(k(),G)[u>>>2>>>0]=h;break;case"double":(k(),Y)[u>>>3>>>0]=h;break;case"*":(k(),N)[u>>>2>>>0]=h;break;default:X(`invalid type for setValue: ${b}`)}},t.getValue=function(u,h="i8"){switch(h.endsWith("*")&&(h="*"),h){case"i1":case"i8":return(k(),L)[u>>>0];case"i16":return(k(),M)[u>>>1>>>0];case"i32":return(k(),O)[u>>>2>>>0];case"i64":return(k(),P)[u>>>3>>>0];case"float":return(k(),G)[u>>>2>>>0];case"double":return(k(),Y)[u>>>3>>>0];case"*":return(k(),N)[u>>>2>>>0];default:X(`invalid type for getValue: ${h}`)}},t.UTF8ToString=Me,t.stringToUTF8=bt,t.lengthBytesUTF8=zr;var Ks,Xs,Pr,ut,sr,Pi,Zs,Ys,Qs,Ui,Js,eo,de,or,to,ue,Li,le,ro,qi,io,no,ao,Wi,so,oo,uo,lo,po,co,ho,fo,mo,go,yo,_o,bo,wo,$o,vo,xo,So,ko,To,Io,Eo,Co,zo,Ao,Mo,Oo,Ro,No,Bo,Do,Po,Uo,Lo,qo,Wo,Go,Fo,Vo,ht,S0=[vi,Ja,os,cs,hs,fs,ms,gs,ys,_s,bs,ws,$s,vs,xs,Ss,Bs,Ds,Ps,Ws,Gs,Fs,Vs,Hs,js],Gi={1003524:(u,h,b,y,T)=>{if(t===void 0||!t.Xc)return 1;if((u=Me(Number(u>>>0))).startsWith("./")&&(u=u.substring(2)),!(u=t.Xc.get(u)))return 2;if(h=Number(h>>>0),b=Number(b>>>0),y=Number(y>>>0),h+b>u.byteLength)return 3;try{let E=u.subarray(h,h+b);switch(T){case 0:(k(),j).set(E,y>>>0);break;case 1:t.Qd?t.Qd(y,E):t.Id(y,E);break;default:return 4}return 0}catch{return 4}},1004348:(u,h,b)=>{t.td(u,(k(),j).subarray(h>>>0,h+b>>>0))},1004412:()=>t.Sd(),1004454:u=>{t.sd(u)},1004491:()=>{t.Bd()},1004522:()=>{t.Cd()},1004551:()=>{t.Gd()},1004576:u=>t.Ad(u),1004609:u=>t.Ed(u),1004641:(u,h,b)=>{t.ed(Number(u),Number(h),Number(b),!0)},1004704:(u,h,b)=>{t.ed(Number(u),Number(h),Number(b))},1004761:()=>typeof wasmOffsetConverter<"u",1004818:u=>{t.$b("Abs",u,void 0)},1004869:u=>{t.$b("Neg",u,void 0)},1004920:u=>{t.$b("Floor",u,void 0)},1004973:u=>{t.$b("Ceil",u,void 0)},1005025:u=>{t.$b("Reciprocal",u,void 0)},1005083:u=>{t.$b("Sqrt",u,void 0)},1005135:u=>{t.$b("Exp",u,void 0)},1005186:u=>{t.$b("Erf",u,void 0)},1005237:u=>{t.$b("Sigmoid",u,void 0)},1005292:(u,h,b)=>{t.$b("HardSigmoid",u,{alpha:h,beta:b})},1005371:u=>{t.$b("Log",u,void 0)},1005422:u=>{t.$b("Sin",u,void 0)},1005473:u=>{t.$b("Cos",u,void 0)},1005524:u=>{t.$b("Tan",u,void 0)},1005575:u=>{t.$b("Asin",u,void 0)},1005627:u=>{t.$b("Acos",u,void 0)},1005679:u=>{t.$b("Atan",u,void 0)},1005731:u=>{t.$b("Sinh",u,void 0)},1005783:u=>{t.$b("Cosh",u,void 0)},1005835:u=>{t.$b("Asinh",u,void 0)},1005888:u=>{t.$b("Acosh",u,void 0)},1005941:u=>{t.$b("Atanh",u,void 0)},1005994:u=>{t.$b("Tanh",u,void 0)},1006046:u=>{t.$b("Not",u,void 0)},1006097:(u,h,b)=>{t.$b("Clip",u,{min:h,max:b})},1006166:u=>{t.$b("Clip",u,void 0)},1006218:(u,h)=>{t.$b("Elu",u,{alpha:h})},1006276:u=>{t.$b("Gelu",u,void 0)},1006328:u=>{t.$b("Relu",u,void 0)},1006380:(u,h)=>{t.$b("LeakyRelu",u,{alpha:h})},1006444:(u,h)=>{t.$b("ThresholdedRelu",u,{alpha:h})},1006514:(u,h)=>{t.$b("Cast",u,{to:h})},1006572:u=>{t.$b("Add",u,void 0)},1006623:u=>{t.$b("Sub",u,void 0)},1006674:u=>{t.$b("Mul",u,void 0)},1006725:u=>{t.$b("Div",u,void 0)},1006776:u=>{t.$b("Pow",u,void 0)},1006827:u=>{t.$b("Equal",u,void 0)},1006880:u=>{t.$b("Greater",u,void 0)},1006935:u=>{t.$b("GreaterOrEqual",u,void 0)},1006997:u=>{t.$b("Less",u,void 0)},1007049:u=>{t.$b("LessOrEqual",u,void 0)},1007108:(u,h,b,y,T)=>{t.$b("ReduceMean",u,{keepDims:!!h,noopWithEmptyAxes:!!b,axes:y?Array.from((k(),O).subarray(Number(y)>>>0,Number(T)>>>0)):[]})},1007283:(u,h,b,y,T)=>{t.$b("ReduceMax",u,{keepDims:!!h,noopWithEmptyAxes:!!b,axes:y?Array.from((k(),O).subarray(Number(y)>>>0,Number(T)>>>0)):[]})},1007457:(u,h,b,y,T)=>{t.$b("ReduceMin",u,{keepDims:!!h,noopWithEmptyAxes:!!b,axes:y?Array.from((k(),O).subarray(Number(y)>>>0,Number(T)>>>0)):[]})},1007631:(u,h,b,y,T)=>{t.$b("ReduceProd",u,{keepDims:!!h,noopWithEmptyAxes:!!b,axes:y?Array.from((k(),O).subarray(Number(y)>>>0,Number(T)>>>0)):[]})},1007806:(u,h,b,y,T)=>{t.$b("ReduceSum",u,{keepDims:!!h,noopWithEmptyAxes:!!b,axes:y?Array.from((k(),O).subarray(Number(y)>>>0,Number(T)>>>0)):[]})},1007980:(u,h,b,y,T)=>{t.$b("ReduceL1",u,{keepDims:!!h,noopWithEmptyAxes:!!b,axes:y?Array.from((k(),O).subarray(Number(y)>>>0,Number(T)>>>0)):[]})},1008153:(u,h,b,y,T)=>{t.$b("ReduceL2",u,{keepDims:!!h,noopWithEmptyAxes:!!b,axes:y?Array.from((k(),O).subarray(Number(y)>>>0,Number(T)>>>0)):[]})},1008326:(u,h,b,y,T)=>{t.$b("ReduceLogSum",u,{keepDims:!!h,noopWithEmptyAxes:!!b,axes:y?Array.from((k(),O).subarray(Number(y)>>>0,Number(T)>>>0)):[]})},1008503:(u,h,b,y,T)=>{t.$b("ReduceSumSquare",u,{keepDims:!!h,noopWithEmptyAxes:!!b,axes:y?Array.from((k(),O).subarray(Number(y)>>>0,Number(T)>>>0)):[]})},1008683:(u,h,b,y,T)=>{t.$b("ReduceLogSumExp",u,{keepDims:!!h,noopWithEmptyAxes:!!b,axes:y?Array.from((k(),O).subarray(Number(y)>>>0,Number(T)>>>0)):[]})},1008863:u=>{t.$b("Where",u,void 0)},1008916:(u,h,b)=>{t.$b("Transpose",u,{perm:h?Array.from((k(),O).subarray(Number(h)>>>0,Number(b)>>>0)):[]})},1009040:(u,h,b,y)=>{t.$b("DepthToSpace",u,{blocksize:h,mode:Me(b),format:y?"NHWC":"NCHW"})},1009173:(u,h,b,y)=>{t.$b("DepthToSpace",u,{blocksize:h,mode:Me(b),format:y?"NHWC":"NCHW"})},1009306:(u,h,b,y,T,E,A,D,K,J,oe,me,we,xe,$t)=>{t.$b("ConvTranspose",u,{format:K?"NHWC":"NCHW",autoPad:h,dilations:[b],group:y,kernelShape:[T],pads:[E,A],strides:[D],wIsConst:()=>!!(k(),L)[J>>>0],outputPadding:oe?Array.from((k(),O).subarray(Number(oe)>>>0,Number(me)>>>0)):[],outputShape:we?Array.from((k(),O).subarray(Number(we)>>>0,Number(xe)>>>0)):[],activation:Me($t)})},1009739:(u,h,b,y,T,E,A,D,K,J,oe,me,we,xe)=>{t.$b("ConvTranspose",u,{format:D?"NHWC":"NCHW",autoPad:h,dilations:Array.from((k(),O).subarray(Number(b)>>>0,(Number(b)>>>0)+2>>>0)),group:y,kernelShape:Array.from((k(),O).subarray(Number(T)>>>0,(Number(T)>>>0)+2>>>0)),pads:Array.from((k(),O).subarray(Number(E)>>>0,(Number(E)>>>0)+4>>>0)),strides:Array.from((k(),O).subarray(Number(A)>>>0,(Number(A)>>>0)+2>>>0)),wIsConst:()=>!!(k(),L)[K>>>0],outputPadding:J?Array.from((k(),O).subarray(Number(J)>>>0,Number(oe)>>>0)):[],outputShape:me?Array.from((k(),O).subarray(Number(me)>>>0,Number(we)>>>0)):[],activation:Me(xe)})},1010400:(u,h,b,y,T,E,A,D,K,J,oe,me,we,xe,$t)=>{t.$b("ConvTranspose",u,{format:K?"NHWC":"NCHW",autoPad:h,dilations:[b],group:y,kernelShape:[T],pads:[E,A],strides:[D],wIsConst:()=>!!(k(),L)[J>>>0],outputPadding:oe?Array.from((k(),O).subarray(Number(oe)>>>0,Number(me)>>>0)):[],outputShape:we?Array.from((k(),O).subarray(Number(we)>>>0,Number(xe)>>>0)):[],activation:Me($t)})},1010833:(u,h,b,y,T,E,A,D,K,J,oe,me,we,xe)=>{t.$b("ConvTranspose",u,{format:D?"NHWC":"NCHW",autoPad:h,dilations:Array.from((k(),O).subarray(Number(b)>>>0,(Number(b)>>>0)+2>>>0)),group:y,kernelShape:Array.from((k(),O).subarray(Number(T)>>>0,(Number(T)>>>0)+2>>>0)),pads:Array.from((k(),O).subarray(Number(E)>>>0,(Number(E)>>>0)+4>>>0)),strides:Array.from((k(),O).subarray(Number(A)>>>0,(Number(A)>>>0)+2>>>0)),wIsConst:()=>!!(k(),L)[K>>>0],outputPadding:J?Array.from((k(),O).subarray(Number(J)>>>0,Number(oe)>>>0)):[],outputShape:me?Array.from((k(),O).subarray(Number(me)>>>0,Number(we)>>>0)):[],activation:Me(xe)})},1011494:(u,h)=>{t.$b("GlobalAveragePool",u,{format:h?"NHWC":"NCHW"})},1011585:(u,h,b,y,T,E,A,D,K,J,oe,me,we,xe)=>{t.$b("AveragePool",u,{format:xe?"NHWC":"NCHW",auto_pad:h,ceil_mode:b,count_include_pad:y,storage_order:T,dilations:E?Array.from((k(),O).subarray(Number(E)>>>0,Number(A)>>>0)):[],kernel_shape:D?Array.from((k(),O).subarray(Number(D)>>>0,Number(K)>>>0)):[],pads:J?Array.from((k(),O).subarray(Number(J)>>>0,Number(oe)>>>0)):[],strides:me?Array.from((k(),O).subarray(Number(me)>>>0,Number(we)>>>0)):[]})},1012064:(u,h)=>{t.$b("GlobalAveragePool",u,{format:h?"NHWC":"NCHW"})},1012155:(u,h,b,y,T,E,A,D,K,J,oe,me,we,xe)=>{t.$b("AveragePool",u,{format:xe?"NHWC":"NCHW",auto_pad:h,ceil_mode:b,count_include_pad:y,storage_order:T,dilations:E?Array.from((k(),O).subarray(Number(E)>>>0,Number(A)>>>0)):[],kernel_shape:D?Array.from((k(),O).subarray(Number(D)>>>0,Number(K)>>>0)):[],pads:J?Array.from((k(),O).subarray(Number(J)>>>0,Number(oe)>>>0)):[],strides:me?Array.from((k(),O).subarray(Number(me)>>>0,Number(we)>>>0)):[]})},1012634:(u,h)=>{t.$b("GlobalMaxPool",u,{format:h?"NHWC":"NCHW"})},1012721:(u,h,b,y,T,E,A,D,K,J,oe,me,we,xe)=>{t.$b("MaxPool",u,{format:xe?"NHWC":"NCHW",auto_pad:h,ceil_mode:b,count_include_pad:y,storage_order:T,dilations:E?Array.from((k(),O).subarray(Number(E)>>>0,Number(A)>>>0)):[],kernel_shape:D?Array.from((k(),O).subarray(Number(D)>>>0,Number(K)>>>0)):[],pads:J?Array.from((k(),O).subarray(Number(J)>>>0,Number(oe)>>>0)):[],strides:me?Array.from((k(),O).subarray(Number(me)>>>0,Number(we)>>>0)):[]})},1013196:(u,h)=>{t.$b("GlobalMaxPool",u,{format:h?"NHWC":"NCHW"})},1013283:(u,h,b,y,T,E,A,D,K,J,oe,me,we,xe)=>{t.$b("MaxPool",u,{format:xe?"NHWC":"NCHW",auto_pad:h,ceil_mode:b,count_include_pad:y,storage_order:T,dilations:E?Array.from((k(),O).subarray(Number(E)>>>0,Number(A)>>>0)):[],kernel_shape:D?Array.from((k(),O).subarray(Number(D)>>>0,Number(K)>>>0)):[],pads:J?Array.from((k(),O).subarray(Number(J)>>>0,Number(oe)>>>0)):[],strides:me?Array.from((k(),O).subarray(Number(me)>>>0,Number(we)>>>0)):[]})},1013758:(u,h,b,y,T)=>{t.$b("Gemm",u,{alpha:h,beta:b,transA:y,transB:T})},1013862:u=>{t.$b("MatMul",u,void 0)},1013916:(u,h,b,y)=>{t.$b("ArgMax",u,{keepDims:!!h,selectLastIndex:!!b,axis:y})},1014024:(u,h,b,y)=>{t.$b("ArgMin",u,{keepDims:!!h,selectLastIndex:!!b,axis:y})},1014132:(u,h)=>{t.$b("Softmax",u,{axis:h})},1014195:(u,h)=>{t.$b("Concat",u,{axis:h})},1014255:(u,h,b,y,T)=>{t.$b("Split",u,{axis:h,numOutputs:b,splitSizes:y?Array.from((k(),O).subarray(Number(y)>>>0,Number(T)>>>0)):[]})},1014411:u=>{t.$b("Expand",u,void 0)},1014465:(u,h)=>{t.$b("Gather",u,{axis:Number(h)})},1014536:(u,h)=>{t.$b("GatherElements",u,{axis:Number(h)})},1014615:(u,h)=>{t.$b("GatherND",u,{batch_dims:Number(h)})},1014694:(u,h,b,y,T,E,A,D,K,J,oe)=>{t.$b("Resize",u,{antialias:h,axes:b?Array.from((k(),O).subarray(Number(b)>>>0,Number(y)>>>0)):[],coordinateTransformMode:Me(T),cubicCoeffA:E,excludeOutside:A,extrapolationValue:D,keepAspectRatioPolicy:Me(K),mode:Me(J),nearestMode:Me(oe)})},1015056:(u,h,b,y,T,E,A)=>{t.$b("Slice",u,{starts:h?Array.from((k(),O).subarray(Number(h)>>>0,Number(b)>>>0)):[],ends:y?Array.from((k(),O).subarray(Number(y)>>>0,Number(T)>>>0)):[],axes:E?Array.from((k(),O).subarray(Number(E)>>>0,Number(A)>>>0)):[]})},1015320:u=>{t.$b("Tile",u,void 0)},1015372:(u,h,b)=>{t.$b("InstanceNormalization",u,{epsilon:h,format:b?"NHWC":"NCHW"})},1015486:(u,h,b)=>{t.$b("InstanceNormalization",u,{epsilon:h,format:b?"NHWC":"NCHW"})},1015600:u=>{t.$b("Range",u,void 0)},1015653:(u,h)=>{t.$b("Einsum",u,{equation:Me(h)})},1015734:(u,h,b,y,T)=>{t.$b("Pad",u,{mode:h,value:b,pads:y?Array.from((k(),O).subarray(Number(y)>>>0,Number(T)>>>0)):[]})},1015877:(u,h,b,y,T,E)=>{t.$b("BatchNormalization",u,{epsilon:h,momentum:b,spatial:!!T,trainingMode:!!y,format:E?"NHWC":"NCHW"})},1016046:(u,h,b,y,T,E)=>{t.$b("BatchNormalization",u,{epsilon:h,momentum:b,spatial:!!T,trainingMode:!!y,format:E?"NHWC":"NCHW"})},1016215:(u,h,b)=>{t.$b("CumSum",u,{exclusive:Number(h),reverse:Number(b)})},1016312:(u,h,b)=>{t.$b("DequantizeLinear",u,{axis:h,blockSize:b})},1016402:(u,h,b,y,T)=>{t.$b("GridSample",u,{align_corners:h,mode:Me(b),padding_mode:Me(y),format:T?"NHWC":"NCHW"})},1016572:(u,h,b,y,T)=>{t.$b("GridSample",u,{align_corners:h,mode:Me(b),padding_mode:Me(y),format:T?"NHWC":"NCHW"})},1016742:(u,h)=>{t.$b("ScatterND",u,{reduction:Me(h)})},1016827:(u,h,b,y,T,E,A,D,K)=>{t.$b("Attention",u,{numHeads:h,isUnidirectional:b,maskFilterValue:y,scale:T,doRotary:E,qkvHiddenSizes:A?Array.from((k(),O).subarray(Number(D)>>>0,Number(D)+A>>>0)):[],pastPresentShareBuffer:!!K})},1017099:u=>{t.$b("BiasAdd",u,void 0)},1017154:u=>{t.$b("BiasSplitGelu",u,void 0)},1017215:u=>{t.$b("FastGelu",u,void 0)},1017271:(u,h,b,y,T,E,A,D,K,J,oe,me,we,xe,$t,Fi)=>{t.$b("Conv",u,{format:me?"NHWC":"NCHW",auto_pad:h,dilations:b?Array.from((k(),O).subarray(Number(b)>>>0,Number(y)>>>0)):[],group:T,kernel_shape:E?Array.from((k(),O).subarray(Number(E)>>>0,Number(A)>>>0)):[],pads:D?Array.from((k(),O).subarray(Number(D)>>>0,Number(K)>>>0)):[],strides:J?Array.from((k(),O).subarray(Number(J)>>>0,Number(oe)>>>0)):[],w_is_const:()=>!!(k(),L)[Number(we)>>>0],activation:Me(xe),activation_params:$t?Array.from((k(),G).subarray(Number($t)>>>0,Number(Fi)>>>0)):[]})},1017855:u=>{t.$b("Gelu",u,void 0)},1017907:(u,h,b,y,T,E,A,D,K)=>{t.$b("GroupQueryAttention",u,{numHeads:h,kvNumHeads:b,scale:y,softcap:T,doRotary:E,rotaryInterleaved:A,smoothSoftmax:D,localWindowSize:K})},1018124:(u,h,b,y)=>{t.$b("LayerNormalization",u,{axis:h,epsilon:b,simplified:!!y})},1018235:(u,h,b,y)=>{t.$b("LayerNormalization",u,{axis:h,epsilon:b,simplified:!!y})},1018346:(u,h,b,y,T,E)=>{t.$b("MatMulNBits",u,{k:h,n:b,accuracyLevel:y,bits:T,blockSize:E})},1018473:(u,h,b,y,T,E)=>{t.$b("MultiHeadAttention",u,{numHeads:h,isUnidirectional:b,maskFilterValue:y,scale:T,doRotary:E})},1018632:(u,h)=>{t.$b("QuickGelu",u,{alpha:h})},1018696:(u,h,b,y,T)=>{t.$b("RotaryEmbedding",u,{interleaved:!!h,numHeads:b,rotaryEmbeddingDim:y,scale:T})},1018835:(u,h,b)=>{t.$b("SkipLayerNormalization",u,{epsilon:h,simplified:!!b})},1018937:(u,h,b)=>{t.$b("SkipLayerNormalization",u,{epsilon:h,simplified:!!b})},1019039:(u,h,b,y)=>{t.$b("GatherBlockQuantized",u,{gatherAxis:h,quantizeAxis:b,blockSize:y})},1019160:u=>{t.Fd(u)},1019194:(u,h)=>t.Hd(Number(u),Number(h),t.Yc.Kd,t.Yc.errors)};function k0(u,h,b){return As(async()=>{await t.Dd(Number(u),Number(h),Number(b))})}function T0(){return typeof wasmOffsetConverter<"u"}function I0(u,h,b,y){var T=le();try{return fo(u,h,b,y)}catch(E){if(ue(T),E!==E+0)throw E;de(1,0)}}function E0(u,h,b){var y=le();try{return lo(u,h,b)}catch(T){if(ue(y),T!==T+0)throw T;de(1,0)}}function C0(u){var h=le();try{so(u)}catch(b){if(ue(h),b!==b+0)throw b;de(1,0)}}function z0(u,h){var b=le();try{return Wi(u,h)}catch(y){if(ue(b),y!==y+0)throw y;de(1,0)}}function A0(u,h,b){var y=le();try{ao(u,h,b)}catch(T){if(ue(y),T!==T+0)throw T;de(1,0)}}function M0(u,h){var b=le();try{mo(u,h)}catch(y){if(ue(b),y!==y+0)throw y;de(1,0)}}function O0(u,h,b,y,T,E,A){var D=le();try{return co(u,h,b,y,T,E,A)}catch(K){if(ue(D),K!==K+0)throw K;de(1,0)}}function R0(u,h,b,y,T,E){var A=le();try{oo(u,h,b,y,T,E)}catch(D){if(ue(A),D!==D+0)throw D;de(1,0)}}function N0(u,h,b,y){var T=le();try{ho(u,h,b,y)}catch(E){if(ue(T),E!==E+0)throw E;de(1,0)}}function B0(u,h,b,y,T){var E=le();try{uo(u,h,b,y,T)}catch(A){if(ue(E),A!==A+0)throw A;de(1,0)}}function D0(u,h,b,y,T,E,A){var D=le();try{yo(u,h,b,y,T,E,A)}catch(K){if(ue(D),K!==K+0)throw K;de(1,0)}}function P0(u,h,b,y,T,E,A){var D=le();try{_o(u,h,b,y,T,E,A)}catch(K){if(ue(D),K!==K+0)throw K;de(1,0)}}function U0(u,h,b,y,T,E,A,D){var K=le();try{vo(u,h,b,y,T,E,A,D)}catch(J){if(ue(K),J!==J+0)throw J;de(1,0)}}function L0(u,h,b,y,T){var E=le();try{return go(u,h,b,y,T)}catch(A){if(ue(E),A!==A+0)throw A;de(1,0)}}function q0(u,h,b){var y=le();try{return xo(u,h,b)}catch(T){if(ue(y),T!==T+0)throw T;de(1,0)}}function W0(u,h,b,y,T,E,A,D){var K=le();try{So(u,h,b,y,T,E,A,D)}catch(J){if(ue(K),J!==J+0)throw J;de(1,0)}}function G0(u,h,b,y,T,E,A,D,K,J,oe,me){var we=le();try{bo(u,h,b,y,T,E,A,D,K,J,oe,me)}catch(xe){if(ue(we),xe!==xe+0)throw xe;de(1,0)}}function F0(u,h,b,y,T,E){var A=le();try{return wo(u,h,b,y,T,E)}catch(D){if(ue(A),D!==D+0)throw D;de(1,0)}}function V0(u,h,b){var y=le();try{return ko(u,h,b)}catch(T){if(ue(y),T!==T+0)throw T;return de(1,0),0n}}function H0(u,h,b,y,T,E,A,D,K){var J=le();try{po(u,h,b,y,T,E,A,D,K)}catch(oe){if(ue(J),oe!==oe+0)throw oe;de(1,0)}}function j0(u){var h=le();try{return To(u)}catch(b){if(ue(h),b!==b+0)throw b;de(1,0)}}function K0(u,h){var b=le();try{return qo(u,h)}catch(y){if(ue(b),y!==y+0)throw y;return de(1,0),0n}}function X0(u){var h=le();try{return Io(u)}catch(b){if(ue(h),b!==b+0)throw b;return de(1,0),0n}}function Z0(u,h,b,y){var T=le();try{return Oo(u,h,b,y)}catch(E){if(ue(T),E!==E+0)throw E;de(1,0)}}function Y0(u,h,b,y,T){var E=le();try{return Ro(u,h,b,y,T)}catch(A){if(ue(E),A!==A+0)throw A;de(1,0)}}function Q0(u,h,b,y,T,E){var A=le();try{return No(u,h,b,y,T,E)}catch(D){if(ue(A),D!==D+0)throw D;de(1,0)}}function J0(u,h,b,y,T,E){var A=le();try{return Bo(u,h,b,y,T,E)}catch(D){if(ue(A),D!==D+0)throw D;de(1,0)}}function ey(u,h,b,y,T,E,A,D){var K=le();try{return $o(u,h,b,y,T,E,A,D)}catch(J){if(ue(K),J!==J+0)throw J;de(1,0)}}function ty(u,h,b,y,T){var E=le();try{return Do(u,h,b,y,T)}catch(A){if(ue(E),A!==A+0)throw A;return de(1,0),0n}}function ry(u,h,b,y){var T=le();try{return Po(u,h,b,y)}catch(E){if(ue(T),E!==E+0)throw E;de(1,0)}}function iy(u,h,b,y){var T=le();try{return Uo(u,h,b,y)}catch(E){if(ue(T),E!==E+0)throw E;de(1,0)}}function ny(u,h,b,y,T,E,A,D,K,J,oe,me){var we=le();try{return Lo(u,h,b,y,T,E,A,D,K,J,oe,me)}catch(xe){if(ue(we),xe!==xe+0)throw xe;de(1,0)}}function ay(u,h,b,y,T,E,A,D,K,J,oe){var me=le();try{Ao(u,h,b,y,T,E,A,D,K,J,oe)}catch(we){if(ue(me),we!==we+0)throw we;de(1,0)}}function sy(u,h,b,y,T,E,A,D,K,J,oe,me,we,xe,$t,Fi){var dy=le();try{Mo(u,h,b,y,T,E,A,D,K,J,oe,me,we,xe,$t,Fi)}catch(Vi){if(ue(dy),Vi!==Vi+0)throw Vi;de(1,0)}}function oy(u,h,b){var y=le();try{return Eo(u,h,b)}catch(T){if(ue(y),T!==T+0)throw T;de(1,0)}}function uy(u,h,b){var y=le();try{return Co(u,h,b)}catch(T){if(ue(y),T!==T+0)throw T;de(1,0)}}function ly(u,h,b,y){var T=le();try{zo(u,h,b,y)}catch(E){if(ue(T),E!==E+0)throw E;de(1,0)}}function Ur(){if(0<Se)De=Ur;else if(n)_?.(t),Q();else{for(var u=fe;0<u.length;)u.shift()(t);0<Se?De=Ur:(t.calledRun=!0,C||(Q(),_?.(t)))}}return n||(ht=await ze(),Ur()),t.PTR_SIZE=4,q?t:new Promise((u,h)=>{_=u,v=h})}var Rc,iu,S_=H(()=>{Rc=ru,iu=globalThis.self?.name?.startsWith("em-pthread"),iu&&ru()}),Qi,ra,nu,qe,Nc,Wr,au,su,Ji,ou,en,Bc,tn,Dc,Ta=H(()=>{ka(),Qi=typeof location>"u"?void 0:location.origin,ra=import.meta.url>"file:"&&import.meta.url<"file;",nu=()=>{{if(ra){let e=URL;return new URL(new e("ort.bundle.min.mjs",import.meta.url).href,Qi).href}return import.meta.url}},qe=nu(),Nc=()=>{if(qe&&!qe.startsWith("blob:"))return qe.substring(0,qe.lastIndexOf("/")+1)},Wr=(e,t)=>{try{let r=t??qe;return(r?new URL(e,r):new URL(e)).origin===Qi}catch{return!1}},au=(e,t)=>{let r=t??qe;try{return(r?new URL(e,r):new URL(e)).href}catch{return}},su=(e,t)=>`${t??"./"}${e}`,Ji=async e=>{let t=await(await fetch(e,{credentials:"same-origin"})).blob();return URL.createObjectURL(t)},ou=async e=>(await import(e)).default,en=(x_(),kr(Ac)).default,Bc=async()=>{if(!qe)throw new Error("Failed to load proxy worker: cannot determine the script source URL.");if(Wr(qe))return[void 0,en()];let e=await Ji(qe);return[e,en(e)]},tn=(S_(),kr(Oc)).default,Dc=async(e,t,r,i)=>{let n=tn&&!(e||t);if(n)if(qe)n=Wr(qe)||i&&!r;else if(i&&!r)n=!0;else throw new Error("cannot determine the script source URL.");if(n)return[void 0,tn];{let a="ort-wasm-simd-threaded.jsep.mjs",s=e??au(a,t),o=r&&s&&!Wr(s,t),l=o?await Ji(s):s??su(a,t);return[o?l:void 0,await ou(l)]}}}),rn,Gr,lr,nn,uu,lu,du,Ia,ve,Vt=H(()=>{Ta(),Gr=!1,lr=!1,nn=!1,uu=()=>{if(typeof SharedArrayBuffer>"u")return!1;try{return typeof MessageChannel<"u"&&new MessageChannel().port1.postMessage(new SharedArrayBuffer(1)),WebAssembly.validate(new Uint8Array([0,97,115,109,1,0,0,0,1,4,1,96,0,0,3,2,1,0,5,4,1,3,1,1,10,11,1,9,0,65,0,254,16,2,0,26,11]))}catch{return!1}},lu=()=>{try{return WebAssembly.validate(new Uint8Array([0,97,115,109,1,0,0,0,1,4,1,96,0,0,3,2,1,0,10,30,1,28,0,65,0,253,15,253,12,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,253,186,1,26,11]))}catch{return!1}},du=()=>{try{return WebAssembly.validate(new Uint8Array([0,97,115,109,1,0,0,0,1,5,1,96,0,1,123,3,2,1,0,10,19,1,17,0,65,1,253,15,65,2,253,15,65,3,253,15,253,147,2,11]))}catch{return!1}},Ia=async e=>{if(Gr)return Promise.resolve();if(lr)throw new Error("multiple calls to 'initializeWebAssembly()' detected.");if(nn)throw new Error("previous call to 'initializeWebAssembly()' failed.");lr=!0;let t=e.initTimeout,r=e.numThreads;if(e.simd!==!1){if(e.simd==="relaxed"){if(!du())throw new Error("Relaxed WebAssembly SIMD is not supported in the current environment.")}else if(!lu())throw new Error("WebAssembly SIMD is not supported in the current environment.")}let i=uu();r>1&&!i&&(typeof self<"u"&&!self.crossOriginIsolated&&console.warn("env.wasm.numThreads is set to "+r+", but this will not work unless you enable crossOriginIsolated mode. See https://web.dev/cross-origin-isolation-guide/ for more info."),console.warn("WebAssembly multi-threading is not supported in the current environment. Falling back to single-threading."),e.numThreads=r=1);let n=e.wasmPaths,a=typeof n=="string"?n:void 0,s=n?.mjs,o=s?.href??s,l=n?.wasm,d=l?.href??l,p=e.wasmBinary,[c,f]=await Dc(o,a,r>1,!!p||!!d),g=!1,m=[];if(t>0&&m.push(new Promise(_=>{setTimeout(()=>{g=!0,_()},t)})),m.push(new Promise((_,v)=>{let $={numThreads:r};if(p)$.wasmBinary=p,$.locateFile=w=>w;else if(d||a)$.locateFile=w=>d??a+w;else if(o&&o.indexOf("blob:")!==0)$.locateFile=w=>new URL(w,o).href;else if(c){let w=Nc();w&&($.locateFile=S=>w+S)}f($).then(w=>{lr=!1,Gr=!0,rn=w,_(),c&&URL.revokeObjectURL(c)},w=>{lr=!1,nn=!0,v(w)})})),await Promise.race(m),g)throw new Error(`WebAssembly backend initializing failed due to timeout: ${t}ms`)},ve=()=>{if(Gr&&rn)return rn;throw new Error("WebAssembly is not initialized yet.")}}),tt,ui,_e,Ea=H(()=>{Vt(),tt=(e,t)=>{let r=ve(),i=r.lengthBytesUTF8(e)+1,n=r._malloc(i);return r.stringToUTF8(e,n,i),t.push(n),n},ui=(e,t,r,i)=>{if(typeof e=="object"&&e!==null){if(r.has(e))throw new Error("Circular reference in options");r.add(e)}Object.entries(e).forEach(([n,a])=>{let s=t?t+n:n;if(typeof a=="object")ui(a,s+".",r,i);else if(typeof a=="string"||typeof a=="number")i(s,a.toString());else if(typeof a=="boolean")i(s,a?"1":"0");else throw new Error(`Can't handle extra config type: ${typeof a}`)})},_e=e=>{let t=ve(),r=t.stackSave();try{let i=t.PTR_SIZE,n=t.stackAlloc(2*i);t._OrtGetLastError(n,n+i);let a=Number(t.getValue(n,i===4?"i32":"i64")),s=t.getValue(n+i,"*"),o=s?t.UTF8ToString(s):"";throw new Error(`${e} ERROR_CODE: ${a}, ERROR_MESSAGE: ${o}`)}finally{t.stackRestore(r)}}}),Pc,k_=H(()=>{Vt(),Ea(),Pc=e=>{let t=ve(),r=0,i=[],n=e||{};try{if(e?.logSeverityLevel===void 0)n.logSeverityLevel=2;else if(typeof e.logSeverityLevel!="number"||!Number.isInteger(e.logSeverityLevel)||e.logSeverityLevel<0||e.logSeverityLevel>4)throw new Error(`log severity level is not valid: ${e.logSeverityLevel}`);if(e?.logVerbosityLevel===void 0)n.logVerbosityLevel=0;else if(typeof e.logVerbosityLevel!="number"||!Number.isInteger(e.logVerbosityLevel))throw new Error(`log verbosity level is not valid: ${e.logVerbosityLevel}`);e?.terminate===void 0&&(n.terminate=!1);let a=0;return e?.tag!==void 0&&(a=tt(e.tag,i)),r=t._OrtCreateRunOptions(n.logSeverityLevel,n.logVerbosityLevel,!!n.terminate,a),r===0&&_e("Can't create run options."),e?.extra!==void 0&&ui(e.extra,"",new WeakSet,(s,o)=>{let l=tt(s,i),d=tt(o,i);t._OrtAddRunConfigEntry(r,l,d)!==0&&_e(`Can't set a run config entry: ${s} - ${o}.`)}),[r,i]}catch(a){throw r!==0&&t._OrtReleaseRunOptions(r),i.forEach(s=>t._free(s)),a}}}),pu,cu,hu,zt,fu,Uc,T_=H(()=>{Vt(),Ea(),pu=e=>{switch(e){case"disabled":return 0;case"basic":return 1;case"extended":return 2;case"layout":return 3;case"all":return 99;default:throw new Error(`unsupported graph optimization level: ${e}`)}},cu=e=>{switch(e){case"sequential":return 0;case"parallel":return 1;default:throw new Error(`unsupported execution mode: ${e}`)}},hu=e=>{e.extra||(e.extra={}),e.extra.session||(e.extra.session={});let t=e.extra.session;t.use_ort_model_bytes_directly||(t.use_ort_model_bytes_directly="1"),e.executionProviders&&e.executionProviders.some(r=>(typeof r=="string"?r:r.name)==="webgpu")&&(e.enableMemPattern=!1)},zt=(e,t,r,i)=>{let n=tt(t,i),a=tt(r,i);ve()._OrtAddSessionConfigEntry(e,n,a)!==0&&_e(`Can't set a session config entry: ${t} - ${r}.`)},fu=async(e,t,r)=>{let i=t.executionProviders;for(let n of i){let a=typeof n=="string"?n:n.name,s=[];switch(a){case"webnn":if(a="WEBNN",zt(e,"session.disable_quant_qdq","1",r),zt(e,"session.disable_qdq_constant_folding","1",r),typeof n!="string"){let c=n?.deviceType;c&&zt(e,"deviceType",c,r)}break;case"webgpu":if(a="JS",typeof n!="string"){let c=n;if(c?.preferredLayout){if(c.preferredLayout!=="NCHW"&&c.preferredLayout!=="NHWC")throw new Error(`preferredLayout must be either 'NCHW' or 'NHWC': ${c.preferredLayout}`);zt(e,"preferredLayout",c.preferredLayout,r)}}break;case"wasm":case"cpu":continue;default:throw new Error(`not supported execution provider: ${a}`)}let o=tt(a,r),l=s.length,d=0,p=0;if(l>0){d=ve()._malloc(l*ve().PTR_SIZE),r.push(d),p=ve()._malloc(l*ve().PTR_SIZE),r.push(p);for(let c=0;c<l;c++)ve().setValue(d+c*ve().PTR_SIZE,s[c][0],"*"),ve().setValue(p+c*ve().PTR_SIZE,s[c][1],"*")}await ve()._OrtAppendExecutionProvider(e,o,d,p,l)!==0&&_e(`Can't append execution provider: ${a}.`)}},Uc=async e=>{let t=ve(),r=0,i=[],n=e||{};hu(n);try{let a=pu(n.graphOptimizationLevel??"all"),s=cu(n.executionMode??"sequential"),o=typeof n.logId=="string"?tt(n.logId,i):0,l=n.logSeverityLevel??2;if(!Number.isInteger(l)||l<0||l>4)throw new Error(`log severity level is not valid: ${l}`);let d=n.logVerbosityLevel??0;if(!Number.isInteger(d)||d<0||d>4)throw new Error(`log verbosity level is not valid: ${d}`);let p=typeof n.optimizedModelFilePath=="string"?tt(n.optimizedModelFilePath,i):0;if(r=t._OrtCreateSessionOptions(a,!!n.enableCpuMemArena,!!n.enableMemPattern,s,!!n.enableProfiling,0,o,l,d,p),r===0&&_e("Can't create session options."),n.executionProviders&&await fu(r,n,i),n.enableGraphCapture!==void 0){if(typeof n.enableGraphCapture!="boolean")throw new Error(`enableGraphCapture must be a boolean value: ${n.enableGraphCapture}`);zt(r,"enableGraphCapture",n.enableGraphCapture.toString(),i)}if(n.freeDimensionOverrides)for(let[c,f]of Object.entries(n.freeDimensionOverrides)){if(typeof c!="string")throw new Error(`free dimension override name must be a string: ${c}`);if(typeof f!="number"||!Number.isInteger(f)||f<0)throw new Error(`free dimension override value must be a non-negative integer: ${f}`);let g=tt(c,i);t._OrtAddFreeDimensionOverride(r,g,f)!==0&&_e(`Can't set a free dimension override: ${c} - ${f}.`)}return n.extra!==void 0&&ui(n.extra,"",new WeakSet,(c,f)=>{zt(r,c,f,i)}),[r,i]}catch(a){throw r!==0&&t._OrtReleaseSessionOptions(r)!==0&&_e("Can't release session options."),i.forEach(s=>t._free(s)),a}}}),Bt,mt,Dt,wi,li,Ca,za,ia,ne=H(()=>{Bt=e=>{switch(e){case"int8":return 3;case"uint8":return 2;case"bool":return 9;case"int16":return 5;case"uint16":return 4;case"int32":return 6;case"uint32":return 12;case"float16":return 10;case"float32":return 1;case"float64":return 11;case"string":return 8;case"int64":return 7;case"uint64":return 13;case"int4":return 22;case"uint4":return 21;default:throw new Error(`unsupported data type: ${e}`)}},mt=e=>{switch(e){case 3:return"int8";case 2:return"uint8";case 9:return"bool";case 5:return"int16";case 4:return"uint16";case 6:return"int32";case 12:return"uint32";case 10:return"float16";case 1:return"float32";case 11:return"float64";case 8:return"string";case 7:return"int64";case 13:return"uint64";case 22:return"int4";case 21:return"uint4";default:throw new Error(`unsupported data type: ${e}`)}},Dt=(e,t)=>{let r=[-1,4,1,1,2,2,4,8,-1,1,2,8,4,8,-1,-1,-1,-1,-1,-1,-1,.5,.5][e],i=typeof t=="number"?t:t.reduce((n,a)=>n*a,1);return r>0?Math.ceil(i*r):void 0},wi=e=>{switch(e){case"float16":return typeof Float16Array<"u"?Float16Array:Uint16Array;case"float32":return Float32Array;case"uint8":return Uint8Array;case"int8":return Int8Array;case"uint16":return Uint16Array;case"int16":return Int16Array;case"int32":return Int32Array;case"bool":return Uint8Array;case"float64":return Float64Array;case"uint32":return Uint32Array;case"int64":return BigInt64Array;case"uint64":return BigUint64Array;default:throw new Error(`unsupported type: ${e}`)}},li=e=>{switch(e){case"verbose":return 0;case"info":return 1;case"warning":return 2;case"error":return 3;case"fatal":return 4;default:throw new Error(`unsupported logging level: ${e}`)}},Ca=e=>e==="float32"||e==="float16"||e==="int32"||e==="int64"||e==="uint32"||e==="uint8"||e==="bool"||e==="uint4"||e==="int4",za=e=>e==="float32"||e==="float16"||e==="int32"||e==="int64"||e==="uint32"||e==="uint64"||e==="int8"||e==="uint8"||e==="bool"||e==="uint4"||e==="int4",ia=e=>{switch(e){case"none":return 0;case"cpu":return 1;case"cpu-pinned":return 2;case"texture":return 3;case"gpu-buffer":return 4;case"ml-tensor":return 5;default:throw new Error(`unsupported data location: ${e}`)}}}),Aa,Lc=H(()=>{ka(),Aa=async e=>{if(typeof e=="string"){let t=await fetch(e);if(!t.ok)throw new Error(`failed to load external data file: ${e}`);let r=t.headers.get("Content-Length"),i=r?parseInt(r,10):0;if(i<1073741824)return new Uint8Array(await t.arrayBuffer());{if(!t.body)throw new Error(`failed to load external data file: ${e}, no response body.`);let n=t.body.getReader(),a;try{a=new ArrayBuffer(i)}catch(o){if(o instanceof RangeError){let l=Math.ceil(i/65536);a=new WebAssembly.Memory({initial:l,maximum:l}).buffer}else throw o}let s=0;for(;;){let{done:o,value:l}=await n.read();if(o)break;let d=l.byteLength;new Uint8Array(a,s,d).set(l),s+=d}return new Uint8Array(a,0,i)}}else return e instanceof Blob?new Uint8Array(await e.arrayBuffer()):e instanceof Uint8Array?e:new Uint8Array(e)}}),mu,gu,yu,_u,Ma,bu,he,gt=H(()=>{ne(),mu=["V","I","W","E","F"],gu=(e,t)=>{console.log(`[${mu[e]},${new Date().toISOString()}]${t}`)},Ma=(e,t)=>{yu=e,_u=t},bu=(e,t)=>{let r=li(e),i=li(yu);r>=i&&gu(r,typeof t=="function"?t():t)},he=(...e)=>{_u&&bu(...e)}}),wu,tr,R,di,qc,Wc,Gc,ae=H(()=>{wu=class{static calcMatMulShape(e,t){return e[1]!==t[0]?void 0:[e[0],t[1]]}},tr=class{static calcShape(e,t,r=!1){let i=e.length,n=t.length;if(i===0)return t;if(n===0)return e;let a=Math.max(e.length,t.length),s=new Array(a);if(r){if(i<2||n<2)return;let o=wu.calcMatMulShape([e[i-2],e[i-1]],[t[n-2],t[n-1]]);if(o===void 0)return;[s[a-2],s[a-1]]=o}for(let o=r?3:1;o<=a;o++){let l=i-o<0?1:e[i-o],d=n-o<0?1:t[n-o];if(l!==d&&l>1&&d>1)return;let p=Math.max(l,d);if(l&&d)s[a-o]=Math.max(l,d);else{if(p>1)return;s[a-o]=0}}return s}static isValidBroadcast(e,t){let r=e.length,i=t.length;if(r>i)return!1;for(let n=1;n<=r;n++)if(e[r-n]!==1&&e[r-n]!==t[i-n])return!1;return!0}},R=class ii{static size(t){return ii.getSizeFromDimensionRange(t,0,t.length)}static convertShape(t,r=4){let i=t.length;if(i===0)return[];let n=new Array(i),a=i-1;for(;a>=0;){if(t[a]%r===0){n[a]=t[a]/r;break}if(r%t[a]!==0)throw new Error("cannot convert shape");n[a]=1,r/=t[a],a--}for(a--;a>=0;a--)n[a]=t[a];return n}static sizeFromDimension(t,r){if(r<0||r>t.length)throw new Error(`invalid dimension of ${r} for sizeFromDimension as Tensor has ${t.length} dimensions.`);return ii.getSizeFromDimensionRange(t,r,t.length)}static sizeToDimension(t,r){if(r<0||r>t.length)throw new Error(`invalid dimension of ${r} for sizeToDimension as Tensor has ${t.length} dimensions.`);return ii.getSizeFromDimensionRange(t,0,r)}static getSizeFromDimensionRange(t,r,i){let n=1;for(let a=r;a<i;a++){if(t[a]<0)throw new Error("cannot get valid size from specified dimension range. Most likely the range contains negative values in them.");n*=Number(t[a])}return n}static computeStrides(t){let r=t.length;if(r===0)return[];if(r===1)return[1];let i=new Array(r);i[r-1]=1,i[r-2]=t[r-1];for(let n=r-3;n>=0;--n)i[n]=i[n+1]*t[n+1];return i}static normalizeAxis(t,r){if(t<-r&&t>=r)throw new Error("unsupported axis for this operation.");return t<0?t+r:t}static normalizeAxes(t,r){return t.map(i=>this.normalizeAxis(i,r??t.length))}static sortBasedOnPerm(t,r){return r?r.map(i=>t[i]):t.slice().reverse()}static padShape(t,r){let i=t.length;return t.map((n,a)=>n+r[a]+r[a+i])}static areEqual(t,r){return t.length!==r.length?!1:t.every((i,n)=>i===r[n])}},di=class wr{static adjustPoolAttributes(t,r,i,n,a,s){if(!t&&i.length!==r.length-2)throw new Error("length of specified kernel shapes should be 2 less than length of input dimensions");if(t)for(let o=0;o<r.length-2;o++)o>=i.length?i.push(r[o+2]):i[o]=r[o+2];for(let o=0;o<i.length;o++)if(o<n.length){if(n[o]<0)throw new Error("strides should be greater than or equal to 1")}else n.push(1);for(let o=0;o<i.length;o++)if(o<a.length){if(a[o]<0)throw new Error("dilations should be greater than or equal to 1")}else a.push(1);for(let o=0;o<i.length*2;o++)if(o<s.length){if(s[o]<0)throw new Error("pad should be greater than or equal to 1")}else s.push(0);for(let o=0;o<i.length;o++){if(i[o]<=0)throw new Error("kernel shapes need to be greater than 0");if(s[o]>=i[o]||s[o+i.length]>=i[o])throw new Error("pads should be smaller than kernel")}}static adjustPadsBasedOnAutoPad(t,r,i,n,a,s,o){if(o){if(a.length!==2*(t.length-2))throw new Error("length of pads should be twice the length of data dimensions");if(r.length!==t.length-2)throw new Error("length of strides should be the length of data dimensions");if(n.length!==t.length-2)throw new Error("length of kernel shapes should be the length of data dimensions");for(let l=0;l<t.length-2;l++)wr.adjustPadAndReturnShape(t[l+(s?1:2)],r[l],i[l],n[l],a,l,l+t.length-2,o)}}static computePoolOutputShape(t,r,i,n,a,s,o){if(r.length<=0)throw new Error("input shape must be of size greater than 0");let l=[r[0],r[1]];return wr.computeShapeHelper(t,r,l,i,n,a,s,o),l}static computeConvOutputShape(t,r,i,n,a,s,o){if(t.length<=0||r.length<=0)throw new Error("invalid input tensor dims or invalid filter tensor dims");let l=[t[0],r[0]];return wr.computeShapeHelper(!1,t,l,i,n,a,s,o),l}static computeShapeHelper(t,r,i,n,a,s,o,l){if(t)for(let d=0;d<r.length-2;d++)i.push(1);else for(let d=0;d<r.length-2;d++)i.push(wr.adjustPadAndReturnShape(r[d+2],n[d],a[d],s[d],o,d,d+r.length-2,l))}static adjustPadAndReturnShape(t,r,i,n,a,s,o,l){let d=i*(n-1)+1;if(l&&l!=="NOTSET")switch(l){case"VALID":return a[s]=0,a[o]=0,Math.floor((t-d)/r+1);case"SAME_LOWER":case"SAME_UPPER":if(i!==1)throw new Error("Dilation not supported for SAME_UPPER or SAME_LOWER");{let p=((t+r-1)/r-1)*r+n-t;return a[s]=Math.floor(l==="SAME_LOWER"?(p+1)/2:p/2),a[o]=p-a[s],Math.floor((t+p-n)/r+1)}default:throw new Error("Unsupported AutoPad type")}else return Math.floor((t+a[s]+a[o]-d)/r+1)}},qc=class{static getShapeOfGemmResult(e,t,r,i,n){if(e.length!==2||r.length!==2)throw new Error("shape need to be of size 2");let a,s,o;t?(a=e[1],s=e[0]):(a=e[0],s=e[1]);let l=-1;if(i?(o=r[0],l=1):(o=r[1],l=0),r[l]!==s)throw new Error("dimension mismatch");if(a<=0||o<=0||s<=0)throw new Error("invalid shape specified");if(n&&!tr.isValidBroadcast(n,[a,o]))throw new Error("gemm: invalid bias shape for broadcast");return[a,o,s]}},Wc=-34028234663852886e22,Gc=34028234663852886e22}),Oa,Fc=H(()=>{ne(),Oa=(e,t)=>new(wi(t))(e)}),an,na,sn,$u,on,vu,un,ln,dn,xu,Vc,I_=H(()=>{ne(),gt(),an=new Map([["float32",32],["float16",16],["int32",32],["uint32",32],["int64",64],["uint64",64],["int8",8],["uint8",8],["int4",4],["uint4",4]]),na=(e,t)=>{if(t==="int32")return e;let r=an.get(t);if(!r)throw new Error(`WebNN backend does not support data type: ${t}`);let i=r/8;if(e.byteLength%i!==0)throw new Error(`Invalid Uint8Array length - must be a multiple of ${i}.`);let n=e.byteLength/i,a=new(wi(t))(e.buffer,e.byteOffset,n);switch(t){case"int64":case"uint64":{let s=new Int32Array(n);for(let o=0;o<n;o++){let l=a[o];if(l>2147483647n||l<-2147483648n)throw new Error("Can not convert int64 data to int32 - value out of range.");s[o]=Number(l)}return new Uint8Array(s.buffer)}case"int8":case"uint8":case"uint32":{if(t==="uint32"&&a.some(o=>o>2147483647))throw new Error("Can not convert uint32 data to int32 - value out of range.");let s=Int32Array.from(a,Number);return new Uint8Array(s.buffer)}default:throw new Error(`Unsupported data conversion from ${t} to 'int32'`)}},sn=(e,t)=>{if(t==="int32")return e;if(e.byteLength%4!==0)throw new Error("Invalid Uint8Array length - must be a multiple of 4 (int32).");let r=e.byteLength/4,i=new Int32Array(e.buffer,e.byteOffset,r);switch(t){case"int64":{let n=BigInt64Array.from(i,BigInt);return new Uint8Array(n.buffer)}case"uint64":{if(i.some(a=>a<0))throw new Error("Can not convert int32 data to uin64 - negative value found.");let n=BigUint64Array.from(i,BigInt);return new Uint8Array(n.buffer)}case"int8":{if(i.some(a=>a<-128||a>127))throw new Error("Can not convert int32 data to int8 - value out of range.");let n=Int8Array.from(i,Number);return new Uint8Array(n.buffer)}case"uint8":{if(i.some(n=>n<0||n>255))throw new Error("Can not convert int32 data to uint8 - value out of range.");return Uint8Array.from(i,Number)}case"uint32":{if(i.some(a=>a<0))throw new Error("Can not convert int32 data to uint32 - negative value found.");let n=Uint32Array.from(i,Number);return new Uint8Array(n.buffer)}default:throw new Error(`Unsupported data conversion from 'int32' to ${t}`)}},$u=1,on=()=>$u++,vu=new Map([["int8","int32"],["uint8","int32"],["uint32","int32"],["int64","int32"]]),un=(e,t)=>{let r=an.get(e);if(!r)throw new Error(`WebNN backend does not support data type: ${e}`);return t.length>0?Math.ceil(t.reduce((i,n)=>i*n)*r/8):0},ln=class{constructor(e){this.isDataConverted=!1;let{sessionId:t,context:r,tensor:i,dataType:n,shape:a,fallbackDataType:s}=e;this.sessionId=t,this.mlContext=r,this.mlTensor=i,this.dataType=n,this.tensorShape=a,this.fallbackDataType=s}get tensor(){return this.mlTensor}get type(){return this.dataType}get fallbackType(){return this.fallbackDataType}get shape(){return this.tensorShape}get byteLength(){return un(this.dataType,this.tensorShape)}destroy(){he("verbose",()=>"[WebNN] TensorWrapper.destroy"),this.mlTensor.destroy()}write(e){this.mlContext.writeTensor(this.mlTensor,e)}async read(e){if(this.fallbackDataType){let t=await this.mlContext.readTensor(this.mlTensor),r=sn(new Uint8Array(t),this.dataType);if(e){(e instanceof ArrayBuffer?new Uint8Array(e):new Uint8Array(e.buffer,e.byteOffset,e.byteLength)).set(r);return}else return new Uint8Array(r).buffer}else return e?this.mlContext.readTensor(this.mlTensor,e):this.mlContext.readTensor(this.mlTensor)}canReuseTensor(e,t,r){return this.mlContext===e&&this.dataType===t&&this.tensorShape.length===r.length&&this.tensorShape.every((i,n)=>i===r[n])}setIsDataConverted(e){this.isDataConverted=e}},dn=class{constructor(e,t){this.tensorManager=e,this.wrapper=t}get tensorWrapper(){return this.wrapper}releaseTensor(){this.tensorWrapper&&(this.tensorManager.releaseTensor(this.tensorWrapper),this.wrapper=void 0)}async ensureTensor(e,t,r,i){let n=this.tensorManager.getMLContext(e),a=this.tensorManager.getMLOpSupportLimits(e),s;if(!a?.input.dataTypes.includes(t)){if(s=vu.get(t),!s||a?.input.dataTypes.includes(s))throw new Error(`WebNN backend does not support data type: ${t}`);he("verbose",()=>`[WebNN] TensorIdTracker.ensureTensor: fallback dataType from ${t} to ${s}`)}if(this.wrapper){if(this.wrapper.canReuseTensor(n,t,r))return this.wrapper.tensor;if(i){if(this.wrapper.byteLength!==un(t,r))throw new Error("Unable to copy data to tensor with different size.");this.activeUpload=new Uint8Array(await this.wrapper.read())}this.tensorManager.releaseTensor(this.wrapper)}let o=typeof MLTensorUsage>"u"?void 0:MLTensorUsage.READ|MLTensorUsage.WRITE;return this.wrapper=await this.tensorManager.getCachedTensor(e,t,r,o,!0,!0,s),i&&this.activeUpload&&(this.wrapper.write(this.activeUpload),this.activeUpload=void 0),this.wrapper.tensor}upload(e){let t=e;if(this.wrapper){if(this.wrapper.fallbackType)if(this.wrapper.fallbackType==="int32")t=na(e,this.wrapper.type),this.wrapper.setIsDataConverted(!0);else throw new Error(`Unsupported fallback data type: ${this.wrapper.fallbackType}`);if(e.byteLength===this.wrapper.byteLength){this.wrapper.write(t);return}else he("verbose",()=>"Data size does not match tensor size. Releasing tensor."),this.releaseTensor()}this.activeUpload?this.activeUpload.set(t):this.activeUpload=new Uint8Array(t)}async download(e){if(this.activeUpload){let t=this.wrapper?.isDataConverted?sn(this.activeUpload,this.wrapper?.type):this.activeUpload;if(e){e instanceof ArrayBuffer?new Uint8Array(e).set(t):new Uint8Array(e.buffer,e.byteOffset,e.byteLength).set(t);return}else return t.buffer}if(!this.wrapper)throw new Error("Tensor has not been created.");return e?this.wrapper.read(e):this.wrapper.read()}},xu=class{constructor(e){this.backend=e,this.tensorTrackersById=new Map,this.freeTensors=[],this.externalTensors=new Set}getMLContext(e){let t=this.backend.getMLContext(e);if(!t)throw new Error("MLContext not found for session.");return t}getMLOpSupportLimits(e){return this.backend.getMLOpSupportLimits(e)}reserveTensorId(){let e=on();return this.tensorTrackersById.set(e,new dn(this)),e}releaseTensorId(e){let t=this.tensorTrackersById.get(e);t&&(this.tensorTrackersById.delete(e),t.tensorWrapper&&this.releaseTensor(t.tensorWrapper))}async ensureTensor(e,t,r,i,n){he("verbose",()=>`[WebNN] TensorManager.ensureTensor {tensorId: ${t}, dataType: ${r}, shape: ${i}, copyOld: ${n}}`);let a=this.tensorTrackersById.get(t);if(!a)throw new Error("Tensor not found.");return a.ensureTensor(e,r,i,n)}upload(e,t){let r=this.tensorTrackersById.get(e);if(!r)throw new Error("Tensor not found.");r.upload(t)}async download(e,t){he("verbose",()=>`[WebNN] TensorManager.download {tensorId: ${e}, dstBuffer: ${t?.byteLength}}`);let r=this.tensorTrackersById.get(e);if(!r)throw new Error("Tensor not found.");return r.download(t)}releaseTensorsForSession(e){for(let t of this.freeTensors)t.sessionId===e&&t.destroy();this.freeTensors=this.freeTensors.filter(t=>t.sessionId!==e)}registerTensor(e,t,r,i){let n=this.getMLContext(e),a=on(),s=new ln({sessionId:e,context:n,tensor:t,dataType:r,shape:i});return this.tensorTrackersById.set(a,new dn(this,s)),this.externalTensors.add(s),a}async getCachedTensor(e,t,r,i,n,a,s){let o=this.getMLContext(e);for(let[d,p]of this.freeTensors.entries())if(p.canReuseTensor(o,t,r)){he("verbose",()=>`[WebNN] Reusing tensor {dataType: ${t}, ${s?`fallbackDataType: ${s},`:""} shape: ${r}`);let c=this.freeTensors.splice(d,1)[0];return c.sessionId=e,c}he("verbose",()=>`[WebNN] MLContext.createTensor {dataType: ${t}, ${s?`fallbackDataType: ${s},`:""} shape: ${r}}`);let l=await o.createTensor({dataType:s??t,shape:r,dimensions:r,usage:i,writable:n,readable:a});return new ln({sessionId:e,context:o,tensor:l,dataType:t,shape:r,fallbackDataType:s})}releaseTensor(e){this.externalTensors.has(e)&&this.externalTensors.delete(e),this.freeTensors.push(e)}},Vc=(...e)=>new xu(...e)}),dr,Su,Hc,E_=H(()=>{ne(),Vt(),Fc(),I_(),gt(),dr=new Map([[1,"float32"],[10,"float16"],[6,"int32"],[12,"uint32"],[7,"int64"],[13,"uint64"],[22,"int4"],[21,"uint4"],[3,"int8"],[2,"uint8"],[9,"uint8"]]),Su=(e,t)=>{if(e===t)return!0;if(e===void 0||t===void 0)return!1;let r=Object.keys(e).sort(),i=Object.keys(t).sort();return r.length===i.length&&r.every((n,a)=>n===i[a]&&e[n]===t[n])},Hc=class{constructor(e){this.tensorManager=Vc(this),this.mlContextBySessionId=new Map,this.sessionIdsByMLContext=new Map,this.mlContextCache=[],this.sessionGraphInputs=new Map,this.sessionGraphOutputs=new Map,this.temporaryGraphInputs=[],this.temporaryGraphOutputs=[],this.temporarySessionTensorIds=new Map,this.mlOpSupportLimitsBySessionId=new Map,Ma(e.logLevel,!!e.debug)}get currentSessionId(){if(this.activeSessionId===void 0)throw new Error("No active session");return this.activeSessionId}onRunStart(e){he("verbose",()=>`[WebNN] onRunStart {sessionId: ${e}}`),this.activeSessionId=e}onRunEnd(e){he("verbose",()=>`[WebNN] onRunEnd {sessionId: ${e}}`);let t=this.temporarySessionTensorIds.get(e);if(t){for(let r of t)he("verbose",()=>`[WebNN] releasing temporary tensor {tensorId: ${r}}`),this.tensorManager.releaseTensorId(r);this.temporarySessionTensorIds.delete(e),this.activeSessionId=void 0}}async createMLContext(e){if(e instanceof GPUDevice){let r=this.mlContextCache.findIndex(i=>i.gpuDevice===e);if(r!==-1)return this.mlContextCache[r].mlContext;{let i=await navigator.ml.createContext(e);return this.mlContextCache.push({gpuDevice:e,mlContext:i}),i}}else if(e===void 0){let r=this.mlContextCache.findIndex(i=>i.options===void 0&&i.gpuDevice===void 0);if(r!==-1)return this.mlContextCache[r].mlContext;{let i=await navigator.ml.createContext();return this.mlContextCache.push({mlContext:i}),i}}let t=this.mlContextCache.findIndex(r=>Su(r.options,e));if(t!==-1)return this.mlContextCache[t].mlContext;{let r=await navigator.ml.createContext(e);return this.mlContextCache.push({options:e,mlContext:r}),r}}registerMLContext(e,t){this.mlContextBySessionId.set(e,t);let r=this.sessionIdsByMLContext.get(t);r||(r=new Set,this.sessionIdsByMLContext.set(t,r)),r.add(e),this.mlOpSupportLimitsBySessionId.has(e)||this.mlOpSupportLimitsBySessionId.set(e,t.opSupportLimits()),this.temporaryGraphInputs.length>0&&(this.sessionGraphInputs.set(e,this.temporaryGraphInputs),this.temporaryGraphInputs=[]),this.temporaryGraphOutputs.length>0&&(this.sessionGraphOutputs.set(e,this.temporaryGraphOutputs),this.temporaryGraphOutputs=[])}onReleaseSession(e){this.sessionGraphInputs.delete(e),this.sessionGraphOutputs.delete(e);let t=this.mlContextBySessionId.get(e);if(!t)return;this.tensorManager.releaseTensorsForSession(e),this.mlContextBySessionId.delete(e),this.mlOpSupportLimitsBySessionId.delete(e);let r=this.sessionIdsByMLContext.get(t);if(r.delete(e),r.size===0){this.sessionIdsByMLContext.delete(t);let i=this.mlContextCache.findIndex(n=>n.mlContext===t);i!==-1&&this.mlContextCache.splice(i,1)}}getMLContext(e){return this.mlContextBySessionId.get(e)}getMLOpSupportLimits(e){return this.mlOpSupportLimitsBySessionId.get(e)}reserveTensorId(){return this.tensorManager.reserveTensorId()}releaseTensorId(e){he("verbose",()=>`[WebNN] releaseTensorId {tensorId: ${e}}`),this.tensorManager.releaseTensorId(e)}async ensureTensor(e,t,r,i,n){let a=dr.get(r);if(!a)throw new Error(`Unsupported ONNX data type: ${r}`);return this.tensorManager.ensureTensor(e??this.currentSessionId,t,a,i,n)}async createTemporaryTensor(e,t,r){he("verbose",()=>`[WebNN] createTemporaryTensor {onnxDataType: ${t}, shape: ${r}}`);let i=dr.get(t);if(!i)throw new Error(`Unsupported ONNX data type: ${t}`);let n=this.tensorManager.reserveTensorId();await this.tensorManager.ensureTensor(e,n,i,r,!1);let a=this.temporarySessionTensorIds.get(e);return a?a.push(n):this.temporarySessionTensorIds.set(e,[n]),n}uploadTensor(e,t){if(!ve().shouldTransferToMLTensor)throw new Error("Trying to upload to a MLTensor while shouldTransferToMLTensor is false");he("verbose",()=>`[WebNN] uploadTensor {tensorId: ${e}, data: ${t.byteLength}}`),this.tensorManager.upload(e,t)}async downloadTensor(e,t){return this.tensorManager.download(e,t)}createMLTensorDownloader(e,t){return async()=>{let r=await this.tensorManager.download(e);return Oa(r,t)}}registerMLTensor(e,t,r,i){let n=dr.get(r);if(!n)throw new Error(`Unsupported ONNX data type: ${r}`);let a=this.tensorManager.registerTensor(e,t,n,i);return he("verbose",()=>`[WebNN] registerMLTensor {tensor: ${t}, dataType: ${n}, dimensions: ${i}} -> {tensorId: ${a}}`),a}registerMLConstant(e,t,r,i,n,a,s=!1){if(!a)throw new Error("External mounted files are not available.");let o=e;e.startsWith("./")&&(o=e.substring(2));let l=a.get(o);if(!l)throw new Error(`File with name ${o} not found in preloaded files.`);if(t+r>l.byteLength)throw new Error("Out of bounds: data offset and length exceed the external file data size.");let d=l.slice(t,t+r).buffer,p;switch(n.dataType){case"float32":p=new Float32Array(d);break;case"float16":p=typeof Float16Array<"u"?new Float16Array(d):new Uint16Array(d);break;case"int32":p=new Int32Array(d);break;case"uint32":p=new Uint32Array(d);break;case"int64":if(s){let c=na(new Uint8Array(d),"int64");p=new Int32Array(c.buffer),n.dataType="int32"}else p=new BigInt64Array(d);break;case"uint64":p=new BigUint64Array(d);break;case"int8":p=new Int8Array(d);break;case"int4":case"uint4":case"uint8":p=new Uint8Array(d);break;default:throw new Error(`Unsupported data type: ${n.dataType} in creating WebNN Constant from external data.`)}return he("verbose",()=>`[WebNN] registerMLConstant {dataType: ${n.dataType}, shape: ${n.shape}}} ${s?"(Note: it was int64 data type and registered to int32 as workaround)":""}`),i.constant(n,p)}registerGraphInput(e){this.temporaryGraphInputs.push(e)}registerGraphOutput(e){this.temporaryGraphOutputs.push(e)}isGraphInput(e,t){let r=this.sessionGraphInputs.get(e);return r?r.includes(t):!1}isGraphOutput(e,t){let r=this.sessionGraphOutputs.get(e);return r?r.includes(t):!1}isGraphInputOutputTypeSupported(e,t,r=!0){let i=dr.get(Bt(t)),n=this.mlOpSupportLimitsBySessionId.get(e);return typeof i>"u"?!1:r?!!n?.input.dataTypes.includes(i):!!n?.output.dataTypes.includes(i)}flush(){}}}),Ra=H(()=>{}),pn,Fr,Vr,ku,Tu,cn,aa,Iu,jc,C_=H(()=>{gt(),Ra(),pn=new Map([[64,250],[128,200],[256,200],[512,200],[2048,230],[4096,200],[8192,50],[16384,50],[32768,50],[65536,50],[131072,50],[262144,50],[524288,50],[1048576,50],[2097152,30],[4194304,20],[8388608,10],[12582912,10],[16777216,10],[26214400,15],[33554432,22],[44236800,2],[58982400,6],[67108864,6],[134217728,6],[167772160,6]]),Fr=[],Vr=e=>Math.ceil(Number(e)/16)*16,ku=e=>{for(let t=0;t<Fr.length;t++){let r=Fr[t];if(e<=r)return r}return Math.ceil(e/16)*16},Tu=1,cn=()=>Tu++,aa=async(e,t,r,i)=>{let n=Vr(r),a=e.device.createBuffer({size:n,usage:GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ});try{let s=e.getCommandEncoder();e.endComputePass(),s.copyBufferToBuffer(t,0,a,0,n),e.flush(),await a.mapAsync(GPUMapMode.READ);let o=a.getMappedRange();if(i){let l=i();return l.set(new Uint8Array(o,0,r)),l}else return new Uint8Array(o.slice(0,r))}finally{a.destroy()}},Iu=class{constructor(e){this.backend=e,this.storageCache=new Map,this.freeBuffers=new Map,this.freeUniformBuffers=new Map,this.buffersPending=[],this.capturedPendingBuffers=new Map;for(let[t]of pn)Fr.push(t),this.freeBuffers.set(t,[]),this.freeUniformBuffers.set(t,[]);this.sessionCount=0}upload(e,t){let r=t.buffer,i=t.byteOffset,n=t.byteLength,a=Vr(n),s=this.storageCache.get(e);if(!s)throw new Error("gpu data for uploading does not exist");if(Number(s.originalSize)!==n)throw new Error(`inconsistent data size. gpu data size=${s.originalSize}, data size=${n}`);let o=this.backend.device.createBuffer({mappedAtCreation:!0,size:a,usage:GPUBufferUsage.MAP_WRITE|GPUBufferUsage.COPY_SRC}),l=o.getMappedRange();new Uint8Array(l).set(new Uint8Array(r,i,n)),o.unmap();let d=this.backend.device.createCommandEncoder();d.copyBufferToBuffer(o,0,s.gpuData.buffer,0,a),this.backend.device.queue.submit([d.finish()]),o.destroy(),he("verbose",()=>`[WebGPU] GpuDataManager.upload(id=${e})`)}memcpy(e,t){let r=this.storageCache.get(e);if(!r)throw new Error("source gpu data for memcpy does not exist");let i=this.storageCache.get(t);if(!i)throw new Error("destination gpu data for memcpy does not exist");if(r.originalSize!==i.originalSize)throw new Error("inconsistent source and destination gpu data size");let n=Vr(r.originalSize),a=this.backend.getCommandEncoder();this.backend.endComputePass(),a.copyBufferToBuffer(r.gpuData.buffer,0,i.gpuData.buffer,0,n)}registerExternalBuffer(e,t,r){let i;if(r){if(i=r[0],e===r[1])return he("verbose",()=>`[WebGPU] GpuDataManager.registerExternalBuffer(size=${t}) => id=${i}, buffer is the same, skip.`),i;if(this.backend.capturedCommandList.has(this.backend.currentSessionId))throw new Error(`Registering a different external buffer under graph capture mode is not supported yet.
             Please use the previous external buffer!`)}else i=cn();return this.storageCache.set(i,{gpuData:{id:i,type:0,buffer:e},originalSize:t}),he("verbose",()=>`[WebGPU] GpuDataManager.registerExternalBuffer(size=${t}) => id=${i}, registered.`),i}unregisterExternalBuffer(e){e!==void 0&&(this.storageCache.delete(e),he("verbose",()=>`[WebGPU] GpuDataManager.unregisterExternalBuffer() => id=${e}`))}create(e,t=GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC|GPUBufferUsage.COPY_DST){let r=ku(e),i,n=(t&GPUBufferUsage.STORAGE)===GPUBufferUsage.STORAGE,a=(t&GPUBufferUsage.UNIFORM)===GPUBufferUsage.UNIFORM;if(n||a){let o=(n?this.freeBuffers:this.freeUniformBuffers).get(r);o?o.length>0?i=o.pop():i=this.backend.device.createBuffer({size:r,usage:t}):i=this.backend.device.createBuffer({size:r,usage:t})}else i=this.backend.device.createBuffer({size:r,usage:t});let s={id:cn(),type:0,buffer:i};return this.storageCache.set(s.id,{gpuData:s,originalSize:Number(e)}),he("verbose",()=>`[WebGPU] GpuDataManager.create(size=${e}) => id=${s.id}`),s}get(e){return this.storageCache.get(e)?.gpuData}release(e){let t=typeof e=="bigint"?Number(e):e,r=this.storageCache.get(t);if(!r){if(this.storageCache.size===0)return 0;throw new Error("releasing data does not exist")}return he("verbose",()=>`[WebGPU] GpuDataManager.release(id=${t}), gpuDataId=${r.gpuData.id}`),this.storageCache.delete(t),this.buffersPending.push(r.gpuData.buffer),r.originalSize}async download(e,t){let r=this.storageCache.get(Number(e));if(!r)throw new Error("data does not exist");await aa(this.backend,r.gpuData.buffer,r.originalSize,t)}refreshPendingBuffers(){if(this.buffersPending.length!==0)if(this.backend.sessionStatus==="default"){for(let e of this.buffersPending){let t=pn.get(e.size);if((e.usage&GPUBufferUsage.STORAGE)===GPUBufferUsage.STORAGE){let r=this.freeBuffers.get(e.size)||[];t===void 0||r.length>=t?e.destroy():r.push(e)}else if((e.usage&GPUBufferUsage.UNIFORM)===GPUBufferUsage.UNIFORM){let r=this.freeUniformBuffers.get(e.size)||[];t===void 0||r.length>=t?e.destroy():r.push(e)}else e.destroy()}this.buffersPending=[]}else{let e=this.capturedPendingBuffers.get(this.backend.currentSessionId);e||(e=[],this.capturedPendingBuffers.set(this.backend.currentSessionId,e));for(let t of this.buffersPending)e.push(t);this.buffersPending=[]}}dispose(){this.freeBuffers.forEach(e=>{e.forEach(t=>{t.destroy()})}),this.freeUniformBuffers.forEach(e=>{e.forEach(t=>{t.destroy()})}),this.storageCache.forEach(e=>{e.gpuData.buffer.destroy()}),this.capturedPendingBuffers.forEach(e=>{e.forEach(t=>{t.destroy()})}),this.storageCache=new Map,this.freeBuffers=new Map,this.freeUniformBuffers=new Map,this.capturedPendingBuffers=new Map}onCreateSession(){this.sessionCount+=1}onReleaseSession(e){let t=this.capturedPendingBuffers.get(e);t&&(t.forEach(r=>{r.destroy()}),this.capturedPendingBuffers.delete(e)),this.sessionCount-=1,this.sessionCount===0&&(he("warning",()=>"[WebGPU] Clearing webgpu buffer cache"),this.storageCache.forEach(r=>{r.gpuData.buffer.destroy()}),this.storageCache=new Map)}},jc=(...e)=>new Iu(...e)}),Eu,ye,Ce=H(()=>{Eu=class{constructor(e){Object.assign(this,e)}get cacheKey(){return this.key||(this.key=Object.getOwnPropertyNames(this).sort().map(e=>`${this[e]}`).join(";")),this.key}},ye=e=>new Eu(e)}),rr,Hr,Oe,Be,ie,Ie,sa,Jt,kt,re,pr,U,te,Kc,Na,Cu,Xc,se=H(()=>{ne(),ae(),rr=64,Hr=(e,t)=>{if(t===3)throw new Error("vec3 has same alignment as vec4, use vec4 instead");switch(Number(e)){case 10:return t>1?`vec${t}<f16>`:"f16";case 1:return t>1?`vec${t}<f32>`:"f32";case 6:return t>1?`vec${t}<i32>`:"i32";case 12:return t>1?`vec${t}<u32>`:"u32";case 7:if(t>1)throw new Error("currently not supported vecX of uint64 yet");return["vec2<u32>","i32"];case 13:if(t>1)throw new Error("currently not supported vecX of uint64 yet");return["vec2<u32>","u32"];case 9:if(t!==4)throw new Error("bool must be vec4");return["u32","vec4<bool>"];case 22:return"i32";case 21:return"u32";default:throw new Error(`Unknown data type: ${e}`)}},Oe=(e,t=1)=>{let r=Hr(e,t);return typeof r=="string"?r:r[0]},Be=(e,t=1)=>{let r=Hr(e,t);return typeof r=="string"?r:r[1]},ie=(...e)=>{let t=[];return e.forEach(r=>{r.length!==0&&t.push({type:12,data:r},{type:12,data:R.computeStrides(r)})}),t},Ie=e=>e%4===0?4:e%2===0?2:1,sa=(e="f32",t,r="0")=>!t||t===1?`${e}(${r})`:`vec${t}<${e}>(${r})`,Jt=(e,t,r)=>e==="f32"?r:t===1?`f32(${r})`:`vec${t}<f32>(${r})`,kt=(e,t)=>t===4?`(${e}.x + ${e}.y + ${e}.z + ${e}.w)`:t===2?`(${e}.x + ${e}.y)`:t===3?`(${e}.x + ${e}.y + ${e}.z)`:e,re=(e,t,r,i)=>e.startsWith("uniforms.")&&r>4?typeof t=="string"?i==="f16"?`${e}[(${t}) / 8][(${t}) % 8 / 4][(${t}) % 8 % 4]`:`${e}[(${t}) / 4][(${t}) % 4]`:i==="f16"?`${e}[${Math.floor(t/8)}][${Math.floor(t%8/4)}][${t%8%4}]`:`${e}[${Math.floor(t/4)}][${t%4}]`:r>1?`${e}[${t}]`:e,pr=(e,t,r,i,n)=>{let a=typeof r=="number",s=a?r:r.length,o=[...new Array(s).keys()],l=s<2?"u32":s<=4?`vec${s}<u32>`:`array<u32, ${s}>`,d=Hr(t,n),p=typeof d=="string"?d:d[1],c=typeof d=="string"?d:d[0],f={indices:l,value:p,storage:c,tensor:t},g=q=>typeof q=="string"?q:`${q}u`,m={offsetToIndices:!1,indicesToOffset:!1,broadcastedIndicesToOffset:!1,set:!1,setByIndices:!1,get:!1,getByIndices:!1},_=a?"uniforms.":"",v=`${_}${e}_shape`,$=`${_}${e}_strides`,w="";for(let q=0;q<s-1;q++)w+=`
    let dim${q} = current / ${re($,q,s)};
    let rest${q} = current % ${re($,q,s)};
    indices[${q}] = dim${q};
    current = rest${q};
    `;w+=`indices[${s-1}] = current;`;let S=s<2?"":`
  fn o2i_${e}(offset: u32) -> ${f.indices} {
    var indices: ${f.indices};
    var current = offset;
    ${w}
    return indices;
  }`,x=q=>(m.offsetToIndices=!0,s<2?q:`o2i_${e}(${q})`),I=[];if(s>=2)for(let q=s-1;q>=0;q--)I.push(`${re($,q,s)} * (indices[${q}])`);let C=s<2?"":`
  fn i2o_${e}(indices: ${f.indices}) -> u32 {
    return ${I.join("+")};
  }`,z=q=>(m.indicesToOffset=!0,s<2?q:`i2o_${e}(${q})`),k=(...q)=>s===0?"0u":`${f.indices}(${q.map(g).join(",")})`,B=(q,ee)=>s<2?`${q}`:`${re(q,ee,s)}`,L=(q,ee,Q)=>s<2?`${q}=${Q};`:`${re(q,ee,s)}=${Q};`,j={},M=(q,ee)=>{m.broadcastedIndicesToOffset=!0;let Q=`${ee.name}broadcastedIndicesTo${e}Offset`;if(Q in j)return`${Q}(${q})`;let X=[];for(let be=s-1;be>=0;be--){let ze=ee.indicesGet("outputIndices",be+ee.rank-s);X.push(`${B($,be)} * (${ze} % ${B(v,be)})`)}return j[Q]=`fn ${Q}(outputIndices: ${ee.type.indices}) -> u32 {
             return ${X.length>0?X.join("+"):"0u"};
           }`,`${Q}(${q})`},W=(q,ee)=>(()=>{if(f.storage===f.value)return`${e}[${q}]=${ee};`;if(f.storage==="vec2<u32>"&&f.value==="i32")return`${e}[${q}]=vec2<u32>(u32(${ee}), select(0u, 0xFFFFFFFFu, ${ee} < 0));`;if(f.storage==="vec2<u32>"&&f.value==="u32")return`${e}[${q}]=vec2<u32>(u32(${ee}), 0u);`;if(f.storage==="u32"&&f.value==="vec4<bool>")return`${e}[${q}]=dot(vec4<u32>(0x1, 0x100, 0x10000, 0x1000000), vec4<u32>(${ee}));`;throw new Error(`not supported combination of storage type ${f.storage} and value type ${f.value} yet`)})(),O=q=>(()=>{if(f.storage===f.value)return`${e}[${q}]`;if(f.storage==="vec2<u32>"&&f.value==="i32")return`i32(${e}[${q}].x)`;if(f.storage==="vec2<u32>"&&f.value==="u32")return`u32(${e}[${q}].x)`;if(f.storage==="u32"&&f.value==="vec4<bool>")return`vec4<bool>(bool(${e}[${q}] & 0xFFu), bool(${e}[${q}] & 0xFF00u), bool(${e}[${q}] & 0xFF0000u), bool(${e}[${q}] & 0xFF000000u))`;throw new Error(`not supported combination of storage type ${f.storage} and value type ${f.value} yet`)})(),N=s<2?"":`
  fn get_${e}ByIndices(indices: ${f.indices}) -> ${p} {
    return ${O(`i2o_${e}(indices)`)};
  }`,G=s<2?"":(()=>{let q=o.map(Q=>`d${Q}: u32`).join(", "),ee=o.map(Q=>`d${Q}`).join(", ");return`
  fn get_${e}(${q}) -> ${p} {
    return get_${e}ByIndices(${k(ee)});
  }`})(),Y=(...q)=>{if(q.length!==s)throw new Error(`indices length must be ${s}`);let ee=q.map(g).join(",");return s===0?O("0u"):s===1?O(ee[0]):(m.get=!0,m.getByIndices=!0,m.indicesToOffset=!0,`get_${e}(${ee})`)},P=q=>s<2?O(q):(m.getByIndices=!0,m.indicesToOffset=!0,`get_${e}ByIndices(${q})`),V=s<2?"":`
  fn set_${e}ByIndices(indices: ${f.indices}, value: ${p}) {
    ${W(`i2o_${e}(indices)`,"value")}
  }`,Z=s<2?"":(()=>{let q=o.map(Q=>`d${Q}: u32`).join(", "),ee=o.map(Q=>`d${Q}`).join(", ");return`
  fn set_${e}(${q}, value: ${p}) {
    set_${e}ByIndices(${k(ee)}, value);
  }`})();return{impl:()=>{let q=[],ee=!1;return m.offsetToIndices&&(q.push(S),ee=!0),m.indicesToOffset&&(q.push(C),ee=!0),m.broadcastedIndicesToOffset&&(Object.values(j).forEach(Q=>q.push(Q)),ee=!0),m.set&&(q.push(Z),ee=!0),m.setByIndices&&(q.push(V),ee=!0),m.get&&(q.push(G),ee=!0),m.getByIndices&&(q.push(N),ee=!0),!a&&ee&&q.unshift(`const ${v} = ${f.indices}(${r.join(",")});`,`const ${$} = ${f.indices}(${R.computeStrides(r).join(",")});`),q.join(`
`)},type:f,offsetToIndices:x,indicesToOffset:z,broadcastedIndicesToOffset:M,indices:k,indicesGet:B,indicesSet:L,set:(...q)=>{if(q.length!==s+1)throw new Error(`indices length must be ${s}`);let ee=q[s];if(typeof ee!="string")throw new Error("value must be string");let Q=q.slice(0,s).map(g).join(",");return s===0?W("0u",ee):s===1?W(Q[0],ee):(m.set=!0,m.setByIndices=!0,m.indicesToOffset=!0,`set_${e}(${Q}, ${ee})`)},setByOffset:W,setByIndices:(q,ee)=>s<2?W(q,ee):(m.setByIndices=!0,m.indicesToOffset=!0,`set_${e}ByIndices(${q}, ${ee});`),get:Y,getByOffset:O,getByIndices:P,usage:i,name:e,strides:$,shape:v,rank:s}},U=(e,t,r,i=1)=>pr(e,t,r,"input",i),te=(e,t,r,i=1)=>pr(e,t,r,"output",i),Kc=(e,t,r)=>pr(e,t,r,"atomicOutput",1),Na=(e,t,r,i=1)=>pr(e,t,r,"internal",i),Cu=class{constructor(e,t){this.normalizedDispatchGroup=e,this.limits=t,this.internalVariables=[],this.variables=[],this.uniforms=[],this.variableIndex=0}guardAgainstOutOfBoundsWorkgroupSizes(e){return`if (global_idx >= ${typeof e=="number"?`${e}u`:e}) { return; }`}mainStart(e=rr){let t=typeof e=="number"?e:e[0],r=typeof e=="number"?1:e[1],i=typeof e=="number"?1:e[2];if(t>this.limits.maxComputeWorkgroupSizeX||r>this.limits.maxComputeWorkgroupSizeY||i>this.limits.maxComputeWorkgroupSizeZ)throw new Error(`workgroup size [${t}, ${r}, ${i}] exceeds the maximum workgroup size [${this.limits.maxComputeWorkgroupSizeX}, ${this.limits.maxComputeWorkgroupSizeY}, ${this.limits.maxComputeWorkgroupSizeZ}].`);if(t*r*i>this.limits.maxComputeInvocationsPerWorkgroup)throw new Error(`workgroup size [${t}, ${r}, ${i}] exceeds the maximum workgroup invocations ${this.limits.maxComputeInvocationsPerWorkgroup}.`);let n=this.normalizedDispatchGroup[1]===1&&this.normalizedDispatchGroup[2]===1,a=n?`@builtin(global_invocation_id) global_id : vec3<u32>,
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
`)}get variablesInfo(){if(this.uniforms.length===0)return;let e=t=>[12,10,1,6][["u32","f16","f32","i32"].indexOf(t)];return this.uniforms.map(t=>[e(t.type),t.length??1])}},Xc=(e,t)=>new Cu(e,t)}),zu,hn,Au,Mu,Ou,Ru,Fe,Zc,Yc,Tt=H(()=>{ne(),ae(),Ce(),se(),zu=(e,t)=>{if(!e||e.length!==1)throw new Error("Transpose requires 1 input.");if(t.length!==0&&t.length!==e[0].dims.length)throw new Error(`perm size ${t.length} does not match input rank ${e[0].dims.length}`)},hn=(e,t)=>t.length!==0?t:[...new Array(e).keys()].reverse(),Au=(e,t)=>R.sortBasedOnPerm(e,hn(e.length,t)),Mu=(e,t,r,i)=>{let n=`fn perm(i: ${i.type.indices}) -> ${r.type.indices} {
    var a: ${r.type.indices};`;for(let a=0;a<t;++a)n+=`a[${e[a]}]=i[${a}];`;return n+="return a;}"},Ou=(e,t)=>{let r=[],i=[];for(let n=0;n<e.length;++n)e[n]!==1&&r.push(e[n]),e[t[n]]!==1&&i.push(t[n]);return{newShape:r,newPerm:i}},Ru=(e,t)=>{let r=0;for(let i=0;i<e.length;++i)if(t[e[i]]!==1){if(e[i]<r)return!1;r=e[i]}return!0},Fe=(e,t)=>{let r=e.dataType,i=e.dims.length,n=hn(i,t),a=Au(e.dims,n),s=e.dims,o=a,l=i<2||Ru(n,e.dims),d;if(l)return d=m=>{let _=U("input",r,s,4),v=te("output",r,o,4);return`
  ${m.registerUniform("output_size","u32").declareVariables(_,v)}
  ${m.mainStart()}
    ${m.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
    output[global_idx] = input[global_idx];
  }`},{name:"TransposeCopy",shaderCache:{inputDependencies:["type"]},getRunData:()=>{let m=R.size(a);return{outputs:[{dims:a,dataType:e.dataType}],dispatchGroup:{x:Math.ceil(m/64/4)},programUniforms:[{type:12,data:Math.ceil(m/4)}]}},getShaderSource:d};let{newShape:p,newPerm:c}=Ou(e.dims,n),f=R.areEqual(c,[2,3,1]),g=R.areEqual(c,[3,1,2]);if(p.length===2||f||g){s=f?[p[0],p[1]*p[2]]:g?[p[0]*p[1],p[2]]:p,o=[s[1],s[0]];let m=16;return d=_=>{let v=U("a",r,s.length),$=te("output",r,o.length);return`
  ${_.registerUniform("output_size","u32").declareVariables(v,$)}
  var<workgroup> tile : array<array<${$.type.value}, ${m+1}>, ${m}>;
  ${_.mainStart([m,m,1])}
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
  }`},{name:"TransposeShared",shaderCache:{inputDependencies:["type"]},getRunData:()=>{let _=R.size(a);return{outputs:[{dims:a,dataType:e.dataType}],dispatchGroup:{x:Math.ceil(o[1]/m),y:Math.ceil(o[0]/m)},programUniforms:[{type:12,data:_},...ie(s,o)]}},getShaderSource:d}}return d=m=>{let _=U("a",r,s.length),v=te("output",r,o.length);return`
  ${m.registerUniform("output_size","u32").declareVariables(_,v)}

  ${Mu(n,i,_,v)}

  ${m.mainStart()}
    ${m.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}

    let indices = ${v.offsetToIndices("global_idx")};
    let aIndices = perm(indices);

    ${v.setByOffset("global_idx",_.getByIndices("aIndices"))}
  }`},{name:"Transpose",shaderCache:{hint:`${t}`,inputDependencies:["rank"]},getRunData:()=>{let m=R.size(a);return{outputs:[{dims:a,dataType:e.dataType}],dispatchGroup:{x:Math.ceil(m/64)},programUniforms:[{type:12,data:m},...ie(s,o)]}},getShaderSource:d}},Zc=(e,t)=>{zu(e.inputs,t.perm),e.compute(Fe(e.inputs[0],t.perm))},Yc=e=>ye({perm:e.perm})}),Nu,Bu,Du,Pu,Uu,Lu,qu,Wu,Gu,Fu,Ze,Qc,Jc,eh,th,rh,ih,nh,ah,sh,oh,z_=H(()=>{ne(),ae(),se(),Ba(),Tt(),Nu={max:"select(bestValue, candidate, candidate > bestValue)",min:"select(bestValue, candidate, candidate < bestValue)",mean:"bestValue + candidate",sum:"bestValue + candidate",prod:"bestValue * candidate",sumSquare:"bestValue + candidate * candidate",logSumExp:"bestValue + exp(candidate)",l1:"bestValue + abs(candidate)",l2:"bestValue + candidate * candidate",logSum:"bestValue + candidate"},Bu={max:"select(bestValue, candidate, candidate > bestValue)",min:"select(bestValue, candidate, candidate < bestValue)",mean:"bestValue + candidate",sum:"bestValue + candidate",prod:"bestValue * candidate",sumSquare:"bestValue + candidate",logSumExp:"bestValue + candidate",l1:"bestValue + candidate",l2:"bestValue + candidate",logSum:"bestValue + candidate"},Du={max:"_A[offset]",min:"_A[offset]",mean:"0",sum:"0",prod:"1",sumSquare:"0",logSumExp:"0",l1:"0",l2:"0",logSum:"0"},Pu={max:"bestValue",min:"bestValue",sum:"bestValue",prod:"bestValue",sumSquare:"bestValue",logSumExp:"log(bestValue)",l1:"bestValue",l2:"sqrt(bestValue)",logSum:"log(bestValue)"},Uu=(e,t)=>{let r=[];for(let i=t-e;i<t;++i)r.push(i);return r},Lu=(e,t)=>{let r=[],i=e.length;for(let a=0;a<i;a++)t.indexOf(a)===-1&&r.push(e[a]);let n=t.map(a=>e[a]);return[r,n]},qu=(e,t)=>{let r=e.length+t.length,i=[],n=0;for(let a=0;a<r;a++)t.indexOf(a)===-1?i.push(e[n++]):i.push(1);return i},Wu=(e,t)=>{for(let r=0;r<e.length;++r)if(e[e.length-r-1]!==t-1-r)return!1;return!0},Gu=(e,t)=>{let r=[];if(!Wu(e,t)){for(let i=0;i<t;++i)e.indexOf(i)===-1&&r.push(i);e.forEach(i=>r.push(i))}return r},Fu=(e,t,r,i,n,a,s)=>{let o=r[0].dims,l=R.size(a),d=R.size(s),p=U("_A",r[0].dataType,o),c=te("output",n,a),f=64;l===1&&(f=256);let g=`
          var<workgroup> aBestValues : array<f32, ${f}>;
       `,m=_=>`
        ${_.registerUniform("reduceSize","u32").declareVariables(p,c)}
        ${g}
        fn DIV_CEIL(a : u32, b : u32) -> u32 {
          return ((a - 1u) / b + 1u);
         }
         ${_.mainStart(f)}

          let outputIndex = global_idx / ${f};
          let offset = outputIndex * uniforms.reduceSize;

          var bestValue = f32(${Du[i]});
          let Length = uniforms.reduceSize;
          for (var k = local_idx; k < Length; k = k + ${f}) {
           let candidate = f32(${p.getByOffset("offset + k")});
           bestValue = ${Nu[i]};
          }
          aBestValues[local_idx] = bestValue;
          workgroupBarrier();

         var reduceSize = min(Length, ${f}u);
         for (var currentSize = reduceSize / 2u; reduceSize > 1u;
             currentSize = reduceSize / 2u) {
           let interval = DIV_CEIL(reduceSize, 2u);
           if (local_idx < currentSize) {
            let candidate = aBestValues[local_idx + interval];
            bestValue = ${Bu[i]};
            aBestValues[local_idx] = bestValue;
           }
           reduceSize = interval;
           workgroupBarrier();
         }

         if (local_idx == 0u) {
          ${c.setByOffset("outputIndex",`${i==="mean"?`${c.type.storage}(bestValue / f32(uniforms.reduceSize))`:`${c.type.storage}(${Pu[i]})`}`)};
         }
        }`;return{name:e,shaderCache:{hint:`${t};${f}`,inputDependencies:["type"]},getShaderSource:m,getRunData:()=>({outputs:[{dims:a,dataType:n}],dispatchGroup:{x:l},programUniforms:[{type:12,data:d}]})}},Ze=(e,t,r,i)=>{let n=e.inputs.length===1?r:oa(e.inputs,r),a=n.axes;a.length===0&&!n.noopWithEmptyAxes&&(a=e.inputs[0].dims.map((g,m)=>m));let s=R.normalizeAxes(a,e.inputs[0].dims.length),o=s,l=e.inputs[0],d=Gu(o,e.inputs[0].dims.length);d.length>0&&(l=e.compute(Fe(e.inputs[0],d),{inputs:[0],outputs:[-1]})[0],o=Uu(o.length,l.dims.length));let[p,c]=Lu(l.dims,o),f=p;n.keepDims&&(f=qu(p,s)),e.compute(Fu(t,n.cacheKey,[l],i,e.inputs[0].dataType,f,c),{inputs:[l]})},Qc=(e,t)=>{Ze(e,"ReduceMeanShared",t,"mean")},Jc=(e,t)=>{Ze(e,"ReduceL1Shared",t,"l1")},eh=(e,t)=>{Ze(e,"ReduceL2Shared",t,"l2")},th=(e,t)=>{Ze(e,"ReduceLogSumExpShared",t,"logSumExp")},rh=(e,t)=>{Ze(e,"ReduceMaxShared",t,"max")},ih=(e,t)=>{Ze(e,"ReduceMinShared",t,"min")},nh=(e,t)=>{Ze(e,"ReduceProdShared",t,"prod")},ah=(e,t)=>{Ze(e,"ReduceSumShared",t,"sum")},sh=(e,t)=>{Ze(e,"ReduceSumSquareShared",t,"sumSquare")},oh=(e,t)=>{Ze(e,"ReduceLogSumShared",t,"logSum")}}),Ye,Vu,pi,oa,Qe,Hu,ju,Ku,Xu,Zu,Yu,Qu,Ju,el,tl,Je,uh,lh,dh,ph,ch,hh,fh,mh,gh,yh,Ba=H(()=>{ne(),ae(),Ce(),se(),z_(),Ye=e=>{if(!e||e.length===0||e.length>2)throw new Error("Reduce op requires 1 or 2 inputs.");if(e.length===2&&e[1].dims.length!==1)throw new Error("Invalid axes input dims.")},Vu=e=>["","",`var value = ${e.getByIndices("input_indices")};`,""],pi=(e,t,r,i,n,a,s=!1,o=!1)=>{let l=[],d=r[0].dims,p=d.length,c=R.normalizeAxes(n,p),f=!o&&c.length===0;d.forEach((_,v)=>{f||c.indexOf(v)>=0?s&&l.push(1):l.push(_)});let g=l.length,m=R.size(l);return{name:e,shaderCache:t,getShaderSource:_=>{let v=[],$=U("_A",r[0].dataType,p),w=te("output",a,g),S=i($,w,c),x=S[2];for(let I=0,C=0;I<p;I++)f||c.indexOf(I)>=0?(s&&C++,x=`for(var j${I}: u32 = 0; j${I} < ${d[I]}; j${I}++) {
                  ${S[2].includes("last_index")?`let last_index = j${I};`:""}
                  ${$.indicesSet("input_indices",I,`j${I}`)}
                  ${x}
                }`):(v.push(`${$.indicesSet("input_indices",I,w.indicesGet("output_indices",C))};`),C++);return`

        ${_.registerUniform("output_size","u32").declareVariables($,w)}

        ${_.mainStart()}
          ${_.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
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
        }`},getRunData:()=>({outputs:[{dims:l,dataType:a}],dispatchGroup:{x:Math.ceil(m/64)},programUniforms:[{type:12,data:m},...ie(d,l)]})}},oa=(e,t)=>{let r=[];return e[1].dims[0]>0&&e[1].getBigInt64Array().forEach(i=>r.push(Number(i))),ye({axes:r,keepDims:t.keepDims,noopWithEmptyAxes:t.noopWithEmptyAxes})},Qe=(e,t,r,i)=>{let n=e.inputs,a=n.length===1?r:oa(n,r);e.compute(pi(t,{hint:a.cacheKey,inputDependencies:["rank"]},[n[0]],a.noopWithEmptyAxes&&a.axes.length===0?Vu:i,a.axes,n[0].dataType,a.keepDims,a.noopWithEmptyAxes),{inputs:[0]})},Hu=(e,t)=>{Ye(e.inputs),Qe(e,"ReduceLogSum",t,(r,i)=>[`var value = ${i.type.storage}(0);`,"",`value += ${r.getByIndices("input_indices")};`,"value = log(value);"])},ju=(e,t)=>{Ye(e.inputs),Qe(e,"ReduceL1",t,(r,i)=>[`var value = ${i.type.storage}(0);`,"",`value += abs(${r.getByIndices("input_indices")});`,""])},Ku=(e,t)=>{Ye(e.inputs),Qe(e,"ReduceL2",t,(r,i)=>[`var t = ${i.type.value}(0); var value = ${i.type.value}(0);`,"",`t = ${r.getByIndices("input_indices")}; value += (t * t);`,"value = sqrt(value);"])},Xu=(e,t)=>{Ye(e.inputs),Qe(e,"ReduceLogSumExp",t,(r,i)=>[`var value = ${i.type.storage}(0);`,"",`value += exp(${r.getByIndices("input_indices")});`,"value = log(value);"])},Zu=(e,t)=>{Ye(e.inputs),Qe(e,"ReduceMax",t,(r,i,n)=>{let a=[];for(let s=0;s<r.rank;s++)(n.indexOf(s)>=0||n.length===0)&&a.push(r.indicesSet("input_indices",s,0));return[`${a.join(`
`)}`,`var value = ${r.getByIndices("input_indices")};`,`value = max(value, ${r.getByIndices("input_indices")});`,""]})},Yu=(e,t)=>{Ye(e.inputs),Qe(e,"ReduceMean",t,(r,i,n)=>{let a=1;for(let s=0;s<r.rank;s++)(n.indexOf(s)>=0||n.length===0)&&(a*=e.inputs[0].dims[s]);return["var sum = f32(0);","",`sum += f32(${r.getByIndices("input_indices")});`,`let value = ${i.type.value}(sum / ${a});`]})},Qu=(e,t)=>{Ye(e.inputs),Qe(e,"ReduceMin",t,(r,i,n)=>{let a=[];for(let s=0;s<r.rank;s++)(n.indexOf(s)>=0||n.length===0)&&a.push(`input_indices[${s}] = 0;`);return[`${a.join(`
`)}`,`var value = ${r.getByIndices("input_indices")};`,`value = min(value, ${r.getByIndices("input_indices")});`,""]})},Ju=(e,t)=>{Ye(e.inputs),Qe(e,"ReduceProd",t,(r,i)=>[`var value = ${i.type.storage}(1);`,"",`value *= ${r.getByIndices("input_indices")};`,""])},el=(e,t)=>{Ye(e.inputs),Qe(e,"ReduceSum",t,(r,i)=>[`var value = ${i.type.storage}(0);`,"",`value += ${r.getByIndices("input_indices")};`,""])},tl=(e,t)=>{Ye(e.inputs),Qe(e,"ReduceSumSquare",t,(r,i)=>[`var t = ${i.type.value}(0); var value = ${i.type.value}(0);`,"",`t = ${r.getByIndices("input_indices")}; value += t * t;`,""])},Je=(e,t,r)=>{if(t.length===0)return r;let i=1,n=1;for(let a=0;a<t.length;a++)t.indexOf(a)===-1?i*=e[a]:n*=e[a];return n<32&&i>1024},uh=(e,t)=>{Je(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?Yu(e,t):Qc(e,t)},lh=(e,t)=>{Je(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?ju(e,t):Jc(e,t)},dh=(e,t)=>{Je(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?Ku(e,t):eh(e,t)},ph=(e,t)=>{Je(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?Xu(e,t):th(e,t)},ch=(e,t)=>{Je(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?Zu(e,t):rh(e,t)},hh=(e,t)=>{Je(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?Qu(e,t):ih(e,t)},fh=(e,t)=>{Je(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?Ju(e,t):nh(e,t)},mh=(e,t)=>{Je(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?el(e,t):ah(e,t)},gh=(e,t)=>{Je(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?tl(e,t):sh(e,t)},yh=(e,t)=>{Je(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?Hu(e,t):oh(e,t)}}),fn,_h,bh,ua,A_=H(()=>{ne(),Ce(),Ba(),fn=e=>{if(!e||e.length===0||e.length>2)throw new Error("ArgMinMaxOp op requires 1 or 2 inputs.");if(e[0].dataType!==1)throw new Error("Invalid input type.")},_h=(e,t)=>{fn(e.inputs);let r=(i,n,a)=>{let s=[];for(let o=0;o<i.rank;o++)(a.indexOf(o)>=0||a.length===0)&&s.push(`input_indices[${o}] = 0;`);return[`${s.join(`
`)}`,`var value = ${i.getByIndices("input_indices")};
var best_index : i32 = 0;`,`if (${i.getByIndices("input_indices")} ${t.selectLastIndex>0?"<=":"<"} value) {
         value = ${i.getByIndices("input_indices")};
         best_index = i32(last_index);
       }`,"",n.setByOffset("global_idx","best_index")]};e.compute(pi("ArgMin",{hint:t.cacheKey,inputDependencies:["rank"]},[e.inputs[0]],r,[t.axis],7,t.keepDims),{inputs:[0]})},bh=(e,t)=>{fn(e.inputs);let r=(i,n,a)=>{let s=[];for(let o=0;o<i.rank;o++)(a.indexOf(o)>=0||a.length===0)&&s.push(`input_indices[${o}] = 0;`);return[`${s.join(`
`)}`,`var value = ${i.getByIndices("input_indices")};
var best_index : i32 = 0;`,`if (${i.getByIndices("input_indices")} ${t.selectLastIndex>0?">=":">"} value) {
         value = ${i.getByIndices("input_indices")};
         best_index = i32(last_index);
       }`,"",n.setByOffset("global_idx","best_index")]};e.compute(pi("argMax",{hint:t.cacheKey,inputDependencies:["rank"]},[e.inputs[0]],r,[t.axis],7,t.keepDims),{inputs:[0]})},ua=e=>ye(e)}),rl,jr,il,nl,al,Tr,sl,wh,Da=H(()=>{ne(),ae(),Ra(),se(),rl=(e,t)=>{let r=e[0],i=e[1],n=e[2],a=e[3],s=e[4],o=e[5];if(s&&o)throw new Error("Attention cannot have both past and attention_bias");if(r.dims.length!==3)throw new Error('Input "input" must have 3 dimensions');let l=r.dims[0],d=r.dims[1],p=r.dims[2];if(n.dims.length!==1)throw new Error('Input "bias" is expected to have 1 dimensions');if(i.dims.length!==2)throw new Error('Input "weights" is expected to have 2 dimensions');if(i.dims[0]!==p)throw new Error("Input 1 dimension 0 should have same length as dimension 2 of input 0");if(n.dims[0]!==i.dims[1])throw new Error('Input "bias" dimension 0 should have same length as dimension 1 of input "weights"');let c=n.dims[0]/3,f=c,g=f;if(t.qkvHiddenSizes.length>0){if(t.qkvHiddenSizes.length!==3)throw new Error("qkv_hidden_sizes attribute should have 3 elements");for(let S of t.qkvHiddenSizes)if(S%t.numHeads!==0)throw new Error("qkv_hidden_sizes should be divisible by num_heads");c=t.qkvHiddenSizes[0],f=t.qkvHiddenSizes[1],g=t.qkvHiddenSizes[2]}let m=d;if(c!==f)throw new Error("qkv_hidden_sizes first element should be same as the second");if(n.dims[0]!==c+f+g)throw new Error('Input "bias" dimension 0 should have same length as sum of Q/K/V hidden sizes');let _=0;if(s){if(f!==g)throw new Error('Input "past" expect k_hidden_size == v_hidden_size');if(s.dims.length!==5)throw new Error('Input "past" must have 5 dimensions');if(s.dims[0]!==2)throw new Error('Input "past" first dimension must be 2');if(s.dims[1]!==l)throw new Error('Input "past" second dimension must be batch_size');if(s.dims[2]!==t.numHeads)throw new Error('Input "past" third dimension must be num_heads');if(s.dims[4]!==f/t.numHeads)throw new Error('Input "past" fifth dimension must be k_hidden_size / num_heads');t.pastPresentShareBuffer||(_=s.dims[3])}let v=m+_,$=-1,w=0;if(a)throw new Error("Mask not supported");if(s)throw new Error("past is not supported");if(o){if(o.dims.length!==4)throw new Error('Input "attention_bias" must have 4 dimensions');if(o.dims[0]!==l||o.dims[1]!==t.numHeads||o.dims[2]!==d||o.dims[3]!==v)throw new Error('Expect "attention_bias" shape (batch_size, num_heads, sequence_length, total_sequence_length)')}return{batchSize:l,sequenceLength:d,pastSequenceLength:_,kvSequenceLength:m,totalSequenceLength:v,maxSequenceLength:$,inputHiddenSize:p,hiddenSize:c,vHiddenSize:g,headSize:Math.floor(c/t.numHeads),vHeadSize:Math.floor(g/t.numHeads),numHeads:t.numHeads,isUnidirectional:!1,pastPresentShareBuffer:!1,maskFilterValue:t.maskFilterValue,maskType:w,scale:t.scale,broadcastResPosBias:!1,passPastInKv:!1,qkvFormat:1}},jr=(e,t,r)=>t&&e?`
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
    `,il=(e,t,r,i,n,a,s,o)=>{let l=Ie(s?1:a),d=64,p=a/l;p<d&&(d=32);let c=Math.ceil(a/l/d),f=[{type:12,data:t},{type:12,data:r},{type:12,data:i},{type:12,data:n},{type:12,data:p},{type:12,data:c}],g=Oe(e.dataType,l),m=Be(1,l),_=["type"];s&&_.push("type"),o&&_.push("type");let v=$=>{let w=te("x",e.dataType,e.dims,l),S=[w],x=s?U("seq_lens",s.dataType,s.dims):void 0;x&&S.push(x);let I=o?U("total_sequence_length_input",o.dataType,o.dims):void 0;I&&S.push(I);let C=Be(e.dataType),z=[{name:"batch_size",type:"u32"},{name:"num_heads",type:"u32"},{name:"past_sequence_length",type:"u32"},{name:"sequence_length",type:"u32"},{name:"total_sequence_length",type:"u32"},{name:"elements_per_thread",type:"u32"}];return`
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
  }`};return{name:"AttentionProbsSoftmax",shaderCache:{hint:`${d};${g};${l}`,inputDependencies:_},getShaderSource:v,getRunData:()=>({outputs:[],dispatchGroup:{x:1,y:n,z:t*r},programUniforms:f})}},nl=(e,t,r,i,n,a,s,o,l)=>{let d=s+a.kvSequenceLength,p=[a.batchSize,a.numHeads,a.sequenceLength,d],c=e>1&&i,f=a.kvNumHeads?a.kvNumHeads:a.numHeads,g=c?[a.batchSize,f,d,a.headSize]:void 0,m=a.nReps?a.nReps:1,_=a.scale===0?1/Math.sqrt(a.headSize):a.scale,v=Ie(a.headSize),$=a.headSize/v,w=12,S={x:Math.ceil(d/w),y:Math.ceil(a.sequenceLength/w),z:a.batchSize*a.numHeads},x=[{type:12,data:a.sequenceLength},{type:12,data:$},{type:12,data:d},{type:12,data:a.numHeads},{type:12,data:a.headSize},{type:1,data:_},{type:12,data:s},{type:12,data:a.kvSequenceLength},{type:12,data:m}],I=c&&i&&R.size(i.dims)>0,C=["type","type"];I&&C.push("type"),n&&C.push("type"),o&&C.push("type"),l&&C.push("type");let z=[{dims:p,dataType:t.dataType,gpuDataType:0}];c&&z.push({dims:g,dataType:t.dataType,gpuDataType:0});let k=B=>{let L=U("q",t.dataType,t.dims,v),j=U("key",r.dataType,r.dims,v),M=[L,j];if(I){let V=U("past_key",i.dataType,i.dims,v);M.push(V)}n&&M.push(U("attention_bias",n.dataType,n.dims));let W=o?U("seq_lens",o.dataType,o.dims):void 0;W&&M.push(W);let O=l?U("total_sequence_length_input",l.dataType,l.dims):void 0;O&&M.push(O);let N=te("output",t.dataType,p),G=[N];c&&G.push(te("present_key",t.dataType,g,v));let Y=Be(1,v),P=[{name:"M",type:"u32"},{name:"K",type:"u32"},{name:"N",type:"u32"},{name:"num_heads",type:"u32"},{name:"head_size",type:"u32"},{name:"alpha",type:"f32"},{name:"past_sequence_length",type:"u32"},{name:"kv_sequence_length",type:"u32"},{name:"n_reps",type:"u32"}];return`
  const TILE_SIZE = ${w}u;

  var<workgroup> tileQ: array<${L.type.storage}, ${w*w}>;
  var<workgroup> tileK: array<${L.type.storage}, ${w*w}>;
  ${B.registerUniforms(P).declareVariables(...M,...G)}
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
    ${jr(W,O,!0)}
    let absKvHeadIdx = batchIdx * kv_num_heads + kvHeadIdx;
    let qOffset = workgroup_id.z * uniforms.M * uniforms.K + m * uniforms.K;
    ${I&&c?"let pastKeyOffset = absKvHeadIdx * uniforms.past_sequence_length * uniforms.K;":""};
    let kOffset = absKvHeadIdx * uniforms.kv_sequence_length * uniforms.K;
    ${c?"let presentKeyOffset = absKvHeadIdx * uniforms.N * uniforms.K;":""}
    var value = ${Y}(0);
    for (var w: u32 = 0u; w < uniforms.K; w += TILE_SIZE) {
      if (global_id.y < uniforms.M && w + local_id.x < uniforms.K) {
        tileQ[TILE_SIZE * local_id.y + local_id.x] = q[qOffset + local_id.y * uniforms.K + w + local_id.x];
      }
      if (n + local_id.y < uniforms.N && w + local_id.x < uniforms.K) {
        var idx = TILE_SIZE * local_id.y + local_id.x;
      ${I&&c?`
              if (n + local_id.y < past_sequence_length) {
                tileK[idx] = past_key[pastKeyOffset + (n + local_id.y) * uniforms.K + w + local_id.x];
              } else if (n + local_id.y - past_sequence_length < uniforms.kv_sequence_length) {
                tileK[idx] = key[kOffset + (n + local_id.y - past_sequence_length) * uniforms.K + w + local_id.x];
              }`:`
          if (n + local_id.y < uniforms.kv_sequence_length) {
            tileK[idx] = key[kOffset + (n + local_id.y) * uniforms.K + w + local_id.x];
          }`}
      ${c?`if (n + local_id.y < present_sequence_length) {
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
        output[outputIdx] = ${N.type.value} (sum * uniforms.alpha) + ${n?"attention_bias[outputIdx]":"0.0"};
    }
  }`};return{name:"AttentionProbs",shaderCache:{hint:`${v};${n!==void 0};${i!==void 0};${e}`,inputDependencies:C},getRunData:()=>({outputs:z,dispatchGroup:S,programUniforms:x}),getShaderSource:k}},al=(e,t,r,i,n,a,s=void 0,o=void 0)=>{let l=a+n.kvSequenceLength,d=n.nReps?n.nReps:1,p=n.vHiddenSize*d,c=e>1&&i,f=n.kvNumHeads?n.kvNumHeads:n.numHeads,g=c?[n.batchSize,f,l,n.headSize]:void 0,m=[n.batchSize,n.sequenceLength,p],_=12,v={x:Math.ceil(n.vHeadSize/_),y:Math.ceil(n.sequenceLength/_),z:n.batchSize*n.numHeads},$=[{type:12,data:n.sequenceLength},{type:12,data:l},{type:12,data:n.vHeadSize},{type:12,data:n.numHeads},{type:12,data:n.headSize},{type:12,data:p},{type:12,data:a},{type:12,data:n.kvSequenceLength},{type:12,data:d}],w=c&&i&&R.size(i.dims)>0,S=["type","type"];w&&S.push("type"),s&&S.push("type"),o&&S.push("type");let x=[{dims:m,dataType:t.dataType,gpuDataType:0}];c&&x.push({dims:g,dataType:t.dataType,gpuDataType:0});let I=C=>{let z=U("probs",t.dataType,t.dims),k=U("v",r.dataType,r.dims),B=[z,k];w&&B.push(U("past_value",i.dataType,i.dims));let L=s?U("seq_lens",s.dataType,s.dims):void 0;s&&B.push(L);let j=o?U("total_sequence_length_input",o.dataType,o.dims):void 0;o&&B.push(j);let M=[te("output",t.dataType,m)];c&&M.push(te("present_value",t.dataType,g));let W=[{name:"M",type:"u32"},{name:"K",type:"u32"},{name:"N",type:"u32"},{name:"num_heads",type:"u32"},{name:"head_size",type:"u32"},{name:"v_hidden_size",type:"u32"},{name:"past_sequence_length",type:"u32"},{name:"kv_sequence_length",type:"u32"},{name:"n_reps",type:"u32"}];return`
  const TILE_SIZE = ${_}u;
  var<workgroup> tileQ: array<${z.type.value}, ${_*_}>;
  var<workgroup> tileV: array<${z.type.value}, ${_*_}>;
  ${C.registerUniforms(W).declareVariables(...B,...M)}
  ${C.mainStart([_,_,1])}
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
   ${w&&c?"let pastValueOffset = absKvHeadIdx * uniforms.N * uniforms.past_sequence_length + n;":""};
   let vOffset = absKvHeadIdx * uniforms.N * uniforms.kv_sequence_length + n;
   ${c?"let presentValueOffset = absKvHeadIdx * uniforms.N * uniforms.K + n;":""}
   var value = ${z.type.storage}(0);
   for (var w: u32 = 0u; w < uniforms.K; w += TILE_SIZE) {
      if (m < uniforms.M && w + local_id.x < uniforms.K) {
        tileQ[TILE_SIZE * local_id.y + local_id.x] = probs[offsetA + w + local_id.x];
      }
      if (n < uniforms.N && w + local_id.y < uniforms.K) {
        var idx = TILE_SIZE * local_id.y + local_id.x;
        ${w&&c?`
        if (w + local_id.y < past_sequence_length) {
          tileV[idx] = past_value[pastValueOffset + (w + local_id.y) * uniforms.N];
        } else if (w + local_id.y - past_sequence_length < uniforms.kv_sequence_length) {
          tileV[idx] = v[vOffset + (w + local_id.y - past_sequence_length) * uniforms.N];
        }
      `:`
            if (w + local_id.y < uniforms.kv_sequence_length) {
              tileV[idx] = v[vOffset + (w + local_id.y) * uniforms.N];
            }`}
        ${c?`
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
  }`};return{name:"AttentionScore",shaderCache:{hint:`${i!==void 0};${e}`,inputDependencies:S},getRunData:()=>({outputs:x,dispatchGroup:v,programUniforms:$}),getShaderSource:I}},Tr=(e,t,r,i,n,a,s,o,l,d,p=void 0,c=void 0)=>{let f=Math.min(e.outputCount,1+(s?1:0)+(o?1:0)),g=f>1?s:void 0,m=f>1?o:void 0,_=f>1?d.pastSequenceLength:0,v=_+d.kvSequenceLength,$=l&&R.size(l.dims)>0?l:void 0,w=[t,r];g&&R.size(g.dims)>0&&w.push(g),$&&w.push($),p&&w.push(p),c&&w.push(c);let S=e.compute(nl(f,t,r,g,$,d,_,p,c),{inputs:w,outputs:f>1?[-1,1]:[-1]})[0];e.compute(il(S,d.batchSize,d.numHeads,_,d.sequenceLength,v,p,c),{inputs:p&&c?[S,p,c]:[S],outputs:[]});let x=[S,i];m&&R.size(m.dims)>0&&x.push(m),p&&x.push(p),c&&x.push(c),e.compute(al(f,S,i,m,d,_,p,c),{inputs:x,outputs:f>1?[0,2]:[0]})},sl=(e,t)=>{let r=[t.batchSize,t.numHeads,t.sequenceLength,t.headSize],i=t.sequenceLength,n=t.inputHiddenSize,a=t.headSize,s=12,o={x:Math.ceil(t.headSize/s),y:Math.ceil(t.sequenceLength/s),z:t.batchSize*t.numHeads},l=[e.inputs[0],e.inputs[1],e.inputs[2]],d=[{type:12,data:i},{type:12,data:n},{type:12,data:a},{type:12,data:t.numHeads},{type:12,data:t.headSize},{type:12,data:t.hiddenSize},{type:12,data:t.hiddenSize+t.hiddenSize+t.vHiddenSize}],p=c=>{let f=te("output_q",l[0].dataType,r),g=te("output_k",l[0].dataType,r),m=te("output_v",l[0].dataType,r),_=U("input",l[0].dataType,l[0].dims),v=U("weight",l[1].dataType,l[1].dims),$=U("bias",l[2].dataType,l[2].dims),w=_.type.storage,S=[{name:"M",type:"u32"},{name:"K",type:"u32"},{name:"N",type:"u32"},{name:"num_heads",type:"u32"},{name:"head_size",type:"u32"},{name:"hidden_size",type:"u32"},{name:"ldb",type:"u32"}];return`
  const TILE_SIZE = ${s}u;
  var<workgroup> tileInput: array<${w}, ${s*s}>;
  var<workgroup> tileWeightQ: array<${w}, ${s*s}>;
  var<workgroup> tileWeightK: array<${w}, ${s*s}>;
  var<workgroup> tileWeightV: array<${w}, ${s*s}>;
  ${c.registerUniforms(S).declareVariables(_,v,$,f,g,m)}
  ${c.mainStart([s,s,1])}
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
  }`};return e.compute({name:"AttentionPrepare",shaderCache:{inputDependencies:["type","type","type"]},getRunData:()=>({outputs:[{dims:r,dataType:e.inputs[0].dataType,gpuDataType:0},{dims:r,dataType:e.inputs[0].dataType,gpuDataType:0},{dims:r,dataType:e.inputs[0].dataType,gpuDataType:0}],dispatchGroup:o,programUniforms:d}),getShaderSource:p},{inputs:l,outputs:[-1,-1,-1]})},wh=(e,t)=>{let r=rl(e.inputs,t),[i,n,a]=sl(e,r);return Tr(e,i,n,a,e.inputs[4],void 0,void 0,void 0,e.inputs[5],r)}}),ol,ul,ll,$h,M_=H(()=>{Ke(),ne(),ae(),Ce(),se(),ol=(e,t)=>{if(!e||e.length!==5)throw new Error("BatchNormalization requires 5 inputs");let r=(i,n,a)=>{let s=n.length;if(s!==i.length)throw new Error(`${a}: num dimensions != ${s}`);n.forEach((o,l)=>{if(o!==i[l])throw new Error(`${a}: dim[${l}] do not match`)})};if(e[0].dims.length>1){let i=t.format==="NHWC"?t.spatial?e[0].dims.slice(-1):e[0].dims.slice(-1).concat(e[0].dims.slice(1,e[0].dims.length-1)):e[0].dims.slice(1,t.spatial?2:void 0);r(e[1].dims,i,"Invalid input scale"),r(e[2].dims,i,"Invalid input B"),r(e[3].dims,i,"Invalid input mean"),r(e[4].dims,i,"Invalid input var")}else r(e[1].dims,[1],"Invalid input scale"),r(e[2].dims,[1],"Invalid input B"),r(e[3].dims,[1],"Invalid input mean"),r(e[4].dims,[1],"Invalid input var")},ul=(e,t)=>{let{epsilon:r,spatial:i,format:n}=t,a=e[0].dims,s=i?Ie(a[a.length-1]):1,o=n==="NHWC"&&a.length>1?s:1,l=R.size(a)/s,d=i,p=d?a.length:a,c=U("x",e[0].dataType,e[0].dims,s),f=U("scale",e[1].dataType,e[1].dims,o),g=U("bias",e[2].dataType,e[2].dims,o),m=U("inputMean",e[3].dataType,e[3].dims,o),_=U("inputVar",e[4].dataType,e[4].dims,o),v=te("y",e[0].dataType,p,s),$=()=>{let S="";if(i)S=`let cOffset = ${a.length===1?"0u":n==="NHWC"?`outputIndices[${a.length-1}] / ${s}`:"outputIndices[1]"};`;else if(n==="NCHW")S=`
            ${v.indicesSet("outputIndices","0","0")}
            let cOffset = ${v.indicesToOffset("outputIndices")};`;else{S=`var cIndices = ${f.type.indices}(0);
                       cIndices[0] = outputIndices[${a.length-1}];`;for(let x=1;x<f.rank;x++)S+=`cIndices[${x}] = outputIndices[${x}];`;S+=`let cOffset = ${f.indicesToOffset("cIndices")};`}return S},w=S=>`
  const epsilon = ${r};
  ${S.registerUniform("outputSize","u32").declareVariables(c,f,g,m,_,v)}
  ${S.mainStart()}
  ${S.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}
    var outputIndices = ${v.offsetToIndices(`global_idx * ${s}`)};
    ${$()}
    let scale = ${f.getByOffset("cOffset")};
    let bias = ${g.getByOffset("cOffset")};
    let inputMean = ${m.getByOffset("cOffset")};
    let inputVar = ${_.getByOffset("cOffset")};
    let x = ${c.getByOffset("global_idx")};
    let value = (x - inputMean) * inverseSqrt(inputVar + epsilon) * scale + bias;
    ${v.setByOffset("global_idx","value")}
  }`;return{name:"BatchNormalization",shaderCache:{hint:`${t.epsilon}_${t.format}_${i}_${s}`,inputDependencies:d?["rank","type","type","type","type"]:void 0},getShaderSource:w,getRunData:()=>({outputs:[{dims:e[0].dims,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(l/64)},programUniforms:d?[{type:12,data:l},...ie(a)]:[{type:12,data:l}]})}},ll=e=>ye(e),$h=(e,t)=>{let{inputs:r,outputCount:i}=e,n=ll({...t,outputCount:i});if($e.webgpu.validateInputContent&&ol(r,n),t.trainingMode)throw new Error("BatchNormalization trainingMode is not supported yet.");e.compute(ul(r,n))}}),dl,pl,vh,O_=H(()=>{ae(),se(),dl=e=>{if(e[0].dims.length!==3)throw new Error("input should have 3 dimensions");if(![320,640,1280].includes(e[0].dims[2]))throw new Error("number of channels should be 320, 640 or 1280");if(e[1].dims.length!==1)throw new Error("bias is expected to have 1 dimensions");if(e[0].dims[2]!==e[1].dims[0])throw new Error("last dimension of input and bias are not the same")},pl=e=>{let t=e[0].dims,r=e[0].dims[2],i=R.size(t)/4,n=e[0].dataType,a=U("input",n,t,4),s=U("bias",n,[r],4),o=U("residual",n,t,4),l=te("output",n,t,4);return{name:"BiasAdd",getRunData:()=>({outputs:[{dims:t,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(i/64)}}),getShaderSource:d=>`
  const channels = ${r}u / 4;
  ${d.declareVariables(a,s,o,l)}

  ${d.mainStart()}
    ${d.guardAgainstOutOfBoundsWorkgroupSizes(i)}
    let value = ${a.getByOffset("global_idx")}
      + ${s.getByOffset("global_idx % channels")} + ${o.getByOffset("global_idx")};
    ${l.setByOffset("global_idx","value")}
  }`}},vh=e=>{dl(e.inputs),e.compute(pl(e.inputs))}}),cl,ge,xh,Sh,kh,Th,Ih,Eh,Ch,zh,Ah,hl,Mh,Oh,Rh,Nh,$r,Bh,ni,Dh,Ph,Uh,Lh,qh,Wh,Gh,Fh,Vh,Hh,jh,Kh,Xh,Zh,Yh,Qh,mn,Jh,la,da,ef,tf,rf,fl,ml,nf,Pa=H(()=>{ne(),ae(),Ce(),se(),cl=(e,t,r,i,n,a,s)=>{let o=Math.ceil(t/4),l="";typeof n=="string"?l=`${n}(a)`:l=n("a");let d=U("inputData",r,[o],4),p=te("outputData",i,[o],4),c=[{name:"vec_size",type:"u32"}];return s&&c.push(...s),`
      ${e.registerUniforms(c).declareVariables(d,p)}

  ${a??""}

  ${e.mainStart()}
    ${e.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.vec_size")}

    let a = ${d.getByOffset("global_idx")};
    ${p.setByOffset("global_idx",l)}
  }`},ge=(e,t,r,i,n,a=e.dataType,s,o)=>{let l=[{type:12,data:Math.ceil(R.size(e.dims)/4)}];return s&&l.push(...s),{name:t,shaderCache:{hint:n,inputDependencies:["type"]},getShaderSource:d=>cl(d,R.size(e.dims),e.dataType,a,r,i,o),getRunData:d=>({outputs:[{dims:e.dims,dataType:a}],dispatchGroup:{x:Math.ceil(R.size(d[0].dims)/64/4)},programUniforms:l})}},xh=e=>{e.compute(ge(e.inputs[0],"Abs","abs"))},Sh=e=>{e.compute(ge(e.inputs[0],"Acos","acos"))},kh=e=>{e.compute(ge(e.inputs[0],"Acosh","acosh"))},Th=e=>{e.compute(ge(e.inputs[0],"Asin","asin"))},Ih=e=>{e.compute(ge(e.inputs[0],"Asinh","asinh"))},Eh=e=>{e.compute(ge(e.inputs[0],"Atan","atan"))},Ch=e=>{e.compute(ge(e.inputs[0],"Atanh","atanh"))},zh=e=>ye(e),Ah=(e,t)=>{let r;switch(t.to){case 10:r="vec4<f16>";break;case 1:r="vec4<f32>";break;case 12:r="vec4<u32>";break;case 6:r="vec4<i32>";break;case 9:r="vec4<bool>";break;default:throw new RangeError(`not supported type (specified in attribute 'to' from 'Cast' operator): ${t.to}`)}e.compute(ge(e.inputs[0],"Cast",r,void 0,t.cacheKey,t.to))},hl=e=>{let t,r,i=e.length>=2&&e[1].data!==0,n=e.length>=3&&e[2].data!==0;switch(e[0].dataType){case 1:t=i?e[1].getFloat32Array()[0]:-34028234663852886e22,r=n?e[2].getFloat32Array()[0]:34028234663852886e22;break;case 10:t=i?e[1].getUint16Array()[0]:64511,r=n?e[2].getUint16Array()[0]:31743;break;default:throw new Error("Unsupport data type")}return ye({min:t,max:r})},Mh=(e,t)=>{let r=t||hl(e.inputs),i=Be(e.inputs[0].dataType);e.compute(ge(e.inputs[0],"Clip",n=>`clamp(${n}, vec4<${i}>(uniforms.min), vec4<${i}>(uniforms.max))`,void 0,r.cacheKey,void 0,[{type:e.inputs[0].dataType,data:r.min},{type:e.inputs[0].dataType,data:r.max}],[{name:"min",type:i},{name:"max",type:i}]),{inputs:[0]})},Oh=e=>{e.compute(ge(e.inputs[0],"Ceil","ceil"))},Rh=e=>{e.compute(ge(e.inputs[0],"Cos","cos"))},Nh=e=>{e.compute(ge(e.inputs[0],"Cosh","cosh"))},$r=e=>ye(e),Bh=(e,t)=>{let r=Be(e.inputs[0].dataType);e.compute(ge(e.inputs[0],"Elu",i=>`elu_vf32(${i})`,`
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
}`,Dh=e=>{let t=Be(e.inputs[0].dataType);e.compute(ge(e.inputs[0],"Erf",r=>`erf_vf32(${r})`,ni(t)))},Ph=e=>{e.compute(ge(e.inputs[0],"Exp","exp"))},Uh=e=>{e.compute(ge(e.inputs[0],"Floor","floor"))},Lh=e=>{let t=Be(e.inputs[0].dataType);e.compute(ge(e.inputs[0],"Gelu",r=>`0.5 * ${r} * (1.0 + erf_vf32(${r} * 0.7071067811865475))`,ni(t)))},qh=(e,t)=>{let r=Be(e.inputs[0].dataType);e.compute(ge(e.inputs[0],"LeakyRelu",i=>`select(leaky_relu_alpha_ * ${i}, ${i}, ${i} >= vec4<${r}>(0.0))`,`const leaky_relu_alpha_ = ${r}(${t.alpha});`,t.cacheKey))},Wh=e=>{e.compute(ge(e.inputs[0],"Not",t=>`!${t}`))},Gh=e=>{e.compute(ge(e.inputs[0],"Neg",t=>`-${t}`))},Fh=e=>{e.compute(ge(e.inputs[0],"Reciprocal",t=>`1.0/${t}`))},Vh=e=>{let t=Be(e.inputs[0].dataType);e.compute(ge(e.inputs[0],"Relu",r=>`select(vec4<${t}>(0.0), ${r}, ${r} > vec4<${t}>(0.0))`))},Hh=e=>{e.compute(ge(e.inputs[0],"Sigmoid",t=>`(1.0 / (1.0 + exp(-${t})))`))},jh=e=>ye(e),Kh=(e,t)=>{let r=Be(e.inputs[0].dataType);e.compute(ge(e.inputs[0],"HardSigmoid",i=>`max(vec4<${r}>(0.0), min(vec4<${r}>(1.0), ${t.alpha} * ${i} + vec4<${r}>(${t.beta})))`,void 0,t.cacheKey))},Xh=e=>{e.compute(ge(e.inputs[0],"Sin","sin"))},Zh=e=>{e.compute(ge(e.inputs[0],"Sinh","sinh"))},Yh=e=>{e.compute(ge(e.inputs[0],"Sqrt","sqrt"))},Qh=e=>{e.compute(ge(e.inputs[0],"Tan","tan"))},mn=e=>`sign(${e}) * (1 - exp(-2 * abs(${e}))) / (1 + exp(-2 * abs(${e})))`,Jh=e=>{e.compute(ge(e.inputs[0],"Tanh",mn))},la=(e="f32")=>`
const fast_gelu_a: ${e} = 0.5;
const fast_gelu_b: ${e} = 0.7978845608028654;
const fast_gelu_c: ${e} = 0.035677408136300125;

fn tanh_v(v: vec4<${e}>) -> vec4<${e}> {
  return ${mn("v")};
}
`,da=e=>`(fast_gelu_a + fast_gelu_a * tanh_v(${e} * (fast_gelu_c * ${e} * ${e} + fast_gelu_b))) * ${e}`,ef=e=>{let t=Be(e.inputs[0].dataType);e.compute(ge(e.inputs[0],"FastGelu",da,la(t),void 0,e.inputs[0].dataType))},tf=(e,t)=>{let r=Be(e.inputs[0].dataType);return e.compute(ge(e.inputs[0],"ThresholdedRelu",i=>`select(vec4<${r}>(0.0), ${i}, ${i} > thresholded_relu_alpha_)`,`const thresholded_relu_alpha_ = vec4<${r}>(${t.alpha});`,t.cacheKey)),0},rf=e=>{e.compute(ge(e.inputs[0],"Log","log"))},fl=(e,t)=>`
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
`,ml=e=>`quick_gelu_impl(${e})`,nf=(e,t)=>{let r=Be(e.inputs[0].dataType);e.compute(ge(e.inputs[0],"QuickGelu",ml,fl(r,t.alpha),t.cacheKey,e.inputs[0].dataType))}}),gl,yl,af,R_=H(()=>{ae(),se(),Pa(),gl=e=>{if(e[0].dims.length!==3)throw new Error("input should have 3 dimensions");if(![2560,5120,10240].includes(e[0].dims[2]))throw new Error("hidden state should be 2560, 5120 or 10240");if(e[1].dims.length!==1)throw new Error("bias is expected to have 1 dimensions");if(e[0].dims[2]!==e[1].dims[0])throw new Error("last dimension of input and bias are not the same")},yl=e=>{let t=e[0].dims.slice();t[2]=t[2]/2;let r=U("input",e[0].dataType,e[0].dims,4),i=U("bias",e[0].dataType,[e[0].dims[2]],4),n=te("output",e[0].dataType,t,4),a=R.size(t)/4,s=Oe(e[0].dataType);return{name:"BiasSplitGelu",getRunData:()=>({outputs:[{dims:t,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(a/64)}}),getShaderSource:o=>`
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
  }`}},af=e=>{gl(e.inputs),e.compute(yl(e.inputs))}}),_l,bl,et,sf,of,uf,lf,df,pf,cf,hf,ff,mf,N_=H(()=>{ne(),ae(),se(),_l=(e,t,r,i,n,a,s,o,l,d,p,c)=>{let f,g;typeof o=="string"?f=g=(w,S)=>`${o}((${w}),(${S}))`:typeof o=="function"?f=g=o:(f=o.scalar,g=o.vector);let m=te("outputData",p,i.length,4),_=U("aData",l,t.length,4),v=U("bData",d,r.length,4),$;if(n)if(a){let w=R.size(t)===1,S=R.size(r)===1,x=t.length>0&&t[t.length-1]%4===0,I=r.length>0&&r[r.length-1]%4===0;w||S?$=m.setByOffset("global_idx",g(w?`${_.type.value}(${_.getByOffset("0")}.x)`:_.getByOffset("global_idx"),S?`${v.type.value}(${v.getByOffset("0")}.x)`:v.getByOffset("global_idx"))):$=`
            let outputIndices = ${m.offsetToIndices("global_idx * 4u")};
            let offsetA = ${_.broadcastedIndicesToOffset("outputIndices",m)};
            let offsetB = ${v.broadcastedIndicesToOffset("outputIndices",m)};
            ${m.setByOffset("global_idx",g(s||x?_.getByOffset("offsetA / 4u"):`${_.type.value}(${_.getByOffset("offsetA / 4u")}[offsetA % 4u])`,s||I?v.getByOffset("offsetB / 4u"):`${v.type.value}(${v.getByOffset("offsetB / 4u")}[offsetB % 4u])`))}
          `}else $=m.setByOffset("global_idx",g(_.getByOffset("global_idx"),v.getByOffset("global_idx")));else{if(!a)throw new Error("no necessary to use scalar implementation for element-wise binary op implementation.");let w=(S,x,I="")=>{let C=`aData[indexA${x}][componentA${x}]`,z=`bData[indexB${x}][componentB${x}]`;return`
            let outputIndices${x} = ${m.offsetToIndices(`global_idx * 4u + ${x}u`)};
            let offsetA${x} = ${_.broadcastedIndicesToOffset(`outputIndices${x}`,m)};
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
        ${e.registerUniform("vec_size","u32").declareVariables(_,v,m)}

        ${c??""}

        ${e.mainStart()}
        ${e.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.vec_size")}
        ${$}
      }`},bl=(e,t,r,i,n,a,s=r.dataType)=>{let o=r.dims.map(Number),l=i.dims.map(Number),d=!R.areEqual(o,l),p=o,c=R.size(o),f=!1,g=!1,m=[d];if(d){let _=tr.calcShape(o,l,!1);if(!_)throw new Error("Can't perform binary op on the given tensors");p=_.slice(),c=R.size(p);let v=R.size(o)===1,$=R.size(l)===1,w=o.length>0&&o[o.length-1]%4===0,S=l.length>0&&l[l.length-1]%4===0;m.push(v),m.push($),m.push(w),m.push(S);let x=1;for(let I=1;I<p.length;I++){let C=o[o.length-I],z=l[l.length-I];if(C===z)x*=C;else break}x%4===0?(g=!0,f=!0):(v||$||w||S)&&(f=!0)}else f=!0;return m.push(f),{name:e,shaderCache:{hint:t+m.map(_=>_.toString()).join("_"),inputDependencies:["rank","rank"]},getShaderSource:_=>_l(_,o,l,p,f,d,g,n,r.dataType,i.dataType,s,a),getRunData:()=>({outputs:[{dims:p,dataType:s}],dispatchGroup:{x:Math.ceil(c/64/4)},programUniforms:[{type:12,data:Math.ceil(R.size(p)/4)},...ie(o,l,p)]})}},et=(e,t,r,i,n,a)=>{e.compute(bl(t,n??"",e.inputs[0],e.inputs[1],r,i,a))},sf=e=>{et(e,"Add",(t,r)=>`${t}+${r}`)},of=e=>{et(e,"Div",(t,r)=>`${t}/${r}`)},uf=e=>{et(e,"Equal",{scalar:(t,r)=>`u32(${t}==${r})`,vector:(t,r)=>`vec4<u32>(${t}==${r})`},void 0,void 0,9)},lf=e=>{et(e,"Mul",(t,r)=>`${t}*${r}`)},df=e=>{let t=U("input",e.inputs[0].dataType,e.inputs[0].dims).type.value;et(e,"Pow",{scalar:(r,i)=>`pow_custom(${r},${i})`,vector:(r,i)=>`pow_vector_custom(${r},${i})`},`
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
      `)},pf=e=>{et(e,"Sub",(t,r)=>`${t}-${r}`)},cf=e=>{et(e,"Greater",{scalar:(t,r)=>`u32(${t}>${r})`,vector:(t,r)=>`vec4<u32>(${t}>${r})`},void 0,void 0,9)},hf=e=>{et(e,"Less",{scalar:(t,r)=>`u32(${t}<${r})`,vector:(t,r)=>`vec4<u32>(${t}<${r})`},void 0,void 0,9)},ff=e=>{et(e,"GreaterOrEqual",{scalar:(t,r)=>`u32(${t}>=${r})`,vector:(t,r)=>`vec4<u32>(${t}>=${r})`},void 0,void 0,9)},mf=e=>{et(e,"LessOrEqual",{scalar:(t,r)=>`u32(${t}<=${r})`,vector:(t,r)=>`vec4<u32>(${t}<=${r})`},void 0,void 0,9)}}),wl,$l,vl,xl,gf,yf,B_=H(()=>{ne(),ae(),Ce(),se(),wl=(e,t)=>{if(!e||e.length<1)throw new Error("too few inputs");let r=0,i=e[r],n=i.dataType,a=i.dims.length;e.forEach((s,o)=>{if(o!==r){if(s.dataType!==n)throw new Error("input tensors should be one type");if(s.dims.length!==a)throw new Error("input tensors should have the same shape");s.dims.forEach((l,d)=>{if(d!==t&&l!==i.dims[d])throw new Error("non concat dimensions must match")})}})},$l=(e,t)=>`
  fn calculateInputIndex(index: u32) -> u32 {
    let sizeInConcatAxis = array<u32, ${e}u>(${t});
    for (var i: u32 = 0u; i < ${e}; i += 1u ) {
      if (index < sizeInConcatAxis[i]) {
        return i;
      }
    }
    return ${e}u;
  }`,vl=(e,t)=>{let r=e.length,i=[];for(let n=0;n<r;++n){let a=t.setByOffset("global_idx",e[n].getByIndices("indices"));r===1?i.push(a):n===0?i.push(`if (inputIndex == ${n}u) { ${a} }`):n===r-1?i.push(`else { ${a} }`):i.push(`else if (inputIndex == ${n}) { ${a} }`)}return i.join(`
`)},xl=(e,t,r,i)=>{let n=R.size(r),a=new Array(e.length),s=new Array(e.length),o=0,l=[],d=[],p=[{type:12,data:n}];for(let _=0;_<e.length;++_)o+=e[_].dims[t],a[_]=o,d.push(e[_].dims.length),s[_]=U(`input${_}`,i,d[_]),l.push("rank"),p.push({type:12,data:a[_]});for(let _=0;_<e.length;++_)p.push(...ie(e[_].dims));p.push(...ie(r));let c=te("output",i,r.length),f=c.indicesGet("indices",t),g=Array.from(Array(a.length).keys()).map(_=>`uniforms.sizeInConcatAxis${_}`).join(","),m=_=>`

  ${(()=>{_.registerUniform("outputSize","u32");for(let v=0;v<e.length;v++)_.registerUniform(`sizeInConcatAxis${v}`,"u32");return _.declareVariables(...s,c)})()}

  ${$l(a.length,g)}

  ${_.mainStart()}
    ${_.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}

    var indices = ${c.offsetToIndices("global_idx")};

    let inputIndex = calculateInputIndex(${f});
    if (inputIndex != 0u) {
      let sizeInConcatAxis = array<u32, ${a.length}u>(${g});
      ${f} -= sizeInConcatAxis[inputIndex - 1u];
    }

    ${vl(s,c)}
  }`;return{name:"Concat",shaderCache:{hint:`${t}`,inputDependencies:l},getRunData:()=>({outputs:[{dims:r,dataType:i}],dispatchGroup:{x:Math.ceil(n/64)},programUniforms:p}),getShaderSource:m}},gf=(e,t)=>{let r=e.inputs,i=r[0].dims,n=R.normalizeAxis(t.axis,i.length);wl(r,n);let a=i.slice();a[n]=r.reduce((o,l)=>o+(l.dims.length>n?l.dims[n]:0),0);let s=r.filter(o=>R.size(o.dims)>0);e.compute(xl(s,n,a,r[0].dataType),{inputs:s})},yf=e=>ye({axis:e.axis})}),Wt,Gt,Ft,Ua,Ht=H(()=>{ne(),ae(),Wt=(e,t,r="f32")=>{switch(e.activation){case"Relu":return`value = max(value, ${t}(0.0));`;case"Sigmoid":return`value = (${t}(1.0) / (${t}(1.0) + exp(-value)));`;case"Clip":return`value = clamp(value, ${t}(${r}(uniforms.clip_min)), ${t}(${r}(uniforms.clip_max)));`;case"HardSigmoid":return`value = max(${t}(0.0), min(${t}(1.0), ${r}(uniforms.alpha) * value + ${r}(uniforms.beta)));`;case"LeakyRelu":return`value = select(${r}(uniforms.alpha) * value, value, value >= ${t}(0.0));`;case"Tanh":return`let e2x = exp(-2.0 * abs(value));
              value = sign(value) * (1.0 - e2x) / (1.0 + e2x);
        `;case"":return"";default:throw new Error(`Unsupported activation ${e.activation}`)}},Gt=(e,t)=>{e.activation==="Clip"?t.push({type:1,data:e.clipMax},{type:1,data:e.clipMin}):e.activation==="HardSigmoid"?t.push({type:1,data:e.alpha},{type:1,data:e.beta}):e.activation==="LeakyRelu"&&t.push({type:1,data:e.alpha})},Ft=(e,t)=>{e.activation==="Clip"?t.push({name:"clip_max",type:"f32"},{name:"clip_min",type:"f32"}):e.activation==="HardSigmoid"?t.push({name:"alpha",type:"f32"},{name:"beta",type:"f32"}):e.activation==="LeakyRelu"&&t.push({name:"alpha",type:"f32"})},Ua=e=>{let t=e?.activation||"";if(t==="HardSigmoid"){let[r,i]=e?.activation_params||[.2,.5];return{activation:t,alpha:r,beta:i}}else if(t==="Clip"){let[r,i]=e?.activation_params||[Wc,Gc];return{activation:t,clipMax:i,clipMin:r}}else if(t==="LeakyRelu"){let[r]=e?.activation_params||[.01];return{activation:t,alpha:r}}return{activation:t}}}),Ne,_f,La=H(()=>{Ne=(e,t)=>{switch(e){case 1:return t;case 2:return`vec2<${t}>`;case 3:return`vec3<${t}>`;case 4:return`vec4<${t}>`;default:throw new Error(`${e}-component is not supported.`)}},_f=e=>`
      ${e?"value = value + getBiasByOutputCoords(coords);":""}
      `}),bf,D_=H(()=>{bf=e=>`
fn getIndexFromCoords4D(coords : vec4<i32>, shape : vec4<i32>) -> i32 {
  return dot(coords, vec4<i32>(
      shape.y * shape.z * shape.w, shape.z * shape.w, shape.w, 1));
}
fn getOutputIndexFromCoords(coords : vec4<i32>) -> i32 {
  return dot(coords, vec4<i32>(
    i32(${e}.x), i32(${e}.y), i32(${e}.z), 1));
}
`}),Sr,qa,Wa=H(()=>{ne(),ae(),se(),Ht(),Sr=(e,t,r,i,n)=>{let a=i-r;return`
      ${Array.from({length:r}).map((s,o)=>`
      if (${re(t.shape,o,t.rank)} != 1) {
        ${t.indicesSet(e,o,re(n,o+a,i))}
      } else {
        ${t.indicesSet(e,o,0)}
      }`).join("")}
`},qa=(e,t,r,i,n=!1,a)=>{let s=e[0].dims,o=e[1].dims,l=s[s.length-2],d=o[o.length-1],p=s[s.length-1],c=Ie(d),f=Ie(p),g=Ie(l),m=R.size(r)/c/g,_=e.length>2,v=i?i.slice(0,-2):r.slice(0,-2),$=[R.size(v),l,d],w=[{type:12,data:m},{type:12,data:l},{type:12,data:d},{type:12,data:p}];Gt(t,w),w.push(...ie(v,s,o)),_&&w.push(...ie(e[2].dims)),w.push(...ie($));let S=x=>{let I=Na("batch_dims",e[0].dataType,v.length),C=U("a",e[0].dataType,s.length,f),z=U("b",e[1].dataType,o.length,c),k=te("output",e[0].dataType,$.length,c),B=Oe(k.type.tensor),L=Wt(t,k.type.value,B),j=[C,z],M="";if(_){let N=n?c:1;j.push(U("bias",e[2].dataType,e[2].dims.length,N)),M=`${n?`value += bias[col / ${N}];`:`value += ${k.type.value}(bias[row + i]);`}`}let W=[{name:"output_size",type:"u32"},{name:"M",type:"u32"},{name:"N",type:"u32"},{name:"K",type:"u32"}];Ft(t,W);let O=()=>{let N=`var a_data: ${C.type.value};`;for(let G=0;G<f;G++)N+=`
              let b_data${G} = b[(b_offset + (k + ${G}) * uniforms.N + col) / ${c}];`;for(let G=0;G<g;G++){N+=`a_data = a[(a_offset + (row + ${G}) * uniforms.K + k) / ${f}];`;for(let Y=0;Y<f;Y++)N+=`
            values[${G}] = fma(${z.type.value}(a_data${f===1?"":`[${Y}]`}), b_data${Y}, values[${G}]);
`}return N};return`
  ${x.registerUniforms(W).registerInternalVariables(I).declareVariables(...j,k)}
  ${x.mainStart()}
    ${x.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
    let col = (global_idx % (uniforms.N / ${c})) * ${c};
    var index1 = global_idx / (uniforms.N / ${c});
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
      ${O()}
    }
    for (var i = 0u; i < ${g}u; i++) {
      var value = values[i];
      ${M}
      ${L}
      let cur_indices = ${k.type.indices}(batch, row + i, col);
      let offset = ${k.indicesToOffset("cur_indices")};
      ${k.setByOffset(`offset / ${c}`,"value")};
    }
  }
  `};return{name:"MatMulNaive",shaderCache:{hint:`${t.activation};${c};${f};${g};${n}`,inputDependencies:_?["rank","rank","rank"]:["rank","rank"]},getRunData:()=>({outputs:[{dims:a?a(r):r,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(m/64)},programUniforms:w}),getShaderSource:S}}}),Sl,kl,pa,gn,Tl,ca,Il,ci,Ga=H(()=>{ne(),ae(),se(),Ht(),Wa(),La(),Sl=(e,t)=>e?`
        mm_Asub[inputRow][inputCol] = mm_readA(batch,
          kStart + inputRow,
          globalRowStart / innerElementSize + inputCol${t?", batchIndices":""});
        `:`
        mm_Asub[inputRow][inputCol] = mm_readA(batch,
          globalRow + innerRow,
          kStart / innerElementSize + inputCol${t?", batchIndices":""});
        `,kl=(e,t)=>e?`
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
        }`,pa=(e,t,r="f32",i,n=!1,a=32,s=!1,o=32)=>{let l=t[1]*e[1],d=t[0]*e[0],p=n?l:a,c=n?a:l,f=p/t[0],g=a/t[1];if(!((n&&f===4&&e[1]===4||!n&&(f===3||f===4))&&p%t[0]===0&&a%t[1]===0&&e[0]===4))throw new Error(`If transposeA ${n} is true, innerElementSize ${f} and workPerThread[1] ${e[1]} must be 4.
      Otherwise, innerElementSize ${f} must be 3 or 4.
  tileAWidth ${p} must be divisible by workgroupSize[0]${t[0]}. tileInner ${a} must be divisible by workgroupSize[1] ${t[1]}. colPerThread ${e[0]} must be 4.`);return`
var<workgroup> mm_Asub: array<array<vec${f}<${r}>, ${p/f}>, ${c}>;
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
          ${Sl(n,i)}
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

          ${kl(n,f)}
      }

      workgroupBarrier();
  }

  for (var innerRow = 0; innerRow < rowPerThread; innerRow = innerRow + 1) {
      mm_write(batch, globalRow + innerRow, globalCol, acc[innerRow]);
  }
}`},gn=(e,t)=>e?`
            mm_Asub[inputRow][inputCol] = mm_readA(batch,
              kStart + inputRow,
              globalRowStart + inputCol${t?", batchIndices":""});
            `:`
            mm_Asub[inputRow][inputCol] = mm_readA(batch,
              globalRowStart + inputRow,
              kStart + inputCol${t?", batchIndices":""});
            `,Tl=e=>e?"let ACached = mm_Asub[k][tileRow + innerRow];":"let ACached = mm_Asub[tileRow + innerRow][k];",ca=(e,t,r="f32",i,n=!1,a=32,s=!1,o=32,l=!1)=>{let d=e[1]*t[1],p=e[0]*t[0],c=n?d:a,f=n?a:d;if(!(f%t[1]===0&&c%t[0]===0&&a%t[1]===0))throw new Error(`tileAHight ${f} must be divisible by workgroupSize[1]${t[1]}, tileAWidth ${c} must be divisible by workgroupSize[0]${t[0]}, tileInner ${a} must be divisible by workgroupSize[1]${t[1]}`);let g=f/t[1],m=c/t[0],_=a/t[1],v=l?`
    let localRow = i32(localId.y);
    let localCol = i32(localId.x);
    let globalRowStart = i32(workgroupId.y) * ${d};
    let globalColStart = i32(workgroupId.x) * ${p};

    // Loop over shared dimension.
    for (var t = 0; t < num_tiles; t = t + 1) {
      // Load one tile of A into local memory.
      for (var inputRow = localRow; inputRow < ${f}; inputRow = inputRow + ${t[1]}) {
        for (var inputCol = localCol; inputCol < ${c}; inputCol = inputCol + ${t[0]}) {
          ${gn(n,i)}
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
let tileRowB = i32(localId.y) * ${_};
// Loop over shared dimension.
for (var t = 0; t < num_tiles; t = t + 1) {
  // Load one tile of A into local memory.
  for (var innerRow = 0; innerRow < ${g}; innerRow = innerRow + 1) {
    for (var innerCol = 0; innerCol < ${m}; innerCol = innerCol + 1) {
      let inputRow = tileRowA + innerRow;
      let inputCol = tileColA + innerCol;
      ${gn(n,i)}
    }
  }

  // Load one tile of B into local memory.
  for (var innerRow = 0; innerRow < ${_}; innerRow = innerRow + 1) {
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
      ${Tl(n)}
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
  var<workgroup> mm_Asub : array<array<${r}, ${c}>, ${f}>;
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
`},Il=(e,t,r,i,n=!1)=>{let[a,s,o,l]=i,d=Oe(i[0].type.tensor);return`
    fn mm_readA(batch: i32, row: i32, colIn: i32, batchIndices: ${a.type.indices}) -> ${Ne(e,d)} {
      var value = ${Ne(e,d)}(0.0);
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

    fn mm_readB(batch: i32, row: i32, colIn: i32, batchIndices: ${a.type.indices}) -> ${Ne(e,d)} {
      var value = ${Ne(e,d)}(0.0);
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
    `},ci=(e,t,r,i,n=!1,a)=>{let s=e[0].dims,o=e[1].dims,l=s.slice(0,-2),d=o.slice(0,-2),p=i?i.slice(0,-2):r.slice(0,-2),c=R.size(p),f=s[s.length-2],g=s[s.length-1],m=o[o.length-1],_=g%4===0&&m%4===0,v=f<=8?[4,1,1]:[4,4,1],$=[8,8,1],w=[Math.ceil(m/$[0]/v[0]),Math.ceil(f/$[1]/v[1]),Math.ceil(c/$[2]/v[2])],S=_?4:1,x=[...l,f,g/S],I=x.length,C=[...d,g,m/S],z=C.length,k=[c,f,m/S],B=[{type:6,data:f},{type:6,data:m},{type:6,data:g}];Gt(t,B),B.push(...ie(p,x,C));let L=["rank","rank"],j=e.length>2;j&&(B.push(...ie(e[2].dims)),L.push("rank")),B.push(...ie(k));let M=W=>{let O=p.length,N=Na("batchDims",e[0].dataType,O,1),G=Oe(e[0].dataType),Y=U("a",e[0].dataType,I,S),P=U("b",e[1].dataType,z,S),V=te("result",e[0].dataType,k.length,S),Z=[Y,P];if(j){let be=n?S:1;Z.push(U("bias",e[2].dataType,e[2].dims.length,be))}let q=[{name:"dim_a_outer",type:"i32"},{name:"dim_b_outer",type:"i32"},{name:"dim_inner",type:"i32"}];Ft(t,q);let ee=Oe(V.type.tensor),Q=Wt(t,V.type.value,ee),X=Il(S,j,Q,[N,Y,P,V],n);return`
  ${W.registerUniforms(q).registerInternalVariables(N).declareVariables(...Z,V)}
  ${X}
  ${_?pa(v,$,G,N):ca(v,$,G,N)}
                   `};return{name:"MatMul",shaderCache:{hint:`${v};${t.activation};${_};${n}`,inputDependencies:L},getRunData:()=>({outputs:[{dims:a?a(r):r,dataType:e[0].dataType}],dispatchGroup:{x:w[0],y:w[1],z:w[2]},programUniforms:B}),getShaderSource:M}}}),El,wf,P_=H(()=>{ne(),gt(),se(),Ht(),La(),D_(),Ga(),El=(e,t,r,i,n=!1,a,s=4,o=4,l=4,d="f32")=>{let p=B=>{switch(B){case 1:return"resData = x[xIndex];";case 3:return`resData = vec3<${d}>(x[xIndex], x[xIndex + 1], x[xIndex + 2]);`;case 4:return"resData = x[xIndex / 4];";default:throw new Error(`innerElementSize ${B} is not supported.`)}},c=B=>{switch(B){case 1:return"return w[row * i32(uniforms.w_shape[3]) + colIn];";case 4:return"return w[row * i32(uniforms.w_shape[3]) / 4 + colIn];";default:throw new Error(`innerElementSize ${B} is not supported.`)}},f=e?`
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
    `,m=e?"i32(uniforms.x_shape[1])":"i32(uniforms.x_shape[2])",_=e?"i32(uniforms.x_shape[2])":"i32(uniforms.x_shape[3])",v=e?"row":"col",$=e?"col":"row",w=`
    let inChannels = i32(uniforms.w_shape[2]);
    let outWidth = ${e?"i32(uniforms.result_shape[2])":"i32(uniforms.result_shape[3])"};
    let outRow = ${v} / outWidth;
    let outCol = ${v} % outWidth;

    let WRow = ${$} / (i32(uniforms.w_shape[1]) * inChannels);
    let WCol = ${$} / inChannels % i32(uniforms.w_shape[1]);
    let xRow = outRow * uniforms.stride[0] + uniforms.dilation[0] * WRow - uniforms.pad[0];
    let xCol = outCol * uniforms.stride[1] + uniforms.dilation[1] * WCol - uniforms.pad[1];
    let xCh = ${$} % inChannels;
    var resData = ${Ne(s,d)}(0.0);
    // The bounds checking is always needed since we use it to pad zero for
    // the 'same' padding type.
    if (xRow >= 0 && xRow < ${m} && xCol >= 0 && xCol < ${_}) {
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
    return ${Ne(s,d)}(0.0);`,x=e?i&&r?c(o):`
    let col = colIn * ${o};
    if (row < uniforms.dim_inner && col < uniforms.dim_b_outer) {
      ${c(o)}
    }
    return ${Ne(o,d)}(0.0);`:`
    let col = colIn * ${o};
    if (row < uniforms.dim_inner && col < uniforms.dim_a_outer) {
      ${c(o)}
    }
    return ${Ne(o,d)}(0.0);`,I=Ne(l,d),C=Ne(e?s:o,d),z=Ne(e?o:s,d),k=Wt(a,I,d);return`
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
      ${_f(n)}
      ${k}
      setOutputAtCoords(coords[0], coords[1], coords[2], coords[3], value);
      }
    }`},wf=(e,t,r,i,n,a,s,o,l)=>{let d=t.format==="NHWC",p=d?e[0].dims[3]:e[0].dims[1],c=r[0],f=d?r[2]:r[3],g=d?r[1]:r[2],m=d?r[3]:r[1],_=d&&(p%4===0||p%3===0)&&m%4===0,v=d?m:f*g,$=d?f*g:m,w=[8,8,1],S=i<=8?[4,1,1]:[4,4,1],x=[Math.ceil(v/w[0]/S[0]),Math.ceil($/w[1]/S[1]),Math.ceil(c/w[2]/S[2])];he("verbose",()=>`[conv2d_mm_webgpu] dispatch = ${x}`);let I=_?d&&p%4!==0?3:4:1,C=w[1]*S[1],z=w[0]*S[0],k=Math.max(w[0]*I,w[1]),B=i%C===0,L=n%z===0,j=a%k===0,M=_?[I,4,4]:[1,1,1],W=[{type:6,data:i},{type:6,data:n},{type:6,data:a},{type:6,data:[t.pads[0],t.pads[1]]},{type:6,data:t.strides},{type:6,data:t.dilations}];Gt(t,W),W.push(...ie(e[0].dims,e[1].dims));let O=["rank","rank"];s&&(W.push(...ie(e[2].dims)),O.push("rank")),W.push(...ie(r));let N=G=>{let Y=[{name:"dim_a_outer",type:"i32"},{name:"dim_b_outer",type:"i32"},{name:"dim_inner",type:"i32"},{name:"pad",type:"i32",length:2},{name:"stride",type:"i32",length:2},{name:"dilation",type:"i32",length:2}];Ft(t,Y);let P=_?4:1,V=Oe(e[0].dataType),Z=`
      fn setOutputAtIndex(flatIndex : i32, value : ${_?`vec4<${V}>`:V}) {
        result[flatIndex] = ${_?`vec4<${V}>`:V}(value);
      }
      fn setOutputAtCoords(d0 : i32, d1 : i32, d2 : i32, d3 : i32, value : ${_?`vec4<${V}>`:V}) {
        let flatIndex = getOutputIndexFromCoords(vec4<i32>(d0, d1, d2, d3));
        setOutputAtIndex(flatIndex ${_?"/ 4":""}, value);
      }`,q=U("x",e[0].dataType,e[0].dims.length,I===3?1:I),ee=U("w",e[1].dataType,e[1].dims.length,P),Q=[q,ee],X=te("result",e[0].dataType,r.length,P);if(s){let be=U("bias",e[2].dataType,e[2].dims.length,P);Q.push(be),Z+=`
        fn getBiasByOutputCoords(coords : vec4<i32>) -> ${_?`vec4<${V}>`:V} {
          return bias[coords.${d?"w":"y"}${_?"/ 4":""}];
        }`}return`
        ${bf("uniforms.result_strides")}
        //struct Uniforms { xShape : vec4<i32>, wShape : vec4<i32>, outShape : vec4<i32>,
        //  outShapeStrides: vec3<i32>, filterDims : vec2<i32>, pad : vec2<i32>, stride : vec2<i32>,
        //  dilation : vec2<i32>, dimAOuter : i32, dimBOuter : i32, dimInner : i32 };
        ${G.registerUniforms(Y).declareVariables(...Q,X)}
        ${Z}
        ${El(d,B,L,j,s,t,M[0],M[1],M[2],V)}
        ${_?pa(S,w,V,void 0,!d,k):ca(S,w,V,void 0,!d,k,!1,void 0,o)}`};return{name:"Conv2DMatMul",shaderCache:{hint:`${t.cacheKey};${I};${_};${B};${L};${j};${C};${z};${k}`,inputDependencies:O},getRunData:()=>({outputs:[{dims:l?l(r):r,dataType:e[0].dataType}],dispatchGroup:{x:x[0],y:x[1],z:x[2]},programUniforms:W}),getShaderSource:N}}}),Cl,yn,cr,zl,_n,Al,$f,vf,U_=H(()=>{ne(),gt(),ae(),se(),Ht(),La(),Cl=e=>{let t=1;for(let r=0;r<e.length;r++)t*=e[r];return t},yn=e=>typeof e=="number"?[e,e,e]:e,cr=(e,t)=>t<=1?e:e+(e-1)*(t-1),zl=(e,t,r,i=1)=>{let n=cr(t,i);return Math.floor((e[0]*(r-1)-r+n)/2)},_n=(e,t,r,i,n)=>{n==null&&(n=zl(e,t[0],i[0]));let a=[0,0,0,r];for(let s=0;s<3;s++)e[s]+2*n>=t[s]&&(a[s]=Math.trunc((e[s]-t[s]+2*n)/i[s]+1));return a},Al=(e,t,r,i,n,a,s,o,l,d)=>{let p,c,f,g;if(e==="VALID"&&(e=0),typeof e=="number"){p={top:e,bottom:e,left:e,right:e,front:e,back:e};let m=_n([t,r,i,1],[o,l,d],1,[n,a,s],e);c=m[0],f=m[1],g=m[2]}else if(Array.isArray(e)){if(!e.every((_,v,$)=>_===$[0]))throw Error(`Unsupported padding parameter: ${e}`);p={top:e[0],bottom:e[1],left:e[2],right:e[3],front:e[4],back:e[5]};let m=_n([t,r,i,1],[o,l,d],1,[n,a,s],e[0]);c=m[0],f=m[1],g=m[2]}else if(e==="SAME_UPPER"){c=Math.ceil(t/n),f=Math.ceil(r/a),g=Math.ceil(i/s);let m=(c-1)*n+o-t,_=(f-1)*a+l-r,v=(g-1)*s+d-i,$=Math.floor(m/2),w=m-$,S=Math.floor(_/2),x=_-S,I=Math.floor(v/2),C=v-I;p={top:S,bottom:x,left:I,right:C,front:$,back:w}}else throw Error(`Unknown padding parameter: ${e}`);return{padInfo:p,outDepth:c,outHeight:f,outWidth:g}},$f=(e,t,r,i,n,a=!1,s="channelsLast")=>{let o,l,d,p,c;if(s==="channelsLast")[o,l,d,p,c]=e;else if(s==="channelsFirst")[o,c,l,d,p]=e;else throw new Error(`Unknown dataFormat ${s}`);let[f,,g,m,_]=t,[v,$,w]=yn(r),[S,x,I]=yn(i),C=cr(g,S),z=cr(m,x),k=cr(_,I),{padInfo:B,outDepth:L,outHeight:j,outWidth:M}=Al(n,l,d,p,v,$,w,C,z,k),W=a?f*c:f,O=[0,0,0,0,0];return s==="channelsFirst"?O=[o,W,L,j,M]:s==="channelsLast"&&(O=[o,L,j,M,W]),{batchSize:o,dataFormat:s,inDepth:l,inHeight:d,inWidth:p,inChannels:c,outDepth:L,outHeight:j,outWidth:M,outChannels:W,padInfo:B,strideDepth:v,strideHeight:$,strideWidth:w,filterDepth:g,filterHeight:m,filterWidth:_,effectiveFilterDepth:C,effectiveFilterHeight:z,effectiveFilterWidth:k,dilationDepth:S,dilationHeight:x,dilationWidth:I,inShape:e,outShape:O,filterShape:t}},vf=(e,t,r,i,n,a)=>{let s=a==="channelsLast";s?e[0].dims[3]:e[0].dims[1];let o=[64,1,1],l={x:r.map((v,$)=>$)},d=[Math.ceil(Cl(l.x.map(v=>r[v]))/o[0]),1,1];he("verbose",()=>`[conv3d_naive_webgpu] dispatch = ${d}`);let p=1,c=R.size(r),f=[{type:12,data:c},{type:12,data:i},{type:12,data:n},{type:12,data:t.strides},{type:12,data:t.dilations}];Gt(t,f),f.push(...ie(e[0].dims,e[1].dims));let g=["rank","rank"],m=e.length===3;m&&(f.push(...ie(e[2].dims)),g.push("rank")),f.push(...ie(r));let _=v=>{let $=[{name:"output_size",type:"u32"},{name:"filter_dims",type:"u32",length:i.length},{name:"pads",type:"u32",length:n.length},{name:"strides",type:"u32",length:t.strides.length},{name:"dilations",type:"u32",length:t.dilations.length}];Ft(t,$);let w=1,S=Oe(e[0].dataType),x=U("x",e[0].dataType,e[0].dims.length,p),I=U("W",e[1].dataType,e[1].dims.length,w),C=[x,I],z=te("result",e[0].dataType,r.length,w),k="";if(m){let j=U("bias",e[2].dataType,e[2].dims.length,w);C.push(j),k+=`
        fn getBiasByOutputCoords(coords : array<u32, 5>) -> ${S} {
          return bias[${s?re("coords",4,5):re("coords",1,5)}];
        }`}let B=Ne(p,S),L=Wt(t,B,S);return`
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
              let batch = ${re("coords",0,x.rank)};
              let d2 = ${s?re("coords",x.rank-1,x.rank):re("coords",1,x.rank)};
              let xFRCCorner = vec3<u32>(${s?re("coords",1,x.rank):re("coords",2,x.rank)},
              ${s?re("coords",2,x.rank):re("coords",3,x.rank)},
              ${s?re("coords",3,x.rank):re("coords",4,x.rank)}) * uniforms.strides - uniforms.pads;
              let xFCorner = xFRCCorner.x;
              let xRCorner = xFRCCorner.y;
              let xCCorner = xFRCCorner.z;
              let xShapeY = ${s?re("uniforms.x_shape",1,x.rank):re("uniforms.x_shape",2,x.rank)};
              let xShapeZ = ${s?re("uniforms.x_shape",2,x.rank):re("uniforms.x_shape",3,x.rank)};
              let xShapeW = ${s?re("uniforms.x_shape",3,x.rank):re("uniforms.x_shape",4,x.rank)};
              let xShapeU = ${s?re("uniforms.x_shape",4,x.rank):re("uniforms.x_shape",1,x.rank)};
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
          }`};return{name:"Conv3DNaive",shaderCache:{hint:`${t.cacheKey};${s};${p};${m}`,inputDependencies:g},getRunData:()=>({outputs:[{dims:r,dataType:e[0].dataType}],dispatchGroup:{x:d[0],y:d[1],z:d[2]},programUniforms:f}),getShaderSource:_}}}),xf,Sf,L_=H(()=>{ne(),ae(),se(),Ht(),xf=(e,t,r,i)=>{let n=e.length>2,a=n?"value += b[output_channel];":"",s=e[0].dims,o=e[1].dims,l=t.format==="NHWC",d=l?r[3]:r[1],p=d/t.group,c=l&&p>=4?Ie(d):1,f=R.size(r)/c,g=[{type:12,data:f},{type:12,data:t.dilations},{type:12,data:[t.strides[0],t.strides[1]]},{type:12,data:[t.pads[0],t.pads[1]]},{type:12,data:p}];Gt(t,g),g.push(...ie(s,[o[0],o[1],o[2],o[3]/c]));let m=n?["rank","rank","rank"]:["rank","rank"];g.push(...ie([r[0],r[1],r[2],r[3]/c]));let _=v=>{let $=te("output",e[0].dataType,r.length,c),w=Oe($.type.tensor),S=Wt(t,$.type.value,w),x=U("x",e[0].dataType,s.length),I=U("w",e[1].dataType,o.length,c),C=[x,I];n&&C.push(U("b",e[2].dataType,e[2].dims,c));let z=[{name:"output_size",type:"u32"},{name:"dilations",type:"u32",length:t.dilations.length},{name:"strides",type:"u32",length:2},{name:"pads",type:"u32",length:2},{name:"output_channels_per_group",type:"u32"}];Ft(t,z);let k=l?`
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
    let group_id: u32 = output_channel * ${c} / uniforms.output_channels_per_group;
    var in_channel_offset = group_id * uniforms.w_shape[${l?2:1}];

    var value: ${$.type.value} = ${$.type.value}(0);
    ${k}
    ${a}
    ${S}
    ${$.setByOffset("global_idx","value")}
  }`};return{name:"GroupedConv",shaderCache:{hint:`${t.cacheKey}_${c}`,inputDependencies:m},getRunData:()=>({outputs:[{dims:i?i(r):r,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(f/64)},programUniforms:g}),getShaderSource:_}},Sf=(e,t,r,i)=>{let n=e.length>2,a=Ie(r[3]),s=Ie(r[2]),o=R.size(r)/a/s,l=[e[0].dims[0],e[0].dims[1],e[0].dims[2],e[0].dims[3]/a],d=[e[1].dims[0],e[1].dims[1],e[1].dims[2],e[1].dims[3]/a],p=[r[0],r[1],r[2],r[3]/a],c=[{type:12,data:o},{type:6,data:[t.strides[0],t.strides[1]]},{type:6,data:[t.pads[0],t.pads[1]]}];Gt(t,c),c.push(...ie(l,d,p));let f=(s-1)*t.strides[1]+d[1],g=m=>{let _=te("output",e[0].dataType,p.length,a),v=Oe(_.type.tensor),$=Wt(t,_.type.value,v),w=U("x",e[0].dataType,l.length,a),S=U("w",e[1].dataType,d.length,a),x=[w,S];n&&x.push(U("b",e[2].dataType,e[2].dims,a));let I=n?"value += b[output_channel];":"",C=[{name:"output_size",type:"u32"},{name:"strides",type:"i32",length:2},{name:"pads",type:"i32",length:2}];return Ft(t,C),`
  ${m.registerUniforms(C).declareVariables(...x,_)}
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
    var values: array<${_.type.value}, ${s}>;
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
      ${_.set("batch","row","col + i","output_channel","value")};
    }
  }`};return{name:"GroupedConv-Vectorize",shaderCache:{hint:`${t.cacheKey};${a};${s};${f};${d[0]};${d[1]}`,inputDependencies:n?["rank","rank","type"]:["rank","rank"]},getRunData:()=>({outputs:[{dims:i?i(r):r,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(o/64)},programUniforms:c}),getShaderSource:g}}}),Ml,Kr,Ol,Xr,ha,bn,Rl,Nl,fa,q_=H(()=>{ae(),P_(),U_(),Ga(),L_(),Ht(),Wa(),Tt(),Ml=(e,t,r,i,n,a)=>{let s=e[0],o=e.slice(a?1:2,a?3:4),l=o.length,d=t[0],p=t.slice(2).map((f,g)=>f+(f-1)*(r[g]-1)),c=o.map((f,g)=>f+i[g]+i[g+l]).map((f,g)=>Math.floor((f-p[g]+n[g])/n[g]));return c.splice(0,0,s),c.splice(a?3:1,0,d),c},Kr=[2,3,1,0],Ol=(e,t)=>{if(!e||e.length!==2&&e.length!==3)throw new Error("Conv requires 2 or 3 inputs");if(e[0].dims.length>5)throw new Error("greater than 5D is not supported");if(e[0].dims.length!==e[1].dims.length)throw new Error("filter does not have same dimension as input");let r=e[0].dims[t.format==="NHWC"?e[0].dims.length-1:1],i=e[1].dims[1]*t.group;if(r!==i)throw new Error("FILTER_IN_CHANNEL should be equal to DATA_CHANNEL");if(e.length===3&&(e[2].dims.length!==1||e[1].dims[0]!==e[2].dims[0]))throw new Error("invalid bias");let n=e[0].dims.length-2;if(t.dilations.length!==n)throw new Error(`dilations should be ${n}D`);if(t.strides.length!==n)throw new Error(`strides should be ${n}D`);if(t.pads.length!==n*2)throw new Error(`pads should be ${n*2}D`);if(t.kernelShape.length!==0&&t.kernelShape.length!==e[1].dims.length-2)throw new Error("invalid kernel shape")},Xr=(e,t)=>{let r=e.kernelShape.slice();r.length<t[1].dims.length-2&&r.push(...Array(t[1].dims.length-2-r.length).fill(0));for(let a=2;a<t[1].dims.length;++a)r[a-2]===0&&(r[a-2]=t[1].dims[a]);let i=e.pads.slice();di.adjustPadsBasedOnAutoPad(t[0].dims,e.strides,e.dilations,r,i,e.format==="NHWC",e.autoPad);let n=Object.assign({},e);return Object.assign(n,{kernelShape:r,pads:i}),n},ha=e=>{let t=Ua(e),r=e.format,i=["NOTSET","VALID","SAME_UPPER","SAME_LOWER"][e.auto_pad],n=e.dilations,a=e.group,s=e.kernel_shape,o=e.pads,l=e.strides,d=e.w_is_const();return{autoPad:i,format:r,dilations:n,group:a,kernelShape:s,pads:o,strides:l,wIsConst:d,...t,cacheKey:`${e.format};${t.activation};`}},bn=(e,t,r,i)=>{let n=r.format==="NHWC",a=Ml(t[0].dims,t[1].dims,r.dilations,r.pads,r.strides,n);if(r.group!==1){let C=[t[0]];if(n){let z=e.kernelCustomData.wT??e.compute(Fe(t[1],Kr),{inputs:[1],outputs:[r.wIsConst?-2:-1]})[0];r.wIsConst&&!e.kernelCustomData.wT&&(e.kernelCustomData.wT=z),C.push(z)}else C.push(t[1]);t.length===3&&C.push(t[2]),!e.adapterInfo.isArchitecture("ampere")&&n&&t[1].dims[0]===r.group&&t[1].dims[1]===1&&r.dilations[0]===1&&r.dilations[1]===1?e.compute(Sf(C,r,a,i),{inputs:C}):e.compute(xf(C,r,a,i),{inputs:C});return}let s=t.length===3,o=t[0].dims[n?1:2],l=t[0].dims[n?2:3],d=t[0].dims[n?3:1],p=t[1].dims[2],c=t[1].dims[3],f=a[n?1:2],g=a[n?2:3],m=a[n?3:1],_=n&&p===o&&c===l&&r.pads[0]===0&&r.pads[1]===0;if(_||p===1&&c===1&&r.dilations[0]===1&&r.dilations[1]===1&&r.strides[0]===1&&r.strides[1]===1&&r.pads[0]===0&&r.pads[1]===0){let C=a[0],z,k,B,L=[];if(n){let W=e.kernelCustomData.wT??e.compute(Fe(t[1],Kr),{inputs:[1],outputs:[r.wIsConst?-2:-1]})[0];if(r.wIsConst&&!e.kernelCustomData.wT&&(e.kernelCustomData.wT=W),_){let O=o*l*d;z=t[0].reshape([1,C,O]),k=W.reshape([1,O,m]),B=[1,C,m]}else z=t[0].reshape([C,o*l,d]),k=W.reshape([1,d,m]),B=[C,f*g,m];L.push(z),L.push(k)}else z=t[0].reshape([C,d,o*l]),k=t[1].reshape([1,m,d]),B=[C,m,f*g],L.push(k),L.push(z);s&&L.push(t[2]);let j=B[2],M=L[0].dims[L[0].dims.length-1];j<8&&M<8?e.compute(qa(L,r,a,B,n,i),{inputs:L}):e.compute(ci(L,r,a,B,n,i),{inputs:L});return}let v=!0,$=e.kernelCustomData.wT??e.compute(Fe(t[1],Kr),{inputs:[1],outputs:[r.wIsConst?-2:-1]})[0];r.wIsConst&&!e.kernelCustomData.wT&&(e.kernelCustomData.wT=$);let w=[t[0],$];s&&w.push(t[2]);let S=n?f*g:m,x=n?m:f*g,I=p*c*d;e.compute(wf(w,r,a,S,x,I,s,v,i),{inputs:w})},Rl=(e,t)=>{let r=t.format==="NHWC",i=[e.inputs[0].reshape(r?[e.inputs[0].dims[0],1,e.inputs[0].dims[1],e.inputs[0].dims[2]]:[e.inputs[0].dims[0],e.inputs[0].dims[1],1,e.inputs[0].dims[2]]),e.inputs[1].reshape([e.inputs[1].dims[0],e.inputs[1].dims[1],1,e.inputs[1].dims[2]])];e.inputs.length===3&&i.push(e.inputs[2]);let n=[0,t.pads[0],0,t.pads[1]],a=[1].concat(t.strides),s=[1].concat(t.dilations),o=[1].concat(t.kernelShape),l=Xr({...t,pads:n,strides:a,dilations:s,kernelShape:o},i);bn(e,i,l,d=>r?[d[0],d[2],d[3]]:[d[0],d[1],d[3]])},Nl=(e,t,r)=>{let i=r.format==="NHWC"?"channelsLast":"channelsFirst",n=Xr(r,t),a=r.autoPad==="NOTSET"?r.pads:r.autoPad,s=$f(t[0].dims,t[1].dims,r.strides,r.dilations,a,!1,i);e.compute(vf(t,n,s.outShape,[s.filterDepth,s.filterHeight,s.filterWidth],[s.padInfo.front,s.padInfo.top,s.padInfo.left],i))},fa=(e,t)=>{if(Ol(e.inputs,t),e.inputs[0].dims.length===3)Rl(e,t);else if(e.inputs[0].dims.length===5)Nl(e,e.inputs,t);else{let r=Xr(t,e.inputs);bn(e,e.inputs,r)}}}),kf,W_=H(()=>{ne(),gt(),ae(),se(),kf=(e,t,r)=>{let i=e.length>2,n=t.outputShape,a=t.format==="NHWC",s=t.group,o=e[1].dims,l=o[2]/s,d=o[3],p=a?Ie(l):1,c=a&&d===1&&l>=4,f=c?Math.floor(l/4)*4:Math.floor(l/p)*p,g=l-f,m=a?Ie(d):1,_=a?d===1?p:m:1,v=R.size(n)/m,$=[Math.ceil(v/64),1,1];he("verbose",()=>`[conv2d_backprop_webgpu] dispatch = ${$}`);let w=["rank","rank"],S=[t.strides[0],t.strides[1]],x=[t.kernelShape[a?1:2],t.kernelShape[a?2:3]],I=[t.dilations[0],t.dilations[1]],C=[x[0]+(t.dilations[0]<=1?0:(t.kernelShape[a?1:2]-1)*(t.dilations[0]-1)),x[1]+(t.dilations[1]<=1?0:(t.kernelShape[a?2:3]-1)*(t.dilations[1]-1))],z=[C[0]-1-Math.floor((t.pads[0]+t.pads[2])/2),C[1]-1-Math.floor((t.pads[1]+t.pads[3])/2)],k=[{type:12,data:v},{type:12,data:S},{type:12,data:x},{type:12,data:I},{type:12,data:C},{type:6,data:z},{type:12,data:f},{type:12,data:l},{type:12,data:d},...ie(e[0].dims,e[1].dims)];i&&(k.push(...ie(e[2].dims)),w.push("rank")),k.push(...ie(n));let B=L=>{let j=[{name:"output_size",type:"u32"},{name:"strides",type:"u32",length:S.length},{name:"filter_dims",type:"u32",length:x.length},{name:"dilations",type:"u32",length:x.length},{name:"effective_filter_dims",type:"u32",length:C.length},{name:"pads",type:"i32",length:z.length},{name:"input_channels_per_group_int",type:"u32"},{name:"input_channels_per_group",type:"u32"},{name:"output_channels_per_group",type:"u32"}],M=Oe(e[0].dataType),W=a?1:2,O=a?2:3,N=a?3:1,G=U("W",e[1].dataType,e[1].dims.length,_),Y=U("Dy",e[0].dataType,e[0].dims.length,p),P=[Y,G];i&&P.push(U("bias",e[2].dataType,[n[N]].length,m));let V=te("result",e[0].dataType,n.length,m),Z=()=>{let Q="";if(c)p===4?Q+=`
        let xValue = ${Y.getByOffset("x_offset")};
        let wValue = ${G.getByOffset("w_offset")};
        dotProd = dotProd + dot(xValue, wValue);
        x_offset += 1u;
        w_offset += 1u;`:p===2?Q+=`
          dotProd = dotProd + dot(vec4<${M}>(${Y.getByOffset("x_offset")}, ${Y.getByOffset("x_offset + 1u")}), vec4<${M}>(${G.getByOffset("w_offset")}, ${G.getByOffset("w_offset + 1u")}));
          x_offset += 2u;
          w_offset += 2u;`:p===1&&(Q+=`
          dotProd = dotProd + dot(vec4<${M}>(${Y.getByOffset("x_offset")}, ${Y.getByOffset("x_offset + 1u")}, ${Y.getByOffset("x_offset + 2u")}, ${Y.getByOffset("x_offset + 3u")}), vec4<${M}>(${G.getByOffset("w_offset")}, ${G.getByOffset("w_offset + 1u")}, ${G.getByOffset("w_offset + 2u")}, ${G.getByOffset("w_offset + 3u")}));
          x_offset += 4u;
          w_offset += 4u;`);else if(Q+=`
                  let xValue = ${a?Y.getByOffset(`${Y.indicesToOffset(`${Y.type.indices}(batch, idyR, idyC, inputChannel)`)} / ${p}`):Y.get("batch","inputChannel","idyR","idyC")};
        `,p===1)Q+=`
          let w_offset = ${G.indicesToOffset(`${G.type.indices}(u32(wRPerm), u32(wCPerm), inputChannel, wOutChannel)`)};
          let wValue = ${G.getByOffset(`w_offset / ${_}`)};
          dotProd = dotProd + xValue * wValue;`;else for(let X=0;X<p;X++)Q+=`
            let wValue${X} = ${G.getByOffset(`${G.indicesToOffset(`${G.type.indices}(u32(wRPerm), u32(wCPerm), inputChannel + ${X}, wOutChannel)`)} / ${_}`)};
            dotProd = dotProd + xValue[${X}] * wValue${X};`;return Q},q=()=>{if(g===0)return"";if(!c)throw new Error(`packInputAs4 ${c} is not true.`);let Q="";if(p===1){Q+="dotProd = dotProd";for(let X=0;X<g;X++)Q+=`
            + ${Y.getByOffset(`x_offset + ${X}`)} * ${G.getByOffset(`w_offset + ${X}`)}`;Q+=";"}else if(p===2){if(g!==2)throw new Error(`Invalid inputChannelsRemainder ${g}.`);Q+=`
          let xValue = ${Y.getByOffset("x_offset")};
          let wValue = ${G.getByOffset("w_offset")};
          dotProd = dotProd + dot(xValue, wValue);`}return Q},ee=`
            let outputIndices = ${V.offsetToIndices(`global_idx * ${m}`)};
            let batch = ${V.indicesGet("outputIndices",0)};
            let d1 = ${V.indicesGet("outputIndices",N)};
            let r = ${V.indicesGet("outputIndices",W)};
            let c = ${V.indicesGet("outputIndices",O)};
            let dyCorner = vec2<i32>(i32(r), i32(c)) - uniforms.pads;
            let dyRCorner = dyCorner.x;
            let dyCCorner = dyCorner.y;
            let groupId = d1 / uniforms.output_channels_per_group;
            let wOutChannel = d1 - groupId * uniforms.output_channels_per_group;
            // Convolve dy(?, ?, d2) with w(:, :, d1, d2) to compute dx(xR, xC, d1).
            // ? = to be determined. : = across all values in that axis.
            var dotProd = ${V.type.value}(0.0);
            var wR: u32 = 0;
            if (uniforms.dilations.x == 1) {
              // Minimum wR >= 0 that satisfies (dyRCorner + wR) % (uniforms.strides.x) == 0
              wR = u32(((dyRCorner + i32(uniforms.strides.x) - 1) / i32(uniforms.strides.x)) * i32(uniforms.strides.x) - dyRCorner);
            }
            for (; wR < uniforms.effective_filter_dims.x; wR = wR + 1) {
              if (wR % uniforms.dilations.x != 0) {
                continue;
              }
              let dyR = (${M}(dyRCorner) + ${M}(wR)) / ${M}(uniforms.strides[0]);
              let wRPerm = uniforms.filter_dims.x - 1 - wR / uniforms.dilations.x;
              if (dyR < 0.0 || dyR >= ${M}(uniforms.Dy_shape[${W}]) || fract(dyR) > 0.0 ||
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
                let dyC = (${M}(dyCCorner) + ${M}(wC)) / ${M}(uniforms.strides.y);
                let wCPerm = uniforms.filter_dims.y - 1 - wC / uniforms.dilations.y;
                if (dyC < 0.0 || dyC >= ${M}(uniforms.Dy_shape[${O}]) ||
                    fract(dyC) > 0.0 || wCPerm < 0) {
                  continue;
                }
                let idyC: u32 = u32(dyC);
                var inputChannel = groupId * uniforms.input_channels_per_group;
                ${c?`
                var x_offset = ${Y.indicesToOffset(`${Y.type.indices}(batch, idyR, idyC, inputChannel)`)} / ${p};
                var w_offset = ${G.indicesToOffset(`${G.type.indices}(wRPerm, wCPerm, inputChannel, wOutChannel)`)} / ${_};
                  `:""}
                for (var d2: u32 = 0; d2 < uniforms.input_channels_per_group_int; d2 = d2 + ${c?4:p}) {
                  ${Z()}
                  inputChannel = inputChannel + ${c?4:p};
                }
                ${q()}
                wC = wC + uniforms.strides.y - 1;
              }
              wR = wR + uniforms.strides[0] - 1;
            }
            let value = dotProd${i?` + bias[d1 / ${m}]`:""};
            ${V.setByOffset("global_idx","value")};
          `;return`
    ${L.registerUniforms(j).declareVariables(...P,V)}
      ${L.mainStart()}
      ${L.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")};
    ${ee}}`};return{name:"ConvTranspose2D",shaderCache:{hint:`${t.cacheKey};${p}${_}${m}${c}${g}`,inputDependencies:w},getRunData:()=>({dispatchGroup:{x:$[0],y:$[1],z:$[2]},outputs:[{dims:r?r(n):n,dataType:e[0].dataType}],programUniforms:k}),getShaderSource:B}}}),Bl,Dl,Pl,wn,Tf,Ul,$n,Ll,If,G_=H(()=>{W_(),Ht(),Tt(),Bl=(e,t,r,i,n,a)=>(e-1)*t+r+(i-1)*n+1-a,Dl=(e,t,r,i,n)=>{let a=Math.floor(e/2);t==="SAME_UPPER"?(r[i]=a,r[n]=e-a):t==="SAME_LOWER"&&(r[i]=e-a,r[n]=a)},Pl=(e,t,r,i,n,a,s,o,l,d)=>{let p=e.length-2,c=d.length===0;l.length<p&&l.push(...Array(p-l.length).fill(0));let f=e[0],g=t[o?3:1]*n;for(let m=0,_=e.length-p-(o?1:0);m<p;++m,++_){let v=e[_],$=c?v*s[m]:d[m],w=Bl(v,s[m],a[m],t[_],r[m],$);Dl(w,i,a,m,m+p),c&&d.push(s[m]*(v-1)+l[m]+(t[_]-1)*r[m]+1-a[m]-a[m+p])}d.splice(0,0,f),d.splice(o?3:1,0,g)},wn=(e,t)=>{let r=e.kernelShape.slice();if(e.kernelShape.length===0||e.kernelShape.reduce((c,f)=>c*f,1)===0){r.length=0;for(let c=2;c<t[1].dims.length;++c)r.push(t[1].dims[c])}let i=e.format==="NHWC";r.splice(0,0,t[1].dims[0]),r.splice(i?3:1,0,t[1].dims[1]);let n=e.pads.slice(),a=e.outputShape.slice(),s=e.outputPadding.slice(),o=t[0].dims,l=e.dilations.slice();if(l.reduce((c,f)=>c+f,0)===0){let c=t[0].dims.length-2;l=new Array(c).fill(1)}let d=e.strides.slice();if(d.reduce((c,f)=>c+f,0)===0){let c=t[0].dims.length-2;d=new Array(c).fill(1)}Pl(o,r,l,e.autoPad,e.group,n,d,i,s,a);let p=Object.assign({},e);return Object.assign(p,{kernelShape:r,pads:n,outputPadding:s,outputShape:a,dilations:l,strides:d}),p},Tf=e=>{let t=Ua(e),r=e.format,i=["NOTSET","VALID","SAME_UPPER","SAME_LOWER"][typeof e.autoPad>"u"?0:e.autoPad],n=e.dilations,a=e.group??1,s=e.kernelShape,o=e.pads,l=e.strides,d=e.wIsConst(),p=e.outputPadding,c=e.outputShape;return{autoPad:i,format:r,dilations:n,group:a,kernelShape:s,outputPadding:p,outputShape:c,pads:o,strides:l,wIsConst:d,...t,cacheKey:`${e.format};${t.activation};`}},Ul=(e,t)=>{if(!e||e.length!==2&&e.length!==3)throw new Error("Conv requires 2 or 3 inputs");if(e[0].dims.length!==4&&e[0].dims.length!==3)throw new Error("currently only support 2-dimensional conv");if(e[0].dims.length!==e[1].dims.length)throw new Error("filter does not have same dimension as input");let r=e[0].dims[t.format==="NHWC"?e[0].dims.length-1:1],i=e[1].dims[0];if(r!==i)throw new Error("FILTER_IN_CHANNEL should be equal to DATA_CHANNEL");let n=e[1].dims[1]*t.group;if(e.length===3&&(e[2].dims.length!==1||e[2].dims[0]!==n))throw new Error("invalid bias");let a=e[0].dims.length-2;if(t.dilations.reduce((s,o)=>s+o,0)>0&&t.dilations.length!==a)throw new Error(`dilations should be ${a}D`);if(t.strides.reduce((s,o)=>s+o,0)>0&&t.strides.length!==a)throw new Error(`strides should be ${a}D`);if(t.pads.reduce((s,o)=>s+o,0)>0&&t.pads.length!==a*2)throw new Error(`pads should be ${a*2}D`);if(t.outputPadding.length!==a&&t.outputPadding.length!==0)throw new Error(`output_padding should be ${a}D`);if(t.kernelShape.reduce((s,o)=>s+o,0)>0&&t.kernelShape.length!==0&&t.kernelShape.length!==e[1].dims.length-2)throw new Error("invalid kernel shape");if(t.outputShape.length!==0&&t.outputShape.length!==e[0].dims.length-2)throw new Error("invalid output shape")},$n=(e,t,r,i)=>{let n=e.kernelCustomData.wT??e.compute(Fe(t[1],[2,3,0,1]),{inputs:[1],outputs:[r.wIsConst?-2:-1]})[0];r.wIsConst&&!e.kernelCustomData.wT&&(e.kernelCustomData.wT=n);let a=[t[0],n];t.length===3&&a.push(t[2]),e.compute(kf(a,r,i),{inputs:a})},Ll=(e,t)=>{let r=t.format==="NHWC",i=[e.inputs[0].reshape(r?[e.inputs[0].dims[0],1,e.inputs[0].dims[1],e.inputs[0].dims[2]]:[e.inputs[0].dims[0],e.inputs[0].dims[1],1,e.inputs[0].dims[2]]),e.inputs[1].reshape([e.inputs[1].dims[0],e.inputs[1].dims[1],1,e.inputs[1].dims[2]])];e.inputs.length===3&&i.push(e.inputs[2]);let n=t.kernelShape;(n.length===0||n[0]===0)&&(n=[e.inputs[1].dims[2]]);let a=t.dilations;(a.length===0||a[0]===0)&&(a=[1]);let s=t.strides;(s.length===0||s[0]===0)&&(s=[1]);let o=t.pads;o.length===0&&(o=[0,0]),o=[0,o[0],0,o[1]],s=[1].concat(s),a=[1].concat(a),n=[1].concat(n);let l=t.outputPadding;l=[0].concat(l);let d=wn({...t,pads:o,strides:s,dilations:a,kernelShape:n,outputPadding:l},i);$n(e,i,d,p=>r?[p[0],p[2],p[3]]:[p[0],p[1],p[3]])},If=(e,t)=>{if(Ul(e.inputs,t),e.inputs[0].dims.length===3)Ll(e,t);else{let r=wn(t,e.inputs);$n(e,e.inputs,r)}}}),ql,Ef,Cf,F_=H(()=>{ne(),ae(),Ce(),se(),ql=(e,t,r,i)=>{let n=R.size(t),a=t.length,s=U("input",e,a),o=te("output",e,a),l=r.dataType===6?r.getInt32Array()[0]:Number(r.getBigInt64Array()[0]),d=R.normalizeAxis(l,a),p=c=>{let f=` i32(${s.indicesGet("inputIndices","uniforms.axis")}) `,g=re("uniforms.input_shape","uniforms.axis",a),m=i.reverse?f+(i.exclusive?" + 1":""):"0",_=i.reverse?g:f+(i.exclusive?"":" + 1");return`
                ${c.registerUniform("outputSize","u32").registerUniform("axis","u32").declareVariables(s,o)}
                ${c.mainStart()}
                  ${c.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}
                  var inputIndices = ${o.offsetToIndices("global_idx")};
                  var sum = ${o.type.value}(0);
                  let first : i32 = ${m};
                  let last : i32 = ${_};
                  for (var i : i32 = first; i < last; i++) {
                    ${s.indicesSet("inputIndices","uniforms.axis","u32(i)")};
                    sum = sum + ${s.getByIndices("inputIndices")};
                  }
                  ${o.setByOffset("global_idx","sum")};
                }`};return{name:"CumSum",shaderCache:{hint:i.cacheKey,inputDependencies:["rank"]},getRunData:()=>({outputs:[{dims:t,dataType:e}],dispatchGroup:{x:Math.ceil(n/64)},programUniforms:[{type:12,data:n},{type:12,data:d},...ie(t,t)]}),getShaderSource:p}},Ef=(e,t)=>{let r=e.inputs[0].dims,i=e.inputs[0].dataType,n=e.inputs[1];e.compute(ql(i,r,n,t),{inputs:[0]})},Cf=e=>{let t=e.exclusive===1,r=e.reverse===1;return ye({exclusive:t,reverse:r})}}),Wl,Gl,Fl,zf,Af,V_=H(()=>{ne(),ae(),Ce(),se(),Wl=e=>{if(!e||e.length!==1)throw new Error("DepthToSpace requires 1 input.");if(e[0].dims.length!==4)throw new Error("DepthToSpace requires 4D input.")},Gl=(e,t,r,i)=>{let n=[];n.push(`fn perm(i: ${i.type.indices}) -> ${r.type.indices} {
    var a: ${r.type.indices};`);for(let a=0;a<t;++a)n.push(r.indicesSet("a",e[a],`i[${a}]`));return n.push("return a;}"),n.join(`
`)},Fl=(e,t)=>{let r,i,n,a,s,o,l=t.format==="NHWC",d=t.blocksize,p=t.mode==="DCR";l?([r,i,n,a]=e.dims,s=p?[r,i,n,d,d,a/d**2]:[r,i,n,a/d**2,d,d],o=p?[0,1,3,2,4,5]:[0,1,4,2,5,3]):([r,i,n,a]=[e.dims[0],e.dims[2],e.dims[3],e.dims[1]],s=p?[r,d,d,a/d**2,i,n]:[r,a/d**2,d,d,i,n],o=p?[0,3,4,1,5,2]:[0,1,4,2,5,3]);let c=e.reshape(s),f=c.dims.length,g=e.dataType,m=U("a",g,f),_=te("output",g,f),v=$=>`
  ${$.registerUniform("output_size","u32").declareVariables(m,_)}

  ${Gl(o,f,m,_)}

  ${$.mainStart()}
    ${$.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}

    let indices = ${_.offsetToIndices("global_idx")};
    let aIndices = perm(indices);

    ${_.setByOffset("global_idx",m.getByIndices("aIndices"))}
  }`;return{name:"DepthToSpace",shaderCache:{hint:`${e.dims};${t.blocksize};${t.mode}`,inputDependencies:["rank"]},getRunData:$=>{let w=l?[r,i*d,n*d,a/d**2]:[r,a/d**2,i*d,n*d],S=R.size(w),x=c.dims,I=R.sortBasedOnPerm(x,o);return{outputs:[{dims:w,dataType:$[0].dataType}],dispatchGroup:{x:Math.ceil(S/64)},programUniforms:[{type:12,data:S},...ie(x,I)]}},getShaderSource:v}},zf=(e,t)=>{Wl(e.inputs),e.compute(Fl(e.inputs[0],t))},Af=e=>ye({blocksize:e.blocksize,mode:e.mode,format:e.format})}),Zr,hr,vn,Vl,Hl,jl,Kl,xn,Xl,Mf,Of,H_=H(()=>{ne(),ae(),Ce(),se(),Zr="[a-zA-Z]|\\.\\.\\.",hr="("+Zr+")+",vn="^"+hr+"$",Vl="("+hr+",)*"+hr,Hl="^"+Vl+"$",jl=class{constructor(e=-1){this.symbolToIndices=new Map,this.inputIndex=e}addSymbol(e,t){let r=this.symbolToIndices.get(e);r===void 0?r=[t]:r.push(t),this.symbolToIndices.set(e,r)}},Kl=class{constructor(e,t){this.equation=t,this.hasEllipsis=!1,this.symbolToInfo=new Map,this.lhs=new Array,this.outputDims=[];let[r,i]=t.includes("->")?t.split("->",2):[t,""];if(!r.match(RegExp(Hl)))throw new Error("Invalid LHS term");if(r.split(",").forEach((n,a)=>{let s=e[a].dims.slice();if(!n.match(RegExp(vn)))throw new Error("Invalid LHS term");let o=this.processTerm(n,!0,s,a);this.lhs.push(o)}),i==="")i+=[...this.symbolToInfo.entries()].filter(([n,a])=>a.count===1||n==="...").map(([n])=>n).join("");else if(!i.match(RegExp(hr)))throw new Error("Invalid RHS");i.match(RegExp(Zr,"g"))?.forEach(n=>{if(n==="...")this.outputDims=this.outputDims.concat(this.ellipsisDims);else{let a=this.symbolToInfo.get(n);if(a===void 0)throw new Error("Invalid RHS symbol");this.outputDims.push(a.dimValue)}}),this.rhs=this.processTerm(i,!1,this.outputDims)}addSymbol(e,t,r){let i=this.symbolToInfo.get(e);if(i!==void 0){if(i.dimValue!==t&&i.count!==1)throw new Error("Dimension mismatch");i.count++,i.inputIndices.push(r)}else i={count:1,dimValue:t,inputIndices:[r]};this.symbolToInfo.set(e,i)}processTerm(e,t,r,i=-1){let n=r.length,a=!1,s=[],o=0;if(!e.match(RegExp(vn))&&!t&&e!=="")throw new Error("Invalid LHS term");let l=e.match(RegExp(Zr,"g")),d=new jl(i);return l?.forEach((p,c)=>{if(p==="..."){if(a)throw new Error("Only one ellipsis is allowed per input term");a=!0;let f=n-l.length+1;if(f<0)throw new Error("Ellipsis out of bounds");if(s=r.slice(o,o+f),this.hasEllipsis){if(this.ellipsisDims.length!==s.length||this.ellipsisDims.toString()!==s.toString())throw new Error("Ellipsis dimensions mismatch")}else if(t)this.hasEllipsis=!0,this.ellipsisDims=s;else throw new Error("Ellipsis must be specified in the LHS");for(let g=0;g<s.length;g++){let m=String.fromCharCode(48+g);d.addSymbol(m,c+g),this.addSymbol(m,r[o++],i)}}else d.addSymbol(p,c+(this.hasEllipsis?this.ellipsisDims.length-1:0)),this.addSymbol(p,r[o++],i)}),d}},xn=e=>e+"_max",Xl=(e,t,r,i)=>{let n=e.map(d=>d.length).map((d,p)=>U(`input${p}`,t,d)),a=R.size(i),s=te("output",t,i.length),o=[...r.symbolToInfo.keys()].filter(d=>!r.rhs.symbolToIndices.has(d)),l=d=>{let p=[],c="var prod = 1.0;",f="var sum = 0.0;",g="sum += prod;",m=[],_=[],v=[],$=[],w=r.symbolToInfo.size===r.rhs.symbolToIndices.size;r.symbolToInfo.forEach((x,I)=>{if(r.rhs.symbolToIndices.has(I)){let C=r.rhs.symbolToIndices.get(I)?.[0];C!==void 0&&r.lhs.forEach((z,k)=>{if(x.inputIndices.includes(k)){let B=z.symbolToIndices.get(I);if(B===void 0)throw new Error("Invalid symbol error");B.forEach(L=>{p.push(`${n[k].indicesSet(`input${k}Indices`,L,s.indicesGet("outputIndices",C))}`)})}})}else r.lhs.forEach((C,z)=>{if(x.inputIndices.includes(z)){let k=C.symbolToIndices.get(I);if(k===void 0)throw new Error("Invalid symbol error");k.forEach(B=>{m.push(`${n[z].indicesSet(`input${z}Indices`,B,`${I}`)}`)}),$.push(`prod *= ${n[z].getByIndices(`input${z}Indices`)};`)}}),_.push(`for(var ${I}: u32 = 0; ${I} < uniforms.${xn(I)}; ${I}++) {`),v.push("}")});let S=w?[...p,`let sum = ${n.map((x,I)=>x.getByIndices(`input${I}Indices`)).join(" * ")};`]:[...p,f,..._,...m,c,...$,g,...v];return`
            ${d.registerUniforms(o.map(x=>({name:`${xn(x)}`,type:"u32"}))).registerUniform("outputSize","u32").declareVariables(...n,s)}

            ${d.mainStart()}
            ${d.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}
            var outputIndices = ${s.offsetToIndices("global_idx")};
            ${n.map((x,I)=>`var input${I}Indices: ${n[I].type.indices};`).join(`
`)}
            ${S.join(`
`)};
            ${s.setByOffset("global_idx","sum")};
          }`};return{name:"Einsum",shaderCache:{hint:r.equation,inputDependencies:e.map(()=>"rank")},getRunData:()=>{let d=o.filter(c=>r.symbolToInfo.has(c)).map(c=>({type:12,data:r.symbolToInfo.get(c)?.dimValue||0}));d.push({type:12,data:a});let p=e.map((c,f)=>[...ie(c)]).reduce((c,f)=>c.concat(f),d);return p.push(...ie(i)),{outputs:[{dims:i,dataType:t}],dispatchGroup:{x:Math.ceil(a/64)},programUniforms:p}},getShaderSource:l}},Mf=(e,t)=>{let r=new Kl(e.inputs,t.equation),i=r.outputDims,n=e.inputs.map((a,s)=>a.dims);e.compute(Xl(n,e.inputs[0].dataType,r,i))},Of=e=>{let t=e.equation.replace(/\s+/g,"");return ye({equation:t})}}),Zl,Sn,Yl,Ql,Rf,j_=H(()=>{ne(),ae(),se(),Zl=e=>{if(!e||e.length!==2)throw new Error("Expand requires 2 input.");let t=e[0].dims,r=Array.from(e[1].getBigInt64Array(),Number),i=r.length<t.length?0:r.length-t.length,n=t.length<r.length?0:t.length-r.length;for(;i<r.length&&n<t.length;++i,++n)if(r[i]!==t[n]&&r[i]!==1&&t[n]!==1)throw new Error("Expand requires shape to be broadcastable to input")},Sn=(e,t)=>{let r=e.length-t.length,i=[];for(let n=0;n<r;++n)i.push(e[n]);for(let n=0;n<t.length;++n)i.push(t[n]===1?e[n+r]:t[n]);return i},Yl=(e,t)=>e.length>t.length?Sn(e,t):Sn(t,e),Ql=e=>{let t=e[0].dims,r=Array.from(e[1].getBigInt64Array(),Number),i=Yl(t,r),n=e[0].dataType,a=n===9||R.size(t)===1,s=n===9||t.length>0&&t[t.length-1]%4===0?4:1,o=a||i.length>0&&i[i.length-1]%4===0?4:1,l=Math.ceil(R.size(i)/o),d=c=>{let f=U("input",n,t.length,s),g=te("output",n,i.length,o),m;if(n===9){let _=(v,$,w="")=>`
          let outputIndices${$} = ${g.offsetToIndices(`outputOffset + ${$}u`)};
          let offset${$} = ${f.broadcastedIndicesToOffset(`outputIndices${$}`,g)};
          let index${$} = offset${$} / 4u;
          let component${$} = offset${$} % 4u;
          ${v}[${$}] = ${w}(${f.getByOffset(`index${$}`)}[component${$}]);
        `;m=`
        let outputOffset = global_idx * ${o};
        var data = vec4<u32>(0);
        ${_("data",0,"u32")}
        ${_("data",1,"u32")}
        ${_("data",2,"u32")}
        ${_("data",3,"u32")}
        ${g.setByOffset("global_idx","data")}
      }`}else m=`
        let outputIndices = ${g.offsetToIndices(`global_idx * ${o}`)};
        let inputOffset = ${f.broadcastedIndicesToOffset("outputIndices",g)};
        let data = ${g.type.value}(${f.getByOffset(`inputOffset / ${s}`)});
        ${g.setByOffset("global_idx","data")}
      }`;return`
    ${c.registerUniform("vec_size","u32").declareVariables(f,g)}
    ${c.mainStart()}
    ${c.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.vec_size")}
    ${m}`},p=[{type:12,data:l},...ie(t,i)];return{name:"Expand",shaderCache:{hint:`${i.length};${s}${o}`,inputDependencies:["rank"]},getShaderSource:d,getRunData:()=>({outputs:[{dims:i,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(l/64)},programUniforms:p})}},Rf=e=>{Zl(e.inputs),e.compute(Ql(e.inputs),{inputs:[0]})}}),Jl,Nf,K_=H(()=>{ne(),ae(),se(),Pa(),Jl=e=>{let t=e[0].dataType,r=R.size(e[0].dims),i=R.size(e[1].dims),n=i%4===0,a=s=>{let o=U("x",t,[1],4),l=U("bias",t,[1],4),d=te("y",t,[1],4),p=[{name:"output_vec_size",type:"u32"},{name:"bias_size",type:"u32"}],c=g=>`
      let bias${g}_offset: u32 = (global_idx * 4 + ${g}) % uniforms.bias_size;
      let bias${g} = ${l.getByOffset(`bias${g}_offset / 4`)}[bias${g}_offset % 4];`,f=n?`
      let bias = ${l.getByOffset("global_idx % (uniforms.bias_size / 4)")};`:`${c(0)}${c(1)}${c(2)}${c(3)}
      let bias = ${o.type.value}(bias0, bias1, bias2, bias3);`;return`${s.registerUniforms(p).declareVariables(o,l,d)}

    ${la(Be(t))}

    ${s.mainStart(rr)}
      ${s.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_vec_size")}

      let x = ${o.getByOffset("global_idx")};
      ${f}
      let x_in = x + bias;
      ${d.setByOffset("global_idx",da("x_in"))}
    }`};return{name:"FastGeluWithBias",shaderCache:{hint:`${n}`,inputDependencies:["type","type"]},getShaderSource:a,getRunData:s=>({outputs:[{dims:s[0].dims,dataType:s[0].dataType}],programUniforms:[{type:12,data:Math.ceil(r/4)},{type:12,data:i}],dispatchGroup:{x:Math.ceil(r/rr/4)}})}},Nf=e=>{e.inputs.length<2||R.size(e.inputs[1].dims)===0?ef(e):e.compute(Jl(e.inputs))}}),ed,td,Bf,Df,X_=H(()=>{ne(),ae(),Ce(),se(),ed=e=>{if(!e||e.length!==2)throw new Error("Gather requires 2 inputs.")},td=(e,t)=>{let r=e[0].dims,i=e[1].dims,n=r.length,a=R.normalizeAxis(t.axis,n),s=r.slice(0);s.splice(a,1,...i);let o=r[a],l=e[0].dataType===9?4:1,d=Math.ceil(R.size(s)/l),p=[{type:12,data:d},{type:6,data:o},{type:12,data:a},...ie(e[0].dims,e[1].dims,s)],c=f=>{let g=U("data",e[0].dataType,e[0].dims.length,l),m=U("inputIndices",e[1].dataType,e[1].dims.length),_=te("output",e[0].dataType,s.length,l),v=w=>{let S=i.length,x=`var indicesIndices${w}  = ${m.type.indices}(0);`;for(let I=0;I<S;I++)x+=`${S>1?`indicesIndices${w}[${I}]`:`indicesIndices${w}`} = ${s.length>1?`outputIndices${w}[uniforms.axis + ${I}]`:`outputIndices${w}`};`;x+=`
          var idx${w} = ${m.getByIndices(`indicesIndices${w}`)};
          if (idx${w} < 0) {
            idx${w} = idx${w} + uniforms.axisDimLimit;
          }
          var dataIndices${w} : ${g.type.indices};
        `;for(let I=0,C=0;I<n;I++)I===a?(x+=`${n>1?`dataIndices${w}[${I}]`:`dataIndices${w}`} = u32(idx${w});`,C+=S):(x+=`${n>1?`dataIndices${w}[${I}]`:`dataIndices${w}`} = ${s.length>1?`outputIndices${w}[${C}]`:`outputIndices${w}`};`,C++);return x},$;if(e[0].dataType===9){let w=(S,x,I="")=>`
          let outputIndices${x} = ${_.offsetToIndices(`outputOffset + ${x}u`)};
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
        ${_.setByOffset("global_idx","value")}
      `}else $=`
      let outputIndices = ${_.offsetToIndices("global_idx")};
      ${v("")};
      let value = ${g.getByIndices("dataIndices")};
      ${_.setByOffset("global_idx","value")};
      `;return`
      ${f.registerUniform("outputSize","u32").registerUniform("axisDimLimit","i32").registerUniform("axis","u32").declareVariables(g,m,_)}
      ${f.mainStart()}
        ${f.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}
        ${$}
      }`};return{name:"Gather",shaderCache:{hint:t.cacheKey,inputDependencies:["rank","rank"]},getRunData:()=>({outputs:[{dims:s,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(d/64)},programUniforms:p}),getShaderSource:c}},Bf=e=>ye({axis:e.axis}),Df=(e,t)=>{let r=e.inputs;ed(r),e.compute(td(e.inputs,t))}}),rd,Pf,Uf,Z_=H(()=>{ne(),ae(),se(),rd=(e,t,r,i,n,a,s,o,l)=>{let d=[{type:12,data:a},{type:12,data:i},{type:12,data:n},{type:12,data:r},{type:12,data:s},{type:12,data:o},{type:12,data:l}],p=[a];d.push(...ie(t.dims,p));let c=f=>{let g=U("indices_data",t.dataType,t.dims.length),m=te("input_slice_offsets_data",12,1,1),_=[g,m],v=[{name:"output_size",type:"u32"},{name:"batch_dims",type:"u32"},{name:"input_dims",type:"u32",length:n.length},{name:"sizes_from_slice_dims_data",type:"u32",length:r.length},{name:"num_slices_per_batch",type:"u32"},{name:"input_batch_stride",type:"u32"},{name:"num_slice_dims",type:"u32"}];return`
  ${f.registerUniforms(v).declareVariables(..._)}
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
  }`};return e.compute({name:"computeSliceOffsets",shaderCache:{hint:`${n.length}_${r.length}`,inputDependencies:["rank"]},getRunData:()=>({outputs:[{dims:p,dataType:e.inputs[1].dataType}],dispatchGroup:{x:Math.ceil(a/64)},programUniforms:d}),getShaderSource:c},{inputs:[t],outputs:[-1]})[0]},Pf=(e,t)=>{let r=e.inputs,i=r[0].dims,n=r[0].dataType,a=r[1].dims,s=a[a.length-1],o=R.sizeToDimension(a,a.length-1),l=R.sizeFromDimension(i,t.batchDims+s),d=R.sizeToDimension(i,t.batchDims),p=R.sizeFromDimension(i,t.batchDims),c=o/d,f=new Array(s),g=l;for(let x=0;x<s;++x)f[s-1-x]=g,g*=i[t.batchDims+s-1-x];let m=rd(e,r[1],f,t.batchDims,i,o,c,p,s),_=t.batchDims+s;if(_>i.length)throw new Error("last dimension of indices must not be larger than rank of input tensor");let v=a.slice(0,-1).concat(i.slice(_)),$=R.size(v),w=[{type:12,data:$},{type:12,data:l},...ie(r[0].dims,m.dims,v)],S=x=>{let I=U("data",r[0].dataType,r[0].dims.length),C=U("slice_offsets",12,m.dims.length),z=te("output",r[0].dataType,v.length);return`
          ${x.registerUniform("output_size","u32").registerUniform("slice_size","u32").declareVariables(I,C,z)}
            ${x.mainStart()}
            ${x.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
          let slice_offset = slice_offsets[global_idx / uniforms.slice_size];
          output[global_idx] = data[u32(slice_offset) + global_idx % uniforms.slice_size];
        }`};e.compute({name:"GatherND",shaderCache:{hint:t.cacheKey,inputDependencies:["rank","rank"]},getRunData:()=>({outputs:[{dims:v,dataType:n}],dispatchGroup:{x:Math.ceil($/64)},programUniforms:w}),getShaderSource:S},{inputs:[r[0],m]})},Uf=e=>({batchDims:e.batch_dims,cacheKey:""})}),id,nd,Lf,qf,Y_=H(()=>{ne(),ae(),Ce(),se(),id=(e,t)=>{if(e.length<3||e.length>4)throw new Error("GatherBlockQuantized requires 3 or 4 inputs.");let r=R.normalizeAxis(t.quantizeAxis,e[0].dims.length),i=t.blockSize,n=e[0],a=e[2],s=e.length===4?e[3]:void 0;if(a.dims.length!==n.dims.length||!n.dims.map((o,l)=>l===r?Math.ceil(o/i)===a.dims[l]:o===a.dims[l]).reduce((o,l)=>o&&l,!0))throw new Error("Scales must have the same rank as the input tensor and the dims should match except on gatherAxis.");if(s){if(s.dataType!==n.dataType)throw new Error("Zero point must have the same data type as the input tensor.");if(s.dims.length!==a.dims.length||!s.dims.map((o,l)=>o===a.dims[l]).reduce((o,l)=>o&&l,!0))throw new Error("Zero point must have the same rank as the input tensor and the dims should match except on quantizeAxis.")}},nd=(e,t)=>{let r=e[0].dims,i=e[1].dims,n=r.length,a=R.normalizeAxis(t.gatherAxis,n),s=R.normalizeAxis(t.quantizeAxis,n),o=r.slice(0);o.splice(a,1,...i);let l=R.size(o),d=e[2].dataType,p=e[0].dataType===22,c=[{type:12,data:l},{type:12,data:s},{type:12,data:a},{type:12,data:t.blockSize},...ie(...e.map((g,m)=>g.dims),o)],f=g=>{let m=U("data",e[0].dataType,e[0].dims.length),_=U("inputIndices",e[1].dataType,e[1].dims.length),v=U("scales",e[2].dataType,e[2].dims.length),$=e.length>3?U("zeroPoint",e[3].dataType,e[3].dims.length):void 0,w=te("output",d,o.length),S=[m,_,v];$&&S.push($);let x=[{name:"output_size",type:"u32"},{name:"quantize_axis",type:"u32"},{name:"gather_axis",type:"u32"},{name:"block_size",type:"u32"}];return`
        ${g.registerUniforms(x).declareVariables(...S,w)}
        ${g.mainStart()}
        let output_indices = ${w.offsetToIndices("global_idx")};
        var indices_indices = ${_.type.indices}(0);
        ${i.length>1?`
          for (var i: u32 = 0; i < ${i.length}; i++) {
            let index = ${w.indicesGet("output_indices","uniforms.gather_axis + i")};
            ${_.indicesSet("indices_indices","i","index")};
          }`:`indices_indices = ${w.indicesGet("output_indices","uniforms.gather_axis")};`};
        var data_indices = ${m.type.indices}(0);
        for (var i: u32 = 0; i < uniforms.gather_axis; i++) {
          let index = ${w.indicesGet("output_indices","i")};
          ${m.indicesSet("data_indices","i","index")};
        }
        var index_from_indices = ${_.getByIndices("indices_indices")};
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
    }`};return{name:"GatherBlockQuantized",shaderCache:{hint:`${t.cacheKey};${e.filter((g,m)=>m!==1).map(g=>g.dims.join("_")).join(";")}`,inputDependencies:Array.from({length:e.length},(g,m)=>"rank")},getRunData:()=>({outputs:[{dims:o,dataType:d}],dispatchGroup:{x:Math.ceil(l/64)},programUniforms:c}),getShaderSource:f}},Lf=(e,t)=>{let r=e.inputs;id(r,t),e.compute(nd(e.inputs,t))},qf=e=>ye({blockSize:e.blockSize,gatherAxis:e.gatherAxis,quantizeAxis:e.quantizeAxis})}),ad,sd,Wf,Gf,Q_=H(()=>{ne(),ae(),Ce(),se(),ad=e=>{if(!e||e.length!==2)throw new Error("GatherElements requires 2 inputs.");if(e[0].dims.length<1)throw new Error("GatherElements requires that the data input be rank >= 1.");if(e[0].dims.length!==e[1].dims.length)throw new Error(`GatherElements requires that the data input and
                     indices input tensors be of same rank.`)},sd=(e,t)=>{let r=e[0].dims,i=e[0].dataType,n=r.length,a=e[1].dims,s=e[1].dataType,o=R.normalizeAxis(t.axis,n),l=r[o],d=a.slice(0),p=R.size(d),c=U("input",i,n),f=U("indicesInput",s,a.length),g=te("output",i,d.length),m=[{type:12,data:p},{type:6,data:l},{type:12,data:o}];return m.push(...ie(r,a,d)),{name:"GatherElements",shaderCache:{inputDependencies:["rank","rank"]},getRunData:()=>({outputs:[{dims:d,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(p/64)},programUniforms:m}),getShaderSource:_=>`
      ${_.registerUniform("outputSize","u32").registerUniform("axisDimLimit","i32").registerUniform("axis","u32").declareVariables(c,f,g)}
      ${_.mainStart()}
      ${_.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}

      let outputIndices = ${g.offsetToIndices("global_idx")};

      var idx = ${f.getByOffset("global_idx")};
      if (idx < 0) {
        idx = idx + uniforms.axisDimLimit;
      }
      var inputIndices = ${c.type.indices}(outputIndices);
      ${c.indicesSet("inputIndices","uniforms.axis","u32(idx)")};
      let value = ${c.getByIndices("inputIndices")};

      ${g.setByOffset("global_idx","value")};
  }`}},Wf=e=>ye({axis:e.axis}),Gf=(e,t)=>{let r=e.inputs;ad(r),e.compute(sd(e.inputs,t))}}),od,ud,Ff,Vf,J_=H(()=>{ne(),ae(),se(),od=e=>{if(!e)throw new Error("Input is missing");if(e.length<2||e.length>3)throw new Error("Invaid input number.");if(e.length===3&&e[2].dims.length>2)throw new Error("Invalid input shape of C");if(e[0].dataType!==e[1].dataType||e.length===3&&e[0].dataType!==e[2].dataType)throw new Error("Input types are mismatched")},ud=(e,t)=>{let r=e[0].dims.slice(),i=e[1].dims.slice(),[n,a,s]=qc.getShapeOfGemmResult(r,t.transA,i,t.transB,e.length===3?e[2].dims:void 0),o=[n,a];if(!o)throw new Error("Can't use gemm on the given tensors");let l=16,d=Math.ceil(a/l),p=Math.ceil(n/l),c=!0,f=R.size(o),g=[{type:12,data:c?d:f},{type:12,data:n},{type:12,data:a},{type:12,data:s},{type:1,data:t.alpha},{type:1,data:t.beta}],m=["type","type"];e.length===3&&(g.push(...ie(e[2].dims)),m.push("rank")),g.push(...ie(o));let _=$=>{let w="";t.transA&&t.transB?w="value += a[k * uniforms.M + m] * b[n * uniforms.K + k];":t.transA&&!t.transB?w="value += a[k * uniforms.M + m] * b[k * uniforms.N + n];":!t.transA&&t.transB?w="value += a[m * uniforms.K + k] * b[n * uniforms.K + k];":!t.transA&&!t.transB&&(w="value += a[m * uniforms.K + k] * b[k * uniforms.N + n];");let S=t.alpha===1?"":"value *= uniforms.alpha;",x=U("a",e[0].dataType,e[0].dims),I=U("b",e[1].dataType,e[1].dims),C=x.type.value,z=null,k=[x,I];e.length===3&&(z=U("c",e[2].dataType,e[2].dims.length),k.push(z));let B=te("output",e[0].dataType,o.length);k.push(B);let L=[{name:"output_size",type:"u32"},{name:"M",type:"u32"},{name:"N",type:"u32"},{name:"K",type:"u32"},{name:"alpha",type:"f32"},{name:"beta",type:"f32"}];return`
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
    ${z!=null?`let cOffset = ${z.broadcastedIndicesToOffset("vec2(m, n)",B)}; value += ${C}(uniforms.beta) * ${z.getByOffset("cOffset")};`:""}
    output[global_idx] = value;
  }`},v=$=>{let w=U("a",e[0].dataType,e[0].dims),S=U("b",e[1].dataType,e[1].dims),x=null,I=[w,S];e.length===3&&(x=U("c",e[2].dataType,e[2].dims.length),I.push(x));let C=te("output",e[0].dataType,o.length);I.push(C);let z=[{name:"num_tile_n",type:"u32"},{name:"M",type:"u32"},{name:"N",type:"u32"},{name:"K",type:"u32"},{name:"alpha",type:"f32"},{name:"beta",type:"f32"}],k="",B="";t.transA&&t.transB?(B=`
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
      ${B}
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
  }`};return c?{name:"GemmShared",shaderCache:{hint:`${t.cacheKey}`,inputDependencies:m},getRunData:()=>({outputs:[{dims:o,dataType:e[0].dataType}],dispatchGroup:{x:d*p},programUniforms:g}),getShaderSource:v}:{name:"Gemm",shaderCache:{hint:`${t.cacheKey}`,inputDependencies:m},getRunData:()=>({outputs:[{dims:o,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(f/64)},programUniforms:g}),getShaderSource:_}},Ff=e=>{let t=e.transA,r=e.transB,i=e.alpha,n=e.beta;return{transA:t,transB:r,alpha:i,beta:n,cacheKey:`${e.transA};${e.transB};${e.alpha===1}`}},Vf=(e,t)=>{od(e.inputs),e.compute(ud(e.inputs,t))}}),lt,ft,At,Mt,ld,dd,pd,cd,hd,fd,md,gd,Hf,jf,eb=H(()=>{ne(),ae(),Ce(),se(),[lt,ft,At,Mt]=[0,1,2,3],ld=e=>{if(e[0].dims.length!==4)throw new Error("only 4-D tensor is supported.");if(e[0].dims.length!==e[1].dims.length)throw new Error("input dimensions must be equal to grid dimensions");if(e[0].dims.length-2!==e[1].dims[e[1].dims.length-1])throw new Error(`last dimension of grid must be equal to ${e[0].dims.length-2}`);if(e[0].dims[0]!==e[1].dims[0])throw new Error("grid batch size must match input batch size")},dd=`
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
`,pd=e=>`
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
`,cd=e=>`
  fn gs_denormalize(n: f32, length: i32) -> f32 {
    ${e.alignCorners===0?`
    // alignCorners: false => [-1, 1] to [-0.5, length - 0.5]
    return ((n + 1.0) * f32(length) - 1.0) / 2.0;
    `:`
    // alignCorners: true => [-1, 1] to [0, length - 1]
    return (n + 1.0) / 2.0 * (f32(length - 1));
    `}
  }
`,hd=e=>`
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
`,fd=(e,t,r)=>`
  fn pixel_at_grid(r: i32, c: i32, H: i32, W: i32, batch: u32, channel: u32, border: vec4<f32>) -> ${t} {
     var pixel = ${t}(0);
     var indices = vec4<u32>(0);
     indices[${lt}] = batch;
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
`,md=(e,t,r)=>(()=>{switch(r.mode){case"nearest":return`
          let result = pixel_at_grid(i32(round(y)), i32(round(x)), H_in, W_in, indices[${lt}], indices[${ft}], border);
        `;case"bilinear":return`
          let x1 = i32(floor(x));
          let y1 = i32(floor(y));
          let x2 = x1 + 1;
          let y2 = y1 + 1;

          let p11 = pixel_at_grid(y1, x1, H_in, W_in, indices[${lt}], indices[${ft}], border);
          let p12 = pixel_at_grid(y1, x2, H_in, W_in, indices[${lt}], indices[${ft}], border);
          let p21 = pixel_at_grid(y2, x1, H_in, W_in, indices[${lt}], indices[${ft}], border);
          let p22 = pixel_at_grid(y2, x2, H_in, W_in, indices[${lt}], indices[${ft}], border);

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
              p[h][w] = pixel_at_grid(h + y0, w + x0, H_in, W_in, indices[${lt}], indices[${ft}], border);
            }
          }

          let dx = x - f32(x0 + 1);
          let dy = y - f32(y0 + 1);
          let result = gs_bicubic_interpolate(p, dx, dy);
        `;default:throw new Error(`mode ${r.mode} is not supported`)}})()+`${e.setByOffset("global_idx","result")}`,gd=(e,t)=>{let r=U("x",e[0].dataType,e[0].dims.length),i=[e[1].dims[0],e[1].dims[1],e[1].dims[2]],n=U("grid",e[1].dataType,i.length,2),a=[e[0].dims[0],e[0].dims[1],e[1].dims[1],e[1].dims[2]];t.format==="NHWC"&&(a=[e[0].dims[0],e[1].dims[1],e[1].dims[2],e[0].dims[3]],[lt,ft,At,Mt]=[0,3,1,2]);let s=te("output",e[0].dataType,a.length),o=r.type.value,l=R.size(a),d=[{type:12,data:l},...ie(e[0].dims,i,a)],p=c=>`
  ${c.registerUniform("output_size","u32").declareVariables(r,n,s)}
  ${dd}
  ${pd(o)}
  ${cd(t)}
  ${hd(t)}
  ${fd(r,o,t)}

  ${c.mainStart()}
    ${c.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
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
      var grid_indices = vec3<u32>(indices[${lt}], indices[${At}], indices[${Mt}]);
      let nxy = ${n.getByIndices("grid_indices")};
      var x = gs_denormalize(f32(nxy[0]), W_in);
      var y = gs_denormalize(f32(nxy[1]), H_in);

      ${md(s,o,t)}
  }`;return{name:"GridSample",shaderCache:{hint:`${t.cacheKey}`,inputDependencies:["type","type"]},getRunData:c=>{let f=R.size(a);return{outputs:[{dims:a,dataType:c[0].dataType}],dispatchGroup:{x:Math.ceil(f/64)},programUniforms:d}},getShaderSource:p}},Hf=(e,t)=>{ld(e.inputs),e.compute(gd(e.inputs,t))},jf=e=>ye({alignCorners:e.align_corners,mode:e.mode,paddingMode:e.padding_mode,format:e.format})}),Pe,yd,Kf,kn,_d,vr,Xf,Zf=H(()=>{ne(),ae(),Ce(),Ra(),Da(),se(),Tt(),Pe=(e,t)=>e.length>t&&e[t].dims.length>0?e[t]:void 0,yd=(e,t)=>{let r=e[0],i=Pe(e,1),n=Pe(e,2),a=Pe(e,3),s=Pe(e,4),o=Pe(e,5),l=Pe(e,6),d=Pe(e,7);if(r.dims.length!==3&&r.dims.length!==5)throw new Error("Input query is expected to have 3 or 5 dimensions");let p=r.dims[0],c=r.dims[1],f=r.dims.length===3?r.dims[2]:t.numHeads*r.dims[4],g=c,m=0,_=0,v=Math.floor(f/t.numHeads);if(l&&d&&R.size(l.dims)&&R.size(d.dims)){if(l.dims.length!==4)throw new Error('Input "past_key" is expected to have 4 dimensions');if(l.dims[0]!==p||l.dims[1]!==t.numHeads||l.dims[3]!==v)throw new Error('Input "past_key" shape (batch_size, num_heads, past_sequence_length, head_size)');if(d.dims[0]!==p||d.dims[1]!==t.numHeads||d.dims[3]!==v)throw new Error('Input "past_value" shape (batch_size, num_heads, past_sequence_length, head_size)');if(l.dims[2]!==d.dims[2])throw new Error('Input "past_key" and "past_value" shall have same dim 2 (past_sequence_length)');if(d.dims.length!==4)throw new Error('Input "past_value" is expected to have 4 dimensions');m=l.dims[2],_=l.dims[2]}else if(l&&R.size(l.dims)||d&&R.size(d.dims))throw new Error('Input "past_key" and "past_value" shall be both present or both absent');let $;if(i&&R.size(i.dims)>0){if(r.dims.length!==3)throw new Error('Input "query" is expected to have 3 dimensions when key is given');if(i.dims.length<3||i.dims.length>5)throw new Error('Input "key" is expected to have 3, 4, or 5 dimensions');if(r.dims[0]!==i.dims[0])throw new Error('Input "query" and "key" shall have same dim 0 (batch size)');if(i.dims.length===3){if(i.dims[2]!==r.dims[2])throw new Error('Input "query" and "key" shall have same dim 2 (hidden_size)');$=2,g=i.dims[1]}else if(i.dims.length===5){if(i.dims[2]!==t.numHeads||i.dims[3]!==2||i.dims[4]!==v)throw new Error('Expect "key" shape (batch_size, kv_sequence_length, num_heads, 2, head_size) for packed kv');if(n)throw new Error('Expect "value" be none when "key" has packed kv format.');$=5,g=i.dims[1]}else{if(i.dims[1]!==t.numHeads||i.dims[3]!==v)throw new Error('Expect "key" shape (batch_size, num_heads, kv_sequence_length, head_size) for past_key');$=0,g=i.dims[2]}}else{if(r.dims.length!==5)throw new Error('Input "query" is expected to have 5 dimensions when key is empty');if(r.dims[2]!==t.numHeads||r.dims[3]!==3)throw new Error('Expect "query" shape (batch_size, kv_sequence_length, num_heads, 3, head_size) for packed kv');$=3}if(a&&R.size(a.dims)>0){if(a.dims.length!==1)throw new Error('Input "bias" is expected to have 1 dimension');if(i&&i.dims.length===5&&i.dims[3]===2)throw new Error("bias is not allowed for packed kv.")}let w=m+g,S=0;if(s&&R.size(s.dims)>0){S=8;let z=s.dims;throw z.length===1?z[0]===p?S=1:z[0]===3*p+2&&(S=3):z.length===2&&z[0]===p&&z[1]===w&&(S=5),S===8?new Error('Input "key_padding_mask" shape shall be (batch_size) or (batch_size, total_sequence_length)'):new Error("Mask not supported")}let x=!1,I=f;if(n&&R.size(n.dims)>0){if(n.dims.length!==3&&n.dims.length!==4)throw new Error('Input "value" is expected to have 3 or 4 dimensions');if(r.dims[0]!==n.dims[0])throw new Error('Input "query" and "value" shall have same dim 0 (batch_size)');if(n.dims.length===3){if(g!==n.dims[1])throw new Error('Input "key" and "value" shall have the same dim 1 (kv_sequence_length)');I=n.dims[2]}else{if(g!==n.dims[2])throw new Error('Input "key" and "value" shall have the same dim 2 (kv_sequence_length)');I=n.dims[1]*n.dims[3],x=!0}}let C=!1;if(s&&R.size(s.dims)>0)throw new Error("Key padding mask is not supported");if(o&&R.size(o.dims)>0){if(o.dims.length!==4)throw new Error('Input "attention_bias" is expected to have 4 dimensions');if(o.dims[0]!==p||o.dims[1]!==t.numHeads||o.dims[2]!==c||o.dims[3]!==w)throw new Error('Expect "attention_bias" shape (batch_size, num_heads, sequence_length, total_sequence_length)')}return{batchSize:p,sequenceLength:c,pastSequenceLength:m,kvSequenceLength:g,totalSequenceLength:w,maxSequenceLength:_,inputHiddenSize:0,hiddenSize:f,vHiddenSize:I,headSize:v,vHeadSize:Math.floor(I/t.numHeads),numHeads:t.numHeads,isUnidirectional:!1,pastPresentShareBuffer:!1,maskFilterValue:t.maskFilterValue,maskType:S,scale:t.scale,broadcastResPosBias:C,passPastInKv:x,qkvFormat:$}},Kf=e=>ye({...e}),kn=ye({perm:[0,2,1,3]}),_d=(e,t,r,i,n,a,s)=>{let o=[i,n,a],l=R.size(o),d=[{type:12,data:l},{type:12,data:s},{type:12,data:a}],p=c=>{let f=te("qkv_with_bias",t.dataType,o),g=U("qkv",t.dataType,o),m=U("bias",r.dataType,o),_=[{name:"output_size",type:"u32"},{name:"bias_offset",type:"u32"},{name:"hidden_size",type:"u32"}];return`
  ${c.registerUniforms(_).declareVariables(g,m,f)}
  ${c.mainStart()}
    ${c.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
    let bias_offset_idx = (global_idx % uniforms.hidden_size) + uniforms.bias_offset;

    qkv_with_bias[global_idx] = qkv[global_idx] + bias[bias_offset_idx];
  }`};return e.compute({name:"MultiHeadAttentionAddBias",shaderCache:{inputDependencies:["type","type"]},getRunData:()=>({outputs:[{dims:o,dataType:t.dataType,gpuDataType:0}],dispatchGroup:{x:Math.ceil(l/64)},programUniforms:d}),getShaderSource:p},{inputs:[t,r],outputs:[-1]})[0]},vr=(e,t,r,i,n,a,s,o)=>{let l=a;if(s&&R.size(s.dims)>0){if(i===1)throw new Error("AddBiasReshape is not implemented. Please export your model with packed QKV or KV");return l=_d(e,a,s,t,i,r*n,o),l=l.reshape([t,i,r,n]),r===1||i===1?l:e.compute(Fe(l,kn.perm),{inputs:[l],outputs:[-1]})[0]}else return a.dims.length===3&&(l=a.reshape([t,i,r,n])),r===1||i===1?l:e.compute(Fe(l,kn.perm),{inputs:[l],outputs:[-1]})[0]},Xf=(e,t)=>{let r=yd(e.inputs,t),i=e.inputs[0],n=Pe(e.inputs,1),a=Pe(e.inputs,2),s=Pe(e.inputs,3),o=Pe(e.inputs,4),l=Pe(e.inputs,5),d=Pe(e.inputs,6),p=Pe(e.inputs,7);if(i.dims.length===5)throw new Error("Packed QKV is not implemented");if(n?.dims.length===5)throw new Error("Packed KV is not implemented");let c=n&&a&&n.dims.length===4&&a.dims.length===4,f=vr(e,r.batchSize,r.numHeads,r.sequenceLength,r.headSize,i,s,0);if(c)return Tr(e,f,n,a,o,void 0,d,p,l,r);if(!n||!a)throw new Error("key and value must be provided");let g=vr(e,r.batchSize,r.numHeads,r.kvSequenceLength,r.headSize,n,s,r.hiddenSize),m=vr(e,r.batchSize,r.numHeads,r.kvSequenceLength,r.vHeadSize,a,s,2*r.hiddenSize);Tr(e,f,g,m,o,void 0,d,p,l,r)}}),bd,wd,$d,vd,ma,Yf,Qf,Jf=H(()=>{ne(),ae(),Ce(),se(),bd=e=>{if(!e||e.length<1)throw new Error("too few inputs")},wd=(e,t)=>{let r=[],i=t.numOutputs;return e[1].dims[0]>0&&(e[1].getBigInt64Array().forEach(n=>r.push(Number(n))),i=r.length),ye({numOutputs:i,axis:t.axis,splitSizes:r})},$d=e=>`
fn calculateOutputIndex(index: u32) -> u32 {
    for (var i: u32 = 0u; i < ${e}u; i += 1u ) {
    if (index < ${re("uniforms.size_in_split_axis","i",e)}) {
        return i;
    }
    }
    return ${e}u;
}`,vd=e=>{let t=e.length,r=[];for(let i=0;i<t;++i){let n=e[i].setByIndices("indices","input[global_idx]");t===1?r.push(n):i===0?r.push(`if (output_number == ${i}u) { ${n} }`):i===t-1?r.push(`else { ${n} }`):r.push(`else if (output_number == ${i}) { ${n} }`)}return`
      fn writeBufferData(output_number: u32, indices: ${e[0].type.indices}, global_idx: u32) {
        ${r.join(`
`)}
      }`},ma=(e,t)=>{let r=e[0].dims,i=R.size(r),n=e[0].dataType,a=R.normalizeAxis(t.axis,r.length),s=new Array(t.numOutputs),o=U("input",n,r.length),l=new Array(t.numOutputs),d=[],p=[],c=0,f=[{type:12,data:i}];for(let m=0;m<t.numOutputs;m++){c+=t.splitSizes[m],l[m]=c;let _=r.slice();_[a]=t.splitSizes[m],p.push(_),s[m]=te(`output${m}`,n,_.length),d.push({dims:p[m],dataType:e[0].dataType})}f.push({type:12,data:l},...ie(r,...p));let g=m=>`
  ${m.registerUniform("input_size","u32").registerUniform("size_in_split_axis","u32",l.length).declareVariables(o,...s)}
  ${$d(l.length)}
  ${vd(s)}

  ${m.mainStart()}
    ${m.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.input_size")}

    var indices = ${o.offsetToIndices("global_idx")};
    var index = ${o.indicesGet("indices",a)};
    let output_number = calculateOutputIndex(index);
    if (output_number != 0) {
      index -= ${re("uniforms.size_in_split_axis","output_number - 1u",l.length)};
      ${o.indicesSet("indices",a,"index")};
    }
    writeBufferData(output_number, indices, global_idx);
  }`;return{name:"Split",shaderCache:{hint:t.cacheKey,inputDependencies:["rank"]},getShaderSource:g,getRunData:()=>({outputs:d,dispatchGroup:{x:Math.ceil(i/64)},programUniforms:f})}},Yf=(e,t)=>{bd(e.inputs);let r=e.inputs.length===1?t:wd(e.inputs,t);e.compute(ma(e.inputs,r),{inputs:[0]})},Qf=e=>{let t=e.axis,r=e.splitSizes,i=e.numOutputs<0?r.length:e.numOutputs;if(i!==r.length)throw new Error("numOutputs and splitSizes length must be equal");return ye({axis:t,numOutputs:i,splitSizes:r})}}),xd,hi,em,tm=H(()=>{ne(),ae(),Ce(),se(),xd=(e,t)=>{let[r,i,n,a]=e,{numHeads:s,rotaryEmbeddingDim:o}=t;if(r.dims.length!==3&&r.dims.length!==4)throw new Error(`Input 'x' is expected to have 3 or 4 dimensions, got ${r.dims.length}`);if(!R.areEqual(i.dims,[])&&!R.areEqual(i.dims,[1])&&i.dims.length!==2)throw new Error(`Input 'position_ids' is expected to have 0, 1, or 2 dimensions, got ${i.dims.length}`);if(n.dims.length!==2)throw new Error(`Input 'cos_cache' is expected to have 2 dimensions, got ${n.dims.length}`);if(a.dims.length!==2)throw new Error(`Input 'sin_cache' is expected to have 2 dimensions, got ${a.dims.length}`);if(!R.areEqual(n.dims,a.dims))throw new Error("Inputs 'cos_cache' and 'sin_cache' are expected to have the same shape");if(o>0&&s===0)throw new Error("num_heads must be provided if rotary_embedding_dim is specified");let l=r.dims[0],d=r.dims[r.dims.length-2],p=n.dims[0],c=R.sizeFromDimension(r.dims,1)/d,f=o===0?n.dims[1]*2:c/s;if(o>f)throw new Error("rotary_embedding_dim must be less than or equal to head_size");if(i.dims.length===2){if(l!==i.dims[0])throw new Error(`Input 'position_ids' dimension 0 should be of size batch_size, got ${i.dims[0]}`);if(d!==i.dims[1])throw new Error(`Input 'position_ids' dimension 1 should be of size sequence_length, got ${i.dims[1]}`)}if(d>p)throw new Error("Updating cos_cache and sin_cache in RotaryEmbedding is not currently supported");if(f/2!==n.dims[1]&&o/2!==n.dims[1])throw new Error(`Input 'cos_cache' dimension 1 should be same as head_size / 2 or rotary_embedding_dim / 2, got ${n.dims[1]}`)},hi=(e,t)=>{let{interleaved:r,numHeads:i,rotaryEmbeddingDim:n,scale:a}=t,s=e[0].dims[0],o=R.sizeFromDimension(e[0].dims,1),l=e[0].dims[e[0].dims.length-2],d=o/l,p=e[2].dims[1],c=n===0?p*2:d/i,f=new Array(s,l,d/c,c-p),g=R.computeStrides(f),m=[{type:1,data:a},{type:12,data:f},{type:12,data:g},...e[0].dims.length===3?new Array({type:12,data:[o,d,c,1]}):[],...e[0].dims.length===4?new Array({type:12,data:[o,c,l*c,1]}):[],...ie(e[0].dims,e[1].dims,e[2].dims,e[3].dims,e[0].dims)],_=v=>{let $=U("input",e[0].dataType,e[0].dims.length),w=U("position_ids",e[1].dataType,e[1].dims.length),S=U("cos_cache",e[2].dataType,e[2].dims.length),x=U("sin_cache",e[3].dataType,e[3].dims.length),I=te("output",e[0].dataType,e[0].dims.length);return v.registerUniforms([{name:"scale",type:"f32"},{name:"global_shape",type:"u32",length:f.length},{name:"global_strides",type:"u32",length:g.length},{name:"input_output_strides",type:"u32",length:g.length}]),`
        ${v.declareVariables($,w,S,x,I)}

        ${v.mainStart(rr)}
          let half_rotary_emb_dim = uniforms.${S.name}_shape[1];
          let bsnh = global_idx / uniforms.global_strides % uniforms.global_shape;
          let size = uniforms.global_shape[0] * uniforms.global_strides[0];
          ${v.guardAgainstOutOfBoundsWorkgroupSizes("size")}

          if (bsnh[3] < half_rotary_emb_dim) {
            let position_ids_idx =
                ${w.broadcastedIndicesToOffset("bsnh.xy",te("",w.type.tensor,2))};
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
        }`};return{name:"RotaryEmbedding",shaderCache:{hint:ye({interleaved:r}).cacheKey,inputDependencies:["rank","rank","rank","rank"]},getShaderSource:_,getRunData:()=>({outputs:[{dims:e[0].dims,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(R.size(f)/rr)},programUniforms:m})}},em=(e,t)=>{xd(e.inputs,t),e.compute(hi(e.inputs,t))}}),Sd,kd,Tn,Td,rm,tb=H(()=>{Ce(),ne(),Da(),Zf(),Jf(),Tt(),tm(),se(),Sd=(e,t)=>{if(t.doRotary&&e.length<=7)throw new Error("cos_cache and sin_cache inputs are required if do_rotary is specified");let r=e[0],i=e[1],n=e[2],a=e[3],s=e[4];if(t.doRotary!==0&&e.length<=7)throw new Error("cos_cast and sin_cache are expected if do_rotary attribute is non-zero");if(t.localWindowSize!==-1)throw new Error("Local attention is not supported");if(t.softcap!==0)throw new Error("Softcap is not supported");if(t.rotaryInterleaved!==0)throw new Error("Rotary interleaved is not supported");if(t.smoothSoftmax)throw new Error("Smooth softmax is not supported");if(r.dims.length!==3&&r.dims.length!==5)throw new Error("Input query is expected to have 3 or 5 dimensions");let o=!1,l=r.dims[0],d=r.dims[1],p=r.dims.length===3?o?r.dims[2]/3:r.dims[2]:t.numHeads*r.dims[4],c=d,f=0,g=!i||i.dims.length===0,m=Math.floor(g?p/(t.numHeads+2*t.kvNumHeads):p/t.numHeads);g&&(p=m*t.numHeads);let _=a&&a.dims.length!==0,v=s&&s.dims.length!==0;if(_&&a.dims.length===4&&a.dims[0]===l&&a.dims[1]!==t.kvNumHeads&&a.dims[2]===t.kvNumHeads&&a.dims[3]===m)throw new Error("BSNH pastKey/pastValue is not supported");if(_&&v){if(a.dims.length!==4)throw new Error('Input "past_key" is expected to have 4 dimensions');if(s.dims.length!==4)throw new Error('Input "past_value" is expected to have 4 dimensions');f=a.dims[2]}else if(_||v)throw new Error('Input "past_key" and "past_value" shall be both present or both absent');let $=1;if(i&&i.dims.length>0){if(r.dims.length!==3)throw new Error('Input "query" is expected to have 3 dimensions when key is given');if(i.dims.length<3||i.dims.length>5)throw new Error('Input "key" is expected to have 3, 4, or 5 dimensions');if(r.dims[0]!==i.dims[0])throw new Error('Input "query" and "key" shall have same dim 0 (batch size)');if(i.dims.length===3){if(r.dims[2]%i.dims[2]!==0)throw new Error('Dimension 2 of "query" should be a multiple of "key"');c=i.dims[1]}else if(i.dims.length===5){if(i.dims[2]!==t.numHeads||i.dims[3]!==2||i.dims[4]!==m)throw new Error('Expect "key" shape (batch_size, kv_sequence_length, num_heads, 2, head_size) for packed kv');if(n)throw new Error('Expect "value" be none when "key" has packed kv format.');c=i.dims[1]}else{if(i.dims[1]!==t.numHeads||i.dims[3]!==m)throw new Error('Expect "key" shape (batch_size, num_heads, kv_sequence_length, head_size) for past_key');c=i.dims[2]}}else{if(r.dims.length!==3&&r.dims.length!==5)throw new Error('Input "query" is expected to have 3 or 5 dimensions when key is empty');if(r.dims.length===5&&(r.dims[2]!==t.numHeads||r.dims[3]!==3))throw new Error('Expect "query" shape (batch_size, kv_sequence_length, num_heads, 3, head_size) for packed kv');$=3}let w=0,S=!1,x=t.kvNumHeads?m*t.kvNumHeads:p;if(n&&n.dims.length>0){if(n.dims.length!==3&&n.dims.length!==4)throw new Error('Input "value" is expected to have 3 or 4 dimensions');if(r.dims[0]!==n.dims[0])throw new Error('Input "query" and "value" shall have same dim 0 (batch_size)');if(n.dims.length===3){if(c!==n.dims[1])throw new Error('Input "key" and "value" shall have the same dim 1 (kv_sequence_length)');x=n.dims[2]}else{if(c!==n.dims[2])throw new Error('Input "past_key" and "past_value" shall have the same dim 2 (kv_sequence_length)');x=n.dims[1]*n.dims[3],S=!0}}let I=e.length>4?e[5]:void 0;if(I){if(I.dims.length===0)throw new Error("seqlens_k must be at least 1D, got scalar.");let C=I.dims.reduce((z,k)=>z*k,1);if(C!==l)throw new Error(`seqlens_k must have batch_size (${l}) elements, got ${C}.`);for(let z=0;z<I.dims.length;z++)if(I.dims[z]!==1&&I.dims[z]!==l)throw new Error(`seqlens_k has unexpected shape. Each dimension must be 1 or batch_size (${l}), got dims[${z}] = ${I.dims[z]}.`)}return{batchSize:l,sequenceLength:d,pastSequenceLength:f,kvSequenceLength:c,totalSequenceLength:-1,maxSequenceLength:-1,inputHiddenSize:0,hiddenSize:p,vHiddenSize:x,headSize:m,vHeadSize:Math.floor(x/t.kvNumHeads),numHeads:t.numHeads,kvNumHeads:t.kvNumHeads,nReps:t.numHeads/t.kvNumHeads,pastPresentShareBuffer:!1,maskType:w,scale:t.scale,broadcastResPosBias:!1,passPastInKv:S,qkvFormat:$}},kd=ye({perm:[0,2,1,3]}),Tn=(e,t,r)=>{let i=t,n=r.kvNumHeads;return t.dims.length===3&&r.kvSequenceLength!==0&&(i=t.reshape([r.batchSize,r.kvSequenceLength,n,r.headSize]),i=e.compute(Fe(i,kd.perm),{inputs:[i],outputs:[-1]})[0]),i},Td=(e,t,r,i)=>{let n=7,a=["type","type"],s=[e*t],o=e*t,l=[{type:12,data:o},{type:12,data:t},{type:12,data:e}],d=p=>{let c=U("seq_lens",r.dataType,r.dims),f=U("total_seq_lens",i.dataType,i.dims),g=te("pos_ids",n,s),m=[{name:"output_size",type:"u32"},{name:"sequence_length",type:"u32"},{name:"batch_size",type:"u32"}];return`
  ${p.registerUniforms(m).declareVariables(c,f,g)}
  ${p.mainStart()}
    ${p.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
    let total_sequence_length = u32(${f.getByOffset("0")});
    let is_subsequent_prompt = uniforms.sequence_length > 1 && uniforms.sequence_length != total_sequence_length;
    let is_first_prompt = !is_subsequent_prompt && uniforms.sequence_length == total_sequence_length;
    let batch_idx = global_idx / uniforms.sequence_length;
    let sequence_idx = i32(global_idx % uniforms.sequence_length);
    var pos_id: i32 = 0;
    let seqlen = ${c.getByOffset("batch_idx")};
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
  `};return{name:"GeneratePositionIds",shaderCache:{hint:`${e};${t}`,inputDependencies:a},getRunData:()=>({outputs:[{dims:s,dataType:n}],dispatchGroup:{x:Math.ceil(o/64)},programUniforms:l}),getShaderSource:d}},rm=(e,t)=>{let r=Sd(e.inputs,t);if(e.inputs[0].dims.length===5)throw new Error("Packed QKV is not implemented");if(e.inputs[1]?.dims.length===5)throw new Error("Packed KV is not implemented");let i=e.inputs[0],n=e.inputs[1]&&e.inputs[1].dims.length>0?e.inputs[1]:void 0,a=e.inputs[2]&&e.inputs[2].dims.length>0?e.inputs[2]:void 0,s=e.inputs[3]&&e.inputs[3].dims.length!==0?e.inputs[3]:void 0,o=e.inputs[4]&&e.inputs[4].dims.length!==0?e.inputs[4]:void 0,l=e.inputs.length>4?e.inputs[5]:void 0,d=e.inputs.length>5?e.inputs[6]:void 0,p=r.kvNumHeads?r.kvNumHeads:r.numHeads,c=ye({axis:2,numOutputs:3,splitSizes:[r.numHeads*r.headSize,p*r.headSize,p*r.headSize]}),[f,g,m]=!n&&!a?e.compute(ma([i],c),{inputs:[i],outputs:[-1,-1,-1]}):[i,n,a],_,v;if(t.doRotary){let x=e.compute(Td(r.batchSize,r.sequenceLength,l,d),{inputs:[l,d],outputs:[-1]})[0],I=e.inputs[7],C=e.inputs[8],z=ye({interleaved:t.rotaryInterleaved!==0,numHeads:r.numHeads,rotaryEmbeddingDim:0,scale:t.scale}),k=[f,x,I,C],B=[-1];_=e.compute(hi(k,z),{inputs:k,outputs:B})[0],k.splice(0,1,g);let L=ye({interleaved:t.rotaryInterleaved!==0,numHeads:r.kvNumHeads,rotaryEmbeddingDim:0,scale:t.scale});v=e.compute(hi(k,L),{inputs:k,outputs:B})[0]}let $=vr(e,r.batchSize,r.numHeads,r.sequenceLength,r.headSize,t.doRotary?_:f,void 0,0),w=Tn(e,t.doRotary?v:g,r),S=Tn(e,m,r);Tr(e,$,w,S,void 0,void 0,s,o,void 0,r,l,d)}}),In,Id,Ed,im,rb=H(()=>{ne(),ae(),Tt(),se(),In=(e,t,r,i,n,a,s,o)=>{let l=Ie(a),d=l===1?"f32":`vec${l}f`,p=l===1?"vec2f":`mat2x${l}f`,c=n*s,f=64;c===1&&(f=256);let g=[n,s,a/l],m=[n,s,2],_=["rank","type","type"],v=[];v.push(...ie(g,m));let $=w=>{let S=U("x",t.dataType,3,l),x=U("scale",r.dataType,r.dims),I=U("bias",i.dataType,i.dims),C=te("output",1,3,2),z=[S,x,I,C];return`
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
  }`};return e.compute({name:"InstanceNormComputeChannelScaleShift",shaderCache:{hint:`${l};${o};${f}`,inputDependencies:_},getRunData:()=>({outputs:[{dims:m,dataType:1}],dispatchGroup:{x:c},programUniforms:v}),getShaderSource:$},{inputs:[t,r,i],outputs:[-1]})[0]},Id=(e,t,r)=>{let i=t[0].dims,n=i,a=2,s=i[0],o=i[1],l=R.sizeFromDimension(i,a),d=Ie(l),p=R.size(n)/d,c=In(e,t[0],t[1],t[2],s,l,o,r.epsilon),f=[s,o,l/d],g=[s,o],m=["type","none"],_=v=>{let $=U("x",t[0].dataType,f.length,d),w=U("scale_shift",1,g.length,2),S=te("output",t[0].dataType,f.length,d),x=[$,w,S];return`
  ${v.registerUniform("output_size","u32").declareVariables(...x)}
  ${v.mainStart()}
  ${v.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
      let outputIndices = ${S.offsetToIndices("global_idx")};
      let batch = outputIndices[0];
      let channel = outputIndices[1];
      let scale_shift = ${w.getByIndices("vec2<u32>(batch, channel)")};
      let value = ${$.getByOffset("global_idx")} * ${S.type.value}(scale_shift.x) + ${S.type.value}(scale_shift.y);
      ${S.setByOffset("global_idx","value")};
  }`};e.compute({name:"InstanceNormalization",shaderCache:{hint:`${d}`,inputDependencies:m},getRunData:()=>({outputs:[{dims:n,dataType:t[0].dataType}],dispatchGroup:{x:Math.ceil(p/64)},programUniforms:[{type:12,data:p},...ie(f,g,f)]}),getShaderSource:_},{inputs:[t[0],c]})},Ed=(e,t,r)=>{let i=t[0].dims,n=i,a=i[0],s=i[i.length-1],o=R.sizeFromDimension(i,1)/s,l=Ie(s),d=R.size(n)/l,p=[{type:12,data:o},{type:12,data:Math.floor(s/l)}],c=["type","type"],f=!1,g=[0,i.length-1];for(let $=0;$<i.length-2;$++)f=f||i[$+1]!==1,g.push($+1);f=f&&i[i.length-1]!==1;let m=f?e.compute(Fe(e.inputs[0],g),{inputs:[e.inputs[0]],outputs:[-1]})[0]:e.inputs[0].reshape(Array.from({length:i.length},($,w)=>i[g[w]])),_=In(e,m,t[1],t[2],a,o,s,r.epsilon),v=$=>{let w=Oe(t[0].dataType),S=l===1?"vec2f":`mat${l}x2f`,x=z=>{let k=z===0?"x":"y",B=l===1?"f32":`vec${l}f`;switch(l){case 1:return`${w}(${B}(scale.${k}))`;case 2:return`vec2<${w}>(${B}(scale[0].${k}, scale[1].${k}))`;case 4:return`vec4<${w}>(${B}(scale[0].${k}, scale[1].${k}, scale[2].${k}, scale[3].${k}))`;default:throw new Error(`Not supported compoents ${l}`)}},I=U("input",t[0].dataType,t[0].dims,l),C=te("output",t[0].dataType,n,l);return`
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
  }`};e.compute({name:"InstanceNormalizationNHWC",shaderCache:{hint:`${l}`,inputDependencies:c},getRunData:()=>({outputs:[{dims:n,dataType:t[0].dataType}],dispatchGroup:{x:Math.ceil(d/64)},programUniforms:p}),getShaderSource:v},{inputs:[t[0],_]})},im=(e,t)=>{t.format==="NHWC"?Ed(e,e.inputs,t):Id(e,e.inputs,t)}}),Cd,zd,nm,ib=H(()=>{ne(),ae(),se(),Cd=e=>{if(!e||e.length<2)throw new Error("layerNorm requires at least 2 inputs.")},zd=(e,t,r)=>{let i=t.simplified,n=e[0].dims,a=e[1],s=!i&&e[2],o=n,l=R.normalizeAxis(t.axis,n.length),d=R.sizeToDimension(n,l),p=R.sizeFromDimension(n,l),c=R.size(a.dims),f=s?R.size(s.dims):0;if(c!==p||s&&f!==p)throw new Error(`Size of X.shape()[axis:] == ${p}.
       Size of scale and bias (if provided) must match this.
       Got scale size of ${c} and bias size of ${f}`);let g=[];for(let I=0;I<n.length;++I)I<l?g.push(n[I]):g.push(1);let m=Ie(p),_=["type","type"],v=[{type:12,data:d},{type:1,data:p},{type:12,data:Math.floor(p/m)},{type:1,data:t.epsilon}];s&&_.push("type");let $=r>1,w=r>2,S=I=>{let C=Oe(e[0].dataType),z=[U("x",e[0].dataType,e[0].dims,m),U("scale",a.dataType,a.dims,m)];s&&z.push(U("bias",s.dataType,s.dims,m)),z.push(te("output",e[0].dataType,o,m)),$&&z.push(te("mean_data_output",1,g)),w&&z.push(te("inv_std_output",1,g));let k=[{name:"norm_count",type:"u32"},{name:"norm_size",type:"f32"},{name:"norm_size_vectorized",type:"u32"},{name:"epsilon",type:"f32"}];return`
  ${I.registerUniforms(k).declareVariables(...z)}
  ${I.mainStart()}
    ${I.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.norm_count")}
    let offset = global_idx * uniforms.norm_size_vectorized;
    var mean_vector = ${sa("f32",m)};
    var mean_square_vector = ${sa("f32",m)};

    for (var h: u32 = 0u; h < uniforms.norm_size_vectorized; h++) {
      let value = ${Jt(C,m,"x[h + offset]")};
      mean_vector += value;
      mean_square_vector += value * value;
    }
    let mean = ${kt("mean_vector",m)} / uniforms.norm_size;
    let inv_std_dev = inverseSqrt(${kt("mean_square_vector",m)} / uniforms.norm_size ${i?"":"- mean * mean"} + uniforms.epsilon);

    for (var j: u32 = 0; j < uniforms.norm_size_vectorized; j++) {
      let f32input = ${Jt(C,m,"x[j + offset]")};
      let f32scale = ${Jt(C,m,"scale[j]")};
      output[j + offset] = ${z[0].type.value}((f32input ${i?"":"- mean"}) * inv_std_dev * f32scale
        ${s?`+ ${Jt(C,m,"bias[j]")}`:""}
      );
    }

    ${$?"mean_data_output[global_idx] = mean":""};
    ${w?"inv_std_output[global_idx] = inv_std_dev":""};
  }`},x=[{dims:o,dataType:e[0].dataType}];return $&&x.push({dims:g,dataType:1}),w&&x.push({dims:g,dataType:1}),{name:"LayerNormalization",shaderCache:{hint:`${m};${r};${i}`,inputDependencies:_},getRunData:()=>({outputs:x,dispatchGroup:{x:Math.ceil(d/64)},programUniforms:v}),getShaderSource:S}},nm=(e,t)=>{Cd(e.inputs),e.compute(zd(e.inputs,t,e.outputCount))}}),Ad,am,nb=H(()=>{ae(),Wa(),Ga(),Ad=e=>{if(!e||e.length!==2)throw new Error("MatMul requires 2 inputs.");if(e[0].dims[e[0].dims.length-1]!==e[1].dims[e[1].dims.length-2])throw new Error("shared dimension does not match.")},am=e=>{Ad(e.inputs);let t=tr.calcShape(e.inputs[0].dims,e.inputs[1].dims,!0);if(!t)throw new Error("Can't use matmul on the given tensors");let r=t[t.length-1],i=e.inputs[0].dims[e.inputs[0].dims.length-1];if(r<8&&i<8)e.compute(qa(e.inputs,{activation:""},t));else{let n=t[t.length-2],a=R.size(e.inputs[0].dims.slice(0,-2)),s=R.size(e.inputs[1].dims.slice(0,-2));if(a!==1&&n===1&&s===1){let o=e.inputs[0].reshape([1,a,i]),l=e.inputs[1].reshape([1,i,r]),d=[1,a,r],p=[o,l];e.compute(ci(p,{activation:""},t,d),{inputs:p})}else e.compute(ci(e.inputs,{activation:""},t))}}}),Md,Od,Rd,sm,om,ab=H(()=>{ne(),ae(),Ce(),se(),Md=(e,t)=>{if(e.length<3||e.length>4)throw new Error("MatMulNBits requires 3 or 4 inputs");let r=e[0],i=r.dims.length;if(r.dims[i-1]!==t.k)throw new Error("The last dim of input shape does not match the k value");let n=Math.floor((t.k+t.blockSize-1)/t.blockSize),a=t.blockSize/8*t.bits,s=e[1];if(!R.areEqual(s.dims,[t.n,n,a]))throw new Error("The second inputs must be 3D tensor with shape N X nBlocksPerCol X blobSize");let o=e[2].dims;if(R.size(o)!==t.n*n)throw new Error("scales input size error.");if(e.length===4){let l=e[3].dims,d=t.n*(t.bits===8?n:Math.floor((n*t.bits+7)/8));if(R.size(l)!==d)throw new Error("zeroPoints input size error.")}},Od=(e,t)=>{let r=e[0].dims,i=r.length,n=r[i-2],a=t.k,s=t.n,o=r.slice(0,i-2),l=R.size(o),d=e[1].dims[2]/4,p=e[0].dataType,c=Ie(t.k),f=Ie(d),g=Ie(s),m=o.concat([n,s]),_=n>1&&s/g%2===0?2:1,v=R.size(m)/g/_,$=64,w=[],S=[l,n,a/c],x=R.convertShape(e[1].dims).slice();x.splice(-1,1,d/f),w.push(...ie(S)),w.push(...ie(x)),w.push(...ie(e[2].dims)),e.length===4&&w.push(...ie(R.convertShape(e[3].dims)));let I=[l,n,s/g];w.push(...ie(I));let C=z=>{let k=S.length,B=U("a",e[0].dataType,k,c),L=U("b",12,x.length,f),j=U("scales",e[2].dataType,e[2].dims.length),M=[B,L,j],W=e.length===4?U("zero_points",12,e[3].dims.length):void 0;W&&M.push(W);let O=I.length,N=te("output",e[0].dataType,O,g),G=Oe(e[0].dataType),Y=(()=>{switch(c){case 1:return`array<${G}, 8>`;case 2:return`mat4x2<${G}>`;case 4:return`mat2x4<${G}>`;default:throw new Error(`${c}-component is not supported.`)}})(),P=Math.floor(32/t.bits),V=Math.floor(P/8),Z=()=>{let Q="";for(let X=0;X<V;X++){let be=X*t.bits*4,ze=be+t.bits;Q+=`
          // reuse a data (pass ${X})
            var input_offset${X>0?X:""} = ${X===0?B.indicesToOffset(`${B.type.indices}(batch, row, word_offset)`):"input_offset"};
            var a_data${X>0?X:""}: ${Y};
            for (var j${X>0?X:""}: u32 = 0; j${X>0?X:""} < ${8/c}; j${X>0?X:""}++) {
              a_data${X>0?X:""}[j${X>0?X:""}] = ${B.getByOffset(`input_offset${X>0?X:""}`)};
              input_offset${X>0?X:""}++;
            }
          `;for(let F=0;F<g*_;F++)Q+=`
            b_value = ${f===1?`b${F}_data`:`b${F}_data[i]`};
            ${t.bits===2?`{
              let half_word = b_value >> ${X*16}u;
              let byte_lo = half_word & 0xFFu;
              let byte_hi = (half_word >> 8u) & 0xFFu;
              let spread_word = (byte_lo & 0xFu) | ((byte_lo >> 4u) << 8u) | ((byte_hi & 0xFu) << 16u) | ((byte_hi >> 4u) << 24u);
              b_value_lower = unpack4xU8(spread_word & b_mask);
              b_value_upper = unpack4xU8((spread_word >> 2u) & b_mask);
            }`:`b_value_lower = unpack4xU8((b_value >> ${be}u) & b_mask);
            b_value_upper = unpack4xU8((b_value >> ${ze}u) & b_mask);`}
            b_quantized_values = ${Y}(${Array.from({length:4},(pe,fe)=>`${G}(b_value_lower[${fe}]), ${G}(b_value_upper[${fe}])`).join(", ")});
            b_dequantized_values = ${c===1?`${Y}(${Array.from({length:8},(pe,fe)=>`(b_quantized_values[${fe}] - ${W?`zero_point${F}`:"zero_point"}) * scale${F}`).join(", ")});`:`(b_quantized_values - ${Y}(${Array(8).fill(`${W?`zero_point${F}`:"zero_point"}`).join(",")})) * scale${F};`};
            workgroup_shared[local_id.x * ${_} + ${Math.floor(F/g)}]${g>1?`[${F%g}]`:""} += ${Array.from({length:8/c},(pe,fe)=>`${c===1?`a_data${X>0?X:""}[${fe}] * b_dequantized_values[${fe}]`:`dot(a_data${X>0?X:""}[${fe}], b_dequantized_values[${fe}])`}`).join(" + ")};
          `}return Q},q=()=>{let Q=`
            var col_index = col * ${g};
            ${W?`
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
            `;for(let X=0;X<g*_;X++)Q+=`
            let scale${X} = ${j.getByOffset("col_index * nBlocksPerCol + block")};
            ${W?`
            zero_point_byte_count = col_index * zero_point_bytes_per_col + (block / zero_point_values_per_byte);
            zero_point_word_index = zero_point_byte_count >> 0x2u;
            zero_point_byte_offset = zero_point_byte_count & 0x3u;
            zero_point_bits_offset = (zero_point_byte_offset << 3) + (zero_point_sub_offset * ${t.bits}u);
            zero_point_word = ${W.getByOffset("zero_point_word_index")} >> zero_point_bits_offset;
            let zero_point${X} = ${G}((zero_point_word) & ${t.bits===2?"0x3u":"0xFu"});`:""}
            col_index += 1;`;return Q},ee=()=>{let Q=`col_index = col * ${g};`;for(let X=0;X<g*_;X++)Q+=`
            let b${X}_data = ${L.getByIndices(`${L.type.indices}(col_index, block, word)`)};
            col_index += 1;`;return Q+=`
            var b_value: u32;
            let b_mask: u32 = ${t.bits===2?"0x03030303u":"0x0F0F0F0Fu"};
            var b_value_lower: vec4<u32>;
            var b_value_upper: vec4<u32>;
            var b_quantized_values: ${Y};
            var b_dequantized_values: ${Y};`,Q};return`
        var<workgroup> workgroup_shared: array<${N.type.value}, ${_*$}>;
        ${z.declareVariables(...M,N)}
        ${z.mainStart([$,1,1])}
          let output_indices = ${N.offsetToIndices(`(global_idx / ${$}) * ${_}`)};
          let col = output_indices[2];
          let row = output_indices[1];
          let batch = output_indices[0];
          let nBlocksPerCol = uniforms.b_shape[1];

          for (var block = local_id.x; block < nBlocksPerCol; block += ${$}) {
            //process one block
            var word_offset: u32 = block * ${t.blockSize/c};
            ${q()}
            for (var word: u32 = 0; word < ${d}; word += ${f}) {
              ${ee()}
              for (var i: u32 = 0; i < ${f}; i++) {
                ${Z()}
                word_offset += ${P/c};
              }
            }
          }
          workgroupBarrier();

          if (local_id.x < ${_}) {
            var output_value: ${N.type.value} = ${N.type.value}(0);
            var workgroup_shared_offset: u32 = local_id.x;
            for (var b: u32 = 0u; b < ${$}u; b++) {
              output_value += workgroup_shared[workgroup_shared_offset];
              workgroup_shared_offset += ${_};
            }
            ${N.setByIndices(`${N.type.indices}(batch, row, col + local_id.x)`,"output_value")};
          }
        }`};return{name:"MatMulNBits",shaderCache:{hint:`${t.blockSize};${t.bits};${c};${f};${g};${_};${$}`,inputDependencies:Array(e.length).fill("rank")},getRunData:()=>({outputs:[{dims:m,dataType:p}],dispatchGroup:{x:v},programUniforms:w}),getShaderSource:C}},Rd=(e,t)=>{let r=e[0].dims,i=r.length,n=r[i-2],a=t.k,s=t.n,o=r.slice(0,i-2),l=R.size(o),d=e[1].dims[2]/4,p=e[0].dataType,c=Ie(t.k),f=Ie(d),g=o.concat([n,s]),m=128,_=s%8===0?8:s%4===0?4:1,v=m/_,$=Math.floor(32/t.bits),w=v*f*$,S=w/c,x=w/t.blockSize,I=R.size(g)/_,C=[],z=[l,n,a/c],k=R.convertShape(e[1].dims).slice();k.splice(-1,1,d/f),C.push(...ie(z)),C.push(...ie(k)),C.push(...ie(e[2].dims)),e.length===4&&C.push(...ie(R.convertShape(e[3].dims)));let B=[l,n,s];C.push(...ie(B));let L=j=>{let M=z.length,W=U("a",e[0].dataType,M,c),O=U("b",12,k.length,f),N=U("scales",e[2].dataType,e[2].dims.length),G=[W,O,N],Y=e.length===4?U("zero_points",12,e[3].dims.length):void 0;Y&&G.push(Y);let P=B.length,V=te("output",e[0].dataType,P),Z=Oe(e[0].dataType),q=()=>{switch(c){case 1:return`
          let a_data0 = vec4<${Z}>(sub_a[word_offset], sub_a[word_offset + 1], sub_a[word_offset + 2], sub_a[word_offset + 3]);
          let a_data1 = vec4<${Z}>(sub_a[word_offset + 4], sub_a[word_offset + 5], sub_a[word_offset + 6], sub_a[word_offset + 7]);`;case 2:return`
          let a_data0 = vec4<${Z}>(sub_a[word_offset], sub_a[word_offset + 1]);
          let a_data1 = vec4<${Z}>(sub_a[word_offset + 2], sub_a[word_offset + 3]);`;case 4:return`
          let a_data0 = sub_a[word_offset];
          let a_data1 = sub_a[word_offset + 1];`;default:throw new Error(`${c}-component is not supported.`)}};return`
        var<workgroup> sub_a: array<${W.type.value}, ${S}>;
        var<workgroup> inter_results: array<array<${V.type.value}, ${v}>, ${_}>;
        ${j.declareVariables(...G,V)}
        ${j.mainStart([v,_,1])}
          let output_indices = ${V.offsetToIndices(`workgroup_index * ${_}`)};
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
                sub_a[a_offset] = ${W.getByIndices(`${W.type.indices}(batch, row, a_col)`)};
              } else {
                sub_a[a_offset] = ${W.type.value}(0);
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
            let zero_point = ${Z}((zero_point_word) & ${t.bits===2?"0x3u":"0xFu"});`:`
            // The default zero point is ${Math.pow(2,t.bits-1)} for unsigned ${t.bits}-bit quantization.
            let zero_point = ${Z}(${Math.pow(2,t.bits-1).toFixed(1)});`}
            let scale = ${N.getByOffset("b_row * n_blocks_per_col + block")};
            let b_data = ${O.getByIndices(`${O.type.indices}(b_row, block, 0)`)};
            var word_offset = local_id.x * ${t.blockSize/c};
            for (var i: u32 = 0; i < ${f}; i++) {
              let b_value = ${f===1?"b_data":"b_data[i]"};
              ${(()=>{let ee=Math.floor($/8),Q="";for(let X=0;X<ee;X++){let be=X*t.bits*4,ze=be+t.bits;Q+=`
              ${q()}
              {${t.bits===2?`
                let half_word = b_value >> ${X*16}u;
                let byte_lo = half_word & 0xFFu;
                let byte_hi = (half_word >> 8u) & 0xFFu;
                let spread_word = (byte_lo & 0xFu) | ((byte_lo >> 4u) << 8u) | ((byte_hi & 0xFu) << 16u) | ((byte_hi >> 4u) << 24u);
                let b_value_lower = unpack4xU8(spread_word & 0x03030303u);
                let b_value_upper = unpack4xU8((spread_word >> 2u) & 0x03030303u);`:`
                let b_value_lower = unpack4xU8((b_value >> ${be}u) & 0x0F0F0F0Fu);
                let b_value_upper = unpack4xU8((b_value >> ${ze}u) & 0x0F0F0F0Fu);`}
                let b_quantized_values = mat2x4<${Z}>(${Array.from({length:4},(F,pe)=>`${Z}(b_value_lower[${pe}]), ${Z}(b_value_upper[${pe}])`).join(", ")});
                let b_dequantized_values = (b_quantized_values - mat2x4<${Z}>(${Array(8).fill("zero_point").join(",")})) * scale;
                inter_results[local_id.y][local_id.x] += ${Array.from({length:2},(F,pe)=>`${`dot(a_data${pe}, b_dequantized_values[${pe}])`}`).join(" + ")};
              }
              word_offset += ${8/c};`}return Q})()}
            }
            workgroupBarrier();
          }

          if (local_idx < ${_}) {
            var output_value: ${V.type.value} = ${V.type.value}(0);
            for (var b = 0u; b < ${v}; b++) {
              output_value += inter_results[local_idx][b];
            }
            if (col + local_idx < uniforms.output_shape[2])
            {
              ${V.setByIndices(`${V.type.indices}(batch, row, col + local_idx)`,"output_value")}
            }
          }
        }`};return{name:"BlockwiseMatMulNBits32",shaderCache:{hint:`${t.blockSize};${c};${f};${v};${_}`,inputDependencies:Array(e.length).fill("rank")},getRunData:()=>({outputs:[{dims:g,dataType:p}],dispatchGroup:{x:I},programUniforms:C}),getShaderSource:L}},sm=(e,t)=>{Md(e.inputs,t),t.blockSize===32&&e.adapterInfo.isVendor("intel")&&e.adapterInfo.isArchitecture("gen-12lp")?e.compute(Rd(e.inputs,t)):e.compute(Od(e.inputs,t))},om=e=>ye(e)}),Nd,Bd,Dd,Pd,Ud,Ld,qd,Wd,um,sb=H(()=>{ne(),ae(),se(),Nd=e=>{if(!e||e.length<1)throw new Error("Too few inputs");if(e[0].dataType!==1&&e[0].dataType!==10)throw new Error("Input type must be float or float16.");if(e.length>=2){let t=e[0].dims.length*2===e[1].dims[0];if(e.length===4&&(t=e[3].dims[0]*2===e[1].dims[0]),!t)throw new Error("The pads should be a 1D tensor of shape [2 * input_rank] or [2 * num_axes].")}},Bd=(e,t,r)=>{let i="";for(let n=t-1;n>=0;--n)i+=`
            k = i32(${e.indicesGet("indices",n)}) - ${re("uniforms.pads",n,r)};
            if (k < 0) {
              break;
            }
            if (k >= i32(${re("uniforms.x_shape",n,t)})) {
              break;
            }
            offset += k * i32(${re("uniforms.x_strides",n,t)});
        `;return`
          value = ${e.type.value}(uniforms.constant_value);
          for (var i = 0; i < 1; i++) {
            var offset = 0;
            var k = 0;
            ${i}
            value = x[offset];
          }
      `},Dd=(e,t,r)=>{let i="";for(let n=t-1;n>=0;--n)i+=`
                k = i32(${e.indicesGet("indices",n)}) - ${re("uniforms.pads",n,r)};
                if (k < 0) {
                  k = -k;
                }
                {
                  let _2n_1 = 2 * (i32(${re("uniforms.x_shape",n,t)}) - 1);
                  k = k % _2n_1;
                  if(k >= i32(${re("uniforms.x_shape",n,t)})) {
                    k = _2n_1 - k;
                  }
                }
                offset += k * i32(${re("uniforms.x_strides",n,t)});
            `;return`
              var offset = 0;
              var k = 0;
              ${i}
              value = x[offset];
          `},Pd=(e,t,r)=>{let i="";for(let n=t-1;n>=0;--n)i+=`
                k = i32(${e.indicesGet("indices",n)}) - ${re("uniforms.pads",n,r)};
                if (k < 0) {
                  k = 0;
                }
                if (k >= i32(${re("uniforms.x_shape",n,t)})) {
                  k = i32(${re("uniforms.x_shape",n,t)}) - 1;
                }
                offset += k * i32(${re("uniforms.x_strides",n,t)});
            `;return`
              var offset = 0;
              var k = 0;
              ${i}
              value = x[offset];
          `},Ud=(e,t,r)=>{let i="";for(let n=t-1;n>=0;--n)i+=`
                k = i32(${e.indicesGet("indices",n)}) - ${re("uniforms.pads",n,r)};
                if (k < 0)  {
                  k += i32(${re("uniforms.x_shape",n,t)}]);
                }
                if (k >= i32(${re("uniforms.x_shape",n,t)})) {
                  k -= i32(${re("uniforms.x_shape",n,t)});
                }
                offset += k * i32(${re("uniforms.x_strides",n,t)});
            `;return`
              var offset = 0;
              var k = 0;
              ${i}
              value = x[offset];
          `},Ld=(e,t,r)=>{switch(r.mode){case 0:return Bd(e,t,r.pads.length);case 1:return Dd(e,t,r.pads.length);case 2:return Pd(e,t,r.pads.length);case 3:return Ud(e,t,r.pads.length);default:throw new Error("Invalid mode")}},qd=(e,t)=>{let r=R.padShape(e[0].dims.slice(),t.pads),i=e[0].dims,n=R.size(r),a=[{type:12,data:n},{type:6,data:t.pads}],s=e.length>=3&&e[2].data;t.mode===0&&a.push({type:s?e[2].dataType:1,data:t.value}),a.push(...ie(e[0].dims,r));let o=["rank"],l=d=>{let p=te("output",e[0].dataType,r.length),c=U("x",e[0].dataType,i.length),f=c.type.value,g=Ld(p,i.length,t),m=[{name:"output_size",type:"u32"},{name:"pads",type:"i32",length:t.pads.length}];return t.mode===0&&m.push({name:"constant_value",type:s?f:"f32"}),`
            ${d.registerUniforms(m).declareVariables(c,p)}
            ${d.mainStart()}
            ${d.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}

            let indices = ${p.offsetToIndices("global_idx")};

            var value = ${f}(0);
            ${g}
            output[global_idx] = value;
        }`};return{name:"Pad",shaderCache:{hint:`${t.mode}${s}`,inputDependencies:o},getRunData:()=>({outputs:[{dims:r,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(R.size(r)/64)},programUniforms:a}),getShaderSource:l}},Wd=(e,t)=>{if(e.length>1){let r=e[1].getBigInt64Array(),i=e.length>=3&&e[2].data?e[2].dataType===10?e[2].getUint16Array()[0]:e[2].getFloat32Array()[0]:0,n=e[0].dims.length,a=new Int32Array(2*n).fill(0);if(e.length>=4){let o=e[3].getBigInt64Array();for(let l=0;l<o.length;l++)a[Number(o[l])]=Number(r[l]),a[Number(o[l])+n]=Number(r[l+o.length])}else r.forEach((o,l)=>a[Number(l)]=Number(o));let s=[];return a.forEach(o=>s.push(o)),{mode:t.mode,value:i,pads:s}}else return t},um=(e,t)=>{Nd(e.inputs);let r=Wd(e.inputs,t);e.compute(qd(e.inputs,r),{inputs:[0]})}}),fr,En,Cn,zn,An,Gd,Fd,Mn,On,lm,dm,Rn,pm,cm,Nn,hm,fm,mm,gm,ob=H(()=>{Ke(),ne(),ae(),se(),fr=e=>{if($e.webgpu.validateInputContent&&(!e||e.length!==1))throw new Error("Pool ops requires 1 input.")},En=(e,t,r)=>{let i=t.format==="NHWC",n=e.dims.slice();i&&n.splice(1,0,n.pop());let a=Object.hasOwnProperty.call(t,"dilations"),s=t.kernelShape.slice(),o=t.strides.slice(),l=a?t.dilations.slice():[],d=t.pads.slice();di.adjustPoolAttributes(r,n,s,o,l,d);let p=di.computePoolOutputShape(r,n,o,l,s,d,t.autoPad),c=Object.assign({},t);a?Object.assign(c,{kernelShape:s,strides:o,pads:d,dilations:l,cacheKey:t.cacheKey}):Object.assign(c,{kernelShape:s,strides:o,pads:d,cacheKey:t.cacheKey});let f=p.slice();return f.push(f.splice(1,1)[0]),[c,i?f:p]},Cn=(e,t)=>{let r=t.format==="NHWC",i=R.size(e),n=R.size(t.kernelShape),a=[{type:12,data:i},{type:12,data:n}],s=[{name:"outputSize",type:"u32"},{name:"kernelSize",type:"u32"}];if(t.kernelShape.length<=2){let o=t.kernelShape[t.kernelShape.length-1],l=t.strides[t.strides.length-1],d=t.pads[t.pads.length/2-1],p=t.pads[t.pads.length-1],c=!!(d+p);a.push({type:12,data:o},{type:12,data:l},{type:12,data:d},{type:12,data:p}),s.push({name:"kw",type:"u32"},{name:"sw",type:"u32"},{name:"pwStart",type:"u32"},{name:"pwEnd",type:"u32"});let f=!1;if(t.kernelShape.length===2){let g=t.kernelShape[t.kernelShape.length-2],m=t.strides[t.strides.length-2],_=t.pads[t.pads.length/2-2],v=t.pads[t.pads.length-2];f=!!(_+v),a.push({type:12,data:g},{type:12,data:m},{type:12,data:_},{type:12,data:v}),s.push({name:"kh",type:"u32"},{name:"sh",type:"u32"},{name:"phStart",type:"u32"},{name:"phEnd",type:"u32"})}return[a,s,!0,c,f]}else{if(r)throw new Error("Pooling with kernelShape.length > 2 is not supported for NHWC format.");let o=R.computeStrides(t.kernelShape);a.push({type:12,data:o},{type:12,data:t.pads},{type:12,data:t.strides}),s.push({name:"kernelStrides",type:"u32",length:o.length},{name:"pads",type:"u32",length:t.pads.length},{name:"strides",type:"u32",length:t.strides.length});let l=t.pads.reduce((d,p)=>d+p);return[a,s,!!l,!1,!1]}},zn=(e,t,r,i,n,a,s,o,l,d,p,c)=>{let f=n.format==="NHWC",g=t.type.value,m=te("output",t.type.tensor,i);if(n.kernelShape.length<=2){let _="",v="",$="",w=r-(f?2:1);if(p?_=`
                for (var i: u32 = 0u; i < uniforms.kw; i++) {
                  xIndices[${w}] = indices[${w}] * uniforms.sw - uniforms.pwStart + i;
                  if (xIndices[${w}] < 0 || xIndices[${w}]
                      >= uniforms.x_shape[${w}]) {
                    pad++;
                    continue;
                  }
                  let x_val = x[${t.indicesToOffset("xIndices")}];
                  ${a}
                }`:_=`
                for (var i: u32 = 0u; i < uniforms.kw; i++) {
                  xIndices[${w}] = indices[${w}] * uniforms.sw - uniforms.pwStart + i;
                  let x_val = x[${t.indicesToOffset("xIndices")}];
                  ${a}
                }`,n.kernelShape.length===2){let S=r-(f?3:2);c?v=`
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
              ${_}
              ${$}
              ${s}

              output[global_idx] = value;
            }`}else{if(f)throw new Error("Pooling with kernelShape.length > 2 is not supported for NHWC format.");let _=n.kernelShape.length,v=n.pads.length,$="";return d?$=`
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

              var offsets: array<u32, ${_}>;

              var value = ${g}(${o});
              var pad = 0;
              var isPad = false;

              for (var i: u32 = 0u; i < uniforms.kernelSize; i++) {
                var offset = i;
                for (var j = 0u; j < ${_-1}u; j++) {
                  offsets[j] = offset / ${re("uniforms.kernelStrides","j",_)};
                  offset -= offsets[j] * ${re("uniforms.kernelStrides","j",_)};
                }
                offsets[${_-1}] = offset;

                isPad = false;
                for (var j = ${r-_}u; j < ${r}u; j++) {
                  xIndices[j] = indices[j] * ${re("uniforms.strides",`j - ${r-_}u`,_)}
                    + offsets[j - ${r-_}u] - ${re("uniforms.pads","j - 2u",v)};
                  ${$}
              }
              ${s}

              output[global_idx] = value;
            }`}},An=e=>`${e.format};${e.ceilMode};${e.autoPad};${e.kernelShape.length}`,Gd=e=>`${An(e)};${e.countIncludePad}`,Fd=e=>`${An(e)};${e.storageOrder};${e.dilations}`,Mn=e=>({format:e.format,autoPad:["NOTSET","VALID","SAME_UPPER","SAME_LOWER"][e.auto_pad],ceilMode:e.ceil_mode,kernelShape:e.kernel_shape,strides:e.strides,pads:e.pads}),On=(e,t,r,i)=>{let[n,a]=En(t,i,r),s=U("x",t.dataType,t.dims.length),o=s.type.value,l="value += x_val;",d="";n.countIncludePad?d+=`value /= ${o}(uniforms.kernelSize);`:d+=`value /= ${o}(i32(uniforms.kernelSize) - pad);`;let[p,c,f,g,m]=Cn(a,n);p.push(...ie(t.dims,a));let _=["rank"];return{name:e,shaderCache:{hint:`${i.cacheKey};${f};${g};${m}`,inputDependencies:_},getRunData:()=>({outputs:[{dims:a,dataType:t.dataType}],dispatchGroup:{x:Math.ceil(R.size(a)/64)},programUniforms:p}),getShaderSource:v=>zn(v,s,t.dims.length,a.length,n,l,d,0,c,f,g,m)}},lm=e=>{let t=e.count_include_pad!==0,r=Mn(e);if(r.ceilMode!==0)throw new Error("using ceil() in shape computation is not yet supported for AveragePool");let i={countIncludePad:t,...r,cacheKey:""};return{...i,cacheKey:Gd(i)}},dm=(e,t)=>{fr(e.inputs),e.compute(On("AveragePool",e.inputs[0],!1,t))},Rn={autoPad:"",ceilMode:0,countIncludePad:!1,kernelShape:[],strides:[],pads:[],storageOrder:0,dilations:[]},pm=e=>{let t=e.format;return{format:t,...Rn,cacheKey:t}},cm=(e,t)=>{fr(e.inputs),e.compute(On("GlobalAveragePool",e.inputs[0],!0,t))},Nn=(e,t,r,i)=>{let[n,a]=En(t,i,r),s=`
      value = max(x_val, value);
    `,o="",l=U("x",t.dataType,t.dims.length),d=["rank"],[p,c,f,g,m]=Cn(a,n);return p.push(...ie(t.dims,a)),{name:e,shaderCache:{hint:`${i.cacheKey};${f};${g};${m}`,inputDependencies:d},getRunData:()=>({outputs:[{dims:a,dataType:t.dataType}],dispatchGroup:{x:Math.ceil(R.size(a)/64)},programUniforms:p}),getShaderSource:_=>zn(_,l,t.dims.length,a.length,n,s,o,t.dataType===10?-65504:-1e5,c,f,g,m)}},hm=(e,t)=>{fr(e.inputs),e.compute(Nn("MaxPool",e.inputs[0],!1,t))},fm=e=>{let t=e.storage_order,r=e.dilations,i=Mn(e);if(t!==0)throw new Error("column major storage order is not yet supported for MaxPool");if(i.ceilMode!==0)throw new Error("using ceil() in shape computation is not yet supported for MaxPool");let n={storageOrder:t,dilations:r,...i,cacheKey:""};return{...n,cacheKey:Fd(n)}},mm=e=>{let t=e.format;return{format:t,...Rn,cacheKey:t}},gm=(e,t)=>{fr(e.inputs),e.compute(Nn("GlobalMaxPool",e.inputs[0],!0,t))}}),Vd,Hd,ym,_m,ub=H(()=>{ne(),ae(),Ce(),se(),Vd=(e,t)=>{if(e.length<2||e.length>3)throw new Error("DequantizeLinear requires 2 or 3 inputs.");if(e.length===3&&e[1].dims===e[2].dims)throw new Error("x-scale and x-zero-point must have the same shape.");if(e.length===3&&e[0].dataType!==e[2].dataType)throw new Error("x and x-zero-point must have the same data type.");if(e[1].dims.length!==0&&e[1].dims.length!==1&&e[1].dims.length!==e[0].dims.length)throw new Error("scale input must be a scalar, a 1D tensor, or have the same rank as the input tensor.");if(e.length>2){if(e[0].dataType!==e[2].dataType)throw new Error("x and x-zero-point must have the same data type.");if(e[1].dims.length!==e[2].dims.length)throw new Error("scale and zero-point inputs must have the same rank.");if(!e[1].dims.map((r,i)=>r===e[2].dims[i]).reduce((r,i)=>r&&i,!0))throw new Error("scale and zero-point inputs must have the same shape.")}if(t.blockSize>0){if(e[1].dims.length===0||e[1].dims.length===1&&e[1].dims[0]===1)throw new Error("blockSize must be set only for block quantization.");if(!e[1].dims.map((n,a)=>a===t.axis||n===e[0].dims[a]).reduce((n,a)=>n&&a,!0))throw new Error("For block qunatization, scale input shape to match the input shape except for the axis");if(e[1].dims.length!==e[0].dims.length)throw new Error("For block qunatization the scale input rank must be the same as the x rank.");let r=e[0].dims[t.axis],i=e[1].dims[t.axis];if(t.blockSize<Math.ceil(r/i)||t.blockSize>Math.ceil(r/(i-1)-1))throw new Error("blockSize must be with in the range [ceil(dI / Si), ceil(dI / (Si - 1) - 1)].")}},Hd=(e,t)=>{let r=R.normalizeAxis(t.axis,e[0].dims.length),i=e[0].dataType,n=i===3,a=e[0].dims,s=e[1].dataType,o=R.size(a),l=i===3||i===2,d=l?[Math.ceil(R.size(e[0].dims)/4)]:e[0].dims,p=e[1].dims,c=e.length>2?e[2]:void 0,f=c?l?[Math.ceil(R.size(c.dims)/4)]:c.dims:void 0,g=p.length===0||p.length===1&&p[0]===1,m=g===!1&&p.length===1,_=Ie(o),v=g&&(!l||_===4),$=v?_:1,w=v&&!l?_:1,S=U("input",l?12:i,d.length,w),x=U("scale",s,p.length),I=c?U("zero_point",l?12:i,f.length):void 0,C=te("output",s,a.length,$),z=[S,x];I&&z.push(I);let k=[d,p];c&&k.push(f);let B=[{type:12,data:o/$},{type:12,data:r},{type:12,data:t.blockSize},...ie(...k,a)],L=j=>{let M=[{name:"output_size",type:"u32"},{name:"axis",type:"u32"},{name:"block_size",type:"u32"}];return`
      ${j.registerUniforms(M).declareVariables(...z,C)}
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
      }`};return{name:"DequantizeLinear",shaderCache:{hint:t.cacheKey,inputDependencies:I?["rank","rank","rank"]:["rank","rank"]},getShaderSource:L,getRunData:()=>({outputs:[{dims:a,dataType:s}],dispatchGroup:{x:Math.ceil(o/$/64),y:1,z:1},programUniforms:B})}},ym=(e,t)=>{Vd(e.inputs,t),e.compute(Hd(e.inputs,t))},_m=e=>ye({axis:e.axis,blockSize:e.blockSize})}),jd,Kd,bm,lb=H(()=>{Ke(),ne(),se(),jd=(e,t,r)=>{let i=e===t,n=e<t&&r<0,a=e>t&&r>0;if(i||n||a)throw new Error("Range these inputs' contents are invalid.")},Kd=(e,t,r,i)=>{let n=Math.abs(Math.ceil((t-e)/r)),a=[n],s=n,o=[{type:12,data:s},{type:i,data:e},{type:i,data:r},...ie(a)],l=d=>{let p=te("output",i,a.length),c=p.type.value,f=[{name:"outputSize",type:"u32"},{name:"start",type:c},{name:"delta",type:c}];return`
        ${d.registerUniforms(f).declareVariables(p)}
        ${d.mainStart()}
        ${d.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}
        output[global_idx] = uniforms.start + ${c}(global_idx) * uniforms.delta;
      }`};return{name:"Range",shaderCache:{hint:`${i}`},getShaderSource:l,getRunData:()=>({outputs:[{dims:a,dataType:i}],dispatchGroup:{x:Math.ceil(s/64)},programUniforms:o})}},bm=e=>{let t=0,r=0,i=0;e.inputs[0].dataType===6?(t=e.inputs[0].getInt32Array()[0],r=e.inputs[1].getInt32Array()[0],i=e.inputs[2].getInt32Array()[0]):e.inputs[0].dataType===1&&(t=e.inputs[0].getFloat32Array()[0],r=e.inputs[1].getFloat32Array()[0],i=e.inputs[2].getFloat32Array()[0]),$e.webgpu.validateInputContent&&jd(t,r,i),e.compute(Kd(t,r,i,e.inputs[0].dataType),{inputs:[]})}}),Xd,Zd,wm,$m,db=H(()=>{ne(),ae(),Ce(),se(),Xd=(e,t,r,i)=>{if(e!=="none"&&i!=="i32"&&i!=="u32"&&i!=="f32")throw new Error(`Input ${i} is not supported with reduction ${e}.`);let n=`{
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
                ${n}max(bitcast<f32>(oldValue), (${r}))${a}`;case"min":return i==="i32"||i==="u32"?`atomicMin(&${t}, bitcast<${i}>(${r}));`:`${n}min(bitcast<${i}>(oldValue), (${r}))${a}`;case"mul":return`${n}(bitcast<${i}>(oldValue) * (${r}))${a}`;default:throw new Error(`Reduction ${e} is not supported.`)}},Zd=(e,t)=>{let r=e[0].dims,i=e[1].dims,n=r,a=1,s=Math.ceil(R.sizeToDimension(i,i.length-1)/a),o=i[i.length-1],l=R.sizeFromDimension(r,o),d=[{type:12,data:s},{type:12,data:o},{type:12,data:l},...ie(e[1].dims,e[2].dims,n)],p=c=>{let f=U("indices",e[1].dataType,e[1].dims.length),g=U("updates",e[2].dataType,e[2].dims.length,a),m=t.reduction!=="none"&&t.reduction!==""?Kc("output",e[0].dataType,n.length):te("output",e[0].dataType,n.length,a);return`
      ${c.registerUniform("output_size","u32").registerUniform("last_index_dimension","u32").registerUniform("num_updates_elements","u32").declareVariables(f,g,m)}
      ${c.mainStart()}
        ${c.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
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
    ${Xd(t.reduction,"output[data_offset + i]","value",m.type.value)}
  }

      }`};return{name:"ScatterND",shaderCache:{hint:`${t.cacheKey}_${t.reduction}`,inputDependencies:["rank","rank"]},getRunData:()=>({outputs:[{dims:n,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(s/64)},programUniforms:d}),getShaderSource:p}},wm=e=>ye({reduction:e.reduction}),$m=(e,t)=>{e.compute(Zd(e.inputs,t),{inputs:[e.inputs[1],e.inputs[2]],outputs:[]})}}),Yd,Qd,Jd,Bn,ep,tp,rp,ip,np,ap,sp,op,Dn,up,lp,dp,pp,cp,vm,xm,pb=H(()=>{ne(),ae(),Ce(),se(),Yd=(e,t)=>{if(e.every(r=>r>0||(()=>{throw new Error("Resize requires scales input values to be positive")})),e.length>0){if(t.mode==="linear"){if(!(e.length===2||e.length===3||e.length===4&&e[0]===1&&e[1]===1||e.length===4&&e[0]===1&&e[3]===1||e.length===5&&e[0]===1&&e[1]===1))throw new Error(`For linear mode, Resize requires scales to be 2D, 3D, 4D with either two outermost or one innermost and
            one outermost scale values equal to 1, or 5D with two outermost scale values equal to 1`)}else if(t.mode==="cubic"&&!(e.length===2||e.length===4&&e[0]===1&&e[1]===1||e.length===4&&e[0]===1&&e[3]===1))throw new Error("Resize requires scales input size to be 2 or 4 for cubic mode")}},Qd=(e,t,r)=>{t.every(n=>n>=0&&n<r||(()=>{throw new Error("Resize requires axes input values to be positive and less than rank")}));let i=new Array(r).fill(1);return t.forEach((n,a)=>i[n]=e[a]),i},Jd=(e,t,r,i,n,a)=>{let[s,o,l]=r>10?[1,2,3]:[-1,e.length>1?1:-1,-1],d=e[0].dims.length;if(s>0&&e.length>s&&e[s].dims.length>0)e[s].getFloat32Array().forEach(p=>a.push(p));else if(t.coordinateTransformMode==="tf_crop_and_resize")throw new Error("Resize requires RoI input to be specified when coordinateTransformMode is tfCropAndResize");if(o>0&&e.length>o&&e[o].dims.length===1&&e[o].dims[0]>0){if(e[o].getFloat32Array().forEach(p=>i.push(p)),i.length!==0&&i.length!==d&&r>=18&&i.length!==t.axes.length)throw new Error("Resize requires scales input size to be same as input rank or axes size for opset 18 and up");Yd(i,t),t.axes.length>0&&Qd(i,t.axes,d).forEach((p,c)=>i[c]=p)}if(l>0&&e.length>l&&e[l].dims.length===1&&e[l].dims[0]>0&&(e[l].getBigInt64Array().forEach(p=>n.push(Number(p))),n.length!==0&&n.length!==d&&r>=18&&n.length!==t.axes.length))throw new Error("Resize requires sizes input size to be same as input rank or axes size for opset 18 and up");if(t.axes.length>0){if(i.length!==0&&i.length!==t.axes.length)throw new Error('Resize requires "scales" input size to be of axes rank when axes attributes is specified');if(n.length!==0&&n.length!==t.axes.length)throw new Error('Resize requires "sizes" input size to be of rank axes rank when axes attributes is specified')}if(typeof i<"u"&&typeof n<"u"&&i.length>0&&n.length>d)throw new Error("Resize requires only of scales or sizes to be specified")},Bn=(e,t,r,i)=>`
  // The whole part and the fractional part are calculated separately due to inaccuracy of floating
  // point division. As an example, f32(21) / f32(7) may evaluate to 2.99... instead of 3, causing an
  // offset-by-one error later in floor().
  let big = (${e}) * (${t});
  let whole = ${i}(big / (${r}));
  let fract = ${i}(big % (${r})) / ${i}(${r});
  return whole + fract;
`,ep=(e,t)=>`fn getOriginalCoordinateFromResizedCoordinate(xResized: u32, xScale: f32, lengthResized: u32,
     lengthOriginal: u32, roiStart: f32, roiEnd: f32) -> ${t} { `+(()=>{switch(e){case"asymmetric":return`
          if (xScale < 1.0 || floor(xScale) != xScale) {
            return ${t}(xResized) / ${t}(xScale);
          } else {
            ${Bn("xResized","lengthOriginal","lengthResized",t)}
          }
        `;case"pytorch_half_pixel":return`if (lengthResized > 1) {
                    return (${t}(xResized) + 0.5) / ${t}(xScale) - 0.5;
                  } else {
                    return 0.0;
                  }`;case"tf_half_pixel_for_nn":return`return (${t}(xResized) + 0.5) / ${t}(xScale);`;case"align_corners":return`if (lengthResized == 1) {
                    return 0.0;
                  } else {
                    ${Bn("xResized","lengthOriginal - 1","lengthResized - 1",t)}
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
                  return offset + ((${t}(xResized) + 0.5) / ${t}(xScale)) - 0.5;`;case"half_pixel":return`return ((${t}(xResized) + 0.5) / ${t}(xScale)) - 0.5;`;default:throw new Error(`Coordinate transform mode ${e} is not supported`)}})()+"}",tp=(e,t,r)=>`fn getNearestPixelFromOriginal(xOriginal: ${r}, isDownSample: bool) -> ${r} {`+(()=>{switch(e){case"round_prefer_ceil":return"if (fract(xOriginal) == 0.5) {             return ceil(xOriginal);           } else {             return round(xOriginal);           }";case"floor":return"return floor(xOriginal);";case"ceil":return"return ceil(xOriginal);";case"round_prefer_floor":return"if (fract(xOriginal) == 0.5) {                     return floor(xOriginal);                   } else {                     return round(xOriginal);                   }";default:if(t<11)return"if (isDownSample)                     {                       return ceil(xOriginal);                     } else {                       return xOriginal;                     }";throw new Error(`Nearest mode ${e} is not supported`)}})()+"}",rp=(e,t,r)=>{let i=new Array(r).fill(0).concat(new Array(r).fill(1)),n=e.length===0?i:e.slice();return t.length>0?(t.forEach((a,s)=>{i[a]=n[s],i[s+r]=n[t.length+s]}),i):n},ip=(e,t,r,i)=>{let n=[];if(r.length>0)if(i.length>0){if(e.forEach(a=>n.push(a)),Math.max(...i)>e.length)throw new Error("axes is out of bound");i.forEach((a,s)=>n[a]=r[s])}else r.forEach(a=>n.push(a));else{if(t.length===0)throw new Error("Resize requires either scales or sizes.");n=e.map((a,s)=>Math.round(a*t[s]))}return n},np=(e,t,r)=>{let i=(()=>{switch(r.keepAspectRatioPolicy){case"not_larger":return r.axes.length>0?Math.min(...r.axes.map(a=>t[a]),Number.MAX_VALUE):Math.min(...t,Number.MAX_VALUE);case"not_smaller":return r.axes.length>0?Math.max(...r.axes.map(a=>t[a]),Number.MIN_VALUE):Math.max(...t,Number.MIN_VALUE);default:throw new Error(`Keep aspect ratio policy ${r.keepAspectRatioPolicy} is not supported`)}})();t.fill(1,0,t.length);let n=e.slice();return r.axes.length>0?(r.axes.forEach(a=>t[a]=i),r.axes.forEach(a=>n[a]=Math.round(e[a]*t[a]))):(t.fill(i,0,t.length),n.forEach((a,s)=>n[s]=Math.round(a*t[s]))),n},ap=(e,t,r,i,n)=>`
    fn calculateOriginalIndicesFromOutputIndices(output_indices: ${e.type.indices}) -> array<${e.type.value}, ${r.length}> {
      var original_indices: array<${e.type.value}, ${r.length}>;
      for (var i:u32 = 0; i < ${r.length}; i++) {
        var output_index = ${e.indicesGet("output_indices","i")};
        var scale = ${re("uniforms.scales","i",i)};
        var roi_low = ${re("uniforms.roi","i",n)};
        var roi_hi = ${re("uniforms.roi",`i + ${t.length}`,n)};
        if (scale == 1.0) {
          original_indices[i] = ${e.type.value}(output_index);
        } else {
          var input_shape_i = ${re("uniforms.input_shape","i",t.length)};
          var output_shape_i = ${re("uniforms.output_shape","i",r.length)};
          original_indices[i] = getOriginalCoordinateFromResizedCoordinate(output_index, scale, output_shape_i,
                                                                           input_shape_i, roi_low, roi_hi);
        }
      }
      return original_indices;
    }`,sp=(e,t,r,i,n,a,s)=>`
    fn calculateInputIndicesFromOutputIndices(output_indices: ${t.type.indices}) -> ${e.type.indices} {
      var input_indices: ${e.type.indices};
      for (var i:u32 = 0; i < ${i.length}; i++) {
        var output_index = ${t.indicesGet("output_indices","i")};
        var input_index: u32;
        var scale = ${re("uniforms.scales","i",n)};
        if (scale == 1.0) {
          input_index = output_index;
        } else {
          var roi_low = ${re("uniforms.roi","i",a)};
          var roi_hi = ${re("uniforms.roi",`i + ${r.length}`,a)};
          var input_shape_i = ${re("uniforms.input_shape","i",r.length)};
          var output_shape_i = ${re("uniforms.output_shape","i",i.length)};
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
    }`,op=(e,t)=>`
    fn checkInputIndices(input_indices: ${e.type.indices}) -> bool {
      for (var i:u32 = 0; i < ${t.length}; i++) {
        var input_index = ${e.indicesGet("input_indices","i")};
        if (input_index < 0 || input_index >= ${re("uniforms.input_shape","i",t.length)}) {
          return false;
        }
      }
      return true;
    }`,Dn=(e,t,r,i)=>e.rank>i?`
    ${e.indicesSet("input_indices",t,"channel")};
    ${e.indicesSet("input_indices",r,"batch")};
`:"",up=(e,t,r,i,n)=>{let[a,s,o,l]=r.length===2?[-1,0,1,-1]:[0,2,3,1],d=e.type.value;return`
    fn getInputValue(batch: u32, channel: u32, row: u32, col: u32) -> ${d} {
      var input_indices: ${e.type.indices};
      ${e.indicesSet("input_indices",s,`max(0, min(row, ${r[s]} - 1))`)};
      ${e.indicesSet("input_indices",o,`max(0, min(col, ${r[o]} - 1))`)};
      ${Dn(e,l,a,2)}
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
    }`},lp=(e,t,r,i,n,a,s,o,l,d)=>{let p=r.length===2,[c,f]=p?[0,1]:[2,3],g=e.type.value,m=_=>{let v=_===c?"row":"col";return`
      fn ${v}CubicInterpolation(input_indices: ${e.type.indices}, output_indices: ${t.type.indices}) -> ${g} {
        var output_index = ${t.indicesGet("output_indices",_)};
        var originalIdx: ${g} = getOriginalCoordinateFromResizedCoordinate(output_index, ${n[_]},
        ${i[_]}, ${r[_]}, ${a[_]}, ${a[_]} + ${r.length});
        var fractOriginalIdx: ${g} = originalIdx - floor(originalIdx);
        var coefs = getCubicInterpolationCoefs(fractOriginalIdx);

        if (${o} && (originalIdx < 0 || originalIdx > (${r[_]} - 1))) {
          return ${l};
        }
        var data: array<${g}, 4> = array<${g}, 4>(0.0, 0.0, 0.0, 0.0);
        for (var i: i32 = -1; i < 3; i++) {
          var ${v}: ${g} = originalIdx + ${g}(i);
          if (${v} < 0 || ${v} >= ${r[_]}) {
            ${d?`coefs[i + 1] = 0.0;
                        continue;`:o?`return ${l};`:`${v} = max(0, min(${v}, ${r[_]} - 1));`};
          }
        var input_indices_copy: ${e.type.indices} = input_indices;
          ${e.indicesSet("input_indices_copy",_,`u32(${v})`)};
          data[i + 1] = ${_===c?e.getByIndices("input_indices_copy"):"rowCubicInterpolation(input_indices_copy, output_indices)"};
        }
        return cubicInterpolation1D(data, coefs);
      }`};return`
    ${m(c)};
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
    `},dp=(e,t,r,i,n)=>{let[a,s,o,l,d]=r.length===3?[-1,0,1,2,-1]:[0,2,3,4,1],p=e.type.value;return`
    fn getInputValue(batch: u32, channel: u32, depth:u32, height: u32, width: u32) -> ${p} {
      var input_indices: ${e.type.indices};
      ${e.indicesSet("input_indices",s,`max(0, min(depth, ${r[s]} - 1))`)};
      ${e.indicesSet("input_indices",o,`max(0, min(height, ${r[o]} - 1))`)};
      ${e.indicesSet("input_indices",l,`max(0, min(width, ${r[l]} - 1))`)};
      ${Dn(e,d,a,3)}
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
    }`},pp=(e,t,r,i,n,a)=>{let s=e.dims,o=rp(a,t.axes,s.length),l=ip(s,i,n,t.axes),d=i.slice();i.length===0&&(d=s.map((w,S)=>w===0?1:l[S]/w),t.keepAspectRatioPolicy!=="stretch"&&(l=np(s,d,t)));let p=te("output",e.dataType,l.length),c=U("input",e.dataType,s.length),f=R.size(l),g=s.length===l.length&&s.every((w,S)=>w===l[S]),m=t.coordinateTransformMode==="tf_crop_and_resize",_=t.extrapolationValue,v=c.type.value,$=w=>`
      ${g?"":`
      ${ep(t.coordinateTransformMode,v)};
      ${(()=>{switch(t.mode){case"nearest":return`
              ${op(c,s)};
              ${tp(t.nearestMode,r,v)};
              ${sp(c,p,s,l,d.length,o.length,m)};
              `;case"linear":return`
              ${ap(p,s,l,d.length,o.length)};
              ${(()=>{if(s.length===2||s.length===4)return`${up(c,p,s,m,_)}`;if(s.length===3||s.length===5)return`${dp(c,p,s,m,_)}`;throw Error("Linear mode only supports input dims 2, 3, 4 and 5 are supported in linear mode.")})()};
            `;case"cubic":return`
            ${(()=>{if(s.length===2||s.length===4)return`${lp(c,p,s,l,d,o,t.cubicCoeffA,m,t.extrapolationValue,t.excludeOutside)}`;throw Error("Cubic mode only supports input dims 2 and 4 are supported in linear mode.")})()};
            `;default:throw Error("Invalid resize mode")}})()};
      `}
      ${w.registerUniform("output_size","u32").registerUniform("scales","f32",d.length).registerUniform("roi","f32",o.length).declareVariables(c,p)}
      ${w.mainStart()}
        ${w.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
        ${g?"output[global_idx] = input[global_idx];":`
        let output_indices = ${p.offsetToIndices("global_idx")};
        var input_indices: ${c.type.indices};
        ${(()=>{switch(t.mode){case"nearest":return`input_indices = calculateInputIndicesFromOutputIndices(output_indices);
                if (checkInputIndices(input_indices)) {
                  output[global_idx] = ${c.getByIndices("input_indices")};
                } else {
                  output[global_idx] = ${t.extrapolationValue};
                }`;case"linear":return`output[global_idx] = ${s.length===2||s.length===4?"bilinearInterpolation":"trilinearInterpolation"}(output_indices);`;case"cubic":return"output[global_idx] = bicubicInterpolation(output_indices);";default:throw Error(`Unsupported resize mode: ${t.mode}`)}})()};
`}
      }`;return{name:"Resize",shaderCache:{hint:`${t.cacheKey}|${r}|${d.length>0?t.mode==="cubic"?d:d.length:""}|${n.length>0?n:""}|${o.length>0?o:""}|${g}|${t.mode==="nearest"?s.length:s}`,inputDependencies:["rank"]},getShaderSource:$,getRunData:()=>({outputs:[{dims:l,dataType:e.dataType}],dispatchGroup:{x:Math.ceil(f/64)},programUniforms:[{type:12,data:f},{type:1,data:d},{type:1,data:o},...ie(s,l)]})}},cp=e=>{let t=e.customDataBuffer;return new Uint32Array(t.buffer,t.byteOffset,1)[0]},vm=(e,t)=>{let r=[],i=[],n=[],a=cp(e);if(t.antialias!==0)throw Error("Only default value (0) for Antialias attribute is supported");Jd(e.inputs,t,a,r,i,n),e.compute(pp(e.inputs[0],t,a,r,i,n),{inputs:[0]})},xm=e=>{let t=e.antialias,r=e.axes,i=e.coordinateTransformMode,n=e.cubicCoeffA,a=e.excludeOutside!==0,s=e.extrapolationValue,o=e.keepAspectRatioPolicy,l=e.mode,d=e.nearestMode===""?"simple":e.nearestMode;return ye({antialias:t,axes:r,coordinateTransformMode:i,cubicCoeffA:n,excludeOutside:a,extrapolationValue:s,keepAspectRatioPolicy:o,mode:l,nearestMode:d})}}),hp,fp,Sm,cb=H(()=>{ne(),ae(),se(),hp=e=>{if(!e||e.length<3)throw new Error("layerNorm requires at least 3 inputs.");let t=e[0],r=e[1],i=e[2];if(t.dataType!==r.dataType||t.dataType!==i.dataType)throw new Error("All inputs must have the same data type");if(t.dims.length!==3&&t.dims.length!==2)throw new Error("Input must be 2D or 3D");if(r.dims.length!==3&&r.dims.length!==2)throw new Error("Skip must be 2D or 3D");let n=t.dims[t.dims.length-1],a=t.dims[t.dims.length-2];if(r.dims[r.dims.length-1]!==n)throw new Error("Skip must have the same hidden size as input");if(r.dims[r.dims.length-2]!==a)throw new Error("Skip must have the same sequence length as input");if(i.dims.length!==1)throw new Error("Gamma must be 1D");if(i.dims[i.dims.length-1]!==n)throw new Error("Gamma must have the same hidden size as input");if(e.length>3){let s=e[3];if(s.dims.length!==1)throw new Error("Beta must be 1D");if(s.dims[s.dims.length-1]!==n)throw new Error("Beta must have the same hidden size as input")}if(e.length>4){let s=e[4];if(s.dims.length!==1)throw new Error("Bias must be 1D");if(s.dims[s.dims.length-1]!==n)throw new Error("Bias must have the same hidden size as input")}},fp=(e,t,r,i)=>{let n=t.simplified,a=e[0].dims,s=R.size(a),o=a,l=s,d=a.slice(-1)[0],p=i?a.slice(0,-1).concat(1):[],c=!n&&e.length>3,f=e.length>4,g=i&&r>1,m=i&&r>2,_=r>3,v=64,$=Ie(d),w=[{type:12,data:l},{type:12,data:$},{type:12,data:d},{type:1,data:t.epsilon}],S=I=>{let C=[{name:"output_size",type:"u32"},{name:"components",type:"u32"},{name:"hidden_size",type:"u32"},{name:"epsilon",type:"f32"}],z=[U("x",e[0].dataType,e[0].dims,$),U("skip",e[1].dataType,e[1].dims,$),U("gamma",e[2].dataType,e[2].dims,$)];c&&z.push(U("beta",e[3].dataType,e[3].dims,$)),f&&z.push(U("bias",e[4].dataType,e[4].dims,$)),z.push(te("output",e[0].dataType,o,$)),g&&z.push(te("mean_output",1,p)),m&&z.push(te("inv_std_output",1,p)),_&&z.push(te("input_skip_bias_sum",e[0].dataType,o,$));let k=Oe(e[0].dataType),B=Oe(1,$);return`

      ${I.registerUniforms(C).declareVariables(...z)}
      var<workgroup> sum_shared : array<${B}, ${v}>;
      var<workgroup> sum_squared_shared : array<${B}, ${v}>;

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
          ${_?"input_skip_bias_sum[offset + i] = value;":""}
          output[offset + i] = value;
          let f32_value = ${Jt(k,$,"value")};
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
            ${c?"+ beta[offset1d + i]":""};
        }
      }`},x=[{dims:o,dataType:e[0].dataType}];return r>1&&x.push({dims:p,dataType:1}),r>2&&x.push({dims:p,dataType:1}),r>3&&x.push({dims:a,dataType:e[0].dataType}),{name:"SkipLayerNormalization",shaderCache:{hint:`${$};${g};${m};${_}`,inputDependencies:e.map((I,C)=>"type")},getShaderSource:S,getRunData:()=>({outputs:x,dispatchGroup:{x:Math.ceil(l/d)},programUniforms:w})}},Sm=(e,t)=>{hp(e.inputs);let r=[0];e.outputCount>1&&r.push(-3),e.outputCount>2&&r.push(-3),e.outputCount>3&&r.push(3),e.compute(fp(e.inputs,t,e.outputCount,!1),{outputs:r})}}),mp,mr,gp,Pn,yp,_p,km,Tm,hb=H(()=>{ne(),ae(),Ce(),se(),mp=(e,t)=>{if(!e||e.length<1)throw new Error("too few inputs");if(t.axes.length!==0){if(t.axes.length!==t.starts.length||t.axes.length!==t.ends.length)throw new Error("axes, starts and ends must have the same length")}else if(t.starts.length!==t.ends.length)throw new Error("starts and ends must have the same length");e.slice(1).forEach((r,i)=>{if(e[i+1].dataType!==6&&e[i+1].dataType!==7)throw new Error(`Input ${i} must be an array of int32 or int64`)})},mr=(e,t)=>{let r=[];if(e.length>t)if(e[t].dataType===7)e[t].getBigInt64Array().forEach(i=>r.push(Number(i)));else if(e[t].dataType===6)e[t].getInt32Array().forEach(i=>r.push(Number(i)));else throw new Error(`Input ${t} must be an array of int32 or int64`);return r},gp=(e,t)=>{if(e.length>1){let r=mr(e,1),i=mr(e,2),n=mr(e,3);return n.length===0&&(n=[...Array(e[0].dims.length).keys()]),ye({starts:r,ends:i,axes:n})}else return t},Pn=(e,t,r,i,n)=>{let a=e;return e<0&&(a+=r[i[t]]),n[t]<0?Math.max(0,Math.min(a,r[i[t]]-1)):Math.max(0,Math.min(a,r[i[t]]))},yp=(e,t,r)=>`fn calculateInputIndices(output_indices: ${t.type.indices}) -> ${e.type.indices} {
          var input_indices: ${e.type.indices};
          var carry = 0u;
          for (var i = ${r.length-1}; i >= 0; i--) {
            let input_shape_i = ${re("uniforms.input_shape","i",r.length)};
            let steps_i = ${re("uniforms.steps","i",r.length)};
            let signs_i = ${re("uniforms.signs","i",r.length)};
            let starts_i = ${re("uniforms.starts","i",r.length)};
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
      }`,_p=(e,t)=>{let r=e[0].dims,i=R.size(r),n=t.axes.length>0?R.normalizeAxes(t.axes,r.length):[...Array(r.length).keys()],a=mr(e,4);a.forEach($=>$!==0||(()=>{throw new Error("step cannot be 0")})),a.length===0&&(a=Array(n.length).fill(1));let s=t.starts.map(($,w)=>Pn($,w,r,n,a)),o=t.ends.map(($,w)=>Pn($,w,r,n,a));if(n.length!==s.length||n.length!==o.length)throw new Error("start, ends and axes should have the same number of elements");if(n.length!==r.length)for(let $=0;$<r.length;++$)n.includes($)||(s.splice($,0,0),o.splice($,0,r[$]),a.splice($,0,1));let l=a.map($=>Math.sign($));a.forEach(($,w,S)=>{if($<0){let x=(o[w]-s[w])/$,I=s[w],C=I+x*a[w];s[w]=C,o[w]=I,S[w]=-$}});let d=r.slice(0);n.forEach(($,w)=>{d[$]=Math.ceil((o[$]-s[$])/a[$])});let p={dims:d,dataType:e[0].dataType},c=te("output",e[0].dataType,d.length),f=U("input",e[0].dataType,e[0].dims.length),g=R.size(d),m=[{name:"outputSize",type:"u32"},{name:"starts",type:"u32",length:s.length},{name:"signs",type:"i32",length:l.length},{name:"steps",type:"u32",length:a.length}],_=[{type:12,data:g},{type:12,data:s},{type:6,data:l},{type:12,data:a},...ie(e[0].dims,d)],v=$=>`
      ${$.registerUniforms(m).declareVariables(f,c)}
        ${yp(f,c,r)}
        ${$.mainStart()}
          ${$.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}
          let output_indices = ${c.offsetToIndices("global_idx")};
          let input_indices = calculateInputIndices(output_indices);
          ${c.setByOffset("global_idx",f.getByIndices("input_indices"))}
      }`;return{name:"Slice",shaderCache:{hint:`${l.length}_${s.length}_${a.length}`,inputDependencies:["rank"]},getShaderSource:v,getRunData:()=>({outputs:[p],dispatchGroup:{x:Math.ceil(i/64)},programUniforms:_})}},km=(e,t)=>{mp(e.inputs,t);let r=gp(e.inputs,t);e.compute(_p(e.inputs,r),{inputs:[0]})},Tm=e=>{let t=e.starts,r=e.ends,i=e.axes;return ye({starts:t,ends:r,axes:i})}}),bp,wp,Im,Em,fb=H(()=>{ne(),ae(),Ce(),Tt(),se(),bp=e=>{if(!e||e.length!==1)throw new Error("Softmax op requires 1 input.")},wp=(e,t)=>{let r=e.inputs[0],i=r.dims,n=R.size(i),a=i.length,s=R.normalizeAxis(t.axis,a),o=s<i.length-1,l,d=[];o?(d=Array.from({length:a},(z,k)=>k),d[s]=a-1,d[a-1]=s,l=e.compute(Fe(r,d),{inputs:[r],outputs:[-1]})[0]):l=r;let p=l.dims,c=p[a-1],f=n/c,g=Ie(c),m=c/g,_=64;f===1&&(_=256);let v=(z,k)=>k===4?`max(max(${z}.x, ${z}.y), max(${z}.z, ${z}.w))`:k===2?`max(${z}.x, ${z}.y)`:k===3?`max(max(${z}.x, ${z}.y), ${z}.z)`:z,$=U("x",l.dataType,l.dims,g),w=te("result",l.dataType,l.dims,g),S=$.type.value,x=Oe(l.dataType)==="f32"?`var threadMax = ${S}(-3.4028234663852886e+38f);`:`var threadMax = ${S}(-65504.0h);`,I=z=>`
      var<workgroup> rowMaxShared : ${S};
      var<workgroup> rowSumShared : ${S};
      var<workgroup> threadShared : array<${S}, ${_}>;

      fn getValue(row: i32, col: i32, row_stride: i32) -> ${S} {
        let index = row * row_stride + col;
        return x[index];
      }

      fn setValue(row: i32, col: i32, row_stride: i32, value: ${S}) {
        let index = row * row_stride + col;
        result[index] = value;
      }
      ${z.registerUniform("packedCols","i32").declareVariables($,w)}
      ${z.mainStart(_)}
        let gindex = i32(global_idx);
        let lindex = i32(local_idx);
        const wg = ${_};
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
      }`,C=e.compute({name:"Softmax",shaderCache:{hint:`${g};${_}`,inputDependencies:["type"]},getRunData:()=>({outputs:[{dims:p,dataType:l.dataType}],dispatchGroup:{x:f},programUniforms:[{type:6,data:m}]}),getShaderSource:I},{inputs:[l],outputs:[o?-1:0]})[0];o&&e.compute(Fe(C,d),{inputs:[C]})},Im=(e,t)=>{bp(e.inputs),wp(e,t)},Em=e=>ye({axis:e.axis})}),Un,$p,vp,xp,Cm,mb=H(()=>{ne(),ae(),se(),Un=e=>Array.from(e.getBigInt64Array(),Number),$p=e=>{if(!e||e.length!==2)throw new Error("Tile requires 2 inputs.");if(e[0].dataType!==1&&e[0].dataType!==10&&e[0].dataType!==6&&e[0].dataType!==12)throw new Error("Tile only support float, float16, int32, and uint32 data types");if(e[1].dataType!==7)throw new Error("Tile `repeats` input should be of int64 data type");if(e[1].dims.length!==1)throw new Error("Tile `repeats` input should be 1-D");if(Un(e[1]).length!==e[0].dims.length)throw new Error("Tile `repeats` input should have same number of elements as rank of input data tensor")},vp=(e,t)=>{let r=[];for(let i=0;i<e.length;++i)r.push(e[i]*t[i]);return r},xp=(e,t)=>{let r=e[0].dims,i=t??Un(e[1]),n=vp(r,i),a=R.size(n),s=e[0].dataType,o=U("input",s,r.length),l=te("output",s,n.length),d=p=>`
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
    }`;return{name:"Tile",shaderCache:{hint:`${i}`,inputDependencies:["rank"]},getRunData:()=>({outputs:[{dims:n,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(a/64)},programUniforms:[{type:12,data:a},...ie(e[0].dims,n)]}),getShaderSource:d}},Cm=e=>{$p(e.inputs),e.compute(xp(e.inputs),{inputs:[0]})}}),Sp,kp,zm,gb=H(()=>{ne(),ae(),se(),Sp=(e,t,r,i,n)=>{let a=te("output_data",n,r.length,4),s=U("a_data",t[1].dataType,t[1].dims.length,4),o=U("b_data",t[2].dataType,t[2].dims.length,4),l=U("c_data",t[0].dataType,t[0].dims.length,4),d,p=(c,f,g)=>`select(${f}, ${c}, ${g})`;if(!i)d=a.setByOffset("global_idx",p(s.getByOffset("global_idx"),o.getByOffset("global_idx"),l.getByOffset("global_idx")));else{let c=(f,g,m="")=>{let _=`a_data[index_a${g}][component_a${g}]`,v=`b_data[index_b${g}][component_b${g}]`,$=`bool(c_data[index_c${g}] & (0xffu << (component_c${g} * 8)))`;return`
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
            ${f}[${g}] = ${m}(${p(_,v,$)});
          `};n===9?d=`
            var data = vec4<u32>(0);
            ${c("data",0,"u32")}
            ${c("data",1,"u32")}
            ${c("data",2,"u32")}
            ${c("data",3,"u32")}
            output_data[global_idx] = dot(vec4<u32>(0x1, 0x100, 0x10000, 0x1000000), vec4<u32>(data));`:d=`
            ${c("output_data[global_idx]",0)}
            ${c("output_data[global_idx]",1)}
            ${c("output_data[global_idx]",2)}
            ${c("output_data[global_idx]",3)}
          `}return`
        ${e.registerUniform("vec_size","u32").declareVariables(l,s,o,a)}
        ${e.mainStart()}
        ${e.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.vec_size")}
        ${d}
      }`},kp=e=>{let t=e[1].dims,r=e[2].dims,i=e[0].dims,n=e[1].dataType,a=!(R.areEqual(t,r)&&R.areEqual(r,i)),s=t,o=R.size(t);if(a){let d=tr.calcShape(tr.calcShape(t,r,!1),i,!1);if(!d)throw new Error("Can't perform where op on the given tensors");s=d,o=R.size(s)}let l=Math.ceil(o/4);return{name:"Where",shaderCache:{inputDependencies:["rank","rank","rank"]},getShaderSource:d=>Sp(d,e,s,a,n),getRunData:()=>({outputs:[{dims:s,dataType:n}],dispatchGroup:{x:Math.ceil(o/64/4)},programUniforms:[{type:12,data:l},...ie(i,t,r,s)]})}},zm=e=>{e.compute(kp(e.inputs))}}),Am,yb=H(()=>{A_(),Da(),M_(),O_(),R_(),N_(),B_(),q_(),G_(),F_(),V_(),H_(),j_(),K_(),X_(),Z_(),Y_(),Q_(),J_(),eb(),tb(),rb(),ib(),nb(),ab(),Zf(),sb(),ob(),ub(),lb(),db(),Ba(),pb(),tm(),cb(),hb(),fb(),Jf(),mb(),Tt(),Pa(),gb(),Am=new Map([["Abs",[xh]],["Acos",[Sh]],["Acosh",[kh]],["Add",[sf]],["ArgMax",[bh,ua]],["ArgMin",[_h,ua]],["Asin",[Th]],["Asinh",[Ih]],["Atan",[Eh]],["Atanh",[Ch]],["Attention",[wh]],["AveragePool",[dm,lm]],["BatchNormalization",[$h]],["BiasAdd",[vh]],["BiasSplitGelu",[af]],["Cast",[Ah,zh]],["Ceil",[Oh]],["Clip",[Mh]],["Concat",[gf,yf]],["Conv",[fa,ha]],["ConvTranspose",[If,Tf]],["Cos",[Rh]],["Cosh",[Nh]],["CumSum",[Ef,Cf]],["DepthToSpace",[zf,Af]],["DequantizeLinear",[ym,_m]],["Div",[of]],["Einsum",[Mf,Of]],["Elu",[Bh,$r]],["Equal",[uf]],["Erf",[Dh]],["Exp",[Ph]],["Expand",[Rf]],["FastGelu",[Nf]],["Floor",[Uh]],["FusedConv",[fa,ha]],["Gather",[Df,Bf]],["GatherElements",[Gf,Wf]],["GatherBlockQuantized",[Lf,qf]],["GatherND",[Pf,Uf]],["Gelu",[Lh]],["Gemm",[Vf,Ff]],["GlobalAveragePool",[cm,pm]],["GlobalMaxPool",[gm,mm]],["Greater",[cf]],["GreaterOrEqual",[ff]],["GridSample",[Hf,jf]],["GroupQueryAttention",[rm]],["HardSigmoid",[Kh,jh]],["InstanceNormalization",[im]],["LayerNormalization",[nm]],["LeakyRelu",[qh,$r]],["Less",[hf]],["LessOrEqual",[mf]],["Log",[rf]],["MatMul",[am]],["MatMulNBits",[sm,om]],["MaxPool",[hm,fm]],["Mul",[lf]],["MultiHeadAttention",[Xf,Kf]],["Neg",[Gh]],["Not",[Wh]],["Pad",[um]],["Pow",[df]],["QuickGelu",[nf,$r]],["Range",[bm]],["Reciprocal",[Fh]],["ReduceMin",[hh]],["ReduceMean",[uh]],["ReduceMax",[ch]],["ReduceSum",[mh]],["ReduceProd",[fh]],["ReduceL1",[lh]],["ReduceL2",[dh]],["ReduceLogSum",[yh]],["ReduceLogSumExp",[ph]],["ReduceSumSquare",[gh]],["Relu",[Vh]],["Resize",[vm,xm]],["RotaryEmbedding",[em]],["ScatterND",[$m,wm]],["Sigmoid",[Hh]],["Sin",[Xh]],["Sinh",[Zh]],["Slice",[km,Tm]],["SkipLayerNormalization",[Sm]],["Split",[Yf,Qf]],["Sqrt",[Yh]],["Softmax",[Im,Em]],["Sub",[pf]],["Tan",[Qh]],["Tanh",[Jh]],["ThresholdedRelu",[tf,$r]],["Tile",[Cm]],["Transpose",[Zc,Yc]],["Where",[zm]]])}),Mm,_b=H(()=>{Ke(),gt(),se(),Mm=class{constructor(e){this.backend=e,this.repo=new Map,this.attributesBound=!1}getArtifact(e){return this.repo.get(e)}setArtifact(e,t){this.repo.set(e,t)}run(e,t,r,i,n){pt(e.programInfo.name);let a=this.backend.device,s=this.backend.getComputePassEncoder();this.backend.writeTimestamp(this.backend.pendingDispatchNumber*2);let o=[];for(let d of t)o.push({binding:o.length,resource:{buffer:d.buffer}});for(let d of r)o.push({binding:o.length,resource:{buffer:d.buffer}});n&&o.push({binding:o.length,resource:n});let l=a.createBindGroup({layout:e.computePipeline.getBindGroupLayout(0),entries:o,label:e.programInfo.name});if(this.backend.sessionStatus==="capturing"){let d={kernelId:this.backend.currentKernelId,computePipeline:e.computePipeline,bindGroup:l,dispatchGroup:i};this.backend.capturedCommandList.get(this.backend.currentSessionId).push(d)}s.setPipeline(e.computePipeline),s.setBindGroup(0,l),s.dispatchWorkgroups(...i),this.backend.writeTimestamp(this.backend.pendingDispatchNumber*2+1),this.backend.pendingDispatchNumber++,(this.backend.pendingDispatchNumber>=this.backend.maxDispatchNumber||this.backend.queryType==="at-passes")&&this.backend.endComputePass(),this.backend.pendingDispatchNumber>=this.backend.maxDispatchNumber&&this.backend.flush(),nt(e.programInfo.name)}dispose(){}build(e,t){pt(e.name);let r=this.backend.device,i=[];[{feature:"shader-f16",extension:"f16"},{feature:"subgroups",extension:"subgroups"}].forEach(d=>{r.features.has(d.feature)&&i.push(`enable ${d.extension};`)});let n=Xc(t,this.backend.device.limits),a=e.getShaderSource(n),s=`${i.join(`
`)}
${n.additionalImplementations}
${a}`,o=r.createShaderModule({code:s,label:e.name});he("verbose",()=>`[WebGPU] ${e.name} shader code: ${s}`);let l=r.createComputePipeline({compute:{module:o,entryPoint:"main"},layout:"auto",label:e.name});return nt(e.name),{programInfo:e,computePipeline:l,uniformVariablesInfo:n.variablesInfo}}normalizeDispatchGroupSize(e){let t=typeof e=="number"?e:e.x,r=typeof e=="number"?1:e.y||1,i=typeof e=="number"?1:e.z||1,n=this.backend.device.limits.maxComputeWorkgroupsPerDimension;if(t<=n&&r<=n&&i<=n)return[t,r,i];let a=t*r*i,s=Math.ceil(Math.sqrt(a));if(s>n){if(s=Math.ceil(Math.cbrt(a)),s>n)throw new Error("Total dispatch size exceeds WebGPU maximum.");return[s,s,s]}else return[s,s,1]}}}),Om={};ir(Om,{WebGpuBackend:()=>Rm});var Tp,Ip,Ep,Rm,bb=H(()=>{Ke(),ne(),gt(),Fc(),C_(),yb(),_b(),Tp=(e,t)=>{if(t.length!==e.length)throw new Error(`inputDependencies length ${t.length} is not equal to inputTensors length ${e.length}.`);let r=[];for(let i=0;i<e.length;++i){let n=e[i].dataType;switch(t[i]){case"none":{r.push("");break}case"type":{r.push(`${n}`);break}case"rank":{let a=e[i].dims.length;r.push(`${n};${a}`);break}case"dims":{let a=e[i].dims.join(",");r.push(`${n};${a}`);break}default:throw new Error(`unsupported input dependency: ${t[i]}`)}}return r.join("|")},Ip=(e,t,r)=>{let i=e.name;return e.shaderCache?.hint&&(i+="["+e.shaderCache.hint+"]"),i+=":"+r+`:${Tp(t,e.shaderCache?.inputDependencies??new Array(t.length).fill("dims"))}`,i},Ep=class{constructor(e){e&&(this.architecture=e.architecture,this.vendor=e.vendor)}isArchitecture(e){return this.architecture===e}isVendor(e){return this.vendor===e}},Rm=class{constructor(){this.currentSessionId=null,this.currentKernelId=null,this.commandEncoder=null,this.computePassEncoder=null,this.maxDispatchNumber=16,this.pendingDispatchNumber=0,this.pendingKernels=[],this.pendingQueries=new Map,this.sessionStatus="default",this.capturedCommandList=new Map,this.capturedPendingKernels=new Map,this.sessionExternalDataMapping=new Map}get currentKernelCustomData(){if(this.currentKernelId===null)throw new Error("currentKernelCustomData(): currentKernelId is null. (should not happen)");let e=this.kernelCustomData.get(this.currentKernelId);return e||(e={},this.kernelCustomData.set(this.currentKernelId,e)),e}async initialize(e,t){this.env=e;let r=[],i={requiredLimits:{maxComputeWorkgroupStorageSize:t.limits.maxComputeWorkgroupStorageSize,maxComputeWorkgroupsPerDimension:t.limits.maxComputeWorkgroupsPerDimension,maxStorageBufferBindingSize:t.limits.maxStorageBufferBindingSize,maxBufferSize:t.limits.maxBufferSize,maxComputeInvocationsPerWorkgroup:t.limits.maxComputeInvocationsPerWorkgroup,maxComputeWorkgroupSizeX:t.limits.maxComputeWorkgroupSizeX,maxComputeWorkgroupSizeY:t.limits.maxComputeWorkgroupSizeY,maxComputeWorkgroupSizeZ:t.limits.maxComputeWorkgroupSizeZ},requiredFeatures:r},n=o=>t.features.has(o)&&r.push(o)&&!0;n("chromium-experimental-timestamp-query-inside-passes")||n("timestamp-query"),n("shader-f16"),n("subgroups"),this.device=await t.requestDevice(i);let a=t,s=t.info??(typeof a.requestAdapterInfo=="function"?await a.requestAdapterInfo():void 0);this.adapterInfo=new Ep(s),this.gpuDataManager=jc(this),this.programManager=new Mm(this),this.kernels=new Map,this.kernelPersistentData=new Map,this.kernelCustomData=new Map,Ma(e.logLevel,!!e.debug),this.device.onuncapturederror=o=>{o.error instanceof GPUValidationError&&console.error(`An uncaught WebGPU validation error was raised: ${o.error.message}`)},Object.defineProperty(this.env.webgpu,"device",{value:this.device,writable:!1,enumerable:!0,configurable:!0}),Object.defineProperty(this.env.webgpu,"adapter",{value:t,writable:!1,enumerable:!0,configurable:!1}),this.setQueryType()}dispose(){typeof this.querySet<"u"&&this.querySet.destroy(),this.gpuDataManager.dispose(),this.device&&this.env?.webgpu&&this.device.lost.then(()=>{delete this.env.webgpu.device})}getCommandEncoder(){return this.commandEncoder||(this.commandEncoder=this.device.createCommandEncoder()),this.commandEncoder}getComputePassEncoder(){if(!this.computePassEncoder){let e=this.getCommandEncoder(),t={};this.queryType==="at-passes"&&(t.timestampWrites={querySet:this.querySet,beginningOfPassWriteIndex:this.pendingDispatchNumber*2,endOfPassWriteIndex:this.pendingDispatchNumber*2+1}),this.computePassEncoder=e.beginComputePass(t)}return this.computePassEncoder}endComputePass(){this.computePassEncoder&&(this.computePassEncoder.end(),this.computePassEncoder=null)}flush(){if(!this.commandEncoder)return;pt(),this.endComputePass();let e;this.queryType!=="none"&&(this.commandEncoder.resolveQuerySet(this.querySet,0,this.pendingDispatchNumber*2,this.queryResolveBuffer,0),e=this.device.createBuffer({size:this.pendingDispatchNumber*2*8,usage:GPUBufferUsage.MAP_READ|GPUBufferUsage.COPY_DST}),this.pendingQueries.set(e,this.pendingKernels),this.pendingKernels=[],this.commandEncoder.copyBufferToBuffer(this.queryResolveBuffer,0,e,0,this.pendingDispatchNumber*2*8)),this.device.queue.submit([this.commandEncoder.finish()]),this.gpuDataManager.refreshPendingBuffers(),this.commandEncoder=null,this.pendingDispatchNumber=0,this.queryType!=="none"&&e.mapAsync(GPUMapMode.READ).then(()=>{let t=new BigUint64Array(e.getMappedRange()),r=this.pendingQueries.get(e);for(let i=0;i<t.length/2;i++){let n=r[i],a=n.kernelId,s=this.kernels.get(a),o=s.kernelType,l=s.kernelName,d=n.programName,p=n.inputTensorViews,c=n.outputTensorViews,f=t[i*2],g=t[i*2+1];typeof this.queryTimeBase>"u"&&(this.queryTimeBase=f);let m=Number(f-this.queryTimeBase),_=Number(g-this.queryTimeBase);if(!Number.isSafeInteger(m)||!Number.isSafeInteger(_))throw new RangeError("incorrect timestamp range");if(this.env.webgpu.profiling?.ondata)this.env.webgpu.profiling.ondata({version:1,inputsMetadata:p.map(v=>({dims:v.dims,dataType:mt(v.dataType)})),outputsMetadata:c.map(v=>({dims:v.dims,dataType:mt(v.dataType)})),kernelId:a,kernelType:o,kernelName:l,programName:d,startTime:m,endTime:_});else{let v="";p.forEach((w,S)=>{v+=`input[${S}]: [${w.dims}] | ${mt(w.dataType)}, `});let $="";c.forEach((w,S)=>{$+=`output[${S}]: [${w.dims}] | ${mt(w.dataType)}, `}),console.log(`[profiling] kernel "${a}|${o}|${l}|${d}" ${v}${$}start time: ${m} ns, execution time: ${_-m} ns`)}oi("GPU",`${d}::${f}::${g}`)}e.unmap(),this.pendingQueries.delete(e)}),nt()}run(e,t,r,i,n,a){pt(e.name);let s=[];for(let w=0;w<t.length;++w){let S=t[w].data;if(S===0)continue;let x=this.gpuDataManager.get(S);if(!x)throw new Error(`no GPU data for input: ${S}`);s.push(x)}let{outputs:o,dispatchGroup:l,programUniforms:d}=e.getRunData(t),p=r.length===0?o.map((w,S)=>S):r;if(p.length!==o.length)throw new Error(`Output size ${p.length} must be equal to ${o.length}.`);let c=[],f=[];for(let w=0;w<o.length;++w){if(!Number.isInteger(p[w])||p[w]<-3||p[w]>=a)throw new Error(`Invalid output index: ${p[w]}`);if(p[w]===-3)continue;let S=p[w]===-1,x=p[w]===-2,I=S||x?n(o[w].dataType,o[w].dims):i(p[w],o[w].dataType,o[w].dims);if(c.push(I),I.data===0)continue;let C=this.gpuDataManager.get(I.data);if(!C)throw new Error(`no GPU data for output: ${I.data}`);if(S&&this.temporaryData.push(C),x){let z=this.kernelPersistentData.get(this.currentKernelId);z||(z=[],this.kernelPersistentData.set(this.currentKernelId,z)),z.push(C)}f.push(C)}if(s.length!==t.length||f.length!==c.length){if(f.length===0)return nt(e.name),c;throw new Error(`Program ${e.name} has zero-sized tensor(s) in inputs or outputs. This is not supported now.`)}let g;if(d){let w=0,S=[];d.forEach(z=>{let k=typeof z.data=="number"?[z.data]:z.data;if(k.length===0)return;let B=z.type===10?2:4,L,j;z.type===10?(j=k.length>4?16:k.length>2?8:k.length*B,L=k.length>4?16:B*k.length):(j=k.length<=2?k.length*B:16,L=16),w=Math.ceil(w/j)*j,S.push(w);let M=z.type===10?8:4;w+=k.length>4?Math.ceil(k.length/M)*L:k.length*B});let x=16;w=Math.ceil(w/x)*x;let I=new ArrayBuffer(w);d.forEach((z,k)=>{let B=S[k],L=typeof z.data=="number"?[z.data]:z.data;if(z.type===6)new Int32Array(I,B,L.length).set(L);else if(z.type===12)new Uint32Array(I,B,L.length).set(L);else if(z.type===10)new Uint16Array(I,B,L.length).set(L);else if(z.type===1)new Float32Array(I,B,L.length).set(L);else throw new Error(`Unsupported uniform type: ${mt(z.type)}`)});let C=this.gpuDataManager.create(w,GPUBufferUsage.COPY_DST|GPUBufferUsage.UNIFORM);this.device.queue.writeBuffer(C.buffer,0,I,0,w),this.gpuDataManager.release(C.id),g={offset:0,size:w,buffer:C.buffer}}let m=this.programManager.normalizeDispatchGroupSize(l),_=m[1]===1&&m[2]===1,v=Ip(e,t,_),$=this.programManager.getArtifact(v);if($||($=this.programManager.build(e,m),this.programManager.setArtifact(v,$),he("info",()=>`[artifact] key: ${v}, programName: ${e.name}`)),d&&$.uniformVariablesInfo){if(d.length!==$.uniformVariablesInfo.length)throw new Error(`Uniform variables count mismatch: expect ${$.uniformVariablesInfo.length}, got ${d.length} in program "${$.programInfo.name}".`);for(let w=0;w<d.length;w++){let S=d[w],x=S.type,I=typeof S.data=="number"?1:S.data.length,[C,z]=$.uniformVariablesInfo[w];if(x!==C||I!==z)throw new Error(`Uniform variable ${w} mismatch: expect type ${C} with size ${z}, got type ${x} with size ${I} in program "${$.programInfo.name}".`)}}if(he("info",()=>`[ProgramManager] run "${e.name}" (key=${v}) with ${m[0]}x${m[1]}x${m[2]}`),this.queryType!=="none"||this.sessionStatus==="capturing"){let w={kernelId:this.currentKernelId,programName:$.programInfo.name,inputTensorViews:t,outputTensorViews:c};this.pendingKernels.push(w),this.sessionStatus==="capturing"&&this.capturedPendingKernels.get(this.currentSessionId).push(w)}return this.programManager.run($,s,f,m,g),nt(e.name),c}upload(e,t){this.gpuDataManager.upload(e,t)}memcpy(e,t){this.gpuDataManager.memcpy(e,t)}async download(e,t){await this.gpuDataManager.download(e,t)}alloc(e){return this.gpuDataManager.create(e).id}free(e){return this.gpuDataManager.release(e)}createKernel(e,t,r,i){let n=Am.get(e);if(!n)throw new Error(`kernel not implemented: ${e}`);let a={kernelType:e,kernelName:i,kernelEntry:n[0],attributes:[n[1],r]};this.kernels.set(t,a)}releaseKernel(e){let t=this.kernelPersistentData.get(e);if(t){for(let r of t)this.gpuDataManager.release(r.id);this.kernelPersistentData.delete(e)}this.kernelCustomData.delete(e),this.kernels.delete(e)}computeKernel(e,t,r){let i=this.kernels.get(e);if(!i)throw new Error(`kernel not created: ${e}`);let n=i.kernelType,a=i.kernelName,s=i.kernelEntry,o=i.attributes;if(this.currentKernelId!==null)throw new Error(`kernel "[${n}] ${a}" is not allowed to be called recursively`);this.currentKernelId=e,o[0]&&(o[1]=o[0](o[1]),o[0]=void 0),he("info",()=>`[WebGPU] Start to run kernel "[${n}] ${a}"...`);let l=this.env.debug;this.temporaryData=[];try{return l&&this.device.pushErrorScope("validation"),s(t,o[1]),0}catch(d){return r.push(Promise.resolve(`[WebGPU] Kernel "[${n}] ${a}" failed. ${d}`)),1}finally{l&&r.push(this.device.popErrorScope().then(d=>d?`GPU validation error for kernel "[${n}] ${a}": ${d.message}`:null));for(let d of this.temporaryData)this.gpuDataManager.release(d.id);this.temporaryData=[],this.currentKernelId=null}}registerBuffer(e,t,r,i){let n=this.sessionExternalDataMapping.get(e);n||(n=new Map,this.sessionExternalDataMapping.set(e,n));let a=n.get(t),s=this.gpuDataManager.registerExternalBuffer(r,i,a);return n.set(t,[s,r]),s}unregisterBuffers(e){let t=this.sessionExternalDataMapping.get(e);t&&(t.forEach(r=>this.gpuDataManager.unregisterExternalBuffer(r[0])),this.sessionExternalDataMapping.delete(e))}getBuffer(e){let t=this.gpuDataManager.get(e);if(!t)throw new Error(`no GPU data for buffer: ${e}`);return t.buffer}createDownloader(e,t,r){return async()=>{let i=await aa(this,e,t);return Oa(i.buffer,r)}}writeTimestamp(e){this.queryType==="inside-passes"&&this.computePassEncoder.writeTimestamp(this.querySet,e)}setQueryType(){this.queryType="none",(this.env.webgpu.profiling?.mode==="default"||(typeof this.env.trace>"u"?this.env.wasm.trace:this.env.trace))&&(this.device.features.has("chromium-experimental-timestamp-query-inside-passes")?this.queryType="inside-passes":this.device.features.has("timestamp-query")&&(this.queryType="at-passes"),this.queryType!=="none"&&typeof this.querySet>"u"&&(this.querySet=this.device.createQuerySet({type:"timestamp",count:this.maxDispatchNumber*2}),this.queryResolveBuffer=this.device.createBuffer({size:this.maxDispatchNumber*2*8,usage:GPUBufferUsage.COPY_SRC|GPUBufferUsage.QUERY_RESOLVE})))}captureBegin(){he("info","captureBegin"),this.capturedCommandList.get(this.currentSessionId)||this.capturedCommandList.set(this.currentSessionId,[]),this.capturedPendingKernels.get(this.currentSessionId)||this.capturedPendingKernels.set(this.currentSessionId,[]),this.flush(),this.sessionStatus="capturing"}captureEnd(){he("info","captureEnd"),this.flush(),this.sessionStatus="default"}replay(){he("info","replay"),this.sessionStatus="replaying";let e=this.capturedCommandList.get(this.currentSessionId),t=this.capturedPendingKernels.get(this.currentSessionId),r=e.length;this.pendingKernels=[];for(let i=0;i<r;i++){let n=this.getComputePassEncoder(),a=e[i];this.writeTimestamp(this.pendingDispatchNumber*2),n.setPipeline(a.computePipeline),n.setBindGroup(0,a.bindGroup),n.dispatchWorkgroups(...a.dispatchGroup),this.writeTimestamp(this.pendingDispatchNumber*2+1),this.pendingDispatchNumber++,this.queryType!=="none"&&this.pendingKernels.push(t[i]),(this.pendingDispatchNumber>=this.maxDispatchNumber||this.queryType==="at-passes")&&this.endComputePass(),this.pendingDispatchNumber>=this.maxDispatchNumber&&this.flush()}this.flush(),this.sessionStatus="default"}onCreateSession(){this.gpuDataManager.onCreateSession()}onReleaseSession(e){this.unregisterBuffers(e),this.capturedCommandList.has(e)&&this.capturedCommandList.delete(e),this.capturedPendingKernels.has(e)&&this.capturedPendingKernels.delete(e),this.gpuDataManager.onReleaseSession(e)}onRunStart(e){this.currentSessionId=e,this.setQueryType()}}}),Nm={};ir(Nm,{init:()=>Bm});var Yr,Cp,Bm,wb=H(()=>{ne(),gt(),ae(),E_(),Yr=class Dm{constructor(t,r,i,n){this.module=t,this.dataType=r,this.data=i,this.dims=n}getFloat32Array(){if(this.dataType!==1)throw new Error("Invalid data type");let t=R.size(this.dims);return t===0?new Float32Array:new Float32Array(this.module.HEAP8.buffer,this.data,t)}getBigInt64Array(){if(this.dataType!==7)throw new Error("Invalid data type");let t=R.size(this.dims);return t===0?new BigInt64Array:new BigInt64Array(this.module.HEAP8.buffer,this.data,t)}getInt32Array(){if(this.dataType!==6)throw new Error("Invalid data type");let t=R.size(this.dims);return t===0?new Int32Array:new Int32Array(this.module.HEAP8.buffer,this.data,t)}getUint16Array(){if(this.dataType!==10&&this.dataType!==4)throw new Error("Invalid data type");let t=R.size(this.dims);return t===0?new Uint16Array:new Uint16Array(this.module.HEAP8.buffer,this.data,t)}reshape(t){if(R.size(t)!==R.size(this.dims))throw new Error("Invalid new shape");return new Dm(this.module,this.dataType,this.data,t)}},Cp=class{constructor(e,t,r){this.module=e,this.backend=t,this.customDataOffset=0,this.customDataSize=0,this.adapterInfo=t.adapterInfo;let i=e.PTR_SIZE,n=r/e.PTR_SIZE,a=i===4?"i32":"i64";this.opKernelContext=Number(e.getValue(i*n++,a));let s=Number(e.getValue(i*n++,a));this.outputCount=Number(e.getValue(i*n++,a)),this.customDataOffset=Number(e.getValue(i*n++,"*")),this.customDataSize=Number(e.getValue(i*n++,a));let o=[];for(let l=0;l<s;l++){let d=Number(e.getValue(i*n++,a)),p=Number(e.getValue(i*n++,"*")),c=Number(e.getValue(i*n++,a)),f=[];for(let g=0;g<c;g++)f.push(Number(e.getValue(i*n++,a)));o.push(new Yr(e,d,p,f))}this.inputs=o}get kernelCustomData(){return this.backend.currentKernelCustomData}get customDataBuffer(){return this.module.HEAPU8.subarray(this.customDataOffset,this.customDataOffset+this.customDataSize)}compute(e,t){let r=t?.inputs?.map(s=>typeof s=="number"?this.inputs[s]:s)??this.inputs,i=t?.outputs??[],n=(s,o,l)=>new Yr(this.module,o,this.output(s,l),l),a=(s,o)=>{let l=Dt(s,o);if(!l)throw new Error(`Unsupported data type: ${s}`);let d=l>0?this.backend.gpuDataManager.create(l).id:0;return new Yr(this.module,s,d,o)};return this.backend.run(e,r,i,n,a,this.outputCount)}output(e,t){let r=this.module.stackSave();try{let i=this.module.PTR_SIZE,n=i===4?"i32":"i64",a=this.module.stackAlloc((1+t.length)*i);this.module.setValue(a,t.length,n);for(let s=0;s<t.length;s++)this.module.setValue(a+i*(s+1),t[s],n);return this.module._JsepOutput(this.opKernelContext,e,a)}catch(i){throw new Error(`Failed to generate kernel's output[${e}] with dims [${t}]. If you are running with pre-allocated output, please make sure the output type/dims are correct. Error: ${i}`)}finally{this.module.stackRestore(r)}}},Bm=async(e,t,r,i)=>{let n=t.jsepInit;if(!n)throw new Error("Failed to initialize JSEP. The WebAssembly module is not built with JSEP support.");if(e==="webgpu"){let a=(bb(),kr(Om)).WebGpuBackend,s=new a;await s.initialize(r,i),n("webgpu",[s,o=>s.alloc(Number(o)),o=>s.free(o),(o,l,d,p=!1)=>{if(p)he("verbose",()=>`[WebGPU] jsepCopyGpuToGpu: src=${Number(o)}, dst=${Number(l)}, size=${Number(d)}`),s.memcpy(Number(o),Number(l));else{he("verbose",()=>`[WebGPU] jsepCopyCpuToGpu: dataOffset=${Number(o)}, gpuDataId=${Number(l)}, size=${Number(d)}`);let c=t.HEAPU8.subarray(Number(o>>>0),Number(o>>>0)+Number(d));s.upload(Number(l),c)}},async(o,l,d)=>{he("verbose",()=>`[WebGPU] jsepCopyGpuToCpu: gpuDataId=${o}, dataOffset=${l}, size=${d}`),await s.download(Number(o),()=>t.HEAPU8.subarray(Number(l)>>>0,Number(l+d)>>>0))},(o,l,d)=>s.createKernel(o,Number(l),d,t.UTF8ToString(t._JsepGetNodeName(Number(l)))),o=>s.releaseKernel(o),(o,l,d,p)=>{he("verbose",()=>`[WebGPU] jsepRun: sessionHandle=${d}, kernel=${o}, contextDataOffset=${l}`);let c=new Cp(t,s,Number(l));return s.computeKernel(Number(o),c,p)},()=>s.captureBegin(),()=>s.captureEnd(),()=>s.replay()])}else{let a=new Hc(r);n("webnn",[a,()=>a.reserveTensorId(),s=>a.releaseTensorId(s),async(s,o,l,d,p)=>a.ensureTensor(s,o,l,d,p),(s,o)=>{a.uploadTensor(s,o)},async(s,o)=>a.downloadTensor(s,o),(s,o)=>a.registerMLContext(s,o),!!r.trace])}}}),zp,Fa,Va,xt,Ap,Ln,fi,Ha,ja,qn,Ka,Xa,Za,Pm=H(()=>{Ke(),k_(),T_(),ne(),Vt(),Ea(),Lc(),zp=(e,t)=>{ve()._OrtInit(e,t)!==0&&_e("Can't initialize onnxruntime.")},Fa=async e=>{zp(e.wasm.numThreads,li(e.logLevel))},Va=async(e,t)=>{ve().asyncInit?.();let r=e.webgpu.adapter;if(t==="webgpu"){if(typeof navigator>"u"||!navigator.gpu)throw new Error("WebGPU is not supported in current environment");if(r){if(typeof r.limits!="object"||typeof r.features!="object"||typeof r.requestDevice!="function")throw new Error("Invalid GPU adapter set in `env.webgpu.adapter`. It must be a GPUAdapter object.")}else{let i=e.webgpu.powerPreference;if(i!==void 0&&i!=="low-power"&&i!=="high-performance")throw new Error(`Invalid powerPreference setting: "${i}"`);let n=e.webgpu.forceFallbackAdapter;if(n!==void 0&&typeof n!="boolean")throw new Error(`Invalid forceFallbackAdapter setting: "${n}"`);if(r=await navigator.gpu.requestAdapter({powerPreference:i,forceFallbackAdapter:n}),!r)throw new Error('Failed to get GPU adapter. You may need to enable flag "--enable-unsafe-webgpu" if you are using Chrome.')}}if(t==="webnn"&&(typeof navigator>"u"||!navigator.ml))throw new Error("WebNN is not supported in current environment");{let i=(wb(),kr(Nm)).init;t==="webgpu"&&await i("webgpu",ve(),e,r),t==="webnn"&&await i("webnn",ve(),e)}},xt=new Map,Ap=e=>{let t=ve(),r=t.stackSave();try{let i=t.PTR_SIZE,n=t.stackAlloc(2*i);t._OrtGetInputOutputCount(e,n,n+i)!==0&&_e("Can't get session input/output count.");let a=i===4?"i32":"i64";return[Number(t.getValue(n,a)),Number(t.getValue(n+i,a))]}finally{t.stackRestore(r)}},Ln=(e,t)=>{let r=ve(),i=r.stackSave(),n=0;try{let a=r.PTR_SIZE,s=r.stackAlloc(2*a);r._OrtGetInputOutputMetadata(e,t,s,s+a)!==0&&_e("Can't get session input/output metadata.");let o=Number(r.getValue(s,"*"));n=Number(r.getValue(s+a,"*"));let l=r.HEAP32[n/4];if(l===0)return[o,0];let d=r.HEAPU32[n/4+1],p=[];for(let c=0;c<d;c++){let f=Number(r.getValue(n+8+c*a,"*"));p.push(f!==0?r.UTF8ToString(f):Number(r.getValue(n+8+(c+d)*a,"*")))}return[o,l,p]}finally{r.stackRestore(i),n!==0&&r._OrtFree(n)}},fi=e=>{let t=ve(),r=t._malloc(e.byteLength);if(r===0)throw new Error(`Can't create a session. failed to allocate a buffer of size ${e.byteLength}.`);return t.HEAPU8.set(e,r),[r,e.byteLength]},Ha=async(e,t)=>{let r,i,n=ve();Array.isArray(e)?[r,i]=e:e.buffer===n.HEAPU8.buffer?[r,i]=[e.byteOffset,e.byteLength]:[r,i]=fi(e);let a=0,s=0,o=0,l=[],d=[],p=[];try{if([s,l]=await Uc(t),t?.externalData&&n.mountExternalData){let x=[];for(let I of t.externalData){let C=typeof I=="string"?I:I.path;x.push(Aa(typeof I=="string"?I:I.data).then(z=>{n.mountExternalData(C,z)}))}await Promise.all(x)}for(let x of t?.executionProviders??[])if((typeof x=="string"?x:x.name)==="webnn"){if(n.shouldTransferToMLTensor=!1,typeof x!="string"){let I=x,C=I?.context,z=I?.gpuDevice,k=I?.deviceType,B=I?.powerPreference;C?n.currentContext=C:z?n.currentContext=await n.webnnCreateMLContext(z):n.currentContext=await n.webnnCreateMLContext({deviceType:k,powerPreference:B})}else n.currentContext=await n.webnnCreateMLContext();break}a=await n._OrtCreateSession(r,i,s),n.webgpuOnCreateSession?.(a),a===0&&_e("Can't create a session."),n.jsepOnCreateSession?.(),n.currentContext&&(n.webnnRegisterMLContext(a,n.currentContext),n.currentContext=void 0,n.shouldTransferToMLTensor=!0);let[c,f]=Ap(a),g=!!t?.enableGraphCapture,m=[],_=[],v=[],$=[],w=[];for(let x=0;x<c;x++){let[I,C,z]=Ln(a,x);I===0&&_e("Can't get an input name."),d.push(I);let k=n.UTF8ToString(I);m.push(k),v.push(C===0?{name:k,isTensor:!1}:{name:k,isTensor:!0,type:mt(C),shape:z})}for(let x=0;x<f;x++){let[I,C,z]=Ln(a,x+c);I===0&&_e("Can't get an output name."),p.push(I);let k=n.UTF8ToString(I);_.push(k),$.push(C===0?{name:k,isTensor:!1}:{name:k,isTensor:!0,type:mt(C),shape:z});{if(g&&t?.preferredOutputLocation===void 0){w.push("gpu-buffer");continue}let B=typeof t?.preferredOutputLocation=="string"?t.preferredOutputLocation:t?.preferredOutputLocation?.[k]??"cpu",L=n.webnnIsGraphOutput;if(B==="cpu"&&L&&L(a,k)){w.push("ml-tensor-cpu-output");continue}if(B!=="cpu"&&B!=="cpu-pinned"&&B!=="gpu-buffer"&&B!=="ml-tensor")throw new Error(`Not supported preferred output location: ${B}.`);if(g&&B!=="gpu-buffer")throw new Error(`Not supported preferred output location: ${B}. Only 'gpu-buffer' location is supported when enableGraphCapture is true.`);w.push(B)}}let S=null;return w.some(x=>x==="gpu-buffer"||x==="ml-tensor"||x==="ml-tensor-cpu-output")&&(o=n._OrtCreateBinding(a),o===0&&_e("Can't create IO binding."),S={handle:o,outputPreferredLocations:w,outputPreferredLocationsEncoded:w.map(x=>x==="ml-tensor-cpu-output"?"ml-tensor":x).map(x=>ia(x))}),xt.set(a,[a,d,p,S,g,!1]),[a,m,_,v,$]}catch(c){throw d.forEach(f=>n._OrtFree(f)),p.forEach(f=>n._OrtFree(f)),o!==0&&n._OrtReleaseBinding(o)!==0&&_e("Can't release IO binding."),a!==0&&n._OrtReleaseSession(a)!==0&&_e("Can't release session."),c}finally{n._free(r),s!==0&&n._OrtReleaseSessionOptions(s)!==0&&_e("Can't release session options."),l.forEach(c=>n._free(c)),n.unmountExternalData?.()}},ja=e=>{let t=ve(),r=xt.get(e);if(!r)throw new Error(`cannot release session. invalid session id: ${e}`);let[i,n,a,s,o]=r;s&&(o&&t._OrtClearBoundOutputs(s.handle)!==0&&_e("Can't clear bound outputs."),t._OrtReleaseBinding(s.handle)!==0&&_e("Can't release IO binding.")),t.jsepOnReleaseSession?.(e),t.webnnOnReleaseSession?.(e),t.webgpuOnReleaseSession?.(e),n.forEach(l=>t._OrtFree(l)),a.forEach(l=>t._OrtFree(l)),t._OrtReleaseSession(i)!==0&&_e("Can't release session."),xt.delete(e)},qn=async(e,t,r,i,n,a,s=!1)=>{if(!e){t.push(0);return}let o=ve(),l=o.PTR_SIZE,d=e[0],p=e[1],c=e[3],f=c,g,m;if(d==="string"&&(c==="gpu-buffer"||c==="ml-tensor"))throw new Error("String tensor is not supported on GPU.");if(s&&c!=="gpu-buffer")throw new Error(`External buffer must be provided for input/output index ${a} when enableGraphCapture is true.`);if(c==="gpu-buffer"){let $=e[2].gpuBuffer;m=Dt(Bt(d),p);{let w=o.jsepRegisterBuffer;if(!w)throw new Error('Tensor location "gpu-buffer" is not supported without using WebGPU.');g=w(i,a,$,m)}}else if(c==="ml-tensor"){let $=e[2].mlTensor;m=Dt(Bt(d),p);let w=o.webnnRegisterMLTensor;if(!w)throw new Error('Tensor location "ml-tensor" is not supported without using WebNN.');g=w(i,$,Bt(d),p)}else{let $=e[2];if(Array.isArray($)){m=l*$.length,g=o._malloc(m),r.push(g);for(let w=0;w<$.length;w++){if(typeof $[w]!="string")throw new TypeError(`tensor data at index ${w} is not a string`);o.setValue(g+w*l,tt($[w],r),"*")}}else{let w=o.webnnIsGraphInput,S=o.webnnIsGraphOutput;if(d!=="string"&&w&&S){let x=o.UTF8ToString(n);if(w(i,x)||S(i,x)){let I=Bt(d);m=Dt(I,p),f="ml-tensor";let C=o.webnnCreateTemporaryTensor,z=o.webnnUploadTensor;if(!C||!z)throw new Error('Tensor location "ml-tensor" is not supported without using WebNN.');let k=await C(i,I,p);z(k,new Uint8Array($.buffer,$.byteOffset,$.byteLength)),g=k}else m=$.byteLength,g=o._malloc(m),r.push(g),o.HEAPU8.set(new Uint8Array($.buffer,$.byteOffset,m),g)}else m=$.byteLength,g=o._malloc(m),r.push(g),o.HEAPU8.set(new Uint8Array($.buffer,$.byteOffset,m),g)}}let _=o.stackSave(),v=o.stackAlloc(4*p.length);try{p.forEach((w,S)=>o.setValue(v+S*l,w,l===4?"i32":"i64"));let $=o._OrtCreateTensor(Bt(d),g,m,v,p.length,ia(f));$===0&&_e(`Can't create tensor for input/output. session=${i}, index=${a}.`),t.push($)}finally{o.stackRestore(_)}},Ka=async(e,t,r,i,n,a)=>{let s=ve(),o=s.PTR_SIZE,l=xt.get(e);if(!l)throw new Error(`cannot run inference. invalid session id: ${e}`);let d=l[0],p=l[1],c=l[2],f=l[3],g=l[4],m=l[5],_=t.length,v=i.length,$=0,w=[],S=[],x=[],I=[],C=[],z=s.stackSave(),k=s.stackAlloc(_*o),B=s.stackAlloc(_*o),L=s.stackAlloc(v*o),j=s.stackAlloc(v*o);try{[$,w]=Pc(a),Lt("wasm prepareInputOutputTensor");for(let N=0;N<_;N++)await qn(r[N],S,I,e,p[t[N]],t[N],g);for(let N=0;N<v;N++)await qn(n[N],x,I,e,c[i[N]],_+i[N],g);qt("wasm prepareInputOutputTensor");for(let N=0;N<_;N++)s.setValue(k+N*o,S[N],"*"),s.setValue(B+N*o,p[t[N]],"*");for(let N=0;N<v;N++)s.setValue(L+N*o,x[N],"*"),s.setValue(j+N*o,c[i[N]],"*");if(f&&!m){let{handle:N,outputPreferredLocations:G,outputPreferredLocationsEncoded:Y}=f;if(p.length!==_)throw new Error(`input count from feeds (${_}) is expected to be always equal to model's input count (${p.length}).`);Lt("wasm bindInputsOutputs");for(let P=0;P<_;P++){let V=t[P];await s._OrtBindInput(N,p[V],S[P])!==0&&_e(`Can't bind input[${P}] for session=${e}.`)}for(let P=0;P<v;P++){let V=i[P];n[P]?.[3]?(C.push(x[P]),s._OrtBindOutput(N,c[V],x[P],0)!==0&&_e(`Can't bind pre-allocated output[${P}] for session=${e}.`)):s._OrtBindOutput(N,c[V],0,Y[V])!==0&&_e(`Can't bind output[${P}] to ${G[P]} for session=${e}.`)}qt("wasm bindInputsOutputs"),xt.set(e,[d,p,c,f,g,!0])}s.jsepOnRunStart?.(d),s.webnnOnRunStart?.(d);let M;f?M=await s._OrtRunWithBinding(d,f.handle,v,L,$):M=await s._OrtRun(d,B,k,_,j,v,L,$),M!==0&&_e("failed to call OrtRun().");let W=[],O=[];Lt("wasm ProcessOutputTensor");for(let N=0;N<v;N++){let G=Number(s.getValue(L+N*o,"*"));if(G===x[N]||C.includes(x[N])){W.push(n[N]),G!==x[N]&&s._OrtReleaseTensor(G)!==0&&_e("Can't release tensor.");continue}let Y=s.stackSave(),P=s.stackAlloc(4*o),V=!1,Z,q=0;try{s._OrtGetTensorData(G,P,P+o,P+2*o,P+3*o)!==0&&_e(`Can't access output tensor data on index ${N}.`);let ee=o===4?"i32":"i64",Q=Number(s.getValue(P,ee));q=s.getValue(P+o,"*");let X=s.getValue(P+o*2,"*"),be=Number(s.getValue(P+o*3,ee)),ze=[];for(let fe=0;fe<be;fe++)ze.push(Number(s.getValue(X+fe*o,ee)));s._OrtFree(X)!==0&&_e("Can't free memory for tensor dims.");let F=ze.reduce((fe,Se)=>fe*Se,1);Z=mt(Q);let pe=f?.outputPreferredLocations[i[N]];if(Z==="string"){if(pe==="gpu-buffer"||pe==="ml-tensor")throw new Error("String tensor is not supported on GPU.");let fe=[];for(let Se=0;Se<F;Se++){let De=s.getValue(q+Se*o,"*"),Ir=s.getValue(q+(Se+1)*o,"*"),at=Se===F-1?void 0:Ir-De;fe.push(s.UTF8ToString(De,at))}W.push([Z,ze,fe,"cpu"])}else if(pe==="gpu-buffer"&&F>0){let fe=s.jsepGetBuffer;if(!fe)throw new Error('preferredLocation "gpu-buffer" is not supported without using WebGPU.');let Se=fe(q),De=Dt(Q,F);if(De===void 0||!Ca(Z))throw new Error(`Unsupported data type: ${Z}`);V=!0,W.push([Z,ze,{gpuBuffer:Se,download:s.jsepCreateDownloader(Se,De,Z),dispose:()=>{s._OrtReleaseTensor(G)!==0&&_e("Can't release tensor.")}},"gpu-buffer"])}else if(pe==="ml-tensor"&&F>0){let fe=s.webnnEnsureTensor,Se=s.webnnIsGraphInputOutputTypeSupported;if(!fe||!Se)throw new Error('preferredLocation "ml-tensor" is not supported without using WebNN.');if(Dt(Q,F)===void 0||!za(Z))throw new Error(`Unsupported data type: ${Z}`);if(!Se(e,Z,!1))throw new Error(`preferredLocation "ml-tensor" for ${Z} output is not supported by current WebNN Context.`);let De=await fe(e,q,Q,ze,!1);V=!0,W.push([Z,ze,{mlTensor:De,download:s.webnnCreateMLTensorDownloader(q,Z),dispose:()=>{s.webnnReleaseTensorId(q),s._OrtReleaseTensor(G)}},"ml-tensor"])}else if(pe==="ml-tensor-cpu-output"&&F>0){let fe=s.webnnCreateMLTensorDownloader(q,Z)(),Se=W.length;V=!0,O.push((async()=>{let De=[Se,await fe];return s.webnnReleaseTensorId(q),s._OrtReleaseTensor(G),De})()),W.push([Z,ze,[],"cpu"])}else{let fe=wi(Z),Se=new fe(F);new Uint8Array(Se.buffer,Se.byteOffset,Se.byteLength).set(s.HEAPU8.subarray(q,q+Se.byteLength)),W.push([Z,ze,Se,"cpu"])}}finally{s.stackRestore(Y),Z==="string"&&q&&s._free(q),V||s._OrtReleaseTensor(G)}}f&&!g&&(s._OrtClearBoundOutputs(f.handle)!==0&&_e("Can't clear bound outputs."),xt.set(e,[d,p,c,f,g,!1]));for(let[N,G]of await Promise.all(O))W[N][2]=G;return qt("wasm ProcessOutputTensor"),W}finally{s.webnnOnRunEnd?.(d),s.stackRestore(z),S.forEach(M=>s._OrtReleaseTensor(M)),x.forEach(M=>s._OrtReleaseTensor(M)),I.forEach(M=>s._free(M)),$!==0&&s._OrtReleaseRunOptions($),w.forEach(M=>s._free(M))}},Xa=e=>{let t=ve(),r=xt.get(e);if(!r)throw new Error("invalid session id");let i=r[0],n=t._OrtEndProfiling(i);n===0&&_e("Can't get an profile file name."),t._OrtFree(n)},Za=e=>{let t=[];for(let r of e){let i=r[2];!Array.isArray(i)&&"buffer"in i&&t.push(i.buffer)}return t}}),St,He,Xt,gr,yr,Qr,Wn,Jr,Ot,Rt,Mp,Um,Lm,qm,Wm,Gm,Fm,Vm,Hm=H(()=>{Ke(),Pm(),Vt(),Ta(),St=()=>!!$e.wasm.proxy&&typeof document<"u",Xt=!1,gr=!1,yr=!1,Jr=new Map,Ot=(e,t)=>{let r=Jr.get(e);r?r.push(t):Jr.set(e,[t])},Rt=()=>{if(Xt||!gr||yr||!He)throw new Error("worker not ready")},Mp=e=>{switch(e.data.type){case"init-wasm":Xt=!1,e.data.err?(yr=!0,Wn[1](e.data.err)):(gr=!0,Wn[0]()),Qr&&(URL.revokeObjectURL(Qr),Qr=void 0);break;case"init-ep":case"copy-from":case"create":case"release":case"run":case"end-profiling":{let t=Jr.get(e.data.type);e.data.err?t.shift()[1](e.data.err):t.shift()[0](e.data.out);break}}},Um=async()=>{if(!gr){if(Xt)throw new Error("multiple calls to 'initWasm()' detected.");if(yr)throw new Error("previous call to 'initWasm()' failed.");if(Xt=!0,St())return new Promise((e,t)=>{He?.terminate(),Bc().then(([r,i])=>{try{He=i,He.onerror=a=>t(a),He.onmessage=Mp,Wn=[e,t];let n={type:"init-wasm",in:$e};!n.in.wasm.wasmPaths&&(r||ra)&&(n.in.wasm.wasmPaths={wasm:new URL("/SACHIZU-LAB1/assets/ort-wasm-simd-threaded.jsep-DC5y_g6C.wasm",import.meta.url).href}),He.postMessage(n),Qr=r}catch(n){t(n)}},t)});try{await Ia($e.wasm),await Fa($e),gr=!0}catch(e){throw yr=!0,e}finally{Xt=!1}}},Lm=async e=>{if(St())return Rt(),new Promise((t,r)=>{Ot("init-ep",[t,r]);let i={type:"init-ep",in:{epName:e,env:$e}};He.postMessage(i)});await Va($e,e)},qm=async e=>St()?(Rt(),new Promise((t,r)=>{Ot("copy-from",[t,r]);let i={type:"copy-from",in:{buffer:e}};He.postMessage(i,[e.buffer])})):fi(e),Wm=async(e,t)=>{if(St()){if(t?.preferredOutputLocation)throw new Error('session option "preferredOutputLocation" is not supported for proxy.');return Rt(),new Promise((r,i)=>{Ot("create",[r,i]);let n={type:"create",in:{model:e,options:{...t}}},a=[];e instanceof Uint8Array&&a.push(e.buffer),He.postMessage(n,a)})}else return Ha(e,t)},Gm=async e=>{if(St())return Rt(),new Promise((t,r)=>{Ot("release",[t,r]);let i={type:"release",in:e};He.postMessage(i)});ja(e)},Fm=async(e,t,r,i,n,a)=>{if(St()){if(r.some(s=>s[3]!=="cpu"))throw new Error("input tensor on GPU is not supported for proxy.");if(n.some(s=>s))throw new Error("pre-allocated output tensor is not supported for proxy.");return Rt(),new Promise((s,o)=>{Ot("run",[s,o]);let l=r,d={type:"run",in:{sessionId:e,inputIndices:t,inputs:l,outputIndices:i,options:a}};He.postMessage(d,Za(l))})}else return Ka(e,t,r,i,n,a)},Vm=async e=>{if(St())return Rt(),new Promise((t,r)=>{Ot("end-profiling",[t,r]);let i={type:"end-profiling",in:e};He.postMessage(i)});Xa(e)}}),Gn,Op,jm,$b=H(()=>{Ke(),Hm(),ne(),ka(),Lc(),Gn=(e,t)=>{switch(e.location){case"cpu":return[e.type,e.dims,e.data,"cpu"];case"gpu-buffer":return[e.type,e.dims,{gpuBuffer:e.gpuBuffer},"gpu-buffer"];case"ml-tensor":return[e.type,e.dims,{mlTensor:e.mlTensor},"ml-tensor"];default:throw new Error(`invalid data location: ${e.location} for ${t()}`)}},Op=e=>{switch(e[3]){case"cpu":return new rt(e[0],e[2],e[1]);case"gpu-buffer":{let t=e[0];if(!Ca(t))throw new Error(`not supported data type: ${t} for deserializing GPU tensor`);let{gpuBuffer:r,download:i,dispose:n}=e[2];return rt.fromGpuBuffer(r,{dataType:t,dims:e[1],download:i,dispose:n})}case"ml-tensor":{let t=e[0];if(!za(t))throw new Error(`not supported data type: ${t} for deserializing MLTensor tensor`);let{mlTensor:r,download:i,dispose:n}=e[2];return rt.fromMLTensor(r,{dataType:t,dims:e[1],download:i,dispose:n})}default:throw new Error(`invalid data location: ${e[3]}`)}},jm=class{async fetchModelAndCopyToWasmMemory(e){return qm(await Aa(e))}async loadModel(e,t){pt();let r;typeof e=="string"?r=await this.fetchModelAndCopyToWasmMemory(e):r=e,[this.sessionId,this.inputNames,this.outputNames,this.inputMetadata,this.outputMetadata]=await Wm(r,t),nt()}async dispose(){return Gm(this.sessionId)}async run(e,t,r){pt();let i=[],n=[];Object.entries(e).forEach(c=>{let f=c[0],g=c[1],m=this.inputNames.indexOf(f);if(m===-1)throw new Error(`invalid input '${f}'`);i.push(g),n.push(m)});let a=[],s=[];Object.entries(t).forEach(c=>{let f=c[0],g=c[1],m=this.outputNames.indexOf(f);if(m===-1)throw new Error(`invalid output '${f}'`);a.push(g),s.push(m)});let o=i.map((c,f)=>Gn(c,()=>`input "${this.inputNames[n[f]]}"`)),l=a.map((c,f)=>c?Gn(c,()=>`output "${this.outputNames[s[f]]}"`):null),d=await Fm(this.sessionId,n,o,s,l,r),p={};for(let c=0;c<d.length;c++)p[this.outputNames[s[c]]]=a[c]??Op(d[c]);return nt(),p}startProfiling(){}endProfiling(){Vm(this.sessionId)}}}),Km={};ir(Km,{OnnxruntimeWebAssemblyBackend:()=>ya,initializeFlags:()=>ga,wasmBackend:()=>Xm});var ga,ya,Xm,vb=H(()=>{Ke(),Hm(),$b(),ga=()=>{(typeof $e.wasm.initTimeout!="number"||$e.wasm.initTimeout<0)&&($e.wasm.initTimeout=0);let e=$e.wasm.simd;if(typeof e!="boolean"&&e!==void 0&&e!=="fixed"&&e!=="relaxed"&&(console.warn(`Property "env.wasm.simd" is set to unknown value "${e}". Reset it to \`false\` and ignore SIMD feature checking.`),$e.wasm.simd=!1),typeof $e.wasm.proxy!="boolean"&&($e.wasm.proxy=!1),typeof $e.wasm.trace!="boolean"&&($e.wasm.trace=!1),typeof $e.wasm.numThreads!="number"||!Number.isInteger($e.wasm.numThreads)||$e.wasm.numThreads<=0)if(typeof self<"u"&&!self.crossOriginIsolated)$e.wasm.numThreads=1;else{let t=typeof navigator>"u"?o_("node:os").cpus().length:navigator.hardwareConcurrency;$e.wasm.numThreads=Math.min(4,Math.ceil((t||1)/2))}},ya=class{async init(e){ga(),await Um(),await Lm(e)}async createInferenceSessionHandler(e,t){let r=new jm;return await r.loadModel(e,t),r}},Xm=new ya});Ke();Ke();Ke();var xb="1.27.0";{let e=(vb(),kr(Km)).wasmBackend;Qt("webgpu",e,5),Qt("webnn",e,5),Qt("cpu",e,10),Qt("wasm",e,10)}Object.defineProperty($e.versions,"web",{value:xb,enumerable:!0});const Sb="rtmpose-m-halpe26-256x192.onnx",kb="26f3a19e61304a600dfb82d1001d41d24343b89fc70a33ffc84657e0b0bf2ecf",Tb=new URL("/SACHIZU-LAB1/assets/ort-wasm-simd-threaded.jsep-DC5y_g6C.wasm",import.meta.url).href,We=192,je=256,Ib=[123.675,116.28,103.53],Eb=[58.395,57.12,57.375],Rp={0:0,11:5,12:6,13:7,14:8,15:9,16:10,23:11,24:12,25:13,26:14,27:15,28:16,29:24,30:25,31:20,32:21};function Cb(e,t,r){const i=e.filter(f=>Number.isFinite(f.x)&&Number.isFinite(f.y)&&(f.visibility??1)>=.3);if(i.length<5)return null;const n=i.map(f=>f.x*t),a=i.map(f=>f.y*r),s=Math.min(...n),o=Math.max(...n),l=Math.min(...a),d=Math.max(...a);let p=Math.max(1,(o-s)*1.25),c=Math.max(1,(d-l)*1.25);return p/c>We/je?c=p*je/We:p=c*We/je,{cx:(s+o)/2,cy:(l+d)/2,scale:p/We}}function zb(e,t,r,i,n){const s=e.length/26,o=t.length/26,l=[];for(let d=0;d<26;d++){let p=0,c=0;for(let f=1;f<s;f++)e[d*s+f]>e[d*s+p]&&(p=f);for(let f=1;f<o;f++)t[d*o+f]>t[d*o+c]&&(c=f);l.push({x:(r.cx+(p/2-We/2)*r.scale)/i,y:(r.cy+(c/2-je/2)*r.scale)/n,visibility:Math.min(e[d*s+p],t[d*o+c])})}return Array.from({length:33},(d,p)=>p in Rp?{...l[Rp[p]]}:{...l[0],visibility:0})}let Fn=null;function Zm(e,t){return Fn??=Ab(e,t).catch(r=>{throw Fn=null,r}),Fn}async function Ab(e,t){const r=await py(`/SACHIZU-LAB1/models/rtmpose/${Sb}`,e,c=>t(c.replace("姿勢モデル","高精度の骨格モデル")));if(Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",r)),c=>c.toString(16).padStart(2,"0")).join("")!==kb)throw new Error("高精度の骨格モデルのファイルが正しくありません。");t("高精度の骨格モデルを準備しています…"),$e.wasm.wasmPaths={wasm:Tb},$e.wasm.numThreads=1;let n=null,a="wasm";const s=typeof navigator<"u"&&!!navigator.gpu;for(const c of s?["webgpu","wasm"]:["wasm"])try{n=await Sa.create(r,{executionProviders:[c],graphOptimizationLevel:"all"}),a=c;break}catch{}if(!n)throw new Error("高精度の骨格モデルを開始できませんでした。");const o=n,l=document.createElement("canvas");l.width=We,l.height=je;const d=l.getContext("2d",{willReadFrequently:!0});if(!d)throw new Error("映像処理を開始できません。");const p=new Float32Array(3*We*je);return{backend:a,async refine(c,f){const g=c.width,m=c.height,_=Cb(f,g,m);if(!_)return null;const v=_.cx-We/2*_.scale,$=_.cy-je/2*_.scale,w=Math.max(0,v),S=Math.max(0,$),x=Math.min(g,v+We*_.scale),I=Math.min(m,$+je*_.scale);d.clearRect(0,0,We,je),x>w&&I>S&&d.drawImage(c,w,S,x-w,I-S,(w-v)/_.scale,(S-$)/_.scale,(x-w)/_.scale,(I-S)/_.scale);const C=d.getImageData(0,0,We,je).data,z=We*je;for(let B=0;B<z;B++)for(let L=0;L<3;L++)p[L*z+B]=(C[4*B+L]-Ib[L])/Eb[L];const k=await o.run({input:new rt("float32",p,[1,3,je,We])});return zb(k.simcc_x.data,k.simcc_y.data,_,g,m)}}}const ke=1e-9,Np=.2,Mb=.1,dt=.2,Bp=.1,ei=1.5,Dp=.03,Ob=1,Zt=.06,Vn=.15,Pp=.05,Rb=.08,ti=3,Nb=.06,Bb=6,Db=.25,_a=2.5,Hn=.03,Up=1.2,Pb=.1,Lp=2.5,Ub=4.5,Lb=4.5,qb=2.5,Wb=[11,12,23,24,25,26,27,28],Gb=.012,Fb=.02,qp=.05,Vb=.015,Hb=.5,Wp=.01,jb=(e,t)=>Wb.every(r=>!e[r]||e[r].x>t[0]+Wp*(t[1]-t[0])/.36&&e[r].x<t[1]-Wp*(t[1]-t[0])/.36),Kb=15;function Gp(e,t){e.push(t),e.length>Kb&&e.shift()}function Fp(e){if(!e.length)return null;const t=[...e].sort((r,i)=>r-i);return t[t.length>>1]}function Ue(e){const t=e.reduce((n,a)=>n+a.t,0)/e.length,r=e.reduce((n,a)=>n+a.x,0)/e.length,i=e.reduce((n,a)=>n+(a.t-t)**2,0);return{mt:t,mx:r,slope:i>0?e.reduce((n,a)=>n+(a.t-t)*(a.x-r),0)/i:0}}function _r(e,t,r,i,n=.08){return e.filter(a=>Math.abs(a.x-t)<r&&(i===null||Math.abs(a.y-i)<n)).sort((a,s)=>Math.abs(a.x-t)-Math.abs(s.x-t))}const jn=(e,t)=>Math.abs(e.x-t.x)<Gb&&Math.abs(e.y-t.y)<Fb,ri=(e,t)=>e.length>1&&Math.abs(e[1].x-t)-Math.abs(e[0].x-t)<.03,Xb=.03,Zb=1/50,Vp=.035,Hp=.08,jp=12,Yb=.1,Qb=.5;function Kp(e,t,r,i,n=.08){return e.filter(a=>Math.abs(a.x-t)<r&&(i===null||Math.abs(a.y-i)<n)).sort((a,s)=>Math.hypot(a.x-t,i===null?0:a.y-i)-Math.hypot(s.x-t,i===null?0:s.y-i))}const Xp=(e,t,r)=>{const i=e.slice(1).find(n=>r===null||Math.abs(n.y-r)<Xb);return!!i&&Math.abs(i.x-t)-Math.abs(e[0].x-t)<.03};class Jb{x;y=null;pts=null;velocity=0;history=[];acquisition=null;provisional=[];resumption=null;challenger=null;running=!1;behindStart=!1;backfill=[];watchTracks=[];intervals=[];watchIntervals=[];lastPts=null;lastWatchPts=null;lastInterval=1/120;publishedFrom=null;retraction=null;rivalSeen=!1;nearer=[];finishX;seed;direction;start;sprintSpeed;fromBlocks;constructor(t,r=0,i="standing",n=0,a=!1){this.fromBlocks=a,this.seed=t,this.direction=Math.sign(r),this.finishX=t+r,this.start=this.direction&&i==="flying"?"flying":"standing",this.sprintSpeed=Math.max(dt,n),this.x=this.flyingSeed()}frameInterval(){return Fp(this.intervals)??this.lastInterval}watchInterval(){return Fp(this.watchIntervals)??2*this.frameInterval()}gapLimit(t=this.frameInterval()){return Math.max(.05,Lp*t)}get sparse(){return this.frameInterval()>Zb}trackHeight(){return this.sparse?Vp:Hp}frameRadius(){return Math.min(Zt,Dp+Ob*Math.max(0,this.frameInterval()-1/120))}shortGap(){return Math.max(Bp,Lp*this.frameInterval())}decisionWindow(t=this.frameInterval()){return Math.max(Pb,Lb*t)}minSpan(t=this.frameInterval()){return Math.max(Nb,qb*t)}flyingSeed(){return this.start==="flying"?Math.max(.02,Math.min(.98,this.seed-this.direction*Rb)):this.seed}searchAgain(){this.x=this.flyingSeed(),this.y=null,this.pts=null,this.velocity=0,this.history=[],this.provisional=[],this.watchTracks=[],this.resumption=null,this.running=!1,this.behindStart=!1,this.rivalSeen=!1,this.nearer=[]}expected(t){if(this.pts===null&&this.start==="flying"){const r=this.leadCentre(this.provisional,t);if(r!==null)return r}return this.x+this.velocity*Math.max(0,Math.min(ei,this.pts===null?0:t-this.pts))}leadCentre(t,r){const n=t.filter(s=>{const o=s.points.filter(l=>s.pts-l.t<=this.decisionWindow()+ke);return o.length>=ti&&o.at(-1).t-o[0].t>=this.minSpan()-ke&&Ue(o).slope*this.direction>=this.sprintSpeed}).sort((s,o)=>(o.x-s.x)*this.direction)[0];if(!n||r-n.pts>this.shortGap()+ke)return null;const a=n.points.filter(s=>n.pts-s.t<=this.decisionWindow()+ke);return Math.max(0,Math.min(1,n.x+Ue(a).slope*(r-n.pts)))}watchCentre(t){return this.start!=="flying"||this.pts===null||(this.x-this.finishX)*this.direction>=0?null:this.flyingSeed()}get following(){return this.pts!==null}get contested(){return this.rivalSeen}get watching(){return this.watchTracks.some(t=>t.points.length<2||Ue(t.points).slope*this.direction>=dt)}get idle(){return this.start==="flying"&&this.pts===null&&this.provisional.every(t=>{const r=t.points.filter(i=>t.pts-i.t<=this.decisionWindow()+ke);return r.length>=4&&r.at(-1).t-r[0].t>=.06-ke&&Math.abs(Ue(r).slope)<dt/2})}takeBackfill(){const t=this.backfill;return this.backfill=[],t}takeRetraction(){const t=this.retraction;return this.retraction=null,t}choose(t,r,i=[0,1],n){if(!Number.isFinite(r))return this.acquisition=null,this.provisional=[],this.resumption=null,[];if(this.pts!==null&&r<=this.pts)return[];this.lastPts!==null&&r>this.lastPts&&(this.lastInterval=r-this.lastPts,this.idle||Gp(this.intervals,this.lastInterval)),this.lastPts=r,n&&this.pts!==null&&(this.lastWatchPts!==null&&r>this.lastWatchPts&&Gp(this.watchIntervals,r-this.lastWatchPts),this.lastWatchPts=r);const a=(c,f)=>c.filter(g=>[23,24].every(m=>g[m]&&Number.isFinite(g[m].x)&&Number.isFinite(g[m].y)&&g[m].x>0&&g[m].x<1&&g[m].y>0&&g[m].y<1&&(g[m].visibility??0)>=.3)&&(this.start!=="flying"||jb(g,f))).map(g=>({p:g,x:(g[23].x+g[24].x)/2,y:(g[23].y+g[24].y)/2})),s=a(t,i),o=this.start==="flying"&&this.pts!==null,l=this.follow(s,r);if(!o||this.pts===null)return l;const d=s.find(c=>c.p===l),p=[];for(const c of[...s,...n?a(n.poses,n.view):[]])c!==d&&!(d&&jn(c,d))&&!p.some(f=>jn(f,c))&&p.push(c);return this.watch(p,r)??l}watch(t,r){if((this.x-this.finishX)*this.direction>=0)return this.watchTracks=[],null;const{next:i,confirmed:n}=this.advance(this.watchTracks,t,r,this.watchInterval());this.watchTracks=i;const a=this.y;if(a!==null&&i.some(o=>o.points.length>=ti&&o.y-a>=Hn&&Ue(o.points).slope*this.direction>=this.sprintSpeed)&&(this.rivalSeen=!0),a!==null){const o=Math.max(this.sprintSpeed,Up*Math.abs(this.velocity)),l=jp*this.sprintSpeed/_a,d=t.filter(p=>p.y-a>=Hn).map(p=>({t:r,x:p.x,y:p.y}));this.nearer=this.nearer.filter(p=>r-p.t<=Qb),d.some(p=>this.nearer.some(c=>p.t-c.t>=Yb-ke&&Math.abs(p.y-c.y)<Vp&&(p.x-c.x)*this.direction>=o*(p.t-c.t)&&(p.x-c.x)*this.direction<=l*(p.t-c.t)))&&(this.rivalSeen=!0),this.nearer.push(...d)}if(!n||this.y===null)return null;const s=Ue(n.points).slope*this.direction;return n.y-this.y>=Hn&&s>=Up*Math.abs(this.velocity)?(this.retraction=this.publishedFrom,this.adopt(n,r)):null}follow(t,r){if(this.start==="flying"&&this.pts!==null){const o=r-this.pts,l=(this.x-this.seed)*this.direction<0;(o-ei>ke||l&&o-this.shortGap()>ke)&&this.searchAgain()}if(this.pts===null)return this.start==="flying"?this.acquireFlying(t,r):this.acquire(t,r);const i=this.challenge(t,r);if(i)return i;const n=r-this.pts;if(n-ei>ke)return this.start==="flying"||this.running?[]:(this.searchAgain(),this.acquire(t,r));if(n-this.shortGap()>ke||this.resumption)return this.resume(t,r);const a=this.reference(r)??this.expected(r);if(this.start==="flying"){const o=Kp(t,a,this.frameRadius(),this.y,this.trackHeight());return!o.length||Xp(o,a,this.y)?[]:this.accept(o[0],r)}const s=_r(t,a,this.frameRadius(),this.y);return!s.length||ri(s,a)?[]:this.accept(s[0],r)}reference(t){if(this.fromBlocks||Math.abs(this.velocity)<dt)return null;const r=this.history.filter(n=>t-n.t>=Bp-ke&&t-n.t<=.4+ke);if(r.length<4||r.at(-1).t-r[0].t<.08)return null;const i=Ue(r);return i.mx+i.slope*(t-i.mt)}accept(t,r){for(this.x=t.x,this.y=t.y,this.pts=r,this.resumption=null,(t.x-this.seed)*this.direction<=0&&(this.behindStart=!0),this.history.push({t:r,x:t.x});this.history.length&&r-this.history[0].t>.6;)this.history.shift();return this.updateVelocity(r),t.p}updateVelocity(t){const r=this.history.filter(i=>t-i.t<=Np+ke);r.length<3||r.at(-1).t-r[0].t<Mb-ke||(this.velocity=Math.max(-1,Math.min(1,Ue(r).slope)),this.behindStart&&this.velocity*this.direction>=dt&&(this.running=!0))}challenge(t,r){if(!this.direction||this.start==="flying"||this.running||this.velocity*this.direction>=Pp)return this.challenger=null,null;const i=Math.abs(this.expected(r)-this.seed),n=_r(t,this.seed,Math.min(Vn,i-.03),null)[0],a=this.challenger;if(!n)return this.challenger=null,null;const o=a&&r-a.pts-this.gapLimit()<=ke&&Math.abs(n.x-a.x)<Zt&&Math.abs(n.y-a.y)<.08?a.count+1:1;return o<3?(this.challenger={x:n.x,y:n.y,pts:r,count:o},null):(this.x=n.x,this.y=n.y,this.pts=r,this.velocity=0,this.history=[{t:r,x:n.x}],this.resumption=null,this.challenger=null,this.behindStart=(n.x-this.seed)*this.direction<=0,n.p)}resume(t,r){const i=this.expected(r),n=r-this.pts,a=Zt+.5*Math.abs(this.velocity)*Math.min(1,n),s=Math.abs(this.velocity)>=dt||this.velocity*this.direction>=Pp,o=_r(t,i,a,this.y,this.start==="flying"?this.trackHeight():Hp).filter(m=>!s||(m.x-this.x)*Math.sign(this.velocity)>=.4*Math.abs(this.velocity)*Math.min(ei,n));if(!o.length||ri(o,i))return this.resumption=null,[];const l=o[0],d=this.resumption,c=d&&r-d.pts-this.gapLimit()<=ke&&Math.abs(l.x-(d.x+this.velocity*(r-d.pts)))<Zt&&Math.abs(l.y-d.y)<.08?{...d,x:l.x,y:l.y,pts:r,count:d.count+1}:{startX:l.x,startPts:r,x:l.x,y:l.y,pts:r,count:1};this.resumption=c;const f=c.pts-c.startPts;if(c.count<3||f-.04<-ke)return[];const g=(c.x-c.startX)/f;return s&&(Math.sign(g)!==Math.sign(this.velocity)||Math.abs(g)<.4*Math.abs(this.velocity))?(this.resumption=null,[]):(this.history=[],this.accept(l,r))}acquire(t,r){const i=this.acquisition;if(i&&r>i.pts&&r-i.pts-this.gapLimit()<=ke){const s=i.points.length>1?Ue(i.points).slope:0,o=i.x+s*(r-i.pts),l=_r(t,o,Zt,i.y);if(ri(l,o))return this.acquisition=null,[];if(l.length){const d=l[0],p=[...i.points,{t:r,x:d.x}];return p.length<3?(this.acquisition={x:d.x,y:d.y,pts:r,points:p},[]):(this.x=d.x,this.y=d.y,this.pts=r,this.acquisition=null,this.behindStart=p.some(c=>(c.x-this.seed)*this.direction<=0),this.history=p,this.updateVelocity(r),d.p)}}this.acquisition=null;const n=_r(t,this.x,Vn,null);if(!n.length||ri(n,this.x))return[];const a=n[0];return this.acquisition={x:a.x,y:a.y,pts:r,points:[{t:r,x:a.x}]},[]}acquireFlying(t,r){const{next:i,confirmed:n}=this.advance(this.provisional,t,r);return this.provisional=i,n?this.adopt(n,r):[]}advance(t,r,i,n=this.frameInterval()){const a=t.filter(m=>i>m.pts&&i-m.pts-(m.points.length>=ti?Math.max(.05,Ub*n):this.gapLimit(n))<=ke),s=[],o=new Set,l=new Set;for(const m of a){const _=m.points.length>1?Ue(m.points).slope:0,v=m.x+_*(i-m.pts),$=m.points.length<2?jp*this.sprintSpeed/_a*Math.max(0,i-m.pts-.05):0,w=Kp(r.filter(x=>!o.has(x)),v,Zt+$,m.y,this.trackHeight());if(!w.length||Xp(w,v,m.y)){for(const x of w)l.add(x);s.push(m);continue}const S=w[0];o.add(S),s.push({x:S.x,y:S.y,pts:i,points:[...m.points.filter(x=>i-x.t<=.4),{t:i,x:S.x,p:S.p}]})}const d=[];for(const m of r)o.has(m)||l.has(m)||(m.x-this.seed)*this.direction>Vn||[...o,...d].some(_=>jn(m,_))||(d.push(m),s.push({x:m.x,y:m.y,pts:i,points:[{t:i,x:m.x,p:m.p}]}));s.sort((m,_)=>_.points.length-m.points.length||(_.x-m.x)*this.direction);const p=s.slice(0,Bb),c=m=>m.points.filter(_=>i-_.t<=this.decisionWindow(n)+ke),f=p.filter(m=>{if(m.pts!==i)return!1;const _=c(m),v=_.length?_.at(-1).t-_[0].t:0;if(_.length<ti||v-this.minSpan(n)<-ke)return!1;const $=Ue(_).slope*this.direction,w=(_.at(-1).x-_[0].x)*this.direction,S=m.points,x=S.at(-1).t-S[0].t,I=(S.at(-1).x-S[0].x)*this.direction;if(!($>=dt&&w>=.7*dt*v&&I>=.5*dt*x))return!1;const C=.1*Math.max(0,Ue(S).slope*this.direction);return(S[0].x-this.seed)*this.direction>C+ke?!1:this.sprintSpeed<=dt||x-Db>-ke&&Ue(S).slope*this.direction>=this.sprintSpeed}),g=f[0]??null;return g&&f.length>1&&Math.abs(f[1].x-g.x)<Dp?{next:p,confirmed:null}:{next:p,confirmed:g}}adopt(t,r){const i=ew(t.points);this.x=t.x,this.y=t.y,this.pts=r,this.provisional=[],this.watchTracks=[],this.rivalSeen=!1,this.nearer=[];const n=t.points.filter(a=>r-a.t<=Math.max(Np,this.decisionWindow())+ke);return this.velocity=this.sparse&&n.length>=2?Math.max(-1,Math.min(1,Ue(n).slope)):0,this.resumption=null,this.behindStart=!0,this.history=i.map(({t:a,x:s})=>({t:a,x:s})),this.updateVelocity(r),this.running=!0,this.backfill=i.slice(0,-1).map(a=>({pts:a.t,pose:a.p})),this.publishedFrom=i[0].t,t.points.at(-1).p}}function ew(e){const t=e.at(-1).t;let r=e.findIndex(n=>t-n.t<=qp+ke);r=Math.min(r,Math.max(0,e.length-3));const i=Ue(e.slice(r));for(;r>0;){const n=e[r-1],a=Math.max(0,t-qp-n.t);if(Math.abs(i.mx+i.slope*(n.t-i.mt)-n.x)>Vb+.5*Hb*a**2)break;r--}return e.slice(r)}const ba=4;class tw{constructor(t,r,i,n,a,s,o,l=!1,d=!1){this.source=t,this.model=r,this.watcher=i,this.liveWatch=l,this.fromBlocks=d,this.crop=document.createElement("canvas");const p=this.crop.getContext("2d");if(!p)throw new Error("映像処理を開始できません。");this.cc=p;const c=a===void 0||!(o>0)?0:_a*Math.abs(a-n)/o;this.tracker=new Jb(n,a===void 0?0:a-n,s,c,d)}source;model;watcher;liveWatch;fromBlocks;samples=[];tracker;sampleAt=new Map;crop;cc;top=0;bottom=1;analysed=0;get idle(){return this.tracker.idle}detect(t,r,i,n,a){return this.crop.width=512,this.crop.height=Math.round(512*r.h*a/(r.w*n)),this.cc.drawImage(this.source,r.x*n,r.y*a,r.w*n,r.h*a,0,0,this.crop.width,this.crop.height),t.estimate(this.crop,i.frameIndex,i.pts).landmarks.map(s=>s.map(o=>({...o,x:r.x+o.x*r.w,y:r.y+o.y*r.h})))}async process(t,r,i){this.analysed++;const n=this.tracker,a=this.samples,s={x:Math.max(0,Math.min(.64,n.expected(i.pts)-.18)),y:this.top,w:.36,h:this.bottom-this.top},o=this.detect(this.model,s,i,t,r),l=n.watchCentre(i.pts),d=l===null?null:{x:Math.max(0,Math.min(.64,l-.18)),y:0,w:.36,h:1};let p;d&&Math.abs(d.x-s.x)>.01&&(this.analysed%2===0||this.liveWatch&&n.watching)&&(p={poses:this.detect(await this.watcher(),d,i,t,r),view:[d.x,d.x+d.w]});const c=n.choose(o,i.pts,[s.x,s.x+s.w],p),f=n.takeRetraction();if(f!==null)for(let m=a.length-1;m>=0&&a[m].pts>=f;m--)a[m]=Hi([],a[m].frame,a[m].pts,t/r);const g=n.takeBackfill();for(const{pts:m,pose:_}of g){const v=this.sampleAt.get(m);v!==void 0&&(a[v]=Hi(_,a[v].frame,m,t/r))}if(g.length&&(this.top=0,this.bottom=1),c.length&&!this.fromBlocks){const m=c.filter($=>($.visibility??0)>=.3).map($=>$.y),_=Math.max(0,Math.min(...m)-.12),v=Math.min(1,Math.max(...m)+.12);v-_>.2&&(this.top=.8*this.top+.2*_,this.bottom=.8*this.bottom+.2*v)}return this.sampleAt.set(i.pts,a.length),a.push(Hi(c,i.frameIndex,i.pts,t/r)),c}}const Ym=2;class $i extends Error{constructor(t,r){super(`動画の読み出しに失敗しました（${t+1}コマ目：${r}）。もう一度お試しください。`),this.frame=t,this.reason=r}frame;reason}async function mi(e,t,r){try{return await it(e,t)}catch(i){throw t.aborted||i instanceof DOMException&&i.name==="AbortError"?i:new $i(r,i instanceof Error?i.message:String(i))}}const Zp=120,rw=30,Qm=240;async function Ya(e,t,r,i,n,a="standing",s=10,o={}){const l=()=>{if(r.aborted)throw new DOMException("中止","AbortError")};if(l(),!xr.isAvailable())throw new Error("このブラウザではフレーム解析ができません。対応する最新のブラウザでお試しください。");if(e.size>150*1024*1024)throw new Error("150MB以内のMP4 / MOVを選んでください。");i(0,"元動画のフレーム時刻を確認しています。");const d=await it(gi(e),r);if(l(),!d.frames.length||d.frames.length>3600||d.frames.at(-1).pts-d.frames[0].pts>30)throw new Error("1走分・30秒以内・3600フレーム以内の動画を選んでください。");const p=tc(d.videoTrack.matrix);let c=new xr(e,d.videoTrack,d.frames,d.rawSamples,d.descriptionBuffer);const f=new Jn("full",void 0,"CPU",ba);let g=o.watcher??null;const m=async()=>(g||(g=new Jn("full",void 0,"CPU",ba,"IMAGE"),await it(g.initialize(r),r),l()),g),_=document.createElement("canvas"),v=_.getContext("2d");if(!v)throw new Error("映像処理を開始できません。");const $=new tw(_,f,m,t,n,a,s,!1,o.fromBlocks),w=()=>c.dispose();r.addEventListener("abort",w,{once:!0});let S=performance.now(),x=-1/0;const I=d.frames.at(-1).pts-d.frames[0].pts,C=I>0?(d.frames.length-1)/I:Zp,z=Math.max(1,Math.round(C/(o.maxFps??Zp))),k=Math.max(z,Math.round(C/rw));let B=0,L=-1;try{await it(f.initialize(r,j=>i(0,j)),r),l();for(let j=0;;j++)try{for(const M of d.frames){if(o.to!==void 0&&M.pts>o.to)break;if(M.frameIndex<=L||M.frameIndex<B||o.from!==void 0&&M.pts<o.from){await mi(c.skipExactFrame(M.frameIndex),r,M.frameIndex),l();continue}const W=await mi(c.decodeExactFrame(M.frameIndex).then(V=>(r.aborted&&c.dispose(),V)),r,M.frameIndex);if(l(),B=M.frameIndex+z,W.status!=="SUCCESS"||W.actualDecodedFrameIndex!==M.frameIndex)throw new Error("動画フレームを正しく読み出せません。");const O=W.bitmap,N=p%180?O.height:O.width,G=p%180?O.width:O.height;(_.width!==N||_.height!==G)&&(_.width=N,_.height=G),v.setTransform(1,0,0,1,0,0),v.clearRect(0,0,N,G),v.translate(N/2,G/2),v.rotate(p*Math.PI/180),v.drawImage(O,-O.width/2,-O.height/2),v.setTransform(1,0,0,1,0,0);const Y=await $.process(N,G,M);o.onSelected?.(M,Y,N,G),o.afterSelected&&(await it(o.afterSelected(_),r),l()),L=M.frameIndex,$.idle&&(B=M.frameIndex+k);const P=performance.now();if(P-x>100){const V=o.from===void 0&&o.to===void 0?(M.frameIndex+1)/d.frames.length:(M.pts-(o.from??0))/Math.max(1e-6,Math.min(o.to??1/0,d.frames.at(-1).pts)-(o.from??0));i(Math.max(0,Math.min(1,V)),"選手と脚の動きを解析しています。"),x=P}P-S>32&&(await new Promise(V=>setTimeout(V,0)),S=performance.now(),l())}break}catch(M){if(!(M instanceof $i)||r.aborted||j>=Ym)throw M;i((L+1)/d.frames.length,"動画の読み出しをやり直しています。"),c.dispose(),c=new xr(e,d.videoTrack,d.frames,d.rawSamples,d.descriptionBuffer)}return i(1,"解析が終わりました。"),$.samples}finally{r.removeEventListener("abort",w),c.dispose(),f.dispose(),g!==o.watcher&&g?.dispose(),_.width=0}}const iw=30,nw=1,aw=3,sw=5;async function zw(e,t,r,i){const n=await it(gi(e),r);if((n.frames.length?n.frames.at(-1).pts-n.frames[0].pts:0)<=sw)return{...await Kn(e,t,r,i),window:null};const s=[];let o=0,l=0;await Ya(e,t,r,(c,f)=>i(.3*c,f==="選手と脚の動きを解析しています。"?"スタートの瞬間を探しています。":f),void 0,"standing",10,{maxFps:iw,fromBlocks:!0,onSelected:(c,f,g,m)=>{o=g,l=m,s.push({frame:c.frameIndex,pts:c.pts,pose:f.length===33?f.map(_=>({x:_.x,y:_.y,visibility:_.visibility})):null})}});const d=o?t_(s,o,l):null;if(d!==null){const c=[Math.max(0,d-nw),d+aw],f=await Kn(e,t,r,(g,m)=>i(.3+.7*g,m),c);if(!e_(f.frames,{width:f.width,height:f.height}).reason)return{...f,window:c}}return{...await Kn(e,t,r,(c,f)=>i(.3+.7*c,f)),window:null}}async function Kn(e,t,r,i,n){const a=[];let s=0,o=0,l=null;try{l=await it(Zm(r,d=>i(0,d)),r)}catch(d){if(r.aborted)throw d;l=null}return await Ya(e,t,r,i,void 0,"standing",10,{maxFps:Qm,fromBlocks:!0,from:n?.[0],to:n?.[1],onSelected:(d,p,c,f)=>{s=c,o=f,a.push({frame:d.frameIndex,pts:d.pts,pose:p.length===33?p.map(g=>({x:g.x,y:g.y,visibility:g.visibility})):null})},afterSelected:l?async d=>{const p=a.at(-1);p?.pose&&(p.refined=await l.refine(d,p.pose))}:void 0}),{frames:a,width:s,height:o,refiner:l?.backend??null}}const ow=1280;function Xn(e,t,r){return new Promise((i,n)=>{const a=()=>{clearTimeout(s),e.removeEventListener(t,a),i()},s=setTimeout(()=>{e.removeEventListener(t,a),n(new Error(`${t} timed out`))},r);e.addEventListener(t,a)})}async function uw(e,t=15e3){const r=document.createElement("video");r.muted=!0,r.playsInline=!0,r.preload="auto",r.style.cssText="position:fixed;left:-10000px;top:0;width:320px;height:180px;pointer-events:none",document.body.appendChild(r);try{const i=Xn(r,"loadedmetadata",t);if(r.src=e,r.load(),await i,r.readyState<2){const o=Xn(r,"loadeddata",t);await r.play().catch(()=>{}),r.pause(),r.readyState<2&&await o}if(r.currentTime>0){const o=Xn(r,"seeked",t);r.currentTime=0,await o}if(await new Promise(o=>requestAnimationFrame(()=>o())),!r.videoWidth||!r.videoHeight)return null;const n=Math.min(1,ow/r.videoWidth),a=document.createElement("canvas");a.width=Math.round(r.videoWidth*n),a.height=Math.round(r.videoHeight*n);const s=a.getContext("2d");return s?(s.drawImage(r,0,0,a.width,a.height),{image:a.toDataURL("image/jpeg",.85),width:r.videoWidth,height:r.videoHeight}):null}catch{return null}finally{r.pause(),r.removeAttribute("src"),r.load(),r.remove()}}function Aw(e){const[t,r]=Ee.useState(null);return Ee.useEffect(()=>{let i=!1;return r(null),e&&uw(e).then(n=>{i||r(n)}),()=>{i=!0}},[e]),t}function lw({video:e,url:t,disabled:r=!1}){const[i,n]=Ee.useState(!1),[a,s]=Ee.useState(0),[o,l]=Ee.useState(0);Ee.useEffect(()=>{const f=e.current;if(!f)return;const g=()=>{n(!f.paused&&!f.ended),s(f.currentTime),l(Number.isFinite(f.duration)?f.duration:0)},m=["play","pause","ended","timeupdate","seeked","loadedmetadata","durationchange","emptied"];for(const _ of m)f.addEventListener(_,g);return g(),()=>{for(const _ of m)f.removeEventListener(_,g)}},[e,t]);async function d(f){if(f.readyState>=2)return;const g=f.muted;f.muted=!0,await f.play().catch(()=>{}),f.pause(),f.muted=g}async function p(){const f=e.current;f&&(f.paused||f.ended?(f.ended&&(f.currentTime=0),await f.play().catch(()=>{})):f.pause())}async function c(f){const g=e.current;g&&(await d(g),g.currentTime=f,s(f))}return ce.jsxs("div",{className:"sprint10-playerbar",children:[ce.jsx("button",{type:"button","aria-label":i?"一時停止":"再生",disabled:r||!t,onClick:()=>{p()},children:i?"❚❚":"▶"}),ce.jsx("input",{type:"range","aria-label":"動画の位置",min:0,max:o||0,step:"any",value:Math.min(a,o||0),disabled:r||!o,onChange:f=>{c(Number(f.target.value))}}),ce.jsxs("span",{children:[a.toFixed(2)," / ",o.toFixed(2),"秒"]})]})}const Yp=e=>e!==null;function Mw(e){const t=[],r=(i,n,a,s)=>{if(!a)return;const o=a.frontSide,l=[a.trunkAngle===null?null:{kind:"trunk",label:"体幹",value:a.trunkAngle},a.frontKnee===null||o===null?null:{kind:"knee",side:o,label:"前膝",value:a.frontKnee},!s||a.rearKnee===null||o===null?null:{kind:"knee",side:1-o,label:"後膝",value:a.rearKnee}].filter(Yp);t.push({key:i,label:n,frame:a.frame,pts:a.pts,marks:l})};r("set","構え",e.set,!0),r("clearance","ブロックを離れる瞬間",e.blockClearance,!1);for(const i of e.steps){const n=e.contacts.find(s=>s.index===i.step);if(!n||n.touchdown===null||n.touchdownFrame===null)continue;const a=[i.shankAngle===null||i.side===null?null:{kind:"shank",side:i.side,label:"脛",value:i.shankAngle},i.trunkAngle===null?null:{kind:"trunk",label:"体幹",value:i.trunkAngle}].filter(Yp);t.push({key:`td${i.step}`,label:`${i.step}歩目の接地`,frame:n.touchdownFrame,pts:n.touchdown,marks:a})}return t}const Qa=e=>`${e.label} ${Math.round(e.value)}°`,dw=e=>e.kind==="trunk"?"#ffb02e":e.kind==="shank"?"#3ad7ff":e.kind==="thigh"?"#7dff6b":e.label==="後膝"||e.label.startsWith("踏切")?"#b58cff":"#ff6fd8",Jm=e=>!!e&&Number.isFinite(e.x)&&Number.isFinite(e.y)&&(e.visibility??1)>=.3;function pw(e,t,r,i,n=.35){const a=e.filter(m=>Jm(m)).map(m=>({x:m.x*t,y:m.y*r}));if(!a.length)return{x:0,y:0,w:t,h:r};const s=Math.min(...a.map(m=>m.x)),o=Math.max(...a.map(m=>m.x)),l=Math.min(...a.map(m=>m.y)),d=Math.max(...a.map(m=>m.y));let p=(o-s)*(1+2*n),c=(d-l)*(1+2*n);p/c<i?p=c*i:c=p/i,p=Math.min(p,t,r*i),c=p/i;const f=Math.max(0,Math.min(t-p,(s+o)/2-p/2)),g=Math.max(0,Math.min(r-c,(l+d)/2-c/2));return{x:f,y:g,w:p,h:c}}function eg(e,t,r,i,n,a){const s=p=>Jm(t[p])?r(t[p]):null;e.save(),e.lineCap="round",e.lineJoin="round",e.strokeStyle="rgba(255,255,255,.85)",e.lineWidth=n*.25;for(const[p,c]of Ho){const f=s(p),g=s(c);!f||!g||(e.beginPath(),e.moveTo(f.x,f.y),e.lineTo(g.x,g.y),e.stroke())}e.fillStyle="#ffffff";for(const p of new Set(Ho.flat())){const c=s(p);c&&(e.beginPath(),e.arc(c.x,c.y,n*.3,0,Math.PI*2),e.fill())}const o=(p,c)=>{const f=s(p),g=s(c);return f&&g?{x:(f.x+g.x)/2,y:(f.y+g.y)/2}:null},l=[],d=p=>l.every(c=>p.x+p.w<=c.x||c.x+c.w<=p.x||p.y+p.h<=c.y||c.y+c.h<=p.y);for(const p of i){const c=dw(p),[f,g,m]=p.kind==="trunk"?[o(23,24),o(11,12),null]:p.kind==="shank"?[s(27+p.side),s(25+p.side),null]:p.kind==="thigh"?[s(23+p.side),s(25+p.side),null]:[s(25+p.side),s(27+p.side),s(23+p.side)];if(!f||!g||p.kind==="knee"&&!m)continue;const _=Math.hypot(g.x-f.x,g.y-f.y),v=m??{x:f.x,y:f.y+(p.kind==="thigh"?_:-_)};e.strokeStyle=c,e.lineWidth=n*.7,e.beginPath(),e.moveTo(f.x,f.y),e.lineTo(g.x,g.y),m&&(e.moveTo(f.x,f.y),e.lineTo(m.x,m.y)),e.stroke(),p.kind!=="knee"&&(e.setLineDash([n*.8,n*.6]),e.lineWidth=n*.35,e.beginPath(),e.moveTo(f.x,f.y),e.lineTo(v.x,v.y),e.stroke(),e.setLineDash([]));const $=Math.atan2(v.y-f.y,v.x-f.x);let S=Math.atan2(g.y-f.y,g.x-f.x)-$;for(;S>Math.PI;)S-=2*Math.PI;for(;S<-Math.PI;)S+=2*Math.PI;const x=Math.max(n*2.2,Math.min(_*.35,n*5));if(e.lineWidth=n*.45,e.beginPath(),e.arc(f.x,f.y,x,$,$+S,S<0),e.stroke(),a){const I=$+S/2,C=Qa(p),z=n*1.8,k=n*.45;e.font=`700 ${z}px system-ui, sans-serif`,e.textBaseline="middle";const B=e.measureText(C).width,L=B+2*k,j=z+2*k,M=e.canvas.width,W=e.canvas.height,O=(q,ee)=>{const Q=Math.cos(I)*q,X=Math.sin(I)*q,be=f.x+Q*ee+(Q<-.3?-L:Q>.3?0:-L/2),ze=f.y+X*ee+(X<-.3?-j:X>.3?0:-j/2);return{x:Math.max(2,Math.min(M-L-2,be)),y:Math.max(2,Math.min(W-j-2,ze)),w:L,h:j}},N=O(1,x+n*1.4),G=O(-1,n*1.6),Y=p.kind==="knee"?[G,N]:[N,G],P=Y.find(d)??{...Y[0],y:Math.min(W-j-2,Math.max(...l.map(q=>q.y+q.h))+2)};l.push(P);const{x:V,y:Z}=P;e.fillStyle="rgba(8,18,16,.72)",e.beginPath(),e.roundRect?e.roundRect(V,Z,L,j,k):e.rect(V,Z,L,j),e.fill(),e.fillStyle=c,e.fillText(C,V+k,Z+j/2)}}e.restore()}const Yt=720,Zn=540,cw=3;function tg(e){const t=e.slice(1).map((r,i)=>r.pts-e[i].pts).filter(r=>r>0).sort((r,i)=>r-i);return t.length?t[t.length>>1]:1/240}const wa=(e,t)=>e+.5*t;function rg(e,t,r){return new Promise((i,n)=>{const a=()=>{clearTimeout(s),e.removeEventListener(t,a),i()},s=setTimeout(()=>{e.removeEventListener(t,a),n(new Error(`${t} timed out`))},r);e.addEventListener(t,a)})}async function hw(e,t){const r=rg(e,"seeked",8e3);e.currentTime=t,await r,await new Promise(i=>requestAnimationFrame(()=>i()))}function Ow({url:e,frames:t,phases:r,onShow:i,guides:n={},overlay:a}){const[s,o]=Ee.useState({}),[l,d]=Ee.useState(!1),p=Ee.useMemo(()=>tg(t),[t]);Ee.useEffect(()=>{let _=!1;o({}),d(!1);const v=document.createElement("video");return v.muted=!0,v.playsInline=!0,v.preload="auto",v.style.cssText="position:fixed;left:-10000px;top:0;width:320px;height:180px;pointer-events:none",document.body.appendChild(v),(async()=>{try{const $=rg(v,"loadeddata",2e4);v.src=e,v.load();const w=setTimeout(()=>{v.readyState<2&&v.play().then(()=>v.pause()).catch(()=>{})},1500);await $,clearTimeout(w);for(const S of r){const x=t.find(O=>O.frame===S.frame),I=x?bi(x):null;if(_)return;if(!I)continue;if(await hw(v,wa(S.pts,p)),_)return;const C=document.createElement("canvas");C.width=Yt,C.height=Zn;const z=C.getContext("2d");if(!z)throw new Error("no canvas");const k=v.videoWidth,B=v.videoHeight,L=pw(I,k,B,Yt/Zn),j=Yt/L.w;z.drawImage(v,L.x,L.y,L.w,L.h,0,0,Yt,Zn);const M=O=>({x:(O.x*k-L.x)*j,y:(O.y*B-L.y)*j});eg(z,I,M,S.marks,Yt/48,!0),a?.(S,z,M,Yt/48);const W=C.toDataURL("image/jpeg",.85);_||o(O=>({...O,[S.key]:W}))}}catch{_||d(!0)}})(),()=>{_=!0,v.pause(),v.removeAttribute("src"),v.load(),v.remove()}},[e,t,r,p,a]);const c=Ee.useRef(null),[f,g]=Ee.useState(0),m=_=>{const v=c.current;v?.clientWidth&&v.scrollTo({left:_*v.clientWidth,behavior:"smooth"}),g(_)};return ce.jsxs("div",{className:"sprint10-phase-view",children:[ce.jsx("div",{className:"sprint10-chips",role:"group","aria-label":"局面を選ぶ",children:r.map((_,v)=>ce.jsx("button",{type:"button","aria-pressed":f===v,"aria-label":_.label,onClick:()=>m(v),children:fw(_)},_.key))}),ce.jsx("ol",{ref:c,className:"sprint10-phases","aria-label":"局面ごとの姿勢",onScroll:_=>{const v=_.currentTarget;v.clientWidth&&g(Math.max(0,Math.min(r.length-1,Math.round(v.scrollLeft/v.clientWidth))))},children:r.map((_,v)=>ce.jsxs("li",{"aria-label":`${v+1}/${r.length} ${_.label}`,children:[ce.jsxs("div",{className:"sprint10-phase-head",children:[ce.jsxs("div",{children:[ce.jsx("strong",{children:_.label}),ce.jsxs("small",{children:[_.pts.toFixed(3),"秒"]})]}),ce.jsx("button",{type:"button","aria-label":`${_.label}をスロー再生で見る`,onClick:()=>i(_),children:"▶ スローで見る"})]}),s[_.key]?ce.jsx("img",{src:s[_.key],alt:`${_.label}の骨格と角度`}):ce.jsx("div",{className:"sprint10-phase-wait",children:l?"画像を作れませんでした":"画像を作成しています…"}),ce.jsx("p",{children:_.marks.length?_.marks.map(Qa).join(" · "):"角度を測れませんでした"}),n[_.key]&&ce.jsx("small",{className:"sprint10-guide",children:n[_.key]})]},_.key))})]})}const fw=e=>e.short??(e.key==="set"?"構え":e.key==="clearance"?"離れる":e.label.replace("の接地","")),mw=[["1/8",.125],["1/4",.25],["通常",1]];function Rw({url:e,video:t,frames:r,phases:i,events:n}){const a=Ee.useRef(null),[s,o]=Ee.useState(.125),[l,d]=Ee.useState(!0),[p,c]=Ee.useState(""),[f,g]=Ee.useState(-1),m=Ee.useRef(null),_=Ee.useMemo(()=>r.filter(S=>S.pose),[r]),v=Ee.useMemo(()=>tg(r),[r]);Ee.useEffect(()=>{const S=t.current;S&&(S.defaultPlaybackRate=s,S.playbackRate=s)},[t,s,e]),Ee.useEffect(()=>{const S=t.current,x=a.current,I=x?.getContext("2d");if(!S||!x||!I)return;let C=0,z=!1,k="",B=-1;const L=(N,G=-1)=>{N!==k&&(k=N,c(N)),G!==B&&(B=G,g(G))},j=()=>{I.clearRect(0,0,x.width,x.height),delete x.dataset.frame,L("")},M=N=>{if(S.seeking||!S.videoWidth){j();return}(x.width!==S.videoWidth||x.height!==S.videoHeight)&&(x.width=S.videoWidth,x.height=S.videoHeight),I.clearRect(0,0,x.width,x.height);const G=jo(_,N);if(!G||Math.abs(G.pts-N)>1.5*v){delete x.dataset.frame,L("");return}const Y=i.find(P=>Math.abs(P.pts-G.pts)<=(cw+.5)*v)??null;l&&eg(I,bi(G),P=>({x:P.x*x.width,y:P.y*x.height}),Y?.marks??[],x.width/110,!1),x.dataset.frame=String(G.frame),L(Y?`${Y.label}　${Y.marks.map(Qa).join(" · ")}`:"",n.findIndex(P=>Math.abs(P.pts-G.pts)<.5*v))},W=()=>M(S.currentTime),O=(N,G)=>{z||(M(G.mediaTime),C=S.requestVideoFrameCallback(O))};for(const N of["seeked","loadeddata","timeupdate","pause"])S.addEventListener(N,W);return S.addEventListener("seeking",j),W(),S.requestVideoFrameCallback&&(C=S.requestVideoFrameCallback(O)),()=>{z=!0,C&&S.cancelVideoFrameCallback(C);for(const N of["seeked","loadeddata","timeupdate","pause"])S.removeEventListener(N,W);S.removeEventListener("seeking",j),I.clearRect(0,0,x.width,x.height)}},[t,_,i,n,l,v,e]),Ee.useEffect(()=>{const S=m.current,x=S?.children[f];S&&x&&S.scrollTo({left:x.offsetLeft-(S.clientWidth-x.offsetWidth)/2,behavior:"smooth"})},[f]);function $(S){const x=t.current;if(!x||!_.length)return;x.pause();const I=jo(_,x.currentTime)??_[0],C=_.indexOf(I),z=_[Math.max(0,Math.min(_.length-1,C+S))];x.currentTime=wa(z.pts,v)}function w(S){const x=t.current;x&&(x.pause(),x.currentTime=wa(S,v))}return ce.jsxs(ce.Fragment,{children:[ce.jsxs("div",{className:"sprint10-player",children:[ce.jsx("video",{ref:t,src:e,playsInline:!0,muted:!0,preload:"auto"}),ce.jsx("canvas",{ref:a,className:"sprint10-replay-overlay","aria-label":"選手の骨格"}),ce.jsxs("label",{className:"sprint10-overlay-toggle",children:[ce.jsx("input",{type:"checkbox",checked:l,onChange:S=>d(S.target.checked)}),"骨格"]})]}),ce.jsx(lw,{video:t,url:e}),ce.jsx("p",{className:"sprint10-replay-caption","aria-live":"polite",children:p||" "}),ce.jsxs("div",{className:"sprint10-replay-controls",children:[ce.jsx("div",{className:"sprint10-seg",role:"group","aria-label":"再生の速さ",children:mw.map(([S,x])=>ce.jsx("button",{type:"button","aria-pressed":s===x,onClick:()=>o(x),children:S},S))}),ce.jsxs("div",{className:"sprint10-stepper",role:"group","aria-label":"1コマ送り",children:[ce.jsx("button",{type:"button","aria-label":"1コマ戻る",onClick:()=>$(-1),children:"◀"}),ce.jsx("span",{"aria-hidden":"true",children:"1コマ"}),ce.jsx("button",{type:"button","aria-label":"1コマ進む",onClick:()=>$(1),children:"▶"})]})]}),ce.jsx("div",{ref:m,className:"sprint10-events sprint10-chips",role:"group","aria-label":"判定した瞬間へ移動",children:n.map((S,x)=>ce.jsxs("button",{type:"button","aria-label":`${S.label} ${S.pts.toFixed(3)}秒`,"aria-pressed":f===x,onClick:()=>w(S.pts),children:[S.short,ce.jsx("small",{children:S.pts.toFixed(3)})]},`${S.label}${S.pts}`))})]})}const gw=24,yw=[0,.32,.64].map(e=>({x:e,y:0,w:.36,h:1})),Yn=[.2,2.5],_w=.1,bw=.08,ww=[11,12,23,24,25,26,27,28],Qp=.01,Qn=e=>({x:(e[23].x+e[24].x)/2,y:(e[23].y+e[24].y)/2});async function Jp(e,t,r,i){const n=()=>{if(t.aborted)throw new DOMException("中止","AbortError")},a=await it(gi(e),t);n();const s=tc(a.videoTrack.matrix);let o=new xr(e,a.videoTrack,a.frames,a.rawSamples,a.descriptionBuffer);const l=document.createElement("canvas"),d=l.getContext("2d");if(!d)throw new Error("映像処理を開始できません。");const p=()=>o.dispose();t.addEventListener("abort",p,{once:!0});const c=a.frames.reduce((g,m)=>r(m.frameIndex)?m.frameIndex:g,-1);let f=-1;try{for(let g=0;;g++)try{for(const m of a.frames){if(m.frameIndex>c)break;if(m.frameIndex<=f||!r(m.frameIndex)){await mi(o.skipExactFrame(m.frameIndex),t,m.frameIndex),n();continue}const _=await mi(o.decodeExactFrame(m.frameIndex),t,m.frameIndex);if(n(),_.status!=="SUCCESS"||_.actualDecodedFrameIndex!==m.frameIndex)throw new Error("動画フレームを正しく読み出せません。");const v=_.bitmap,$=s%180?v.height:v.width,w=s%180?v.width:v.height;(l.width!==$||l.height!==w)&&(l.width=$,l.height=w),d.setTransform(1,0,0,1,0,0),d.clearRect(0,0,$,w),d.translate($/2,w/2),d.rotate(s*Math.PI/180),d.drawImage(v,-v.width/2,-v.height/2),d.setTransform(1,0,0,1,0,0),await i(m,l,$,w),n(),f=m.frameIndex}break}catch(m){if(!(m instanceof $i)||t.aborted||g>=Ym)throw m;o.dispose(),o=new xr(e,a.videoTrack,a.frames,a.rawSamples,a.descriptionBuffer)}}finally{t.removeEventListener("abort",p),o.dispose(),l.width=0}return a.frames.length}function ec(e,t,r,i,n,a){const s=document.createElement("canvas"),o=s.getContext("2d");s.width=512,s.height=Math.round(512*r.h*a/(r.w*n)),o.drawImage(t,r.x*n,r.y*a,r.w*n,r.h*a,0,0,s.width,s.height);const l=e.estimate(s,i.frameIndex,i.pts).landmarks.map(d=>d.map(p=>({x:r.x+p.x*r.w,y:r.y+p.y*r.h,visibility:p.visibility})));return s.width=0,l.filter(d=>ww.every(p=>d[p]&&d[p].x>r.x+Qp&&d[p].x<r.x+r.w-Qp))}function $w(e){let t=0;for(let r=1;r<e.length;r++){const i=e[r].pts-e[r-1].pts;if(i>0)for(const n of e[r-1].people){const a=e[r].people.filter(s=>Math.abs(s.y-n.y)<.05).map(s=>(s.x-n.x)/i).filter(s=>Math.abs(s)>=Yn[0]&&Math.abs(s)<=Yn[1]).sort((s,o)=>Math.abs(s)-Math.abs(o));a.length&&(t+=a[0])}}return Math.abs(t)<Yn[0]?0:Math.sign(t)}async function Nw(e,t,r){const i=[];let n=0,a=0,s=0,o=null;const l=async(p,c)=>{try{return await c()}catch(f){throw f instanceof $i?new Error(`${p}の途中で、${f.message}`):f}},d=new Jn("full",void 0,"CPU",ba,"IMAGE");try{await it(d.initialize(t,M=>r(0,M)),t),r(0,"走る向きを確認しています。");const p=(await it(gi(e),t)).frames.length,c=Math.max(1,Math.floor(p/gw)),f=[];if(await l("走る向きの確認",()=>Jp(e,t,M=>M%c===0,async(M,W,O,N)=>{f.push({pts:M.pts,people:yw.flatMap(G=>ec(d,W,G,M,O,N)).map(Qn)}),r(.1*M.frameIndex/p,"走る向きを確認しています。")})),s=$w(f),!s)throw new Error("走っている選手を見つけられませんでした。選手が画面を横切る動画を使ってください。");await l("選手の追跡",()=>Ya(e,s>0?.03:.97,t,(M,W)=>r(.1+.6*M,W),s>0?.97:.03,"flying",10,{maxFps:Qm,watcher:d,onSelected:(M,W,O,N)=>{n=O,a=N,i.push({frame:M.frameIndex,pts:M.pts,pose:W.length===33?W.map(G=>({x:G.x,y:G.y,visibility:G.visibility})):null})}}));try{o=await it(Zm(t,M=>r(.7,M)),t)}catch(M){if(t.aborted)throw M;o=null}const g=i.filter(M=>M.pose);if(!g.length)return{frames:i,width:n,height:a,refiner:o?.backend??null,direction:s};const m=g[0],_=g.filter(M=>M.pts-m.pts<=_w).map(M=>({t:M.pts,...Qn(M.pose)})),v=_.reduce((M,W)=>M+W.t,0)/_.length,$=_.reduce((M,W)=>M+W.x,0)/_.length,w=_.reduce((M,W)=>M+(W.t-v)**2,0),S=w>0?_.reduce((M,W)=>M+(W.t-v)*(W.x-$),0)/w:0,x=g.slice(0,30).flatMap(M=>M.pose.filter(W=>(W.visibility??0)>=.3).map(W=>W.y)),I=Math.max(0,Math.min(...x)-.1),C=Math.min(1,Math.max(...x)+.1),z=M=>$+S*(M-v),k=new Map,B=new Map(g.map(M=>[M.frame,M])),L=g.at(-1).frame;r(.75,"踏切の前の動きを確認しています。"),await l("骨格の仕上げ",()=>Jp(e,t,M=>M<m.frame||!!o&&B.has(M),async(M,W,O,N)=>{if(M.frameIndex<m.frame){const G=z(M.pts);if(G<-.02||G>1.02)return;const Y={x:Math.max(0,Math.min(.64,G-.18)),y:I,w:.36,h:C-I},P=ec(d,W,Y,M,O,N).map(Z=>({p:Z,d:Math.abs(Qn(Z).x-G)})).filter(Z=>Z.d<bw).sort((Z,q)=>Z.d-q.d)[0]?.p;if(!P)return;const V={frame:M.frameIndex,pts:M.pts,pose:P.map(Z=>({x:Z.x,y:Z.y,visibility:Z.visibility??0}))};o&&(V.refined=await o.refine(W,V.pose)),k.set(M.frameIndex,V),r(.75+.05*M.frameIndex/m.frame,"踏切の前の動きを確認しています。")}else{const G=B.get(M.frameIndex);G.refined=await o.refine(W,G.pose),r(.8+.2*M.frameIndex/L,"骨格を細かく調べています。")}}));const j=new Map(i.map(M=>[M.frame,M]));for(const[M,W]of k)j.set(M,W);i.splice(0,i.length,...[...j.values()].sort((M,W)=>M.frame-W.frame))}finally{d.dispose()}return r(1,"解析が終わりました。"),{frames:i,width:n,height:a,refiner:o?.backend??null,direction:s}}export{bi as A,oc as B,Rw as C,Cy as D,pc as E,Kn as F,Ay as G,Dy as H,Py as I,Zo as J,Cw as K,Iw as L,Wy as M,Zm as N,$w as O,sc as P,Ly as Q,ba as S,ac as T,tw as a,Ew as b,My as c,e_ as d,Mw as e,tg as f,lw as g,Ow as h,wa as i,zw as j,qy as k,lc as l,Pt as m,cy as n,Ya as o,eu as p,Tw as q,Jp as r,i_ as s,Nw as t,Aw as u,Le as v,Oy as w,Ny as x,Ry as y,er as z};
