# v1.5 开局 UI：高保真 / 标注 / 自检 / 切图重拼比对（游戏UI）
import json, sys, os
from PIL import Image, ImageChops
from comp import *
NAR = json.load(open(ROOT + '/data/narrative.json')); B = NAR['orders']['o1']['bubbles']; CALL = NAR['calls']['o2']['script']['lines']; HINT = NAR['hints']
XU = 'characters/avatar_xiao_xu_call@2x.png'

def base(re, client='wang_ayi', p=1, pat=4, patmax=4, money=0, pay='¥30', water=.5, observed=False, hp=3, clog='soft', tools=('plunger',), pro='locked', notify=False, avatar=None, phone_on=True):
    h = '<div class="scn">' + scene(client, water, observed, clog, hp) + toolbox(tools, pro, re) + (phone(notify) if phone_on else '') + laoqian() + '</div>'
    hh = hud(client, p, pat, patmax, money, pay, re)
    if avatar: hh = hh.replace(f'avatar_{client}_p{p}@2x.png', avatar)
    return h + hh

TB_ANN = [dict(t='pos', n='锁定格点击区', e='#proSlot', ex=dict(l=230, t=640, w=64, h=80)),
          dict(t='pos', n='锁角标', e='#lockBadge', k=['l', 't', 'w', 'h'], ex=dict(l=262.5, t=644.5, w=24, h=24)), dict(t='inset', n='锁角标距第 4 格木框内沿', e='#lockBadge', fr=290.5, ft=640.5, ex=4),
          dict(t='pos', n='价格字', e='#proLabel', k=['t', 'h'], ex=dict(t=734, h=16))]
def BUB_ANN(n='头像气泡'):
    return [dict(t='pos', n=n + '位置', e='.bb', k=['l', 't'], ex=dict(l=16, t=160)), dict(t='pad', n=n, c='.bb', k='.bb .tx', e=[12, 16, 12, 16]),
            dict(t='lines', n=n + '排版', e='.bb .tx'), dict(t='tail', n='尖角')]

S = {}
def screen(name, state, fn, ann, extra_js=''):
    S[name] = dict(state=state, fn=fn, ann=ann, js=extra_js)

# 1 S1 开局需求气泡（平静）
screen('hifi_v15_s1_bubble_calm', 'S1 o1 开局 0.4s：金币 0，本单 ¥30，王阿姨 p1，耐心 4 格满；气泡 need「平静」；工具箱第 4 格专业皮搋子锁定预览',
       lambda re: base(re) + bubble(B['need']['text'], 'calm', re), BUB_ANN() + TB_ANN)
# 2 S4 别冲了（慌，p3 头像）
screen('hifi_v15_s4_bubble_panic', 'S4 o1 第一次冲水后：金币 0，本单 ¥30，耐心 4 格满，头像 avatar_wang_ayi_shock（mood:shock）；气泡 dont_flush「慌」',
       lambda re: base(re, p=3, observed=True, avatar='avatar_wang_ayi_shock@2x.png') + bubble(B['dont_flush']['text'], 'panic', re), BUB_ANN())
# 3 掉 2 格（着急）
screen('hifi_v15_bubble_urge', 'o1 疏通阶段掉 2 格：金币 0，本单 ¥30，耐心剩 2，王阿姨 p3；气泡 patience_p3「着急」',
       lambda re: base(re, p=3, pat=2, observed=True) + bubble(B['patience_p3']['text'], 'urge', re), BUB_ANN())
# 4 剩最后 1 格（慌）
screen('hifi_v15_bubble_panic_p4', 'o1 疏通阶段剩最后 1 格：金币 0，本单 ¥30，耐心剩 1，王阿姨 p4；气泡 patience_p4「慌」',
       lambda re: base(re, p=4, pat=1, observed=True) + bubble(B['patience_p4']['text'], 'panic', re), BUB_ANN())
