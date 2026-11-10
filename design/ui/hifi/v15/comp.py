from lib import *
V15 = A + 'ui/v15/'
V14 = A + 'ui/v14/'
STYLE = {'calm': 'm-calm', 'urge': 'm-urge', 'panic': 'm-panic', 'happy': 'm-happy'}
# 九宫格（1x）：slice 2x 四边 / 外扩 1x
NS = {
 'bubble': dict(slice=(72, 56, 56, 104), width=(36, 28, 28, 52), out=(20, 12, 12, 12)),
 'cb':     dict(slice=(56, 56, 56, 56), width=(28, 28, 28, 28), out=(12, 12, 12, 12)),
 'tag':    dict(slice=(56, 56, 56, 56), width=(28, 28, 28, 28), out=(12, 12, 12, 12)),   # v14 hud_tag_c
 'chip24': dict(slice=(48, 48, 48, 48), width=(24, 24, 24, 24), out=(12, 12, 12, 12)),
 'card':   dict(slice=(120, 120, 120, 120), width=(60, 60, 60, 60), out=(36, 36, 36, 36)),
 'btn':    dict(slice=(64, 64, 64, 64), width=(32, 32, 32, 32), out=(16, 16, 16, 16)),
}
def bimg(kind, url):
    n = NS[kind]; s = ' '.join(map(str, n['slice'])); w = ' '.join(f'{v}px' for v in n['width']); o = ' '.join(f'{v}px' for v in n['out'])
    return f'border-image:url({url}) {s} fill / {w} / {o};'
TAIL = '<svg class="tail" viewBox="0 0 20 12"><path d="M2 9 L10 1 L18 9" style="fill:var(--bg);stroke:var(--bd)" stroke-width="2" stroke-linejoin="round"/><rect x="3.4" y="7.9" width="13.2" height="2.6" style="fill:var(--bg)"/></svg>'

def bubble(text, style='calm', re=False, idx=''):
    st = bimg('bubble', f'{V15}bubble_{style}@2x.png') if re else ''
    return f'<div class="bb {STYLE[style]} {"re" if re else ""}" id="bb{idx}" style="{st}">{TAIL}<div class="tx" data-text="{text}" data-maxw="160"></div></div>'

def hint(text, left=16, top=160, re=False, idd='hint', center=None):
    st = bimg('tag', f'{V14}hud_tag_c@2x.png') if re else ''
    c = f' data-cx="{center}"' if center is not None else ''
    return f'<div class="ht {"re" if re else ""}" id="{idd}"{c} style="left:{left}px;top:{top}px;{st}"><div class="tx" data-text="{text}" data-maxw="208"></div></div>'

def mask(holes):
    """holes: [('c',cx,cy,r)] 或 [('r',x,y,w,h,rad)]；遮罩 rgba(43,30,20,.6)；边沿 2 暖棕 + 4 奶油 + 2 暖棕（向外）"""
    cut = ''; ring = ''
    for h in holes:
        if h[0] == 'c':
            _, cx, cy, r = h; cut += f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="#000"/>'
            ring += f'<circle cx="{cx}" cy="{cy}" r="{r+4}" fill="none" stroke="#5A4030" stroke-width="8"/><circle cx="{cx}" cy="{cy}" r="{r+4}" fill="none" stroke="#FFF3DA" stroke-width="4"/>'
        else:
            _, x, y, w, hh, rad = h; cut += f'<rect x="{x}" y="{y}" width="{w}" height="{hh}" rx="{rad}" fill="#000"/>'
            ring += f'<rect x="{x-4}" y="{y-4}" width="{w+8}" height="{hh+8}" rx="{rad+4}" fill="none" stroke="#5A4030" stroke-width="8"/><rect x="{x-4}" y="{y-4}" width="{w+8}" height="{hh+8}" rx="{rad+4}" fill="none" stroke="#FFF3DA" stroke-width="4"/>'
    return f'<svg class="mask" id="mask" viewBox="0 0 390 780"><defs><mask id="hm"><rect width="390" height="780" fill="#fff"/>{cut}</mask></defs><rect width="390" height="780" fill="rgba(43,30,20,.6)" mask="url(#hm)"/>{ring}</svg>'

