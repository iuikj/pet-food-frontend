import { Reasoning, ReasoningTrigger, ReasoningContent } from '@/components/ai-elements/reasoning';

/**
 * 独立 reasoning 事件 Widget。
 * 大多数场景 reasoning 会随 ai_message 一起到达,此 widget 仅处理后端单独 emit reasoning 的情况。
 */
export default function ReasoningWidget({ event }) {
    const text = (event.detail?.content || event.detail?.reasoning || event.message || '').trim();
    if (!text) return null;
    return (
        <Reasoning defaultOpen={false} isStreaming={false}>
            <ReasoningTrigger />
            <ReasoningContent>{text}</ReasoningContent>
        </Reasoning>
    );
}
