# web-app 文档归档区

本目录收纳 `frontend/web-app/` 下过去产生的 Capacitor 适配、网络排错与 WebView 优化等过程性文档。

## 文件清单

| 文件 | 原位置 | 归档原因 |
|------|--------|---------|
| `webview-native-optimization.md` | `frontend/web-app/docs/webview-native-optimization.md` | Capacitor WebView 原生优化的探索性笔记 |
| `capacitor-network-troubleshooting.md` | `frontend/web-app/docs/capacitor-network-troubleshooting.md` | Capacitor 网络问题排查记录 |
| `CAPACITOR_CONFIG_GUIDE.md` | `frontend/web-app/CAPACITOR_CONFIG_GUIDE.md` | 早期 Capacitor 配置指南，多数项目设定已固化在 `capacitor.config.json` 中 |
| `AGUI_INTEGRATION.md` | `frontend/web-app/docs/AGUI_INTEGRATION.md` | 与后端的 AG-UI 接入实战记录（见 D3） |

## 权威规则去向

Capacitor 平台相关的稳定规则、Mixed Content / `SecureImage` / FormData 头等约束已沉淀到：

- `.trellis/spec/frontend/frontend/capacitor-guidelines.md`
- `.trellis/spec/frontend/frontend/asset-rules.md`
- `.trellis/spec/frontend/frontend/error-handling.md`（同族错误处理规范，交叉参考）

AG-UI 适配规则与坑点见：

- `.trellis/spec/pet-food/backend/agui-pitfalls.md`
- `.trellis/spec/pet-food/backend/agui-langgraph.md`

## 为什么不删除

这些文档保留了：
1. 具体踩坑路径与症状描述（spec 仅保留结论）；
2. 与第三方库版本相关的临时 workaround 决策上下文；
3. 早期 Capacitor 接入选型记录，可作未来升级时的回溯材料。
