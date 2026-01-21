import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
// 使用 BackgroundMode 保持应用后台存活
import { BackgroundMode } from '@anuradev/capacitor-background-mode';

const PlanGenerationContext = createContext();

export const usePlanGeneration = () => {
    const context = useContext(PlanGenerationContext);
    if (!context) {
        throw new Error('usePlanGeneration must be used within a PlanGenerationProvider');
    }
    return context;
};

export const PlanGenerationProvider = ({ children }) => {
    // Status: 'idle' | 'generating' | 'completed'
    const [status, setStatus] = useState('idle');
    const [progress, setProgress] = useState(0);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [isBackgroundRunning, setIsBackgroundRunning] = useState(false);
    const [taskId, setTaskId] = useState(null);

    // Total duration in ms (15 seconds)
    const DURATION = 15000;
    const STEPS_COUNT = 3;

    const startTimeRef = useRef(null);
    const timerRef = useRef(null);

    // Steps definition
    const steps = [
        { title: "构建营养模型", description: "正在根据 Cooper 的体重和过敏源，匹配最佳的微量元素配比..." },
        { title: "分析基因组学", description: "解析潜在代谢特征，调整宏量营养素比例..." },
        { title: "生成专属食谱", description: "正在计算每日最佳热量，并生成本周食谱..." }
    ];

    // Initialize permissions on mount
    useEffect(() => {
        const init = async () => {
            if (!Capacitor.isNativePlatform()) return;

            try {
                // 请求通知权限
                const permStatus = await LocalNotifications.checkPermissions();
                if (permStatus.display !== 'granted') {
                    await LocalNotifications.requestPermissions();
                }
                console.log('✅ Notification permissions ready');
            } catch (e) {
                console.log('Notifications not available:', e);
            }
        };

        init();
    }, []);

    // 监听应用状态变化
    useEffect(() => {
        if (!Capacitor.isNativePlatform()) return;

        let appStateListener;

        const setupListener = async () => {
            appStateListener = await CapacitorApp.addListener('appStateChange', async ({ isActive }) => {
                console.log(`📱 App state: ${isActive ? 'foreground' : 'background'}`);
                setIsBackgroundRunning(!isActive && status === 'generating');
            });
        };

        setupListener();

        return () => {
            if (appStateListener) appStateListener.remove();
        };
    }, [status]);

    /**
     * 发送完成通知
     */
    const sendCompletionNotification = useCallback(async () => {
        if (!Capacitor.isNativePlatform()) return;

        try {
            console.log('📨 Sending completion notification...');
            await LocalNotifications.schedule({
                notifications: [{
                    id: 1,
                    title: '🎉 专属计划已生成！',
                    body: '15秒任务完成，点击查看 Cooper 的营养计划',
                    extra: {
                        route: '/plan/summary',
                        type: 'completed'
                    },
                    // Android specific - 允许在 idle 模式下触发
                    schedule: {
                        allowWhileIdle: true
                    }
                }]
            });
            console.log('✅ Notification sent!');
        } catch (e) {
            console.error('Failed to send notification:', e);
        }
    }, []);

    /**
     * 启用后台模式 - 保持应用存活
     */
    const enableBackgroundMode = useCallback(async () => {
        if (!Capacitor.isNativePlatform()) return;

        try {
            // 配置后台模式
            await BackgroundMode.setSettings({
                title: '正在生成专属计划',
                text: '任务进行中，请勿关闭应用',
                icon: 'ic_launcher',
                color: '8B5CF6',
                resume: true,
                hidden: false,
                silent: false
            });

            // 启用后台模式
            await BackgroundMode.enable();
            console.log('✅ Background mode enabled');
        } catch (e) {
            console.error('Failed to enable background mode:', e);
        }
    }, []);

    /**
     * 禁用后台模式
     */
    const disableBackgroundMode = useCallback(async () => {
        if (!Capacitor.isNativePlatform()) return;

        try {
            await BackgroundMode.disable();
            console.log('✅ Background mode disabled');
        } catch (e) {
            console.error('Failed to disable background mode:', e);
        }
    }, []);

    const startGeneration = useCallback(async () => {
        if (status === 'generating') return;

        const newTaskId = `task_${Date.now()}`;
        setTaskId(newTaskId);
        setStatus('generating');
        setProgress(0);
        setCurrentStepIndex(0);
        startTimeRef.current = Date.now();

        // 🔑 启用后台模式保活
        await enableBackgroundMode();

        // Clear any existing timer
        if (timerRef.current) clearInterval(timerRef.current);

        // UI animation timer - 使用后台模式保持运行
        timerRef.current = setInterval(async () => {
            const elapsed = Date.now() - startTimeRef.current;
            const newProgress = Math.min((elapsed / DURATION) * 100, 100);

            setProgress(newProgress);

            const step = Math.min(Math.floor((newProgress / 100) * STEPS_COUNT), STEPS_COUNT - 1);
            setCurrentStepIndex(step);

            if (elapsed >= DURATION) {
                clearInterval(timerRef.current);
                timerRef.current = null;

                setStatus('completed');
                setProgress(100);
                setCurrentStepIndex(STEPS_COUNT - 1);
                setIsBackgroundRunning(false);

                // 发送完成通知
                await sendCompletionNotification();

                // 禁用后台模式
                await disableBackgroundMode();

                console.log('🎉 Task completed!');
            }
        }, 100);
    }, [status, DURATION, STEPS_COUNT, enableBackgroundMode, disableBackgroundMode, sendCompletionNotification]);

    const resetGeneration = useCallback(async () => {
        setStatus('idle');
        setProgress(0);
        setCurrentStepIndex(0);
        setIsBackgroundRunning(false);
        setTaskId(null);

        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }

        // 禁用后台模式
        await disableBackgroundMode();

        // Cancel any pending notifications
        try {
            await LocalNotifications.cancel({ notifications: [{ id: 1 }, { id: 100 }] });
        } catch (e) {
            console.log('Failed to cancel notification:', e);
        }
    }, [disableBackgroundMode]);

    // 从后台恢复
    const restoreFromBackground = useCallback(async () => {
        // 简单实现：检查任务是否应该完成
        if (status === 'generating' && startTimeRef.current) {
            const elapsed = Date.now() - startTimeRef.current;
            if (elapsed >= DURATION) {
                setStatus('completed');
                setProgress(100);
                setCurrentStepIndex(STEPS_COUNT - 1);
            }
        }
    }, [status, DURATION, STEPS_COUNT]);

    return (
        <PlanGenerationContext.Provider value={{
            status,
            progress,
            currentStepIndex,
            currentStep: steps[currentStepIndex],
            steps,
            isBackgroundRunning,
            taskId,
            startGeneration,
            resetGeneration,
            restoreFromBackground
        }}>
            {children}
        </PlanGenerationContext.Provider>
    );
};
