'use strict';
// ===== 重生之我在澳洲修马桶 · G1 玩法原型 =====
const W=390,H=780;
const cv=document.getElementById('c'),g=cv.getContext('2d');
let SC=1,DPR=1;
function resize(){DPR=Math.min(window.devicePixelRatio||1,3);SC=Math.min(innerWidth/W,innerHeight/H);
cv.style.width=W*SC+'px';cv.style.height=H*SC+'px';cv.width=W*SC*DPR;cv.height=H*SC*DPR;cv.style.marginTop=Math.max(0,(innerHeight-H*SC)/2)+'px';}
addEventListener('resize',resize);resize();

// ---------- 存档 / 设置 ----------
const SAVE_KEY='toilet_g1_v1';
let save=JSON.parse(localStorage.getItem(SAVE_KEY)||'null')||{muted:false,reduced:false,best:{}};
function persist(){localStorage.setItem(SAVE_KEY,JSON.stringify(save));}

// ---------- 音效（Web Audio 合成，无素材依赖） ----------
let AC=null;
function audioInit(){if(AC)return;try{AC=new (window.AudioContext||window.webkitAudioContext)();}catch(e){}}
function tone(f,d,type='sine',v=.3,f2=null,delay=0){if(!AC||save.muted)return;const t=AC.currentTime+delay,o=AC.createOscillator(),gn=AC.createGain();
o.type=type;o.frequency.setValueAtTime(f,t);if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+d);gn.gain.setValueAtTime(v,t);gn.gain.exponentialRampToValueAtTime(.001,t+d);
o.connect(gn).connect(AC.destination);o.start(t);o.stop(t+d+.02);}
let noiseBuf=null;
function noise(d,v=.3,freq=1000,ft='lowpass',delay=0){if(!AC||save.muted)return;if(!noiseBuf){noiseBuf=AC.createBuffer(1,AC.sampleRate,AC.sampleRate);const a=noiseBuf.getChannelData(0);for(let i=0;i<a.length;i++)a[i]=Math.random()*2-1;}
const t=AC.currentTime+delay,s=AC.createBufferSource(),f=AC.createBiquadFilter(),gn=AC.createGain();s.buffer=noiseBuf;f.type=ft;f.frequency.value=freq;
gn.gain.setValueAtTime(v,t);gn.gain.exponentialRampToValueAtTime(.001,t+d);s.connect(f).connect(gn).connect(AC.destination);s.start(t);s.stop(t+d+.02);}
const SFX={
 pick(){tone(520,.07,'sine',.2,900);},
 snap(){tone(260,.06,'square',.08);noise(.06,.15,2500,'highpass');},
 seal(){noise(.12,.25,500);tone(140,.12,'sine',.25,80);},
 perfect(){tone(200,.28,'sine',.55,55);noise(.22,.4,900);tone(700,.08,'triangle',.15,1100,.05);},
 weak(){noise(.22,.18,2500,'highpass');},
 thud(){tone(95,.14,'sine',.6,45);tone(90,.12,'sine',.45,45,.13);},
 splash(){noise(.5,.5,1600,'bandpass');noise(.3,.3,4000,'highpass',.05);},
 fill(){noise(.25,.25,1200);tone(300,.15,'sine',.1,500);},
 pour(){noise(.6,.3,700);},
 gurgle(){for(let i=0;i<9;i++)tone(180+Math.random()*260,.09,'sine',.25,90+Math.random()*80,i*.11);noise(1.1,.25,500);},
 success(){[523,659,784,1047].forEach((f,i)=>tone(f,.18,'triangle',.25,null,i*.08));},
 coin(){tone(988,.07,'square',.12);tone(1319,.14,'square',.12,null,.07);},
 pop(){tone(260,.14,'sine',.5,1300);noise(.08,.3,3000,'highpass');},
 tick(){tone(1400,.025,'square',.05);},
 hook(){tone(1800,.05,'square',.12);tone(900,.06,'square',.1,null,.05);},
 wrong(){tone(220,.12,'square',.12,160);},
 click(){tone(800,.04,'triangle',.15);},
 notify(){tone(1175,.08,'sine',.2);tone(1568,.1,'sine',.2,null,.1);}
};
function buzz(p){if(save.reduced)return;try{navigator.vibrate&&navigator.vibrate(p);}catch(e){}}

// ---------- 订单数据 ----------
// 订单来自 data/orders.json（策划维护），这里只补表现层字段
let ORDERS=[],CFG=null;
const LOOK={o1:{who:'王阿姨',place:'老小区三楼',face:'👵'},o2:{who:'出租屋小刘',place:'城中村单间',face:'🧑'},o3:{who:'李姐',place:'新楼盘两居室',face:'👩'},o4:{who:'出租屋小刘',place:'城中村单间',face:'🧑'}};
function buildOrders(c){CFG=c;ORDERS=c.orders.map((o,i)=>({id:i+1,key:o.id,who:LOOK[o.id].who,place:LOOK[o.id].place,face:LOOK[o.id].face,line:o.customerLine,
 water:o.waterLevel,clog:o.fault,hp:o.fault==='hard'?1:3,base:o.basePay,tip:o.tipMax,hurry:!!o.urgent,obj:o.object==='rubber_duck'?'duck':null,
 tools:i===0?['plunger']:i===1?['plunger','scoop']:['plunger','scoop','snake']}));}
fetch('data/orders.json').then(r=>r.json()).then(buildOrders);
const PHONE_AFTER={
 1:[['相亲相爱一家人','三姨：家里马桶又堵了，烦死了！'],['相亲相爱一家人','阿杰：哈哈哈 @你 这不专业对口了吗？']],
 2:[['妈妈','中午吃饭没？别光顾着干活。']],
 3:[['大壮','听说你今天钩出只鸭子？哈哈牛']],
 4:[['王阿姨','小师傅，我家门把手也不太灵，下回顺便看看？']]
};
const TOOLS={plunger:{name:'皮搋子'},scoop:{name:'水瓢'},snake:{name:'弹簧疏通器'}};

// ---------- 布局常量 ----------
const BOWL={x:195,y:405,rx:138,ry:82},INNER={rx:110,ry:62},WATER_Y=415;
const FLUSH={x:195,y:178,r:22};
const BUCKET={x:338,y:585,r:38};
const TRAY_Y=690,SLOTS=[85,195,305];

// ---------- 全局状态 ----------
const S={screen:'title',money:0,idx:0,upgraded:false,skipUp:false,dex:[],times:{},phoneQueue:[],t:0};
let O=null; // 当前订单运行态
let held=null; // 正在拿的工具
let parts=[],floats=[],shake=0,hitstop=0,flashes=[];
let ptr={down:false,x:0,y:0,sx:0,sy:0};
let buttons=[];

