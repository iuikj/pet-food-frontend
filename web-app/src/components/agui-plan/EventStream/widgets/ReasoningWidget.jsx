import {
    Reasoning,
    ReasoningContent,
    ReasoningTrigger,
} from '@/components/ai-elements/reasoning';

/**
 * 独立 reasoning 事件 Widget。
 * 使用 AI Elements Reasoning 承载 AG-UI REASONING_MESSAGE_* 的连续流。
 */
export default function ReasoningWidget({ event }) {
    const text = (event.detail?.content || event.detail?.reasoning || event.message || '').trim();
    if (!text) return null;
    return (
        <Reasoning className="w-full" isStreaming={event.detail?.is_streaming}>
            <ReasoningTrigger />
            <ReasoningContent>{text}</ReasoningContent>
        </Reasoning>
    );
}
