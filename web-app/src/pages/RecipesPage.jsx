import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { showToast } from '../utils/toast';
import { pageTransitions } from '../utils/animations';
import { usePets } from '../hooks/usePets';
import { useIngredients } from '../hooks/useIngredients';
import { plansApi } from '../api';
import SecureImage from '../components/SecureImage';
import PetIcon from '../components/icons/PetIcon';
import Skeleton from '../components/ui/Skeleton';
import IngredientCard from '../components/IngredientCard';
import IngredientFormSheet from '../components/IngredientFormSheet';
import Modal from '../components/Modal';

const SCOPE_OPTIONS = [
    { value: 'all', label: '全部' },
    { value: 'system', label: '系统' },
    { value: 'custom', label: '我的' },
];

export default function RecipesPage() {
    const navigate = useNavigate();
    const { pets, fetchPets } = usePets();

    // 顶部 Tab：plans | ingredients
    const [activeTab, setActiveTab] = useState('plans');

    // ─────────── 计划管理（原逻辑） ───────────
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [applyingId, setApplyingId] = useState(null);
    const [deletingId, setDeletingId] = useState(null);
    const [collapsedPets, setCollapsedPets] = useState({});

    const groupedPlans = useMemo(() => {
        const groups = {};
        for (const plan of plans) {
            const key = plan.pet_id || '_unknown';
            if (!groups[key]) groups[key] = [];
            groups[key].push(plan);
        }
        return groups;
    }, [plans]);

    const togglePetCollapse = (petId) => {
        setCollapsedPets(prev => ({ ...prev, [petId]: !prev[petId] }));
    };

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

    const handleApply = async (plan) => {
        if (applyingId) return;
        setApplyingId(plan.id);
        try {
            const res = await plansApi.applyPlan(plan.id);
            if (res.code !== 0) {
                try { await showToast(res.message || '应用失败'); } catch { /* */ }
                return;
            }
            await fetchPlans();
            if (fetchPets) await fetchPets();
            try {
                const linkedPet = plan.pet_id ? pets.find(p => p.id === plan.pet_id) : null;
                const petName = linkedPet?.name || '宠物';
                await showToast(`已应用「${petName}」的食谱，已生成${res.data?.meals_created || 0}天餐食`);
            } catch { /* */ }
        } catch (err) {
            console.error('Failed to apply plan:', err);
            try { await showToast('应用食谱失败，请重试'); } catch { /* */ }
        } finally {
            setApplyingId(null);
        }
    };

    const handleDelete = (plan) => { setDeletingId(plan.id); };

    const confirmDelete = async () => {
        if (!deletingId) return;
        const planToDelete = plans.find(p => p.id === deletingId);
        setPlans(prev => prev.filter(p => p.id !== deletingId));
        try {
            const res = await plansApi.deletePlan(deletingId);
            if (res.code !== 0) throw new Error(res.message || '删除失败');
            try { await showToast('食谱已删除'); } catch { /* */ }
        } catch (err) {
            console.error('Failed to delete plan:', err);
            if (planToDelete) setPlans(prev => [planToDelete, ...prev]);
            try { await showToast('删除失败，请重试'); } catch { /* */ }
        }
        setDeletingId(null);
    };

    const handleView = (plan) => {
        navigate('/plan/summary', { state: { planId: plan.id } });
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        try {
            const d = new Date(dateStr);
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        } catch {
            return dateStr;
        }
    };

    // ─────────── 食材库 ───────────
    const ingredients = useIngredients({ initialScope: 'all', pageSize: 30 });

    const [formOpen, setFormOpen] = useState(false);
    const [editingIngredient, setEditingIngredient] = useState(null);
    const [pendingDeleteIng, setPendingDeleteIng] = useState(null);

    const handleOpenCreate = () => {
        setEditingIngredient(null);
        setFormOpen(true);
    };

    const handleOpenEdit = (ing) => {
        setEditingIngredient(ing);
        setFormOpen(true);
    };

    const handleSubmitIngredient = async (payload) => {
        if (editingIngredient?.id) {
            return await ingredients.update(editingIngredient.id, payload);
        }
        return await ingredients.create(payload);
    };

    const handleConfirmDeleteIng = async () => {
        if (!pendingDeleteIng) return;
        const res = await ingredients.remove(pendingDeleteIng.id);
        if (res.success) {
            try { await showToast('已删除'); } catch { /* */ }
        } else {
            try { await showToast(res.message || '删除失败'); } catch { /* */ }
        }
        setPendingDeleteIng(null);
    };

    // ─────────── 渲染 ───────────

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

    const renderPlanCard = (plan) => {
        const isActive = plan.is_active === true;
        const isApplying = applyingId === plan.id;
        const petType = (plan.pet_type || 'dog') === 'dog' ? 'dog' : 'cat';
        const petBreed = plan.pet_breed || '';
        const petWeight = plan.pet_weight;
        const linkedPet = plan.pet_id ? pets.find(p => p.id === plan.pet_id) : null;
        const petName = linkedPet?.name || '宠物';

        return (
            <motion.div
                key={plan.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                className={`bg-white dark:bg-surface-dark rounded-2xl p-5 border transition-all duration-300 ${
                    isActive ? 'border-primary/40' : 'border-gray-100 dark:border-gray-800'
                }`}
            >
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                        <PetIcon type={petType} size={28} className="text-primary" />
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

    const renderPlansTab = () => {
        if (loading) {
            return (
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
            );
        }
        if (plans.length === 0) return renderEmpty();
        return (
            <div className="space-y-6 mt-2">
                {Object.entries(groupedPlans).map(([petId, petPlans]) => {
                    const pet = pets.find(p => p.id === petId);
                    const petName = pet?.name || '未关联宠物';
                    const isCollapsed = collapsedPets[petId] ?? false;
                    return (
                        <div key={petId}>
                            <button
                                onClick={() => togglePetCollapse(petId)}
                                className="w-full flex items-center gap-3 mb-3 px-1 group"
                            >
                                <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden flex-shrink-0">
                                    {pet?.avatar_url ? (
                                        <SecureImage
                                            src={pet.avatar_url}
                                            alt={petName}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-primary font-bold">
                                            {petName.charAt(0)}
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 text-left">
                                    <span className="font-bold text-text-main-light dark:text-text-main-dark">
                                        {petName}
                                    </span>
                                    <span className="text-xs text-text-muted-light dark:text-text-muted-dark ml-2">
                                        {petPlans.length} 个食谱
                                    </span>
                                </div>
                                <motion.span
                                    className="material-icons-round text-text-muted-light dark:text-text-muted-dark text-xl"
                                    animate={{ rotate: isCollapsed ? -90 : 0 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    expand_more
                                </motion.span>
                            </button>

                            <AnimatePresence initial={false}>
                                {!isCollapsed && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.25 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="space-y-4">
                                            <AnimatePresence mode="popLayout">
                                                {petPlans.map(plan => renderPlanCard(plan))}
                                            </AnimatePresence>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    );
                })}
            </div>
        );
    };

    const renderIngredientsTab = () => {
        return (
            <div className="space-y-4 mt-2">
                {/* 搜索 + 归属筛选 */}
                <div className="space-y-2 sticky top-[128px] z-20 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md -mx-6 px-6 pb-2">
                    <div className="relative">
                        <span className="material-icons-round absolute left-3 top-1/2 -translate-y-1/2 text-text-muted-light dark:text-text-muted-dark text-xl">
                            search
                        </span>
                        <input
                            type="text"
                            value={ingredients.keyword}
                            onChange={(e) => ingredients.setKeyword(e.target.value)}
                            placeholder="搜索食材名称"
                            className="w-full bg-white dark:bg-surface-dark rounded-xl pl-10 pr-3 py-2.5 text-sm shadow-soft focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                        {ingredients.keyword && (
                            <button
                                onClick={() => ingredients.setKeyword('')}
                                className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-text-muted-light dark:text-text-muted-dark"
                            >
                                <span className="material-icons-round text-base">close</span>
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-1 bg-white dark:bg-surface-dark p-1 rounded-xl shadow-soft">
                        {SCOPE_OPTIONS.map((opt) => (
                            <button
                                key={opt.value}
                                onClick={() => ingredients.setScope(opt.value)}
                                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                    ingredients.scope === opt.value
                                        ? 'bg-primary text-white dark:text-gray-900 shadow-sm'
                                        : 'text-text-muted-light dark:text-text-muted-dark hover:bg-gray-50 dark:hover:bg-gray-800'
                                }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>

                    {/* 分类筛选 */}
                    {ingredients.categories.length > 0 && (
                        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                            <button
                                onClick={() => ingredients.setCategory('')}
                                className={`shrink-0 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                                    !ingredients.category
                                        ? 'bg-primary text-white dark:text-gray-900'
                                        : 'bg-white dark:bg-surface-dark text-text-muted-light dark:text-text-muted-dark'
                                }`}
                            >
                                全部分类
                            </button>
                            {Array.from(new Set(ingredients.categories.map(c => c.category))).map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => ingredients.setCategory(cat === ingredients.category ? '' : cat)}
                                    className={`shrink-0 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                                        ingredients.category === cat
                                            ? 'bg-primary text-white dark:text-gray-900'
                                            : 'bg-white dark:bg-surface-dark text-text-muted-light dark:text-text-muted-dark'
                                    }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* 统计 + 新增 */}
                <div className="flex items-center justify-between text-xs text-text-muted-light dark:text-text-muted-dark">
                    <span>共 {ingredients.total} 种食材</span>
                    <button
                        onClick={handleOpenCreate}
                        className="flex items-center gap-1 text-primary font-semibold hover:opacity-80 active:scale-95 transition-all"
                    >
                        <span className="material-icons-round text-base">add_circle</span>
                        新增自定义
                    </button>
                </div>

                {/* 列表 */}
                {ingredients.loading && ingredients.items.length === 0 ? (
                    <div className="space-y-3">
                        {Array.from({ length: 4 }, (_, i) => (
                            <div key={i} className="bg-white dark:bg-surface-dark rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
                                <Skeleton className="h-4 w-32 mb-2" />
                                <Skeleton className="h-3 w-24 mb-3" />
                                <div className="grid grid-cols-4 gap-2">
                                    {Array.from({ length: 4 }, (__, j) => (
                                        <Skeleton key={j} className="h-8 rounded" />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : ingredients.items.length === 0 ? (
                    <div className="flex flex-col items-center py-16 text-text-muted-light dark:text-text-muted-dark">
                        <span className="material-icons-round text-4xl mb-2 opacity-40">inventory_2</span>
                        <p className="text-sm mb-4">
                            {ingredients.keyword ? '未找到匹配的食材' : '暂无食材'}
                        </p>
                        <button
                            onClick={handleOpenCreate}
                            className="px-5 py-2 rounded-xl bg-primary text-white dark:text-gray-900 text-sm font-bold active:scale-95 transition-transform flex items-center gap-1"
                        >
                            <span className="material-icons-round text-base">add</span>
                            添加自定义食材
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="space-y-3">
                            <AnimatePresence mode="popLayout">
                                {ingredients.items.map((ing) => (
                                    <IngredientCard
                                        key={ing.id}
                                        ingredient={ing}
                                        onEdit={handleOpenEdit}
                                        onDelete={setPendingDeleteIng}
                                    />
                                ))}
                            </AnimatePresence>
                        </div>

                        {ingredients.hasMore && (
                            <button
                                onClick={ingredients.loadMore}
                                disabled={ingredients.loadingMore}
                                className="w-full py-3 rounded-xl bg-white dark:bg-surface-dark text-primary text-sm font-semibold shadow-soft active:scale-[0.98] transition-transform flex items-center justify-center gap-1 disabled:opacity-50"
                            >
                                {ingredients.loadingMore ? (
                                    <>
                                        <span className="material-icons-round text-sm animate-spin">sync</span>
                                        加载中
                                    </>
                                ) : (
                                    <>
                                        加载更多
                                        <span className="material-icons-round text-sm">expand_more</span>
                                    </>
                                )}
                            </button>
                        )}
                    </>
                )}
            </div>
        );
    };

    return (
        <motion.div {...pageTransitions} className="pb-28 overflow-x-hidden">
            {/* Header */}
            <header className="px-6 pt-12 pb-3 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md sticky top-0 z-50">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center">
                        <span className="material-icons-round text-primary text-xl">restaurant_menu</span>
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-text-main-light dark:text-text-main-dark">食谱与食材</h1>
                        <p className="text-xs text-text-muted-light dark:text-text-muted-dark">
                            管理饮食计划与食材库
                        </p>
                    </div>
                </div>
                {/* Tabs */}
                <div className="flex items-center gap-1 bg-white dark:bg-surface-dark p-1 rounded-xl shadow-soft">
                    <button
                        onClick={() => setActiveTab('plans')}
                        className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-1 ${
                            activeTab === 'plans'
                                ? 'bg-primary text-white dark:text-gray-900 shadow-sm'
                                : 'text-text-muted-light dark:text-text-muted-dark'
                        }`}
                    >
                        <span className="material-icons-round text-base">menu_book</span>
                        食谱
                    </button>
                    <button
                        onClick={() => setActiveTab('ingredients')}
                        className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-1 ${
                            activeTab === 'ingredients'
                                ? 'bg-primary text-white dark:text-gray-900 shadow-sm'
                                : 'text-text-muted-light dark:text-text-muted-dark'
                        }`}
                    >
                        <span className="material-icons-round text-base">inventory_2</span>
                        食材库
                    </button>
                </div>
            </header>

            <main className="px-6">
                {activeTab === 'plans' ? renderPlansTab() : renderIngredientsTab()}
            </main>

            {/* 计划删除确认弹窗 */}
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

            {/* 食材表单抽屉 */}
            <IngredientFormSheet
                isOpen={formOpen}
                onClose={() => setFormOpen(false)}
                onSubmit={handleSubmitIngredient}
                initial={editingIngredient}
                categories={ingredients.categories}
            />

            {/* 食材删除确认 */}
            <Modal
                isOpen={!!pendingDeleteIng}
                onClose={() => setPendingDeleteIng(null)}
                onConfirm={handleConfirmDeleteIng}
                title="删除该食材？"
                message={pendingDeleteIng ? `将从您的自定义食材中移除「${pendingDeleteIng.name}」` : ''}
                confirmText="删除"
                cancelText="取消"
                type="danger"
            />
        </motion.div>
    );
}
