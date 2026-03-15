import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion'; // eslint-disable-line no-unused-vars -- motion used via JSX <motion.div>
import { usePlanGeneration } from '../hooks/usePlanGeneration';
import { usePets } from '../hooks/usePets';
import { flipTransitions } from '../utils/animations';

// ── 周状态配置 ──
const weekStatusConfig = {
    pending: {
        icon: 'schedule',
        color: 'text-gray-400 dark:text-gray-600',
        bg: 'bg-gray-50 dark:bg-gray-800/50',
        border: 'border-gray-200 dark:border-gray-700',
        ring: '',
    },
    planning: {
        icon: 'edit_note',
        color: 'text-amber-600 dark:text-amber-400',
        bg: 'bg-amber-50 dark:bg-amber-900/20',
        border: 'border-amber-300 dark:border-amber-700',
        ring: 'ring-2 ring-amber-300/50 dark:ring-amber-600/40',
    },
    searching: {
        icon: 'travel_explore',
        color: 'text-blue-600 dark:text-blue-400',
        bg: 'bg-blue-50 dark:bg-blue-900/20',
        border: 'border-blue-300 dark:border-blue-700',
        ring: 'ring-2 ring-blue-300/50 dark:ring-blue-600/40',
    },
    writing: {
        icon: 'draw',
        color: 'text-purple-600 dark:text-purple-400',
        bg: 'bg-purple-50 dark:bg-purple-900/20',
        border: 'border-purple-300 dark:border-purple-700',
        ring: 'ring-2 ring-purple-300/50 dark:ring-purple-600/40',
    },
    completed: {
        icon: 'check_circle',
        color: 'text-primary',
        bg: 'bg-primary/10',
        border: 'border-primary/30',
        ring: '',
    },
};

const weekLabels = ['基础适应期', '营养强化期', '多样化拓展', '巩固优化期'];

// 阶段图标
const phaseIcons = ['science', 'restaurant_menu', 'summarize'];

