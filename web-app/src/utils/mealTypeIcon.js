/**
 * 餐段图标统一映射 —— 合并原 MealCard 与 PlanDetails 的重复定义。
 *
 * 支持两种索引方式：
 *   - by type：'breakfast' | 'lunch' | 'dinner' | 'snack'
 *   - by order：1 | 2 | 3 | 4（AI 生成的 SingleMealPlan.oder）
 */

const BY_TYPE = {
    breakfast: {
        icon: 'wb_sunny',
        label: '早餐',
        bgColor: 'bg-secondary/30',
        textColor: 'text-yellow-700 dark:text-yellow-200',
    },
    lunch: {
        icon: 'restaurant',
        label: '午餐',
        bgColor: 'bg-accent-blue',
        textColor: 'text-blue-800',
    },
    dinner: {
        icon: 'nights_stay',
        label: '晚餐',
        bgColor: 'bg-purple-100 dark:bg-purple-900/30',
        textColor: 'text-purple-600 dark:text-purple-300',
    },
    snack: {
        icon: 'brunch_dining',
        label: '加餐',
        bgColor: 'bg-primary/15',
        textColor: 'text-primary',
    },
};

const BY_ORDER = {
    1: { ...BY_TYPE.breakfast, color: 'text-secondary-600 dark:text-secondary' },
    2: { ...BY_TYPE.lunch, color: 'text-text-muted-light' },
    3: { ...BY_TYPE.dinner, color: 'text-slate-600 dark:text-slate-300' },
    4: { ...BY_TYPE.snack, color: 'text-primary' },
};

/** 根据类型（早/午/晚/加餐）取配置 */
export function getMealTypeConfig(type) {
    return BY_TYPE[type] || BY_TYPE.lunch;
}

/** 根据第几餐（1..4）取配置，含 color 字段 */
export function getMealOrderConfig(order) {
    return BY_ORDER[order] || BY_ORDER[1];
}

/** 展示用：给定 type，返回 Material Icons Round 图标 ligature 名 */
export function getMealIconName(type) {
    return getMealTypeConfig(type).icon;
}
