// ui-spec v1.2 + 美术 screens_fx_v1：HUD 比例、气泡、喂信通知条、引导与高亮、疏通进度、首页、过场。
// 在 art.js 之后加载，覆盖 game.js / g2.js 里对应的绘制函数；玩法逻辑不动。
const FXF='"Noto Sans CJK SC","PingFang SC",sans-serif';
const BROWN='#5A4030',CREAM='#FFF3DA',GOLD='#FFD45E',OKG='#9BE08F';
['ui_guide_hand','ui_guide_hand_tap','ui_guide_ring','ui_guide_ring_ok','ui_guide_ring_gold','ui_sparkle_32','ui_sparkle_24','logo_title','btn_primary_normal','btn_primary_pressed'].forEach(n=>pimg('assets/ui/'+n+'@2x.png'));
['title_bg','trans_morning','trans_road','trans_evening','trans_stairwell','doorway_zhao'].forEach(n=>pimg('assets/screens/'+n+'@2x.jpg'));
function uiImg(n){return pimg('assets/ui/'+n+'@2x.png');}
function scr(n){return pimg('assets/screens/'+n+'@2x.jpg');}
function fullBg(n){const im=scr(n);if(!im)return false;g.drawImage(im,0,0,W,H);return true;}
function T(t,x,y,lv,color=BROWN,align='center',bold=true){const s={1:40,2:20,3:16,4:14,5:12}[lv];g.font=`${bold?700:400} ${s}px ${FXF}`;g.textAlign=align;g.textBaseline='middle';g.fillStyle=color;g.fillText(t,x,y);}
function TW(t,lv,bold=true){const s={1:40,2:20,3:16,4:14,5:12}[lv];g.font=`${bold?700:400} ${s}px ${FXF}`;return g.measureText(t).width;}
// 三层线：暖棕 / 中线 / 暖棕（ui-spec 引导统一画法）
function ring3(cx,cy,rx,ry,mid=CREAM,lw=4,a=1){g.save();g.globalAlpha*=a;g.beginPath();g.ellipse(cx,cy,Math.max(1,rx),Math.max(1,ry),0,0,7);g.strokeStyle=BROWN;g.lineWidth=lw+4;g.stroke();g.strokeStyle=mid;g.lineWidth=lw;g.stroke();g.restore();}
function sparkle(x,y,s,a=1){const im=uiImg(s>12?'ui_sparkle_32':'ui_sparkle_24');g.save();g.globalAlpha*=a;
 if(im)g.drawImage(im,x-s,y-s,s*2,s*2);else{g.beginPath();for(let i=0;i<8;i++){const r=i%2?s*.35:s,an=i*Math.PI/4-Math.PI/2;g.lineTo(x+Math.cos(an)*r,y+Math.sin(an)*r);}g.closePath();g.fillStyle=CREAM;g.fill();g.strokeStyle=BROWN;g.lineWidth=1.5;g.stroke();}g.restore();}
function nine(im,x,y,w,h){const c=20,sc=40;const sw=im.width,sh=im.height;const xs=[0,sc,sw-sc,sw],ys=[0,sc,sh-sc,sh],dx=[x,x+c,x+w-c,x+w],dy=[y,y+c,y+h-c,y+h];
 for(let i=0;i<3;i++)for(let j=0;j<3;j++)g.drawImage(im,xs[i],ys[j],xs[i+1]-xs[i],ys[j+1]-ys[j],dx[i],dy[j],dx[i+1]-dx[i],dy[j+1]-dy[j]);}
function primaryBtn(label,x,y,w,fn){const pressed=ptr.down&&ptr.x>x&&ptr.x<x+w&&ptr.y>y&&ptr.y<y+56;const im=uiImg(pressed?'btn_primary_pressed':'btn_primary_normal');
 if(!im){button(label,x,y,w,56,fn);return;}
 g.save();g.shadowColor='rgba(70,45,25,.25)';g.shadowBlur=8;g.shadowOffsetY=2;nine(im,x,y+(pressed?2:0),w,56);g.restore();
 T(label,x+w/2,y+28+(pressed?2:0),2);buttons.push({x,y,w,h:56,fn:()=>{audioInit();SFX.click();buzz(8);fn();}});}
function gearIcon(cx,cy,s=28){const R=s/2;g.save();g.strokeStyle=BROWN;g.lineWidth=2.4;g.lineCap='round';
 for(let i=0;i<8;i++){const a=i*Math.PI/4;g.beginPath();g.moveTo(cx+Math.cos(a)*R*.62,cy+Math.sin(a)*R*.62);g.lineTo(cx+Math.cos(a)*R*.95,cy+Math.sin(a)*R*.95);g.lineWidth=4.2;g.stroke();}
 g.lineWidth=2.4;g.beginPath();g.arc(cx,cy,R*.62,0,7);g.fillStyle='#FFF8EC';g.fill();g.stroke();g.beginPath();g.arc(cx,cy,R*.26,0,7);g.stroke();g.restore();}
