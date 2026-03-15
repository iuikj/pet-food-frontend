const FIXED_MICRO_META = {
  vitamin_a: { name: '维生素A', preferredUnit: 'IU', legacyUnit: 'mg' },
  vitamin_c: { name: '维生素C', preferredUnit: 'mg', legacyUnit: 'mg' },
  vitamin_d: { name: '维生素D', preferredUnit: 'IU', legacyUnit: 'mg' },
  calcium: { name: '钙', preferredUnit: 'mg', legacyUnit: 'mg' },
  iron: { name: '铁', preferredUnit: 'mg', legacyUnit: 'mg' },
  sodium: { name: '钠', preferredUnit: 'mg', legacyUnit: 'mg' },
  potassium: { name: '钾', preferredUnit: 'mg', legacyUnit: 'mg' },
  cholesterol: { name: '胆固醇', preferredUnit: 'mg', legacyUnit: 'mg' },
};

const ADDITIONAL_UNIT_HINTS = {
  omega_3: 'g',
  dha: 'g',
  epa: 'g',
  vitamin_e: 'mg',
  zinc: 'mg',
  lutein: 'mg',
  selenium: 'ug',
  probiotics: 'CFU',
};

export function calcMealNutrition(foodItems) {
  if (!Array.isArray(foodItems) || foodItems.length === 0) {
    return { totalCalories: 0, totalProtein: 0, totalFat: 0, totalCarbs: 0, totalFiber: 0 };
  }

  let totalProtein = 0;
  let totalFat = 0;
  let totalCarbs = 0;
  let totalFiber = 0;

  for (const item of foodItems) {
    const macro = item?.macro_nutrients || {};
    totalProtein += toNumber(macro.protein);
    totalFat += toNumber(macro.fat);
    totalCarbs += toNumber(macro.carbohydrates);
    totalFiber += toNumber(macro.dietary_fiber);
  }

  const totalCalories = Math.round(totalProtein * 4 + totalFat * 9 + totalCarbs * 4);

  return {
    totalCalories,
    totalProtein: round2(totalProtein),
    totalFat: round2(totalFat),
    totalCarbs: round2(totalCarbs),
    totalFiber: round2(totalFiber),
  };
}

export function extractMicronutrients(foodItems) {
  if (!Array.isArray(foodItems)) return [];

  const totals = new Map();

  for (const item of foodItems) {
    const micro = item?.micro_nutrients || {};

    for (const [key, meta] of Object.entries(FIXED_MICRO_META)) {
      const normalized = normalizeNutrientAmount(micro[key], {
        preferredUnit: meta.preferredUnit,
        legacyUnit: meta.legacyUnit,
      });
      mergeNutrientAmount(totals, meta.name, normalized);
    }

    const additional = micro.additional_nutrients || {};
    for (const [name, rawValue] of Object.entries(additional)) {
      const normalized = normalizeNutrientAmount(rawValue, {
        preferredUnit: inferAdditionalUnit(name),
        legacyUnit: inferAdditionalUnit(name),
      });
      mergeNutrientAmount(totals, name, normalized);
    }
  }

  return Array.from(totals.values())
    .filter((item) => item.value > 0)
    .map((item) => ({ ...item, value: round2(item.value) }));
}

function transformMeal(singleMealPlan) {
  const foodItems = singleMealPlan?.food_items || [];
  const nutrition = calcMealNutrition(foodItems);

  return {
    order: singleMealPlan?.oder || 0,
    time: singleMealPlan?.time || '',
    cookMethod: singleMealPlan?.cook_method || '',
    foodItems,
    ...nutrition,
  };
}

function transformWeek(weeklyDietPlan) {
  const dailyPlan = weeklyDietPlan?.weekly_diet_plan || {};
  const rawMeals = dailyPlan?.daily_diet_plans || [];
  const meals = rawMeals.map(transformMeal);

  const dailyCalories = meals.reduce((sum, meal) => sum + meal.totalCalories, 0);
  const dailyProtein = round2(meals.reduce((sum, meal) => sum + meal.totalProtein, 0));
  const dailyFat = round2(meals.reduce((sum, meal) => sum + meal.totalFat, 0));
  const dailyCarbs = round2(meals.reduce((sum, meal) => sum + meal.totalCarbs, 0));

  return {
    week: weeklyDietPlan?.oder || 0,
    principle: weeklyDietPlan?.diet_adjustment_principle || '',
    specialNote: weeklyDietPlan?.weekly_special_adjustment_note || '',
    suggestions: weeklyDietPlan?.suggestions || [],
    meals,
    dailyCalories,
    dailyProtein,
    dailyFat,
    dailyCarbs,
  };
}

