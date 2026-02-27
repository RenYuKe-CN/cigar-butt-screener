/**
 * 烟蒂股筛选器 - 数据缓存管理
 */

const Cache = {
    // 内存缓存
    memory: new Map(),

    // 缓存配置（毫秒）
    TTL: {
        indices: 30000,      // 指数 30秒
        stockList: 60000,    // 股票列表 1分钟
        filterResult: 30000, // 筛选结果 30秒
        stockDetail: 300000, // 股票详情 5分钟
    },

    /**
     * 生成缓存键
     */
    key(type, params = {}) {
        const sorted = Object.keys(params).sort().map(k => `${k}=${params[k]}`).join('&');
        return `${type}:${sorted}`;
    },

    /**
     * 获取缓存
     */
    get(type, params = {}) {
        const key = this.key(type, params);
        const item = this.memory.get(key);

        if (!item) return null;

        // 检查是否过期
        if (Date.now() - item.timestamp > item.ttl) {
            this.memory.delete(key);
            return null;
        }

        return item.data;
    },

    /**
     * 设置缓存
     */
    set(type, params = {}, data, ttl = 60000) {
        const key = this.key(type, params);
        this.memory.set(key, {
            data,
            timestamp: Date.now(),
            ttl,
        });
    },

    /**
     * 删除缓存
     */
    delete(type, params = {}) {
        const key = this.key(type, params);
        this.memory.delete(key);
    },

    /**
     * 清空缓存
     */
    clear() {
        this.memory.clear();
    },

    /**
     * 获取缓存统计
     */
    stats() {
        let total = 0;
        let expired = 0;
        const now = Date.now();

        for (const [key, item] of this.memory) {
            total++;
            if (now - item.timestamp > item.ttl) {
                expired++;
            }
        }

        return { total, expired, valid: total - expired };
    },

    /**
     * 清理过期缓存
     */
    cleanup() {
        const now = Date.now();
        for (const [key, item] of this.memory) {
            if (now - item.timestamp > item.ttl) {
                this.memory.delete(key);
            }
        }
    },

    // ========== 带缓存的 API 包装 ==========

    /**
     * 获取市场指数（带缓存）
     */
    async getMarketIndices() {
        const cached = this.get('indices');
        if (cached) {
            console.log('[Cache] 使用缓存的指数数据');
            return cached;
        }

        const data = await API.getMarketIndices();
        this.set('indices', {}, data, this.TTL.indices);
        return data;
    },

    /**
     * 获取股票列表（带缓存）
     */
    async getStockList(market, page = 1, pageSize = 100) {
        const cacheKey = { market, page, pageSize };
        const cached = this.get('stockList', cacheKey);
        if (cached) {
            console.log('[Cache] 使用缓存的股票列表');
            return cached;
        }

        const data = await API.getStockList(market, page, pageSize);
        this.set('stockList', cacheKey, data, this.TTL.stockList);
        return data;
    },

    /**
     * 筛选股票（带缓存）
     */
    async filterStocks(params) {
        const cacheKey = { ...params };
        const cached = this.get('filterResult', cacheKey);
        if (cached) {
            console.log('[Cache] 使用缓存的筛选结果');
            return cached;
        }

        const data = await API.filterStocks(params);
        this.set('filterResult', cacheKey, data, this.TTL.filterResult);
        return data;
    },

    /**
     * 强制刷新（跳过缓存）
     */
    async refresh(type, ...args) {
        this.delete(type, args[0] || {});

        switch (type) {
            case 'indices':
                return this.getMarketIndices();
            case 'stockList':
                return this.getStockList(...args);
            case 'filterResult':
                return this.filterStocks(...args);
            default:
                return null;
        }
    },
};

// 定期清理过期缓存（每5分钟）
setInterval(() => {
    Cache.cleanup();
    console.log('[Cache] 清理完成，统计:', Cache.stats());
}, 5 * 60 * 1000);

// 导出
window.Cache = Cache;
