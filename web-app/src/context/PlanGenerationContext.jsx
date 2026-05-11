import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { App as CapacitorApp } from '@capacitor/app';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { BackgroundMode } from '@anuradev/capacitor-background-mode';
import realPlansApi from '../api/plans';
import { mockPlansApi } from '../mock';
import { isMockMode } from '../mock/mockMode';
import { transformCompletedEventToResult, transformPetDietPlan } from '../models/dietPlan';
import {
    clearPendingPlanTask,
    getAccessToken,
    loadPendingPlanTask,
    savePendingPlanTask,
} from '../utils/storage';
import {
    PlanActionsContext,
    PlanLogContext,
    PlanStatusContext,
} from './PlanGenerationContextValue';

// PR3：setLogs 上限，避免长任务下 logs 数组无限增长导致渲染卡顿
const MAX_LOGS = 200;

// PR3：轮询退避策略 — 成功归零回 3s、失败指数级延长直到 12s 上限
const POLL_BASE = 3000;
const POLL_MAX = 12000;

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
    const navigate = useNavigate();
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
    // PR3：轮询改为 setTimeout 链式，pollingTimerRef 取代旧 pollingRef
    const pollingTimerRef = useRef(null);
    const pollDelayRef = useRef(POLL_BASE);
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
            if (pollingTimerRef.current) {
                clearTimeout(pollingTimerRef.current);
                pollingTimerRef.current = null;
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

        setLogs((previousLogs) => {
            const next = [
                ...previousLogs,
                { time: new Date().toLocaleTimeString(), message },
            ];
            // PR3：超过上限只保留最近 MAX_LOGS 条，避免长任务下数组无限增长
            return next.length > MAX_LOGS ? next.slice(-MAX_LOGS) : next;
        });
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
        if (pollingTimerRef.current) {
            clearTimeout(pollingTimerRef.current);
            pollingTimerRef.current = null;
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
        clearPendingPlanTask();

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

    const completeWithAguiResult = useCallback(async (detail, {
        completedPlanId = null,
        logMessage = 'AG-UI 计划生成完成',
    } = {}) => {
        stopPolling();

        const transformed = transformCompletedEventToResult(
            detail,
            detail?.ai_suggestions || detail?.message || ''
        );

        storeResult(transformed);
        setStatus('completed');
        setProgress(100);
        setCurrentStepIndex(STEPS.length - 1);
        setIsBackgroundRunning(false);
        setError(null);
        clearPendingPlanTask();

        const nextPlanId = completedPlanId || detail?.plan_id || detail?.id || null;
        if (nextPlanId) {
            setPlanId(nextPlanId);
        }

        addLog(logMessage);
        await disableBackgroundMode();

        return transformed;
    }, [addLog, disableBackgroundMode, stopPolling, storeResult]);

    const failGeneration = useCallback(async (message) => {
        stopPolling();
        setStatus('error');
        setError(message || '生成失败');
        setIsBackgroundRunning(false);
        clearPendingPlanTask();
        addLog(message || '生成失败');
        await disableBackgroundMode();
    }, [addLog, disableBackgroundMode, stopPolling]);

    const startPolling = useCallback(() => {
        // PR3：visibility 感知 + 退避策略
        //   - 用 setTimeout 链式而非 setInterval：每轮完成后才调度下一轮，避免在 long-running poll 期间重叠
        //   - 当 document.hidden 时跳过本轮（不发请求），由 visibilitychange listener 在重回可见时立刻拉起一轮
        //   - 失败时 delay *= 2 上限 12s；成功后归零回 3s，减轻后端压力
        if (pollingTimerRef.current) {
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
                throw pollingError;
            }
        };

        const scheduleNextPoll = () => {
            stopPolling();
            pollingTimerRef.current = setTimeout(async () => {
                pollingTimerRef.current = null;

                // 页面不可见时跳过本轮，等待 visibilitychange listener 重新拉起
                if (typeof document !== 'undefined' && document.hidden) {
                    return;
                }

                try {
                    await poll();
                    // 成功后退避归零
                    pollDelayRef.current = POLL_BASE;
                } catch (err) {
                    // 失败时退避指数级延长
                    pollDelayRef.current = Math.min(pollDelayRef.current * 2, POLL_MAX);
                    console.warn('[polling] tick failed, backoff to', pollDelayRef.current, err);
                }

                // 仍在 generating 才继续下一轮
                if (statusRef.current === 'generating') {
                    scheduleNextPoll();
                }
            }, pollDelayRef.current);
        };

        pollDelayRef.current = POLL_BASE;
        // 立刻发一轮（不等首个延时），让进入 polling 路径就拿到一次结果
        void poll().catch((err) => {
            pollDelayRef.current = Math.min(pollDelayRef.current * 2, POLL_MAX);
            console.warn('[polling] initial tick failed, backoff to', pollDelayRef.current, err);
        }).finally(() => {
            if (statusRef.current === 'generating') {
                scheduleNextPoll();
            }
        });
    }, [completeGeneration, failGeneration, stopPolling]);

    // PR3：visibility 感知 — 页面从隐藏切回可见时立刻重启一轮（无需等当前 backoff 计时完）
    useEffect(() => {
        if (typeof document === 'undefined') {
            return undefined;
        }
        const onVisibility = () => {
            if (!document.hidden && statusRef.current === 'generating' && taskIdRef.current) {
                pollDelayRef.current = POLL_BASE;
                // 不在 polling 中就主动启动；在 polling 中则停掉当前 timer 立即重排
                stopPolling();
                startPolling();
            }
        };
        document.addEventListener('visibilitychange', onVisibility);
        return () => document.removeEventListener('visibilitychange', onVisibility);
    }, [startPolling, stopPolling]);

    const handleSSEEvent = useCallback((data) => {
        void (async () => {
            const eventType = data.type;

            switch (eventType) {
                case 'task_created':
                    setTaskId(data.task_id);
                    // 持久化 taskId 以支持杀进程/清后台恢复
                    try {
                        savePendingPlanTask({
                            taskId: data.task_id,
                            startedAt: Date.now(),
                        });
                    } catch (storageError) {
                        console.warn('Failed to persist pending task:', storageError);
                    }
                    addLog('任务创建成功');
                    return;
                case 'resumed':
                    // 后端 resume 端点确认连接成功
                    if (data.progress !== undefined && data.progress !== null) {
                        setProgress(data.progress);
                    }
                    if (data.current_node) {
                        setCurrentNode(data.current_node);
                    }
                    addLog(`已恢复连接（任务状态：${data.status || 'running'}）`);
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

    const startGeneration = useCallback(async (petData, options = {}) => {
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

        const specialRequirements = options.specialRequirements || undefined;

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

        if (specialRequirements) {
            requestData.special_requirements = specialRequirements;
        }

        try {
            await lockedApiRef.current.createPlanStreamFetch(
                requestData,
                handleSSEEvent,
                (streamError) => {
                    console.error('SSE connection error:', streamError);
                    addLog(`连接异常: ${streamError.message}`);
                },
                abortControllerRef.current?.signal,
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
                    },
                    abortControllerRef.current?.signal,
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
        clearPendingPlanTask();

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
                    },
                    abortControllerRef.current?.signal,
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

    /**
     * 冷启动恢复：从 localStorage 读取未完成的 taskId，
     * 主动查询任务状态 + 订阅事件流回放。
     *
     * 覆盖场景：
     * - 清后台/杀进程 → 重新打开应用
     * - 设备重启
     * - 网络切换导致的长时间断连
     */
    const resumePendingTask = useCallback(async () => {
        const pending = loadPendingPlanTask();
        if (!pending) {
            return;
        }

        // 未登录 — 留存 pending 待登录后再试
        if (!getAccessToken()) {
            return;
        }

        if (statusRef.current === 'generating') {
            // 正在生成中，不触发恢复（避免与主生成流程竞争）
            return;
        }

        const useMock = isMockMode();
        lockedApiRef.current = useMock ? mockPlansApi : realPlansApi;

        // 立即检查后端任务状态，决定是"接回生成"还是"短路到完成/失败"
        let taskResponse;
        try {
            taskResponse = await lockedApiRef.current.getTask(pending.taskId);
        } catch (err) {
            console.warn('恢复时查询任务失败：', err);
            clearPendingPlanTask();
            return;
        }

        if (taskResponse.code !== 0 || !taskResponse.data) {
            // 任务已不存在（超 24h 或数据库清理）
            clearPendingPlanTask();
            return;
        }

        const task = taskResponse.data;

        // 已进入终态 — 直接清除持久化，不打扰用户
        if (task.status === 'failed' || task.status === 'cancelled') {
            clearPendingPlanTask();
            return;
        }

        // 已完成 — 把结果恢复到 context（用户回到 summary 页即可看到）
        if (task.status === 'completed') {
            clearPendingPlanTask();
            const resultData = await fetchTaskResult(pending.taskId);
            if (resultData) {
                setStatus('completed');
                setTaskId(pending.taskId);
                setProgress(100);
                setCurrentStepIndex(STEPS.length - 1);
                storeResult(resultData);
                addLog('已恢复上次生成的完整结果');
            }
            return;
        }

        // pending / running — 真正触发"重连链路"
        setStatus('generating');
        setTaskId(pending.taskId);
        setProgress(task.progress || 0);
        setCurrentNode(task.current_node || null);
        setLogs([]);
        setWeekStatuses(INITIAL_WEEK_STATUSES);
        storeResult(null);
        addLog(`检测到未完成的生成任务（${pending.taskId.slice(0, 8)}…），正在恢复`);

        // 把用户带到生成页，确保他们能看到恢复进度
        try {
            navigate('/planning', { replace: true });
        } catch (navError) {
            console.warn('自动跳转 /planning 失败：', navError);
        }

        await enableBackgroundMode();

        abortControllerRef.current = new AbortController();

        try {
            await lockedApiRef.current.resumePlanStreamFetch(
                pending.taskId,
                handleSSEEvent,
                (resumeError) => {
                    console.error('Cold-start SSE resume error:', resumeError);
                    addLog(`恢复连接异常: ${resumeError.message}`);
                },
                abortControllerRef.current?.signal,
            );
        } catch (resumeError) {
            console.error('Cold-start SSE resume failed:', resumeError);
        }

        // 若订阅已结束但任务仍未终态，启动轮询兜底
        if (statusRef.current === 'generating') {
            addLog('恢复订阅结束，启动轮询兜底');
            startPolling();
        }
    }, [addLog, enableBackgroundMode, fetchTaskResult, handleSSEEvent, navigate, startPolling, storeResult]);

    // 冷启动自动检测（挂载后仅执行一次）
    useEffect(() => {
        void resumePendingTask();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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

    // PR3：拆三层 Provider — actions（最稳定）/ status（中频）/ logs（高频）
    //   actions 用 useMemo([]) — 这些 callback 都通过 useCallback 包过，依赖项稳定；
    //     只在 callback 引用确实变化时才生成新 actions 对象，避免因 logs/status 变化牵动消费者重渲染
    //   status 字段中 currentStep 由 currentStepIndex 派生，STEPS 是模块级常量始终同引用
    //   logs 字段单独成层 — SSE 高频追加 logs/weekStatuses 时只触发订阅了 logs 层的组件重渲染
    const actionsValue = useMemo(() => ({
        startGeneration,
        resetGeneration,
        restoreFromBackground,
        resumePendingTask,
        completeWithAguiResult,
    }), [
        startGeneration,
        resetGeneration,
        restoreFromBackground,
        resumePendingTask,
        completeWithAguiResult,
    ]);

    const statusValue = useMemo(() => ({
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
    ]);

    const logsValue = useMemo(() => ({
        logs,
        weekStatuses,
    }), [logs, weekStatuses]);

    return (
        <PlanActionsContext.Provider value={actionsValue}>
            <PlanStatusContext.Provider value={statusValue}>
                <PlanLogContext.Provider value={logsValue}>
                    {children}
                </PlanLogContext.Provider>
            </PlanStatusContext.Provider>
        </PlanActionsContext.Provider>
    );
};
