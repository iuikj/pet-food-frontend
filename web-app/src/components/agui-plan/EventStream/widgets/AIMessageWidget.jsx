import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { Message, MessageContent, MessageResponse } from '@/components/ai-elements/message';
import { Reasoning, ReasoningTrigger, ReasoningContent } from '@/components/ai-elements/reasoning';
import { Sparkles, ChevronDown } from 'lucide-react';

/**
 * AI 消息 Widget。
 *
 * 视觉契约:
 *   - 短消息 (≤80 字符且单行) → 直接 Message + MessageResponse 完整显示
 *   - 长消息 → ai-elements 风格 Collapsible (与 Tool 卡片同款视觉),trigger 显示首行 + ...
 *   - reasoning (thinking) 字段单独 Reasoning 卡片,默认折叠
 *
 * 数据来源:emit_ai_message → detail.content / detail.reasoning
 */
const SHORT_LIMIT = 80;

export default function AIMessageWidget({ event }) {
    const detail = event.detail || {};
    const content = (detail.content || '').trim();
    const reasoning = (detail.reasoning || '').trim();

    if (!content && !reasoning) return null;

    const lines = content ? content.split('\n') : [];
    const isShort = content.length <= SHORT_LIMIT && lines.length <= 1;
    const firstLine = lines[0] ? lines[0].slice(0, SHORT_LIMIT) : '';
    const hasMore = content.length > firstLine.length || lines.length > 1;

    return (
        <div className="space-y-2">
            {reasoning && (
                <Reasoning defaultOpen={false} isStreaming={false}>
                    <ReasoningTrigger />
                    <ReasoningContent>{reasoning}</ReasoningContent>
                </Reasoning>
            )}

            {content && (isShort ? (
                <Message from="assistant">
                    <MessageContent>
                        <MessageResponse>{content}</MessageResponse>
                    </MessageContent>
                </Message>
            ) : (
                <Collapsible className="not-prose w-full rounded-md border bg-card">
                    <CollapsibleTrigger className="group flex w-full items-center justify-between gap-3 p-3 text-left">
                        <div className="flex min-w-0 items-center gap-2">
                            <Sparkles className="size-4 shrink-0 text-primary" />
                            <span className="truncate text-sm font-medium">
                                {firstLine}{hasMore ? '...' : ''}
                            </span>
                        </div>
                        <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-data-[panel-open]:rotate-180" />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="border-t px-4 pb-4 pt-3 text-sm">
                        <MessageResponse>{content}</MessageResponse>
                    </CollapsibleContent>
                </Collapsible>
            ))}
        </div>
    );
}
