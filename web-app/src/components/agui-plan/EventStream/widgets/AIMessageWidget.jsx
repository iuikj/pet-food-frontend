import { Message, MessageContent, MessageResponse } from '@/components/ai-elements/message';

/**
 * AI 消息 Widget。
 *
 * 视觉契约:
 *   - 按 AI Elements Conversation 示例直接渲染 Message/MessageContent
 *   - 不在这里重复渲染 reasoning,交给 Reasoning widget
 *   - 流式期间（is_streaming=true）即使 content 为空也保留气泡 + 闪烁光标，避免首 chunk 前空帧
 *
 * 数据来源:AGUI 标准 TextMessageStart/Content/End → detail.content / detail.is_streaming
 */
export default function AIMessageWidget({ event }) {
    const detail = event.detail || {};
    const content = (detail.content || '').trim();
    const isStreaming = !!detail.is_streaming;

    if (!content && !isStreaming) return null;

    return (
        <Message from="assistant" className="max-w-full">
            <MessageContent className="agui-ai-message-content">
                {content ? (
                    <MessageResponse className="agui-ai-message-response">{content}</MessageResponse>
                ) : (
                    <span className="agui-ai-message-cursor inline-block h-3.5 w-1.5 align-baseline bg-current opacity-60 animate-pulse" />
                )}
            </MessageContent>
        </Message>
    );
}
