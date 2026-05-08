import {
    Queue,
    QueueItem,
    QueueItemContent,
    QueueItemIndicator,
    QueueList,
    QueueSection,
    QueueSectionContent,
    QueueSectionTrigger,
} from '@/components/ai-elements/queue';
import { ChevronDown, Layers, Workflow } from 'lucide-react';
import { toQueueDispatch } from '@/lib/aiElementsAdapter';

/**
 * SubAgent 调度提示单行。
 * 数据契约:subagent lifecycle custom event → detail.{subagent_id, target, task_name, status}
 */
export default function SubagentDispatchWidget({ event }) {
    const dispatch = toQueueDispatch(event);
    const firstSection = dispatch.sections[0];
    const item = firstSection.items[0];
    const isWeek = item.meta?.startsWith?.('W');
    const Icon = isWeek ? Layers : Workflow;

    return (
        <Queue className="agui-plan-board">
            <QueueSection defaultOpen>
                <QueueSectionTrigger className="bg-transparent px-0 py-0 hover:bg-transparent">
                    <span className="flex items-center gap-2 text-sm text-muted-foreground">
                        <ChevronDown className="size-4 transition-transform group-data-[state=closed]:-rotate-90" />
                        <Icon className="size-3.5" />
                        <span>{dispatch.title}</span>
                    </span>
                    <span className="text-xs text-muted-foreground">{firstSection.count} 项</span>
                </QueueSectionTrigger>
                <QueueSectionContent>
                    <QueueList className="mt-3">
                        <QueueItem>
                            <div className="flex items-start gap-2">
                                <QueueItemIndicator completed={false} />
                                <div className="min-w-0 flex-1">
                                    <QueueItemContent>{item.description}</QueueItemContent>
                                    <div className="mt-1 text-[11px] text-muted-foreground">
                                        {item.meta}
                                    </div>
                                </div>
                            </div>
                        </QueueItem>
                    </QueueList>
                </QueueSectionContent>
            </QueueSection>
        </Queue>
    );
}
