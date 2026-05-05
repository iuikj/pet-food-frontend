import { Tool, ToolHeader, ToolContent, ToolInput, ToolOutput } from '@/components/ai-elements/tool';
import { MessageResponse } from '@/components/ai-elements/message';
import { toToolUIPart } from '@/lib/aiElementsAdapter';

/**
 * 笔记写入 Widget — 优先展示 args.content (写入内容),其次 args 整体。
 * 覆盖 write_note / week_write_note / update_note。
 */
export default function NoteWriteWidget({ event }) {
    const part = toToolUIPart(event);
    const writeContent =
        part.input?.content || part.input?.text || part.input?.note || part.input?.new_content || '';
    return (
        <Tool>
            <ToolHeader type={part.type} state={part.state} />
            <ToolContent>
                {writeContent ? (
                    <div className="rounded-md bg-muted/30 p-3 text-xs">
                        <h4 className="mb-2 font-medium uppercase tracking-wide text-muted-foreground text-xs">
                            写入内容
                        </h4>
                        <MessageResponse>{writeContent}</MessageResponse>
                    </div>
                ) : (
                    <ToolInput input={part.input} />
                )}
                <ToolOutput output={part.output} errorText={part.errorText} />
            </ToolContent>
        </Tool>
    );
}
