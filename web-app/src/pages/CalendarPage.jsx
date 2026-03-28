import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import SecureImage from '../components/SecureImage';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { pageTransitions } from '../utils/animations';
import { usePets } from '../hooks/usePets';
import { calendarApi } from '../api';

function formatDate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function isPastDate(date) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(date);
    target.setHours(0, 0, 0, 0);
    return target < today;
}

function isFutureDate(date) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(date);
    target.setHours(0, 0, 0, 0);
    return target > today;
}

export default function CalendarPage() {
    const navigate = useNavigate();
    const { pets } = usePets();

    const [activeDate, setActiveDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(null);
    const [allPetData, setAllPetData] = useState({}); // { petId: [dayData...] }
    const [isLoading, setIsLoading] = useState(false);
    const [collapsedPets, setCollapsedPets] = useState({});

    // 只取有计划的宠物
    const activePets = useMemo(() => pets.filter(p => p.has_plan), [pets]);

    // 为所有有计划的宠物获取日历数据
    const fetchAllCalendarData = useCallback(async (date) => {
        if (activePets.length === 0) return;
        setIsLoading(true);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;

        try {
            const results = await Promise.all(
                activePets.map(async (pet) => {
                    try {
                        const res = await calendarApi.getMonthlyCalendar(pet.id, year, month);
                        return { petId: pet.id, days: res.code === 0 ? res.data?.days || [] : [] };
                    } catch {
                        return { petId: pet.id, days: [] };
                    }
                })
            );
            const data = {};
            for (const r of results) {
                data[r.petId] = r.days;
            }
            setAllPetData(data);
        } catch {
            setAllPetData({});
        } finally {
            setIsLoading(false);
        }
    }, [activePets]);

    useEffect(() => { fetchAllCalendarData(activeDate); }, [fetchAllCalendarData, activeDate]);

    // 合并所有宠物的 dateMap：某日任一宠物有计划即标记
    const mergedDateMap = useMemo(() => {
        const map = {};
        for (const days of Object.values(allPetData)) {
            for (const d of days) {
                if (d.has_plan) map[d.date] = true;
            }
        }
        return map;
    }, [allPetData]);

    // 选中日期时，获取每只宠物该日的数据
    const getSelectedDatePetData = () => {
        if (!selectedDate) return [];
        const key = formatDate(selectedDate.date);
        return activePets
            .map(pet => {
                const days = allPetData[pet.id] || [];
                const dayData = days.find(d => d.date === key);
                return { pet, dayData };
            })
            .filter(item => item.dayData?.has_plan);
    };

    const handleActiveStartDateChange = ({ activeStartDate }) => {
        setActiveDate(activeStartDate);
        setSelectedDate(null);
    };

    const handleClickDay = (date) => {
        setSelectedDate({ date });
    };

    const handleGoToDaily = (date) => {
        navigate(`/dashboard/daily?date=${formatDate(date)}`);
    };

    const handleBackToToday = () => {
        const today = new Date();
        setActiveDate(new Date(today.getFullYear(), today.getMonth(), 1));
        setSelectedDate(null);
    };

    const togglePetCollapse = (petId) => {
        setCollapsedPets(prev => ({ ...prev, [petId]: !prev[petId] }));
    };

    const tileContent = ({ date, view }) => {
        if (view !== 'month') return null;
        if (!mergedDateMap[formatDate(date)]) return null;
        return (
            <div className="flex justify-center mt-0.5">
                <span className="block w-1.5 h-1.5 rounded-full bg-primary" />
            </div>
        );
    };

    const tileClassName = ({ date, view }) => {
        if (view !== 'month') return '';
        if (isPastDate(date)) return 'past-date';
        return '';
    };

    // 选中日期面板 — 按宠物分组
    const renderSelectedDatePanel = () => {
        if (!selectedDate) return null;
        const { date } = selectedDate;
        const dayLabel = date.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'short' });
        const future = isFutureDate(date);
        const petDataList = getSelectedDatePetData();

        return (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-surface-dark rounded-2xl p-5 shadow-soft space-y-3"
            >
                <div className="flex justify-between items-center">
                    <h3 className="font-bold text-lg">{dayLabel}</h3>
                    {future && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-text-muted-light dark:text-text-muted-dark font-medium">
                            仅查看
                        </span>
                    )}
                </div>

                {petDataList.length === 0 ? (
                    <p className="text-sm text-text-muted-light dark:text-text-muted-dark">
                        该日暂无饮食计划
                    </p>
                ) : (
                    <div className="space-y-3">
                        {petDataList.map(({ pet, dayData }) => {
                            const isCollapsed = collapsedPets[pet.id] ?? false;
                            const completionPct = Math.round((dayData.completion_rate || 0) * 100);

                            return (
                                <div key={pet.id} className="border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden">
                                    {/* 宠物标题行 */}
                                    <button
                                        onClick={() => togglePetCollapse(pet.id)}
                                        className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                                    >
                                        <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-gray-100 dark:bg-gray-800">
                                            {pet.avatar_url ? (
                                                <SecureImage src={pet.avatar_url} alt={pet.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-primary font-bold text-sm">
                                                    {pet.name?.charAt(0)}
                                                </div>
                                            )}
                                        </div>
                                        <span className="font-medium text-sm flex-1 text-left">{pet.name}</span>
                                        <span className="text-xs text-text-muted-light dark:text-text-muted-dark">
                                            {dayData.completed_meals}/{dayData.total_meals} 餐
                                        </span>
                                        <motion.span
                                            className="material-icons-round text-text-muted-light dark:text-text-muted-dark text-lg"
                                            animate={{ rotate: isCollapsed ? -90 : 0 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            expand_more
                                        </motion.span>
                                    </button>

                                    {/* 展开详情 */}
                                    <AnimatePresence initial={false}>
                                        {!isCollapsed && (
                                            <motion.div
                                                initial={{ height: 0 }}
                                                animate={{ height: 'auto' }}
                                                exit={{ height: 0 }}
                                                transition={{ duration: 0.2 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="px-3 pb-3 space-y-2">
                                                    <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-primary rounded-full transition-all duration-300"
                                                            style={{ width: `${completionPct}%` }}
                                                        />
                                                    </div>
                                                    <div className="flex justify-between items-center">
                                                        <p className="text-xs text-text-muted-light dark:text-text-muted-dark">
                                                            完成率 {completionPct}%
                                                        </p>
                                                        <button
                                                            onClick={() => handleGoToDaily(date)}
                                                            className="text-xs text-primary font-medium flex items-center gap-0.5"
                                                        >
                                                            {future ? '查看计划' : '查看详情'}
                                                            <span className="material-icons-round text-xs">arrow_forward</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            );
                        })}
                    </div>
                )}
            </motion.div>
        );
    };

    return (
        <motion.div
            {...pageTransitions}
            className="pb-32 overflow-x-hidden"
        >
            {/* Header — 返回在左 */}
            <header className="px-6 pt-12 pb-4 flex items-center gap-3 bg-background-light/90 dark:bg-background-dark/90 backdrop-blur-md sticky top-0 z-50">
                <button
                    onClick={() => navigate(-1)}
                    className="w-10 h-10 rounded-full bg-white dark:bg-surface-dark shadow-sm flex items-center justify-center text-text-muted-light dark:text-text-muted-dark hover:text-primary transition-colors"
                >
                    <span className="material-icons-round">arrow_back</span>
                </button>
                <div className="flex-1">
                    <h1 className="text-xl font-bold">饮食日历</h1>
                    <p className="text-xs text-text-muted-light dark:text-text-muted-dark">
                        {activePets.length > 0 ? `${activePets.length} 只宠物有饮食计划` : '暂无饮食计划'}
                    </p>
                </div>
            </header>

            <main className="px-6 space-y-6">
                {/* 日历组件 */}
                <div className="calendar-container bg-white dark:bg-surface-dark rounded-2xl shadow-soft p-4 relative">
                    {isLoading && (
                        <div className="absolute inset-0 bg-white/60 dark:bg-surface-dark/60 z-10 rounded-2xl overflow-hidden">
                            <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/40 dark:via-white/10 to-transparent" />
                        </div>
                    )}
                    <Calendar
                        locale="zh-CN"
                        calendarType="iso8601"
                        activeStartDate={activeDate}
                        tileContent={tileContent}
                        tileClassName={tileClassName}
                        onClickDay={handleClickDay}
                        onActiveStartDateChange={handleActiveStartDateChange}
                        prev2Label={null}
                        next2Label={null}
                        minDetail="month"
                        formatDay={(locale, date) => date.getDate()}
                    />
                    <div className="border-t border-gray-100 dark:border-gray-800 mt-2 pt-2 flex justify-end">
                        <button
                            onClick={handleBackToToday}
                            className="px-3 py-1.5 rounded-xl bg-primary/10 text-primary font-bold text-sm flex items-center justify-center hover:bg-primary/20 active:scale-95 transition-all"
                        >
                            今
                        </button>
                    </div>
                </div>

                {/* 选中日期 — 按宠物分组展示 */}
                {renderSelectedDatePanel()}
            </main>
        </motion.div>
    );
}
