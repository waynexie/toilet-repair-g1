import json
S=json.load(open('scene.json'))
A='../../../../assets/'
css=open('style.css').read()
def hud(pat=4,tag='¥30'):
    pips=''.join(f'<i class="{"" if k<pat else "off"}"></i>' for k in range(4))
    return f'''<div class="who panel"><img src="{A}characters/avatar_wang_ayi_p{5-pat}@2x.png"><div class="pat">{pips}</div></div>
<div class="coins panel"><span class="cn">¥</span><span class="t2">128</span></div>
<div class="tag panel t3 b"><span class="t5 mute" style="margin-right:4px">本单</span>{tag}</div>
<div class="gear panel"><svg viewBox="0 0 24 24" fill="none" stroke="#5A4030" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/><circle cx="12" cy="12" r="6.5"/></svg></div>'''
def box(sel=0,locked=(1,2,3),plunger=True):
    cx=[41,110,178,247]
    s=f'<div class="box"><img src="{A}ui/ui_toolbox_lid_lv1@2x.png" class="lid"><img src="{A}ui/ui_toolbox_body_lv1@2x.png" class="body">'
    for i in locked: s+=f'<img src="{A}ui/ui_toolbox_lockplate@2x.png" class="lock" style="left:{cx[i]-29}px">'
    if plunger: s+=f'<img src="{A}tools/tool_plunger_old@2x.png" class="tool {"sel" if sel==0 else ""}" style="left:{cx[0]-20}px">'
    names=['皮搋子','升级解锁','升级解锁','升级解锁']
    for i,n in enumerate(names): s+=f'<div class="lab {"lk" if i in locked else ""}" style="left:{cx[i]-32}px">{n}</div>'
    return s+'</div>'
phone=lambda n,ring=False: f'<div class="phone{" ring" if ring else ""}"><img src="{A}ui/phone_floor_{"notify" if n else "idle"}@2x.png"><div class="dot">{n}</div></div>' if n else f'<div class="phone"><img src="{A}ui/phone_floor_idle@2x.png"></div>'
lq=f'<img class="lq" src="{A}ui/btn_laoqian@2x.png">'
def screen(cap,body,water='normal'):
    return f'<div><p class="cap">{cap}</p><div class="ph">{S[water]}{body}</div></div>'

p1=screen('① HUD 比例（右侧三件同高 48，和客户卡上下对齐）',hud()+box()+phone(0)+lq+'''
<div class="guide-grid"></div>''')
p2=screen('② 冲水引导 + 喂信提醒（两个状态合画，实际不同时出现）',hud()+'''
<div class="bubble panel t4 b">先冲一下水，看看什么情况</div>
<div class="tapring" style="left:163px;top:208px"><i></i><i class="r2"></i></div>
<div class="hand" style="left:196px;top:236px">'''+open('hand.svg').read()+'''</div>
'''+box()+f'''
<div class="notif panel"><img src="{A}ui/weixin_icon.svg"><div style="flex:1;min-width:0"><div class="t5 mute"><b style="color:#5A4030">喂信</b> · 相亲相爱一家人</div><div class="t4 b ell">妈妈：中午回来吃饭不？</div></div><span class="chip-open t5 b">点开</span></div>
'''+phone(1,True))
p3=screen('③ 拖工具：气泡内边距 + 落点高亮',hud()+'''
<div class="bubble panel t4 b">把皮搋子拖到马桶里，压到底，<br>圈变绿时松手</div>
<div class="drop hover" style="left:122px;top:458px;width:146px;height:122px"><i class="s1">✦</i><i class="s2">✦</i><i class="s3">✦</i></div>
<img class="drag" src="'''+A+'''tools/tool_plunger_old@2x.png" style="left:168px;top:392px">
'''+box(sel=0,plunger=False)+phone(0)+lq)
p4=screen('④ 往下捅：收缩圈节奏引导',hud(3)+'''
<div class="target" style="left:135px;top:478px;width:120px;height:72px"></div>
<div class="approach" style="left:111px;top:463px;width:168px;height:101px"></div>
<img class="drag" src="'''+A+'''tools/tool_plunger_old@2x.png" style="left:168px;top:420px">
<div class="toast t1">完美!</div>
<div class="pips"><span class="t5 b">疏通</span><i class="on"></i><i class="on"></i><i></i></div>
'''+box(plunger=False)+phone(0)+lq)
open('hifi_v12.html','w').write(f'<html><head><meta charset="utf-8"><style>{css}</style></head><body><div class="row">{p1}{p2}{p3}{p4}</div></body></html>')