function rnd(a,b){return a+Math.random()*(b-a);}
function clamp(v,a,b){return v<a?a:v>b?b:v;}
function lerp(a,b,t){return a+(b-a)*t;}
function dist(ax,ay,bx,by){return Math.hypot(ax-bx,ay-by);}
function float(text,x,y,color='#fff',size=22){floats.push({text,x,y,color,size,life:1.1});}
function burst(x,y,n,color,sp=180,r=4){for(let i=0;i<n;i++){const a=rnd(0,Math.PI*2),v=rnd(sp*.3,sp);parts.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-60,life:rnd(.4,.9),color,r:rnd(r*.5,r*1.4),g:400});}}
function doShake(v){if(!save.reduced)shake=Math.max(shake,v);}

// ---------- 订单流程 ----------
function startOrder(i){
 const d=ORDERS[i];
 O={d,water:d.water,wTarget:d.water,hp:d.hp,hpMax:d.hp,phase:'observe',tip:d.tip,penalties:[],observed:false,anim:null,
  plunger:{comp:0,bottom:false,bt:0,ctrl:false,y0:0,hardHits:0},snake:{depth:0,ang:null,hooked:false,pull:0,y0:0,spin:0},
  scoopFull:false,startT:null,elapsed:0,hint:null,hintT:0,hardHint:false,splashed:0,objOut:null,face:'😐',ghost:0,swirl:0};
 held=null;S.screen='brief';
}
function lockTools(){return !O||O.phase!=='work'||O.anim;}
function penalty(n,why){O.tip=Math.max(0,O.tip-n);O.face='😠';float('-¥'+n+' 小费',BOWL.x,150,'#ff8a7a',18);setTimeout(()=>{if(O&&O.face==='😠')O.face='😟';},1200);}
function say(t,dur=2.4){O.hint=t;O.hintT=dur;}

function observeFlush(){
 SFX.click();noise(.8,.25,900);O.anim={type:'obs',t:0,dur:1.8};O.startT=O.startT??S.t;
 if(O.d.clog==='hard'){setTimeout(()=>{if(O){SFX.thud();}},900);}
 if(O.water>.8)setTimeout(()=>{if(O){O.face='😱';say('（水差点漫出来……先别冲了）');}},600);
}
function verifyFlush(){
 SFX.click();SFX.gurgle();O.anim={type:'win',t:0,dur:1.6};O.elapsed=S.t-O.startT;buzz([30,40,60]);
}
function clogCleared(){
 O.hp=0;O.wTarget=.36;O.swirl=1.5;SFX.gurgle();buzz(60);doShake(6);
 burst(BOWL.x,WATER_Y,24,'#bfe9ff',220,5);float('通了！',BOWL.x,330,'#7dffb0',30);
 setTimeout(()=>{if(!O)return;returnTool();O.phase='verify';O.face='🙂';},700);
}
function returnTool(){if(held){held=null;}}
function finishOrder(){
 const d=O.d,total=d.base+O.tip;S.times[d.id]=O.elapsed;
 S.result={d,base:d.base,tip:O.tip,total,elapsed:O.elapsed,pen:O.penalties,coinsShown:0,face:O.tip>=d.tip*.8?'👍':'🙂'};
 S.screen='result';S.resultT=0;
 const msgs=PHONE_AFTER[d.id]||[];S.phoneQueue=msgs.slice();
 if(d.obj&&!S.dex.includes(d.obj))S.dex.push(d.obj);
}

