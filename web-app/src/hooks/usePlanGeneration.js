import { useContext, useMemo } from 'react';
import {
  PlanActionsContext,
  PlanLogContext,
  PlanStatusContext,
} from '../context/PlanGenerationContextValue';

/**
 * 细粒度订阅 hook：仅订阅状态字段（中频更新）
 * 字段：status / progress / currentStepIndex / currentStep / steps / currentNode / taskId / planId / error / result / isBackgroundRunning
 */
export function useGenStatus() {
  const ctx = useContext(PlanStatusContext);
  if (!ctx) {
    throw new Error('useGenStatus must be used within a PlanGenerationProvider');
  }
  return ctx;
}

/**
 * 细粒度订阅 hook：仅订阅日志/周状态（高频更新）
 * 字段：logs / weekStatuses
 */
export function useGenLogs() {
  const ctx = useContext(PlanLogContext);
  if (!ctx) {
    throw new Error('useGenLogs must be used within a PlanGenerationProvider');
  }
  return ctx;
}

/**
 * 细粒度订阅 hook：仅订阅 actions（最稳定，几乎不重渲染）
 * 字段：startGeneration / resetGeneration / restoreFromBackground / resumePendingTask / completeWithAguiResult
 */
export function useGenActions() {
  const ctx = useContext(PlanActionsContext);
  if (!ctx) {
    throw new Error('useGenActions must be used within a PlanGenerationProvider');
  }
  return ctx;
}

/**
 * 兼容包装：聚合三层 Context 字段，与改造前 API 完全一致。
 *
 * 注意：此包装本身会让消费者在 status / logs / actions 任一变化时都重渲染（与改造前一致）。
 * 真正的性能收益来源：
 *   1) 想细粒度订阅的页面改用 useGenStatus / useGenLogs / useGenActions
 *   2) actions 不再因 logs 变化而重新生成新引用（Provider 内部 useMemo([])）
 */
export function usePlanGeneration() {
  const status = useGenStatus();
  const logs = useGenLogs();
  const actions = useGenActions();
  return useMemo(
    () => ({ ...status, ...logs, ...actions }),
    [status, logs, actions],
  );
}
