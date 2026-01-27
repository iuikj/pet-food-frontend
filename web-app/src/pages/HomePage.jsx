import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { pageTransitions } from '../utils/animations';
import PetSelectorMenu from '../components/PetSelectorMenu';
import MealCard from '../components/MealCard';
import { usePets } from '../context/PetContext';

// 默认餐食数据
const defaultMealsData = [
    {
        id: 'breakfast-1',
        type: 'breakfast',
        name: '早晨干粮混合',
        time: '上午 08:00',
        description: '鸡肉米饭配方',
        calories: 350,
        isCompleted: true,
        details: {
            ingredients: [
                { name: '鸡胸肉', amount: '60g', color: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300' },
                { name: '糙米', amount: '30g', color: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300' },
                { name: '胡萝卜', amount: '15g', color: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-300' }
            ],
            nutrition: { fat: '12克脂肪', protein: '28克蛋白质' },
            aiTip: '早餐提供充足能量，鸡胸肉是优质蛋白来源。'
        }
    },
    {
        id: 'lunch-1',
        type: 'lunch',
        name: '午餐碗',
        time: '下午 12:30',
        description: '三文鱼美味与蒸蔬菜',
        calories: 420,
        isCompleted: false,
        details: {
            ingredients: [
                { name: '三文鱼', amount: '80g', color: 'bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-300' },
                { name: '西兰花', amount: '25g', color: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-300' },
                { name: '红薯', amount: '30g', color: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-300' }
            ],
            nutrition: { fat: '28克脂肪', protein: '32克蛋白质' },
            aiTip: '三文鱼富含Omega-3脂肪酸，有助于维护皮肤和毛发健康。'
        }
    },
    {
        id: 'dinner-1',
        type: 'dinner',
        name: '晚间盛宴',
        time: '下午 06:00',
        description: '火鸡炖菜',
        calories: 410,
        isCompleted: false,
        details: {
            ingredients: [
                { name: '火鸡肉', amount: '90g', color: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300' },
                { name: '南瓜', amount: '30g', color: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-300' },
                { name: '青豆', amount: '15g', color: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-300' }
            ],
            nutrition: { fat: '18克脂肪', protein: '35克蛋白质' },
            aiTip: '火鸡肉是低脂高蛋白的理想选择，适合控制体重。'
        }
    }
];

export default function HomePage() {
    const [isPetMenuOpen, setIsPetMenuOpen] = useState(false);
    const { pets, currentPet, setCurrentPet } = usePets();

    // 餐食数据状态
    const [mealsData, setMealsData] = useState(defaultMealsData);
    // 当前展开的卡片ID
    const [expandedMealId, setExpandedMealId] = useState(null);

    // 状态判断
    const hasPets = pets.length > 0;
    const hasRecipe = currentPet?.hasPlan ?? false;

    const handlePetSelect = (pet) => {
        setCurrentPet(pet.id);
    };

    // 切换卡片展开状态
    const handleToggleExpand = (mealId) => {
        setExpandedMealId(prev => prev === mealId ? null : mealId);
    };

    // 切换餐食完成状态
    const handleToggleMealComplete = (mealId) => {
        setMealsData(prev => prev.map(meal =>
            meal.id === mealId
                ? { ...meal, isCompleted: !meal.isCompleted }
                : meal
        ));
    };

    // 渲染 Header（根据是否有宠物显示不同内容）
    const renderHeader = () => (
        <header className="px-6 pt-12 pb-4 flex justify-between items-center bg-background-light/90 dark:bg-background-dark/90 backdrop-blur-md sticky top-0 z-50">
            <div className="flex items-center gap-3">
                <div className="relative">
                    {hasPets && currentPet ? (
                        <button onClick={() => setIsPetMenuOpen(true)}>
                            {currentPet.avatar ? (
                                <img
                                    alt={currentPet.name}
                                    className="w-12 h-12 rounded-full object-cover border-2 border-white dark:border-surface-dark shadow-sm"
                                    src={currentPet.avatar}
                                />
                            ) : (
                                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-lg border-2 border-white dark:border-surface-dark shadow-sm">
                                    {currentPet.name.charAt(0)}
                                </div>
                            )}
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-surface-dark"></div>
                        </button>
                    ) : (
                        <button
                            onClick={() => setIsPetMenuOpen(true)}
                            className="w-12 h-12 rounded-full bg-gray-100 dark:bg-surface-dark border-2 border-dashed border-primary/50 flex items-center justify-center text-primary shadow-sm hover:bg-primary hover:text-white transition-all"
                        >
                            <span className="material-icons-round">add</span>
                        </button>
                    )}
                </div>
                <div>
                    <p className="text-xs text-text-muted-light dark:text-text-muted-dark font-medium uppercase tracking-wider">
                        {hasPets ? '计划用于' : '欢迎使用'}
                    </p>
                    <button
                        onClick={() => setIsPetMenuOpen(true)}
                        className="text-xl font-bold flex items-center gap-1 hover:text-primary transition-colors"
                    >
                        {currentPet ? currentPet.name : '选择宠物'}
                        {hasPets && <span className="material-icons-round text-primary text-sm">pets</span>}
                        {!hasPets && <span className="material-icons-round text-primary text-sm">arrow_forward_ios</span>}
                    </button>
                </div>
            </div>
            <div className="flex gap-3">
                <button className="w-10 h-10 rounded-full bg-white dark:bg-surface-dark shadow-sm flex items-center justify-center text-text-muted-light dark:text-text-muted-dark hover:text-primary transition-colors">
                    <span className="material-icons-round">search</span>
                </button>
                <button className="w-10 h-10 rounded-full bg-white dark:bg-surface-dark shadow-sm flex items-center justify-center text-text-muted-light dark:text-text-muted-dark hover:text-primary transition-colors relative">
                    <span className="material-icons-round">notifications_none</span>
                    <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-400 rounded-full"></span>
                </button>
            </div>
        </header>
    );

    // 日历展开状态
    const [isCalendarExpanded, setIsCalendarExpanded] = useState(false);

    // 获取四周的日期数据（以当前周为第一周）
    const getWeeksData = () => {
        const today = new Date();
        const currentDay = today.getDay(); // 0=周日, 1=周一...
        const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
        const thisMonday = new Date(today);
        thisMonday.setDate(today.getDate() + mondayOffset);

        const weeks = [];
        const weekColors = [
            { bg: 'bg-primary/20', border: 'border-primary/30', text: 'text-primary', label: '第一周' },
            { bg: 'bg-secondary/20', border: 'border-secondary/30', text: 'text-yellow-700 dark:text-yellow-300', label: '第二周' },
            { bg: 'bg-accent-blue/20', border: 'border-accent-blue/30', text: 'text-blue-700 dark:text-blue-300', label: '第三周' },
            { bg: 'bg-purple-100 dark:bg-purple-900/20', border: 'border-purple-300', text: 'text-purple-700 dark:text-purple-300', label: '第四周' }
        ];

        for (let w = 0; w < 4; w++) {
            const weekStart = new Date(thisMonday);
            weekStart.setDate(thisMonday.getDate() + w * 7);

            const days = [];
            for (let d = 0; d < 7; d++) {
                const date = new Date(weekStart);
                date.setDate(weekStart.getDate() + d);
                days.push({
                    date: date.getDate(),
                    month: date.getMonth() + 1,
                    isToday: date.toDateString() === today.toDateString(),
                    fullDate: date
                });
            }
            weeks.push({
                ...weekColors[w],
                days,
                startDate: `${weekStart.getMonth() + 1}/${weekStart.getDate()}`,
                endDate: `${days[6].month}/${days[6].date}`
            });
        }
        return weeks;
    };

    const weeksData = getWeeksData();
    const weekDayLabels = ['一', '二', '三', '四', '五', '六', '日'];

    // 渲染周历
    const renderWeekCalendar = () => (
        <section>
            <div className="flex justify-between items-end mb-4">
                <div>
                    <h2 className="text-2xl font-bold">本周</h2>
                    <p className="text-sm text-text-muted-light dark:text-text-muted-dark">
                        AI计划： <span className="text-primary font-semibold">{hasRecipe ? '体重管理' : '待创建'}</span>
                    </p>
                </div>
                <button
                    onClick={() => setIsCalendarExpanded(!isCalendarExpanded)}
                    className="text-sm text-primary font-medium hover:opacity-80 transition-opacity flex items-center gap-1"
                >
                    日历
                    <motion.span
                        className="material-icons-round text-sm"
                        animate={{ rotate: isCalendarExpanded ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        expand_more
                    </motion.span>
                </button>
            </div>

            {/* 简略周视图（默认显示） */}
            {!isCalendarExpanded && (
                <div className="flex justify-between items-center bg-white dark:bg-surface-dark p-4 rounded-2xl shadow-soft">
                    {weeksData[0].days.slice(0, 5).map((day, idx) => (
                        <div key={idx} className={`flex flex-col items-center gap-1 ${!day.isToday && idx < 2 ? 'opacity-40' : ''} ${day.isToday ? 'transform scale-110' : ''}`}>
                            <span className={`text-xs font-${day.isToday ? 'bold text-primary' : 'medium text-text-muted-light dark:text-text-muted-dark'}`}>
                                {weekDayLabels[idx]}
                            </span>
                            <div className={`${day.isToday
                                ? 'w-10 h-10 rounded-full bg-primary text-white dark:text-gray-900 flex items-center justify-center text-base font-bold shadow-glow relative'
                                : 'w-8 h-8 rounded-full bg-background-light dark:bg-background-dark flex items-center justify-center text-sm font-medium'}`}
                            >
                                {day.date}
                                {day.isToday && <div className="absolute -bottom-1.5 w-1 h-1 bg-current rounded-full"></div>}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* 展开的四周日历视图 */}
            <motion.div
                initial={false}
                animate={{
                    height: isCalendarExpanded ? 'auto' : 0,
                    opacity: isCalendarExpanded ? 1 : 0
                }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="overflow-hidden"
            >
                <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-soft p-4 space-y-3">
                    {/* 星期标题行 */}
                    <div className="grid grid-cols-8 gap-1 mb-2">
                        <div className="text-xs font-medium text-text-muted-light dark:text-text-muted-dark text-center"></div>
                        {weekDayLabels.map((label, idx) => (
                            <div key={idx} className="text-xs font-medium text-text-muted-light dark:text-text-muted-dark text-center">
                                {label}
                            </div>
                        ))}
                    </div>

                    {/* 四周日期 */}
                    {weeksData.map((week, weekIdx) => (
                        <div
                            key={weekIdx}
                            className={`grid grid-cols-8 gap-1 p-2 rounded-xl ${week.bg} ${week.border} border transition-all duration-200 hover:shadow-soft`}
                        >
                            {/* 周标签 */}
                            <div className={`flex flex-col justify-center items-center text-center ${week.text}`}>
                                <span className="text-[10px] font-bold leading-tight">{week.label}</span>
                                <span className="text-[8px] opacity-70">{week.startDate}</span>
                            </div>

                            {/* 日期格子 */}
                            {week.days.map((day, dayIdx) => (
                                <div
                                    key={dayIdx}
                                    className={`aspect-square rounded-lg flex items-center justify-center text-sm font-medium transition-all duration-200
                                        ${day.isToday
                                            ? 'bg-primary text-white dark:text-gray-900 shadow-glow font-bold'
                                            : 'hover:bg-white/50 dark:hover:bg-white/10'}`}
                                >
                                    {day.date}
                                </div>
                            ))}
                        </div>
                    ))}

                    {/* 图例说明 */}
                    <div className="flex flex-wrap gap-3 pt-2 border-t border-gray-100 dark:border-gray-800">
                        {weeksData.map((week, idx) => (
                            <div key={idx} className="flex items-center gap-1.5">
                                <div className={`w-3 h-3 rounded ${week.bg} ${week.border} border`}></div>
                                <span className={`text-xs font-medium ${week.text}`}>{week.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </motion.div>
        </section>
    );

    // 渲染：无宠物引导卡片
    const renderNoPetCard = () => (
        <section className="bg-primary/20 dark:bg-primary/10 rounded-3xl p-6 relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-secondary/30 rounded-full blur-2xl"></div>
            <div className="relative z-10 flex flex-col items-center text-center py-4">
                <div className="w-16 h-16 rounded-full bg-white/60 dark:bg-white/10 backdrop-blur-sm flex items-center justify-center mb-4 shadow-sm text-primary">
                    <span className="material-icons-round text-3xl">pets</span>
                </div>
                <h3 className="font-bold text-xl mb-2">创建您的第一个宠物档案</h3>
                <p className="text-sm text-text-muted-light dark:text-text-muted-dark opacity-80 mb-6 max-w-[240px]">
                    添加您的爱宠信息，为它量身定制专属的科学营养计划。
                </p>
                <Link to="/onboarding/step1" className="bg-primary text-white dark:text-gray-900 font-bold py-3 px-8 rounded-xl shadow-glow hover:shadow-glow-lg hover:brightness-110 hover:-translate-y-0.5 active:scale-[0.97] transition-all duration-200 flex items-center gap-2">
                    <span className="material-icons-round text-lg">add</span>
                    立即添加
                </Link>
            </div>
        </section>
    );

    // 渲染：无食谱引导卡片
    const renderNoRecipeCard = () => (
        <section>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                今日餐食
            </h3>
            <div className="bg-white dark:bg-surface-dark p-6 rounded-2xl shadow-soft border-2 border-dashed border-gray-200 dark:border-gray-700 flex flex-col items-center text-center gap-3 py-8 hover:border-primary/30 hover:bg-primary/5 transition-all duration-300">
                <div className="w-12 h-12 rounded-full bg-secondary/30 flex items-center justify-center text-yellow-700 dark:text-yellow-200 mb-1">
                    <span className="material-icons-round text-2xl">restaurant_menu</span>
                </div>
                <h4 className="font-bold text-lg">开始智能饮食规划</h4>
                <p className="text-sm text-text-muted-light dark:text-text-muted-dark px-4 mb-2">
                    还没有饮食计划？让AI助手帮您生成完美的每日食谱。
                </p>
                <Link to="/plan/create" className="text-primary font-bold text-sm flex items-center gap-1 hover:underline group">
                    开启规划 <span className="material-icons-round text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
                </Link>
            </div>
        </section>
    );

    // 渲染：锁定功能卡片（无宠物/无食谱时显示）
    const renderLockedCards = () => (
        <section className="grid grid-cols-2 gap-4">
            <div className="bg-accent-blue/20 dark:bg-accent-blue/10 p-5 rounded-2xl flex flex-col justify-center items-center h-36 relative overflow-hidden text-center hover:shadow-soft transition-all duration-300">
                <span className="material-icons-round text-4xl text-accent-blue/70 mb-2">lock</span>
                <h4 className="font-bold text-blue-900/60 dark:text-blue-100/60 mb-1">饮水量</h4>
                <p className="text-xs text-blue-800/50 dark:text-blue-200/50 font-medium px-2">记录宠物数据以解锁更多功能</p>
            </div>
            <div className="bg-secondary/20 dark:bg-secondary/10 p-5 rounded-2xl flex flex-col justify-center items-center h-36 relative overflow-hidden text-center hover:shadow-soft transition-all duration-300">
                <span className="material-icons-round text-4xl text-secondary/70 mb-2">lock</span>
                <h4 className="font-bold text-yellow-900/60 dark:text-yellow-100/60 mb-1">当前体重</h4>
                <p className="text-xs text-yellow-800/50 dark:text-yellow-200/50 font-medium px-2">记录宠物数据以解锁更多功能</p>
            </div>
        </section>
    );

    // 渲染：每日营养进度（有食谱时显示）
    const renderNutritionProgress = () => (
        <section className="bg-primary/20 dark:bg-primary/10 rounded-3xl p-6 relative overflow-hidden shadow-soft hover:shadow-medium transition-all duration-300">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-secondary/30 rounded-full blur-2xl"></div>
            <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h3 className="font-bold text-lg">每日营养</h3>
                        <p className="text-sm opacity-70">已完成每日目标的85%</p>
                    </div>
                    <div className="bg-white/50 dark:bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                        AI优化中
                    </div>
                </div>
                <div className="flex items-center gap-6">
                    <div className="relative w-32 h-32 flex-shrink-0">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                            <circle className="text-white/40 dark:text-white/10" cx="50" cy="50" fill="transparent" r="40" stroke="currentColor" strokeWidth="8"></circle>
                            <circle cx="50" cy="50" fill="transparent" r="40" stroke="#A3D9A5" strokeDasharray="251.2" strokeDashoffset="37" strokeLinecap="round" strokeWidth="8"></circle>
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                            <span className="text-3xl font-bold leading-none">850</span>
                            <span className="text-[10px] uppercase font-medium tracking-wide opacity-70">剩余卡路里</span>
                        </div>
                    </div>
                    <div className="flex-1 space-y-4">
                        <div>
                            <div className="flex justify-between text-xs mb-1 font-medium">
                                <span>蛋白质</span>
                                <span>32g / 45g</span>
                            </div>
                            <div className="h-2 w-full bg-white/40 dark:bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full bg-green-600 w-[70%] rounded-full"></div>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between text-xs mb-1 font-medium">
                                <span>脂肪</span>
                                <span>12g / 18g</span>
                            </div>
                            <div className="h-2 w-full bg-white/40 dark:bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full bg-yellow-500 w-[65%] rounded-full"></div>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between text-xs mb-1 font-medium">
                                <span>碳水化合物</span>
                                <span>40g / 50g</span>
                            </div>
                            <div className="h-2 w-full bg-white/40 dark:bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-400 w-[80%] rounded-full"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );

    // 计算已完成餐食数量
    const completedMealsCount = mealsData.filter(m => m.isCompleted).length;

    // 渲染：今日餐食列表（有食谱时显示）
    const renderMealsList = () => (
        <section>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                今日餐食
                <span className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded text-text-muted-light dark:text-text-muted-dark font-normal">
                    已完成 {completedMealsCount}/{mealsData.length} 餐
                </span>
            </h3>
            <div className="space-y-4">
                {mealsData.map(meal => (
                    <MealCard
                        key={meal.id}
                        meal={meal}
                        isExpanded={expandedMealId === meal.id}
                        onToggleExpand={handleToggleExpand}
                        onToggleComplete={handleToggleMealComplete}
                    />
                ))}
            </div>
        </section>
    );

    // 渲染：已解锁功能卡片（有食谱时显示）
    const renderUnlockedCards = () => (
        <section className="grid grid-cols-2 gap-4">
            <div className="bg-accent-blue/30 dark:bg-accent-blue/10 p-5 rounded-2xl flex flex-col justify-between h-36 relative overflow-hidden hover:shadow-medium hover:scale-105 transition-all duration-300">
                <span className="material-icons-round absolute -right-2 -bottom-4 text-6xl text-accent-blue opacity-50">water_drop</span>
                <div>
                    <h4 className="font-bold text-blue-900 dark:text-blue-100">饮水量</h4>
                    <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">目标：800毫升</p>
                </div>
                <div className="flex items-end gap-1 mt-auto">
                    <span className="text-2xl font-bold text-blue-900 dark:text-blue-100">550</span>
                    <span className="text-sm font-medium mb-1 text-blue-700 dark:text-blue-300">毫升</span>
                </div>
            </div>
            <div className="bg-secondary/30 dark:bg-secondary/10 p-5 rounded-2xl flex flex-col justify-between h-36 relative overflow-hidden hover:shadow-medium hover:scale-105 transition-all duration-300">
                <span className="material-icons-round absolute -right-2 -bottom-4 text-6xl text-secondary opacity-50">monitor_weight</span>
                <div>
                    <h4 className="font-bold text-yellow-900 dark:text-yellow-100">当前体重</h4>
                    <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">上次：2天前</p>
                </div>
                <div className="flex items-end gap-1 mt-auto">
                    <span className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">12.4</span>
                    <span className="text-sm font-medium mb-1 text-yellow-700 dark:text-yellow-300">公斤</span>
                </div>
            </div>
        </section>
    );

    return (
        <motion.div
            {...pageTransitions}
            className="pb-24"
        >
            {renderHeader()}

            <main className="px-6 space-y-8">
                {renderWeekCalendar()}

                {/* 根据状态条件渲染不同内容 */}
                {!hasPets ? (
                    <>
                        {/* 无宠物状态 */}
                        {renderNoPetCard()}
                        {renderNoRecipeCard()}
                        {renderLockedCards()}
                    </>
                ) : !hasRecipe ? (
                    <>
                        {/* 有宠物但无食谱状态 */}
                        {renderNoRecipeCard()}
                        {renderLockedCards()}
                    </>
                ) : (
                    <>
                        {/* 有宠物且有食谱状态 - 完整仪表板 */}
                        {renderNutritionProgress()}
                        {renderMealsList()}
                        {renderUnlockedCards()}
                    </>
                )}
            </main>

            {/* 宠物选择菜单 */}
            <PetSelectorMenu
                isOpen={isPetMenuOpen}
                onClose={() => setIsPetMenuOpen(false)}
                onSelectPet={handlePetSelect}
            />
        </motion.div>
    );
}
