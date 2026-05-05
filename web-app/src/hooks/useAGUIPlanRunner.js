/**
 * useAGUIPlanRunner — 任务式生成 agent 的启动 + 事件聚合 hook。
 *
 * 关键技术决策（详见 agui-langgraph-learn 与 v2 GenUI 方案）：
 *   1. 通过 useAgent({ updates: [OnRunStatusChanged] }) 拿到 trackedAgent (含 isRunning)
 *   2. 通过 trackedAgent.subscribe 同时接收:
 *      - 后端业务 ProgressEvent: AG-UI CUSTOM 事件
 *      - AG-UI 标准 text/tool/reasoning 事件
 *   3. setForwardedProps 由父组件创建工厂时返回,通过 props 注入；闭包 box 让 clone agent 也能看到
 *
 * 必须在 CopilotKitProvider 内调用。
 */
import { startTransition, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    useAgent,
    useCopilotKit,
    UseAgentUpdate,
} from '@copilotkit/react-core/v2';
import { usePets } from './usePets';
import { useUser } from './useUser';

export const AGENT_ID = import.meta.env.VITE_AGUI_AGENT_NAME || 'v2agent';

const TOOL_VIEW_TYPE_MAP = {
    tavily_search: 'tool_search',
    ingredient_search_tool: 'tool_search',
    ingredient_detail_tool: 'tool_food_calc',
    ingredient_categories_tool: 'tool_food_calc',
    daily_calorie_tool: 'tool_food_calc',
    nutrition_requirement_tool: 'tool_food_calc',
    write_todos: 'plan_board',
    task: 'subagent_dispatch',
    query_note: 'tool_note_read',
    ls: 'tool_note_read',
    query_shared_note: 'tool_note_read',
    write_note: 'tool_note_write',
    week_write_note: 'tool_note_write',
    update_note: 'tool_note_write',
};

const PLAN_TODO_TOOL_NAMES = new Set(['write_todos', 'update_todos', 'TodoWrite']);

function nowIso() {
    return new Date().toISOString();
}

function enqueueStateUpdate(fn) {
    queueMicrotask(() => {
        startTransition(fn);
    });
}

function upsertEventById(events, id, buildNext) {
    const index = events.findIndex((event) => event.detail?.message_id === id);
    if (index < 0) return [...events, buildNext(null)];
    const next = [...events];
    next[index] = buildNext(next[index]);
    return next;
}

function getWeekNumber(state) {
    const raw = state?.week_assignment?.week_number;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
}

function asObject(value) {
    return value && typeof value === 'object' && !Array.isArray(value) ? value : null;
}

function getRawEventMetadata(event) {
    return asObject(event?.rawEvent?.metadata);
}

function getEventMetadata(event) {
    return (
        getRawEventMetadata(event) ||
        asObject(event?.metadata) ||
        asObject(event?.rawEvent?.kwargs?.metadata) ||
        asObject(event?.rawEvent?.data?.metadata) ||
        null
    );
}

function getMetadataSubagentInfo(metadata) {
    const meta = asObject(metadata);
    if (!meta) return null;
    const nested = asObject(meta.subagent_info);
    const subagentId = meta.subagent_id || nested?.subagent_id;
    if (!subagentId) return null;
    return {
        subagent_id: String(subagentId),
        input_message: meta.input_message || nested?.input_message || meta.task_name || null,
    };
}

function getStateSubagentInfo(state) {
    const info = state?.subagent_info;
    if (!info?.subagent_id) return null;
    return info;
}

function getScopedSubagentInfo(event, state) {
    return getMetadataSubagentInfo(getEventMetadata(event)) || getStateSubagentInfo(state);
}

function buildScopeDetail(subagentInfo) {
    if (!subagentInfo?.subagent_id) return {};
    return {
        agent_scope: 'subagent',
        subagent_id: subagentInfo.subagent_id,
        ...(subagentInfo.input_message ? { input_message: subagentInfo.input_message } : {}),
    };
}

function deriveEventScope(state, activeSteps, event) {
    const subagentInfo = getScopedSubagentInfo(event, state);
    if (subagentInfo) {
        return {
            node: `subagent_${subagentInfo.subagent_id}`,
            taskName: subagentInfo.input_message || 'SubAgent 任务',
            detail: buildScopeDetail(subagentInfo),
        };
    }
    const week = getWeekNumber(state);
    if (week) {
        return {
            node: `week_agent_${week}`,
            taskName: `第${week}周饮食计划`,
            detail: {},
        };
    }
    const stepName = activeSteps[activeSteps.length - 1];
    const node = stepName || null;
    return {
        node,
        taskName: node === 'plan_agent' ? '研究阶段' : null,
        detail: {},
    };
}

