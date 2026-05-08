import SecureImage from '../SecureImage';
import { derivePhase } from '../../utils/aguiPlanEvents';

/**
 * 顶部任务上下文。
 * 在 AGUI run 页保持低信息噪声,只呈现执行对象与当前 workflow phase。
 */
const PHASE_LABEL = {
    idle:     { label: '待启动', className: 'agui-phase-badge--muted' },
    starting: { label: '准备中', className: 'agui-phase-badge--warm' },
    research: { label: '研究中', className: 'agui-phase-badge--warm' },
    dispatch: { label: '调度中', className: 'agui-phase-badge--cool' },
    weeks:    { label: '生成中', className: 'agui-phase-badge--cool' },
    finalize: { label: '汇总中', className: 'agui-phase-badge--muted' },
    done:     { label: '完成', className: 'agui-phase-badge--done' },
    error:    { label: '失败', className: 'agui-phase-badge--error' },
};

export default function PetHero({ pet, events, isRunning, error }) {
    const phase = error ? 'error' : derivePhase(events, isRunning);
    const meta = PHASE_LABEL[phase] ?? PHASE_LABEL.idle;

    return (
        <section className="agui-context-card">
            <div className="flex items-center gap-3.5">
                <div className="relative shrink-0">
                    <div className="relative flex size-[58px] items-center justify-center overflow-hidden rounded-[22px] border border-white/70 bg-white/70 shadow-[0_10px_24px_rgba(34,31,25,0.08)]">
                        {pet?.avatar_url ? (
                            <SecureImage
                                src={pet.avatar_url}
                                alt={pet.name}
                                className="size-full object-cover"
                            />
                        ) : (
                            <span className="text-xl font-semibold text-[var(--agui-green-ink)]">
                                {pet?.name?.[0] ?? '?'}
                            </span>
                        )}
                    </div>
                    {isRunning && !error && (
                        <span className="agui-avatar-orbit" />
                    )}
                </div>

                <div className="min-w-0 flex-1">
                    <div className="mb-1.5 flex items-center gap-2">
                        <h2 className="truncate text-[17px] font-semibold leading-none tracking-normal">
                            {pet ? `${pet.name} 的计划` : '未选择宠物'}
                        </h2>
                        <span className={`agui-phase-badge ${meta.className}`}>
                            {meta.label}
                        </span>
                    </div>
                    <p className="truncate text-[12px] leading-5 text-[var(--agui-muted)]">
                        {pet ? [pet.breed, pet.age ? `${pet.age}月龄` : null, pet.weight ? `${pet.weight}kg` : null].filter(Boolean).join(' · ') : '正在准备宠物档案'}
                    </p>
                    {error && (
                        <p className="mt-1.5 truncate text-[11px] text-red-600" title={error}>
                            {error}
                        </p>
                    )}
                </div>
            </div>

        </section>
    );
}
