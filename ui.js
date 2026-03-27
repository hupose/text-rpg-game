/**
 * Text RPG - UI Logic
 * 界面交互逻辑
 */

// ==================== 全局状态 ====================
let selectedStat = null;

// ==================== DOM 元素 ====================
let elements = {};

function initElements() {
    elements = {
        // 屏幕
        newGameScreen: document.getElementById('newGameScreen'),
        gameScreen: document.getElementById('gameScreen'),
        
        // 新游戏
        playerName: document.getElementById('playerName'),
        btnNewGame: document.getElementById('btnNewGame'),
        btnLoadGame: document.getElementById('btnLoadGame'),
        
        // 角色信息
        playerNameDisplay: document.getElementById('playerNameDisplay'),
        playerClass: document.getElementById('playerClass'),
        playerLevel: document.getElementById('playerLevel'),
        playerExp: document.getElementById('playerExp'),
        playerExpNext: document.getElementById('playerExpNext'),
        expBar: document.getElementById('expBar'),
        
        // 属性
        statStrength: document.getElementById('statStrength'),
        statMagic: document.getElementById('statMagic'),
        statStamina: document.getElementById('statStamina'),
        statDefense: document.getElementById('statDefense'),
        statHp: document.getElementById('statHp'),
        statRegen: document.getElementById('statRegen'),
        statAttack: document.getElementById('statAttack'),
        unusedPoints: document.getElementById('unusedPoints'),
        
        // 加点
        addPointButtons: document.querySelectorAll('.btn-add-point'),
        addPointsActions: document.getElementById('addPointsActions'),
        addPointsInput: document.getElementById('addPointsInput'),
        btnConfirmAdd: document.getElementById('btnConfirmAdd'),
        btnCancelAdd: document.getElementById('btnCancelAdd'),
        
        // 战斗
        btnStartBattle: document.getElementById('btnStartBattle'),
        btnBattleRound: document.getElementById('btnBattleRound'),
        btnAutoBattle: document.getElementById('btnAutoBattle'),
        cooldownTimer: document.getElementById('cooldownTimer'),
        totalBattles: document.getElementById('totalBattles'),
        winRate: document.getElementById('winRate'),
        enemyInfo: document.getElementById('enemyInfo'),
        enemyName: document.getElementById('enemyName'),
        enemyLevel: document.getElementById('enemyLevel'),
        enemyHp: document.getElementById('enemyHp'),
        enemyHpBar: document.getElementById('enemyHpBar'),
        
        // 日志
        battleLog: document.getElementById('battleLog'),
        
        // 系统
        btnSave: document.getElementById('btnSave'),
        btnExport: document.getElementById('btnExport'),
        btnImport: document.getElementById('btnImport'),
        importFile: document.getElementById('importFile'),
        btnReset: document.getElementById('btnReset'),
        saveStatus: document.getElementById('saveStatus'),
    };
}

// ==================== 初始化 ====================
function init() {
    initElements();
    
    // 文件导入事件绑定
    elements.importFile.addEventListener('change', onImportData);
    
    // 尝试自动加载存档
    autoLoadGame();
    
    // 启动 UI 更新循环
    setInterval(updateUI, 1000);
}

// DOM 加载完成后初始化
document.addEventListener('DOMContentLoaded', init);

// ==================== 游戏流程 ====================
function onNewGame() {
    console.log('[UI] onNewGame called');
    const name = elements.playerName.value.trim() || '勇者';
    const classType = document.querySelector('input[name="classType"]:checked').value;
    
    console.log('[UI] Creating game with name:', name, 'class:', classType);
    
    try {
        const result = GameAPI.makeDecision('new_game', { name, classType });
        console.log('[UI] new_game result:', result);
        
        if (result.success) {
            showGameScreen();
            updateUI();
            addLog(result.message, 'system');
        } else {
            console.error('[UI] new_game failed:', result);
            alert('创建角色失败：' + (result.reason || '未知错误'));
        }
    } catch (e) {
        console.error('[UI] Error in onNewGame:', e);
        alert('发生错误：' + e.message);
    }
}

function onLoadGame() {
    const result = GameAPI.makeDecision('load');
    
    if (result.success) {
        showGameScreen();
        updateUI();
        addLog('游戏已加载', 'system');
    } else {
        alert('没有找到存档！');
    }
}

function autoLoadGame() {
    const result = GameAPI.makeDecision('load');
    if (result.success && result.player) {
        showGameScreen();
        updateUI();
        addLog('欢迎回来！自动加载了上次的存档。', 'system');
    }
}

function showGameScreen() {
    elements.newGameScreen.classList.add('hidden');
    elements.gameScreen.classList.remove('hidden');
}

// ==================== 属性加点 ====================
function onAddPointClick(stat) {
    const game = GameAPI.getGame();
    
    if (!game.player || game.player.unusedPoints <= 0) {
        addLog('没有可用的属性点！', 'system');
        return;
    }
    
    selectedStat = stat;
    elements.addPointsActions.classList.remove('hidden');
    elements.addPointsInput.focus();
}

function onConfirmAddPoints() {
    if (!selectedStat) return;
    
    const points = parseInt(elements.addPointsInput.value) || 1;
    const result = GameAPI.makeDecision('add_points', { stat: selectedStat, points });
    
    if (result.success) {
        addLog(result.message, 'success');
        updateUI();
    } else {
        addLog('加点失败：' + (result.reason || '未知错误'), 'system');
    }
    
    onCancelAddPoints();
}

function onCancelAddPoints() {
    selectedStat = null;
    elements.addPointsActions.classList.add('hidden');
    elements.addPointsInput.value = '1';
}

