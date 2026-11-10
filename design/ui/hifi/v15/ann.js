// 标注 + 自检：所有数值从渲染后的 DOM 实测（1x px）
const Z=document.getElementById('stage');const ANN=window.ANN||[];const res={checks:[],ok:true};
function R(el){const a=el.getBoundingClientRect(),b=Z.getBoundingClientRect();return{l:a.left-b.left,t:a.top-b.top,r:a.right-b.left,b:a.bottom-b.top,w:a.width,h:a.height}}
function Q(s){const e=document.querySelector(s);if(!e)throw new Error('missing '+s);return e}
function add(cls,st,txt){const d=document.createElement('div');d.className=cls;Object.assign(d.style,st);if(txt!=null)d.textContent=txt;Z.appendChild(d);return d}
const f=v=>String(Math.round(v*10)/10);
function hseg(x1,x2,y,t){if(!SHOW)return;add('mk h',{left:x1+'px',top:y+'px',width:(x2-x1)+'px'});add('lab',{left:(x1+x2)/2+'px',top:y+'px'},t)}
function vseg(y1,y2,x,t){if(!SHOW)return;add('mk v',{top:y1+'px',left:x+'px',height:(y2-y1)+'px'});add('lab',{left:x+'px',top:(y1+y2)/2+'px'},t)}
function bx(r){if(!SHOW)return;add('box',{left:r.l+'px',top:r.t+'px',width:r.w+'px',height:r.h+'px'})}
const g4=v=>Math.abs(v/4-Math.round(v/4))<0.06;const eqv=(a,b)=>Math.abs(a-b)<0.06;
function chk(ok,t){res.checks.push([ok,t]);if(!ok)res.ok=false}
const SHOW=document.body.classList.contains('annmode');
for(const a of ANN){
 if(a.t==='pad'){const c=R(Q(a.c)),k=R(Q(a.k));bx(k);const p=[k.t-c.t,c.r-k.r,c.b-k.b,k.l-c.l];
  vseg(c.t,k.t,(k.l+k.r)/2,f(p[0]));hseg(k.r,c.r,(k.t+k.b)/2,f(p[1]));vseg(k.b,c.b,(k.l+k.r)/2+(a.off||0),f(p[2]));hseg(c.l,k.l,(k.t+k.b)/2,f(p[3]));
  const ex=a.e;const sides=a.sides||[0,1,2,3];let ok=sides.every(i=>g4(p[i]));if(ex)ok=ok&&sides.every(i=>ex[i]==null||eqv(p[i],ex[i]));
  chk(ok,`${a.n} 内边距 上/右/下/左 ${sides.map(i=>f(p[i])).join('/')}${ex?'（应 '+sides.map(i=>ex[i]).join('/')+'）':''}`)}
 if(a.t==='gap'){const A=R(Q(a.a)),B=R(Q(a.b));let v;if(a.ax==='v'){v=B.t-A.b;vseg(A.b,B.t,a.x!=null?a.x:(Math.max(A.l,B.l)+Math.min(A.r,B.r))/2,f(v))}else{v=B.l-A.r;hseg(A.r,B.l,a.y!=null?a.y:(Math.max(A.t,B.t)+Math.min(A.b,B.b))/2,f(v))}
  chk((a.e==null?g4(v):eqv(v,a.e)),`${a.n} 间距 ${f(v)}${a.e!=null?'（应 '+a.e+'）':''}`)}
 if(a.t==='pos'){const r=R(Q(a.e));bx(r);const v={l:r.l,t:r.t,w:r.w,h:r.h,r:390-r.r,b:780-r.b};const ks=a.k||['l','t','w','h'];
  if(SHOW){if(ks.includes('l'))hseg(0,r.l,r.t+r.h/2,f(v.l));if(ks.includes('t'))vseg(0,r.t,r.l+Math.min(8,r.w/2),f(v.t));if(ks.includes('r'))hseg(r.r,390,r.t+r.h/2,f(v.r));if(ks.includes('b'))vseg(r.b,780,r.l+Math.min(8,r.w/2),f(v.b))}
  let ok=true;const parts=[];for(const k of ks){const ex=a.ex&&a.ex[k];ok=ok&&(ex!=null?eqv(v[k],ex):g4(v[k]));parts.push(`${k} ${f(v[k])}`)}
  chk(ok,`${a.n} ${parts.join(' · ')}`)}
 if(a.t==='center'){const r=R(Q(a.e));bx(r);const d=(r.l+r.r)/2-(a.cx||195);chk(Math.abs(d)<=0.5,`${a.n} 水平居中（中心偏差 ${f(d)}，宽 ${f(r.w)} 由内容决定）`)}
 if(a.t==='lines'){const e=Q(a.e);const n=+e.dataset.lines,w=+e.dataset.w;chk(n<=2&&w<=(+e.dataset.maxw)+0.01,`${a.n} 排 ${n} 行，最宽行 ${f(w)} ≤ ${e.dataset.maxw}`)}
}
// 字号：所有可见文字只用 12/14/16/20
const sizes=new Set();Z.querySelectorAll('*').forEach(e=>{if([...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim())&&!e.classList.contains('lab')&&!e.classList.contains('note')){sizes.add(parseFloat(getComputedStyle(e).fontSize))}});
chk([...sizes].every(s=>[12,14,16,20,40].includes(s)),`字号 ${[...sizes].sort((a,b)=>a-b).join(' / ')}（只允许 12/14/16/20/40）`);
if(SHOW){const n=document.createElement('div');n.className='note';document.body.appendChild(n);n.innerHTML='<b>'+(window.STATE||'')+'</b><br>'+res.checks.map(c=>(c[0]?'<b>✔</b> ':'<span class=x>✘</span> ')+c[1]).join('<br>');}
document.title=JSON.stringify(res);
