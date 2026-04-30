import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { authApi } from '../api';
import { getApiErrorMessage } from '../api/client';
import { initMockMode } from '../mock/mockMode';
import UserContext from './UserContextValue';
import { clearAuthTokens, getAccessToken, setAuthTokens } from '../utils/storage';

const normalizeEmail = (value = '') => value.trim().toLowerCase();
const normalizeUsername = (value = '') => value.trim();
const normalizeLoginIdentity = (value = '') => {
    const normalized = value.trim();
    return normalized.includes('@') ? normalized.toLowerCase() : normalized;
};

export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    const applyAuthSuccess = useCallback((authData) => {
        const { user: userData, tokens } = authData;
        setAuthTokens(tokens);
        setUser(userData);
        setIsAuthenticated(true);
    }, []);

    useEffect(() => {
        const initAuth = async () => {
            await initMockMode();

            const token = getAccessToken();
            if (token) {
                try {
                    const res = await authApi.getMe();
                    if (res.code === 0) {
                        setUser(res.data);
                        setIsAuthenticated(true);
                    } else {
                        clearAuthTokens();
                    }
                } catch (error) {
                    console.error('Failed to fetch user:', error);
                    clearAuthTokens();
                }
            }

            setIsLoading(false);
        };

        initAuth();
    }, []);

    const login = useCallback(async (email, password) => {
        try {
            const res = await authApi.login({ username: normalizeLoginIdentity(email), password });
            if (res.code === 0) {
                applyAuthSuccess(res.data);
                return { success: true };
            }
            const errorMsg = res.message?.trim() || '登录失败，请检查用户名/邮箱和密码';
            return { success: false, message: errorMsg };
        } catch (error) {
            console.error('Failed to login:', error);
            return { success: false, message: getApiErrorMessage(error, '登录失败，请检查用户名/邮箱和密码') };
        }
    }, [applyAuthSuccess]);

    const register = useCallback(async (username, email, password) => {
        try {
            const res = await authApi.register({
                username: normalizeUsername(username),
                email: normalizeEmail(email),
                password,
            });
            if (res.code === 0) {
                applyAuthSuccess(res.data);
                return { success: true };
            }
            return { success: false, message: res.message || '注册失败' };
        } catch (error) {
            console.error('Failed to register:', error);
            return { success: false, message: getApiErrorMessage(error, '注册失败') };
        }
    }, [applyAuthSuccess]);

    const verifyRegister = useCallback(async (email, code, username, password) => {
        try {
            const res = await authApi.verifyRegister({
                email: normalizeEmail(email),
                code: code.trim(),
                username: normalizeUsername(username),
                password,
            });
            if (res.code === 0) {
                applyAuthSuccess(res.data);
                return { success: true };
            }
            return { success: false, message: res.message || '注册失败' };
        } catch (error) {
            console.error('Failed to verify register:', error);
            return { success: false, message: getApiErrorMessage(error, '注册失败') };
        }
    }, [applyAuthSuccess]);

    const sendCode = useCallback(async (email, codeType = 'register') => {
        try {
            const res = await authApi.sendCode({ email: normalizeEmail(email), code_type: codeType });
            return res.code === 0
                ? { success: true, message: res.message || res.data?.message || '验证码已发送' }
                : { success: false, message: res.message || '发送验证码失败' };
        } catch (error) {
            console.error('Failed to send code:', error);
            return { success: false, message: getApiErrorMessage(error, '发送验证码失败') };
        }
    }, []);

    const sendPasswordResetCode = useCallback(async (email) => {
        try {
            const res = await authApi.sendPasswordResetCode(normalizeEmail(email));
            return res.code === 0
                ? { success: true, message: res.message || res.data?.message || '重置验证码已发送' }
                : { success: false, message: res.message || '发送重置验证码失败' };
        } catch (error) {
            console.error('Failed to send password reset code:', error);
            return { success: false, message: getApiErrorMessage(error, '发送重置验证码失败') };
        }
    }, []);

    const resetPassword = useCallback(async (email, code, newPassword) => {
        try {
            const res = await authApi.resetPassword({
                email: normalizeEmail(email),
                code: code.trim(),
                new_password: newPassword,
            });
            return res.code === 0
                ? { success: true, message: res.message || res.data?.message || '密码重置成功' }
                : { success: false, message: res.message || '密码重置失败' };
        } catch (error) {
            console.error('Failed to reset password:', error);
            return { success: false, message: getApiErrorMessage(error, '密码重置失败') };
        }
    }, []);

    const logout = useCallback(() => {
        clearAuthTokens();
        setUser(null);
        setIsAuthenticated(false);
    }, []);

    const refreshUser = useCallback(async () => {
        try {
            const res = await authApi.getMe();
            if (res.code === 0) {
                setUser(res.data);
                return { success: true };
            }
        } catch (error) {
            console.error('Failed to refresh user:', error);
        }
        return { success: false };
    }, []);

    const updateUser = useCallback(async (updates) => {
        try {
            const res = await authApi.updateProfile(updates);
            if (res.code === 0) {
                setUser((prev) => (prev ? { ...prev, ...res.data } : res.data));
                return { success: true };
            }
            return { success: false, message: res.message };
        } catch (error) {
            console.error('Failed to update user:', error);
            return { success: false, message: getApiErrorMessage(error, '更新资料失败') };
        }
    }, []);

    const updateAvatar = useCallback(async (file) => {
        try {
            const res = await authApi.uploadAvatar(file);
            if (res.code === 0) {
                setUser((prev) => ({ ...prev, avatar_url: res.data.avatar_url }));
                return { success: true, avatar_url: res.data.avatar_url };
            }
            return { success: false, message: res.message };
        } catch (error) {
            console.error('Failed to upload avatar:', error);
            return { success: false, message: getApiErrorMessage(error, '上传头像失败') };
        }
    }, []);

    const changePassword = useCallback(async (oldPassword, newPassword) => {
        try {
            const res = await authApi.changePassword({ old_password: oldPassword, new_password: newPassword });
            return res.code === 0 ? { success: true } : { success: false, message: res.message };
        } catch (error) {
            console.error('Failed to change password:', error);
            return { success: false, message: getApiErrorMessage(error, '修改密码失败') };
        }
    }, []);

    const contextValue = useMemo(() => ({
        user,
        isLoading,
        isAuthenticated,
        login,
        register,
        verifyRegister,
        sendCode,
        sendPasswordResetCode,
        resetPassword,
        logout,
        refreshUser,
        updateUser,
        updateAvatar,
        changePassword,
    }), [
        user,
        isLoading,
        isAuthenticated,
        login,
        register,
        verifyRegister,
        sendCode,
        sendPasswordResetCode,
        resetPassword,
        logout,
        refreshUser,
        updateUser,
        updateAvatar,
        changePassword,
    ]);

    return (
        <UserContext.Provider value={contextValue}>
            {children}
        </UserContext.Provider>
    );
};

export default UserContext;
