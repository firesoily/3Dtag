# 3Dtag - 3D智能标签云

一个轻量级的Web应用，能将任意文本转换为3D交互式标签云。

## ✨ 核心功能

- 🎯 **智能关键词提取**：支持中英文混合文本，自动过滤停用词，词干还原
- 🌐 **真正3D球状布局**：基于 Three.js 的实时渲染，360°自由旋转
- 🎨 **词性智能着色**：名词=蓝色、动词=绿色、形容词=橙色、其他=灰色
- 🔍 **实时搜索过滤**：多关键词 AND 搜索，匹配标签高亮，实时计数显示
- 📸 **双格式导出**：PNG（支持2x高清） + SVG（矢量无限缩放）
- 💾 **用户设置持久化**：主题、标签数量、历史记录自动保存
- 🎬 **丰富动画效果**：入场动画、悬停放大、点击脉冲
- 📱 **移动端优化**：触摸旋转、双指缩放、响应式布局

## 🚀 快速开始

### 在线使用
- 主域名：`https://3dtag.shop`（待 DNS 生效）
- 预览：`https://3dtag.pages.dev`

### 本地开发
```bash
# 克隆项目
git clone https://github.com/firesoily/3Dtag.git
cd 3Dtag

# 启动本地服务器（任意静态文件服务器）
python -m http.server 8000
# 或使用 VS Code Live Server

# 访问 http://localhost:8000
```

**注意**：由于 ES6 模块，需要通过 HTTP 服务器访问，不能直接打开 `file://`。

## 📖 使用说明

1. **输入文本**：在左侧文本框粘贴或输入文本（支持中英文，建议<3000字）
2. **调整标签数量**：拖动滑块设定显示的关键词数量（20-100）
3. **生成标签云**：点击"生成"按钮，2秒内自动渲染
4. **交互操作**：
   - 🖱️ **拖拽旋转**：按住左键拖动
   - **滚轮缩放**：放大/缩小视图
   - 📱 **触摸**：单指旋转、双指缩放（移动端）
   - **悬停高亮**：标签放大并增加边框
   - **点击详情**：显示词语、频率、词性、占比
5. **搜索过滤**：输入空格分隔的关键词，仅显示匹配标签
6. **选择主题**：切换配色方案
7. **导出**：
   - **PNG**：快速导出图片（可选2x高清）
   - **SVG**：矢量格式，适合印刷和放大

## 🎯 完整功能清单

### ✅ 已完成功能

- [x] 智能文本处理
  - 中英文分词（复合词保护：人工智能、机器学习等）
  - 扩展停用词表（中英文）
  - 简化词干提取（100+ 动词映射）
  - 词性标注（规则+词典）
- [x] 3D渲染（Three.js）
  - 球面均匀分布算法（Fibonacci Sphere）
  - 动态颜色（词性分类）
  - 动态字体大小（词频比例）
- [x] 交互功能
  - 拖拽旋转（鼠标/触摸）
  - 滚轮/双指缩放
  - 标签点击详情
  - 自动旋转（闲置3秒后恢复）
- [x] 搜索与过滤
  - 多关键词 AND 搜索
  - 非匹配标签透明度降低
  - 实时匹配计数
- [x] 动画系统
  - 入场动画（波浪式展开）
  - 悬停放大（1.3倍缓动）
  - 点击脉冲（两次缩放循环）
- [x] 导出功能
  - PNG 导出（可调尺寸，2x高清）
  - SVG 矢量导出（可配置宽高、背景）
- [x] 用户体验
  - 设置自动保存/恢复（localStorage）
  - 历史记录（最近10次）
  - 自适应标签数量（智能推荐）
  - 响应式UI（桌面+移动）
  - 性能统计（处理时间、标签数）

### 🔄 计划中功能
- [ ] Web Worker 后台处理（大文本）
- [ ] 更多主题（深色系、自定义配色）
- [ ] 标签云动态参数调整（旋转速度、密度）
- [ ] 多语言 UI（英文、中文切换）
- [ ] 导入/导出配置（JSON）

## 🔧 技术栈

- **3D渲染**：Three.js r128（通过 CDN）
- **前端**：Vanilla JavaScript (ES6+)
- **样式**：纯CSS3（CSS Variables + Flexbox + Media Queries）
- **图标**：Font Awesome 6（CDN）
- **构建**：零依赖、无构建步骤
- **部署**：Cloudflare Pages（静态站点托管）

## 📁 项目结构

