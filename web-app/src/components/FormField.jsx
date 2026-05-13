import React, { useState } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { Field, FieldError, FieldLabel } from './ui/field';
import { Input } from './ui/input';

/**
 * 自定义表单字段组件
 * 实现内联验证，替代浏览器原生验证气泡
 * 
 * @param {string} id - 输入框 ID
 * @param {string} label - 标签文字
 * @param {string} type - 输入类型
 * @param {string} value - 当前值
 * @param {function} onChange - 值变化回调
 * @param {string} placeholder - 占位符
 * @param {string} icon - Material Icons 图标名称
 * @param {string} error - 外部传入的错误信息
 * @param {boolean} required - 是否必填
 * @param {function} validate - 自定义验证函数，返回错误信息或空字符串
 * @param {boolean} showPasswordToggle - 是否显示密码切换按钮
 */
export default function FormField({
    id,
    label,
    type = 'text',
    value,
    onChange,
    placeholder,
    icon,
    error: externalError,
    required = false,
    validate,
    showPasswordToggle = false,
    className = '',
    ...props
}) {
    const [showPassword, setShowPassword] = useState(false);
    const [touched, setTouched] = useState(false);

    // 验证逻辑
    const validateField = (val) => {
        // 必填验证
        if (required && !val.trim()) {
            return '此字段为必填项';
        }

        // 邮箱格式验证
        if (type === 'email' && val.trim()) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(val)) {
                return '请输入有效的邮箱地址';
            }
        }

        // 密码最小长度验证
        if (type === 'password' && val.trim() && val.length < 6) {
            return '密码至少需要 6 个字符';
        }

        // 自定义验证
        if (validate) {
            return validate(val);
        }

        return '';
    };

    // 使用外部错误或内部验证错误
    const displayError = externalError || (touched ? validateField(value) : '');
    const hasError = !!displayError;

    // 失焦时触发验证
    const handleBlur = () => {
        setTouched(true);
    };

    const inputType = showPasswordToggle && type === 'password'
        ? (showPassword ? 'text' : 'password')
        : type;

    return (
        <Field className={`items-stretch gap-1 ${className}`}>
            {label && (
                <FieldLabel
                    className="text-xs font-bold text-text-muted-light uppercase tracking-wider ml-1"
                    htmlFor={id}
                >
                    {label}
                    {required && <span className="text-red-500 ml-0.5">*</span>}
                </FieldLabel>
            )}

            <div className="relative w-full">
                {icon && (
                    <span className={`material-icons-round pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 ${hasError ? 'text-red-400' : 'text-text-muted-light'}`}>
                        {icon}
                    </span>
                )}

                <Input
                    aria-invalid={hasError || undefined}
                    className={`
                        w-full bg-surface-light dark:bg-surface-dark rounded-xl shadow-sm transition-all duration-200
                        ${hasError
                            ? 'border-red-400 focus-within:border-red-500 focus-within:ring-4 focus-within:ring-red-500/10'
                            : 'border-transparent focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10'
                        }
                        [&_[data-slot=input]]:h-auto [&_[data-slot=input]]:py-3 [&_[data-slot=input]]:text-sm [&_[data-slot=input]]:font-medium [&_[data-slot=input]]:focus:ring-0
                        ${icon ? '[&_[data-slot=input]]:pl-12' : '[&_[data-slot=input]]:pl-4'}
                        ${showPasswordToggle && type === 'password' ? '[&_[data-slot=input]]:pr-12' : '[&_[data-slot=input]]:pr-4'}
                    `}
                    id={id}
                    nativeInput
                    onBlur={handleBlur}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    type={inputType}
                    unstyled
                    value={value}
                    {...props}
                />

                {showPasswordToggle && type === 'password' && (
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? '隐藏密码' : '显示密码'}
                        className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded text-text-muted-light transition-colors hover:text-text-main-light focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 active:scale-95 cursor-pointer"
                    >
                        <span className="material-icons-round">
                            {showPassword ? 'visibility' : 'visibility_off'}
                        </span>
                    </button>
                )}
            </div>

            <AnimatePresence>
                {displayError && (
                    <Motion.div
                        initial={{ opacity: 0, y: -5, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: 'auto' }}
                        exit={{ opacity: 0, y: -5, height: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <FieldError
                            className="ml-1 flex items-center gap-1 text-sm text-red-500"
                            match={false}
                        >
                            <span className="material-icons-round text-sm">error_outline</span>
                            {displayError}
                        </FieldError>
                    </Motion.div>
                )}
            </AnimatePresence>
        </Field>
    );
}
