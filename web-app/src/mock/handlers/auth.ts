/**
 * Auth Mock Handler
 * 与 authApi 同名同签名
 */
import type {
  ApiResponse, AuthResponse, UserInfo, TokenData,
  LoginRequest, RegisterRequest, VerifyRegisterRequest,
  SendCodeRequest, ChangePasswordRequest, ResetPasswordRequest,
  UpdateProfileRequest, SubscriptionStatusResponse,
} from '../../api/types';
import { mockUser, mockTokens, mockAuthResponse } from '../data/user';
import { delay, mockResponse } from '../utils';

// 内存中的可变用户数据
let _currentUser: UserInfo = { ...mockUser };

function setTokens(): void {
  localStorage.setItem('access_token', mockTokens.access_token);
  localStorage.setItem('refresh_token', mockTokens.refresh_token);
}

export const mockAuthApi = {
  async login(_data: LoginRequest): Promise<ApiResponse<AuthResponse>> {
    await delay();
    setTokens();
    return mockResponse({ user: _currentUser, tokens: mockTokens });
  },

  async register(data: RegisterRequest): Promise<ApiResponse<AuthResponse>> {
    await delay();
    _currentUser = { ..._currentUser, username: data.username, email: data.email };
    setTokens();
    return mockResponse({ user: _currentUser, tokens: mockTokens });
  },

  async verifyRegister(data: VerifyRegisterRequest): Promise<ApiResponse<AuthResponse>> {
    await delay();
    _currentUser = { ..._currentUser, username: data.username, email: data.email };
    setTokens();
    return mockResponse({ user: _currentUser, tokens: mockTokens });
  },

  async sendCode(_data: SendCodeRequest): Promise<ApiResponse<{ message: string }>> {
    await delay();
    return mockResponse({ message: '验证码已发送（Mock 模式）' });
  },

  async refreshToken(): Promise<ApiResponse<TokenData>> {
    await delay(100);
    return mockResponse(mockTokens);
  },

  async getMe(): Promise<ApiResponse<UserInfo>> {
    await delay(100);
    return mockResponse(_currentUser);
  },

  async changePassword(_data: ChangePasswordRequest): Promise<ApiResponse<{ message: string }>> {
    await delay();
    return mockResponse({ message: '密码修改成功（Mock 模式）' });
  },

  async sendPasswordResetCode(_email: string): Promise<ApiResponse<{ message: string }>> {
    await delay();
    return mockResponse({ message: '重置码已发送（Mock 模式）' });
  },

  async resetPassword(_data: ResetPasswordRequest): Promise<ApiResponse<{ message: string }>> {
    await delay();
    return mockResponse({ message: '密码重置成功（Mock 模式）' });
  },

  async updateProfile(data: UpdateProfileRequest): Promise<ApiResponse<UserInfo>> {
    await delay();
    _currentUser = { ..._currentUser, ...data };
    return mockResponse(_currentUser);
  },

  async uploadAvatar(file: File): Promise<ApiResponse<{ avatar_url: string }>> {
    await delay();
    const url = URL.createObjectURL(file);
    _currentUser = { ..._currentUser, avatar_url: url };
    return mockResponse({ avatar_url: url });
  },

  async getSubscription(): Promise<ApiResponse<SubscriptionStatusResponse>> {
    await delay(100);
    return mockResponse({
      is_pro: false,
      plan_type: undefined,
      subscription_expired_at: undefined,
      is_expired: false,
      days_remaining: undefined,
    });
  },
};
