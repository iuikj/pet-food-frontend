import { Tool, ToolHeader, ToolContent, ToolInput } from '@/components/ai-elements/tool';
import { MessageResponse } from '@/components/ai-elements/message';
import { toToolUIPart } from '@/lib/aiElementsAdapter';

/**
 * 笔记读取 Widget — Tool 容器 + 用 Streamdown 渲染笔记 markdown 内容。
 * 同时覆盖 query_note / ls / query_shared_note。
 */
export default function NoteReadWidget({ event }) {
    const part = toToolUIPart(event);
    const noteText = typeof part.output === 'string'
        ? part.output
        : (part.output ? JSON.stringify(part.output, null, 2) : '');
    return (
        <Tool className="agui-tool-card">
            <ToolHeader className="agui-tool-header" type={part.type} state={part.state} />
            <ToolContent className="agui-tool-content">
                {part.input && Object.keys(part.input).length > 0 && (
                    <ToolInput className="agui-tool-io" input={part.input} />
                )}
                {noteText && (
                    <div className="rounded-[18px] border border-white/[0.55] bg-white/[0.48] p-3 text-xs">
                        <h4 className="mb-2 font-medium uppercase tracking-wide text-muted-foreground text-xs">
                            笔记
                        </h4>
                        <MessageResponse>{noteText}</MessageResponse>
                    </div>
                )}
                {part.errorText && (
                    <div className="text-destructive text-xs">{part.errorText}</div>
                )}
            </ToolContent>
        </Tool>
    );
}
