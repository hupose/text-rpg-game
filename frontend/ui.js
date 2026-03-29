/**
 * Text RPG - Frontend UI Logic
 * WebSocket 长连接，实时推送状态
 */

// ==================== 全局状态 ====================
let selectedStat = null;
let autoFarmTimer = null;
let autoBattleEnabled = false;
let wasAutoFarming = false;
let currentState = null;
let reviveCheckInterval = null;

// ==================== DOM 元素 ====================
let elements = {};

function initElements() {
    elements = {
        // 屏幕
        connectScreen: document.getElementById('connectScreen'),
        newGameScreen: document.getElementById('newGameScreen'),
        gameScreen: document.getElementById('gameScreen'),
        
        // 连接
        baseUrlInput: document.getElementById('baseUrlInput'),
        gameIdInput: document.getElementById('gameIdInput'),
        btnConnect: document.getElementById('btnConnect'),
        connectError: document.getElementById('connectError'),
        connectionStatus: document.getElementById('connectionStatus'),
        
        // 新游戏
        playerName: document.getElementById('playerName'),
        btnNewGame: document.getElementById('btnNewGame'),
        btnLoadGame: document.getElementById('btnLoadGame'),
        btnBackToConnect: document.getElementById('btnBackToConnect'),
        
        // 角色信息
        playerNameDisplay: document.getElementById('playerNameDisplay'),
        playerClass: document.getElementById('playerClass'),
        playerLevel: document.getElementById('playerLevel'),
        playerExp: document.getElementById('playerExp'),
        playerExpNext: document.getElementById('playerExpNext'),
        expBar: document.getElementById('expBar'),
        
        // 金币和药品
        playerGold: document.getElementById('playerGold'),
        playerPotions: document.getElementById('playerPotions'),
        
        // 死亡状态
        deathStatus: document.getElementById('deathStatus'),
        reviveTimer: document.getElementById('reviveTimer'),
        btnRevive: document.getElementById('btnRevive'),
        
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
        
        // 自动刷怪
        autoFarmInterval: document.getElementById('autoFarmInterval'),
        btnStartAutoFarm: document.getElementById('btnStartAutoFarm'),
        btnStopAutoFarm: document.getElementById('btnStopAutoFarm'),
        autoFarmStatus: document.getElementById('autoFarmStatus'),
        
        // 自动战斗
        autoBattleToggle: document.getElementById('autoBattleToggle'),
        autoBattleSlider: document.getElementById('autoBattleSlider'),
        autoBattleStatus: document.getElementById('autoBattleStatus'),
        
        // 商店
        shopPanel: document.getElementById('shopPanel'),
        btnOpenShop: document.getElementById('btnOpenShop'),
        shopGoldDisplay: document.getElementById('shopGoldDisplay'),
        
        // 使用药品
        potionPanel: document.getElementById('potionPanel'),
        btnUsePotion: document.getElementById('btnUsePotion'),
    };
}

// ==================== 初始化 ====================
function init() {
    initElements();
    initTheme();
    initAutoBattle();
    
    // 文件导入事件绑定
    elements.importFile.addEventListener('change', onImportData);
    
    // 加载保存的 baseUrl
    const savedUrl = localStorage.getItem('textRPG_baseUrl');
    if (savedUrl) {
        elements.baseUrlInput.value = savedUrl;
    }
    
    // 设置 API 回调
    gameAPI.onStateUpdate = (state) => {
        currentState = state;
        updateUIWithState(state);
    };
    
    gameAPI.onBattleLog = (data) => {
        addLog(data.message, data.type || 'system');
    };
}

document.addEventListener('DOMContentLoaded', init);

