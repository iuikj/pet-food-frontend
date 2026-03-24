import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { pageTransitions } from '../utils/animations';
import { usePets } from '../hooks/usePets';
import { useUser } from '../hooks/useUser';
import PetCard from '../components/PetCard';
import Modal from '../components/Modal';
import Skeleton from '../components/ui/Skeleton';

export default function Profile() {
    const navigate = useNavigate();
    const { pets, deletePet, isLoading: petsLoading } = usePets();
    const { user, logout, isLoading: userLoading } = useUser();

    // Modal 状态
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [showDeletePetModal, setShowDeletePetModal] = useState(false);
    const [petToDelete, setPetToDelete] = useState(null);

    const handleDeletePet = (petId) => {
        const pet = pets.find(p => p.id === petId);
        setPetToDelete(pet);
        setShowDeletePetModal(true);
    };

    const confirmDeletePet = async () => {
        if (petToDelete) {
            await deletePet(petToDelete.id);
            setPetToDelete(null);
        }
    };

    const handleLogout = () => {
        setShowLogoutModal(true);
    };

    const confirmLogout = () => {
        logout();
        navigate('/login');
    };

    if (userLoading) {
        return (
            <div className="pb-32 overflow-x-hidden">
                {/* Header skeleton */}
                <div className="px-6 pt-12 pb-2 flex justify-end gap-3">
                    <Skeleton.Circle size={40} />
                    <Skeleton.Circle size={40} />
                </div>
                <div className="px-6 space-y-8">
                    {/* User info skeleton */}
                    <div className="flex items-center gap-4">
                        <Skeleton.Circle size={80} />
                        <div className="space-y-2">
                            <Skeleton className="h-5 w-28" />
                            <Skeleton className="h-4 w-40" />
                        </div>
                    </div>
                    {/* Pet cards skeleton */}
                    <div>
                        <div className="flex justify-between items-end mb-4">
                            <Skeleton className="h-6 w-24" />
                            <Skeleton className="h-4 w-16" />
                        </div>
                        <div className="space-y-4">
                            {Array.from({ length: 2 }, (_, i) => (
                                <div key={i} className="bg-white dark:bg-surface-dark rounded-2xl p-5 shadow-soft">
                                    <div className="flex items-center gap-3">
                                        <Skeleton.Circle size={48} />
                                        <div className="flex-1 space-y-2">
                                            <Skeleton className="h-4 w-24" />
                                            <Skeleton className="h-3 w-36" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            {...pageTransitions}
            className="pb-32 overflow-x-hidden"
        >
            <header className="px-6 pt-12 pb-2 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md sticky top-0 z-50">
                <div className="flex justify-end gap-3">
                    <button className="w-10 h-10 rounded-full bg-white dark:bg-surface-dark shadow-sm flex items-center justify-center text-text-muted-light dark:text-text-muted-dark hover:text-primary transition-all active:scale-[0.95]">
                        <span className="material-icons-round">settings</span>
                    </button>
                    <button className="w-10 h-10 rounded-full bg-white dark:bg-surface-dark shadow-sm flex items-center justify-center text-text-muted-light dark:text-text-muted-dark hover:text-primary transition-all active:scale-[0.95]" title="Toggle Theme">
                        <span className="material-icons-round">dark_mode</span>
                    </button>
                </div>
            </header>

            <main className="px-6 space-y-8">
                {/* 用户信息卡片 */}
                <section className="flex items-center gap-4">
                    <div className="relative">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent-blue p-1 shadow-glow">
                            {user?.avatar_url ? (
                                <img
                                    alt="User Avatar"
                                    className="w-full h-full rounded-full object-cover border-2 border-white dark:border-background-dark"
                                    src={user.avatar_url}
                                />
                            ) : (
                                <div className="w-full h-full rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center border-2 border-white dark:border-background-dark">
                                    <span className="material-icons-round text-3xl text-gray-400">person</span>
                                </div>
                            )}
                        </div>
                        <Link
                            to="/profile/edit"
                            className="absolute bottom-0 right-0 w-6 h-6 bg-primary rounded-full border-2 border-white dark:border-background-dark flex items-center justify-center text-white hover:bg-green-400 transition-all active:scale-[0.9]"
                        >
                            <span className="material-icons-round text-[14px]">edit</span>
                        </Link>
                    </div>
                    <div>
                        <h2 className="text-lg font-bold">{user?.nickname || user?.username || '用户'}</h2>
                        <p className="text-sm text-text-muted-light dark:text-text-muted-dark">{user?.email}</p>
                        {user?.is_pro && (
                            <div className="flex items-center gap-2 mt-2">
                                <span className="px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded text-xs font-bold flex items-center gap-1">
                                    <span className="material-icons-round text-[14px]">star</span> PRO 会员
                                </span>
                            </div>
                        )}
                    </div>
                </section>

                {/* 宠物列表 */}
                <section>
                    <div className="flex justify-between items-end mb-4">
                        <h2 className="text-xl font-bold">我的宠物</h2>
                        <span className="text-sm text-text-muted-light dark:text-text-muted-dark">
                            {pets.length} 只宠物
                        </span>
                    </div>
                    <div className="space-y-4">
                        {/* 使用 PetCard 组件渲染宠物列表 */}
                        {pets.map(pet => (
                            <PetCard
                                key={pet.id}
                                pet={pet}
                                onDelete={handleDeletePet}
                                showActions={true}
                            />
                        ))}

                        {/* 新增宠物按钮 */}
                        <Link
                            to="/onboarding/step1"
                            state={{ from: '/profile' }}
                            className="w-full p-6 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-primary/50 dark:hover:border-primary/50 bg-gray-50/50 dark:bg-surface-dark/30 hover:bg-primary/10 hover:shadow-soft transition-all duration-300 group flex flex-col items-center justify-center gap-2 active:scale-[0.98]"
                        >
                            <div className="w-12 h-12 rounded-full bg-white dark:bg-surface-dark shadow-sm flex items-center justify-center text-text-muted-light group-hover:text-white group-hover:bg-primary transition-all duration-300">
                                <span className="material-icons-round text-2xl">add</span>
                            </div>
                            <span className="font-bold text-text-muted-light dark:text-text-muted-dark group-hover:text-primary transition-colors">新增宠物</span>
                        </Link>
                    </div>
                </section>

                {/* 退出登录按钮 */}
                <section className="mt-8">
                    <button
                        onClick={handleLogout}
                        className="w-full p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-bold flex items-center justify-center gap-2 hover:bg-red-100 dark:hover:bg-red-900/30 transition-all active:scale-[0.98]"
                    >
                        <span className="material-icons-round">logout</span>
                        退出登录
                    </button>
                </section>
            </main>

            {/* 退出登录确认弹窗 */}
            <Modal
                isOpen={showLogoutModal}
                onClose={() => setShowLogoutModal(false)}
                onConfirm={confirmLogout}
                title="退出登录"
                message="确定要退出当前账号吗？您可以随时重新登录。"
                confirmText="退出"
                cancelText="取消"
                type="danger"
            />

            {/* 删除宠物确认弹窗 */}
            <Modal
                isOpen={showDeletePetModal}
                onClose={() => {
                    setShowDeletePetModal(false);
                    setPetToDelete(null);
                }}
                onConfirm={confirmDeletePet}
                title="删除宠物"
                message={`确定要删除 "${petToDelete?.name || '这只宠物'}" 吗？此操作无法撤销。`}
                confirmText="删除"
                cancelText="取消"
                type="danger"
            />
        </motion.div>
    );
}
