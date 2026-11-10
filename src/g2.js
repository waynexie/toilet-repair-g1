// G2 骨架：营业日、接单板、开门亮相（第一人称首帧占位）、门锁顺手单与转介绍单。
// 数据：data/g2_orders.json（策划）、narrative.json 的 g2_hooks / workday_beats（叙事）、economy.json（策划）。
const G2={data:null,ord:{},day:1,board:[],done:[],pick:0,lockWangDone:false,referralUnlocked:false,screwdriver:false,dayStartMoney:0,offer:null};
const REVEAL_IMG={}; // 美术首帧：assets/reveal/<订单id>.png，没有就画占位
const REVEAL_READY=[]; // 放进图片后把订单 id 加到这里，比如 'o1'
function revealImg(key){if(!REVEAL_READY.includes(key))return null;if(!(key in REVEAL_IMG)){const im=new Image();REVEAL_IMG[key]=null;im.onload=()=>{REVEAL_IMG[key]=im;};im.src='assets/reveal/'+key+'.png';}return REVEAL_IMG[key];}
const PLACE={o5:'老小区三楼 · 王阿姨家',o6:'新小区 · 合租房',o7:'城郊自建房',lock_wang:'王阿姨家门口',lock_referral_1:'赵姐家门口'};
const FACE={wang_ayi:'👵',zhao_jie:'👩‍💼'};
let gid=11;
function G2build(g){G2.data=g;G2.ord={};
 g.orders.forEach(o=>{const no=(NAR.orders&&NAR.orders[o.id])||{};const hk=(NAR.g2_hooks||{})[o.id]||{};
  const client=o.customer||no.client||null;const who=client?cname(client):'客户';
  const fee=(ECO&&ECO.laborFees&&ECO.laborFees[o.id])||{};const src=o.source||'message';
  const mult=src==='referral'?(((ECO&&ECO.orderSources&&ECO.orderSources.referral)||{}).payMultiplier||1):1;
  const base=Math.round((fee.basePay!=null?fee.basePay:o.basePay||30)*mult);
  const d={id:gid++,key:o.id,g2:true,client,who,place:PLACE[o.id]||'县城',face:FACE[client]||'🙂',boardHint:o.boardHint||(o.id==='lock_wang'?'门锁拧不动':''),src,payX:mult,
   base,patMax:PAT().max,label:o.target==='door_lock'?'门锁':'马桶',raw:o};
  if(o.target==='door_lock'){d.lock=true;d.fault=o.fault;d.line=(hk.lines&&hk.lines.arrive&&hk.lines.arrive.text)||'';}
  else{Object.assign(d,{line:nline(o.id,'arrive')||o.boardHint,water:o.waterLevel,clog:o.fault,hp:o.clogHp!=null?o.clogHp:(o.fault==='hard'?1:3),hurry:false,
   obj:o.object&&o.fault==='hard'?o.object:null,objName:{toothbrush:'牙刷',rubber_duck:'小黄鸭'}[o.object]||null,tools:['plunger','scoop','snake']});}
  G2.ord[o.id]=d;});}
function G2reset(){Object.assign(G2,{day:1,board:[],done:[],pick:0,lockWangDone:false,referralUnlocked:false,screwdriver:false,offer:null});S.day=1;}
function beats(k){((NAR.workday_beats||{})[k]||[]).forEach(m=>deliver({channel:m.channel,sender:m.sender,raw:m.text}));}
function G2dayEnd(){beats('evening');}
function G2nextDay(){Ads.interstitial('day_end');G2.day++;S.day=G2.day;S.masterFree=0;S.doubleToday=0;S.giftToday=0;G2.dayStartMoney=S.money;G2.dayStartSpent=S.spent||0;G2.done=[];O=null;
 const dd=(G2.data.days||[]).find(x=>x.day===G2.day);
 if(!dd){S.screen='end';return;}
 let ids=(dd.board||[]).filter(id=>G2.ord[id]);
 if(G2.day===3){ // o8/o9 策划待定：先拿第二天没接的单补位
  if(!G2.referralUnlocked)ids=ids.filter(id=>id!=='lock_referral_1');
  ['o7','o6','o5'].forEach(id=>{if(ids.length<3&&!G2.prevDone.includes(id)&&!ids.includes(id))ids.push(id);});
  ['o6','o7'].forEach(id=>{if(ids.length<3&&!ids.includes(id))ids.push(id);});
  if(G2.referralUnlocked){const hk=NAR.g2_hooks.lock_referral_1;deliver({channel:'dm_zhao_jie',sender:'zhao_jie',raw:hk.preview});}}
 G2.board=ids;G2.pick=Math.min(dd.pickCount||ids.length,ids.length);beats('morning');S.screen='board';S.boardT=0;}
