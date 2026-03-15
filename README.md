# 灵犀AI助手 (Lingxi AI Agent)

一个基于 React 的现代化 AI 智能体对话平台前端应用，支持多种登录方式、智能体管理和实时流式对话。

## 功能特性

### 核心功能
- **AI 智能对话** - 支持流式响应的实时 AI 对话体验
- **多智能体支持** - 可配置和管理多个 AI 智能体
- **会话历史** - 保存和管理对话历史记录
- **双面板展示** - 回答面板和总结面板并行展示

### 用户系统
- **微信扫码登录** - 支持微信小程序二维码扫码登录（推荐）
- **邮箱验证码登录** - 通过邮箱验证码快速登录

### 后台管理
- **智能体管理** - 智能体列表、配置管理
- **资源管理** - 客户端、顾问、知识库、模型、API、系统提示词、MCP工具管理

## 技术栈

- **框架**: React 18 + TypeScript
- **构建工具**: Rsbuild
- **UI 组件库**: Semi Design (@douyinfe/semi-ui)
- **样式方案**: Styled-Components + CSS
- **路由**: React Router v6
- **Markdown 渲染**: marked + highlight.js
- **状态管理**: React Hooks

## 项目结构

```
src/
├── components/          # 公共组件
│   ├── common/         # 通用组件
│   ├── layout/         # 布局组件（Sidebar等）
│   └── ...
├── pages/              # 页面组件
│   ├── agent-chat.tsx  # AI对话主页面
│   ├── login.tsx       # 登录页面
│   ├── agent-list.tsx  # 智能体列表
│   ├── agent-config.tsx # 智能体配置
│   └── ...
├── services/           # API 服务层
│   ├── ai-agent-service.ts      # AI Agent 服务
│   ├── user-service.ts          # 用户服务
│   ├── admin-user-service.ts    # 管理员服务
│   └── ...
├── styles/             # 全局样式
├── config/             # 配置文件
└── app.tsx             # 应用入口
```

## 快速开始

### 环境要求
- Node.js >= 16
- npm >= 8 或 yarn >= 1.22

### 安装依赖

```bash
npm install
# 或
yarn install
```

### 开发运行

```bash
npm run dev
# 或
npm start
```

应用将在 http://localhost:3000 启动

### 生产构建

```bash
npm run build
```

## 页面路由

| 路由 | 说明 |
|------|------|
| `/login` | 登录页面 |
| `/agent-chat` | AI 对话主页面 |
| `/agent-list` | 智能体列表管理 |
| `/agent-config` | 智能体配置 |
| `/client-management` | 客户端管理 |
| `/advisor-management` | 顾问管理 |
| `/rag-order-management` | 知识库管理 |
| `/client-model-management` | 模型管理 |
| `/ai-client-api-management` | API 管理 |
| `/client-system-prompt-management` | 系统提示词管理 |
| `/client-tool-mcp-management` | MCP 工具管理 |

## API 服务

项目提供以下主要服务模块：

- `AiAgentService` - AI 智能体服务（对话、装配智能体）
- `UserService` - 用户服务（登录、注册、历史记录）
- `AdminUserService` - 管理员用户服务
- `AiClientService` - AI 客户端服务
- `AiClientModelService` - 模型管理服务
- `AiClientToolMcpService` - MCP 工具服务
- `AiClientSystemPromptService` - 系统提示词服务

## 功能介绍

### 登录页面
- 支持微信扫码登录（推荐）和邮箱登录
- 清新的绿色渐变背景设计

### AI 对话界面
- 左侧边栏：会话历史管理
- 中间区域：实时流式对话
- 双面板：回答面板 + 总结面板

### 后台管理
- 完整的 CRUD 管理功能
- 响应式侧边栏导航

## 开发指南

### 代码规范

```bash
# 代码检查
npm run lint

# 自动修复
npm run lint:fix
```

### 目录规范
- 组件使用 PascalCase 命名
- 服务文件使用 kebab-case 命名
- 样式文件与组件同目录

## 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

## 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

## 联系方式

如有问题或建议，欢迎提交 Issue 或 Pull Request。

---

**灵犀AI助手** - 让 AI 对话更简单
