import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '../hooks/useUser';
import FormField from '../components/FormField';
import ErrorAlert from '../components/ErrorAlert';
import AppIcon from '../components/AppIcon';
import { isMockMode, setMockMode, isManualOverride } from '../mock/mockMode';

export default function Login() {
    const navigate = useNavigate();
    const { login, register, sendCode, verifyRegister } = useUser();

    const [isRegister, setIsRegister] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [code, setCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [codeSent, setCodeSent] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const [fieldErrors, setFieldErrors] = useState({});

    // Mock 模式状态
    const [mockEnabled, setMockEnabled] = useState(() => isMockMode());
    const [showMockOverride] = useState(() => isManualOverride());

    // 键盘状态
    const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
    const countdownTimerRef = useRef(null);

    useEffect(() => {
        const handleResize = () => {
            const windowHeight = window.innerHeight;
            setIsKeyboardVisible(windowHeight < 500);
        };

        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', handleResize);
            return () => window.visualViewport.removeEventListener('resize', handleResize);
        } else {
            window.addEventListener('resize', handleResize);
            return () => window.removeEventListener('resize', handleResize);
        }
    }, []);

    useEffect(() => {
        return () => {
            if (countdownTimerRef.current) {
                clearInterval(countdownTimerRef.current);
            }
        };
    }, []);

    const validateForm = () => {
        const errors = {};

        if (!email.trim()) {
            errors.email = '请输入邮箱地址';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            errors.email = '请输入有效的邮箱地址';
        }

        if (!password.trim()) {
            errors.password = '请输入密码';
        } else if (password.length < 6) {
            errors.password = '密码至少需要 6 个字符';
        }

        if (isRegister && !username.trim()) {
            errors.username = '请输入用户名';
        }

        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSendCode = async () => {
        if (!email || countdown > 0) return;

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setFieldErrors(prev => ({ ...prev, email: '请输入有效的邮箱地址' }));
            return;
        }

        setIsLoading(true);
        setError('');
        try {
            const result = await sendCode(email, 'register');

            if (result.success) {
                setCodeSent(true);
                setCountdown(60);
                if (countdownTimerRef.current) {
                    clearInterval(countdownTimerRef.current);
                }

                countdownTimerRef.current = setInterval(() => {
                    setCountdown(prev => {
                        if (prev <= 1) {
                            clearInterval(countdownTimerRef.current);
                            countdownTimerRef.current = null;
                            return 0;
                        }
                        return prev - 1;
                    });
                }, 1000);
            } else {
                setError(result.message || '发送验证码失败');
            }
        } catch {
            setError('发送验证码失败');
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsLoading(true);
        setError('');
        try {
            const result = await login(email, password);
            if (result.success) {
                navigate('/');
            } else {
                setError(result.message || '登录失败，请检查邮箱和密码');
            }
        } catch {
            setError('登录失败，请检查邮箱和密码');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsLoading(true);
        setError('');
        try {
            if (codeSent && code) {
                const result = await verifyRegister(email, code, username, password);
                if (result.success) {
                    navigate('/');
                } else {
                    setError(result.message || '注册失败');
                }
            } else {
                const result = await register(username, email, password);
                if (result.success) {
                    navigate('/');
                } else {
                    setError(result.message || '注册失败');
                }
            }
        } catch {
            setError('注册失败');
        } finally {
            setIsLoading(false);
        }
    };

    const clearFieldError = (field) => {
        setFieldErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[field];
            return newErrors;
        });
    };

    return (
        <div className="min-h-[100dvh] flex flex-col bg-gradient-to-br from-primary/5 via-background-light to-secondary/10 dark:from-gray-900 dark:via-background-dark dark:to-gray-800">
            {/* 装饰性背景 */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 right-0 w-72 h-72 bg-primary/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary/10 rounded-full blur-3xl"></div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative z-10 flex-1 flex flex-col justify-center px-6 py-8"
                style={{
                    paddingBottom: isKeyboardVisible ? '20px' : undefined
                }}
            >
                <div className="w-full max-w-md mx-auto">
                    {/* Logo 区域 */}
                    <motion.div
                        className="text-center mb-8"
                        animate={{
                            height: isKeyboardVisible ? 0 : 'auto',
                            opacity: isKeyboardVisible ? 0 : 1,
                            marginBottom: isKeyboardVisible ? 0 : 32
                        }}
                        transition={{ duration: 0.2 }}
                    >
                        <AppIcon size="md" className="mb-4" />
                        <h1 className="text-3xl font-bold text-text-main-light dark:text-text-main-dark mb-2">
                            {isRegister ? '创建账号' : '欢迎回来'}
                        </h1>
                        <p className="text-text-muted-light dark:text-text-muted-dark">
                            {isRegister ? '开始为您的爱宠定制营养计划' : '登录以继续管理您的宠物饮食'}
                        </p>
                    </motion.div>

                    {/* 表单区域 */}
                    <div className="space-y-6">
                        {/* 错误提示 */}
                        <AnimatePresence>
                            {error && (
                                <ErrorAlert error={error} onClose={() => setError('')} />
                            )}
                        </AnimatePresence>

                        <form onSubmit={isRegister ? handleRegister : handleLogin} className="space-y-5" noValidate>
                            {isRegister && (
                                <FormField
                                    id="username"
                                    label="用户名"
                                    type="text"
                                    value={username}
                                    onChange={(val) => {
                                        setUsername(val);
                                        clearFieldError('username');
                                    }}
                                    placeholder="您的用户名"
                                    icon="person"
                                    error={fieldErrors.username}
                                    required
                                />
                            )}

                            <FormField
                                id="email"
                                label="电子邮箱"
                                type="email"
                                value={email}
                                onChange={(val) => {
                                    setEmail(val);
                                    clearFieldError('email');
                                }}
                                placeholder="example@email.com"
                                icon="email"
                                error={fieldErrors.email}
                                required
                            />

                            <FormField
                                id="password"
                                label="密码"
                                type="password"
                                value={password}
                                onChange={(val) => {
                                    setPassword(val);
                                    clearFieldError('password');
                                }}
                                placeholder="至少 6 个字符"
                                icon="lock"
                                error={fieldErrors.password}
                                required
                                showPasswordToggle
                            />

                            {isRegister && (
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-text-main-light dark:text-text-main-dark" htmlFor="code">
                                        验证码（可选）
                                    </label>
                                    <div className="flex gap-3">
                                        <div className="flex-1 bg-surface-light dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all flex items-center px-4 py-3">
                                            <span className="material-icons-round text-text-muted-light dark:text-text-muted-dark mr-3 text-xl">pin</span>
                                            <input
                                                className="bg-transparent border-none p-0 w-full text-sm font-medium focus:ring-0 focus:outline-none placeholder-gray-400 dark:placeholder-gray-500"
                                                id="code"
                                                placeholder="6位验证码"
                                                type="text"
                                                maxLength={6}
                                                value={code}
                                                onChange={(e) => setCode(e.target.value)}
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleSendCode}
                                            disabled={countdown > 0 || !email || isLoading}
                                            className="px-5 py-3 bg-primary hover:bg-primary/90 text-white dark:text-gray-900 rounded-xl font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap transition-all active:scale-95 shadow-sm"
                                        >
                                            {countdown > 0 ? `${countdown}s` : '发送'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {!isRegister && (
                                <div className="flex justify-end">
                                    <button
                                        type="button"
                                        className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
                                    >
                                        忘记密码？
                                    </button>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-white dark:text-gray-900 font-bold text-base py-4 rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <>
                                        <span className="material-icons-round animate-spin text-xl">refresh</span>
                                        <span>处理中...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>{isRegister ? '注册' : '登录'}</span>
                                        <span className="material-icons-round text-xl">arrow_forward</span>
                                    </>
                                )}
                            </button>
                        </form>

                        {/* 切换登录/注册 */}
                        <div className="mt-6 text-center">
                            <p className="text-sm text-text-muted-light dark:text-text-muted-dark">
                                {isRegister ? '已有账号？' : '还没有账号？'}
                                <button
                                    onClick={() => {
                                        setIsRegister(!isRegister);
                                        setError('');
                                        setFieldErrors({});
                                    }}
                                    className="ml-2 font-bold text-primary hover:text-primary/80 transition-colors"
                                >
                                    {isRegister ? '立即登录' : '立即注册'}
                                </button>
                            </p>
                        </div>
                    </div>

                    {/* Mock 模式切换 */}
                    <div className="mt-6 space-y-3">
                        {mockEnabled && !showMockOverride && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded-xl text-xs text-center backdrop-blur-sm"
                            >
                                <span className="material-icons-round text-sm align-middle mr-1">info</span>
                                未检测到后端服务，已自动切换为演示模式
                            </motion.div>
                        )}

                        <div className="flex items-center justify-center gap-3 text-xs text-text-muted-light dark:text-text-muted-dark">
                            <span className={!mockEnabled ? 'font-semibold text-primary' : ''}>真实 API</span>
                            <button
                                type="button"
                                role="switch"
                                aria-checked={mockEnabled}
                                onClick={() => {
                                    const next = !mockEnabled;
                                    setMockMode(next);
                                    setMockEnabled(next);
                                    window.location.reload();
                                }}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30 ${
                                    mockEnabled ? 'bg-amber-400' : 'bg-gray-300 dark:bg-gray-600'
                                }`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                                        mockEnabled ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                                />
                            </button>
                            <span className={mockEnabled ? 'font-semibold text-amber-600 dark:text-amber-400' : ''}>演示模式</span>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
