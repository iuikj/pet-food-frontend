import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * 增强型标签选择器组件
 * @param {Array<string|{icon?: string, text: string, value?: string}>} options - 标签选项
 * @param {Array<string>} selected - 已选中的值数组
 * @param {function} onChange - 选中状态变化回调
 * @param {boolean} multiple - 是否支持多选
 * @param {string} clearLabel - 清除选项的标签文字 (如 "无")
 * @param {function} onClear - 清除回调
 */
export default function EnhancedTagSelect({
    options = [],
    selected = [],
    onChange,
    multiple = true,
    clearLabel = '无',
    onClear,
}) {
    const handleSelect = (value) => {
        if (multiple) {
            if (selected.includes(value)) {
                onChange?.(selected.filter(v => v !== value));
            } else {
                onChange?.([...selected, value]);
            }
        } else {
            onChange?.(selected.includes(value) ? [] : [value]);
        }
    };

    const normalizeOption = (opt) => {
        if (typeof opt === 'string') {
            return { text: opt, value: opt };
        }
        return { ...opt, value: opt.value || opt.text };
    };

    // Spring动画配置
    const springConfig = {
        type: 'spring',
        stiffness: 400,
        damping: 17,
    };

    return (
        <div className="no-scrollbar flex overflow-x-auto gap-2 py-1">
            {/* 清除按钮 */}
            {onClear && (
                <motion.button
                    whileTap={{ scale: 0.92 }}
                    transition={springConfig}
                    onClick={onClear}
                    className="flex items-center justify-center gap-1 px-4 py-2.5 rounded-full bg-gray-100 dark:bg-gray-700 shadow-soft text-sm font-semibold text-gray-600 dark:text-gray-300 border border-transparent transition-colors active:bg-gray-200 dark:active:bg-gray-600 whitespace-nowrap"
                >
                    <span className="material-icons-round text-base">block</span>
                    {clearLabel}
                </motion.button>
            )}

            {/* 选项标签 */}
            {options.map((opt) => {
                const { icon, text, value } = normalizeOption(opt);
                const isSelected = selected.includes(value);

                return (
                    <motion.button
                        key={value}
                        whileTap={{ scale: 0.92 }}
                        animate={isSelected ? { scale: [1, 1.05, 1] } : { scale: 1 }}
                        transition={springConfig}
                        onClick={() => handleSelect(value)}
                        className={`relative flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full shadow-soft text-sm font-semibold border transition-all whitespace-nowrap ${isSelected
                            ? 'bg-primary text-white border-primary shadow-glow'
                            : 'bg-white dark:bg-surface-dark text-text-main-light dark:text-text-main-dark border-transparent hover:border-primary/50'
                            }`}
                    >
                        {/* 图标 */}
                        {icon && (
                            <span className={`material-icons-round text-base transition-colors ${isSelected ? 'text-white' : 'text-text-muted-light'
                                }`}>
                                {icon}
                            </span>
                        )}

                        {/* 文字 */}
                        {text}

                        {/* 选中勾选图标 */}
                        <AnimatePresence>
                            {isSelected && (
                                <motion.span
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0, opacity: 0 }}
                                    transition={springConfig}
                                    className="material-icons-round text-sm ml-0.5"
                                >
                                    check
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </motion.button>
                );
            })}
        </div>
    );
}