function gearCircle(cx,cy){g.beginPath();g.arc(cx,cy,24,0,7);g.fillStyle='#FFF8EC';g.fill();g.strokeStyle=BROWN;g.lineWidth=2;g.stroke();gearIcon(cx,cy,28);
 buttons.push({x:cx-24,y:cy-24,w:48,h:48,fn:()=>{audioInit();SFX.click();S.settings=true;}});}
gearBtn=function(x,y){gearCircle(x+22,y+22);};

// ---------- ① HUD（ui-spec「HUD 方案 C 定稿」v1.4：切图 assets/ui/v14 + slices.json）----------
const HUDC='assets/ui/v14/';
['hud_card_c','hud_capsule_c','hud_tag_c','hud_chip_c','hud_avatar_ring_c','hud_round_c_normal','hud_round_c_pressed','hud_round_c_disabled','icon_coin_32','icon_gear_c_24','icon_gear_c_24_disabled'].forEach(n=>pimg(HUDC+n+'@2x.png'));
function hc(n){return pimg(HUDC+n+'@2x.png');}
// 贴切图：组件 1x 区域 (x,y,w,h)，m=投影外扩（1x）；尺寸和切图一致时整张贴，否则按九宫格拉伸
function slice(n,x,y,w,h,m=0,ns=0){const im=hc(n);if(!im)return false;const X=x-m,Y=y-m,Wd=w+2*m,Ht=h+2*m;
 if(!ns||(Math.abs(im.width-Wd*2)<1&&Math.abs(im.height-Ht*2)<1)){g.drawImage(im,X,Y,Wd,Ht);return true;}
 const sc=ns,c=ns/2,sw=im.width,sh=im.height,xs=[0,sc,sw-sc,sw],ys=[0,sc,sh-sc,sh],dx=[X,X+c,X+Wd-c,X+Wd],dy=[Y,Y+c,Y+Ht-c,Y+Ht];
 for(let i=0;i<3;i++)for(let j=0;j<3;j++)g.drawImage(im,xs[i],ys[j],xs[i+1]-xs[i],ys[j+1]-ys[j],dx[i],dy[j],dx[i+1]-dx[i],dy[j+1]-dy[j]);return true;}
hudAvatar=function(){const id=custOf();const im=id&&portrait(id,patLevel(O.pat,O.d.patMax));const sh=O.patFlash>0?Math.sin(S.t*60)*3*O.patFlash:0;
 if(!im)return false;drawPortraitSq(im,24+sh,56,64,8);slice('hud_avatar_ring_c',24+sh,56,64,64);return true;};
// 耐心条：64×12 圆角 4，永远 4 段×16，2px 暖棕分隔与内描边；有=绿渐变，掉=#E5D6BD，锁（patMax<4）=135° 斜纹 3px #EFE4D1 / 2px #D9C9AE
function patBar(x,y,pat,mx){g.save();rr(x,y,64,12,4);g.clip();
 for(let i=0;i<4;i++){const sx=x+i*16;
  if(i>=mx){const ox=sx+2;g.fillStyle='#EFE4D1';g.fillRect(sx,y,16,12);g.save();g.beginPath();g.rect(ox,y,14,12);g.clip();g.fillStyle='#D9C9AE';
   for(let n=0;n<6;n++){const c1=(5*n+3)*Math.SQRT2,c2=(5*n+5)*Math.SQRT2;g.beginPath();g.moveTo(ox+c1,y);g.lineTo(ox+c2,y);g.lineTo(ox+c2-30,y+30);g.lineTo(ox+c1-30,y+30);g.closePath();g.fill();}g.restore();}
  else if(i<pat){const gr=g.createLinearGradient(0,y,0,y+12);gr.addColorStop(0,'#7FD184');gr.addColorStop(1,'#4FAE56');g.fillStyle=gr;g.fillRect(sx,y,16,12);}
  else{g.fillStyle='#E5D6BD';g.fillRect(sx,y,16,12);}
  if(i>0){g.fillStyle=BROWN;g.fillRect(sx,y,2,12);}}
 g.restore();}
function hudGear(x,y,disabled){const hit=!disabled&&ptr.down&&ptr.x>x&&ptr.x<x+48&&ptr.y>y&&ptr.y<y+48;
 if(!slice(disabled?'hud_round_c_disabled':hit?'hud_round_c_pressed':'hud_round_c_normal',x,y,48,48,12)){gearCircle(x+24,y+24);return;}
 const ic=hc(disabled?'icon_gear_c_24_disabled':'icon_gear_c_24');if(ic)g.drawImage(ic,x+12,y+12,24,24);
 if(!disabled)buttons.push({x,y,w:48,h:48,fn:()=>{audioInit();SFX.click();S.settings=true;}});}
