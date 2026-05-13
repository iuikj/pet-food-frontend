# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

宠物饮食计划智能助手前端应用，支持移动端 UI 和 SSE 流式消费。

- **web-app/**: React + Vite + Capacitor 跨平台移动应用

核心功能：用户注册登录、宠物信息管理、AI 驱动的饮食计划生成、营养分析追踪、日历记录等。

## 技术栈

- **前端框架**: React 19.2 + React Router 7
- **样式**: TailwindCSS 4.x (CSS-first, @tailwindcss/vite)
- **动画**: Framer Motion 12
- **移动端**: Capacitor 8
- **构建**: Vite 7
- **状态管理**: React Context + Hooks（无 Redux）
- **API 通信**: Axios（TypeScript 类型安全）
- **字体**: Plus Jakarta Sans（本地化 @fontsource）

## 开发命令

```bash
cd web-app

npm run dev            # Vite 开发服务器 (HMR)
npm run build          # 生产构建
npm run lint           # ESLint 代码检查
npm run preview        # 预览生产构建

# Capacitor 移动端
npm run cap:sync       # 同步资源到原生项目
npm run cap:android    # 打开 Android Studio
npm run cap:ios        # 打开 Xcode
npm run mobile:build   # 构建 + sync
```

## 目录结构

```
web-app/src/
├── App.jsx               # 路由入口
├── main.jsx              # 应用启动
├── index.css             # Tailwind + 自定义样式
│
├── api/                  # API 服务层（TypeScript 类型安全）
│   ├── client.ts         # Axios 客户端 + 拦截器 + Token 自动刷新
│   ├── types.ts          # 完整 TypeScript 类型定义
│   ├── auth.ts           # 认证 API
│   ├── pets.ts           # 宠物 API
│   ├── plans.ts          # 饮食计划 API（SSE 流式消费）
│   ├── meals.ts          # 餐食 API
│   ├── calendar.ts       # 日历 API
│   ├── analysis.ts       # 分析 API
│   └── index.ts          # 统一导出
│
├── context/              # React Context 全局状态
│   ├── UserProvider.jsx / UserContext.jsx     # 用户认证状态
│   ├── PetProvider.jsx / PetContext.jsx       # 宠物数据管理
│   ├── MealProvider.jsx / MealContextValue.js # 餐食数据管理
│   └── PlanGenerationProvider.jsx / PlanGenerationContext.jsx  # 计划生成 + SSE
│
├── hooks/                # 自定义 Hooks（消费 Context）
│   ├── useUser.js        # 认证操作
│   ├── usePets.js        # 宠物 CRUD
│   ├── useMeals.js       # 餐食管理
│   ├── usePlanGeneration.js  # 计划生成控制
│   └── useBackButton.js  # Capacitor 返回按钮处理
│
├── pages/                # 页面组件（15 个）
│   ├── HomePage.jsx      # 首页
│   ├── CreatePlan.jsx    # 创建计划
│   ├── PlanSummary.jsx   # 计划总结
│   ├── PlanDetails.jsx   # 计划详情
│   ├── Loading.jsx       # 加载页（3D 翻页动画）
│   ├── DashboardDaily.jsx# 日报表板
│   ├── CalendarPage.jsx  # 日历
│   ├── RecipesPage.jsx   # 食谱
│   ├── Login.jsx         # 登录
│   ├── OnboardingName.jsx    # 引导步骤 1
│   ├── OnboardingBasic.jsx   # 引导步骤 2
│   ├── OnboardingHealth.jsx  # 引导步骤 3
│   ├── Profile.jsx       # 用户资料
│   ├── ProfileEdit.jsx   # 编辑资料
│   └── PetEdit.jsx       # 编辑宠物
│
├── components/           # UI 组件
│   ├── layout/
│   │   ├── Layout.jsx    # 主布局（底部导航）
│   │   └── BottomNav.jsx # 底部导航栏
│   └── *.jsx             # 通用组件
│
├── models/               # 数据模型定义
├── utils/                # 工具函数
├── mock/                 # Mock 数据
└── assets/               # 静态资源（SVG、PNG）
```

### UI 组件库迁移状态

- `src/components/ui/` 使用 shadcn 风格本地组件入口，业务代码继续从 `@/components/ui/*` 导入。
- 已迁移到 coss/Base UI 模式：`button`、`badge`、`select`、`scroll-area`、`separator`、`tooltip`、`alert-dialog`、`collapsible`、`toast`、`drawer`、`field`、`input`、`textarea`。
- `DatePicker` 当前为项目本地兼容包装，基于 coss `Input` + 原生 `type="date"`；coss registry 暂无独立 `date-picker` 组件时不要假设存在 `@coss/date-picker`。
- Toast 已从 Sonner 切到 coss `ToastProvider` / `toastManager`；跨平台提示应继续通过 `src/utils/toast.js` 的 `showToast` 语义方法调用，保留 Capacitor native fallback。
- 抽屉类移动端表单优先复用 `WeightRecordSheet.jsx` 的 `Drawer + Field + Input/Textarea/DatePicker` 结构，并验证 Android 返回键和 WebView 手势。

## 路由结构

**公开路由**: `/login`

**受保护路由（带底部导航）**:
- `/` - 首页
- `/calendar` - 日历
- `/recipes` - 食谱
- `/plan/create` - 创建计划
- `/plan/summary` - 计划总结
- `/profile` - 用户资料

**受保护路由（无底部导航）**:
- `/onboarding/step1-3` - 新用户引导（3 步）
- `/planning` - 计划生成加载页
- `/profile/edit` - 编辑资料
- `/pet/edit/:id` - 编辑宠物
- `/dashboard/daily` - 日报表板

**返回按钮处理** (`useBackButton` hook):
- 主页: 双击退出应用
- Onboarding: 步骤间导航
- Loading: 禁用返回
- 其他: React Router 导航

## Context + Hooks 数据流

```
UserProvider (认证)
    ├── isAuthenticated -> 路由保护
    ├── user -> 用户信息
    └── login/register/logout -> 认证操作

PetProvider (宠物数据)
    ├── pets -> 宠物列表
    ├── currentPet -> 当前选中宠物
    └── addPet/updatePet/deletePet -> CRUD 操作

MealProvider (餐食数据)
    ├── todayMeals -> 今日餐食
    ├── completeMeal -> 完成标记
    └── mealHistory -> 历史记录

PlanGenerationProvider (计划生成)
    ├── status -> idle/generating/completed/error
    ├── progress -> 0-100
    ├── startGeneration -> 启动 SSE 请求
    └── handleSSEEvent -> 处理后端推送事件
```

## API 架构

### Token 认证机制
- JWT Bearer Token 存储 `localStorage.access_token`
- Refresh Token 存储 `localStorage.refresh_token`
- Axios 拦截器自动处理 401 刷新
- 请求队列机制防止并发刷新

### SSE 流式处理
- 计划生成使用 `fetch` + `ReadableStream` 处理 SSE
- 事件类型: `task_created`, `node_started`, `progress_update`, `task_completed`, `error`
- `PlanGenerationContext` 管理生成状态、进度、后台任务

## API 端点

### 认证 (`/api/v1/auth/`)
- `POST /register` - 注册
- `POST /login` - 登录
- `GET /me` - 获取当前用户
- `POST /refresh` - 刷新 Token
- `POST /send-code` - 发送验证码
- `POST /verify-register` - 验证码注册

### 宠物 (`/api/v1/pets/`)
- `GET /` - 宠物列表
- `POST /` - 创建宠物
- `PUT /{id}` - 更新宠物
- `DELETE /{id}` - 删除宠物
- `POST /{id}/avatar` - 上传头像

### 计划 (`/api/v1/plans/`)
- `POST /stream` - SSE 流式生成计划
- `GET /` - 计划列表
- `GET /{id}` - 计划详情
- `DELETE /{id}` - 删除计划

### 任务 (`/api/v1/tasks/`)
- `GET /{id}` - 任务状态
- `GET /{id}/result` - 任务结果
- `DELETE /{id}` - 取消任务

### 餐食 (`/api/v1/meals/`)
- `GET /today` - 今日餐食
- `POST /{id}/complete` - 完成餐食
- `GET /history` - 历史记录

### 日历 (`/api/v1/calendar/`)
- `GET /monthly` - 月度日历
- `GET /weekly` - 周度日历

### 分析 (`/api/v1/analysis/`)
- `GET /nutrition` - 营养分析

### Tailwind v4 CSS-first 模式
- `src/index.css` 的 `@import "tailwindcss"` 是唯一入口（同时 `@import "tw-animate-css"`、`@import "shadcn/tailwind.css"`、`@import "@fontsource-variable/geist"`）
- **没有** `tailwind.config.js`，所有 token 在 CSS 中声明
- shadcn 主题：`:root` / `.dark` 的 `oklch()` 变量保持 unlayered；`@theme inline { --color-sh-primary: var(--primary); ... }` 块负责把 shadcn 变量暴露成 Tailwind 工具类
- 业务静态 token（`primary`、`secondary`、`week-1..4`、`subagent-soft`、`background-light/dark` 等）放入 `@theme { --color-* }` 块
- 暗色模式：`@custom-variant dark (&:is(.dark *))` 替代 v3 的 `darkMode: 'class'`
- 动画：使用 `tw-animate-css`，**不再**依赖 `tailwindcss-animate`
- 自定义 utility（`glass`、`card-hover`、`transition-smooth`、`btn-hover`、`btn-active`、`card-active`）用顶层 `@utility name { ... }` 定义，**不再**写在 `@layer utilities` 内
- 自定义 `@keyframes`（`shimmer`、`bounce-gentle`、`float`、`dot-blink`、`paw-step`、`pulse-slow`、`spin-slow`）必须放在 `@theme` 块**外**（unlayered，issue #14622 限制）
- 全局默认边框色用 `@layer base` raw CSS `border-color: var(--color-border)` 兼容 v3；不要用 unlayered `* { @apply border-border }`，否则会覆盖 `border-white` / `border-gray-*` / `border-primary/*` 等显式 utility；`outline-none` 统一改为 `outline-hidden`

### 主题色
- Primary: `#A3D9A5` (sage green)
- Secondary: `#FFE898` (warm yellow)
- Dark mode: class-based（通过 `@custom-variant dark` 实现）

### 自定义工具类 (index.css `@utility`)
- `.glass` - 玻璃态效果
- `.card-hover` - 卡片悬停
- `.btn-active` - 点击反馈
- `.no-scrollbar` - 隐藏滚动条

### 移动端优化
- `pb-safe`, `pt-safe` - 安全区域适配（由 `@theme` 中 `--spacing-safe-*` 提供）
- `-webkit-tap-highlight-color: transparent` - 禁用点击高亮
- `overscroll-behavior: contain` - 防止过度滚动

## Capacitor 配置

- **App ID**: `com.petcare.app`
- **后台模式**: `@anuradev/capacitor-background-mode`
- **通知**: `@capacitor/local-notifications`
- **摄像头**: `@capacitor/camera`
- **配置文件**: `capacitor.config.json`

## 环境变量

创建 `web-app/.env`:
```
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_ENABLE_SSE=true
VITE_RECONNECT_DELAY=3000
```

## 开发注意事项

1. **类型安全**: 所有 API 调用使用 `src/api/types.ts` 中定义的类型
2. **路由保护**: 使用 `<ProtectedRoute>` 包裹需要登录的页面
3. **Token 管理**: API 客户端自动处理 Token 刷新，无需手动处理
4. **移动端返回**: 使用 `useBackButton` hook 而非浏览器默认行为
5. **SSE 连接**: 计划生成页必须处理 `PlanGenerationContext` 状态
6. **环境变量**: 开发时确保 `VITE_API_BASE_URL` 指向正确的后端地址
7. **页面组件**: 使用 JSX（非 TypeScript），但 API 层使用 TypeScript
8. **ESLint**: 忽略以大写字母或下划线开头的未使用变量 (`varsIgnorePattern: '^[A-Z_]'`)
9. **Tailwind v4 兼容**：浏览器最低要求 Chrome 111+/Safari 16.4+。Android 10+ 且联网更新 WebView 安全；Android 7-9 或无 GMS 设备会白屏（已知限制，不做 PostCSS fallback）。任何 CSS / token 变更必须做 Android Release 包真机回归。

## Icon Localization Rule

- For `web-app/`, core UI icons must stay local to the project.
- The current approved baseline is one local icon font family: `@fontsource/material-icons-round`.
- Do not add `@fontsource/material-symbols-outlined` back by default. If a future change needs it, verify the packaged Android app after `npm run build` and `npx cap sync`.
- Existing `material-symbols-outlined` markup should be treated as compatibility markup only and resolved through local CSS mapping, not by reintroducing a second font package.
- Do not use remote icon or image URLs for packaged UI assets. Copy them into `src/assets/` or `public/` first.
- `npm run dev` is not enough to validate mobile safety. Any asset-loading or code-splitting change must be verified in production build output and on Android WebView.
- If Android shows a white screen after a frontend optimization, first suspect production asset loading, chunk loading, or Capacitor-packaged resource behavior before blaming generic system log noise.

## 前端工程规范（必读）

写代码前先看 `.trellis/spec/frontend/frontend/index.md` 索引，按需阅读：
- Directory Structure / Component / Hook / State Management
- AG-UI Workflow（涉及 `/agui-plan` 时必读）
- Quality Guidelines / Type Safety
- Capacitor Guidelines / Error Handling / Asset Rules（本次新增）