// ==================== 战斗系统 ====================
function onStartBattle() {
    const result = GameAPI.makeDecision('start_battle');
    
    if (result.success) {
        updateUI();
        addLog(`遭遇敌人：${result.enemy.name} (Lv.${result.enemy.level})${result.enemy.isBoss ? ' 【BOSS】' : ''}`, 'battle');
        
        // 自动战斗
        setTimeout(() => {
            onAutoBattle();
        }, 500);
    } else if (result.reason === 'cooldown') {
        addLog('战斗冷却中，请稍后再试...', 'system');
    } else if (result.reason === 'no_player') {
        alert('请先开始新游戏或读取存档！');
    }
}

function onBattleRound() {
    const result = GameAPI.makeDecision('battle_round');
    updateUI();
    
    if (result.result === 'win' || result.result === 'lose') {
        // 战斗结束，UI 会自动更新
    }
}

function onAutoBattle() {
    const result = GameAPI.makeDecision('auto_battle');
    updateUI();
    
    if (result.success) {
        addLog(`战斗结束，共进行了 ${result.rounds} 回合`, 'system');
    }
}

// ==================== 存档系统 ====================
function onSaveGame() {
    const result = GameAPI.makeDecision('save');
    
    if (result.success) {
        showSaveStatus('游戏已保存 ✓', 'success');
        addLog('游戏已保存', 'success');
    } else {
        showSaveStatus('保存失败：' + (result.reason === 'in_battle' ? '战斗中无法保存' : result.reason), 'error');
    }
    
    setTimeout(() => {
        elements.saveStatus.className = 'save-status';
        elements.saveStatus.textContent = '';
    }, 3000);
}

function showSaveStatus(message, type) {
    elements.saveStatus.textContent = message;
    elements.saveStatus.className = `save-status ${type}`;
}

function onExportData() {
    const state = GameAPI.getState();
    const dataStr = JSON.stringify(state, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `text-rpg-save-${Date.now()}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
    addLog('数据已导出', 'success');
}

function onImportData(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const state = JSON.parse(e.target.result);
            GameAPI.getGame().importState(state);
            updateUI();
            addLog('数据已导入', 'success');
        } catch (err) {
            alert('导入失败：' + err.message);
        }
    };
    reader.readAsText(file);
    
    // 重置文件输入
    elements.importFile.value = '';
}

function onResetGame() {
    if (confirm('确定要重置游戏吗？所有进度将丢失！')) {
        GameAPI.reset();
        elements.gameScreen.classList.add('hidden');
        elements.newGameScreen.classList.remove('hidden');
        elements.battleLog.innerHTML = '<div class="log-entry system">等待开始冒险...</div>';
        addLog('游戏已重置', 'system');
    }
}

// ==================== UI 更新 ====================
function updateUI() {
    const state = GameAPI.getState();
    
    if (!state.player) return;
    
    const player = state.player;
    const battle = state.battle;
    
    // 角色信息
    elements.playerNameDisplay.textContent = player.name;
    elements.playerClass.textContent = player.classType === 'physical' ? '物理' : '魔法';
    elements.playerLevel.textContent = player.level;
    elements.playerExp.textContent = player.exp;
    elements.playerExpNext.textContent = player.expToNext;
    
    const expPercent = (player.exp / player.expToNext) * 100;
    elements.expBar.style.width = `${expPercent}%`;
    
    // 属性
    elements.statStrength.textContent = player.strength;
    elements.statMagic.textContent = player.magic;
    elements.statStamina.textContent = player.stamina;
    elements.statDefense.textContent = player.defense;
    elements.statHp.textContent = `${player.currentHp}/${player.maxHp}`;
    elements.statRegen.textContent = `${player.hpRegen}/s`;
    elements.statAttack.textContent = player.attackPower;
    elements.unusedPoints.textContent = player.unusedPoints;
    
    // 战斗状态
    elements.cooldownTimer.textContent = Utils.formatTime(battle.cooldownRemaining);
    elements.totalBattles.textContent = battle.battleCount;
    elements.winRate.textContent = `${battle.winRate}%`;
    
    // 敌人信息
    if (battle.inBattle && battle.currentEnemy) {
        elements.enemyInfo.classList.remove('hidden');
        elements.btnBattleRound.classList.remove('hidden');
        elements.btnAutoBattle.classList.remove('hidden');
        elements.btnStartBattle.classList.add('hidden');
        
        elements.enemyName.textContent = `${battle.currentEnemy.name} ${battle.currentEnemy.isBoss ? '【BOSS】' : ''}`;
        elements.enemyLevel.textContent = battle.currentEnemy.level;
        elements.enemyHp.textContent = `${battle.currentEnemy.currentHp}/${battle.currentEnemy.maxHp} HP`;
        
        const hpPercent = (battle.currentEnemy.currentHp / battle.currentEnemy.maxHp) * 100;
        elements.enemyHpBar.style.width = `${hpPercent}%`;
    } else {
        elements.enemyInfo.classList.add('hidden');
        elements.btnBattleRound.classList.add('hidden');
        elements.btnAutoBattle.classList.add('hidden');
        elements.btnStartBattle.classList.remove('hidden');
    }
    
    // 保存按钮状态
    elements.btnSave.disabled = !state.gameInfo.canSave;
    elements.btnSave.textContent = state.gameInfo.canSave ? '💾 保存进度' : '🚫 战斗中无法保存';
}

function addLog(message, type = 'system') {
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    elements.battleLog.appendChild(entry);
    elements.battleLog.scrollTop = elements.battleLog.scrollHeight;
}

// ==================== 启动 ====================
// 确保在脚本加载完成后立即执行（兼容手机浏览器）
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    // DOM 已经加载完成，直接初始化
    init();
}
