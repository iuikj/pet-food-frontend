/**
 * 宠物 Mock 数据
 */
import type { PetResponse } from '../../api/types';

export const mockPets: PetResponse[] = [
  {
    id: 'mock-pet-001',
    user_id: 'mock-user-001',
    name: 'Cooper',
    type: 'dog',
    breed: '金毛寻回犬',
    age: 3,
    weight: 28.5,
    gender: 'male',
    avatar_url: undefined,
    health_status: '对鸡肉过敏，关节需要保养',
    special_requirements: '避免鸡肉，增加 Omega-3 脂肪酸',
    is_active: true,
    has_plan: true,
    created_at: '2025-11-15T10:00:00Z',
    updated_at: '2026-02-20T14:30:00Z',
  },
  {
    id: 'mock-pet-002',
    user_id: 'mock-user-001',
    name: 'Luna',
    type: 'cat',
    breed: '布偶猫',
    age: 1.5,
    weight: 4.2,
    gender: 'female',
    avatar_url: undefined,
    health_status: '健康',
    special_requirements: '',
    is_active: true,
    has_plan: false,
    created_at: '2026-01-10T08:00:00Z',
    updated_at: '2026-02-25T09:00:00Z',
  },
];
