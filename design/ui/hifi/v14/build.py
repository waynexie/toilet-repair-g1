from icons import *
scene=open('scene.html').read()
A='../../../../assets/'
css='''*{box-sizing:border-box;margin:0}body{background:#2b211b;font-family:"Noto Sans CJK SC",sans-serif;font-variant-numeric:tabular-nums;color:#5A4030}
.L{position:absolute}.row{display:flex;gap:32px;padding:32px;width:max-content}.col{flex:none;width:780px}
.cap{color:#f3e6cf;font:700 22px/32px "Noto Sans CJK SC";margin-bottom:12px}.cap small{display:block;font-weight:400;font-size:15px;line-height:24px;color:#cdbb9f}
.rec{background:#FFD45E;color:#5A4030;font-size:14px;padding:2px 10px;border-radius:12px;margin-left:8px;vertical-align:3px}
.zoom{position:relative;width:780px;height:352px;overflow:hidden;border-radius:24px;outline:3px solid #000;margin-bottom:24px}
.ph{position:absolute;left:0;top:0;width:390px;height:780px;transform:scale(2);transform-origin:0 0}
.ann .ph{filter:saturate(.25) brightness(1.08)}
/* layout — all values 1x; padding measured from OUTER edge (2px stroke included) */
.who{position:absolute;left:16px;top:48px;width:80px;height:104px;border-radius:16px;padding:6px;border:2px solid}
.av{width:64px;height:64px;border-radius:8px;background-size:cover;box-shadow:inset 0 0 0 2px #5A4030}
.pat{margin-top:12px;width:64px;height:12px;border-radius:4px;display:flex;overflow:hidden;box-shadow:inset 0 0 0 2px #5A4030}
.pat i{flex:1;background:linear-gradient(#7FD184,#4FAE56)}.pat i+i{border-left:2px solid #5A4030}
.cc{position:absolute;right:16px;top:48px;width:160px;height:48px;border-radius:24px;border:2px solid;padding:6px 14px 6px 6px;display:flex;align-items:center;justify-content:space-between}
.coin{width:32px;height:32px}.coin svg{display:block}
.num{font-size:20px;line-height:28px;font-weight:700}
.tg{position:absolute;right:72px;top:104px;width:104px;height:48px;border-radius:16px;border:2px solid;padding:10px;display:flex;align-items:center;gap:8px}
.lb{width:32px;height:24px;border-radius:8px;font-size:12px;line-height:24px;font-weight:700;text-align:center}
.vv{width:40px;height:24px;font-size:16px;line-height:24px;font-weight:700;text-align:center}
.gr{position:absolute;right:16px;top:104px;width:48px;height:48px;border-radius:24px;border:2px solid;padding:10px}
.gr svg{width:24px;height:24px;display:block}
/* A */
.oA .who,.oA .cc,.oA .tg,.oA .gr{border-color:#5A4030;background:linear-gradient(#FFFDF7 0%,#FBF1DD 60%,#F3E2C3 100%);box-shadow:inset 0 2px 0 #fff,inset 0 -3px 0 rgba(150,110,70,.18),0 2px 0 rgba(90,64,48,.35),0 4px 10px rgba(70,45,25,.2)}
.oA .lb{background:#F1DFBF;color:#7A5A40}.oA .vv{color:#B5650A}
/* B */
.oB .who,.oB .cc,.oB .tg,.oB .gr{border-color:#3A281B;background:linear-gradient(#8A6344,#5E412C);box-shadow:inset 0 2px 0 rgba(255,235,200,.28),inset 0 -3px 0 rgba(0,0,0,.2),0 2px 0 rgba(40,25,15,.45),0 4px 10px rgba(40,25,15,.3)}
.oB .num{color:#FFE9A8;text-shadow:0 1px 0 rgba(0,0,0,.35)}.oB .lb{background:#4A3222;color:#E7CFA9}.oB .vv{color:#FFD45E;text-shadow:0 1px 0 rgba(0,0,0,.35)}
.oB .av{box-shadow:inset 0 0 0 2px #FFF3DA}
/* C */
.oC .who,.oC .cc,.oC .tg,.oC .gr{border-color:rgba(255,240,215,.28);background:rgba(48,32,20,.75);box-shadow:0 2px 8px rgba(30,20,10,.25)}
.oC .num{color:#fff}.oC .lb{background:rgba(20,12,6,.2);color:#E9D9C0}.oC .vv{color:#FFD45E}.oC .av{box-shadow:inset 0 0 0 2px rgba(255,255,255,.85)}
/* annotation */
.mk{position:absolute;z-index:50;background:#FF2D55}.mk.h{height:2px}.mk.v{width:2px}
.lab{position:absolute;z-index:51;background:#FF2D55;color:#fff;font:700 13px/18px "Noto Sans CJK SC";padding:0 4px;border-radius:4px;transform:translate(-50%,-50%);white-space:nowrap}
.box{position:absolute;z-index:49;border:1.5px dashed rgba(255,45,85,.9)}
.chk{background:#F6EAD3;border-radius:16px;padding:16px 20px;font-size:15px;line-height:26px}.chk b{color:#2E8B3A}.chk .x{color:#D9413A}
'''
def hud(k):
    gfill={'A':('#5A4030','#FBF1DD'),'B':('#FFF3DA','#6E4E36'),'C':('#FFFFFF','#4A3322')}[k]
    return f'''<div class="who"><div class="av" style="background-image:url({A}characters/avatar_wang_ayi_p1@2x.png)"></div><div class="pat"><i></i><i></i><i></i><i></i></div></div>
<div class="cc"><div class="coin">{COIN}</div><span class="num">128</span></div>
<div class="tg"><span class="lb">本单</span><span class="vv">¥30</span></div>
<div class="gr">{GEARM() if k=='C' else GEAR(*gfill)}</div>'''
opts=[('A','方案 A · 奶油瓷面','和场景同色系，浅底深字，立体感靠顶部高光和底部硬投影',True),
      ('B','方案 B · 胡桃木牌','深色木纹底配浅色字，在亮色卫生间里最跳、最好读，但比较压画面',False),
      ('C','方案 C · 半透明暗底','轻、不挡画面，质感偏通用，和手绘场景有些疏离',False)]
cols=''
for k,t,d,r in opts:
    cols+=f'''<div class="col o{k}"><p class="cap">{t}{"<span class=rec>推荐</span>" if r else ""}<small>{d}</small></p>
<div class="zoom hi"><div class="ph">{scene}{hud(k)}</div></div>
<div class="zoom ann"><div class="ph">{scene}{hud(k)}</div></div><div class="chk" id="chk{k}"></div></div>'''
js=open('ann.js').read()
open('hud_v14.html','w').write(f'<!DOCTYPE html><html><head><meta charset="utf-8"><style>{css}</style></head><body><div class="row">{cols}</div><script>{js}</script></body></html>')
