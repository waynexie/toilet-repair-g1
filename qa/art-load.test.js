// 素材第一次请求失败后必须重试，不能停在简笔和「姨」占位。
// NODE_PATH=.../node_modules CHROME=/usr/bin/google-chrome-stable node qa/art-load.test.js [url]
const {chromium}=require('playwright-core');
const URL=process.argv[2]||'http://127.0.0.1:8791/';
const OUT=process.argv[3]||'/tmp/art-load/';
const fs=require('fs'); fs.mkdirSync(OUT,{recursive:true});
function fail(m){console.error('FAIL',m);process.exitCode=1;throw new Error(m);}
(async()=>{
 const launch={args:['--no-sandbox','--disable-dev-shm-usage']};
 if(process.env.CHROME)launch.executablePath=process.env.CHROME;
 const b=await chromium.launch(launch);
 const ctx=await b.newContext({
  userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
  viewport:{width:390,height:780}, deviceScaleFactor:2, isMobile:true, hasTouch:true
 });
 const p=await ctx.newPage();
 const errs=[], failed=[];
 p.on('pageerror',e=>errs.push(e.message));
 const once=new Set();
 await p.route('**/*', async route=>{
  const u=route.request().url();
  if(/manifest_art\.json|avatar_wang_ayi_p1@2x\.png|bg_bathroom_base|scene_bucket_empty|toilet_bowl@2x/.test(u) && !once.has(u.split('?')[0])){
    once.add(u.split('?')[0]); failed.push(u); await route.abort('failed'); return;
  }
  await route.continue();
 });
 await p.goto(URL,{waitUntil:'domcontentloaded'});
 const t0=Date.now();
 let info;
 while(Date.now()-t0<12000){
  info=await p.evaluate(()=>{
    const im=ART.img.scene_bucket_empty, av=PIMG['assets/characters/avatar_wang_ayi_p1@2x.png'];
    return {artOk:!!ART.ok, bw:im&&im.naturalWidth, bh:im&&im.naturalHeight, aw:av&&av.naturalWidth, step:__OB.OB&&__OB.OB.step};
  }).catch(()=>null);
  if(info&&info.artOk&&info.aw>=64) break;
  await p.waitForTimeout(200);
 }
 if(!info||!info.artOk) fail('stayed on fallback '+JSON.stringify(info)+' aborted '+failed.length);
 if(info.bw!==142||info.bh!==170) fail('bucket identity '+JSON.stringify(info));
 if(info.aw!==128) fail('portrait identity '+info.aw);
 await p.waitForFunction(()=>__OB.OB&&__OB.OB.step==='S1'&&__G.O&&__G.O.phase==='work',{timeout:8000});
 await p.waitForTimeout(400);
 await p.screenshot({path:OUT+'local-mobile-after.png'});
 const px=await p.evaluate(()=>{
  const c=document.getElementById('c'), d=c.getContext('2d'), k=Math.min(devicePixelRatio||1,3);
  const at=(x,y)=>{const q=d.getImageData(Math.round(x*k),Math.round(y*k),1,1).data; return [q[0],q[1],q[2]];};
  let bucket=null;
  for(let y=470;y<=560;y+=8){const q=at(330,y); if(!bucket||q[0]-q[1]>bucket[0]-bucket[1])bucket=q;}
  return {avatar:at(56,88), bucket, bowl:at(195,500), tray:at(150,680)};
 });
 if(!(px.bucket[0]>140&&px.bucket[0]>px.bucket[1]+30)) fail('bucket pixel not red '+JSON.stringify(px));
 if(px.tray[0]<70) fail('toolbox still sketch '+JSON.stringify(px));
 const spread=Math.max(...px.avatar)-Math.min(...px.avatar);
 if(spread<12) fail('avatar still flat placeholder '+JSON.stringify(px));
 if(errs.length) fail(errs.join('|'));
 console.log('art-load ok', JSON.stringify({info,px,aborted:failed.length}));
 await b.close();
})().catch(e=>{console.error(e);process.exit(1);});
