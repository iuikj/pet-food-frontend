import { motion } from 'framer-motion'; // eslint-disable-line no-unused-vars -- motion used via JSX
import { ChevronLeft, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import TimelineFeed from './TimelineFeed';

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

const ACTIVE_STATUS_KEYS = new Set(['active', 'searching', 'writing', 'planning']);

function HeaderStatusDot({ status }) {
    const key = status?.key;
    if (ACTIVE_STATUS_KEYS.has(key)) {
        return <Loader2 className="size-3 shrink-0 animate-spin text-gray-500 dark:text-gray-400" aria-label={status?.label || '执行中'} />;
    }
    let dotClass = 'bg-gray-300 dark:bg-gray-600';
    if (key === 'completed') dotClass = 'bg-green-500';
    else if (key === 'error') dotClass = 'bg-red-500';
    return (
        <span
            aria-label={status?.label || '等待中'}
            className={cn('block size-2 shrink-0 rounded-full', dotClass)}
        />
    );
}

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
            <header className="sticky top-0 z-10 flex h-11 shrink-0 items-center gap-2 border-b border-gray-100 dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 px-3 backdrop-blur">
                <button
                    type="button"
                    onClick={onClose}
                    className="flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-[13px] text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 active:bg-gray-200 dark:active:bg-gray-700"
                    aria-label="回到 main stream"
                >
                    <ChevronLeft className="size-4" />
                    <span>回到 main stream</span>
                </button>
                <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-gray-700 dark:text-gray-300">
                    {title}
                </span>
                <HeaderStatusDot status={card.status} />
            </header>

            <div className="flex-1 overflow-y-auto px-3">
                {/* PR3：透传 allEvents（task 全量），让 ToolGroupSheet → toAiSdkSources 在 bucket 内 result 缺失时按 call_id 回查兄弟事件 */}
                <TimelineFeed events={events || []} allEvents={allEvents} emptyText="此卡片暂无事件" disableNestedBlocks />
            </div>
        </motion.div>
    );
}
