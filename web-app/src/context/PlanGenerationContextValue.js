import { createContext } from 'react';

/**
 * PR3 拆分：把原单一 Context 拆成三层独立 Context，分别承载
 *   1. PlanStatusContext —— 中频字段（status / progress / currentStepIndex / currentNode / taskId / planId / error / result / isBackgroundRunning / steps / currentStep）
 *   2. PlanLogContext    —— 高频字段（logs / weekStatuses）
 *   3. PlanActionsContext —— 稳定 callback（startGeneration / resetGeneration / restoreFromBackground / resumePendingTask / completeWithAguiResult）
 *
 * `usePlanGeneration()` 兼容包装组合三个 hook 返回完整字段，原有消费者无感知。
 * 新增 `useGenStatus / useGenLogs / useGenActions` 供未来需要细粒度订阅的页面使用。
 */
export const PlanStatusContext = createContext(null);
export const PlanLogContext = createContext(null);
export const PlanActionsContext = createContext(null);

// 保留默认导出向后兼容：旧代码若仍 import 默认导出，会拿到 null（fallback），但目前仓库内除 Provider 本身以外仅 usePlanGeneration.js 引用，且已迁移至新 hook 组合方案。
const PlanGenerationContext = createContext(null);

export default PlanGenerationContext;
