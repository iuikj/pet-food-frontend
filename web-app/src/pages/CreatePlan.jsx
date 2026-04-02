import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import SecureImage from '../components/SecureImage';
import { pageTransitions } from '../utils/animations';
import { usePets } from '../hooks/usePets';
import { formatPetAge } from '../utils/petUtils';
import { mockPets } from '../mock/data/pets';

export default function Home() {
    const navigate = useNavigate();
    const { pets, currentPet, setCurrentPet, isLoading, error } = usePets();
    const [selectedPetId, setSelectedPetId] = useState(null);
    const [requirement, setRequirement] = useState('');
    const [selectedTags, setSelectedTags] = useState([]);

    // 决定使用的宠物列表：真实数据优先，无数据时 fallback 到 mock
    const petList = pets.length > 0 ? pets : (isLoading ? [] : mockPets);

    // 获取当前选中的宠物
    const selectedPet = petList.find(p => p.id === selectedPetId) || null;

    // 初始化选中状态：优先用 currentPet，否则用列表第一个
    useEffect(() => {
        if (!selectedPetId && petList.length > 0) {
            setSelectedPetId(currentPet?.id || petList[0].id);
        }
    }, [petList, currentPet, selectedPetId]);

    const handleSelectPet = (petId) => {
        setSelectedPetId(petId);
    };

    const toggleTag = (tag) => {
        setSelectedTags(prev =>
            prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
        );
    };

    const handleGeneratePlan = async () => {
        // 设置当前宠物到 context
        if (selectedPetId) {
            setCurrentPet(selectedPetId);
        }

        // 导航到loading页面
        navigate('/planning');
    };

    // 宠物类型显示
    const getPetTypeLabel = (type) => type === 'dog' ? '🐶 犬' : '🐱 猫';
    const getGenderLabel = (gender) => {
        if (gender === 'male') return '♂ 公';
        if (gender === 'female') return '♀ 母';
        return '未知';
    };

    return (
        <motion.div
            {...pageTransitions}
            className="pb-32 overflow-x-hidden"
        >
            <header className="px-6 pt-12 pb-4 flex justify-between items-center bg-background-light/90 dark:bg-background-dark/90 backdrop-blur-md sticky top-0 z-40">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-text-muted-light dark:text-text-muted-dark hover:bg-gray-100 dark:hover:bg-surface-dark transition-colors"
                    >
                        <span className="material-icons-round text-lg">arrow_back</span>
                    </button>
                    <h1 className="text-xl font-bold">智能饮食规划</h1>
                </div>
                <div className="flex gap-3">
                    <button className="w-8 h-8 rounded-full flex items-center justify-center text-text-muted-light dark:text-text-muted-dark hover:text-primary transition-colors">
                        <span className="material-icons-round">help_outline</span>
                    </button>
                </div>
            </header>

            <main className="px-6 space-y-8 mt-4">
                {/* === 第1步：选择宠物 === */}
                <section className="mt-6">
                    <div className="flex justify-between items-end mb-6">
                        <div>
                            <h2 className="text-lg font-bold flex items-center gap-2">
                                <span className="bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold">1</span>
                                选择宠物
                            </h2>
                            <p className="text-sm text-text-muted-light dark:text-text-muted-dark mt-1 pl-8">为哪位毛孩子制定计划？</p>
                        </div>
                    </div>

                    {/* 加载状态 */}
                    {isLoading && petList.length === 0 && (
                        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 pt-4 -mx-6 px-6">
                            {[1, 2].map(i => (
                                <div key={i} className="min-w-[140px] bg-white dark:bg-surface-dark p-4 rounded-2xl shadow-soft border border-transparent flex flex-col items-center gap-3 animate-pulse">
                                    <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700" />
                                    <div className="text-center space-y-2">
                                        <div className="w-16 h-4 bg-gray-200 dark:bg-gray-700 rounded" />
                                        <div className="w-12 h-3 bg-gray-100 dark:bg-gray-800 rounded" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* 无宠物空状态 */}
                    {!isLoading && petList.length === 0 && (
                        <div className="bg-white dark:bg-surface-dark p-8 rounded-2xl shadow-soft text-center">
                            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                                <span className="material-icons-round text-primary text-4xl">pets</span>
                            </div>
                            <h3 className="font-bold text-lg mb-2">还没有宠物</h3>
                            <p className="text-sm text-text-muted-light dark:text-text-muted-dark mb-4">
                                添加您的毛孩子，开始制定专属饮食计划
                            </p>
                            <Link
                                to="/onboarding/step1"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:brightness-110 transition-all"
                            >
                                <span className="material-icons-round text-lg">add</span>
                                添加宠物
                            </Link>
                        </div>
                    )}

                    {/* 宠物卡片列表 */}
                    {petList.length > 0 && (
                        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 pt-4 -mx-6 px-6">
                            {petList.map(pet => {
                                const isSelected = pet.id === selectedPetId;
                                return (
                                    <div
                                        key={pet.id}
                                        onClick={() => handleSelectPet(pet.id)}
                                        className={`min-w-[140px] p-4 rounded-2xl relative flex flex-col items-center gap-3 transition-all duration-300 cursor-pointer
                                            ${isSelected
                                                ? 'bg-white dark:bg-surface-dark shadow-medium border-2 border-primary transform scale-105'
                                                : 'bg-white dark:bg-surface-dark shadow-soft border border-transparent opacity-60 hover:opacity-100 hover:shadow-medium hover:scale-105 grayscale'
                                            }`}
                                    >
                                        {/* 头像 */}
                                        <div className={`w-16 h-16 rounded-full p-1 ${isSelected ? 'border-2 border-primary/20' : 'bg-gray-100 dark:bg-gray-800'}`}>
                                            {pet.avatar_url ? (
                                                <SecureImage
                                                    alt={pet.name}
                                                    className="w-full h-full object-cover rounded-full"
                                                    src={pet.avatar_url}
                                                />
                                            ) : (
                                                <div className="w-full h-full rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                                                    {pet.name?.charAt(0) || '🐾'}
                                                </div>
                                            )}
                                        </div>
                                        {/* 名字和品种 */}
                                        <div className="text-center">
                                            <h3 className="font-bold text-text-main-light dark:text-text-main-dark">{pet.name}</h3>
                                            <p className="text-xs text-text-muted-light dark:text-text-muted-dark">{pet.breed || getPetTypeLabel(pet.type)}</p>
                                        </div>
                                    </div>
                                );
                            })}
                            {/* 添加新宠物按钮 */}
                            <div className="min-w-[140px] bg-gray-50 dark:bg-surface-dark/50 p-4 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center gap-2 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 cursor-pointer group">
                                <Link to="/onboarding/step1" className="flex flex-col items-center gap-2 w-full h-full justify-center">
                                    <div className="w-12 h-12 rounded-full bg-white dark:bg-surface-dark flex items-center justify-center text-gray-400 group-hover:text-primary transition-colors shadow-sm">
                                        <span className="material-icons-round">add</span>
                                    </div>
                                    <span className="text-xs font-medium text-text-muted-light group-hover:text-primary">添加新宠物</span>
                                </Link>
                            </div>
                        </div>
                    )}
                </section>

                {/* === 宠物信息展示卡片 === */}
                <AnimatePresence mode="wait">
                    {selectedPet && (
                        <motion.section
                            key={selectedPet.id}
                            initial={{ opacity: 0, y: 20, height: 0 }}
                            animate={{ opacity: 1, y: 0, height: 'auto' }}
                            exit={{ opacity: 0, y: -10, height: 0 }}
                            transition={{ duration: 0.35, ease: 'easeOut' }}
                        >
                            <div className="bg-white dark:bg-surface-dark p-5 rounded-2xl shadow-soft border border-gray-100 dark:border-gray-800 space-y-4">
                                {/* 标题 */}
                                <div className="flex items-center gap-2">
                                    <span className="material-icons-round text-primary text-lg">info</span>
                                    <h3 className="font-bold text-base">{selectedPet.name} 的档案</h3>
                                </div>

                                {/* 基本信息标签 */}
                                <div className="flex flex-wrap gap-2">
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 text-xs font-semibold border border-blue-100 dark:border-blue-900/30">
                                        <span className="material-icons-round text-xs">pets</span>
                                        {getPetTypeLabel(selectedPet.type)}
                                    </span>
                                    {selectedPet.breed && (
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-300 text-xs font-semibold border border-purple-100 dark:border-purple-900/30">
                                            <span className="material-icons-round text-xs">category</span>
                                            {selectedPet.breed}
                                        </span>
                                    )}
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-300 text-xs font-semibold border border-orange-100 dark:border-orange-900/30">
                                        <span className="material-icons-round text-xs">cake</span>
                                        {formatPetAge(selectedPet.age)}
                                    </span>
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-300 text-xs font-semibold border border-green-100 dark:border-green-900/30">
                                        <span className="material-icons-round text-xs">monitor_weight</span>
                                        {selectedPet.weight} kg
                                    </span>
                                    {selectedPet.gender && (
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-300 text-xs font-semibold border border-pink-100 dark:border-pink-900/30">
                                            {getGenderLabel(selectedPet.gender)}
                                        </span>
                                    )}
                                </div>

                                {/* 健康状况 */}
                                {selectedPet.health_status && (
                                    <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20">
                                        <div className="flex items-center gap-2 mb-1.5">
                                            <span className="material-icons-round text-amber-500 text-sm">medical_information</span>
                                            <span className="text-xs font-bold text-amber-700 dark:text-amber-300">健康状况</span>
                                        </div>
                                        <p className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed pl-6">{selectedPet.health_status}</p>
                                    </div>
                                )}

                                {/* 特殊需求 */}
                                {selectedPet.special_requirements && (
                                    <div className="p-3 rounded-xl bg-sky-50 dark:bg-sky-900/10 border border-sky-100 dark:border-sky-900/20">
                                        <div className="flex items-center gap-2 mb-1.5">
                                            <span className="material-icons-round text-sky-500 text-sm">priority_high</span>
                                            <span className="text-xs font-bold text-sky-700 dark:text-sky-300">特殊需求</span>
                                        </div>
                                        <p className="text-xs text-sky-800 dark:text-sky-200 leading-relaxed pl-6">{selectedPet.special_requirements}</p>
                                    </div>
                                )}
                            </div>
                        </motion.section>
                    )}
                </AnimatePresence>

                {/* === 第2步：输入定制需求 === */}
                <section className="opacity-100 transition-opacity duration-500 delay-150">
                    <div className="mb-4">
                        <h2 className="text-lg font-bold flex items-center gap-2">
                            <span className="bg-secondary text-yellow-900 w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold">2</span>
                            输入定制需求
                        </h2>
                        <p className="text-sm text-text-muted-light dark:text-text-muted-dark mt-1 pl-8">描述它的特殊需求或健康目标。</p>
                    </div>
                    <div className="bg-white dark:bg-surface-dark p-5 rounded-3xl shadow-soft hover:shadow-medium transition-all duration-300 space-y-4">
                        <div className="relative">
                            <textarea
                                value={requirement}
                                onChange={(e) => setRequirement(e.target.value)}
                                className="w-full bg-background-light dark:bg-background-dark border-0 rounded-2xl p-4 text-sm min-h-[140px] resize-none focus:ring-2 focus:ring-primary/50 focus:shadow-glow transition-all duration-200 placeholder-text-muted-light/50 dark:placeholder-text-muted-dark/50"
                                placeholder={selectedPet
                                    ? `例如：${selectedPet.name}最近有点超重，我想给它制定一个减肥计划。希望能增加关节保护的营养...`
                                    : '例如：我的宠物最近有点超重，我想给它制定一个减肥计划...'
                                }
                            ></textarea>
                        </div>
                        <div className="space-y-2">
                            <p className="text-xs font-semibold text-text-muted-light dark:text-text-muted-dark uppercase tracking-wide">推荐标签</p>
                            <div className="flex flex-wrap gap-2">
                                {['体重控制', '敏感肠胃', '皮肤护理', '幼宠成长'].map((tag, i) => {
                                    const colors = [
                                        'bg-red-50 text-red-600 border-red-100 dark:bg-red-900/20 dark:text-red-300 dark:border-red-900/30 hover:bg-red-100',
                                        'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-900/30 hover:bg-blue-100',
                                        'bg-green-50 text-green-600 border-green-100 dark:bg-green-900/20 dark:text-green-300 dark:border-green-900/30 hover:bg-green-100',
                                        'bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-900/30 hover:bg-purple-100'
                                    ];
                                    const isActive = selectedTags.includes(tag);
                                    return (
                                        <button
                                            key={tag}
                                            onClick={() => toggleTag(tag)}
                                            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${colors[i]} ${isActive ? 'ring-2 ring-primary/50 scale-105 bg-primary/20 dark:bg-primary/30' : ''}`}
                                        >
                                            {isActive && <span className="material-icons-round text-[10px] mr-0.5 align-middle">check</span>}
                                            {tag}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                </section>

                {/* AI 营养助手提示 - 已移除 */}
            </main>

            <div className="px-6 pb-24 bg-background-light dark:bg-background-dark">
                <button
                    onClick={handleGeneratePlan}
                    disabled={!selectedPetId || petList.length === 0}
                    className={`w-full font-bold text-lg py-4 rounded-2xl flex items-center justify-center gap-2 transition-all duration-200
                        ${selectedPetId && petList.length > 0
                            ? 'bg-primary text-white dark:text-gray-900 shadow-glow hover:shadow-glow-lg hover:brightness-110 active:scale-[0.97]'
                            : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                        }`}
                >
                    <span className="material-icons-round">restaurant_menu</span>
                    生成专属计划
                </button>
            </div>
        </motion.div>
    );
}
