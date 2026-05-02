import { Layers } from 'lucide-react';
import WeekAgentCard from './WeekAgentCard';

/**
 * Inline GenUI 嵌入块 — 由 TimelineFeed 检测到第一个 week_dispatch 事件时插入到主流。
 *
 * 视觉契约:虚线边框 + sage green 强调,4 张折叠卡 (sm 屏 2x2,手机 1 列 4 行)。
 * buckets[N] 为 organizeEventsForTimeline 派发到第 N 周的事件数组。
 */
export default function WeekParallelBlock({ buckets }) {
    const startedCount = Object.values(buckets || {}).filter((b) => b && b.length > 0).length;

    return (
        <section className="my-2 rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 p-3 sm:p-4">
            <header className="mb-3 flex items-center gap-2">
                <Layers className="size-4 text-primary" />
                <h4 className="text-sm font-bold">4 周并行 SubAgent</h4>
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
