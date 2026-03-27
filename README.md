# 文字 RPG - 放置冒险

纯文字放置 RPG 游戏，支持 OpenClaw AI 集成。

## 🎮 游戏特性

- **两种职业**：物理（力量加成）/ 魔法（魔法加成）
- **属性系统**：力量、魔法、体力、防御、血量、回血
- **升级加点**：每级获得 3 点属性点自由分配
- **阈值加成**：属性达到 10/20/30/50/100 时额外 +2
- **自动战斗**：回合制文字战斗，5-10 秒冷却
- **本地存档**：LocalStorage + JSON 导出导入

## 🚀 快速开始

### 浏览器运行

直接用浏览器打开 `index.html` 即可游玩。

```bash
# 或者用本地服务器
cd text-rpg
python3 -m http.server 8080
# 访问 http://localhost:8080
```

### 手机适配

界面已针对手机优化，可直接部署到静态托管服务（GitHub Pages、Vercel 等）。

## 🤖 OpenClaw 集成接口

游戏暴露了 `GameAPI` 全局对象，OpenClaw 可以通过以下方式查询和决策：

### 查询游戏状态

```javascript
// 获取完整游戏状态
const state = GameAPI.getState();
/*
返回：
{
  player: {
    name: "勇者",
    classType: "physical",
    level: 5,
    exp: 150,
    expToNext: 395,
    unusedPoints: 6,
    strength: 12,
    magic: 8,
    stamina: 15,
    defense: 10,
    currentHp: 250,
    maxHp: 250,
    hpRegen: 8,
    attackPower: 32
  },
  battle: {
    inBattle: false,
    battleCount: 10,
    winCount: 8,
    loseCount: 2,
    winRate: 80,
    cooldownRemaining: 3000,
    currentEnemy: null
  },
  gameInfo: {
    startTime: 1234567890,
    lastSaveTime: 1234567890,
    totalPlayTime: 3600000,
    canSave: true
  }
}
*/
```

### 执行决策

```javascript
// 新游戏
GameAPI.makeDecision('new_game', { name: '勇者', classType: 'physical' });

// 加点
GameAPI.makeDecision('add_points', { stat: 'strength', points: 3 });

// 开始战斗
GameAPI.makeDecision('start_battle');

// 自动战斗（直到结束）
GameAPI.makeDecision('auto_battle');

// 保存游戏
GameAPI.makeDecision('save');

// 加载游戏
GameAPI.makeDecision('load');

// 重置游戏
GameAPI.reset();
```

### Node.js 环境使用

```javascript
const { GameAPI } = require('./game.js');

// 查询状态
const state = GameAPI.getState();

// 执行决策
GameAPI.makeDecision('add_points', { stat: 'strength', points: 1 });
```

## 📁 项目结构

```
text-rpg/
├── index.html        # 主界面
├── styles.css        # 样式（手机适配）
├── game.js           # 核心逻辑（含 OpenClaw API）
├── ui.js             # 界面交互
└── README.md         # 说明文档
```

## 🎯 游戏机制

### 职业加成

| 职业 | 力量 | 魔法 | 体力 |
|------|------|------|------|
| 物理 | +20% | -20% | +10% |
| 魔法 | -20% | +20% | +0% |

### 属性阈值

属性达到以下值时，额外 +2 点：
- 10、20、30、50、100

### 战斗公式

- **攻击力** = 主属性 × 2 + 副属性
  - 物理职业：力量 × 2 + 魔法
  - 魔法职业：魔法 × 2 + 力量
- **伤害** = max(1, 攻击力 - 防御)
- **最大血量** = 100 + 体力 × 10
- **每秒回血** = 1 + 体力 × 0.5

### 升级经验

```
升级所需经验 = 100 × 等级^1.5
```

## 🔧 开发说明

### 扩展职业

在 `game.js` 的 `CONFIG.CLASS_BONUSES` 中添加新职业：

```javascript
CLASS_BONUSES: {
    // ...现有职业
    hybrid: {
        name: " hybrid",
        bonuses: {
            strength: 1.1,
            magic: 1.1,
            stamina: 0.9,
        }
    }
}
```

### 扩展属性

在 `Character` 类中添加新属性：

```javascript
baseStats: {
    // ...现有属性
    agility: 5,  // 新增敏捷
}
```

### OpenClaw AI 决策场景

1. **加点推荐**：分析当前属性和职业，推荐最优加点方案
2. **战斗策略**：根据敌人属性判断是否继续战斗
3. **进度分析**：定期生成游戏进度报告
4. **自动托管**：AI 全自动管理角色成长

## 📝 待办事项

- [ ] 装备系统
- [ ] 技能系统
- [ ] 多人排行榜
- [ ]成就系统
- [ ] 更多敌人类型
- [ ] 地图探索

## 📄 License

MIT
