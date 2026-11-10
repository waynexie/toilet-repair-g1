// 布局后处理：居中元素取整、通话气泡从波形下方 24（y 392）往下排，间隔 8
document.querySelectorAll('[data-cx]').forEach(e=>{const w=e.getBoundingClientRect().width;e.style.left=Math.round(+e.dataset.cx-w/2)+'px';});
(function(){let t=392;document.querySelectorAll('.cb').forEach(c=>{c.style.top=t+'px';t+=c.getBoundingClientRect().height+8;});})();
