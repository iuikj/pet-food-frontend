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
            <div className="flex items-center gap-2 px-1 py-1 text-xs text-destructive">
                <AlertCircle className="size-4 shrink-0" />
                <span>{message}</span>
            </div>
        );
    }

    if (isCompleted) {
        return (
            <div className="flex items-center gap-2 px-1 py-1 text-sm font-medium text-emerald-700">
                <CheckCircle2 className="size-4 shrink-0" />
                <span>{message}</span>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-2 px-1 py-1 text-xs text-muted-foreground">
            <Shimmer>{message}</Shimmer>
        </div>
    );
}
