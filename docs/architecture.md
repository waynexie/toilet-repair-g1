# 架构：搭积木、组件化

目标：上新内容（新客户、新户型、新工具、新单子）只换素材、改配置，不改玩法代码。

## 1. 三层数据

| 文件 | 谁维护 | 内容 |
|---|---|---|
| `data/orders.json`、`data/g2_orders.json` | 策划 | 单子：客户、场景、故障、水位、堵点血量、报酬、需要的工具、营业日和接单板 |
| `data/economy.json` | 策划 | 倍率、人工费、广告位、老钱求助次数 |
| `data/narrative.json` | 叙事 | 客户台词、家族群、朋友圈、每家物件（`home`）、剧情钩子 |
| `data/scenes.json`（待建） | 美术 + 开发 | 场景底图、每家物件图层、热区坐标 |
| `data/tools.json`（待建，先合进 g2_orders.tools） | 策划 + 开发 | 工具：手势、判定参数、动效、音效、图标 |

代码只认 id，比如 `o5`、`wang_ayi`、`plunger`。台词、数值和图片都按 id 从配置里取。

## 2. 场景 = 通用底图 + 每家物件层

```
scene(o5) =
  base:    bathroom_topdown        // 通用俯视卫生间：墙、地砖、马桶本体
  layers:  [wang_ayi/cover, wang_ayi/washboard, wang_ayi/pothos, ...]  // 王阿姨家物件
  dynamic: water(scale by level), clog(type), swirl        // 玩法层，代码驱动
  ui:      HUD / 工具箱 / 手机 / 老钱按钮                    // UI 叠在最上面，不进背景
```

- 镜头两种：卫生间用俯视（`bathroom_topdown`），门锁、开门亮相用平视（`door_front`）。
- 物件图层按 `home` 配置挂上去，位置写在 `scenes.json`。要点的东西（冲水按钮、门把手、锁孔）配热区。
- 水面是单独一层，按水位缩放；满水时贴着碗沿，正常水位露出白瓷圈和水渍线。
- 安全区：画布 390×780，美术按 375×812 出图时等比铺满，上下各裁约 15px。顶部 0–110 是 HUD，底部 150 是工具箱，碗口和水面放在 y 380–600。
- 素材缺失时一律画占位图，不报错。

## 3. 工具组件

每件工具是一份配置加一个手势处理器：

```js
{ id:'lube_spray', name:'润滑喷剂', icon:'tools/lube_spray.png',
  gesture:'long_press', holdMs:900, overHoldMs:2200,        // 判定参数
  targets:['keyhole'], fx:'spray', sfx:'spray',              // 作用热区、动效、音效
  wrongFeedback:'...', overHoldFeedback:'...' }
```

- 手势处理器只有几种，可以复用：`drag_place`（拖到位置）、`plunge`（下压、蓄力、上提）、`scoop`（舀水、倒水）、`rotate`（绕中心转圈）、`long_press`（长按）、`tap`。
- 组件统一对外报事件：`progress`、`success`、`wrong(reason)`、`penalty(n)`。扣小费、出台词、记图鉴由外层统一处理。
- 工具箱托盘按配置渲染 4 格：已拥有、锁住（升级解锁）、单子临时借来的（比如老钱的螺丝刀，带角标）。升级换箱子只换箱盖和箱体两层皮。

## 4. 客户组件

```js
customer(id) -> { name, avatar, faces:{normal,happy,worried,shocked}, look, home }
```

- 头像、表情、台词都从 `narrative.json` 读。开发只按情绪切换表情：完成得好用 happy，被扣钱用 worried，挖出怪东西用 shocked。
- 开门亮相：每单开始时显示第一人称开门画面，图片是 `assets/reveal/<单子id>.png`；没有图就画占位，显示门框、头像、名字和第一句台词。

## 5. 流程组件

```
营业日 day → 早晨消息 → 接单板（2–3 张卡，挑几张）→ 简报 → 开门亮相 → 现场操作 → 结算 →（顺手单 / 转介绍）→ 收工晚间消息
```

- 接单来源：微信消息、来电急单（×1.5）、熟人介绍（×1.2），卡片角标按来源区分。
- 单子目标：`toilet`（马桶）和 `door_lock`（门锁）。以后加新目标就加一个场景和几样工具，流程本身不用动。

## 6. 现状和迁移计划

- 现在：`src/game.js` 是 G1 的玩法（马桶、三件工具、手机、老钱、设置），`src/g2.js` 是 G2 骨架（营业日、接单板、开门亮相、门锁）。两边都已经按 id 读配置，但还是 Canvas 直接画的占位图。
- 接正式素材时按顺序拆：
  1. 先加 `assets/` 和图片加载器。
  2. 做场景组件：底图加物件层，再加水面层。
  3. 做工具组件：把现在写死在 `playDown/playMove`、`lockDown/lockMove` 里的手势改成配置驱动。
  4. 做客户组件和表情。
  5. 换上工具箱托盘。
  每一步都要先跑通 `qa/playthrough.test.js` 再推上线。
- 小程序移植：渲染层只依赖 Canvas 2D 加一层很薄的适配，见 `docs/platform.md`。
