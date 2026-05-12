import { useMemo } from 'react';
import { FannedCardStack } from '@/components/ui/fanned-card-stack';
import FanoutCard from './FanoutCard';
import { deriveSubagentStatus, deriveWeekStatus } from '@/utils/aguiPlanEvents';

/**
 * FanoutStack — fanout 卡片堆叠统一适配层。
 *
 * 取代 FanoutSubAgentStack / FanoutWeekStack 两份高度同构的实现。两者只在
 *   1) 状态推导函数（deriveSubagentStatus vs deriveWeekStatus）
 *   2) detail kind / title 字段（子 Agent vs 第 N 周）
 *   3) Week 维度始终补齐 1..4 占位卡
 * 上有差异，通过 variant 映射表表达。表面 props 与原两个 Stack 等价。
 *
 * 底层 FannedCardStack 内部用 useState(items) 自管顺序与 swipe 循环。
 * 点击触发详情页转场 — 通过 FanoutCard onClick 透传（fanned-card-stack.jsx
 * 内层 wrapper 已剔除 pointer-events-none）。
 */

function placeholderWeekCard(n) {
    return {
        id: n,
        weekNumber: n,
        taskName: `等待第 ${n} 周任务…`,
    };
}

const VARIANT_CONFIG = {
    subagent: {
        cardKind: 'subagent',
        detailKind: 'sub',
        deriveStatus: (card, buckets) => {
            const cardEvents = (buckets || {})[card.id] || [];
            const lifecycleEvents = [card.dispatchEvent, card.completedEvent].filter(Boolean);
            return deriveSubagentStatus(cardEvents, lifecycleEvents);
        },
        getBucketKey: (card) => card.id,
        getDetailId: (card) => card.id,
        getDetailTitle: (card) => card.taskName || (card.target ? `子 Agent ${card.target}` : '子 Agent'),
        getCardProps: (card) => ({ taskName: card.taskName }),
        normalizeItems: (cards) => cards || [],
    },
    week: {
        cardKind: 'week',
        detailKind: 'week',
        deriveStatus: (card, buckets) => {
            const n = Number(card.weekNumber || card.id);
            const cardEvents = (buckets || {})[n] || [];
            const lifecycleEvents = [
                card.dispatchEvent,
                card.startedEvent,
                card.completedEvent,
            ].filter(Boolean);
            return deriveWeekStatus(cardEvents, lifecycleEvents);
        },
        getBucketKey: (card) => Number(card.weekNumber || card.id),
        getDetailId: (card) => Number(card.weekNumber || card.id),
        getDetailTitle: (card) => card.taskName || `第 ${Number(card.weekNumber || card.id)} 周`,
        getCardProps: (card) => ({
            weekNumber: Number(card.weekNumber || card.id),
            taskName: card.taskName,
        }),
        normalizeItems: (cards) => {
            // Week 维度：始终补齐 1..4 占位卡，按 weekNumber 顺序展开。
            const byNumber = new Map();
            (cards || []).forEach((c) => {
                const n = Number(c.weekNumber || c.id);
                if (Number.isFinite(n)) byNumber.set(n, c);
            });
            return [1, 2, 3, 4].map((n) => byNumber.get(n) || placeholderWeekCard(n));
        },
    },
};

export default function FanoutStack({ variant = 'subagent', cards, buckets, openDetail }) {
    const config = VARIANT_CONFIG[variant] || VARIANT_CONFIG.subagent;

    const items = useMemo(() => config.normalizeItems(cards), [cards, config]);

    if (!items.length) return null;

    const openCardDetail = (card, status) => {
        if (!openDetail || !card) return;
        openDetail({
            kind: config.detailKind,
            id: config.getDetailId(card),
            title: config.getDetailTitle(card),
            status,
        });
    };

    const getCardStatus = (card) => config.deriveStatus(card, buckets);

    // N=1 降级：跳过 satisui FannedCardStack（无堆叠 / 无 drag / 无 GSAP），
    // 直接渲染单张 FanoutCard。容器尺寸 aspect-[3/4] w-64 与 FannedCardStack 默认一致，
    // 避免 N=1 ↔ N≥2 切换时尺寸跳变。
    if (items.length === 1) {
        const card = items[0];
        const cardEvents = (buckets || {})[config.getBucketKey(card)] || [];
        const status = getCardStatus(card);
        return (
            <div className="mx-auto w-64" style={{ aspectRatio: '3/4' }}>
                <FanoutCard
                    kind={config.cardKind}
                    {...config.getCardProps(card)}
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
                items={items}
                rotateFactor={6}
                className="h-full w-full max-w-[260px]"
                onActivate={(card) => openCardDetail(card, getCardStatus(card))}
                renderItem={(card) => {
                    const cardEvents = (buckets || {})[config.getBucketKey(card)] || [];
                    const status = getCardStatus(card);
                    return (
                        <FanoutCard
                            kind={config.cardKind}
                            {...config.getCardProps(card)}
                            status={status}
                            events={cardEvents}
                        />
                    );
                }}
            />
        </div>
    );
}
