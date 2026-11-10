// 开局 v1.5（ui-spec「开局 v1.5」+ data/onboarding.json S1–S11）：首次启动直进 o1、头像气泡、任务卡、冲水/拖工具引导、点金币、来电、通话、进 o2。
// 在 fx.js 之后加载，靠重新赋值/包裹覆盖；文案全部取 narrative.json / onboarding.json。
const V15='assets/ui/v15/';
['bubble_calm','bubble_urge','bubble_panic','bubble_happy','card_popup','btn_primary_normal','btn_primary_pressed','btn_answer_normal','btn_answer_pressed','icon_phone_32','icon_coin_40','call_bubble_caller','call_bubble_hero'].forEach(n=>pimg(V15+n+'@2x.png'));
pimg('assets/characters/avatar_xiao_xu_call@2x.png');pimg('assets/ui/v14/hud_tag_c@2x.png');
function v15(n){return pimg(V15+n+'@2x.png');}
let OBC=null;fetch('data/onboarding.json').then(r=>r.json()).then(j=>{OBC=j;}).catch(()=>{OBC={};});
// 运行态：null = 不在引导里
let OB=null;
function obOn(){return !!(OB&&O&&O.d&&O.d.id===1&&S.screen==='play');}
function nget(path){return path.split('.').reduce((a,k)=>a&&a[k],NAR);}
function ease(t){t=clamp(t,0,1);return 1-Math.pow(1-t,3);}
// 九宫格：四边 2x 宽度 l,t,r,b，贴图区 (X,Y,Wd,Ht) 为 1x
function nineA(im,X,Y,Wd,Ht,l,t,r,b){const sw=im.width,sh=im.height,xs=[0,l,sw-r,sw],ys=[0,t,sh-b,sh],dx=[X,X+l/2,X+Wd-r/2,X+Wd],dy=[Y,Y+t/2,Y+Ht-b/2,Y+Ht];
 for(let i=0;i<3;i++)for(let j=0;j<3;j++){const w=xs[i+1]-xs[i],h=ys[j+1]-ys[j],w2=dx[i+1]-dx[i],h2=dy[j+1]-dy[j];if(w>0&&h>0&&w2>0&&h2>0)g.drawImage(im,xs[i],ys[j],w,h,dx[i],dy[j],w2,h2);}}
// ---------- 折行（design/ui/hifi/v15/wrap.js 移植）----------
const OB_FONT=`700 16px ${FXF}`;const CLOSE='，。、！？；：）」』”…—',HANG='，。、';
function obM(s){g.font=OB_FONT;return g.measureText(s).width;}
function obTok(t){const ch=[...t],o=[];for(let i=0;i<ch.length;i++){if((ch[i]==='…'||ch[i]==='—')&&ch[i+1]===ch[i]){o.push(ch[i]+ch[i]);i++;}else o.push(ch[i]);}return o;}
function obLines(t,maxW){const tk=obTok(t),lines=[];let cur=[];
 for(const c of tk){if(obM(cur.join('')+c)<=maxW+.01){cur.push(c);continue;}const isC=CLOSE.includes(c[0]);
  if(isC&&HANG.includes(c)){lines.push({t:cur.join(''),h:c});cur=[];continue;}
  if(isC&&cur.length>1){const last=cur.pop();lines.push({t:cur.join(''),h:''});cur=[last,c];continue;}
  lines.push({t:cur.join(''),h:''});cur=[c];}
 if(cur.length)lines.push({t:cur.join(''),h:''});return lines;}
function obBest(t,maxW){const gl=obLines(t,maxW);if(gl.length!==2)return gl;const ch=[...t];let best=-1,acc='';
 for(let i=0;i<ch.length;i++){acc+=ch[i];if(obM(acc)>maxW+.01&&!(CLOSE.includes(ch[i])&&i===ch.length-1))break;if('，。！？；：、'.includes(ch[i])&&i<ch.length-1&&!CLOSE.includes(ch[i+1]))best=i;}
 if(best<4)return gl;const a=ch.slice(0,best+1).join(''),b=ch.slice(best+1).join('');const lb=obLines(b,maxW);if(lb.length!==1)return gl;return [{t:a,h:''},{t:b,h:lb[0].h||''}];}
