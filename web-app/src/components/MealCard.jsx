import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * 餐食卡片数据结构
 * @typedef {Object} MealData
 * @property {string} id - 唯一标识
 * @property {'breakfast'|'lunch'|'dinner'} type - 餐食类型
 * @property {string} name - 餐食名称
 * @property {string} time - 用餐时间
 * @property {string} description - 简要描述
 * @property {number} calories - 卡路里
 * @property {boolean} isCompleted - 是否已完成
 * @property {Object} details - 详细信息
 * @property {Array<{name: string, amount: string, color: string}>} details.ingredients - 食材列表
 * @property {{fat: string, calories: string, protein?: string}} details.nutrition - 营养信息
 * @property {string} [details.aiTip] - AI提示
 */

// 餐食类型配置
const mealTypeConfig = {
    breakfast: {
        icon: 'wb_sunny',
        bgColor: 'bg-secondary/30',
        textColor: 'text-yellow-700 dark:text-yellow-200',
        label: '早餐'
    },
    lunch: {
        icon: 'restaurant',
        bgColor: 'bg-accent-blue',
        textColor: 'text-blue-800',
        label: '午餐'
    },
    dinner: {
        icon: 'nights_stay',
        bgColor: 'bg-purple-100 dark:bg-purple-900/30',
        textColor: 'text-purple-600 dark:text-purple-300',
        label: '晚餐'
    }
};

/**
 * 可展开的餐食卡片组件
 */
export default function MealCard({
    meal,
    isExpanded,
    onToggleExpand,
    onToggleComplete
}) {
    const config = mealTypeConfig[meal.type] || mealTypeConfig.lunch;

    // 处理卡片点击
    const handleCardClick = (e) => {
        // 如果点击的是完成按钮，不触发展开/折叠
        if (e.target.closest('[data-complete-btn]')) return;
        onToggleExpand(meal.id);
    };

    // 处理完成按钮点击
    const handleCompleteClick = (e) => {
        e.stopPropagation();
        onToggleComplete(meal.id);
    };

    return (
        <motion.div
            layout
            onClick={handleCardClick}
            className={`
                bg-white dark:bg-surface-dark rounded-2xl shadow-soft
                border-2 transition-all duration-300 cursor-pointer
                ${isExpanded
                    ? 'border-primary/40 shadow-medium bg-primary/5 dark:bg-primary/10'
                    : 'border-gray-100 dark:border-gray-800 hover:border-primary/20 hover:shadow-medium'
                }
                ${meal.isCompleted && !isExpanded ? 'opacity-60' : ''}
            `}
        >
            {/* 折叠状态 - 始终显示 */}
            <div className="p-5 flex items-center gap-4">
                {/* 餐食图标 */}
                <div className={`w-12 h-12 rounded-full ${config.bgColor} flex items-center justify-center flex-shrink-0 ${config.textColor}`}>
                    <span className="material-icons-round">{config.icon}</span>
                </div>

                {/* 餐食信息 */}
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                        <h4 className={`font-bold ${isExpanded ? 'text-lg text-primary' : 'text-sm'} truncate transition-all`}>
                            {meal.name}
                        </h4>
                        <span className={`text-xs font-bold shrink-0 px-2 py-1 rounded ${meal.isCompleted
                                ? 'bg-gray-100 dark:bg-gray-700 text-text-muted-light dark:text-text-muted-dark line-through'
                                : 'bg-primary/20 text-green-800 dark:text-green-200'
                            }`}>
                            {meal.time}
                        </span>
                    </div>
                    <p className={`text-xs text-text-muted-light dark:text-text-muted-dark mt-0.5 truncate ${isExpanded ? 'text-sm mt-1' : ''}`}>
                        {meal.description}
                    </p>

                    {/* 营养标签 - 仅在折叠时显示简略版 */}
                    {!isExpanded && (
                        <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs flex items-center gap-1 text-text-muted-light dark:text-text-muted-dark bg-background-light dark:bg-background-dark px-2 py-0.5 rounded-md">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                                {meal.calories} 大卡
                            </span>
                        </div>
                    )}
                </div>

                {/* 完成按钮 */}
                <button
                    data-complete-btn
                    onClick={handleCompleteClick}
                    className={`
                        w-10 h-10 rounded-full flex items-center justify-center shrink-0
                        transition-all duration-200 
                        ${meal.isCompleted
                            ? 'bg-primary text-white dark:text-gray-900 shadow-glow'
                            : 'border-2 border-gray-200 dark:border-gray-600 text-gray-400 hover:border-primary hover:text-primary hover:scale-110'
                        }
                    `}
                    title={meal.isCompleted ? '标记为未完成' : '标记为已完成'}
                >
                    <span className="material-icons-round text-lg">
                        {meal.isCompleted ? 'check' : 'check'}
                    </span>
                </button>
            </div>

            {/* 展开状态 - 详细内容 */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="overflow-hidden"
                    >
                        <div className="px-5 pb-5 pt-0 space-y-4">
                            {/* 分隔线 */}
                            <div className="border-t border-gray-100 dark:border-gray-700"></div>

                            {/* 营养信息标签 */}
                            {meal.details?.nutrition && (
                                <div className="flex items-center gap-3 flex-wrap">
                                    {meal.details.nutrition.fat && (
                                        <span className="text-xs flex items-center gap-1 text-text-muted-light dark:text-text-muted-dark bg-background-light dark:bg-background-dark px-2 py-1 rounded-md">
                                            <span className="w-1.5 h-1.5 rounded-full bg-yellow-400"></span>
                                            {meal.details.nutrition.fat}
                                        </span>
                                    )}
                                    <span className="text-xs flex items-center gap-1 text-text-muted-light dark:text-text-muted-dark bg-background-light dark:bg-background-dark px-2 py-1 rounded-md">
                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                                        {meal.calories} 大卡
                                    </span>
                                    {meal.details.nutrition.protein && (
                                        <span className="text-xs flex items-center gap-1 text-text-muted-light dark:text-text-muted-dark bg-background-light dark:bg-background-dark px-2 py-1 rounded-md">
                                            <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
                                            {meal.details.nutrition.protein}
                                        </span>
                                    )}
                                </div>
                            )}

                            {/* 食材列表 */}
                            {meal.details?.ingredients && meal.details.ingredients.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {meal.details.ingredients.map((ingredient, idx) => (
                                        <span
                                            key={idx}
                                            className={`text-xs px-2 py-1 rounded-md ${ingredient.color}`}
                                        >
                                            {ingredient.name} {ingredient.amount}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {/* AI 提示 */}
                            {meal.details?.aiTip && (
                                <div className="flex items-start gap-2 text-xs text-text-muted-light dark:text-text-muted-dark bg-background-light dark:bg-background-dark p-3 rounded-xl">
                                    <span className="material-icons-round text-sm mt-0.5 text-primary">tips_and_updates</span>
                                    <p>{meal.details.aiTip}</p>
                                </div>
                            )}

                            {/* 操作按钮 */}
                            <div className="flex justify-end gap-2 pt-2">
                                <button className="text-xs text-primary font-medium flex items-center gap-1 hover:underline">
                                    查看详情
                                    <span className="material-icons-round text-sm">chevron_right</span>
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
