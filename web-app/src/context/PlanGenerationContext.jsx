import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { BackgroundMode } from '@anuradev/capacitor-background-mode';
import { plansApi } from '../api';
// 直接导入真实/mock API，绕过 Proxy，用于锁定生成期间的调用模式
import realPlansApi from '../api/plans';
import { mockPlansApi } from '../mock';
import { isMockMode } from '../mock/mockMode';
import { transformCompletedEventToResult, transformPetDietPlan } from '../models/dietPlan';

const PlanGenerationContext = createContext();

// 周状态初始值（常量，定义在组件外避免重复创建）
const INITIAL_WEEK_STATUSES = {
    1: { status: 'pending', label: '等待中' },
    2: { status: 'pending', label: '等待中' },
    3: { status: 'pending', label: '等待中' },
    4: { status: 'pending', label: '等待中' },
};

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
    // 生成完成后由后端返回的 plan_id，用于保存/应用
    const [planId, setPlanId] = useState(null);

    // 周状态追踪: pending → planning → searching → writing → completed
    const [weekStatuses, setWeekStatuses] = useState(INITIAL_WEEK_STATUSES);

    const abortControllerRef = useRef(null);

    // 锁定生成期间的 API 模式：生成开始时快照 isMockMode()，
    // 整个生成+轮询过程中始终使用同一套 API，避免中途被 Proxy 路由到 mock
    const lockedApiRef = useRef(realPlansApi);

    // Refs — 在闭包/事件监听器中稳定访问最新状态（避免 stale closure）
    const statusRef = useRef(status);
    const taskIdRef = useRef(taskId);
    const pollingRef = useRef(null);

    // 同步 refs
    useEffect(() => { statusRef.current = status; }, [status]);
    useEffect(() => { taskIdRef.current = taskId; }, [taskId]);

    // 组件卸载时清理轮询
    useEffect(() => {
        return () => {
            if (pollingRef.current) {
                clearInterval(pollingRef.current);
            }
        };
    }, []);

    // Steps definition — V1 三阶段架构
    const steps = [
        { title: "调研分析", description: "正在分析宠物的营养需求，收集食材和健康数据..." },
        { title: "制定食谱", description: "四周饮食计划正在并行制定中，每周差异化营养搭配..." },
        { title: "生成报告", description: "正在将饮食计划结构化，生成完整的月度营养报告..." }
    ];

    // V1 事件类型 → 步骤索引映射
    const eventTypeToStepIndex = {
        // Phase 1: 研究阶段 → 步骤 0
        'research_starting': 0,
        'plan_created': 0,
        'plan_updated': 0,
        'task_delegating': 0,
        'research_task_delegating': 0,
        'research_finalizing': 0,
        // Phase 2: 周计划阶段 → 步骤 1
        'dispatching': 1,
        'week_planning': 1,
        'week_searching': 1,
        'week_plan_ready': 1,
        'week_writing': 1,
        'week_completed': 1,
        // Phase 3: 汇总阶段 → 步骤 2
        'gathering': 2,
        'structuring': 2,
        'structured': 2,
        'completed': 2,
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

    // 注意：监听应用状态变化的 useEffect 已移至 restoreFromBackground 定义之后（避免 TDZ 错误）

    // 添加日志
    const addLog = useCallback((message) => {
        setLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), message }]);
    }, []);

    // 从 SSE 事件中提取周号
    // 优先级: data.node("week_agent_N") → data.task_name("第N周") → data.detail.week
    const extractWeekNumber = useCallback((data) => {
        if (data.node) {
            const match = data.node.match(/week_agent_(\d+)/);
            if (match) return parseInt(match[1], 10);
        }
        if (data.task_name) {
            const match = data.task_name.match(/第(\d+)周/);
            if (match) return parseInt(match[1], 10);
        }
        if (data.detail?.week) {
            return data.detail.week;
        }
        return null;
    }, []);

    // 更新指定周的状态
    const updateWeekStatus = useCallback((weekNum, status, label) => {
        if (weekNum < 1 || weekNum > 4) return;
        setWeekStatuses(prev => ({
            ...prev,
            [weekNum]: { status, label },
        }));
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

    // ── 轮询降级恢复机制 ──
    // 当 SSE 流因后台/网络原因断开时，通过 REST 轮询获取任务状态

    // 停止轮询
    const stopPolling = useCallback(() => {
        if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
        }
    }, []);

    // 启动轮询 — SSE 断开后的降级恢复策略
    const startPolling = useCallback(() => {
        if (pollingRef.current) return; // 避免重复启动

        const poll = async () => {
            const currentTaskId = taskIdRef.current;
            // 如果没有 taskId 或已不在生成中，停止轮询
            if (!currentTaskId || statusRef.current !== 'generating') {
                stopPolling();
                return;
            }

            try {
                // 使用锁定的 API（绕过 Proxy），确保轮询始终命中启动时的同一套 API
                const api = lockedApiRef.current;
                const taskRes = await api.getTask(currentTaskId);
                if (taskRes.code !== 0) return;

                const task = taskRes.data;
                if (task.progress) setProgress(task.progress);

                if (task.status === 'completed') {
                    stopPolling();
                    setStatus('completed');
                    setProgress(100);
                    const resultRes = await api.getTaskResult(currentTaskId);
                    if (resultRes.code === 0) {
                        const transformed = transformPetDietPlan(resultRes.data);
                        if (transformed) setResult(transformed);
                    }
                    addLog('🎉 计划生成完成！');
                    sendCompletionNotification();
                    disableBackgroundMode();
                } else if (task.status === 'failed') {
                    stopPolling();
                    setStatus('error');
                    setError(task.error_message || '任务失败');
                    addLog(`❌ 任务失败: ${task.error_message}`);
                    disableBackgroundMode();
                }
                // 'running' / 'pending' → 继续轮询
            } catch (err) {
                console.error('Polling error:', err);
            }
        };

        // 立即执行一次，然后每 3 秒轮询
        poll();
        pollingRef.current = setInterval(poll, 3000);
    }, [stopPolling, addLog, sendCompletionNotification, disableBackgroundMode]);

    // 处理 SSE 事件 — V1 事件流适配
    const handleSSEEvent = useCallback((data) => {
        console.log('📥 SSE Event:', data);

        const eventType = data.type;

        // 1. 任务生命周期事件（由 plan_service 发送）
        switch (eventType) {
            case 'task_created':
                setTaskId(data.task_id);
                addLog('任务创建成功');
                return;

            case 'task_completed':
                // task_completed 有三种来源：
                // 1. Agent 子任务完成（带 node/task_name，无 plan_id）— 仅日志
                // 2. API 层最终确认（plan_service 发出，带 plan_id）— 提取 plan_id + 标记完成
                // 3. 断线重连恢复（带 result 完整数据）— 提取数据
                //
                // 注意：真正的计划数据由 type='completed'（Agent gather 节点）携带，
                //       此处主要处理 plan_id 提取和状态确认。

                if (!data.plan_id && (data.node || data.task_name)) {
                    // Agent 子任务完成 — 仅记录日志，不改变整体状态
                    addLog(`子任务完成: ${data.task_name || data.node}`);
                    return;
                }

                // API 层最终确认 或 断线重连
                stopPolling();
                setStatus('completed');
                setProgress(100);
                setCurrentStepIndex(steps.length - 1);

                // 提取 plan_id
                if (data.plan_id) {
                    setPlanId(data.plan_id);
                } else if (data.result?.id) {
                    setPlanId(data.result.id);
                }

                // 断线重连场景：task_completed 自带 result
                if (data.result) {
                    const planData = data.result.plan_data || data.result;
                    const transformed = transformPetDietPlan(planData);
                    if (transformed) setResult(transformed);
                } else {
                    // 正常 SSE 流：result 已由 type='completed' 事件设置
                    // 仅在无数据时兜底通过 API 获取
                    setResult(prev => {
                        if (prev) return prev; // 已有数据，不覆盖
                        if (taskIdRef.current) {
                            const api = lockedApiRef.current;
                            api.getTaskResult(taskIdRef.current).then(res => {
                                if (res.code === 0) {
                                    const planData = res.data?.plan_data || res.data;
                                    const t = transformPetDietPlan(planData);
                                    if (t) setResult(t);
                                }
                            }).catch(err => {
                                console.error('Failed to fetch task result:', err);
                            });
                        }
                        return prev;
                    });
                }
                addLog('🎉 计划生成完成！');
                sendCompletionNotification();
                disableBackgroundMode();
                return;

            case 'final_result': {
                const transformed = transformPetDietPlan(data.data);
                if (transformed) setResult(transformed);
                addLog('收到最终报告数据');
                return;
            }

            case 'done':
                // 流结束标记
                return;

            case 'error':
                stopPolling();
                setStatus('error');
                setError(data.error || '生成失败');
                addLog(`❌ 错误: ${data.error}`);
                disableBackgroundMode();
                return;

            case 'node_completed':
                // updates 模式的节点完成事件，用于累积状态
                if (data.progress) {
                    setProgress(data.progress);
                }
                return;

            default:
                break;
        }

        // 2. V1 ProgressEvent 事件（由 agent emit_progress 发送）

        // 2a. 特殊处理 completed 事件 — Agent gather 节点发出，带 detail.plans 饮食计划数据
        // 这是真正的"计划生成完成"信号（早于 task_completed）
        if (eventType === 'completed' && data.detail?.plans) {
            try {
                const transformed = transformCompletedEventToResult(data.detail, data.message);
                setResult(transformed);
                setStatus('completed');
                setProgress(100);
                setCurrentStepIndex(steps.length - 1);
                addLog('收到完整饮食计划数据');
                console.log('📦 Transformed plan result:', transformed);
                sendCompletionNotification();
                disableBackgroundMode();
            } catch (err) {
                console.error('Failed to transform completed event:', err);
                addLog(`数据转换失败: ${err.message}`);
            }
        }

        // 2b. 周事件处理 — 更新 weekStatuses
        const weekEventMap = {
            'week_planning': { status: 'planning', label: '规划中' },
            'week_searching': { status: 'searching', label: '搜索中' },
            'week_plan_ready': { status: 'writing', label: '撰写中' },
            'week_writing': { status: 'writing', label: '撰写中' },
            'week_completed': { status: 'completed', label: '已完成' },
        };
        const weekAction = weekEventMap[eventType];
        if (weekAction) {
            const weekNum = extractWeekNumber(data);
            if (weekNum) {
                updateWeekStatus(weekNum, weekAction.status, weekAction.label);
            }
        }

        // 更新步骤
        const stepIdx = eventTypeToStepIndex[eventType];
        if (stepIdx !== undefined) {
            setCurrentStepIndex(stepIdx);
        }

        // 更新进度
        if (data.progress !== undefined && data.progress !== null) {
            setProgress(data.progress);
        }

        // 更新节点
        if (data.node) {
            setCurrentNode(data.node);
        }

        // 添加日志（使用 message 字段）
        const logMessage = data.message || data.task_name || eventType;
        addLog(logMessage);

    }, [steps.length, addLog, stopPolling, sendCompletionNotification, disableBackgroundMode, extractWeekNumber, updateWeekStatus]);

    // 开始生成计划 — 接收宠物对象，优先传 pet_id
    const startGeneration = useCallback(async (petData) => {
        if (status === 'generating') return;

        // 锁定本次生成使用的 API 模式：
        // 快照当前 isMockMode()，整个生成+轮询过程中始终使用同一套 API
        const useMock = isMockMode();
        lockedApiRef.current = useMock ? mockPlansApi : realPlansApi;
        console.log(`[PlanGeneration] API mode locked: ${useMock ? 'MOCK' : 'REAL'}`);

        // 重置状态
        setStatus('generating');
        setProgress(0);
        setCurrentStepIndex(0);
        setError(null);
        setResult(null);
        setLogs([]);
        setTaskId(null);
        setPlanId(null);
        setWeekStatuses(INITIAL_WEEK_STATUSES);

        // 启用后台模式
        await enableBackgroundMode();

        addLog(`开始生成饮食计划...${useMock ? '（演示模式）' : ''}`);

        // 创建 AbortController
        abortControllerRef.current = new AbortController();

        // 构造请求体 — 优先使用 pet_id
        let requestData;
        if (petData?.id) {
            requestData = { pet_id: petData.id };
        } else if (petData) {
            requestData = {
                pet_type: petData.type || petData.pet_type,
                pet_breed: petData.breed || petData.pet_breed,
                pet_age: petData.age || petData.pet_age,
                pet_weight: petData.weight || petData.pet_weight,
                health_status: petData.health_status,
            };
        } else {
            setStatus('error');
            setError('缺少宠物信息');
            addLog('❌ 未提供宠物信息');
            disableBackgroundMode();
            return;
        }

        try {
            // 使用锁定的 API 发起流式请求（确保不被 Proxy 中途切换）
            const api = lockedApiRef.current;
            await api.createPlanStreamFetch(
                requestData,
                handleSSEEvent,
                // onError: 仅记录日志，不直接设置错误状态
                // 真正的恢复决策在 fetch 结束后统一进行
                (err) => {
                    console.error('SSE connection error:', err);
                    addLog(`⚠️ 连接异常: ${err.message}`);
                }
            );
        } catch (err) {
            console.error('Unexpected stream error:', err);
            addLog(`⚠️ 流式请求异常: ${err.message}`);
        }

        // ── 流式请求已结束（正常完成 / 异常断开），统一检查状态 ──
        if (statusRef.current === 'generating' && taskIdRef.current) {
            // SSE 流结束但任务未完成 — 先尝试 SSE 重连，失败再降级轮询
            // 典型场景：iOS 后台杀连接、网络切换、服务端超时
            addLog('流式连接断开，尝试 SSE 重连...');
            try {
                const api = lockedApiRef.current;
                await api.resumePlanStreamFetch(
                    taskIdRef.current,
                    handleSSEEvent,
                    (err) => {
                        console.error('SSE resume error:', err);
                    }
                );
            } catch (err) {
                console.error('SSE resume failed:', err);
            }

            // 重连结束后再次检查状态 — 仍在 generating 则降级轮询
            if (statusRef.current === 'generating') {
                addLog('SSE 重连结束，启动轮询恢复...');
                startPolling();
            }
        } else if (statusRef.current === 'generating') {
            // 没有 taskId — 真正的启动失败（HTTP 错误 / 认证失败）
            setStatus('error');
            setError('连接失败，未能创建任务');
            addLog('❌ 连接失败：未获取到任务 ID');
            disableBackgroundMode();
        }
    }, [status, enableBackgroundMode, handleSSEEvent, addLog, disableBackgroundMode, startPolling]);

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
        setPlanId(null);
        setWeekStatuses(INITIAL_WEEK_STATUSES);

        // 停止轮询
        stopPolling();

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
    }, [disableBackgroundMode, stopPolling]);

    // 恢复任务状态 — 从后台返回前台时调用
    const restoreFromBackground = useCallback(async () => {
        const currentTaskId = taskIdRef.current;
        if (!currentTaskId || statusRef.current !== 'generating') return;

        addLog('正在检查任务状态...');

        try {
            // 使用锁定的 API（绕过 Proxy）
            const api = lockedApiRef.current;
            const taskRes = await api.getTask(currentTaskId);
            if (taskRes.code === 0) {
                const task = taskRes.data;
                if (task.status === 'completed') {
                    stopPolling();
                    setStatus('completed');
                    setProgress(100);
                    const resultRes = await api.getTaskResult(currentTaskId);
                    if (resultRes.code === 0) {
                        const transformed = transformPetDietPlan(resultRes.data);
                        if (transformed) setResult(transformed);
                    }
                    addLog('🎉 任务已完成');
                    sendCompletionNotification();
                    disableBackgroundMode();
                } else if (task.status === 'failed') {
                    stopPolling();
                    setStatus('error');
                    setError(task.error_message || '任务失败');
                    addLog('❌ 任务失败');
                    disableBackgroundMode();
                } else {
                    // 任务仍在运行（running / pending）— 先尝试 SSE 重连
                    setProgress(task.progress || 0);
                    addLog('任务仍在运行，尝试 SSE 重连...');
                    try {
                        await api.resumePlanStreamFetch(
                            currentTaskId,
                            handleSSEEvent,
                            (err) => {
                                console.error('SSE resume error in restore:', err);
                            }
                        );
                    } catch (resumeErr) {
                        console.error('SSE resume failed in restore:', resumeErr);
                    }
                    // 重连结束后仍在 generating 则降级轮询
                    if (statusRef.current === 'generating') {
                        addLog('SSE 重连结束，启动轮询监测...');
                        startPolling();
                    }
                }
            }
        } catch (err) {
            console.error('Failed to restore:', err);
            addLog(`恢复失败: ${err.message}`);
            // 即使恢复请求失败，也尝试启动轮询
            startPolling();
        }
    }, [addLog, handleSSEEvent, startPolling, stopPolling, sendCompletionNotification, disableBackgroundMode]);

    // 监听应用状态变化 — 前台恢复时触发任务状态检查（必须在 restoreFromBackground 定义之后）
    useEffect(() => {
        if (!Capacitor.isNativePlatform()) return;

        let appStateListener;

        const setupListener = async () => {
            appStateListener = await CapacitorApp.addListener('appStateChange', async ({ isActive }) => {
                console.log(`📱 App state: ${isActive ? 'foreground' : 'background'}`);
                const isGenerating = statusRef.current === 'generating';
                setIsBackgroundRunning(!isActive && isGenerating);

                // 从后台恢复到前台 + 任务正在生成 → 检查任务状态
                if (isActive && isGenerating && taskIdRef.current) {
                    // 延迟 500ms 等待网络栈恢复
                    setTimeout(() => {
                        if (statusRef.current === 'generating') {
                            restoreFromBackground();
                        }
                    }, 500);
                }
            });
        };

        setupListener();

        return () => {
            if (appStateListener) appStateListener.remove();
        };
    }, [restoreFromBackground]);

    return (
        <PlanGenerationContext.Provider value={{
            status,
            progress,
            currentStepIndex,
            currentStep: steps[currentStepIndex],
            steps,
            isBackgroundRunning,
            taskId,
            planId,
            error,
            result,
            currentNode,
            logs,
            weekStatuses,
            startGeneration,
            resetGeneration,
            restoreFromBackground
        }}>
            {children}
        </PlanGenerationContext.Provider>
    );
};
