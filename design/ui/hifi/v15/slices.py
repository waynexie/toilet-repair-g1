# 导出 assets/ui/v15 切图 + slices.json（2x 透明 PNG）
import json
from PIL import Image
from comp import *
OUT = ROOT + '/assets/ui/v15/'
items = []  # name, box(w,h), margin, html(body positioned relative to box), nine(2x) or None, states note
def add(name, w, h, m, html, nine=None, mt=None, note=''):
    items.append(dict(name=name, w=w, h=h, m=m, html=html, nine=nine, mt=mt if mt is not None else m, note=note))
for st in ['calm', 'urge', 'panic', 'happy']:
    add(f'bubble_{st}', 216, 104, 12, f'<div class="bb {STYLE[st]}" style="left:12px;top:20px;width:192px;height:72px">{TAIL}</div>', NS['bubble']['slice'], 20, '头像气泡底（含尖角）')
add('call_bubble_caller', 120, 72, 12, '<div class="cb caller" style="left:12px;top:12px;width:96px;height:48px"></div>', NS['cb']['slice'], note='通话-对方气泡')
add('call_bubble_hero', 120, 72, 12, '<div class="cb hero" style="left:auto;right:12px;top:12px;width:96px;height:48px"></div>', NS['cb']['slice'], note='通话-主角气泡')
add('card_popup', 272, 232, 36, '<div class="card" style="left:36px;right:auto;top:36px;width:200px;height:160px"></div>', NS['card']['slice'], note='任务卡/订单卡底')
for st in ['normal', 'pressed', 'disabled']:
    cls = {'normal': '', 'pressed': 'pressed', 'disabled': 'disabled'}[st]
    add(f'btn_primary_{st}', 152, 88, 16, f'<div class="btn L {cls}" style="left:16px;top:16px;width:120px"></div>', NS['btn']['slice'], note='主按钮 56（按下态已含下移 2px）')
for st in ['normal', 'pressed', 'disabled']:
    cls = {'normal': '', 'pressed': 'pressed', 'disabled': 'disabled'}[st]
    add(f'btn_answer_{st}', 104, 104, 16, f'<div class="ans {cls}" style="left:16px;top:16px"></div>', None, note='接听按钮 72（不含图标；按下态已含下移 2px）')
add('icon_phone_32', 32, 32, 0, f'<div style="position:absolute;left:0;top:0;width:32px;height:32px">{PHONE}</div>')
add('icon_phone_32_disabled', 32, 32, 0, f'<div style="position:absolute;left:0;top:0;width:32px;height:32px;opacity:.45">{PHONE}</div>')
add('icon_coin_40', 40, 40, 0, f'<div class="coinbig" style="left:0;top:0">{COIN}</div>')
add('badge_lock', 40, 40, 8, f'<div class="bdg" style="left:8px;top:8px">{LOCK}</div>', note='锁定角标 24：实底黄铜渐变 135° #F7C673→#E3A040(55%)→#B97828，2px #5A4030 描边，锁 #4E2E0C（锁孔镂空）；放第 4 格木框内沿右上内缩 4，1x 左上 (262.5,644.5)，切图带 8 外边距所以贴图左上 (254.5,636.5)')
add('badge_unlock', 40, 40, 8, f'<div class="bdg rdy" style="left:8px;top:8px">{UNLOCK}</div>', note='可解锁角标 24：金色渐变 #FFF0A8→#FFD45E(55%)→#E0A21C，2px #5A4030 描边，开锁 #4E2E0C；位置同 badge_lock，每 2400ms 上跳 4px')
# 排版到一张大图
x = y = 8; rowh = 0; W = 1000
for it in items:
    if x + it['w'] > W: x = 8; y += rowh + 8; rowh = 0
    it['x'], it['y'] = x, y; x += it['w'] + 8; rowh = max(rowh, it['h'])
H = y + rowh + 8
body = ''.join(f'<div style="position:absolute;left:{it["x"]}px;top:{it["y"]}px;width:{it["w"]}px;height:{it["h"]}px">{it["html"]}</div>' for it in items)
html = page(body).replace('html,body{width:390px;height:780px', f'html,body{{width:{W}px;height:{H}px').replace('#stage{position:relative;width:390px;height:780px', f'#stage{{position:relative;width:{W}px;height:{H}px')
open('_sheet.html', 'w').write(html)
shot('_sheet.html', '/tmp/v15_sheet.png', transparent=True, size=(W, H))
sh = Image.open('/tmp/v15_sheet.png').convert('RGBA')
J = {'scale': 2, 'note': '数值都是 2x 像素。margin_2x 是投影外扩（bubble_* 上边额外含 8px 尖角，所以写 margin_top_2x）：组件 1x 位置为 (x,y,w,h) 时，贴图区域是 (x-ml, y-mt, w+ml+mr, h+mt+mb)，ml 等 = margin_2x/2。nine_slice_2x 是九宫格四边不拉伸的宽度。文字、波形、呼吸光、遮罩、挖孔、耐心条由代码画，样式见 ui-spec「开局 v1.5」及下方 code_drawn。', 'slices': {}}
for it in items:
    im = sh.crop((it['x'] * 2, it['y'] * 2, (it['x'] + it['w']) * 2, (it['y'] + it['h']) * 2)); im.save(OUT + it['name'] + '@2x.png')
    e = {'file': f'assets/ui/v15/{it["name"]}@2x.png', 'size_2x': [it['w'] * 2, it['h'] * 2], 'margin_2x': it['m'] * 2}
    if it['mt'] != it['m']: e['margin_top_2x'] = it['mt'] * 2
    if it['nine']: t, r, b, l = it['nine']; e['nine_slice_2x'] = {'left': l, 'top': t, 'right': r, 'bottom': b}
    if it['note']: e['note'] = it['note']
    J['slices'][it['name']] = e
