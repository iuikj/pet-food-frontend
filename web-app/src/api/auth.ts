/**
 * 认证 API 服务
 */
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

/**
 * 用户登录
 */
export async function login(data: LoginRequest): Promise<ApiResponse<AuthResponse>> {
    const res = await apiClient.post<ApiResponse<AuthResponse>>('/auth/login', data);
    return res.data;
}

/**
 * 用户注册（直接注册）
 */
export async function register(data: RegisterRequest): Promise<ApiResponse<AuthResponse>> {
    const res = await apiClient.post<ApiResponse<AuthResponse>>('/auth/register', data);
    return res.data;
}

/**
 * 发送验证码
 */
export async function sendCode(data: SendCodeRequest): Promise<ApiResponse<{ message: string }>> {
    const res = await apiClient.post<ApiResponse<{ message: string }>>('/auth/send-code', data);
    return res.data;
}

/**
 * 验证码注册
 */
export async function verifyRegister(data: VerifyRegisterRequest): Promise<ApiResponse<AuthResponse>> {
    const res = await apiClient.post<ApiResponse<AuthResponse>>('/auth/verify-register', data);
    return res.data;
}

/**
 * 刷新 Token
 */
export async function refreshToken(): Promise<ApiResponse<TokenData>> {
    const refresh_token = localStorage.getItem('refresh_token');
    const res = await apiClient.post<ApiResponse<TokenData>>('/auth/refresh', null, {
        headers: {
            Authorization: `Bearer ${refresh_token}`,
        },
    });
    return res.data;
}

/**
 * 获取当前用户信息
 */
export async function getMe(): Promise<ApiResponse<UserInfo>> {
    const res = await apiClient.get<ApiResponse<UserInfo>>('/auth/me');
    return res.data;
}

/**
 * 修改密码
 */
export async function changePassword(data: ChangePasswordRequest): Promise<ApiResponse<{ message: string }>> {
    const res = await apiClient.put<ApiResponse<{ message: string }>>('/auth/password', data);
    return res.data;
}

/**
 * 找回密码 - 发送验证码
 */
export async function sendPasswordResetCode(email: string): Promise<ApiResponse<{ message: string }>> {
    const res = await apiClient.post<ApiResponse<{ message: string }>>('/auth/password/send-code', { email });
    return res.data;
}

/**
 * 找回密码 - 重置密码
 */
export async function resetPassword(data: ResetPasswordRequest): Promise<ApiResponse<{ message: string }>> {
    const res = await apiClient.post<ApiResponse<{ message: string }>>('/auth/password/reset', data);
    return res.data;
}

/**
 * 更新用户信息
 */
export async function updateProfile(data: UpdateProfileRequest): Promise<ApiResponse<UserInfo>> {
    const res = await apiClient.put<ApiResponse<UserInfo>>('/auth/profile', data);
    return res.data;
}

/**
 * 上传用户头像
 */
export async function uploadAvatar(file: File): Promise<ApiResponse<{ avatar_url: string }>> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await apiClient.post<ApiResponse<{ avatar_url: string }>>('/auth/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
}

/**
 * 获取订阅状态
 */
export async function getSubscription(): Promise<ApiResponse<SubscriptionStatusResponse>> {
    const res = await apiClient.get<ApiResponse<SubscriptionStatusResponse>>('/auth/subscription');
    return res.data;
}

// 导出所有函数
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
