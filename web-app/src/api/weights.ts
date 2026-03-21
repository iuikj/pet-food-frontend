import apiClient from './client';
import type {
    ApiResponse,
    WeightRecord,
    RecordWeightRequest,
} from './types';

export async function recordWeight(data: RecordWeightRequest): Promise<ApiResponse<WeightRecord>> {
    return apiClient.post<any, ApiResponse<WeightRecord>>('/weights/', data);
}

export async function getWeightHistory(
    petId: string,
    days: number = 30,
): Promise<ApiResponse<WeightRecord[]>> {
    return apiClient.get<any, ApiResponse<WeightRecord[]>>('/weights/history', {
        params: { pet_id: petId, days },
    });
}

export async function getLatestWeight(petId: string): Promise<ApiResponse<WeightRecord | null>> {
    return apiClient.get<any, ApiResponse<WeightRecord | null>>('/weights/latest', {
        params: { pet_id: petId },
    });
}

export async function deleteWeightRecord(recordId: string): Promise<ApiResponse<{ record_id: string }>> {
    return apiClient.delete<any, ApiResponse<{ record_id: string }>>(`/weights/${recordId}`);
}

export const weightsApi = {
    recordWeight,
    getWeightHistory,
    getLatestWeight,
    deleteWeightRecord,
};

export default weightsApi;
