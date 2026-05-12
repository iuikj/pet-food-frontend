# AG-UI + CopilotKit + LangGraph 适配实战

> 本次实验：在**不改 v2 graph 实现**的前提下，让前端 CopilotKit 直连 FastAPI ag-ui-langgraph 端点，跑通 LangGraph 1.x dataclass `context_schema`。
>
> 完成日期：2026-04-30 → 2026-05-01（v2 迁移完成）

---

## 0. 版本选择：v1 vs v2

| | CopilotKit v1 | CopilotKit v2 ✅ |
|---|---|---|
| **包结构** | `@copilotkit/react-core` + `@copilotkit/react-ui` | 全部 `@copilotkit/react-core/v2` |
| **Provider** | `<CopilotKit>` | `<CopilotKitProvider>` |
| **publicApiKey** | 必需（或 dummy） | `agents__unsafe_dev_only` 时可选 |
| **agent 配置** | Provider 上 `agent="name"` | `<CopilotChat agentId="name">` |
| **Inspector** | `enableInspector={false}` 关闭 | `showDevConsole="auto"` 本地开 |
| **CSS 兼容** | Tailwind 3.4 兼容 | **需 shim**（v2 CSS 用 Tailwind v4 指令） |

**推荐 v2**：API 更清晰，不需要 dummy key，但需处理 CSS 冲突（见下文 Pit 6）。

---

## 1. 三层定位

| 层 | 角色 | 类比 |
|---|---|---|
| **LangGraph** | Agent 大脑（graph + state + `context_schema`） | 业务逻辑 |
| **AG-UI** | 开放协议（16 类 SSE 事件 + `RunAgentInput`） | HTTP/REST 这种约定 |
| **CopilotKit** | React 框架（消费 AG-UI 的 Hooks + UI 组件） | axios + 一套 UI 库 |

**CopilotKit 是 AG-UI 协议发明者**，与 ag-ui-langgraph 一等公民集成。

---

## 2. 整体架构（v2 最终版）

```
┌─────────────────────────────────────────────────────────────┐
│ 前端 (frontend/web-app)                                      │
│  /plan/create (CreatePlan.jsx)                              │
│    └─ 紫粉色悬浮按钮 (fixed bottom-28 right-6)              │
│        ↓ navigate('/agui-test')                             │
│                                                             │
│  /agui-test (AGUITest.jsx)                                  │
│    ├─ const agent = new HttpAgent({ url: '<base>/langgraph' })
│    └─ <CopilotKitProvider                                   │
│         agents__unsafe_dev_only={{ v2agent: agent }}        │
│         showDevConsole="auto">  ← v2 inspector 本地自动开   │
│         <CopilotChat agentId="v2agent" />  ← agent 在这配   │
│                                                             │
│  vite.config.js                                             │
│    └─ copilotkitV2CssShim (vite plugin)                     │
│        + optimizeDeps.esbuildOptions.plugins (esbuild)      │
│        → 拦截 v2 内部 `import './index.css'`                │
│        → 转成 JS 模块运行时 <style> 注入                     │
│        → 绕过 Tailwind 3.4 PostCSS pipeline                 │
└─────────────────────────────────────────────────────────────┘
                          │  AG-UI 协议 (SSE)
                          │  POST /langgraph
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ 后端 (pet_food_backend/pet-food)                             │
│  src/api/main.py (FastAPI lifespan)                         │
│    ├─ open_v2_checkpointer() → AsyncPostgresSaver           │
│    ├─ compile_v2_graph(checkpointer)                        │
│    └─ add_langgraph_fastapi_endpoint(                       │
│         agent=DataclassAwareLangGraphAGUIAgent(...),  ←关键 │
│         path="/langgraph")                                  │
│                                                             │
│  src/api/agui_agent.py (协议适配层)                          │
│    └─ DataclassAwareLangGraphAGUIAgent                      │
│        ├─ run(): 过滤 reasoning role（中断遗留）            │
│        └─ get_stream_kwargs(): 过滤 thread_id 注入 ContextV2│
│                                                             │
│  src/agent/v2/ (graph 实现，零改动)                          │
│    ├─ graph.py / utils/context.py / middlewares/...         │
│    └─ ctx = request.runtime.context  ← ContextV2 实例 ✅    │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. 完整请求链路（v2）

```
[1] 用户点击悬浮按钮
[2] React Router → /agui-test
[3] <CopilotKitProvider> 初始化 → 注册 HttpAgent 实例
[4] 用户在 <CopilotChat> 输入 → useCopilotChat → agent.runAgent(...)
[5] HttpAgent 发送 POST <host>/langgraph (body: RunAgentInput, accept: SSE)
[6] FastAPI 路由 → ag_ui_langgraph.endpoint.event_generator
[7] → DataclassAwareLangGraphAGUIAgent.run (子类)
[8]   → 过滤 input.messages 中非标准 role（reasoning/thinking 等中断遗留）
[9]   → super().run → _handle_stream_events → prepare_stream
[10]  → get_stream_kwargs (被我们 override):
          - super().get_stream_kwargs() 拿到 base kwargs
          - 检测 graph.context_schema 是 dataclass
          - 过滤 base_context: {thread_id, ...} → 只留 ContextV2 字段
          - ContextV2(**filtered) → instance