# 5 S2 任务卡
def task(re):
    inner = f'<div class="cav" id="cav" style="background-image:url({A}characters/avatar_wang_ayi_p1@2x.png)"></div>' \
            f'<div class="ttl" id="ttl" style="margin-top:32px"><span id="ttlT">王阿姨家<span class="sep"> · </span>马桶堵了<span class="sep"> · </span><span class="pay">¥30</span></span></div>'
    b = btn('开始', 0, 0, 0, 'normal', re, 'btn').replace('class="btn  L"', 'class="btn"').replace('class="btn re L"', 'class="btn re"').replace('left:0px;top:0px;width:0px;', 'margin-top:24px;')
    return base(re) + '<div class="scrim"></div>' + card(inner + b, 424, 188, re)
screen('hifi_v15_s2_task_card', 'S2 o1 开局 1.2s：金币 0，本单 ¥30；任务卡（客户·问题·工钱 + 开始），遮罩 .6，点任意处关闭',
       task, [dict(t='pos', n='卡片', e='#card', k=['l', 't', 'r', 'h'], ex=dict(l=24, t=424, r=24, h=188)), dict(t='center', n='头像 80', e='#cav'),
              dict(t='pos', n='头像', e='#cav', k=['t', 'w', 'h'], ex=dict(t=384, w=80, h=80)), dict(t='gap', n='头像→标题', a='#cav', b='#ttl', ax='v', e=16),
              dict(t='center', n='标题', e='#ttlT'), dict(t='gap', n='标题→按钮', a='#ttl', b='#btn', ax='v', e=24),
              dict(t='pad', n='卡片(到按钮)', c='#card', k='#btn', sides=[1, 2, 3], e=[None, 24, 24, 24]), dict(t='pos', n='主按钮高', e='#btn', k=['h'], ex=dict(h=56))])
# 6 S3 L1 文字 + 手指（无遮罩）
def s3a(re):
    return base(re) + ring_pulse(195, 240, 64, 1) + ring_pulse(195, 240, 76.8, .25) + hand(211, 256).replace('class="L hand"', 'class="L hand" id="hand"') + hint(HINT['flush_first'], re=re)
screen('hifi_v15_s3_hint_hand', 'S3 第 1–2 级：任务卡关闭即出提示 hints.flush_first；3 秒没点出手指（截图在节拍起点）。金币 0，本单 ¥30，耐心 4',
       s3a, [dict(t='pos', n='提示位置', e='#hint', k=['l', 't'], ex=dict(l=16, t=160)), dict(t='pad', n='提示', c='#hint', k='#hint .tx', e=[12, 16, 12, 16]),
             dict(t='lines', n='提示排版', e='#hint .tx'), dict(t='pos', n='手指（目标中心 +16,+16）', e='#hand', k=['l', 't', 'w', 'h'], ex=dict(l=211, t=256, w=40, h=48))])
# 7 S3 L2 遮罩挖孔
def s3b(re):
    return base(re) + mask([('c', 195, 240, 32)]) + ring_pulse(195, 240, 96, .5) + hand(211, 256).replace('class="L hand"', 'class="L hand" id="hand"') + \
        hint(HINT['flush_first'], 0, 320, re, center=195) + '<div id="hole" class="L" style="left:163px;top:208px;width:64px;height:64px"></div><div id="ringO" class="L" style="left:155px;top:200px;width:80px;height:80px"></div>'
screen('hifi_v15_s3_guide_mask', 'S3 第 3 级：6 秒没点，压遮罩，冲水键圆形挖孔 r32；提示移到孔下方。金币 0，本单 ¥30，耐心 4；挖孔外点击被吞（skippable:false）',
       s3b, [dict(t='pos', n='挖孔 64', e='#hole', ex=dict(l=163, t=208, w=64, h=64)), dict(t='pos', n='挖孔边外沿 80', e='#ringO', ex=dict(l=155, t=200, w=80, h=80)),
             dict(t='gap', n='手指→提示', a='#hand', b='#hint', ax='v', e=16), dict(t='center', n='提示', e='#hint'),
             dict(t='pad', n='提示', c='#hint', k='#hint .tx', e=[12, 16, 12, 16]), dict(t='lines', n='提示排版', e='#hint .tx')])
