import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { authApi } from '../api';

const UserContext = createContext();

// 用户数据 hook
export const useUser = () => {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
};

export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // 初始化：检查 Token 并获取用户信息
    useEffect(() => {
        const initAuth = async () => {
            const token = localStorage.getItem('access_token');
            if (token) {
                try {
                    const res = await authApi.getMe();
                    if (res.code === 0) {
                        setUser(res.data);
                        setIsAuthenticated(true);
                    } else {
                        // Token 无效，清除
                        localStorage.removeItem('access_token');
                        localStorage.removeItem('refresh_token');
                    }
                } catch (error) {
                    console.error('Failed to fetch user:', error);
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('refresh_token');
                }
            }
            setIsLoading(false);
        };

        initAuth();
    }, []);

    // 登录
    const login = useCallback(async (email, password) => {
        const res = await authApi.login({ username: email, password });
        if (res.code === 0) {
            const { user: userData, tokens } = res.data;
            localStorage.setItem('access_token', tokens.access_token);
            localStorage.setItem('refresh_token', tokens.refresh_token);
            setUser(userData);
            setIsAuthenticated(true);
            return { success: true };
        }
        return { success: false, message: res.message };
    }, []);

    // 注册（直接注册）
    const register = useCallback(async (username, email, password) => {
        const res = await authApi.register({ username, email, password });
        if (res.code === 0) {
            const { user: userData, tokens } = res.data;
            localStorage.setItem('access_token', tokens.access_token);
            localStorage.setItem('refresh_token', tokens.refresh_token);
            setUser(userData);
            setIsAuthenticated(true);
            return { success: true };
        }
        return { success: false, message: res.message };
    }, []);

    // 验证码注册
    const verifyRegister = useCallback(async (email, code, username, password) => {
        const res = await authApi.verifyRegister({ email, code, username, password });
        if (res.code === 0) {
            const { user: userData, tokens } = res.data;
            localStorage.setItem('access_token', tokens.access_token);
            localStorage.setItem('refresh_token', tokens.refresh_token);
            setUser(userData);
            setIsAuthenticated(true);
            return { success: true };
        }
        return { success: false, message: res.message };
    }, []);

    // 发送验证码
    const sendCode = useCallback(async (email, codeType = 'register') => {
        const res = await authApi.sendCode({ email, code_type: codeType });
        return res.code === 0 ? { success: true } : { success: false, message: res.message };
    }, []);

    // 登出
    const logout = useCallback(() => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        setUser(null);
        setIsAuthenticated(false);
    }, []);

    // 刷新用户信息
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

    // 更新用户信息
    const updateUser = useCallback(async (updates) => {
        try {
            const res = await authApi.updateProfile(updates);
            if (res.code === 0) {
                setUser(res.data);
                return { success: true };
            }
            return { success: false, message: res.message };
        } catch (error) {
            console.error('Failed to update user:', error);
            return { success: false, message: '更新失败' };
        }
    }, []);

    // 更新头像
    const updateAvatar = useCallback(async (file) => {
        try {
            const res = await authApi.uploadAvatar(file);
            if (res.code === 0) {
                setUser(prev => ({ ...prev, avatar_url: res.data.avatar_url }));
                return { success: true, avatar_url: res.data.avatar_url };
            }
            return { success: false, message: res.message };
        } catch (error) {
            console.error('Failed to upload avatar:', error);
            return { success: false, message: '上传失败' };
        }
    }, []);

    // 修改密码
    const changePassword = useCallback(async (oldPassword, newPassword) => {
        try {
            const res = await authApi.changePassword({ old_password: oldPassword, new_password: newPassword });
            return res.code === 0 ? { success: true } : { success: false, message: res.message };
        } catch (error) {
            console.error('Failed to change password:', error);
            return { success: false, message: '修改失败' };
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
