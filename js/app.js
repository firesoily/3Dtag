/**
 * 3Dtag - 主应用逻辑
 * 协调 UI 交互、文本处理、标签云渲染
 */

class App {
    constructor() {
        // DOM 元素
        this.textInput = document.getElementById('text-input');
        this.generateBtn = document.getElementById('generate-btn');
        this.clearBtn = document.getElementById('clear-btn');
        this.tagLimitSlider = document.getElementById('tag-limit');
        this.tagCountDisplay = document.getElementById('tag-count-display');
        this.themeSelect = document.getElementById('theme-select');
        this.searchInput = document.getElementById('search-input');
        this.clearSearchBtn = document.getElementById('clear-search-btn');
        this.exportBtn = document.getElementById('export-btn');
        this.loadingIndicator = document.getElementById('loading-indicator');
        this.modal = document.getElementById('detail-modal');
        this.modalClose = document.querySelector('.modal-close');
        this.detailWord = document.getElementById('detail-word');
        this.detailCount = document.getElementById('detail-count');
        this.detailType = document.getElementById('detail-type');
        this.detailPercent = document.getElementById('detail-percent');
        this.helpLink = document.getElementById('help-link');

        // 统计元素
        this.statTotal = document.getElementById('stat-total');
        this.statFreq = document.getElementById('stat-freq');
        this.statTime = document.getElementById('stat-time');

        // 模块实例
        this.textProcessor = new TextProcessor();
        this.tagCloud = null;

        // 状态
        this.currentTags = [];
        this.totalFrequency = 0;

        // 初始化
        this.init();
    }

    async init() {
        try {
            console.log('App init: checking Three.js library...');
            if (typeof THREE === 'undefined') {
                throw new Error('Three.js library not loaded (THREE is undefined)');
            }
            console.log('Three.js library found:', typeof THREE);

            // 加载用户设置
            this._loadSettings();

            // 初始化 TagCanvasWrapper (Three.js 实现)
            const canvas = document.getElementById('tagcanvas');
            console.log('Canvas element:', canvas);
            this.tagCloud = new TagCanvasWrapper(canvas);
            await this.tagCloud.init();
            console.log('TagCloud initialized');

            // 绑定事件
            this.bindEvents();
            console.log('Events bound');

            // 加载历史记录
            this._loadHistory();

            // 加载示例（如果用户没有保存输入）
            if (!this.textInput.value.trim()) {
                this.loadExampleText();
            }
            console.log('Example text loaded if needed');

            console.log('3Dtag initialized successfully');
        } catch (error) {
            console.error('Failed to initialize:', error);
            this.showError('初始化失败，请刷新页面重试\n\n错误: ' + error.message);
        }
    }