# 8 S8 金币落在水箱盖
def s8(re):
    return base(re, observed=True, hp=0) + bubble(B['thanks']['text'], 'happy', re) + \
        '<div class="halo" style="left:216px;top:200px;width:72px;height:72px"></div>' + ring_pulse(252, 236, 67.2, .5, gold=True) + coin40(232, 216, re).replace('class="L coinbig"', 'class="L coinbig" id="coin40"') + '<div id="tap" class="L" style="left:224px;top:208px;width:56px;height:56px"></div>'
screen('hifi_v15_s8_coin_tap', 'S8 o1 疏通后 0.8s：金币落在水箱盖上等玩家点（4 秒不点自动收），胶囊仍是 0，本单 ¥30，耐心 4，王阿姨 p1；S7 感谢气泡「满意」还在',
       s8, BUB_ANN('感谢气泡') + [dict(t='pos', n='金币 40', e='#coin40', ex=dict(l=232, t=216, w=40, h=40)), dict(t='pos', n='点击区 56', e='#tap', ex=dict(l=224, t=208, w=56, h=56))])
# 9 S10 来电
def ring(re):
    return base(re, money=30, observed=True, hp=0, phone_on=False) + '<div class="dim"></div><div class="edge"></div>' + \
        '<div class="glow" style="left:131px;top:128px;width:128px;height:128px;background:radial-gradient(closest-side,rgba(255,212,94,.35),rgba(255,212,94,0))"></div>' + \
        '<div class="glow" style="left:141px;top:138px;width:108px;height:108px;border:2px solid rgba(255,212,94,.45)"></div><div class="glow" style="left:129px;top:126px;width:132px;height:132px;border:2px solid rgba(255,212,94,.15)"></div>' + \
        f'<div class="cav96" id="cav96" style="background-image:url({A}{XU})"></div><div class="cname" id="cname"><span id="cnameT">徐哥</span></div><div class="cstat" id="cstat"><span id="cstatT">来电中</span></div>' + pill(re) + \
        '<div class="glow" style="left:151px;top:528px;width:88px;height:88px;border:2px solid rgba(93,187,99,.5)"></div>' + answer('normal', re) + hand(219, 596).replace('class="L hand"', 'class="L hand" id="hand"') + phone(True)
screen('hifi_v15_s10_ring', 'S10 o1 结算关闭 0.6s 后来电，响铃第 4 秒出手指：金币 30；场景压暗 .8，手机在暗层上方继续震；徐哥头像 96 + 呼吸光，加急 ×1.5 / 工钱 ¥68',
       ring, [dict(t='pos', n='头像 96', e='#cav96', ex=dict(l=147, t=144, w=96, h=96)), dict(t='gap', n='头像→姓名', a='#cav96', b='#cname', ax='v', e=16),
              dict(t='gap', n='姓名→状态', a='#cname', b='#cstat', ax='v', e=8), dict(t='gap', n='状态→标签条', a='#cstat', b='#pill', ax='v', e=16),
              dict(t='center', n='标签条', e='#pill'), dict(t='pad', n='标签条(加急块)', c='#pill', k='#urg', sides=[0, 2, 3], e=[4, None, 4, 4]),
              dict(t='pad', n='标签条(文字端)', c='#pill', k='#pval', sides=[1], e=[None, 12, None, None]),
              dict(t='gap', n='加急块→工钱', a='#urg', b='#plab', ax='h', e=8), dict(t='gap', n='工钱→¥68', a='#plab', b='#pval', ax='h', e=4),
              dict(t='pos', n='接听 72', e='#ans', ex=dict(l=159, t=536, w=72, h=72)), dict(t='pos', n='手指（中心 +24,+24）', e='#hand', ex=dict(l=219, t=596, w=40, h=48))])
