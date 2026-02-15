import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * 自定义模态弹窗组件
 * 替代浏览器原生 window.confirm，符合"健康、圆角、绿色系"的宠物主题
 * 
 * @param {boolean} isOpen - 控制弹窗显示
 * @param {function} onClose - 关闭弹窗回调
 * @param {function} onConfirm - 确认按钮回调
 * @param {string} title - 弹窗标题
 * @param {string} message - 弹窗内容
 * @param {string} confirmText - 确认按钮文字，默认"确认"
 * @param {string} cancelText - 取消按钮文字，默认"取消"
 * @param {string} type - 弹窗类型: 'confirm' | 'danger' | 'success'
 */
export default function Modal({
    isOpen,
    onClose,
    onConfirm,
    title = '提示',
    message = '',
    confirmText = '确认',
    cancelText = '取消',
    type = 'confirm',
    children
}) {
    // 根据类型设置颜色
    const getTypeStyles = () => {
        switch (type) {
            case 'danger':
                return {
                    icon: 'warning',
                    iconBg: 'bg-red-100 dark:bg-red-900/30',
                    iconColor: 'text-red-500',
                    confirmBg: 'bg-red-500 hover:bg-red-600 active:bg-red-700',
                    confirmText: 'text-white'
                };
            case 'success':
                return {
                    icon: 'check_circle',
                    iconBg: 'bg-green-100 dark:bg-green-900/30',
                    iconColor: 'text-primary',
                    confirmBg: 'bg-primary hover:bg-green-400 active:bg-green-500',
                    confirmText: 'text-white dark:text-gray-900'
                };
            default:
                return {
                    icon: 'help_outline',
                    iconBg: 'bg-primary/20',
                    iconColor: 'text-primary',
                    confirmBg: 'bg-primary hover:bg-green-400 active:bg-green-500',
                    confirmText: 'text-white dark:text-gray-900'
                };
        }
    };

    const styles = getTypeStyles();

    const handleConfirm = () => {
        if (onConfirm) {
            onConfirm();
        }
        onClose();
    };

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4"
                    onClick={handleBackdropClick}
                >
                    {/* 背景遮罩 */}
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

                    {/* 弹窗内容 */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{
                            type: 'spring',
                            damping: 25,
                            stiffness: 300
                        }}
                        className="relative w-full max-w-sm bg-white dark:bg-surface-dark rounded-3xl shadow-xl overflow-hidden"
                    >
                        {/* 装饰背景 */}
                        <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
                        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-secondary/20 rounded-full blur-2xl pointer-events-none" />

                        <div className="relative p-6">
                            {/* 图标 */}
                            <div className="flex justify-center mb-4">
                                <div className={`w-16 h-16 rounded-full ${styles.iconBg} flex items-center justify-center`}>
                                    <span className={`material-icons-round text-3xl ${styles.iconColor}`}>
                                        {styles.icon}
                                    </span>
                                </div>
                            </div>

                            {/* 标题 */}
                            <h3 className="text-xl font-bold text-center mb-2">
                                {title}
                            </h3>

                            {/* 内容 */}
                            {message && (
                                <p className="text-center text-text-muted-light dark:text-text-muted-dark mb-6">
                                    {message}
                                </p>
                            )}

                            {/* 自定义内容 */}
                            {children && (
                                <div className="mb-6">
                                    {children}
                                </div>
                            )}

                            {/* 按钮组 */}
                            <div className="flex gap-3">
                                <button
                                    onClick={onClose}
                                    className="flex-1 py-3 px-4 rounded-xl bg-gray-100 dark:bg-gray-800 text-text-main-light dark:text-text-main-dark font-bold transition-all duration-150 active:scale-[0.97] active:bg-gray-200 dark:active:bg-gray-700"
                                >
                                    {cancelText}
                                </button>
                                <button
                                    onClick={handleConfirm}
                                    className={`flex-1 py-3 px-4 rounded-xl ${styles.confirmBg} ${styles.confirmText} font-bold transition-all duration-150 active:scale-[0.97] shadow-lg`}
                                >
                                    {confirmText}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
