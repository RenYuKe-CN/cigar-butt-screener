/**
 * 烟蒂股筛选器 - 主应用
 * Cigar Butt Screener
 */

// 应用状态
const AppState = {
    theme: 'light',
    market: 'a股',
    currentView: 'home',
    currentTemplate: null,
    currentPage: 1,
    pageSize: 50,
    totalResults: 0,
    filteredStocks: [],
    strategyEditor: null,
    currentStrategy: null,
    // 排序状态
    sortBy: null,
    sortOrder: 'asc', // 'asc' 或 'desc'
};

// DOM 元素缓存
const DOM = {};

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

async function initApp() {
    cacheDOMElements();
    loadTheme();
    bindEvents();
    bindCardEvents();
    initTemplateList();

    // 加载市场数据
    await loadMarketData();

    console.log('⚡️ 烟蒂股筛选器已加载');
}

// 缓存 DOM 元素
function cacheDOMElements() {
    DOM.themeToggle = document.getElementById('theme-toggle');
    DOM.iconSun = document.getElementById('icon-sun');
    DOM.iconMoon = document.getElementById('icon-moon');
    DOM.btnA股 = document.getElementById('btn-a股');
    DOM.btn港股 = document.getElementById('btn-港股');
    DOM.html = document.documentElement;

    // 弹窗相关
    DOM.templateModal = document.getElementById('template-modal');
    DOM.closeTemplateModal = document.getElementById('close-template-modal');
    DOM.templateList = document.getElementById('template-list');

    // 结果区域
    DOM.resultsSection = document.getElementById('results-section');
    DOM.resultsTitle = document.getElementById('results-title');
    DOM.resultsDesc = document.getElementById('results-desc');
    DOM.resultsCount = document.getElementById('results-count');
    DOM.resultsTbody = document.getElementById('results-tbody');
    DOM.backBtn = document.getElementById('back-btn');
    DOM.exportBtn = document.getElementById('export-btn');

    // 分页
    DOM.prevPage = document.getElementById('prev-page');
    DOM.nextPage = document.getElementById('next-page');
    DOM.pageInfo = document.getElementById('page-info');
    DOM.pageStart = document.getElementById('page-start');
    DOM.pageEnd = document.getElementById('page-end');
    DOM.pageTotal = document.getElementById('page-total');

    // 策略编辑器
    DOM.strategyEditor = document.getElementById('strategy-editor');
    DOM.strategyName = document.getElementById('strategy-name');
    DOM.strategyDesc = document.getElementById('strategy-desc');
    DOM.addConditionBtn = document.getElementById('add-condition-btn');
    DOM.addCalcConditionBtn = document.getElementById('add-calc-condition-btn');
    DOM.conditionsContainer = document.getElementById('conditions-container');
    DOM.saveStrategyBtn = document.getElementById('save-strategy-btn');
    DOM.loadStrategyBtn = document.getElementById('load-strategy-btn');
    DOM.runStrategyBtn = document.getElementById('run-strategy-btn');
    DOM.closeStrategyBtn = document.getElementById('close-strategy-btn');

    // 策略弹窗
    DOM.saveStrategyModal = document.getElementById('save-strategy-modal');
    DOM.cancelSaveStrategy = document.getElementById('cancel-save-strategy');
    DOM.confirmSaveStrategy = document.getElementById('confirm-save-strategy');
    DOM.loadStrategyModal = document.getElementById('load-strategy-modal');
    DOM.savedStrategiesList = document.getElementById('saved-strategies-list');
    DOM.closeLoadStrategy = document.getElementById('close-load-strategy');
}

// 绑定事件
function bindEvents() {
    // 主题切换
    DOM.themeToggle?.addEventListener('click', toggleTheme);

    // 市场切换
    DOM.btnA股?.addEventListener('click', () => switchMarket('a股'));
    DOM.btn港股?.addEventListener('click', () => switchMarket('港股'));

    // 弹窗关闭
    DOM.closeTemplateModal?.addEventListener('click', hideTemplateModal);
    DOM.templateModal?.addEventListener('click', (e) => {
        if (e.target === DOM.templateModal) hideTemplateModal();
    });

    // 返回按钮
    DOM.backBtn?.addEventListener('click', showHome);

    // 导出按钮
    DOM.exportBtn?.addEventListener('click', exportResults);

    // 分页
    DOM.prevPage?.addEventListener('click', () => changePage(-1));
    DOM.nextPage?.addEventListener('click', () => changePage(1));

    // 表格排序
    bindTableSortEvents();
}