function acceptCard(id){const d=G2.ord[id];SFX.click();
 if(d.src==='referral'){const a=NAR.g2_hooks.lock_referral_1.on_accept;if(a){deliver({channel:a.channel,sender:a.sender,raw:a.text});G2.screwdriver=true;}}
 if(d.lock){startLock(d);return;}
 startOrderD(d);O.callAccepted=true;O.msgIn=true;}
function G2afterResult(d){if(!G2.done.includes(d.key))G2.done.push(d.key);
 if(d.key==='o5'&&!G2.lockWangDone&&!G2.offerSeen){G2.offerSeen=true;G2.offer={i:0,t:0};S.screen='offer';return;}
 if(d.key==='lock_wang'){G2.lockWangDone=true;G2.referralUnlocked=true;}
 if(d.key==='lock_referral_1'){const m=NAR.g2_hooks.social_after_referral;if(m)deliver({channel:m.channel,sender:m.sender,raw:m.text});}
 const boardDone=G2.done.filter(k=>G2.board.includes(k)).length;
 if(boardDone>=G2.pick){G2.prevDone=[...G2.done];O=null;S.screen='end';G2dayEnd();recordRun();return;}
 O=null;S.screen='board';}
function G2update(dt){if(S.screen==='board')S.boardT=(S.boardT||0)+dt;if(S.screen==='offer')G2.offer.t+=dt;if(S.screen==='reveal')S.revealT=(S.revealT||0)+dt;}

// ---------- 开门亮相（第一人称首帧，美术图预留） ----------
function goReveal(){S.screen='reveal';S.revealT=0;}
function drawReveal(){const d=O.d,client=d.client||((NAR.orders[d.key]||{}).client);const im=revealImg(d.key);
 if(im){g.drawImage(im,0,0,W,H);}else{
  g.fillStyle='#3a2a20';g.fillRect(0,0,W,H);g.fillStyle='#5a4030';g.fillRect(40,60,W-80,H-160);g.fillStyle='#f3e2c4';g.fillRect(60,80,W-120,H-200);
  const k=Math.min(1,S.revealT*3);g.save();g.translate(W/2,330);g.scale(.8+.2*k,.8+.2*k);if(client)avatar(client,0,0,90);g.restore();
  txt('（首帧占位：第一人称开门，美术图放 assets/reveal/'+d.key+'.png）',W/2,H-70,10,'#a08878','center','500');}
 txt(d.who,W/2,450,20,INK,'center','800');
 if(d.line){const L=bubbleText('“'+d.line+'”',W-120);const h=L.length*20+20;rr(50,480,W-100,h,16);fs('#fffdf6',2.5);L.forEach((l,i)=>txt(l,W/2,500+i*20,15,INK,'center','600'));}
 if(S.revealT>.4)txt('点一下进门',W/2,620,14,'#7a5a48','center','600');
 buttons.push({x:0,y:0,w:W,h:H,fn:()=>{if(S.revealT<.3)return;SFX.click();S.screen=O.lock?'lock':'play';}});}