// ---------- 工具交互 ----------
function snapR(){return S.upgraded?90:60;}
function pickTool(id){
 if(lockTools())return;
 if(!O.d.tools.includes(id)){return;}
 audioInit();SFX.pick();buzz(8);
 held={id,x:ptr.x,y:ptr.y,attached:false,pop:1,scoopFull:false};
 O.plunger.comp=0;O.plunger.bottom=false;O.plunger.ctrl=false;
 O.snake.depth=0;O.snake.hooked=false;O.snake.pull=0;O.snake.ang=null;
}
function wrongTool(msg){SFX.wrong();buzz([20,30,20]);doShake(4);held.bounce=1;say(msg);}
function tryAttach(){
 const h=held;const d=dist(h.x,h.y,BOWL.x,BOWL.y-20);
 if(d<snapR()+40){
  h.attached=true;if(h.id==='snake')O.usedSnake=true;h.x=BOWL.x;h.y=BOWL.y;SFX.snap();buzz(15);burst(BOWL.x,WATER_Y,10,'#d8f3ff',120,3);
  if(h.id==='plunger'&&S.upgraded&&O.d.id===4&&!O.ghostShown){O.ghost=1.6;O.ghostShown=true;}
  return true;}
 return false;
}
function plungerUpdate(dt){
 const p=O.plunger;
 if(!p.ctrl)p.comp=Math.max(0,p.comp-dt*3.2);
 const ws=.16,wl=S.upgraded?.62:.3;
 if(O.water>.6&&p.comp>.45){ // 满水直接按：溅
  SFX.splash();buzz([40,30,60]);doShake(10);for(let i=0;i<40;i++)parts.push({x:BOWL.x+rnd(-90,90),y:WATER_Y-10,vx:rnd(-260,260),vy:rnd(-420,-150),life:rnd(.6,1.1),color:'#8fd3f4',r:rnd(3,7),g:900});
  O.splashed++;if(O.splashed<=2)penalty(4,'splash');O.penalties.push('溅水');
  say('水太满了，一压就溅一地……');held=null;p.comp=0;p.ctrl=false;O.face='😱';return;}
 if(p.comp>.86&&!p.bottom){p.bottom=true;p.bt=0;SFX.seal();buzz(12);}
 if(p.bottom){p.bt+=dt;}
 if(p.bottom&&p.comp<.35){
  p.bottom=false;const bt=p.bt;let q;
  if(bt<ws)q='early';else if(bt<=ws+wl)q='perfect';else q='late';
  if(O.d.clog==='hard'){
   SFX.thud();buzz([25,40,25]);doShake(3);burst(BOWL.x+rnd(-20,20),WATER_Y,4,'#e6f7ff',60,4);float('咚',BOWL.x+40,WATER_Y-60,'#ddd',24);
   p.hardHits++;if(p.hardHits>=2&&!O.hardHint){O.hardHint=true;say('咚咚的……底下好像卡着硬东西');penalty(3);O.penalties.push('工具不对');}
   return;}
  let dmg=q==='perfect'?(S.upgraded?2:1):.3;
  if(q==='perfect'){SFX.perfect();buzz(35);doShake(5);burst(BOWL.x,WATER_Y,16,'#cdeeff',200,5);float(S.upgraded?'完美 ×2!':'完美!',BOWL.x+70,WATER_Y-80,'#7dffb0',26);
   flashes.push({x:BOWL.x,y:WATER_Y,r:20,life:.5});}
  else{SFX.weak();float(q==='early'?'太急，漏气了':'太慢，没劲了',BOWL.x+60,WATER_Y-70,'#ffd36b',18);buzz(8);}
  O.hp-=dmg;O.wTarget=Math.max(.38,O.wTarget-.04*dmg);O.swirl=Math.min(2,O.swirl+.4*dmg);
  if(O.hp<=0)clogCleared();
 }
}
function snakeMove(){
 const s=O.snake;const a=Math.atan2(ptr.y-BOWL.y,ptr.x-BOWL.x);
 if(!s.hooked){
  if(s.ang!==null){let d=a-s.ang;if(d>Math.PI)d-=Math.PI*2;if(d<-Math.PI)d+=Math.PI*2;
   const before=s.depth;s.depth=Math.min(1,s.depth+Math.abs(d)/(Math.PI*2*2.2));s.spin+=d;
   if(Math.floor(before*12)!==Math.floor(s.depth*12)){SFX.tick();buzz(5);}
   if(s.depth>=1){
    if(O.d.clog==='hard'){s.hooked=true;s.y0=ptr.y;SFX.hook();buzz([20,20,40]);doShake(5);say('钩住了！往上拉！',2);}
    else{clogCleared();}
   }}
  s.ang=a;
 }else{
  s.pull=clamp((s.y0-ptr.y)/170,0,1);
  if(s.pull>=1)popObject();
 }
}
function popObject(){
 SFX.pop();buzz([50,30,100]);doShake(14);hitstop=save.reduced?0:.28;
 O.objOut={x:BOWL.x,y:WATER_Y-40,vy:-520,rot:0,t:0};burst(BOWL.x,WATER_Y,40,'#bfe9ff',320,6);burst(BOWL.x,WATER_Y,14,'#ffd84a',260,5);
 O.face='😳';say('……小黄鸭？！',2.2);
 setTimeout(()=>{if(O){S.dexCard={name:'小黄鸭',line:'李姐：“我说他怎么洗澡不闹了……”',t:0};}},500);
 clogCleared();
}
function scoopMove(){
 const h=held;
 const inWater=((h.x-BOWL.x)**2/(INNER.rx**2)+(h.y-WATER_Y)**2/(INNER.ry**2))<1;
 if(inWater&&!h.scoopFull){
  if(O.water>.4){h.scoopFull=true;O.water-=.2;O.wTarget=O.water;SFX.fill();buzz(15);burst(h.x,h.y,8,'#bfe9ff',120,3);
   if(O.water<=.6&&O.water+.2>.6){say('水位安全了，可以下工具了',1.8);}}
  else if(!h.scraped){h.scraped=true;float('舀不动了',h.x,h.y-30,'#ddd',16);}
 }
 if(!inWater)h.scraped=false;
 if(h.scoopFull&&dist(h.x,h.y,BUCKET.x,BUCKET.y-20)<55){h.scoopFull=false;SFX.pour();buzz(10);burst(BUCKET.x,BUCKET.y-30,10,'#bfe9ff',100,3);}
}

// ---------- 输入 ----------
function toLogical(e){const r=cv.getBoundingClientRect();return{x:(e.clientX-r.left)/SC,y:(e.clientY-r.top)/SC};}
cv.addEventListener('pointerdown',e=>{e.preventDefault();audioInit();if(AC&&AC.state==='suspended')AC.resume();
 const p=toLogical(e);ptr={down:true,x:p.x,y:p.y,sx:p.x,sy:p.y};
 for(const b of buttons.slice().reverse()){if(p.x>b.x&&p.x<b.x+b.w&&p.y>b.y&&p.y<b.y+b.h){b.fn();return;}}
 if(S.screen==='play')playDown(p);
});
cv.addEventListener('pointermove',e=>{e.preventDefault();const p=toLogical(e);ptr.x=p.x;ptr.y=p.y;if(S.screen==='play'&&ptr.down)playMove(p);});
const up=e=>{e.preventDefault();ptr.down=false;if(S.screen==='play')playUp();};
cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up);
document.addEventListener('gesturestart',e=>e.preventDefault());

function playDown(p){
 if(!O||O.anim||hitstop>0)return;
 if(S.dexCard)return;
 if(dist(p.x,p.y,FLUSH.x,FLUSH.y)<FLUSH.r+16){
  if(O.phase==='observe'){observeFlush();return;}
  if(O.phase==='verify'){verifyFlush();return;}
  if(O.phase==='work'){ if(O.water>.8){say('别冲！会漫出来的');O.face='😱';SFX.wrong();} else {noise(.6,.2,900);say('冲不下去，还堵着');} return;}
 }
 if(p.y>TRAY_Y){ // 托盘
  const i=SLOTS.findIndex(x=>Math.abs(p.x-x)<50);if(i<0)return;
  const id=['plunger','scoop','snake'][i];
  if(held&&held.id===id&&held.attached){held=null;SFX.click();return;}
  pickTool(id);return;}
 if(held&&held.attached){
  if(held.id==='plunger'){const pl=O.plunger;pl.ctrl=true;pl.y0=p.y-pl.comp*110;}
  if(held.id==='snake'){const s=O.snake;s.ang=Math.atan2(p.y-BOWL.y,p.x-BOWL.x);if(s.hooked)s.y0=p.y+s.pull*170;}
 }
}
function playMove(p){
 if(!held||!O)return;
 if(!held.attached){held.x=p.x;held.y=p.y;if(held.id==='scoop')scoopMove();return;}
 if(held.id==='plunger'&&O.plunger.ctrl){O.plunger.comp=clamp((p.y-O.plunger.y0)/110,0,1);}
 if(held.id==='snake')snakeMove();
}
function playUp(){
 if(!held||!O)return;
 if(!held.attached){
  if(held.id==='scoop'){held=null;return;}
  if(!tryAttach()){held=null;}
  return;}
 if(held.id==='plunger')O.plunger.ctrl=false;
 if(held.id==='snake'){O.snake.ang=null;if(O.snake.hooked&&O.snake.pull<1){O.snake.pull=Math.max(0,O.snake.pull-.0);}}
}

