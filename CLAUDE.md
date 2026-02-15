# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

这是一个宠物营养健康管理应用，包含两个独立的前端项目：

- **web-app/**: React + Vite + Capacitor 移动端应用（主要项目）
- **uniapp-app/**: uni-app 跨平台应用（备用/小程序方案）

应用核心功能：用户注册登录、宠物信息管理、AI 驱动的饮食计划生成、营养分析追踪、日历记录等。

## Web App 开发命令

```bash
cd web-app

# 开发服务器（HMR）
npm run dev

# 生产构建
npm run build

# 代码检查
npm run lint

# 预览生产构建
npm run preview

# Capacitor 移动端开发
npm run cap:sync       # 同步资源到原生项目
npm run cap:android    # 打开 Android Studio
npm run cap:ios        # 打开 Xcode

# 完整移动端构建
npm run mobile:build   # 构建 + sync
```

## UniApp 开发命令

```bash
cd uniapp-app

# H5 开发
npm run dev:h5

# 微信小程序开发
npm run dev:mp-weixin

# 构建
npm run build:h5
npm run build:mp-weixin
```

## 核心架构

### 目录结构（web-app）

```
web-app/src/
├── api/              # API 服务层（类型安全）
│   ├── client.ts     # Axios 客户端 + 拦截器 + Token 自动刷新
│   ├── types.ts      # 完整 TypeScript 类型定义
│   └── *.ts          # 各模块 API（auth, pets, meals, plans 等）
├── context/          # React Context 全局状态
│   ├── UserContext.jsx       # 用户认证状态
│   ├── PetContext.jsx        # 宠物数据管理
│   └── PlanGenerationContext.jsx  # 计划生成 + SSE 流式处理
├── components/       # UI 组件
│   ├── layout/       # 布局组件（Layout, BottomNav）
│   └── *.jsx         # 通用组件
├── pages/            # 页面组件
├── hooks/            # 自定义 Hooks
├── utils/            # 工具函数
└── index.css         # Tailwind + 自定义样式
```

### 技术栈

- **前端框架**: React 19.2 + React Router 7
- **样式**: TailwindCSS 3.4 + UnoCSS
- **动画**: Framer Motion 12
- **移动端**: Capacitor 8
- **构建**: Vite 7
- **状态管理**: React Context（无 Redux）

### API 架构

**Token 认证机制**:
- JWT Bearer Token 存储 `localStorage.access_token`
- Refresh Token 存储 `localStorage.refresh_token`
- Axios 拦截器自动处理 401 刷新
- 请求队列机制防止并发刷新

**SSE 流式处理**:
- 计划生成使用 `fetch` + `ReadableStream` 处理 SSE
- 事件类型: `task_created`, `node_started`, `progress_update`, `task_completed`, `error`
- `PlanGenerationContext` 管理生成状态、进度、后台任务

### Context 数据流

```
UserProvider (认证)
    ├─ isAuthenticated → 路由保护
    ├─ user → 用户信息
    └─ login/register/logout → 认证操作

PetProvider (宠物数据)
    ├─ pets → 宠物列表
    ├─ currentPet → 当前选中宠物
    └─ addPet/updatePet/deletePet → CRUD 操作

PlanGenerationProvider (计划生成)
    ├─ status → idle/generating/completed/error
    ├─ progress → 0-100
    ├─ startGeneration → 启动 SSE 请求
    └─ handleSSEEvent → 处理后端推送事件
```

### 路由结构

**公开路由**: `/login`
**受保护路由**:
- 带底部导航: `/`, `/calendar`, `/analysis`, `/plan/create`, `/profile`
- 无底部导航: `/onboarding/step1-3`, `/planning`, `/plan/details`, `/profile/edit`, `/pet/edit/:id`

**返回按钮处理** (`useBackButton` hook):
- 主页: 双击退出应用
- Onboarding: 步骤间导航
- Loading: 禁用返回
- 其他: React Router 导航

### Capacitor 配置

- **App ID**: `com.petcare.app`
- **后台模式**: `@anuradev/capacitor-background-mode`
- **通知**: `@capacitor/local-notifications`（计划完成后推送）
- **配置文件**: `capacitor.config.json`

### 环境变量

创建 `web-app/.env`:
```
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_ENABLE_SSE=true
VITE_RECONNECT_DELAY=3000
```

### 样式系统

**Tailwind 主题扩展**:
- Primary: `#A3D9A5` (sage green)
- Secondary: `#FFE898` (warm yellow)
- Dark mode: class-based

**自定义工具类** (index.css):
- `.glass` - 玻璃态效果
- `.card-hover` - 卡片悬停
- `.btn-active` - 点击反馈
- `.no-scrollbar` - 隐藏滚动条

**移动端优化**:
- `pb-safe`, `pt-safe` - 安全区域适配
- `-webkit-tap-highlight-color: transparent` - 禁用点击高亮
- `overscroll-behavior: contain` - 防止过度滚动

## API 端点（基于后端规范）

### 认证 (`/api/v1/auth/`)
- `POST /register` - 注册
- `POST /login` - 登录
- `GET /me` - 获取当前用户
- `POST /send-code` - 发送验证码
- `POST /verify-register` - 验证码注册

### 宠物 (`/api/v1/pets/`)
- `GET /` - 获取宠物列表
- `POST /` - 创建宠物
- `PUT /{id}` - 更新宠物
- `DELETE /{id}` - 删除宠物
- `POST /{id}/avatar` - 上传头像

### 计划 (`/api/v1/plans/`)
- `POST /stream` - SSE 流式生成计划
- `GET /` - 获取计划列表
- `GET /{id}` - 获取计划详情
- `DELETE /{id}` - 删除计划

### 任务 (`/api/v1/tasks/`)
- `GET /{id}` - 获取任务状态
- `GET /{id}/result` - 获取任务结果
- `DELETE /{id}` - 取消任务

### 饮食记录 (`/api/v1/meals/`)
- `GET /today` - 今日餐食
- `POST /{id}/complete` - 完成餐食
- `GET /history` - 历史记录

### 日历 (`/api/v1/calendar/`)
- `GET /monthly` - 月度日历
- `GET /weekly` - 周度日历

### 分析 (`/api/v1/analysis/`)
- `GET /nutrition` - 营养分析

## 开发注意事项

1. **类型安全**: 所有 API 调用使用 `src/api/types.ts` 中定义的类型
2. **路由保护**: 使用 `<ProtectedRoute>` 包裹需要登录的页面
3. **Token 管理**: API 客户端自动处理 Token 刷新，无需手动处理
4. **移动端返回**: 使用 `useBackButton` hook 而非浏览器默认行为
5. **SSE 连接**: 计划生成页面必须处理 `PlanGenerationContext` 状态
6. **环境变量**: 开发时确保 `VITE_API_BASE_URL` 指向正确的后端地址
