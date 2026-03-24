import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Toast } from '@capacitor/toast';
import { pageTransitions } from '../utils/animations';
import { usePets } from '../hooks/usePets';
import { plansApi } from '../api';
import Skeleton from '../components/ui/Skeleton';

export default function RecipesPage() {
    const navigate = useNavigate();
    const { pets, currentPet, fetchPets } = usePets();

    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [applyingId, setApplyingId] = useState(null); // 正在应用的 planId
    const [deletingId, setDeletingId] = useState(null); // 正在删除的 planId

    // 获取已保存食谱列表
    const fetchPlans = useCallback(async () => {
        setLoading(true);
        try {
            const res = await plansApi.getPlans();
            if (res.code === 0 && res.data?.items) {
                setPlans(res.data.items);
            }
        } catch (err) {
            console.error('Failed to fetch plans:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchPlans(); }, [fetchPlans]);

    // 应用食谱 — 调用后端 apply API
    const handleApply = async (plan) => {
        if (applyingId) return;

        setApplyingId(plan.id);
        try {
            const res = await plansApi.applyPlan(plan.id);
            if (res.code !== 0) {
                try { await Toast.show({ text: res.message || '应用失败', duration: 'short' }); } catch { /* web */ }
                return;
            }

            // 刷新列表获取最新 is_active 状态
            await fetchPlans();
            // 刷新宠物列表（has_plan 可能变化）
            if (fetchPets) await fetchPets();

            try {
                const linkedPet = plan.pet_id ? pets.find(p => p.id === plan.pet_id) : null;
                const petName = linkedPet?.name || '宠物';
                await Toast.show({ text: `已应用「${petName}」的食谱，已生成${res.data?.meals_created || 0}天餐食`, duration: 'short' });
            } catch { /* web 环境 */ }
        } catch (err) {
            console.error('Failed to apply plan:', err);
            try {
                await Toast.show({ text: '应用食谱失败，请重试', duration: 'short' });
            } catch { /* web 环境 */ }
        } finally {
            setApplyingId(null);
        }
    };

    // 删除食谱（确认弹窗 + 乐观更新）
    const handleDelete = (plan) => {
        setDeletingId(plan.id);
    };

    const confirmDelete = async () => {
        if (!deletingId) return;
        const planToDelete = plans.find(p => p.id === deletingId);

        // 乐观删除
        setPlans(prev => prev.filter(p => p.id !== deletingId));

        try {
            const res = await plansApi.deletePlan(deletingId);
            // 校验返回码，确保后端确实删除成功
            if (res.code !== 0) {
                throw new Error(res.message || '删除失败');
            }
            try {
                await Toast.show({ text: '食谱已删除', duration: 'short' });
            } catch { /* web 环境 */ }
        } catch (err) {
            console.error('Failed to delete plan:', err);
            // 回滚乐观删除
            if (planToDelete) setPlans(prev => [planToDelete, ...prev]);
            try {
                await Toast.show({ text: '删除失败，请重试', duration: 'short' });
            } catch { /* web 环境 */ }
        }
        setDeletingId(null);
    };

    // 查看详情
    const handleView = (plan) => {
        navigate('/plan/summary', { state: { planId: plan.id } });
    };

    // 格式化日期
    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        try {
            const d = new Date(dateStr);
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        } catch {
            return dateStr;
        }
    };

    // 渲染空状态
    const renderEmpty = () => (
        <div className="flex flex-col items-center justify-center py-20">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <span className="material-icons-round text-primary text-4xl">restaurant_menu</span>
            </div>
            <h3 className="font-bold text-lg mb-2 text-text-main-light dark:text-text-main-dark">暂无保存的食谱</h3>
            <p className="text-sm text-text-muted-light dark:text-text-muted-dark text-center mb-8 max-w-[240px]">
                为您的爱宠生成一份饮食计划后，即可在这里管理
            </p>
            <button
                onClick={() => navigate('/plan/create')}
                className="px-8 py-3 bg-primary text-white dark:text-gray-900 rounded-2xl font-bold shadow-glow hover:brightness-110 transition-all flex items-center gap-2"
            >
                <span className="material-icons-round">add</span>
                去创建
            </button>
        </div>
    );

    // 渲染计划卡片
    const renderPlanCard = (plan) => {
        const isActive = plan.is_active === true;
        const isApplying = applyingId === plan.id;
        const petType = (plan.pet_type || 'dog') === 'dog' ? 'dog' : 'cat';
        const petIcon = petType === 'dog' ? '🐕' : '🐱';
        const petBreed = plan.pet_breed || '';
        const petWeight = plan.pet_weight;
        // 通过 pet_id 从 PetContext 查找宠物名
        const linkedPet = plan.pet_id ? pets.find(p => p.id === plan.pet_id) : null;
        const petName = linkedPet?.name || '宠物';

        return (
            <motion.div
                key={plan.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                className={`bg-white dark:bg-surface-dark rounded-2xl p-5 shadow-soft border transition-all duration-300 ${
                    isActive
                        ? 'border-primary/40 ring-2 ring-primary/20'
                        : 'border-gray-100 dark:border-gray-800 hover:shadow-medium'
                }`}
            >
                {/* 卡片头部 */}
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">{petIcon}</span>
                        <div>
                            <h4 className="font-bold text-base text-text-main-light dark:text-text-main-dark">
                                {petName} 的食谱
                            </h4>
                            <p className="text-xs text-text-muted-light dark:text-text-muted-dark mt-0.5">
                                {petBreed} {petWeight ? `· ${petWeight}kg` : ''} · {formatDate(plan.created_at)}
                            </p>
                        </div>
                    </div>
                    {isActive && (
                        <span className="text-xs font-bold bg-primary/15 text-primary px-2.5 py-1 rounded-full flex items-center gap-1 shrink-0">
                            <span className="material-icons-round text-xs">check_circle</span>
                            使用中
                        </span>
                    )}
                </div>

                {/* 卡片简要信息 */}
                <div className="flex items-center gap-4 text-xs text-text-muted-light dark:text-text-muted-dark mb-4">
                    <span className="flex items-center gap-1">
                        <span className="material-icons-round text-sm text-primary">calendar_month</span>
                        4 周计划
                    </span>
                    {isActive && plan.applied_at && (
                        <span className="flex items-center gap-1">
                            <span className="material-icons-round text-sm text-green-500">schedule</span>
                            {formatDate(plan.applied_at)} 应用
                        </span>
                    )}
                </div>

                {/* 操作按钮 */}
                <div className="flex items-center gap-2">
                    {!isActive && (
                        <button
                            onClick={() => handleApply(plan)}
                            disabled={isApplying}
                            className={`flex-1 py-2.5 rounded-xl text-sm font-bold active:scale-[0.98] transition-all flex items-center justify-center gap-1 ${
                                isApplying
                                    ? 'bg-primary/60 text-white/70 cursor-wait'
                                    : 'bg-primary text-white dark:text-gray-900 hover:brightness-110'
                            }`}
                        >
                            {isApplying ? (
                                <>
                                    <span className="material-icons-round text-sm animate-spin">sync</span>
                                    应用中...
                                </>
                            ) : (
                                <>
                                    <span className="material-icons-round text-sm">play_arrow</span>
                                    应用
                                </>
                            )}
                        </button>
                    )}
                    <button
                        onClick={() => handleView(plan)}
                        className={`${isActive ? 'flex-1' : ''} py-2.5 px-4 rounded-xl bg-gray-100 dark:bg-gray-700 text-text-main-light dark:text-text-main-dark text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 active:scale-[0.98] transition-all flex items-center justify-center gap-1`}
                    >
                        <span className="material-icons-round text-sm">visibility</span>
                        查看
                    </button>
                    <button
                        onClick={() => handleDelete(plan)}
                        className="py-2.5 px-4 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-500 text-sm font-medium hover:bg-red-100 dark:hover:bg-red-900/40 active:scale-[0.98] transition-all flex items-center justify-center gap-1"
                    >
                        <span className="material-icons-round text-sm">delete_outline</span>
                        删除
                    </button>
                </div>
            </motion.div>
        );
    };

    return (
        <motion.div {...pageTransitions} className="pb-28 overflow-x-hidden">
            {/* Header */}
            <header className="px-6 pt-12 pb-4 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md sticky top-0 z-50">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center">
                        <span className="material-icons-round text-primary text-xl">restaurant_menu</span>
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-text-main-light dark:text-text-main-dark">已保存食谱</h1>
                        <p className="text-xs text-text-muted-light dark:text-text-muted-dark">
                            管理您的宠物饮食计划
                        </p>
                    </div>
                </div>
            </header>

            <main className="px-6">
                {loading ? (
                    <div className="space-y-4 mt-2">
                        {Array.from({ length: 3 }, (_, i) => (
                            <div key={i} className="bg-white dark:bg-surface-dark rounded-2xl p-5 shadow-soft border border-gray-100 dark:border-gray-800">
                                <div className="flex items-start gap-3 mb-3">
                                    <Skeleton className="h-8 w-8 rounded-lg" />
                                    <div className="flex-1 space-y-2">
                                        <Skeleton className="h-4 w-32" />
                                        <Skeleton className="h-3 w-48" />
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 mb-4">
                                    <Skeleton className="h-3 w-20" />
                                    <Skeleton className="h-3 w-24" />
                                </div>
                                <div className="flex gap-2">
                                    <Skeleton className="h-10 flex-1 rounded-xl" />
                                    <Skeleton className="h-10 w-16 rounded-xl" />
                                    <Skeleton className="h-10 w-16 rounded-xl" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : plans.length === 0 ? (
                    renderEmpty()
                ) : (
                    <div className="space-y-4 mt-2">
                        <AnimatePresence mode="popLayout">
                            {plans.map(plan => renderPlanCard(plan))}
                        </AnimatePresence>
                    </div>
                )}
            </main>

            {/* 删除确认弹窗 */}
            <AnimatePresence>
                {deletingId && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-8"
                        onClick={() => setDeletingId(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white dark:bg-surface-dark rounded-3xl p-6 w-full max-w-sm shadow-xl"
                        >
                            <div className="flex flex-col items-center text-center">
                                <div className="w-14 h-14 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center mb-4">
                                    <span className="material-icons-round text-red-500 text-2xl">delete_forever</span>
                                </div>
                                <h3 className="font-bold text-lg mb-2">确认删除食谱？</h3>
                                <p className="text-sm text-text-muted-light dark:text-text-muted-dark mb-6">
                                    删除后将无法恢复，确定要继续吗？
                                </p>
                                <div className="flex gap-3 w-full">
                                    <button
                                        onClick={() => setDeletingId(null)}
                                        className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-gray-700 text-text-main-light dark:text-text-main-dark font-medium hover:bg-gray-200 transition-colors"
                                    >
                                        取消
                                    </button>
                                    <button
                                        onClick={confirmDelete}
                                        className="flex-1 py-3 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 transition-colors"
                                    >
                                        确认删除
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
