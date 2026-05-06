/**
 * AGUI Plan 事件流工具函数库
 *
 * 后端 emit_progress 双发的 ProgressEvent 通过 ag_ui_langgraph 转成 AG-UI CUSTOM 事件,
 * 前端 agent.subscribe(onCustomEvent) 收到后,用此处的工具函数派生：
 *   - 按 phase 分桶 (research / dispatch / weeks / finalize)
 *   - 按 node 分桶 (research_planner / week_agent_1..4 / structure / gather)
 *   - 按 call_id 合并 tool_call started + completed 两条事件为同一卡片
 *   - 派生 4 周状态、当前 phase
 */

// ── 19 + 6 种 ProgressEventType 的 UI 元数据 ──
// phase: 控制时间线归属; icon/color: 控制 Widget 颜色 (Tailwind 类名片段)
export const EVENT_META = {
    // Phase 1: 研究阶段 (5–25%)
    research_starting:        { phase: 'research', icon: 'science',           color: 'amber'   },
    plan_creating:            { phase: 'research', icon: 'pending_actions',   color: 'amber'   },
    plan_created:             { phase: 'research', icon: 'list_alt',          color: 'amber'   },
    plan_updated:             { phase: 'research', icon: 'pending_actions',   color: 'amber'   },
    plan_snapshot:            { phase: 'research', icon: 'checklist',         color: 'amber'   },
    task_delegating:          { phase: 'research', icon: 'forward_to_inbox',  color: 'amber'   },
    research_task_delegating: { phase: 'research', icon: 'forward_to_inbox',  color: 'amber'   },
    task_executing:           { phase: 'research', icon: 'play_circle',       color: 'amber'   },
    task_searching:           { phase: 'research', icon: 'travel_explore',    color: 'blue'    },
    task_querying_note:       { phase: 'research', icon: 'description',       color: 'gray'    },
    task_completed:           { phase: 'research', icon: 'check_circle',      color: 'green'   },
    note_saving:              { phase: 'research', icon: 'edit_note',         color: 'purple'  },
    note_saved:               { phase: 'research', icon: 'bookmark_added',    color: 'green'   },
    summary_generating:       { phase: 'research', icon: 'short_text',        color: 'gray'    },
    summary_generated:        { phase: 'research', icon: 'subject',           color: 'gray'    },
    research_finalizing:      { phase: 'research', icon: 'auto_awesome',      color: 'amber'   },

    // Phase 2: 分发 + 周计划并行 (~30–78%)
    dispatching:              { phase: 'dispatch', icon: 'splitscreen',       color: 'primary' },
    week_planning:            { phase: 'weeks',    icon: 'edit_note',         color: 'amber'   },
    week_searching:           { phase: 'weeks',    icon: 'travel_explore',    color: 'blue'    },
    week_plan_ready:          { phase: 'weeks',    icon: 'fact_check',        color: 'purple'  },
    week_writing:             { phase: 'weeks',    icon: 'draw',              color: 'purple'  },
    week_completed:           { phase: 'weeks',    icon: 'task_alt',          color: 'primary' },

    // Phase 3: 结构化 + 汇总 (80–100%)
    gathering:                { phase: 'finalize', icon: 'merge',             color: 'primary' },
    structuring:              { phase: 'finalize', icon: 'data_object',       color: 'primary' },
    structuring_retry:        { phase: 'finalize', icon: 'replay',            color: 'amber'   },
    structured:               { phase: 'finalize', icon: 'verified',          color: 'green'   },
    completed:                { phase: 'finalize', icon: 'celebration',       color: 'primary' },

    // 聊天式事件流 (跨 phase,具体归属由 node 决定)
    ai_message:               { phase: null,       icon: 'smart_toy',         color: 'primary' },
    reasoning:                { phase: null,       icon: 'psychology',        color: 'gray'    },
    tool_call:                { phase: null,       icon: 'build_circle',      color: 'gray'    },

    // 通用
    error:                    { phase: 'error',    icon: 'error',             color: 'red'     },
    info:                     { phase: null,       icon: 'info',              color: 'gray'    },
};

function weekNumberFromEvent(ev) {
    const detailWeek = ev.detail?.week_number ?? ev.detail?.week;
    const parsedDetailWeek = Number(detailWeek);
    if (Number.isFinite(parsedDetailWeek)) return parsedDetailWeek;
    return null;
}

function isWeekScopedEvent(ev) {
    return !!weekNumberFromEvent(ev) && ev.detail?.agent_scope === 'week';
}

