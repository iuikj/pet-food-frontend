import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { pageTransitions } from '../utils/animations';
import PetSelectorMenu from '../components/PetSelectorMenu';
import MealCard from '../components/MealCard';
import PlanDetails from './PlanDetails';
import { usePets } from '../hooks/usePets';
import { useMeals } from '../hooks/useMeals';
import { weightsApi } from '../api';

// 辅助函数
const getMealTypeName = (type) => {
    const names = { breakfast: '早餐', lunch: '午餐', dinner: '晚餐', snack: '加餐' };
    return names[type] || type;
};

export default function HomePage() {
    const [isPetMenuOpen, setIsPetMenuOpen] = useState(false);
    const { pets, currentPet, setCurrentPet, activePlanData, isLoading: petsLoading } = usePets();
    const { meals, nutritionSummary, isLoading: mealsLoading, toggleMealComplete } = useMeals();

    // 餐食详情弹窗状态
    const [selectedMeal, setSelectedMeal] = useState(null);

    // 体重输入弹窗状态
    const [showWeightModal, setShowWeightModal] = useState(false);
    const [weightInput, setWeightInput] = useState('');
    const [weightSaving, setWeightSaving] = useState(false);
    const [latestWeight, setLatestWeight] = useState(null);

    // 获取最新体重
    const fetchLatestWeight = useCallback(async () => {
        if (!currentPet?.id) return;
        try {
            const res = await weightsApi.getLatestWeight(currentPet.id);
            if (res.code === 0 && res.data) {
                setLatestWeight(res.data);
            } else {
                setLatestWeight(null);
            }
        } catch {
            setLatestWeight(null);
        }
    }, [currentPet?.id]);

    useEffect(() => { fetchLatestWeight(); }, [fetchLatestWeight]);

    // 保存体重
    const handleSaveWeight = async () => {
        const value = parseFloat(weightInput);
        if (!value || value <= 0 || value > 500 || !currentPet?.id) return;
        setWeightSaving(true);
        try {
            const res = await weightsApi.recordWeight({ pet_id: currentPet.id, weight: value });
            if (res.code === 0) {
                setLatestWeight(res.data);
                setShowWeightModal(false);
                setWeightInput('');
            }
        } catch (err) {
            console.error('Failed to record weight:', err);
        } finally {
            setWeightSaving(false);
        }
    };

    // 计算距上次记录天数
    const getDaysAgo = () => {
        if (!latestWeight?.recorded_date) return null;
        const diff = Math.floor((Date.now() - new Date(latestWeight.recorded_date).getTime()) / 86400000);
        if (diff === 0) return '今天';
        return `${diff}天前`;
    };

    // 状态判断
    const hasPets = pets.length > 0;
    const hasRecipe = currentPet?.has_plan ?? false;

    const handlePetSelect = (pet) => {
        setCurrentPet(pet.id);
    };

    // 点击餐食卡片 → 弹出 PlanDetails 悬浮卡片
    const handleMealCardClick = (mealId) => {
        const meal = meals.find(m => m.id === mealId);
        if (!meal?._raw) return;
        setSelectedMeal({ meal: meal._raw });
    };

    // 渲染 Header
    const renderHeader = () => (
        <header className="px-6 pt-12 pb-4 flex justify-between items-center bg-background-light/90 dark:bg-background-dark/90 backdrop-blur-md sticky top-0 z-50">
            <div className="flex items-center gap-3">
                <div className="relative">
                    {hasPets && currentPet ? (
                        <button onClick={() => setIsPetMenuOpen(true)}>
                            {currentPet.avatar_url ? (
                                <img
                                    alt={currentPet.name}
                                    className="w-12 h-12 rounded-full object-cover border-2 border-white dark:border-surface-dark shadow-sm"
                                    src={currentPet.avatar_url}
                                />
                            ) : (
                                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-lg border-2 border-white dark:border-surface-dark shadow-sm">
                                    {currentPet.name.charAt(0)}
                                </div>
                            )}
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-surface-dark"></div>
                        </button>
                    ) : (
                        <button
                            onClick={() => setIsPetMenuOpen(true)}
                            className="w-12 h-12 rounded-full bg-gray-100 dark:bg-surface-dark border-2 border-dashed border-primary/50 flex items-center justify-center text-primary shadow-sm hover:bg-primary hover:text-white transition-all"
                        >
                            <span className="material-icons-round">add</span>
                        </button>
                    )}
                </div>
                <div>
                    <p className="text-xs text-text-muted-light dark:text-text-muted-dark font-medium uppercase tracking-wider">
                        {hasPets ? '计划用于' : '欢迎使用'}
                    </p>
                    <button
                        onClick={() => setIsPetMenuOpen(true)}
                        className="text-xl font-bold flex items-center gap-1 hover:text-primary transition-colors"
                    >
                        {currentPet ? currentPet.name : '选择宠物'}
                        {hasPets && <span className="material-icons-round text-primary text-sm">pets</span>}
                        {!hasPets && <span className="material-icons-round text-primary text-sm">arrow_forward_ios</span>}
                    </button>
                </div>
            </div>
            <div className="flex gap-3">
                <button className="w-10 h-10 rounded-full bg-white dark:bg-surface-dark shadow-sm flex items-center justify-center text-text-muted-light dark:text-text-muted-dark hover:text-primary transition-colors">
                    <span className="material-icons-round">search</span>
                </button>
                <button className="w-10 h-10 rounded-full bg-white dark:bg-surface-dark shadow-sm flex items-center justify-center text-text-muted-light dark:text-text-muted-dark hover:text-primary transition-colors relative">
                    <span className="material-icons-round">notifications_none</span>
                    <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-400 rounded-full"></span>
                </button>
            </div>
        </header>
    );

    // 日历展开状态
    const [isCalendarExpanded, setIsCalendarExpanded] = useState(false);

    // 获取四周的日期数据
    const getWeeksData = () => {
        const today = new Date();
        const currentDay = today.getDay();
        const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
        const thisMonday = new Date(today);
        thisMonday.setDate(today.getDate() + mondayOffset);

        const weeks = [];
        const weekColors = [
            { bg: 'bg-primary/20', border: 'border-primary/30', text: 'text-primary', label: '第一周' },
            { bg: 'bg-secondary/20', border: 'border-secondary/30', text: 'text-yellow-700 dark:text-yellow-300', label: '第二周' },
            { bg: 'bg-accent-blue/20', border: 'border-accent-blue/30', text: 'text-blue-700 dark:text-blue-300', label: '第三周' },
            { bg: 'bg-purple-100 dark:bg-purple-900/20', border: 'border-purple-300', text: 'text-purple-700 dark:text-purple-300', label: '第四周' }
        ];

        for (let w = 0; w < 4; w++) {
            const weekStart = new Date(thisMonday);
            weekStart.setDate(thisMonday.getDate() + w * 7);

            const days = [];
            for (let d = 0; d < 7; d++) {
                const date = new Date(weekStart);
                date.setDate(weekStart.getDate() + d);
                days.push({
                    date: date.getDate(),
                    month: date.getMonth() + 1,
                    isToday: date.toDateString() === today.toDateString(),
                    fullDate: date
                });
            }
            weeks.push({
                ...weekColors[w],
                days,
                startDate: `${weekStart.getMonth() + 1}/${weekStart.getDate()}`,
                endDate: `${days[6].month}/${days[6].date}`
            });
        }
        return weeks;
    };

    const weeksData = getWeeksData();
    const weekDayLabels = ['一', '二', '三', '四', '五', '六', '日'];

    // 渲染周历
    const renderWeekCalendar = () => (
        <section>
            <div className="flex justify-between items-end mb-4">
                <div>
                    <h2 className="text-2xl font-bold">本周</h2>
                    <p className="text-sm text-text-muted-light dark:text-text-muted-dark">
                        AI计划： <span className="text-primary font-semibold">{hasRecipe ? '体重管理' : '待创建'}</span>
                    </p>
                </div>
                <button
                    onClick={() => setIsCalendarExpanded(!isCalendarExpanded)}
                    className="text-sm text-primary font-medium hover:opacity-80 transition-opacity flex items-center gap-1"
                >
                    日历
                    <motion.span
                        className="material-icons-round text-sm"
                        animate={{ rotate: isCalendarExpanded ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        expand_more
                    </motion.span>
                </button>
            </div>

            {!isCalendarExpanded && (
                <div className="flex justify-between items-center bg-white dark:bg-surface-dark p-4 rounded-2xl shadow-soft">
                    {weeksData[0].days.slice(0, 5).map((day, idx) => (
                        <div key={idx} className={`flex flex-col items-center gap-1 ${!day.isToday && idx < 2 ? 'opacity-40' : ''} ${day.isToday ? 'transform scale-110' : ''}`}>
                            <span className={`text-xs font-${day.isToday ? 'bold text-primary' : 'medium text-text-muted-light dark:text-text-muted-dark'}`}>
                                {weekDayLabels[idx]}
                            </span>
                            <div className={`${day.isToday
                                ? 'w-10 h-10 rounded-full bg-primary text-white dark:text-gray-900 flex items-center justify-center text-base font-bold shadow-glow relative'
                                : 'w-8 h-8 rounded-full bg-background-light dark:bg-background-dark flex items-center justify-center text-sm font-medium'}`}
                            >
                                {day.date}
                                {day.isToday && <div className="absolute -bottom-1.5 w-1 h-1 bg-current rounded-full"></div>}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <motion.div
                initial={false}
                animate={{
                    height: isCalendarExpanded ? 'auto' : 0,
                    opacity: isCalendarExpanded ? 1 : 0
                }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="overflow-hidden"
            >
                <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-soft p-4 space-y-3">
                    <div className="grid grid-cols-8 gap-1 mb-2">
                        <div className="text-xs font-medium text-text-muted-light dark:text-text-muted-dark text-center"></div>
                        {weekDayLabels.map((label, idx) => (
                            <div key={idx} className="text-xs font-medium text-text-muted-light dark:text-text-muted-dark text-center">
                                {label}
                            </div>
                        ))}
                    </div>

                    {weeksData.map((week, weekIdx) => (
                        <div
                            key={weekIdx}
                            className={`grid grid-cols-8 gap-1 p-2 rounded-xl ${week.bg} ${week.border} border transition-all duration-200 hover:shadow-soft`}
                        >
                            <div className={`flex flex-col justify-center items-center text-center ${week.text}`}>
                                <span className="text-[10px] font-bold leading-tight">{week.label}</span>
                                <span className="text-[8px] opacity-70">{week.startDate}</span>
                            </div>
                            {week.days.map((day, dayIdx) => (
                                <div
                                    key={dayIdx}
                                    className={`aspect-square rounded-lg flex items-center justify-center text-sm font-medium transition-all duration-200
                                        ${day.isToday
                                            ? 'bg-primary text-white dark:text-gray-900 shadow-glow font-bold'
                                            : 'hover:bg-white/50 dark:hover:bg-white/10'}`}
                                >
                                    {day.date}
                                </div>
                            ))}
                        </div>
                    ))}

                    <div className="flex flex-wrap gap-3 pt-2 border-t border-gray-100 dark:border-gray-800">
                        {weeksData.map((week, idx) => (
                            <div key={idx} className="flex items-center gap-1.5">
                                <div className={`w-3 h-3 rounded ${week.bg} ${week.border} border`}></div>
                                <span className={`text-xs font-medium ${week.text}`}>{week.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </motion.div>
        </section>
    );

    // 渲染：无宠物引导卡片
    const renderNoPetCard = () => (
        <section className="bg-primary/20 dark:bg-primary/10 rounded-3xl p-6 relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-secondary/30 rounded-full blur-2xl"></div>
            <div className="relative z-10 flex flex-col items-center text-center py-4">
                <div className="w-16 h-16 rounded-full bg-white/60 dark:bg-white/10 backdrop-blur-sm flex items-center justify-center mb-4 shadow-sm text-primary">
                    <span className="material-icons-round text-3xl">pets</span>
                </div>
                <h3 className="font-bold text-xl mb-2">创建您的第一个宠物档案</h3>
                <p className="text-sm text-text-muted-light dark:text-text-muted-dark opacity-80 mb-6 max-w-[240px]">
                    添加您的爱宠信息，为它量身定制专属的科学营养计划。
                </p>
                <Link to="/onboarding/step1" className="bg-primary text-white dark:text-gray-900 font-bold py-3 px-8 rounded-xl shadow-glow hover:shadow-glow-lg hover:brightness-110 hover:-translate-y-0.5 active:scale-[0.97] transition-all duration-200 flex items-center gap-2">
                    <span className="material-icons-round text-lg">add</span>
                    立即添加
                </Link>
            </div>
        </section>
    );

    // 渲染：无食谱引导卡片
    const renderNoRecipeCard = () => (
        <section>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                今日餐食
            </h3>
            <div className="bg-gradient-to-br from-primary/10 via-white to-secondary/10 dark:from-primary/20 dark:via-surface-dark dark:to-secondary/20 p-6 rounded-2xl shadow-soft border border-primary/20 dark:border-primary/30 flex flex-col items-center text-center gap-3 py-10 hover:shadow-medium hover:scale-[1.01] transition-all duration-300 relative overflow-hidden active:scale-[0.99]">
                <div className="absolute -top-8 -right-8 w-24 h-24 bg-primary/20 rounded-full blur-2xl" />
                <div className="absolute -bottom-8 -left-8 w-20 h-20 bg-secondary/30 rounded-full blur-xl" />
                <div className="relative">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-green-400 flex items-center justify-center text-white shadow-glow rotate-3">
                        <span className="material-icons-round text-3xl">restaurant</span>
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-yellow-800 shadow-sm">
                        <span className="material-icons-round text-sm">auto_awesome</span>
                    </div>
                </div>
                <h4 className="font-bold text-xl mt-2">开始智能饮食规划</h4>
                <p className="text-sm text-text-muted-light dark:text-text-muted-dark px-4 mb-2 max-w-[260px]">
                    让 AI 助手为您的爱宠定制科学营养的每日食谱
                </p>
                <Link to="/plan/create" className="bg-primary text-white dark:text-gray-900 font-bold py-3 px-6 rounded-xl shadow-glow hover:shadow-glow-lg hover:brightness-110 hover:-translate-y-0.5 active:scale-[0.97] transition-all duration-200 flex items-center gap-2 mt-1">
                    <span className="material-icons-round text-lg">auto_awesome</span>
                    开启规划
                </Link>
            </div>
        </section>
    );

    // 渲染：锁定功能卡片（未有食谱时）
    const renderLockedCards = () => (
        <section className="grid grid-cols-2 gap-4">
            <Link
                to={hasPets ? "/plan/create" : "/onboarding/step1"}
                className="bg-accent-blue/20 dark:bg-accent-blue/10 p-5 rounded-2xl flex flex-col justify-center items-center h-36 relative overflow-hidden text-center hover:shadow-soft hover:bg-accent-blue/30 active:scale-[0.98] transition-all duration-300 group"
            >
                <span className="material-icons-round text-4xl text-accent-blue/70 mb-2 group-hover:scale-110 transition-transform">water_drop</span>
                <h4 className="font-bold text-blue-900/80 dark:text-blue-100/80 mb-1">饮水量</h4>
                <p className="text-xs text-blue-800/60 dark:text-blue-200/60 font-medium px-2">点击开始记录</p>
            </Link>
            <button
                onClick={() => {
                    if (!hasPets) return;
                    setWeightInput(latestWeight ? String(latestWeight.weight) : String(currentPet?.weight || ''));
                    setShowWeightModal(true);
                }}
                className="bg-secondary/20 dark:bg-secondary/10 p-5 rounded-2xl flex flex-col justify-center items-center h-36 relative overflow-hidden text-center hover:shadow-soft hover:bg-secondary/30 active:scale-[0.98] transition-all duration-300 group"
            >
                <span className="material-icons-round text-4xl text-secondary/70 mb-2 group-hover:scale-110 transition-transform">monitor_weight</span>
                <h4 className="font-bold text-yellow-900/80 dark:text-yellow-100/80 mb-1">当前体重</h4>
                <p className="text-xs text-yellow-800/60 dark:text-yellow-200/60 font-medium px-2">
                    {latestWeight ? `${latestWeight.weight} kg` : '点击开始记录'}
                </p>
            </button>
        </section>
    );

    // 渲染：每日营养进度（真实数据）
    const renderNutritionProgress = () => {
        if (!nutritionSummary) return null;

        const { total_calories, consumed_calories, protein, fat, carbs } = nutritionSummary;
        const remainingCalories = Math.max(0, (total_calories || 0) - (consumed_calories || 0));
        const caloriePercent = total_calories > 0
            ? Math.min(100, Math.round((consumed_calories / total_calories) * 100))
            : 0;
        // SVG 圆形进度: circumference = 2 * PI * r = 2 * 3.14159 * 40 ≈ 251.2
        const circumference = 251.2;
        const strokeDashoffset = circumference * (1 - caloriePercent / 100);

        const proteinTarget = protein?.target || 0;
        const proteinConsumed = protein?.consumed || 0;
        const proteinPercent = proteinTarget > 0 ? Math.min(100, Math.round((proteinConsumed / proteinTarget) * 100)) : 0;

        const fatTarget = fat?.target || 0;
        const fatConsumed = fat?.consumed || 0;
        const fatPercent = fatTarget > 0 ? Math.min(100, Math.round((fatConsumed / fatTarget) * 100)) : 0;

        const carbsTarget = carbs?.target || 0;
        const carbsConsumed = carbs?.consumed || 0;
        const carbsPercent = carbsTarget > 0 ? Math.min(100, Math.round((carbsConsumed / carbsTarget) * 100)) : 0;

        return (
            <section className="bg-primary/20 dark:bg-primary/10 rounded-3xl p-6 relative overflow-hidden shadow-soft hover:shadow-medium transition-all duration-300">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-secondary/30 rounded-full blur-2xl"></div>
                <div className="relative z-10">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h3 className="font-bold text-lg">每日营养</h3>
                            <p className="text-sm opacity-70">
                                {caloriePercent > 0 ? `已完成每日目标的${caloriePercent}%` : '今日尚未开始打卡'}
                            </p>
                        </div>
                        <div className="bg-white/50 dark:bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                            AI优化中
                        </div>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="relative w-32 h-32 flex-shrink-0">
                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                                <circle className="text-white/40 dark:text-white/10" cx="50" cy="50" fill="transparent" r="40" stroke="currentColor" strokeWidth="8"></circle>
                                <circle
                                    cx="50" cy="50" fill="transparent" r="40"
                                    stroke="#A3D9A5"
                                    strokeDasharray={circumference}
                                    strokeDashoffset={strokeDashoffset}
                                    strokeLinecap="round"
                                    strokeWidth="8"
                                    style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                                ></circle>
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                                <span className="text-3xl font-bold leading-none">{Math.round(remainingCalories)}</span>
                                <span className="text-[10px] uppercase font-medium tracking-wide opacity-70">剩余卡路里</span>
                            </div>
                        </div>
                        <div className="flex-1 space-y-4">
                            <div>
                                <div className="flex justify-between text-xs mb-1 font-medium">
                                    <span>蛋白质</span>
                                    <span>{Math.round(proteinConsumed)}g / {Math.round(proteinTarget)}g</span>
                                </div>
                                <div className="h-2 w-full bg-white/40 dark:bg-white/10 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-green-600 rounded-full"
                                        style={{ width: `${proteinPercent}%`, transition: 'width 0.5s ease' }}
                                    ></div>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-xs mb-1 font-medium">
                                    <span>脂肪</span>
                                    <span>{Math.round(fatConsumed)}g / {Math.round(fatTarget)}g</span>
                                </div>
                                <div className="h-2 w-full bg-white/40 dark:bg-white/10 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-yellow-500 rounded-full"
                                        style={{ width: `${fatPercent}%`, transition: 'width 0.5s ease' }}
                                    ></div>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-xs mb-1 font-medium">
                                    <span>碳水化合物</span>
                                    <span>{Math.round(carbsConsumed)}g / {Math.round(carbsTarget)}g</span>
                                </div>
                                <div className="h-2 w-full bg-white/40 dark:bg-white/10 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-blue-400 rounded-full"
                                        style={{ width: `${carbsPercent}%`, transition: 'width 0.5s ease' }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        );
    };

    // 计算已完成餐食数量
    const completedMealsCount = meals.filter(m => m.isCompleted).length;

    // 渲染：今日餐食列表
    const renderMealsList = () => (
        <section>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                今日餐食
                <span className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded text-text-muted-light dark:text-text-muted-dark font-normal">
                    已完成 {completedMealsCount}/{meals.length} 餐
                </span>
            </h3>
            {mealsLoading ? (
                <div className="flex justify-center py-8">
                    <span className="material-icons-round text-3xl text-primary animate-spin">refresh</span>
                </div>
            ) : meals.length === 0 ? (
                <div className="text-center py-8 text-text-muted-light dark:text-text-muted-dark">
                    <span className="material-icons-round text-4xl mb-2 block opacity-40">restaurant</span>
                    <p className="text-sm">今日暂无餐食记录</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {meals.map(meal => (
                        <MealCard
                            key={meal.id}
                            meal={meal}
                            isExpanded={false}
                            onToggleExpand={handleMealCardClick}
                            onToggleComplete={toggleMealComplete}
                        />
                    ))}
                </div>
            )}
        </section>
    );

    // 渲染：已解锁功能卡片
    const renderUnlockedCards = () => (
        <section className="grid grid-cols-2 gap-4">
            <div className="bg-accent-blue/30 dark:bg-accent-blue/10 p-5 rounded-2xl flex flex-col justify-between h-36 relative overflow-hidden hover:shadow-medium hover:scale-105 transition-all duration-300">
                <span className="material-icons-round absolute -right-2 -bottom-4 text-6xl text-accent-blue opacity-50">water_drop</span>
                <div>
                    <h4 className="font-bold text-blue-900 dark:text-blue-100">饮水量</h4>
                    <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">目标：800毫升</p>
                </div>
                <div className="flex items-end gap-1 mt-auto">
                    <span className="text-2xl font-bold text-blue-900 dark:text-blue-100">550</span>
                    <span className="text-sm font-medium mb-1 text-blue-700 dark:text-blue-300">毫升</span>
                </div>
            </div>
            <button
                onClick={() => { setWeightInput(latestWeight ? String(latestWeight.weight) : String(currentPet?.weight || '')); setShowWeightModal(true); }}
                className="bg-secondary/30 dark:bg-secondary/10 p-5 rounded-2xl flex flex-col justify-between h-36 relative overflow-hidden hover:shadow-medium hover:scale-105 transition-all duration-300 text-left"
            >
                <span className="material-icons-round absolute -right-2 -bottom-4 text-6xl text-secondary opacity-50">monitor_weight</span>
                <div>
                    <h4 className="font-bold text-yellow-900 dark:text-yellow-100">当前体重</h4>
                    <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                        {getDaysAgo() ? `上次：${getDaysAgo()}` : '点击记录'}
                    </p>
                </div>
                <div className="flex items-end gap-1 mt-auto">
                    <span className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
                        {latestWeight ? latestWeight.weight : (currentPet?.weight || '--')}
                    </span>
                    <span className="text-sm font-medium mb-1 text-yellow-700 dark:text-yellow-300">公斤</span>
                </div>
            </button>
        </section>
    );

    return (
        <motion.div
            {...pageTransitions}
            className="pb-24 overflow-x-hidden"
        >
            {renderHeader()}

            <main className="px-6 space-y-8">
                {renderWeekCalendar()}

                {!hasPets ? (
                    <>
                        {renderNoPetCard()}
                        {renderNoRecipeCard()}
                        {renderLockedCards()}
                    </>
                ) : !hasRecipe ? (
                    <>
                        {renderNoRecipeCard()}
                        {renderLockedCards()}
                    </>
                ) : (
                    <>
                        {renderNutritionProgress()}
                        {renderMealsList()}
                        {renderUnlockedCards()}
                    </>
                )}
            </main>

            <PetSelectorMenu
                isOpen={isPetMenuOpen}
                onClose={() => setIsPetMenuOpen(false)}
                onSelectPet={handlePetSelect}
            />

            <AnimatePresence>
                {selectedMeal && (
                    <PlanDetails
                        meal={selectedMeal.meal}
                        weekNumber={selectedMeal.weekNumber}
                        onClose={() => setSelectedMeal(null)}
                    />
                )}
            </AnimatePresence>

            {/* 体重输入弹窗 */}
            <AnimatePresence>
                {showWeightModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-8"
                        onClick={() => setShowWeightModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white dark:bg-surface-dark rounded-3xl p-6 w-full max-w-sm shadow-xl"
                        >
                            <div className="flex flex-col items-center text-center">
                                <div className="w-14 h-14 rounded-full bg-secondary/20 flex items-center justify-center mb-4">
                                    <span className="material-icons-round text-yellow-600 text-2xl">monitor_weight</span>
                                </div>
                                <h3 className="font-bold text-lg mb-2">记录体重</h3>
                                <p className="text-sm text-text-muted-light dark:text-text-muted-dark mb-4">
                                    为 {currentPet?.name || '宠物'} 记录今日体重
                                </p>
                                <div className="flex items-center gap-2 mb-6 w-full max-w-[200px]">
                                    <input
                                        type="number"
                                        step="0.1"
                                        min="0.1"
                                        max="500"
                                        value={weightInput}
                                        onChange={(e) => setWeightInput(e.target.value)}
                                        placeholder="0.0"
                                        className="w-full text-center text-3xl font-bold bg-gray-50 dark:bg-gray-800 rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-primary"
                                        autoFocus
                                    />
                                    <span className="text-lg font-medium text-text-muted-light dark:text-text-muted-dark shrink-0">kg</span>
                                </div>
                                <div className="flex gap-3 w-full">
                                    <button
                                        onClick={() => setShowWeightModal(false)}
                                        className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-gray-700 text-text-main-light dark:text-text-main-dark font-medium hover:bg-gray-200 transition-colors"
                                    >
                                        取消
                                    </button>
                                    <button
                                        onClick={handleSaveWeight}
                                        disabled={weightSaving || !weightInput || parseFloat(weightInput) <= 0}
                                        className="flex-1 py-3 rounded-xl bg-primary text-white dark:text-gray-900 font-bold hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {weightSaving ? '保存中...' : '保存'}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
