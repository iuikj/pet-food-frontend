import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '../hooks/useUser';
import FormField from '../components/FormField';
import ErrorAlert from '../components/ErrorAlert';
import AppIcon from '../components/AppIcon';
import { showToast } from '../utils/toast';
import { isMockMode, setMockMode, isManualOverride } from '../mock/mockMode';

const USERNAME_REGEX = /^[\u4e00-\u9fffA-Za-z0-9_-]+$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MAX_BYTES = 72;
const PASSWORD_HELPER_TEXT = '密码至少 6 个字符。支持中文、英文和符号；若包含中文或表情，可用长度会更短。';
const MotionDiv = motion.div;

function normalizeEmail(value) {
    return value.trim().toLowerCase();
}

function getUtf8ByteLength(value) {
    return new TextEncoder().encode(value).length;
}

function validateUsername(value) {
    const normalized = value.trim();

    if (!normalized) {
        return '请输入用户名';
    }

    if (normalized.length < 3 || normalized.length > 50) {
        return '用户名需为 3-50 个字符';
    }

    if (!USERNAME_REGEX.test(normalized)) {
        return '用户名只能包含中文、字母、数字、下划线和连字符';
    }

    return '';
}

function validateEmail(value) {
    const normalized = normalizeEmail(value);

    if (!normalized) {
        return '请输入邮箱地址';
    }

    if (!EMAIL_REGEX.test(normalized)) {
        return '请输入有效的邮箱地址';
    }

    return '';
}

function validateLoginIdentity(value) {
    const normalized = value.trim();

    if (!normalized) {
        return '请输入用户名或邮箱';
    }

    if (normalized.includes('@') && !EMAIL_REGEX.test(normalizeEmail(value))) {
        return '请输入有效的邮箱地址';
    }

    return '';
}

function validateRegisterPassword(value) {
    if (!value) {
        return '请输入密码';
    }

    if (value.length < 6) {
        return '密码至少需要 6 个字符';
    }

    if (getUtf8ByteLength(value) > PASSWORD_MAX_BYTES) {
        return '密码最多支持 72 字节（UTF-8）';
    }

    return '';
}

function validateVerificationCode(value, required = false) {
    const normalized = value.trim();

    if (!normalized) {
        return required ? '请输入 6 位验证码' : '';
    }

    if (!/^\d{6}$/.test(normalized)) {
        return '验证码需为 6 位数字';
    }

    return '';
}

function mapRegisterErrorToFields(message) {
    if (!message) {
        return null;
    }

    if (message.includes('用户名')) {
        return { username: message };
    }

    if (message.includes('邮箱')) {
        return { email: message };
    }

    if (message.includes('密码')) {
        return { password: message };
    }

    if (message.includes('验证码')) {
        return { code: message };
    }

    return null;
}

function mapLoginErrorToFields(message) {
    if (!message) {
        return null;
    }

    if (message.includes('用户名或密码错误')) {
        return { password: message };
    }

    if (message.includes('邮箱') || message.includes('用户名')) {
        return { email: message };
    }

    if (message.includes('密码')) {
        return { password: message };
    }

    return null;
}

function mapResetErrorToFields(message) {
    if (!message) {
        return null;
    }

    if (message.includes('邮箱')) {
        return { email: message };
    }

    if (message.includes('验证码')) {
        return { code: message };
    }

    if (message.includes('密码')) {
        return { newPassword: message };
    }

    return null;
}

