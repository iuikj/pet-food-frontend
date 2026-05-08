import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion'; // eslint-disable-line no-unused-vars -- motion used via JSX
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { Bot, CalendarDays, Check, ChevronDown, CircleDashed } from 'lucide-react';
import { cn } from '@/lib/utils';
import TimelineFeed from './TimelineFeed';

const STATUS_CLASS = {
    pending: 'agui-status-badge--pending',
    active: 'agui-status-badge--active',
    planning: 'agui-status-badge--active',
    searching: 'agui-status-badge--searching',
    writing: 'agui-status-badge--active',
    completed: 'agui-status-badge--completed',
    error: 'agui-status-badge--error',
};

function statusLabel(status) {
    if (!status?.key) return '等待中';
    if (status.key === 'completed') return '已完成';
    if (status.key === 'searching') return '搜索中';
    if (status.key === 'error') return status.label || '失败';
    if (status.key === 'pending') return status.label || '等待中';
    return status.label || '执行中';
}

function eventDone(event) {
    const detail = event.detail || {};
    return (
        event.type === 'completed' ||
        event.type === 'task_completed' ||
        event.type === 'week_completed' ||
        detail.status === 'completed' ||
        detail.status === 'output-available'
    );
}

function eventErrored(event) {
    return event.type === 'error' || event.detail?.status === 'error';
}

function previewCommand(event) {
    const detail = event.detail || {};
    const viewType = detail.view_type;
    const suffix = eventErrored(event) ? '失败' : (eventDone(event) ? '已完成' : '进行中');

    if (viewType?.startsWith('tool_') || event.type === 'tool_call') {
        if (viewType === 'tool_search') return `资料检索${suffix}`;
        if (viewType === 'tool_note_read') return `读取营养资料${suffix}`;
        if (viewType === 'tool_note_write') return `整理阶段笔记${suffix}`;
        if (viewType === 'tool_food_calc') return `营养计算${suffix}`;
        return `工具调用${suffix}`;
    }
    if (viewType === 'reasoning') {
        return eventDone(event) ? '推理完成' : '正在推理方案';
    }
    if (viewType === 'ai_message') {
        return `生成说明${suffix}`;
    }
    if (event.type === 'plan_snapshot') {
        return `任务队列${suffix}`;
    }
    return `${detail.task_name || event.task_name || event.message || '事件更新'} ${suffix}`;
}

function AgentIcon({ kind }) {
    const Icon = kind === 'week' ? CalendarDays : Bot;

    return (
        <div className={cn('agui-agent-avatar', kind === 'week' && 'agui-agent-avatar--week')}>
            <Icon className="size-5" />
        </div>
    );
}

function EventPreviewStack({ events }) {
    if (events.length === 0) {
        return (
            <div className="agui-event-preview agui-event-preview--empty">
                <div className="agui-event-preview-row">
                    <CircleDashed className="size-3.5" />
                    <span>等待事件更新...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="agui-event-preview" aria-label="事件流预览">
            <AnimatePresence initial={false}>
                {events.map((event, index) => (
                    <motion.div
                        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                        className={cn(
                            'agui-event-preview-row',
                            index === 0 && events.length === 3 && 'is-faded',
                        )}
                        exit={{ opacity: 0, y: -8, filter: 'blur(4px)' }}
                        initial={{ opacity: 0, y: 9, filter: 'blur(5px)' }}
                        key={`${event.timestamp || ''}-${event.type || ''}-${event.detail?.message_id || event.detail?.call_id || index}`}
                        layout
                        transition={{ duration: 0.24, ease: 'easeOut' }}
                    >
                        {eventDone(event) ? (
                            <Check className="size-3.5" />
                        ) : (
                            <span className="agui-preview-spinner" />
                        )}
                        <span className="truncate">{previewCommand(event)}</span>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}

function AgentMetaLabel({ kind }) {
    if (kind === 'week') {
        return '周计划 Agent';
    }
    return '子 Agent';
}

export default function AgentStreamCard({
    kind = 'subagent',
    title,
    subtitle,
    taskName,
    status,
    events = [],
    emptyText,
}) {
    const [open, setOpen] = useState(false);
    const canExpand = events.length > 0;
    const previewEvents = useMemo(() => events.slice(-3), [events]);
    const statusClass = STATUS_CLASS[status?.key] || STATUS_CLASS.pending;
    const resolvedStatusLabel = statusLabel(status);

    return (
        <Collapsible
            open={open}
            onOpenChange={setOpen}
            className={cn(
                'agui-agent-card',
                kind === 'week' && 'agui-agent-card--week',
                open && 'is-open',
            )}
        >
            <header className="p-5 pb-4">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                        <AgentIcon kind={kind} />
                        <div className="min-w-0">
                            <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--agui-muted)]">
                                <AgentMetaLabel kind={kind} />
                            </p>
                            <h4 className="truncate text-[17px] font-semibold leading-tight tracking-normal">
                                {title}
                            </h4>
                            {subtitle && (
                                <p className="mt-1 truncate text-[11px] text-[var(--agui-muted)]">
                                    {subtitle}
                                </p>
                            )}
                        </div>
                    </div>
                    <Badge variant="secondary" className={cn('agui-status-badge', statusClass)}>
                        {resolvedStatusLabel}
                    </Badge>
                </div>

                <div className="mt-5">
                    <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--agui-muted)]">
                        任务摘要
                    </p>
                    <p className="line-clamp-3 break-words text-[13px] leading-6 text-[var(--agui-ink-soft)]">
                        {taskName || '等待任务描述...'}
                    </p>
                </div>
            </header>

            {!open && (
                <div className="px-5 pb-4">
                    <EventPreviewStack events={previewEvents} />
                </div>
            )}

            <CollapsibleContent className="agui-agent-card-content">
                <div className="agui-subspace-shell">
                    <div className="mb-3 flex items-center justify-between">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--agui-muted)]">
                            内部时间线
                        </p>
                        <span className="rounded-full bg-white/[0.65] px-2 py-1 text-[10px] text-[var(--agui-muted)]">
                            {events.length} 条事件
                        </span>
                    </div>
                    {canExpand ? (
                        <TimelineFeed events={events} compact emptyText={emptyText} />
                    ) : (
                        <p className="p-3 text-xs text-[var(--agui-muted)]">{emptyText}</p>
                    )}
                </div>
            </CollapsibleContent>

            <footer className="flex items-center justify-between border-t border-black/[0.035] px-5 py-3">
                <span className="text-[11px] text-[var(--agui-muted)]">
                    事件预览
                </span>
                <CollapsibleTrigger
                    aria-label={open ? '收起事件流' : '展开事件流'}
                    className={cn('agui-agent-toggle', !canExpand && 'opacity-45')}
                    disabled={!canExpand}
                >
                    <span>{open ? '收起' : '展开'}</span>
                    <ChevronDown className={cn('size-3.5 transition-transform duration-200', open && 'rotate-180')} />
                </CollapsibleTrigger>
            </footer>
        </Collapsible>
    );
}
