/**
 * 宠物管理 API 服务
 */
import apiClient from './client';
import type {
    ApiResponse,
    CreatePetRequest,
    UpdatePetRequest,
    PetResponse,
    PetListResponse,
} from './types';

/**
 * 获取宠物列表
 */
export async function getPets(isActive = true): Promise<ApiResponse<PetListResponse>> {
    return apiClient.get<any, ApiResponse<PetListResponse>>('/pets/', {
        params: { is_active: isActive },
    });
}

/**
 * 创建宠物
 */
export async function createPet(data: CreatePetRequest): Promise<ApiResponse<PetResponse>> {
    return apiClient.post<any, ApiResponse<PetResponse>>('/pets/', data);
}

/**
 * 获取宠物详情
 */
export async function getPet(petId: string): Promise<ApiResponse<PetResponse>> {
    return apiClient.get<any, ApiResponse<PetResponse>>(`/pets/${petId}`);
}

/**
 * 更新宠物
 */
export async function updatePet(petId: string, data: UpdatePetRequest): Promise<ApiResponse<PetResponse>> {
    return apiClient.put<any, ApiResponse<PetResponse>>(`/pets/${petId}`, data);
}

/**
 * 删除宠物（软删除）
 */
export async function deletePet(petId: string): Promise<ApiResponse<{ pet_id: string }>> {
    return apiClient.delete<any, ApiResponse<{ pet_id: string }>>(`/pets/${petId}`);
}

/**
 * 上传宠物头像
 */
export async function uploadPetAvatar(petId: string, file: File): Promise<ApiResponse<{ avatar_url: string }>> {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post<any, ApiResponse<{ avatar_url: string }>>(`/pets/${petId}/avatar`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
}

// 导出所有函数
export const petsApi = {
    getPets,
    createPet,
    getPet,
    updatePet,
    deletePet,
    uploadPetAvatar,
};

export default petsApi;