// ---------- 更新 ----------
let last=performance.now();
function loop(now){
 let dt=Math.min(.05,(now-last)/1000);last=now;S.t+=dt;
 if(hitstop>0){hitstop-=dt;dt*=.05;}
 update(dt);draw();requestAnimationFrame(loop);
}
function update(dt){
 shake=Math.max(0,shake-dt*40);
 parts=parts.filter(p=>{p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=(p.g||400)*dt;return p.life>0;});
 floats=floats.filter(f=>{f.life-=dt;f.y-=40*dt;return f.life>0;});
 flashes=flashes.filter(f=>{f.life-=dt;f.r+=260*dt;return f.life>0;});
 if(S.dexCard)S.dexCard.t+=dt;
 if(S.screen==='result'){S.resultT+=dt;const r=S.result;const tgt=Math.min(r.total,Math.floor(S.resultT*60));
  if(tgt>r.coinsShown&&S.resultT>.4){if(Math.floor(tgt/5)!==Math.floor(r.coinsShown/5))SFX.coin();r.coinsShown=tgt;}
  if(S.resultT>.4&&!r.paid&&r.coinsShown>=r.total){r.paid=true;S.money+=r.total;buzz(30);}
  if(S.resultT>1.4&&S.phoneQueue.length&&!S.phoneShown){S.phoneShown=true;SFX.notify();buzz([15,60,15]);}}
 if(!O||S.screen!=='play')return;
 if(O.hintT>0)O.hintT-=dt;
 if(O.ghost>0)O.ghost-=dt;
 O.swirl=Math.max(0,O.swirl-dt*.6);
 if(O.d.hurry&&O.phase!=='verify'&&O.startT!=null){O.hurryT=(O.hurryT||0)+dt;if(O.hurryT>7&&O.tip>4){O.hurryT=0;O.tip-=1;O.face='😤';float('-¥1',300,95,'#ff8a7a',14);}}
 // 观察动画
 if(O.anim){const a=O.anim;a.t+=dt;const k=a.t/a.dur;
  if(a.type==='obs'){
   if(O.d.clog==='soft'&&O.d.water<.8)O.water=O.d.water+Math.sin(Math.min(1,k)*Math.PI)*.2;
   else if(O.d.water>=.8)O.water=Math.min(.97,O.d.water+Math.sin(Math.min(1,k)*Math.PI)*.09);
   else O.water=O.d.water+Math.min(1,k*2)*.08;
   if(k>=1){O.anim=null;O.phase='work';O.observed=true;if(O.d.clog==='hard')O.wTarget=O.water;else O.water=O.wTarget;
    if(O.d.id===1)say('皮搋子拖到马桶上，压到底，圈变绿时松手',4);
    if(O.d.id===2)say('',0);}}
  if(a.type==='win'){O.water=lerp(.36,.2,Math.sin(Math.min(1,k)*Math.PI));O.swirl=2;
   if(k>.3&&!a.sp){a.sp=1;SFX.success();burst(BOWL.x,WATER_Y,30,'#fff6a8',260,4);O.face='👍';}
   if(k>=1){O.anim=null;finishOrder();}}
 }else{O.water=lerp(O.water,O.wTarget,dt*2.5);}
 if(held){held.pop=Math.max(0,held.pop-dt*5);if(held.bounce)held.bounce=Math.max(0,held.bounce-dt*3);}
 if(held&&held.attached&&held.id==='plunger')plungerUpdate(dt);
 if(O.objOut){const o=O.objOut;o.t+=dt;o.y+=o.vy*dt;o.vy+=900*dt;o.rot+=dt*6;if(o.y>220&&o.vy>0&&o.t>.5){o.y=220;o.vy=0;o.rot=0;}}
}

// ---------- 绘制工具 ----------
const INK='#4a2f22';
function rr(x,y,w,h,r){g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath();}
function fs(fill,lw=3){g.fillStyle=fill;g.fill();g.lineWidth=lw;g.strokeStyle=INK;g.stroke();}
function txt(t,x,y,size=16,color='#fff',align='center',weight='700'){g.font=`${weight} ${size}px -apple-system,"PingFang SC","Noto Sans CJK SC","Microsoft YaHei",sans-serif`;g.textAlign=align;g.textBaseline='middle';g.fillStyle=color;g.fillText(t,x,y);}
function otxt(t,x,y,size,color){g.font=`800 ${size}px -apple-system,"PingFang SC","Noto Sans CJK SC",sans-serif`;g.textAlign='center';g.textBaseline='middle';g.lineWidth=5;g.strokeStyle=INK;g.strokeText(t,x,y);g.fillStyle=color;g.fillText(t,x,y);}
function button(label,x,y,w,h,fn,color='#ffb53d',tc=INK){rr(x,y,w,h,14);fs(color);txt(label,x+w/2,y+h/2+1,18,tc);buttons.push({x,y,w,h,fn:()=>{audioInit();SFX.click();buzz(8);fn();}});}

