/**
 * 烟蒂股筛选器 - 策略引擎 (支持混合逻辑)
 * 每个条件之间可单独设置 且/或 关系
 */

// 可用字段定义
const STRATEGY_FIELDS = {
    pe: { name: 'pe', label: '市盈率(PE)', type: 'number', unit: '倍', min: 0, max: 1000, step: 0.1 },
    pb: { name: 'pb', label: '市净率(PB)', type: 'number', unit: '倍', min: 0, max: 100, step: 0.01 },
    dividendYield: { name: 'dividendYield', label: '股息率', type: 'number', unit: '%', min: 0, max: 50, step: 0.1 },
    marketCap: { name: 'marketCap', label: '总市值', type: 'number', unit: '亿', min: 0, max: 1000000, step: 1 },
    floatMarketCap: { name: 'floatMarketCap', label: '流通市值', type: 'number', unit: '亿', min: 0, max: 1000000, step: 1 },
    turnoverRate: { name: 'turnoverRate', label: '换手率', type: 'number', unit: '%', min: 0, max: 100, step: 0.01 },
    price: { name: 'price', label: '股价', type: 'number', unit: '元', min: 0, max: 10000, step: 0.01 },
    changePercent: { name: 'changePercent', label: '涨跌幅', type: 'number', unit: '%', min: -20, max: 20, step: 0.01 },
    volume: { name: 'volume', label: '成交量', type: 'number', unit: '手', min: 0, max: 1000000000, step: 1 },
};

// 运算符定义
const OPERATORS = {
    gt: { symbol: '>', label: '大于' },
    gte: { symbol: '>=', label: '大于等于' },
    lt: { symbol: '<', label: '小于' },
    lte: { symbol: '<=', label: '小于等于' },
    eq: { symbol: '=', label: '等于' },
    between: { symbol: '~', label: '区间' },
};

// 计算运算符
const CALC_OPERATORS = {
    mul: { symbol: '×', label: '乘以' },
    div: { symbol: '÷', label: '除以' },
    add: { symbol: '+', label: '加上' },
    sub: { symbol: '-', label: '减去' },
};

// 逻辑连接符
const LOGIC_OPS = {
    and: { symbol: '&&', label: '且', color: 'blue' },
    or: { symbol: '||', label: '或', color: 'purple' },
};

// 策略编辑器
class StrategyEditor {
    constructor() {
        this.conditions = [];  // 每个条件包含 logicOp (与前一个条件的连接方式)
        this.name = '';
        this.description = '';
        this.onChange = null;
    }

    // 添加简单条件
    addCondition(field = 'pb', operator = 'lt', value = 1, value2 = null, logicOp = 'and') {
        const condition = {
            id: Date.now() + Math.random(),
            type: 'simple',
            field,
            operator,
            value,
            value2,
            logicOp,  // 与前一个条件的连接方式 ('and' 或 'or')
        };
        this.conditions.push(condition);
        this.triggerChange();
        return condition;
    }

    // 添加计算条件（如 PE*PB < 22.5）
    addCalcCondition(field1 = 'pe', calcOp = 'mul', field2 = 'pb', operator = 'lt', value = 22.5, logicOp = 'and') {
        const condition = {
            id: Date.now() + Math.random(),
            type: 'calc',
            field1,
            calcOp,
            field2,
            operator,
            value,
            logicOp,
        };
        this.conditions.push(condition);
        this.triggerChange();
        return condition;
    }

    // 删除条件
    removeCondition(id) {
        this.conditions = this.conditions.filter(c => c.id !== id);
        this.triggerChange();
    }

    // 更新条件
    updateCondition(id, updates) {
        const condition = this.conditions.find(c => c.id === id);
        if (condition) {
            Object.assign(condition, updates);
            this.triggerChange();
        }
    }

    // 切换条件的逻辑连接符
    toggleLogicOp(id) {
        const condition = this.conditions.find(c => c.id === id);
        if (condition) {
            condition.logicOp = condition.logicOp === 'and' ? 'or' : 'and';
            this.triggerChange();
        }
    }

