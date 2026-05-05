/**
 * widgetRegistry — view_type 到 Widget 组件的单一映射表。
 *
 * 后端在 detail.view_type 中给出渲染意图,前端按此处映射查找 Widget。
 * 新增 view_type 时:
 *   1. 后端 src/agent/common/view_types.py 加新 ViewType 值
 *   2. 前端 widgetRegistry 加映射
 *   3. 创建对应的 Widget 组件
 */
import AIMessageWidget from './widgets/AIMessageWidget';
import ReasoningWidget from './widgets/ReasoningWidget';
import GenericToolWidget from './widgets/GenericToolWidget';
import SearchToolWidget from './widgets/SearchToolWidget';
import NoteReadWidget from './widgets/NoteReadWidget';
import NoteWriteWidget from './widgets/NoteWriteWidget';
import PlanBoardWidget from './widgets/PlanBoardWidget';
import SubagentDispatchWidget from './widgets/SubagentDispatchWidget';
import PhaseMarkerWidget from './widgets/PhaseMarkerWidget';

export const widgetRegistry = {
    // 通用对话流元素
    ai_message:        AIMessageWidget,
    reasoning:         ReasoningWidget,

    // 工具调用 Widget (按 tool_name 路由)
    tool_call_generic: GenericToolWidget,
    tool_search:       SearchToolWidget,
    tool_note_read:    NoteReadWidget,
    tool_note_write:   NoteWriteWidget,
    tool_food_calc:    GenericToolWidget,    // 占位,未来定制

    // DeepAgent 结构化 Widget
    plan_board:        PlanBoardWidget,
    subagent_dispatch: SubagentDispatchWidget,
    week_dispatch:     SubagentDispatchWidget,

    // 阶段元事件
    phase_marker:      PhaseMarkerWidget,
    progress_tick:     null,    // 不渲染；AG-UI run 页面不再消费百分比 progress
};

/** 按 view_type 取 Widget;仅 tool_* 未注册项回落到 GenericToolWidget */
export function getWidget(viewType) {
    if (!viewType) return null;
    if (viewType in widgetRegistry) return widgetRegistry[viewType];
    if (viewType.startsWith('tool_')) return GenericToolWidget;
    return null;
}

/** 用于 DEV 模式排查未识别的 view_type */
export function isKnownViewType(viewType) {
    return !!viewType && viewType in widgetRegistry;
}
