from icons import *
scene=open('scene.html').read()
A='../../../../assets/'
base='''*{box-sizing:border-box;margin:0}body{background:#2b211b;font-family:"Noto Sans CJK SC",sans-serif;font-variant-numeric:tabular-nums;color:#5A4030}
.L{position:absolute}.row{display:flex;width:max-content;gap:32px;padding:32px 32px 24px}
.row>div{flex:none;width:780px}.cap{color:#f3e6cf;font:700 22px/32px "Noto Sans CJK SC";margin-bottom:12px}.cap small{display:block;font-weight:400;font-size:15px;line-height:24px;color:#cdbb9f}
.rec{background:#FFD45E;color:#5A4030;font-size:14px;padding:2px 10px;border-radius:12px;margin-left:8px;vertical-align:3px}
.zoom{flex:none;width:780px;height:400px;overflow:hidden;border-radius:24px;outline:3px solid #000;position:relative}
.ph{position:relative;width:390px;height:780px;transform:scale(2);transform-origin:0 0}
.who{position:absolute;left:16px;top:48px;width:80px;height:104px;border-radius:16px;padding:8px;background:linear-gradient(#FFFDF7,#F7E9CF);border:2px solid #5A4030;box-shadow:inset 0 2px 0 #fff,0 2px 0 rgba(90,64,48,.35),0 4px 10px rgba(70,45,25,.2)}
.who img{width:64px;height:64px;border-radius:8px;display:block;box-shadow:0 0 0 1.5px #5A4030}
.pat{display:flex;gap:4px;margin-top:12px}.pat i{flex:1;height:8px;border-radius:4px;background:linear-gradient(#7FD184,#4FAE56);box-shadow:inset 0 -1px 0 rgba(0,0,0,.15)}
.c{position:absolute;right:16px;top:48px;width:160px;height:48px;border-radius:24px;display:flex;align-items:center;justify-content:flex-end;padding-right:16px;font-size:20px;line-height:28px;font-weight:700}
.coin{position:absolute;left:-6px;top:2px;width:44px;height:44px}
.t{position:absolute;right:72px;top:104px;width:104px;height:48px;border-radius:16px;display:flex;align-items:center;justify-content:center;gap:4px}
.t .lb{font-size:12px;line-height:16px}.t .v{font-size:16px;line-height:24px;font-weight:700}
.g{position:absolute;right:16px;top:104px;width:48px;height:48px;border-radius:24px;display:flex;align-items:center;justify-content:center}
.g svg{width:28px;height:28px}
'''
A_css='''.oA .c,.oA .t,.oA .g{background:linear-gradient(#FFFDF7 0%,#FBF1DD 60%,#F3E2C3 100%);border:2px solid #5A4030;box-shadow:inset 0 2px 0 #fff,inset 0 -3px 0 rgba(150,110,70,.18),0 2px 0 rgba(90,64,48,.35),0 4px 10px rgba(70,45,25,.2)}
.oA .t .lb{color:#8A6F5A}.oA .t .v{color:#B5650A}
.oA .t .lb{background:#F1DFBF;border-radius:8px;padding:0 6px;font-weight:700;color:#7A5A40}'''
B_css='''.oB .c,.oB .t,.oB .g{background:linear-gradient(#8A6344,#5E412C);border:2px solid #3A281B;box-shadow:inset 0 2px 0 rgba(255,235,200,.28),inset 0 -3px 0 rgba(0,0,0,.2),0 2px 0 rgba(40,25,15,.45),0 4px 10px rgba(40,25,15,.3);color:#FFF3DA}
.oB .c{color:#FFE9A8;text-shadow:0 1px 0 rgba(0,0,0,.35)}
.oB .t .lb{color:#E7CFA9}.oB .t .v{color:#FFD45E;text-shadow:0 1px 0 rgba(0,0,0,.35)}
.oB .who{background:linear-gradient(#8A6344,#5E412C);border-color:#3A281B;box-shadow:inset 0 2px 0 rgba(255,235,200,.28),0 2px 0 rgba(40,25,15,.45)}
.oB .who img{box-shadow:0 0 0 2px #FFF3DA}.oB .pat i.off{background:#3E2B1D}'''
C_css='''.oC .c,.oC .t,.oC .g{background:rgba(48,32,20,.58);border:1.5px solid rgba(255,240,215,.22);box-shadow:0 2px 8px rgba(30,20,10,.25);backdrop-filter:blur(6px);color:#fff}
.oC .c{color:#fff}.oC .t .lb{color:#E9D9C0}.oC .t .v{color:#FFD45E}
.oC .who{background:rgba(48,32,20,.58);border:1.5px solid rgba(255,240,215,.22);box-shadow:0 2px 8px rgba(30,20,10,.25)}
.oC .who img{box-shadow:0 0 0 2px rgba(255,255,255,.85)}'''
def hud(k):
    gfill={'A':('#5A4030','#FBF1DD'),'B':('#FFF3DA','#6E4E36'),'C':('#FFFFFF','#4A3322')}[k]
    return f'''<div class="who"><img src="{A}characters/avatar_wang_ayi_p1@2x.png"><div class="pat"><i></i><i></i><i></i><i></i></div></div>
<div class="c"><div class="coin">{COIN}</div>128</div>
<div class="t"><span class="lb">本单</span><span class="v">¥30</span></div>
<div class="g">{GEAR(*gfill)}</div>'''
opts=[('A','方案 A · 奶油瓷面','和场景同色系，浅底深字，立体感靠高光和硬投影。金币压在胶囊左边缘',True),
      ('B','方案 B · 胡桃木牌','深色木纹底，浅色字，在亮色卫生间里最跳、最好读',False),
      ('C','方案 C · 半透明暗底','轻量、现代，不挡画面；但质感偏通用，和手绘场景有些疏离',False)]
cols=''
for k,t,d,r in opts:
    cols+=f'<div class="o{k}"><p class="cap">{t}{"<span class=rec>推荐</span>" if r else ""}<small>{d}</small></p><div class="zoom"><div class="ph">{scene}{hud(k)}</div></div></div>'
open('hud_options.html','w').write(f'<!DOCTYPE html><html><head><meta charset="utf-8"><style>{base}{A_css}{B_css}{C_css}</style></head><body><div class="row">{cols}</div></body></html>')