function buildToolDetail({ toolName, args, status, result, callId }) {
    return {
        view_type: TOOL_VIEW_TYPE_MAP[toolName] || 'tool_call_generic',
        tool_name: toolName,
        args: args || {},
        status,
        call_id: callId,
        ...(result !== undefined ? { result } : {}),
    };
}

function isSubagentTool(toolName) {
    const lowered = String(toolName || '').toLowerCase();
    return toolName === 'task' || lowered.includes('subagent') || lowered.includes('transfer') || lowered.includes('transfor');
}

function hasObjectPayload(value) {
    return !!value && typeof value === 'object' && Object.keys(value).length > 0;
}

function buildToolPayload({ toolName, args, status, result, callId, node, taskName, message, scopeDetail = {} }) {
    if (PLAN_TODO_TOOL_NAMES.has(toolName)) {
        const items = Array.isArray(args?.todos) ? args.todos : (Array.isArray(args?.plan) ? args.plan : []);
        if (items.length === 0) return null;
        return {
            type: 'plan_snapshot',
            message: message || '任务队列更新',
            node,
            task_name: taskName,
            timestamp: nowIso(),
            detail: {
                ...scopeDetail,
                view_type: 'plan_board',
                items,
                action: 'updated',
                tool_name: toolName,
                call_id: callId,
                status,
                ...(result !== undefined ? { result } : {}),
            },
        };
    }

    if (isSubagentTool(toolName)) {
        if (!hasObjectPayload(args)) return null;
        const target = args.subagent_type || args.agent_name || args.name || 'subagent';
        const delegatedTask = args.description || args.content || args.task_name || args.task || taskName || '委派任务';
        const subagentId = scopeDetail.subagent_id || args.subagent_id || args.subagent_info?.subagent_id;
        const inputMessage = scopeDetail.input_message || delegatedTask;
        return {
            type: 'subagent_spawn',
            message: `委派 → ${target}: ${delegatedTask}`,
            node,
            task_name: delegatedTask,
            timestamp: nowIso(),
            detail: {
                ...scopeDetail,
                view_type: 'subagent_dispatch',
                target,
                task_name: delegatedTask,
                tool_name: toolName,
                args: args || {},
                status,
                call_id: callId,
                agent_scope: 'subagent',
                ...(subagentId ? { subagent_id: String(subagentId) } : {}),
                ...(inputMessage ? { input_message: inputMessage } : {}),
                ...(result !== undefined ? { result } : {}),
            },
        };
    }

    return {
        type: 'tool_call',
        message: message || `${toolName}: ${status}`,
        node,
        task_name: taskName,
        timestamp: nowIso(),
        detail: {
            ...buildToolDetail({
                toolName,
                args,
                status,
                result,
                callId,
            }),
            ...scopeDetail,
        },
    };
}

