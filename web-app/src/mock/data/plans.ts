/**
 * 计划生成 Mock 数据
 * 包含 SSE 事件序列 和 最终计划结果
 */
import type { SSEEvent, TaskResponse } from '../../api/types';

/** SSE 事件序列（模拟 V1 三阶段流水线，总时长约 20 秒） */
export interface MockSSEEvent extends SSEEvent {
  delayMs: number;
}

export const mockSSEEvents: MockSSEEvent[] = [
  // === Phase 1: 研究阶段 ===
  { type: 'task_created', task_id: 'mock-task-001', message: '任务已创建', progress: 0, delayMs: 500 },
  { type: 'research_starting', message: '开始调研宠物营养需求...', progress: 5, delayMs: 1500 },
  { type: 'research_task_delegating', task_name: '调研金毛犬基础营养需求', message: '正在分析品种特征和营养需求...', progress: 10, delayMs: 2000 },
  { type: 'research_task_delegating', task_name: '调研过敏食材替代方案', message: '正在搜索鸡肉过敏替代蛋白源...', progress: 18, delayMs: 2000 },
  { type: 'research_task_delegating', task_name: '调研关节保养营养方案', message: '正在分析 Omega-3 和关节营养素...', progress: 25, delayMs: 1500 },
  { type: 'research_finalizing', message: '调研完成，正在生成四周差异化方案...', progress: 30, delayMs: 1500 },

  // === Phase 2: 周计划阶段（4 周并行） ===
  { type: 'dispatching', message: '分发四周计划任务...', progress: 35, delayMs: 800 },
  { type: 'week_planning', detail: { week: 1 }, message: '第 1 周：基础适应期食谱制定中...', progress: 40, delayMs: 1500 },
  { type: 'week_planning', detail: { week: 2 }, message: '第 2 周：营养强化期食谱制定中...', progress: 48, delayMs: 1200 },
  { type: 'week_completed', detail: { week: 1 }, message: '第 1 周食谱已完成', progress: 55, delayMs: 1000 },
  { type: 'week_planning', detail: { week: 3 }, message: '第 3 周：多样化食谱制定中...', progress: 60, delayMs: 1200 },
  { type: 'week_completed', detail: { week: 2 }, message: '第 2 周食谱已完成', progress: 65, delayMs: 1000 },
  { type: 'week_planning', detail: { week: 4 }, message: '第 4 周：巩固优化期食谱制定中...', progress: 70, delayMs: 1200 },
  { type: 'week_completed', detail: { week: 3 }, message: '第 3 周食谱已完成', progress: 75, delayMs: 1000 },
  { type: 'week_completed', detail: { week: 4 }, message: '第 4 周食谱已完成', progress: 80, delayMs: 1000 },

  // === Phase 3: 汇总阶段 ===
  { type: 'gathering', message: '收集所有周计划数据...', progress: 85, delayMs: 1000 },
  { type: 'structuring', message: '正在生成结构化报告...', progress: 92, delayMs: 1500 },
  { type: 'task_completed', task_id: 'mock-task-001', message: '饮食计划生成完成！', progress: 100, delayMs: 500 },
];

/** 计划生成完成后的任务状态 */
export const mockCompletedTask: TaskResponse = {
  id: 'mock-task-001',
  task_type: 'plan_generation',
  status: 'completed',
  progress: 100,
  current_node: 'done',
  input_data: {},
  output_data: { plan_id: 'mock-plan-001' },
  started_at: new Date(Date.now() - 25000).toISOString(),
  completed_at: new Date().toISOString(),
  created_at: new Date(Date.now() - 30000).toISOString(),
};

/** 简化的计划结果数据 */
export const mockPlanResult = {
  id: 'mock-plan-001',
  user_id: 'mock-user-001',
  pet_type: 'dog' as const,
  pet_breed: '金毛寻回犬',
  pet_age: 3,
  pet_weight: 28.5,
  health_status: '对鸡肉过敏，关节需要保养',
  content: {
    plan_name: 'Cooper 的专属月度营养计划',
    duration: '4 周',
    summary: '针对金毛犬 Cooper 的个性化月度饮食计划，重点关注鸡肉过敏替代方案和关节保养营养补充。',
    weeks: [
      {
        week: 1,
        theme: '基础适应期',
        description: '以易消化、低过敏的蛋白质为主，帮助肠胃适应新食谱。',
        daily_calories: 1350,
      },
      {
        week: 2,
        theme: '营养强化期',
        description: '逐步增加 Omega-3 脂肪酸摄入，强化关节保养。',
        daily_calories: 1400,
      },
      {
        week: 3,
        theme: '多样化周',
        description: '引入更多蛋白质来源（鱼、鸭、牛肉），丰富营养谱。',
        daily_calories: 1380,
      },
      {
        week: 4,
        theme: '巩固优化期',
        description: '根据前三周表现优化配比，形成稳定饮食模式。',
        daily_calories: 1360,
      },
    ],
  },
  created_at: new Date().toISOString(),
};
