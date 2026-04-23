import React from 'react';
import { motion } from 'framer-motion';
import IngredientIcon from './IngredientIcon';

/**
 * 食材卡片
 *
 * 展示：统一图标、名称、分类、关键营养（热量/蛋白/脂肪/碳水）、系统/自定义徽章
 * 支持点击（详情）+ 编辑/删除（仅 is_system=false 显示）
 */
export default function IngredientCard({ ingredient, onClick, onEdit, onDelete }) {
    const isCustom = !ingredient.is_system;

    // 关键营养格式化
    const fmt = (v, unit = '') => {
        if (v == null) return '—';
        const num = Number(v);
        if (!Number.isFinite(num)) return '—';
        return `${num.toFixed(num >= 10 ? 0 : 1)}${unit}`;
    };

    const handleEditClick = (e) => {
        e.stopPropagation();
        onEdit?.(ingredient);
    };

    const handleDeleteClick = (e) => {
        e.stopPropagation();
        onDelete?.(ingredient);
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white dark:bg-surface-dark rounded-2xl p-4 shadow-soft border border-gray-100 dark:border-gray-800 hover:shadow-medium active:scale-[0.99] transition-all"
            onClick={() => onClick?.(ingredient)}
            role="button"
        >
            {/* 头部：图标 + 名称 + 徽章 */}
            <div className="flex items-start gap-3 mb-2">
                <IngredientIcon
                    ingredient={ingredient}
                    size={44}
                    bgClassName={isCustom ? 'bg-primary/10 dark:bg-primary/15' : 'bg-gray-100 dark:bg-gray-800'}
                    className="shrink-0"
                />
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                        <h4 className="font-bold text-base text-text-main-light dark:text-text-main-dark truncate">
                            {ingredient.name}
                        </h4>
                        <span
                            className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                isCustom
                                    ? 'bg-primary/15 text-primary'
                                    : 'bg-gray-100 dark:bg-gray-800 text-text-muted-light dark:text-text-muted-dark'
                            }`}
                        >
                            {isCustom ? '自定义' : '系统'}
                        </span>
                    </div>
                    <p className="text-xs text-text-muted-light dark:text-text-muted-dark mt-0.5 truncate">
                        {ingredient.category} · {ingredient.sub_category}
                        {ingredient.note ? ` · ${ingredient.note}` : ''}
                    </p>
                </div>
            </div>

            {/* 营养 4 项 */}
            <div className="grid grid-cols-4 gap-2 mt-3">
                <NutrientCell label="热量" value={fmt(ingredient.calories, 'kcal')} />
                <NutrientCell label="蛋白" value={fmt(ingredient.protein, 'g')} />
                <NutrientCell label="脂肪" value={fmt(ingredient.fat, 'g')} />
                <NutrientCell label="碳水" value={fmt(ingredient.carbohydrates, 'g')} />
            </div>

            {/* 底部操作（仅自定义食材显示） */}
            {isCustom && (
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                    <button
                        onClick={handleEditClick}
                        className="flex-1 py-1.5 rounded-lg bg-gray-50 dark:bg-gray-800 text-text-muted-light dark:text-text-muted-dark text-xs font-semibold hover:bg-gray-100 dark:hover:bg-gray-700 active:scale-[0.98] transition-all flex items-center justify-center gap-1"
                    >
                        <span className="material-icons-round text-sm">edit</span>
                        编辑
                    </button>
                    <button
                        onClick={handleDeleteClick}
                        className="flex-1 py-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-500 text-xs font-semibold hover:bg-red-100 dark:hover:bg-red-900/30 active:scale-[0.98] transition-all flex items-center justify-center gap-1"
                    >
                        <span className="material-icons-round text-sm">delete_outline</span>
                        删除
                    </button>
                </div>
            )}
        </motion.div>
    );
}

function NutrientCell({ label, value }) {
    return (
        <div className="text-center">
            <p className="text-[10px] text-text-muted-light dark:text-text-muted-dark uppercase tracking-wider">
                {label}
            </p>
            <p className="text-xs font-bold text-text-main-light dark:text-text-main-dark mt-0.5">
                {value}
            </p>
        </div>
    );
}
