# v1.5 开局 UI 高保真生成库（游戏UI）。所有坐标 1x 逻辑像素，画布 390×780，导出 2x。
import json, os, subprocess
from icons14 import COIN, GEARM
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../..'))
A = '../../../../assets/'            # 相对 design/ui/hifi/v15/*.html
MAN = json.load(open(ROOT + '/assets/manifest_art.json'))
LAY = {}
from PIL import Image as _I
for l in MAN['layers']:
    if not l.get('file'): continue
    n = l.get('name') or l['file'].split('/')[-1].replace('@2x.png', '')
    l = dict(l); l.setdefault('pixel_size', list(_I.open(ROOT + '/' + l['file']).size)); LAY[n] = l

def L(name, x=None, y=None, s=1.0, a=1.0, w=None, h=None, extra=''):
    l = LAY[name]; pw, ph = l['pixel_size']; w = w or pw / 2 * s; h = h or ph / 2 * s
    p = l.get('placement_1x', {'x': 0, 'y': 0}); x = p['x'] if x is None else x; y = p['y'] if y is None else y
    dx, dy = x, y
    if l['anchor'] == 'center': dx, dy = x - w / 2, y - h / 2
    elif l['anchor'] == 'bottom-center': dx, dy = x - w / 2, y - h
    op = f'opacity:{a};' if a != 1 else ''
    return f'<img class="L" src="{A}{l["file"].split("assets/")[1]}" style="left:{dx:.2f}px;top:{dy:.2f}px;width:{w:.2f}px;height:{h:.2f}px;{op}{extra}">'

def img(src, x, y, w, h, extra='', cls='L'):
    return f'<img class="{cls}" src="{A}{src}" style="left:{x:.2f}px;top:{y:.2f}px;width:{w:.2f}px;height:{h:.2f}px;{extra}">'

# —— 场景（按 src/art.js 的画法复刻：水位、纸团、桶）——
def scene(client='wang_ayi', water=0.5, observed=False, clog='soft', hp=3, hpmax=3):
    o = [L('bg_bathroom_base')]
    if client == 'wang_ayi': o += [L('home_wang_windowsill'), L('home_wang_washboard')]
    o += [L('toilet_tank'), L('toilet_flushbtn_idle'), L('toilet_lid_up')]
    if client == 'wang_ayi': o.append(L('home_wang_seatcover'))
    o.append(L('scene_bucket_water' if water > .82 else 'scene_bucket_empty'))
    o += [L('toilet_bowl'), L('toilet_bowl_inner')]
    if water < .8: o.append(L('water_waterline_mark'))
    if water >= .8: o.append(L('water_surface_full'))
    else:
        s = .55 + .6 * water; o.append(L('water_surface_normal', x=195.2, y=517.5 - (water - .5) * 16, s=s))
    if clog == 'soft' and hp > 0 and observed: o.append(L('clog_paper', a=round(.35 + .6 * hp / hpmax, 3), y=495.5 + (-6 if water >= .8 else 4)))
    if clog == 'hard' and hp > 0: o.append(L('clog_duck_silhouette', a=.55 if observed else .25))
    return '\n'.join(o)

# —— 工具箱（ui-spec 工具箱托盘 + art.js TB）——
PRO_DX = 6  # 第 4 格预览工具锚点左移 6，让手柄（右沿 267.2→261.2）避开角标（左沿 262.5）
FRAME4 = dict(r=290.5, t=640.5)  # 第 4 格木框内沿（实测 2x 渲染：右内沿 x 581/2，上内沿 y 1281/2）
TB = dict(x=16, y=636, w=288, h=128, slots=[56, 125, 192, 262], slotTop=640, slotBot=721)
TOOLIMG = {'plunger': ('tools/tool_plunger_old@2x.png', 112, 223), 'scoop': ('tools/tool_scoop@2x.png', 120, 101),
           'snake': ('tools/tool_snake@2x.png', 128, 140)}
