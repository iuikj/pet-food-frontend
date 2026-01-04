import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function OnboardingHealth() {
    return (
        <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="flex flex-col h-screen bg-background-light dark:bg-background-dark pb-safe"
        >
            <header className="px-6 pt-12 pb-4 flex items-center justify-between bg-background-light/90 dark:bg-background-dark/90 backdrop-blur-md sticky top-0 z-50">
                <Link to="/onboarding/step2" className="w-10 h-10 rounded-full bg-white dark:bg-surface-dark shadow-sm flex items-center justify-center text-text-muted-light dark:text-text-muted-dark hover:text-primary transition-colors">
                    <span className="material-icons-round">arrow_back</span>
                </Link>
                <h1 className="text-xl font-bold text-center flex-1">添加宠物</h1>
                <div className="w-10 h-10 flex items-center justify-center">
                    <span className="text-xs font-bold text-text-muted-light dark:text-text-muted-dark">3/3</span>
                </div>
            </header>

            <main className="px-6 pb-32 flex flex-col h-full overflow-y-auto">
                <div className="flex gap-2 mb-8 mt-2 px-2">
                    <div className="h-1.5 flex-1 bg-primary rounded-full"></div>
                    <div className="h-1.5 flex-1 bg-primary rounded-full"></div>
                    <div className="h-1.5 flex-1 bg-primary rounded-full"></div>
                </div>

                <div className="flex-1 flex flex-col items-center pt-2">
                    <div className="w-full max-w-sm space-y-8">
                        <div className="space-y-2 text-center mb-6">
                            <h2 className="text-2xl font-bold text-text-main-light dark:text-text-main-dark">健康信息</h2>
                            <p className="text-sm text-text-muted-light dark:text-text-muted-dark">Cooper 有什么过敏或需要注意的健康问题吗？</p>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between px-1">
                                <label className="text-sm font-semibold text-text-main-light dark:text-text-main-dark" htmlFor="allergens-input">过敏源</label>
                            </div>
                            <div className="relative bg-white dark:bg-surface-dark rounded-2xl p-4 shadow-soft">
                                <div className="flex flex-wrap gap-2 mb-2 items-center min-h-[40px]">
                                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-primary/20 text-green-900 dark:text-green-100 text-sm font-medium">
                                        谷物
                                        <button className="ml-1 -mr-1 h-4 w-4 rounded-full flex items-center justify-center text-green-700 dark:text-green-200 hover:bg-primary/30" type="button">
                                            <span className="material-icons-round text-xs">close</span>
                                        </button>
                                    </span>
                                    <input
                                        className="flex-1 min-w-[100px] border-none focus:ring-0 bg-transparent text-sm text-text-main-light dark:text-text-main-dark p-0"
                                        id="allergens-input" placeholder="输入或选择过敏源..." type="text"
                                    />
                                </div>
                            </div>
                            <div className="no-scrollbar flex overflow-x-auto gap-2 py-1 -mt-1">
                                {['无', '鸡肉', '牛肉', '乳制品', '海鲜/鱼', '羊肉'].map((item) => (
                                    <button key={item} className={`relative px-4 py-2 rounded-full shadow-soft text-sm font-semibold border border-transparent transition-all active:scale-95 whitespace-nowrap ${item === '无' ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300' : 'bg-white dark:bg-surface-dark text-text-main-light dark:text-text-main-dark hover:border-primary/50'}`}>
                                        {item}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between px-1">
                                <label className="text-sm font-semibold text-text-main-light dark:text-text-main-dark" htmlFor="health-issues-input">近期健康困扰</label>
                            </div>
                            <div className="relative bg-white dark:bg-surface-dark rounded-2xl p-4 shadow-soft">
                                <div className="flex flex-wrap gap-2 mb-2 items-center min-h-[40px]">
                                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-primary/20 text-green-900 dark:text-green-100 text-sm font-medium">
                                        <span className="material-icons-round text-sm mr-1">opacity</span>
                                        泪痕严重
                                        <button className="ml-1 -mr-1 h-4 w-4 rounded-full flex items-center justify-center text-green-700 dark:text-green-200 hover:bg-primary/30" type="button">
                                            <span className="material-icons-round text-xs">close</span>
                                        </button>
                                    </span>
                                    <input
                                        className="flex-1 min-w-[100px] border-none focus:ring-0 bg-transparent text-sm text-text-main-light dark:text-text-main-dark p-0"
                                        id="health-issues-input" placeholder="输入或选择困扰..." type="text"
                                    />
                                </div>
                            </div>
                            <div className="no-scrollbar flex overflow-x-auto gap-2 py-1 -mt-1">
                                <button className="flex items-center justify-center gap-1 px-4 py-2 rounded-full bg-gray-200 dark:bg-gray-700 shadow-soft text-sm font-semibold text-gray-700 dark:text-gray-300 border border-transparent transition-all active:scale-95 whitespace-nowrap">
                                    <span className="material-icons-round text-base">block</span>
                                    无
                                </button>
                                {[
                                    { icon: 'healing', text: '皮肤瘙痒' },
                                    { icon: 'monitor_weight', text: '体重超标' },
                                    { icon: 'sentiment_dissatisfied', text: '软便/拉稀' },
                                    { icon: 'restaurant', text: '挑食' }
                                ].map((item) => (
                                    <button key={item.text} className="flex items-center justify-center gap-1 px-4 py-2 rounded-full bg-white dark:bg-surface-dark shadow-soft text-sm font-semibold text-text-main-light dark:text-text-main-dark border border-transparent hover:border-primary/50 transition-all active:scale-95 whitespace-nowrap">
                                        <span className="material-icons-round text-base text-text-muted-light">{item.icon}</span>
                                        {item.text}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <div className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-surface-dark/90 backdrop-blur-lg border-t border-gray-100 dark:border-gray-800 p-6 z-50 rounded-t-3xl shadow-[0_-5px_20px_rgba(0,0,0,0.03)]">
                <Link to="/planning" className="w-full bg-primary hover:bg-green-400 text-white font-bold text-lg py-4 rounded-2xl shadow-glow transform transition-all active:scale-[0.98] flex items-center justify-center gap-2 group">
                    保存
                    <span className="material-icons-round group-hover:scale-110 transition-transform">check</span>
                </Link>
            </div>
        </motion.div>
    );
}
