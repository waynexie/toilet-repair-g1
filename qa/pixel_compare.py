"""UI 高保真 vs 线上截图 逐像素比对（策划验收用）
用法: python3 qa/pixel_compare.py <hifi.png> <online.png> [x y w h] [--tol 24]
两图先统一到 780x1560（2x）。可选裁一块区域（2x 像素）只比 HUD 等局部。
输出: 差异像素占比、最大偏差，并生成 <online>_diff.png（左高保真 | 中线上 | 右差异热图）。
通过线：区域内超出容差的像素 ≤ 2%，且无连续 ≥ 4px 的错位边。"""
import sys
from PIL import Image, ImageChops
a=[x for x in sys.argv[1:] if not x.startswith('--')]
tol=int(sys.argv[sys.argv.index('--tol')+1]) if '--tol' in sys.argv else 24
if '--tol' in sys.argv: a=[x for x in a if x!=str(tol)]
S=(780,1560)
h=Image.open(a[0]).convert('RGB').resize(S); o=Image.open(a[1]).convert('RGB').resize(S)
if len(a)>=6:
    x,y,w,hh=map(int,a[2:6]); h=h.crop((x,y,x+w,y+hh)); o=o.crop((x,y,x+w,y+hh))
d=ImageChops.difference(h,o).convert('L')
px=list(d.getdata()); bad=sum(1 for p in px if p>tol)
print(f"超差像素 {bad/len(px)*100:.2f}%  最大偏差 {max(px)}  容差 {tol}")
heat=d.point(lambda p:255 if p>tol else 0).convert('RGB')
W,H=h.size; c=Image.new('RGB',(W*3+20,H),'white')
c.paste(h,(0,0)); c.paste(o,(W+10,0)); c.paste(heat,(2*W+20,0))
out=a[1].rsplit('.',1)[0]+'_diff.png'; c.save(out); print(out)