function obWrap(t,maxW){let L=obBest(t,maxW);const lastU=L.length>1?[...L[L.length-1].t].length:99;
 if(L.length>2||lastU<=3){const L2=obBest(t,maxW+16);if(L2.length<L.length||L.length>2)L=L2;}
 return {L,w:Math.max(...L.map(l=>obM(l.t)))};}
function obText(L,x,y,color,shown=1e9){let n=0;g.font=OB_FONT;g.textAlign='left';g.textBaseline='middle';g.fillStyle=color;
 L.forEach((l,i)=>{let s=[...(l.t+l.h)];const k=Math.max(0,Math.min(s.length,shown-n));n+=s.length;g.fillText(s.slice(0,k).join(''),x,y+12+i*24);});}
// ---------- 头像气泡 ----------
function bubStyle(key,mood){return ['thanks','done','progress_hit'].includes(key)?'happy':({p1:'calm',p2:'calm',p3:'urge',p4:'panic',shock:'panic'})[mood]||'calm';}
function showBubble(key,dur){const b=(nget('orders.o1.bubbles')||{})[key];if(!b)return;OB.bub={key,text:b.text,mood:b.mood,style:bubStyle(key,b.mood),t:0,dur:(dur||((OBC&&OBC.avatarBubbles&&OBC.avatarBubbles.showMs)||2400))/1000};}
function drawBubble(){const b=OB&&OB.bub;if(!b)return;const out=b.t>b.dur?(b.t-b.dur)/.16:0;if(out>=1){OB.bub=null;return;}
 const im=v15('bubble_'+b.style);const {L,w}=obWrap(b.text,160);const bw=w+32,bh=L.length*24+24;
 let s,a;if(out>0){s=1-.1*out;a=1-out;}else{const t=b.t*1000;s=t<160?.6+.44*ease(t/160):t<240?1.04-.04*((t-160)/80):1;a=Math.min(1,t/120);}
 let sx=0;if(b.style==='panic'){const tt=(b.t*1000)%1200;if(tt<360)sx=Math.sin(tt/60*Math.PI)*2;}else if(b.style==='urge'&&b.t<.24)sx=Math.sin(b.t/.24*Math.PI*2)*-2;
 g.save();g.globalAlpha=a;g.translate(48+sx,152);g.scale(s,s);g.translate(-48,-152);
 if(im)nineA(im,16-12,160-20,bw+24,bh+32,104,72,56,56);else{rr(16,160,bw,bh,16);g.fillStyle='#FFF8EC';g.fill();g.strokeStyle=BROWN;g.lineWidth=2;g.stroke();}
 obText(L,32,172,BROWN);g.restore();}
// ---------- 操作提示（方案 C 暗底）----------
function drawHint(text,x=16,y=160){const {L,w}=obWrap(text,208);const bw=w+32,bh=L.length*24+24;
 if(!slice('hud_tag_c',x,y,bw,bh,12,56)){rr(x,y,bw,bh,16);g.fillStyle='rgba(48,32,20,.75)';g.fill();}obText(L,x+16,y+12,'#FFFFFF');}
function ringPulse(cx,cy,d,gold){const c=(S.t%1.2)/1.2;const im=uiImg(gold?'ui_guide_ring_gold':'ui_guide_ring');
 [[c,1],[(c+.5)%1,.5]].forEach(([k,a])=>{const s=1+.4*k,dd=d*s;g.save();g.globalAlpha=a*(1-k);if(im)g.drawImage(im,cx-dd/2,cy-dd/2,dd,dd);else ring3(cx,cy,dd/2,dd/2,gold?GOLD:CREAM,4);g.restore();});}
