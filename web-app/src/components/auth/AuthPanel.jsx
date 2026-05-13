import React, { useEffect, useRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useUser } from '../../hooks/useUser';
import { Button } from '../ui/button';
import { Field, FieldDescription, FieldError, FieldLabel } from '../ui/field';
import { Input } from '../ui/input';
import { OTPField, OTPFieldInput, OTPFieldSeparator } from '../ui/otp-field';
import { showToast } from '../../utils/toast';

const USERNAME_REGEX = /^[\u4e00-\u9fffA-Za-z0-9_-]+$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MAX_BYTES = 72;
const PASSWORD_HELPER_TEXT = '密码至少 6 个字符。支持中文、英文和符号；若包含中文或表情，可用长度会更短。';

function normalizeEmail(value) {
    return value.trim().toLowerCase();
}

function getUtf8ByteLength(value) {
    return new TextEncoder().encode(value).length;
}

function validateUsername(value) {
    const normalized = value.trim();
    if (!normalized) return '请输入用户名';
    if (normalized.length < 3 || normalized.length > 50) return '用户名需为 3-50 个字符';
    if (!USERNAME_REGEX.test(normalized)) return '用户名只能包含中文、字母、数字、下划线和连字符';
    return '';
}

function validateEmail(value) {
    const normalized = normalizeEmail(value);
    if (!normalized) return '请输入邮箱地址';
    if (!EMAIL_REGEX.test(normalized)) return '请输入有效的邮箱地址';
    return '';
}

function validateLoginIdentity(value) {
    const normalized = value.trim();
    if (!normalized) return '请输入用户名或邮箱';
    if (normalized.includes('@') && !EMAIL_REGEX.test(normalizeEmail(value))) return '请输入有效的邮箱地址';
    return '';
}

function validateRegisterPassword(value) {
    if (!value) return '请输入密码';
    if (value.length < 6) return '密码至少需要 6 个字符';
    if (getUtf8ByteLength(value) > PASSWORD_MAX_BYTES) return '密码最多支持 72 字节（UTF-8）';
    return '';
}

function validateVerificationCode(value, required = false) {
    const normalized = value.trim();
    if (!normalized) return required ? '请输入 6 位验证码' : '';
    if (!/^\d{6}$/.test(normalized)) return '验证码需为 6 位数字';
    return '';
}

function mapRegisterErrorToFields(message) {
    if (!message) return null;
    if (message.includes('用户名')) return { username: message };
    if (message.includes('邮箱')) return { email: message };
    if (message.includes('密码')) return { password: message };
    if (message.includes('验证码')) return { code: message };
    return null;
}

function mapLoginErrorToFields(message) {
    if (!message) return null;
    if (message.includes('用户名或密码错误')) return { password: message };
    if (message.includes('邮箱') || message.includes('用户名')) return { email: message };
    if (message.includes('密码')) return { password: message };
    return null;
}

function mapResetErrorToFields(message) {
    if (!message) return null;
    if (message.includes('邮箱')) return { email: message };
    if (message.includes('验证码')) return { code: message };
    if (message.includes('密码')) return { newPassword: message };
    return null;
}

function AuthTextField({
    error,
    helper,
    icon,
    id,
    label,
    onClearError,
    onValueChange,
    trailing,
    value,
    ...props
}) {
    return (
        <Field className="items-stretch gap-2" name={id}>
            <FieldLabel className="text-sm font-semibold text-text-main-light dark:text-text-main-dark">
                {label}
            </FieldLabel>
            <div className="relative">
                {icon ? (
                    <span className="material-icons-round absolute left-4 top-1/2 z-10 -translate-y-1/2 text-xl text-text-muted-light dark:text-text-muted-dark">
                        {icon}
                    </span>
                ) : null}
                <Input
                    aria-invalid={Boolean(error) || undefined}
                    id={id}
                    nativeInput
                    onChange={(event) => {
                        onValueChange(event.target.value);
                        onClearError?.();
                    }}
                    unstyled
                    value={value}
                    className={`w-full rounded-2xl bg-white shadow-soft transition-all focus-within:ring-2 focus-within:ring-primary/50 dark:bg-surface-dark ${error ? 'ring-2 ring-red-500/25' : ''} [&_[data-slot=input]]:h-auto [&_[data-slot=input]]:py-4 [&_[data-slot=input]]:text-text-main-light dark:[&_[data-slot=input]]:text-text-main-dark ${icon ? '[&_[data-slot=input]]:pl-12' : '[&_[data-slot=input]]:pl-5'} ${trailing ? '[&_[data-slot=input]]:pr-12' : '[&_[data-slot=input]]:pr-4'}`}
                    {...props}
                />
                {trailing}
            </div>
            {helper ? <FieldDescription>{helper}</FieldDescription> : null}
            {error ? <FieldError>{error}</FieldError> : null}
        </Field>
    );
}

