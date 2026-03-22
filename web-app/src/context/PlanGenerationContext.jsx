import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { BackgroundMode } from '@anuradev/capacitor-background-mode';
import realPlansApi from '../api/plans';
import { mockPlansApi } from '../mock';
import { isMockMode } from '../mock/mockMode';
import { transformCompletedEventToResult, transformPetDietPlan } from '../models/dietPlan';
import PlanGenerationContext from './PlanGenerationContextValue';

const INITIAL_WEEK_STATUSES = {
    1: { status: 'pending', label: '等待中' },
    2: { status: 'pending', label: '等待中' },
    3: { status: 'pending', label: '等待中' },
    4: { status: 'pending', label: '等待中' },
};

const STEPS = [
    { title: '调研分析', description: '正在分析宠物营养需求并整理基础资料。' },
    { title: '制定食谱', description: '四周饮食计划正在并行生成。' },
    { title: '生成报告', description: '正在整理结构化结果并输出最终方案。' },
];

const EVENT_TYPE_TO_STEP_INDEX = {
    research_starting: 0,
    plan_created: 0,
    plan_updated: 0,
    task_delegating: 0,
    research_task_delegating: 0,
    research_finalizing: 0,
    dispatching: 1,
    week_planning: 1,
    week_searching: 1,
    week_plan_ready: 1,
    week_writing: 1,
    week_completed: 1,
    gathering: 2,
    structuring: 2,
    structured: 2,
    completed: 2,
};

const WEEK_EVENT_MAP = {
    week_planning: { status: 'planning', label: '规划中' },
    week_searching: { status: 'searching', label: '检索中' },
    week_plan_ready: { status: 'writing', label: '撰写中' },
    week_writing: { status: 'writing', label: '撰写中' },
    week_completed: { status: 'completed', label: '已完成' },
};

function extractTaskResultPayload(taskResult) {
    if (!taskResult) {
        return null;
    }

    return taskResult.output?.plan_data || taskResult.output || taskResult.plan_data || taskResult;
}

function transformTaskResultPayload(taskResult) {
    const payload = extractTaskResultPayload(taskResult);

    if (payload?.detail?.plans) {
        return transformCompletedEventToResult(
            payload.detail,
            payload.message || payload.detail?.ai_suggestions || ''
        );
    }

    if (payload?.plans) {
        return transformCompletedEventToResult(
            payload,
            payload.ai_suggestions || payload.message || ''
        );
    }

    return transformPetDietPlan(payload);
}

function extractWeekNumber(data) {
    if (data.node) {
        const nodeMatch = data.node.match(/week_agent_(\d+)/);
        if (nodeMatch) {
            return Number(nodeMatch[1]);
        }
    }

    if (data.task_name) {
        const taskMatch = data.task_name.match(/(\d+)/);
        if (taskMatch) {
            return Number(taskMatch[1]);
        }
    }

    if (data.detail?.week) {
        return Number(data.detail.week);
    }

    return null;
}