[11] graph.astream_events(
        input=...,
        context=ContextV2 实例,        ← 关键
        config={configurable: {thread_id: ...}}
     )
[12] v2 graph 节点执行 → runtime.context = ContextV2 实例 ✅
[13] dynamic_prompt_middleware: ctx.research_planner_prompt.format(...) ✅
[14] LangGraph stream → ag_ui_langgraph 转 AG-UI 事件 (TEXT_MESSAGE_*, TOOL_CALL_*, ...)
[15] SSE 推送回前端 → CopilotChat 流式渲染
```

---

## 4. 关键决策与原因

### 4.1 为什么选 v2 而非 v1？

| 优势 | v1 | v2 |
|---|---|---|
| 不需要 dummy `publicApiKey` | ❌ 必需 | ✅ `agents__unsafe_dev_only` 时可选 |
| agent 配置位置 | Provider 上 | `<CopilotChat agentId>` 更灵活 |
| 包结构 | 分散两个包 | 统一 `@copilotkit/react-core/v2` |
| Inspector 控制 | `enableInspector` | `showDevConsole="auto"` 更语义化 |

**代价**：v2 CSS 用 Tailwind v4 指令（`@layer properties`），与项目 Tailwind 3.4 冲突，需 vite + esbuild 双层 shim（见 Pit 6）。

### 4.2 为什么不通过前端 `forwardedProps.config` 注入 context？

阅读 ag-ui-langgraph `agent.py` 源码确认：
- `_handle_stream_events` 第 195 行：`config = ensure_config(self.config.copy() if self.config else {})`
- `forwarded_props` 只用于读 `command`、`node_name`、`stream_subgraphs`
- **`forwarded_props.config` 完全被忽略**

→ 必须在后端 `LangGraphAGUIAgent` 构造时静态注入，或子类化处理。

### 4.3 为什么用子类化而不是给 `ContextV2` 加 `.schema()` 方法？

- introspection 失败的 warning 只影响 `schema_keys["context"]`（给 `langgraph_default_merge_state` 用），**不影响 context 注入路径**
- 真正问题：`base_context = {'thread_id': '...', ...}` 始终包含 `thread_id`（来自 ag-ui-langgraph 自动注入）
- LangGraph 1.x `_coerce_context`：`isinstance(context, dict) and is_dataclass(schema)` → `schema(**context)`
- ContextV2 没有 `thread_id` 字段 → `TypeError` → silent fallback → `runtime.context = None`
- 加 `.schema()` 解决不了 thread_id 冲突

### 4.4 为什么注入 dataclass 实例而不是过滤后的 dict？

- 直接传 dict 给 LangGraph 仍走 `_coerce_context` → 字段不匹配的风险
- 直接构造 `schema(**filtered)` 实例：
  - 错误更显式（构造失败时立即可见，不是 silent None）
  - 语义明确（这就是要传给 graph 的 ContextV2 实例）
  - 兼容未来扩展（前端如果通过其他渠道传值，过滤后塞进来即可）

---

## 5. 踩坑记录

### Pit 1: ~~CopilotKit v1 强制 `publicApiKey`~~（v2 已修复）

| | |
|---|---|
| v1 现象 | `ConfigurationError: Missing required prop: 'runtimeUrl' or 'publicApiKey' or 'publicLicenseKey'` |
| v1 根因 | `validateProps` 在 `copilotkit-Bd0m5HFp.mjs:840` 强制检查 |
| v1 修复 | 加 dummy `publicApiKey="dev-only-experiment"` |
| v2 改进 | `hasLocalAgents` 时跳过校验（`agents__unsafe_dev_only` 提供本地 agent 即可） |

### Pit 2: ag-ui-langgraph 不消费 `forwarded_props.config`

| | |
|---|---|
| 现象 | 前端传 `forwardedProps.config.configurable.user_id` 后端拿不到 |
| 根因 | `agent.py:195` 直接 `config = ensure_config(self.config.copy() ...)`，完全忽略 forwarded_props 里的 config |
| 修复 | 后端子类化 `LangGraphAGUIAgent` 静态注入 |
| 复用 | **不要** 试图通过前端 forwardedProps 动态传 LangGraph config |

### Pit 3: dataclass `context_schema` + `thread_id` 冲突

| | |
|---|---|
| 现象 | `runtime.context = None` → `'NoneType' object has no attribute 'research_planner_prompt'` |
| 根因 | `base_context = {**configurable}` 含 `thread_id`，ContextV2 dataclass 没此字段 → `ContextV2(**dict)` `TypeError` → silent fallback |
| 修复 | 子类化 `LangGraphAGUIAgent.get_stream_kwargs`，按 dataclass `fields()` 过滤 |
| 复用 | **任何 dataclass `context_schema` + ag-ui-langgraph 组合都要这个 wrapper** |

### Pit 4: introspection warning 看似但不是元凶

| | |
|---|---|
| 现象 | 日志 warning `context_schema introspection failed (AttributeError: 'ContextV2' object has no attribute 'schema')` |
| 真相 | 这只影响 `schema_keys["context"]`（给 `langgraph_default_merge_state` 用），**不影响** context 注入路径 |
| 教训 | warning ≠ root cause，要看完整异常栈 |

### Pit 5: ~~`@copilotkit/react-ui` 没有 v2 JS 入口~~（已确认 v2 统一入口）

| | |
|---|---|
| v1 现象 | 试图 `import { CopilotChat } from '@copilotkit/react-ui/v2'` 失败 |
| v1 真相 | `package.json exports` 只有 `./styles.css` 和 `./v2/styles.css`（**仅 CSS**），JS 仍是 v1 |
| v2 改进 | 全部从 `@copilotkit/react-core/v2` 导出（包括 UI 组件） |
| 教训 | 直接读 `package.json` 的 `exports` 字段确认入口，别看文档示例假设 |

### Pit 6: v2 CSS 与 Tailwind 3.4 PostCSS 冲突 ⚠️

| | |
|---|---|
| 现象 | `[postcss] @layer base is used but no matching @tailwind base directive is present` |
| 根因 | v2 CSS 已预编译（含 Tailwind v4 `@layer properties` 等指令），项目用 Tailwind 3.4 PostCSS 处理会炸 |
| 修复（构建） | vite plugin 拦截 v2 内部 `import './index.css'`，转成 JS 模块运行时 `<style>` 注入 |
| 修复（dev） | esbuild plugin 在预 bundle 阶段同样拦截，避免 CJS 依赖裸暴露 |
| 关键点 | 1. 虚拟模块 ID 不能以 `.css` 结尾（vite 按后缀识别）<br>2. dev 模式 esbuild 预 bundle 跳过 vite plugin，需双层 shim<br>3. Windows 路径用反斜杠，`importer.replace(/\\/g, '/')` 归一化 |
| 复用 | **任何 Tailwind 3.x 项目集成 CopilotKit v2 都要这套 shim** |

### Pit 7: 中断后 `role="reasoning"` 遗留崩溃

| | |
|---|---|
| 现象 | 用户中断流式输出 → 下一轮请求 → `ValueError: Unsupported message role: reasoning` |
| 根因 | CopilotKit 把残留的 reasoning message 保留在 thread state，`agui_messages_to_langchain` 只识别 4 种标准 role（user/assistant/system/tool） |
| 修复 | `DataclassAwareLangGraphAGUIAgent.run` 入口过滤掉非标准 role 的历史消息 |
| 复用 | 任何支持 reasoning/thinking 的模型 + 中断恢复场景都需要这个过滤 |

### Pit 8: v2 Inspector 默认关闭

| | |
|---|---|
| 现象 | v2 看不到 inspector（v1 默认开） |
| 根因 | v2 把 prop 改名 `enableInspector` → `showDevConsole`，默认 `false` |
| 修复 | `<CopilotKitProvider showDevConsole="auto">` 仅本地开 |
| 复用 | v2 文档示例用旧 name `enableInspector` 是历史遗留 |

---

## 6. 可复用知识

### 6.1 AG-UI 协议核心

- 16 个标准事件类型：`TEXT_MESSAGE_{START,CONTENT,END}`、`TOOL_CALL_{START,ARGS,END,RESULT}`、`STATE_{SNAPSHOT,DELTA}`、`MESSAGES_SNAPSHOT`、`RUN_{STARTED,FINISHED,ERROR}`、`STEP_{STARTED,FINISHED}`、`CUSTOM`、`RAW`
- 传输：SSE
- 关键概念：`thread_id`（持久化会话）、`run_id`（一次执行）、`forwarded_props`（自定义透传）

### 6.2 CopilotKit v2 UI 三件套

| 组件 | 形态 | 适用场景 |
|---|---|---|
| `<CopilotChat>` | 嵌入式聊天面板 | 主聊天页面 |
| `<CopilotSidebar>` | 侧边栏滑出 | 主应用旁挂助手 |
| `<CopilotPopup>` | 右下角浮动气泡 | 全局 AI 助手 |

**v2 统一入口**：全部从 `@copilotkit/react-core/v2` 导出（包括 UI 组件）。

### 6.3 深度集成 Hooks

| Hook | 用途 |
|---|---|
| `useCoAgent` | 共享状态读写（CopilotKit ↔ Agent） |
| `useCoAgentStateRender` | 流式渲染中间状态（适合可视化进度） |
| `useCopilotAction` + `renderAndWaitForResponse` | 人在回路（HITL）确认 |
| `useCopilotReadable` | 把上下文（如当前选中宠物）暴露给 Agent |

### 6.4 直连 vs Runtime 模式

| 模式 | 优点 | 缺点 |
|---|---|---|
| **CopilotKit Runtime**（Next.js API route）| 自动 properties → configurable 转换；生产稳定 | 需要 Next.js 或 Hono；多一跳 |
| **HttpAgent 直连** + `agents__unsafe_dev_only` | Vite/任意 React 都能用；少一跳 | 失去自动协议转换；标记为 dev_only |

本项目（Vite）只能选直连。

### 6.5 LangGraph 1.x context 注入完整链

```python
# ag-ui-langgraph 的逻辑
graph.astream_events(context=dict_or_instance)
  ↓ _coerce_context(context_schema, context)
  ↓ if context is dict and is_dataclass(schema):
      return schema(**context)   # ← 多余 key → TypeError
  ↓ if context is None:
      return None                # ← 此时 runtime.context = None
