import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion as Motion } from 'framer-motion';
import SecureImage from './SecureImage';
import { usePets } from '../hooks/usePets';
import { registerBackButtonHandler } from '../hooks/useBackButton';
import {
    Drawer,
    DrawerFooter,
    DrawerHeader,
    DrawerPanel,
    DrawerPopup,
    DrawerTitle,
} from './ui/drawer';

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
    const location = useLocation();

    useEffect(() => {
        if (!isOpen) return undefined;
        return registerBackButtonHandler(() => {
            onClose?.();
            return true;
        });
    }, [isOpen, onClose]);

    const handlePetClick = (pet) => {
        setCurrentPet(pet.id);
        if (onSelectPet) {
            onSelectPet(pet);
        }
        onClose();
    };

    return (
        <Drawer open={isOpen} onOpenChange={(open) => !open && onClose?.()} position="bottom">
            <DrawerPopup className="mx-auto max-w-md bg-white dark:bg-surface-dark [--drawer-height:min(70vh,620px)]" showBar>
                <DrawerHeader className="items-center border-b border-gray-100 px-6 pb-4 pt-5 text-center dark:border-gray-800">
                    <DrawerTitle className="text-lg font-bold text-text-main-light dark:text-text-main-dark">
                        选择宠物
                    </DrawerTitle>
                    <p className="mt-1 text-sm text-text-muted-light dark:text-text-muted-dark">
                        选择一个宠物或添加新成员
                    </p>
                </DrawerHeader>

                <DrawerPanel className="space-y-2 px-4 py-4" scrollFade={false}>
                            {pets.map((pet, index) => (
                                <Motion.button
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
                                        {pet.avatar_url ? (
                                            <SecureImage
                                                src={pet.avatar_url}
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
                                </Motion.button>
                            ))}

                            {/* 添加宠物选项 */}
                            <Motion.div
                                custom={pets.length}
                                variants={itemVariants}
                                initial="hidden"
                                animate="visible"
                            >
                                <Link
                                    to="/onboarding/step1"
                                    state={{ from: location.pathname }}
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
                            </Motion.div>
                </DrawerPanel>

                <DrawerFooter className="border-t border-gray-100 bg-white px-6 py-4 dark:border-gray-800 dark:bg-surface-dark">
                    <Link
                        to="/onboarding/step1"
                        onClick={onClose}
                        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 font-bold text-white shadow-glow transition-all hover:brightness-110 active:scale-[0.98] dark:text-gray-900"
                    >
                        <span className="material-icons-round">add</span>
                        添加宠物
                    </Link>
                </DrawerFooter>
            </DrawerPopup>
        </Drawer>
    );
}
