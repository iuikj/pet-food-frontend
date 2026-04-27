import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useUser } from '../hooks/useUser';
import FormField from '../components/FormField';
import { isMockMode, setMockMode, isManualOverride } from '../mock/mockMode';
import googleLogo from '../assets/google-g.svg';

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

    // 表单验证错误
    const [fieldErrors, setFieldErrors] = useState({});

    // Mock 模式状态
    const [mockEnabled, setMockEnabled] = useState(() => isMockMode());
    const [showMockOverride] = useState(() => isManualOverride());

    // 键盘状态和视口高度
    const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
    const formRef = useRef(null);
    const countdownTimerRef = useRef(null);

    // 监听软键盘弹出（通过视口高度变化检测）
    useEffect(() => {
        const handleResize = () => {
            // 在 Android 上，键盘弹出时 window.innerHeight 会变小
            const windowHeight = window.innerHeight;
            const isSmall = windowHeight < 500;
            setIsKeyboardVisible(isSmall);
        };

        // 使用 visualViewport API（更精确）
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

    // 验证表单
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

    // 发送验证码
    const handleSendCode = async () => {
        if (!email || countdown > 0) return;

        // 验证邮箱
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

    // 登录
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

    // 注册
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

    // 清除字段错误
    const clearFieldError = (field) => {
        setFieldErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[field];
            return newErrors;
        });
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="min-h-[100dvh] flex flex-col justify-center px-6 relative overflow-hidden"
            style={{
                // 动态适应键盘高度
                paddingBottom: isKeyboardVisible ? '20px' : '0'
            }}
        >
            <div className="absolute -top-[20%] -right-[20%] w-[80%] h-[80%] bg-primary/20 rounded-full blur-[100px] pointer-events-none"></div>
            <div className="absolute -bottom-[20%] -left-[20%] w-[60%] h-[60%] bg-secondary/20 rounded-full blur-[80px] pointer-events-none"></div>

            <div className="relative z-10 w-full max-w-sm mx-auto">
                {/* Logo 和标题 - 键盘弹出时隐藏 */}
                <motion.div
                    className="text-center mb-8"
                    animate={{
                        height: isKeyboardVisible ? 0 : 'auto',
                        opacity: isKeyboardVisible ? 0 : 1,
                        marginBottom: isKeyboardVisible ? 0 : 32
                    }}
                    transition={{ duration: 0.2 }}
                >
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent-blue mx-auto flex items-center justify-center text-white shadow-lg mb-4 transform rotate-3">
                        <span className="material-icons-round text-3xl">pets</span>
                    </div>
                    <h1 className="text-3xl font-bold mb-2">{isRegister ? '创建账号' : '欢迎回来'}</h1>
                    <p className="text-text-muted-light dark:text-text-muted-dark">
                        {isRegister ? '注册以开始管理您的宠物饮食' : '请登录以管理您的宠物饮食计划'}
                    </p>
                </motion.div>

                {/* 全局错误提示 */}
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm flex items-center gap-2"
                    >
                        <span className="material-icons-round text-lg">error</span>
                        {error}
                    </motion.div>
                )}

                <form ref={formRef} className="space-y-4" onSubmit={isRegister ? handleRegister : handleLogin} noValidate>
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
                        placeholder="••••••••"
                        icon="lock"
                        error={fieldErrors.password}
                        required
                        showPasswordToggle
                    />

                    {isRegister && (
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-text-muted-light uppercase tracking-wider ml-1" htmlFor="code">验证码（可选）</label>
                            <div className="flex gap-2">
                                <div className="flex-1 bg-surface-light dark:bg-surface-dark rounded-xl shadow-sm border border-transparent focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10 transition-all flex items-center px-4 py-3">
                                    <span className="material-icons-round text-text-muted-light mr-3">pin</span>
                                    <input
                                        className="bg-transparent border-none p-0 w-full text-sm font-medium focus:ring-0 focus:outline-none placeholder-gray-400"
                                        id="code" placeholder="6位验证码" type="text" maxLength={6}
                                        value={code}
                                        onChange={(e) => setCode(e.target.value)}
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={handleSendCode}
                                    disabled={countdown > 0 || !email || isLoading}
                                    className="px-4 py-3 bg-primary text-white dark:text-gray-900 rounded-xl font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap transition-all active:scale-[0.97]"
                                >
                                    {countdown > 0 ? `${countdown}s` : '发送'}
                                </button>
                            </div>
                        </div>
                    )}

                    {!isRegister && (
                        <div className="flex justify-end">
                            <button type="button" className="text-xs font-bold text-primary hover:text-primary-dark transition-colors cursor-pointer">忘记密码？</button>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-text-main-light dark:bg-white text-white dark:text-text-main-light font-bold text-lg py-4 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all active:scale-[0.97] flex items-center justify-center gap-2 mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <span className="material-icons-round animate-spin">refresh</span>
                        ) : (
                            <>
                                {isRegister ? '注册' : '登录'}
                                <span className="material-icons-round text-xl">{isRegister ? 'person_add' : 'login'}</span>
                            </>
                        )}
                    </button>
                </form>

                {/* 社交登录区域 - 键盘弹出时隐藏 */}
                <motion.div
                    className="mt-8"
                    animate={{
                        height: isKeyboardVisible ? 0 : 'auto',
                        opacity: isKeyboardVisible ? 0 : 1,
                        marginTop: isKeyboardVisible ? 0 : 32,
                        overflow: 'hidden'
                    }}
                    transition={{ duration: 0.2 }}
                >
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
                        <button className="flex items-center justify-center gap-2 py-3 bg-surface-light dark:bg-surface-dark rounded-xl shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-all border border-gray-100 dark:border-gray-800 active:scale-[0.97]">
                            <img alt="Google" className="w-5 h-5" src={googleLogo} />
                            <span className="text-sm font-bold">Google</span>
                        </button>
                        <button className="flex items-center justify-center gap-2 py-3 bg-surface-light dark:bg-surface-dark rounded-xl shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-all border border-gray-100 dark:border-gray-800 active:scale-[0.97]">
                            <span className="material-icons-round text-green-500 text-xl">wechat</span>
                            <span className="text-sm font-bold">WeChat</span>
                        </button>
                    </div>
                </motion.div>

                <p className="text-center mt-8 text-sm text-text-muted-light">
                    {isRegister ? '已有账号？' : '还没有账号？'}
                    <button
                        onClick={() => {
                            setIsRegister(!isRegister);
                            setError('');
                            setFieldErrors({});
                        }}
                        className="font-bold text-primary hover:text-primary-dark hover:underline transition-colors ml-1"
                    >
                        {isRegister ? '立即登录' : '立即注册'}
                    </button>
                </p>

                {/* Mock 模式提示与切换 */}
                <div className="mt-6 space-y-2">
                    {/* 自动检测到无后端时的提示 */}
                    {mockEnabled && !showMockOverride && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded-xl text-xs text-center"
                        >
                            <span className="material-icons-round text-sm align-middle mr-1">info</span>
                            未检测到后端服务，已自动切换为演示模式
                        </motion.div>
                    )}

                    {/* Toggle 开关 */}
                    <div className="flex items-center justify-center gap-3 text-xs text-text-muted-light">
                        <span className={!mockEnabled ? 'font-bold text-primary' : ''}>真实 API</span>
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
                                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                                    mockEnabled ? 'translate-x-6' : 'translate-x-1'
                                }`}
                            />
                        </button>
                        <span className={mockEnabled ? 'font-bold text-amber-600 dark:text-amber-400' : ''}>演示模式</span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
