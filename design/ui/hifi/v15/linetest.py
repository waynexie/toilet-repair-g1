# 字数排版测试：所有现有台词 + 20 字极限句，T3 Bold 16，文字区 160（兜底 176）
import json, html as H
from lib import *
NAR = json.load(open(ROOT + '/data/narrative.json'))
T = []
for o in NAR['orders'].values():
    for k, v in (o.get('bubbles') or {}).items():
        if isinstance(v, dict) and 'text' in v: T.append(('气泡 ' + k, v['text'], 160))
c = NAR['calls']['o2']['script']
for i, l in enumerate(c['lines']): T.append((f'通话第{i+1}句', l['text'], 160))
for k, v in NAR['hints'].items():
    if not k.startswith('_'): T.append(('提示 ' + k, v, 208))
T += [('极限 20 字·逗号在第 11', '一二三四五六七八九十，一二三四五六七八九', 160), ('极限 20 字·叹号在第 11', '一二三四五六七八九十！一二三四五六七八九', 160),
      ('极限 20 字·省略号在 10–11', '一二三四五六七八九……一二三四五六七八九', 160), ('极限 20 字·无标点', '一二三四五六七八九十一二三四五六七八九十', 160)]
body = ''.join(f'<div class="tx" data-text="{H.escape(t)}" data-maxw="{w}"></div>' for _, t, w in T)
js = 'document.title=JSON.stringify([...document.querySelectorAll(".tx")].map(e=>[+e.dataset.lines,+e.dataset.w,+e.dataset.maxw,[...e.querySelectorAll(".ln")].map(l=>l.textContent)]))'
open('_linetest.html', 'w').write(page(body, 'lt', js))
r = json.loads(H.unescape(dom('_linetest.html').split('<title>')[1].split('</title>')[0]))
out = []
for (n, t, w), (lines, mw, maxw, ls) in zip(T, r):
    units = sum(2 if ch in '' else 1 for ch in t)
    out.append(dict(name=n, text=t, chars=len(t), lines=lines, maxLineW=round(mw, 1), textArea=maxw, ok=lines <= 2 and mw <= maxw + .01, layout=' / '.join(ls)))
    print(('✔' if out[-1]['ok'] else '✘'), n, len(t), '字', lines, '行', round(mw, 1), '/', maxw, '|', ' / '.join(ls))
json.dump(out, open('hifi/linetest.json', 'w'), ensure_ascii=False, indent=1)
