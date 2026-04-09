import React, { useRef, useEffect, useCallback } from 'react';

const ITEM_HEIGHT = 40;
const VISIBLE_ITEMS = 5;

/**
 * iOS 风格滚轮选择器。
 * 利用原生 scroll-snap 实现吸附效果，触摸友好。
 *
 * @param {Array<{value: number|string, label: string}>} items - 选项列表
 * @param {number|string} value - 当前选中值
 * @param {function} onChange - 值变化回调
 * @param {string} [unit] - 底部单位标签
 */
export default function WheelPicker({ items, value, onChange, unit }) {
    const listRef = useRef(null);
    const isUserScrolling = useRef(false);
    const scrollTimer = useRef(null);

    const containerHeight = ITEM_HEIGHT * VISIBLE_ITEMS;
    const padCount = Math.floor(VISIBLE_ITEMS / 2);

    // 找到当前值的 index
    const selectedIndex = items.findIndex(item => item.value === value);

    // 滚动到指定 index（无动画用于初始化，有动画用于外部值变化）
    const scrollToIndex = useCallback((idx, smooth = false) => {
        if (!listRef.current) return;
        listRef.current.scrollTo({
            top: idx * ITEM_HEIGHT,
            behavior: smooth ? 'smooth' : 'instant',
        });
    }, []);

    // 初始化滚动位置
    useEffect(() => {
        if (selectedIndex >= 0) {
            scrollToIndex(selectedIndex, false);
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // 外部 value 变化时同步滚动
    useEffect(() => {
        if (!isUserScrolling.current && selectedIndex >= 0) {
            scrollToIndex(selectedIndex, true);
        }
    }, [selectedIndex, scrollToIndex]);

    // 滚动结束后计算选中项
    const handleScroll = useCallback(() => {
        isUserScrolling.current = true;
        if (scrollTimer.current) clearTimeout(scrollTimer.current);

        scrollTimer.current = setTimeout(() => {
            if (!listRef.current) return;
            const scrollTop = listRef.current.scrollTop;
            const idx = Math.round(scrollTop / ITEM_HEIGHT);
            const clamped = Math.max(0, Math.min(items.length - 1, idx));

            if (items[clamped] && items[clamped].value !== value) {
                onChange?.(items[clamped].value);
            }
            isUserScrolling.current = false;
        }, 80);
    }, [items, value, onChange]);

    return (
        <div className="flex flex-col items-center">
            <div
                className="relative overflow-hidden rounded-2xl bg-background-light dark:bg-background-dark"
                style={{ height: containerHeight, width: '100%' }}
            >
                {/* 上下渐变遮罩 */}
                <div className="absolute inset-x-0 top-0 h-[40%] bg-gradient-to-b from-background-light dark:from-background-dark to-transparent z-10 pointer-events-none" />
                <div className="absolute inset-x-0 bottom-0 h-[40%] bg-gradient-to-t from-background-light dark:from-background-dark to-transparent z-10 pointer-events-none" />

                {/* 中心高亮行指示器 */}
                <div
                    className="absolute inset-x-2 z-5 rounded-xl bg-primary/10 dark:bg-primary/15 border border-primary/20"
                    style={{ top: padCount * ITEM_HEIGHT, height: ITEM_HEIGHT }}
                />

                {/* 滚动列表 */}
                <div
                    ref={listRef}
                    className="h-full overflow-y-auto no-scrollbar"
                    style={{
                        scrollSnapType: 'y mandatory',
                        WebkitOverflowScrolling: 'touch',
                    }}
                    onScroll={handleScroll}
                >
                    {/* 顶部填充 */}
                    {Array.from({ length: padCount }).map((_, i) => (
                        <div key={`pad-top-${i}`} style={{ height: ITEM_HEIGHT }} />
                    ))}

                    {/* 选项 */}
                    {items.map((item, idx) => {
                        const isSelected = item.value === value;
                        return (
                            <div
                                key={item.value}
                                className={`flex items-center justify-center transition-all duration-150 select-none ${
                                    isSelected
                                        ? 'text-text-main-light dark:text-text-main-dark font-bold text-xl'
                                        : 'text-text-muted-light/50 dark:text-text-muted-dark/50 text-base'
                                }`}
                                style={{
                                    height: ITEM_HEIGHT,
                                    scrollSnapAlign: 'center',
                                }}
                                onClick={() => {
                                    onChange?.(item.value);
                                    scrollToIndex(idx, true);
                                }}
                            >
                                {item.label}
                            </div>
                        );
                    })}

                    {/* 底部填充 */}
                    {Array.from({ length: padCount }).map((_, i) => (
                        <div key={`pad-bottom-${i}`} style={{ height: ITEM_HEIGHT }} />
                    ))}
                </div>
            </div>
            {unit && (
                <span className="text-xs font-bold text-text-muted-light dark:text-text-muted-dark mt-2 uppercase tracking-wider">
                    {unit}
                </span>
            )}
        </div>
    );
}
