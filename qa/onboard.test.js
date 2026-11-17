// 首次启动 → o1 引导 → 点金币 → 结算 → 来电 → 通话 → o2（NODE_PATH=/workspace/pw/node_modules node qa/onboard.test.js）
const {chromium}=require('playwright');const URL=process.argv[2]||'http://localhost:8787/';const OUT=__dirname+'/ob/';
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:390,height:780},deviceScaleFactor:2});const errs=[];
p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text());});
await p.goto(URL+'?x='+Date.now());await p.evaluate(()=>localStorage.clear());await p.reload();
const E=f=>p.evaluate(f),Wt=ms=>p.waitForTimeout(ms),st=()=>E(()=>({step:__OB.OB&&__OB.OB.step,screen:__G.S.screen,money:__G.S.money,key:__G.O&&__G.O.d.key,phase:__G.O&&__G.O.phase,hp:__G.O&&__G.O.hp}));
const shot=n=>p.screenshot({path:OUT+n+'.png'});const tap=async(x,y)=>{await p.mouse.move(x,y);await p.mouse.down();await Wt(60);await p.mouse.up();};
const log=async n=>{const s=await st();console.log(n,JSON.stringify(s));return s;};
await Wt(900);await log('S1');await shot('s1');await Wt(800);await log('S2');await shot('s2');
await tap(195,560);await Wt(500);await log('S3');await Wt(3200);await shot('s3_hand');
await tap(195,240);await Wt(2300);await log('S4');await shot('s4');await Wt(800);await log('S5');await shot('s5');
await p.mouse.move(56,690);await p.mouse.down();for(let i=1;i<=10;i++){await p.mouse.move(56+(195-56)*i/10,690+(480-690)*i/10);await Wt(30);}await p.mouse.up();await Wt(300);await log('S6');await shot('s6');
for(let k=0;k<8;k++){const s=await st();if(s.step!=='S6')break;await p.mouse.move(195,450);await p.mouse.down();for(let i=1;i<=5;i++){await p.mouse.move(195,450+24*i);await Wt(16);}
 await Wt(470);for(let i=1;i<=5;i++){await p.mouse.move(195,570-24*i);await Wt(10);}await p.mouse.up();await Wt(350);}
await log('S7');await Wt(1500);await log('S8');await shot('s8');await tap(252,236);await Wt(300);await shot('s8_tap');await Wt(1500);let s=await log('S9');await shot('s9');
await Wt(1200);await tap(195,531);await Wt(300);await log('S10');await Wt(1500);await shot('s10');await Wt(3000);await shot('s10_hand');
await tap(195,572);await Wt(800);await log('S11');await shot('s11a');await Wt(3000);await shot('s11b');
for(let i=0;i<14;i++){await tap(195,450);await Wt(250);}await Wt(800);await log('S11end');await shot('s11_end');
await tap(195,676);await Wt(1500);s=await log('O2');await shot('o2');
const sv=await E(()=>__G.save.tutorialDone);console.log('tutorialDone',sv,'money',s.money,'errors',errs);
await p.reload();await Wt(1500);console.log('reload screen',await E(()=>__G.S.screen));await b.close();})();
