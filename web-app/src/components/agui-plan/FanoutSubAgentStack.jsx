import FanoutStack from './FanoutStack';

/**
 * FanoutSubAgentStack — 薄包装，转发给 FanoutStack variant='subagent'。
 *
 * 实现已统一到 FanoutStack（与 FanoutWeekStack 共用映射表）。本文件保留为
 * 兼容入口，TimelineFeed 等外部 import 链不需要改动。
 */
export default function FanoutSubAgentStack({ cards, buckets, openDetail }) {
    return (
        <FanoutStack
            variant="subagent"
            cards={cards}
            buckets={buckets}
            openDetail={openDetail}
        />
    );
}