function drawBathroom(){
 g.fillStyle='#efe2c4';g.fillRect(0,0,W,330);
 // 墙面褪色斑
 g.fillStyle='rgba(180,150,100,.12)';g.beginPath();g.ellipse(70,120,60,30,0,0,7);g.fill();
 // 窗 + 防盗窗
 rr(22,70,92,96,6);fs('#bfe3f0');g.strokeStyle=INK;g.lineWidth=2;for(let i=1;i<5;i++){g.beginPath();g.moveTo(22+i*18.4,70);g.lineTo(22+i*18.4,166);g.stroke();}
 g.beginPath();g.moveTo(22,118);g.lineTo(114,118);g.stroke();
 // 毛巾架
 g.fillStyle=INK;g.fillRect(300,105,74,5);rr(312,108,44,70,6);fs('#f08a7e',2.5);g.fillStyle='#fff';g.fillRect(314,160,40,5);
 // 墙砖腰线
 g.fillStyle='#a9d3c0';g.fillRect(0,250,W,80);g.strokeStyle='rgba(74,47,34,.25)';g.lineWidth=1.5;
 for(let x=0;x<W;x+=40){g.beginPath();g.moveTo(x,250);g.lineTo(x,330);g.stroke();}g.beginPath();g.moveTo(0,290);g.lineTo(W,290);g.stroke();
 // 地砖
 g.fillStyle='#d9d2c3';g.fillRect(0,330,W,TRAY_Y-330);g.strokeStyle='rgba(74,47,34,.18)';
 for(let y=330;y<TRAY_Y;y+=45){g.beginPath();g.moveTo(0,y);g.lineTo(W,y);g.stroke();}
 for(let x=-200;x<W+200;x+=60){g.beginPath();g.moveTo(x,330);g.lineTo(x+(x-195)*.6,TRAY_Y);g.stroke();}
 // 旧水管
 g.strokeStyle='#b0643a';g.lineWidth=7;g.beginPath();g.moveTo(370,0);g.lineTo(370,230);g.lineTo(285,230);g.stroke();g.lineWidth=2;g.strokeStyle=INK;
 // 红桶
 const b=BUCKET;g.beginPath();g.moveTo(b.x-38,b.y-48);g.lineTo(b.x+38,b.y-48);g.lineTo(b.x+30,b.y+28);g.lineTo(b.x-30,b.y+28);g.closePath();fs('#e05a4a');
 g.beginPath();g.ellipse(b.x,b.y-48,38,11,0,0,7);fs('#b63d31');g.beginPath();g.ellipse(b.x,b.y-46,32,8,0,0,7);g.fillStyle='#7cc6e8';g.fill();
 // 小凳/杂物：拖鞋
 g.beginPath();g.ellipse(48,600,24,11,-.3,0,7);fs('#5a8fd6',2.5);g.beginPath();g.ellipse(70,622,24,11,-.3,0,7);fs('#5a8fd6',2.5);
}
function drawToilet(){
 // 水箱
 rr(105,110,180,118,18);fs('#f6f2ea');rr(98,100,194,22,10);fs('#fffdf7');
 // 冲水键
 const pulse=O&&(O.phase==='observe'||O.phase==='verify')&&!O.anim;
 const pr=FLUSH.r+(pulse?Math.sin(S.t*6)*3:0);
 if(pulse){g.beginPath();g.arc(FLUSH.x,FLUSH.y,pr+10+Math.sin(S.t*6)*4,0,7);g.fillStyle=O.phase==='verify'?'rgba(125,255,176,.45)':'rgba(255,214,90,.5)';g.fill();}
 g.beginPath();g.arc(FLUSH.x,FLUSH.y,pr,0,7);fs('#d9e8f2');g.beginPath();g.arc(FLUSH.x,FLUSH.y,pr*.55,0,7);fs('#eef6fb',2);
 // 底座
 g.beginPath();g.moveTo(140,440);g.quadraticCurveTo(150,540,165,560);g.lineTo(225,560);g.quadraticCurveTo(240,540,250,440);g.closePath();fs('#ece6da');
 // 盆外圈
 g.beginPath();g.ellipse(BOWL.x,BOWL.y,BOWL.rx,BOWL.ry,0,0,7);fs('#fbf8f2',3.5);
 g.beginPath();g.ellipse(BOWL.x,BOWL.y+3,INNER.rx+10,INNER.ry+8,0,0,7);g.fillStyle='#e8e1d3';g.fill();
 g.beginPath();g.ellipse(BOWL.x,BOWL.y+4,INNER.rx,INNER.ry,0,0,7);fs('#ded6c6',2);
 drawWater();
}
function drawWater(){
 if(!O)return;const l=clamp(O.water,.15,1);
 const rx=INNER.rx*(.32+.66*l),ry=INNER.ry*(.32+.66*l),cy=WATER_Y-(l-.35)*14;
 const slosh=l>.8?Math.sin(S.t*5)*3:0;
 g.save();g.beginPath();g.ellipse(BOWL.x,BOWL.y+4,INNER.rx,INNER.ry,0,0,7);g.clip();
 g.beginPath();g.ellipse(BOWL.x+slosh,cy,rx,ry,0,0,7);
 const grd=g.createRadialGradient(BOWL.x-20,cy-10,5,BOWL.x,cy,rx);grd.addColorStop(0,'#bfe9ff');grd.addColorStop(1,l>.8?'#5fb2dd':'#7cc6e8');g.fillStyle=grd;g.fill();
 g.strokeStyle='rgba(255,255,255,.7)';g.lineWidth=2;g.stroke();
 // 打旋
 const sw=O.swirl+(O.d.clog==='soft'&&O.observed&&O.hp>0?.25:0);
 if(sw>0){g.strokeStyle=`rgba(255,255,255,${Math.min(.8,sw*.4)})`;g.lineWidth=2.5;
  for(let i=0;i<3;i++){g.beginPath();const a0=S.t*(1+sw*2)+i*2.1;g.ellipse(BOWL.x,cy,rx*(.3+i*.2),ry*(.3+i*.2),0,a0,a0+1.6);g.stroke();}}
 // 软堵：纸团色块
 if(O.d.clog==='soft'&&O.hp>0&&O.observed){g.globalAlpha=.35*(O.hp/O.hpMax)+.1;g.fillStyle='#f3efe4';for(let i=0;i<4;i++){g.beginPath();g.ellipse(BOWL.x+Math.cos(i*1.7+S.t*.5)*rx*.3,cy+Math.sin(i*1.7)*ry*.25,12,7,i,0,7);g.fill();}g.globalAlpha=1;}
 // 硬物剪影
 if(O.d.clog==='hard'&&O.hp>0&&O.observed&&!O.objOut){g.globalAlpha=.28+.1*Math.sin(S.t*2);drawDuck(BOWL.x+8,cy+6,.7,'#3a5a70');g.globalAlpha=1;
  if(Math.random()<.01)parts.push({x:BOWL.x+rnd(-10,10),y:cy,vx:0,vy:-40,life:.5,color:'#e6f7ff',r:4,g:-50});}
 g.restore();
 // 满水高光边
 if(l>.8){g.beginPath();g.ellipse(BOWL.x,BOWL.y+4,INNER.rx,INNER.ry,0,0,7);g.strokeStyle=`rgba(80,170,220,${.4+.3*Math.sin(S.t*8)})`;g.lineWidth=4;g.stroke();}
}
function drawDuck(x,y,s,color){g.save();g.translate(x,y);g.scale(s,s);
 const solid=!color;g.beginPath();g.ellipse(0,10,34,22,0,0,7);g.fillStyle=color||'#ffd84a';g.fill();if(solid){g.lineWidth=3;g.strokeStyle=INK;g.stroke();}
 g.beginPath();g.arc(-14,-14,18,0,7);g.fillStyle=color||'#ffd84a';g.fill();if(solid){g.stroke();}
 if(solid){g.beginPath();g.ellipse(-34,-10,10,5,0,0,7);g.fillStyle='#ff8c2e';g.fill();g.stroke();g.beginPath();g.arc(-18,-18,3,0,7);g.fillStyle=INK;g.fill();}
 g.restore();}

