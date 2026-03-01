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
 * 注意：client.ts 的响应拦截器已将 response.data 解包，
 * 所以 apiClient.post() 直接返回 ApiResponse 对象，无需再取 .data
 */
export async function login(data: LoginRequest): Promise<ApiResponse<AuthResponse>> {
    return apiClient.post<any, ApiResponse<AuthResponse>>('/auth/login', data);
}

/**
 * 用户注册（直接注册）
 */
export async function register(data: RegisterRequest): Promise<ApiResponse<AuthResponse>> {
    return apiClient.post<any, ApiResponse<AuthResponse>>('/auth/register', data);
}

/**
 * 发送验证码
 */
export async function sendCode(data: SendCodeRequest): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post<any, ApiResponse<{ message: string }>>('/auth/send-code', data);
}

/**
 * 验证码注册
 */
export async function verifyRegister(data: VerifyRegisterRequest): Promise<ApiResponse<AuthResponse>> {
    return apiClient.post<any, ApiResponse<AuthResponse>>('/auth/verify-register', data);
}

/**
 * 刷新 Token
 */
export async function refreshToken(): Promise<ApiResponse<TokenData>> {
    const refresh_token = localStorage.getItem('refresh_token');
    return apiClient.post<any, ApiResponse<TokenData>>('/auth/refresh', null, {
        headers: {
            Authorization: `Bearer ${refresh_token}`,
        },
    });
}

/**
 * 获取当前用户信息
 */
export async function getMe(): Promise<ApiResponse<UserInfo>> {
    return apiClient.get<any, ApiResponse<UserInfo>>('/auth/me');
}

/**
 * 修改密码
 */
export async function changePassword(data: ChangePasswordRequest): Promise<ApiResponse<{ message: string }>> {
    return apiClient.put<any, ApiResponse<{ message: string }>>('/auth/password', data);
}

/**
 * 找回密码 - 发送验证码
 */
export async function sendPasswordResetCode(email: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post<any, ApiResponse<{ message: string }>>('/auth/password/send-code', { email });
}

/**
 * 找回密码 - 重置密码
 */
export async function resetPassword(data: ResetPasswordRequest): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post<any, ApiResponse<{ message: string }>>('/auth/password/reset', data);
}

/**
 * 更新用户信息
 */
export async function updateProfile(data: UpdateProfileRequest): Promise<ApiResponse<UserInfo>> {
    return apiClient.put<any, ApiResponse<UserInfo>>('/auth/profile', data);
}

/**
 * 上传用户头像
 */
export async function uploadAvatar(file: File): Promise<ApiResponse<{ avatar_url: string }>> {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post<any, ApiResponse<{ avatar_url: string }>>('/auth/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
}

/**
 * 获取订阅状态
 */
export async function getSubscription(): Promise<ApiResponse<SubscriptionStatusResponse>> {
    return apiClient.get<any, ApiResponse<SubscriptionStatusResponse>>('/auth/subscription');
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
