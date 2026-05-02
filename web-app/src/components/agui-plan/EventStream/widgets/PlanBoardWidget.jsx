import { Plan, PlanHeader, PlanTitle, PlanDescription, PlanContent } from '@/components/ai-elements/plan';
import { CheckCircle2, Circle, CircleDashed } from 'lucide-react';
import { toAiSdkPlan } from '@/lib/aiElementsAdapter';

const STATUS_ICON = {
    pending:     { Icon: Circle,        cls: 'text-muted-foreground'              },
    in_progress: { Icon: CircleDashed,  cls: 'text-amber-500 animate-pulse'       },
    done:        { Icon: CheckCircle2,  cls: 'text-primary'                       },
    completed:   { Icon: CheckCircle2,  cls: 'text-primary'                       },
};

const ACTION_LABEL = {
    created: '已创建',
    updated: '已更新',
    completed_item: '完成一项',
    snapshot: '当前',
};

/**
 * DeepAgent todo 列表 Widget — 默认展开 (信息密度核心)。
 * 数据契约:emit_plan_snapshot → detail.{items, action, task_name}
 */
export default function PlanBoardWidget({ event }) {
    const plan = toAiSdkPlan(event);
    const total = plan.steps.length;
    const done = plan.steps.filter((s) => s.status === 'done' || s.status === 'completed').length;
    return (
        <Plan defaultOpen>
            <PlanHeader>
                <div className="flex-1 min-w-0">
                    <PlanTitle>{plan.title}</PlanTitle>
                    <PlanDescription>
                        {ACTION_LABEL[plan.action] || plan.action} · {done}/{total}
                    </PlanDescription>
                </div>
            </PlanHeader>
            <PlanContent>
                {total === 0 ? (
                    <p className="text-muted-foreground text-sm italic">空规划</p>
                ) : (
                    <ol className="space-y-1.5">
                        {plan.steps.map((step) => {
                            const meta = STATUS_ICON[step.status] || STATUS_ICON.pending;
                            const { Icon } = meta;
                            const isDone = step.status === 'done' || step.status === 'completed';
                            return (
                                <li key={step.id} className="flex items-start gap-2 text-sm">
                                    <Icon className={`size-4 mt-0.5 shrink-0 ${meta.cls}`} />
                                    <span className={isDone ? 'line-through text-muted-foreground' : ''}>
                                        {step.description}
                                    </span>
                                </li>
                            );
                        })}
                    </ol>
                )}
            </PlanContent>
        </Plan>
    );
}
