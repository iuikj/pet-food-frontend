import { ArrowRight, Workflow, Layers } from 'lucide-react';

/**
 * SubAgent 调度提示单行。
 * 数据契约:emit_subagent_spawn → detail.{target, task_name, week_number}
 */
export default function SubagentDispatchWidget({ event }) {
    const detail = event.detail || {};
    const target = detail.target || 'subagent';
    const taskName = detail.task_name || event.message || '';
    const week = detail.week_number;
    const isWeek = target === 'week_agent' || detail.view_type === 'week_dispatch';
    const Icon = isWeek ? Layers : Workflow;
    const label = isWeek ? `调度第 ${week ?? '?'} 周 SubAgent` : `委托 ${target}`;

    return (
        <div className="flex items-center gap-2 rounded-md border-l-4 border-primary bg-primary/5 px-3 py-2 text-xs">
            <Icon className="size-4 shrink-0 text-primary" />
            <span className="shrink-0 font-semibold">{label}</span>
            {taskName && (
                <>
                    <ArrowRight className="size-3 shrink-0 text-muted-foreground" />
                    <span className="truncate text-muted-foreground">{taskName}</span>
                </>
            )}
            {isWeek && week && (
                <span className="ml-auto rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold text-primary shrink-0">
                    W{week}
                </span>
            )}
        </div>
    );
}