// ==================== 连接服务器 ====================
async function onConnect() {
    const baseUrl = elements.baseUrlInput.value.trim();
    const gameId = elements.gameIdInput.value.trim() || 'default';
    
    if (!baseUrl) {
        showConnectError('请输入服务器地址');
        return;
    }
    
    gameAPI.setBaseUrl(baseUrl);
    gameAPI.setGameId(gameId);
    
    elements.btnConnect.disabled = true;
    elements.btnConnect.textContent = '连接中...';
    elements.connectError.classList.add('hidden');
    
    try {
        await gameAPI.connect();
        
        // 连接成功
        localStorage.setItem('textRPG_baseUrl', baseUrl);
        elements.connectionStatus.textContent = `✅ 已连接: ${baseUrl}`;
        showNewGameScreen();
        
    } catch (error) {
        showConnectError(`连接失败: ${error.message}`);
        elements.btnConnect.disabled = false;
        elements.btnConnect.textContent = '连接服务器';
    }
}

function showConnectError(message) {
    elements.connectError.textContent = message;
    elements.connectError.classList.remove('hidden');
}

function onBackToConnect() {
    gameAPI.disconnect();
    elements.newGameScreen.classList.add('hidden');
    elements.connectScreen.classList.remove('hidden');
    elements.connectionStatus.textContent = '';
}

function showNewGameScreen() {
    elements.connectScreen.classList.add('hidden');
    elements.newGameScreen.classList.remove('hidden');
    elements.btnConnect.disabled = false;
    elements.btnConnect.textContent = '连接服务器';
}

// ==================== 主题切换 ====================
function onToggleTheme() {
    const html = document.documentElement;
    const btn = document.getElementById('btnToggleTheme');
    
    if (html.getAttribute('data-theme') === 'dark') {
        html.removeAttribute('data-theme');
        btn.textContent = '🌙';
        localStorage.setItem('textRPG_theme', 'light');
    } else {
        html.setAttribute('data-theme', 'dark');
        btn.textContent = '☀️';
        localStorage.setItem('textRPG_theme', 'dark');
    }
}

function initTheme() {
    const savedTheme = localStorage.getItem('textRPG_theme');
    const btn = document.getElementById('btnToggleTheme');
    
    if (savedTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        btn.textContent = '☀️';
    } else {
        btn.textContent = '🌙';
    }
}

// ==================== 卡片折叠 ====================
function onToggleCard(btn) {
    const card = btn.closest('.card');
    const content = card.querySelector('.card-content');
    
    if (content.classList.contains('collapsed')) {
        content.classList.remove('collapsed');
        btn.classList.remove('collapsed');
        btn.textContent = '▼';
    } else {
        content.classList.add('collapsed');
        btn.classList.add('collapsed');
        btn.textContent = '▶';
    }
}

// ==================== 复活 ====================
async function onRevive() {
    try {
        const result = await gameAPI.revive();
        if (result.success) {
            addLog('✅ ' + result.message, 'success');
        } else if (result.remainingMs) {
            const seconds = Math.ceil(result.remainingMs / 1000);
            addLog(`复活时间未到，还需等待 ${seconds} 秒`, 'system');
        }
    } catch (error) {
        addLog('请求失败: ' + error.message, 'error');
    }
}

// ==================== 游戏流程 ====================
async function onNewGame() {
    const name = elements.playerName.value.trim() || '勇者';
    const classType = document.querySelector('input[name="classType"]:checked').value;
    
    try {
        const result = await gameAPI.newGame(name, classType);
        if (result.success) {
            showGameScreen();
            addLog(result.message, 'system');
            startReviveCheck();
        } else {
            alert('创建角色失败：' + (result.reason || '未知错误'));
        }
    } catch (error) {
        alert('请求失败: ' + error.message);
    }
}

async function onLoadGame() {
    try {
        const result = await gameAPI.load();
        if (result.success) {
            showGameScreen();
            addLog('游戏已加载', 'system');
            startReviveCheck();
            
            // 检查是否有进行中的离线战斗
            await checkOfflineFarmStatus();
        } else {
            alert('没有找到存档！');
        }
    } catch (error) {
        alert('请求失败: ' + error.message);
    }
}

function showGameScreen() {
    elements.newGameScreen.classList.add('hidden');
    elements.gameScreen.classList.remove('hidden');
}