function logAguiEvent(event) {
    console.log('[AG-UI event]', event?.type, {
        metadata: getEventMetadata(event),
        rawMetadata: getRawEventMetadata(event),
        event,
    });
}

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
    const activeStepsRef = useRef([]);
    const lastTodosSnapshotRef = useRef('');
    const textMessageMetaRef = useRef(new Map());
    const toolCallsRef = useRef(new Map());
    const completedToolCallIdsRef = useRef(new Set());
    const reasoningRef = useRef(new Map());

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

    // 2) 订阅事件流：
    //    a) onCustomEvent — 后端业务 ProgressEvent（phase / plan_snapshot / subagent_spawn / completed）
    //    b) onTextMessage* / onToolCall* / onReasoning* — AG-UI 标准事件
    useEffect(() => {
        if (!agent) return undefined;

        const subscription = agent.subscribe({
            onStepStartedEvent: ({ event }) => {
                activeStepsRef.current = [...activeStepsRef.current, event.stepName];
            },
            onStepFinishedEvent: ({ event }) => {
                const stack = [...activeStepsRef.current];
                const idx = stack.lastIndexOf(event.stepName);
                if (idx >= 0) stack.splice(idx, 1);
                activeStepsRef.current = stack;
            },
            onCustomEvent: ({ event }) => {
                // event.value 就是后端 ProgressEvent.to_dict() 的 payload
                // event.name 是 ProgressEventType 值 (冗余,payload.type 一致)
                const payload = event?.value;
                if (!payload || typeof payload !== 'object') {
                    return;
                }
                if (!payload.type) {
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

                enqueueStateUpdate(() => {
                    setEvents((prev) => [...prev, payload]);

                    if (payload.type === 'completed' && payload.detail) {
                        setCompletedDetail(payload.detail);
                    }
                    if (payload.type === 'error') {
                        setError(payload.message || '生成失败');
                    }
                });

            },
            onStateChanged: ({ state }) => {
                const todos = state?.todos;
                if (!Array.isArray(todos) || todos.length === 0) return;

                let snapshot = '';
                try {
                    snapshot = JSON.stringify(todos);
                } catch {
                    snapshot = String(todos.length);
                }
                if (snapshot === lastTodosSnapshotRef.current) return;
                lastTodosSnapshotRef.current = snapshot;

                const payload = {
                    type: 'plan_snapshot',
                    message: '任务队列更新',
                    node: 'plan_agent',
                    task_name: '研究阶段',
                    timestamp: nowIso(),
                    detail: {
                        view_type: 'plan_board',
                        items: todos,
                        action: 'updated',
                        source: 'state.todos',
                    },
                };
                enqueueStateUpdate(() => {
                    setEvents((prev) => [...prev, payload]);
                });
            },
            onTextMessageStartEvent: ({ event, state }) => {
                const scope = deriveEventScope(state, activeStepsRef.current, event);
                textMessageMetaRef.current.set(event.messageId, {
                    role: event.role,
                    node: scope.node,
                    taskName: scope.taskName,
                    scopeDetail: scope.detail,
                });
            },
            onTextMessageEndEvent: ({ event, textMessageBuffer }) => {
                const meta = textMessageMetaRef.current.get(event.messageId);
                textMessageMetaRef.current.delete(event.messageId);
                if (!meta || meta.role !== 'assistant') return;
                if (!textMessageBuffer?.trim()) return;

                const payload = {
                    type: 'ai_message',
                    message: textMessageBuffer.trim().slice(0, 120),
                    node: meta.node,
                    task_name: meta.taskName,
                    timestamp: nowIso(),
                    detail: {
                        ...(meta.scopeDetail || {}),
                        view_type: 'ai_message',
                        content: textMessageBuffer,
                        message_id: event.messageId,
                    },
                };
                enqueueStateUpdate(() => {
                    setEvents((prev) => [...prev, payload]);
                });
            },
            onReasoningMessageStartEvent: ({ event, state }) => {
                const scope = deriveEventScope(state, activeStepsRef.current, event);
                reasoningRef.current.set(event.messageId, {
                    content: '',
                    node: scope.node,
                    taskName: scope.taskName,
                    scopeDetail: scope.detail,
                });
                const timestamp = nowIso();
                enqueueStateUpdate(() => {
                    setEvents((prev) => upsertEventById(prev, event.messageId, () => ({
                        type: 'reasoning',
                        message: 'Thinking...',
                        node: scope.node,
                        task_name: scope.taskName,
                        timestamp,
                        detail: {
                            ...scope.detail,
                            view_type: 'reasoning',
                            content: '',
                            message_id: event.messageId,
                            is_streaming: true,
                        },
                    })));
                });
            },
            onReasoningMessageContentEvent: ({ event, reasoningMessageBuffer }) => {
                const meta = reasoningRef.current.get(event.messageId);
                if (!meta) return;
                const content = reasoningMessageBuffer ?? meta.content ?? '';
                reasoningRef.current.set(event.messageId, {
                    ...meta,
                    content,
                });
                enqueueStateUpdate(() => {
                    setEvents((prev) => upsertEventById(prev, event.messageId, (existing) => ({
                        type: 'reasoning',
                        message: content.trim().slice(0, 120) || 'Thinking...',
                        node: meta.node,
                        task_name: meta.taskName,
                        timestamp: existing?.timestamp || nowIso(),
                        detail: {
                            ...(existing?.detail || {}),
                            ...(meta.scopeDetail || {}),
                            view_type: 'reasoning',
                            content,
                            message_id: event.messageId,
                            is_streaming: true,
                        },
                    })));
                });
            },
            onReasoningMessageEndEvent: ({ event, reasoningMessageBuffer }) => {
                const meta = reasoningRef.current.get(event.messageId);
                reasoningRef.current.delete(event.messageId);
                const finalContent = reasoningMessageBuffer || meta?.content || '';
                if (!meta || !finalContent.trim()) {
                    enqueueStateUpdate(() => {
                        setEvents((prev) => prev.filter((item) => item.detail?.message_id !== event.messageId));
                    });
                    return;
                }
                enqueueStateUpdate(() => {
                    setEvents((prev) => upsertEventById(prev, event.messageId, (existing) => ({
                        type: 'reasoning',
                        message: finalContent.trim().slice(0, 120),
                        node: meta.node,
                        task_name: meta.taskName,
                        timestamp: existing?.timestamp || nowIso(),
                        detail: {
                            ...(existing?.detail || {}),
                            ...(meta.scopeDetail || {}),
                            view_type: 'reasoning',
                            content: finalContent,
                            message_id: event.messageId,
                            is_streaming: false,
                        },
                    })));
                });
            },
            onToolCallStartEvent: ({ event, state }) => {
                const scope = deriveEventScope(state, activeStepsRef.current, event);
                toolCallsRef.current.set(event.toolCallId, {
                    toolName: event.toolCallName,
                    args: {},
                    node: scope.node,
                    taskName: scope.taskName,
                    scopeDetail: scope.detail,
                });

                const payload = buildToolPayload({
                    toolName: event.toolCallName,
                    args: {},
                    status: 'started',
                    callId: event.toolCallId,
                    node: scope.node,
                    taskName: scope.taskName,
                    message: `${event.toolCallName}: started`,
                    scopeDetail: scope.detail,
                });
                if (!payload) return;
                enqueueStateUpdate(() => {
                    setEvents((prev) => [...prev, payload]);
                });
            },
            onToolCallArgsEvent: ({ event, toolCallName, partialToolCallArgs, state }) => {
                const existing = toolCallsRef.current.get(event.toolCallId);
                const scope = deriveEventScope(state, activeStepsRef.current, event);
                toolCallsRef.current.set(event.toolCallId, {
                    toolName: toolCallName || existing?.toolName,
                    args: partialToolCallArgs || existing?.args || {},
                    node: existing?.node || scope.node,
                    taskName: existing?.taskName || scope.taskName,
                    scopeDetail: existing?.scopeDetail || scope.detail,
                });
            },
            onToolCallResultEvent: ({ event }) => {
                const existing = toolCallsRef.current.get(event.toolCallId);
                if (!existing) return;
                toolCallsRef.current.delete(event.toolCallId);
                completedToolCallIdsRef.current.add(event.toolCallId);

                const payload = buildToolPayload({
                    toolName: existing.toolName,
                    args: existing.args,
                    status: 'completed',
                    result: event.content,
                    callId: event.toolCallId,
                    node: existing.node,
                    taskName: existing.taskName,
                    message: `${existing.toolName}: completed`,
                    scopeDetail: existing.scopeDetail,
                });
                if (!payload) return;
                enqueueStateUpdate(() => {
                    setEvents((prev) => [...prev, payload]);
                });
            },
            onToolCallEndEvent: ({ event, toolCallName, toolCallArgs }) => {
                const existing = toolCallsRef.current.get(event.toolCallId);
                if (!existing) return;
                toolCallsRef.current.set(event.toolCallId, {
                    ...existing,
                    toolName: toolCallName || existing.toolName,
                    args: toolCallArgs || existing.args || {},
                });
            },
            onNewMessage: ({ message, state }) => {
                if (message?.role !== 'tool' || !message?.toolCallId) return;
                if (completedToolCallIdsRef.current.has(message.toolCallId)) {
                    completedToolCallIdsRef.current.delete(message.toolCallId);
                    return;
                }
                const existing = toolCallsRef.current.get(message.toolCallId);
                if (!existing) {
                    return;
                }
                const scope = deriveEventScope(state, activeStepsRef.current);
                const node = existing.node || scope.node;
                const taskName = existing.taskName || scope.taskName;
                const toolName = existing.toolName;
                const args = existing.args || {};
                const scopeDetail = existing.scopeDetail || scope.detail;

                toolCallsRef.current.delete(message.toolCallId);

                const payload = buildToolPayload({
                    toolName,
                    args,
                    status: 'completed',
                    result: message.content,
                    callId: message.toolCallId,
                    node,
                    taskName,
                    message: `${toolName}: completed`,
                    scopeDetail,
                });
                if (!payload) return;
                enqueueStateUpdate(() => {
                    setEvents((prev) => [...prev, payload]);
                });
            },
            // ─────────── DEV 探针：AG-UI 原始接收事件 ───────────
            // 用于核对 ag_ui_langgraph 转出的 rawEvent.metadata / standard event payload。
            ...(import.meta.env.DEV ? {
                onEvent: ({ event }) => {
                    logAguiEvent(event);
                },
            } : {}),
            onRunFailed: ({ error: runError }) => {
                enqueueStateUpdate(() => {
                    setError(runError?.message || 'Agent 运行失败');
                });
            },
            onRunErrorEvent: ({ event }) => {
                enqueueStateUpdate(() => {
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
        activeStepsRef.current = [];
        lastTodosSnapshotRef.current = '';
        textMessageMetaRef.current.clear();
        toolCallsRef.current.clear();
        completedToolCallIdsRef.current.clear();
        reasoningRef.current.clear();
        setError(null);
        setCompletedDetail(null);
        setHasStarted(true);

        // AG-UI runAgent 需要至少一条 user message 作为本次任务入口
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
        activeStepsRef.current = [];
        lastTodosSnapshotRef.current = '';
        textMessageMetaRef.current.clear();
        toolCallsRef.current.clear();
        completedToolCallIdsRef.current.clear();
        reasoningRef.current.clear();
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
