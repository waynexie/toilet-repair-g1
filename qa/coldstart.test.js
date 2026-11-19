// 首单冷启动。桌面指针。声音只数合成调用，没有人耳验收。
// NODE_PATH=... CHROME=... node qa/coldstart.test.js [origin] [out]
const {chromium}=require('playwright-core');
const ORIGIN=process.argv[2]||'http://127.0.0.1:8791';
const OUT=process.argv[3]||'/opt/cursor/artifacts';
const fs=require('fs');
function fail(m){console.error('FAIL',m);process.exitCode=1;throw new Error(m);}
(async()=>{
 const launch={args:['--no-sandbox','--disable-dev-shm-usage']};
 if(process.env.CHROME)launch.executablePath=process.env.CHROME;
 const b=await chromium.launch(launch);
 const cfg=await (await fetch(ORIGIN+'/data/narrative.json')).json();
 const need=cfg.orders.o1.bubbles.need.text, thanks=cfg.orders.o1.bubbles.thanks.text;
 const lines=cfg.calls.o2.script.lines.map(l=>l.text);
 if(need!=='师傅，冲不下去了，你看看。'||thanks!=='通了通了！这下放心了。')fail('配置文本被改写 '+need+' | '+thanks);
 if(lines.join('|')!=='师傅，厕所堵了，等着出车，能马上来不？|能。地址发我。')fail('来电配置 '+lines.join('|'));
 async function page(seed){
  const ctx=await b.newContext({viewport:{width:390,height:780},deviceScaleFactor:2,isMobile:true,hasTouch:true});
  const p=await ctx.newPage();
  const errs=[];
  p.on('pageerror',e=>errs.push(e.message));
  p.on('console',m=>{if(m.type()==='error'&&!/favicon|Failed to load resource/i.test(m.text()))errs.push(m.text());});
  await p.goto(ORIGIN+'/',{waitUntil:'domcontentloaded'});
  if(seed)await p.evaluate(s=>localStorage.setItem('toilet_g1_v1',JSON.stringify(s)),seed);
  else await p.evaluate(()=>localStorage.removeItem('toilet_g1_v1'));
  await p.reload({waitUntil:'domcontentloaded'});
  return {ctx,p,errs};
 }
 const read=p=>p.evaluate(()=>{
  const O=__G.O,S=__G.S,ob=__OB.OB,pl=O&&O.plunger;
  return {screen:S.screen,trans:S.trans&&S.trans.key,key:O&&O.d&&O.d.key,step:ob&&ob.step,phase:O&&O.phase,hp:O&&O.hp,water:O&&O.water,
   bub:ob&&ob.bub&&ob.bub.key,bubText:ob&&ob.bub&&ob.bub.text,hint:O&&O.hint,money:S.money,paid:ob&&ob.paid,
   ans:ob&&ob.ans,armed:ob&&ob.armed,down:ob&&ob.downSeq,arm:ob&&ob.armSeq,bottom:pl&&pl.bottom,comp:pl&&+pl.comp.toFixed(2),
   thanks:ob&&ob.thanks,muted:!!(JSON.parse(localStorage.getItem('toilet_g1_v1')||'{}').muted),
   lines:ob&&ob.call&&ob.call.lines&&ob.call.lines.map(l=>l.text),unread:__G.PH&&__G.PH.unread,up:!!S.upgraded};
 });
 async function until(p,pred,ms,label){const t0=Date.now();while(Date.now()-t0<ms){const s=await read(p);if(pred(s))return s;await p.waitForTimeout(40);}fail(label+' '+JSON.stringify(await read(p)));}
 const fresh=await page(null);
 const p=fresh.p;
 const frames=[];
 for(let i=0;i<12;i++){frames.push(await read(p).catch(()=>({pending:1})));await p.waitForTimeout(80);}
 if(frames.some(f=>f.trans==='trans_morning'||f.screen==='trans'))fail('新档出现餐桌转场 '+JSON.stringify(frames));
 const greet=await until(p,s=>s.bub==='need'&&s.phase==='work'&&s.screen==='play',5000,'greet');
 if(greet.bubText!==need)fail('开场句 '+greet.bubText);
 await p.screenshot({path:OUT+'/cold-1-greet.png'});
 await p.mouse.move(195,240);await p.mouse.down();await p.mouse.up();
 const early=await until(p,s=>s.bub==='react',2000,'early');
 if(early.bubText!=='冲不下去，还堵着'||early.hp!==3||early.bub==='dont_flush')fail('过早冲水 '+JSON.stringify(early));
 await p.evaluate(()=>{__G.O.water=0.92;__G.O.wTarget=0.92;});
 await p.mouse.move(195,240);await p.mouse.down();await p.mouse.up();
 const flood=await until(p,s=>s.bub==='dont_flush',2000,'flood');
 if(flood.bubText!==cfg.orders.o1.bubbles.dont_flush.text)fail('漫水句 '+flood.bubText);
 await p.evaluate(()=>{__G.O.water=0.5;__G.O.wTarget=0.5;__OB.OB.bub=null;});
 await p.mouse.move(56,690);await p.mouse.down();
 await p.mouse.move(140,620,{steps:4});
 let drag=await read(p);
 if(drag.bub==='need')fail('拖动没有让开任务气泡');
 const cue=await p.evaluate(()=>plungerCue());
 if(cue!==cfg.hints.plunger_drag)fail('拖动提示 '+cue);
 await p.mouse.up();
 await p.mouse.move(56,690);await p.mouse.down();await p.mouse.move(195,480,{steps:6});await p.mouse.up();
 await until(p,s=>s.phase==='work',1000,'still');
 const logs=[];
 await p.mouse.move(195,300);await p.mouse.down();
 await p.mouse.move(195,430,{steps:3});
 const tHold=Date.now();
 while(Date.now()-tHold<900){const s=await read(p);logs.push({t:Date.now()-tHold,hp:s.hp,bottom:s.bottom,comp:s.comp,hint:await p.evaluate(()=>plungerCue())});await p.waitForTimeout(40);}
 const heldHp=logs.filter(x=>x.bottom).map(x=>x.hp);
 if(!heldHp.length||heldHp.some(h=>h!==heldHp[0]))fail('按住期间堵塞值变了 '+JSON.stringify(logs.slice(0,8)));
 if(!logs.some(x=>x.hint===cfg.hints.ring_match))fail('按压时没有松手提示 '+JSON.stringify(logs.map(x=>x.hint)));
 const hp0=heldHp[0];
 await p.mouse.move(195,280,{steps:2});await p.mouse.up();await p.waitForTimeout(120);
 const after=await read(p);
 if(after.hp===hp0)fail('松手没有结算 '+JSON.stringify(after));
 if(after.thanks)fail('命中或落空时提前释然');
 await p.screenshot({path:OUT+'/cold-2-after-release.png'});
 async function hit(){
  await p.mouse.move(195,300);await p.mouse.down();await p.mouse.move(195,430,{steps:2});
  const t0=Date.now();
  while(Date.now()-t0<1500){const q=await p.evaluate(()=>{const pl=__G.O.plunger,w=__G.win(false);return pl&&pl.bottom&&pl.bt>=w.ws+0.03&&pl.bt<=w.ws+w.wl-0.05;});if(q)break;await p.waitForTimeout(15);}
  const before=(await read(p)).hp;
  await p.mouse.move(195,280,{steps:2});await p.mouse.up();await p.waitForTimeout(100);
  return {before,after:(await read(p)).hp};
 }
 let guard=0;while((await read(p)).phase==='work'&&guard++<6)await hit();
 const cleared=await until(p,s=>s.phase==='verify',4000,'verify');
 if(cleared.thanks)fail('未冲水就释然');
 await p.screenshot({path:OUT+'/cold-3-verify.png'});
 await p.mouse.move(195,240);await p.mouse.down();await p.mouse.up();
 const rel=await until(p,s=>s.thanks&&s.bubText===thanks,3000,'thanks');
 if(rel.paid)fail('释然时已经入账');
 await p.screenshot({path:OUT+'/cold-4-relief.png'});
 const coin=await until(p,s=>s.step==='S8',4000,'coin');
 await p.waitForTimeout(1300);
 await p.screenshot({path:OUT+'/cold-5-coin.png'});
 await p.mouse.move(252,236);await p.mouse.down();
 const flyT=Date.now();
 let credited=null;
 while(Date.now()-flyT<4000){const s=await read(p);if(s.screen==='ob_call'){credited=s;break;}await p.waitForTimeout(30);}
 if(!credited||credited.money!==30||credited.ans!=null)fail('到账 '+JSON.stringify(credited));
 await p.mouse.move(195,572);await p.mouse.up();await p.waitForTimeout(120);
 const up=await read(p);
 if(up.ans!=null||up.step==='S11')fail('同一次按压抬手接听了 '+JSON.stringify(up));
 await p.touchscreen.tap(195,572);
 const ans=await until(p,s=>s.step==='S11',3000,'answer');
 if(!ans.lines||ans.lines.join('|')!==lines.join('|'))fail('通话句 '+JSON.stringify(ans.lines));
 await p.screenshot({path:OUT+'/cold-6-call.png'});
 if(fresh.errs.length)fail(fresh.errs.join('|'));
 console.log('fresh ok',JSON.stringify({holdSamples:logs.length,hpWhileHeld:heldHp[0],money:up.money,input:'desktop-pointer+emulated-touch-answer',audio:'event-only-not-listened'}));
 await fresh.ctx.close();

 const back=await page({muted:true,reduced:false,best:{o1:12},tutorialDone:true,money:40,spent:0,upgraded:false});
 const b0=await until(back.p,s=>s.screen==='title',4000,'title');
 if(b0.step)fail('回流重放了教学 '+JSON.stringify(b0));
 await back.p.mouse.move(195,588);await back.p.mouse.down();await back.p.mouse.up();
 const b1=await until(back.p,s=>s.key==='o1'||s.screen==='brief'||s.screen==='play',4000,'restart');
 if(b1.trans==='trans_morning'||b1.money!==40)fail('回流开工 '+JSON.stringify(b1));
 await back.p.reload({waitUntil:'domcontentloaded'});await back.p.waitForTimeout(400);
 const b2=await read(back.p);
 if(b2.money!==40||b2.screen!=='title')fail('刷新后余额 '+JSON.stringify(b2));
 console.log('return ok',JSON.stringify({money:b2.money,screen:b2.screen}));
 await back.ctx.close();

 const mid=await page({muted:false,reduced:false,best:{},tutorialDone:false,money:40,spent:0,upgraded:false});
 const m1=await until(mid.p,s=>s.step==='S1'&&s.phase==='work',5000,'mid');
 if(m1.money!==40)fail('未完成引导档被清零 '+m1.money);
 console.log('incomplete ok',JSON.stringify({money:m1.money,step:m1.step}));
 await mid.ctx.close();
 await b.close();
})().catch(e=>{console.error(e);process.exit(1);});
