import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { pageTransitions } from '../utils/animations';

export default function Home() {
    return (
        <motion.div
            {...pageTransitions}
            className="pb-32"
        >
            <header className="px-6 pt-12 pb-2 flex justify-between items-center bg-background-light/90 dark:bg-background-dark/90 backdrop-blur-md sticky top-0 z-40">
                <div className="flex items-center gap-2">
                    <button className="w-8 h-8 rounded-full flex items-center justify-center text-text-muted-light dark:text-text-muted-dark hover:bg-gray-100 dark:hover:bg-surface-dark transition-colors">
                        <span className="material-icons-round text-lg">arrow_back</span>
                    </button>
                    <h1 className="text-xl font-bold">智能饮食规划</h1>
                </div>
                <div className="flex gap-3">
                    <button className="w-8 h-8 rounded-full flex items-center justify-center text-text-muted-light dark:text-text-muted-dark hover:text-primary transition-colors">
                        <span className="material-icons-round">help_outline</span>
                    </button>
                </div>
            </header>

            <main className="px-6 space-y-8">
                <section>
                    <div className="flex justify-between items-end mb-4">
                        <div>
                            <h2 className="text-lg font-bold flex items-center gap-2">
                                <span className="bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold">1</span>
                                选择宠物
                            </h2>
                            <p className="text-sm text-text-muted-light dark:text-text-muted-dark mt-1 pl-8">为哪位毛孩子制定计划？</p>
                        </div>
                    </div>
                    <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 -mx-6 px-6">
                        <div className="min-w-[140px] bg-white dark:bg-surface-dark p-4 rounded-2xl shadow-soft border-2 border-primary relative flex flex-col items-center gap-3 transition-transform transform scale-105">
                            <div className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center text-white">
                                <span className="material-icons-round text-xs">check</span>
                            </div>
                            <div className="w-16 h-16 rounded-full p-1 border-2 border-primary/20">
                                <img alt="Cooper" className="w-full h-full object-cover rounded-full" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBn9rRCCpDfMxR_3IoYBOVyNDNZADIHVHTErFZ1ecKqEnKJ0vl_NEf61nPEpN-muNBhi2X3_9QzQm9O2BOI0Y1XcNXFmw72fBSTG5SIfIRxxxsBrWfLqP0YcYbeXzX9-qStq9BpTXHo0YiOnjUMUtKIpl9qUKV7iaxqxdvMpKRAPntZHVH9ENBDRsvfy-7C6jtmoW-Bz_KrmfVcUz-PXlzyevQ_NUwkL4V6-3bbHLr_u_PgwcMgcMVavQRtmvGPSH9JDvWb6IV8viw" />
                            </div>
                            <div className="text-center">
                                <h3 className="font-bold text-text-main-light dark:text-text-main-dark">Cooper</h3>
                                <p className="text-xs text-text-muted-light dark:text-text-muted-dark">金毛巡回犬</p>
                            </div>
                        </div>
                        <div className="min-w-[140px] bg-white dark:bg-surface-dark p-4 rounded-2xl shadow-sm border border-transparent opacity-60 hover:opacity-100 transition-all flex flex-col items-center gap-3 grayscale cursor-pointer">
                            <div className="w-16 h-16 rounded-full p-1 bg-gray-100 dark:bg-gray-800">
                                <div className="w-full h-full bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center text-gray-400">
                                    <span className="material-icons-round">pets</span>
                                </div>
                            </div>
                            <div className="text-center">
                                <h3 className="font-bold text-text-main-light dark:text-text-main-dark">Luna</h3>
                                <p className="text-xs text-text-muted-light dark:text-text-muted-dark">布偶猫</p>
                            </div>
                        </div>
                        <div className="min-w-[140px] bg-gray-50 dark:bg-surface-dark/50 p-4 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center gap-2 hover:border-primary/50 transition-colors cursor-pointer group">
                            <Link to="/onboarding/step1" className="flex flex-col items-center gap-2 w-full h-full justify-center">
                                <div className="w-12 h-12 rounded-full bg-white dark:bg-surface-dark flex items-center justify-center text-gray-400 group-hover:text-primary transition-colors shadow-sm">
                                    <span className="material-icons-round">add</span>
                                </div>
                                <span className="text-xs font-medium text-text-muted-light group-hover:text-primary">添加新宠物</span>
                            </Link>
                        </div>
                    </div>
                </section>

                <section className="opacity-100 transition-opacity duration-500 delay-150">
                    <div className="mb-4">
                        <h2 className="text-lg font-bold flex items-center gap-2">
                            <span className="bg-secondary text-yellow-900 w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold">2</span>
                            输入定制需求
                        </h2>
                        <p className="text-sm text-text-muted-light dark:text-text-muted-dark mt-1 pl-8">描述它的特殊需求或健康目标。</p>
                    </div>
                    <div className="bg-white dark:bg-surface-dark p-5 rounded-3xl shadow-soft space-y-4">
                        <div className="relative">
                            <textarea
                                className="w-full bg-background-light dark:bg-background-dark border-0 rounded-2xl p-4 text-sm min-h-[140px] resize-none focus:ring-2 focus:ring-primary/50 placeholder-text-muted-light/50 dark:placeholder-text-muted-dark/50"
                                placeholder="例如：Cooper最近有点超重，我想给它制定一个减肥计划。它对鸡肉过敏，喜欢吃鱼。希望能增加关节保护的营养..."
                            ></textarea>
                            <button className="absolute bottom-3 right-3 p-2 rounded-full bg-white dark:bg-surface-dark shadow-sm text-primary hover:bg-primary hover:text-white transition-colors">
                                <span className="material-icons-round text-lg">mic</span>
                            </button>
                        </div>
                        <div className="space-y-2">
                            <p className="text-xs font-semibold text-text-muted-light dark:text-text-muted-dark uppercase tracking-wide">推荐标签</p>
                            <div className="flex flex-wrap gap-2">
                                {['体重控制', '敏感肠胃', '皮肤护理', '幼宠成长'].map((tag, i) => {
                                    const colors = [
                                        'bg-red-50 text-red-600 border-red-100 dark:bg-red-900/20 dark:text-red-300 dark:border-red-900/30 hover:bg-red-100',
                                        'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-900/30 hover:bg-blue-100',
                                        'bg-green-50 text-green-600 border-green-100 dark:bg-green-900/20 dark:text-green-300 dark:border-green-900/30 hover:bg-green-100',
                                        'bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-900/30 hover:bg-purple-100'
                                    ];
                                    return (
                                        <button key={tag} className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${colors[i]}`}>
                                            {tag}
                                        </button>
                                    )
                                })}
                                <button className="px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs font-medium border border-gray-200 dark:border-gray-700 hover:bg-gray-200 transition-colors flex items-center gap-1">
                                    <span className="material-icons-round text-[10px]">add</span> 更多
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                <div className="flex items-start gap-3 p-4 bg-primary/10 rounded-2xl">
                    <span className="material-icons-round text-primary mt-0.5">auto_awesome</span>
                    <div>
                        <h4 className="text-sm font-bold text-primary mb-1">AI 营养助手</h4>
                        <p className="text-xs text-text-muted-light dark:text-text-muted-dark leading-relaxed">
                            我们将分析数千种营养组合，为 Cooper 生成一份科学且美味的专属饮食计划。
                        </p>
                    </div>
                </div>
            </main>

            <div className="fixed bottom-[90px] left-0 right-0 px-6 z-40">
                <Link to="/planning" className="w-full bg-primary text-white dark:text-gray-900 font-bold text-lg py-4 rounded-2xl shadow-glow hover:shadow-lg hover:brightness-105 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                    <span className="material-icons-round">restaurant_menu</span>
                    生成专属计划
                </Link>
            </div>
        </motion.div>
    );
}
