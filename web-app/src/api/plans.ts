import apiClient from './client';
import type {
    ApiResponse,
    CreatePlanRequest,
    PlanResponse,
    PlanListResponse,
    TaskResponse,
    ApplyPlanResponse,
} from './types';
import { getAccessToken } from '../utils/storage';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export async function createPlan(data: CreatePlanRequest): Promise<ApiResponse<{ task_id: string }>> {
    return apiClient.post<any, ApiResponse<{ task_id: string }>>('/plans/', data);
}

export function createPlanStream(
    _data: CreatePlanRequest,
    onMessage: (event: MessageEvent) => void,
    onError?: (error: Event) => void
): EventSource {
    const token = getAccessToken();
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

async function consumeSSEStream(
    reader: ReadableStreamDefaultReader<Uint8Array>,
    onEvent: (event: any) => void,
): Promise<void> {
    const decoder = new TextDecoder();
    let buffer = '';

    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) {
                break;
            }

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                if (!line.startsWith('data: ')) {
                    continue;
                }

                try {
                    onEvent(JSON.parse(line.slice(6)));
                } catch {
                }
            }
        }
    } finally {
        try {
            reader.cancel();
        } catch {
        }
    }
}

export async function createPlanStreamFetch(
    data: CreatePlanRequest,
    onEvent: (event: any) => void,
    onError?: (error: Error) => void
): Promise<void> {
    const token = getAccessToken();

    try {
        const response = await fetch(`${API_BASE_URL}/plans/stream`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
                Connection: 'keep-alive',
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

export async function resumePlanStreamFetch(
    taskId: string,
    onEvent: (event: any) => void,
    onError?: (error: Error) => void
): Promise<void> {
    const token = getAccessToken();

    try {
        const response = await fetch(
            `${API_BASE_URL}/plans/stream?task_id=${encodeURIComponent(taskId)}`,
            {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                    Connection: 'keep-alive',
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

export async function getPlans(): Promise<ApiResponse<PlanListResponse>> {
    return apiClient.get<any, ApiResponse<PlanListResponse>>('/plans/');
}

export async function getPlan(planId: string): Promise<ApiResponse<PlanResponse>> {
    return apiClient.get<any, ApiResponse<PlanResponse>>(`/plans/${planId}`);
}

export async function deletePlan(planId: string): Promise<ApiResponse<{ plan_id: string }>> {
    return apiClient.delete<any, ApiResponse<{ plan_id: string }>>(`/plans/${planId}`);
}

export async function confirmPlan(planId: string): Promise<ApiResponse<{ plan_id: string }>> {
    return apiClient.post<any, ApiResponse<{ plan_id: string }>>(`/plans/${planId}/confirm`);
}

export async function applyPlan(planId: string): Promise<ApiResponse<ApplyPlanResponse>> {
    return apiClient.post<any, ApiResponse<ApplyPlanResponse>>(`/plans/${planId}/apply`);
}

export async function getTask(taskId: string): Promise<ApiResponse<TaskResponse>> {
    return apiClient.get<any, ApiResponse<TaskResponse>>(`/tasks/${taskId}`);
}

export async function getTaskResult(taskId: string): Promise<ApiResponse<any>> {
    return apiClient.get<any, ApiResponse<any>>(`/tasks/${taskId}/result`);
}

export async function cancelTask(taskId: string): Promise<ApiResponse<{ task_id: string }>> {
    return apiClient.delete<any, ApiResponse<{ task_id: string }>>(`/tasks/${taskId}`);
}

export const plansApi = {
    createPlan,
    createPlanStream,
    createPlanStreamFetch,
    resumePlanStreamFetch,
    getPlans,
    getPlan,
    deletePlan,
    confirmPlan,
    applyPlan,
    getTask,
    getTaskResult,
    cancelTask,
};

export default plansApi;
