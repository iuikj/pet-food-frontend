import React, { useRef, useEffect, useCallback, useState } from 'react';

const TICK_WIDTH = 8; // px per 0.1kg tick
const TICKS_PER_KG = 10;
const MAJOR_EVERY = 5; // bold line every 5kg

/**
 * 水平刻度尺体重选择器。
 * 左右滑动选择体重，中心指针固定，底部快捷 ±0.5 按钮。
 *
 * @param {number} value - 当前体重 (kg)
 * @param {function} onChange - 值变化回调
 * @param {number} [min=0] - 最小值
 * @param {number} [max=100] - 最大值
 * @param {number} [step=0.1] - 精度
 */
export default function WeightScale({ value = 0, onChange, min = 0, max = 100, step = 0.1 }) {
    const scrollRef = useRef(null);
    const isUserScrolling = useRef(false);
    const scrollTimer = useRef(null);
    const [editing, setEditing] = useState(false);
    const [inputVal, setInputVal] = useState('');

    const totalTicks = Math.round((max - min) / step);
    const totalWidth = totalTicks * TICK_WIDTH;

    // value → scrollLeft
    const valueToScroll = useCallback((v) => {
        return ((v - min) / step) * TICK_WIDTH;
    }, [min, step]);

    // scrollLeft → value
    const scrollToValue = useCallback((scrollLeft) => {
        const tickIndex = Math.round(scrollLeft / TICK_WIDTH);
        const clamped = Math.max(0, Math.min(totalTicks, tickIndex));
        return Math.round((min + clamped * step) * 10) / 10;
    }, [min, step, totalTicks]);

    // 初始化滚动位置
    useEffect(() => {
        if (scrollRef.current && !isUserScrolling.current) {
            scrollRef.current.scrollLeft = valueToScroll(value);
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // 外部 value 变化时同步
    useEffect(() => {
        if (!isUserScrolling.current && scrollRef.current) {
            scrollRef.current.scrollLeft = valueToScroll(value);
        }
    }, [value, valueToScroll]);

    const handleScroll = useCallback(() => {
        isUserScrolling.current = true;
        if (scrollTimer.current) clearTimeout(scrollTimer.current);
        scrollTimer.current = setTimeout(() => {
            if (!scrollRef.current) return;
            const newVal = scrollToValue(scrollRef.current.scrollLeft);
            if (newVal !== value) {
                onChange?.(newVal);
            }
            isUserScrolling.current = false;
        }, 60);
    }, [scrollToValue, value, onChange]);

    const adjust = (delta) => {
        const newVal = Math.round(Math.max(min, Math.min(max, (value || 0) + delta)) * 10) / 10;
        onChange?.(newVal);
    };

    const handleDirectInput = () => {
        const parsed = parseFloat(inputVal);
        if (!isNaN(parsed) && parsed >= min && parsed <= max) {
            onChange?.(Math.round(parsed * 10) / 10);
        }
        setEditing(false);
    };

    // 生成刻度线
    const renderTicks = () => {
        const ticks = [];
        for (let i = 0; i <= totalTicks; i++) {
            const kgValue = min + i * step;
            const isKg = i % TICKS_PER_KG === 0;
            const isMajor = isKg && (Math.round(kgValue) % MAJOR_EVERY === 0);

            ticks.push(
                <div
                    key={i}
                    className="flex flex-col items-center flex-shrink-0"
                    style={{ width: TICK_WIDTH }}
                >
                    <div
                        className={`rounded-full ${
                            isMajor
                                ? 'w-0.5 h-6 bg-text-main-light/60 dark:bg-text-main-dark/60'
                                : isKg
                                    ? 'w-0.5 h-4 bg-text-muted-light/40 dark:bg-text-muted-dark/40'
                                    : 'w-px h-2 bg-text-muted-light/20 dark:bg-text-muted-dark/20'
                        }`}
                    />
                    {isMajor && (
                        <span className="text-[9px] font-medium text-text-muted-light dark:text-text-muted-dark mt-1">
                            {Math.round(kgValue)}
                        </span>
                    )}
                </div>
            );
        }
        return ticks;
    };

    const containerWidth = '100%';

    return (
        <div className="space-y-3">
            {/* 数字显示 — 点击可直接输入 */}
            <div className="flex items-baseline justify-center gap-1">
                {editing ? (
                    <input
                        type="number"
                        step="0.1"
                        autoFocus
                        value={inputVal}
                        onChange={(e) => setInputVal(e.target.value)}
                        onBlur={handleDirectInput}
                        onKeyDown={(e) => e.key === 'Enter' && handleDirectInput()}
                        className="w-24 text-center text-4xl font-bold bg-transparent border-b-2 border-primary text-text-main-light dark:text-text-main-dark focus:outline-none"
                    />
                ) : (
                    <button
                        onClick={() => { setInputVal(String(value || 0)); setEditing(true); }}
                        className="text-4xl font-bold text-text-main-light dark:text-text-main-dark leading-none hover:text-primary transition-colors"
                    >
                        {(value || 0).toFixed(1)}
                    </button>
                )}
                <span className="text-sm font-bold text-text-muted-light dark:text-text-muted-dark uppercase">kg</span>
            </div>

            {/* 刻度尺 */}
            <div className="relative" style={{ width: containerWidth }}>
                {/* 中心指针 */}
                <div className="absolute left-1/2 top-0 -translate-x-1/2 z-10 flex flex-col items-center pointer-events-none">
                    <div className="w-0 h-0 border-l-[5px] border-r-[5px] border-t-[6px] border-l-transparent border-r-transparent border-t-primary" />
                </div>

                {/* 滚动容器 */}
                <div
                    ref={scrollRef}
                    className="overflow-x-auto no-scrollbar pt-2"
                    style={{ WebkitOverflowScrolling: 'touch' }}
                    onScroll={handleScroll}
                >
                    <div
                        className="flex items-end"
                        style={{
                            paddingLeft: 'calc(50% - 4px)',
                            paddingRight: 'calc(50% - 4px)',
                            width: totalWidth + 'px',
                            minWidth: 'fit-content',
                        }}
                    >
                        {renderTicks()}
                    </div>
                </div>
            </div>

            {/* 快捷按钮 */}
            <div className="flex justify-center gap-4">
                <button
                    onClick={() => adjust(-0.5)}
                    className="px-4 py-2 rounded-xl bg-primary/10 dark:bg-primary/20 text-primary text-sm font-bold active:bg-primary active:text-white active:scale-95 transition-all touch-manipulation"
                >
                    -0.5
                </button>
                <button
                    onClick={() => adjust(0.5)}
                    className="px-4 py-2 rounded-xl bg-primary/10 dark:bg-primary/20 text-primary text-sm font-bold active:bg-primary active:text-white active:scale-95 transition-all touch-manipulation"
                >
                    +0.5
                </button>
            </div>
        </div>
    );
}