def call(lines, wavek, status, button=False):
    def fn(re):
        h = base(re, money=30, observed=True, hp=0, phone_on=False) + '<div class="dim"></div>' + \
            f'<div class="cav96" id="cav96" style="background-image:url({A}{XU})"></div><div class="cname" id="cname"><span>徐哥</span></div><div class="cstat" id="cstat"><span>{status}</span></div>' + \
            wave(wavek, idle=(wavek == 'idle'))
        for i, (li, shown, old) in enumerate(lines):
            h += callbubble(CALL[li]['text'], 'hero' if CALL[li]['speaker'] == 'hero' else 'caller', shown, old, re, i)
        if button: h += btn('马上到', 95, 648, 200, 'normal', re, 'btn')
        return h
    return fn
CALL_ANN = lambda n: [dict(t='pos', n='波形', e='#wave', k=['t', 'h'], ex=dict(t=328, h=40)), dict(t='center', n='波形 21 条', e='#wave'),
                      dict(t='gap', n='状态→波形', a='#cstat', b='#wave', ax='v', e=16)] + \
    [dict(t='pad', n=f'第{i+1}个气泡', c=f'#cb{i}', k=f'#cb{i} .tx', e=[12, 16, 12, 16]) for i in range(n)] + [dict(t='lines', n=f'第{i+1}个气泡排版', e=f'#cb{i} .tx') for i in range(n)] + \
    [dict(t='gap', n=f'气泡{i}→{i+1}', a=f'#cb{i-1}', b=f'#cb{i}', ax='v', e=8) for i in range(1, n)] + [dict(t='gap', n='波形→第 1 个气泡', a='#wave', b='#cb0', ax='v', e=24)]
screen('hifi_v15_s11_caller', 'S11 第 2 句逐字出到第 12 字（接通后 3.84s）（徐哥说话，波形金色）：通话 00:04，第 1 句已变旧（.6）；金币 30',
       call([(0, None, True), (1, 12, False)], 'caller', '通话中 00:03'), CALL_ANN(2) + [dict(t='pos', n='对方气泡左边', e='#cb1', k=['l'], ex=dict(l=24))])
screen('hifi_v15_s11_hero', 'S11 主角回话「能。地址发我。」打完（接通后 6.68s）（右侧金色气泡，波形换浅色、幅度 .6）：通话 00:07，前两句变旧；金币 30',
       call([(0, None, True), (1, None, True), (2, None, False)], 'hero', '通话中 00:06'), CALL_ANN(3) + [dict(t='pos', n='主角气泡右边', e='#cb2', k=['r'], ex=dict(r=24))])
screen('hifi_v15_s11_end', 'S11 5 句说完 0.4s 后出「马上到」（不点跳过约 12.0s）：通话 00:15，波形静止；金币 30',
       call([(2, None, True), (3, None, True), (4, None, False)], 'idle', '通话中 00:12', True),
       CALL_ANN(3) + [dict(t='pos', n='马上到', e='#btn', k=['t', 'w', 'h'], ex=dict(t=648, w=200, h=56)), dict(t='center', n='马上到', e='#btn')])
screen('hifi_v15_o3_pro_ready', 'o3 观察阶段：金币 103（o1 ¥30 + o2 ¥68 + 打赏 ¥5），本单 ¥60，李姐 p1，耐心 4；专业皮搋子「可解锁」态（金色开锁角标 + 「点击解锁」白字）',
       lambda re: base(re, client='li_jie', money=103, pay='¥60', water=.6, clog='hard', hp=1, tools=('plunger', 'scoop', 'snake'), pro='ready'), TB_ANN)