function startReviveCheck() {
    // 避免重复创建定时器
    if (reviveCheckInterval) {
        clearInterval(reviveCheckInterval);
    }
    
    // 每秒检查复活状态
    reviveCheckInterval = setInterval(async () => {
        if (currentState && currentState.player && currentState.player.isDead) {
            // 客户端自己计算剩余时间
            const reviveTime = currentState.player.reviveTime;
            const now = Date.now();
            const remaining = reviveTime ? Math.max(0, reviveTime - now) : 0;
            
            // 更新 UI 显示
            const reviveTimerEl = document.getElementById('reviveTimer');
            if (reviveTimerEl) {
                const seconds = Math.ceil(remaining / 1000);
                if (remaining > 0) {
                    reviveTimerEl.textContent = `⏳ 自动复活倒计时: ${seconds}秒`;
                } else {
                    reviveTimerEl.textContent = '✨ 正在自动复活...';
                }
            }
            
            if (remaining <= 0) {
                // 复活时间到，自动复活
                try {
                    const result = await gameAPI.revive();
                    if (result.success) {
                        addLog('✅ 自动复活成功！', 'success');
                        
                        // 如果之前在自动刷怪，恢复刷怪
                        if (wasAutoFarming) {
                            wasAutoFarming = false;
                            setTimeout(() => {
                                onStartAutoFarm();
                                addLog('🔄 自动刷怪已恢复', 'system');
                            }, 1000);
                        }
                    }
                } catch (error) {
                    console.error('[ReviveCheck] Error:', error);
                }
            }
        }
    }, 1000);
}

// ==================== 属性加点 ====================
async function onAddPointClick(stat) {
    if (!currentState || !currentState.player || currentState.player.unusedPoints <= 0) {
        addLog('没有可用的属性点！', 'system');
        return;
    }
    
    selectedStat = stat;
    elements.addPointsActions.classList.remove('hidden');
    elements.addPointsInput.focus();
}

async function onConfirmAddPoints() {
    if (!selectedStat) return;
    
    const points = parseInt(elements.addPointsInput.value) || 1;
    
    try {
        const result = await gameAPI.addPoints(selectedStat, points);
        if (result.success) {
            addLog(result.message, 'success');
        } else {
            addLog('加点失败：' + (result.reason || '未知错误'), 'system');
        }
    } catch (error) {
        addLog('请求失败: ' + error.message, 'error');
    }
    
    onCancelAddPoints();
}

function onCancelAddPoints() {
    selectedStat = null;
    elements.addPointsActions.classList.add('hidden');
    elements.addPointsInput.value = '1';
}

// ==================== 战斗系统 ====================
async function onStartBattle() {
    // 战斗前检查血量，自动吃药
    if (currentState && currentState.player && !currentState.player.isDead) {
        const hpPercent = currentState.player.currentHp / currentState.player.maxHp;
        if (hpPercent < 0.7) {
            await gameAPI.autoUsePotion();
        }
    }
    
    try {
        const result = await gameAPI.startBattle();
        if (result.success) {
            addLog(`遭遇敌人：${result.enemy.name} (Lv.${result.enemy.level})${result.enemy.isBoss ? ' 【BOSS】' : ''}`, 'battle');
            
            // 如果自动战斗已开启
            if (autoBattleEnabled) {
                setTimeout(async () => {
                    const autoResult = await gameAPI.autoBattle();
                    if (autoResult.success) {
                        addLog(`⚡ 自动战斗结束，共 ${autoResult.rounds} 回合`, 'system');
                        
                        // 战斗后检查血量
                        if (currentState && currentState.player && !currentState.player.isDead) {
                            const newHpPercent = currentState.player.currentHp / currentState.player.maxHp;
                            if (newHpPercent < 0.7) {
                                await gameAPI.autoUsePotion();
                            }
                        }
                    }
                }, 500);
            }
        } else if (result.reason === 'cooldown') {
            addLog('战斗冷却中，请稍后再试...', 'system');
        }
    } catch (error) {
        addLog('请求失败: ' + error.message, 'error');
    }
}

