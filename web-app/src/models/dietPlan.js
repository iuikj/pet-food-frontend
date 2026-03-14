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

// ── 首页餐食推导 ──

/**
 * 食材名称 → 标签颜色（与 HomePage getIngredientColor 一致）
 */
function getIngredientColor(name) {
  if (name.includes('肉') || name.includes('鸡') || name.includes('牛') || name.includes('猪') || name.includes('火鸡') || name.includes('鸭') || name.includes('羊'))
    return 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300';
  if (name.includes('鱼') || name.includes('虾') || name.includes('三文') || name.includes('鳕'))
    return 'bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-300';
  if (name.includes('菜') || name.includes('豆') || name.includes('花') || name.includes('菠'))
    return 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-300';
  if (name.includes('萝卜') || name.includes('南瓜') || name.includes('薯') || name.includes('蛋'))
    return 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-300';
  return 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300';
}

/**
 * 根据 meal order 映射餐食类型
 */
function getMealType(order) {
  const map = { 1: 'breakfast', 2: 'lunch', 3: 'dinner' };
  return map[order] || 'snack';
}

/**
 * 根据 meal order 映射默认时间
 */
function getDefaultMealTime(order) {
  const map = { 1: '上午 08:00', 2: '下午 12:30', 3: '下午 06:00', 4: '下午 03:00' };
  return map[order] || '';
}

/**
 * 从活跃计划数据推导当前周的餐食，转换为 HomePage MealCard 格式
 *
 * @param {Object} planResult - { ai_suggestions, weeks: [{ week, meals, ... }] }
 * @param {string} [planCreatedAt] - 计划创建时间（ISO 字符串），用于计算当前是第几周
 * @returns {{ cardMeals: Array, rawMeals: Array }}
 *   cardMeals: MealCard 格式数组
 *   rawMeals: 原始 meal 对象（附加 _cardId, _weekNumber），用于点击导航到 PlanDetails
 */
export function deriveTodayMealsFromPlan(planResult, planCreatedAt) {
  const weeks = planResult?.weeks || [];
  if (weeks.length === 0) return { cardMeals: [], rawMeals: [] };

  // 计算当前应该展示第几周
  let currentWeekNumber = 1;
  if (planCreatedAt) {
    const created = new Date(planCreatedAt);
    const now = new Date();
    const diffDays = Math.floor((now - created) / (1000 * 60 * 60 * 24));
    currentWeekNumber = Math.min(Math.floor(diffDays / 7) + 1, weeks.length);
  }

  // 找到对应周（优先按 week 字段匹配，否则取第一周）
  const targetWeek = weeks.find(w => w.week === currentWeekNumber) || weeks[0];
  const meals = targetWeek?.meals || [];

  const cardMeals = [];
  const rawMeals = [];

  for (const meal of meals) {
    const foodItems = meal.foodItems || [];
    const cardId = `plan-meal-${targetWeek.week}-${meal.order}`;
    const type = getMealType(meal.order);

    // MealCard 格式
    cardMeals.push({
      id: cardId,
      type,
      name: foodItems.length > 0
        ? foodItems.map(f => f.name).join(' + ')
        : `第 ${meal.order} 餐`,
      time: meal.time || getDefaultMealTime(meal.order),
      description: meal.cookMethod || '',
      calories: meal.totalCalories || 0,
      isCompleted: false,
      details: {
        ingredients: foodItems.map(fi => ({
          name: fi.name,
          amount: `${fi.weight}g`,
          color: getIngredientColor(fi.name),
        })),
        nutrition: {
          fat: `${meal.totalFat || 0}克脂肪`,
          protein: `${meal.totalProtein || 0}克蛋白质`,
        },
        aiTip: foodItems
          .filter(fi => fi.recommend_reason)
          .map(fi => `${fi.name}: ${fi.recommend_reason}`)
          .join('；') || '',
      },
    });

    // 保留原始 meal 数据（附加元信息），用于导航到 PlanDetails
    rawMeals.push({
      ...meal,
      _cardId: cardId,
      _weekNumber: targetWeek.week,
    });
  }

  return { cardMeals, rawMeals };
}
