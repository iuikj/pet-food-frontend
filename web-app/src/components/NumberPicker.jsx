import React, { useState, useRef, useEffect, useCallback } from 'react';

/**
 * 数值选择器组件（步进器模式）
 * @param {number} value - 当前值
 * @param {function} onChange - 值变化回调
 * @param {number} min - 最小值
 * @param {number} max - 最大值
 * @param {number} step - 步进值
 * @param {string} unit - 单位标签
 * @param {string} label - 输入框标签
 * @param {string} placeholder - 占位符
 * @param {boolean} allowDecimal - 是否允许小数
 * @param {boolean} compact - 紧凑模式（缩小按钮和间距）
 */
export default function NumberPicker({
    value = 0,
    onChange,
    min = 0,
    max = 999,
    step = 1,
    unit = '',
    label = '',
    placeholder = '0',
    allowDecimal = false,
    compact = false,
}) {
    const intervalRef = useRef(null);
    const timeoutRef = useRef(null);
    const [isHolding, setIsHolding] = useState(false);

    // refs for touch event binding (non-passive)
    const decrementBtnRef = useRef(null);
    const incrementBtnRef = useRef(null);

    // 用 ref 保存最新的回调，避免 addEventListener 闭包过期
    const startIncrementRef = useRef(null);
    const startDecrementRef = useRef(null);
    const stopHoldingRef = useRef(null);

    const clampValue = useCallback((val) => {
        const num = parseFloat(val) || 0;
        return Math.max(min, Math.min(max, num));
    }, [min, max]);

    const handleIncrement = useCallback(() => {
        const newVal = clampValue((parseFloat(value) || 0) + step);
        onChange?.(allowDecimal ? newVal : Math.floor(newVal));
    }, [value, step, clampValue, onChange, allowDecimal]);

    const handleDecrement = useCallback(() => {
        const newVal = clampValue((parseFloat(value) || 0) - step);
        onChange?.(allowDecimal ? newVal : Math.floor(newVal));
    }, [value, step, clampValue, onChange, allowDecimal]);

    const startIncrement = useCallback(() => {
        handleIncrement();
        setIsHolding(true);
        timeoutRef.current = setTimeout(() => {
            intervalRef.current = setInterval(handleIncrement, 100);
        }, 400);
    }, [handleIncrement]);

    const startDecrement = useCallback(() => {
        handleDecrement();
        setIsHolding(true);
        timeoutRef.current = setTimeout(() => {
            intervalRef.current = setInterval(handleDecrement, 100);
        }, 400);
    }, [handleDecrement]);

    const stopHolding = useCallback(() => {
        setIsHolding(false);
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    }, []);

    // 保持 ref 指向最新回调
    useEffect(() => {
        startIncrementRef.current = startIncrement;
        startDecrementRef.current = startDecrement;
        stopHoldingRef.current = stopHolding;
    });

    // 使用非 passive 的 touch 事件监听器（解决 preventDefault 警告）
    useEffect(() => {
        const decBtn = decrementBtnRef.current;
        const incBtn = incrementBtnRef.current;

        const handleDecTouchStart = (e) => {
            e.preventDefault();
            startDecrementRef.current?.();
        };
        const handleIncTouchStart = (e) => {
            e.preventDefault();
            startIncrementRef.current?.();
        };
        const handleTouchEnd = (e) => {
            e.preventDefault();
            stopHoldingRef.current?.();
        };

        if (decBtn) {
            decBtn.addEventListener('touchstart', handleDecTouchStart, { passive: false });
            decBtn.addEventListener('touchend', handleTouchEnd, { passive: false });
        }
        if (incBtn) {
            incBtn.addEventListener('touchstart', handleIncTouchStart, { passive: false });
            incBtn.addEventListener('touchend', handleTouchEnd, { passive: false });
        }

        return () => {
            if (decBtn) {
                decBtn.removeEventListener('touchstart', handleDecTouchStart);
                decBtn.removeEventListener('touchend', handleTouchEnd);
            }
            if (incBtn) {
                incBtn.removeEventListener('touchstart', handleIncTouchStart);
                incBtn.removeEventListener('touchend', handleTouchEnd);
            }
        };
    }, []);

    useEffect(() => {
        return () => {
            stopHolding();
        };
    }, [stopHolding]);

    const handleInputChange = (e) => {
        const inputVal = e.target.value;
        if (inputVal === '') {
            onChange?.('');
            return;
        }
        const regex = allowDecimal ? /^\d*\.?\d*$/ : /^\d*$/;
        if (regex.test(inputVal)) {
            onChange?.(inputVal);
        }
    };

    const handleBlur = () => {
        if (value !== '' && value !== undefined) {
            onChange?.(clampValue(value));
        }
    };

    // 按钮样式（使用纯 CSS active 状态替代 framer-motion whileTap）
    const buttonClass = compact
        ? `w-9 h-9 flex-shrink-0 rounded-xl flex items-center justify-center
           bg-primary/10 dark:bg-primary/20 text-primary
           font-bold text-lg
           active:bg-primary active:text-white active:scale-90
           transition-all duration-150
           touch-manipulation select-none`
        : `w-11 h-11 flex-shrink-0 rounded-xl flex items-center justify-center
           bg-primary/10 dark:bg-primary/20 text-primary
           font-bold text-xl
           active:bg-primary active:text-white active:scale-90
           transition-all duration-150
           touch-manipulation select-none`;

    return (
        <div className="space-y-2">
            {label && (
                <label className="text-sm font-semibold text-text-main-light dark:text-text-main-dark ml-1">
                    {label}
                </label>
            )}
            <div className={`flex items-center ${compact ? 'gap-1 p-1.5' : 'gap-2 p-2'} bg-background-light dark:bg-background-dark rounded-2xl shadow-inner`}>
                {/* 减少按钮 */}
                <button
                    ref={decrementBtnRef}
                    type="button"
                    className={buttonClass}
                    onMouseDown={startDecrement}
                    onMouseUp={stopHolding}
                    onMouseLeave={stopHolding}
                    disabled={parseFloat(value) <= min}
                >
                    <span className={`material-icons-round ${compact ? 'text-lg' : 'text-xl'}`}>remove</span>
                </button>

                {/* 数值输入 */}
                <div className="flex-1 flex items-center justify-center gap-1 px-2">
                    <input
                        type="text"
                        inputMode="decimal"
                        value={value}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        placeholder={placeholder}
                        className={`w-full bg-transparent border-none p-0 ${compact ? 'text-xl' : 'text-2xl'} font-bold text-center text-text-main-light dark:text-text-main-dark focus:ring-0 placeholder-gray-300 dark:placeholder-gray-600`}
                    />
                    {unit && (
                        <span className="text-sm font-bold text-text-muted-light dark:text-text-muted-dark whitespace-nowrap">
                            {unit}
                        </span>
                    )}
                </div>

                {/* 增加按钮 */}
                <button
                    ref={incrementBtnRef}
                    type="button"
                    className={buttonClass}
                    onMouseDown={startIncrement}
                    onMouseUp={stopHolding}
                    onMouseLeave={stopHolding}
                    disabled={parseFloat(value) >= max}
                >
                    <span className={`material-icons-round ${compact ? 'text-lg' : 'text-xl'}`}>add</span>
                </button>
            </div>
        </div>
    );
}
