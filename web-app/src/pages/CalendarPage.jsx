import React from 'react';
import { motion } from 'framer-motion';
import { pageTransitions } from '../utils/animations';
import { Link } from 'react-router-dom';

export default function CalendarPage() {
    return (
        <motion.div
            {...pageTransitions}
            className="min-h-screen flex items-center justify-center px-6 pb-32"
        >
            <div className="max-w-md w-full text-center space-y-8">
                {/* 图标 */}
                <div className="relative inline-block">
                    <div className="absolute inset-0 bg-secondary/20 rounded-full blur-2xl animate-pulse-slow"></div>
                    <div className="relative w-24 h-24 mx-auto bg-surface-light dark:bg-surface-dark rounded-3xl shadow-large flex items-center justify-center border border-secondary/20">
                        <span className="material-icons-round text-6xl text-secondary">calendar_month</span>
                    </div>
                </div>

                {/* 标题和描述 */}
                <div className="space-y-3">
                    <h1 className="text-3xl font-bold text-text-main-light dark:text-text-main-dark">
                        日历功能
                    </h1>
                    <p className="text-base text-text-muted-light dark:text-text-muted-dark leading-relaxed">
                        该功能正在开发中，敬请期待
                    </p>
                </div>

                {/* 功能预览 */}
                <div className="bg-white dark:bg-surface-dark rounded-3xl p-6 shadow-soft space-y-4">
                    <h3 className="text-sm font-bold text-text-muted-light dark:text-text-muted-dark uppercase tracking-wider">
                        即将推出
                    </h3>
                    <ul className="space-y-3 text-left">
                        {[
                            { icon: 'event', text: '查看每日饮食安排' },
                            { icon: 'schedule', text: '设置喂食提醒' },
                            { icon: 'insights', text: '追踪营养摄入趋势' },
                            { icon: 'edit_calendar', text: '自定义餐食计划' }
                        ].map((item, index) => (
                            <li key={index} className="flex items-center gap-3 text-sm text-text-main-light dark:text-text-main-dark">
                                <div className="w-8 h-8 rounded-lg bg-secondary/20 flex items-center justify-center flex-shrink-0">
                                    <span className="material-icons-round text-secondary text-sm">{item.icon}</span>
                                </div>
                                <span>{item.text}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* 返回按钮 */}
                <Link
                    to="/"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-background-light dark:bg-background-dark rounded-xl text-text-main-light dark:text-text-main-dark font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
                >
                    <span className="material-icons-round text-sm">arrow_back</span>
                    返回首页
                </Link>
            </div>
        </motion.div>
    );
}
