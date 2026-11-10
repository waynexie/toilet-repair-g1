# 美术规范 v0.1（G1）

## 风格
- 2D 卡通，统一深棕描边 #3B2A20，主体 6px、细节 3px（以 750px 宽设计稿为准）
- 平涂 + 一层柔和暗部（同色相降明度 15%），不画写实脏污
- 环境低饱和暖色；高饱和只给可交互物件和反馈

## 色板
| 用途 | 色值 |
|---|---|
| 描边 | #3B2A20 |
| 墙面米黄 | #EAD9B5 |
| 瓷砖薄荷绿 | #A8CDB8 |
| 地砖暖灰 | #B8A48A |
| 锈管 | #8A5A3C |
| 马桶白 | #F4F1EA |
| 水 | #6EC3F0 / 高光 #CFEFFF |
| 皮搋子红 | #D9413A |
| 胶布黄 | #F2C84B |
| 工作服藏青 | #2E3F66 |
| 金币 | #FFC83D |
| 有效反馈 | #7BE07B |
| 无效反馈 | #FF7A5C |

## 画面布局（竖屏 750×1334 设计稿）
- 场景区：顶部至托盘上沿；马桶中心约在 y=62%
- 工具托盘：底部，高约 120pt（设计稿 240px），4 槽
- 旧手机：右下角托盘上方，只露一角
- 维修时只显示主角双手 + 工具

## 图层（PNG，透明底，2x）
背景：bg_wall / bg_floor / bg_props（桶、毛巾、窗）
马桶：toilet_body / toilet_seat / toilet_lid / toilet_tank / toilet_flush_btn
水：water_surface（可程序形变）/ water_swirl / water_bubble（粒子）
堵塞：clog_soft（纸巾色块）/ clog_hard_silhouette（水下异物剪影）/ item_duck
工具（每件 4 态 idle/held/working/upgraded）：tool_plunger / tool_scoop / tool_snake
手：hand_left / hand_right / sleeve
反馈：fx_ripple / fx_splash / fx_sparkle / fx_coin
命名：<类别>_<名称>_<状态>@2x.png，锚点统一在底部中心（工具在握把处）

## 故障视觉语言
- 软堵：水面缓慢打旋下渗，冲水后水位上涨慢
- 满水：水面接近座圈、晃荡，直接按压触发 fx_splash
- 硬物：水面静止，只冒一个闷泡，水下隐约有剪影；头灯升级后剪影发光

## G1 说明
G1 先用代码绘制的矢量占位，颜色请直接取上面的色板，保证之后替换正式资源时风格不跳。
