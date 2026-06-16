# TestCo-pilot 项目开发总结与维护指南

---

## 一、项目概述

**项目名称**：TestCo-pilot  
**版本**：v0.1.0  
**定位**：智能测试助手 — 基于大模型的测试报告分析和知识库问答工具  
**技术栈**：Tauri 2.0 + React 19 + TypeScript + Tailwind CSS 4 + Rust  
**开发时间**：2026年6月  

---

## 二、开发过程总结

### 第一阶段：项目初始化

**完成内容：**
- 安装 Rust 工具链（rustup）
- 安装 Visual Studio Build Tools 2022（C++ 工作负载）
- 使用 `create-tauri-app` 创建 Tauri + React + TypeScript 项目
- 安装 Tailwind CSS 4 并配置
- 配置暖色奶油风主题

**关键命令：**
```bash
winget install Rustlang.Rustup
winget install Microsoft.VisualStudio.2022.BuildTools
npx create-tauri-app@latest testco-pilot -m npm -t react-ts --tauri-version 2 -y
npm install -D tailwindcss @tailwindcss/vite
```

---

### 第二阶段：核心功能模块开发

#### 模块1：可视化界面

- 左侧导航栏（对话、知识库、分析报告、设置）
- 主对话区（ChatGPT 风格，Markdown 渲染）
- 右侧状态面板（知识库状态、快捷操作）
- 暖色奶油风设计（参考 MiModex 项目）

#### 模块2：AI 对话功能

- 集成 13 种在线大模型（MiMo、通义千问、DeepSeek、GLM、文心、豆包、Kimi 等）
- SQLite 本地存储对话历史
- 对话管理（新建、删除、重命名、置顶）
- AI 对话原则系统提示词注入

#### 模块3：本地知识库

- 支持 TXT、Markdown、PDF、DOCX、XLSX 格式
- 自动分块（500字符，50字符重叠）
- 向量化（128维 TF-IDF）
- 智能分类（刷写、诊断、通讯、网络管理等）
- 递归扫描目录

#### 模块4：文件上传与分析

- XML 测试报告解析
- ZIP 文件解压（含 Zip Slip 防护）
- BLF 日志解析
- 失败用例提取

#### 模块5：截图图片智能分析

- Ctrl+V 粘贴剪贴板图片
- 拖拽图片到窗口
- 图片预览和删除

#### 模块6：设置页面

- API 配置（多服务商选择）
- 本地模型配置（GGUF 文件选择）
- 存储路径配置（目录选择器）
- 字体设置（10种字体，7档大小）
- 隐私与数据管理
- GitHub 配置
- 检查更新
- 致谢声明

---

### 第三阶段：本地大模型支持

- 集成 llama-cpp-rs（可选特性，需 LLVM）
- GGUF 模型加载/卸载
- 对话界面模型切换下拉框
- 网络不可用时自动提示

**编译命令：**
```bash
cargo build --features local-model
```

---

### 第四阶段：UI 美化

- 参考 MiModex 项目暖色奶油风设计
- 主背景：`#f8f8f0`（暖米色）
- 强调色：`#FF6A00`（小米橙）
- 文字：暖棕色系
- 圆角：18-24px
- 弹性动画：`cubic-bezier(0.34, 1.56, 0.64, 1)`
- 可拖拽调整输入框高度

---

### 第五阶段：上线准备

- 声明弹窗（首次启动显示）
- AI 对话原则系统提示词
- 代码规范优化（注释、常量、日志、Hooks 拆分）
- README 和 CHANGELOG 文档
- 检查更新功能

---

### 第六阶段：打包分发

- NSIS 安装包（支持自定义路径）
- 默认安装路径：`C:\Program Files\TestCo-pilot`
- 桌面快捷方式
- 开始菜单程序组
- 完整卸载支持

---

## 三、项目结构

```
desktop-MiAgent/
├── src/                              # React 前端
│   ├── components/
│   │   ├── ChatView.tsx              # 对话界面
│   │   ├── Layout.tsx                # 主布局
│   │   ├── Sidebar.tsx               # 侧边栏
│   │   ├── RightPanel.tsx            # 右侧面板
│   │   ├── SplashScreen.tsx          # 启动画面
│   │   ├── DisclaimerModal.tsx       # 声明弹窗
│   │   └── settings/                 # 设置子组件
│   │       ├── ApiConfigSection.tsx
│   │       ├── LocalModelSection.tsx
│   │       ├── StoragePathSection.tsx
│   │       ├── GithubSection.tsx
│   │       ├── FontSection.tsx
│   │       ├── PrivacySection.tsx
│   │       ├── AboutSection.tsx
│   │       └── SettingsUI.tsx
│   ├── hooks/                        # 自定义 Hooks
│   │   ├── useChat.ts
│   │   ├── useKnowledgeBase.ts
│   │   └── useReports.ts
│   ├── pages/                        # 页面组件
│   │   ├── KnowledgeBase.tsx
│   │   ├── Reports.tsx
│   │   └── Settings.tsx
│   ├── constants/                    # 常量定义
│   │   ├── index.ts
│   │   └── models.ts
│   ├── types/                        # 类型定义
│   │   └── index.ts
│   └── utils/                        # 工具函数
│       └── logger.ts
├── src-tauri/                        # Rust 后端
│   ├── src/
│   │   ├── lib.rs                    # 主入口
│   │   ├── db.rs                     # SQLite 数据库
│   │   ├── mimo_api.rs               # 大模型 API
│   │   ├── knowledge.rs              # 知识库
│   │   ├── analysis.rs               # 报告分析
│   │   └── local_model.rs            # 本地模型
│   ├── Cargo.toml
│   ├── tauri.conf.json
│   └── nsis/                         # NSIS 配置
├── CHANGELOG.md                      # 更新日志
├── README.md                         # 项目说明
└── USER_GUIDE.md                     # 使用指南
```

