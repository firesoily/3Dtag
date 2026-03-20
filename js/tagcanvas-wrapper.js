/**
 * TagCanvasWrapper - Three.js 3D标签云封装
 * 替代 TagCanvas，使用 Three.js 实现
 */

class TagCanvasWrapper {
    constructor(canvasElement, options = {}) {
        this.canvas = canvasElement;
        this.tags = [];
        this.initialized = false;
        this.currentTheme = 'default';
        this.themes = {
            default: { noun: '#3b82f6', verb: '#10b981', adj: '#f59e0b', other: '#9ca3af' },
            ocean: { noun: '#0284c7', verb: '#0ea5e9', adj: '#38bdf8', other: '#64748b' },
            forest: { noun: '#16a34a', verb: '#22c55e', adj: '#84cc16', other: '#6b7280' },
            sunset: { noun: '#ea580c', verb: '#f97316', adj: '#fbbf24', other: '#9ca3af' },
            galaxy: { noun: '#9333ea', verb: '#c084fc', adj: '#f0abfc', other: '#6b7280' }
        };
        this.filteredTags = [];
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.textMeshes = [];
        this.isDragging = false;
        this.previousMousePosition = { x: 0, y: 0 };
        this.rotationVelocity = { x: 0, y: 0 };
        this.autoRotate = true;
        this.autoRotateSpeed = 0.001;
    }

