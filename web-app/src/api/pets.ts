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
    const res = await apiClient.get<ApiResponse<PetListResponse>>('/pets/', {
        params: { is_active: isActive },
    });
    return res.data;
}

/**
 * 创建宠物
 */
export async function createPet(data: CreatePetRequest): Promise<ApiResponse<PetResponse>> {
    const res = await apiClient.post<ApiResponse<PetResponse>>('/pets/', data);
    return res.data;
}

/**
 * 获取宠物详情
 */
export async function getPet(petId: string): Promise<ApiResponse<PetResponse>> {
    const res = await apiClient.get<ApiResponse<PetResponse>>(`/pets/${petId}`);
    return res.data;
}

/**
 * 更新宠物
 */
export async function updatePet(petId: string, data: UpdatePetRequest): Promise<ApiResponse<PetResponse>> {
    const res = await apiClient.put<ApiResponse<PetResponse>>(`/pets/${petId}`, data);
    return res.data;
}

/**
 * 删除宠物（软删除）
 */
export async function deletePet(petId: string): Promise<ApiResponse<{ pet_id: string }>> {
    const res = await apiClient.delete<ApiResponse<{ pet_id: string }>>(`/pets/${petId}`);
    return res.data;
}

/**
 * 上传宠物头像
 */
export async function uploadPetAvatar(petId: string, file: File): Promise<ApiResponse<{ avatar_url: string }>> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await apiClient.post<ApiResponse<{ avatar_url: string }>>(`/pets/${petId}/avatar`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
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