# ===== 天数做轻（onboarding.json dayDisplay，策划 b36027e）：N=3 示例 =====
DD = json.load(open(ROOT + '/data/onboarding.json'))['dayDisplay']; N = 3
DAYTXT = DD['settlement']['format'].replace('{n}', str(N))
def inbtn(label, re, mt):
    b = btn(label, 0, 0, 0, 'normal', re, 'btn')
    return b.replace('class="btn  L"', 'class="btn"').replace('class="btn re L"', 'class="btn re"').replace('left:0px;top:0px;width:0px;', f'margin-top:{mt}px;')
ROWS = [('赵姐', '门把手松了', 30), ('新客户', '马桶有点堵', 35), ('新客户', '马桶完全冲不动', 70)]
def dayend(re):
    rows = ''.join(f'<div class="kv2" id="kv{i}"><span class="k">{w}<span class="sep"> · </span>{h}</span><span class="v">¥{v}</span></div>' for i, (w, h, v) in enumerate(ROWS))
    tot = sum(r[2] for r in ROWS)
    inner = f'<div class="dttl" id="dTitle"><span id="dTitleT">{DD["settlement"]["title"]}</span></div>' \
            f'<div class="dday" id="dSub" style="margin-top:4px"><span id="dSubT">{DAYTXT}</span></div>' \
            f'<div class="dhr" id="hr1" style="margin-top:16px"></div><div id="rows" style="margin-top:8px">{rows}</div><div class="dhr" id="hr2" style="margin-top:8px"></div>' \
            f'<div class="dlab" id="dLab" style="margin-top:16px">今日收入</div><div class="damt" id="dAmt" style="margin-top:4px"><span id="dAmtT">+¥{tot}</span></div>' \
            f'<div class="dbal" id="dBal" style="margin-top:4px">余额 ¥238</div>' + inbtn(DD['nextButton'], re, 16)
    return img('screens/trans_evening@2x.jpg', 0, 0, 390, 780) + '<div class="scrim"></div>' + card(inner, 186, 408, re)
screen('hifi_v15_day_end', f'第 {N} 天收工（G2 drawDayEnd，dayDisplay.settlement）：标题「收工」+ 副标题「{DAYTXT}」同卡片一起出现（不单独动画）；3 单明细（第 3 天 o8/o9 待定，金额用 o7/o6 示意）；今日收入 +¥135、余额 ¥238；主按钮「继续开工」（无「再玩一遍」）；遮罩 rgba(43,30,20,.6)；HUD 不显示天数',
       dayend, [dict(t='pos', n='卡片', e='#card', k=['l', 't', 'r', 'h'], ex=dict(l=24, t=186, r=24, h=408)),
                dict(t='center', n='标题「收工」', e='#dTitleT'), dict(t='center', n='副标题', e='#dSubT'),
                dict(t='gap', n='标题→副标题', a='#dTitle', b='#dSub', ax='v', e=4), dict(t='style', n='副标题', e='#dSubT', ex=dict(fs='12px', lh='16px', fw='400', c='rgb(122, 90, 64)', num='tabular-nums')),
                dict(t='gap', n='副标题→虚线（原标题→下一块 16，改从副标题下沿算）', a='#dSub', b='#hr1', ax='v', e=16),
                dict(t='gap', n='虚线→明细', a='#hr1', b='#rows', ax='v', e=8), dict(t='gap', n='明细→虚线', a='#rows', b='#hr2', ax='v', e=8),
                dict(t='gap', n='虚线→今日收入', a='#hr2', b='#dLab', ax='v', e=16), dict(t='gap', n='金额→余额', a='#dAmt', b='#dBal', ax='v', e=4),
                dict(t='center', n='金额 T1', e='#dAmtT'), dict(t='gap', n='余额→主按钮', a='#dBal', b='#btn', ax='v', e=16),
                dict(t='pos', n='主按钮', e='#btn', k=['h', 'w'], ex=dict(h=56, w=294)),
                dict(t='pad', n='卡片(标题行)', c='#card', k='#dTitle', sides=[0, 1, 3], e=[24, 24, None, 24]),
                dict(t='pad', n='卡片底(到主按钮)', c='#card', k='#btn', sides=[2], e=[None, None, 24, None])])
