import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { pageTransitions } from '../utils/animations';
import { usePets } from '../context/PetContext';
import { useUser } from '../context/UserContext';
import PetCard from '../components/PetCard';

export default function Profile() {
    const { pets, deletePet } = usePets();
    const { user } = useUser();

    const handleDeletePet = (petId) => {
        deletePet(petId);
    };

    return (
        <motion.div
            {...pageTransitions}
            className="pb-32"
        >
            <header className="px-6 pt-12 pb-2 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md sticky top-0 z-50">
                <div className="flex justify-end gap-3">
                    <button className="w-10 h-10 rounded-full bg-white dark:bg-surface-dark shadow-sm flex items-center justify-center text-text-muted-light dark:text-text-muted-dark hover:text-primary transition-colors">
                        <span className="material-icons-round">settings</span>
                    </button>
                    <button className="w-10 h-10 rounded-full bg-white dark:bg-surface-dark shadow-sm flex items-center justify-center text-text-muted-light dark:text-text-muted-dark hover:text-primary transition-colors" title="Toggle Theme">
                        <span className="material-icons-round">dark_mode</span>
                    </button>
                </div>
            </header>

            <main className="px-6 space-y-8">
                {/* 用户信息卡片 */}
                <section className="flex items-center gap-4">
                    <div className="relative">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent-blue p-1 shadow-glow">
                            <img
                                alt="User Avatar"
                                className="w-full h-full rounded-full object-cover border-2 border-white dark:border-background-dark"
                                src={user.avatar}
                            />
                        </div>
                        <Link
                            to="/profile/edit"
                            className="absolute bottom-0 right-0 w-6 h-6 bg-primary rounded-full border-2 border-white dark:border-background-dark flex items-center justify-center text-white hover:bg-green-400 transition-colors"
                        >
                            <span className="material-icons-round text-[14px]">edit</span>
                        </Link>
                    </div>
                    <div>
                        <h2 className="text-lg font-bold">{user.name}</h2>
                        <p className="text-sm text-text-muted-light dark:text-text-muted-dark">{user.email}</p>
                        {user.isPro && (
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
                            className="w-full p-6 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-primary/50 dark:hover:border-primary/50 bg-gray-50/50 dark:bg-surface-dark/30 hover:bg-primary/10 hover:shadow-soft transition-all duration-300 group flex flex-col items-center justify-center gap-2"
                        >
                            <div className="w-12 h-12 rounded-full bg-white dark:bg-surface-dark shadow-sm flex items-center justify-center text-text-muted-light group-hover:text-white group-hover:bg-primary transition-all duration-300">
                                <span className="material-icons-round text-2xl">add</span>
                            </div>
                            <span className="font-bold text-text-muted-light dark:text-text-muted-dark group-hover:text-primary transition-colors">新增宠物</span>
                        </Link>
                    </div>
                </section>
            </main>
        </motion.div>
    );
}
