import { Workflow } from 'lucide-react';
import SubAgentCard from './SubAgentCard';

export default function SubAgentParallelBlock({ cards, buckets }) {
    if (!cards?.length) return null;

    const activeCount = cards.filter((card) => (buckets?.[card.id] || []).length > 0).length;

    return (
        <section className="my-2">
            <header className="mb-3 flex items-center gap-2">
                <Workflow className="size-4 text-muted-foreground" />
                <h4 className="text-sm font-medium">Task SubAgents</h4>
                <span className="ml-auto text-[10px] text-muted-foreground">
                    {activeCount}/{cards.length} 已启动
                </span>
            </header>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {cards.map((card) => (
                    <SubAgentCard
                        key={card.id}
                        card={card}
                        events={(buckets || {})[card.id] || []}
                    />
                ))}
            </div>
        </section>
    );
}