// ---------- 王阿姨的顺手单（可拒绝） ----------
function drawOffer(){const f=G2.offer,dl=NAR.g2_hooks.lock_wang.dialogue,cur=Math.min(f.i,dl.length-1);panel(180,400);
 avatar('wang_ayi',W/2,230,30);let y=285;
 for(let i=0;i<=cur;i++){const l=dl[i],who=l.speaker==='hero'?'你':cname(l.speaker);const L=bubbleText(who+'：'+l.text,W-110);L.forEach(t=>{txt(t,50,y,14,i===cur?INK:'#a08878',l.speaker==='hero'?'left':'left','600');y+=20;});y+=6;}
 if(f.i<dl.length-1){buttons.push({x:0,y:0,w:W,h:H,fn:()=>{SFX.click();f.i++;}});txt('点一下继续',W/2,555,12,'#a08878','center','500');return;}
 const fee=ECO.laborFees.lock_wang;txt(`人工费 ¥${fee.basePay}`,W/2,520,13,'#2f8a4a');
 button('试试看',W/2-130,540,120,46,()=>{startLock(G2.ord.lock_wang);},'#ffb53d');
 button('下次吧',W/2+10,540,120,46,()=>{G2.offer=null;G2afterResult({key:'lock_wang_declined'});},'#fff8eb');}

// ---------- 门锁玩法 ----------
const LOCK={x:195,y:400},SCREWS=[{x:195,y:340},{x:195,y:470}],HANDLE={x:265,y:405};
const LTOOLS={lube_spray:{name:'润滑喷剂'},turn_key:{name:'钥匙'},screwdriver:{name:'螺丝刀'}};
function startLock(d){G2.offer=null;
 O={d,lock:true,phase:'observe',pat:d.patMax,penalties:[],face:'😐',hint:null,hintT:0,startT:null,elapsed:0,anim:null,sel:null,
  lubed:false,holdT:0,spraying:false,ang:0,lastA:null,screws:[0,0],cur:-1,wob:0,open:0,wrong:0};
 O.tools=d.fault==='stiff_cylinder'?['lube_spray','turn_key']:['screwdriver','lube_spray'];
 held=null;lockGeom(d);goReveal();}
function zhaoDoor(){return O&&O.d.key==='lock_referral_1'&&typeof scr==='function'&&scr('doorway_zhao');}
function lockGeom(d){const z=d.key==='lock_referral_1'; // 美术：赵姐家门口图上锁放把手侧 (130,388)
 Object.assign(LOCK,z?{x:130,y:388}:{x:195,y:400});SCREWS[0].x=SCREWS[1].x=LOCK.x;SCREWS[0].y=LOCK.y-60;SCREWS[1].y=LOCK.y+70;Object.assign(HANDLE,{x:LOCK.x+70,y:LOCK.y+5});}
function lockSay(t,d=2.4){O.hint=t;O.hintT=d;}
function lockPenalty(n,why){O.wrong++;patLose();O.face='😟';O.penalties.push(why);}
function lockLine(k){const hk=NAR.g2_hooks[O.d.key]||{};const l=hk.lines&&hk.lines[k];return l?l.text:'';}
function lockDown(p){if(!O||O.phase==='done')return;O.startT=O.startT??S.t;
 if(p.y>TRAY_Y){const i=(ART.ok?TB.slots:SLOTS).findIndex(x=>Math.abs(p.x-x)<(ART.ok?35:50));const id=O.tools[i];if(!id||O.phase==='observe')return;O.sel=O.sel===id?null:id;SFX.pick();buzz(8);return;}
 if(O.phase==='observe'){
  if(O.d.fault==='stiff_cylinder'&&dist(p.x,p.y,LOCK.x,LOCK.y)<60){SFX.wrong();noise(.4,.2,500);O.wob=.4;O.phase='work';lockSay(O.d.raw.observe.clue,3.2);}
  else if(O.d.fault==='loose_handle'&&dist(p.x,p.y,HANDLE.x,HANDLE.y)<70){SFX.thud();O.wob=1.2;O.phase='work';lockSay(O.d.raw.observe.clue,3.2);}
  return;}
 if(O.phase==='verify'){if(dist(p.x,p.y,HANDLE.x,HANDLE.y)<70||dist(p.x,p.y,LOCK.x,LOCK.y)<60)lockFinish();return;}
 const s=O.sel;
 if(s==='lube_spray'&&dist(p.x,p.y,LOCK.x,LOCK.y)<80){O.spraying=true;O.holdT=0;return;}
 if(s==='turn_key'&&dist(p.x,p.y,LOCK.x,LOCK.y)<110){O.lastA=Math.atan2(p.y-LOCK.y,p.x-LOCK.x);O.cur=-2;return;}
 if(s==='screwdriver'){const i=SCREWS.findIndex((c,k)=>O.screws[k]<1&&dist(p.x,p.y,c.x,c.y)<90);if(i>=0){O.cur=i;O.lastA=Math.atan2(p.y-SCREWS[i].y,p.x-SCREWS[i].x);}}
 if(!s)lockSay('先从下面选个工具',1.6);}
