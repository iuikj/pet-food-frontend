/**
 * 日历相关共享常量
 * 供 HomePage 和 CalendarPage 共用
 */

export const WEEK_COLORS = [
    { bg: 'bg-primary/20', dot: 'bg-primary', text: 'text-primary', border: 'border-primary/30', label: '第一周' },
    { bg: 'bg-secondary/20', dot: 'bg-secondary', text: 'text-yellow-700 dark:text-yellow-300', border: 'border-secondary/30', label: '第二周' },
    { bg: 'bg-accent-blue/20', dot: 'bg-accent-blue', text: 'text-blue-700 dark:text-blue-300', border: 'border-accent-blue/30', label: '第三周' },
    { bg: 'bg-purple-100 dark:bg-purple-900/20', dot: 'bg-purple-400', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-300', label: '第四周' },
];

export const WEEK_DAY_LABELS = ['一', '二', '三', '四', '五', '六', '日'];

/**
 * 周颜色的原始 hex 值，供 react-calendar tileContent 内联样式使用
 */
export const WEEK_DOT_COLORS = ['#A3D9A5', '#FFE898', '#93C5FD', '#C084FC'];