    // 移动条件
    moveCondition(id, direction) {
        const index = this.conditions.findIndex(c => c.id === id);
        if (index === -1) return;

        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= this.conditions.length) return;

        [this.conditions[index], this.conditions[newIndex]] =
        [this.conditions[newIndex], this.conditions[index]];
        this.triggerChange();
    }

    // 设置名称
    setName(name) {
        this.name = name;
        this.triggerChange();
    }

    // 设置描述
    setDescription(desc) {
        this.description = desc;
        this.triggerChange();
    }

    // 触发变更回调
    triggerChange() {
        if (this.onChange) {
            this.onChange(this.getStrategy());
        }
    }

    // 获取策略对象
    getStrategy() {
        return {
            name: this.name || '未命名策略',
            description: this.description,
            conditions: [...this.conditions],
        };
    }

    // 清空
    clear() {
        this.conditions = [];
        this.name = '';
        this.description = '';
        this.triggerChange();
    }

    // 加载策略
    loadStrategy(strategy) {
        this.name = strategy.name || '';
        this.description = strategy.description || '';
        this.conditions = strategy.conditions?.map(c => ({
            ...c,
            id: c.id || Date.now() + Math.random(),
        })) || [];
        this.triggerChange();
    }

    // 验证策略
    validate() {
        if (this.conditions.length === 0) {
            return { valid: false, error: '至少添加一个条件' };
        }

        for (const c of this.conditions) {
            if (c.value === '' || c.value === null || c.value === undefined) {
                return { valid: false, error: '条件值不能为空' };
            }
            if (c.operator === 'between' && (c.value2 === '' || c.value2 === null)) {
                return { valid: false, error: '区间条件需要两个值' };
            }
        }

        return { valid: true };
    }

    // 前端筛选（支持混合逻辑）
    filterStocks(stocks) {
        if (!stocks || stocks.length === 0) return [];

        return stocks.filter(stock => this.evaluateStock(stock));
    }

    // 评估股票（支持混合逻辑）
    evaluateStock(stock) {
        if (this.conditions.length === 0) return true;

        // 第一个条件的结果
        let result = this.evaluateCondition(this.conditions[0], stock);

        // 后续条件按 logicOp 连接
        for (let i = 1; i < this.conditions.length; i++) {
            const condition = this.conditions[i];
            const conditionResult = this.evaluateCondition(condition, stock);

            if (condition.logicOp === 'or') {
                result = result || conditionResult;
            } else {
                result = result && conditionResult;
            }
        }

        return result;
    }

    // 评估单个条件
    evaluateCondition(c, stock) {
        if (c.type === 'simple') {
            const value = stock[c.field] || 0;
            const target = parseFloat(c.value);
            const target2 = parseFloat(c.value2);

            switch (c.operator) {
                case 'gt': return value > target;
                case 'gte': return value >= target;
                case 'lt': return value < target;
                case 'lte': return value <= target;
                case 'eq': return Math.abs(value - target) < 0.0001;
                case 'between': return value >= Math.min(target, target2) && value <= Math.max(target, target2);
            }
        }

        if (c.type === 'calc') {
            const val1 = stock[c.field1] || 0;
            const val2 = stock[c.field2] || 0;
            let calcValue;

            switch (c.calcOp) {
                case 'mul': calcValue = val1 * val2; break;
                case 'div': calcValue = val2 !== 0 ? val1 / val2 : Infinity; break;
                case 'add': calcValue = val1 + val2; break;
                case 'sub': calcValue = val1 - val2; break;
                default: calcValue = 0;
            }

            const target = parseFloat(c.value);
            switch (c.operator) {
                case 'gt': return calcValue > target;
                case 'gte': return calcValue >= target;
                case 'lt': return calcValue < target;
                case 'lte': return calcValue <= target;
                case 'eq': return Math.abs(calcValue - target) < 0.0001;
            }
        }

        return false;
    }

    // 转换为后端API参数（仅支持简单条件）
    toBackendParams(market = 'a股') {
        const params = {
            market,
            page: 1,
            pageSize: 200, // 后端限制最大200，获取尽可能多的数据
        };

        // 只处理简单条件，找到最严格的限制
        for (const c of this.conditions) {
            if (c.type !== 'simple') continue;

            const value = parseFloat(c.value);
            if (isNaN(value)) continue;

            switch (c.field) {
                case 'pe':
                    if (c.operator === 'lt' || c.operator === 'lte') {
                        params.peMax = Math.min(params.peMax || value, value);
                    }
                    break;
                case 'pb':
                    if (c.operator === 'lt' || c.operator === 'lte') {
                        params.pbMax = Math.min(params.pbMax || value, value);
                    }
                    break;
                case 'dividendYield':
                    if (c.operator === 'gt' || c.operator === 'gte') {
                        params.dividendYieldMin = Math.max(params.dividendYieldMin || 0, value / 100);
                    }
                    break;
                case 'marketCap':
                    if (c.operator === 'lt' || c.operator === 'lte') {
                        params.marketCapMax = Math.min(params.marketCapMax || value, value);
                    }
                    break;
            }
        }

        return params;
    }

    // 生成描述
    getDescription() {
        if (this.conditions.length === 0) return '无条件';

        const describeCondition = (c) => {
            if (c.type === 'simple') {
                const field = STRATEGY_FIELDS[c.field];
                const op = OPERATORS[c.operator];
                if (!field || !op) return '';

                if (c.operator === 'between') {
                    return `${field.label}${op.symbol}${c.value}${field.unit}-${c.value2}${field.unit}`;
                }
                return `${field.label}${op.symbol}${c.value}${field.unit}`;
            }

            if (c.type === 'calc') {
                const field1 = STRATEGY_FIELDS[c.field1];
                const field2 = STRATEGY_FIELDS[c.field2];
                const calcOp = CALC_OPERATORS[c.calcOp];
                const op = OPERATORS[c.operator];
                if (!field1 || !field2 || !calcOp || !op) return '';

                return `(${field1.label}${calcOp.symbol}${field2.label})${op.symbol}${c.value}`;
            }

            return '';
        };

        // 第一个条件
        let desc = describeCondition(this.conditions[0]);

        // 后续条件带逻辑符
        for (let i = 1; i < this.conditions.length; i++) {
            const logicLabel = this.conditions[i].logicOp === 'and' ? ' 且 ' : ' 或 ';
            desc += logicLabel + describeCondition(this.conditions[i]);
        }

        return desc;
    }
}

