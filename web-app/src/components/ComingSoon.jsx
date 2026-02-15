import React, { useState } from 'react';
import { motion } from 'framer-motion';

/**
 * Coming Soon 占位组件
 * @param {string} title - 标题
 * @param {string} description - 描述文字
 * @param {string} icon - Material Icon 名称
 * @param {string} accentColor - 主题色 (blue, purple, orange)
 * @param {Array<{icon: string, text: string}>} features - 即将推出的功能列表
 * @param {function} onNotifyToggle - 通知开关回调
 */
export default function ComingSoon({
    title = '敬请期待',
    description = '该功能正在开发中',
    icon = 'rocket_launch',
    accentColor = 'blue',
    features = [],
    onNotifyToggle,
}) {
    const [notifyEnabled, setNotifyEnabled] = useState(false);

    const handleToggle = () => {
        const newVal = !notifyEnabled;
        setNotifyEnabled(newVal);
        onNotifyToggle?.(newVal);
    };

    // 颜色配置
    const colors = {
        blue: {
            bg: 'bg-accent-blue/10',
            text: 'text-accent-blue',
            glow: 'bg-accent-blue/20',
            ring: 'ring-accent-blue/30',
            toggleBg: 'bg-accent-blue',
        },
        purple: {
            bg: 'bg-purple-500/10',
            text: 'text-purple-500',
            glow: 'bg-purple-500/20',
            ring: 'ring-purple-500/30',
            toggleBg: 'bg-purple-500',
        },
        orange: {
            bg: 'bg-orange-500/10',
            text: 'text-orange-500',
            glow: 'bg-orange-500/20',
            ring: 'ring-orange-500/30',
            toggleBg: 'bg-orange-500',
        },
    };

    const c = colors[accentColor] || colors.blue;

    return (
        <div className="relative max-w-md w-full mx-auto text-center space-y-8">
            {/* 模糊背景装饰 - 模拟图表 */}
            <div className="absolute inset-0 -z-10 overflow-hidden rounded-3xl">
                {/* 模拟折线图 */}
                <svg className="absolute top-1/4 left-0 w-full h-32 opacity-10" viewBox="0 0 400 100">
                    <path
                        d="M0,80 C50,60 80,90 120,50 C160,10 200,40 240,30 C280,20 320,60 360,40 L400,50"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        className={c.text}
                    />
                </svg>
                {/* 模拟柱状图 */}
                <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 flex gap-3 opacity-10">
                    {[60, 80, 45, 90, 70, 55].map((h, i) => (
                        <div
                            key={i}
                            className={`w-6 rounded-t-lg ${c.bg}`}
                            style={{ height: h }}
                        />
                    ))}
                </div>
                {/* 模糊叠加层 */}
                <div className="absolute inset-0 backdrop-blur-xl bg-background-light/80 dark:bg-background-dark/80" />
            </div>

            {/* 图标 */}
            <motion.div
                className="relative inline-block"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            >
                <div className={`absolute inset-0 ${c.glow} rounded-full blur-2xl animate-pulse`} />
                <div className={`relative w-24 h-24 mx-auto bg-surface-light dark:bg-surface-dark rounded-3xl shadow-large flex items-center justify-center border ${c.ring} ring-1`}>
                    <span className={`material-icons-round text-6xl ${c.text}`}>{icon}</span>
                </div>
            </motion.div>

            {/* 标题和描述 */}
            <motion.div
                className="space-y-3"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
            >
                <h1 className="text-3xl font-bold text-text-main-light dark:text-text-main-dark">
                    {title}
                </h1>
                <p className="text-base text-text-muted-light dark:text-text-muted-dark leading-relaxed">
                    {description}
                </p>
            </motion.div>

            {/* 功能预览 */}
            {features.length > 0 && (
                <motion.div
                    className="bg-white dark:bg-surface-dark rounded-3xl p-6 shadow-soft space-y-4"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    <h3 className="text-sm font-bold text-text-muted-light dark:text-text-muted-dark uppercase tracking-wider">
                        即将推出
                    </h3>
                    <ul className="space-y-3 text-left">
                        {features.map((item, index) => (
                            <motion.li
                                key={index}
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.3 + index * 0.1 }}
                                className="flex items-center gap-3 text-sm text-text-main-light dark:text-text-main-dark"
                            >
                                <div className={`w-8 h-8 rounded-lg ${c.bg} flex items-center justify-center flex-shrink-0`}>
                                    <span className={`material-icons-round ${c.text} text-sm`}>{item.icon}</span>
                                </div>
                                <span>{item.text}</span>
                            </motion.li>
                        ))}
                    </ul>
                </motion.div>
            )}

            {/* 开启提醒开关 */}
            {onNotifyToggle && (
                <motion.div
                    className="bg-white dark:bg-surface-dark rounded-2xl p-5 shadow-soft"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center`}>
                                <span className={`material-icons-round ${c.text}`}>notifications</span>
                            </div>
                            <div className="text-left">
                                <p className="font-semibold text-text-main-light dark:text-text-main-dark">
                                    功能上线通知
                                </p>
                                <p className="text-xs text-text-muted-light dark:text-text-muted-dark">
                                    第一时间获取更新提醒
                                </p>
                            </div>
                        </div>

                        {/* 自定义开关 */}
                        <button
                            onClick={handleToggle}
                            className={`relative w-14 h-8 rounded-full transition-colors duration-300 ${notifyEnabled ? c.toggleBg : 'bg-gray-200 dark:bg-gray-700'
                                }`}
                        >
                            <motion.div
                                className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-md"
                                animate={{ x: notifyEnabled ? 28 : 4 }}
                                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                            />
                        </button>
                    </div>
                </motion.div>
            )}
        </div>
    );
}