function drawPlunger(x,y,comp,up,scale=1,ghostWin=false){
 g.save();g.translate(x,y);g.scale(scale,scale);
 const dy=comp*34;const cw=56+comp*26,ch=30-comp*14;
 // 手柄
 rr(-6,-130+dy,12,120,5);fs('#c58a4f');
 if(!up){g.fillStyle='#bdbdbd';g.fillRect(-7,-90+dy,14,10);g.fillRect(-7,-60+dy,14,8);} // 胶布
 else{g.fillStyle='#ffcf3f';g.fillRect(-7,-20+dy,14,8);}
 // 胶头
 g.beginPath();g.moveTo(-cw/2,0);g.quadraticCurveTo(-cw/2,-ch-6+dy*.2,0,-ch-8+dy*.6);g.quadraticCurveTo(cw/2,-ch-6+dy*.2,cw/2,0);g.closePath();
 fs(up?'#3f7fe0':'#d6463a');
 g.beginPath();g.ellipse(0,0,cw/2,7,0,0,7);fs(up?'#2c5fb0':'#a8322a',2.5);
 g.restore();}
function drawScoop(x,y,full,scale=1){g.save();g.translate(x,y);g.scale(scale,scale);
 rr(14,-8,52,12,6);fs('#4f9be0');g.beginPath();g.arc(0,0,26,0,Math.PI);g.closePath();fs('#5aa9ee');
 g.beginPath();g.ellipse(0,0,26,8,0,0,7);fs('#7fc0f5',2.5);if(full){g.beginPath();g.ellipse(0,1,21,5,0,0,7);g.fillStyle='#bfe9ff';g.fill();}g.restore();}
function drawSnake(x,y,spin,scale=1){g.save();g.translate(x,y);g.scale(scale,scale);
 g.beginPath();g.arc(0,-40,30,0,7);fs('#8a96a3');g.beginPath();g.arc(0,-40,20,0,7);fs('#b9c3cc',2);
 g.save();g.translate(0,-40);g.rotate(spin);rr(-4,-30,8,30,4);fs('#ffcf3f',2);g.beginPath();g.arc(0,-30,7,0,7);fs('#e0533f',2);g.restore();
 g.strokeStyle='#5b6670';g.lineWidth=4;g.beginPath();g.moveTo(0,-10);g.lineTo(0,10);g.stroke();g.restore();}

