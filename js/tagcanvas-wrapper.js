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
        this.currentMousePosition = { x: -100, y: -100 }; // 初始在屏幕外
        this.rotationVelocity = { x: 0, y: 0 };
        this.autoRotate = true;
        this.autoRotateSpeed = 0.001;

        // 动画相关
        this.animatingTags = new Map(); // tag word -> { targetScale, currentScale, startTime, duration }
        this.hoveredTag = null;
        this.animationDuration = 800; // ms

        // 性能监控（调试用）
        this.debugFPS = false;
        this.frameCount = 0;
        this.lastFpsUpdate = 0;
        this.fps = 0;
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
            // 总是更新鼠标位置（用于悬停检测）
            this.currentMousePosition = {
                x: e.clientX,
                y: e.clientY
            };

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

        // 触摸支持
        let initialTouchDistance = 0;
        let initialCameraZ = this.camera.position.z;

        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (e.touches.length === 1) {
                // 单指：开始旋转
                this.isDragging = true;
                this.autoRotate = false;
                this.previousMousePosition = {
                    x: e.touches[0].clientX,
                    y: e.touches[0].clientY
                };
            } else if (e.touches.length === 2) {
                // 双指：开始缩放
                const dx = e.touches[0].clientX - e.touches[1].clientX;
                const dy = e.touches[0].clientY - e.touches[1].clientY;
                initialTouchDistance = Math.sqrt(dx * dx + dy * dy);
                initialCameraZ = this.camera.position.z;
            }
        }, { passive: false });

        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (e.touches.length === 1 && this.isDragging) {
                // 单指拖动旋转
                const deltaMove = {
                    x: e.touches[0].clientX - this.previousMousePosition.x,
                    y: e.touches[0].clientY - this.previousMousePosition.y
                };
                this.rotationVelocity.y = deltaMove.x * 0.005;
                this.rotationVelocity.x = deltaMove.y * 0.005;
                this.previousMousePosition = {
                    x: e.touches[0].clientX,
                    y: e.touches[0].clientY
                };
            } else if (e.touches.length === 2) {
                // 双指缩放
                const dx = e.touches[0].clientX - e.touches[1].clientX;
                const dy = e.touches[0].clientY - e.touches[1].clientY;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const scale = initialTouchDistance / distance;
                const newZ = Math.max(100, Math.min(500, initialCameraZ * scale));
                this.camera.position.z = newZ;
            }
        }, { passive: false });

        this.canvas.addEventListener('touchend', () => {
            this.isDragging = false;
            setTimeout(() => { this.autoRotate = true; }, 3000);
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

        // FPS 计算
        if (this.debugFPS) {
            this.frameCount++;
            const now = performance.now();
            if (now - this.lastFpsUpdate >= 1000) {
                this.fps = this.frameCount;
                this.frameCount = 0;
                this.lastFpsUpdate = now;
                console.log(`[TagCanvas] FPS: ${this.fps}, tags: ${this.tags.length}`);
            }
        }

        if (this.autoRotate) {
            this.scene.rotation.y += this.autoRotateSpeed;
        } else {
            this.scene.rotation.x += this.rotationVelocity.x;
            this.scene.rotation.y += this.rotationVelocity.y;
            // 衰减
            this.rotationVelocity.x *= 0.95;
            this.rotationVelocity.y *= 0.95;
        }

        // 更新标签动画
        this._updateAnimations();
        this._checkHover();

        this.renderer.render(this.scene, this.camera);
    }

    /**
     * 检测鼠标悬停并应用放大效果
     */
    _checkHover() {
        // 如果有正在进行的动画（入场或脉冲），不应用悬停效果
        if (this.animatingTags.size > 0) return;

        const rect = this.canvas.getBoundingClientRect();
        const mouse = new THREE.Vector2();
        mouse.x = ((this.currentMousePosition.x - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((this.currentMousePosition.y - rect.top) / rect.height) * 2 + 1;

        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, this.camera);

        const intersects = raycaster.intersectObjects(this.textMeshes);

        if (intersects.length > 0) {
            const hoveredWord = intersects[0].object.userData.word;
            if (hoveredWord !== this.hoveredTag) {
                // 恢复上一个悬停标签
                if (this.hoveredTag) {
                    this._resetTagScale(this.hoveredTag);
                }
                // 放大新悬停标签
                this.hoveredTag = hoveredWord;
                this._scaleTag(hoveredWord, 1.3);
            }
        } else if (this.hoveredTag) {
            // 鼠标离开，恢复
            this._resetTagScale(this.hoveredTag);
            this.hoveredTag = null;
        }
    }

    /**
     * 设置标签缩放（叠加到基础缩放）
     */
    _scaleTag(word, factor) {
        const sprite = this.textMeshes.find(m => m.userData.word === word);
        if (sprite && sprite.userData.baseScale) {
            const base = sprite.userData.baseScale;
            sprite.scale.set(
                base.x * factor,
                base.y * factor,
                base.z * factor
            );
        }
    }

    /**
     * 重置标签到基础缩放
     */
    _resetTagScale(word) {
        const sprite = this.textMeshes.find(m => m.userData.word === word);
        if (sprite && sprite.userData.baseScale) {
            const base = sprite.userData.baseScale;
            sprite.scale.set(base.x, base.y, base.z);
        }
    }
    _updateAnimations() {
        const now = performance.now();
        const toRemove = [];

        this.animatingTags.forEach((anim, word) => {
            const { startTime, duration, startScale, targetScale } = anim;
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // 使用缓动函数：easeOutQuad
            const eased = 1 - (1 - progress) * (1 - progress);

            const currentScale = startScale + (targetScale - startScale) * eased;

            // 找到对应的 sprite 并更新缩放
            const sprite = this.textMeshes.find(m => m.userData.word === word);
            if (sprite) {
                const baseScale = sprite.userData.baseScale || { x: 1, y: 0.5, z: 1 };
                sprite.scale.set(
                    baseScale.x * currentScale,
                    baseScale.y * currentScale,
                    baseScale.z * currentScale
                );
            }

            if (progress >= 1) {
                toRemove.push(word);
            }
        });

        // 移除完成的动画
        toRemove.forEach(word => this.animatingTags.delete(word));
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

    render(tags, isFiltered = false) {
        if (!this.initialized) {
            console.warn('TagCanvasWrapper not initialized');
            return;
        }

        // 重置悬停状态（因为场景清空）
        this.hoveredTag = null;

        // 清除旧标签
        this.textMeshes.forEach(mesh => {
            this.scene.remove(mesh);
            if (mesh.material.map) mesh.material.map.dispose();
            mesh.material.dispose();
        });
        this.textMeshes = [];

        this.tags = tags;
        // 注意：filteredTags 由 filter() 方法维护，这里只更新显示

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

            // 高亮逻辑：如果处于过滤模式，只有匹配的关键词才高亮（不透明），其他降低透明度
            let alpha = 1.0;
            if (isFiltered && this.matchedSet && !this.matchedSet.has(tag.word)) {
                alpha = 0.2; // 非匹配标签变半透明
            }

            const texture = this._createTextTexture(tag.word, color, weight);
            const material = new THREE.SpriteMaterial({
                map: texture,
                transparent: true,
                opacity: alpha,
                depthWrite: false // 避免透明渲染问题
            });
            const sprite = new THREE.Sprite(material);

            const pos = positions[index];
            sprite.position.copy(pos);

            // 基础缩放（根据权重）
            const baseScaleX = weight * 0.8;
            const baseScaleY = weight * 0.4;
            const baseScaleZ = 1;
            sprite.scale.set(0, 0, 0); // 初始为0，通过动画展开

            // 保存基础缩放到 userData，供动画使用
            sprite.userData = {
                word: tag.word,
                count: tag.count,
                type: tag.type,
                baseScale: { x: baseScaleX, y: baseScaleY, z: baseScaleZ }
            };

            this.scene.add(sprite);
            this.textMeshes.push(sprite);

            // 🎬 添加入场动画
            this.animatingTags.set(tag.word, {
                startTime: performance.now() + (index * 20), // 错开 20ms 产生波浪效果
                duration: this.animationDuration,
                startScale: 0,
                targetScale: 1
            });
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

        const keywords = keyword
            ? keyword.toLowerCase().split(/\s+/).filter(k => k.length > 0)
            : [];

        // 找到匹配的标签
        const matchedSet = new Set();
        if (keywords.length > 0) {
            this.tags.forEach(tag => {
                const wordLower = tag.word.toLowerCase();
                const isMatch = keywords.every(k => wordLower.includes(k));
                if (isMatch) {
                    matchedSet.add(tag.word);
                }
            });
        }

        // 过滤显示：如果有关键词，只显示匹配的；否则显示全部
        const filtered = keywords.length > 0
            ? this.tags.filter(tag => matchedSet.has(tag.word))
            : this.tags;

        this.filteredTags = filtered;
        this.matchedSet = matchedSet; // 保存匹配集合用于高亮

        // 通知 App 更新匹配计数
        if (window.app && window.app.updateSearchCount) {
            window.app.updateSearchCount(matchedSet.size, this.tags.length);
        }

        this.render(filtered, keywords.length > 0);
    }

    async exportPNGAsync() {
        return new Promise((resolve) => {
            this.renderer.render(this.scene, this.camera);
            const dataUrl = this.canvas.toDataURL('image/png');
            resolve(dataUrl);
        });
    }

    /**
     * 导出为 SVG 矢量图（基于当前视图的 3D 投影）
     * @param {object} options - 导出选项
     * @returns {string} SVG 字符串
     */
    exportSVGAsync(options = {}) {
        return new Promise((resolve) => {
            // 确保矩阵是最新的
            this.scene.updateMatrixWorld();
            this.camera.updateMatrixWorld();

            const width = options.width || 800;
            const height = options.height || 600;
            const backgroundColor = options.backgroundColor || '#ffffff';
            const fontFamily = options.fontFamily || 'Arial, sans-serif';

            // SVG 头部
            let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="${backgroundColor}"/>
  <g>`;

            const theme = this.themes[this.currentTheme];
            const colorMap = { noun: theme.noun, verb: theme.verb, adj: theme.adj, other: theme.other };

            // 相机投影参数
            const fov = this.camera.fov * Math.PI / 180;
            const f = 1 / Math.tan(fov / 2);
            const aspect = width / height;

            // 世界坐标转屏幕坐标
            const project = (worldPos) => {
                // 视图空间
                const viewPos = worldPos.clone().applyMatrix4(this.camera.matrixWorldInverse);
                // 检查是否在相机前方
                if (-viewPos.z <= 0.001) return null;
                const x_ndc = (viewPos.x * f / aspect) / -viewPos.z;
                const y_ndc = (viewPos.y * f) / -viewPos.z;
                // NDC 转屏幕
                const screenX = (x_ndc + 1) * 0.5 * width;
                const screenY = (1 - (y_ndc + 1) * 0.5) * height;
                return { x: screenX, y: screenY };
            };

            // 遍历当前显示的标签（this.textMeshes）
            this.textMeshes.forEach(sprite => {
                const { word, type, baseScale } = sprite.userData;
                if (!word || !baseScale) return;

                // 获取世界坐标
                const worldPos = new THREE.Vector3();
                sprite.getWorldPosition(worldPos);

                const screenPos = project(worldPos);
                if (!screenPos) return; // 在相机后面

                // 颜色
                const color = colorMap[type] || theme.other;

                // 字体大小：baseScale.x ≈ weight * 0.8
                const weight = Math.max(10, Math.min(40, baseScale.x / 0.8));
                const fontSize = Math.round(weight);

                svg += `
    <text x="${screenPos.x.toFixed(1)}" y="${screenPos.y.toFixed(1)}"
          font-family="${fontFamily}"
          font-size="${fontSize}px"
          font-weight="bold"
          fill="${color}"
          text-anchor="middle"
          dominant-baseline="central"
          style="text-shadow: 1px 1px 2px rgba(0,0,0,0.2);">
      ${this._escapeXml(word)}
    </text>`;
            });

            svg += `
</svg>`;

            resolve(svg);
        });
    }

    /**
     * XML 特殊字符转义
     */
    _escapeXml(text) {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    }

    setTheme(themeName) {
        if (this.themes[themeName]) {
            this.currentTheme = themeName;
            // 保持当前的过滤状态重新渲染
            const isFiltered = this.searchInput && this.searchInput.value.trim().length > 0;
            this.render(this.filteredTags || this.tags, isFiltered);
        }
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

                    // 💫 触发脉冲动画
                    this._triggerPulse(object);
                }
            }
        }
    }

    /**
     * 触发脉冲动画（点击反馈）
     */
    _triggerPulse(sprite) {
        const word = sprite.userData.word;
        // 如果已经有入场动画在运行，取消它
        if (this.animatingTags.has(word)) {
            this.animatingTags.delete(word);
        }

        // 脉冲动画：先放大到 1.3 倍，再回到 1.0
        this.animatingTags.set(word, {
            startTime: performance.now(),
            duration: 300,
            startScale: 1.0,
            targetScale: 1.3
        });

        // 延迟后回到原大小
        setTimeout(() => {
            this.animatingTags.set(word, {
                startTime: performance.now(),
                duration: 300,
                startScale: 1.3,
                targetScale: 1.0
            });
        }, 300);
    }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TagCanvasWrapper;
}