// popup.js
/**
 * 交易计算器核心类
 * 功能：处理多空仓位计算、杠杆收益显示、用户配置存储
 */
class TradingCalculator {
    constructor() {
        this.inputHistory = {
            entry: 0,
            exit: 0,
            change: 0
        };
        // 初始化DOM元素引用
        this.initDOM();
        // 绑定事件监听器
        this.initEventListeners();
        // 加载用户保存的设置
        this.loadSettings();
        // 防抖延时设置（单位：毫秒）
        this.debounceDelay = 300;
        this.debounceTimer = null;
    }

    // 缓存常用DOM元素
    initDOM() {
        this.elements = {
            directionBtns: document.querySelectorAll('.position-btn'),  // 多空切换按钮
            entry: document.getElementById('entry'),      // 开仓价输入框
            exit: document.getElementById('exit'),        // 平仓价输入框
            change: document.getElementById('change'),   // 涨跌幅输入框
            leverage: document.getElementById('leverage'),// 杠杆倍数输入
            baseResult: document.getElementById('baseResult'),     // 基础结果展示
            leverageResult: document.getElementById('leverageResult'), // 杠杆结果展示
            modeDisplay: document.getElementById('modeDisplay'), // 计算模式展示
            resetBtn: document.getElementById('reset')    // 重置按钮
        };
    }

    // 初始化事件监听
    initEventListeners() {

        // 監聽時間戳記錄
        const recordTimestamp = (field) => {
            return () => {
                this.inputHistory[field] = Date.now();
                this.debouncedCalculate();
            }
        }

        this.elements.entry.addEventListener('input', recordTimestamp('entry'));
        this.elements.exit.addEventListener('input', recordTimestamp('exit'));
        this.elements.change.addEventListener('input', recordTimestamp('change'));

        // 多空切换按钮事件
        this.elements.directionBtns.forEach(btn => {
            btn.addEventListener('click', (e) => this.handleDirectionChange(e));
        });

        // 杠杆倍数变化事件
        this.elements.leverage.addEventListener('input', () => this.debouncedCalculate());

        // 重置按钮点击事件
        this.elements.resetBtn.addEventListener('click', () => this.resetCalculator());

    }

    /** 
     * 处理多空方向切换
     * @param {Event} event - 点击事件对象
     */
    handleDirectionChange(event) {
        const btn = event.currentTarget;

        // 强制移除所有active类
        this.elements.directionBtns.forEach(b => {
            b.classList.remove('active');
        });

        // 添加新激活状态
        btn.classList.add('active');
        
        // 触发重新计算
        this.debouncedCalculate();
        // 保存最新设置
        this.saveSettings();
    }

    // 获取当前方向（多/空）
    get currentDirection() {
        return document.querySelector('.position-btn.active').dataset.direction;
    }

