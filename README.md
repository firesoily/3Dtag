# 3Dtag - 3D智能标签云

一个轻量级的Web应用，能将任意文本转换为3D交互式标签云。

## ✨ 特色功能

- 🎯 **智能关键词提取**：支持中英文混合文本，自动过滤停用词
- 🌐 **3D球状布局**：标签分布在3D球面上，360°可旋转查看
- 🎨 **词性智能着色**：名词=蓝色、动词=绿色、形容词=橙色、其他=灰色
- 🔍 **实时搜索过滤**：快速找到特定关键词
- 📸 **导出PNG**：一键保存标签云图片
- ⚡ **极速渲染**：2秒内完成文本处理和渲染

## 🚀 快速开始

### 在线使用
直接打开 `index.html` 即可（需要现代浏览器 Chrome/Firefox/Safari/Edge）

### 本地开发
```bash
# 克隆项目
git clone https://github.com/firesoily/3Dtag.git
cd 3Dtag

# 启动本地服务器（可选）
python -m http.server 8000
# 然后访问 http://localhost:8000
```

## 📖 使用说明

1. **输入文本**：在左侧文本框粘贴或输入你的文本（支持中英文）
2. **生成标签云**：点击"生成"按钮，等待2秒内自动渲染
3. **交互操作**：
   - 🖱️ **拖拽旋转**：按住鼠标左键拖动，360°查看
   - **滚轮缩放**：滚动鼠标滚轮放大/缩小
   - **悬停高亮**：鼠标悬停标签会放大并加边框
   - **点击详情**：点击标签查看词语、词频、词性
4. **搜索过滤**：在搜索框输入关键词，仅显示匹配标签
5. **导出图片**：点击"导出PNG"保存当前视图

## 🔧 技术栈

- **前端框架**：Vanilla JavaScript（无框架依赖）
- **3D渲染**：TagCanvas 2.x（基于Canvas 2D模拟3D）
- **UI**：纯CSS + Font Awesome图标
- **打包**：无构建步骤，开箱即用

## 📁 项目结构

```
3Dtag/
├── index.html          # 主页面
├── css/
│   └── style.css       # 样式文件
├── js/
│   ├── app.js          # 应用主逻辑
│   ├── text-processor.js  # 文本处理模块
│   └── tagcanvas-wrapper.js # TagCanvas封装
├── lib/
│   └── tagcanvas.min.js    # TagCanvas库
└── README.md
```

## 🎯 MVP功能清单

### Phase 1 (已完成)
- [x] 文本输入与清空
- [x] 中英文分词与停用词过滤
- [x] 词频统计与词性识别
- [x] 3D球状标签云渲染
- [x] 拖拽旋转与滚轮缩放
- [x] 悬停高亮与点击详情
- [x] 搜索过滤功能
- [x] 导出PNG图片
- [x] 响应式布局（桌面+移动端）

### 性能指标
- 1000字文本处理 < 2秒
- 50标签渲染 < 100ms
- 支持最多200标签渲染

## 🌐 浏览器兼容性

| 浏览器 | 版本 |
|--------|------|
| Chrome | 80+ |
| Firefox | 75+ |
| Safari | 13+ |
| Edge | 80+ |
| 移动端 | iOS Safari 13+, Chrome Android |

*降级方案：Canvas 2D（所有现代浏览器均支持）*

## 📄 许可证

MIT License - 自由使用、修改、分发

## 🙏 致谢

- [TagCanvas](https://github.com/eccegordon/tagcanvas) - 3D标签云核心库
- [stopwords-iso](https://github.com/stopwords-iso/stopwords-zh) - 中文停用词表

---

**Made with ❤️ by 小火**