function hand(x,y,tap){const im=uiImg(tap?'ui_guide_hand_tap':'ui_guide_hand');if(im)g.drawImage(im,x,y+(tap?4:0),40*(tap?.92:1),48*(tap?.92:1));}
// ---------- 首次启动：跳过首页直进 o1 ----------
function obStart(){S.money=0;S.spent=0;S.idx=0;S.upgraded=false;S.dex=[];S.times={};phoneReset();S.masterFree=0;S.doubleToday=0;S.giftToday=0;G2reset();
 startOrder(0);O.callAccepted=true;O.msgIn=true;S.screen='play';OB={step:'S1',t:0,st:0,hits:0,bub:null};}
// 引导期间：旧的 o1 say() 教学句、观察提示不出；不掉耐心；节奏放宽
say=(function(orig){return function(t,d){if(obOn())return;return orig(t,d);};})(say);
patLose=(function(orig){return function(){if(obOn()&&OB.hits<3)return;return orig();};})(patLose);
rhythm=(function(orig){return function(up){const r=orig(up);if(!obOn()||OB.hits>=3)return r;const a=(OBC.steps||[]).find(s=>s.id==='S6_guide_rhythm');const k=(a&&a.tutorialAssist)||{rebounceScale:1.3,windowScale:1.5};
 return Object.assign({},r,{rebounceMs:r.rebounceMs*k.rebounceScale,windowMs:r.windowMs*k.windowScale});};})(rhythm);
fxText=(function(orig){return function(q){if(obOn())OB.hits++;return orig(q);};})(fxText);
drawObserveHint=(function(orig){return function(){if(obOn()){drawClogBar();return;}return orig();};})(drawObserveHint);
portrait=(function(orig){return function(id,n,big){if(OB&&OB.bub&&OB.bub.mood==='shock'&&!big){const m=((OBC&&OBC.avatarBubbles&&OBC.avatarBubbles.moodAssets)||{})[id];if(m&&m.shock){const im=pimg(m.shock);if(im)return im;}}return orig(id,n,big);};})(portrait);
clogCleared=(function(orig){return function(){orig();if(obOn()&&OB.step!=='S8'){OB.step='S7';OB.st=0;showBubble('thanks');}};})(clogCleared);
// o1 结算后的「接下一单」：引导里改走来电
startOrder=(function(orig){return function(i){if(OB&&i===1&&OB.step==='S9'){OB.step='S10';OB.st=0;S.screen='ob_call';return;}return orig(i);};})(startOrder);
function step(id){return ((OBC&&OBC.steps)||[]).find(s=>s.id===id)||{};}
// ---------- 每帧推进 ----------
update=(function(orig){return function(dt){
 if(!OB&&OBC&&ORDERS.length&&NAR&&S.screen==='title'&&!save.tutorialDone&&!S.obChecked){S.obChecked=true;if(!OBC.firstLaunch||OBC.firstLaunch.skipTitle!==false)obStart();}
 orig(dt);if(!OB)return;OB.t+=dt;OB.st+=dt;if(OB.bub)OB.bub.t+=dt;
 if(S.screen==='play'&&O&&O.d.id===1){
  if(OB.step==='S1'&&OB.st>=(step('S1_need_bubble').delayMs||400)/1000&&!OB.s1){OB.s1=1;showBubble('need');}
  if(OB.step==='S1'&&OB.st>=1.2){OB.step='S2';OB.st=0;OB.card={t:0,out:-1};if(OB.bub)OB.bub.dur=Math.min(OB.bub.dur,OB.bub.t);}
  if(OB.step==='S3'){if(O.anim&&O.anim.type==='obs')OB.flushed=1;if(OB.flushed&&!O.anim&&O.observed){OB.step='S4';OB.st=0;showBubble('dont_flush',step('S4_react').autoHideMs||2000);}}
  if(OB.step==='S4'&&OB.st>=(step('S5_guide_tool').delayMs||600)/1000){OB.step='S5';OB.st=0;}
  if(OB.step==='S5'&&held&&held.attached){OB.step='S6';OB.st=0;}
  if(OB.step==='S7'&&OB.st>=(step('S8_coins').delayMs||800)/1000){OB.step='S8';OB.st=0;OB.coin={t:0,tap:-1,fly:-1,start:S.money,pay:O.d.base,added:0};}
  if(OB.step==='S7'||OB.step==='S8'){if(O.phase==='verify')O.phase='done';}
  if(OB.step==='S8')coinUpdate(dt);
  if(O.phase==='work'&&!O.anim&&OB.step==='S3')O.idleT=0;}
 if(S.screen==='ob_call')callUpdate(dt);};})(update);
