    async init() {
        try {
            console.log('App init: checking Three.js library...');
            if (typeof THREE === 'undefined') {
                throw new Error('Three.js library not loaded (THREE is undefined)');
            }
            console.log('Three.js library found:', typeof THREE);

            // 初始化 TagCanvasWrapper (Three.js 实现)
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