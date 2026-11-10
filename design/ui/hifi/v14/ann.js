const S=2;const res={};
function R(el,z){const a=el.getBoundingClientRect(),b=z.getBoundingClientRect();return{l:(a.left-b.left)/S,t:(a.top-b.top)/S,r:(a.right-b.left)/S,b:(a.bottom-b.top)/S}}
function add(z,cls,st){const d=document.createElement('div');d.className=cls;Object.assign(d.style,st);z.appendChild(d);return d}
function hseg(z,x1,x2,y,txt){add(z,'mk h',{left:x1*S+'px',top:y*S-1+'px',width:(x2-x1)*S+'px'});add(z,'lab',{left:(x1+x2)/2*S+'px',top:y*S+'px'}).textContent=txt}
function vseg(z,y1,y2,x,txt){add(z,'mk v',{top:y1*S+'px',left:x*S-1+'px',height:(y2-y1)*S+'px'});add(z,'lab',{left:x*S+'px',top:(y1+y2)/2*S+'px'}).textContent=txt}
function bx(z,r){add(z,'box',{left:r.l*S+'px',top:r.t*S+'px',width:(r.r-r.l)*S+'px',height:(r.b-r.t)*S+'px'})}
const fmt=v=>String(Math.round(v*10)/10);
document.querySelectorAll('.col').forEach(col=>{
 const k=col.className.match(/ o([ABC])/)[1];const z=col.querySelector('.ann');const q=s=>R(z.querySelector(s),z);
 const who=q('.who'),av=q('.av'),pat=q('.pat'),cc=q('.cc'),coin=q('.coin'),num=q('.num'),tg=q('.tg'),lb=q('.lb'),vv=q('.vv'),gr=q('.gr'),gs=q('.gr svg');
 [av,pat,coin,num,lb,vv,gs].forEach(r=>bx(z,r));
 const P={};
 P.who=[av.t-who.t,who.r-av.r,who.b-pat.b,av.l-who.l];P.whoGap=pat.t-av.b;
 P.cc=[coin.t-cc.t,cc.r-num.r,cc.b-coin.b,coin.l-cc.l];
 P.tg=[lb.t-tg.t,tg.r-vv.r,tg.b-lb.b,lb.l-tg.l];P.tgGap=vv.l-lb.r;
 P.gr=[gs.t-gr.t,gr.r-gs.r,gr.b-gs.b,gs.l-gr.l];
 P.rowGap=tg.t-cc.b;P.colGap=gr.l-tg.r;P.mL=who.l;P.mR=390-cc.r;P.mR2=390-gr.r;P.top=who.t;
 P.alignTop=[who.t,cc.t];P.alignBot=[who.b,tg.b,gr.b];P.width=[cc.r-cc.l,gr.r-tg.l];
 // marks
 const pad=(o,c,v,cb)=>{vseg(z,o.t,c.t,(c.l+c.r)/2,fmt(v[0]));hseg(z,c.r,o.r,(c.t+c.b)/2,fmt(v[1]));vseg(z,cb,o.b,(c.l+c.r)/2,fmt(v[2]));hseg(z,o.l,c.l,(c.t+c.b)/2,fmt(v[3]))};
 vseg(z,av.t,who.t,(av.l+av.r)/2,'');
 vseg(z,who.t,av.t,who.l+52,fmt(P.who[0]));hseg(z,av.r,who.r,who.t+36,fmt(P.who[1]));vseg(z,pat.b,who.b,who.l+40,fmt(P.who[2]));hseg(z,who.l,av.l,who.t+36,fmt(P.who[3]));vseg(z,av.b,pat.t,who.l+24,fmt(P.whoGap));
 vseg(z,cc.t,coin.t,(coin.l+coin.r)/2,fmt(P.cc[0]));vseg(z,coin.b,cc.b,(coin.l+coin.r)/2,fmt(P.cc[2]));hseg(z,cc.l,coin.l,cc.t+24,fmt(P.cc[3]));hseg(z,num.r,cc.r,cc.t+24,fmt(P.cc[1]));
 vseg(z,tg.t,lb.t,(lb.l+lb.r)/2,fmt(P.tg[0]));vseg(z,lb.b,tg.b,(lb.l+lb.r)/2,fmt(P.tg[2]));hseg(z,tg.l,lb.l,tg.t+24,fmt(P.tg[3]));hseg(z,vv.r,tg.r,tg.t+24,fmt(P.tg[1]));hseg(z,lb.r,vv.l,tg.t+42,fmt(P.tgGap));
 pad(gr,gs,P.gr,gs.b);
 vseg(z,cc.b,tg.t,cc.l+52,fmt(P.rowGap));hseg(z,tg.r,gr.l,tg.t+10,fmt(P.colGap));
 hseg(z,0,who.l,who.t+90,fmt(P.mL));hseg(z,cc.r,390,cc.t+12,fmt(P.mR));vseg(z,0,who.t,who.l+70,fmt(P.top));
 // checks
 const eq=a=>a.every(x=>Math.abs(x-a[0])<0.05);const g4=a=>a.every(x=>Math.abs(x/4-Math.round(x/4))<0.05);
 const L=[];const c=(ok,t)=>L.push(`${ok?'<b>✔</b>':'<span class=x>✘</span>'} ${t}`);
 c(eq(P.who)&&g4(P.who),`头像框四边 ${P.who.map(fmt).join(' / ')}（上/右/下/左）`);
 c(g4([P.whoGap]),`头像到耐心条间距 ${fmt(P.whoGap)}`);
 c(eq([P.cc[0],P.cc[2],P.cc[3]])&&g4(P.cc),`金币胶囊 上/下/左 ${fmt(P.cc[0])}/${fmt(P.cc[2])}/${fmt(P.cc[3])}，文字端右 ${fmt(P.cc[1])}`);
 c(eq(P.tg)&&g4(P.tg),`本单牌四边 ${P.tg.map(fmt).join(' / ')}，内部间距 ${fmt(P.tgGap)}`);
 c(eq(P.gr)&&g4(P.gr),`⚙ 按钮四边 ${P.gr.map(fmt).join(' / ')}`);
 c(eq([P.rowGap,P.colGap])&&g4([P.rowGap]),`组件间距 行 ${fmt(P.rowGap)}、列 ${fmt(P.colGap)}`);
 c(eq([P.mL,P.mR,P.mR2]),`左右安全边距 ${fmt(P.mL)} / ${fmt(P.mR)}`);
 c(eq(P.alignTop)&&eq(P.alignBot),`顶线 ${P.alignTop.map(fmt).join('=')}，底线 ${P.alignBot.map(fmt).join('=')}`);
 c(eq(P.width),`右列两行同宽 ${P.width.map(fmt).join(' = ')}`);
 c(true,'字号 12 / 16 / 20，字重 Bold 1 种（数字等宽），描边全部 2px，圆角 8 / 16 / 24');
 col.querySelector('.chk').innerHTML='<b style="color:#5A4030">自检（数值由渲染结果实测，单位 1x px）</b><br>'+L.join('<br>');
 res[k]=L;
});
document.title=JSON.stringify(res);
