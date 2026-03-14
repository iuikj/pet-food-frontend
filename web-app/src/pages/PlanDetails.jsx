import React from 'react';
import { motion } from 'framer-motion';
import { extractMicronutrients } from '../models/dietPlan';

// 微量元素颜色映射
const MICRO_COLORS = {
    '维生素A': 'bg-orange-400',
    '维生素C': 'bg-yellow-400',
    '维生素D': 'bg-amber-400',
    '钙': 'bg-blue-400',
    '铁': 'bg-red-400',
    '钠': 'bg-teal-400',
    '钾': 'bg-green-400',
    '胆固醇': 'bg-pink-400',
};

// 食材 emoji 猜测
function getFoodEmoji(name) {
    const map = {
        '鱼': '🐟', '鳕鱼': '🐟', '三文鱼': '🐟', '鲑鱼': '🐟',
        '鸡': '🍗', '鸡肉': '🍗', '鸡胸': '🍗', '火鸡': '🦃',
        '牛': '🥩', '牛肉': '🥩', '牛腱': '🥩',
        '鸭': '🦆', '鸭肉': '🦆', '羊': '🍖', '羊肉': '🍖',
        '南瓜': '🎃', '胡萝卜': '🥕', '西兰花': '🥦', '菠菜': '🥬',
        '红薯': '🍠', '土豆': '🥔', '豌豆': '🫘', '青豆': '🫘',
        '燕麦': '🌾', '糙米': '🍚', '小米': '🌾', '米': '🍚',
        '蛋': '🥚', '鸡蛋': '🥚', '西葫芦': '🥒',
    };
    for (const [key, emoji] of Object.entries(map)) {
        if (name.includes(key)) return emoji;
    }
    return '🥘';
}

// 餐食类型图标映射（按 meal.order）
function getMealIcon(order) {
    const map = {
        1: { icon: 'wb_sunny', color: 'text-secondary-600 dark:text-secondary' },
        2: { icon: 'restaurant', color: 'text-text-muted-light' },
        3: { icon: 'dark_mode', color: 'text-slate-600 dark:text-slate-300' },
        4: { icon: 'brunch_dining', color: 'text-primary' },
    };
    return map[order] || map[1];
}

// 食材标签背景颜色循环
const ITEM_BG_COLORS = [
    'bg-blue-50 dark:bg-blue-900/20 text-blue-500',
    'bg-orange-50 dark:bg-orange-900/20 text-orange-500',
    'bg-green-50 dark:bg-green-900/20 text-green-500',
    'bg-red-50 dark:bg-red-900/20 text-red-500',
    'bg-purple-50 dark:bg-purple-900/20 text-purple-500',
];

