import {
    Reasoning,
    ReasoningContent,
    ReasoningTrigger,
    useReasoning,
} from '@/components/ai-elements/reasoning';
import { Shimmer } from '@/components/ai-elements/shimmer';
import { ChevronDown } from 'lucide-react';

function ThoughtLine() {
    const { duration, isOpen, isStreaming } = useReasoning();
    const label = duration === undefined
        ? '思考了几秒'
        : `思考了 ${duration} 秒`;

    return (
        <>
            <span className="agui-reasoning-pulse" />
            <span className="min-w-0 flex-1 truncate">
                {isStreaming ? (
                    <Shimmer duration={1}>正在推理方案...</Shimmer>
                ) : label}
            </span>
            <ChevronDown className={`size-3.5 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : 'rotate-0'}`} />
        </>
    );
}

/**
 * 独立 reasoning 事件 Widget。
 * 使用 AI Elements Reasoning 承载 AG-UI REASONING_MESSAGE_* 的连续流。
 */
export default function ReasoningWidget({ event }) {
    const text = (event.detail?.content || event.detail?.reasoning || event.message || '').trim();
    if (!text) return null;
    return (
        <Reasoning className="agui-reasoning w-full" isStreaming={event.detail?.is_streaming}>
            <ReasoningTrigger className="agui-reasoning-trigger">
                <ThoughtLine />
            </ReasoningTrigger>
            <ReasoningContent className="agui-reasoning-content">{text}</ReasoningContent>
        </Reasoning>
    );
}
