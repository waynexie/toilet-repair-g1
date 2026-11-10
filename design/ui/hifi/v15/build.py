# v1.5 开局 UI：高保真 / 标注 / 自检 / 切图重拼比对（游戏UI）
import json, sys, os
from PIL import Image, ImageChops
from comp import *
NAR = json.load(open(ROOT + '/data/narrative.json')); B = NAR['orders']['o1']['bubbles']; CALL = NAR['calls']['o2']['script']['lines']; HINT = NAR['hints']
XU = 'characters/avatar_xiao_xu_call@2x.png'

# —— 状态全部由数据推导，不手填（策划打回后加：第 4 格状态 / 本单金额 / 表情 / 工具 / 耐心上限）——
ORDJ = json.load(open(ROOT + '/data/orders.json')); G2J = json.load(open(ROOT + '/data/g2_orders.json')); ECO = json.load(open(ROOT + '/data/economy.json'))
PRO_PRICE = ORDJ['tools']['plunger_pro']['price']
def _ord(oid):
    for o in ORDJ['orders'] + G2J['orders']:
        if o['id'] == oid: return o
    raise KeyError(oid)
def order_info(oid):
    o = _ord(oid); src = o.get('source') or ('referral' if oid.startswith('lock_referral') else 'message')
    base_pay = o.get('basePay') or ECO['laborFees'][oid]['basePay']
    mult = ECO['orderSources'][src]['payMultiplier']
    client = o.get('customer') or (NAR['orders'].get(oid) or {}).get('client') or ECO['laborFees'].get(oid, {}).get('customer')
    patmax = ECO['orderSources'][src].get('patienceMax', ORDJ['patience']['max'])
    tip = sum(g['amount'] for g in ECO['gifts']['scripted'] if g['order'] == oid and g['kind'] == 'cash')
    return dict(id=oid, client=client, pay=int(base_pay * mult + .5), patmax=patmax, src=src, tip=tip, water=o.get('waterLevel', .5), clog=o.get('fault', 'soft'), hp=o.get('clogHp', 3))
def tools_for(oid):  # o1 只有皮搋子；o2 起送水瓢；o3 起送疏通器（G1 剧本），之后全有
    return {'o1': ('plunger',), 'o2': ('plunger', 'scoop')}.get(oid, ('plunger', 'scoop', 'snake'))
def pat_level(pat, mx): return max(1, min(4, 1 + (mx - pat)))   # 同 src/art.js patLevel
def pro_state(money, bought=False): return 'bought' if bought else ('ready' if money >= PRO_PRICE else 'locked')
def base(re, order='o1', pat=None, money=0, observed=False, cleared=False, mood=None, notify=False, phone_on=True, bought=False):
    oi = order_info(order); client = oi['client']; patmax = oi['patmax']; pat = patmax if pat is None else pat
    p = pat_level(pat, patmax); hp = 0 if cleared else oi['hp']
    h = '<div class="scn">' + scene(client, oi['water'], observed or cleared, oi['clog'], hp) + toolbox(tools_for(order), pro_state(money, bought), re, PRO_PRICE) + (phone(notify) if phone_on else '') + laoqian() + '</div>'
    hh = hud(client, p, pat, patmax, money, f'¥{oi["pay"]}', re)
    if mood == 'shock': hh = hh.replace(f'avatar_{client}_p{p}@2x.png', f'avatar_{client}_shock@2x.png')   # 剧本气泡 mood:shock 覆盖表情
    return h.replace('id="proSlot"', f'id="proSlot" data-price="{PRO_PRICE}"', 1) + hh.replace('class="who', f'data-order="{order}" data-client="{client}" data-mood="{mood or ""}" data-pay="¥{oi["pay"]}" data-pat="{pat}" data-patmax="{patmax}" class="who', 1)

O1, O2, O3 = order_info('o1'), order_info('o2'), order_info('o3')
MONEY_O2_DONE = O1['pay']; MONEY_O3 = O1['pay'] + O2['pay'] + O2['tip']      # o3 观察阶段：o1 + o2（来电 ×1.5）+ 徐哥打赏
DAY3 = ['lock_referral_1', 'o6', 'o5']   # 第 3 天：赵姐转介绍 + 第 2 天没接的 o6/o5 补位（src/g2.js G2nextDay，o8/o9 待定）；o5 排最后
DAY3_END = 238                           # 策划给定的收工余额；设置面板背景 = 第 3 天最后一单 o5 刚疏通完（钱已入账），所以 HUD 金币 = 收工余额
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
       lambda re: base(re, observed=True, mood='shock') + bubble(B['dont_flush']['text'], 'panic', re), BUB_ANN())
