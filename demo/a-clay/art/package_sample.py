from pathlib import Path
from PIL import Image,ImageDraw,ImageFont,ImageFilter
import json,zipfile
import numpy as np
P=Path('/workspace/art-style-exploration/clay-plunger-demo');M=json.loads((P/'plunger_manifest.json').read_text());A=M['contactAnchorPx']
assert 0<A[0]<512 and 0<A[1]<768,A
imgs=[Image.open(P/f'plunger_{i:02}.png').convert('RGBA') for i in range(9)]
for i,im in enumerate(imgs):
 assert im.size==(512,768)
 assert im.getextrema()[3][0]==0 and im.getextrema()[3][1]==255
 a=np.array(im);a[a[:,:,3]==0,:3]=0;imgs[i]=Image.fromarray(a);imgs[i].save(P/f'plunger_{i:02}.png')
ar=np.zeros((128,256,4),dtype=np.uint8);y,x=np.mgrid[0:128,0:256];a=np.maximum(0,1-((x-128)/111)**2-((y-64)/33)**2)**1.6
ar[:,:,:3]=[66,39,24];ar[:,:,3]=(a*75).astype('uint8');shadow=Image.fromarray(ar);shadow.save(P/'contact_shadow.png')
M['contactShadow']={'file':'contact_shadow.png','canvasPx':[256,128],'anchorPx':[128,64],'displaySizePx':[72,36],'visibleOnlyWhenContact':True,'note':'Provisional painted contact blob, not accurate dynamic cast shadow'}
bg=Image.new('RGBA',(390,780),'#f1e7d8');src=Image.open('/workspace/art-style-exploration/wang-bathroom/A_clay.jpg').convert('RGBA').resize((390,693),Image.Resampling.LANCZOS);bg.alpha_composite(src,(0,87));bg.save(P/'fixture_background.png')
mask=Image.new('L',(390,780));d=ImageDraw.Draw(mask)
d.polygon([(127,520),(145,531),(178,540),(214,541),(247,532),(270,516),(280,540),(268,561),(232,577),(175,577),(137,561),(122,542)],fill=255)
mask=mask.filter(ImageFilter.GaussianBlur(.6));fg=bg.copy();fg.putalpha(mask);fg.save(P/'fixture_front_rim.png')
M['fixture']={'canvasPx':[390,780],'background':'fixture_background.png','frontRim':'fixture_front_rim.png','toolScale':.25,'targetContactPx':[199,504],'note':'Static concept fixture only. Includes concept tray tool; not a finished game scene or validated collision mask.'}
(P/'plunger_manifest.json').write_text(json.dumps(M,ensure_ascii=False,indent=2))
font=ImageFont.truetype('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc',18)
board=Image.new('RGB',(1152,620),'#e6d7c5');draw=ImageDraw.Draw(board)
for j,k in enumerate([0,2,4,5,7,8]):
 x0=j*192
 for yy in range(0,576,16):
  for xx in range(0,192,16):draw.rectangle((x0+xx,yy,x0+xx+15,yy+15),fill=('#e7dfd5' if (yy//16+xx//16)%2 else '#bdb4aa'))
 frame=imgs[k].resize((192,288),Image.Resampling.LANCZOS);board.paste(frame,(x0,160),frame)
 draw.text((x0+18,580),f'frame {k:02}',font=font,fill='#503d30')
board.save(P/'frame_contact_sheet.jpg',quality=94)
phone_frames=[]
for k in range(9):
 im=bg.copy();im.alpha_composite(shadow.resize((72,36),Image.Resampling.LANCZOS),(163,486))
 tool=imgs[k].resize((128,192),Image.Resampling.LANCZOS);pos=(round(199-A[0]*.25),round(504-A[1]*.25));im.alpha_composite(tool,pos);im.alpha_composite(fg);phone_frames.append(im.convert('RGB'))
phone_frames[0].save(P/'phone_fixture_idle.png');phone_frames[4].save(P/'phone_fixture_compressed.png')
phone_frames[0].save(P/'press_rebound_preview.gif',save_all=True,append_images=phone_frames[1:]+[phone_frames[0]],duration=[420,40,40,40,80,40,40,45,220,250],loop=0)
(P/'README.txt').write_text('''A 黏土搋子技术样件 v0.1（未进入正式仓库）
本包为离线3D渲染的分层PNG，不要求游戏实时3D。模型与固定光照可重复出图；造型/材质为首轮样件，未定稿。
内容：9帧512×768 RGBA PNG（共用画布，不裁切）、独立接触阴影、manifest、Blender源文件及脚本、帧图与390×780静态合成、预览GIF。
以manifest的contactAnchorPx定位吸盘。自由拖动用frame00握持点；贴合后切换为接触锚点锁定，握持点随压缩上下移动，不能同时锁定握持点Y和接触点。
压缩为杯体模型变形，手柄只平移、不整体拉伸。帧1至4跟随按压输入；命中后播5至8回弹；时长是视觉建议，不改命中规则。
光照固定左上暖光；禁止任意旋转精灵来伪造其他视角。
层级：背景/后沿→接触阴影→搋子→前沿遮挡→反馈/UI。离开接触区隐藏阴影。
阴影是独立柔斑，不是实时物理投影；fixture_front_rim只是该概念机位临时遮挡，不是最终碰撞区域。
静态合成与GIF不是浏览器实测或可玩入口；未验证手机性能、输入延迟、实际手指遮挡。须开发接独立入口后实测。
''')
with zipfile.ZipFile(P/'clay_plunger_prototype_v01.zip','w',zipfile.ZIP_DEFLATED) as z:
 for p in sorted(P.iterdir()):
  if p.suffix in ['.png','.json','.blend','.py','.txt','.jpg','.gif']:z.write(p,p.name)
print('Validated fixed canvas, straight alpha, anchors',A)
print(P/'clay_plunger_prototype_v01.zip')
