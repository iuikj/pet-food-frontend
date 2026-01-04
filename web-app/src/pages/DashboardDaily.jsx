import React from 'react';
import { motion } from 'framer-motion';
import { pageTransitions } from '../utils/animations';

export default function DashboardDaily() {
    return (
        <motion.div
            {...pageTransitions}
            className="pb-24"
        >
            <header className="px-6 pt-12 pb-4 flex justify-between items-center bg-background-light/90 dark:bg-background-dark/90 backdrop-blur-md sticky top-0 z-50">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <img alt="Dog Profile" className="w-12 h-12 rounded-full object-cover border-2 border-white dark:border-surface-dark shadow-sm" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBn9rRCCpDfMxR_3IoYBOVyNDNZADIHVHTErFZ1ecKqEnKJ0vl_NEf61nPEpN-muNBhi2X3_9QzQm9O2BOI0Y1XcNXFmw72fBSTG5SIfIRxxxsBrWfLqP0YcYbeXzX9-qStq9BpTXHo0YiOnjUMUtKIpl9qUKV7iaxqxdvMpKRAPntZHVH9ENBDRsvfy-7C6jtmoW-Bz_KrmfVcUz-PXlzyevQ_NUwkL4V6-3bbHLr_u_PgwcMgcMVavQRtmvGPSH9JDvWb6IV8viw" />
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-surface-dark"></div>
                    </div>
                    <div>
                        <p className="text-xs text-text-muted-light dark:text-text-muted-dark font-medium uppercase tracking-wider">计划用于</p>
                        <h1 className="text-xl font-bold flex items-center gap-1">
                            Cooper
                            <span className="material-icons-round text-primary text-sm">pets</span>
                        </h1>
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
                            <p className="text-sm text-text-muted-light dark:text-text-muted-dark">AI计划： <span className="text-primary font-semibold">体重管理</span></p>
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

                <section className="bg-primary/20 dark:bg-primary/10 rounded-3xl p-6 relative overflow-hidden shadow-soft hover:shadow-medium transition-all duration-300">
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-secondary/30 rounded-full blur-2xl"></div>
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="font-bold text-lg">每日营养</h3>
                                <p className="text-sm opacity-70">已完成每日目标的85%</p>
                            </div>
                            <div className="bg-white/50 dark:bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                AI优化中
                            </div>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="relative w-32 h-32 flex-shrink-0">
                                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                                    <circle className="text-white/40 dark:text-white/10" cx="50" cy="50" fill="transparent" r="40" stroke="currentColor" strokeWidth="8"></circle>
                                    <circle cx="50" cy="50" fill="transparent" r="40" stroke="#A3D9A5" strokeDasharray="251.2" strokeDashoffset="37" strokeLinecap="round" strokeWidth="8"></circle>
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                                    <span className="text-3xl font-bold leading-none">850</span>
                                    <span className="text-[10px] uppercase font-medium tracking-wide opacity-70">剩余卡路里</span>
                                </div>
                            </div>
                            <div className="flex-1 space-y-4">
                                <div>
                                    <div className="flex justify-between text-xs mb-1 font-medium">
                                        <span>蛋白质</span>
                                        <span>32g / 45g</span>
                                    </div>
                                    <div className="h-2 w-full bg-white/40 dark:bg-white/10 rounded-full overflow-hidden">
                                        <div className="h-full bg-green-600 w-[70%] rounded-full"></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-xs mb-1 font-medium">
                                        <span>脂肪</span>
                                        <span>12g / 18g</span>
                                    </div>
                                    <div className="h-2 w-full bg-white/40 dark:bg-white/10 rounded-full overflow-hidden">
                                        <div className="h-full bg-yellow-500 w-[65%] rounded-full"></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-xs mb-1 font-medium">
                                        <span>碳水化合物</span>
                                        <span>40g / 50g</span>
                                    </div>
                                    <div className="h-2 w-full bg-white/40 dark:bg-white/10 rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-400 w-[80%] rounded-full"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section>
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        今日餐食
                        <span className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded text-text-muted-light dark:text-text-muted-dark font-normal">已安排3餐</span>
                    </h3>
                    <div className="space-y-4">
                        <div className="bg-white dark:bg-surface-dark p-5 rounded-2xl shadow-soft border border-gray-100 dark:border-gray-800 flex items-center gap-4 opacity-60 transition-all duration-300 hover:opacity-100 hover:shadow-medium">
                            <div className="w-12 h-12 rounded-full bg-secondary/30 flex items-center justify-center flex-shrink-0 text-yellow-700 dark:text-yellow-200">
                                <span className="material-icons-round">wb_sunny</span>
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-start">
                                    <h4 className="font-bold text-sm">早晨干粮混合</h4>
                                    <span className="text-xs text-text-muted-light dark:text-text-muted-dark line-through decoration-primary">上午 08:00</span>
                                </div>
                                <p className="text-xs text-text-muted-light dark:text-text-muted-dark mt-0.5">鸡肉米饭配方 • 350 大卡</p>
                            </div>
                            <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white dark:text-gray-900">
                                <span className="material-icons-round text-sm">check</span>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-surface-dark p-5 rounded-2xl shadow-medium border-l-4 border-l-primary relative overflow-hidden group hover:shadow-large transition-all duration-300">
                            <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-white dark:from-surface-dark to-transparent z-10 pointer-events-none"></div>
                            <div className="flex items-center gap-4 relative z-0">
                                <div className="w-12 h-12 rounded-full bg-accent-blue flex items-center justify-center flex-shrink-0 text-blue-800">
                                    <span className="material-icons-round">restaurant</span>
                                </div>
                                <div className="flex-1 pr-4">
                                    <div className="flex justify-between items-start">
                                        <h4 className="font-bold text-lg text-primary">午餐碗</h4>
                                        <span className="text-xs font-bold bg-primary/20 text-green-800 dark:text-green-200 px-2 py-1 rounded">下午 12:30</span>
                                    </div>
                                    <p className="text-sm text-text-muted-light dark:text-text-muted-dark mt-1">三文鱼美味与蒸蔬菜</p>
                                    <div className="flex items-center gap-3 mt-3">
                                        <span className="text-xs flex items-center gap-1 text-text-muted-light dark:text-text-muted-dark bg-background-light dark:bg-background-dark px-2 py-1 rounded-md">
                                            <span className="w-1.5 h-1.5 rounded-full bg-yellow-400"></span> 28克脂肪
                                        </span>
                                        <span className="text-xs flex items-center gap-1 text-text-muted-light dark:text-text-muted-dark bg-background-light dark:bg-background-dark px-2 py-1 rounded-md">
                                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span> 420 大卡
                                        </span>
                                    </div>
                                </div>
                                <button className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-text-muted-light dark:text-text-muted-dark hover:bg-primary hover:text-white hover:scale-110 transition-all duration-200 shadow-sm">
                                    <span className="material-icons-round">add</span>
                                </button>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-surface-dark p-5 rounded-2xl shadow-soft border border-gray-100 dark:border-gray-800 flex items-center gap-4 hover:shadow-medium transition-all duration-300">
                            <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0 text-purple-600 dark:text-purple-300">
                                <span className="material-icons-round">nights_stay</span>
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-start">
                                    <h4 className="font-bold text-sm">晚间盛宴</h4>
                                    <span className="text-xs text-text-muted-light dark:text-text-muted-dark">下午 06:00</span>
                                </div>
                                <p className="text-xs text-text-muted-light dark:text-text-muted-dark mt-0.5">火鸡炖菜 • 410 大卡</p>
                            </div>
                            <button className="w-8 h-8 rounded-full border border-gray-200 dark:border-gray-600 flex items-center justify-center text-gray-400 hover:border-primary hover:text-primary transition-colors">
                                <span className="material-icons-round text-sm">more_horiz</span>
                            </button>
                        </div>
                    </div>
                </section>

                <section className="grid grid-cols-2 gap-4">
                    <div className="bg-accent-blue/30 dark:bg-accent-blue/10 p-5 rounded-2xl flex flex-col justify-between h-36 relative overflow-hidden hover:shadow-medium hover:scale-105 transition-all duration-300">
                        <span className="material-icons-round absolute -right-2 -bottom-4 text-6xl text-accent-blue opacity-50">water_drop</span>
                        <div>
                            <h4 className="font-bold text-blue-900 dark:text-blue-100">饮水量</h4>
                            <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">目标：800毫升</p>
                        </div>
                        <div className="flex items-end gap-1 mt-auto">
                            <span className="text-2xl font-bold text-blue-900 dark:text-blue-100">550</span>
                            <span className="text-sm font-medium mb-1 text-blue-700 dark:text-blue-300">毫升</span>
                        </div>
                    </div>
                    <div className="bg-secondary/30 dark:bg-secondary/10 p-5 rounded-2xl flex flex-col justify-between h-36 relative overflow-hidden hover:shadow-medium hover:scale-105 transition-all duration-300">
                        <span className="material-icons-round absolute -right-2 -bottom-4 text-6xl text-secondary opacity-50">monitor_weight</span>
                        <div>
                            <h4 className="font-bold text-yellow-900 dark:text-yellow-100">当前体重</h4>
                            <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">上次：2天前</p>
                        </div>
                        <div className="flex items-end gap-1 mt-auto">
                            <span className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">12.4</span>
                            <span className="text-sm font-medium mb-1 text-yellow-700 dark:text-yellow-300">公斤</span>
                        </div>
                    </div>
                </section>
            </main>
        </motion.div>
    );
}
