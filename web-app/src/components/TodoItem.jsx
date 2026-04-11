import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const PRIORITY_STYLES = {
  high: { label: '高', bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-600 dark:text-red-400', dot: 'bg-red-500' },
  medium: { label: '中', bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-600 dark:text-yellow-500', dot: 'bg-yellow-400' },
  low: { label: '低', bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-500 dark:text-gray-400', dot: 'bg-gray-400' },
};

const CATEGORY_ICONS = {
  feeding: 'restaurant',
  health: 'local_hospital',
  grooming: 'content_cut',
  shopping: 'shopping_cart',
  other: 'check_circle_outline',
};

/**
 * 单条待办事项组件
 *
 * Props:
 *  todo          - TodoItem 对象
 *  onComplete    - (id, isCompleted) => void 切换完成状态
 *  onEdit        - (todo) => void 编辑
 *  onDelete      - (id) => void 删除
 *  onExport      - (todo) => void 导出到日历
 *  isExporting   - boolean 是否正在导出
 */
export default function TodoItem({ todo, onComplete, onEdit, onDelete, onExport, isExporting }) {
  const [expanded, setExpanded] = useState(false);

  const priority = PRIORITY_STYLES[todo.priority] || PRIORITY_STYLES.medium;
  const categoryIcon = CATEGORY_ICONS[todo.category] || 'check_circle_outline';
  const timeLabel = todo.is_all_day ? '全天' : todo.due_time || '';

  return (
    <div className={`rounded-xl border transition-colors ${
      todo.is_completed
        ? 'border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30'
        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-surface-dark'
    }`}>
      {/* 主行 */}
      <div className="flex items-center gap-3 px-3 py-2.5">
        {/* 完成圆圈 — 外层 44x44 触摸区 */}
        <button
          onClick={(e) => { e.stopPropagation(); onComplete(todo.id, todo.is_completed); }}
          aria-label={todo.is_completed ? '标记为未完成' : '标记为已完成'}
          className="flex-shrink-0 w-11 h-11 -m-3 flex items-center justify-center cursor-pointer"
        >
          {/* 完成态：缩小实心圆点；未完成态：空心描边圆 */}
          <motion.span
            className={`rounded-full transition-colors ${
              todo.is_completed
                ? 'bg-primary'
                : 'border-2 border-gray-300 dark:border-gray-600'
            }`}
            animate={{
              width: todo.is_completed ? 10 : 20,
              height: todo.is_completed ? 10 : 20,
            }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          />
        </button>

        {/* 整行可展开区域（内容 + 优先级 + 箭头） */}
        <button
          className="flex-1 flex items-center gap-3 min-w-0 text-left cursor-pointer"
          aria-expanded={expanded}
          onClick={() => setExpanded(v => !v)}
        >
          {/* 内容区 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className={`text-sm font-medium truncate ${todo.is_completed ? 'line-through text-text-muted-light dark:text-text-muted-dark' : ''}`}>
                {todo.title}
              </span>
              {todo.pet_name && (
                <span className="text-xs px-1.5 py-0.5 rounded-full bg-primary/15 text-primary font-medium flex-shrink-0">
                  {todo.pet_name}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="material-icons-round text-text-muted-light dark:text-text-muted-dark text-xs">{categoryIcon}</span>
              {timeLabel && (
                <span className="text-xs text-text-muted-light dark:text-text-muted-dark">{timeLabel}</span>
              )}
            </div>
          </div>

          {/* 优先级色块 */}
          <div className={`flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${priority.bg} ${priority.text}`}>
            {priority.label}
          </div>

          {/* 展开箭头 */}
          <motion.span
            className="material-icons-round text-text-muted-light dark:text-text-muted-dark text-base flex-shrink-0"
            aria-hidden="true"
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            expand_more
          </motion.span>
        </button>
      </div>

      {/* 展开详情 */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-2 border-t border-gray-100 dark:border-gray-800 pt-2">
              {todo.description && (
                <p className="text-xs text-text-muted-light dark:text-text-muted-dark leading-relaxed">
                  {todo.description}
                </p>
              )}

              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => onEdit(todo)}
                  className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-text-muted-light dark:text-text-muted-dark hover:text-primary transition-colors cursor-pointer"
                >
                  <span className="material-icons-round text-xs">edit</span>
                  编辑
                </button>
                <button
                  onClick={() => onDelete(todo.id)}
                  className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors cursor-pointer"
                >
                  <span className="material-icons-round text-xs">delete</span>
                  删除
                </button>
                <button
                  onClick={() => onExport(todo)}
                  disabled={isExporting}
                  className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <span className="material-icons-round text-xs">
                    {isExporting ? 'hourglass_empty' : 'event'}
                  </span>
                  导入日历
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
