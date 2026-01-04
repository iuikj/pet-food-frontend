import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { pageTransitions } from '../utils/animations';

export default function PlanSummary() {
    const [activeDay, setActiveDay] = useState(1);

    return (
        <motion.div
            {...pageTransitions}
            className="pb-28"
        >
            <header className="px-6 pt-12 pb-4 flex justify-between items-center bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md sticky top-0 z-50">
                <div className="flex items-center gap-3">
                    <Link to="/" className="w-10 h-10 rounded-full flex items-center justify-center text-text-muted-light dark:text-text-muted-dark hover:bg-gray-100 dark:hover:bg-surface-dark transition-colors">
                        <span className="material-icons-round">arrow_back</span>
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold">Cooper 的专属计划</h1>
                        <p className="text-xs text-text-muted-light dark:text-text-muted-dark">第 1 周 • 减重 & 关节养护</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button className="w-10 h-10 rounded-full flex items-center justify-center text-text-main-light dark:text-text-main-dark bg-white dark:bg-surface-dark shadow-sm hover:text-primary transition-colors">
                        <span className="material-icons-round">share</span>
                    </button>
                </div>
            </header>

            <main className="px-6 space-y-6">
                <section className="relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-accent-blue/10 rounded-3xl blur-xl"></div>
                    <div className="relative bg-white dark:bg-surface-dark p-5 rounded-3xl shadow-medium border border-primary/20 hover:shadow-large transition-all duration-300">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary shrink-0 relative">
                                <span className="material-icons-round text-2xl animate-pulse">smart_toy</span>
                                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-surface-dark flex items-center justify-center">
                                    <span className="material-icons-round text-[10px] text-white">check</span>
                                </div>
                            </div>
                            <div className="flex-1">
                                <h2 className="text-base font-bold text-text-main-light dark:text-text-main-dark mb-1">
                                    Agent 已为您生成专属计划
                                </h2>
                                <p className="text-sm text-text-muted-light dark:text-text-muted-dark leading-relaxed">
                                    基于 Cooper 的<span className="text-primary font-medium">鸡肉过敏</span>史和<span className="text-primary font-medium">减重目标</span>，我已经优化了蛋白质来源，并添加了关节保护成分。
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                <section>
                    <div className="flex justify-between items-end mb-4">
                        <h3 className="font-bold text-lg">每日营养目标</h3>
                        <Link to="/plan/details" className="text-xs text-primary font-medium flex items-center gap-1">
                            查看详情 <span className="material-icons-round text-sm">chevron_right</span>
                        </Link>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-surface-light dark:bg-surface-dark p-5 rounded-[2rem] shadow-soft relative overflow-hidden group hover:shadow-medium hover:-translate-y-1 transition-all duration-300">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-secondary/10 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
                            <div className="relative z-10">
                                <div className="flex items-center gap-2 mb-3 text-secondary-600 dark:text-secondary-400">
                                    <span className="material-icons-round text-xl text-yellow-500">local_fire_department</span>
                                    <span className="text-xs font-bold uppercase tracking-wider text-text-muted-light">热量</span>
                                </div>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-3xl font-bold font-display">850</span>
                                    <span className="text-sm text-text-muted-light font-medium">kcal</span>
                                </div>
                                <div className="mt-3 w-full bg-gray-100 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                                    <div className="bg-yellow-400 h-full rounded-full" style={{ width: '85%' }}></div>
                                </div>
                            </div>
                        </div>
                        <div className="bg-surface-light dark:bg-surface-dark p-5 rounded-[2rem] shadow-soft relative overflow-hidden group hover:shadow-medium hover:-translate-y-1 transition-all duration-300">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-accent-blue/10 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
                            <div className="relative z-10">
                                <div className="flex items-center gap-2 mb-3 text-blue-500">
                                    <span className="material-icons-round text-xl">water_drop</span>
                                    <span className="text-xs font-bold uppercase tracking-wider text-text-muted-light">饮水量</span>
                                </div>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-3xl font-bold font-display">400</span>
                                    <span className="text-sm text-text-muted-light font-medium">ml</span>
                                </div>
                                <div className="mt-3 w-full bg-gray-100 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                                    <div className="bg-blue-300 h-full rounded-full" style={{ width: '60%' }}></div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3 mt-3">
                        <div className="bg-white dark:bg-surface-dark p-3 rounded-2xl shadow-sm text-center border border-gray-100 dark:border-gray-800">
                            <p className="text-xs text-text-muted-light mb-1">蛋白质</p>
                            <p className="font-bold text-primary">High</p>
                        </div>
                        <div className="bg-white dark:bg-surface-dark p-3 rounded-2xl shadow-sm text-center border border-gray-100 dark:border-gray-800">
                            <p className="text-xs text-text-muted-light mb-1">脂肪</p>
                            <p className="font-bold text-yellow-500">Low</p>
                        </div>
                        <div className="bg-white dark:bg-surface-dark p-3 rounded-2xl shadow-sm text-center border border-gray-100 dark:border-gray-800">
                            <p className="text-xs text-text-muted-light mb-1">碳水</p>
                            <p className="font-bold text-blue-400">Med</p>
                        </div>
                    </div>
                </section>

                <section>
                    <div className="flex gap-4 mb-5 overflow-x-auto no-scrollbar pb-1">
                        {[1, 2, 3, 4].map((day) => (
                            <button
                                key={day}
                                onClick={() => setActiveDay(day)}
                                className={`px-5 py-2.5 rounded-xl text-sm font-bold shadow-glow whitespace-nowrap transition-colors ${activeDay === day
                                    ? 'bg-primary text-white'
                                    : 'bg-white dark:bg-surface-dark text-text-muted-light border border-gray-100 dark:border-gray-700'
                                    }`}
                            >
                                Day {day}
                            </button>
                        ))}
                    </div>

                    <div className="relative space-y-6">
                        <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-gray-200 dark:bg-gray-700 -z-10"></div>

                        {/* Meal Items (Static for Demo) */}
                        <div className="flex gap-4 group">
                            <div className="w-10 h-10 rounded-full bg-secondary text-yellow-900 flex items-center justify-center shadow-sm shrink-0 z-10 ring-4 ring-background-light dark:ring-background-dark">
                                <span className="material-icons-round text-lg">wb_sunny</span>
                            </div>
                            <div className="flex-1 bg-white dark:bg-surface-dark rounded-2xl p-4 shadow-soft border border-gray-100 dark:border-gray-800 hover:border-secondary/50 hover:shadow-medium transition-all duration-300">
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-bold text-base">清蒸深海鳕鱼配南瓜</h4>
                                    <span className="text-xs font-semibold bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-lg">8:00 AM</span>
                                </div>
                                <div className="flex flex-wrap gap-2 mb-3">
                                    <span className="text-xs px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 rounded-md">鳕鱼 80g</span>
                                    <span className="text-xs px-2 py-1 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-300 rounded-md">南瓜 30g</span>
                                    <span className="text-xs px-2 py-1 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-300 rounded-md">西兰花 10g</span>
                                </div>
                                <div className="flex items-start gap-2 text-xs text-text-muted-light dark:text-text-muted-dark bg-background-light dark:bg-background-dark p-3 rounded-xl">
                                    <span className="material-icons-round text-sm mt-0.5 text-primary">tips_and_updates</span>
                                    <p>鳕鱼富含 Omega-3，有助于改善 Cooper 的皮肤状况。南瓜提供膳食纤维，帮助消化。</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4 group">
                            <div className="w-10 h-10 rounded-full bg-white dark:bg-surface-dark text-text-muted-light border border-gray-200 dark:border-gray-600 flex items-center justify-center shadow-sm shrink-0 z-10 ring-4 ring-background-light dark:ring-background-dark">
                                <span className="material-icons-round text-lg">restaurant</span>
                            </div>
                            <div className="flex-1 bg-white dark:bg-surface-dark rounded-2xl p-4 shadow-soft border border-gray-100 dark:border-gray-800 hover:border-primary/50 hover:shadow-medium transition-all duration-300">
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-bold text-base">火鸡肉胡萝卜泥</h4>
                                    <span className="text-xs font-semibold bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-lg">1:00 PM</span>
                                </div>
                                <div className="flex flex-wrap gap-2 mb-3">
                                    <span className="text-xs px-2 py-1 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 rounded-md">火鸡肉 90g</span>
                                    <span className="text-xs px-2 py-1 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-300 rounded-md">胡萝卜 20g</span>
                                </div>
                                <p className="text-xs text-text-muted-light dark:text-text-muted-dark leading-relaxed">
                                    <span className="font-bold text-primary">烹饪建议:</span> 蒸煮火鸡肉至全熟，将胡萝卜切碎混合，避免添加任何调味料。
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4 group">
                            <div className="w-10 h-10 rounded-full bg-slate-700 text-white flex items-center justify-center shadow-sm shrink-0 z-10 ring-4 ring-background-light dark:ring-background-dark">
                                <span className="material-icons-round text-lg">dark_mode</span>
                            </div>
                            <div className="flex-1 bg-white dark:bg-surface-dark rounded-2xl p-4 shadow-soft border border-gray-100 dark:border-gray-800 hover:border-slate-400 hover:shadow-medium transition-all duration-300">
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-bold text-base">牛肉青豆拌饭</h4>
                                    <span className="text-xs font-semibold bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-lg">7:00 PM</span>
                                </div>
                                <div className="flex flex-wrap gap-2 mb-3">
                                    <span className="text-xs px-2 py-1 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 rounded-md">瘦牛肉 100g</span>
                                    <span className="text-xs px-2 py-1 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-300 rounded-md">青豆 15g</span>
                                    <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-md">糙米 20g</span>
                                </div>
                                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                                    <span className="material-icons-round text-purple-500 text-lg">medication</span>
                                    <span className="text-xs font-medium text-text-main-light dark:text-text-main-dark">
                                        添加: 关节宝 (Glucosamine) 1粒
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="pb-6">
                    <div className="bg-primary/5 dark:bg-primary/10 rounded-3xl p-5 border border-primary/10 dark:border-primary/20 hover:shadow-soft transition-all duration-300">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="material-icons-round text-primary">verified</span>
                            <h3 className="font-bold text-text-main-light dark:text-text-main-dark">Agent 特别提示</h3>
                        </div>
                        <ul className="space-y-2 text-sm text-text-muted-light dark:text-text-muted-dark list-disc list-inside">
                            <li>本周专注于控制碳水化合物摄入，以启动减重过程。</li>
                            <li>观察 Cooper 是否有任何皮肤瘙痒反应（虽然已剔除常见过敏源）。</li>
                            <li>记得每天保持至少 30 分钟的低强度散步。</li>
                        </ul>
                    </div>
                </section>
            </main>
        </motion.div>
    );
}