def settings(re):
    rows = '<div class="stg" id="sg0"><span class="k">声音</span><div class="sw"></div></div>' \
           '<div class="stg" id="sg1"><span><span class="k">省动效</span><span class="s">减少抖动和闪光</span></span><div class="sw off"></div></div>' \
           '<div class="stg dis" id="sg2"><span><span class="k">震动</span><span class="s">本机不支持</span></span><div class="sw off"></div></div>'
    inner = f'<div class="srow0" id="sRow"><span class="sp" style="text-align:left"></span><span class="dttl" id="sTitle">设置<i class="blm" id="blA"></i></span><span class="sp"><span class="dday" id="sDay">{DD["settingsPanel"]["format"].replace("{n}", str(N))}<i class="blm" id="blB"></i></span></span></div>' \
            f'<div id="sRows" style="margin-top:8px">{rows}</div><div class="stip" id="sTip" style="margin-top:16px">卡住了？问老钱 · 今日免费 1 次</div>' + inbtn('继续干活', re, 16) + \
            '<div class="sfoot" id="sFoot" style="margin-top:8px">点卡片外也能关闭 · 打开时游戏暂停</div>'
    return base(re, client='wang_ayi', money=238, pay='¥40', phone_on=False) + '<div class="scrim"></div>' + card(inner, 176, 400, re) + phone(False)
screen('hifi_v15_settings', f'设置面板（dayDisplay.settingsPanel）：第 {N} 天某单进行中点齿轮打开，金币 238、本单 ¥40（示意）；标题「设置」居中，「第 {N} 天」在标题行右端、与标题基线对齐；遮罩 rgba(43,30,20,.6) 压住场景和 HUD，手机在遮罩上方（弹层打开时不弹通知条）',
       settings, [dict(t='pos', n='卡片', e='#card', k=['l', 't', 'r', 'h'], ex=dict(l=24, t=176, r=24, h=400)), dict(t='center', n='标题「设置」', e='#sTitle'),
                  dict(t='base', n='「第 N 天」与标题', a='#blA', b='#blB'), dict(t='style', n='「第 N 天」', e='#sDay', ex=dict(fs='12px', lh='16px', fw='400', c='rgb(122, 90, 64)', num='tabular-nums')),
                  dict(t='pad', n='卡片(「第 N 天」右)', c='#card', k='#sDay', sides=[1], e=[None, 24, None, None]), dict(t='pad', n='卡片(标题行)', c='#card', k='#sRow', sides=[0], e=[24, None, None, None]),
                  dict(t='gap', n='标题行→开关', a='#sRow', b='#sRows', ax='v', e=8), dict(t='gap', n='开关→提示条', a='#sRows', b='#sTip', ax='v', e=16),
                  dict(t='gap', n='提示条→主按钮', a='#sTip', b='#btn', ax='v', e=16), dict(t='pos', n='主按钮', e='#btn', k=['h'], ex=dict(h=56)),
                  dict(t='gap', n='主按钮→说明', a='#btn', b='#sFoot', ax='v', e=8), dict(t='pad', n='卡片底', c='#card', k='#sFoot', sides=[2], e=[None, None, 24, None])])
# 参考图（不进 qa/pixel）：S4 用 shock 表情
REF = {}

