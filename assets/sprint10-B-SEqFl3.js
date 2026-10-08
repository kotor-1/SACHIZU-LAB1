import{r as ze,j as he}from"./index-Dn2GlPmr.js";import{P as Yo,n as Qo}from"./pose-drawing-sV1sb35o.js";import{S as Er,d as Sa,t as ac}from"./video-orientation-DNKyXU7h.js";import{d as wy,u as Tt,M as Jo}from"./session-lifecycle-L5Q7k18m.js";const Mw="sprint10-experimental-v10",$y=["歩数は、2本のラインの間に経過した脚の入れ替わり（遊脚が支持脚を追い越す動き）の周期の数です。ライン上の半端な1歩は周期の割合で数えます。接地回数を1つずつ数えた値ではありません。","各歩の距離は骨盤の画面内移動をライン間隔（既知の距離）で比例換算した推定です。真の全身重心・接地位置間の距離ではなく、遠近やカメラの揺れも補正していません。"],cn=e=>{const t=[...e].sort((r,n)=>r-n);return t.length?t[Math.floor(t.length/2)]:0};function vy(e){const t=n=>{const i=[...n].sort((s,o)=>s-o),a=Math.floor(i.length/2);return i.length?i.length%2?i[a]:(i[a-1]+i[a])/2:0},r=t(e);return t(e.filter(n=>n<=na[1]*r+ka))}const Vr=e=>!!e&&Number.isFinite(e.x)&&Number.isFinite(e.y)&&e.x>0&&e.x<1&&e.y>0&&e.y<1&&(e.visibility??0)>=.3,ka=1e-9,Oe=(e,t)=>e-t>ka;function Sn(e){const t=[];for(let r=1;r<e.length;r++)e[r].hipX!==null&&e[r-1].hipX!==null&&t.push(e[r].pts-e[r-1].pts);return Math.max(.05,2.5*(t.length?cn(t):0))}function sc(e,t=Sn(e)){return(r,n)=>!Oe(n.pts-r.pts,t)}const Gt=(e,t)=>t-e>ka,hn=.65,xy=.025,na=[.7,1.5];function Jn(e,t,r,n){const i=[23,24].every(o=>Vr(e[o])),a=[23,24,25,26,27,28].every(o=>Vr(e[o])),s=(o,u)=>Math.hypot((e[o].x-e[u].x)*n,e[o].y-e[u].y);return{frame:t,pts:r,hipX:i?(e[23].x+e[24].x)/2:null,hipY:i?(e[23].y+e[24].y)/2:null,ankleGap:[27,28].every(o=>Vr(e[o]))?Math.abs(e[27].x-e[28].x)*n:null,kneeGap:[25,26].every(o=>Vr(e[o]))?Math.abs(e[25].x-e[26].x)*n:null,legLength:a?(s(23,25)+s(25,27)+s(24,26)+s(26,28))/2:null}}function Sy(e,t,r,n=sc(e)){const i=[],a=e.filter(s=>s.hipX!==null);for(let s=1;s<a.length;s++){const o=a[s-1],u=a[s],d=(o.hipX-t)*r,p=(u.hipX-t)*r;if(d>0||p<=0||!n(o,u))continue;const c=a.some(m=>m.pts<=o.pts&&!Oe(o.pts-m.pts,.15)&&(m.hipX-t)*r<-.003),f=a.some(m=>m.pts>=u.pts&&!Oe(m.pts-u.pts,.15)&&(m.hipX-t)*r>.003);if(!c||!f)continue;const g=o.pts+-d/(p-d)*(u.pts-o.pts);(!i.length||Oe(g-i.at(-1).pts,.15))&&i.push({pts:g,before:o.pts,after:u.pts,frame:u.frame})}return i}function ky(e,t,r=Sn(e)){const n=t?e.filter(x=>!Gt(x.pts,t.startPts)&&!Oe(x.pts,t.finishPts)):e,i=cn(n.flatMap(x=>x.legLength!==null&&x.legLength>.01?[x.legLength]:[]));if(!i)return{events:[],gaps:[]};const s=(t?e.filter(x=>!Gt(x.pts,t.startPts-hn)&&!Oe(x.pts,t.finishPts+hn)):e).filter(x=>x.ankleGap!==null&&x.kneeGap!==null),o=x=>x.map(I=>({...I,value:cn(x.filter(E=>!Oe(Math.abs(E.pts-I.pts),xy)).map(E=>E.ankleGap/i))})),u=o(s),p=(t?o(n.filter(x=>x.ankleGap!==null&&x.kneeGap!==null)):u).map(x=>x.value).sort((x,I)=>x-I),c=p[Math.floor(p.length*.9)]??0;if(c<.2)return{events:[],gaps:[]};const f=c*.55,g=c*.3,m=[],_=[];let v=!1,w=null,$=null,S=[];for(const x of u){const I=$;if($&&Oe(x.pts-$.pts,r)&&(_.push([$.pts,x.pts]),v=!1,w=null,S=[]),$=x,!v){x.value>=(f+g)/2&&(v=!0);continue}if(x.value<=g&&(!w||x.value<w.value)?(w=x,S=[x]):w&&x.value===w.value&&S.at(-1)===I&&S.push(x),w&&x.value>=f){const z=s.filter(N=>!Oe(Math.abs(N.pts-w.pts),.06)).some(N=>N.kneeGap/i<.4),k=S[S.length-1>>1]??w;z&&(!m.length||!Gt(k.pts-m.at(-1).pts,.12))&&m.push({pts:k.pts,frame:k.frame}),w=null,S=[]}}return{events:m,gaps:_}}function Ty(e,t,r,n,i,a,s=10,o=Sn(e)){const u=[];for(let d=1;d<t.length;d++){const p=t[d-1],c=t[d],f=e.find(S=>S.frame===p.frame&&S.pts===p.pts),g=e.find(S=>S.frame===c.frame&&S.pts===c.pts),_=e.filter(S=>S.pts>=p.pts&&S.pts<=c.pts).filter(S=>S.hipX!==null&&Number.isFinite(S.hipX)&&S.ankleGap!==null&&S.kneeGap!==null).map(S=>S.pts),v=c.pts-p.pts;let w=null;Gt(p.pts,i)||Oe(c.pts,a)?w="区間外を含むため未算出":Gt(v,.12)||Oe(v,hn)?w="入れ替わり周期を確認できません":f?.hipX==null||g?.hipX==null||!Number.isFinite(f.hipX)||!Number.isFinite(g.hipX)?w="端点の骨盤位置がありません":(!_.length||Oe(_[0]-p.pts,o)||Oe(c.pts-_.at(-1),o)||_.some((S,x)=>x>0&&Oe(S-_[x-1],o)))&&(w="この区間の追跡が途切れています");const $=f?.hipX!=null&&g?.hipX!=null?s*(g.hipX-f.hipX)/(n-r):NaN;!w&&(!Number.isFinite($)||$<=0||$>10)&&(w="進行方向の移動距離を確認できません"),u.push({fromStep:d,toStep:d+1,fromPts:p.pts,toPts:c.pts,fromHipX:f?.hipX??null,toHipX:g?.hipX??null,distanceM:w?null:$,reason:w})}return u}const Iy={standing:{noFinish:"ゴール通過を確認できません。ゴールラインの位置と、ゴールを越えた後まで選手が映っているかを確認してください。",startGap:"スタートラインを越える瞬間の追跡が途切れています。スタート付近が隠れない位置から撮影してください。",noStart:"スタートラインより後ろにいる選手を確認できません。ラインを選手の立ち位置より少し後ろに置くか、走り出す前から映った動画を使ってください。"},flying:{noFinish:"出口の線の通過を確認できません。選手が出口の線を越えるまで動画が続いているか、出口の付近で選手が他の人と重なっていないか確認してください。",startGap:"入口の線を越える瞬間の追跡が途切れています。入口の付近で選手が他の人や物に隠れていないか確認してください。",noStart:"入口の線を越える選手を捉えられませんでした。入口の付近で選手が他の人と重なっている場合や、線を越えた後0.1秒以上、体が画面の外にかかっている場合は測れません。"}},Ey=.25,Cy=.1,oc=.2,zy=.08,Ay=.006;function uc(e){let t=e;for(let r=0;r<3;r++){if(t.length<3)return null;const n=t.reduce((p,c)=>p+c.pts,0)/t.length,i=t.reduce((p,c)=>p+c.hipX,0)/t.length,a=t.reduce((p,c)=>p+(c.pts-n)**2,0);if(!(a>0))return null;const s=t.reduce((p,c)=>p+(c.pts-n)*(c.hipX-i),0)/a,o=t.map(p=>Math.abs(p.hipX-(i+s*(p.pts-n)))),u=1.4826*cn(o),d=t.filter((p,c)=>o[c]<=Math.max(Ay,3*u));if(d.length===t.length||d.length<3||r===2)return{mt:n,mx:i,speed:s,used:t};t=d}return null}function eu(e,t,r,n){let i=n.pts;for(let a=0;a<3;a++){const s=uc(e.filter(d=>!Oe(Math.abs(d.pts-i),zy)));if(!s||!(s.speed*r>=oc)||s.used.length<5)return n;const o=s.mt+(t-s.mx)/s.speed;if(o<s.used[0].pts||o>s.used.at(-1).pts)return n;const u=Math.abs(o-i)<.001;if(i=o,u)break}return{...n,pts:i}}function tu(e,t,r,n,i,a){const s=n==="entry"?e:[...e].reverse(),o=[s[0]];for(const g of s.slice(1)){const[m,_]=n==="entry"?[o.at(-1),g]:[g,o.at(-1)];if(!a(m,_)||Oe(Math.abs(g.pts-o[0].pts),Ey))break;o.push(g)}if(o.length<3||Gt(Math.abs(o.at(-1).pts-o[0].pts),.05))return null;const u=uc(o);if(!u||!(u.speed*r>=oc))return null;const d=n==="entry"?u.used.reduce((g,m)=>m.pts<g.pts?m:g):u.used.reduce((g,m)=>m.pts>g.pts?m:g),p=u.mt+(t-u.mx)/u.speed,c=Math.abs(d.pts-p);return!((d.hipX-t)*r*(n==="entry"?1:-1)>0)||Oe(c,Cy)||p<i[0]||p>i[1]?null:n==="entry"?{pts:p,before:p,after:d.pts,frame:d.frame,extendedSeconds:c}:{pts:p,before:d.pts,after:p,frame:d.frame,extendedSeconds:c}}const My=.6;function Oy(e,t,r,n){const i=e.events.filter(w=>!Gt(w.pts,r-1)&&!Oe(w.pts,n+1)),a=w=>w.slice(1).map(($,S)=>$.pts-w[S].pts),s=vy(t.length>=3?a(t):a(i));if(!(s>0))return null;const o=[...t];let u=0;for(;;){const w=o.slice(1).map((I,E)=>I.pts-o[E].pts),$=w.reduce((I,E,z)=>E<w[I]?z:I,0);if(!w.length||w[$]>=My*s)break;const S=$>0?w[$-1]:1/0,x=$+1<w.length?w[$+1]:1/0;o.splice(Math.abs(S+w[$]-s)<Math.abs(x+w[$]-s)?$:$+1,1),u++}const d=o.slice(1).map((w,$)=>(w.pts-o[$].pts)/s),p=d.map(w=>w<=na[1]+1e-9?1:Math.max(2,Math.round(w))),c=d.some((w,$)=>p[$]>=2&&Math.abs(w-p[$])>.35);if(!o.length)return{count:(n-r)/s,steps:o,multiples:p,edges:null,estimatedEdges:[!1,!1],ambiguous:c,removed:u,cycle:s};const f=e.events.filter(w=>w.pts<=r).at(-1),g=e.events.find(w=>w.pts>=n),m=(w,$)=>{const S=w?Math.abs($.pts-w.pts):NaN;return w&&!Oe(S,hn)&&S/s<=na[1]&&!e.gaps.some(([I,E])=>I<Math.max($.pts,w.pts)&&E>Math.min($.pts,w.pts))?S:s},_=(o[0].pts-r)/m(f,o[0]),v=(n-o.at(-1).pts)/m(g,o.at(-1));return{count:p.reduce((w,$)=>w+$,0)+_+v,steps:o,multiples:p,edges:[_,v],estimatedEdges:[_>1+1e-9,v>1+1e-9],ambiguous:c,removed:u,cycle:s}}const Ry=.02;function Ny(e){const t=e.filter(n=>n.hipX!==null),r=new Set;for(const n of t){const i=t.filter(d=>d!==n&&!Oe(Math.abs(d.pts-n.pts),.1));if(i.length<4)continue;const a=i.reduce((d,p)=>d+p.pts,0)/i.length,s=i.reduce((d,p)=>d+p.hipX,0)/i.length,o=i.reduce((d,p)=>d+(p.pts-a)**2,0),u=o>0?i.reduce((d,p)=>d+(p.pts-a)*(p.hipX-s),0)/o:0;Math.abs(n.hipX-(s+u*(n.pts-a)))>Ry&&r.add(n)}return r.size?e.map(n=>r.has(n)?{...n,hipX:null}:n):e}function Ow(e,t,r,n=10,i="standing",a={}){const s=Iy[i],o={start:null,finish:null,duration:null,steps:[],count:null,speed:null,cadence:null,stride:null,edgeFractions:null,strideIntervals:[],warnings:[],reason:null};if(![t,r].every(L=>Number.isFinite(L)&&L>0&&L<1)||Math.abs(r-t)<.1)return{...o,reason:"スタートとゴールを離して設定してください。"};if(!e.length||e.some((L,X)=>!Number.isFinite(L.pts)||X>0&&L.pts<=e[X-1].pts))return{...o,reason:"動画の時刻を確認できません。"};const u=Math.sign(r-t),d=i==="flying"?Ny(e):e,p=d.filter(L=>L.hipX!==null),c=[e[0].pts,e.at(-1).pts],f=Sn(d),g=sc(d,f),m=Sy(d,r,u,g);if(!m.length&&i==="flying"){let L=p.length-1;for(;L>=0&&(p[L].hipX-r)*u>0;)L--;const X=L<0?null:tu(p.slice(0,L+1),r,u,"exit",c,g);X&&m.push(X)}if(!m.length)return{...o,reason:s.noFinish};let _=null,v=null,w=!1;for(const L of m){const X=p.filter(Se=>Se.pts<L.pts);let U=X.length-1;for(;U>=0&&(X[U].hipX-t)*u>0;)U--;if(U===X.length-1)continue;const ee=X[U],Z=X[U+1];if(U<0||!g(ee,Z)){const Se=i==="flying"?tu(X.slice(U+1),t,u,"entry",c,g):null;if(Se){_=Se,v=L;break}U>=0&&(w=!0);continue}const K=(ee.hipX-t)*u,xe=(Z.hipX-t)*u;_={pts:ee.pts+-K/(xe-K)*(Z.pts-ee.pts),before:ee.pts,after:Z.pts,frame:Z.frame},v=L;break}if(i==="flying"&&_&&v&&(_.extendedSeconds||(_=eu(p,t,u,_)),v.extendedSeconds||(v=eu(p,r,u,v))),!_||!v)return{...o,reason:w?s.startGap:s.noStart};const $={start:_,finish:v};if(a.start&&(_={..._,pts:_.pts+a.start,movedSeconds:a.start}),a.finish&&(v={...v,pts:v.pts+a.finish,movedSeconds:a.finish}),!(v.pts>_.pts))return{...o,reason:"線を越えるコマの順番が逆です。「確認」で決めたコマを見直してください。"};const S=v.pts-_.pts,x=m.filter(L=>L.pts>$.finish.pts+1),I=ky(e,{startPts:$.start.pts,finishPts:$.finish.pts},f),E=_.extendedSeconds?_.after:_.pts,z=v.extendedSeconds?v.before:v.pts,k=e.filter(L=>L.pts>=E&&L.pts<=z),N=k.filter(L=>L.ankleGap!==null&&L.kneeGap!==null).length/Math.max(1,k.length),O=[E,...k.filter(L=>L.ankleGap!==null&&L.kneeGap!==null).map(L=>L.pts),z],F=N<.9||I.gaps.some(([L,X])=>L<z&&X>E)||O.some((L,X)=>X>0&&Oe(L-O[X-1],f)),q=I.events.filter(L=>L.pts>_.pts&&L.pts<v.pts),H=Oy(I,q,_.pts,v.pts),M=H?.count??null,B=[...$y];if(!H)B.unshift("脚の入れ替わりを2回以上捉えられなかったため、歩数・ピッチ・歩幅を出せません。");else{const L=[];H.removed&&L.push(`入れ替わりの誤検出と思われるもの（${H.removed}回）を除いて数えました。`),H.steps.length||L.push(`区間内の入れ替わりを捉えられなかったため、歩数は周期（${H.cycle.toFixed(3)}秒）から推定しました。`);const X=H.multiples.reduce((U,ee)=>U+ee-1,0);X===1?L.push("脚の入れ替わりを1回見逃した区間があり、周期の長さから2歩分として数えました。"):X>1&&L.push(`脚の入れ替わりを${X}回見逃した区間があり、周期の長さから数えました。`),H.estimatedEdges[0]&&L.push(`入口の直後の入れ替わりが映っていないため、その部分は周期（${H.cycle.toFixed(3)}秒）から推定しました。`),H.estimatedEdges[1]&&L.push(`出口の直前の入れ替わりが映っていないため、その部分は周期（${H.cycle.toFixed(3)}秒）から推定しました。`),H.ambiguous&&L.push("1歩分とも2歩分とも決めにくい周期があり、歩数が1歩ずれている可能性があります。"),F&&!X&&!H.estimatedEdges.some(Boolean)&&L.push("脚が映っていない時間がありますが、その前後の入れ替わりの間隔は通常の周期でした。"),B.unshift(...L)}x.length&&B.unshift("ゴールを2回以上越えています。最初の走りを解析しました。");const G=(L,X,U)=>`${L}の線を越える瞬間の骨盤は映っていない（体が画面の端にかかる・隠れる）ため、${U}の動きを${Math.round(X.extendedSeconds*1e3)}ミリ秒延ばして通過時刻を推定しました。`;v.extendedSeconds&&!v.movedSeconds&&B.unshift(G("出口",v,"直前")),_.extendedSeconds&&!_.movedSeconds&&B.unshift(G("入口",_,"直後"));const J=H?.steps??q,Y=H?.multiples??[];return{...o,start:_,finish:v,duration:S,speed:n/S,steps:J,count:M,edgeFractions:H?.edges??null,strideIntervals:Ty(e,J,t,r,_.pts,v.pts,n,f).map((L,X)=>(Y[X]??1)>1?{...L,distanceM:null,reason:`入れ替わりの見逃しで${Y[X]}歩分の区間です`}:L),cadence:M===null?null:M/S,stride:M===null?null:n/M,warnings:B}}const lc=[31,32],qe=(e,t=.5)=>!!e&&Number.isFinite(e.x)&&Number.isFinite(e.y)&&(e.visibility??1)>=t,qt=e=>{const t=[...e].sort((r,n)=>r-n);return t.length?t[t.length>>1]:NaN},ar=(e,t)=>{const r=[...e].sort((n,i)=>n-i);return r.length?r[Math.min(r.length-1,Math.floor(t*r.length))]:NaN},By=.02,dc=.05,pc=.1,cc=.03,Dy=.03,Py=.06,Uy=.4,Ly=.03,qy=.05;function kn(e,t,r){return ar(e.flatMap(n=>[[23,27],[24,28]].flatMap(([i,a])=>qe(n.pose[i])&&qe(n.pose[a])?[Math.hypot((n.pose[i].x-n.pose[a].x)*t,(n.pose[i].y-n.pose[a].y)*r)]:[])),.9)}const Wy=(e,t,r)=>e.flatMap(n=>lc.filter(i=>qe(n.pose[i])).map(i=>({t:n.pts,frame:n.frame,x:n.pose[i].x*t,y:n.pose[i].y*r}))),Fy=(e,t)=>e.filter(r=>e.some(n=>n!==r&&Math.abs(n.t-r.t)<=By&&Math.abs(n.t-r.t)>0&&Math.hypot(n.x-r.x,n.y-r.y)<dc*t));function Gy(e,t){const r=[];for(const n of e){const i=r.find(a=>Math.abs(a.x-n.x)<pc*t&&n.t-a.to<=cc);i?(i.toes.push(n),i.to=Math.max(i.to,n.t),i.x=qt(i.toes.map(a=>a.x))):r.push({x:n.x,y:n.y,from:n.t,to:n.t,toes:[n]})}for(const n of r)n.y=ar(n.toes.map(i=>i.y),.8);return r.filter(n=>n.to-n.from>=Dy)}function Vy(e,t){const r=[];for(const n of[...e].sort((i,a)=>i.from-a.from)){const i=r.find(a=>Math.abs(a.x-n.x)<pc*t);i?(i.toes.push(...n.toes),i.from=Math.min(i.from,n.from),i.to=Math.max(i.to,n.to),i.x=qt(i.toes.map(a=>a.x)),i.y=ar(i.toes.map(a=>a.y),.8)):r.push({...n,toes:[...n.toes]})}return r}function Hy(e,t,r,n=1/0){const i=[];for(const a of Vy(e,t).filter(s=>s.to-s.from>=Py).sort((s,o)=>s.from-o.from)){const s=i.at(-1);if((!s||(a.x-s.x)*r>Uy*t)&&i.push(a),i.length===n)break}return i}function jy(e,t,r,n,i,a=-1/0){const s=r.filter(c=>Math.abs(c.x-e.x)<dc*2*n&&c.t>=e.from-.1&&c.t<=e.to+.1).sort((c,f)=>c.t-f.t),o=s.find(c=>e.y-c.y<Ly*n)??null,u=[...s].reverse().find(c=>e.y-c.y<qy*n)??null,d=u===null||i-u.t<.02,p=o===null||o.t-a<.02;return{index:t,x:e.x,groundY:e.y,touchdown:p?null:o.t,touchdownFrame:p?null:o.frame,toeOff:d?null:u.t,toeOffFrame:d?null:u.frame}}const Ky=.45,ia=.38,Tn=e=>e*180/Math.PI;function hc(e,t,r){const n=lc.map(i=>qe(e[i],.3)?Math.abs(e[i].x-t)*r:1/0);return n[0]===1/0&&n[1]===1/0?null:n[0]<=n[1]?0:1}function fc(e,t,r,n,i){if(![11,12,23,24].every(d=>qe(e[d],.3)))return null;const a=(e[11].x+e[12].x)/2*t,s=(e[11].y+e[12].y)/2*r,o=(e[23].x+e[24].x)/2*t,u=(e[23].y+e[24].y)/2*r;return Math.hypot(a-o,s-u)<Ky*i?null:Tn(Math.atan2((a-o)*n,u-s))}function Xy(e,t,r,n,i){const a=e[25+t],s=e[27+t];return!qe(a,.3)||!qe(s,.3)?null:Tn(Math.atan2((a.x-s.x)*r*i,(s.y-a.y)*n))}function Rw(e,t,r,n,i,a){const s=e[23+t],o=e[25+t];if(!qe(s,.3)||!qe(o,.3))return null;const u=(o.x-s.x)*r*i,d=(o.y-s.y)*n;return Math.hypot(u,d)<ia*a?null:Tn(Math.atan2(u,d))}function ru(e,t,r,n,i){const[a,s,o]=[e[23+t],e[25+t],e[27+t]];if(![a,s,o].every(c=>qe(c,.3)))return null;const u={x:(a.x-s.x)*r,y:(a.y-s.y)*n},d={x:(o.x-s.x)*r,y:(o.y-s.y)*n};if(Math.hypot(u.x,u.y)<ia*i||Math.hypot(d.x,d.y)<ia*i)return null;const p=(u.x*d.x+u.y*d.y)/(Math.hypot(u.x,u.y)*Math.hypot(d.x,d.y));return Tn(Math.acos(Math.max(-1,Math.min(1,p))))}const Zy="crouch-start-v2-experimental",Yy=5,In=e=>e.refined??e.pose,nu=.06,iu=.15,Qy=.05,Jy=.1,mc=.2,e_=.5,t_=.3,r_=.3,n_=2,i_=.8,au=.2,a_=.1,s_=.1,o_={gap:Qy,leave:s_};function gc(e,t){const r={version:Zy,reason:null,direction:0,set:null,blockClearance:null,blocks:null,contacts:[],steps:[],firstFlight:null,notes:[]},n=W=>({...r,reason:W}),{width:i,height:a}=t,s=e.filter(W=>W.pose);if(s.length<20)return n("選手を十分に捉えられませんでした。真横から、全身が映るように撮影してください。");const o=W=>({x:W.x*i,y:W.y*a}),u=W=>qe(W[23],.3)&&qe(W[24],.3)?o({x:(W[23].x+W[24].x)/2,y:(W[23].y+W[24].y)/2}):null,d=kn(s,i,a);if(!(d>0))return n("脚を十分に捉えられませんでした。");const p=s.flatMap(W=>{const pe=u(W.pose);return pe?[{t:W.pts,frame:W.frame,...pe}]:[]}),c=Math.sign(p.at(-1).x-p[0].x);if(!c)return n("走る向きを確認できませんでした。");r.direction=c;const f=l_(p,d,c),g=p.slice(f),m=qt(g.slice(0,Math.max(3,Math.round((f?g.length:p.length)*.05))).map(W=>W.x)),_=g.findIndex((W,pe)=>(W.x-m)*c>nu*d&&g.slice(pe,pe+10).every(me=>(me.x-m)*c>nu*d));if(_<0)return n("走り出しを確認できませんでした。");const v=g[_].t,w=f?g[0].t:-1/0;if(v-g[0].t<Jy)return n("スタートの構えを確認できませんでした。構えから映っている動画を使ってください。");const $=Wy(s,i,a),S=Fy($,d),x=Gy(S,d),I=S.filter(W=>W.t>=w&&W.t<v);if(I.length<4)return n("スタートの構え（ブロック上の足）を確認できませんでした。構えから映っている動画を使ってください。");const E=W=>W*c,z=[ar(I.map(W=>E(W.x)),.05)-iu*d,ar(I.map(W=>E(W.x)),.95)+iu*d],k=W=>E(W.x)>=z[0]&&E(W.x)<=z[1],N=S.filter(W=>W.t>=v&&k(W)).sort((W,pe)=>W.t-pe.t),O=N.filter(W=>W.t<=v+.15),F=O.length?ar(O.map(W=>E(W.x)),.75):z[1];let q=v;const H=o_;s.map(W=>W.pts);const M=$,B=(W,pe)=>pe-W;qt(s.slice(1).map((W,pe)=>W.pts-s[pe].pts).filter(W=>W>0))||1/240;for(const W of M.filter(pe=>pe.t>=v).sort((pe,me)=>pe.t-me.t)){const pe=E(W.x)-F;if(!(pe<-.12*d||pe>H.leave*d)){if(B(q,W.t)>H.gap)break;q=W.t}}const G=N.filter(W=>W.t>=q-.05),J=G.length?qt(G.map(W=>W.x)):c>0?z[1]/c:z[0]/c,Y=I.filter(W=>(J-W.x)*c>.15*d);r.blocks={front:J/i,rear:Y.length?qt(Y.map(W=>W.x))/i:null};const L={x:J},X=Hy(x.filter(W=>W.from>q-cc&&E(W.x)>z[1]+.2*d),d,c,Yy),U=s.at(-1).pts;r.contacts=X.map((W,pe)=>jy(W,pe+1,$,d,U));const ee=s.filter(W=>W.pts<v&&W.pts>=v-mc),Z=s.findIndex(W=>W.pts>=q),K=Z<0?[]:s.slice(Math.max(0,Z-2),Z+3);r.set=ee.length?aa(ee,L.x/i,i,a,c,d):null,r.blockClearance=K.length?aa(K,L.x/i,i,a,c,d,s[Z]):null;const xe=r.contacts[0];r.firstFlight=xe?.touchdown!=null?xe.touchdown-q:null,r.steps=_c(r.contacts,e,i,a,c,d),r.contacts.length||r.notes.push("ブロックを離れた後の接地が映っていません。");const Se=r.contacts.filter(W=>W.toeOff===null).map(W=>W.index);return Se.length&&r.notes.push(`${Se.join("・")}歩目は離地が映っていないため、接地時間を出していません。`),r}function yc(e,t,r){for(let n=0;n<e.length;n++)for(let i=n+1;i<e.length&&e[i].t-e[n].t<=i_;i++)if((e[i].x-e[n].x)*r>=n_*t)return n;return-1}function u_(e,t,r){const n=e.filter(u=>u.pose),i=kn(n,t,r),a=n.flatMap(u=>{const d=u.pose;return qe(d[23],.3)&&qe(d[24],.3)?[{t:u.pts,x:(d[23].x+d[24].x)/2*t}]:[]});if(a.length<2||!(i>0))return null;const s=Math.sign(a.at(-1).x-a[0].x),o=s?yc(a,i,s):-1;return o<0?null:a[o].t}function l_(e,t,r){const n=yc(e,t,r);if(n<0)return 0;let i=-1;for(let s=n;s>=0&&i<0;s--){const o=e.filter(d=>d.t<=e[s].t&&d.t>=e[s].t-au),u=o.map(d=>d.x);o.length>=3&&o.at(-1).t-o[0].t>=au/2&&Math.max(...u)-Math.min(...u)<a_*t&&(i=e.indexOf(o[0]))}if(i<0)return 0;let a=0;for(let s=1,o=0;s<=i;s++){for(e[s].t-e[s-1].t>e_&&(a=s);e[s].t-e[o].t>r_;)o++;for(let u=o;u<s;u++)if(Math.abs(e[s].x-e[u].x)>t_*t){a=s+1;break}}return Math.min(a,i)}function _c(e,t,r,n,i,a){return e.map((s,o)=>{const u=e[o+1]??null,d=s.touchdown!==null&&s.toeOff!==null?s.toeOff-s.touchdown:null,p=u?.touchdown!=null&&s.toeOff!==null?u.touchdown-s.toeOff:null,c=u?.touchdown!=null&&s.touchdown!==null?u.touchdown-s.touchdown:null,f=s.touchdownFrame!==null?t.find(_=>_.frame===s.touchdownFrame):null,g=f?In(f):null,m=g?hc(g,s.x/r,r):null;return{step:s.index,contactSeconds:d,flightSeconds:p,stepSeconds:c,pitch:c?1/c:null,shankAngle:g&&m!==null?Xy(g,m,r,n,i):null,trunkAngle:g?fc(g,r,n,i,a):null,side:m}})}function aa(e,t,r,n,i,a,s){const o=_=>{const v=In(_),w=hc(v,t,r);return{side:w,trunk:fc(v,r,n,i,a),front:w===null?null:ru(v,w,r,n,a),rear:w===null?null:ru(v,1-w,r,n,a)}},u=e.map(o),d=_=>{const v=u.flatMap(w=>w[_]===null?[]:[w[_]]);return v.length*2>=e.length?qt(v):null},p=d("trunk"),c=d("front"),f=d("rear"),g=_=>[[_.trunk,p],[_.front,c],[_.rear,f]].reduce((v,[w,$])=>$===null?v:w===null?1/0:v+Math.abs(w-$),0),m=s??e[u.reduce((_,v,w)=>g(v)<g(u[_])?w:_,u.length-1)];return{frame:m.frame,pts:m.pts,trunkAngle:p,frontKnee:c,rearKnee:f,frontSide:o(m).side}}const su=e=>e!==null;function Nw(e){const t=[],r=(n,i,a,s)=>{if(!a)return;const o=a.frontSide,u=[a.trunkAngle===null?null:{kind:"trunk",label:"体幹",value:a.trunkAngle},a.frontKnee===null||o===null?null:{kind:"knee",side:o,label:"前膝",value:a.frontKnee},!s||a.rearKnee===null||o===null?null:{kind:"knee",side:1-o,label:"後膝",value:a.rearKnee}].filter(su);t.push({key:n,label:i,frame:a.frame,pts:a.pts,marks:u})};r("set","構え",e.set,!0),r("clearance","ブロックを離れる瞬間",e.blockClearance,!1);for(const n of e.steps){const i=e.contacts.find(s=>s.index===n.step);if(!i||i.touchdown===null||i.touchdownFrame===null)continue;const a=[n.shankAngle===null||n.side===null?null:{kind:"shank",side:n.side,label:"脛",value:n.shankAngle},n.trunkAngle===null?null:{kind:"trunk",label:"体幹",value:n.trunkAngle}].filter(su);t.push({key:`td${n.step}`,label:`${n.step}歩目の接地`,frame:i.touchdownFrame,pts:i.touchdown,marks:a})}return t}const Ta=e=>`${e.label} ${Math.round(e.value)}°`,d_=e=>e.kind==="trunk"?"#ffb02e":e.kind==="shank"?"#3ad7ff":e.kind==="thigh"?"#7dff6b":e.label==="後膝"||e.label.startsWith("踏切")?"#b58cff":"#ff6fd8",bc=e=>!!e&&Number.isFinite(e.x)&&Number.isFinite(e.y)&&(e.visibility??1)>=.3;function p_(e,t,r,n,i=.35){const a=e.filter(m=>bc(m)).map(m=>({x:m.x*t,y:m.y*r}));if(!a.length)return{x:0,y:0,w:t,h:r};const s=Math.min(...a.map(m=>m.x)),o=Math.max(...a.map(m=>m.x)),u=Math.min(...a.map(m=>m.y)),d=Math.max(...a.map(m=>m.y));let p=(o-s)*(1+2*i),c=(d-u)*(1+2*i);p/c<n?p=c*n:c=p/n,p=Math.min(p,t,r*n),c=p/n;const f=Math.max(0,Math.min(t-p,(s+o)/2-p/2)),g=Math.max(0,Math.min(r-c,(u+d)/2-c/2));return{x:f,y:g,w:p,h:c}}function wc(e,t,r,n,i,a){const s=p=>bc(t[p])?r(t[p]):null;e.save(),e.lineCap="round",e.lineJoin="round",e.strokeStyle="rgba(255,255,255,.85)",e.lineWidth=i*.25;for(const[p,c]of Yo){const f=s(p),g=s(c);!f||!g||(e.beginPath(),e.moveTo(f.x,f.y),e.lineTo(g.x,g.y),e.stroke())}e.fillStyle="#ffffff";for(const p of new Set(Yo.flat())){const c=s(p);c&&(e.beginPath(),e.arc(c.x,c.y,i*.3,0,Math.PI*2),e.fill())}const o=(p,c)=>{const f=s(p),g=s(c);return f&&g?{x:(f.x+g.x)/2,y:(f.y+g.y)/2}:null},u=[],d=p=>u.every(c=>p.x+p.w<=c.x||c.x+c.w<=p.x||p.y+p.h<=c.y||c.y+c.h<=p.y);for(const p of n){const c=d_(p),[f,g,m]=p.kind==="trunk"?[o(23,24),o(11,12),null]:p.kind==="shank"?[s(27+p.side),s(25+p.side),null]:p.kind==="thigh"?[s(23+p.side),s(25+p.side),null]:[s(25+p.side),s(27+p.side),s(23+p.side)];if(!f||!g||p.kind==="knee"&&!m)continue;const _=Math.hypot(g.x-f.x,g.y-f.y),v=m??{x:f.x,y:f.y+(p.kind==="thigh"?_:-_)};e.strokeStyle=c,e.lineWidth=i*.7,e.beginPath(),e.moveTo(f.x,f.y),e.lineTo(g.x,g.y),m&&(e.moveTo(f.x,f.y),e.lineTo(m.x,m.y)),e.stroke(),p.kind!=="knee"&&(e.setLineDash([i*.8,i*.6]),e.lineWidth=i*.35,e.beginPath(),e.moveTo(f.x,f.y),e.lineTo(v.x,v.y),e.stroke(),e.setLineDash([]));const w=Math.atan2(v.y-f.y,v.x-f.x);let S=Math.atan2(g.y-f.y,g.x-f.x)-w;for(;S>Math.PI;)S-=2*Math.PI;for(;S<-Math.PI;)S+=2*Math.PI;const x=Math.max(i*2.2,Math.min(_*.35,i*5));if(e.lineWidth=i*.45,e.beginPath(),e.arc(f.x,f.y,x,w,w+S,S<0),e.stroke(),a){const I=w+S/2,E=Ta(p),z=i*1.8,k=i*.45;e.font=`700 ${z}px system-ui, sans-serif`,e.textBaseline="middle";const N=e.measureText(E).width,O=N+2*k,F=z+2*k,q=e.canvas.width,H=e.canvas.height,M=(U,ee)=>{const Z=Math.cos(I)*U,K=Math.sin(I)*U,xe=f.x+Z*ee+(Z<-.3?-O:Z>.3?0:-O/2),Se=f.y+K*ee+(K<-.3?-F:K>.3?0:-F/2);return{x:Math.max(2,Math.min(q-O-2,xe)),y:Math.max(2,Math.min(H-F-2,Se)),w:O,h:F}},B=M(1,x+i*1.4),G=M(-1,i*1.6),J=p.kind==="knee"?[G,B]:[B,G],Y=J.find(d)??{...J[0],y:Math.min(H-F-2,Math.max(...u.map(U=>U.y+U.h))+2)};u.push(Y);const{x:L,y:X}=Y;e.fillStyle="rgba(8,18,16,.72)",e.beginPath(),e.roundRect?e.roundRect(L,X,O,F,k):e.rect(L,X,O,F),e.fill(),e.fillStyle=c,e.fillText(E,L+k,X+F/2)}}e.restore()}function c_({video:e,url:t,disabled:r=!1}){const[n,i]=ze.useState(!1),[a,s]=ze.useState(0),[o,u]=ze.useState(0);ze.useEffect(()=>{const f=e.current;if(!f)return;const g=()=>{i(!f.paused&&!f.ended),s(f.currentTime),u(Number.isFinite(f.duration)?f.duration:0)},m=["play","pause","ended","timeupdate","seeked","loadedmetadata","durationchange","emptied"];for(const _ of m)f.addEventListener(_,g);return g(),()=>{for(const _ of m)f.removeEventListener(_,g)}},[e,t]);async function d(f){if(f.readyState>=2)return;const g=f.muted;f.muted=!0,await f.play().catch(()=>{}),f.pause(),f.muted=g}async function p(){const f=e.current;f&&(f.paused||f.ended?(f.ended&&(f.currentTime=0),await f.play().catch(()=>{})):f.pause())}async function c(f){const g=e.current;g&&(await d(g),g.currentTime=f,s(f))}return he.jsxs("div",{className:"sprint10-playerbar",children:[he.jsx("button",{type:"button","aria-label":n?"一時停止":"再生",disabled:r||!t,onClick:()=>{p()},children:n?"❚❚":"▶"}),he.jsx("input",{type:"range","aria-label":"動画の位置",min:0,max:o||0,step:"any",value:Math.min(a,o||0),disabled:r||!o,onChange:f=>{c(Number(f.target.value))}}),he.jsxs("span",{children:[a.toFixed(2)," / ",o.toFixed(2),"秒"]})]})}const er=720,ei=540,h_=3;function $c(e){const t=e.slice(1).map((r,n)=>r.pts-e[n].pts).filter(r=>r>0).sort((r,n)=>r-n);return t.length?t[t.length>>1]:1/240}const sa=(e,t)=>e+.5*t;function vc(e,t,r){return new Promise((n,i)=>{const a=()=>{clearTimeout(s),e.removeEventListener(t,a),n()},s=setTimeout(()=>{e.removeEventListener(t,a),i(new Error(`${t} timed out`))},r);e.addEventListener(t,a)})}async function f_(e,t){const r=vc(e,"seeked",8e3);e.currentTime=t,await r,await new Promise(n=>requestAnimationFrame(()=>n()))}function Bw({url:e,frames:t,phases:r,onShow:n,guides:i={},overlay:a}){const[s,o]=ze.useState({}),[u,d]=ze.useState(!1),p=ze.useMemo(()=>$c(t),[t]);ze.useEffect(()=>{let _=!1;o({}),d(!1);const v=document.createElement("video");return v.muted=!0,v.playsInline=!0,v.preload="auto",v.style.cssText="position:fixed;left:-10000px;top:0;width:320px;height:180px;pointer-events:none",document.body.appendChild(v),(async()=>{try{const w=vc(v,"loadeddata",2e4);v.src=e,v.load();const $=setTimeout(()=>{v.readyState<2&&v.play().then(()=>v.pause()).catch(()=>{})},1500);await w,clearTimeout($);for(const S of r){const x=t.find(M=>M.frame===S.frame),I=x?In(x):null;if(_)return;if(!I)continue;if(await f_(v,sa(S.pts,p)),_)return;const E=document.createElement("canvas");E.width=er,E.height=ei;const z=E.getContext("2d");if(!z)throw new Error("no canvas");const k=v.videoWidth,N=v.videoHeight,O=p_(I,k,N,er/ei),F=er/O.w;z.drawImage(v,O.x,O.y,O.w,O.h,0,0,er,ei);const q=M=>({x:(M.x*k-O.x)*F,y:(M.y*N-O.y)*F});wc(z,I,q,S.marks,er/48,!0),a?.(S,z,q,er/48);const H=E.toDataURL("image/jpeg",.85);_||o(M=>({...M,[S.key]:H}))}}catch{_||d(!0)}})(),()=>{_=!0,v.pause(),v.removeAttribute("src"),v.load(),v.remove()}},[e,t,r,p,a]);const c=ze.useRef(null),[f,g]=ze.useState(0),m=_=>{const v=c.current;v?.clientWidth&&v.scrollTo({left:_*v.clientWidth,behavior:"smooth"}),g(_)};return he.jsxs("div",{className:"sprint10-phase-view",children:[he.jsx("div",{className:"sprint10-chips",role:"group","aria-label":"局面を選ぶ",children:r.map((_,v)=>he.jsx("button",{type:"button","aria-pressed":f===v,"aria-label":_.label,onClick:()=>m(v),children:m_(_)},_.key))}),he.jsx("ol",{ref:c,className:"sprint10-phases","aria-label":"局面ごとの姿勢",onScroll:_=>{const v=_.currentTarget;v.clientWidth&&g(Math.max(0,Math.min(r.length-1,Math.round(v.scrollLeft/v.clientWidth))))},children:r.map((_,v)=>he.jsxs("li",{"aria-label":`${v+1}/${r.length} ${_.label}`,children:[he.jsxs("div",{className:"sprint10-phase-head",children:[he.jsxs("div",{children:[he.jsx("strong",{children:_.label}),he.jsxs("small",{children:[_.pts.toFixed(3),"秒"]})]}),he.jsx("button",{type:"button","aria-label":`${_.label}をスロー再生で見る`,onClick:()=>n(_),children:"▶ スローで見る"})]}),s[_.key]?he.jsx("img",{src:s[_.key],alt:`${_.label}の骨格と角度`}):he.jsx("div",{className:"sprint10-phase-wait",children:u?"画像を作れませんでした":"画像を作成しています…"}),he.jsx("p",{children:_.marks.length?_.marks.map(Ta).join(" · "):"角度を測れませんでした"}),i[_.key]&&he.jsx("small",{className:"sprint10-guide",children:i[_.key]})]},_.key))})]})}const m_=e=>e.short??(e.key==="set"?"構え":e.key==="clearance"?"離れる":e.label.replace("の接地","")),g_=[["1/8",.125],["1/4",.25],["通常",1]];function Dw({url:e,video:t,frames:r,phases:n,events:i}){const a=ze.useRef(null),[s,o]=ze.useState(.125),[u,d]=ze.useState(!0),[p,c]=ze.useState(""),[f,g]=ze.useState(-1),m=ze.useRef(null),_=ze.useMemo(()=>r.filter(S=>S.pose),[r]),v=ze.useMemo(()=>$c(r),[r]);ze.useEffect(()=>{const S=t.current;S&&(S.defaultPlaybackRate=s,S.playbackRate=s)},[t,s,e]),ze.useEffect(()=>{const S=t.current,x=a.current,I=x?.getContext("2d");if(!S||!x||!I)return;let E=0,z=!1,k="",N=-1;const O=(B,G=-1)=>{B!==k&&(k=B,c(B)),G!==N&&(N=G,g(G))},F=()=>{I.clearRect(0,0,x.width,x.height),delete x.dataset.frame,O("")},q=B=>{if(S.seeking||!S.videoWidth){F();return}(x.width!==S.videoWidth||x.height!==S.videoHeight)&&(x.width=S.videoWidth,x.height=S.videoHeight),I.clearRect(0,0,x.width,x.height);const G=Qo(_,B);if(!G||Math.abs(G.pts-B)>1.5*v){delete x.dataset.frame,O("");return}const J=n.find(Y=>Math.abs(Y.pts-G.pts)<=(h_+.5)*v)??null;u&&wc(I,In(G),Y=>({x:Y.x*x.width,y:Y.y*x.height}),J?.marks??[],x.width/110,!1),x.dataset.frame=String(G.frame),O(J?`${J.label}　${J.marks.map(Ta).join(" · ")}`:"",i.findIndex(Y=>Math.abs(Y.pts-G.pts)<.5*v))},H=()=>q(S.currentTime),M=(B,G)=>{z||(q(G.mediaTime),E=S.requestVideoFrameCallback(M))};for(const B of["seeked","loadeddata","timeupdate","pause"])S.addEventListener(B,H);return S.addEventListener("seeking",F),H(),S.requestVideoFrameCallback&&(E=S.requestVideoFrameCallback(M)),()=>{z=!0,E&&S.cancelVideoFrameCallback(E);for(const B of["seeked","loadeddata","timeupdate","pause"])S.removeEventListener(B,H);S.removeEventListener("seeking",F),I.clearRect(0,0,x.width,x.height)}},[t,_,n,i,u,v,e]),ze.useEffect(()=>{const S=m.current,x=S?.children[f];S&&x&&S.scrollTo({left:x.offsetLeft-(S.clientWidth-x.offsetWidth)/2,behavior:"smooth"})},[f]);function w(S){const x=t.current;if(!x||!_.length)return;x.pause();const I=Qo(_,x.currentTime)??_[0],E=_.indexOf(I),z=_[Math.max(0,Math.min(_.length-1,E+S))];x.currentTime=sa(z.pts,v)}function $(S){const x=t.current;x&&(x.pause(),x.currentTime=sa(S,v))}return he.jsxs(he.Fragment,{children:[he.jsxs("div",{className:"sprint10-player",children:[he.jsx("video",{ref:t,src:e,playsInline:!0,muted:!0,preload:"auto"}),he.jsx("canvas",{ref:a,className:"sprint10-replay-overlay","aria-label":"選手の骨格"}),he.jsxs("label",{className:"sprint10-overlay-toggle",children:[he.jsx("input",{type:"checkbox",checked:u,onChange:S=>d(S.target.checked)}),"骨格"]})]}),he.jsx(c_,{video:t,url:e}),he.jsx("p",{className:"sprint10-replay-caption","aria-live":"polite",children:p||" "}),he.jsxs("div",{className:"sprint10-replay-controls",children:[he.jsx("div",{className:"sprint10-seg",role:"group","aria-label":"再生の速さ",children:g_.map(([S,x])=>he.jsx("button",{type:"button","aria-pressed":s===x,onClick:()=>o(x),children:S},S))}),he.jsxs("div",{className:"sprint10-stepper",role:"group","aria-label":"1コマ送り",children:[he.jsx("button",{type:"button","aria-label":"1コマ戻る",onClick:()=>w(-1),children:"◀"}),he.jsx("span",{"aria-hidden":"true",children:"1コマ"}),he.jsx("button",{type:"button","aria-label":"1コマ進む",onClick:()=>w(1),children:"▶"})]})]}),he.jsx("div",{ref:m,className:"sprint10-events sprint10-chips",role:"group","aria-label":"判定した瞬間へ移動",children:i.map((S,x)=>he.jsxs("button",{type:"button","aria-label":`${S.label} ${S.pts.toFixed(3)}秒`,"aria-pressed":f===x,onClick:()=>$(S.pts),children:[S.short,he.jsx("small",{children:S.pts.toFixed(3)})]},`${S.label}${S.pts}`))})]})}const ou=32,xc={DIFF:24,NOISE:4,MIN_PIXELS:8,STANDING:.7,BARE:.35,FAR:15,TD_AT:.5,TO_AT:.5,TOE_W:.16,TOE_H:.08,TOE_BACK:.03,TOE_UP:.02,TO_W:.08,TO_H:.04,TO_BACK:-.01,TO_UP:.005,BLOCK_W:.35,BLOCK_H:.18,BLOCK_BACK:.12,BLOCK_UP:.06,BC_TIP_W:.1,BC_TIP_H:.05,BC_TIP_BACK:-.01,BC_TIP_UP:.01,BC_TIP_FAR:12},ce=xc;function Sc(e,t,r,n){const i=kn(t.filter(p=>p.pose),r,n),a=e.direction||1,s=Math.max(0,...t.map(p=>p.frame)),o=[],u=(p,c)=>({from:Math.max(0,p-ou),to:Math.min(s,c+ou)}),d=y_(e,t,r,n);e.blockClearance&&d&&o.push({key:"bc",...u(e.blockClearance.frame,e.blockClearance.frame),tip:{cx:d.x-a*ce.BC_TIP_BACK*i,cy:d.y-ce.BC_TIP_UP*i,w:ce.BC_TIP_W*i,h:ce.BC_TIP_H*i},main:{cx:d.x-a*ce.BLOCK_BACK*i,cy:d.y-ce.BLOCK_UP*i,w:ce.BLOCK_W*i,h:ce.BLOCK_H*i}});for(const p of e.contacts)p.touchdownFrame!==null&&o.push({key:`c${p.index}`,...u(p.touchdownFrame,p.toeOffFrame??p.touchdownFrame),main:{cx:p.x-a*ce.TOE_BACK*i,cy:p.groundY-ce.TOE_UP*i,w:ce.TOE_W*i,h:ce.TOE_H*i},tip:{cx:p.x-a*ce.TO_BACK*i,cy:p.groundY-ce.TO_UP*i,w:ce.TO_W*i,h:ce.TO_H*i}});return o}function Pw(e,t,r,n){return e.reason?[]:Sc(e,t,r,n).map(i=>{const a=[i.main,...i.tip?[i.tip]:[]],s=Math.min(...a.map(f=>Math.round(f.cx-f.w/2)))-1,o=Math.min(...a.map(f=>Math.round(f.cy-f.h/2)))-1,u=Math.max(...a.map(f=>Math.round(f.cx+f.w/2)))+1,d=Math.max(...a.map(f=>Math.round(f.cy+f.h/2)))+1,p=Math.max(0,s),c=Math.max(0,o);return{key:i.key,from:i.from,to:i.to,x:p,y:c,w:Math.max(1,Math.min(r,u)-p),h:Math.max(1,Math.min(n,d)-c)}})}function Uw(e,t,r,n,i,a){if(e.reason||!r.length)return{result:e,moments:[]};const s=n.filter(E=>E.pose),o=kn(s,i,a),u=e.direction||1,d=[],p=__(n),c=Sc(e,n,i,a),f=E=>c.find(z=>z.key===E),g=r.find(E=>E.key==="bc"),m=f("bc");let _=e.blockClearance,v=null;if(g&&m&&e.blockClearance){const E=t.get("bc"),z=Hr(g,m.main),k=E?w_(E,g,z,e.blockClearance.frame,m.tip?Hr(g,m.tip):null):null;if(d.push({key:"clearance",frame:k?.at??null,fromPixels:!!k,share:k?.share??null}),k){const N=Math.floor(k.at),O=s.findIndex(F=>F.frame>=N);O>=0&&(_=aa(s.slice(Math.max(0,O-2),O+3),e.blocks.front,i,a,u,o,s[O]),v=p(k.at))}}const w=e.contacts.map(E=>{const z=r.find(q=>q.key===`c${E.index}`),k=t.get(`c${E.index}`),N=f(`c${E.index}`);if(!z||!k||!N?.tip||E.touchdownFrame===null)return d.push({key:`td${E.index}`,frame:null,fromPixels:!1,share:null}),E.toeOffFrame!=null&&d.push({key:`to${E.index}`,frame:null,fromPixels:!1,share:null}),E;const O=b_(k,z,Hr(z,N.main),Hr(z,N.tip),E.touchdownFrame,E.toeOffFrame??null);d.push({key:`td${E.index}`,frame:O.td?.at??null,fromPixels:!!O.td,share:O.tdShare}),E.toeOffFrame!=null&&d.push({key:`to${E.index}`,frame:O.to?.at??null,fromPixels:!!O.to,share:O.toShare});const F={...E};return O.td&&(F.touchdown=p(O.td.at),F.touchdownFrame=Math.ceil(O.td.at)),O.to&&E.toeOff!==null&&(F.toeOff=p(O.to.at),F.toeOffFrame=Math.floor(O.to.at)),F}),$=_c(w,n,i,a,u,o),S=w[0]?.touchdown??null,x=v??e.blockClearance?.pts??null,I=S!==null&&x!==null?S-x:e.firstFlight;return{result:{...e,contacts:w,steps:$,blockClearance:_,firstFlight:I},moments:d}}function y_(e,t,r,n){if(!e.blockClearance||!e.blocks)return null;const i=t.find(u=>u.frame===e.blockClearance.frame),a=i?.pose;if(!a)return null;const o=[a[31],a[32]].filter(u=>u&&Number.isFinite(u.x)&&Number.isFinite(u.y)).reduce((u,d)=>!u||Math.abs(d.x-e.blocks.front)<Math.abs(u.x-e.blocks.front)?d:u,null);return o?{x:e.blocks.front*r,y:o.y*n}:null}function __(e){const t=[...e].sort((i,a)=>i.frame-a.frame),r=t.slice(1).map((i,a)=>(i.pts-t[a].pts)/Math.max(1,i.frame-t[a].frame)).filter(i=>i>0).sort((i,a)=>i-a),n=r.length?r[r.length>>1]:1/240;return i=>{const a=t.findIndex(u=>u.frame>i);if(a<=0){const u=a===0?t[0]:t.at(-1);return u.pts+(i-u.frame)*n}const s=t[a-1],o=t[a];return s.pts+(i-s.frame)/(o.frame-s.frame)*(o.pts-s.pts)}}function Hr(e,{cx:t,cy:r,w:n,h:i}){const a=Math.max(0,Math.round(t-n/2)-e.x),s=Math.max(0,Math.round(r-i/2)-e.y);return{x0:a,y0:s,x1:Math.min(e.w,Math.max(a+1,Math.round(t+n/2)-e.x)),y1:Math.min(e.h,Math.max(s+1,Math.round(r+i/2)-e.y))}}const Ia=e=>{const t=[...e].sort((r,n)=>r-n);return t[t.length>>1]};function rt(e,t,r,n,i){const a=[];for(let u=Math.round(n);u<=Math.round(i);u++){const d=e.get(u);d&&a.push(d)}if(a.length<3)return null;const s=r.x1-r.x0,o=new Float32Array(s*(r.y1-r.y0)*3);for(let u=r.y0;u<r.y1;u++)for(let d=r.x0;d<r.x1;d++)for(let p=0;p<3;p++){const c=(u*t.w+d)*3+p;o[((u-r.y0)*s+d-r.x0)*3+p]=Ia(a.map(f=>f[c]))}return o}function fn(e,t,r,n,i){const a=[];for(let s=Math.round(n)+1;s<=Math.round(i);s++){const o=e.get(s),u=e.get(s-1);if(!(!o||!u))for(let d=r.y0;d<r.y1;d++)for(let p=r.x0;p<r.x1;p++){const c=(d*t.w+p)*3;a.push(Math.abs(o[c]-u[c])+Math.abs(o[c+1]-u[c+1])+Math.abs(o[c+2]-u[c+2]))}}return a.length?Ia(a):0}function Wt(e,t,r,n,i,a){const s=r.x1-r.x0,o=[],u=Math.max(ce.DIFF,ce.NOISE*a);for(let p=r.y0;p<r.y1;p++)for(let c=r.x0;c<r.x1;c++){const f=((p-r.y0)*s+c-r.x0)*3;Math.abs(n[f]-i[f])+Math.abs(n[f+1]-i[f+1])+Math.abs(n[f+2]-i[f+2])>u&&o.push((p*t.w+c)*3,f)}if(o.length/2<ce.MIN_PIXELS)return null;const d=new Map;for(const[p,c]of e){let f=0;for(let g=0;g<o.length;g+=2){const m=o[g],_=o[g+1],v=Math.abs(c[m]-n[_])+Math.abs(c[m+1]-n[_+1])+Math.abs(c[m+2]-n[_+2]),w=Math.abs(c[m]-i[_])+Math.abs(c[m+1]-i[_+1])+Math.abs(c[m+2]-i[_+2]);v<w&&f++}d.set(p,f/(o.length/2))}return d}const It=(e,t,r)=>{const n=[];for(let i=Math.round(t);i<=Math.round(r);i++){const a=e.get(i);a!==void 0&&n.push(a)}return n.length?Ia(n):NaN};function Ft(e,t,r,n=.5){let i=Math.round(t);if(!((e.get(i)??0)>=n))return null;for(;(e.get(i+r)??-1)>=n;)i+=r;const a=e.get(i),s=e.get(i+r);return s===void 0?null:i+r*(a-n)/(a-s)}function b_(e,t,r,n,i,a){const s=a??Math.max(...e.keys())-8,o=(i+s)/2,u=rt(e,t,r,i-30,i-20),d=rt(e,t,r,o-3,o+3),p=fn(e,t,r,i-30,i-20),c={td:null,to:null,tdShare:null,toShare:null};if(!u||!d)return c;const f=Wt(e,t,r,d,u,p),g=f?Ft(f,o,-1,ce.TD_AT):null,m=a===null?null:rt(e,t,n,a+20,a+30),_=rt(e,t,n,o-3,o+3),v=fn(e,t,n,i-30,i-20),w=m&&_?Wt(e,t,n,_,m,v):null,$=w?Ft(w,o,1,ce.TO_AT):null,S=g===null?null:rt(e,t,r,g+2,g+6),x=$===null?null:rt(e,t,n,$-6,$-2),I=S?Wt(e,t,r,S,u,p):null,E=x&&m?Wt(e,t,n,x,m,v):null,z=I&&g!==null?Ft(I,g+4,-1,ce.TD_AT):null,k=E&&$!==null?Ft(E,$-4,1,ce.TO_AT):null,N=I&&z!==null&&Math.abs(z-i)<=ce.FAR&&It(I,z+2,z+6)>=ce.STANDING&&It(I,z-12,z-5)<=ce.BARE,O=E&&k!==null&&a!==null&&Math.abs(k-a)<=ce.FAR&&It(E,k-6,k-2)>=ce.STANDING&&It(E,k+5,k+12)<=ce.BARE,F=N&&O&&k-z<10;return{td:N&&!F?{at:z}:null,to:O&&!F?{at:k}:null,tdShare:I,toShare:E}}function w_(e,t,r,n,i=null){const a=rt(e,t,r,n-12,n-4),s=rt(e,t,r,n+20,n+30),o=fn(e,t,r,n+20,n+30);if(!a||!s)return null;const u=Wt(e,t,r,a,s,o),d=u?Ft(u,n-8,1,ce.TO_AT):null,p=d===null?null:rt(e,t,r,d-6,d-2),c=p?Wt(e,t,r,p,s,o):null,f=c&&d!==null?Ft(c,d-4,1,ce.TO_AT):null;if(!c||f===null||Math.abs(f-n)>ce.FAR||It(c,f-6,f-2)<ce.STANDING||It(c,f+5,f+12)>ce.BARE)return null;if(i){const g=rt(e,t,i,f-4,f),m=rt(e,t,i,n+20,n+30),_=fn(e,t,i,n+20,n+30),v=g&&m?Wt(e,t,i,g,m,_):null,w=v?Ft(v,f-2,1,ce.TO_AT):null;if(v&&w!==null&&w>=f-1&&w-f<=ce.BC_TIP_FAR&&It(v,w-6,w-2)>=ce.STANDING&&It(v,w+5,w+12)<=ce.BARE)return{at:w,share:v}}return{at:f,share:c}}var Ea=Object.defineProperty,$_=Object.getOwnPropertyDescriptor,v_=Object.getOwnPropertyNames,x_=Object.prototype.hasOwnProperty,S_=(e=>typeof require<"u"?require:typeof Proxy<"u"?new Proxy(e,{get:(t,r)=>(typeof require<"u"?require:t)[r]}):e)(function(e){if(typeof require<"u")return require.apply(this,arguments);throw Error('Dynamic require of "'+e+'" is not supported')}),V=(e,t)=>()=>(e&&(t=e(e=0)),t),ur=(e,t)=>{for(var r in t)Ea(e,r,{get:t[r],enumerable:!0})},k_=(e,t,r,n)=>{if(t&&typeof t=="object"||typeof t=="function")for(let i of v_(t))!x_.call(e,i)&&i!==r&&Ea(e,i,{get:()=>t[i],enumerable:!(n=$_(t,i))||n.enumerable});return e},zr=e=>k_(Ea({},"__esModule",{value:!0}),e),hr,xt,nr,uu,kc,Tc=V(()=>{hr=new Map,xt=[],nr=(e,t,r)=>{if(t&&typeof t.init=="function"&&typeof t.createInferenceSessionHandler=="function"){let n=hr.get(e);if(n===void 0)hr.set(e,{backend:t,priority:r});else{if(n.priority>r)return;if(n.priority===r&&n.backend!==t)throw new Error(`cannot register backend "${e}" using priority ${r}`)}if(r>=0){let i=xt.indexOf(e);i!==-1&&xt.splice(i,1);for(let a=0;a<xt.length;a++)if(hr.get(xt[a]).priority<=r){xt.splice(a,0,e);return}xt.push(e)}return}throw new TypeError("not a valid backend")},uu=async e=>{let t=hr.get(e);if(!t)return"backend not found.";if(t.initialized)return t.backend;if(t.aborted)return t.error;{let r=!!t.initPromise;try{return r||(t.initPromise=t.backend.init(e)),await t.initPromise,t.initialized=!0,t.backend}catch(n){return r||(t.error=`${n}`,t.aborted=!0),t.error}finally{delete t.initPromise}}},kc=async e=>{let t=e.executionProviders||[],r=t.map(u=>typeof u=="string"?u:u.name),n=r.length===0?xt:r,i,a=[],s=new Set;for(let u of n){let d=await uu(u);typeof d=="string"?a.push({name:u,err:d}):(i||(i=d),i===d&&s.add(u))}if(!i)throw new Error(`no available backend found. ERR: ${a.map(u=>`[${u.name}] ${u.err}`).join(", ")}`);for(let{name:u,err:d}of a)r.includes(u)&&console.warn(`removing requested execution provider "${u}" from session options because it is not available: ${d}`);let o=t.filter(u=>s.has(typeof u=="string"?u:u.name));return[i,new Proxy(e,{get:(u,d)=>d==="executionProviders"?o:Reflect.get(u,d)})]}}),T_=V(()=>{Tc()}),Ic,I_=V(()=>{Ic="1.27.0"}),ti,Ne,Ec=V(()=>{I_(),ti="warning",Ne={wasm:{},webgl:{},webgpu:{},versions:{common:Ic},set logLevel(e){if(e!==void 0){if(typeof e!="string"||["verbose","info","warning","error","fatal"].indexOf(e)===-1)throw new Error(`Unsupported logging level: ${e}`);ti=e}},get logLevel(){return ti}},Object.defineProperty(Ne,"logLevel",{enumerable:!0})}),$e,E_=V(()=>{Ec(),$e=Ne}),Cc,zc,C_=V(()=>{Cc=(e,t)=>{let r=typeof document<"u"?document.createElement("canvas"):new OffscreenCanvas(1,1);r.width=e.dims[3],r.height=e.dims[2];let n=r.getContext("2d");if(n!=null){let i,a;t?.tensorLayout!==void 0&&t.tensorLayout==="NHWC"?(i=e.dims[2],a=e.dims[3]):(i=e.dims[3],a=e.dims[2]);let s=t?.format!==void 0?t.format:"RGB",o=t?.norm,u,d;o===void 0||o.mean===void 0?u=[255,255,255,255]:typeof o.mean=="number"?u=[o.mean,o.mean,o.mean,o.mean]:(u=[o.mean[0],o.mean[1],o.mean[2],0],o.mean[3]!==void 0&&(u[3]=o.mean[3])),o===void 0||o.bias===void 0?d=[0,0,0,0]:typeof o.bias=="number"?d=[o.bias,o.bias,o.bias,o.bias]:(d=[o.bias[0],o.bias[1],o.bias[2],0],o.bias[3]!==void 0&&(d[3]=o.bias[3]));let p=a*i,c=0,f=p,g=p*2,m=-1;s==="RGBA"?(c=0,f=p,g=p*2,m=p*3):s==="RGB"?(c=0,f=p,g=p*2):s==="RBG"&&(c=0,g=p,f=p*2);for(let _=0;_<a;_++)for(let v=0;v<i;v++){let w=(e.data[c++]-d[0])*u[0],$=(e.data[f++]-d[1])*u[1],S=(e.data[g++]-d[2])*u[2],x=m===-1?255:(e.data[m++]-d[3])*u[3];n.fillStyle="rgba("+w+","+$+","+S+","+x+")",n.fillRect(v,_,1,1)}if("toDataURL"in r)return r.toDataURL();throw new Error("toDataURL is not supported")}else throw new Error("Can not access image data")},zc=(e,t)=>{let r=typeof document<"u"?document.createElement("canvas").getContext("2d"):new OffscreenCanvas(1,1).getContext("2d"),n;if(r!=null){let i,a,s;t?.tensorLayout!==void 0&&t.tensorLayout==="NHWC"?(i=e.dims[2],a=e.dims[1],s=e.dims[3]):(i=e.dims[3],a=e.dims[2],s=e.dims[1]);let o=t!==void 0&&t.format!==void 0?t.format:"RGB",u=t?.norm,d,p;u===void 0||u.mean===void 0?d=[255,255,255,255]:typeof u.mean=="number"?d=[u.mean,u.mean,u.mean,u.mean]:(d=[u.mean[0],u.mean[1],u.mean[2],255],u.mean[3]!==void 0&&(d[3]=u.mean[3])),u===void 0||u.bias===void 0?p=[0,0,0,0]:typeof u.bias=="number"?p=[u.bias,u.bias,u.bias,u.bias]:(p=[u.bias[0],u.bias[1],u.bias[2],0],u.bias[3]!==void 0&&(p[3]=u.bias[3]));let c=a*i;if(t!==void 0&&(t.format!==void 0&&s===4&&t.format!=="RGBA"||s===3&&t.format!=="RGB"&&t.format!=="BGR"))throw new Error("Tensor format doesn't match input tensor dims");let f=4,g=0,m=1,_=2,v=3,w=0,$=c,S=c*2,x=-1;o==="RGBA"?(w=0,$=c,S=c*2,x=c*3):o==="RGB"?(w=0,$=c,S=c*2):o==="RBG"&&(w=0,S=c,$=c*2),n=r.createImageData(i,a);for(let I=0;I<a*i;g+=f,m+=f,_+=f,v+=f,I++)n.data[g]=(e.data[w++]-p[0])*d[0],n.data[m]=(e.data[$++]-p[1])*d[1],n.data[_]=(e.data[S++]-p[2])*d[2],n.data[v]=x===-1?255:(e.data[x++]-p[3])*d[3]}else throw new Error("Can not access image data");return n}}),jr,Ac,Mc,Oc,Rc,Nc,z_=V(()=>{Ca(),jr=(e,t)=>{if(e===void 0)throw new Error("Image buffer must be defined");if(t.height===void 0||t.width===void 0)throw new Error("Image height and width must be defined");if(t.tensorLayout==="NHWC")throw new Error("NHWC Tensor layout is not supported yet");let{height:r,width:n}=t,i=t.norm??{mean:255,bias:0},a,s;typeof i.mean=="number"?a=[i.mean,i.mean,i.mean,i.mean]:a=[i.mean[0],i.mean[1],i.mean[2],i.mean[3]??255],typeof i.bias=="number"?s=[i.bias,i.bias,i.bias,i.bias]:s=[i.bias[0],i.bias[1],i.bias[2],i.bias[3]??0];let o=t.format!==void 0?t.format:"RGBA",u=t.tensorFormat!==void 0&&t.tensorFormat!==void 0?t.tensorFormat:"RGB",d=r*n,p=u==="RGBA"?new Float32Array(d*4):new Float32Array(d*3),c=4,f=0,g=1,m=2,_=3,v=0,w=d,$=d*2,S=-1;o==="RGB"&&(c=3,f=0,g=1,m=2,_=-1),u==="RGBA"?S=d*3:u==="RBG"?(v=0,$=d,w=d*2):u==="BGR"&&($=0,w=d,v=d*2);for(let x=0;x<d;x++,f+=c,m+=c,g+=c,_+=c)p[v++]=(e[f]+s[0])/a[0],p[w++]=(e[g]+s[1])/a[1],p[$++]=(e[m]+s[2])/a[2],S!==-1&&_!==-1&&(p[S++]=(e[_]+s[3])/a[3]);return u==="RGBA"?new Ge("float32",p,[1,4,r,n]):new Ge("float32",p,[1,3,r,n])},Ac=async(e,t)=>{let r=typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement,n=typeof ImageData<"u"&&e instanceof ImageData,i=typeof ImageBitmap<"u"&&e instanceof ImageBitmap,a=typeof e=="string",s,o=t??{},u=()=>{if(typeof document<"u")return document.createElement("canvas");if(typeof OffscreenCanvas<"u")return new OffscreenCanvas(1,1);throw new Error("Canvas is not supported")},d=p=>typeof HTMLCanvasElement<"u"&&p instanceof HTMLCanvasElement||p instanceof OffscreenCanvas?p.getContext("2d"):null;if(r){let p=u();p.width=e.width,p.height=e.height;let c=d(p);if(c!=null){let f=e.height,g=e.width;if(t!==void 0&&t.resizedHeight!==void 0&&t.resizedWidth!==void 0&&(f=t.resizedHeight,g=t.resizedWidth),t!==void 0){if(o=t,t.tensorFormat!==void 0)throw new Error("Image input config format must be RGBA for HTMLImageElement");o.tensorFormat="RGBA",o.height=f,o.width=g}else o.tensorFormat="RGBA",o.height=f,o.width=g;c.drawImage(e,0,0),s=c.getImageData(0,0,g,f).data}else throw new Error("Can not access image data")}else if(n){let p,c;if(t!==void 0&&t.resizedWidth!==void 0&&t.resizedHeight!==void 0?(p=t.resizedHeight,c=t.resizedWidth):(p=e.height,c=e.width),t!==void 0&&(o=t),o.format="RGBA",o.height=p,o.width=c,t!==void 0){let f=u();f.width=c,f.height=p;let g=d(f);if(g!=null)g.putImageData(e,0,0),s=g.getImageData(0,0,c,p).data;else throw new Error("Can not access image data")}else s=e.data}else if(i){if(t===void 0)throw new Error("Please provide image config with format for Imagebitmap");let p=u();p.width=e.width,p.height=e.height;let c=d(p);if(c!=null){let f=e.height,g=e.width;return c.drawImage(e,0,0,g,f),s=c.getImageData(0,0,g,f).data,o.height=f,o.width=g,jr(s,o)}else throw new Error("Can not access image data")}else{if(a)return new Promise((p,c)=>{let f=u(),g=d(f);if(!e||!g)return c();let m=new Image;m.crossOrigin="Anonymous",m.src=e,m.onload=()=>{f.width=m.width,f.height=m.height,g.drawImage(m,0,0,f.width,f.height);let _=g.getImageData(0,0,f.width,f.height);o.height=f.height,o.width=f.width,p(jr(_.data,o))}});throw new Error("Input data provided is not supported - aborted tensor creation")}if(s!==void 0)return jr(s,o);throw new Error("Input data provided is not supported - aborted tensor creation")},Mc=(e,t)=>{let{width:r,height:n,download:i,dispose:a}=t,s=[1,n,r,4];return new Ge({location:"texture",type:"float32",texture:e,dims:s,download:i,dispose:a})},Oc=(e,t)=>{let{dataType:r,dims:n,download:i,dispose:a}=t;return new Ge({location:"gpu-buffer",type:r??"float32",gpuBuffer:e,dims:n,download:i,dispose:a})},Rc=(e,t)=>{let{dataType:r,dims:n,download:i,dispose:a}=t;return new Ge({location:"ml-tensor",type:r??"float32",mlTensor:e,dims:n,download:i,dispose:a})},Nc=(e,t,r)=>new Ge({location:"cpu-pinned",type:e,data:t,dims:r??[t.length]})}),Pt,Sr,ri,Bc,A_=V(()=>{Pt=new Map([["float32",Float32Array],["uint8",Uint8Array],["int8",Int8Array],["uint16",Uint16Array],["int16",Int16Array],["int32",Int32Array],["bool",Uint8Array],["float64",Float64Array],["uint32",Uint32Array],["int4",Uint8Array],["uint4",Uint8Array]]),Sr=new Map([[Float32Array,"float32"],[Uint8Array,"uint8"],[Int8Array,"int8"],[Uint16Array,"uint16"],[Int16Array,"int16"],[Int32Array,"int32"],[Float64Array,"float64"],[Uint32Array,"uint32"]]),ri=!1,Bc=()=>{if(!ri){ri=!0;let e=typeof BigInt64Array<"u"&&BigInt64Array.from,t=typeof BigUint64Array<"u"&&BigUint64Array.from,r=globalThis.Float16Array,n=typeof r<"u"&&r.from;e&&(Pt.set("int64",BigInt64Array),Sr.set(BigInt64Array,"int64")),t&&(Pt.set("uint64",BigUint64Array),Sr.set(BigUint64Array,"uint64")),n?(Pt.set("float16",r),Sr.set(r,"float16")):Pt.set("float16",Uint16Array)}}}),Dc,Pc,M_=V(()=>{Ca(),Dc=e=>{let t=1;for(let r=0;r<e.length;r++){let n=e[r];if(typeof n!="number"||!Number.isSafeInteger(n))throw new TypeError(`dims[${r}] must be an integer, got: ${n}`);if(n<0)throw new RangeError(`dims[${r}] must be a non-negative integer, got: ${n}`);t*=n}return t},Pc=(e,t)=>{switch(e.location){case"cpu":return new Ge(e.type,e.data,t);case"cpu-pinned":return new Ge({location:"cpu-pinned",data:e.data,type:e.type,dims:t});case"texture":return new Ge({location:"texture",texture:e.texture,type:e.type,dims:t});case"gpu-buffer":return new Ge({location:"gpu-buffer",gpuBuffer:e.gpuBuffer,type:e.type,dims:t});case"ml-tensor":return new Ge({location:"ml-tensor",mlTensor:e.mlTensor,type:e.type,dims:t});default:throw new Error(`tensorReshape: tensor location ${e.location} is not supported`)}}}),Ge,Ca=V(()=>{C_(),z_(),A_(),M_(),Ge=class{constructor(e,t,r){Bc();let n,i;if(typeof e=="object"&&"location"in e)switch(this.dataLocation=e.location,n=e.type,i=e.dims,e.location){case"cpu-pinned":{let s=Pt.get(n);if(!s)throw new TypeError(`unsupported type "${n}" to create tensor from pinned buffer`);if(!(e.data instanceof s))throw new TypeError(`buffer should be of type ${s.name}`);this.cpuData=e.data;break}case"texture":{if(n!=="float32")throw new TypeError(`unsupported type "${n}" to create tensor from texture`);this.gpuTextureData=e.texture,this.downloader=e.download,this.disposer=e.dispose;break}case"gpu-buffer":{if(n!=="float32"&&n!=="float16"&&n!=="int32"&&n!=="int64"&&n!=="uint32"&&n!=="uint8"&&n!=="bool"&&n!=="uint4"&&n!=="int4")throw new TypeError(`unsupported type "${n}" to create tensor from gpu buffer`);this.gpuBufferData=e.gpuBuffer,this.downloader=e.download,this.disposer=e.dispose;break}case"ml-tensor":{if(n!=="float32"&&n!=="float16"&&n!=="int32"&&n!=="int64"&&n!=="uint32"&&n!=="uint64"&&n!=="int8"&&n!=="uint8"&&n!=="bool"&&n!=="uint4"&&n!=="int4")throw new TypeError(`unsupported type "${n}" to create tensor from MLTensor`);this.mlTensorData=e.mlTensor,this.downloader=e.download,this.disposer=e.dispose;break}default:throw new Error(`Tensor constructor: unsupported location '${this.dataLocation}'`)}else{let s,o;if(typeof e=="string")if(n=e,o=r,e==="string"){if(!Array.isArray(t))throw new TypeError("A string tensor's data must be a string array.");s=t}else{let u=Pt.get(e);if(u===void 0)throw new TypeError(`Unsupported tensor type: ${e}.`);if(Array.isArray(t)){if(e==="float16"&&u===Uint16Array||e==="uint4"||e==="int4")throw new TypeError(`Creating a ${e} tensor from number array is not supported. Please use ${u.name} as data.`);e==="uint64"||e==="int64"?s=u.from(t,BigInt):s=u.from(t)}else if(t instanceof u)s=t;else if(t instanceof Uint8ClampedArray)if(e==="uint8")s=Uint8Array.from(t);else throw new TypeError("A Uint8ClampedArray tensor's data must be type of uint8");else if(e==="float16"&&t instanceof Uint16Array&&u!==Uint16Array)s=new globalThis.Float16Array(t.buffer,t.byteOffset,t.length);else throw new TypeError(`A ${n} tensor's data must be type of ${u}`)}else if(o=t,Array.isArray(e)){if(e.length===0)throw new TypeError("Tensor type cannot be inferred from an empty array.");let u=typeof e[0];if(u==="string")n="string",s=e;else if(u==="boolean")n="bool",s=Uint8Array.from(e);else throw new TypeError(`Invalid element type of data array: ${u}.`)}else if(e instanceof Uint8ClampedArray)n="uint8",s=Uint8Array.from(e);else{let u=Sr.get(e.constructor);if(u===void 0)throw new TypeError(`Unsupported type for tensor data: ${e.constructor}.`);n=u,s=e}if(o===void 0)o=[s.length];else if(!Array.isArray(o))throw new TypeError("A tensor's dims must be a number array");i=o,this.cpuData=s,this.dataLocation="cpu"}let a=Dc(i);if(this.cpuData&&a!==this.cpuData.length&&!((n==="uint4"||n==="int4")&&Math.ceil(a/2)===this.cpuData.length))throw new Error(`Tensor's size(${a}) does not match data length(${this.cpuData.length}).`);this.type=n,this.dims=i,this.size=a}static async fromImage(e,t){return Ac(e,t)}static fromTexture(e,t){return Mc(e,t)}static fromGpuBuffer(e,t){return Oc(e,t)}static fromMLTensor(e,t){return Rc(e,t)}static fromPinnedBuffer(e,t,r){return Nc(e,t,r)}toDataURL(e){return Cc(this,e)}toImageData(e){return zc(this,e)}get data(){if(this.ensureValid(),!this.cpuData)throw new Error("The data is not on CPU. Use `getData()` to download GPU data to CPU, or use `texture` or `gpuBuffer` property to access the GPU data directly.");return this.cpuData}get location(){return this.dataLocation}get texture(){if(this.ensureValid(),!this.gpuTextureData)throw new Error("The data is not stored as a WebGL texture.");return this.gpuTextureData}get gpuBuffer(){if(this.ensureValid(),!this.gpuBufferData)throw new Error("The data is not stored as a WebGPU buffer.");return this.gpuBufferData}get mlTensor(){if(this.ensureValid(),!this.mlTensorData)throw new Error("The data is not stored as a WebNN MLTensor.");return this.mlTensorData}async getData(e){switch(this.ensureValid(),this.dataLocation){case"cpu":case"cpu-pinned":return this.data;case"texture":case"gpu-buffer":case"ml-tensor":{if(!this.downloader)throw new Error("The current tensor is not created with a specified data downloader.");if(this.isDownloading)throw new Error("The current tensor is being downloaded.");try{this.isDownloading=!0;let t=await this.downloader();return this.downloader=void 0,this.dataLocation="cpu",this.cpuData=t,e&&this.disposer&&(this.disposer(),this.disposer=void 0),t}finally{this.isDownloading=!1}}default:throw new Error(`cannot get data from location: ${this.dataLocation}`)}}dispose(){if(this.isDownloading)throw new Error("The current tensor is being downloaded.");this.disposer&&(this.disposer(),this.disposer=void 0),this.cpuData=void 0,this.gpuTextureData=void 0,this.gpuBufferData=void 0,this.mlTensorData=void 0,this.downloader=void 0,this.isDownloading=void 0,this.dataLocation="none"}ensureValid(){if(this.dataLocation==="none")throw new Error("The tensor is disposed.")}reshape(e){if(this.ensureValid(),this.downloader||this.disposer)throw new Error("Cannot reshape a tensor that owns GPU resource.");return Pc(this,e)}}}),it,Uc=V(()=>{Ca(),it=Ge}),mn,ni,pt,at,Vt,Ht,Lc=V(()=>{Ec(),mn=(e,t)=>{(typeof Ne.trace>"u"?!Ne.wasm.trace:!Ne.trace)||console.timeStamp(`${e}::ORT::${t}`)},ni=(e,t)=>{let r=new Error().stack?.split(/\r\n|\r|\n/g)||[],n=!1;for(let i=0;i<r.length;i++){if(n&&!r[i].includes("TRACE_FUNC")){let a=`FUNC_${e}::${r[i].trim().split(" ")[1]}`;t&&(a+=`::${t}`),mn("CPU",a);return}r[i].includes("TRACE_FUNC")&&(n=!0)}},pt=e=>{(typeof Ne.trace>"u"?!Ne.wasm.trace:!Ne.trace)||ni("BEGIN",e)},at=e=>{(typeof Ne.trace>"u"?!Ne.wasm.trace:!Ne.trace)||ni("END",e)},Vt=e=>{(typeof Ne.trace>"u"?!Ne.wasm.trace:!Ne.trace)||console.time(`ORT::${e}`)},Ht=e=>{(typeof Ne.trace>"u"?!Ne.wasm.trace:!Ne.trace)||console.timeEnd(`ORT::${e}`)}}),qc,O_=V(()=>{Tc(),Uc(),Lc(),qc=class Wc{constructor(t){this.handler=t}async run(t,r,n){pt(),Vt("InferenceSession.run");let i={},a={};if(typeof t!="object"||t===null||t instanceof it||Array.isArray(t))throw new TypeError("'feeds' must be an object that use input names as keys and OnnxValue as corresponding values.");let s=!0;if(typeof r=="object"){if(r===null)throw new TypeError("Unexpected argument[1]: cannot be null.");if(r instanceof it)throw new TypeError("'fetches' cannot be a Tensor");if(Array.isArray(r)){if(r.length===0)throw new TypeError("'fetches' cannot be an empty array.");s=!1;for(let d of r){if(typeof d!="string")throw new TypeError("'fetches' must be a string array or an object.");if(this.outputNames.indexOf(d)===-1)throw new RangeError(`'fetches' contains invalid output name: ${d}.`);i[d]=null}if(typeof n=="object"&&n!==null)a=n;else if(typeof n<"u")throw new TypeError("'options' must be an object.")}else{let d=!1,p=Object.getOwnPropertyNames(r);for(let c of this.outputNames)if(p.indexOf(c)!==-1){let f=r[c];(f===null||f instanceof it)&&(d=!0,s=!1,i[c]=f)}if(d){if(typeof n=="object"&&n!==null)a=n;else if(typeof n<"u")throw new TypeError("'options' must be an object.")}else a=r}}else if(typeof r<"u")throw new TypeError("Unexpected argument[1]: must be 'fetches' or 'options'.");for(let d of this.inputNames)if(typeof t[d]>"u")throw new Error(`input '${d}' is missing in 'feeds'.`);if(s)for(let d of this.outputNames)i[d]=null;let o=await this.handler.run(t,i,a),u={};for(let d in o)if(Object.hasOwnProperty.call(o,d)){let p=o[d];p instanceof it?u[d]=p:u[d]=new it(p.type,p.data,p.dims)}return Ht("InferenceSession.run"),at(),u}async release(){return this.handler.dispose()}static async create(t,r,n,i){pt(),Vt("InferenceSession.create");let a,s={};if(typeof t=="string"){if(a=t,typeof r=="object"&&r!==null)s=r;else if(typeof r<"u")throw new TypeError("'options' must be an object.")}else if(t instanceof Uint8Array){if(a=t,typeof r=="object"&&r!==null)s=r;else if(typeof r<"u")throw new TypeError("'options' must be an object.")}else if(t instanceof ArrayBuffer||typeof SharedArrayBuffer<"u"&&t instanceof SharedArrayBuffer){let p=t,c=0,f=t.byteLength;if(typeof r=="object"&&r!==null)s=r;else if(typeof r=="number"){if(c=r,!Number.isSafeInteger(c))throw new RangeError("'byteOffset' must be an integer.");if(c<0||c>=p.byteLength)throw new RangeError(`'byteOffset' is out of range [0, ${p.byteLength}).`);if(f=t.byteLength-c,typeof n=="number"){if(f=n,!Number.isSafeInteger(f))throw new RangeError("'byteLength' must be an integer.");if(f<=0||c+f>p.byteLength)throw new RangeError(`'byteLength' is out of range (0, ${p.byteLength-c}].`);if(typeof i=="object"&&i!==null)s=i;else if(typeof i<"u")throw new TypeError("'options' must be an object.")}else if(typeof n<"u")throw new TypeError("'byteLength' must be a number.")}else if(typeof r<"u")throw new TypeError("'options' must be an object.");a=new Uint8Array(p,c,f)}else throw new TypeError("Unexpected argument[0]: must be 'path' or 'buffer'.");let[o,u]=await kc(s),d=await o.createInferenceSessionHandler(a,u);return Ht("InferenceSession.create"),at(),new Wc(d)}startProfiling(){this.handler.startProfiling()}endProfiling(){this.handler.endProfiling()}get inputNames(){return this.handler.inputNames}get outputNames(){return this.handler.outputNames}get inputMetadata(){return this.handler.inputMetadata}get outputMetadata(){return this.handler.outputMetadata}}}),za,R_=V(()=>{O_(),za=qc}),N_=V(()=>{}),B_=V(()=>{}),D_=V(()=>{}),P_=V(()=>{}),U_={};ur(U_,{InferenceSession:()=>za,TRACE:()=>mn,TRACE_EVENT_BEGIN:()=>Vt,TRACE_EVENT_END:()=>Ht,TRACE_FUNC_BEGIN:()=>pt,TRACE_FUNC_END:()=>at,Tensor:()=>it,env:()=>$e,registerBackend:()=>nr});var Xe=V(()=>{T_(),E_(),R_(),Uc(),N_(),B_(),Lc(),D_(),P_()}),Aa=V(()=>{}),Fc={};ur(Fc,{default:()=>Gc});var ii,ai,Gc,L_=V(()=>{Zm(),Zt(),Ma(),ii="ort-wasm-proxy-worker",ai=globalThis.self?.name===ii,ai&&(self.onmessage=e=>{let{type:t,in:r}=e.data;try{switch(t){case"init-wasm":Oa(r.wasm).then(()=>{Za(r).then(()=>{postMessage({type:t})},n=>{postMessage({type:t,err:n})})},n=>{postMessage({type:t,err:n})});break;case"init-ep":{let{epName:n,env:i}=r;Ya(i,n).then(()=>{postMessage({type:t})},a=>{postMessage({type:t,err:a})});break}case"copy-from":{let{buffer:n}=r,i=vn(n);postMessage({type:t,out:i});break}case"create":{let{model:n,options:i}=r;Qa(n,i).then(a=>{postMessage({type:t,out:a})},a=>{postMessage({type:t,err:a})});break}case"release":Ja(r),postMessage({type:t});break;case"run":{let{sessionId:n,inputIndices:i,inputs:a,outputIndices:s,options:o}=r;es(n,i,a,s,new Array(s.length).fill(null),o).then(u=>{u.some(d=>d[3]!=="cpu")?postMessage({type:t,err:"Proxy does not support non-cpu tensor location."}):postMessage({type:t,out:u},rs([...a,...u]))},u=>{postMessage({type:t,err:u})});break}case"end-profiling":ts(r),postMessage({type:t});break;default:}}catch(n){postMessage({type:t,err:n})}}),Gc=ai?null:e=>new Worker(e??We,{type:"module",name:ii})}),Vc={};ur(Vc,{default:()=>Hc});async function lu(e={}){var t=e,r=!!globalThis.window,n=!!globalThis.WorkerGlobalScope,i=n&&self.name?.startsWith("em-pthread");t.mountExternalData=(l,h)=>{l.startsWith("./")&&(l=l.substring(2)),(t.Xc||(t.Xc=new Map)).set(l,h)},t.unmountExternalData=()=>{delete t.Xc},globalThis.SharedArrayBuffer??new WebAssembly.Memory({initial:0,maximum:0,shared:!0}).buffer.constructor;let a=l=>async(...h)=>{try{if(t.Yc)throw Error("Session already started");let b=t.Yc={Kd:h[0],errors:[]},y=await l(...h);if(t.Yc!==b)throw Error("Session mismatch");t.dd?.flush();let T=b.errors;if(0<T.length){let C=await Promise.all(T);if(C=C.filter(A=>A),0<C.length)throw Error(C.join(`
`))}return y}finally{t.Yc=null}};t.jsepInit=(l,h)=>{if(l==="webgpu"){[t.dd,t.Ad,t.Ed,t.ed,t.Dd,t.$b,t.Fd,t.Hd,t.Bd,t.Cd,t.Gd]=h;let b=t.dd;t.jsepRegisterBuffer=(y,T,C,A)=>b.registerBuffer(y,T,C,A),t.jsepGetBuffer=y=>b.getBuffer(y),t.jsepCreateDownloader=(y,T,C)=>b.createDownloader(y,T,C),t.jsepOnCreateSession=y=>{b.onCreateSession(y)},t.jsepOnReleaseSession=y=>{b.onReleaseSession(y)},t.jsepOnRunStart=y=>b.onRunStart(y),t.Id=(y,T)=>{b.upload(y,T)}}else if(l==="webnn"){let b=h[0];[t.Sd,t.sd,t.webnnEnsureTensor,t.td,t.webnnDownloadTensor,t.Rd,t.webnnEnableTraceEvent]=h.slice(1),t.webnnReleaseTensorId=t.sd,t.webnnUploadTensor=t.td,t.webnnRegisterMLContext=t.Rd,t.webnnOnRunStart=y=>b.onRunStart(y),t.webnnOnRunEnd=b.onRunEnd.bind(b),t.webnnOnReleaseSession=y=>{b.onReleaseSession(y)},t.webnnCreateMLTensorDownloader=(y,T)=>b.createMLTensorDownloader(y,T),t.webnnRegisterMLTensor=(y,T,C,A)=>b.registerMLTensor(y,T,C,A),t.webnnCreateMLContext=y=>b.createMLContext(y),t.webnnRegisterMLConstant=(y,T,C,A,D,j)=>b.registerMLConstant(y,T,C,A,D,t.Xc,j),t.webnnRegisterGraphInput=b.registerGraphInput.bind(b),t.webnnIsGraphInput=b.isGraphInput.bind(b),t.webnnRegisterGraphOutput=b.registerGraphOutput.bind(b),t.webnnIsGraphOutput=b.isGraphOutput.bind(b),t.webnnCreateTemporaryTensor=b.createTemporaryTensor.bind(b),t.webnnIsGraphInputOutputTypeSupported=b.isGraphInputOutputTypeSupported.bind(b)}};let s=()=>{let l=h=>(...b)=>{let y=ut;return b=h(...b),ut!=y?new Promise((T,C)=>{Ln={resolve:T,reject:C}}):b};(()=>{for(let h of["_OrtAppendExecutionProvider","_OrtCreateSession","_OrtRun","_OrtRunWithBinding","_OrtBindInput"])t[h]=l(t[h])})(),a!==void 0&&(t._OrtRun=a(t._OrtRun),t._OrtRunWithBinding=a(t._OrtRunWithBinding)),s=void 0};t.asyncInit=()=>{s?.()};var o,u,d=(l,h)=>{throw h},p=import.meta.url,c="";if(r||n){try{c=new URL(".",p).href}catch{}n&&(u=l=>{var h=new XMLHttpRequest;return h.open("GET",l,!1),h.responseType="arraybuffer",h.send(null),new Uint8Array(h.response)}),o=async l=>{if(z(l))return new Promise((b,y)=>{var T=new XMLHttpRequest;T.open("GET",l,!0),T.responseType="arraybuffer",T.onload=()=>{T.status==200||T.status==0&&T.response?b(T.response):y(T.status)},T.onerror=y,T.send(null)});var h=await fetch(l,{credentials:"same-origin"});if(h.ok)return h.arrayBuffer();throw Error(h.status+" : "+h.url)}}var f,g,m,_,v,w,$=console.log.bind(console),S=console.error.bind(console),x=$,I=S,E=!1,z=l=>l.startsWith("file://");function k(){bt.buffer!=O.buffer&&ee()}if(i){let l=function(h){try{var b=h.data,y=b.Sc;if(y==="load"){let T=[];self.onmessage=C=>T.push(C),w=()=>{postMessage({Sc:"loaded"});for(let C of T)l(C);self.onmessage=l};for(let C of b.xd)t[C]&&!t[C].proxy||(t[C]=(...A)=>{postMessage({Sc:"callHandler",wd:C,args:A})},C=="print"&&(x=t[C]),C=="printErr"&&(I=t[C]));bt=b.Od,ee(),g=b.Pd,Se(),Gr()}else if(y==="run"){(function(T){var C=(k(),B)[T+52>>>2>>>0];T=(k(),B)[T+56>>>2>>>0],so(C,C-T),ue(C)})(b.Rc),Vn(b.Rc,0,0,1,0,0),os(),Dn(b.Rc),N||(eo(),N=!0);try{cg(b.Md,b.bd)}catch(T){if(T!="unwind")throw T}}else b.target!=="setimmediate"&&(y==="checkMailbox"?N&&Dr():y&&(I(`worker: received unknown command ${y}`),I(b)))}catch(T){throw to(),T}};var N=!1;self.onunhandledrejection=h=>{throw h.reason||h},self.onmessage=l}var O,F,q,H,M,B,G,J,Y,L,X,U=!1;function ee(){var l=bt.buffer;t.HEAP8=O=new Int8Array(l),q=new Int16Array(l),t.HEAPU8=F=new Uint8Array(l),H=new Uint16Array(l),t.HEAP32=M=new Int32Array(l),t.HEAPU32=B=new Uint32Array(l),G=new Float32Array(l),J=new Float64Array(l),Y=new BigInt64Array(l),L=new BigUint64Array(l)}function Z(){U=!0,i?w():ht.sb()}function K(l){throw I(l="Aborted("+l+")"),E=!0,l=new WebAssembly.RuntimeError(l+". Build with -sASSERTIONS for more info."),v?.(l),l}function xe(){return{a:{ma:N0,gb:R0,g:hg,J:fg,f:mg,o:gg,h:yg,ha:_g,b:bg,T:wg,Ha:hs,n:$g,$:ys,Xa:_s,Da:bs,Fa:ws,Ya:$s,Va:vs,Oa:xs,Ua:Ss,ka:ks,Ea:Ts,Ba:Is,Wa:Es,Ca:Cs,bb:vg,ea:xg,wa:Sg,ua:Tg,da:Eg,O:Cg,H:zg,va:Ag,_:Pg,xa:Ug,Ra:Lg,za:Wg,Ia:Fg,sa:Gg,fa:Vg,Qa:Dn,_a:Hg,R:Zg,r:t0,c:Nn,hb:r0,y:n0,M:i0,D:a0,l:s0,s:Ds,ib:o0,I:u0,S:l0,j:d0,u:p0,q:c0,k:h0,La:f0,Ma:m0,Na:g0,Ja:qs,Ka:Ws,ta:Fs,db:_0,ab:w0,v:$0,aa:v0,ga:x0,$a:b0,W:S0,Za:k0,Aa:T0,F:y0,U:I0,la:Wr,ya:C0,fb:E0,eb:z0,Sa:js,Ta:Ks,Ga:zn,V:Xs,ja:Zs,Pa:Ys,ia:Qs,kb:yy,na:cy,lb:gy,oa:py,G:ry,e:U0,t:D0,w:B0,B:X0,mb:uy,K:J0,x:W0,pa:ly,Y:hy,ba:oy,nb:sy,ob:ay,P:Z0,qa:iy,pb:ny,N:ey,Z:dy,d:P0,A:q0,m:L0,jb:_y,p:G0,z:V0,C:F0,E:H0,L:Y0,qb:ty,Q:fy,ca:Q0,X:my,rb:K0,ra:j0,i:M0,a:bt,cb:Cn}}}async function Se(){function l(y,T){var C=ht=y.exports;y={};for(let[A,D]of Object.entries(C))typeof D=="function"?(C=jg(D),y[A]=C):y[A]=D;return ht=y,ht=(function(){var A=ht,D=Q=>oe=>Q(oe)>>>0,j=Q=>()=>Q()>>>0;return(A=Object.assign({},A)).tb=D(A.tb),A.Xb=j(A.Xb),A.Zb=D(A.Zb),A.lc=D(A.lc),A.mc=j(A.mc),A.qc=D(A.qc),A})(),as.push(ht._b),Js=(y=ht).tb,eo=y.ub,t._OrtInit=y.vb,t._OrtGetLastError=y.wb,t._OrtCreateSessionOptions=y.xb,t._OrtAppendExecutionProvider=y.yb,t._OrtAddFreeDimensionOverride=y.zb,t._OrtAddSessionConfigEntry=y.Ab,t._OrtReleaseSessionOptions=y.Bb,t._OrtCreateSession=y.Cb,t._OrtReleaseSession=y.Db,t._OrtGetInputOutputCount=y.Eb,t._OrtGetInputOutputMetadata=y.Fb,t._OrtFree=y.Gb,t._OrtCreateTensor=y.Hb,t._OrtGetTensorData=y.Ib,t._OrtReleaseTensor=y.Jb,t._OrtCreateRunOptions=y.Kb,t._OrtAddRunConfigEntry=y.Lb,t._OrtReleaseRunOptions=y.Mb,t._OrtCreateBinding=y.Nb,t._OrtBindInput=y.Ob,t._OrtBindOutput=y.Pb,t._OrtClearBoundOutputs=y.Qb,t._OrtReleaseBinding=y.Rb,t._OrtRunWithBinding=y.Sb,t._OrtRun=y.Tb,t._OrtEndProfiling=y.Ub,t._JsepOutput=y.Vb,t._JsepGetNodeName=y.Wb,Fr=y.Xb,lt=t._free=y.Yb,pr=t._malloc=y.Zb,Vn=y.ac,to=y.bc,ro=y.cc,no=y.dc,Hn=y.ec,io=y.fc,ao=y.gc,de=y.hc,cr=y.ic,so=y.jc,ue=y.kc,jn=y.lc,le=y.mc,oo=y.nc,Kn=y.oc,uo=y.pc,lo=y.qc,po=y.rc,Xn=y.sc,co=y.tc,ho=y.uc,fo=y.vc,mo=y.wc,go=y.xc,yo=y.yc,_o=y.zc,bo=y.Ac,wo=y.Bc,$o=y.Cc,vo=y.Dc,xo=y.Ec,So=y.Fc,ko=y.Gc,To=y.Hc,Io=y.Ic,Eo=y.Jc,Co=y.Kc,zo=y.Lc,Ao=y.Mc,Mo=y.Nc,Oo=y.Pc,Ro=y.Qc,No=y.$c,Bo=y.ad,Do=y.fd,Po=y.jd,Uo=y.kd,Lo=y.ld,qo=y.md,Wo=y.nd,Fo=y.od,Go=y.pd,Vo=y.qd,Ho=y.vd,jo=y.Td,Ko=y.Ud,Xo=y.Vd,Zo=y.Wd,g=T,ht}var h,b=xe();return t.instantiateWasm?new Promise(y=>{t.instantiateWasm(b,(T,C)=>{y(l(T,C))})}):i?l(new WebAssembly.Instance(g,xe()),g):(X??=t.locateFile?t.locateFile?t.locateFile("ort-wasm-simd-threaded.jsep.wasm",c):c+"ort-wasm-simd-threaded.jsep.wasm":new URL("/SACHIZU-LAB1/assets/ort-wasm-simd-threaded.jsep-DC5y_g6C.wasm",import.meta.url).href,h=await(async function(y){var T=X;if(!f&&!z(T))try{var C=fetch(T,{credentials:"same-origin"});return await WebAssembly.instantiateStreaming(C,y)}catch(A){I(`wasm streaming compile failed: ${A}`),I("falling back to ArrayBuffer instantiation")}return(async function(A,D){try{var j=await(async function(Q){if(!f)try{var oe=await o(Q);return new Uint8Array(oe)}catch{}if(Q==X&&f)Q=new Uint8Array(f);else{if(!u)throw"both async and sync fetching of the wasm failed";Q=u(Q)}return Q})(A);return await WebAssembly.instantiate(j,D)}catch(Q){I(`failed to asynchronously prepare wasm: ${Q}`),K(Q)}})(T,y)})(b),l(h.instance,h.module))}class W{name="ExitStatus";constructor(h){this.message=`Program terminated with exit(${h})`,this.status=h}}var pe=l=>{l.terminate(),l.onmessage=()=>{}},me=[],Te=0,Pe=null,Mr=l=>{_t.length==0&&(ls(),us(_t[0]));var h=_t.pop();if(!h)return 6;lr.push(h),zt[l.Rc]=h,h.Rc=l.Rc;var b={Sc:"run",Md:l.Ld,bd:l.bd,Rc:l.Rc};return h.postMessage(b,l.rd),0},st=0,Ee=(l,h,...b)=>{var y,T=16*b.length,C=le(),A=jn(T),D=A>>>3;for(y of b)typeof y=="bigint"?((k(),Y)[D++>>>0]=1n,(k(),Y)[D++>>>0]=y):((k(),Y)[D++>>>0]=0n,(k(),J)[D++>>>0]=y);return l=ro(l,0,T,A,h),ue(C),l};function Cn(l){if(i)return Ee(0,1,l);if(m=l,!(0<st)){for(var h of lr)pe(h);for(h of _t)pe(h);_t=[],lr=[],zt={},E=!0}d(0,new W(l))}function is(l){if(i)return Ee(1,0,l);zn(l)}var zn=l=>{if(m=l,i)throw is(l),"unwind";Cn(l)},_t=[],lr=[],as=[],zt={},ss=l=>{var h=l.Rc;delete zt[h],_t.push(l),lr.splice(lr.indexOf(l),1),l.Rc=0,no(h)};function os(){as.forEach(l=>l())}var us=l=>new Promise(h=>{l.onmessage=T=>{var C=T.data;if(T=C.Sc,C.Zc&&C.Zc!=Fr()){var A=zt[C.Zc];A?A.postMessage(C,C.rd):I(`Internal error! Worker sent a message "${T}" to target pthread ${C.Zc}, but that thread no longer exists!`)}else T==="checkMailbox"?Dr():T==="spawnThread"?Mr(C):T==="cleanupThread"?Br(()=>{ss(zt[C.Nd])}):T==="loaded"?(l.loaded=!0,h(l)):C.target==="setimmediate"?l.postMessage(C):T==="uncaughtException"?l.onerror(C.error):T==="callHandler"?t[C.wd](...C.args):T&&I(`worker sent an unknown command ${T}`)},l.onerror=T=>{throw I(`worker sent an error! ${T.filename}:${T.lineno}: ${T.message}`),T};var b,y=[];for(b of[])t.propertyIsEnumerable(b)&&y.push(b);l.postMessage({Sc:"load",xd:y,Od:bt,Pd:g})});function ls(){var l=new Worker((()=>{let h=URL;return import.meta.url>"file:"&&import.meta.url<"file;"?new h("ort.bundle.min.mjs",import.meta.url):new URL(import.meta.url)})(),{type:"module",workerData:"em-pthread",name:"em-pthread"});_t.push(l)}var bt,cg=(l,h)=>{st=0,l=Xn(l,h),0<st?m=l:Hn(l)},Or=[],Rr=0;function hg(l){var h=new An(l>>>=0);return(k(),O)[h.Tc+12>>>0]==0&&(ds(h,!0),Rr--),ps(h,!1),Or.push(h),lo(l)}var Qt=0,fg=()=>{de(0,0);var l=Or.pop();oo(l.cd),Qt=0};function ds(l,h){h=h?1:0,(k(),O)[l.Tc+12>>>0]=h}function ps(l,h){h=h?1:0,(k(),O)[l.Tc+13>>>0]=h}class An{constructor(h){this.cd=h,this.Tc=h-24}}var Mn=l=>{var h=Qt;if(!h)return cr(0),0;var b=new An(h);(k(),B)[b.Tc+16>>>2>>>0]=h;var y=(k(),B)[b.Tc+4>>>2>>>0];if(!y)return cr(0),h;for(var T of l){if(T===0||T===y)break;if(uo(T,y,b.Tc+16))return cr(T),h}return cr(y),h};function mg(){return Mn([])}function gg(l){return Mn([l>>>0])}function yg(l,h,b,y){return Mn([l>>>0,h>>>0,b>>>0,y>>>0])}var _g=()=>{var l=Or.pop();l||K("no exception to throw");var h=l.cd;throw(k(),O)[l.Tc+13>>>0]==0&&(Or.push(l),ps(l,!0),ds(l,!1),Rr++),Kn(h),Qt=h};function bg(l,h,b){var y=new An(l>>>=0);throw h>>>=0,b>>>=0,(k(),B)[y.Tc+16>>>2>>>0]=0,(k(),B)[y.Tc+4>>>2>>>0]=h,(k(),B)[y.Tc+8>>>2>>>0]=b,Kn(l),Rr++,Qt=l}var wg=()=>Rr;function cs(l,h,b,y){return i?Ee(2,1,l,h,b,y):hs(l,h,b,y)}function hs(l,h,b,y){if(l>>>=0,h>>>=0,b>>>=0,y>>>=0,!globalThis.SharedArrayBuffer)return 6;var T=[];return i&&T.length===0?cs(l,h,b,y):(l={Ld:b,Rc:l,bd:y,rd:T},i?(l.Sc="spawnThread",postMessage(l,T),0):Mr(l))}function $g(l){throw Qt||=l>>>0,Qt}var fs=globalThis.TextDecoder&&new TextDecoder,ms=(l,h,b,y)=>{if(b=h+b,y)return b;for(;l[h]&&!(h>=b);)++h;return h},gs=(l,h=0,b,y)=>{if(16<(b=ms(l,h>>>=0,b,y))-h&&l.buffer&&fs)return fs.decode(l.buffer instanceof ArrayBuffer?l.subarray(h,b):l.slice(h,b));for(y="";h<b;){var T=l[h++];if(128&T){var C=63&l[h++];if((224&T)==192)y+=String.fromCharCode((31&T)<<6|C);else{var A=63&l[h++];65536>(T=(240&T)==224?(15&T)<<12|C<<6|A:(7&T)<<18|C<<12|A<<6|63&l[h++])?y+=String.fromCharCode(T):(T-=65536,y+=String.fromCharCode(55296|T>>10,56320|1023&T))}}else y+=String.fromCharCode(T)}return y},Me=(l,h,b)=>(l>>>=0)?gs((k(),F),l,h,b):"";function ys(l,h,b){return i?Ee(3,1,l,h,b):0}function _s(l,h){if(i)return Ee(4,1,l,h)}function bs(l,h){if(i)return Ee(5,1,l,h)}function ws(l,h,b){if(i)return Ee(6,1,l,h,b)}function $s(l,h,b){return i?Ee(7,1,l,h,b):0}function vs(l,h){if(i)return Ee(8,1,l,h)}function xs(l,h,b){if(i)return Ee(9,1,l,h,b)}function Ss(l,h,b,y){if(i)return Ee(10,1,l,h,b,y)}function ks(l,h,b,y){if(i)return Ee(11,1,l,h,b,y)}function Ts(l,h,b,y){if(i)return Ee(12,1,l,h,b,y)}function Is(l){if(i)return Ee(13,1,l)}function Es(l,h){if(i)return Ee(14,1,l,h)}function Cs(l,h,b){if(i)return Ee(15,1,l,h,b)}var vg=()=>K(""),ot=l=>{l>>>=0;for(var h="";;){var b=(k(),F)[l++>>>0];if(!b)return h;h+=String.fromCharCode(b)}},On={},Rn={},Jt=class extends Error{constructor(l){super(l),this.name="BindingError"}};function ct(l,h,b={}){return(function(y,T,C={}){var A=T.name;if(!y)throw new Jt(`type "${A}" must have a positive integer typeid pointer`);if(Rn.hasOwnProperty(y)){if(C.yd)return;throw new Jt(`Cannot register type '${A}' twice`)}Rn[y]=T,On.hasOwnProperty(y)&&(T=On[y],delete On[y],T.forEach(D=>D()))})(l,h,b)}var zs=(l,h,b)=>{switch(h){case 1:return b?y=>(k(),O)[y>>>0]:y=>(k(),F)[y>>>0];case 2:return b?y=>(k(),q)[y>>>1>>>0]:y=>(k(),H)[y>>>1>>>0];case 4:return b?y=>(k(),M)[y>>>2>>>0]:y=>(k(),B)[y>>>2>>>0];case 8:return b?y=>(k(),Y)[y>>>3>>>0]:y=>(k(),L)[y>>>3>>>0];default:throw new TypeError(`invalid integer width (${h}): ${l}`)}};function xg(l,h,b,y,T){l>>>=0,b>>>=0,h=ot(h>>>0);let C=A=>A;if(y=y===0n){let A=8*b;C=D=>BigInt.asUintN(A,D),T=C(T)}ct(l,{name:h,Oc:C,Vc:(A,D)=>(typeof D=="number"&&(D=BigInt(D)),D),Uc:zs(h,b,!y),Wc:null})}function Sg(l,h,b,y){ct(l>>>=0,{name:h=ot(h>>>0),Oc:function(T){return!!T},Vc:function(T,C){return C?b:y},Uc:function(T){return this.Oc((k(),F)[T>>>0])},Wc:null})}var As=[],At=[0,1,,1,null,1,!0,1,!1,1];function Nn(l){9<(l>>>=0)&&--At[l+1]===0&&(At[l]=void 0,As.push(l))}var He=l=>{if(!l)throw new Jt(`Cannot use deleted val. handle = ${l}`);return At[l]},Ze=l=>{switch(l){case void 0:return 2;case null:return 4;case!0:return 6;case!1:return 8;default:let h=As.pop()||At.length;return At[h]=l,At[h+1]=1,h}};function Bn(l){return this.Oc((k(),B)[l>>>2>>>0])}var kg={name:"emscripten::val",Oc:l=>{var h=He(l);return Nn(l),h},Vc:(l,h)=>Ze(h),Uc:Bn,Wc:null};function Tg(l){return ct(l>>>0,kg)}var Ig=(l,h)=>{switch(h){case 4:return function(b){return this.Oc((k(),G)[b>>>2>>>0])};case 8:return function(b){return this.Oc((k(),J)[b>>>3>>>0])};default:throw new TypeError(`invalid float width (${h}): ${l}`)}};function Eg(l,h,b){b>>>=0,ct(l>>>=0,{name:h=ot(h>>>0),Oc:y=>y,Vc:(y,T)=>T,Uc:Ig(h,b),Wc:null})}function Cg(l,h,b,y,T){l>>>=0,b>>>=0,h=ot(h>>>0);let C=D=>D;if(y===0){var A=32-8*b;C=D=>D<<A>>>A,T=C(T)}ct(l,{name:h,Oc:C,Vc:(D,j)=>j,Uc:zs(h,b,y!==0),Wc:null})}function zg(l,h,b){function y(C){var A=(k(),B)[C>>>2>>>0];return C=(k(),B)[C+4>>>2>>>0],new T((k(),O).buffer,C,A)}var T=[Int8Array,Uint8Array,Int16Array,Uint16Array,Int32Array,Uint32Array,Float32Array,Float64Array,BigInt64Array,BigUint64Array][h];ct(l>>>=0,{name:b=ot(b>>>0),Oc:y,Uc:y},{yd:!0})}var wt=(l,h,b)=>{var y=(k(),F);if(h>>>=0,0<b){var T=h;b=h+b-1;for(var C=0;C<l.length;++C){var A=l.codePointAt(C);if(127>=A){if(h>=b)break;y[h++>>>0]=A}else if(2047>=A){if(h+1>=b)break;y[h++>>>0]=192|A>>6,y[h++>>>0]=128|63&A}else if(65535>=A){if(h+2>=b)break;y[h++>>>0]=224|A>>12,y[h++>>>0]=128|A>>6&63,y[h++>>>0]=128|63&A}else{if(h+3>=b)break;y[h++>>>0]=240|A>>18,y[h++>>>0]=128|A>>12&63,y[h++>>>0]=128|A>>6&63,y[h++>>>0]=128|63&A,C++}}y[h>>>0]=0,l=h-T}else l=0;return l},Nr=l=>{for(var h=0,b=0;b<l.length;++b){var y=l.charCodeAt(b);127>=y?h++:2047>=y?h+=2:55296<=y&&57343>=y?(h+=4,++b):h+=3}return h};function Ag(l,h){ct(l>>>=0,{name:h=ot(h>>>0),Oc(b){var y=(k(),B)[b>>>2>>>0];return y=Me(b+4,y,!0),lt(b),y},Vc(b,y){y instanceof ArrayBuffer&&(y=new Uint8Array(y));var T=typeof y=="string";if(!(T||ArrayBuffer.isView(y)&&y.BYTES_PER_ELEMENT==1))throw new Jt("Cannot pass non-string to std::string");var C=T?Nr(y):y.length,A=pr(4+C+1),D=A+4;return(k(),B)[A>>>2>>>0]=C,T?wt(y,D,C+1):(k(),F).set(y,D>>>0),b!==null&&b.push(lt,A),A},Uc:Bn,Wc(b){lt(b)}})}var Ms=globalThis.TextDecoder?new TextDecoder("utf-16le"):void 0,Mg=(l,h,b)=>{if(l>>>=1,16<(h=ms((k(),H),l,h/2,b))-l&&Ms)return Ms.decode((k(),H).slice(l,h));for(b="";l<h;++l){var y=(k(),H)[l>>>0];b+=String.fromCharCode(y)}return b},Og=(l,h,b)=>{if(b??=2147483647,2>b)return 0;var y=h;b=(b-=2)<2*l.length?b/2:l.length;for(var T=0;T<b;++T){var C=l.charCodeAt(T);(k(),q)[h>>>1>>>0]=C,h+=2}return(k(),q)[h>>>1>>>0]=0,h-y},Rg=l=>2*l.length,Ng=(l,h,b)=>{var y="";l>>>=2;for(var T=0;!(T>=h/4);T++){var C=(k(),B)[l+T>>>0];if(!C&&!b)break;y+=String.fromCodePoint(C)}return y},Bg=(l,h,b)=>{if(h>>>=0,b??=2147483647,4>b)return 0;var y=h;b=y+b-4;for(var T=0;T<l.length;++T){var C=l.codePointAt(T);if(65535<C&&T++,(k(),M)[h>>>2>>>0]=C,(h+=4)+4>b)break}return(k(),M)[h>>>2>>>0]=0,h-y},Dg=l=>{for(var h=0,b=0;b<l.length;++b)65535<l.codePointAt(b)&&b++,h+=4;return h};function Pg(l,h,b){if(l>>>=0,h>>>=0,b=ot(b>>>=0),h===2)var y=Mg,T=Og,C=Rg;else y=Ng,T=Bg,C=Dg;ct(l,{name:b,Oc:A=>{var D=(k(),B)[A>>>2>>>0];return D=y(A+4,D*h,!0),lt(A),D},Vc:(A,D)=>{if(typeof D!="string")throw new Jt(`Cannot pass non-string to C++ string type ${b}`);var j=C(D),Q=pr(4+j+h);return(k(),B)[Q>>>2>>>0]=j/h,T(D,Q+4,j+h),A!==null&&A.push(lt,Q),Q},Uc:Bn,Wc(A){lt(A)}})}function Ug(l,h){ct(l>>>=0,{zd:!0,name:h=ot(h>>>0),Oc:()=>{},Vc:()=>{}})}function Lg(l){Vn(l>>>0,!n,1,!r,131072,!1),os()}var Br=l=>{if(!E)try{if(l(),!(0<st))try{i?Fr()&&Hn(m):zn(m)}catch(h){h instanceof W||h=="unwind"||d(0,h)}}catch(h){h instanceof W||h=="unwind"||d(0,h)}},qg=!Atomics.waitAsync||globalThis.navigator?.userAgent&&91>Number((navigator.userAgent.match(/Chrom(e|ium)\/([0-9]+)\./)||[])[2]);function Dn(l){l>>>=0,qg||(Atomics.waitAsync((k(),M),l>>>2,l).value.then(Dr),l+=128,Atomics.store((k(),M),l>>>2,1))}var Dr=()=>Br(()=>{var l=Fr();l&&(Dn(l),ao())});function Wg(l,h){(l>>>=0)==h>>>0?setTimeout(Dr):i?postMessage({Zc:l,Sc:"checkMailbox"}):(l=zt[l])&&l.postMessage({Sc:"checkMailbox"})}var Pn=[];function Fg(l,h,b,y,T){for(h>>>=0,T>>>=0,Pn.length=0,b=T>>>3,y=T+y>>>3;b<y;){var C;C=(k(),Y)[b++>>>0]?(k(),Y)[b++>>>0]:(k(),J)[b++>>>0],Pn.push(C)}return(h?Zn[h]:O0[l])(...Pn)}var Gg=()=>{st=0};function Vg(l){l>>>=0,i?postMessage({Sc:"cleanupThread",Nd:l}):ss(zt[l])}function Hg(l){}var Pr=l=>{try{l()}catch(h){K(h)}};function jg(l){var h=(...b)=>{Ur.push(l);try{return l(...b)}finally{E||(Ur.pop(),ut&&$t===1&&Ur.length===0&&($t=0,st+=1,Pr(Ko),typeof Fibers<"u"&&Fibers.Zd()))}};return Ns.set(l,h),h}var $t=0,ut=null,Os=0,Ur=[],Un=new Map,Rs=new Map,Ns=new Map,Kg=0,Ln=null,Xg=[],Bs=l=>(function(h){if(!E){if($t===0){var b=!1,y=!1;h((T=0)=>{if(!E&&(Os=T,b=!0,y)){$t=2,Pr(()=>Xo(ut)),typeof MainLoop<"u"&&MainLoop.ud&&MainLoop.resume(),T=!1;try{var C=(function(){var j=(k(),M)[ut+8>>>2>>>0];return j=Rs.get(j),j=Ns.get(j),--st,j()})()}catch(j){C=j,T=!0}var A=!1;if(!ut){var D=Ln;D&&(Ln=null,(T?D.reject:D.resolve)(C),A=!0)}if(T&&!A)throw C}}),y=!0,b||($t=1,ut=(function(){var T=pr(65548),C=T+12;if((k(),B)[T>>>2>>>0]=C,(k(),B)[T+4>>>2>>>0]=C+65536,C=Ur[0],!Un.has(C)){var A=Kg++;Un.set(C,A),Rs.set(A,C)}return C=Un.get(C),(k(),M)[T+8>>>2>>>0]=C,T})(),typeof MainLoop<"u"&&MainLoop.ud&&MainLoop.pause(),Pr(()=>jo(ut)))}else $t===2?($t=0,Pr(Zo),lt(ut),ut=null,Xg.forEach(Br)):K(`invalid state: ${$t}`);return Os}})(h=>{l().then(h)});function Zg(l){return l>>>=0,Bs(async()=>{var h=await He(l);return Ze(h)})}var qn=[],Yg=l=>{var h=qn.length;return qn.push(l),h},Qg=(l,h)=>{for(var b=Array(l),y=0;y<l;++y){var T=y,C=(k(),B)[h+4*y>>>2>>>0],A=Rn[C];if(A===void 0)throw l=`parameter ${y}`,C=Js(C),h=ot(C),lt(C),new Jt(`${l} has unknown type ${h}`);b[T]=A}return b},Jg=(l,h,b)=>{var y=[];return l=l(y,b),y.length&&((k(),B)[h>>>2>>>0]=Ze(y)),l},e0={},Lr=l=>{var h=e0[l];return h===void 0?ot(l):h};function t0(l,h,b){var[y,...T]=Qg(l,h>>>0);h=y.Vc.bind(y);var C=T.map(j=>j.Uc.bind(j));l--;var A={toValue:He};switch(l=C.map((j,Q)=>{var oe=`argFromPtr${Q}`;return A[oe]=j,`${oe}(args${Q?"+"+8*Q:""})`}),b){case 0:var D="toValue(handle)";break;case 2:D="new (toValue(handle))";break;case 3:D="";break;case 1:A.getStringOrSymbol=Lr,D="toValue(handle)[getStringOrSymbol(methodName)]"}return D+=`(${l})`,y.zd||(A.toReturnWire=h,A.emval_returnValue=Jg,D=`return emval_returnValue(toReturnWire, destructorsRef, ${D})`),D=`return function (handle, methodName, destructorsRef, args) {
  ${D}
  }`,b=new Function(Object.keys(A),D)(...Object.values(A)),D=`methodCaller<(${T.map(j=>j.name)}) => ${y.name}>`,Yg(Object.defineProperty(b,"name",{value:D}))}function r0(l,h){return h>>>=0,(l=He(l>>>0))==He(h)}function n0(l){return(l>>>=0)?(l=Lr(l),Ze(globalThis[l])):Ze(globalThis)}function i0(l){return l=Lr(l>>>0),Ze(t[l])}function a0(l,h){return h>>>=0,l=He(l>>>0),h=He(h),Ze(l[h])}function s0(l){9<(l>>>=0)&&(At[l+1]+=1)}function Ds(l,h,b,y,T){return qn[l>>>0](h>>>0,b>>>0,y>>>0,T>>>0)}function o0(l,h,b,y,T){return Ds(l>>>0,h>>>0,b>>>0,y>>>0,T>>>0)}function u0(){return Ze([])}function l0(l){l=He(l>>>0);for(var h=Array(l.length),b=0;b<l.length;b++)h[b]=l[b];return Ze(h)}function d0(l){return Ze(Lr(l>>>0))}function p0(){return Ze({})}function c0(l){for(var h=He(l>>>=0);h.length;){var b=h.pop();h.pop()(b)}Nn(l)}function h0(l,h,b){h>>>=0,b>>>=0,l=He(l>>>0),h=He(h),b=He(b),l[h]=b}function f0(l,h){l=-9007199254740992>l||9007199254740992<l?NaN:Number(l),h>>>=0,l=new Date(1e3*l),(k(),M)[h>>>2>>>0]=l.getUTCSeconds(),(k(),M)[h+4>>>2>>>0]=l.getUTCMinutes(),(k(),M)[h+8>>>2>>>0]=l.getUTCHours(),(k(),M)[h+12>>>2>>>0]=l.getUTCDate(),(k(),M)[h+16>>>2>>>0]=l.getUTCMonth(),(k(),M)[h+20>>>2>>>0]=l.getUTCFullYear()-1900,(k(),M)[h+24>>>2>>>0]=l.getUTCDay(),l=(l.getTime()-Date.UTC(l.getUTCFullYear(),0,1,0,0,0,0))/864e5|0,(k(),M)[h+28>>>2>>>0]=l}var Ps=l=>l%4==0&&(l%100!=0||l%400==0),Us=[0,31,60,91,121,152,182,213,244,274,305,335],Ls=[0,31,59,90,120,151,181,212,243,273,304,334];function m0(l,h){l=-9007199254740992>l||9007199254740992<l?NaN:Number(l),h>>>=0,l=new Date(1e3*l),(k(),M)[h>>>2>>>0]=l.getSeconds(),(k(),M)[h+4>>>2>>>0]=l.getMinutes(),(k(),M)[h+8>>>2>>>0]=l.getHours(),(k(),M)[h+12>>>2>>>0]=l.getDate(),(k(),M)[h+16>>>2>>>0]=l.getMonth(),(k(),M)[h+20>>>2>>>0]=l.getFullYear()-1900,(k(),M)[h+24>>>2>>>0]=l.getDay();var b=(Ps(l.getFullYear())?Us:Ls)[l.getMonth()]+l.getDate()-1|0;(k(),M)[h+28>>>2>>>0]=b,(k(),M)[h+36>>>2>>>0]=-60*l.getTimezoneOffset(),b=new Date(l.getFullYear(),6,1).getTimezoneOffset();var y=new Date(l.getFullYear(),0,1).getTimezoneOffset();l=0|(b!=y&&l.getTimezoneOffset()==Math.min(y,b)),(k(),M)[h+32>>>2>>>0]=l}function g0(l){l>>>=0;var h=new Date((k(),M)[l+20>>>2>>>0]+1900,(k(),M)[l+16>>>2>>>0],(k(),M)[l+12>>>2>>>0],(k(),M)[l+8>>>2>>>0],(k(),M)[l+4>>>2>>>0],(k(),M)[l>>>2>>>0],0),b=(k(),M)[l+32>>>2>>>0],y=h.getTimezoneOffset(),T=new Date(h.getFullYear(),6,1).getTimezoneOffset(),C=new Date(h.getFullYear(),0,1).getTimezoneOffset(),A=Math.min(C,T);return 0>b?(k(),M)[l+32>>>2>>>0]=+(T!=C&&A==y):0<b!=(A==y)&&(T=Math.max(C,T),h.setTime(h.getTime()+6e4*((0<b?A:T)-y))),(k(),M)[l+24>>>2>>>0]=h.getDay(),b=(Ps(h.getFullYear())?Us:Ls)[h.getMonth()]+h.getDate()-1|0,(k(),M)[l+28>>>2>>>0]=b,(k(),M)[l>>>2>>>0]=h.getSeconds(),(k(),M)[l+4>>>2>>>0]=h.getMinutes(),(k(),M)[l+8>>>2>>>0]=h.getHours(),(k(),M)[l+12>>>2>>>0]=h.getDate(),(k(),M)[l+16>>>2>>>0]=h.getMonth(),(k(),M)[l+20>>>2>>>0]=h.getYear(),l=h.getTime(),BigInt(isNaN(l)?-1:l/1e3)}function qs(l,h,b,y,T,C,A){return i?Ee(16,1,l,h,b,y,T,C,A):-52}function Ws(l,h,b,y,T,C){if(i)return Ee(17,1,l,h,b,y,T,C)}var dr={},y0=()=>performance.timeOrigin+performance.now();function Fs(l,h){if(i)return Ee(18,1,l,h);if(dr[l]&&(clearTimeout(dr[l].id),delete dr[l]),!h)return 0;var b=setTimeout(()=>{delete dr[l],Br(()=>io(l,performance.timeOrigin+performance.now()))},h);return dr[l]={id:b,Yd:h},0}function _0(l,h,b,y){l>>>=0,h>>>=0,b>>>=0,y>>>=0;var T=new Date().getFullYear(),C=new Date(T,0,1).getTimezoneOffset();T=new Date(T,6,1).getTimezoneOffset();var A=Math.max(C,T);(k(),B)[l>>>2>>>0]=60*A,(k(),M)[h>>>2>>>0]=+(C!=T),l=(h=D=>{var j=Math.abs(D);return`UTC${0<=D?"-":"+"}${String(Math.floor(j/60)).padStart(2,"0")}${String(j%60).padStart(2,"0")}`})(C),h=h(T),T<C?(wt(l,b,17),wt(h,y,17)):(wt(l,y,17),wt(h,b,17))}var b0=()=>Date.now();function w0(l,h,b){return b>>>=0,0<=l&&3>=l?(l===0?l=Date.now():l=performance.timeOrigin+performance.now(),l=Math.round(1e6*l),(k(),Y)[b>>>3>>>0]=BigInt(l),0):28}var Wn=[],Gs=(l,h)=>{Wn.length=0;for(var b;b=(k(),F)[l++>>>0];){var y=b!=105;h+=(y&=b!=112)&&h%8?4:0,Wn.push(b==112?(k(),B)[h>>>2>>>0]:b==106?(k(),Y)[h>>>3>>>0]:b==105?(k(),M)[h>>>2>>>0]:(k(),J)[h>>>3>>>0]),h+=y?8:4}return Wn};function $0(l,h,b){return l>>>=0,h=Gs(h>>>0,b>>>0),Zn[l](...h)}function v0(l,h,b){return l>>>=0,h=Gs(h>>>0,b>>>0),Zn[l](...h)}var x0=()=>{};function S0(l,h){return I(Me(l>>>0,h>>>0))}var k0=()=>{throw st+=1,"unwind"};function T0(){return 4294901760}var I0=()=>navigator.hardwareConcurrency,Mt={},qr=l=>{var h;return(h=/\bwasm-function\[\d+\]:(0x[0-9a-f]+)/.exec(l))?+h[1]:(h=/:(\d+):\d+(?:\)|$)/.exec(l))?2147483648|+h[1]:0},Vs=l=>{for(var h of l)(l=qr(h))&&(Mt[l]=h)};function E0(){var l=Error().stack.toString().split(`
`);return l[0]=="Error"&&l.shift(),Vs(l),Mt.gd=qr(l[3]),Mt.Jd=l,Mt.gd}function Wr(l){if(!(l=Mt[l>>>0]))return 0;var h;if(h=/^\s+at .*\.wasm\.(.*) \(.*\)$/.exec(l))l=h[1];else if(h=/^\s+at (.*) \(.*\)$/.exec(l))l=h[1];else{if(!(h=/^(.+?)@/.exec(l)))return 0;l=h[1]}lt(Wr.hd??0),h=Nr(l)+1;var b=pr(h);return b&&wt(l,b,h),Wr.hd=b,Wr.hd}function C0(l){l>>>=0;var h=(k(),F).length;if(l<=h||4294901760<l)return!1;for(var b=1;4>=b;b*=2){var y=h*(1+.2/b);y=Math.min(y,l+100663296);e:{y=(Math.min(4294901760,65536*Math.ceil(Math.max(l,y)/65536))-bt.buffer.byteLength+65535)/65536|0;try{bt.grow(y),ee();var T=1;break e}catch{}T=void 0}if(T)return!0}return!1}function z0(l,h,b){if(l>>>=0,h>>>=0,Mt.gd==l)var y=Mt.Jd;else(y=Error().stack.toString().split(`
`))[0]=="Error"&&y.shift(),Vs(y);for(var T=3;y[T]&&qr(y[T])!=l;)++T;for(l=0;l<b&&y[l+T];++l)(k(),M)[h+4*l>>>2>>>0]=qr(y[l+T]);return l}var Fn,Gn={},Hs=()=>{if(!Fn){var l,h={USER:"web_user",LOGNAME:"web_user",PATH:"/",PWD:"/",HOME:"/home/web_user",LANG:(globalThis.navigator?.language??"C").replace("-","_")+".UTF-8",_:"./this.program"};for(l in Gn)Gn[l]===void 0?delete h[l]:h[l]=Gn[l];var b=[];for(l in h)b.push(`${l}=${h[l]}`);Fn=b}return Fn};function js(l,h){if(i)return Ee(19,1,l,h);l>>>=0,h>>>=0;var b,y=0,T=0;for(b of Hs()){var C=h+y;(k(),B)[l+T>>>2>>>0]=C,y+=wt(b,C,1/0)+1,T+=4}return 0}function Ks(l,h){if(i)return Ee(20,1,l,h);l>>>=0,h>>>=0;var b=Hs();for(var y of((k(),B)[l>>>2>>>0]=b.length,l=0,b))l+=Nr(y)+1;return(k(),B)[h>>>2>>>0]=l,0}function Xs(l){return i?Ee(21,1,l):52}function Zs(l,h,b,y){return i?Ee(22,1,l,h,b,y):52}function Ys(l,h,b,y){return i?Ee(23,1,l,h,b,y):70}var A0=[null,[],[]];function Qs(l,h,b,y){if(i)return Ee(24,1,l,h,b,y);h>>>=0,b>>>=0,y>>>=0;for(var T=0,C=0;C<b;C++){var A=(k(),B)[h>>>2>>>0],D=(k(),B)[h+4>>>2>>>0];h+=8;for(var j=0;j<D;j++){var Q=l,oe=(k(),F)[A+j>>>0],ge=A0[Q];oe===0||oe===10?((Q===1?x:I)(gs(ge)),ge.length=0):ge.push(oe)}T+=D}return(k(),B)[y>>>2>>>0]=T,0}function M0(l){return l>>>0}i||(function(){for(var l=t.numThreads-1;l--;)ls();me.push(async()=>{var h=(async function(){if(!i)return Promise.all(_t.map(us))})();Te++,await h,--Te==0&&Pe&&(h=Pe,Pe=null,h())})})(),i||(bt=new WebAssembly.Memory({initial:256,maximum:65536,shared:!0}),ee()),t.wasmBinary&&(f=t.wasmBinary),t.stackSave=()=>le(),t.stackRestore=l=>ue(l),t.stackAlloc=l=>jn(l),t.setValue=function(l,h,b="i8"){switch(b.endsWith("*")&&(b="*"),b){case"i1":case"i8":(k(),O)[l>>>0]=h;break;case"i16":(k(),q)[l>>>1>>>0]=h;break;case"i32":(k(),M)[l>>>2>>>0]=h;break;case"i64":(k(),Y)[l>>>3>>>0]=BigInt(h);break;case"float":(k(),G)[l>>>2>>>0]=h;break;case"double":(k(),J)[l>>>3>>>0]=h;break;case"*":(k(),B)[l>>>2>>>0]=h;break;default:K(`invalid type for setValue: ${b}`)}},t.getValue=function(l,h="i8"){switch(h.endsWith("*")&&(h="*"),h){case"i1":case"i8":return(k(),O)[l>>>0];case"i16":return(k(),q)[l>>>1>>>0];case"i32":return(k(),M)[l>>>2>>>0];case"i64":return(k(),Y)[l>>>3>>>0];case"float":return(k(),G)[l>>>2>>>0];case"double":return(k(),J)[l>>>3>>>0];case"*":return(k(),B)[l>>>2>>>0];default:K(`invalid type for getValue: ${h}`)}},t.UTF8ToString=Me,t.stringToUTF8=wt,t.lengthBytesUTF8=Nr;var Js,eo,Fr,lt,pr,Vn,to,ro,no,Hn,io,ao,de,cr,so,ue,jn,le,oo,Kn,uo,lo,po,Xn,co,ho,fo,mo,go,yo,_o,bo,wo,$o,vo,xo,So,ko,To,Io,Eo,Co,zo,Ao,Mo,Oo,Ro,No,Bo,Do,Po,Uo,Lo,qo,Wo,Fo,Go,Vo,Ho,jo,Ko,Xo,Zo,ht,O0=[Cn,is,cs,ys,_s,bs,ws,$s,vs,xs,Ss,ks,Ts,Is,Es,Cs,qs,Ws,Fs,js,Ks,Xs,Zs,Ys,Qs],Zn={1003524:(l,h,b,y,T)=>{if(t===void 0||!t.Xc)return 1;if((l=Me(Number(l>>>0))).startsWith("./")&&(l=l.substring(2)),!(l=t.Xc.get(l)))return 2;if(h=Number(h>>>0),b=Number(b>>>0),y=Number(y>>>0),h+b>l.byteLength)return 3;try{let C=l.subarray(h,h+b);switch(T){case 0:(k(),F).set(C,y>>>0);break;case 1:t.Qd?t.Qd(y,C):t.Id(y,C);break;default:return 4}return 0}catch{return 4}},1004348:(l,h,b)=>{t.td(l,(k(),F).subarray(h>>>0,h+b>>>0))},1004412:()=>t.Sd(),1004454:l=>{t.sd(l)},1004491:()=>{t.Bd()},1004522:()=>{t.Cd()},1004551:()=>{t.Gd()},1004576:l=>t.Ad(l),1004609:l=>t.Ed(l),1004641:(l,h,b)=>{t.ed(Number(l),Number(h),Number(b),!0)},1004704:(l,h,b)=>{t.ed(Number(l),Number(h),Number(b))},1004761:()=>typeof wasmOffsetConverter<"u",1004818:l=>{t.$b("Abs",l,void 0)},1004869:l=>{t.$b("Neg",l,void 0)},1004920:l=>{t.$b("Floor",l,void 0)},1004973:l=>{t.$b("Ceil",l,void 0)},1005025:l=>{t.$b("Reciprocal",l,void 0)},1005083:l=>{t.$b("Sqrt",l,void 0)},1005135:l=>{t.$b("Exp",l,void 0)},1005186:l=>{t.$b("Erf",l,void 0)},1005237:l=>{t.$b("Sigmoid",l,void 0)},1005292:(l,h,b)=>{t.$b("HardSigmoid",l,{alpha:h,beta:b})},1005371:l=>{t.$b("Log",l,void 0)},1005422:l=>{t.$b("Sin",l,void 0)},1005473:l=>{t.$b("Cos",l,void 0)},1005524:l=>{t.$b("Tan",l,void 0)},1005575:l=>{t.$b("Asin",l,void 0)},1005627:l=>{t.$b("Acos",l,void 0)},1005679:l=>{t.$b("Atan",l,void 0)},1005731:l=>{t.$b("Sinh",l,void 0)},1005783:l=>{t.$b("Cosh",l,void 0)},1005835:l=>{t.$b("Asinh",l,void 0)},1005888:l=>{t.$b("Acosh",l,void 0)},1005941:l=>{t.$b("Atanh",l,void 0)},1005994:l=>{t.$b("Tanh",l,void 0)},1006046:l=>{t.$b("Not",l,void 0)},1006097:(l,h,b)=>{t.$b("Clip",l,{min:h,max:b})},1006166:l=>{t.$b("Clip",l,void 0)},1006218:(l,h)=>{t.$b("Elu",l,{alpha:h})},1006276:l=>{t.$b("Gelu",l,void 0)},1006328:l=>{t.$b("Relu",l,void 0)},1006380:(l,h)=>{t.$b("LeakyRelu",l,{alpha:h})},1006444:(l,h)=>{t.$b("ThresholdedRelu",l,{alpha:h})},1006514:(l,h)=>{t.$b("Cast",l,{to:h})},1006572:l=>{t.$b("Add",l,void 0)},1006623:l=>{t.$b("Sub",l,void 0)},1006674:l=>{t.$b("Mul",l,void 0)},1006725:l=>{t.$b("Div",l,void 0)},1006776:l=>{t.$b("Pow",l,void 0)},1006827:l=>{t.$b("Equal",l,void 0)},1006880:l=>{t.$b("Greater",l,void 0)},1006935:l=>{t.$b("GreaterOrEqual",l,void 0)},1006997:l=>{t.$b("Less",l,void 0)},1007049:l=>{t.$b("LessOrEqual",l,void 0)},1007108:(l,h,b,y,T)=>{t.$b("ReduceMean",l,{keepDims:!!h,noopWithEmptyAxes:!!b,axes:y?Array.from((k(),M).subarray(Number(y)>>>0,Number(T)>>>0)):[]})},1007283:(l,h,b,y,T)=>{t.$b("ReduceMax",l,{keepDims:!!h,noopWithEmptyAxes:!!b,axes:y?Array.from((k(),M).subarray(Number(y)>>>0,Number(T)>>>0)):[]})},1007457:(l,h,b,y,T)=>{t.$b("ReduceMin",l,{keepDims:!!h,noopWithEmptyAxes:!!b,axes:y?Array.from((k(),M).subarray(Number(y)>>>0,Number(T)>>>0)):[]})},1007631:(l,h,b,y,T)=>{t.$b("ReduceProd",l,{keepDims:!!h,noopWithEmptyAxes:!!b,axes:y?Array.from((k(),M).subarray(Number(y)>>>0,Number(T)>>>0)):[]})},1007806:(l,h,b,y,T)=>{t.$b("ReduceSum",l,{keepDims:!!h,noopWithEmptyAxes:!!b,axes:y?Array.from((k(),M).subarray(Number(y)>>>0,Number(T)>>>0)):[]})},1007980:(l,h,b,y,T)=>{t.$b("ReduceL1",l,{keepDims:!!h,noopWithEmptyAxes:!!b,axes:y?Array.from((k(),M).subarray(Number(y)>>>0,Number(T)>>>0)):[]})},1008153:(l,h,b,y,T)=>{t.$b("ReduceL2",l,{keepDims:!!h,noopWithEmptyAxes:!!b,axes:y?Array.from((k(),M).subarray(Number(y)>>>0,Number(T)>>>0)):[]})},1008326:(l,h,b,y,T)=>{t.$b("ReduceLogSum",l,{keepDims:!!h,noopWithEmptyAxes:!!b,axes:y?Array.from((k(),M).subarray(Number(y)>>>0,Number(T)>>>0)):[]})},1008503:(l,h,b,y,T)=>{t.$b("ReduceSumSquare",l,{keepDims:!!h,noopWithEmptyAxes:!!b,axes:y?Array.from((k(),M).subarray(Number(y)>>>0,Number(T)>>>0)):[]})},1008683:(l,h,b,y,T)=>{t.$b("ReduceLogSumExp",l,{keepDims:!!h,noopWithEmptyAxes:!!b,axes:y?Array.from((k(),M).subarray(Number(y)>>>0,Number(T)>>>0)):[]})},1008863:l=>{t.$b("Where",l,void 0)},1008916:(l,h,b)=>{t.$b("Transpose",l,{perm:h?Array.from((k(),M).subarray(Number(h)>>>0,Number(b)>>>0)):[]})},1009040:(l,h,b,y)=>{t.$b("DepthToSpace",l,{blocksize:h,mode:Me(b),format:y?"NHWC":"NCHW"})},1009173:(l,h,b,y)=>{t.$b("DepthToSpace",l,{blocksize:h,mode:Me(b),format:y?"NHWC":"NCHW"})},1009306:(l,h,b,y,T,C,A,D,j,Q,oe,ge,we,ke,vt)=>{t.$b("ConvTranspose",l,{format:j?"NHWC":"NCHW",autoPad:h,dilations:[b],group:y,kernelShape:[T],pads:[C,A],strides:[D],wIsConst:()=>!!(k(),O)[Q>>>0],outputPadding:oe?Array.from((k(),M).subarray(Number(oe)>>>0,Number(ge)>>>0)):[],outputShape:we?Array.from((k(),M).subarray(Number(we)>>>0,Number(ke)>>>0)):[],activation:Me(vt)})},1009739:(l,h,b,y,T,C,A,D,j,Q,oe,ge,we,ke)=>{t.$b("ConvTranspose",l,{format:D?"NHWC":"NCHW",autoPad:h,dilations:Array.from((k(),M).subarray(Number(b)>>>0,(Number(b)>>>0)+2>>>0)),group:y,kernelShape:Array.from((k(),M).subarray(Number(T)>>>0,(Number(T)>>>0)+2>>>0)),pads:Array.from((k(),M).subarray(Number(C)>>>0,(Number(C)>>>0)+4>>>0)),strides:Array.from((k(),M).subarray(Number(A)>>>0,(Number(A)>>>0)+2>>>0)),wIsConst:()=>!!(k(),O)[j>>>0],outputPadding:Q?Array.from((k(),M).subarray(Number(Q)>>>0,Number(oe)>>>0)):[],outputShape:ge?Array.from((k(),M).subarray(Number(ge)>>>0,Number(we)>>>0)):[],activation:Me(ke)})},1010400:(l,h,b,y,T,C,A,D,j,Q,oe,ge,we,ke,vt)=>{t.$b("ConvTranspose",l,{format:j?"NHWC":"NCHW",autoPad:h,dilations:[b],group:y,kernelShape:[T],pads:[C,A],strides:[D],wIsConst:()=>!!(k(),O)[Q>>>0],outputPadding:oe?Array.from((k(),M).subarray(Number(oe)>>>0,Number(ge)>>>0)):[],outputShape:we?Array.from((k(),M).subarray(Number(we)>>>0,Number(ke)>>>0)):[],activation:Me(vt)})},1010833:(l,h,b,y,T,C,A,D,j,Q,oe,ge,we,ke)=>{t.$b("ConvTranspose",l,{format:D?"NHWC":"NCHW",autoPad:h,dilations:Array.from((k(),M).subarray(Number(b)>>>0,(Number(b)>>>0)+2>>>0)),group:y,kernelShape:Array.from((k(),M).subarray(Number(T)>>>0,(Number(T)>>>0)+2>>>0)),pads:Array.from((k(),M).subarray(Number(C)>>>0,(Number(C)>>>0)+4>>>0)),strides:Array.from((k(),M).subarray(Number(A)>>>0,(Number(A)>>>0)+2>>>0)),wIsConst:()=>!!(k(),O)[j>>>0],outputPadding:Q?Array.from((k(),M).subarray(Number(Q)>>>0,Number(oe)>>>0)):[],outputShape:ge?Array.from((k(),M).subarray(Number(ge)>>>0,Number(we)>>>0)):[],activation:Me(ke)})},1011494:(l,h)=>{t.$b("GlobalAveragePool",l,{format:h?"NHWC":"NCHW"})},1011585:(l,h,b,y,T,C,A,D,j,Q,oe,ge,we,ke)=>{t.$b("AveragePool",l,{format:ke?"NHWC":"NCHW",auto_pad:h,ceil_mode:b,count_include_pad:y,storage_order:T,dilations:C?Array.from((k(),M).subarray(Number(C)>>>0,Number(A)>>>0)):[],kernel_shape:D?Array.from((k(),M).subarray(Number(D)>>>0,Number(j)>>>0)):[],pads:Q?Array.from((k(),M).subarray(Number(Q)>>>0,Number(oe)>>>0)):[],strides:ge?Array.from((k(),M).subarray(Number(ge)>>>0,Number(we)>>>0)):[]})},1012064:(l,h)=>{t.$b("GlobalAveragePool",l,{format:h?"NHWC":"NCHW"})},1012155:(l,h,b,y,T,C,A,D,j,Q,oe,ge,we,ke)=>{t.$b("AveragePool",l,{format:ke?"NHWC":"NCHW",auto_pad:h,ceil_mode:b,count_include_pad:y,storage_order:T,dilations:C?Array.from((k(),M).subarray(Number(C)>>>0,Number(A)>>>0)):[],kernel_shape:D?Array.from((k(),M).subarray(Number(D)>>>0,Number(j)>>>0)):[],pads:Q?Array.from((k(),M).subarray(Number(Q)>>>0,Number(oe)>>>0)):[],strides:ge?Array.from((k(),M).subarray(Number(ge)>>>0,Number(we)>>>0)):[]})},1012634:(l,h)=>{t.$b("GlobalMaxPool",l,{format:h?"NHWC":"NCHW"})},1012721:(l,h,b,y,T,C,A,D,j,Q,oe,ge,we,ke)=>{t.$b("MaxPool",l,{format:ke?"NHWC":"NCHW",auto_pad:h,ceil_mode:b,count_include_pad:y,storage_order:T,dilations:C?Array.from((k(),M).subarray(Number(C)>>>0,Number(A)>>>0)):[],kernel_shape:D?Array.from((k(),M).subarray(Number(D)>>>0,Number(j)>>>0)):[],pads:Q?Array.from((k(),M).subarray(Number(Q)>>>0,Number(oe)>>>0)):[],strides:ge?Array.from((k(),M).subarray(Number(ge)>>>0,Number(we)>>>0)):[]})},1013196:(l,h)=>{t.$b("GlobalMaxPool",l,{format:h?"NHWC":"NCHW"})},1013283:(l,h,b,y,T,C,A,D,j,Q,oe,ge,we,ke)=>{t.$b("MaxPool",l,{format:ke?"NHWC":"NCHW",auto_pad:h,ceil_mode:b,count_include_pad:y,storage_order:T,dilations:C?Array.from((k(),M).subarray(Number(C)>>>0,Number(A)>>>0)):[],kernel_shape:D?Array.from((k(),M).subarray(Number(D)>>>0,Number(j)>>>0)):[],pads:Q?Array.from((k(),M).subarray(Number(Q)>>>0,Number(oe)>>>0)):[],strides:ge?Array.from((k(),M).subarray(Number(ge)>>>0,Number(we)>>>0)):[]})},1013758:(l,h,b,y,T)=>{t.$b("Gemm",l,{alpha:h,beta:b,transA:y,transB:T})},1013862:l=>{t.$b("MatMul",l,void 0)},1013916:(l,h,b,y)=>{t.$b("ArgMax",l,{keepDims:!!h,selectLastIndex:!!b,axis:y})},1014024:(l,h,b,y)=>{t.$b("ArgMin",l,{keepDims:!!h,selectLastIndex:!!b,axis:y})},1014132:(l,h)=>{t.$b("Softmax",l,{axis:h})},1014195:(l,h)=>{t.$b("Concat",l,{axis:h})},1014255:(l,h,b,y,T)=>{t.$b("Split",l,{axis:h,numOutputs:b,splitSizes:y?Array.from((k(),M).subarray(Number(y)>>>0,Number(T)>>>0)):[]})},1014411:l=>{t.$b("Expand",l,void 0)},1014465:(l,h)=>{t.$b("Gather",l,{axis:Number(h)})},1014536:(l,h)=>{t.$b("GatherElements",l,{axis:Number(h)})},1014615:(l,h)=>{t.$b("GatherND",l,{batch_dims:Number(h)})},1014694:(l,h,b,y,T,C,A,D,j,Q,oe)=>{t.$b("Resize",l,{antialias:h,axes:b?Array.from((k(),M).subarray(Number(b)>>>0,Number(y)>>>0)):[],coordinateTransformMode:Me(T),cubicCoeffA:C,excludeOutside:A,extrapolationValue:D,keepAspectRatioPolicy:Me(j),mode:Me(Q),nearestMode:Me(oe)})},1015056:(l,h,b,y,T,C,A)=>{t.$b("Slice",l,{starts:h?Array.from((k(),M).subarray(Number(h)>>>0,Number(b)>>>0)):[],ends:y?Array.from((k(),M).subarray(Number(y)>>>0,Number(T)>>>0)):[],axes:C?Array.from((k(),M).subarray(Number(C)>>>0,Number(A)>>>0)):[]})},1015320:l=>{t.$b("Tile",l,void 0)},1015372:(l,h,b)=>{t.$b("InstanceNormalization",l,{epsilon:h,format:b?"NHWC":"NCHW"})},1015486:(l,h,b)=>{t.$b("InstanceNormalization",l,{epsilon:h,format:b?"NHWC":"NCHW"})},1015600:l=>{t.$b("Range",l,void 0)},1015653:(l,h)=>{t.$b("Einsum",l,{equation:Me(h)})},1015734:(l,h,b,y,T)=>{t.$b("Pad",l,{mode:h,value:b,pads:y?Array.from((k(),M).subarray(Number(y)>>>0,Number(T)>>>0)):[]})},1015877:(l,h,b,y,T,C)=>{t.$b("BatchNormalization",l,{epsilon:h,momentum:b,spatial:!!T,trainingMode:!!y,format:C?"NHWC":"NCHW"})},1016046:(l,h,b,y,T,C)=>{t.$b("BatchNormalization",l,{epsilon:h,momentum:b,spatial:!!T,trainingMode:!!y,format:C?"NHWC":"NCHW"})},1016215:(l,h,b)=>{t.$b("CumSum",l,{exclusive:Number(h),reverse:Number(b)})},1016312:(l,h,b)=>{t.$b("DequantizeLinear",l,{axis:h,blockSize:b})},1016402:(l,h,b,y,T)=>{t.$b("GridSample",l,{align_corners:h,mode:Me(b),padding_mode:Me(y),format:T?"NHWC":"NCHW"})},1016572:(l,h,b,y,T)=>{t.$b("GridSample",l,{align_corners:h,mode:Me(b),padding_mode:Me(y),format:T?"NHWC":"NCHW"})},1016742:(l,h)=>{t.$b("ScatterND",l,{reduction:Me(h)})},1016827:(l,h,b,y,T,C,A,D,j)=>{t.$b("Attention",l,{numHeads:h,isUnidirectional:b,maskFilterValue:y,scale:T,doRotary:C,qkvHiddenSizes:A?Array.from((k(),M).subarray(Number(D)>>>0,Number(D)+A>>>0)):[],pastPresentShareBuffer:!!j})},1017099:l=>{t.$b("BiasAdd",l,void 0)},1017154:l=>{t.$b("BiasSplitGelu",l,void 0)},1017215:l=>{t.$b("FastGelu",l,void 0)},1017271:(l,h,b,y,T,C,A,D,j,Q,oe,ge,we,ke,vt,Yn)=>{t.$b("Conv",l,{format:ge?"NHWC":"NCHW",auto_pad:h,dilations:b?Array.from((k(),M).subarray(Number(b)>>>0,Number(y)>>>0)):[],group:T,kernel_shape:C?Array.from((k(),M).subarray(Number(C)>>>0,Number(A)>>>0)):[],pads:D?Array.from((k(),M).subarray(Number(D)>>>0,Number(j)>>>0)):[],strides:Q?Array.from((k(),M).subarray(Number(Q)>>>0,Number(oe)>>>0)):[],w_is_const:()=>!!(k(),O)[Number(we)>>>0],activation:Me(ke),activation_params:vt?Array.from((k(),G).subarray(Number(vt)>>>0,Number(Yn)>>>0)):[]})},1017855:l=>{t.$b("Gelu",l,void 0)},1017907:(l,h,b,y,T,C,A,D,j)=>{t.$b("GroupQueryAttention",l,{numHeads:h,kvNumHeads:b,scale:y,softcap:T,doRotary:C,rotaryInterleaved:A,smoothSoftmax:D,localWindowSize:j})},1018124:(l,h,b,y)=>{t.$b("LayerNormalization",l,{axis:h,epsilon:b,simplified:!!y})},1018235:(l,h,b,y)=>{t.$b("LayerNormalization",l,{axis:h,epsilon:b,simplified:!!y})},1018346:(l,h,b,y,T,C)=>{t.$b("MatMulNBits",l,{k:h,n:b,accuracyLevel:y,bits:T,blockSize:C})},1018473:(l,h,b,y,T,C)=>{t.$b("MultiHeadAttention",l,{numHeads:h,isUnidirectional:b,maskFilterValue:y,scale:T,doRotary:C})},1018632:(l,h)=>{t.$b("QuickGelu",l,{alpha:h})},1018696:(l,h,b,y,T)=>{t.$b("RotaryEmbedding",l,{interleaved:!!h,numHeads:b,rotaryEmbeddingDim:y,scale:T})},1018835:(l,h,b)=>{t.$b("SkipLayerNormalization",l,{epsilon:h,simplified:!!b})},1018937:(l,h,b)=>{t.$b("SkipLayerNormalization",l,{epsilon:h,simplified:!!b})},1019039:(l,h,b,y)=>{t.$b("GatherBlockQuantized",l,{gatherAxis:h,quantizeAxis:b,blockSize:y})},1019160:l=>{t.Fd(l)},1019194:(l,h)=>t.Hd(Number(l),Number(h),t.Yc.Kd,t.Yc.errors)};function R0(l,h,b){return Bs(async()=>{await t.Dd(Number(l),Number(h),Number(b))})}function N0(){return typeof wasmOffsetConverter<"u"}function B0(l,h,b,y){var T=le();try{return bo(l,h,b,y)}catch(C){if(ue(T),C!==C+0)throw C;de(1,0)}}function D0(l,h,b){var y=le();try{return mo(l,h,b)}catch(T){if(ue(y),T!==T+0)throw T;de(1,0)}}function P0(l){var h=le();try{co(l)}catch(b){if(ue(h),b!==b+0)throw b;de(1,0)}}function U0(l,h){var b=le();try{return Xn(l,h)}catch(y){if(ue(b),y!==y+0)throw y;de(1,0)}}function L0(l,h,b){var y=le();try{po(l,h,b)}catch(T){if(ue(y),T!==T+0)throw T;de(1,0)}}function q0(l,h){var b=le();try{wo(l,h)}catch(y){if(ue(b),y!==y+0)throw y;de(1,0)}}function W0(l,h,b,y,T,C,A){var D=le();try{return yo(l,h,b,y,T,C,A)}catch(j){if(ue(D),j!==j+0)throw j;de(1,0)}}function F0(l,h,b,y,T,C){var A=le();try{ho(l,h,b,y,T,C)}catch(D){if(ue(A),D!==D+0)throw D;de(1,0)}}function G0(l,h,b,y){var T=le();try{_o(l,h,b,y)}catch(C){if(ue(T),C!==C+0)throw C;de(1,0)}}function V0(l,h,b,y,T){var C=le();try{fo(l,h,b,y,T)}catch(A){if(ue(C),A!==A+0)throw A;de(1,0)}}function H0(l,h,b,y,T,C,A){var D=le();try{vo(l,h,b,y,T,C,A)}catch(j){if(ue(D),j!==j+0)throw j;de(1,0)}}function j0(l,h,b,y,T,C,A){var D=le();try{xo(l,h,b,y,T,C,A)}catch(j){if(ue(D),j!==j+0)throw j;de(1,0)}}function K0(l,h,b,y,T,C,A,D){var j=le();try{Io(l,h,b,y,T,C,A,D)}catch(Q){if(ue(j),Q!==Q+0)throw Q;de(1,0)}}function X0(l,h,b,y,T){var C=le();try{return $o(l,h,b,y,T)}catch(A){if(ue(C),A!==A+0)throw A;de(1,0)}}function Z0(l,h,b){var y=le();try{return Eo(l,h,b)}catch(T){if(ue(y),T!==T+0)throw T;de(1,0)}}function Y0(l,h,b,y,T,C,A,D){var j=le();try{Co(l,h,b,y,T,C,A,D)}catch(Q){if(ue(j),Q!==Q+0)throw Q;de(1,0)}}function Q0(l,h,b,y,T,C,A,D,j,Q,oe,ge){var we=le();try{So(l,h,b,y,T,C,A,D,j,Q,oe,ge)}catch(ke){if(ue(we),ke!==ke+0)throw ke;de(1,0)}}function J0(l,h,b,y,T,C){var A=le();try{return ko(l,h,b,y,T,C)}catch(D){if(ue(A),D!==D+0)throw D;de(1,0)}}function ey(l,h,b){var y=le();try{return zo(l,h,b)}catch(T){if(ue(y),T!==T+0)throw T;return de(1,0),0n}}function ty(l,h,b,y,T,C,A,D,j){var Q=le();try{go(l,h,b,y,T,C,A,D,j)}catch(oe){if(ue(Q),oe!==oe+0)throw oe;de(1,0)}}function ry(l){var h=le();try{return Ao(l)}catch(b){if(ue(h),b!==b+0)throw b;de(1,0)}}function ny(l,h){var b=le();try{return Ho(l,h)}catch(y){if(ue(b),y!==y+0)throw y;return de(1,0),0n}}function iy(l){var h=le();try{return Mo(l)}catch(b){if(ue(h),b!==b+0)throw b;return de(1,0),0n}}function ay(l,h,b,y){var T=le();try{return Po(l,h,b,y)}catch(C){if(ue(T),C!==C+0)throw C;de(1,0)}}function sy(l,h,b,y,T){var C=le();try{return Uo(l,h,b,y,T)}catch(A){if(ue(C),A!==A+0)throw A;de(1,0)}}function oy(l,h,b,y,T,C){var A=le();try{return Lo(l,h,b,y,T,C)}catch(D){if(ue(A),D!==D+0)throw D;de(1,0)}}function uy(l,h,b,y,T,C){var A=le();try{return qo(l,h,b,y,T,C)}catch(D){if(ue(A),D!==D+0)throw D;de(1,0)}}function ly(l,h,b,y,T,C,A,D){var j=le();try{return To(l,h,b,y,T,C,A,D)}catch(Q){if(ue(j),Q!==Q+0)throw Q;de(1,0)}}function dy(l,h,b,y,T){var C=le();try{return Wo(l,h,b,y,T)}catch(A){if(ue(C),A!==A+0)throw A;return de(1,0),0n}}function py(l,h,b,y){var T=le();try{return Fo(l,h,b,y)}catch(C){if(ue(T),C!==C+0)throw C;de(1,0)}}function cy(l,h,b,y){var T=le();try{return Go(l,h,b,y)}catch(C){if(ue(T),C!==C+0)throw C;de(1,0)}}function hy(l,h,b,y,T,C,A,D,j,Q,oe,ge){var we=le();try{return Vo(l,h,b,y,T,C,A,D,j,Q,oe,ge)}catch(ke){if(ue(we),ke!==ke+0)throw ke;de(1,0)}}function fy(l,h,b,y,T,C,A,D,j,Q,oe){var ge=le();try{Bo(l,h,b,y,T,C,A,D,j,Q,oe)}catch(we){if(ue(ge),we!==we+0)throw we;de(1,0)}}function my(l,h,b,y,T,C,A,D,j,Q,oe,ge,we,ke,vt,Yn){var by=le();try{Do(l,h,b,y,T,C,A,D,j,Q,oe,ge,we,ke,vt,Yn)}catch(Qn){if(ue(by),Qn!==Qn+0)throw Qn;de(1,0)}}function gy(l,h,b){var y=le();try{return Oo(l,h,b)}catch(T){if(ue(y),T!==T+0)throw T;de(1,0)}}function yy(l,h,b){var y=le();try{return Ro(l,h,b)}catch(T){if(ue(y),T!==T+0)throw T;de(1,0)}}function _y(l,h,b,y){var T=le();try{No(l,h,b,y)}catch(C){if(ue(T),C!==C+0)throw C;de(1,0)}}function Gr(){if(0<Te)Pe=Gr;else if(i)_?.(t),Z();else{for(var l=me;0<l.length;)l.shift()(t);0<Te?Pe=Gr:(t.calledRun=!0,E||(Z(),_?.(t)))}}return i||(ht=await Se(),Gr()),t.PTR_SIZE=4,U?t:new Promise((l,h)=>{_=l,v=h})}var Hc,du,q_=V(()=>{Hc=lu,du=globalThis.self?.name?.startsWith("em-pthread"),du&&lu()}),si,oa,pu,We,jc,Kr,cu,hu,oi,fu,ui,Kc,li,Xc,Ma=V(()=>{Aa(),si=typeof location>"u"?void 0:location.origin,oa=import.meta.url>"file:"&&import.meta.url<"file;",pu=()=>{{if(oa){let e=URL;return new URL(new e("ort.bundle.min.mjs",import.meta.url).href,si).href}return import.meta.url}},We=pu(),jc=()=>{if(We&&!We.startsWith("blob:"))return We.substring(0,We.lastIndexOf("/")+1)},Kr=(e,t)=>{try{let r=t??We;return(r?new URL(e,r):new URL(e)).origin===si}catch{return!1}},cu=(e,t)=>{let r=t??We;try{return(r?new URL(e,r):new URL(e)).href}catch{return}},hu=(e,t)=>`${t??"./"}${e}`,oi=async e=>{let t=await(await fetch(e,{credentials:"same-origin"})).blob();return URL.createObjectURL(t)},fu=async e=>(await import(e)).default,ui=(L_(),zr(Fc)).default,Kc=async()=>{if(!We)throw new Error("Failed to load proxy worker: cannot determine the script source URL.");if(Kr(We))return[void 0,ui()];let e=await oi(We);return[e,ui(e)]},li=(q_(),zr(Vc)).default,Xc=async(e,t,r,n)=>{let i=li&&!(e||t);if(i)if(We)i=Kr(We)||n&&!r;else if(n&&!r)i=!0;else throw new Error("cannot determine the script source URL.");if(i)return[void 0,li];{let a="ort-wasm-simd-threaded.jsep.mjs",s=e??cu(a,t),o=r&&s&&!Kr(s,t),u=o?await oi(s):s??hu(a,t);return[o?u:void 0,await fu(u)]}}}),di,Xr,fr,pi,mu,gu,yu,Oa,ve,Zt=V(()=>{Ma(),Xr=!1,fr=!1,pi=!1,mu=()=>{if(typeof SharedArrayBuffer>"u")return!1;try{return typeof MessageChannel<"u"&&new MessageChannel().port1.postMessage(new SharedArrayBuffer(1)),WebAssembly.validate(new Uint8Array([0,97,115,109,1,0,0,0,1,4,1,96,0,0,3,2,1,0,5,4,1,3,1,1,10,11,1,9,0,65,0,254,16,2,0,26,11]))}catch{return!1}},gu=()=>{try{return WebAssembly.validate(new Uint8Array([0,97,115,109,1,0,0,0,1,4,1,96,0,0,3,2,1,0,10,30,1,28,0,65,0,253,15,253,12,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,253,186,1,26,11]))}catch{return!1}},yu=()=>{try{return WebAssembly.validate(new Uint8Array([0,97,115,109,1,0,0,0,1,5,1,96,0,1,123,3,2,1,0,10,19,1,17,0,65,1,253,15,65,2,253,15,65,3,253,15,253,147,2,11]))}catch{return!1}},Oa=async e=>{if(Xr)return Promise.resolve();if(fr)throw new Error("multiple calls to 'initializeWebAssembly()' detected.");if(pi)throw new Error("previous call to 'initializeWebAssembly()' failed.");fr=!0;let t=e.initTimeout,r=e.numThreads;if(e.simd!==!1){if(e.simd==="relaxed"){if(!yu())throw new Error("Relaxed WebAssembly SIMD is not supported in the current environment.")}else if(!gu())throw new Error("WebAssembly SIMD is not supported in the current environment.")}let n=mu();r>1&&!n&&(typeof self<"u"&&!self.crossOriginIsolated&&console.warn("env.wasm.numThreads is set to "+r+", but this will not work unless you enable crossOriginIsolated mode. See https://web.dev/cross-origin-isolation-guide/ for more info."),console.warn("WebAssembly multi-threading is not supported in the current environment. Falling back to single-threading."),e.numThreads=r=1);let i=e.wasmPaths,a=typeof i=="string"?i:void 0,s=i?.mjs,o=s?.href??s,u=i?.wasm,d=u?.href??u,p=e.wasmBinary,[c,f]=await Xc(o,a,r>1,!!p||!!d),g=!1,m=[];if(t>0&&m.push(new Promise(_=>{setTimeout(()=>{g=!0,_()},t)})),m.push(new Promise((_,v)=>{let w={numThreads:r};if(p)w.wasmBinary=p,w.locateFile=$=>$;else if(d||a)w.locateFile=$=>d??a+$;else if(o&&o.indexOf("blob:")!==0)w.locateFile=$=>new URL($,o).href;else if(c){let $=jc();$&&(w.locateFile=S=>$+S)}f(w).then($=>{fr=!1,Xr=!0,di=$,_(),c&&URL.revokeObjectURL(c)},$=>{fr=!1,pi=!0,v($)})})),await Promise.race(m),g)throw new Error(`WebAssembly backend initializing failed due to timeout: ${t}ms`)},ve=()=>{if(Xr&&di)return di;throw new Error("WebAssembly is not initialized yet.")}}),nt,gn,be,Ra=V(()=>{Zt(),nt=(e,t)=>{let r=ve(),n=r.lengthBytesUTF8(e)+1,i=r._malloc(n);return r.stringToUTF8(e,i,n),t.push(i),i},gn=(e,t,r,n)=>{if(typeof e=="object"&&e!==null){if(r.has(e))throw new Error("Circular reference in options");r.add(e)}Object.entries(e).forEach(([i,a])=>{let s=t?t+i:i;if(typeof a=="object")gn(a,s+".",r,n);else if(typeof a=="string"||typeof a=="number")n(s,a.toString());else if(typeof a=="boolean")n(s,a?"1":"0");else throw new Error(`Can't handle extra config type: ${typeof a}`)})},be=e=>{let t=ve(),r=t.stackSave();try{let n=t.PTR_SIZE,i=t.stackAlloc(2*n);t._OrtGetLastError(i,i+n);let a=Number(t.getValue(i,n===4?"i32":"i64")),s=t.getValue(i+n,"*"),o=s?t.UTF8ToString(s):"";throw new Error(`${e} ERROR_CODE: ${a}, ERROR_MESSAGE: ${o}`)}finally{t.stackRestore(r)}}}),Zc,W_=V(()=>{Zt(),Ra(),Zc=e=>{let t=ve(),r=0,n=[],i=e||{};try{if(e?.logSeverityLevel===void 0)i.logSeverityLevel=2;else if(typeof e.logSeverityLevel!="number"||!Number.isInteger(e.logSeverityLevel)||e.logSeverityLevel<0||e.logSeverityLevel>4)throw new Error(`log severity level is not valid: ${e.logSeverityLevel}`);if(e?.logVerbosityLevel===void 0)i.logVerbosityLevel=0;else if(typeof e.logVerbosityLevel!="number"||!Number.isInteger(e.logVerbosityLevel))throw new Error(`log verbosity level is not valid: ${e.logVerbosityLevel}`);e?.terminate===void 0&&(i.terminate=!1);let a=0;return e?.tag!==void 0&&(a=nt(e.tag,n)),r=t._OrtCreateRunOptions(i.logSeverityLevel,i.logVerbosityLevel,!!i.terminate,a),r===0&&be("Can't create run options."),e?.extra!==void 0&&gn(e.extra,"",new WeakSet,(s,o)=>{let u=nt(s,n),d=nt(o,n);t._OrtAddRunConfigEntry(r,u,d)!==0&&be(`Can't set a run config entry: ${s} - ${o}.`)}),[r,n]}catch(a){throw r!==0&&t._OrtReleaseRunOptions(r),n.forEach(s=>t._free(s)),a}}}),_u,bu,wu,Ot,$u,Yc,F_=V(()=>{Zt(),Ra(),_u=e=>{switch(e){case"disabled":return 0;case"basic":return 1;case"extended":return 2;case"layout":return 3;case"all":return 99;default:throw new Error(`unsupported graph optimization level: ${e}`)}},bu=e=>{switch(e){case"sequential":return 0;case"parallel":return 1;default:throw new Error(`unsupported execution mode: ${e}`)}},wu=e=>{e.extra||(e.extra={}),e.extra.session||(e.extra.session={});let t=e.extra.session;t.use_ort_model_bytes_directly||(t.use_ort_model_bytes_directly="1"),e.executionProviders&&e.executionProviders.some(r=>(typeof r=="string"?r:r.name)==="webgpu")&&(e.enableMemPattern=!1)},Ot=(e,t,r,n)=>{let i=nt(t,n),a=nt(r,n);ve()._OrtAddSessionConfigEntry(e,i,a)!==0&&be(`Can't set a session config entry: ${t} - ${r}.`)},$u=async(e,t,r)=>{let n=t.executionProviders;for(let i of n){let a=typeof i=="string"?i:i.name,s=[];switch(a){case"webnn":if(a="WEBNN",Ot(e,"session.disable_quant_qdq","1",r),Ot(e,"session.disable_qdq_constant_folding","1",r),typeof i!="string"){let c=i?.deviceType;c&&Ot(e,"deviceType",c,r)}break;case"webgpu":if(a="JS",typeof i!="string"){let c=i;if(c?.preferredLayout){if(c.preferredLayout!=="NCHW"&&c.preferredLayout!=="NHWC")throw new Error(`preferredLayout must be either 'NCHW' or 'NHWC': ${c.preferredLayout}`);Ot(e,"preferredLayout",c.preferredLayout,r)}}break;case"wasm":case"cpu":continue;default:throw new Error(`not supported execution provider: ${a}`)}let o=nt(a,r),u=s.length,d=0,p=0;if(u>0){d=ve()._malloc(u*ve().PTR_SIZE),r.push(d),p=ve()._malloc(u*ve().PTR_SIZE),r.push(p);for(let c=0;c<u;c++)ve().setValue(d+c*ve().PTR_SIZE,s[c][0],"*"),ve().setValue(p+c*ve().PTR_SIZE,s[c][1],"*")}await ve()._OrtAppendExecutionProvider(e,o,d,p,u)!==0&&be(`Can't append execution provider: ${a}.`)}},Yc=async e=>{let t=ve(),r=0,n=[],i=e||{};wu(i);try{let a=_u(i.graphOptimizationLevel??"all"),s=bu(i.executionMode??"sequential"),o=typeof i.logId=="string"?nt(i.logId,n):0,u=i.logSeverityLevel??2;if(!Number.isInteger(u)||u<0||u>4)throw new Error(`log severity level is not valid: ${u}`);let d=i.logVerbosityLevel??0;if(!Number.isInteger(d)||d<0||d>4)throw new Error(`log verbosity level is not valid: ${d}`);let p=typeof i.optimizedModelFilePath=="string"?nt(i.optimizedModelFilePath,n):0;if(r=t._OrtCreateSessionOptions(a,!!i.enableCpuMemArena,!!i.enableMemPattern,s,!!i.enableProfiling,0,o,u,d,p),r===0&&be("Can't create session options."),i.executionProviders&&await $u(r,i,n),i.enableGraphCapture!==void 0){if(typeof i.enableGraphCapture!="boolean")throw new Error(`enableGraphCapture must be a boolean value: ${i.enableGraphCapture}`);Ot(r,"enableGraphCapture",i.enableGraphCapture.toString(),n)}if(i.freeDimensionOverrides)for(let[c,f]of Object.entries(i.freeDimensionOverrides)){if(typeof c!="string")throw new Error(`free dimension override name must be a string: ${c}`);if(typeof f!="number"||!Number.isInteger(f)||f<0)throw new Error(`free dimension override value must be a non-negative integer: ${f}`);let g=nt(c,n);t._OrtAddFreeDimensionOverride(r,g,f)!==0&&be(`Can't set a free dimension override: ${c} - ${f}.`)}return i.extra!==void 0&&gn(i.extra,"",new WeakSet,(c,f)=>{Ot(r,c,f,n)}),[r,n]}catch(a){throw r!==0&&t._OrtReleaseSessionOptions(r)!==0&&be("Can't release session options."),n.forEach(s=>t._free(s)),a}}}),Ut,gt,Lt,En,yn,Na,Ba,ua,ie=V(()=>{Ut=e=>{switch(e){case"int8":return 3;case"uint8":return 2;case"bool":return 9;case"int16":return 5;case"uint16":return 4;case"int32":return 6;case"uint32":return 12;case"float16":return 10;case"float32":return 1;case"float64":return 11;case"string":return 8;case"int64":return 7;case"uint64":return 13;case"int4":return 22;case"uint4":return 21;default:throw new Error(`unsupported data type: ${e}`)}},gt=e=>{switch(e){case 3:return"int8";case 2:return"uint8";case 9:return"bool";case 5:return"int16";case 4:return"uint16";case 6:return"int32";case 12:return"uint32";case 10:return"float16";case 1:return"float32";case 11:return"float64";case 8:return"string";case 7:return"int64";case 13:return"uint64";case 22:return"int4";case 21:return"uint4";default:throw new Error(`unsupported data type: ${e}`)}},Lt=(e,t)=>{let r=[-1,4,1,1,2,2,4,8,-1,1,2,8,4,8,-1,-1,-1,-1,-1,-1,-1,.5,.5][e],n=typeof t=="number"?t:t.reduce((i,a)=>i*a,1);return r>0?Math.ceil(n*r):void 0},En=e=>{switch(e){case"float16":return typeof Float16Array<"u"?Float16Array:Uint16Array;case"float32":return Float32Array;case"uint8":return Uint8Array;case"int8":return Int8Array;case"uint16":return Uint16Array;case"int16":return Int16Array;case"int32":return Int32Array;case"bool":return Uint8Array;case"float64":return Float64Array;case"uint32":return Uint32Array;case"int64":return BigInt64Array;case"uint64":return BigUint64Array;default:throw new Error(`unsupported type: ${e}`)}},yn=e=>{switch(e){case"verbose":return 0;case"info":return 1;case"warning":return 2;case"error":return 3;case"fatal":return 4;default:throw new Error(`unsupported logging level: ${e}`)}},Na=e=>e==="float32"||e==="float16"||e==="int32"||e==="int64"||e==="uint32"||e==="uint8"||e==="bool"||e==="uint4"||e==="int4",Ba=e=>e==="float32"||e==="float16"||e==="int32"||e==="int64"||e==="uint32"||e==="uint64"||e==="int8"||e==="uint8"||e==="bool"||e==="uint4"||e==="int4",ua=e=>{switch(e){case"none":return 0;case"cpu":return 1;case"cpu-pinned":return 2;case"texture":return 3;case"gpu-buffer":return 4;case"ml-tensor":return 5;default:throw new Error(`unsupported data location: ${e}`)}}}),Da,Qc=V(()=>{Aa(),Da=async e=>{if(typeof e=="string"){let t=await fetch(e);if(!t.ok)throw new Error(`failed to load external data file: ${e}`);let r=t.headers.get("Content-Length"),n=r?parseInt(r,10):0;if(n<1073741824)return new Uint8Array(await t.arrayBuffer());{if(!t.body)throw new Error(`failed to load external data file: ${e}, no response body.`);let i=t.body.getReader(),a;try{a=new ArrayBuffer(n)}catch(o){if(o instanceof RangeError){let u=Math.ceil(n/65536);a=new WebAssembly.Memory({initial:u,maximum:u}).buffer}else throw o}let s=0;for(;;){let{done:o,value:u}=await i.read();if(o)break;let d=u.byteLength;new Uint8Array(a,s,d).set(u),s+=d}return new Uint8Array(a,0,n)}}else return e instanceof Blob?new Uint8Array(await e.arrayBuffer()):e instanceof Uint8Array?e:new Uint8Array(e)}}),vu,xu,Su,ku,Pa,Tu,fe,yt=V(()=>{ie(),vu=["V","I","W","E","F"],xu=(e,t)=>{console.log(`[${vu[e]},${new Date().toISOString()}]${t}`)},Pa=(e,t)=>{Su=e,ku=t},Tu=(e,t)=>{let r=yn(e),n=yn(Su);r>=n&&xu(r,typeof t=="function"?t():t)},fe=(...e)=>{ku&&Tu(...e)}}),Iu,sr,R,_n,Jc,eh,th,ae=V(()=>{Iu=class{static calcMatMulShape(e,t){return e[1]!==t[0]?void 0:[e[0],t[1]]}},sr=class{static calcShape(e,t,r=!1){let n=e.length,i=t.length;if(n===0)return t;if(i===0)return e;let a=Math.max(e.length,t.length),s=new Array(a);if(r){if(n<2||i<2)return;let o=Iu.calcMatMulShape([e[n-2],e[n-1]],[t[i-2],t[i-1]]);if(o===void 0)return;[s[a-2],s[a-1]]=o}for(let o=r?3:1;o<=a;o++){let u=n-o<0?1:e[n-o],d=i-o<0?1:t[i-o];if(u!==d&&u>1&&d>1)return;let p=Math.max(u,d);if(u&&d)s[a-o]=Math.max(u,d);else{if(p>1)return;s[a-o]=0}}return s}static isValidBroadcast(e,t){let r=e.length,n=t.length;if(r>n)return!1;for(let i=1;i<=r;i++)if(e[r-i]!==1&&e[r-i]!==t[n-i])return!1;return!0}},R=class dn{static size(t){return dn.getSizeFromDimensionRange(t,0,t.length)}static convertShape(t,r=4){let n=t.length;if(n===0)return[];let i=new Array(n),a=n-1;for(;a>=0;){if(t[a]%r===0){i[a]=t[a]/r;break}if(r%t[a]!==0)throw new Error("cannot convert shape");i[a]=1,r/=t[a],a--}for(a--;a>=0;a--)i[a]=t[a];return i}static sizeFromDimension(t,r){if(r<0||r>t.length)throw new Error(`invalid dimension of ${r} for sizeFromDimension as Tensor has ${t.length} dimensions.`);return dn.getSizeFromDimensionRange(t,r,t.length)}static sizeToDimension(t,r){if(r<0||r>t.length)throw new Error(`invalid dimension of ${r} for sizeToDimension as Tensor has ${t.length} dimensions.`);return dn.getSizeFromDimensionRange(t,0,r)}static getSizeFromDimensionRange(t,r,n){let i=1;for(let a=r;a<n;a++){if(t[a]<0)throw new Error("cannot get valid size from specified dimension range. Most likely the range contains negative values in them.");i*=Number(t[a])}return i}static computeStrides(t){let r=t.length;if(r===0)return[];if(r===1)return[1];let n=new Array(r);n[r-1]=1,n[r-2]=t[r-1];for(let i=r-3;i>=0;--i)n[i]=n[i+1]*t[i+1];return n}static normalizeAxis(t,r){if(t<-r&&t>=r)throw new Error("unsupported axis for this operation.");return t<0?t+r:t}static normalizeAxes(t,r){return t.map(n=>this.normalizeAxis(n,r??t.length))}static sortBasedOnPerm(t,r){return r?r.map(n=>t[n]):t.slice().reverse()}static padShape(t,r){let n=t.length;return t.map((i,a)=>i+r[a]+r[a+n])}static areEqual(t,r){return t.length!==r.length?!1:t.every((n,i)=>n===r[i])}},_n=class kr{static adjustPoolAttributes(t,r,n,i,a,s){if(!t&&n.length!==r.length-2)throw new Error("length of specified kernel shapes should be 2 less than length of input dimensions");if(t)for(let o=0;o<r.length-2;o++)o>=n.length?n.push(r[o+2]):n[o]=r[o+2];for(let o=0;o<n.length;o++)if(o<i.length){if(i[o]<0)throw new Error("strides should be greater than or equal to 1")}else i.push(1);for(let o=0;o<n.length;o++)if(o<a.length){if(a[o]<0)throw new Error("dilations should be greater than or equal to 1")}else a.push(1);for(let o=0;o<n.length*2;o++)if(o<s.length){if(s[o]<0)throw new Error("pad should be greater than or equal to 1")}else s.push(0);for(let o=0;o<n.length;o++){if(n[o]<=0)throw new Error("kernel shapes need to be greater than 0");if(s[o]>=n[o]||s[o+n.length]>=n[o])throw new Error("pads should be smaller than kernel")}}static adjustPadsBasedOnAutoPad(t,r,n,i,a,s,o){if(o){if(a.length!==2*(t.length-2))throw new Error("length of pads should be twice the length of data dimensions");if(r.length!==t.length-2)throw new Error("length of strides should be the length of data dimensions");if(i.length!==t.length-2)throw new Error("length of kernel shapes should be the length of data dimensions");for(let u=0;u<t.length-2;u++)kr.adjustPadAndReturnShape(t[u+(s?1:2)],r[u],n[u],i[u],a,u,u+t.length-2,o)}}static computePoolOutputShape(t,r,n,i,a,s,o){if(r.length<=0)throw new Error("input shape must be of size greater than 0");let u=[r[0],r[1]];return kr.computeShapeHelper(t,r,u,n,i,a,s,o),u}static computeConvOutputShape(t,r,n,i,a,s,o){if(t.length<=0||r.length<=0)throw new Error("invalid input tensor dims or invalid filter tensor dims");let u=[t[0],r[0]];return kr.computeShapeHelper(!1,t,u,n,i,a,s,o),u}static computeShapeHelper(t,r,n,i,a,s,o,u){if(t)for(let d=0;d<r.length-2;d++)n.push(1);else for(let d=0;d<r.length-2;d++)n.push(kr.adjustPadAndReturnShape(r[d+2],i[d],a[d],s[d],o,d,d+r.length-2,u))}static adjustPadAndReturnShape(t,r,n,i,a,s,o,u){let d=n*(i-1)+1;if(u&&u!=="NOTSET")switch(u){case"VALID":return a[s]=0,a[o]=0,Math.floor((t-d)/r+1);case"SAME_LOWER":case"SAME_UPPER":if(n!==1)throw new Error("Dilation not supported for SAME_UPPER or SAME_LOWER");{let p=((t+r-1)/r-1)*r+i-t;return a[s]=Math.floor(u==="SAME_LOWER"?(p+1)/2:p/2),a[o]=p-a[s],Math.floor((t+p-i)/r+1)}default:throw new Error("Unsupported AutoPad type")}else return Math.floor((t+a[s]+a[o]-d)/r+1)}},Jc=class{static getShapeOfGemmResult(e,t,r,n,i){if(e.length!==2||r.length!==2)throw new Error("shape need to be of size 2");let a,s,o;t?(a=e[1],s=e[0]):(a=e[0],s=e[1]);let u=-1;if(n?(o=r[0],u=1):(o=r[1],u=0),r[u]!==s)throw new Error("dimension mismatch");if(a<=0||o<=0||s<=0)throw new Error("invalid shape specified");if(i&&!sr.isValidBroadcast(i,[a,o]))throw new Error("gemm: invalid bias shape for broadcast");return[a,o,s]}},eh=-34028234663852886e22,th=34028234663852886e22}),Ua,rh=V(()=>{ie(),Ua=(e,t)=>new(En(t))(e)}),ci,la,hi,Eu,fi,Cu,mi,gi,yi,zu,nh,G_=V(()=>{ie(),yt(),ci=new Map([["float32",32],["float16",16],["int32",32],["uint32",32],["int64",64],["uint64",64],["int8",8],["uint8",8],["int4",4],["uint4",4]]),la=(e,t)=>{if(t==="int32")return e;let r=ci.get(t);if(!r)throw new Error(`WebNN backend does not support data type: ${t}`);let n=r/8;if(e.byteLength%n!==0)throw new Error(`Invalid Uint8Array length - must be a multiple of ${n}.`);let i=e.byteLength/n,a=new(En(t))(e.buffer,e.byteOffset,i);switch(t){case"int64":case"uint64":{let s=new Int32Array(i);for(let o=0;o<i;o++){let u=a[o];if(u>2147483647n||u<-2147483648n)throw new Error("Can not convert int64 data to int32 - value out of range.");s[o]=Number(u)}return new Uint8Array(s.buffer)}case"int8":case"uint8":case"uint32":{if(t==="uint32"&&a.some(o=>o>2147483647))throw new Error("Can not convert uint32 data to int32 - value out of range.");let s=Int32Array.from(a,Number);return new Uint8Array(s.buffer)}default:throw new Error(`Unsupported data conversion from ${t} to 'int32'`)}},hi=(e,t)=>{if(t==="int32")return e;if(e.byteLength%4!==0)throw new Error("Invalid Uint8Array length - must be a multiple of 4 (int32).");let r=e.byteLength/4,n=new Int32Array(e.buffer,e.byteOffset,r);switch(t){case"int64":{let i=BigInt64Array.from(n,BigInt);return new Uint8Array(i.buffer)}case"uint64":{if(n.some(a=>a<0))throw new Error("Can not convert int32 data to uin64 - negative value found.");let i=BigUint64Array.from(n,BigInt);return new Uint8Array(i.buffer)}case"int8":{if(n.some(a=>a<-128||a>127))throw new Error("Can not convert int32 data to int8 - value out of range.");let i=Int8Array.from(n,Number);return new Uint8Array(i.buffer)}case"uint8":{if(n.some(i=>i<0||i>255))throw new Error("Can not convert int32 data to uint8 - value out of range.");return Uint8Array.from(n,Number)}case"uint32":{if(n.some(a=>a<0))throw new Error("Can not convert int32 data to uint32 - negative value found.");let i=Uint32Array.from(n,Number);return new Uint8Array(i.buffer)}default:throw new Error(`Unsupported data conversion from 'int32' to ${t}`)}},Eu=1,fi=()=>Eu++,Cu=new Map([["int8","int32"],["uint8","int32"],["uint32","int32"],["int64","int32"]]),mi=(e,t)=>{let r=ci.get(e);if(!r)throw new Error(`WebNN backend does not support data type: ${e}`);return t.length>0?Math.ceil(t.reduce((n,i)=>n*i)*r/8):0},gi=class{constructor(e){this.isDataConverted=!1;let{sessionId:t,context:r,tensor:n,dataType:i,shape:a,fallbackDataType:s}=e;this.sessionId=t,this.mlContext=r,this.mlTensor=n,this.dataType=i,this.tensorShape=a,this.fallbackDataType=s}get tensor(){return this.mlTensor}get type(){return this.dataType}get fallbackType(){return this.fallbackDataType}get shape(){return this.tensorShape}get byteLength(){return mi(this.dataType,this.tensorShape)}destroy(){fe("verbose",()=>"[WebNN] TensorWrapper.destroy"),this.mlTensor.destroy()}write(e){this.mlContext.writeTensor(this.mlTensor,e)}async read(e){if(this.fallbackDataType){let t=await this.mlContext.readTensor(this.mlTensor),r=hi(new Uint8Array(t),this.dataType);if(e){(e instanceof ArrayBuffer?new Uint8Array(e):new Uint8Array(e.buffer,e.byteOffset,e.byteLength)).set(r);return}else return new Uint8Array(r).buffer}else return e?this.mlContext.readTensor(this.mlTensor,e):this.mlContext.readTensor(this.mlTensor)}canReuseTensor(e,t,r){return this.mlContext===e&&this.dataType===t&&this.tensorShape.length===r.length&&this.tensorShape.every((n,i)=>n===r[i])}setIsDataConverted(e){this.isDataConverted=e}},yi=class{constructor(e,t){this.tensorManager=e,this.wrapper=t}get tensorWrapper(){return this.wrapper}releaseTensor(){this.tensorWrapper&&(this.tensorManager.releaseTensor(this.tensorWrapper),this.wrapper=void 0)}async ensureTensor(e,t,r,n){let i=this.tensorManager.getMLContext(e),a=this.tensorManager.getMLOpSupportLimits(e),s;if(!a?.input.dataTypes.includes(t)){if(s=Cu.get(t),!s||a?.input.dataTypes.includes(s))throw new Error(`WebNN backend does not support data type: ${t}`);fe("verbose",()=>`[WebNN] TensorIdTracker.ensureTensor: fallback dataType from ${t} to ${s}`)}if(this.wrapper){if(this.wrapper.canReuseTensor(i,t,r))return this.wrapper.tensor;if(n){if(this.wrapper.byteLength!==mi(t,r))throw new Error("Unable to copy data to tensor with different size.");this.activeUpload=new Uint8Array(await this.wrapper.read())}this.tensorManager.releaseTensor(this.wrapper)}let o=typeof MLTensorUsage>"u"?void 0:MLTensorUsage.READ|MLTensorUsage.WRITE;return this.wrapper=await this.tensorManager.getCachedTensor(e,t,r,o,!0,!0,s),n&&this.activeUpload&&(this.wrapper.write(this.activeUpload),this.activeUpload=void 0),this.wrapper.tensor}upload(e){let t=e;if(this.wrapper){if(this.wrapper.fallbackType)if(this.wrapper.fallbackType==="int32")t=la(e,this.wrapper.type),this.wrapper.setIsDataConverted(!0);else throw new Error(`Unsupported fallback data type: ${this.wrapper.fallbackType}`);if(e.byteLength===this.wrapper.byteLength){this.wrapper.write(t);return}else fe("verbose",()=>"Data size does not match tensor size. Releasing tensor."),this.releaseTensor()}this.activeUpload?this.activeUpload.set(t):this.activeUpload=new Uint8Array(t)}async download(e){if(this.activeUpload){let t=this.wrapper?.isDataConverted?hi(this.activeUpload,this.wrapper?.type):this.activeUpload;if(e){e instanceof ArrayBuffer?new Uint8Array(e).set(t):new Uint8Array(e.buffer,e.byteOffset,e.byteLength).set(t);return}else return t.buffer}if(!this.wrapper)throw new Error("Tensor has not been created.");return e?this.wrapper.read(e):this.wrapper.read()}},zu=class{constructor(e){this.backend=e,this.tensorTrackersById=new Map,this.freeTensors=[],this.externalTensors=new Set}getMLContext(e){let t=this.backend.getMLContext(e);if(!t)throw new Error("MLContext not found for session.");return t}getMLOpSupportLimits(e){return this.backend.getMLOpSupportLimits(e)}reserveTensorId(){let e=fi();return this.tensorTrackersById.set(e,new yi(this)),e}releaseTensorId(e){let t=this.tensorTrackersById.get(e);t&&(this.tensorTrackersById.delete(e),t.tensorWrapper&&this.releaseTensor(t.tensorWrapper))}async ensureTensor(e,t,r,n,i){fe("verbose",()=>`[WebNN] TensorManager.ensureTensor {tensorId: ${t}, dataType: ${r}, shape: ${n}, copyOld: ${i}}`);let a=this.tensorTrackersById.get(t);if(!a)throw new Error("Tensor not found.");return a.ensureTensor(e,r,n,i)}upload(e,t){let r=this.tensorTrackersById.get(e);if(!r)throw new Error("Tensor not found.");r.upload(t)}async download(e,t){fe("verbose",()=>`[WebNN] TensorManager.download {tensorId: ${e}, dstBuffer: ${t?.byteLength}}`);let r=this.tensorTrackersById.get(e);if(!r)throw new Error("Tensor not found.");return r.download(t)}releaseTensorsForSession(e){for(let t of this.freeTensors)t.sessionId===e&&t.destroy();this.freeTensors=this.freeTensors.filter(t=>t.sessionId!==e)}registerTensor(e,t,r,n){let i=this.getMLContext(e),a=fi(),s=new gi({sessionId:e,context:i,tensor:t,dataType:r,shape:n});return this.tensorTrackersById.set(a,new yi(this,s)),this.externalTensors.add(s),a}async getCachedTensor(e,t,r,n,i,a,s){let o=this.getMLContext(e);for(let[d,p]of this.freeTensors.entries())if(p.canReuseTensor(o,t,r)){fe("verbose",()=>`[WebNN] Reusing tensor {dataType: ${t}, ${s?`fallbackDataType: ${s},`:""} shape: ${r}`);let c=this.freeTensors.splice(d,1)[0];return c.sessionId=e,c}fe("verbose",()=>`[WebNN] MLContext.createTensor {dataType: ${t}, ${s?`fallbackDataType: ${s},`:""} shape: ${r}}`);let u=await o.createTensor({dataType:s??t,shape:r,dimensions:r,usage:n,writable:i,readable:a});return new gi({sessionId:e,context:o,tensor:u,dataType:t,shape:r,fallbackDataType:s})}releaseTensor(e){this.externalTensors.has(e)&&this.externalTensors.delete(e),this.freeTensors.push(e)}},nh=(...e)=>new zu(...e)}),mr,Au,ih,V_=V(()=>{ie(),Zt(),rh(),G_(),yt(),mr=new Map([[1,"float32"],[10,"float16"],[6,"int32"],[12,"uint32"],[7,"int64"],[13,"uint64"],[22,"int4"],[21,"uint4"],[3,"int8"],[2,"uint8"],[9,"uint8"]]),Au=(e,t)=>{if(e===t)return!0;if(e===void 0||t===void 0)return!1;let r=Object.keys(e).sort(),n=Object.keys(t).sort();return r.length===n.length&&r.every((i,a)=>i===n[a]&&e[i]===t[i])},ih=class{constructor(e){this.tensorManager=nh(this),this.mlContextBySessionId=new Map,this.sessionIdsByMLContext=new Map,this.mlContextCache=[],this.sessionGraphInputs=new Map,this.sessionGraphOutputs=new Map,this.temporaryGraphInputs=[],this.temporaryGraphOutputs=[],this.temporarySessionTensorIds=new Map,this.mlOpSupportLimitsBySessionId=new Map,Pa(e.logLevel,!!e.debug)}get currentSessionId(){if(this.activeSessionId===void 0)throw new Error("No active session");return this.activeSessionId}onRunStart(e){fe("verbose",()=>`[WebNN] onRunStart {sessionId: ${e}}`),this.activeSessionId=e}onRunEnd(e){fe("verbose",()=>`[WebNN] onRunEnd {sessionId: ${e}}`);let t=this.temporarySessionTensorIds.get(e);if(t){for(let r of t)fe("verbose",()=>`[WebNN] releasing temporary tensor {tensorId: ${r}}`),this.tensorManager.releaseTensorId(r);this.temporarySessionTensorIds.delete(e),this.activeSessionId=void 0}}async createMLContext(e){if(e instanceof GPUDevice){let r=this.mlContextCache.findIndex(n=>n.gpuDevice===e);if(r!==-1)return this.mlContextCache[r].mlContext;{let n=await navigator.ml.createContext(e);return this.mlContextCache.push({gpuDevice:e,mlContext:n}),n}}else if(e===void 0){let r=this.mlContextCache.findIndex(n=>n.options===void 0&&n.gpuDevice===void 0);if(r!==-1)return this.mlContextCache[r].mlContext;{let n=await navigator.ml.createContext();return this.mlContextCache.push({mlContext:n}),n}}let t=this.mlContextCache.findIndex(r=>Au(r.options,e));if(t!==-1)return this.mlContextCache[t].mlContext;{let r=await navigator.ml.createContext(e);return this.mlContextCache.push({options:e,mlContext:r}),r}}registerMLContext(e,t){this.mlContextBySessionId.set(e,t);let r=this.sessionIdsByMLContext.get(t);r||(r=new Set,this.sessionIdsByMLContext.set(t,r)),r.add(e),this.mlOpSupportLimitsBySessionId.has(e)||this.mlOpSupportLimitsBySessionId.set(e,t.opSupportLimits()),this.temporaryGraphInputs.length>0&&(this.sessionGraphInputs.set(e,this.temporaryGraphInputs),this.temporaryGraphInputs=[]),this.temporaryGraphOutputs.length>0&&(this.sessionGraphOutputs.set(e,this.temporaryGraphOutputs),this.temporaryGraphOutputs=[])}onReleaseSession(e){this.sessionGraphInputs.delete(e),this.sessionGraphOutputs.delete(e);let t=this.mlContextBySessionId.get(e);if(!t)return;this.tensorManager.releaseTensorsForSession(e),this.mlContextBySessionId.delete(e),this.mlOpSupportLimitsBySessionId.delete(e);let r=this.sessionIdsByMLContext.get(t);if(r.delete(e),r.size===0){this.sessionIdsByMLContext.delete(t);let n=this.mlContextCache.findIndex(i=>i.mlContext===t);n!==-1&&this.mlContextCache.splice(n,1)}}getMLContext(e){return this.mlContextBySessionId.get(e)}getMLOpSupportLimits(e){return this.mlOpSupportLimitsBySessionId.get(e)}reserveTensorId(){return this.tensorManager.reserveTensorId()}releaseTensorId(e){fe("verbose",()=>`[WebNN] releaseTensorId {tensorId: ${e}}`),this.tensorManager.releaseTensorId(e)}async ensureTensor(e,t,r,n,i){let a=mr.get(r);if(!a)throw new Error(`Unsupported ONNX data type: ${r}`);return this.tensorManager.ensureTensor(e??this.currentSessionId,t,a,n,i)}async createTemporaryTensor(e,t,r){fe("verbose",()=>`[WebNN] createTemporaryTensor {onnxDataType: ${t}, shape: ${r}}`);let n=mr.get(t);if(!n)throw new Error(`Unsupported ONNX data type: ${t}`);let i=this.tensorManager.reserveTensorId();await this.tensorManager.ensureTensor(e,i,n,r,!1);let a=this.temporarySessionTensorIds.get(e);return a?a.push(i):this.temporarySessionTensorIds.set(e,[i]),i}uploadTensor(e,t){if(!ve().shouldTransferToMLTensor)throw new Error("Trying to upload to a MLTensor while shouldTransferToMLTensor is false");fe("verbose",()=>`[WebNN] uploadTensor {tensorId: ${e}, data: ${t.byteLength}}`),this.tensorManager.upload(e,t)}async downloadTensor(e,t){return this.tensorManager.download(e,t)}createMLTensorDownloader(e,t){return async()=>{let r=await this.tensorManager.download(e);return Ua(r,t)}}registerMLTensor(e,t,r,n){let i=mr.get(r);if(!i)throw new Error(`Unsupported ONNX data type: ${r}`);let a=this.tensorManager.registerTensor(e,t,i,n);return fe("verbose",()=>`[WebNN] registerMLTensor {tensor: ${t}, dataType: ${i}, dimensions: ${n}} -> {tensorId: ${a}}`),a}registerMLConstant(e,t,r,n,i,a,s=!1){if(!a)throw new Error("External mounted files are not available.");let o=e;e.startsWith("./")&&(o=e.substring(2));let u=a.get(o);if(!u)throw new Error(`File with name ${o} not found in preloaded files.`);if(t+r>u.byteLength)throw new Error("Out of bounds: data offset and length exceed the external file data size.");let d=u.slice(t,t+r).buffer,p;switch(i.dataType){case"float32":p=new Float32Array(d);break;case"float16":p=typeof Float16Array<"u"?new Float16Array(d):new Uint16Array(d);break;case"int32":p=new Int32Array(d);break;case"uint32":p=new Uint32Array(d);break;case"int64":if(s){let c=la(new Uint8Array(d),"int64");p=new Int32Array(c.buffer),i.dataType="int32"}else p=new BigInt64Array(d);break;case"uint64":p=new BigUint64Array(d);break;case"int8":p=new Int8Array(d);break;case"int4":case"uint4":case"uint8":p=new Uint8Array(d);break;default:throw new Error(`Unsupported data type: ${i.dataType} in creating WebNN Constant from external data.`)}return fe("verbose",()=>`[WebNN] registerMLConstant {dataType: ${i.dataType}, shape: ${i.shape}}} ${s?"(Note: it was int64 data type and registered to int32 as workaround)":""}`),n.constant(i,p)}registerGraphInput(e){this.temporaryGraphInputs.push(e)}registerGraphOutput(e){this.temporaryGraphOutputs.push(e)}isGraphInput(e,t){let r=this.sessionGraphInputs.get(e);return r?r.includes(t):!1}isGraphOutput(e,t){let r=this.sessionGraphOutputs.get(e);return r?r.includes(t):!1}isGraphInputOutputTypeSupported(e,t,r=!0){let n=mr.get(Ut(t)),i=this.mlOpSupportLimitsBySessionId.get(e);return typeof n>"u"?!1:r?!!i?.input.dataTypes.includes(n):!!i?.output.dataTypes.includes(n)}flush(){}}}),La=V(()=>{}),_i,Zr,Yr,Mu,Ou,bi,da,Ru,ah,H_=V(()=>{yt(),La(),_i=new Map([[64,250],[128,200],[256,200],[512,200],[2048,230],[4096,200],[8192,50],[16384,50],[32768,50],[65536,50],[131072,50],[262144,50],[524288,50],[1048576,50],[2097152,30],[4194304,20],[8388608,10],[12582912,10],[16777216,10],[26214400,15],[33554432,22],[44236800,2],[58982400,6],[67108864,6],[134217728,6],[167772160,6]]),Zr=[],Yr=e=>Math.ceil(Number(e)/16)*16,Mu=e=>{for(let t=0;t<Zr.length;t++){let r=Zr[t];if(e<=r)return r}return Math.ceil(e/16)*16},Ou=1,bi=()=>Ou++,da=async(e,t,r,n)=>{let i=Yr(r),a=e.device.createBuffer({size:i,usage:GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ});try{let s=e.getCommandEncoder();e.endComputePass(),s.copyBufferToBuffer(t,0,a,0,i),e.flush(),await a.mapAsync(GPUMapMode.READ);let o=a.getMappedRange();if(n){let u=n();return u.set(new Uint8Array(o,0,r)),u}else return new Uint8Array(o.slice(0,r))}finally{a.destroy()}},Ru=class{constructor(e){this.backend=e,this.storageCache=new Map,this.freeBuffers=new Map,this.freeUniformBuffers=new Map,this.buffersPending=[],this.capturedPendingBuffers=new Map;for(let[t]of _i)Zr.push(t),this.freeBuffers.set(t,[]),this.freeUniformBuffers.set(t,[]);this.sessionCount=0}upload(e,t){let r=t.buffer,n=t.byteOffset,i=t.byteLength,a=Yr(i),s=this.storageCache.get(e);if(!s)throw new Error("gpu data for uploading does not exist");if(Number(s.originalSize)!==i)throw new Error(`inconsistent data size. gpu data size=${s.originalSize}, data size=${i}`);let o=this.backend.device.createBuffer({mappedAtCreation:!0,size:a,usage:GPUBufferUsage.MAP_WRITE|GPUBufferUsage.COPY_SRC}),u=o.getMappedRange();new Uint8Array(u).set(new Uint8Array(r,n,i)),o.unmap();let d=this.backend.device.createCommandEncoder();d.copyBufferToBuffer(o,0,s.gpuData.buffer,0,a),this.backend.device.queue.submit([d.finish()]),o.destroy(),fe("verbose",()=>`[WebGPU] GpuDataManager.upload(id=${e})`)}memcpy(e,t){let r=this.storageCache.get(e);if(!r)throw new Error("source gpu data for memcpy does not exist");let n=this.storageCache.get(t);if(!n)throw new Error("destination gpu data for memcpy does not exist");if(r.originalSize!==n.originalSize)throw new Error("inconsistent source and destination gpu data size");let i=Yr(r.originalSize),a=this.backend.getCommandEncoder();this.backend.endComputePass(),a.copyBufferToBuffer(r.gpuData.buffer,0,n.gpuData.buffer,0,i)}registerExternalBuffer(e,t,r){let n;if(r){if(n=r[0],e===r[1])return fe("verbose",()=>`[WebGPU] GpuDataManager.registerExternalBuffer(size=${t}) => id=${n}, buffer is the same, skip.`),n;if(this.backend.capturedCommandList.has(this.backend.currentSessionId))throw new Error(`Registering a different external buffer under graph capture mode is not supported yet.
             Please use the previous external buffer!`)}else n=bi();return this.storageCache.set(n,{gpuData:{id:n,type:0,buffer:e},originalSize:t}),fe("verbose",()=>`[WebGPU] GpuDataManager.registerExternalBuffer(size=${t}) => id=${n}, registered.`),n}unregisterExternalBuffer(e){e!==void 0&&(this.storageCache.delete(e),fe("verbose",()=>`[WebGPU] GpuDataManager.unregisterExternalBuffer() => id=${e}`))}create(e,t=GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC|GPUBufferUsage.COPY_DST){let r=Mu(e),n,i=(t&GPUBufferUsage.STORAGE)===GPUBufferUsage.STORAGE,a=(t&GPUBufferUsage.UNIFORM)===GPUBufferUsage.UNIFORM;if(i||a){let o=(i?this.freeBuffers:this.freeUniformBuffers).get(r);o?o.length>0?n=o.pop():n=this.backend.device.createBuffer({size:r,usage:t}):n=this.backend.device.createBuffer({size:r,usage:t})}else n=this.backend.device.createBuffer({size:r,usage:t});let s={id:bi(),type:0,buffer:n};return this.storageCache.set(s.id,{gpuData:s,originalSize:Number(e)}),fe("verbose",()=>`[WebGPU] GpuDataManager.create(size=${e}) => id=${s.id}`),s}get(e){return this.storageCache.get(e)?.gpuData}release(e){let t=typeof e=="bigint"?Number(e):e,r=this.storageCache.get(t);if(!r){if(this.storageCache.size===0)return 0;throw new Error("releasing data does not exist")}return fe("verbose",()=>`[WebGPU] GpuDataManager.release(id=${t}), gpuDataId=${r.gpuData.id}`),this.storageCache.delete(t),this.buffersPending.push(r.gpuData.buffer),r.originalSize}async download(e,t){let r=this.storageCache.get(Number(e));if(!r)throw new Error("data does not exist");await da(this.backend,r.gpuData.buffer,r.originalSize,t)}refreshPendingBuffers(){if(this.buffersPending.length!==0)if(this.backend.sessionStatus==="default"){for(let e of this.buffersPending){let t=_i.get(e.size);if((e.usage&GPUBufferUsage.STORAGE)===GPUBufferUsage.STORAGE){let r=this.freeBuffers.get(e.size)||[];t===void 0||r.length>=t?e.destroy():r.push(e)}else if((e.usage&GPUBufferUsage.UNIFORM)===GPUBufferUsage.UNIFORM){let r=this.freeUniformBuffers.get(e.size)||[];t===void 0||r.length>=t?e.destroy():r.push(e)}else e.destroy()}this.buffersPending=[]}else{let e=this.capturedPendingBuffers.get(this.backend.currentSessionId);e||(e=[],this.capturedPendingBuffers.set(this.backend.currentSessionId,e));for(let t of this.buffersPending)e.push(t);this.buffersPending=[]}}dispose(){this.freeBuffers.forEach(e=>{e.forEach(t=>{t.destroy()})}),this.freeUniformBuffers.forEach(e=>{e.forEach(t=>{t.destroy()})}),this.storageCache.forEach(e=>{e.gpuData.buffer.destroy()}),this.capturedPendingBuffers.forEach(e=>{e.forEach(t=>{t.destroy()})}),this.storageCache=new Map,this.freeBuffers=new Map,this.freeUniformBuffers=new Map,this.capturedPendingBuffers=new Map}onCreateSession(){this.sessionCount+=1}onReleaseSession(e){let t=this.capturedPendingBuffers.get(e);t&&(t.forEach(r=>{r.destroy()}),this.capturedPendingBuffers.delete(e)),this.sessionCount-=1,this.sessionCount===0&&(fe("warning",()=>"[WebGPU] Clearing webgpu buffer cache"),this.storageCache.forEach(r=>{r.gpuData.buffer.destroy()}),this.storageCache=new Map)}},ah=(...e)=>new Ru(...e)}),Nu,_e,Ae=V(()=>{Nu=class{constructor(e){Object.assign(this,e)}get cacheKey(){return this.key||(this.key=Object.getOwnPropertyNames(this).sort().map(e=>`${this[e]}`).join(";")),this.key}},_e=e=>new Nu(e)}),or,Qr,Re,De,ne,Ce,pa,ir,Et,re,gr,P,te,sh,qa,Bu,oh,se=V(()=>{ie(),ae(),or=64,Qr=(e,t)=>{if(t===3)throw new Error("vec3 has same alignment as vec4, use vec4 instead");switch(Number(e)){case 10:return t>1?`vec${t}<f16>`:"f16";case 1:return t>1?`vec${t}<f32>`:"f32";case 6:return t>1?`vec${t}<i32>`:"i32";case 12:return t>1?`vec${t}<u32>`:"u32";case 7:if(t>1)throw new Error("currently not supported vecX of uint64 yet");return["vec2<u32>","i32"];case 13:if(t>1)throw new Error("currently not supported vecX of uint64 yet");return["vec2<u32>","u32"];case 9:if(t!==4)throw new Error("bool must be vec4");return["u32","vec4<bool>"];case 22:return"i32";case 21:return"u32";default:throw new Error(`Unknown data type: ${e}`)}},Re=(e,t=1)=>{let r=Qr(e,t);return typeof r=="string"?r:r[0]},De=(e,t=1)=>{let r=Qr(e,t);return typeof r=="string"?r:r[1]},ne=(...e)=>{let t=[];return e.forEach(r=>{r.length!==0&&t.push({type:12,data:r},{type:12,data:R.computeStrides(r)})}),t},Ce=e=>e%4===0?4:e%2===0?2:1,pa=(e="f32",t,r="0")=>!t||t===1?`${e}(${r})`:`vec${t}<${e}>(${r})`,ir=(e,t,r)=>e==="f32"?r:t===1?`f32(${r})`:`vec${t}<f32>(${r})`,Et=(e,t)=>t===4?`(${e}.x + ${e}.y + ${e}.z + ${e}.w)`:t===2?`(${e}.x + ${e}.y)`:t===3?`(${e}.x + ${e}.y + ${e}.z)`:e,re=(e,t,r,n)=>e.startsWith("uniforms.")&&r>4?typeof t=="string"?n==="f16"?`${e}[(${t}) / 8][(${t}) % 8 / 4][(${t}) % 8 % 4]`:`${e}[(${t}) / 4][(${t}) % 4]`:n==="f16"?`${e}[${Math.floor(t/8)}][${Math.floor(t%8/4)}][${t%8%4}]`:`${e}[${Math.floor(t/4)}][${t%4}]`:r>1?`${e}[${t}]`:e,gr=(e,t,r,n,i)=>{let a=typeof r=="number",s=a?r:r.length,o=[...new Array(s).keys()],u=s<2?"u32":s<=4?`vec${s}<u32>`:`array<u32, ${s}>`,d=Qr(t,i),p=typeof d=="string"?d:d[1],c=typeof d=="string"?d:d[0],f={indices:u,value:p,storage:c,tensor:t},g=U=>typeof U=="string"?U:`${U}u`,m={offsetToIndices:!1,indicesToOffset:!1,broadcastedIndicesToOffset:!1,set:!1,setByIndices:!1,get:!1,getByIndices:!1},_=a?"uniforms.":"",v=`${_}${e}_shape`,w=`${_}${e}_strides`,$="";for(let U=0;U<s-1;U++)$+=`
    let dim${U} = current / ${re(w,U,s)};
    let rest${U} = current % ${re(w,U,s)};
    indices[${U}] = dim${U};
    current = rest${U};
    `;$+=`indices[${s-1}] = current;`;let S=s<2?"":`
  fn o2i_${e}(offset: u32) -> ${f.indices} {
    var indices: ${f.indices};
    var current = offset;
    ${$}
    return indices;
  }`,x=U=>(m.offsetToIndices=!0,s<2?U:`o2i_${e}(${U})`),I=[];if(s>=2)for(let U=s-1;U>=0;U--)I.push(`${re(w,U,s)} * (indices[${U}])`);let E=s<2?"":`
  fn i2o_${e}(indices: ${f.indices}) -> u32 {
    return ${I.join("+")};
  }`,z=U=>(m.indicesToOffset=!0,s<2?U:`i2o_${e}(${U})`),k=(...U)=>s===0?"0u":`${f.indices}(${U.map(g).join(",")})`,N=(U,ee)=>s<2?`${U}`:`${re(U,ee,s)}`,O=(U,ee,Z)=>s<2?`${U}=${Z};`:`${re(U,ee,s)}=${Z};`,F={},q=(U,ee)=>{m.broadcastedIndicesToOffset=!0;let Z=`${ee.name}broadcastedIndicesTo${e}Offset`;if(Z in F)return`${Z}(${U})`;let K=[];for(let xe=s-1;xe>=0;xe--){let Se=ee.indicesGet("outputIndices",xe+ee.rank-s);K.push(`${N(w,xe)} * (${Se} % ${N(v,xe)})`)}return F[Z]=`fn ${Z}(outputIndices: ${ee.type.indices}) -> u32 {
             return ${K.length>0?K.join("+"):"0u"};
           }`,`${Z}(${U})`},H=(U,ee)=>(()=>{if(f.storage===f.value)return`${e}[${U}]=${ee};`;if(f.storage==="vec2<u32>"&&f.value==="i32")return`${e}[${U}]=vec2<u32>(u32(${ee}), select(0u, 0xFFFFFFFFu, ${ee} < 0));`;if(f.storage==="vec2<u32>"&&f.value==="u32")return`${e}[${U}]=vec2<u32>(u32(${ee}), 0u);`;if(f.storage==="u32"&&f.value==="vec4<bool>")return`${e}[${U}]=dot(vec4<u32>(0x1, 0x100, 0x10000, 0x1000000), vec4<u32>(${ee}));`;throw new Error(`not supported combination of storage type ${f.storage} and value type ${f.value} yet`)})(),M=U=>(()=>{if(f.storage===f.value)return`${e}[${U}]`;if(f.storage==="vec2<u32>"&&f.value==="i32")return`i32(${e}[${U}].x)`;if(f.storage==="vec2<u32>"&&f.value==="u32")return`u32(${e}[${U}].x)`;if(f.storage==="u32"&&f.value==="vec4<bool>")return`vec4<bool>(bool(${e}[${U}] & 0xFFu), bool(${e}[${U}] & 0xFF00u), bool(${e}[${U}] & 0xFF0000u), bool(${e}[${U}] & 0xFF000000u))`;throw new Error(`not supported combination of storage type ${f.storage} and value type ${f.value} yet`)})(),B=s<2?"":`
  fn get_${e}ByIndices(indices: ${f.indices}) -> ${p} {
    return ${M(`i2o_${e}(indices)`)};
  }`,G=s<2?"":(()=>{let U=o.map(Z=>`d${Z}: u32`).join(", "),ee=o.map(Z=>`d${Z}`).join(", ");return`
  fn get_${e}(${U}) -> ${p} {
    return get_${e}ByIndices(${k(ee)});
  }`})(),J=(...U)=>{if(U.length!==s)throw new Error(`indices length must be ${s}`);let ee=U.map(g).join(",");return s===0?M("0u"):s===1?M(ee[0]):(m.get=!0,m.getByIndices=!0,m.indicesToOffset=!0,`get_${e}(${ee})`)},Y=U=>s<2?M(U):(m.getByIndices=!0,m.indicesToOffset=!0,`get_${e}ByIndices(${U})`),L=s<2?"":`
  fn set_${e}ByIndices(indices: ${f.indices}, value: ${p}) {
    ${H(`i2o_${e}(indices)`,"value")}
  }`,X=s<2?"":(()=>{let U=o.map(Z=>`d${Z}: u32`).join(", "),ee=o.map(Z=>`d${Z}`).join(", ");return`
  fn set_${e}(${U}, value: ${p}) {
    set_${e}ByIndices(${k(ee)}, value);
  }`})();return{impl:()=>{let U=[],ee=!1;return m.offsetToIndices&&(U.push(S),ee=!0),m.indicesToOffset&&(U.push(E),ee=!0),m.broadcastedIndicesToOffset&&(Object.values(F).forEach(Z=>U.push(Z)),ee=!0),m.set&&(U.push(X),ee=!0),m.setByIndices&&(U.push(L),ee=!0),m.get&&(U.push(G),ee=!0),m.getByIndices&&(U.push(B),ee=!0),!a&&ee&&U.unshift(`const ${v} = ${f.indices}(${r.join(",")});`,`const ${w} = ${f.indices}(${R.computeStrides(r).join(",")});`),U.join(`
`)},type:f,offsetToIndices:x,indicesToOffset:z,broadcastedIndicesToOffset:q,indices:k,indicesGet:N,indicesSet:O,set:(...U)=>{if(U.length!==s+1)throw new Error(`indices length must be ${s}`);let ee=U[s];if(typeof ee!="string")throw new Error("value must be string");let Z=U.slice(0,s).map(g).join(",");return s===0?H("0u",ee):s===1?H(Z[0],ee):(m.set=!0,m.setByIndices=!0,m.indicesToOffset=!0,`set_${e}(${Z}, ${ee})`)},setByOffset:H,setByIndices:(U,ee)=>s<2?H(U,ee):(m.setByIndices=!0,m.indicesToOffset=!0,`set_${e}ByIndices(${U}, ${ee});`),get:J,getByOffset:M,getByIndices:Y,usage:n,name:e,strides:w,shape:v,rank:s}},P=(e,t,r,n=1)=>gr(e,t,r,"input",n),te=(e,t,r,n=1)=>gr(e,t,r,"output",n),sh=(e,t,r)=>gr(e,t,r,"atomicOutput",1),qa=(e,t,r,n=1)=>gr(e,t,r,"internal",n),Bu=class{constructor(e,t){this.normalizedDispatchGroup=e,this.limits=t,this.internalVariables=[],this.variables=[],this.uniforms=[],this.variableIndex=0}guardAgainstOutOfBoundsWorkgroupSizes(e){return`if (global_idx >= ${typeof e=="number"?`${e}u`:e}) { return; }`}mainStart(e=or){let t=typeof e=="number"?e:e[0],r=typeof e=="number"?1:e[1],n=typeof e=="number"?1:e[2];if(t>this.limits.maxComputeWorkgroupSizeX||r>this.limits.maxComputeWorkgroupSizeY||n>this.limits.maxComputeWorkgroupSizeZ)throw new Error(`workgroup size [${t}, ${r}, ${n}] exceeds the maximum workgroup size [${this.limits.maxComputeWorkgroupSizeX}, ${this.limits.maxComputeWorkgroupSizeY}, ${this.limits.maxComputeWorkgroupSizeZ}].`);if(t*r*n>this.limits.maxComputeInvocationsPerWorkgroup)throw new Error(`workgroup size [${t}, ${r}, ${n}] exceeds the maximum workgroup invocations ${this.limits.maxComputeInvocationsPerWorkgroup}.`);let i=this.normalizedDispatchGroup[1]===1&&this.normalizedDispatchGroup[2]===1,a=i?`@builtin(global_invocation_id) global_id : vec3<u32>,
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
`)}get variablesInfo(){if(this.uniforms.length===0)return;let e=t=>[12,10,1,6][["u32","f16","f32","i32"].indexOf(t)];return this.uniforms.map(t=>[e(t.type),t.length??1])}},oh=(e,t)=>new Bu(e,t)}),Du,wi,Pu,Uu,Lu,qu,Ve,uh,lh,Ct=V(()=>{ie(),ae(),Ae(),se(),Du=(e,t)=>{if(!e||e.length!==1)throw new Error("Transpose requires 1 input.");if(t.length!==0&&t.length!==e[0].dims.length)throw new Error(`perm size ${t.length} does not match input rank ${e[0].dims.length}`)},wi=(e,t)=>t.length!==0?t:[...new Array(e).keys()].reverse(),Pu=(e,t)=>R.sortBasedOnPerm(e,wi(e.length,t)),Uu=(e,t,r,n)=>{let i=`fn perm(i: ${n.type.indices}) -> ${r.type.indices} {
    var a: ${r.type.indices};`;for(let a=0;a<t;++a)i+=`a[${e[a]}]=i[${a}];`;return i+="return a;}"},Lu=(e,t)=>{let r=[],n=[];for(let i=0;i<e.length;++i)e[i]!==1&&r.push(e[i]),e[t[i]]!==1&&n.push(t[i]);return{newShape:r,newPerm:n}},qu=(e,t)=>{let r=0;for(let n=0;n<e.length;++n)if(t[e[n]]!==1){if(e[n]<r)return!1;r=e[n]}return!0},Ve=(e,t)=>{let r=e.dataType,n=e.dims.length,i=wi(n,t),a=Pu(e.dims,i),s=e.dims,o=a,u=n<2||qu(i,e.dims),d;if(u)return d=m=>{let _=P("input",r,s,4),v=te("output",r,o,4);return`
  ${m.registerUniform("output_size","u32").declareVariables(_,v)}
  ${m.mainStart()}
    ${m.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
    output[global_idx] = input[global_idx];
  }`},{name:"TransposeCopy",shaderCache:{inputDependencies:["type"]},getRunData:()=>{let m=R.size(a);return{outputs:[{dims:a,dataType:e.dataType}],dispatchGroup:{x:Math.ceil(m/64/4)},programUniforms:[{type:12,data:Math.ceil(m/4)}]}},getShaderSource:d};let{newShape:p,newPerm:c}=Lu(e.dims,i),f=R.areEqual(c,[2,3,1]),g=R.areEqual(c,[3,1,2]);if(p.length===2||f||g){s=f?[p[0],p[1]*p[2]]:g?[p[0]*p[1],p[2]]:p,o=[s[1],s[0]];let m=16;return d=_=>{let v=P("a",r,s.length),w=te("output",r,o.length);return`
  ${_.registerUniform("output_size","u32").declareVariables(v,w)}
  var<workgroup> tile : array<array<${w.type.value}, ${m+1}>, ${m}>;
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
      ${w.setByIndices(`${w.type.indices}(output_row, output_col)`,"tile[local_id.x][local_id.y]")}
    }
  }`},{name:"TransposeShared",shaderCache:{inputDependencies:["type"]},getRunData:()=>{let _=R.size(a);return{outputs:[{dims:a,dataType:e.dataType}],dispatchGroup:{x:Math.ceil(o[1]/m),y:Math.ceil(o[0]/m)},programUniforms:[{type:12,data:_},...ne(s,o)]}},getShaderSource:d}}return d=m=>{let _=P("a",r,s.length),v=te("output",r,o.length);return`
  ${m.registerUniform("output_size","u32").declareVariables(_,v)}

  ${Uu(i,n,_,v)}

  ${m.mainStart()}
    ${m.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}

    let indices = ${v.offsetToIndices("global_idx")};
    let aIndices = perm(indices);

    ${v.setByOffset("global_idx",_.getByIndices("aIndices"))}
  }`},{name:"Transpose",shaderCache:{hint:`${t}`,inputDependencies:["rank"]},getRunData:()=>{let m=R.size(a);return{outputs:[{dims:a,dataType:e.dataType}],dispatchGroup:{x:Math.ceil(m/64)},programUniforms:[{type:12,data:m},...ne(s,o)]}},getShaderSource:d}},uh=(e,t)=>{Du(e.inputs,t.perm),e.compute(Ve(e.inputs[0],t.perm))},lh=e=>_e({perm:e.perm})}),Wu,Fu,Gu,Vu,Hu,ju,Ku,Xu,Zu,Yu,Ye,dh,ph,ch,hh,fh,mh,gh,yh,_h,bh,j_=V(()=>{ie(),ae(),se(),Wa(),Ct(),Wu={max:"select(bestValue, candidate, candidate > bestValue)",min:"select(bestValue, candidate, candidate < bestValue)",mean:"bestValue + candidate",sum:"bestValue + candidate",prod:"bestValue * candidate",sumSquare:"bestValue + candidate * candidate",logSumExp:"bestValue + exp(candidate)",l1:"bestValue + abs(candidate)",l2:"bestValue + candidate * candidate",logSum:"bestValue + candidate"},Fu={max:"select(bestValue, candidate, candidate > bestValue)",min:"select(bestValue, candidate, candidate < bestValue)",mean:"bestValue + candidate",sum:"bestValue + candidate",prod:"bestValue * candidate",sumSquare:"bestValue + candidate",logSumExp:"bestValue + candidate",l1:"bestValue + candidate",l2:"bestValue + candidate",logSum:"bestValue + candidate"},Gu={max:"_A[offset]",min:"_A[offset]",mean:"0",sum:"0",prod:"1",sumSquare:"0",logSumExp:"0",l1:"0",l2:"0",logSum:"0"},Vu={max:"bestValue",min:"bestValue",sum:"bestValue",prod:"bestValue",sumSquare:"bestValue",logSumExp:"log(bestValue)",l1:"bestValue",l2:"sqrt(bestValue)",logSum:"log(bestValue)"},Hu=(e,t)=>{let r=[];for(let n=t-e;n<t;++n)r.push(n);return r},ju=(e,t)=>{let r=[],n=e.length;for(let a=0;a<n;a++)t.indexOf(a)===-1&&r.push(e[a]);let i=t.map(a=>e[a]);return[r,i]},Ku=(e,t)=>{let r=e.length+t.length,n=[],i=0;for(let a=0;a<r;a++)t.indexOf(a)===-1?n.push(e[i++]):n.push(1);return n},Xu=(e,t)=>{for(let r=0;r<e.length;++r)if(e[e.length-r-1]!==t-1-r)return!1;return!0},Zu=(e,t)=>{let r=[];if(!Xu(e,t)){for(let n=0;n<t;++n)e.indexOf(n)===-1&&r.push(n);e.forEach(n=>r.push(n))}return r},Yu=(e,t,r,n,i,a,s)=>{let o=r[0].dims,u=R.size(a),d=R.size(s),p=P("_A",r[0].dataType,o),c=te("output",i,a),f=64;u===1&&(f=256);let g=`
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

          var bestValue = f32(${Gu[n]});
          let Length = uniforms.reduceSize;
          for (var k = local_idx; k < Length; k = k + ${f}) {
           let candidate = f32(${p.getByOffset("offset + k")});
           bestValue = ${Wu[n]};
          }
          aBestValues[local_idx] = bestValue;
          workgroupBarrier();

         var reduceSize = min(Length, ${f}u);
         for (var currentSize = reduceSize / 2u; reduceSize > 1u;
             currentSize = reduceSize / 2u) {
           let interval = DIV_CEIL(reduceSize, 2u);
           if (local_idx < currentSize) {
            let candidate = aBestValues[local_idx + interval];
            bestValue = ${Fu[n]};
            aBestValues[local_idx] = bestValue;
           }
           reduceSize = interval;
           workgroupBarrier();
         }

         if (local_idx == 0u) {
          ${c.setByOffset("outputIndex",`${n==="mean"?`${c.type.storage}(bestValue / f32(uniforms.reduceSize))`:`${c.type.storage}(${Vu[n]})`}`)};
         }
        }`;return{name:e,shaderCache:{hint:`${t};${f}`,inputDependencies:["type"]},getShaderSource:m,getRunData:()=>({outputs:[{dims:a,dataType:i}],dispatchGroup:{x:u},programUniforms:[{type:12,data:d}]})}},Ye=(e,t,r,n)=>{let i=e.inputs.length===1?r:ca(e.inputs,r),a=i.axes;a.length===0&&!i.noopWithEmptyAxes&&(a=e.inputs[0].dims.map((g,m)=>m));let s=R.normalizeAxes(a,e.inputs[0].dims.length),o=s,u=e.inputs[0],d=Zu(o,e.inputs[0].dims.length);d.length>0&&(u=e.compute(Ve(e.inputs[0],d),{inputs:[0],outputs:[-1]})[0],o=Hu(o.length,u.dims.length));let[p,c]=ju(u.dims,o),f=p;i.keepDims&&(f=Ku(p,s)),e.compute(Yu(t,i.cacheKey,[u],n,e.inputs[0].dataType,f,c),{inputs:[u]})},dh=(e,t)=>{Ye(e,"ReduceMeanShared",t,"mean")},ph=(e,t)=>{Ye(e,"ReduceL1Shared",t,"l1")},ch=(e,t)=>{Ye(e,"ReduceL2Shared",t,"l2")},hh=(e,t)=>{Ye(e,"ReduceLogSumExpShared",t,"logSumExp")},fh=(e,t)=>{Ye(e,"ReduceMaxShared",t,"max")},mh=(e,t)=>{Ye(e,"ReduceMinShared",t,"min")},gh=(e,t)=>{Ye(e,"ReduceProdShared",t,"prod")},yh=(e,t)=>{Ye(e,"ReduceSumShared",t,"sum")},_h=(e,t)=>{Ye(e,"ReduceSumSquareShared",t,"sumSquare")},bh=(e,t)=>{Ye(e,"ReduceLogSumShared",t,"logSum")}}),Qe,Qu,bn,ca,Je,Ju,el,tl,rl,nl,il,al,sl,ol,ul,et,wh,$h,vh,xh,Sh,kh,Th,Ih,Eh,Ch,Wa=V(()=>{ie(),ae(),Ae(),se(),j_(),Qe=e=>{if(!e||e.length===0||e.length>2)throw new Error("Reduce op requires 1 or 2 inputs.");if(e.length===2&&e[1].dims.length!==1)throw new Error("Invalid axes input dims.")},Qu=e=>["","",`var value = ${e.getByIndices("input_indices")};`,""],bn=(e,t,r,n,i,a,s=!1,o=!1)=>{let u=[],d=r[0].dims,p=d.length,c=R.normalizeAxes(i,p),f=!o&&c.length===0;d.forEach((_,v)=>{f||c.indexOf(v)>=0?s&&u.push(1):u.push(_)});let g=u.length,m=R.size(u);return{name:e,shaderCache:t,getShaderSource:_=>{let v=[],w=P("_A",r[0].dataType,p),$=te("output",a,g),S=n(w,$,c),x=S[2];for(let I=0,E=0;I<p;I++)f||c.indexOf(I)>=0?(s&&E++,x=`for(var j${I}: u32 = 0; j${I} < ${d[I]}; j${I}++) {
                  ${S[2].includes("last_index")?`let last_index = j${I};`:""}
                  ${w.indicesSet("input_indices",I,`j${I}`)}
                  ${x}
                }`):(v.push(`${w.indicesSet("input_indices",I,$.indicesGet("output_indices",E))};`),E++);return`

        ${_.registerUniform("output_size","u32").declareVariables(w,$)}

        ${_.mainStart()}
          ${_.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
          var input_indices: ${w.type.indices};
          let output_indices = ${$.offsetToIndices("global_idx")};

          ${v.join(`
`)}
          ${S[0]}       // init ops for reduce max/min
          ${S[1]}
          ${x}
          ${S[3]}
          ${S.length===4?$.setByOffset("global_idx","value"):S.slice(4).join(`
`)}
        }`},getRunData:()=>({outputs:[{dims:u,dataType:a}],dispatchGroup:{x:Math.ceil(m/64)},programUniforms:[{type:12,data:m},...ne(d,u)]})}},ca=(e,t)=>{let r=[];return e[1].dims[0]>0&&e[1].getBigInt64Array().forEach(n=>r.push(Number(n))),_e({axes:r,keepDims:t.keepDims,noopWithEmptyAxes:t.noopWithEmptyAxes})},Je=(e,t,r,n)=>{let i=e.inputs,a=i.length===1?r:ca(i,r);e.compute(bn(t,{hint:a.cacheKey,inputDependencies:["rank"]},[i[0]],a.noopWithEmptyAxes&&a.axes.length===0?Qu:n,a.axes,i[0].dataType,a.keepDims,a.noopWithEmptyAxes),{inputs:[0]})},Ju=(e,t)=>{Qe(e.inputs),Je(e,"ReduceLogSum",t,(r,n)=>[`var value = ${n.type.storage}(0);`,"",`value += ${r.getByIndices("input_indices")};`,"value = log(value);"])},el=(e,t)=>{Qe(e.inputs),Je(e,"ReduceL1",t,(r,n)=>[`var value = ${n.type.storage}(0);`,"",`value += abs(${r.getByIndices("input_indices")});`,""])},tl=(e,t)=>{Qe(e.inputs),Je(e,"ReduceL2",t,(r,n)=>[`var t = ${n.type.value}(0); var value = ${n.type.value}(0);`,"",`t = ${r.getByIndices("input_indices")}; value += (t * t);`,"value = sqrt(value);"])},rl=(e,t)=>{Qe(e.inputs),Je(e,"ReduceLogSumExp",t,(r,n)=>[`var value = ${n.type.storage}(0);`,"",`value += exp(${r.getByIndices("input_indices")});`,"value = log(value);"])},nl=(e,t)=>{Qe(e.inputs),Je(e,"ReduceMax",t,(r,n,i)=>{let a=[];for(let s=0;s<r.rank;s++)(i.indexOf(s)>=0||i.length===0)&&a.push(r.indicesSet("input_indices",s,0));return[`${a.join(`
`)}`,`var value = ${r.getByIndices("input_indices")};`,`value = max(value, ${r.getByIndices("input_indices")});`,""]})},il=(e,t)=>{Qe(e.inputs),Je(e,"ReduceMean",t,(r,n,i)=>{let a=1;for(let s=0;s<r.rank;s++)(i.indexOf(s)>=0||i.length===0)&&(a*=e.inputs[0].dims[s]);return["var sum = f32(0);","",`sum += f32(${r.getByIndices("input_indices")});`,`let value = ${n.type.value}(sum / ${a});`]})},al=(e,t)=>{Qe(e.inputs),Je(e,"ReduceMin",t,(r,n,i)=>{let a=[];for(let s=0;s<r.rank;s++)(i.indexOf(s)>=0||i.length===0)&&a.push(`input_indices[${s}] = 0;`);return[`${a.join(`
`)}`,`var value = ${r.getByIndices("input_indices")};`,`value = min(value, ${r.getByIndices("input_indices")});`,""]})},sl=(e,t)=>{Qe(e.inputs),Je(e,"ReduceProd",t,(r,n)=>[`var value = ${n.type.storage}(1);`,"",`value *= ${r.getByIndices("input_indices")};`,""])},ol=(e,t)=>{Qe(e.inputs),Je(e,"ReduceSum",t,(r,n)=>[`var value = ${n.type.storage}(0);`,"",`value += ${r.getByIndices("input_indices")};`,""])},ul=(e,t)=>{Qe(e.inputs),Je(e,"ReduceSumSquare",t,(r,n)=>[`var t = ${n.type.value}(0); var value = ${n.type.value}(0);`,"",`t = ${r.getByIndices("input_indices")}; value += t * t;`,""])},et=(e,t,r)=>{if(t.length===0)return r;let n=1,i=1;for(let a=0;a<t.length;a++)t.indexOf(a)===-1?n*=e[a]:i*=e[a];return i<32&&n>1024},wh=(e,t)=>{et(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?il(e,t):dh(e,t)},$h=(e,t)=>{et(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?el(e,t):ph(e,t)},vh=(e,t)=>{et(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?tl(e,t):ch(e,t)},xh=(e,t)=>{et(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?rl(e,t):hh(e,t)},Sh=(e,t)=>{et(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?nl(e,t):fh(e,t)},kh=(e,t)=>{et(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?al(e,t):mh(e,t)},Th=(e,t)=>{et(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?sl(e,t):gh(e,t)},Ih=(e,t)=>{et(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?ol(e,t):yh(e,t)},Eh=(e,t)=>{et(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?ul(e,t):_h(e,t)},Ch=(e,t)=>{et(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?Ju(e,t):bh(e,t)}}),$i,zh,Ah,ha,K_=V(()=>{ie(),Ae(),Wa(),$i=e=>{if(!e||e.length===0||e.length>2)throw new Error("ArgMinMaxOp op requires 1 or 2 inputs.");if(e[0].dataType!==1)throw new Error("Invalid input type.")},zh=(e,t)=>{$i(e.inputs);let r=(n,i,a)=>{let s=[];for(let o=0;o<n.rank;o++)(a.indexOf(o)>=0||a.length===0)&&s.push(`input_indices[${o}] = 0;`);return[`${s.join(`
`)}`,`var value = ${n.getByIndices("input_indices")};
var best_index : i32 = 0;`,`if (${n.getByIndices("input_indices")} ${t.selectLastIndex>0?"<=":"<"} value) {
         value = ${n.getByIndices("input_indices")};
         best_index = i32(last_index);
       }`,"",i.setByOffset("global_idx","best_index")]};e.compute(bn("ArgMin",{hint:t.cacheKey,inputDependencies:["rank"]},[e.inputs[0]],r,[t.axis],7,t.keepDims),{inputs:[0]})},Ah=(e,t)=>{$i(e.inputs);let r=(n,i,a)=>{let s=[];for(let o=0;o<n.rank;o++)(a.indexOf(o)>=0||a.length===0)&&s.push(`input_indices[${o}] = 0;`);return[`${s.join(`
`)}`,`var value = ${n.getByIndices("input_indices")};
var best_index : i32 = 0;`,`if (${n.getByIndices("input_indices")} ${t.selectLastIndex>0?">=":">"} value) {
         value = ${n.getByIndices("input_indices")};
         best_index = i32(last_index);
       }`,"",i.setByOffset("global_idx","best_index")]};e.compute(bn("argMax",{hint:t.cacheKey,inputDependencies:["rank"]},[e.inputs[0]],r,[t.axis],7,t.keepDims),{inputs:[0]})},ha=e=>_e(e)}),ll,Jr,dl,pl,cl,Ar,hl,Mh,Fa=V(()=>{ie(),ae(),La(),se(),ll=(e,t)=>{let r=e[0],n=e[1],i=e[2],a=e[3],s=e[4],o=e[5];if(s&&o)throw new Error("Attention cannot have both past and attention_bias");if(r.dims.length!==3)throw new Error('Input "input" must have 3 dimensions');let u=r.dims[0],d=r.dims[1],p=r.dims[2];if(i.dims.length!==1)throw new Error('Input "bias" is expected to have 1 dimensions');if(n.dims.length!==2)throw new Error('Input "weights" is expected to have 2 dimensions');if(n.dims[0]!==p)throw new Error("Input 1 dimension 0 should have same length as dimension 2 of input 0");if(i.dims[0]!==n.dims[1])throw new Error('Input "bias" dimension 0 should have same length as dimension 1 of input "weights"');let c=i.dims[0]/3,f=c,g=f;if(t.qkvHiddenSizes.length>0){if(t.qkvHiddenSizes.length!==3)throw new Error("qkv_hidden_sizes attribute should have 3 elements");for(let S of t.qkvHiddenSizes)if(S%t.numHeads!==0)throw new Error("qkv_hidden_sizes should be divisible by num_heads");c=t.qkvHiddenSizes[0],f=t.qkvHiddenSizes[1],g=t.qkvHiddenSizes[2]}let m=d;if(c!==f)throw new Error("qkv_hidden_sizes first element should be same as the second");if(i.dims[0]!==c+f+g)throw new Error('Input "bias" dimension 0 should have same length as sum of Q/K/V hidden sizes');let _=0;if(s){if(f!==g)throw new Error('Input "past" expect k_hidden_size == v_hidden_size');if(s.dims.length!==5)throw new Error('Input "past" must have 5 dimensions');if(s.dims[0]!==2)throw new Error('Input "past" first dimension must be 2');if(s.dims[1]!==u)throw new Error('Input "past" second dimension must be batch_size');if(s.dims[2]!==t.numHeads)throw new Error('Input "past" third dimension must be num_heads');if(s.dims[4]!==f/t.numHeads)throw new Error('Input "past" fifth dimension must be k_hidden_size / num_heads');t.pastPresentShareBuffer||(_=s.dims[3])}let v=m+_,w=-1,$=0;if(a)throw new Error("Mask not supported");if(s)throw new Error("past is not supported");if(o){if(o.dims.length!==4)throw new Error('Input "attention_bias" must have 4 dimensions');if(o.dims[0]!==u||o.dims[1]!==t.numHeads||o.dims[2]!==d||o.dims[3]!==v)throw new Error('Expect "attention_bias" shape (batch_size, num_heads, sequence_length, total_sequence_length)')}return{batchSize:u,sequenceLength:d,pastSequenceLength:_,kvSequenceLength:m,totalSequenceLength:v,maxSequenceLength:w,inputHiddenSize:p,hiddenSize:c,vHiddenSize:g,headSize:Math.floor(c/t.numHeads),vHeadSize:Math.floor(g/t.numHeads),numHeads:t.numHeads,isUnidirectional:!1,pastPresentShareBuffer:!1,maskFilterValue:t.maskFilterValue,maskType:$,scale:t.scale,broadcastResPosBias:!1,passPastInKv:!1,qkvFormat:1}},Jr=(e,t,r)=>t&&e?`
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
    `,dl=(e,t,r,n,i,a,s,o)=>{let u=Ce(s?1:a),d=64,p=a/u;p<d&&(d=32);let c=Math.ceil(a/u/d),f=[{type:12,data:t},{type:12,data:r},{type:12,data:n},{type:12,data:i},{type:12,data:p},{type:12,data:c}],g=Re(e.dataType,u),m=De(1,u),_=["type"];s&&_.push("type"),o&&_.push("type");let v=w=>{let $=te("x",e.dataType,e.dims,u),S=[$],x=s?P("seq_lens",s.dataType,s.dims):void 0;x&&S.push(x);let I=o?P("total_sequence_length_input",o.dataType,o.dims):void 0;I&&S.push(I);let E=De(e.dataType),z=[{name:"batch_size",type:"u32"},{name:"num_heads",type:"u32"},{name:"past_sequence_length",type:"u32"},{name:"sequence_length",type:"u32"},{name:"total_sequence_length",type:"u32"},{name:"elements_per_thread",type:"u32"}];return`
  var<workgroup> thread_max: array<f32, ${d}>;
  var<workgroup> thread_sum: array<f32, ${d}>;
  ${w.registerUniforms(z).declareVariables(...S)}
  ${w.mainStart([d,1,1])}
    let batchIdx = workgroup_id.z / uniforms.num_heads;
    let headIdx = workgroup_id.z % uniforms.num_heads;
    let sequence_length = uniforms.sequence_length;
    var total_sequence_length = uniforms.total_sequence_length;
    ${Jr(x,I,!1)}
    let local_offset = local_idx * uniforms.elements_per_thread;
    let offset = (global_idx / ${d}) * uniforms.total_sequence_length + local_offset;
    let seq_causal_length = ${s?"u32(past_sequence_length + workgroup_id.y + 1)":"total_sequence_length"};
    var thread_max_vector = ${m}(-3.4028234663852886e+38f);
    for (var i: u32 = 0; i < uniforms.elements_per_thread && i + local_offset < seq_causal_length; i++) {
      thread_max_vector = max(${m}(x[offset + i]), thread_max_vector);
    }
    thread_max[local_idx] = ${(()=>{switch(u){case 1:return"thread_max_vector";case 2:return"max(thread_max_vector.x, thread_max_vector.y)";case 4:return"max(max(thread_max_vector.x, thread_max_vector.y), max(thread_max_vector.z, thread_max_vector.w))";default:throw new Error(`Unsupported components: ${u}`)}})()};
    workgroupBarrier();

    var max_value =  f32(-3.4028234663852886e+38f);
    for (var i = 0u; i < ${d}; i++) {
      max_value = max(thread_max[i], max_value);
    }

    var sum_vector = ${m}(0);
    for (var i: u32 = 0; i < uniforms.elements_per_thread && i + local_offset < seq_causal_length; i++) {
      sum_vector += exp(${m}(x[offset + i]) - max_value);
    }
    thread_sum[local_idx] = ${(()=>{switch(u){case 1:return"sum_vector";case 2:return"sum_vector.x + sum_vector.y";case 4:return"sum_vector.x + sum_vector.y + sum_vector.z + sum_vector.w";default:throw new Error(`Unsupported components: ${u}`)}})()};
    workgroupBarrier();

    var sum: f32 = 0;
    for (var i = 0u; i < ${d}; i++) {
      sum += thread_sum[i];
    }

    if (sum == 0) {
      for (var i: u32 = 0; i < uniforms.elements_per_thread && i + local_offset < seq_causal_length; i++) {
        x[offset + i] = ${$.type.value}(${E}(1.0) / ${E}(seq_causal_length));
      }
    } else {
      for (var i: u32 = 0; i < uniforms.elements_per_thread && i + local_offset < seq_causal_length; i++) {
        var f32input = ${m}(x[offset + i]);
        x[offset + i] = ${$.type.value}(exp(f32input - max_value) / sum);
      }
    }
      ${s?`
        for (var total_seq_id: u32 = seq_causal_length; total_seq_id + local_offset < uniforms.total_sequence_length; total_seq_id++) {
          x[offset + total_seq_id] = ${$.type.value}(${E}(0));
        }`:""};
  }`};return{name:"AttentionProbsSoftmax",shaderCache:{hint:`${d};${g};${u}`,inputDependencies:_},getShaderSource:v,getRunData:()=>({outputs:[],dispatchGroup:{x:1,y:i,z:t*r},programUniforms:f})}},pl=(e,t,r,n,i,a,s,o,u)=>{let d=s+a.kvSequenceLength,p=[a.batchSize,a.numHeads,a.sequenceLength,d],c=e>1&&n,f=a.kvNumHeads?a.kvNumHeads:a.numHeads,g=c?[a.batchSize,f,d,a.headSize]:void 0,m=a.nReps?a.nReps:1,_=a.scale===0?1/Math.sqrt(a.headSize):a.scale,v=Ce(a.headSize),w=a.headSize/v,$=12,S={x:Math.ceil(d/$),y:Math.ceil(a.sequenceLength/$),z:a.batchSize*a.numHeads},x=[{type:12,data:a.sequenceLength},{type:12,data:w},{type:12,data:d},{type:12,data:a.numHeads},{type:12,data:a.headSize},{type:1,data:_},{type:12,data:s},{type:12,data:a.kvSequenceLength},{type:12,data:m}],I=c&&n&&R.size(n.dims)>0,E=["type","type"];I&&E.push("type"),i&&E.push("type"),o&&E.push("type"),u&&E.push("type");let z=[{dims:p,dataType:t.dataType,gpuDataType:0}];c&&z.push({dims:g,dataType:t.dataType,gpuDataType:0});let k=N=>{let O=P("q",t.dataType,t.dims,v),F=P("key",r.dataType,r.dims,v),q=[O,F];if(I){let L=P("past_key",n.dataType,n.dims,v);q.push(L)}i&&q.push(P("attention_bias",i.dataType,i.dims));let H=o?P("seq_lens",o.dataType,o.dims):void 0;H&&q.push(H);let M=u?P("total_sequence_length_input",u.dataType,u.dims):void 0;M&&q.push(M);let B=te("output",t.dataType,p),G=[B];c&&G.push(te("present_key",t.dataType,g,v));let J=De(1,v),Y=[{name:"M",type:"u32"},{name:"K",type:"u32"},{name:"N",type:"u32"},{name:"num_heads",type:"u32"},{name:"head_size",type:"u32"},{name:"alpha",type:"f32"},{name:"past_sequence_length",type:"u32"},{name:"kv_sequence_length",type:"u32"},{name:"n_reps",type:"u32"}];return`
  const TILE_SIZE = ${$}u;

  var<workgroup> tileQ: array<${O.type.storage}, ${$*$}>;
  var<workgroup> tileK: array<${O.type.storage}, ${$*$}>;
  ${N.registerUniforms(Y).declareVariables(...q,...G)}
  ${N.mainStart([$,$,1])}
    // x holds the N and y holds the M
    let headIdx = workgroup_id.z % uniforms.num_heads;
    let kvHeadIdx = ${m===1?"headIdx":"headIdx / uniforms.n_reps"};
    let kv_num_heads = ${m===1?"uniforms.num_heads":"uniforms.num_heads / uniforms.n_reps"};
    let batchIdx = workgroup_id.z / uniforms.num_heads;
    let m = workgroup_id.y * TILE_SIZE;
    let n = workgroup_id.x * TILE_SIZE;
    let sequence_length = uniforms.M;
    var total_sequence_length = uniforms.N;
    ${Jr(H,M,!0)}
    let absKvHeadIdx = batchIdx * kv_num_heads + kvHeadIdx;
    let qOffset = workgroup_id.z * uniforms.M * uniforms.K + m * uniforms.K;
    ${I&&c?"let pastKeyOffset = absKvHeadIdx * uniforms.past_sequence_length * uniforms.K;":""};
    let kOffset = absKvHeadIdx * uniforms.kv_sequence_length * uniforms.K;
    ${c?"let presentKeyOffset = absKvHeadIdx * uniforms.N * uniforms.K;":""}
    var value = ${J}(0);
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
          value += ${J}(tileQ[TILE_SIZE * local_id.y + k] * tileK[TILE_SIZE * local_id.x + k]);
      }

      workgroupBarrier();
    }

    if (global_id.y < uniforms.M && global_id.x < total_sequence_length) {
      let headOffset = workgroup_id.z * uniforms.M * uniforms.N;
      let outputIdx = headOffset + global_id.y * uniforms.N + global_id.x;
      var sum: f32 = ${(()=>{switch(v){case 1:return"value";case 2:return"value.x + value.y";case 4:return"value.x + value.y + value.z + value.w";default:throw new Error(`Unsupported components: ${v}`)}})()};
        output[outputIdx] = ${B.type.value} (sum * uniforms.alpha) + ${i?"attention_bias[outputIdx]":"0.0"};
    }
  }`};return{name:"AttentionProbs",shaderCache:{hint:`${v};${i!==void 0};${n!==void 0};${e}`,inputDependencies:E},getRunData:()=>({outputs:z,dispatchGroup:S,programUniforms:x}),getShaderSource:k}},cl=(e,t,r,n,i,a,s=void 0,o=void 0)=>{let u=a+i.kvSequenceLength,d=i.nReps?i.nReps:1,p=i.vHiddenSize*d,c=e>1&&n,f=i.kvNumHeads?i.kvNumHeads:i.numHeads,g=c?[i.batchSize,f,u,i.headSize]:void 0,m=[i.batchSize,i.sequenceLength,p],_=12,v={x:Math.ceil(i.vHeadSize/_),y:Math.ceil(i.sequenceLength/_),z:i.batchSize*i.numHeads},w=[{type:12,data:i.sequenceLength},{type:12,data:u},{type:12,data:i.vHeadSize},{type:12,data:i.numHeads},{type:12,data:i.headSize},{type:12,data:p},{type:12,data:a},{type:12,data:i.kvSequenceLength},{type:12,data:d}],$=c&&n&&R.size(n.dims)>0,S=["type","type"];$&&S.push("type"),s&&S.push("type"),o&&S.push("type");let x=[{dims:m,dataType:t.dataType,gpuDataType:0}];c&&x.push({dims:g,dataType:t.dataType,gpuDataType:0});let I=E=>{let z=P("probs",t.dataType,t.dims),k=P("v",r.dataType,r.dims),N=[z,k];$&&N.push(P("past_value",n.dataType,n.dims));let O=s?P("seq_lens",s.dataType,s.dims):void 0;s&&N.push(O);let F=o?P("total_sequence_length_input",o.dataType,o.dims):void 0;o&&N.push(F);let q=[te("output",t.dataType,m)];c&&q.push(te("present_value",t.dataType,g));let H=[{name:"M",type:"u32"},{name:"K",type:"u32"},{name:"N",type:"u32"},{name:"num_heads",type:"u32"},{name:"head_size",type:"u32"},{name:"v_hidden_size",type:"u32"},{name:"past_sequence_length",type:"u32"},{name:"kv_sequence_length",type:"u32"},{name:"n_reps",type:"u32"}];return`
  const TILE_SIZE = ${_}u;
  var<workgroup> tileQ: array<${z.type.value}, ${_*_}>;
  var<workgroup> tileV: array<${z.type.value}, ${_*_}>;
  ${E.registerUniforms(H).declareVariables(...N,...q)}
  ${E.mainStart([_,_,1])}
   let headIdx = workgroup_id.z % uniforms.num_heads;
   let batchIdx = workgroup_id.z / uniforms.num_heads;
   let kvHeadIdx = ${d===1?"headIdx":"headIdx / uniforms.n_reps"};
   let kv_num_heads = ${d===1?"uniforms.num_heads":"uniforms.num_heads / uniforms.n_reps"};
   let m = global_id.y;
   let n = global_id.x;
   let sequence_length = uniforms.M;
   var total_sequence_length = uniforms.K;
   ${Jr(O,F,!0)}
   let offsetA = workgroup_id.z * uniforms.M * uniforms.K + m * uniforms.K;
   let absKvHeadIdx = batchIdx * kv_num_heads + kvHeadIdx; // kvHeadIdx is relative to the batch
   ${$&&c?"let pastValueOffset = absKvHeadIdx * uniforms.N * uniforms.past_sequence_length + n;":""};
   let vOffset = absKvHeadIdx * uniforms.N * uniforms.kv_sequence_length + n;
   ${c?"let presentValueOffset = absKvHeadIdx * uniforms.N * uniforms.K + n;":""}
   var value = ${z.type.storage}(0);
   for (var w: u32 = 0u; w < uniforms.K; w += TILE_SIZE) {
      if (m < uniforms.M && w + local_id.x < uniforms.K) {
        tileQ[TILE_SIZE * local_id.y + local_id.x] = probs[offsetA + w + local_id.x];
      }
      if (n < uniforms.N && w + local_id.y < uniforms.K) {
        var idx = TILE_SIZE * local_id.y + local_id.x;
        ${$&&c?`
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
  }`};return{name:"AttentionScore",shaderCache:{hint:`${n!==void 0};${e}`,inputDependencies:S},getRunData:()=>({outputs:x,dispatchGroup:v,programUniforms:w}),getShaderSource:I}},Ar=(e,t,r,n,i,a,s,o,u,d,p=void 0,c=void 0)=>{let f=Math.min(e.outputCount,1+(s?1:0)+(o?1:0)),g=f>1?s:void 0,m=f>1?o:void 0,_=f>1?d.pastSequenceLength:0,v=_+d.kvSequenceLength,w=u&&R.size(u.dims)>0?u:void 0,$=[t,r];g&&R.size(g.dims)>0&&$.push(g),w&&$.push(w),p&&$.push(p),c&&$.push(c);let S=e.compute(pl(f,t,r,g,w,d,_,p,c),{inputs:$,outputs:f>1?[-1,1]:[-1]})[0];e.compute(dl(S,d.batchSize,d.numHeads,_,d.sequenceLength,v,p,c),{inputs:p&&c?[S,p,c]:[S],outputs:[]});let x=[S,n];m&&R.size(m.dims)>0&&x.push(m),p&&x.push(p),c&&x.push(c),e.compute(cl(f,S,n,m,d,_,p,c),{inputs:x,outputs:f>1?[0,2]:[0]})},hl=(e,t)=>{let r=[t.batchSize,t.numHeads,t.sequenceLength,t.headSize],n=t.sequenceLength,i=t.inputHiddenSize,a=t.headSize,s=12,o={x:Math.ceil(t.headSize/s),y:Math.ceil(t.sequenceLength/s),z:t.batchSize*t.numHeads},u=[e.inputs[0],e.inputs[1],e.inputs[2]],d=[{type:12,data:n},{type:12,data:i},{type:12,data:a},{type:12,data:t.numHeads},{type:12,data:t.headSize},{type:12,data:t.hiddenSize},{type:12,data:t.hiddenSize+t.hiddenSize+t.vHiddenSize}],p=c=>{let f=te("output_q",u[0].dataType,r),g=te("output_k",u[0].dataType,r),m=te("output_v",u[0].dataType,r),_=P("input",u[0].dataType,u[0].dims),v=P("weight",u[1].dataType,u[1].dims),w=P("bias",u[2].dataType,u[2].dims),$=_.type.storage,S=[{name:"M",type:"u32"},{name:"K",type:"u32"},{name:"N",type:"u32"},{name:"num_heads",type:"u32"},{name:"head_size",type:"u32"},{name:"hidden_size",type:"u32"},{name:"ldb",type:"u32"}];return`
  const TILE_SIZE = ${s}u;
  var<workgroup> tileInput: array<${$}, ${s*s}>;
  var<workgroup> tileWeightQ: array<${$}, ${s*s}>;
  var<workgroup> tileWeightK: array<${$}, ${s*s}>;
  var<workgroup> tileWeightV: array<${$}, ${s*s}>;
  ${c.registerUniforms(S).declareVariables(_,v,w,f,g,m)}
  ${c.mainStart([s,s,1])}
    let batchIndex = workgroup_id.z / uniforms.num_heads;
    let headNumber = workgroup_id.z % uniforms.num_heads;
    let m = global_id.y;
    let n = global_id.x;

    let inputOffset = batchIndex * (uniforms.M * uniforms.K) + m * uniforms.K;
    let biasOffsetQ = headNumber * uniforms.head_size;
    let biasOffsetK = uniforms.hidden_size + biasOffsetQ;
    let biasOffsetV = uniforms.hidden_size + biasOffsetK;

    var valueQ = ${$}(0);
    var valueK = ${$}(0);
    var valueV = ${$}(0);
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
  }`};return e.compute({name:"AttentionPrepare",shaderCache:{inputDependencies:["type","type","type"]},getRunData:()=>({outputs:[{dims:r,dataType:e.inputs[0].dataType,gpuDataType:0},{dims:r,dataType:e.inputs[0].dataType,gpuDataType:0},{dims:r,dataType:e.inputs[0].dataType,gpuDataType:0}],dispatchGroup:o,programUniforms:d}),getShaderSource:p},{inputs:u,outputs:[-1,-1,-1]})},Mh=(e,t)=>{let r=ll(e.inputs,t),[n,i,a]=hl(e,r);return Ar(e,n,i,a,e.inputs[4],void 0,void 0,void 0,e.inputs[5],r)}}),fl,ml,gl,Oh,X_=V(()=>{Xe(),ie(),ae(),Ae(),se(),fl=(e,t)=>{if(!e||e.length!==5)throw new Error("BatchNormalization requires 5 inputs");let r=(n,i,a)=>{let s=i.length;if(s!==n.length)throw new Error(`${a}: num dimensions != ${s}`);i.forEach((o,u)=>{if(o!==n[u])throw new Error(`${a}: dim[${u}] do not match`)})};if(e[0].dims.length>1){let n=t.format==="NHWC"?t.spatial?e[0].dims.slice(-1):e[0].dims.slice(-1).concat(e[0].dims.slice(1,e[0].dims.length-1)):e[0].dims.slice(1,t.spatial?2:void 0);r(e[1].dims,n,"Invalid input scale"),r(e[2].dims,n,"Invalid input B"),r(e[3].dims,n,"Invalid input mean"),r(e[4].dims,n,"Invalid input var")}else r(e[1].dims,[1],"Invalid input scale"),r(e[2].dims,[1],"Invalid input B"),r(e[3].dims,[1],"Invalid input mean"),r(e[4].dims,[1],"Invalid input var")},ml=(e,t)=>{let{epsilon:r,spatial:n,format:i}=t,a=e[0].dims,s=n?Ce(a[a.length-1]):1,o=i==="NHWC"&&a.length>1?s:1,u=R.size(a)/s,d=n,p=d?a.length:a,c=P("x",e[0].dataType,e[0].dims,s),f=P("scale",e[1].dataType,e[1].dims,o),g=P("bias",e[2].dataType,e[2].dims,o),m=P("inputMean",e[3].dataType,e[3].dims,o),_=P("inputVar",e[4].dataType,e[4].dims,o),v=te("y",e[0].dataType,p,s),w=()=>{let S="";if(n)S=`let cOffset = ${a.length===1?"0u":i==="NHWC"?`outputIndices[${a.length-1}] / ${s}`:"outputIndices[1]"};`;else if(i==="NCHW")S=`
            ${v.indicesSet("outputIndices","0","0")}
            let cOffset = ${v.indicesToOffset("outputIndices")};`;else{S=`var cIndices = ${f.type.indices}(0);
                       cIndices[0] = outputIndices[${a.length-1}];`;for(let x=1;x<f.rank;x++)S+=`cIndices[${x}] = outputIndices[${x}];`;S+=`let cOffset = ${f.indicesToOffset("cIndices")};`}return S},$=S=>`
  const epsilon = ${r};
  ${S.registerUniform("outputSize","u32").declareVariables(c,f,g,m,_,v)}
  ${S.mainStart()}
  ${S.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}
    var outputIndices = ${v.offsetToIndices(`global_idx * ${s}`)};
    ${w()}
    let scale = ${f.getByOffset("cOffset")};
    let bias = ${g.getByOffset("cOffset")};
    let inputMean = ${m.getByOffset("cOffset")};
    let inputVar = ${_.getByOffset("cOffset")};
    let x = ${c.getByOffset("global_idx")};
    let value = (x - inputMean) * inverseSqrt(inputVar + epsilon) * scale + bias;
    ${v.setByOffset("global_idx","value")}
  }`;return{name:"BatchNormalization",shaderCache:{hint:`${t.epsilon}_${t.format}_${n}_${s}`,inputDependencies:d?["rank","type","type","type","type"]:void 0},getShaderSource:$,getRunData:()=>({outputs:[{dims:e[0].dims,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(u/64)},programUniforms:d?[{type:12,data:u},...ne(a)]:[{type:12,data:u}]})}},gl=e=>_e(e),Oh=(e,t)=>{let{inputs:r,outputCount:n}=e,i=gl({...t,outputCount:n});if($e.webgpu.validateInputContent&&fl(r,i),t.trainingMode)throw new Error("BatchNormalization trainingMode is not supported yet.");e.compute(ml(r,i))}}),yl,_l,Rh,Z_=V(()=>{ae(),se(),yl=e=>{if(e[0].dims.length!==3)throw new Error("input should have 3 dimensions");if(![320,640,1280].includes(e[0].dims[2]))throw new Error("number of channels should be 320, 640 or 1280");if(e[1].dims.length!==1)throw new Error("bias is expected to have 1 dimensions");if(e[0].dims[2]!==e[1].dims[0])throw new Error("last dimension of input and bias are not the same")},_l=e=>{let t=e[0].dims,r=e[0].dims[2],n=R.size(t)/4,i=e[0].dataType,a=P("input",i,t,4),s=P("bias",i,[r],4),o=P("residual",i,t,4),u=te("output",i,t,4);return{name:"BiasAdd",getRunData:()=>({outputs:[{dims:t,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(n/64)}}),getShaderSource:d=>`
  const channels = ${r}u / 4;
  ${d.declareVariables(a,s,o,u)}

  ${d.mainStart()}
    ${d.guardAgainstOutOfBoundsWorkgroupSizes(n)}
    let value = ${a.getByOffset("global_idx")}
      + ${s.getByOffset("global_idx % channels")} + ${o.getByOffset("global_idx")};
    ${u.setByOffset("global_idx","value")}
  }`}},Rh=e=>{yl(e.inputs),e.compute(_l(e.inputs))}}),bl,ye,Nh,Bh,Dh,Ph,Uh,Lh,qh,Wh,Fh,wl,Gh,Vh,Hh,jh,Tr,Kh,pn,Xh,Zh,Yh,Qh,Jh,ef,tf,rf,nf,af,sf,of,uf,lf,df,pf,vi,cf,fa,ma,hf,ff,mf,$l,vl,gf,Ga=V(()=>{ie(),ae(),Ae(),se(),bl=(e,t,r,n,i,a,s)=>{let o=Math.ceil(t/4),u="";typeof i=="string"?u=`${i}(a)`:u=i("a");let d=P("inputData",r,[o],4),p=te("outputData",n,[o],4),c=[{name:"vec_size",type:"u32"}];return s&&c.push(...s),`
      ${e.registerUniforms(c).declareVariables(d,p)}

  ${a??""}

  ${e.mainStart()}
    ${e.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.vec_size")}

    let a = ${d.getByOffset("global_idx")};
    ${p.setByOffset("global_idx",u)}
  }`},ye=(e,t,r,n,i,a=e.dataType,s,o)=>{let u=[{type:12,data:Math.ceil(R.size(e.dims)/4)}];return s&&u.push(...s),{name:t,shaderCache:{hint:i,inputDependencies:["type"]},getShaderSource:d=>bl(d,R.size(e.dims),e.dataType,a,r,n,o),getRunData:d=>({outputs:[{dims:e.dims,dataType:a}],dispatchGroup:{x:Math.ceil(R.size(d[0].dims)/64/4)},programUniforms:u})}},Nh=e=>{e.compute(ye(e.inputs[0],"Abs","abs"))},Bh=e=>{e.compute(ye(e.inputs[0],"Acos","acos"))},Dh=e=>{e.compute(ye(e.inputs[0],"Acosh","acosh"))},Ph=e=>{e.compute(ye(e.inputs[0],"Asin","asin"))},Uh=e=>{e.compute(ye(e.inputs[0],"Asinh","asinh"))},Lh=e=>{e.compute(ye(e.inputs[0],"Atan","atan"))},qh=e=>{e.compute(ye(e.inputs[0],"Atanh","atanh"))},Wh=e=>_e(e),Fh=(e,t)=>{let r;switch(t.to){case 10:r="vec4<f16>";break;case 1:r="vec4<f32>";break;case 12:r="vec4<u32>";break;case 6:r="vec4<i32>";break;case 9:r="vec4<bool>";break;default:throw new RangeError(`not supported type (specified in attribute 'to' from 'Cast' operator): ${t.to}`)}e.compute(ye(e.inputs[0],"Cast",r,void 0,t.cacheKey,t.to))},wl=e=>{let t,r,n=e.length>=2&&e[1].data!==0,i=e.length>=3&&e[2].data!==0;switch(e[0].dataType){case 1:t=n?e[1].getFloat32Array()[0]:-34028234663852886e22,r=i?e[2].getFloat32Array()[0]:34028234663852886e22;break;case 10:t=n?e[1].getUint16Array()[0]:64511,r=i?e[2].getUint16Array()[0]:31743;break;default:throw new Error("Unsupport data type")}return _e({min:t,max:r})},Gh=(e,t)=>{let r=t||wl(e.inputs),n=De(e.inputs[0].dataType);e.compute(ye(e.inputs[0],"Clip",i=>`clamp(${i}, vec4<${n}>(uniforms.min), vec4<${n}>(uniforms.max))`,void 0,r.cacheKey,void 0,[{type:e.inputs[0].dataType,data:r.min},{type:e.inputs[0].dataType,data:r.max}],[{name:"min",type:n},{name:"max",type:n}]),{inputs:[0]})},Vh=e=>{e.compute(ye(e.inputs[0],"Ceil","ceil"))},Hh=e=>{e.compute(ye(e.inputs[0],"Cos","cos"))},jh=e=>{e.compute(ye(e.inputs[0],"Cosh","cosh"))},Tr=e=>_e(e),Kh=(e,t)=>{let r=De(e.inputs[0].dataType);e.compute(ye(e.inputs[0],"Elu",n=>`elu_vf32(${n})`,`
  const elu_alpha_ = ${r}(${t.alpha});

  fn elu_f32(a: ${r}) -> ${r} {
  return select((exp(a) - 1.0) * elu_alpha_, a, a >= 0.0);
  }

  fn elu_vf32(v: vec4<${r}>) -> vec4<${r}> {
  return vec4(elu_f32(v.x), elu_f32(v.y), elu_f32(v.z), elu_f32(v.w));
  }`,t.cacheKey))},pn=(e="f32")=>`
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
}`,Xh=e=>{let t=De(e.inputs[0].dataType);e.compute(ye(e.inputs[0],"Erf",r=>`erf_vf32(${r})`,pn(t)))},Zh=e=>{e.compute(ye(e.inputs[0],"Exp","exp"))},Yh=e=>{e.compute(ye(e.inputs[0],"Floor","floor"))},Qh=e=>{let t=De(e.inputs[0].dataType);e.compute(ye(e.inputs[0],"Gelu",r=>`0.5 * ${r} * (1.0 + erf_vf32(${r} * 0.7071067811865475))`,pn(t)))},Jh=(e,t)=>{let r=De(e.inputs[0].dataType);e.compute(ye(e.inputs[0],"LeakyRelu",n=>`select(leaky_relu_alpha_ * ${n}, ${n}, ${n} >= vec4<${r}>(0.0))`,`const leaky_relu_alpha_ = ${r}(${t.alpha});`,t.cacheKey))},ef=e=>{e.compute(ye(e.inputs[0],"Not",t=>`!${t}`))},tf=e=>{e.compute(ye(e.inputs[0],"Neg",t=>`-${t}`))},rf=e=>{e.compute(ye(e.inputs[0],"Reciprocal",t=>`1.0/${t}`))},nf=e=>{let t=De(e.inputs[0].dataType);e.compute(ye(e.inputs[0],"Relu",r=>`select(vec4<${t}>(0.0), ${r}, ${r} > vec4<${t}>(0.0))`))},af=e=>{e.compute(ye(e.inputs[0],"Sigmoid",t=>`(1.0 / (1.0 + exp(-${t})))`))},sf=e=>_e(e),of=(e,t)=>{let r=De(e.inputs[0].dataType);e.compute(ye(e.inputs[0],"HardSigmoid",n=>`max(vec4<${r}>(0.0), min(vec4<${r}>(1.0), ${t.alpha} * ${n} + vec4<${r}>(${t.beta})))`,void 0,t.cacheKey))},uf=e=>{e.compute(ye(e.inputs[0],"Sin","sin"))},lf=e=>{e.compute(ye(e.inputs[0],"Sinh","sinh"))},df=e=>{e.compute(ye(e.inputs[0],"Sqrt","sqrt"))},pf=e=>{e.compute(ye(e.inputs[0],"Tan","tan"))},vi=e=>`sign(${e}) * (1 - exp(-2 * abs(${e}))) / (1 + exp(-2 * abs(${e})))`,cf=e=>{e.compute(ye(e.inputs[0],"Tanh",vi))},fa=(e="f32")=>`
const fast_gelu_a: ${e} = 0.5;
const fast_gelu_b: ${e} = 0.7978845608028654;
const fast_gelu_c: ${e} = 0.035677408136300125;

fn tanh_v(v: vec4<${e}>) -> vec4<${e}> {
  return ${vi("v")};
}
`,ma=e=>`(fast_gelu_a + fast_gelu_a * tanh_v(${e} * (fast_gelu_c * ${e} * ${e} + fast_gelu_b))) * ${e}`,hf=e=>{let t=De(e.inputs[0].dataType);e.compute(ye(e.inputs[0],"FastGelu",ma,fa(t),void 0,e.inputs[0].dataType))},ff=(e,t)=>{let r=De(e.inputs[0].dataType);return e.compute(ye(e.inputs[0],"ThresholdedRelu",n=>`select(vec4<${r}>(0.0), ${n}, ${n} > thresholded_relu_alpha_)`,`const thresholded_relu_alpha_ = vec4<${r}>(${t.alpha});`,t.cacheKey)),0},mf=e=>{e.compute(ye(e.inputs[0],"Log","log"))},$l=(e,t)=>`
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
`,vl=e=>`quick_gelu_impl(${e})`,gf=(e,t)=>{let r=De(e.inputs[0].dataType);e.compute(ye(e.inputs[0],"QuickGelu",vl,$l(r,t.alpha),t.cacheKey,e.inputs[0].dataType))}}),xl,Sl,yf,Y_=V(()=>{ae(),se(),Ga(),xl=e=>{if(e[0].dims.length!==3)throw new Error("input should have 3 dimensions");if(![2560,5120,10240].includes(e[0].dims[2]))throw new Error("hidden state should be 2560, 5120 or 10240");if(e[1].dims.length!==1)throw new Error("bias is expected to have 1 dimensions");if(e[0].dims[2]!==e[1].dims[0])throw new Error("last dimension of input and bias are not the same")},Sl=e=>{let t=e[0].dims.slice();t[2]=t[2]/2;let r=P("input",e[0].dataType,e[0].dims,4),n=P("bias",e[0].dataType,[e[0].dims[2]],4),i=te("output",e[0].dataType,t,4),a=R.size(t)/4,s=Re(e[0].dataType);return{name:"BiasSplitGelu",getRunData:()=>({outputs:[{dims:t,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(a/64)}}),getShaderSource:o=>`
  const M_SQRT2 = sqrt(2.0);
  const halfChannels = ${e[0].dims[2]/4/2}u;

  ${o.declareVariables(r,n,i)}

  ${pn(s)}

  ${o.mainStart()}
    ${o.guardAgainstOutOfBoundsWorkgroupSizes(a)}
    let biasIdx = global_idx % halfChannels;
    let batchIndex = global_idx / halfChannels;
    let inputOffset = biasIdx + batchIndex * halfChannels * 2;
    let valueLeft = input[inputOffset] + bias[biasIdx];
    let valueRight = input[inputOffset + halfChannels] + bias[biasIdx + halfChannels];
    let geluRight = valueRight * 0.5 * (erf_vf32(valueRight / M_SQRT2) + 1);

    ${i.setByOffset("global_idx","valueLeft * geluRight")}
  }`}},yf=e=>{xl(e.inputs),e.compute(Sl(e.inputs))}}),kl,Tl,tt,_f,bf,wf,$f,vf,xf,Sf,kf,Tf,If,Q_=V(()=>{ie(),ae(),se(),kl=(e,t,r,n,i,a,s,o,u,d,p,c)=>{let f,g;typeof o=="string"?f=g=($,S)=>`${o}((${$}),(${S}))`:typeof o=="function"?f=g=o:(f=o.scalar,g=o.vector);let m=te("outputData",p,n.length,4),_=P("aData",u,t.length,4),v=P("bData",d,r.length,4),w;if(i)if(a){let $=R.size(t)===1,S=R.size(r)===1,x=t.length>0&&t[t.length-1]%4===0,I=r.length>0&&r[r.length-1]%4===0;$||S?w=m.setByOffset("global_idx",g($?`${_.type.value}(${_.getByOffset("0")}.x)`:_.getByOffset("global_idx"),S?`${v.type.value}(${v.getByOffset("0")}.x)`:v.getByOffset("global_idx"))):w=`
            let outputIndices = ${m.offsetToIndices("global_idx * 4u")};
            let offsetA = ${_.broadcastedIndicesToOffset("outputIndices",m)};
            let offsetB = ${v.broadcastedIndicesToOffset("outputIndices",m)};
            ${m.setByOffset("global_idx",g(s||x?_.getByOffset("offsetA / 4u"):`${_.type.value}(${_.getByOffset("offsetA / 4u")}[offsetA % 4u])`,s||I?v.getByOffset("offsetB / 4u"):`${v.type.value}(${v.getByOffset("offsetB / 4u")}[offsetB % 4u])`))}
          `}else w=m.setByOffset("global_idx",g(_.getByOffset("global_idx"),v.getByOffset("global_idx")));else{if(!a)throw new Error("no necessary to use scalar implementation for element-wise binary op implementation.");let $=(S,x,I="")=>{let E=`aData[indexA${x}][componentA${x}]`,z=`bData[indexB${x}][componentB${x}]`;return`
            let outputIndices${x} = ${m.offsetToIndices(`global_idx * 4u + ${x}u`)};
            let offsetA${x} = ${_.broadcastedIndicesToOffset(`outputIndices${x}`,m)};
            let offsetB${x} = ${v.broadcastedIndicesToOffset(`outputIndices${x}`,m)};
            let indexA${x} = offsetA${x} / 4u;
            let indexB${x} = offsetB${x} / 4u;
            let componentA${x} = offsetA${x} % 4u;
            let componentB${x} = offsetB${x} % 4u;
            ${S}[${x}] = ${I}(${f(E,z)});
          `};p===9?w=`
            var data = vec4<u32>(0);
            ${$("data",0,"u32")}
            ${$("data",1,"u32")}
            ${$("data",2,"u32")}
            ${$("data",3,"u32")}
            outputData[global_idx] = dot(vec4<u32>(0x1, 0x100, 0x10000, 0x1000000), vec4<u32>(data));`:w=`
            ${$("outputData[global_idx]",0)}
            ${$("outputData[global_idx]",1)}
            ${$("outputData[global_idx]",2)}
            ${$("outputData[global_idx]",3)}
          `}return`
        ${e.registerUniform("vec_size","u32").declareVariables(_,v,m)}

        ${c??""}

        ${e.mainStart()}
        ${e.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.vec_size")}
        ${w}
      }`},Tl=(e,t,r,n,i,a,s=r.dataType)=>{let o=r.dims.map(Number),u=n.dims.map(Number),d=!R.areEqual(o,u),p=o,c=R.size(o),f=!1,g=!1,m=[d];if(d){let _=sr.calcShape(o,u,!1);if(!_)throw new Error("Can't perform binary op on the given tensors");p=_.slice(),c=R.size(p);let v=R.size(o)===1,w=R.size(u)===1,$=o.length>0&&o[o.length-1]%4===0,S=u.length>0&&u[u.length-1]%4===0;m.push(v),m.push(w),m.push($),m.push(S);let x=1;for(let I=1;I<p.length;I++){let E=o[o.length-I],z=u[u.length-I];if(E===z)x*=E;else break}x%4===0?(g=!0,f=!0):(v||w||$||S)&&(f=!0)}else f=!0;return m.push(f),{name:e,shaderCache:{hint:t+m.map(_=>_.toString()).join("_"),inputDependencies:["rank","rank"]},getShaderSource:_=>kl(_,o,u,p,f,d,g,i,r.dataType,n.dataType,s,a),getRunData:()=>({outputs:[{dims:p,dataType:s}],dispatchGroup:{x:Math.ceil(c/64/4)},programUniforms:[{type:12,data:Math.ceil(R.size(p)/4)},...ne(o,u,p)]})}},tt=(e,t,r,n,i,a)=>{e.compute(Tl(t,i??"",e.inputs[0],e.inputs[1],r,n,a))},_f=e=>{tt(e,"Add",(t,r)=>`${t}+${r}`)},bf=e=>{tt(e,"Div",(t,r)=>`${t}/${r}`)},wf=e=>{tt(e,"Equal",{scalar:(t,r)=>`u32(${t}==${r})`,vector:(t,r)=>`vec4<u32>(${t}==${r})`},void 0,void 0,9)},$f=e=>{tt(e,"Mul",(t,r)=>`${t}*${r}`)},vf=e=>{let t=P("input",e.inputs[0].dataType,e.inputs[0].dims).type.value;tt(e,"Pow",{scalar:(r,n)=>`pow_custom(${r},${n})`,vector:(r,n)=>`pow_vector_custom(${r},${n})`},`
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
      `)},xf=e=>{tt(e,"Sub",(t,r)=>`${t}-${r}`)},Sf=e=>{tt(e,"Greater",{scalar:(t,r)=>`u32(${t}>${r})`,vector:(t,r)=>`vec4<u32>(${t}>${r})`},void 0,void 0,9)},kf=e=>{tt(e,"Less",{scalar:(t,r)=>`u32(${t}<${r})`,vector:(t,r)=>`vec4<u32>(${t}<${r})`},void 0,void 0,9)},Tf=e=>{tt(e,"GreaterOrEqual",{scalar:(t,r)=>`u32(${t}>=${r})`,vector:(t,r)=>`vec4<u32>(${t}>=${r})`},void 0,void 0,9)},If=e=>{tt(e,"LessOrEqual",{scalar:(t,r)=>`u32(${t}<=${r})`,vector:(t,r)=>`vec4<u32>(${t}<=${r})`},void 0,void 0,9)}}),Il,El,Cl,zl,Ef,Cf,J_=V(()=>{ie(),ae(),Ae(),se(),Il=(e,t)=>{if(!e||e.length<1)throw new Error("too few inputs");let r=0,n=e[r],i=n.dataType,a=n.dims.length;e.forEach((s,o)=>{if(o!==r){if(s.dataType!==i)throw new Error("input tensors should be one type");if(s.dims.length!==a)throw new Error("input tensors should have the same shape");s.dims.forEach((u,d)=>{if(d!==t&&u!==n.dims[d])throw new Error("non concat dimensions must match")})}})},El=(e,t)=>`
  fn calculateInputIndex(index: u32) -> u32 {
    let sizeInConcatAxis = array<u32, ${e}u>(${t});
    for (var i: u32 = 0u; i < ${e}; i += 1u ) {
      if (index < sizeInConcatAxis[i]) {
        return i;
      }
    }
    return ${e}u;
  }`,Cl=(e,t)=>{let r=e.length,n=[];for(let i=0;i<r;++i){let a=t.setByOffset("global_idx",e[i].getByIndices("indices"));r===1?n.push(a):i===0?n.push(`if (inputIndex == ${i}u) { ${a} }`):i===r-1?n.push(`else { ${a} }`):n.push(`else if (inputIndex == ${i}) { ${a} }`)}return n.join(`
`)},zl=(e,t,r,n)=>{let i=R.size(r),a=new Array(e.length),s=new Array(e.length),o=0,u=[],d=[],p=[{type:12,data:i}];for(let _=0;_<e.length;++_)o+=e[_].dims[t],a[_]=o,d.push(e[_].dims.length),s[_]=P(`input${_}`,n,d[_]),u.push("rank"),p.push({type:12,data:a[_]});for(let _=0;_<e.length;++_)p.push(...ne(e[_].dims));p.push(...ne(r));let c=te("output",n,r.length),f=c.indicesGet("indices",t),g=Array.from(Array(a.length).keys()).map(_=>`uniforms.sizeInConcatAxis${_}`).join(","),m=_=>`

  ${(()=>{_.registerUniform("outputSize","u32");for(let v=0;v<e.length;v++)_.registerUniform(`sizeInConcatAxis${v}`,"u32");return _.declareVariables(...s,c)})()}

  ${El(a.length,g)}

  ${_.mainStart()}
    ${_.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}

    var indices = ${c.offsetToIndices("global_idx")};

    let inputIndex = calculateInputIndex(${f});
    if (inputIndex != 0u) {
      let sizeInConcatAxis = array<u32, ${a.length}u>(${g});
      ${f} -= sizeInConcatAxis[inputIndex - 1u];
    }

    ${Cl(s,c)}
  }`;return{name:"Concat",shaderCache:{hint:`${t}`,inputDependencies:u},getRunData:()=>({outputs:[{dims:r,dataType:n}],dispatchGroup:{x:Math.ceil(i/64)},programUniforms:p}),getShaderSource:m}},Ef=(e,t)=>{let r=e.inputs,n=r[0].dims,i=R.normalizeAxis(t.axis,n.length);Il(r,i);let a=n.slice();a[i]=r.reduce((o,u)=>o+(u.dims.length>i?u.dims[i]:0),0);let s=r.filter(o=>R.size(o.dims)>0);e.compute(zl(s,i,a,r[0].dataType),{inputs:s})},Cf=e=>_e({axis:e.axis})}),jt,Kt,Xt,Va,Yt=V(()=>{ie(),ae(),jt=(e,t,r="f32")=>{switch(e.activation){case"Relu":return`value = max(value, ${t}(0.0));`;case"Sigmoid":return`value = (${t}(1.0) / (${t}(1.0) + exp(-value)));`;case"Clip":return`value = clamp(value, ${t}(${r}(uniforms.clip_min)), ${t}(${r}(uniforms.clip_max)));`;case"HardSigmoid":return`value = max(${t}(0.0), min(${t}(1.0), ${r}(uniforms.alpha) * value + ${r}(uniforms.beta)));`;case"LeakyRelu":return`value = select(${r}(uniforms.alpha) * value, value, value >= ${t}(0.0));`;case"Tanh":return`let e2x = exp(-2.0 * abs(value));
              value = sign(value) * (1.0 - e2x) / (1.0 + e2x);
        `;case"":return"";default:throw new Error(`Unsupported activation ${e.activation}`)}},Kt=(e,t)=>{e.activation==="Clip"?t.push({type:1,data:e.clipMax},{type:1,data:e.clipMin}):e.activation==="HardSigmoid"?t.push({type:1,data:e.alpha},{type:1,data:e.beta}):e.activation==="LeakyRelu"&&t.push({type:1,data:e.alpha})},Xt=(e,t)=>{e.activation==="Clip"?t.push({name:"clip_max",type:"f32"},{name:"clip_min",type:"f32"}):e.activation==="HardSigmoid"?t.push({name:"alpha",type:"f32"},{name:"beta",type:"f32"}):e.activation==="LeakyRelu"&&t.push({name:"alpha",type:"f32"})},Va=e=>{let t=e?.activation||"";if(t==="HardSigmoid"){let[r,n]=e?.activation_params||[.2,.5];return{activation:t,alpha:r,beta:n}}else if(t==="Clip"){let[r,n]=e?.activation_params||[eh,th];return{activation:t,clipMax:n,clipMin:r}}else if(t==="LeakyRelu"){let[r]=e?.activation_params||[.01];return{activation:t,alpha:r}}return{activation:t}}}),Be,zf,Ha=V(()=>{Be=(e,t)=>{switch(e){case 1:return t;case 2:return`vec2<${t}>`;case 3:return`vec3<${t}>`;case 4:return`vec4<${t}>`;default:throw new Error(`${e}-component is not supported.`)}},zf=e=>`
      ${e?"value = value + getBiasByOutputCoords(coords);":""}
      `}),Af,eb=V(()=>{Af=e=>`
fn getIndexFromCoords4D(coords : vec4<i32>, shape : vec4<i32>) -> i32 {
  return dot(coords, vec4<i32>(
      shape.y * shape.z * shape.w, shape.z * shape.w, shape.w, 1));
}
fn getOutputIndexFromCoords(coords : vec4<i32>) -> i32 {
  return dot(coords, vec4<i32>(
    i32(${e}.x), i32(${e}.y), i32(${e}.z), 1));
}
`}),Cr,ja,Ka=V(()=>{ie(),ae(),se(),Yt(),Cr=(e,t,r,n,i)=>{let a=n-r;return`
      ${Array.from({length:r}).map((s,o)=>`
      if (${re(t.shape,o,t.rank)} != 1) {
        ${t.indicesSet(e,o,re(i,o+a,n))}
      } else {
        ${t.indicesSet(e,o,0)}
      }`).join("")}
`},ja=(e,t,r,n,i=!1,a)=>{let s=e[0].dims,o=e[1].dims,u=s[s.length-2],d=o[o.length-1],p=s[s.length-1],c=Ce(d),f=Ce(p),g=Ce(u),m=R.size(r)/c/g,_=e.length>2,v=n?n.slice(0,-2):r.slice(0,-2),w=[R.size(v),u,d],$=[{type:12,data:m},{type:12,data:u},{type:12,data:d},{type:12,data:p}];Kt(t,$),$.push(...ne(v,s,o)),_&&$.push(...ne(e[2].dims)),$.push(...ne(w));let S=x=>{let I=qa("batch_dims",e[0].dataType,v.length),E=P("a",e[0].dataType,s.length,f),z=P("b",e[1].dataType,o.length,c),k=te("output",e[0].dataType,w.length,c),N=Re(k.type.tensor),O=jt(t,k.type.value,N),F=[E,z],q="";if(_){let B=i?c:1;F.push(P("bias",e[2].dataType,e[2].dims.length,B)),q=`${i?`value += bias[col / ${B}];`:`value += ${k.type.value}(bias[row + i]);`}`}let H=[{name:"output_size",type:"u32"},{name:"M",type:"u32"},{name:"N",type:"u32"},{name:"K",type:"u32"}];Xt(t,H);let M=()=>{let B=`var a_data: ${E.type.value};`;for(let G=0;G<f;G++)B+=`
              let b_data${G} = b[(b_offset + (k + ${G}) * uniforms.N + col) / ${c}];`;for(let G=0;G<g;G++){B+=`a_data = a[(a_offset + (row + ${G}) * uniforms.K + k) / ${f}];`;for(let J=0;J<f;J++)B+=`
            values[${G}] = fma(${z.type.value}(a_data${f===1?"":`[${J}]`}), b_data${J}, values[${G}]);
`}return B};return`
  ${x.registerUniforms(H).registerInternalVariables(I).declareVariables(...F,k)}
  ${x.mainStart()}
    ${x.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
    let col = (global_idx % (uniforms.N / ${c})) * ${c};
    var index1 = global_idx / (uniforms.N / ${c});
    let stride1 = uniforms.M / ${g};
    let row = (index1 % stride1) * ${g};
    let batch = index1 / stride1;

    ${r.length===2?"":`let batch_indices = ${I.offsetToIndices("batch")};`}

    var a_indices: ${E.type.indices};
    ${Cr("a_indices",E,E.rank-2,I.rank,"batch_indices")}
    ${E.indicesSet("a_indices",E.rank-2,0)}
    ${E.indicesSet("a_indices",E.rank-1,0)}
    let a_offset = ${E.indicesToOffset("a_indices")};

    var b_indices: ${z.type.indices};
    ${Cr("b_indices",z,z.rank-2,I.rank,"batch_indices")}
    ${z.indicesSet("b_indices",z.rank-2,0)}
    ${z.indicesSet("b_indices",z.rank-1,0)}
    let b_offset = ${z.indicesToOffset("b_indices")};
    var values: array<${k.type.value}, ${g}>;
    for (var k: u32 = 0u; k < uniforms.K; k = k + ${f}) {
      ${M()}
    }
    for (var i = 0u; i < ${g}u; i++) {
      var value = values[i];
      ${q}
      ${O}
      let cur_indices = ${k.type.indices}(batch, row + i, col);
      let offset = ${k.indicesToOffset("cur_indices")};
      ${k.setByOffset(`offset / ${c}`,"value")};
    }
  }
  `};return{name:"MatMulNaive",shaderCache:{hint:`${t.activation};${c};${f};${g};${i}`,inputDependencies:_?["rank","rank","rank"]:["rank","rank"]},getRunData:()=>({outputs:[{dims:a?a(r):r,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(m/64)},programUniforms:$}),getShaderSource:S}}}),Al,Ml,ga,xi,Ol,ya,Rl,wn,Xa=V(()=>{ie(),ae(),se(),Yt(),Ka(),Ha(),Al=(e,t)=>e?`
        mm_Asub[inputRow][inputCol] = mm_readA(batch,
          kStart + inputRow,
          globalRowStart / innerElementSize + inputCol${t?", batchIndices":""});
        `:`
        mm_Asub[inputRow][inputCol] = mm_readA(batch,
          globalRow + innerRow,
          kStart / innerElementSize + inputCol${t?", batchIndices":""});
        `,Ml=(e,t)=>e?`
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
        }`,ga=(e,t,r="f32",n,i=!1,a=32,s=!1,o=32)=>{let u=t[1]*e[1],d=t[0]*e[0],p=i?u:a,c=i?a:u,f=p/t[0],g=a/t[1];if(!((i&&f===4&&e[1]===4||!i&&(f===3||f===4))&&p%t[0]===0&&a%t[1]===0&&e[0]===4))throw new Error(`If transposeA ${i} is true, innerElementSize ${f} and workPerThread[1] ${e[1]} must be 4.
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
  ${n?`let batchIndices = ${n.offsetToIndices("u32(batch)")};`:""}
  let globalRowStart = i32(workgroupId.y) * ${u};

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
          ${Al(i,n)}
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

          ${Ml(i,f)}
      }

      workgroupBarrier();
  }

  for (var innerRow = 0; innerRow < rowPerThread; innerRow = innerRow + 1) {
      mm_write(batch, globalRow + innerRow, globalCol, acc[innerRow]);
  }
}`},xi=(e,t)=>e?`
            mm_Asub[inputRow][inputCol] = mm_readA(batch,
              kStart + inputRow,
              globalRowStart + inputCol${t?", batchIndices":""});
            `:`
            mm_Asub[inputRow][inputCol] = mm_readA(batch,
              globalRowStart + inputRow,
              kStart + inputCol${t?", batchIndices":""});
            `,Ol=e=>e?"let ACached = mm_Asub[k][tileRow + innerRow];":"let ACached = mm_Asub[tileRow + innerRow][k];",ya=(e,t,r="f32",n,i=!1,a=32,s=!1,o=32,u=!1)=>{let d=e[1]*t[1],p=e[0]*t[0],c=i?d:a,f=i?a:d;if(!(f%t[1]===0&&c%t[0]===0&&a%t[1]===0))throw new Error(`tileAHight ${f} must be divisible by workgroupSize[1]${t[1]}, tileAWidth ${c} must be divisible by workgroupSize[0]${t[0]}, tileInner ${a} must be divisible by workgroupSize[1]${t[1]}`);let g=f/t[1],m=c/t[0],_=a/t[1],v=u?`
    let localRow = i32(localId.y);
    let localCol = i32(localId.x);
    let globalRowStart = i32(workgroupId.y) * ${d};
    let globalColStart = i32(workgroupId.x) * ${p};

    // Loop over shared dimension.
    for (var t = 0; t < num_tiles; t = t + 1) {
      // Load one tile of A into local memory.
      for (var inputRow = localRow; inputRow < ${f}; inputRow = inputRow + ${t[1]}) {
        for (var inputCol = localCol; inputCol < ${c}; inputCol = inputCol + ${t[0]}) {
          ${xi(i,n)}
        }
      }
      // Load one tile of B into local memory.
      for (var inputRow = localRow; inputRow < ${a}; inputRow = inputRow + ${t[1]}) {
            for (var inputCol = localCol; inputCol < ${p}; inputCol = inputCol + ${t[0]}) {
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
let tileRowB = i32(localId.y) * ${_};
// Loop over shared dimension.
for (var t = 0; t < num_tiles; t = t + 1) {
  // Load one tile of A into local memory.
  for (var innerRow = 0; innerRow < ${g}; innerRow = innerRow + 1) {
    for (var innerCol = 0; innerCol < ${m}; innerCol = innerCol + 1) {
      let inputRow = tileRowA + innerRow;
      let inputCol = tileColA + innerCol;
      ${xi(i,n)}
    }
  }

  // Load one tile of B into local memory.
  for (var innerRow = 0; innerRow < ${_}; innerRow = innerRow + 1) {
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
      ${Ol(i)}
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
    ${n?`let batchIndices = ${n.offsetToIndices("u32(batch)")};`:""}
    let num_tiles = ${s?`${Math.ceil(o/a)}`:"(uniforms.dim_inner - 1) / tileInner + 1"};
    var kStart = ${s?`i32(globalId.z) * ${o}`:"0"};

    var acc : array<array<${r}, colPerThread>, rowPerThread>;
    ${v}
  }
`},Rl=(e,t,r,n,i=!1)=>{let[a,s,o,u]=n,d=Re(n[0].type.tensor);return`
    fn mm_readA(batch: i32, row: i32, colIn: i32, batchIndices: ${a.type.indices}) -> ${Be(e,d)} {
      var value = ${Be(e,d)}(0.0);
      let col = colIn * ${e};
      if(row < uniforms.dim_a_outer && col < uniforms.dim_inner)
      {
        var aIndices: ${s.type.indices};
        ${Cr("aIndices",s,s.rank-2,a.rank,"batchIndices")}
        ${s.indicesSet("aIndices",s.rank-2,"u32(row)")}
        ${s.indicesSet("aIndices",s.rank-1,"u32(colIn)")}
        value = ${s.getByIndices("aIndices")};
      }
      return value;
    }

    fn mm_readB(batch: i32, row: i32, colIn: i32, batchIndices: ${a.type.indices}) -> ${Be(e,d)} {
      var value = ${Be(e,d)}(0.0);
      let col = colIn * ${e};
      if(row < uniforms.dim_inner && col < uniforms.dim_b_outer)
      {
        var bIndices: ${o.type.indices};
        ${Cr("bIndices",o,o.rank-2,a.rank,"batchIndices")}
        ${o.indicesSet("bIndices",o.rank-2,"u32(row)")}
        ${o.indicesSet("bIndices",o.rank-1,"u32(colIn)")}
        value = ${o.getByIndices("bIndices")};
      }
      return value;
    }

    fn mm_write(batch: i32, row: i32, colIn: i32, valueIn: ${Be(e,d)}) {
      let col = colIn * ${e};
      if (row < uniforms.dim_a_outer && col < uniforms.dim_b_outer) {
        var value = valueIn;
        let coords = vec3<i32>(batch, row, colIn);
        ${t?`value = value + ${i?"bias[colIn]":`${Be(e,d)}(bias[row])`};`:""}
        ${r}
        ${u.setByIndices("vec3<u32>(coords)","value")}
      }
    }
    `},wn=(e,t,r,n,i=!1,a)=>{let s=e[0].dims,o=e[1].dims,u=s.slice(0,-2),d=o.slice(0,-2),p=n?n.slice(0,-2):r.slice(0,-2),c=R.size(p),f=s[s.length-2],g=s[s.length-1],m=o[o.length-1],_=g%4===0&&m%4===0,v=f<=8?[4,1,1]:[4,4,1],w=[8,8,1],$=[Math.ceil(m/w[0]/v[0]),Math.ceil(f/w[1]/v[1]),Math.ceil(c/w[2]/v[2])],S=_?4:1,x=[...u,f,g/S],I=x.length,E=[...d,g,m/S],z=E.length,k=[c,f,m/S],N=[{type:6,data:f},{type:6,data:m},{type:6,data:g}];Kt(t,N),N.push(...ne(p,x,E));let O=["rank","rank"],F=e.length>2;F&&(N.push(...ne(e[2].dims)),O.push("rank")),N.push(...ne(k));let q=H=>{let M=p.length,B=qa("batchDims",e[0].dataType,M,1),G=Re(e[0].dataType),J=P("a",e[0].dataType,I,S),Y=P("b",e[1].dataType,z,S),L=te("result",e[0].dataType,k.length,S),X=[J,Y];if(F){let xe=i?S:1;X.push(P("bias",e[2].dataType,e[2].dims.length,xe))}let U=[{name:"dim_a_outer",type:"i32"},{name:"dim_b_outer",type:"i32"},{name:"dim_inner",type:"i32"}];Xt(t,U);let ee=Re(L.type.tensor),Z=jt(t,L.type.value,ee),K=Rl(S,F,Z,[B,J,Y,L],i);return`
  ${H.registerUniforms(U).registerInternalVariables(B).declareVariables(...X,L)}
  ${K}
  ${_?ga(v,w,G,B):ya(v,w,G,B)}
                   `};return{name:"MatMul",shaderCache:{hint:`${v};${t.activation};${_};${i}`,inputDependencies:O},getRunData:()=>({outputs:[{dims:a?a(r):r,dataType:e[0].dataType}],dispatchGroup:{x:$[0],y:$[1],z:$[2]},programUniforms:N}),getShaderSource:q}}}),Nl,Mf,tb=V(()=>{ie(),yt(),se(),Yt(),Ha(),eb(),Xa(),Nl=(e,t,r,n,i=!1,a,s=4,o=4,u=4,d="f32")=>{let p=N=>{switch(N){case 1:return"resData = x[xIndex];";case 3:return`resData = vec3<${d}>(x[xIndex], x[xIndex + 1], x[xIndex + 2]);`;case 4:return"resData = x[xIndex / 4];";default:throw new Error(`innerElementSize ${N} is not supported.`)}},c=N=>{switch(N){case 1:return"return w[row * i32(uniforms.w_shape[3]) + colIn];";case 4:return"return w[row * i32(uniforms.w_shape[3]) / 4 + colIn];";default:throw new Error(`innerElementSize ${N} is not supported.`)}},f=e?`
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
    `,m=e?"i32(uniforms.x_shape[1])":"i32(uniforms.x_shape[2])",_=e?"i32(uniforms.x_shape[2])":"i32(uniforms.x_shape[3])",v=e?"row":"col",w=e?"col":"row",$=`
    let inChannels = i32(uniforms.w_shape[2]);
    let outWidth = ${e?"i32(uniforms.result_shape[2])":"i32(uniforms.result_shape[3])"};
    let outRow = ${v} / outWidth;
    let outCol = ${v} % outWidth;

    let WRow = ${w} / (i32(uniforms.w_shape[1]) * inChannels);
    let WCol = ${w} / inChannels % i32(uniforms.w_shape[1]);
    let xRow = outRow * uniforms.stride[0] + uniforms.dilation[0] * WRow - uniforms.pad[0];
    let xCol = outCol * uniforms.stride[1] + uniforms.dilation[1] * WCol - uniforms.pad[1];
    let xCh = ${w} % inChannels;
    var resData = ${Be(s,d)}(0.0);
    // The bounds checking is always needed since we use it to pad zero for
    // the 'same' padding type.
    if (xRow >= 0 && xRow < ${m} && xCol >= 0 && xCol < ${_}) {
      ${f}
      let xIndex = getIndexFromCoords4D(coord, vec4<i32>(uniforms.x_shape));
      ${p(s)}
    }
    return resData;`,S=e?t&&n?`
    let col = colIn * ${s};
    ${$}`:`
    let col = colIn * ${s};
    if (row < uniforms.dim_a_outer && col < uniforms.dim_inner) {
      ${$}
    }
    return ${Be(s,d)}(0.0);`:n&&r?`
    let col = colIn * ${s};
    ${$}`:`
    let col = colIn * ${s};
    if (row < uniforms.dim_inner && col < uniforms.dim_b_outer) {
      ${$}
    }
    return ${Be(s,d)}(0.0);`,x=e?n&&r?c(o):`
    let col = colIn * ${o};
    if (row < uniforms.dim_inner && col < uniforms.dim_b_outer) {
      ${c(o)}
    }
    return ${Be(o,d)}(0.0);`:`
    let col = colIn * ${o};
    if (row < uniforms.dim_inner && col < uniforms.dim_a_outer) {
      ${c(o)}
    }
    return ${Be(o,d)}(0.0);`,I=Be(u,d),E=Be(e?s:o,d),z=Be(e?o:s,d),k=jt(a,I,d);return`
    fn mm_readA(batch: i32, row : i32, colIn : i32) -> ${E} {
      ${e?S:x}
    }

    fn mm_readB(batch: i32, row : i32, colIn : i32) -> ${z} {
      ${e?x:S}
    }

    fn mm_write(batch: i32, row : i32, colIn : i32, valueIn : ${I}) {
      let col = colIn * ${u};
      if (row < uniforms.dim_a_outer && col < uniforms.dim_b_outer)
      {
      var value = valueIn;
      let outWidth = ${e?"i32(uniforms.result_shape[2])":"i32(uniforms.result_shape[3])"};
      ${g}
      ${zf(i)}
      ${k}
      setOutputAtCoords(coords[0], coords[1], coords[2], coords[3], value);
      }
    }`},Mf=(e,t,r,n,i,a,s,o,u)=>{let d=t.format==="NHWC",p=d?e[0].dims[3]:e[0].dims[1],c=r[0],f=d?r[2]:r[3],g=d?r[1]:r[2],m=d?r[3]:r[1],_=d&&(p%4===0||p%3===0)&&m%4===0,v=d?m:f*g,w=d?f*g:m,$=[8,8,1],S=n<=8?[4,1,1]:[4,4,1],x=[Math.ceil(v/$[0]/S[0]),Math.ceil(w/$[1]/S[1]),Math.ceil(c/$[2]/S[2])];fe("verbose",()=>`[conv2d_mm_webgpu] dispatch = ${x}`);let I=_?d&&p%4!==0?3:4:1,E=$[1]*S[1],z=$[0]*S[0],k=Math.max($[0]*I,$[1]),N=n%E===0,O=i%z===0,F=a%k===0,q=_?[I,4,4]:[1,1,1],H=[{type:6,data:n},{type:6,data:i},{type:6,data:a},{type:6,data:[t.pads[0],t.pads[1]]},{type:6,data:t.strides},{type:6,data:t.dilations}];Kt(t,H),H.push(...ne(e[0].dims,e[1].dims));let M=["rank","rank"];s&&(H.push(...ne(e[2].dims)),M.push("rank")),H.push(...ne(r));let B=G=>{let J=[{name:"dim_a_outer",type:"i32"},{name:"dim_b_outer",type:"i32"},{name:"dim_inner",type:"i32"},{name:"pad",type:"i32",length:2},{name:"stride",type:"i32",length:2},{name:"dilation",type:"i32",length:2}];Xt(t,J);let Y=_?4:1,L=Re(e[0].dataType),X=`
      fn setOutputAtIndex(flatIndex : i32, value : ${_?`vec4<${L}>`:L}) {
        result[flatIndex] = ${_?`vec4<${L}>`:L}(value);
      }
      fn setOutputAtCoords(d0 : i32, d1 : i32, d2 : i32, d3 : i32, value : ${_?`vec4<${L}>`:L}) {
        let flatIndex = getOutputIndexFromCoords(vec4<i32>(d0, d1, d2, d3));
        setOutputAtIndex(flatIndex ${_?"/ 4":""}, value);
      }`,U=P("x",e[0].dataType,e[0].dims.length,I===3?1:I),ee=P("w",e[1].dataType,e[1].dims.length,Y),Z=[U,ee],K=te("result",e[0].dataType,r.length,Y);if(s){let xe=P("bias",e[2].dataType,e[2].dims.length,Y);Z.push(xe),X+=`
        fn getBiasByOutputCoords(coords : vec4<i32>) -> ${_?`vec4<${L}>`:L} {
          return bias[coords.${d?"w":"y"}${_?"/ 4":""}];
        }`}return`
        ${Af("uniforms.result_strides")}
        //struct Uniforms { xShape : vec4<i32>, wShape : vec4<i32>, outShape : vec4<i32>,
        //  outShapeStrides: vec3<i32>, filterDims : vec2<i32>, pad : vec2<i32>, stride : vec2<i32>,
        //  dilation : vec2<i32>, dimAOuter : i32, dimBOuter : i32, dimInner : i32 };
        ${G.registerUniforms(J).declareVariables(...Z,K)}
        ${X}
        ${Nl(d,N,O,F,s,t,q[0],q[1],q[2],L)}
        ${_?ga(S,$,L,void 0,!d,k):ya(S,$,L,void 0,!d,k,!1,void 0,o)}`};return{name:"Conv2DMatMul",shaderCache:{hint:`${t.cacheKey};${I};${_};${N};${O};${F};${E};${z};${k}`,inputDependencies:M},getRunData:()=>({outputs:[{dims:u?u(r):r,dataType:e[0].dataType}],dispatchGroup:{x:x[0],y:x[1],z:x[2]},programUniforms:H}),getShaderSource:B}}}),Bl,Si,yr,Dl,ki,Pl,Of,Rf,rb=V(()=>{ie(),yt(),ae(),se(),Yt(),Ha(),Bl=e=>{let t=1;for(let r=0;r<e.length;r++)t*=e[r];return t},Si=e=>typeof e=="number"?[e,e,e]:e,yr=(e,t)=>t<=1?e:e+(e-1)*(t-1),Dl=(e,t,r,n=1)=>{let i=yr(t,n);return Math.floor((e[0]*(r-1)-r+i)/2)},ki=(e,t,r,n,i)=>{i==null&&(i=Dl(e,t[0],n[0]));let a=[0,0,0,r];for(let s=0;s<3;s++)e[s]+2*i>=t[s]&&(a[s]=Math.trunc((e[s]-t[s]+2*i)/n[s]+1));return a},Pl=(e,t,r,n,i,a,s,o,u,d)=>{let p,c,f,g;if(e==="VALID"&&(e=0),typeof e=="number"){p={top:e,bottom:e,left:e,right:e,front:e,back:e};let m=ki([t,r,n,1],[o,u,d],1,[i,a,s],e);c=m[0],f=m[1],g=m[2]}else if(Array.isArray(e)){if(!e.every((_,v,w)=>_===w[0]))throw Error(`Unsupported padding parameter: ${e}`);p={top:e[0],bottom:e[1],left:e[2],right:e[3],front:e[4],back:e[5]};let m=ki([t,r,n,1],[o,u,d],1,[i,a,s],e[0]);c=m[0],f=m[1],g=m[2]}else if(e==="SAME_UPPER"){c=Math.ceil(t/i),f=Math.ceil(r/a),g=Math.ceil(n/s);let m=(c-1)*i+o-t,_=(f-1)*a+u-r,v=(g-1)*s+d-n,w=Math.floor(m/2),$=m-w,S=Math.floor(_/2),x=_-S,I=Math.floor(v/2),E=v-I;p={top:S,bottom:x,left:I,right:E,front:w,back:$}}else throw Error(`Unknown padding parameter: ${e}`);return{padInfo:p,outDepth:c,outHeight:f,outWidth:g}},Of=(e,t,r,n,i,a=!1,s="channelsLast")=>{let o,u,d,p,c;if(s==="channelsLast")[o,u,d,p,c]=e;else if(s==="channelsFirst")[o,c,u,d,p]=e;else throw new Error(`Unknown dataFormat ${s}`);let[f,,g,m,_]=t,[v,w,$]=Si(r),[S,x,I]=Si(n),E=yr(g,S),z=yr(m,x),k=yr(_,I),{padInfo:N,outDepth:O,outHeight:F,outWidth:q}=Pl(i,u,d,p,v,w,$,E,z,k),H=a?f*c:f,M=[0,0,0,0,0];return s==="channelsFirst"?M=[o,H,O,F,q]:s==="channelsLast"&&(M=[o,O,F,q,H]),{batchSize:o,dataFormat:s,inDepth:u,inHeight:d,inWidth:p,inChannels:c,outDepth:O,outHeight:F,outWidth:q,outChannels:H,padInfo:N,strideDepth:v,strideHeight:w,strideWidth:$,filterDepth:g,filterHeight:m,filterWidth:_,effectiveFilterDepth:E,effectiveFilterHeight:z,effectiveFilterWidth:k,dilationDepth:S,dilationHeight:x,dilationWidth:I,inShape:e,outShape:M,filterShape:t}},Rf=(e,t,r,n,i,a)=>{let s=a==="channelsLast";s?e[0].dims[3]:e[0].dims[1];let o=[64,1,1],u={x:r.map((v,w)=>w)},d=[Math.ceil(Bl(u.x.map(v=>r[v]))/o[0]),1,1];fe("verbose",()=>`[conv3d_naive_webgpu] dispatch = ${d}`);let p=1,c=R.size(r),f=[{type:12,data:c},{type:12,data:n},{type:12,data:i},{type:12,data:t.strides},{type:12,data:t.dilations}];Kt(t,f),f.push(...ne(e[0].dims,e[1].dims));let g=["rank","rank"],m=e.length===3;m&&(f.push(...ne(e[2].dims)),g.push("rank")),f.push(...ne(r));let _=v=>{let w=[{name:"output_size",type:"u32"},{name:"filter_dims",type:"u32",length:n.length},{name:"pads",type:"u32",length:i.length},{name:"strides",type:"u32",length:t.strides.length},{name:"dilations",type:"u32",length:t.dilations.length}];Xt(t,w);let $=1,S=Re(e[0].dataType),x=P("x",e[0].dataType,e[0].dims.length,p),I=P("W",e[1].dataType,e[1].dims.length,$),E=[x,I],z=te("result",e[0].dataType,r.length,$),k="";if(m){let F=P("bias",e[2].dataType,e[2].dims.length,$);E.push(F),k+=`
        fn getBiasByOutputCoords(coords : array<u32, 5>) -> ${S} {
          return bias[${s?re("coords",4,5):re("coords",1,5)}];
        }`}let N=Be(p,S),O=jt(t,N,S);return`
            ${k}
            fn getX(d0 : u32, d1 : u32, d2 : u32, d3 : u32, d4 : u32) -> f32 {
              let aIndices = array<u32, 5>(d0, d1, d2, d3, d4);
              return ${x.getByIndices("aIndices")};
            }
            fn getW(d0 : u32, d1 : u32, d2 : u32, d3 : u32, d4 : u32) -> f32 {
              let aIndices = array<u32, 5>(d0, d1, d2, d3, d4);
              return ${I.getByIndices("aIndices")};
            }
          ${v.registerUniforms(w).declareVariables(...E,z)}
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
              ${O}
              result[global_idx] = f32(value);
          }`};return{name:"Conv3DNaive",shaderCache:{hint:`${t.cacheKey};${s};${p};${m}`,inputDependencies:g},getRunData:()=>({outputs:[{dims:r,dataType:e[0].dataType}],dispatchGroup:{x:d[0],y:d[1],z:d[2]},programUniforms:f}),getShaderSource:_}}}),Nf,Bf,nb=V(()=>{ie(),ae(),se(),Yt(),Nf=(e,t,r,n)=>{let i=e.length>2,a=i?"value += b[output_channel];":"",s=e[0].dims,o=e[1].dims,u=t.format==="NHWC",d=u?r[3]:r[1],p=d/t.group,c=u&&p>=4?Ce(d):1,f=R.size(r)/c,g=[{type:12,data:f},{type:12,data:t.dilations},{type:12,data:[t.strides[0],t.strides[1]]},{type:12,data:[t.pads[0],t.pads[1]]},{type:12,data:p}];Kt(t,g),g.push(...ne(s,[o[0],o[1],o[2],o[3]/c]));let m=i?["rank","rank","rank"]:["rank","rank"];g.push(...ne([r[0],r[1],r[2],r[3]/c]));let _=v=>{let w=te("output",e[0].dataType,r.length,c),$=Re(w.type.tensor),S=jt(t,w.type.value,$),x=P("x",e[0].dataType,s.length),I=P("w",e[1].dataType,o.length,c),E=[x,I];i&&E.push(P("b",e[2].dataType,e[2].dims,c));let z=[{name:"output_size",type:"u32"},{name:"dilations",type:"u32",length:t.dilations.length},{name:"strides",type:"u32",length:2},{name:"pads",type:"u32",length:2},{name:"output_channels_per_group",type:"u32"}];Xt(t,z);let k=u?`
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
  ${v.registerUniforms(z).declareVariables(...E,w)}

  ${v.mainStart()}
    ${v.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}

    let outputIndices = ${w.offsetToIndices("global_idx")};
    let batch: u32 = outputIndices[0];
    let output_channel: u32 = outputIndices[${u?3:1}];
    let xRCCorner: vec2<u32> = vec2<u32>(outputIndices[${u?1:2}], outputIndices[${u?2:3}]) * uniforms.strides - uniforms.pads;
    let group_id: u32 = output_channel * ${c} / uniforms.output_channels_per_group;
    var in_channel_offset = group_id * uniforms.w_shape[${u?2:1}];

    var value: ${w.type.value} = ${w.type.value}(0);
    ${k}
    ${a}
    ${S}
    ${w.setByOffset("global_idx","value")}
  }`};return{name:"GroupedConv",shaderCache:{hint:`${t.cacheKey}_${c}`,inputDependencies:m},getRunData:()=>({outputs:[{dims:n?n(r):r,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(f/64)},programUniforms:g}),getShaderSource:_}},Bf=(e,t,r,n)=>{let i=e.length>2,a=Ce(r[3]),s=Ce(r[2]),o=R.size(r)/a/s,u=[e[0].dims[0],e[0].dims[1],e[0].dims[2],e[0].dims[3]/a],d=[e[1].dims[0],e[1].dims[1],e[1].dims[2],e[1].dims[3]/a],p=[r[0],r[1],r[2],r[3]/a],c=[{type:12,data:o},{type:6,data:[t.strides[0],t.strides[1]]},{type:6,data:[t.pads[0],t.pads[1]]}];Kt(t,c),c.push(...ne(u,d,p));let f=(s-1)*t.strides[1]+d[1],g=m=>{let _=te("output",e[0].dataType,p.length,a),v=Re(_.type.tensor),w=jt(t,_.type.value,v),$=P("x",e[0].dataType,u.length,a),S=P("w",e[1].dataType,d.length,a),x=[$,S];i&&x.push(P("b",e[2].dataType,e[2].dims,a));let I=i?"value += b[output_channel];":"",E=[{name:"output_size",type:"u32"},{name:"strides",type:"i32",length:2},{name:"pads",type:"i32",length:2}];return Xt(t,E),`
  ${m.registerUniforms(E).declareVariables(...x,_)}
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

    var x_vals: array<${$.type.value}, ${f}>;
    var values: array<${_.type.value}, ${s}>;
    let input_channel = output_channel;
    // Use constant instead of uniform can give better performance for w's height/width.
    for (var w_height: u32 = 0u; w_height < ${d[0]}; w_height++) {
      let x_height = x_corner.x + i32(w_height);
      if (x_height >= 0 && u32(x_height) < uniforms.x_shape[1]) {
        for (var i = 0; i < ${f}; i++) {
          let x_width = x_corner.y + i;
          if (x_width >= 0 && u32(x_width) < uniforms.x_shape[2]) {
            x_vals[i] = ${$.get("batch","u32(x_height)","u32(x_width)","input_channel")};
          } else {
            x_vals[i] = ${$.type.value}(0);
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
      ${w}
      ${_.set("batch","row","col + i","output_channel","value")};
    }
  }`};return{name:"GroupedConv-Vectorize",shaderCache:{hint:`${t.cacheKey};${a};${s};${f};${d[0]};${d[1]}`,inputDependencies:i?["rank","rank","type"]:["rank","rank"]},getRunData:()=>({outputs:[{dims:n?n(r):r,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(o/64)},programUniforms:c}),getShaderSource:g}}}),Ul,en,Ll,tn,_a,Ti,ql,Wl,ba,ib=V(()=>{ae(),tb(),rb(),Xa(),nb(),Yt(),Ka(),Ct(),Ul=(e,t,r,n,i,a)=>{let s=e[0],o=e.slice(a?1:2,a?3:4),u=o.length,d=t[0],p=t.slice(2).map((f,g)=>f+(f-1)*(r[g]-1)),c=o.map((f,g)=>f+n[g]+n[g+u]).map((f,g)=>Math.floor((f-p[g]+i[g])/i[g]));return c.splice(0,0,s),c.splice(a?3:1,0,d),c},en=[2,3,1,0],Ll=(e,t)=>{if(!e||e.length!==2&&e.length!==3)throw new Error("Conv requires 2 or 3 inputs");if(e[0].dims.length>5)throw new Error("greater than 5D is not supported");if(e[0].dims.length!==e[1].dims.length)throw new Error("filter does not have same dimension as input");let r=e[0].dims[t.format==="NHWC"?e[0].dims.length-1:1],n=e[1].dims[1]*t.group;if(r!==n)throw new Error("FILTER_IN_CHANNEL should be equal to DATA_CHANNEL");if(e.length===3&&(e[2].dims.length!==1||e[1].dims[0]!==e[2].dims[0]))throw new Error("invalid bias");let i=e[0].dims.length-2;if(t.dilations.length!==i)throw new Error(`dilations should be ${i}D`);if(t.strides.length!==i)throw new Error(`strides should be ${i}D`);if(t.pads.length!==i*2)throw new Error(`pads should be ${i*2}D`);if(t.kernelShape.length!==0&&t.kernelShape.length!==e[1].dims.length-2)throw new Error("invalid kernel shape")},tn=(e,t)=>{let r=e.kernelShape.slice();r.length<t[1].dims.length-2&&r.push(...Array(t[1].dims.length-2-r.length).fill(0));for(let a=2;a<t[1].dims.length;++a)r[a-2]===0&&(r[a-2]=t[1].dims[a]);let n=e.pads.slice();_n.adjustPadsBasedOnAutoPad(t[0].dims,e.strides,e.dilations,r,n,e.format==="NHWC",e.autoPad);let i=Object.assign({},e);return Object.assign(i,{kernelShape:r,pads:n}),i},_a=e=>{let t=Va(e),r=e.format,n=["NOTSET","VALID","SAME_UPPER","SAME_LOWER"][e.auto_pad],i=e.dilations,a=e.group,s=e.kernel_shape,o=e.pads,u=e.strides,d=e.w_is_const();return{autoPad:n,format:r,dilations:i,group:a,kernelShape:s,pads:o,strides:u,wIsConst:d,...t,cacheKey:`${e.format};${t.activation};`}},Ti=(e,t,r,n)=>{let i=r.format==="NHWC",a=Ul(t[0].dims,t[1].dims,r.dilations,r.pads,r.strides,i);if(r.group!==1){let E=[t[0]];if(i){let z=e.kernelCustomData.wT??e.compute(Ve(t[1],en),{inputs:[1],outputs:[r.wIsConst?-2:-1]})[0];r.wIsConst&&!e.kernelCustomData.wT&&(e.kernelCustomData.wT=z),E.push(z)}else E.push(t[1]);t.length===3&&E.push(t[2]),!e.adapterInfo.isArchitecture("ampere")&&i&&t[1].dims[0]===r.group&&t[1].dims[1]===1&&r.dilations[0]===1&&r.dilations[1]===1?e.compute(Bf(E,r,a,n),{inputs:E}):e.compute(Nf(E,r,a,n),{inputs:E});return}let s=t.length===3,o=t[0].dims[i?1:2],u=t[0].dims[i?2:3],d=t[0].dims[i?3:1],p=t[1].dims[2],c=t[1].dims[3],f=a[i?1:2],g=a[i?2:3],m=a[i?3:1],_=i&&p===o&&c===u&&r.pads[0]===0&&r.pads[1]===0;if(_||p===1&&c===1&&r.dilations[0]===1&&r.dilations[1]===1&&r.strides[0]===1&&r.strides[1]===1&&r.pads[0]===0&&r.pads[1]===0){let E=a[0],z,k,N,O=[];if(i){let H=e.kernelCustomData.wT??e.compute(Ve(t[1],en),{inputs:[1],outputs:[r.wIsConst?-2:-1]})[0];if(r.wIsConst&&!e.kernelCustomData.wT&&(e.kernelCustomData.wT=H),_){let M=o*u*d;z=t[0].reshape([1,E,M]),k=H.reshape([1,M,m]),N=[1,E,m]}else z=t[0].reshape([E,o*u,d]),k=H.reshape([1,d,m]),N=[E,f*g,m];O.push(z),O.push(k)}else z=t[0].reshape([E,d,o*u]),k=t[1].reshape([1,m,d]),N=[E,m,f*g],O.push(k),O.push(z);s&&O.push(t[2]);let F=N[2],q=O[0].dims[O[0].dims.length-1];F<8&&q<8?e.compute(ja(O,r,a,N,i,n),{inputs:O}):e.compute(wn(O,r,a,N,i,n),{inputs:O});return}let v=!0,w=e.kernelCustomData.wT??e.compute(Ve(t[1],en),{inputs:[1],outputs:[r.wIsConst?-2:-1]})[0];r.wIsConst&&!e.kernelCustomData.wT&&(e.kernelCustomData.wT=w);let $=[t[0],w];s&&$.push(t[2]);let S=i?f*g:m,x=i?m:f*g,I=p*c*d;e.compute(Mf($,r,a,S,x,I,s,v,n),{inputs:$})},ql=(e,t)=>{let r=t.format==="NHWC",n=[e.inputs[0].reshape(r?[e.inputs[0].dims[0],1,e.inputs[0].dims[1],e.inputs[0].dims[2]]:[e.inputs[0].dims[0],e.inputs[0].dims[1],1,e.inputs[0].dims[2]]),e.inputs[1].reshape([e.inputs[1].dims[0],e.inputs[1].dims[1],1,e.inputs[1].dims[2]])];e.inputs.length===3&&n.push(e.inputs[2]);let i=[0,t.pads[0],0,t.pads[1]],a=[1].concat(t.strides),s=[1].concat(t.dilations),o=[1].concat(t.kernelShape),u=tn({...t,pads:i,strides:a,dilations:s,kernelShape:o},n);Ti(e,n,u,d=>r?[d[0],d[2],d[3]]:[d[0],d[1],d[3]])},Wl=(e,t,r)=>{let n=r.format==="NHWC"?"channelsLast":"channelsFirst",i=tn(r,t),a=r.autoPad==="NOTSET"?r.pads:r.autoPad,s=Of(t[0].dims,t[1].dims,r.strides,r.dilations,a,!1,n);e.compute(Rf(t,i,s.outShape,[s.filterDepth,s.filterHeight,s.filterWidth],[s.padInfo.front,s.padInfo.top,s.padInfo.left],n))},ba=(e,t)=>{if(Ll(e.inputs,t),e.inputs[0].dims.length===3)ql(e,t);else if(e.inputs[0].dims.length===5)Wl(e,e.inputs,t);else{let r=tn(t,e.inputs);Ti(e,e.inputs,r)}}}),Df,ab=V(()=>{ie(),yt(),ae(),se(),Df=(e,t,r)=>{let n=e.length>2,i=t.outputShape,a=t.format==="NHWC",s=t.group,o=e[1].dims,u=o[2]/s,d=o[3],p=a?Ce(u):1,c=a&&d===1&&u>=4,f=c?Math.floor(u/4)*4:Math.floor(u/p)*p,g=u-f,m=a?Ce(d):1,_=a?d===1?p:m:1,v=R.size(i)/m,w=[Math.ceil(v/64),1,1];fe("verbose",()=>`[conv2d_backprop_webgpu] dispatch = ${w}`);let $=["rank","rank"],S=[t.strides[0],t.strides[1]],x=[t.kernelShape[a?1:2],t.kernelShape[a?2:3]],I=[t.dilations[0],t.dilations[1]],E=[x[0]+(t.dilations[0]<=1?0:(t.kernelShape[a?1:2]-1)*(t.dilations[0]-1)),x[1]+(t.dilations[1]<=1?0:(t.kernelShape[a?2:3]-1)*(t.dilations[1]-1))],z=[E[0]-1-Math.floor((t.pads[0]+t.pads[2])/2),E[1]-1-Math.floor((t.pads[1]+t.pads[3])/2)],k=[{type:12,data:v},{type:12,data:S},{type:12,data:x},{type:12,data:I},{type:12,data:E},{type:6,data:z},{type:12,data:f},{type:12,data:u},{type:12,data:d},...ne(e[0].dims,e[1].dims)];n&&(k.push(...ne(e[2].dims)),$.push("rank")),k.push(...ne(i));let N=O=>{let F=[{name:"output_size",type:"u32"},{name:"strides",type:"u32",length:S.length},{name:"filter_dims",type:"u32",length:x.length},{name:"dilations",type:"u32",length:x.length},{name:"effective_filter_dims",type:"u32",length:E.length},{name:"pads",type:"i32",length:z.length},{name:"input_channels_per_group_int",type:"u32"},{name:"input_channels_per_group",type:"u32"},{name:"output_channels_per_group",type:"u32"}],q=Re(e[0].dataType),H=a?1:2,M=a?2:3,B=a?3:1,G=P("W",e[1].dataType,e[1].dims.length,_),J=P("Dy",e[0].dataType,e[0].dims.length,p),Y=[J,G];n&&Y.push(P("bias",e[2].dataType,[i[B]].length,m));let L=te("result",e[0].dataType,i.length,m),X=()=>{let Z="";if(c)p===4?Z+=`
        let xValue = ${J.getByOffset("x_offset")};
        let wValue = ${G.getByOffset("w_offset")};
        dotProd = dotProd + dot(xValue, wValue);
        x_offset += 1u;
        w_offset += 1u;`:p===2?Z+=`
          dotProd = dotProd + dot(vec4<${q}>(${J.getByOffset("x_offset")}, ${J.getByOffset("x_offset + 1u")}), vec4<${q}>(${G.getByOffset("w_offset")}, ${G.getByOffset("w_offset + 1u")}));
          x_offset += 2u;
          w_offset += 2u;`:p===1&&(Z+=`
          dotProd = dotProd + dot(vec4<${q}>(${J.getByOffset("x_offset")}, ${J.getByOffset("x_offset + 1u")}, ${J.getByOffset("x_offset + 2u")}, ${J.getByOffset("x_offset + 3u")}), vec4<${q}>(${G.getByOffset("w_offset")}, ${G.getByOffset("w_offset + 1u")}, ${G.getByOffset("w_offset + 2u")}, ${G.getByOffset("w_offset + 3u")}));
          x_offset += 4u;
          w_offset += 4u;`);else if(Z+=`
                  let xValue = ${a?J.getByOffset(`${J.indicesToOffset(`${J.type.indices}(batch, idyR, idyC, inputChannel)`)} / ${p}`):J.get("batch","inputChannel","idyR","idyC")};
        `,p===1)Z+=`
          let w_offset = ${G.indicesToOffset(`${G.type.indices}(u32(wRPerm), u32(wCPerm), inputChannel, wOutChannel)`)};
          let wValue = ${G.getByOffset(`w_offset / ${_}`)};
          dotProd = dotProd + xValue * wValue;`;else for(let K=0;K<p;K++)Z+=`
            let wValue${K} = ${G.getByOffset(`${G.indicesToOffset(`${G.type.indices}(u32(wRPerm), u32(wCPerm), inputChannel + ${K}, wOutChannel)`)} / ${_}`)};
            dotProd = dotProd + xValue[${K}] * wValue${K};`;return Z},U=()=>{if(g===0)return"";if(!c)throw new Error(`packInputAs4 ${c} is not true.`);let Z="";if(p===1){Z+="dotProd = dotProd";for(let K=0;K<g;K++)Z+=`
            + ${J.getByOffset(`x_offset + ${K}`)} * ${G.getByOffset(`w_offset + ${K}`)}`;Z+=";"}else if(p===2){if(g!==2)throw new Error(`Invalid inputChannelsRemainder ${g}.`);Z+=`
          let xValue = ${J.getByOffset("x_offset")};
          let wValue = ${G.getByOffset("w_offset")};
          dotProd = dotProd + dot(xValue, wValue);`}return Z},ee=`
            let outputIndices = ${L.offsetToIndices(`global_idx * ${m}`)};
            let batch = ${L.indicesGet("outputIndices",0)};
            let d1 = ${L.indicesGet("outputIndices",B)};
            let r = ${L.indicesGet("outputIndices",H)};
            let c = ${L.indicesGet("outputIndices",M)};
            let dyCorner = vec2<i32>(i32(r), i32(c)) - uniforms.pads;
            let dyRCorner = dyCorner.x;
            let dyCCorner = dyCorner.y;
            let groupId = d1 / uniforms.output_channels_per_group;
            let wOutChannel = d1 - groupId * uniforms.output_channels_per_group;
            // Convolve dy(?, ?, d2) with w(:, :, d1, d2) to compute dx(xR, xC, d1).
            // ? = to be determined. : = across all values in that axis.
            var dotProd = ${L.type.value}(0.0);
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
              if (dyR < 0.0 || dyR >= ${q}(uniforms.Dy_shape[${H}]) || fract(dyR) > 0.0 ||
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
                if (dyC < 0.0 || dyC >= ${q}(uniforms.Dy_shape[${M}]) ||
                    fract(dyC) > 0.0 || wCPerm < 0) {
                  continue;
                }
                let idyC: u32 = u32(dyC);
                var inputChannel = groupId * uniforms.input_channels_per_group;
                ${c?`
                var x_offset = ${J.indicesToOffset(`${J.type.indices}(batch, idyR, idyC, inputChannel)`)} / ${p};
                var w_offset = ${G.indicesToOffset(`${G.type.indices}(wRPerm, wCPerm, inputChannel, wOutChannel)`)} / ${_};
                  `:""}
                for (var d2: u32 = 0; d2 < uniforms.input_channels_per_group_int; d2 = d2 + ${c?4:p}) {
                  ${X()}
                  inputChannel = inputChannel + ${c?4:p};
                }
                ${U()}
                wC = wC + uniforms.strides.y - 1;
              }
              wR = wR + uniforms.strides[0] - 1;
            }
            let value = dotProd${n?` + bias[d1 / ${m}]`:""};
            ${L.setByOffset("global_idx","value")};
          `;return`
    ${O.registerUniforms(F).declareVariables(...Y,L)}
      ${O.mainStart()}
      ${O.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")};
    ${ee}}`};return{name:"ConvTranspose2D",shaderCache:{hint:`${t.cacheKey};${p}${_}${m}${c}${g}`,inputDependencies:$},getRunData:()=>({dispatchGroup:{x:w[0],y:w[1],z:w[2]},outputs:[{dims:r?r(i):i,dataType:e[0].dataType}],programUniforms:k}),getShaderSource:N}}}),Fl,Gl,Vl,Ii,Pf,Hl,Ei,jl,Uf,sb=V(()=>{ab(),Yt(),Ct(),Fl=(e,t,r,n,i,a)=>(e-1)*t+r+(n-1)*i+1-a,Gl=(e,t,r,n,i)=>{let a=Math.floor(e/2);t==="SAME_UPPER"?(r[n]=a,r[i]=e-a):t==="SAME_LOWER"&&(r[n]=e-a,r[i]=a)},Vl=(e,t,r,n,i,a,s,o,u,d)=>{let p=e.length-2,c=d.length===0;u.length<p&&u.push(...Array(p-u.length).fill(0));let f=e[0],g=t[o?3:1]*i;for(let m=0,_=e.length-p-(o?1:0);m<p;++m,++_){let v=e[_],w=c?v*s[m]:d[m],$=Fl(v,s[m],a[m],t[_],r[m],w);Gl($,n,a,m,m+p),c&&d.push(s[m]*(v-1)+u[m]+(t[_]-1)*r[m]+1-a[m]-a[m+p])}d.splice(0,0,f),d.splice(o?3:1,0,g)},Ii=(e,t)=>{let r=e.kernelShape.slice();if(e.kernelShape.length===0||e.kernelShape.reduce((c,f)=>c*f,1)===0){r.length=0;for(let c=2;c<t[1].dims.length;++c)r.push(t[1].dims[c])}let n=e.format==="NHWC";r.splice(0,0,t[1].dims[0]),r.splice(n?3:1,0,t[1].dims[1]);let i=e.pads.slice(),a=e.outputShape.slice(),s=e.outputPadding.slice(),o=t[0].dims,u=e.dilations.slice();if(u.reduce((c,f)=>c+f,0)===0){let c=t[0].dims.length-2;u=new Array(c).fill(1)}let d=e.strides.slice();if(d.reduce((c,f)=>c+f,0)===0){let c=t[0].dims.length-2;d=new Array(c).fill(1)}Vl(o,r,u,e.autoPad,e.group,i,d,n,s,a);let p=Object.assign({},e);return Object.assign(p,{kernelShape:r,pads:i,outputPadding:s,outputShape:a,dilations:u,strides:d}),p},Pf=e=>{let t=Va(e),r=e.format,n=["NOTSET","VALID","SAME_UPPER","SAME_LOWER"][typeof e.autoPad>"u"?0:e.autoPad],i=e.dilations,a=e.group??1,s=e.kernelShape,o=e.pads,u=e.strides,d=e.wIsConst(),p=e.outputPadding,c=e.outputShape;return{autoPad:n,format:r,dilations:i,group:a,kernelShape:s,outputPadding:p,outputShape:c,pads:o,strides:u,wIsConst:d,...t,cacheKey:`${e.format};${t.activation};`}},Hl=(e,t)=>{if(!e||e.length!==2&&e.length!==3)throw new Error("Conv requires 2 or 3 inputs");if(e[0].dims.length!==4&&e[0].dims.length!==3)throw new Error("currently only support 2-dimensional conv");if(e[0].dims.length!==e[1].dims.length)throw new Error("filter does not have same dimension as input");let r=e[0].dims[t.format==="NHWC"?e[0].dims.length-1:1],n=e[1].dims[0];if(r!==n)throw new Error("FILTER_IN_CHANNEL should be equal to DATA_CHANNEL");let i=e[1].dims[1]*t.group;if(e.length===3&&(e[2].dims.length!==1||e[2].dims[0]!==i))throw new Error("invalid bias");let a=e[0].dims.length-2;if(t.dilations.reduce((s,o)=>s+o,0)>0&&t.dilations.length!==a)throw new Error(`dilations should be ${a}D`);if(t.strides.reduce((s,o)=>s+o,0)>0&&t.strides.length!==a)throw new Error(`strides should be ${a}D`);if(t.pads.reduce((s,o)=>s+o,0)>0&&t.pads.length!==a*2)throw new Error(`pads should be ${a*2}D`);if(t.outputPadding.length!==a&&t.outputPadding.length!==0)throw new Error(`output_padding should be ${a}D`);if(t.kernelShape.reduce((s,o)=>s+o,0)>0&&t.kernelShape.length!==0&&t.kernelShape.length!==e[1].dims.length-2)throw new Error("invalid kernel shape");if(t.outputShape.length!==0&&t.outputShape.length!==e[0].dims.length-2)throw new Error("invalid output shape")},Ei=(e,t,r,n)=>{let i=e.kernelCustomData.wT??e.compute(Ve(t[1],[2,3,0,1]),{inputs:[1],outputs:[r.wIsConst?-2:-1]})[0];r.wIsConst&&!e.kernelCustomData.wT&&(e.kernelCustomData.wT=i);let a=[t[0],i];t.length===3&&a.push(t[2]),e.compute(Df(a,r,n),{inputs:a})},jl=(e,t)=>{let r=t.format==="NHWC",n=[e.inputs[0].reshape(r?[e.inputs[0].dims[0],1,e.inputs[0].dims[1],e.inputs[0].dims[2]]:[e.inputs[0].dims[0],e.inputs[0].dims[1],1,e.inputs[0].dims[2]]),e.inputs[1].reshape([e.inputs[1].dims[0],e.inputs[1].dims[1],1,e.inputs[1].dims[2]])];e.inputs.length===3&&n.push(e.inputs[2]);let i=t.kernelShape;(i.length===0||i[0]===0)&&(i=[e.inputs[1].dims[2]]);let a=t.dilations;(a.length===0||a[0]===0)&&(a=[1]);let s=t.strides;(s.length===0||s[0]===0)&&(s=[1]);let o=t.pads;o.length===0&&(o=[0,0]),o=[0,o[0],0,o[1]],s=[1].concat(s),a=[1].concat(a),i=[1].concat(i);let u=t.outputPadding;u=[0].concat(u);let d=Ii({...t,pads:o,strides:s,dilations:a,kernelShape:i,outputPadding:u},n);Ei(e,n,d,p=>r?[p[0],p[2],p[3]]:[p[0],p[1],p[3]])},Uf=(e,t)=>{if(Hl(e.inputs,t),e.inputs[0].dims.length===3)jl(e,t);else{let r=Ii(t,e.inputs);Ei(e,e.inputs,r)}}}),Kl,Lf,qf,ob=V(()=>{ie(),ae(),Ae(),se(),Kl=(e,t,r,n)=>{let i=R.size(t),a=t.length,s=P("input",e,a),o=te("output",e,a),u=r.dataType===6?r.getInt32Array()[0]:Number(r.getBigInt64Array()[0]),d=R.normalizeAxis(u,a),p=c=>{let f=` i32(${s.indicesGet("inputIndices","uniforms.axis")}) `,g=re("uniforms.input_shape","uniforms.axis",a),m=n.reverse?f+(n.exclusive?" + 1":""):"0",_=n.reverse?g:f+(n.exclusive?"":" + 1");return`
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
                }`};return{name:"CumSum",shaderCache:{hint:n.cacheKey,inputDependencies:["rank"]},getRunData:()=>({outputs:[{dims:t,dataType:e}],dispatchGroup:{x:Math.ceil(i/64)},programUniforms:[{type:12,data:i},{type:12,data:d},...ne(t,t)]}),getShaderSource:p}},Lf=(e,t)=>{let r=e.inputs[0].dims,n=e.inputs[0].dataType,i=e.inputs[1];e.compute(Kl(n,r,i,t),{inputs:[0]})},qf=e=>{let t=e.exclusive===1,r=e.reverse===1;return _e({exclusive:t,reverse:r})}}),Xl,Zl,Yl,Wf,Ff,ub=V(()=>{ie(),ae(),Ae(),se(),Xl=e=>{if(!e||e.length!==1)throw new Error("DepthToSpace requires 1 input.");if(e[0].dims.length!==4)throw new Error("DepthToSpace requires 4D input.")},Zl=(e,t,r,n)=>{let i=[];i.push(`fn perm(i: ${n.type.indices}) -> ${r.type.indices} {
    var a: ${r.type.indices};`);for(let a=0;a<t;++a)i.push(r.indicesSet("a",e[a],`i[${a}]`));return i.push("return a;}"),i.join(`
`)},Yl=(e,t)=>{let r,n,i,a,s,o,u=t.format==="NHWC",d=t.blocksize,p=t.mode==="DCR";u?([r,n,i,a]=e.dims,s=p?[r,n,i,d,d,a/d**2]:[r,n,i,a/d**2,d,d],o=p?[0,1,3,2,4,5]:[0,1,4,2,5,3]):([r,n,i,a]=[e.dims[0],e.dims[2],e.dims[3],e.dims[1]],s=p?[r,d,d,a/d**2,n,i]:[r,a/d**2,d,d,n,i],o=p?[0,3,4,1,5,2]:[0,1,4,2,5,3]);let c=e.reshape(s),f=c.dims.length,g=e.dataType,m=P("a",g,f),_=te("output",g,f),v=w=>`
  ${w.registerUniform("output_size","u32").declareVariables(m,_)}

  ${Zl(o,f,m,_)}

  ${w.mainStart()}
    ${w.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}

    let indices = ${_.offsetToIndices("global_idx")};
    let aIndices = perm(indices);

    ${_.setByOffset("global_idx",m.getByIndices("aIndices"))}
  }`;return{name:"DepthToSpace",shaderCache:{hint:`${e.dims};${t.blocksize};${t.mode}`,inputDependencies:["rank"]},getRunData:w=>{let $=u?[r,n*d,i*d,a/d**2]:[r,a/d**2,n*d,i*d],S=R.size($),x=c.dims,I=R.sortBasedOnPerm(x,o);return{outputs:[{dims:$,dataType:w[0].dataType}],dispatchGroup:{x:Math.ceil(S/64)},programUniforms:[{type:12,data:S},...ne(x,I)]}},getShaderSource:v}},Wf=(e,t)=>{Xl(e.inputs),e.compute(Yl(e.inputs[0],t))},Ff=e=>_e({blocksize:e.blocksize,mode:e.mode,format:e.format})}),rn,_r,Ci,Ql,Jl,ed,td,zi,rd,Gf,Vf,lb=V(()=>{ie(),ae(),Ae(),se(),rn="[a-zA-Z]|\\.\\.\\.",_r="("+rn+")+",Ci="^"+_r+"$",Ql="("+_r+",)*"+_r,Jl="^"+Ql+"$",ed=class{constructor(e=-1){this.symbolToIndices=new Map,this.inputIndex=e}addSymbol(e,t){let r=this.symbolToIndices.get(e);r===void 0?r=[t]:r.push(t),this.symbolToIndices.set(e,r)}},td=class{constructor(e,t){this.equation=t,this.hasEllipsis=!1,this.symbolToInfo=new Map,this.lhs=new Array,this.outputDims=[];let[r,n]=t.includes("->")?t.split("->",2):[t,""];if(!r.match(RegExp(Jl)))throw new Error("Invalid LHS term");if(r.split(",").forEach((i,a)=>{let s=e[a].dims.slice();if(!i.match(RegExp(Ci)))throw new Error("Invalid LHS term");let o=this.processTerm(i,!0,s,a);this.lhs.push(o)}),n==="")n+=[...this.symbolToInfo.entries()].filter(([i,a])=>a.count===1||i==="...").map(([i])=>i).join("");else if(!n.match(RegExp(_r)))throw new Error("Invalid RHS");n.match(RegExp(rn,"g"))?.forEach(i=>{if(i==="...")this.outputDims=this.outputDims.concat(this.ellipsisDims);else{let a=this.symbolToInfo.get(i);if(a===void 0)throw new Error("Invalid RHS symbol");this.outputDims.push(a.dimValue)}}),this.rhs=this.processTerm(n,!1,this.outputDims)}addSymbol(e,t,r){let n=this.symbolToInfo.get(e);if(n!==void 0){if(n.dimValue!==t&&n.count!==1)throw new Error("Dimension mismatch");n.count++,n.inputIndices.push(r)}else n={count:1,dimValue:t,inputIndices:[r]};this.symbolToInfo.set(e,n)}processTerm(e,t,r,n=-1){let i=r.length,a=!1,s=[],o=0;if(!e.match(RegExp(Ci))&&!t&&e!=="")throw new Error("Invalid LHS term");let u=e.match(RegExp(rn,"g")),d=new ed(n);return u?.forEach((p,c)=>{if(p==="..."){if(a)throw new Error("Only one ellipsis is allowed per input term");a=!0;let f=i-u.length+1;if(f<0)throw new Error("Ellipsis out of bounds");if(s=r.slice(o,o+f),this.hasEllipsis){if(this.ellipsisDims.length!==s.length||this.ellipsisDims.toString()!==s.toString())throw new Error("Ellipsis dimensions mismatch")}else if(t)this.hasEllipsis=!0,this.ellipsisDims=s;else throw new Error("Ellipsis must be specified in the LHS");for(let g=0;g<s.length;g++){let m=String.fromCharCode(48+g);d.addSymbol(m,c+g),this.addSymbol(m,r[o++],n)}}else d.addSymbol(p,c+(this.hasEllipsis?this.ellipsisDims.length-1:0)),this.addSymbol(p,r[o++],n)}),d}},zi=e=>e+"_max",rd=(e,t,r,n)=>{let i=e.map(d=>d.length).map((d,p)=>P(`input${p}`,t,d)),a=R.size(n),s=te("output",t,n.length),o=[...r.symbolToInfo.keys()].filter(d=>!r.rhs.symbolToIndices.has(d)),u=d=>{let p=[],c="var prod = 1.0;",f="var sum = 0.0;",g="sum += prod;",m=[],_=[],v=[],w=[],$=r.symbolToInfo.size===r.rhs.symbolToIndices.size;r.symbolToInfo.forEach((x,I)=>{if(r.rhs.symbolToIndices.has(I)){let E=r.rhs.symbolToIndices.get(I)?.[0];E!==void 0&&r.lhs.forEach((z,k)=>{if(x.inputIndices.includes(k)){let N=z.symbolToIndices.get(I);if(N===void 0)throw new Error("Invalid symbol error");N.forEach(O=>{p.push(`${i[k].indicesSet(`input${k}Indices`,O,s.indicesGet("outputIndices",E))}`)})}})}else r.lhs.forEach((E,z)=>{if(x.inputIndices.includes(z)){let k=E.symbolToIndices.get(I);if(k===void 0)throw new Error("Invalid symbol error");k.forEach(N=>{m.push(`${i[z].indicesSet(`input${z}Indices`,N,`${I}`)}`)}),w.push(`prod *= ${i[z].getByIndices(`input${z}Indices`)};`)}}),_.push(`for(var ${I}: u32 = 0; ${I} < uniforms.${zi(I)}; ${I}++) {`),v.push("}")});let S=$?[...p,`let sum = ${i.map((x,I)=>x.getByIndices(`input${I}Indices`)).join(" * ")};`]:[...p,f,..._,...m,c,...w,g,...v];return`
            ${d.registerUniforms(o.map(x=>({name:`${zi(x)}`,type:"u32"}))).registerUniform("outputSize","u32").declareVariables(...i,s)}

            ${d.mainStart()}
            ${d.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}
            var outputIndices = ${s.offsetToIndices("global_idx")};
            ${i.map((x,I)=>`var input${I}Indices: ${i[I].type.indices};`).join(`
`)}
            ${S.join(`
`)};
            ${s.setByOffset("global_idx","sum")};
          }`};return{name:"Einsum",shaderCache:{hint:r.equation,inputDependencies:e.map(()=>"rank")},getRunData:()=>{let d=o.filter(c=>r.symbolToInfo.has(c)).map(c=>({type:12,data:r.symbolToInfo.get(c)?.dimValue||0}));d.push({type:12,data:a});let p=e.map((c,f)=>[...ne(c)]).reduce((c,f)=>c.concat(f),d);return p.push(...ne(n)),{outputs:[{dims:n,dataType:t}],dispatchGroup:{x:Math.ceil(a/64)},programUniforms:p}},getShaderSource:u}},Gf=(e,t)=>{let r=new td(e.inputs,t.equation),n=r.outputDims,i=e.inputs.map((a,s)=>a.dims);e.compute(rd(i,e.inputs[0].dataType,r,n))},Vf=e=>{let t=e.equation.replace(/\s+/g,"");return _e({equation:t})}}),nd,Ai,id,ad,Hf,db=V(()=>{ie(),ae(),se(),nd=e=>{if(!e||e.length!==2)throw new Error("Expand requires 2 input.");let t=e[0].dims,r=Array.from(e[1].getBigInt64Array(),Number),n=r.length<t.length?0:r.length-t.length,i=t.length<r.length?0:t.length-r.length;for(;n<r.length&&i<t.length;++n,++i)if(r[n]!==t[i]&&r[n]!==1&&t[i]!==1)throw new Error("Expand requires shape to be broadcastable to input")},Ai=(e,t)=>{let r=e.length-t.length,n=[];for(let i=0;i<r;++i)n.push(e[i]);for(let i=0;i<t.length;++i)n.push(t[i]===1?e[i+r]:t[i]);return n},id=(e,t)=>e.length>t.length?Ai(e,t):Ai(t,e),ad=e=>{let t=e[0].dims,r=Array.from(e[1].getBigInt64Array(),Number),n=id(t,r),i=e[0].dataType,a=i===9||R.size(t)===1,s=i===9||t.length>0&&t[t.length-1]%4===0?4:1,o=a||n.length>0&&n[n.length-1]%4===0?4:1,u=Math.ceil(R.size(n)/o),d=c=>{let f=P("input",i,t.length,s),g=te("output",i,n.length,o),m;if(i===9){let _=(v,w,$="")=>`
          let outputIndices${w} = ${g.offsetToIndices(`outputOffset + ${w}u`)};
          let offset${w} = ${f.broadcastedIndicesToOffset(`outputIndices${w}`,g)};
          let index${w} = offset${w} / 4u;
          let component${w} = offset${w} % 4u;
          ${v}[${w}] = ${$}(${f.getByOffset(`index${w}`)}[component${w}]);
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
    ${m}`},p=[{type:12,data:u},...ne(t,n)];return{name:"Expand",shaderCache:{hint:`${n.length};${s}${o}`,inputDependencies:["rank"]},getShaderSource:d,getRunData:()=>({outputs:[{dims:n,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(u/64)},programUniforms:p})}},Hf=e=>{nd(e.inputs),e.compute(ad(e.inputs),{inputs:[0]})}}),sd,jf,pb=V(()=>{ie(),ae(),se(),Ga(),sd=e=>{let t=e[0].dataType,r=R.size(e[0].dims),n=R.size(e[1].dims),i=n%4===0,a=s=>{let o=P("x",t,[1],4),u=P("bias",t,[1],4),d=te("y",t,[1],4),p=[{name:"output_vec_size",type:"u32"},{name:"bias_size",type:"u32"}],c=g=>`
      let bias${g}_offset: u32 = (global_idx * 4 + ${g}) % uniforms.bias_size;
      let bias${g} = ${u.getByOffset(`bias${g}_offset / 4`)}[bias${g}_offset % 4];`,f=i?`
      let bias = ${u.getByOffset("global_idx % (uniforms.bias_size / 4)")};`:`${c(0)}${c(1)}${c(2)}${c(3)}
      let bias = ${o.type.value}(bias0, bias1, bias2, bias3);`;return`${s.registerUniforms(p).declareVariables(o,u,d)}

    ${fa(De(t))}

    ${s.mainStart(or)}
      ${s.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_vec_size")}

      let x = ${o.getByOffset("global_idx")};
      ${f}
      let x_in = x + bias;
      ${d.setByOffset("global_idx",ma("x_in"))}
    }`};return{name:"FastGeluWithBias",shaderCache:{hint:`${i}`,inputDependencies:["type","type"]},getShaderSource:a,getRunData:s=>({outputs:[{dims:s[0].dims,dataType:s[0].dataType}],programUniforms:[{type:12,data:Math.ceil(r/4)},{type:12,data:n}],dispatchGroup:{x:Math.ceil(r/or/4)}})}},jf=e=>{e.inputs.length<2||R.size(e.inputs[1].dims)===0?hf(e):e.compute(sd(e.inputs))}}),od,ud,Kf,Xf,cb=V(()=>{ie(),ae(),Ae(),se(),od=e=>{if(!e||e.length!==2)throw new Error("Gather requires 2 inputs.")},ud=(e,t)=>{let r=e[0].dims,n=e[1].dims,i=r.length,a=R.normalizeAxis(t.axis,i),s=r.slice(0);s.splice(a,1,...n);let o=r[a],u=e[0].dataType===9?4:1,d=Math.ceil(R.size(s)/u),p=[{type:12,data:d},{type:6,data:o},{type:12,data:a},...ne(e[0].dims,e[1].dims,s)],c=f=>{let g=P("data",e[0].dataType,e[0].dims.length,u),m=P("inputIndices",e[1].dataType,e[1].dims.length),_=te("output",e[0].dataType,s.length,u),v=$=>{let S=n.length,x=`var indicesIndices${$}  = ${m.type.indices}(0);`;for(let I=0;I<S;I++)x+=`${S>1?`indicesIndices${$}[${I}]`:`indicesIndices${$}`} = ${s.length>1?`outputIndices${$}[uniforms.axis + ${I}]`:`outputIndices${$}`};`;x+=`
          var idx${$} = ${m.getByIndices(`indicesIndices${$}`)};
          if (idx${$} < 0) {
            idx${$} = idx${$} + uniforms.axisDimLimit;
          }
          var dataIndices${$} : ${g.type.indices};
        `;for(let I=0,E=0;I<i;I++)I===a?(x+=`${i>1?`dataIndices${$}[${I}]`:`dataIndices${$}`} = u32(idx${$});`,E+=S):(x+=`${i>1?`dataIndices${$}[${I}]`:`dataIndices${$}`} = ${s.length>1?`outputIndices${$}[${E}]`:`outputIndices${$}`};`,E++);return x},w;if(e[0].dataType===9){let $=(S,x,I="")=>`
          let outputIndices${x} = ${_.offsetToIndices(`outputOffset + ${x}u`)};
          ${v(x)};
          let offset${x} = ${g.indicesToOffset(`dataIndices${x}`)};
          let index${x} = offset${x} / 4u;
          let component${x} = offset${x} % 4u;
          ${S}[${x}] = ${I}(${g.getByOffset(`index${x}`)}[component${x}]);
        `;w=`
        let outputOffset = global_idx * ${u};
        var value = vec4<u32>(0);
        ${$("value",0,"u32")}
        ${$("value",1,"u32")}
        ${$("value",2,"u32")}
        ${$("value",3,"u32")}
        ${_.setByOffset("global_idx","value")}
      `}else w=`
      let outputIndices = ${_.offsetToIndices("global_idx")};
      ${v("")};
      let value = ${g.getByIndices("dataIndices")};
      ${_.setByOffset("global_idx","value")};
      `;return`
      ${f.registerUniform("outputSize","u32").registerUniform("axisDimLimit","i32").registerUniform("axis","u32").declareVariables(g,m,_)}
      ${f.mainStart()}
        ${f.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}
        ${w}
      }`};return{name:"Gather",shaderCache:{hint:t.cacheKey,inputDependencies:["rank","rank"]},getRunData:()=>({outputs:[{dims:s,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(d/64)},programUniforms:p}),getShaderSource:c}},Kf=e=>_e({axis:e.axis}),Xf=(e,t)=>{let r=e.inputs;od(r),e.compute(ud(e.inputs,t))}}),ld,Zf,Yf,hb=V(()=>{ie(),ae(),se(),ld=(e,t,r,n,i,a,s,o,u)=>{let d=[{type:12,data:a},{type:12,data:n},{type:12,data:i},{type:12,data:r},{type:12,data:s},{type:12,data:o},{type:12,data:u}],p=[a];d.push(...ne(t.dims,p));let c=f=>{let g=P("indices_data",t.dataType,t.dims.length),m=te("input_slice_offsets_data",12,1,1),_=[g,m],v=[{name:"output_size",type:"u32"},{name:"batch_dims",type:"u32"},{name:"input_dims",type:"u32",length:i.length},{name:"sizes_from_slice_dims_data",type:"u32",length:r.length},{name:"num_slices_per_batch",type:"u32"},{name:"input_batch_stride",type:"u32"},{name:"num_slice_dims",type:"u32"}];return`
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
        ${i.length===1?"index += i32(uniforms.input_dims);":"index += i32(uniforms.input_dims[input_dim_idx]);"}
      }
      ${r.length===1?"relative_slice_offset += index * i32(uniforms.sizes_from_slice_dims_data);":"relative_slice_offset += index * i32(uniforms.sizes_from_slice_dims_data[dim_idx]);"}
    }

    input_slice_offsets_data[global_idx] =  base_offset + u32(relative_slice_offset);
  }`};return e.compute({name:"computeSliceOffsets",shaderCache:{hint:`${i.length}_${r.length}`,inputDependencies:["rank"]},getRunData:()=>({outputs:[{dims:p,dataType:e.inputs[1].dataType}],dispatchGroup:{x:Math.ceil(a/64)},programUniforms:d}),getShaderSource:c},{inputs:[t],outputs:[-1]})[0]},Zf=(e,t)=>{let r=e.inputs,n=r[0].dims,i=r[0].dataType,a=r[1].dims,s=a[a.length-1],o=R.sizeToDimension(a,a.length-1),u=R.sizeFromDimension(n,t.batchDims+s),d=R.sizeToDimension(n,t.batchDims),p=R.sizeFromDimension(n,t.batchDims),c=o/d,f=new Array(s),g=u;for(let x=0;x<s;++x)f[s-1-x]=g,g*=n[t.batchDims+s-1-x];let m=ld(e,r[1],f,t.batchDims,n,o,c,p,s),_=t.batchDims+s;if(_>n.length)throw new Error("last dimension of indices must not be larger than rank of input tensor");let v=a.slice(0,-1).concat(n.slice(_)),w=R.size(v),$=[{type:12,data:w},{type:12,data:u},...ne(r[0].dims,m.dims,v)],S=x=>{let I=P("data",r[0].dataType,r[0].dims.length),E=P("slice_offsets",12,m.dims.length),z=te("output",r[0].dataType,v.length);return`
          ${x.registerUniform("output_size","u32").registerUniform("slice_size","u32").declareVariables(I,E,z)}
            ${x.mainStart()}
            ${x.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
          let slice_offset = slice_offsets[global_idx / uniforms.slice_size];
          output[global_idx] = data[u32(slice_offset) + global_idx % uniforms.slice_size];
        }`};e.compute({name:"GatherND",shaderCache:{hint:t.cacheKey,inputDependencies:["rank","rank"]},getRunData:()=>({outputs:[{dims:v,dataType:i}],dispatchGroup:{x:Math.ceil(w/64)},programUniforms:$}),getShaderSource:S},{inputs:[r[0],m]})},Yf=e=>({batchDims:e.batch_dims,cacheKey:""})}),dd,pd,Qf,Jf,fb=V(()=>{ie(),ae(),Ae(),se(),dd=(e,t)=>{if(e.length<3||e.length>4)throw new Error("GatherBlockQuantized requires 3 or 4 inputs.");let r=R.normalizeAxis(t.quantizeAxis,e[0].dims.length),n=t.blockSize,i=e[0],a=e[2],s=e.length===4?e[3]:void 0;if(a.dims.length!==i.dims.length||!i.dims.map((o,u)=>u===r?Math.ceil(o/n)===a.dims[u]:o===a.dims[u]).reduce((o,u)=>o&&u,!0))throw new Error("Scales must have the same rank as the input tensor and the dims should match except on gatherAxis.");if(s){if(s.dataType!==i.dataType)throw new Error("Zero point must have the same data type as the input tensor.");if(s.dims.length!==a.dims.length||!s.dims.map((o,u)=>o===a.dims[u]).reduce((o,u)=>o&&u,!0))throw new Error("Zero point must have the same rank as the input tensor and the dims should match except on quantizeAxis.")}},pd=(e,t)=>{let r=e[0].dims,n=e[1].dims,i=r.length,a=R.normalizeAxis(t.gatherAxis,i),s=R.normalizeAxis(t.quantizeAxis,i),o=r.slice(0);o.splice(a,1,...n);let u=R.size(o),d=e[2].dataType,p=e[0].dataType===22,c=[{type:12,data:u},{type:12,data:s},{type:12,data:a},{type:12,data:t.blockSize},...ne(...e.map((g,m)=>g.dims),o)],f=g=>{let m=P("data",e[0].dataType,e[0].dims.length),_=P("inputIndices",e[1].dataType,e[1].dims.length),v=P("scales",e[2].dataType,e[2].dims.length),w=e.length>3?P("zeroPoint",e[3].dataType,e[3].dims.length):void 0,$=te("output",d,o.length),S=[m,_,v];w&&S.push(w);let x=[{name:"output_size",type:"u32"},{name:"quantize_axis",type:"u32"},{name:"gather_axis",type:"u32"},{name:"block_size",type:"u32"}];return`
        ${g.registerUniforms(x).declareVariables(...S,$)}
        ${g.mainStart()}
        let output_indices = ${$.offsetToIndices("global_idx")};
        var indices_indices = ${_.type.indices}(0);
        ${n.length>1?`
          for (var i: u32 = 0; i < ${n.length}; i++) {
            let index = ${$.indicesGet("output_indices","uniforms.gather_axis + i")};
            ${_.indicesSet("indices_indices","i","index")};
          }`:`indices_indices = ${$.indicesGet("output_indices","uniforms.gather_axis")};`};
        var data_indices = ${m.type.indices}(0);
        for (var i: u32 = 0; i < uniforms.gather_axis; i++) {
          let index = ${$.indicesGet("output_indices","i")};
          ${m.indicesSet("data_indices","i","index")};
        }
        var index_from_indices = ${_.getByIndices("indices_indices")};
        if (index_from_indices < 0) {
          index_from_indices += ${r[a]};
        }
        ${m.indicesSet("data_indices","uniforms.gather_axis","u32(index_from_indices)")};
        for (var i = uniforms.gather_axis + 1; i < ${o.length}; i++) {
          let index = ${$.indicesGet("output_indices",`i + ${n.length} - 1`)};
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
        ${w?`
              let zero_point_indices = scale_indices;
              let zero_point_offset = ${w.indicesToOffset("zero_point_indices")};
              let zero_point_index = zero_point_offset % 8;
              let packed_4bit_zero_points = ${w.getByOffset("zero_point_offset / 8")};
              let packed_8bit_zero_points = (packed_4bit_zero_points >> (4 * (zero_point_index % 2))) & 0x0f0f0f0f;
              let zero_point_vec = ${p?"unpack4xI8":"unpack4xU8"}(u32(packed_8bit_zero_points));
              let zero_point = zero_point_vec[zero_point_index / 2];`:"var zero_point = 0"};
        let dequantized_data = ${De(d)}(quantized_data - zero_point) * scale;
        ${$.setByOffset("global_idx","dequantized_data")};
    }`};return{name:"GatherBlockQuantized",shaderCache:{hint:`${t.cacheKey};${e.filter((g,m)=>m!==1).map(g=>g.dims.join("_")).join(";")}`,inputDependencies:Array.from({length:e.length},(g,m)=>"rank")},getRunData:()=>({outputs:[{dims:o,dataType:d}],dispatchGroup:{x:Math.ceil(u/64)},programUniforms:c}),getShaderSource:f}},Qf=(e,t)=>{let r=e.inputs;dd(r,t),e.compute(pd(e.inputs,t))},Jf=e=>_e({blockSize:e.blockSize,gatherAxis:e.gatherAxis,quantizeAxis:e.quantizeAxis})}),cd,hd,em,tm,mb=V(()=>{ie(),ae(),Ae(),se(),cd=e=>{if(!e||e.length!==2)throw new Error("GatherElements requires 2 inputs.");if(e[0].dims.length<1)throw new Error("GatherElements requires that the data input be rank >= 1.");if(e[0].dims.length!==e[1].dims.length)throw new Error(`GatherElements requires that the data input and
                     indices input tensors be of same rank.`)},hd=(e,t)=>{let r=e[0].dims,n=e[0].dataType,i=r.length,a=e[1].dims,s=e[1].dataType,o=R.normalizeAxis(t.axis,i),u=r[o],d=a.slice(0),p=R.size(d),c=P("input",n,i),f=P("indicesInput",s,a.length),g=te("output",n,d.length),m=[{type:12,data:p},{type:6,data:u},{type:12,data:o}];return m.push(...ne(r,a,d)),{name:"GatherElements",shaderCache:{inputDependencies:["rank","rank"]},getRunData:()=>({outputs:[{dims:d,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(p/64)},programUniforms:m}),getShaderSource:_=>`
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
  }`}},em=e=>_e({axis:e.axis}),tm=(e,t)=>{let r=e.inputs;cd(r),e.compute(hd(e.inputs,t))}}),fd,md,rm,nm,gb=V(()=>{ie(),ae(),se(),fd=e=>{if(!e)throw new Error("Input is missing");if(e.length<2||e.length>3)throw new Error("Invaid input number.");if(e.length===3&&e[2].dims.length>2)throw new Error("Invalid input shape of C");if(e[0].dataType!==e[1].dataType||e.length===3&&e[0].dataType!==e[2].dataType)throw new Error("Input types are mismatched")},md=(e,t)=>{let r=e[0].dims.slice(),n=e[1].dims.slice(),[i,a,s]=Jc.getShapeOfGemmResult(r,t.transA,n,t.transB,e.length===3?e[2].dims:void 0),o=[i,a];if(!o)throw new Error("Can't use gemm on the given tensors");let u=16,d=Math.ceil(a/u),p=Math.ceil(i/u),c=!0,f=R.size(o),g=[{type:12,data:c?d:f},{type:12,data:i},{type:12,data:a},{type:12,data:s},{type:1,data:t.alpha},{type:1,data:t.beta}],m=["type","type"];e.length===3&&(g.push(...ne(e[2].dims)),m.push("rank")),g.push(...ne(o));let _=w=>{let $="";t.transA&&t.transB?$="value += a[k * uniforms.M + m] * b[n * uniforms.K + k];":t.transA&&!t.transB?$="value += a[k * uniforms.M + m] * b[k * uniforms.N + n];":!t.transA&&t.transB?$="value += a[m * uniforms.K + k] * b[n * uniforms.K + k];":!t.transA&&!t.transB&&($="value += a[m * uniforms.K + k] * b[k * uniforms.N + n];");let S=t.alpha===1?"":"value *= uniforms.alpha;",x=P("a",e[0].dataType,e[0].dims),I=P("b",e[1].dataType,e[1].dims),E=x.type.value,z=null,k=[x,I];e.length===3&&(z=P("c",e[2].dataType,e[2].dims.length),k.push(z));let N=te("output",e[0].dataType,o.length);k.push(N);let O=[{name:"output_size",type:"u32"},{name:"M",type:"u32"},{name:"N",type:"u32"},{name:"K",type:"u32"},{name:"alpha",type:"f32"},{name:"beta",type:"f32"}];return`
  ${w.registerUniforms(O).declareVariables(...k)}

  ${w.mainStart()}
    ${w.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}

    let m = global_idx / uniforms.N;
    let n = global_idx % uniforms.N;

    var value = ${E}(0);
    for (var k: u32 = 0u; k < uniforms.K; k++) {
      ${$}
    }

    ${S}
    ${z!=null?`let cOffset = ${z.broadcastedIndicesToOffset("vec2(m, n)",N)}; value += ${E}(uniforms.beta) * ${z.getByOffset("cOffset")};`:""}
    output[global_idx] = value;
  }`},v=w=>{let $=P("a",e[0].dataType,e[0].dims),S=P("b",e[1].dataType,e[1].dims),x=null,I=[$,S];e.length===3&&(x=P("c",e[2].dataType,e[2].dims.length),I.push(x));let E=te("output",e[0].dataType,o.length);I.push(E);let z=[{name:"num_tile_n",type:"u32"},{name:"M",type:"u32"},{name:"N",type:"u32"},{name:"K",type:"u32"},{name:"alpha",type:"f32"},{name:"beta",type:"f32"}],k="",N="";t.transA&&t.transB?(N=`
      var col = tile_row_start + local_id.x;
      var row = k_start + local_id.y;
      if (col < uniforms.M && row < uniforms.K) {
        tile_a[local_id.y][local_id.x] = a[row * uniforms.M + col];
      } else {
        tile_a[local_id.y][local_id.x] = ${$.type.value}(0);
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
        tile_a[local_id.y][local_id.x] = ${$.type.value}(0);
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
        tile_a[local_id.y][local_id.x] = ${$.type.value}(0);
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
        tile_a[local_id.y][local_id.x] = ${$.type.value}(0);
      }

      col = tile_col_start + local_id.x;
      row = k_start + local_id.y;
      if (col < uniforms.N && row < uniforms.K) {
        tile_b[local_id.y][local_id.x] = b[row * uniforms.N + col];
      } else {
        tile_b[local_id.y][local_id.x] = ${S.type.value}(0);
      }
      `,k="value += tile_a[local_id.y][k] * tile_b[k][local_id.x];");let O=t.alpha===1?"":"value *= uniforms.alpha;";return`
  ${w.registerUniforms(z).declareVariables(...I)}
  var<workgroup> tile_a: array<array<${$.type.storage}, ${u}>, ${u}>;
  var<workgroup> tile_b: array<array<${S.type.storage}, ${u}>, ${u}>;
  ${w.mainStart([u,u,1])}
    let tile_col_start = (workgroup_index % uniforms.num_tile_n) * ${u};
    let tile_row_start = (workgroup_index / uniforms.num_tile_n) * ${u};
    let num_tiles = (uniforms.K - 1) / ${u} + 1;
    var k_start = 0u;
    var value = ${E.type.value}(0);
    for (var t: u32 = 0u; t < num_tiles; t++) {
      ${N}
      k_start = k_start + ${u};
      workgroupBarrier();

      for (var k: u32 = 0u; k < ${u}; k++) {
        ${k}
      }
      workgroupBarrier();
    }

    ${O}
    let m = tile_row_start + local_id.y;
    let n = tile_col_start + local_id.x;
    ${x!=null?`let cOffset = ${x.broadcastedIndicesToOffset("vec2(m, n)",E)}; value += ${E.type.value}(uniforms.beta) * ${x.getByOffset("cOffset")};`:""}
    if (m < uniforms.M && n < uniforms.N) {
      output[m * uniforms.N + n] = value;
    }
  }`};return c?{name:"GemmShared",shaderCache:{hint:`${t.cacheKey}`,inputDependencies:m},getRunData:()=>({outputs:[{dims:o,dataType:e[0].dataType}],dispatchGroup:{x:d*p},programUniforms:g}),getShaderSource:v}:{name:"Gemm",shaderCache:{hint:`${t.cacheKey}`,inputDependencies:m},getRunData:()=>({outputs:[{dims:o,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(f/64)},programUniforms:g}),getShaderSource:_}},rm=e=>{let t=e.transA,r=e.transB,n=e.alpha,i=e.beta;return{transA:t,transB:r,alpha:n,beta:i,cacheKey:`${e.transA};${e.transB};${e.alpha===1}`}},nm=(e,t)=>{fd(e.inputs),e.compute(md(e.inputs,t))}}),dt,ft,Rt,Nt,gd,yd,_d,bd,wd,$d,vd,xd,im,am,yb=V(()=>{ie(),ae(),Ae(),se(),[dt,ft,Rt,Nt]=[0,1,2,3],gd=e=>{if(e[0].dims.length!==4)throw new Error("only 4-D tensor is supported.");if(e[0].dims.length!==e[1].dims.length)throw new Error("input dimensions must be equal to grid dimensions");if(e[0].dims.length-2!==e[1].dims[e[1].dims.length-1])throw new Error(`last dimension of grid must be equal to ${e[0].dims.length-2}`);if(e[0].dims[0]!==e[1].dims[0])throw new Error("grid batch size must match input batch size")},yd=`
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
`,_d=e=>`
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
`,bd=e=>`
  fn gs_denormalize(n: f32, length: i32) -> f32 {
    ${e.alignCorners===0?`
    // alignCorners: false => [-1, 1] to [-0.5, length - 0.5]
    return ((n + 1.0) * f32(length) - 1.0) / 2.0;
    `:`
    // alignCorners: true => [-1, 1] to [0, length - 1]
    return (n + 1.0) / 2.0 * (f32(length - 1));
    `}
  }
`,wd=e=>`
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
`,$d=(e,t,r)=>`
  fn pixel_at_grid(r: i32, c: i32, H: i32, W: i32, batch: u32, channel: u32, border: vec4<f32>) -> ${t} {
     var pixel = ${t}(0);
     var indices = vec4<u32>(0);
     indices[${dt}] = batch;
     indices[${ft}] = channel;`+(()=>{switch(r.paddingMode){case"zeros":return`
          if (r >= 0 && r < H && c >=0 && c < W) {
            indices[${Rt}] = u32(r);
            indices[${Nt}] = u32(c);
          } else {
            return ${t}(0);
          }
        `;case"border":return`
          indices[${Rt}] = u32(clamp(r, 0, H - 1));
          indices[${Nt}] = u32(clamp(c, 0, W - 1));
        `;case"reflection":return`
          indices[${Rt}] = gs_reflect(r, border[1], border[3]);
          indices[${Nt}] = gs_reflect(c, border[0], border[2]);
        `;default:throw new Error(`padding mode ${r.paddingMode} is not supported`)}})()+`
    return ${e.getByIndices("indices")};
  }
`,vd=(e,t,r)=>(()=>{switch(r.mode){case"nearest":return`
          let result = pixel_at_grid(i32(round(y)), i32(round(x)), H_in, W_in, indices[${dt}], indices[${ft}], border);
        `;case"bilinear":return`
          let x1 = i32(floor(x));
          let y1 = i32(floor(y));
          let x2 = x1 + 1;
          let y2 = y1 + 1;

          let p11 = pixel_at_grid(y1, x1, H_in, W_in, indices[${dt}], indices[${ft}], border);
          let p12 = pixel_at_grid(y1, x2, H_in, W_in, indices[${dt}], indices[${ft}], border);
          let p21 = pixel_at_grid(y2, x1, H_in, W_in, indices[${dt}], indices[${ft}], border);
          let p22 = pixel_at_grid(y2, x2, H_in, W_in, indices[${dt}], indices[${ft}], border);

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
              p[h][w] = pixel_at_grid(h + y0, w + x0, H_in, W_in, indices[${dt}], indices[${ft}], border);
            }
          }

          let dx = x - f32(x0 + 1);
          let dy = y - f32(y0 + 1);
          let result = gs_bicubic_interpolate(p, dx, dy);
        `;default:throw new Error(`mode ${r.mode} is not supported`)}})()+`${e.setByOffset("global_idx","result")}`,xd=(e,t)=>{let r=P("x",e[0].dataType,e[0].dims.length),n=[e[1].dims[0],e[1].dims[1],e[1].dims[2]],i=P("grid",e[1].dataType,n.length,2),a=[e[0].dims[0],e[0].dims[1],e[1].dims[1],e[1].dims[2]];t.format==="NHWC"&&(a=[e[0].dims[0],e[1].dims[1],e[1].dims[2],e[0].dims[3]],[dt,ft,Rt,Nt]=[0,3,1,2]);let s=te("output",e[0].dataType,a.length),o=r.type.value,u=R.size(a),d=[{type:12,data:u},...ne(e[0].dims,n,a)],p=c=>`
  ${c.registerUniform("output_size","u32").declareVariables(r,i,s)}
  ${yd}
  ${_d(o)}
  ${bd(t)}
  ${wd(t)}
  ${$d(r,o,t)}

  ${c.mainStart()}
    ${c.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
      let H_in = i32(uniforms.x_shape[${Rt}]);
      let W_in = i32(uniforms.x_shape[${Nt}]);

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
      var grid_indices = vec3<u32>(indices[${dt}], indices[${Rt}], indices[${Nt}]);
      let nxy = ${i.getByIndices("grid_indices")};
      var x = gs_denormalize(f32(nxy[0]), W_in);
      var y = gs_denormalize(f32(nxy[1]), H_in);

      ${vd(s,o,t)}
  }`;return{name:"GridSample",shaderCache:{hint:`${t.cacheKey}`,inputDependencies:["type","type"]},getRunData:c=>{let f=R.size(a);return{outputs:[{dims:a,dataType:c[0].dataType}],dispatchGroup:{x:Math.ceil(f/64)},programUniforms:d}},getShaderSource:p}},im=(e,t)=>{gd(e.inputs),e.compute(xd(e.inputs,t))},am=e=>_e({alignCorners:e.align_corners,mode:e.mode,paddingMode:e.padding_mode,format:e.format})}),Ue,Sd,sm,Mi,kd,Ir,om,um=V(()=>{ie(),ae(),Ae(),La(),Fa(),se(),Ct(),Ue=(e,t)=>e.length>t&&e[t].dims.length>0?e[t]:void 0,Sd=(e,t)=>{let r=e[0],n=Ue(e,1),i=Ue(e,2),a=Ue(e,3),s=Ue(e,4),o=Ue(e,5),u=Ue(e,6),d=Ue(e,7);if(r.dims.length!==3&&r.dims.length!==5)throw new Error("Input query is expected to have 3 or 5 dimensions");let p=r.dims[0],c=r.dims[1],f=r.dims.length===3?r.dims[2]:t.numHeads*r.dims[4],g=c,m=0,_=0,v=Math.floor(f/t.numHeads);if(u&&d&&R.size(u.dims)&&R.size(d.dims)){if(u.dims.length!==4)throw new Error('Input "past_key" is expected to have 4 dimensions');if(u.dims[0]!==p||u.dims[1]!==t.numHeads||u.dims[3]!==v)throw new Error('Input "past_key" shape (batch_size, num_heads, past_sequence_length, head_size)');if(d.dims[0]!==p||d.dims[1]!==t.numHeads||d.dims[3]!==v)throw new Error('Input "past_value" shape (batch_size, num_heads, past_sequence_length, head_size)');if(u.dims[2]!==d.dims[2])throw new Error('Input "past_key" and "past_value" shall have same dim 2 (past_sequence_length)');if(d.dims.length!==4)throw new Error('Input "past_value" is expected to have 4 dimensions');m=u.dims[2],_=u.dims[2]}else if(u&&R.size(u.dims)||d&&R.size(d.dims))throw new Error('Input "past_key" and "past_value" shall be both present or both absent');let w;if(n&&R.size(n.dims)>0){if(r.dims.length!==3)throw new Error('Input "query" is expected to have 3 dimensions when key is given');if(n.dims.length<3||n.dims.length>5)throw new Error('Input "key" is expected to have 3, 4, or 5 dimensions');if(r.dims[0]!==n.dims[0])throw new Error('Input "query" and "key" shall have same dim 0 (batch size)');if(n.dims.length===3){if(n.dims[2]!==r.dims[2])throw new Error('Input "query" and "key" shall have same dim 2 (hidden_size)');w=2,g=n.dims[1]}else if(n.dims.length===5){if(n.dims[2]!==t.numHeads||n.dims[3]!==2||n.dims[4]!==v)throw new Error('Expect "key" shape (batch_size, kv_sequence_length, num_heads, 2, head_size) for packed kv');if(i)throw new Error('Expect "value" be none when "key" has packed kv format.');w=5,g=n.dims[1]}else{if(n.dims[1]!==t.numHeads||n.dims[3]!==v)throw new Error('Expect "key" shape (batch_size, num_heads, kv_sequence_length, head_size) for past_key');w=0,g=n.dims[2]}}else{if(r.dims.length!==5)throw new Error('Input "query" is expected to have 5 dimensions when key is empty');if(r.dims[2]!==t.numHeads||r.dims[3]!==3)throw new Error('Expect "query" shape (batch_size, kv_sequence_length, num_heads, 3, head_size) for packed kv');w=3}if(a&&R.size(a.dims)>0){if(a.dims.length!==1)throw new Error('Input "bias" is expected to have 1 dimension');if(n&&n.dims.length===5&&n.dims[3]===2)throw new Error("bias is not allowed for packed kv.")}let $=m+g,S=0;if(s&&R.size(s.dims)>0){S=8;let z=s.dims;throw z.length===1?z[0]===p?S=1:z[0]===3*p+2&&(S=3):z.length===2&&z[0]===p&&z[1]===$&&(S=5),S===8?new Error('Input "key_padding_mask" shape shall be (batch_size) or (batch_size, total_sequence_length)'):new Error("Mask not supported")}let x=!1,I=f;if(i&&R.size(i.dims)>0){if(i.dims.length!==3&&i.dims.length!==4)throw new Error('Input "value" is expected to have 3 or 4 dimensions');if(r.dims[0]!==i.dims[0])throw new Error('Input "query" and "value" shall have same dim 0 (batch_size)');if(i.dims.length===3){if(g!==i.dims[1])throw new Error('Input "key" and "value" shall have the same dim 1 (kv_sequence_length)');I=i.dims[2]}else{if(g!==i.dims[2])throw new Error('Input "key" and "value" shall have the same dim 2 (kv_sequence_length)');I=i.dims[1]*i.dims[3],x=!0}}let E=!1;if(s&&R.size(s.dims)>0)throw new Error("Key padding mask is not supported");if(o&&R.size(o.dims)>0){if(o.dims.length!==4)throw new Error('Input "attention_bias" is expected to have 4 dimensions');if(o.dims[0]!==p||o.dims[1]!==t.numHeads||o.dims[2]!==c||o.dims[3]!==$)throw new Error('Expect "attention_bias" shape (batch_size, num_heads, sequence_length, total_sequence_length)')}return{batchSize:p,sequenceLength:c,pastSequenceLength:m,kvSequenceLength:g,totalSequenceLength:$,maxSequenceLength:_,inputHiddenSize:0,hiddenSize:f,vHiddenSize:I,headSize:v,vHeadSize:Math.floor(I/t.numHeads),numHeads:t.numHeads,isUnidirectional:!1,pastPresentShareBuffer:!1,maskFilterValue:t.maskFilterValue,maskType:S,scale:t.scale,broadcastResPosBias:E,passPastInKv:x,qkvFormat:w}},sm=e=>_e({...e}),Mi=_e({perm:[0,2,1,3]}),kd=(e,t,r,n,i,a,s)=>{let o=[n,i,a],u=R.size(o),d=[{type:12,data:u},{type:12,data:s},{type:12,data:a}],p=c=>{let f=te("qkv_with_bias",t.dataType,o),g=P("qkv",t.dataType,o),m=P("bias",r.dataType,o),_=[{name:"output_size",type:"u32"},{name:"bias_offset",type:"u32"},{name:"hidden_size",type:"u32"}];return`
  ${c.registerUniforms(_).declareVariables(g,m,f)}
  ${c.mainStart()}
    ${c.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
    let bias_offset_idx = (global_idx % uniforms.hidden_size) + uniforms.bias_offset;

    qkv_with_bias[global_idx] = qkv[global_idx] + bias[bias_offset_idx];
  }`};return e.compute({name:"MultiHeadAttentionAddBias",shaderCache:{inputDependencies:["type","type"]},getRunData:()=>({outputs:[{dims:o,dataType:t.dataType,gpuDataType:0}],dispatchGroup:{x:Math.ceil(u/64)},programUniforms:d}),getShaderSource:p},{inputs:[t,r],outputs:[-1]})[0]},Ir=(e,t,r,n,i,a,s,o)=>{let u=a;if(s&&R.size(s.dims)>0){if(n===1)throw new Error("AddBiasReshape is not implemented. Please export your model with packed QKV or KV");return u=kd(e,a,s,t,n,r*i,o),u=u.reshape([t,n,r,i]),r===1||n===1?u:e.compute(Ve(u,Mi.perm),{inputs:[u],outputs:[-1]})[0]}else return a.dims.length===3&&(u=a.reshape([t,n,r,i])),r===1||n===1?u:e.compute(Ve(u,Mi.perm),{inputs:[u],outputs:[-1]})[0]},om=(e,t)=>{let r=Sd(e.inputs,t),n=e.inputs[0],i=Ue(e.inputs,1),a=Ue(e.inputs,2),s=Ue(e.inputs,3),o=Ue(e.inputs,4),u=Ue(e.inputs,5),d=Ue(e.inputs,6),p=Ue(e.inputs,7);if(n.dims.length===5)throw new Error("Packed QKV is not implemented");if(i?.dims.length===5)throw new Error("Packed KV is not implemented");let c=i&&a&&i.dims.length===4&&a.dims.length===4,f=Ir(e,r.batchSize,r.numHeads,r.sequenceLength,r.headSize,n,s,0);if(c)return Ar(e,f,i,a,o,void 0,d,p,u,r);if(!i||!a)throw new Error("key and value must be provided");let g=Ir(e,r.batchSize,r.numHeads,r.kvSequenceLength,r.headSize,i,s,r.hiddenSize),m=Ir(e,r.batchSize,r.numHeads,r.kvSequenceLength,r.vHeadSize,a,s,2*r.hiddenSize);Ar(e,f,g,m,o,void 0,d,p,u,r)}}),Td,Id,Ed,Cd,wa,lm,dm,pm=V(()=>{ie(),ae(),Ae(),se(),Td=e=>{if(!e||e.length<1)throw new Error("too few inputs")},Id=(e,t)=>{let r=[],n=t.numOutputs;return e[1].dims[0]>0&&(e[1].getBigInt64Array().forEach(i=>r.push(Number(i))),n=r.length),_e({numOutputs:n,axis:t.axis,splitSizes:r})},Ed=e=>`
fn calculateOutputIndex(index: u32) -> u32 {
    for (var i: u32 = 0u; i < ${e}u; i += 1u ) {
    if (index < ${re("uniforms.size_in_split_axis","i",e)}) {
        return i;
    }
    }
    return ${e}u;
}`,Cd=e=>{let t=e.length,r=[];for(let n=0;n<t;++n){let i=e[n].setByIndices("indices","input[global_idx]");t===1?r.push(i):n===0?r.push(`if (output_number == ${n}u) { ${i} }`):n===t-1?r.push(`else { ${i} }`):r.push(`else if (output_number == ${n}) { ${i} }`)}return`
      fn writeBufferData(output_number: u32, indices: ${e[0].type.indices}, global_idx: u32) {
        ${r.join(`
`)}
      }`},wa=(e,t)=>{let r=e[0].dims,n=R.size(r),i=e[0].dataType,a=R.normalizeAxis(t.axis,r.length),s=new Array(t.numOutputs),o=P("input",i,r.length),u=new Array(t.numOutputs),d=[],p=[],c=0,f=[{type:12,data:n}];for(let m=0;m<t.numOutputs;m++){c+=t.splitSizes[m],u[m]=c;let _=r.slice();_[a]=t.splitSizes[m],p.push(_),s[m]=te(`output${m}`,i,_.length),d.push({dims:p[m],dataType:e[0].dataType})}f.push({type:12,data:u},...ne(r,...p));let g=m=>`
  ${m.registerUniform("input_size","u32").registerUniform("size_in_split_axis","u32",u.length).declareVariables(o,...s)}
  ${Ed(u.length)}
  ${Cd(s)}

  ${m.mainStart()}
    ${m.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.input_size")}

    var indices = ${o.offsetToIndices("global_idx")};
    var index = ${o.indicesGet("indices",a)};
    let output_number = calculateOutputIndex(index);
    if (output_number != 0) {
      index -= ${re("uniforms.size_in_split_axis","output_number - 1u",u.length)};
      ${o.indicesSet("indices",a,"index")};
    }
    writeBufferData(output_number, indices, global_idx);
  }`;return{name:"Split",shaderCache:{hint:t.cacheKey,inputDependencies:["rank"]},getShaderSource:g,getRunData:()=>({outputs:d,dispatchGroup:{x:Math.ceil(n/64)},programUniforms:f})}},lm=(e,t)=>{Td(e.inputs);let r=e.inputs.length===1?t:Id(e.inputs,t);e.compute(wa(e.inputs,r),{inputs:[0]})},dm=e=>{let t=e.axis,r=e.splitSizes,n=e.numOutputs<0?r.length:e.numOutputs;if(n!==r.length)throw new Error("numOutputs and splitSizes length must be equal");return _e({axis:t,numOutputs:n,splitSizes:r})}}),zd,$n,cm,hm=V(()=>{ie(),ae(),Ae(),se(),zd=(e,t)=>{let[r,n,i,a]=e,{numHeads:s,rotaryEmbeddingDim:o}=t;if(r.dims.length!==3&&r.dims.length!==4)throw new Error(`Input 'x' is expected to have 3 or 4 dimensions, got ${r.dims.length}`);if(!R.areEqual(n.dims,[])&&!R.areEqual(n.dims,[1])&&n.dims.length!==2)throw new Error(`Input 'position_ids' is expected to have 0, 1, or 2 dimensions, got ${n.dims.length}`);if(i.dims.length!==2)throw new Error(`Input 'cos_cache' is expected to have 2 dimensions, got ${i.dims.length}`);if(a.dims.length!==2)throw new Error(`Input 'sin_cache' is expected to have 2 dimensions, got ${a.dims.length}`);if(!R.areEqual(i.dims,a.dims))throw new Error("Inputs 'cos_cache' and 'sin_cache' are expected to have the same shape");if(o>0&&s===0)throw new Error("num_heads must be provided if rotary_embedding_dim is specified");let u=r.dims[0],d=r.dims[r.dims.length-2],p=i.dims[0],c=R.sizeFromDimension(r.dims,1)/d,f=o===0?i.dims[1]*2:c/s;if(o>f)throw new Error("rotary_embedding_dim must be less than or equal to head_size");if(n.dims.length===2){if(u!==n.dims[0])throw new Error(`Input 'position_ids' dimension 0 should be of size batch_size, got ${n.dims[0]}`);if(d!==n.dims[1])throw new Error(`Input 'position_ids' dimension 1 should be of size sequence_length, got ${n.dims[1]}`)}if(d>p)throw new Error("Updating cos_cache and sin_cache in RotaryEmbedding is not currently supported");if(f/2!==i.dims[1]&&o/2!==i.dims[1])throw new Error(`Input 'cos_cache' dimension 1 should be same as head_size / 2 or rotary_embedding_dim / 2, got ${i.dims[1]}`)},$n=(e,t)=>{let{interleaved:r,numHeads:n,rotaryEmbeddingDim:i,scale:a}=t,s=e[0].dims[0],o=R.sizeFromDimension(e[0].dims,1),u=e[0].dims[e[0].dims.length-2],d=o/u,p=e[2].dims[1],c=i===0?p*2:d/n,f=new Array(s,u,d/c,c-p),g=R.computeStrides(f),m=[{type:1,data:a},{type:12,data:f},{type:12,data:g},...e[0].dims.length===3?new Array({type:12,data:[o,d,c,1]}):[],...e[0].dims.length===4?new Array({type:12,data:[o,c,u*c,1]}):[],...ne(e[0].dims,e[1].dims,e[2].dims,e[3].dims,e[0].dims)],_=v=>{let w=P("input",e[0].dataType,e[0].dims.length),$=P("position_ids",e[1].dataType,e[1].dims.length),S=P("cos_cache",e[2].dataType,e[2].dims.length),x=P("sin_cache",e[3].dataType,e[3].dims.length),I=te("output",e[0].dataType,e[0].dims.length);return v.registerUniforms([{name:"scale",type:"f32"},{name:"global_shape",type:"u32",length:f.length},{name:"global_strides",type:"u32",length:g.length},{name:"input_output_strides",type:"u32",length:g.length}]),`
        ${v.declareVariables(w,$,S,x,I)}

        ${v.mainStart(or)}
          let half_rotary_emb_dim = uniforms.${S.name}_shape[1];
          let bsnh = global_idx / uniforms.global_strides % uniforms.global_shape;
          let size = uniforms.global_shape[0] * uniforms.global_strides[0];
          ${v.guardAgainstOutOfBoundsWorkgroupSizes("size")}

          if (bsnh[3] < half_rotary_emb_dim) {
            let position_ids_idx =
                ${$.broadcastedIndicesToOffset("bsnh.xy",te("",$.type.tensor,2))};
            let position_id =
                u32(${$.getByOffset("position_ids_idx")}) + select(0, bsnh[1], position_ids_idx == 0);
            let i = dot(bsnh, uniforms.input_output_strides) + select(0, bsnh[3], ${r});
            let j = i + select(half_rotary_emb_dim, 1, ${r});
            let re = ${w.getByOffset("i")} * ${S.get("position_id","bsnh[3]")} -
                ${w.getByOffset("j")} * ${x.get("position_id","bsnh[3]")};
            ${I.setByOffset("i","re")}
            let im = ${w.getByOffset("i")} * ${x.get("position_id","bsnh[3]")} +
                ${w.getByOffset("j")} * ${S.get("position_id","bsnh[3]")};
            ${I.setByOffset("j","im")}
          } else {
            let k = dot(bsnh, uniforms.input_output_strides) + half_rotary_emb_dim;
            ${I.setByOffset("k",w.getByOffset("k"))}
          }
        }`};return{name:"RotaryEmbedding",shaderCache:{hint:_e({interleaved:r}).cacheKey,inputDependencies:["rank","rank","rank","rank"]},getShaderSource:_,getRunData:()=>({outputs:[{dims:e[0].dims,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(R.size(f)/or)},programUniforms:m})}},cm=(e,t)=>{zd(e.inputs,t),e.compute($n(e.inputs,t))}}),Ad,Md,Oi,Od,fm,_b=V(()=>{Ae(),ie(),Fa(),um(),pm(),Ct(),hm(),se(),Ad=(e,t)=>{if(t.doRotary&&e.length<=7)throw new Error("cos_cache and sin_cache inputs are required if do_rotary is specified");let r=e[0],n=e[1],i=e[2],a=e[3],s=e[4];if(t.doRotary!==0&&e.length<=7)throw new Error("cos_cast and sin_cache are expected if do_rotary attribute is non-zero");if(t.localWindowSize!==-1)throw new Error("Local attention is not supported");if(t.softcap!==0)throw new Error("Softcap is not supported");if(t.rotaryInterleaved!==0)throw new Error("Rotary interleaved is not supported");if(t.smoothSoftmax)throw new Error("Smooth softmax is not supported");if(r.dims.length!==3&&r.dims.length!==5)throw new Error("Input query is expected to have 3 or 5 dimensions");let o=!1,u=r.dims[0],d=r.dims[1],p=r.dims.length===3?o?r.dims[2]/3:r.dims[2]:t.numHeads*r.dims[4],c=d,f=0,g=!n||n.dims.length===0,m=Math.floor(g?p/(t.numHeads+2*t.kvNumHeads):p/t.numHeads);g&&(p=m*t.numHeads);let _=a&&a.dims.length!==0,v=s&&s.dims.length!==0;if(_&&a.dims.length===4&&a.dims[0]===u&&a.dims[1]!==t.kvNumHeads&&a.dims[2]===t.kvNumHeads&&a.dims[3]===m)throw new Error("BSNH pastKey/pastValue is not supported");if(_&&v){if(a.dims.length!==4)throw new Error('Input "past_key" is expected to have 4 dimensions');if(s.dims.length!==4)throw new Error('Input "past_value" is expected to have 4 dimensions');f=a.dims[2]}else if(_||v)throw new Error('Input "past_key" and "past_value" shall be both present or both absent');let w=1;if(n&&n.dims.length>0){if(r.dims.length!==3)throw new Error('Input "query" is expected to have 3 dimensions when key is given');if(n.dims.length<3||n.dims.length>5)throw new Error('Input "key" is expected to have 3, 4, or 5 dimensions');if(r.dims[0]!==n.dims[0])throw new Error('Input "query" and "key" shall have same dim 0 (batch size)');if(n.dims.length===3){if(r.dims[2]%n.dims[2]!==0)throw new Error('Dimension 2 of "query" should be a multiple of "key"');c=n.dims[1]}else if(n.dims.length===5){if(n.dims[2]!==t.numHeads||n.dims[3]!==2||n.dims[4]!==m)throw new Error('Expect "key" shape (batch_size, kv_sequence_length, num_heads, 2, head_size) for packed kv');if(i)throw new Error('Expect "value" be none when "key" has packed kv format.');c=n.dims[1]}else{if(n.dims[1]!==t.numHeads||n.dims[3]!==m)throw new Error('Expect "key" shape (batch_size, num_heads, kv_sequence_length, head_size) for past_key');c=n.dims[2]}}else{if(r.dims.length!==3&&r.dims.length!==5)throw new Error('Input "query" is expected to have 3 or 5 dimensions when key is empty');if(r.dims.length===5&&(r.dims[2]!==t.numHeads||r.dims[3]!==3))throw new Error('Expect "query" shape (batch_size, kv_sequence_length, num_heads, 3, head_size) for packed kv');w=3}let $=0,S=!1,x=t.kvNumHeads?m*t.kvNumHeads:p;if(i&&i.dims.length>0){if(i.dims.length!==3&&i.dims.length!==4)throw new Error('Input "value" is expected to have 3 or 4 dimensions');if(r.dims[0]!==i.dims[0])throw new Error('Input "query" and "value" shall have same dim 0 (batch_size)');if(i.dims.length===3){if(c!==i.dims[1])throw new Error('Input "key" and "value" shall have the same dim 1 (kv_sequence_length)');x=i.dims[2]}else{if(c!==i.dims[2])throw new Error('Input "past_key" and "past_value" shall have the same dim 2 (kv_sequence_length)');x=i.dims[1]*i.dims[3],S=!0}}let I=e.length>4?e[5]:void 0;if(I){if(I.dims.length===0)throw new Error("seqlens_k must be at least 1D, got scalar.");let E=I.dims.reduce((z,k)=>z*k,1);if(E!==u)throw new Error(`seqlens_k must have batch_size (${u}) elements, got ${E}.`);for(let z=0;z<I.dims.length;z++)if(I.dims[z]!==1&&I.dims[z]!==u)throw new Error(`seqlens_k has unexpected shape. Each dimension must be 1 or batch_size (${u}), got dims[${z}] = ${I.dims[z]}.`)}return{batchSize:u,sequenceLength:d,pastSequenceLength:f,kvSequenceLength:c,totalSequenceLength:-1,maxSequenceLength:-1,inputHiddenSize:0,hiddenSize:p,vHiddenSize:x,headSize:m,vHeadSize:Math.floor(x/t.kvNumHeads),numHeads:t.numHeads,kvNumHeads:t.kvNumHeads,nReps:t.numHeads/t.kvNumHeads,pastPresentShareBuffer:!1,maskType:$,scale:t.scale,broadcastResPosBias:!1,passPastInKv:S,qkvFormat:w}},Md=_e({perm:[0,2,1,3]}),Oi=(e,t,r)=>{let n=t,i=r.kvNumHeads;return t.dims.length===3&&r.kvSequenceLength!==0&&(n=t.reshape([r.batchSize,r.kvSequenceLength,i,r.headSize]),n=e.compute(Ve(n,Md.perm),{inputs:[n],outputs:[-1]})[0]),n},Od=(e,t,r,n)=>{let i=7,a=["type","type"],s=[e*t],o=e*t,u=[{type:12,data:o},{type:12,data:t},{type:12,data:e}],d=p=>{let c=P("seq_lens",r.dataType,r.dims),f=P("total_seq_lens",n.dataType,n.dims),g=te("pos_ids",i,s),m=[{name:"output_size",type:"u32"},{name:"sequence_length",type:"u32"},{name:"batch_size",type:"u32"}];return`
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
  `};return{name:"GeneratePositionIds",shaderCache:{hint:`${e};${t}`,inputDependencies:a},getRunData:()=>({outputs:[{dims:s,dataType:i}],dispatchGroup:{x:Math.ceil(o/64)},programUniforms:u}),getShaderSource:d}},fm=(e,t)=>{let r=Ad(e.inputs,t);if(e.inputs[0].dims.length===5)throw new Error("Packed QKV is not implemented");if(e.inputs[1]?.dims.length===5)throw new Error("Packed KV is not implemented");let n=e.inputs[0],i=e.inputs[1]&&e.inputs[1].dims.length>0?e.inputs[1]:void 0,a=e.inputs[2]&&e.inputs[2].dims.length>0?e.inputs[2]:void 0,s=e.inputs[3]&&e.inputs[3].dims.length!==0?e.inputs[3]:void 0,o=e.inputs[4]&&e.inputs[4].dims.length!==0?e.inputs[4]:void 0,u=e.inputs.length>4?e.inputs[5]:void 0,d=e.inputs.length>5?e.inputs[6]:void 0,p=r.kvNumHeads?r.kvNumHeads:r.numHeads,c=_e({axis:2,numOutputs:3,splitSizes:[r.numHeads*r.headSize,p*r.headSize,p*r.headSize]}),[f,g,m]=!i&&!a?e.compute(wa([n],c),{inputs:[n],outputs:[-1,-1,-1]}):[n,i,a],_,v;if(t.doRotary){let x=e.compute(Od(r.batchSize,r.sequenceLength,u,d),{inputs:[u,d],outputs:[-1]})[0],I=e.inputs[7],E=e.inputs[8],z=_e({interleaved:t.rotaryInterleaved!==0,numHeads:r.numHeads,rotaryEmbeddingDim:0,scale:t.scale}),k=[f,x,I,E],N=[-1];_=e.compute($n(k,z),{inputs:k,outputs:N})[0],k.splice(0,1,g);let O=_e({interleaved:t.rotaryInterleaved!==0,numHeads:r.kvNumHeads,rotaryEmbeddingDim:0,scale:t.scale});v=e.compute($n(k,O),{inputs:k,outputs:N})[0]}let w=Ir(e,r.batchSize,r.numHeads,r.sequenceLength,r.headSize,t.doRotary?_:f,void 0,0),$=Oi(e,t.doRotary?v:g,r),S=Oi(e,m,r);Ar(e,w,$,S,void 0,void 0,s,o,void 0,r,u,d)}}),Ri,Rd,Nd,mm,bb=V(()=>{ie(),ae(),Ct(),se(),Ri=(e,t,r,n,i,a,s,o)=>{let u=Ce(a),d=u===1?"f32":`vec${u}f`,p=u===1?"vec2f":`mat2x${u}f`,c=i*s,f=64;c===1&&(f=256);let g=[i,s,a/u],m=[i,s,2],_=["rank","type","type"],v=[];v.push(...ne(g,m));let w=$=>{let S=P("x",t.dataType,3,u),x=P("scale",r.dataType,r.dims),I=P("bias",n.dataType,n.dims),E=te("output",1,3,2),z=[S,x,I,E];return`
  var<workgroup> workgroup_shared : array<${p}, ${f}>;
  const workgroup_size = ${f}u;
  ${$.declareVariables(...z)}
  ${$.mainStart(f)}
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
      let sum_final = ${Et("workgroup_shared[0][0]",u)} / f32(hight * ${u});
      let squared_sum_final = ${Et("workgroup_shared[0][1]",u)} / f32(hight * ${u});

      let inv_std_dev = inverseSqrt(squared_sum_final - sum_final * sum_final + f32(${o}));
      let channel_scale = inv_std_dev * f32(scale[channel]);
      let channel_shift = f32(bias[channel]) - sum_final * channel_scale;
      output[workgroup_index] = vec2f(channel_scale, channel_shift);
    }
  }`};return e.compute({name:"InstanceNormComputeChannelScaleShift",shaderCache:{hint:`${u};${o};${f}`,inputDependencies:_},getRunData:()=>({outputs:[{dims:m,dataType:1}],dispatchGroup:{x:c},programUniforms:v}),getShaderSource:w},{inputs:[t,r,n],outputs:[-1]})[0]},Rd=(e,t,r)=>{let n=t[0].dims,i=n,a=2,s=n[0],o=n[1],u=R.sizeFromDimension(n,a),d=Ce(u),p=R.size(i)/d,c=Ri(e,t[0],t[1],t[2],s,u,o,r.epsilon),f=[s,o,u/d],g=[s,o],m=["type","none"],_=v=>{let w=P("x",t[0].dataType,f.length,d),$=P("scale_shift",1,g.length,2),S=te("output",t[0].dataType,f.length,d),x=[w,$,S];return`
  ${v.registerUniform("output_size","u32").declareVariables(...x)}
  ${v.mainStart()}
  ${v.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
      let outputIndices = ${S.offsetToIndices("global_idx")};
      let batch = outputIndices[0];
      let channel = outputIndices[1];
      let scale_shift = ${$.getByIndices("vec2<u32>(batch, channel)")};
      let value = ${w.getByOffset("global_idx")} * ${S.type.value}(scale_shift.x) + ${S.type.value}(scale_shift.y);
      ${S.setByOffset("global_idx","value")};
  }`};e.compute({name:"InstanceNormalization",shaderCache:{hint:`${d}`,inputDependencies:m},getRunData:()=>({outputs:[{dims:i,dataType:t[0].dataType}],dispatchGroup:{x:Math.ceil(p/64)},programUniforms:[{type:12,data:p},...ne(f,g,f)]}),getShaderSource:_},{inputs:[t[0],c]})},Nd=(e,t,r)=>{let n=t[0].dims,i=n,a=n[0],s=n[n.length-1],o=R.sizeFromDimension(n,1)/s,u=Ce(s),d=R.size(i)/u,p=[{type:12,data:o},{type:12,data:Math.floor(s/u)}],c=["type","type"],f=!1,g=[0,n.length-1];for(let w=0;w<n.length-2;w++)f=f||n[w+1]!==1,g.push(w+1);f=f&&n[n.length-1]!==1;let m=f?e.compute(Ve(e.inputs[0],g),{inputs:[e.inputs[0]],outputs:[-1]})[0]:e.inputs[0].reshape(Array.from({length:n.length},(w,$)=>n[g[$]])),_=Ri(e,m,t[1],t[2],a,o,s,r.epsilon),v=w=>{let $=Re(t[0].dataType),S=u===1?"vec2f":`mat${u}x2f`,x=z=>{let k=z===0?"x":"y",N=u===1?"f32":`vec${u}f`;switch(u){case 1:return`${$}(${N}(scale.${k}))`;case 2:return`vec2<${$}>(${N}(scale[0].${k}, scale[1].${k}))`;case 4:return`vec4<${$}>(${N}(scale[0].${k}, scale[1].${k}, scale[2].${k}, scale[3].${k}))`;default:throw new Error(`Not supported compoents ${u}`)}},I=P("input",t[0].dataType,t[0].dims,u),E=te("output",t[0].dataType,i,u);return`
  @group(0) @binding(0) var<storage, read> input : array<${I.type.storage}>;
  @group(0) @binding(1) var<storage, read> scale_input : array<${S}>;
  @group(0) @binding(2) var<storage, read_write> output : array<${E.type.storage}>;
  struct Uniforms {H: u32, C : u32};
  @group(0) @binding(3) var<uniform> uniforms: Uniforms;

  ${w.mainStart()}
    let current_image_number = global_idx / (uniforms.C * uniforms.H);
    let current_channel_number = global_idx % uniforms.C;

    let scale_offset = current_image_number * uniforms.C + current_channel_number;
    let scale = scale_input[scale_offset];
    output[global_idx] = fma(input[global_idx], ${x(0)}, ${x(1)});
  }`};e.compute({name:"InstanceNormalizationNHWC",shaderCache:{hint:`${u}`,inputDependencies:c},getRunData:()=>({outputs:[{dims:i,dataType:t[0].dataType}],dispatchGroup:{x:Math.ceil(d/64)},programUniforms:p}),getShaderSource:v},{inputs:[t[0],_]})},mm=(e,t)=>{t.format==="NHWC"?Nd(e,e.inputs,t):Rd(e,e.inputs,t)}}),Bd,Dd,gm,wb=V(()=>{ie(),ae(),se(),Bd=e=>{if(!e||e.length<2)throw new Error("layerNorm requires at least 2 inputs.")},Dd=(e,t,r)=>{let n=t.simplified,i=e[0].dims,a=e[1],s=!n&&e[2],o=i,u=R.normalizeAxis(t.axis,i.length),d=R.sizeToDimension(i,u),p=R.sizeFromDimension(i,u),c=R.size(a.dims),f=s?R.size(s.dims):0;if(c!==p||s&&f!==p)throw new Error(`Size of X.shape()[axis:] == ${p}.
       Size of scale and bias (if provided) must match this.
       Got scale size of ${c} and bias size of ${f}`);let g=[];for(let I=0;I<i.length;++I)I<u?g.push(i[I]):g.push(1);let m=Ce(p),_=["type","type"],v=[{type:12,data:d},{type:1,data:p},{type:12,data:Math.floor(p/m)},{type:1,data:t.epsilon}];s&&_.push("type");let w=r>1,$=r>2,S=I=>{let E=Re(e[0].dataType),z=[P("x",e[0].dataType,e[0].dims,m),P("scale",a.dataType,a.dims,m)];s&&z.push(P("bias",s.dataType,s.dims,m)),z.push(te("output",e[0].dataType,o,m)),w&&z.push(te("mean_data_output",1,g)),$&&z.push(te("inv_std_output",1,g));let k=[{name:"norm_count",type:"u32"},{name:"norm_size",type:"f32"},{name:"norm_size_vectorized",type:"u32"},{name:"epsilon",type:"f32"}];return`
  ${I.registerUniforms(k).declareVariables(...z)}
  ${I.mainStart()}
    ${I.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.norm_count")}
    let offset = global_idx * uniforms.norm_size_vectorized;
    var mean_vector = ${pa("f32",m)};
    var mean_square_vector = ${pa("f32",m)};

    for (var h: u32 = 0u; h < uniforms.norm_size_vectorized; h++) {
      let value = ${ir(E,m,"x[h + offset]")};
      mean_vector += value;
      mean_square_vector += value * value;
    }
    let mean = ${Et("mean_vector",m)} / uniforms.norm_size;
    let inv_std_dev = inverseSqrt(${Et("mean_square_vector",m)} / uniforms.norm_size ${n?"":"- mean * mean"} + uniforms.epsilon);

    for (var j: u32 = 0; j < uniforms.norm_size_vectorized; j++) {
      let f32input = ${ir(E,m,"x[j + offset]")};
      let f32scale = ${ir(E,m,"scale[j]")};
      output[j + offset] = ${z[0].type.value}((f32input ${n?"":"- mean"}) * inv_std_dev * f32scale
        ${s?`+ ${ir(E,m,"bias[j]")}`:""}
      );
    }

    ${w?"mean_data_output[global_idx] = mean":""};
    ${$?"inv_std_output[global_idx] = inv_std_dev":""};
  }`},x=[{dims:o,dataType:e[0].dataType}];return w&&x.push({dims:g,dataType:1}),$&&x.push({dims:g,dataType:1}),{name:"LayerNormalization",shaderCache:{hint:`${m};${r};${n}`,inputDependencies:_},getRunData:()=>({outputs:x,dispatchGroup:{x:Math.ceil(d/64)},programUniforms:v}),getShaderSource:S}},gm=(e,t)=>{Bd(e.inputs),e.compute(Dd(e.inputs,t,e.outputCount))}}),Pd,ym,$b=V(()=>{ae(),Ka(),Xa(),Pd=e=>{if(!e||e.length!==2)throw new Error("MatMul requires 2 inputs.");if(e[0].dims[e[0].dims.length-1]!==e[1].dims[e[1].dims.length-2])throw new Error("shared dimension does not match.")},ym=e=>{Pd(e.inputs);let t=sr.calcShape(e.inputs[0].dims,e.inputs[1].dims,!0);if(!t)throw new Error("Can't use matmul on the given tensors");let r=t[t.length-1],n=e.inputs[0].dims[e.inputs[0].dims.length-1];if(r<8&&n<8)e.compute(ja(e.inputs,{activation:""},t));else{let i=t[t.length-2],a=R.size(e.inputs[0].dims.slice(0,-2)),s=R.size(e.inputs[1].dims.slice(0,-2));if(a!==1&&i===1&&s===1){let o=e.inputs[0].reshape([1,a,n]),u=e.inputs[1].reshape([1,n,r]),d=[1,a,r],p=[o,u];e.compute(wn(p,{activation:""},t,d),{inputs:p})}else e.compute(wn(e.inputs,{activation:""},t))}}}),Ud,Ld,qd,_m,bm,vb=V(()=>{ie(),ae(),Ae(),se(),Ud=(e,t)=>{if(e.length<3||e.length>4)throw new Error("MatMulNBits requires 3 or 4 inputs");let r=e[0],n=r.dims.length;if(r.dims[n-1]!==t.k)throw new Error("The last dim of input shape does not match the k value");let i=Math.floor((t.k+t.blockSize-1)/t.blockSize),a=t.blockSize/8*t.bits,s=e[1];if(!R.areEqual(s.dims,[t.n,i,a]))throw new Error("The second inputs must be 3D tensor with shape N X nBlocksPerCol X blobSize");let o=e[2].dims;if(R.size(o)!==t.n*i)throw new Error("scales input size error.");if(e.length===4){let u=e[3].dims,d=t.n*(t.bits===8?i:Math.floor((i*t.bits+7)/8));if(R.size(u)!==d)throw new Error("zeroPoints input size error.")}},Ld=(e,t)=>{let r=e[0].dims,n=r.length,i=r[n-2],a=t.k,s=t.n,o=r.slice(0,n-2),u=R.size(o),d=e[1].dims[2]/4,p=e[0].dataType,c=Ce(t.k),f=Ce(d),g=Ce(s),m=o.concat([i,s]),_=i>1&&s/g%2===0?2:1,v=R.size(m)/g/_,w=64,$=[],S=[u,i,a/c],x=R.convertShape(e[1].dims).slice();x.splice(-1,1,d/f),$.push(...ne(S)),$.push(...ne(x)),$.push(...ne(e[2].dims)),e.length===4&&$.push(...ne(R.convertShape(e[3].dims)));let I=[u,i,s/g];$.push(...ne(I));let E=z=>{let k=S.length,N=P("a",e[0].dataType,k,c),O=P("b",12,x.length,f),F=P("scales",e[2].dataType,e[2].dims.length),q=[N,O,F],H=e.length===4?P("zero_points",12,e[3].dims.length):void 0;H&&q.push(H);let M=I.length,B=te("output",e[0].dataType,M,g),G=Re(e[0].dataType),J=(()=>{switch(c){case 1:return`array<${G}, 8>`;case 2:return`mat4x2<${G}>`;case 4:return`mat2x4<${G}>`;default:throw new Error(`${c}-component is not supported.`)}})(),Y=Math.floor(32/t.bits),L=Math.floor(Y/8),X=()=>{let Z="";for(let K=0;K<L;K++){let xe=K*t.bits*4,Se=xe+t.bits;Z+=`
          // reuse a data (pass ${K})
            var input_offset${K>0?K:""} = ${K===0?N.indicesToOffset(`${N.type.indices}(batch, row, word_offset)`):"input_offset"};
            var a_data${K>0?K:""}: ${J};
            for (var j${K>0?K:""}: u32 = 0; j${K>0?K:""} < ${8/c}; j${K>0?K:""}++) {
              a_data${K>0?K:""}[j${K>0?K:""}] = ${N.getByOffset(`input_offset${K>0?K:""}`)};
              input_offset${K>0?K:""}++;
            }
          `;for(let W=0;W<g*_;W++)Z+=`
            b_value = ${f===1?`b${W}_data`:`b${W}_data[i]`};
            ${t.bits===2?`{
              let half_word = b_value >> ${K*16}u;
              let byte_lo = half_word & 0xFFu;
              let byte_hi = (half_word >> 8u) & 0xFFu;
              let spread_word = (byte_lo & 0xFu) | ((byte_lo >> 4u) << 8u) | ((byte_hi & 0xFu) << 16u) | ((byte_hi >> 4u) << 24u);
              b_value_lower = unpack4xU8(spread_word & b_mask);
              b_value_upper = unpack4xU8((spread_word >> 2u) & b_mask);
            }`:`b_value_lower = unpack4xU8((b_value >> ${xe}u) & b_mask);
            b_value_upper = unpack4xU8((b_value >> ${Se}u) & b_mask);`}
            b_quantized_values = ${J}(${Array.from({length:4},(pe,me)=>`${G}(b_value_lower[${me}]), ${G}(b_value_upper[${me}])`).join(", ")});
            b_dequantized_values = ${c===1?`${J}(${Array.from({length:8},(pe,me)=>`(b_quantized_values[${me}] - ${H?`zero_point${W}`:"zero_point"}) * scale${W}`).join(", ")});`:`(b_quantized_values - ${J}(${Array(8).fill(`${H?`zero_point${W}`:"zero_point"}`).join(",")})) * scale${W};`};
            workgroup_shared[local_id.x * ${_} + ${Math.floor(W/g)}]${g>1?`[${W%g}]`:""} += ${Array.from({length:8/c},(pe,me)=>`${c===1?`a_data${K>0?K:""}[${me}] * b_dequantized_values[${me}]`:`dot(a_data${K>0?K:""}[${me}], b_dequantized_values[${me}])`}`).join(" + ")};
          `}return Z},U=()=>{let Z=`
            var col_index = col * ${g};
            ${H?`
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
            `;for(let K=0;K<g*_;K++)Z+=`
            let scale${K} = ${F.getByOffset("col_index * nBlocksPerCol + block")};
            ${H?`
            zero_point_byte_count = col_index * zero_point_bytes_per_col + (block / zero_point_values_per_byte);
            zero_point_word_index = zero_point_byte_count >> 0x2u;
            zero_point_byte_offset = zero_point_byte_count & 0x3u;
            zero_point_bits_offset = (zero_point_byte_offset << 3) + (zero_point_sub_offset * ${t.bits}u);
            zero_point_word = ${H.getByOffset("zero_point_word_index")} >> zero_point_bits_offset;
            let zero_point${K} = ${G}((zero_point_word) & ${t.bits===2?"0x3u":"0xFu"});`:""}
            col_index += 1;`;return Z},ee=()=>{let Z=`col_index = col * ${g};`;for(let K=0;K<g*_;K++)Z+=`
            let b${K}_data = ${O.getByIndices(`${O.type.indices}(col_index, block, word)`)};
            col_index += 1;`;return Z+=`
            var b_value: u32;
            let b_mask: u32 = ${t.bits===2?"0x03030303u":"0x0F0F0F0Fu"};
            var b_value_lower: vec4<u32>;
            var b_value_upper: vec4<u32>;
            var b_quantized_values: ${J};
            var b_dequantized_values: ${J};`,Z};return`
        var<workgroup> workgroup_shared: array<${B.type.value}, ${_*w}>;
        ${z.declareVariables(...q,B)}
        ${z.mainStart([w,1,1])}
          let output_indices = ${B.offsetToIndices(`(global_idx / ${w}) * ${_}`)};
          let col = output_indices[2];
          let row = output_indices[1];
          let batch = output_indices[0];
          let nBlocksPerCol = uniforms.b_shape[1];

          for (var block = local_id.x; block < nBlocksPerCol; block += ${w}) {
            //process one block
            var word_offset: u32 = block * ${t.blockSize/c};
            ${U()}
            for (var word: u32 = 0; word < ${d}; word += ${f}) {
              ${ee()}
              for (var i: u32 = 0; i < ${f}; i++) {
                ${X()}
                word_offset += ${Y/c};
              }
            }
          }
          workgroupBarrier();

          if (local_id.x < ${_}) {
            var output_value: ${B.type.value} = ${B.type.value}(0);
            var workgroup_shared_offset: u32 = local_id.x;
            for (var b: u32 = 0u; b < ${w}u; b++) {
              output_value += workgroup_shared[workgroup_shared_offset];
              workgroup_shared_offset += ${_};
            }
            ${B.setByIndices(`${B.type.indices}(batch, row, col + local_id.x)`,"output_value")};
          }
        }`};return{name:"MatMulNBits",shaderCache:{hint:`${t.blockSize};${t.bits};${c};${f};${g};${_};${w}`,inputDependencies:Array(e.length).fill("rank")},getRunData:()=>({outputs:[{dims:m,dataType:p}],dispatchGroup:{x:v},programUniforms:$}),getShaderSource:E}},qd=(e,t)=>{let r=e[0].dims,n=r.length,i=r[n-2],a=t.k,s=t.n,o=r.slice(0,n-2),u=R.size(o),d=e[1].dims[2]/4,p=e[0].dataType,c=Ce(t.k),f=Ce(d),g=o.concat([i,s]),m=128,_=s%8===0?8:s%4===0?4:1,v=m/_,w=Math.floor(32/t.bits),$=v*f*w,S=$/c,x=$/t.blockSize,I=R.size(g)/_,E=[],z=[u,i,a/c],k=R.convertShape(e[1].dims).slice();k.splice(-1,1,d/f),E.push(...ne(z)),E.push(...ne(k)),E.push(...ne(e[2].dims)),e.length===4&&E.push(...ne(R.convertShape(e[3].dims)));let N=[u,i,s];E.push(...ne(N));let O=F=>{let q=z.length,H=P("a",e[0].dataType,q,c),M=P("b",12,k.length,f),B=P("scales",e[2].dataType,e[2].dims.length),G=[H,M,B],J=e.length===4?P("zero_points",12,e[3].dims.length):void 0;J&&G.push(J);let Y=N.length,L=te("output",e[0].dataType,Y),X=Re(e[0].dataType),U=()=>{switch(c){case 1:return`
          let a_data0 = vec4<${X}>(sub_a[word_offset], sub_a[word_offset + 1], sub_a[word_offset + 2], sub_a[word_offset + 3]);
          let a_data1 = vec4<${X}>(sub_a[word_offset + 4], sub_a[word_offset + 5], sub_a[word_offset + 6], sub_a[word_offset + 7]);`;case 2:return`
          let a_data0 = vec4<${X}>(sub_a[word_offset], sub_a[word_offset + 1]);
          let a_data1 = vec4<${X}>(sub_a[word_offset + 2], sub_a[word_offset + 3]);`;case 4:return`
          let a_data0 = sub_a[word_offset];
          let a_data1 = sub_a[word_offset + 1];`;default:throw new Error(`${c}-component is not supported.`)}};return`
        var<workgroup> sub_a: array<${H.type.value}, ${S}>;
        var<workgroup> inter_results: array<array<${L.type.value}, ${v}>, ${_}>;
        ${F.declareVariables(...G,L)}
        ${F.mainStart([v,_,1])}
          let output_indices = ${L.offsetToIndices(`workgroup_index * ${_}`)};
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
                sub_a[a_offset] = ${H.getByIndices(`${H.type.indices}(batch, row, a_col)`)};
              } else {
                sub_a[a_offset] = ${H.type.value}(0);
              }
            }
            workgroupBarrier();

            // each thread process one block
            let b_row = col + local_id.y;
            let block = tile * ${x} + local_id.x;
            ${J?`
            let zero_point_values_per_byte: u32 = ${Math.floor(8/t.bits)}u;
            let zero_point_bytes_per_col = (n_blocks_per_col + zero_point_values_per_byte - 1u) / zero_point_values_per_byte;
            let zero_point_byte_count = b_row * zero_point_bytes_per_col + (block / zero_point_values_per_byte);
            let zero_point_word_index = zero_point_byte_count >> 0x2u;
            let zero_point_byte_offset = zero_point_byte_count & 0x3u;
            let zero_point_sub_offset: u32 = block % zero_point_values_per_byte;
            let zero_point_bits_offset = (zero_point_byte_offset << 3) + (zero_point_sub_offset * ${t.bits}u);
            let zero_point_word = ${J.getByOffset("zero_point_word_index")} >> zero_point_bits_offset;
            let zero_point = ${X}((zero_point_word) & ${t.bits===2?"0x3u":"0xFu"});`:`
            // The default zero point is ${Math.pow(2,t.bits-1)} for unsigned ${t.bits}-bit quantization.
            let zero_point = ${X}(${Math.pow(2,t.bits-1).toFixed(1)});`}
            let scale = ${B.getByOffset("b_row * n_blocks_per_col + block")};
            let b_data = ${M.getByIndices(`${M.type.indices}(b_row, block, 0)`)};
            var word_offset = local_id.x * ${t.blockSize/c};
            for (var i: u32 = 0; i < ${f}; i++) {
              let b_value = ${f===1?"b_data":"b_data[i]"};
              ${(()=>{let ee=Math.floor(w/8),Z="";for(let K=0;K<ee;K++){let xe=K*t.bits*4,Se=xe+t.bits;Z+=`
              ${U()}
              {${t.bits===2?`
                let half_word = b_value >> ${K*16}u;
                let byte_lo = half_word & 0xFFu;
                let byte_hi = (half_word >> 8u) & 0xFFu;
                let spread_word = (byte_lo & 0xFu) | ((byte_lo >> 4u) << 8u) | ((byte_hi & 0xFu) << 16u) | ((byte_hi >> 4u) << 24u);
                let b_value_lower = unpack4xU8(spread_word & 0x03030303u);
                let b_value_upper = unpack4xU8((spread_word >> 2u) & 0x03030303u);`:`
                let b_value_lower = unpack4xU8((b_value >> ${xe}u) & 0x0F0F0F0Fu);
                let b_value_upper = unpack4xU8((b_value >> ${Se}u) & 0x0F0F0F0Fu);`}
                let b_quantized_values = mat2x4<${X}>(${Array.from({length:4},(W,pe)=>`${X}(b_value_lower[${pe}]), ${X}(b_value_upper[${pe}])`).join(", ")});
                let b_dequantized_values = (b_quantized_values - mat2x4<${X}>(${Array(8).fill("zero_point").join(",")})) * scale;
                inter_results[local_id.y][local_id.x] += ${Array.from({length:2},(W,pe)=>`${`dot(a_data${pe}, b_dequantized_values[${pe}])`}`).join(" + ")};
              }
              word_offset += ${8/c};`}return Z})()}
            }
            workgroupBarrier();
          }

          if (local_idx < ${_}) {
            var output_value: ${L.type.value} = ${L.type.value}(0);
            for (var b = 0u; b < ${v}; b++) {
              output_value += inter_results[local_idx][b];
            }
            if (col + local_idx < uniforms.output_shape[2])
            {
              ${L.setByIndices(`${L.type.indices}(batch, row, col + local_idx)`,"output_value")}
            }
          }
        }`};return{name:"BlockwiseMatMulNBits32",shaderCache:{hint:`${t.blockSize};${c};${f};${v};${_}`,inputDependencies:Array(e.length).fill("rank")},getRunData:()=>({outputs:[{dims:g,dataType:p}],dispatchGroup:{x:I},programUniforms:E}),getShaderSource:O}},_m=(e,t)=>{Ud(e.inputs,t),t.blockSize===32&&e.adapterInfo.isVendor("intel")&&e.adapterInfo.isArchitecture("gen-12lp")?e.compute(qd(e.inputs,t)):e.compute(Ld(e.inputs,t))},bm=e=>_e(e)}),Wd,Fd,Gd,Vd,Hd,jd,Kd,Xd,wm,xb=V(()=>{ie(),ae(),se(),Wd=e=>{if(!e||e.length<1)throw new Error("Too few inputs");if(e[0].dataType!==1&&e[0].dataType!==10)throw new Error("Input type must be float or float16.");if(e.length>=2){let t=e[0].dims.length*2===e[1].dims[0];if(e.length===4&&(t=e[3].dims[0]*2===e[1].dims[0]),!t)throw new Error("The pads should be a 1D tensor of shape [2 * input_rank] or [2 * num_axes].")}},Fd=(e,t,r)=>{let n="";for(let i=t-1;i>=0;--i)n+=`
            k = i32(${e.indicesGet("indices",i)}) - ${re("uniforms.pads",i,r)};
            if (k < 0) {
              break;
            }
            if (k >= i32(${re("uniforms.x_shape",i,t)})) {
              break;
            }
            offset += k * i32(${re("uniforms.x_strides",i,t)});
        `;return`
          value = ${e.type.value}(uniforms.constant_value);
          for (var i = 0; i < 1; i++) {
            var offset = 0;
            var k = 0;
            ${n}
            value = x[offset];
          }
      `},Gd=(e,t,r)=>{let n="";for(let i=t-1;i>=0;--i)n+=`
                k = i32(${e.indicesGet("indices",i)}) - ${re("uniforms.pads",i,r)};
                if (k < 0) {
                  k = -k;
                }
                {
                  let _2n_1 = 2 * (i32(${re("uniforms.x_shape",i,t)}) - 1);
                  k = k % _2n_1;
                  if(k >= i32(${re("uniforms.x_shape",i,t)})) {
                    k = _2n_1 - k;
                  }
                }
                offset += k * i32(${re("uniforms.x_strides",i,t)});
            `;return`
              var offset = 0;
              var k = 0;
              ${n}
              value = x[offset];
          `},Vd=(e,t,r)=>{let n="";for(let i=t-1;i>=0;--i)n+=`
                k = i32(${e.indicesGet("indices",i)}) - ${re("uniforms.pads",i,r)};
                if (k < 0) {
                  k = 0;
                }
                if (k >= i32(${re("uniforms.x_shape",i,t)})) {
                  k = i32(${re("uniforms.x_shape",i,t)}) - 1;
                }
                offset += k * i32(${re("uniforms.x_strides",i,t)});
            `;return`
              var offset = 0;
              var k = 0;
              ${n}
              value = x[offset];
          `},Hd=(e,t,r)=>{let n="";for(let i=t-1;i>=0;--i)n+=`
                k = i32(${e.indicesGet("indices",i)}) - ${re("uniforms.pads",i,r)};
                if (k < 0)  {
                  k += i32(${re("uniforms.x_shape",i,t)}]);
                }
                if (k >= i32(${re("uniforms.x_shape",i,t)})) {
                  k -= i32(${re("uniforms.x_shape",i,t)});
                }
                offset += k * i32(${re("uniforms.x_strides",i,t)});
            `;return`
              var offset = 0;
              var k = 0;
              ${n}
              value = x[offset];
          `},jd=(e,t,r)=>{switch(r.mode){case 0:return Fd(e,t,r.pads.length);case 1:return Gd(e,t,r.pads.length);case 2:return Vd(e,t,r.pads.length);case 3:return Hd(e,t,r.pads.length);default:throw new Error("Invalid mode")}},Kd=(e,t)=>{let r=R.padShape(e[0].dims.slice(),t.pads),n=e[0].dims,i=R.size(r),a=[{type:12,data:i},{type:6,data:t.pads}],s=e.length>=3&&e[2].data;t.mode===0&&a.push({type:s?e[2].dataType:1,data:t.value}),a.push(...ne(e[0].dims,r));let o=["rank"],u=d=>{let p=te("output",e[0].dataType,r.length),c=P("x",e[0].dataType,n.length),f=c.type.value,g=jd(p,n.length,t),m=[{name:"output_size",type:"u32"},{name:"pads",type:"i32",length:t.pads.length}];return t.mode===0&&m.push({name:"constant_value",type:s?f:"f32"}),`
            ${d.registerUniforms(m).declareVariables(c,p)}
            ${d.mainStart()}
            ${d.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}

            let indices = ${p.offsetToIndices("global_idx")};

            var value = ${f}(0);
            ${g}
            output[global_idx] = value;
        }`};return{name:"Pad",shaderCache:{hint:`${t.mode}${s}`,inputDependencies:o},getRunData:()=>({outputs:[{dims:r,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(R.size(r)/64)},programUniforms:a}),getShaderSource:u}},Xd=(e,t)=>{if(e.length>1){let r=e[1].getBigInt64Array(),n=e.length>=3&&e[2].data?e[2].dataType===10?e[2].getUint16Array()[0]:e[2].getFloat32Array()[0]:0,i=e[0].dims.length,a=new Int32Array(2*i).fill(0);if(e.length>=4){let o=e[3].getBigInt64Array();for(let u=0;u<o.length;u++)a[Number(o[u])]=Number(r[u]),a[Number(o[u])+i]=Number(r[u+o.length])}else r.forEach((o,u)=>a[Number(u)]=Number(o));let s=[];return a.forEach(o=>s.push(o)),{mode:t.mode,value:n,pads:s}}else return t},wm=(e,t)=>{Wd(e.inputs);let r=Xd(e.inputs,t);e.compute(Kd(e.inputs,r),{inputs:[0]})}}),br,Ni,Bi,Di,Pi,Zd,Yd,Ui,Li,$m,vm,qi,xm,Sm,Wi,km,Tm,Im,Em,Sb=V(()=>{Xe(),ie(),ae(),se(),br=e=>{if($e.webgpu.validateInputContent&&(!e||e.length!==1))throw new Error("Pool ops requires 1 input.")},Ni=(e,t,r)=>{let n=t.format==="NHWC",i=e.dims.slice();n&&i.splice(1,0,i.pop());let a=Object.hasOwnProperty.call(t,"dilations"),s=t.kernelShape.slice(),o=t.strides.slice(),u=a?t.dilations.slice():[],d=t.pads.slice();_n.adjustPoolAttributes(r,i,s,o,u,d);let p=_n.computePoolOutputShape(r,i,o,u,s,d,t.autoPad),c=Object.assign({},t);a?Object.assign(c,{kernelShape:s,strides:o,pads:d,dilations:u,cacheKey:t.cacheKey}):Object.assign(c,{kernelShape:s,strides:o,pads:d,cacheKey:t.cacheKey});let f=p.slice();return f.push(f.splice(1,1)[0]),[c,n?f:p]},Bi=(e,t)=>{let r=t.format==="NHWC",n=R.size(e),i=R.size(t.kernelShape),a=[{type:12,data:n},{type:12,data:i}],s=[{name:"outputSize",type:"u32"},{name:"kernelSize",type:"u32"}];if(t.kernelShape.length<=2){let o=t.kernelShape[t.kernelShape.length-1],u=t.strides[t.strides.length-1],d=t.pads[t.pads.length/2-1],p=t.pads[t.pads.length-1],c=!!(d+p);a.push({type:12,data:o},{type:12,data:u},{type:12,data:d},{type:12,data:p}),s.push({name:"kw",type:"u32"},{name:"sw",type:"u32"},{name:"pwStart",type:"u32"},{name:"pwEnd",type:"u32"});let f=!1;if(t.kernelShape.length===2){let g=t.kernelShape[t.kernelShape.length-2],m=t.strides[t.strides.length-2],_=t.pads[t.pads.length/2-2],v=t.pads[t.pads.length-2];f=!!(_+v),a.push({type:12,data:g},{type:12,data:m},{type:12,data:_},{type:12,data:v}),s.push({name:"kh",type:"u32"},{name:"sh",type:"u32"},{name:"phStart",type:"u32"},{name:"phEnd",type:"u32"})}return[a,s,!0,c,f]}else{if(r)throw new Error("Pooling with kernelShape.length > 2 is not supported for NHWC format.");let o=R.computeStrides(t.kernelShape);a.push({type:12,data:o},{type:12,data:t.pads},{type:12,data:t.strides}),s.push({name:"kernelStrides",type:"u32",length:o.length},{name:"pads",type:"u32",length:t.pads.length},{name:"strides",type:"u32",length:t.strides.length});let u=t.pads.reduce((d,p)=>d+p);return[a,s,!!u,!1,!1]}},Di=(e,t,r,n,i,a,s,o,u,d,p,c)=>{let f=i.format==="NHWC",g=t.type.value,m=te("output",t.type.tensor,n);if(i.kernelShape.length<=2){let _="",v="",w="",$=r-(f?2:1);if(p?_=`
                for (var i: u32 = 0u; i < uniforms.kw; i++) {
                  xIndices[${$}] = indices[${$}] * uniforms.sw - uniforms.pwStart + i;
                  if (xIndices[${$}] < 0 || xIndices[${$}]
                      >= uniforms.x_shape[${$}]) {
                    pad++;
                    continue;
                  }
                  let x_val = x[${t.indicesToOffset("xIndices")}];
                  ${a}
                }`:_=`
                for (var i: u32 = 0u; i < uniforms.kw; i++) {
                  xIndices[${$}] = indices[${$}] * uniforms.sw - uniforms.pwStart + i;
                  let x_val = x[${t.indicesToOffset("xIndices")}];
                  ${a}
                }`,i.kernelShape.length===2){let S=r-(f?3:2);c?v=`
                for (var j: u32 = 0u; j < uniforms.kh; j++) {
                  xIndices[${S}] = indices[${S}] * uniforms.sh - uniforms.phStart + j;
                  if (xIndices[${S}] < 0 || xIndices[${S}] >= uniforms.x_shape[${S}]) {
                    pad += i32(uniforms.kw);
                    continue;
                  }
              `:v=`
                for (var j: u32 = 0u; j < uniforms.kh; j++) {
                  xIndices[${S}] = indices[${S}] * uniforms.sh - uniforms.phStart + j;
                `,w=`
              }
            `}return`
            ${e.registerUniforms(u).declareVariables(t,m)}

            ${e.mainStart()}
              ${e.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}

              let indices = ${m.offsetToIndices("global_idx")};
              var xIndices = ${m.offsetToIndices("global_idx")};

              var value = ${g}(${o});
              var pad = 0;
              ${v}
              ${_}
              ${w}
              ${s}

              output[global_idx] = value;
            }`}else{if(f)throw new Error("Pooling with kernelShape.length > 2 is not supported for NHWC format.");let _=i.kernelShape.length,v=i.pads.length,w="";return d?w=`
                if (xIndices[j] >= uniforms.x_shape[j]) {
                  pad++;
                  isPad = true;
                  break;
                }
              }
              if (!isPad) {
                let x_val = x[${t.indicesToOffset("xIndices")}];
                ${a}
              }`:w=`
              }
              let x_val = x[${t.indicesToOffset("xIndices")}];
              ${a}
            `,`
            ${e.registerUniforms(u).declareVariables(t,m)}

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
                  ${w}
              }
              ${s}

              output[global_idx] = value;
            }`}},Pi=e=>`${e.format};${e.ceilMode};${e.autoPad};${e.kernelShape.length}`,Zd=e=>`${Pi(e)};${e.countIncludePad}`,Yd=e=>`${Pi(e)};${e.storageOrder};${e.dilations}`,Ui=e=>({format:e.format,autoPad:["NOTSET","VALID","SAME_UPPER","SAME_LOWER"][e.auto_pad],ceilMode:e.ceil_mode,kernelShape:e.kernel_shape,strides:e.strides,pads:e.pads}),Li=(e,t,r,n)=>{let[i,a]=Ni(t,n,r),s=P("x",t.dataType,t.dims.length),o=s.type.value,u="value += x_val;",d="";i.countIncludePad?d+=`value /= ${o}(uniforms.kernelSize);`:d+=`value /= ${o}(i32(uniforms.kernelSize) - pad);`;let[p,c,f,g,m]=Bi(a,i);p.push(...ne(t.dims,a));let _=["rank"];return{name:e,shaderCache:{hint:`${n.cacheKey};${f};${g};${m}`,inputDependencies:_},getRunData:()=>({outputs:[{dims:a,dataType:t.dataType}],dispatchGroup:{x:Math.ceil(R.size(a)/64)},programUniforms:p}),getShaderSource:v=>Di(v,s,t.dims.length,a.length,i,u,d,0,c,f,g,m)}},$m=e=>{let t=e.count_include_pad!==0,r=Ui(e);if(r.ceilMode!==0)throw new Error("using ceil() in shape computation is not yet supported for AveragePool");let n={countIncludePad:t,...r,cacheKey:""};return{...n,cacheKey:Zd(n)}},vm=(e,t)=>{br(e.inputs),e.compute(Li("AveragePool",e.inputs[0],!1,t))},qi={autoPad:"",ceilMode:0,countIncludePad:!1,kernelShape:[],strides:[],pads:[],storageOrder:0,dilations:[]},xm=e=>{let t=e.format;return{format:t,...qi,cacheKey:t}},Sm=(e,t)=>{br(e.inputs),e.compute(Li("GlobalAveragePool",e.inputs[0],!0,t))},Wi=(e,t,r,n)=>{let[i,a]=Ni(t,n,r),s=`
      value = max(x_val, value);
    `,o="",u=P("x",t.dataType,t.dims.length),d=["rank"],[p,c,f,g,m]=Bi(a,i);return p.push(...ne(t.dims,a)),{name:e,shaderCache:{hint:`${n.cacheKey};${f};${g};${m}`,inputDependencies:d},getRunData:()=>({outputs:[{dims:a,dataType:t.dataType}],dispatchGroup:{x:Math.ceil(R.size(a)/64)},programUniforms:p}),getShaderSource:_=>Di(_,u,t.dims.length,a.length,i,s,o,t.dataType===10?-65504:-1e5,c,f,g,m)}},km=(e,t)=>{br(e.inputs),e.compute(Wi("MaxPool",e.inputs[0],!1,t))},Tm=e=>{let t=e.storage_order,r=e.dilations,n=Ui(e);if(t!==0)throw new Error("column major storage order is not yet supported for MaxPool");if(n.ceilMode!==0)throw new Error("using ceil() in shape computation is not yet supported for MaxPool");let i={storageOrder:t,dilations:r,...n,cacheKey:""};return{...i,cacheKey:Yd(i)}},Im=e=>{let t=e.format;return{format:t,...qi,cacheKey:t}},Em=(e,t)=>{br(e.inputs),e.compute(Wi("GlobalMaxPool",e.inputs[0],!0,t))}}),Qd,Jd,Cm,zm,kb=V(()=>{ie(),ae(),Ae(),se(),Qd=(e,t)=>{if(e.length<2||e.length>3)throw new Error("DequantizeLinear requires 2 or 3 inputs.");if(e.length===3&&e[1].dims===e[2].dims)throw new Error("x-scale and x-zero-point must have the same shape.");if(e.length===3&&e[0].dataType!==e[2].dataType)throw new Error("x and x-zero-point must have the same data type.");if(e[1].dims.length!==0&&e[1].dims.length!==1&&e[1].dims.length!==e[0].dims.length)throw new Error("scale input must be a scalar, a 1D tensor, or have the same rank as the input tensor.");if(e.length>2){if(e[0].dataType!==e[2].dataType)throw new Error("x and x-zero-point must have the same data type.");if(e[1].dims.length!==e[2].dims.length)throw new Error("scale and zero-point inputs must have the same rank.");if(!e[1].dims.map((r,n)=>r===e[2].dims[n]).reduce((r,n)=>r&&n,!0))throw new Error("scale and zero-point inputs must have the same shape.")}if(t.blockSize>0){if(e[1].dims.length===0||e[1].dims.length===1&&e[1].dims[0]===1)throw new Error("blockSize must be set only for block quantization.");if(!e[1].dims.map((i,a)=>a===t.axis||i===e[0].dims[a]).reduce((i,a)=>i&&a,!0))throw new Error("For block qunatization, scale input shape to match the input shape except for the axis");if(e[1].dims.length!==e[0].dims.length)throw new Error("For block qunatization the scale input rank must be the same as the x rank.");let r=e[0].dims[t.axis],n=e[1].dims[t.axis];if(t.blockSize<Math.ceil(r/n)||t.blockSize>Math.ceil(r/(n-1)-1))throw new Error("blockSize must be with in the range [ceil(dI / Si), ceil(dI / (Si - 1) - 1)].")}},Jd=(e,t)=>{let r=R.normalizeAxis(t.axis,e[0].dims.length),n=e[0].dataType,i=n===3,a=e[0].dims,s=e[1].dataType,o=R.size(a),u=n===3||n===2,d=u?[Math.ceil(R.size(e[0].dims)/4)]:e[0].dims,p=e[1].dims,c=e.length>2?e[2]:void 0,f=c?u?[Math.ceil(R.size(c.dims)/4)]:c.dims:void 0,g=p.length===0||p.length===1&&p[0]===1,m=g===!1&&p.length===1,_=Ce(o),v=g&&(!u||_===4),w=v?_:1,$=v&&!u?_:1,S=P("input",u?12:n,d.length,$),x=P("scale",s,p.length),I=c?P("zero_point",u?12:n,f.length):void 0,E=te("output",s,a.length,w),z=[S,x];I&&z.push(I);let k=[d,p];c&&k.push(f);let N=[{type:12,data:o/w},{type:12,data:r},{type:12,data:t.blockSize},...ne(...k,a)],O=F=>{let q=[{name:"output_size",type:"u32"},{name:"axis",type:"u32"},{name:"block_size",type:"u32"}];return`
      ${F.registerUniforms(q).declareVariables(...z,E)}
      ${F.mainStart()}
          ${F.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
          let output_indices = ${E.offsetToIndices("global_idx")};

          // Set input x
          ${u?`
            let input = ${S.getByOffset("global_idx / 4")};
            let x_vec = ${i?"unpack4xI8(input)":"unpack4xU8(input)"};
            let x_value = ${w===1?"x_vec[global_idx % 4]":"x_vec"};`:`let x_value = ${S.getByOffset("global_idx")};`};

          // Set scale input
          ${g?`let scale_value= ${x.getByOffset("0")}`:m?`
            let scale_index = ${E.indicesGet("output_indices","uniforms.axis")};
            let scale_value= ${x.getByOffset("scale_index")};`:`
            var scale_indices: ${x.type.indices} = output_indices;
            let index = ${x.indicesGet("scale_indices","uniforms.axis")} / uniforms.block_size;
            ${x.indicesSet("scale_indices","uniforms.axis","index")};
            let scale_value= ${x.getByIndices("scale_indices")};`};

          // Set zero-point input
          ${I?g?u?`
                let zero_point_input = ${I.getByOffset("0")};
                let zero_point_vec =  ${i?"unpack4xI8(zero_point_input)":"unpack4xU8(zero_point_input)"};
                let zero_point_value= zero_point_vec[0]`:`let zero_point_value = ${I.getByOffset("0")}`:m?u?`
                let zero_point_index = ${E.indicesGet("output_indices","uniforms.axis")};
                let zero_point_input = ${I.getByOffset("zero_point_index / 4")};
                let zero_point_vec =  ${i?"unpack4xI8(zero_point_input)":"unpack4xU8(zero_point_input)"};
                let zero_point_value = zero_point_vec[zero_point_index % 4]`:`
                let zero_point_index = ${E.indicesGet("output_indices","uniforms.axis")};
                let zero_point_value = ${I.getByOffset("zero_point_index")};`:u?`
                let zero_point_offset = ${x.indicesToOffset("scale_indices")};
                let zero_point_input = ${I.getByOffset("zero_point_offset / 4")};
                let zero_point_vec = ${i?"unpack4xI8(zero_point_input)":"unpack4xU8(zero_point_input)"};
                let zero_point_value = zero_point_vec[zero_point_offset % 4];`:`let zero_point_value = ${I.getByIndices("scale_indices")};`:`let zero_point_value = ${u?i?"i32":"u32":S.type.value}(0);`};
      // Compute and write output
      ${E.setByOffset("global_idx",`${E.type.value}(x_value - zero_point_value) * scale_value`)};
      }`};return{name:"DequantizeLinear",shaderCache:{hint:t.cacheKey,inputDependencies:I?["rank","rank","rank"]:["rank","rank"]},getShaderSource:O,getRunData:()=>({outputs:[{dims:a,dataType:s}],dispatchGroup:{x:Math.ceil(o/w/64),y:1,z:1},programUniforms:N})}},Cm=(e,t)=>{Qd(e.inputs,t),e.compute(Jd(e.inputs,t))},zm=e=>_e({axis:e.axis,blockSize:e.blockSize})}),ep,tp,Am,Tb=V(()=>{Xe(),ie(),se(),ep=(e,t,r)=>{let n=e===t,i=e<t&&r<0,a=e>t&&r>0;if(n||i||a)throw new Error("Range these inputs' contents are invalid.")},tp=(e,t,r,n)=>{let i=Math.abs(Math.ceil((t-e)/r)),a=[i],s=i,o=[{type:12,data:s},{type:n,data:e},{type:n,data:r},...ne(a)],u=d=>{let p=te("output",n,a.length),c=p.type.value,f=[{name:"outputSize",type:"u32"},{name:"start",type:c},{name:"delta",type:c}];return`
        ${d.registerUniforms(f).declareVariables(p)}
        ${d.mainStart()}
        ${d.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}
        output[global_idx] = uniforms.start + ${c}(global_idx) * uniforms.delta;
      }`};return{name:"Range",shaderCache:{hint:`${n}`},getShaderSource:u,getRunData:()=>({outputs:[{dims:a,dataType:n}],dispatchGroup:{x:Math.ceil(s/64)},programUniforms:o})}},Am=e=>{let t=0,r=0,n=0;e.inputs[0].dataType===6?(t=e.inputs[0].getInt32Array()[0],r=e.inputs[1].getInt32Array()[0],n=e.inputs[2].getInt32Array()[0]):e.inputs[0].dataType===1&&(t=e.inputs[0].getFloat32Array()[0],r=e.inputs[1].getFloat32Array()[0],n=e.inputs[2].getFloat32Array()[0]),$e.webgpu.validateInputContent&&ep(t,r,n),e.compute(tp(t,r,n,e.inputs[0].dataType),{inputs:[]})}}),rp,np,Mm,Om,Ib=V(()=>{ie(),ae(),Ae(),se(),rp=(e,t,r,n)=>{if(e!=="none"&&n!=="i32"&&n!=="u32"&&n!=="f32")throw new Error(`Input ${n} is not supported with reduction ${e}.`);let i=`{
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
                ${i}max(bitcast<f32>(oldValue), (${r}))${a}`;case"min":return n==="i32"||n==="u32"?`atomicMin(&${t}, bitcast<${n}>(${r}));`:`${i}min(bitcast<${n}>(oldValue), (${r}))${a}`;case"mul":return`${i}(bitcast<${n}>(oldValue) * (${r}))${a}`;default:throw new Error(`Reduction ${e} is not supported.`)}},np=(e,t)=>{let r=e[0].dims,n=e[1].dims,i=r,a=1,s=Math.ceil(R.sizeToDimension(n,n.length-1)/a),o=n[n.length-1],u=R.sizeFromDimension(r,o),d=[{type:12,data:s},{type:12,data:o},{type:12,data:u},...ne(e[1].dims,e[2].dims,i)],p=c=>{let f=P("indices",e[1].dataType,e[1].dims.length),g=P("updates",e[2].dataType,e[2].dims.length,a),m=t.reduction!=="none"&&t.reduction!==""?sh("output",e[0].dataType,i.length):te("output",e[0].dataType,i.length,a);return`
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
    ${rp(t.reduction,"output[data_offset + i]","value",m.type.value)}
  }

      }`};return{name:"ScatterND",shaderCache:{hint:`${t.cacheKey}_${t.reduction}`,inputDependencies:["rank","rank"]},getRunData:()=>({outputs:[{dims:i,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(s/64)},programUniforms:d}),getShaderSource:p}},Mm=e=>_e({reduction:e.reduction}),Om=(e,t)=>{e.compute(np(e.inputs,t),{inputs:[e.inputs[1],e.inputs[2]],outputs:[]})}}),ip,ap,sp,Fi,op,up,lp,dp,pp,cp,hp,fp,Gi,mp,gp,yp,_p,bp,Rm,Nm,Eb=V(()=>{ie(),ae(),Ae(),se(),ip=(e,t)=>{if(e.every(r=>r>0||(()=>{throw new Error("Resize requires scales input values to be positive")})),e.length>0){if(t.mode==="linear"){if(!(e.length===2||e.length===3||e.length===4&&e[0]===1&&e[1]===1||e.length===4&&e[0]===1&&e[3]===1||e.length===5&&e[0]===1&&e[1]===1))throw new Error(`For linear mode, Resize requires scales to be 2D, 3D, 4D with either two outermost or one innermost and
            one outermost scale values equal to 1, or 5D with two outermost scale values equal to 1`)}else if(t.mode==="cubic"&&!(e.length===2||e.length===4&&e[0]===1&&e[1]===1||e.length===4&&e[0]===1&&e[3]===1))throw new Error("Resize requires scales input size to be 2 or 4 for cubic mode")}},ap=(e,t,r)=>{t.every(i=>i>=0&&i<r||(()=>{throw new Error("Resize requires axes input values to be positive and less than rank")}));let n=new Array(r).fill(1);return t.forEach((i,a)=>n[i]=e[a]),n},sp=(e,t,r,n,i,a)=>{let[s,o,u]=r>10?[1,2,3]:[-1,e.length>1?1:-1,-1],d=e[0].dims.length;if(s>0&&e.length>s&&e[s].dims.length>0)e[s].getFloat32Array().forEach(p=>a.push(p));else if(t.coordinateTransformMode==="tf_crop_and_resize")throw new Error("Resize requires RoI input to be specified when coordinateTransformMode is tfCropAndResize");if(o>0&&e.length>o&&e[o].dims.length===1&&e[o].dims[0]>0){if(e[o].getFloat32Array().forEach(p=>n.push(p)),n.length!==0&&n.length!==d&&r>=18&&n.length!==t.axes.length)throw new Error("Resize requires scales input size to be same as input rank or axes size for opset 18 and up");ip(n,t),t.axes.length>0&&ap(n,t.axes,d).forEach((p,c)=>n[c]=p)}if(u>0&&e.length>u&&e[u].dims.length===1&&e[u].dims[0]>0&&(e[u].getBigInt64Array().forEach(p=>i.push(Number(p))),i.length!==0&&i.length!==d&&r>=18&&i.length!==t.axes.length))throw new Error("Resize requires sizes input size to be same as input rank or axes size for opset 18 and up");if(t.axes.length>0){if(n.length!==0&&n.length!==t.axes.length)throw new Error('Resize requires "scales" input size to be of axes rank when axes attributes is specified');if(i.length!==0&&i.length!==t.axes.length)throw new Error('Resize requires "sizes" input size to be of rank axes rank when axes attributes is specified')}if(typeof n<"u"&&typeof i<"u"&&n.length>0&&i.length>d)throw new Error("Resize requires only of scales or sizes to be specified")},Fi=(e,t,r,n)=>`
  // The whole part and the fractional part are calculated separately due to inaccuracy of floating
  // point division. As an example, f32(21) / f32(7) may evaluate to 2.99... instead of 3, causing an
  // offset-by-one error later in floor().
  let big = (${e}) * (${t});
  let whole = ${n}(big / (${r}));
  let fract = ${n}(big % (${r})) / ${n}(${r});
  return whole + fract;
`,op=(e,t)=>`fn getOriginalCoordinateFromResizedCoordinate(xResized: u32, xScale: f32, lengthResized: u32,
     lengthOriginal: u32, roiStart: f32, roiEnd: f32) -> ${t} { `+(()=>{switch(e){case"asymmetric":return`
          if (xScale < 1.0 || floor(xScale) != xScale) {
            return ${t}(xResized) / ${t}(xScale);
          } else {
            ${Fi("xResized","lengthOriginal","lengthResized",t)}
          }
        `;case"pytorch_half_pixel":return`if (lengthResized > 1) {
                    return (${t}(xResized) + 0.5) / ${t}(xScale) - 0.5;
                  } else {
                    return 0.0;
                  }`;case"tf_half_pixel_for_nn":return`return (${t}(xResized) + 0.5) / ${t}(xScale);`;case"align_corners":return`if (lengthResized == 1) {
                    return 0.0;
                  } else {
                    ${Fi("xResized","lengthOriginal - 1","lengthResized - 1",t)}
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
                  return offset + ((${t}(xResized) + 0.5) / ${t}(xScale)) - 0.5;`;case"half_pixel":return`return ((${t}(xResized) + 0.5) / ${t}(xScale)) - 0.5;`;default:throw new Error(`Coordinate transform mode ${e} is not supported`)}})()+"}",up=(e,t,r)=>`fn getNearestPixelFromOriginal(xOriginal: ${r}, isDownSample: bool) -> ${r} {`+(()=>{switch(e){case"round_prefer_ceil":return"if (fract(xOriginal) == 0.5) {             return ceil(xOriginal);           } else {             return round(xOriginal);           }";case"floor":return"return floor(xOriginal);";case"ceil":return"return ceil(xOriginal);";case"round_prefer_floor":return"if (fract(xOriginal) == 0.5) {                     return floor(xOriginal);                   } else {                     return round(xOriginal);                   }";default:if(t<11)return"if (isDownSample)                     {                       return ceil(xOriginal);                     } else {                       return xOriginal;                     }";throw new Error(`Nearest mode ${e} is not supported`)}})()+"}",lp=(e,t,r)=>{let n=new Array(r).fill(0).concat(new Array(r).fill(1)),i=e.length===0?n:e.slice();return t.length>0?(t.forEach((a,s)=>{n[a]=i[s],n[s+r]=i[t.length+s]}),n):i},dp=(e,t,r,n)=>{let i=[];if(r.length>0)if(n.length>0){if(e.forEach(a=>i.push(a)),Math.max(...n)>e.length)throw new Error("axes is out of bound");n.forEach((a,s)=>i[a]=r[s])}else r.forEach(a=>i.push(a));else{if(t.length===0)throw new Error("Resize requires either scales or sizes.");i=e.map((a,s)=>Math.round(a*t[s]))}return i},pp=(e,t,r)=>{let n=(()=>{switch(r.keepAspectRatioPolicy){case"not_larger":return r.axes.length>0?Math.min(...r.axes.map(a=>t[a]),Number.MAX_VALUE):Math.min(...t,Number.MAX_VALUE);case"not_smaller":return r.axes.length>0?Math.max(...r.axes.map(a=>t[a]),Number.MIN_VALUE):Math.max(...t,Number.MIN_VALUE);default:throw new Error(`Keep aspect ratio policy ${r.keepAspectRatioPolicy} is not supported`)}})();t.fill(1,0,t.length);let i=e.slice();return r.axes.length>0?(r.axes.forEach(a=>t[a]=n),r.axes.forEach(a=>i[a]=Math.round(e[a]*t[a]))):(t.fill(n,0,t.length),i.forEach((a,s)=>i[s]=Math.round(a*t[s]))),i},cp=(e,t,r,n,i)=>`
    fn calculateOriginalIndicesFromOutputIndices(output_indices: ${e.type.indices}) -> array<${e.type.value}, ${r.length}> {
      var original_indices: array<${e.type.value}, ${r.length}>;
      for (var i:u32 = 0; i < ${r.length}; i++) {
        var output_index = ${e.indicesGet("output_indices","i")};
        var scale = ${re("uniforms.scales","i",n)};
        var roi_low = ${re("uniforms.roi","i",i)};
        var roi_hi = ${re("uniforms.roi",`i + ${t.length}`,i)};
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
    }`,hp=(e,t,r,n,i,a,s)=>`
    fn calculateInputIndicesFromOutputIndices(output_indices: ${t.type.indices}) -> ${e.type.indices} {
      var input_indices: ${e.type.indices};
      for (var i:u32 = 0; i < ${n.length}; i++) {
        var output_index = ${t.indicesGet("output_indices","i")};
        var input_index: u32;
        var scale = ${re("uniforms.scales","i",i)};
        if (scale == 1.0) {
          input_index = output_index;
        } else {
          var roi_low = ${re("uniforms.roi","i",a)};
          var roi_hi = ${re("uniforms.roi",`i + ${r.length}`,a)};
          var input_shape_i = ${re("uniforms.input_shape","i",r.length)};
          var output_shape_i = ${re("uniforms.output_shape","i",n.length)};
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
    }`,fp=(e,t)=>`
    fn checkInputIndices(input_indices: ${e.type.indices}) -> bool {
      for (var i:u32 = 0; i < ${t.length}; i++) {
        var input_index = ${e.indicesGet("input_indices","i")};
        if (input_index < 0 || input_index >= ${re("uniforms.input_shape","i",t.length)}) {
          return false;
        }
      }
      return true;
    }`,Gi=(e,t,r,n)=>e.rank>n?`
    ${e.indicesSet("input_indices",t,"channel")};
    ${e.indicesSet("input_indices",r,"batch")};
`:"",mp=(e,t,r,n,i)=>{let[a,s,o,u]=r.length===2?[-1,0,1,-1]:[0,2,3,1],d=e.type.value;return`
    fn getInputValue(batch: u32, channel: u32, row: u32, col: u32) -> ${d} {
      var input_indices: ${e.type.indices};
      ${e.indicesSet("input_indices",s,`max(0, min(row, ${r[s]} - 1))`)};
      ${e.indicesSet("input_indices",o,`max(0, min(col, ${r[o]} - 1))`)};
      ${Gi(e,u,a,2)}
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
      var channel: u32 = ${r.length>2?`u32(originalIndices[${u}])`:"0"};
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
    }`},gp=(e,t,r,n,i,a,s,o,u,d)=>{let p=r.length===2,[c,f]=p?[0,1]:[2,3],g=e.type.value,m=_=>{let v=_===c?"row":"col";return`
      fn ${v}CubicInterpolation(input_indices: ${e.type.indices}, output_indices: ${t.type.indices}) -> ${g} {
        var output_index = ${t.indicesGet("output_indices",_)};
        var originalIdx: ${g} = getOriginalCoordinateFromResizedCoordinate(output_index, ${i[_]},
        ${n[_]}, ${r[_]}, ${a[_]}, ${a[_]} + ${r.length});
        var fractOriginalIdx: ${g} = originalIdx - floor(originalIdx);
        var coefs = getCubicInterpolationCoefs(fractOriginalIdx);

        if (${o} && (originalIdx < 0 || originalIdx > (${r[_]} - 1))) {
          return ${u};
        }
        var data: array<${g}, 4> = array<${g}, 4>(0.0, 0.0, 0.0, 0.0);
        for (var i: i32 = -1; i < 3; i++) {
          var ${v}: ${g} = originalIdx + ${g}(i);
          if (${v} < 0 || ${v} >= ${r[_]}) {
            ${d?`coefs[i + 1] = 0.0;
                        continue;`:o?`return ${u};`:`${v} = max(0, min(${v}, ${r[_]} - 1));`};
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
    `},yp=(e,t,r,n,i)=>{let[a,s,o,u,d]=r.length===3?[-1,0,1,2,-1]:[0,2,3,4,1],p=e.type.value;return`
    fn getInputValue(batch: u32, channel: u32, depth:u32, height: u32, width: u32) -> ${p} {
      var input_indices: ${e.type.indices};
      ${e.indicesSet("input_indices",s,`max(0, min(depth, ${r[s]} - 1))`)};
      ${e.indicesSet("input_indices",o,`max(0, min(height, ${r[o]} - 1))`)};
      ${e.indicesSet("input_indices",u,`max(0, min(width, ${r[u]} - 1))`)};
      ${Gi(e,d,a,3)}
      return ${e.getByIndices("input_indices")};
    }

    fn trilinearInterpolation(output_indices: ${t.type.indices}) -> ${p} {
      var originalIndices = calculateOriginalIndicesFromOutputIndices(output_indices);
      var depth:${p} = originalIndices[${s}];
      var height:${p} = originalIndices[${o}];
      var width:${p} = originalIndices[${u}];
      ${n?`if (depth < 0 || depth > (${r[s]} - 1) || height < 0 || height > (${r[o]} - 1) || width < 0 || (width > ${r[u]} - 1)) {
      return ${i};
        }`:""};

    depth = max(0, min(depth, ${r[s]} - 1));
      height = max(0, min(height, ${r[o]} - 1));
      width = max(0, min(width, ${r[u]} - 1));
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
    }`},_p=(e,t,r,n,i,a)=>{let s=e.dims,o=lp(a,t.axes,s.length),u=dp(s,n,i,t.axes),d=n.slice();n.length===0&&(d=s.map(($,S)=>$===0?1:u[S]/$),t.keepAspectRatioPolicy!=="stretch"&&(u=pp(s,d,t)));let p=te("output",e.dataType,u.length),c=P("input",e.dataType,s.length),f=R.size(u),g=s.length===u.length&&s.every(($,S)=>$===u[S]),m=t.coordinateTransformMode==="tf_crop_and_resize",_=t.extrapolationValue,v=c.type.value,w=$=>`
      ${g?"":`
      ${op(t.coordinateTransformMode,v)};
      ${(()=>{switch(t.mode){case"nearest":return`
              ${fp(c,s)};
              ${up(t.nearestMode,r,v)};
              ${hp(c,p,s,u,d.length,o.length,m)};
              `;case"linear":return`
              ${cp(p,s,u,d.length,o.length)};
              ${(()=>{if(s.length===2||s.length===4)return`${mp(c,p,s,m,_)}`;if(s.length===3||s.length===5)return`${yp(c,p,s,m,_)}`;throw Error("Linear mode only supports input dims 2, 3, 4 and 5 are supported in linear mode.")})()};
            `;case"cubic":return`
            ${(()=>{if(s.length===2||s.length===4)return`${gp(c,p,s,u,d,o,t.cubicCoeffA,m,t.extrapolationValue,t.excludeOutside)}`;throw Error("Cubic mode only supports input dims 2 and 4 are supported in linear mode.")})()};
            `;default:throw Error("Invalid resize mode")}})()};
      `}
      ${$.registerUniform("output_size","u32").registerUniform("scales","f32",d.length).registerUniform("roi","f32",o.length).declareVariables(c,p)}
      ${$.mainStart()}
        ${$.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
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
      }`;return{name:"Resize",shaderCache:{hint:`${t.cacheKey}|${r}|${d.length>0?t.mode==="cubic"?d:d.length:""}|${i.length>0?i:""}|${o.length>0?o:""}|${g}|${t.mode==="nearest"?s.length:s}`,inputDependencies:["rank"]},getShaderSource:w,getRunData:()=>({outputs:[{dims:u,dataType:e.dataType}],dispatchGroup:{x:Math.ceil(f/64)},programUniforms:[{type:12,data:f},{type:1,data:d},{type:1,data:o},...ne(s,u)]})}},bp=e=>{let t=e.customDataBuffer;return new Uint32Array(t.buffer,t.byteOffset,1)[0]},Rm=(e,t)=>{let r=[],n=[],i=[],a=bp(e);if(t.antialias!==0)throw Error("Only default value (0) for Antialias attribute is supported");sp(e.inputs,t,a,r,n,i),e.compute(_p(e.inputs[0],t,a,r,n,i),{inputs:[0]})},Nm=e=>{let t=e.antialias,r=e.axes,n=e.coordinateTransformMode,i=e.cubicCoeffA,a=e.excludeOutside!==0,s=e.extrapolationValue,o=e.keepAspectRatioPolicy,u=e.mode,d=e.nearestMode===""?"simple":e.nearestMode;return _e({antialias:t,axes:r,coordinateTransformMode:n,cubicCoeffA:i,excludeOutside:a,extrapolationValue:s,keepAspectRatioPolicy:o,mode:u,nearestMode:d})}}),wp,$p,Bm,Cb=V(()=>{ie(),ae(),se(),wp=e=>{if(!e||e.length<3)throw new Error("layerNorm requires at least 3 inputs.");let t=e[0],r=e[1],n=e[2];if(t.dataType!==r.dataType||t.dataType!==n.dataType)throw new Error("All inputs must have the same data type");if(t.dims.length!==3&&t.dims.length!==2)throw new Error("Input must be 2D or 3D");if(r.dims.length!==3&&r.dims.length!==2)throw new Error("Skip must be 2D or 3D");let i=t.dims[t.dims.length-1],a=t.dims[t.dims.length-2];if(r.dims[r.dims.length-1]!==i)throw new Error("Skip must have the same hidden size as input");if(r.dims[r.dims.length-2]!==a)throw new Error("Skip must have the same sequence length as input");if(n.dims.length!==1)throw new Error("Gamma must be 1D");if(n.dims[n.dims.length-1]!==i)throw new Error("Gamma must have the same hidden size as input");if(e.length>3){let s=e[3];if(s.dims.length!==1)throw new Error("Beta must be 1D");if(s.dims[s.dims.length-1]!==i)throw new Error("Beta must have the same hidden size as input")}if(e.length>4){let s=e[4];if(s.dims.length!==1)throw new Error("Bias must be 1D");if(s.dims[s.dims.length-1]!==i)throw new Error("Bias must have the same hidden size as input")}},$p=(e,t,r,n)=>{let i=t.simplified,a=e[0].dims,s=R.size(a),o=a,u=s,d=a.slice(-1)[0],p=n?a.slice(0,-1).concat(1):[],c=!i&&e.length>3,f=e.length>4,g=n&&r>1,m=n&&r>2,_=r>3,v=64,w=Ce(d),$=[{type:12,data:u},{type:12,data:w},{type:12,data:d},{type:1,data:t.epsilon}],S=I=>{let E=[{name:"output_size",type:"u32"},{name:"components",type:"u32"},{name:"hidden_size",type:"u32"},{name:"epsilon",type:"f32"}],z=[P("x",e[0].dataType,e[0].dims,w),P("skip",e[1].dataType,e[1].dims,w),P("gamma",e[2].dataType,e[2].dims,w)];c&&z.push(P("beta",e[3].dataType,e[3].dims,w)),f&&z.push(P("bias",e[4].dataType,e[4].dims,w)),z.push(te("output",e[0].dataType,o,w)),g&&z.push(te("mean_output",1,p)),m&&z.push(te("inv_std_output",1,p)),_&&z.push(te("input_skip_bias_sum",e[0].dataType,o,w));let k=Re(e[0].dataType),N=Re(1,w);return`

      ${I.registerUniforms(E).declareVariables(...z)}
      var<workgroup> sum_shared : array<${N}, ${v}>;
      var<workgroup> sum_squared_shared : array<${N}, ${v}>;

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
          let f32_value = ${ir(k,w,"value")};
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
        let mean = ${Et("sum",w)} / f32(uniforms.hidden_size);
        let inv_std_dev = inverseSqrt(${Et("square_sum",w)} / f32(uniforms.hidden_size) ${i?"":"- mean * mean"} + uniforms.epsilon);
        ${g?"mean_output[global_idx] = mean;":""}
        ${m?"inv_std_output[global_idx] = inv_std_dev;":""}

        for (var i: u32 = 0; i < stride; i++) {
          output[offset + i] = (output[offset + i] ${i?"":`- ${k}(mean)`}) *
            ${k}(inv_std_dev) * gamma[offset1d + i]
            ${c?"+ beta[offset1d + i]":""};
        }
      }`},x=[{dims:o,dataType:e[0].dataType}];return r>1&&x.push({dims:p,dataType:1}),r>2&&x.push({dims:p,dataType:1}),r>3&&x.push({dims:a,dataType:e[0].dataType}),{name:"SkipLayerNormalization",shaderCache:{hint:`${w};${g};${m};${_}`,inputDependencies:e.map((I,E)=>"type")},getShaderSource:S,getRunData:()=>({outputs:x,dispatchGroup:{x:Math.ceil(u/d)},programUniforms:$})}},Bm=(e,t)=>{wp(e.inputs);let r=[0];e.outputCount>1&&r.push(-3),e.outputCount>2&&r.push(-3),e.outputCount>3&&r.push(3),e.compute($p(e.inputs,t,e.outputCount,!1),{outputs:r})}}),vp,wr,xp,Vi,Sp,kp,Dm,Pm,zb=V(()=>{ie(),ae(),Ae(),se(),vp=(e,t)=>{if(!e||e.length<1)throw new Error("too few inputs");if(t.axes.length!==0){if(t.axes.length!==t.starts.length||t.axes.length!==t.ends.length)throw new Error("axes, starts and ends must have the same length")}else if(t.starts.length!==t.ends.length)throw new Error("starts and ends must have the same length");e.slice(1).forEach((r,n)=>{if(e[n+1].dataType!==6&&e[n+1].dataType!==7)throw new Error(`Input ${n} must be an array of int32 or int64`)})},wr=(e,t)=>{let r=[];if(e.length>t)if(e[t].dataType===7)e[t].getBigInt64Array().forEach(n=>r.push(Number(n)));else if(e[t].dataType===6)e[t].getInt32Array().forEach(n=>r.push(Number(n)));else throw new Error(`Input ${t} must be an array of int32 or int64`);return r},xp=(e,t)=>{if(e.length>1){let r=wr(e,1),n=wr(e,2),i=wr(e,3);return i.length===0&&(i=[...Array(e[0].dims.length).keys()]),_e({starts:r,ends:n,axes:i})}else return t},Vi=(e,t,r,n,i)=>{let a=e;return e<0&&(a+=r[n[t]]),i[t]<0?Math.max(0,Math.min(a,r[n[t]]-1)):Math.max(0,Math.min(a,r[n[t]]))},Sp=(e,t,r)=>`fn calculateInputIndices(output_indices: ${t.type.indices}) -> ${e.type.indices} {
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
      }`,kp=(e,t)=>{let r=e[0].dims,n=R.size(r),i=t.axes.length>0?R.normalizeAxes(t.axes,r.length):[...Array(r.length).keys()],a=wr(e,4);a.forEach(w=>w!==0||(()=>{throw new Error("step cannot be 0")})),a.length===0&&(a=Array(i.length).fill(1));let s=t.starts.map((w,$)=>Vi(w,$,r,i,a)),o=t.ends.map((w,$)=>Vi(w,$,r,i,a));if(i.length!==s.length||i.length!==o.length)throw new Error("start, ends and axes should have the same number of elements");if(i.length!==r.length)for(let w=0;w<r.length;++w)i.includes(w)||(s.splice(w,0,0),o.splice(w,0,r[w]),a.splice(w,0,1));let u=a.map(w=>Math.sign(w));a.forEach((w,$,S)=>{if(w<0){let x=(o[$]-s[$])/w,I=s[$],E=I+x*a[$];s[$]=E,o[$]=I,S[$]=-w}});let d=r.slice(0);i.forEach((w,$)=>{d[w]=Math.ceil((o[w]-s[w])/a[w])});let p={dims:d,dataType:e[0].dataType},c=te("output",e[0].dataType,d.length),f=P("input",e[0].dataType,e[0].dims.length),g=R.size(d),m=[{name:"outputSize",type:"u32"},{name:"starts",type:"u32",length:s.length},{name:"signs",type:"i32",length:u.length},{name:"steps",type:"u32",length:a.length}],_=[{type:12,data:g},{type:12,data:s},{type:6,data:u},{type:12,data:a},...ne(e[0].dims,d)],v=w=>`
      ${w.registerUniforms(m).declareVariables(f,c)}
        ${Sp(f,c,r)}
        ${w.mainStart()}
          ${w.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}
          let output_indices = ${c.offsetToIndices("global_idx")};
          let input_indices = calculateInputIndices(output_indices);
          ${c.setByOffset("global_idx",f.getByIndices("input_indices"))}
      }`;return{name:"Slice",shaderCache:{hint:`${u.length}_${s.length}_${a.length}`,inputDependencies:["rank"]},getShaderSource:v,getRunData:()=>({outputs:[p],dispatchGroup:{x:Math.ceil(n/64)},programUniforms:_})}},Dm=(e,t)=>{vp(e.inputs,t);let r=xp(e.inputs,t);e.compute(kp(e.inputs,r),{inputs:[0]})},Pm=e=>{let t=e.starts,r=e.ends,n=e.axes;return _e({starts:t,ends:r,axes:n})}}),Tp,Ip,Um,Lm,Ab=V(()=>{ie(),ae(),Ae(),Ct(),se(),Tp=e=>{if(!e||e.length!==1)throw new Error("Softmax op requires 1 input.")},Ip=(e,t)=>{let r=e.inputs[0],n=r.dims,i=R.size(n),a=n.length,s=R.normalizeAxis(t.axis,a),o=s<n.length-1,u,d=[];o?(d=Array.from({length:a},(z,k)=>k),d[s]=a-1,d[a-1]=s,u=e.compute(Ve(r,d),{inputs:[r],outputs:[-1]})[0]):u=r;let p=u.dims,c=p[a-1],f=i/c,g=Ce(c),m=c/g,_=64;f===1&&(_=256);let v=(z,k)=>k===4?`max(max(${z}.x, ${z}.y), max(${z}.z, ${z}.w))`:k===2?`max(${z}.x, ${z}.y)`:k===3?`max(max(${z}.x, ${z}.y), ${z}.z)`:z,w=P("x",u.dataType,u.dims,g),$=te("result",u.dataType,u.dims,g),S=w.type.value,x=Re(u.dataType)==="f32"?`var threadMax = ${S}(-3.4028234663852886e+38f);`:`var threadMax = ${S}(-65504.0h);`,I=z=>`
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
      ${z.registerUniform("packedCols","i32").declareVariables(w,$)}
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
          rowSumShared = ${S}(${Et("threadShared[0]",g)});
        }
        workgroupBarrier();

        // calculate final value for each element in the row
        for (var col = lindex; col < cols; col += wg) {
          var value = exp(getValue(row, col, row_stride) - rowMaxShared) / rowSumShared;
          // max operation protects against NaN since all values should be >=0
          value = max(value, ${S}(0.0));
          setValue(row, col, row_stride, value);
        }
      }`,E=e.compute({name:"Softmax",shaderCache:{hint:`${g};${_}`,inputDependencies:["type"]},getRunData:()=>({outputs:[{dims:p,dataType:u.dataType}],dispatchGroup:{x:f},programUniforms:[{type:6,data:m}]}),getShaderSource:I},{inputs:[u],outputs:[o?-1:0]})[0];o&&e.compute(Ve(E,d),{inputs:[E]})},Um=(e,t)=>{Tp(e.inputs),Ip(e,t)},Lm=e=>_e({axis:e.axis})}),Hi,Ep,Cp,zp,qm,Mb=V(()=>{ie(),ae(),se(),Hi=e=>Array.from(e.getBigInt64Array(),Number),Ep=e=>{if(!e||e.length!==2)throw new Error("Tile requires 2 inputs.");if(e[0].dataType!==1&&e[0].dataType!==10&&e[0].dataType!==6&&e[0].dataType!==12)throw new Error("Tile only support float, float16, int32, and uint32 data types");if(e[1].dataType!==7)throw new Error("Tile `repeats` input should be of int64 data type");if(e[1].dims.length!==1)throw new Error("Tile `repeats` input should be 1-D");if(Hi(e[1]).length!==e[0].dims.length)throw new Error("Tile `repeats` input should have same number of elements as rank of input data tensor")},Cp=(e,t)=>{let r=[];for(let n=0;n<e.length;++n)r.push(e[n]*t[n]);return r},zp=(e,t)=>{let r=e[0].dims,n=t??Hi(e[1]),i=Cp(r,n),a=R.size(i),s=e[0].dataType,o=P("input",s,r.length),u=te("output",s,i.length),d=p=>`
      const inputShape = ${o.indices(...r)};
      ${p.registerUniform("output_size","u32").declareVariables(o,u)}
      ${p.mainStart()}
      ${p.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
      let output_indices = ${u.offsetToIndices("global_idx")};
      var input_indices: ${o.type.indices};
      for (var i = 0; i < ${r.length}; i++) {
        let input_dim_i = ${o.indicesGet("uniforms.input_shape","i")};
        let input_dim_value = ${u.indicesGet("output_indices","i")}  % input_dim_i;

        ${o.indicesSet("input_indices","i","input_dim_value")}
      }
      ${u.setByOffset("global_idx",o.getByIndices("input_indices"))}
    }`;return{name:"Tile",shaderCache:{hint:`${n}`,inputDependencies:["rank"]},getRunData:()=>({outputs:[{dims:i,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(a/64)},programUniforms:[{type:12,data:a},...ne(e[0].dims,i)]}),getShaderSource:d}},qm=e=>{Ep(e.inputs),e.compute(zp(e.inputs),{inputs:[0]})}}),Ap,Mp,Wm,Ob=V(()=>{ie(),ae(),se(),Ap=(e,t,r,n,i)=>{let a=te("output_data",i,r.length,4),s=P("a_data",t[1].dataType,t[1].dims.length,4),o=P("b_data",t[2].dataType,t[2].dims.length,4),u=P("c_data",t[0].dataType,t[0].dims.length,4),d,p=(c,f,g)=>`select(${f}, ${c}, ${g})`;if(!n)d=a.setByOffset("global_idx",p(s.getByOffset("global_idx"),o.getByOffset("global_idx"),u.getByOffset("global_idx")));else{let c=(f,g,m="")=>{let _=`a_data[index_a${g}][component_a${g}]`,v=`b_data[index_b${g}][component_b${g}]`,w=`bool(c_data[index_c${g}] & (0xffu << (component_c${g} * 8)))`;return`
            let output_indices${g} = ${a.offsetToIndices(`global_idx * 4u + ${g}u`)};
            let offset_a${g} = ${s.broadcastedIndicesToOffset(`output_indices${g}`,a)};
            let offset_b${g} = ${o.broadcastedIndicesToOffset(`output_indices${g}`,a)};
            let offset_c${g} = ${u.broadcastedIndicesToOffset(`output_indices${g}`,a)};
            let index_a${g} = offset_a${g} / 4u;
            let index_b${g} = offset_b${g} / 4u;
            let index_c${g} = offset_c${g} / 4u;
            let component_a${g} = offset_a${g} % 4u;
            let component_b${g} = offset_b${g} % 4u;
            let component_c${g} = offset_c${g} % 4u;
            ${f}[${g}] = ${m}(${p(_,v,w)});
          `};i===9?d=`
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
        ${e.registerUniform("vec_size","u32").declareVariables(u,s,o,a)}
        ${e.mainStart()}
        ${e.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.vec_size")}
        ${d}
      }`},Mp=e=>{let t=e[1].dims,r=e[2].dims,n=e[0].dims,i=e[1].dataType,a=!(R.areEqual(t,r)&&R.areEqual(r,n)),s=t,o=R.size(t);if(a){let d=sr.calcShape(sr.calcShape(t,r,!1),n,!1);if(!d)throw new Error("Can't perform where op on the given tensors");s=d,o=R.size(s)}let u=Math.ceil(o/4);return{name:"Where",shaderCache:{inputDependencies:["rank","rank","rank"]},getShaderSource:d=>Ap(d,e,s,a,i),getRunData:()=>({outputs:[{dims:s,dataType:i}],dispatchGroup:{x:Math.ceil(o/64/4)},programUniforms:[{type:12,data:u},...ne(n,t,r,s)]})}},Wm=e=>{e.compute(Mp(e.inputs))}}),Fm,Rb=V(()=>{K_(),Fa(),X_(),Z_(),Y_(),Q_(),J_(),ib(),sb(),ob(),ub(),lb(),db(),pb(),cb(),hb(),fb(),mb(),gb(),yb(),_b(),bb(),wb(),$b(),vb(),um(),xb(),Sb(),kb(),Tb(),Ib(),Wa(),Eb(),hm(),Cb(),zb(),Ab(),pm(),Mb(),Ct(),Ga(),Ob(),Fm=new Map([["Abs",[Nh]],["Acos",[Bh]],["Acosh",[Dh]],["Add",[_f]],["ArgMax",[Ah,ha]],["ArgMin",[zh,ha]],["Asin",[Ph]],["Asinh",[Uh]],["Atan",[Lh]],["Atanh",[qh]],["Attention",[Mh]],["AveragePool",[vm,$m]],["BatchNormalization",[Oh]],["BiasAdd",[Rh]],["BiasSplitGelu",[yf]],["Cast",[Fh,Wh]],["Ceil",[Vh]],["Clip",[Gh]],["Concat",[Ef,Cf]],["Conv",[ba,_a]],["ConvTranspose",[Uf,Pf]],["Cos",[Hh]],["Cosh",[jh]],["CumSum",[Lf,qf]],["DepthToSpace",[Wf,Ff]],["DequantizeLinear",[Cm,zm]],["Div",[bf]],["Einsum",[Gf,Vf]],["Elu",[Kh,Tr]],["Equal",[wf]],["Erf",[Xh]],["Exp",[Zh]],["Expand",[Hf]],["FastGelu",[jf]],["Floor",[Yh]],["FusedConv",[ba,_a]],["Gather",[Xf,Kf]],["GatherElements",[tm,em]],["GatherBlockQuantized",[Qf,Jf]],["GatherND",[Zf,Yf]],["Gelu",[Qh]],["Gemm",[nm,rm]],["GlobalAveragePool",[Sm,xm]],["GlobalMaxPool",[Em,Im]],["Greater",[Sf]],["GreaterOrEqual",[Tf]],["GridSample",[im,am]],["GroupQueryAttention",[fm]],["HardSigmoid",[of,sf]],["InstanceNormalization",[mm]],["LayerNormalization",[gm]],["LeakyRelu",[Jh,Tr]],["Less",[kf]],["LessOrEqual",[If]],["Log",[mf]],["MatMul",[ym]],["MatMulNBits",[_m,bm]],["MaxPool",[km,Tm]],["Mul",[$f]],["MultiHeadAttention",[om,sm]],["Neg",[tf]],["Not",[ef]],["Pad",[wm]],["Pow",[vf]],["QuickGelu",[gf,Tr]],["Range",[Am]],["Reciprocal",[rf]],["ReduceMin",[kh]],["ReduceMean",[wh]],["ReduceMax",[Sh]],["ReduceSum",[Ih]],["ReduceProd",[Th]],["ReduceL1",[$h]],["ReduceL2",[vh]],["ReduceLogSum",[Ch]],["ReduceLogSumExp",[xh]],["ReduceSumSquare",[Eh]],["Relu",[nf]],["Resize",[Rm,Nm]],["RotaryEmbedding",[cm]],["ScatterND",[Om,Mm]],["Sigmoid",[af]],["Sin",[uf]],["Sinh",[lf]],["Slice",[Dm,Pm]],["SkipLayerNormalization",[Bm]],["Split",[lm,dm]],["Sqrt",[df]],["Softmax",[Um,Lm]],["Sub",[xf]],["Tan",[pf]],["Tanh",[cf]],["ThresholdedRelu",[ff,Tr]],["Tile",[qm]],["Transpose",[uh,lh]],["Where",[Wm]]])}),Gm,Nb=V(()=>{Xe(),yt(),se(),Gm=class{constructor(e){this.backend=e,this.repo=new Map,this.attributesBound=!1}getArtifact(e){return this.repo.get(e)}setArtifact(e,t){this.repo.set(e,t)}run(e,t,r,n,i){pt(e.programInfo.name);let a=this.backend.device,s=this.backend.getComputePassEncoder();this.backend.writeTimestamp(this.backend.pendingDispatchNumber*2);let o=[];for(let d of t)o.push({binding:o.length,resource:{buffer:d.buffer}});for(let d of r)o.push({binding:o.length,resource:{buffer:d.buffer}});i&&o.push({binding:o.length,resource:i});let u=a.createBindGroup({layout:e.computePipeline.getBindGroupLayout(0),entries:o,label:e.programInfo.name});if(this.backend.sessionStatus==="capturing"){let d={kernelId:this.backend.currentKernelId,computePipeline:e.computePipeline,bindGroup:u,dispatchGroup:n};this.backend.capturedCommandList.get(this.backend.currentSessionId).push(d)}s.setPipeline(e.computePipeline),s.setBindGroup(0,u),s.dispatchWorkgroups(...n),this.backend.writeTimestamp(this.backend.pendingDispatchNumber*2+1),this.backend.pendingDispatchNumber++,(this.backend.pendingDispatchNumber>=this.backend.maxDispatchNumber||this.backend.queryType==="at-passes")&&this.backend.endComputePass(),this.backend.pendingDispatchNumber>=this.backend.maxDispatchNumber&&this.backend.flush(),at(e.programInfo.name)}dispose(){}build(e,t){pt(e.name);let r=this.backend.device,n=[];[{feature:"shader-f16",extension:"f16"},{feature:"subgroups",extension:"subgroups"}].forEach(d=>{r.features.has(d.feature)&&n.push(`enable ${d.extension};`)});let i=oh(t,this.backend.device.limits),a=e.getShaderSource(i),s=`${n.join(`
`)}
${i.additionalImplementations}
${a}`,o=r.createShaderModule({code:s,label:e.name});fe("verbose",()=>`[WebGPU] ${e.name} shader code: ${s}`);let u=r.createComputePipeline({compute:{module:o,entryPoint:"main"},layout:"auto",label:e.name});return at(e.name),{programInfo:e,computePipeline:u,uniformVariablesInfo:i.variablesInfo}}normalizeDispatchGroupSize(e){let t=typeof e=="number"?e:e.x,r=typeof e=="number"?1:e.y||1,n=typeof e=="number"?1:e.z||1,i=this.backend.device.limits.maxComputeWorkgroupsPerDimension;if(t<=i&&r<=i&&n<=i)return[t,r,n];let a=t*r*n,s=Math.ceil(Math.sqrt(a));if(s>i){if(s=Math.ceil(Math.cbrt(a)),s>i)throw new Error("Total dispatch size exceeds WebGPU maximum.");return[s,s,s]}else return[s,s,1]}}}),Vm={};ur(Vm,{WebGpuBackend:()=>Hm});var Op,Rp,Np,Hm,Bb=V(()=>{Xe(),ie(),yt(),rh(),H_(),Rb(),Nb(),Op=(e,t)=>{if(t.length!==e.length)throw new Error(`inputDependencies length ${t.length} is not equal to inputTensors length ${e.length}.`);let r=[];for(let n=0;n<e.length;++n){let i=e[n].dataType;switch(t[n]){case"none":{r.push("");break}case"type":{r.push(`${i}`);break}case"rank":{let a=e[n].dims.length;r.push(`${i};${a}`);break}case"dims":{let a=e[n].dims.join(",");r.push(`${i};${a}`);break}default:throw new Error(`unsupported input dependency: ${t[n]}`)}}return r.join("|")},Rp=(e,t,r)=>{let n=e.name;return e.shaderCache?.hint&&(n+="["+e.shaderCache.hint+"]"),n+=":"+r+`:${Op(t,e.shaderCache?.inputDependencies??new Array(t.length).fill("dims"))}`,n},Np=class{constructor(e){e&&(this.architecture=e.architecture,this.vendor=e.vendor)}isArchitecture(e){return this.architecture===e}isVendor(e){return this.vendor===e}},Hm=class{constructor(){this.currentSessionId=null,this.currentKernelId=null,this.commandEncoder=null,this.computePassEncoder=null,this.maxDispatchNumber=16,this.pendingDispatchNumber=0,this.pendingKernels=[],this.pendingQueries=new Map,this.sessionStatus="default",this.capturedCommandList=new Map,this.capturedPendingKernels=new Map,this.sessionExternalDataMapping=new Map}get currentKernelCustomData(){if(this.currentKernelId===null)throw new Error("currentKernelCustomData(): currentKernelId is null. (should not happen)");let e=this.kernelCustomData.get(this.currentKernelId);return e||(e={},this.kernelCustomData.set(this.currentKernelId,e)),e}async initialize(e,t){this.env=e;let r=[],n={requiredLimits:{maxComputeWorkgroupStorageSize:t.limits.maxComputeWorkgroupStorageSize,maxComputeWorkgroupsPerDimension:t.limits.maxComputeWorkgroupsPerDimension,maxStorageBufferBindingSize:t.limits.maxStorageBufferBindingSize,maxBufferSize:t.limits.maxBufferSize,maxComputeInvocationsPerWorkgroup:t.limits.maxComputeInvocationsPerWorkgroup,maxComputeWorkgroupSizeX:t.limits.maxComputeWorkgroupSizeX,maxComputeWorkgroupSizeY:t.limits.maxComputeWorkgroupSizeY,maxComputeWorkgroupSizeZ:t.limits.maxComputeWorkgroupSizeZ},requiredFeatures:r},i=o=>t.features.has(o)&&r.push(o)&&!0;i("chromium-experimental-timestamp-query-inside-passes")||i("timestamp-query"),i("shader-f16"),i("subgroups"),this.device=await t.requestDevice(n);let a=t,s=t.info??(typeof a.requestAdapterInfo=="function"?await a.requestAdapterInfo():void 0);this.adapterInfo=new Np(s),this.gpuDataManager=ah(this),this.programManager=new Gm(this),this.kernels=new Map,this.kernelPersistentData=new Map,this.kernelCustomData=new Map,Pa(e.logLevel,!!e.debug),this.device.onuncapturederror=o=>{o.error instanceof GPUValidationError&&console.error(`An uncaught WebGPU validation error was raised: ${o.error.message}`)},Object.defineProperty(this.env.webgpu,"device",{value:this.device,writable:!1,enumerable:!0,configurable:!0}),Object.defineProperty(this.env.webgpu,"adapter",{value:t,writable:!1,enumerable:!0,configurable:!1}),this.setQueryType()}dispose(){typeof this.querySet<"u"&&this.querySet.destroy(),this.gpuDataManager.dispose(),this.device&&this.env?.webgpu&&this.device.lost.then(()=>{delete this.env.webgpu.device})}getCommandEncoder(){return this.commandEncoder||(this.commandEncoder=this.device.createCommandEncoder()),this.commandEncoder}getComputePassEncoder(){if(!this.computePassEncoder){let e=this.getCommandEncoder(),t={};this.queryType==="at-passes"&&(t.timestampWrites={querySet:this.querySet,beginningOfPassWriteIndex:this.pendingDispatchNumber*2,endOfPassWriteIndex:this.pendingDispatchNumber*2+1}),this.computePassEncoder=e.beginComputePass(t)}return this.computePassEncoder}endComputePass(){this.computePassEncoder&&(this.computePassEncoder.end(),this.computePassEncoder=null)}flush(){if(!this.commandEncoder)return;pt(),this.endComputePass();let e;this.queryType!=="none"&&(this.commandEncoder.resolveQuerySet(this.querySet,0,this.pendingDispatchNumber*2,this.queryResolveBuffer,0),e=this.device.createBuffer({size:this.pendingDispatchNumber*2*8,usage:GPUBufferUsage.MAP_READ|GPUBufferUsage.COPY_DST}),this.pendingQueries.set(e,this.pendingKernels),this.pendingKernels=[],this.commandEncoder.copyBufferToBuffer(this.queryResolveBuffer,0,e,0,this.pendingDispatchNumber*2*8)),this.device.queue.submit([this.commandEncoder.finish()]),this.gpuDataManager.refreshPendingBuffers(),this.commandEncoder=null,this.pendingDispatchNumber=0,this.queryType!=="none"&&e.mapAsync(GPUMapMode.READ).then(()=>{let t=new BigUint64Array(e.getMappedRange()),r=this.pendingQueries.get(e);for(let n=0;n<t.length/2;n++){let i=r[n],a=i.kernelId,s=this.kernels.get(a),o=s.kernelType,u=s.kernelName,d=i.programName,p=i.inputTensorViews,c=i.outputTensorViews,f=t[n*2],g=t[n*2+1];typeof this.queryTimeBase>"u"&&(this.queryTimeBase=f);let m=Number(f-this.queryTimeBase),_=Number(g-this.queryTimeBase);if(!Number.isSafeInteger(m)||!Number.isSafeInteger(_))throw new RangeError("incorrect timestamp range");if(this.env.webgpu.profiling?.ondata)this.env.webgpu.profiling.ondata({version:1,inputsMetadata:p.map(v=>({dims:v.dims,dataType:gt(v.dataType)})),outputsMetadata:c.map(v=>({dims:v.dims,dataType:gt(v.dataType)})),kernelId:a,kernelType:o,kernelName:u,programName:d,startTime:m,endTime:_});else{let v="";p.forEach(($,S)=>{v+=`input[${S}]: [${$.dims}] | ${gt($.dataType)}, `});let w="";c.forEach(($,S)=>{w+=`output[${S}]: [${$.dims}] | ${gt($.dataType)}, `}),console.log(`[profiling] kernel "${a}|${o}|${u}|${d}" ${v}${w}start time: ${m} ns, execution time: ${_-m} ns`)}mn("GPU",`${d}::${f}::${g}`)}e.unmap(),this.pendingQueries.delete(e)}),at()}run(e,t,r,n,i,a){pt(e.name);let s=[];for(let $=0;$<t.length;++$){let S=t[$].data;if(S===0)continue;let x=this.gpuDataManager.get(S);if(!x)throw new Error(`no GPU data for input: ${S}`);s.push(x)}let{outputs:o,dispatchGroup:u,programUniforms:d}=e.getRunData(t),p=r.length===0?o.map(($,S)=>S):r;if(p.length!==o.length)throw new Error(`Output size ${p.length} must be equal to ${o.length}.`);let c=[],f=[];for(let $=0;$<o.length;++$){if(!Number.isInteger(p[$])||p[$]<-3||p[$]>=a)throw new Error(`Invalid output index: ${p[$]}`);if(p[$]===-3)continue;let S=p[$]===-1,x=p[$]===-2,I=S||x?i(o[$].dataType,o[$].dims):n(p[$],o[$].dataType,o[$].dims);if(c.push(I),I.data===0)continue;let E=this.gpuDataManager.get(I.data);if(!E)throw new Error(`no GPU data for output: ${I.data}`);if(S&&this.temporaryData.push(E),x){let z=this.kernelPersistentData.get(this.currentKernelId);z||(z=[],this.kernelPersistentData.set(this.currentKernelId,z)),z.push(E)}f.push(E)}if(s.length!==t.length||f.length!==c.length){if(f.length===0)return at(e.name),c;throw new Error(`Program ${e.name} has zero-sized tensor(s) in inputs or outputs. This is not supported now.`)}let g;if(d){let $=0,S=[];d.forEach(z=>{let k=typeof z.data=="number"?[z.data]:z.data;if(k.length===0)return;let N=z.type===10?2:4,O,F;z.type===10?(F=k.length>4?16:k.length>2?8:k.length*N,O=k.length>4?16:N*k.length):(F=k.length<=2?k.length*N:16,O=16),$=Math.ceil($/F)*F,S.push($);let q=z.type===10?8:4;$+=k.length>4?Math.ceil(k.length/q)*O:k.length*N});let x=16;$=Math.ceil($/x)*x;let I=new ArrayBuffer($);d.forEach((z,k)=>{let N=S[k],O=typeof z.data=="number"?[z.data]:z.data;if(z.type===6)new Int32Array(I,N,O.length).set(O);else if(z.type===12)new Uint32Array(I,N,O.length).set(O);else if(z.type===10)new Uint16Array(I,N,O.length).set(O);else if(z.type===1)new Float32Array(I,N,O.length).set(O);else throw new Error(`Unsupported uniform type: ${gt(z.type)}`)});let E=this.gpuDataManager.create($,GPUBufferUsage.COPY_DST|GPUBufferUsage.UNIFORM);this.device.queue.writeBuffer(E.buffer,0,I,0,$),this.gpuDataManager.release(E.id),g={offset:0,size:$,buffer:E.buffer}}let m=this.programManager.normalizeDispatchGroupSize(u),_=m[1]===1&&m[2]===1,v=Rp(e,t,_),w=this.programManager.getArtifact(v);if(w||(w=this.programManager.build(e,m),this.programManager.setArtifact(v,w),fe("info",()=>`[artifact] key: ${v}, programName: ${e.name}`)),d&&w.uniformVariablesInfo){if(d.length!==w.uniformVariablesInfo.length)throw new Error(`Uniform variables count mismatch: expect ${w.uniformVariablesInfo.length}, got ${d.length} in program "${w.programInfo.name}".`);for(let $=0;$<d.length;$++){let S=d[$],x=S.type,I=typeof S.data=="number"?1:S.data.length,[E,z]=w.uniformVariablesInfo[$];if(x!==E||I!==z)throw new Error(`Uniform variable ${$} mismatch: expect type ${E} with size ${z}, got type ${x} with size ${I} in program "${w.programInfo.name}".`)}}if(fe("info",()=>`[ProgramManager] run "${e.name}" (key=${v}) with ${m[0]}x${m[1]}x${m[2]}`),this.queryType!=="none"||this.sessionStatus==="capturing"){let $={kernelId:this.currentKernelId,programName:w.programInfo.name,inputTensorViews:t,outputTensorViews:c};this.pendingKernels.push($),this.sessionStatus==="capturing"&&this.capturedPendingKernels.get(this.currentSessionId).push($)}return this.programManager.run(w,s,f,m,g),at(e.name),c}upload(e,t){this.gpuDataManager.upload(e,t)}memcpy(e,t){this.gpuDataManager.memcpy(e,t)}async download(e,t){await this.gpuDataManager.download(e,t)}alloc(e){return this.gpuDataManager.create(e).id}free(e){return this.gpuDataManager.release(e)}createKernel(e,t,r,n){let i=Fm.get(e);if(!i)throw new Error(`kernel not implemented: ${e}`);let a={kernelType:e,kernelName:n,kernelEntry:i[0],attributes:[i[1],r]};this.kernels.set(t,a)}releaseKernel(e){let t=this.kernelPersistentData.get(e);if(t){for(let r of t)this.gpuDataManager.release(r.id);this.kernelPersistentData.delete(e)}this.kernelCustomData.delete(e),this.kernels.delete(e)}computeKernel(e,t,r){let n=this.kernels.get(e);if(!n)throw new Error(`kernel not created: ${e}`);let i=n.kernelType,a=n.kernelName,s=n.kernelEntry,o=n.attributes;if(this.currentKernelId!==null)throw new Error(`kernel "[${i}] ${a}" is not allowed to be called recursively`);this.currentKernelId=e,o[0]&&(o[1]=o[0](o[1]),o[0]=void 0),fe("info",()=>`[WebGPU] Start to run kernel "[${i}] ${a}"...`);let u=this.env.debug;this.temporaryData=[];try{return u&&this.device.pushErrorScope("validation"),s(t,o[1]),0}catch(d){return r.push(Promise.resolve(`[WebGPU] Kernel "[${i}] ${a}" failed. ${d}`)),1}finally{u&&r.push(this.device.popErrorScope().then(d=>d?`GPU validation error for kernel "[${i}] ${a}": ${d.message}`:null));for(let d of this.temporaryData)this.gpuDataManager.release(d.id);this.temporaryData=[],this.currentKernelId=null}}registerBuffer(e,t,r,n){let i=this.sessionExternalDataMapping.get(e);i||(i=new Map,this.sessionExternalDataMapping.set(e,i));let a=i.get(t),s=this.gpuDataManager.registerExternalBuffer(r,n,a);return i.set(t,[s,r]),s}unregisterBuffers(e){let t=this.sessionExternalDataMapping.get(e);t&&(t.forEach(r=>this.gpuDataManager.unregisterExternalBuffer(r[0])),this.sessionExternalDataMapping.delete(e))}getBuffer(e){let t=this.gpuDataManager.get(e);if(!t)throw new Error(`no GPU data for buffer: ${e}`);return t.buffer}createDownloader(e,t,r){return async()=>{let n=await da(this,e,t);return Ua(n.buffer,r)}}writeTimestamp(e){this.queryType==="inside-passes"&&this.computePassEncoder.writeTimestamp(this.querySet,e)}setQueryType(){this.queryType="none",(this.env.webgpu.profiling?.mode==="default"||(typeof this.env.trace>"u"?this.env.wasm.trace:this.env.trace))&&(this.device.features.has("chromium-experimental-timestamp-query-inside-passes")?this.queryType="inside-passes":this.device.features.has("timestamp-query")&&(this.queryType="at-passes"),this.queryType!=="none"&&typeof this.querySet>"u"&&(this.querySet=this.device.createQuerySet({type:"timestamp",count:this.maxDispatchNumber*2}),this.queryResolveBuffer=this.device.createBuffer({size:this.maxDispatchNumber*2*8,usage:GPUBufferUsage.COPY_SRC|GPUBufferUsage.QUERY_RESOLVE})))}captureBegin(){fe("info","captureBegin"),this.capturedCommandList.get(this.currentSessionId)||this.capturedCommandList.set(this.currentSessionId,[]),this.capturedPendingKernels.get(this.currentSessionId)||this.capturedPendingKernels.set(this.currentSessionId,[]),this.flush(),this.sessionStatus="capturing"}captureEnd(){fe("info","captureEnd"),this.flush(),this.sessionStatus="default"}replay(){fe("info","replay"),this.sessionStatus="replaying";let e=this.capturedCommandList.get(this.currentSessionId),t=this.capturedPendingKernels.get(this.currentSessionId),r=e.length;this.pendingKernels=[];for(let n=0;n<r;n++){let i=this.getComputePassEncoder(),a=e[n];this.writeTimestamp(this.pendingDispatchNumber*2),i.setPipeline(a.computePipeline),i.setBindGroup(0,a.bindGroup),i.dispatchWorkgroups(...a.dispatchGroup),this.writeTimestamp(this.pendingDispatchNumber*2+1),this.pendingDispatchNumber++,this.queryType!=="none"&&this.pendingKernels.push(t[n]),(this.pendingDispatchNumber>=this.maxDispatchNumber||this.queryType==="at-passes")&&this.endComputePass(),this.pendingDispatchNumber>=this.maxDispatchNumber&&this.flush()}this.flush(),this.sessionStatus="default"}onCreateSession(){this.gpuDataManager.onCreateSession()}onReleaseSession(e){this.unregisterBuffers(e),this.capturedCommandList.has(e)&&this.capturedCommandList.delete(e),this.capturedPendingKernels.has(e)&&this.capturedPendingKernels.delete(e),this.gpuDataManager.onReleaseSession(e)}onRunStart(e){this.currentSessionId=e,this.setQueryType()}}}),jm={};ur(jm,{init:()=>Km});var nn,Bp,Km,Db=V(()=>{ie(),yt(),ae(),V_(),nn=class Xm{constructor(t,r,n,i){this.module=t,this.dataType=r,this.data=n,this.dims=i}getFloat32Array(){if(this.dataType!==1)throw new Error("Invalid data type");let t=R.size(this.dims);return t===0?new Float32Array:new Float32Array(this.module.HEAP8.buffer,this.data,t)}getBigInt64Array(){if(this.dataType!==7)throw new Error("Invalid data type");let t=R.size(this.dims);return t===0?new BigInt64Array:new BigInt64Array(this.module.HEAP8.buffer,this.data,t)}getInt32Array(){if(this.dataType!==6)throw new Error("Invalid data type");let t=R.size(this.dims);return t===0?new Int32Array:new Int32Array(this.module.HEAP8.buffer,this.data,t)}getUint16Array(){if(this.dataType!==10&&this.dataType!==4)throw new Error("Invalid data type");let t=R.size(this.dims);return t===0?new Uint16Array:new Uint16Array(this.module.HEAP8.buffer,this.data,t)}reshape(t){if(R.size(t)!==R.size(this.dims))throw new Error("Invalid new shape");return new Xm(this.module,this.dataType,this.data,t)}},Bp=class{constructor(e,t,r){this.module=e,this.backend=t,this.customDataOffset=0,this.customDataSize=0,this.adapterInfo=t.adapterInfo;let n=e.PTR_SIZE,i=r/e.PTR_SIZE,a=n===4?"i32":"i64";this.opKernelContext=Number(e.getValue(n*i++,a));let s=Number(e.getValue(n*i++,a));this.outputCount=Number(e.getValue(n*i++,a)),this.customDataOffset=Number(e.getValue(n*i++,"*")),this.customDataSize=Number(e.getValue(n*i++,a));let o=[];for(let u=0;u<s;u++){let d=Number(e.getValue(n*i++,a)),p=Number(e.getValue(n*i++,"*")),c=Number(e.getValue(n*i++,a)),f=[];for(let g=0;g<c;g++)f.push(Number(e.getValue(n*i++,a)));o.push(new nn(e,d,p,f))}this.inputs=o}get kernelCustomData(){return this.backend.currentKernelCustomData}get customDataBuffer(){return this.module.HEAPU8.subarray(this.customDataOffset,this.customDataOffset+this.customDataSize)}compute(e,t){let r=t?.inputs?.map(s=>typeof s=="number"?this.inputs[s]:s)??this.inputs,n=t?.outputs??[],i=(s,o,u)=>new nn(this.module,o,this.output(s,u),u),a=(s,o)=>{let u=Lt(s,o);if(!u)throw new Error(`Unsupported data type: ${s}`);let d=u>0?this.backend.gpuDataManager.create(u).id:0;return new nn(this.module,s,d,o)};return this.backend.run(e,r,n,i,a,this.outputCount)}output(e,t){let r=this.module.stackSave();try{let n=this.module.PTR_SIZE,i=n===4?"i32":"i64",a=this.module.stackAlloc((1+t.length)*n);this.module.setValue(a,t.length,i);for(let s=0;s<t.length;s++)this.module.setValue(a+n*(s+1),t[s],i);return this.module._JsepOutput(this.opKernelContext,e,a)}catch(n){throw new Error(`Failed to generate kernel's output[${e}] with dims [${t}]. If you are running with pre-allocated output, please make sure the output type/dims are correct. Error: ${n}`)}finally{this.module.stackRestore(r)}}},Km=async(e,t,r,n)=>{let i=t.jsepInit;if(!i)throw new Error("Failed to initialize JSEP. The WebAssembly module is not built with JSEP support.");if(e==="webgpu"){let a=(Bb(),zr(Vm)).WebGpuBackend,s=new a;await s.initialize(r,n),i("webgpu",[s,o=>s.alloc(Number(o)),o=>s.free(o),(o,u,d,p=!1)=>{if(p)fe("verbose",()=>`[WebGPU] jsepCopyGpuToGpu: src=${Number(o)}, dst=${Number(u)}, size=${Number(d)}`),s.memcpy(Number(o),Number(u));else{fe("verbose",()=>`[WebGPU] jsepCopyCpuToGpu: dataOffset=${Number(o)}, gpuDataId=${Number(u)}, size=${Number(d)}`);let c=t.HEAPU8.subarray(Number(o>>>0),Number(o>>>0)+Number(d));s.upload(Number(u),c)}},async(o,u,d)=>{fe("verbose",()=>`[WebGPU] jsepCopyGpuToCpu: gpuDataId=${o}, dataOffset=${u}, size=${d}`),await s.download(Number(o),()=>t.HEAPU8.subarray(Number(u)>>>0,Number(u+d)>>>0))},(o,u,d)=>s.createKernel(o,Number(u),d,t.UTF8ToString(t._JsepGetNodeName(Number(u)))),o=>s.releaseKernel(o),(o,u,d,p)=>{fe("verbose",()=>`[WebGPU] jsepRun: sessionHandle=${d}, kernel=${o}, contextDataOffset=${u}`);let c=new Bp(t,s,Number(u));return s.computeKernel(Number(o),c,p)},()=>s.captureBegin(),()=>s.captureEnd(),()=>s.replay()])}else{let a=new ih(r);i("webnn",[a,()=>a.reserveTensorId(),s=>a.releaseTensorId(s),async(s,o,u,d,p)=>a.ensureTensor(s,o,u,d,p),(s,o)=>{a.uploadTensor(s,o)},async(s,o)=>a.downloadTensor(s,o),(s,o)=>a.registerMLContext(s,o),!!r.trace])}}}),Dp,Za,Ya,St,Pp,ji,vn,Qa,Ja,Ki,es,ts,rs,Zm=V(()=>{Xe(),W_(),F_(),ie(),Zt(),Ra(),Qc(),Dp=(e,t)=>{ve()._OrtInit(e,t)!==0&&be("Can't initialize onnxruntime.")},Za=async e=>{Dp(e.wasm.numThreads,yn(e.logLevel))},Ya=async(e,t)=>{ve().asyncInit?.();let r=e.webgpu.adapter;if(t==="webgpu"){if(typeof navigator>"u"||!navigator.gpu)throw new Error("WebGPU is not supported in current environment");if(r){if(typeof r.limits!="object"||typeof r.features!="object"||typeof r.requestDevice!="function")throw new Error("Invalid GPU adapter set in `env.webgpu.adapter`. It must be a GPUAdapter object.")}else{let n=e.webgpu.powerPreference;if(n!==void 0&&n!=="low-power"&&n!=="high-performance")throw new Error(`Invalid powerPreference setting: "${n}"`);let i=e.webgpu.forceFallbackAdapter;if(i!==void 0&&typeof i!="boolean")throw new Error(`Invalid forceFallbackAdapter setting: "${i}"`);if(r=await navigator.gpu.requestAdapter({powerPreference:n,forceFallbackAdapter:i}),!r)throw new Error('Failed to get GPU adapter. You may need to enable flag "--enable-unsafe-webgpu" if you are using Chrome.')}}if(t==="webnn"&&(typeof navigator>"u"||!navigator.ml))throw new Error("WebNN is not supported in current environment");{let n=(Db(),zr(jm)).init;t==="webgpu"&&await n("webgpu",ve(),e,r),t==="webnn"&&await n("webnn",ve(),e)}},St=new Map,Pp=e=>{let t=ve(),r=t.stackSave();try{let n=t.PTR_SIZE,i=t.stackAlloc(2*n);t._OrtGetInputOutputCount(e,i,i+n)!==0&&be("Can't get session input/output count.");let a=n===4?"i32":"i64";return[Number(t.getValue(i,a)),Number(t.getValue(i+n,a))]}finally{t.stackRestore(r)}},ji=(e,t)=>{let r=ve(),n=r.stackSave(),i=0;try{let a=r.PTR_SIZE,s=r.stackAlloc(2*a);r._OrtGetInputOutputMetadata(e,t,s,s+a)!==0&&be("Can't get session input/output metadata.");let o=Number(r.getValue(s,"*"));i=Number(r.getValue(s+a,"*"));let u=r.HEAP32[i/4];if(u===0)return[o,0];let d=r.HEAPU32[i/4+1],p=[];for(let c=0;c<d;c++){let f=Number(r.getValue(i+8+c*a,"*"));p.push(f!==0?r.UTF8ToString(f):Number(r.getValue(i+8+(c+d)*a,"*")))}return[o,u,p]}finally{r.stackRestore(n),i!==0&&r._OrtFree(i)}},vn=e=>{let t=ve(),r=t._malloc(e.byteLength);if(r===0)throw new Error(`Can't create a session. failed to allocate a buffer of size ${e.byteLength}.`);return t.HEAPU8.set(e,r),[r,e.byteLength]},Qa=async(e,t)=>{let r,n,i=ve();Array.isArray(e)?[r,n]=e:e.buffer===i.HEAPU8.buffer?[r,n]=[e.byteOffset,e.byteLength]:[r,n]=vn(e);let a=0,s=0,o=0,u=[],d=[],p=[];try{if([s,u]=await Yc(t),t?.externalData&&i.mountExternalData){let x=[];for(let I of t.externalData){let E=typeof I=="string"?I:I.path;x.push(Da(typeof I=="string"?I:I.data).then(z=>{i.mountExternalData(E,z)}))}await Promise.all(x)}for(let x of t?.executionProviders??[])if((typeof x=="string"?x:x.name)==="webnn"){if(i.shouldTransferToMLTensor=!1,typeof x!="string"){let I=x,E=I?.context,z=I?.gpuDevice,k=I?.deviceType,N=I?.powerPreference;E?i.currentContext=E:z?i.currentContext=await i.webnnCreateMLContext(z):i.currentContext=await i.webnnCreateMLContext({deviceType:k,powerPreference:N})}else i.currentContext=await i.webnnCreateMLContext();break}a=await i._OrtCreateSession(r,n,s),i.webgpuOnCreateSession?.(a),a===0&&be("Can't create a session."),i.jsepOnCreateSession?.(),i.currentContext&&(i.webnnRegisterMLContext(a,i.currentContext),i.currentContext=void 0,i.shouldTransferToMLTensor=!0);let[c,f]=Pp(a),g=!!t?.enableGraphCapture,m=[],_=[],v=[],w=[],$=[];for(let x=0;x<c;x++){let[I,E,z]=ji(a,x);I===0&&be("Can't get an input name."),d.push(I);let k=i.UTF8ToString(I);m.push(k),v.push(E===0?{name:k,isTensor:!1}:{name:k,isTensor:!0,type:gt(E),shape:z})}for(let x=0;x<f;x++){let[I,E,z]=ji(a,x+c);I===0&&be("Can't get an output name."),p.push(I);let k=i.UTF8ToString(I);_.push(k),w.push(E===0?{name:k,isTensor:!1}:{name:k,isTensor:!0,type:gt(E),shape:z});{if(g&&t?.preferredOutputLocation===void 0){$.push("gpu-buffer");continue}let N=typeof t?.preferredOutputLocation=="string"?t.preferredOutputLocation:t?.preferredOutputLocation?.[k]??"cpu",O=i.webnnIsGraphOutput;if(N==="cpu"&&O&&O(a,k)){$.push("ml-tensor-cpu-output");continue}if(N!=="cpu"&&N!=="cpu-pinned"&&N!=="gpu-buffer"&&N!=="ml-tensor")throw new Error(`Not supported preferred output location: ${N}.`);if(g&&N!=="gpu-buffer")throw new Error(`Not supported preferred output location: ${N}. Only 'gpu-buffer' location is supported when enableGraphCapture is true.`);$.push(N)}}let S=null;return $.some(x=>x==="gpu-buffer"||x==="ml-tensor"||x==="ml-tensor-cpu-output")&&(o=i._OrtCreateBinding(a),o===0&&be("Can't create IO binding."),S={handle:o,outputPreferredLocations:$,outputPreferredLocationsEncoded:$.map(x=>x==="ml-tensor-cpu-output"?"ml-tensor":x).map(x=>ua(x))}),St.set(a,[a,d,p,S,g,!1]),[a,m,_,v,w]}catch(c){throw d.forEach(f=>i._OrtFree(f)),p.forEach(f=>i._OrtFree(f)),o!==0&&i._OrtReleaseBinding(o)!==0&&be("Can't release IO binding."),a!==0&&i._OrtReleaseSession(a)!==0&&be("Can't release session."),c}finally{i._free(r),s!==0&&i._OrtReleaseSessionOptions(s)!==0&&be("Can't release session options."),u.forEach(c=>i._free(c)),i.unmountExternalData?.()}},Ja=e=>{let t=ve(),r=St.get(e);if(!r)throw new Error(`cannot release session. invalid session id: ${e}`);let[n,i,a,s,o]=r;s&&(o&&t._OrtClearBoundOutputs(s.handle)!==0&&be("Can't clear bound outputs."),t._OrtReleaseBinding(s.handle)!==0&&be("Can't release IO binding.")),t.jsepOnReleaseSession?.(e),t.webnnOnReleaseSession?.(e),t.webgpuOnReleaseSession?.(e),i.forEach(u=>t._OrtFree(u)),a.forEach(u=>t._OrtFree(u)),t._OrtReleaseSession(n)!==0&&be("Can't release session."),St.delete(e)},Ki=async(e,t,r,n,i,a,s=!1)=>{if(!e){t.push(0);return}let o=ve(),u=o.PTR_SIZE,d=e[0],p=e[1],c=e[3],f=c,g,m;if(d==="string"&&(c==="gpu-buffer"||c==="ml-tensor"))throw new Error("String tensor is not supported on GPU.");if(s&&c!=="gpu-buffer")throw new Error(`External buffer must be provided for input/output index ${a} when enableGraphCapture is true.`);if(c==="gpu-buffer"){let w=e[2].gpuBuffer;m=Lt(Ut(d),p);{let $=o.jsepRegisterBuffer;if(!$)throw new Error('Tensor location "gpu-buffer" is not supported without using WebGPU.');g=$(n,a,w,m)}}else if(c==="ml-tensor"){let w=e[2].mlTensor;m=Lt(Ut(d),p);let $=o.webnnRegisterMLTensor;if(!$)throw new Error('Tensor location "ml-tensor" is not supported without using WebNN.');g=$(n,w,Ut(d),p)}else{let w=e[2];if(Array.isArray(w)){m=u*w.length,g=o._malloc(m),r.push(g);for(let $=0;$<w.length;$++){if(typeof w[$]!="string")throw new TypeError(`tensor data at index ${$} is not a string`);o.setValue(g+$*u,nt(w[$],r),"*")}}else{let $=o.webnnIsGraphInput,S=o.webnnIsGraphOutput;if(d!=="string"&&$&&S){let x=o.UTF8ToString(i);if($(n,x)||S(n,x)){let I=Ut(d);m=Lt(I,p),f="ml-tensor";let E=o.webnnCreateTemporaryTensor,z=o.webnnUploadTensor;if(!E||!z)throw new Error('Tensor location "ml-tensor" is not supported without using WebNN.');let k=await E(n,I,p);z(k,new Uint8Array(w.buffer,w.byteOffset,w.byteLength)),g=k}else m=w.byteLength,g=o._malloc(m),r.push(g),o.HEAPU8.set(new Uint8Array(w.buffer,w.byteOffset,m),g)}else m=w.byteLength,g=o._malloc(m),r.push(g),o.HEAPU8.set(new Uint8Array(w.buffer,w.byteOffset,m),g)}}let _=o.stackSave(),v=o.stackAlloc(4*p.length);try{p.forEach(($,S)=>o.setValue(v+S*u,$,u===4?"i32":"i64"));let w=o._OrtCreateTensor(Ut(d),g,m,v,p.length,ua(f));w===0&&be(`Can't create tensor for input/output. session=${n}, index=${a}.`),t.push(w)}finally{o.stackRestore(_)}},es=async(e,t,r,n,i,a)=>{let s=ve(),o=s.PTR_SIZE,u=St.get(e);if(!u)throw new Error(`cannot run inference. invalid session id: ${e}`);let d=u[0],p=u[1],c=u[2],f=u[3],g=u[4],m=u[5],_=t.length,v=n.length,w=0,$=[],S=[],x=[],I=[],E=[],z=s.stackSave(),k=s.stackAlloc(_*o),N=s.stackAlloc(_*o),O=s.stackAlloc(v*o),F=s.stackAlloc(v*o);try{[w,$]=Zc(a),Vt("wasm prepareInputOutputTensor");for(let B=0;B<_;B++)await Ki(r[B],S,I,e,p[t[B]],t[B],g);for(let B=0;B<v;B++)await Ki(i[B],x,I,e,c[n[B]],_+n[B],g);Ht("wasm prepareInputOutputTensor");for(let B=0;B<_;B++)s.setValue(k+B*o,S[B],"*"),s.setValue(N+B*o,p[t[B]],"*");for(let B=0;B<v;B++)s.setValue(O+B*o,x[B],"*"),s.setValue(F+B*o,c[n[B]],"*");if(f&&!m){let{handle:B,outputPreferredLocations:G,outputPreferredLocationsEncoded:J}=f;if(p.length!==_)throw new Error(`input count from feeds (${_}) is expected to be always equal to model's input count (${p.length}).`);Vt("wasm bindInputsOutputs");for(let Y=0;Y<_;Y++){let L=t[Y];await s._OrtBindInput(B,p[L],S[Y])!==0&&be(`Can't bind input[${Y}] for session=${e}.`)}for(let Y=0;Y<v;Y++){let L=n[Y];i[Y]?.[3]?(E.push(x[Y]),s._OrtBindOutput(B,c[L],x[Y],0)!==0&&be(`Can't bind pre-allocated output[${Y}] for session=${e}.`)):s._OrtBindOutput(B,c[L],0,J[L])!==0&&be(`Can't bind output[${Y}] to ${G[Y]} for session=${e}.`)}Ht("wasm bindInputsOutputs"),St.set(e,[d,p,c,f,g,!0])}s.jsepOnRunStart?.(d),s.webnnOnRunStart?.(d);let q;f?q=await s._OrtRunWithBinding(d,f.handle,v,O,w):q=await s._OrtRun(d,N,k,_,F,v,O,w),q!==0&&be("failed to call OrtRun().");let H=[],M=[];Vt("wasm ProcessOutputTensor");for(let B=0;B<v;B++){let G=Number(s.getValue(O+B*o,"*"));if(G===x[B]||E.includes(x[B])){H.push(i[B]),G!==x[B]&&s._OrtReleaseTensor(G)!==0&&be("Can't release tensor.");continue}let J=s.stackSave(),Y=s.stackAlloc(4*o),L=!1,X,U=0;try{s._OrtGetTensorData(G,Y,Y+o,Y+2*o,Y+3*o)!==0&&be(`Can't access output tensor data on index ${B}.`);let ee=o===4?"i32":"i64",Z=Number(s.getValue(Y,ee));U=s.getValue(Y+o,"*");let K=s.getValue(Y+o*2,"*"),xe=Number(s.getValue(Y+o*3,ee)),Se=[];for(let me=0;me<xe;me++)Se.push(Number(s.getValue(K+me*o,ee)));s._OrtFree(K)!==0&&be("Can't free memory for tensor dims.");let W=Se.reduce((me,Te)=>me*Te,1);X=gt(Z);let pe=f?.outputPreferredLocations[n[B]];if(X==="string"){if(pe==="gpu-buffer"||pe==="ml-tensor")throw new Error("String tensor is not supported on GPU.");let me=[];for(let Te=0;Te<W;Te++){let Pe=s.getValue(U+Te*o,"*"),Mr=s.getValue(U+(Te+1)*o,"*"),st=Te===W-1?void 0:Mr-Pe;me.push(s.UTF8ToString(Pe,st))}H.push([X,Se,me,"cpu"])}else if(pe==="gpu-buffer"&&W>0){let me=s.jsepGetBuffer;if(!me)throw new Error('preferredLocation "gpu-buffer" is not supported without using WebGPU.');let Te=me(U),Pe=Lt(Z,W);if(Pe===void 0||!Na(X))throw new Error(`Unsupported data type: ${X}`);L=!0,H.push([X,Se,{gpuBuffer:Te,download:s.jsepCreateDownloader(Te,Pe,X),dispose:()=>{s._OrtReleaseTensor(G)!==0&&be("Can't release tensor.")}},"gpu-buffer"])}else if(pe==="ml-tensor"&&W>0){let me=s.webnnEnsureTensor,Te=s.webnnIsGraphInputOutputTypeSupported;if(!me||!Te)throw new Error('preferredLocation "ml-tensor" is not supported without using WebNN.');if(Lt(Z,W)===void 0||!Ba(X))throw new Error(`Unsupported data type: ${X}`);if(!Te(e,X,!1))throw new Error(`preferredLocation "ml-tensor" for ${X} output is not supported by current WebNN Context.`);let Pe=await me(e,U,Z,Se,!1);L=!0,H.push([X,Se,{mlTensor:Pe,download:s.webnnCreateMLTensorDownloader(U,X),dispose:()=>{s.webnnReleaseTensorId(U),s._OrtReleaseTensor(G)}},"ml-tensor"])}else if(pe==="ml-tensor-cpu-output"&&W>0){let me=s.webnnCreateMLTensorDownloader(U,X)(),Te=H.length;L=!0,M.push((async()=>{let Pe=[Te,await me];return s.webnnReleaseTensorId(U),s._OrtReleaseTensor(G),Pe})()),H.push([X,Se,[],"cpu"])}else{let me=En(X),Te=new me(W);new Uint8Array(Te.buffer,Te.byteOffset,Te.byteLength).set(s.HEAPU8.subarray(U,U+Te.byteLength)),H.push([X,Se,Te,"cpu"])}}finally{s.stackRestore(J),X==="string"&&U&&s._free(U),L||s._OrtReleaseTensor(G)}}f&&!g&&(s._OrtClearBoundOutputs(f.handle)!==0&&be("Can't clear bound outputs."),St.set(e,[d,p,c,f,g,!1]));for(let[B,G]of await Promise.all(M))H[B][2]=G;return Ht("wasm ProcessOutputTensor"),H}finally{s.webnnOnRunEnd?.(d),s.stackRestore(z),S.forEach(q=>s._OrtReleaseTensor(q)),x.forEach(q=>s._OrtReleaseTensor(q)),I.forEach(q=>s._free(q)),w!==0&&s._OrtReleaseRunOptions(w),$.forEach(q=>s._free(q))}},ts=e=>{let t=ve(),r=St.get(e);if(!r)throw new Error("invalid session id");let n=r[0],i=t._OrtEndProfiling(n);i===0&&be("Can't get an profile file name."),t._OrtFree(i)},rs=e=>{let t=[];for(let r of e){let n=r[2];!Array.isArray(n)&&"buffer"in n&&t.push(n.buffer)}return t}}),kt,je,tr,$r,vr,an,Xi,sn,Bt,Dt,Up,Ym,Qm,Jm,eg,tg,rg,ng,ig=V(()=>{Xe(),Zm(),Zt(),Ma(),kt=()=>!!$e.wasm.proxy&&typeof document<"u",tr=!1,$r=!1,vr=!1,sn=new Map,Bt=(e,t)=>{let r=sn.get(e);r?r.push(t):sn.set(e,[t])},Dt=()=>{if(tr||!$r||vr||!je)throw new Error("worker not ready")},Up=e=>{switch(e.data.type){case"init-wasm":tr=!1,e.data.err?(vr=!0,Xi[1](e.data.err)):($r=!0,Xi[0]()),an&&(URL.revokeObjectURL(an),an=void 0);break;case"init-ep":case"copy-from":case"create":case"release":case"run":case"end-profiling":{let t=sn.get(e.data.type);e.data.err?t.shift()[1](e.data.err):t.shift()[0](e.data.out);break}}},Ym=async()=>{if(!$r){if(tr)throw new Error("multiple calls to 'initWasm()' detected.");if(vr)throw new Error("previous call to 'initWasm()' failed.");if(tr=!0,kt())return new Promise((e,t)=>{je?.terminate(),Kc().then(([r,n])=>{try{je=n,je.onerror=a=>t(a),je.onmessage=Up,Xi=[e,t];let i={type:"init-wasm",in:$e};!i.in.wasm.wasmPaths&&(r||oa)&&(i.in.wasm.wasmPaths={wasm:new URL("/SACHIZU-LAB1/assets/ort-wasm-simd-threaded.jsep-DC5y_g6C.wasm",import.meta.url).href}),je.postMessage(i),an=r}catch(i){t(i)}},t)});try{await Oa($e.wasm),await Za($e),$r=!0}catch(e){throw vr=!0,e}finally{tr=!1}}},Qm=async e=>{if(kt())return Dt(),new Promise((t,r)=>{Bt("init-ep",[t,r]);let n={type:"init-ep",in:{epName:e,env:$e}};je.postMessage(n)});await Ya($e,e)},Jm=async e=>kt()?(Dt(),new Promise((t,r)=>{Bt("copy-from",[t,r]);let n={type:"copy-from",in:{buffer:e}};je.postMessage(n,[e.buffer])})):vn(e),eg=async(e,t)=>{if(kt()){if(t?.preferredOutputLocation)throw new Error('session option "preferredOutputLocation" is not supported for proxy.');return Dt(),new Promise((r,n)=>{Bt("create",[r,n]);let i={type:"create",in:{model:e,options:{...t}}},a=[];e instanceof Uint8Array&&a.push(e.buffer),je.postMessage(i,a)})}else return Qa(e,t)},tg=async e=>{if(kt())return Dt(),new Promise((t,r)=>{Bt("release",[t,r]);let n={type:"release",in:e};je.postMessage(n)});Ja(e)},rg=async(e,t,r,n,i,a)=>{if(kt()){if(r.some(s=>s[3]!=="cpu"))throw new Error("input tensor on GPU is not supported for proxy.");if(i.some(s=>s))throw new Error("pre-allocated output tensor is not supported for proxy.");return Dt(),new Promise((s,o)=>{Bt("run",[s,o]);let u=r,d={type:"run",in:{sessionId:e,inputIndices:t,inputs:u,outputIndices:n,options:a}};je.postMessage(d,rs(u))})}else return es(e,t,r,n,i,a)},ng=async e=>{if(kt())return Dt(),new Promise((t,r)=>{Bt("end-profiling",[t,r]);let n={type:"end-profiling",in:e};je.postMessage(n)});ts(e)}}),Zi,Lp,ag,Pb=V(()=>{Xe(),ig(),ie(),Aa(),Qc(),Zi=(e,t)=>{switch(e.location){case"cpu":return[e.type,e.dims,e.data,"cpu"];case"gpu-buffer":return[e.type,e.dims,{gpuBuffer:e.gpuBuffer},"gpu-buffer"];case"ml-tensor":return[e.type,e.dims,{mlTensor:e.mlTensor},"ml-tensor"];default:throw new Error(`invalid data location: ${e.location} for ${t()}`)}},Lp=e=>{switch(e[3]){case"cpu":return new it(e[0],e[2],e[1]);case"gpu-buffer":{let t=e[0];if(!Na(t))throw new Error(`not supported data type: ${t} for deserializing GPU tensor`);let{gpuBuffer:r,download:n,dispose:i}=e[2];return it.fromGpuBuffer(r,{dataType:t,dims:e[1],download:n,dispose:i})}case"ml-tensor":{let t=e[0];if(!Ba(t))throw new Error(`not supported data type: ${t} for deserializing MLTensor tensor`);let{mlTensor:r,download:n,dispose:i}=e[2];return it.fromMLTensor(r,{dataType:t,dims:e[1],download:n,dispose:i})}default:throw new Error(`invalid data location: ${e[3]}`)}},ag=class{async fetchModelAndCopyToWasmMemory(e){return Jm(await Da(e))}async loadModel(e,t){pt();let r;typeof e=="string"?r=await this.fetchModelAndCopyToWasmMemory(e):r=e,[this.sessionId,this.inputNames,this.outputNames,this.inputMetadata,this.outputMetadata]=await eg(r,t),at()}async dispose(){return tg(this.sessionId)}async run(e,t,r){pt();let n=[],i=[];Object.entries(e).forEach(c=>{let f=c[0],g=c[1],m=this.inputNames.indexOf(f);if(m===-1)throw new Error(`invalid input '${f}'`);n.push(g),i.push(m)});let a=[],s=[];Object.entries(t).forEach(c=>{let f=c[0],g=c[1],m=this.outputNames.indexOf(f);if(m===-1)throw new Error(`invalid output '${f}'`);a.push(g),s.push(m)});let o=n.map((c,f)=>Zi(c,()=>`input "${this.inputNames[i[f]]}"`)),u=a.map((c,f)=>c?Zi(c,()=>`output "${this.outputNames[s[f]]}"`):null),d=await rg(this.sessionId,i,o,s,u,r),p={};for(let c=0;c<d.length;c++)p[this.outputNames[s[c]]]=a[c]??Lp(d[c]);return at(),p}startProfiling(){}endProfiling(){ng(this.sessionId)}}}),sg={};ur(sg,{OnnxruntimeWebAssemblyBackend:()=>va,initializeFlags:()=>$a,wasmBackend:()=>og});var $a,va,og,Ub=V(()=>{Xe(),ig(),Pb(),$a=()=>{(typeof $e.wasm.initTimeout!="number"||$e.wasm.initTimeout<0)&&($e.wasm.initTimeout=0);let e=$e.wasm.simd;if(typeof e!="boolean"&&e!==void 0&&e!=="fixed"&&e!=="relaxed"&&(console.warn(`Property "env.wasm.simd" is set to unknown value "${e}". Reset it to \`false\` and ignore SIMD feature checking.`),$e.wasm.simd=!1),typeof $e.wasm.proxy!="boolean"&&($e.wasm.proxy=!1),typeof $e.wasm.trace!="boolean"&&($e.wasm.trace=!1),typeof $e.wasm.numThreads!="number"||!Number.isInteger($e.wasm.numThreads)||$e.wasm.numThreads<=0)if(typeof self<"u"&&!self.crossOriginIsolated)$e.wasm.numThreads=1;else{let t=typeof navigator>"u"?S_("node:os").cpus().length:navigator.hardwareConcurrency;$e.wasm.numThreads=Math.min(4,Math.ceil((t||1)/2))}},va=class{async init(e){$a(),await Ym(),await Qm(e)}async createInferenceSessionHandler(e,t){let r=new ag;return await r.loadModel(e,t),r}},og=new va});Xe();Xe();Xe();var Lb="1.27.0";{let e=(Ub(),zr(sg)).wasmBackend;nr("webgpu",e,5),nr("webnn",e,5),nr("cpu",e,10),nr("wasm",e,10)}Object.defineProperty($e.versions,"web",{value:Lb,enumerable:!0});const qb="rtmpose-m-halpe26-256x192.onnx",Wb="26f3a19e61304a600dfb82d1001d41d24343b89fc70a33ffc84657e0b0bf2ecf",Fb=new URL("/SACHIZU-LAB1/assets/ort-wasm-simd-threaded.jsep-DC5y_g6C.wasm",import.meta.url).href,Fe=192,Ke=256,Gb=[123.675,116.28,103.53],Vb=[58.395,57.12,57.375],qp={0:0,11:5,12:6,13:7,14:8,15:9,16:10,23:11,24:12,25:13,26:14,27:15,28:16,29:24,30:25,31:20,32:21};function Hb(e,t,r){const n=e.filter(f=>Number.isFinite(f.x)&&Number.isFinite(f.y)&&(f.visibility??1)>=.3);if(n.length<5)return null;const i=n.map(f=>f.x*t),a=n.map(f=>f.y*r),s=Math.min(...i),o=Math.max(...i),u=Math.min(...a),d=Math.max(...a);let p=Math.max(1,(o-s)*1.25),c=Math.max(1,(d-u)*1.25);return p/c>Fe/Ke?c=p*Ke/Fe:p=c*Fe/Ke,{cx:(s+o)/2,cy:(u+d)/2,scale:p/Fe}}function jb(e,t,r,n,i){const s=e.length/26,o=t.length/26,u=[];for(let d=0;d<26;d++){let p=0,c=0;for(let f=1;f<s;f++)e[d*s+f]>e[d*s+p]&&(p=f);for(let f=1;f<o;f++)t[d*o+f]>t[d*o+c]&&(c=f);u.push({x:(r.cx+(p/2-Fe/2)*r.scale)/n,y:(r.cy+(c/2-Ke/2)*r.scale)/i,visibility:Math.min(e[d*s+p],t[d*o+c])})}return Array.from({length:33},(d,p)=>p in qp?{...u[qp[p]]}:{...u[0],visibility:0})}let Yi=null;function Kb(e,t){return Yi??=Xb(e,t).catch(r=>{throw Yi=null,r}),Yi}async function Xb(e,t){const r=await wy(`/SACHIZU-LAB1/models/rtmpose/${qb}`,e,c=>t(c.replace("姿勢モデル","高精度の骨格モデル")));if(Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",r)),c=>c.toString(16).padStart(2,"0")).join("")!==Wb)throw new Error("高精度の骨格モデルのファイルが正しくありません。");t("高精度の骨格モデルを準備しています…"),$e.wasm.wasmPaths={wasm:Fb},$e.wasm.numThreads=1;let i=null,a="wasm";const s=typeof navigator<"u"&&!!navigator.gpu;for(const c of s?["webgpu","wasm"]:["wasm"])try{i=await za.create(r,{executionProviders:[c],graphOptimizationLevel:"all"}),a=c;break}catch{}if(!i)throw new Error("高精度の骨格モデルを開始できませんでした。");const o=i,u=document.createElement("canvas");u.width=Fe,u.height=Ke;const d=u.getContext("2d",{willReadFrequently:!0});if(!d)throw new Error("映像処理を開始できません。");const p=new Float32Array(3*Fe*Ke);return{backend:a,async refine(c,f){const g=c.width,m=c.height,_=Hb(f,g,m);if(!_)return null;const v=_.cx-Fe/2*_.scale,w=_.cy-Ke/2*_.scale,$=Math.max(0,v),S=Math.max(0,w),x=Math.min(g,v+Fe*_.scale),I=Math.min(m,w+Ke*_.scale);d.clearRect(0,0,Fe,Ke),x>$&&I>S&&d.drawImage(c,$,S,x-$,I-S,($-v)/_.scale,(S-w)/_.scale,(x-$)/_.scale,(I-S)/_.scale);const E=d.getImageData(0,0,Fe,Ke).data,z=Fe*Ke;for(let N=0;N<z;N++)for(let O=0;O<3;O++)p[O*z+N]=(E[4*N+O]-Gb[O])/Vb[O];const k=await o.run({input:new it("float32",p,[1,3,Ke,Fe])});return jb(k.simcc_x.data,k.simcc_y.data,_,g,m)}}}const Ie=1e-9,Wp=.2,Zb=.1,mt=.2,Fp=.1,on=1.5,Gp=.03,Yb=1,rr=.06,Qi=.15,Vp=.05,Qb=.08,un=3,Jb=.06,ew=6,tw=.25,xa=2.5,Ji=.03,Hp=1.2,rw=.1,jp=2.5,nw=4.5,iw=4.5,aw=2.5,sw=[11,12,23,24,25,26,27,28],ow=.012,uw=.02,Kp=.05,lw=.015,dw=.5,Xp=.01,pw=(e,t)=>sw.every(r=>!e[r]||e[r].x>t[0]+Xp*(t[1]-t[0])/.36&&e[r].x<t[1]-Xp*(t[1]-t[0])/.36),cw=15;function Zp(e,t){e.push(t),e.length>cw&&e.shift()}function Yp(e){if(!e.length)return null;const t=[...e].sort((r,n)=>r-n);return t[t.length>>1]}function Le(e){const t=e.reduce((i,a)=>i+a.t,0)/e.length,r=e.reduce((i,a)=>i+a.x,0)/e.length,n=e.reduce((i,a)=>i+(a.t-t)**2,0);return{mt:t,mx:r,slope:n>0?e.reduce((i,a)=>i+(a.t-t)*(a.x-r),0)/n:0}}function xr(e,t,r,n,i=.08){return e.filter(a=>Math.abs(a.x-t)<r&&(n===null||Math.abs(a.y-n)<i)).sort((a,s)=>Math.abs(a.x-t)-Math.abs(s.x-t))}const ea=(e,t)=>Math.abs(e.x-t.x)<ow&&Math.abs(e.y-t.y)<uw,ln=(e,t)=>e.length>1&&Math.abs(e[1].x-t)-Math.abs(e[0].x-t)<.03,hw=.03,fw=1/50,Qp=.035,Jp=.08,ec=12,mw=.1,gw=.5;function tc(e,t,r,n,i=.08){return e.filter(a=>Math.abs(a.x-t)<r&&(n===null||Math.abs(a.y-n)<i)).sort((a,s)=>Math.hypot(a.x-t,n===null?0:a.y-n)-Math.hypot(s.x-t,n===null?0:s.y-n))}const rc=(e,t,r)=>{const n=e.slice(1).find(i=>r===null||Math.abs(i.y-r)<hw);return!!n&&Math.abs(n.x-t)-Math.abs(e[0].x-t)<.03};class yw{x;y=null;pts=null;velocity=0;history=[];acquisition=null;provisional=[];resumption=null;challenger=null;running=!1;behindStart=!1;backfill=[];watchTracks=[];intervals=[];watchIntervals=[];lastPts=null;lastWatchPts=null;lastInterval=1/120;publishedFrom=null;retraction=null;rivalSeen=!1;nearer=[];finishX;seed;direction;start;sprintSpeed;fromBlocks;constructor(t,r=0,n="standing",i=0,a=!1){this.fromBlocks=a,this.seed=t,this.direction=Math.sign(r),this.finishX=t+r,this.start=this.direction&&n==="flying"?"flying":"standing",this.sprintSpeed=Math.max(mt,i),this.x=this.flyingSeed()}frameInterval(){return Yp(this.intervals)??this.lastInterval}watchInterval(){return Yp(this.watchIntervals)??2*this.frameInterval()}gapLimit(t=this.frameInterval()){return Math.max(.05,jp*t)}get sparse(){return this.frameInterval()>fw}trackHeight(){return this.sparse?Qp:Jp}frameRadius(){return Math.min(rr,Gp+Yb*Math.max(0,this.frameInterval()-1/120))}shortGap(){return Math.max(Fp,jp*this.frameInterval())}decisionWindow(t=this.frameInterval()){return Math.max(rw,iw*t)}minSpan(t=this.frameInterval()){return Math.max(Jb,aw*t)}flyingSeed(){return this.start==="flying"?Math.max(.02,Math.min(.98,this.seed-this.direction*Qb)):this.seed}searchAgain(){this.x=this.flyingSeed(),this.y=null,this.pts=null,this.velocity=0,this.history=[],this.provisional=[],this.watchTracks=[],this.resumption=null,this.running=!1,this.behindStart=!1,this.rivalSeen=!1,this.nearer=[]}expected(t){if(this.pts===null&&this.start==="flying"){const r=this.leadCentre(this.provisional,t);if(r!==null)return r}return this.x+this.velocity*Math.max(0,Math.min(on,this.pts===null?0:t-this.pts))}leadCentre(t,r){const i=t.filter(s=>{const o=s.points.filter(u=>s.pts-u.t<=this.decisionWindow()+Ie);return o.length>=un&&o.at(-1).t-o[0].t>=this.minSpan()-Ie&&Le(o).slope*this.direction>=this.sprintSpeed}).sort((s,o)=>(o.x-s.x)*this.direction)[0];if(!i||r-i.pts>this.shortGap()+Ie)return null;const a=i.points.filter(s=>i.pts-s.t<=this.decisionWindow()+Ie);return Math.max(0,Math.min(1,i.x+Le(a).slope*(r-i.pts)))}watchCentre(t){return this.start!=="flying"||this.pts===null||(this.x-this.finishX)*this.direction>=0?null:this.flyingSeed()}get following(){return this.pts!==null}get contested(){return this.rivalSeen}get idle(){return this.start==="flying"&&this.pts===null&&this.provisional.every(t=>{const r=t.points.filter(n=>t.pts-n.t<=this.decisionWindow()+Ie);return r.length>=4&&r.at(-1).t-r[0].t>=.06-Ie&&Math.abs(Le(r).slope)<mt/2})}takeBackfill(){const t=this.backfill;return this.backfill=[],t}takeRetraction(){const t=this.retraction;return this.retraction=null,t}choose(t,r,n=[0,1],i){if(!Number.isFinite(r))return this.acquisition=null,this.provisional=[],this.resumption=null,[];if(this.pts!==null&&r<=this.pts)return[];this.lastPts!==null&&r>this.lastPts&&(this.lastInterval=r-this.lastPts,this.idle||Zp(this.intervals,this.lastInterval)),this.lastPts=r,i&&this.pts!==null&&(this.lastWatchPts!==null&&r>this.lastWatchPts&&Zp(this.watchIntervals,r-this.lastWatchPts),this.lastWatchPts=r);const a=(c,f)=>c.filter(g=>[23,24].every(m=>g[m]&&Number.isFinite(g[m].x)&&Number.isFinite(g[m].y)&&g[m].x>0&&g[m].x<1&&g[m].y>0&&g[m].y<1&&(g[m].visibility??0)>=.3)&&(this.start!=="flying"||pw(g,f))).map(g=>({p:g,x:(g[23].x+g[24].x)/2,y:(g[23].y+g[24].y)/2})),s=a(t,n),o=this.start==="flying"&&this.pts!==null,u=this.follow(s,r);if(!o||this.pts===null)return u;const d=s.find(c=>c.p===u),p=[];for(const c of[...s,...i?a(i.poses,i.view):[]])c!==d&&!(d&&ea(c,d))&&!p.some(f=>ea(f,c))&&p.push(c);return this.watch(p,r)??u}watch(t,r){if((this.x-this.finishX)*this.direction>=0)return this.watchTracks=[],null;const{next:n,confirmed:i}=this.advance(this.watchTracks,t,r,this.watchInterval());this.watchTracks=n;const a=this.y;if(a!==null&&n.some(o=>o.points.length>=un&&o.y-a>=Ji&&Le(o.points).slope*this.direction>=this.sprintSpeed)&&(this.rivalSeen=!0),a!==null){const o=Math.max(this.sprintSpeed,Hp*Math.abs(this.velocity)),u=ec*this.sprintSpeed/xa,d=t.filter(p=>p.y-a>=Ji).map(p=>({t:r,x:p.x,y:p.y}));this.nearer=this.nearer.filter(p=>r-p.t<=gw),d.some(p=>this.nearer.some(c=>p.t-c.t>=mw-Ie&&Math.abs(p.y-c.y)<Qp&&(p.x-c.x)*this.direction>=o*(p.t-c.t)&&(p.x-c.x)*this.direction<=u*(p.t-c.t)))&&(this.rivalSeen=!0),this.nearer.push(...d)}if(!i||this.y===null)return null;const s=Le(i.points).slope*this.direction;return i.y-this.y>=Ji&&s>=Hp*Math.abs(this.velocity)?(this.retraction=this.publishedFrom,this.adopt(i,r)):null}follow(t,r){if(this.start==="flying"&&this.pts!==null){const o=r-this.pts,u=(this.x-this.seed)*this.direction<0;(o-on>Ie||u&&o-this.shortGap()>Ie)&&this.searchAgain()}if(this.pts===null)return this.start==="flying"?this.acquireFlying(t,r):this.acquire(t,r);const n=this.challenge(t,r);if(n)return n;const i=r-this.pts;if(i-on>Ie)return this.start==="flying"||this.running?[]:(this.searchAgain(),this.acquire(t,r));if(i-this.shortGap()>Ie||this.resumption)return this.resume(t,r);const a=this.reference(r)??this.expected(r);if(this.start==="flying"){const o=tc(t,a,this.frameRadius(),this.y,this.trackHeight());return!o.length||rc(o,a,this.y)?[]:this.accept(o[0],r)}const s=xr(t,a,this.frameRadius(),this.y);return!s.length||ln(s,a)?[]:this.accept(s[0],r)}reference(t){if(this.fromBlocks||Math.abs(this.velocity)<mt)return null;const r=this.history.filter(i=>t-i.t>=Fp-Ie&&t-i.t<=.4+Ie);if(r.length<4||r.at(-1).t-r[0].t<.08)return null;const n=Le(r);return n.mx+n.slope*(t-n.mt)}accept(t,r){for(this.x=t.x,this.y=t.y,this.pts=r,this.resumption=null,(t.x-this.seed)*this.direction<=0&&(this.behindStart=!0),this.history.push({t:r,x:t.x});this.history.length&&r-this.history[0].t>.6;)this.history.shift();return this.updateVelocity(r),t.p}updateVelocity(t){const r=this.history.filter(n=>t-n.t<=Wp+Ie);r.length<3||r.at(-1).t-r[0].t<Zb-Ie||(this.velocity=Math.max(-1,Math.min(1,Le(r).slope)),this.behindStart&&this.velocity*this.direction>=mt&&(this.running=!0))}challenge(t,r){if(!this.direction||this.start==="flying"||this.running||this.velocity*this.direction>=Vp)return this.challenger=null,null;const n=Math.abs(this.expected(r)-this.seed),i=xr(t,this.seed,Math.min(Qi,n-.03),null)[0],a=this.challenger;if(!i)return this.challenger=null,null;const o=a&&r-a.pts-this.gapLimit()<=Ie&&Math.abs(i.x-a.x)<rr&&Math.abs(i.y-a.y)<.08?a.count+1:1;return o<3?(this.challenger={x:i.x,y:i.y,pts:r,count:o},null):(this.x=i.x,this.y=i.y,this.pts=r,this.velocity=0,this.history=[{t:r,x:i.x}],this.resumption=null,this.challenger=null,this.behindStart=(i.x-this.seed)*this.direction<=0,i.p)}resume(t,r){const n=this.expected(r),i=r-this.pts,a=rr+.5*Math.abs(this.velocity)*Math.min(1,i),s=Math.abs(this.velocity)>=mt||this.velocity*this.direction>=Vp,o=xr(t,n,a,this.y,this.start==="flying"?this.trackHeight():Jp).filter(m=>!s||(m.x-this.x)*Math.sign(this.velocity)>=.4*Math.abs(this.velocity)*Math.min(on,i));if(!o.length||ln(o,n))return this.resumption=null,[];const u=o[0],d=this.resumption,c=d&&r-d.pts-this.gapLimit()<=Ie&&Math.abs(u.x-(d.x+this.velocity*(r-d.pts)))<rr&&Math.abs(u.y-d.y)<.08?{...d,x:u.x,y:u.y,pts:r,count:d.count+1}:{startX:u.x,startPts:r,x:u.x,y:u.y,pts:r,count:1};this.resumption=c;const f=c.pts-c.startPts;if(c.count<3||f-.04<-Ie)return[];const g=(c.x-c.startX)/f;return s&&(Math.sign(g)!==Math.sign(this.velocity)||Math.abs(g)<.4*Math.abs(this.velocity))?(this.resumption=null,[]):(this.history=[],this.accept(u,r))}acquire(t,r){const n=this.acquisition;if(n&&r>n.pts&&r-n.pts-this.gapLimit()<=Ie){const s=n.points.length>1?Le(n.points).slope:0,o=n.x+s*(r-n.pts),u=xr(t,o,rr,n.y);if(ln(u,o))return this.acquisition=null,[];if(u.length){const d=u[0],p=[...n.points,{t:r,x:d.x}];return p.length<3?(this.acquisition={x:d.x,y:d.y,pts:r,points:p},[]):(this.x=d.x,this.y=d.y,this.pts=r,this.acquisition=null,this.behindStart=p.some(c=>(c.x-this.seed)*this.direction<=0),this.history=p,this.updateVelocity(r),d.p)}}this.acquisition=null;const i=xr(t,this.x,Qi,null);if(!i.length||ln(i,this.x))return[];const a=i[0];return this.acquisition={x:a.x,y:a.y,pts:r,points:[{t:r,x:a.x}]},[]}acquireFlying(t,r){const{next:n,confirmed:i}=this.advance(this.provisional,t,r);return this.provisional=n,i?this.adopt(i,r):[]}advance(t,r,n,i=this.frameInterval()){const a=t.filter(m=>n>m.pts&&n-m.pts-(m.points.length>=un?Math.max(.05,nw*i):this.gapLimit(i))<=Ie),s=[],o=new Set,u=new Set;for(const m of a){const _=m.points.length>1?Le(m.points).slope:0,v=m.x+_*(n-m.pts),w=m.points.length<2?ec*this.sprintSpeed/xa*Math.max(0,n-m.pts-.05):0,$=tc(r.filter(x=>!o.has(x)),v,rr+w,m.y,this.trackHeight());if(!$.length||rc($,v,m.y)){for(const x of $)u.add(x);s.push(m);continue}const S=$[0];o.add(S),s.push({x:S.x,y:S.y,pts:n,points:[...m.points.filter(x=>n-x.t<=.4),{t:n,x:S.x,p:S.p}]})}const d=[];for(const m of r)o.has(m)||u.has(m)||(m.x-this.seed)*this.direction>Qi||[...o,...d].some(_=>ea(m,_))||(d.push(m),s.push({x:m.x,y:m.y,pts:n,points:[{t:n,x:m.x,p:m.p}]}));s.sort((m,_)=>_.points.length-m.points.length||(_.x-m.x)*this.direction);const p=s.slice(0,ew),c=m=>m.points.filter(_=>n-_.t<=this.decisionWindow(i)+Ie),f=p.filter(m=>{if(m.pts!==n)return!1;const _=c(m),v=_.length?_.at(-1).t-_[0].t:0;if(_.length<un||v-this.minSpan(i)<-Ie)return!1;const w=Le(_).slope*this.direction,$=(_.at(-1).x-_[0].x)*this.direction,S=m.points,x=S.at(-1).t-S[0].t,I=(S.at(-1).x-S[0].x)*this.direction;if(!(w>=mt&&$>=.7*mt*v&&I>=.5*mt*x))return!1;const E=.1*Math.max(0,Le(S).slope*this.direction);return(S[0].x-this.seed)*this.direction>E+Ie?!1:this.sprintSpeed<=mt||x-tw>-Ie&&Le(S).slope*this.direction>=this.sprintSpeed}),g=f[0]??null;return g&&f.length>1&&Math.abs(f[1].x-g.x)<Gp?{next:p,confirmed:null}:{next:p,confirmed:g}}adopt(t,r){const n=_w(t.points);this.x=t.x,this.y=t.y,this.pts=r,this.provisional=[],this.watchTracks=[],this.rivalSeen=!1,this.nearer=[];const i=t.points.filter(a=>r-a.t<=Math.max(Wp,this.decisionWindow())+Ie);return this.velocity=this.sparse&&i.length>=2?Math.max(-1,Math.min(1,Le(i).slope)):0,this.resumption=null,this.behindStart=!0,this.history=n.map(({t:a,x:s})=>({t:a,x:s})),this.updateVelocity(r),this.running=!0,this.backfill=n.slice(0,-1).map(a=>({pts:a.t,pose:a.p})),this.publishedFrom=n[0].t,t.points.at(-1).p}}function _w(e){const t=e.at(-1).t;let r=e.findIndex(i=>t-i.t<=Kp+Ie);r=Math.min(r,Math.max(0,e.length-3));const n=Le(e.slice(r));for(;r>0;){const i=e[r-1],a=Math.max(0,t-Kp-i.t);if(Math.abs(n.mx+n.slope*(i.t-n.mt)-i.x)>lw+.5*dw*a**2)break;r--}return e.slice(r)}const nc=4;class bw{constructor(t,r,n,i,a,s,o,u=!1){this.source=t,this.model=r,this.watcher=n,this.fromBlocks=u,this.crop=document.createElement("canvas");const d=this.crop.getContext("2d");if(!d)throw new Error("映像処理を開始できません。");this.cc=d;const p=a===void 0||!(o>0)?0:xa*Math.abs(a-i)/o;this.tracker=new yw(i,a===void 0?0:a-i,s,p,u)}source;model;watcher;fromBlocks;samples=[];tracker;sampleAt=new Map;crop;cc;top=0;bottom=1;analysed=0;get idle(){return this.tracker.idle}detect(t,r,n,i,a){return this.crop.width=512,this.crop.height=Math.round(512*r.h*a/(r.w*i)),this.cc.drawImage(this.source,r.x*i,r.y*a,r.w*i,r.h*a,0,0,this.crop.width,this.crop.height),t.estimate(this.crop,n.frameIndex,n.pts).landmarks.map(s=>s.map(o=>({...o,x:r.x+o.x*r.w,y:r.y+o.y*r.h})))}async process(t,r,n){this.analysed++;const i=this.tracker,a=this.samples,s={x:Math.max(0,Math.min(.64,i.expected(n.pts)-.18)),y:this.top,w:.36,h:this.bottom-this.top},o=this.detect(this.model,s,n,t,r),u=i.watchCentre(n.pts),d=u===null?null:{x:Math.max(0,Math.min(.64,u-.18)),y:0,w:.36,h:1};let p;d&&Math.abs(d.x-s.x)>.01&&this.analysed%2===0&&(p={poses:this.detect(await this.watcher(),d,n,t,r),view:[d.x,d.x+d.w]});const c=i.choose(o,n.pts,[s.x,s.x+s.w],p),f=i.takeRetraction();if(f!==null)for(let m=a.length-1;m>=0&&a[m].pts>=f;m--)a[m]=Jn([],a[m].frame,a[m].pts,t/r);const g=i.takeBackfill();for(const{pts:m,pose:_}of g){const v=this.sampleAt.get(m);v!==void 0&&(a[v]=Jn(_,a[v].frame,m,t/r))}if(g.length&&(this.top=0,this.bottom=1),c.length&&!this.fromBlocks){const m=c.filter(w=>(w.visibility??0)>=.3).map(w=>w.y),_=Math.max(0,Math.min(...m)-.12),v=Math.min(1,Math.max(...m)+.12);v-_>.2&&(this.top=.8*this.top+.2*_,this.bottom=.8*this.bottom+.2*v)}return this.sampleAt.set(n.pts,a.length),a.push(Jn(c,n.frameIndex,n.pts,t/r)),c}}const ug=2;class ns extends Error{constructor(t,r){super(`動画の読み出しに失敗しました（${t+1}コマ目：${r}）。もう一度お試しください。`),this.frame=t,this.reason=r}frame;reason}async function xn(e,t,r){try{return await Tt(e,t)}catch(n){throw t.aborted||n instanceof DOMException&&n.name==="AbortError"?n:new ns(r,n instanceof Error?n.message:String(n))}}const ic=120,ww=30,$w=240;async function lg(e,t,r,n,i,a="standing",s=10,o={}){const u=()=>{if(r.aborted)throw new DOMException("中止","AbortError")};if(u(),!Er.isAvailable())throw new Error("このブラウザではフレーム解析ができません。対応する最新のブラウザでお試しください。");if(e.size>150*1024*1024)throw new Error("150MB以内のMP4 / MOVを選んでください。");n(0,"元動画のフレーム時刻を確認しています。");const d=await Tt(Sa(e),r);if(u(),!d.frames.length||d.frames.length>3600||d.frames.at(-1).pts-d.frames[0].pts>30)throw new Error("1走分・30秒以内・3600フレーム以内の動画を選んでください。");o.onTimeline?.(d.frames.map(F=>({frameIndex:F.frameIndex,pts:F.pts})));const p=ac(d.videoTrack.matrix);let c=new Er(e,d.videoTrack,d.frames,d.rawSamples,d.descriptionBuffer);const f=new Jo("full",void 0,"CPU",nc);let g=o.watcher??null;const m=async()=>(g||(g=new Jo("full",void 0,"CPU",nc,"IMAGE"),await Tt(g.initialize(r),r),u()),g),_=document.createElement("canvas"),v=_.getContext("2d");if(!v)throw new Error("映像処理を開始できません。");const w=new bw(_,f,m,t,i,a,s,o.fromBlocks),$=()=>c.dispose();r.addEventListener("abort",$,{once:!0});let S=performance.now(),x=-1/0;const I=d.frames.at(-1).pts-d.frames[0].pts,E=I>0?(d.frames.length-1)/I:ic,z=Math.max(1,Math.round(E/(o.maxFps??ic))),k=Math.max(z,Math.round(E/ww));let N=0,O=-1;try{await Tt(f.initialize(r,F=>n(0,F)),r),u();for(let F=0;;F++)try{for(const q of d.frames){if(o.to!==void 0&&q.pts>o.to)break;if(q.frameIndex<=O||q.frameIndex<N||o.from!==void 0&&q.pts<o.from){await xn(c.skipExactFrame(q.frameIndex),r,q.frameIndex),u();continue}const H=await xn(c.decodeExactFrame(q.frameIndex).then(L=>(r.aborted&&c.dispose(),L)),r,q.frameIndex);if(u(),N=q.frameIndex+z,H.status!=="SUCCESS"||H.actualDecodedFrameIndex!==q.frameIndex)throw new Error("動画フレームを正しく読み出せません。");const M=H.bitmap,B=p%180?M.height:M.width,G=p%180?M.width:M.height;(_.width!==B||_.height!==G)&&(_.width=B,_.height=G),v.setTransform(1,0,0,1,0,0),v.clearRect(0,0,B,G),v.translate(B/2,G/2),v.rotate(p*Math.PI/180),v.drawImage(M,-M.width/2,-M.height/2),v.setTransform(1,0,0,1,0,0);const J=await w.process(B,G,q);o.onSelected?.(q,J,B,G),o.afterSelected&&(await Tt(o.afterSelected(_),r),u()),O=q.frameIndex,w.idle&&(N=q.frameIndex+k);const Y=performance.now();if(Y-x>100){const L=o.from===void 0&&o.to===void 0?(q.frameIndex+1)/d.frames.length:(q.pts-(o.from??0))/Math.max(1e-6,Math.min(o.to??1/0,d.frames.at(-1).pts)-(o.from??0));n(Math.max(0,Math.min(1,L)),"選手と脚の動きを解析しています。"),x=Y}Y-S>32&&(await new Promise(L=>setTimeout(L,0)),S=performance.now(),u())}break}catch(q){if(!(q instanceof ns)||r.aborted||F>=ug)throw q;n((O+1)/d.frames.length,"動画の読み出しをやり直しています。"),c.dispose(),c=new Er(e,d.videoTrack,d.frames,d.rawSamples,d.descriptionBuffer)}return n(1,"解析が終わりました。"),w.samples}finally{r.removeEventListener("abort",$),c.dispose(),f.dispose(),g!==o.watcher&&g?.dispose(),_.width=0}}async function vw(e,t,r,n){const i=()=>{if(t.aborted)throw new DOMException("中止","AbortError")},a=await Tt(Sa(e),t);i();const s=ac(a.videoTrack.matrix);let o=new Er(e,a.videoTrack,a.frames,a.rawSamples,a.descriptionBuffer);const u=document.createElement("canvas"),d=u.getContext("2d");if(!d)throw new Error("映像処理を開始できません。");const p=()=>o.dispose();t.addEventListener("abort",p,{once:!0});const c=a.frames.reduce((g,m)=>r(m.frameIndex)?m.frameIndex:g,-1);let f=-1;try{for(let g=0;;g++)try{for(const m of a.frames){if(m.frameIndex>c)break;if(m.frameIndex<=f||!r(m.frameIndex)){await xn(o.skipExactFrame(m.frameIndex),t,m.frameIndex),i();continue}const _=await xn(o.decodeExactFrame(m.frameIndex),t,m.frameIndex);if(i(),_.status!=="SUCCESS"||_.actualDecodedFrameIndex!==m.frameIndex)throw new Error("動画フレームを正しく読み出せません。");const v=_.bitmap,w=s%180?v.height:v.width,$=s%180?v.width:v.height;(u.width!==w||u.height!==$)&&(u.width=w,u.height=$),d.setTransform(1,0,0,1,0,0),d.clearRect(0,0,w,$),d.translate(w/2,$/2),d.rotate(s*Math.PI/180),d.drawImage(v,-v.width/2,-v.height/2),d.setTransform(1,0,0,1,0,0),await n(m,u,w,$),i(),f=m.frameIndex}break}catch(m){if(!(m instanceof ns)||t.aborted||g>=ug)throw m;o.dispose(),o=new Er(e,a.videoTrack,a.frames,a.rawSamples,a.descriptionBuffer)}}finally{t.removeEventListener("abort",p),o.dispose(),u.width=0}return a.frames.length}const xw=30,dg=.6,pg=2.2,Sw=dg+pg+.5;function kw(e,t){const r=new Set,n=xc;if(e.reason)return r;const i=[];e.blockClearance&&i.push([e.blockClearance.frame,n.FAR+3,n.FAR+n.BC_TIP_FAR+3]);for(const a of e.contacts)a.touchdownFrame!=null&&i.push([a.touchdownFrame,n.FAR+2,n.FAR+2]);for(const a of t)a.pose&&(e.set&&Math.abs(a.pts-e.set.pts)<=mc+1e-6||i.some(([s,o,u])=>a.frame>=s-o&&a.frame<=s+u))&&r.add(a.frame);return r}async function Lw(e,t,r,n){const i=await Tt(Sa(e),r);if((i.frames.length?i.frames.at(-1).pts-i.frames[0].pts:0)<=Sw)return{...await ta(e,t,r,n,void 0,"moments"),window:null};const s=[];let o=0,u=0;await lg(e,t,r,(c,f)=>n(.3*c,f==="選手と脚の動きを解析しています。"?"スタートの瞬間を探しています。":f),void 0,"standing",10,{maxFps:xw,fromBlocks:!0,onSelected:(c,f,g,m)=>{o=g,u=m,s.push({frame:c.frameIndex,pts:c.pts,pose:f.length===33?f.map(_=>({x:_.x,y:_.y,visibility:_.visibility})):null})}});const d=o?u_(s,o,u):null;if(d!==null){const c=[Math.max(0,d-dg),d+pg],f=await ta(e,t,r,(g,m)=>n(.3+.7*g,m),c,"moments");if(!gc(f.frames,{width:f.width,height:f.height}).reason)return{...f,window:c}}return{...await ta(e,t,r,(c,f)=>n(.3+.7*c,f),void 0,"moments"),window:null}}async function ta(e,t,r,n,i,a="every"){const s=[];let o=0,u=0,d=null;const p=async f=>{try{d=await Tt(Kb(r,g=>n(f,g)),r)}catch(g){if(r.aborted)throw g;d=null}},c=a==="every";if(c&&await p(0),await lg(e,t,r,c?n:(f,g)=>n(.8*f,g),void 0,"standing",10,{maxFps:$w,fromBlocks:!0,from:i?.[0],to:i?.[1],onSelected:(f,g,m,_)=>{o=m,u=_,s.push({frame:f.frameIndex,pts:f.pts,pose:g.length===33?g.map(v=>({x:v.x,y:v.y,visibility:v.visibility})):null})},afterSelected:c&&d?async f=>{const g=s.at(-1);g?.pose&&(g.refined=await d.refine(f,g.pose))}:void 0}),!c){const f=kw(gc(s,{width:o,height:u}),s);if(f.size){await p(.8);const g=new Map(s.map(v=>[v.frame,v])),m=Math.max(...f),_=d;_&&await vw(e,r,v=>f.has(v),async(v,w)=>{const $=g.get(v.frameIndex);$?.pose&&($.refined=await _.refine(w,$.pose)),n(.85+.15*v.frameIndex/m,"角度を測るコマを細かく調べています。")})}}return{frames:s,width:o,height:u,refiner:d?.backend??null}}const Tw=1280;function ra(e,t,r){return new Promise((n,i)=>{const a=()=>{clearTimeout(s),e.removeEventListener(t,a),n()},s=setTimeout(()=>{e.removeEventListener(t,a),i(new Error(`${t} timed out`))},r);e.addEventListener(t,a)})}async function Iw(e,t=15e3){const r=document.createElement("video");r.muted=!0,r.playsInline=!0,r.preload="auto",r.style.cssText="position:fixed;left:-10000px;top:0;width:320px;height:180px;pointer-events:none",document.body.appendChild(r);try{const n=ra(r,"loadedmetadata",t);if(r.src=e,r.load(),await n,r.readyState<2){const o=ra(r,"loadeddata",t);await r.play().catch(()=>{}),r.pause(),r.readyState<2&&await o}if(r.currentTime>0){const o=ra(r,"seeked",t);r.currentTime=0,await o}if(await new Promise(o=>requestAnimationFrame(()=>o())),!r.videoWidth||!r.videoHeight)return null;const i=Math.min(1,Tw/r.videoWidth),a=document.createElement("canvas");a.width=Math.round(r.videoWidth*i),a.height=Math.round(r.videoHeight*i);const s=a.getContext("2d");return s?(s.drawImage(r,0,0,a.width,a.height),{image:a.toDataURL("image/jpeg",.85),width:r.videoWidth,height:r.videoHeight}):null}catch{return null}finally{r.pause(),r.removeAttribute("src"),r.load(),r.remove()}}function qw(e){const[t,r]=ze.useState(null);return ze.useEffect(()=>{let n=!1;return r(null),e&&Iw(e).then(i=>{n||r(i)}),()=>{n=!0}},[e]),t}export{fc as A,ta as B,Dw as C,Hy as D,jy as E,ru as F,Ly as G,Rw as H,Kb as I,$w as J,nc as K,qy as L,Yy as M,ns as N,Xy as O,c_ as P,_c as Q,aa as R,$y as S,lc as T,Uw as a,gc as b,Nw as c,Bw as d,Pw as e,$c as f,Zy as g,Ow as h,sa as i,Sn as j,lg as k,kn as l,Lw as m,Mw as n,Fy as o,Gy as p,ar as q,vw as r,In as s,Wy as t,qw as u,qe as v,qt as w,pc as x,Py as y,dc as z};
