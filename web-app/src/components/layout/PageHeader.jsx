import React from 'react';

/**
 * 统一移动端页面顶栏。
 *
 * 职责：消除 12 个页面 sticky `<header>` 的样板差异（z-index / safe-area /
 * 半透明背景模糊），同时通过插槽保留各页特有的右侧/左侧/底部内容。
 *
 * Props：
 * - title?: string | ReactNode  标题（字符串走默认样式，节点完全自定义渲染）
 * - subtitle?: string           副标题（仅当 title 为字符串时显示）
 * - onBack?: () => void         返回回调；不传则不渲染返回按钮
 * - rightSlot?: ReactNode       右侧操作区
 * - leftSlot?: ReactNode        左侧完全自定义（替换返回 + 标题组合，如 HomePage 的宠物选择器）
 * - bottomSlot?: ReactNode      标准行下方追加一行（如 RecipesPage 的 tabs）
 * - centerTitle?: boolean       标题居中（编辑类页面：返回 / 标题居中 / 右占位）
 * - variant?: 'default' | 'transparent'  背景半透明度变体
 * - className?: string          追加外层 className
 *
 * 实现约束（与 PRD 对齐）：
 * - paddingTop: calc(env(safe-area-inset-top, 0px) + 12px) 适配 iOS 刘海/灵动岛
 * - sticky top-0 z-50 全部页面统一
 * - bg light/dark + /95 透明度 + backdrop-blur-md 半透明毛玻璃
 */
export default function PageHeader({
    title,
    subtitle,
    onBack,
    rightSlot,
    leftSlot,
    bottomSlot,
    centerTitle = false,
    variant = 'default',
    className = '',
}) {
    const bgClass =
        variant === 'transparent'
            ? 'bg-transparent'
            : 'bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md';

    const renderTitleArea = () => {
        if (typeof title === 'string') {
            return (
                <>
                    <h1
                        className={`text-xl font-bold text-text-main-light dark:text-text-main-dark truncate ${
                            centerTitle ? 'text-center' : ''
                        }`}
                    >
                        {title}
                    </h1>
                    {subtitle && (
                        <p
                            className={`text-xs text-text-muted-light dark:text-text-muted-dark truncate ${
                                centerTitle ? 'text-center' : ''
                            }`}
                        >
                            {subtitle}
                        </p>
                    )}
                </>
            );
        }
        return title;
    };

    return (
        <header
            className={`px-6 pb-3 ${bgClass} sticky top-0 z-50 ${className}`}
            style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}
        >
            <div className="flex items-center gap-3">
                {leftSlot ? (
                    <div className="flex-1 min-w-0">{leftSlot}</div>
                ) : (
                    <>
                        {onBack && (
                            <button
                                type="button"
                                onClick={onBack}
                                aria-label="返回"
                                className="size-8 rounded-full flex items-center justify-center text-text-muted-light dark:text-text-muted-dark hover:bg-gray-100 dark:hover:bg-surface-dark transition-colors flex-shrink-0"
                            >
                                <span className="material-icons-round text-lg">arrow_back</span>
                            </button>
                        )}
                        {title != null && (
                            <div className={`flex-1 min-w-0 ${centerTitle ? 'text-center' : ''}`}>
                                {renderTitleArea()}
                            </div>
                        )}
                    </>
                )}
                {/* 居中标题模式下，若无 rightSlot，补一个等宽占位以视觉居中 */}
                {centerTitle && !rightSlot && onBack && (
                    <div className="size-8 flex-shrink-0" aria-hidden="true" />
                )}
                {rightSlot && <div className="flex-shrink-0">{rightSlot}</div>}
            </div>
            {bottomSlot && <div className="mt-3">{bottomSlot}</div>}
        </header>
    );
}
