import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { pageTransitions } from '../utils/animations';

export default function Profile() {
    return (
        <motion.div
            {...pageTransitions}
            className="pb-32"
        >
            <header className="px-6 pt-12 pb-2 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md sticky top-0 z-50">
                <div className="flex justify-end gap-3">
                    <button className="w-10 h-10 rounded-full bg-white dark:bg-surface-dark shadow-sm flex items-center justify-center text-text-muted-light dark:text-text-muted-dark hover:text-primary transition-colors">
                        <span className="material-icons-round">settings</span>
                    </button>
                    <button className="w-10 h-10 rounded-full bg-white dark:bg-surface-dark shadow-sm flex items-center justify-center text-text-muted-light dark:text-text-muted-dark hover:text-primary transition-colors" title="Toggle Theme">
                        <span className="material-icons-round">dark_mode</span>
                    </button>
                </div>
            </header>

            <main className="px-6 space-y-8">
                <section className="flex items-center gap-4">
                    <div className="relative">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent-blue p-1 shadow-glow">
                            <img alt="User Avatar" className="w-full h-full rounded-full object-cover border-2 border-white dark:border-background-dark" src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80" />
                        </div>
                        <Link
                            to="/profile/edit"
                            className="absolute bottom-0 right-0 w-6 h-6 bg-primary rounded-full border-2 border-white dark:border-background-dark flex items-center justify-center text-white hover:bg-green-400 transition-colors"
                        >
                            <span className="material-icons-round text-[14px]">edit</span>
                        </Link>
                    </div>
                    <div>
                        <h2 className="text-lg font-bold">Alex Chen</h2>
                        <p className="text-sm text-text-muted-light dark:text-text-muted-dark">alex.chen@example.com</p>
                        <div className="flex items-center gap-2 mt-2">
                            <span className="px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded text-xs font-bold flex items-center gap-1">
                                <span className="material-icons-round text-[14px]">star</span> PRO 会员
                            </span>
                        </div>
                    </div>
                </section>

                <section>
                    <div className="flex justify-between items-end mb-4">
                        <h2 className="text-xl font-bold">我的宠物</h2>
                    </div>
                    <div className="space-y-4">
                        <div className="bg-white dark:bg-surface-dark p-5 rounded-2xl shadow-medium border border-gray-100 dark:border-gray-800 relative overflow-hidden group hover:shadow-large hover:-translate-y-1 transition-all duration-300">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
                            <div className="flex gap-4 relative z-10">
                                <div className="relative w-24 h-24 flex-shrink-0">
                                    <img alt="Cooper" className="w-full h-full object-cover rounded-2xl shadow-sm" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBn9rRCCpDfMxR_3IoYBOVyNDNZADIHVHTErFZ1ecKqEnKJ0vl_NEf61nPEpN-muNBhi2X3_9QzQm9O2BOI0Y1XcNXFmw72fBSTG5SIfIRxxxsBrWfLqP0YcYbeXzX9-qStq9BpTXHo0YiOnjUMUtKIpl9qUKV7iaxqxdvMpKRAPntZHVH9ENBDRsvfy-7C6jtmoW-Bz_KrmfVcUz-PXlzyevQ_NUwkL4V6-3bbHLr_u_PgwcMgcMVavQRtmvGPSH9JDvWb6IV8viw" />
                                </div>
                                <div className="flex-1 min-w-0 py-1">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-bold text-xl truncate">Cooper</h3>
                                            <p className="text-sm text-text-muted-light dark:text-text-muted-dark">金毛寻回犬</p>
                                        </div>
                                        <button className="w-8 h-8 -mr-2 -mt-2 flex items-center justify-center rounded-full text-text-muted-light hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                            <span className="material-icons-round text-lg">more_vert</span>
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap gap-2 mt-3">
                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-text-muted-light dark:text-text-muted-dark text-xs font-semibold">
                                            <span className="material-icons-round text-xs">cake</span> 3 岁
                                        </span>
                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-text-muted-light dark:text-text-muted-dark text-xs font-semibold">
                                            <span className="material-icons-round text-xs">monitor_weight</span> 32 kg
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-800 flex gap-3">
                                <Link to="/pet/edit/1" className="flex-1 py-2.5 rounded-xl bg-background-light dark:bg-background-dark text-text-main-light dark:text-text-main-dark text-sm font-semibold hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2">
                                    <span className="material-icons-round text-base">edit</span>
                                    编辑
                                </Link>
                                <button className="flex-1 py-2.5 rounded-xl border border-primary text-primary text-sm font-bold hover:bg-primary/5 transition-colors flex items-center justify-center gap-2">
                                    <span className="material-icons-round text-base">assignment</span>
                                    AI 档案
                                </button>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-surface-dark p-5 rounded-2xl shadow-soft border border-gray-100 dark:border-gray-800 relative overflow-hidden hover:shadow-medium hover:-translate-y-1 transition-all duration-300">
                            <div className="flex gap-4">
                                <div className="relative w-24 h-24 flex-shrink-0 bg-accent-blue/10 dark:bg-accent-blue/5 rounded-2xl flex items-center justify-center text-accent-blue border border-accent-blue/20">
                                    <span className="material-icons-round text-4xl opacity-80">pets</span>
                                </div>
                                <div className="flex-1 min-w-0 py-1">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-bold text-xl truncate">Luna</h3>
                                            <p className="text-sm text-text-muted-light dark:text-text-muted-dark">英国短毛猫</p>
                                        </div>
                                        <button className="w-8 h-8 -mr-2 -mt-2 flex items-center justify-center rounded-full text-text-muted-light hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                                            <span className="material-icons-round text-lg">delete_outline</span>
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap gap-2 mt-3">
                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-text-muted-light dark:text-text-muted-dark text-xs font-semibold">
                                            <span className="material-icons-round text-xs">cake</span> 2 岁
                                        </span>
                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-text-muted-light dark:text-text-muted-dark text-xs font-semibold">
                                            <span className="material-icons-round text-xs">monitor_weight</span> 4.2 kg
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-800 flex gap-3">
                                <Link to="/pet/edit/2" className="flex-1 py-2.5 rounded-xl bg-background-light dark:bg-background-dark text-text-main-light dark:text-text-main-dark text-sm font-semibold hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2">
                                    <span className="material-icons-round text-base">edit</span>
                                    编辑
                                </Link>
                                <button className="flex-1 py-2.5 rounded-xl border border-primary text-primary text-sm font-bold hover:bg-primary/5 transition-colors flex items-center justify-center gap-2">
                                    <span className="material-icons-round text-base">assignment</span>
                                    AI 档案
                                </button>
                            </div>
                        </div>

                        <Link to="/onboarding/step1" className="w-full p-6 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-primary/50 dark:hover:border-primary/50 bg-gray-50/50 dark:bg-surface-dark/30 hover:bg-primary/10 hover:shadow-soft transition-all duration-300 group flex flex-col items-center justify-center gap-2">
                            <div className="w-12 h-12 rounded-full bg-white dark:bg-surface-dark shadow-sm flex items-center justify-center text-text-muted-light group-hover:text-white group-hover:bg-primary transition-all duration-300">
                                <span className="material-icons-round text-2xl">add</span>
                            </div>
                            <span className="font-bold text-text-muted-light dark:text-text-muted-dark group-hover:text-primary transition-colors">新增宠物</span>
                        </Link>
                    </div>
                </section>
            </main>
        </motion.div>
    );
}
