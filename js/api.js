/**
 * 烟蒂股筛选器 - 数据接口
 * 调用后端 FastAPI 服务（代理腾讯财经）
 */

// 自动检测API地址
const API_BASE_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:8000' 
    : 'http://' + window.location.hostname + ':8000';

const API = {
    /**
     * 获取市场指数
     */
    async getMarketIndices() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/market/indices`);
            const result = await response.json();

            if (result.success) {
                return result.data.map(item => ({
                    code: item.code,
                    name: item.name,
                    price: item.price,
                    change: item.change,
                    changePercent: item.changePercent,
                }));
            }
            return [];
        } catch (error) {
            console.error('获取指数失败:', error);
            return this.getMockIndices();
        }
    },

    /**
     * 获取 A 股列表
     */
    async getAStockList(page = 1, pageSize = 100) {
        try {
            const response = await fetch(
                `${API_BASE_URL}/api/stocks/a-share?page=${page}&pageSize=${pageSize}`
            );
            const result = await response.json();

            if (result.success) {
                return {
                    stocks: result.data,
                    total: result.total,
                    page: result.page,
                    pageSize: result.pageSize,
                };
            }
            return { stocks: [], total: 0 };
        } catch (error) {
            console.error('获取A股列表失败:', error);
            return { stocks: this.getMockAStocks(), total: 15 };
        }
    },

    /**
     * 获取港股列表
     */
    async getHKStockList(page = 1, pageSize = 100) {
        try {
            const response = await fetch(
                `${API_BASE_URL}/api/stocks/hk?page=${page}&pageSize=${pageSize}`
            );
            const result = await response.json();

            if (result.success) {
                return {
                    stocks: result.data,
                    total: result.total,
                    page: result.page,
                    pageSize: result.pageSize,
                };
            }
            return { stocks: [], total: 0 };
        } catch (error) {
            console.error('获取港股列表失败:', error);
            return { stocks: this.getMockHKStocks(), total: 15 };
        }
    },

    /**
     * 根据市场获取股票列表
     */
    async getStockList(market, page = 1, pageSize = 100) {
        if (market === 'a股') {
            return this.getAStockList(page, pageSize);
        } else if (market === '港股') {
            return this.getHKStockList(page, pageSize);
        }
        return { stocks: [], total: 0 };
    },

    /**
     * 筛选烟蒂股
     */
    async filterStocks(params) {
        const {
            market = 'a股',
            peMax,
            pbMax,
            dividendYieldMin,
            marketCapMax,
            page = 1,
            pageSize = 50,
        } = params;

        try {
            const queryParams = new URLSearchParams({
                market,
                page: String(page),
                pageSize: String(pageSize),
            });

            if (peMax !== undefined && peMax !== null) {
                queryParams.append('peMax', String(peMax));
            }
            if (pbMax !== undefined && pbMax !== null) {
                queryParams.append('pbMax', String(pbMax));
            }
            if (dividendYieldMin !== undefined && dividendYieldMin !== null) {
                queryParams.append('dividendYieldMin', String(dividendYieldMin));
            }
            if (marketCapMax !== undefined && marketCapMax !== null) {
                queryParams.append('marketCapMax', String(marketCapMax));
            }

            const url = `${API_BASE_URL}/api/stocks/filter?${queryParams.toString()}`;
            console.log('[API] 请求URL:', url);
            
            const response = await fetch(url);
            console.log('[API] 响应状态:', response.status);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            console.log('[API] 响应结果:', result.success ? '成功' : '失败');

            if (result.success) {
                return {
                    stocks: result.data,
                    total: result.total,
                    page: result.page,
                    pageSize: result.pageSize,
                    updateTime: result.updateTime,
                };
            }
            return { stocks: [], total: 0 };
        } catch (error) {
            console.error('筛选股票失败:', error);
            throw error; // 抛出错误让上层处理
        }
    },

    // ========== 模拟数据（备用） ==========

    getMockIndices() {
        return [
            { code: 'sh000001', name: '上证指数', price: 4147.23, change: 29.82, changePercent: 0.72 },
            { code: 'sz399001', name: '深证成指', price: 14475.87, change: 184.30, changePercent: 1.29 },
            { code: 'hkHSI', name: '恒生指数', price: 16500.50, change: 50.30, changePercent: 0.31 },
        ];
    },

    getMockAStocks() {
        return [
            { code: 'sh601398', name: '工商银行', price: 4.85, pe: 4.8, pb: 0.55, marketCap: 17000, changePercent: 0.21 },
            { code: 'sh601857', name: '中国石油', price: 8.25, pe: 8.5, pb: 0.85, marketCap: 15000, changePercent: -0.36 },
            { code: 'sh600036', name: '招商银行', price: 32.50, pe: 5.2, pb: 0.65, marketCap: 8500, changePercent: 0.62 },
            { code: 'sh601288', name: '农业银行', price: 3.95, pe: 4.5, pb: 0.52, marketCap: 12000, changePercent: 0.25 },
            { code: 'sh601988', name: '中国银行', price: 3.65, pe: 4.6, pb: 0.48, marketCap: 11000, changePercent: 0.27 },
        ];
    },

    getMockHKStocks() {
        return [
            { code: 'hk00700', name: '腾讯控股', price: 385.60, pe: 15.2, pb: 3.8, marketCap: 36800, changePercent: 1.42 },
            { code: 'hk09988', name: '阿里巴巴', price: 78.90, pe: 12.8, pb: 1.6, marketCap: 16500, changePercent: 1.81 },
            { code: 'hk01398', name: '工商银行', price: 4.25, pe: 3.5, pb: 0.32, marketCap: 18000, changePercent: 0.24 },
            { code: 'hk00939', name: '建设银行', price: 5.85, pe: 3.8, pb: 0.35, marketCap: 12000, changePercent: 0.34 },
            { code: 'hk01288', name: '农业银行', price: 3.45, pe: 3.2, pb: 0.28, marketCap: 11000, changePercent: 0.29 },
        ];
    },
};

// 导出
window.API = API;