function VerificationCodeField({ value, onChange, invalid, ariaLabel }) {
    return (
        <OTPField
            aria-label={ariaLabel}
            className="shrink-0 gap-1.5"
            length={6}
            onValueChange={(nextValue) => onChange(nextValue.replace(/[^\d]/g, '').slice(0, 6))}
            validationType="numeric"
            value={value}
        >
            {Array.from({ length: 6 }, (_, index) => (
                <React.Fragment key={index}>
                    {index === 3 && <OTPFieldSeparator />}
                    <OTPFieldInput
                        aria-invalid={invalid || undefined}
                        aria-label={`${ariaLabel}第 ${index + 1} 位`}
                        className="size-8 rounded-xl bg-surface-light dark:bg-gray-800 sm:size-8"
                    />
                </React.Fragment>
            ))}
        </OTPField>
    );
}

export default function AuthPanel({
    contextLabel,
    initialEmail = '',
    mode = 'page',
    onModeChange,
    onSubmittingChange,
    onSuccess,
    showMockControls = false,
    mockControls = null,
    view,
}) {
    const {
        login,
        register,
        sendCode,
        verifyRegister,
        sendPasswordResetCode,
        resetPassword,
    } = useUser();

    const [authView, setAuthView] = useState('login');
    const [identity, setIdentity] = useState(initialEmail);
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [code, setCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [codeSent, setCodeSent] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const [fieldErrors, setFieldErrors] = useState({});
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [resetForm, setResetForm] = useState({ email: initialEmail, code: '', newPassword: '' });
    const [resetFieldErrors, setResetFieldErrors] = useState({});
    const [resetCodeSent, setResetCodeSent] = useState(false);
    const [resetCountdown, setResetCountdown] = useState(0);
    const countdownTimerRef = useRef(null);
    const resetCountdownTimerRef = useRef(null);
    const syncingExternalViewRef = useRef(false);

    const titleMap = {
        login: '继续你的宠物营养规划',
        register: '创建你的宠物档案空间',
        reset: '找回访问权限',
    };
    const descriptionMap = {
        login: '登录后同步宠物档案、饮食计划和提醒。',
        register: '创建账号后即可保存宠物档案和专属饮食计划。',
        reset: '输入注册邮箱，完成验证后设置新密码。',
    };

    useEffect(() => {
        if (syncingExternalViewRef.current) {
            syncingExternalViewRef.current = false;
            return;
        }
        onModeChange?.(authView);
    }, [authView, onModeChange]);

    useEffect(() => {
        if (view && view !== authView) {
            syncingExternalViewRef.current = true;
            setAuthView(view);
            setError('');
        }
    }, [authView, view]);

    useEffect(() => {
        onSubmittingChange?.(isLoading);
    }, [isLoading, onSubmittingChange]);

    useEffect(() => () => {
        if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
        if (resetCountdownTimerRef.current) clearInterval(resetCountdownTimerRef.current);
    }, []);

    const startCountdown = (setCountdownState, timerRef) => {
        setCountdownState(60);
        if (timerRef.current) clearInterval(timerRef.current);
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

    const clearFieldError = (field) => {
        setError('');
        setFieldErrors((prev) => {
            const next = { ...prev };
            delete next[field];
            return next;
        });
    };

    const clearResetFieldError = (field) => {
        setError('');
        setResetFieldErrors((prev) => {
            const next = { ...prev };
            delete next[field];
            return next;
        });
    };

    const switchView = (nextView) => {
        setAuthView(nextView);
        setError('');
        setFieldErrors({});
        setResetFieldErrors({});
        setPassword('');
        setPasswordVisible(false);
        if (nextView === 'register') setUsername('');
        if (nextView === 'reset') {
            setResetForm({ email: identity.includes('@') ? normalizeEmail(identity) : '', code: '', newPassword: '' });
        }
    };

    const validateAuthForm = () => {
        const errors = {};
        if (authView === 'register') {
            const emailError = validateEmail(identity);
            const usernameError = validateUsername(username);
            const passwordError = validateRegisterPassword(password);
            if (emailError) errors.email = emailError;
            if (usernameError) errors.username = usernameError;
            if (passwordError) errors.password = passwordError;
            if (code.trim()) {
                const codeError = validateVerificationCode(code, false);
                if (codeError) errors.code = codeError;
            }
        } else {
            const identityError = validateLoginIdentity(identity);
            if (identityError) errors.email = identityError;
            if (!password.trim()) errors.password = '请输入密码';
            else if (password.length < 6) errors.password = '密码至少需要 6 个字符';
        }
        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const validateResetForm = () => {
        const errors = {};
        const emailError = validateEmail(resetForm.email);
        const codeError = validateVerificationCode(resetForm.code, true);
        const passwordError = validateRegisterPassword(resetForm.newPassword);
        if (emailError) errors.email = emailError;
        if (codeError) errors.code = codeError;
        if (passwordError) errors.newPassword = passwordError;
        setResetFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSendCode = async () => {
        const emailError = validateEmail(identity);
        if (emailError || countdown > 0) {
            if (emailError) setFieldErrors((prev) => ({ ...prev, email: emailError }));
            return;
        }
        setIsLoading(true);
        setError('');
        try {
            const result = await sendCode(normalizeEmail(identity), 'register');
            if (result.success) {
                setCodeSent(true);
                startCountdown(setCountdown, countdownTimerRef);
                await showToast.success(result.message || '验证码已发送，请注意查收邮箱');
            } else {
                setError(result.message || '发送验证码失败');
            }
        } catch {
            setError('发送验证码失败');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!validateAuthForm()) return;
        setIsLoading(true);
        setError('');
        try {
            if (authView === 'register') {
                const normalizedCode = code.trim();
                if (normalizedCode && !codeSent) {
                    setFieldErrors((prev) => ({ ...prev, code: '请先发送验证码，再填写收到的 6 位数字验证码' }));
                    return;
                }
                const normalizedEmail = normalizeEmail(identity);
                const normalizedUsername = username.trim();
                const result = codeSent && normalizedCode
                    ? await verifyRegister(normalizedEmail, normalizedCode, normalizedUsername, password)
                    : await register(normalizedUsername, normalizedEmail, password);
                if (result.success) {
                    onSuccess?.();
                    return;
                }
                const mappedErrors = mapRegisterErrorToFields(result.message);
                if (mappedErrors) setFieldErrors((prev) => ({ ...prev, ...mappedErrors }));
                setError(result.message || '注册失败');
                return;
            }

            const result = await login(identity, password);
            if (result.success) {
                onSuccess?.();
                return;
            }
            const message = result.message || '登录失败，请检查用户名/邮箱和密码';
            const mappedErrors = mapLoginErrorToFields(message);
            if (mappedErrors) setFieldErrors((prev) => ({ ...prev, ...mappedErrors }));
            setError(message);
        } catch {
            setError(authView === 'register' ? '注册失败' : '登录失败，请检查用户名/邮箱和密码');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendResetCode = async () => {
        const emailError = validateEmail(resetForm.email);
        if (emailError || resetCountdown > 0) {
            if (emailError) setResetFieldErrors((prev) => ({ ...prev, email: emailError }));
            return;
        }
        setIsLoading(true);
        setError('');
        try {
            const result = await sendPasswordResetCode(resetForm.email);
            if (result.success) {
                setResetCodeSent(true);
                startCountdown(setResetCountdown, resetCountdownTimerRef);
                await showToast.success(result.message || '重置验证码已发送，请注意查收邮箱');
            } else {
                setError(result.message || '发送重置验证码失败');
            }
        } catch {
            setError('发送重置验证码失败');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetSubmit = async (event) => {
        event.preventDefault();
        if (!validateResetForm()) return;
        setIsLoading(true);
        setError('');
        try {
            const result = await resetPassword(resetForm.email, resetForm.code, resetForm.newPassword);
            if (result.success) {
                await showToast.success(result.message || '密码重置成功，请使用新密码登录');
                setIdentity(normalizeEmail(resetForm.email));
                switchView('login');
                return;
            }
            const mappedErrors = mapResetErrorToFields(result.message);
            if (mappedErrors) setResetFieldErrors((prev) => ({ ...prev, ...mappedErrors }));
            setError(result.message || '密码重置失败');
        } catch {
            setError('密码重置失败');
        } finally {
            setIsLoading(false);
        }
    };

    const passwordToggle = (
        <button
            aria-label={passwordVisible ? '隐藏密码' : '显示密码'}
            className="absolute right-4 top-1/2 z-10 -translate-y-1/2 text-text-muted-light transition-colors hover:text-primary dark:text-text-muted-dark"
            onClick={() => setPasswordVisible((prev) => !prev)}
            type="button"
        >
            {passwordVisible ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
        </button>
    );

    return (
        <div className={mode === 'drawer' ? 'flex min-h-0 flex-1 flex-col' : 'w-full'}>
            <div className="mb-6 space-y-3">
                {contextLabel ? (
                    <div className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                        {contextLabel}
                    </div>
                ) : null}
                <div>
                    <h1 className="text-2xl font-bold text-text-main-light dark:text-text-main-dark">
                        {titleMap[authView]}
                    </h1>
                    <p className="mt-2 text-sm leading-6 text-text-muted-light dark:text-text-muted-dark">
                        {descriptionMap[authView]}
                    </p>
                </div>
            </div>

            {error ? (
                <div className="mb-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600 dark:bg-red-950/30 dark:text-red-300">
                    {error}
                </div>
            ) : null}

            {authView === 'reset' ? (
                <form className="contents" noValidate onSubmit={handleResetSubmit}>
                    <div className="space-y-4">
                        <AuthTextField
                            autoComplete="email"
                            error={resetFieldErrors.email}
                            icon="email"
                            id="reset-email"
                            label="注册邮箱"
                            onClearError={() => clearResetFieldError('email')}
                            onValueChange={(value) => {
                                setResetForm((prev) => ({ ...prev, email: value, code: '' }));
                                setResetCodeSent(false);
                            }}
                            placeholder="example@email.com"
                            type="email"
                            value={resetForm.email}
                        />
                        <Field className="items-stretch gap-2">
                            <FieldLabel className="text-sm font-semibold text-text-main-light dark:text-text-main-dark">验证码</FieldLabel>
                            <div className="flex gap-3">
                                <VerificationCodeField
                                    ariaLabel="重置验证码"
                                    invalid={Boolean(resetFieldErrors.code)}
                                    onChange={(nextCode) => {
                                        setResetForm((prev) => ({ ...prev, code: nextCode }));
                                        clearResetFieldError('code');
                                    }}
                                    value={resetForm.code}
                                />
                                <Button
                                    className="h-auto rounded-xl px-5"
                                    disabled={resetCountdown > 0 || !resetForm.email.trim() || isLoading}
                                    onClick={handleSendResetCode}
                                    type="button"
                                >
                                    {resetCountdown > 0 ? `${resetCountdown}s` : resetCodeSent ? '重新发送' : '发送'}
                                </Button>
                            </div>
                            {resetFieldErrors.code ? <FieldError>{resetFieldErrors.code}</FieldError> : null}
                        </Field>
                        <AuthTextField
                            autoComplete="new-password"
                            error={resetFieldErrors.newPassword}
                            helper={PASSWORD_HELPER_TEXT}
                            icon="lock"
                            id="reset-password"
                            label="新密码"
                            onClearError={() => clearResetFieldError('newPassword')}
                            onValueChange={(value) => setResetForm((prev) => ({ ...prev, newPassword: value }))}
                            placeholder="至少 6 个字符，最多 72 字节"
                            trailing={passwordToggle}
                            type={passwordVisible ? 'text' : 'password'}
                            value={resetForm.newPassword}
                        />
                    </div>
                    <AuthActions
                        loading={isLoading}
                        primaryText="重置密码"
                        secondaryText="返回登录"
                        onSecondary={() => switchView('login')}
                    />
                </form>
            ) : (
                <form className="contents" noValidate onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        {authView === 'register' ? (
                            <AuthTextField
                                autoComplete="username"
                                error={fieldErrors.username}
                                icon="person"
                                id="username"
                                label="用户名"
                                onClearError={() => clearFieldError('username')}
                                onValueChange={setUsername}
                                placeholder="支持中文、字母、数字、_-"
                                type="text"
                                value={username}
                            />
                        ) : null}
                        <AuthTextField
                            autoComplete={authView === 'register' ? 'email' : 'username'}
                            error={fieldErrors.email}
                            icon="email"
                            id="identity"
                            label={authView === 'register' ? '电子邮箱' : '用户名或邮箱'}
                            onClearError={() => clearFieldError('email')}
                            onValueChange={(value) => {
                                if (authView === 'register' && codeSent && normalizeEmail(value) !== normalizeEmail(identity)) {
                                    setCode('');
                                    setCodeSent(false);
                                }
                                setIdentity(value);
                            }}
                            placeholder={authView === 'register' ? 'example@email.com' : '请输入用户名或邮箱'}
                            type={authView === 'register' ? 'email' : 'text'}
                            value={identity}
                        />
                        <AuthTextField
                            autoComplete={authView === 'register' ? 'new-password' : 'current-password'}
                            error={fieldErrors.password}
                            helper={authView === 'register' ? PASSWORD_HELPER_TEXT : null}
                            icon="lock"
                            id="password"
                            label="密码"
                            onClearError={() => clearFieldError('password')}
                            onValueChange={setPassword}
                            placeholder={authView === 'register' ? '至少 6 个字符，最多 72 字节' : '请输入密码'}
                            trailing={passwordToggle}
                            type={passwordVisible ? 'text' : 'password'}
                            value={password}
                        />
                        {authView === 'register' ? (
                            <Field className="items-stretch gap-2">
                                <FieldLabel className="text-sm font-semibold text-text-main-light dark:text-text-main-dark">验证码（可选）</FieldLabel>
                                <div className="flex gap-3">
                                    <VerificationCodeField
                                        ariaLabel="注册验证码"
                                        invalid={Boolean(fieldErrors.code)}
                                        onChange={(nextCode) => {
                                            setCode(nextCode);
                                            clearFieldError('code');
                                        }}
                                        value={code}
                                    />
                                    <Button
                                        className="h-auto rounded-xl px-5"
                                        disabled={countdown > 0 || !identity.trim() || isLoading}
                                        onClick={handleSendCode}
                                        type="button"
                                    >
                                        {countdown > 0 ? `${countdown}s` : codeSent ? '重新发送' : '发送'}
                                    </Button>
                                </div>
                                <FieldDescription>
                                    {codeSent ? '验证码已发送到当前邮箱。' : '可直接注册；如需先校验邮箱，请发送验证码。'}
                                </FieldDescription>
                                {fieldErrors.code ? <FieldError>{fieldErrors.code}</FieldError> : null}
                            </Field>
                        ) : (
                            <div className="flex items-center justify-between gap-4">
                                <p className="text-xs text-text-muted-light dark:text-text-muted-dark">支持使用用户名或邮箱登录</p>
                                <button
                                    className="text-sm font-semibold text-primary"
                                    onClick={() => switchView('reset')}
                                    type="button"
                                >
                                    忘记密码？
                                </button>
                            </div>
                        )}
                    </div>
                    <AuthActions
                        loading={isLoading}
                        primaryText={authView === 'register' ? (codeSent && code.trim() ? '校验并注册' : '创建账号') : '继续'}
                        secondaryText={authView === 'register' ? '已有账号？登录' : '还没有账号？创建账号'}
                        onSecondary={() => switchView(authView === 'register' ? 'login' : 'register')}
                    />
                </form>
            )}

            {showMockControls && mockControls ? (
                <div className="mt-6">{mockControls}</div>
            ) : null}
        </div>
    );
}

function AuthActions({ loading, onSecondary, primaryText, secondaryText }) {
    return (
        <div className="mt-6 space-y-4">
            <Button className="h-12 w-full rounded-2xl text-base font-bold" loading={loading} type="submit">
                {primaryText}
                {!loading ? <span className="material-icons-round text-xl">arrow_forward</span> : null}
            </Button>
            <button
                className="w-full text-center text-sm font-semibold text-primary"
                disabled={loading}
                onClick={onSecondary}
                type="button"
            >
                {secondaryText}
            </button>
        </div>
    );
}
