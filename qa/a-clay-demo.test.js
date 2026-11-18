// 390×780 触控视口：拖入、按压、回弹、提起。静态合成图不作为通过证据。
// NODE_PATH=.../node_modules CHROME=... node qa/a-clay-demo.test.js [origin] [out]
const {chromium}=require('playwright-core');
const fs=require('fs');
const path=require('path');
const ORIGIN=process.argv[2]||'http://127.0.0.1:8791';
const OUT=process.argv[3]||'/tmp/a-clay';
fs.mkdirSync(OUT,{recursive:true});
const shot=n=>path.join(OUT,n);
function fail(m){console.error('FAIL',m);process.exitCode=1;throw new Error(m);}
(async()=>{
  const launch={args:['--no-sandbox','--disable-dev-shm-usage']};
  if(process.env.CHROME)launch.executablePath=process.env.CHROME;
  const b=await chromium.launch(launch);
  const p=await (await b.newContext({viewport:{width:390,height:780},deviceScaleFactor:2,isMobile:true,hasTouch:true,userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1'})).newPage();
  const errs=[];
  p.on('pageerror',e=>errs.push(e.message));
  p.on('console',m=>{
    if(m.type()!=='error')return;
    const t=m.text();
    if(/favicon|Failed to load resource/i.test(t))return;
    errs.push(t);
  });
  p.on('response',r=>{if(r.status()>=400&&!/favicon/i.test(r.url()))errs.push(r.status()+' '+r.url());});
  const root=await (await p.request.get(ORIGIN+'/')).text();
  if(/demo\/a-clay|a-clay-plunger|plunger_manifest/.test(root))fail('原 index 被样例改掉');
  await p.goto(ORIGIN+'/demo/a-clay/',{waitUntil:'networkidle'});
  await p.waitForFunction(()=>window.ClayDemo&&ClayDemo.ok);
  const read=()=>p.evaluate(()=>{
    const s=ClayDemo.session, lay=s.layout(), t=ClayDemo.manifest.fixture.targetContactPx;
    return {phase:s.phase,shadow:s.shadow,frame:s.frame,locked:s.locked,hit:s.hit,
      contact:lay.contact.map(n=>+n.toFixed(2)),grip:lay.grip.map(n=>+n.toFixed(2)),target:t};
  });
  const px=()=>p.evaluate(()=>{
    const c=document.getElementById('c'),d=c.getContext('2d'),k=Math.min(devicePixelRatio||1,3);
    const at=(x,y)=>{const q=d.getImageData(Math.round(x*k),Math.round(y*k),1,1).data;return [q[0],q[1],q[2],q[3]];};
    return {tray:at(94,735),lip:at(199,560),rim:at(199,550)};
  });
  const red=c=>c[0]>130&&c[1]<80&&c[2]<60;
  const away=await read();
  const home=await p.evaluate(()=>ClayDemo.demo.homeGrip);
  if(away.shadow||away.locked||away.frame!==0)fail('起始不应贴住 '+JSON.stringify(away));
  if(Math.hypot(away.contact[0]-94,away.contact[1]-742)>1.5)fail('托盘起始接触点 '+JSON.stringify(away.contact));
  const dock=await px();
  if(!red(dock.tray))fail('托盘上没有独立搋子 '+JSON.stringify(dock.tray));
  await p.screenshot({path:shot('a-clay-0-rest.png')});
  await p.mouse.move(home[0],home[1]);
  await p.mouse.down();
  await p.mouse.move(199,455,{steps:6});
  const over=await read();
  const overPx=await px();
  if(over.locked||over.shadow)fail('拖到前沿上不应先贴住 '+JSON.stringify(over));
  if(!red(overPx.lip))fail('拖动时搋子应盖在前沿上 '+JSON.stringify(overPx.lip));
  if(red(overPx.tray))fail('拖出后托盘还有搋子 '+JSON.stringify(overPx.tray));
  await p.screenshot({path:shot('a-clay-1-drag.png')});
  await p.mouse.move(199,399,{steps:8});
  const seated=await read();
  if(!seated.locked||!seated.shadow)fail('没有贴上碗口 '+JSON.stringify(seated));
  if(Math.hypot(seated.contact[0]-199,seated.contact[1]-504)>0.6)fail('接触锚点漂移 '+JSON.stringify(seated.contact));
  await p.screenshot({path:shot('a-clay-2-contact.png')});
  const grip0=seated.grip[1];
  await p.mouse.move(199,509,{steps:6});
  const pressed=await read();
  if(pressed.frame<1||pressed.frame>4)fail('按压没有落到压缩帧 '+JSON.stringify(pressed));
  if(Math.hypot(pressed.contact[0]-199,pressed.contact[1]-504)>0.6)fail('按压后接触点被握持点拽走 '+JSON.stringify(pressed));
  if(pressed.grip[1]-grip0<10)fail('压缩时握持点应下移 '+grip0+' '+pressed.grip[1]);
  await p.screenshot({path:shot('a-clay-3-press.png')});
  const rim=await px();
  const rimErr=Math.abs(rim.rim[0]-187)+Math.abs(rim.rim[1]-149)+Math.abs(rim.rim[2]-105);
  if(rimErr>48)fail('前沿没有压住搋子 '+JSON.stringify(rim.rim));
  const btNow=await p.evaluate(()=>ClayDemo.session.bt);
  if(btNow>0.46){
    await p.mouse.move(home[0],home[1],{steps:6});
    await p.mouse.move(199,399,{steps:6});
    await p.mouse.move(199,509,{steps:4});
  }
  await p.waitForFunction(()=>{const s=ClayDemo.session;return s.bottom&&s.bt>=0.36&&s.bt<=0.46;});
  await p.mouse.move(199,429,{steps:3});
  const reb=await read();
  await p.screenshot({path:shot('a-clay-4-rebound.png')});
  if(reb.hit!=='good')fail('回弹命中 '+JSON.stringify(reb));
  if(!reb.shadow)fail('回弹期间仍应贴住');
  await p.mouse.move(300,650,{steps:8});
  const lifted=await read();
  const liftPx=await px();
  if(lifted.shadow||lifted.locked||Math.hypot(lifted.contact[0]-199,lifted.contact[1]-504)<80)fail('离开后阴影还在 '+JSON.stringify(lifted));
  if(red(liftPx.tray))fail('提起后托盘残留 '+JSON.stringify(liftPx.tray));
  await p.mouse.up();
  await p.screenshot({path:shot('a-clay-5-lift.png')});
  const alpha=await p.evaluate(()=>{
    const im=ClayDemo.session&&document.querySelector('canvas');
    const src=ClayDemo.manifest.frames[0].file;
    return new Promise(res=>{
      const image=new Image();
      image.onload=()=>{
        const c=document.createElement('canvas');c.width=8;c.height=8;const x=c.getContext('2d');
        x.drawImage(image,0,0);
        const q=x.getImageData(0,0,1,1).data;
        res({corner:[q[0],q[1],q[2],q[3]],w:image.naturalWidth,h:image.naturalHeight,file:src});
      };
      image.src='art/'+src;
    });
  });
  if(alpha.w!==512||alpha.h!==768||alpha.corner[3]!==0||alpha.corner[0]!==0)fail('透明边不是直通 alpha '+JSON.stringify(alpha));
  if(errs.length)fail(errs.join('|'));
  console.log('a-clay play ok',JSON.stringify({press:pressed.frame,gripDelta:+(pressed.grip[1]-grip0).toFixed(2),hit:reb.hit,lift:lifted.phase}));
  await b.close();
})().catch(e=>{console.error(e);process.exit(1);});