function lockMove(p){if(!O||O.lastA==null)return;const c=O.cur===-2?LOCK:SCREWS[O.cur];if(!c)return;
 const a=Math.atan2(p.y-c.y,p.x-c.x);let da=a-O.lastA;if(da>Math.PI)da-=Math.PI*2;if(da<-Math.PI)da+=Math.PI*2;O.lastA=a;if(da<=0)return;
 if(O.cur===-2){ // 钥匙 180°
  if(!O.lubed){O.ang+=da;if(O.ang>.45){O.ang=0;O.lastA=null;SFX.wrong();buzz([20,30,20]);doShake(4);lockSay(O.d.raw&&G2.data.tools.turn_key.wrongFeedback||'拧不动',2);lockPenalty(1,'硬拧');}return;}
  O.ang=Math.min(Math.PI,O.ang+da);if(Math.floor(O.ang*4)!==Math.floor((O.ang-da)*4))SFX.click();
  if(O.ang>=Math.PI){O.lastA=null;SFX.success();O.open=1;O.phase='verify';lockSay('咔哒——顺了。再按一下把手开门验收',3);}
  return;}
 const k=O.cur,rot=(G2.data.orders.find(o=>o.id===O.d.key).rotationsPerScrew||2)*Math.PI*2;
 const before=O.screws[k];O.screws[k]=Math.min(1,O.screws[k]+da/rot);if(Math.floor(before*8)!==Math.floor(O.screws[k]*8)){SFX.click();buzz(6);}
 if(O.screws[k]>=1){O.lastA=null;O.cur=-1;SFX.pop();float('拧紧了',SCREWS[k].x,SCREWS[k].y-30,'#7dffb0',18);
  if(O.screws.every(v=>v>=1)){O.phase='verify';O.wob=0;lockSay('把手正了。压一下把手试试',3);}}}
function lockUp(){if(!O)return;O.lastA=null;
 if(O.spraying){O.spraying=false;const t=O.holdT,tc=G2.data.tools.lube_spray;
  if(t*1000<tc.holdMs){lockSay('再多喷一会儿',1.4);return;}
  if(O.d.fault==='loose_handle'){O.wob=1;SFX.wrong();lockSay('“'+(lockLine('wrong_tool_lube_spray')||'这不是没用吗？')+'”',2.6);lockPenalty(2,'喷错');return;}
  O.lubed=true;if(t*1000>tc.overHoldMs){lockSay(tc.overHoldFeedback,2.2);lockPenalty(2,'喷多');}else lockSay('油进去了，换钥匙拧拧看',2.2);}}
function lockUpdate(dt){if(O.hintT>0)O.hintT-=dt;if(O.wob>0)O.wob=Math.max(0,O.wob-dt*(O.phase==='work'&&O.d.fault==='loose_handle'?.2:1.5));
 if(O.spraying){O.holdT+=dt;if(Math.random()<.6)parts.push({x:LOCK.x+rnd(-6,6),y:LOCK.y+rnd(-4,4),vx:rnd(-30,30),vy:rnd(-20,30),life:.5,color:'rgba(230,200,120,.9)',r:rnd(2,4),g:200});if(O.holdT*1000>G2.data.tools.lube_spray.overHoldMs&&Math.random()<.2)parts.push({x:LOCK.x,y:LOCK.y+20,vx:0,vy:20,life:1,color:'#c9a640',r:3,g:300});}
 if(O.anim){O.anim.t+=dt;if(O.anim.t>=1.2){O.anim=null;lockResult();}}}