function drawHeld(){
 if(!held||!O)return;const h=held;
 if(h.attached){
  if(h.id==='plunger'){
   const p=O.plunger;drawPlunger(BOWL.x,WATER_Y-2,p.comp,S.upgraded);
   // 节奏圈
   const ws=.16,wl=S.upgraded?.62:.3,tot=ws+wl+.25,cx=BOWL.x+92,cy=WATER_Y-95,R=24;
   g.beginPath();g.arc(cx,cy,R,0,7);g.fillStyle='rgba(40,25,18,.55)';g.fill();
   const arc=(a,b,c,lw)=>{g.beginPath();g.arc(cx,cy,R,-Math.PI/2+a/tot*Math.PI*2,-Math.PI/2+b/tot*Math.PI*2);g.strokeStyle=c;g.lineWidth=lw;g.stroke();};
   arc(0,ws,'#777',6);arc(ws,ws+wl,'#4fdc8a',6);arc(ws+wl,tot,'#d65a4a',6);
   if(O.ghost>0){g.setLineDash([4,4]);arc(ws,ws+.3,'rgba(255,255,255,'+Math.min(1,O.ghost)+')',10);g.setLineDash([]);
    txt('窗口变宽了',cx,cy-40,13,'rgba(255,255,255,'+Math.min(1,O.ghost)+')');}
   if(p.bottom){const bt=Math.min(p.bt,tot);const inW=bt>=ws&&bt<=ws+wl;
    g.beginPath();g.moveTo(cx,cy);g.arc(cx,cy,R-6,-Math.PI/2,-Math.PI/2+bt/tot*Math.PI*2);g.closePath();g.fillStyle=inW?'#4fdc8a':bt<ws?'#aaa':'#d65a4a';g.fill();
    if(inW){g.beginPath();g.arc(cx,cy,R+4+Math.sin(S.t*30)*2,0,7);g.strokeStyle='#4fdc8a';g.lineWidth=2;g.stroke();}}
   else{txt(p.comp>.1?'↓':'⇩',cx,cy,18,'#fff');}
   // 压力条（手柄旁）
  }
  if(h.id==='snake'){const s=O.snake;g.strokeStyle='#6c7783';g.lineWidth=4;g.beginPath();g.moveTo(BOWL.x+70,WATER_Y-110);g.quadraticCurveTo(BOWL.x+30,WATER_Y-40,BOWL.x,WATER_Y-s.pull*60);g.stroke();
   drawSnake(BOWL.x+70,WATER_Y-80-s.pull*40,s.spin,1);
   // 深度
   const cx=BOWL.x-100,cy=WATER_Y-95;g.beginPath();g.arc(cx,cy,24,0,7);g.fillStyle='rgba(40,25,18,.55)';g.fill();
   g.beginPath();g.arc(cx,cy,24,-Math.PI/2,-Math.PI/2+(s.hooked?s.pull:s.depth)*Math.PI*2);g.strokeStyle=s.hooked?'#ffcf3f':'#9fd3ff';g.lineWidth=6;g.stroke();
   txt(s.hooked?'↑':'⟳',cx,cy,20,'#fff');
   if(!s.depth&&!s.hooked){g.globalAlpha=.6+.4*Math.sin(S.t*5);g.beginPath();g.arc(BOWL.x,BOWL.y,70,S.t*3,S.t*3+4);g.strokeStyle='#fff';g.lineWidth=3;g.setLineDash([6,6]);g.stroke();g.setLineDash([]);g.globalAlpha=1;}
  }
 }else{
  const sc=1+held.pop*.2;
  if(h.id==='plunger'){ // 吸附光圈
   const d=dist(h.x,h.y,BOWL.x,BOWL.y-20);g.beginPath();g.arc(BOWL.x,BOWL.y,snapR(),0,7);g.strokeStyle=d<snapR()+40?'rgba(125,255,176,.9)':'rgba(255,255,255,.45)';g.lineWidth=3;g.setLineDash([8,6]);g.stroke();g.setLineDash([]);
   drawPlunger(h.x,h.y+40,0,S.upgraded,sc);}
  if(h.id==='snake'){const d=dist(h.x,h.y,BOWL.x,BOWL.y-20);g.beginPath();g.arc(BOWL.x,BOWL.y,snapR(),0,7);g.strokeStyle=d<snapR()+40?'rgba(125,255,176,.9)':'rgba(255,255,255,.45)';g.lineWidth=3;g.setLineDash([8,6]);g.stroke();g.setLineDash([]);drawSnake(h.x,h.y+40,0,sc);}
  if(h.id==='scoop'){drawScoop(h.x,h.y,h.scoopFull,sc);if(h.scoopFull){g.beginPath();g.arc(BUCKET.x,BUCKET.y-30,48,0,7);g.strokeStyle='rgba(255,255,255,.6)';g.setLineDash([6,6]);g.lineWidth=3;g.stroke();g.setLineDash([]);}}
 }
}
function drawTray(){
 g.fillStyle='#6b4a36';g.fillRect(0,TRAY_Y,W,H-TRAY_Y);g.fillStyle='#7d573f';g.fillRect(0,TRAY_Y,W,8);
 ['plunger','scoop','snake'].forEach((id,i)=>{const x=SLOTS[i],y=TRAY_Y+44;const avail=O&&O.d.tools.includes(id);
  rr(x-46,y-36,92,76,14);fs(avail?'#f3e6cf':'#8a6a55',3);
  if(avail){const inUse=held&&held.id===id;g.globalAlpha=inUse?.3:1;
   if(id==='plunger')drawPlunger(x,y+28,0,S.upgraded,.42);if(id==='scoop')drawScoop(x-10,y,false,.9);if(id==='snake')drawSnake(x,y+22,0,.7);g.globalAlpha=1;
   txt(TOOLS[id].name,x,y+32,11,INK);
   if(id==='snake'&&O.d.id===3&&!O.usedSnake){rr(x+16,y-44,38,18,9);fs('#e0533f',2);txt('NEW',x+35,y-35,11,'#fff');}
   if(lockTools()){rr(x-46,y-36,92,76,14);g.fillStyle='rgba(60,40,30,.45)';g.fill();}}
  else{txt('?',x,y,30,'#5d4535');}
 });
}
function drawHUD(){
 rr(10,10,W-20,64,16);fs('rgba(255,248,235,.95)');
 txt('¥'+S.money,30,30,20,'#2f8a4a','left','800');txt(O?`第 ${O.d.id} 单 · ${O.d.who}`:'',30,55,13,INK,'left','600');
 if(O){g.font='34px sans-serif';g.textAlign='center';g.fillText(O.face,W-140,44);
  txt('小费 ¥'+O.tip,W-80,30,14,INK);if(O.startT!=null){const el=(O.anim&&O.anim.type==='win')||O.phase==='done'?O.elapsed:S.t-O.startT;txt(el.toFixed(1)+'s',W-80,54,13,'#7a5a48','center','600');}}
 // 设置
 button(save.muted?'🔇':'🔊',W-44,84,34,30,()=>{save.muted=!save.muted;persist();},'#fff8eb');
 button(save.reduced?'🐢':'✨',W-84,84,34,30,()=>{save.reduced=!save.reduced;persist();},'#fff8eb');
 // 旧手机角
 rr(14,628,40,56,7);fs('#2d2d33');rr(18,634,32,40,4);g.fillStyle='#4a6a80';g.fill();g.strokeStyle='rgba(255,255,255,.5)';g.lineWidth=1;g.beginPath();g.moveTo(22,640);g.lineTo(40,668);g.stroke();
}
function drawHintBubble(){
 if(!O||O.hintT<=0||!O.hint)return;const a=Math.min(1,O.hintT*2);g.globalAlpha=a;
 g.font='700 15px -apple-system,"PingFang SC","Noto Sans CJK SC",sans-serif';const w=Math.min(W-40,g.measureText(O.hint).width+30);
 rr(W/2-w/2,600,w,40,20);fs('#fffdf6',2.5);txt(O.hint,W/2,620,15,INK);g.globalAlpha=1;
}
function drawObserveHint(){
 if(!O||O.phase!=='observe'||O.anim)return;
 const y=FLUSH.y+40+Math.sin(S.t*6)*6;g.font='34px sans-serif';g.textAlign='center';g.fillText('👆',FLUSH.x+30,y);
 if(O.d.id===1)txt('先冲一下水，看看什么情况',W/2,620,15,INK);
}
function drawFX(){
 for(const f of flashes){g.beginPath();g.ellipse(f.x,f.y,f.r,f.r*.55,0,0,7);g.strokeStyle=`rgba(255,255,255,${f.life*2})`;g.lineWidth=4;g.stroke();}
 for(const p of parts){g.globalAlpha=Math.min(1,p.life*2);g.beginPath();g.arc(p.x,p.y,p.r,0,7);g.fillStyle=p.color;g.fill();}g.globalAlpha=1;
 if(O&&O.objOut){const o=O.objOut;g.save();g.translate(o.x,o.y);g.rotate(Math.sin(o.rot)*.4);drawDuck(0,0,1.1,null);g.restore();}
 for(const f of floats){g.globalAlpha=Math.min(1,f.life*2);otxt(f.text,f.x,f.y,f.size,f.color);}g.globalAlpha=1;
}
function drawDexCard(){
 const c=S.dexCard;if(!c)return;const k=Math.min(1,c.t*4);
 g.fillStyle=`rgba(20,12,8,${.55*k})`;g.fillRect(0,0,W,H);
 g.save();g.translate(W/2,H/2);g.scale(.6+.4*k,.6+.4*k);
 rr(-140,-190,280,360,22);fs('#fff4d6',4);rr(-140,-190,280,50,22);fs('#ffcf3f',4);
 txt('奇葩异物图鉴 No.'+String(S.dex.length||1).padStart(3,'0'),0,-165,17,INK,'center','800');
 g.beginPath();g.arc(0,-50,80,0,7);g.fillStyle='#bfe9ff';g.fill();drawDuck(10,-50,1.8,null);
 txt(c.name,0,60,26,INK,'center','800');txt(c.line,0,98,13,'#6b4a36','center','600');
 g.restore();buttons.push({x:0,y:0,w:W,h:H,fn:()=>{if(c.t>.6){S.dexCard=null;SFX.click();}}});
 if(c.t>.8)txt('点击继续',W/2,H/2+210,14,'#fff');
}

