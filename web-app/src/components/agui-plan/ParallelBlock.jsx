import FanoutStack from './FanoutStack';

/**
 * ParallelBlock — fanout 平行块统一容器。
 *
 * 取代 SubAgentParallelBlock / WeekParallelBlock 的同构外壳：标题 + count 徽章 +
 * <FanoutStack variant>。两侧只在 title / count 计算 / 数据兜底策略上有差异。
 *
 * 视觉契约：作为时间流里的轻量分组，不再额外套大卡片；与原两个 Block 等价。
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

export default function ParallelBlock({
    variant = 'subagent',
    cards,
    buckets,
    openDetail,
    title,
    countLabel,
    skipWhenEmpty = true,
}) {
    // Week variant：cards 缺失时由 buckets 兜底；SubAgent variant：直接用 cards。
    const resolvedCards = variant === 'week'
        ? (cards?.length ? cards : fallbackWeekCards(buckets))
        : cards;

    // SubAgent 缺数据直接不渲染（与原 SubAgentParallelBlock 一致）；
    // Week 即使无数据也照常渲染（占位卡由 FanoutStack 内部补齐），与原 WeekParallelBlock 一致。
    if (skipWhenEmpty && variant !== 'week' && !resolvedCards?.length) return null;

    const resolvedTitle = title ?? (variant === 'week' ? '周计划 Agent' : '子 Agent 空间');
    const resolvedCount = countLabel ?? (variant === 'week'
        ? '4 个阶段'
        : `${resolvedCards?.length ?? 0} 个任务`);

    return (
        <section className="my-1">
            <div className="mb-3 flex items-center justify-between">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--agui-muted)]">
                    {resolvedTitle}
                </p>
                <span className="rounded-full border border-white/60 dark:border-white/10 bg-white/[0.58] dark:bg-white/[0.06] px-2.5 py-1 text-[10px] text-[var(--agui-muted)] backdrop-blur-xl">
                    {resolvedCount}
                </span>
            </div>
            <FanoutStack
                variant={variant}
                cards={resolvedCards}
                buckets={buckets}
                openDetail={openDetail}
            />
        </section>
    );
}
