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
        title: event.detail?.task_name || '任务规划',
        action: event.detail?.action || 'updated',
        steps: items.map((it, i) => ({
            id: String(i),
            description: typeof it === 'string' ? it : (it.content || it.description || ''),
            status: typeof it === 'object' ? (it.status || 'pending') : 'pending',
        })),
    };
}

/**
 * detail.result (search 工具返回) → AI Elements <Sources> 期望的数组
 * 容错:result 可能是 array / JSON 字符串 / { results: [...] } 形状
 */
export function toAiSdkSources(event) {
    const r = event.detail?.result;
    if (!r) return [];
    let raw = r;
    if (typeof r === 'string') {
        try { raw = JSON.parse(r); } catch { return []; }
    }
    const list = Array.isArray(raw) ? raw : (raw?.results || raw?.sources || []);
    return list
        .filter((it) => it && (it.url || it.href))
        .map((it) => ({
            url: it.url || it.href,
            title: it.title || it.name || it.url || it.href,
            snippet: it.snippet || it.content || it.description || '',
        }));
}
