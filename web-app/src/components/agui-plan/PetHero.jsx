import SecureImage from '../SecureImage';
import { derivePhase } from '../../utils/aguiPlanEvents';

/**
 * 顶部宠物 Hero 区。
 * 显示宠物头像、名字、phase chip。
 */
const PHASE_LABEL = {
    idle:      { label: '待启动', color: 'text-neutral-500', bg: 'bg-neutral-200/70' },
    starting:  { label: '准备中', color: 'text-amber-700', bg: 'bg-amber-200/70' },
    research:  { label: '研究阶段', color: 'text-stone-700', bg: 'bg-stone-200/80' },
    dispatch:  { label: '调度中', color: 'text-sky-700', bg: 'bg-sky-200/70' },
    weeks:     { label: '并行执行', color: 'text-slate-700', bg: 'bg-slate-200/80' },
    finalize:  { label: '汇总中', color: 'text-zinc-700', bg: 'bg-zinc-200/80' },
    done:      { label: '已完成', color: 'text-emerald-700', bg: 'bg-emerald-200/70' },
    error:     { label: '出错', color: 'text-red-700', bg: 'bg-red-200/70' },
};

export default function PetHero({ pet, events, isRunning, error }) {
    const phase = error ? 'error' : derivePhase(events, isRunning);
    const meta = PHASE_LABEL[phase] ?? PHASE_LABEL.idle;

    return (
        <section className="py-2">
            <div className="flex items-center gap-4">
                <div className="relative shrink-0">
                    <div className="relative h-16 w-16 overflow-hidden rounded-lg border bg-muted flex items-center justify-center">
                        {pet?.avatar_url ? (
                            <SecureImage
                                src={pet.avatar_url}
                                alt={pet.name}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <span className="text-xl font-bold text-primary">
                                {pet?.name?.[0] ?? '?'}
                            </span>
                        )}
                    </div>
                    {isRunning && !error && (
                        <span className="absolute -right-1 -top-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500 shadow-sm" />
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <h2 className="truncate text-lg font-bold">
                            {pet?.name ?? '未选择宠物'}
                        </h2>
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold tracking-[0.08em] ${meta.bg} ${meta.color}`}>
                            {meta.label}
                        </span>
                    </div>
                    <p className="truncate text-xs text-text-muted-light dark:text-text-muted-dark">
                        {pet ? `${pet.breed} · ${pet.age}月龄 · ${pet.weight}kg` : '请先在主页选择宠物'}
                    </p>
                    {!error && (
                        <p className="mt-1.5 text-[11px] text-text-muted-light dark:text-text-muted-dark">
                            {isRunning ? 'Agent 在后台持续推进任务流，不显示伪百分比。' : '启动后将按研究、调度、并行执行、汇总四个阶段推进。'}
                        </p>
                    )}
                    {error && (
                        <p className="text-xs text-red-600 mt-1.5 truncate" title={error}>
                            {error}
                        </p>
                    )}
                </div>
            </div>
        </section>
    );
}
