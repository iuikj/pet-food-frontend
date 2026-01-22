import React from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { usePets } from '../context/PetContext';

const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 }
};

const menuVariants = {
    hidden: {
        y: '100%',
        opacity: 0
    },
    visible: {
        y: 0,
        opacity: 1,
        transition: {
            type: 'spring',
            damping: 25,
            stiffness: 300
        }
    },
    exit: {
        y: '100%',
        opacity: 0,
        transition: {
            duration: 0.2
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: (i) => ({
        opacity: 1,
        x: 0,
        transition: {
            delay: i * 0.05,
            duration: 0.2
        }
    })
};

export default function PetSelectorMenu({ isOpen, onClose, onSelectPet }) {
    const { pets, setCurrentPet } = usePets();

    const handlePetClick = (pet) => {
        setCurrentPet(pet.id);
        if (onSelectPet) {
            onSelectPet(pet);
        }
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* 背景遮罩 */}
                    <motion.div
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
                        variants={overlayVariants}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        onClick={onClose}
                    />

                    {/* 底部菜单 */}
                    <motion.div
                        className="fixed bottom-0 left-0 right-0 bg-white dark:bg-surface-dark rounded-t-3xl shadow-large z-50 max-h-[70vh] overflow-hidden"
                        variants={menuVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                    >
                        {/* 拖动指示条 */}
                        <div className="flex justify-center pt-3 pb-2">
                            <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
                        </div>

                        {/* 标题 */}
                        <div className="px-6 pb-4 border-b border-gray-100 dark:border-gray-800">
                            <h3 className="text-lg font-bold text-center">选择宠物</h3>
                            <p className="text-sm text-text-muted-light dark:text-text-muted-dark text-center mt-1">
                                选择一个宠物或添加新成员
                            </p>
                        </div>

                        {/* 宠物列表 */}
                        <div className="px-4 py-4 space-y-2 max-h-[40vh] overflow-y-auto">
                            {pets.map((pet, index) => (
                                <motion.button
                                    key={pet.id}
                                    custom={index}
                                    variants={itemVariants}
                                    initial="hidden"
                                    animate="visible"
                                    onClick={() => handlePetClick(pet)}
                                    className="w-full flex items-center gap-4 p-4 rounded-2xl bg-background-light dark:bg-background-dark hover:bg-primary/10 dark:hover:bg-primary/10 transition-colors group"
                                >
                                    {/* 宠物头像 */}
                                    <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-700 flex-shrink-0 overflow-hidden border-2 border-white dark:border-gray-600 shadow-sm group-hover:border-primary/50 transition-colors">
                                        {pet.avatar ? (
                                            <img
                                                src={pet.avatar}
                                                alt={pet.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                <span className="material-icons-round text-2xl">pets</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* 宠物信息 */}
                                    <div className="flex-1 text-left">
                                        <h4 className="font-bold text-text-main-light dark:text-text-main-dark group-hover:text-primary transition-colors">
                                            {pet.name}
                                        </h4>
                                        <p className="text-sm text-text-muted-light dark:text-text-muted-dark">
                                            {pet.type}
                                        </p>
                                    </div>

                                    {/* 箭头 */}
                                    <span className="material-icons-round text-text-muted-light dark:text-text-muted-dark group-hover:text-primary group-hover:translate-x-1 transition-all">
                                        chevron_right
                                    </span>
                                </motion.button>
                            ))}

                            {/* 添加宠物选项 */}
                            <motion.div
                                custom={pets.length}
                                variants={itemVariants}
                                initial="hidden"
                                animate="visible"
                            >
                                <Link
                                    to="/onboarding/step1"
                                    onClick={onClose}
                                    className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-primary/50 hover:bg-primary/10 transition-all group"
                                >
                                    {/* 添加图标 */}
                                    <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-700 flex-shrink-0 flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 group-hover:border-primary group-hover:bg-primary/20 transition-colors">
                                        <span className="material-icons-round text-2xl text-gray-400 group-hover:text-primary transition-colors">add</span>
                                    </div>

                                    {/* 添加文字 */}
                                    <div className="flex-1 text-left">
                                        <h4 className="font-bold text-text-muted-light dark:text-text-muted-dark group-hover:text-primary transition-colors">
                                            添加宠物
                                        </h4>
                                        <p className="text-sm text-text-muted-light dark:text-text-muted-dark opacity-70">
                                            创建新的宠物档案
                                        </p>
                                    </div>

                                    {/* 箭头 */}
                                    <span className="material-icons-round text-text-muted-light dark:text-text-muted-dark group-hover:text-primary group-hover:translate-x-1 transition-all">
                                        chevron_right
                                    </span>
                                </Link>
                            </motion.div>
                        </div>

                        {/* 添加宠物按钮 */}
                        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 pb-safe">
                            <Link
                                to="/onboarding/step1"
                                onClick={onClose}
                                className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-primary text-white dark:text-gray-900 font-bold shadow-glow hover:shadow-glow-lg hover:brightness-110 hover:-translate-y-0.5 active:scale-[0.98] transition-all"
                            >
                                <span className="material-icons-round">add</span>
                                添加宠物
                            </Link>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
