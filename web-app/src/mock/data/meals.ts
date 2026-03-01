/**
 * 餐食 Mock 数据
 *
 * 字段名严格匹配 HomePage.jsx:126-146 的解析逻辑：
 *   meal.meal_type, meal.meal_name, meal.scheduled_time,
 *   meal.foods[].food_name / .amount / .unit,
 *   meal.total_fat, meal.total_protein, meal.total_calories,
 *   meal.is_completed, meal.ai_tip
 */
import type { TodayMealsResponse, NutritionSummary } from '../../api/types';
import { today } from '../utils';

/** 原始餐食数据（API 返回格式，非前端格式化后的） */
export function getMockTodayMeals(): TodayMealsResponse {
  const dateStr = today();

  return {
    date: dateStr,
    meals: [
      {
        id: 'mock-meal-1',
        // 以下字段 HomePage 通过 meal.xxx 直接读取
        meal_type: 'breakfast',
        meal_name: '鳕鱼南瓜营养餐',
        scheduled_time: '08:00',
        description: '富含 Omega-3 的清晨能量餐',
        total_calories: 420,
        is_completed: true, // 默认早餐已完成
        completed_at: `${dateStr}T08:15:00Z`,
        total_fat: 12,
        total_protein: 28,
        foods: [
          { food_name: '鳕鱼', amount: 150, unit: 'g' },
          { food_name: '南瓜', amount: 100, unit: 'g' },
          { food_name: '糙米', amount: 80, unit: 'g' },
          { food_name: '橄榄油', amount: 5, unit: 'ml' },
        ],
        ai_tip: '鳕鱼富含 Omega-3 脂肪酸，有助于 Cooper 的关节保养。南瓜提供丰富膳食纤维。',
      },
      {
        id: 'mock-meal-2',
        meal_type: 'lunch',
        meal_name: '火鸡胡萝卜能量碗',
        scheduled_time: '12:30',
        description: '高蛋白低脂午餐',
        total_calories: 480,
        is_completed: false,
        total_fat: 10,
        total_protein: 35,
        foods: [
          { food_name: '火鸡肉', amount: 180, unit: 'g' },
          { food_name: '胡萝卜', amount: 80, unit: 'g' },
          { food_name: '西兰花', amount: 60, unit: 'g' },
          { food_name: '亚麻籽油', amount: 3, unit: 'ml' },
        ],
        ai_tip: '火鸡肉是优质低脂蛋白来源，搭配胡萝卜补充 β-胡萝卜素，对视力有益。',
      },
      {
        id: 'mock-meal-3',
        meal_type: 'dinner',
        meal_name: '三文鱼糙米晚餐',
        scheduled_time: '18:00',
        description: '均衡营养的晚间餐食',
        total_calories: 450,
        is_completed: false,
        total_fat: 15,
        total_protein: 30,
        foods: [
          { food_name: '三文鱼', amount: 160, unit: 'g' },
          { food_name: '糙米', amount: 70, unit: 'g' },
          { food_name: '菠菜', amount: 50, unit: 'g' },
          { food_name: '鱼油', amount: 2, unit: 'ml' },
        ],
        ai_tip: '三文鱼的 DHA 有助于毛发光泽，菠菜补充铁元素和叶酸。',
      },
    ] as any[], // any 以兼容扩展字段 (meal_type, meal_name 等不在 MealDetail 接口中)
    nutrition_summary: {
      total_calories: 1350,
      consumed_calories: 420,
      protein: { target: 93, consumed: 28 },
      fat: { target: 37, consumed: 12 },
      carbs: { target: 180, consumed: 55 },
    } satisfies NutritionSummary,
  };
}