/** 把所有事件按周分桶。只使用 detail.week_number / detail.week 作为归属依据 */
export function bucketByWeek(events) {
    const buckets = { 1: [], 2: [], 3: [], 4: [] };
    for (const e of events) {
        const n = weekNumberFromEvent(e);
        if (buckets[n]) buckets[n].push(e);
    }
    return buckets;
}

/** 把事件按 graph 节点分桶。便于 PhaseTimeline 各 Phase 内按 node 渲染 */
export function bucketByNode(events) {
    const out = {};
    for (const e of events) {
        const k = e.node ?? 'unknown';
        (out[k] ||= []).push(e);
    }
    return out;
}

/** 派生当前 phase。优先级:有 completed → done; 有 error → error; 否则按最近事件的 phase */
export function derivePhase(events, isRunning) {
    if (events.some((e) => e.type === 'completed')) return 'done';
    if (events.some((e) => e.type === 'error')) return 'error';
    const last = events[events.length - 1];
    if (!last) return isRunning ? 'starting' : 'idle';

    // 节点名优先于 type 推 phase (因为 ai_message/tool_call/reasoning 没绑 phase)
    if (last.node?.startsWith('week_agent_')) return 'weeks';
    if (last.node === 'dispatch_weeks') return 'dispatch';
    if (last.node === 'collect_and_structure' || last.node === 'structure_report' || last.node === 'gather') return 'finalize';
    if (last.node === 'research_planner' || last.node === 'subagent' || last.node?.startsWith('subagent_') || last.node === 'write_note') return 'research';

    return EVENT_META[last.type]?.phase ?? 'starting';
}

/** 单周状态推导:基于最后一条 week_* 事件的类型 */
export function deriveWeekStatus(weekEvents, lifecycleEvents = []) {
    // 仅看 week_planning / week_searching / week_plan_ready / week_writing / week_completed
    const lifecycle = Array.isArray(lifecycleEvents)
        ? lifecycleEvents
        : (lifecycleEvents ? [lifecycleEvents] : []);
    const allEvents = [...lifecycle, ...(weekEvents || [])];
    const phaseEvents = allEvents.filter((e) => /^week_/.test(e.type));
    const last = phaseEvents[phaseEvents.length - 1];

    if (!last) {
        return (weekEvents || []).length > 0
            ? { key: 'active', label: '执行中', color: 'amber' }
            : { key: 'pending', label: '等待中', color: 'gray' };
    }

    const map = {
        week_planning:    { key: 'planning',  label: '规划中', color: 'amber'   },
        week_searching:   { key: 'searching', label: '检索中', color: 'blue'    },
        week_plan_ready:  { key: 'writing',   label: '撰写中', color: 'purple'  },
        week_writing:     { key: 'writing',   label: '撰写中', color: 'purple'  },
        week_completed:   { key: 'completed', label: '已完成', color: 'primary' },
    };
    const status = map[last.type] ?? { key: 'active', label: '执行中', color: 'amber' };
    return status;
}

export function deriveSubagentStatus(subagentEvents, lifecycleEvents = []) {
    const lifecycle = Array.isArray(lifecycleEvents)
        ? lifecycleEvents
        : (lifecycleEvents ? [lifecycleEvents] : []);
    const all = [...lifecycle, ...(subagentEvents || [])];
    if (all.some((e) => e.type === 'error' || e.detail?.status === 'error')) {
        return { key: 'error', label: '失败', color: 'red' };
    }
    if (lifecycle.some((e) => (
        e.type === 'task_completed' ||
        (
            e.detail?.view_type === 'subagent_dispatch' &&
            e.detail?.status === 'completed'
        )
    ))) {
        return { key: 'completed', label: '已完成', color: 'primary' };
    }
    if (all.some((e) => e.type === 'task_searching' || e.detail?.view_type === 'tool_search')) {
        return { key: 'searching', label: '检索中', color: 'blue' };
    }
    if (all.some((e) => e.type === 'task_executing') || (subagentEvents || []).length > 0) {
        return { key: 'active', label: '执行中', color: 'amber' };
    }
    return { key: 'pending', label: '等待中', color: 'gray' };
}

/** 把事件按 phase 分桶 (除聊天式事件,需按 node 二次推断) */
export function partitionByPhase(events) {
    const out = { research: [], dispatch: [], weeks: [], finalize: [], error: [] };
    for (const e of events) {
        // 有显式 phase 的优先用
        const phase = EVENT_META[e.type]?.phase;
        if (phase && out[phase]) {
            out[phase].push(e);
            continue;
        }
        // 聊天式事件 (ai_message/tool_call/reasoning) 按 node 推断 phase
        if (e.node?.startsWith('week_agent_')) {
            out.weeks.push(e);
        } else if (e.node === 'dispatch_weeks') {
            out.dispatch.push(e);
        } else if (e.node === 'gather' || e.node === 'collect_and_structure' || e.node === 'structure_report') {
            out.finalize.push(e);
        } else {
            // 默认归到 research (research_planner / subagent / write_note 等)
            out.research.push(e);
        }
    }
    return out;
}

