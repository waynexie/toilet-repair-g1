import subprocess,json,os
from icons import *
OUT='../../../../assets/ui/v14/'
M=12
BG='rgba(48,32,20,.75)';BD='2px solid rgba(255,240,215,.28)';SH='0 2px 8px rgba(30,20,10,.25)'
def box(w,h,r,bg=BG,bd=BD,sh=SH,m=M,inner=''):
    return w+2*m,h+2*m,f'<div style="position:absolute;left:{m}px;top:{m}px;width:{w}px;height:{h}px;border-radius:{r}px;background:{bg};border:{bd};box-shadow:{sh};box-sizing:border-box">{inner}</div>'
S={
 'hud_card_c':(box(80,104,16),{'radius':16}),
 'hud_capsule_c':(box(160,48,24),{'radius':24}),
 'hud_tag_c':(box(104,48,16),{'radius':16}),
 'hud_round_c_normal':(box(48,48,24),{'radius':24}),
 'hud_round_c_pressed':(box(48,48,24,bg='rgba(48,32,20,.85)',sh='0 1px 4px rgba(30,20,10,.25)'),{'radius':24}),
 'hud_round_c_disabled':(box(48,48,24,bg='rgba(48,32,20,.45)',bd='2px solid rgba(255,240,215,.14)',sh='none'),{'radius':24}),
 'hud_chip_c':(box(32,24,8,bg='rgba(20,12,6,.2)',bd='none',sh='none',m=0),{'radius':8}),
 'hud_avatar_ring_c':(box(64,64,8,bg='transparent',bd='none',sh='inset 0 0 0 2px rgba(255,255,255,.85)',m=0),{'radius':8}),
 'icon_coin_32':((32,32,f'<div style="width:32px;height:32px">{COIN}</div>'),None),
 'icon_gear_c_24':((24,24,f'<div style="width:24px;height:24px">{GEARM()}</div>'),None),
 'icon_gear_c_24_disabled':((24,24,f'<div style="width:24px;height:24px">{GEARM(op=.45)}</div>'),None),
}
meta={'scale':2,'note':'所有数值单位是 2x 像素；margin 是投影外扩，贴图时左上角 = 组件 1x 坐标 - margin/2*... 见下','slices':{}}
for n,((w,h,html),nine) in S.items():
    f=f'/tmp/sl_{n}.html'
    open(f,'w').write(f'<!DOCTYPE html><html><head><style>*{{margin:0}}html,body{{background:transparent}}svg{{display:block;width:100%;height:100%}}</style></head><body><div style="position:relative;width:{w}px;height:{h}px">{html}</div></body></html>')
    subprocess.run(['google-chrome','--headless','--no-sandbox','--hide-scrollbars','--default-background-color=00000000','--force-device-scale-factor=2',f'--window-size={w},{h}',f'--screenshot={os.path.abspath(OUT+n+"@2x.png")}','file://'+f],capture_output=True)
    m=M if nine and n not in('hud_chip_c','hud_avatar_ring_c') else 0
    e={'file':f'assets/ui/v14/{n}@2x.png','size_2x':[w*2,h*2],'margin_2x':m*2}
    if nine:
        k=(m+nine['radius'])*2
        e['nine_slice_2x']={'left':k,'top':k,'right':k,'bottom':k}
    meta['slices'][n]=e
meta['note']='数值都是 2x 像素。margin_2x 是投影外扩：组件 1x 位置为 (x,y,w,h) 时，贴图区域是 (x-margin/2, y-margin/2, w+margin, h+margin)。nine_slice_2x 是九宫格四边不拉伸的宽度。文字、耐心条由代码画，样式见 ui-spec「HUD 方案 C」。'
json.dump(meta,open(OUT+'slices.json','w'),ensure_ascii=False,indent=1)
