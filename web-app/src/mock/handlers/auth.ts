import type {
  ApiResponse, AuthResponse, UserInfo, TokenData,
  LoginRequest, RegisterRequest, VerifyRegisterRequest,
  SendCodeRequest, ChangePasswordRequest, ResetPasswordRequest,
  UpdateProfileRequest, SubscriptionStatusResponse,
} from '../../api/types';
import { mockUser, mockTokens } from '../data/user';
import { delay, mockResponse } from '../utils';
import { setAuthTokens } from '../../utils/storage';

let currentUser: UserInfo = { ...mockUser };

function setTokens(): void {
  setAuthTokens(mockTokens);
}

export const mockAuthApi = {
  async login(_data: LoginRequest): Promise<ApiResponse<AuthResponse>> {
    await delay();
    setTokens();
    return mockResponse({ user: currentUser, tokens: mockTokens });
  },

  async register(data: RegisterRequest): Promise<ApiResponse<AuthResponse>> {
    await delay();
    currentUser = { ...currentUser, username: data.username, email: data.email };
    setTokens();
    return mockResponse({ user: currentUser, tokens: mockTokens });
  },

  async verifyRegister(data: VerifyRegisterRequest): Promise<ApiResponse<AuthResponse>> {
    await delay();
    currentUser = { ...currentUser, username: data.username, email: data.email };
    setTokens();
    return mockResponse({ user: currentUser, tokens: mockTokens });
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
    return mockResponse(currentUser);
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
    currentUser = { ...currentUser, ...data };
    return mockResponse(currentUser);
  },

  async uploadAvatar(file: File): Promise<ApiResponse<{ avatar_url: string }>> {
    await delay();
    const url = URL.createObjectURL(file);
    currentUser = { ...currentUser, avatar_url: url };
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
