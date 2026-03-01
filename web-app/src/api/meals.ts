/**
 * 饮食记录 API 服务
 */
import apiClient from './client';
import type {
    ApiResponse,
    TodayMealsResponse,
    MealHistoryResponse,
    MealCompleteResponse,
    CompleteMealRequest,
} from './types';

/**
 * 获取今日餐食
 */
export async function getTodayMeals(petId: string): Promise<ApiResponse<TodayMealsResponse>> {
    return apiClient.get<any, ApiResponse<TodayMealsResponse>>('/meals/today', {
        params: { pet_id: petId },
    });
}

/**
 * 获取指定日期餐食
 */
export async function getMealsByDate(petId: string, date: string): Promise<ApiResponse<TodayMealsResponse>> {
    return apiClient.get<any, ApiResponse<TodayMealsResponse>>('/meals/date', {
        params: { pet_id: petId, target_date: date },
    });
}

/**
 * 标记餐食完成
 */
export async function completeMeal(
    mealId: string,
    data?: CompleteMealRequest
): Promise<ApiResponse<MealCompleteResponse>> {
    return apiClient.post<any, ApiResponse<MealCompleteResponse>>(`/meals/${mealId}/complete`, data || {});
}

/**
 * 取消餐食完成标记
 */
export async function uncompleteMeal(mealId: string): Promise<ApiResponse<MealCompleteResponse>> {
    return apiClient.delete<any, ApiResponse<MealCompleteResponse>>(`/meals/${mealId}/complete`);
}

/**
 * 获取餐食历史
 */
export async function getMealHistory(
    petId: string,
    params?: {
        start_date?: string;
        end_date?: string;
        page?: number;
        page_size?: number;
    }
): Promise<ApiResponse<MealHistoryResponse>> {
    return apiClient.get<any, ApiResponse<MealHistoryResponse>>('/meals/history', {
        params: { pet_id: petId, ...params },
    });
}

// 导出所有函数
export const mealsApi = {
    getTodayMeals,
    getMealsByDate,
    completeMeal,
    uncompleteMeal,
    getMealHistory,
};

export default mealsApi;