export default function PlanDetails({ meal, weekNumber, onClose }) {
    // 无数据 fallback
    if (!meal) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-[2px] flex items-center justify-center px-5 py-safe z-[100]"
                onClick={onClose}
            >
                <motion.div
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 50, opacity: 0 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className="relative w-full max-w-sm bg-surface-light dark:bg-surface-dark rounded-3xl shadow-popup p-8 text-center"
                    onClick={(e) => e.stopPropagation()}
                >
                    <span className="material-symbols-outlined text-4xl text-text-muted-light mb-4 block">info</span>
                    <h2 className="font-bold text-lg mb-2 text-text-main-light dark:text-text-main-dark">暂无餐食数据</h2>
                    <p className="text-sm text-text-muted-light dark:text-text-muted-dark mb-6">
                        请从计划概览页面选择一餐查看详情
                    </p>
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-primary text-white rounded-xl font-bold"
                    >
                        返回
                    </button>
                </motion.div>
            </motion.div>
        );
    }

    const { foodItems = [], cookMethod, time, totalCalories, totalProtein, totalFat, totalCarbs, totalFiber } = meal;

    // 标题：食材拼接
    const mealTitle = foodItems.length > 0
        ? foodItems.map(f => f.name).join(' + ')
        : `第 ${meal.order} 餐`;

    // 微量元素
    const micronutrients = extractMicronutrients(foodItems);

    // 宏量营养素进度条最大值（用于计算百分比）
    const maxMacro = Math.max(totalProtein || 0, totalFat || 0, totalCarbs || 0, 1);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-[2px] flex items-center justify-center px-5 py-safe z-[100]"
            onClick={onClose}
        >
            <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 50, opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="relative w-full max-w-sm bg-surface-light dark:bg-surface-dark rounded-3xl shadow-popup overflow-hidden flex flex-col max-h-[85vh]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* 头部 */}
                <div className="relative bg-gradient-to-br from-primary/20 to-accent-blue/10 dark:from-primary/10 dark:to-accent-blue/5 p-6 pb-8 shrink-0">
                    <button
                        onClick={onClose}
                        aria-label="关闭"
                        className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/50 dark:bg-black/20 text-text-muted-light hover:bg-white dark:hover:bg-surface-dark transition-all z-10"
                    >
                        <span className="material-symbols-outlined text-lg">close</span>
                    </button>
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-white dark:bg-surface-dark shadow-sm flex items-center justify-center shrink-0">
                            <span className={`material-symbols-outlined text-2xl ${getMealIcon(meal.order).color}`}>
                                {getMealIcon(meal.order).icon}
                            </span>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-text-main-light dark:text-text-main-dark leading-tight">
                                {mealTitle}
                            </h2>
                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                {cookMethod && (
                                    <span className="px-2 py-0.5 rounded-lg bg-white/60 dark:bg-white/10 text-xs font-semibold text-text-muted-light backdrop-blur-sm border border-white/20">
                                        <span className="material-symbols-outlined align-middle text-[14px] mr-0.5">soup_kitchen</span>
                                        {cookMethod}
                                    </span>
                                )}
                                {time && (
                                    <span className="px-2 py-0.5 rounded-lg bg-white/60 dark:bg-white/10 text-xs font-semibold text-text-muted-light backdrop-blur-sm border border-white/20">
                                        <span className="material-symbols-outlined align-middle text-[14px] mr-0.5">schedule</span>
                                        {time}
                                    </span>
                                )}
                                {weekNumber && (
                                    <span className="px-2 py-0.5 rounded-lg bg-primary/20 text-xs font-semibold text-primary">
                                        第 {weekNumber} 周
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 内容区域 */}
                <div className="flex-1 overflow-y-auto no-scrollbar p-6 -mt-4 bg-surface-light dark:bg-surface-dark rounded-t-[1.5rem] relative z-0 space-y-6">
                    {/* 食材明细 */}
                    <section>
                        <h3 className="flex items-center gap-2 text-xs font-bold text-text-muted-light uppercase tracking-wider mb-4">
                            <span className="material-symbols-outlined text-sm">kitchen</span>
                            食材明细 & 推荐理由
                        </h3>
                        <div className="space-y-3">
                            {foodItems.map((fi, i) => (
                                <div key={i} className="group flex gap-3 p-3 rounded-2xl bg-background-light dark:bg-white/5 border border-transparent hover:border-primary/20 transition-colors">
                                    <div className={`w-10 h-10 rounded-xl ${ITEM_BG_COLORS[i % ITEM_BG_COLORS.length]} flex items-center justify-center shrink-0 text-xl`}>
                                        {getFoodEmoji(fi.name)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="font-bold text-sm truncate">{fi.name}</span>
                                            <span className="text-xs font-bold px-2 py-0.5 bg-white dark:bg-surface-dark rounded-md shadow-sm text-text-main-light dark:text-text-main-dark">{fi.weight}g</span>
                                        </div>
                                        {fi.recommend_reason && (
                                            <p className="text-[11px] leading-relaxed text-text-muted-light dark:text-text-muted-dark">
                                                <span className="text-primary font-bold">Why:</span> {fi.recommend_reason}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* 宏量营养素 */}
                    <section>
                        <h3 className="flex items-center gap-2 text-xs font-bold text-text-muted-light uppercase tracking-wider mb-4">
                            <span className="material-symbols-outlined text-sm">pie_chart</span>
                            宏观营养 (Macronutrients)
                        </h3>
                        <div className="grid grid-cols-3 gap-3">
                            <div className="bg-surface-light dark:bg-surface-dark border border-gray-100 dark:border-gray-800 p-3 rounded-2xl text-center shadow-sm">
                                <div className="text-[10px] text-text-muted-light uppercase tracking-wide mb-1">蛋白质</div>
                                <div className="font-bold text-lg text-text-main-light dark:text-text-main-dark">
                                    {totalProtein || 0}<span className="text-xs font-normal text-text-muted-light ml-0.5">g</span>
                                </div>
                                <div className="w-full bg-gray-100 dark:bg-gray-700 h-1.5 rounded-full mt-2 overflow-hidden">
                                    <div className="bg-primary h-full rounded-full" style={{ width: `${Math.min((totalProtein / maxMacro) * 100, 100)}%` }}></div>
                                </div>
                            </div>
                            <div className="bg-surface-light dark:bg-surface-dark border border-gray-100 dark:border-gray-800 p-3 rounded-2xl text-center shadow-sm">
                                <div className="text-[10px] text-text-muted-light uppercase tracking-wide mb-1">脂肪</div>
                                <div className="font-bold text-lg text-text-main-light dark:text-text-main-dark">
                                    {totalFat || 0}<span className="text-xs font-normal text-text-muted-light ml-0.5">g</span>
                                </div>
                                <div className="w-full bg-gray-100 dark:bg-gray-700 h-1.5 rounded-full mt-2 overflow-hidden">
                                    <div className="bg-secondary h-full rounded-full" style={{ width: `${Math.min((totalFat / maxMacro) * 100, 100)}%` }}></div>
                                </div>
                            </div>
                            <div className="bg-surface-light dark:bg-surface-dark border border-gray-100 dark:border-gray-800 p-3 rounded-2xl text-center shadow-sm">
                                <div className="text-[10px] text-text-muted-light uppercase tracking-wide mb-1">碳水</div>
                                <div className="font-bold text-lg text-text-main-light dark:text-text-main-dark">
                                    {totalCarbs || 0}<span className="text-xs font-normal text-text-muted-light ml-0.5">g</span>
                                </div>
                                <div className="w-full bg-gray-100 dark:bg-gray-700 h-1.5 rounded-full mt-2 overflow-hidden">
                                    <div className="bg-accent-blue h-full rounded-full" style={{ width: `${Math.min((totalCarbs / maxMacro) * 100, 100)}%` }}></div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* 微量元素亮点 */}
                    {micronutrients.length > 0 && (
                        <section className="pb-2">
                            <h3 className="flex items-center gap-2 text-xs font-bold text-text-muted-light uppercase tracking-wider mb-4">
                                <span className="material-symbols-outlined text-sm">science</span>
                                微量元素亮点
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {micronutrients.map((m, i) => (
                                    <span key={i} className="inline-flex items-center px-3 py-1.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 text-xs font-medium text-text-muted-light">
                                        <span className={`w-1.5 h-1.5 rounded-full ${MICRO_COLORS[m.name] || 'bg-gray-400'} mr-2`}></span>
                                        {m.name} {m.value}{m.unit}
                                    </span>
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
}