def hand(x, y, tap=False):
    return img('ui/ui_guide_hand_tap@2x.png' if tap else 'ui/ui_guide_hand@2x.png', x, y, 40, 48, cls='L hand')

def ring_pulse(cx, cy, d, a, gold=False):
    f = 'ui/ui_guide_ring_gold@2x.png' if gold else 'ui/ui_guide_ring@2x.png'
    return img(f, cx - d / 2, cy - d / 2, d, d, f'opacity:{a}')

def btn(label, left, top, width, state='normal', re=False, idd='btn'):
    st = bimg('btn', f'{V15}btn_primary_{state}@2x.png') if re else ''
    cls = {'normal': '', 'pressed': 'pressed', 'disabled': 'disabled'}[state]
    if re: cls = 're'
    col = 'color:#A8957E;' if (re and state == 'disabled') else ''
    return f'<div class="btn {cls} L" id="{idd}" style="left:{left}px;top:{top}px;width:{width}px;{st}{col}">{label}</div>'

def card(inner, top, height, re=False, idd='card'):
    st = bimg('card', f'{V15}card_popup@2x.png') if re else ''
    return f'<div class="card {"re" if re else ""}" id="{idd}" style="top:{top}px;height:{height}px;{st}">{inner}</div>'

def coin40(x, y, re=False):
    return img('ui/v15/icon_coin_40@2x.png', x, y, 40, 40, cls='L coinbig')  # 切图即源，高保真直接用

def chip24(text, cx, top, re=False):
    st = bimg('tag', f'{V14}hud_tag_c@2x.png') if re else ''
    return f'<div class="chip24 {"re" if re else ""}" id="chip" data-cx="{cx}" style="top:{top}px;{st}">{text}</div>'

def answer(state='normal', re=False):
    if re:
        sh = 2 if state == 'pressed' else 0
        return img(f'ui/v15/btn_answer_{state}@2x.png', 159 - 16, 536 - 16, 104, 104) + \
            img(f'ui/v15/icon_phone_32{"_disabled" if state=="disabled" else ""}@2x.png', 179, 556 + sh, 32, 32, cls='L') + '<div id="ans" class="L" style="left:159px;top:536px;width:72px;height:72px"></div>'
    cls = {'normal': '', 'pressed': 'pressed', 'disabled': 'disabled'}[state]
    return f'<div class="ans {cls}" id="ans">{PHONE}</div>'

def pill(re=False):
    st = bimg('tag', f'{V14}hud_tag_c@2x.png') if re else ''
    return f'<div class="pill {"re" if re else ""}" id="pill" data-cx="195" style="{st}"><span class="urg" id="urg">加急 ×1.5</span><span class="plab" id="plab">工钱</span><span class="pval" id="pval">¥68</span></div>'

def callbubble(text, who, shown=None, old=False, re=False, idx=0):
    st = bimg('cb', f'{V15}call_bubble_{who}@2x.png') if re else ''
    sh = f' data-shown="{shown}"' if shown is not None else ''
    return f'<div class="cb {who} {"old" if old else ""} {"re" if re else ""}" id="cb{idx}" style="{st}"><div class="tx" data-text="{text}" data-maxw="160"{sh}></div></div>'

def wave(kind='caller', idle=False, seed=3):
    import math, random
    rnd = random.Random(seed); bars = ''
    for i in range(21):
        env = .35 + .65 * math.sin(math.pi * (i + .5) / 21)
        k = .6 if kind == 'hero' else 1
        hgt = 4 if idle else max(4, round((4 + 28 * env * rnd.uniform(.25, 1) * k) / 2) * 2)
        bars += f'<i style="height:{hgt}px"></i>'
    op = 'opacity:.5;' if idle else ''
    return f'<div class="wave {"hero" if kind=="hero" else ""}" id="wave" style="left:113px;{op}">{bars}</div>'
