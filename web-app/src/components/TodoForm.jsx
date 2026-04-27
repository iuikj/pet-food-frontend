import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { usePets } from '../hooks/usePets';

const PRIORITIES = [
  { value: 'low', label: '低', color: 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300' },
  { value: 'medium', label: '中', color: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400' },
  { value: 'high', label: '高', color: 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400' },
];

const CATEGORIES = [
  { value: 'feeding', label: '喂养', icon: 'restaurant' },
  { value: 'health', label: '健康', icon: 'local_hospital' },
  { value: 'grooming', label: '美容', icon: 'content_cut' },
  { value: 'shopping', label: '购物', icon: 'shopping_cart' },
  { value: 'other', label: '其他', icon: 'check_circle_outline' },
];

/**
 * 待办事项表单（底部抽屉式弹出）
 *
 * Props:
 *  isOpen       - boolean
 *  onClose      - () => void
 *  onSubmit     - (data: CreateTodoRequest | UpdateTodoRequest) => Promise<void>
 *  initialDate  - string 'YYYY-MM-DD' 默认日期
 *  editTodo     - TodoItem | null  编辑时传入
 */
export default function TodoForm({ isOpen, onClose, onSubmit, initialDate, editTodo }) {
  const { pets } = usePets();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [petId, setPetId] = useState('');
  const [dueDate, setDueDate] = useState(initialDate || '');
  const [dueTime, setDueTime] = useState('');
  const [isAllDay, setIsAllDay] = useState(true);
  const [priority, setPriority] = useState('medium');
  const [category, setCategory] = useState('other');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // 编辑模式时回填数据
  useEffect(() => {
    if (editTodo) {
      setTitle(editTodo.title);
      setDescription(editTodo.description || '');
      setPetId(editTodo.pet_id || '');
      setDueDate(editTodo.due_date);
      setDueTime(editTodo.due_time || '');
      setIsAllDay(editTodo.is_all_day);
      setPriority(editTodo.priority);
      setCategory(editTodo.category);
    } else {
      setTitle('');
      setDescription('');
      setPetId('');
      setDueDate(initialDate || '');
      setDueTime('');
      setIsAllDay(true);
      setPriority('medium');
      setCategory('other');
    }
    setError('');
  }, [editTodo, initialDate, isOpen]);

  const handleSubmit = async () => {
    if (!title.trim()) { setError('请输入标题'); return; }
    if (!dueDate) { setError('请选择日期'); return; }
    setError('');
    setSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim() || undefined,
        pet_id: petId || undefined,
        due_date: dueDate,
        due_time: isAllDay ? undefined : (dueTime || undefined),
        is_all_day: isAllDay,
        priority,
        category,
      });
      onClose();
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : '提交失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  // 点击遮罩关闭
  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-end justify-center"
          onClick={handleBackdrop}
        >
          {/* 遮罩 */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

          {/* 底部抽屉 */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 380 }}
            className="relative w-full max-w-lg bg-white dark:bg-surface-dark rounded-t-3xl shadow-xl overflow-hidden max-h-[90dvh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {/* 拖动指示条 */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-gray-200 dark:bg-gray-700" />
            </div>

            {/* 标题栏 */}
            <div className="flex items-center justify-between px-5 py-3">
              <h3 className="text-lg font-bold">{editTodo ? '编辑待办' : '新建待办'}</h3>
              <button
                onClick={onClose}
                aria-label="关闭"
                className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center cursor-pointer"
              >
                <span className="material-icons-round text-text-muted-light dark:text-text-muted-dark text-lg">close</span>
              </button>
            </div>

            {/* 表单内容（可滚动） */}
            <div className="overflow-y-auto flex-1 px-5 pb-6 space-y-4">
              {/* 标题 */}
              <div>
                <label className="text-xs font-semibold text-text-muted-light dark:text-text-muted-dark mb-1.5 block">
                  标题 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="待办事项标题"
                  maxLength={200}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
                />
              </div>

              {/* 描述 */}
              <div>
                <label className="text-xs font-semibold text-text-muted-light dark:text-text-muted-dark mb-1.5 block">备注</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="可选备注"
                  rows={2}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm resize-none focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
                />
              </div>

              {/* 关联宠物 */}
              {pets.length > 0 && (
                <div>
                  <label className="text-xs font-semibold text-text-muted-light dark:text-text-muted-dark mb-1.5 block">关联宠物</label>
                  <div className="flex gap-2 flex-wrap" role="radiogroup" aria-label="关联宠物">
                    <button
                      role="radio"
                      aria-checked={!petId}
                      onClick={() => setPetId('')}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
                        !petId
                          ? 'bg-primary text-white dark:text-gray-900 border-primary'
                          : 'border-gray-200 dark:border-gray-700 text-text-muted-light dark:text-text-muted-dark'
                      }`}
                    >
                      不关联
                    </button>
                    {pets.map(pet => (
                      <button
                        key={pet.id}
                        role="radio"
                        aria-checked={petId === pet.id}
                        onClick={() => setPetId(pet.id)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
                          petId === pet.id
                            ? 'bg-primary text-white dark:text-gray-900 border-primary'
                            : 'border-gray-200 dark:border-gray-700 text-text-muted-light dark:text-text-muted-dark'
                        }`}
                      >
                        {pet.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 日期 + 全天开关 */}
              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <label className="text-xs font-semibold text-text-muted-light dark:text-text-muted-dark mb-1.5 block">
                    日期 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
                {/* 全天开关 */}
                <div className="flex flex-col items-center gap-1 pb-0.5">
                  <span className="text-xs font-semibold text-text-muted-light dark:text-text-muted-dark">全天</span>
                  <button
                    role="switch"
                    aria-checked={isAllDay}
                    aria-label="全天事件"
                    onClick={() => setIsAllDay(v => !v)}
                    className={`w-10 h-5.5 rounded-full transition-colors relative cursor-pointer ${isAllDay ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'}`}
                    style={{ height: '22px' }}
                  >
                    <span
                      className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${isAllDay ? 'left-5' : 'left-0.5'}`}
                    />
                  </button>
                </div>
              </div>

              {/* 时间（非全天时显示） */}
              <AnimatePresence>
                {!isAllDay && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <label className="text-xs font-semibold text-text-muted-light dark:text-text-muted-dark mb-1.5 block">时间</label>
                    <input
                      type="time"
                      value={dueTime}
                      onChange={e => setDueTime(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:border-primary transition-colors"
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* 优先级 */}
              <div>
                <label className="text-xs font-semibold text-text-muted-light dark:text-text-muted-dark mb-1.5 block">优先级</label>
                <div className="flex gap-2" role="radiogroup" aria-label="优先级">
                  {PRIORITIES.map(p => (
                    <button
                      key={p.value}
                      role="radio"
                      aria-checked={priority === p.value}
                      onClick={() => setPriority(p.value)}
                      className={`flex-1 py-2 rounded-xl text-xs font-semibold border-2 transition-colors cursor-pointer ${
                        priority === p.value
                          ? `${p.color} border-current`
                          : 'border-gray-100 dark:border-gray-800 text-text-muted-light dark:text-text-muted-dark bg-gray-50 dark:bg-gray-900'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 分类 */}
              <div>
                <label className="text-xs font-semibold text-text-muted-light dark:text-text-muted-dark mb-1.5 block">分类</label>
                <div className="grid grid-cols-5 gap-1.5" role="radiogroup" aria-label="分类">
                  {CATEGORIES.map(c => (
                    <button
                      key={c.value}
                      role="radio"
                      aria-checked={category === c.value}
                      aria-label={c.label}
                      onClick={() => setCategory(c.value)}
                      className={`flex flex-col items-center gap-1 py-2 rounded-xl text-xs transition-colors border cursor-pointer ${
                        category === c.value
                          ? 'bg-primary/10 border-primary text-primary'
                          : 'border-gray-100 dark:border-gray-800 text-text-muted-light dark:text-text-muted-dark bg-gray-50 dark:bg-gray-900'
                      }`}
                    >
                      <span className="material-icons-round text-base">{c.icon}</span>
                      <span>{c.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 错误提示 */}
              {error && (
                <p className="text-xs text-red-500 text-center">{error}</p>
              )}

              {/* 提交按钮 */}
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full py-3 rounded-xl bg-primary text-white dark:text-gray-900 font-bold text-sm shadow-lg active:scale-[0.97] transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                {submitting ? '保存中…' : editTodo ? '保存修改' : '创建待办'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
