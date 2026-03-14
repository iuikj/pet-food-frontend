import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Toast } from '@capacitor/toast';
import { pageTransitions } from '../utils/animations';
import { usePets } from '../context/PetContext';
import { plansApi } from '../api';
import { transformPetDietPlan } from '../models/dietPlan';

export default function RecipesPage() {
    const navigate = useNavigate();
    const { pets, currentPet, activePlanId, setActivePlan, setActivePlanData, clearActivePlan } = usePets();

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

    // 应用食谱 — 同时获取计划详情存储到 activePlanData
    const handleApply = async (plan) => {
        if (!currentPet?.id || applyingId) return;

        setApplyingId(plan.id);
        try {
            // 1. 获取计划详情
            const detailRes = await plansApi.getPlan(plan.id);
            if (detailRes.code !== 0 || !detailRes.data) {
                try { await Toast.show({ text: '获取食谱详情失败', duration: 'short' }); } catch { /* web */ }
                return;
            }

            // 2. 转换数据并校验是否有效（防止 plan_data 为空的旧计划）
            const planData = detailRes.data.plan_data || detailRes.data;
            const transformed = transformPetDietPlan(planData);
            if (!transformed || !transformed.weeks || transformed.weeks.length === 0) {
                try { await Toast.show({ text: '该食谱数据不完整，请重新生成', duration: 'long' }); } catch { /* web */ }
                return;
            }

            // 3. 数据有效 → 设置活跃计划
            setActivePlan(currentPet.id, plan.id);
            setActivePlanData(currentPet.id, transformed);

            try {
                const linkedPet = plan.pet_id ? pets.find(p => p.id === plan.pet_id) : null;
                const petName = linkedPet?.name || '宠物';
                await Toast.show({ text: `已应用「${petName}」的食谱`, duration: 'short' });
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

        // 如果是活跃计划，同时清除（包括 activePlanData）
        const wasActivePlan = currentPet?.id && activePlanId === deletingId;
        if (wasActivePlan) {
            clearActivePlan(currentPet.id);
        }

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
            // 回滚活跃计划
            if (wasActivePlan && currentPet?.id) {
                setActivePlan(currentPet.id, deletingId);
            }
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
        const isActive = currentPet?.id && activePlanId === plan.id;
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
                    {plan.health_goal && (
                        <span className="flex items-center gap-1">
                            <span className="material-icons-round text-sm text-yellow-500">flag</span>
                            {plan.health_goal}
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
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                        <p className="text-sm text-text-muted-light dark:text-text-muted-dark mt-4">加载中...</p>
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