function payText(v){return v>=1000?String(v):'¥'+v;}
// y 为 CSS 行盒中心；+0.5/+1 是 canvas middle 基线与 CSS 行高居中的差，按高保真实测校正
function TC(t,x,y,px,color,align){g.font=`700 ${px}px ${FXF}`;g.textAlign=align;g.textBaseline='middle';g.fillStyle=color;g.fillText(t,x,y);}
drawHUD=function(){
 if(O){slice('hud_card_c',16,48,80,104,12)||(rr(16,48,80,104,16),g.fillStyle='rgba(48,32,20,.75)',g.fill());
  if(!hudAvatar()){avatar(custOf()||'hero',56,88,32);}
  patBar(24,132,O.pat,O.d.patMax||4);
  if(O.patFlash>0)O.patFlash-=1/60;}
 // 金币胶囊 160×48：金币 32（上下左 8），数字 T2 白，右对齐右留 16
 const cx=W-16-160;slice('hud_capsule_c',cx,48,160,48,12);
 const coin=hc('icon_coin_32');if(coin)g.drawImage(coin,cx+8,56,32,32);
 TC(String(S.money),W-16-16,73,20,'#FFFFFF','right');
 // 第二行：本单牌 104×48（四边 12）+ ⚙ 48
 hudGear(W-16-48,104,false);
 if(O){const tx=W-16-48-8-104;slice('hud_tag_c',tx,104,104,48,12);slice('hud_chip_c',tx+12,116,32,24);
  TC('本单',tx+12+16,128.5,12,'#E9D9C0','center');TC(payText(O.d.base),tx+12+32+8+20,128.5,16,'#FFD45E','center');}
 if(O&&!O.lock&&S.screen==='play'&&!S.ad&&!S.callUI)drawMasterBtn();
};
// ---------- 气泡 / 操作提示 ----------
function wrapT4(t,maxW){g.font=`700 14px ${FXF}`;const out=[];let cur='';for(const ch of t){if(g.measureText(cur+ch).width>maxW&&cur){out.push(cur);cur=ch;}else cur+=ch;}if(cur)out.push(cur);return out.slice(0,2);}
function bubble(t,tail,a=1){const L=wrapT4(t,208);g.font=`700 14px ${FXF}`;const w=Math.max(...L.map(l=>g.measureText(l).width))+32,h=L.length*20+24;
 g.save();g.globalAlpha=a;g.shadowColor='rgba(70,45,25,.25)';g.shadowBlur=8;g.shadowOffsetY=2;rr(16,160,w,h,16);g.fillStyle='#FFFFFF';g.fill();g.restore();
 g.save();g.globalAlpha=a;rr(16,160,w,h,16);g.strokeStyle=BROWN;g.lineWidth=2;g.stroke();
 if(tail){g.beginPath();g.moveTo(16+24-7,161);g.lineTo(16+24,152);g.lineTo(16+24+7,161);g.fillStyle='#FFFFFF';g.fill();g.beginPath();g.moveTo(16+24-7,160);g.lineTo(16+24,152);g.lineTo(16+24+7,160);g.strokeStyle=BROWN;g.stroke();}
 L.forEach((l,i)=>T(l,32,160+12+10+i*20,4,BROWN,'left'));g.restore();}
