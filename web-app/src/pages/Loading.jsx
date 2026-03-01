import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { usePlanGeneration } from '../context/PlanGenerationContext';
import { usePets } from '../context/PetContext';

export default function Loading() {
    const navigate = useNavigate();
    const {
        status,
        progress,
        currentStepIndex,
        steps,
        startGeneration,
        resetGeneration,
        isBackgroundRunning
    } = usePlanGeneration();
    const { currentPet, setPetHasPlan } = usePets();
    const hasStartedRef = useRef(false);
    const hasCompletedRef = useRef(false);

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
            // 标记当前宠物已有食谱
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

                {/* 后台运行提示卡片 */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-r from-primary/10 to-secondary/10 p-4 rounded-2xl mb-6 border border-primary/20"
                >
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                            <span className="material-symbols-outlined text-primary text-lg">
                                {isBackgroundRunning ? 'cloud_sync' : 'notifications_active'}
                            </span>
                        </div>
                        <div className="flex-1">
                            <h4 className="font-semibold text-sm text-text-main-light dark:text-text-main-dark mb-1">
                                {isBackgroundRunning ? '后台运行中' : '支持后台运行'}
                            </h4>
                            <p className="text-xs text-text-muted-light dark:text-text-muted-dark leading-relaxed">
                                {isBackgroundRunning
                                    ? '任务正在后台继续运行，完成后会通过通知提醒您。'
                                    : '您可以退出此页面或最小化应用，任务将在后台继续运行，完成后会通过通知提醒您。'
                                }
                            </p>
                        </div>
                    </div>
                </motion.div>

                <div className="relative w-full mb-8 h-56">
                    {/* Carousel Container */}
                    <AnimatePresence mode="popLayout" initial={false}>
                        <motion.div
                            key={currentStepIndex}
                            initial={{ y: 50, scale: 0.9, opacity: 0, zIndex: 0 }}
                            animate={{ y: 0, scale: 1, opacity: 1, zIndex: 10 }}
                            exit={{ y: -50, scale: 0.95, opacity: 0, zIndex: 0 }}
                            transition={{ duration: 0.5, ease: "easeInOut" }}
                            className="absolute top-0 left-0 w-full"
                        >
                            <div className="relative bg-white dark:bg-surface-dark p-6 rounded-2xl shadow-lg border border-secondary/30 z-30 mb-0 min-h-[13rem]">
                                <div className="absolute top-0 right-0 w-20 h-20 bg-secondary/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-bold text-2xl text-text-main-light dark:text-text-main-dark">
                                        {steps[currentStepIndex].title}
                                    </h3>
                                    <span className="bg-secondary/20 text-yellow-800 dark:text-yellow-200 text-sm font-bold px-3 py-1 rounded-full uppercase tracking-wide">进行中</span>
                                </div>
                                <p className="text-base text-text-muted-light dark:text-text-muted-dark leading-relaxed mt-4">
                                    {steps[currentStepIndex].description}
                                </p>
                                <div className="mt-6 h-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                    <motion.div
                                        className="h-full bg-secondary rounded-full"
                                        initial={{ width: "0%" }}
                                        animate={{ width: "100%" }}
                                        transition={{ duration: 5, ease: "linear" }}
                                    ></motion.div>
                                </div>
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

            {/* 底部导航栏 - 允许用户切换到其他页面 */}
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
                        onClick={() => navigate('/analysis')}
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
