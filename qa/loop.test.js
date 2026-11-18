// 最短循环：无存档真实指针，首单→来电→加急→第三单→用赚到的钱买升级→第四单。
// 隔离种子只验证旧档不被开工清掉，不作为购买通过证据。
// NODE_PATH=.../node_modules CHROME=... node qa/loop.test.js [origin] [out]
const {chromium}=require('playwright-core');
const fs=require('fs');
const ORIGIN=process.argv[2]||'http://127.0.0.1:8791';
const OUT=process.argv[3]||'/opt/cursor/artifacts';
fs.mkdirSync(OUT,{recursive:true});
function fail(m){console.error('FAIL',m);process.exitCode=1;throw new Error(m);}
(async()=>{
 const launch={args:['--no-sandbox','--disable-dev-shm-usage']};
 if(process.env.CHROME)launch.executablePath=process.env.CHROME;
 const b=await chromium.launch(launch);
 async function open(seed){
  const ctx=await b.newContext({viewport:{width:390,height:780},deviceScaleFactor:2,isMobile:true,hasTouch:true,userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X)'});
  const p=await ctx.newPage();
  const errs=[];
  p.on('pageerror',e=>errs.push(e.message));
  p.on('console',m=>{if(m.type()==='error'&&!/favicon|Failed to load resource/i.test(m.text()))errs.push(m.text());});
  p.on('response',r=>{if(r.status()>=400&&!/favicon/i.test(r.url()))errs.push(r.status()+' '+r.url());});
  await p.goto(ORIGIN+'/',{waitUntil:'domcontentloaded'});
  if(seed)await p.evaluate(s=>localStorage.setItem('toilet_g1_v1',JSON.stringify(s)),seed);
  else await p.evaluate(()=>localStorage.removeItem('toilet_g1_v1'));
  await p.reload({waitUntil:'domcontentloaded'});
  await p.waitForFunction(()=>window.__G&&window.__OB);
  return {ctx,p,errs};
 }
 const snap=p=>p.evaluate(()=>{
  const save=JSON.parse(localStorage.getItem('toilet_g1_v1')||'null');
  const O=__G.O,S=__G.S,ob=__OB.OB;
  const R=__G.CFG.tools[S.upgraded?'plunger_pro':'plunger'].rhythm;
  return {screen:S.screen,money:S.money,spent:S.spent||0,upgraded:!!S.upgraded,key:O&&O.d&&O.d.key,phase:O&&O.phase,
   hp:O&&O.hp!=null?+O.hp.toFixed(2):null,step:ob&&ob.step,paid:S.result&&S.result.paid,total:S.result&&S.result.total,
   dmg:R.damagePerPerfect,win:R.windowMs,save};
 });
 async function until(p,pred,ms,label){
  const t0=Date.now();
  while(Date.now()-t0<ms){const s=await snap(p);if(pred(s))return s;await p.waitForTimeout(80);}
  const s=await snap(p);await p.screenshot({path:OUT+'/loop-fail-'+label+'.png'});fail(label+' '+JSON.stringify(s));
 }
 const tap=async(p,x,y)=>{await p.mouse.move(x,y);await p.mouse.down();await p.waitForTimeout(30);await p.mouse.up();await p.waitForTimeout(80);};
 async function plunge(p){
  await p.mouse.move(195,300);await p.mouse.down();
  await p.mouse.move(195,430,{steps:3});
  const t0=Date.now();
  while(Date.now()-t0<1500){
   const q=await p.evaluate(()=>{const pl=__G.O&&__G.O.plunger;if(!pl)return null;const w=__G.win(__G.S.upgraded);return {bt:pl.bt,bottom:pl.bottom,ws:w.ws,end:w.ws+w.wl};});
   if(q&&q.bottom&&q.bt>=q.ws+0.03&&q.bt<=q.end-0.06)break;
   await p.waitForTimeout(20);
  }
  await p.mouse.move(195,290,{steps:2});await p.mouse.up();await p.waitForTimeout(140);
 }
 async function pump(p,n){for(let i=0;i<n;i++){if((await snap(p)).phase!=='work')break;await plunge(p);}}
 async function scoop(p){
  await p.mouse.move(125,690);await p.mouse.down();
  await p.mouse.move(195,515,{steps:8});await p.mouse.move(328,500,{steps:6});
  await p.mouse.up();await p.waitForTimeout(160);
 }
 async function toWork(p,key){
  for(let i=0;i<10;i++){const s=await snap(p);if(s.screen==='play'&&s.phase==='work'&&s.key===key)return s;
   if(s.screen==='trans')await tap(p,195,400);
   else if(s.screen==='brief')await tap(p,195,512);
   else if(s.screen==='reveal')await tap(p,195,600);
   else if(s.screen==='play'&&s.phase==='observe')await tap(p,195,240);
   await p.waitForTimeout(350);
  }
  return until(p,x=>x.screen==='play'&&x.phase==='work'&&x.key===key,4000,'work-'+key);
 }

 const natural=await open(null);
 const p=natural.p;
 let s=await until(p,x=>x.step==='S2',8000,'S2');
 if(s.money!==0)fail('开局不该有钱 '+s.money);
 await p.waitForTimeout(400);
 for(let i=0;i<6&&(await snap(p)).step==='S2';i++)await tap(p,195,560);
 await until(p,x=>x.step==='S3',5000,'S3');
 await tap(p,195,240);
 await until(p,x=>x.step==='S5',8000,'S5');
 await p.mouse.move(56,690);await p.mouse.down();
 for(let i=1;i<=10;i++)await p.mouse.move(56+(195-56)*i/10,690+(480-690)*i/10);
 await p.mouse.up();
 await until(p,x=>x.step==='S6'||x.step==='S7',5000,'S6');
 await pump(p,8);
 await until(p,x=>x.step==='S8',8000,'S8');
 await p.waitForTimeout(1200);await tap(p,252,236);
 s=await until(p,x=>x.step==='S9',8000,'S9');
 if(s.money!==30||s.total!==30)fail('首单应只入账 30 '+JSON.stringify(s));
 await p.screenshot({path:OUT+'/loop-1-o1-pay.png'});
 await p.waitForTimeout(1100);await tap(p,195,531);
 await until(p,x=>x.step==='S10',6000,'S10');
 await p.waitForTimeout(1500);await tap(p,195,572);
 await until(p,x=>x.step==='S11',5000,'S11');
 for(let i=0;i<20;i++){const btn=await p.evaluate(()=>__OB.OB&&__OB.OB.call&&__OB.OB.call.btn);if(btn!=null&&btn>=0.3)break;await tap(p,195,430);}
 await tap(p,195,676);
 s=await until(p,x=>x.key==='o2'&&x.screen==='play',8000,'o2');
 if(s.money!==30)fail('来电后余额被改 '+s.money);
 await tap(p,195,240);
 await until(p,x=>x.phase==='work',5000,'o2work');
 await scoop(p);await scoop(p);
 await p.mouse.move(56,690);await p.mouse.down();await p.mouse.move(195,480,{steps:6});await p.mouse.up();
 await pump(p,10);
 s=await until(p,x=>x.phase==='verify'||x.screen==='result',8000,'o2clear');
 if(s.screen!=='result'){await tap(p,195,240);await until(p,x=>x.screen==='result',6000,'o2result');}
 s=await until(p,x=>x.money===103&&x.total===73,5000,'o2pay');
 await tap(p,195,531);
 await until(p,x=>x.key==='o3',12000,'o3');
 await toWork(p,'o3');
 await p.mouse.move(56,690);await p.mouse.down();await p.mouse.move(195,480,{steps:6});await p.mouse.up();
 await plunge(p);await plunge(p);
 await p.mouse.move(192,690);await p.mouse.down();await p.mouse.move(195,500,{steps:6});await p.mouse.up();
 await p.mouse.move(255,500);await p.mouse.down();
 for(let a=0;a<=Math.PI*2*2.8;a+=0.35)await p.mouse.move(195+60*Math.cos(a),500+60*Math.sin(a));
 await p.mouse.up();
 await p.mouse.move(195,520);await p.mouse.down();await p.mouse.move(195,300,{steps:8});await p.mouse.up();
 await p.waitForTimeout(800);
 for(let i=0;i<5&&(await snap(p)).screen!=='result';i++){await tap(p,195,420);await p.waitForTimeout(250);await tap(p,195,240);await p.waitForTimeout(600);}
 await until(p,x=>x.screen==='result'&&x.key==='o3',8000,'o3result');
 s=await until(p,x=>x.money===163&&x.total===60,5000,'o3pay');
 await tap(p,195,531);
 s=await until(p,x=>x.screen==='upgrade',5000,'upgrade');
 if(s.money<100)fail('自然收入不够买升级 '+s.money);
 await p.screenshot({path:OUT+'/loop-2-upgrade.png'});
 const before=s.money;
 await tap(p,145,586);
 s=await until(p,x=>x.upgraded&&x.key==='o4',5000,'bought');
 if(s.money!==before-100||s.spent!==100)fail('升级扣款 '+before+' -> '+JSON.stringify(s));
 await toWork(p,'o4');
 await scoop(p);await scoop(p);
 await p.mouse.move(56,690);await p.mouse.down();await p.mouse.move(195,480,{steps:6});await p.mouse.up();
 const hp0=(await snap(p)).hp;await plunge(p);const hit=await snap(p);
 if(hit.dmg!==2||hit.win!==260||hp0-hit.hp!==2)fail('升级效果 '+hp0+' -> '+JSON.stringify(hit));
 await p.screenshot({path:OUT+'/loop-3-o4.png'});
 await p.reload({waitUntil:'domcontentloaded'});
 await p.waitForTimeout(700);
 s=await snap(p);
 if(s.screen!=='title'||s.money!==63||!s.upgraded||s.save.money!==63||s.save.upgraded!==true||s.save.tutorialDone!==true)fail('刷新丢档 '+JSON.stringify(s));
 await tap(p,195,588);
 s=await until(p,x=>x.key==='o1'&&(x.screen==='brief'||x.screen==='play'||x.screen==='reveal'||x.screen==='trans'),8000,'next');
 for(let i=0;i<8&&!((s=await snap(p)).screen==='play'&&s.key==='o1');i++){
  if(s.screen==='trans')await tap(p,195,400);else if(s.screen==='brief')await tap(p,195,512);else if(s.screen==='reveal')await tap(p,195,600);
  await p.waitForTimeout(400);
 }
 s=await until(p,x=>x.screen==='play'&&x.key==='o1',6000,'next-play');
 if(s.money!==63||!s.upgraded)fail('下一轮开工清掉进度 '+JSON.stringify(s));
 await p.screenshot({path:OUT+'/loop-4-kept.png'});
 if(natural.errs.length)fail('控制台 '+natural.errs.join('|'));
 console.log('natural ok',JSON.stringify({o1:30,o2:103,o3:163,afterBuy:63,o4dmg:2,reload:s.money}));
 await natural.ctx.close();

 // 隔离种子：旧档余额和已购。不是本轮购买证据。
 const seed={muted:true,reduced:false,best:{o1:22.4},tutorialDone:true,money:80,spent:20,upgraded:true,dadLineDay:2};
 const old=await open(seed);
 s=await old.p.waitForTimeout(400).then(()=>snap(old.p));
 if(s.money!==80||!s.upgraded||s.screen!=='title'||s.step)fail('种子读档 '+JSON.stringify(s));
 await tap(old.p,195,588);
 s=await until(old.p,x=>x.key==='o1',8000,'seed-start');
 if(s.money!==80||!s.upgraded||s.step)fail('种子开工被清 '+JSON.stringify(s));
 if(old.errs.length)fail('种子控制台 '+old.errs.join('|'));
 console.log('seed ok',JSON.stringify({money:s.money,upgraded:s.upgraded,screen:s.screen,labeled:'隔离旧档'}));
 await old.ctx.close();
 await b.close();
})().catch(e=>{console.error(e);process.exit(1);});
