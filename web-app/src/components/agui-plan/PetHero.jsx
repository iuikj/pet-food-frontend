import { motion } from 'framer-motion'; // eslint-disable-line no-unused-vars -- motion used via JSX <motion.circle>
import SecureImage from '../SecureImage';
import { derivePhase, deriveOverallProgress } from '../../utils/aguiPlanEvents';

/**
 * 顶部宠物 Hero 区。
 * 显示宠物头像、名字、phase chip、总进度环。
 */
const PHASE_LABEL = {
    idle:      { label: '待启动',   color: 'text-text-muted-light',     bg: 'bg-gray-100 dark:bg-gray-800'   },
    starting:  { label: '准备中',   color: 'text-amber-600',            bg: 'bg-amber-100 dark:bg-amber-900/30' },
    research:  { label: '研究阶段', color: 'text-amber-600',            bg: 'bg-amber-100 dark:bg-amber-900/30' },
    dispatch:  { label: '分发任务', color: 'text-primary',              bg: 'bg-primary/15'                  },
    weeks:     { label: '并行制定', color: 'text-purple-600',           bg: 'bg-purple-100 dark:bg-purple-900/30' },
    finalize:  { label: '汇总结构化', color: 'text-primary',           bg: 'bg-primary/15'                  },
    done:      { label: '已完成',   color: 'text-green-600',            bg: 'bg-green-100 dark:bg-green-900/30' },
    error:     { label: '出错',     color: 'text-red-600',              bg: 'bg-red-100 dark:bg-red-900/30'  },
};

export default function PetHero({ pet, events, isRunning, error }) {
    const phase = error ? 'error' : derivePhase(events, isRunning);
    const progress = Math.max(deriveOverallProgress(events), error ? 0 : (isRunning ? 1 : 0));
    const meta = PHASE_LABEL[phase] ?? PHASE_LABEL.idle;

    return (
        <section className="bg-white dark:bg-surface-dark rounded-3xl p-5 shadow-soft border border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-4">
                {/* 头像 */}
                <div className="relative shrink-0">
                    <ProgressRing progress={progress} size={64} />
                    <div className="absolute inset-2 rounded-full overflow-hidden bg-primary/15 flex items-center justify-center">
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
                </div>

                {/* 名字 + 信息 */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <h2 className="font-bold text-lg truncate">
                            {pet?.name ?? '未选择宠物'}
                        </h2>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${meta.bg} ${meta.color} shrink-0`}>
                            {meta.label}
                        </span>
                    </div>
                    <p className="text-xs text-text-muted-light dark:text-text-muted-dark truncate">
                        {pet ? `${pet.breed} · ${pet.age}月龄 · ${pet.weight}kg` : '请先在主页选择宠物'}
                    </p>
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

function ProgressRing({ progress, size = 64 }) {
    const stroke = 4;
    const radius = (size - stroke) / 2;
    const circ = 2 * Math.PI * radius;
    // 防御 undefined/NaN/string,避免 framer-motion 报 "animate from undefined"
    const safeProgress = Math.max(0, Math.min(100, Number(progress) || 0));
    const offset = circ - (safeProgress / 100) * circ;

    return (
        <svg width={size} height={size} className="-rotate-90 shrink-0">
            <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeWidth={stroke}
                className="text-gray-200 dark:text-gray-700"
            />
            <motion.circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeWidth={stroke}
                strokeLinecap="round"
                strokeDasharray={circ}
                initial={{ strokeDashoffset: circ }}
                animate={{ strokeDashoffset: offset }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="text-primary"
            />
        </svg>
    );
}
