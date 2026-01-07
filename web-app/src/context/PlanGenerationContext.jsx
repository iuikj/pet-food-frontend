import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import { LocalNotifications } from '@capacitor/local-notifications';
import { BackgroundRunner } from '@capacitor/background-runner';

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

    // Initialize notification permissions on mount
    useEffect(() => {
        const initNotifications = async () => {
            try {
                const permStatus = await LocalNotifications.requestPermissions();
                console.log('Local Notifications permission:', permStatus);
            } catch (e) {
                console.log('Local Notifications not available', e);
            }
        };

        initNotifications();
    }, []);

    const startGeneration = async () => {
        if (status === 'generating') return;

        setStatus('generating');
        setProgress(0);
        setCurrentStepIndex(0);
        startTimeRef.current = Date.now();

        // 🔑 Dispatch background runner event
        try {
            console.log('🚀 Dispatching background runner event');
            await BackgroundRunner.dispatchEvent({
                label: 'planGeneration',
                event: 'generatePlan',
                details: {
                    duration: DURATION,
                    startTime: startTimeRef.current
                }
            });
            console.log('✅ Background runner dispatched successfully');
        } catch (e) {
            console.error('❌ Failed to dispatch background runner:', e);
        }

        // Clear any existing timer
        if (timerRef.current) clearInterval(timerRef.current);

        // UI animation timer (only runs when app is in foreground)
        timerRef.current = setInterval(() => {
            const elapsed = Date.now() - startTimeRef.current;
            const newProgress = Math.min((elapsed / DURATION) * 100, 100);

            setProgress(newProgress);

            const step = Math.min(Math.floor((newProgress / 100) * STEPS_COUNT), STEPS_COUNT - 1);
            setCurrentStepIndex(step);

            if (elapsed >= DURATION) {
                clearInterval(timerRef.current);
                setStatus('completed');
                setProgress(100);
                setCurrentStepIndex(STEPS_COUNT - 1);
            }
        }, 100);
    };

    const resetGeneration = async () => {
        setStatus('idle');
        setProgress(0);
        setCurrentStepIndex(0);
        if (timerRef.current) clearInterval(timerRef.current);

        // Cancel any pending notifications
        try {
            await LocalNotifications.cancel({ notifications: [{ id: 1 }] });
        } catch (e) {
            console.log('Failed to cancel notification:', e);
        }
    };

    return (
        <PlanGenerationContext.Provider value={{
            status,
            progress,
            currentStepIndex,
            currentStep: steps[currentStepIndex],
            steps,
            startGeneration,
            resetGeneration
        }}>
            {children}
        </PlanGenerationContext.Provider>
    );
};
