import React, { useState, useCallback, useEffect, useRef } from 'react';
import MealContext from './MealContextValue';
import { mealsApi } from '../api';
import { usePets } from '../hooks/usePets';
import { calcMealNutrition } from '../models/dietPlan';

/**
 * meal_type -> order (PlanDetails 用 order 选图标)
 */
const MEAL_TYPE_TO_ORDER = { breakfast: 1, lunch: 2, dinner: 3, snack: 4 };

/**
 * 将后端 MealDetail 转为前端 MealCard 格式
 * 同时保留 _raw 供 PlanDetails 悬浮卡片使用
 */
function transformApiMealToCard(apiMeal) {
    const nutritionData = apiMeal.nutrition_data || {};
    const foodItems = apiMeal.food_items || [];
    const macro = nutritionData.macro_nutrients || {};

    // PlanDetails 需要的原始格式
    const nutrition = calcMealNutrition(foodItems);
    const order = MEAL_TYPE_TO_ORDER[apiMeal.type] || 1;

    return {
        id: apiMeal.id,
        type: apiMeal.type,
        name: apiMeal.name || '',
        time: apiMeal.time || '',
        description: apiMeal.description || '',
        calories: apiMeal.calories || 0,
        isCompleted: apiMeal.is_completed || false,
        completedAt: apiMeal.completed_at || null,
        details: {
            ingredients: foodItems.map(item => ({
                name: item.name,
                amount: `${item.weight || ''}g`,
                color: getIngredientColor(item.name),
            })),
            nutrition: {
                fat: `${macro.fat || 0}g`,
                protein: `${macro.protein || 0}g`,
                carbs: `${macro.carbohydrates || macro.carbs || 0}g`,
            },
            aiTip: apiMeal.ai_tip || '',
        },
        // PlanDetails 悬浮卡片所需的原始数据
        _raw: {
            order,
            time: apiMeal.time || '',
            cookMethod: nutritionData.cook_method || '',
            foodItems,
            totalCalories: nutrition.totalCalories,
            totalProtein: nutrition.totalProtein,
            totalFat: nutrition.totalFat,
            totalCarbs: nutrition.totalCarbs,
            totalFiber: nutrition.totalFiber,
        },
    };
}

function getIngredientColor(name = '') {
    if (/肉|鸡|牛|猪|鸭|火鸡|兔/.test(name))
        return 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300';
    if (/鱼|虾|三文|蟹/.test(name))
        return 'bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-300';
    if (/菜|豆|花|菠菜|西兰花/.test(name))
        return 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-300';
    if (/萝卜|南瓜|薯|米|燕麦/.test(name))
        return 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-300';
    return 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300';
}

export function MealProvider({ children }) {
    const { currentPet } = usePets();
    const hasRecipe = currentPet?.has_plan ?? false;

    const [meals, setMeals] = useState([]);
    const [nutritionSummary, setNutritionSummary] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    // 记录上一次请求的 petId，避免竞态
    const lastPetIdRef = useRef(null);

    const fetchTodayMeals = useCallback(async () => {
        if (!currentPet?.id || !hasRecipe) {
            setMeals([]);
            setNutritionSummary(null);
            return;
        }

        const petId = currentPet.id;
        lastPetIdRef.current = petId;
        setIsLoading(true);

        try {
            const res = await mealsApi.getTodayMeals(petId);
            // 避免竞态：如果 pet 已经切换了就丢弃结果
            if (lastPetIdRef.current !== petId) return;

            if (res.code === 0 && res.data) {
                const apiMeals = res.data.meals || [];
                setMeals(apiMeals.map(transformApiMealToCard));
                setNutritionSummary(res.data.nutrition_summary || null);
            } else {
                setMeals([]);
                setNutritionSummary(null);
            }
        } catch (e) {
            console.error('fetchTodayMeals failed:', e);
            if (lastPetIdRef.current === petId) {
                setMeals([]);
                setNutritionSummary(null);
            }
        } finally {
            if (lastPetIdRef.current === petId) {
                setIsLoading(false);
            }
        }
    }, [currentPet?.id, hasRecipe]);

    // currentPet 变化时自动拉取
    useEffect(() => {
        fetchTodayMeals();
    }, [fetchTodayMeals]);

    /**
     * 切换餐食完成状态（乐观更新 + 回滚）
     */
    const toggleMealComplete = useCallback(async (mealId) => {
        const mealIndex = meals.findIndex(m => m.id === mealId);
        if (mealIndex === -1) return;

        const meal = meals[mealIndex];
        const wasCompleted = meal.isCompleted;
        const mealCalories = meal.calories || 0;

        // 快照用于回滚
        const prevMeals = [...meals];
        const prevSummary = nutritionSummary ? { ...nutritionSummary } : null;

        // 乐观更新 meals
        setMeals(prev => prev.map(m =>
            m.id === mealId ? { ...m, isCompleted: !wasCompleted } : m
        ));

        // 乐观更新 nutritionSummary
        if (nutritionSummary) {
            const delta = wasCompleted ? -1 : 1;
            const mealDetails = meal.details?.nutrition || {};
            const mealProtein = parseFloat(mealDetails.protein) || 0;
            const mealFat = parseFloat(mealDetails.fat) || 0;
            const mealCarbs = parseFloat(mealDetails.carbs) || 0;

            setNutritionSummary(prev => ({
                ...prev,
                consumed_calories: (prev.consumed_calories || 0) + mealCalories * delta,
                protein: {
                    ...prev.protein,
                    consumed: Math.max(0, (prev.protein?.consumed || 0) + mealProtein * delta),
                },
                fat: {
                    ...prev.fat,
                    consumed: Math.max(0, (prev.fat?.consumed || 0) + mealFat * delta),
                },
                carbs: {
                    ...prev.carbs,
                    consumed: Math.max(0, (prev.carbs?.consumed || 0) + mealCarbs * delta),
                },
            }));
        }

        // API 调用
        try {
            if (wasCompleted) {
                await mealsApi.uncompleteMeal(mealId);
            } else {
                await mealsApi.completeMeal(mealId);
            }
            // 成功后刷新 nutritionSummary 确保一致性
            try {
                const res = await mealsApi.getTodayMeals(currentPet.id);
                if (res.code === 0 && res.data?.nutrition_summary) {
                    setNutritionSummary(res.data.nutrition_summary);
                }
            } catch {
                // 刷新失败不影响
            }
        } catch (error) {
            console.error('toggleMealComplete failed:', error);
            // 回滚
            setMeals(prevMeals);
            setNutritionSummary(prevSummary);
        }
    }, [meals, nutritionSummary, currentPet?.id]);

    const value = {
        meals,
        nutritionSummary,
        isLoading,
        fetchTodayMeals,
        toggleMealComplete,
    };

    return (
        <MealContext.Provider value={value}>
            {children}
        </MealContext.Provider>
    );
}
