# WCAG 对比度：在实际背景最亮处和纯白极限各算一遍（半透明层按浏览器 sRGB 叠加）
import json
from PIL import Image
from lib import *
def scene_png(name, **kw):
    import build  # noqa
from build import base
def render(name, body):
    open(f'_{name}.html', 'w').write(page(body, name)); shot(f'_{name}.html', f'/tmp/{name}.png'); return Image.open(f'/tmp/{name}.png').convert('RGB')
import re as _re
def strip_hud(h): return h.split('<div class="who">')[0]
def strip_lab(h): return _re.sub(r'<div id="proLabel"[^>]*>[^<]*</div>','',h)
S1 = render('cs_o1', strip_lab(strip_hud(base(False))))
S1d = render('cs_o1d', base(False, money=30, observed=True, hp=0, phone_on=False))  # 来电时暗层下面（含 HUD）
S3 = render('cs_o3', strip_lab(strip_hud(base(False, client='li_jie', money=103, pay='¥60', water=.6, clog='hard', hp=1, tools=('plunger', 'scoop', 'snake'), pro='ready'))))
def hx(c): c = c.lstrip('#'); return tuple(int(c[i:i + 2], 16) for i in (0, 2, 4))
def lum(c):
    f = lambda v: (v / 255 / 12.92) if v / 255 <= .04045 else ((v / 255 + .055) / 1.055) ** 2.4
    r, g, b = c; return .2126 * f(r) + .7152 * f(g) + .0722 * f(b)
def cr(a, b): la, lb = sorted([lum(a), lum(b)], reverse=True); return (la + .05) / (lb + .05)
def over(top, a, bg): return tuple(round(a * t + (1 - a) * b) for t, b in zip(top, bg))
def brightest(im, x, y, w, h):
    px = im.crop((x * 2, y * 2, (x + w) * 2, (y + h) * 2)).getdata(); return max(px, key=lum)
def darkest(im, x, y, w, h):
    px = im.crop((x * 2, y * 2, (x + w) * 2, (y + h) * 2)).getdata(); return min(px, key=lum)
C = (hx('#302014'), .75)            # 方案 C 暗底
MASK = (hx('#2B1E14'), .6); DIM = (hx('#241810'), .8)
rows = []
def row(name, fg, layers, im=None, rect=None, fg_alpha=None, nontext=False, opaque=False):
    res = {}
    for k, bg0 in ([('实际最亮处', brightest(im, *rect))] if im else []) + ([] if opaque else [('纯白极限', (255, 255, 255))]):
        bg = bg0; f = fg
        for col, a in layers: bg = over(col, a, bg)
        if fg_alpha: f = over(fg, fg_alpha, over(*DIM, bg0))  # 旧气泡整体半透明：字也半透明
        res[k] = round(cr(f, bg), 2)
    need = 3 if nontext else 4.5
    rows.append(dict(item=name, need=need, **res, ok=all(v >= need for v in res.values())))
W = hx('#FFFFFF')
row('操作提示 白字 / 方案C暗底（提示位 16,160）', W, [C], S1, (16, 160, 208, 48))
row('操作提示 白字 / 暗底+遮罩（孔下方 91,320）', W, [MASK, C], S1, (91, 320, 208, 48))
row('「¥100 解锁」#FFE27A / 工具箱面板（不透明木箱，取字下最亮像素）', hx('#FFE27A'), [], S1, (230, 734, 64, 16), opaque=True)
row('「点击解锁」#FFFFFF / 工具箱面板（o3 可解锁态）', W, [], S3, (230, 734, 64, 16), opaque=True)
for n, bgc in [('平静', '#FFF8EC'), ('着急', '#FFF1D0'), ('慌', '#FFEBE4'), ('满意', '#EDF7E6')]:
    row(f'头像气泡「{n}」#5A4030 / {bgc}', hx('#5A4030'), [(hx(bgc), 1)])
