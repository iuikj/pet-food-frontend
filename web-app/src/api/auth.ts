import apiClient from './client';
import type {
    ApiResponse,
    LoginRequest,
    RegisterRequest,
    VerifyRegisterRequest,
    SendCodeRequest,
    ChangePasswordRequest,
    ResetPasswordRequest,
    UpdateProfileRequest,
    AuthResponse,
    TokenData,
    UserInfo,
    SubscriptionStatusResponse,
} from './types';
import { getRefreshToken } from '../utils/storage';

export async function login(data: LoginRequest): Promise<ApiResponse<AuthResponse>> {
    return apiClient.post<any, ApiResponse<AuthResponse>>('/auth/login', data);
}

export async function register(data: RegisterRequest): Promise<ApiResponse<AuthResponse>> {
    return apiClient.post<any, ApiResponse<AuthResponse>>('/auth/register', data);
}

export async function sendCode(data: SendCodeRequest): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post<any, ApiResponse<{ message: string }>>('/auth/send-code', data);
}

export async function verifyRegister(data: VerifyRegisterRequest): Promise<ApiResponse<AuthResponse>> {
    return apiClient.post<any, ApiResponse<AuthResponse>>('/auth/verify-register', data);
}

export async function refreshToken(): Promise<ApiResponse<TokenData>> {
    const refresh_token = getRefreshToken();
    return apiClient.post<any, ApiResponse<TokenData>>('/auth/refresh', null, {
        headers: {
            Authorization: `Bearer ${refresh_token}`,
        },
    });
}

export async function getMe(): Promise<ApiResponse<UserInfo>> {
    return apiClient.get<any, ApiResponse<UserInfo>>('/auth/me');
}

export async function changePassword(data: ChangePasswordRequest): Promise<ApiResponse<{ message: string }>> {
    return apiClient.put<any, ApiResponse<{ message: string }>>('/auth/password', data);
}

export async function sendPasswordResetCode(email: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post<any, ApiResponse<{ message: string }>>('/auth/password/send-code', { email });
}

export async function resetPassword(data: ResetPasswordRequest): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post<any, ApiResponse<{ message: string }>>('/auth/password/reset', data);
}

export async function updateProfile(data: UpdateProfileRequest): Promise<ApiResponse<Partial<UserInfo>>> {
    return apiClient.put<any, ApiResponse<Partial<UserInfo>>>('/auth/profile', data);
}

export async function uploadAvatar(file: File): Promise<ApiResponse<{ avatar_url: string }>> {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post<any, ApiResponse<{ avatar_url: string }>>('/auth/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
}

export async function getSubscription(): Promise<ApiResponse<SubscriptionStatusResponse>> {
    return apiClient.get<any, ApiResponse<SubscriptionStatusResponse>>('/auth/subscription');
}

export const authApi = {
    login,
    register,
    sendCode,
    verifyRegister,
    refreshToken,
    getMe,
    changePassword,
    sendPasswordResetCode,
    resetPassword,
    updateProfile,
    uploadAvatar,
    getSubscription,
};

export default authApi;