// ---------- 屏幕 ----------
function draw(){
 buttons=[];g.setTransform(SC*DPR,0,0,SC*DPR,0,0);g.clearRect(0,0,W,H);
 const sx=shake?rnd(-shake,shake):0,sy=shake?rnd(-shake,shake):0;
 if(S.screen==='title')return drawTitle();
 g.save();g.translate(sx,sy);drawBathroom();drawToilet();drawHeld();drawFX();g.restore();
 drawTray();drawHUD();drawHintBubble();drawObserveHint();
 if(S.screen==='brief')drawBrief();
 if(S.screen==='result')drawResult();
 if(S.screen==='upgrade')drawUpgrade();
 if(S.screen==='end')drawEnd();
 if(S.dexCard)drawDexCard();
}
function drawTitle(){
 g.fillStyle='#efe2c4';g.fillRect(0,0,W,H);g.fillStyle='#a9d3c0';g.fillRect(0,H*.55,W,H*.45);
 otxt('重生之我在',W/2,170,30,'#fff8eb');otxt('澳洲修马桶',W/2,215,42,'#ffcf3f');
 txt('G1 玩法原型 · 占位美术',W/2,262,14,'#6b4a36','center','600');
 drawPlunger(W/2,470+Math.sin(S.t*3)*6,(Math.sin(S.t*3)+1)/2*.6,false,1.4);
 button('开 工',W/2-90,560,180,60,()=>{S.money=0;S.idx=0;S.upgraded=false;S.dex=[];S.times={};startOrder(0);},'#ffb53d');
 txt('建议用手机竖屏打开，戴耳机体验更好',W/2,650,13,'#6b4a36','center','500');
 button(save.muted?'🔇 声音关':'🔊 声音开',W/2-120,690,110,36,()=>{save.muted=!save.muted;persist();},'#fff8eb');
 button(save.reduced?'减少动效：开':'减少动效：关',W/2+10,690,120,36,()=>{save.reduced=!save.reduced;persist();},'#fff8eb');
}
function panel(y,h){g.fillStyle='rgba(20,12,8,.5)';g.fillRect(0,0,W,H);rr(24,y,W-48,h,22);fs('#fff8eb',4);}
function drawBrief(){
 const d=O.d;panel(200,330);
 txt('📱 新订单',W/2,236,15,'#7a5a48');txt(d.place,W/2,272,22,INK,'center','800');
 g.font='54px sans-serif';g.textAlign='center';g.fillText(d.face,W/2,335);
 txt(d.who,W/2,380,15,'#7a5a48');
 const lines=wrap(`“${d.line}”`,W-100,16);lines.forEach((l,i)=>txt(l,W/2,412+i*24,16,INK,'center','600'));
 txt(`工钱 ¥${d.base} · 小费最多 ¥${d.tip}`,W/2,470,13,'#2f8a4a');
 button('上门',W/2-80,488,160,48,()=>{S.screen='play';},'#ffb53d');
}
function wrap(t,maxW,size){g.font=`600 ${size}px sans-serif`;const out=[];let cur='';for(const ch of t){if(g.measureText(cur+ch).width>maxW){out.push(cur);cur=ch;}else cur+=ch;}if(cur)out.push(cur);return out;}
function drawResult(){
 const r=S.result;panel(150,430);
 g.font='60px sans-serif';g.textAlign='center';g.fillText(r.face,W/2,215);
 txt(r.d.who+(r.face==='👍'?'：师傅手艺真好！':'：行，通了就好。'),W/2,262,15,INK,'center','600');
 txt('工钱',90,305,15,'#7a5a48','left');txt('¥'+r.base,W-90,305,15,INK,'right');
 txt('小费',90,333,15,'#7a5a48','left');txt('¥'+r.tip+(r.tip<r.d.tip?`（满 ¥${r.d.tip}）`:''),W-90,333,15,INK,'right');
 txt('用时',90,361,15,'#7a5a48','left');txt(r.elapsed.toFixed(1)+' 秒',W-90,361,15,INK,'right');
 if(r.d.id===4&&S.times[2]){const diff=S.times[2]-r.elapsed;
  rr(50,380,W-100,34,10);fs(diff>0?'#d8ffe6':'#ffe3dc',2);txt(diff>0?`比第 2 单（同款满水堵）快了 ${diff.toFixed(1)} 秒`:`比第 2 单慢了 ${(-diff).toFixed(1)} 秒`,W/2,397,14,INK);}
 otxt('+¥'+r.coinsShown,W/2,450,40,'#ffcf3f');
 // 手机通知
 if(S.phoneShown&&S.phoneQueue.length){const m=S.phoneQueue;const k=Math.min(1,(S.resultT-1.4)*4);
  g.save();g.translate(0,(1-k)*-60);g.globalAlpha=k;rr(30,92,W-60,22+m.length*22,12);fs('#2d2d33',2);
  m.forEach((x,i)=>{txt(x[0]+'  '+x[1],44,112+i*22,12.5,'#f1f1f1','left','500');});g.restore();g.globalAlpha=1;}
 const next=r.d.id===3?'去五金店看看':r.d.id===4?'收工':'接下一单';
 if(S.resultT>1)button(next,W/2-90,505,180,52,()=>{S.phoneShown=false;
  if(r.d.id===3){S.screen='upgrade';}else if(r.d.id===4){S.screen='end';}else{S.idx++;startOrder(S.idx);}},'#ffb53d');
}
function drawUpgrade(){
 panel(110,540);txt('五金店 · 老陈',W/2,145,15,'#7a5a48');txt('加压皮搋子',W/2,180,26,INK,'center','800');
 drawPlunger(120,370,0,false,1);drawPlunger(270,370,0,true,1.1);txt('现在',120,395,13,'#7a5a48');txt('升级后',270,395,13,'#2c5fb0');
 otxt('→',195,300,30,'#fff');
 const rows=['节奏窗口加宽一倍，更容易按准','按准一次顶两次','吸附范围更大，丢过去就吸住'];
 rows.forEach((t,i)=>{txt('✔ '+t,60,430+i*30,15,INK,'left','600');});
 const cost=100,can=S.money>=cost;
 txt('你有 ¥'+S.money,W/2,530,14,'#2f8a4a');
 button(can?`买！¥${cost}`:'钱不够',W/2-90,560,180,52,()=>{if(!can){S.money=cost;}S.money-=cost;S.upgraded=true;SFX.success();buzz([30,30,80]);doShake(6);S.idx++;startOrder(S.idx);},can?'#ffb53d':'#ccc');
}
function drawEnd(){
 panel(140,470);txt('今天收工',W/2,180,26,INK,'center','800');
 txt('今日收入 ¥'+S.money,W/2,225,18,'#2f8a4a');
 txt('图鉴：'+(S.dex.length?'小黄鸭 ×1':'空'),W/2,260,15,INK);
 if(S.times[2]&&S.times[4])txt(`满水堵用时：${S.times[2].toFixed(1)}s → ${S.times[4].toFixed(1)}s`,W/2,292,15,INK);
 txt('手机亮了一下……',W/2,345,14,'#7a5a48');
 rr(50,365,W-100,64,12);fs('#2d2d33',2);txt('王阿姨：小师傅，我家门把手也',W/2,387,13,'#f1f1f1');txt('不太灵，下回顺便看看？',W/2,409,13,'#f1f1f1');
 txt('（G2 将从这里继续）',W/2,455,13,'#7a5a48');
 button('再玩一遍',W/2-90,500,180,52,()=>{S.screen='title';O=null;},'#ffb53d');
}

// 调试/测试钩子
window.__G={S,get O(){return O;},ORDERS,startOrder,setUpgraded:v=>S.upgraded=v};
requestAnimationFrame(loop);
