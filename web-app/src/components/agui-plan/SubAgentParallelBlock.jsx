import SubAgentCard from './SubAgentCard';

export default function SubAgentParallelBlock({ cards, buckets }) {
    if (!cards?.length) return null;

    return (
        <section className="my-1">
            <div className="mb-3 flex items-center justify-between">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--agui-muted)]">
                    子 Agent 空间
                </p>
                <span className="rounded-full border border-white/60 bg-white/[0.58] px-2.5 py-1 text-[10px] text-[var(--agui-muted)] backdrop-blur-xl">
                    {cards.length} 个任务
                </span>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
