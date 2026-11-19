// 存档余额/购买与第4格三态。
// NODE_PATH=.../node_modules node qa/progress.test.js [url] [outDir]
const {chromium}=require('playwright-core');
const URL=process.argv[2]||'http://127.0.0.1:8791/';
const OUT=process.argv[3]||'/tmp/progress-shots/';
const fs=require('fs'); fs.mkdirSync(OUT,{recursive:true});
const base={muted:true,reduced:false,novibe:false,best:{o1:22.4},dadLineDay:2,runs:[{at:'2026-11-10T03:00:00.000Z',t:{1:22.4},money:45}]};
function fail(m){console.error('FAIL',m);process.exitCode=1;throw new Error(m);}
(async()=>{
 const launch={args:['--no-sandbox','--disable-dev-shm-usage']};
 if(process.env.CHROME)launch.executablePath=process.env.CHROME;
 const b=await chromium.launch(launch);
 async function pageWith(seed){
  const ctx=await b.newContext({viewport:{width:390,height:780},deviceScaleFactor:2});
  const p=await ctx.newPage();
  const errs=[];
  p.on('pageerror',e=>errs.push(e.message));
  await p.goto(URL,{waitUntil:'domcontentloaded'});
  await p.evaluate(s=>localStorage.setItem('toilet_g1_v1',JSON.stringify(s)),seed);
  await p.reload({waitUntil:'domcontentloaded'});
  await p.waitForFunction(()=>window.__G&&window.__OB,{timeout:10000});
  await p.waitForTimeout(500);
  return {ctx,p,errs};
 }
 const snap=p=>p.evaluate(()=>{
  const save=JSON.parse(localStorage.getItem('toilet_g1_v1'));
  const price=__G.CFG.tools.plunger_pro.price;
  const mode=__G.S.upgraded?'bought':(__G.S.money>=price?'ready':'locked');
   return {screen:__G.S.screen,money:__G.S.money,spent:__G.S.spent||0,upgraded:!!__G.S.upgraded,mode,price,
    step:__OB.OB&&__OB.OB.step,key:__G.O&&__G.O.d&&__G.O.d.key,hint:__G.O&&__G.O.hint,jig:__G.S.jig&&__G.S.jig.x,save};
 });
 const tap=async(p,x,y)=>{await p.mouse.move(x,y);await p.mouse.down();await p.waitForTimeout(40);await p.mouse.up();};
 async function until(p,pred,ms,label){const t0=Date.now();while(Date.now()-t0<ms){const s=await snap(p);if(pred(s))return s;await p.waitForTimeout(80);}fail(label+' '+JSON.stringify(await snap(p)));}
 async function labelKind(p){
  return p.evaluate(()=>{
   const c=document.getElementById('c'),d=c.getContext('2d'),k=Math.min(devicePixelRatio||1,3);
   let gold=0,white=0;
   for(let x=230;x<=310;x+=2){const q=d.getImageData(Math.round(x*k),Math.round(742*k),1,1).data;
    if(q[0]>230&&q[1]>230&&q[2]>230)white++;
    else if(q[0]>220&&q[1]>170&&q[2]<180)gold++;}
   return white>gold&&white>3?'white':gold>3?'gold':'none';
  });
 }

 // A
 {
  const {ctx,p,errs}=await pageWith(Object.assign({tutorialDone:true,money:80,spent:20,upgraded:true},base));
  let s=await snap(p);
  if(s.screen!=='title'||s.step||s.money!==80||s.upgraded!==true||s.price!==100)fail('A load '+JSON.stringify(s));
  await p.reload({waitUntil:'domcontentloaded'}); await p.waitForTimeout(700);
  s=await snap(p);
  if(s.money!==80||!s.upgraded||s.save.tutorialDone!==true||s.save.muted!==true||s.save.best.o1!==22.4||s.save.dadLineDay!==2)fail('A reload '+JSON.stringify(s));
  if(s.step||s.screen==='ob_call')fail('A replay '+JSON.stringify(s));
  await tap(p,195,588);
  for(let i=0;i<14;i++){
    s=await snap(p);
    if(s.screen==='play'&&s.key==='o1')break;
    await tap(p,195,s.screen==='brief'?512:400);
    await p.waitForTimeout(500);
  }
  s=await snap(p);
  if(!(s.screen==='play'&&s.key==='o1'))fail('A play '+JSON.stringify(s));
  if(s.money!==80||!s.upgraded||s.step)fail('A after 开工 '+JSON.stringify(s));
  await p.screenshot({path:OUT+'local-A-bought.png',clip:{x:0,y:620,width:390,height:160}});
  if(await labelKind(p)!=='none')fail('A bought label '+await labelKind(p));
  await p.evaluate(()=>{__G.S.money=45;__G.S.upgraded=false;});
  await p.waitForTimeout(200);
  await p.screenshot({path:OUT+'local-A-under.png',clip:{x:0,y:620,width:390,height:160}});
  if((await snap(p)).mode!=='locked'||await labelKind(p)!=='gold')fail('A under '+await labelKind(p));
  const before=await snap(p);
  await tap(p,262,680); await p.waitForTimeout(200);
  const after=await snap(p);
  if(after.money!==before.money)fail('A click changed money');
  if(after.hint!=='攒够 ¥100，换把好使的'||!after.jig)fail('A under click '+JSON.stringify(after));
  await p.evaluate(()=>{__G.S.money=100;});
  await p.waitForTimeout(250);
  await p.screenshot({path:OUT+'local-A-ready.png',clip:{x:0,y:620,width:390,height:160}});
  if((await snap(p)).mode!=='ready'||await labelKind(p)!=='white')fail('A ready '+await labelKind(p)+' '+JSON.stringify(await snap(p)));
  await tap(p,262,680); await p.waitForTimeout(200);
  const ready=await snap(p);
  if(ready.money!==100||ready.hint!=='钱够了，换一把？')fail('A ready click '+JSON.stringify(ready));
  await p.evaluate(()=>{__G.S.money=80;__G.S.upgraded=true;__G.S.spent=20;});
  await p.waitForTimeout(300);
  await p.reload({waitUntil:'domcontentloaded'}); await p.waitForTimeout(700);
  s=await snap(p);
  if(s.money!==80||!s.upgraded||s.save.tutorialDone!==true||s.save.muted!==true||s.screen!=='title')fail('A persist reload '+JSON.stringify(s));
  if(errs.filter(e=>!/favicon/i.test(e)).length)fail('A errors '+errs.join('|'));
  console.log('A ok',JSON.stringify({money:s.money,upgraded:s.upgraded,screen:s.screen}));
  await ctx.close();
 }

 // B real tutorial interaction, seeded balance 45
 {
  const {ctx,p,errs}=await pageWith(Object.assign({tutorialDone:false,money:45,spent:5,upgraded:false},base));
  let s=await until(p,x=>x.step==='S1'||x.step==='S2',8000,'B enter');
  if(s.money!==45)fail('B start money '+s.money);
  await p.screenshot({path:OUT+'local-B-start.png'});
  await until(p,x=>x.step==='S2',4000,'B S2');
  await p.waitForTimeout(450);
  for(let i=0;i<5&&(await snap(p)).step==='S2';i++){await tap(p,195,560);await p.waitForTimeout(350);}
  await until(p,x=>x.step==='S3',4000,'B S3');
  await p.screenshot({path:OUT+'local-B-under.png',clip:{x:0,y:620,width:390,height:160}});
  if(await labelKind(p)!=='gold')fail('B tutorial under label '+await labelKind(p));
  await tap(p,195,240);
  await until(p,x=>x.step==='S5',6000,'B S5');
  await p.mouse.move(56,690);await p.mouse.down();
  for(let i=1;i<=12;i++){await p.mouse.move(56+(195-56)*i/12,690+(480-690)*i/12);await p.waitForTimeout(22);}
  await p.mouse.up();
  await until(p,x=>x.step==='S6'||x.step==='S7',4000,'B S6');
  for(let k=0;k<16;k++){s=await snap(p);if(s.step!=='S6')break;
   await p.mouse.move(195,450);await p.mouse.down();
   for(let i=1;i<=6;i++){await p.mouse.move(195,450+22*i);await p.waitForTimeout(12);}
   await p.waitForTimeout(460);
   for(let i=1;i<=6;i++){await p.mouse.move(195,582-22*i);await p.waitForTimeout(8);}
   await p.mouse.up();await p.waitForTimeout(240);
  }
  s=await snap(p); if(s.step==='S6')fail('B stuck S6');
  await until(p,x=>x.step==='S8',5000,'B S8');
  const pre=await snap(p);
  if(pre.money!==45)fail('B pre-coin '+pre.money);
  await p.waitForTimeout(1200);
  await tap(p,252,236);
  s=await until(p,x=>x.step==='S9',7000,'B S9');
  if(s.money!==75)fail('B after coin '+s.money);
  await p.waitForTimeout(1300);
  await tap(p,195,531);
  await until(p,x=>x.step==='S10',5000,'B S10');
  await p.waitForTimeout(1400);
  await tap(p,195,572);
  await until(p,x=>x.step==='S11',5000,'B S11');
  const lines=await p.evaluate(()=>__OB.OB.call.lines.map(l=>l.text));
  if(lines.join('|')!==['喂，师傅？修马桶的师傅是吧？','厕所堵死了，八点我得出车，能马上来不？','能。地址发我。','纺织厂家属院3栋401，门开着！','快点啊师傅！'].join('|'))fail('B lines '+lines);
  for(let i=0;i<16;i++){const btn=await p.evaluate(()=>__OB.OB.call&&__OB.OB.call.btn);if(btn!=null&&btn>=.35)break;await tap(p,195,450);await p.waitForTimeout(160);}
  await tap(p,195,676);
  s=await until(p,x=>x.key==='o2'&&x.screen==='play',6000,'B o2');
  if(s.money!==75||s.step)fail('B o2 '+JSON.stringify(s));
  await p.reload({waitUntil:'domcontentloaded'}); await p.waitForTimeout(800);
  s=await snap(p);
  if(s.money!==75||s.screen!=='title'||s.step||s.save.tutorialDone!==true||s.save.muted!==true||s.save.dadLineDay!==2)fail('B reload '+JSON.stringify(s));
  if(errs.length)fail('B errors '+errs.join('|'));
  console.log('B ok',JSON.stringify({money:s.money,screen:s.screen,tutorialDone:s.save.tutorialDone}));
  await ctx.close();
 }
 await b.close();
 if(process.exitCode)process.exit(process.exitCode);
 console.log('progress.test passed');
})().catch(e=>{console.error(e);process.exit(1);});
