import {
    Queue,
    QueueItem,
    QueueItemContent,
    QueueItemIndicator,
    QueueList,
    QueueSection,
    QueueSectionContent,
    QueueSectionLabel,
    QueueSectionTrigger,
} from '@/components/ai-elements/queue';
import { ClipboardList } from 'lucide-react';
import { toAiSdkPlan, toQueueSections } from '@/lib/aiElementsAdapter';

/**
 * DeepAgent todo 列表 Widget — 默认展开 (信息密度核心)。
 * 数据契约:emit_plan_snapshot → detail.{items, action, task_name}
 */
export default function PlanBoardWidget({ event }) {
    const plan = toAiSdkPlan(event);
    const sections = toQueueSections(event);

    return (
        <Queue className="agui-plan-board">
            <div className="flex items-start gap-3 px-1 pt-1">
                <div className="rounded-[16px] bg-white/60 dark:bg-white/10 p-2 text-[var(--agui-muted)]">
                    <ClipboardList className="size-4" />
                </div>
                <div className="min-w-0">
                    <h4 className="truncate text-sm font-semibold text-[var(--agui-ink)]">{plan.title}</h4>
                    <p className="text-xs text-[var(--agui-muted)]">
                        {event.detail?.action === 'created' ? '新建任务队列' : '任务队列更新'}
                    </p>
                </div>
            </div>

            {sections.length === 0 ? (
                <p className="px-1 pb-1 text-sm italic text-muted-foreground">空规划</p>
            ) : (
                sections.map((section) => (
                    <QueueSection key={section.key} defaultOpen={section.defaultOpen}>
                        <QueueSectionTrigger>
                            <QueueSectionLabel
                                count={section.count}
                                label={section.label}
                            />
                        </QueueSectionTrigger>
                        <QueueSectionContent>
                            <QueueList>
                                {section.items.map((item) => (
                                    <QueueItem key={item.id} className="gap-2">
                                        <div className="flex items-start gap-2">
                                            <QueueItemIndicator completed={item.completed} />
                                            <QueueItemContent completed={item.completed}>
                                                {item.description}
                                            </QueueItemContent>
                                        </div>
                                    </QueueItem>
                                ))}
                            </QueueList>
                        </QueueSectionContent>
                    </QueueSection>
                ))
            )}
        </Queue>
    );
}
