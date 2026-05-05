import { Message, MessageContent, MessageResponse } from '@/components/ai-elements/message';

/**
 * AI 消息 Widget。
 *
 * 视觉契约:
 *   - 按 AI Elements Conversation 示例直接渲染 Message/MessageContent
 *   - 不在这里重复渲染 reasoning,交给 Reasoning widget
 *
 * 数据来源:AGUI 标准 TextMessageEnd → detail.content
 */
export default function AIMessageWidget({ event }) {
    const detail = event.detail || {};
    const content = (detail.content || '').trim();

    if (!content) return null;

    return (
        <Message from="assistant" className="max-w-full">
            <MessageContent>
                <MessageResponse>{content}</MessageResponse>
            </MessageContent>
        </Message>
    );
}
