import axios from 'axios';
import { clearAuthTokens, getAccessToken, getRefreshToken, setAuthTokens } from '../utils/storage';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
});

export function getApiErrorMessage(error, fallback = '请求失败') {
    if (axios.isAxiosError(error)) {
        // 网络超时
        if (error.code === 'ECONNABORTED' && error.message?.includes('timeout')) {
            return '请求超时，请检查网络连接';
        }

        // 网络断开
        if (error.code === 'ERR_NETWORK' || !navigator.onLine) {
            return '网络连接已断开，请检查网络设置';
        }

        // 服务器无响应
        if (!error.response) {
            return '无法连接到服务器，请稍后重试';
        }

        const payload = error.response?.data;

        if (typeof payload?.message === 'string' && payload.message.trim()) {
            return payload.message;
        }

        if (payload?.message && typeof payload.message === 'object') {
            const nestedMessage = typeof payload.message.message === 'string' ? payload.message.message.trim() : '';
            const nestedDetail = typeof payload.message.detail === 'string' ? payload.message.detail.trim() : '';

            if (nestedMessage && nestedDetail && nestedDetail !== nestedMessage) {
                return `${nestedMessage}：${nestedDetail}`;
            }

            if (nestedMessage) {
                return nestedMessage;
            }

            if (nestedDetail) {
                return nestedDetail;
            }
        }

        if (typeof payload?.detail === 'string' && payload.detail.trim()) {
            return payload.detail;
        }

        if (Array.isArray(payload?.detail) && payload.detail.length > 0) {
            const firstError = payload.detail[0];

            if (typeof firstError?.msg === 'string' && firstError.msg.trim()) {
                return firstError.msg;
            }

            if (typeof firstError?.message === 'string' && firstError.message.trim()) {
                return firstError.message;
            }
        }

        if (typeof error.message === 'string' && error.message.trim()) {
            return error.message;
        }
    }

    if (error instanceof Error && error.message.trim()) {
        return error.message;
    }

    return fallback;
}

apiClient.interceptors.request.use((config) => {
    const token = getAccessToken();
    if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

async function refreshAccessToken() {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
        throw new Error('No refresh token');
    }

    const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
        refresh_token: refreshToken,
    });

    const { access_token, refresh_token } = response.data.data;
    setAuthTokens({ access_token, refresh_token });

    return access_token;
}

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach((promiseHandlers) => {
        if (error) {
            promiseHandlers.reject(error);
        } else {
            promiseHandlers.resolve(token);
        }
    });
    failedQueue = [];
};

apiClient.interceptors.response.use(
    (response) => response.data,
    async (error) => {
        const originalRequest = error.config;

        // 登录/注册接口的 401 不触发刷新逻辑
        const isAuthEndpoint = originalRequest.url?.includes('/auth/login') ||
                               originalRequest.url?.includes('/auth/register') ||
                               originalRequest.url?.includes('/auth/verify-register');

        if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then((token) => {
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    return apiClient(originalRequest);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const newToken = await refreshAccessToken();
                processQueue(null, newToken);
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                return apiClient(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError, null);
                clearAuthTokens();
                window.location.href = '/login';
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default apiClient;
