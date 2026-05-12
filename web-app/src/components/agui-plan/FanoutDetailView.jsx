import { motion } from 'framer-motion'; // eslint-disable-line no-unused-vars -- motion used via JSX
import PageHeader from '@/components/layout/PageHeader';
import TimelineFeed from './TimelineFeed';
import StatusDot from './StatusDot';

/**
 * FanoutDetailView — fanout 卡片点击放大后的全屏详情。
 *
 * - 转场降级为 fade-in + slide-up（GSAP transform 与 framer-motion layoutId
 *   共享元素冲突，无法同时工作；详情页全屏覆盖不需要严格的共享元素动画）。
 * - 详情区直接挂顶层 <TimelineFeed events={events}>（不带 compact prop），
 *   与主流 1:1 一致；持有独立 sheetEvents state，CoT sheet 不与主流串台。
 *
 * 规范见 PRD ADR-005（详情页转场与返回键 — 已降级为 fade+slide）。
 */

export default function FanoutDetailView({ card, events, allEvents, onClose }) {
    if (!card) return null;
    const title = card.title || '';

    return (
        <motion.div
            className="fixed inset-0 z-40 flex flex-col bg-white dark:bg-gray-900"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.18 }}
        >
            <PageHeader
                onBack={onClose}
                title={
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                        <span className="min-w-0 flex-1 truncate text-sm font-medium text-text-main-light dark:text-text-main-dark">
                            {title}
                        </span>
                        <span className="text-[11px] text-text-muted-light dark:text-text-muted-dark shrink-0">
                            回到 main stream
                        </span>
                    </div>
                }
                rightSlot={<StatusDot status={card.status} size="sm" tone="default" />}
            />

            <div className="flex-1 overflow-y-auto px-3">
                {/* PR3：透传 allEvents（task 全量），让 ToolGroupSheet → toAiSdkSources 在 bucket 内 result 缺失时按 call_id 回查兄弟事件 */}
                <TimelineFeed events={events || []} allEvents={allEvents} emptyText="此卡片暂无事件" disableNestedBlocks />
            </div>
        </motion.div>
    );
}
