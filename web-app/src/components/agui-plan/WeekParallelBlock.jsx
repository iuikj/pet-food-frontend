import { Layers } from 'lucide-react';
import WeekAgentCard from './WeekAgentCard';

/**
 * Inline GenUI 嵌入块 — 由 TimelineFeed 检测到第一个 week_dispatch 事件时插入到主流。
 *
 * 视觉契约:作为时间流里的轻量分组，不再额外套大卡片。
 * buckets[N] 为 organizeEventsForTimeline 派发到第 N 周的事件数组。
 */
export default function WeekParallelBlock({ buckets }) {
    const startedCount = Object.values(buckets || {}).filter((b) => b && b.length > 0).length;

    return (
        <section className="my-2">
            <header className="mb-3 flex items-center gap-2">
                <Layers className="size-4 text-muted-foreground" />
                <h4 className="text-sm font-medium">4 周并行 SubAgent</h4>
                <span className="ml-auto text-[10px] text-muted-foreground">
                    {startedCount}/4 已启动
                </span>
            </header>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {[1, 2, 3, 4].map((n) => (
                    <WeekAgentCard key={n} weekNumber={n} events={(buckets || {})[n] || []} />
                ))}
            </div>
        </section>
    );
}
