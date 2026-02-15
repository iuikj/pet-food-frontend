import React from 'react';
import { motion } from 'framer-motion';

/**
 * 多步进度指示器组件
 * @param {number} currentStep - 当前步骤 (1-indexed)
 * @param {number} totalSteps - 总步骤数
 * @param {Array<string>} labels - 可选的步骤标签数组
 * @param {boolean} showLabels - 是否显示步骤标签
 */
export default function StepIndicator({
    currentStep = 1,
    totalSteps = 3,
    labels = ['名字/头像', '基本信息', '健康状态'],
    showLabels = true
}) {
    return (
        <div className="w-full">
            {/* 进度条 */}
            <div className="flex gap-2 px-2">
                {Array.from({ length: totalSteps }, (_, i) => {
                    const stepNum = i + 1;
                    const isCompleted = stepNum < currentStep;
                    const isCurrent = stepNum === currentStep;

                    return (
                        <div
                            key={stepNum}
                            className="relative h-1.5 flex-1 bg-gray-200 dark:bg-surface-dark rounded-full overflow-hidden"
                        >
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{
                                    width: isCompleted || isCurrent ? '100%' : '0%'
                                }}
                                transition={{
                                    type: 'spring',
                                    stiffness: 150,
                                    damping: 20,
                                    delay: i * 0.1
                                }}
                                className="absolute inset-y-0 left-0 bg-primary rounded-full"
                            />
                        </div>
                    );
                })}
            </div>

            {/* 步骤标签 */}
            {showLabels && labels.length > 0 && (
                <div className="flex justify-between mt-3 px-1">
                    {labels.map((label, i) => {
                        const stepNum = i + 1;
                        const isCompleted = stepNum < currentStep;
                        const isCurrent = stepNum === currentStep;

                        return (
                            <motion.div
                                key={stepNum}
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${isCurrent
                                        ? 'text-primary'
                                        : isCompleted
                                            ? 'text-primary/60'
                                            : 'text-text-muted-light dark:text-text-muted-dark'
                                    }`}
                            >
                                {/* 步骤圆点/勾选 */}
                                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold transition-all ${isCompleted
                                        ? 'bg-primary text-white'
                                        : isCurrent
                                            ? 'bg-primary/20 text-primary ring-2 ring-primary/50'
                                            : 'bg-gray-100 dark:bg-gray-700 text-text-muted-light dark:text-text-muted-dark'
                                    }`}>
                                    {isCompleted ? (
                                        <motion.span
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            className="material-icons-round text-xs"
                                        >
                                            check
                                        </motion.span>
                                    ) : (
                                        stepNum
                                    )}
                                </div>
                                <span className="hidden sm:inline">{label}</span>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
