# frontend 归档区

本目录收纳 `frontend/` 仓库根下过去产生的过程性报告与一次性决策记录。这些文档不再作为权威规则使用，但保留以便溯源历史决策上下文。

## 文件清单

| 文件 | 原位置 | 归档原因 |
|------|--------|---------|
| `错误处理修复报告.md` | `frontend/错误处理修复报告.md` | 错误处理整改的一次性过程报告 |
| `错误处理审查报告.md` | `frontend/错误处理审查报告.md` | 错误处理代码审查的一次性结论 |

## 权威规则去向

错误处理与异常分类的稳定规则已沉淀到：

- `.trellis/spec/frontend/frontend/error-handling.md` — 与本目录直接对应的错误处理规范

相关前端规范（同一族 spec，方便交叉查阅）：

- `.trellis/spec/frontend/frontend/capacitor-guidelines.md` — Capacitor 平台约束
- `.trellis/spec/frontend/frontend/asset-rules.md` — 静态资源与图标规则

后续修改错误处理代码时请以 spec 为准；本目录文件仅用于回溯"当初为何这样改"。

## 为什么不删除

这两份报告记录了具体的代码位置、错误样例、改动顺序等过程决策上下文。spec 中只保留了沉淀后的稳定规则，过程细节有再次复用价值（例如同类问题再次出现时可参考排查路径），故归档保留。
