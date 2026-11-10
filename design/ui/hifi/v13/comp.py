from icons import *
css=open('/dev/stdin').read()
def sec(t,body):return f'<div class="sec"><p class="h">{t}</p><div class="items">{body}</div></div>'
def it(lbl,html):return f'<div class="it"><div class="stage">{html}</div><p class="lbl">{lbl}</p></div>'
btn=lambda cls,txt:f'<div class="btn {cls}">{txt}</div>'
body=''
body+=sec('按钮 · 主按钮 56（金黄）',it('常态',btn('pri','接下一单'))+it('按下',btn('pri down','接下一单'))+it('禁用',btn('pri dis','还差 ¥40')))
body+=sec('按钮 · 广告按钮 48（绿）/ 次按钮 48',it('广告 常态',btn('ad','▶ 看广告 工钱翻倍'))+it('广告 按下',btn('ad down','▶ 看广告 工钱翻倍'))+it('次按钮',btn('sec','先不买')))
body+=sec('瓷面组件 · 胶囊 / 小牌 / 圆按钮',it('金币胶囊',f'<div class="s1 cap"><div class="coin">{COIN}</div>128</div>')+it('本单小牌',f'<div class="s1 tag"><span class="lb">本单</span><span class="v">¥30</span></div>')+it('圆按钮 常态',f'<div class="s1 rnd">{GEAR()}</div>')+it('圆按钮 按下',f'<div class="s1 rnd down">{GEAR()}</div>')+it('圆按钮 禁用',f'<div class="s1 rnd dis">{GEAR("#B9A68F")}</div>'))
body+=sec('角标',it('红点',f'<span class="dot">1</span>&nbsp;&nbsp;<span class="dot">12</span>')+it('免费',f'<span class="rib">今日免费</span>')+it('广告',f'<span class="rib rad">▶ 广告</span>')+it('新',f'<span class="rib new">新</span>'))
body+=sec('开关 48×28 · 卡片',it('开',f'<span class="sw on"><i></i></span>')+it('关',f'<span class="sw"><i></i></span>')+it('禁用',f'<span class="sw dis"><i></i></span>')+it('弹窗卡片（缩略）','<div class="card"><p class="ct">设置</p><div class="crow">声音<span class="sw on"><i></i></span></div></div>'))
open('components.html','w').write(f'<!DOCTYPE html><html><head><meta charset="utf-8"><style>{css}</style></head><body><p class="title">组件库 v1.3 · 方案 A 奶油瓷面（1 倍尺寸 ×2 展示）</p>{body}</body></html>')
