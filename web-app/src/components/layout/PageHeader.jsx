import React from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * 统一页面 Header 组件。
 *
 * @param {object} props
 * @param {string} props.title - 标题
 * @param {string} [props.subtitle] - 副标题
 * @param {function} [props.onBack] - 自定义返回，默认 navigate('/')
 * @param {boolean} [props.showBack=true] - 是否显示返回按钮
 * @param {React.ReactNode} [props.rightAction] - 右侧操作区域
 */
export default function PageHeader({ title, subtitle, onBack, showBack = true, rightAction }) {
    const navigate = useNavigate();

    const handleBack = () => {
        if (onBack) {
            onBack();
        } else {
            navigate('/');
        }
    };

    return (
        <header className="px-6 pt-12 pb-4 flex items-center gap-3 bg-background-light/90 dark:bg-background-dark/90 backdrop-blur-md sticky top-0 z-50">
            {showBack && (
                <button
                    onClick={handleBack}
                    className="w-10 h-10 rounded-full bg-white dark:bg-surface-dark shadow-sm flex items-center justify-center text-text-muted-light dark:text-text-muted-dark hover:text-primary transition-colors flex-shrink-0 active:scale-95"
                >
                    <span className="material-icons-round">arrow_back</span>
                </button>
            )}
            <div className="flex-1 min-w-0">
                <h1 className="text-xl font-bold text-text-main-light dark:text-text-main-dark truncate">{title}</h1>
                {subtitle && (
                    <p className="text-xs text-text-muted-light dark:text-text-muted-dark truncate">{subtitle}</p>
                )}
            </div>
            {rightAction && <div className="flex-shrink-0">{rightAction}</div>}
        </header>
    );
}