export const PlanGenerationProvider = ({ children }) => {
    const [status, setStatus] = useState('idle');
    const [progress, setProgress] = useState(0);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [isBackgroundRunning, setIsBackgroundRunning] = useState(false);
    const [taskId, setTaskId] = useState(null);
    const [error, setError] = useState(null);
    const [result, setResult] = useState(null);
    const [currentNode, setCurrentNode] = useState(null);
    const [logs, setLogs] = useState([]);
    const [planId, setPlanId] = useState(null);
    const [weekStatuses, setWeekStatuses] = useState(INITIAL_WEEK_STATUSES);

    const abortControllerRef = useRef(null);
    const lockedApiRef = useRef(realPlansApi);
    const pollingRef = useRef(null);
    const statusRef = useRef(status);
    const taskIdRef = useRef(taskId);
    const resultRef = useRef(result);

    useEffect(() => {
        statusRef.current = status;
    }, [status]);

    useEffect(() => {
        taskIdRef.current = taskId;
    }, [taskId]);

    useEffect(() => {
        resultRef.current = result;
    }, [result]);

    useEffect(() => {
        return () => {
            if (pollingRef.current) {
                clearInterval(pollingRef.current);
            }
        };
    }, []);

    useEffect(() => {
        const init = async () => {
            if (!Capacitor.isNativePlatform()) {
                return;
            }

            try {
                const permission = await LocalNotifications.checkPermissions();
                if (permission.display !== 'granted') {
                    await LocalNotifications.requestPermissions();
                }
            } catch (notificationError) {
                console.log('Notifications not available:', notificationError);
            }
        };

        init();
    }, []);

    const addLog = useCallback((message) => {
        if (!message) {
            return;
        }

        setLogs((previousLogs) => [
            ...previousLogs,
            { time: new Date().toLocaleTimeString(), message },
        ]);
    }, []);

    const storeResult = useCallback((nextResult) => {
        resultRef.current = nextResult;
        setResult(nextResult);
        return nextResult;
    }, []);

    const updateWeekStatus = useCallback((weekNumber, nextStatus, label) => {
        if (!weekNumber || weekNumber < 1 || weekNumber > 4) {
            return;
        }

        setWeekStatuses((previousStatuses) => ({
            ...previousStatuses,
            [weekNumber]: { status: nextStatus, label },
        }));
    }, []);

    const stopPolling = useCallback(() => {
        if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
        }
    }, []);

    const sendCompletionNotification = useCallback(async () => {
        if (!Capacitor.isNativePlatform()) {
            return;
        }

        try {
            await LocalNotifications.schedule({
                notifications: [{
                    id: 1,
                    title: '专属计划已生成',
                    body: '点击查看宠物的饮食计划',
                    extra: {
                        route: '/plan/summary',
                        type: 'completed',
                    },
                    schedule: {
                        allowWhileIdle: true,
                    },
                }],
            });
        } catch (notificationError) {
            console.error('Failed to send notification:', notificationError);
        }
    }, []);

    const enableBackgroundMode = useCallback(async () => {
        if (!Capacitor.isNativePlatform()) {
            return;
        }

        try {
            await BackgroundMode.setSettings({
                title: '正在生成专属计划',
                text: '任务进行中，请勿关闭应用',
                icon: 'ic_launcher',
                color: '8B5CF6',
                resume: true,
                hidden: false,
                silent: false,
            });
            await BackgroundMode.enable();
        } catch (backgroundError) {
            console.error('Failed to enable background mode:', backgroundError);
        }
    }, []);

    const disableBackgroundMode = useCallback(async () => {
        if (!Capacitor.isNativePlatform()) {
            return;
        }

        try {
            await BackgroundMode.disable();
        } catch (backgroundError) {
            console.error('Failed to disable background mode:', backgroundError);
        }
    }, []);

    const fetchTaskResult = useCallback(async (targetTaskId = taskIdRef.current) => {
        if (!targetTaskId) {
            return null;
        }

        try {
            const response = await lockedApiRef.current.getTaskResult(targetTaskId);
            if (response.code !== 0) {
                return null;
            }

            return transformTaskResultPayload(response.data);
        } catch (taskResultError) {
            console.error('Failed to fetch task result:', taskResultError);
            return null;
        }
    }, []);

    const completeGeneration = useCallback(async ({
        completedPlanId = null,
        resultData = null,
        logMessage = '计划生成完成',
        notify = true,
    } = {}) => {
        stopPolling();
        setStatus('completed');
        setProgress(100);
        setCurrentStepIndex(STEPS.length - 1);
        setIsBackgroundRunning(false);
        setError(null);

        if (completedPlanId) {
            setPlanId(completedPlanId);
        }

        let nextResult = null;
        if (resultData) {
            nextResult = transformTaskResultPayload(resultData);
        }

        if (!nextResult && !resultRef.current) {
            nextResult = await fetchTaskResult();
        }

        if (nextResult) {
            storeResult(nextResult);
        }

        addLog(logMessage);

        if (notify) {
            await sendCompletionNotification();
        }

        await disableBackgroundMode();
    }, [addLog, disableBackgroundMode, fetchTaskResult, sendCompletionNotification, stopPolling, storeResult]);

    const failGeneration = useCallback(async (message) => {
        stopPolling();
        setStatus('error');
        setError(message || '生成失败');
        setIsBackgroundRunning(false);
        addLog(message || '生成失败');
        await disableBackgroundMode();
    }, [addLog, disableBackgroundMode, stopPolling]);

    const startPolling = useCallback(() => {
        if (pollingRef.current) {
            return;
        }

        const poll = async () => {
            const currentTaskId = taskIdRef.current;
            if (!currentTaskId || statusRef.current !== 'generating') {
                stopPolling();
                return;
            }

            try {
                const taskResponse = await lockedApiRef.current.getTask(currentTaskId);
                if (taskResponse.code !== 0) {
                    return;
                }

                const task = taskResponse.data;
                setProgress(task.progress || 0);
                setCurrentNode(task.current_node || null);

                if (task.status === 'completed') {
                    await completeGeneration();
                    return;
                }

                if (task.status === 'failed' || task.status === 'cancelled') {
                    await failGeneration(task.error_message || '任务失败');
                }
            } catch (pollingError) {
                console.error('Polling error:', pollingError);
            }
        };

        poll();
        pollingRef.current = setInterval(poll, 3000);
    }, [completeGeneration, failGeneration, stopPolling]);

    const handleSSEEvent = useCallback((data) => {
        void (async () => {
            const eventType = data.type;

            switch (eventType) {
                case 'task_created':
                    setTaskId(data.task_id);
                    addLog('任务创建成功');
                    return;
                case 'task_completed':
                    if (!data.plan_id && (data.node || data.task_name)) {
                        addLog(`子任务完成: ${data.task_name || data.node}`);
                        return;
                    }

                    await completeGeneration({
                        completedPlanId: data.plan_id || data.result?.id || null,
                        resultData: data.result,
                    });
                    return;
                case 'final_result': {
                    const transformed = transformPetDietPlan(data.data);
                    if (transformed) {
                        storeResult(transformed);
                    }
                    addLog('已收到最终报告');
                    return;
                }
                case 'done':
                    // 流正常结束 — 如果已有 result 数据，触发完成流程
                    if (resultRef.current) {
                        await completeGeneration({ logMessage: '流式传输完成' });
                    }
                    return;
                case 'error':
                    await failGeneration(data.error || '生成失败');
                    return;
                case 'node_completed':
                    if (data.progress !== undefined && data.progress !== null) {
                        setProgress(data.progress);
                    }
                    return;
                default:
                    break;
            }

            if (eventType === 'completed' && data.detail?.plans) {
                try {
                    const transformed = transformCompletedEventToResult(data.detail, data.message);
                    storeResult(transformed);
                    setProgress(100);
                    setCurrentStepIndex(STEPS.length - 1);
                    addLog('已收到完整饮食计划数据');
                } catch (transformError) {
                    console.error('Failed to transform completed event:', transformError);
                    addLog(`结果转换失败: ${transformError.message}`);
                }
            }

            const weekAction = WEEK_EVENT_MAP[eventType];
            if (weekAction) {
                updateWeekStatus(extractWeekNumber(data), weekAction.status, weekAction.label);
            }

            const stepIndex = EVENT_TYPE_TO_STEP_INDEX[eventType];
            if (stepIndex !== undefined) {
                setCurrentStepIndex(stepIndex);
            }

            if (data.progress !== undefined && data.progress !== null) {
                setProgress(data.progress);
            }

            if (data.node) {
                setCurrentNode(data.node);
            }

            addLog(data.message || data.task_name || eventType);
        })();
    }, [addLog, completeGeneration, failGeneration, storeResult, updateWeekStatus]);

    const startGeneration = useCallback(async (petData) => {
        if (statusRef.current === 'generating') {
            return;
        }

        const useMock = isMockMode();
        lockedApiRef.current = useMock ? mockPlansApi : realPlansApi;

        setStatus('generating');
        setProgress(0);
        setCurrentStepIndex(0);
        setIsBackgroundRunning(false);
        setTaskId(null);
        setError(null);
        setCurrentNode(null);
        setPlanId(null);
        setLogs([]);
        setWeekStatuses(INITIAL_WEEK_STATUSES);
        storeResult(null);

        await enableBackgroundMode();
        addLog(`开始生成饮食计划${useMock ? '（演示模式）' : ''}`);

        abortControllerRef.current = new AbortController();

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
            await failGeneration('缺少宠物信息');
            return;
        }

        try {
            await lockedApiRef.current.createPlanStreamFetch(
                requestData,
                handleSSEEvent,
                (streamError) => {
                    console.error('SSE connection error:', streamError);
                    addLog(`连接异常: ${streamError.message}`);
                }
            );
        } catch (streamError) {
            console.error('Unexpected stream error:', streamError);
            addLog(`流式请求异常: ${streamError.message}`);
        }

        if (statusRef.current === 'generating' && taskIdRef.current) {
            addLog('流式连接结束，尝试恢复连接');

            try {
                await lockedApiRef.current.resumePlanStreamFetch(
                    taskIdRef.current,
                    handleSSEEvent,
                    (resumeError) => {
                        console.error('SSE resume error:', resumeError);
                    }
                );
            } catch (resumeError) {
                console.error('SSE resume failed:', resumeError);
            }

            if (statusRef.current === 'generating') {
                addLog('恢复连接结束，启动轮询兜底');
                startPolling();
            }
            return;
        }

        if (statusRef.current === 'generating') {
            await failGeneration('连接失败，未能创建任务');
        }
    }, [addLog, enableBackgroundMode, failGeneration, handleSSEEvent, startPolling, storeResult]);

    const resetGeneration = useCallback(async () => {
        setStatus('idle');
        setProgress(0);
        setCurrentStepIndex(0);
        setIsBackgroundRunning(false);
        setTaskId(null);
        setError(null);
        setCurrentNode(null);
        setPlanId(null);
        setLogs([]);
        setWeekStatuses(INITIAL_WEEK_STATUSES);
        storeResult(null);

        stopPolling();

        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }

        await disableBackgroundMode();

        try {
            await LocalNotifications.cancel({ notifications: [{ id: 1 }, { id: 100 }] });
        } catch (cancelError) {
            console.log('Failed to cancel notification:', cancelError);
        }
    }, [disableBackgroundMode, stopPolling, storeResult]);

    const restoreFromBackground = useCallback(async () => {
        const currentTaskId = taskIdRef.current;
        if (!currentTaskId || statusRef.current !== 'generating') {
            return;
        }

        addLog('正在检查任务状态');

        try {
            const taskResponse = await lockedApiRef.current.getTask(currentTaskId);
            if (taskResponse.code !== 0) {
                return;
            }

            const task = taskResponse.data;
            setProgress(task.progress || 0);
            setCurrentNode(task.current_node || null);

            if (task.status === 'completed') {
                await completeGeneration({ logMessage: '任务已完成' });
                return;
            }

            if (task.status === 'failed' || task.status === 'cancelled') {
                await failGeneration(task.error_message || '任务失败');
                return;
            }

            addLog('任务仍在运行，尝试恢复连接');

            try {
                await lockedApiRef.current.resumePlanStreamFetch(
                    currentTaskId,
                    handleSSEEvent,
                    (resumeError) => {
                        console.error('SSE resume error in restore:', resumeError);
                    }
                );
            } catch (resumeError) {
                console.error('SSE resume failed in restore:', resumeError);
            }

            if (statusRef.current === 'generating') {
                addLog('恢复连接结束，启动轮询监控');
                startPolling();
            }
        } catch (restoreError) {
            console.error('Failed to restore:', restoreError);
            addLog(`恢复失败: ${restoreError.message}`);
            startPolling();
        }
    }, [addLog, completeGeneration, failGeneration, handleSSEEvent, startPolling]);

    useEffect(() => {
        if (!Capacitor.isNativePlatform()) {
            return undefined;
        }

        let appStateListener;

        const setupListener = async () => {
            appStateListener = await CapacitorApp.addListener('appStateChange', ({ isActive }) => {
                const generating = statusRef.current === 'generating';
                setIsBackgroundRunning(!isActive && generating);

                if (isActive && generating && taskIdRef.current) {
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
            if (appStateListener) {
                appStateListener.remove();
            }
        };
    }, [restoreFromBackground]);

    const contextValue = useMemo(() => ({
        status,
        progress,
        currentStepIndex,
        currentStep: STEPS[currentStepIndex],
        steps: STEPS,
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
        restoreFromBackground,
    }), [
        status,
        progress,
        currentStepIndex,
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
        restoreFromBackground,
    ]);

    return (
        <PlanGenerationContext.Provider value={contextValue}>
            {children}
        </PlanGenerationContext.Provider>
    );
};
