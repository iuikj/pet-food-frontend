import FanoutStack from './FanoutStack';

/**
 * FanoutWeekStack — 薄包装，转发给 FanoutStack variant='week'。
 *
 * 实现已统一到 FanoutStack（与 FanoutSubAgentStack 共用映射表）。本文件保留为
 * 兼容入口，TimelineFeed 等外部 import 链不需要改动。Week 维度自动补齐 1..4 占位卡
 * 的策略也已下沉到 FanoutStack VARIANT_CONFIG.week.normalizeItems。
 */
export default function FanoutWeekStack({ cards, buckets, openDetail }) {
    return (
        <FanoutStack
            variant="week"
            cards={cards}
            buckets={buckets}
            openDetail={openDetail}
        />
    );
}