TAILJS = '''ANN.filter(a=>a.t==='base').forEach(a=>{const A=R(Q(a.a)),B=R(Q(a.b));chk(eqv(A.t,B.t),`${a.n} 基线 y ${f(A.t)} / ${f(B.t)}（应相同）`);if(SHOW)hseg(A.l-4,B.l+4,A.t,'基线 '+f(A.t))});ANN.filter(a=>a.t==='style').forEach(a=>{const c=getComputedStyle(Q(a.e));const v={fs:c.fontSize,lh:c.lineHeight,fw:c.fontWeight,c:c.color,num:c.fontVariantNumeric};const ok=Object.keys(a.ex).every(k=>v[k]===a.ex[k]);chk(ok,`${a.n} 字 ${v.fs}/${v.lh} 字重 ${v.fw} ${v.c} ${v.num}`)});ANN.filter(a=>a.t==='inset').forEach(a=>{const r=R(Q(a.e));const ir=a.fr-r.r,it=r.t-a.ft;chk(eqv(ir,a.ex)&&eqv(it,a.ex),`${a.n}：右 ${f(ir)} / 上 ${f(it)}（应 ${a.ex}；内沿实测 x ${a.fr}、y ${a.ft}；角标完全在格内，不压箱沿）`);if(SHOW){hseg(r.r,a.fr,r.t+12,f(ir));vseg(a.ft,r.t,r.l+12,f(it))}});ANN.filter(a=>a.t==='tail').length&&(()=>{const b=R(Q('.bb')),s=R(Q('.bb .tail'));const base=s.l+2-b.l,apex=s.t;chk(eqv(base,24)&&eqv(apex,152),`尖角：底边起点离气泡左边 ${f(base)}（应 24），宽 16，尖顶 y ${f(apex)}（贴客户卡底 152）`);if(SHOW){hseg(b.l,s.l+2,b.t-12,f(base))}})();'''
def write(name, body, state, ann, mode):
    js = open('layout.js').read()
    if mode == 'ann':
        js += f'window.STATE={json.dumps(state, ensure_ascii=False)};window.ANN={json.dumps(ann, ensure_ascii=False)};' + open('ann.js').read().replace("document.title=JSON.stringify(res);", TAILJS + "document.title=JSON.stringify(res);")
    h = page(body, name, js)
    if mode == 'ann': h = h.replace('<body>', '<body class="annmode">').replace('html,body{width:390px', 'html{width:760px}body{width:390px')
    fn = f'_{name}_{mode}.html'; open(fn, 'w').write(h); return fn

def main():
    os.makedirs('hifi', exist_ok=True)
    QA = ROOT + '/qa/pixel/'
    report = {}
    only = sys.argv[1:]
    for name, s in list(S.items()) + [(k, dict(state=v[0], fn=v[1], ann=[], js='')) for k, v in REF.items()]:
        if only and name not in only: continue
        hi = write(name, s['fn'](False), s['state'], s['ann'], 'hi'); shot(hi, f'hifi/{name}.png')
        if name.startswith('ref_'): continue
        an = write(name, s['fn'](False), s['state'], s['ann'], 'ann')
        shot(an, f'hifi/{name}_annotation.png', size=(760, 780))
        d = dom(an); t = d.split('<title>')[1].split('</title>')[0]
        import html as H; res = json.loads(H.unescape(t))
        re_ = write(name, s['fn'](True), s['state'], s['ann'], 're'); shot(re_, f'/tmp/{name}_re.png')
        a = Image.open(f'hifi/{name}.png').convert('RGB'); b = Image.open(f'/tmp/{name}_re.png').convert('RGB')
        df = ImageChops.difference(a, b).convert('L'); px = df.getdata(); bad = sum(1 for p in px if p > 24)
        res['recomp'] = dict(bad_pct=round(bad / len(px) * 100, 3), max=max(px), size=a.size, bad_px=bad)
        if bad / len(px) > 1e-5: res['ok'] = False
        a.save(QA + name + '.png')
        report[name] = dict(state=s['state'], **res)
        print(name, 'OK' if res['ok'] else 'FAIL', res['recomp'], [c[1] for c in res['checks'] if not c[0]])
    old = json.load(open('hifi/selfcheck.json')) if os.path.exists('hifi/selfcheck.json') and only else {}
    old.update(report); json.dump(old, open('hifi/selfcheck.json', 'w'), ensure_ascii=False, indent=1)
if __name__ == '__main__':
    main()
