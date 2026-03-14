import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Toast } from '@capacitor/toast';
import { pageTransitions } from '../utils/animations';
import { usePlanGeneration } from '../context/PlanGenerationContext';
import { usePets } from '../context/PetContext';
import { plansApi } from '../api';
import { transformPetDietPlan } from '../models/dietPlan';
import PlanDetails from './PlanDetails';

export default function PlanSummary() {
    const navigate = useNavigate();
    const location = useLocation();
    const { result, status, resetGeneration, planId: generatedPlanId } = usePlanGeneration();
    const { currentPet, activePlanId, setActivePlan, setActivePlanData } = usePets();
    const [activeWeek, setActiveWeek] = useState(1);

    // 饮食原则/建议默认折叠
    const [isPrincipleExpanded, setIsPrincipleExpanded] = useState(false);
    const [isSuggestionsExpanded, setIsSuggestionsExpanded] = useState(false);

    // 保存状态
    const [isSaved, setIsSaved] = useState(false);

    // 餐食详情弹窗状态
    const [selectedMeal, setSelectedMeal] = useState(null);

    // 支持从食谱列表页通过 planId 路由跳转查看
    const routePlanId = location.state?.planId;
    const [routeResult, setRouteResult] = useState(null);
    const [routeLoading, setRouteLoading] = useState(false);

    // 确定展示用的 planId — 优先路由传入，其次生成产出
    const effectivePlanId = routePlanId || generatedPlanId;

    // 通过路由 planId 加载计划详情
    useEffect(() => {
        if (!routePlanId) return;
        let cancelled = false;
        setRouteLoading(true);
        plansApi.getPlan(routePlanId).then(res => {
            if (cancelled) return;
            if (res.code === 0 && res.data) {
                // 后端返回 { plan_data: PetDietPlan, ... }
                // transformPetDietPlan 期望接收 PetDietPlan 结构
                const planData = res.data.plan_data || res.data;
                const transformed = transformPetDietPlan(planData);
                if (transformed) setRouteResult(transformed);
            }
        }).catch(err => {
            console.error('Failed to load plan by id:', err);
        }).finally(() => {
            if (!cancelled) setRouteLoading(false);
        });
        return () => { cancelled = true; };
    }, [routePlanId]);

    // 使用路由加载的结果或生成的结果
    const displayResult = routePlanId ? routeResult : result;

    // 从转换后的 result 提取数据（统一格式：{ ai_suggestions, weeks[] }）
    const aiSuggestions = displayResult?.ai_suggestions || '';
    const weeks = displayResult?.weeks || [];
    const petName = currentPet?.name || '您的爱宠';
    const healthStatus = currentPet?.health_status || '';

    // 判断当前计划是否已保存为活跃计划
    const isCurrentPlanActive = effectivePlanId && activePlanId === effectivePlanId;

    // 当前选中的周数据
    const currentWeek = weeks.find(w => w.week === activeWeek) || weeks[0];

    // 食材标签颜色循环
    const tagColors = [
        'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300',
        'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-300',
        'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-300',
        'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300',
        'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-300',
    ];

    // 没有 result 且不是 completed 状态 → 空状态引导
    if (routeLoading) {
        return (
            <motion.div {...pageTransitions} className="pb-28 overflow-x-hidden">
                <header className="px-6 pt-12 pb-4 flex justify-between items-center bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md sticky top-0 z-50">
                    <div className="flex items-center gap-3">
                        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full flex items-center justify-center text-text-muted-light dark:text-text-muted-dark hover:bg-gray-100 dark:hover:bg-surface-dark transition-colors">
                            <span className="material-symbols-outlined text-lg">arrow_back</span>
                        </button>
                        <h1 className="text-xl font-bold">加载中...</h1>
                    </div>
                </header>
                <main className="px-6 flex flex-col items-center justify-center min-h-[60vh]">
                    <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                </main>
            </motion.div>
        );
    }

    if (!displayResult && status !== 'completed') {
        return (
            <motion.div {...pageTransitions} className="pb-28 overflow-x-hidden">
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
        <motion.div {...pageTransitions} className="pb-28 overflow-x-hidden">
            <header className="px-6 pt-12 pb-4 flex justify-between items-center bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md sticky top-0 z-50">
                <div className="flex items-center gap-3">
                    <Link to="/" className="w-10 h-10 rounded-full flex items-center justify-center text-text-muted-light dark:text-text-muted-dark hover:bg-gray-100 dark:hover:bg-surface-dark transition-colors">
                        <span className="material-symbols-outlined text-lg">arrow_back</span>
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold">{petName} 的专属计划</h1>
                        <p className="text-xs text-text-muted-light dark:text-text-muted-dark">
                            {weeks.length} 周 • {healthStatus || '定制营养方案'}
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
                {aiSuggestions && (
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
                                        {aiSuggestions}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                {/* 每日营养目标 */}
                {currentWeek && (
                    <section>
                        <div className="flex justify-between items-end mb-4">
                            <h3 className="font-bold text-lg">每日营养目标</h3>
                        </div>
                        {/* 热量卡片 */}
                        <div className="bg-surface-light dark:bg-surface-dark p-5 rounded-[2rem] shadow-soft relative overflow-hidden group hover:shadow-medium hover:-translate-y-1 transition-all duration-300 mb-3">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-secondary/10 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
                            <div className="relative z-10">
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="material-symbols-outlined text-xl text-yellow-500">local_fire_department</span>
                                    <span className="text-xs font-bold uppercase tracking-wider text-text-muted-light">每日热量</span>
                                </div>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-3xl font-bold font-display">
                                        {currentWeek.dailyCalories || '--'}
                                    </span>
                                    <span className="text-sm text-text-muted-light font-medium">kcal</span>
                                </div>
                            </div>
                        </div>
                        {/* 宏量营养素 */}
                        <div className="grid grid-cols-3 gap-3">
                            <div className="bg-white dark:bg-surface-dark p-3 rounded-2xl shadow-sm text-center border border-gray-100 dark:border-gray-800">
                                <p className="text-xs text-text-muted-light mb-1">蛋白质</p>
                                <p className="font-bold text-primary">{currentWeek.dailyProtein ? `${currentWeek.dailyProtein}g` : '--'}</p>
                            </div>
                            <div className="bg-white dark:bg-surface-dark p-3 rounded-2xl shadow-sm text-center border border-gray-100 dark:border-gray-800">
                                <p className="text-xs text-text-muted-light mb-1">脂肪</p>
                                <p className="font-bold text-yellow-500">{currentWeek.dailyFat ? `${currentWeek.dailyFat}g` : '--'}</p>
                            </div>
                            <div className="bg-white dark:bg-surface-dark p-3 rounded-2xl shadow-sm text-center border border-gray-100 dark:border-gray-800">
                                <p className="text-xs text-text-muted-light mb-1">碳水</p>
                                <p className="font-bold text-blue-400">{currentWeek.dailyCarbs ? `${currentWeek.dailyCarbs}g` : '--'}</p>
                            </div>
                        </div>
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

                        {/* 当前周信息 — 饮食调整原则（可折叠） */}
                        {currentWeek && currentWeek.principle && (
                            <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-soft border border-gray-100 dark:border-gray-800 mb-4 overflow-hidden">
                                <button
                                    onClick={() => setIsPrincipleExpanded(!isPrincipleExpanded)}
                                    className="w-full flex items-center justify-between p-5"
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-primary text-lg">event_note</span>
                                        <h4 className="font-bold text-base">第 {currentWeek.week} 周 饮食原则</h4>
                                    </div>
                                    <motion.span
                                        className="material-symbols-outlined text-text-muted-light dark:text-text-muted-dark text-lg"
                                        animate={{ rotate: isPrincipleExpanded ? 180 : 0 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        expand_more
                                    </motion.span>
                                </button>
                                <AnimatePresence initial={false}>
                                    {isPrincipleExpanded && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.25, ease: 'easeInOut' }}
                                            className="overflow-hidden"
                                        >
                                            <div className="px-5 pb-5 pt-0">
                                                <p className="text-sm text-text-muted-light dark:text-text-muted-dark leading-relaxed">
                                                    {currentWeek.principle}
                                                </p>
                                                {currentWeek.dailyCalories > 0 && (
                                                    <div className="mt-3 flex items-center gap-2">
                                                        <span className="material-symbols-outlined text-yellow-500 text-sm">local_fire_department</span>
                                                        <span className="text-xs font-semibold text-text-muted-light">
                                                            每日目标: {currentWeek.dailyCalories} kcal
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        )}

                        {/* 每日食谱时间线 */}
                        {currentWeek?.meals && currentWeek.meals.length > 0 && (
                            <div className="relative space-y-6">
                                <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-gray-200 dark:bg-gray-700 -z-10"></div>
                                {currentWeek.meals.map((meal, idx) => {
                                    const mealIcons = ['wb_sunny', 'restaurant', 'dark_mode', 'brunch_dining'];
                                    const mealColors = [
                                        'bg-secondary text-yellow-900',
                                        'bg-white dark:bg-surface-dark text-text-muted-light border border-gray-200 dark:border-gray-600',
                                        'bg-slate-700 text-white',
                                        'bg-primary/20 text-primary',
                                    ];
                                    return (
                                        <div
                                            key={idx}
                                            className="flex gap-4 group cursor-pointer"
                                            onClick={() => setSelectedMeal({ meal, weekNumber: currentWeek.week })}
                                        >
                                            <div className={`w-10 h-10 rounded-full ${mealColors[idx % 4]} flex items-center justify-center shadow-sm shrink-0 z-10 ring-4 ring-background-light dark:ring-background-dark`}>
                                                <span className="material-symbols-outlined text-lg">{mealIcons[idx % 4]}</span>
                                            </div>
                                            <div className="flex-1 bg-white dark:bg-surface-dark rounded-2xl p-4 shadow-soft border border-gray-100 dark:border-gray-800 hover:border-secondary/50 hover:shadow-medium transition-all duration-300">
                                                <div className="flex justify-between items-start mb-2">
                                                    <h4 className="font-bold text-base">
                                                        {meal.foodItems?.length > 0
                                                            ? meal.foodItems.map(f => f.name).join(' + ')
                                                            : `第 ${meal.order} 餐`}
                                                    </h4>
                                                    {meal.time && (
                                                        <span className="text-xs font-semibold bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-lg shrink-0 ml-2">{meal.time}</span>
                                                    )}
                                                </div>
                                                {/* 食材标签 */}
                                                {meal.foodItems && meal.foodItems.length > 0 && (
                                                    <div className="flex flex-wrap gap-2 mb-3">
                                                        {meal.foodItems.map((fi, i) => (
                                                            <span key={i} className={`text-xs px-2 py-1 ${tagColors[i % tagColors.length]} rounded-md`}>
                                                                {fi.name} {fi.weight}g
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                                {/* 烹饪方式 */}
                                                {meal.cookMethod && (
                                                    <div className="flex items-center gap-2 text-xs text-text-muted-light dark:text-text-muted-dark mb-2">
                                                        <span className="material-symbols-outlined text-sm text-primary">soup_kitchen</span>
                                                        <span>{meal.cookMethod}</span>
                                                    </div>
                                                )}
                                                {/* 单餐营养概要 */}
                                                {meal.totalCalories > 0 && (
                                                    <div className="flex items-center gap-3 text-[11px] text-text-muted-light dark:text-text-muted-dark bg-background-light dark:bg-background-dark px-3 py-2 rounded-xl">
                                                        <span>{meal.totalCalories} kcal</span>
                                                        <span className="text-primary">P {meal.totalProtein}g</span>
                                                        <span className="text-yellow-500">F {meal.totalFat}g</span>
                                                        <span className="text-blue-400">C {meal.totalCarbs}g</span>
                                                    </div>
                                                )}
                                                {/* 查看详情提示 */}
                                                <div className="flex items-center justify-end mt-2">
                                                    <span className="text-xs text-primary font-medium flex items-center gap-0.5">
                                                        查看详情 <span className="material-symbols-outlined text-sm">chevron_right</span>
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </section>
                )}

                {/* 每周建议 + 特别调整说明（可折叠） */}
                {currentWeek && (currentWeek.suggestions?.length > 0 || currentWeek.specialNote) && (
                    <section>
                        <div className="bg-primary/5 dark:bg-primary/10 rounded-3xl border border-primary/10 dark:border-primary/20 hover:shadow-soft transition-all duration-300 overflow-hidden">
                            <button
                                onClick={() => setIsSuggestionsExpanded(!isSuggestionsExpanded)}
                                className="w-full flex items-center justify-between p-5"
                            >
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary">verified</span>
                                    <h3 className="font-bold text-text-main-light dark:text-text-main-dark">第 {currentWeek.week} 周建议</h3>
                                </div>
                                <motion.span
                                    className="material-symbols-outlined text-text-muted-light dark:text-text-muted-dark text-lg"
                                    animate={{ rotate: isSuggestionsExpanded ? 180 : 0 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    expand_more
                                </motion.span>
                            </button>
                            <AnimatePresence initial={false}>
                                {isSuggestionsExpanded && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                                        className="overflow-hidden"
                                    >
                                        <div className="px-5 pb-5 pt-0">
                                            {currentWeek.suggestions?.length > 0 && (
                                                <ul className="space-y-2 text-sm text-text-muted-light dark:text-text-muted-dark list-disc list-inside mb-3">
                                                    {currentWeek.suggestions.map((s, i) => (
                                                        <li key={i}>{typeof s === 'string' ? s : JSON.stringify(s)}</li>
                                                    ))}
                                                </ul>
                                            )}
                                            {currentWeek.specialNote && (
                                                <div className="flex items-start gap-2 text-sm text-text-muted-light dark:text-text-muted-dark bg-white/50 dark:bg-white/5 p-3 rounded-xl">
                                                    <span className="material-symbols-outlined text-sm mt-0.5 text-yellow-500">warning</span>
                                                    <p>{currentWeek.specialNote}</p>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </section>
                )}

                {/* 保存食谱 + 重新生成 */}
                <section className="pb-6 space-y-3">
                    {/* 保存食谱按钮 — 仅当有 planId 时显示 */}
                    {effectivePlanId && currentPet?.id && (
                        <button
                            onClick={async () => {
                                if (isCurrentPlanActive || isSaved) return;
                                try {
                                    // 调用 confirm API 将 Redis 临时数据转正到 PostgreSQL
                                    const res = await plansApi.confirmPlan(effectivePlanId);
                                    const confirmedId = res.data?.plan_id || effectivePlanId;
                                    setActivePlan(currentPet.id, confirmedId);
                                    if (displayResult) {
                                        setActivePlanData(currentPet.id, displayResult);
                                    }
                                    setIsSaved(true);
                                    try {
                                        await Toast.show({ text: '食谱已保存并应用', duration: 'short' });
                                    } catch {
                                        // Capacitor Toast 在 web 环境可能不可用
                                    }
                                } catch (err) {
                                    console.error('Confirm plan failed, fallback to local:', err);
                                    // 降级：confirm 失败时仍本地应用（计划数据已在前端）
                                    setActivePlan(currentPet.id, effectivePlanId);
                                    if (displayResult) {
                                        setActivePlanData(currentPet.id, displayResult);
                                    }
                                    setIsSaved(true);
                                    try {
                                        await Toast.show({ text: '食谱已本地应用（云端保存失败）', duration: 'short' });
                                    } catch {
                                        // ignore
                                    }
                                }
                            }}
                            disabled={isCurrentPlanActive || isSaved}
                            className={`w-full py-3.5 rounded-2xl font-bold text-base transition-all flex items-center justify-center gap-2 ${
                                isCurrentPlanActive || isSaved
                                    ? 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 cursor-default'
                                    : 'bg-primary text-white dark:text-gray-900 shadow-glow hover:brightness-110 hover:-translate-y-0.5 active:scale-[0.98]'
                            }`}
                        >
                            <span className="material-symbols-outlined text-lg">
                                {isCurrentPlanActive || isSaved ? 'check_circle' : 'bookmark_add'}
                            </span>
                            {isCurrentPlanActive || isSaved ? '已保存为当前食谱' : '保存食谱'}
                        </button>
                    )}

                    {/* 重新生成按钮 — 仅在非路由查看模式时显示 */}
                    {!routePlanId && (
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
                    )}
                </section>
            </main>

            {/* 餐食详情弹窗 */}
            <AnimatePresence>
                {selectedMeal && (
                    <PlanDetails
                        meal={selectedMeal.meal}
                        weekNumber={selectedMeal.weekNumber}
                        onClose={() => setSelectedMeal(null)}
                    />
                )}
            </AnimatePresence>
        </motion.div>
    );
}