    // 防抖处理的计算方法
    debouncedCalculate() {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => this.calculate(), this.debounceDelay);
    }

    // 主计算逻辑
    calculate() {
        try {
            // 获取最后修改的两个字段
            const sortedFields = Object.entries(this.inputHistory)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 2)
                .map(item => item[0]);
            // 确定计算模式
            const [first, second] = sortedFields;
            this.currentMode = this.getCalculationMode(first, second);
            // 执行计算
            this.executeModeCalculation();
            // 更新结果展示
            this.updateResults();
            // 保存当前设置
            this.saveSettings();
        } catch (error) {
            this.showError(error.message);
        }
    }

    // 定义计算模式映射
    getCalculationMode(fieldA, fieldB) {
        const modeMap = {
            'entry-exit': 'change',
            'change-entry': 'exit',
            'change-exit': 'entry'
        };
        return modeMap[[fieldA, fieldB].sort().join('-')];
    }

    // 执行具体计算
    executeModeCalculation() {
        const isLong = this.currentDirection === 'long';
        const entry = parseFloat(this.elements.entry.value);
        const exit = parseFloat(this.elements.exit.value);
        const change = parseFloat(this.elements.change.value);
        switch (this.currentMode) {
            case 'change':
                this.elements.change.value = this.calculateChangePercent(entry, exit, isLong);
                break;
            case 'exit':
                this.elements.exit.value = this.calculateExitPrice(entry, change, isLong);
                break;
            case 'entry':
                this.elements.entry.value = this.calculateEntryPrice(exit, change, isLong);
                break;
        }
    }

    // 计算涨跌幅（基础逻辑）
    calculateChangePercent(entry, exit, isLong) {
        if(isNaN(entry) || isNaN(exit)) {
            return "";
        }
        return isLong ?
            ((exit - entry) / entry * 100).toFixed(2) :    // 多单公式
            ((entry - exit) / entry * 100).toFixed(2);      // 空单公式
    }

    // 计算平仓价（根据涨跌幅）
    calculateExitPrice(entry, change, isLong) {
        if(isNaN(entry) || isNaN(change)) {
            return "";
        }
        return isLong ?
            (entry * (1 + change / 100)).toFixed(4) :      // 多单：开仓价 × (1 + 涨跌幅)
            (entry * (1 - change / 100)).toFixed(4);      // 空单：开仓价 × (1 - 涨跌幅)
    }

    // 计算开仓价（根据平仓价和涨跌幅）
    calculateEntryPrice(exit, change, isLong) {
        if(isNaN(exit) || isNaN(change)) {
            return "";
        }
        return isLong ?
            (exit / (1 + change / 100)).toFixed(4) :      // 多单：平仓价 ÷ (1 + 涨跌幅)
            (exit / (1 - change / 100)).toFixed(4);       // 空单：平仓价 ÷ (1 - 涨跌幅)
    }

    // 更新结果展示区域
    updateResults() {
        const entry = parseFloat(this.elements.entry.value);
        const exit = parseFloat(this.elements.exit.value);
        const leverage = parseFloat(this.elements.leverage.value) || 1;

        if (!entry || !exit) {
            this.clearResults();
            return;
        }

        // 计算基础涨跌幅
        const baseChange = this.calculateChangePercent(entry, exit, this.currentDirection === 'long');

        // 计算杠杆后收益
        const leveragedChange = (baseChange * leverage).toFixed(2);

        // 更新显示内容
        this.elements.baseResult.textContent = `${baseChange >= 0 ? '+' : ''}${baseChange}%`;
        this.elements.leverageResult.textContent = `${leveragedChange >= 0 ? '+' : ''}${leveragedChange}% (${leverage}x)`;

        // 设置颜色样式
        this.elements.baseResult.style.color = baseChange >= 0 ? 'var(--profit)' : 'var(--loss)';
        this.elements.leverageResult.style.color = leveragedChange >= 0 ? 'var(--profit)' : 'var(--loss)';

        // 添加模式显示
        const modeText = {
            'change': '根据开仓价和平仓价计算涨跌幅',
            'exit': '根据开仓价和涨跌幅计算平仓价',
            'entry': '根据平仓价和涨跌幅计算开仓价'
        };
        this.elements.modeDisplay.textContent = `计算模式：${modeText[this.currentMode]}`;
    }

    // 清空结果展示
    clearResults() {
        this.elements.baseResult.textContent = '-';
        this.elements.leverageResult.textContent = '-';
        this.elements.baseResult.style.color = 'inherit';
        this.elements.leverageResult.style.color = 'inherit';
    }

    // 显示错误信息
    showError(message) {
        this.elements.baseResult.textContent = message;
        this.elements.leverageResult.textContent = '检查输入';
        this.elements.baseResult.style.color = 'var(--loss)';
        this.elements.leverageResult.style.color = 'var(--loss)';
    }

    // 重置计算器到初始状态
    resetCalculator() {
        // 清空输入字段
        this.elements.entry.value = '';
        this.elements.exit.value = '';
        this.elements.change.value = '';
        // 重置杠杆倍数
        this.elements.leverage.value = 20;
        // 重置多空选择
        this.elements.directionBtns.forEach(b => b.classList.remove('active'));
        document.querySelector('[data-direction="long"]').classList.add('active');
        // 清空结果
        this.clearResults();
        // 清除存储数据
        localStorage.clear();
    }

    // 保存用户设置到localStorage
    saveSettings() {
        localStorage.direction = this.currentDirection;
        localStorage.leverage = this.elements.leverage.value;
        localStorage.change = this.elements.change.value;
        localStorage.entry = this.elements.entry.value;
        localStorage.exit = this.elements.exit.value;
    }

    // 加载用户设置
    loadSettings() {
        if(localStorage.direction) {
            this.elements.directionBtns.forEach(b => {
                    b.classList.toggle('active', b.dataset.direction === localStorage.direction);
                });
        }
        if(localStorage.leverage) {
            this.elements.leverage.value = localStorage.leverage;
        }
        if(localStorage.change) {
            this.elements.change.value = localStorage.change;
        }
        if(localStorage.entry) {
            this.elements.entry.value = localStorage.entry;
        }
        if(localStorage.exit) {
            this.elements.exit.value = localStorage.exit;
        }
        this.debouncedCalculate();
    }
}

// 初始化：当DOM加载完成后创建计算器实例
document.addEventListener('DOMContentLoaded', () => new TradingCalculator());