// ── EventFeed: 实时事件消息展示 ──
function EventFeed({ logs, maxVisible = 3 }) {
    const recentLogs = logs.slice(-maxVisible);
    const latestMessage = logs.length > 0 ? logs[logs.length - 1].message : null;

    return (
        <div className="mt-3 space-y-1.5 min-h-[3.5rem]">
            {/* 最新事件消息（带动画切换） */}
            <AnimatePresence mode="wait">
                {latestMessage && (
                    <motion.div
                        key={latestMessage}
                        initial={{ opacity: 0, x: 12 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -12 }}
                        transition={{ duration: 0.25 }}
                        className="flex items-start gap-2"
                    >
                        <span className="relative flex h-2 w-2 mt-1.5 flex-shrink-0">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary"></span>
                        </span>
                        <p className="text-sm font-medium text-text-main-light dark:text-text-main-dark leading-snug">
                            {latestMessage}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 历史事件（静态淡出） */}
            {recentLogs.slice(0, -1).reverse().map((log, i) => (
                <div
                    key={`${log.time}-${i}`}
                    className="flex items-start gap-2"
                    style={{ opacity: 0.4 - i * 0.15 }}
                >
                    <span className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600 mt-1.5 flex-shrink-0"></span>
                    <p className="text-xs text-text-muted-light dark:text-text-muted-dark leading-snug truncate">
                        {log.message}
                    </p>
                </div>
            ))}
        </div>
    );
}

// ── WeekStatusGrid 组件 ──
function WeekStatusGrid({ weekStatuses }) {
    return (
        <div className="grid grid-cols-2 gap-3 mt-3">
            {[1, 2, 3, 4].map((weekNum) => {
                const ws = weekStatuses[weekNum];
                const config = weekStatusConfig[ws.status];
                const isActive = ws.status !== 'pending' && ws.status !== 'completed';

                return (
                    <motion.div
                        key={weekNum}
                        initial={{ opacity: 0, scale: 0.8, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{
                            delay: weekNum * 0.1,
                            type: 'spring',
                            stiffness: 300,
                            damping: 25,
                        }}
                        className={`relative p-3 rounded-xl border ${config.bg} ${config.border} ${config.ring} transition-all duration-300`}
                    >
                        <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-bold text-text-main-light dark:text-text-main-dark">
                                第{weekNum}周
                            </span>
                            <AnimatePresence mode="wait">
                                <motion.span
                                    key={ws.status}
                                    initial={{ scale: 0, rotate: -90 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    exit={{ scale: 0, rotate: 90 }}
                                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                                    className={`material-symbols-outlined text-base ${config.color}`}
                                >
                                    {config.icon}
                                </motion.span>
                            </AnimatePresence>
                        </div>
                        <p className="text-[10px] text-text-muted-light dark:text-text-muted-dark truncate">
                            {weekLabels[weekNum - 1]}
                        </p>
                        <p className={`text-[10px] font-medium mt-0.5 ${config.color}`}>
                            {ws.label}
                        </p>

                        {/* 脉冲指示点 */}
                        {isActive && (
                            <span className="absolute top-2 right-2 flex h-2 w-2">
                                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                                    ws.status === 'planning' ? 'bg-amber-400' :
                                    ws.status === 'searching' ? 'bg-blue-400' : 'bg-purple-400'
                                }`}></span>
                                <span className={`relative inline-flex rounded-full h-2 w-2 ${
                                    ws.status === 'planning' ? 'bg-amber-500' :
                                    ws.status === 'searching' ? 'bg-blue-500' : 'bg-purple-500'
                                }`}></span>
                            </span>
                        )}
                    </motion.div>
                );
            })}
        </div>
    );
}

// ── Loading 页面 ──
export default function Loading() {
    const navigate = useNavigate();
    const {
        status,
        progress,
        currentStepIndex,
        steps,
        startGeneration,
        resetGeneration,
        isBackgroundRunning,
        weekStatuses,
        logs,
    } = usePlanGeneration();
    const { currentPet, setPetHasPlan } = usePets();
    const hasStartedRef = useRef(false);
    const hasCompletedRef = useRef(false);

    // 追踪翻页方向（渲染期间调整 state — React 推荐模式）
    const flipDirection = 1;

    // 启动生成 - 只执行一次
    useEffect(() => {
        if (status === 'idle' && !hasStartedRef.current) {
            hasStartedRef.current = true;
            startGeneration(currentPet);
        }
    }, [status, startGeneration, currentPet]);

    // 完成时跳转 - 单独处理
    useEffect(() => {
        if (status === 'completed' && !hasCompletedRef.current) {
            hasCompletedRef.current = true;
            if (currentPet) {
                setPetHasPlan(currentPet.id, true);
            }
            navigate('/plan/summary');
        }
    }, [status, navigate, currentPet, setPetHasPlan]);

    // 强制返回处理
    const handleForceBack = () => {
        resetGeneration();
        navigate(-1);
    };

    const variants = flipTransitions(flipDirection);

    return (
        <div className="bg-background-light dark:bg-background-dark font-display text-text-main-light dark:text-text-main-dark transition-colors duration-300 antialiased selection:bg-primary selection:text-white pb-32 min-h-[max(884px,100dvh)]">
            <header className="px-6 pt-12 pb-2 flex justify-between items-center bg-background-light/90 dark:bg-background-dark/90 backdrop-blur-md sticky top-0 z-50 transition-all duration-300">
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleForceBack}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-text-muted-light dark:text-text-muted-dark hover:bg-gray-100 dark:hover:bg-surface-dark transition-colors"
                    >
                        <span className="material-symbols-outlined text-lg">arrow_back</span>
                    </button>
                    <h1 className="text-xl font-bold">专属计划生成中...</h1>
                </div>
                <div className="flex gap-3">
                    <div className="w-8 h-8 flex items-center justify-center">
                        <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                        </span>
                    </div>
                </div>
            </header>

            <main className="px-6 pt-6 pb-24 max-w-lg mx-auto">
                {/* 宠物信息卡 */}
                <div className="bg-white dark:bg-surface-dark p-5 rounded-2xl shadow-soft mb-8 flex items-center gap-4 border border-gray-100 dark:border-gray-800">
                    <div className="w-14 h-14 rounded-full p-1 border-2 border-primary/20 relative">
                        {currentPet?.avatar_url ? (
                            <img
                                alt={currentPet.name}
                                className="w-full h-full object-cover rounded-full"
                                src={currentPet.avatar_url}
                            />
                        ) : (
                            <div className="w-full h-full rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-lg">
                                {currentPet?.name?.charAt(0) || '🐾'}
                            </div>
                        )}
                        <div className="absolute bottom-0 right-0 w-4 h-4 bg-secondary rounded-full border-2 border-white dark:border-surface-dark flex items-center justify-center">
                            <span className="material-symbols-outlined text-[10px] text-yellow-900 font-bold">bolt</span>
                        </div>
                    </div>
                    <div>
                        <h2 className="font-bold text-lg">为 {currentPet?.name || '您的爱宠'} 规划中</h2>
                        <p className="text-xs text-text-muted-light dark:text-text-muted-dark">AI Agent 正在处理 48 项营养指标</p>
                    </div>
                </div>

                {/* 3D 翻页卡片区域 */}
                <div className="relative w-full mb-8" style={{ perspective: '1200px' }}>
                    <AnimatePresence mode="wait" initial={false}>
                        <motion.div
                            key={currentStepIndex}
                            initial={variants.initial}
                            animate={variants.animate}
                            exit={variants.exit}
                            style={{ transformStyle: 'preserve-3d' }}
                            className="w-full"
                        >
                            <div className="relative bg-white dark:bg-surface-dark p-6 rounded-2xl shadow-lg border border-secondary/30 z-30">
                                <div className="absolute top-0 right-0 w-20 h-20 bg-secondary/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>

                                {/* 标题行 */}
                                <div className="flex justify-between items-start mb-1">
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-primary text-xl">
                                            {phaseIcons[currentStepIndex] || 'science'}
                                        </span>
                                        <h3 className="font-bold text-xl text-text-main-light dark:text-text-main-dark">
                                            {steps[currentStepIndex].title}
                                        </h3>
                                    </div>
                                    <span className="bg-secondary/20 text-yellow-800 dark:text-yellow-200 text-xs font-bold px-2.5 py-1 rounded-full tracking-wide">
                                        进行中
                                    </span>
                                </div>

                                {/* 实时事件消息流 */}
                                <EventFeed logs={logs} maxVisible={3} />

                                {/* Phase 2: 周状态网格 */}
                                {currentStepIndex === 1 && (
                                    <WeekStatusGrid weekStatuses={weekStatuses} />
                                )}

                                {/* 阶段进度条（真实 progress 驱动） */}
                                <div className="mt-4 h-1.5 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                    <motion.div
                                        className="h-full bg-gradient-to-r from-secondary to-secondary/70 rounded-full"
                                        animate={{ width: `${Math.max(progress, 2)}%` }}
                                        transition={{ duration: 0.5, ease: 'easeOut' }}
                                    ></motion.div>
                                </div>
                                <div className="flex justify-between mt-1.5">
                                    <span className="text-[10px] text-text-muted-light dark:text-text-muted-dark">
                                        {steps[currentStepIndex].description}
                                    </span>
                                    <span className="text-[10px] font-semibold text-secondary">{Math.round(progress)}%</span>
                                </div>

                                {/* 底部旋转图标 */}
                                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-secondary text-yellow-900 flex items-center justify-center ring-4 ring-white dark:ring-background-dark z-40 transform translate-y-1/2">
                                    <span className="material-symbols-outlined text-2xl animate-spin-slow">sync</span>
                                </div>
                            </div>
                        </motion.div>
                    </AnimatePresence>

                    {/* Stack layers for depth effect */}
                    <div className="absolute top-0 left-0 w-full translate-y-3 scale-95 opacity-50 -z-10">
                        <div className="bg-white dark:bg-surface-dark rounded-2xl border border-gray-100 dark:border-gray-800 h-[13rem] shadow-sm"></div>
                    </div>
                    <div className="absolute top-0 left-0 w-full translate-y-6 scale-90 opacity-30 -z-20">
                        <div className="bg-white dark:bg-surface-dark rounded-2xl border border-gray-100 dark:border-gray-800 h-[13rem] shadow-sm"></div>
                    </div>
                </div>

                {/* 步骤检查列表 */}
                <div className="mt-12 p-6 bg-white dark:bg-surface-dark rounded-2xl shadow-soft border border-gray-100 dark:border-gray-800">
                    <h3 className="font-bold text-lg mb-4 text-text-main-light dark:text-text-main-dark flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-xl">checklist</span>
                        当前任务详情
                    </h3>
                    <ul className="space-y-3 text-text-main-light dark:text-text-main-dark">
                        {steps.map((step, idx) => (
                            <li key={idx} className="flex items-start gap-3">
                                <span className={`material-symbols-outlined text-sm mt-1 ${idx < currentStepIndex ? 'text-primary' :
                                    idx === currentStepIndex ? 'text-secondary animate-spin-slow' : 'text-gray-400 dark:text-gray-600'
                                    }`}>
                                    {idx < currentStepIndex ? 'check_circle' :
                                        idx === currentStepIndex ? 'radio_button_checked' : 'radio_button_unchecked'}
                                </span>
                                <p className={`text-sm ${idx === currentStepIndex ? 'font-semibold' : 'text-text-muted-light dark:text-text-muted-dark'}`}>
                                    {step.title}
                                </p>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="mt-8 text-center px-6 py-6 bg-primary/5 rounded-2xl border border-primary/10">
                    <span className="material-symbols-outlined text-primary mb-2 text-2xl">tips_and_updates</span>
                    <p className="text-xs text-text-muted-light dark:text-text-muted-dark leading-5">
                        <span className="font-bold text-primary block mb-1">你知道吗？</span>
                        科学的饮食计划可以帮助宠物延长平均 20% 的健康寿命。
                    </p>
                </div>
            </main>

            {/* 底部导航栏 */}
            <nav className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-surface-dark/90 backdrop-blur-lg border-t border-gray-100 dark:border-gray-800 pb-safe pt-2 px-6 pb-6 rounded-t-3xl shadow-[0_-5px_20px_rgba(0,0,0,0.03)] z-50">
                <div className="flex justify-between items-center">
                    <button
                        onClick={() => navigate('/')}
                        className="flex flex-col items-center gap-1 w-12 text-text-muted-light dark:text-text-muted-dark hover:text-primary transition-colors"
                    >
                        <span className="material-symbols-outlined">home</span>
                    </button>
                    <button
                        onClick={() => navigate('/calendar')}
                        className="flex flex-col items-center gap-1 w-12 text-text-muted-light dark:text-text-muted-dark hover:text-primary transition-colors"
                    >
                        <span className="material-symbols-outlined">calendar_today</span>
                    </button>
                    <button className="relative -top-6 bg-primary text-white dark:text-gray-900 w-14 h-14 rounded-full shadow-glow flex items-center justify-center transform transition-transform hover:scale-105 active:scale-95">
                        <span className="material-symbols-outlined text-2xl">menu_book</span>
                    </button>
                    <button
                        onClick={() => navigate('/recipes')}
                        className="flex flex-col items-center gap-1 w-12 text-text-muted-light dark:text-text-muted-dark hover:text-primary transition-colors"
                    >
                        <span className="material-symbols-outlined">pie_chart</span>
                    </button>
                    <button
                        onClick={() => navigate('/profile')}
                        className="flex flex-col items-center gap-1 w-12 text-text-muted-light dark:text-text-muted-dark hover:text-primary transition-colors"
                    >
                        <span className="material-symbols-outlined">person</span>
                    </button>
                </div>
            </nav>
        </div>
    );
}
