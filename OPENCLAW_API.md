# OpenClaw 集成文档

## 概述

文字 RPG 游戏提供了完整的 OpenClaw 集成接口，允许 AI 查询游戏状态并执行决策。

## API 参考

### GameAPI 对象

游戏在全局作用域暴露 `GameAPI` 对象（浏览器环境）或可通过 `require()` 导入（Node.js 环境）。

---

### 查询接口

#### `GameAPI.getState()`

获取完整游戏状态。

**返回示例：**

```json
{
  "player": {
    "name": "勇者",
    "classType": "physical",
    "level": 10,
    "exp": 500,
    "expToNext": 1000,
    "unusedPoints": 9,
    "baseStats": {
      "strength": 25,
      "magic": 10,
      "stamina": 30,
      "defense": 15
    },
    "strength": 32,
    "magic": 8,
    "stamina": 36,
    "defense": 19,
    "currentHp": 380,
    "maxHp": 460,
    "hpRegen": 19,
    "attackPower": 72
  },
  "battle": {
    "inBattle": false,
    "battleCount": 50,
    "winCount": 42,
    "loseCount": 8,
    "winRate": 84,
    "cooldownRemaining": 0,
    "currentEnemy": null,
    "recentLogs": ["战斗胜利！获得 200 点经验值"]
  },
  "gameInfo": {
    "startTime": 1711500000000,
    "lastSaveTime": 1711503600000,
    "totalPlayTime": 7200000,
    "canSave": true
  }
}
```

---

### 决策接口

#### `GameAPI.makeDecision(action, params)`

执行游戏决策。

**参数：**

| 参数 | 类型 | 说明 |
|------|------|------|
| action | string | 动作类型（见下表） |
| params | object | 动作参数 |

**支持的动作：**

| action | params | 说明 |
|--------|--------|------|
| `new_game` | `{ name: string, classType: 'physical' \| 'magical' }` | 开始新游戏 |
| `add_points` | `{ stat: string, points: number }` | 加点（stat: strength/magic/stamina/defense） |
| `start_battle` | `{}` | 开始战斗 |
| `battle_round` | `{}` | 执行一次战斗回合 |
| `auto_battle` | `{}` | 自动战斗直到结束 |
| `save` | `{}` | 保存游戏 |
| `load` | `{}` | 加载游戏 |

**返回示例：**

```javascript
// 加点成功
{
  success: true,
  message: "strength +3",
  player: { /* 更新后的玩家数据 */ }
}

// 加点失败
{
  success: false,
  reason: "not_enough_points",
  available: 2,
  requested: 5
}

// 开始战斗
{
  success: true,
  enemy: {
    name: "小战士",
    isBoss: false,
    level: 5,
    classType: "physical",
    currentHp: 200,
    maxHp: 200,
    attackPower: 25,
    defense: 12
  }
}

// 战斗冷却
{
  success: false,
  reason: "cooldown"
}
```

---

### 重置接口

#### `GameAPI.reset()`

重置游戏到初始状态。

**返回：**

```javascript
{
  success: true,
  message: "游戏已重置"
}
```

---

## OpenClaw 使用示例

### 示例 1：查询状态并生成报告

```javascript
const state = GameAPI.getState();
const player = state.player;

return `
## 角色报告

**${player.name}** - Lv.${player.level} ${player.classType === 'physical' ? '物理' : '魔法'}

### 属性
- 力量：${player.strength}
- 魔法：${player.magic}
- 体力：${player.stamina}
- 防御：${player.defense}
- 血量：${player.currentHp}/${player.maxHp}
- 攻击：${player.attackPower}

### 进度
- 经验：${player.exp}/${player.expToNext} (${Math.round(player.exp/player.expToNext*100)}%)
- 可用属性点：${player.unusedPoints}

### 战斗统计
- 总战斗：${state.battle.battleCount}
- 胜率：${state.battle.winRate}%
`;
```

### 示例 2：智能加点推荐

```javascript
function recommendPoints(state) {
  const player = state.player;
  const recommendations = [];
  
  if (player.classType === 'physical') {
    // 物理职业优先力量
    if (player.strength < 20) {
      recommendations.push({ stat: 'strength', reason: '提升攻击力' });
    } else {
      recommendations.push({ stat: 'stamina', reason: '提升血量上限' });
    }
  } else {
    // 魔法职业优先魔法
    if (player.magic < 20) {
      recommendations.push({ stat: 'magic', reason: '提升法术伤害' });
    } else {
      recommendations.push({ stat: 'stamina', reason: '提升生存能力' });
    }
  }
  
  return recommendations;
}
```

### 示例 3：自动托管循环

```javascript
async function autoPlay() {
  // 1. 检查是否有可用属性点
  let state = GameAPI.getState();
  while (state.player.unusedPoints > 0) {
    const rec = recommendPoints(state);
    GameAPI.makeDecision('add_points', { 
      stat: rec[0].stat, 
      points: state.player.unusedPoints 
    });
    state = GameAPI.getState();
  }
  
  // 2. 检查是否可以战斗
  if (state.battle.cooldownRemaining === 0) {
    GameAPI.makeDecision('auto_battle');
  }
  
  // 3. 保存进度
  GameAPI.makeDecision('save');
  
  return '自动托管完成';
}
```

---

## 状态文件

游戏状态会同步写入 `game_state.json`（Node.js 环境）或通过事件通知（浏览器环境）。

### 文件位置

- **浏览器**：LocalStorage 键名 `textRPG_save_v1`
- **Node.js**：`./game_state.json`

### 文件格式

```json
{
  "version": 1,
  "timestamp": 1711500000000,
  "player": { /* 玩家数据 */ },
  "battleSystem": { /* 战斗数据 */ },
  "gameStartTime": 1711500000000,
  "lastSaveTime": 1711500000000,
  "totalPlayTime": 3600000
}
```

---

## 注意事项

1. **战斗中无法保存**：`canSave` 为 `false` 时调用 `save()` 会失败
2. **加点限制**：只能加在 `strength/magic/stamina/defense` 上
3. **战斗冷却**：最少 5 秒，可通过 `cooldownRemaining` 查询
4. **血量归零**：战斗失败会自动复活并回满血

---

## 扩展建议

### 添加新动作

在 `game.js` 的 `GameAPI.makeDecision()` 中添加：

```javascript
case 'new_action':
    return game.newAction(params);
```

### 添加新状态字段

在 `Game.getState()` 中添加：

```javascript
getState() {
    return {
        // ...现有字段
        newField: this.newValue
    };
}
```

### 事件监听（浏览器）

```javascript
window.addEventListener('game-state-update', (e) => {
    console.log('游戏状态更新:', e.detail);
});
```
