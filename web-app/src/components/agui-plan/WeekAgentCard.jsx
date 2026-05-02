import { useMemo } from 'react';
import { motion } from 'framer-motion'; // eslint-disable-line no-unused-vars -- motion used via JSX
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import { deriveWeekStatus } from '../../utils/aguiPlanEvents';
import TimelineFeed from './TimelineFeed';

const WEEK_LABELS = ['基础适应期', '营养强化期', '多样化拓展', '巩固优化期'];

const STATUS_BADGE = {
    pending:   { cls: 'bg-muted text-muted-foreground',           label: '等待'   },
    planning:  { cls: 'bg-amber-500/15 text-amber-700',           label: '规划中' },
    searching: { cls: 'bg-blue-500/15 text-blue-700',             label: '检索中' },
    writing:   { cls: 'bg-purple-500/15 text-purple-700',         label: '撰写中' },
    completed: { cls: 'bg-primary/15 text-primary',               label: '已完成' },
    active:    { cls: 'bg-amber-500/15 text-amber-700',           label: '执行中' },
};

/**
 * 单周折叠卡 — 折叠态显示标题/状态/最后一条消息/进度条;
 * 展开后嵌入 compact 子 TimelineFeed,递归渲染该周事件流。
 */
export default function WeekAgentCard({ weekNumber, events }) {
    const status = useMemo(() => deriveWeekStatus(events || []), [events]);
    const last = events?.[events.length - 1];
    const meta = STATUS_BADGE[status.key] || STATUS_BADGE.pending;
    const canExpand = (events?.length || 0) > 0;
    const progress = status.progress || (canExpand ? 5 : 0);

    return (
        <Collapsible className="rounded-lg border bg-card overflow-hidden">
            <CollapsibleTrigger
                disabled={!canExpand}
                className="group flex w-full flex-col items-start gap-1.5 p-3 text-left disabled:cursor-default"
            >
                <div className="flex w-full items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                        <span className="text-sm font-bold">第{weekNumber}周</span>
                        <span className="truncate text-[10px] text-muted-foreground">
                            {WEEK_LABELS[weekNumber - 1]}
                        </span>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${meta.cls}`}>
                            {meta.label}
                        </span>
                        {canExpand && (
                            <ChevronDown className="size-4 text-muted-foreground transition-transform group-data-[panel-open]:rotate-180" />
                        )}
                    </div>
                </div>
                <p className="min-h-[1rem] w-full truncate text-xs text-muted-foreground">
                    {last?.message || '等待启动...'}
                </p>
                <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
                    <motion.div
                        className="h-full rounded-full bg-primary"
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.4 }}
                    />
                </div>
            </CollapsibleTrigger>
            <CollapsibleContent className="border-t bg-background">
                {canExpand && <TimelineFeed events={events} compact emptyText="此周暂无事件" />}
            </CollapsibleContent>
        </Collapsible>
    );
}
