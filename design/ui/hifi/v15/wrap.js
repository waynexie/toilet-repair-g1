// 台词排版规则（开发照此实现）：
// 1. 「……」「——」当作一个 2 字宽的整体，不拆开。
// 2. 按宽度贪心折行（T3 Bold 16，每字 16，数字/字母按实测宽度）。
// 3. 行首禁则：，。、！？；：）」』”…… 不能出现在行首。
// 4. 行满后遇到行首禁则字：若是「，。、」（字面在字框左下角）就悬挂在本行末尾，伸进右内边距、不计入行宽；
//    其它（！？……等字面居中的）不悬挂，把本行最后一个字一起带到下一行。
const CLOSE='，。、！？；：）」』”…—';const HANG='，。、';
function tokens(t){const ch=[...t],o=[];for(let i=0;i<ch.length;i++){if((ch[i]==='…'||ch[i]==='—')&&ch[i+1]===ch[i]){o.push(ch[i]+ch[i]);i++;}else o.push(ch[i]);}return o;}
function measurer(font){const c=document.createElement('canvas').getContext('2d');c.font=font;return s=>c.measureText(s).width;}
function wrapLines(t,maxW,font){const m=measurer(font);const tk=tokens(t);const lines=[];let cur=[];
 for(let i=0;i<tk.length;i++){const c=tk[i];
  if(m(cur.join('')+c)<=maxW+0.01){cur.push(c);continue;}
  const isClose=CLOSE.includes(c[0]);
  if(isClose&&HANG.includes(c)){lines.push({t:cur.join(''),h:c});cur=[];continue;}
  if(isClose&&cur.length>1){const last=cur.pop();lines.push({t:cur.join(''),h:''});cur=[last,c];continue;}
  lines.push({t:cur.join(''),h:''});cur=[c];}
 if(cur.length)lines.push({t:cur.join(''),h:''});return lines;}
// 两行时优先在标点后断：第 1 行最后一个标点之后断开，前提是第 2 行仍放得下（≤maxW）且第 1 行至少 5 个字；否则按贪心。
function wrapBest(t,maxW,font){const m=measurer(font);const g=wrapLines(t,maxW,font);if(g.length!==2)return g;
 const ch=[...t];let best=-1;let acc='';for(let i=0;i<ch.length;i++){acc+=ch[i];if(m(acc)>maxW+0.01&&!(CLOSE.includes(ch[i])&&i===ch.length-1))break;if('，。！？；：、'.includes(ch[i])&&i<ch.length-1&&!CLOSE.includes(ch[i+1]))best=i;}
 if(best<4)return g;const a=ch.slice(0,best+1).join(''),b=ch.slice(best+1).join('');const lb=wrapLines(b,maxW,font);if(lb.length!==1)return g;return [{t:a,h:''},{t:b,h:lb[0].h||''}].map(x=>x.h?x:{t:x.t,h:''});}
function layText(el){const t=el.dataset.text,maxW=+el.dataset.maxw,shown=el.dataset.shown==null?1e9:+el.dataset.shown;
 let L=wrapBest(t,maxW,'700 16px "Noto Sans CJK SC"');
 // 兜底：只有「20 字句的第 11 个字是 ！？……」这种情况会排成 3 行，此时这一句的文字区放宽到 maxW+16（11 字），仍 2 行
 // 防孤字：第 2 行只剩 ≤3 个字（如「子……」「吗？」）而放宽 16 能少一行时，也放宽到 maxW+16
 const lastU=L.length>1?[...L[L.length-1].t].length:99;
 if(L.length>2||lastU<=3){const L2=wrapBest(t,maxW+16,'700 16px "Noto Sans CJK SC"');if(L2.length<L.length||L.length>2){L=L2;el.dataset.maxw=maxW+16;}}let n=0;
 el.innerHTML=L.map(l=>{const sp=s=>[...s].map(c=>`<span${(n++>=shown)?' class="hid"':''}>${c}</span>`).join('');
  return `<span class="ln">${sp(l.t)}${l.h?`<span class="hang">${sp(l.h)}</span>`:''}</span>`}).join('');
 el.dataset.lines=L.length;el.dataset.w=Math.max(...L.map(l=>measurer('700 16px "Noto Sans CJK SC"')(l.t)));}
document.querySelectorAll('.tx[data-text]').forEach(layText);