export function transformCompletedEventToResult(detail, aiSuggestions) {
  const rawPlans = detail?.plans || [];
  const weeks = rawPlans.map(transformWeek).sort((a, b) => a.week - b.week);

  return {
    ai_suggestions: aiSuggestions || '',
    weeks,
  };
}

export function transformPetDietPlan(petDietPlan) {
  if (!petDietPlan) return null;

  const monthlyPlan = petDietPlan?.pet_diet_plan || {};
  const rawPlans = monthlyPlan?.monthly_diet_plan || [];
  const weeks = rawPlans.map(transformWeek).sort((a, b) => a.week - b.week);

  return {
    ai_suggestions: petDietPlan?.ai_suggestions || '',
    weeks,
  };
}

export function deriveTodayMealsFromPlan(planResult, planCreatedAt) {
  const weeks = planResult?.weeks || [];
  if (weeks.length === 0) return { cardMeals: [], rawMeals: [] };

  let currentWeekNumber = 1;
  if (planCreatedAt) {
    const created = new Date(planCreatedAt);
    const now = new Date();
    const diffDays = Math.floor((now - created) / (1000 * 60 * 60 * 24));
    currentWeekNumber = Math.min(Math.floor(diffDays / 7) + 1, weeks.length);
  }

  const targetWeek = weeks.find((week) => week.week === currentWeekNumber) || weeks[0];
  const meals = targetWeek?.meals || [];

  const cardMeals = [];
  const rawMeals = [];

  for (const meal of meals) {
    const foodItems = meal.foodItems || [];
    const cardId = `plan-meal-${targetWeek.week}-${meal.order}`;
    const type = getMealType(meal.order);

    cardMeals.push({
      id: cardId,
      type,
      name: foodItems.length > 0 ? foodItems.map((item) => item.name).join(' + ') : `第${meal.order}餐`,
      time: meal.time || getDefaultMealTime(meal.order),
      description: meal.cookMethod || '',
      calories: meal.totalCalories || 0,
      isCompleted: false,
      details: {
        ingredients: foodItems.map((item) => ({
          name: item.name,
          amount: `${item.weight}g`,
          color: getIngredientColor(item.name),
        })),
        nutrition: {
          fat: `${meal.totalFat || 0}g`,
          protein: `${meal.totalProtein || 0}g`,
        },
        aiTip: foodItems
          .filter((item) => item.recommend_reason)
          .map((item) => `${item.name}: ${item.recommend_reason}`)
          .join('；') || '',
      },
    });

    rawMeals.push({
      ...meal,
      _cardId: cardId,
      _weekNumber: targetWeek.week,
    });
  }

  return { cardMeals, rawMeals };
}

function mergeNutrientAmount(totals, name, normalized) {
  if (normalized.value <= 0) return;

  const key = `${name}__${normalized.unit}`;
  const existing = totals.get(key);
  if (existing) {
    existing.value += normalized.value;
    return;
  }

  totals.set(key, {
    name,
    unit: normalized.unit,
    value: normalized.value,
  });
}

function normalizeNutrientAmount(rawValue, { preferredUnit, legacyUnit }) {
  if (rawValue && typeof rawValue === 'object' && !Array.isArray(rawValue)) {
    return {
      value: toNumber(rawValue.value),
      unit: rawValue.unit || preferredUnit,
    };
  }

  return {
    value: toNumber(rawValue),
    unit: legacyUnit || preferredUnit,
  };
}

function inferAdditionalUnit(name) {
  const normalized = String(name || '').trim().toLowerCase().replace(/[-\s]+/g, '_');
  return ADDITIONAL_UNIT_HINTS[normalized] || 'mg';
}

function round2(num) {
  return Math.round(num * 100) / 100;
}

function toNumber(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function getIngredientColor(name = '') {
  if (/鸡|鸭|火鸡|兔|鱼/.test(name)) return 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300';
  if (/牛|羊|猪/.test(name)) return 'bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-300';
  if (/西兰花|菠菜|南瓜|胡萝卜/.test(name)) return 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-300';
  if (/米|薯|燕麦|藜麦/.test(name)) return 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-300';
  return 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300';
}

function getMealType(order) {
  const map = { 1: 'breakfast', 2: 'lunch', 3: 'dinner' };
  return map[order] || 'snack';
}

function getDefaultMealTime(order) {
  const map = { 1: '08:00', 2: '12:30', 3: '18:00', 4: '15:00' };
  return map[order] || '';
}
