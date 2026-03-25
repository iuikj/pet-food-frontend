import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import DropdownMenu from './DropdownMenu';
import { formatPetAge } from '../utils/petUtils';

/**
 * 可复用的宠物卡片组件
 * @param {Object} pet - 宠物数据
 * @param {function} onDelete - 删除回调（由父组件处理确认弹窗）
 * @param {boolean} showActions - 是否显示底部操作按钮
 * @param {string} variant - 样式变体 'default' | 'compact'
 */
export default function PetCard({ pet, onDelete, showActions = true, variant = 'default' }) {
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);

    const handleEdit = () => {
        navigate(`/pet/edit/${pet.id}`);
    };

    const handleDelete = () => {
        setMenuOpen(false);
        onDelete?.(pet.id);
    };

    const menuItems = [
        { icon: 'edit', label: '编辑资料', onClick: handleEdit },
        { icon: 'assignment', label: 'AI 档案', onClick: () => { } },
        { icon: 'delete_outline', label: '删除宠物', onClick: handleDelete, danger: true }
    ];

    return (
        <div className="bg-white dark:bg-surface-dark p-5 rounded-2xl shadow-medium border border-gray-100 dark:border-gray-800 relative overflow-hidden group hover:shadow-large hover:-translate-y-1 active:scale-[0.99] active:shadow-soft transition-all duration-300">
            {/* 装饰背景 */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110" />

            <div className="flex gap-4 relative z-10">
                {/* 宠物头像 */}
                <div className="relative w-24 h-24 flex-shrink-0">
                    {pet.avatar_url ? (
                        <img
                            alt={pet.name}
                            className="w-full h-full object-cover rounded-2xl shadow-sm"
                            src={pet.avatar_url}
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
    );
}
