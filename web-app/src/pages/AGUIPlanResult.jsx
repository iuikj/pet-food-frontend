import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/layout/PageHeader';

/**
 * /agui-plan/result — v2 任务式生成的独立结果页。
 *
 * 数据来源:sessionStorage('agui_plan_result') — 由 AGUIPlanRun 在 COMPLETED 事件后写入。
 * detail 形状:{ plans: [WeeklyDietPlan...], ai_suggestions: string }
 *
 * MVP 范围:仅展示生成的 4 周计划摘要,提供"返回主页"按钮。
 * 后续扩展:调 backend POST /api/v1/plans/import 把结果持久化为 DietPlan 记录。
 */

// 用 lazy initializer 一次性读取 sessionStorage,避免 useEffect 内 setState 触发级联渲染
function loadInitialDetail() {
    if (typeof window === 'undefined') return { detail: null, error: null };
    try {
        const raw = window.sessionStorage.getItem('agui_plan_result');
        if (!raw) return { detail: null, error: null };
        return { detail: JSON.parse(raw), error: null };
    } catch {
        return { detail: null, error: '结果解析失败' };
    }
}

export default function AGUIPlanResult() {
    const navigate = useNavigate();
    const [{ detail, error }] = useState(loadInitialDetail);

    // 没结果 → 返回入口 (在 effect 里 navigate,避免渲染期跳转)
    useEffect(() => {
        if (!detail && !error) {
            navigate('/agui-plan', { replace: true });
        }
    }, [detail, error, navigate]);

    if (error) {
        return (
            <div className="min-h-[100dvh] flex flex-col items-center justify-center px-6 text-center">
                <span className="material-icons-round text-5xl text-red-500 mb-3">error_outline</span>
                <h2 className="font-bold mb-2">加载失败</h2>
                <p className="text-sm text-text-muted-light mb-6">{error}</p>
                <button
                    type="button"
                    onClick={() => navigate('/agui-plan')}
                    className="px-6 py-2.5 rounded-xl bg-primary text-white font-bold"
                >
                    返回入口
                </button>
            </div>
        );
    }

    if (!detail) {
        return (
            <div className="min-h-[100dvh] flex items-center justify-center">
                <span className="material-icons-round text-3xl text-primary animate-spin-slow">sync</span>
            </div>
        );
    }

    const plans = Array.isArray(detail.plans) ? detail.plans : [];
    const aiSuggestions = detail.ai_suggestions || '';

    return (
        <div className="min-h-[100dvh] bg-background-light dark:bg-background-dark pb-32">
            <PageHeader title="AI 餐单已就绪" onBack={() => navigate('/agui-plan')} />

            <main className="px-4 pt-4 max-w-2xl mx-auto space-y-4">
                {/* 成功 Hero */}
                <section className="bg-gradient-to-br from-primary/10 to-primary/5 dark:from-primary/15 dark:to-primary/5 rounded-3xl p-6 border border-primary/30 text-center">
                    <span className="material-icons-round text-5xl text-primary mb-2">celebration</span>
                    <h2 className="font-bold text-lg mb-1">生成成功</h2>
                    <p className="text-xs text-text-muted-light">
                        共 <strong className="text-primary">{plans.length}</strong> 周差异化饮食计划
                    </p>
                </section>

                {/* AI 建议 */}
                {aiSuggestions && (
                    <section className="bg-white dark:bg-surface-dark rounded-2xl p-4 shadow-soft border border-gray-100 dark:border-gray-800">
                        <h3 className="text-xs font-bold text-text-muted-light uppercase tracking-wide mb-2 flex items-center gap-1.5">
                            <span className="material-icons-round text-sm">auto_awesome</span>
                            AI 综合建议
                        </h3>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                            {aiSuggestions}
                        </p>
                    </section>
                )}

                {/* 4 周预览卡片 */}
                <section className="space-y-3">
                    <h3 className="text-xs font-bold text-text-muted-light uppercase tracking-wide px-1">
                        周计划详情
                    </h3>
                    {plans
                        .slice()
                        .sort((a, b) => (a.oder ?? 0) - (b.oder ?? 0))
                        .map((week, i) => (
                            <WeekPreviewCard key={i} week={week} />
                        ))}
                </section>
            </main>

            {/* 底部操作栏 */}
            <nav className="fixed bottom-0 left-0 right-0 z-30 px-4 pb-safe pt-3 bg-white/95 dark:bg-surface-dark/95 backdrop-blur-md border-t border-gray-100 dark:border-gray-800">
                <div className="max-w-2xl mx-auto pb-4 flex gap-2">
                    <button
                        type="button"
                        onClick={() => navigate('/agui-plan')}
                        className="flex-1 py-3 rounded-2xl bg-gray-100 dark:bg-gray-800 text-text-main-light dark:text-text-main-dark font-bold text-sm"
                    >
                        重新生成
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate('/')}
                        className="flex-1 py-3 rounded-2xl bg-primary text-white dark:text-gray-900 font-bold text-sm flex items-center justify-center gap-2"
                    >
                        <span className="material-icons-round text-base">home</span>
                        返回主页
                    </button>
                </div>
            </nav>
        </div>
    );
}

function WeekPreviewCard({ week }) {
    const order = week.oder ?? '?';
    const principle =
        week.diet_adjustment_principle || week.principle || '(未生成调整原则)';
    const meals =
        week.weekly_diet_plan?.daily_diet_plans ||
        week.daily_diet_plans ||
        [];
    const suggestions = week.suggestions || [];

    return (
        <article className="bg-white dark:bg-surface-dark rounded-2xl p-4 shadow-soft border border-gray-100 dark:border-gray-800 space-y-3">
            <header className="flex items-center justify-between">
                <h4 className="font-bold text-sm">第 {order} 周</h4>
                <span className="text-[10px] text-text-muted-light">
                    {meals.length} 餐
                </span>
            </header>
            <p className="text-xs text-text-main-light dark:text-text-main-dark leading-relaxed line-clamp-3">
                {principle}
            </p>
            {meals.length > 0 && (
                <details>
                    <summary className="cursor-pointer text-[10px] text-primary font-semibold list-none flex items-center gap-1">
                        <span className="material-icons-round text-xs transition-transform group-open:rotate-90">
                            chevron_right
                        </span>
                        查看 {meals.length} 餐详情
                    </summary>
                    <ul className="mt-2 space-y-1.5">
                        {meals.map((meal, i) => (
                            <li
                                key={i}
                                className="flex items-start gap-2 text-[11px] py-1 border-b border-gray-100 dark:border-gray-800 last:border-b-0"
                            >
                                <span className="font-mono text-text-muted-light shrink-0">
                                    {meal.time || `第${meal.oder ?? i + 1}餐`}
                                </span>
                                <span className="flex-1 break-words">
                                    {(meal.food_items || [])
                                        .map((f) => `${f.name}${f.weight ? `(${f.weight})` : ''}`)
                                        .join(' / ') || '(无食材)'}
                                </span>
                            </li>
                        ))}
                    </ul>
                </details>
            )}
            {suggestions.length > 0 && (
                <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                    <p className="text-[10px] font-bold text-text-muted-light uppercase mb-1">
                        建议
                    </p>
                    <ul className="space-y-1">
                        {suggestions.slice(0, 3).map((s, i) => (
                            <li key={i} className="text-[11px] text-text-muted-light flex gap-1">
                                <span>·</span>
                                <span className="flex-1 break-words">{s}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </article>
    );
}