J['slices']['tool_plunger_pro_locked'] = {'file': 'assets/ui/v15/tool_plunger_pro_locked@2x.png', 'size_2x': [108, 234], 'margin_2x': 0, 'note': '专业皮搋子灰度版（Rec.709 亮度），锁定态再乘 opacity .6；锚点、缩放同 tool_plunger_pro（bottom-center，格内最大 64×72）。小游戏 Canvas 不支持 filter，所以出图不用代码去色。'}
J['reuse_v14'] = {'hud_tag_c': '操作提示底（radius 16）和来电标签条（高 32）直接用 assets/ui/v14/hud_tag_c@2x.png 九宫格，margin 24、四边 56。',
                  'hud_*': 'HUD 四件照 v14 不变。'}
J['code_drawn'] = {
 'day_subtitle': {'text': 'dayDisplay.settlement.format → 「第 {n} 天」', 'font': '400 12px/16px，等宽数字', 'color': '#7A5A40', 'pos': '结算卡「收工」(T2 20/28 Bold) 下方 4，水平居中；下一块（虚线）从副标题下沿隔 16', 'anim': '无，随卡片一起出现'},
 'settings_day': {'text': 'dayDisplay.settingsPanel.format', 'font': '400 12px/16px，等宽数字', 'color': '#7A5A40', 'pos': '设置标题行（高 28）右端，右边距卡片内沿 24（= 卡片右沿 −24），与「设置」T2 基线对齐；Canvas 用 textBaseline=alphabetic，两者基线 y 222.5（卡片顶 176 +24 +22.5，DOM 实测），右对齐 x 342'},
 'dash_line': {'h': 2, 'dash': [6, 4], 'color': '#E6D6BC'},
 'switch': {'size_1x': [48, 28], 'on': '#5DBB63', 'off': '#D8C8AD', 'stroke': '2px #5A4030', 'knob': '20 白，内缩 2', 'disabled': '整行 opacity .45'},
 'avatar_bubble': {'pos_1x': [16, 160], 'padding_1x': [12, 16, 12, 16], 'font': '700 16px/24px Noto Sans CJK SC', 'color': '#5A4030', 'text_max_w': 160, 'text_max_w_fallback': 176, 'max_lines': 2,
   'tail': {'base_left_from_bubble_left': 24, 'base_w': 16, 'h': 8, 'apex_abs': [48, 152]},
   'styles': {'calm': {'bg': '#FFF8EC', 'stroke': '#5A4030'}, 'urge': {'bg': '#FFF1D0', 'stroke': '#C77F0A'}, 'panic': {'bg': '#FFEBE4', 'stroke': '#C8372F'}, 'happy': {'bg': '#EDF7E6', 'stroke': '#3F9946'}},
   'style_rule': 'key in {thanks,done,progress_hit} → happy；否则按 mood：p1/p2 → calm，p3 → urge，p4/shock → panic',
   'in': {'ms': 240, 'scale': [0.6, 1.04, 1], 'easing': 'cubic-bezier(.2,.8,.2,1) 160ms + ease-out 80ms', 'opacity_ms': 120, 'origin_abs': [48, 152]},
   'out': {'ms': 160, 'scale_to': 0.9, 'easing': 'ease-in'}},
 'hint': {'slot_1x': [16, 160], 'padding_1x': [12, 16, 12, 16], 'font': '700 16px/24px', 'color': '#FFFFFF', 'text_max_w': 208, 'base': 'v14 hud_tag_c 九宫格', 'in': 'opacity 0→1 + translateY 4→0，160ms ease-out', 'out': 'opacity 120ms ease-in'},
 'mask': {'color': 'rgba(43,30,20,.6)', 'edge': '孔外沿向外：2px #5A4030 + 4px #FFF3DA + 2px #5A4030（共 8）', 'flush_hole': {'circle': [195, 240, 32]}, 'in': 'opacity 240ms ease-out；孔半径 96→32，320ms cubic-bezier(.2,.8,.2,1)', 'out': '160ms，孔 32→96 同时淡出'},
 'tap_hand': {'size_1x': [40, 48], 'offset_from_target_center': {'flush(r32)': [16, 16], 'answer(r36)': [24, 24]}},
 'coin_drop': {'coin_1x': 40, 'rest_box_1x': [232, 216, 40, 40], 'hit_1x': [224, 208, 56, 56], 'halo_1x': [216, 200, 72, 72], 'label': '无常驻金额牌（会压窗台盆栽/肥皂碟）；点中时飘字「+¥30」T3 Bold #FFD45E + 2px #5A4030 描边，从金币中心上方 8 起上浮 16，480ms ease-out 淡出'},
 'call': {'dim': 'rgba(36,24,16,.8)', 'avatar_96_1x': [147, 144], 'wave': {'bars': 21, 'w': 4, 'gap': 4, 'radius': 2, 'h_range': [4, 32], 'box_1x': [113, 328, 164, 40], 'caller': '#FFD45E', 'hero': '#E9D9C0 ×0.6 幅度', 'idle': '全部 4，opacity .5'},
   'typewriter': {'char_ms': 60, 'punct_extra_ms': 120, 'hold_ms': 1600, 'bubble_in_ms': 160, 'button_after_last_ms': 400, 'total_ms_no_tap': 12040}},
}
json.dump(J, open(OUT + 'slices.json', 'w'), ensure_ascii=False, indent=1)
print(len(items), 'slices', W, H)
