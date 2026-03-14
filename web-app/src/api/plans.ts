/**
 * 饮食计划 API 服务
 */
import apiClient from './client';
import type {
    ApiResponse,
    CreatePlanRequest,
    PlanResponse,
    PlanListResponse,
    TaskResponse,
} from './types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

/**
 * 创建饮食计划（异步）
 */
export async function createPlan(data: CreatePlanRequest): Promise<ApiResponse<{ task_id: string }>> {
    return apiClient.post<any, ApiResponse<{ task_id: string }>>('/plans/', data);
}

/**
 * 创建饮食计划（流式 SSE）
 * 返回 EventSource 对象，需要手动管理
 */
export function createPlanStream(
    data: CreatePlanRequest,
    onMessage: (event: MessageEvent) => void,
    onError?: (error: Event) => void
): EventSource {
    const token = localStorage.getItem('access_token');

    // 创建一个 POST 请求来启动 SSE
    // 注意：EventSource 只支持 GET，需要先 POST 获取 task_id，再 GET 监听
    const eventSource = new EventSource(
        `${API_BASE_URL}/plans/stream?token=${token}`,
        { withCredentials: false }
    );

    eventSource.onmessage = onMessage;
    if (onError) {
        eventSource.onerror = onError;
    }

    return eventSource;
}

// ── SSE 读取核心逻辑（复用于首次连接和断线重连） ──

/**
 * 从 ReadableStream 读取 SSE 事件
 *
 * 处理三种 SSE 行格式：
 * - `data: {json}` → 解析为事件对象并回调
 * - `: comment`    → 心跳/注释，忽略（保持连接活跃）
 * - 空行          → 事件分隔符
 *
 * 不设置读取超时 — 后端通过 15 秒心跳保活，
 * 客户端只需持续读取直到流结束或网络断开。
 */
async function consumeSSEStream(
    reader: ReadableStreamDefaultReader<Uint8Array>,
    onEvent: (event: any) => void,
): Promise<void> {
    const decoder = new TextDecoder();
    let buffer = '';

    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    try {
                        const data = JSON.parse(line.slice(6));
                        onEvent(data);
                    } catch {
                        // 忽略 JSON 解析错误
                    }
                }
                // `: comment` 行和空行 → 跳过（心跳保活由后端发送）
            }
        }
    } finally {
        try { reader.cancel(); } catch { /* ignore */ }
    }
}

/**
 * 使用 fetch 创建流式计划（支持 POST + SSE）
 *
 * 连接保活策略：
 * - 后端每 15 秒发送 `: heartbeat` SSE 注释
 * - 客户端不设置读取超时，持续等待
 * - 断线后由 PlanGenerationContext 处理重连/降级
 */
export async function createPlanStreamFetch(
    data: CreatePlanRequest,
    onEvent: (event: any) => void,
    onError?: (error: Error) => void
): Promise<void> {
    const token = localStorage.getItem('access_token');

    try {
        const response = await fetch(`${API_BASE_URL}/plans/stream`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
                'Connection': 'keep-alive',
            },
            body: JSON.stringify(data),
            keepalive: false,
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
            throw new Error('No reader available');
        }

        await consumeSSEStream(reader, onEvent);
    } catch (error) {
        if (onError) {
            onError(error as Error);
        }
    }
}

/**
 * 使用 fetch GET 恢复 SSE 流式连接（断线重连）
 *
 * 调用后端 GET /plans/stream?task_id=xxx 端点：
 * - 任务已完成 → 收到 task_completed 事件（含结果）
 * - 任务运行中 → 收到 resumed + 持续进度更新
 * - 任务失败   → 收到 error 事件
 *
 * 同样通过心跳保活，无读取超时。
 */
export async function resumePlanStreamFetch(
    taskId: string,
    onEvent: (event: any) => void,
    onError?: (error: Error) => void
): Promise<void> {
    const token = localStorage.getItem('access_token');

    try {
        const response = await fetch(
            `${API_BASE_URL}/plans/stream?task_id=${encodeURIComponent(taskId)}`,
            {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Connection': 'keep-alive',
                },
            }
        );

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
            throw new Error('No reader available');
        }

        await consumeSSEStream(reader, onEvent);
    } catch (error) {
        if (onError) {
            onError(error as Error);
        }
    }
}

/**
 * 获取计划列表
 */
export async function getPlans(): Promise<ApiResponse<PlanListResponse>> {
    return apiClient.get<any, ApiResponse<PlanListResponse>>('/plans/');
}

/**
 * 获取计划详情
 */
export async function getPlan(planId: string): Promise<ApiResponse<PlanResponse>> {
    return apiClient.get<any, ApiResponse<PlanResponse>>(`/plans/${planId}`);
}

/**
 * 删除计划
 */
export async function deletePlan(planId: string): Promise<ApiResponse<{ plan_id: string }>> {
    return apiClient.delete<any, ApiResponse<{ plan_id: string }>>(`/plans/${planId}`);
}

/**
 * 确认保存饮食计划（从 Redis 临时存储转正到 PostgreSQL）
 */
export async function confirmPlan(planId: string): Promise<ApiResponse<{ plan_id: string }>> {
    return apiClient.post<any, ApiResponse<{ plan_id: string }>>(`/plans/${planId}/confirm`);
}

/**
 * 获取任务详情
 */
export async function getTask(taskId: string): Promise<ApiResponse<TaskResponse>> {
    return apiClient.get<any, ApiResponse<TaskResponse>>(`/tasks/${taskId}`);
}

/**
 * 获取任务结果
 */
export async function getTaskResult(taskId: string): Promise<ApiResponse<any>> {
    return apiClient.get<any, ApiResponse<any>>(`/tasks/${taskId}/result`);
}

/**
 * 取消任务
 */
export async function cancelTask(taskId: string): Promise<ApiResponse<{ task_id: string }>> {
    return apiClient.delete<any, ApiResponse<{ task_id: string }>>(`/tasks/${taskId}`);
}

// 导出所有函数
export const plansApi = {
    createPlan,
    createPlanStream,
    createPlanStreamFetch,
    resumePlanStreamFetch,
    getPlans,
    getPlan,
    deletePlan,
    confirmPlan,
    getTask,
    getTaskResult,
    cancelTask,
};

export default plansApi;
