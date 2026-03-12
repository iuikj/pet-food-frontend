/**
 * 饮食计划数据模型 & 转换函数
 *
 * 后端 Pydantic 模型 → 前端统一格式
 *
 * 后端结构：
 *   WeeklyDietPlan { oder, diet_adjustment_principle, weekly_diet_plan: DailyDietPlan, weekly_special_adjustment_note, suggestions }
 *   DailyDietPlan  { daily_diet_plans: SingleMealPlan[] }
 *   SingleMealPlan { oder, time, food_items: FoodItem[], cook_method }
 *   FoodItem       { name, weight, macro_nutrients: Macronutrients, micro_nutrients: Micronutrients, recommend_reason }
 *   Macronutrients { protein, fat, carbohydrates, dietary_fiber }
 *   Micronutrients { vitamin_a, vitamin_c, vitamin_d, calcium, iron, sodium, potassium, cholesterol, additional_nutrients }
 */

// ── 营养素计算 ──

/**
 * 从 food_items 汇总计算单餐营养素总量
 * @param {Array} foodItems - FoodItem[]
 * @returns {{ totalCalories: number, totalProtein: number, totalFat: number, totalCarbs: number, totalFiber: number }}
 */
export function calcMealNutrition(foodItems) {
  if (!Array.isArray(foodItems) || foodItems.length === 0) {
    return { totalCalories: 0, totalProtein: 0, totalFat: 0, totalCarbs: 0, totalFiber: 0 };
  }

  let totalProtein = 0;
  let totalFat = 0;
  let totalCarbs = 0;
  let totalFiber = 0;

  for (const item of foodItems) {
    const macro = item.macro_nutrients || {};
    totalProtein += macro.protein || 0;
    totalFat += macro.fat || 0;
    totalCarbs += macro.carbohydrates || 0;
    totalFiber += macro.dietary_fiber || 0;
  }

  // 粗算热量: 蛋白质 4 kcal/g + 脂肪 9 kcal/g + 碳水 4 kcal/g
  const totalCalories = Math.round(totalProtein * 4 + totalFat * 9 + totalCarbs * 4);

  return {
    totalCalories,
    totalProtein: round2(totalProtein),
    totalFat: round2(totalFat),
    totalCarbs: round2(totalCarbs),
    totalFiber: round2(totalFiber),
  };
}

/**
 * 从 food_items 提取所有非零微量营养素
 * @param {Array} foodItems - FoodItem[]
 * @returns {Array<{ name: string, value: number, unit: string }>}
 */
export function extractMicronutrients(foodItems) {
  if (!Array.isArray(foodItems)) return [];

  const microMap = {};
  const MICRO_LABELS = {
    vitamin_a: { name: '维生素A', unit: 'mg' },
    vitamin_c: { name: '维生素C', unit: 'mg' },
    vitamin_d: { name: '维生素D', unit: 'mg' },
    calcium: { name: '钙', unit: 'mg' },
    iron: { name: '铁', unit: 'mg' },
    sodium: { name: '钠', unit: 'mg' },
    potassium: { name: '钾', unit: 'mg' },
    cholesterol: { name: '胆固醇', unit: 'mg' },
  };

  for (const item of foodItems) {
    const micro = item.micro_nutrients || {};
    for (const [key, meta] of Object.entries(MICRO_LABELS)) {
      const val = micro[key] || 0;
      if (val > 0) {
        microMap[key] = microMap[key] || { ...meta, value: 0 };
        microMap[key].value += val;
      }
    }
    // additional_nutrients
    const additional = micro.additional_nutrients || {};
    for (const [key, val] of Object.entries(additional)) {
      if (val > 0) {
        microMap[`additional_${key}`] = microMap[`additional_${key}`] || { name: key, unit: 'mg', value: 0 };
        microMap[`additional_${key}`].value += val;
      }
    }
  }

  return Object.values(microMap)
    .filter(m => m.value > 0)
    .map(m => ({ ...m, value: round2(m.value) }));
}

// ── 单餐转换 ──

function transformMeal(singleMealPlan) {
  const foodItems = singleMealPlan.food_items || [];
  const nutrition = calcMealNutrition(foodItems);

  return {
    order: singleMealPlan.oder || 0,
    time: singleMealPlan.time || '',
    cookMethod: singleMealPlan.cook_method || '',
    foodItems, // 保留原始结构
    ...nutrition,
  };
}

// ── 单周转换 ──

function transformWeek(weeklyDietPlan) {
  const dailyPlan = weeklyDietPlan.weekly_diet_plan || {};
  const rawMeals = dailyPlan.daily_diet_plans || [];
  const meals = rawMeals.map(transformMeal);

  // 日汇总 = 所有餐次加总
  const dailyCalories = meals.reduce((s, m) => s + m.totalCalories, 0);
  const dailyProtein = round2(meals.reduce((s, m) => s + m.totalProtein, 0));
  const dailyFat = round2(meals.reduce((s, m) => s + m.totalFat, 0));
  const dailyCarbs = round2(meals.reduce((s, m) => s + m.totalCarbs, 0));

  return {
    week: weeklyDietPlan.oder || 0,
    principle: weeklyDietPlan.diet_adjustment_principle || '',
    specialNote: weeklyDietPlan.weekly_special_adjustment_note || '',
    suggestions: weeklyDietPlan.suggestions || [],
    meals,
    dailyCalories,
    dailyProtein,
    dailyFat,
    dailyCarbs,
  };
}

// ── 核心转换：SSE completed 事件 → 前端统一结果 ──

/**
 * 将 SSE `completed` 事件的 detail.plans 转换为前端统一结果格式
 *
 * @param {Object} detail - completed 事件的 detail 字段, 包含 { plans: WeeklyDietPlan[] }
 * @param {string} [aiSuggestions] - completed 事件的 message 字段或其他 AI 建议来源
 * @returns {{ ai_suggestions: string, weeks: Array }}
 */
export function transformCompletedEventToResult(detail, aiSuggestions) {
  const rawPlans = detail?.plans || [];

  // plans 可能是 Pydantic 序列化后的 dict 数组（JSON 已自动转为 JS 对象）
  const weeks = rawPlans.map(transformWeek);

  // 按周序号排序
  weeks.sort((a, b) => a.week - b.week);

  return {
    ai_suggestions: aiSuggestions || '',
    weeks,
  };
}

/**
 * 将后端 PetDietPlan (完整报告) 转换为前端统一结果格式
 * 用于 REST API 获取结果 / 轮询降级场景
 *
 * @param {Object} petDietPlan - PetDietPlan 完整结构
 * @returns {{ ai_suggestions: string, weeks: Array }}
 */
export function transformPetDietPlan(petDietPlan) {
  if (!petDietPlan) return null;

  const monthlyPlan = petDietPlan.pet_diet_plan || {};
  const rawPlans = monthlyPlan.monthly_diet_plan || [];
  const weeks = rawPlans.map(transformWeek);
  weeks.sort((a, b) => a.week - b.week);

  return {
    ai_suggestions: petDietPlan.ai_suggestions || '',
    weeks,
  };
}

// ── 工具函数 ──

function round2(num) {
  return Math.round(num * 100) / 100;
}
