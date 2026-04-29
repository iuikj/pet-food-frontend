import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import SecureImage from '../components/SecureImage';
import ErrorAlert from '../components/ErrorAlert';
import { pageTransitions } from '../utils/animations';
import { usePets } from '../hooks/usePets';
import { useMeals } from '../hooks/useMeals';
import MealCard from '../components/MealCard';
import PlanDetails from './PlanDetails';
import Skeleton from '../components/ui/Skeleton';
import { compareWeightRecordsAsc } from '../utils/weightRecords';
import { weightsApi, mealsApi } from '../api';
import { getApiErrorMessage } from '../api/client';

export default function DashboardDaily() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const targetDate = searchParams.get('date'); // YYYY-MM-DD or null
    const { currentPet } = usePets();
    const { meals: todayMeals, nutritionSummary: todayNutrition, isLoading: todayLoading, error: todayError, toggleMealComplete } = useMeals();

    // 指定日期的餐食数据
    const [dateMeals, setDateMeals] = useState([]);
    const [dateMealsLoading, setDateMealsLoading] = useState(false);

    // 实际使用的数据（根据是否有 date 参数决定）
    const meals = targetDate ? dateMeals : todayMeals;
    const mealsLoading = targetDate ? dateMealsLoading : todayLoading;
    const nutritionSummary = targetDate ? null : todayNutrition;

    // 获取指定日期餐食
    useEffect(() => {
        if (!targetDate || !currentPet?.id) return;
        let cancelled = false;
        setDateMealsLoading(true);
        mealsApi.getMealsByDate(currentPet.id, targetDate)
            .then(res => {
                if (cancelled) return;
                if (res.code === 0 && res.data?.meals) {
                    // 映射为与 useMeals 一致的格式
                    setDateMeals(res.data.meals.map(m => ({
                        id: m.id,
                        type: m.meal_type,
                        name: m.name || m.meal_type,
                        time: m.scheduled_time || '',
                        calories: m.calories || 0,
                        isCompleted: m.is_completed || false,
                        _raw: m,
                    })));
                } else {
                    setDateMeals([]);
                }
            })
            .catch(() => { if (!cancelled) setDateMeals([]); })
            .finally(() => { if (!cancelled) setDateMealsLoading(false); });
        return () => { cancelled = true; };
    }, [targetDate, currentPet?.id]);

    const [selectedMeal, setSelectedMeal] = useState(null);

    // 体重相关
    const [showWeightModal, setShowWeightModal] = useState(false);
    const [weightInput, setWeightInput] = useState('');
    const [weightSaving, setWeightSaving] = useState(false);
    const [weightError, setWeightError] = useState('');
    const [weightHistory, setWeightHistory] = useState([]);
    const [latestWeight, setLatestWeight] = useState(null);

    const fetchWeightData = useCallback(async () => {
        if (!currentPet?.id) return;
        try {
            const [histRes, latestRes] = await Promise.all([
                weightsApi.getWeightHistory(currentPet.id, 30),
                weightsApi.getLatestWeight(currentPet.id),
            ]);
            if (histRes.code === 0) setWeightHistory(histRes.data || []);
            if (latestRes.code === 0) setLatestWeight(latestRes.data);
        } catch {
            // silent
        }
    }, [currentPet?.id]);

    useEffect(() => { fetchWeightData(); }, [fetchWeightData]);

    const handleSaveWeight = async () => {
        const value = parseFloat(weightInput);
        if (!value || value <= 0 || !currentPet?.id) {
            setWeightError('请输入有效体重');
            return;
        }
        setWeightError('');
        setWeightSaving(true);
        try {
            const res = await weightsApi.recordWeight({ pet_id: currentPet.id, weight: value });
            if (res.code === 0) {
                setLatestWeight(res.data);
                setShowWeightModal(false);
                setWeightInput('');
                setWeightError('');
                await fetchWeightData(); // 刷新趋势图
            } else {
                setWeightError(res.message || '保存失败');
            }
        } catch (err) {
            console.error('Failed to record weight:', err);
            setWeightError(getApiErrorMessage(err, '保存失败'));
        } finally {
            setWeightSaving(false);
        }
    };

    const getDaysAgo = () => {
        if (!latestWeight?.recorded_date) return null;
        const diff = Math.floor((Date.now() - new Date(latestWeight.recorded_date).getTime()) / 86400000);
        if (diff === 0) return '今天';
        return `${diff}天前`;
    };

    const handleMealCardClick = (mealId) => {
        const meal = meals.find(m => m.id === mealId);
        if (!meal?._raw) return;
        setSelectedMeal({ meal: meal._raw });
    };

    // 营养进度计算
    const renderNutritionProgress = () => {
        if (!nutritionSummary) return null;
        const { total_calories, consumed_calories, protein, fat, carbs } = nutritionSummary;
        const remainingCalories = Math.max(0, (total_calories || 0) - (consumed_calories || 0));
        const caloriePercent = total_calories > 0 ? Math.min(100, Math.round((consumed_calories / total_calories) * 100)) : 0;
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
                                <circle cx="50" cy="50" fill="transparent" r="40" stroke="#A3D9A5" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" strokeWidth="8" style={{ transition: 'stroke-dashoffset 0.5s ease' }}></circle>
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                                <span className="text-3xl font-bold leading-none">{Math.round(remainingCalories)}</span>
                                <span className="text-xs uppercase font-medium tracking-wide opacity-70">剩余卡路里</span>
                            </div>
                        </div>
                        <div className="flex-1 space-y-4">
                            {[
                                { label: '蛋白质', consumed: proteinConsumed, target: proteinTarget, percent: proteinPercent, color: 'bg-green-600' },
                                { label: '脂肪', consumed: fatConsumed, target: fatTarget, percent: fatPercent, color: 'bg-yellow-500' },
                                { label: '碳水化合物', consumed: carbsConsumed, target: carbsTarget, percent: carbsPercent, color: 'bg-blue-400' },
                            ].map(n => (
                                <div key={n.label}>
                                    <div className="flex justify-between text-xs mb-1 font-medium">
                                        <span>{n.label}</span>
                                        <span>{Math.round(n.consumed)}g / {Math.round(n.target)}g</span>
                                    </div>
                                    <div className="h-2 w-full bg-white/40 dark:bg-white/10 rounded-full overflow-hidden">
                                        <div className={`h-full ${n.color} rounded-full`} style={{ width: `${n.percent}%`, transition: 'width 0.5s ease' }}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>
        );
    };

    // 体重趋势迷你图（SVG polyline）
    const renderWeightTrend = () => {
        // 按日期升序
        const sorted = [...weightHistory].sort(compareWeightRecordsAsc);
        if (sorted.length < 2) return null;

        const weights = sorted.map(r => r.weight);
        const minW = Math.min(...weights);
        const maxW = Math.max(...weights);
        const range = maxW - minW || 1;

        const svgW = 120;
        const svgH = 40;
        const padding = 4;

        const points = sorted.map((r, i) => {
            const x = padding + (i / (sorted.length - 1)) * (svgW - 2 * padding);
            const y = svgH - padding - ((r.weight - minW) / range) * (svgH - 2 * padding);
            return `${x},${y}`;
        }).join(' ');

        return (
            <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-10 mt-1">
                <polyline
                    fill="none"
                    stroke="#EAB308"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={points}
                />
                {/* 最后一个点高亮 */}
                {sorted.length > 0 && (() => {
                    const lastIdx = sorted.length - 1;
                    const lx = padding + (lastIdx / (sorted.length - 1)) * (svgW - 2 * padding);
                    const ly = svgH - padding - ((sorted[lastIdx].weight - minW) / range) * (svgH - 2 * padding);
                    return <circle cx={lx} cy={ly} r="3" fill="#EAB308" />;
                })()}
            </svg>
        );
    };

    // 已完成餐食数
    const completedMealsCount = meals.filter(m => m.isCompleted).length;

    // 判断目标日期是否在未来（不含今天）
    const isDateInFuture = (() => {
        if (!targetDate) return false;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const target = new Date(targetDate);
        target.setHours(0, 0, 0, 0);
        return target > today;
    })();

    const handleToggleMealComplete = useCallback(async (mealId) => {
        if (!targetDate) {
            await toggleMealComplete(mealId);
            return;
        }

        if (isDateInFuture || !currentPet?.id) {
            return;
        }

        const prevMeals = dateMeals;
        const targetMeal = dateMeals.find(m => m.id === mealId);
        if (!targetMeal) return;

        setDateMeals(prev => prev.map(m => (
            m.id === mealId ? { ...m, isCompleted: !m.isCompleted } : m
        )));

        try {
            if (targetMeal.isCompleted) {
                await mealsApi.uncompleteMeal(mealId);
            } else {
                await mealsApi.completeMeal(mealId);
            }

            const res = await mealsApi.getMealsByDate(currentPet.id, targetDate);
            if (res.code === 0 && res.data?.meals) {
                setDateMeals(res.data.meals.map(m => ({
                    id: m.id,
                    type: m.meal_type,
                    name: m.name || m.meal_type,
                    time: m.scheduled_time || '',
                    calories: m.calories || 0,
                    isCompleted: m.is_completed || false,
                    _raw: m,
                })));
            }
        } catch (error) {
            console.error('Failed to toggle dated meal completion:', error);
            setDateMeals(prevMeals);
        }
    }, [targetDate, toggleMealComplete, isDateInFuture, currentPet?.id, dateMeals]);

    // 本周日历
    const getThisWeekDays = () => {
        const today = new Date();
        const currentDay = today.getDay();
        const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
        const monday = new Date(today);
        monday.setDate(today.getDate() + mondayOffset);
        const weekDayLabels = ['一', '二', '三', '四', '五'];
        return Array.from({ length: 5 }, (_, i) => {
            const d = new Date(monday);
            d.setDate(monday.getDate() + i);
            return {
                label: weekDayLabels[i],
                date: d.getDate(),
                isToday: d.toDateString() === today.toDateString(),
                isPast: d < today && d.toDateString() !== today.toDateString(),
            };
        });
    };

    const weekDays = getThisWeekDays();

    return (
        <motion.div {...pageTransitions} className="pb-24 overflow-x-hidden">
            {/* Header */}
            <header className="px-6 pt-12 pb-4 flex justify-between items-center bg-background-light/90 dark:bg-background-dark/90 backdrop-blur-md sticky top-0 z-50">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        {currentPet?.avatar_url ? (
                            <SecureImage alt={currentPet.name} className="w-12 h-12 rounded-full object-cover border-2 border-white dark:border-surface-dark shadow-sm" src={currentPet.avatar_url} />
                        ) : (
                            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-lg border-2 border-white dark:border-surface-dark shadow-sm">
                                {currentPet?.name?.charAt(0) || '?'}
                            </div>
                        )}
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-surface-dark"></div>
                    </div>
                    <div>
                        <p className="text-xs text-text-muted-light dark:text-text-muted-dark font-medium uppercase tracking-wider">计划用于</p>
                        <h1 className="text-xl font-bold flex items-center gap-1">
                            {currentPet?.name || '宠物'}
                            <span className="material-icons-round text-primary text-sm">pets</span>
                        </h1>
                    </div>
                </div>
                <div className="flex gap-3">

            {/* 错误提示 */}
            {todayError && !targetDate && (
                <div className="px-6 mb-4">
                    <ErrorAlert error={todayError} />
                </div>
            )}
                    <button onClick={() => navigate(targetDate ? '/calendar' : '/')} className="w-10 h-10 rounded-full bg-white dark:bg-surface-dark shadow-sm flex items-center justify-center text-text-muted-light dark:text-text-muted-dark hover:text-primary transition-colors">
                        <span className="material-icons-round">arrow_back</span>
                    </button>
                </div>
            </header>

            <main className="px-6 space-y-8">
                {/* 本周日历 / 日期标题 */}
                <section>
                    <div className="flex justify-between items-end mb-4">
                        <div>
                            <h2 className="text-2xl font-bold">
                                {targetDate
                                    ? new Date(targetDate).toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'short' })
                                    : '本周'}
                            </h2>
                            <p className="text-sm text-text-muted-light dark:text-text-muted-dark">
                                AI计划： <span className="text-primary font-semibold">体重管理</span>
                            </p>
                        </div>
                        <button onClick={() => navigate('/calendar')} className="text-sm text-primary font-medium hover:opacity-80 transition-opacity">
                            完整日历
                        </button>
                    </div>
                    {!targetDate && (
                    <div className="flex justify-between items-center bg-white dark:bg-surface-dark p-4 rounded-2xl shadow-soft">
                        {weekDays.map((day, idx) => (
                            <div key={idx} className={`flex flex-col items-center gap-1 ${day.isPast ? 'opacity-40' : ''} ${day.isToday ? 'transform scale-110' : ''}`}>
                                <span className={`text-xs ${day.isToday ? 'font-bold text-primary' : 'font-medium text-text-muted-light dark:text-text-muted-dark'}`}>
                                    {day.label}
                                </span>
                                <div className={day.isToday
                                    ? 'w-10 h-10 rounded-full bg-primary text-white dark:text-gray-900 flex items-center justify-center text-base font-bold shadow-glow relative'
                                    : 'w-8 h-8 rounded-full bg-background-light dark:bg-background-dark flex items-center justify-center text-sm font-medium'}
                                >
                                    {day.date}
                                    {day.isToday && <div className="absolute -bottom-1.5 w-1 h-1 bg-current rounded-full"></div>}
                                </div>
                            </div>
                        ))}
                    </div>
                    )}
                </section>

                {/* 营养进度 */}
                {renderNutritionProgress()}

                {/* 今日餐食 */}
                <section>
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        今日餐食
                        <span className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded text-text-muted-light dark:text-text-muted-dark font-normal">
                            已完成 {completedMealsCount}/{meals.length} 餐
                        </span>
                        {isDateInFuture && (
                            <span className="text-xs bg-primary/15 text-primary px-2 py-0.5 rounded font-medium">
                                仅查看
                            </span>
                        )}
                    </h3>
                    {mealsLoading ? (
                        <div className="space-y-4">
                            {Array.from({ length: 3 }, (_, i) => (
                                <div key={i} className="flex items-center gap-4 bg-white dark:bg-surface-dark p-4 rounded-2xl shadow-soft">
                                    <Skeleton.Circle size={44} />
                                    <div className="flex-1 space-y-2">
                                        <Skeleton className="h-4 w-24" />
                                        <Skeleton className="h-3 w-40" />
                                    </div>
                                    <Skeleton className="h-8 w-16 rounded-xl" />
                                </div>
                            ))}
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
                                    onToggleComplete={handleToggleMealComplete}
                                    readOnly={isDateInFuture}
                                />
                            ))}
                        </div>
                    )}
                </section>

                {/* 功能卡片 */}
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
                        onClick={() => {
                            setWeightInput(latestWeight ? String(latestWeight.weight) : String(currentPet?.weight || ''));
                            setWeightError('');
                            setShowWeightModal(true);
                        }}
                        className="bg-secondary/30 dark:bg-secondary/10 p-5 rounded-2xl flex flex-col justify-between h-36 relative overflow-hidden hover:shadow-medium hover:scale-105 transition-all duration-300 text-left"
                    >
                        <span className="material-icons-round absolute -right-2 -bottom-4 text-6xl text-secondary opacity-50">monitor_weight</span>
                        <div>
                            <h4 className="font-bold text-yellow-900 dark:text-yellow-100">当前体重</h4>
                            <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                                {getDaysAgo() ? `上次：${getDaysAgo()}` : '点击记录'}
                            </p>
                        </div>
                        {renderWeightTrend()}
                        <div className="flex items-end gap-1">
                            <span className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
                                {latestWeight ? latestWeight.weight : (currentPet?.weight || '--')}
                            </span>
                            <span className="text-sm font-medium mb-1 text-yellow-700 dark:text-yellow-300">公斤</span>
                        </div>
                    </button>
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
                                {weightError && (
                                    <p className="text-xs text-red-500 mb-4">{weightError}</p>
                                )}
                                <div className="flex gap-3 w-full">
                                    <button
                                        onClick={() => {
                                            setShowWeightModal(false);
                                            setWeightError('');
                                        }}
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
