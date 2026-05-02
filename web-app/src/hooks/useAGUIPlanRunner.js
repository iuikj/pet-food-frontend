/**
 * useAGUIPlanRunner — 任务式生成 agent 的启动 + 事件聚合 hook。
 *
 * 关键技术决策（详见 AGUI_INTEGRATION.md 与 v2 GenUI 方案）：
 *   1. 通过 useAgent({ updates: [OnRunStatusChanged] }) 拿到 trackedAgent (含 isRunning)
 *   2. 通过 trackedAgent.subscribe({ onCustomEvent }) 直接接收后端 emit_progress 双发出来的事件
 *      ag_ui_langgraph 把 LangGraph 的 on_custom_event 包装成 AG-UI CUSTOM 事件,
 *      其 event.name = ProgressEventType 值,event.value = ProgressEvent dict
 *   3. setForwardedProps 由父组件创建工厂时返回,通过 props 注入；闭包 box 让 clone agent 也能看到
 *
 * 必须在 CopilotKitProvider 内调用。
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    useAgent,
    useCopilotKit,
    UseAgentUpdate,
} from '@copilotkit/react-core/v2';
import { usePets } from './usePets';
import { useUser } from './useUser';

export const AGENT_ID = import.meta.env.VITE_AGUI_AGENT_NAME || 'pet_food_v1';

export function useAGUIPlanRunner({ setForwardedProps }) {
    const { currentPet } = usePets();
    const { user } = useUser();
    const { copilotkit } = useCopilotKit();
    const { agent } = useAgent({
        agentId: AGENT_ID,
        updates: [
            UseAgentUpdate.OnRunStatusChanged,
            UseAgentUpdate.OnStateChanged,
        ],
        // 默认不限制 throttle,让进度事件实时刷新
        throttleMs: 0,
    });

    // 事件池:所有从后端推过来的 ProgressEvent
    const [events, setEvents] = useState([]);
    const [error, setError] = useState(null);
    const [completedDetail, setCompletedDetail] = useState(null);
    const [hasStarted, setHasStarted] = useState(false);

    // 防重入:同 timestamp+node+type+call_id 的事件只入队一次
    const seenKeysRef = useRef(new Set());
    const startedRef = useRef(false);

    // 1) 注入业务上下文 (currentPet → forwardedProps box)
    useEffect(() => {
        if (!currentPet) return;
        setForwardedProps({
            pet_information: {
                pet_type: currentPet.type,
                pet_breed: currentPet.breed,
                pet_age: currentPet.age,
                pet_weight: currentPet.weight,
                health_status: currentPet.health_status,
            },
            ...(user?.id ? { user_id: String(user.id) } : {}),
        });
    }, [currentPet, user?.id, setForwardedProps]);

    // 2) 订阅 AG-UI CUSTOM 事件 (后端 emit_progress 双发的关键接收点)
    useEffect(() => {
        if (!agent) return undefined;

        const subscription = agent.subscribe({
            onCustomEvent: ({ event }) => {
                // event.value 就是后端 ProgressEvent.to_dict() 的 payload
                // event.name 是 ProgressEventType 值 (冗余,payload.type 一致)
                const payload = event?.value;
                if (!payload || typeof payload !== 'object') {
                    if (import.meta.env.DEV) {
                        console.warn('[useAGUIPlanRunner] empty CustomEvent payload', event);
                    }
                    return;
                }
                if (!payload.type) {
                    if (import.meta.env.DEV) {
                        console.warn('[useAGUIPlanRunner] payload missing type', payload);
                    }
                    return;
                }

                // 去重 key:timestamp + node + type + call_id (tool_call started/completed 才有 call_id)
                const dedupKey = [
                    payload.timestamp,
                    payload.node ?? '',
                    payload.type,
                    payload.detail?.call_id ?? '',
                    payload.detail?.status ?? '',
                ].join('|');

                if (seenKeysRef.current.has(dedupKey)) return;
                seenKeysRef.current.add(dedupKey);

                // 用 microtask 推迟到 React 调度,避免在订阅器回调里同步触发 setState 引发警告
                queueMicrotask(() => {
                    setEvents((prev) => [...prev, payload]);

                    if (payload.type === 'completed' && payload.detail) {
                        setCompletedDetail(payload.detail);
                    }
                    if (payload.type === 'error') {
                        setError(payload.message || '生成失败');
                    }
                });

                if (import.meta.env.DEV) {
                    console.debug('[AG-UI custom event]', payload.type, payload);
                }
            },
            onRunFailed: ({ error: runError }) => {
                queueMicrotask(() => {
                    setError(runError?.message || 'Agent 运行失败');
                });
            },
            onRunErrorEvent: ({ event }) => {
                queueMicrotask(() => {
                    setError(event?.message || event?.error || 'Agent 错误');
                });
            },
        });

        return () => {
            subscription?.unsubscribe?.();
        };
    }, [agent]);

    // 3) 启动 — 编程式 runAgent (任务式,无对话)
    const start = useCallback(() => {
        if (startedRef.current) return;
        if (!currentPet) {
            setError('请先选择宠物');
            return;
        }
        if (!agent) {
            setError('Agent 尚未就绪');
            return;
        }

        startedRef.current = true;
        // 重置状态
        setEvents([]);
        seenKeysRef.current.clear();
        setError(null);
        setCompletedDetail(null);
        setHasStarted(true);

        // v1 graph 需要至少一条 user message 触发 research_planner
        agent.addMessage({
            id: crypto.randomUUID(),
            role: 'user',
            content: `请为我的 ${currentPet.type === 'cat' ? '猫咪' : '狗狗'}「${currentPet.name}」生成月度饮食计划。`,
        });
        copilotkit.runAgent({ agent });
    }, [agent, copilotkit, currentPet]);

    // 4) 取消 — 调用 AbstractAgent.abortRun()
    const cancel = useCallback(() => {
        try {
            agent?.abortRun?.();
        } catch (e) {
            console.warn('[useAGUIPlanRunner] abortRun failed', e);
        }
        // 不重置 startedRef:用户取消后不应自动重启
    }, [agent]);

    // 5) 重置 — 用于错误后重试
    const reset = useCallback(() => {
        startedRef.current = false;
        setHasStarted(false);
        setEvents([]);
        seenKeysRef.current.clear();
        setError(null);
        setCompletedDetail(null);
    }, []);

    const isRunning = !!agent?.isRunning;

    return useMemo(
        () => ({
            agent,
            events,
            error,
            completedDetail,
            isRunning,
            hasStarted,
            start,
            cancel,
            reset,
        }),
        [agent, events, error, completedDetail, isRunning, hasStarted, start, cancel, reset],
    );
}