# 3 掉 2 格（着急）
screen('hifi_v15_bubble_urge', 'o1 疏通阶段掉 2 格：金币 0，本单 ¥30，耐心剩 2，王阿姨 p3；气泡 patience_p3「着急」',
       lambda re: base(re, pat=2, observed=True) + bubble(B['patience_p3']['text'], 'urge', re), BUB_ANN())
# 4 剩最后 1 格（慌）
screen('hifi_v15_bubble_panic_p4', 'o1 疏通阶段剩最后 1 格：金币 0，本单 ¥30，耐心剩 1，王阿姨 p4；气泡 patience_p4「慌」',
       lambda re: base(re, pat=1, observed=True) + bubble(B['patience_p4']['text'], 'panic', re), BUB_ANN())
# 5 S2 任务卡
def task(re):
    inner = f'<div class="cav" id="cav" style="background-image:url({A}characters/avatar_wang_ayi_p1@2x.png)"></div>' \
            f'<div class="ttl" id="ttl" style="margin-top:32px"><span id="ttlT">王阿姨家<span class="sep"> · </span>马桶堵了<span class="sep"> · </span><span class="pay">¥{O1["pay"]}</span></span></div>'
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
    return base(re, cleared=True) + bubble(B['thanks']['text'], 'happy', re) + \
        '<div class="halo" style="left:216px;top:200px;width:72px;height:72px"></div>' + ring_pulse(252, 236, 67.2, .5, gold=True) + coin40(232, 216, re).replace('class="L coinbig"', 'class="L coinbig" id="coin40"') + '<div id="tap" class="L" style="left:224px;top:208px;width:56px;height:56px"></div>'
screen('hifi_v15_s8_coin_tap', 'S8 o1 疏通后 0.8s：金币落在水箱盖上等玩家点（4 秒不点自动收），胶囊仍是 0，本单 ¥30，耐心 4，王阿姨 p1；S7 感谢气泡「满意」还在',
       s8, BUB_ANN('感谢气泡') + [dict(t='pos', n='金币 40', e='#coin40', ex=dict(l=232, t=216, w=40, h=40)), dict(t='pos', n='点击区 56', e='#tap', ex=dict(l=224, t=208, w=56, h=56))])
# 9 S10 来电
def ring(re):
    return base(re, money=30, cleared=True, phone_on=False) + '<div class="dim"></div><div class="edge"></div>' + \
        '<div class="glow" style="left:131px;top:128px;width:128px;height:128px;background:radial-gradient(closest-side,rgba(255,212,94,.35),rgba(255,212,94,0))"></div>' + \
        '<div class="glow" style="left:141px;top:138px;width:108px;height:108px;border:2px solid rgba(255,212,94,.45)"></div><div class="glow" style="left:129px;top:126px;width:132px;height:132px;border:2px solid rgba(255,212,94,.15)"></div>' + \
        f'<div class="cav96" id="cav96" style="background-image:url({A}{XU})"></div><div class="cname" id="cname"><span id="cnameT">徐哥</span></div><div class="cstat" id="cstat"><span id="cstatT">来电中</span></div>' + pill(re, ECO['orderSources'][O2['src']]['payMultiplier'], O2['pay']) + \
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
        h = base(re, money=30, cleared=True, phone_on=False) + '<div class="dim"></div>' + \
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
screen('hifi_v15_s11_caller', 'S11 第 2 句逐字出到第 12 字（接通后 3.84s）（徐哥说话，波形金色）：通话中 00:03，第 1 句已变旧（.7）；金币 30',
       call([(0, None, True), (1, 12, False)], 'caller', '通话中 00:03'), CALL_ANN(2) + [dict(t='pos', n='对方气泡左边', e='#cb1', k=['l'], ex=dict(l=24))])
screen('hifi_v15_s11_hero', 'S11 主角回话「能。地址发我。」打完（接通后 6.68s）（右侧金色气泡，波形换浅色、幅度 .6）：通话中 00:06，前两句变旧（.7）；金币 30',
       call([(0, None, True), (1, None, True), (2, None, False)], 'hero', '通话中 00:06'), CALL_ANN(3) + [dict(t='pos', n='主角气泡右边', e='#cb2', k=['r'], ex=dict(r=24))])
screen('hifi_v15_s11_end', 'S11 5 句说完 0.4s 后出「马上到」（不点跳过约 12.0s）：通话中 00:12，波形静止；金币 30',
       call([(2, None, True), (3, None, True), (4, None, False)], 'idle', '通话中 00:12', True),
       CALL_ANN(3) + [dict(t='pos', n='马上到', e='#btn', k=['t', 'w', 'h'], ex=dict(t=648, w=200, h=56)), dict(t='center', n='马上到', e='#btn')])
