/**
 * Plans Mock Handler (核心)
 * 与 plansApi 同名同签名
 * 含 SSE 模拟流
 */
import type {
  ApiResponse, CreatePlanRequest, PlanResponse, PlanListResponse,
  PlanSummaryResponse, TaskResponse, SSEEvent,
} from '../../api/types';
import { mockSSEEvents, mockCompletedTask, mockPlanResult } from '../data/plans';
import { mockState } from '../mockState';
import { delay, mockResponse } from '../utils';

/**
 * 从完整 plan 中提取 Summary（不含 plan_data）
 */
function toSummary(plan: any): PlanSummaryResponse {
  return {
    id: plan.id,
    task_id: plan.task_id,
    pet_id: plan.pet_id,
    pet_type: plan.pet_type,
    pet_breed: plan.pet_breed,
    pet_age: plan.pet_age,
    pet_weight: plan.pet_weight,
    health_status: plan.health_status,
    created_at: plan.created_at,
    updated_at: plan.updated_at,
  };
}

export const mockPlansApi = {
  async createPlan(_data: CreatePlanRequest): Promise<ApiResponse<{ task_id: string }>> {
    await delay();
    return mockResponse({ task_id: 'mock-task-001' });
  },

  /**
   * 模拟 fetch-based SSE 流
   * 逐个发送 mockSSEEvents，每个事件间有设定的延迟
   * completed 事件已在 mockSSEEvents 中包含 detail.plans，前端 handleSSEEvent 会处理
   * 计划数据暂不自动保存，需用户通过 confirmPlan 确认后保存
   */
  async createPlanStreamFetch(
    _data: CreatePlanRequest,
    onEvent: (event: SSEEvent) => void,
    _onError?: (error: Error) => void,
  ): Promise<void> {
    for (const event of mockSSEEvents) {
      await delay(event.delayMs);
      // 剥离 delayMs，只传递标准 SSEEvent 字段
      const { delayMs: _, ...sseEvent } = event;
      onEvent(sseEvent);
    }
  },

  /**
   * 模拟 EventSource SSE（返回一个 fake EventSource 对象）
   */
  createPlanStream(
    _data: CreatePlanRequest,
    onMessage: (event: MessageEvent) => void,
    _onError?: (error: Event) => void,
  ): EventSource {
    const fakeES = {
      close: () => { },
      readyState: 1,
      CONNECTING: 0,
      OPEN: 1,
      CLOSED: 2,
    } as unknown as EventSource;

    (async () => {
      for (const event of mockSSEEvents) {
        await delay(event.delayMs);
        const { delayMs: _, ...sseEvent } = event;
        const msgEvent = new MessageEvent('message', {
          data: JSON.stringify(sseEvent),
        });
        onMessage(msgEvent);
      }
    })();

    return fakeES;
  },

  /**
   * 模拟断线重连（直接返回 completed 状态 + plan_id）
   */
  resumePlanStream(
    _taskId: string,
    onMessage: (event: MessageEvent) => void,
    _onError?: (error: Event) => void,
  ): EventSource {
    const fakeES = { close: () => { } } as unknown as EventSource;

    setTimeout(() => {
      const event = new MessageEvent('message', {
        data: JSON.stringify({
          type: 'task_completed',
          task_id: 'mock-task-001',
          plan_id: 'mock-plan-001',
          result: mockPlanResult,
          message: '饮食计划生成完成！',
          progress: 100,
        }),
      });
      onMessage(event);
    }, 500);

    return fakeES;
  },

  /**
   * 模拟 fetch-based 断线重连（直接发送 completed 事件 + plan_id）
   */
  async resumePlanStreamFetch(
    _taskId: string,
    onEvent: (event: SSEEvent) => void,
    _onError?: (error: Error) => void,
  ): Promise<void> {
    await delay(500);
    onEvent({
      type: 'task_completed',
      task_id: 'mock-task-001',
      plan_id: 'mock-plan-001',
      result: mockPlanResult,
      message: '饮食计划生成完成！',
      progress: 100,
    } as SSEEvent);
  },

  // ===== 状态感知的计划管理 =====

  async getPlans(): Promise<ApiResponse<PlanListResponse>> {
    await delay();
    return mockResponse({
      total: mockState.plans.length,
      page: 1,
      page_size: 10,
      items: mockState.plans.map(toSummary),
    });
  },

  async getPlan(planId: string): Promise<ApiResponse<PlanResponse>> {
    await delay();
    const plan = mockState.getPlan(planId);
    if (!plan) {
      return { code: 404, message: '计划不存在', data: null as any };
    }
    return mockResponse(plan as unknown as PlanResponse);
  },

  async deletePlan(planId: string): Promise<ApiResponse<{ plan_id: string }>> {
    await delay();
    mockState.deletePlan(planId);
    return mockResponse({ plan_id: planId });
  },

  async getTask(_taskId: string): Promise<ApiResponse<TaskResponse>> {
    await delay(100);
    return mockResponse(mockCompletedTask);
  },

  async getTaskResult(_taskId: string): Promise<ApiResponse<any>> {
    await delay(100);
    return mockResponse(mockPlanResult);
  },

  async cancelTask(taskId: string): Promise<ApiResponse<{ task_id: string }>> {
    await delay();
    return mockResponse({ task_id: taskId });
  },

  /**
   * 模拟确认保存饮食计划（从临时存储转正）
   * Mock 模式下直接保存到 mockState 并返回 plan_id
   */
  async confirmPlan(planId: string): Promise<ApiResponse<{ plan_id: string }>> {
    await delay();
    // 将 mockPlanResult 保存到 mockState（模拟 Redis → PostgreSQL 转正）
    const newPlan = {
      ...JSON.parse(JSON.stringify(mockPlanResult)),
      id: planId || `mock-plan-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    mockState.addPlan(newPlan);
    return mockResponse({ plan_id: newPlan.id });
  },
};
