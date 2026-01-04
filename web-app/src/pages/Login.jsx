import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function Login() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="h-screen flex flex-col justify-center px-6 relative overflow-hidden"
        >
            <div className="absolute -top-[20%] -right-[20%] w-[80%] h-[80%] bg-primary/20 rounded-full blur-[100px] pointer-events-none"></div>
            <div className="absolute -bottom-[20%] -left-[20%] w-[60%] h-[60%] bg-secondary/20 rounded-full blur-[80px] pointer-events-none"></div>

            <div className="relative z-10 w-full max-w-sm mx-auto">
                <div className="text-center mb-10">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent-blue mx-auto flex items-center justify-center text-white shadow-lg mb-4 transform rotate-3">
                        <span className="material-icons-round text-3xl">pets</span>
                    </div>
                    <h1 className="text-3xl font-bold mb-2">欢迎回来</h1>
                    <p className="text-text-muted-light dark:text-text-muted-dark">请登录以管理您的宠物饮食计划</p>
                </div>

                <form className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-text-muted-light uppercase tracking-wider ml-1" htmlFor="email">电子邮箱</label>
                        <div className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-sm border border-transparent focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10 transition-all flex items-center px-4 py-3">
                            <span className="material-icons-round text-text-muted-light mr-3">email</span>
                            <input
                                className="bg-transparent border-none p-0 w-full text-sm font-medium focus:ring-0 placeholder-gray-400"
                                id="email" placeholder="example@email.com" type="email"
                            />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-text-muted-light uppercase tracking-wider ml-1" htmlFor="password">密码</label>
                        <div className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-sm border border-transparent focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10 transition-all flex items-center px-4 py-3">
                            <span className="material-icons-round text-text-muted-light mr-3">lock</span>
                            <input
                                className="bg-transparent border-none p-0 w-full text-sm font-medium focus:ring-0 placeholder-gray-400"
                                id="password" placeholder="••••••••" type="password"
                            />
                            <button className="text-text-muted-light hover:text-text-main-light focus:outline-none" type="button">
                                <span className="material-icons-round">visibility_off</span>
                            </button>
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <a className="text-xs font-bold text-primary hover:text-primary-dark transition-colors" href="#">忘记密码？</a>
                    </div>
                    <Link to="/" className="w-full bg-text-main-light dark:bg-white text-white dark:text-text-main-light font-bold text-lg py-4 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-4">
                        登录
                        <span className="material-icons-round text-xl">login</span>
                    </Link>
                </form>

                <div className="mt-8">
                    <div className="relative py-2">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
                        </div>
                        <div className="relative flex justify-center">
                            <span className="px-4 bg-background-light dark:bg-background-dark text-xs text-text-muted-light uppercase tracking-wider font-semibold">
                                或使用社交账号
                            </span>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-6">
                        <button className="flex items-center justify-center gap-2 py-3 bg-surface-light dark:bg-surface-dark rounded-xl shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border border-gray-100 dark:border-gray-800">
                            <img alt="Google" className="w-5 h-5" src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg" />
                            <span className="text-sm font-bold">Google</span>
                        </button>
                        <button className="flex items-center justify-center gap-2 py-3 bg-surface-light dark:bg-surface-dark rounded-xl shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border border-gray-100 dark:border-gray-800">
                            <span className="material-icons-round text-green-500 text-xl">wechat</span>
                            <span className="text-sm font-bold">WeChat</span>
                        </button>
                    </div>
                </div>

                <p className="text-center mt-8 text-sm text-text-muted-light">
                    还没有账号？
                    <a className="font-bold text-primary hover:text-primary-dark hover:underline transition-colors" href="#">立即注册</a>
                </p>
            </div>
        </motion.div>
    );
}