// ---------- S2 任务卡 ----------
function drawTaskCard(){const c=OB.card;c.t+=1/60;const d=O.d;let a,s;
 if(c.out>=0){c.out+=1/60;const k=Math.min(1,c.out/.2);a=1-k;s=1-.04*Math.min(1,c.out/.16);if(c.out>=.2){OB.card=null;OB.step='S3';OB.st=0;return;}}
 else{a=Math.min(1,c.t/.2);const k=Math.min(1,c.t/.24),bk=1+2.56*Math.pow(k-1,3)+1.56*Math.pow(k-1,2);s=.92+.08*bk;}
 g.save();g.globalAlpha=a;g.fillStyle='rgba(43,30,20,.6)';g.fillRect(0,0,W,H);g.translate(195,518);g.scale(s,s);g.translate(-195,-518);
 const cp=v15('card_popup');if(cp)nineA(cp,24-36,424-36,342+72,188+72,120,120,120,120);else{rr(24,424,342,188,24);g.fillStyle='#FFF8EC';g.fill();}
 const im=portrait(custOf(),1,true);if(im)drawPortraitSq(im,155,384,80,16);
 const who=cname(custOf())+'家',prob=(step('S2_task_card').title||'').split('·')[1]||'马桶堵了',pay='¥'+d.base,sep=' · ';
 const parts=[[who,700,BROWN],[sep,400,'#7A5A40'],[prob,700,BROWN],[sep,400,'#7A5A40'],[pay,700,'#A35A08']];
 let tw=0;parts.forEach(p=>{g.font=`${p[1]} 20px ${FXF}`;p.w=g.measureText(p[0]).width;tw+=p.w;});let x=195-tw/2;
 parts.forEach(p=>{g.font=`${p[1]} 20px ${FXF}`;g.textAlign='left';g.textBaseline='middle';g.fillStyle=p[2];g.fillText(p[0],x,494);x+=p.w;});
 const pr=ptr.down&&ptr.y>532&&ptr.y<588&&ptr.x>48&&ptr.x<342;const bi=v15(pr?'btn_primary_pressed':'btn_primary_normal');
 if(bi)nineA(bi,48-16,532-16,294+32,56+32,64,64,64,64);T('开始',195,560+(pr?2:0),2);g.restore();
 buttons.push({x:0,y:0,w:W,h:H,fn:()=>{if(c.out<0&&c.t>.2){audioInit();SFX.click();c.out=0;}}});}
// ---------- S8 金币 ----------
function coinUpdate(dt){const c=OB.coin;c.t+=dt;const auto=(step('S8_coins').autoCollectMs||4000)/1000;
 if(c.fly<0&&c.t>1.12+auto){c.fly=0;}
 if(c.tap>=0)c.tap+=dt;
 if(c.fly>=0){c.fly+=dt;const first=.52;if(c.fly>=first){const k=clamp((c.fly-first)/.6,0,1),e=1-Math.pow(1-k,3);const want=Math.round(c.pay*e);if(want>c.added){S.money+=want-c.added;c.added=want;if(Math.floor(c.fly*20)%2===0)SFX.coin();}}
  if(c.fly>=first+.6+.3&&c.added>=c.pay){obFinishO1();}}}
function obFinishO1(){OB.coin=null;OB.step='S9';OB.st=0;O.elapsed=S.t-(O.startT??S.t);O.phase='done';buzz([30,40,60]);SFX.success();
 finishOrder();const r=S.result;r.paid=true;r.coinsShown=r.total;r.doubled=true;
 if(r.total>r.base){S.money+=r.total-r.base;}}