---

## 四、后期维护指南

### 4.1 本地开发

```bash
# 克隆项目
git clone https://github.com/Cockroach-Bully/TestCo-pilot.git
cd TestCo-pilot

# 安装依赖
npm install

# 启动开发服务器
npm run tauri dev
```

### 4.2 修改代码流程

**前端修改：**
1. 修改 `src/` 目录下的文件
2. 保存后自动热重载
3. 在浏览器中预览效果

**后端修改：**
1. 修改 `src-tauri/src/` 目录下的 `.rs` 文件
2. 保存后自动重新编译
3. 应用会自动重启

**样式修改：**
1. 修改 `src/App.css` 中的 CSS 变量
2. 或修改各组件中的内联样式

### 4.3 添加新功能

**添加新页面：**
1. 在 `src/pages/` 创建新组件
2. 在 `src/types/index.ts` 添加 `PageType`
3. 在 `Layout.tsx` 添加路由
4. 在 `Sidebar.tsx` 添加导航项

**添加新 Tauri 命令：**
1. 在 `src-tauri/src/lib.rs` 添加函数，标记 `#[tauri::command]`
2. 在 `invoke_handler` 中注册
3. 在前端使用 `invoke("command_name", { params })` 调用

**添加新模型服务商：**
1. 在 `src/constants/models.ts` 的 `MODEL_PROVIDERS` 数组中添加

### 4.4 代码规范

**函数长度**：不超过 80 行，超过需拆分  
**命名规范**：有意义的英文命名，禁止 a、b、c  
**注释规范**：函数必须添加 JSDoc 注释  
**常量管理**：提取到 `src/constants/`

---

## 五、Git 版本管理

### 5.1 分支策略

```
main          # 稳定分支，保持可发布状态
├── develop   # 开发分支，日常开发
├── feature/* # 功能分支，新功能开发
└── fix/*     # 修复分支，bug 修复
```

### 5.2 提交规范

```bash
# 格式：<type>(<scope>): <description>

# 示例
git commit -m "feat(chat): 添加对话重命名功能"
git commit -m "fix(api): 修复 API 连接超时问题"
git commit -m "docs(readme): 更新使用说明"
git commit -m "style(ui): 调整输入框高度"
git commit -m "refactor(hooks): 拆分 useChat hook"
```

**类型说明：**
- `feat`：新功能
- `fix`：修复
- `docs`：文档
- `style`：样式
- `refactor`：重构
- `test`：测试
- `chore`：构建/工具

### 5.3 推送到 GitHub

```bash
# 日常推送
git add .
git commit -m "feat(xxx): 描述"
git push origin main

# 创建功能分支
git checkout -b feature/new-feature
# ... 开发 ...
git add .
git commit -m "feat(xxx): 描述"
git push origin feature/new-feature
# 在 GitHub 创建 Pull Request
```

### 5.4 版本发布

```bash
# 更新版本号（package.json 和 tauri.conf.json）
# 更新 CHANGELOG.md

# 提交版本更新
git add .
git commit -m "chore: release v0.2.0"
git tag v0.2.0
git push origin main --tags

# 构建安装包
npm run tauri build

# 在 GitHub 创建 Release，上传安装包
```

---

## 六、构建与发布

### 6.1 构建安装包

```bash
# 构建 NSIS 安装包
npm run tauri build

# 输出位置
# src-tauri/target/release/bundle/nsis/TestCo-pilot_x.x.x_x64-setup.exe
```

### 6.2 GitHub Release

1. 在 GitHub 仓库页面点击 "Releases"
2. 点击 "Create a new release"
3. 填写 Tag version（如 `v0.2.0`）
4. 填写 Release title
5. 上传安装包文件
6. 点击 "Publish release"

### 6.3 用户更新流程

1. 用户在设置页面点击"检查更新"
2. 检测到新版本后显示更新信息
3. 用户点击"前往下载"打开 GitHub Release 页面
4. 下载安装包覆盖安装

---

## 七、配置文件说明

| 文件 | 用途 |
|------|------|
| `package.json` | Node.js 依赖和脚本 |
| `src-tauri/Cargo.toml` | Rust 依赖 |
| `src-tauri/tauri.conf.json` | Tauri 应用配置 |
| `src/constants/index.ts` | 前端常量 |
| `src/constants/models.ts` | 模型服务商配置 |
| `src/App.css` | 全局样式和主题 |

---

## 八、已知限制

1. **本地模型**：需要 LLVM 编译环境，目前为可选特性
2. **图片分析**：多模态 API 未完全集成，仅支持图片上传
3. **PDF 解析**：当前仅提取文本，复杂排版可能丢失格式
4. **向量搜索**：使用简单 TF-IDF，搜索精度有限

---

## 九、后续优化方向

| 优先级 | 功能 | 说明 |
|--------|------|------|
| 高 | 流式输出 | 逐字显示 AI 回复 |
| 高 | 多模态 API | 集成图片识别能力 |
| 中 | 高级向量搜索 | 使用 embedding 模型 |
| 中 | 流式输出 | 逐字显示效果 |
| 低 | 国际化 | 多语言支持 |
| 低 | 插件系统 | 支持第三方扩展 |

---

## 十、联系方式

- **GitHub**：https://github.com/Cockroach-Bully/TestCo-pilot
- **版本**：v0.1.0

---

*文档生成时间：2026年6月16日*
