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
 notify(){tone(1175,.08,'sine',.2);tone(1568,.1,'sine',.2,null,.1);},
 ring(){[0,.18].forEach(d=>{tone(880,.12,'sine',.18,null,d);tone(660,.12,'sine',.12,null,d+.06);});},
 ad(){tone(440,.1,'triangle',.15);}
};
const CAN_VIBRATE=typeof navigator.vibrate==='function'&&!/iP(hone|ad|od)/.test(navigator.userAgent);
// iOS 等不支持震动的设备：用低频"咚"声 + 轻微画面抖动代替
function buzz(p){const arr=Array.isArray(p)?p:[p];let on=0;arr.forEach((v,i)=>{if(i%2===0)on+=v;});
 if(save.novibe)return;
 if(CAN_VIBRATE){if(save.reduced)return;try{navigator.vibrate(p);}catch(e){}return;}
 if(on<10)return;const k=Math.min(1,on/120);
 tone(70+k*40,.05+k*.07,'sine',.18+k*.22,45);
 if(arr.length>1)arr.forEach((v,i)=>{if(i>1&&i%2===0){let d=0;for(let j=0;j<i;j++)d+=arr[j];tone(70+k*40,.05,'sine',.15+k*.15,45,d/1000);}});
 if(on>=25)doShake(2+k*6);}

// ---------- 订单数据 ----------
// 订单来自 data/orders.json（策划维护），这里只补表现层字段
let ORDERS=[],CFG=null;
// 地点和表情是表现层占位；人名、台词来自 data/narrative.json（叙事维护）
const LOOK={o1:{place:'老小区三楼',face:'👵'},o2:{place:'城中村单间',face:'🧑'},o3:{place:'新楼盘两居室',face:'👩'},o4:{place:'城中村单间',face:'🧑'}};
let NAR=null;
const CHANNEL={family_group:'相亲相爱一家人',dm_mom:'妈妈',dm_dad:'爸爸',dm_dazhuang:'大壮'};
function heroName(){return '你';}
function nline(key,k){const o=NAR&&NAR.orders[key];const l=o&&o.lines[k];return l?l.text.replace('{HERO}',heroName()):null;}
function buildOrders(c,n){CFG=c;NAR=n;ORDERS=c.orders.map((o,i)=>{const no=n.orders[o.id]||{};const cl=no.client&&n.characters[no.client];return {id:i+1,key:o.id,who:cl?cl.name:'客户',place:LOOK[o.id].place,face:LOOK[o.id].face,
 line:nline(o.id,'arrive')||o.customerLine,
 water:o.waterLevel,clog:o.fault,hp:o.clogHp!=null?o.clogHp:(o.fault==='hard'?1:3),base:o.basePay,patMax:PAT().max,hurry:!!o.urgent,obj:o.object==='rubber_duck'?'duck':null,
 tools:i===0?['plunger']:i===1?['plunger','scoop']:['plunger','scoop','snake']};}).map(d=>{const c=n.calls&&n.calls[d.key];
  if(c&&c.type==='call'){const k=(ECO&&ECO.orderSources&&ECO.orderSources.call)||{payMultiplier:1.5,tipMultiplier:1.5};d.isCall=true;d.payX=k.payMultiplier;d.base=Math.round(d.base*k.payMultiplier);d.patMax=k.patienceMax||PAT().max-1;}
  return d;});}
let ECO=null,PATIENCE=null;
Promise.all(['data/orders.json','data/narrative.json','data/economy.json','data/g2_orders.json'].map(u=>fetch(u).then(r=>r.json()))).then(([c,n,e,g2])=>{ECO=e;PATIENCE=c.patience||{max:4};buildOrders(c,n);G2build(g2);});
// 皮搋子节奏：以 rebounceMs 为中心，windowMs 内拉起算“按准”，其中 perfectWindowMs 内显示“完美”
function rhythm(up){return CFG.tools[up?'plunger_pro':'plunger'].rhythm;}
function win(up){const r=rhythm(up);return {ws:(r.rebounceMs-r.windowMs/2)/1000,wl:r.windowMs/1000,ps:(r.rebounceMs-r.perfectWindowMs/2)/1000,pl:r.perfectWindowMs/1000};}
function splashAbove(){return rhythm(S.upgraded).overPressSplashIfWaterAbove;}
function cname(id){return ((NAR&&NAR.characters[id])||{}).name||id;}
function socialAfter(key){if(!NAR)return [];return NAR.social.filter(m=>m.after===key).map(m=>{const ch=CHANNEL[m.channel]||m.channel;const who=cname(m.sender);
 const text=m.text.replace('{HERO}',heroName());const msg={ch,channel:m.channel,group:m.channel==='family_group',sender:m.sender,raw:text,text:m.channel==='family_group'?who+'：'+text:text};
 deliver(msg);return msg;});}
// ---------- 喂信 ----------
const PH={open:false,view:'list',chats:{},order:[],unread:0,toastT:0};
function appName(){return (NAR&&NAR.app&&NAR.app.chat_app_name)||'喂信';}
function phoneReset(){PH.open=false;PH.view='list';PH.chats={};PH.order=[];PH.unread=0;
 if(!NAR)return;const fg=NAR.family_group;chat('family_group').msgs=fg.history.map(h=>({sender:h.sender,text:h.text}));}
function chat(ch){if(!PH.chats[ch]){PH.chats[ch]={ch,msgs:[],unread:0};PH.order.unshift(ch);}return PH.chats[ch];}
function deliver(m){const c=chat(m.channel);c.msgs.push({sender:m.sender,text:m.raw,isNew:true});c.unread++;PH.unread++;PH.order=[m.channel,...PH.order.filter(x=>x!==m.channel)];}
function chatTitle(ch){if(!CHANNEL[ch]&&ch.startsWith('dm_'))return cname(ch.slice(3));return ch==='family_group'?((NAR.app&&NAR.app.family_group_name)||'相亲相爱一家人')+'('+NAR.family_group.member_count_display+')':(CHANNEL[ch]||ch);}
function canOpenPhone(){return S.screen!=='play'&&S.screen!=='lock'&&S.screen!=='title'&&!S.dexCard;}
function openPhone(view){if(!canOpenPhone())return;S.toastQ=null;PH.open=true;PH.view=view||'list';PH.toastT=0;SFX.click();if(PH.view.startsWith('chat:'))readChat(PH.view.slice(5));}
function readChat(ch){const c=PH.chats[ch];if(c){PH.unread-=c.unread;c.unread=0;}}
// ---------- 打电话问老钱（规则 economy.json callMaster，台词 narrative.json call_master） ----------
function CM(){return (ECO&&ECO.rewardedAds.callMaster)||{showWhen:{wrongToolCount:2,idleMs:12000,patienceAtOrBelow:.5},freePerDay:1,maxPerOrder:1};}
function pick(a){return a&&a.length?a[Math.floor(Math.random()*a.length)]:'';}
function masterFault(){if(O.water>splashAbove()&&!O.usedScoop)return 'high_water';return O.d.clog==='hard'?'hard':'soft';}
function masterTool(){const f=masterFault();return f==='high_water'?'scoop':f==='hard'?'snake':'plunger';}
function masterLines(){const c=(NAR&&NAR.call_master)||{};return [pick(c.opener),pick((c.hints||{})[masterFault()]),pick(c.closer)].filter(Boolean);}
const LINE_SEC=1.8;
function hangUp(){const c=S.callUI;S.callUI=null;if(O){O.hlTool=c.tool;O.hlT=3;O.reveal=3;SFX.notify();}}
function callTap(){const c=S.callUI;if(!c||c.t<.25)return;c.t=0;if(c.i<c.lines.length-1)c.i++;else hangUp();}
function masterReady(){if(!O||O.phase!=='work'||O.anim)return false;const w=CM().showWhen;
 return (O.wrong||0)>=w.wrongToolCount||(O.idleT||0)*1000>=w.idleMs||O.pat/O.d.patMax<=w.patienceAtOrBelow;}
function masterFree(){return (S.masterFree||0)<CM().freePerDay;}
function askMaster(){if(!masterReady()||(O.masterCalls||0)>=CM().maxPerOrder||S.ad)return;O.masterCalls=(O.masterCalls||0)+1;
 const after=ok=>{if(!O)return;if(!ok){say('（电话没打通）',1.6);return;}
  S.callUI={t:0,i:0,lines:masterLines(),tool:masterTool()};SFX.ring();};
 if(masterFree()){S.masterFree=(S.masterFree||0)+1;after(true);}else{Ads.rewarded('callMaster').then(after);}}
// 网页假广告：画面上数 3 秒，期间暂停计时
Ads.fakeUI=(placement,dur)=>new Promise(res=>{S.ad={t:0,dur,placement,res};SFX.ad();});
const TOOLS={plunger:{name:'皮搋子'},scoop:{name:'水瓢'},snake:{name:'弹簧疏通器'}};

// ---------- 布局常量 ----------
const BOWL={x:195,y:405,rx:138,ry:82},INNER={rx:110,ry:62};let WATER_Y=415;
const FLUSH={x:195,y:178,r:22};
const BUCKET={x:338,y:585,r:38};
let TRAY_Y=690,SLOTS=[85,195,305];

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
function startOrder(i){startOrderD(ORDERS[i]);}
function startOrderD(d){
 O={d,water:d.water,wTarget:d.water,hp:d.hp,hpMax:d.hp,phase:'observe',pat:d.patMax,penalties:[],observed:false,anim:null,
  plunger:{comp:0,bottom:false,bt:0,ctrl:false,y0:0,hardHits:0},snake:{depth:0,ang:null,hooked:false,pull:0,y0:0,spin:0},
  scoopFull:false,startT:null,elapsed:0,hint:null,hintT:0,hardHint:false,splashed:0,objOut:null,face:'😐',ghost:0,swirl:0};
 held=null;S.screen='brief';
}
function lockTools(){return !O||O.phase!=='work'||O.anim;}
function PAT(){return (typeof PATIENCE!=='undefined'&&PATIENCE)||{max:4};}
function penalty(n,why){patLose();O.face='😠';setTimeout(()=>{if(O&&O.face==='😠')O.face='😟';},1200);}
function say(t,dur=2.4){O.hint=t;O.hintT=dur;}

