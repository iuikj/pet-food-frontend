import ParallelBlock from './ParallelBlock';

/**
 * SubAgentParallelBlock — 薄包装，转发给 ParallelBlock variant='subagent'。
 *
 * 实现已统一到 ParallelBlock（与 WeekParallelBlock 共用外壳）。本文件保留为
 * 兼容入口，外部 import 链不需要改动。
 */
export default function SubAgentParallelBlock({ cards, buckets, openDetail }) {
    return (
        <ParallelBlock
            variant="subagent"
            cards={cards}
            buckets={buckets}
            openDetail={openDetail}
        />
    );
}