TOOLNAME = {'plunger': '皮搋子', 'scoop': '水瓢', 'snake': '疏通器'}
# 锁形图标：深棕 #4E2E0C，锁眼镂空透出黄铜底（和美术挂锁同一套：黄铜锁体 + 深色锁眼）
def _lock(open_):
    sh = 'M8 11V8.5a4 4 0 0 1 7.6-1.8' if open_ else 'M8 11V8.5a4 4 0 0 1 8 0V11'
    mid = 'lku' if open_ else 'lkl'
    return (f'<svg viewBox="0 0 24 24"><defs><mask id="{mid}"><rect width="24" height="24" fill="#fff"/><circle cx="12" cy="14.6" r="1.7" fill="#000"/>'
            f'<path d="M12 15.4v2.2" stroke="#000" stroke-width="1.7" stroke-linecap="round"/></mask></defs>'
            f'<path d="{sh}" fill="none" stroke="#4E2E0C" stroke-width="2.4" stroke-linecap="round"/>'
            f'<rect x="5.5" y="10.5" width="13" height="9.5" rx="2.5" fill="#4E2E0C" mask="url(#{mid})"/></svg>')
LOCK = _lock(False)
UNLOCK = _lock(True)
PHONE = '''<svg viewBox="0 0 24 24"><path fill="#FFFFFF" d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>'''

def tool_in_slot(src, pw, ph, x, extra=''):
    sc = min(72 / (ph / 2), 64 / (pw / 2), 1); w = pw / 2 * sc; h = ph / 2 * sc
    return img(src, x - w / 2, TB['slotBot'] - 2 - h, w, h, extra)

def toolbox(tools, pro='locked', re=False):
    """tools: 本单可用工具；pro: 'locked' | 'ready' —— 第 4 格专业皮搋子预览"""
    o = [L('ui_toolbox_lid_lv1', x=TB['x'] + (TB['w'] - 270) / 2, y=TB['y'] - 14), L('ui_toolbox_body_lv1', x=TB['x'], y=TB['y'], w=TB['w'], h=TB['h'])]
    cy = (TB['slotTop'] + TB['slotBot']) / 2
    for i, tid in enumerate(['plunger', 'scoop', 'snake']):
        x = TB['slots'][i]
        if tid in tools:
            s, pw, ph = TOOLIMG[tid]; o.append(tool_in_slot(s, pw, ph, x)); o.append(f'<div class="tbn" style="left:{x-32}px">{TOOLNAME[tid]}</div>')
        else:
            o.append(L('ui_toolbox_lockplate', x=x, y=cy))  # 群里定：木牌只留挂锁，下方不写字（到时候送）
    x = TB['slots'][3]
    src = 'ui/v15/tool_plunger_pro_locked@2x.png' if pro == 'locked' else 'tools/tool_plunger_pro@2x.png'
    o.append(f'<div id="proSlot" class="G" style="position:absolute;left:{x-32}px;top:640px;width:64px;height:80px"></div>')
    o.append(tool_in_slot(src, 108, 234, x - PRO_DX, f'opacity:{.6 if pro=="locked" else .85}'))
    badge = 'badge_lock' if pro == 'locked' else 'badge_unlock'
    inner = LOCK if pro == 'locked' else UNLOCK
    BX, BY = FRAME4['r'] - 4 - 24, FRAME4['t'] + 4
    if re: o.append(img(f'ui/v15/{badge}@2x.png', BX - 8, BY - 8, 40, 40, cls='L'))
    o.append(f'<div id="lockBadge" class="bdg G {"rdy" if pro!="locked" else ""} {"re" if re else ""}" style="left:{BX}px;top:{BY}px">{"" if re else inner}</div>')
    o.append(f'<div id="proLabel" class="tbn pro {"rdy" if pro!="locked" else ""}" style="left:{x-32}px">{"¥100 解锁" if pro=="locked" else "点击解锁"}</div>')
    return '\n'.join(o)

