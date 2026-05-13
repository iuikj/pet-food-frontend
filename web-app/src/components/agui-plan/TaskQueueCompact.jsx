import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Circle, ChevronUp, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { registerBackButtonHandler } from '@/hooks/useBackButton';
import {
    Drawer,
    DrawerClose,
    DrawerHeader,
    DrawerPanel,
    DrawerPopup,
    DrawerTitle,
} from '@/components/ui/drawer';

function TaskItem({ item }) {
    const done = item.status === 'done' || item.status === 'completed';
    const inProgress = item.status === 'in_progress' || item.status === 'active';
    return (
        <div className="flex items-start gap-2.5 px-2 py-2">
            {done ? (
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-gray-400 dark:text-gray-500" />
            ) : inProgress ? (
                <Loader2 className="mt-0.5 size-4 shrink-0 animate-spin text-gray-500 dark:text-gray-400" />
            ) : (
                <Circle className="mt-0.5 size-4 shrink-0 text-gray-300" />
            )}
            <span className={cn(
                'text-[13px] leading-5',
                done ? 'text-gray-400 dark:text-gray-500 line-through' : 'text-gray-700 dark:text-gray-300',
            )}>
                {item.description || item.content || ''}
            </span>
        </div>
    );
}

export function TaskQueueDrawer({ open, items = [], onClose }) {
    useEffect(() => {
        if (!open) return undefined;
        return registerBackButtonHandler(() => {
            onClose?.();
            return true;
        });
    }, [open, onClose]);

    return (
        <Drawer open={open} onOpenChange={(nextOpen) => !nextOpen && onClose?.()} position="bottom">
            <DrawerPopup className="bg-white dark:bg-gray-900 [--drawer-height:min(70vh,560px)]" showBar>
                <DrawerHeader className="flex-row items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-gray-800">
                    <DrawerTitle className="text-[15px] font-semibold text-gray-900 dark:text-gray-100">
                        任务队列
                    </DrawerTitle>
                    <DrawerClose
                        aria-label="关闭任务队列"
                        className="text-gray-400 hover:bg-gray-100 dark:text-gray-500 dark:hover:bg-gray-800"
                        render={<Button size="icon-sm" variant="ghost" />}
                    >
                        <X className="size-4" />
                    </DrawerClose>
                </DrawerHeader>
                <DrawerPanel className="px-4 py-3" scrollFade={false}>
                    {items.length === 0 ? (
                        <p className="py-6 text-center text-[13px] text-gray-400 dark:text-gray-500">暂无任务</p>
                    ) : (
                        <div className="space-y-0.5">
                            {items.map((item, i) => (
                                <TaskItem key={item.id ?? i} item={item} />
                            ))}
                        </div>
                    )}
                </DrawerPanel>
            </DrawerPopup>
        </Drawer>
    );
}

/**
 * TaskQueueCompact — sticky 在 ActionBar 上方的 compact 卡。
 * 显示进行中/已完成数量，点击展开抽屉。
 */
export default function TaskQueueCompact({ items = [] }) {
    const [drawerOpen, setDrawerOpen] = useState(false);

    const { inProgress, completed } = useMemo(() => {
        let ip = 0;
        let done = 0;
        for (const item of items) {
            const s = typeof item === 'object' ? (item.status || 'pending') : 'pending';
            if (s === 'done' || s === 'completed') done += 1;
            else ip += 1;
        }
        return { inProgress: ip, completed: done };
    }, [items]);

    if (items.length === 0) return null;

    return (
        <>
            <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                className="flex w-full items-center justify-between rounded-t-xl border border-b-0 border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-800/50 px-4 py-2.5 text-left backdrop-blur-sm"
            >
                <span className="text-[13px] text-gray-600 dark:text-gray-400">
                    {inProgress > 0 && <span>{inProgress} 项进行中</span>}
                    {inProgress > 0 && completed > 0 && <span className="mx-1.5 text-gray-300 dark:text-gray-600">&middot;</span>}
                    {completed > 0 && <span>{completed} 项已完成</span>}
                </span>
                <ChevronUp className="size-4 text-gray-400 dark:text-gray-500" />
            </button>
            <TaskQueueDrawer
                open={drawerOpen}
                items={items}
                onClose={() => setDrawerOpen(false)}
            />
        </>
    );
}