    async init() {
        if (typeof THREE === 'undefined') {
            throw new Error('Three.js library not loaded');
        }

        // 初始化 Three.js 场景
        this.scene = new THREE.Scene();
        this.scene.background = null; // 透明背景

        // 相机设置
        const aspect = this.canvas.clientWidth / this.canvas.clientHeight || 1;
        this.camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
        this.camera.position.z = 300;

        // 渲染器
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            alpha: true,
            antialias: true
        });
        this.renderer.setSize(this.canvas.clientWidth || 800, this.canvas.clientHeight || 600);
        this.renderer.setPixelRatio(window.devicePixelRatio || 1);

        // 事件绑定
        this._bindEvents();

        // 开始渲染循环
        this._animate();

        this.initialized = true;
        console.log('Three.js TagCloud initialized');
    }

    _bindEvents() {
        this.canvas.addEventListener('mousedown', (e) => {
            this.isDragging = true;
            this.autoRotate = false;
            this.previousMousePosition = { x: e.clientX, y: e.clientY };
        });

        this.canvas.addEventListener('mousemove', (e) => {
            if (this.isDragging) {
                const deltaMove = {
                    x: e.clientX - this.previousMousePosition.x,
                    y: e.clientY - this.previousMousePosition.y
                };
                this.rotationVelocity.y = deltaMove.x * 0.005;
                this.rotationVelocity.x = deltaMove.y * 0.005;
                this.previousMousePosition = { x: e.clientX, y: e.clientY };
            }
        });

        this.canvas.addEventListener('mouseup', () => {
            this.isDragging = false;
            // 3秒后恢复自动旋转
            setTimeout(() => { this.autoRotate = true; }, 3000);
        });

        this.canvas.addEventListener('mouseleave', () => {
            this.isDragging = false;
        });

        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const zoomSpeed = 0.1;
            if (e.deltaY < 0) {
                this.camera.position.z = Math.max(100, this.camera.position.z - 20);
            } else {
                this.camera.position.z = Math.min(500, this.camera.position.z + 20);
            }
        }, { passive: false });

        this.canvas.addEventListener('click', (e) => {
            this._handleClick(e);
        });

        // 窗口大小调整
        window.addEventListener('resize', () => {
            const width = this.canvas.clientWidth || 800;
            const height = this.canvas.clientHeight || 600;
            this.camera.aspect = width / height;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(width, height);
        });
    }

    _animate() {
        requestAnimationFrame(() => this._animate());

        if (this.autoRotate) {
            this.scene.rotation.y += this.autoRotateSpeed;
        } else {
            this.scene.rotation.x += this.rotationVelocity.x;
            this.scene.rotation.y += this.rotationVelocity.y;
            // 衰减
            this.rotationVelocity.x *= 0.95;
            this.rotationVelocity.y *= 0.95;
        }

        this.renderer.render(this.scene, this.camera);
    }

    _createTextTexture(text, color, weight) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const fontSize = Math.max(12, Math.min(40, weight));
        ctx.font = `bold ${fontSize}px Arial, sans-serif`;
        const textWidth = ctx.measureText(text).width;
        canvas.width = textWidth + 10;
        canvas.height = fontSize + 10;
        ctx.font = `bold ${fontSize}px Arial, sans-serif`;
        ctx.fillStyle = color;
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'center';
        ctx.fillText(text, canvas.width / 2, canvas.height / 2);

        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        return texture;
    }

    _fibonacciSphere(samples, radius) {
        const points = [];
        const phi = Math.PI * (3 - Math.sqrt(5)); // 黄金角
        for (let i = 0; i < samples; i++) {
            const y = 1 - (i / (samples - 1)) * 2; // y从1到-1
            const r = Math.sqrt(1 - y * y); // 半径在y处
            const theta = phi * i; // 黄金角增量
            const x = Math.cos(theta) * r;
            const z = Math.sin(theta) * r;
            points.push(new THREE.Vector3(x * radius, y * radius, z * radius));
        }
        return points;
    }

    render(tags) {
        if (!this.initialized) {
            console.warn('TagCanvasWrapper not initialized');
            return;
        }

        // 清除旧标签
        this.textMeshes.forEach(mesh => {
            this.scene.remove(mesh);
            if (mesh.material.map) mesh.material.map.dispose();
            mesh.material.dispose();
        });
        this.textMeshes = [];

        this.tags = tags;
        this.filteredTags = tags;

        if (tags.length === 0) return;

        // 计算最大词频
        const maxCount = Math.max(...tags.map(t => t.count), 1);

        // 获取主题颜色
        const theme = this.themes[this.currentTheme];
        const radius = 150; // 球半径

        // 生成球面上的点
        const positions = this._fibonacciSphere(tags.length, radius);

        // 创建标签
        tags.forEach((tag, index) => {
            const weight = Math.max(10, (tag.count / maxCount) * 30 + 10);
            const colorMap = { noun: theme.noun, verb: theme.verb, adj: theme.adj, other: theme.other };
            const color = colorMap[tag.type] || theme.other;

            const texture = this._createTextTexture(tag.word, color, weight);
            const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
            const sprite = new THREE.Sprite(material);

            const pos = positions[index];
            sprite.position.copy(pos);
            sprite.scale.set(weight * 0.8, weight * 0.4, 1);

            sprite.userData = { word: tag.word, count: tag.count, type: tag.type };

            this.scene.add(sprite);
            this.textMeshes.push(sprite);
        });
    }

    setTheme(themeName) {
        if (this.themes[themeName]) {
            this.currentTheme = themeName;
            if (this.tags.length > 0) {
                this.render(this.tags);
            }
        }
    }

    filter(keyword) {
        if (!this.initialized) return;

        const filtered = keyword
            ? this.tags.filter(tag => tag.word.toLowerCase().includes(keyword.toLowerCase()))
            : this.tags;

        this.filteredTags = filtered;
        this.render(filtered);
    }

    async exportPNGAsync() {
        return new Promise((resolve) => {
            this.renderer.render(this.scene, this.camera);
            const dataUrl = this.canvas.toDataURL('image/png');
            resolve(dataUrl);
        });
    }

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
            if (counts[tag.type] !== undefined) counts[tag.type]++;
        });
        return counts;
    }

    _handleClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const mouse = new THREE.Vector2();
        mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, this.camera);

        const intersects = raycaster.intersectObjects(this.textMeshes);
        if (intersects.length > 0) {
            const object = intersects[0].object;
            if (object.userData && window.app) {
                const tagData = window.app.currentTags.find(t => t.word === object.userData.word);
                if (tagData) {
                    window.app.showTagDetail(
                        tagData.word,
                        tagData.count,
                        tagData.type,
                        window.app.totalFrequency
                    );
                }
            }
        }
    }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TagCanvasWrapper;
}