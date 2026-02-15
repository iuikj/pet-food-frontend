import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import DropdownMenu from './DropdownMenu';
import { formatPetAge } from '../utils/petUtils';

/**
 * 可复用的宠物卡片组件
 * @param {Object} pet - 宠物数据
 * @param {function} onDelete - 删除回调
 * @param {boolean} showActions - 是否显示底部操作按钮
 * @param {string} variant - 样式变体 'default' | 'compact'
 */
export default function PetCard({ pet, onDelete, showActions = true, variant = 'default' }) {
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const handleEdit = () => {
        navigate(`/pet/edit/${pet.id}`);
    };

    const handleDelete = () => {
        setShowDeleteConfirm(true);
    };

    const confirmDelete = () => {
        onDelete?.(pet.id);
        setShowDeleteConfirm(false);
    };

    const menuItems = [
        { icon: 'edit', label: '编辑资料', onClick: handleEdit },
        { icon: 'assignment', label: 'AI 档案', onClick: () => { } },
        { icon: 'delete_outline', label: '删除宠物', onClick: handleDelete, danger: true }
    ];

    return (
        <>
            <div className="bg-white dark:bg-surface-dark p-5 rounded-2xl shadow-medium border border-gray-100 dark:border-gray-800 relative overflow-hidden group hover:shadow-large hover:-translate-y-1 active:scale-[0.99] active:shadow-soft transition-all duration-300">
                {/* 装饰背景 */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110" />

                <div className="flex gap-4 relative z-10">
                    {/* 宠物头像 */}
                    <div className="relative w-24 h-24 flex-shrink-0">
                        {pet.avatar ? (
                            <img
                                alt={pet.name}
                                className="w-full h-full object-cover rounded-2xl shadow-sm"
                                src={pet.avatar}
                            />
                        ) : (
                            <div className="w-full h-full rounded-2xl bg-accent-blue/10 dark:bg-accent-blue/5 flex items-center justify-center text-accent-blue border border-accent-blue/20">
                                <span className="material-icons-round text-4xl opacity-80">pets</span>
                            </div>
                        )}
                    </div>

                    {/* 宠物信息 */}
                    <div className="flex-1 min-w-0 py-1">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="font-bold text-xl truncate">{pet.name}</h3>
                                <p className="text-sm text-text-muted-light dark:text-text-muted-dark">{pet.type}</p>
                            </div>

                            {/* 三点菜单按钮 */}
                            <div className="relative">
                                <button
                                    onClick={() => setMenuOpen(!menuOpen)}
                                    className="w-8 h-8 -mr-2 -mt-2 flex items-center justify-center rounded-full text-text-muted-light hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                >
                                    <span className="material-icons-round text-lg">more_vert</span>
                                </button>

                                {/* 下拉菜单 */}
                                <DropdownMenu
                                    isOpen={menuOpen}
                                    onClose={() => setMenuOpen(false)}
                                    items={menuItems}
                                    position="right"
                                />
                            </div>
                        </div>

                        {/* 宠物属性标签 */}
                        <div className="flex flex-wrap gap-2 mt-3">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-text-muted-light dark:text-text-muted-dark text-xs font-semibold">
                                <span className="material-icons-round text-xs">cake</span> {formatPetAge(pet.age)}
                            </span>
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-text-muted-light dark:text-text-muted-dark text-xs font-semibold">
                                <span className="material-icons-round text-xs">monitor_weight</span> {pet.weight} kg
                            </span>
                        </div>
                    </div>
                </div>

                {/* 底部操作按钮 */}
                {showActions && (
                    <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-800 flex gap-3">
                        <Link
                            to={`/pet/edit/${pet.id}`}
                            className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-text-muted-light dark:text-text-muted-dark text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                        >
                            <span className="material-icons-round text-base">edit</span>
                            编辑
                        </Link>
                        <button className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-primary to-green-400 text-white text-sm font-bold shadow-glow hover:shadow-lg transition-all flex items-center justify-center gap-2 group">
                            <span className="material-icons-round text-base group-hover:scale-110 transition-transform">auto_awesome</span>
                            AI 档案
                        </button>
                    </div>
                )}
            </div>

            {/* 删除确认弹窗 */}
            <AnimatePresence>
                {showDeleteConfirm && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                            onClick={() => setShowDeleteConfirm(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm bg-white dark:bg-surface-dark rounded-3xl shadow-large z-50 p-6"
                        >
                            <div className="text-center">
                                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                                    <span className="material-icons-round text-red-500 text-3xl">delete_forever</span>
                                </div>
                                <h3 className="text-xl font-bold mb-2">确定删除？</h3>
                                <p className="text-text-muted-light dark:text-text-muted-dark mb-6">
                                    删除后将无法恢复 {pet.name} 的所有数据
                                </p>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setShowDeleteConfirm(false)}
                                        className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-text-main-light dark:text-text-main-dark font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                    >
                                        取消
                                    </button>
                                    <button
                                        onClick={confirmDelete}
                                        className="flex-1 py-3 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-600 transition-colors"
                                    >
                                        删除
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