```

**最佳实践**：在 wrapper 里直接传 `schema(**filtered)` 实例，绕过 `_coerce_context` 的隐式转换。

### 6.6 v2 CSS Shim 完整实现（Tailwind 3.x 项目必备）

**问题**：v2 CSS 用 Tailwind v4 指令（`@layer properties`），项目 Tailwind 3.4 PostCSS 不识别。

**解决**：双层拦截（vite plugin + esbuild plugin），把 v2 内部 `import './index.css'` 转成 JS 模块运行时注入。

```js
// vite.config.js
import fs from 'node:fs'
import path from 'path'

const COPILOTKIT_V2_VIRTUAL_ID = '\0virtual:copilotkit-v2-css-shim'

const copilotkitV2CssShim = {
  name: 'copilotkit-v2-css-shim',
  enforce: 'pre',
  resolveId(source, importer) {
    if (!source.endsWith('./index.css') || !importer) return null
    const normalized = importer.replace(/\\/g, '/')
    if (normalized.includes('@copilotkit/react-core') && normalized.includes('/v2/')) {
      return COPILOTKIT_V2_VIRTUAL_ID
    }
    return null
  },
  load(id) {
    if (id === COPILOTKIT_V2_VIRTUAL_ID) {
      const cssPath = path.resolve(__dirname, 'node_modules/@copilotkit/react-core/dist/v2/index.css')
      const css = fs.readFileSync(cssPath, 'utf-8')
      return `
        const css = ${JSON.stringify(css)};
        if (typeof document !== 'undefined' && !document.querySelector('style[data-copilotkit-v2]')) {
          const style = document.createElement('style');
          style.dataset.copilotkitV2 = 'true';
          style.textContent = css;
          document.head.appendChild(style);
        }
        export default css;
      `
    }
    return null
  },
}

