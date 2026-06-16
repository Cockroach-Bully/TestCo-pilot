# TestCo-pilot

智能测试助手 — 基于大模型的测试报告分析和知识库问答工具

## 功能特性

- **AI 对话**：支持多种在线大模型（MiMo、通义千问、DeepSeek、GLM 等）和本地 GGUF 模型
- **本地知识库**：支持 TXT/MD/PDF/DOCX/XLSX 格式文档导入，自动分块向量化
- **测试报告分析**：XML 报告解析、ZIP 解压、失败用例提取
- **截图分析**：支持 Ctrl+V 粘贴图片、拖拽上传
- **数据安全**：所有数据存储在本地，不上传云端

## 环境要求

| 依赖 | 版本要求 |
|------|----------|
| Node.js | >= 18.0 |
| Rust | >= 1.70 |
| Visual Studio Build Tools | 2022+ (C++ 工作负载) |
| LLVM | 可选，用于本地模型 |

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run tauri dev
```

### 构建安装包

```bash
npm run tauri build
```

安装包输出位置：
- MSI: `src-tauri/target/release/bundle/msi/`
- NSIS: `src-tauri/target/release/bundle/nsis/`

## 目录结构

```
testco-pilot/
├── src/                          # React 前端源码
│   ├── components/               # UI 组件
│   │   ├── Layout.tsx           # 主布局
│   │   ├── Sidebar.tsx          # 侧边栏导航
│   │   ├── ChatView.tsx         # 对话界面
│   │   ├── RightPanel.tsx       # 右侧状态面板
│   │   ├── SplashScreen.tsx     # 启动画面
│   │   └── DisclaimerModal.tsx  # 声明弹窗
│   ├── pages/                    # 页面组件
│   │   ├── KnowledgeBase.tsx    # 知识库管理
│   │   ├── Reports.tsx          # 分析报告
│   │   └── Settings.tsx         # 设置页面
│   ├── types/                    # TypeScript 类型定义
│   ├── constants/                # 常量定义
│   ├── utils/                    # 工具函数
│   └── App.css                   # 全局样式
├── src-tauri/                    # Rust 后端源码
│   ├── src/
│   │   ├── lib.rs               # 主入口和 Tauri 命令
│   │   ├── db.rs                # SQLite 数据库
│   │   ├── mimo_api.rs          # 大模型 API 调用
│   │   ├── knowledge.rs         # 知识库处理
│   │   ├── analysis.rs          # 报告分析
│   │   └── local_model.rs       # 本地模型
│   ├── Cargo.toml               # Rust 依赖
│   └── tauri.conf.json          # Tauri 配置
├── package.json                  # Node 依赖
├── tsconfig.json                 # TypeScript 配置
├── vite.config.ts                # Vite 配置
└── README.md                     # 本文档
```

## 技术选型说明

| 技术 | 选择原因 |
|------|----------|
| Tauri 2.0 | 轻量、安全、跨平台潜力 |
| React 19 | 生态成熟、社区活跃 |
| TypeScript | 类型安全、开发体验好 |
| Tailwind CSS 4 | 原子化 CSS、开发效率高 |
| SQLite (rusqlite) | 本地存储、无需额外服务 |
| reqwest | Rust 异步 HTTP 客户端 |
| calamine | Excel 文件解析 |
| zip | ZIP 文件处理 |

## 更新日志

### v0.1.0 (2026-06-15)

- 初始版本发布
- AI 对话功能（支持多种在线模型）
- 本地知识库（TXT/MD/PDF/DOCX/XLSX）
- 测试报告分析（XML/ZIP）
- 截图分析功能
- 本地 GGUF 模型支持
- 暖色奶油风 UI 设计

## 许可证

MIT License
