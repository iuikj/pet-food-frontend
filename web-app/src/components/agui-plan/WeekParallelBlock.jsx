import WeekAgentCard from './WeekAgentCard';

/**
 * Inline GenUI 嵌入块 — 由 TimelineFeed 检测到第一个 week_dispatch 事件时插入到主流。
 *
 * 视觉契约:作为时间流里的轻量分组，不再额外套大卡片。
 * buckets[N] 为 organizeEventsForTimeline 派发到第 N 周的事件数组。
 */
function fallbackWeekCards(buckets) {
    return [1, 2, 3, 4]
        .filter((n) => (buckets || {})[n]?.length > 0)
        .map((n) => ({
            id: n,
            weekNumber: n,
            target: `week_agent_${n}`,
            taskName: `第${n}周饮食计划`,
        }));
}

export default function WeekParallelBlock({ buckets, cards }) {
    const weekCards = cards?.length ? cards : fallbackWeekCards(buckets);
    if (!weekCards.length) return null;

    return (
        <section className="my-1">
            <div className="mb-3 flex items-center justify-between">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--agui-muted)]">
                    周计划 Agent
                </p>
                <span className="rounded-full border border-white/60 bg-white/[0.58] px-2.5 py-1 text-[10px] text-[var(--agui-muted)] backdrop-blur-xl">
                    {weekCards.length} 个阶段
                </span>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {weekCards.map((card) => (
                    <WeekAgentCard
                        key={card.id}
                        card={card}
                        events={(buckets || {})[card.weekNumber || card.id] || []}
                    />
                ))}
            </div>
        </section>
    );
}
