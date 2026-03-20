# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

宠物饮食计划智能助手前端应用，支持移动端 UI 和 SSE 流式消费。

- **web-app/**: React + Vite + Capacitor 跨平台移动应用

核心功能：用户注册登录、宠物信息管理、AI 驱动的饮食计划生成、营养分析追踪、日历记录等。

## 技术栈

- **前端框架**: React 19.2 + React Router 7
- **样式**: TailwindCSS 3.4
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

## 样式系统

### Tailwind 主题
- Primary: `#A3D9A5` (sage green)
- Secondary: `#FFE898` (warm yellow)
- Dark mode: class-based

### 自定义工具类 (index.css)
- `.glass` - 玻璃态效果
- `.card-hover` - 卡片悬停
- `.btn-active` - 点击反馈
- `.no-scrollbar` - 隐藏滚动条

### 移动端优化
- `pb-safe`, `pt-safe` - 安全区域适配
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
