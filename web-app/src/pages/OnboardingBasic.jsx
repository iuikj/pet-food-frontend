import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function OnboardingBasic() {
    return (
        <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="flex flex-col h-screen bg-background-light dark:bg-background-dark pb-safe"
        >
            <header className="px-6 pt-12 pb-4 flex items-center justify-between bg-background-light/90 dark:bg-background-dark/90 backdrop-blur-md sticky top-0 z-50">
                <Link to="/onboarding/step1" className="w-10 h-10 rounded-full bg-white dark:bg-surface-dark shadow-sm flex items-center justify-center text-text-muted-light dark:text-text-muted-dark hover:text-primary transition-colors">
                    <span className="material-icons-round">arrow_back</span>
                </Link>
                <h1 className="text-xl font-bold text-center flex-1">添加宠物</h1>
                <div className="w-10 h-10 flex items-center justify-center">
                    <span className="text-xs font-bold text-text-muted-light dark:text-text-muted-dark">2/3</span>
                </div>
            </header>

            <main className="px-6 pb-32 flex flex-col h-full overflow-y-auto">
                <div className="flex gap-2 mb-8 mt-2 px-2">
                    <div className="h-1.5 flex-1 bg-primary rounded-full"></div>
                    <div className="h-1.5 flex-1 bg-primary rounded-full"></div>
                    <div className="h-1.5 flex-1 bg-gray-200 dark:bg-surface-dark rounded-full"></div>
                </div>

                <div className="flex-1 flex flex-col items-center pt-2">
                    <div className="w-full max-w-sm space-y-6">
                        <div className="space-y-2 text-center mb-6">
                            <h2 className="text-2xl font-bold text-text-main-light dark:text-text-main-dark">基本信息</h2>
                            <p className="text-sm text-text-muted-light dark:text-text-muted-dark">帮助我们为 Cooper 计算每日热量需求</p>
                        </div>

                        <div className="bg-surface-light dark:bg-surface-dark rounded-2xl p-6 shadow-soft">
                            <label className="text-sm font-semibold text-text-main-light dark:text-text-main-dark ml-1 mb-4 block">物种</label>
                            <div className="grid grid-cols-3 gap-4">
                                <button className="relative bg-primary/10 ring-2 ring-primary rounded-[1.25rem] p-4 flex flex-col items-center justify-center gap-2 transition-all h-32 shadow-sm group">
                                    <div className="w-12 h-12 flex items-center justify-center text-primary">
                                        <span className="material-icons-round text-4xl fill-1">sound_detection_dog_barking</span>
                                    </div>
                                    <span className="font-bold text-primary dark:text-primary text-sm">狗狗</span>
                                    <div className="absolute top-2 right-2 text-primary">
                                        <span className="material-icons-round text-lg">check_circle</span>
                                    </div>
                                </button>
                                <button className="bg-gray-50 dark:bg-surface-dark border-2 border-transparent rounded-[1.25rem] p-4 flex flex-col items-center justify-center gap-2 shadow-sm hover:bg-gray-100 dark:hover:bg-surface-light/5 transition-all h-32 group">
                                    <div className="w-12 h-12 flex items-center justify-center text-text-muted-light group-hover:text-primary transition-colors">
                                        <span className="material-icons-round text-4xl fill-1 transform rotate-12">pets</span>
                                    </div>
                                    <span className="font-medium text-text-muted-light dark:text-text-muted-dark text-sm group-hover:text-text-main-light">猫咪</span>
                                </button>
                                <button className="bg-gray-50 dark:bg-surface-dark border-2 border-transparent rounded-[1.25rem] p-4 flex flex-col items-center justify-center gap-2 shadow-sm hover:bg-gray-100 dark:hover:bg-surface-light/5 transition-all h-32 group">
                                    <div className="w-12 h-12 flex items-center justify-center text-text-muted-light group-hover:text-primary transition-colors">
                                        <span className="material-icons-round text-4xl font-bold">question_mark</span>
                                    </div>
                                    <span className="font-medium text-text-muted-light dark:text-text-muted-dark text-sm group-hover:text-text-main-light">其他物种</span>
                                </button>
                            </div>
                        </div>

                        <div className="bg-surface-light dark:bg-surface-dark rounded-2xl p-6 shadow-soft">
                            <label className="text-sm font-semibold text-text-main-light dark:text-text-main-dark ml-1 mb-4 block">品种</label>
                            <div className="relative bg-background-light dark:bg-surface-dark rounded-2xl shadow-inner transition-all focus-within:ring-2 focus-within:ring-primary/50 focus-within:shadow-glow">
                                <input
                                    className="w-full bg-transparent border-none py-4 pl-5 pr-12 text-base font-medium text-text-main-light dark:text-text-main-dark focus:ring-0 placeholder-gray-300 dark:placeholder-gray-600 rounded-2xl"
                                    placeholder="输入品种" type="text" defaultValue="金毛寻回犬"
                                />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted-light">
                                    <span className="material-icons-round text-xl opacity-70">edit</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-surface-light dark:bg-surface-dark rounded-2xl p-6 shadow-soft">
                            <div className="grid grid-cols-2 gap-5">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-text-main-light dark:text-text-main-dark ml-1">年龄</label>
                                    <div className="bg-background-light dark:bg-surface-dark rounded-2xl shadow-inner flex items-center px-5 py-4 focus-within:ring-2 focus-within:ring-primary/50 focus-within:shadow-glow transition-all">
                                        <input
                                            className="w-full bg-transparent border-none p-0 text-xl font-bold text-text-main-light dark:text-text-main-dark focus:ring-0 placeholder-gray-300 dark:placeholder-gray-600"
                                            placeholder="0" type="number" defaultValue="3"
                                        />
                                        <span className="text-sm font-bold text-text-muted-light ml-1">岁</span>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-text-main-light dark:text-text-main-dark ml-1">体重</label>
                                    <div className="bg-background-light dark:bg-surface-dark rounded-2xl shadow-inner flex items-center px-5 py-4 focus-within:ring-2 focus-within:ring-primary/50 focus-within:shadow-glow transition-all">
                                        <input
                                            className="w-full bg-transparent border-none p-0 text-xl font-bold text-text-main-light dark:text-text-main-dark focus:ring-0 placeholder-gray-300 dark:placeholder-gray-600"
                                            placeholder="0.0" type="number"
                                        />
                                        <span className="text-sm font-bold text-text-muted-light ml-1">KG</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <div className="px-6 pb-6 bg-background-light dark:bg-background-dark">
                <Link to="/onboarding/step3" className="w-full bg-primary hover:bg-green-400 text-white font-bold text-lg py-4 rounded-2xl shadow-glow transform transition-all active:scale-[0.98] flex items-center justify-center gap-2 group">
                    下一步
                    <span className="material-icons-round group-hover:translate-x-1 transition-transform">arrow_forward</span>
                </Link>
            </div>
        </motion.div>
    );
}
