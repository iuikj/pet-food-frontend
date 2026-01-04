import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function PlanDetails() {
    const navigate = useNavigate();

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen bg-black/40 dark:bg-black/60 backdrop-blur-[2px] flex items-center justify-center px-5 py-safe relative z-[100]"
            onClick={() => navigate(-1)} // Click outside to close/go back
        >
            <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 50, opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="relative w-full max-w-sm bg-surface-light dark:bg-surface-dark rounded-3xl shadow-popup overflow-hidden flex flex-col max-h-[85vh]"
                onClick={(e) => e.stopPropagation()} // Prevent closing when clicking content
            >
                <div className="relative bg-gradient-to-br from-primary/20 to-accent-blue/10 dark:from-primary/10 dark:to-accent-blue/5 p-6 pb-8 shrink-0">
                    <button
                        onClick={() => navigate(-1)}
                        aria-label="关闭"
                        className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/50 dark:bg-black/20 text-text-muted-light hover:bg-white dark:hover:bg-surface-dark transition-all z-10"
                    >
                        <span className="material-icons-round text-lg">close</span>
                    </button>
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-white dark:bg-surface-dark shadow-sm flex items-center justify-center text-secondary-600 dark:text-secondary text-2xl shrink-0">
                            <span className="material-icons-round">wb_sunny</span>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-text-main-light dark:text-text-main-dark leading-tight">
                                清蒸深海鳕鱼配南瓜
                            </h2>
                            <div className="flex items-center gap-2 mt-1.5">
                                <span className="px-2 py-0.5 rounded-lg bg-white/60 dark:bg-white/10 text-xs font-semibold text-text-muted-light backdrop-blur-sm border border-white/20">
                                    <span className="material-icons-round align-middle text-[14px] mr-0.5">soup_kitchen</span>
                                    清蒸 Steaming
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto no-scrollbar p-6 -mt-4 bg-surface-light dark:bg-surface-dark rounded-t-[1.5rem] relative z-0 space-y-6">
                    <section>
                        <h3 className="flex items-center gap-2 text-xs font-bold text-text-muted-light uppercase tracking-wider mb-4">
                            <span className="material-icons-round text-sm">kitchen</span>
                            食材明细 & 推荐理由
                        </h3>
                        <div className="space-y-3">
                            <div className="group flex gap-3 p-3 rounded-2xl bg-background-light dark:bg-white/5 border border-transparent hover:border-primary/20 transition-colors">
                                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-500 flex items-center justify-center shrink-0 text-xl">
                                    🐟
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="font-bold text-sm truncate">深海鳕鱼</span>
                                        <span className="text-xs font-bold px-2 py-0.5 bg-white dark:bg-surface-dark rounded-md shadow-sm text-text-main-light dark:text-text-main-dark">80g</span>
                                    </div>
                                    <p className="text-[11px] leading-relaxed text-text-muted-light dark:text-text-muted-dark">
                                        <span className="text-primary font-bold">Why:</span> 富含 Omega-3，可有效缓解皮肤炎症，增强被毛光泽。
                                    </p>
                                </div>
                            </div>
                            <div className="group flex gap-3 p-3 rounded-2xl bg-background-light dark:bg-white/5 border border-transparent hover:border-secondary/20 transition-colors">
                                <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-900/20 text-orange-500 flex items-center justify-center shrink-0 text-xl">
                                    🎃
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="font-bold text-sm truncate">贝贝南瓜</span>
                                        <span className="text-xs font-bold px-2 py-0.5 bg-white dark:bg-surface-dark rounded-md shadow-sm text-text-main-light dark:text-text-main-dark">30g</span>
                                    </div>
                                    <p className="text-[11px] leading-relaxed text-text-muted-light dark:text-text-muted-dark">
                                        <span className="text-primary font-bold">Why:</span> 提供优质可溶性膳食纤维，温和促进肠道蠕动。
                                    </p>
                                </div>
                            </div>
                            <div className="group flex gap-3 p-3 rounded-2xl bg-background-light dark:bg-white/5 border border-transparent hover:border-green/20 transition-colors">
                                <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-900/20 text-green-500 flex items-center justify-center shrink-0 text-xl">
                                    🥦
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="font-bold text-sm truncate">西兰花碎</span>
                                        <span className="text-xs font-bold px-2 py-0.5 bg-white dark:bg-surface-dark rounded-md shadow-sm text-text-main-light dark:text-text-main-dark">10g</span>
                                    </div>
                                    <p className="text-[11px] leading-relaxed text-text-muted-light dark:text-text-muted-dark">
                                        <span className="text-primary font-bold">Why:</span> 补充维生素 C 及抗氧化物质，增强免疫力。
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h3 className="flex items-center gap-2 text-xs font-bold text-text-muted-light uppercase tracking-wider mb-4">
                            <span className="material-icons-round text-sm">pie_chart</span>
                            宏观营养 (Macronutrients)
                        </h3>
                        <div className="grid grid-cols-3 gap-3">
                            <div className="bg-surface-light dark:bg-surface-dark border border-gray-100 dark:border-gray-800 p-3 rounded-2xl text-center shadow-sm">
                                <div className="text-[10px] text-text-muted-light uppercase tracking-wide mb-1">蛋白质</div>
                                <div className="font-bold text-lg text-text-main-light dark:text-text-main-dark">28<span className="text-xs font-normal text-text-muted-light ml-0.5">g</span></div>
                                <div className="w-full bg-gray-100 dark:bg-gray-700 h-1.5 rounded-full mt-2 overflow-hidden">
                                    <div className="bg-primary h-full rounded-full w-[70%]"></div>
                                </div>
                            </div>
                            <div className="bg-surface-light dark:bg-surface-dark border border-gray-100 dark:border-gray-800 p-3 rounded-2xl text-center shadow-sm">
                                <div className="text-[10px] text-text-muted-light uppercase tracking-wide mb-1">脂肪</div>
                                <div className="font-bold text-lg text-text-main-light dark:text-text-main-dark">8<span className="text-xs font-normal text-text-muted-light ml-0.5">g</span></div>
                                <div className="w-full bg-gray-100 dark:bg-gray-700 h-1.5 rounded-full mt-2 overflow-hidden">
                                    <div className="bg-secondary h-full rounded-full w-[30%]"></div>
                                </div>
                            </div>
                            <div className="bg-surface-light dark:bg-surface-dark border border-gray-100 dark:border-gray-800 p-3 rounded-2xl text-center shadow-sm">
                                <div className="text-[10px] text-text-muted-light uppercase tracking-wide mb-1">碳水</div>
                                <div className="font-bold text-lg text-text-main-light dark:text-text-main-dark">12<span className="text-xs font-normal text-text-muted-light ml-0.5">g</span></div>
                                <div className="w-full bg-gray-100 dark:bg-gray-700 h-1.5 rounded-full mt-2 overflow-hidden">
                                    <div className="bg-accent-blue h-full rounded-full w-[40%]"></div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="pb-2">
                        <h3 className="flex items-center gap-2 text-xs font-bold text-text-muted-light uppercase tracking-wider mb-4">
                            <span className="material-icons-round text-sm">science</span>
                            微量元素亮点
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            <span className="inline-flex items-center px-3 py-1.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 text-xs font-medium text-text-muted-light">
                                <span className="w-1.5 h-1.5 rounded-full bg-orange-400 mr-2"></span>维生素 A
                            </span>
                            <span className="inline-flex items-center px-3 py-1.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 text-xs font-medium text-text-muted-light">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mr-2"></span>钙 Calcium
                            </span>
                            <span className="inline-flex items-center px-3 py-1.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 text-xs font-medium text-text-muted-light">
                                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 mr-2"></span>硒 Selenium
                            </span>
                            <span className="inline-flex items-center px-3 py-1.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 text-xs font-medium text-text-muted-light">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-400 mr-2"></span>铁 Iron
                            </span>
                        </div>
                    </section>
                </div>
            </motion.div>
        </motion.div>
    );
}
