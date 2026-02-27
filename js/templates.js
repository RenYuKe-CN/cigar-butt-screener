/**
 * 烟蒂股筛选器 - 预设模板
 */

const Templates = {
    // 经典烟蒂股：低PB + 低PE + 正收益
    classic: {
        id: 'classic',
        name: '经典烟蒂股',
        description: '低PB + 低PE + 正收益',
        icon: '🔥',
        color: 'green',
        params: {
            pbMax: 1.5,
            peMax: 20,
        },
        sortBy: 'pb',
        sortOrder: 'asc',
    },

    // 格雷厄姆式：PE<15 + PB<1.5
    graham: {
        id: 'graham',
        name: '格雷厄姆式',
        description: 'PE<15 + PB<1.5',
        icon: '📊',
        color: 'blue',
        params: {
            peMax: 15,
            pbMax: 1.5,
        },
        sortBy: 'pe',
        sortOrder: 'asc',
    },

    // 深水炸弹：PB<0.8 + 小市值
    deepValue: {
        id: 'deepValue',
        name: '深水炸弹',
        description: 'PB<0.8 + 市值<100亿',
        icon: '💣',
        color: 'red',
        params: {
            pbMax: 0.8,
            marketCapMax: 100,
        },
        sortBy: 'pb',
        sortOrder: 'asc',
    },

    // 高息防守：股息率>5%
    highDividend: {
        id: 'highDividend',
        name: '高息防守',
        description: '股息率>5% + PE<20',
        icon: '🛡️',
        color: 'yellow',
        params: {
            dividendYieldMin: 5,
            peMax: 20,
        },
        sortBy: 'dividendYield',
        sortOrder: 'desc',
    },
};

// 模板管理器
const TemplateManager = {
    // 获取所有模板
    getAll() {
        return Object.values(Templates);
    },

    // 获取单个模板
    get(id) {
        return Templates[id] || null;
    },

    // 应用模板筛选
    async apply(templateId, market = 'a股') {
        const template = this.get(templateId);
        if (!template) {
            throw new Error('模板不存在');
        }

        const params = {
            market,
            ...template.params,
        };

        const result = await Cache.filterStocks(params);

        // 排序
        if (result.stocks && template.sortBy) {
            result.stocks.sort((a, b) => {
                const aVal = a[template.sortBy] || 0;
                const bVal = b[template.sortBy] || 0;
                return template.sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
            });
        }

        return {
            ...result,
            template,
        };
    },

    // 获取模板描述
    getDescription(templateId) {
        const template = this.get(templateId);
        if (!template) return '';

        const conditions = [];
        if (template.params.peMax) conditions.push(`PE<${template.params.peMax}`);
        if (template.params.pbMax) conditions.push(`PB<${template.params.pbMax}`);
        if (template.params.dividendYieldMin) conditions.push(`股息率>${template.params.dividendYieldMin}%`);
        if (template.params.marketCapMax) conditions.push(`市值<${template.params.marketCapMax}亿`);

        return conditions.join(' + ');
    },
};

// 导出
window.Templates = Templates;
window.TemplateManager = TemplateManager;
