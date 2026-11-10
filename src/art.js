// 正式素材接入：按 assets/manifest_art.json 叠图层。素材没加载完或缺图时，game.js 继续画占位。
const ART={ok:false,img:{},L:{},homes:{wang_ayi:['home_wang_windowsill','home_wang_washboard']},covers:{wang_ayi:'home_wang_seatcover'}};
const TB={x:16,y:636,w:288,h:128,slots:[56,125,192,262],slotTop:640,slotBot:721}; // ui-spec v1.1：288×128，left16 bottom16；箱体图直接缩放到这个尺寸 // 工具箱，按 ui-spec v1.1 + 美术箱体实测
function artLoad(){fetch('assets/manifest_art.json').then(r=>r.json()).then(m=>{
 const list=m.layers.filter(l=>l.file);let left=list.length;
 list.forEach(l=>{const nm=l.name||l.file.split('/').pop().replace('@2x.png','');ART.L[nm]=l;const im=new Image();
  im.onload=()=>{ART.img[nm]=im;if(--left===0)artReady();};im.onerror=()=>{if(--left===0)artReady();};im.src=l.file;});}).catch(()=>{});}
function artReady(){if(!ART.img.bg_bathroom_base||!ART.img.toilet_bowl)return;ART.ok=true;
 // 玩法几何跟着正式马桶走：碗口内圈约 x127–264、y426–580
 Object.assign(BOWL,{x:195,y:500,rx:100,ry:96});Object.assign(INNER,{rx:66,ry:74});WATER_Y=505;TRAY_Y=622;SLOTS=TB.slots.slice(0,3);Object.assign(FLUSH,{x:195,y:240,r:18});Object.assign(BUCKET,{x:328,y:520,r:34});}
function A(nm,opt={}){const im=ART.img[nm],l=ART.L[nm];if(!im||!l)return;const w=opt.w||im.width/2*(opt.s||1),h=opt.h||im.height/2*(opt.s||1);
 const p=l.placement_1x||{x:0,y:0},x=(opt.x??p.x),y=(opt.y??p.y);let dx=x,dy=y;
 if(l.anchor==='center'){dx=x-w/2;dy=y-h/2;}else if(l.anchor==='bottom-center'){dx=x-w/2;dy=y-h;}
 if(opt.a!=null)g.globalAlpha=opt.a;g.drawImage(im,dx,dy,w,h);g.globalAlpha=1;}
function custOf(){const d=O&&O.d;if(!d)return null;return d.client||((NAR.orders||{})[d.key]||{}).client||null;}
function artBathroom(){const c=custOf();A('bg_bathroom_base');(ART.homes[c]||[]).forEach(n=>A(n));A('toilet_tank');
 const fk=O&&(O.phase==='observe'||O.phase==='verify')&&!O.anim?1+.08*(.5-.5*Math.cos(S.t*2*Math.PI/1.2)):1; // ui-spec：首单冲水键每1.2秒放大到1.08
 A(O&&O.flushT>0?'toilet_flushbtn_pressed':'toilet_flushbtn_idle',{s:fk});A('toilet_lid_up');if(ART.covers[c])A(ART.covers[c]);
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
function artTray(ids){A('ui_toolbox_lid_lv1',{x:TB.x+(TB.w-270)/2,y:TB.y-14});A('ui_toolbox_body_lv1',{x:TB.x,y:TB.y,w:TB.w,h:TB.h});
 TB.slots.forEach((x,i)=>{const id=ids[i];
  if(!id){A('ui_toolbox_lockplate',{x,y:(TB.slotTop+TB.slotBot)/2});txt('升级解锁',x,742,12,'#fff3d8','center','700');return;}
  const sel=held&&held.id===id;const ok=artToolIcon(id,x,TB.slotBot-2,sel);
  if(sel){rr(x-34,TB.slotTop-10,68,TB.slotBot-TB.slotTop+12,12);g.strokeStyle='#FFE27A';g.lineWidth=3;g.stroke();}
  txt(TOOLS[id]?TOOLS[id].name:id,x,742,12,'#fff3d8','center','700');});}
artLoad();
// —— 头像 / 老钱按钮 / 手机（portraits_v1）——
const PIMG={};function pimg(src){if(!(src in PIMG)){PIMG[src]=null;const im=new Image();im.onload=()=>{PIMG[src]=im;};im.src=src;}return PIMG[src];}
const PORTRAIT_IDS=['wang_ayi','xiao_xu','li_jie','zhao_jie'];
function portrait(id,n,big){if(id==='lao_qian')return pimg('assets/characters/avatar_lao_qian'+(big?'_256.png':'@2x.png'));
 if(!PORTRAIT_IDS.includes(id))return null;n=Math.max(1,Math.min(4,n||1));return pimg(`assets/characters/avatar_${id}_p${n}`+(big?'_256.png':'@2x.png'));}
function patLevel(pat,max){max=max||4;return Math.max(1,Math.min(4,1+(max-pat)));} // 按掉的格数选表情：p(1+掉格数)，来电单开局也是 p1
function drawPortraitSq(im,x,y,s,rad){g.save();rr(x,y,s,s,rad);g.clip();g.drawImage(im,x,y,s,s);g.restore();rr(x,y,s,s,rad);g.strokeStyle='#5A4030';g.lineWidth=2;g.stroke();}
const _avatarFallback=avatar;
avatar=function(id,x,y,r){const im=portrait(id,1);if(!im)return _avatarFallback(id,x,y,r);g.save();g.beginPath();g.arc(x,y,r,0,7);g.clip();g.drawImage(im,x-r,y-r,r*2,r*2);g.restore();};
function hudAvatar(){const id=custOf();const im=id&&portrait(id,patLevel(O.pat,O.d.patMax));if(!im)return false;drawPortraitSq(im,26,56,60,8);return true;}
function resultAvatar(r){const id=r.d.client||((NAR.orders||{})[r.d.key]||{}).client;const im=id&&portrait(id,patLevel(r.stars,r.d.patMax),true);if(!im)return false;drawPortraitSq(im,W/2-40,152,80,16);return true;}
function masterBtnArt(cx,cy,ready){const im=pimg(ready&&ptr.down&&Math.hypot(ptr.x-cx,ptr.y-cy)<28?'assets/ui/btn_laoqian_pressed@2x.png':'assets/ui/btn_laoqian@2x.png')||pimg('assets/ui/btn_laoqian@2x.png');if(!im)return false;
 if(!ready)g.globalAlpha=.55;g.drawImage(im,cx-28,cy-28,56,56);g.globalAlpha=1;return true;}
function phoneArt(){const im=pimg(PH.unread>0?'assets/ui/phone_floor_notify@2x.png':'assets/ui/phone_floor_idle@2x.png');if(!im)return false;
 g.save();g.translate(W-16-32,H-32-48);g.rotate(-10*Math.PI/180);g.drawImage(im,-32,-48,64,96);g.restore();return true;}
function callBgArt(){const im=pimg('assets/characters/laoqian_call@2x.png');if(!im)return false;const s=Math.max(W/(im.width/2),H/(im.height/2)),w=im.width/2*s,h=im.height/2*s;g.drawImage(im,(W-w)/2,(H-h)/2,w,h);return true;}
['btn_laoqian','btn_laoqian_pressed','phone_floor_idle','phone_floor_notify'].forEach(n=>pimg('assets/ui/'+n+'@2x.png'));pimg('assets/characters/laoqian_call@2x.png');