function observeFlush(){
 SFX.click();noise(.8,.25,900);O.anim={type:'obs',t:0,dur:1.8};O.startT=O.startT??S.t;
 if(O.d.clog==='hard'){setTimeout(()=>{if(O){SFX.thud();}},900);}
 if(O.water>.8)setTimeout(()=>{if(O){O.face='😱';if(O.d.id===1)say('（水差点漫出来……先别冲了）');}},600);
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
 const d=O.d;S.times[d.id]=O.elapsed;const gift=rollGift(d,Math.max(1,O.pat)),total=d.base+(gift&&gift.cash||0);
 save.best=save.best||{};const bk='o'+d.id+(d.id===4?'':'');const prev=save.best[bk];const isBest=prev==null||O.elapsed<prev;if(isBest)save.best[bk]=O.elapsed;persist();
 S.result={d,said:nline(d.key,'done'),heroSaid:nline(d.key,'done_hero'),base:d.base,stars:Math.max(1,O.pat),gift,total,elapsed:O.elapsed,pen:O.penalties,prevBest:prev,isBest:isBest&&prev!=null,coinsShown:0,face:O.pat>=3?'👍':'🙂'};
 S.screen='result';S.resultT=0;
 S.phoneQueue=socialAfter(d.key);
 if(d.obj&&!S.dex.includes(d.obj))S.dex.push(d.obj);
}

// ---------- 工具交互 ----------
function snapR(){return CFG.tools[S.upgraded?'plunger_pro':'plunger'].suctionRadiusPx;}
function pickTool(id){
 if(lockTools())return;
 if(!O.d.tools.includes(id)){return;}
 audioInit();SFX.pick();buzz(8);
 held={id,x:ptr.x,y:ptr.y,attached:false,pop:1,scoopFull:false};
 O.plunger.comp=0;O.plunger.bottom=false;O.plunger.ctrl=false;
 O.snake.depth=0;O.snake.hooked=false;O.snake.pull=0;O.snake.ang=null;
}
function wrongTool(msg){SFX.wrong();buzz([20,30,20]);doShake(4);held.bounce=1;const l=O.d.id>1&&nline(O.d.key,'wrong_tool');say(l?'“'+l+'”':msg);}
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
 const {ws,wl,ps,pl}=win(S.upgraded);const R=rhythm(S.upgraded);
 if(O.water>splashAbove()&&p.comp>.45){ // 满水直接按：溅
  SFX.splash();buzz([40,30,60]);doShake(10);for(let i=0;i<40;i++)parts.push({x:BOWL.x+rnd(-90,90),y:WATER_Y-10,vx:rnd(-260,260),vy:rnd(-420,-150),life:rnd(.6,1.1),color:'#8fd3f4',r:rnd(3,7),g:900});
  O.wrong=(O.wrong||0)+1;O.splashed++;if(O.splashed<=2)penalty(1,'splash');O.penalties.push('溅水');
  if(O.d.id===1||!nline(O.d.key,'splash'))say('水太满了，一压就溅一地……');else say('“'+nline(O.d.key,'splash')+'”');held=null;p.comp=0;p.ctrl=false;O.face='😱';return;}
 if(p.comp>.86&&!p.bottom){p.bottom=true;p.bt=0;SFX.seal();buzz(12);}
 if(p.bottom){p.bt+=dt;}
 if(p.bottom&&p.comp<.35){
  p.bottom=false;const bt=p.bt;let q;
  if(bt<ws)q='early';else if(bt<=ws+wl)q=(bt>=ps&&bt<=ps+pl)?'perfect':'good';else q='late';
  if(O.d.clog==='hard'){
   SFX.thud();buzz([25,40,25]);doShake(3);burst(BOWL.x+rnd(-20,20),WATER_Y,4,'#e6f7ff',60,4);float('咚',BOWL.x+40,WATER_Y-60,'#ddd',24);
   p.hardHits++;O.wrong=(O.wrong||0)+1;if(p.hardHits>=2&&!O.hardHint){O.hardHint=true;const wl=nline(O.d.key,'wrong_tool');say(wl?'“'+wl+'”':'咚咚的……底下好像卡着硬东西');penalty(1);O.penalties.push('工具不对');}
   return;}
  const hit=q==='perfect'||q==='good';let dmg=hit?R.damagePerPerfect:R.damagePerOffBeat;
  if(hit){SFX.perfect();buzz(35);doShake(5);burst(BOWL.x,WATER_Y,16,'#cdeeff',200,5);fxText(q);
   flashes.push({x:BOWL.x,y:WATER_Y,r:20,life:.5});}
  else{SFX.weak();fxText(q);buzz(8);}
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
 const on=O.d.objName||'小黄鸭';O.face='😳';say('……'+on+'？！',2.2);const dl=nline(O.d.key,'done');
 setTimeout(()=>{if(O){S.dexCard={name:on,line:dl?O.d.who+'：“'+dl+'”':'',t:0};}},500);
 clogCleared();
}
function scoopMove(){
 const h=held;
 const inWater=((h.x-BOWL.x)**2/(INNER.rx**2)+(h.y-WATER_Y)**2/(INNER.ry**2))<1;
 if(inWater&&!h.scoopFull){
  if(O.water>.4){h.scoopFull=true;O.usedScoop=true;O.water-=.2;O.wTarget=O.water;SFX.fill();buzz(15);burst(h.x,h.y,8,'#bfe9ff',120,3);
   if(O.water<=splashAbove()&&O.water+.2>splashAbove()){float('水位安全',BOWL.x,WATER_Y-70,'#7dffb0',18);}}
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
 if(S.screen==='play')playDown(p);else if(S.screen==='lock')lockDown(p);
});
cv.addEventListener('pointermove',e=>{e.preventDefault();const p=toLogical(e);ptr.x=p.x;ptr.y=p.y;if(S.screen==='play'&&ptr.down)playMove(p);else if(S.screen==='lock'&&ptr.down)lockMove(p);});
const up=e=>{e.preventDefault();ptr.down=false;if(S.screen==='play')playUp();else if(S.screen==='lock')lockUp();};
cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up);
document.addEventListener('gesturestart',e=>e.preventDefault());

