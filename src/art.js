// 正式素材接入：按 assets/manifest_art.json 叠图层。素材没加载完或缺图时，game.js 继续画占位。
const ART={ok:false,img:{},L:{},homes:{wang_ayi:['home_wang_windowsill','home_wang_washboard']},covers:{wang_ayi:'home_wang_seatcover'}};
const TB={x:16,y:647,w:290,h:117,slots:[56,126,193,264],slotTop:651,slotBot:725}; // 工具箱，按 ui-spec v1.1 + 美术箱体实测
function artLoad(){fetch('assets/manifest_art.json').then(r=>r.json()).then(m=>{
 const list=m.layers.filter(l=>l.file);let left=list.length;
 list.forEach(l=>{const nm=l.name||l.file.split('/').pop().replace('@2x.png','');ART.L[nm]=l;const im=new Image();
  im.onload=()=>{ART.img[nm]=im;if(--left===0)artReady();};im.onerror=()=>{if(--left===0)artReady();};im.src=l.file;});}).catch(()=>{});}
function artReady(){if(!ART.img.bg_bathroom_base||!ART.img.toilet_bowl)return;ART.ok=true;
 // 玩法几何跟着正式马桶走：碗口内圈约 x127–264、y426–580
 Object.assign(BOWL,{x:195,y:500,rx:100,ry:96});Object.assign(INNER,{rx:66,ry:74});WATER_Y=505;TRAY_Y=636;SLOTS=TB.slots.slice(0,3);Object.assign(FLUSH,{x:195,y:240,r:18});Object.assign(BUCKET,{x:328,y:520,r:34});}
function A(nm,opt={}){const im=ART.img[nm],l=ART.L[nm];if(!im||!l)return;const w=im.width/2*(opt.s||1),h=im.height/2*(opt.s||1);
 const p=l.placement_1x||{x:0,y:0},x=(opt.x??p.x),y=(opt.y??p.y);let dx=x,dy=y;
 if(l.anchor==='center'){dx=x-w/2;dy=y-h/2;}else if(l.anchor==='bottom-center'){dx=x-w/2;dy=y-h;}
 if(opt.a!=null)g.globalAlpha=opt.a;g.drawImage(im,dx,dy,w,h);g.globalAlpha=1;}
function custOf(){const d=O&&O.d;if(!d)return null;return d.client||((NAR.orders||{})[d.key]||{}).client||null;}
function artBathroom(){const c=custOf();A('bg_bathroom_base');(ART.homes[c]||[]).forEach(n=>A(n));A('toilet_tank');
 A(O&&O.flushT>0?'toilet_flushbtn_pressed':'toilet_flushbtn_idle');A('toilet_lid_up');if(ART.covers[c])A(ART.covers[c]);
 const full=O&&O.water>.82;A(full?'scene_bucket_water':(O&&O.bucketWet?'scene_bucket_water':'scene_bucket_empty'));}
function artToilet(){A('toilet_bowl');A('toilet_bowl_inner');if(!O)return;const l=O.water;
 if(l<.8)A('water_waterline_mark');
 const sl=O.slosh||0;
 if(l>=.8){A('water_surface_full',{x:195.8+sl});const k=.95+.05*Math.sin(S.t*3);A('water_ripple_ring',{s:k,a:.6+.3*Math.sin(S.t*2)});
  if(Math.random()<.03)parts.push({x:195+rnd(-60,60),y:440+rnd(-6,6),vx:rnd(-20,20),vy:-30,life:.6,color:'#cdeeff',r:3,g:300});}
 else{const s=.55+.6*l;A('water_surface_normal',{s,x:195.2+sl,y:517.5-(l-.5)*16});}
 if(O.d.clog==='soft'&&O.hp>0&&O.observed)A('clog_paper',{a:.35+.6*(O.hp/O.hpMax),y:495.5+(l>=.8?-6:4)});
 if(O.d.clog==='hard'&&O.hp>0&&!O.objOut)A('clog_duck_silhouette',{a:O.observed?.55+.15*Math.sin(S.t*2):.25});}
function artToolIcon(id,x,yBottom,sel){const nm=id==='plunger'?(S.upgraded?'tool_plunger_pro':'tool_plunger_old'):'tool_'+id;const im=ART.img[nm];if(!im)return false;
 const maxH=72,maxW=64,sc=Math.min(maxH/(im.height/2),maxW/(im.width/2),1),w=im.width/2*sc,h=im.height/2*sc;g.drawImage(im,x-w/2,yBottom-h-(sel?8:0),w,h);return true;}
function artTray(ids){A('ui_toolbox_lid_lv1',{x:TB.x+(TB.w-271)/2,y:TB.y-14});A('ui_toolbox_body_lv1',{x:TB.x,y:TB.y});
 TB.slots.forEach((x,i)=>{const id=ids[i];
  if(!id){A('ui_toolbox_lockplate',{x,y:(TB.slotTop+TB.slotBot)/2});txt('升级解锁',x,746,12,'#fff3d8','center','700');return;}
  const sel=held&&held.id===id;const ok=artToolIcon(id,x,TB.slotBot-2,sel);
  if(sel){rr(x-34,TB.slotTop-10,68,TB.slotBot-TB.slotTop+12,12);g.strokeStyle='#FFE27A';g.lineWidth=3;g.stroke();}
  txt(TOOLS[id]?TOOLS[id].name:id,x,746,12,'#fff3d8','center','700');});}
artLoad();
