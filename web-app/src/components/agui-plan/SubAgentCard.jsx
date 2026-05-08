import { useMemo } from 'react';
import { deriveSubagentStatus } from '../../utils/aguiPlanEvents';
import AgentStreamCard from './AgentStreamCard';

export default function SubAgentCard({ card, events }) {
    const lifecycleEvents = useMemo(
        () => [card?.dispatchEvent, card?.completedEvent].filter(Boolean),
        [card?.dispatchEvent, card?.completedEvent],
    );
    const status = useMemo(
        () => deriveSubagentStatus(events || [], lifecycleEvents),
        [events, lifecycleEvents],
    );

    return (
        <AgentStreamCard
            kind="subagent"
            title={card?.target ? `子 Agent ${card.target}` : '子 Agent'}
            subtitle={card?.id ? `id ${card.id}` : null}
            taskName={card?.taskName}
            status={status}
            events={events || []}
            emptyText="此子 Agent 暂无事件"
        />
    );
}