async function onBattleRound() {
    try {
        await gameAPI.battleRound();
    } catch (error) {
        addLog('请求失败: ' + error.message, 'error');
    }
}

function onToggleAutoBattle() {
    const checkbox = document.getElementById('autoBattleToggle');
    const status = document.getElementById('autoBattleStatus');
    
    autoBattleEnabled = checkbox.checked;
    
    if (autoBattleEnabled) {
        status.textContent = '✅ 自动战斗已开启';
        localStorage.setItem('textRPG_autoBattle', 'true');
        addLog('⚡ 自动战斗已开启', 'system');
    } else {
        status.textContent = '';
        localStorage.setItem('textRPG_autoBattle', 'false');
        addLog('⚡ 自动战斗已关闭', 'system');
    }
}

function initAutoBattle() {
    const saved = localStorage.getItem('textRPG_autoBattle');
    const checkbox = document.getElementById('autoBattleToggle');
    const status = document.getElementById('autoBattleStatus');
    
    if (!checkbox || !status) return;
    
    if (saved === 'true') {
        autoBattleEnabled = true;
        checkbox.checked = true;
        status.textContent = '✅ 自动战斗已开启';
    } else {
        autoBattleEnabled = false;
        checkbox.checked = false;
    }
}

// ==================== 自动刷怪 ====================
async function onStartAutoFarm() {
    const interval = parseInt(document.getElementById('autoFarmInterval').value) || 10;
    
    if (interval < 5) {
        alert('间隔时间不能少于 5 秒！');
        return;
    }
    
    document.getElementById('btnStartAutoFarm').classList.add('hidden');
    document.getElementById('btnStopAutoFarm').classList.remove('hidden');
    document.getElementById('autoFarmInterval').disabled = true;
    
    await runAutoFarmCycle();
    autoFarmTimer = setInterval(runAutoFarmCycle, interval * 1000);
    
    updateAutoFarmStatus(`🔄 刷怪中… 每 ${interval} 秒一场`);
    addLog(`🔄 自动刷怪已启动（间隔 ${interval} 秒）`, 'system');
}

function onStopAutoFarm() {
    if (autoFarmTimer) {
        clearInterval(autoFarmTimer);
        autoFarmTimer = null;
    }
    
    wasAutoFarming = false;
    
    document.getElementById('btnStartAutoFarm').classList.remove('hidden');
    document.getElementById('btnStopAutoFarm').classList.add('hidden');
    document.getElementById('autoFarmInterval').disabled = false;
    
    updateAutoFarmStatus('');
    addLog('⏹️ 自动刷怪已停止', 'system');
}

async function runAutoFarmCycle() {
    if (!currentState || !currentState.player) return;
    
    // 检查死亡状态
    if (currentState.player.isDead) {
        const reviveTime = currentState.player.reviveTime;
        const now = Date.now();
        const remaining = reviveTime ? Math.max(0, reviveTime - now) : 0;
        if (remaining > 0) {
            const seconds = Math.ceil(remaining / 1000);
            updateAutoFarmStatus(`💀 已死亡，等待复活... ${seconds}秒`);
            return;
        }
    }
    
    // 战斗前自动吃药
    if (!currentState.player.isDead) {
        const hpPercent = currentState.player.currentHp / currentState.player.maxHp;
        if (hpPercent < 0.7) {
            await gameAPI.autoUsePotion();
        }
    }
    
    try {
        const result = await gameAPI.startBattle();
        if (!result.success) {
            if (result.reason === 'no_player') {
                onStopAutoFarm();
                addLog('❌ 请先开始新游戏！', 'error');
            }
            return;
        }
        
        updateAutoFarmStatus(`⚔️ 战斗中：${result.enemy.name}`);
        
        // 自动打完
        setTimeout(async () => {
            const autoResult = await gameAPI.autoBattle();
            
            if (autoResult.success) {
                updateAutoFarmStatus(`✅ 胜利！共 ${autoResult.rounds} 回合`);
                addLog(`📊 刷怪进度：+${autoResult.rounds} 回合战斗`, 'system');
                
                // 战斗后自动吃药
                if (currentState && currentState.player && !currentState.player.isDead) {
                    const hpPercent = currentState.player.currentHp / currentState.player.maxHp;
                    if (hpPercent < 0.7) {
                        await gameAPI.autoUsePotion();
                    }
                }
            } else {
                updateAutoFarmStatus(`❌ 战斗失败`);
                
                if (autoFarmTimer) {
                    wasAutoFarming = true;
                }
                
                onStopAutoFarm();
            }
        }, 500);
    } catch (error) {
        updateAutoFarmStatus(`❌ 请求失败`);
        addLog('请求失败: ' + error.message, 'error');
    }
}

