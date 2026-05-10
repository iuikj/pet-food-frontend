import { useMemo } from 'react';
import { FannedCardStack } from '@/components/ui/fanned-card-stack';
import FanoutCard from './FanoutCard';
import { deriveWeekStatus } from '@/utils/aguiPlanEvents';

/**
 * FanoutWeekStack — Week 数据 -> satisui FannedCardStack 适配层。
 *
 * 始终保证 4 张卡（数据 < 4 时补占位 card），按 weekNumber 1..4 顺序展开；
 * 底层 FannedCardStack 内部自管 swipe 循环，外层不订阅 onReorder。
 *
 * 点击触发详情页转场 — 通过 FanoutCard onClick 透传（fanned-card-stack.jsx
 * 内层 wrapper 已剔除 pointer-events-none，见该文件 PATCH 注释）。
 */
function placeholderCard(n) {
    return {
        id: n,
        weekNumber: n,
        taskName: `等待第 ${n} 周任务…`,
    };
}

export default function FanoutWeekStack({ cards, buckets, openDetail }) {
    const filledCards = useMemo(() => {
        const byNumber = new Map();
        (cards || []).forEach((c) => {
            const n = Number(c.weekNumber || c.id);
            if (Number.isFinite(n)) byNumber.set(n, c);
        });
        return [1, 2, 3, 4].map((n) => byNumber.get(n) || placeholderCard(n));
    }, [cards]);

    if (!filledCards.length) return null;

    const openCardDetail = (card, status) => {
        if (!openDetail || !card) return;
        const n = Number(card.weekNumber || card.id);
        openDetail({
            kind: 'week',
            id: n,
            title: card.taskName || `第 ${n} 周`,
            status,
        });
    };

    const getCardStatus = (card) => {
        const n = Number(card.weekNumber || card.id);
        const cardEvents = (buckets || {})[n] || [];
        const lifecycleEvents = [
            card.dispatchEvent,
            card.startedEvent,
            card.completedEvent,
        ].filter(Boolean);
        return deriveWeekStatus(cardEvents, lifecycleEvents);
    };

    // N=1 降级：实际 Week 几乎不会出现 N=1（filledCards 始终补到 4 张占位卡），
    // 此处保对称防御 — 若上游策略改变只传单张卡，跳过 satisui 堆叠直接渲染。
    if (filledCards.length === 1) {
        const card = filledCards[0];
        const n = Number(card.weekNumber || card.id);
        const cardEvents = (buckets || {})[n] || [];
        const status = getCardStatus(card);
        return (
            <div className="mx-auto w-64" style={{ aspectRatio: '3/4' }}>
                <FanoutCard
                    kind="week"
                    weekNumber={n}
                    taskName={card.taskName}
                    status={status}
                    events={cardEvents}
                    onClick={openDetail
                        ? () => openCardDetail(card, status)
                        : undefined}
                />
            </div>
        );
    }

    return (
        <div className="mx-auto" style={{ height: 360 }}>
            <FannedCardStack
                items={filledCards}
                rotateFactor={6}
                className="h-full w-full max-w-[260px]"
                onActivate={(card) => openCardDetail(card, getCardStatus(card))}
                renderItem={(card) => {
                    const n = Number(card.weekNumber || card.id);
                    const cardEvents = (buckets || {})[n] || [];
                    const status = getCardStatus(card);
                    return (
                        <FanoutCard
                            kind="week"
                            weekNumber={n}
                            taskName={card.taskName}
                            status={status}
                            events={cardEvents}
                        />
                    );
                }}
            />
        </div>
    );
}
