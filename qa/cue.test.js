// 提示状态往返，以及升级前后的松手窗口、吸附距离。窗口和距离看输入结果，不拿配置原文当通过。
// NODE_PATH=... CHROME=... node qa/cue.test.js [origin]
const {chromium}=require('playwright-core');
const ORIGIN=process.argv[2]||'http://127.0.0.1:8791';
const DRAG='把搋子拖到马桶口',PRESS='按住手柄往下压',RELEASE='金圈套上绿圈时松手';
function fail(m){console.error('FAIL',m);process.exitCode=1;throw new Error(m);}
(async()=>{
 const launch={args:['--no-sandbox','--disable-dev-shm-usage']};
 if(process.env.CHROME)launch.executablePath=process.env.CHROME;
 const b=await chromium.launch(launch);
 const ctx=await b.newContext({viewport:{width:390,height:780},deviceScaleFactor:1,isMobile:true,hasTouch:true});
 const p=await ctx.newPage();
 const errs=[];
 p.on('pageerror',e=>errs.push(e.message));
 p.on('console',m=>{if(m.type()==='error'&&!/favicon|Failed to load resource/i.test(m.text()))errs.push(m.text());});
 p.on('response',r=>{if(r.status()>=400&&!/favicon/i.test(r.url()))errs.push(r.status()+' '+r.url());});
 await p.goto(ORIGIN+'/',{waitUntil:'domcontentloaded'});
 await p.evaluate(()=>localStorage.setItem('toilet_g1_v1',JSON.stringify({muted:true,reduced:false,best:{},tutorialDone:true})));
 await p.reload({waitUntil:'domcontentloaded'});
 await p.waitForFunction(()=>window.__G&&window.plungerCue);
 await p.evaluate(()=>{window.__judged=[];const orig=fxText;window.fxText=function(q){const pl=__G.O&&__G.O.plunger;window.__judged.push({q,bt:pl?+pl.bt.toFixed(3):null,hp:__G.O.hp,up:!!__G.S.upgraded});return orig(q);};});
 const tap=async(x,y)=>{await p.mouse.move(x,y);await p.mouse.down();await p.waitForTimeout(30);await p.mouse.up();await p.waitForTimeout(60);};
 const snap=()=>p.evaluate(()=>({screen:__G.S.screen,key:__G.O&&__G.O.d&&__G.O.d.key,phase:__G.O&&__G.O.phase,hint:__G.O&&__G.O.hint,hp:__G.O&&__G.O.hp,up:!!__G.S.upgraded,held:__G.held,step:__OB.OB&&__OB.OB.step}));
 async function until(pred,ms,label){const t0=Date.now();while(Date.now()-t0<ms){const s=await snap();if(pred(s))return s;await p.waitForTimeout(60);}fail(label+' '+JSON.stringify(await snap()));}
 async function through(){
  for(let i=0;i<12;i++){const s=await snap();if(s.screen==='play'&&s.phase==='work')return s;
   if(s.screen==='trans')await tap(195,400);else if(s.screen==='brief')await tap(195,512);else if(s.screen==='reveal')await tap(195,600);else if(s.screen==='play'&&s.phase==='observe')await tap(195,240);else if(s.screen==='title')await tap(195,588);
   await p.waitForTimeout(280);}
  return until(s=>s.screen==='play'&&s.phase==='work',4000,'work');
 }
 await tap(195,588);
 await through();
 await p.evaluate(()=>{__G.O.hp=20;__G.O.hpMax=20;});
 const hints=(await (await p.request.get(ORIGIN+'/data/narrative.json')).json()).hints;
 if(hints.ring_match!==RELEASE||hints.plunger_drag!==DRAG||hints.plunger_press!==PRESS)fail('提示来源 '+JSON.stringify(hints));
 if(JSON.stringify(hints).includes('按下去')||JSON.stringify(hints).includes('圈变绿时松手'))fail('旧提示还在');
 async function drop(){const h=await p.evaluate(()=>__G.held);if(h&&h.attached){await tap(56,690);await p.waitForTimeout(40);}}
 await p.mouse.move(56,690);await p.mouse.down();
 await p.mouse.move(80,640,{steps:4});
 await p.waitForTimeout(80);
 let s=await snap();
 if(s.hint!==DRAG)fail('拖动提示 '+JSON.stringify(s));
 await p.screenshot({path:'/opt/cursor/artifacts/cue-1-drag.png'});
 const bowl=await p.evaluate(()=>__G.bowl());
 await p.mouse.move(bowl.x,bowl.y-20,{steps:6});
 await p.mouse.up();
 await p.waitForTimeout(80);
 s=await snap();
 if(!s.held||!s.held.attached||s.hint!==PRESS)fail('贴上后应换成下压 '+JSON.stringify(s));
 await p.mouse.move(195,300);await p.mouse.down();
 await p.mouse.move(195,430,{steps:3});
 const tIn=Date.now();let seenRel=false;
 while(Date.now()-tIn<1600){s=await snap();if(s.hint===RELEASE){seenRel=true;break;}await p.waitForTimeout(20);}
 if(!seenRel)fail('窗内没有松手提示 '+JSON.stringify(s));
 await p.screenshot({path:'/opt/cursor/artifacts/cue-2-release.png'});
 while(Date.now()-tIn<1800){s=await snap();if(s.hint===PRESS)break;await p.waitForTimeout(20);}
 if(s.hint!==PRESS)fail('过了绿圈仍停在松手 '+JSON.stringify(s));
 const hpA=(await snap()).hp;
 await p.mouse.move(195,280,{steps:2});await p.mouse.up();await p.waitForTimeout(150);
 const miss=await p.evaluate(()=>__judged[__judged.length-1]);
 const hpB=(await snap()).hp;
 if(!miss||miss.q==='perfect'||miss.q==='good')fail('未命中反馈 '+JSON.stringify(miss));
 if(!(hpA-hpB<0.5))fail('未命中扣血 '+hpA+' '+hpB+' '+JSON.stringify(miss));
 if((await snap()).hint===RELEASE)fail('松手后提示残留 '+(await snap()).hint);
 await p.mouse.move(195,300);await p.mouse.down();await p.mouse.move(195,430,{steps:3});
 const tHit=Date.now();
 while(Date.now()-tHit<1600){if((await snap()).hint===RELEASE)break;await p.waitForTimeout(20);}
 const n0=(await p.evaluate(()=>__judged.length));
 await p.mouse.move(195,280,{steps:2});await p.mouse.up();await p.waitForTimeout(150);
 const hit=await p.evaluate(()=>__judged[__judged.length-1]);
 if(!hit||n0===(await p.evaluate(()=>__judged.length))||(hit.q!=='perfect'&&hit.q!=='good'))fail('命中反馈 '+JSON.stringify(hit));
 if((await snap()).hint===RELEASE)fail('命中后仍写着松手');
 await drop();
 await p.mouse.move(56,690);await p.mouse.down();await p.mouse.move(70,660,{steps:3});await p.waitForTimeout(60);
 if((await snap()).hint!==DRAG)fail('拖离没有回到拖动 '+(await snap()).hint);
 await p.mouse.up();await p.waitForTimeout(40);

 async function edge(){
  let best=-1;
  for(let d=70;d<=160;d+=2){
   await drop();
   const a=await p.evaluate(()=>__G.bowl());
   await p.mouse.move(56,690);await p.mouse.down();
   await p.mouse.move(a.x+d,a.y-20,{steps:4});
   await p.mouse.up();await p.waitForTimeout(40);
   const ok=await p.evaluate(()=>!!(__G.held&&__G.held.attached));
   if(ok)best=d;else if(best>=0)break;
  }
  return best;
 }
 const oldEdge=await edge();
 await p.evaluate(()=>{__G.S.upgraded=true;__G.O.hp=20;});
 await drop();
 const proEdge=await edge();
 if(!(proEdge>oldEdge+20))fail('吸附升级没有拉开 '+oldEdge+' '+proEdge);
 async function sample(target){
  await drop();
  const a=await p.evaluate(()=>__G.bowl());
  await p.mouse.move(56,690);await p.mouse.down();await p.mouse.move(a.x,a.y-20,{steps:4});await p.mouse.up();
  await p.mouse.move(195,300);await p.mouse.down();await p.mouse.move(195,430,{steps:2});
  const t0=Date.now();
  while(Date.now()-t0<2000){const bt=await p.evaluate(()=>__G.O.plunger.bt);if(bt>=target)break;await p.waitForTimeout(10);}
  const n=await p.evaluate(()=>__judged.length);
  await p.mouse.move(195,280,{steps:2});await p.mouse.up();await p.waitForTimeout(80);
  const j=await p.evaluate(()=>__judged[__judged.length-1]);
  if(!j||(await p.evaluate(()=>__judged.length))===n)fail('没有判定 '+target);
  return j;
 }
 async function land(lo,hi){
  for(let t=Math.max(0.05,lo-0.08);t<=hi;t+=0.02){const j=await sample(t);if(j.bt>=lo&&j.bt<=hi)return j;}
  fail('没落到 '+lo+'-'+hi+' '+JSON.stringify(await p.evaluate(()=>__judged.slice(-6))));
 }
 await p.evaluate(()=>{__G.S.upgraded=false;__G.O.hp=20;});
 const lateOld=await land(0.505,0.545);
 const earlyOld=await land(0.295,0.335);
 await p.evaluate(()=>{__G.S.upgraded=true;__G.O.hp=20;});
 const latePro=await land(0.505,0.545);
 const earlyPro=await land(0.295,0.335);
 const hitOf=j=>j.q==='perfect'||j.q==='good';
 if(hitOf(lateOld)||hitOf(earlyOld))fail('普通窗口过宽 '+JSON.stringify({lateOld,earlyOld}));
 if(!hitOf(latePro)||!hitOf(earlyPro))fail('升级窗口没有盖住两侧 '+JSON.stringify({latePro,earlyPro}));
 if(errs.length)fail(errs.join('|'));
 console.log('cue ok',JSON.stringify({oldEdge,proEdge,earlyOld:earlyOld.bt,lateOld:lateOld.bt,earlyPro:earlyPro.bt,latePro:latePro.bt,miss:miss.q,hit:hit.q}));
 await ctx.close();await b.close();
})().catch(e=>{console.error(e);process.exit(1);});