export default defineConfig({
  plugins: [copilotkitV2CssShim, react()],
  optimizeDeps: {
    esbuildOptions: {
      plugins: [
        {
          name: 'copilotkit-v2-css-shim-esbuild',
          setup(build) {
            build.onResolve({ filter: /^\.\/index\.css$/ }, (args) => {
              const importer = (args.importer || '').replace(/\\/g, '/')
              if (importer.includes('@copilotkit/react-core') && importer.includes('/v2/')) {
                return { path: args.path, namespace: 'copilotkit-v2-css-shim', pluginData: { importer } }
              }
              return null
            })
            build.onLoad({ filter: /.*/, namespace: 'copilotkit-v2-css-shim' }, (args) => {
              const cssPath = path.resolve(path.dirname(args.pluginData.importer), args.path)
              const css = fs.readFileSync(cssPath, 'utf-8')
              return {
                contents: `
                  const css = ${JSON.stringify(css)};
                  if (typeof document !== 'undefined' && !document.querySelector('style[data-copilotkit-v2]')) {
                    const style = document.createElement('style');
                    style.dataset.copilotkitV2 = 'true';
                    style.textContent = css;
                    document.head.appendChild(style);
                  }
                  export default css;
                `,
                loader: 'js',
              }
            })
          },
        },
      ],
    },
  },
  // ... 其他配置
})
```

**关键点**：
1. 虚拟模块 ID 用 `\0` 前缀且不以 `.css` 结尾（vite 按后缀识别 CSS）
2. dev 模式 esbuild 预 bundle 跳过 vite plugin，需 esbuild plugin 同步拦截
3. Windows 路径反斜杠，用 `replace(/\\/g, '/')` 归一化
4. 清除 `node_modules/.vite` 缓存让新配置生效

---

## 7. 关键文件清单

### 后端新增
- `src/api/agui_agent.py` — `DataclassAwareLangGraphAGUIAgent` 子类
  - `run()`: 过滤非标准 role（reasoning/thinking 等中断遗留）
  - `get_stream_kwargs()`: 过滤 thread_id，注入 ContextV2 实例

### 后端修改
- `src/api/main.py:60-86` — lifespan 中替换 `LangGraphAGUIAgent` → `DataclassAwareLangGraphAGUIAgent`

### 前端新增
- `frontend/web-app/src/pages/AGUITest.jsx` — 实验页面，HttpAgent 直连，v2 API
- `frontend/web-app/.env`（追加）— `VITE_AGUI_BASE_URL`、`VITE_AGUI_AGENT_NAME`

### 前端修改
- `frontend/web-app/src/App.jsx:27, 196` — 注册路由 `/agui-test`
- `frontend/web-app/src/pages/CreatePlan.jsx:319-326` — 紫粉色烧瓶悬浮按钮
- `frontend/web-app/vite.config.js` — 新增 `copilotkitV2CssShim` plugin + esbuild plugin

### 包依赖
- 前端新增：`@copilotkit/react-core@1.56.4`（v2 统一入口）、`@ag-ui/client`（自动装）
- 后端：已预装 `ag-ui-langgraph>=0.0.34`、`copilotkit>=0.1.87`

---

## 8. 启动与验证

```bash
# 后端
cd "pet_food_backend/pet-food"
python main.py
# 等待日志：LangGraph /langgraph endpoint ready

