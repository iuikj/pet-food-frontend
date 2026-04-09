import React from 'react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';

/**
 * 通用确认弹窗，基于 shadcn AlertDialog。
 *
 * @param {object} props
 * @param {boolean} props.open
 * @param {function} props.onOpenChange
 * @param {string} props.title
 * @param {string} props.description
 * @param {string} [props.confirmText='确认']
 * @param {string} [props.cancelText='取消']
 * @param {function} props.onConfirm
 * @param {boolean} [props.destructive=false]
 */
export default function ConfirmDialog({
    open,
    onOpenChange,
    title,
    description,
    confirmText = '确认',
    cancelText = '取消',
    onConfirm,
    destructive = false,
}) {
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent className="max-w-sm mx-4 rounded-3xl bg-white dark:bg-surface-dark border-0 shadow-xl">
                <AlertDialogHeader className="text-center">
                    <AlertDialogTitle className="text-lg font-bold text-text-main-light dark:text-text-main-dark">
                        {title}
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-sm text-text-muted-light dark:text-text-muted-dark">
                        {description}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex-row gap-3 sm:flex-row">
                    <AlertDialogCancel className="flex-1 mt-0 rounded-xl bg-gray-100 dark:bg-gray-700 border-0 text-text-main-light dark:text-text-main-dark font-medium hover:bg-gray-200 dark:hover:bg-gray-600">
                        {cancelText}
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={onConfirm}
                        className={`flex-1 rounded-xl font-bold border-0 ${
                            destructive
                                ? 'bg-red-500 text-white hover:bg-red-600'
                                : 'bg-primary text-white dark:text-gray-900 hover:brightness-110'
                        }`}
                    >
                        {confirmText}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