/**
 * 工具调用合并:把 started + completed 两条同 call_id 事件合成一条。
 * 后续状态用最新事件覆盖,result 取 completed 那次的。
 */
export function mergeToolCalls(events) {
    const callIndex = new Map();   // call_id → 在 out 中的 index
    const out = [];

    for (const ev of events) {
        const isToolCall = ev.type === 'tool_call' || ev.detail?.view_type?.startsWith('tool_');
        const isSubagentDispatch = ev.detail?.view_type === 'subagent_dispatch';
        const callId = ev.detail?.call_id;
        const planSnapshotKey = ev.type === 'plan_snapshot' && (
            ev.detail?.source === 'state.todos' ||
            ev.detail?.tool_name === 'write_todos' ||
            ev.detail?.tool_name === 'update_todos' ||
            ev.detail?.tool_name === 'TodoWrite'
        )
            ? `plan:${ev.node ?? 'plan_agent'}:todos`
            : null;

        if (planSnapshotKey && callIndex.has(planSnapshotKey)) {
            const idx = callIndex.get(planSnapshotKey);
            out[idx] = {
                ...out[idx],
                ...ev,
                detail: { ...out[idx].detail, ...ev.detail },
                timestamp: ev.timestamp,
            };
            continue;
        }

        if ((isToolCall || isSubagentDispatch) && callId && callIndex.has(callId)) {
            // 合并:覆盖 detail (保留最新 status / result),更新 timestamp
            const idx = callIndex.get(callId);
            out[idx] = {
                ...out[idx],
                ...ev,
                detail: { ...out[idx].detail, ...ev.detail },
                timestamp: out[idx].timestamp || ev.timestamp,
            };
            continue;
        }

        out.push({ ...ev });
        if ((isToolCall || isSubagentDispatch) && callId) {
            callIndex.set(callId, out.length - 1);
        }
        if (planSnapshotKey) {
            callIndex.set(planSnapshotKey, out.length - 1);
        }
    }

    return out;
}

function subagentIdFromEvent(ev) {
    const detailId = ev.detail?.subagent_id || ev.detail?.subagent_info?.subagent_id;
    if (detailId) return String(detailId);
    return null;
}

function isSubagentScopedEvent(ev) {
    return !!subagentIdFromEvent(ev) && (
        ev.detail?.agent_scope === 'subagent'
    );
}

function isSubagentLifecycleEvent(ev) {
    return ev.detail?.view_type === 'subagent_dispatch';
}

function isWeekLifecycleEvent(ev) {
    return ev.detail?.agent_scope === 'week' && (
        ev.type === 'week_planning' ||
        ev.type === 'week_completed'
    );
}

function buildSubagentCardPatch(ev) {
    const status = ev.detail?.status;
    const taskName =
        ev.detail?.task_name ||
        ev.detail?.input_message ||
        ev.task_name ||
        ev.message ||
        'SubAgent 任务';
    return {
        target: ev.detail?.target || 'subagent',
        taskName,
        ...(status === 'completed'
            ? { completedEvent: ev }
            : { dispatchEvent: ev }),
    };
}

function buildWeekCardPatch(ev, weekNumber) {
    const taskName =
        ev.detail?.task_name ||
        ev.task_name ||
        ev.message ||
        `第${weekNumber}周饮食计划`;
    const base = {
        target: ev.detail?.agent_id || `week_agent_${weekNumber}`,
        taskName,
    };
    if (ev.detail?.view_type === 'week_dispatch') {
        return { ...base, dispatchEvent: ev };
    }
    if (ev.type === 'week_completed' || ev.detail?.status === 'completed') {
        return { ...base, completedEvent: ev };
    }
    return { ...base, startedEvent: ev };
}

function upsertCard(map, id, patch) {
    const existing = map.get(id) || { id };
    map.set(id, {
        ...existing,
        ...patch,
        dispatchEvent: existing.dispatchEvent || patch.dispatchEvent || null,
        startedEvent: existing.startedEvent || patch.startedEvent || null,
        completedEvent: patch.completedEvent || existing.completedEvent || null,
        taskName: patch.taskName || existing.taskName,
        target: patch.target || existing.target,
    });
}