// 绑定卡片点击事件
function bindCardEvents() {
    const cards = document.querySelectorAll('.card-hover');
    cards.forEach(card => {
        card.addEventListener('click', () => {
            const title = card.querySelector('h3')?.textContent;
            if (title?.includes('预设')) {
                showTemplateModal();
            } else if (title?.includes('自定义')) {
                showCustomStrategy();
            }
        });
    });
}

// 主题管理
function loadTheme() {
    const savedTheme = localStorage.getItem('cigar-butt-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (savedTheme) {
        AppState.theme = savedTheme;
    } else if (prefersDark) {
        AppState.theme = 'dark';
    }

    applyTheme(AppState.theme);
}

function toggleTheme() {
    AppState.theme = AppState.theme === 'light' ? 'dark' : 'light';
    applyTheme(AppState.theme);
    localStorage.setItem('cigar-butt-theme', AppState.theme);
}

function applyTheme(theme) {
    if (theme === 'dark') {
        DOM.html.classList.add('dark');
        DOM.html.classList.remove('light');
    } else {
        DOM.html.classList.add('light');
        DOM.html.classList.remove('dark');
    }
}

// 市场切换
function switchMarket(market) {
    AppState.market = market;

    if (market === 'a股') {
        DOM.btnA股?.classList.add('bg-white', 'dark:bg-gray-600', 'shadow-sm', 'text-gray-900', 'dark:text-white');
        DOM.btnA股?.classList.remove('text-gray-500', 'dark:text-gray-400');

        DOM.btn港股?.classList.remove('bg-white', 'dark:bg-gray-600', 'shadow-sm', 'text-gray-900', 'dark:text-white');
        DOM.btn港股?.classList.add('text-gray-500', 'dark:text-gray-400');
    } else {
        DOM.btn港股?.classList.add('bg-white', 'dark:bg-gray-600', 'shadow-sm', 'text-gray-900', 'dark:text-white');
        DOM.btn港股?.classList.remove('text-gray-500', 'dark:text-gray-400');

        DOM.btnA股?.classList.remove('bg-white', 'dark:bg-gray-600', 'shadow-sm', 'text-gray-900', 'dark:text-white');
        DOM.btnA股?.classList.add('text-gray-500', 'dark:text-gray-400');
    }

    console.log(`切换到: ${market}`);

    // 如果正在显示结果，重新筛选
    if (AppState.currentView === 'results' && AppState.currentTemplate) {
        applyTemplate(AppState.currentTemplate);
    }
}

// 加载市场数据
async function loadMarketData() {
    try {
        const indices = await Cache.getMarketIndices();
        updateMarketOverview(indices);
    } catch (error) {
        console.error('加载市场数据失败:', error);
    }
}

// 刷新市场数据
async function refreshMarketData() {
    try {
        const indices = await Cache.refresh('indices');
        updateMarketOverview(indices);
        console.log('⚡️ 数据已刷新');
    } catch (error) {
        console.error('刷新数据失败:', error);
    }
}

// 更新市场概览
function updateMarketOverview(indices) {
    const container = document.querySelector('.grid.grid-cols-2.md\\:grid-cols-4');
    if (!container) return;

    const cards = container.querySelectorAll('.bg-gray-50');
    const indexMap = {
        '上证指数': indices.find(i => i.code === 'sh000001'),
        '深证成指': indices.find(i => i.code === 'sz399001'),
        '恒生指数': indices.find(i => i.code === 'hkHSI'),
    };

    cards.forEach(card => {
        const label = card.querySelector('p:first-child')?.textContent;
        const valueEl = card.querySelector('p:last-child');

        if (label === '上证指数' && indexMap['上证指数']) {
            const data = indexMap['上证指数'];
            valueEl.textContent = data.price.toFixed(2);
            valueEl.className = `text-xl font-bold number-font ${data.change >= 0 ? 'text-red-600' : 'text-green-600'}`;
        } else if (label === '深证成指' && indexMap['深证成指']) {
            const data = indexMap['深证成指'];
            valueEl.textContent = data.price.toFixed(2);
            valueEl.className = `text-xl font-bold number-font ${data.change >= 0 ? 'text-red-600' : 'text-green-600'}`;
        } else if (label === '恒生指数' && indexMap['恒生指数']) {
            const data = indexMap['恒生指数'];
            valueEl.textContent = data.price.toFixed(2);
            valueEl.className = `text-xl font-bold number-font ${data.change >= 0 ? 'text-red-600' : 'text-green-600'}`;
        } else if (label === '筛选结果') {
            valueEl.textContent = '0';
        }
    });

    // 更新时间
    const updateTime = document.querySelector('.text-sm.text-gray-500.dark\\:text-gray-400');
    if (updateTime) {
        updateTime.textContent = `数据更新于: ${new Date().toLocaleString('zh-CN')}`;
    }
}

// ========== 模板相关 ==========

