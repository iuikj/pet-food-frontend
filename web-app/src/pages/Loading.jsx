import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function Loading() {
    const navigate = useNavigate();

    useEffect(() => {
        // Simulate loading time then redirect to plan summary
        const timer = setTimeout(() => {
            navigate('/plan/summary');
        }, 4000);
        return () => clearTimeout(timer);
    }, [navigate]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col justify-center items-center relative overflow-hidden min-h-screen bg-background-light dark:bg-background-dark"
        >
            <div className="absolute inset-0 z-0">
                <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/20 rounded-full mix-blend-multiply filter blur-3xl animate-pulse-slow"></div>
                <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-secondary/20 rounded-full mix-blend-multiply filter blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
                <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-64 h-64 bg-accent-blue/20 rounded-full mix-blend-multiply filter blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
            </div>

            <div className="relative z-10 text-center p-8 w-full max-w-md">
                <div className="mb-12 relative inline-block">
                    <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse"></div>
                    <div className="w-24 h-24 bg-surface-light dark:bg-surface-dark rounded-3xl shadow-soft flex items-center justify-center relative z-10 border border-primary/20">
                        <span className="material-icons-round text-5xl text-primary animate-spin-slow">smart_toy</span>
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-secondary rounded-full flex items-center justify-center text-yellow-900 shadow-sm animate-bounce">
                        <span className="material-icons-round text-sm">pets</span>
                    </div>
                    <div className="absolute -bottom-2 -left-2 w-8 h-8 bg-accent-blue rounded-full flex items-center justify-center text-blue-900 shadow-sm animate-bounce" style={{ animationDelay: '0.5s' }}>
                        <span className="material-icons-round text-sm">restaurant</span>
                    </div>
                </div>

                <div className="space-y-4 mb-12">
                    <h1 className="text-xl font-bold">专属计划生成中...</h1>
                    <p className="text-xs text-text-muted-light dark:text-text-muted-dark">AI Agent 正在处理 48 项营养指标</p>
                </div>

                <div className="space-y-6 w-full px-4">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="flex items-center gap-4"
                    >
                        <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400 shrink-0">
                            <span className="material-icons-round text-lg">check</span>
                        </div>
                        <div className="flex-1 text-left">
                            <h3 className="text-sm font-bold">分析 Cooper 的过敏史...</h3>
                            <p className="text-[10px] text-text-muted-light">已排除：鸡肉、小麦、玉米</p>
                        </div>
                        <span className="material-icons-round text-green-500 text-lg">done_all</span>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 }}
                        className="flex items-center gap-4"
                    >
                        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0 relative">
                            <span className="material-icons-round text-lg animate-spin">sync</span>
                        </div>
                        <div className="flex-1 text-left">
                            <h3 className="text-sm font-bold">计算每日最佳热量...</h3>
                            <p className="text-[10px] text-text-muted-light">目标：减重 / 关节保护</p>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 0.5, y: 0 }}
                        transition={{ delay: 1.4 }}
                        className="flex items-center gap-4 opacity-50"
                    >
                        <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-surface-dark flex items-center justify-center text-gray-400 shrink-0">
                            <span className="material-icons-round text-lg">schedule</span>
                        </div>
                        <div className="flex-1 text-left">
                            <h3 className="text-sm font-bold">生成本周食谱...</h3>
                            <p className="text-[10px] text-text-muted-light">等待前序步骤完成</p>
                        </div>
                    </motion.div>
                </div>
            </div>
        </motion.div>
    );
}
