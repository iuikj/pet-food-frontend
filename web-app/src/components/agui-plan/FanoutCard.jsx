import { Bot, Loader2 } from 'lucide-react';
import { Streamdown } from 'streamdown';
import { cjk } from '@streamdown/cjk';
import { cn } from '@/lib/utils';
import EventPreviewStack from './EventPreviewStack';

/**
 * FanoutCard — 堆叠扇形容器（satisui FannedCardStack）renderItem 内容。
 *
 * 三段布局：header（图标 + 状态点）+ body（markdown line-clamp-2）+ events 预览。
 *
 * PR3 真机验收 grill #8（莫兰迪 Decision A）：
 * - 整卡背景换莫兰迪纯色（Week → bg-week-N，SubAgent → bg-subagent-soft 不透明米灰）
 * - 删除左侧 4px accent 边带（与莫兰迪卡冲突，肉眼是"莫名其妙的绿色"）
 * - 机器人 icon 去背景圆形（Bot 直接渲染于 header，不再包 sage 圆形）
 * - Week 数字徽章圆形保留，但底从 bg-week-N 改为 bg-white/60 以在莫兰迪卡上凸出
 * - 文字统一 text-gray-700 / 600 / 500，AA 对比度安全（gray-700 #374151 vs 莫兰迪卡 ≥ 4.5:1）
 *
 * 不再使用 framer-motion layoutId（GSAP transform 与共享元素冲突，详情页改用 fade+slide-up 转场）。
 *
 * 规范见 PRD ADR-003（卡面布局）+ ADR-004（莫兰迪暖系配色）+ ADR-005（详情页转场降级）。
 */

const streamdownPlugins = { cjk };

const ACTIVE_STATUS_KEYS = new Set(['active', 'searching', 'writing', 'planning']);

const WEEK_BG_CLASS = {
    1: 'bg-week-1',
    2: 'bg-week-2',
    3: 'bg-week-3',
    4: 'bg-week-4',
};

function StatusDot({ status }) {
    const key = status?.key;
    if (ACTIVE_STATUS_KEYS.has(key)) {
        return <Loader2 className="size-3 animate-spin text-gray-600" aria-label={status?.label || '执行中'} />;
    }
    let dotClass = 'bg-gray-400';
    if (key === 'completed') dotClass = 'bg-green-600';
    else if (key === 'error') dotClass = 'bg-red-500';
    return (
        <span
            className={cn('block size-2 rounded-full', dotClass)}
            aria-label={status?.label || '等待中'}
        />
    );
}

function HeaderIcon({ kind, weekNumber }) {
    if (kind === 'week') {
        const n = Number(weekNumber);
        // 数字徽章保留圆形，底换 bg-white/60 让数字在莫兰迪卡上是浅色凸出而不是同色融化。
        return (
            <div className="flex size-7 items-center justify-center rounded-full bg-white/60 text-[13px] font-semibold text-gray-700">
                {Number.isFinite(n) ? n : '·'}
            </div>
        );
    }
    // SubAgent：Bot icon 直接渲染，无背景圆形。
    return <Bot className="size-5 text-gray-700" aria-label="子 Agent" />;
}

export default function FanoutCard({
    kind = 'subagent',
    weekNumber,
    taskName,
    status,
    events = [],
    className,
    onClick,
}) {
    const isWeek = kind === 'week';
    const bgClass = isWeek
        ? (WEEK_BG_CLASS[Number(weekNumber)] || 'bg-week-1')
        : 'bg-subagent-soft';

    return (
        <div
            onClick={onClick}
            role={onClick ? 'button' : undefined}
            className={cn(
                'relative flex h-full w-full flex-col overflow-hidden rounded-xl shadow-sm',
                bgClass,
                onClick && 'cursor-pointer',
                className,
            )}
        >
            <header className="flex h-10 shrink-0 items-center justify-between px-3">
                <HeaderIcon kind={kind} weekNumber={weekNumber} />
                <StatusDot status={status} />
            </header>

            <div className="flex-1 overflow-hidden px-3 py-1">
                {taskName ? (
                    <div className="line-clamp-2 text-[13px] leading-5 text-gray-700">
                        <Streamdown plugins={streamdownPlugins}>{taskName}</Streamdown>
                    </div>
                ) : (
                    <span className="text-[13px] leading-5 text-gray-500">等待任务描述…</span>
                )}
            </div>

            <div className="px-3 pb-2">
                <EventPreviewStack events={events.slice(-3)} className="agui-event-preview--compact" />
            </div>
        </div>
    );
}
