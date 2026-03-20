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
            console.log('App init: checking TagCanvas library...');
            if (typeof TagCanvas === 'undefined') {
                throw new Error('TagCanvas library not loaded (TagCanvas is undefined)');
            }
            console.log('TagCanvas library found:', typeof TagCanvas);

            // 初始化 TagCanvas
            const canvas = document.getElementById('tagcanvas');
            console.log('Canvas element:', canvas);
            this.tagCloud = new TagCanvasWrapper(canvas);
            await this.tagCloud.init();
            console.log('TagCloud initialized');

            // 绑定事件
            this.bindEvents();
            console.log('Events bound');

            // 加载示例
            this.loadExampleText();
            console.log('Example text loaded');

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
        this.helpLink.addEventListener('click', (e) => {
            e.preventDefault();
            alert(`使用说明：
1. 在文本框输入或粘贴文本
2. 点击"生成标签云"
3. 拖拽旋转、滚轮缩放
4. 悬停高亮、点击查看详情
5. 搜索过滤、导出PNG

支持中英文混合文本，最长建议1000字以内。`);
        });

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

        // 显示加载状态
        this.showLoading(true);

        try {
            // 使用 setTimeout 让 UI 有机会渲染加载状态
            await new Promise(resolve => setTimeout(resolve, 50));

            const limit = parseInt(this.tagLimitSlider.value);
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