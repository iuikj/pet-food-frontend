import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { Keyboard } from '@capacitor/keyboard';
import { usePlanGeneration } from '../../hooks/usePlanGeneration';

export default function BottomNav() {
    const location = useLocation();
    const navigate = useNavigate();
    const { status } = usePlanGeneration();
    const [keyboardVisible, setKeyboardVisible] = useState(false);

    useEffect(() => {
        if (!Capacitor.isNativePlatform()) return;

        const showListener = Keyboard.addListener('keyboardWillShow', () => {
            setKeyboardVisible(true);
        });
        const hideListener = Keyboard.addListener('keyboardWillHide', () => {
            setKeyboardVisible(false);
        });

        return () => {
            showListener.then((h) => h.remove());
            hideListener.then((h) => h.remove());
        };
    }, []);

    // 改进的活跃状态判断逻辑,支持子路由
    const isActive = (path) => {
        // 首页需要精确匹配
        if (path === '/') {
            return location.pathname === '/';
        }
        // Plan创建页面需要精确或子路由匹配
        if (path === '/plan/create') {
            return location.pathname === '/plan/create' ||
                location.pathname.startsWith('/plan/') ||
                location.pathname === '/planning';
        }
        // 其他路径使用 startsWith 来支持子路由
        return location.pathname.startsWith(path);
    };

    // FAB 按钮点击处理 - 根据任务状态智能导航
    const handleFabClick = (e) => {
        e.preventDefault();

        if (status === 'generating') {
            // 任务进行中，导航到 loading 页面
            navigate('/planning');
        } else if (status === 'completed') {
            // 任务已完成，导航到计划摘要页面
            navigate('/plan/summary');
        } else {
            // 空闲状态，导航到创建计划页面
            navigate('/plan/create');
        }
    };

    const navItems = [
        { name: '主页', icon: 'home', path: '/' },
        { name: '日历', icon: 'calendar_today', path: '/calendar' },
        { name: '规划', icon: 'menu_book', path: '/plan/create', isFab: true },
        { name: '食谱', icon: 'restaurant_menu', path: '/recipes' },
        { name: '我的', icon: 'person', path: '/profile' },
    ];

    // 获取 FAB 图标 - 根据任务状态显示不同图标
    const getFabIcon = () => {
        if (status === 'generating') {
            return 'sync'; // 正在生成
        } else if (status === 'completed') {
            return 'check_circle'; // 已完成
        }
        return 'menu_book'; // 默认
    };

    if (keyboardVisible) return null;

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-surface-dark/90 backdrop-blur-lg border-t border-gray-100 dark:border-gray-800 pb-safe pt-2 px-6 pb-6 rounded-t-3xl shadow-[0_-5px_20px_rgba(0,0,0,0.03)] z-50">
            <div className="flex justify-between items-center">
                {navItems.map((item) => {
                    if (item.isFab) {
                        return (
                            <button
                                key={item.name}
                                onClick={handleFabClick}
                                aria-label={status === 'generating' ? '正在生成计划' : status === 'completed' ? '查看已完成计划' : '创建饮食计划'}
                                className={`relative -top-6 w-14 h-14 rounded-full shadow-sm flex items-center justify-center transform transition-all hover:scale-105 active:scale-95 cursor-pointer ${status === 'generating'
                                        ? 'bg-secondary animate-pulse'
                                        : status === 'completed'
                                            ? 'bg-green-500'
                                            : isActive(item.path)
                                                ? 'bg-primary shadow-glow'
                                                : 'bg-gray-800 dark:bg-gray-700'
                                    } text-white`}
                            >
                                <span className={`material-icons-round text-2xl ${status === 'generating' ? 'animate-spin' : ''}`}>
                                    {getFabIcon()}
                                </span>
                            </button>
                        );
                    }
                    return (
                        <Link
                            key={item.name}
                            to={item.path}
                            aria-label={item.name}
                            className={`flex flex-col items-center gap-1 w-12 transition-colors ${isActive(item.path)
                                ? 'text-primary'
                                : 'text-text-muted-light dark:text-text-muted-dark hover:text-primary'
                                }`}
                        >
                            <span className="material-icons-round">{item.icon}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
