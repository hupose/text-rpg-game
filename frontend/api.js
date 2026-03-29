/**
 * Text RPG - API Client
 * WebSocket 长连接 + RESTful API fallback
 */

class GameAPI {
    constructor() {
        this.baseUrl = '';
        this.gameId = 'default';
        this.connected = false;
        this.socket = null;
        this.onStateUpdate = null;
        this.onBattleLog = null;
        this.onActionResult = null;
    }
    
    // 设置服务器地址
    setBaseUrl(url) {
        this.baseUrl = url.replace(/\/+$/, '');
    }
    
    // 设置游戏 ID
    setGameId(id) {
        this.gameId = id || 'default';
    }
    
    // 连接 WebSocket
    connect() {
        return new Promise((resolve, reject) => {
            // 动态加载 socket.io-client
            if (typeof io === 'undefined') {
                const script = document.createElement('script');
                script.src = `${this.baseUrl}/socket.io/socket.io.js`;
                script.onload = () => this.initSocket(resolve, reject);
                script.onerror = () => reject(new Error('Failed to load socket.io'));
                document.head.appendChild(script);
            } else {
                this.initSocket(resolve, reject);
            }
        });
    }
    
    initSocket(resolve, reject) {
        try {
            this.socket = io(this.baseUrl, {
                transports: ['websocket', 'polling']
            });
            
            this.socket.on('connect', () => {
                console.log('[WS] Connected');
                this.connected = true;
                this.socket.emit('join-game', this.gameId);
                resolve();
            });
            
            this.socket.on('disconnect', () => {
                console.log('[WS] Disconnected');
                this.connected = false;
            });
            
            this.socket.on('connect_error', (error) => {
                console.error('[WS] Connection error:', error);
                reject(error);
            });
            
            // 状态更新
            this.socket.on('state-update', (state) => {
                console.log('[WS] State update received');
                if (this.onStateUpdate) {
                    this.onStateUpdate(state);
                }
            });
            
            // 战斗日志
            this.socket.on('battle-log', (data) => {
                if (this.onBattleLog) {
                    this.onBattleLog(data);
                }
            });
            
            // 操作结果
            this.socket.on('action-result', (result) => {
                if (this.onActionResult) {
                    this.onActionResult(result);
                }
            });
            
        } catch (error) {
            reject(error);
        }
    }
    
    // 断开连接
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
        this.connected = false;
    }
    
    // ==================== 游戏 API ====================
    
    // 发送事件
    emit(event, data = {}) {
        return new Promise((resolve, reject) => {
            if (!this.socket || !this.connected) {
                reject(new Error('Not connected'));
                return;
            }
            
            // 临时监听结果
            const handler = (result) => {
                this.socket.off('action-result', handler);
                resolve(result);
            };
            this.socket.on('action-result', handler);
            this.socket.emit(event, data);
            
            // 超时
            setTimeout(() => {
                this.socket.off('action-result', handler);
                reject(new Error('Timeout'));
            }, 10000);
        });
    }
    
    // 获取状态
    async getState() {
        return new Promise((resolve) => {
            if (!this.socket || !this.connected) {
                resolve(null);
                return;
            }
            
            const handler = (state) => {
                this.socket.off('state-update', handler);
                resolve(state);
            };
            this.socket.on('state-update', handler);
            this.socket.emit('get-state');
            
            setTimeout(() => {
                this.socket.off('state-update', handler);
                resolve(null);
            }, 5000);
        });
    }
    
    // 新游戏
    async newGame(name, classType) {
        return this.emit('new-game', { name, classType });
    }
    
    // 加载游戏
    async load() {
        return this.emit('load-game');
    }
    
    // 保存游戏
    async save() {
        return this.emit('save-game');
    }
    
    // 加点
    async addPoints(stat, points) {
        return this.emit('add-points', { stat, points });
    }
    
    // 开始战斗
    async startBattle() {
        return this.emit('start-battle');
    }
    
    // 战斗回合
    async battleRound() {
        return this.emit('battle-round');
    }
    
    // 自动战斗
    async autoBattle(autoContinue = false) {
        return this.emit('auto-battle', { autoContinue });
    }
    
    // 购买药品
    async buyPotion(potionType) {
        return this.emit('buy-potion', { potionType });
    }
    
    // 使用药品
    async usePotion(potionType) {
        return this.emit('use-potion', { potionType });
    }
    
    // 自动使用药品
    async autoUsePotion() {
        return this.emit('auto-use-potion');
    }
    
    // 复活
    async revive() {
        return this.emit('revive');
    }
    
    // 离线战斗
    async startOfflineFarm(interval = 10) {
        return this.emit('start-offline-farm', { interval });
    }
    
    async stopOfflineFarm() {
        return this.emit('stop-offline-farm');
    }
    
    async getOfflineFarmStatus() {
        return new Promise((resolve) => {
            if (!this.socket || !this.connected) {
                resolve({ active: false });
                return;
            }
            
            const handler = (status) => {
                this.socket.off('offline-farm-status', handler);
                resolve(status);
            };
            this.socket.on('offline-farm-status', handler);
            this.socket.emit('get-offline-farm-status');
            
            setTimeout(() => {
                this.socket.off('offline-farm-status', handler);
                resolve({ active: false });
            }, 5000);
        });
    }
    
    // 重置游戏
    async reset() {
        return this.emit('reset-game');
    }
    
    // 导出数据（使用 REST API）
    async exportData() {
        const response = await fetch(`${this.baseUrl}/api/export`, {
            headers: { 'X-Game-Id': this.gameId }
        });
        return response.json();
    }
    
    // 导入数据（使用 REST API）
    async importData(data) {
        const response = await fetch(`${this.baseUrl}/api/import`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Game-Id': this.gameId
            },
            body: JSON.stringify(data)
        });
        return response.json();
    }
}

// 全局 API 实例
const gameAPI = new GameAPI();