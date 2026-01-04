import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { pageTransitions } from '../utils/animations';

export default function DashboardWeekly() {
    return (
        <motion.div
            {...pageTransitions}
            className="pb-24"
        >
            <header className="px-6 pt-12 pb-4 flex justify-between items-center bg-background-light/90 dark:bg-background-dark/90 backdrop-blur-md sticky top-0 z-50">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Link to="/onboarding/step1" className="w-12 h-12 rounded-full bg-gray-100 dark:bg-surface-dark border-2 border-dashed border-primary/50 flex items-center justify-center text-primary shadow-sm hover:bg-primary hover:text-white transition-all">
                            <span className="material-icons-round">add</span>
                        </Link>
                    </div>
                    <div>
                        <p className="text-xs text-text-muted-light dark:text-text-muted-dark font-medium uppercase tracking-wider">
                            欢迎使用
                        </p>
                        <Link to="/onboarding/step1" className="text-xl font-bold flex items-center gap-1 hover:text-primary transition-colors">
                            添加宠物
                            <span className="material-icons-round text-primary text-sm">arrow_forward_ios</span>
                        </Link>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button className="w-10 h-10 rounded-full bg-white dark:bg-surface-dark shadow-sm flex items-center justify-center text-text-muted-light dark:text-text-muted-dark hover:text-primary transition-colors">
                        <span className="material-icons-round">search</span>
                    </button>
                    <button className="w-10 h-10 rounded-full bg-white dark:bg-surface-dark shadow-sm flex items-center justify-center text-text-muted-light dark:text-text-muted-dark hover:text-primary transition-colors relative">
                        <span className="material-icons-round">notifications_none</span>
                        <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-400 rounded-full"></span>
                    </button>
                </div>
            </header>

            <main className="px-6 space-y-8">
                <section>
                    <div className="flex justify-between items-end mb-4">
                        <div>
                            <h2 className="text-2xl font-bold">本周</h2>
                            <p className="text-sm text-text-muted-light dark:text-text-muted-dark">AI计划： <span className="text-primary font-semibold">待创建</span></p>
                        </div>
                        <button className="text-sm text-primary font-medium hover:opacity-80 transition-opacity">完整日历</button>
                    </div>
                    <div className="flex justify-between items-center bg-white dark:bg-surface-dark p-4 rounded-2xl shadow-soft">
                        <div className="flex flex-col items-center gap-1 opacity-40">
                            <span className="text-xs font-medium">一</span>
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm">18</div>
                        </div>
                        <div className="flex flex-col items-center gap-1 opacity-40">
                            <span className="text-xs font-medium">二</span>
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm">19</div>
                        </div>
                        <div className="flex flex-col items-center gap-1 transform scale-110">
                            <span className="text-xs font-bold text-primary">三</span>
                            <div className="w-10 h-10 rounded-full bg-primary text-white dark:text-gray-900 flex items-center justify-center text-base font-bold shadow-glow relative">
                                20
                                <div className="absolute -bottom-1.5 w-1 h-1 bg-current rounded-full"></div>
                            </div>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                            <span className="text-xs font-medium text-text-muted-light dark:text-text-muted-dark">四</span>
                            <div className="w-8 h-8 rounded-full bg-background-light dark:bg-background-dark flex items-center justify-center text-sm font-medium">21</div>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                            <span className="text-xs font-medium text-text-muted-light dark:text-text-muted-dark">五</span>
                            <div className="w-8 h-8 rounded-full bg-background-light dark:bg-background-dark flex items-center justify-center text-sm font-medium">22</div>
                        </div>
                    </div>
                </section>

                <section className="bg-primary/20 dark:bg-primary/10 rounded-3xl p-6 relative overflow-hidden">
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-secondary/30 rounded-full blur-2xl"></div>
                    <div className="relative z-10 flex flex-col items-center text-center py-4">
                        <div className="w-16 h-16 rounded-full bg-white/60 dark:bg-white/10 backdrop-blur-sm flex items-center justify-center mb-4 shadow-sm text-primary">
                            <span className="material-icons-round text-3xl">pets</span>
                        </div>
                        <h3 className="font-bold text-xl mb-2">创建您的第一个宠物档案</h3>
                        <p className="text-sm text-text-muted-light dark:text-text-muted-dark opacity-80 mb-6 max-w-[240px]">
                            添加您的爱宠信息，为它量身定制专属的科学营养计划。
                        </p>
                        <Link to="/onboarding/step1" className="bg-primary text-white dark:text-gray-900 font-bold py-3 px-8 rounded-xl shadow-lg hover:shadow-glow hover:-translate-y-0.5 transition-all flex items-center gap-2">
                            <span className="material-icons-round text-lg">add</span>
                            立即添加
                        </Link>
                    </div>
                </section>

                <section>
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        今日餐食
                    </h3>
                    <div className="bg-white dark:bg-surface-dark p-6 rounded-2xl shadow-soft border-2 border-dashed border-gray-200 dark:border-gray-700 flex flex-col items-center text-center gap-3 py-8">
                        <div className="w-12 h-12 rounded-full bg-secondary/30 flex items-center justify-center text-yellow-700 dark:text-yellow-200 mb-1">
                            <span className="material-icons-round text-2xl">restaurant_menu</span>
                        </div>
                        <h4 className="font-bold text-lg">开始智能饮食规划</h4>
                        <p className="text-sm text-text-muted-light dark:text-text-muted-dark px-4 mb-2">
                            还没有饮食计划？让AI助手帮您生成完美的每日食谱。
                        </p>
                        <Link to="/onboarding/step1" className="text-primary font-bold text-sm flex items-center gap-1 hover:underline group">
                            开启规划 <span className="material-icons-round text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
                        </Link>
                    </div>
                </section>

                <section className="grid grid-cols-2 gap-4">
                    <div className="bg-accent-blue/20 dark:bg-accent-blue/10 p-5 rounded-2xl flex flex-col justify-center items-center h-36 relative overflow-hidden text-center">
                        <span className="material-icons-round text-4xl text-accent-blue/70 mb-2">lock</span>
                        <h4 className="font-bold text-blue-900/60 dark:text-blue-100/60 mb-1">饮水量</h4>
                        <p className="text-xs text-blue-800/50 dark:text-blue-200/50 font-medium px-2">记录宠物数据以解锁更多功能</p>
                    </div>
                    <div className="bg-secondary/20 dark:bg-secondary/10 p-5 rounded-2xl flex flex-col justify-center items-center h-36 relative overflow-hidden text-center">
                        <span className="material-icons-round text-4xl text-secondary/70 mb-2">lock</span>
                        <h4 className="font-bold text-yellow-900/60 dark:text-yellow-100/60 mb-1">当前体重</h4>
                        <p className="text-xs text-yellow-800/50 dark:text-yellow-200/50 font-medium px-2">记录宠物数据以解锁更多功能</p>
                    </div>
                </section>
            </main>
        </motion.div>
    );
}