function drawCoin(){const c=OB.coin;if(!c)return;const im=v15('icon_coin_40');const t=c.t*1000;let x=232,y=216,sx=1,sy=1;
 if(c.fly>=0){for(let i=0;i<5;i++){const k=clamp((c.fly-i*.06)/.52,0,1);if(k<=0||k>=1)continue;const e=k*k*k;const bx=(1-e)*(1-e)*252+2*(1-e)*e*320+e*e*238,by=(1-e)*(1-e)*236+2*(1-e)*e*150+e*e*72;
   const s=32*(1-.2*e);if(im)g.drawImage(im,bx-s/2,by-s/2,s,s);}
  if(c.tap>=0)coinLabel(c);return;}
 if(t<480){const k=t/480,e=k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2;const sxp=(1-e)*(1-e)*36+2*(1-e)*e*160+e*e*232,syp=(1-e)*(1-e)*60+2*(1-e)*e*120+e*e*216;x=sxp;y=syp;}
 else if(t<560){sx=1.1;sy=.85;}else if(t<880){const k=(t-560)/320;y=216-12*Math.sin(k*Math.PI);}else if(t<1120){const k=(t-880)/240;y=216-4*Math.sin(k*Math.PI);}
 if(t>=1120){const br=.8+.2*Math.sin(S.t*2*Math.PI/1.2);const gr=g.createRadialGradient(252,236,0,252,236,36);gr.addColorStop(0,'rgba(255,212,94,.55)');gr.addColorStop(.6,'rgba(255,212,94,.25)');gr.addColorStop(1,'rgba(255,212,94,0)');
  g.save();g.globalAlpha=br;g.fillStyle=gr;g.fillRect(216,200,72,72);g.restore();ringPulse(252,236,56,true);
  buttons.push({x:224,y:208,w:56,h:56,fn:()=>{if(c.tap<0){c.tap=0;c.fly=-1;SFX.coin();buzz(15);setTimeout(()=>{if(OB&&OB.coin===c)c.fly=0;},80);}}});}
 const ps=c.tap>=0&&c.tap<.08?.88:1;if(im){g.save();g.translate(252,y+20);g.scale(sx*ps,sy*ps);g.drawImage(im,-20,-20,40,40);g.restore();}
 if(c.tap>=0)coinLabel(c);}
function coinLabel(c){const k=clamp(c.tap/.72,0,1);if(k>=1)return;const a=c.tap<.48?1:1-(c.tap-.48)/.24;const y=200-8-12-16*ease(c.tap/.48);
 g.save();g.globalAlpha=Math.max(0,a);g.font=`700 16px ${FXF}`;g.textAlign='center';g.textBaseline='middle';g.lineWidth=4;g.strokeStyle=BROWN;g.lineJoin='round';const s='+¥'+c.pay;g.strokeText(s,252,y);g.fillStyle='#FFD45E';g.fillText(s,252,y);g.restore();
 if(c.tap<.48)[[-22,-14],[22,-10],[0,24]].forEach(([dx,dy],i)=>{const kk=clamp((c.tap-i*.08)/.3,0,1);if(kk>0&&kk<1)sparkle(252+dx,236+dy,12,Math.sin(kk*Math.PI));});}
// ---------- S10 来电 / S11 通话 ----------
function callPay(){const d=ORDERS[1];return d?d.base:0;}
function callMult(){return ((ECO&&ECO.orderSources&&ECO.orderSources.call)||{}).payMultiplier||1.5;}
function callLines(){return (nget('calls.o2.script.lines')||[]).map(l=>({who:l.speaker==='hero'?'hero':'caller',text:l.text}));}
function callUpdate(dt){const st=OB.step;
 if(st==='S10'&&OB.st>=(step('S10_ring').delayMs||600)/1000){OB.rt=(OB.rt||0)+dt;const cyc=Math.floor(OB.rt/.6);if(cyc!==OB.rc){OB.rc=cyc;SFX.ring&&cyc%2===0&&SFX.ring();buzz([60]);}}
 if(st==='S11'){const c=OB.call;c.t+=dt;c.lt+=dt;const L=c.lines[c.i];if(!L){return;}
  if(c.phase==='type'){const ms=c.lt*1000;c.shown=charsAt(L.text,ms-160);if(c.shown>=[...L.text].length){c.phase='hold';c.lt=0;}}
  else if(c.phase==='hold'){const last=c.i>=c.lines.length-1;if(last){if(c.lt>=.4&&!c.btn){c.btn=0;}}else if(c.lt>=1.6)callNext(c);}
  if(c.btn!=null&&c.btn>=0)c.btn+=dt;
  if(c.end!=null){c.end+=dt;if(c.end>=.64)obToO2();}}}
