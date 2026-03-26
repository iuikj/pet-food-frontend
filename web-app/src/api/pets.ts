import apiClient from './client';
import type {
    ApiResponse,
    CreatePetRequest,
    UpdatePetRequest,
    PetResponse,
    PetListResponse,
} from './types';

export async function getPets(isActive = true): Promise<ApiResponse<PetListResponse>> {
    return apiClient.get<any, ApiResponse<PetListResponse>>('/pets/', {
        params: { is_active: isActive },
    });
}

export async function createPet(data: CreatePetRequest): Promise<ApiResponse<PetResponse>> {
    return apiClient.post<any, ApiResponse<PetResponse>>('/pets/', data);
}

export async function getPet(petId: string): Promise<ApiResponse<PetResponse>> {
    return apiClient.get<any, ApiResponse<PetResponse>>(`/pets/${petId}`);
}

export async function updatePet(petId: string, data: UpdatePetRequest): Promise<ApiResponse<PetResponse>> {
    return apiClient.put<any, ApiResponse<PetResponse>>(`/pets/${petId}`, data);
}

export async function deletePet(petId: string): Promise<ApiResponse<{ pet_id: string }>> {
    return apiClient.delete<any, ApiResponse<{ pet_id: string }>>(`/pets/${petId}`);
}

export async function uploadPetAvatar(petId: string, file: File): Promise<ApiResponse<{ avatar_url: string }>> {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post<any, ApiResponse<{ avatar_url: string }>>(`/pets/${petId}/avatar`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
}

export const petsApi = {
    getPets,
    createPet,
    getPet,
    updatePet,
    deletePet,
    uploadPetAvatar,
};

export default petsApi;
