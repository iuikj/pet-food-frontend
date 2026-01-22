import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const menuVariants = {
    hidden: {
        opacity: 0,
        scale: 0.9,
        y: -10
    },
    visible: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: {
            duration: 0.15,
            ease: 'easeOut'
        }
    },
    exit: {
        opacity: 0,
        scale: 0.95,
        y: -5,
        transition: {
            duration: 0.1
        }
    }
};

/**
 * 可复用的下拉菜单组件
 * @param {boolean} isOpen - 是否打开
 * @param {function} onClose - 关闭回调
 * @param {Array} items - 菜单项 [{icon, label, onClick, danger}]
 * @param {string} position - 位置 'left' | 'right'
 */
export default function DropdownMenu({ isOpen, onClose, items = [], position = 'right' }) {
    const menuRef = useRef(null);

    // 点击外部关闭
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('touchstart', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, [isOpen, onClose]);

    // ESC 关闭
    useEffect(() => {
        const handleEscape = (event) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isOpen, onClose]);

    const positionClass = position === 'left' ? 'left-0' : 'right-0';

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    ref={menuRef}
                    variants={menuVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className={`absolute top-full mt-1 ${positionClass} z-50 min-w-[160px] bg-white dark:bg-surface-dark rounded-xl shadow-large border border-gray-100 dark:border-gray-800 py-1.5 overflow-hidden`}
                >
                    {items.map((item, index) => (
                        <button
                            key={index}
                            onClick={() => {
                                item.onClick?.();
                                onClose();
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${item.danger
                                    ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
                                    : 'text-text-main-light dark:text-text-main-dark hover:bg-gray-50 dark:hover:bg-gray-800'
                                }`}
                        >
                            {item.icon && (
                                <span className={`material-icons-round text-lg ${item.danger ? 'text-red-500' : 'text-text-muted-light dark:text-text-muted-dark'}`}>
                                    {item.icon}
                                </span>
                            )}
                            <span className="text-sm font-medium">{item.label}</span>
                        </button>
                    ))}
                </motion.div>
            )}
        </AnimatePresence>
    );
}