// 策略管理器（本地存储）
const StrategyManager = {
    STORAGE_KEY: 'cigar-butt-strategies-v3',

    getAll() {
        return Utils.storage.get(this.STORAGE_KEY, []);
    },

    save(strategy) {
        const strategies = this.getAll();
        const index = strategies.findIndex(s => s.id === strategy.id);

        if (index >= 0) {
            strategies[index] = { ...strategies[index], ...strategy, updatedAt: Date.now() };
        } else {
            strategy.id = strategy.id || Date.now().toString();
            strategy.createdAt = Date.now();
            strategy.updatedAt = Date.now();
            strategies.push(strategy);
        }

        Utils.storage.set(this.STORAGE_KEY, strategies);
        return strategy;
    },

    delete(id) {
        const strategies = this.getAll().filter(s => s.id !== id);
        Utils.storage.set(this.STORAGE_KEY, strategies);
    },

    get(id) {
        return this.getAll().find(s => s.id === id);
    },
};

// 导出
window.STRATEGY_FIELDS = STRATEGY_FIELDS;
window.OPERATORS = OPERATORS;
window.CALC_OPERATORS = CALC_OPERATORS;
window.LOGIC_OPS = LOGIC_OPS;
window.StrategyEditor = StrategyEditor;
window.StrategyManager = StrategyManager;
