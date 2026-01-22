import React, { createContext, useContext, useState, useCallback } from 'react';

const UserContext = createContext();

// 用户数据 hook
export const useUser = () => {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
};

// 示例用户数据
const initialUser = {
    id: 'user_1',
    name: 'Alex Chen',
    email: 'alex.chen@example.com',
    phone: '',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80',
    isPro: true
};

export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(initialUser);

    // 更新用户信息
    const updateUser = useCallback((updates) => {
        setUser(prev => ({ ...prev, ...updates }));
    }, []);

    // 更新头像
    const updateAvatar = useCallback((avatarUrl) => {
        setUser(prev => ({ ...prev, avatar: avatarUrl }));
    }, []);

    return (
        <UserContext.Provider value={{
            user,
            updateUser,
            updateAvatar
        }}>
            {children}
        </UserContext.Provider>
    );
};

export default UserContext;