// 初始化模板列表
function initTemplateList() {
    if (!DOM.templateList) return;

    const templates = TemplateManager.getAll();
    const colorClasses = {
        green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
        blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
        red: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
        yellow: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400',
    };

    DOM.templateList.innerHTML = templates.map(template => `
        <div class="template-card card-hover bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 cursor-pointer transition-all hover:shadow-lg"
             data-template-id="${template.id}">
            <div class="flex items-start space-x-4">
                <div class="w-12 h-12 ${colorClasses[template.color]} rounded-xl flex items-center justify-center text-2xl">
                    ${template.icon}
                </div>
                <div class="flex-1 min-w-0">
                    <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-1">${template.name}</h4>
                    <p class="text-sm text-gray-500 dark:text-gray-400 mb-2">${template.description}</p>
                    <div class="flex items-center text-xs text-gray-400 dark:text-gray-500">
                        <span class="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">${AppState.market}</span>
                    </div>
                </div>
            </div>
        </div>
    `).join('');

    // 绑定模板点击事件
    document.querySelectorAll('.template-card').forEach(card => {
        card.addEventListener('click', () => {
            const templateId = card.dataset.templateId;
            applyTemplate(templateId);
        });
    });
}

// 显示模板弹窗
function showTemplateModal() {
    DOM.templateModal?.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

// 隐藏模板弹窗
function hideTemplateModal() {
    DOM.templateModal?.classList.add('hidden');
    document.body.style.overflow = '';
}

// 应用模板
async function applyTemplate(templateId) {
    try {
        hideTemplateModal();

        // 显示加载状态
        showLoading();

        const result = await TemplateManager.apply(templateId, AppState.market);

        AppState.currentTemplate = templateId;
        AppState.filteredStocks = result.stocks || [];
        AppState.totalResults = result.total || 0;
        AppState.currentPage = 1;

        // 更新结果展示
        showResults(result);

        hideLoading();
    } catch (error) {
        console.error('应用模板失败:', error);
        alert('筛选失败: ' + (error.message || '请检查网络连接或刷新页面重试'));
        hideLoading();
    }
}

// 刷新当前结果
async function refreshCurrentResults() {
    if (!AppState.currentTemplate) return;

    showLoading();
    try {
        // 清除缓存并重新获取
        const result = await Cache.refresh('filterResult', {
            market: AppState.market,
            ...TemplateManager.get(AppState.currentTemplate)?.params
        });

        AppState.filteredStocks = result.stocks || [];
        AppState.totalResults = result.total || 0;
        AppState.currentPage = 1;

        renderTable();
        console.log('⚡️ 结果已刷新');
    } catch (error) {
        console.error('刷新失败:', error);
    }
    hideLoading();
}

// 显示结果
function showResults(result) {
    AppState.currentView = 'results';

    const template = result.template;

    // 更新标题和描述
    DOM.resultsTitle.textContent = `${template.name} - 筛选结果`;
    DOM.resultsDesc.textContent = `${AppState.market}市场 | ${template.description}`;
    DOM.resultsCount.textContent = `共 ${AppState.totalResults} 只股票`;

    // 重置排序状态
    AppState.sortBy = null;
    AppState.sortOrder = 'asc';
    updateSortHeaders();

    // 渲染表格
    renderTable();

    // 显示结果区域，隐藏首页内容
    document.querySelector('.grid.md\\:grid-cols-2')?.classList.add('hidden');
    document.querySelector('.text-center.mb-10')?.classList.add('hidden');
    DOM.resultsSection?.classList.remove('hidden');

    // 滚动到顶部
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// 渲染表格
function renderTable() {
    const start = (AppState.currentPage - 1) * AppState.pageSize;
    const end = Math.min(start + AppState.pageSize, AppState.filteredStocks.length);
    const pageData = AppState.filteredStocks.slice(start, end);

    if (pageData.length === 0) {
        DOM.resultsTbody.innerHTML = `
            <tr>
                <td colspan="8" class="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                    没有找到符合条件的股票
                </td>
            </tr>
        `;
    } else {
        DOM.resultsTbody.innerHTML = pageData.map(stock => `
            <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <td class="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white number-font">${stock.code}</td>
                <td class="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">${stock.name}</td>
                <td class="px-4 py-3 text-sm text-right number-font ${stock.change >= 0 ? 'text-red-600' : 'text-green-600'}">${stock.price?.toFixed(2) || '--'}</td>
                <td class="px-4 py-3 text-sm text-right number-font ${stock.changePercent >= 0 ? 'text-red-600' : 'text-green-600'}">${stock.changePercent >= 0 ? '+' : ''}${stock.changePercent?.toFixed(2) || '--'}%</td>
                <td class="px-4 py-3 text-sm text-right number-font text-gray-700 dark:text-gray-300">${stock.pe?.toFixed(2) || '--'}</td>
                <td class="px-4 py-3 text-sm text-right number-font ${stock.pb < 1 ? 'text-green-600 font-medium' : 'text-gray-700 dark:text-gray-300'}">${stock.pb?.toFixed(2) || '--'}</td>
                <td class="px-4 py-3 text-sm text-right number-font text-gray-700 dark:text-gray-300">${formatMarketCap(stock.marketCap)}</td>
                <td class="px-4 py-3 text-sm text-right number-font text-gray-700 dark:text-gray-300">${stock.dividendYield != null ? (stock.dividendYield * 100).toFixed(2) + '%' : '--'}</td>
            </tr>
        `).join('');
    }

    // 更新分页信息
    updatePagination(start, end);
}

// 更新分页
function updatePagination(start, end) {
    DOM.pageStart.textContent = AppState.totalResults > 0 ? start + 1 : 0;
    DOM.pageEnd.textContent = end;
    DOM.pageTotal.textContent = AppState.totalResults;
    DOM.pageInfo.textContent = `第 ${AppState.currentPage} 页`;

    DOM.prevPage.disabled = AppState.currentPage <= 1;
    DOM.nextPage.disabled = end >= AppState.totalResults;
}

// 切换页面
function changePage(delta) {
    const newPage = AppState.currentPage + delta;
    const maxPage = Math.ceil(AppState.totalResults / AppState.pageSize);

    if (newPage < 1 || newPage > maxPage) return;

    AppState.currentPage = newPage;
    renderTable();

    // 滚动到表格顶部
    DOM.resultsSection?.scrollIntoView({ behavior: 'smooth' });
}

// 返回首页
function showHome() {
    AppState.currentView = 'home';
    AppState.currentTemplate = null;

    document.querySelector('.grid.md\\:grid-cols-2')?.classList.remove('hidden');
    document.querySelector('.text-center.mb-10')?.classList.remove('hidden');
    DOM.resultsSection?.classList.add('hidden');
    DOM.strategyEditor?.classList.add('hidden');

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// 导出结果
function exportResults() {
    if (AppState.filteredStocks.length === 0) {
        alert('没有数据可导出');
        return;
    }

    const headers = ['代码', '名称', '价格', '涨跌幅', 'PE', 'PB', '市值(亿)', '股息率'];
    const rows = AppState.filteredStocks.map(s => [
        s.code,
        s.name,
        s.price?.toFixed(2) || '--',
        (s.changePercent >= 0 ? '+' : '') + (s.changePercent?.toFixed(2) || '0.00') + '%',
        s.pe?.toFixed(2) || '--',
        s.pb?.toFixed(2) || '--',
        s.marketCap?.toFixed(2) || '--',
        s.dividendYield != null ? (s.dividendYield * 100).toFixed(2) + '%' : '--',
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `烟蒂股筛选_${AppState.market}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
}

// 显示自定义策略编辑器
function showCustomStrategy() {
    AppState.currentView = 'strategy';

    // 隐藏首页内容
    document.querySelector('.grid.md\\:grid-cols-2')?.classList.add('hidden');
    document.querySelector('.text-center.mb-10')?.classList.add('hidden');
    DOM.resultsSection?.classList.add('hidden');

    // 显示策略编辑器
    DOM.strategyEditor?.classList.remove('hidden');

    // 初始化策略编辑器
    if (!AppState.strategyEditor) {
        initStrategyEditor();
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// 初始化策略编辑器
function initStrategyEditor() {
    AppState.strategyEditor = new StrategyEditor();
    AppState.strategyEditor.onChange = updateStrategyPreview;

    // 绑定事件
    DOM.addConditionBtn?.addEventListener('click', () => {
        AppState.strategyEditor.addCondition('pb', 'lt', 1);
        renderConditions();
    });

    DOM.addCalcConditionBtn?.addEventListener('click', () => {
        AppState.strategyEditor.addCalcCondition('pe', 'mul', 'pb', 'lt', 22.5);
        renderConditions();
    });

    DOM.saveStrategyBtn?.addEventListener('click', showSaveStrategyModal);
    DOM.loadStrategyBtn?.addEventListener('click', showLoadStrategyModal);
    DOM.runStrategyBtn?.addEventListener('click', runCustomStrategy);
    DOM.closeStrategyBtn?.addEventListener('click', showHome);

    DOM.cancelSaveStrategy?.addEventListener('click', hideSaveStrategyModal);
    DOM.confirmSaveStrategy?.addEventListener('click', saveCurrentStrategy);
    DOM.closeLoadStrategy?.addEventListener('click', hideLoadStrategyModal);

    // 策略名称和描述
    DOM.strategyName?.addEventListener('input', (e) => {
        AppState.strategyEditor.setName(e.target.value);
    });
    DOM.strategyDesc?.addEventListener('input', (e) => {
        AppState.strategyEditor.setDescription(e.target.value);
    });

    // 添加默认条件
    AppState.strategyEditor.addCondition('pb', 'lt', 1);
    renderConditions();
}

// 切换条件的逻辑连接符
function toggleConditionLogic(id) {
    AppState.strategyEditor.toggleLogicOp(id);
    renderConditions();
}

// 渲染条件列表
function renderConditions() {
    if (!DOM.conditionsContainer) return;

    const conditions = AppState.strategyEditor.conditions;

    if (conditions.length === 0) {
        DOM.conditionsContainer.innerHTML = `
            <div class="text-center py-8 text-gray-500 dark:text-gray-400">
                暂无筛选条件，点击上方按钮添加
            </div>
        `;
        return;
    }

    let html = '';

    conditions.forEach((condition, index) => {
        // 条件之间的连接符（除了第一个）
        if (index > 0) {
            const logicOp = condition.logicOp || 'and';
            const isAnd = logicOp === 'and';
            html += `
                <div class="flex items-center justify-center my-2">
                    <button class="logic-toggle-btn px-4 py-1 text-sm font-medium rounded-full transition-colors ${isAnd ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400'}" data-id="${condition.id}">
                        ${isAnd ? '且' : '或'}
                    </button>
                </div>
            `;
        }

        // 计算条件
        if (condition.type === 'calc') {
            const field1 = STRATEGY_FIELDS[condition.field1];
            const field2 = STRATEGY_FIELDS[condition.field2];
            const calcOp = CALC_OPERATORS[condition.calcOp];
            const op = OPERATORS[condition.operator];

            html += `
                <div class="condition-card bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl border border-purple-200 dark:border-purple-700 p-4" data-condition-id="${condition.id}">
                    <div class="flex flex-col md:flex-row md:items-center gap-4">
                        <span class="text-xs font-medium text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30 px-2 py-1 rounded">计算</span>

                        <!-- 字段1 -->
                        <select class="calc-field1 w-full md:w-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" data-id="${condition.id}">
                            ${Object.values(STRATEGY_FIELDS).map(f => `
                                <option value="${f.name}" ${f.name === condition.field1 ? 'selected' : ''}>${f.label}</option>
                            `).join('')}
                        </select>

                        <!-- 计算符 -->
                        <select class="calc-op w-20 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" data-id="${condition.id}">
                            ${Object.entries(CALC_OPERATORS).map(([key, op]) => `
                                <option value="${key}" ${key === condition.calcOp ? 'selected' : ''}>${op.symbol}</option>
                            `).join('')}
                        </select>

                        <!-- 字段2 -->
                        <select class="calc-field2 w-full md:w-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" data-id="${condition.id}">
                            ${Object.values(STRATEGY_FIELDS).map(f => `
                                <option value="${f.name}" ${f.name === condition.field2 ? 'selected' : ''}>${f.label}</option>
                            `).join('')}
                        </select>

                        <!-- 比较符 -->
                        <select class="calc-operator w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" data-id="${condition.id}">
                            ${Object.entries(OPERATORS).filter(([k]) => k !== 'between').map(([key, op]) => `
                                <option value="${key}" ${key === condition.operator ? 'selected' : ''}>${op.symbol}</option>
                            `).join('')}
                        </select>

                        <!-- 值 -->
                        <input type="number" class="calc-value w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" value="${condition.value}" step="0.01" data-id="${condition.id}">

                        <!-- 操作按钮 -->
                        <div class="flex items-center gap-2 ml-auto">
                            <button class="move-up-btn p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors ${index === 0 ? 'opacity-30 cursor-not-allowed' : ''}" data-id="${condition.id}" ${index === 0 ? 'disabled' : ''}>
                                <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"></path></svg>
                            </button>
                            <button class="move-down-btn p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors ${index === conditions.length - 1 ? 'opacity-30 cursor-not-allowed' : ''}" data-id="${condition.id}" ${index === conditions.length - 1 ? 'disabled' : ''}>
                                <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                            </button>
                            <button class="delete-condition-btn p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors" data-id="${condition.id}">
                                <svg class="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        } else {
            // 简单条件
            const field = STRATEGY_FIELDS[condition.field];
            const isBetween = condition.operator === 'between';

            html += `
                <div class="condition-card bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4" data-condition-id="${condition.id}">
                    <div class="flex flex-col md:flex-row md:items-center gap-4">
                        <span class="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded">简单</span>

                        <!-- 字段选择 -->
                        <select class="condition-field w-full md:w-40 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" data-id="${condition.id}">
                            ${Object.values(STRATEGY_FIELDS).map(f => `
                                <option value="${f.name}" ${f.name === condition.field ? 'selected' : ''}>${f.label}</option>
                            `).join('')}
                        </select>

                        <!-- 运算符 -->
                        <select class="condition-operator w-full md:w-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" data-id="${condition.id}">
                            ${Object.entries(OPERATORS).map(([key, op]) => `
                                <option value="${key}" ${key === condition.operator ? 'selected' : ''}>${op.label} (${op.symbol})</option>
                            `).join('')}
                        </select>

                        <!-- 值输入 -->
                        <div class="flex items-center gap-2 flex-1">
                            <input type="number" class="condition-value flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" value="${condition.value}" placeholder="数值" step="${field?.step || 0.01}" data-id="${condition.id}">
                            ${isBetween ? `
                                <span class="text-gray-500 dark:text-gray-400">~</span>
                                <input type="number" class="condition-value2 flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" value="${condition.value2 || ''}" placeholder="数值2" step="${field?.step || 0.01}" data-id="${condition.id}">
                            ` : ''}
                            <span class="text-sm text-gray-500 dark:text-gray-400 w-8">${field?.unit || ''}</span>
                        </div>

                        <!-- 操作按钮 -->
                        <div class="flex items-center gap-2">
                            <button class="move-up-btn p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors ${index === 0 ? 'opacity-30 cursor-not-allowed' : ''}" data-id="${condition.id}" ${index === 0 ? 'disabled' : ''}>
                                <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"></path></svg>
                            </button>
                            <button class="move-down-btn p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors ${index === conditions.length - 1 ? 'opacity-30 cursor-not-allowed' : ''}" data-id="${condition.id}" ${index === conditions.length - 1 ? 'disabled' : ''}>
                                <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                            </button>
                            <button class="delete-condition-btn p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors" data-id="${condition.id}">
                                <svg class="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }
    });

    DOM.conditionsContainer.innerHTML = html;

    // 绑定条件事件
    bindConditionEvents();
}

// 绑定条件事件
function bindConditionEvents() {
    // 简单条件 - 字段变更
    document.querySelectorAll('.condition-field').forEach(select => {
        select.addEventListener('change', (e) => {
            const id = parseFloat(e.target.dataset.id);
            AppState.strategyEditor.updateCondition(id, { field: e.target.value });
            renderConditions();
        });
    });

    // 简单条件 - 运算符变更
    document.querySelectorAll('.condition-operator').forEach(select => {
        select.addEventListener('change', (e) => {
            const id = parseFloat(e.target.dataset.id);
            AppState.strategyEditor.updateCondition(id, { operator: e.target.value });
            renderConditions();
        });
    });

    // 简单条件 - 值变更
    document.querySelectorAll('.condition-value').forEach(input => {
        input.addEventListener('input', (e) => {
            const id = parseFloat(e.target.dataset.id);
            AppState.strategyEditor.updateCondition(id, { value: e.target.value });
        });
    });

    // 简单条件 - 值2变更（区间）
    document.querySelectorAll('.condition-value2').forEach(input => {
        input.addEventListener('input', (e) => {
            const id = parseFloat(e.target.dataset.id);
            AppState.strategyEditor.updateCondition(id, { value2: e.target.value });
        });
    });

    // 计算条件 - 字段1
    document.querySelectorAll('.calc-field1').forEach(select => {
        select.addEventListener('change', (e) => {
            const id = parseFloat(e.target.dataset.id);
            AppState.strategyEditor.updateCondition(id, { field1: e.target.value });
            renderConditions();
        });
    });

    // 计算条件 - 计算符
    document.querySelectorAll('.calc-op').forEach(select => {
        select.addEventListener('change', (e) => {
            const id = parseFloat(e.target.dataset.id);
            AppState.strategyEditor.updateCondition(id, { calcOp: e.target.value });
            renderConditions();
        });
    });

    // 计算条件 - 字段2
    document.querySelectorAll('.calc-field2').forEach(select => {
        select.addEventListener('change', (e) => {
            const id = parseFloat(e.target.dataset.id);
            AppState.strategyEditor.updateCondition(id, { field2: e.target.value });
            renderConditions();
        });
    });

    // 计算条件 - 比较符
    document.querySelectorAll('.calc-operator').forEach(select => {
        select.addEventListener('change', (e) => {
            const id = parseFloat(e.target.dataset.id);
            AppState.strategyEditor.updateCondition(id, { operator: e.target.value });
            renderConditions();
        });
    });

    // 计算条件 - 值
    document.querySelectorAll('.calc-value').forEach(input => {
        input.addEventListener('input', (e) => {
            const id = parseFloat(e.target.dataset.id);
            AppState.strategyEditor.updateCondition(id, { value: e.target.value });
        });
    });

    // 上移
    document.querySelectorAll('.move-up-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = parseFloat(btn.dataset.id);
            AppState.strategyEditor.moveCondition(id, 'up');
            renderConditions();
        });
    });

    // 下移
    document.querySelectorAll('.move-down-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = parseFloat(btn.dataset.id);
            AppState.strategyEditor.moveCondition(id, 'down');
            renderConditions();
        });
    });

    // 删除
    document.querySelectorAll('.delete-condition-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = parseFloat(btn.dataset.id);
            AppState.strategyEditor.removeCondition(id);
            renderConditions();
        });
    });

    // 逻辑切换按钮
    document.querySelectorAll('.logic-toggle-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = parseFloat(btn.dataset.id);
            toggleConditionLogic(id);
        });
    });
}

// 更新策略预览
function updateStrategyPreview(strategy) {
    const preview = document.getElementById('strategy-preview');
    if (preview) {
        preview.textContent = AppState.strategyEditor.getDescription() || '暂无条件';
    }
}

// 显示保存策略弹窗
function showSaveStrategyModal() {
    const validation = AppState.strategyEditor.validate();
    if (!validation.valid) {
        alert(validation.error);
        return;
    }

    if (!DOM.strategyName?.value.trim()) {
        alert('请输入策略名称');
        DOM.strategyName?.focus();
        return;
    }

    DOM.saveStrategyModal?.classList.remove('hidden');
}

// 隐藏保存策略弹窗
function hideSaveStrategyModal() {
    DOM.saveStrategyModal?.classList.add('hidden');
}

// 保存当前策略
function saveCurrentStrategy() {
    const strategy = AppState.strategyEditor.getStrategy();
    StrategyManager.save(strategy);
    hideSaveStrategyModal();
    alert('策略已保存！');
}

// 显示加载策略弹窗
function showLoadStrategyModal() {
    const strategies = StrategyManager.getAll();
    const list = DOM.savedStrategiesList;

    if (strategies.length === 0) {
        list.innerHTML = `
            <div class="text-center py-8 text-gray-500 dark:text-gray-400">
                暂无保存的策略
            </div>
        `;
    } else {
        list.innerHTML = strategies.map(s => `
            <div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg mb-3">
                <div class="flex-1 min-w-0">
                    <h4 class="font-medium text-gray-900 dark:text-white truncate">${s.name}</h4>
                    <p class="text-sm text-gray-500 dark:text-gray-400 truncate">${s.description || '无描述'}</p>
                    <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">${new Date(s.updatedAt).toLocaleString('zh-CN')}</p>
                </div>
                <div class="flex items-center gap-2 ml-4">
                    <button class="load-strategy-item-btn px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white text-sm rounded transition-colors" data-id="${s.id}">
                        加载
                    </button>
                    <button class="delete-strategy-item-btn px-3 py-1.5 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 text-sm rounded transition-colors" data-id="${s.id}">
                        删除
                    </button>
                </div>
            </div>
        `).join('');

        // 绑定事件
        list.querySelectorAll('.load-strategy-item-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                const strategy = StrategyManager.get(id);
                if (strategy) {
                    AppState.strategyEditor.loadStrategy(strategy);
                    DOM.strategyName.value = strategy.name || '';
                    DOM.strategyDesc.value = strategy.description || '';
                    renderConditions();
                    hideLoadStrategyModal();
                }
            });
        });

        list.querySelectorAll('.delete-strategy-item-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                if (confirm('确定删除这个策略吗？')) {
                    StrategyManager.delete(id);
                    showLoadStrategyModal(); // 刷新列表
                }
            });
        });
    }

    DOM.loadStrategyModal?.classList.remove('hidden');
}

// 隐藏加载策略弹窗
function hideLoadStrategyModal() {
    DOM.loadStrategyModal?.classList.add('hidden');
}

// 运行自定义策略
async function runCustomStrategy() {
    const validation = AppState.strategyEditor.validate();
    if (!validation.valid) {
        alert(validation.error);
        return;
    }

    try {
        showLoading();

        // 检查是否有计算条件
        const hasCalcCondition = AppState.strategyEditor.conditions.some(c => c.type === 'calc');

        if (hasCalcCondition) {
            // 有计算条件：先获取所有股票，然后前端筛选
            const params = { market: AppState.market };
            const result = await Cache.getStockList(AppState.market);
            const allStocks = result.stocks || [];

            // 前端筛选（支持计算条件）
            const filtered = AppState.strategyEditor.filterStocks(allStocks);

            AppState.currentTemplate = 'custom';
            AppState.filteredStocks = filtered;
            AppState.totalResults = filtered.length;
            AppState.currentPage = 1;
        } else {
            // 只有简单条件：使用后端筛选
            // 获取所有符合条件的股票（不分页）
            const allStocks = [];
            let page = 1;
            let hasMore = true;
            
            // 获取基础参数（不含页码）
            const baseParams = AppState.strategyEditor.toBackendParams(AppState.market);
            
            while (hasMore && page <= 5) { // 最多5页，防止无限循环
                const params = { ...baseParams, page: page };
                
                // 跳过缓存，直接请求
                const data = await API.filterStocks(params);
                const stocks = data.stocks || [];
                
                if (stocks.length === 0) {
                    hasMore = false;
                } else {
                    allStocks.push(...stocks);
                    page++;
                    // 如果返回的数据少于pageSize，说明没有更多数据了
                    if (stocks.length < 200) {
                        hasMore = false;
                    }
                }
            }

            AppState.currentTemplate = 'custom';
            AppState.filteredStocks = allStocks;
            AppState.totalResults = allStocks.length;
            AppState.currentPage = 1;
        }

        // 构建模拟模板对象用于显示
        const customTemplate = {
            name: AppState.strategyEditor.name || '自定义策略',
            description: AppState.strategyEditor.getDescription(),
        };

        showResults({ stocks: AppState.filteredStocks, total: AppState.totalResults, template: customTemplate });

        // 隐藏策略编辑器
        DOM.strategyEditor?.classList.add('hidden');

        hideLoading();
    } catch (error) {
        console.error('运行策略失败:', error);
        alert('筛选失败: ' + (error.message || '请检查网络连接或刷新页面重试'));
        hideLoading();
    }
}

// 显示/隐藏加载状态
function showLoading() {
    // 可以添加全局加载动画
    document.body.style.cursor = 'wait';
}

function hideLoading() {
    document.body.style.cursor = '';
}

// 格式化市值
function formatMarketCap(cap) {
    if (!cap || isNaN(cap)) return '--';
    if (cap >= 10000) {
        return (cap / 10000).toFixed(2) + '万亿';
    }
    return cap.toFixed(2) + '亿';
}

// 绑定表格排序事件
function bindTableSortEvents() {
    const tableHeaders = document.querySelectorAll('th[data-sort]');
    tableHeaders.forEach(th => {
        th.addEventListener('click', () => {
            const field = th.dataset.sort;
            handleSort(field);
        });
    });
}

// 处理排序
function handleSort(field) {
    // 如果点击的是当前排序字段，切换排序方向
    if (AppState.sortBy === field) {
        AppState.sortOrder = AppState.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
        // 新字段，默认升序
        AppState.sortBy = field;
        AppState.sortOrder = 'asc';
    }

    // 更新表头样式
    updateSortHeaders();

    // 执行排序
    sortStocks();

    // 重新渲染表格
    AppState.currentPage = 1;
    renderTable();
}

// 更新表头排序样式
function updateSortHeaders() {
    const tableHeaders = document.querySelectorAll('th[data-sort]');
    tableHeaders.forEach(th => {
        const field = th.dataset.sort;
        const icon = th.querySelector('.sort-icon');

        // 移除所有排序类
        th.classList.remove('sort-asc', 'sort-desc');

        if (AppState.sortBy === field) {
            // 当前排序字段
            th.classList.add(AppState.sortOrder === 'asc' ? 'sort-asc' : 'sort-desc');
            if (icon) {
                icon.textContent = AppState.sortOrder === 'asc' ? '↑' : '↓';
            }
        } else {
            // 非排序字段
            if (icon) {
                icon.textContent = '↕';
            }
        }
    });
}

// 对股票列表进行排序
function sortStocks() {
    if (!AppState.sortBy || AppState.filteredStocks.length === 0) return;

    const field = AppState.sortBy;
    const order = AppState.sortOrder;

    AppState.filteredStocks.sort((a, b) => {
        let aVal = a[field];
        let bVal = b[field];

        // 处理空值
        if (aVal === null || aVal === undefined || aVal === '--') aVal = -Infinity;
        if (bVal === null || bVal === undefined || bVal === '--') bVal = -Infinity;

        // 字符串排序（代码、名称）
        if (field === 'code' || field === 'name') {
            aVal = String(aVal || '');
            bVal = String(bVal || '');
            return order === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        }

        // 数字排序
        aVal = parseFloat(aVal) || 0;
        bVal = parseFloat(bVal) || 0;

        return order === 'asc' ? aVal - bVal : bVal - aVal;
    });
}

// 导出全局
window.CigarButtApp = {
    state: AppState,
    switchMarket,
    toggleTheme,
    showTemplateModal,
    showHome,
};