function charsAt(text,ms){const ch=[...text];let t=0;for(let i=0;i<ch.length;i++){t+=60;if(ms<t)return i;if('，。？！、…'.includes(ch[i])&&i<ch.length-1)t+=120;}return ch.length;}
function callNext(c){if(c.i<c.lines.length-1){c.i++;c.lt=0;c.phase='type';c.shown=0;}}
function callTap2(){const c=OB.call;if(!c||c.end!=null)return;const L=c.lines[c.i];if(c.phase==='type'){c.shown=[...L.text].length;c.phase='hold';c.lt=0;}else if(c.i<c.lines.length-1)callNext(c);}
function answer(){if(OB.step!=='S10'||OB.ans!=null)return;OB.ans=0;audioInit();SFX.click();buzz(15);
 setTimeout(()=>{if(!OB)return;OB.step='S11';OB.st=0;OB.call={t:0,lt:0,i:0,phase:'type',shown:0,lines:callLines(),btn:null,end:null};},200);}
function obToO2(){OB=null;save.tutorialDone=true;persist();S.idx=1;startOrderD(ORDERS[1]);O.callAccepted=true;O.msgIn=true;S.screen='play';}
function drawPhoneRing(){const t=OB.rt||0,cyc=t%.6,on=cyc<.36;const im=pimg(on?'assets/ui/phone_floor_notify@2x.png':'assets/ui/phone_floor_idle@2x.png');
 const rot=-10+(on?4*Math.sin(cyc/.06*Math.PI):0);g.save();g.translate(W-48,H-80);g.rotate(rot*Math.PI/180);if(im)g.drawImage(im,-32,-48,64,96);g.restore();
 buttons.push({x:W-16-64,y:H-32-96,w:64,h:96,fn:answer});}
function dimIn(t,c){g.fillStyle=`rgba(36,24,16,${.8*clamp(t/.24,0,1)})`;g.fillRect(0,0,W,H);}
function callHead(status,glow){const av=pimg('assets/characters/avatar_xiao_xu_call@2x.png');
 if(glow){const br=.8+.2*Math.sin(S.t*2*Math.PI/1.6);const gr=g.createRadialGradient(195,192,0,195,192,64);gr.addColorStop(0,'rgba(255,212,94,.35)');gr.addColorStop(1,'rgba(255,212,94,0)');g.save();g.globalAlpha=br;g.fillStyle=gr;g.fillRect(131,128,128,128);g.restore();
  [0,.8].forEach(o=>{const k=((S.t+o)%1.6)/1.6;g.beginPath();g.arc(195,192,48+24*k,0,7);g.strokeStyle=`rgba(255,212,94,${.6*(1-k)})`;g.lineWidth=2;g.stroke();});}
 if(av){g.save();g.beginPath();g.arc(195,192,48,0,7);g.clip();g.drawImage(av,147,144,96,96);g.restore();}
 g.beginPath();g.arc(195,192,47,0,7);g.strokeStyle='rgba(255,255,255,.85)';g.lineWidth=2;g.stroke();
 T(cname('xiao_xu'),195,270,2,'#FFFFFF');g.font=`400 14px ${FXF}`;g.textAlign='center';g.textBaseline='middle';g.fillStyle='#E9D9C0';g.fillText(status,195,302);}
