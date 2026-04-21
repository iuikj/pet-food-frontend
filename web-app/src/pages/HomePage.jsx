import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import SecureImage from '../components/SecureImage';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { pageTransitions } from '../utils/animations';
import PetSelectorMenu from '../components/PetSelectorMenu';
import MealCard from '../components/MealCard';
import Skeleton from '../components/ui/Skeleton';
import PlanDetails from './PlanDetails';
import { usePets } from '../hooks/usePets';
import { useMeals } from '../hooks/useMeals';
import { useWeights } from '../hooks/useWeights';
import { calendarApi, mealsApi } from '../api';
import { usePlanGeneration } from '../hooks/usePlanGeneration';
import { WEEK_DAY_LABELS } from '../utils/calendarConstants';
import WeightRecordSheet from '../components/WeightRecordSheet';

/** YYYY-MM-DD 格式化 */
function formatDate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

/** 构建 dateMap: { 'YYYY-MM-DD': { ...dayData } } */
function buildDateMap(days) {
    if (!days || days.length === 0) return {};
    const map = {};
    days.forEach(d => { map[d.date] = { ...d }; });
    return map;
}

// 辅助函数
const getMealTypeName = (type) => {
    const names = { breakfast: '早餐', lunch: '午餐', dinner: '晚餐', snack: '加餐' };
    return names[type] || type;
};

