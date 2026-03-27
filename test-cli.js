#!/usr/bin/env node
/**
 * 文字 RPG - 命令行测试
 * 直接运行看效果
 */

const { GameAPI } = require('./game.js');

function log(msg) {
    console.log(msg);
}

function section(title) {
    console.log('\n' + '='.repeat(50));
    console.log('  ' + title);
    console.log('='.repeat(50));
}

// 开始测试
section('🎮 文字 RPG 测试');

// 1. 新游戏
section('1️⃣ 创建角色');
const newGame = GameAPI.makeDecision('new_game', { name: '测试勇者', classType: 'physical' });
log(`✅ ${newGame.message}`);
log(`   职业：${newGame.player.classType === 'physical' ? '物理' : '魔法'}`);
log(`   等级：Lv.${newGame.player.level}`);

// 2. 查看状态
section('2️⃣ 初始属性');
let state = GameAPI.getState();
let player = state.player;
log(`   💪 力量：${player.strength}`);
log(`   🔮 魔法：${player.magic}`);
log(`   🏃 体力：${player.stamina}`);
log(`   🛡️ 防御：${player.defense}`);
log(`   ❤️ 血量：${player.currentHp}/${player.maxHp}`);
log(`   ⚔️ 攻击：${player.attackPower}`);
log(`   可用属性点：${player.unusedPoints}`);

// 3. 加点测试
section('3️⃣ 加点测试');
const addPoints = GameAPI.makeDecision('add_points', { stat: 'strength', points: 3 });
log(`✅ ${addPoints.message}`);
state = GameAPI.getState();
player = state.player;
log(`   现在力量：${player.strength} (原来 5)`);

// 4. 战斗测试
section('4️⃣ 战斗测试');
const startBattle = GameAPI.makeDecision('start_battle');
if (startBattle.success) {
    log(`⚔️ 遭遇敌人：${startBattle.enemy.name} (Lv.${startBattle.enemy.level})`);
    
    // 自动战斗
    const autoBattle = GameAPI.makeDecision('auto_battle');
    log(`⚡ 自动战斗完成，共 ${autoBattle.rounds} 回合`);
    
    state = GameAPI.getState();
    log(`   战斗统计：${state.battle.winCount}胜/${state.battle.loseCount}负`);
    log(`   胜率：${state.battle.winRate}%`);
} else {
    log(`❌ 战斗失败：${startBattle.reason}`);
}

// 5. 升级测试
section('5️⃣ 升级情况');
state = GameAPI.getState();
player = state.player;
log(`   当前等级：Lv.${player.level}`);
log(`   经验：${player.exp}/${player.expToNext}`);
log(`   可用属性点：${player.unusedPoints}`);

if (player.level > 1) {
    log(`   🎉 升级了！获得 ${player.unusedPoints} 点属性点`);
}

// 6. 保存测试
section('6️⃣ 保存游戏');
const save = GameAPI.makeDecision('save');
log(`✅ ${save.message || '保存成功'}`);

// 7. 最终状态
section('📊 最终状态');
state = GameAPI.getState();
player = state.player;
log(`   ${player.name} - Lv.${player.level} ${player.classType === 'physical' ? '物理' : '魔法'}`);
log(`   力量：${player.strength} | 魔法：${player.magic} | 体力：${player.stamina} | 防御：${player.defense}`);
log(`   血量：${player.currentHp}/${player.maxHp} | 攻击：${player.attackPower}`);
log(`   战斗：${state.battle.battleCount}场 | 胜率：${state.battle.winRate}%`);

section('✅ 测试完成');
console.log('');