# 前端（首次需清缓存）
cd "frontend/web-app"
rm -rf node_modules/.vite  # Windows: rmdir /s /q node_modules\.vite
npm run dev
```

浏览器：登录 → `/plan/create` → 点右下角紫粉色烧瓶 → `/agui-test` → 输入消息。

**验证点**：
- ✅ 浏览器 Network 面板看到 SSE 流到 `<host>/langgraph`
- ✅ 后端日志看到 `plan_agent` 节点执行 + `emit_progress: research_starting`
- ✅ 没有 `'NoneType' object has no attribute 'research_planner_prompt'`
- ✅ 没有 `Unsupported message role: reasoning`（中断后再发消息）
- ✅ 没有 PostCSS `@layer base` 错误
- ✅ CopilotChat 流式渲染响应
- ✅ 右上角看到 inspector（可拖拽）

---

## 9. 未来扩展方向

| 方向 | 思路 |
|---|---|
| 注入业务 context | 改 `DataclassAwareLangGraphAGUIAgent.__init__`，从请求/session 提取 user_id、pet_information 等动态字段塞进 ContextV2 |
| 生成式 UI | 用 `useCoAgentStateRender` 把 v2 graph 中间状态（research_logs、week_plans）流式渲染为卡片 |
| 人在回路 | 在 `dispatch_weeks` 节点用 LangGraph `interrupt()` + 前端 `useCopilotAction({ renderAndWaitForResponse })` 做用户审批 CoordinationGuide |
| 兼容 BaseModel | 如果未来改用 Pydantic，wrapper 增加 `issubclass(schema, BaseModel)` 分支用 `schema.model_validate(filtered)` |
| 替换主流程 SSE | 把现有 `PlanGenerationContext` 手写 SSE 改成 `useCoAgent`，去掉 fallback 轮询逻辑 |
| 升级 Tailwind v4 | 彻底解决 CSS 冲突（但影响全项目，需评估） |

---

## 10. 协议参考

- AG-UI 协议官网：https://docs.ag-ui.com
- CopilotKit 文档：https://docs.copilotkit.ai
- CopilotKit v2 迁移指南：https://docs.copilotkit.ai/langgraph/troubleshooting/migrate-to-v2
- LangGraph context_schema：https://langchain-ai.github.io/langgraph/concepts/runtime
- ag-ui-langgraph 源码：`pet-food/.venv/Lib/site-packages/ag_ui_langgraph/agent.py`
- LangGraph `_coerce_context`：`pet-food/.venv/Lib/site-packages/langgraph/...`（关键函数，见 deepwiki）

---

## 附录：v1 → v2 迁移 Checklist

- [ ] 前端包：`@copilotkit/react-core` + `@copilotkit/react-ui` → `@copilotkit/react-core/v2`
- [ ] CSS 导入：`@copilotkit/react-ui/styles.css` → 删除（由 vite plugin 注入）
- [ ] Provider：`<CopilotKit>` → `<CopilotKitProvider>`
- [ ] 删除 `publicApiKey` prop（v2 有 `agents__unsafe_dev_only` 时可选）
- [ ] agent 配置：Provider 的 `agent="name"` → `<CopilotChat agentId="name">`
- [ ] Inspector：`enableInspector={false}` → `showDevConsole="auto"`
- [ ] vite.config.js：加 `copilotkitV2CssShim` plugin + esbuild plugin（见 6.6）
- [ ] 清除缓存：`rm -rf node_modules/.vite`
- [ ] 后端：`DataclassAwareLangGraphAGUIAgent.run()` 加 reasoning role 过滤
- [ ] 测试中断恢复：发消息 → 中断 → 再发消息，确认不报 `Unsupported message role`
