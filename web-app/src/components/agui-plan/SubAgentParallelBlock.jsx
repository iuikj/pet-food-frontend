import SubAgentCard from './SubAgentCard';

export default function SubAgentParallelBlock({ cards, buckets }) {
    if (!cards?.length) return null;

    return (
        <section className="my-2">
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