function updateAutoFarmStatus(message) {
    const statusEl = document.getElementById('autoFarmStatus');
    if (statusEl) {
        statusEl.textContent = message;
    }
}

// ==================== 商店系统 ====================
function onOpenShop() {
    elements.shopPanel.classList.remove('hidden');
    updateShopDisplay();
}

function onCloseShop() {
    elements.shopPanel.classList.add('hidden');
}

function updateShopDisplay() {
    if (currentState && currentState.player) {
        elements.shopGoldDisplay.textContent = currentState.player.gold;
    }
}

async function onBuyPotion(potionType) {
    try {
        const result = await gameAPI.buyPotion(potionType);
        if (result.success) {
            addLog(result.message, 'success');
            updateShopDisplay();
        } else if (result.reason === 'not_enough_gold') {
            addLog(`金币不足！需要 ${result.required}，当前 ${result.current}`, 'system');
        }
    } catch (error) {
        addLog('请求失败: ' + error.message, 'error');
    }
}

// ==================== 药品使用 ====================
function onOpenPotionPanel() {
    elements.potionPanel.classList.remove('hidden');
    updatePotionDisplay();
}

function onClosePotionPanel() {
    elements.potionPanel.classList.add('hidden');
}

function updatePotionDisplay() {
    if (!currentState || !currentState.player) return;
    
    const potions = currentState.player.potions;
    document.getElementById('potionSmallCount').textContent = potions.small;
    document.getElementById('potionMediumCount').textContent = potions.medium;
    document.getElementById('potionLargeCount').textContent = potions.large;
}

async function onUsePotion(potionType) {
    try {
        const result = await gameAPI.usePotion(potionType);
        if (result.success) {
            addLog(result.message, 'success');
            updatePotionDisplay();
            
            if (currentState && currentState.battle && currentState.battle.inBattle) {
                addLog(`💚 当前血量：${result.currentHp}/${currentState.player.maxHp}`, 'battle');
            }
        } else if (result.reason === 'no_potion') {
            addLog('没有该类型药品！', 'system');
        }
    } catch (error) {
        addLog('请求失败: ' + error.message, 'error');
    }
}

// ==================== 离线战斗 ====================
async function onStartOfflineFarm() {
    const interval = parseInt(document.getElementById('offlineFarmInterval').value) || 10;
    
    if (interval < 5) {
        alert('间隔时间不能少于 5 秒！');
        return;
    }
    
    try {
        const result = await gameAPI.startOfflineFarm(interval);
        if (result.success) {
            // 显示提示
            alert(`📴 离线战斗已启动！\n\n后端将自动战斗，您可以关闭页面。\n重新连接并读取存档可查看战斗进度。`);
            
            // 断开连接，回到连接页面
            gameAPI.disconnect();
            elements.gameScreen.classList.add('hidden');
            elements.newGameScreen.classList.add('hidden');
            elements.connectScreen.classList.remove('hidden');
            elements.connectionStatus.textContent = '📴 离线战斗进行中...';
            
            // 清空日志
            elements.battleLog.innerHTML = '<div class="log-entry system">等待开始冒险...</div>';
        } else {
            if (result.reason === 'already_farming') {
                addLog('离线战斗已在进行中', 'system');
            } else if (result.reason === 'player_dead') {
                addLog('角色已死亡，无法开始离线战斗', 'system');
            }
        }
    } catch (error) {
        addLog('请求失败: ' + error.message, 'error');
    }
}

