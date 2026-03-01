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

/**
 * 使用 fetch 创建流式计划（支持 POST + SSE）
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
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
            throw new Error('No reader available');
        }

        const decoder = new TextDecoder();
        let buffer = '';

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
                    } catch (e) {
                        // 忽略解析错误
                    }
                }
            }
        }
    } catch (error) {
        if (onError) {
            onError(error as Error);
        }
    }
}

/**
 * 恢复 SSE 连接（断线重连）
 */
export function resumePlanStream(
    taskId: string,
    onMessage: (event: MessageEvent) => void,
    onError?: (error: Event) => void
): EventSource {
    const token = localStorage.getItem('access_token');
    const eventSource = new EventSource(
        `${API_BASE_URL}/plans/stream?task_id=${taskId}&token=${token}`,
        { withCredentials: false }
    );

    eventSource.onmessage = onMessage;
    if (onError) {
        eventSource.onerror = onError;
    }

    return eventSource;
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
    resumePlanStream,
    getPlans,
    getPlan,
    deletePlan,
    getTask,
    getTaskResult,
    cancelTask,
};

export default plansApi;
