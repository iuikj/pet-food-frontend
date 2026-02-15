import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { BackgroundMode } from '@anuradev/capacitor-background-mode';
import { plansApi } from '../api';

const PlanGenerationContext = createContext();

export const usePlanGeneration = () => {
    const context = useContext(PlanGenerationContext);
    if (!context) {
        throw new Error('usePlanGeneration must be used within a PlanGenerationProvider');
    }
    return context;
};

export const PlanGenerationProvider = ({ children }) => {
    // Status: 'idle' | 'generating' | 'completed' | 'error'
    const [status, setStatus] = useState('idle');
    const [progress, setProgress] = useState(0);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [isBackgroundRunning, setIsBackgroundRunning] = useState(false);
    const [taskId, setTaskId] = useState(null);
    const [error, setError] = useState(null);
    const [result, setResult] = useState(null);
    const [currentNode, setCurrentNode] = useState(null);
    const [logs, setLogs] = useState([]);

    const abortControllerRef = useRef(null);

    // Steps definition
    const steps = [
        { title: "构建营养模型", description: "正在根据宠物的体重和健康状况，匹配最佳的微量元素配比..." },
        { title: "分析基因组学", description: "解析潜在代谢特征，调整宏量营养素比例..." },
        { title: "生成专属食谱", description: "正在计算每日最佳热量，并生成饮食计划..." }
    ];

    // 根据 node 名称映射到步骤
    const nodeToStepIndex = {
        'main_agent': 0,
        'sub_agent': 1,
        'write_agent': 2,
    };

    // Initialize permissions on mount
    useEffect(() => {
        const init = async () => {
            if (!Capacitor.isNativePlatform()) return;

            try {
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

    // 添加日志
    const addLog = useCallback((message) => {
        setLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), message }]);
    }, []);

    // 发送完成通知
    const sendCompletionNotification = useCallback(async () => {
        if (!Capacitor.isNativePlatform()) return;

        try {
            console.log('📨 Sending completion notification...');
            await LocalNotifications.schedule({
                notifications: [{
                    id: 1,
                    title: '🎉 专属计划已生成！',
                    body: '点击查看您宠物的营养计划',
                    extra: {
                        route: '/plan/summary',
                        type: 'completed'
                    },
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

    // 启用后台模式
    const enableBackgroundMode = useCallback(async () => {
        if (!Capacitor.isNativePlatform()) return;

        try {
            await BackgroundMode.setSettings({
                title: '正在生成专属计划',
                text: '任务进行中，请勿关闭应用',
                icon: 'ic_launcher',
                color: '8B5CF6',
                resume: true,
                hidden: false,
                silent: false
            });
            await BackgroundMode.enable();
            console.log('✅ Background mode enabled');
        } catch (e) {
            console.error('Failed to enable background mode:', e);
        }
    }, []);

    // 禁用后台模式
    const disableBackgroundMode = useCallback(async () => {
        if (!Capacitor.isNativePlatform()) return;

        try {
            await BackgroundMode.disable();
            console.log('✅ Background mode disabled');
        } catch (e) {
            console.error('Failed to disable background mode:', e);
        }
    }, []);

    // 处理 SSE 事件
    const handleSSEEvent = useCallback((data) => {
        console.log('📥 SSE Event:', data);

        switch (data.type) {
            case 'task_created':
                setTaskId(data.task_id);
                addLog('任务创建成功');
                break;

            case 'resumed':
                setTaskId(data.task_id);
                setProgress(data.progress || 0);
                setCurrentNode(data.current_node);
                addLog(`恢复任务: ${data.status}`);
                break;

            case 'node_started':
                setCurrentNode(data.node);
                const stepIdx = nodeToStepIndex[data.node] ?? currentStepIndex;
                setCurrentStepIndex(stepIdx);
                addLog(`开始: ${data.node}`);
                break;

            case 'node_completed':
                if (data.progress) {
                    setProgress(data.progress);
                }
                addLog(`完成: ${data.node}`);
                break;

            case 'tool_started':
                addLog(`调用工具: ${data.tool}`);
                break;

            case 'tool_completed':
                addLog(`工具完成: ${data.tool}`);
                break;

            case 'progress_update':
                if (data.progress) {
                    setProgress(data.progress);
                }
                break;

            case 'task_completed':
                setStatus('completed');
                setProgress(100);
                setCurrentStepIndex(steps.length - 1);
                setResult(data.result);
                addLog('🎉 计划生成完成！');
                sendCompletionNotification();
                disableBackgroundMode();
                break;

            case 'error':
                setStatus('error');
                setError(data.error || '生成失败');
                addLog(`❌ 错误: ${data.error}`);
                disableBackgroundMode();
                break;

            default:
                console.log('Unknown event type:', data.type);
        }
    }, [currentStepIndex, steps.length, addLog, sendCompletionNotification, disableBackgroundMode]);

    // 开始生成计划
    const startGeneration = useCallback(async (petData) => {
        if (status === 'generating') return;

        // 重置状态
        setStatus('generating');
        setProgress(0);
        setCurrentStepIndex(0);
        setError(null);
        setResult(null);
        setLogs([]);
        setTaskId(null);

        // 启用后台模式
        await enableBackgroundMode();

        addLog('开始生成饮食计划...');

        // 创建 AbortController
        abortControllerRef.current = new AbortController();

        try {
            // 使用 fetch 流式请求
            await plansApi.createPlanStreamFetch(
                petData,
                handleSSEEvent,
                (err) => {
                    console.error('SSE Error:', err);
                    setStatus('error');
                    setError(err.message || '连接失败');
                    addLog(`❌ 连接错误: ${err.message}`);
                    disableBackgroundMode();
                }
            );
        } catch (err) {
            console.error('Failed to start generation:', err);
            setStatus('error');
            setError(err.message || '启动失败');
            addLog(`❌ 启动错误: ${err.message}`);
            disableBackgroundMode();
        }
    }, [status, enableBackgroundMode, handleSSEEvent, addLog, disableBackgroundMode]);

    // 重置生成状态
    const resetGeneration = useCallback(async () => {
        setStatus('idle');
        setProgress(0);
        setCurrentStepIndex(0);
        setIsBackgroundRunning(false);
        setTaskId(null);
        setError(null);
        setResult(null);
        setLogs([]);
        setCurrentNode(null);

        // 取消正在进行的请求
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }

        // 禁用后台模式
        await disableBackgroundMode();

        // 取消待处理的通知
        try {
            await LocalNotifications.cancel({ notifications: [{ id: 1 }, { id: 100 }] });
        } catch (e) {
            console.log('Failed to cancel notification:', e);
        }
    }, [disableBackgroundMode]);

    // 恢复 SSE 连接
    const restoreFromBackground = useCallback(async () => {
        if (!taskId || status !== 'generating') return;

        addLog('正在恢复连接...');

        try {
            // 先查询任务状态
            const taskRes = await plansApi.getTask(taskId);
            if (taskRes.code === 0) {
                const task = taskRes.data;
                if (task.status === 'completed') {
                    setStatus('completed');
                    setProgress(100);
                    // 获取结果
                    const resultRes = await plansApi.getTaskResult(taskId);
                    if (resultRes.code === 0) {
                        setResult(resultRes.data);
                    }
                    addLog('任务已完成');
                } else if (task.status === 'failed') {
                    setStatus('error');
                    setError(task.error_message || '任务失败');
                    addLog('任务失败');
                } else {
                    // 任务仍在运行，可以尝试重连 SSE
                    setProgress(task.progress || progress);
                    addLog('任务仍在运行...');
                }
            }
        } catch (err) {
            console.error('Failed to restore:', err);
            addLog(`恢复失败: ${err.message}`);
        }
    }, [taskId, status, progress, addLog]);

    return (
        <PlanGenerationContext.Provider value={{
            status,
            progress,
            currentStepIndex,
            currentStep: steps[currentStepIndex],
            steps,
            isBackgroundRunning,
            taskId,
            error,
            result,
            currentNode,
            logs,
            startGeneration,
            resetGeneration,
            restoreFromBackground
        }}>
            {children}
        </PlanGenerationContext.Provider>
    );
};