function lockFinish(){O.phase='done';O.elapsed=S.t-O.startT;SFX.success();buzz([30,40,60]);O.face='👍';O.open=Math.max(O.open,1);O.wob=0;
 burst(HANDLE.x,HANDLE.y,24,'#fff6a8',220,4);O.anim={t:0};}
function lockResult(){const d=O.d,hk=NAR.g2_hooks[d.key]||{};const L=hk.lines||{};
 const gift=rollGift(d,Math.max(1,O.pat));S.result={d,said:(L.done||{}).text,heroSaid:(L.done_hero||{}).text,base:d.base,stars:Math.max(1,O.pat),gift,total:d.base+(gift&&gift.cash||0),elapsed:O.elapsed,pen:O.penalties,prevBest:null,isBest:false,coinsShown:0,face:O.pat>=3?'👍':'🙂'};
 S.screen='result';S.resultT=0;S.phoneQueue=[];}
function drawLockScene(){const d=O.d;
 const zd=zhaoDoor();if(zd){g.drawImage(zd,0,0,W,H);}else{
 g.fillStyle='#e9dcc0';g.fillRect(0,0,W,TRAY_Y);g.fillStyle='#d8c8a8';g.fillRect(0,560,W,TRAY_Y-560);
 // 门
 rr(70,90,250,480,10);fs('#8a5a3c',4);rr(86,110,218,180,8);fs('#9b6a48',2.5);rr(86,320,218,230,8);fs('#9b6a48',2.5);}
 if(!zd&&d.key==='lock_referral_1'){g.fillStyle='#d23b2f';g.save();g.translate(195,190);g.rotate(Math.PI/4);g.fillRect(-28,-28,56,56);g.restore();txt('福',195,192,30,'#ffd84a','center','800');}
 // 锁体
 const wob=O.wob>0?Math.sin(S.t*30)*O.wob*.12:0;
 rr(LOCK.x-25,LOCK.y-90,50,190,10);fs('#c9ccd2',3);
 SCREWS.forEach((c,k)=>{const sv=O.screws[k],out=d.fault==='loose_handle'?(1-sv)*8:0;g.beginPath();g.arc(c.x,c.y,10+out*.3,0,7);fs('#e8ecef',2.5);
  g.save();g.translate(c.x,c.y);g.rotate(sv*12);g.strokeStyle=INK;g.lineWidth=2.5;g.beginPath();g.moveTo(-6,0);g.lineTo(6,0);g.stroke();g.restore();
  if(O.sel==='screwdriver'&&sv<1){g.beginPath();g.arc(c.x,c.y,26,0,Math.PI*1.6);g.strokeStyle=`rgba(255,207,63,${.5+.4*Math.sin(S.t*8)})`;g.lineWidth=3;g.stroke();}});
 // 锁孔
 g.beginPath();g.arc(LOCK.x,LOCK.y,16,0,7);fs('#a7adb5',3);
 g.save();g.translate(LOCK.x,LOCK.y);g.rotate(O.ang);g.fillStyle=INK;g.fillRect(-2.5,-9,5,18);
 if(O.sel==='turn_key'||O.ang>0){rr(-5,-50,10,44,3);fs('#e8c84a',2);g.beginPath();g.arc(0,-58,13,0,7);fs('#e8c84a',2.5);}
 g.restore();
 // 把手
 g.save();g.translate(LOCK.x+10,HANDLE.y);g.rotate(wob+(O.phase==='done'?.0:0)-(O.open&&O.phase==='done'?.25:0));rr(0,-9,90,18,9);fs('#d5d9de',3);g.restore();
 if(O.phase==='observe'){const tgt=d.fault==='stiff_cylinder'?LOCK:HANDLE;tapGuide(tgt.x,tgt.y);txt(d.fault==='stiff_cylinder'?'先插钥匙试试':'先晃晃把手',W/2,610,15,INK);}
 if(O.sel==='turn_key'&&O.lubed&&O.phase==='work'){g.beginPath();g.arc(LOCK.x,LOCK.y,80,-Math.PI/2,-Math.PI/2+Math.PI);g.strokeStyle='rgba(255,207,63,.7)';g.lineWidth=4;g.setLineDash([8,6]);g.stroke();g.setLineDash([]);txt('↻ 顺时针拧半圈',W/2,610,14,INK);}
 if(O.sel==='lube_spray'&&O.phase==='work'){txt('按住锁孔喷一下',W/2,610,14,INK);if(O.spraying){const k=Math.min(1,O.holdT*1000/G2.data.tools.lube_spray.holdMs);rr(145,630,100,10,5);g.fillStyle='#ddd';g.fill();rr(145,630,100*k,10,5);g.fillStyle=O.holdT*1000>G2.data.tools.lube_spray.overHoldMs?'#e0533f':'#4fc26f';g.fill();}}
 if(O.sel==='screwdriver'&&O.phase==='work')txt('↻ 在螺丝上转圈拧紧',W/2,610,14,INK);
 if(O.phase==='verify'){tapGuide(HANDLE.x,HANDLE.y);}
 // 托盘
 if(ART.ok){A('ui_toolbox_lid_lv1',{x:TB.x+(TB.w-270)/2,y:TB.y-14});A('ui_toolbox_body_lv1',{x:TB.x,y:TB.y,w:TB.w,h:TB.h});const cy=(TB.slotTop+TB.slotBot)/2;
  TB.slots.forEach((x,i)=>{const id=O.tools[i];if(!id){A('ui_toolbox_lockplate',{x,y:cy});txt('升级解锁',x,742,12,'#fff3d8','center','700');return;}
   const sel=O.sel===id;g.font='30px sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText({lube_spray:'🧴',turn_key:'🔑',screwdriver:'🪛'}[id],x,cy-(sel?8:0));txt(LTOOLS[id].name,x,742,12,'#fff3d8','center','700');
   if(sel){rr(x-34,TB.slotTop-10,68,TB.slotBot-TB.slotTop+12,12);g.strokeStyle='#FFE27A';g.lineWidth=3;g.stroke();}
   if(id==='screwdriver'){rr(x-4,TB.slotTop-8,40,16,8);fs('#4a90d9');txt('老钱的',x+16,TB.slotTop,10,'#fff','center','700');}
   if(O.phase==='observe'){rr(x-32,TB.slotTop,64,TB.slotBot-TB.slotTop,8);g.fillStyle='rgba(60,40,30,.45)';g.fill();}});}
 else{ g.fillStyle='#6b4a36';g.fillRect(0,TRAY_Y,W,H-TRAY_Y);g.fillStyle='#7d573f';g.fillRect(0,TRAY_Y,W,8);
 SLOTS.forEach((x,i)=>{const id=O.tools[i],y=TRAY_Y+44;rr(x-46,y-36,92,76,14);fs(id?'#f3e6cf':'#8a6a55',3);
  if(!id){txt('?',x,y,30,'#5d4535');return;}
  g.font='30px sans-serif';g.textAlign='center';g.fillText({lube_spray:'🧴',turn_key:'🔑',screwdriver:'🪛'}[id],x,y-6);txt(LTOOLS[id].name,x,y+26,13,INK);
  if(O.sel===id){rr(x-50,y-40,100,84,16);g.strokeStyle='#ffcf3f';g.lineWidth=5;g.stroke();}
  if(id==='screwdriver'){rr(x+6,y-44,48,18,9);fs('#4a90d9',2);txt('老钱的',x+30,y-35,10,'#fff');}
  if(O.phase==='observe'){rr(x-46,y-36,92,76,14);g.fillStyle='rgba(60,40,30,.45)';g.fill();}});}}