screen('hifi_v15_o3_pro_ready', f'o3 观察阶段：金币 {MONEY_O3}（o1 ¥{O1["pay"]} + o2 ¥{O2["pay"]} + 打赏 ¥{O2["tip"]}），本单 ¥{O3["pay"]}，李姐 p1，耐心 4；金币 ≥ ¥{PRO_PRICE} → 专业皮搋子「可解锁」态（金色开锁角标 + 「点击解锁」白字）',
       lambda re: base(re, order='o3', money=MONEY_O3), TB_ANN)

# ===== 天数做轻（onboarding.json dayDisplay，策划 b36027e）：N=3 示例 =====
DD = json.load(open(ROOT + '/data/onboarding.json'))['dayDisplay']; N = 3
DAYTXT = DD['settlement']['format'].replace('{n}', str(N))
def inbtn(label, re, mt):
    b = btn(label, 0, 0, 0, 'normal', re, 'btn')
    return b.replace('class="btn  L"', 'class="btn"').replace('class="btn re L"', 'class="btn re"').replace('left:0px;top:0px;width:0px;', f'margin-top:{mt}px;')
def _row(oid):
    oi = order_info(oid); o = _ord(oid); who = NAR['characters'][oi['client']]['name'] if oi['client'] else '新客户'
    return (who, o.get('boardHint') or '', oi['pay'] + oi['tip'])   # 每行 = 工钱（含来源倍率）+ 现金打赏
ROWS = [_row(o) for o in DAY3]
def dayend(re):
    rows = ''.join(f'<div class="kv2" id="kv{i}"><span class="k">{w}<span class="sep"> · </span>{h}</span><span class="v">¥{v}</span></div>' for i, (w, h, v) in enumerate(ROWS))
    tot = sum(r[2] for r in ROWS)
    inner = f'<div class="dttl" id="dTitle"><span id="dTitleT">{DD["settlement"]["title"]}</span></div>' \
            f'<div class="dday" id="dSub" style="margin-top:4px"><span id="dSubT">{DAYTXT}</span></div>' \
            f'<div class="dhr" id="hr1" style="margin-top:16px"></div><div id="rows" style="margin-top:8px">{rows}</div><div class="dhr" id="hr2" style="margin-top:8px"></div>' \
            f'<div class="dlab" id="dLab" style="margin-top:16px">今日收入</div><div class="damt" id="dAmt" style="margin-top:4px"><span id="dAmtT">+¥{tot}</span></div>' \
            f'<div class="dbal" id="dBal" style="margin-top:4px">余额 ¥{DAY3_END}</div>' + inbtn(DD['nextButton'], re, 16)
    return img('screens/trans_evening@2x.jpg', 0, 0, 390, 780) + '<div class="scrim"></div>' + card(inner, 186, 408, re)
