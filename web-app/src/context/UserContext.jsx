import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { authApi } from '../api';
import { getApiErrorMessage } from '../api/client';
import { initMockMode } from '../mock/mockMode';
import UserContext from './UserContextValue';
import { clearAuthTokens, getAccessToken, setAuthTokens } from '../utils/storage';

export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

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
        const res = await authApi.login({ username: email, password });
        if (res.code === 0) {
            const { user: userData, tokens } = res.data;
            setAuthTokens(tokens);
            setUser(userData);
            setIsAuthenticated(true);
            return { success: true };
        }
        return { success: false, message: res.message };
    }, []);

    const register = useCallback(async (username, email, password) => {
        const res = await authApi.register({ username, email, password });
        if (res.code === 0) {
            const { user: userData, tokens } = res.data;
            setAuthTokens(tokens);
            setUser(userData);
            setIsAuthenticated(true);
            return { success: true };
        }
        return { success: false, message: res.message };
    }, []);

    const verifyRegister = useCallback(async (email, code, username, password) => {
        const res = await authApi.verifyRegister({ email, code, username, password });
        if (res.code === 0) {
            const { user: userData, tokens } = res.data;
            setAuthTokens(tokens);
            setUser(userData);
            setIsAuthenticated(true);
            return { success: true };
        }
        return { success: false, message: res.message };
    }, []);

    const sendCode = useCallback(async (email, codeType = 'register') => {
        const res = await authApi.sendCode({ email, code_type: codeType });
        return res.code === 0 ? { success: true } : { success: false, message: res.message };
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
        logout,
        refreshUser,
        updateUser,
        updateAvatar,
        changePassword,
    }), [user, isLoading, isAuthenticated, login, register, verifyRegister, sendCode, logout, refreshUser, updateUser, updateAvatar, changePassword]);

    return (
        <UserContext.Provider value={contextValue}>
            {children}
        </UserContext.Provider>
    );
};

export default UserContext;