/** 计算事件的稳定 React key (timestamp + call_id 或 node + type) */
export function eventKey(ev) {
    if (ev._kind === 'week_block') return 'week_block';
    if (ev._kind === 'subagent_block') return 'subagent_block';
    const callId = ev.detail?.call_id;
    if (callId) return `call:${callId}`;
    return `${ev.timestamp}|${ev.node ?? ''}|${ev.type}`;
}

/**
 * 时间流分流算法 (核心):
 *   1. 按 timestamp 升序
 *   2. 合并同 call_id 的 tool_call started+completed
 *   3. 带 week_number 的 week 标准事件 → 不进主流,吸附到 weekBuckets[N]
 *   4. week_dispatch / week lifecycle 事件 → 只更新 weekCards,主流当前位置插入虚拟节点 {_kind:'week_block'}
 *      触发 TimelineFeed 在该位置嵌入 <WeekParallelBlock>
 *   5. subagent_dispatch lifecycle 事件 → 只更新 subagentCards,不进入子 feed
 *   6. 带 subagent_id 的 subagent 标准事件 → 对应 subagent bucket,主流插入 {_kind:'subagent_block'}
 *
 * 返回 { mainStream, weekBuckets, weekCards, subagentBuckets, subagentCards }
 */
export function organizeEventsForTimeline(events, options = {}) {
    const sorted = [...events].sort((a, b) =>
        (a.timestamp || '').localeCompare(b.timestamp || '')
    );
    const merged = mergeToolCalls(sorted);
    if (options.nested) {
        return {
            mainStream: merged,
            weekBuckets: { 1: [], 2: [], 3: [], 4: [] },
            weekCards: [],
            subagentBuckets: {},
            subagentCards: [],
        };
    }

    const mainStream = [];
    const weekBuckets = { 1: [], 2: [], 3: [], 4: [] };
    const weekCardsByNumber = new Map();
    const subagentBuckets = {};
    const subagentCardsById = new Map();
    let weekBlockInserted = false;
    let subagentBlockInserted = false;

    for (const ev of merged) {
        const weekNumber = weekNumberFromEvent(ev);

        const isWeekDispatch = ev.detail?.view_type === 'week_dispatch';
        if (isWeekDispatch) {
            const week = weekNumber;
            if (weekBuckets[week]) {
                upsertCard(weekCardsByNumber, week, buildWeekCardPatch(ev, week));
            }
            if (!weekBlockInserted) {
                mainStream.push({ _kind: 'week_block', timestamp: ev.timestamp });
                weekBlockInserted = true;
            }
            continue;
        }

        if (isWeekScopedEvent(ev)) {
            const n = weekNumber;
            upsertCard(weekCardsByNumber, n, buildWeekCardPatch(ev, n));
            if (!isWeekLifecycleEvent(ev) && weekBuckets[n]) {
                weekBuckets[n].push(ev);
            }
            if (!weekBlockInserted) {
                mainStream.push({ _kind: 'week_block', timestamp: ev.timestamp });
                weekBlockInserted = true;
            }
            continue;
        }

        const isSubagentDispatch = ev.detail?.view_type === 'subagent_dispatch';
        if (isSubagentDispatch) {
            const id = subagentIdFromEvent(ev);
            if (!id) {
                mainStream.push(ev);
                continue;
            }
            upsertCard(subagentCardsById, id, buildSubagentCardPatch(ev));
            if (!subagentBlockInserted) {
                mainStream.push({ _kind: 'subagent_block', timestamp: ev.timestamp });
                subagentBlockInserted = true;
            }
            continue;
        }

        if (isSubagentScopedEvent(ev)) {
            const id = subagentIdFromEvent(ev);
            if (!isSubagentLifecycleEvent(ev)) {
                (subagentBuckets[id] ||= []).push(ev);
            }
            if (!subagentCardsById.has(id)) {
                subagentCardsById.set(id, {
                    id,
                    dispatchEvent: null,
                    target: ev.detail?.target || 'subagent',
                    taskName: ev.detail?.input_message || ev.task_name || ev.message || 'SubAgent 任务',
                });
            }
            if (!subagentBlockInserted) {
                mainStream.push({ _kind: 'subagent_block', timestamp: ev.timestamp });
                subagentBlockInserted = true;
            }
            continue;
        }

        mainStream.push(ev);
    }

    return {
        mainStream,
        weekBuckets,
        weekCards: Array.from(weekCardsByNumber.values())
            .sort((a, b) => Number(a.id) - Number(b.id)),
        subagentBuckets,
        subagentCards: Array.from(subagentCardsById.values()),
    };
}
