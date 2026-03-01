/**
 * Pets Mock Handler
 * 与 petsApi 同名同签名
 */
import type {
  ApiResponse, PetResponse, PetListResponse,
  CreatePetRequest, UpdatePetRequest,
} from '../../api/types';
import { mockState } from '../mockState';
import { delay, mockResponse, generateId } from '../utils';

export const mockPetsApi = {
  async getPets(_isActive = true): Promise<ApiResponse<PetListResponse>> {
    await delay();
    const pets = mockState.pets;
    return mockResponse({ total: pets.length, items: pets });
  },

  async createPet(data: CreatePetRequest): Promise<ApiResponse<PetResponse>> {
    await delay();
    const now = new Date().toISOString();
    const newPet: PetResponse = {
      id: generateId(),
      user_id: 'mock-user-001',
      name: data.name,
      type: data.type,
      breed: data.breed,
      age: data.age,
      weight: data.weight,
      gender: data.gender,
      avatar_url: undefined,
      health_status: data.health_status,
      special_requirements: data.special_requirements,
      is_active: true,
      has_plan: false,
      created_at: now,
      updated_at: now,
    };
    mockState.addPet(newPet);
    return mockResponse(newPet);
  },

  async getPet(petId: string): Promise<ApiResponse<PetResponse>> {
    await delay();
    const pet = mockState.getPet(petId);
    if (!pet) return mockResponse(null as any, 404, '宠物不存在');
    return mockResponse(pet);
  },

  async updatePet(petId: string, data: UpdatePetRequest): Promise<ApiResponse<PetResponse>> {
    await delay();
    const updated = mockState.updatePet(petId, data as Partial<PetResponse>);
    if (!updated) return mockResponse(null as any, 404, '宠物不存在');
    return mockResponse(updated);
  },

  async deletePet(petId: string): Promise<ApiResponse<{ pet_id: string }>> {
    await delay();
    mockState.deletePet(petId);
    return mockResponse({ pet_id: petId });
  },

  async uploadPetAvatar(petId: string, file: File): Promise<ApiResponse<{ avatar_url: string }>> {
    await delay();
    const url = URL.createObjectURL(file);
    mockState.updatePet(petId, { avatar_url: url } as Partial<PetResponse>);
    return mockResponse({ avatar_url: url });
  },
};