function G2draw(sx,sy){
 if(S.screen==='board'||(S.screen==='end'&&S.day>1)){drawBoardBg();if(S.screen==='board')drawBoard();return;}
 g.save();g.translate(sx,sy);drawLockScene();drawFX();g.restore();drawHUD();drawHintBubble();
 if(S.screen==='reveal')drawReveal();}
function drawBoardBg(){g.fillStyle='#efe2c4';g.fillRect(0,0,W,H);g.fillStyle='#a9d3c0';g.fillRect(0,H*.62,W,H*.38);
 rr(10,10,W-20,64,16);fs('rgba(255,248,235,.95)');txt('¥'+S.money,30,30,20,'#2f8a4a','left','800');txt(`第 ${G2.day} 天`,30,55,13,INK,'left','600');gearBtn(W-54,78);
 rr(336,628,40,56,7);fs('#2d2d33');rr(340,634,32,40,4);g.fillStyle='#4a6a80';g.fill();
 if(PH.unread>0){g.beginPath();g.arc(374,630,9,0,7);g.fillStyle='#e8453c';g.fill();txt(String(PH.unread),374,630,11,'#fff');}}
function drawBoard(){const left=G2.pick-G2.done.filter(k=>G2.board.includes(k)).length;
 txt('接单板',W/2,112,22,INK,'center','800');txt(`今天还能接 ${left} 单`,W/2,140,14,'#7a5a48','center','600');
 const cards=[...G2.board].sort((a,b)=>(G2.ord[b].src==='call')-(G2.ord[a].src==='call'));
 cards.forEach((id,i)=>{const d=G2.ord[id],y=165+i*140,done=G2.done.includes(id),gone=!done&&left<=0;
  const wob=d.src==='call'&&!done?Math.sin(S.t*10)*Math.max(0,Math.sin(S.t*1.5))*2:0;g.save();g.translate(wob,0);
  rr(28,y,W-56,124,16);fs(done||gone?'#e6dccb':'#fffdf6',3);
  if(d.client)avatar(d.client,70,y+42,24);else{g.beginPath();g.arc(70,y+42,24,0,7);g.fillStyle='#c8b8a0';g.fill();}
  txt(d.client?cname(d.client):'新客户',108,y+28,17,INK,'left','800');txt(d.place,108,y+52,12,'#7a5a48','left','500');
  txt((d.lock?'🔒 ':'🚽 ')+d.boardHint,48,y+86,15,INK,'left','700');
  txt(`工钱 ¥${d.base}`,W-48,y+86,13,'#2f8a4a','right','700');
  if(d.src==='referral'){const by=(NAR.g2_hooks.lock_referral_1||{}).card_badge||'介绍';rr(W-160,y-10,128,24,12);fs('#4a90d9',2);txt('🤝 '+by,W-96,y+2,12,'#fff');}
  if(d.src==='call'){rr(W-110,y-10,78,24,12);fs('#f08a3c',2);txt('📞 急',W-71,y+2,12,'#fff');}
  if(d.key==='o5'){rr(W-120,y+14,88,20,10);fs('#ffcf3f',2);txt('老客户',W-76,y+24,11,INK);}
  if(done){otxt('已完成',W/2+60,y+40,20,'#7dffb0');}else if(gone)txt('明天再说',W/2+60,y+40,14,'#a08878');
  else buttons.push({x:28,y,w:W-56,h:124,fn:()=>acceptCard(id)});
  g.restore();});}
function drawDayEnd(){const earned=S.money-(G2.dayStartMoney||0)+(S.spent||0)-(G2.dayStartSpent||0);
 panel(140,470);txt(`第 ${G2.day} 天 · 收工`,W/2,185,26,INK,'center','800');txt('今日收入 ¥'+earned,W/2,230,18,'#2f8a4a');txt('余额 ¥'+S.money,W/2,258,14,'#7a5a48');
 G2.done.forEach((k,i)=>{const d=G2.ord[k];if(d)txt('✔ '+(d.client?cname(d.client):'新客户')+' · '+d.boardHint,W/2,300+i*24,14,INK);});
 const next=(G2.data.days||[]).some(x=>x.day===G2.day+1);
 if(next)button(`第 ${G2.day+1} 天 ▶`,W/2-90,470,180,52,()=>G2nextDay(),'#4fc26f','#fff');
 else txt('G2 骨架到这里（第 3 天）',W/2,470,14,'#7a5a48');
 button('再玩一遍',W/2-70,540,140,40,()=>{S.screen='title';O=null;S.copied=0;},'#fff8eb');}
