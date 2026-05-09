/**
 * Event presentation helpers — 把 ProgressEvent 转成卡面"已完成 / 进行中 / 失败"语义。
 *
 * 抽出来便于 EventPreviewStack（卡面预览）+ FanoutCard 等多处共用，
 * 避免和 React 组件文件混在一起触发 react-refresh/only-export-components。
 */

export function eventDone(event) {
    const detail = event.detail || {};
    return (
        event.type === 'completed' ||
        event.type === 'task_completed' ||
        event.type === 'week_completed' ||
        detail.status === 'completed' ||
        detail.status === 'output-available'
    );
}

export function eventErrored(event) {
    return event.type === 'error' || event.detail?.status === 'error';
}

export function previewCommand(event) {
    const detail = event.detail || {};
    const viewType = detail.view_type;
    const suffix = eventErrored(event) ? '失败' : (eventDone(event) ? '已完成' : '进行中');

    if (viewType?.startsWith('tool_') || event.type === 'tool_call') {
        if (viewType === 'tool_search') return `资料检索${suffix}`;
        if (viewType === 'tool_note_read') return `读取营养资料${suffix}`;
        if (viewType === 'tool_note_write') return `整理阶段笔记${suffix}`;
        if (viewType === 'tool_food_calc') return `营养计算${suffix}`;
        return `工具调用${suffix}`;
    }
    if (viewType === 'reasoning') {
        return eventDone(event) ? '推理完成' : '正在推理方案';
    }
    if (viewType === 'ai_message') {
        return `生成说明${suffix}`;
    }
    if (event.type === 'plan_snapshot') {
        return `任务队列${suffix}`;
    }
    return `${detail.task_name || event.task_name || event.message || '事件更新'} ${suffix}`;
}
