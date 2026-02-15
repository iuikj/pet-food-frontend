import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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
    const [internalError, setInternalError] = useState('');

    // 使用外部错误或内部验证错误
    const displayError = externalError || (touched ? internalError : '');
    const hasError = !!displayError;

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

    // 失焦时触发验证
    const handleBlur = () => {
        setTouched(true);
        setInternalError(validateField(value));
    };

    // 值变化时重新验证（仅在已触摸后）
    useEffect(() => {
        if (touched) {
            setInternalError(validateField(value));
        }
    }, [value, touched]);

    const inputType = showPasswordToggle && type === 'password'
        ? (showPassword ? 'text' : 'password')
        : type;

    return (
        <div className={`space-y-1 ${className}`}>
            {label && (
                <label
                    className="text-xs font-bold text-text-muted-light uppercase tracking-wider ml-1"
                    htmlFor={id}
                >
                    {label}
                    {required && <span className="text-red-500 ml-0.5">*</span>}
                </label>
            )}

            <div
                className={`
                    bg-surface-light dark:bg-surface-dark rounded-xl shadow-sm 
                    border-2 transition-all duration-200
                    flex items-center px-4 py-3
                    ${hasError
                        ? 'border-red-400 focus-within:border-red-500 focus-within:ring-4 focus-within:ring-red-500/10'
                        : 'border-transparent focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10'
                    }
                `}
            >
                {icon && (
                    <span className={`material-icons-round mr-3 ${hasError ? 'text-red-400' : 'text-text-muted-light'}`}>
                        {icon}
                    </span>
                )}

                <input
                    id={id}
                    type={inputType}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onBlur={handleBlur}
                    placeholder={placeholder}
                    className="bg-transparent border-none p-0 w-full text-sm font-medium focus:ring-0 focus:outline-none placeholder-gray-400"
                    {...props}
                />

                {showPasswordToggle && type === 'password' && (
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-text-muted-light hover:text-text-main-light focus:outline-none transition-colors ml-2 active:scale-95"
                    >
                        <span className="material-icons-round">
                            {showPassword ? 'visibility' : 'visibility_off'}
                        </span>
                    </button>
                )}
            </div>

            {/* 错误提示 */}
            <AnimatePresence>
                {displayError && (
                    <motion.p
                        initial={{ opacity: 0, y: -5, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: 'auto' }}
                        exit={{ opacity: 0, y: -5, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="text-sm text-red-500 ml-1 flex items-center gap-1"
                    >
                        <span className="material-icons-round text-sm">error_outline</span>
                        {displayError}
                    </motion.p>
                )}
            </AnimatePresence>
        </div>
    );
}
