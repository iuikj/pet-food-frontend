import { Tool, ToolHeader, ToolContent, ToolInput, ToolOutput } from '@/components/ai-elements/tool';
import { toToolUIPart } from '@/lib/aiElementsAdapter';

/**
 * 通用工具调用 Widget — 兜底渲染。
 *
 * 数据契约:emit_tool_call(status='started'|'completed'|'error') → detail.{tool_name, args, result, status, call_id}
 * mergeToolCalls 已合并 started+completed,这里只看最新状态。
 */
export default function GenericToolWidget({ event }) {
    const part = toToolUIPart(event);
    return (
        <Tool className="agui-tool-card">
            <ToolHeader className="agui-tool-header" type={part.type} state={part.state} />
            <ToolContent className="agui-tool-content">
                {part.input && Object.keys(part.input).length > 0 && (
                    <ToolInput className="agui-tool-io" input={part.input} />
                )}
                <ToolOutput className="agui-tool-io" output={part.output} errorText={part.errorText} />
            </ToolContent>
        </Tool>
    );
}