screen('hifi_v15_day_end', f'第 {N} 天收工（G2 drawDayEnd，dayDisplay.settlement）：标题「收工」+ 副标题「{DAYTXT}」同卡片一起出现（不单独动画）；3 单明细（第 3 天按 src/g2.js：赵姐转介绍 ¥{order_info("lock_referral_1")["pay"]}+转账打赏 ¥{order_info("lock_referral_1")["tip"]}、第 2 天没接的 o6 ¥{order_info("o6")["pay"]} / o5 ¥{order_info("o5")["pay"]} 补位；o8/o9 待定）；今日收入 +¥{sum(r[2] for r in ROWS)}、余额 ¥{DAY3_END}；主按钮「继续开工」（无「再玩一遍」）；遮罩 rgba(43,30,20,.6)；HUD 不显示天数',
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
RP = json.load(open(ROOT + '/data/onboarding.json'))
def settings_fn(replayed):
    def settings(re):
        rows = '<div class="stg" id="sg0"><span class="k">声音</span><div class="sw"><i></i></div></div>' \
               '<div class="stg" id="sg1"><span><span class="k">省动效</span><span class="s">减少抖动和闪光</span></span><div class="sw off"><i></i></div></div>' \
               '<div class="stg dis" id="sg2"><span><span class="k">震动</span><span class="s">本机不支持</span></span><div class="sw off"><i></i></div></div>' \
               f'<div class="stg" id="sg3"><span id="rpL"><span class="k" id="rpK">重新看新手引导</span>{"<span class=s id=rpS>下次开工时重新引导</span>" if replayed else ""}</span>' + sbtn('重看', 'disabled' if replayed else 'normal', re) + '</div>'
        inner = f'<div class="srow0" id="sRow"><span class="sp" style="text-align:left"></span><span class="dttl" id="sTitle">设置<i class="blm" id="blA"></i></span><span class="sp"><span class="dday" id="sDay">{DD["settingsPanel"]["format"].replace("{n}", str(N))}<i class="blm" id="blB"></i></span></span></div>' \
                f'<div id="sRows" style="margin-top:8px">{rows}</div><div class="stip" id="sTip" style="margin-top:16px">卡住了？问老钱 · 今日免费 1 次</div>' + inbtn('继续干活', re, 16) + \
                '<div class="sfoot" id="sFoot" style="margin-top:8px">点卡片外也能关闭 · 打开时游戏暂停</div>'
        return base(re, order=DAY3[-1], money=DAY3_END, cleared=True, phone_on=False) + '<div class="scrim"></div>' + card(inner, 162, 456, re) + phone(False)
    return settings
SET_ANN = [dict(t='pos', n='卡片（垂直居中）', e='#card', k=['l', 't', 'r', 'h', 'b'], ex=dict(l=24, t=162, r=24, h=456, b=162)), dict(t='center', n='标题「设置」', e='#sTitle'),
           dict(t='base', n='「第 N 天」与标题', a='#blA', b='#blB'), dict(t='style', n='「第 N 天」', e='#sDay', ex=dict(fs='12px', lh='16px', fw='400', c='rgb(122, 90, 64)', num='tabular-nums')),
           dict(t='pad', n='卡片(「第 N 天」右)', c='#card', k='#sDay', sides=[1], e=[None, 24, None, None]), dict(t='pad', n='卡片(标题行)', c='#card', k='#sRow', sides=[0], e=[24, None, None, None]),
           dict(t='gap', n='标题行→开关', a='#sRow', b='#sRows', ax='v', e=8),
           dict(t='pos', n='「重看」行高（同开关行）', e='#sg3', k=['h'], ex=dict(h=56)), dict(t='gap', n='震动行→重看行', a='#sg2', b='#sg3', ax='v', e=0),
           dict(t='style', n='行标题「重新看新手引导」（T3 同开关行）', e='#rpK', ex=dict(fs='16px', lh='24px', fw='700')),
           dict(t='pos', n='「重看」按钮', e='#sbtn', k=['h', 'w'], ex=dict(h=32, w=48)), dict(t='pad', n='「重看」左右（含 2px 描边，同全局内边距口径）', c='#sbtn', k='#sbtnT', sides=[1, 3], e=[None, 12, None, 12]),
           dict(t='pad', n='「重看」右边距（同开关）', c='#sg3', k='#sbtn', sides=[1], e=[None, 0, None, None]),
           dict(t='gap', n='重看行→提示条', a='#sg3', b='#sTip', ax='v', e=16),
           dict(t='gap', n='提示条→主按钮', a='#sTip', b='#btn', ax='v', e=16), dict(t='pos', n='主按钮', e='#btn', k=['h'], ex=dict(h=56)),
           dict(t='gap', n='主按钮→说明', a='#btn', b='#sFoot', ax='v', e=8), dict(t='pad', n='卡片底', c='#card', k='#sFoot', sides=[2], e=[None, None, 24, None])]
screen('hifi_v15_settings', f'设置面板（dayDisplay.settingsPanel + settingsReplay）：第 {N} 天最后一单 o5（王阿姨，本单 ¥{order_info("o5")["pay"]}）刚疏通完、钱已入账时点齿轮：金币 {DAY3_END}（= 收工余额）≥ ¥{PRO_PRICE} → 第 4 格可解锁态；三件工具都已到手；「第 {N} 天」在标题行右端、与标题基线对齐；震动行后新增「重新看新手引导」+「重看」（常态）；遮罩 rgba(43,30,20,.6) 压住场景和 HUD，手机在遮罩上方（弹层打开时不弹通知条）；玩家版不画「复制用时」（仅 ?debug=1）',
       settings_fn(False), SET_ANN)
screen('hifi_v15_settings_replayed', f'设置面板：点「重看」后（已清 tutorialDone）：按钮禁用，行内说明「下次开工时重新引导」T5 #7A5A40；不弹确认框；其余同常态',
       settings_fn(True), SET_ANN + [dict(t='style', n='行内说明', e='#rpS', ex=dict(fs='12px', lh='16px', fw='400', c='rgb(122, 90, 64)'))])
# ===== ② 单子结算页 v1.5：打赏行 / 看广告翻倍（赵姐转介绍单 lock_referral_1，第 3 天）=====
import re as _re
from PIL import Image as _I
G2SRC = open(ROOT + '/src/g2.js').read()
PLACE = dict(_re.findall(r"(\w+):'([^']+)'", _re.search(r"const PLACE=\{([^}]*)\}", G2SRC).group(1)))   # 地点取 src/g2.js PLACE（数据里没有）
DBL = ECO['rewardedAds']['doublePay']        # target basePay，×multiplier；gifts.rules.adDoubleApplies=false → 打赏不翻
def settle_info(oid, doubled=False):
    oi = order_info(oid); o = _ord(oid)
    sg = [g for g in ECO['gifts']['scripted'] if g['order'] == oid]
    gift = None
    if sg:
        g = sg[0]; nk = g['lineKey'].split('.', 1)[1]; ng = NAR['gifts'][nk]
        kind = 'cash' if g['kind'] == 'cash' else 'item'
        gift = dict(key=nk, kind=kind, amount=g['amount'] if kind == 'cash' else 0, icon=ng['icon'], label=NAR['gifts']['settle_row_label'][kind], item=ng.get('item'))
    mult_src = ECO['orderSources'][oi['src']]['payMultiplier']; base_pay = o.get('basePay') or ECO['laborFees'][oid]['basePay']
    dm = DBL['multiplier'] if doubled else 1
    wage = oi['pay'] * dm
    cash = gift['amount'] if gift else 0
    gift_x = dm if (doubled and ECO['gifts']['rules'].get('adDoubleApplies')) else 1
    day = next(d for d in G2J['days'] if oid in (d.get('board') or []))
    seq = DAY3 if day['day'] == 3 else day['board']; last = seq.index(oid) == day['pickCount'] - 1
    hk = NAR['g2_hooks'][oid]['lines']
    return dict(oi=oi, base=base_pay, srcmult=mult_src, dm=dm, wage=wage, gift=gift, cash=cash * gift_x, total=wage + cash * gift_x, day=day['day'], pick=day['pickCount'], pos=seq.index(oid) + 1,
                last=last, button='收工' if last else '接下一单', line=hk['done']['text'], place=PLACE[oid])
def quote_lines(t, maxw=294, fs=20):   # T2 一行最多 14 字（294/20）；超了在最后一个能让两行都放下的逗号后断
    q = '“' + t + '”'
    if len(q) * fs <= maxw: return [q]
    cut = [i for i, c in enumerate(q) if c in '，。！？' and (i + 1) * fs <= maxw and (len(q) - i - 1) * fs <= maxw]
    assert cut, f'客户台词两行放不下：{q}'
    i = cut[-1]; return [q[:i + 1], q[i + 1:]]
SETTLE_ID = 'lock_referral_1'
def settle_fn(doubled):
    si = settle_info(SETTLE_ID, doubled); oi = si['oi']; g = si['gift']
    H = 488 - (0 if not doubled else 64); TOP = (780 - H) // 2
    def fn(re):
        ql = quote_lines(si['line'])
        wage_v = f'<span class="vb"><span id="vWage">¥{si["wage"]}<i class="blm" id="blW"></i></span>' + (f'<span class="x2" id="x2">×{DBL["multiplier"]}<i class="blm" id="blX"></i></span>' if doubled else '') + '</span>'
        rows = f'<div class="kv3" id="rWage"><span class="k">工钱</span><span class="v">{wage_v}</span></div>' \
               f'<div class="kv3" id="rTime"><span class="k">用时</span><span class="v">14.2 秒</span></div>'
        if g:
            gv = f'¥{g["amount"]}' if g['kind'] == 'cash' else g['item']
            rows += f'<div class="kv3" id="rGift"><span class="k">{g["label"]}</span><span class="v" id="vGiftBox"><img class="gi" id="gIcon" src="{A}ui/gifts/{g["icon"]}_24@2x.png" data-icon="{g["icon"]}" data-nw="{_I.open(ROOT + "/assets/ui/gifts/" + g["icon"] + "_24@2x.png").size[0]}"><span id="vGift">{gv}</span></span></div>'
        inner = f'<div class="cav" id="cav" style="background-image:url({A}characters/avatar_{oi["client"]}_p1@2x.png)"></div>' \
                f'<div class="sq" id="sQ" style="margin-top:32px">' + ''.join(f'<span class="ln2"><span id="sQ{i}">{l}</span></span>' for i, l in enumerate(ql)) + '</div>' \
                f'<div class="sloc" id="sLoc" style="margin-top:4px"><span id="sLocT">{si["place"]}</span></div>' \
                f'<div class="dhr" id="hr1" style="margin-top:16px"></div><div id="rows" style="margin-top:8px">{rows}</div><div class="dhr" id="hr2" style="margin-top:8px"></div>' \
                f'<div class="damt" id="dAmt" style="margin-top:16px"><span id="dAmtT">+¥{si["total"]}</span></div>' + inbtn(si['button'], re, 16) + \
                ('' if doubled else btn2('看广告 工钱翻倍', 'normal', re))
        c = card(inner, TOP, H, re).replace('class="card', f'data-wage0="{oi["pay"]}" data-base="{si["base"]}" data-srcmult="{si["srcmult"]}" data-dm="{si["dm"]}" data-gift="{si["cash"]}" data-icon="{g["icon"] if g else ""}" data-total="{si["total"]}" data-doubled="{int(doubled)}" data-button="{si["button"]}" class="card', 1)
        return img('screens/doorway_zhao@2x.jpg', 0, 0, 390, 780) + '<div class="scrim"></div>' + c + phone(False)
    return fn, si, H, TOP
def SETTLE_ANN(H, TOP, doubled, nq):
    a = [dict(t='pos', n='卡片（垂直居中）', e='#card', k=['l', 't', 'r', 'h', 'b'], ex=dict(l=24, t=TOP, r=24, h=H, b=780 - TOP - H)),
         dict(t='pos', n='头像 80（一半压卡片顶边）', e='#cav', k=['t', 'w', 'h'], ex=dict(t=TOP - 40, w=80, h=80)), dict(t='center', n='头像', e='#cav'),
         dict(t='gap', n='头像→台词', a='#cav', b='#sQ', ax='v', e=16)] + [dict(t='center', n=f'台词第 {i+1} 行', e=f'#sQ{i}') for i in range(nq)] + \
        [dict(t='style', n='客户台词 T2', e='#sQ', ex=dict(fs='20px', lh='28px', fw='700', c='rgb(90, 64, 48)')),
         dict(t='gap', n='台词→地点', a='#sQ', b='#sLoc', ax='v', e=4), dict(t='center', n='地点', e='#sLocT'), dict(t='style', n='地点 T5', e='#sLoc', ex=dict(fs='12px', lh='16px', fw='400', c='rgb(122, 90, 64)')),
         dict(t='gap', n='地点→虚线', a='#sLoc', b='#hr1', ax='v', e=16), dict(t='gap', n='虚线→明细', a='#hr1', b='#rows', ax='v', e=8),
         dict(t='pos', n='明细行高', e='#rWage', k=['h'], ex=dict(h=32)), dict(t='pos', n='打赏行高', e='#rGift', k=['h'], ex=dict(h=32)),
         dict(t='pad', n='卡片(明细左右)', c='#card', k='#rows', sides=[1, 3], e=[None, 24, None, 24]),
         dict(t='pos', n='打赏图标 24', e='#gIcon', k=['w', 'h'], ex=dict(w=24, h=24)), dict(t='gap', n='打赏图标→数值', a='#gIcon', b='#vGift', ax='h', e=8),
         dict(t='vc', n='打赏图标与数值', a='#gIcon', b='#vGift'), dict(t='vc', n='打赏图标与行', a='#gIcon', b='#rGift'),
         dict(t='gap', n='明细→虚线', a='#rows', b='#hr2', ax='v', e=8), dict(t='gap', n='虚线→金额', a='#hr2', b='#dAmt', ax='v', e=16), dict(t='center', n='金额 T1', e='#dAmtT'),
         dict(t='style', n='金额 T1', e='#dAmt', ex=dict(fs='40px', lh='48px', fw='700')),
         dict(t='gap', n='金额→主按钮', a='#dAmt', b='#btn', ax='v', e=16), dict(t='pos', n='主按钮', e='#btn', k=['h', 'w'], ex=dict(h=56, w=294))]
    if doubled:
        a += [dict(t='gap', n='¥84→×2', a='#vWage', b='#x2', ax='h', e=4), dict(t='base', n='「×2」与工钱数值', a='#blW', b='#blX'),
              dict(t='style', n='「×2」T5', e='#x2', ex=dict(fs='12px', lh='16px', fw='700', c='rgb(122, 90, 64)')),
              dict(t='pad', n='卡片底(到主按钮，无广告按钮)', c='#card', k='#btn', sides=[2], e=[None, None, 24, None])]
    else:
        a += [dict(t='gap', n='主按钮→广告次按钮', a='#btn', b='#btn2', ax='v', e=16), dict(t='pos', n='广告次按钮', e='#btn2', k=['h', 'w'], ex=dict(h=48, w=294)),
              dict(t='gap', n='▶→字', a='#btn2 .play', b='#btn2T', ax='h', e=8), dict(t='center', n='▶+字 整组', e='#btn2 .play', cx=None),
              dict(t='pad', n='卡片底(到广告次按钮)', c='#card', k='#btn2', sides=[2], e=[None, None, 24, None])]
    return [x for x in a if not (x['t'] == 'center' and x.get('cx', 0) is None)]
for _d in (False, True):
    _fn, _si, _H, _T = settle_fn(_d); _g = _si['gift']
    _st = (f'② 单子结算 第 {_si["day"]} 天 {_si["oi"]["id"]}（赵姐 · {_ord(_si["oi"]["id"])["boardHint"]}）：工钱 {_si["base"]}×{_si["srcmult"]:g}（转介绍）= ¥{_si["oi"]["pay"]}'
           + (f' → 看广告 ×{DBL["multiplier"]} = ¥{_si["wage"]}（只翻工钱，打赏不翻）' if _d else '') + f'；剧本打赏 {_g["key"]}：{_g["label"]} ¥{_g["amount"]}（图标 {_g["icon"]}_24）；合计 +¥{_si["total"]}；'
           + f'第 {_si["pos"]}/{_si["pick"]} 单 → 主按钮「{_si["button"]}」；' + ('广告按钮去掉，卡片缩短 64 仍垂直居中' if _d else '次按钮「▶ 看广告 工钱翻倍」') + f'；无对比条（只第 4 单）；卡片 top {_T} 高 {_H}；遮罩 rgba(43,30,20,.6)')
    screen('hifi_v15_settle_gift' + ('_doubled' if _d else ''), _st, _fn, SETTLE_ANN(_H, _T, _d, len(quote_lines(_si['line']))))
# 参考图（不进 qa/pixel）：S4 用 shock 表情
REF = {}

TAILJS = '''(()=>{const S=window.STATE||'';const cn=document.querySelector('#coinNum');const m=S.match(/金币 (\\d+)/);if(m&&cn)chk(m[1]===cn.textContent.trim(),`状态说明「金币 ${m[1]}」= HUD ${cn.textContent.trim()}`);const pm=S.match(/本单 ¥(\\d+)/),vv=document.querySelector('.tg .vv');if(pm&&vv)chk('¥'+pm[1]===vv.textContent.trim(),`状态说明「本单 ¥${pm[1]}」= HUD ${vv.textContent.trim()}`);const tm=S.match(/通话中 (\\d\\d:\\d\\d)/),cs=document.querySelector('#cstat');if(tm&&cs)chk(cs.textContent.includes(tm[1]),`状态说明「通话中 ${tm[1]}」= 界面「${cs.textContent.trim()}」`);const pt=S.match(/耐心剩? ?(\\d)/),w=document.querySelector('[data-order]');if(pt&&w)chk(pt[1]===w.dataset.pat,`状态说明「耐心 ${pt[1]}」= HUD ${w.dataset.pat}`);const dm=S.match(/第 (\\d+) 天/),dd=document.querySelector('#dSubT,#sDay');if(dm&&dd)chk(dd.textContent.includes('第 '+dm[1]+' 天'),`状态说明「第 ${dm[1]} 天」= 界面「${dd.textContent}」`);const am=S.match(/今日收入 \\+¥(\\d+)/),at=document.querySelector('#dAmtT');if(am&&at){const sum=[...document.querySelectorAll('.kv2 .v')].reduce((a,e)=>a+parseInt(e.textContent.slice(1)),0);chk(at.textContent==='+¥'+am[1]&&sum===+am[1],`今日收入 ${at.textContent} = 明细合计 ¥${sum}`)}})();(()=>{const ps=document.querySelector('#proSlot'),cn=document.querySelector('#coinNum');if(!ps||!cn)return;const m=parseInt(cn.textContent),pr=+ps.dataset.price,st=ps.dataset.state;const exp=st==='bought'?'bought':(m>=pr?'ready':'locked');chk(st===exp,`第 4 格状态 ${st}（由金币 ${m} ${m>=pr?'≥':'<'} 价格 ${pr} 推导应为 ${exp}）`);if(st!=='bought'){const lb=Q('#proLabel').textContent,bd=Q('#lockBadge').classList.contains('rdy');const okl=st==='locked'?(lb==='¥'+pr+' 解锁'&&!bd):(lb==='点击解锁'&&bd);chk(okl,`第 4 格标签「${lb}」/ 角标 ${bd?'金色开锁':'黄铜锁'} 与状态 ${st} 一致`)}})();(()=>{const w=document.querySelector('[data-order]');if(!w)return;const pat=+w.dataset.pat,mx=+w.dataset.patmax;const segs=[...w.querySelectorAll('.pat i')];const on=segs.filter(i=>!i.classList.contains('lost')&&!i.classList.contains('lk')).length;const lk=segs.filter(i=>i.classList.contains('lk')).length;chk(on===pat&&lk===4-mx,`耐心 ${on} 格亮 / 锁 ${lk} 格（订单 ${w.dataset.order} 上限 ${mx}）`);const av=(w.querySelector('.av').style.backgroundImage.match(/avatar_[a-z_]+?_(p\\d|shock)@2x/)||[])[1];const pl=Math.max(1,Math.min(4,1+(mx-pat)));const ea=w.dataset.mood==='shock'?'shock':'p'+pl;chk(av===ea,`表情 ${av}（耐心掉 ${mx-pat} 格→${ea}${w.dataset.mood?'，剧本 mood '+w.dataset.mood:''}）`);const pay=Q('.tg .vv').textContent;chk(pay===w.dataset.pay,`本单 ${pay}（订单 ${w.dataset.order} 数据推导 ${w.dataset.pay}）`)})();ANN.filter(a=>a.t==='vc').forEach(a=>{const A=R(Q(a.a)),B=R(Q(a.b));const d=(A.t+A.b)/2-(B.t+B.b)/2;chk(Math.abs(d)<=0.5,`${a.n} 垂直居中（中心差 ${f(d)}）`)});(()=>{const c=document.querySelector('#card[data-wage0]');if(!c)return;const D=c.dataset,dm=+D.dm,w=(+D.wage0)*dm,gi=+D.gift;chk(+D.wage0===Math.round(+D.base*(+D.srcmult)),`工钱 ¥${D.wage0} = 底价 ${D.base} × 来源 ${D.srcmult}（economy.json）`);chk(Q('#vWage').textContent.trim()==='¥'+w,`工钱行 ${Q('#vWage').textContent.trim()} = ¥${D.wage0}×${dm}`);const x2=document.querySelector('#x2');chk((dm>1)===!!x2&&(!x2||x2.textContent.trim()==='×'+dm),`「×${dm}」标签${x2?'有':'无'}（翻倍 ${D.doubled}）`);const ad=document.querySelector('#btn2');chk((D.doubled==='1')!==!!ad,`广告次按钮${ad?'有':'无'}（翻倍后去掉）`);const gv=document.querySelector('#vGift');if(gv)chk(gv.textContent.trim()==='¥'+gi,`打赏行 ${gv.textContent.trim()} = economy.json scripted ¥${gi}（翻倍不变）`);const ic=document.querySelector('#gIcon');if(ic)chk(ic.getAttribute('src').endsWith('/'+D.icon+'_24@2x.png')&&+ic.dataset.nw===48,`打赏图标 ${D.icon}_24@2x（narrative.json icon；源图 ${ic.dataset.nw}px = 24×2，不缩放）`);chk(Q('#dAmtT').textContent==='+¥'+(w+gi)&&+D.total===w+gi,`合计 ${Q('#dAmtT').textContent} = 工钱 ¥${w} + 现金打赏 ¥${gi}`);chk(Q('#btn').textContent.trim()===D.button,`主按钮「${Q('#btn').textContent.trim()}」`)})();ANN.filter(a=>a.t==='base').forEach(a=>{const A=R(Q(a.a)),B=R(Q(a.b));chk(eqv(A.t,B.t),`${a.n} 基线 y ${f(A.t)} / ${f(B.t)}（应相同）`);if(SHOW)hseg(A.l-4,B.l+4,A.t,'基线 '+f(A.t))});ANN.filter(a=>a.t==='style').forEach(a=>{const c=getComputedStyle(Q(a.e));const v={fs:c.fontSize,lh:c.lineHeight,fw:c.fontWeight,c:c.color,num:c.fontVariantNumeric};const ok=Object.keys(a.ex).every(k=>v[k]===a.ex[k]);chk(ok,`${a.n} 字 ${v.fs}/${v.lh} 字重 ${v.fw} ${v.c} ${v.num}`)});ANN.filter(a=>a.t==='inset').forEach(a=>{const r=R(Q(a.e));const ir=a.fr-r.r,it=r.t-a.ft;chk(eqv(ir,a.ex)&&eqv(it,a.ex),`${a.n}：右 ${f(ir)} / 上 ${f(it)}（应 ${a.ex}；内沿实测 x ${a.fr}、y ${a.ft}；角标完全在格内，不压箱沿）`);if(SHOW){hseg(r.r,a.fr,r.t+12,f(ir));vseg(a.ft,r.t,r.l+12,f(it))}});ANN.filter(a=>a.t==='tail').length&&(()=>{const b=R(Q('.bb')),s=R(Q('.bb .tail'));const base=s.l+2-b.l,apex=s.t;chk(eqv(base,24)&&eqv(apex,152),`尖角：底边起点离气泡左边 ${f(base)}（应 24），宽 16，尖顶 y ${f(apex)}（贴客户卡底 152）`);if(SHOW){hseg(b.l,s.l+2,b.t-12,f(base))}})();'''
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
