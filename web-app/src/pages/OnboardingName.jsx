import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function OnboardingName() {
    return (
        <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="flex flex-col h-screen bg-background-light dark:bg-background-dark pb-safe"
        >
            <header className="px-6 pt-12 pb-4 flex items-center justify-between bg-background-light/90 dark:bg-background-dark/90 backdrop-blur-md sticky top-0 z-50">
                <Link to="/" className="w-10 h-10 rounded-full bg-white dark:bg-surface-dark shadow-sm flex items-center justify-center text-text-muted-light dark:text-text-muted-dark hover:text-primary transition-colors">
                    <span className="material-icons-round">arrow_back</span>
                </Link>
                <h1 className="text-xl font-bold text-center flex-1">添加宠物</h1>
                <div className="w-10 h-10 flex items-center justify-center">
                    <span className="text-xs font-bold text-text-muted-light dark:text-text-muted-dark">1/3</span>
                </div>
            </header>

            <main className="px-6 pb-32 flex flex-col h-full overflow-y-auto">
                <div className="flex gap-2 mb-8 mt-2 px-2">
                    <div className="h-1.5 flex-1 bg-primary rounded-full"></div>
                    <div className="h-1.5 flex-1 bg-gray-200 dark:bg-surface-dark rounded-full"></div>
                    <div className="h-1.5 flex-1 bg-gray-200 dark:bg-surface-dark rounded-full"></div>
                </div>

                <div className="flex-1 flex flex-col items-center pt-8">
                    <div className="w-full max-w-sm space-y-8">
                        <div className="space-y-2 text-center">
                            <h2 className="text-2xl font-bold text-text-main-light dark:text-text-main-dark">它的名字是？</h2>
                        </div>

                        <div className="relative group">
                            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <div className="relative w-32 h-32 mx-auto bg-gray-100 dark:bg-surface-dark rounded-full flex items-center justify-center border-4 border-white dark:border-surface-light/5 shadow-soft cursor-pointer overflow-hidden hover:scale-105 transition-transform">
                                <span className="material-icons-round text-4xl text-text-muted-light">add_a_photo</span>
                                <img alt="Pet Preview" className="absolute inset-0 w-full h-full object-cover opacity-0 hover:opacity-100 transition-opacity" src="https://images.unsplash.com/photo-1552053831-71594a27632d?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80" />
                            </div>
                            <p className="text-xs text-center mt-3 text-text-muted-light">点击上传照片</p>
                        </div>

                        <div className="space-y-4">
                            <div className="relative bg-surface-light dark:bg-surface-dark rounded-2xl shadow-soft transition-all focus-within:ring-2 focus-within:ring-primary/50 focus-within:shadow-glow">
                                <input
                                    className="w-full bg-transparent border-none py-4 px-5 text-xl font-bold text-center text-text-main-light dark:text-text-main-dark focus:ring-0 placeholder-gray-300 dark:placeholder-gray-600 rounded-2xl"
                                    placeholder="输入名字" type="text"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <div className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-surface-dark/90 backdrop-blur-lg border-t border-gray-100 dark:border-gray-800 p-6 z-50 rounded-t-3xl shadow-[0_-5px_20px_rgba(0,0,0,0.03)]">
                <Link to="/onboarding/step2" className="w-full bg-primary hover:bg-green-400 text-white font-bold text-lg py-4 rounded-2xl shadow-glow transform transition-all active:scale-[0.98] flex items-center justify-center gap-2 group">
                    下一步
                    <span className="material-icons-round group-hover:translate-x-1 transition-transform">arrow_forward</span>
                </Link>
            </div>
        </motion.div>
    );
}