export default function Login() {
    const navigate = useNavigate();
    const {
        login,
        register,
        sendCode,
        verifyRegister,
        sendPasswordResetCode,
        resetPassword,
    } = useUser();

    const [isRegister, setIsRegister] = useState(false);
    const [identity, setIdentity] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [code, setCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [codeSent, setCodeSent] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const [fieldErrors, setFieldErrors] = useState({});

    const [resetModalOpen, setResetModalOpen] = useState(false);
    const [resetForm, setResetForm] = useState({
        email: '',
        code: '',
        newPassword: '',
    });
    const [resetFieldErrors, setResetFieldErrors] = useState({});
    const [resetError, setResetError] = useState('');
    const [resetSubmitting, setResetSubmitting] = useState(false);
    const [resetCodeSent, setResetCodeSent] = useState(false);
    const [resetCountdown, setResetCountdown] = useState(0);

    // Mock 模式状态
    const [mockEnabled, setMockEnabled] = useState(() => isMockMode());
    const [showMockOverride] = useState(() => isManualOverride());

    // 键盘状态
    const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
    const countdownTimerRef = useRef(null);
    const resetCountdownTimerRef = useRef(null);

    useEffect(() => {
        const handleResize = () => {
            const windowHeight = window.innerHeight;
            setIsKeyboardVisible(windowHeight < 500);
        };

        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', handleResize);
            return () => window.visualViewport.removeEventListener('resize', handleResize);
        }

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => (
        () => {
            if (countdownTimerRef.current) {
                clearInterval(countdownTimerRef.current);
            }
            if (resetCountdownTimerRef.current) {
                clearInterval(resetCountdownTimerRef.current);
            }
        }
    ), []);

    const startCountdown = (setCountdownState, timerRef) => {
        setCountdownState(60);
        if (timerRef.current) {
            clearInterval(timerRef.current);
        }

        timerRef.current = setInterval(() => {
            setCountdownState((prev) => {
                if (prev <= 1) {
                    clearInterval(timerRef.current);
                    timerRef.current = null;
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const resetRegisterVerificationState = () => {
        setCode('');
        setCodeSent(false);
        setCountdown(0);
        setFieldErrors((prev) => {
            if (!prev.code) {
                return prev;
            }

            const next = { ...prev };
            delete next.code;
            return next;
        });
        if (countdownTimerRef.current) {
            clearInterval(countdownTimerRef.current);
            countdownTimerRef.current = null;
        }
    };

    const resetResetCountdownState = () => {
        setResetCodeSent(false);
        setResetCountdown(0);
        if (resetCountdownTimerRef.current) {
            clearInterval(resetCountdownTimerRef.current);
            resetCountdownTimerRef.current = null;
        }
    };

    const resetResetFlowState = (email = '') => {
        setResetForm({
            email,
            code: '',
            newPassword: '',
        });
        setResetFieldErrors({});
        setResetError('');
        resetResetCountdownState();
    };

    const clearFieldError = (field) => {
        setFieldErrors((prev) => {
            const next = { ...prev };
            delete next[field];
            return next;
        });
    };

    const clearResetFieldError = (field) => {
        setResetFieldErrors((prev) => {
            const next = { ...prev };
            delete next[field];
            return next;
        });
    };

    const validateForm = () => {
        const errors = {};

        if (isRegister) {
            const emailError = validateEmail(identity);
            if (emailError) {
                errors.email = emailError;
            }
        } else {
            const identityError = validateLoginIdentity(identity);
            if (identityError) {
                errors.email = identityError;
            }
        }

        if (!password.trim()) {
            errors.password = '请输入密码';
        } else if (password.length < 6) {
            errors.password = '密码至少需要 6 个字符';
        } else if (isRegister) {
            const passwordError = validateRegisterPassword(password);
            if (passwordError) {
                errors.password = passwordError;
            }
        }

        if (isRegister) {
            const usernameError = validateUsername(username);
            if (usernameError) {
                errors.username = usernameError;
            }

            if (code.trim()) {
                const codeError = validateVerificationCode(code, false);
                if (codeError) {
                    errors.code = codeError;
                }
            }
        }

        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const validateResetForm = () => {
        const errors = {};

        const emailError = validateEmail(resetForm.email);
        if (emailError) {
            errors.email = emailError;
        }

        const codeError = validateVerificationCode(resetForm.code, true);
        if (codeError) {
            errors.code = codeError;
        }

        const passwordError = validateRegisterPassword(resetForm.newPassword);
        if (passwordError) {
            errors.newPassword = passwordError;
        }

        setResetFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSendCode = async () => {
        const emailError = validateEmail(identity);
        if (emailError || countdown > 0) {
            if (emailError) {
                setFieldErrors((prev) => ({ ...prev, email: emailError }));
            }
            return;
        }

        setIsLoading(true);
        setError('');
        try {
            const result = await sendCode(normalizeEmail(identity), 'register');

            if (result.success) {
                setCodeSent(true);
                startCountdown(setCountdown, countdownTimerRef);
                await showToast(result.message || '验证码已发送，请注意查收邮箱');
                return;
            }

            setError(result.message || '发送验证码失败');
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
            const result = await login(identity, password);
            if (result.success) {
                navigate('/');
            } else {
                const message = result.message || '登录失败，请检查用户名/邮箱和密码';
                const mappedErrors = mapLoginErrorToFields(message);
                if (mappedErrors) {
                    setFieldErrors((prev) => ({ ...prev, ...mappedErrors }));
                }
                setError(message);
            }
        } catch {
            setError('登录失败，请检查用户名/邮箱和密码');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        const normalizedCode = code.trim();
        if (normalizedCode && !codeSent) {
            setFieldErrors((prev) => ({
                ...prev,
                code: '请先发送验证码，再填写收到的 6 位数字验证码',
            }));
            return;
        }

        setIsLoading(true);
        setError('');
        try {
            const normalizedEmail = normalizeEmail(identity);
            const normalizedUsername = username.trim();

            if (codeSent && normalizedCode) {
                const result = await verifyRegister(normalizedEmail, normalizedCode, normalizedUsername, password);
                if (result.success) {
                    navigate('/');
                    return;
                }

                const mappedErrors = mapRegisterErrorToFields(result.message);
                if (mappedErrors) {
                    setFieldErrors((prev) => ({ ...prev, ...mappedErrors }));
                }
                setError(result.message || '注册失败');
                return;
            }

            const result = await register(normalizedUsername, normalizedEmail, password);
            if (result.success) {
                navigate('/');
                return;
            }

            const mappedErrors = mapRegisterErrorToFields(result.message);
            if (mappedErrors) {
                setFieldErrors((prev) => ({ ...prev, ...mappedErrors }));
            }
            setError(result.message || '注册失败');
        } catch {
            setError('注册失败');
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggleAuthMode = () => {
        const nextIsRegister = !isRegister;
        setIsRegister(nextIsRegister);
        setError('');
        setFieldErrors({});
        setPassword('');
        setIdentity((prev) => {
            if (!nextIsRegister) {
                return prev.trim();
            }

            return prev.includes('@') ? normalizeEmail(prev) : '';
        });
        if (nextIsRegister) {
            setUsername('');
        }
        resetRegisterVerificationState();
    };

    const handleOpenResetModal = () => {
        const presetEmail = identity.includes('@') ? normalizeEmail(identity) : '';
        resetResetFlowState(presetEmail);
        setResetModalOpen(true);
    };

    const handleCloseResetModal = () => {
        resetResetFlowState();
        setResetModalOpen(false);
    };

    const handleResetFormChange = (field, value) => {
        if (field === 'email' && normalizeEmail(value) !== normalizeEmail(resetForm.email)) {
            resetResetCountdownState();
            setResetForm((prev) => ({
                ...prev,
                email: value,
                code: '',
            }));
            clearResetFieldError('code');
        } else {
            setResetForm((prev) => ({ ...prev, [field]: value }));
        }

        setResetError('');
        clearResetFieldError(field);
    };

    const handleSendResetCode = async () => {
        const emailError = validateEmail(resetForm.email);
        if (emailError || resetCountdown > 0) {
            if (emailError) {
                setResetFieldErrors((prev) => ({ ...prev, email: emailError }));
            }
            return;
        }

        setResetSubmitting(true);
        setResetError('');
        try {
            const result = await sendPasswordResetCode(resetForm.email);
            if (result.success) {
                setResetCodeSent(true);
                startCountdown(setResetCountdown, resetCountdownTimerRef);
                await showToast(result.message || '重置验证码已发送，请注意查收邮箱');
                return;
            }

            setResetError(result.message || '发送重置验证码失败');
        } catch {
            setResetError('发送重置验证码失败');
        } finally {
            setResetSubmitting(false);
        }
    };

    const handleResetPasswordSubmit = async (e) => {
        e.preventDefault();

        if (!validateResetForm()) {
            return;
        }

        setResetSubmitting(true);
        setResetError('');
        try {
            const result = await resetPassword(
                resetForm.email,
                resetForm.code,
                resetForm.newPassword,
            );

            if (result.success) {
                await showToast(result.message || '密码重置成功，请使用新密码登录');
                setIdentity(normalizeEmail(resetForm.email));
                setPassword('');
                setIsRegister(false);
                setError('');
                setFieldErrors({});
                resetRegisterVerificationState();
                handleCloseResetModal();
                return;
            }

            const mappedErrors = mapResetErrorToFields(result.message);
            if (mappedErrors) {
                setResetFieldErrors((prev) => ({ ...prev, ...mappedErrors }));
            }
            setResetError(result.message || '密码重置失败');
        } catch {
            setResetError('密码重置失败');
        } finally {
            setResetSubmitting(false);
        }
    };

    const registerSubmitText = isRegister && codeSent && code.trim() ? '校验并注册' : '注册';

    return (
        <div className="min-h-[100dvh] flex flex-col bg-gradient-to-br from-primary/5 via-background-light to-secondary/10 dark:from-gray-900 dark:via-background-dark dark:to-gray-800">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 right-0 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />
            </div>

            <MotionDiv
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative z-10 flex-1 flex flex-col justify-center px-6 py-8"
                style={{ paddingBottom: isKeyboardVisible ? '20px' : undefined }}
            >
                <div className="w-full max-w-md mx-auto">
                    <MotionDiv
                        className="text-center mb-8"
                        animate={{
                            height: isKeyboardVisible ? 0 : 'auto',
                            opacity: isKeyboardVisible ? 0 : 1,
                            marginBottom: isKeyboardVisible ? 0 : 32,
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
                    </MotionDiv>

                    <div className="space-y-6">
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
                                        setError('');
                                        clearFieldError('username');
                                    }}
                                    placeholder="支持中文、字母、数字、_-"
                                    icon="person"
                                    error={fieldErrors.username}
                                    validate={validateUsername}
                                    required
                                />
                            )}

                            <FormField
                                id="identity"
                                label={isRegister ? '电子邮箱' : '用户名或邮箱'}
                                type={isRegister ? 'email' : 'text'}
                                value={identity}
                                onChange={(val) => {
                                    if (isRegister && codeSent && normalizeEmail(val) !== normalizeEmail(identity)) {
                                        resetRegisterVerificationState();
                                    }

                                    setIdentity(val);
                                    setError('');
                                    clearFieldError('email');
                                }}
                                placeholder={isRegister ? 'example@email.com' : '请输入用户名或邮箱'}
                                icon="email"
                                error={fieldErrors.email}
                                validate={isRegister ? validateEmail : validateLoginIdentity}
                                required
                            />

                            <FormField
                                id="password"
                                label="密码"
                                type="password"
                                value={password}
                                onChange={(val) => {
                                    setPassword(val);
                                    setError('');
                                    clearFieldError('password');
                                }}
                                placeholder={isRegister ? '至少 6 个字符，最多 72 字节' : '请输入密码'}
                                icon="lock"
                                error={fieldErrors.password}
                                validate={isRegister ? validateRegisterPassword : undefined}
                                required
                                showPasswordToggle
                            />
                            {isRegister && (
                                <p className="text-xs text-text-muted-light dark:text-text-muted-dark leading-5 -mt-2 px-1">
                                    {PASSWORD_HELPER_TEXT}
                                </p>
                            )}

                            {isRegister && (
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-text-main-light dark:text-text-main-dark" htmlFor="code">
                                        验证码（可选）
                                    </label>
                                    <div className="flex gap-3">
                                        <div className={`flex-1 bg-surface-light dark:bg-gray-800 rounded-xl border transition-all flex items-center px-4 py-3 ${
                                            fieldErrors.code
                                                ? 'border-red-400 focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-500/10'
                                                : 'border-gray-200 dark:border-gray-700 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20'
                                        }`}>
                                            <span className="material-icons-round text-text-muted-light dark:text-text-muted-dark mr-3 text-xl">pin</span>
                                            <input
                                                className="bg-transparent border-none p-0 w-full text-sm font-medium focus:ring-0 focus:outline-none placeholder-gray-400 dark:placeholder-gray-500"
                                                id="code"
                                                placeholder="6位数字验证码"
                                                type="text"
                                                inputMode="numeric"
                                                maxLength={6}
                                                value={code}
                                                onChange={(e) => {
                                                    setCode(e.target.value.replace(/[^\d]/g, ''));
                                                    setError('');
                                                    clearFieldError('code');
                                                }}
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleSendCode}
                                            disabled={countdown > 0 || !identity.trim() || isLoading}
                                            className="px-5 py-3 bg-primary hover:bg-primary/90 text-white dark:text-gray-900 rounded-xl font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap transition-all active:scale-95 shadow-sm"
                                        >
                                            {countdown > 0 ? `${countdown}s` : codeSent ? '重新发送' : '发送'}
                                        </button>
                                    </div>
                                    <p className="text-xs text-text-muted-light dark:text-text-muted-dark leading-5">
                                        {codeSent
                                            ? '验证码已发送到当前邮箱。若修改邮箱地址，需要重新发送验证码。'
                                            : '可直接注册；如需先完成邮箱校验，请先发送验证码，再填写 6 位数字验证码后提交。'}
                                    </p>
                                    {fieldErrors.code && (
                                        <p className="text-xs text-red-500">{fieldErrors.code}</p>
                                    )}
                                </div>
                            )}

                            {!isRegister && (
                                <div className="flex justify-between items-center gap-4">
                                    <p className="text-xs text-text-muted-light dark:text-text-muted-dark">
                                        支持使用用户名或邮箱登录
                                    </p>
                                    <button
                                        type="button"
                                        onClick={handleOpenResetModal}
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
                                        <span>{isRegister ? registerSubmitText : '登录'}</span>
                                        <span className="material-icons-round text-xl">arrow_forward</span>
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="mt-6 text-center">
                            <p className="text-sm text-text-muted-light dark:text-text-muted-dark">
                                {isRegister ? '已有账号？' : '还没有账号？'}
                                <button
                                    onClick={handleToggleAuthMode}
                                    className="ml-2 font-bold text-primary hover:text-primary/80 transition-colors"
                                >
                                    {isRegister ? '立即登录' : '立即注册'}
                                </button>
                            </p>
                        </div>
                    </div>

                    <div className="mt-6 space-y-3">
                        {mockEnabled && !showMockOverride && (
                            <MotionDiv
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded-xl text-xs text-center backdrop-blur-sm"
                            >
                                <span className="material-icons-round text-sm align-middle mr-1">info</span>
                                未检测到后端服务，已自动切换为演示模式
                            </MotionDiv>
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
            </MotionDiv>

            <AnimatePresence>
                {resetModalOpen && (
                    <MotionDiv
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-30 flex items-center justify-center p-4"
                    >
                        <div
                            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                            onClick={handleCloseResetModal}
                        />

                        <MotionDiv
                            initial={{ opacity: 0, y: 20, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 20, scale: 0.96 }}
                            transition={{ type: 'spring', damping: 24, stiffness: 260 }}
                            className="relative w-full max-w-md rounded-3xl bg-white dark:bg-surface-dark shadow-2xl p-6"
                        >
                            <div className="flex items-start justify-between gap-4 mb-5">
                                <div>
                                    <h2 className="text-xl font-bold text-text-main-light dark:text-text-main-dark">
                                        重置密码
                                    </h2>
                                    <p className="mt-2 text-sm text-text-muted-light dark:text-text-muted-dark leading-6">
                                        请输入注册邮箱。若该邮箱已注册，系统会发送 6 位验证码；收到后再设置新密码。
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleCloseResetModal}
                                    className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-text-muted-light dark:text-text-muted-dark hover:text-primary transition-colors"
                                >
                                    <span className="material-icons-round">close</span>
                                </button>
                            </div>

                            <AnimatePresence>
                                {resetError && (
                                    <ErrorAlert error={resetError} onClose={() => setResetError('')} />
                                )}
                            </AnimatePresence>

                            <form onSubmit={handleResetPasswordSubmit} className="space-y-4 mt-4" noValidate>
                                <FormField
                                    id="reset-email"
                                    label="注册邮箱"
                                    type="email"
                                    value={resetForm.email}
                                    onChange={(val) => handleResetFormChange('email', val)}
                                    placeholder="example@email.com"
                                    icon="email"
                                    error={resetFieldErrors.email}
                                    validate={validateEmail}
                                    required
                                />

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-text-main-light dark:text-text-main-dark" htmlFor="reset-code">
                                        验证码
                                    </label>
                                    <div className="flex gap-3">
                                        <div className={`flex-1 bg-surface-light dark:bg-gray-800 rounded-xl border transition-all flex items-center px-4 py-3 ${
                                            resetFieldErrors.code
                                                ? 'border-red-400 focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-500/10'
                                                : 'border-gray-200 dark:border-gray-700 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20'
                                        }`}>
                                            <span className="material-icons-round text-text-muted-light dark:text-text-muted-dark mr-3 text-xl">mark_email_read</span>
                                            <input
                                                id="reset-code"
                                                type="text"
                                                inputMode="numeric"
                                                maxLength={6}
                                                value={resetForm.code}
                                                onChange={(e) => handleResetFormChange('code', e.target.value.replace(/[^\d]/g, ''))}
                                                placeholder="6位数字验证码"
                                                className="bg-transparent border-none p-0 w-full text-sm font-medium focus:ring-0 focus:outline-none placeholder-gray-400 dark:placeholder-gray-500"
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleSendResetCode}
                                            disabled={resetCountdown > 0 || !resetForm.email.trim() || resetSubmitting}
                                            className="px-5 py-3 bg-primary hover:bg-primary/90 text-white dark:text-gray-900 rounded-xl font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap transition-all active:scale-95 shadow-sm"
                                        >
                                            {resetCountdown > 0 ? `${resetCountdown}s` : resetCodeSent ? '重新发送' : '发送'}
                                        </button>
                                    </div>
                                    <p className="text-xs text-text-muted-light dark:text-text-muted-dark leading-5">
                                        {resetCodeSent
                                            ? '验证码已发送到当前邮箱。若修改邮箱地址，需要重新发送验证码。'
                                            : '如果该邮箱已注册，您将收到 6 位数字验证码。'}
                                    </p>
                                    {resetFieldErrors.code && (
                                        <p className="text-xs text-red-500">{resetFieldErrors.code}</p>
                                    )}
                                </div>

                                <FormField
                                    id="reset-password"
                                    label="新密码"
                                    type="password"
                                    value={resetForm.newPassword}
                                    onChange={(val) => handleResetFormChange('newPassword', val)}
                                    placeholder="至少 6 个字符，最多 72 字节"
                                    icon="lock_reset"
                                    error={resetFieldErrors.newPassword}
                                    validate={validateRegisterPassword}
                                    required
                                    showPasswordToggle
                                />
                                <p className="text-xs text-text-muted-light dark:text-text-muted-dark leading-5 -mt-2 px-1">
                                    {PASSWORD_HELPER_TEXT}
                                </p>

                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={handleCloseResetModal}
                                        className="flex-1 py-3 px-4 rounded-xl bg-gray-100 dark:bg-gray-800 text-text-main-light dark:text-text-main-dark font-bold transition-all active:scale-[0.98]"
                                    >
                                        取消
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={resetSubmitting}
                                        className="flex-1 py-3 px-4 rounded-xl bg-primary text-white dark:text-gray-900 font-bold transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {resetSubmitting ? '提交中...' : '确认重置'}
                                    </button>
                                </div>
                            </form>
                        </MotionDiv>
                    </MotionDiv>
                )}
            </AnimatePresence>
        </div>
    );
}
