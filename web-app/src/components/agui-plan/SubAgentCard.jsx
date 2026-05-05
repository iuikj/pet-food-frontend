import { useMemo } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Bot, ChevronDown } from 'lucide-react';
import { deriveSubagentStatus } from '../../utils/aguiPlanEvents';
import TimelineFeed from './TimelineFeed';

const STATUS_BADGE = {
    pending:   { cls: 'bg-muted text-muted-foreground',   label: '等待'   },
    active:    { cls: 'bg-amber-500/15 text-amber-700',   label: '执行中' },
    searching: { cls: 'bg-blue-500/15 text-blue-700',     label: '检索中' },
    completed: { cls: 'bg-primary/15 text-primary',       label: '已完成' },
    error:     { cls: 'bg-red-500/15 text-red-700',       label: '失败'   },
};

export default function SubAgentCard({ card, events }) {
    const status = useMemo(
        () => deriveSubagentStatus(events || [], card?.dispatchEvent),
        [events, card?.dispatchEvent],
    );
    const meta = STATUS_BADGE[status.key] || STATUS_BADGE.pending;
    const last = events?.[events.length - 1] || card?.dispatchEvent;
    const canExpand = (events?.length || 0) > 0;

    return (
        <Collapsible className="overflow-hidden rounded-md border bg-background">
            <CollapsibleTrigger
                disabled={!canExpand}
                className="group flex w-full flex-col items-start gap-1.5 p-3 text-left disabled:cursor-default"
            >
                <div className="flex w-full items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                        <Bot className="size-4 shrink-0 text-muted-foreground" />
                        <span className="truncate text-sm font-bold">{card?.target || 'subagent'}</span>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${meta.cls}`}>
                            {meta.label}
                        </span>
                        {canExpand && (
                            <ChevronDown className="size-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
                        )}
                    </div>
                </div>
                <p className="w-full truncate text-xs text-muted-foreground">
                    {card?.taskName || last?.message || '等待启动...'}
                </p>
            </CollapsibleTrigger>
            <CollapsibleContent className="border-t">
                {canExpand && <TimelineFeed events={events} compact emptyText="此 SubAgent 暂无事件" />}
            </CollapsibleContent>
        </Collapsible>
    );
}
