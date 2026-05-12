import ParallelBlock from './ParallelBlock';

/**
 * WeekParallelBlock — 薄包装，转发给 ParallelBlock variant='week'。
 *
 * 实现已统一到 ParallelBlock（与 SubAgentParallelBlock 共用外壳）。本文件保留为
 * 兼容入口，由 TimelineFeed 检测到第一个 week_dispatch 事件时插入到主流。
 * cards 缺失时从 buckets 兜底的策略也已下沉到 ParallelBlock。
 */
export default function WeekParallelBlock({ buckets, cards, openDetail }) {
    return (
        <ParallelBlock
            variant="week"
            cards={cards}
            buckets={buckets}
            openDetail={openDetail}
        />
    );
}