function drawPill(){const ut='加急 ×'+callMult(),pl='工钱',pv='¥'+callPay();const uw=TW(ut,5)+16,lw=TW(pl,5),vw=TW(pv,3);const w=4+uw+8+lw+4+vw+12,x=195-w/2,y=328;
 slice('hud_tag_c',x,y,w,32,12,56);rr(x+4,y+4,uw,24,12);g.fillStyle='#C8372F';g.fill();T(ut,x+4+uw/2,y+16,5,'#FFFFFF');T(pl,x+4+uw+8,y+16,5,'#E9D9C0','left');T(pv,x+4+uw+8+lw+4,y+16,3,'#FFD45E','left');}
function drawRing(){const t=OB.st-(step('S10_ring').delayMs||600)/1000;if(t<0){phoneArt();return;}
 if(t>=.8){const k=t-.8;dimIn(k);g.save();g.globalAlpha=clamp(k/.24,0,1);g.translate(0,8*(1-clamp(k/.24,0,1)));
  g.save();g.globalAlpha*=.5+.5*Math.sin(S.t*2*Math.PI/1.2)*.5+.25;g.shadowColor='rgba(255,212,94,.35)';g.shadowBlur=32;g.strokeStyle='rgba(255,212,94,.35)';g.lineWidth=16;g.strokeRect(-8,-8,W+16,H+16);g.restore();
  callHead('来电中',true);drawPill();
  const c=(S.t%1.2)/1.2;g.beginPath();g.arc(195,572,36+16*c,0,7);g.strokeStyle=`rgba(93,187,99,${.6*(1-c)})`;g.lineWidth=2;g.stroke();
  const pr=OB.ans!=null||(ptr.down&&dist(ptr.x,ptr.y,195,572)<36);const bs=pr?1:1+.06*Math.sin(c*Math.PI);
  const bi=v15(pr?'btn_answer_pressed':'btn_answer_normal'),ic=v15('icon_phone_32');g.save();g.translate(195,572);g.scale(bs,bs);g.translate(-195,-572);
  if(bi)g.drawImage(bi,143,520,104,104);if(ic)g.drawImage(ic,179,556+(pr?2:0),32,32);g.restore();
  if(k>=4-.8&&OB.ans==null)hand(219,596,c<.15);
  g.restore();buttons.push({x:159,y:536,w:72,h:72,fn:answer});}
 drawPhoneRing();}
function drawWave(c){const L=c.lines[c.i],talking=c.phase==='type'&&c.end==null;const hero=L&&L.who==='hero';
 const ch=L?[...L.text]:[],cur=ch[Math.max(0,c.shown-1)]||'';const pause=talking&&'，。？！、…'.includes(cur);
 OB.wv=OB.wv||{h:Array(21).fill(4),tg:Array(21).fill(4),t:0};const wv=OB.wv;wv.t+=1/60;
 if(wv.t>.09){wv.t=0;for(let i=0;i<21;i++){const env=.35+.65*Math.sin(Math.PI*(i+.5)/21);wv.tg[i]=talking&&!pause?4+28*env*rnd(.25,1)*(hero?.6:1):4;}}
 for(let i=0;i<21;i++)wv.h[i]+=(wv.tg[i]-wv.h[i])*.35;
 g.save();g.globalAlpha=talking?1:.5;g.fillStyle=hero?'#E9D9C0':'#FFD45E';for(let i=0;i<21;i++){const h=Math.max(4,Math.round(wv.h[i]/2)*2);rr(113+i*8,348-h/2,4,h,2);g.fill();}g.restore();}
