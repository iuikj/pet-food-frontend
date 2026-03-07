import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { pageTransitions } from '../utils/animations';
import { usePlanGeneration } from '../context/PlanGenerationContext';
import { usePets } from '../context/PetContext';

export default function PlanSummary() {
    const navigate = useNavigate();
    const { result, status, resetGeneration } = usePlanGeneration();
    const { currentPet } = usePets();
    const [activeWeek, setActiveWeek] = useState(1);

    // 从 result 提取数据
    const plan = result?.content || result?.pet_diet_plan || result;
    const petName = currentPet?.name || result?.pet_breed || '您的爱宠';
    const healthStatus = currentPet?.health_status || result?.health_status || '';
    const planName = plan?.plan_name || `${petName} 的专属计划`;
    const summary = plan?.summary || plan?.ai_suggestions || '';
    const weeks = plan?.weeks || [];
    const duration = plan?.duration || `${weeks.length} 周`;

    // 当前选中的周数据
    const currentWeek = weeks.find(w => w.week === activeWeek) || weeks[0];

    // 如果没有 result 且不是 completed 状态，显示加载或提示
    if (!result && status !== 'completed') {
        return (
            <motion.div
                {...pageTransitions}
                className="pb-28 overflow-x-hidden"
            >
                <header className="px-6 pt-12 pb-4 flex justify-between items-center bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md sticky top-0 z-50">
                    <div className="flex items-center gap-3">
                        <Link to="/" className="w-10 h-10 rounded-full flex items-center justify-center text-text-muted-light dark:text-text-muted-dark hover:bg-gray-100 dark:hover:bg-surface-dark transition-colors">
                            <span className="material-symbols-outlined text-lg">arrow_back</span>
                        </Link>
                        <h1 className="text-xl font-bold">专属计划</h1>
                    </div>
                </header>
                <main className="px-6 flex flex-col items-center justify-center min-h-[60vh]">
                    <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                        <span className="material-symbols-outlined text-primary text-4xl">restaurant_menu</span>
                    </div>
                    <h2 className="font-bold text-xl mb-3 text-text-main-light dark:text-text-main-dark">暂无计划数据</h2>
                    <p className="text-sm text-text-muted-light dark:text-text-muted-dark text-center mb-8 max-w-xs">
                        还没有生成过饮食计划，快为您的爱宠创建一个专属计划吧！
                    </p>
                    <button
                        onClick={() => navigate('/plan/create')}
                        className="px-8 py-3 bg-primary text-white rounded-2xl font-bold shadow-glow hover:brightness-110 transition-all flex items-center gap-2"
                    >
                        <span className="material-symbols-outlined">add</span>
                        创建计划
                    </button>
                </main>
            </motion.div>
        );
    }

    return (
        <motion.div
            {...pageTransitions}
            className="pb-28 overflow-x-hidden"
        >
            <header className="px-6 pt-12 pb-4 flex justify-between items-center bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md sticky top-0 z-50">
                <div className="flex items-center gap-3">
                    <Link to="/" className="w-10 h-10 rounded-full flex items-center justify-center text-text-muted-light dark:text-text-muted-dark hover:bg-gray-100 dark:hover:bg-surface-dark transition-colors">
                        <span className="material-symbols-outlined text-lg">arrow_back</span>
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold">{planName}</h1>
                        <p className="text-xs text-text-muted-light dark:text-text-muted-dark">
                            {duration} • {healthStatus || '定制营养方案'}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button className="w-10 h-10 rounded-full flex items-center justify-center text-text-main-light dark:text-text-main-dark bg-white dark:bg-surface-dark shadow-sm hover:text-primary transition-colors">
                        <span className="material-symbols-outlined">share</span>
                    </button>
                </div>
            </header>

            <main className="px-6 space-y-6">
                {/* Agent 总结卡片 */}
                <section>
                    <div className="bg-white dark:bg-surface-dark p-5 rounded-3xl shadow-soft border border-primary/20 hover:shadow-medium transition-all duration-300">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary shrink-0 relative">
                                <span className="material-symbols-outlined text-2xl animate-pulse">smart_toy</span>
                                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-surface-dark flex items-center justify-center">
                                    <span className="material-symbols-outlined text-[10px] text-white">check</span>
                                </div>
                            </div>
                            <div className="flex-1">
                                <h2 className="text-base font-bold text-text-main-light dark:text-text-main-dark mb-1">
                                    Agent 已为您生成专属计划
                                </h2>
                                <p className="text-sm text-text-muted-light dark:text-text-muted-dark leading-relaxed">
                                    {summary || `为 ${petName} 制定的个性化饮食计划已准备就绪。`}
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 每日营养目标 */}
                {currentWeek && (
                    <section>
                        <div className="flex justify-between items-end mb-4">
                            <h3 className="font-bold text-lg">每日营养目标</h3>
                            <Link to="/plan/details" className="text-xs text-primary font-medium flex items-center gap-1">
                                查看详情 <span className="material-symbols-outlined text-sm">chevron_right</span>
                            </Link>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-surface-light dark:bg-surface-dark p-5 rounded-[2rem] shadow-soft relative overflow-hidden group hover:shadow-medium hover:-translate-y-1 transition-all duration-300">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-secondary/10 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
                                <div className="relative z-10">
                                    <div className="flex items-center gap-2 mb-3 text-secondary-600 dark:text-secondary-400">
                                        <span className="material-symbols-outlined text-xl text-yellow-500">local_fire_department</span>
                                        <span className="text-xs font-bold uppercase tracking-wider text-text-muted-light">热量</span>
                                    </div>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-3xl font-bold font-display">
                                            {currentWeek.daily_calories || '--'}
                                        </span>
                                        <span className="text-sm text-text-muted-light font-medium">kcal</span>
                                    </div>
                                    <div className="mt-3 w-full bg-gray-100 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                                        <div className="bg-yellow-400 h-full rounded-full" style={{ width: '85%' }}></div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-surface-light dark:bg-surface-dark p-5 rounded-[2rem] shadow-soft relative overflow-hidden group hover:shadow-medium hover:-translate-y-1 transition-all duration-300">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-accent-blue/10 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
                                <div className="relative z-10">
                                    <div className="flex items-center gap-2 mb-3 text-blue-500">
                                        <span className="material-symbols-outlined text-xl">water_drop</span>
                                        <span className="text-xs font-bold uppercase tracking-wider text-text-muted-light">饮水量</span>
                                    </div>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-3xl font-bold font-display">
                                            {currentWeek.daily_water || '--'}
                                        </span>
                                        <span className="text-sm text-text-muted-light font-medium">ml</span>
                                    </div>
                                    <div className="mt-3 w-full bg-gray-100 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                                        <div className="bg-blue-300 h-full rounded-full" style={{ width: '60%' }}></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* 宏量营养素 */}
                        {(currentWeek.protein || currentWeek.fat || currentWeek.carbs) && (
                            <div className="grid grid-cols-3 gap-3 mt-3">
                                <div className="bg-white dark:bg-surface-dark p-3 rounded-2xl shadow-sm text-center border border-gray-100 dark:border-gray-800">
                                    <p className="text-xs text-text-muted-light mb-1">蛋白质</p>
                                    <p className="font-bold text-primary">{currentWeek.protein || '--'}</p>
                                </div>
                                <div className="bg-white dark:bg-surface-dark p-3 rounded-2xl shadow-sm text-center border border-gray-100 dark:border-gray-800">
                                    <p className="text-xs text-text-muted-light mb-1">脂肪</p>
                                    <p className="font-bold text-yellow-500">{currentWeek.fat || '--'}</p>
                                </div>
                                <div className="bg-white dark:bg-surface-dark p-3 rounded-2xl shadow-sm text-center border border-gray-100 dark:border-gray-800">
                                    <p className="text-xs text-text-muted-light mb-1">碳水</p>
                                    <p className="font-bold text-blue-400">{currentWeek.carbs || '--'}</p>
                                </div>
                            </div>
                        )}
                    </section>
                )}

                {/* 周计划切换 + 内容 */}
                {weeks.length > 0 && (
                    <section>
                        {/* 周选择 tabs */}
                        <div className="flex gap-4 mb-5 overflow-x-auto no-scrollbar pb-1">
                            {weeks.map((week) => (
                                <button
                                    key={week.week}
                                    onClick={() => setActiveWeek(week.week)}
                                    className={`px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${activeWeek === week.week
                                        ? 'bg-primary text-white shadow-soft'
                                        : 'bg-white dark:bg-surface-dark text-text-muted-light border border-gray-100 dark:border-gray-700 hover:border-primary/30'
                                        }`}
                                >
                                    第 {week.week} 周
                                </button>
                            ))}
                        </div>

                        {/* 当前周信息 */}
                        {currentWeek && (
                            <div className="bg-white dark:bg-surface-dark p-5 rounded-2xl shadow-soft border border-gray-100 dark:border-gray-800 mb-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="material-symbols-outlined text-primary text-lg">event_note</span>
                                    <h4 className="font-bold text-base">{currentWeek.theme || `第 ${currentWeek.week} 周`}</h4>
                                </div>
                                <p className="text-sm text-text-muted-light dark:text-text-muted-dark leading-relaxed">
                                    {currentWeek.description || ''}
                                </p>
                                {currentWeek.daily_calories && (
                                    <div className="mt-3 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-yellow-500 text-sm">local_fire_department</span>
                                        <span className="text-xs font-semibold text-text-muted-light">
                                            每日目标: {currentWeek.daily_calories} kcal
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* 每日食谱时间线 */}
                        {currentWeek?.meals && currentWeek.meals.length > 0 && (
                            <div className="relative space-y-6">
                                <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-gray-200 dark:bg-gray-700 -z-10"></div>
                                {currentWeek.meals.map((meal, idx) => {
                                    const mealIcons = ['wb_sunny', 'restaurant', 'dark_mode'];
                                    const mealColors = [
                                        'bg-secondary text-yellow-900',
                                        'bg-white dark:bg-surface-dark text-text-muted-light border border-gray-200 dark:border-gray-600',
                                        'bg-slate-700 text-white'
                                    ];
                                    return (
                                        <div key={idx} className="flex gap-4 group">
                                            <div className={`w-10 h-10 rounded-full ${mealColors[idx % 3]} flex items-center justify-center shadow-sm shrink-0 z-10 ring-4 ring-background-light dark:ring-background-dark`}>
                                                <span className="material-symbols-outlined text-lg">{mealIcons[idx % 3]}</span>
                                            </div>
                                            <div className="flex-1 bg-white dark:bg-surface-dark rounded-2xl p-4 shadow-soft border border-gray-100 dark:border-gray-800 hover:border-secondary/50 hover:shadow-medium transition-all duration-300">
                                                <div className="flex justify-between items-start mb-2">
                                                    <h4 className="font-bold text-base">{meal.name || meal.title || `餐 ${idx + 1}`}</h4>
                                                    {meal.time && (
                                                        <span className="text-xs font-semibold bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-lg">{meal.time}</span>
                                                    )}
                                                </div>
                                                {meal.ingredients && meal.ingredients.length > 0 && (
                                                    <div className="flex flex-wrap gap-2 mb-3">
                                                        {meal.ingredients.map((ing, i) => {
                                                            const colors = [
                                                                'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300',
                                                                'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-300',
                                                                'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-300',
                                                                'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300',
                                                            ];
                                                            const ingText = typeof ing === 'string' ? ing : `${ing.name} ${ing.amount || ''}`;
                                                            return (
                                                                <span key={i} className={`text-xs px-2 py-1 ${colors[i % colors.length]} rounded-md`}>
                                                                    {ingText}
                                                                </span>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                                {meal.tip && (
                                                    <div className="flex items-start gap-2 text-xs text-text-muted-light dark:text-text-muted-dark bg-background-light dark:bg-background-dark p-3 rounded-xl">
                                                        <span className="material-symbols-outlined text-sm mt-0.5 text-primary">tips_and_updates</span>
                                                        <p>{meal.tip}</p>
                                                    </div>
                                                )}
                                                {meal.cooking_tip && (
                                                    <p className="text-xs text-text-muted-light dark:text-text-muted-dark leading-relaxed mt-2">
                                                        <span className="font-bold text-primary">烹饪建议:</span> {meal.cooking_tip}
                                                    </p>
                                                )}
                                                {meal.supplement && (
                                                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                                                        <span className="material-symbols-outlined text-purple-500 text-lg">medication</span>
                                                        <span className="text-xs font-medium text-text-main-light dark:text-text-main-dark">
                                                            添加: {meal.supplement}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </section>
                )}

                {/* Agent 特别提示 */}
                {(plan?.tips || plan?.ai_suggestions || plan?.special_notes) && (
                    <section className="pb-6">
                        <div className="bg-primary/5 dark:bg-primary/10 rounded-3xl p-5 border border-primary/10 dark:border-primary/20 hover:shadow-soft transition-all duration-300">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="material-symbols-outlined text-primary">verified</span>
                                <h3 className="font-bold text-text-main-light dark:text-text-main-dark">Agent 特别提示</h3>
                            </div>
                            {Array.isArray(plan.tips) ? (
                                <ul className="space-y-2 text-sm text-text-muted-light dark:text-text-muted-dark list-disc list-inside">
                                    {plan.tips.map((tip, i) => (
                                        <li key={i}>{tip}</li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-sm text-text-muted-light dark:text-text-muted-dark leading-relaxed">
                                    {plan.tips || plan.ai_suggestions || plan.special_notes}
                                </p>
                            )}
                        </div>
                    </section>
                )}

                {/* 如果没有 tips 但有 summary，显示 summary 摘要 */}
                {!plan?.tips && !plan?.ai_suggestions && !plan?.special_notes && summary && (
                    <section className="pb-6">
                        <div className="bg-primary/5 dark:bg-primary/10 rounded-3xl p-5 border border-primary/10 dark:border-primary/20 hover:shadow-soft transition-all duration-300">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="material-symbols-outlined text-primary">verified</span>
                                <h3 className="font-bold text-text-main-light dark:text-text-main-dark">计划摘要</h3>
                            </div>
                            <p className="text-sm text-text-muted-light dark:text-text-muted-dark leading-relaxed">
                                {summary}
                            </p>
                        </div>
                    </section>
                )}

                {/* 重新生成按钮 */}
                <section className="pb-6">
                    <button
                        onClick={() => {
                            resetGeneration();
                            navigate('/plan/create');
                        }}
                        className="w-full py-3 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 text-text-muted-light dark:text-text-muted-dark font-medium hover:border-primary/50 hover:text-primary transition-all flex items-center justify-center gap-2"
                    >
                        <span className="material-symbols-outlined text-lg">refresh</span>
                        重新生成计划
                    </button>
                </section>
            </main>
        </motion.div>
    );
}
