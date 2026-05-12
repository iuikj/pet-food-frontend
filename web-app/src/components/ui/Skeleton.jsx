import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Skeleton - shimmer 骨架屏原子组件
 *
 * 用法:
 *   <Skeleton className="h-4 w-32" />          矩形占位
 *   <Skeleton.Circle size={48} />               圆形占位
 *   <Skeleton.Text lines={3} />                 多行文本占位
 */
function Skeleton({ className, rounded = 'lg', ...props }) {
  const roundedClass = rounded === 'full' ? 'rounded-full' : 'rounded-lg';

  return (
    <div
      className={twMerge(
        clsx(
          'relative overflow-hidden bg-gray-200 dark:bg-gray-700',
          roundedClass,
        ),
        className,
      )}
      {...props}
    >
      <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/40 dark:via-white/10 to-transparent" />
    </div>
  );
}

function Circle({ size = 48, className, ...props }) {
  return (
    <Skeleton
      rounded="full"
      className={twMerge(`shrink-0`, className)}
      style={{ width: size, height: size }}
      {...props}
    />
  );
}

function Text({ lines = 3, className, lineClassName, ...props }) {
  return (
    <div className={twMerge('flex flex-col gap-2', className)} {...props}>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton
          key={i}
          className={twMerge(
            'h-3',
            i === lines - 1 ? 'w-3/4' : 'w-full',
            lineClassName,
          )}
        />
      ))}
    </div>
  );
}

Skeleton.Circle = Circle;
Skeleton.Text = Text;

/**
 * AvatarRowSkeleton - 头像 + 两行文字 + 右侧按钮的列表行骨架。
 *
 * 用于 HomePage / DashboardDaily 中今日餐食列表的 loading 占位。
 * 结构与原内联实现完全一致：Circle 44 + h-4 w-24 / h-3 w-40 + h-8 w-16。
 */
export function AvatarRowSkeleton({ className }) {
  return (
    <div
      className={twMerge(
        'flex items-center gap-4 bg-white dark:bg-surface-dark p-4 rounded-2xl shadow-soft',
        className,
      )}
    >
      <Skeleton.Circle size={44} />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-40" />
      </div>
      <Skeleton className="h-8 w-16 rounded-xl" />
    </div>
  );
}

export default Skeleton;
