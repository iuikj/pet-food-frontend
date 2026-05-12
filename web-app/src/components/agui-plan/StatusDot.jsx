import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * StatusDot — fanout 状态圆点单例。
 *
 * 取代 FanoutCard.jsx 与 FanoutDetailView.jsx 原各自的内联 StatusDot/HeaderStatusDot。
 *
 * 视觉对齐（实测两处原实现）：
 * - 静态圆点尺寸：sm → size-2（默认）、md → size-3
 * - active 态 Loader2 统一 size-3（与两处原实现一致），text 颜色随 tone 切换
 * - tone='default'（FanoutDetailView 现状）：completed=green-500、idle=gray-300/dark:gray-600、spinner=gray-500/gray-400
 * - tone='strong'（FanoutCard 现状）：completed=green-600、idle=gray-400（无 dark）、spinner=gray-600/gray-400
 * - error 态在两 tone 下都用 red-500
 * - shrink-0 默认开启，避免 PageHeader 等 flex 容器里被挤压
 */

export const ACTIVE_STATUS_KEYS = new Set(['active', 'searching', 'writing', 'planning']);

const DOT_SIZE_CLASS = {
    sm: 'size-2',
    md: 'size-3',
};

const TONE_CLASSES = {
    default: {
        idle: 'bg-gray-300 dark:bg-gray-600',
        completed: 'bg-green-500',
        error: 'bg-red-500',
        spinner: 'text-gray-500 dark:text-gray-400',
    },
    strong: {
        idle: 'bg-gray-400',
        completed: 'bg-green-600',
        error: 'bg-red-500',
        spinner: 'text-gray-600 dark:text-gray-400',
    },
};

export default function StatusDot({ status, size = 'sm', tone = 'default', className }) {
    const key = status?.key;
    const palette = TONE_CLASSES[tone] || TONE_CLASSES.default;

    if (ACTIVE_STATUS_KEYS.has(key)) {
        return (
            <Loader2
                aria-label={status?.label || '执行中'}
                className={cn('size-3 shrink-0 animate-spin', palette.spinner, className)}
            />
        );
    }

    let dotClass = palette.idle;
    if (key === 'completed') dotClass = palette.completed;
    else if (key === 'error') dotClass = palette.error;

    return (
        <span
            aria-label={status?.label || '等待中'}
            className={cn('block shrink-0 rounded-full', DOT_SIZE_CLASS[size] || DOT_SIZE_CLASS.sm, dotClass, className)}
        />
    );
}