function playDown(p){
 if(O)O.idleT=0;
 if(!O||O.anim||hitstop>0)return;
 if(S.dexCard)return;
 if(dist(p.x,p.y,FLUSH.x,FLUSH.y)<FLUSH.r+16){
  if(O.phase==='observe'){observeFlush();return;}
  if(O.phase==='verify'){verifyFlush();return;}
  if(O.phase==='work'){ if(O.water>.8){say('别冲！会漫出来的');O.face='😱';SFX.wrong();} else {noise(.6,.2,900);say('冲不下去，还堵着');} return;}
 }
 if(p.y>TRAY_Y){ // 托盘
  const i=SLOTS.findIndex(x=>Math.abs(p.x-x)<(ART.ok?35:50));if(i<0)return;
  const id=['plunger','scoop','snake'][i];if(!id||!O.d.tools.includes(id)){if(ART.ok){say('这格还锁着，攒钱升级工具箱');SFX.wrong&&SFX.wrong();}return;}
  if(held&&held.id===id&&held.attached){held=null;SFX.click();return;}
  pickTool(id);return;}
 if(held&&held.attached){
  if(held.id==='plunger'){const pl=O.plunger;pl.ctrl=true;pl.y0=p.y-pl.comp*110;}
  if(held.id==='snake'){const s=O.snake;s.ang=Math.atan2(p.y-BOWL.y,p.x-BOWL.x);if(s.hooked)s.y0=p.y+s.pull*170;}
 }
}
function playMove(p){
 if(O)O.idleT=0;
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
 shake=Math.max(0,shake-dt*40);if(S.copied>0)S.copied-=dt;
 parts=parts.filter(p=>{p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=(p.g||400)*dt;return p.life>0;});
 floats=floats.filter(f=>{f.life-=dt;f.y-=40*dt;return f.life>0;});
 flashes=flashes.filter(f=>{f.life-=dt;f.r+=260*dt;return f.life>0;});
 if(S.dexCard)S.dexCard.t+=dt;
 if(S.screen==='result'){S.resultT+=dt;const r=S.result;const tgt=Math.min(r.total,Math.floor(S.resultT*60));
  if(tgt>r.coinsShown&&S.resultT>.4){if(Math.floor(tgt/5)!==Math.floor(r.coinsShown/5))SFX.coin();r.coinsShown=tgt;}
  if(S.resultT>.4&&!r.paid&&r.coinsShown>=r.total){r.paid=true;S.money+=r.total;buzz(30);}
  if(S.resultT>1.4&&S.phoneQueue.length&&!S.phoneShown){S.phoneShown=true;S.toastQ=S.phoneQueue.slice();SFX.notify();buzz([15,60,15]);}} // 结算时只亮红点，通知条留到两单之间
 if(PH.toastT>0)PH.toastT-=dt;
 if(S.settings){if(O&&O.startT!=null)O.startT+=dt;return;}
 if(S.ad){S.ad.t+=dt;if(O&&O.startT!=null)O.startT+=dt;if(S.ad.t>=S.ad.dur){const r=S.ad.res;S.ad=null;r&&r(true);}return;}
 if(S.callUI){const c=S.callUI;c.t+=dt;if(O&&O.startT!=null)O.startT+=dt;const last=c.i>=c.lines.length-1;if(!last&&c.t>=LINE_SEC){c.t=0;c.i++;}else if(last&&c.t>=LINE_SEC+1)hangUp();return;}
 if(S.screen==='lock'){lockUpdate(dt);return;}
 if(S.screen==='reveal'||S.screen==='offer'||S.screen==='board')G2update(dt);
 if(O&&S.screen==='play'){if(O.hlT>0)O.hlT-=dt;if(O.reveal>0)O.reveal-=dt;if(O.phase==='work'&&!O.anim&&!ptr.down)O.idleT=(O.idleT||0)+dt;}
 if(!O||S.screen!=='play')return;
 if(O.hintT>0)O.hintT-=dt;
 if(O.ghost>0)O.ghost-=dt;
 O.swirl=Math.max(0,O.swirl-dt*.6);
 if(O.d.hurry&&O.phase!=='verify'&&O.startT!=null){O.hurryT=(O.hurryT||0)+dt;if(O.hurryT*1000>(PAT().urgentDrainEveryMs||7000)&&O.pat>1){O.hurryT=0;patLose();O.face='😤';}}
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
const INK='#3B2A20';
function rr(x,y,w,h,r){g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath();}
function fs(fill,lw=3.5){g.fillStyle=fill;g.fill();g.lineWidth=lw;g.strokeStyle=INK;g.stroke();}
function txt(t,x,y,size=16,color='#fff',align='center',weight='700'){g.font=`${weight} ${size}px -apple-system,"PingFang SC","Noto Sans CJK SC","Microsoft YaHei",sans-serif`;g.textAlign=align;g.textBaseline='middle';g.fillStyle=color;g.fillText(t,x,y);}
function otxt(t,x,y,size,color){g.font=`800 ${size}px -apple-system,"PingFang SC","Noto Sans CJK SC",sans-serif`;g.textAlign='center';g.textBaseline='middle';g.lineWidth=5;g.strokeStyle=INK;g.strokeText(t,x,y);g.fillStyle=color;g.fillText(t,x,y);}
function button(label,x,y,w,h,fn,color='#ffb53d',tc=INK){rr(x,y,w,h,14);fs(color);txt(label,x+w/2,y+h/2+1,18,tc);buttons.push({x,y,w,h,fn:()=>{audioInit();SFX.click();buzz(8);fn();}});}

function drawBathroom(){if(ART.ok){artBathroom();return;}
 g.fillStyle='#EAD9B5';g.fillRect(0,0,W,330);
 // 墙面褪色斑
 g.fillStyle='rgba(180,150,100,.12)';g.beginPath();g.ellipse(70,120,60,30,0,0,7);g.fill();
 // 窗 + 防盗窗
 rr(22,70,92,96,6);fs('#bfe3f0');g.strokeStyle=INK;g.lineWidth=2;for(let i=1;i<5;i++){g.beginPath();g.moveTo(22+i*18.4,70);g.lineTo(22+i*18.4,166);g.stroke();}
 g.beginPath();g.moveTo(22,118);g.lineTo(114,118);g.stroke();
 // 毛巾架
 g.fillStyle=INK;g.fillRect(300,105,74,5);rr(312,108,44,70,6);fs('#f08a7e',2.5);g.fillStyle='#fff';g.fillRect(314,160,40,5);
 // 墙砖腰线
 g.fillStyle='#A8CDB8';g.fillRect(0,250,W,80);g.strokeStyle='rgba(74,47,34,.25)';g.lineWidth=1.5;
 for(let x=0;x<W;x+=40){g.beginPath();g.moveTo(x,250);g.lineTo(x,330);g.stroke();}g.beginPath();g.moveTo(0,290);g.lineTo(W,290);g.stroke();
 // 地砖
 g.fillStyle='#CDBFA4';g.fillRect(0,330,W,TRAY_Y-330);g.strokeStyle='rgba(74,47,34,.18)';
 for(let y=330;y<TRAY_Y;y+=45){g.beginPath();g.moveTo(0,y);g.lineTo(W,y);g.stroke();}
 for(let x=-200;x<W+200;x+=60){g.beginPath();g.moveTo(x,330);g.lineTo(x+(x-195)*.6,TRAY_Y);g.stroke();}
 // 旧水管
 g.strokeStyle='#8A5A3C';g.lineWidth=7;g.beginPath();g.moveTo(370,0);g.lineTo(370,230);g.lineTo(285,230);g.stroke();g.lineWidth=2;g.strokeStyle=INK;
 // 红桶
 const b=BUCKET;g.beginPath();g.moveTo(b.x-38,b.y-48);g.lineTo(b.x+38,b.y-48);g.lineTo(b.x+30,b.y+28);g.lineTo(b.x-30,b.y+28);g.closePath();fs('#e05a4a');
 g.beginPath();g.ellipse(b.x,b.y-48,38,11,0,0,7);fs('#b63d31');g.beginPath();g.ellipse(b.x,b.y-46,32,8,0,0,7);g.fillStyle='#7cc6e8';g.fill();
 // 小凳/杂物：拖鞋
 g.beginPath();g.ellipse(48,600,24,11,-.3,0,7);fs('#5a8fd6',2.5);g.beginPath();g.ellipse(70,622,24,11,-.3,0,7);fs('#5a8fd6',2.5);
}
function shadeClip(path,fn){g.save();path();g.clip();fn();g.restore();}
function drawToilet(){if(ART.ok){artToilet();const pulse=O&&(O.phase==='observe'||O.phase==='verify')&&!O.anim;
  if(pulse){g.beginPath();g.arc(FLUSH.x,FLUSH.y,FLUSH.r+8+Math.sin(S.t*6)*4,0,7);g.strokeStyle=O.phase==='verify'?'rgba(93,187,99,.8)':'rgba(255,226,122,.9)';g.lineWidth=4;g.stroke();}
  drawWater();return;}
 // 水箱：主体 + 右侧暗部 + 左侧高光
 const tank=()=>rr(105,110,180,118,18);
 tank();g.fillStyle='#F4F1EA';g.fill();
 shadeClip(tank,()=>{g.fillStyle='#DDD6C8';g.fillRect(252,100,50,140);g.fillStyle='rgba(255,255,255,.8)';rr(118,126,9,78,4);g.fill();});
 tank();g.lineWidth=4;g.strokeStyle=INK;g.stroke();
 // 水箱盖
 const lid=()=>rr(96,98,198,26,12);
 lid();g.fillStyle='#FFFDF7';g.fill();shadeClip(lid,()=>{g.fillStyle='#E4DDCF';g.fillRect(96,114,198,12);});lid();g.lineWidth=4;g.strokeStyle=INK;g.stroke();
 // 冲水键（金属）
 const pulse=O&&(O.phase==='observe'||O.phase==='verify')&&!O.anim;
 const pr=FLUSH.r+(pulse?Math.sin(S.t*6)*3:0);
 if(pulse){g.beginPath();g.arc(FLUSH.x,FLUSH.y,pr+10+Math.sin(S.t*6)*4,0,7);g.fillStyle=O.phase==='verify'?'rgba(123,224,123,.5)':'rgba(255,200,61,.5)';g.fill();}
 g.beginPath();g.arc(FLUSH.x,FLUSH.y,pr,0,7);fs('#B9C3CC',3.5);
 g.beginPath();g.arc(FLUSH.x,FLUSH.y,pr*.62,0,7);fs('#E8EEF2',2.5);
 g.beginPath();g.arc(FLUSH.x-pr*.25,FLUSH.y-pr*.28,pr*.18,0,7);g.fillStyle='#fff';g.fill();
 // 底座
 const base=()=>{g.beginPath();g.moveTo(140,440);g.quadraticCurveTo(150,540,165,562);g.lineTo(225,562);g.quadraticCurveTo(240,540,250,440);g.closePath();};
 base();g.fillStyle='#EEE8DC';g.fill();shadeClip(base,()=>{g.fillStyle='#D6CEBF';g.fillRect(212,430,50,140);});
 base();g.lineWidth=4;g.strokeStyle=INK;g.stroke();
 // 地面接触阴影
 g.beginPath();g.ellipse(195,566,52,8,0,0,7);g.fillStyle='rgba(59,42,32,.18)';g.fill();
 // 盆外圈（坐圈）
 const rim=()=>{g.beginPath();g.ellipse(BOWL.x,BOWL.y,BOWL.rx,BOWL.ry,0,0,7);};
 rim();g.fillStyle='#FBF8F2';g.fill();
 shadeClip(rim,()=>{g.beginPath();g.ellipse(BOWL.x+18,BOWL.y+26,BOWL.rx,BOWL.ry,0,0,7);g.rect(BOWL.x-BOWL.rx-40,BOWL.y-BOWL.ry-40,BOWL.rx*2+80,BOWL.ry*2+80);g.fillStyle='#E2DBCD';g.fill('evenodd');});
 rim();g.lineWidth=4.5;g.strokeStyle=INK;g.stroke();
 // 坐圈高光
 g.beginPath();g.ellipse(BOWL.x,BOWL.y,BOWL.rx-12,BOWL.ry-9,0,Math.PI*1.08,Math.PI*1.42);g.strokeStyle='rgba(255,255,255,.95)';g.lineWidth=5;g.lineCap='round';g.stroke();g.lineCap='butt';
 // 盆内壁
 g.beginPath();g.ellipse(BOWL.x,BOWL.y+3,INNER.rx+10,INNER.ry+8,0,0,7);g.fillStyle='#E6DFD1';g.fill();
 g.beginPath();g.ellipse(BOWL.x,BOWL.y+4,INNER.rx,INNER.ry,0,0,7);fs('#D8CFBE',3);
 drawWater();
}
function drawWater(){
 if(!O)return;const l=clamp(O.water,.15,1);
 const rx=INNER.rx*(.32+.66*l),ry=INNER.ry*(.32+.66*l),cy=WATER_Y-(l-.35)*14;
 const slosh=l>.8?Math.sin(S.t*5)*3:0;
 g.save();g.beginPath();g.ellipse(BOWL.x,BOWL.y+4,INNER.rx,INNER.ry,0,0,7);g.clip();
 if(!ART.ok){
 g.beginPath();g.ellipse(BOWL.x+slosh,cy,rx,ry,0,0,7);
 const grd=g.createRadialGradient(BOWL.x-20,cy-10,5,BOWL.x,cy,rx);grd.addColorStop(0,'#CFEFFF');grd.addColorStop(1,l>.8?'#4FA8DA':'#6EC3F0');g.fillStyle=grd;g.fill();
 g.strokeStyle='rgba(255,255,255,.8)';g.lineWidth=2.5;g.stroke();
 // 水面高光
 g.beginPath();g.ellipse(BOWL.x-rx*.38+slosh,cy-ry*.32,rx*.22,ry*.12,-.2,0,7);g.fillStyle='rgba(255,255,255,.55)';g.fill();
 }
 // 打旋
 const sw=O.swirl+(O.d.clog==='soft'&&O.observed&&O.hp>0?.25:0);
 if(sw>0){g.strokeStyle=`rgba(255,255,255,${Math.min(.85,sw*.45)})`;g.lineWidth=3;g.lineCap='round';
  for(let i=0;i<3;i++){g.beginPath();const a0=S.t*(1+sw*2)+i*2.1;g.ellipse(BOWL.x,cy,rx*(.3+i*.2),ry*(.3+i*.2),0,a0,a0+1.6);g.stroke();}g.lineCap='butt';}
 // 软堵：卡通纸团（带描边，不写实）
 if(!ART.ok&&O.d.clog==='soft'&&O.hp>0&&O.observed){g.globalAlpha=.45*(O.hp/O.hpMax)+.15;for(let i=0;i<4;i++){const px=BOWL.x+Math.cos(i*1.7+S.t*.5)*rx*.3,py=cy+Math.sin(i*1.7)*ry*.25;g.beginPath();g.ellipse(px,py,12,7,i,0,7);g.fillStyle='#F7F3EA';g.fill();g.lineWidth=1.5;g.strokeStyle='rgba(59,42,32,.35)';g.stroke();}g.globalAlpha=1;}
 // 硬物剪影
 if(!ART.ok&&O.d.clog==='hard'&&O.hp>0&&O.observed&&!O.objOut){g.globalAlpha=.3+.1*Math.sin(S.t*2);drawDuck(BOWL.x+8,cy+6,.7,'#2F5570');g.globalAlpha=1;
  if(Math.random()<.01)parts.push({x:BOWL.x+rnd(-10,10),y:cy,vx:0,vy:-40,life:.5,color:'#E6F7FF',r:4,g:-50});}
 if(O.reveal>0){const a=Math.min(1,O.reveal)*(.6+.4*Math.sin(S.t*10));g.setLineDash([6,5]);g.lineWidth=3;g.strokeStyle=`rgba(255,226,120,${a})`;
  if(masterFault()==='high_water'){const l2=splashAbove();g.beginPath();g.ellipse(BOWL.x,WATER_Y-(l2-.35)*14,INNER.rx*(.32+.66*l2),INNER.ry*(.32+.66*l2),0,0,7);g.stroke();}
  else{g.beginPath();g.ellipse(BOWL.x+8,cy+6,O.d.clog==='hard'?32:46,O.d.clog==='hard'?20:26,0,0,7);g.stroke();}g.setLineDash([]);}
 g.restore();
 // 满水高光边
 if(l>.8){g.beginPath();g.ellipse(BOWL.x,BOWL.y+4,INNER.rx,INNER.ry,0,0,7);g.strokeStyle=`rgba(79,168,218,${.45+.3*Math.sin(S.t*8)})`;g.lineWidth=4;g.stroke();}
}
function drawDuck(x,y,s,color){g.save();g.translate(x,y);g.scale(s,s);
 const solid=!color;g.beginPath();g.ellipse(0,10,34,22,0,0,7);g.fillStyle=color||'#ffd84a';g.fill();if(solid){g.lineWidth=3;g.strokeStyle=INK;g.stroke();}
 g.beginPath();g.arc(-14,-14,18,0,7);g.fillStyle=color||'#ffd84a';g.fill();if(solid){g.stroke();}
 if(solid){g.beginPath();g.ellipse(-34,-10,10,5,0,0,7);g.fillStyle='#ff8c2e';g.fill();g.stroke();g.beginPath();g.arc(-18,-18,3,0,7);g.fillStyle=INK;g.fill();}
 g.restore();}

function drawPlunger(x,y,comp,up,scale=1,ghostWin=false){
 g.save();g.translate(x,y+comp*12*scale);g.scale(scale,scale);
 const dy=comp*8;const cw=56+comp*12,ch=30-comp*8; // 往下压：整体下沉 + 胶头轻压扁，木柄下沉量=胶头变矮量，柄底始终藏在胶头里
 // 木柄：主体 + 右侧暗部 + 木纹
 const hd=()=>rr(-7,-132+dy,14,122,6);
 hd();g.fillStyle='#C58A4F';g.fill();shadeClip(hd,()=>{g.fillStyle='#A06A38';g.fillRect(2,-140+dy,8,140);g.strokeStyle='rgba(59,42,32,.35)';g.lineWidth=1.2;g.beginPath();g.moveTo(-3,-120+dy);g.quadraticCurveTo(-1,-80+dy,-3,-30+dy);g.stroke();});
 hd();g.lineWidth=3;g.strokeStyle=INK;g.stroke();
 if(!up){ // 旧款：两圈黄胶布
  for(const ty of [-96,-64]){rr(-9,ty+dy,18,11,3);fs('#F2C84B',2.5);g.strokeStyle='rgba(59,42,32,.4)';g.lineWidth=1;g.beginPath();g.moveTo(-9,ty+5+dy);g.lineTo(9,ty+3+dy);g.stroke();}
 }else{ // 加压款：黑色握把 + 金属箍
  rr(-9,-134+dy,18,40,6);fs('#2B2B30',3);g.fillStyle='rgba(255,255,255,.25)';for(let i=0;i<4;i++)g.fillRect(-6,-128+i*9+dy,12,2);
  rr(-10,-22+dy,20,10,3);fs('#B9C3CC',2.5);
 }
 // 胶头
 const body=up?'#3F7FE0':'#D9413A',dark=up?'#2C5FB0':'#A8322A',lite=up?'#8DB6F5':'#F08A7E';
 const cup=()=>{g.beginPath();g.moveTo(-cw/2,0);g.quadraticCurveTo(-cw/2,-ch-6,0,-ch-8);g.quadraticCurveTo(cw/2,-ch-6,cw/2,0);g.closePath();};
 cup();g.fillStyle=body;g.fill();
 shadeClip(cup,()=>{g.fillStyle=dark;g.fillRect(cw*.12,-ch-20,cw,ch+30);g.beginPath();g.ellipse(-cw*.22,-ch*.55,cw*.09,ch*.22,-.5,0,7);g.fillStyle=lite;g.fill();
  if(up){g.strokeStyle=dark;g.lineWidth=2.5;g.beginPath();g.moveTo(-cw*.42,-ch*.45);g.quadraticCurveTo(0,-ch*.75,cw*.42,-ch*.45);g.stroke();}});
 cup();g.lineWidth=3.5;g.strokeStyle=INK;g.stroke();
 g.beginPath();g.ellipse(0,0,cw/2,7,0,0,7);fs(dark,3);
 g.restore();}
function drawScoop(x,y,full,scale=1){g.save();g.translate(x,y);g.scale(scale,scale);
 // 柄（带挂孔）
 rr(14,-8,54,13,6);fs('#4F9BE0',3);g.beginPath();g.arc(58,-1.5,3.2,0,7);g.fillStyle=INK;g.fill();
 // 瓢身
 const bowl=()=>{g.beginPath();g.arc(0,0,26,0,Math.PI);g.closePath();};
 bowl();g.fillStyle='#5AA9EE';g.fill();shadeClip(bowl,()=>{g.fillStyle='#3E86CC';g.fillRect(6,0,30,30);g.beginPath();g.ellipse(-12,12,4,7,.4,0,7);g.fillStyle='#A9D6FA';g.fill();});
 bowl();g.lineWidth=3.5;g.strokeStyle=INK;g.stroke();
 g.beginPath();g.ellipse(0,0,26,8,0,0,7);fs('#7FC0F5',3);
 if(full){g.beginPath();g.ellipse(0,1,21,5,0,0,7);g.fillStyle='#CFEFFF';g.fill();g.beginPath();g.ellipse(-7,0,5,1.6,0,0,7);g.fillStyle='#fff';g.fill();}
 g.restore();}
function drawSnake(x,y,spin,scale=1){g.save();g.translate(x,y);g.scale(scale,scale);
 // 收线鼓
 const drum=()=>{g.beginPath();g.arc(0,-40,30,0,7);};
 drum();g.fillStyle='#8A96A3';g.fill();shadeClip(drum,()=>{g.fillStyle='#6E7A87';g.fillRect(8,-75,30,70);});drum();g.lineWidth=3.5;g.strokeStyle=INK;g.stroke();
 // 盘起的弹簧线
 g.strokeStyle='rgba(59,42,32,.45)';g.lineWidth=1.5;for(let i=0;i<3;i++){g.beginPath();g.arc(0,-40,24-i*4,spin+i,spin+i+4.2);g.stroke();}
 g.beginPath();g.arc(0,-40,13,0,7);fs('#B9C3CC',2.5);
 // 摇把
 g.save();g.translate(0,-40);g.rotate(spin);rr(-4,-30,8,30,4);fs('#F2C84B',2.5);g.beginPath();g.arc(0,-30,7,0,7);fs('#D9413A',2.5);g.restore();
 // 出线口
 rr(-5,-12,10,14,3);fs('#5B6670',2.5);
 g.strokeStyle='#5B6670';g.lineWidth=4;g.beginPath();g.moveTo(0,2);g.lineTo(0,12);g.stroke();g.restore();}
function drawHeld(){
 if(!held||!O)return;const h=held;
 if(h.attached){
  if(h.id==='plunger'){
   const p=O.plunger;drawPlunger(BOWL.x,WATER_Y-2,p.comp,S.upgraded);
   // 节奏圈
   const {ws,wl,ps,pl}=win(S.upgraded),old=win(false),tot=Math.max(ws+wl,old.ws+old.wl)+.25,cx=BOWL.x+92,cy=WATER_Y-95,R=24;
   g.beginPath();g.arc(cx,cy,R,0,7);g.fillStyle='rgba(40,25,18,.55)';g.fill();
   const arc=(a,b,c,lw)=>{g.beginPath();g.arc(cx,cy,R,-Math.PI/2+a/tot*Math.PI*2,-Math.PI/2+b/tot*Math.PI*2);g.strokeStyle=c;g.lineWidth=lw;g.stroke();};
   arc(0,ws,'#777',6);arc(ws,ws+wl,'#4fdc8a',6);arc(ps,ps+pl,'#d6ffe6',8);arc(ws+wl,tot,'#d65a4a',6);
   if(O.ghost>0){g.setLineDash([4,4]);arc(old.ws,old.ws+old.wl,'rgba(255,255,255,'+Math.min(1,O.ghost)+')',10);g.setLineDash([]);
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
function drawTray(){if(ART.ok){artTray(['plunger','scoop','snake'].map(id=>O&&O.d.tools.includes(id)?id:null).concat([null]));
  ['plunger','scoop','snake'].forEach((id,i)=>{const x=SLOTS[i];if(O&&O.hlT>0&&O.hlTool===id){rr(x-34,TB.slotTop-4,68,TB.slotBot-TB.slotTop+8,12);g.strokeStyle=`rgba(255,226,122,${.6+.4*Math.sin(S.t*14)})`;g.lineWidth=4;g.stroke();}
   if(O&&id==='snake'&&O.d.id===3&&!O.usedSnake&&O.d.tools.includes(id)){rr(x+6,TB.slotTop-6,34,16,8);fs('#D9413A');txt('NEW',x+23,TB.slotTop+2,10,'#fff');}
   if(O&&lockTools()&&O.d.tools.includes(id)){rr(x-32,TB.slotTop,64,TB.slotBot-TB.slotTop,8);g.fillStyle='rgba(60,40,30,.45)';g.fill();}});return;}
 g.fillStyle='#6b4a36';g.fillRect(0,TRAY_Y,W,H-TRAY_Y);g.fillStyle='#7d573f';g.fillRect(0,TRAY_Y,W,8);
 ['plunger','scoop','snake'].forEach((id,i)=>{const x=SLOTS[i],y=TRAY_Y+44;const avail=O&&O.d.tools.includes(id);
  rr(x-46,y-36,92,76,14);fs(avail?'#f3e6cf':'#8a6a55',3);
  if(avail){const inUse=held&&held.id===id;g.globalAlpha=inUse?.3:1;
   if(id==='plunger')drawPlunger(x,y+22,0,S.upgraded,.5);if(id==='scoop')drawScoop(x-10,y-4,false,1.05);if(id==='snake')drawSnake(x,y+16,0,.82);g.globalAlpha=1;
   txt(TOOLS[id].name,x,y+30,13,INK);
   if(O.hlT>0&&O.hlTool===id){rr(x-50,y-40,100,84,16);g.strokeStyle=`rgba(255,207,63,${.6+.4*Math.sin(S.t*14)})`;g.lineWidth=5;g.stroke();}
   if(id==='snake'&&O.d.id===3&&!O.usedSnake){rr(x+16,y-44,38,18,9);fs('#e0533f',2);txt('NEW',x+35,y-35,11,'#fff');}
   if(lockTools()){rr(x-46,y-36,92,76,14);g.fillStyle='rgba(60,40,30,.45)';g.fill();}}
  else{txt('?',x,y,30,'#5d4535');}
 });
}
function drawHUD(){ // ui-spec v1.1 §HUD
 const F='"Noto Sans CJK SC","PingFang SC",sans-serif';
 if(O){ // 客户卡：左16 上48 宽80，头像60，下面4格耐心
  rr(16,48,80,92,12);fs('#FFF8EC',2);if(!hudAvatar()){avatar(custOf()||'hero',56,86,30);
  g.font='22px sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText(O.face,82,108);}
  const mx=O.d.patMax||4,sw=12,gp=4,tw=mx*sw+(mx-1)*gp,x0=56-tw/2;
  for(let i=0;i<mx;i++){rr(x0+i*(sw+gp),124,sw,8,3);g.fillStyle=i<O.pat?(O.pat<=1?'#D9413A':'#5DBB63'):'#E6D9C3';g.fill();}}
 // 金币胶囊：右16 上48 高40
 g.font='700 16px '+F;const mt=String(S.money),cw=Math.max(88,g.measureText(mt).width+56),cx=W-16-cw;
 rr(cx,48,cw,40,20);fs('#FFF8EC',2);g.beginPath();g.arc(cx+20,68,12,0,7);fs('#FFC83D',2);txt('¥',cx+20,69,12,'#5A4030','center','700');
 txt(mt,cx+cw-14,69,16,'#5A4030','right','700');
 // ⚙：48圆，右16 上96
 g.beginPath();g.arc(W-40,120,24,0,7);fs('#FFF8EC',2);txt('⚙',W-40,121,22,'#5A4030');buttons.push({x:W-64,y:96,w:48,h:48,fn:()=>{audioInit();SFX.click();S.settings=true;}});
 if(O){ // 「本单 ¥」：⚙左边8，高48
  const tw2=80,tx=W-64-8-tw2;rr(tx,96,tw2,48,12);fs('#FFF8EC',2);txt('本单 ¥'+O.d.base,tx+tw2/2,O.startT!=null?112:120,14,'#5A4030','center','700');
  if(O.startT!=null){const el=(O.anim&&O.anim.type==='win')||O.phase==='done'||(S.screen!=='play'&&S.screen!=='lock')?O.elapsed:S.t-O.startT;txt(el.toFixed(1)+'s',tx+tw2/2,131,12,'#8A6F5A','center','400');}}
 // 旧手机：右16 下32，64×96，−10°
 if(!phoneArt()){g.save();g.translate(W-16-32,H-32-48);g.rotate(-10*Math.PI/180);rr(-32,-48,64,96,10);fs('#2d2d33');rr(-26,-38,52,70,5);g.fillStyle='#4a6a80';g.fill();
 g.strokeStyle='rgba(255,255,255,.5)';g.lineWidth=1;g.beginPath();g.moveTo(-18,-30);g.lineTo(10,20);g.stroke();g.restore();}
 if(PH.unread>0){g.beginPath();g.arc(W-22,H-124,10,0,7);g.fillStyle='#D9413A';g.fill();txt(String(PH.unread),W-22,H-124,12,'#fff','center','700');}
 if(O&&!O.lock&&S.screen==='play'&&!S.ad&&!S.callUI)drawMasterBtn();
}
function drawHintBubble(){ // ui-spec：左16 上160，最大宽240
 if(!O||O.hintT<=0||!O.hint)return;const a=Math.min(1,O.hintT*2);g.globalAlpha=a;
 const L=bubbleText(O.hint,240-32);g.font='700 14px "Noto Sans CJK SC","PingFang SC",sans-serif';const w=Math.min(240,Math.max(...L.map(l=>g.measureText(l).width))+32),h=L.length*20+20;
 rr(16,160,w,h,16);fs('#FFF8EC',2);L.forEach((l,i)=>txt(l,16+16,160+20+i*20,14,'#5A4030','left','700'));g.globalAlpha=1;
}
function phoneTarget(){return PH.chats.family_group?'chat:family_group':'list';}
function phoneBtn(){if(PH.open||S.screen==='title'||S.dexCard)return;
 if(canOpenPhone())buttons.push({x:W-16-64,y:H-32-96,w:64,h:96,fn:()=>openPhone(phoneTarget())});
 else if((S.screen==='play'||S.screen==='lock')&&O&&!O.anim)buttons.push({x:W-16-64,y:H-32-96,w:64,h:96,fn:()=>{if(PH.unread)say('（先干活，修完再看手机）',1.4);}});}
function gearBtn(x,y){rr(x,y,44,44,14);fs('#fff8eb',2.5);g.font='22px sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillStyle=INK;g.fillText('⚙',x+22,y+23);
 buttons.push({x,y,w:44,h:44,fn:()=>{audioInit();SFX.click();S.settings=true;}});}
function drawSettings(){if(!S.settings)return;g.fillStyle='rgba(20,12,8,.5)';g.fillRect(0,0,W,H);buttons.push({x:0,y:0,w:W,h:H,fn:()=>{S.settings=false;SFX.click();}});
 const X=40,Y=200,PW=W-80,PHh=306;rr(X,Y,PW,PHh,20);fs('#fff8eb',4);buttons.push({x:X,y:Y,w:PW,h:PHh,fn:()=>{}});
 txt('设置',W/2,Y+30,18,INK,'center','800');
 const row=(i,label,on,fn,dis,note)=>{const y=Y+62+i*52;txt(label,X+20,y+18,15,dis?'#b8a898':INK,'left','700');
  const sx=X+PW-74;rr(sx,y+4,56,28,14);g.fillStyle=dis?'#ddd':on?'#4fc26f':'#cbbfae';g.fill();g.beginPath();g.arc(on&&!dis?sx+42:sx+14,y+18,11,0,7);g.fillStyle='#fff';g.fill();
  if(note)txt(note,sx-8,y+18,11,'#a08878','right','500');if(!dis)buttons.push({x:X,y,w:PW,h:44,fn:()=>{fn();persist();SFX.click();}});};
 row(0,'🔊 声音',!save.muted,()=>{save.muted=!save.muted;});
 row(1,'🐢 省动效',!!save.reduced,()=>{save.reduced=!save.reduced;});txt('减少抖动和闪光',X+20,Y+62+52+36,11,'#a08878','left','500');
 row(2,'📳 震动',!save.novibe,()=>{save.novibe=!save.novibe;},!CAN_VIBRATE,!CAN_VIBRATE?'本机不支持':'');
 const left=Math.max(0,CM().freePerDay-(S.masterFree||0));
 button(S.copied>0?'已复制 ✔':'复制用时',W/2-60,Y+222,120,32,copyTimes,'#fff8eb'); // 策划：真实玩家导出用时调判定窗口
 txt(`老钱求助：今日免费 ${left} 次`,W/2,Y+PHh-24,12,'#7a5a48','center','600');}
function drawMasterBtn(){if((O.masterCalls||0)>=CM().maxPerOrder)return;const ready=masterReady(); // ui-spec：56圆，右20 上560
 const cx=W-20-28,cy=588,wob=ready?Math.sin(S.t*14)*Math.max(0,Math.sin(S.t*2.2))*3:0;g.save();g.translate(wob,0);
 if(ready&&!S.masterHinted){S.masterHinted=true;say('卡住了？问问老钱',3);} // ui-spec：首次亮起时在提示位说一句
 if(masterBtnArt(cx,cy,ready)){if(ready){g.beginPath();g.arc(cx,cy,31,0,7);g.strokeStyle=`rgba(255,226,122,${.6+.4*Math.sin(S.t*6)})`;g.lineWidth=3;g.stroke();}}else{g.beginPath();g.arc(cx,cy,28,0,7);fs(ready?'#FFF8EC':'rgba(220,210,195,.75)',2);avatar('lao_qian',cx,cy-4,17);txt('问老钱',cx,cy+19,10,ready?'#5A4030':'#9a8a7a','center','700');}
 if(ready){const free=masterFree(),lab=free?'今日免费':'▶广告',bw=free?54:42;rr(cx-bw/2,cy-42,bw,18,9);fs(free?'#5DBB63':'#F5B92E');txt(lab,cx,cy-33,10,free?'#fff':'#5A4030','center','700');}
 g.restore();if(ready)buttons.push({x:cx-28,y:cy-42,w:56,h:70,fn:()=>{audioInit();SFX.click();askMaster();}});}
function drawAd(){if(S.callUI){const c=S.callUI;g.fillStyle='rgba(20,12,8,.55)';g.fillRect(0,0,W,H);buttons.push({x:0,y:0,w:W,h:H,fn:callTap});
  const art=callBgArt();const Y0=art?520:170;if(art){const gr=g.createLinearGradient(0,440,0,H);gr.addColorStop(0,'rgba(20,12,8,0)');gr.addColorStop(.35,'rgba(20,12,8,.75)');gr.addColorStop(1,'rgba(20,12,8,.9)');g.fillStyle=gr;g.fillRect(0,440,W,H-440);}
  else{rr(30,170,W-60,250,20);fs('#2b2b33',2);avatar('lao_qian',W/2,220,28);}txt(cname('lao_qian')+' · 通话中',W/2,Y0+(art?0:96),14,'#bbb','center','600');
  let yy=Y0+(art?32:128);for(let i=0;i<=c.i;i++){const L=bubbleText(c.lines[i],W-120);L.forEach(l=>{txt(l,W/2,yy,15,i===c.i?'#fff':'#999','center','600');yy+=21;});yy+=6;}
  txt(c.i<c.lines.length-1?'点一下继续':'点一下挂断',W/2,art?H-40:402,12,'#888','center','500');}
 if(!S.ad)return;g.fillStyle='rgba(10,10,14,.88)';g.fillRect(0,0,W,H);buttons.push({x:0,y:0,w:W,h:H,fn:()=>{}});
 rr(40,250,W-80,240,18);fs('#2b2b33',2);txt('广告占位',W/2,300,15,'#aaa');txt('（正式版这里播激励视频）',W/2,328,13,'#888','center','500');
 txt('📞 正在接通'+cname('lao_qian')+'…',W/2,390,18,'#fff');otxt(String(Math.ceil(S.ad.dur-S.ad.t)),W/2,440,34,'#ffcf3f');}
function avatar(id,x,y,r){const nm=cname(id);let hsh=0;for(const c of id)hsh=(hsh*31+c.charCodeAt(0))%360;g.beginPath();g.arc(x,y,r,0,7);g.fillStyle=id==='hero'?'#7aa7c7':`hsl(${hsh},45%,62%)`;g.fill();
 txt(id==='hero'?'我':nm.slice(-1),x,y+1,r*.95,'#fff','center','700');}
function bubbleText(t,maxW){g.font='500 13px -apple-system,"PingFang SC","Noto Sans CJK SC",sans-serif';const out=[];let cur='';for(const ch of t){if(g.measureText(cur+ch).width>maxW){out.push(cur);cur=ch;}else cur+=ch;}if(cur)out.push(cur);return out;}
function drawPhone(){if(!PH.open)return;
 g.fillStyle='rgba(20,12,8,.6)';g.fillRect(0,0,W,H);buttons.push({x:0,y:0,w:W,h:H,fn:()=>{PH.open=false;SFX.click();}});
 const X=28,Y=96,PW=W-56,PHh=650;rr(X-8,Y-8,PW+16,PHh+16,26);fs('#1e1e22',3);
 g.save();rr(X,Y,PW,PHh,18);g.clip();g.fillStyle='#ededed';g.fillRect(X,Y,PW,PHh);
 buttons.push({x:X,y:Y,w:PW,h:PHh,fn:()=>{}});
 // 顶栏
 g.fillStyle='#f7f7f7';g.fillRect(X,Y,PW,46);g.fillStyle='#ddd';g.fillRect(X,Y+46,PW,1);
 const v=PH.view;const back=v!=='list';
 if(back){txt('‹',X+18,Y+23,26,'#222');buttons.push({x:X,y:Y,w:60,h:46,fn:()=>{PH.view=v==='members'?'chat:family_group':'list';SFX.click();}});}
 txt(v==='list'?appName()+(PH.unread?`(${PH.unread})`:''):v==='members'?'群成员('+NAR.family_group.member_count_display+')':chatTitle(v.slice(5)),X+PW/2,Y+23,15,'#222');
 txt('✕',X+PW-20,Y+23,16,'#666');buttons.push({x:X+PW-50,y:Y,w:50,h:46,fn:()=>{PH.open=false;SFX.click();}});
 const top=Y+47;
 if(v==='list'){PH.order.forEach((ch,i)=>{const c=PH.chats[ch];const y=top+i*64;g.fillStyle='#fff';g.fillRect(X,y,PW,63);
   if(ch==='family_group'){rr(X+12,y+10,44,44,6);g.fillStyle='#d9d9d9';g.fill();NAR.family_group.members.slice(0,4).forEach((id,j)=>avatar(id,X+23+(j%2)*22,y+21+Math.floor(j/2)*22,9));}
   else avatar(ch.replace('dm_',''),X+34,y+32,22);
   const last=c.msgs[c.msgs.length-1];txt(chatTitle(ch),X+66,y+22,14,'#222','left','600');
   let pv=last?(ch==='family_group'?cname(last.sender)+'：':'')+last.text:'';const L=bubbleText(pv,PW-110);txt(L[0]+(L.length>1?'…':''),X+66,y+44,12,'#999','left','500');
   if(c.unread){g.beginPath();g.arc(X+52,y+12,8,0,7);g.fillStyle='#e8453c';g.fill();txt(String(c.unread),X+52,y+12,10,'#fff');}
   buttons.push({x:X,y,w:PW,h:63,fn:()=>{PH.view='chat:'+ch;readChat(ch);SFX.click();}});});
  txt('朋友圈（之后开放）',X+PW/2,Y+PHh-24,12,'#aaa','center','500');}
 else if(v==='members'){const mem=NAR.family_group.members;mem.forEach((id,i)=>{const cx=X+40+(i%5)*((PW-40)/5),cy=top+40+Math.floor(i/5)*72;avatar(id,cx,cy,22);txt(id==='hero'?'我':cname(id),cx,cy+34,12,'#555','center','500');});
  const n=mem.length,cx=X+40+(n%5)*((PW-40)/5),cy=top+40+Math.floor(n/5)*72;g.beginPath();g.arc(cx,cy,22,0,7);g.fillStyle='#ccc';g.fill();txt('+'+(NAR.family_group.member_count_display-n),cx,cy,13,'#fff');}
 else{const ch=v.slice(5),c=PH.chats[ch];let y=top+6;
  if(ch==='family_group'){g.fillStyle='#f7f7f7';g.fillRect(X,top,PW,40);NAR.family_group.members.slice(0,9).forEach((id,i)=>avatar(id,X+20+i*27,top+20,11));txt('+'+(NAR.family_group.member_count_display-9)+' ›',X+PW-24,top+20,12,'#888');
   buttons.push({x:X,y:top,w:PW,h:40,fn:()=>{PH.view='members';SFX.click();}});y=top+48;}
  // 只显示最近能放下的消息
  const items=c.msgs.map(m=>{const L=bubbleText(m.text,PW-120);return {m,L,h:Math.max(40,L.length*18+22)+(ch==='family_group'?14:0)};});
  const maxH=Y+PHh-40-y;let sum=0,start=items.length;while(start>0&&sum+items[start-1].h<=maxH){sum+=items[start-1].h;start--;}
  if(start>0){txt('· · ·',X+PW/2,y+6,12,'#aaa');y+=14;}
  items.slice(start).forEach(({m,L,h})=>{avatar(m.sender,X+24,y+18,15);let by=y;if(ch==='family_group'){txt(cname(m.sender),X+46,y+6,11,'#999','left','500');by+=14;}
   g.font='500 13px -apple-system,"PingFang SC","Noto Sans CJK SC",sans-serif';const bw=Math.max(...L.map(l=>g.measureText(l).width))+20;rr(X+46,by,bw,L.length*18+14,6);g.fillStyle=m.isNew?'#fff':'#fafafa';g.fill();
   L.forEach((l,i)=>txt(l,X+56,by+16+i*18,13,'#222','left','500'));y+=h;});
  txt(ch==='family_group'?'你：'+(NAR.family_group.hero_status||'已读不回'):'已读',X+PW/2,Y+PHh-20,12,'#aaa','center','500');}
 g.restore();}
function drawObserveHint(){
 if(!O||O.phase!=='observe'||O.anim||S.screen!=='play')return;
 const y=FLUSH.y+40+Math.sin(S.t*6)*6;g.font='34px sans-serif';g.textAlign='center';g.fillText('👆',FLUSH.x+30,y);
 if(O.d.id===1&&!(O.hintT>0&&O.hint)){const t='先冲一下水，看看什么情况';g.font='700 14px "Noto Sans CJK SC","PingFang SC",sans-serif';const w=Math.min(240,g.measureText(t).width+32);rr(16,160,w,40,16);fs('#FFF8EC',2);txt(t,32,180,14,'#5A4030','left','700');} // ui-spec：气泡位 left16 top160
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
 if(S.screen==='title'){drawTitle();drawSettings();return;}
 if(S.screen==='lock'||S.screen==='board'||(S.screen==='reveal'&&O&&O.lock)||(S.screen==='result'&&O&&O.lock)||(S.screen==='end'&&S.day>1)){G2draw(sx,sy);if(S.screen==='result')drawResult();if(S.screen==='end')drawEnd();phoneBtn();drawPhone();drawAd();drawSettings();return;}
 g.save();g.translate(sx,sy);drawBathroom();drawToilet();drawHeld();drawFX();g.restore();
 drawTray();drawHUD();drawHintBubble();drawObserveHint();
 if(S.screen==='brief')drawBrief();
 if(S.screen==='result')drawResult();
 if(S.screen==='upgrade')drawUpgrade();
 if(S.screen==='end')drawEnd();
 if(S.screen==='reveal')drawReveal();
 if(S.screen==='offer')drawOffer();
 if(S.dexCard)drawDexCard();
 drawBetweenToast();phoneBtn();drawPhone();drawAd();drawSettings();
}
function drawTitle(){
 g.fillStyle='#efe2c4';g.fillRect(0,0,W,H);g.fillStyle='#a9d3c0';g.fillRect(0,H*.55,W,H*.45);
 otxt('重生之我在',W/2,170,30,'#fff8eb');otxt('澳洲修马桶',W/2,215,42,'#ffcf3f');
 drawPlunger(W/2,470+Math.sin(S.t*3)*6,(Math.sin(S.t*3)+1)/2*.6,false,1.4);
 button('开 工',W/2-90,560,180,60,()=>{S.money=0;S.spent=0;S.idx=0;S.upgraded=false;S.dex=[];S.times={};phoneReset();S.masterFree=0;S.doubleToday=0;S.giftToday=0;G2reset();startOrder(0);},'#ffb53d');
 txt('建议用手机竖屏打开，戴耳机体验更好',W/2,650,13,'#6b4a36','center','500');
 gearBtn(W/2-22,686);
}
function panel(y,h){g.fillStyle='rgba(20,12,8,.5)';g.fillRect(0,0,W,H);rr(24,y,W-48,h,22);fs('#fff8eb',4);}
function orderMsg(d){const c=NAR&&NAR.calls&&NAR.calls[d.key];const urgent=!!(c&&c.type==='call');if(d.g2)return {urgent:false,who:d.client,text:d.boardHint||d.line,voice:false};
 const m=NAR&&NAR.order_messages&&NAR.order_messages[d.key];
 const who=(m&&m.sender)||(c&&c.caller)||null;const text=((m&&m.text)||(c&&c.text)||d.line||'').replace(/^\[语音\]\s*/,'');
 return {urgent,who,text,voice:!!(c&&c.type==='voice'&&!m)};}
function drawBrief(){
 const d=O.d,M=orderMsg(d);
 if(!O.msgIn&&!M.urgent&&M.who){O.msgIn=true;O.briefT=0;deliver({channel:'dm_'+M.who,sender:M.who,raw:M.text});SFX.notify();buzz([15,60,15]);}
 if(!O.callAccepted){O.briefT=(O.briefT||0)+1/60;
  if(M.urgent){O.ringT=(O.ringT||0);if(O.ringT<=0){O.ringT=1.4;SFX.ring();}O.ringT-=1/60;
   panel(200,330);const k=1+Math.sin(S.t*12)*.04;g.save();g.translate(W/2,300);g.scale(k,k);avatar(M.who,0,0,38);g.restore();
   txt(cname(M.who),W/2,362,20,INK,'center','800');txt('急单来电…',W/2,392,14,'#c0392b');
   button('📞 接听',W/2-80,488,160,48,()=>{O.callAccepted=true;},'#4fc26f','#fff');return;}
  // 普通单：右下角手机冒出喂信消息，点开看订单
  const accept=()=>{O.callAccepted=true;readChat('dm_'+M.who);SFX.click();};
  buttons.push({x:0,y:0,w:W,h:H,fn:accept});
  if(O.briefT>.3){const k=Math.min(1,(O.briefT-.3)*4);drawNotify([{ch:cname(M.who),text:M.text,channel:'dm_'+M.who}],k,O.briefT-.3,accept);}
  if(O.briefT>1.2)txt('点消息看看',W/2,600,14,INK,'center','700');
  return;}
 panel(200,330);
 txt(M.urgent?'📞 急单':'💬 '+appName()+' · '+cname(M.who),W/2,236,15,M.urgent?'#c0392b':'#7a5a48');txt(d.place,W/2,272,22,INK,'center','800');
 g.font='54px sans-serif';g.textAlign='center';g.fillText(d.face,W/2,335);
 txt(d.who,W/2,380,15,'#7a5a48');
 const lines=wrap(`“${M.text}”`,W-100,16);lines.forEach((l,i)=>txt(l,W/2,412+i*24,16,INK,'center','600'));
 txt(`工钱 ¥${d.base}`+(d.isCall?`（来电单 ×${d.payX}）`:''),W/2,470,13,'#2f8a4a');
 button('上门',W/2-80,488,160,48,()=>{goReveal();},'#ffb53d');
}
function wrap(t,maxW,size){g.font=`600 ${size}px sans-serif`;const out=[];let cur='';for(const ch of t){if(g.measureText(cur+ch).width>maxW){out.push(cur);cur=ch;}else cur+=ch;}if(cur)out.push(cur);return out;}
// 右下角旧手机亮起 + 微信样式通知预览（可忽略，不承载玩法）
function wxIcon(x,y,s){ // 原创「喂信」图标：单气泡 + 声波，不用微信的双气泡造型
 rr(x,y,s,s,s*.26);g.fillStyle='#2BC46B';g.fill();
 g.save();rr(x,y,s,s,s*.26);g.clip();g.fillStyle='#22A85A';g.fillRect(x,y+s*.62,s,s*.4);g.restore();
 // 白色气泡（圆角方 + 左下尾巴）
 rr(x+s*.18,y+s*.2,s*.64,s*.48,s*.2);g.fillStyle='#fff';g.fill();
 g.beginPath();g.moveTo(x+s*.3,y+s*.62);g.lineTo(x+s*.24,y+s*.8);g.lineTo(x+s*.44,y+s*.66);g.closePath();g.fill();
 // 声波「喂」
 g.strokeStyle='#2BC46B';g.lineCap='round';g.lineWidth=Math.max(1.2,s*.07);
 g.beginPath();g.arc(x+s*.38,y+s*.44,s*.07,-1,1);g.stroke();
 g.beginPath();g.arc(x+s*.38,y+s*.44,s*.16,-.9,.9);g.stroke();
 g.beginPath();g.arc(x+s*.38,y+s*.44,s*.25,-.8,.8);g.stroke();g.lineCap='butt';
}
// 两单之间的通知条：离开结算后才从顶部滑下，结算/升级/设置/手机打开时不出
function drawBetweenToast(){if(!S.toastQ||!S.toastQ.length)return;if(['result','upgrade','end','offer','title'].includes(S.screen)||S.settings||PH.open||S.ad||S.callUI){return;}
 if(S.toastT==null){S.toastT=0;}S.toastT+=1/60;if(S.toastT>3.6){S.toastQ=null;S.toastT=null;return;}
 const k=Math.min(1,S.toastT*4,(3.6-S.toastT)*3);drawNotify(S.toastQ,k,S.toastT,()=>{S.toastQ=null;S.toastT=null;openPhone(phoneTarget());},16);}
function drawNotify(m,k,t,onTap,top){
 if(top==null){const wob=t<.6?Math.sin(t*60)*2:0;g.save();g.translate(wob,0);rr(336,628,40,56,7);fs('#2d2d33');rr(340,634,32,40,4);g.fillStyle='#bfe3ff';g.fill();wxIcon(346,642,20);g.restore();}

 const rows=[];m.forEach(n=>{let r=rows.find(r=>r.ch===n.ch);if(!r){r={ch:n.ch,n:0};rows.push(r);}r.n++;r.text=n.text;});
 const h=40+rows.length*20,x=top!=null?(W-296)/2:30,y=top!=null?top:686-h;g.save();g.globalAlpha=k;g.translate(0,(1-k)*(top!=null?-30:30));
 buttons.push({x,y,w:296,h,fn:onTap||(()=>openPhone(rows.length===1?'chat:'+m[m.length-1].channel:'list'))});
 rr(x,y,296,h,12);fs('rgba(250,250,250,.97)',2);wxIcon(x+10,y+9,18);txt(appName(),x+34,y+18,12,'#888','left','600');txt('现在',x+284,y+18,11,'#aaa','right','500');
 rows.forEach((r,i)=>{const yy=y+40+i*20;const head=(r.n>1?`[${r.n}条]`:'')+r.ch+'：';txt(head,x+12,yy,13,'#222','left','700');g.font='700 13px -apple-system,"PingFang SC","Noto Sans CJK SC",sans-serif';const hw=g.measureText(head).width;
  g.font='500 13px -apple-system,"PingFang SC","Noto Sans CJK SC",sans-serif';let t=r.text;const max=272-hw;if(g.measureText(t).width>max){while(t.length&&g.measureText(t+'…').width>max)t=t.slice(0,-1);t+='…';}txt(t,x+12+hw,yy,13,'#444','left','500');});
 g.restore();g.globalAlpha=1;}
function drawResult(){
 const r=S.result;const showDbl=!r.doubled&&(S.doubleToday||0)<dblCfg().maxPerDay;panel(128,(showDbl?621:557)+24-128); // ui-spec：结算卡 top128，内边距24
 if(!resultAvatar(r)){g.font='60px sans-serif';g.textAlign='center';g.fillText(r.face,W/2,215);}
 txt(r.d.who+'：'+(r.said||(r.face==='👍'?'师傅手艺真好！':'行，通了就好。')),W/2,252,15,INK,'center','600');if(r.heroSaid)txt('你：'+r.heroSaid,W/2,276,13,'#7a5a48','center','500');
 txt('工钱',90,305,15,'#7a5a48','left');txt('¥'+r.base,W-90,305,15,INK,'right');
 txt('好评',90,333,15,'#7a5a48','left');txt('★'.repeat(r.stars)+'☆'.repeat(Math.max(0,PAT().max-r.stars)),W-90,333,16,'#e0a020','right');
 txt('用时',90,361,15,'#7a5a48','left');txt(r.elapsed.toFixed(1)+' 秒',W-90,361,15,INK,'right');if(r.isBest)txt('新纪录！',W/2,361,13,'#2f8a4a');else if(r.prevBest!=null)txt('最佳 '+r.prevBest.toFixed(1)+'s',W/2,361,12,'#a08878','center','500');
 if(r.d.id===4&&S.times[2]){const diff=S.times[2]-r.elapsed;
  rr(50,380,W-100,34,10);fs(diff>0?'#d8ffe6':'#ffe3dc',2);txt(diff>0?`比第 2 单（同款满水堵）快了 ${diff.toFixed(1)} 秒`:`比第 2 单慢了 ${(-diff).toFixed(1)} 秒`,W/2,397,14,INK);}
 if(r.gift){const gy=r.d.id===4&&S.times[2]?430:398;const im=giftIcon(r.gift.icon);if(im)g.drawImage(im,70,gy-12,24,24);
  txt(r.gift.cash?`客户硬塞 ¥${r.gift.cash}`:`收到 ${r.gift.item}`,100,gy,14,INK,'left','700');if(r.gift.line&&gy<420)txt('“'+r.gift.line+'”',W/2,gy+22,12,'#7a5a48','center','500');}
 otxt('+¥'+r.coinsShown,W/2,462,40,'#ffcf3f');
 if(S.resultT>1&&showDbl)button('▶ 看广告 工钱翻倍',W/2-90,573,180,48,()=>{Ads.rewarded('doublePay').then(ok=>{if(!ok||r.doubled)return;r.doubled=true;S.doubleToday=(S.doubleToday||0)+1;const add=r.base*(dblCfg().multiplier-1);r.total+=add;r.base+=add;if(r.paid)S.money+=add;SFX.coin();});},'#fff8eb');
 // 手机通知
 const next=r.d.g2?'继续 ▶':r.d.id===ORDERS.length?'收工':'接下一单 ▶';
 if(S.resultT>1&&r.d.g2)button(next,W/2-90,505,180,52,()=>{S.phoneShown=false;G2afterResult(r.d);},'#ffb53d');
 else if(S.resultT>1)button(next,W/2-90,505,180,52,()=>{S.phoneShown=false;
  if(r.d.id===3){S.screen='upgrade';}else if(r.d.id===4){S.screen='end';recordRun();G2dayEnd();}else{S.idx++;startOrder(S.idx);}},'#ffb53d');
}
function drawUpgrade(){
 panel(110,540);txt('五金店 · 老陈',W/2,145,15,'#7a5a48');txt('加压皮搋子',W/2,180,26,INK,'center','800');
 drawPlunger(120,370,0,false,1);drawPlunger(270,370,0,true,1.1);txt('现在',120,395,13,'#7a5a48');txt('升级后',270,395,13,'#2c5fb0');
 otxt('→',195,300,30,'#fff');
 const rows=['节奏窗口更宽，更容易按准','按准一下顶两下，没按准也有劲','吸附范围更大，丢过去就吸住'];
 rows.forEach((t,i)=>{txt('✔ '+t,60,430+i*30,15,INK,'left','600');});
 const cost=CFG.tools.plunger_pro.price,can=S.money>=cost;
 txt('你有 ¥'+S.money,W/2,530,14,'#2f8a4a');
 if(can)button(`买！¥${cost}`,W/2-125,560,150,52,()=>{S.money-=cost;S.spent=(S.spent||0)+cost;S.upgraded=true;SFX.success();buzz([30,30,80]);doShake(6);S.idx++;startOrder(S.idx);},'#ffb53d');
 else txt('钱不够',W/2-50,586,16,'#a08878');
 button('先不买',W/2+35,566,90,40,()=>{S.skipUp=true;S.idx++;startOrder(S.idx);},'#fff8eb');
}
function recordRun(){save.runs=save.runs||[];save.runs.push({at:new Date().toISOString(),t:{...S.times},money:S.money});save.runs=save.runs.slice(-20);persist();}
function timesText(){const t=S.times;return '修马桶G1用时 '+[1,2,3,4].map(i=>`第${i}单 ${t[i]!=null?t[i].toFixed(1)+'s':'-'}`).join('，')+`（第${(save.runs||[]).length}次通关）`;}
function copyTimes(){const s=timesText();const done=()=>{S.copied=2;};try{navigator.clipboard.writeText(s).then(done,()=>{prompt('复制这段发给我们',s);});}catch(e){prompt('复制这段发给我们',s);}}
function drawEnd(){
 if(S.day>1)return drawDayEnd();
 panel(140,470);txt('今天收工',W/2,180,26,INK,'center','800');
 txt('今日收入 ¥'+(S.money+(S.spent||0)),W/2,225,18,'#2f8a4a');
 txt('图鉴：'+(S.dex.length?'小黄鸭 ×1':'空'),W/2,260,15,INK);
 if(S.times[2]&&S.times[4])txt(`满水堵：${S.times[2].toFixed(1)}s → ${S.times[4].toFixed(1)}s`,W/2,290,14,'#2c5fb0');
  if(/[?&]debug=1/.test(location.search))button(S.copied>0?'已复制 ✔':'复制用时',W/2-55,314,110,28,copyTimes,'#fff8eb');
 txt('第 1 天',W/2,400,13,'#7a5a48');
 button('第 2 天 ▶',W/2-90,440,180,52,()=>G2nextDay(),'#4fc26f','#fff');
 button('再玩一遍',W/2-70,510,140,40,()=>{S.screen='title';O=null;S.copied=0;},'#ffb53d');
}

// 调试/测试钩子
window.__G={get G2(){return G2;},G2nextDay:()=>G2nextDay(),get ORDERS(){return ORDERS;},S,askMaster,masterReady,PH,openPhone,win,get CFG(){return CFG;},timesText,get save(){return save;},get O(){return O;},startOrder,setUpgraded:v=>S.upgraded=v};
requestAnimationFrame(loop);

// ---- 耐心 / 好评 / 打赏 ----
function patLose(){if(!O)return;O.pat=Math.max(0,O.pat-1);O.patFlash=.8;float('耐心 -1',W-80,96,'#ff8a7a',14);}
function drawPat(x,y){const mx=O.d.patMax||4;for(let i=0;i<mx;i++){const on=i<O.pat,cx=x-(mx-1)*9+i*18;g.beginPath();g.arc(cx,y,6,0,7);g.fillStyle=on?(O.pat<=1?'#e0533f':'#f0a030'):'#e2d6c2';g.fill();}
 if(O.patFlash>0){O.patFlash-=1/60;}}
function dblCfg(){return (ECO&&ECO.rewardedAds&&ECO.rewardedAds.doublePay)||{multiplier:2,maxPerDay:3};}
const GIFT_ICON={};const ICON_BY_ITEM={'两个苹果':'apples','一颗糖':'candy','一罐自家腌的咸菜':'pickles','两个车上拉的橙子':'oranges','两盒酸奶':'yogurt'};
function giftIcon(k){if(!k)return null;if(!(k in GIFT_ICON)){GIFT_ICON[k]=null;const im=new Image();im.onload=()=>{GIFT_ICON[k]=im;};im.src='assets/ui/gifts/gift_'+k+'_24@2x.png';}return GIFT_ICON[k];}
function rollGift(d,stars){const G=(ECO&&ECO.gifts)||{},NG=NAR.gifts||{};
 const sc=(G.scripted||[]).find(x=>x.order===d.key);
 if(sc){const e=NG[(sc.lineKey||'').replace(/^gifts\./,'')]||{};
  const ic=(e.icon||'').replace(/^gift_/,'');return sc.kind==='cash'?{cash:sc.amount,line:e.line,icon:ic||'cashroll'}:{item:e.item||sc.item,line:e.line,icon:ic||ICON_BY_ITEM[e.item]||'apples'};}
 const R=G.random;if(!R||(G.neverOn||[]).includes(d.key)||stars<(R.requiresRatingAtLeast||3)||(S.giftToday||0)>=(R.maxPerDay||1))return null;
 if(Math.random()>=(stars>=4?R.chanceIfRating4:R.chance))return null;S.giftToday=(S.giftToday||0)+1;
 if(R.itemPool&&R.itemPool.length&&Math.random()<(R.itemChance||0)){const k=R.itemPool[Math.floor(Math.random()*R.itemPool.length)],it=(NG.random_item_generic||{})['gift_'+k]||{};return {item:it.item||k,line:it.line,icon:k};}
 const [a,b]=R.cashRange||[5,10],cash=a+Math.floor(Math.random()*(b-a+1));
 const own=((NG.by_client||{})[d.client||(NAR.orders[d.key]||{}).client]||[]).find(x=>x.type==='cash');
 const gen=NG.random_cash_generic||['师傅辛苦。'];return {cash,line:own?own.line:gen[Math.floor(Math.random()*gen.length)],icon:'cashroll'};}
