import { useMemo } from 'react';
import { FannedCardStack } from '@/components/ui/fanned-card-stack';
import FanoutCard from './FanoutCard';
import { deriveSubagentStatus } from '@/utils/aguiPlanEvents';

/**
 * FanoutSubAgentStack — SubAgent 数据 -> satisui FannedCardStack 适配层。
 *
 * 底层 FannedCardStack 内部用 useState(items) 自管顺序与 swipe 循环，
 * 此处仅把后端 cards 喂给 items；onReorder 不订阅（顺序由用户拖动决定，
 * 数据流由 organizeEventsForTimeline 推动）。
 *
 * 点击触发详情页转场 — 通过 FanoutCard onClick 透传（fanned-card-stack.jsx
 * 内层 wrapper 已剔除 pointer-events-none，见该文件 PATCH 注释）。
 */
export default function FanoutSubAgentStack({ cards, buckets, openDetail }) {
    const items = useMemo(() => cards || [], [cards]);

    if (!items.length) return null;

    // N=1 降级：仅一张卡时跳过 satisui FannedCardStack（无堆叠 / 无 drag / 无 GSAP），
    // 直接渲染单张 FanoutCard。容器尺寸 aspect-[3/4] w-64 与 FannedCardStack 默认一致，
    // 避免 N=1 ↔ N≥2 切换时尺寸跳变。
    if (items.length === 1) {
        const card = items[0];
        const cardEvents = (buckets || {})[card.id] || [];
        const lifecycleEvents = [card.dispatchEvent, card.completedEvent].filter(Boolean);
        const status = deriveSubagentStatus(cardEvents, lifecycleEvents);
        return (
            <div className="mx-auto w-64" style={{ aspectRatio: '3/4' }}>
                <FanoutCard
                    kind="subagent"
                    taskName={card.taskName}
                    status={status}
                    events={cardEvents}
                    onClick={openDetail
                        ? () => openDetail({
                            kind: 'sub',
                            id: card.id,
                            title: card.taskName || (card.target ? `子 Agent ${card.target}` : '子 Agent'),
                            status,
                        })
                        : undefined}
                />
            </div>
        );
    }

    return (
        <div className="mx-auto" style={{ height: 360 }}>
            <FannedCardStack
                items={items}
                rotateFactor={6}
                className="h-full w-full max-w-[260px]"
                renderItem={(card) => {
                    const cardEvents = (buckets || {})[card.id] || [];
                    const lifecycleEvents = [card.dispatchEvent, card.completedEvent].filter(Boolean);
                    const status = deriveSubagentStatus(cardEvents, lifecycleEvents);
                    return (
                        <FanoutCard
                            kind="subagent"
                            taskName={card.taskName}
                            status={status}
                            events={cardEvents}
                            onClick={openDetail
                                ? () => openDetail({
                                    kind: 'sub',
                                    id: card.id,
                                    title: card.taskName || (card.target ? `子 Agent ${card.target}` : '子 Agent'),
                                    status,
                                })
                                : undefined}
                        />
                    );
                }}
            />
        </div>
    );
}
