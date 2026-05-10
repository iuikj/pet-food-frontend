/**
 * CopilotKit detail.* 数据 → AI Elements 期望的形状的薄适配层。
 *
 * 设计目标:不改后端事件 schema,前端只在渲染前把 detail 重塑成 AI SDK 形状。
 * 50 行内,纯函数,无状态。
 */

/**
 * detail → AI Elements <Tool> 期望的 ToolUIPart
 * 使用契约:`<ToolHeader type={part.type} state={part.state} />` + `<ToolInput input={part.input} />` + `<ToolOutput output={part.output} errorText={part.errorText} />`
 */
export function toToolUIPart(event) {
    const d = event.detail || {};
    const stateMap = {
        started: 'input-available',
        completed: d.result !== undefined && d.result !== null ? 'output-available' : 'output-error',
        error: 'output-error',
    };
    const toolName = d.tool_name || 'unknown';
    return {
        // ToolHeader 内部会做 split("-").slice(1).join("-") 取显示名,必须 "tool-" 前缀
        type: `tool-${toolName}`,
        toolCallId: d.call_id || `${event.timestamp}_${toolName}`,
        state: stateMap[d.status] || 'input-streaming',
        input: d.args ?? {},
        output: d.result ?? null,
        errorText: d.status === 'error' ? String(d.result || 'Tool execution failed') : undefined,
    };
}

/**
 * detail.items (DeepAgent todo 列表) → 简化 plan 结构
 * 调用方按 steps 循环渲染,自由组合 PlanHeader/PlanContent。
 */
export function toAiSdkPlan(event) {
    const items = event.detail?.items || [];
    return {
        title: event.task_name || event.detail?.task_name || '任务规划',
        action: event.detail?.action || 'updated',
        steps: items.map((it, i) => ({
            id: String(i),
            description: typeof it === 'string' ? it : (it.content || it.description || ''),
            status: typeof it === 'object' ? (it.status || 'pending') : 'pending',
        })),
    };
}

export function toQueueSections(event) {
    const detail = event.detail || {};
    const items = detail.items || [];
    const pending = [];
    const completed = [];

    items.forEach((item, index) => {
        const description = typeof item === 'string' ? item : (item.content || item.description || '');
        const status = typeof item === 'object' ? (item.status || 'pending') : 'pending';
        const entry = {
            id: String(index),
            description,
            status,
            completed: status === 'done' || status === 'completed',
        };
        if (entry.completed) {
            completed.push(entry);
        } else {
            pending.push(entry);
        }
    });

    return [
        {
            key: 'pending',
            label: '项进行中任务',
            count: pending.length,
            defaultOpen: true,
            items: pending,
        },
        {
            key: 'completed',
            label: '项已完成任务',
            count: completed.length,
            defaultOpen: completed.length > 0,
            items: completed,
        },
    ].filter((section) => section.count > 0);
}

export function toQueueDispatch(event) {
    const detail = event.detail || {};
    const week = detail.week_number;
    const target = detail.target || 'subagent';
    const taskName = detail.task_name || event.message || '待处理任务';
    const isWeek = target === 'week_agent' || detail.view_type === 'week_dispatch';

    return {
        title: isWeek ? '周任务分发' : 'Subagent 委派',
        sections: [
            {
                key: 'active',
                label: isWeek ? '项周任务' : '项委派任务',
                count: 1,
                defaultOpen: true,
                items: [
                    {
                        id: `${target}-${week ?? 'main'}`,
                        description: taskName,
                        status: 'in_progress',
                        completed: false,
                        meta: isWeek && week ? `W${week}` : target,
                    },
                ],
            },
        ],
    };
}

/**
 * detail.result (search 工具返回) → AI Elements <Sources> 期望的数组
 * 容错:result 可能是 array / JSON 字符串 / { results: [...] } / { sources: [...] } / { items: [...] } 形状
 *
 * PR3 ADR-003 方案 A 兜底（详见 research/event-stream-distribution.md）：
 *   传入可选 allEvents 时，若 event.detail.result 缺失，按 call_id 回查同 call_id 事件取 result。
 *
 * title 仍 fallback 到 url 以兼容 <Source> 直接展示;
 * 若消费方需要 hostname 风格,自行用 new URL(s.url).hostname 处理。
 */
export function toAiSdkSources(event, allEvents) {
    let r = event?.detail?.result;
    if ((r === undefined || r === null) && Array.isArray(allEvents)) {
        const cid = event?.detail?.call_id;
        if (cid) {
            const sibling = allEvents.find(
                (e) => e !== event && e?.detail?.call_id === cid && e?.detail?.result !== undefined && e?.detail?.result !== null,
            );
            if (sibling) r = sibling.detail.result;
        }
    }
    if (r === undefined || r === null) return [];
    let raw = r;
    if (typeof r === 'string') {
        try { raw = JSON.parse(r); } catch { return []; }
    }
    const list = Array.isArray(raw)
        ? raw
        : (raw?.results || raw?.sources || raw?.items || raw?.data || []);
    return list
        .filter((it) => it && (it.url || it.href || it.link))
        .map((it) => ({
            url: it.url || it.href || it.link,
            title: it.title || it.name || it.url || it.href || it.link,
            snippet: it.snippet || it.content || it.description || '',
        }));
}