async function onStopOfflineFarm() {
    try {
        const result = await gameAPI.stopOfflineFarm();
        if (result.success) {
            document.getElementById('btnStartOfflineFarm').classList.remove('hidden');
            document.getElementById('btnStopOfflineFarm').classList.add('hidden');
            document.getElementById('offlineFarmInterval').disabled = false;
            
            // 显示战斗统计
            const stats = result.stats;
            addLog(`📴 离线战斗结束！`, 'success');
            addLog(`📊 统计：${stats.durationFormatted}，${stats.battles}场战斗，${stats.wins}胜`, 'system');
            addLog(`💰 获得：${stats.expGained}经验，${stats.goldGained}金币`, 'system');
            if (stats.potionsUsed > 0) {
                addLog(`🧪 使用药品：${stats.potionsUsed}瓶`, 'system');
            }
            
            updateOfflineFarmStatus('');
        }
    } catch (error) {
        addLog('请求失败: ' + error.message, 'error');
    }
}

function updateOfflineFarmStatus(message) {
    const statusEl = document.getElementById('offlineFarmStatus');
    if (statusEl) {
        statusEl.textContent = message;
    }
}

// 检查离线战斗状态（连接时调用）
async function checkOfflineFarmStatus() {
    try {
        const status = await gameAPI.getOfflineFarmStatus();
        if (status.active) {
            document.getElementById('btnStartOfflineFarm').classList.add('hidden');
            document.getElementById('btnStopOfflineFarm').classList.remove('hidden');
            document.getElementById('offlineFarmInterval').disabled = true;
            
            const stats = status.stats;
            updateOfflineFarmStatus(`📴 离线战斗进行中... 已战斗 ${stats.battles} 场`);
            addLog(`📴 检测到进行中的离线战斗，已战斗 ${stats.durationFormatted}`, 'system');
        }
    } catch (error) {
        // 忽略
    }
}

// ==================== 存档系统 ====================
async function onSaveGame() {
    try {
        const result = await gameAPI.save();
        if (result.success) {
            showSaveStatus('游戏已保存 ✓', 'success');
            addLog('游戏已保存', 'success');
        } else {
            showSaveStatus('保存失败：' + result.reason, 'error');
        }
        
        setTimeout(() => {
            elements.saveStatus.className = 'save-status';
            elements.saveStatus.textContent = '';
        }, 3000);
    } catch (error) {
        addLog('请求失败: ' + error.message, 'error');
    }
}

function showSaveStatus(message, type) {
    elements.saveStatus.textContent = message;
    elements.saveStatus.className = `save-status ${type}`;
}

