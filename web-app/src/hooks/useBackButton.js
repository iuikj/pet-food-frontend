import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { Toast } from '@capacitor/toast';

export function useBackButton() {
    const navigate = useNavigate();
    const location = useLocation();
    const lastBackPress = useRef(0);

    useEffect(() => {
        // 只在原生平台执行
        if (!Capacitor.isNativePlatform()) {
            return;
        }

        const handler = CapacitorApp.addListener('backButton', ({ canGoBack }) => {
            const currentPath = location.pathname;

            // 主页：双击退出
            if (currentPath === '/') {
                const now = Date.now();
                if (now - lastBackPress.current < 2000) {
                    // 2秒内第二次按返回，退出应用
                    CapacitorApp.exitApp();
                } else {
                    // 第一次按返回，提示用户
                    lastBackPress.current = now;
                    Toast.show({
                        text: '再按一次退出应用',
                        duration: 'short',
                        position: 'bottom'
                    });
                }
                return;
            }

            // 添加宠物多步骤流程的返回
            if (currentPath.startsWith('/onboarding/')) {
                if (currentPath === '/onboarding/step1') {
                    navigate('/');
                } else if (currentPath === '/onboarding/step2') {
                    navigate('/onboarding/step1');
                } else if (currentPath === '/onboarding/step3') {
                    navigate('/onboarding/step2');
                }
                return;
            }

            // Loading页面禁用返回
            if (currentPath === '/planning') {
                return;
            }

            // 计划详情页返回到摘要页
            if (currentPath === '/plan/details') {
                navigate('/plan/summary');
                return;
            }

            // 其他页面：使用 React Router 返回
            if (canGoBack) {
                navigate(-1);
            } else {
                // 如果没有历史记录，返回主页
                navigate('/');
            }
        });

        return () => {
            handler.remove();
        };
    }, [navigate, location]);
}
