import { useMemo, useState } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bot, CalendarDays, Maximize2, Minimize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import TimelineFeed from './TimelineFeed';

const STATUS_VARIANT = {
    pending: 'secondary',
    active: 'secondary',
    planning: 'secondary',
    searching: 'secondary',
    writing: 'secondary',
    completed: 'secondary',
    error: 'destructive',
};

function previewLabel(event) {
    const viewType = event.detail?.view_type;
    if (viewType === 'ai_message') return '消息';
    if (viewType === 'reasoning') return '推理';
    if (viewType?.startsWith('tool_') || event.type === 'tool_call') return '工具';
    if (event.type === 'plan_snapshot') return '队列';
    return event.task_name || event.type || '事件';
}

function previewText(event) {
    const detail = event.detail || {};
    if (detail.view_type === 'ai_message') {
        return detail.content || event.message || '';
    }
    if (detail.view_type === 'reasoning') {
        return detail.content || detail.reasoning || event.message || '';
    }
    if (detail.view_type?.startsWith('tool_') || event.type === 'tool_call') {
        const toolName = detail.tool_name || 'tool';
        const status = detail.status ? ` · ${detail.status}` : '';
        return `${toolName}${status}`;
    }
    return event.message || detail.task_name || event.task_name || event.type || '';
}

function AgentIcon({ kind }) {
    if (kind === 'week') {
        return <CalendarDays className="size-4 text-muted-foreground" />;
    }
    return <Bot className="size-4 text-muted-foreground" />;
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
    const statusVariant = STATUS_VARIANT[status?.key] || 'secondary';

    return (
        <Collapsible
            open={open}
            onOpenChange={setOpen}
            className="relative overflow-hidden rounded-lg border border-border bg-background shadow-xs"
        >
            <header className="flex flex-col gap-2 p-3 pb-2">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 items-start gap-2">
                        <AgentIcon kind={kind} />
                        <div className="min-w-0">
                            <h4 className="truncate text-sm font-semibold">{title}</h4>
                            {subtitle && (
                                <p className="truncate text-[11px] text-muted-foreground">
                                    {subtitle}
                                </p>
                            )}
                        </div>
                    </div>
                    <Badge variant={statusVariant} className="rounded-full">
                        {status?.label || '等待'}
                    </Badge>
                </div>

                <div className="rounded-lg border border-border bg-muted/45 px-3 py-2 shadow-inner">
                    <p className="text-[10px] font-medium uppercase text-muted-foreground">
                        任务
                    </p>
                    <p className="line-clamp-2 break-words text-xs text-foreground">
                        {taskName || '等待任务描述...'}
                    </p>
                </div>
            </header>

            {!open && (
                <div className="px-3 pb-11">
                    <div className="flex flex-col gap-1 rounded-lg bg-muted/55 p-2 shadow-inner">
                        {previewEvents.length > 0 ? (
                            previewEvents.map((event, index) => (
                                <div
                                    key={`${event.timestamp || ''}-${event.type || ''}-${event.detail?.message_id || event.detail?.call_id || index}`}
                                    className="flex items-center gap-2 rounded-md px-2 py-1 text-[11px] text-muted-foreground"
                                >
                                    <span className="size-1.5 shrink-0 rounded-full bg-muted-foreground/35" />
                                    <span className="shrink-0 font-medium">{previewLabel(event)}</span>
                                    <span className="min-w-0 truncate">{previewText(event)}</span>
                                </div>
                            ))
                        ) : (
                            <p className="px-2 py-1 text-[11px] text-muted-foreground">
                                等待 AG-UI 标准事件...
                            </p>
                        )}
                    </div>
                </div>
            )}

            <CollapsibleContent className="border-t border-border bg-background">
                <div className="max-h-[56vh] overflow-y-auto overscroll-contain px-2 py-2 pb-11">
                    {canExpand ? (
                        <TimelineFeed events={events} compact emptyText={emptyText} />
                    ) : (
                        <p className="p-3 text-xs text-muted-foreground">{emptyText}</p>
                    )}
                </div>
            </CollapsibleContent>

            <div className="absolute bottom-2 right-2">
                <CollapsibleTrigger
                    disabled={!canExpand}
                    render={(
                        <Button
                            aria-label={open ? '收起事件流' : '展开事件流'}
                            className={cn('rounded-lg shadow-xs', !canExpand && 'opacity-50')}
                            size="icon-sm"
                            type="button"
                            variant="outline"
                        />
                    )}
                >
                    {open ? <Minimize2 /> : <Maximize2 />}
                </CollapsibleTrigger>
            </div>
        </Collapsible>
    );
}
