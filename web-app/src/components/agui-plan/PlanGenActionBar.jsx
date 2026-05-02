/**
 * 任务面板底部操作栏。
 * 状态:
 *   - 未启动:启动按钮(主调用,大按钮)
 *   - 运行中:取消按钮 + 后台运行提示
 *   - 已完成 / 错误:重试 / 返回按钮
 */
export default function PlanGenActionBar({
    isRunning,
    hasStarted,
    error,
    onStart,
    onCancel,
    onReset,
    onBack,
    canStart = true,
}) {
    return (
        <nav className="fixed bottom-0 left-0 right-0 z-30 px-4 pb-safe pt-3 bg-white/95 dark:bg-surface-dark/95 backdrop-blur-md border-t border-gray-100 dark:border-gray-800">
            <div className="max-w-2xl mx-auto pb-4">
                {!hasStarted && !error && (
                    <button
                        type="button"
                        onClick={onStart}
                        disabled={!canStart}
                        className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-primary to-primary/80 text-white dark:text-gray-900 font-bold text-sm shadow-glow active:scale-[0.98] transition-transform disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        <span className="material-icons-round">auto_awesome</span>
                        启动 AI 生成
                    </button>
                )}

                {hasStarted && isRunning && !error && (
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="flex-1 py-3 rounded-2xl bg-red-50 dark:bg-red-900/20 text-red-600 font-bold text-sm border border-red-200 dark:border-red-900/40 active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
                        >
                            <span className="material-icons-round text-base">stop_circle</span>
                            停止生成
                        </button>
                    </div>
                )}

                {error && (
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={onBack}
                            className="flex-1 py-3 rounded-2xl bg-gray-100 dark:bg-gray-800 text-text-main-light dark:text-text-main-dark font-bold text-sm active:scale-[0.98] transition-transform"
                        >
                            返回
                        </button>
                        <button
                            type="button"
                            onClick={onReset}
                            className="flex-1 py-3 rounded-2xl bg-primary text-white font-bold text-sm active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
                        >
                            <span className="material-icons-round text-base">refresh</span>
                            重试
                        </button>
                    </div>
                )}

                {hasStarted && !isRunning && !error && (
                    <p className="text-center text-xs text-text-muted-light py-2">
                        正在前往结果页...
                    </p>
                )}
            </div>
        </nav>
    );
}
