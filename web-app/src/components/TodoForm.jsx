import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion as Motion } from 'framer-motion';
import { usePets } from '../hooks/usePets';
import { registerBackButtonHandler } from '../hooks/useBackButton';
import { Button } from './ui/button';
import { DatePicker } from './ui/date-picker';
import { FormTextField, FormTextareaField } from './ui/form-fields';
import {
  Drawer,
  DrawerClose,
  DrawerFooter,
  DrawerHeader,
  DrawerPanel,
  DrawerPopup,
  DrawerTitle,
} from './ui/drawer';

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
 * 待办事项表单（COSS 底部抽屉）
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

  useEffect(() => {
    if (!isOpen) return undefined;
    return registerBackButtonHandler(() => {
      if (submitting) return true;
      onClose?.();
      return true;
    });
  }, [isOpen, onClose, submitting]);

  const handleOpenChange = (open) => {
    if (!open && !submitting) onClose?.();
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError('请输入标题');
      return;
    }
    if (!dueDate) {
      setError('请选择日期');
      return;
    }
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
      onClose?.();
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : '提交失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Drawer open={isOpen} onOpenChange={handleOpenChange} position="bottom">
      <DrawerPopup
        className="mx-auto max-w-lg bg-white dark:bg-surface-dark [--drawer-height:min(90dvh,760px)]"
        showBar
      >
        <DrawerHeader className="flex-row items-center justify-between px-5 py-4">
          <DrawerTitle className="text-lg font-bold text-text-main-light dark:text-text-main-dark">
            {editTodo ? '编辑待办' : '新建待办'}
          </DrawerTitle>
          <DrawerClose
            aria-label="关闭"
            className="h-8 w-8 rounded-full bg-gray-100 dark:bg-gray-800"
            disabled={submitting}
            render={<Button size="icon-sm" variant="ghost" />}
          >
            <span className="material-icons-round text-text-muted-light dark:text-text-muted-dark text-lg">close</span>
          </DrawerClose>
        </DrawerHeader>

        <DrawerPanel className="space-y-4 px-5 pb-4 pt-1" scrollFade={false}>
          <FormTextField
            label="标题 *"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="待办事项标题"
            type="text"
            maxLength={200}
            inputClassName="rounded-xl bg-gray-50 shadow-none [&_[data-slot=input]]:py-2.5 dark:bg-gray-800"
          />

          <FormTextareaField
            label="备注"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="可选备注"
            rows={2}
          />

          {pets.length > 0 && (
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-text-muted-light dark:text-text-muted-dark">关联宠物</label>
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="关联宠物">
                <button
                  type="button"
                  role="radio"
                  aria-checked={!petId}
                  onClick={() => setPetId('')}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                    !petId
                      ? 'border-primary bg-primary text-white dark:text-gray-900'
                      : 'border-gray-200 text-text-muted-light dark:border-gray-700 dark:text-text-muted-dark'
                  }`}
                >
                  不关联
                </button>
                {pets.map((pet) => (
                  <button
                    key={pet.id}
                    type="button"
                    role="radio"
                    aria-checked={petId === pet.id}
                    onClick={() => setPetId(pet.id)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                      petId === pet.id
                        ? 'border-primary bg-primary text-white dark:text-gray-900'
                        : 'border-gray-200 text-text-muted-light dark:border-gray-700 dark:text-text-muted-dark'
                    }`}
                  >
                    {pet.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="mb-1.5 block text-xs font-semibold text-text-muted-light dark:text-text-muted-dark">
                日期 <span className="text-red-500">*</span>
              </label>
              <DatePicker
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="h-10 rounded-xl bg-gray-50 dark:bg-gray-800"
                aria-label="待办日期"
              />
            </div>
            <div className="flex flex-col items-center gap-1 pb-0.5">
              <span className="text-xs font-semibold text-text-muted-light dark:text-text-muted-dark">全天</span>
              <button
                type="button"
                role="switch"
                aria-checked={isAllDay}
                aria-label="全天事件"
                onClick={() => setIsAllDay((v) => !v)}
                className={`relative h-[22px] w-10 rounded-full transition-colors ${isAllDay ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'}`}
              >
                <span
                  className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${isAllDay ? 'left-5' : 'left-0.5'}`}
                />
              </button>
            </div>
          </div>

          <AnimatePresence>
            {!isAllDay && (
              <Motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <FormTextField
                  label="时间"
                  type="time"
                  value={dueTime}
                  onChange={(e) => setDueTime(e.target.value)}
                  inputClassName="rounded-xl bg-gray-50 shadow-none [&_[data-slot=input]]:py-2.5 [&_[data-slot=input]]:text-sm dark:bg-gray-800"
                />
              </Motion.div>
            )}
          </AnimatePresence>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-text-muted-light dark:text-text-muted-dark">优先级</label>
            <div className="flex gap-2" role="radiogroup" aria-label="优先级">
              {PRIORITIES.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  role="radio"
                  aria-checked={priority === p.value}
                  onClick={() => setPriority(p.value)}
                  className={`flex-1 rounded-xl border-2 py-2 text-xs font-semibold transition-colors ${
                    priority === p.value
                      ? `${p.color} border-current`
                      : 'border-gray-100 bg-gray-50 text-text-muted-light dark:border-gray-800 dark:bg-gray-900 dark:text-text-muted-dark'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-text-muted-light dark:text-text-muted-dark">分类</label>
            <div className="grid grid-cols-5 gap-1.5" role="radiogroup" aria-label="分类">
              {CATEGORIES.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  role="radio"
                  aria-checked={category === c.value}
                  aria-label={c.label}
                  onClick={() => setCategory(c.value)}
                  className={`flex flex-col items-center gap-1 rounded-xl border py-2 text-xs transition-colors ${
                    category === c.value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-gray-100 bg-gray-50 text-text-muted-light dark:border-gray-800 dark:bg-gray-900 dark:text-text-muted-dark'
                  }`}
                >
                  <span className="material-icons-round text-base">{c.icon}</span>
                  <span>{c.label}</span>
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-center text-xs text-red-500">{error}</p>}
        </DrawerPanel>

        <DrawerFooter className="border-0 bg-transparent px-5 pt-2">
          <Button
            onClick={handleSubmit}
            loading={submitting}
            disabled={submitting}
            className="h-12 w-full rounded-xl bg-primary text-sm font-bold text-white shadow-lg dark:text-gray-900"
          >
            {submitting ? '保存中…' : editTodo ? '保存修改' : '创建待办'}
          </Button>
        </DrawerFooter>
      </DrawerPopup>
    </Drawer>
  );
}
