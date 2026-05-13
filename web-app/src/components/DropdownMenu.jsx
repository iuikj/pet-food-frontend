import React from 'react';
import {
    MenuItem,
    MenuPopup,
} from './ui/menu';

/**
 * 可复用的下拉菜单组件。
 *
 * 保留旧调用 API，内部使用 COSS/Base UI Menu 负责定位、键盘交互和外部点击关闭。
 */
export default function DropdownMenu({
    onClose,
    items = [],
    position = 'right',
}) {
    return (
        <MenuPopup
            align={position === 'left' ? 'start' : 'end'}
            className="min-w-[160px] overflow-hidden rounded-xl border-gray-100 bg-white py-1.5 shadow-large dark:border-gray-800 dark:bg-surface-dark"
            side="bottom"
            sideOffset={4}
        >
            {items.map((item, index) => (
                <MenuItem
                    key={`${item.label}-${index}`}
                    closeOnClick
                    onClick={() => {
                        item.onClick?.();
                        onClose?.();
                    }}
                    variant={item.danger ? 'destructive' : 'default'}
                    className={
                        item.danger
                            ? 'gap-3 rounded-none px-4 py-2.5 text-red-500 data-highlighted:bg-red-50 dark:data-highlighted:bg-red-900/20'
                            : 'gap-3 rounded-none px-4 py-2.5 text-text-main-light data-highlighted:bg-gray-50 dark:text-text-main-dark dark:data-highlighted:bg-gray-800'
                    }
                >
                    {item.icon && (
                        <span
                            className={`material-icons-round text-lg ${
                                item.danger ? 'text-red-500' : 'text-text-muted-light dark:text-text-muted-dark'
                            }`}
                        >
                            {item.icon}
                        </span>
                    )}
                    <span className="text-sm font-medium">{item.label}</span>
                </MenuItem>
            ))}
        </MenuPopup>
    );
}
