/**
 * Meals Mock Handler
 * 与 mealsApi 同名同签名
 */
import type {
  ApiResponse, TodayMealsResponse,
  CompleteMealRequest, MealCompleteResponse, MealHistoryResponse,
} from '../../api/types';
import { getMockTodayMeals } from '../data/meals';
import { mockState } from '../mockState';
import { delay, mockResponse } from '../utils';

/** 根据 mockState 更新餐食完成状态后返回 */
function getTodayMealsWithState(): TodayMealsResponse {
  const data = getMockTodayMeals();
  // 同步 completedMealIds 到每条 meal 的 is_completed
  data.meals = data.meals.map((meal: any) => ({
    ...meal,
    is_completed: mockState.isMealCompleted(meal.id),
    completed_at: mockState.isMealCompleted(meal.id) ? new Date().toISOString() : undefined,
  }));
  // 重新计算已消耗热量
  const consumed = data.meals
    .filter((m: any) => m.is_completed)
    .reduce((sum: number, m: any) => sum + (m.total_calories || 0), 0);
  data.nutrition_summary.consumed_calories = consumed;
  return data;
}

export const mockMealsApi = {
  async getTodayMeals(_petId: string): Promise<ApiResponse<TodayMealsResponse>> {
    await delay();
    return mockResponse(getTodayMealsWithState());
  },

  async getMealsByDate(_petId: string, _date: string): Promise<ApiResponse<TodayMealsResponse>> {
    await delay();
    return mockResponse(getTodayMealsWithState());
  },

  async completeMeal(mealId: string, _data?: CompleteMealRequest): Promise<ApiResponse<MealCompleteResponse>> {
    await delay(150);
    mockState.completeMeal(mealId);
    return mockResponse({
      meal_id: mealId,
      is_completed: true,
      completed_at: new Date().toISOString(),
    });
  },

  async uncompleteMeal(mealId: string): Promise<ApiResponse<MealCompleteResponse>> {
    await delay(150);
    mockState.uncompleteMeal(mealId);
    return mockResponse({
      meal_id: mealId,
      is_completed: false,
      completed_at: undefined,
    });
  },

  async getMealHistory(
    _petId: string,
    _params?: { start_date?: string; end_date?: string; page?: number; page_size?: number }
  ): Promise<ApiResponse<MealHistoryResponse>> {
    await delay();
    return mockResponse({
      total: 0,
      page: 1,
      page_size: 10,
      items: [],
    });
  },
};