    bindEvents() {
        // 生成按钮
        this.generateBtn.addEventListener('click', () => this.generate());

        // 清空按钮
        this.clearBtn.addEventListener('click', () => this.clearAll());

        // 标签数量滑块
        this.tagLimitSlider.addEventListener('input', (e) => {
            const value = e.target.value;
            this.tagCountDisplay.textContent = value;
        });

        // 标签数量变化（松开滑块）
        this.tagLimitSlider.addEventListener('change', () => {
            if (this.currentTags.length > 0) {
                this.generate(); // 重新生成
            }
        });

        // 主题切换
        this.themeSelect.addEventListener('change', (e) => {
            this.tagCloud.setTheme(e.target.value);
            this._saveSettings(); // 自动保存偏好
        });

        // 搜索过滤
        this.searchInput.addEventListener('input', (e) => {
            const keyword = e.target.value.trim();
            this.tagCloud.filter(keyword);
        });

        // 清除搜索
        this.clearSearchBtn.addEventListener('click', () => {
            this.searchInput.value = '';
            this.tagCloud.filter('');
        });

        // 导出按钮
        this.exportBtn.addEventListener('click', () => this.exportPNG());

        // 模态框关闭
        this.modalClose.addEventListener('click', () => this.hideModal());
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.hideModal();
            }
        });

        // 帮助链接
        this.helpLink = document.getElementById('help-link');
        this.helpModal = document.getElementById('help-modal');
        this.helpClose = this.helpModal?.querySelector('.modal-close');

        if (this.helpLink && this.helpModal) {
            this.helpLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.helpModal.classList.remove('hidden');
            });

            if (this.helpClose) {
                this.helpClose.addEventListener('click', () => {
                    this.helpModal.classList.add('hidden');
                });

                this.helpModal.addEventListener('click', (e) => {
                    if (e.target === this.helpModal) {
                        this.helpModal.classList.add('hidden');
                    }
                });
            }
        }

        // 键盘快捷键
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                this.generate();
            }
            if (e.key === 'Escape') {
                this.hideModal();
            }
        });
    }

    async generate() {
        console.log('Generate button clicked');
        const text = this.textInput.value.trim();
        console.log('Input text length:', text.length);

        if (!text) {
            this.showError('请输入文本');
            return;
        }

        // 智能推荐标签数量（如果用户没有手动调整）
        const recommendedLimit = this._recommendTagLimit(text);
        const currentLimit = parseInt(this.tagLimitSlider.value);
        if (Math.abs(currentLimit - recommendedLimit) > 10) {
            // 差距较大，自动调整
            this.tagLimitSlider.value = recommendedLimit;
            this.tagCountDisplay.textContent = recommendedLimit;
            console.log(`Auto-adjusted tag limit: ${currentLimit} → ${recommendedLimit}`);
        }

        // 显示加载状态
        this.showLoading(true);

        try {
            // 使用 setTimeout 让 UI 有机会渲染加载状态
            await new Promise(resolve => setTimeout(resolve, 50));

            // 自适应标签数量（如果用户未手动调整）
            let limit = parseInt(this.tagLimitSlider.value);
            if (!this.userAdjustedLimit) {
                const textLen = text.length;
                if (textLen < 500) {
                    limit = 30;
                } else if (textLen < 1000) {
                    limit = 50;
                } else if (textLen < 3000) {
                    limit = 80;
                } else if (textLen < 5000) {
                    limit = 120;
                } else {
                    limit = 150;
                }
                // 更新滑块和显示
                this.tagLimitSlider.value = limit;
                this.tagCountDisplay.textContent = limit;
                console.log(`Auto-adjusted tag limit based on text length (${textLen} chars): ${limit}`);
            } else {
                console.log(`Using user-selected tag limit: ${limit}`);
            }

            console.log('Tag limit:', limit);
            const startTime = performance.now();

            // 处理文本
            console.log('Calling TextProcessor.extractKeywords...');
            const tags = this.textProcessor.extractKeywords(text, { limit });
            console.log('Extracted tags:', tags.length, tags);

            const endTime = performance.now();
            const processingTime = (endTime - startTime).toFixed(2);

            if (tags.length < 5) {
                this.showError('关键词太少，请提供更多文本');
                this.showLoading(false);
                return;
            }

            // 更新状态
            this.currentTags = tags;
            this.totalFrequency = tags.reduce((sum, t) => sum + t.count, 0);

            // 渲染标签云
            console.log('Rendering tag cloud with', tags.length, 'tags');
            this.tagCloud.render(tags);
            console.log('TagCloud.render() called');

            // 更新统计
            this.updateStats(tags.length, this.totalFrequency, processingTime);

            this.showLoading(false);

            // ✅ 保存设置和历史
            this._saveSettings();
            this._saveToHistory(tags, text);
            console.log('Settings and history saved after generation');

        } catch (error) {
            console.error('Generate error:', error);
            this.showError('处理失败，请检查文本格式\n\n错误: ' + error.message);
            this.showLoading(false);
        }
    }

    updateStats(total, freq, time) {
        this.statTotal.textContent = total;
        this.statFreq.textContent = freq;
        this.statTime.textContent = `${time}ms`;
    }

    async exportPNG() {
        if (this.currentTags.length === 0) {
            this.showError('没有可导出的标签云');
            return;
        }

        this.exportBtn.disabled = true;
        this.exportBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 导出中...';

        try {
            const dataUrl = await this.tagCloud.exportPNGAsync();

            if (dataUrl) {
                // 创建下载链接
                const link = document.createElement('a');
                link.download = `3Dtag-${Date.now()}.png`;
                link.href = dataUrl;
                link.click();
            } else {
                this.showError('导出失败');
            }
        } catch (error) {
            console.error('Export error:', error);
            this.showError('导出失败');
        } finally {
            this.exportBtn.disabled = false;
            this.exportBtn.innerHTML = '<i class="fas fa-download"></i> 导出PNG';
        }
    }

    clearAll() {
        this.textInput.value = '';
        this.searchInput.value = '';
        this.currentTags = [];
        this.totalFrequency = 0;

        // 清空标签云
        const container = document.getElementById('tags');
        if (container) {
            container.innerHTML = '';
        }

        // 重置统计
        this.updateStats(0, 0, '0ms');
    }

    showLoading(show) {
        if (show) {
            this.loadingIndicator.classList.remove('hidden');
            this.generateBtn.disabled = true;
        } else {
            this.loadingIndicator.classList.add('hidden');
            this.generateBtn.disabled = false;
        }
    }

    showError(message) {
        alert(message);
    }

    loadExampleText() {
        const example = `人工智能是当今科技领域最热门的话题之一。
Artificial Intelligence (AI) 正在改变我们的生活方式，从自动驾驶到智能助手，AI 无处不在。
机器学习、深度学习、自然语言处理等技术让计算机能够理解、学习和创新。`;

        this.textInput.value = example.trim();
    }

    // 显示标签详情
    showTagDetail(word, count, type, total) {
        const percent = ((count / total) * 100).toFixed(2) + '%';
        const typeNames = {
            'noun': '名词',
            'verb': '动词',
            'adj': '形容词',
            'other': '其他'
        };

        this.detailWord.textContent = word;
        this.detailCount.textContent = count;
        this.detailType.textContent = typeNames[type] || type;
        this.detailPercent.textContent = percent;

        this.modal.classList.remove('hidden');
    }

    hideModal() {
        this.modal.classList.add('hidden');
    }

    // ====== Settings & History Management ======

    /**
     * 从 localStorage 加载用户设置
     */
    _loadSettings() {
        try {
            const saved = localStorage.getItem('3dtag-settings');
            if (saved) {
                const settings = JSON.parse(saved);
                console.log('Loaded settings:', settings);

                // 应用主题
                if (settings.theme && this.themeSelect) {
                    this.themeSelect.value = settings.theme;
                }

                // 应用标签数量
                if (settings.tagLimit && this.tagLimitSlider) {
                    this.tagLimitSlider.value = settings.tagLimit;
                    this.tagCountDisplay.textContent = settings.tagLimit;
                }

                // 恢复上次输入的文本
                if (settings.lastText && this.textInput) {
                    this.textInput.value = settings.lastText;
                }

                // 恢复搜索关键词
                if (settings.lastSearch && this.searchInput) {
                    this.searchInput.value = settings.lastSearch;
                }
            }
        } catch (error) {
            console.warn('Failed to load settings:', error);
        }
    }

    /**
     * 保存用户设置到 localStorage
     */
    _saveSettings() {
        try {
            const settings = {
                theme: this.themeSelect?.value || 'default',
                tagLimit: parseInt(this.tagLimitSlider?.value) || 50,
                lastText: this.textInput?.value || '',
                lastSearch: this.searchInput?.value || '',
                savedAt: new Date().toISOString()
            };
            localStorage.setItem('3dtag-settings', JSON.stringify(settings));
            console.log('Settings saved:', settings);
        } catch (error) {
            console.warn('Failed to save settings:', error);
        }
    }

    /**
     * 保存当前生成到历史记录
     */
    _saveToHistory(tags, text) {
        if (!tags || tags.length === 0) return;

        const record = {
            id: Date.now(),
            tags: tags.slice(0, 50), // 保存前50个标签
            text: text.substring(0, 500), // 保存前500字原文
            settings: {
                theme: this.themeSelect?.value || 'default',
                tagLimit: parseInt(this.tagLimitSlider?.value) || 50
            },
            stats: {
                total: tags.length,
                totalFreq: tags.reduce((sum, t) => sum + t.count, 0),
                byType: this._countByType(tags)
            },
            createdAt: new Date().toISOString()
        };

        // 添加到头部
        this.history.unshift(record);

        // 只保留最近10条
        if (this.history.length > 10) {
            this.history = this.history.slice(0, 10);
        }

        // 保存到 localStorage
        try {
            localStorage.setItem('3dtag-history', JSON.stringify(this.history));
            console.log('History saved, total records:', this.history.length);
        } catch (error) {
            console.warn('Failed to save history:', error);
        }
    }

    /**
     * 从 localStorage 加载历史记录
     */
    _loadHistory() {
        try {
            const saved = localStorage.getItem('3dtag-history');
            if (saved) {
                this.history = JSON.parse(saved);
                console.log('History loaded, records:', this.history.length);
            }
        } catch (error) {
            console.warn('Failed to load history:', error);
            this.history = [];
        }
    }

    /**
     * 统计标签类型分布
     */
    _countByType(tags) {
        const counts = { noun: 0, verb: 0, adj: 0, other: 0 };
        tags?.forEach(tag => {
            if (counts[tag.type] !== undefined) counts[tag.type]++;
        });
        return counts;
    }

    /**
     * 根据文本自动推荐标签数量
     */
    _recommendTagLimit(text) {
        if (!text) return 50;

        const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
        const englishWords = (text.match(/[a-zA-Z]+/g) || []).length;
        const totalChars = text.length;

        let recommended;
        if (chineseChars > totalChars * 0.6) {
            recommended = Math.floor(chineseChars / 10);
        } else {
            recommended = Math.floor(englishWords / 8);
        }

        recommended = Math.max(20, Math.min(100, recommended));

        if (totalChars > 3000) {
            recommended = Math.min(recommended, 80);
        } else if (totalChars < 200) {
            recommended = Math.min(recommended, 30);
        }

        return recommended;
    }

    /**
     * 更新搜索匹配计数显示
     */
    updateSearchCount(matched, total) {
        const countEl = document.getElementById('match-count');
        const totalEl = document.getElementById('total-count');
        const container = document.getElementById('search-count');

        if (countEl && totalEl && container) {
            countEl.textContent = matched;
            totalEl.textContent = total;
            if (matched > 0 || total > 0) {
                container.classList.remove('hidden');
            } else {
                container.classList.add('hidden');
            }
        }
    }
}

// 启动应用
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();

    // 暴露标签点击事件处理（TagCanvas回调）
    window.onTagClick = function(tag) {
        if (window.app && window.app.currentTags.length > 0) {
            const tagData = window.app.currentTags.find(t => t.word === tag.text);
            if (tagData) {
                window.app.showTagDetail(
                    tagData.word,
                    tagData.count,
                    tagData.type,
                    window.app.totalFrequency
                );
            }
        }
    };
});