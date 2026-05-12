import { Shimmer } from '@/components/ai-elements/shimmer';
import { CheckCircle2, AlertCircle } from 'lucide-react';

/**
 * 阶段标记 Widget — 单行轻量提示 (Shimmer / 完成 / 错误)。
 */
export default function PhaseMarkerWidget({ event }) {
    const message = event.message || event.detail?.content || event.type;
    const isError = event.type === 'error';
    const isCompleted = event.type === 'completed' || event.type === 'task_completed';

    if (isError) {
        return (
            <div className="agui-phase-marker agui-phase-marker--error">
                <AlertCircle className="size-4 shrink-0" />
                <span>{message}</span>
            </div>
        );
    }

    if (isCompleted) {
        return (
            <div className="agui-phase-marker agui-phase-marker--done">
                <CheckCircle2 className="size-4 shrink-0" />
                <span>{message}</span>
            </div>
        );
    }

    return (
        <div className="agui-phase-marker">
            <Shimmer>{message}</Shimmer>
        </div>
    );
}