drawHintBubble=function(){if(!O||O.hintT<=0||!O.hint)return;bubble(O.hint,O.hint.startsWith('“'),Math.min(1,O.hintT*2));};
// ---------- 点击引导：双线圆 + 手 ----------
function tapGuide(x,y,r=32){const c=(S.t%1.2)/1.2;const ring=uiImg('ui_guide_ring');
 const one=(k,a)=>{const s=1+.4*k,al=a*(1-k);if(ring){g.save();g.globalAlpha=al;g.drawImage(ring,x-r*s,y-r*s,r*2*s,r*2*s);g.restore();}else ring3(x,y,r*s,r*s,CREAM,4,al);};
 one(c,1);one((c+.5)%1,.5);
 const tap=c<.15,im=uiImg(tap?'ui_guide_hand_tap':'ui_guide_hand');const fx=x+r*.55,fy=y+r*.55;
 if(im){g.drawImage(im,fx-6.5,fy-3,40,48);}
 else{g.font='34px sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText('👆',fx+12,fy+18+(tap?4:0));}}
drawObserveHint=function(){if(!O||S.screen!=='play')return;drawClogBar();
 if(O.anim||(O.phase!=='observe'&&O.phase!=='verify'))return;tapGuide(FLUSH.x,FLUSH.y);
 if(O.phase==='observe'&&O.d.id===1&&!(O.hintT>0&&O.hint))bubble('先冲一下水，看看什么情况',false);};
drawToilet=(function(orig){return function(){if(!ART.ok)return orig();artToilet();drawWater();};})(drawToilet);
// ---------- 落点高亮 + 节奏引导 ----------
const _drawHeld=drawHeld;
function dropHL(inR){const cx=195.6,cy=500.6,rx=64,ry=72.8;const br=.8+.2*Math.sin(S.t*2*Math.PI/1.2);
 g.save();g.globalAlpha=inR?1:br;g.shadowColor=inR?'rgba(155,224,143,.9)':'rgba(255,212,94,.8)';g.shadowBlur=14;ring3(cx,cy,rx,ry,inR?OKG:CREAM,5);g.restore();
 ring3(cx,cy,rx-10,ry-10,inR?OKG:CREAM,2,inR?.9:br*.7);
 if(inR){held.okT=(held.okT||0)+1/60;[[-80,-40],[78,-30],[60,52]].forEach(([dx,dy],i)=>{const k=((held.okT-i*.1)%1)/.4;if(k>0&&k<1)sparkle(cx+dx,cy+dy,12,Math.sin(k*Math.PI));});}else held.okT=0;}
function rhythmGuide(){const p=O.plunger,R=rhythm(S.upgraded),reb=R.rebounceMs;const an=plAnc(),cx=an.x,cy=an.y,rx=60,ry=36;
 const band=.4*(R.windowMs/2)/reb,perf=.4*(R.perfectWindowMs/2)/reb;
 const ann=(a,b,fill)=>{g.beginPath();g.ellipse(cx,cy,rx*b,ry*b,0,0,7);g.ellipse(cx,cy,rx*a,ry*a,0,0,7);g.fillStyle=fill;g.fill('evenodd');};
 const s=p.bottom?1.4-.4*(p.bt*1000/reb):1.4;const inB=p.bottom&&Math.abs(s-1)<=band;
 ann(1-band,1+band,'rgba(93,187,99,.38)');ann(1-perf,1+perf,'#5DBB63');
 if(O.ghost>0){const o=rhythm(false),ob=.4*(o.windowMs/2)/o.rebounceMs,a=Math.min(1,O.ghost);g.save();g.globalAlpha=a;g.setLineDash([4,4]);g.strokeStyle='#fff';g.lineWidth=1.5;
  [1-ob,1+ob].forEach(k=>{g.beginPath();g.ellipse(cx,cy,rx*k,ry*k,0,0,7);g.stroke();});g.restore();T('窗口变宽了',cx,cy-ry*1.4-12,5,'#FFFFFF');}
 g.save();if(inB){g.shadowColor='rgba(155,224,143,1)';g.shadowBlur=16;}ring3(cx,cy,rx,ry,inB?OKG:CREAM,4);g.restore();
 if(s>.85)ring3(cx,cy,rx*s,ry*s,GOLD,4,p.bottom?1:.45);}
drawHeld=function(){if(!held||!O)return _drawHeld();const h=held;
 if(h.attached&&h.id==='plunger'){rhythmGuide();const an=plAnc();drawPlunger(an.x,an.y,O.plunger.comp,S.upgraded,an.s);return;}
 if(!h.attached&&(h.id==='plunger'||h.id==='snake')){const inR=dist(h.x,h.y,BOWL.x,BOWL.y-20)<snapR()+40;dropHL(inR);
  h.snapK=lerp(h.snapK||0,inR?1:0,.25);const sc=1+h.pop*.2;const an=plAnc(),x=lerp(h.x,an.x,h.snapK*.85),y=lerp(h.y+40,an.y,h.snapK*.85);
  if(h.id==='plunger')drawPlunger(x,y,0,S.upgraded,lerp(sc,an.s,h.snapK));else drawSnake(x,y,0,sc);return;}
 _drawHeld();};
const FXT=[];function fxText(q){FXT.push({q,t:0});}
function drawFxText(){for(let i=FXT.length-1;i>=0;i--){const f=FXT[i];f.t+=1/60;if(f.t>1){FXT.splice(i,1);continue;}const a=Math.min(1,(1-f.t)*3),y=420-f.t*24;g.save();g.globalAlpha=a;
 if(f.q==='perfect'||f.q==='good'){const t=f.q==='perfect'?'完美!':'好!';g.font=`700 40px ${FXF}`;g.textAlign='center';g.textBaseline='middle';g.lineWidth=3;g.strokeStyle=BROWN;g.strokeText(t,BOWL.x,y);g.fillStyle='#5DBB63';g.fillText(t,BOWL.x,y);}
 else{g.font=`700 16px ${FXF}`;const w=g.measureText('再稳点').width+24;rr(BOWL.x-w/2,y-14,w,28,14);g.fillStyle='rgba(255,248,236,.92)';g.fill();T('再稳点',BOWL.x,y,3,'#8A6F5A');}
 g.restore();}}
// ---------- 疏通进度 ----------
function drawClogBar(){if(!O||O.lock||!O.observed||(O.phase!=='work'&&O.phase!=='verify'))return;const n=Math.ceil(O.hpMax),left=Math.max(0,Math.ceil(O.hp-1e-6));
 O.barFx=O.barFx||[];if(O.barPrev==null)O.barPrev=left;if(left<O.barPrev){for(let i=left;i<O.barPrev;i++)O.barFx.push({i,t:.45});O.barPrev=left;}
 const x=131,y=592;rr(x,y,128,24,12);g.fillStyle='#FFF8EC';g.fill();g.strokeStyle=BROWN;g.lineWidth=2;g.stroke();T('疏通',x+8,y+12,5,BROWN,'left');
 const sx=x+40,sw=80;if(n<=6){const gp=4,w=(sw-gp*(n-1))/n;for(let i=0;i<n;i++){const fl=O.barFx.find(f=>f.i===i);rr(sx+i*(w+gp),y+8,w,8,4);
   g.fillStyle=fl?(Math.floor(fl.t*16)%2?'#FFFFFF':'#FFE27A'):i<left?'#5DBB63':'#E6D9C3';g.fill();}}
 else{rr(sx,y+8,sw,8,4);g.fillStyle='#E6D9C3';g.fill();const k=clamp(O.hp/O.hpMax,0,1);if(k>0){rr(sx,y+8,sw*k,8,4);g.fillStyle=O.barFx.length?'#FFE27A':'#5DBB63';g.fill();}}
 O.barFx=O.barFx.filter(f=>(f.t-=1/60)>0);}
// ---------- 喂信通知条（ui-spec：两单之间 / 过场，top556，从手机弹出） ----------
let notifyVis=false;
function drawNotify2(m,t,onTap,extra=0){const PX=W-48,PY=H-80,x=16,y=556,w=W-32,h=64;let e;
 if(t<.25){const u=t/.25;e=u<.7?u/.7*1.05:1.05-(u-.7)/.3*.05;}else if(t<3.25)e=1;else if(t<3.5)e=1-(t-3.25)/.25;else return false;
 notifyVis=true;const cx=lerp(PX,x+w/2,Math.min(1,e)),cy=lerp(PY,y+h/2,Math.min(1,e));g.save();g.translate(cx,cy);g.scale(e,e);g.translate(-(x+w/2),-(y+h/2));g.globalAlpha=Math.min(1,e*1.5);
 g.save();g.shadowColor='rgba(255,212,94,.9)';g.shadowBlur=10;rr(x-4,y-4,w+8,h+8,20);g.fillStyle='rgba(255,212,94,.6)';g.fill();g.restore();rr(x-4,y-4,w+8,h+8,20);g.strokeStyle='rgba(255,212,94,.6)';g.lineWidth=1;g.stroke();rr(x,y,w,h,16);g.fillStyle='#FFFFFF';g.fill();g.strokeStyle=BROWN;g.lineWidth=2;g.stroke();
 wxIcon(x+12,y+12,40);const last=m[m.length-1];const n=m.length+extra;
 const head=appName(),rest=' · '+last.ch+(n>1?` 等 ${n} 条`:'');T(head,x+64,y+20,5,BROWN,'left');T(rest,x+64+TW(head,5),y+20,5,'#8A6F5A','left',false);
 let tx=last.text;const max=w-64-16-56-8;g.font=`700 14px ${FXF}`;if(g.measureText(tx).width>max){while(tx.length&&g.measureText(tx+'…').width>max)tx=tx.slice(0,-1);tx+='…';}T(tx,x+64,y+42,4,BROWN,'left');
 const bx=x+w-16-56,by=y+16;rr(bx,by,56,32,16);g.fillStyle=GOLD;g.fill();g.strokeStyle=BROWN;g.stroke();T('点开',bx+28,by+16,5);
 g.restore();if(e>.9)buttons.push({x,y,w,h,fn:onTap});return true;}
drawBetweenToast=function(){if(!S.toastQ||!S.toastQ.length)return;if(S.screen!=='board'||S.settings||PH.open||S.ad||S.callUI)return;
 S.toastT=(S.toastT||0)+1/60;if(!drawNotify2(S.toastQ,S.toastT,()=>{S.toastQ=null;S.toastT=null;openPhone(phoneTarget());})){S.toastQ=null;S.toastT=null;}};
// 手机：遮罩上面也画；缩回后红点跳 + 金框扩散，直到点开手机
function phoneDeco(){if(PH.open||S.screen==='title'||S.dexCard)return;const c=(S.t%1.6)/1.6;const pulse=PH.unread>0&&canOpenPhone()&&!notifyVis;
 if(pulse){g.save();g.translate(W-48,H-80);g.rotate(-10*Math.PI/180);const s=1+.22*c;
  rr(-32*s-4,-48*s-4,64*s+8,96*s+8,14);g.strokeStyle=`rgba(255,212,94,${1-c})`;g.lineWidth=3;g.stroke();
  const s2=1+.22*Math.min(1,c+.25);rr(-32*s2-10,-48*s2-10,64*s2+20,96*s2+20,18);g.strokeStyle=`rgba(255,212,94,${.4*(1-c)})`;g.lineWidth=2;g.stroke();g.restore();}
 phoneArt();if(PH.unread>0){const hop=pulse&&c<.2?-4*Math.sin(c/.2*Math.PI):0;const t=String(PH.unread),w=Math.max(20,TW(t,5)+10);rr(W-22-w/2,H-134+hop,w,20,10);g.fillStyle='#D9413A';g.fill();T(t,W-22,H-124+hop,5,'#FFFFFF');}
 notifyVis=false;}
phoneBtn=(function(orig){return function(){orig();phoneDeco();drawFxText();};})(phoneBtn);
// ---------- 接单（路上过场）----------
drawBrief=function(){const d=O.d,M=orderMsg(d);
 if(!O.msgIn&&!M.urgent&&M.who){O.msgIn=true;O.briefT=0;deliver({channel:'dm_'+M.who,sender:M.who,raw:M.text});SFX.notify();buzz([15,60,15]);O.extra=(S.toastQ||[]).length;S.toastQ=null;S.toastT=null;}
 if(!O.callAccepted){O.briefT=(O.briefT||0)+1/60;
  if(M.urgent){O.ringT=(O.ringT||0);if(O.ringT<=0){O.ringT=1.4;SFX.ring();}O.ringT-=1/60;
   panel(200,330);const k=1+Math.sin(S.t*12)*.04;g.save();g.translate(W/2,300);g.scale(k,k);avatar(M.who,0,0,38);g.restore();
   T(cname(M.who),W/2,362,2);T('急单来电…',W/2,392,4,'#D9413A');
   button('📞 接听',W/2-80,488,160,48,()=>{O.callAccepted=true;},'#4fc26f','#fff');return;}
  const accept=()=>{O.callAccepted=true;readChat('dm_'+M.who);SFX.click();};
  buttons.push({x:0,y:0,w:W,h:H,fn:accept});
  if(O.briefT>.3)drawNotify2([{ch:cname(M.who),text:M.text}],O.briefT-.3,accept,O.extra||0);
  return;}
 panel(200,330);
 T(M.urgent?'急单':appName()+' · '+cname(M.who),W/2,236,5,M.urgent?'#D9413A':'#8A6F5A');T(d.place,W/2,272,2);
 const im=portrait(custOf(),1,true);if(im)drawPortraitSq(im,W/2-32,296,64,8);else{g.font='54px sans-serif';g.textAlign='center';g.fillText(d.face,W/2,335);}
 T(d.who,W/2,380,5,'#8A6F5A');
 const L=wrapT4(`“${M.text}”`,W-100);L.forEach((l,i)=>T(l,W/2,408+i*20,4));
 T(`工钱 ¥${d.base}`+(d.isCall?`（来电单 ×${d.payX}）`:''),W/2,456,5,'#5DBB63');
 button('上门',W/2-80,488,160,48,()=>{goReveal();},'#ffb53d');};
// ---------- 到门口（楼道过场 / 赵姐家门口）----------
const _drawReveal=drawReveal;
drawReveal=function(){const d=O.d;if(revealImg(d.key))return _drawReveal();const bgN=d.key==='lock_referral_1'?'doorway_zhao':'trans_stairwell';if(!fullBg(bgN))return _drawReveal();
 const client=d.client||((NAR.orders[d.key]||{}).client);const k=Math.min(1,S.revealT*3);
 g.fillStyle='rgba(43,30,20,.35)';g.fillRect(0,0,W,H);
 const im=client&&portrait(client,1,true);if(im){g.save();g.globalAlpha=k;drawPortraitSq(im,W/2-48,300,96,16);g.restore();}
 rr(24,416,W-48,d.line?156:72,24);g.fillStyle='#FFF8EC';g.fill();g.strokeStyle=BROWN;g.lineWidth=2;g.stroke();
 T(d.who,W/2,452,2);if(d.line){const L=wrapT4('“'+d.line+'”',W-96);L.forEach((l,i)=>T(l,W/2,492+i*20,4));}
 if(S.revealT>.4)T('点一下进门',W/2,d.line?548:470,5,'#8A6F5A');
 buttons.push({x:0,y:0,w:W,h:H,fn:()=>{if(S.revealT<.3)return;SFX.click();S.screen=O.lock?'lock':'play';}});};
// ---------- 早上 / 晚上 ----------
drawBoardBg=function(){if(!fullBg(S.screen==='board'?'trans_morning':'trans_evening')){g.fillStyle='#efe2c4';g.fillRect(0,0,W,H);}
 rr(16,48,W-32-56,48,24);g.fillStyle='#FFF8EC';g.fill();g.strokeStyle=BROWN;g.lineWidth=2;g.stroke();
 g.beginPath();g.arc(40,72,16,0,7);g.fillStyle='#FFC83D';g.fill();g.stroke();T('¥',40,73,4);T(String(S.money),64,73,2,BROWN,'left');T(`第 ${G2.day} 天`,W-16-56-16,73,4,'#8A6F5A','right');
 gearCircle(W-16-24,72);};
const _drawEnd=drawEnd;drawEnd=function(){if(S.day===1)fullBg('trans_evening');_drawEnd();};
// ---------- 首页 ----------
const _drawTitle=drawTitle;
drawTitle=function(){if(!fullBg('title_bg'))return _drawTitle();const logo=uiImg('logo_title');
 if(logo)g.drawImage(logo,195-170,175-100,340,200);else{otxt('重生之我在',W/2,170,30,'#fff8eb');otxt('澳洲修马桶',W/2,215,42,'#ffcf3f');}
 primaryBtn('开工',W/2-90,560,180,()=>{S.money=0;S.spent=0;S.idx=0;S.upgraded=false;S.dex=[];S.times={};phoneReset();S.masterFree=0;S.doubleToday=0;S.giftToday=0;G2reset();startOrder(0);goTrans('trans_morning',()=>{S.screen='brief';});});
 T('建议用手机竖屏打开，戴耳机体验更好',W/2,656,5,'#FFF3DA','center',false);
 gearCircle(W/2,712);};
// ---------- 美术 bowl_geometry_v2：积水贴合碗、纸团、鸭子、皮搋子落点、水桶 ----------
artReady=(function(orig){return function(){orig();if(!ART.ok)return;Object.assign(BOWL,{x:195.6,y:500.6});Object.assign(INNER,{rx:68,ry:76.8});WATER_Y=519;Object.assign(BUCKET,{x:330,y:515});};})(artReady);
function fullK(){return O?clamp((O.water-.55)/.3,0,1):0;}
function plAnc(){const k=fullK();return {x:lerp(195,195.6,k),y:lerp(523,512,k),s:lerp(64/68,1,k)};} // 胶头最宽：正常 64，满水 ≤96
artToilet=function(){A('toilet_bowl');A('toilet_bowl_inner');if(!O)return;const l=O.water,sl=O.slosh||0,k=fullK();
 if(l<.8)A('water_waterline_mark');
 A('water_surface_normal',{x:195.8+sl});if(k>0)A('water_surface_full',{x:195.8+sl,a:k}); // 水位变化：满水图淡入叠在正常水位上
 if(l>=.8){const s=.95+.05*Math.sin(S.t*3);A('water_ripple_ring',{s,a:.6+.3*Math.sin(S.t*2)});
  if(Math.random()<.03)parts.push({x:195+rnd(-50,50),y:500+rnd(-6,6),vx:rnd(-20,20),vy:-30,life:.6,color:'#cdeeff',r:3,g:300});}
 if(O.d.clog==='soft'&&O.hp>0&&O.observed)A(l>=.8?'clog_paper_deep':'clog_paper',{a:.35+.6*(O.hp/O.hpMax)});
 if(O.d.clog==='hard'&&O.hp>0&&!O.objOut)A('clog_duck_silhouette',{a:O.observed?.55+.15*Math.sin(S.t*2):.25});};
drawWater=(function(orig){return function(){if(!ART.ok)return orig();if(!O)return;const full=O.water>=.8,cx=full?195.6:194.3,cy=full?500.6:519,rx=full?60:34,ry=full?68:34;
 g.save();g.beginPath();g.ellipse(195.6,500.6,68,76.8,0,0,7);g.clip();
 const sw=O.swirl+(O.d.clog==='soft'&&O.observed&&O.hp>0?.25:0);
 if(sw>0){g.strokeStyle=`rgba(255,255,255,${Math.min(.85,sw*.45)})`;g.lineWidth=3;g.lineCap='round';for(let i=0;i<3;i++){g.beginPath();const a0=S.t*(1+sw*2)+i*2.1;g.ellipse(cx,cy,rx*(.35+i*.22),ry*(.35+i*.22),0,a0,a0+1.6);g.stroke();}g.lineCap='butt';}
 g.restore();
 if(O.reveal>0){const a=Math.min(1,O.reveal)*(.6+.4*Math.sin(S.t*10));if(masterFault()==='high_water')ring3(195.6,500.6,64,72.8,GOLD,4,a);else ring3(196.2,518,O.d.clog==='hard'?30:40,O.d.clog==='hard'?20:26,GOLD,3,a);}};})(drawWater);
// ---------- 过场（叙事 transitions；ui-spec：图淡入 0.3s 后出字，字停 2.5s，点任意处跳过）----------
function knock(){if(!AC||save.muted)return;[0,.18,.5].forEach(d=>{noise(.09,.35,380,'lowpass',d);tone(110,.12,'sine',.25,70,d);});}
function goTrans(key,next){if(window.__noTrans){next&&next();return;}const tr=((NAR&&NAR.transitions)||{})[key]||{bg:key};let line=null;
 if(tr.line&&tr.line.pool){const pool=((NAR.workday_beats||{})[tr.line.pool.split('.')[1]])||[];if(Math.random()<(tr.line.chance??.5)&&pool.length){const m=pick(pool);line={style:'weixin_preview',sender:m.sender,text:m.text};}}
 else if(tr.line)line=tr.line;
 if(tr.alt_lines&&tr.alt_lines.length){const day=S.day||1;if(day-(save.dadLineDay??-99)>=3&&Math.random()<.34){line=tr.alt_lines[0];save.dadLineDay=day;persist();}}
 S.trans={key,bg:tr.bg||key,line,t:0,next,sfx:tr.sfx};S.screen='trans';if(tr.sfx==='knock_door')knock();}
function endTrans(){const tr=S.trans;if(!tr)return;S.trans=null;tr.next&&tr.next();}
function drawTrans(){const tr=S.trans;const a=Math.min(1,tr.t/.3);g.fillStyle='#2B1E14';g.fillRect(0,0,W,H);g.save();g.globalAlpha=a;fullBg(tr.bg);g.restore();
 const dur=tr.line?3.0:1.4;if(tr.t>dur){endTrans();return;}
 if(tr.line&&tr.t>.3){const t=tr.t-.3,k=Math.min(1,t/.25,(2.5-t)/.25);if(k>0){const y=H-48-64;g.save();g.globalAlpha=k;g.translate(0,(1-Math.min(1,t/.25))*40);
  if(tr.line.style==='bubble'){const who=cname(tr.line.sender)+'：',L=wrapT4(who+tr.line.text,208);g.font=`700 14px ${FXF}`;const w=Math.max(...L.map(l=>g.measureText(l).width))+32,h=L.length*20+24,by=H-48-h;
    rr(16,by,w,h,16);g.fillStyle='#FFFFFF';g.fill();g.strokeStyle=BROWN;g.lineWidth=2;g.stroke();g.beginPath();g.moveTo(33,by+h-1);g.lineTo(40,by+h+8);g.lineTo(47,by+h-1);g.fillStyle='#FFFFFF';g.fill();g.beginPath();g.moveTo(33,by+h);g.lineTo(40,by+h+8);g.lineTo(47,by+h);g.stroke();
    L.forEach((l,i)=>{if(i===0&&l.startsWith(who)){T(who,32,by+22,4,'#8A6F5A','left');T(l.slice(who.length),32+TW(who,4),by+22,4,BROWN,'left');}else T(l,32,by+22+i*20,4,BROWN,'left');});}
  else{const x=16,w=W-32,h=64;rr(x,y,w,h,16);g.fillStyle='#FFFFFF';g.fill();g.strokeStyle=BROWN;g.lineWidth=2;g.stroke();wxIcon(x+12,y+12,40);
   const head=appName();T(head,x+64,y+20,5,BROWN,'left');T(' · '+cname(tr.line.sender),x+64+TW(head,5),y+20,5,'#8A6F5A','left',false);
   let tx=tr.line.text;const max=w-64-16;g.font=`700 14px ${FXF}`;if(g.measureText(tx).width>max){while(tx.length&&g.measureText(tx+'…').width>max)tx=tx.slice(0,-1);tx+='…';}T(tx,x+64,y+42,4,BROWN,'left');}
  g.restore();}}
 buttons.push({x:0,y:0,w:W,h:H,fn:()=>{if(tr.t>.15){SFX.click();endTrans();}}});}
draw=(function(orig){return function(){if(S.screen==='trans'&&S.trans){buttons=[];g.setTransform(SC*DPR,0,0,SC*DPR,0,0);g.clearRect(0,0,W,H);drawTrans();return;}orig();};})(draw);
update=(function(orig){return function(dt){if(S.screen==='trans'&&S.trans){S.trans.t+=dt;return;}orig(dt);};})(update);
// 早上：开工 / 新的一天；路上：上门；晚上：收工前
G2nextDay=(function(orig){return function(){orig();goTrans('trans_morning',()=>{S.screen='board';S.boardT=0;});};})(G2nextDay);
G2dayEnd=(function(orig){return function(){orig();goTrans('trans_evening',()=>{S.screen='end';});};})(G2dayEnd);
goReveal=(function(orig){return function(){orig();if(O&&O.lock&&O.d.key!=='lock_referral_1')return; // 王阿姨顺手单在原地，不走路上
 goTrans('trans_road',()=>{S.screen='reveal';S.revealT=0;knock();});};})(goReveal);
