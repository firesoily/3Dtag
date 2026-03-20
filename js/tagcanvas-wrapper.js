/**
 * TagCanvasWrapper - TagCanvas 3D标签云封装
 * 提供简化的API用于渲染和控制
 */

class TagCanvasWrapper {
    constructor(canvasElement, options = {}) {
        this.canvas = canvasElement;
        this.tc = null;
        this.tags = [];
        this.initialized = false;
        this.options = {
            radius: 0.8,           // 球半径（基于canvas尺寸）
            depth: 0.8,            // 3D深度
            maxSpeed: 1.5,         // 自动旋转速度
            initial: [0.3, -0.3],  // 初始旋转角度
            dragControl: true,     // 允许拖拽控制
            textColor: 'color',    // 单词颜色（由代码动态设置）
            outlineMethod: 'block',// 标签轮廓方法
            outlineRadius: 2,      // 轮廓半径
            background: null,      // 透明背景
            fadeIn: 500,           // 入场动画时间
            reverse: true,         // 反转方向
            hidden: false,         // 初始隐藏
            ...options
        };
        this.themes = {
            default: {
                noun: '#3b82f6',
                verb: '#10b981',
                adj: '#f59e0b',
                other: '#9ca3af'
            },
            ocean: {
                noun: '#0284c7',
                verb: '#0ea5e9',
                adj: '#38bdf8',
                other: '#64748b'
            },
            forest: {
                noun: '#16a34a',
                verb: '#22c55e',
                adj: '#84cc16',
                other: '#6b7280'
            },
            sunset: {
                noun: '#ea580c',
                verb: '#f97316',
                adj: '#fbbf24',
                other: '#9ca3af'
            },
            galaxy: {
                noun: '#9333ea',
                verb: '#c084fc',
                adj: '#f0abfc',
                other: '#6b7280'
            }
        };
        this.currentTheme = 'default';
    }

    /**
     * 初始化 TagCanvas（延迟到首次渲染）
     */
    async init() {
        // 延迟初始化，等到首次 render 时再真正创建 TagCanvas 实例
        this.initialized = true;
        return Promise.resolve();
    }

    /**
     * 确保 TagCanvas 实例已创建
     */
    _ensureInitialized() {
        if (this.tc) return; // 已经初始化

        if (typeof TagCanvas === 'undefined') {
            throw new Error('TagCanvas library not loaded');
        }

        // 创建实例
        this.tc = new TagCanvas(this.canvas, 'tags', this.options);
        this.tc.textFont = 'bold 16px "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

        console.log('TagCanvas initialized');
    }

    /**
     * 渲染标签云
     * @param {Array} tags - 标签数据 [{word, count, type}]
     */
    render(tags) {
        if (!this.initialized) {
            console.warn('TagCanvasWrapper not initialized, calling init()');
            // 自动初始化（如果还没初始化）
            this.init().then(() => this.render(tags)).catch(console.error);
            return;
        }

        this.tags = tags;

        // 确保 TagCanvas 实例已创建
        try {
            this._ensureInitialized();
        } catch (e) {
            console.error('Failed to initialize TagCanvas:', e);
            return;
        }

        // 转换为 TagCanvas 格式
        const tagElements = this._convertToTagCanvasFormat(tags);

        // 清空并重新添加标签
        const container = document.getElementById('tags');
        if (container) {
            container.innerHTML = '';
        } else {
            console.error('Tags container not found');
            return;
        }

        tagElements.forEach(tag => {
            const el = document.createElement('span');
            el.textContent = tag.text;
            el.setAttribute('data-weight', tag.weight);
            el.style.color = tag.color;
            el.className = 'tag-item';
            container.appendChild(el);
        });

        // 重新启动 TagCanvas
        if (this.tc) {
            this.tc.Reload();
        }
    }

    /**
     * 转换为 TagCanvas 格式
     */
    _convertToTagCanvasFormat(tags) {
        const theme = this.themes[this.currentTheme];
        const maxCount = Math.max(...tags.map(t => t.count), 1);

        return tags.map(tag => {
            // 根据词频计算权重（TagCanvas权重而非字体大小）
            const weight = Math.max(10, Math.floor((tag.count / maxCount) * 30) + 10);

            // 根据词性选择颜色
            const colorMap = {
                'noun': theme.noun,
                'verb': theme.verb,
                'adj': theme.adj,
                'other': theme.other
            };
            const color = colorMap[tag.type] || theme.other;

            return {
                text: tag.word,
                weight: weight,
                color: color
            };
        });
    }

    /**
     * 设置颜色主题
     */
    setTheme(themeName) {
        if (this.themes[themeName]) {
            this.currentTheme = themeName;
            if (this.tags.length > 0) {
                this.render(this.tags); // 重新渲染会确保初始化
            }
        }
    }

    /**
     * 搜索过滤
     * @param {string} keyword - 搜索关键词
     */
    filter(keyword) {
        if (!this.initialized) return;

        // 确保 TagCanvas 已创建
        if (!this.tc) {
            this._ensureInitialized();
        }

        const filtered = keyword
            ? this.tags.filter(tag => tag.word.toLowerCase().includes(keyword.toLowerCase()))
            : this.tags;

        this.render(filtered);
    }

    /**
     * 导出为PNG
     * @returns {string} Data URL
     */
    exportPNG() {
        if (!this.canvas) return null;

        // 暂停动画以捕获清晰帧
        this.tc.stop();

        // 等待一帧以确保渲染完成
        setTimeout(() => {
            const dataUrl = this.canvas.toDataURL('image/png');

            // 恢复动画
            this.tc.start();

            return dataUrl;
        }, 50);

        return null; // 异步操作，实际应在回调中使用
    }

    /**
     * 异步导出PNG（Promise版本）
     */
    async exportPNGAsync() {
        if (!this.initialized || !this.tc) {
            console.error('TagCanvas not initialized');
            return null;
        }

        return new Promise((resolve) => {
            this.tc.stop();

            setTimeout(() => {
                const dataUrl = this.canvas.toDataURL('image/png');
                this.tc.start();
                resolve(dataUrl);
            }, 100);
        });
    }

    /**
     * 获取标签统计
     */
    getStats() {
        return {
            total: this.tags.length,
            totalFrequency: this.tags.reduce((sum, t) => sum + t.count, 0),
            byType: this._countByType()
        };
    }

    _countByType() {
        const counts = { noun: 0, verb: 0, adj: 0, other: 0 };
        this.tags.forEach(tag => {
            if (counts[tag.type] !== undefined) {
                counts[tag.type]++;
            }
        });
        return counts;
    }

    /**
     * 销毁实例
     */
    destroy() {
        if (this.tc) {
            this.tc.stop();
            this.tc = null;
        }
    }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TagCanvasWrapper;
}