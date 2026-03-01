/**
 * 用户 Mock 数据
 */
import type { UserInfo, TokenData, AuthResponse } from '../../api/types';

export const mockUser: UserInfo = {
  id: 'mock-user-001',
  username: 'demo_user',
  email: 'demo@petcare.com',
  nickname: '宠物美食家',
  phone: '13800138000',
  avatar_url: undefined,
  is_pro: false,
  plan_type: undefined,
  subscription_expired_at: undefined,
  is_active: true,
  is_superuser: false,
  created_at: '2025-12-01T08:00:00Z',
};

export const mockTokens: TokenData = {
  access_token: 'mock-access-token-xxxxx',
  refresh_token: 'mock-refresh-token-xxxxx',
  token_type: 'bearer',
  expires_in: 3600,
};

export const mockAuthResponse: AuthResponse = {
  user: mockUser,
  tokens: mockTokens,
};
