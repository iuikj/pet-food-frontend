import { Link, useNavigate } from 'react-router-dom';
import PageHeader from '../components/layout/PageHeader';
import SecureImage from '../components/SecureImage';
import { usePets } from '../hooks/usePets';

/**
 * /agui-plan — AI 生成入口页。
 * 显示当前选中宠物的预览 + 流程介绍 + "开始生成"按钮。
 *
 * 此页面不进入 CopilotKitProvider; 真正启动 agent 在 /agui-plan/run。
 */
export default function AGUIPlanLanding() {
    const navigate = useNavigate();
    const { currentPet } = usePets();

    const canStart = !!currentPet;

    return (
        <div className="min-h-[100dvh] flex flex-col bg-background-light dark:bg-background-dark">
            <PageHeader title="AI 智能餐单生成" onBack={() => navigate(-1)} />

            <main className="flex-1 flex flex-col px-4 pt-6 pb-32 gap-5 max-w-md mx-auto w-full">
                <div className="text-center mt-2 mb-1">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-bold">
                        <span className="material-icons-round text-sm">auto_awesome</span>
                        AG-UI v2 实时事件流
                    </span>
                </div>

                {/* 宠物预览卡 */}
                {currentPet ? (
                    <section className="bg-white dark:bg-surface-dark rounded-3xl p-5 shadow-soft border border-gray-100 dark:border-gray-800">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-16 h-16 rounded-full overflow-hidden bg-primary/15 flex items-center justify-center shrink-0">
                                {currentPet.avatar_url ? (
                                    <SecureImage
                                        src={currentPet.avatar_url}
                                        alt={currentPet.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <span className="text-2xl font-bold text-primary">
                                        {currentPet.name?.[0]}
                                    </span>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h2 className="font-bold text-xl truncate">{currentPet.name}</h2>
                                <p className="text-xs text-text-muted-light truncate">
                                    {[
                                        currentPet.type === 'cat' ? '猫咪' : '狗狗',
                                        currentPet.breed,
                                        `${currentPet.age}月龄`,
                                        `${currentPet.weight}kg`,
                                    ]
                                        .filter(Boolean)
                                        .join(' · ')}
                                </p>
                            </div>
                        </div>
                        <div className="space-y-2 pt-3 border-t border-gray-100 dark:border-gray-800">
                            <PreviewRow label="健康状况" value={currentPet.health_status || '健康'} />
                            <PreviewRow label="计划周期" value="4 周(差异化)" />
                            <PreviewRow label="预计耗时" value="约 2-3 分钟" />
                        </div>
                    </section>
                ) : (
                    <section className="bg-white dark:bg-surface-dark p-6 rounded-3xl shadow-soft text-center">
                        <span className="material-icons-round text-5xl text-text-muted-light mb-2">pets</span>
                        <p className="text-sm text-text-muted-light mb-4">
                            还未选择宠物,请先回主页选择
                        </p>
                        <Link
                            to="/"
                            className="inline-block px-5 py-2 rounded-xl bg-primary text-white font-bold text-sm"
                        >
                            返回主页
                        </Link>
                    </section>
                )}

                {/* 流程预览 */}
                <section className="grid grid-cols-3 gap-2">
                    <PhaseChip icon="science" label="研究" />
                    <PhaseChip icon="restaurant_menu" label="并行制定" />
                    <PhaseChip icon="summarize" label="结构化" />
                </section>

                {/* 描述 */}
                <p className="text-xs text-text-muted-light text-center leading-relaxed px-4">
                    全程实时展示 AI 工作过程: 调研、思考、工具调用、4 周 SubAgent 并行制定;
                    任意一周可单独展开查看检索关键词与撰写细节。
                </p>

                {/* 启动按钮 */}
                <button
                    type="button"
                    onClick={() => navigate('/agui-plan/run')}
                    disabled={!canStart}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-primary to-primary/80 text-white dark:text-gray-900 font-bold shadow-glow disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-transform flex items-center justify-center gap-2 mt-2"
                >
                    <span className="material-icons-round">auto_awesome</span>
                    开始 AI 生成
                </button>
            </main>
        </div>
    );
}

function PreviewRow({ label, value }) {
    return (
        <div className="flex items-start gap-3 text-xs">
            <span className="text-text-muted-light w-16 shrink-0 font-semibold">{label}</span>
            <span className="flex-1 text-text-main-light dark:text-text-main-dark leading-snug break-words">
                {value}
            </span>
        </div>
    );
}

function PhaseChip({ icon, label }) {
    return (
        <div className="flex flex-col items-center gap-1.5 py-3 rounded-xl bg-white dark:bg-surface-dark border border-gray-100 dark:border-gray-800 shadow-soft">
            <span className="material-icons-round text-xl text-primary">{icon}</span>
            <span className="text-xs font-bold">{label}</span>
        </div>
    );
}