function drawCall(){const c=OB.call;dimIn(1);const sec=Math.floor(c.t);const st=c.end!=null?'通话结束':'通话中 '+String(Math.floor(sec/60)).padStart(2,'0')+':'+String(sec%60).padStart(2,'0');
 callHead(st,false);drawWave(c);
 const vis=[];for(let i=Math.max(0,c.i-2);i<=c.i;i++)vis.push(i);let y=392;
 vis.forEach(i=>{const L=c.lines[i];const {L:ls,w}=obWrap(L.text,160);const bw=w+32,bh=ls.length*24+24;const x=L.who==='hero'?W-24-bw:24;
  const cur=i===c.i;const ain=cur&&c.lt<.16&&c.phase==='type'?c.lt/.16:1;g.save();g.globalAlpha=(cur?1:.7)*ain;const s=.9+.1*ain;g.translate(x+bw/2,y+bh/2);g.scale(s,s);g.translate(-(x+bw/2),-(y+bh/2));
  const im=v15(L.who==='hero'?'call_bubble_hero':'call_bubble_caller');if(im)nineA(im,x-12,y-12,bw+24,bh+24,56,56,56,56);else{rr(x,y,bw,bh,16);g.fillStyle=L.who==='hero'?'#FFE89A':'#FFF8EC';g.fill();}
  obText(ls,x+16,y+12,BROWN,cur?c.shown:1e9);g.restore();y+=bh+8;});
 if(c.btn!=null){const k=clamp(c.btn/.24,0,1);g.save();g.globalAlpha=k;g.translate(0,8*(1-k));const pr=c.end!=null||(ptr.down&&ptr.x>95&&ptr.x<295&&ptr.y>648&&ptr.y<704);
  const bi=v15(pr?'btn_primary_pressed':'btn_primary_normal');if(bi)nineA(bi,95-16,648-16,232,88,64,64,64,64);T(step('S11_call').confirm||'马上到',195,676+(pr?2:0),2);g.restore();
  if(k>=1)buttons.push({x:95,y:648,w:200,h:56,fn:()=>{if(c.end==null){audioInit();SFX.click();buzz(10);c.end=0;}}});}
 if(c.end!=null&&c.end>.4){g.fillStyle=`rgba(36,24,16,${clamp((c.end-.4)/.24,0,1)*.2})`;g.fillRect(0,0,W,H);}
 if(c.btn==null)buttons.unshift({x:0,y:0,w:W,h:H,fn:callTap2});else buttons.unshift({x:0,y:0,w:W,h:H,fn:()=>{}});}
// ---------- 绘制挂点 ----------
draw=(function(orig){return function(){
 if(!OB&&!save.tutorialDone&&S.screen==='title'&&!S.obChecked){buttons=[];g.setTransform(SC*DPR,0,0,SC*DPR,0,0);g.fillStyle='#2B1E14';g.fillRect(0,0,W,H);return;}
 if(S.screen==='ob_call'){S.screen='play';const h=held;held=null;try{orig();}finally{S.screen='ob_call';held=h;}buttons=[];
  if(OB.step==='S10')drawRing();else if(OB.step==='S11'&&OB.call)drawCall();return;}
 orig();if(!OB||!O||S.screen!=='play'||O.d.id!==1)return;
 const st=OB.step;
 if(st==='S3'){const k=OB.st;drawHint(nget('hints.flush_first')||'');if(k>=(step('S3_guide_flush').handAfterIdleMs||3000)/1000){const a=clamp((k-3)/.2,0,1);g.save();g.globalAlpha=a;ringPulse(195,240,64);hand(211,256,(S.t%1.2)/1.2<.15);g.restore();}}
 if(st==='S5'&&!held){const c=(S.t%1.6)/1.6,e=ease(clamp(c/.75,0,1));const x=lerp(56,195,e),y=lerp(690,500,e);g.save();g.globalAlpha=c>.85?(1-c)/.15:1;
  g.setLineDash([6,6]);g.strokeStyle='rgba(255,243,218,.8)';g.lineWidth=3;g.beginPath();g.moveTo(56,690);g.lineTo(195,500);g.stroke();g.setLineDash([]);
  ringPulse(56,680,64);hand(x-4,y-4,c<.1);g.restore();}
 if(st==='S6'&&OB.hits<3)drawHint(nget('hints.ring_match')||'');
 drawBubble();
 if(st==='S8')drawCoin();
 if(st==='S2'&&OB.card)drawTaskCard();};})(draw);
// 气泡要在提示之后：S3/S6 提示显示时气泡让位
window.__OB={get OB(){return OB;},obStart};