export default function HomePage() {
    const navigate = useNavigate();
    const [isPetMenuOpen, setIsPetMenuOpen] = useState(false);
    const { pets, currentPet, setCurrentPet, activePlanData, isLoading: petsLoading } = usePets();
    const { meals, nutritionSummary, isLoading: mealsLoading, toggleMealComplete } = useMeals();
    const { status: genStatus } = usePlanGeneration();

    // 餐食详情弹窗状态
    const [selectedMeal, setSelectedMeal] = useState(null);

    // 体重最新记录（首页卡片展示）
    const [latestWeight, setLatestWeight] = useState(null);

    // 体重历史数据（趋势图用）
    const [weightHistory, setWeightHistory] = useState([]);

    // 跳转到体重曲线详情页（需先选中宠物）
    const goToWeightTrend = useCallback(() => {
        if (!currentPet?.id) {
            setIsPetMenuOpen(true);
            return;
        }
        navigate(`/pet/${currentPet.id}/weight`);
    }, [currentPet?.id, navigate]);

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

    // 获取体重历史
    const fetchWeightHistory = useCallback(async () => {
        if (!currentPet?.id) return;
        try {
            const res = await weightsApi.getWeightHistory(currentPet.id, 7);
            if (res.code === 0 && Array.isArray(res.data)) {
                setWeightHistory(res.data);
            } else {
                setWeightHistory([]);
            }
        } catch {
            setWeightHistory([]);
        }
    }, [currentPet?.id]);

    useEffect(() => { fetchLatestWeight(); fetchWeightHistory(); }, [fetchLatestWeight, fetchWeightHistory]);

    // 计算距上次记录天数
    const getDaysAgo = () => {
        if (!latestWeight?.recorded_date) return null;
        const diff = Math.floor((Date.now() - new Date(latestWeight.recorded_date).getTime()) / 86400000);
        if (diff === 0) return '今天';
        return `${diff}天前`;
    };

    // --- 迷你体重趋势 SVG ---
    const renderWeightSparkline = (data, w = 100, h = 40) => {
        if (!data || data.length < 2) return null;
        const sorted = [...data].sort((a, b) => new Date(a.recorded_date) - new Date(b.recorded_date));
        const weights = sorted.map(d => d.weight);
        const minW = Math.min(...weights);
        const maxW = Math.max(...weights);
        const range = maxW - minW || 1;
        const pad = 4;
        const points = weights.map((v, i) => {
            const x = pad + (i / (weights.length - 1)) * (w - pad * 2);
            const y = pad + (1 - (v - minW) / range) * (h - pad * 2);
            return `${x},${y}`;
        });
        return (
            <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible text-primary">
                <polyline
                    points={points.join(' ')}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                {(() => {
                    const last = points[points.length - 1].split(',');
                    return <circle cx={last[0]} cy={last[1]} r="3" fill="currentColor" />;
                })()}
            </svg>
        );
    };

    // 体重趋势文案
    const getWeightTrend = () => {
        if (weightHistory.length < 2) return null;
        const sorted = [...weightHistory].sort((a, b) => new Date(a.recorded_date) - new Date(b.recorded_date));
        const diff = sorted[sorted.length - 1].weight - sorted[sorted.length - 2].weight;
        if (Math.abs(diff) < 0.05) return { text: '保持稳定', icon: 'trending_flat', color: 'text-gray-500' };
        if (diff > 0) return { text: `+${diff.toFixed(1)}kg`, icon: 'trending_up', color: 'text-red-500' };
        return { text: `${diff.toFixed(1)}kg`, icon: 'trending_down', color: 'text-green-600' };
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
                                <SecureImage
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
        </header>
    );

    // ========== 日历 & 日期选择 ==========
    const [isCalendarExpanded, setIsCalendarExpanded] = useState(false);
    const [calendarData, setCalendarData] = useState([]);
    const [calendarActiveDate, setCalendarActiveDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(null);       // null = 今日
    const [dateMeals, setDateMeals] = useState([]);
    const [dateMealsLoading, setDateMealsLoading] = useState(false);
    const [dateNutritionSummary, setDateNutritionSummary] = useState(null);

    const dateMap = useMemo(() => buildDateMap(calendarData), [calendarData]);

    // 加载月度日历数据
    const fetchCalendarData = useCallback(async (date) => {
        if (!currentPet?.id) return;
        try {
            const res = await calendarApi.getMonthlyCalendar(
                currentPet.id, date.getFullYear(), date.getMonth() + 1
            );
            if (res.code === 0 && res.data?.days) {
                setCalendarData(res.data.days);
            } else {
                setCalendarData([]);
            }
        } catch { setCalendarData([]); }
    }, [currentPet?.id]);

    useEffect(() => { fetchCalendarData(calendarActiveDate); }, [fetchCalendarData, calendarActiveDate]);

    // 点击日期 → 在主页原地加载该日餐食
    const handleDayClick = useCallback((date) => {
        const today = new Date();
        const isToday = date.toDateString() === today.toDateString();
        if (isToday) {
            setSelectedDate(null);   // 回到"今日"
            setDateMeals([]);
            setDateNutritionSummary(null);
            return;
        }
        setSelectedDate(date);
    }, []);

    // selectedDate 变化时加载指定日期餐食
    useEffect(() => {
        if (!selectedDate || !currentPet?.id) {
            setDateMeals([]);
            setDateNutritionSummary(null);
            return;
        }
        let cancelled = false;
        setDateMealsLoading(true);
        mealsApi.getMealsByDate(currentPet.id, formatDate(selectedDate))
            .then(res => {
                if (cancelled) return;
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
                    setDateNutritionSummary(res.data.nutrition_summary || null);
                } else {
                    setDateMeals([]);
                    setDateNutritionSummary(null);
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setDateMeals([]);
                    setDateNutritionSummary(null);
                }
            })
            .finally(() => { if (!cancelled) setDateMealsLoading(false); });
        return () => { cancelled = true; };
    }, [selectedDate, currentPet?.id]);

    // 展示的餐食：选中日期 or 今日
    const displayMeals = selectedDate ? dateMeals : meals;
    const displayMealsLoading = selectedDate ? dateMealsLoading : mealsLoading;
    const displayDateLabel = selectedDate
        ? selectedDate.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'short' })
        : '今日';

    // --- react-calendar 回调 ---
    const handleActiveStartDateChange = ({ activeStartDate }) => {
        setCalendarActiveDate(activeStartDate);
    };

    const calendarTileContent = useCallback(({ date, view }) => {
        if (view !== 'month') return null;
        const key = formatDate(date);
        const dayData = dateMap[key];
        if (!dayData?.has_plan) return null;
        return (
            <div className="flex justify-center mt-0.5">
                <span className="block w-1.5 h-1.5 rounded-full bg-primary" />
            </div>
        );
    }, [dateMap]);

    const calendarTileClassName = useCallback(({ date, view }) => {
        if (view !== 'month') return '';
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        if (d < today) return 'past-date';
        return '';
    }, []);

    // --- 折叠状态：当前周条 (Mon-Sun, 7 天) ---
    const getThisWeekDays = () => {
        const today = new Date();
        const dow = today.getDay();
        const mondayOffset = dow === 0 ? -6 : 1 - dow;
        const monday = new Date(today);
        monday.setDate(today.getDate() + mondayOffset);
        return Array.from({ length: 7 }, (_, i) => {
            const d = new Date(monday);
            d.setDate(monday.getDate() + i);
            const key = formatDate(d);
            const dayData = dateMap[key];
            return {
                label: WEEK_DAY_LABELS[i],
                dateNum: d.getDate(),
                fullDate: d,
                dateStr: key,
                isToday: d.toDateString() === today.toDateString(),
                isSelected: selectedDate && d.toDateString() === selectedDate.toDateString(),
                hasPlan: dayData?.has_plan || false,
            };
        });
    };
    const thisWeekDays = getThisWeekDays();

    // 渲染周历
    const renderWeekCalendar = () => (
        <section>
            <div className="flex justify-between items-end mb-4">
                <div>
                    <h2 className="text-2xl font-bold">{selectedDate ? displayDateLabel : '本周'}</h2>
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

            {/* 折叠：紧凑周条 */}
            {!isCalendarExpanded && (
                <div className="flex justify-between items-center bg-white dark:bg-surface-dark p-3 rounded-2xl shadow-soft gap-1">
                    {thisWeekDays.map((day, idx) => {
                        return (
                            <button
                                key={idx}
                                onClick={() => handleDayClick(day.fullDate)}
                                className="flex flex-col items-center gap-1 flex-1 py-1 rounded-xl transition-all duration-150"
                            >
                                <span className={`text-xs font-semibold
                                    ${day.isToday ? 'text-primary' : 'text-text-muted-light dark:text-text-muted-dark'}`}>
                                    {day.label}
                                </span>
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all
                                    ${day.isToday
                                        ? 'bg-primary text-white dark:text-gray-900 font-bold shadow-glow'
                                        : day.isSelected
                                            ? 'bg-gray-200 dark:bg-gray-700 font-bold'
                                            : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}
                                >
                                    {day.dateNum}
                                </div>
                                {/* 圆点指示 */}
                                <div className="h-1.5 flex items-center justify-center">
                                    {day.hasPlan ? (
                                        <span className="block w-1.5 h-1.5 rounded-full bg-primary" />
                                    ) : (
                                        day.isToday ? <span className="block w-1 h-1 rounded-full bg-primary" /> : null
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}

            {/* 展开：react-calendar 月历 */}
            <motion.div
                initial={false}
                animate={{
                    height: isCalendarExpanded ? 'auto' : 0,
                    opacity: isCalendarExpanded ? 1 : 0
                }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="overflow-hidden"
            >
                <div className="calendar-container calendar-compact bg-white dark:bg-surface-dark rounded-2xl shadow-soft p-3">
                    <Calendar
                        locale="zh-CN"
                        calendarType="iso8601"
                        value={selectedDate || new Date()}
                        activeStartDate={calendarActiveDate}
                        tileContent={calendarTileContent}
                        tileClassName={calendarTileClassName}
                        onClickDay={handleDayClick}
                        onActiveStartDateChange={handleActiveStartDateChange}
                        prev2Label={null}
                        next2Label={null}
                        minDetail="month"
                        formatDay={(_locale, date) => date.getDate()}
                    />
                    {/* 分割线 + 回到今日 */}
                    <div className="border-t border-gray-100 dark:border-gray-800 mt-1.5 pt-1.5 flex justify-end">
                        <button
                            onClick={() => {
                                const today = new Date();
                                setCalendarActiveDate(new Date(today.getFullYear(), today.getMonth(), 1));
                                setSelectedDate(null);
                                setDateMeals([]);
                                setDateNutritionSummary(null);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-bold text-xs flex items-center justify-center hover:bg-primary/20 active:scale-95 transition-all"
                            title="回到今日"
                        >
                            今
                        </button>
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
            <button
                onClick={goToWeightTrend}
                className="bg-primary/10 dark:bg-primary/5 p-5 rounded-2xl flex flex-col justify-between h-36 relative overflow-hidden text-left hover:shadow-soft active:scale-[0.98] transition-all duration-300 group"
            >
                <div>
                    <h4 className="font-bold text-green-900/80 dark:text-green-100/80 mb-1">体重趋势</h4>
                    <p className="text-xs text-green-800/60 dark:text-green-200/60 font-medium">
                        {weightHistory.length >= 2 ? `${weightHistory.length}条记录` : '点击开始记录'}
                    </p>
                </div>
                <div className="mt-auto">
                    {renderWeightSparkline(weightHistory, 110, 36) || (
                        <span className="material-icons-round text-4xl text-primary/30">show_chart</span>
                    )}
                </div>
            </button>
            <button
                onClick={goToWeightTrend}
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

    // 展示的营养摘要：选中日期 or 今日
    const displayNutritionSummary = selectedDate ? dateNutritionSummary : nutritionSummary;

    // 渲染：每日营养进度（真实数据）
    const renderNutritionProgress = () => {
        if (!displayNutritionSummary) return null;

        const { total_calories, consumed_calories, protein, fat, carbs } = displayNutritionSummary;
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
                            <h3 className="font-bold text-lg">{selectedDate ? displayDateLabel : '每日'}营养</h3>
                            <p className="text-sm opacity-70">
                                {caloriePercent > 0 ? `已完成${selectedDate ? '' : '每日'}目标的${caloriePercent}%` : `${selectedDate ? '当日' : '今日'}尚未开始打卡`}
                            </p>
                        </div>
                        {genStatus === 'generating' && (
                        <div className="bg-white/50 dark:bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                            AI优化中
                        </div>
                        )}
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="relative w-32 h-32 flex-shrink-0">
                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                                <circle className="text-white/40 dark:text-white/10" cx="50" cy="50" fill="transparent" r="40" stroke="currentColor" strokeWidth="8"></circle>
                                <circle
                                    cx="50" cy="50" fill="transparent" r="40"
                                    className="text-primary"
                                    stroke="currentColor"
                                    strokeDasharray={circumference}
                                    strokeDashoffset={strokeDashoffset}
                                    strokeLinecap="round"
                                    strokeWidth="8"
                                    style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                                ></circle>
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                                <span className="text-3xl font-bold leading-none">{Math.round(remainingCalories)}</span>
                                <span className="text-xs uppercase font-medium tracking-wide opacity-70">剩余卡路里</span>
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
    const completedMealsCount = displayMeals.filter(m => m.isCompleted).length;

    // 渲染：今日餐食列表
    const renderMealsList = () => (
        <section>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                {displayDateLabel}餐食
                <span className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded text-text-muted-light dark:text-text-muted-dark font-normal">
                    已完成 {completedMealsCount}/{displayMeals.length} 餐
                </span>
            </h3>
            {displayMealsLoading ? (
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
            ) : displayMeals.length === 0 ? (
                <div className="text-center py-8 text-text-muted-light dark:text-text-muted-dark">
                    <span className="material-icons-round text-4xl mb-2 block opacity-40">restaurant</span>
                    <p className="text-sm">{selectedDate ? '该日暂无餐食记录' : '今日暂无餐食记录'}</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {displayMeals.map(meal => (
                        <MealCard
                            key={meal.id}
                            meal={meal}
                            isExpanded={false}
                            onToggleExpand={handleMealCardClick}
                            onToggleComplete={selectedDate ? undefined : toggleMealComplete}
                        />
                    ))}
                </div>
            )}
        </section>
    );

    // 渲染：已解锁功能卡片
    const renderUnlockedCards = () => {
        const trend = getWeightTrend();
        return (
            <section className="grid grid-cols-2 gap-4">
                <button
                    onClick={goToWeightTrend}
                    className="bg-primary/10 dark:bg-primary/5 p-5 rounded-2xl flex flex-col justify-between h-36 relative overflow-hidden hover:shadow-medium hover:scale-105 transition-all duration-300 text-left"
                >
                    <div>
                        <div className="flex items-center justify-between">
                            <h4 className="font-bold text-green-900 dark:text-green-100">体重趋势</h4>
                            {trend && (
                                <span className={`material-icons-round text-sm ${trend.color}`}>{trend.icon}</span>
                            )}
                        </div>
                        <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                            {trend ? trend.text : `${weightHistory.length}条记录`}
                        </p>
                    </div>
                    <div className="mt-auto pt-1">
                        {renderWeightSparkline(weightHistory, 110, 36) || (
                            <span className="material-icons-round text-3xl text-primary/30">show_chart</span>
                        )}
                    </div>
                </button>
                <button
                    onClick={goToWeightTrend}
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
    };

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
        </motion.div>
    );
}
