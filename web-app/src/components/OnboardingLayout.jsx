import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import StepIndicator from './StepIndicator';

/**
 * 统一的 Onboarding 布局组件
 * 包含固定的顶部导航和进度指示器，子内容区域可切换
 */
export default function OnboardingLayout({
    children,
    currentStep = 1,
    totalSteps = 3,
    backLink = '/',
    title = '添加宠物',
    onNext,
    nextDisabled = false,
    nextLabel = '下一步',
    showNextButton = true,
    isSubmitting = false
}) {
    const location = useLocation();

    return (
        <div className="flex flex-col h-screen bg-background-light dark:bg-background-dark overflow-hidden">
            {/* 固定顶部区域 */}
            <header className="flex-shrink-0 px-6 pt-12 pb-4 flex items-center justify-between bg-background-light/90 dark:bg-background-dark/90 backdrop-blur-md z-50">
                <Link
                    to={backLink}
                    className="w-10 h-10 rounded-full bg-white dark:bg-surface-dark shadow-sm flex items-center justify-center text-text-muted-light dark:text-text-muted-dark hover:text-primary transition-colors"
                >
                    <span className="material-icons-round">arrow_back</span>
                </Link>
                <h1 className="text-xl font-bold text-center flex-1 text-text-main-light dark:text-text-main-dark">
                    {title}
                </h1>
                <div className="w-10 h-10 flex items-center justify-center">
                    <span className="text-xs font-bold text-primary">{currentStep}/{totalSteps}</span>
                </div>
            </header>

            {/* 固定进度指示器 */}
            <div className="flex-shrink-0 px-6 py-4">
                <StepIndicator currentStep={currentStep} totalSteps={totalSteps} showLabels={false} />
            </div>

            {/* 可滚动内容区域 - 防止水平滚动 */}
            <main className="flex-1 overflow-y-auto overflow-x-hidden px-6">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={location.pathname}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                        className="w-full max-w-lg mx-auto pb-32"
                    >
                        {children}
                    </motion.div>
                </AnimatePresence>
            </main>

            {/* 固定底部按钮 */}
            {showNextButton && (
                <div className="flex-shrink-0 px-6 pb-6 pt-4 bg-background-light dark:bg-background-dark border-t border-gray-100 dark:border-gray-800 safe-area-bottom">
                    <button
                        onClick={onNext}
                        disabled={nextDisabled || isSubmitting}
                        className="w-full bg-primary hover:bg-green-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-lg py-4 rounded-2xl shadow-glow transform transition-all active:scale-[0.98] flex items-center justify-center gap-2 group"
                    >
                        {isSubmitting ? (
                            <>
                                <span className="material-icons-round animate-spin">refresh</span>
                                处理中...
                            </>
                        ) : (
                            <>
                                {nextLabel}
                                <span className="material-icons-round group-hover:translate-x-1 transition-transform">
                                    {currentStep === totalSteps ? 'check' : 'arrow_forward'}
                                </span>
                            </>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
}