def phone(notify=False, rot=-10, extra=''):
    f = 'ui/phone_floor_notify@2x.png' if notify else 'ui/phone_floor_idle@2x.png'
    return f'<img class="L" id="phone" src="{A}{f}" style="left:310px;top:652px;width:64px;height:96px;transform:rotate({rot}deg);{extra}">'

def laoqian(a=.55):
    return f'<img class="L" src="{A}ui/btn_laoqian@2x.png" style="left:314px;top:560px;width:56px;height:56px;opacity:{a}">'

# —— HUD 方案 C（v1.4 定稿）——
def hud(client='wang_ayi', p=1, pat=4, patmax=4, money=0, pay='¥30', re=False):
    segs = ''
    for i in range(4):
        cls = 'lk' if i >= patmax else ('lost' if i >= pat else '')
        segs += f'<i class="{cls}"></i>'
    av = f'{A}characters/avatar_{client}_p{p}@2x.png'
    if not re:
        return f'''<div class="who"><div class="av" style="background-image:url({av})"></div><div class="pat">{segs}</div></div>
<div class="cc"><div class="coin">{COIN}</div><span class="num" id="coinNum">{money}</span></div>
<div class="tg"><span class="lb">本单</span><span class="vv">{pay}</span></div>
<div class="gr">{GEARM()}</div>'''
    V = A + 'ui/v14/'
    return f'''<img class="L" src="{V}hud_card_c@2x.png" style="left:4px;top:36px;width:104px;height:128px">
<div class="who re"><div class="av" style="background-image:url({av});box-shadow:none"></div><img class="L" src="{V}hud_avatar_ring_c@2x.png" style="left:6px;top:6px;width:64px;height:64px"><div class="pat">{segs}</div></div>
<img class="L" src="{V}hud_capsule_c@2x.png" style="left:202px;top:36px;width:184px;height:72px">
<div class="cc re"><img src="{V}icon_coin_32@2x.png" style="width:32px;height:32px;display:block"><span class="num" id="coinNum">{money}</span></div>
<img class="L" src="{V}hud_tag_c@2x.png" style="left:202px;top:92px;width:128px;height:72px">
<div class="tg re"><span class="lb" style="background:none;position:relative"><img src="{V}hud_chip_c@2x.png" style="position:absolute;left:0;top:0;width:32px;height:24px"><b style="position:relative">本单</b></span><span class="vv">{pay}</span></div>
<img class="L" src="{V}hud_round_c_normal@2x.png" style="left:314px;top:92px;width:72px;height:72px">
<div class="gr re"><img src="{V}icon_gear_c_24@2x.png" style="width:24px;height:24px;display:block"></div>'''

CSS = open(os.path.join(os.path.dirname(__file__), 'v15.css')).read()

def page(body, title='v15', js=''):
    wrap = open(os.path.join(os.path.dirname(__file__), 'wrap.js')).read()
    return f'<!DOCTYPE html><html lang="zh-CN"><head><meta charset="utf-8"><title>{title}</title><style>{CSS}</style></head><body><div id="stage">{body}</div><script>{wrap}</script><script>{js}</script></body></html>'

CHROME = ['google-chrome', '--headless', '--no-sandbox', '--hide-scrollbars', '--force-device-scale-factor=2', '--window-size=390,780', '--virtual-time-budget=3000']
def shot(html, png, transparent=False, size=(390, 780)):
    cmd = CHROME[:] ; cmd[5] = f'--window-size={size[0]},{size[1]}'
    if transparent: cmd.append('--default-background-color=00000000')
    subprocess.run(cmd + [f'--screenshot={png}', 'file://' + os.path.abspath(html)], capture_output=True, timeout=120)
def dom(html):
    r = subprocess.run(CHROME + ['--dump-dom', 'file://' + os.path.abspath(html)], capture_output=True, timeout=120, text=True)
    return r.stdout
