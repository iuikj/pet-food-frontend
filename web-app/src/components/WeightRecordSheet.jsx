import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import WeightScale from './ui/WeightScale';

/**
 * YYYY-MM-DD → 本地日期字符串
 */
function todayStr() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * 底部抽屉：体重记录表单
 *
 * props:
 *   isOpen       控制显隐
 *   onClose      关闭回调
 *   onSubmit     ({ weight, recorded_date, notes }) => Promise<{ success, message? }>
 *   petName      展示用宠物名
 *   defaultWeight 初始体重（来自最新记录或 Pet.weight）
 */
export default function WeightRecordSheet({
    isOpen,
    onClose,
    onSubmit,
    petName,
    defaultWeight = 0,
}) {
    const [weight, setWeight] = useState(Number(defaultWeight) || 0);
    const [recordedDate, setRecordedDate] = useState(todayStr());
    const [notes, setNotes] = useState('');
    const [saving, setSaving] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    // 打开时重置表单
    useEffect(() => {
        if (isOpen) {
            setWeight(Number(defaultWeight) || 0);
            setRecordedDate(todayStr());
            setNotes('');
            setErrorMsg('');
        }
    }, [isOpen, defaultWeight]);

    const handleSave = async () => {
        if (!weight || weight <= 0) {
            setErrorMsg('请输入有效体重');
            return;
        }
        setSaving(true);
        setErrorMsg('');
        try {
            const res = await onSubmit?.({
                weight,
                recorded_date: recordedDate,
                notes: notes.trim(),
            });
            if (res?.success) {
                onClose?.();
            } else {
                setErrorMsg(res?.message || '保存失败');
            }
        } finally {
            setSaving(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="fixed inset-0 z-[90] flex items-end justify-center"
                    onClick={onClose}
                >
                    {/* 背景遮罩 */}
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

                    {/* 抽屉主体 */}
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 28, stiffness: 260 }}
                        onClick={(e) => e.stopPropagation()}
                        className="relative w-full max-w-md bg-white dark:bg-surface-dark rounded-t-3xl shadow-2xl px-6 pt-4 pb-8"
                        style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}
                    >
                        {/* 顶部把手 */}
                        <div className="flex justify-center mb-3">
                            <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                        </div>

                        {/* 标题 */}
                        <div className="text-center mb-5">
                            <h3 className="text-lg font-bold">记录体重</h3>
                            {petName && (
                                <p className="text-xs text-text-muted-light dark:text-text-muted-dark mt-1">
                                    为 {petName} 记录体重变化
                                </p>
                            )}
                        </div>

                        {/* 体重刻度尺 */}
                        <div className="mb-5">
                            <WeightScale value={weight} onChange={setWeight} min={0.1} max={100} />
                        </div>

                        {/* 日期 */}
                        <div className="mb-4">
                            <label className="block text-xs font-bold text-text-muted-light dark:text-text-muted-dark mb-1.5 uppercase tracking-wide">
                                记录日期
                            </label>
                            <input
                                type="date"
                                value={recordedDate}
                                max={todayStr()}
                                onChange={(e) => setRecordedDate(e.target.value)}
                                className="w-full bg-gray-50 dark:bg-gray-800 text-text-main-light dark:text-text-main-dark rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>

                        {/* 备注 */}
                        <div className="mb-5">
                            <label className="block text-xs font-bold text-text-muted-light dark:text-text-muted-dark mb-1.5 uppercase tracking-wide">
                                备注（可选）
                            </label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="例如：饭后称、身体不适"
                                rows={2}
                                maxLength={200}
                                className="w-full bg-gray-50 dark:bg-gray-800 text-text-main-light dark:text-text-main-dark rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>

                        {/* 错误提示 */}
                        {errorMsg && (
                            <p className="text-xs text-red-500 text-center mb-3">{errorMsg}</p>
                        )}

                        {/* 按钮 */}
                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                disabled={saving}
                                className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-text-main-light dark:text-text-main-dark font-bold disabled:opacity-50 active:scale-[0.98] transition-transform"
                            >
                                取消
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving || !weight || weight <= 0}
                                className="flex-1 py-3 rounded-xl bg-primary text-white dark:text-gray-900 font-bold disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
                            >
                                {saving ? (
                                    <>
                                        <span className="material-icons-round text-base animate-spin">refresh</span>
                                        保存中
                                    </>
                                ) : (
                                    '保存'
                                )}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
