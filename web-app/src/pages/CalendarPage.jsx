import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { pageTransitions } from '../utils/animations';
import { usePets } from '../hooks/usePets';
import { calendarApi } from '../api';

/**
 * 格式化日期为 YYYY-MM-DD
 */
function formatDate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

/**
 * 根据日期列表构建 dateMap
 */
function buildDateMap(days) {
    if (!days || days.length === 0) return {};
    const map = {};
    days.forEach(d => {
        map[d.date] = { ...d };
    });
    return map;
}

/** 判断日期是否在今天之前（不含今天） */
function isPastDate(date) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(date);
    target.setHours(0, 0, 0, 0);
    return target < today;
}

/** 判断日期是否在今天之后（不含今天） */
function isFutureDate(date) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(date);
    target.setHours(0, 0, 0, 0);
    return target > today;
}

export default function CalendarPage() {
    const navigate = useNavigate();
    const { currentPet } = usePets();

    const [activeDate, setActiveDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(null);
    const [calendarData, setCalendarData] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const dateMap = useMemo(() => buildDateMap(calendarData), [calendarData]);

    const fetchCalendarData = useCallback(async (date) => {
        if (!currentPet?.id) return;
        setIsLoading(true);
        try {
            const year = date.getFullYear();
            const month = date.getMonth() + 1;
            const res = await calendarApi.getMonthlyCalendar(currentPet.id, year, month);
            if (res.code === 0 && res.data?.days) {
                setCalendarData(res.data.days);
            } else {
                setCalendarData([]);
            }
        } catch (err) {
            console.error('Failed to fetch calendar data:', err);
            setCalendarData([]);
        } finally {
            setIsLoading(false);
        }
    }, [currentPet?.id]);

    useEffect(() => {
        fetchCalendarData(activeDate);
    }, [fetchCalendarData, activeDate]);

    const handleActiveStartDateChange = ({ activeStartDate }) => {
        setActiveDate(activeStartDate);
        setSelectedDate(null);
    };

    const handleClickDay = (date) => {
        const key = formatDate(date);
        const dayData = dateMap[key];
        setSelectedDate({ date, data: dayData || null });
    };

    const handleGoToDaily = (date) => {
        navigate(`/dashboard/daily?date=${formatDate(date)}`);
    };

    const handleBackToToday = () => {
        const today = new Date();
        setActiveDate(new Date(today.getFullYear(), today.getMonth(), 1));
        setSelectedDate(null);
    };

    // react-calendar tileContent: 有计划的日子渲染小圆点
    const tileContent = ({ date, view }) => {
        if (view !== 'month') return null;
        const key = formatDate(date);
        const dayData = dateMap[key];
        if (!dayData?.has_plan) return null;

        return (
            <div className="flex justify-center mt-0.5">
                <span className="block w-1.5 h-1.5 rounded-full bg-primary" />
            </div>
        );
    };

    // react-calendar tileClassName: 过去日期加灰色样式
    const tileClassName = ({ date, view }) => {
        if (view !== 'month') return '';
        if (isPastDate(date)) return 'past-date';
        return '';
    };

    // 选中日期的摘要面板
    const renderSelectedDatePanel = () => {
        if (!selectedDate) return null;
        const { date, data } = selectedDate;
        const dayLabel = date.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'short' });
        const future = isFutureDate(date);

        return (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-surface-dark rounded-2xl p-5 shadow-soft space-y-3"
            >
                <div className="flex justify-between items-center">
                    <h3 className="font-bold text-lg">{dayLabel}</h3>
                    {data?.has_plan && (
                        <button
                            onClick={() => handleGoToDaily(date)}
                            className="text-sm text-primary font-medium flex items-center gap-1 hover:opacity-80 transition-opacity"
                        >
                            {future ? '查看计划' : '查看详情'}
                            <span className="material-icons-round text-sm">arrow_forward</span>
                        </button>
                    )}
                </div>

                {data?.has_plan ? (
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5">
                                <span className="material-icons-round text-sm text-primary">restaurant</span>
                                <span className="text-sm">
                                    {data.completed_meals}/{data.total_meals} 餐已完成
                                </span>
                            </div>
                            {future && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-text-muted-light dark:text-text-muted-dark font-medium">
                                    仅查看
                                </span>
                            )}
                        </div>
                        {/* 完成率进度条 */}
                        <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-primary rounded-full transition-all duration-300"
                                style={{ width: `${Math.round(data.completion_rate * 100)}%` }}
                            />
                        </div>
                        <p className="text-xs text-text-muted-light dark:text-text-muted-dark">
                            完成率 {Math.round(data.completion_rate * 100)}%
                        </p>
                    </div>
                ) : (
                    <p className="text-sm text-text-muted-light dark:text-text-muted-dark">
                        该日暂无饮食计划
                    </p>
                )}
            </motion.div>
        );
    };

    return (
        <motion.div
            {...pageTransitions}
            className="pb-32 overflow-x-hidden"
        >
            {/* Header */}
            <header className="px-6 pt-12 pb-4 flex justify-between items-center bg-background-light/90 dark:bg-background-dark/90 backdrop-blur-md sticky top-0 z-50">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        {currentPet?.avatar_url ? (
                            <img
                                alt={currentPet.name}
                                className="w-10 h-10 rounded-full object-cover border-2 border-white dark:border-surface-dark shadow-sm"
                                src={currentPet.avatar_url}
                            />
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold border-2 border-white dark:border-surface-dark shadow-sm">
                                {currentPet?.name?.charAt(0) || '?'}
                            </div>
                        )}
                    </div>
                    <div>
                        <p className="text-xs text-text-muted-light dark:text-text-muted-dark font-medium">饮食日历</p>
                        <h1 className="text-lg font-bold">{currentPet?.name || '宠物'}</h1>
                    </div>
                </div>
                <button
                    onClick={() => navigate('/')}
                    className="w-10 h-10 rounded-full bg-white dark:bg-surface-dark shadow-sm flex items-center justify-center text-text-muted-light dark:text-text-muted-dark hover:text-primary transition-colors"
                >
                    <span className="material-icons-round">arrow_back</span>
                </button>
            </header>

            <main className="px-6 space-y-6">
                {/* 日历组件 */}
                <div className="calendar-container bg-white dark:bg-surface-dark rounded-2xl shadow-soft p-4">
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
                    {/* 分割线 + 回到今日 */}
                    <div className="border-t border-gray-100 dark:border-gray-800 mt-2 pt-2 flex justify-end">
                        <button
                            onClick={handleBackToToday}
                            className="px-3 py-1.5 rounded-xl bg-primary/10 text-primary font-bold text-sm flex items-center justify-center hover:bg-primary/20 active:scale-95 transition-all"
                            title="回到今日"
                        >
                            今
                        </button>
                    </div>
                </div>

                {/* 选中日期摘要 */}
                {renderSelectedDatePanel()}
            </main>
        </motion.div>
    );
}