async function onExportData() {
    try {
        const state = await gameAPI.exportData();
        const dataStr = JSON.stringify(state, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `text-rpg-save-${Date.now()}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
        addLog('数据已导出', 'success');
    } catch (error) {
        addLog('请求失败: ' + error.message, 'error');
    }
}

async function onImportData(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            const state = JSON.parse(e.target.result);
            const result = await gameAPI.importData(state);
            if (result.success) {
                addLog('数据已导入', 'success');
            } else {
                alert('导入失败：' + result.reason);
            }
        } catch (err) {
            alert('导入失败：' + err.message);
        }
    };
    reader.readAsText(file);
    
    elements.importFile.value = '';
}

async function onResetGame() {
    if (confirm('确定要重置游戏吗？所有进度将丢失！')) {
        try {
            await gameAPI.reset();
            elements.gameScreen.classList.add('hidden');
            elements.newGameScreen.classList.remove('hidden');
            elements.battleLog.innerHTML = '<div class="log-entry system">等待开始冒险...</div>';
            addLog('游戏已重置', 'system');
        } catch (error) {
            addLog('请求失败: ' + error.message, 'error');
        }
    }
}

// ==================== UI 更新 ====================
function updateUIWithState(state) {
    if (!state || !state.player) return;
    
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
    
    // 金币和药品
    if (elements.playerGold) {
        elements.playerGold.textContent = player.gold;
    }
    if (elements.playerPotions) {
        const potions = player.potions;
        elements.playerPotions.textContent = `小(${potions.small}) 中(${potions.medium}) 大(${potions.large})`;
    }
    
    // 头部血量条
    const hpBarEl = document.getElementById('hpBar');
    const hpDisplayEl = document.getElementById('statHpDisplay');
    if (hpBarEl) {
        const hpPercent = (player.currentHp / player.maxHp) * 100;
        hpBarEl.style.width = `${hpPercent}%`;
    }
    if (hpDisplayEl) {
        hpDisplayEl.textContent = `${player.currentHp}/${player.maxHp}`;
    }
    
    // 死亡状态
    if (player.isDead) {
        elements.deathStatus.classList.remove('hidden');
        if (hpBarEl) hpBarEl.style.width = '0%';
        if (hpDisplayEl) hpDisplayEl.textContent = '💀 已死亡';
        
        // 客户端计算剩余时间（不依赖服务器的 reviveRemaining）
        const reviveTime = player.reviveTime;
        const now = Date.now();
        const remaining = reviveTime ? Math.max(0, reviveTime - now) : 0;
        const seconds = Math.ceil(remaining / 1000);
        
        if (remaining > 0) {
            elements.reviveTimer.textContent = `⏳ 自动复活倒计时: ${seconds}秒`;
        } else {
            elements.reviveTimer.textContent = '✨ 正在自动复活...';
        }
    } else {
        elements.deathStatus.classList.add('hidden');
    }
    
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
    elements.cooldownTimer.textContent = formatTime(battle.cooldownRemaining);
    elements.totalBattles.textContent = battle.battleCount;
    elements.winRate.textContent = `${battle.winRate}%`;
    
    // 敌人信息
    if (battle.inBattle && battle.currentEnemy) {
        elements.enemyInfo.classList.remove('hidden');
        elements.btnBattleRound.classList.remove('hidden');
        elements.btnStartBattle.classList.add('hidden');
        
        elements.enemyName.textContent = `${battle.currentEnemy.name} ${battle.currentEnemy.isBoss ? '【BOSS】' : ''}`;
        elements.enemyLevel.textContent = battle.currentEnemy.level;
        elements.enemyHp.textContent = `${battle.currentEnemy.currentHp}/${battle.currentEnemy.maxHp} HP`;
        
        const hpPercent = (battle.currentEnemy.currentHp / battle.currentEnemy.maxHp) * 100;
        elements.enemyHpBar.style.width = `${hpPercent}%`;
    } else {
        elements.enemyInfo.classList.add('hidden');
        elements.btnBattleRound.classList.add('hidden');
        elements.btnStartBattle.classList.remove('hidden');
        
        if (player.isDead) {
            elements.btnStartBattle.disabled = true;
            elements.btnStartBattle.textContent = '💀 已死亡，无法战斗';
        } else {
            elements.btnStartBattle.disabled = false;
            elements.btnStartBattle.textContent = '🔍 寻找敌人';
        }
    }
    
    // 保存按钮状态
    elements.btnSave.disabled = !state.gameInfo.canSave;
    elements.btnSave.textContent = state.gameInfo.canSave ? '💾 保存进度' : '🚫 战斗中无法保存';
}

function formatTime(ms) {
    const seconds = Math.floor(ms / 1000);
    return `${seconds}s`;
}

function addLog(message, type = 'system') {
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    elements.battleLog.appendChild(entry);
    elements.battleLog.scrollTop = elements.battleLog.scrollHeight;
}