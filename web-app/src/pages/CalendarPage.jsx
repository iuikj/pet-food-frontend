import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import SecureImage from '../components/SecureImage';
import TodoItemComponent from '../components/TodoItem';
import TodoForm from '../components/TodoForm';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { pageTransitions } from '../utils/animations';
import { usePets } from '../hooks/usePets';
import { calendarApi, todosApi } from '../api';
import { autoSyncTodoToCalendar, exportTodoToCalendar, exportTodosAsIcs } from '../utils/calendarExport';
import { Capacitor } from '@capacitor/core';

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
    // 默认选中今天，进入页面即显示今日事项
    const [selectedDate, setSelectedDate] = useState(() => ({ date: new Date() }));
    const [allPetData, setAllPetData] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
    const [collapsedPets, setCollapsedPets] = useState({});

    // 待办相关状态
    const [todosByDate, setTodosByDate] = useState({});  // { 'YYYY-MM-DD': TodoItem[] }
    const [isTodoLoading, setIsTodoLoading] = useState(false);
    const [showTodoForm, setShowTodoForm] = useState(false);
    const [editingTodo, setEditingTodo] = useState(null);
    const [exportingId, setExportingId] = useState(null);

    const activePets = useMemo(() => pets.filter(p => p.has_plan), [pets]);

    // 获取当月饮食数据
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
            for (const r of results) { data[r.petId] = r.days; }
            setAllPetData(data);
        } catch {
            setAllPetData({});
        } finally {
            setIsLoading(false);
            setHasLoadedOnce(true);
        }
    }, [activePets]);

    // 获取当月待办数据
    const fetchMonthTodos = useCallback(async (date) => {
        setIsTodoLoading(true);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const lastDay = new Date(year, month, 0).getDate();
        const dateStart = `${year}-${String(month).padStart(2, '0')}-01`;
        const dateEnd = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
        try {
            const res = await todosApi.getTodos({ date_start: dateStart, date_end: dateEnd });
            if (res.code === 0) {
                const map = {};
                for (const todo of (res.data?.items || [])) {
                    if (!map[todo.due_date]) map[todo.due_date] = [];
                    map[todo.due_date].push(todo);
                }
                setTodosByDate(map);
            }
        } catch {
            // 静默处理
        } finally {
            setIsTodoLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAllCalendarData(activeDate);
        fetchMonthTodos(activeDate);
    }, [fetchAllCalendarData, fetchMonthTodos, activeDate]);

    const mergedDateMap = useMemo(() => {
        const map = {};
        for (const days of Object.values(allPetData)) {
            for (const d of days) {
                if (d.has_plan) map[d.date] = (map[d.date] || { hasMeal: false, hasTodo: false });
                if (d.has_plan) map[d.date].hasMeal = true;
            }
        }
        for (const [dateKey, todos] of Object.entries(todosByDate)) {
            if (todos.length > 0) {
                if (!map[dateKey]) map[dateKey] = { hasMeal: false, hasTodo: false };
                map[dateKey].hasTodo = true;
            }
        }
        return map;
    }, [allPetData, todosByDate]);

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

    const getSelectedDateTodos = () => {
        if (!selectedDate) return [];
        const key = formatDate(selectedDate.date);
        return todosByDate[key] || [];
    };

    const handleActiveStartDateChange = ({ activeStartDate }) => {
        setActiveDate(activeStartDate);
        // 切回当月时自动选中今天，切到其他月清空选中
        const today = new Date();
        const isSameMonth =
            activeStartDate.getFullYear() === today.getFullYear() &&
            activeStartDate.getMonth() === today.getMonth();
        setSelectedDate(isSameMonth ? { date: today } : null);
    };

    const handleClickDay = (date) => { setSelectedDate({ date }); };

    const handleGoToDaily = (date) => { navigate(`/dashboard/daily?date=${formatDate(date)}`); };

    const handleBackToToday = () => {
        const today = new Date();
        setActiveDate(new Date(today.getFullYear(), today.getMonth(), 1));
        setSelectedDate({ date: today });
    };

    const togglePetCollapse = (petId) => {
        setCollapsedPets(prev => ({ ...prev, [petId]: !prev[petId] }));
    };

    // ——— 待办操作 ———

    const handleToggleComplete = async (id, currentCompleted) => {
        try {
            const res = currentCompleted
                ? await todosApi.uncompleteTodo(id)
                : await todosApi.completeTodo(id);
            if (res.code === 0) {
                setTodosByDate(prev => {
                    const next = { ...prev };
                    for (const key of Object.keys(next)) {
                        next[key] = next[key].map(t =>
                            t.id === id
                                ? { ...t, is_completed: !currentCompleted, completed_at: !currentCompleted ? new Date().toISOString() : undefined }
                                : t
                        );
                    }
                    return next;
                });
            }
        } catch {
            toast.error('操作失败');
        }
    };

    const handleEditTodo = (todo) => {
        setEditingTodo(todo);
        setShowTodoForm(true);
    };

    const handleDeleteTodo = async (id) => {
        try {
            const res = await todosApi.deleteTodo(id);
            if (res.code === 0) {
                setTodosByDate(prev => {
                    const next = { ...prev };
                    for (const key of Object.keys(next)) {
                        next[key] = next[key].filter(t => t.id !== id);
                    }
                    return next;
                });
                toast.success('已删除');
            }
        } catch {
            toast.error('删除失败');
        }
    };

    const handleExportTodo = async (todo) => {
        setExportingId(todo.id);
        try {
            const result = await exportTodoToCalendar(todo);
            toast[result.success ? 'success' : 'error'](result.message);
        } catch {
            toast.error('导出失败');
        } finally {
            setExportingId(null);
        }
    };

    const handleBatchExport = () => {
        const todos = getSelectedDateTodos().filter(t => !t.is_completed);
        if (todos.length === 0) { toast.info('没有待导出的待办'); return; }
        if (Capacitor.isNativePlatform()) {
            // 原生：逐个弹出系统日历
            todos.forEach(t => exportTodoToCalendar(t));
        } else {
            exportTodosAsIcs(todos);
            toast.success('已下载 .ics 文件');
        }
    };

    const handleTodoSubmit = async (data) => {
        if (editingTodo) {
            const res = await todosApi.updateTodo(editingTodo.id, data);
            if (res.code === 0) {
                const updated = res.data;
                setTodosByDate(prev => {
                    const next = { ...prev };
                    // 先从旧 key 移除
                    for (const key of Object.keys(next)) {
                        next[key] = next[key].filter(t => t.id !== updated.id);
                    }
                    // 加入新 key
                    const dk = updated.due_date;
                    next[dk] = [...(next[dk] || []), updated];
                    return next;
                });
                toast.success('已更新');
            }
        } else {
            const res = await todosApi.createTodo(data);
            if (res.code === 0) {
                const created = res.data;
                setTodosByDate(prev => {
                    const dk = created.due_date;
                    return { ...prev, [dk]: [...(prev[dk] || []), created] };
                });
                toast.success('已创建');
                // 静默同步到系统日历，不再弹第二个 toast
                autoSyncTodoToCalendar(created).catch(() => {});
            }
        }
        setEditingTodo(null);
    };

    // ——— 渲染 ———

    const tileContent = ({ date, view }) => {
        if (view !== 'month') return null;
        const key = formatDate(date);
        const info = mergedDateMap[key];
        if (!info) return null;
        return (
            <div className="flex justify-center gap-0.5 mt-0.5">
                {info.hasMeal && <span className="block w-1.5 h-1.5 rounded-full bg-primary" />}
                {info.hasTodo && <span className="block w-1.5 h-1.5 rounded-full bg-blue-400" />}
            </div>
        );
    };

    const tileClassName = ({ date, view }) => {
        if (view !== 'month') return '';
        if (isPastDate(date)) return 'past-date';
        return '';
    };

    const renderTodoSection = () => {
        const todos = getSelectedDateTodos();
        const pendingTodos = todos.filter(t => !t.is_completed);
        const completedTodos = todos.filter(t => t.is_completed);

        return (
            <div className="bg-white dark:bg-surface-dark rounded-2xl p-5 shadow-soft space-y-3">
                {/* 待办标题 */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="material-icons-round text-blue-400 text-base">checklist</span>
                        <h4 className="font-bold text-sm">待办事项</h4>
                        {todos.length > 0 && (
                            <span className="text-xs px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium">
                                {pendingTodos.length}/{todos.length}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-1.5">
                        {/* 批量导入日历 */}
                        {pendingTodos.length > 0 && (
                            <button
                                onClick={handleBatchExport}
                                className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                            >
                                <span className="material-icons-round text-xs">event</span>
                                导入日历
                            </button>
                        )}
                        {/* 新建待办 */}
                        <button
                            onClick={() => { setEditingTodo(null); setShowTodoForm(true); }}
                            aria-label="新建待办"
                            className="w-9 h-9 rounded-full bg-blue-400 text-white flex items-center justify-center shadow-sm active:scale-95 transition-transform cursor-pointer"
                        >
                            <span className="material-icons-round text-base">add</span>
                        </button>
                    </div>
                </div>

                {/* 待办列表 */}
                {todos.length === 0 ? (
                    <p className="text-sm text-text-muted-light dark:text-text-muted-dark text-center py-2">
                        暂无待办，点击 + 添加
                    </p>
                ) : (
                    <div className="space-y-2">
                        {/* 未完成 */}
                        {pendingTodos.map(todo => (
                            <TodoItemComponent
                                key={todo.id}
                                todo={todo}
                                onComplete={handleToggleComplete}
                                onEdit={handleEditTodo}
                                onDelete={handleDeleteTodo}
                                onExport={handleExportTodo}
                                isExporting={exportingId === todo.id}
                            />
                        ))}
                        {/* 已完成（折叠显示） */}
                        {completedTodos.length > 0 && (
                            <div className="pt-1">
                                <p className="text-xs text-text-muted-light dark:text-text-muted-dark mb-1.5">
                                    已完成 {completedTodos.length} 项
                                </p>
                                {completedTodos.map(todo => (
                                    <TodoItemComponent
                                        key={todo.id}
                                        todo={todo}
                                        onComplete={handleToggleComplete}
                                        onEdit={handleEditTodo}
                                        onDelete={handleDeleteTodo}
                                        onExport={handleExportTodo}
                                        isExporting={exportingId === todo.id}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };

    const renderSelectedDatePanel = () => {
        if (!selectedDate) return null;
        const { date } = selectedDate;
        const dayLabel = date.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'short' });
        const future = isFutureDate(date);
        const petDataList = getSelectedDatePetData();

        return (
            <div className="space-y-3">
                {/* 日期标题 */}
                <div className="flex items-center justify-between px-1">
                    <h3 className="font-bold text-base">{dayLabel}</h3>
                    {future && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-text-muted-light dark:text-text-muted-dark font-medium">
                            仅查看
                        </span>
                    )}
                </div>

                {/* 饮食计划 */}
                {petDataList.length > 0 && (
                    <div className="bg-white dark:bg-surface-dark rounded-2xl p-5 shadow-soft space-y-3">
                        <div className="flex items-center gap-2">
                            <span className="material-icons-round text-primary text-base">restaurant</span>
                            <h4 className="font-bold text-sm">饮食计划</h4>
                        </div>
                        <div className="space-y-3">
                            {petDataList.map(({ pet, dayData }) => {
                                const isCollapsed = collapsedPets[pet.id] ?? false;
                                const completionPct = Math.round((dayData.completion_rate || 0) * 100);

                                return (
                                    <div key={pet.id} className="border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden">
                                        <button
                                            onClick={() => togglePetCollapse(pet.id)}
                                            aria-expanded={!isCollapsed}
                                            aria-label={`${pet.name} 饮食计划`}
                                            className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                                        >
                                            <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-gray-100 dark:bg-gray-800">
                                                {pet.avatar_url ? (
                                                    <SecureImage src={pet.avatar_url} alt={pet.name || '宠物头像'} className="w-full h-full object-cover" />
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
                                                                className="text-xs text-primary font-medium flex items-center gap-0.5 cursor-pointer"
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
                    </div>
                )}

                {/* 待办事项 */}
                {renderTodoSection()}
            </div>
        );
    };

    return (
        <motion.div {...pageTransitions} className="pb-32 overflow-x-hidden">
            {/* Header */}
            <header className="px-6 pt-12 pb-4 flex items-center gap-3 bg-background-light/90 dark:bg-background-dark/90 backdrop-blur-md sticky top-0 z-50">
                <button
                    onClick={() => navigate('/')}
                    aria-label="返回首页"
                    className="w-10 h-10 rounded-full bg-white dark:bg-surface-dark shadow-sm flex items-center justify-center text-text-muted-light dark:text-text-muted-dark hover:text-primary transition-colors cursor-pointer"
                >
                    <span className="material-icons-round">arrow_back</span>
                </button>
                <div className="flex-1">
                    <h1 className="text-xl font-bold">饮食日历</h1>
                    <p className="text-xs text-text-muted-light dark:text-text-muted-dark">
                        {activePets.length > 0 ? `${activePets.length} 只宠物有饮食计划` : '点击日期管理待办'}
                    </p>
                </div>
            </header>

            <main className="px-6 space-y-4">
                {/* 日历组件 */}
                <div className="calendar-container bg-white dark:bg-surface-dark rounded-2xl shadow-soft p-4 relative">
                    {/* 仅首次加载时显示 shimmer，月份切换时静默更新避免闪烁 */}
                    {!hasLoadedOnce && (isLoading || isTodoLoading) && (
                        <div className="absolute inset-0 bg-white/60 dark:bg-surface-dark/60 z-10 rounded-2xl overflow-hidden">
                            <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/40 dark:via-white/10 to-transparent" />
                        </div>
                    )}
                    <Calendar
                        locale="zh-CN"
                        calendarType="iso8601"
                        activeStartDate={activeDate}
                        value={selectedDate?.date ?? null}
                        tileContent={tileContent}
                        tileClassName={tileClassName}
                        onClickDay={handleClickDay}
                        onActiveStartDateChange={handleActiveStartDateChange}
                        prev2Label={null}
                        next2Label={null}
                        minDetail="month"
                        formatDay={(locale, date) => date.getDate()}
                    />
                    {/* 图例 + 回今天 */}
                    <div className="border-t border-gray-100 dark:border-gray-800 mt-2 pt-2 flex items-center justify-between">
                        <div className="flex items-center gap-3 text-xs text-text-muted-light dark:text-text-muted-dark">
                            <span className="flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />饮食计划
                            </span>
                            <span className="flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 inline-block" />待办事项
                            </span>
                        </div>
                        <button
                            onClick={handleBackToToday}
                            aria-label="回到今日"
                            className="px-3 py-1.5 rounded-xl bg-primary/10 text-primary font-bold text-sm flex items-center justify-center hover:bg-primary/20 active:scale-95 transition-all cursor-pointer"
                        >
                            今
                        </button>
                    </div>
                </div>

                {/* 选中日期面板 */}
                {renderSelectedDatePanel()}
            </main>

            {/* 待办表单 */}
            <TodoForm
                isOpen={showTodoForm}
                onClose={() => { setShowTodoForm(false); setEditingTodo(null); }}
                onSubmit={handleTodoSubmit}
                initialDate={selectedDate ? formatDate(selectedDate.date) : formatDate(new Date())}
                editTodo={editingTodo}
            />

        </motion.div>
    );
}
