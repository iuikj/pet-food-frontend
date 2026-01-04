import React from 'react';
import { useLocation, Link } from 'react-router-dom';

export default function BottomNav() {
    const location = useLocation();

    // 改进的活跃状态判断逻辑,支持子路由
    const isActive = (path) => {
        // 首页需要精确匹配
        if (path === '/') {
            return location.pathname === '/';
        }
        // 其他路径使用 startsWith 来支持子路由
        return location.pathname.startsWith(path);
    };

    const navItems = [
        { name: 'Home', icon: 'home', path: '/' },
        { name: 'Calendar', icon: 'calendar_today', path: '/dashboard/weekly' },
        { name: 'Plan', icon: 'menu_book', path: '/plan/summary', isFab: true },
        { name: 'Analysis', icon: 'pie_chart', path: '/dashboard/daily' },
        { name: 'Profile', icon: 'person', path: '/profile' },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-surface-dark/90 backdrop-blur-lg border-t border-gray-100 dark:border-gray-800 pb-safe pt-2 px-6 pb-6 rounded-t-3xl shadow-[0_-5px_20px_rgba(0,0,0,0.03)] z-50">
            <div className="flex justify-between items-center">
                {navItems.map((item) => {
                    if (item.isFab) {
                        return (
                            <Link
                                key={item.name}
                                to={item.path}
                                className="relative -top-6 bg-primary text-white dark:text-gray-900 w-14 h-14 rounded-full shadow-glow flex items-center justify-center transform transition-transform hover:scale-105 active:scale-95"
                            >
                                <span className="material-icons-round text-2xl">{item.icon}</span>
                            </Link>
                        );
                    }
                    return (
                        <Link
                            key={item.name}
                            to={item.path}
                            className={`flex flex-col items-center gap-1 w-12 transition-colors ${isActive(item.path)
                                ? 'text-primary'
                                : 'text-text-muted-light dark:text-text-muted-dark hover:text-primary'
                                }`}
                        >
                            <span className="material-icons-round">{item.icon}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
