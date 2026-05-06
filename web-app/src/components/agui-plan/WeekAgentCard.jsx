import { useMemo } from 'react';
import { deriveWeekStatus } from '../../utils/aguiPlanEvents';
import AgentStreamCard from './AgentStreamCard';

const WEEK_LABELS = ['基础适应期', '营养强化期', '多样化拓展', '巩固优化期'];

export default function WeekAgentCard({ card, events }) {
    const weekNumber = Number(card?.weekNumber || card?.id);
    const lifecycleEvents = useMemo(
        () => [card?.dispatchEvent, card?.startedEvent, card?.completedEvent].filter(Boolean),
        [card?.dispatchEvent, card?.startedEvent, card?.completedEvent],
    );
    const status = useMemo(
        () => deriveWeekStatus(events || [], lifecycleEvents),
        [events, lifecycleEvents],
    );

    return (
        <AgentStreamCard
            kind="week"
            title={Number.isFinite(weekNumber) ? `第${weekNumber}周` : '周计划'}
            subtitle={Number.isFinite(weekNumber) ? WEEK_LABELS[weekNumber - 1] : null}
            taskName={card?.taskName}
            status={status}
            events={events || []}
            emptyText="此周暂无事件"
        />
    );
}
