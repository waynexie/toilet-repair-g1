# 平台移植评估（游戏开发）

结论：**微信小游戏移植成本低，约 3–5 个工作日**（不含审核与资质）。抖音小游戏 API 与微信几乎一一对应，在微信版基础上再加约 1–2 天。

## 1. 现状
- 纯原生 JS + Canvas 2D，逻辑分辨率 390×780，**没有用任何引擎**（没有 PixiJS/Cocos），没有 DOM 依赖的 UI。
- 声音全部用 Web Audio 实时合成，没有音频文件。
- 数据：`data/orders.json` / `narrative.json` / `economy.json`，运行时 fetch。
- 广告：已抽成 `src/ads.js`，游戏只调 `Ads.rewarded(placement)`（返回 Promise<boolean>）和 `Ads.interstitial(placement)`；已写好 wx / tt 分支，网页走假广告。
- 存档：localStorage（最好成绩、次数）。

## 2. 要不要换引擎
| 方案 | 成本 | 收益 | 建议 |
|---|---|---|---|
| 保持 Canvas 2D + 薄适配层 | 低 | 包体最小（现在 < 100KB 代码），首屏快 | **G2 先用这个** |
| 换 PixiJS（WebGL） | 中（重写所有绘制，约 1–2 周） | 美术素材多、粒子多时性能更稳 | 等美术换成大量位图、真机掉帧再考虑 |
| 换 Cocos Creator | 高 | 官方小游戏工具链、编辑器 | 不建议，等于重做 |

美术进入位图阶段后，Canvas 2D 的 drawImage 在小游戏里性能足够；先做真机性能测试再决定。

## 3. 需要改的地方（微信）
| 项 | 网页 | 微信小游戏 | 工作量 |
|---|---|---|---|
| 画布 | `document.getElementById` | `wx.createCanvas()` 主屏画布，按 `wx.getSystemInfoSync()` 算缩放、刘海安全区 | 0.5 天 |
| 输入 | pointer 事件 | `wx.onTouchStart/Move/End`，转换成现有 `ptr` | 0.5 天 |
| 数据 | fetch json | 直接 `require` 打进包，或 `wx.request` 走 CDN 热更 | 0.5 天 |
| 存档 | localStorage | `wx.setStorageSync/getStorageSync` | 0.2 天 |
| 声音 | Web Audio 合成 | `wx.createWebAudioContext()` 支持 OscillatorNode，合成音基本可复用；需真机验证 iOS 静音键行为 | 0.5–1 天 |
| 震动 | navigator.vibrate | `wx.vibrateShort({type:'light/medium/heavy'})`，iOS 也能震，可去掉现在的屏幕抖动补偿 | 0.2 天 |
| 字体 | 系统中文字体栈 | 系统默认字体，可用；如要特殊字体需 `wx.loadFont`，注意体积 | 0.2 天 |
| 广告 | 假广告 | `wx.createRewardedVideoAd` / `createInterstitialAd`，已在 ads.js 写好，填广告位 ID 即可 | 0.5 天 |
| 分享 | 无 | `wx.shareAppMessage`（G2 朋友圈/求助可接） | 0.5 天 |

可选做法：用社区的 weapp-adapter 模拟 `document/window`，改动更小，但多 30–50KB，且调试麻烦；我倾向自己写 100 行左右的薄适配层。

## 4. 包体与分包
- 主包上限 4MB，总包（含分包）上限 30MB；首包越小，打开越快。
- 现在代码 + 数据 < 200KB，完全够。
- 美术位图上来后：主包只放第一天用到的素材，后续营业日 / 新场景放分包（`wx.loadSubpackage`），或放 CDN 按需下载。
- 美术出图建议：WebP/PNG 合图（atlas），单张 ≤ 1024²。

## 5. 上线前的非技术事项（需要 Grok Bot 汇总给制作人）
- 小游戏账号（企业主体更方便开流量主），**流量主**开通需累计用户数门槛，前期广告位可能拿不到 → 前期 ads.rewarded 失败时直接放行，不卡进度（已按此实现）。
- 游戏类目需要**版号**或走"无版号休闲游戏"相关规则，需确认当期政策。
- 「喂信」界面与图标需保持原创，避免被判"仿冒官方界面"（美术已换原创图标）。
- 隐私协议、适龄提示。

## 6. 抖音小游戏
API 基本是把 `wx.` 换成 `tt.`；广告、存档、震动、分包都有对应。差异主要在审核口径和录屏分享（`tt.getGameRecorderManager`，适合做"溅一脸"高光录屏，后续可加）。