row('任务卡 标题 #5A4030 / #FFF8EC', hx('#5A4030'), [(hx('#FFF8EC'), 1)])
row('任务卡 分隔「·」#7A5A40 / #FFF8EC', hx('#7A5A40'), [(hx('#FFF8EC'), 1)])
row('任务卡 工钱 ¥30 #A35A08 / #FFF8EC', hx('#A35A08'), [(hx('#FFF8EC'), 1)])
row('主按钮字 #5A4030 / 金底最深处 #FFC83D', hx('#5A4030'), [(hx('#FFC83D'), 1)])
row('来电 姓名 白字 / 压暗 .8', W, [DIM], S1d, (175, 256, 40, 28))
row('来电 状态 #E9D9C0 / 压暗 .8', hx('#E9D9C0'), [DIM], S1d, (150, 292, 90, 20))
row('标签条「工钱」#E9D9C0 / 暗底+压暗', hx('#E9D9C0'), [DIM, C], S1d, (130, 328, 130, 32))
row('标签条 ¥68 #FFD45E / 暗底+压暗', hx('#FFD45E'), [DIM, C], S1d, (130, 328, 130, 32))
row('未接来电 #FFA898 / 压暗 .8', hx('#FFA898'), [DIM], S1d, (150, 292, 90, 20))
row('加急块 白字 / #C8372F', W, [(hx('#C8372F'), 1)])
row('对方气泡 #5A4030 / #FFF8EC', hx('#5A4030'), [(hx('#FFF8EC'), 1)])
row('主角气泡 #5A4030 / #FFE89A', hx('#5A4030'), [(hx('#FFE89A'), 1)])
row('旧气泡（整体 .7）#5A4030 / #FFF8EC', hx('#5A4030'), [DIM, (hx('#FFF8EC'), .7)], S1d, (24, 392, 192, 72), fg_alpha=.7)
row('接听图标 白 / 绿底中段 #46A24E（非文字 3:1）', W, [(hx('#46A24E'), 1)], nontext=True)
row('锁图标 #4E2E0C / 黄铜最深处 #B97828（非文字 3:1）', hx('#4E2E0C'), [(hx('#B97828'), 1)], nontext=True)
row('开锁图标 #4E2E0C / 金色最深处 #E0A21C（非文字 3:1）', hx('#4E2E0C'), [(hx('#E0A21C'), 1)], nontext=True)
row('角标描边 #5A4030 / 格内木板（非文字 3:1）', hx('#5A4030'), [], S1, (262, 644, 24, 24), nontext=True, opaque=True)
DE = Image.open('hifi/hifi_v15_day_end.png').convert('RGB'); ST = Image.open('hifi/hifi_v15_settings.png').convert('RGB')
def solid(name, fg, im, rect, nontext=False):
    bg = darkest(im, *rect); rows.append(dict(item=name + f'（实测底 #{bg[0]:02X}{bg[1]:02X}{bg[2]:02X}，取区域最暗像素）', need=3 if nontext else 4.5, 实测最暗处=round(cr(fg, bg), 2), ok=cr(fg, bg) >= (3 if nontext else 4.5)))
solid('结算页 副标题「第 3 天」#7A5A40 / 卡片', hx('#7A5A40'), DE, (60, 230, 64, 16))
solid('结算页 标题「收工」#5A4030 / 卡片', hx('#5A4030'), DE, (60, 210, 64, 16))
solid('结算页 明细 #5A4030 / 卡片', hx('#5A4030'), DE, (230, 286, 40, 20))
solid('结算页「今日收入」「余额」#7A5A40 / 卡片', hx('#7A5A40'), DE, (60, 406, 64, 16))
solid('结算页 金额描边 #8A5A00 / 卡片（T1 金字靠描边成形，非文字 3:1 之外另算 4.5）', hx('#8A5A00'), DE, (60, 426, 64, 40))
solid('设置面板「第 3 天」#7A5A40 / 面板', hx('#7A5A40'), ST, (230, 204, 56, 16))
solid('设置面板 说明 #7A5A40 / 面板', hx('#7A5A40'), ST, (36, 548, 40, 16))
_T = brightest(Image.open('hifi/hifi_v15_s1_bubble_calm.png').convert('RGB'), 34, 752, 36, 10); rows.append(dict(item=f'工具箱「皮搋子」描边 #5A4030 / 箱体纸标签（字下方纸签最亮像素 #{_T[0]:02X}{_T[1]:02X}{_T[2]:02X}）', need=3, 实际最亮处=round(cr(hx('#5A4030'), _T), 2), ok=cr(hx('#5A4030'), _T) >= 3))
rows.append(dict(item='工具名 #FFF3D8 / 3px #5A4030 描边（字和描边本身）', need=4.5, 纯色=round(cr(hx('#FFF3D8'), hx('#5A4030')), 2), ok=True))
rows.append(dict(item='（对照）游戏现用设置面板底 #FFF8EB 上 #7A5A40', need=4.5, 纯色=round(cr(hx('#7A5A40'), hx('#FFF8EB')), 2), ok=cr(hx('#7A5A40'), hx('#FFF8EB')) >= 4.5))
for r in rows: print('✔' if r['ok'] else '✘', r['item'], {k: v for k, v in r.items() if k in ('实际最亮处', '纯白极限', '实测最暗处', '纯色')})
json.dump(rows, open('hifi/contrast.json', 'w'), ensure_ascii=False, indent=1)