```
3Dtag/
├── index.html              # 主页面（单页应用）
├── css/
│   └── style.css           # 样式（含响应式）
├── js/
│   ├── app.js              # 应用主逻辑（23KB）
│   ├── text-processor.js   # 文本处理模块（18KB）
│   └── tagcanvas-wrapper.js # Three.js 封装（21KB）
├── lib/                    # 第三方库（CDN 备选）
│   └── tagcanvas.min.js
├── .github/
│   └── workflows/
│       └── pages.yml       # Cloudflare Pages 配置
├── README.md
├── DEVELOPMENT_PLAN.md     # 开发计划与进度
└── .learnings/             # 经验教训与错误记录
    ├── LEARNINGS.md
    ├── ERRORS.md
    └── FEATURE_REQUESTS.md
```

## 🎨 配置说明

### 标签数量
- **默认**：50
- **范围**：20-100
- **智能推荐**：根据文本长度自动调整（长文本推荐更多标签）

### 词性颜色（可自定义）
```css
--tag-noun: #3b82f6;    /* 名词 - 蓝色 */
--tag-verb: #10b981;    /* 动词 - 绿色 */
--tag-adj:  #f59e0b;    /* 形容词 - 橙色 */
--tag-other:#9ca3af;    /* 其他 - 灰色 */
```

### 可选主题
- `default` - 清新蓝绿
- `ocean` - 深海蓝调
- `forest` - 森林绿意
- `sunset` - 落日余晖

## 📊 性能指标

| 操作 | 耗时 | 资源占用 |
|------|------|----------|
| 1000字文本处理 | <2s | ~50MB 内存 |
| 50标签渲染 | <100ms | 30-60 FPS |
| 最大标签数 | ~200 | 视GPU性能而定 |

**优化建议**：移动端建议标签数≤80以保持流畅。

## 🌐 浏览器兼容性

| 浏览器 | 最低版本 | 备注 |
|--------|----------|------|
| Chrome | 80+ | ✅ 完全支持 |
| Firefox | 75+ | ✅ 完全支持 |
| Safari | 13+ | ✅ 完全支持 |
| Edge | 80+ | ✅ 完全支持 |
| iOS Safari | 13+ | ✅ 触摸支持 |
| Chrome Android | 80+ | ✅ 触摸支持 |

**WebGL 要求**：Three.js 需要 WebGL 支持（几乎所有现代浏览器都支持）。

## 🚢 部署说明

### Cloudflare Pages（推荐）
1. 推代码到 GitHub
2. 登录 Cloudflare Dashboard → Pages → 创建项目
3. 连接仓库 `firesoily/3Dtag`
4. 构建命令：留空（静态HTML）
5. 输出目录：`/`（根目录）
6. 环境变量：无
7. 保存并等待部署

### 自定义域名
在 Pages 项目设置中添加自定义域名，自动配置 SSL。

### 其他平台
可直接部署到任何静态网站托管服务：
- Vercel
- Netlify
- GitHub Pages
- AWS S3 + CloudFront

## 🐛 问题排查

### 标签云不显示
- 检查浏览器控制台是否有 WebGL 错误
- 确认 `lib/tagcanvas.min.js` 已加载（或使用 CDN）
- 尝试更新显卡驱动

### 触摸无效（移动端）
- 确认 CSS 中 `touch-action` 设置正确
- 检查是否被其他元素拦截触摸事件
- 确保使用 HTTPS（某些 API 需要）

### 导出失败
- 检查浏览器是否支持 Blob 下载
- 高清导出可能导致内存不足，尝试降低分辨率

### 性能卡顿
- 减少标签数量（滑块调小）
- 关闭浏览器其他标签页
- 使用 Chrome 性能监视器检查

## 📝 开发日志

- **2026-03-21**：完成核心功能增强（设置持久化、历史记录、搜索高亮、动画、SVG导出、移动端适配）
- **2026-03-21**：部署到 Cloudflare Pages，绑定 `3dtag.shop`
- **2026-03-21**：建立记忆系统和开发计划（`DEVELOPMENT_PLAN.md`）

详见 `DEVELOPMENT_PLAN.md` 了解完整开发进度。

## 📄 许可证

MIT License - 详见 LICENSE 文件（待添加）

## 🙏 致谢

- [Three.js](https://threejs.org/) - 3D 渲染引擎
- [TagCanvas](https://github.com/eccegordon/tagcanvas) - 原始算法参考
- [stopwords-iso](https://github.com/stopwords-iso/stopwords-iso) - 多语言停用词
- [Porter Stemmer](https://tartarus.org/martin/PorterStemmer/) - 词干提取算法

---

**Made with ❤️ by 小火** | **Version**: 1.0（2026-03-21）
