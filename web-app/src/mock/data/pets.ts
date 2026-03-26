import type { PetResponse } from '../../api/types';

const xiaoJiMaoAvatar = new URL('../../../assets/小鸡毛头像.jpg', import.meta.url).href;
const xiaoBaiAvatar = new URL('../../../assets/小白头像.jpg', import.meta.url).href;

export const mockPets: PetResponse[] = [
  {
    id: 'mock-pet-001',
    user_id: 'mock-user-001',
    name: '小鸡毛',
    type: 'dog',
    breed: '金毛犬',
    age: 36,
    weight: 28.5,
    gender: 'male',
    avatar_url: xiaoJiMaoAvatar,
    health_status: '状态稳定，活动量正常',
    special_requirements: '日常注意关节护理，可适量补充 Omega-3',
    is_active: true,
    has_plan: true,
    created_at: '2025-11-15T10:00:00Z',
    updated_at: '2026-03-26T00:00:00Z',
  },
  {
    id: 'mock-pet-002',
    user_id: 'mock-user-001',
    name: '小白',
    type: 'dog',
    breed: '马尔济斯',
    age: 18,
    weight: 4.2,
    gender: 'female',
    avatar_url: xiaoBaiAvatar,
    health_status: '整体健康，轻微泪痕需日常清洁',
    special_requirements: '注意眼周清洁，零食适量',
    is_active: true,
    has_plan: false,
    created_at: '2026-01-10T08:00:00Z',
    updated_at: '2026-03-26T00:00:00Z',
  },
];
